"""Ponte local autenticada: vínculo confirmado no Discord e snapshots do tabletop."""
from __future__ import annotations

import hashlib
import hmac
import json
import logging
import secrets
import sqlite3
import time
from datetime import datetime, timezone
from pathlib import Path

from aiohttp import web


def ensure_bridge_db(database: Path):
    with sqlite3.connect(database) as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS tabletop_codes (
            code_hash TEXT PRIMARY KEY, guild_id INTEGER NOT NULL,
            campaign_id TEXT NOT NULL, character_id TEXT NOT NULL,
            player_id TEXT NOT NULL, character_name TEXT NOT NULL, expires_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS tabletop_links (
            guild_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
            campaign_id TEXT NOT NULL, character_id TEXT NOT NULL,
            player_id TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT -1,
            synced_at TEXT NOT NULL DEFAULT '',
            PRIMARY KEY (guild_id, user_id), UNIQUE (guild_id, campaign_id, character_id)
        );
        """)


def consume_code(database: Path, guild_id: int, user_id: int, code: str) -> str:
    digest = hashlib.sha256(code.strip().replace("-", "").upper().encode()).hexdigest()
    with sqlite3.connect(database, timeout=10) as db:
        db.execute("BEGIN IMMEDIATE")
        item = db.execute("SELECT campaign_id, character_id, player_id, character_name FROM tabletop_codes WHERE code_hash=? AND guild_id=? AND expires_at>?", (digest, guild_id, int(time.time()))).fetchone()
        if not item:
            raise ValueError("Código inválido, já utilizado ou expirado. Gere outro na aba Discord do tabletop.")
        if not db.execute("SELECT 1 FROM sheets WHERE guild_id=? AND user_id=?", (guild_id, user_id)).fetchone():
            raise ValueError("Crie sua ficha no Discord primeiro com /criar_ficha.")
        conflict = db.execute("SELECT user_id FROM tabletop_links WHERE guild_id=? AND campaign_id=? AND character_id=?", (guild_id, item[0], item[1])).fetchone()
        if conflict and conflict[0] != user_id:
            raise ValueError("Esse personagem já está vinculado a outra conta do Discord. Desvincule a conta anterior primeiro.")
        db.execute("INSERT INTO tabletop_links (guild_id,user_id,campaign_id,character_id,player_id) VALUES (?,?,?,?,?) ON CONFLICT(guild_id,user_id) DO UPDATE SET campaign_id=excluded.campaign_id,character_id=excluded.character_id,player_id=excluded.player_id,revision=-1,synced_at=''", (guild_id, user_id, *item[:3]))
        db.execute("DELETE FROM tabletop_codes WHERE code_hash=?", (digest,))
    return item[3]


def unlink(database: Path, guild_id: int, user_id: int):
    with sqlite3.connect(database) as db:
        db.execute("DELETE FROM tabletop_links WHERE guild_id=? AND user_id=?", (guild_id, user_id))


def is_linked(database: Path, guild_id: int, user_id: int) -> bool:
    with sqlite3.connect(database) as db:
        return bool(db.execute("SELECT 1 FROM tabletop_links WHERE guild_id=? AND user_id=?", (guild_id, user_id)).fetchone())


class TabletopBridge:
    def __init__(self, database: Path, secret: str, guild_id: str, port: int = 4190):
        self.database, self.secret, self.guild_id, self.port = database, secret, int(guild_id), port
        self.runner: web.AppRunner | None = None

    async def start(self):
        if len(self.secret) < 32:
            raise ValueError("TABLETOP_BRIDGE_SECRET precisa ter pelo menos 32 caracteres.")
        ensure_bridge_db(self.database)

        @web.middleware
        async def authorize(request, handler):
            if request.headers.get("Origin") or not hmac.compare_digest(request.headers.get("Authorization", "").encode(), ("Bearer " + self.secret).encode()):
                return web.json_response({"error": "Não autorizado."}, status=401)
            try:
                return await handler(request)
            except (ValueError, TypeError, KeyError, json.JSONDecodeError):
                return web.json_response({"error": "Dados da integração inválidos."}, status=400)

        app = web.Application(middlewares=[authorize], client_max_size=256 * 1024)
        app.add_routes([web.post("/link-code", self.link_code), web.post("/status", self.status), web.post("/sync", self.sync), web.get("/health", self.health)])
        self.runner = web.AppRunner(app, access_log=None)
        await self.runner.setup()
        await web.TCPSite(self.runner, "127.0.0.1", self.port).start()
        logging.info("Ponte tabletop ativa em 127.0.0.1:%s", self.port)

    async def close(self):
        if self.runner:
            await self.runner.cleanup()

    async def payload(self, request):
        body = await request.json()
        if not isinstance(body, dict) or str(body.get("guild_id")) != str(self.guild_id):
            raise ValueError("Servidor inválido.")
        return body

    def text(self, body, key, max_length=100):
        value = body.get(key)
        if not isinstance(value, str) or not 1 <= len(value) <= max_length:
            raise ValueError(key)
        return value

    async def health(self, request):
        return web.json_response({"ok": True, "name": "ORDER Bridge"})

    async def link_code(self, request):
        body = await self.payload(request)
        campaign, character, player = [self.text(body, key) for key in ("campaign_id", "character_id", "player_id")]
        name = self.text(body, "character_name")
        code = secrets.token_hex(5).upper()
        expires = int(time.time()) + 600
        with sqlite3.connect(self.database) as db:
            db.execute("DELETE FROM tabletop_codes WHERE expires_at<=? OR (guild_id=? AND campaign_id=? AND character_id=?)", (int(time.time()), self.guild_id, campaign, character))
            db.execute("INSERT INTO tabletop_codes VALUES (?,?,?,?,?,?,?)", (hashlib.sha256(code.encode()).hexdigest(), self.guild_id, campaign, character, player, name, expires))
        return web.json_response({"code": f"{code[:5]}-{code[5:]}", "expiresAt": expires * 1000})

    async def status(self, request):
        body = await self.payload(request)
        campaign, character, player = [self.text(body, key) for key in ("campaign_id", "character_id", "player_id")]
        with sqlite3.connect(self.database) as db:
            row = db.execute("SELECT user_id, synced_at, revision FROM tabletop_links WHERE guild_id=? AND campaign_id=? AND character_id=? AND player_id=?", (self.guild_id, campaign, character, player)).fetchone()
        return web.json_response({"configured": True, "linked": bool(row), "discordUserId": str(row[0]) if row else None, "syncedAt": row[1] if row else None, "revision": row[2] if row else None})

    async def sync(self, request):
        body = await self.payload(request)
        campaign = self.text(body, "campaign_id")
        revision, trust, characters = body.get("revision"), body.get("trust"), body.get("characters")
        def number(value):
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not -1_000_000 <= value <= 1_000_000:
                raise ValueError("Número inválido.")
            return str(value) if isinstance(value, int) else format(value, ".15g")
        if isinstance(revision, bool) or not isinstance(revision, int) or not 0 <= revision <= 2**53 - 1 or not isinstance(characters, list) or len(characters) > 200:
            raise ValueError("Snapshot inválido.")
        trust_value = number(trust)
        validated = []
        for item in characters:
            if not isinstance(item, dict):
                raise ValueError("Personagem inválido.")
            character, player = self.text(item, "id"), self.text(item, "ownerId")
            values = {key: number(item[key]) for key in ("hp", "maxHp", "moral", "maxMoral", "sanity", "maxSanity", "fame")}
            validated.append((character, player, values))
        updated = 0
        now = datetime.now(timezone.utc).isoformat()
        with sqlite3.connect(self.database, timeout=10) as db:
            db.execute("BEGIN IMMEDIATE")
            for character, player, values in validated:
                row = db.execute("SELECT user_id, revision FROM tabletop_links WHERE guild_id=? AND campaign_id=? AND character_id=? AND player_id=?", (self.guild_id, campaign, character, player)).fetchone()
                if not row or revision <= row[1]:
                    continue
                sheet = db.execute("SELECT payload FROM sheets WHERE guild_id=? AND user_id=?", (self.guild_id, row[0])).fetchone()
                if not sheet:
                    continue
                payload = json.loads(sheet[0])
                payload.update({"vida": f"{values['hp']} / {values['maxHp']}", "moral": f"{values['moral']} / {values['maxMoral']}", "sanidade": f"{values['sanity']} / {values['maxSanity']}", "hell_of_fame": values["fame"], "confianca": trust_value, "tabletop_synced_at": now, "tabletop_campaign": campaign, "tabletop_character": character})
                db.execute("UPDATE sheets SET payload=?,updated_at=? WHERE guild_id=? AND user_id=?", (json.dumps(payload, ensure_ascii=False), now, self.guild_id, row[0]))
                db.execute("UPDATE tabletop_links SET revision=?,synced_at=? WHERE guild_id=? AND user_id=?", (revision, now, self.guild_id, row[0]))
                updated += 1
        return web.json_response({"ok": True, "updated": updated})
