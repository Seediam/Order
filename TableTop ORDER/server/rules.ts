import { randomInt, randomUUID } from "node:crypto";
import { catalog, starterDeck } from "../shared/catalog";
import {
  SKILLS,
  type CampaignState,
  type Character,
  type Point,
  type Scene,
  type Sector,
  type Card,
  type Attributes,
  type Prop,
  type PropKind,
  type Material,
} from "../shared/types";
export class RuleError extends Error {}
export function requireRule(test: unknown, message: string): asserts test {
  if (!test) throw new RuleError(message);
}
export const roll = (sides: 6 | 20) => randomInt(1, sides + 1);
export function shuffle<T>(array: T[]) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export const clamp = (value: number, max: number) =>
  Math.min(max, Math.max(0, value));
export function formation(skills: string[]) {
  requireRule(
    skills.length <= 3 &&
      new Set(skills).size === skills.length &&
      skills.every((s) => (SKILLS as readonly string[]).includes(s)),
    "Escolha até 3 perícias distintas.",
  );
  return [...SKILLS, ...skills.flatMap((s) => [s, s])];
}
export function validateDeck(deck: string[], cards: Card[], sector: Sector) {
  requireRule(
    deck.length === 20,
    "O deck de Ação precisa ter exatamente 20 cartas.",
  );
  const count: Record<string, number> = {};
  let own = 0;
  for (const id of deck) {
    const c = cards.find((c) => c.id === id);
    requireRule(c, "Carta desconhecida.");
    requireRule(
      c.sector === "UNIVERSAL" || c.sector === sector,
      "Carta de outro Setor.",
    );
    count[id] = (count[id] || 0) + 1;
    requireRule(count[id] <= 2, "Máximo de 2 cópias por carta.");
    if (c.sector === sector) own++;
  }
  requireRule(own >= 12, "Escolha pelo menos 12 cartas do seu Setor.");
}
export function draw(c: Character, count = 1, training = false) {
  const pile = training ? "formationDraw" : "draw",
    hand = training ? "formationHand" : "hand",
    discard = training ? "formationDiscard" : "discard";
  for (let i = 0; i < count; i++) {
    if (!c[pile].length) {
      c[pile] = shuffle(c[discard]);
      c[discard] = [];
    }
    const card = c[pile].pop();
    if (card) c[hand].push(card);
  }
}
export function prepare(c: Character, preserveBanished = false) {
  const banished = preserveBanished ? [...c.banished] : [];
  const available = [...c.deck];
  for (const cardId of banished) {
    const index = available.indexOf(cardId);
    if (index >= 0) available.splice(index, 1);
  }
  c.draw = shuffle(available);
  c.hand = [];
  c.discard = [];
  c.banished = banished;
  c.formationDraw = shuffle(formation(c.skills));
  c.formationHand = [];
  c.formationDiscard = [];
  c.cooldown = preserveBanished ? Math.max(0, c.cooldown - c.ownTurns) : 0;
  c.ownTurns = 0;
  c.shield = 0;
  c.actions = 1;
  c.remainingMove = c.movement;
  c.burned = false;
  c.reacted = false;
  draw(c, 3);
  draw(c, 2, true);
}
const SECTOR_ATTRIBUTES: Record<Sector, Attributes> = {
  "INCIDÊNCIA": { FOR: 2, VIG: 2, INT: 1, AGI: 1, PRE: 1 },
  "RELAÇÃO": { FOR: 1, VIG: 1, INT: 1, AGI: 1, PRE: 3 },
  "SOCIALISTA": { FOR: 1, VIG: 2, INT: 1, AGI: 1, PRE: 2 },
  "JUSTIÇA": { FOR: 1, VIG: 1, INT: 2, AGI: 1, PRE: 2 },
  "DOUTRINA": { FOR: 1, VIG: 1, INT: 3, AGI: 1, PRE: 1 },
};
export function defaultAttributes(sector: Sector): Attributes {
  return { ...(SECTOR_ATTRIBUTES[sector] || { FOR: 1, VIG: 1, INT: 2, AGI: 2, PRE: 1 }) };
}
export function newCharacter(
  ownerId: string,
  name: string,
  sector: Sector,
  npc = false,
): Character {
  const maxHp = sector === "INCIDÊNCIA" ? 14 : sector === "DOUTRINA" ? 10 : 12;
  const c: Character = {
    id: randomUUID(),
    ownerId,
    name,
    sector,
    npc,
    hidden: false,
    portrait: "",
    sin: "Apostador",
    attributes: defaultAttributes(sector),
    age: 32,
    story: "",
    death: "",
    hp: maxHp,
    maxHp,
    moral: 8,
    maxMoral: 8,
    sanity: 10,
    maxSanity: 10,
    fame: 0,
    defense: 11,
    resistance: 8,
    shield: 0,
    movement: 3,
    position: { x: 8, y: 8 },
    effects: [],
    deck: starterDeck(sector),
    draw: [],
    hand: [],
    discard: [],
    banished: [],
    skills: ["Investigação", "Percepção", "Persuasão"],
    formationDraw: [],
    formationHand: [],
    formationDiscard: [],
    weapon: "PISTOLA",
    instrument: true,
    cooldown: 0,
    ownTurns: 0,
    actions: 1,
    remainingMove: 3,
    burned: false,
    reacted: false,
  };
  prepare(c);
  return c;
}
export function newScene(
  name: string,
  type: "board" | "novel" = "board",
): Scene {
  return {
    id: randomUUID(),
    name,
    type,
    visible: true,
    mode: "CÓMUM",
    background: "",
    description: "",
    width: 26,
    height: 22,
    grid: 36,
    gridOpacity: 0.2,
    rooms: [],
    walls: [],
    blocked: [],
    doors: [],
    drawings: [],
    tiles: {},
    props: [],
    dialogues: [
      {
        id: randomUUID(),
        speaker: "Narrador",
        text: "O silêncio também é uma forma de testemunho.",
        portrait: "",
      },
    ],
    dialogueIndex: 0,
    choices: [],
    chosen: [],
  };
}
export function demoState(ownerId: string): CampaignState {
  const board = newScene("Recepção · Planta da fábrica");
  const layouts = [
    ["Recepção", 1, 1, 6, 5],
    ["Arquivo morto", 10, 1, 6, 5],
    ["Escritório", 19, 1, 6, 5],
    ["Sala de máquinas", 1, 8, 6, 5],
    ["Átrio central", 10, 8, 6, 5],
    ["Produção", 19, 8, 6, 5],
    ["Depósito", 1, 16, 6, 5],
    ["Sala de segurança", 10, 16, 6, 5],
    ["Saída de carga", 19, 16, 6, 5],
  ] as const;
  for (const [name, x, y, w, h] of layouts) {
    board.rooms.push({
      id: randomUUID(),
      name,
      description: `${name}. Há algo que os registros não contam.`,
      image: "",
      visible: true,
      points: [x, y, x + w, y, x + w, y + h, x, y + h],
    });
    board.walls.push(
      [x, y, x + w, y],
      [x, y, x, y + h],
      [x + w, y, x + w, y + h],
      [x, y + h, x + w, y + h],
    );
    board.doors.push({ id: randomUUID(), x: x + 3.5, y: y + h, open: true });
  }
  const exterior = newScene("Exterior da fábrica", "novel");
  exterior.background = "/art/factory.svg";
  exterior.description = "BRINCATEMPO · 23H47";
  exterior.dialogues = [
    {
      id: randomUUID(),
      speaker: "Central de contratos",
      text: "O prazo terminou há sete minutos. Augusto Vilar ainda está no prédio. Encontrem o contrato. Apurem a verdade. Cobrem a dívida.",
      portrait: "",
    },
  ];
  const office = newScene("Escritório do empresário", "novel");
  office.background = "/art/office.svg";
  office.dialogues = [
    {
      id: randomUUID(),
      speaker: "Augusto Vilar",
      text: "Minha alma tem prazo, eu sei. Mas encontrei outra forma de pagar. Trinta inocentes. O Inferno não vai se importar com a diferença.",
      portrait: "",
    },
  ];
  const production = newScene("Sala de produção");
  production.description =
    "As esteiras continuam trabalhando sem funcionários.";
  const judgment = newScene("Julgamento", "novel");
  judgment.background = "/art/office.svg";
  judgment.dialogues = office.dialogues;
  const confrontation = newScene("Confronto");
  confrontation.rooms = structuredClone(board.rooms);
  confrontation.walls = structuredClone(board.walls);
  confrontation.doors = structuredClone(board.doors);
  const hell = newScene("Retorno ao Inferno", "novel");
  hell.mode = "HELLS";
  hell.background = "/art/inferno.svg";
  hell.dialogues = [
    {
      id: randomUUID(),
      speaker: "O Escrevente",
      text: "O contrato será arquivado. As consequências permanecem abertas.",
      portrait: "",
    },
  ];
  for (const s of [office, judgment])
    s.choices = [
      {
        id: randomUUID(),
        label: "Aceitar a oferta",
        sanity: -2,
        fame: 3,
        trust: -2,
        nextScene: hell.id,
        combat: false,
        condition: "always",
        once: true,
      },
      {
        id: randomUUID(),
        label: "Recusar e cobrar a alma",
        sanity: 0,
        fame: 0,
        trust: 0,
        nextScene: confrontation.id,
        combat: true,
        condition: "always",
        once: true,
      },
      {
        id: randomUUID(),
        label: "Fugir",
        sanity: 0,
        fame: 0,
        trust: -2,
        nextScene: exterior.id,
        combat: false,
        condition: "always",
        once: true,
      },
    ];
  const npc = newCharacter(ownerId, "Augusto Vilar", "RELAÇÃO", true);
  npc.hp = 11;
  npc.maxHp = 11;
  npc.defense = 12;
  npc.position = { x: 13, y: 10 };
  return {
    scenes: [
      exterior,
      board,
      office,
      production,
      judgment,
      confrontation,
      hell,
      churchScene(),
    ],
    activeSceneId: board.id,
    characters: [npc],
    cards: structuredClone(catalog),
    logs: [
      {
        id: randomUUID(),
        text: "Contrato 001 aberto. O Fabricante de Brinquedos aguarda julgamento.",
        time: new Date().toISOString(),
        kind: "system",
        author: "ORDER",
      },
    ],
    combat: {
      active: false,
      paused: false,
      round: 1,
      index: 0,
      order: [],
      pending: [],
    },
    trust: 6,
    proofs: [],
    variables: {},
    allowHandInspection: false,
    status: "open",
    audio: { url: "", startedAt: 0, playing: false },
  };
}
function cross(ax: number, ay: number, bx: number, by: number) {
  return ax * by - ay * bx;
}
export function segmentsIntersect(a: Point, b: Point, c: Point, d: Point) {
  const rx = b.x - a.x,
    ry = b.y - a.y,
    sx = d.x - c.x,
    sy = d.y - c.y,
    den = cross(rx, ry, sx, sy);
  if (Math.abs(den) < 1e-9) return false;
  const t = cross(c.x - a.x, c.y - a.y, sx, sy) / den,
    u = cross(c.x - a.x, c.y - a.y, rx, ry) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}
