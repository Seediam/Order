"""ORDER — Assistente de criação de personagem para Discord.

Interface por slash commands, botões e formulários. A ficha é guardada em SQLite
por servidor e usuário. Não utiliza IA nem gera imagens automaticamente.
"""
from __future__ import annotations

import asyncio
import io
import json
import logging
import os
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

import discord
from discord import app_commands
from discord.ext import commands
from dotenv import load_dotenv
from sheet_visual import ASSETS, RESOURCE_FIELDS, portrait_path, render_dossier, save_portrait
from tabletop_bridge import TabletopBridge, consume_code, ensure_bridge_db, is_linked, unlink

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
DATABASE = BASE_DIR / "data" / "order_fichas.sqlite3"
PROMPT_FILE = BASE_DIR / "PROMPT.txt"
TOKEN = os.environ.get("DISCORD_TOKEN", "").strip()
GUILD_ID = os.environ.get("GUILD_ID", "").strip()
REFERENCE_URL = os.environ.get("ORDER_REFERENCES_URL", "").strip()
# Página-livro de registro (GitHub Pages). O botão do painel abre direto nela.
REGISTRO_URL = os.environ.get("ORDER_REGISTRO_URL", "https://seediam.github.io/Order/registro.html").strip()
OPENING = "*Agora é sua vez, de contar sua história sem ser nos olhares do outro.*"

SECTORS = {
    "Incidência": "Resistência: sustenta a pressão e protege aliados.",
    "Relação": "Versatilidade: se adapta às pessoas e aos conflitos.",
    "Justiça": "Escolhas: transforma decisões justas em força.",
    "Socialista": "Suporte: fortalece o coletivo.",
    "Doutrina": "Execução: age com precisão e discrição.",
}

REQUIRED = [
    "setor", "nome", "idade", "aparencia", "cabelo", "olhos",
    "personalidade", "roupas", "equipamentos", "pecado", "sobrenatural", "pose",
]

PHASE_1 = ("nome", "idade", "aparencia", "cabelo", "olhos")
PHASE_2 = ("personalidade", "roupas", "equipamentos", "pecado", "sobrenatural")
PHASE_3 = ("pose",)
SHEET_SECTIONS = {
    "resumo": ("Visão geral", "O dossiê visual do seu Searcher", "📜"),
    "identidade": ("Identidade", "Nome, aparência, cabelo e olhos", "👤"),
    "conceito": ("Pecado e visual", "Conduta, roupas e equipamentos", "🕯️"),
    "historia": ("História", "Passado, objetivo, medo e vínculo", "📖"),
    "recursos": ("Recursos e baralhos", "Valores registrados e decks", "⚖️"),
}


