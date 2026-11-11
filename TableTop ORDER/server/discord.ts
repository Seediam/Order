import type { PrismaClient } from "@prisma/client";
import type { CampaignState } from "../shared/types";
import { request as httpRequest } from "node:http";

export interface DiscordOptions {
  url: string;
  secret: string;
  guildId: string;
}
type Snapshot = { id: string; state: string; revision: number };

/** A chave fica apenas no servidor. O navegador recebe um código de uso único. */
export function discordIntegration(prisma: PrismaClient, options?: DiscordOptions) {
  const configured = !!(options?.url && options.secret && options.guildId);
  if (configured) {
    const url = new URL(options!.url);
    if (url.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))
      throw new Error("A ponte Discord deve usar o endereço HTTP local do anfitrião.");
    if (options!.secret.length < 32) throw new Error("Chave da ponte Discord inválida.");
  }
  let stopped = false, working = false, lastWarning = 0;
  const running = new Map<string, Promise<unknown>>();
  const pending = new Map<string, Snapshot>();
  async function request<T = any>(route: string, body: Record<string, unknown>) {
    if (!configured) throw new Error("A ponte Discord não está configurada no anfitrião.");
    try {
      const payload = JSON.stringify({ ...body, guild_id: options!.guildId });
      return await new Promise<T>((resolve, reject) => {
        const req = httpRequest(new URL(route, options!.url.endsWith("/") ? options!.url : options!.url + "/"), {
          method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload), Authorization: `Bearer ${options!.secret}` },
        }, response => {
          let text = "";
          response.setEncoding("utf8");
          response.on("data", (chunk: string) => {
            text += chunk;
            if (text.length > 65536) req.destroy(new Error("Resposta inválida da ponte."));
          });
          response.on("error", reject);
          response.on("end", () => {
            if (response.statusCode !== 200) { reject(new Error("Ponte indisponível.")); return; }
            try { resolve(JSON.parse(text) as T); } catch { reject(new Error("Resposta inválida da ponte.")); }
          });
        });
        req.setTimeout(5000, () => req.destroy(new Error("Tempo esgotado.")));
        req.on("error", reject);
        req.end(payload);
      });
    } catch {
      throw new Error("Não foi possível acessar o bot. O anfitrião deve manter o bot em execução e conferir a ponte local.");
    }
  }
  async function sync(c: Snapshot) {
    if (!configured || stopped) return;
    const state = JSON.parse(c.state) as CampaignState;
    await request("sync", {
      campaign_id: c.id, revision: c.revision, trust: state.trust,
      characters: state.characters.filter(c => !c.npc).map(c => ({
        id: c.id, ownerId: c.ownerId, hp: c.hp, maxHp: c.maxHp,
        moral: c.moral, maxMoral: c.maxMoral, sanity: c.sanity, maxSanity: c.maxSanity, fame: c.fame,
      })),
    });
  }
  function warn() {
    if (Date.now() - lastWarning > 60_000) {
      console.warn("Discord: bot indisponível; os recursos serão reenviados na próxima reconciliação.");
      lastWarning = Date.now();
    }
  }
  function queue(c: Snapshot) {
    if (!configured || stopped) return;
    // Durante movimentos rápidos, conserva apenas o snapshot mais recente da campanha.
    pending.set(c.id, c);
    if (running.has(c.id)) return;
    const next = (async () => {
      while (pending.has(c.id) && !stopped) {
        const latest = pending.get(c.id)!;
        pending.delete(c.id);
        try { await sync(latest); }
        catch { pending.delete(c.id); warn(); break; }
      }
    })();
    running.set(c.id, next);
    void next.finally(() => { if (running.get(c.id) === next) running.delete(c.id); });
  }
  async function reconcile() {
    if (!configured || stopped || working) return;
    working = true;
    try {
      // O estado persistido permite recuperar a sincronização após reiniciar qualquer processo.
      for (const c of await prisma.campaign.findMany({ select: { id: true, state: true, revision: true } })) {
        if (stopped) break;
        await sync(c);
      }
    } catch { warn(); } finally { working = false; }
  }
  const timer = configured ? setInterval(() => void reconcile(), 15_000) : undefined;
  timer?.unref();
  return {
    configured, request, sync, queue,
    async close() { stopped = true; if (timer) clearInterval(timer); await Promise.allSettled([...running.values()]); },
  };
}
