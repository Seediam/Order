"""Cartão de ficha do ORDER: arte local, dados do jogador e fontes do projeto."""
from __future__ import annotations

import io
import re
import warnings
from functools import lru_cache
from pathlib import Path
from uuid import uuid4

from PIL import Image, ImageDraw, ImageFont, ImageOps, UnidentifiedImageError

ASSETS = Path(__file__).resolve().parent / "assets"
PORTRAITS = Path(__file__).resolve().parent / "data" / "portraits"
RESOURCE_FIELDS = (
    ("moral", "Moral"),
    ("sanidade", "Sanidade"),
    ("confianca", "Confiança coletiva"),
    ("hell_of_fame", "Hell of Fame"),
)
INK = "#30232a"
MUTED = "#705b60"
ROSE = "#e43b80"
PAPER = "#e9dece"


@lru_cache(maxsize=40)
def font(size: int, face: str = "body") -> ImageFont.FreeTypeFont:
    names = {
        "body": "CormorantGaramond-Medium.ttf",
        "title": "CormorantGaramond-Bold.ttf",
        "label": "IMFellEnglishSC-Regular.ttf",
    }
    return ImageFont.truetype(str(ASSETS / names[face]), size)


def clean(value: object, fallback: str = "Não informado") -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    return text or fallback


def shorten(draw: ImageDraw.ImageDraw, value: str, face, width: int) -> str:
    if draw.textlength(value, font=face) <= width:
        return value
    while value and draw.textlength(value + "…", font=face) > width:
        value = value[:-1]
    return value.rstrip() + "…"


def paragraph(draw, text: str, xy, *, width: int, lines: int, size=30, fill=INK):
    face = font(size)
    words = clean(text).split()
    rows: list[str] = []
    row = ""
    for word in words:
        candidate = f"{row} {word}".strip()
        if row and draw.textlength(candidate, font=face) > width:
            rows.append(row)
            row = word
        else:
            row = candidate
    if row:
        rows.append(row)
    overflow = len(rows) > lines
    rows = rows[:lines]
    if overflow:
        rows[-1] += "…"
    x, y = xy
    for index, row in enumerate(rows):
        draw.text((x, y + index * (size + 5)), shorten(draw, row, face, width), font=face, fill=fill)


def portrait_path(guild_id: int, user_id: int) -> Path:
    return PORTRAITS / str(int(guild_id)) / f"{int(user_id)}.png"


def save_portrait(data: bytes, guild_id: int, user_id: int) -> None:
    """Decodifica apenas imagens, limita dimensões e descarta metadados do upload."""
    if len(data) > 8 * 1024 * 1024:
        raise ValueError("Envie uma imagem de até 8 MB.")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(data)) as original:
                if original.format not in {"PNG", "JPEG", "WEBP"}:
                    raise ValueError("Envie o retrato em PNG, JPG ou WebP.")
                if original.width * original.height > 24_000_000:
                    raise ValueError("Use uma imagem de até 24 megapixels.")
                image = ImageOps.exif_transpose(original).convert("RGBA")
                image.thumbnail((1200, 1600), Image.Resampling.LANCZOS)
                target = portrait_path(guild_id, user_id)
                target.parent.mkdir(parents=True, exist_ok=True)
                temporary = target.with_name(f".{target.stem}-{uuid4().hex}.tmp")
                try:
                    image.save(temporary, format="PNG", optimize=True)
                    temporary.replace(target)
                finally:
                    temporary.unlink(missing_ok=True)
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise ValueError("Não consegui abrir essa imagem. Envie PNG, JPG ou WebP válido.") from exc