def ensure_db() -> None:
    DATABASE.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DATABASE) as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS sheets (
                guild_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                payload TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                PRIMARY KEY(guild_id, user_id)
            )
        """)
    ensure_bridge_db(DATABASE)


def read_sheet(guild_id: int, user_id: int) -> dict[str, str]:
    with sqlite3.connect(DATABASE) as db:
        row = db.execute(
            "SELECT payload FROM sheets WHERE guild_id=? AND user_id=?",
            (guild_id, user_id),
        ).fetchone()
    return json.loads(row[0]) if row else {}


def write_sheet(guild_id: int, user_id: int, fields: dict[str, str]) -> dict[str, str]:
    timestamp = datetime.now(timezone.utc).isoformat()
    with sqlite3.connect(DATABASE, timeout=10) as db:
        db.execute("BEGIN IMMEDIATE")
        row = db.execute("SELECT payload FROM sheets WHERE guild_id=? AND user_id=?", (guild_id, user_id)).fetchone()
        current = json.loads(row[0]) if row else {}
        current.update(fields)
        db.execute("""
            INSERT INTO sheets (guild_id, user_id, payload, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(guild_id, user_id)
            DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at
        """, (guild_id, user_id, json.dumps(current, ensure_ascii=False), timestamp))
    return current


def delete_sheet(guild_id: int, user_id: int) -> None:
    with sqlite3.connect(DATABASE) as db:
        db.execute("DELETE FROM sheets WHERE guild_id=? AND user_id=?", (guild_id, user_id))
        db.execute("DELETE FROM tabletop_links WHERE guild_id=? AND user_id=?", (guild_id, user_id))
    portrait_path(guild_id, user_id).unlink(missing_ok=True)


def complete(sheet: dict[str, str]) -> bool:
    return all(str(sheet.get(key, "")).strip() for key in REQUIRED)


def next_phase(sheet: dict[str, str]) -> int:
    if not all(sheet.get(key, "").strip() for key in PHASE_1):
        return 1
    if not all(sheet.get(key, "").strip() for key in PHASE_2):
        return 2
    if not all(sheet.get(key, "").strip() for key in PHASE_3):
        return 3
    return 0


def get_text(sheet: dict[str, str], key: str, fallback: str = "Não informado") -> str:
    return str(sheet.get(key) or fallback)


def safe_embed_text(value: str, limit: int = 700) -> str:
    value = discord.utils.escape_markdown(value)
    value = discord.utils.escape_mentions(value)
    return value[:limit] + ("…" if len(value) > limit else "")


def sheet_embed(sheet: dict[str, str], *, owner: discord.abc.User | None = None, section: str = "resumo") -> discord.Embed:
    name = get_text(sheet, "nome", "Procurador sem nome")
    section = section if section in SHEET_SECTIONS else "resumo"
    filled = sum(bool(str(sheet.get(key, "")).strip()) for key in REQUIRED)
    embed = discord.Embed(
        title=f"{SHEET_SECTIONS[section][2]} {safe_embed_text(name, 90)}",
        description=("**Contrato registrado**" if complete(sheet) else f"**Contrato em aberto · {filled}/{len(REQUIRED)} campos**")
        + f"\n{SHEET_SECTIONS[section][0]} · Use o menu para consultar o dossiê.",
        color=0xE43B80,
    )
    embed.set_author(name="ORDER / ARQUIVO CENTRAL")

    def field(label, key, *, inline=False):
        embed.add_field(name=label, value=safe_embed_text(get_text(sheet, key), 900), inline=inline)

    if section == "resumo":
        field("⚜️ Setor", "setor", inline=True)
        field("⌛ Idade aparente", "idade", inline=True)
        values = [f"{label:<19} {str(sheet.get(key) or 'A definir').replace('`', '').replace(chr(10), ' ').replace(chr(13), ' ')[:40]}" for key, label in RESOURCE_FIELDS]
        if sheet.get("vida"):
            values.insert(0, "Vida                " + safe_embed_text(sheet["vida"], 40))
        embed.add_field(name="⚖️ Recursos registrados", value="```text\n" + "\n".join(values) + "\n```", inline=False)
    elif section == "identidade":
        field("Nome", "nome", inline=True)
        field("Idade aparente", "idade", inline=True)
        field("Aparência", "aparencia")
        field("Cabelo", "cabelo", inline=True)
        field("Olhos", "olhos", inline=True)
    elif section == "conceito":
        field("🕯️ Pecado em vida", "pecado")
        field("Personalidade e postura", "personalidade")
        field("Roupas e estilo", "roupas")
        field("Armas e equipamentos", "equipamentos")
        field("Marcas sobrenaturais", "sobrenatural")
    elif section == "historia":
        field("Passado antes da morte", "passado")
        field("Objetivo como Searcher", "objetivo")
        field("Medo ou fraqueza", "medo")
        field("Vínculo", "vinculo")
        field("Pose para a arte", "pose")
    elif section == "recursos":
        for key, label in RESOURCE_FIELDS:
            embed.add_field(name=label, value=safe_embed_text(get_text(sheet, key, "A definir"), 40), inline=True)
        embed.add_field(name="🃏 Baralho de ações", value="20 cartas · seleção ainda não registrada", inline=False)
        embed.add_field(name="📚 Formação / perícias", value="Baralho separado · a definir com o Mestre", inline=False)
        if sheet.get("vida"):
            field("❤️ Vida", "vida", inline=True)
        if sheet.get("tabletop_synced_at"):
            embed.add_field(name="🔗 Recursos do tabletop", value="Atualizados pela mesa vinculada. Abra a ficha novamente para consultar os valores atuais. Para voltar ao registro manual, use `/desvincular_tabletop`.", inline=False)
            embed.add_field(name="Última atualização (UTC)", value=sheet["tabletop_synced_at"][:19].replace("T", " "), inline=False)
        else:
            embed.add_field(name="Registro manual", value="Os valores são informados pelo jogador conforme as regras do Mestre. Vincule o tabletop para receber os recursos automaticamente.", inline=False)
    if owner:
        embed.set_footer(text=f"{owner.display_name} · salvo automaticamente · ficha privada", icon_url=owner.display_avatar.url)
        if section != "resumo":
            embed.set_thumbnail(url=owner.display_avatar.url)
    return embed


def markdown_sheet(sheet: dict[str, str]) -> str:
    parts = [
        f"# ORDER — Ficha de {get_text(sheet, 'nome')}",
        "", "## Identidade",
        f"**Nome:** {get_text(sheet, 'nome')}",
        f"**Idade aparente:** {get_text(sheet, 'idade')}",
        f"**Gênero e aparência:** {get_text(sheet, 'aparencia')}",
        f"**Cabelo:** {get_text(sheet, 'cabelo')}",
        f"**Olhos:** {get_text(sheet, 'olhos')}",
        f"**Setor:** {get_text(sheet, 'setor')}",
        "", "## História, pecado e intenção",
        f"**Personalidade:** {get_text(sheet, 'personalidade')}",
        f"**Pecado em vida:** {get_text(sheet, 'pecado')}",
        f"**Passado:** {get_text(sheet, 'passado')}",
        f"**Objetivo atual:** {get_text(sheet, 'objetivo')}",
        f"**Medo ou fraqueza:** {get_text(sheet, 'medo')}",
        f"**Vínculo:** {get_text(sheet, 'vinculo')}",
        "", "## Aparência visual",
        f"**Roupas:** {get_text(sheet, 'roupas')}",
        f"**Equipamentos:** {get_text(sheet, 'equipamentos')}",
        f"**Detalhes sobrenaturais:** {get_text(sheet, 'sobrenatural')}",
        f"**Pose para arte:** {get_text(sheet, 'pose')}",
        "", "## Mecânicas (em desenvolvimento)",
        *[f"**{label}:** {get_text(sheet, key, 'A definir')}" for key, label in RESOURCE_FIELDS],
        "**Passiva associada ao pecado:** A definir pelo sistema/mestre",
        "**Baralho de ações:** 20 cartas (a selecionar)",
        "**Baralho de Formação/perícias:** separado (a selecionar)",
        "", "_Gerado pelo bot de ORDER. As informações narrativas foram fornecidas pelo jogador._", "",
    ]
    return "\n".join(parts)


def render_prompt(sheet: dict[str, str]) -> str:
    template = PROMPT_FILE.read_text(encoding="utf-8-sig")
    # Mantém as instruções artísticas originais; altera SOMENTE os campos da ficha.
    replacements = {
        "[Nome]": get_text(sheet, "nome"),
        "[Idade]": get_text(sheet, "idade"),
        "[Descrição física]": get_text(sheet, "aparencia"),
        "[Cor, corte e penteado]": get_text(sheet, "cabelo"),
        "[Cor e características]": get_text(sheet, "olhos"),
        "[Personalidade, expressão e postura]": get_text(sheet, "personalidade"),
        "[Descrição completa]": get_text(sheet, "roupas"),
        "[Armas, objetos, joias etc.]": get_text(sheet, "equipamentos"),
        "[Incidência / Relação / Justiça / Socialista / Doutrina]": get_text(sheet, "setor"),
        "[Descrição]": get_text(sheet, "pecado"),
        "[Marcas, cicatrizes, manifestações infernais etc.]": get_text(sheet, "sobrenatural"),
    }
    # '[Descrição]' aparece duas vezes: pecado e pose. Substituição independente abaixo.
    template = template.replace("**Pose desejada:** [Descrição]", f"**Pose desejada:** {get_text(sheet, 'pose')}")
    for key, value in replacements.items():
        template = template.replace(key, value)
    return template


def download_file(content: str, name: str) -> discord.File:
    return discord.File(io.BytesIO(content.encode("utf-8")), filename=name)


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower())[:35].strip("-") or "personagem"


def server_id(interaction: discord.Interaction) -> int | None:
    return interaction.guild_id


class IdentityModal(discord.ui.Modal, title="ORDER • 1/3 Identidade"):
    def __init__(self, original: dict[str, str], *, editing: bool = False):
        super().__init__(timeout=600)
        self.editing = editing
        self.name_input = discord.ui.TextInput(label="Nome do personagem", max_length=100, default=original.get("nome", ""))
        self.age_input = discord.ui.TextInput(label="Idade aparente", placeholder="Ex.: 28 anos", max_length=80, default=original.get("idade", ""))
        self.appearance_input = discord.ui.TextInput(label="Gênero e aparência física", style=discord.TextStyle.paragraph, max_length=750, default=original.get("aparencia", ""))
        self.hair_input = discord.ui.TextInput(label="Cabelo", max_length=300, default=original.get("cabelo", ""))
        self.eyes_input = discord.ui.TextInput(label="Olhos", max_length=300, default=original.get("olhos", ""))
        for field in (self.name_input, self.age_input, self.appearance_input, self.hair_input, self.eyes_input):
            self.add_item(field)

    async def on_submit(self, interaction: discord.Interaction):
        result = write_sheet(interaction.guild_id, interaction.user.id, {
            "nome": str(self.name_input.value).strip(),
            "idade": str(self.age_input.value).strip(),
            "aparencia": str(self.appearance_input.value).strip(),
            "cabelo": str(self.hair_input.value).strip(),
            "olhos": str(self.eyes_input.value).strip(),
        })
        if self.editing:
            await display_sheet(interaction, section="identidade", update=bool(interaction.message), notice="Identidade atualizada e salva.")
            return
        await interaction.response.send_message(
            f"**Identidade registrada:** {discord.utils.escape_mentions(result['nome'])}\nAgora vamos descobrir o que essa alma esconde.",
            view=ProgressView(2), ephemeral=True,
        )


class ConceptModal(discord.ui.Modal, title="ORDER • 2/3 Pecado e visual"):
    def __init__(self, original: dict[str, str], *, editing: bool = False):
        super().__init__(timeout=600)
        self.editing = editing
        self.personality = discord.ui.TextInput(label="Personalidade e postura", style=discord.TextStyle.paragraph, max_length=700, default=original.get("personalidade", ""))
        self.clothes = discord.ui.TextInput(label="Roupas e estilo", style=discord.TextStyle.paragraph, max_length=700, default=original.get("roupas", ""))
        self.gear = discord.ui.TextInput(label="Armas, acessórios, equipamentos", style=discord.TextStyle.paragraph, max_length=650, default=original.get("equipamentos", ""), placeholder="Se nenhum, escreva 'Nenhum'")
        self.sin = discord.ui.TextInput(label="Pecado cometido em vida", style=discord.TextStyle.paragraph, max_length=850, default=original.get("pecado", ""))
        self.supernatural = discord.ui.TextInput(label="Marcas e detalhes sobrenaturais", style=discord.TextStyle.paragraph, max_length=650, default=original.get("sobrenatural", ""), placeholder="Se nenhum, escreva 'Nenhum'")
        for field in (self.personality, self.clothes, self.gear, self.sin, self.supernatural):
            self.add_item(field)

    async def on_submit(self, interaction: discord.Interaction):
        write_sheet(interaction.guild_id, interaction.user.id, {
            "personalidade": str(self.personality.value).strip(),
            "roupas": str(self.clothes.value).strip(),
            "equipamentos": str(self.gear.value).strip(),
            "pecado": str(self.sin.value).strip(),
            "sobrenatural": str(self.supernatural.value).strip(),
        })
        if self.editing:
            await display_sheet(interaction, section="conceito", update=bool(interaction.message), notice="Pecado e visual atualizados e salvos.")
            return
        await interaction.response.send_message(
            "**O pecado foi registrado.** Falta definir a pose e, se quiser, aprofundar a história.",
            view=ProgressView(3), ephemeral=True,
        )


class StoryModal(discord.ui.Modal, title="ORDER • 3/3 História e pose"):
    def __init__(self, original: dict[str, str], *, editing: bool = False):
        super().__init__(timeout=600)
        self.editing = editing
        self.pose = discord.ui.TextInput(label="Pose para a arte (obrigatório)", style=discord.TextStyle.paragraph, max_length=600, default=original.get("pose", ""))
        self.past = discord.ui.TextInput(label="Passado antes da morte (opcional)", style=discord.TextStyle.paragraph, required=False, max_length=850, default=original.get("passado", ""))
        self.goal = discord.ui.TextInput(label="Objetivo como Searcher (opcional)", style=discord.TextStyle.paragraph, required=False, max_length=650, default=original.get("objetivo", ""))
        self.fear = discord.ui.TextInput(label="Medo ou fraqueza (opcional)", required=False, max_length=300, default=original.get("medo", ""))
        self.bond = discord.ui.TextInput(label="Vínculo importante (opcional)", required=False, max_length=300, default=original.get("vinculo", ""))
        for field in (self.pose, self.past, self.goal, self.fear, self.bond):
            self.add_item(field)

    async def on_submit(self, interaction: discord.Interaction):
        result = write_sheet(interaction.guild_id, interaction.user.id, {
            "pose": str(self.pose.value).strip(),
            "passado": str(self.past.value).strip(),
            "objetivo": str(self.goal.value).strip(),
            "medo": str(self.fear.value).strip(),
            "vinculo": str(self.bond.value).strip(),
        })
        await display_sheet(interaction, section="historia" if self.editing else "resumo", update=self.editing and bool(interaction.message), notice="História atualizada e salva." if self.editing else "**Contrato registrado.** Seu dossiê está pronto.")


def phase_modal(phase: int, sheet: dict[str, str], *, editing: bool = False) -> discord.ui.Modal:
    if phase == 1:
        return IdentityModal(sheet, editing=editing)
    if phase == 2:
        return ConceptModal(sheet, editing=editing)
    return StoryModal(sheet, editing=editing)


class ResourcesModal(discord.ui.Modal, title="ORDER • Recursos do contrato"):
    def __init__(self, original: dict[str, str]):
        super().__init__(timeout=600)
        self.inputs = {}
        for key, label in RESOURCE_FIELDS:
            item = discord.ui.TextInput(label=label, required=False, max_length=40, default=original.get(key, ""), placeholder="Valor definido pelo Mestre; vazio = A definir")
            self.inputs[key] = item
            self.add_item(item)

    async def on_submit(self, interaction: discord.Interaction):
        if is_linked(DATABASE, interaction.guild_id, interaction.user.id):
            await interaction.response.send_message("Os recursos desta ficha vêm do tabletop. Altere-os na mesa ou use `/desvincular_tabletop` para voltar ao registro manual.", ephemeral=True)
            return
        write_sheet(interaction.guild_id, interaction.user.id, {key: str(item.value).strip().replace("\n", " ").replace("\r", " ") for key, item in self.inputs.items()})
        await display_sheet(interaction, section="recursos", update=bool(interaction.message), notice="Recursos salvos. Nenhum valor é calculado automaticamente.")


class PortraitModal(discord.ui.Modal, title="ORDER • Retrato do Searcher"):
    def __init__(self):
        super().__init__(timeout=600)
        self.upload = discord.ui.FileUpload(required=True, min_values=1, max_values=1)
        self.add_item(discord.ui.Label(text="Arte do seu personagem", description="PNG, JPG ou WebP · até 8 MB · fundo transparente é aceito", component=self.upload))

    async def on_submit(self, interaction: discord.Interaction):
        await accept_portrait(interaction, self.upload.values[0], update=bool(interaction.message))


class ProgressView(discord.ui.View):
    def __init__(self, phase: int):
        super().__init__(timeout=900)
        self.phase = phase

    @discord.ui.button(label="Continuar criação", style=discord.ButtonStyle.primary, emoji="✒️")
    async def continue_sheet(self, interaction: discord.Interaction, button: discord.ui.Button):
        sheet = read_sheet(interaction.guild_id, interaction.user.id)
        await interaction.response.send_modal(phase_modal(self.phase, sheet))


class SectorView(discord.ui.View):
    def __init__(self, owner_id: int):
        super().__init__(timeout=900)
        self.owner_id = owner_id
        selector = discord.ui.Select(
            placeholder="Escolha um dos cinco Setores do ORDER",
            options=[discord.SelectOption(label=label, description=desc) for label, desc in SECTORS.items()],
        )
        selector.callback = self.chosen
        self.selector = selector
        self.add_item(selector)

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.owner_id:
            await interaction.response.send_message("Esse contrato pertence a outro jogador.", ephemeral=True)
            return False
        return True

    async def chosen(self, interaction: discord.Interaction):
        sector = self.selector.values[0]
        sheet = write_sheet(interaction.guild_id, interaction.user.id, {"setor": sector})
        phase = next_phase(sheet)
        if phase:
            await interaction.response.send_modal(phase_modal(phase, sheet))
        else:
            await display_sheet(interaction, update=bool(interaction.message), notice=f"Setor atualizado para **{sector}**.")


class EditView(discord.ui.View):
    def __init__(self, owner_id: int):
        super().__init__(timeout=900)
        self.owner_id = owner_id
        selection = discord.ui.Select(
            placeholder="Qual seção você quer corrigir?",
            options=[
                discord.SelectOption(label="Setor", value="setor", description="Uma das cinco classes"),
                discord.SelectOption(label="1. Identidade", value="1"),
                discord.SelectOption(label="2. Pecado e visual", value="2"),
                discord.SelectOption(label="3. História e pose", value="3"),
                discord.SelectOption(label="4. Recursos", value="recursos", description="Moral, Sanidade, Confiança e Hell of Fame"),
                discord.SelectOption(label="5. Retrato", value="retrato", description="Envie a arte do seu personagem"),
            ],
        )
        selection.callback = self.edit_choice
        self.selection = selection
        self.add_item(selection)

    async def interaction_check(self, interaction: discord.Interaction):
        if interaction.user.id != self.owner_id:
            await interaction.response.send_message("Você só pode editar sua própria ficha.", ephemeral=True)
            return False
        return True

    async def edit_choice(self, interaction: discord.Interaction):
        value = self.selection.values[0]
        if value == "setor":
            await interaction.response.send_message("Escolha o novo Setor:", view=SectorView(interaction.user.id), ephemeral=True)
        elif value == "retrato":
            await interaction.response.send_modal(PortraitModal())
        elif value == "recursos":
            await interaction.response.send_modal(ResourcesModal(read_sheet(interaction.guild_id, interaction.user.id)))
        else:
            sheet = read_sheet(interaction.guild_id, interaction.user.id)
            await interaction.response.send_modal(phase_modal(int(value), sheet, editing=True))


class DeleteView(discord.ui.View):
    def __init__(self, owner_id: int):
        super().__init__(timeout=120)
        self.owner_id = owner_id

    async def interaction_check(self, interaction: discord.Interaction):
        if interaction.user.id != self.owner_id:
            await interaction.response.send_message("Apenas o dono pode apagar esta ficha.", ephemeral=True)
            return False
        return True

    @discord.ui.button(label="Sim, apagar minha ficha", style=discord.ButtonStyle.danger)
    async def confirm(self, interaction: discord.Interaction, button: discord.ui.Button):
        delete_sheet(interaction.guild_id, interaction.user.id)
        await interaction.response.edit_message(content="Sua ficha e o retrato foram apagados do banco local do bot.", embed=None, attachments=[], view=None)

    @discord.ui.button(label="Cancelar", style=discord.ButtonStyle.secondary)
    async def cancel(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.edit_message(content="Operação cancelada.", view=None)


class SheetSectionSelect(discord.ui.Select):
    def __init__(self, section: str):
        super().__init__(custom_id="order:sheet:section", placeholder="Abrir uma seção do dossiê", row=0, options=[
            discord.SelectOption(label=label, value=key, description=description, emoji=emoji, default=key == section)
            for key, (label, description, emoji) in SHEET_SECTIONS.items()
        ])

    async def callback(self, interaction: discord.Interaction):
        await display_sheet(interaction, section=self.values[0], update=True)


class SheetActionsView(discord.ui.View):
    def __init__(self, section: str = "resumo"):
        super().__init__(timeout=None)
        self.add_item(SheetSectionSelect(section))

    async def interaction_check(self, interaction: discord.Interaction):
        if not interaction.guild_id or not read_sheet(interaction.guild_id, interaction.user.id):
            await interaction.response.send_message("Comece sua ficha com `/criar_ficha` dentro do servidor.", ephemeral=True)
            return False
        return True

    @discord.ui.button(label="Editar ficha", custom_id="order:sheet:edit", style=discord.ButtonStyle.primary, emoji="✒️", row=1)
    async def edit(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message("Qual parte deseja mudar?", view=EditView(interaction.user.id), ephemeral=True)

    @discord.ui.button(label="Recursos", custom_id="order:sheet:resources", style=discord.ButtonStyle.secondary, emoji="⚖️", row=1)
    async def resources(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_modal(ResourcesModal(read_sheet(interaction.guild_id, interaction.user.id)))

    @discord.ui.button(label="Retrato", custom_id="order:sheet:portrait", style=discord.ButtonStyle.secondary, emoji="🖼️", row=1)
    async def portrait(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_modal(PortraitModal())

    @discord.ui.button(label="Baixar ficha", custom_id="order:sheet:export", style=discord.ButtonStyle.secondary, emoji="📥", row=1)
    async def export(self, interaction: discord.Interaction, button: discord.ui.Button):
        await send_export(interaction)

    @discord.ui.button(label="Atualizar", custom_id="order:sheet:refresh", style=discord.ButtonStyle.secondary, emoji="🔄", row=2)
    async def refresh(self, interaction: discord.Interaction, button: discord.ui.Button):
        await display_sheet(interaction, update=True)

    @discord.ui.button(label="Prompt de arte", custom_id="order:sheet:art", style=discord.ButtonStyle.secondary, emoji="🎨", row=2)
    async def art(self, interaction: discord.Interaction, button: discord.ui.Button):
        await send_prompt(interaction)

    @discord.ui.button(label="Apagar", custom_id="order:sheet:delete", style=discord.ButtonStyle.danger, emoji="🗑️", row=2)
    async def delete(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message("Confirma apagar **a ficha e o retrato** deste servidor?", view=DeleteView(interaction.user.id), ephemeral=True)

    async def on_error(self, interaction: discord.Interaction, error: Exception, item: discord.ui.Item):
        logging.error("Erro no painel da ficha", exc_info=(type(error), error, error.__traceback__))
        if not interaction.response.is_done():
            await interaction.response.send_message("Não consegui atualizar agora. Abra novamente com `/minha_ficha`.", ephemeral=True)
        else:
            await interaction.followup.send("Não consegui atualizar agora. Abra novamente com `/minha_ficha`.", ephemeral=True)


class ResumeView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=900)

    @discord.ui.button(label="Retomar", style=discord.ButtonStyle.primary, emoji="✒️")
    async def continue_sheet(self, interaction: discord.Interaction, button: discord.ui.Button):
        sheet = read_sheet(interaction.guild_id, interaction.user.id)
        if not sheet.get("setor"):
            await interaction.response.send_message("Selecione seu Setor:", view=SectorView(interaction.user.id), ephemeral=True)
        else:
            phase = next_phase(sheet)
            if phase:
                await interaction.response.send_modal(phase_modal(phase, sheet))
            else:
                await show_sheet(interaction)

    @discord.ui.button(label="Editar / opções", style=discord.ButtonStyle.secondary)
    async def options(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message("Opções da sua ficha:", view=SheetActionsView(), ephemeral=True)


async def start_sheet(interaction: discord.Interaction):
    if server_id(interaction) is None:
        await interaction.response.send_message("Use este comando dentro do servidor do ORDER.", ephemeral=True)
        return
    sheet = read_sheet(interaction.guild_id, interaction.user.id)
    if sheet:
        await interaction.response.send_message(
            "**Você já tem um contrato aberto.** Pode retomar sua ficha ou editar as respostas.",
            view=ResumeView(), ephemeral=True,
        )
    else:
        await interaction.response.send_message(
            "**ORDER • Registro de Searcher**\n"
            f"{OPENING}\n\n"
            "Você morreu, mas seu contrato ainda não terminou. Selecione seu Setor para iniciar a ficha.\n\n"
            "As respostas são visíveis apenas para você e ficam salvas no bot.",
            view=SectorView(interaction.user.id), ephemeral=True,
        )


async def show_sheet(interaction: discord.Interaction):
    await display_sheet(interaction)


async def display_sheet(interaction: discord.Interaction, *, section: str = "resumo", update: bool = False, notice: str | None = None):
    if server_id(interaction) is None:
        await interaction.response.send_message("Use dentro do servidor.", ephemeral=True)
        return
    sheet = read_sheet(interaction.guild_id, interaction.user.id)
    if not sheet:
        if interaction.response.is_done():
            await interaction.edit_original_response(content="Você ainda não criou sua ficha. Use `/criar_ficha`.", embed=None, attachments=[], view=None)
        else:
            await interaction.response.send_message("Você ainda não criou sua ficha. Use `/criar_ficha`.", ephemeral=True)
        return
    update = update and interaction.message is not None
    if not interaction.response.is_done():
        await interaction.response.defer(ephemeral=True, thinking=not update)
    embed = sheet_embed(sheet, owner=interaction.user, section=section)
    files = []
    if section == "resumo":
        try:
            card = await asyncio.to_thread(render_dossier, sheet, owner_name=interaction.user.display_name, guild_id=interaction.guild_id, user_id=interaction.user.id, registered=complete(sheet))
            files.append(discord.File(card, filename="ORDER-dossie.png"))
            embed.set_image(url="attachment://ORDER-dossie.png")
        except (OSError, ValueError):
            logging.exception("Não foi possível desenhar o cartão; exibindo a ficha em texto.")
            embed.add_field(name="Pecado em vida", value=safe_embed_text(get_text(sheet, "pecado")), inline=False)
            embed.add_field(name="Personalidade", value=safe_embed_text(get_text(sheet, "personalidade")), inline=False)
    await interaction.edit_original_response(content=notice, embed=embed, attachments=files, view=SheetActionsView(section), allowed_mentions=discord.AllowedMentions.none())


async def accept_portrait(interaction: discord.Interaction, attachment: discord.Attachment, *, update: bool = False):
    if not interaction.guild_id or not read_sheet(interaction.guild_id, interaction.user.id):
        await interaction.response.send_message("Crie sua ficha primeiro com `/criar_ficha`.", ephemeral=True)
        return
    if attachment.size > 8 * 1024 * 1024:
        await interaction.response.send_message("Envie uma imagem de até 8 MB.", ephemeral=True)
        return
    await interaction.response.defer(ephemeral=True, thinking=not (update and interaction.message is not None))
    try:
        data = await attachment.read()
        await asyncio.to_thread(save_portrait, data, interaction.guild_id, interaction.user.id)
    except (ValueError, discord.HTTPException) as exc:
        message = str(exc) if isinstance(exc, ValueError) else "Não consegui baixar a imagem do Discord. Tente anexar novamente."
        if update and interaction.message is not None:
            await interaction.followup.send(message, ephemeral=True)
        else:
            await interaction.edit_original_response(content=message)
        return
    await display_sheet(interaction, update=update, notice="Retrato salvo no dossiê.")


async def send_prompt(interaction: discord.Interaction):
    if server_id(interaction) is None:
        await interaction.response.send_message("Use dentro do servidor.", ephemeral=True)
        return
    sheet = read_sheet(interaction.guild_id, interaction.user.id)
    if not complete(sheet):
        await interaction.response.send_message(
            "Sua ficha ainda não está completa. Termine as três etapas com `/criar_ficha` antes de gerar o prompt.", ephemeral=True,
        )
        return
    prompt = render_prompt(sheet)
    instructions = (
        "**Seu prompt visual oficial de ORDER está pronto.**\n"
        "Baixe o `.txt` e **use o prompt em um ChatGPT Plus para criar seu personagem**: cole o texto e "
        "**anexe as imagens de referência oficiais do ORDER**, conforme o prompt exige.\n"
        "Depois, continue: envie a imagem com `/retrato_order` e confira tudo em `/minha_ficha`.\n"
        "Este bot **não cria a imagem automaticamente**."
    )
    if REGISTRO_URL:
        instructions += f"\nPasso a passo no livro de registro: {REGISTRO_URL}"
    if REFERENCE_URL:
        instructions += f"\nReferências oficiais: {REFERENCE_URL}"
    await interaction.response.send_message(
        instructions,
        file=download_file(prompt, f"ORDER-prompt-{slug(get_text(sheet, 'nome'))}.txt"),
        ephemeral=True,
    )


async def send_export(interaction: discord.Interaction):
    if server_id(interaction) is None:
        await interaction.response.send_message("Use dentro do servidor.", ephemeral=True)
        return
    sheet = read_sheet(interaction.guild_id, interaction.user.id)
    if not sheet:
        await interaction.response.send_message("Sem ficha para exportar. Use `/criar_ficha`.", ephemeral=True)
        return
    name = slug(get_text(sheet, "nome"))
    await interaction.response.defer(ephemeral=True, thinking=True)
    files = [download_file(markdown_sheet(sheet), f"ORDER-ficha-{name}.md"), download_file(json.dumps(sheet, ensure_ascii=False, indent=2), f"ORDER-ficha-{name}.json")]
    try:
        card = await asyncio.to_thread(render_dossier, sheet, owner_name=interaction.user.display_name, guild_id=interaction.guild_id, user_id=interaction.user.id, registered=complete(sheet))
        files.append(discord.File(card, filename=f"ORDER-dossie-{name}.png"))
    except (OSError, ValueError):
        logging.exception("Exportação do cartão indisponível; preservando Markdown e JSON.")
    await interaction.edit_original_response(content="Seu dossiê para guardar: ficha em Markdown, backup JSON e cartão visual em PNG (quando disponível).", attachments=files)


class PanelView(discord.ui.View):
    """Botões persistentes: funcionam após reiniciar o bot."""
    def __init__(self):
        super().__init__(timeout=None)
        if REGISTRO_URL:
            # Botão de link: não usa custom_id e continua valendo após reiniciar o bot.
            self.add_item(discord.ui.Button(label="Abrir o livro de registro", url=REGISTRO_URL, emoji="📖", row=1))

    @discord.ui.button(label="Criar / retomar ficha", custom_id="order:panel:criar", style=discord.ButtonStyle.primary, emoji="✒️")
    async def create(self, interaction: discord.Interaction, button: discord.ui.Button):
        await start_sheet(interaction)

    @discord.ui.button(label="Minha ficha", custom_id="order:panel:ver", style=discord.ButtonStyle.secondary, emoji="📜")
    async def show(self, interaction: discord.Interaction, button: discord.ui.Button):
        await show_sheet(interaction)

    @discord.ui.button(label="Gerar prompt de arte", custom_id="order:panel:prompt", style=discord.ButtonStyle.secondary, emoji="🎨")
    async def prompt(self, interaction: discord.Interaction, button: discord.ui.Button):
        await send_prompt(interaction)


class OrderBot(commands.Bot):
    async def setup_hook(self):
        self.add_view(PanelView())
        self.add_view(SheetActionsView())
        if GUILD_ID:
            guild = discord.Object(id=int(GUILD_ID))
            self.tree.copy_global_to(guild=guild)
            await self.tree.sync(guild=guild)
            logging.info("Comandos sincronizados no servidor ORDER %s", GUILD_ID)
        else:
            await self.tree.sync()
            logging.info("Comandos globais sincronizados. Podem levar um tempo para aparecer.")
        secret = os.environ.get("TABLETOP_BRIDGE_SECRET", "").strip()
        self.tabletop_bridge = None
        if secret and GUILD_ID:
            self.tabletop_bridge = TabletopBridge(DATABASE, secret, GUILD_ID, int(os.environ.get("TABLETOP_BRIDGE_PORT", "4190")))
            await self.tabletop_bridge.start()

    async def close(self):
        bridge = getattr(self, "tabletop_bridge", None)
        if bridge:
            await bridge.close()
        await super().close()


intents = discord.Intents.default()
intents.message_content = False  # Não precisamos ler as conversas dos jogadores.
bot = OrderBot(command_prefix=commands.when_mentioned, intents=intents, allowed_mentions=discord.AllowedMentions.none())


@bot.tree.command(name="criar_ficha", description="Começar ou continuar a ficha do seu Searcher.")
async def criar_ficha(interaction: discord.Interaction):
    await start_sheet(interaction)


@bot.tree.command(name="minha_ficha", description="Ver sua ficha privada do ORDER.")
async def minha_ficha(interaction: discord.Interaction):
    await show_sheet(interaction)


@bot.tree.command(name="retrato_order", description="Adicionar ou trocar a arte da sua ficha do ORDER.")
@app_commands.describe(imagem="Arte do seu personagem em PNG, JPG ou WebP, até 8 MB.")
async def retrato_order(interaction: discord.Interaction, imagem: discord.Attachment):
    await accept_portrait(interaction, imagem)


@bot.tree.command(name="vincular_tabletop", description="Conectar sua ficha ao personagem do tabletop por um código privado.")
@app_commands.describe(codigo="Código temporário gerado na aba Discord da sua ficha no tabletop.")
async def vincular_tabletop(interaction: discord.Interaction, codigo: str):
    if not interaction.guild_id:
        await interaction.response.send_message("Use este comando no servidor do ORDER.", ephemeral=True)
        return
    try:
        character_name = consume_code(DATABASE, interaction.guild_id, interaction.user.id, codigo)
    except ValueError as exc:
        await interaction.response.send_message(str(exc), ephemeral=True)
        return
    await interaction.response.send_message(f"**Ficha vinculada a {safe_embed_text(character_name, 100)}.**\nVolte ao tabletop e clique em **Confirmar vínculo / atualizar**. Vida, Moral, Sanidade, Confiança coletiva e Hell of Fame passarão a vir da mesa. Sua história e seu retrato continuam preservados.\n\nAbra `/minha_ficha` para consultar os recursos atualizados.", ephemeral=True)


@bot.tree.command(name="desvincular_tabletop", description="Desconectar sua ficha do tabletop e voltar ao registro manual de recursos.")
async def desvincular_tabletop(interaction: discord.Interaction):
    if not interaction.guild_id:
        await interaction.response.send_message("Use dentro do servidor do ORDER.", ephemeral=True)
        return
    unlink(DATABASE, interaction.guild_id, interaction.user.id)
    if read_sheet(interaction.guild_id, interaction.user.id):
        write_sheet(interaction.guild_id, interaction.user.id, {"tabletop_synced_at": "", "tabletop_campaign": "", "tabletop_character": ""})
    await interaction.response.send_message("Vínculo removido. Os valores atuais foram mantidos; você pode voltar a editá-los pelo botão Recursos.", ephemeral=True)


@bot.tree.command(name="prompt_order", description="Baixar o prompt oficial de arte preenchido com seu personagem.")
async def prompt_order(interaction: discord.Interaction):
    await send_prompt(interaction)


@bot.tree.command(name="baixar_ficha", description="Baixar sua ficha em Markdown, JSON e cartão PNG.")
async def baixar_ficha(interaction: discord.Interaction):
    await send_export(interaction)


@bot.tree.command(name="editar_ficha", description="Editar uma parte da sua ficha do ORDER.")
async def editar_ficha(interaction: discord.Interaction):
    if server_id(interaction) is None:
        await interaction.response.send_message("Use dentro do servidor.", ephemeral=True)
        return
    if not read_sheet(interaction.guild_id, interaction.user.id):
        await interaction.response.send_message("Comece com `/criar_ficha` primeiro.", ephemeral=True)
        return
    await interaction.response.send_message("Qual parte deseja editar?", view=EditView(interaction.user.id), ephemeral=True)


@bot.tree.command(name="apagar_ficha", description="Apagar a sua ficha do banco local do bot.")
async def apagar_ficha(interaction: discord.Interaction):
    if server_id(interaction) is None:
        await interaction.response.send_message("Use dentro do servidor.", ephemeral=True)
        return
    await interaction.response.send_message("Tem certeza que deseja **apagar sua ficha e o retrato** deste servidor?", view=DeleteView(interaction.user.id), ephemeral=True)


@bot.tree.command(name="painel_order", description="Publicar o painel de criação de fichas neste canal (admin).")
@app_commands.default_permissions(manage_guild=True)
async def painel_order(interaction: discord.Interaction):
    if not interaction.guild or not isinstance(interaction.user, discord.Member) or not interaction.user.guild_permissions.manage_guild:
        await interaction.response.send_message("Apenas administradores/gerentes do servidor podem publicar o painel.", ephemeral=True)
        return
    embed = discord.Embed(
        title="ORDER — CONTRATO DE ALMA",
        description=(
            f"{OPENING}\n\n"
            "**Você morreu. Seu julgamento não terminou.**\n\n"
            "Crie seu **Searcher** com a orientação do bot:\n"
            "• Escolha um dos cinco Setores.\n"
            "• Defina identidade, pecado, aparência e história.\n"
            "• Salve sua ficha e receba um prompt no estilo artístico oficial de ORDER.\n"
            "• Use o prompt em um ChatGPT Plus para criar seu personagem, e depois continue aqui.\n\n"
            "**Clique abaixo para começar.** Sua ficha será privada."
        ),
        color=0x611D37,
    )
    embed.set_image(url="attachment://ORDER-logo.png")
    embed.set_footer(text="ARQUIVO CENTRAL · ficha visual · salvamento automático")
    await interaction.response.send_message("Painel enviado neste canal.", ephemeral=True)
    await interaction.channel.send(embed=embed, file=discord.File(ASSETS / "logo.png", filename="ORDER-logo.png"), view=PanelView(), allowed_mentions=discord.AllowedMentions.none())


@bot.event
async def on_ready():
    logging.info("ORDER online como %s (id=%s)", bot.user, bot.user.id)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    ensure_db()
    if not TOKEN:
        raise SystemExit("Configure DISCORD_TOKEN no arquivo .env (veja .env.example).")
    bot.run(TOKEN)
