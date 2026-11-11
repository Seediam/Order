import { isBundledArt } from '../shared/order-assets';
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { hash, compare } from "bcryptjs";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { parse, serialize } from "cookie";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import multer from "multer";
import sharp from "sharp";
import { mkdir, readFile, unlink, stat } from "node:fs/promises";
import path from "node:path";
import { z, ZodError } from "zod";
import type {
  Action,
  CampaignState,
  User,
  ServerEvents,
  ClientEvents,
} from "../shared/types";
import { applyAction, log, cardSchema } from "./actions";
import { demoState, requireRule, RuleError, newCharacter, migrateCards } from "./rules";
import { viewFor } from "./view";
import { discordIntegration, type DiscordOptions } from "./discord";
export interface AppOptions {
  databaseUrl: string;
  dataDir: string;
  setupCode: string;
  secureCookie?: boolean;
  testing?: boolean;
  discord?: DiscordOptions;
}
const safeUser = (u: {
  id: string;
  username: string;
  displayName: string;
  role: string;
  avatar: string;
}): User => ({
  id: u.id,
  username: u.username,
  displayName: u.displayName,
  role: u.role as User["role"],
  avatar: u.avatar,
});
const sameOrigin = (origin: string | undefined, host: string | undefined) => {
  if (!origin) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
};
const digest = (s: string) => createHash("sha256").update(s).digest("hex");
const assetUrl = z
  .string()
  .max(150)
  .refine((v) => !v || isBundledArt(v) || /^\/media\/[a-zA-Z0-9-]+$/.test(v));
