"""Organização idempotente do servidor ORDER. Execute com --apply para aplicar."""
from __future__ import annotations

import argparse
import asyncio
import json
import os
from pathlib import Path
from urllib.parse import quote

import aiohttp
from dotenv import load_dotenv

BASE = Path(__file__).resolve().parent
load_dotenv(BASE / ".env")
GUILD = os.environ.get("GUILD_ID", "")
STATE = BASE / "data" / "server_setup.json"
ROLES = [
    ("mestre", "⚖ Mestre", 0xDFB872),
    ("searcher", "✒ Searcher", 0xE43B80),
    ("incidencia", "🛡 Incidência", 0xAF5963),
    ("relacao", "🪞 Relação", 0xA580BA),
    ("justica", "⚖ Justiça", 0xD6B877),
    ("socialista", "🤝 Socialista", 0x79A895),
    ("doutrina", "🕯 Doutrina", 0x9C9DBB),
]
CATEGORIES = [
    ("central", "╭・👁 ARQUIVO CENTRAL", "readonly", "1568769393813618748"),
    ("registro", "✒・REGISTRO DE ALMAS", "public", None),
    ("mesa", "🗝・CONTRATOS DO INFERNO", "public", None),
    ("convivio", "☕・ENTRE CONTRATOS", "public", None),
    ("voz", "🔊・SALAS DE SESSÃO", "public", "1568769393813618749"),
    ("mestre", "🔒・ARQUIVO DO MESTRE", "private", None),
]
CHANNELS = [
    ("inicio", "central", "👁・comece-aqui", "Sua entrada no ORDER: leia o guia e registre seu Searcher.", "readonly", 0, None),
    ("regras", "central", "📜・regras-e-convivencia", "Acordos de convivência e cuidados com as cenas da campanha.", "readonly", 0, None),
    ("avisos", "central", "📣・avisos", "Comunicados oficiais do Mestre e novidades do ORDER.", "readonly", 0, None),
    ("ficha", "registro", "✒・criar-personagem", "Crie, consulte e edite sua ficha privada pelos botões do ORDER.", "public", 0, "1568769393813618750"),
    ("galeria", "registro", "🖼・galeria-de-searchers", "Compartilhe sua arte se desejar. A ficha e os recursos permanecem privados.", "public", 0, None),
    ("ajuda", "registro", "❓・duvidas-e-ajuda", "Dúvidas sobre o bot, criação da ficha e participação nas sessões.", "public", 0, None),
    ("sessoes", "mesa", "🎲・agenda-de-sessoes", "Combine horários e confirme presença nas próximas sessões.", "public", 0, None),
    ("contratos", "mesa", "⚔・contratos-e-missoes", "O Mestre publica os contratos disponíveis e seus objetivos.", "readonly", 0, None),
    ("diario", "mesa", "🕯・diario-da-campanha", "Registros revelados pelo Mestre. Evite antecipar segredos das cenas.", "readonly", 0, None),
    ("cartas", "mesa", "🃏・cartas-e-regras", "Referências das cartas e das regras adotadas nesta mesa.", "readonly", 0, None),
    ("tabletop", "mesa", "🖥・tabletop", "Acesso à mesa virtual e vínculo da ficha com o Discord.", "readonly", 0, None),
    ("geral", "convivio", "💬・conversa-geral", "Encontre outras almas entre um contrato e outro.", "public", 0, None),
    ("artes", "convivio", "🎨・artes-e-teorias", "Referências, criações e teorias. Sinalize spoilers antes de publicar.", "public", 0, None),
    ("espera", "voz", "☕・Sala de Espera", "", "public", 2, "1568769393813618751"),
    ("mesa01", "voz", "🎲・Mesa 01 — ORDER", "", "public", 2, None),
    ("reservada", "voz", "🕯・Cena Paralela", "", "public", 2, None),
    ("planejamento", "mestre", "🗂・planejamento", "Notas, cenas e preparação. Área privada do Mestre.", "private", 0, None),
    ("integracoes", "mestre", "🔗・integracoes", "Orientação do anfitrião para a ponte entre tabletop e fichas do Discord.", "private", 0, None),
    ("voz-mestre", "mestre", "⚖・Gabinete do Mestre", "", "private", 2, None),
]
TEXTS = {
    "inicio": ("SEU JULGAMENTO NÃO TERMINOU.", "Bem-vindo ao **ORDER**. A dívida não termina com a morte.\n\n**01 · Leia os acordos** em {regras}.\n**02 · Registre seu Searcher** em {ficha}. Escolha seu Setor e defina quem você foi em vida.\n**03 · Combine sua sessão** em {sessoes}.\n**04 · Entre na mesa virtual** pelo acesso informado em {tabletop}.\n\nDúvidas? Abra {ajuda}. Os ícones da lista de canais indicam o caminho pelo arquivo."),
    "regras": ("ACORDOS ENTRE ALMAS", "**Respeito primeiro.** Trate os participantes com cuidado e evite ataques pessoais.\n\n**Terror com consentimento.** Antes da sessão, combinem temas permitidos e limites. Qualquer pessoa pode pedir pausa ou encerrar uma cena; o Mestre conduz a retomada.\n\n**Separe personagem e jogador.** Conflitos da ficção não autorizam conflitos fora dela.\n\n**Proteja os segredos.** Use a marcação de spoiler e evite revelar cenas que outros ainda não jogaram.\n\n**Compartilhe com permissão.** Combine antes de gravar voz, divulgar fichas, imagens ou trechos da sessão.\n\n**Regras da mesa.** O Mestre informa os valores e procedimentos usados na campanha; este canal não cria atributos ou bônus adicionais."),
    "avisos": ("CIRCULARES DO ARQUIVO", "Este espaço reúne os avisos oficiais do **ORDER**: atualizações, mudanças na mesa e comunicados do Mestre.\n\nPara conversar e tirar dúvidas, use {geral} e {ajuda}. Para horários e presença, use {sessoes}."),
    "ficha": ("ORDER — REGISTRO DE SEARCHER", "**Você morreu. Seu julgamento não terminou.**\n\nEscolha entre **Incidência, Relação, Justiça, Socialista e Doutrina**. Depois, preencha identidade, pecado, aparência e história.\n\n**Sua ficha é privada.** Use os botões abaixo para criar, consultar ou gerar o prompt de arte. Dentro da ficha, **Retrato** recebe sua imagem e **Recursos** registra os valores definidos pelo Mestre.\n\nVocê também pode usar `/minha_ficha`, `/editar_ficha` e `/baixar_ficha`."),
    "galeria": ("ROSTOS SOB CONTRATO", "Compartilhe aqui a arte do seu Searcher, se quiser. Apresente nome e Setor e identifique créditos ou referências da imagem.\n\nPara colocar a arte na ficha, abra `/minha_ficha` e use **Retrato**. Publicar aqui não troca o retrato automaticamente.\n\nSeu prompt está no botão **Prompt de arte**. Envie as referências oficiais junto com ele à ferramenta de ilustração escolhida."),
    "ajuda": ("BALCÃO DE ATENDIMENTO", "Precisa de ajuda? Informe o comando ou botão usado e descreva o que aconteceu. Capturas de tela ajudam; confira se não mostram informações privadas.\n\n**Ficha:** `/criar_ficha` para começar, `/minha_ficha` para consultar.\n**Arte:** botão **Retrato** para enviar imagem; **Prompt de arte** para obter o texto artístico.\n**Sessão:** confirme o horário em {sessoes} e aguarde a orientação do Mestre."),
    "sessoes": ("PRÓXIMA AUDIÊNCIA", "Use este canal para combinar as sessões. Sugestão de registro:\n\n**Contrato:** nome da sessão\n**Data e horário:** informe o fuso\n**Mestre:** responsável pela mesa\n**Participantes:** confirmações de presença\n**Acesso:** link do tabletop e sala de voz\n\nAguarde o Mestre publicar o primeiro agendamento. Se precisar faltar ou se atrasar, avise por aqui."),
    "contratos": ("CONTRATOS EM ABERTO", "O Mestre registra aqui cada missão quando ela estiver disponível.\n\n**Contrato:** título\n**Objetivo conhecido:** o que os Searchers receberam de informação\n**Condições:** acordos e limites da missão\n**Estado:** disponível, em andamento ou encerrado\n\nConsequências e recompensas são definidas pela campanha. Nenhuma missão foi criada automaticamente neste canal."),
    "diario": ("MEMÓRIA DO JULGAMENTO", "Após cada sessão, o Mestre pode publicar um resumo do que já foi revelado.\n\n**Sessão / data**\n**O que aconteceu**\n**Pistas conhecidas**\n**Decisões e consequências**\n**Pendências para a próxima sessão**\n\nUse {geral} para discutir o registro e sinalize spoilers quando necessário."),
    "cartas": ("ÍNDICE DAS REGRAS", "Este canal reúne as referências adotadas pelo Mestre.\n\nO ORDER distingue o **baralho de ações** do baralho de **Formação / perícias**. A ficha registra Moral, Sanidade, Confiança coletiva e Hell of Fame.\n\nOs valores, cartas disponíveis e efeitos válidos são os da versão de regras escolhida para a campanha. O Mestre publica os documentos vigentes e resolve dúvidas em {ajuda}."),
    "tabletop": ("A MESA E O ARQUIVO", "O anfitrião publica aqui o endereço de acesso ao **ORDER Tabletop** antes da sessão.\n\n**Para vincular sua ficha:**\n1. Crie sua ficha no Discord.\n2. Entre no tabletop e abra a ficha de um personagem que pertence a você.\n3. Na aba **Discord**, gere um código privado de vínculo.\n4. Aqui no servidor, use `/vincular_tabletop codigo:SEU_CODIGO`.\n5. Volte à aba Discord e confirme o vínculo.\n\nCom a ponte ativa no anfitrião, os recursos do tabletop atualizam a ficha vinculada. Abra `/minha_ficha` para consultar os valores atuais. Códigos expiram em 10 minutos; não os publique em canais."),
    "geral": ("ENTRE UM CONTRATO E OUTRO", "Este é o espaço para conversa fora de personagem, apresentação de novos participantes e ideias para a mesa.\n\nMarque spoilers e respeite os acordos de {regras}. A próxima sessão é combinada em {sessoes}."),
    "artes": ("FRAGMENTOS DO INFERNO", "Compartilhe referências visuais, trilhas, criações e teorias sobre a campanha. Informe créditos quando conhecidos e sinalize spoilers.\n\nAs artes finalizadas dos personagens ficam em {galeria}. O retrato da ficha é enviado pelo botão **Retrato** do bot."),
    "planejamento": ("GABINETE DO MESTRE", "Área privada para preparar cenas, NPCs, pistas e consequências. O acesso é reservado ao dono do servidor, ao bot e a quem receber o cargo **⚖ Mestre**.\n\n**Preparação sugerida:** objetivo da sessão, cenas disponíveis, pistas essenciais, limites combinados e consequências possíveis.\n\nOs jogadores não recebem esse cargo automaticamente."),
    "integracoes": ("PONTE TABLETOP → DISCORD", "A ponte conecta o servidor do tabletop ao banco de fichas do bot. Cada jogador confirma sua identidade por um código temporário.\n\n**Recursos enviados:** Vida, Moral, Sanidade, Confiança coletiva e Hell of Fame. O tabletop é a referência para os valores sincronizados; mudanças manuais no Discord podem ser substituídas na próxima sincronização.\n\n**No mesmo computador:** use a ponte local em `127.0.0.1:4190`. Bot e tabletop precisam estar em execução. A configuração e a chave ficam nos arquivos `.env` do anfitrião.\n\nA ficha privada já enviada não se transforma em uma mensagem pública: abra `/minha_ficha` novamente para consultar os dados atuais. Nunca publique tokens ou chaves neste canal."),
}


