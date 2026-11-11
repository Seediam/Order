import type { Card, Sector } from "./types";
export const sectorInfo: Record<
  Sector,
  { role: string; description: string; passive: string }
> = {
  INCIDÊNCIA: {
    role: "Tank",
    description: "A primeira linha entre o perigo e a sentença.",
    passive: "Bastião: 1 vez por rodada, intercepte um ataque a aliado adjacente e reduza o dano em 1.",
  },
  RELAÇÃO: {
    role: "Equilíbrio",
    description: "Todo favor tem duas assinaturas.",
    passive: "Reciprocidade: 1 vez por rodada, se uma Ação beneficiar você e outro personagem, ganhe +1 Escudo.",
  },
  SOCIALISTA: {
    role: "Suporte",
    description: "Ninguém atravessa o julgamento sozinho.",
    passive: "Rede de Apoio: 1 vez por Cena, transfira 1 Moral ou 2 de Escudo para aliado até 3 casas.",
  },
  JUSTIÇA: {
    role: "Carry",
    description: "A verdade pesa mais que qualquer lâmina.",
    passive: "Veredito: ao registrar uma Prova verdadeira, +1 no próximo teste de Julgamento ou ataque (máx. 2 cargas).",
  },
  DOUTRINA: {
    role: "Assassino",
    description: "Uma ordem. Um nome. Nenhuma testemunha.",
    passive: "Sentença Solitária: o primeiro ataque por rodada em inimigo isolado causa +2 de dano.",
  },
};
import { ORDER_CARDS, STARTER } from "./order-cards";
/* Catálogo real: 50 cartas ilustradas + 8 de Doutrina (Manual v0.1, cap. 11). */
export const catalog: Card[] = ORDER_CARDS;
/* Decks prontos (cap. 11.3): 2× seis cartas do Setor + 2× quatro Universais = 20. */
export function starterDeck(sector: Sector) {
  const s = STARTER[sector];
  return [...s.sector, ...s.universal].flatMap((id) => [id, id]);
}
export const gates = [
  {
    min: 0,
    name: "I · Antecâmara",
    title: "Recruta",
    threat: "Auditores observam seus primeiros contratos.",
    enemy: "Escrevente Sem Boca",
  },
  {
    min: 4,
    name: "II · Portão do Ferro",
    title: "Cobrador",
    threat: "Um perseguidor a cada dois contratos.",
    enemy: "Cão de Selo",
  },
  {
    min: 8,
    name: "III · Portão do Vidro",
    title: "Notório",
    threat: "Uma emboscada ou chantagem por contrato.",
    enemy: "Auditor de Dentes",
  },
  {
    min: 13,
    name: "IV · Portão da Carne",
    title: "Temido",
    threat: "Um rival de elite disputa sua posição.",
    enemy: "Carniceiro de Cláusulas",
  },
  {
    min: 19,
    name: "V · Portão da Coroa",
    title: "Marcado",
    threat: "Caçada ativa. Até os superiores tramam sua queda.",
    enemy: "Executor da Coroa",
  },
];
