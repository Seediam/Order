import { describe, it, expect, vi } from "vitest";
import {
  demoState,
  newCharacter,
  formation,
  validateDeck,
  roll,
  path,
  clearLine,
  prepare,
  beginTurn,
} from "../server/rules";
import * as rules from "../server/rules";
import { applyAction } from "../server/actions";
import { viewFor } from "../server/view";
import { catalog, starterDeck } from "../shared/catalog";
import { SECTORS, type User } from "../shared/types";
const player: User = {
  id: "p1",
  username: "player",
  displayName: "Player",
  role: "PLAYER",
  avatar: "",
};
const other: User = { ...player, id: "p2" };
function fixture() {
  const s = demoState("gm");
  const c = newCharacter("p1", "Cassandra", "JUSTIÇA");
  s.characters.push(c);
  s.scenes[1].walls = [];
  s.combat = {
    active: true,
    paused: false,
    round: 1,
    index: 0,
    order: [c.id, s.characters[0].id],
    pending: [],
  };
  c.ownTurns = 1;
  return { s, c };
}
describe("regras de deck e dados", () => {
  it("valida decks de 20 com 12 de cada Setor e no máximo duas cópias", () => {
    for (const sector of SECTORS)
      expect(() =>
        validateDeck(starterDeck(sector), catalog, sector),
      ).not.toThrow();
    expect(() =>
      validateDeck(Array(20).fill("U01"), catalog, "JUSTIÇA"),
    ).toThrow("2 cópias");
    expect(() =>
      validateDeck(starterDeck("JUSTIÇA").slice(1), catalog, "JUSTIÇA"),
    ).toThrow("20");
    expect(() =>
      validateDeck(starterDeck("DOUTRINA"), catalog, "JUSTIÇA"),
    ).toThrow("outro Setor");
  });
  it("separa Formação e dá 3 cópias às três perícias principais", () => {
    const deck = formation(["Investigação", "Persuasão", "Percepção"]);
    expect(deck).toHaveLength(16);
    expect(deck.filter((x) => x === "Investigação")).toHaveLength(3);
    expect(() => formation(["Investigação", "Investigação"])).toThrow();
    expect(formation([])).toHaveLength(10);
  });
  it("gera apenas resultados possíveis nos dados do servidor", () => {
    for (let i = 0; i < 2000; i++) {
      expect(roll(6)).toBeGreaterThanOrEqual(1);
      expect(roll(6)).toBeLessThanOrEqual(6);
      expect(roll(20)).toBeLessThanOrEqual(20);
    }
  });
  it("compra 3 Ações e 2 Formações na preparação, e 1 de cada no turno seguinte", () => {
    const c = newCharacter("p1", "Cass", "JUSTIÇA");
    prepare(c);
    beginTurn(c);
    expect(c.hand).toHaveLength(3);
    expect(c.formationHand).toHaveLength(2);
    beginTurn(c);
    expect(c.hand).toHaveLength(4);
    expect(c.formationHand).toHaveLength(3);
  });
});
describe("movimento autoritativo", () => {
  it("respeita paredes, porta aberta, ocupação e limites", () => {
    const { s } = fixture(),
      scene = s.scenes[1];
    scene.width = 8;
    scene.height = 8;
    scene.walls = [[0, 3, 8, 3]];
    scene.doors = [];
    expect(path(scene, { x: 2, y: 2 }, { x: 2, y: 3 })).toBeNull();
    scene.doors = [{ id: "door", x: 2.5, y: 3, open: true }];
    expect(path(scene, { x: 2, y: 2 }, { x: 2, y: 3 })).toBe(1);
    expect(clearLine(scene, { x: 2, y: 2 }, { x: 2, y: 3 })).toBe(true);
    expect(
      path(scene, { x: 2, y: 2 }, { x: 2, y: 3 }, [{ x: 2, y: 3 }]),
    ).toBeNull();
    expect(path(scene, { x: 0, y: 0 }, { x: -1, y: 0 })).toBeNull();
  });
  it("bloqueia movimento sem saldo e token alheio", () => {
    const { s, c } = fixture();
    expect(() =>
      applyAction(s, other, "gm", {
        type: "token:move",
        characterId: c.id,
        position: { x: 7, y: 8 },
      }),
    ).toThrow("não é seu");
    expect(() =>
      applyAction(s, player, "gm", {
        type: "token:move",
        characterId: c.id,
        position: { x: 12, y: 8 },
      }),
    ).toThrow("insuficiente");
  });
  it("queima só uma carta por turno e não a devolve ao descarte", () => {
    const { s, c } = fixture();
    const card = c.hand[0];
    applyAction(s, player, "gm", {
      type: "card:burn",
      characterId: c.id,
      cardId: card,
    });
    expect(c.banished).toContain(card);
    expect(c.remainingMove).toBe(6);
    expect(() =>
      applyAction(s, player, "gm", {
        type: "card:burn",
        characterId: c.id,
        cardId: c.hand[0],
      }),
    ).toThrow("já queimou");
  });
});
describe("equipamentos, permissões e privacidade", () => {
  it("bloqueia Incisão com Moral esgotada, inclusive em cartas de custo zero", () => {
    const { s, c } = fixture();
    const card = {
      ...catalog.find((card) => card.id === "U05")!,
      id: "teste-incisao",
      cost: 0,
      common: [{ kind: "incision" as const, amount: 2 }],
    };
    s.cards.push(card);
    c.moral = 0;
    c.hand = [card.id];
    s.characters[0].position = { x: 9, y: 8 };
    expect(() =>
      applyAction(s, player, "gm", {
        type: "card:play",
        characterId: c.id,
        cardId: card.id,
        targetId: s.characters[0].id,
      }),
    ).toThrow("Moral esgotada");
    expect(c.hand).toEqual([card.id]);
  });
  it("mantém cartas banidas entre encontros da mesma cena e as recupera na próxima", () => {
    const { s, c } = fixture();
    const master: User = { ...player, id: "gm", role: "MASTER" };
    const card = c.hand[0];
    applyAction(s, player, "gm", {
      type: "card:burn",
      characterId: c.id,
      cardId: card,
    });
    applyAction(s, master, "gm", { type: "combat:end" });
    applyAction(s, master, "gm", { type: "combat:start" });
    expect(c.banished).toEqual([card]);
    expect(c.draw.length + c.hand.length + c.discard.length).toBe(19);
    applyAction(s, master, "gm", {
      type: "scene:activate",
      sceneId: s.scenes[0].id,
    });
    expect(c.banished).toHaveLength(0);
    expect(c.draw.length + c.hand.length).toBe(20);
  });
  it("um personagem caído consegue passar o turno sem bloquear o encontro", () => {
    const { s, c } = fixture();
    c.hp = 0;
    c.hand = Array(6).fill("U01");
    applyAction(s, player, "gm", { type: "turn:end" });
    expect(s.combat.index).toBe(1);
  });
  it("Pistola aplica +2 fixo ao acertar e perde alcance/bônus quando desequipada", () => {
    const { s, c } = fixture();
    const target = s.characters[0];
    target.position = { x: 9, y: 8 };
    c.hand = ["U01"];
    const spy = vi
      .spyOn(rules, "roll")
      .mockReturnValueOnce(1)
      .mockReturnValueOnce(20);
    applyAction(s, player, "gm", {
      type: "card:play",
      characterId: c.id,
      cardId: "U01",
      targetId: target.id,
    });
    expect(target.hp).toBe(8);
    spy.mockRestore();
    c.weapon = "NENHUMA";
    c.hand = ["U01"];
    c.actions = 1;
    target.position = { x: 10, y: 8 };
    expect(() =>
      applyAction(s, player, "gm", {
        type: "card:play",
        characterId: c.id,
        cardId: "U01",
        targetId: target.id,
      }),
    ).toThrow("alcance");
  });
  it("Papel e Caneta só retorna no início do quarto turno", () => {
    const { s, c } = fixture();
    applyAction(s, player, "gm", { type: "equipment:use", characterId: c.id });
    expect(c.hand).toHaveLength(4);
    expect(c.cooldown).toBe(4);
    for (let i = 0; i < 2; i++) {
      beginTurn(c);
      expect(() =>
        applyAction(s, player, "gm", {
          type: "equipment:use",
          characterId: c.id,
        }),
      ).toThrow("recarga");
    }
    beginTurn(c);
    expect(() =>
      applyAction(s, player, "gm", {
        type: "equipment:use",
        characterId: c.id,
      }),
    ).not.toThrow();
  });
  it("não permite criar NPC, editar cena ou alterar recursos alheios", () => {
    const { s, c } = fixture();
    for (const action of [
      {
        type: "character:create",
        name: "Fraude",
        sector: "JUSTIÇA",
        npc: true,
      },
      {
        type: "scene:update",
        sceneId: s.activeSceneId,
        patch: { name: "Fraude" },
      },
      { type: "character:resources", characterId: c.id, patch: { hp: 999 } },
    ])
      expect(() => applyAction(s, player, "gm", action)).toThrow("Mestre");
  });
  it("não publica mãos, pilhas ou IDs de ataques mascarados para outro jogador ou Mestre", () => {
    const { s, c } = fixture();
    s.combat.pending.push({
      actor: c.id,
      target: s.characters[0].id,
      cardId: c.hand[0],
    });
    for (const u of [other, { ...player, id: "gm", role: "MASTER" as const }]) {
      const view = viewFor(s, u, "gm");
      const ch = view.characters.find((v) => v.id === c.id)!;
      for (const field of [
        "hand",
        "draw",
        "deck",
        "discard",
        "banished",
        "formationHand",
        "formationDraw",
        "formationDiscard",
      ])
        expect(ch).not.toHaveProperty(field);
      expect(view.combat.pending[0]).not.toHaveProperty("cardId");
    }
    expect(
      viewFor(s, player, "gm").characters.find((v) => v.id === c.id)!.hand,
    ).toEqual(c.hand);
  });
  it("aplica consequências narrativas persistíveis e impede repetição", () => {
    const { s, c } = fixture();
    s.combat.active = false;
    s.activeSceneId = s.scenes[2].id;
    const choice = s.scenes[2].choices[0];
    applyAction(s, player, "gm", {
      type: "choice:select",
      characterId: c.id,
      choiceId: choice.id,
    });
    expect(c.sanity).toBe(8);
    expect(c.fame).toBe(3);
    expect(s.trust).toBe(4);
    expect(s.activeSceneId).toBe(s.scenes[6].id);
    s.activeSceneId = s.scenes[2].id;
    expect(() =>
      applyAction(s, player, "gm", {
        type: "choice:select",
        characterId: c.id,
        choiceId: choice.id,
      }),
    ).toThrow("já foi tomada");
  });
});