async def run(apply: bool):
    if not apply:
        for _, name, _, _ in CATEGORIES:
            print(name)
        print(f"Plano: {len(CHANNELS)} canais/salas e {len(ROLES)} cargos. Use --apply para aplicar.")
        return
    token = os.environ.get("DISCORD_TOKEN", "")
    manifest = json.loads(STATE.read_text(encoding="utf-8")) if STATE.exists() else {"roles": {}, "categories": {}, "channels": {}, "messages": {}}
    def save():
        STATE.parent.mkdir(parents=True, exist_ok=True)
        STATE.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    async with aiohttp.ClientSession(headers={"Authorization": f"Bot {token}", "X-Audit-Log-Reason": quote("Organização do ORDER solicitada pelo dono do servidor")}, timeout=aiohttp.ClientTimeout(total=25)) as session:
        async def api(method, route, payload=None):
            for _ in range(5):
                async with session.request(method, "https://discord.com/api/v10/" + route, json=payload) as response:
                    data = await response.json() if response.status != 204 else None
                    if response.status == 429:
                        await asyncio.sleep(min(float(data.get("retry_after", 2)), 30))
                        continue
                    if response.status >= 400:
                        raise RuntimeError(f"Discord HTTP {response.status} em {route}: {data.get('message', 'falha')}")
                    return data
            raise RuntimeError("Discord limitou as operações; execute novamente para retomar.")
        me = await api("GET", "users/@me")
        roles = await api("GET", f"guilds/{GUILD}/roles")
        member = await api("GET", f"guilds/{GUILD}/members/{me['id']}")
        bits = 0
        for role in roles:
            if role["id"] == GUILD or role["id"] in member["roles"]:
                bits |= int(role["permissions"])
        if not bits & 8 and (not bits & 16 or not bits & (1 << 28)):
            raise RuntimeError("O bot precisa de Gerenciar canais e Gerenciar cargos dentro do servidor.")
        channels = await api("GET", f"guilds/{GUILD}/channels")
        before = BASE / "data" / "server_structure_before.json"
        if not before.exists():
            before.write_text(json.dumps({"roles": roles, "channels": channels}, ensure_ascii=False, indent=2), encoding="utf-8")
        for key, name, color in ROLES:
            role = next((r for r in roles if r["id"] == manifest["roles"].get(key) or r["name"] == name), None)
            if not role:
                role = await api("POST", f"guilds/{GUILD}/roles", {"name": name, "color": color, "permissions": "0", "hoist": key in {"mestre", "searcher"}, "mentionable": False})
                roles.append(role)
            manifest["roles"][key] = role["id"]
            save()

        allow = 1024 | 2048 | 16384 | 32768 | 65536 | 1048576 | 2097152
        def overwrites(mode):
            values = [{"id": me["id"], "type": 1, "allow": str(allow), "deny": "0"}]
            if mode != "public":
                deny = 1024 if mode == "private" else 2048 | (1 << 35) | (1 << 36) | (1 << 38)
                values += [{"id": GUILD, "type": 0, "allow": "0", "deny": str(deny)}, {"id": manifest["roles"]["mestre"], "type": 0, "allow": str(allow), "deny": "0"}]
            return values
        for index, (key, name, mode, old_id) in enumerate(CATEGORIES):
            category = next((c for c in channels if c["id"] in {manifest["categories"].get(key), old_id} or c["type"] == 4 and c["name"] == name), None)
            payload = {"name": name, "type": 4, "position": index, "permission_overwrites": overwrites(mode)}
            if category:
                payload.pop("type")
                category = await api("PATCH", f"channels/{category['id']}", payload)
            else:
                category = await api("POST", f"guilds/{GUILD}/channels", payload)
                channels.append(category)
            manifest["categories"][key] = category["id"]
            save()
        for index, (key, parent, name, topic, mode, kind, old_id) in enumerate(CHANNELS):
            channel = next((c for c in channels if c["id"] in {manifest["channels"].get(key), old_id} or c["type"] == kind and c["name"] == name), None)
            payload = {"name": name, "type": kind, "parent_id": manifest["categories"][parent], "position": index, "permission_overwrites": overwrites(mode)}
            if kind == 0:
                payload.update(topic=topic, rate_limit_per_user=3 if mode == "public" and key != "ficha" else 0)
            elif key in {"mesa01", "reservada"}:
                payload["user_limit"] = 8 if key == "mesa01" else 4
            if channel:
                payload.pop("type")
                channel = await api("PATCH", f"channels/{channel['id']}", payload)
            else:
                channel = await api("POST", f"guilds/{GUILD}/channels", payload)
                channels.append(channel)
            manifest["channels"][key] = channel["id"]
            save()
            print("Canal preparado:", channel["name"], flush=True)
        mentions = {key: f"<#{value}>" for key, value in manifest["channels"].items()}
        for key, (title, text) in TEXTS.items():
            channel_id = manifest["channels"][key]
            payload = {"embeds": [{"title": title, "description": text.format(**mentions), "color": 0xE43B80, "footer": {"text": "ORDER · ARQUIVO CENTRAL"}}], "allowed_mentions": {"parse": []}}
            if key == "ficha":
                payload["components"] = [{"type": 1, "components": [{"type": 2, "label": "Criar / retomar ficha", "style": 1, "custom_id": "order:panel:criar", "emoji": {"name": "✒️"}}, {"type": 2, "label": "Minha ficha", "style": 2, "custom_id": "order:panel:ver", "emoji": {"name": "📜"}}, {"type": 2, "label": "Prompt de arte", "style": 2, "custom_id": "order:panel:prompt", "emoji": {"name": "🎨"}}]}]
            message_id = manifest["messages"].get(key)
            if message_id:
                try:
                    message = await api("PATCH", f"channels/{channel_id}/messages/{message_id}", payload)
                except RuntimeError as exc:
                    if "HTTP 404" not in str(exc):
                        raise
                    message = await api("POST", f"channels/{channel_id}/messages", payload)
            else:
                message = await api("POST", f"channels/{channel_id}/messages", payload)
            manifest["messages"][key] = message["id"]
            save()
        await api("PATCH", f"guilds/{GUILD}/channels", [{"id": manifest["categories"][key], "position": index} for index, (key, _, _, _) in enumerate(CATEGORIES)])
        final = await api("GET", f"guilds/{GUILD}/channels")
        manifest["verified_channels"] = len(final)
        save()
        print(f"Concluído: {len(CATEGORIES)} categorias, {len(CHANNELS)} canais/salas e {len(ROLES)} cargos.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    asyncio.run(run(parser.parse_args().apply))