export async function createApplication(options: AppOptions) {
  const prisma = new PrismaClient({
    datasources: { db: { url: options.databaseUrl } },
  });
  await prisma.$connect();
  const discord = discordIntegration(prisma, options.discord);
  const mediaDir = path.resolve(options.dataDir, "uploads");
  await mkdir(mediaDir, { recursive: true });
  if (!(await prisma.setting.findUnique({ where: { key: "setupHash" } })))
    await prisma.setting.create({
      data: { key: "setupHash", value: await hash(options.setupCode, 12) },
    });
  const app = express(),
    http = createServer(app);
  app.disable("x-powered-by");
  app.use(
    helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use((req, res, next) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.headers.origin;
      if (
        !sameOrigin(origin, req.headers.host) ||
        req.headers["sec-fetch-site"] === "cross-site"
      ) {
        res.status(403).json({ error: "Origem não autorizada." });
        return;
      }
    }
    next();
  });
  app.use(
    "/api",
    rateLimit({
      windowMs: 60_000,
      limit: options.testing ? 10000 : 600,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  const authLimit = rateLimit({
    windowMs: 15 * 60_000,
    limit: options.testing ? 10000 : 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Muitas tentativas. Aguarde 15 minutos." },
  });
  async function authenticate(cookieHeader: string | undefined) {
    const token = parse(cookieHeader || "").order_session;
    if (!token) return null;
    const session = await prisma.authSession.findUnique({
      where: { id: digest(token) },
      include: { user: true },
    });
    return session && session.expiresAt > new Date()
      ? safeUser(session.user)
      : null;
  }
  const auth = async (req: Request, res: Response, next: NextFunction) => {
    const user = await authenticate(req.headers.cookie);
    if (!user) {
      res.status(401).json({ error: "Entre com suas credenciais." });
      return;
    }
    res.locals.user = user;
    next();
  };
  const io = new Server<ClientEvents, ServerEvents>(http, {
    maxHttpBufferSize: 2e6,
    allowRequest: (req, cb) => {
      const origin = req.headers.origin;
      cb(null, sameOrigin(origin, req.headers.host));
    },
  });
  const queues = new Map<string, Promise<unknown>>(),
    undo = new Map<string, string[]>(),
    redo = new Map<string, string[]>();
  async function serialized<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const prev = queues.get(key) || Promise.resolve();
    const next = prev.catch(() => {}).then(fn);
    queues.set(key, next);
    try {
      return await next;
    } finally {
      if (queues.get(key) === next) queues.delete(key);
    }
  }
  const online = (id: string) => [
    ...new Set(
      [...io.sockets.sockets.values()]
        .filter((s) => s.rooms.has(id))
        .map((s) => s.data.user.id as string),
    ),
  ];
  async function campaign(id: string, user: User) {
    const c = await prisma.campaign.findUnique({
      where: { id },
      include: { members: true },
    });
    requireRule(c, "Campanha não encontrada.");
    requireRule(
      c.ownerId === user.id || c.members.some((m) => m.userId === user.id),
      "Entre na campanha para acessar seus dados.",
    );
    return c;
  }
  function makeView(
    c: {
      id: string;
      name: string;
      description: string;
      banner: string;
      ownerId: string;
      state: string;
      revision: number;
    },
    user: User,
  ) {
    return {
      ...viewFor(withCards(JSON.parse(c.state)), user, c.ownerId),
      id: c.id,
      name: c.name,
      description: c.description,
      banner: c.banner,
      ownerId: c.ownerId,
      revision: c.revision,
      online: online(c.id),
    };
  }
  function withCards(s: CampaignState) {
    migrateCards(s);
    return s;
  }
  async function publish(id: string) {
    const c = await prisma.campaign.findUnique({ where: { id } });
    if (!c) return;
    discord.queue(c);
    for (const socket of io.sockets.sockets.values())
      if (socket.rooms.has(id))
        socket.emit("campaign:state", makeView(c, socket.data.user));
  }
  async function mutate(id: string, user: User, action: Action) {
    await serialized(id, async () => {
      const c = await campaign(id, user),
        s: CampaignState = withCards(JSON.parse(c.state));
      if (action.type === "admin:undo" || action.type === "admin:redo") {
        requireRule(user.id === c.ownerId, "Somente o Mestre pode desfazer.");
        const source = action.type === "admin:undo" ? undo : redo,
          destination = action.type === "admin:undo" ? redo : undo;
        const history = source.get(id) || [];
        requireRule(
          history.length,
          "Nenhuma edição administrativa disponível. Ações de jogo encerram o histórico de edição.",
        );
        const previous = history.pop()!;
        const future = destination.get(id) || [];
        future.push(c.state);
        destination.set(id, future.slice(-20));
        const restored = JSON.parse(previous) as CampaignState;
        log(
          restored,
          action.type === "admin:undo"
            ? "Edição administrativa desfeita."
            : "Edição administrativa refeita.",
          "audit",
          user.displayName,
        );
        await prisma.campaign.update({
          where: { id },
          data: { state: JSON.stringify(restored), revision: { increment: 1 } },
        });
        return;
      }

      applyAction(s, user, c.ownerId, action);
      if (
        user.id === c.ownerId &&
        [
          "scene:update",
          "character:resources",
          "card:save",
          "campaign:settings",
        ].includes(action.type)
      ) {
        const history = undo.get(id) || [];
        history.push(c.state);
        undo.set(id, history.slice(-20));
        redo.delete(id);
      } else {
        undo.delete(id);
        redo.delete(id);
      }
      await prisma.campaign.update({
        where: { id },
        data: { state: JSON.stringify(s), revision: { increment: 1 } },
      });
    });
    await publish(id);
  }
  async function setSession(res: Response, userId: string) {
    const token = randomBytes(32).toString("base64url");
    const days = Math.min(
      30,
      Math.max(1, Number(process.env.SESSION_DAYS) || 7),
    );
    await prisma.authSession.create({
      data: {
        id: digest(token),
        userId,
        expiresAt: new Date(Date.now() + days * 864e5),
      },
    });
    res.setHeader(
      "Set-Cookie",
      serialize("order_session", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: !!options.secureCookie,
        path: "/",
        maxAge: days * 86400,
      }),
    );
  }
  app.get("/api/health", (_req, res) =>
    res.json({ ok: true, name: "ORDER", version: "0.1.0" }),
  );
  app.get("/api/auth/me", auth, (_req, res) => res.json(res.locals.user));
  app.post("/api/auth/register", authLimit, async (req, res) => {
    const p = z
      .object({
        username: z
          .string()
          .trim()
          .toLowerCase()
          .regex(/^[a-z0-9_]{3,30}$/),
        displayName: z.string().trim().min(2).max(50),
        password: z
          .string()
          .min(10)
          .max(100)
          .regex(/[a-zA-Z]/)
          .regex(/[0-9]/),
        role: z.enum(["MASTER", "PLAYER"]),
        setupCode: z.string().max(100).optional(),
      })
      .parse(req.body);
    await serialized("registration", async () => {
      if (p.role === "MASTER") {
        const setup = await prisma.setting.findUnique({
          where: { key: "setupHash" },
        });
        requireRule(
          setup?.value && (await compare(p.setupCode || "", setup.value)),
          "Código de cadastro de Mestre inválido ou desativado.",
        );
      }
      requireRule(
        !(await prisma.user.findUnique({ where: { username: p.username } })),
        "Nome de usuário indisponível.",
      );
      const u = await prisma.user.create({
        data: {
          username: p.username,
          displayName: p.displayName,
          passwordHash: await hash(p.password, 12),
          role: p.role,
        },
      });
      await setSession(res, u.id);
      res.status(201).json(safeUser(u));
    });
  });
  app.post("/api/auth/login", authLimit, async (req, res) => {
    const p = z
      .object({
        username: z
          .string()
          .max(30)
          .transform((s) => s.toLowerCase()),
        password: z.string().max(100),
      })
      .parse(req.body);
    const u = await prisma.user.findUnique({ where: { username: p.username } });
    if (!u || !(await compare(p.password, u.passwordHash))) {
      res.status(401).json({ error: "Credenciais inválidas." });
      return;
    }
    await setSession(res, u.id);
    res.json(safeUser(u));
  });
  app.post("/api/auth/logout", auth, async (req, res) => {
    const token = parse(req.headers.cookie || "").order_session;
    if (token)
      await prisma.authSession.deleteMany({ where: { id: digest(token) } });
    for (const s of io.sockets.sockets.values())
      if (s.data.user.id === res.locals.user.id) s.disconnect(true);
    res.setHeader(
      "Set-Cookie",
      serialize("order_session", "", {
        httpOnly: true,
        sameSite: "lax",
        secure: !!options.secureCookie,
        path: "/",
        maxAge: 0,
      }),
    );
    res.json({ ok: true });
  });
  app.put("/api/auth/profile", auth, async (req, res) => {
    const p = z
      .object({ displayName: z.string().min(2).max(50), avatar: assetUrl })
      .parse(req.body);
    if (p.avatar) {
      const asset = await prisma.asset.findUnique({
        where: { id: p.avatar.split("/")[2] },
      });
      requireRule(
        asset &&
          asset.ownerId === res.locals.user.id &&
          asset.mime.startsWith("image/"),
        "Avatar inválido.",
      );
    }
    const u = await prisma.user.update({
      where: { id: res.locals.user.id },
      data: p,
    });
    res.json(safeUser(u));
  });
  app.get("/api/settings", auth, async (_req, res) => {
    requireRule(res.locals.user.role === "MASTER", "Somente Mestres.");
    const s = await prisma.setting.findUnique({ where: { key: "setupHash" } });
    res.json({ registrationEnabled: !!s?.value });
  });
  app.put("/api/settings", auth, async (req, res) => {
    requireRule(res.locals.user.role === "MASTER", "Somente Mestres.");
    const p = z
      .object({
        code: z.string().min(4).max(100).optional(),
        enabled: z.boolean(),
      })
      .parse(req.body);
    requireRule(!p.enabled || p.code, "Informe um novo código para ativar.");
    await prisma.setting.upsert({
      where: { key: "setupHash" },
      create: {
        key: "setupHash",
        value: p.enabled ? await hash(p.code!, 12) : "",
      },
      update: { value: p.enabled ? await hash(p.code!, 12) : "" },
    });
    res.json({ ok: true });
  });
  app.get("/api/campaigns", auth, async (_req, res) => {
    const u: User = res.locals.user;
    const all = await prisma.campaign.findMany({
      include: { members: true },
      orderBy: { updatedAt: "desc" },
    });
    const owners = await prisma.user.findMany({
      select: { id: true, displayName: true },
    });
    res.json(
      all
        .filter(
          (c) =>
            JSON.parse(c.state).status !== "closed" ||
            c.ownerId === u.id ||
            c.members.some((m) => m.userId === u.id),
        )
        .map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          banner: c.banner,
          ownerId: c.ownerId,
          owner:
            owners.find((u) => u.id === c.ownerId)?.displayName || "Mestre",
          updatedAt: c.updatedAt,
          members: c.members.length,
          online: online(c.id).length,
          joined: c.members.some((m) => m.userId === u.id),
          status: JSON.parse(c.state).status,
        })),
    );
  });
  app.post("/api/campaigns", auth, async (req, res) => {
    const u: User = res.locals.user;
    requireRule(u.role === "MASTER", "Somente Mestres criam campanhas.");
    const p = z
      .object({
        name: z.string().trim().min(3).max(100),
        description: z.string().max(1000).default(""),
        banner: assetUrl.default(""),
        demo: z.boolean().default(true),
      })
      .parse(req.body);
    const state = demoState(u.id);
    if (!p.demo) {
      state.scenes = state.scenes.slice(1, 2);
      state.characters = [];
      state.scenes[0].rooms = [];
      state.scenes[0].walls = [];
      state.scenes[0].doors = [];
      state.activeSceneId = state.scenes[0].id;
      state.logs = [];
    }
    const c = await prisma.campaign.create({
      data: {
        name: p.name,
        description: p.description,
        banner: p.banner || "/art/factory.svg",
        ownerId: u.id,
        state: JSON.stringify(state),
        members: { create: { userId: u.id } },
      },
    });
    res.status(201).json({ id: c.id });
  });
  app.put("/api/campaigns/:id", auth, async (req, res) => {
    const c = await campaign(z.string().parse(req.params.id), res.locals.user);
    requireRule(
      c.ownerId === res.locals.user.id,
      "Somente o Mestre da campanha.",
    );
    const p = z
      .object({
        name: z.string().min(3).max(100),
        description: z.string().max(1000),
        banner: assetUrl,
      })
      .parse(req.body);
    await prisma.campaign.update({ where: { id: c.id }, data: p });
    await publish(c.id);
    res.json({ ok: true });
  });
  app.post("/api/campaigns/:id/join", auth, async (req, res) => {
    const c = await prisma.campaign.findUnique({
      where: { id: z.string().parse(req.params.id) },
    });
    requireRule(
      c && JSON.parse(c.state).status !== "closed",
      "Campanha indisponível.",
    );
    await prisma.membership.upsert({
      where: {
        campaignId_userId: { campaignId: c.id, userId: res.locals.user.id },
      },
      create: { campaignId: c.id, userId: res.locals.user.id },
      update: {},
    });
    res.json({ ok: true });
  });
  app.get("/api/campaigns/:id", auth, async (req, res) =>
    res.json(
      makeView(
        await campaign(z.string().parse(req.params.id), res.locals.user),
        res.locals.user,
      ),
    ),
  );
  app.post("/api/campaigns/:id/action", auth, async (req, res) => {
    await mutate(
      z.string().parse(req.params.id),
      res.locals.user,
      z
        .object({ type: z.string().max(50) })
        .passthrough()
        .parse(req.body),
    );
    res.json({ ok: true });
  });
  async function ownDiscordCharacter(req: Request, user: User) {
    const c = await campaign(z.string().max(100).parse(req.params.id), user);
    const characterId = z.string().max(100).parse(req.params.characterId);
    const state = JSON.parse(c.state) as CampaignState;
    const character = state.characters.find(p => p.id === characterId && p.ownerId === user.id && !p.npc);
    requireRule(character, "Você só pode vincular um Searcher que pertence à sua conta.");
    return { c, character };
  }
  app.get("/api/campaigns/:id/discord/:characterId", auth, async (req, res) => {
    const { c, character } = await ownDiscordCharacter(req, res.locals.user);
    if (!discord.configured) { res.json({ configured: false, linked: false }); return; }
    try {
      await discord.sync(c);
      res.json(await discord.request("status", { campaign_id: c.id, character_id: character.id, player_id: res.locals.user.id }));
    } catch (error) { res.status(503).json({ error: (error as Error).message }); }
  });
  const discordCodeLimit = rateLimit({ windowMs: 60_000, limit: 10, keyGenerator: (_req, res) => res.locals.user.id, standardHeaders: "draft-8", legacyHeaders: false });
  app.post("/api/campaigns/:id/discord/:characterId/code", auth, discordCodeLimit, async (req, res) => {
    const { c, character } = await ownDiscordCharacter(req, res.locals.user);
    try {
      res.json(await discord.request("link-code", { campaign_id: c.id, character_id: character.id, player_id: res.locals.user.id, character_name: character.name }));
    } catch (error) { res.status(503).json({ error: (error as Error).message }); }
  });
  app.post("/api/campaigns/:id/test-card", auth, async (req, res) => {
    const c = await campaign(z.string().parse(req.params.id), res.locals.user);
    requireRule(
      c.ownerId === res.locals.user.id,
      "Somente o Mestre da campanha.",
    );
    const card = cardSchema.parse(req.body.card);
    const s = JSON.parse(c.state) as CampaignState;
    s.cards = s.cards.filter((v) => v.id !== card.id).concat(card);
    const actor = newCharacter(
      res.locals.user.id,
      "Procurador de teste",
      "JUSTIÇA",
    );
    const target = newCharacter(
      res.locals.user.id,
      "Alvo de teste",
      "INCIDÊNCIA",
      true,
    );
    actor.position = { x: 2, y: 2 };
    target.position = { x: 3, y: 2 };
    actor.hand = [card.id];
    s.characters = [actor, target];
    s.combat = {
      active: true,
      paused: false,
      round: 1,
      index: 0,
      order: [actor.id, target.id],
      pending: [],
    };
    const sc = s.scenes.find((v) => v.id === s.activeSceneId)!;
    sc.walls = [];
    sc.rooms = [];
    sc.blocked = [];
    s.logs = [];
    applyAction(s, res.locals.user, c.ownerId, {
      type: "card:play",
      characterId: actor.id,
      cardId: card.id,
      targetId: card.target === "self" ? actor.id : target.id,
    });
    res.json({
      result:
        s.logs.map((l) => l.text).join("\n") +
        "\nVida do alvo: " +
        target.hp +
        " / Escudo: " +
        target.shield +
        " / Resistência: " +
        target.resistance +
        "\nTeste isolado: nenhuma alteração foi salva na campanha.",
    });
  });
  app.get("/api/campaigns/:id/inspect/:characterId", auth, async (req, res) => {
    let hand: string[] = [];
    await serialized(z.string().parse(req.params.id), async () => {
      const c = await campaign(
        z.string().parse(req.params.id),
        res.locals.user,
      );
      requireRule(
        c.ownerId === res.locals.user.id,
        "Somente o Mestre da campanha.",
      );
      const s = JSON.parse(c.state) as CampaignState;
      requireRule(
        s.allowHandInspection,
        "Ative explicitamente a inspeção nas configurações da campanha.",
      );
      const ch = s.characters.find((x) => x.id === req.params.characterId);
      requireRule(ch, "Personagem não encontrado.");
      hand = [...ch.hand];
      log(
        s,
        `Mestre inspecionou a mão de ${ch.name}.`,
        "audit",
        res.locals.user.displayName,
      );
      await prisma.campaign.update({
        where: { id: c.id },
        data: { state: JSON.stringify(s), revision: { increment: 1 } },
      });
    });
    await publish(z.string().parse(req.params.id));
    res.json({ hand });
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  });
  app.get("/api/assets", auth, async (_req, res) => {
    const assets = await prisma.asset.findMany({
      where: { ownerId: res.locals.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(
      assets.map((a) => ({
        id: a.id,
        name: a.name,
        category: a.category,
        mime: a.mime,
        size: a.size,
        url: `/media/${a.id}`,
        thumbnail: a.thumbnail ? `/media/${a.id}/thumb` : "",
      })),
    );
  });
  app.post("/api/assets", auth, upload.single("file"), async (req, res) => {
    const file = req.file;
    requireRule(file, "Selecione um arquivo.");
    const category = z
      .string()
      .max(40)
      .default("Backgrounds")
      .parse(req.body.category);
    let buffer: Buffer,
      mime: string,
      thumbnail = "";
    const assetId = randomUUID();
    const audio = file.buffer.subarray(0, 4).toString("ascii");
    if (
      audio === "OggS" ||
      audio === "RIFF" ||
      file.buffer.subarray(0, 3).toString("ascii") === "ID3" ||
      (file.buffer[0] === 0xff && (file.buffer[1] & 0xe0) === 0xe0)
    ) {
      requireRule(
        res.locals.user.role === "MASTER",
        "Apenas Mestres enviam áudio.",
      );
      buffer = file.buffer;
      mime =
        audio === "OggS"
          ? "audio/ogg"
          : audio === "RIFF"
            ? "audio/wav"
            : "audio/mpeg";
    } else {
      let image;
      try {
        image = sharp(file.buffer, { limitInputPixels: 40_000_000 });
        const meta = await image.metadata();
        requireRule(
          ["png", "jpeg", "webp"].includes(meta.format || ""),
          "Use JPG, PNG ou WebP.",
        );
        buffer = await image.rotate().webp({ quality: 88 }).toBuffer();
      } catch {
        throw new RuleError(
          "Imagem inválida. Use JPG, PNG ou WebP até 40 megapixels.",
        );
      }
      mime = "image/webp";
      thumbnail = `${assetId}.thumb.webp`;
      await sharp(buffer)
        .resize(320, 200, { fit: "inside" })
        .toFile(path.join(mediaDir, thumbnail));
    }
    const filename =
      assetId +
      (mime.startsWith("image/")
        ? ".webp"
        : mime === "audio/ogg"
          ? ".ogg"
          : mime === "audio/wav"
            ? ".wav"
            : ".mp3");
    const fs = await import("node:fs/promises");
    await fs.writeFile(path.join(mediaDir, filename), buffer);
    const a = await prisma.asset.create({
      data: {
        id: assetId,
        ownerId: res.locals.user.id,
        name: file.originalname.slice(0, 100),
        category,
        mime,
        filename,
        thumbnail,
        size: buffer.length,
      },
    });
    res.status(201).json({
      id: a.id,
      url: `/media/${a.id}`,
      name: a.name,
      mime: a.mime,
      thumbnail: thumbnail ? `/media/${a.id}/thumb` : "",
    });
  });
  app.put("/api/assets/:id", auth, async (req, res) => {
    const a = await prisma.asset.findUnique({
      where: { id: z.string().parse(req.params.id) },
    });
    requireRule(
      a && a.ownerId === res.locals.user.id,
      "Arquivo não encontrado.",
    );
    const p = z
      .object({
        name: z.string().min(1).max(100),
        category: z.string().max(40),
      })
      .parse(req.body);
    await prisma.asset.update({ where: { id: a.id }, data: p });
    res.json({ ok: true });
  });
  app.delete("/api/assets/:id", auth, async (req, res) => {
    const a = await prisma.asset.findUnique({
      where: { id: z.string().parse(req.params.id) },
    });
    requireRule(
      a && a.ownerId === res.locals.user.id,
      "Arquivo não encontrado.",
    );
    const campaigns = await prisma.campaign.findMany();
    requireRule(
      !campaigns.some(
        (c) =>
          c.state.includes(`/media/${a.id}`) || c.banner === `/media/${a.id}`,
      ),
      "Arquivo está em uso em uma campanha. Substitua-o antes de excluir.",
    );
    requireRule(
      !(await prisma.user.findFirst({ where: { avatar: `/media/${a.id}` } })),
      "Este arquivo está em uso como avatar.",
    );
    await prisma.asset.delete({ where: { id: a.id } });
    await unlink(path.join(mediaDir, a.filename));
    if (a.thumbnail)
      await unlink(path.join(mediaDir, a.thumbnail)).catch(() => {});
    res.json({ ok: true });
  });
  app.get("/media/:id{/:thumb}", auth, async (req, res) => {
    const a = await prisma.asset.findUnique({
      where: { id: z.string().parse(req.params.id) },
    });
    requireRule(a, "Arquivo não encontrado.");
    let permitted = a.ownerId === res.locals.user.id;
    if (!permitted) {
      const cs = await prisma.campaign.findMany({ include: { members: true } });
      permitted = cs.some(
        (c) =>
          c.banner === `/media/${a.id}` ||
          (c.members.some((m) => m.userId === res.locals.user.id) &&
            JSON.stringify(makeView(c, res.locals.user)).includes(
              `/media/${a.id}`,
            )),
      );
    }
    requireRule(permitted, "Sem permissão para este arquivo.");
    const filename = req.params.thumb ? a.thumbnail : a.filename;
    requireRule(filename, "Miniatura indisponível.");
    res
      .type(req.params.thumb ? "image/webp" : a.mime)
      .setHeader("Cache-Control", "private, max-age=300");
    res.sendFile(path.join(mediaDir, filename));
  });
  io.use(async (socket, next) => {
    try {
      const user = await authenticate(socket.request.headers.cookie);
      if (!user) {
        next(new Error("Não autenticado."));
        return;
      }
      socket.data.user = user;
      next();
    } catch {
      next(new Error("Sessão inválida."));
    }
  });
  io.on("connection", (socket) => {
    let lastAction = 0;
    let actionCount = 0;
    socket.on("campaign:join", async (id, ack) => {
      if (typeof ack !== "function") ack = () => {};
      try {
        const user = await authenticate(socket.request.headers.cookie);
        requireRule(user, "Sessão expirada.");
        const c = await campaign(z.string().max(100).parse(id), user);
        for (const room of socket.rooms)
          if (room !== socket.id) await socket.leave(room);
        await socket.join(c.id);
        socket.emit("campaign:state", makeView(c, user));
        io.to(c.id).emit("campaign:presence", online(c.id));
        ack({ ok: true });
      } catch (e) {
        ack({
          ok: false,
          error: e instanceof Error ? e.message : "Falha ao entrar.",
        });
      }
    });
    socket.on("campaign:action", async (payload, ack) => {
      if (typeof ack !== "function") ack = () => {};
      try {
        if (Date.now() - lastAction > 1000) {
          lastAction = Date.now();
          actionCount = 0;
        }
        requireRule(++actionCount < 25, "Muitas ações. Aguarde.");
        const user = await authenticate(socket.request.headers.cookie);
        requireRule(user, "Sessão expirada.");
        const p = z
          .object({
            campaignId: z.string().max(100),
            action: z.object({ type: z.string().max(50) }).passthrough(),
          })
          .parse(payload);
        await mutate(p.campaignId, user, p.action);
        ack({ ok: true });
      } catch (e) {
        ack({
          ok: false,
          error:
            e instanceof ZodError
              ? "Dados da ação inválidos."
              : e instanceof Error
                ? e.message
                : "Não foi possível realizar a ação.",
        });
      }
    });
    socket.on("disconnecting", () => {
      for (const room of socket.rooms)
        if (room !== socket.id)
          setTimeout(
            () => io.to(room).emit("campaign:presence", online(room)),
            0,
          );
    });
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "Rota não encontrada." }),
  );
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) {
      res.status(400).json({
        error: err.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      });
      return;
    }
    if (err instanceof RuleError) {
      res.status(403).json({ error: err.message });
      return;
    }
    if (err instanceof multer.MulterError) {
      res.status(400).json({ error: "Arquivo excede o limite de 20 MB." });
      return;
    }
    console.error(err);
    res
      .status(500)
      .json({ error: "Falha interna. Consulte o terminal do anfitrião." });
  });
  return {
    app,
    http,
    io,
    prisma,
    publish,
    close: async () => {
      await discord.close();
      await new Promise<void>((resolve) => io.close(() => resolve()));
      await prisma.$disconnect();
    },
  };
}