def render_dossier(sheet: dict[str, str], *, owner_name: str, guild_id: int, user_id: int, registered: bool = False) -> io.BytesIO:
    image = Image.new("RGB", (1280, 900), "#110f15")
    draw = ImageDraw.Draw(image)
    draw.rectangle((20, 20, 1259, 879), outline="#51313f", width=2)
    draw.line((48, 20, 260, 20), fill=ROSE, width=5)
    with Image.open(ASSETS / "logo.png") as source:
        logo = source.convert("RGBA")
        logo.thumbnail((300, 104), Image.Resampling.LANCZOS)
        image.paste(logo, (48, 36), logo)
    draw.text((1228, 49), "ARQUIVO CENTRAL · DIVISÃO DE COBRANÇA", font=font(22, "label"), fill="#da9bb7", anchor="ra")
    draw.text((1228, 85), f"REGISTRO {str(user_id)[-6:]} / DOSSIÊ INDIVIDUAL", font=font(21), fill="#c0b1b8", anchor="ra")

    draw.rectangle((48, 150, 1231, 700), fill=PAPER)
    for y in range(164, 700, 18):
        draw.line((49, y, 1230, y), fill="#e5dacb", width=1)
    draw.line((48, 150, 1231, 150), fill="#a34a69", width=4)
    draw.text((80, 177), "SEARCHER / IDENTIDADE SOB JURISDIÇÃO", font=font(23, "label"), fill="#8c3054")
    name = clean(sheet.get("nome"), "Searcher sem nome")
    name_size = 68
    while name_size > 38 and draw.textlength(name, font=font(name_size, "title")) > 810:
        name_size -= 2
    draw.text((78, 211), shorten(draw, name, font(name_size, "title"), 810), font=font(name_size, "title"), fill=INK)
    draw.text((80, 306), "SETOR", font=font(21, "label"), fill=MUTED)
    draw.text((80, 332), clean(sheet.get("setor"), "A escolher"), font=font(37, "title"), fill=INK)
    draw.text((575, 306), "IDADE APARENTE", font=font(21, "label"), fill=MUTED)
    draw.text((575, 334), shorten(draw, clean(sheet.get("idade")), font(31), 310), font=font(31), fill=INK)
    draw.line((80, 389, 894, 389), fill="#baa6a5", width=1)
    draw.text((80, 409), "PECADO EM VIDA", font=font(22, "label"), fill="#8c3054")
    paragraph(draw, clean(sheet.get("pecado")), (80, 440), width=810, lines=2)
    draw.text((80, 531), "PERSONALIDADE / CONDUTA", font=font(22, "label"), fill="#8c3054")
    paragraph(draw, clean(sheet.get("personalidade")), (80, 562), width=810, lines=3, size=28)

    draw.rectangle((930, 184, 1200, 562), fill="#b09b98", outline=INK, width=2)
    portrait_box = (938, 192, 1193, 531)
    custom_portrait = portrait_path(guild_id, user_id)
    if custom_portrait.is_file():
        with Image.open(custom_portrait) as portrait:
            portrait = ImageOps.contain(portrait.convert("RGBA"), (255, 339), Image.Resampling.LANCZOS)
            image.paste(portrait, (938 + (255 - portrait.width) // 2, 192 + (339 - portrait.height) // 2), portrait)
    else:
        draw.rectangle(portrait_box, fill="#302631")
        draw.ellipse((1008, 246, 1122, 360), fill="#69525e")
        draw.rounded_rectangle((974, 365, 1156, 525), radius=65, fill="#69525e")
        draw.text((1065, 481), "RETRATO PENDENTE", font=font(18, "label"), fill="#f3dce5", anchor="ma")
    draw.text((1065, 537), "IDENTIFICAÇÃO DA ALMA", font=font(17, "label"), fill=INK, anchor="ma")
    draw.rectangle((963, 597, 1171, 666), outline="#923b58", width=2)
    draw.text((1067, 602), "CONTRATO", font=font(23, "label"), fill="#923b58", anchor="ma")
    draw.text((1067, 633), "REGISTRADO" if registered else "EM ABERTO", font=font(23, "label"), fill="#923b58", anchor="ma")

    draw.text((48, 718), "RECURSOS DO CONTRATO", font=font(22, "label"), fill="#dfadc3")
    for index, (key, label) in enumerate(RESOURCE_FIELDS):
        x = 48 + index * 300
        draw.rectangle((x, 757, x + 283, 838), fill="#211923", outline="#51313f", width=1)
        draw.text((x + 16, 765), label.upper(), font=font(19, "label"), fill="#cd95ad")
        value = clean(sheet.get(key), "A definir")
        draw.text((x + 16, 791), shorten(draw, value, font(31, "title"), 250), font=font(31, "title"), fill="#f3e7df")
    draw.text((48, 851), shorten(draw, f"{owner_name} · ficha privada · ORDER", font(20), 850), font=font(20), fill="#9c8d98")
    output = io.BytesIO()
    image.save(output, format="PNG", optimize=True)
    output.seek(0)
    return output
