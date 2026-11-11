import { isBundledArt, ORDER_ART } from '../shared/order-assets';
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type {
  CampaignState,
  User,
  Action,
  Character,
  Scene,
  Card,
  DiceRoll,
} from "../shared/types";
import { SECTORS, SKILLS } from "../shared/types";
import {
  beginTurn,
  clamp,
  clearLine,
  damage,
  draw,
  formation,
  newCharacter,
  newScene,
  path,
  prepare,
  requireRule,
  roll,
  validateDeck,
} from "./rules";
import { inside } from "./view";
const id = z.string().min(1).max(100),
  str = z.string().max(5000),
  num = z.number().int().min(-1000).max(1000);
const url = z
  .string()
  .max(250)
  .refine(
    (v) =>
      v === "" || isBundledArt(v) ||
      /^\/(?:media\/[a-zA-Z0-9-]+(?:\/thumb)?|art\/[a-z-]+\.svg)$/.test(v),
    "Selecione um arquivo da biblioteca.",
  );
const point = z.object({
  x: z.number().int().min(0).max(99),
  y: z.number().int().min(0).max(99),
});
const room = z.object({
  id,
  name: z.string().min(1).max(100),
  description: str,
  image: url,
  visible: z.boolean(),
  points: z
    .array(z.number().min(0).max(100))
    .max(200)
    .refine((p) => p.length === 0 || (p.length >= 6 && p.length % 2 === 0)),
});
const choice = z.object({
  id,
  label: z.string().min(1).max(200),
  sanity: num,
  fame: num,
  trust: num,
  nextScene: z.string().max(100),
  combat: z.boolean(),
  condition: z.enum(["always", "proofs", "moral"]),
  once: z.boolean(),
});
const scenePatch = z.object({
  name: z.string().min(1).max(100).optional(),
  description: str.optional(),
  type: z.enum(["board", "novel"]).optional(),
  visible: z.boolean().optional(),
  mode: z.enum(["HELLS", "CÓMUM"]).optional(),
  background: url.optional(),
  width: z.number().int().min(8).max(80).optional(),
  height: z.number().int().min(8).max(80).optional(),
  grid: z.number().int().min(16).max(100).optional(),
  gridOpacity: z.number().min(0).max(1).optional(),
  rooms: z.array(room).max(60).optional(),
  walls: z
    .array(z.array(z.number().min(0).max(100)).length(4))
    .max(1000)
    .optional(),
  blocked: z.array(point).max(6400).optional(),
  doors: z
    .array(
      z.object({
        id,
        x: z.number().min(0).max(100),
        y: z.number().min(0).max(100),
        open: z.boolean(),
      }),
    )
    .max(300)
    .optional(),
  drawings: z
    .array(z.array(z.number().min(0).max(100)).max(2000))
    .max(200)
    .optional(),
  dialogues: z
    .array(
      z.object({ id, speaker: z.string().max(100), text: str, portrait: url }),
    )
    .min(1)
    .max(100)
    .optional(),
  choices: z.array(choice).max(20).optional(),
});
const effect = z.object({
  kind: z.enum([
    "damage",
    "heal",
    "shield",
    "moral",
    "sanity",
    "move",
    "draw",
    "incision",
  ]),
  amount: z.number().int().min(0).max(30),
});
export const cardSchema = z.object({
  id,
  name: z.string().min(1).max(100),
  sector: z.enum([...SECTORS, "UNIVERSAL"]),
  description: str,
  art: url,
  dice: z.array(z.number().int().min(1).max(6)).min(1).max(6),
  cost: z.number().int().min(0).max(8),
  range: z.number().int().min(0).max(20),
  target: z.enum(["enemy", "ally", "self"]),
  hells: z.array(effect).max(12),
  common: z.array(effect).max(12),
  tags: z.array(z.string().max(40)).max(10),
});
export function log(
  s: CampaignState,
  text: string,
  kind: "system" | "combat" | "dice" | "chat" | "audit" = "system",
  author = "ORDER",
  rolls?: DiceRoll[],
) {
  s.logs.push({
    id: randomUUID(),
    text,
    time: new Date().toISOString(),
    kind,
    author,
    ...(rolls ? { rolls } : {}),
  });
  s.logs = s.logs.slice(-300);
}
export function applyAction(
  s: CampaignState,
  user: User,
  ownerId: string,
  action: Action,
) {
  const master = user.id === ownerId;
  const gm = () =>
    requireRule(master, "Somente o Mestre da campanha pode fazer isso.");
  const scene = () => {
    const x = s.scenes.find((v) => v.id === s.activeSceneId);
    requireRule(x, "Cena não encontrada.");
    return x;
  };
  const activateScene = (sc: Scene) => {
    sc.visible = true;
    s.activeSceneId = sc.id;
    s.combat.active = false;
    s.combat.pending = [];
    for (const c of s.characters) {
      prepare(c);
      c.moral = clamp(c.moral + 2, c.maxMoral);
      c.position = {
        x: Math.min(c.position.x, sc.width - 1),
        y: Math.min(c.position.y, sc.height - 1),
      };
    }
  };
  const character = (charId: unknown, owned = true) => {
    const c = s.characters.find((c) => c.id === id.parse(charId));
    requireRule(c, "Personagem não encontrado.");
    if (owned)
      requireRule(
        master || (c.ownerId === user.id && !c.npc),
        "Este personagem não é seu.",
      );
    return c;
  };
  const turn = (c: Character, actionPoint = false) => {
    if (s.combat.active) {
      requireRule(!s.combat.paused, "Combate pausado.");
      requireRule(
        s.combat.order[s.combat.index] === c.id,
        "Aguarde o seu turno.",
      );
    }
    requireRule(c.hp > 0, "Personagem caído.");
    if (actionPoint) requireRule(c.actions > 0, "Sua Ação já foi utilizada.");
  };
  const visibleTarget = (c: Character) => {
    requireRule(master || !c.hidden, "Alvo indisponível.");
    requireRule(
      master ||
        !scene().rooms.some(
          (r) =>
            !r.visible &&
            inside(c.position.x + 0.5, c.position.y + 0.5, r.points),
        ),
      "Alvo indisponível.",
    );
  };
  const startCombat = () => {
    requireRule(!s.combat.active, "Já existe um combate em andamento.");
    const chars = s.characters.filter((c) => !c.hidden && c.hp > 0);
    requireRule(chars.length >= 2, "Adicione ao menos dois participantes.");
    for (const c of chars) validateDeck(c.deck, s.cards, c.sector);
    const scores = chars
      .map((c) => ({ id: c.id, n: roll(20) }))
      .sort((a, b) => b.n - a.n);
    s.combat = {
      active: true,
      paused: false,
      round: 1,
      index: 0,
      order: scores.map((c) => c.id),
      pending: [],
    };
    for (const c of chars) prepare(c, true);
    beginTurn(s.characters.find((c) => c.id === scores[0].id)!);
    s.status = "active";
    log(
      s,
      `Combate iniciado · ${scores.map((v) => `${chars.find((c) => c.id === v.id)!.name}: ${v.n}`).join(" / ")}`,
      "combat",
      "ORDER",
      scores.slice(0, 4).map((v) => ({
        sides: 20 as const,
        value: v.n,
        label: "Iniciativa",
        detail: chars.find((c) => c.id === v.id)!.name,
      })),
    );
  };
  switch (action.type) {
    case "chat": {
      const text = z.string().trim().min(1).max(1000).parse(action.text);
      log(s, text, "chat", user.displayName);
      break;
    }
    case "character:create": {
      const p = z
        .object({
          name: z.string().trim().min(2).max(60),
          sector: z.enum(SECTORS),
          npc: z.boolean().default(false),
          portrait: url.optional(),
        })
        .parse(action);
      if (p.npc) gm();
      requireRule(s.characters.length < 30, "Limite de 30 personagens.");
      requireRule(
        master || s.characters.filter((c) => c.ownerId === user.id).length < 3,
        "Limite de 3 personagens por jogador.",
      );
      const c = newCharacter(user.id, p.name, p.sector, p.npc);
      c.portrait = p.portrait || ORDER_ART.man;
      let pos = { x: 8, y: 8 };
      for (let y = 0; y < scene().height; y++) {
        for (let x = 0; x < scene().width; x++)
          if (
            !s.characters.some(
              (c) => c.position.x === x && c.position.y === y,
            ) &&
            !scene().blocked.some((p) => p.x === x && p.y === y)
          ) {
            pos = { x, y };
            break;
          }
        if (pos.y === y) break;
      }
      c.position = pos;
      s.characters.push(c);
      log(s, `${c.name} entrou no arquivo de Procuradores.`);
      break;
    }
    case "character:update": {
      const c = character(action.characterId);
      const p = z
        .object({
          name: z.string().min(2).max(60).optional(),
          portrait: url.optional(),
          sin: z.string().max(60).optional(),
          age: z.number().int().min(1).max(300).optional(),
          story: str.optional(),
          death: str.optional(),
          skills: z.array(z.enum(SKILLS)).max(3).optional(),
          weapon: z.enum(["PISTOLA", "FACA", "NENHUMA"]).optional(),
          instrument: z.boolean().optional(),
        })
        .parse(action.patch);
      requireRule(!s.combat.active, "Edite a ficha fora do combate.");
      if (p.skills) formation(p.skills);
      Object.assign(c, p);
      prepare(c, true);
      log(s, `Ficha de ${c.name} atualizada.`);
      break;
    }
    case "character:resources": {
      gm();
      const c = character(action.characterId);
      const p = z
        .object({
          hp: num.optional(),
          moral: num.optional(),
          sanity: num.optional(),
          fame: z.number().int().min(0).max(999).optional(),
          maxHp: z.number().int().min(1).max(200).optional(),
          maxMoral: z.number().int().min(1).max(100).optional(),
          maxSanity: z.number().int().min(1).max(100).optional(),
          defense: z.number().int().min(1).max(40).optional(),
          movement: z.number().int().min(1).max(20).optional(),
          hidden: z.boolean().optional(),
          effects: z.array(z.string().max(100)).max(20).optional(),
        })
        .parse(action.patch);
      Object.assign(c, p);
      c.hp = clamp(c.hp, c.maxHp);
      c.moral = clamp(c.moral, c.maxMoral);
      c.sanity = clamp(c.sanity, c.maxSanity);
      log(
        s,
        `Mestre ajustou os recursos de ${c.name}.`,
        "audit",
        user.displayName,
      );
      break;
    }
    case "deck:save": {
      const c = character(action.characterId);
      requireRule(!s.combat.active, "Não altere o deck durante o combate.");
      const deck = z.array(id).parse(action.deck);
      requireRule(
        c.banished.length === 0,
        "Troque de cena antes de alterar um deck com cartas banidas.",
      );
      validateDeck(deck, s.cards, c.sector);
      c.deck = deck;
      prepare(c);
      log(s, `Deck de ${c.name} validado: 20 cartas.`);
      break;
    }
    case "token:move": {
      const c = character(action.characterId);
      if (action.override) gm();
      else turn(c);
      const target = point.parse(action.position);
      requireRule(
        target.x < scene().width && target.y < scene().height,
        "Fora dos limites do mapa.",
      );
      requireRule(
        master ||
          !scene().rooms.some(
            (r) =>
              !r.visible && inside(target.x + 0.5, target.y + 0.5, r.points),
          ),
        "Área ainda não revelada.",
      );
      if (action.override) {
        gm();
      } else {
        const n = path(
          scene(),
          c.position,
          target,
          s.characters.filter((v) => v.id !== c.id).map((v) => v.position),
        );
        requireRule(n !== null, "Passagem bloqueada.");
        if (s.combat.active) {
          requireRule(n <= c.remainingMove, "Movimento insuficiente.");
          c.remainingMove -= n;
        }
      }
      c.position = target;
      log(s, `${c.name} moveu para ${target.x + 1}, ${target.y + 1}.`);
      break;
    }
    case "scene:create": {
      gm();
      requireRule(s.scenes.length < 50, "Limite de 50 cenas.");
      const p = z
        .object({
          name: z.string().min(1).max(100),
          sceneType: z.enum(["board", "novel"]),
          rooms: z.number().int().min(0).max(30),
        })
        .parse(action);
      const sc = newScene(p.name, p.sceneType);
      sc.rooms = Array.from({ length: p.rooms }, (_, i) => ({
        id: randomUUID(),
        name: `Sala ${String(i + 1).padStart(2, "0")}`,
        description: "",
        image: "",
        visible: true,
        points: [],
      }));
      s.scenes.push(sc);
      activateScene(sc);
      log(s, `Cena criada: ${sc.name}.`);
      break;
    }
    case "scene:activate": {
      gm();
      const sc = s.scenes.find((x) => x.id === id.parse(action.sceneId));
      requireRule(sc, "Cena não encontrada.");
      activateScene(sc);
      log(s, `Cena ativa: ${sc.name}.`);
      break;
    }
    case "scene:update": {
      gm();
      const sc = s.scenes.find((x) => x.id === id.parse(action.sceneId));
      requireRule(sc, "Cena não encontrada.");
      const patch = scenePatch.parse(action.patch);
      Object.assign(sc, patch);
      sc.dialogueIndex = Math.min(sc.dialogueIndex, sc.dialogues.length - 1);
      log(s, `Cena editada: ${sc.name}.`, "audit", user.displayName);
      break;
    }
    case "door:toggle": {
      const sc = scene();
      const d = sc.doors.find((d) => d.id === id.parse(action.doorId));
      requireRule(d, "Porta não encontrada.");
      if (!master) {
        const c = character(action.characterId);
        turn(c);
        requireRule(
          Math.abs(c.position.x + 0.5 - d.x) +
            Math.abs(c.position.y + 0.5 - d.y) <=
            2,
          "Aproxime-se da porta.",
        );
      }
      d.open = !d.open;
      log(s, `Porta ${d.open ? "aberta" : "fechada"}.`);
      break;
    }
    case "dialogue:next": {
      gm();
      const sc = scene();
      requireRule(
        sc.dialogueIndex < sc.dialogues.length - 1,
        "Última fala da sequência.",
      );
      sc.dialogueIndex++;
      break;
    }
    case "choice:select": {
      const c = character(action.characterId);
      const sc = scene();
      const choice = sc.choices.find((v) => v.id === id.parse(action.choiceId));
      requireRule(choice, "Escolha não encontrada.");
      requireRule(
        !sc.chosen.includes(choice.id),
        "Esta decisão já foi tomada.",
      );
      if (choice.condition === "proofs")
        requireRule(s.proofs.length >= 2, "Reúna duas provas.");
      if (choice.condition === "moral")
        requireRule(c.moral >= 2, "Moral insuficiente.");
      if (choice.once) sc.chosen.push(choice.id);
      c.sanity = clamp(c.sanity + choice.sanity, c.maxSanity);
      c.fame = Math.max(0, c.fame + choice.fame);
      s.trust = clamp(s.trust + choice.trust, 10);
      s.variables[`choice:${sc.id}`] = choice.label;
      log(
        s,
        `${c.name}: ${choice.label}. Sanidade ${choice.sanity >= 0 ? "+" : ""}${choice.sanity}, Fame +${choice.fame}, Confiança ${choice.trust >= 0 ? "+" : ""}${choice.trust}.`,
      );
      if (choice.nextScene) {
        const next = s.scenes.find((x) => x.id === choice.nextScene);
        requireRule(next, "Cena de consequência não encontrada.");
        if (next.id !== s.activeSceneId) activateScene(next);
      }
      if (choice.combat) startCombat();
      break;
    }
    case "combat:start": {
      gm();
      startCombat();
      break;
    }
    case "combat:pause": {
      gm();
      s.combat.paused = !s.combat.paused;
      log(
        s,
        s.combat.paused ? "Combate pausado." : "Combate retomado.",
        "combat",
      );
      break;
    }
    case "combat:end": {
      gm();
      s.combat.active = false;
      s.combat.pending = [];
      log(s, "Encontro encerrado.", "combat");
      break;
    }
    case "turn:end": {
      requireRule(s.combat.active, "Não há combate.");
      const c = character(s.combat.order[s.combat.index]);
      requireRule(!s.combat.paused, "Combate pausado.");
      requireRule(
        c.hp === 0 || (c.hand.length <= 5 && c.formationHand.length <= 4),
        "Descarte até 5 Ações e 4 Formações antes de encerrar.",
      );
      for (const pending of s.combat.pending.filter((p) => p.actor === c.id)) {
        const target = character(pending.target, false);
        const card = s.cards.find((v) => v.id === pending.cardId)!;
        const detection = roll(6);
        const anticipated = card.dice.includes(detection) && !target.reacted;
        if (anticipated) target.reacted = true;
        const d20 = roll(20);
        const hit =
          d20 === 20 ||
          (d20 !== 1 && d20 >= target.defense + (anticipated ? 3 : 0));
        if (hit)
          damage(
            target,
            1 + (c.weapon === "PISTOLA" ? 2 : c.weapon === "FACA" ? 1 : 0),
          );
        c.discard.push(card.id);
        log(
          s,
          `${c.name} revela ${card.name}. ${target.name} lê d6: ${detection}${anticipated ? " · Antecipar +3 Defesa" : ""}. Ataque d20: ${d20} · ${hit ? "acertou" : "falhou"}.`,
          "combat",
          c.name,
          [
            { sides: 6, value: detection, ok: !anticipated, label: `Leitura de ${target.name}`, detail: anticipated ? "Antecipar: +3 Defesa" : "Não leu a carta" },
            { sides: 20, value: d20, ok: hit, label: `${card.name} · ataque mascarado`, detail: `Contra Defesa ${target.defense + (anticipated ? 3 : 0)}` },
          ],
        );
      }
      s.combat.pending = s.combat.pending.filter((p) => p.actor !== c.id);
      s.combat.index = (s.combat.index + 1) % s.combat.order.length;
      if (s.combat.index === 0) {
        s.combat.round++;
        for (const ch of s.characters) ch.reacted = false;
      }
      const next = character(s.combat.order[s.combat.index], false);
      beginTurn(next);
      log(s, `Turno de ${next.name} · Rodada ${s.combat.round}.`, "combat");
      break;
    }
    case "card:draw": {
      gm();
      const c = character(action.characterId);
      draw(c, 1, action.training === true);
      log(s, `Mestre autorizou uma compra para ${c.name}.`, "audit");
      break;
    }
    case "card:discard": {
      const c = character(action.characterId);
      turn(c);
      const cardId = id.parse(action.cardId);
      const training = action.training === true;
      const hand = training ? c.formationHand : c.hand;
      const i = hand.indexOf(cardId);
      requireRule(i >= 0, "Carta não está na sua mão.");
      hand.splice(i, 1);
      (training ? c.formationDiscard : c.discard).push(cardId);
      break;
    }
    case "card:burn": {
      const c = character(action.characterId);
      turn(c);
      requireRule(s.combat.active, "Queime cartas durante o combate.");
      requireRule(!c.burned, "Você já queimou uma carta neste turno.");
      const cardId = id.parse(action.cardId);
      const i = c.hand.indexOf(cardId);
      requireRule(i >= 0, "Carta não está na mão.");
      c.hand.splice(i, 1);
      c.banished.push(cardId);
      c.remainingMove += c.movement;
      c.burned = true;
      log(
        s,
        `${c.name} queimou uma carta: +${c.movement} movimento.`,
        "combat",
      );
      break;
    }
    case "equipment:use": {
      const c = character(action.characterId);
      turn(c);
      requireRule(s.combat.active, "Use o instrumento durante um combate.");
      requireRule(c.instrument, "Papel e Caneta não está equipado.");
      requireRule(c.ownTurns >= c.cooldown, "Instrumento em recarga.");
      draw(c);
      c.cooldown = c.ownTurns + 3;
      log(
        s,
        `${c.name} virou Papel e Caneta e comprou uma Ação. Recarga: 2 turnos próprios completos.`,
        "combat",
      );
      break;
    }
    case "card:play": {
      const c = character(action.characterId);
      turn(c, true);
      requireRule(s.combat.active, "Inicie o combate para jogar cartas.");
      const cardId = id.parse(action.cardId);
      const i = c.hand.indexOf(cardId);
      requireRule(i >= 0, "Carta não está na sua mão.");
      const card = s.cards.find((v) => v.id === cardId);
      requireRule(card, "Carta desconhecida.");
      const target = action.targetId ? character(action.targetId, false) : c;
      visibleTarget(target);
      const masked = action.masked === true;
      if (masked) {
        requireRule(c.id !== target.id, "Escolha outro alvo.");
        const range = c.weapon === "PISTOLA" ? 2 : 1;
        requireRule(
          Math.abs(c.position.x - target.position.x) +
            Math.abs(c.position.y - target.position.y) <=
            range && clearLine(scene(), c.position, target.position),
          "Alvo fora do alcance ou atrás de parede.",
        );
        c.hand.splice(i, 1);
        c.actions--;
        s.combat.pending.push({ actor: c.id, target: target.id, cardId });
        log(
          s,
          `${c.name} prepara um ataque mascarado contra ${target.name}. Arma: ${c.weapon}.`,
          "combat",
        );
        break;
      }
      requireRule(
        card.target !== "self" || c.id === target.id,
        "Esta carta afeta apenas você.",
      );
      requireRule(
        card.target !== "enemy" || c.id !== target.id,
        "Selecione um adversário.",
      );
      requireRule(
        card.target === "self" ||
          Math.abs(c.position.x - target.position.x) +
            Math.abs(c.position.y - target.position.y) <=
            (card.tags.includes("Arma")
              ? c.weapon === "PISTOLA"
                ? 2
                : 1
              : card.range),
        "Alvo fora do alcance.",
      );
      requireRule(
        c.id === target.id || clearLine(scene(), c.position, target.position),
        "Uma parede bloqueia o alvo.",
      );
      const cost = scene().mode === "CÓMUM" ? card.cost : 0;
      requireRule(
        scene().mode !== "CÓMUM" ||
          c.moral > 0 ||
          !card.common.some((effect) => effect.kind === "incision"),
        "Moral esgotada: ações de convencimento estão bloqueadas nesta cena.",
      );
      requireRule(c.moral >= cost, "Moral insuficiente.");
      c.moral -= cost;
      c.hand.splice(i, 1);
      c.discard.push(cardId);
      c.actions--;
      const d6 = roll(6);
      const activated = card.dice.includes(d6);
      log(
        s,
        `${c.name} usa ${card.name} · d6 ${d6} · ${activated ? "ATIVOU" : "FALHOU"}.`,
        "dice",
        c.name,
        [{ sides: 6, value: d6, ok: activated, label: `${card.name} · ativação`, detail: `Faces válidas: ${card.dice.join(" · ")}` }],
      );
      if (!activated) break;
      const effects = scene().mode === "HELLS" ? card.hells : card.common;
      let hit = true;
      if (effects.some((e) => e.kind === "damage" || e.kind === "incision")) {
        const d20 = roll(20);
        hit = d20 === 20 || (d20 !== 1 && d20 >= target.defense);
        log(
          s,
          `Acerto d20: ${d20} contra Defesa ${target.defense} · ${hit ? "sucesso" : "falha"}.`,
          "dice",
          c.name,
          [{ sides: 20, value: d20, ok: hit, label: `${card.name} · ataque`, detail: `Contra Defesa ${target.defense}` }],
        );
      }
      if (!hit) break;
      for (const e of effects) {
        switch (e.kind) {
          case "damage":
            damage(
              target,
              e.amount +
                (card.tags.includes("Arma")
                  ? c.weapon === "PISTOLA"
                    ? 2
                    : c.weapon === "FACA"
                      ? 1
                      : 0
                  : 0),
            );
            break;
          case "heal":
            target.hp = clamp(target.hp + e.amount, target.maxHp);
            break;
          case "shield":
            target.shield += e.amount;
            break;
          case "moral":
            target.moral = clamp(target.moral + e.amount, target.maxMoral);
            break;
          case "sanity":
            target.sanity = clamp(target.sanity + e.amount, target.maxSanity);
            break;
          case "move":
            c.remainingMove += e.amount;
            break;
          case "draw":
            draw(target, e.amount);
            break;
          case "incision":
            target.resistance = Math.max(0, target.resistance - e.amount);
            break;
        }
      }
      break;
    }
    case "dice:roll": {
      const c = character(action.characterId);
      turn(c);
      const p = z
        .object({
          sides: z.union([z.literal(6), z.literal(20)]),
          skill: z.string().max(40).optional(),
          training: z.boolean().optional(),
          difficulty: z.number().int().min(1).max(40).default(13),
        })
        .parse(action);
      let bonus = 0;
      if (p.training) {
        requireRule(
          p.sides === 20 && p.skill,
          "Selecione uma perícia para a Formação.",
        );
        const i = c.formationHand.indexOf(p.skill);
        requireRule(i >= 0, "Formação não está na sua mão.");
        c.formationHand.splice(i, 1);
        c.formationDiscard.push(p.skill);
        bonus = 2;
      }
      const n = roll(p.sides);
      log(
        s,
        `${c.name} · d${p.sides}: ${n}${bonus ? ` + ${bonus} Formação = ${n + bonus}` : ""}${p.sides === 20 ? ` · DT ${p.difficulty} · ${n === 20 || (n !== 1 && n + bonus >= p.difficulty) ? "sucesso" : "falha"}` : ""}${p.skill ? ` · ${p.skill}` : ""}`,
        "dice",
        c.name,
        [
          {
            sides: p.sides,
            value: n,
            ok: p.sides === 20 ? n === 20 || (n !== 1 && n + bonus >= p.difficulty) : undefined,
            label: `${c.name}${p.skill ? ` · ${p.skill}` : ""}`,
            detail: p.sides === 20 ? `${n}${bonus ? ` + ${bonus} Formação` : ""} = ${n + bonus} contra DT ${p.difficulty}` : "",
          },
        ],
      );
      break;
    }
    case "card:save": {
      gm();
      requireRule(!s.combat.active, "Edite cartas fora do combate.");
      const card = cardSchema.parse(action.card);
      const i = s.cards.findIndex((c) => c.id === card.id);
      if (i >= 0) s.cards[i] = card;
      else {
        requireRule(s.cards.length < 200, "Limite de 200 cartas.");
        s.cards.push(card);
      }
      log(s, `Carta salva: ${card.name}.`, "audit");
      break;
    }
    case "campaign:settings": {
      gm();
      const p = z
        .object({
          trust: z.number().int().min(0).max(10).optional(),
          allowHandInspection: z.boolean().optional(),
          status: z.enum(["open", "active", "closed"]).optional(),
          proofs: z.array(z.string().min(1).max(200)).max(30).optional(),
        })
        .parse(action.patch);
      Object.assign(s, p);
      log(s, "Configurações da campanha atualizadas.", "audit");
      break;
    }
    case "audio:play": {
      gm();
      const u = url.parse(action.url);
      s.audio = { url: u, startedAt: Date.now(), playing: !!u };
      log(
        s,
        u
          ? "Ambiente compartilhado iniciado."
          : "Ambiente compartilhado interrompido.",
      );
      break;
    }
    default:
      throw new Error("Ação desconhecida.");
  }
}