export function clearLine(scene: Scene, a: Point, b: Point) {
  const from = { x: a.x + 0.5, y: a.y + 0.5 },
    to = { x: b.x + 0.5, y: b.y + 0.5 };
  return !scene.walls.some((w) => {
    if (
      !segmentsIntersect(from, to, { x: w[0], y: w[1] }, { x: w[2], y: w[3] })
    )
      return false;
    return !scene.doors.some(
      (d) =>
        d.open &&
        segmentsIntersect(
          from,
          to,
          { x: d.x - 0.48, y: d.y - 0.48 },
          { x: d.x + 0.48, y: d.y + 0.48 },
        ),
    );
  });
}
export function path(
  scene: Scene,
  start: Point,
  end: Point,
  occupied: Point[] = [],
) {
  if (end.x < 0 || end.y < 0 || end.x >= scene.width || end.y >= scene.height)
    return null;
  const key = (p: Point) => `${p.x},${p.y}`,
    queue = [start],
    cost = new Map([[key(start), 0]]);
  for (let i = 0; i < queue.length; i++) {
    const at = queue[i],
      n = cost.get(key(at))!;
    if (at.x === end.x && at.y === end.y) return n;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const next = { x: at.x + dx, y: at.y + dy };
      if (
        next.x < 0 ||
        next.y < 0 ||
        next.x >= scene.width ||
        next.y >= scene.height ||
        cost.has(key(next)) ||
        scene.blocked.some((p) => key(p) === key(next)) ||
        occupied.some((p) => key(p) === key(next)) ||
        !clearLine(scene, at, next)
      )
        continue;
      cost.set(key(next), n + 1);
      queue.push(next);
    }
  }
  return null;
}
export function damage(c: Character, amount: number) {
  const absorbed = Math.min(c.shield, amount);
  c.shield -= absorbed;
  c.hp = clamp(c.hp - (amount - absorbed), c.maxHp);
}
export function beginTurn(c: Character) {
  c.ownTurns++;
  c.shield = 0;
  c.actions = c.hp > 0 ? 1 : 0;
  c.remainingMove = c.hp > 0 ? c.movement : 0;
  c.burned = false;
  if (c.ownTurns > 1) {
    draw(c);
    draw(c, 1, true);
  }
}
/* Migração: campanhas criadas com o catálogo demonstrativo antigo recebem as cartas reais e decks prontos. */
const LEGACY_CARD = /^(passo|defesa|corte|cuidados|questionamento|[0-4]-[0-5])$/;
export function migrateCards(s: CampaignState) {
  for (const c of s.characters) if (!c.attributes) c.attributes = defaultAttributes(c.sector);
  for (const sc of s.scenes) if (!sc.props && sc.background === "/art/order/backgrounds/church-map.webp") { sc.props = churchProps(); sc.tiles = churchTiles(); }
  if (s.cards.some((c) => c.id === "U01")) return false;
  s.cards = [
    ...structuredClone(catalog),
    ...s.cards.filter((c) => !LEGACY_CARD.test(c.id)),
  ];
  for (const c of s.characters) {
    if (c.deck.some((id) => LEGACY_CARD.test(id))) {
      c.deck = starterDeck(c.sector);
      prepare(c);
    }
  }
  return true;
}
/* Planta de Santa Cecília no estilo Clue: 32×24 casas sobre a arte, corredores livres,
   salas com paredes e passagens nas portas. Mesmas coordenadas do prólogo offline (board.js). */
