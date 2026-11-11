import { beforeAll, afterAll, it, expect } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { io, type Socket } from "socket.io-client";
import { createApplication } from "../server/app";
let dir: string,
  base: string,
  server: Awaited<ReturnType<typeof createApplication>>,
  gm = "",
  p1 = "",
  p2 = "",
  campaignId = "",
  char1 = "",
  char2 = "";
const sockets: Socket[] = [];
async function request(
  route: string,
  cookie = "",
  data?: unknown,
  method?: string,
) {
  const response = await fetch(base + route, {
    method: method || (data ? "POST" : "GET"),
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: data ? JSON.stringify(data) : undefined,
  });
  return {
    status: response.status,
    data: await response.json(),
    cookie: response.headers.get("set-cookie")?.split(";")[0] || "",
    header: response.headers.get("set-cookie") || "",
  };
}
async function action(cookie: string, data: unknown) {
  return request(`/api/campaigns/${campaignId}/action`, cookie, data);
}
async function connect(cookie: string) {
  const socket = io(base, {
    extraHeaders: { Cookie: cookie },
    transports: ["websocket"],
    forceNew: true,
    reconnection: false,
  });
  sockets.push(socket);
  await new Promise<void>((resolve, reject) => {
    socket.on("connect", resolve);
    socket.on("connect_error", reject);
  });
  return socket;
}
beforeAll(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "order-test-"));
  const databaseUrl = `file:${path.join(dir, "test.db").replaceAll("\\", "/")}`;
  await writeFile(path.join(dir, "test.db"), "");
  execFileSync(
    process.execPath,
    [
      path.resolve("node_modules/prisma/build/index.js"),
      "db",
      "push",
      "--skip-generate",
    ],
    { env: { ...process.env, DATABASE_URL: databaseUrl }, stdio: "pipe" },
  );
  server = await createApplication({
    databaseUrl,
    dataDir: dir,
    setupCode: "4053",
    testing: true,
  });
  await new Promise<void>((resolve) =>
    server.http.listen(0, "127.0.0.1", resolve),
  );
  const address = server.http.address() as { port: number };
  base = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => {
  sockets.forEach((s) => s.disconnect());
  await server?.close();
  const cleanupPath = path.resolve(dir);
  if (
    path.dirname(cleanupPath) !== path.resolve(os.tmpdir()) ||
    !path.basename(cleanupPath).startsWith("order-test-")
  ) {
    throw new Error(
      "Pasta temporária fora do destino de teste; limpeza cancelada.",
    );
  }
  await rm(dir, { recursive: true, force: true });
});
it("autentica sem permitir promoção pelo cliente e usa cookie HttpOnly", async () => {
  expect(
    (
      await request("/api/auth/register", "", {
        username: "fake",
        displayName: "Fake",
        password: "SenhaSegura123",
        role: "MASTER",
        setupCode: "0000",
      })
    ).status,
  ).toBe(403);
  const m = await request("/api/auth/register", "", {
    username: "mestre",
    displayName: "Mestre",
    password: "SenhaSegura123",
    role: "MASTER",
    setupCode: "4053",
  });
  expect(m.status).toBe(201);
  expect(m.header).toContain("HttpOnly");
  expect(m.header).toContain("SameSite=Lax");
  gm = m.cookie;
  const a = await request("/api/auth/register", "", {
    username: "player1",
    displayName: "Procuradora",
    password: "SenhaSegura123",
    role: "PLAYER",
  });
  const b = await request("/api/auth/register", "", {
    username: "player2",
    displayName: "Procurador",
    password: "SenhaSegura123",
    role: "PLAYER",
  });
  p1 = a.cookie;
  p2 = b.cookie;
  expect((await request("/api/auth/me", p1)).data.role).toBe("PLAYER");
  expect(
    (
      await request("/api/auth/login", "", {
        username: "mestre",
        password: "errada",
      })
    ).status,
  ).toBe(401);
});
it("cria campanha, restringe membros e grava fichas", async () => {
  const c = await request("/api/campaigns", gm, {
    name: "O Fabricante de Brinquedos",
    description: "Campanha de integração",
    demo: true,
  });
  expect(c.status).toBe(201);
  campaignId = c.data.id;
  expect((await request(`/api/campaigns/${campaignId}`, p1)).status).toBe(403);
  for (const cookie of [p1, p2]) {
    expect(
      (await request(`/api/campaigns/${campaignId}/join`, cookie, {})).status,
    ).toBe(200);
    expect(
      (
        await action(cookie, {
          type: "character:create",
          name: cookie === p1 ? "Cassandra" : "Elias",
          sector: "JUSTIÇA",
          npc: false,
        })
      ).status,
    ).toBe(200);
  }
  const s = (await request(`/api/campaigns/${campaignId}`, p1)).data;
  char1 = s.characters.find((c: any) => c.name === "Cassandra").id;
  char2 = s.characters.find((c: any) => c.name === "Elias").id;
  expect(s.scenes).toHaveLength(8);
  expect(s.scenes[1].rooms).toHaveLength(9);
  expect(s.characters.find((c: any) => c.id === char1).hand).toHaveLength(3);
  expect(s.characters.find((c: any) => c.id === char2)).not.toHaveProperty(
    "hand",
  );
});
it("bloqueia falsificação de recursos, NPCs e eventos de dados", async () => {
  expect(
    (
      await action(p1, {
        type: "character:resources",
        characterId: char2,
        patch: { hp: 100 },
      })
    ).status,
  ).toBe(403);
  expect(
    (
      await action(p1, {
        type: "character:create",
        name: "Intruso",
        sector: "JUSTIÇA",
        npc: true,
      })
    ).status,
  ).toBe(403);
  const s = (await request(`/api/campaigns/${campaignId}`, p1)).data;
  expect(
    (
      await action(p1, {
        type: "scene:update",
        sceneId: s.activeSceneId,
        patch: { name: "Hack" },
      })
    ).status,
  ).toBe(403);
  expect(
    (
      await action(p1, {
        type: "dice:roll",
        characterId: char1,
        sides: 100,
        result: 100,
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await action(p1, {
        type: "dice:roll",
        characterId: char1,
        sides: 6,
        result: 999,
      })
    ).status,
  ).toBe(200);
  const next = (await request(`/api/campaigns/${campaignId}`, p1)).data;
  expect(next.logs.at(-1).text).toMatch(/d6: [1-6]$/);
});
it("sincroniza dois clientes Socket.IO com visualizações privadas e reconexão", async () => {
  const a = await connect(p1),
    b = await connect(p2);
  async function join(socket: Socket) {
    const state = new Promise<any>((resolve) =>
      socket.once("campaign:state", resolve),
    );
    socket.emit("campaign:join", campaignId, () => {});
    return state;
  }
  const va = await join(a),
    vb = await join(b);
  expect(va.characters.find((c: any) => c.id === char1)).toHaveProperty("hand");
  expect(vb.characters.find((c: any) => c.id === char1)).not.toHaveProperty(
    "hand",
  );
  const next = new Promise<any>((resolve) => b.once("campaign:state", resolve));
  const pos = { x: 8, y: 7 };
  const ack = await new Promise<any>((resolve) =>
    a.emit(
      "campaign:action",
      {
        campaignId,
        action: { type: "token:move", characterId: char1, position: pos },
      },
      resolve,
    ),
  );
  expect(ack.ok).toBe(true);
  expect(
    (await next).characters.find((c: any) => c.id === char1).position,
  ).toEqual(pos);
  b.disconnect();
  const reconnect = await connect(p2);
  const recoveredPromise = new Promise<any>((resolve) =>
    reconnect.once("campaign:state", resolve),
  );
  reconnect.emit("campaign:join", campaignId); // callback de confirmação é opcional no transporte
  const recovered = await recoveredPromise;
  expect(
    recovered.characters.find((c: any) => c.id === char1).position,
  ).toEqual(pos);
  expect(
    recovered.characters.find((c: any) => c.id === char1),
  ).not.toHaveProperty("hand");
  a.emit("campaign:action", { campaignId, action: { type: "invalid" } });
  expect((await request("/api/health")).status).toBe(200);
});
it("registra inspeção somente após autorização explícita", async () => {
  expect(
    (await request(`/api/campaigns/${campaignId}/inspect/${char1}`, gm)).status,
  ).toBe(403);
  await action(gm, {
    type: "campaign:settings",
    patch: { allowHandInspection: true },
  });
  const inspected = await request(
    `/api/campaigns/${campaignId}/inspect/${char1}`,
    gm,
  );
  expect(inspected.status).toBe(200);
  expect(inspected.data.hand).toHaveLength(3);
  const view = (await request(`/api/campaigns/${campaignId}`, gm)).data;
  expect(view.characters.find((c: any) => c.id === char1)).not.toHaveProperty(
    "hand",
  );
  expect(
    view.logs.some(
      (l: any) => l.kind === "audit" && l.text.includes("inspecionou"),
    ),
  ).toBe(true);
});
it("rejeita arquivos falsos e persiste imagens normalizadas", async () => {
  const invalid = new FormData();
  invalid.append(
    "file",
    new Blob(["<script>alert(1)</script>"], { type: "image/png" }),
    "fake.png",
  );
  expect(
    (
      await fetch(base + "/api/assets", {
        method: "POST",
        headers: { Cookie: gm },
        body: invalid,
      })
    ).status,
  ).toBe(403);
  const sharp = (await import("sharp")).default;
  const png = await sharp({
    create: { width: 80, height: 60, channels: 3, background: "#FF2F8E" },
  })
    .png()
    .toBuffer();
  const data = new FormData();
  data.append(
    "file",
    new Blob([new Uint8Array(png)], { type: "image/png" }),
    "banner.png",
  );
  const response = await fetch(base + "/api/assets", {
    method: "POST",
    headers: { Cookie: gm },
    body: data,
  });
  expect(response.status).toBe(201);
  const asset = (await response.json()) as { url: string };
  expect(
    (await fetch(base + asset.url, { headers: { Cookie: gm } })).status,
  ).toBe(200);
  expect(
    (await fetch(base + asset.url, { headers: { Cookie: p1 } })).status,
  ).toBe(403);
});
it("recupera estado e sessão autenticada após reiniciar o servidor", async () => {
  const before = (await request(`/api/campaigns/${campaignId}`, p1)).data;
  sockets.forEach((s) => s.disconnect());
  await server.close();
  const databaseUrl = `file:${path.join(dir, "test.db").replaceAll("\\", "/")}`;
  server = await createApplication({
    databaseUrl,
    dataDir: dir,
    setupCode: "changed",
    testing: true,
  });
  await new Promise<void>((resolve) =>
    server.http.listen(0, "127.0.0.1", resolve),
  );
  base = `http://127.0.0.1:${(server.http.address() as { port: number }).port}`;
  const after = (await request(`/api/campaigns/${campaignId}`, p1)).data;
  expect(after.characters).toEqual(before.characters);
  expect(after.revision).toBe(before.revision);
  expect((await request("/api/auth/me", p1)).status).toBe(200);
});
