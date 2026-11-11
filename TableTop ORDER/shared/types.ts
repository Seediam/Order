export const SECTORS = [
  "INCIDÊNCIA",
  "RELAÇÃO",
  "SOCIALISTA",
  "JUSTIÇA",
  "DOUTRINA",
] as const;
export type Sector = (typeof SECTORS)[number];
export const SKILLS = [
  "Persuasão",
  "Enganação",
  "Comunicação",
  "Flerte",
  "Furtividade",
  "Investigação",
  "Percepção",
  "Intimidação",
  "Resistência",
  "Discernimento",
] as const;
export const SINS = [
  "Apostador",
  "Miliciano",
  "Luxuosa",
  "Traidor",
  "Ganancioso",
  "Invído",
  "Conselho de Onça",
];
export type Mode = "HELLS" | "CÓMUM";
export interface User {
  id: string;
  username: string;
  displayName: string;
  role: "MASTER" | "PLAYER";
  avatar: string;
}
export interface Point {
  x: number;
  y: number;
}
export interface Room {
  id: string;
  name: string;
  description: string;
  image: string;
  visible: boolean;
  points: number[];
}
export interface Door {
  id: string;
  x: number;
  y: number;
  open: boolean;
}
export interface Effect {
  kind:
    | "damage"
    | "heal"
    | "shield"
    | "moral"
    | "sanity"
    | "move"
    | "draw"
    | "incision";
  amount: number;
}
export interface Card {
  id: string;
  name: string;
  sector: Sector | "UNIVERSAL";
  description: string;
  art: string;
  dice: number[];
  cost: number;
  range: number;
  target: "enemy" | "ally" | "self";
  hells: Effect[];
  common: Effect[];
  tags: string[];
}
export interface Character {
  id: string;
  ownerId: string;
  name: string;
  portrait: string;
  sector: Sector;
  sin: string;
  age: number;
  story: string;
  death: string;
  npc: boolean;
  hidden: boolean;
  hp: number;
  maxHp: number;
  moral: number;
  maxMoral: number;
  sanity: number;
  maxSanity: number;
  fame: number;
  defense: number;
  resistance: number;
  shield: number;
  movement: number;
  position: Point;
  effects: string[];
  deck: string[];
  draw: string[];
  hand: string[];
  discard: string[];
  banished: string[];
  skills: string[];
  formationDraw: string[];
  formationHand: string[];
  formationDiscard: string[];
  weapon: "PISTOLA" | "FACA" | "NENHUMA";
  instrument: boolean;
  cooldown: number;
  ownTurns: number;
  actions: number;
  remainingMove: number;
  burned: boolean;
  reacted: boolean;
}
export interface Choice {
  id: string;
  label: string;
  sanity: number;
  fame: number;
  trust: number;
  nextScene: string;
  combat: boolean;
  condition: "always" | "proofs" | "moral";
  once: boolean;
}
export interface Dialogue {
  id: string;
  speaker: string;
  text: string;
  portrait: string;
}
export interface Scene {
  id: string;
  name: string;
  type: "board" | "novel";
  visible: boolean;
  mode: Mode;
  background: string;
  description: string;
  width: number;
  height: number;
  grid: number;
  gridOpacity: number;
  rooms: Room[];
  walls: number[][];
  blocked: Point[];
  doors: Door[];
  drawings: number[][];
  dialogues: Dialogue[];
  dialogueIndex: number;
  choices: Choice[];
  chosen: string[];
}
export interface DiceRoll {
  sides: 6 | 20;
  value: number;
  ok?: boolean;
  label?: string;
  detail?: string;
}
export interface Log {
  id: string;
  text: string;
  rolls?: DiceRoll[];
  time: string;
  kind: "system" | "chat" | "dice" | "combat" | "audit";
  author: string;
}
export interface Combat {
  active: boolean;
  paused: boolean;
  round: number;
  index: number;
  order: string[];
  pending: { actor: string; target: string; cardId: string }[];
}
export interface CampaignState {
  scenes: Scene[];
  activeSceneId: string;
  characters: Character[];
  cards: Card[];
  logs: Log[];
  combat: Combat;
  trust: number;
  proofs: string[];
  variables: Record<string, string>;
  allowHandInspection: boolean;
  status: "open" | "active" | "closed";
  audio: { url: string; startedAt: number; playing: boolean };
}
export type PublicCharacter = Omit<
  Character,
  | "deck"
  | "draw"
  | "hand"
  | "discard"
  | "banished"
  | "formationDraw"
  | "formationHand"
  | "formationDiscard"
> & {
  handCount: number;
  drawCount: number;
  discardCount: number;
  banishedCount: number;
  hand?: string[];
  deck?: string[];
  formationHand?: string[];
};
export interface ViewState
  extends Omit<CampaignState, "characters" | "combat"> {
  characters: PublicCharacter[];
  combat: Omit<Combat, "pending"> & {
    pending: { actor: string; target: string }[];
  };
  id: string;
  name: string;
  description: string;
  banner: string;
  ownerId: string;
  revision: number;
  online: string[];
}
export interface CampaignSummary {
  id: string;
  name: string;
  description: string;
  banner: string;
  ownerId: string;
  owner: string;
  updatedAt: string;
  members: number;
  online: number;
  joined: boolean;
  status: string;
}
export interface Asset {
  id: string;
  name: string;
  category: string;
  mime: string;
  size: number;
  url: string;
  thumbnail: string;
}
export type Action = { type: string; [key: string]: unknown };
export interface ClientEvents {
  "campaign:join": (
    id: string,
    ack: (r: { ok: boolean; error?: string }) => void,
  ) => void;
  "campaign:action": (
    payload: { campaignId: string; action: Action },
    ack: (r: { ok: boolean; error?: string }) => void,
  ) => void;
}
export interface ServerEvents {
  "campaign:state": (state: ViewState) => void;
  "campaign:presence": (ids: string[]) => void;
}