const CHURCH_CORRIDORS = [[11,2,12,12],[10,7,10,8],[21,2,21,12],[22,7,22,12],[5,13,28,13],[15,14,18,19],[16,20,17,21]];
const CHURCH_ROOMS: { name: string; rect: number[]; doors: number[][]; image: string; text: string }[] = [
  { name: "Escritório da Ordem", rect: [5,1,10,6], doors: [[10,7]], image: "/art/order/backgrounds/archive.png", text: "Uma mesa pesada, um tinteiro seco e gavetas numeradas." },
  { name: "Nave principal", rect: [13,0,20,12], doors: [[12,8],[21,8],[14,13],[19,13],[16,13],[17,13]], image: "/art/order/backgrounds/nave.png", text: "Cheiro de cera apagada. Uma fotografia de almoço junto aos bancos." },
  { name: "Sacristia", rect: [22,1,28,6], doors: [[21,5]], image: "/art/order/backgrounds/sacristy.png", text: "Um estojo de chaves numa gaveta. A porta sob o altar deve ficar fechada." },
  { name: "Arquivo de documentos", rect: [2,7,9,12], doors: [[11,10],[8,13]], image: "/art/order/backgrounds/archive.png", text: "Livro de acolhimento e pasta de recortes. A lâmpada ilumina metade da mesa." },
  { name: "Confessionário", rect: [23,7,30,12], doors: [[22,10],[24,13]], image: "/art/order/backgrounds/confessional.png", text: "Uma folha presa sob o apoio dos joelhos." },
  { name: "Quarto trancado", rect: [1,14,7,20], doors: [[6,13]], image: "/art/order/backgrounds/locked-room.png", text: "Tinta branca na fechadura. Coisas de quem partiu." },
  { name: "Sala de reuniões", rect: [8,14,14,20], doors: [[11,13],[15,16]], image: "/art/order/backgrounds/nave.png", text: "Cadeiras de tamanhos diferentes e um casaco pequeno no encosto." },
  { name: "Corredor dos fundos", rect: [19,14,23,20], doors: [[20,13],[18,16]], image: "/art/order/backgrounds/corridor.png", text: "Riscos antigos na madeira, à altura das mãos." },
  { name: "Pátio / abrigo da criança", rect: [24,14,30,21], doors: [[27,13]], image: "/art/order/backgrounds/courtyard.png", text: "Uma menina atrás do banco, com um desenho contra o peito." },
];
/* Mobília da igreja para a vista isométrica (mesmas casas da planta). */
export function churchProps(): Prop[] {
  const P = (kind: PropKind, x: number, y: number, rot: 0 | 1 = 0): Prop => ({ id: randomUUID(), kind, x, y, rot });
  return [
    P("mesa", 7, 3), P("cadeira", 7, 4), P("estante", 5, 1), P("estante", 6, 1), P("vela", 9, 1),
    P("altar", 16, 1), P("altar", 17, 1), P("cruz", 16, 0), P("vela", 15, 1), P("vela", 18, 1),
    ...[4, 6, 8, 10].flatMap((y) => [P("banco", 14, y), P("banco", 15, y), P("banco", 18, y), P("banco", 19, y)]),
    P("pilar", 13, 3), P("pilar", 20, 3), P("pilar", 13, 9), P("pilar", 20, 9),
    P("armario", 27, 1), P("caixa", 23, 2), P("espelho", 28, 4), P("vela", 25, 3),
    P("estante", 2, 7), P("estante", 3, 7), P("estante", 4, 7), P("mesa", 5, 10), P("cadeira", 5, 11), P("caixa", 2, 12),
    P("cadeira", 26, 9), P("cadeira", 28, 9), P("vela", 27, 11), P("porta", 30, 10, 1),
    P("cama", 2, 16), P("armario", 5, 14), P("caixa", 3, 19), P("espelho", 6, 19),
    P("mesa", 10, 16), P("mesa", 11, 16), P("cadeira", 9, 16, 1), P("cadeira", 12, 16, 1), P("cadeira", 10, 17), P("cadeira", 11, 17),
    P("barril", 19, 19), P("barril", 20, 19), P("caixa", 23, 18),
    P("banco", 26, 18), P("barril", 29, 15), P("vela", 25, 20),
  ];
}
export function churchTiles(): Record<string, Material> {
  const t: Record<string, Material> = {};
  const fill = (x1: number, y1: number, x2: number, y2: number, m: Material) => { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) t[`${x},${y}`] = m; };
  fill(16, 0, 17, 12, "tapete");
  fill(23, 7, 30, 12, "roxo");
  fill(24, 14, 30, 21, "grama");
  fill(19, 14, 23, 20, "terra");
  fill(1, 14, 7, 20, "vermelho");
  return t;
}
export function churchScene(): Scene {
  const scene = newScene("Santa Cecília · Planta (Clue)");
  Object.assign(scene, { width: 32, height: 24, grid: 40, gridOpacity: 0.12, background: "/art/order/backgrounds/church-map.webp", description: "Corredores, portas e nove salas. Role o d6 para andar como no Clue.", dialogues: [] });
  const key = (x: number, y: number) => `${x},${y}`;
  const walkable = new Set<string>();
  for (const [x1, y1, x2, y2] of CHURCH_CORRIDORS)
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) walkable.add(key(x, y));
  for (const r of CHURCH_ROOMS) {
    const [x1, y1, x2, y2] = r.rect;
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) walkable.add(key(x, y));
    scene.rooms.push({ id: randomUUID(), name: r.name, description: r.text, image: r.image, visible: true, points: [x1, y1, x2 + 1, y1, x2 + 1, y2 + 1, x1, y2 + 1] });
    const isDoor = (dx: number, dy: number) => r.doors.some(([a, b]) => a === dx && b === dy);
    for (let x = x1; x <= x2; x++) {
      if (!isDoor(x, y1 - 1)) scene.walls.push([x, y1, x + 1, y1]);
      else scene.doors.push({ id: randomUUID(), x: x + 0.5, y: y1, open: true });
      if (!isDoor(x, y2 + 1)) scene.walls.push([x, y2 + 1, x + 1, y2 + 1]);
      else scene.doors.push({ id: randomUUID(), x: x + 0.5, y: y2 + 1, open: true });
    }
    for (let y = y1; y <= y2; y++) {
      if (!isDoor(x1 - 1, y)) scene.walls.push([x1, y, x1, y + 1]);
      if (!isDoor(x2 + 1, y)) scene.walls.push([x2 + 1, y, x2 + 1, y + 1]);
    }
  }
  for (let y = 0; y < scene.height; y++)
    for (let x = 0; x < scene.width; x++) if (!walkable.has(key(x, y))) scene.blocked.push({ x, y });
  scene.props = churchProps();
  scene.tiles = churchTiles();
  return scene;
}
