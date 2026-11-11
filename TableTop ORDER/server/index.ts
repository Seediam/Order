import "dotenv/config";
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import express from "express";
import { createApplication } from "./app";
const dataDir = path.resolve(process.env.DATA_DIR || "./data");
mkdirSync(dataDir, { recursive: true });
process.env.DATABASE_URL ||= `file:${path.join(dataDir, "order.db").replaceAll("\\", "/")}`;
const dbPath = process.env.DATABASE_URL.slice(5);
const absoluteDb = path.isAbsolute(dbPath)
  ? dbPath
  : path.resolve("prisma", dbPath);
mkdirSync(path.dirname(absoluteDb), { recursive: true });
// SQLite vazio precisa existir antes do schema engine no Windows. Nunca sobrescreve dados.
if (!existsSync(absoluteDb)) writeFileSync(absoluteDb, "");
// Mantém npm run dev / npm start funcionais no primeiro uso, sem etapa manual de banco.
execFileSync(
  process.execPath,
  [
    path.resolve("node_modules/prisma/build/index.js"),
    "db",
    "push",
    "--skip-generate",
  ],
  { stdio: "inherit", env: process.env },
);
const server = await createApplication({
  databaseUrl: process.env.DATABASE_URL,
  dataDir,
  setupCode: process.env.MASTER_SETUP_CODE || "4053",
  secureCookie: process.env.COOKIE_SECURE === "true",
  discord: {
    url: process.env.DISCORD_BRIDGE_URL || "",
    secret: process.env.DISCORD_BRIDGE_SECRET || "",
    guildId: process.env.DISCORD_GUILD_ID || "",
  },
});
const dev = process.argv[1]?.endsWith(".ts");
if (dev) {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  server.app.use(vite.middlewares);
} else {
  server.app.use(express.static(path.resolve("dist")));
  server.app.get("/{*path}", (_req, res) =>
    res.sendFile(path.resolve("dist/index.html")),
  );
}
const port = Number(process.env.PORT) || 3000,
  host = process.env.HOST || "0.0.0.0";
server.http.listen(port, host, () =>
  console.log(
    `\n  O R D E R · Seu julgamento ainda não terminou.\n  Local: http://localhost:${port}\n  Rede: http://<IPv4-Hamachi>:${port}\n  Dados: ${dataDir}\n`,
  ),
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    void server.close().then(() => process.exit(0));
  });
