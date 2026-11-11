/* Gerado de ../cards.js (cartas ilustradas transcritas + Doutrina do Manual v0.1). Efeitos numéricos automatizados; o texto completo fica na descrição para o Mestre adjudicar condições. */
import type { Card, Sector } from "./types";
export const ORDER_CARDS: Card[] = [
 {
  "id": "U01",
  "name": "Disparo Cauteloso",
  "sector": "UNIVERSAL",
  "description": "HELLS: Ataque com arma. Causa 1 de dano base, além do bônus da arma equipada.\nCÓMUM: Realiza um ataque de 1 de dano base ou concede +1 ao próximo teste de Intimidação contra o alvo.",
  "art": "/art/order/cards/U01.webp",
  "dice": [
   1,
   2,
   3,
   5,
   6
  ],
  "cost": 0,
  "range": 2,
  "target": "enemy",
  "hells": [
   {
    "kind": "damage",
    "amount": 1
   }
  ],
  "common": [
   {
    "kind": "damage",
    "amount": 1
   }
  ],
  "tags": [
   "Ataque",
   "Arma"
  ]
 },
 {
  "id": "U02",
  "name": "Cobrir-se",
  "sector": "UNIVERSAL",
  "description": "HELLS: Recebe 2 de Proteção.\nCÓMUM: Recupera 1 de Moral ou reduz em 1 a Suspeita de um NPC.",
  "art": "/art/order/cards/U02.webp",
  "dice": [
   1,
   2,
   4,
   6
  ],
  "cost": 0,
  "range": 0,
  "target": "self",
  "hells": [
   {
    "kind": "shield",
    "amount": 2
   }
  ],
  "common": [
   {
    "kind": "moral",
    "amount": 1
   }
  ],
  "tags": [
   "Proteção"
  ]
 },
 {
  "id": "U03",
  "name": "Observação Silenciosa",
  "sector": "UNIVERSAL",
  "description": "HELLS: O próximo ataque contra o inimigo observado recebe +1 de dano.\nCÓMUM: Recebe +1 no próximo teste de Percepção ou Investigação relacionado à cena.",
  "art": "/art/order/cards/U03.webp",
  "dice": [
   2,
   3,
   4,
   6
  ],
  "cost": 0,
  "range": 4,
  "target": "enemy",
  "hells": [],
  "common": [],
  "tags": [
   "Marca"
  ]
 },
 {
  "id": "U04",
  "name": "Passo Lateral",
  "sector": "UNIVERSAL",
  "description": "HELLS: Movimenta até 2 quadrados adicionais sem atacar.\nCÓMUM: Movimenta até 2 quadrados adicionais durante exploração.",
  "art": "/art/order/cards/U04.webp",
  "dice": [
   1,
   3,
   5,
   6
  ],
  "cost": 0,
  "range": 0,
  "target": "self",
  "hells": [
   {
    "kind": "move",
    "amount": 2
   }
  ],
  "common": [
   {
    "kind": "move",
    "amount": 2
   }
  ],
  "tags": [
   "Movimento"
  ]
 },
 {
  "id": "U05",
  "name": "Interrogar",
  "sector": "UNIVERSAL",
  "description": "HELLS: Aplica Exposto a um inimigo ao alcance de visão.\nCÓMUM: Permite formular uma pergunta adicional e concede +1 ao teste de Comunicação associado.",
  "art": "/art/order/cards/U05.webp",
  "dice": [
   1,
   2,
   3,
   6
  ],
  "cost": 0,
  "range": 5,
  "target": "enemy",
  "hells": [],
  "common": [],
  "tags": [
   "Exposto"
  ]
 },
 {
  "id": "U06",
  "name": "Primeiros Socorros",
  "sector": "UNIVERSAL",
  "description": "HELLS: Recupera 2 de Vida de um alvo adjacente ou de si mesmo.\nCÓMUM: Recupera 2 de Vida durante uma situação física de perigo.",
  "art": "/art/order/cards/U06.webp",
  "dice": [
   1,
   2,
   5,
   6
  ],
  "cost": 0,
  "range": 1,
  "target": "ally",
  "hells": [
   {
    "kind": "heal",
    "amount": 2
   }
  ],
  "common": [
   {
    "kind": "heal",
    "amount": 2
   }
  ],
  "tags": [
   "Cura"
  ]
 },
 {
  "id": "U07",
  "name": "Documento de Guarda",
  "sector": "UNIVERSAL",
  "description": "HELLS: Recebe 2 de Proteção contra o próximo ataque.\nCÓMUM: Recupera 1 de Moral ao organizar uma evidência já obtida. Não cria novas provas.",
  "art": "/art/order/cards/U07.webp",
  "dice": [
   1,
   3,
   4,
   5
  ],
  "cost": 0,
  "range": 0,
  "target": "self",
  "hells": [
   {
    "kind": "shield",
    "amount": 2
   }
  ],
  "common": [
   {
    "kind": "moral",
    "amount": 1
   }
  ],
  "tags": [
   "Proteção"
  ]
 },
 {
  "id": "U08",
  "name": "Fuga Calculada",
  "sector": "UNIVERSAL",
  "description": "HELLS: Movimenta até 3 quadrados para longe de um inimigo.\nCÓMUM: Abandona uma posição perigosa. A consequência narrativa depende do contexto.",
  "art": "/art/order/cards/U08.webp",
  "dice": [
   2,
   3,
   5,
   6
  ],
  "cost": 0,
  "range": 0,
  "target": "self",
  "hells": [
   {
    "kind": "move",
    "amount": 3
   }
  ],
  "common": [],
  "tags": [
   "Movimento"
  ]
 },
 {
  "id": "U09",
  "name": "Pressentimento",
  "sector": "UNIVERSAL",
  "description": "HELLS: Revela a direção do próximo ataque anunciado e recebe 1 de Proteção.\nCÓMUM: Permite observar uma reação corporal de um NPC antes de escolher a próxima resposta.",
  "art": "/art/order/cards/U09.webp",
  "dice": [
   1,
   2,
   4,
   6
  ],
  "cost": 0,
  "range": 0,
  "target": "self",
  "hells": [
   {
    "kind": "shield",
    "amount": 1
   }
  ],
  "common": [],
  "tags": [
   "Proteção"
  ]
 },
 {
  "id": "U10",
  "name": "Último Recurso",
  "sector": "UNIVERSAL",
  "description": "HELLS: Causa 3 de dano em alcance 1. O personagem perde 1 de Vida após o ataque.\nCÓMUM: Recebe +2 em um teste de Intimidação e perde 1 de Moral.",
  "art": "/art/order/cards/U10.webp",
  "dice": [
   2,
   4,
   5
  ],
  "cost": 0,
  "range": 1,
  "target": "enemy",
  "hells": [
   {
    "kind": "damage",
    "amount": 3
   }
  ],
  "common": [],
  "tags": [
   "Ataque",
   "Custo de Vida"
  ]
 },
 {
  "id": "I01",
  "name": "Interposição",
  "sector": "INCIDÊNCIA",
  "description": "HELLS: Concede 3 de Proteção a si mesmo ou a um aliado. Se impedir dano real, ganha 1 Guarda.\nCÓMUM: Assume uma consequência física destinada a outra pessoa. Recebe 2 de Proteção durante a ação.",
  "art": "/art/order/cards/I01.webp",
  "dice": [
   1,
   2,
   3,
   5
  ],
  "cost": 0,
  "range": 1,
  "target": "ally",
  "hells": [
   {
    "kind": "shield",
    "amount": 3
   }
  ],
  "common": [
   {
    "kind": "shield",
    "amount": 2
   }
  ],
  "tags": [
   "Proteção",
   "Guarda"
  ]
 },
 {
  "id": "I02",
  "name": "Arrombamento",
  "sector": "INCIDÊNCIA",
  "description": "HELLS: Causa 2 de dano e empurra o alvo 1 quadrado.\nCÓMUM: Força uma porta ou obstáculo físico. Pode aumentar a Suspeita de testemunhas.",
  "art": "/art/order/cards/I02.webp",
  "dice": [
   2,
   3,
   4,
   5
  ],
  "cost": 0,
  "range": 1,
  "target": "enemy",
  "hells": [
   {
    "kind": "damage",
    "amount": 2
   }
  ],
  "common": [],
  "tags": [
   "Ataque",
   "Empurrão"
  ]
 },
 {
  "id": "I03",
  "name": "Escudo Humano",
  "sector": "INCIDÊNCIA",
  "description": "HELLS: Redireciona para si o próximo ataque contra um aliado adjacente e reduz o dano em 2. No jogo solo, reduz em 2 o próximo dano contra si.\nCÓMUM: Intervém fisicamente para impedir uma agressão a alguém próximo.",
  "art": "/art/order/cards/I03.webp",
  "dice": [
   1,
   4,
   5,
   6
  ],
  "cost": 0,
  "range": 0,
  "target": "self",
  "hells": [
   {
    "kind": "shield",
    "amount": 2
   }
  ],
  "common": [],
  "tags": [
   "Proteção"
  ]
 },
 {
  "id": "I04",
  "name": "Pisada de Ferro",
  "sector": "INCIDÊNCIA",
  "description": "HELLS: Causa 3 de dano em alcance 1. O alvo perde 1 quadrado de movimentação no próximo turno.\nCÓMUM: Bloqueia fisicamente uma passagem durante um turno.",
  "art": "/art/order/cards/I04.webp",
  "dice": [
   1,
   2,
   6
  ],
  "cost": 0,
  "range": 1,
  "target": "enemy",
  "hells": [
   {
    "kind": "damage",
    "amount": 3
   }
  ],
  "common": [],
  "tags": [
   "Ataque"
  ]
 },
 {
  "id": "I05",
  "name": "Não Recuo",
  "sector": "INCIDÊNCIA",
  "description": "HELLS: Reduz em 2 o próximo dano recebido. Se realmente impedir dano, ganha 1 Guarda.\nCÓMUM: Recebe +2 em um teste de Resistência para manter uma posição ou suportar intimidação.",
  "art": "/art/order/cards/I05.webp",
  "dice": [
   1,
   2,
   3,
   4,
   6
  ],
  "cost": 0,
  "range": 0,
  "target": "self",
  "hells": [
   {
    "kind": "shield",
    "amount": 2
   }
  ],
  "common": [],
  "tags": [
   "Proteção",
   "Guarda"
  ]
 },
 {
  "id": "I06",
  "name": "Ameaça Visível",
  "sector": "INCIDÊNCIA",
  "description": "HELLS: Um inimigo próximo é provocado a priorizar o Searcher no próximo ataque, quando possível.\nCÓMUM: Recebe +2 em Intimidação, mas pode aumentar Suspeita se usar a ameaça contra alguém vulnerável.",
  "art": "/art/order/cards/I06.webp",
  "dice": [
   1,
   3,
   4,
   6
  ],
  "cost": 0,
  "range": 3,
  "target": "enemy",
  "hells": [],
  "common": [],
  "tags": [
   "Provocar"
  ]
 },
 {
  "id": "I07",
  "name": "Resposta Brutal",
  "sector": "INCIDÊNCIA",
  "description": "HELLS: Gasta 2 Guarda para causar 4 de dano em alcance 1.\nCÓMUM: Pode pressionar fisicamente um suspeito para receber +2 em Intimidação, perdendo 1 de Moral.",
  "art": "/art/order/cards/I07.webp",
  "dice": [
   2,
   3,
   6
  ],
  "cost": 0,
  "range": 1,
  "target": "enemy",
  "hells": [
   {
    "kind": "damage",
    "amount": 4
   }
  ],
  "common": [],
  "tags": [
   "Ataque",
   "Gasta Guarda"
  ]
 },
 {
  "id": "I08",
  "name": "Barreira da Culpa",
  "sector": "INCIDÊNCIA",
  "description": "HELLS: Concede 2 de Proteção aos aliados adjacentes. Sem aliados, recebe 3 de Proteção.\nCÓMUM: Protege um testemunho ou uma pessoa ameaçada, impedindo uma interrupção física imediata.",
  "art": "/art/order/cards/I08.webp",
  "dice": [
   1,
   2,
   5,
   6
  ],
  "cost": 0,
  "range": 0,
  "target": "self",
  "hells": [
   {
    "kind": "shield",
    "amount": 3
   }
  ],
  "common": [],
  "tags": [
   "Proteção"
  ]
 },
 {
  "id": "I09",
  "name": "Avanço Demolidor",
  "sector": "INCIDÊNCIA",
  "description": "HELLS: Avança até 2 quadrados e causa 2 de dano a um inimigo adjacente.\nCÓMUM: Força passagem por um obstáculo simples, gastando 1 de Moral se houver resistência.",
  "art": "/art/order/cards/I09.webp",
  "dice": [
   2,
   4,
   5
  ],
  "cost": 0,
  "range": 3,
  "target": "enemy",
  "hells": [
   {
    "kind": "damage",
    "amount": 2
   }
  ],
  "common": [],
  "tags": [
   "Ataque",
   "Avanço"
  ]
 },
 {
  "id": "I10",
  "name": "Última Linha",
  "sector": "INCIDÊNCIA",
  "description": "HELLS: Se estiver com metade ou menos da Vida, recebe 5 de Proteção. Se for atingido, revida com 2 de dano.\nCÓMUM: Se estiver com 3 ou menos de Moral, recupera 2 de Moral e não pode atacar na mesma ação.",
  "art": "/art/order/cards/I10.webp",
  "dice": [
   1,
   5,
   6
  ],
  "cost": 0,
  "range": 0,
  "target": "self",
  "hells": [
   {
    "kind": "shield",
    "amount": 5
   }
  ],
  "common": [
   {
    "kind": "moral",
    "amount": 2
   }
  ],
  "tags": [
   "Proteção",
   "Condicional"
  ]
 },
 {
  "id": "J01",
  "name": "Abrir Inquérito",
  "sector": "JUSTIÇA",
  "description": "HELLS: Marca um inimigo como Sob Julgamento por 2 turnos e ganha 1 Auto.\nCÓMUM: Abre uma nova linha de questionamento. Ganha 1 Auto somente ao verificar uma informação relevante.",
  "art": "/art/order/cards/J01.webp",
  "dice": [
   1,
   2,
   3,
   5
  ],
  "cost": 1,
  "range": 5,
  "target": "enemy",
  "hells": [],
  "common": [],
  "tags": [
   "Sob Julgamento",
   "Autos"
  ]
 },
 {
  "id": "J02",
  "name": "Presunção",
  "sector": "JUSTIÇA",
  "description": "HELLS: Recebe 2 de Proteção. Se um inimigo atacar durante o efeito, ganha 1 Auto.\nCÓMUM: Protege alguém de coerção injustificada. Recupera 1 de Moral quando evita uma agressão desnecessária.",
  "art": "/art/order/cards/J02.webp",
  "dice": [
   1,
   2,
   4,
   6
  ],
  "cost": 1,
  "range": 0,
  "target": "self",
  "hells": [
   {
    "kind": "shield",
    "amount": 2
   }
  ],
  "common": [
   {
    "kind": "moral",
    "amount": 1
   }
  ],
  "tags": [
   "Proteção",
   "Autos"
  ]
 },
 {
  "id": "J03",
  "name": "Confrontar Testemunha",
  "sector": "JUSTIÇA",
  "description": "HELLS: Aplica Exposto. Se o inimigo estiver Sob Julgamento, ganha 1 Auto.\nCÓMUM: Recebe +2 em Discernimento ao confrontar um depoimento com uma evidência real. Se confirmar uma contradição, ganha 1 Auto.",
  "art": "/art/order/cards/J03.webp",
  "dice": [
   1,
   3,
   4,
   5
  ],
  "cost": 1,
  "range": 4,
  "target": "enemy",
  "hells": [],
  "common": [],
  "tags": [
   "Exposto",
   "Autos"
  ]
 },
 {
  "id": "J04",
  "name": "Balança de Ferro",
  "sector": "JUSTIÇA",
  "description": "HELLS: Gasta 1 Auto para receber 3 de Proteção e causar 1 de dano ao próximo atacante.\nCÓMUM: Gasta 1 Auto para repetir um teste de Persuasão ou Discernimento.",
  "art": "/art/order/cards/J04.webp",
  "dice": [
   1,
   3,
   5,
   6
  ],
  "cost": 2,
  "range": 0,
  "target": "self",
  "hells": [
   {
    "kind": "shield",
    "amount": 3
   }
  ],
  "common": [],
  "tags": [
   "Proteção",
   "Gasta Autos"
  ]
 },
 {
  "id": "J05",
  "name": "Sentença Condicional",
  "sector": "JUSTIÇA",
  "description": "HELLS: Causa 2 de dano, recebendo +2 contra um alvo Sob Julgamento.\nCÓMUM: Recebe +2 em um julgamento argumentado com pelo menos duas evidências independentes.",
  "art": "/art/order/cards/J05.webp",
  "dice": [
   2,
   3,
   5,
   6
  ],
  "cost": 1,
  "range": 2,
  "target": "enemy",
  "hells": [
   {
    "kind": "damage",
    "amount": 2
   }
  ],
  "common": [],
  "tags": [
   "Ataque"
  ]
 },
 {
  "id": "J06",
  "name": "Registro Irrefutável",
  "sector": "JUSTIÇA",
  "description": "HELLS: Recebe 1 de Proteção. Se bloquear um ataque anunciado, ganha 1 Auto.\nCÓMUM: Compara dois documentos. Se encontrar uma contradição verificável, ganha 1 Auto e +1 Investigação.",
  "art": "/art/order/cards/J06.webp",
  "dice": [
   1,
   3,
   4,
   6
  ],
  "cost": 1,
  "range": 0,
  "target": "self",
  "hells": [
   {
    "kind": "shield",
    "amount": 1
   }
  ],
  "common": [],
  "tags": [
   "Proteção",
   "Autos"
  ]
 },
 {
  "id": "J07",
  "name": "Direito de Defesa",
  "sector": "JUSTIÇA",
  "description": "HELLS: Recebe 2 de Proteção. Se decidir não atacar neste turno, ganha 1 Auto.\nCÓMUM: Permite ouvir uma defesa adicional do acusado e pode reduzir 1 de Suspeita.",
  "art": "/art/order/cards/J07.webp",
  "dice": [
   1,
   2,
   3,
   6
  ],
  "cost": 1,
  "range": 0,
  "target": "self",
  "hells": [
   {
    "kind": "shield",
    "amount": 2
   }
  ],
  "common": [],
  "tags": [
   "Proteção",
   "Autos"
  ]
 },
 {
  "id": "J08",
  "name": "Ônus da Prova",
  "sector": "JUSTIÇA",
  "description": "HELLS: O próximo ataque de um inimigo Sob Julgamento causa 2 de dano a menos.\nCÓMUM: Recebe +2 em Discernimento para avaliar uma alegação não comprovada.",
  "art": "/art/order/cards/J08.webp",
  "dice": [
   1,
   3,
   5,
   6
  ],
  "cost": 1,
  "range": 5,
  "target": "enemy",
  "hells": [],
  "common": [],
  "tags": [
   "Sob Julgamento"
  ]
 },
 {
  "id": "J09",
  "name": "Veredito",
  "sector": "JUSTIÇA",
  "description": "HELLS: Gasta 2 Autos para causar 4 de dano a um inimigo Sob Julgamento. Sem ambos os requisitos, causa 1 de dano.\nCÓMUM: Gasta 2 Autos para repetir um teste decisivo de julgamento fundamentado em evidências.",
  "art": "/art/order/cards/J09.webp",
  "dice": [
   2,
   4,
   6
  ],
  "cost": 1,
  "range": 3,
  "target": "enemy",
  "hells": [
   {
    "kind": "damage",
    "amount": 1
   }
  ],
  "common": [],
  "tags": [
   "Ataque",
   "Gasta Autos"
  ]
 },
 {
  "id": "J10",
  "name": "Justiça Cega",
  "sector": "JUSTIÇA",
  "description": "HELLS: Causa 2 de dano a um alvo Sob Julgamento. Se o alvo não estiver marcado, recebe 2 de Proteção em vez de atacar.\nCÓMUM: Permite resistir à pressão para emitir um julgamento sem evidências suficientes, preservando 1 de Moral.",
  "art": "/art/order/cards/J10.webp",
  "dice": [
   1,
   5,
   6
  ],
  "cost": 1,
  "range": 3,
  "target": "enemy",
  "hells": [
   {
    "kind": "damage",
    "amount": 2
   }
  ],
  "common": [],
  "tags": [
   "Ataque",
   "Sob Julgamento"
  ]
 },
 {
  "id": "R01",
  "name": "Dois Lados",
  "sector": "RELAÇÃO",
  "description": "HELLS: A: causa 2 de dano. B: recebe 2 de Proteção.\nCÓMUM: A: +1 Persuasão. B: +1 Enganação.",
  "art": "/art/order/cards/R01.webp",
  "dice": [
   1,
   2,
   3,
   5,
   6
  ],
  "cost": 0,
  "range": 2,
  "target": "enemy",
  "hells": [
   {
    "kind": "damage",
    "amount": 2
   }
  ],
  "common": [],
  "tags": [
   "Ataque",
   "A/B"
  ]
 },
 {
  "id": "R02",
  "name": "Acordo Provisório",
  "sector": "RELAÇÃO",
  "description": "HELLS: A: recupera 2 de Vida. B: movimenta 2 quadrados adicionais.\nCÓMUM: A: recupera 1 de Moral. B: reduz 1 de Suspeita.",
  "art": "/art/order/cards/R02.webp",
  "dice": [
   1,
   2,
   4,
   6
  ],
  "cost": 0,
  "range": 0,
  "target": "self",
  "hells": [
   {
    "kind": "heal",
    "amount": 2
   }
  ],
  "common": [
   {
    "kind": "moral",
    "amount": 1
   }
  ],
  "tags": [
   "Cura",
   "A/B"
  ]
 },
 {
  "id": "R03",
  "name": "Espelho Social",
  "sector": "RELAÇÃO",
  "description": "HELLS: A: causa 1 de dano e compra 1 carta. B: recebe 2 de Proteção.\nCÓMUM: A: +1 Discernimento. B: +1 Comunicação.",
  "art": "/art/order/cards/R03.webp",
  "dice": [
   1,
   3,
   4,
   6
  ],
  "cost": 0,
  "range": 2,
  "target": "enemy",
  "hells": [
   {
    "kind": "damage",
    "amount": 1
   },
   {
    "kind": "draw",
    "amount": 1
   }
  ],
  "common": [],
  "tags": [
   "Ataque",
   "A/B"
  ]
 },
 {
  "id": "R04",
  "name": "Voz Suave, Mão Firme",
  "sector": "RELAÇÃO",
  "description": "HELLS: A: causa 2 de dano. B: empurra 1 quadrado e recebe 1 de Proteção.\nCÓMUM: A: +2 Persuasão. B: +2 Intimidação.",
  "art": "/art/order/cards/R04.webp",
  "dice": [
   1,
   2,
   3,
   6
  ],
  "cost": 0,
  "range": 1,
  "target": "enemy",
  "hells": [
   {
    "kind": "damage",
    "amount": 2
   }
  ],
  "common": [],
  "tags": [
   "Ataque",
   "A/B"
  ]
 },
 {
  "id": "R05",
  "name": "Termos Ocultos",
  "sector": "RELAÇÃO",
  "description": "HELLS: A: compra 1 carta. B: faz o inimigo descartar 1 carta, se possuir mão.\nCÓMUM: A: permite uma pergunta extra. B: concede +1 ao teste para perceber evasivas.",
  "art": "/art/order/cards/R05.webp",
  "dice": [
   2,
   3,
   4,
   5
  ],
  "cost": 0,
  "range": 0,
  "target": "self",
  "hells": [
   {
    "kind": "draw",
    "amount": 1
   }
  ],
  "common": [],
  "tags": [
   "Compra",
   "A/B"
  ]
 },
 {
  "id": "R06",
  "name": "Troca Justa",
  "sector": "RELAÇÃO",
  "description": "HELLS: A: transfere 2 de sua Vida para recuperar 3 de um aliado. Sozinho, recupera 1. B: causa 2 de dano e perde 1 de Vida.\nCÓMUM: A: gasta 1 de Moral para proteger uma relação ameaçada. B: ganha 1 de Moral, aumentando 1 de Suspeita.",
  "art": "/art/order/cards/R06.webp",
  "dice": [
   1,
   2,
   5,
   6
  ],
  "cost": 0,
  "range": 0,
  "target": "self",
  "hells": [
   {
    "kind": "heal",
    "amount": 1
   }
  ],
  "common": [],
  "tags": [
   "Cura",
   "A/B"
  ]
 },
 {
  "id": "R07",
  "name": "Caminho do Meio",
  "sector": "RELAÇÃO",
  "description": "HELLS: A: move 2 quadrados e recebe 1 de Proteção. B: causa 1 de dano e recupera 1 de Vida.\nCÓMUM: A: +1 Investigação. B: +1 Comunicação.",
  "art": "/art/order/cards/R07.webp",
  "dice": [
   1,
   2,
   4,
   5
  ],
  "cost": 0,
  "range": 0,
  "target": "self",
  "hells": [
   {
    "kind": "move",
    "amount": 2
   },
   {
    "kind": "shield",
    "amount": 1
   }
  ],
  "common": [],
  "tags": [
   "Movimento",
   "A/B"
  ]
 },
 {
  "id": "R08",
  "name": "Oferta e Cobrança",
  "sector": "RELAÇÃO",
  "description": "HELLS: A: aplica Exposto. B: recupera 2 de Vida.\nCÓMUM: A: abre uma possibilidade de negociação. B: recupera 1 de Moral e aumenta 1 de Suspeita.",
  "art": "/art/order/cards/R08.webp",
  "dice": [
   1,
   2,
   3,
   6
  ],
  "cost": 0,
  "range": 0,
  "target": "self",
  "hells": [
   {
    "kind": "heal",
    "amount": 2
   }
  ],
  "common": [
   {
    "kind": "moral",
    "amount": 1
   }
  ],
  "tags": [
   "Cura",
   "A/B"
  ]
 },
 {
  "id": "R09",
  "name": "Contrato de Duas Vias",
  "sector": "RELAÇÃO",
  "description": "HELLS: A: concede +1 de dano ao próximo ataque. B: compra 1 carta.\nCÓMUM: A: +2 no próximo teste que utilize uma evidência citada. B: adia uma decisão imediata, gastando 1 de Moral.",
  "art": "/art/order/cards/R09.webp",
  "dice": [
   1,
   3,
   4,
   5
  ],
  "cost": 0,
  "range": 0,
  "target": "self",
  "hells": [
   {
    "kind": "draw",
    "amount": 1
   }
  ],
  "common": [],
  "tags": [
   "Compra",
   "A/B"
  ]
 },
 {
  "id": "R10",
  "name": "Equilíbrio Perfeito",
  "sector": "RELAÇÃO",
  "description": "HELLS: Gasta 2 Equilíbrios para causar 3 de dano e receber 2 de Proteção. Sem recurso, escolhe causar 1 de dano ou receber 1 de Proteção.\nCÓMUM: Gasta 2 Equilíbrios para repetir um teste social. Sem recurso, concede +1 a um teste.",
  "art": "/art/order/cards/R10.webp",
  "dice": [
   2,
   5,
   6
  ],
  "cost": 0,
  "range": 2,
  "target": "enemy",
  "hells": [
   {
    "kind": "damage",
    "amount": 1
   }
  ],
  "common": [],
  "tags": [
   "Ataque",
   "Equilíbrio"
  ]
 },
 {
  "id": "S01",
  "name": "Escuta Atenta",
  "sector": "SOCIALISTA",
  "description": "HELLS: Concede 2 de Proteção a si mesmo ou a um aliado. Ganha 1 Laço se impedir dano.\nCÓMUM: Faz uma pergunta empática e recupera 1 de Moral se obtiver um testemunho relevante.",
  "art": "/art/order/cards/S01.webp",
  "dice": [
   1,
   2,
   3,
   5,
   6
  ],
  "cost": 0,
  "range": 2,
  "target": "ally",
  "hells": [
   {
    "kind": "shield",
    "amount": 2
   }
  ],
  "common": [
   {
    "kind": "moral",
    "amount": 1
   }
  ],
  "tags": [
   "Proteção",
   "Laços"
  ]
 },
 {
  "id": "S02",
  "name": "Rede de Apoio",
  "sector": "SOCIALISTA",
  "description": "HELLS: Recupera 2 de Vida. Quando utilizada em outro personagem, recupera 3.\nCÓMUM: Reduz 1 de Suspeita e recupera 1 de Moral durante uma conversa cooperativa.",
  "art": "/art/order/cards/S02.webp",
  "dice": [
   1,
   2,
   4,
   6
  ],
  "cost": 0,
  "range": 2,
  "target": "ally",
  "hells": [
   {
    "kind": "heal",
    "amount": 3
   }
  ],
  "common": [
   {
    "kind": "moral",
    "amount": 1
   }
  ],
  "tags": [
   "Cura"
  ]
 },
 {
  "id": "S03",
  "name": "Dividir o Peso",
  "sector": "SOCIALISTA",
  "description": "HELLS: Divide com um aliado o próximo dano recebido por ele e reduz o dano total em 2. Sozinho, reduz seu próximo dano em 2.\nCÓMUM: Gasta 1 de Moral para impedir uma perda imediata de 1 de Confiança causada por uma falha de comunicação.",
  "art": "/art/order/cards/S03.webp",
  "dice": [
   1,
   3,
   4,
   6
  ],
  "cost": 0,
  "range": 2,
  "target": "ally",
  "hells": [
   {
    "kind": "shield",
    "amount": 2
   }
  ],
  "common": [],
  "tags": [
   "Proteção"
  ]
 },
 {
  "id": "S04",
  "name": "Vínculo",
  "sector": "SOCIALISTA",
  "description": "HELLS: Um aliado recebe 2 de Proteção e +1 no próximo ataque. Sozinho, recebe 1 de Proteção e +1 no próximo ataque.\nCÓMUM: Concede +2 em Comunicação ao ajudar alguém durante um diálogo.",
  "art": "/art/order/cards/S04.webp",
  "dice": [
   1,
   2,
   3,
   6
  ],
  "cost": 0,
  "range": 2,
  "target": "ally",
  "hells": [
   {
    "kind": "shield",
    "amount": 2
   }
  ],
  "common": [],
  "tags": [
   "Proteção"
  ]
 },
 {
  "id": "S05",
  "name": "Círculo Seguro",
  "sector": "SOCIALISTA",
  "description": "HELLS: Todos os aliados adjacentes, incluindo o usuário, recebem 2 de Proteção.\nCÓMUM: Cria uma oportunidade de conversar com uma pessoa assustada sem pressioná-la.",
  "art": "/art/order/cards/S05.webp",
  "dice": [
   1,
   3,
   5,
   6
  ],
  "cost": 0,
  "range": 0,
  "target": "self",
  "hells": [
   {
    "kind": "shield",
    "amount": 2
   }
  ],
  "common": [],
  "tags": [
   "Proteção",
   "Área"
  ]
 },
 {
  "id": "S06",
  "name": "Trégua",
  "sector": "SOCIALISTA",
  "description": "HELLS: Impede o próximo ataque de um inimigo comum. Contra chefes, reduz em 2 o dano anunciado.\nCÓMUM: Reduz 2 de Suspeita. O personagem não pode realizar ataque físico na mesma ação.",
  "art": "/art/order/cards/S06.webp",
  "dice": [
   1,
   2,
   4,
   5
  ],
  "cost": 0,
  "range": 5,
  "target": "enemy",
  "hells": [],
  "common": [],
  "tags": [
   "Trégua"
  ]
 },
 {
  "id": "S07",
  "name": "Reerguer",
  "sector": "SOCIALISTA",
  "description": "HELLS: Gasta 1 Laço para recuperar 3 de Vida e remover um efeito negativo simples.\nCÓMUM: Gasta 1 Laço para recuperar 2 de Moral de um personagem.",
  "art": "/art/order/cards/S07.webp",
  "dice": [
   1,
   3,
   4,
   6
  ],
  "cost": 0,
  "range": 2,
  "target": "ally",
  "hells": [
   {
    "kind": "heal",
    "amount": 3
   }
  ],
  "common": [
   {
    "kind": "moral",
    "amount": 2
   }
  ],
  "tags": [
   "Cura",
   "Gasta Laço"
  ]
 },
 {
  "id": "S08",
  "name": "Palavra de Amparo",
  "sector": "SOCIALISTA",
  "description": "HELLS: Recebe 2 de Proteção e remove 1 de dano recente à Sanidade, se houver.\nCÓMUM: Recupera 2 de Moral e interrompe um estado narrativo de pânico imediato.",
  "art": "/art/order/cards/S08.webp",
  "dice": [
   1,
   2,
   5,
   6
  ],
  "cost": 0,
  "range": 2,
  "target": "ally",
  "hells": [
   {
    "kind": "shield",
    "amount": 2
   },
   {
    "kind": "sanity",
    "amount": 1
   }
  ],
  "common": [
   {
    "kind": "moral",
    "amount": 2
   }
  ],
  "tags": [
   "Proteção"
  ]
 },
 {
  "id": "S09",
  "name": "Pacto de Proteção",
  "sector": "SOCIALISTA",
  "description": "HELLS: Gasta 2 Laços para conceder 5 de Proteção a um aliado. Sozinho, recebe 4.\nCÓMUM: Gasta 2 Laços para repetir um teste social e impedir perda de Confiança causada por esse teste.",
  "art": "/art/order/cards/S09.webp",
  "dice": [
   2,
   4,
   6
  ],
  "cost": 0,
  "range": 2,
  "target": "ally",
  "hells": [
   {
    "kind": "shield",
    "amount": 5
   }
  ],
  "common": [],
  "tags": [
   "Proteção",
   "Gasta Laços"
  ]
 },
 {
  "id": "S10",
  "name": "Todos Voltam",
  "sector": "SOCIALISTA",
  "description": "HELLS: Se estiver com metade ou menos da Vida, recupera 3 de Vida e recebe 2 de Proteção.\nCÓMUM: Após proteger efetivamente uma pessoa vulnerável, pode recuperar 1 de Confiança, uma vez por sessão.",
  "art": "/art/order/cards/S10.webp",
  "dice": [
   1,
   5,
   6
  ],
  "cost": 0,
  "range": 0,
  "target": "self",
  "hells": [
   {
    "kind": "heal",
    "amount": 3
   },
   {
    "kind": "shield",
    "amount": 2
   }
  ],
  "common": [],
  "tags": [
   "Cura",
   "Condicional"
  ]
 },
 {
  "id": "D01",
  "name": "Corte Único",
  "sector": "DOUTRINA",
  "description": "HELLS: Causa 4 de dano a um alvo isolado em alcance 1.\nCÓMUM: Causa 2 de dano e, se estava oculto, obtém prova material acessível.",
  "art": "",
  "dice": [
   1,
   3,
   5,
   6
  ],
  "cost": 0,
  "range": 1,
  "target": "enemy",
  "hells": [
   {
    "kind": "damage",
    "amount": 4
   }
  ],
  "common": [
   {
    "kind": "damage",
    "amount": 2
   }
  ],
  "tags": [
   "Ataque",
   "Isolado"
  ]
 },
 {
  "id": "D02",
  "name": "Passagem Cega",
  "sector": "DOUTRINA",
  "description": "HELLS: Mova até 4 casas ignorando controle de passagem.\nCÓMUM: Atravesse área vigiada com +2 em Furtividade.",
  "art": "",
  "dice": [
   1,
   2,
   4,
   6
  ],
  "cost": 0,
  "range": 0,
  "target": "self",
  "hells": [
   {
    "kind": "move",
    "amount": 4
   }
  ],
  "common": [],
  "tags": [
   "Movimento"
  ]
 },
 {
  "id": "D03",
  "name": "Punhal do Segredo",
  "sector": "DOUTRINA",
  "description": "HELLS: Cause 3 de dano; +2 se o alvo não o percebeu (você está Oculto).\nCÓMUM: Custa 1 Moral; cause 2 Incisão por Enganação, sem revelar a fonte.",
  "art": "",
  "dice": [
   1,
   3,
   4,
   6
  ],
  "cost": 0,
  "range": 1,
  "target": "enemy",
  "hells": [
   {
    "kind": "damage",
    "amount": 3
   }
  ],
  "common": [],
  "tags": [
   "Ataque"
  ]
 },
 {
  "id": "D04",
  "name": "Vulto de Serviço",
  "sector": "DOUTRINA",
  "description": "HELLS: Fique Oculto até atacar ou ser visto de perto.\nCÓMUM: Infiltração: adversário recebe −2 Percepção para notá-lo.",
  "art": "",
  "dice": [
   2,
   3,
   5,
   6
  ],
  "cost": 0,
  "range": 0,
  "target": "self",
  "hells": [],
  "common": [],
  "tags": [
   "Oculto"
  ]
 },
 {
  "id": "D05",
  "name": "Assinatura Falsa",
  "sector": "DOUTRINA",
  "description": "HELLS: Cause 2 de dano e faça o alvo errar o foco: −2 no próximo ataque dele.\nCÓMUM: Custa 1 Moral; falsifique 1 documento menor; Percepção adversária DT 16 revela.",
  "art": "",
  "dice": [
   1,
   2,
   5,
   6
  ],
  "cost": 0,
  "range": 2,
  "target": "enemy",
  "hells": [
   {
    "kind": "damage",
    "amount": 2
   }
  ],
  "common": [],
  "tags": [
   "Ataque"
  ]
 },
 {
  "id": "D06",
  "name": "Execução Precisa",
  "sector": "DOUTRINA",
  "description": "HELLS: Cause 3 de dano e marque Sangramento por 2 turnos.\nCÓMUM: Cause 3 de dano físico a um único alvo; testemunhas geram suspeita.",
  "art": "",
  "dice": [
   1,
   2,
   3,
   5
  ],
  "cost": 0,
  "range": 1,
  "target": "enemy",
  "hells": [
   {
    "kind": "damage",
    "amount": 3
   }
  ],
  "common": [
   {
    "kind": "damage",
    "amount": 3
   }
  ],
  "tags": [
   "Ataque",
   "Sangramento"
  ]
 },
 {
  "id": "D07",
  "name": "Fora do Registro",
  "sector": "DOUTRINA",
  "description": "HELLS: Mova 3 casas sem provocar reação e ganhe +1 no próximo D20 de ataque.\nCÓMUM: Apague vestígio menor; +2 em Enganação ao justificar sua ausência.",
  "art": "",
  "dice": [
   1,
   3,
   4,
   5
  ],
  "cost": 0,
  "range": 0,
  "target": "self",
  "hells": [
   {
    "kind": "move",
    "amount": 3
   }
  ],
  "common": [],
  "tags": [
   "Movimento"
  ]
 },
 {
  "id": "D08",
  "name": "Assassino de Sombras",
  "sector": "DOUTRINA",
  "description": "HELLS: Cause 5 de dano em alvo isolado; se falhar no D20, sofra 1 de dano.\nCÓMUM: Cause 2 Incisão por Furtividade após revelar segredo obtido sem autorização.",
  "art": "",
  "dice": [
   1,
   2,
   4,
   5
  ],
  "cost": 0,
  "range": 1,
  "target": "enemy",
  "hells": [
   {
    "kind": "damage",
    "amount": 5
   }
  ],
  "common": [],
  "tags": [
   "Ataque",
   "Isolado"
  ]
 }
];
export const STARTER: Record<Sector,{sector:string[];universal:string[]}> = {"INCIDÊNCIA":{"sector":["I04","I09","I07","I01","I05","I10"],"universal":["U01","U02","U06","U04"]},"JUSTIÇA":{"sector":["J01","J03","J05","J09","J10","J02"],"universal":["U01","U10","U06","U02"]},"RELAÇÃO":{"sector":["R01","R04","R03","R08","R07","R10"],"universal":["U01","U10","U06","U02"]},"SOCIALISTA":{"sector":["S01","S02","S04","S05","S07","S10"],"universal":["U01","U10","U06","U05"]},"DOUTRINA":{"sector":["D01","D03","D04","D06","D07","D08"],"universal":["U01","U02","U06","U04"]}};
