(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.mind-mgmt.v1";
  const SETUP_KEY = "field-manual.mind-mgmt.setup.v1";
  const MANUALS = {
    core: "mind-mgmt_core.pdf",
    shift: "mind-mgmt_shift.pdf",
    extra: "mind-mgmt_extra.pdf"
  };
  const ICONS = "assets/mind-mgmt/icons/";
  const EXTRA_IDS = [
    "rules-lawyer", "big-jim", "on-temples", "ignore-ask", "corners",
    "mental-fog", "futurist", "omnipotent", "evades", "psychic-snare"
  ];
  const PHASE_IDS = [
    "shared", "recruiter", "opening-path", "immortals", "rogue-agents",
    "agent-roster", "extras", "start"
  ];
  const DEFAULTS = {
    language: "pt-BR",
    mode: "training",
    players: 2,
    startVisibility: "public",
    readingSide: "recruiter",
    openedRecruiter: 0,
    openedAgents: 0,
    previousWinner: "none",
    winStreak: 1,
    shiftModules: {},
    revealExtras: false,
    extras: {}
  };
  const storageIssues = new Set();
  let state;
  let setupState;
  let root = null;

  const SHIFT_MODULES = [
    {
      id: "agents-1", side: "agents", package: 1, name: "Psychic Tripwires",
      visibleTo: ["recruiter"],
      icon: "shift-agents-1.webp", summaryPage: 1, detailPage: 12,
      components: {
        en: ["2 cards: Set Psychic Tripwire and Trigger Psychic Tripwire", "7 Tripwire tokens and 4 Tripwire Alert tokens"],
        pt: ["2 cartas: Set Psychic Tripwire e Trigger Psychic Tripwire", "7 fichas Tripwire e 4 fichas Tripwire Alert"]
      },
      componentsBySide: {
        recruiter: {
          en: ["Rogue Agents place the Tripwire path and Alert tokens; Recruiter reports the crossing count at the next Alert"],
          pt: ["Rogue Agents colocam o caminho Tripwire e as fichas Alert; Recruiter informa a quantidade de cruzamentos no próximo Alerta"]
        }
      },
      componentRecipientsBySide: {
        agents: { en: "Rogue Agents", pt: "Rogue Agents" },
        recruiter: { en: "Rogue Agents; Recruiter reports at Alerts", pt: "Rogue Agents; Recruiter informa nos Alertas" }
      },
      details: {
        en: [
          "Once during an Agent move, lay a connected path of up to 7 Tripwire tokens. It may be straight or turn, but both ends must touch the outside edge; fewer than 7 tokens are allowed.",
          "Count every Recruiter crossing of the path by STEP or MIND SLIP since the previous Alert. At the next Alert, Rogue Agents place one Tripwire Alert token per crossing and the Recruiter reports the count. Alert markers are unlimited—use substitutes if needed."
        ],
        pt: [
          "Uma vez durante o movimento de um Agente, monte um caminho conectado com até 7 fichas Tripwire. Pode ser reto ou ter curvas, mas as duas pontas devem tocar a borda externa; pode usar menos de 7 fichas.",
          "Conte cada cruzamento do caminho pelo Recruiter com STEP ou MIND SLIP desde o Alerta anterior. No próximo Alerta, Rogue Agents colocam uma ficha Tripwire Alert por cruzamento e o Recruiter informa a quantidade. As fichas de alerta são ilimitadas—use substitutos se necessário."
        ]
      },
      setup: {
        en: ["Keep the tripwire and Alert tokens beside the Rogue Agents; the path is placed during an Agent move."],
        pt: ["Deixe as fichas Tripwire e Alert ao alcance dos Rogue Agents; o caminho é colocado durante o movimento de um Agente."]
      }
    },
    {
      id: "agents-2", side: "agents", package: 2, name: "Mind Web",
      visibleTo: ["recruiter"],
      icon: "shift-agents-2.webp", summaryPage: 1, detailPage: 13,
      components: {
        en: ["2 cards: Mind Web and New Recruit", "1 Mind Web token and 1 Recruit token"],
        pt: ["2 cartas: Mind Web e New Recruit", "1 ficha Mind Web e 1 ficha Recruit"]
      },
      componentsBySide: {
        recruiter: {
          en: ["Agents place the Mind Web token; Recruiter places Steps on visited adjacent locations and uses a 13-Recruit target"],
          pt: ["Agentes colocam a ficha Mind Web; Recruiter coloca Steps nas localizações adjacentes visitadas e usa a meta de 13 Recruits"]
        }
      },
      componentRecipientsBySide: {
        agents: { en: "Rogue Agents and Recruiter", pt: "Rogue Agents e Recruiter" },
        recruiter: { en: "Rogue Agents and Recruiter", pt: "Rogue Agents e Recruiter" }
      },
      details: {
        en: [
          "After a Reveal, place the Mind Web token on a corner of the Agent's location. The Recruiter places Step tokens on adjacent locations they have visited; if none qualify, place none.",
          "The Recruiter needs 13 Recruits instead of 12 to win by recruiting; the time victory remains at 16:00."
        ],
        pt: [
          "Depois de um Reveal, coloque a ficha Mind Web em um canto da localização do Agente. O Recruiter põe fichas Step nas localizações adjacentes que visitou; se nenhuma se qualificar, não põe fichas.",
          "O Recruiter precisa de 13 Recruits, em vez de 12, para vencer por recrutamento; a vitória por tempo continua em 16:00."
        ]
      },
      setup: {
        en: ["Keep the Mind Web and additional Recruit tokens beside the board; use the 13-Recruit target for this match."],
        pt: ["Deixe as fichas Mind Web e Recruit extra ao lado do tabuleiro; use a meta de 13 Recruits nesta partida."]
      }
    },
    {
      id: "agents-3", side: "agents", package: 3, name: "Mind Map",
      visibleTo: ["recruiter"],
      icon: "shift-agents-3.webp", summaryPage: 1, detailPage: 16,
      components: {
        en: ["1 Mind Map card, 1 Mind Map Locator token, and 1 09:00 token"],
        pt: ["1 carta Mind Map, 1 ficha localizadora Mind Map e 1 ficha 09:00"]
      },
      componentsBySide: {
        recruiter: {
          en: ["1 Mind Map Locator token and 1 09:00 token; Recruiter places the locator when Time reaches 09:00"],
          pt: ["1 ficha localizadora Mind Map e 1 ficha 09:00; Recruiter coloca o localizador quando o Tempo chegar a 09:00"]
        }
      },
      componentRecipientsBySide: {
        agents: { en: "Rogue Agents and Recruiter", pt: "Rogue Agents e Recruiter" },
        recruiter: { en: "Recruiter", pt: "Recruiter" }
      },
      details: {
        en: [
          "When Time reaches 09:00, the Recruiter places the locator on the intersection of four locations. One must be the starting location, but the Recruiter does not identify which."
        ],
        pt: [
          "Quando o Tempo chegar a 09:00, o Recruiter coloca o localizador na interseção de quatro localizações. Uma deve ser a localização inicial, mas o Recruiter não diz qual."
        ]
      },
      setup: {
        en: ["Keep the Mind Map Locator and 09:00 tokens ready; use them when Time reaches 09:00."],
        pt: ["Deixe as fichas localizadora Mind Map e 09:00 prontas; use-as quando o Tempo chegar a 09:00."]
      },
      setupBySide: {
        recruiter: {
          en: ["Keep the Mind Map Locator and 09:00 tokens ready; place them when Time reaches 09:00."],
          pt: ["Deixe as fichas localizadora Mind Map e 09:00 prontas; coloque-as quando o Tempo chegar a 09:00."]
        }
      }
    },
    {
      id: "agents-4", side: "agents", package: 4, name: "Original Immortal & Lucky Umbrella",
      visibleTo: ["recruiter"],
      icon: "shift-agents-4-immortal.webp", extraIcon: "shift-agents-4-umbrella.webp",
      summaryPage: 1, detailPage: 18,
      interpretationBySide: {
        recruiter: {
          en: "Extra p. 18 does not identify which face-up Feature card to use. This guide interprets it as one of the two Immortal Recruiting cards already face-up; choose either one.",
          pt: "A p. 18 do Extra não identifica qual carta Feature aberta usar. Este guia interpreta como uma das duas cartas Immortal Recruiting já visíveis; escolha uma delas."
        },
        agents: {
          en: "Extra p. 18 does not identify which face-up Feature card to use. This guide interprets it as one of the two Immortal Recruiting cards already face-up; the Recruiter chooses one.",
          pt: "A p. 18 do Extra não identifica qual carta Feature aberta usar. Este guia interpreta como uma das duas cartas Immortal Recruiting já visíveis; o Recruiter escolhe uma."
        }
      },
      components: {
        en: ["3 cards: Move Original Immortal, Lucky Umbrella, and Wind Ventriloquism", "1 Original Immortal figure and 2 Lucky Umbrella tokens"],
        pt: ["3 cartas: Move Original Immortal, Lucky Umbrella e Wind Ventriloquism", "1 figura Original Immortal e 2 fichas Lucky Umbrella"]
      },
      componentsBySide: {
        recruiter: {
          en: ["Recruiter places 1 Original Immortal figure and 2 Lucky Umbrella tokens; Rogue Agents use the 3 module cards"],
          pt: ["Recruiter coloca 1 figura Original Immortal e 2 fichas Lucky Umbrella; Rogue Agents usam as 3 cartas do módulo"]
        },
        agents: {
          en: ["Rogue Agents use the 3 module cards; Recruiter places 1 Original Immortal figure and 2 Lucky Umbrella tokens"],
          pt: ["Rogue Agents usam as 3 cartas do módulo; Recruiter coloca 1 figura Original Immortal e 2 fichas Lucky Umbrella"]
        }
      },
      componentRecipientsBySide: {
        agents: { en: "Rogue Agents and Recruiter", pt: "Rogue Agents e Recruiter" },
        recruiter: { en: "Rogue Agents and Recruiter", pt: "Rogue Agents e Recruiter" }
      },
      details: {
        en: [
          "At setup, choose one of the two face-up Immortal Recruiting cards. Place the Original Immortal and both Umbrellas on 3 different locations that each show a Feature matching the chosen card.",
          "Agents may use movement to move the Original Immortal: up to 2 spaces if that Agent did not move, or 1 space if it moved 1 space.",
          "After it collects both Umbrellas, remove the Original Immortal. Once per game, Lucky Umbrella lets Rogue Agents attempt Capture from the Agent's location or any of its 4 orthogonally adjacent locations (5 total).",
          "Wind Ventriloquism can pull the Original Immortal 1 space closer to an Immortal in the same row or column, but not through Mayhem.",
        ],
        pt: [
          "Na preparação, escolha uma das duas cartas Immortal Recruiting visíveis. Coloque Original Immortal e os dois Umbrellas em 3 localizações diferentes, cada uma com Feature correspondente à carta escolhida.",
          "Agentes podem usar movimento para mover o Original Immortal: até 2 espaços se o Agente não se moveu, ou 1 espaço se moveu 1 espaço.",
          "Depois que ele coletar os dois Umbrellas, retire o Original Immortal. Uma vez por partida, Lucky Umbrella permite tentar Capture na localização do Agente ou em qualquer uma das 4 adjacentes ortogonalmente (5 no total).",
          "Wind Ventriloquism pode puxar Original Immortal 1 espaço em direção a um Immortal na mesma linha ou coluna, mas não através de Mayhem.",
        ]
      },
      setup: {
        en: ["After the two Immortal Recruiting cards are face-up, choose one of them as the matching Feature (guide interpretation). The Recruiter places the Original Immortal and both Umbrellas on 3 different locations showing that Feature."],
        pt: ["Depois que as duas cartas Immortal Recruiting estiverem visíveis, escolha uma delas como Feature correspondente (interpretação do guia). O Recruiter coloca Original Immortal e os dois Umbrellas em 3 localizações diferentes que mostrem essa Feature."]
      },
      setupBySide: {
        recruiter: {
          en: ["After the two Immortal Recruiting cards are face-up, choose one of them as the matching Feature (guide interpretation). Place the Original Immortal and both Umbrellas on 3 different locations showing that Feature."],
          pt: ["Depois que as duas cartas Immortal Recruiting estiverem visíveis, escolha uma delas como Feature correspondente (interpretação do guia). Coloque Original Immortal e os dois Umbrellas em 3 localizações diferentes que mostrem essa Feature."]
        }
      }
    },
    {
      id: "agents-5", side: "agents", package: 5, name: "Psi-scan",
      visibleTo: ["recruiter"],
      icon: "shift-agents-5.webp", summaryPage: 1, detailPage: 20,
      components: {
        en: ["1 Psi-scan card and 4 numbered Psi-scan tokens"],
        pt: ["1 carta Psi-scan e 4 fichas numeradas Psi-scan"]
      },
      componentsBySide: {
        recruiter: {
          en: ["4 numbered Psi-scan tokens are placed on the face-down Recruiter cards; reveal a matching Potential card after Shakedown"],
          pt: ["4 fichas Psi-scan numeradas são colocadas nas cartas Recruiter viradas para baixo; revele uma carta Potential correspondente após Shakedown"]
        }
      },
      componentRecipientsBySide: {
        agents: { en: "Rogue Agents; Recruiter uses the numbered information", pt: "Rogue Agents; Recruiter usa a informação numerada" },
        recruiter: { en: "Rogue Agents and Recruiter", pt: "Rogue Agents e Recruiter" }
      },
      details: {
        en: [
          "After a successful Shakedown, the Recruiter checks whether the number of the Immortal being Shaken Down matches a Psi-scan number on a face-down Recruiter card.",
          "If a number matches, reveal that Potential Recruiter card to help narrow the possible Recruiter."
        ],
        pt: [
          "Depois de um Shakedown bem-sucedido, o Recruiter verifica se o número do Immortal alvo corresponde a um número Psi-scan no verso de uma carta de Recruiter.",
          "Se houver correspondência, revele aquela carta Potential Recruiter para ajudar a restringir as possibilidades."
        ]
      },
      setup: {
        en: ["Use the four numbered tokens with the face-down Recruiter cards as directed by the Psi-scan component."],
        pt: ["Use as quatro fichas numeradas com as cartas de Recruiter viradas para baixo, conforme indicado pelo componente Psi-scan."]
      },
      setupBySide: {
        recruiter: {
          en: ["Place the numbered Psi-scan tokens on the backs of the face-down Recruiter cards as instructed by the component."],
          pt: ["Coloque as fichas Psi-scan numeradas no verso das cartas Recruiter viradas para baixo, conforme indicado pelo componente."]
        }
      }
    },
    {
      id: "agents-6", side: "agents", package: 6, name: "Mental Blast",
      visibleTo: ["recruiter"],
      icon: "shift-agents-6.webp", summaryPage: 1, detailPage: 21,
      components: {
        en: ["2 Mental Blast cards and 4 numbered Mental Blast tokens"],
        pt: ["2 cartas Mental Blast e 4 fichas numeradas Mental Blast"]
      },
      interpretationBySide: {
        agents: {
          en: "SHIFT ref p. 1 allows up to 4 uses. This guide interprets the 4 supplied tokens as 4 total uses per game; once handed to the Recruiter, a token is spent and is not recycled. If no eligible marked location matches its arrow, the Recruiter keeps the token without placing it.",
          pt: "A ref. SHIFT p. 1 permite até 4 usos. Este guia interpreta as 4 fichas fornecidas como 4 usos no total por partida; depois de entregues ao Recruiter, são gastas e não voltam ao jogo. Se nenhuma localização marcada corresponder à seta, o Recruiter fica com a ficha sem colocá-la."
        },
        recruiter: {
          en: "SHIFT ref p. 1 allows up to 4 uses. This guide interprets the 4 supplied tokens as 4 total uses per game; once handed to the Recruiter, a token is spent and is not recycled. If no eligible marked location matches its arrow, keep the token without placing it.",
          pt: "A ref. SHIFT p. 1 permite até 4 usos. Este guia interpreta as 4 fichas fornecidas como 4 usos no total por partida; depois de entregues ao Recruiter, são gastas e não voltam ao jogo. Se nenhuma localização marcada corresponder à seta, fique com a ficha sem colocá-la."
        }
      },
      componentsBySide: {
        recruiter: {
          en: ["4 numbered Mental Blast tokens; Agents give one to Recruiter after each qualifying action"],
          pt: ["4 fichas Mental Blast numeradas; Agentes entregam uma ao Recruiter após cada ação qualificadora"]
        }
      },
      componentRecipientsBySide: {
        agents: { en: "Rogue Agents; tokens are handed to Recruiter", pt: "Rogue Agents; fichas entregues ao Recruiter" },
        recruiter: { en: "Rogue Agents; tokens are handed to Recruiter", pt: "Rogue Agents; fichas entregues ao Recruiter" }
      },
      details: {
        en: [
          "After an Agent takes any action other than Ask, give the Recruiter one numbered token. Each token is unique; orient its blue strip to match the board's Time Track.",
          "The Recruiter checks every visited location with a Step or green Confirmed Mental Note. If they left one in the arrow's direction, place the token on one such location.",
          "The token tells Rogue Agents that the Recruiter moved from that location in the arrow's direction. If Distraction Box is in play, the Recruiter may place any Mental Blast token on it as part of the bluff.",
          "The SHIFT summary allows up to 4 uses. This guide interprets the 4 supplied tokens as 4 total uses per game; a handed-over token is spent and not recycled. If no eligible marked location matches its arrow, keep the token without placing it."
        ],
        pt: [
          "Depois que um Agente fizer qualquer ação diferente de Ask, entregue ao Recruiter uma ficha numerada. Cada ficha é única; oriente a faixa azul para combinar com a Trilha do Tempo do tabuleiro.",
          "O Recruiter verifica todas as localizações visitadas com Step ou Mental Note Confirmed verde. Se saiu de alguma na direção da seta, coloca a ficha em uma dessas localizações.",
          "A ficha informa aos Rogue Agents que o Recruiter saiu daquela localização na direção da seta. Se Distraction Box estiver em jogo, o Recruiter pode colocar qualquer ficha Mental Blast nela como parte do blefe.",
          "O resumo SHIFT permite até 4 usos. Este guia interpreta as 4 fichas fornecidas como 4 usos no total por partida; a ficha entregue é gasta e não volta ao jogo. Se nenhuma localização marcada corresponder à seta, fique com a ficha sem colocá-la."
        ]
      },
      setupBySide: {
        agents: {
          en: ["Keep the four numbered tokens with the Rogue Agents. After each qualifying action, hand one to the Recruiter; the guide interprets the set as four total uses per game, with no recycling."],
          pt: ["Mantenha as quatro fichas numeradas com os Rogue Agents. Depois de cada ação qualificadora, entregue uma ao Recruiter; o guia interpreta o conjunto como quatro usos no total por partida, sem reciclagem."]
        },
        recruiter: {
          en: ["The Rogue Agents keep the four numbered tokens and hand one to the Recruiter after each qualifying action; the guide interprets them as four total uses per game, with no recycling."],
          pt: ["Os Rogue Agents mantêm as quatro fichas numeradas e entregam uma ao Recruiter depois de cada ação qualificadora; o guia interpreta o conjunto como quatro usos no total por partida, sem reciclagem."]
        }
      }
    },
    {
      id: "agents-7", side: "agents", package: 7, name: "Psychic Net",
      visibleTo: ["recruiter"],
      icon: "shift-agents-7.webp", summaryPage: 1, detailPage: 23,
      components: {
        en: ["1 Psychic Net card and 1 Psychic Net token"],
        pt: ["1 carta Psychic Net e 1 ficha Psychic Net"]
      },
      componentsBySide: {
        recruiter: {
          en: ["Rogue Agents place 1 Psychic Net token; it blocks recruiting in 5 locations until an Immortal enters its location"],
          pt: ["Rogue Agents colocam 1 ficha Psychic Net; ela bloqueia recrutamento em 5 localizações até um Immortal entrar na localização da ficha"]
        }
      },
      componentRecipientsBySide: {
        agents: { en: "Rogue Agents", pt: "Rogue Agents" },
        recruiter: { en: "Rogue Agents", pt: "Rogue Agents" }
      },
      details: {
        en: [
          "The Psychic Net is shared and any Agent may use it. During an Agent move, place it on a location. That location and its four orthogonally adjacent locations cannot be used to recruit.",
          "When an Immortal moves onto the Net's location, remove the Net and the Recruiter can recruit in those locations again."
        ],
        pt: [
          "Psychic Net é compartilhada e qualquer Agente pode usá-la. Durante o movimento de um Agente, coloque-a em uma localização. Essa localização e as quatro adjacentes ortogonalmente não podem ser usadas para recrutar.",
          "Quando um Immortal entrar na localização da Net, retire-a; o Recruiter poderá recrutar nessas localizações novamente."
        ]
      },
      setup: {
        en: ["Keep the Psychic Net token with the Rogue Agents; it is placed during an Agent move."],
        pt: ["Deixe a ficha Psychic Net com os Rogue Agents; ela é colocada durante o movimento de um Agente."]
      }
    },
    {
      id: "recruiter-1", side: "recruiter", package: 1, name: "Distraction Box",
      icon: "shift-recruiter-1.webp", summaryPage: 2, detailPage: 2,
      components: {
        en: ["1 Distraction Box card and 1 double-sided STEP token"],
        pt: ["1 carta Distraction Box e 1 ficha STEP dupla face"]
      },
      details: {
        en: [
          "When answering an Ask, the Recruiter may place the special STEP token face-down on a matching location they have already visited. The Extra p. 2 instruction takes precedence over the conflicting SHIFT summary. When the Agents Reveal it, no Confirmed Mental Note is placed; they must Ask again for a real Step token."
        ],
        pt: [
          "Ao responder a Ask, o Recruiter pode colocar a ficha STEP especial, virada para baixo, em uma localização correspondente que já tenha visitado. A instrução da p. 2 do Extra prevalece sobre o resumo SHIFT conflitante. Quando os Agentes fizerem Reveal, não coloque uma Mental Note Confirmed; eles precisam perguntar novamente para obter uma ficha Step verdadeira."
        ]
      },
      setup: {
        en: ["Keep the Distraction Box token face-down so the Agents cannot distinguish it from a normal STEP token."],
        pt: ["Mantenha a ficha Distraction Box virada para baixo para que os Agentes não a distingam de uma ficha STEP normal."]
      }
    },
    {
      id: "recruiter-2", side: "recruiter", package: 2, name: "Dreamwalker",
      nameBySide: { recruiter: "Dreamwalker", agents: "Search for Dreamwalker" },
      visibleTo: ["agents"],
      icon: "shift-recruiter-2.webp", summaryPage: 2, detailPage: 5,
      detailPageBySide: { recruiter: null, agents: 5 },
      components: {
        en: ["2 Dreamwalker cards and 4 Search tokens"],
        pt: ["2 cartas Dreamwalker e 4 fichas Search"]
      },
      componentsBySide: {
        recruiter: {
          en: ["1 Wake Up Dreamwalker card; mark the captive's location only on the Secret Map"],
          pt: ["1 carta Wake Up Dreamwalker; marque a localização da pessoa cativa somente no Secret Map"]
        },
        agents: {
          en: ["1 Search for Dreamwalker card and 4 Search tokens"],
          pt: ["1 carta Search for Dreamwalker e 4 fichas Search"]
        }
      },
      componentRecipientsBySide: {
        recruiter: { en: "Recruiter", pt: "Recruiter" },
        agents: { en: "Rogue Agents", pt: "Rogue Agents" }
      },
      details: {
        en: [
          "The Recruiter secretly marks the Dreamwalker's location with D on the Secret Map.",
          "Rogue Agents cannot use Reveal until they locate the Dreamwalker. After an Ask, place a Search token on a corner of the Agent's location; the Recruiter rotates it to indicate a box of locations that contains the Dreamwalker."
        ],
        pt: [
          "O Recruiter marca secretamente a localização de Dreamwalker com D no Secret Map.",
          "Os Rogue Agents não podem usar Reveal até localizar Dreamwalker. Depois de Ask, coloque uma ficha Search em um canto da localização do Agente; o Recruiter gira a ficha para indicar um quadrado de localizações que contém Dreamwalker."
        ]
      },
      detailsBySide: {
        recruiter: {
          en: [
            "Secretly write D at the Dreamwalker's location on the Secret Map.",
            "The Agents' search procedure is not shown in this Recruiter view; use the Wake Up Dreamwalker card and keep D hidden."
          ],
          pt: [
            "Escreva D em segredo na localização de Dreamwalker no Secret Map.",
            "O procedimento de busca dos Agentes não aparece nesta leitura do Recruiter; use Wake Up Dreamwalker e mantenha D escondido."
          ]
        },
        agents: {
          en: [
            "Until the Dreamwalker is found, Reveal is unavailable.",
            "After every Ask, place a Search token on one of the four corners of the asking Agent's location. The Recruiter rotates it to define a box containing D; keep searching until the location is identified."
          ],
          pt: [
            "Até que Dreamwalker seja encontrado, Reveal não pode ser usado.",
            "Depois de cada Ask, coloque uma ficha Search em um dos quatro cantos da localização do Agente que perguntou. O Recruiter a gira para definir um quadrado que contenha D; continue procurando até identificar a localização."
          ]
        }
      },
      setup: {
        en: ["The Recruiter marks the Dreamwalker location on the Secret Map; keep the four Search tokens with the Rogue Agents."],
        pt: ["O Recruiter marca a localização de Dreamwalker no Secret Map; deixe as quatro fichas Search com os Rogue Agents."]
      },
      setupBySide: {
        recruiter: {
          en: ["Secretly mark D on the Secret Map; do not reveal its location."],
          pt: ["Marque D em segredo no Secret Map; não revele a localização."]
        },
        agents: {
          en: ["Keep all 4 Search tokens with the Rogue Agents for use after Ask actions."],
          pt: ["Deixe as 4 fichas Search com os Rogue Agents para usá-las depois de ações Ask."]
        }
      }
    },
    {
      id: "recruiter-3", side: "recruiter", package: 3, name: "Mayhem",
      visibleTo: ["agents"],
      icon: "shift-recruiter-3.webp", summaryPage: 2, detailPage: 6,
      components: {
        en: ["1 Mayhem card, 1 additional blue Mayhem token, and 1 additional Mind Slip token"],
        pt: ["1 carta Mayhem, 1 ficha Mayhem azul extra e 1 ficha Mind Slip extra"]
      },
      componentsBySide: {
        recruiter: {
          en: ["1 Mayhem card and 1 blue Mayhem token for the Recruiter"],
          pt: ["1 carta Mayhem e 1 ficha Mayhem azul para o Recruiter"]
        },
        agents: {
          en: ["1 additional Mind Slip token; Rogue Agents place 2 recoverable Mind Slip tokens at setup"],
          pt: ["1 ficha Mind Slip adicional; Rogue Agents colocam 2 fichas Mind Slip recuperáveis na preparação"]
        }
      },
      componentRecipientsBySide: {
        recruiter: { en: "Recruiter", pt: "Recruiter" },
        agents: { en: "Rogue Agents", pt: "Rogue Agents" }
      },
      details: {
        en: [
          "The Recruiter may place the blue Mayhem token as a free action. It may touch other Mayhem tokens but must not divide the board into two sections.",
          "The Rogue Agents place two Mind Slip tokens during setup, each beside a different Temple; the Recruiter must visit a token's location before retrieving it."
        ],
        pt: [
          "O Recruiter pode colocar a ficha Mayhem azul como ação gratuita. Ela pode tocar outras fichas Mayhem, mas não pode dividir o tabuleiro em duas partes.",
          "Os Rogue Agents colocam duas fichas Mind Slip durante a preparação, cada uma junto a um Temple diferente; o Recruiter precisa visitar a localização de uma ficha para recuperá-la."
        ]
      },
      detailsBySide: {
        recruiter: {
          en: ["Place the blue Mayhem token as a free action and draw its location on the Secret Map. It may touch other Mayhem but must not divide the board into two sections."],
          pt: ["Coloque a ficha Mayhem azul como ação gratuita e desenhe sua localização no Secret Map. Ela pode tocar outras Mayhem, mas não pode dividir o tabuleiro em duas partes."]
        },
        agents: {
          en: ["Place 2 Mind Slip tokens beside different Temples during setup. The Recruiter must visit a token's location to retrieve it; each may be recovered at a different time."],
          pt: ["Coloque 2 fichas Mind Slip junto a Temples diferentes durante a preparação. O Recruiter precisa visitar a localização para recuperar cada ficha; elas podem ser recuperadas em momentos diferentes."]
        }
      },
      setup: {
        en: ["Add the blue Mayhem token to the Recruiter's supply. Place two recoverable Mind Slip tokens beside two different Temples."],
        pt: ["Acrescente a ficha Mayhem azul ao suprimento do Recruiter. Coloque duas fichas Mind Slip recuperáveis junto a Temples diferentes."]
      },
      setupBySide: {
        recruiter: {
          en: ["Keep the blue Mayhem token in the Recruiter's supply; draw its location on the Secret Map when placed."],
          pt: ["Deixe a ficha Mayhem azul no suprimento do Recruiter; desenhe sua localização no Secret Map quando for colocada."]
        },
        agents: {
          en: ["Place 2 Mind Slip tokens at different Temples; the Recruiter must visit each token's location before retrieving it."],
          pt: ["Coloque 2 fichas Mind Slip em Temples diferentes; o Recruiter precisa visitar cada localização antes de recuperar a ficha."]
        }
      }
    },
    {
      id: "recruiter-4", side: "recruiter", package: 4, name: "Mind Wipe",
      icon: "shift-recruiter-4.webp", summaryPage: 2, detailPage: 7,
      components: {
        en: ["3 cards: Mind Wipe, Mind Wipe Activated, and Insurance Agent", "1 double-sided Mind Wipe STEP token and 1 Insurance Agent token"],
        pt: ["3 cartas: Mind Wipe, Mind Wipe Activated e Insurance Agent", "1 ficha STEP dupla face Mind Wipe e 1 ficha Insurance Agent"]
      },
      details: {
        en: [
          "The Mind Wipe token must be placed on a location the Recruiter has already visited. When an Agent Reveals it, that Agent cannot use Reveal, Capture, or Shakedown until the Rogue Agents successfully perform a Shakedown.",
          "The token has no effect if flipped or discarded by an effect other than Reveal. It cannot be in play at the same time as Distraction Box; after one is discarded, the other may be used.",
          "A successful Shakedown that identifies one of the Recruiter's 3 Feature cards returns the affected Agent; if all 3 Features have already been exposed, the Agent cannot be returned.",
          "The Insurance Agent card may Move and Ask each turn; follow its printed card text."
        ],
        pt: [
          "A ficha Mind Wipe deve ser colocada em uma localização que o Recruiter já visitou. Quando um Agente a revela, ele não pode usar Reveal, Capture ou Shakedown até os Rogue Agents fazerem um Shakedown bem-sucedido.",
          "A ficha não tem efeito se for virada ou descartada por um efeito diferente de Reveal. Ela não pode estar em jogo ao mesmo tempo que Distraction Box; depois que uma for descartada, a outra pode ser usada.",
          "Um Shakedown bem-sucedido que identifique uma das 3 cartas Feature do Recruiter recupera o Agente afetado; se as 3 Features já tiverem sido reveladas, não é possível recuperá-lo.",
          "A carta Insurance Agent pode fazer Move e Ask a cada turno; siga o texto impresso nela."
        ]
      },
      setup: {
        en: ["Keep the Mind Wipe token and Insurance Agent pieces ready; place the special STEP token only on a location already visited by the Recruiter."],
        pt: ["Deixe a ficha Mind Wipe e as peças Insurance Agent preparadas; coloque a ficha STEP especial somente em uma localização já visitada pelo Recruiter."]
      }
    },
    {
      id: "recruiter-5", side: "recruiter", package: 5, name: "Right-Hand Man",
      visibleTo: ["agents"],
      icon: "shift-recruiter-5.webp", summaryPage: 2, detailPage: 8,
      components: {
        en: ["2 Right-Hand Man cards and 1 Right-Hand Man figure"],
        pt: ["2 cartas Right-Hand Man e 1 figura Right-Hand Man"]
      },
      details: {
        en: [
          "The Recruiter may move the Right-Hand Man up to 2 spaces instead of moving an Immortal. He can contact Recruits, move through Mayhem, and revisit locations.",
          "He recruits only at the location where he finishes moving, not at an intermediate space. If the Recruiter also visits that same location, it does not contact a second Recruit.",
          "At an Alert, report the combined total from the Recruiter and Right-Hand Man without identifying how many each contacted.",
          "A successful Shakedown on him removes him; the Recruiter then continues with only 3 Immortals. He may count as one of the two Immortals needed for Immortal Recruiting."
        ],
        pt: [
          "O Recruiter pode mover Right-Hand Man até 2 espaços em vez de mover um Immortal. Ele também pode contatar Recruits, atravessar Mayhem e revisitar localizações.",
          "Ele recruta somente na localização onde termina o movimento, não em uma casa intermediária. Se o Recruiter também visitar essa mesma localização, ela não contata um segundo Recruit.",
          "Em um Alerta, informe o total combinado do Recruiter e de Right-Hand Man sem separar quantos cada um contatou.",
          "Um Shakedown bem-sucedido contra ele o remove; o Recruiter continua com apenas 3 Immortals. Ele pode contar como um dos dois Immortals necessários para Immortal Recruiting."
        ]
      },
      detailsBySide: {
        agents: {
          en: [
            "The Right-Hand Man recruits only at the location where he finishes moving; an intermediate location does not count, and the Recruiter cannot also collect a Recruit there.",
            "At an Alert, the Recruiter reports one combined total for the Recruiter and Right-Hand Man. Do not infer how many each contacted.",
            "He may count as one of the two Immortals needed for Immortal Recruiting, walk through Mayhem, and revisit locations. A successful Shakedown removes him."
          ],
          pt: [
            "Right-Hand Man recruta somente na localização onde termina o movimento; uma localização intermediária não conta, e o Recruiter também não pode coletar um Recruit ali.",
            "Em um Alerta, o Recruiter informa um total combinado de Recruiter e Right-Hand Man. Não deduza quantos cada um contatou.",
            "Ele pode contar como um dos dois Immortals de Immortal Recruiting, atravessar Mayhem e revisitar localizações. Shakedown bem-sucedido o remove."
          ]
        }
      },
      componentsBySide: {
        agents: {
          en: ["1 Right-Hand Man figure and 2 public rules cards"],
          pt: ["1 figura Right-Hand Man e 2 cartas de regras públicas"]
        }
      },
      componentRecipientsBySide: {
        recruiter: { en: "Recruiter", pt: "Recruiter" },
        agents: { en: "Recruiter (visible to Rogue Agents)", pt: "Recruiter (visível aos Rogue Agents)" }
      },
      setupBySide: {
        agents: {
          en: ["Keep Right-Hand Man visible on the board; Rogue Agents may attempt Shakedown against him."],
          pt: ["Mantenha Right-Hand Man visível no tabuleiro; Rogue Agents podem tentar Shakedown contra ele."]
        }
      },
      setup: {
        en: ["Place the Right-Hand Man figure as directed by its card; keep him separate from all Immortals."],
        pt: ["Coloque a figura Right-Hand Man conforme indicado na carta; mantenha-a separada dos Immortals."]
      }
    },
    {
      id: "recruiter-6", side: "recruiter", package: 6, name: "Homemaker",
      visibleTo: ["agents"],
      icon: "shift-recruiter-6.webp", summaryPage: 2, detailPage: 9,
      requiresRecruiterPackage: 3,
      components: {
        en: ["1 Homemaker card, 1 Homemaker token, and 1 Chaos token", "Uses the blue Mayhem token stored with Recruiter package 3"],
        pt: ["1 carta Homemaker, 1 ficha Homemaker e 1 ficha Chaos", "Usa a ficha Mayhem azul guardada com o pacote Recruiter 3"]
      },
      details: {
        en: [
          "At setup, place Homemaker on a Temple. It moves 1 space per turn.",
          "When Homemaker enters a location with a Rogue Agent, place Chaos on a corner there, push the Agent away, and block Rogue Agents from entering the 4 locations covered by the Chaos token.",
          "Homemaker cannot share a location with the Right-Hand Man. The blue Mayhem token is placed as a free action and must not divide the board into two sections."
        ],
        pt: [
          "Na preparação, coloque Homemaker em um Temple. Ele se move 1 espaço por turno.",
          "Quando Homemaker entrar em uma localização com um Rogue Agent, coloque Chaos em um canto dali, empurre o Agente e impeça os Rogue Agents de entrar nas 4 localizações cobertas pela ficha Chaos.",
          "Homemaker não pode compartilhar localização com Right-Hand Man. A ficha Mayhem azul é colocada como ação gratuita e não pode dividir o tabuleiro em duas partes."
        ]
      },
      detailsBySide: {
        agents: {
          en: [
            "Homemaker starts on a Temple and moves 1 space each Recruiter turn. It cannot share a location with Right-Hand Man.",
            "When Homemaker enters an Agent location, the Agent is pushed away and the Recruiter places Chaos on a corner. Rogue Agents can never enter the 4 locations covered by Chaos.",
            "The Recruiter may place the blue Mayhem token as a free action; it may touch other Mayhem but must not divide the board into two sections."
          ],
          pt: [
            "Homemaker começa em um Temple e se move 1 espaço a cada turno do Recruiter. Não pode compartilhar localização com Right-Hand Man.",
            "Quando Homemaker entra em uma localização de Agente, o Agente é empurrado e o Recruiter coloca Chaos em um canto. Rogue Agents nunca podem entrar nas 4 localizações cobertas por Chaos.",
            "O Recruiter pode colocar a ficha Mayhem azul como ação gratuita; ela pode tocar outras Mayhem, mas não pode dividir o tabuleiro em duas partes."
          ]
        }
      },
      componentsBySide: {
        agents: {
          en: ["Homemaker and Chaos tokens; the blue Mayhem token is stored with Recruiter package 3"],
          pt: ["Fichas Homemaker e Chaos; a ficha Mayhem azul fica guardada com o pacote Recruiter 3"]
        }
      },
      componentRecipientsBySide: {
        recruiter: { en: "Recruiter", pt: "Recruiter" },
        agents: { en: "Recruiter (visible on the board)", pt: "Recruiter (visível no tabuleiro)" }
      },
      setup: {
        en: ["Place Homemaker on one Temple. Keep the Chaos token and blue Mayhem token ready; do not place Chaos until its effect triggers."],
        pt: ["Coloque Homemaker em um Temple. Deixe as fichas Chaos e Mayhem azul prontas; não coloque Chaos até o efeito ser ativado."]
      },
      setupBySide: {
        agents: {
          en: ["Know that Homemaker begins on a Temple and that Chaos blocks the four locations it covers; do not move into them."],
          pt: ["Saiba que Homemaker começa em um Temple e que Chaos bloqueia as quatro localizações que cobre; não entre nelas."]
        }
      }
    },
    {
      id: "recruiter-7", side: "recruiter", package: 7, name: "Escort Duty",
      nameBySide: { recruiter: "Escort Duty", agents: "Escort Duty" },
      visibleTo: ["agents"],
      iconBySide: { recruiter: "", agents: "shift-recruiter-7.webp" },
      summaryPage: null, detailPage: null,
      summaryPageBySide: { recruiter: 2, agents: 2 },
      detailPageBySide: { recruiter: null, agents: 11 },
      extraPagesBySide: { recruiter: [], agents: [] },
      interpretationBySide: {
        agents: {
          en: "Extra p. 11 does not specify how to distribute the three Decoy cards or the four remaining Escort Duty cards. This guide interprets the four identity cards (Animal Girl + 3 Decoy) as one secret card per Agent, with the other four cards kept by the Rogue Agents as shared references.",
          pt: "A p. 11 do Extra não especifica como distribuir as três cartas Decoy nem as outras quatro cartas Escort Duty. Este guia interpreta que as quatro cartas de identidade (Animal Girl + 3 Decoy) são distribuídas em segredo, uma por Agente, e que as outras quatro ficam com os Rogue Agents como referências compartilhadas."
        }
      },
      components: {
        en: ["8 Escort Duty cards: 3 Decoy, Animal Girl, Immortals Attempt Elimination, Recruiter Attempts Elimination, Make Inquiries, and Witness Protection"],
        pt: ["8 cartas Escort Duty: 3 Decoy, Animal Girl, Immortals Attempt Elimination, Recruiter Attempts Elimination, Make Inquiries e Witness Protection"]
      },
      componentsBySide: {
        recruiter: {
          en: ["A hidden Rogue Agents card set; do not inspect the Agents' card assignments."],
          pt: ["Um conjunto de cartas ocultas dos Rogue Agents; não inspecione as atribuições dos Agentes."]
        },
        agents: {
          en: ["8 Escort Duty cards; one Agent secretly receives Animal Girl, and all Rogue Agents know the holder"],
          pt: ["8 cartas Escort Duty; um Agente recebe Animal Girl em segredo e todos os Rogue Agents sabem quem é"]
        }
      },
      componentRecipientsBySide: {
        recruiter: { en: "Rogue Agents", pt: "Rogue Agents" },
        agents: { en: "Rogue Agents", pt: "Rogue Agents" }
      },
      detailsBySide: {
        recruiter: {
          en: [
            "The Rogue Agents have a hidden Animal Girl assignment; the Recruiter must not learn which Agent holds it.",
            "Instead of moving an Immortal, ask whether either Feature at Animal Girl's current location appears at any location occupied by any Immortal. Rogue Agents answer Yes or No.",
            "You may try to eliminate the Animal Girl by STEPing onto the suspected location or moving an Immortal onto the Agent. A correct guess wins; a miss places a Confirmed Mental Note at the current location and Time."
          ],
          pt: [
            "Os Rogue Agents têm uma atribuição Animal Girl escondida; o Recruiter não pode descobrir qual Agente a possui.",
            "Em vez de mover um Immortal, pergunte se alguma Feature da localização atual de Animal Girl aparece em qualquer localização ocupada por qualquer Immortal. Rogue Agents respondem Yes ou No.",
            "Tente eliminar Animal Girl fazendo STEP para a localização suspeita ou movendo um Immortal até o Agente. Acertar vence; errar coloca uma Mental Note Confirmed na localização e no horário atuais."
          ]
        },
        agents: {
          en: [
            "Randomly assign Animal Girl to one Agent. All Rogue Agents know the holder; the Recruiter must not.",
            "Agents may swap Escort Duty cards when together or orthogonally adjacent; diagonal adjacency also works if an Agent is in a Temple. Mayhem between them prevents a swap unless a Temple rule applies.",
            "The Recruiter may ask about the two Features at Animal Girl's location instead of moving an Immortal. Answer Yes if either Feature appears at any Immortal location; otherwise answer No.",
            "If the Recruiter STEPs onto the suspected location or an Immortal moves onto the Agent, a correct elimination wins immediately; a miss places a Confirmed Mental Note with the current Time.",
            "The package recommends trying Escort Duty without other SHIFT modules in the first game."
          ],
          pt: [
            "Atribua Animal Girl aleatoriamente a um Agente. Todos os Rogue Agents sabem quem a possui; o Recruiter não pode saber.",
            "Agentes podem trocar cartas Escort Duty quando estão juntos ou adjacentes ortogonalmente; a diagonal também vale se um Agente estiver em Temple. Mayhem entre eles impede a troca, exceto quando a regra de Temple permitir.",
            "Em vez de mover um Immortal, o Recruiter pode perguntar sobre as duas Features da localização de Animal Girl. Responda Yes se qualquer Feature aparecer em uma localização com Immortal; caso contrário, No.",
            "Se o Recruiter fizer STEP para a localização suspeita ou um Immortal entrar na localização do Agente, acertar a eliminação vence imediatamente; errar coloca uma Mental Note Confirmed com o Tempo atual.",
            "O pacote recomenda experimentar Escort Duty sem outros módulos SHIFT na primeira partida."
          ]
        }
      },
      setupBySide: {
        recruiter: {
          en: ["Do not inspect the Rogue Agents' Escort Duty cards or learn which Agent has Animal Girl."],
          pt: ["Não inspecione as cartas Escort Duty dos Rogue Agents nem descubra qual Agente possui Animal Girl."]
        },
        agents: {
          en: ["Shuffle Animal Girl and the 3 Decoy cards face-down; secretly deal 1 to each Agent. All Rogue Agents learn who has Animal Girl; keep the assignment hidden from the Recruiter. Keep the other 4 Escort Duty cards together with the Rogue Agents as shared references and follow their printed instructions."],
          pt: ["Embaralhe Animal Girl e as 3 cartas Decoy viradas para baixo; distribua 1 em segredo a cada Agente. Todos os Rogue Agents sabem quem recebeu Animal Girl; mantenha a atribuição escondida do Recruiter. Deixe as outras 4 cartas Escort Duty juntas com os Rogue Agents como referências compartilhadas e siga as instruções impressas nelas."]
        }
      },
      setup: {
        en: ["As a guide interpretation, shuffle Animal Girl and the 3 Decoy cards face-down and deal 1 to each Agent; keep the other 4 Escort Duty cards as shared Rogue Agent references. All Rogue Agents know the Animal Girl holder; the Recruiter must not."],
        pt: ["Como interpretação do guia, embaralhe Animal Girl e as 3 cartas Decoy viradas para baixo e distribua 1 a cada Agente; mantenha as outras 4 cartas Escort Duty como referências compartilhadas dos Rogue Agents. Todos sabem quem recebeu Animal Girl; o Recruiter não pode saber."]
      }
    }
  ];

  const OPENED_PACKAGE_CONTENT = [
    {
      id: "recruiter-1-standard",
      packageSide: "recruiter",
      package: 1,
      visibleTo: ["agents"],
      nameBySide: {
        recruiter: "Magician and New Setup card",
        agents: "Magician and New Capture"
      },
      recipientBySide: {
        recruiter: { en: "Recruiter", pt: "Recruiter" },
        agents: { en: "Rogue Agents", pt: "Rogue Agents" }
      },
      componentsBySide: {
        recruiter: {
          en: ["1 new Setup card and 1 Magician Recruiter card"],
          pt: ["1 nova carta Setup e 1 carta Recruiter Magician"]
        },
        agents: {
          en: ["1 Potential Recruiter Magician card and 1 New Capture card"],
          pt: ["1 carta Potential Recruiter Magician e 1 carta New Capture"]
        }
      },
      detailsBySide: {
        recruiter: {
          en: [
            "The new Setup card lets the Recruiter use a MIND SLIP during any of the first 5 setup moves, if desired. Still place the spent token beside 0–5 on the Time Track.",
            "Magician is an additional Recruiter choice. Its exact MIND SLIP ability is printed on the card; Rogue Agents see the matching Potential Recruiter card.",
            "When the Rogue Agents use New Capture, require both a location and one of your three starting Feature cards; say HIT only when both are correct, otherwise say MISS."
          ],
          pt: [
            "A nova carta Setup permite ao Recruiter usar MIND SLIP em qualquer um dos 5 movimentos iniciais da preparação, se quiser. Ainda assim, coloque a ficha gasta ao lado de 0–5 na Trilha do Tempo.",
            "Magician é uma opção adicional de Recruiter. A habilidade exata de MIND SLIP está impressa na carta; os Rogue Agents veem a carta Potential Recruiter correspondente.",
            "Quando os Rogue Agents usarem New Capture, exija uma localização e uma das suas três cartas Feature iniciais; diga HIT somente se ambos estiverem corretos, caso contrário diga MISS."
          ]
        },
        agents: {
          en: [
            "The Potential Recruiter Magician card is face-up and shows a possible Recruiter ability; the Recruiter's actual card remains secret.",
            "With New Capture, every Capture guess must name both a location and one of the Recruiter's three starting Feature cards. HIT requires both to be correct; otherwise the Recruiter says only MISS."
          ],
          pt: [
            "A carta Potential Recruiter Magician fica visível e mostra uma habilidade possível; a carta real do Recruiter permanece secreta.",
            "Com New Capture, cada tentativa de Capture deve indicar uma localização e uma das três cartas Feature iniciais do Recruiter. HIT exige os dois acertos; caso contrário, o Recruiter diz somente MISS."
          ]
        }
      },
      setupBySide: {
        recruiter: {
          en: ["Use the new Setup card: you may use a MIND SLIP during any of the first 5 setup moves; still place the spent token beside 0–5 on the Time Track. Add Magician to the available Recruiter cards before choosing; keep the card you select behind the Mental Screen."],
          pt: ["Use a nova carta Setup: você pode usar MIND SLIP em qualquer um dos 5 movimentos iniciais; ainda assim, coloque a ficha gasta ao lado de 0–5 na Trilha do Tempo. Acrescente Magician às cartas Recruiter disponíveis antes de escolher; mantenha a carta escolhida atrás da Mental Screen."]
        },
        agents: {
          en: ["Place Potential Recruiter Magician face-up with the other Potential cards; add New Capture to the Rogue Agents' action supply."],
          pt: ["Deixe Potential Recruiter Magician visível com as outras cartas Potential; acrescente New Capture ao suprimento de ações dos Rogue Agents."]
        }
      },
      sourcesBySide: {
        recruiter: [["extra", 2], ["extra", 3]],
        agents: [["extra", 3], ["extra", 4]]
      },
      retentionBySide: {
        recruiter: {
          en: "The new Setup card and Magician Recruiter card stay in the main game.",
          pt: "A nova carta Setup e a carta Recruiter Magician permanecem no jogo base."
        },
        agents: {
          en: "Potential Recruiter Magician and New Capture stay in the main game.",
          pt: "Potential Recruiter Magician e New Capture permanecem no jogo base."
        }
      }
    },
    {
      id: "agents-3-standard",
      packageSide: "agents",
      package: 3,
      visibleTo: ["recruiter"],
      nameBySide: {
        agents: "Duncan, Dark Channels, and Punks",
        recruiter: "Expanded Agent roster and action cards"
      },
      recipientBySide: {
        agents: { en: "Rogue Agents", pt: "Rogue Agents" },
        recruiter: { en: "Rogue Agents; public to Recruiter", pt: "Rogue Agents; visível ao Recruiter" }
      },
      componentsBySide: {
        agents: {
          en: ["1 Duncan Agent card and token, 1 Dark Channels card, and 1 Punks card; these are added permanently"],
          pt: ["1 carta e ficha Agent Duncan, 1 carta Dark Channels e 1 carta Punks; ficam permanentemente no jogo"]
        },
        recruiter: {
          en: ["Duncan joins the Agent roster; Rogue Agents still select 4 Agents. The Agent cards and abilities are public."],
          pt: ["Duncan entra no elenco de Agentes; os Rogue Agents ainda escolhem 4. As cartas e habilidades dos Agentes são públicas."]
        }
      },
      detailsBySide: {
        agents: {
          en: [
            "Choose exactly 4 of the 5 available characters. Duncan is optional unless Futurist is selected, in which case include him. If selected, Duncan may REVEAL a token in a location occupied by an Immortal.",
            "Dark Channels can only be used if Meru is selected, and only by Meru's controller; each ASK is its own action.",
            "With Punks, the moving Agent may be standing or lying down, and an Immortal may share either Agent's location."
          ],
          pt: [
            "Escolha exatamente 4 dos 5 personagens disponíveis. Duncan é opcional, exceto se Futurist for escolhido; nesse caso, inclua-o. Se selecionado, Duncan pode fazer REVEAL de uma ficha em localização ocupada por Immortal.",
            "Dark Channels só pode ser usado se Meru for escolhido, e somente por quem controla Meru; cada ASK é uma ação própria.",
            "Com Punks, o Agente que se move pode estar em pé ou deitado, e um Immortal pode compartilhar a localização de qualquer um dos Agentes."
          ]
        },
        recruiter: {
          en: [
            "Rogue Agents choose exactly 4 of the 5 Agent characters. Duncan's ability is visible if selected.",
            "Dark Channels and Punks are added to the Agent action supply; their printed cards give their exact effects."
          ],
          pt: [
            "Os Rogue Agents escolhem exatamente 4 dos 5 personagens Agent. A habilidade de Duncan fica visível se ele for escolhido.",
            "Dark Channels e Punks entram no suprimento de ações dos Agentes; as cartas impressas mostram os efeitos exatos."
          ]
        }
      },
      setupBySide: {
        agents: {
          en: ["Add Duncan to the Agent choices and select exactly 4 of the 5; include Duncan if Futurist is in this match. Use Duncan's token if selected. Add Dark Channels and Punks to the action supply; Dark Channels is usable only if Meru is selected."],
          pt: ["Acrescente Duncan às opções de Agent e escolha exatamente 4 dos 5; inclua Duncan se Futurist estiver nesta partida. Use a ficha de Duncan se ele for escolhido. Acrescente Dark Channels e Punks ao suprimento de ações; Dark Channels só pode ser usado se Meru for escolhido."]
        },
        recruiter: {
          en: ["Observe the four face-up Agent cards selected by the Rogue Agents; the unused fifth character stays out of play."],
          pt: ["Observe as quatro cartas Agent visíveis escolhidas pelos Rogue Agents; o quinto personagem não escolhido fica fora da partida."]
        }
      },
      sourcesBySide: {
        agents: [["extra", 14], ["extra", 15], ["extra", 17]],
        recruiter: [["extra", 14], ["extra", 15], ["extra", 17]]
      },
      retentionBySide: {
        agents: {
          en: "Duncan, Dark Channels, and Punks stay in the main game.",
          pt: "Duncan, Dark Channels e Punks permanecem no jogo base."
        },
        recruiter: {
          en: "These package 3 components stay in the main game.",
          pt: "Esses componentes do pacote 3 permanecem no jogo base."
        }
      }
    },
    {
      id: "agents-4-standard",
      packageSide: "agents",
      package: 4,
      visibleTo: ["recruiter"],
      nameBySide: { agents: "Perrier", recruiter: "Perrier" },
      recipientBySide: {
        agents: { en: "Rogue Agents", pt: "Rogue Agents" },
        recruiter: { en: "Rogue Agents", pt: "Rogue Agents" }
      },
      componentsBySide: {
        agents: {
          en: ["1 Perrier card and 1 Perrier token; both are added permanently"],
          pt: ["1 carta Perrier e 1 ficha Perrier; ambas ficam permanentemente no jogo"]
        },
        recruiter: {
          en: ["Rogue Agents add Perrier and its token; it narrows their possible Recruiter Feature cards as those cards are revealed"],
          pt: ["Rogue Agents acrescentam Perrier e sua ficha; isso reduz as possíveis cartas Feature do Recruiter conforme são reveladas"]
        }
      },
      detailsBySide: {
        agents: {
          en: ["Perrier narrows the possible Recruiter Feature cards as Rogue Agents reveal Features. Follow the card's printed instructions for the token's effect."],
          pt: ["Perrier reduz as possíveis cartas Feature do Recruiter conforme os Rogue Agents revelam Features. Siga as instruções impressas na carta para o efeito da ficha."]
        },
        recruiter: {
          en: ["Perrier narrows the Rogue Agents' possible Recruiter Feature cards as those cards are revealed. Follow the visible card/token for its exact tracking procedure."],
          pt: ["Perrier reduz as possíveis cartas Feature do Recruiter conforme elas são reveladas. Siga a carta/ficha visível para o procedimento exato de acompanhamento."]
        }
      },
      setupBySide: {
        agents: {
          en: ["Add Perrier and its token to the Rogue Agents' supply; follow the card when a Feature is revealed."],
          pt: ["Acrescente Perrier e sua ficha ao suprimento dos Rogue Agents; siga a carta quando uma Feature for revelada."]
        }
      },
      sourcesBySide: { agents: [["extra", 19]] },
      retentionBySide: {
        agents: {
          en: "Perrier and its token stay in the main game.",
          pt: "Perrier e sua ficha permanecem no jogo base."
        }
      }
    },
    {
      id: "agents-7-standard",
      packageSide: "agents",
      package: 7,
      visibleTo: ["recruiter"],
      nameBySide: { agents: "Dusty's Army", recruiter: "Dusty's Army" },
      recipientBySide: {
        agents: { en: "Rogue Agents", pt: "Rogue Agents" },
        recruiter: { en: "Rogue Agents", pt: "Rogue Agents" }
      },
      interpretationBySide: {
        agents: {
          en: "Extra p. 22 does not say whether removing the Immortal happens before or after the normal Shakedown push. This guide follows the normal sequence: finish the Shakedown, including its optional legal push, then remove the target.",
          pt: "A p. 22 do Extra não diz se a remoção do Immortal ocorre antes ou depois do empurrão normal de Shakedown. Este guia segue a sequência normal: conclua Shakedown, incluindo o empurrão legal opcional, e depois retire o alvo."
        },
        recruiter: {
          en: "Extra p. 22 does not say whether removing the Immortal happens before or after the normal Shakedown push. This guide follows the normal sequence: finish the Shakedown, including its optional legal push, then remove the target.",
          pt: "A p. 22 do Extra não diz se a remoção do Immortal ocorre antes ou depois do empurrão normal de Shakedown. Este guia segue a sequência normal: conclua Shakedown, incluindo o empurrão legal opcional, e depois retire o alvo."
        }
      },
      componentsBySide: {
        agents: {
          en: ["1 Dusty's Army card; it is added permanently"],
          pt: ["1 carta Dusty's Army; ela fica permanentemente no jogo"]
        },
        recruiter: {
          en: ["1 Rogue Agents card; a successful Shakedown removes the targeted Immortal"],
          pt: ["1 carta dos Rogue Agents; um Shakedown bem-sucedido remove o Immortal alvo"]
        }
      },
      detailsBySide: {
        agents: {
          en: ["After a successful Shakedown reveals one of the Recruiter's 3 secret Feature cards, remove the targeted Immortal for the rest of the game. The Recruiter then has 3 Immortals, or 2 if Right-Hand Man has also been removed."],
          pt: ["Depois que um Shakedown bem-sucedido revelar uma das 3 cartas Feature secretas do Recruiter, retire o Immortal alvo pelo restante da partida. O Recruiter fica com 3 Immortals, ou 2 se Right-Hand Man também tiver sido removido."]
        },
        recruiter: {
          en: ["After a successful Shakedown reveals one of your 3 secret Feature cards, the targeted Immortal is removed for the rest of the game. You then have 3 Immortals, or 2 if Right-Hand Man has also been removed."],
          pt: ["Depois que um Shakedown bem-sucedido revelar uma das suas 3 cartas Feature secretas, o Immortal alvo é removido pelo restante da partida. Você fica com 3 Immortals, ou 2 se Right-Hand Man também tiver sido removido."]
        }
      },
      setupBySide: {
        agents: {
          en: ["Add Dusty's Army to the Rogue Agents' action supply."],
          pt: ["Acrescente Dusty's Army ao suprimento de ações dos Rogue Agents."]
        }
      },
      sourcesBySide: { agents: [["extra", 22]] },
      retentionBySide: {
        agents: {
          en: "Dusty's Army stays in the main game.",
          pt: "Dusty's Army permanece no jogo base."
        }
      }
    },
    {
      id: "recruiter-7-standard",
      packageSide: "recruiter",
      package: 7,
      visibleTo: ["agents"],
      nameBySide: { recruiter: "The Eraser", agents: "Potential Recruiter The Eraser" },
      recipientBySide: {
        recruiter: { en: "Recruiter", pt: "Recruiter" },
        agents: { en: "Rogue Agents", pt: "Rogue Agents" }
      },
      componentsBySide: {
        recruiter: {
          en: ["1 Recruiter The Eraser card; keep the selected Recruiter card secret"],
          pt: ["1 carta Recruiter The Eraser; mantenha em segredo a carta escolhida"]
        },
        agents: {
          en: ["1 Potential Recruiter The Eraser card; keep it face-up"],
          pt: ["1 carta Potential Recruiter The Eraser; mantenha-a visível"]
        }
      },
      detailsBySide: {
        recruiter: {
          en: ["The Eraser moves in a straight horizontal or vertical line until the board edge or the first Mayhem token, whichever comes first. The destination cannot be a visited location."],
          pt: ["The Eraser se move em linha reta horizontal ou vertical até a borda do tabuleiro ou a primeira ficha Mayhem, o que ocorrer primeiro. O destino não pode ter sido visitado."]
        },
        agents: {
          en: ["The Potential Recruiter The Eraser card is face-up during setup. It can move in a straight horizontal or vertical line to the board edge or first Mayhem token, but cannot end at a visited location."],
          pt: ["A carta Potential Recruiter The Eraser fica visível durante a preparação. Ela se move em linha reta horizontal ou vertical até a borda ou a primeira ficha Mayhem, mas não pode terminar em localização visitada."]
        }
      },
      setupBySide: {
        recruiter: {
          en: ["Add The Eraser to the available Recruiter cards before choosing; keep the card you select behind the Mental Screen."],
          pt: ["Acrescente The Eraser às cartas Recruiter disponíveis antes de escolher; mantenha a carta escolhida atrás da Mental Screen."]
        },
        agents: {
          en: ["Place Potential Recruiter The Eraser face-up under POTENTIAL."],
          pt: ["Coloque Potential Recruiter The Eraser visível sob POTENTIAL."]
        }
      },
      sourcesBySide: {
        recruiter: [["extra", 10]],
        agents: [["extra", 10]]
      },
      retentionBySide: {
        recruiter: {
          en: "The Eraser Recruiter card stays in the main game.",
          pt: "A carta Recruiter The Eraser permanece no jogo base."
        },
        agents: {
          en: "Potential Recruiter The Eraser stays in the main game.",
          pt: "Potential Recruiter The Eraser permanece no jogo base."
        }
      }
    }
  ];

  const EXTRA_CARDS = [
    {
      id: "rules-lawyer", name: "Rules Lawyer", side: "shared", page: 24,
      sourceLocation: { en: "Rulebook, Envelope 1", pt: "Manual, Envelope 1" },
      components: { en: ["1 Rules Lawyer card"], pt: ["1 carta Rules Lawyer"] },
      details: {
        en: ["Randomly give this card to one player. If the rulebook and Flux Safe House cannot resolve a dispute, that player makes the ruling. After ruling, pass the card to someone on the opposing team in case it is needed again."],
        pt: ["Entregue esta carta aleatoriamente a um jogador. Se o manual e o Flux Safe House não resolverem uma dúvida, essa pessoa decide. Depois, passe a carta a alguém da equipe adversária caso seja necessária novamente."]
      }
    },
    {
      id: "big-jim", name: "Big Jim", side: "agents", visibleTo: ["recruiter"], page: 25,
      sourceLocation: { en: "Mental Screen, Envelope 2", pt: "Tela Mental, Envelope 2" },
      components: { en: ["1 Ally card; add it to the Rogue Agents' Ally supply"], pt: ["1 carta Ally; acrescente-a ao suprimento de Allies dos Rogue Agents"] },
      details: {
        en: ["Once per game, use Big Jim as an action to Reveal a Step token anywhere on the board, even if an Immortal is there. Do not use him when an Immortal is in your own location."],
        pt: ["Uma vez por partida, use Big Jim como ação para fazer Reveal de uma ficha Step em qualquer lugar do tabuleiro, mesmo com um Immortal ali. Não o use se houver um Immortal na sua própria localização."]
      }
    },
    {
      id: "on-temples", name: "On Temples", side: "agents", visibleTo: ["recruiter"], page: 26,
      sourceLocation: { en: "Rulebook postcard, Envelope 3", pt: "Cartão-postal do manual, Envelope 3" },
      components: { en: ["1 On Temples card; use its alternate Shakedown rule"], pt: ["1 carta On Temples; use sua regra alternativa de Shakedown"] },
      details: {
        en: ["During any Shakedown, choose the normal Feature-card guess or ask how many Temples the Recruiter has visited; the Recruiter must answer 0, 1, or 2. A correct Feature guess is revealed beside the board and matching Features on unvisited locations are crossed out. This card changes the question; resolve the rest of Shakedown, including its normal push, as usual."],
        pt: ["Durante qualquer Shakedown, escolha adivinhar uma carta Feature normalmente ou perguntar quantos Temples o Recruiter visitou; ele deve responder 0, 1 ou 2. Se acertar uma Feature, ela é revelada ao lado do tabuleiro e as Features correspondentes em localizações não visitadas são riscadas. Esta carta muda a pergunta; resolva o restante de Shakedown, incluindo o empurrão normal, como de costume."]
      }
    },
    {
      id: "ignore-ask", name: "Ignore Ask", side: "recruiter", visibleTo: ["agents"], page: 27,
      sourceLocation: { en: "Rulebook postcard, Envelope 4", pt: "Cartão-postal do manual, Envelope 4" },
      components: { en: ["1 Recruiter card"], pt: ["1 carta Recruiter"] },
      details: {
        en: ["When a Rogue Agent takes Ask, the Recruiter may discard an unused Mind Slip token to refuse the answer. The Agent may finish moving if it has not moved yet, but takes no other action."],
        pt: ["Quando um Rogue Agent fizer Ask, o Recruiter pode descartar uma ficha Mind Slip não usada para não responder. O Agente pode terminar de se mover se ainda não o fez, mas não realiza outra ação."]
      }
    },
    {
      id: "corners", name: "Corners", side: "recruiter", visibleTo: ["agents"], page: 28,
      sourceLocation: { en: "Setup card, Envelope 5", pt: "Cartão de Preparação, Envelope 5" },
      components: { en: ["1 replacement STEP card"], pt: ["1 carta STEP substituta"] },
      details: {
        en: ["Replace the normal STEP card. The Recruiter may move diagonally into or out of any of the four corner locations, as well as orthogonally. Mayhem still blocks orthogonal movement; visited locations remain forbidden."],
        pt: ["Substitua a carta STEP normal. O Recruiter pode entrar ou sair diagonalmente de qualquer um dos quatro cantos, além de se mover ortogonalmente. Mayhem ainda bloqueia movimento ortogonal; localizações visitadas continuam proibidas."]
      }
    },
    {
      id: "mental-fog", name: "Mental Fog", side: "recruiter", visibleTo: ["agents"], page: 29,
      sourceLocation: { en: "Box insert, Envelope 6", pt: "Inserto da caixa, Envelope 6" },
      components: { en: ["1 Recruiter card"], pt: ["1 carta Recruiter"] },
      details: {
        en: ["On the Recruiter's turn, discard this card and have all Rogue Agents close their eyes. You may move or remove 1 Mental Note token, or leave all notes unchanged; Agents must not inspect the board during the action."],
        pt: ["No turno do Recruiter, descarte esta carta e peça que todos os Rogue Agents fechem os olhos. Você pode mover ou retirar 1 ficha Mental Note, ou não alterar nenhuma; os Agentes não podem observar o tabuleiro durante a ação."]
      }
    },
    {
      id: "futurist", name: "Futurist", side: "agents", page: 30,
      sourceLocation: { en: "Feature cards, Envelope 7", pt: "Cartas Feature, Envelope 7" },
      requiresPackage: { side: "agents", package: 3 },
      components: { en: ["1 Futurist card; requires Duncan from Rogue Agents package 3"], pt: ["1 carta Futurist; requer Duncan do pacote Rogue Agents 3"] },
      details: {
        en: ["Only the player controlling Duncan may use Futurist. After Duncan's failed Shakedown guess, he may make one additional Feature guess."],
        pt: ["Somente o jogador que controla Duncan pode usar Futurist. Depois de uma tentativa de Shakedown errada de Duncan, ele pode fazer mais uma tentativa de adivinhar Feature."]
      }
    },
    {
      id: "omnipotent", name: "Omnipotent", side: "shared", page: 31,
      sourceLocation: { en: "Punchboard, Envelope 8", pt: "Cartão-cartela, Envelope 8" },
      components: { en: ["1 Omnipotent card"], pt: ["1 carta Omnipotent"] },
      details: {
        en: ["During any player's turn, discard this card to move a Mind Slip token still on the board to an orthogonally adjacent location. If the Recruiter has not visited the new location, they must visit it before retrieving the token; if it is already visited, they may retrieve it at any point during their turn."],
        pt: ["Durante o turno de qualquer jogador, descarte esta carta para mover uma ficha Mind Slip no tabuleiro a uma localização adjacente ortogonalmente. Se o Recruiter ainda não visitou a nova localização, deve visitá-la antes de recuperar a ficha; se já a visitou, pode recuperá-la em qualquer momento do turno."]
      }
    },
    {
      id: "evades", name: "Evades", side: "recruiter", visibleTo: ["agents"], page: 32,
      sourceLocation: { en: "Other hidden cards, Envelope 9", pt: "Outras cartas escondidas, Envelope 9" },
      components: { en: ["1 Evades card"], pt: ["1 carta Evades"] },
      details: {
        en: ["Before round 9, cover the 15:00 and 16:00 spaces with this card. The Recruiter can then win when the Time token reaches 14:00, but must still reveal Recruit totals at every red Alert."],
        pt: ["Antes da rodada 9, cubra os espaços 15:00 e 16:00 com esta carta. O Recruiter passa a vencer quando o marcador de Tempo chegar a 14:00, mas ainda precisa revelar o total de Recruits em cada Alerta vermelho."]
      }
    },
    {
      id: "psychic-snare", name: "Psychic Snare · app unlock", side: "agents", page: 33,
      sourceLocation: { en: "Other hidden cards, Envelope 10", pt: "Outras cartas escondidas, Envelope 10" },
      components: { en: ["No physical card or tokens are specified; use Mental Notes, another game's tokens, or paper to mark locations"], pt: ["Nenhuma carta ou ficha física é especificada; use Mental Notes, fichas de outro jogo ou papel para marcar localizações"] },
      details: {
        en: ["The Recruiter is not told where Psychic Snares are placed. More than one may be placed, including by the same Agent; if any triggers, remove them all and do not say which one triggered. Entering a Snare's exact location does not trigger it; entering any of its 8 adjacent locations does. The supplied page says this is unlocked in the official app but does not explain when or how to place a Snare; follow the app for that procedure."],
        pt: ["O Recruiter não é informado onde as Psychic Snares foram colocadas. Pode haver mais de uma, inclusive colocadas pelo mesmo Agente; se alguma for ativada, retire todas sem dizer qual foi acionada. Entrar na localização exata não a ativa; entrar em qualquer uma das 8 localizações adjacentes ativa. A página fornecida diz que isso é desbloqueado no aplicativo oficial, mas não explica quando ou como colocar uma Snare; siga o aplicativo para esse procedimento."]
      }
    }
  ];

  const EXTRA_SETUP = {
    "rules-lawyer": {
      en: "Randomly assign this card to one player before play; that person handles rules disputes.",
      pt: "Antes de jogar, entregue esta carta aleatoriamente a uma pessoa; ela resolve dúvidas de regras."
    },
    "big-jim": {
      en: "Add Big Jim to the Rogue Agents' Ally supply.",
      pt: "Acrescente Big Jim ao suprimento de Allies dos Rogue Agents."
    },
    "on-temples": {
      en: "Place the alternate Shakedown card with the Rogue Agents' action cards.",
      pt: "Coloque a carta alternativa Shakedown com as cartas de ação dos Rogue Agents."
    },
    "ignore-ask": {
      en: "Give the Ignore Ask card to the Recruiter; it uses an unused Mind Slip token.",
      pt: "Entregue Ignore Ask ao Recruiter; ela usa uma ficha Mind Slip não usada."
    },
    "corners": {
      en: "Replace the ordinary STEP card with the Corners card before the first turn.",
      pt: "Substitua a carta STEP normal por Corners antes do primeiro turno."
    },
    "mental-fog": {
      en: "Give Mental Fog to the Recruiter and keep it available for its printed action.",
      pt: "Entregue Mental Fog ao Recruiter e deixe-a disponível para sua ação impressa."
    },
    "futurist": {
      en: "Add Futurist to the Rogue Agents' card supply. It requires the Duncan agent to be selected.",
      pt: "Acrescente Futurist ao suprimento dos Rogue Agents. Requer que o Agente Duncan esteja selecionado."
    },
    "omnipotent": {
      en: "Keep Omnipotent available to either side as described on its card.",
      pt: "Deixe Omnipotent disponível para ambos os lados conforme descrito na carta."
    },
    "evades": {
      en: "Give Evades to the Recruiter; its Time Track spaces are covered before round 9 if its effect is used.",
      pt: "Entregue Evades ao Recruiter; os espaços da Trilha do Tempo são cobertos antes da rodada 9 se o efeito for usado."
    },
    "psychic-snare": {
      en: "The source describes this as an official-app unlock, not a physical Ally. The supplied page does not specify the placement procedure; use the app for setup and use only the described trigger behavior here.",
      pt: "A fonte descreve isto como desbloqueio no aplicativo oficial, não como Ally física. A página fornecida não especifica o procedimento de colocação; use o aplicativo para preparar e siga aqui somente o comportamento de ativação descrito."
    }
  };

  const MODULE_RETENTION = {
    "agents-1": {
      en: "Return both cards and all tripwire tokens to the sealed package after the game.",
      pt: "Depois da partida, devolva as duas cartas e todas as fichas Tripwire ao pacote lacrado."
    },
    "agents-2": {
      en: "Return both cards and both tokens to the sealed package after the game.",
      pt: "Depois da partida, devolva as duas cartas e as duas fichas ao pacote lacrado."
    },
    "agents-3": {
      en: "Return the Mind Map card and its two tokens to the sealed package.",
      pt: "Devolva a carta Mind Map e suas duas fichas ao pacote lacrado."
    },
    "agents-4": {
      en: "Return all 3 cards, the Original Immortal figure, and both Umbrella tokens to the sealed package.",
      pt: "Devolva as 3 cartas, a figura Original Immortal e as duas fichas Umbrella ao pacote lacrado."
    },
    "agents-5": {
      en: "Return the Psi-scan card and four tokens to the sealed package.",
      pt: "Devolva a carta Psi-scan e as quatro fichas ao pacote lacrado."
    },
    "agents-6": {
      en: "Return both Mental Blast cards and all four tokens to the sealed package.",
      pt: "Devolva as duas cartas Mental Blast e as quatro fichas ao pacote lacrado."
    },
    "agents-7": {
      en: "Return the Psychic Net card and token to the sealed package.",
      pt: "Devolva a carta Psychic Net e sua ficha ao pacote lacrado."
    },
    "recruiter-1": {
      en: "Return the Distraction Box card and its STEP token to the sealed package.",
      pt: "Devolva a carta Distraction Box e a ficha STEP ao pacote lacrado."
    },
    "recruiter-2": {
      en: "Return both Dreamwalker cards and all four Search tokens to the sealed package.",
      pt: "Devolva as duas cartas Dreamwalker e as quatro fichas Search ao pacote lacrado."
    },
    "recruiter-3": {
      en: "Return the module card and Mind Slip token as directed by the sheet; keep the blue Mayhem token with Recruiter package 3.",
      pt: "Devolva a carta e a ficha Mind Slip conforme a folha; mantenha a ficha Mayhem azul com o pacote Recruiter 3."
    },
    "recruiter-4": {
      en: "Return the three cards and both tokens to the sealed package.",
      pt: "Devolva as três cartas e as duas fichas ao pacote lacrado."
    },
    "recruiter-5": {
      en: "Return both Right-Hand Man cards and its figure to the sealed package.",
      pt: "Devolva as duas cartas Right-Hand Man e sua figura ao pacote lacrado."
    },
    "recruiter-6": {
      en: "Return the Homemaker card and its two tokens to the package; store the blue Mayhem token with Recruiter package 3.",
      pt: "Devolva a carta Homemaker e suas duas fichas ao pacote; guarde a ficha Mayhem azul com o pacote Recruiter 3."
    },
    "recruiter-7": {
      recruiter: {
        en: "Return the hidden Escort Duty card set to the sealed package after the game; do not inspect the Agent assignments.",
        pt: "Depois da partida, devolva o conjunto oculto Escort Duty ao pacote lacrado; não inspecione as atribuições dos Agentes."
      },
      agents: {
        en: "Return all 8 Escort Duty cards to the sealed package after the game.",
        pt: "Depois da partida, devolva as 8 cartas Escort Duty ao pacote lacrado."
      }
    }
  };

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function normalizePreferences(saved) {
    const source = saved && typeof saved === "object" ? saved : {};
    const normalized = {
      language: source.language === "en-US" ? "en-US" : "pt-BR",
      mode: source.mode === "full" ? "full" : "training",
      players: [2, 3, 4, 5].includes(Number(source.players)) ? Number(source.players) : 2,
      startVisibility: source.startVisibility === "hidden" ? "hidden" : "public",
      readingSide: source.readingSide === "agents" ? "agents" : "recruiter",
      openedRecruiter: Math.max(0, Math.min(7, Number(source.openedRecruiter) || 0)),
      openedAgents: Math.max(0, Math.min(7, Number(source.openedAgents) || 0)),
      previousWinner: ["recruiter", "agents"].includes(source.previousWinner) ? source.previousWinner : "none",
      winStreak: [1, 2, 3].includes(Number(source.winStreak)) ? Number(source.winStreak) : 1,
      shiftModules: {},
      revealExtras: source.revealExtras === true,
      extras: {}
    };
    for (const module of SHIFT_MODULES) {
      normalized.shiftModules[module.id] = source.shiftModules?.[module.id] === true;
    }
    for (const id of EXTRA_IDS) {
      normalized.extras[id] = source.extras?.[id] === true;
    }
    if (normalized.mode !== "full") {
      normalized.openedRecruiter = 0;
      normalized.openedAgents = 0;
      normalized.previousWinner = "none";
      normalized.winStreak = 1;
      Object.keys(normalized.shiftModules).forEach((id) => {
        normalized.shiftModules[id] = false;
      });
    } else {
      for (const module of SHIFT_MODULES) {
        const opened = module.side === "recruiter" ? normalized.openedRecruiter : normalized.openedAgents;
        if (module.package > opened) {
          normalized.shiftModules[module.id] = false;
        }
      }
      if (normalized.previousWinner === "none") {
        normalized.winStreak = 1;
        Object.keys(normalized.shiftModules).forEach((id) => {
          normalized.shiftModules[id] = false;
        });
      }
    }
    if (normalized.mode !== "full" || !normalized.revealExtras) {
      normalized.revealExtras = false;
      EXTRA_IDS.forEach((id) => {
        normalized.extras[id] = false;
      });
    }
    if (normalized.openedAgents < 3) {
      normalized.extras.futurist = false;
    }
    return normalized;
  }

  function loadPreferences() {
    try {
      const raw = localStorage.getItem(PREFERENCES_KEY);
      return raw ? normalizePreferences(JSON.parse(raw)) : { ...DEFAULTS, shiftModules: {}, extras: {} };
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Mind MGMT preferences.", error);
      return { ...DEFAULTS, shiftModules: {}, extras: {} };
    }
  }

  function configFingerprint(value = state) {
    return JSON.stringify({
      mode: value.mode,
      players: value.players,
      startVisibility: value.startVisibility,
      openedRecruiter: value.openedRecruiter,
      openedAgents: value.openedAgents,
      previousWinner: value.previousWinner,
      winStreak: value.winStreak,
      shiftModules: value.shiftModules,
      revealExtras: value.revealExtras,
      extras: value.extras
    });
  }

  function loadSetup() {
    try {
      const raw = localStorage.getItem(SETUP_KEY);
      if (!raw) {
        return { fingerprint: configFingerprint(), checks: [] };
      }

      const saved = JSON.parse(raw);
      return {
        fingerprint: configFingerprint(),
        checks: saved?.fingerprint === configFingerprint() && Array.isArray(saved.checks)
          ? [...new Set(saved.checks.filter((id) => PHASE_IDS.includes(id)))]
          : []
      };
    } catch (error) {
      storageIssues.add("setup-read");
      console.error("Could not read Mind MGMT setup progress.", error);
      return { fingerprint: configFingerprint(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Mind MGMT preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Mind MGMT setup progress.", error);
    }
  }

  function sideName(side = state.readingSide) {
    return side === "agents" ? t("Rogue Agents", "Agentes Renegados") : t("Recruiter", "Recrutador");
  }

  function manualUrl(book, page) {
    return `manuals/${MANUALS[book]}#page=${page}`;
  }

  function referenceLink(book, page) {
    const label = book === "core" ? t(`Core p. ${page} ↗`, `Base p. ${page} ↗`)
      : book === "shift" ? t(`SHIFT ref p. ${page} ↗`, `Ref. SHIFT p. ${page} ↗`)
        : t(`Extra p. ${page} ↗`, `Extra p. ${page} ↗`);
    return `<a class="source-link" href="${manualUrl(book, page)}" target="_blank" rel="noreferrer">${label}</a>`;
  }

  function sectionHeading(id, title, index, sources = []) {
    return `
      <div class="section-heading">
        <div><p class="eyebrow">${t("FIELD GUIDE", "GUIA DE CAMPO")} / ${index}</p><h2 id="${id}">${title}</h2></div>
        <div class="mind-section-references">${sources.map(([book, page]) => referenceLink(book, page)).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function ruleLine(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
  }

  function infoCard(labelEn, titleEn, lines, sources, labelPt = labelEn, titlePt = titleEn) {
    return `
      <article class="info-card">
        <span class="component-label">${t(labelEn, labelPt)}</span>
        <h3>${t(titleEn, titlePt)}</h3>
        ${lineList(lines)}
        ${sources.map(([book, page]) => referenceLink(book, page)).join(" ")}
      </article>`;
  }

  function iconCard(file, titleEn, bodyEn, titlePt, bodyPt, book, page) {
    const title = t(titleEn, titlePt);
    return `
      <article class="icon-card">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}" alt="${title}"></span>
        <div><strong>${title}</strong><p>${t(bodyEn, bodyPt)}</p>${referenceLink(book, page)}</div>
      </article>`;
  }

  function radioGroup(field, titleEn, titlePt, summaryEn, summaryPt, choices) {
    return `
      <fieldset class="mind-choice-group">
        <legend>${t(titleEn, titlePt)} · ${t("selected:", "selecionado:")} <span>${t(summaryEn, summaryPt)}</span></legend>
        <div class="mind-choice-grid">${choices.map((choice) => `
          <label class="mind-choice-card ${choice.checked ? "is-selected" : ""} ${choice.disabled ? "is-disabled" : ""}">
            <input type="radio" name="mind-${field}" value="${choice.value}" data-field="${field}" ${choice.checked ? "checked" : ""} ${choice.disabled ? "disabled" : ""}>
            <span class="mind-choice-copy"><strong>${t(choice.titleEn, choice.titlePt)}</strong><small>${t(choice.bodyEn, choice.bodyPt)}</small></span>
          </label>`).join("")}</div>
      </fieldset>`;
  }

  function moduleSelected(id) {
    return state.shiftModules[id] === true;
  }

  function moduleNameForReader(module) {
    return module.nameBySide?.[state.readingSide] || module.name;
  }

  function moduleDetailsForReader(module) {
    const data = module.detailsBySide?.[state.readingSide] || module.details;
    return data[state.language === "pt-BR" ? "pt" : "en"];
  }

  function moduleInterpretationForReader(module) {
    const data = module.interpretationBySide?.[state.readingSide];
    return data?.[state.language === "pt-BR" ? "pt" : "en"] || "";
  }

  function moduleComponentsForReader(module) {
    const data = module.componentsBySide?.[state.readingSide] || module.components;
    return data[state.language === "pt-BR" ? "pt" : "en"];
  }

  function moduleComponentRecipient(module) {
    const data = module.componentRecipientsBySide?.[state.readingSide] || module.componentRecipientsBySide?.[module.side];
    return data ? t(data.en, data.pt) : sideName(module.side);
  }

  function moduleSetupForSide(module, side) {
    const data = module.setupBySide?.[side] || (module.side === side ? module.setup : null);
    return data?.[state.language === "pt-BR" ? "pt" : "en"] || [];
  }

  function openedContentForReader() {
    if (state.mode !== "full") {
      return [];
    }
    return OPENED_PACKAGE_CONTENT.filter((content) =>
      content.package <= openedPackages(content.packageSide) &&
      (content.packageSide === state.readingSide || content.visibleTo?.includes(state.readingSide))
    );
  }

  function openedContentNameForReader(content) {
    return content.nameBySide?.[state.readingSide] || content.nameBySide?.[content.packageSide];
  }

  function openedContentRecipient(content) {
    const data = content.recipientBySide?.[state.readingSide] || content.recipientBySide?.[content.packageSide];
    return data ? t(data.en, data.pt) : sideName(content.packageSide);
  }

  function openedContentInterpretationForReader(content) {
    const data = content.interpretationBySide?.[state.readingSide];
    return data?.[state.language === "pt-BR" ? "pt" : "en"] || "";
  }

  function openedContentLines(content, field, side = state.readingSide) {
    const data = content[field]?.[side] || content[field]?.[content.packageSide];
    return data?.[state.language === "pt-BR" ? "pt" : "en"] || [];
  }

  function openedContentSources(content, side = state.readingSide) {
    return content.sourcesBySide?.[side] || content.sourcesBySide?.[content.packageSide] || [];
  }

  function openedContentSetup(content, side) {
    const data = content.setupBySide?.[side] ||
      (content.packageSide === side ? content.setupBySide?.[content.packageSide] : null);
    return data?.[state.language === "pt-BR" ? "pt" : "en"] || [];
  }

  function openedContentRetention(content) {
    const data = content.retentionBySide?.[state.readingSide] || content.retentionBySide?.[content.packageSide];
    return data?.[state.language === "pt-BR" ? "pt" : "en"] || "";
  }

  function moduleRetentionForReader(module) {
    const data = MODULE_RETENTION[module.id];
    const details = data?.[state.readingSide] || data;
    return details?.[state.language === "pt-BR" ? "pt" : "en"] || "";
  }

  function modulesForReader() {
    return SHIFT_MODULES.filter((module) =>
      moduleSelected(module.id) &&
      (module.side === state.readingSide || module.visibleTo?.includes(state.readingSide))
    );
  }

  function moduleReferences(module) {
    return moduleSourcePairs(module).map(([book, page]) => referenceLink(book, page)).join(" ");
  }

  function moduleSourcePairs(module) {
    const summaryPage = module.summaryPageBySide && Object.hasOwn(module.summaryPageBySide, state.readingSide)
      ? module.summaryPageBySide[state.readingSide]
      : module.summaryPage;
    const detailPage = module.detailPageBySide && Object.hasOwn(module.detailPageBySide, state.readingSide)
      ? module.detailPageBySide[state.readingSide]
      : module.detailPage;
    const extraPages = module.extraPagesBySide?.[state.readingSide] ?? module.extraPages ?? [];
    const sources = [];
    if (summaryPage !== null && summaryPage !== undefined) {
      sources.push(["shift", summaryPage]);
    }
    if (detailPage) {
      sources.push(["extra", detailPage]);
    }
    extraPages.forEach((page) => sources.push(["extra", page]));
    return sources;
  }

  function extraSelected(id) {
    return state.extras[id] === true;
  }

  function openedPackages(side) {
    return side === "recruiter" ? state.openedRecruiter : state.openedAgents;
  }

  function selectedModules(side) {
    return SHIFT_MODULES.filter((module) => module.side === side && moduleSelected(module.id));
  }

  function selectedExtras(side = null) {
    return EXTRA_CARDS.filter((extra) =>
      extraSelected(extra.id) &&
      (!side || extra.side === "shared" || extra.side === side || extra.visibleTo?.includes(side))
    );
  }

  function selectedExtrasForOwner(side) {
    return EXTRA_CARDS.filter((extra) =>
      extraSelected(extra.id) && (extra.side === "shared" || extra.side === side)
    );
  }

  function moduleSelectionCount(side) {
    return selectedModules(side).length;
  }

  function losingSide() {
    if (state.previousWinner === "recruiter") {
      return "agents";
    }
    if (state.previousWinner === "agents") {
      return "recruiter";
    }
    return null;
  }

  function winnerSide() {
    if (state.previousWinner === "recruiter") {
      return "recruiter";
    }
    if (state.previousWinner === "agents") {
      return "agents";
    }
    return null;
  }

  function winnerModuleLimit() {
    const loser = losingSide();
    return loser ? Math.max(0, moduleSelectionCount(loser) - state.winStreak) : 0;
  }

  function configIssues() {
    const issues = [];
    if (state.mode === "full") {
      const hasSelections = moduleSelectionCount("recruiter") + moduleSelectionCount("agents") > 0;
      if (hasSelections && state.previousWinner === "none") {
        issues.push(t(
          "Select the winner of the previous full game to apply the SHIFT selection limit.",
          "Selecione quem venceu a partida completa anterior para aplicar o limite de seleção SHIFT."
        ));
      }
      const winner = winnerSide();
      if (winner && moduleSelectionCount(winner) > winnerModuleLimit()) {
        issues.push(t(
          `${sideName(winner)} selected ${moduleSelectionCount(winner)} modules, but the campaign limit is ${winnerModuleLimit()}. Reduce that side's selection.`,
          `${sideName(winner)} selecionou ${moduleSelectionCount(winner)} módulos, mas o limite da campanha é ${winnerModuleLimit()}. Reduza a seleção desse lado.`
        ));
      }
    }
    return issues;
  }

  function storageNoticeText() {
    const readFailed = storageIssues.has("preferences-read") || storageIssues.has("setup-read");
    const writeFailed = storageIssues.has("preferences-write") || storageIssues.has("setup-write");
    return t(
      `${readFailed ? "This browser could not read saved Mind MGMT preferences or setup progress; defaults are shown. " : ""}${writeFailed ? "The latest change could not be saved and is visible on screen only." : ""}`,
      `${readFailed ? "Este navegador não conseguiu ler as preferências ou o progresso de Mind MGMT salvos; as opções padrão estão sendo mostradas. " : ""}${writeFailed ? "A alteração mais recente não pôde ser salva e aparece somente na tela." : ""}`
    ).trim();
  }

  function playerCountChoices() {
    const descriptions = {
      2: ["1 Recruiter + 1 Rogue Agent; the Rogue controls all 4 Agents.", "1 Recruiter + 1 Agente Renegado; o Agente controla os 4 Agentes."],
      3: ["1 Recruiter + 2 Rogue Agents; each controls 2 Agents.", "1 Recruiter + 2 Agentes Renegados; cada um controla 2 Agentes."],
      4: ["1 Recruiter + 3 Rogue Agents; each controls 1 Agent and they share the fourth.", "1 Recruiter + 3 Agentes Renegados; cada um controla 1 Agente e dividem o quarto."],
      5: ["1 Recruiter + 4 Rogue Agents; each controls 1 Agent.", "1 Recruiter + 4 Agentes Renegados; cada um controla 1 Agente."]
    };
    return [2, 3, 4, 5].map((players) => ({
      value: String(players),
      titleEn: `${players} players`,
      titlePt: `${players} jogadores`,
      bodyEn: descriptions[players][0],
      bodyPt: descriptions[players][1],
      checked: state.players === players
    }));
  }

  function moduleChoice(module) {
    const selected = moduleSelected(module.id);
    const canUse = module.package <= openedPackages(module.side);
    const noBodyEn = "Do not use this optional SHIFT module. Permanent contents of an opened package still enter the match.";
    const noBodyPt = "Não use este módulo SHIFT opcional. Conteúdos permanentes de um pacote aberto ainda entram na partida.";
    const icon = module.iconBySide?.[state.readingSide] ?? module.icon;
    const iconFiles = [icon, ...(module.extraIcon ? [module.extraIcon] : [])].filter(Boolean);
    const details = moduleDetailsForReader(module);
    const components = moduleComponentsForReader(module);
    const interpretation = moduleInterpretationForReader(module);
    return `
      <fieldset class="mind-module-choice ${selected ? "is-selected" : ""}">
        <legend>
          ${iconFiles.map((file) => `<span class="mind-module-icon"><img src="${ICONS}${file}" alt=""></span>`).join("")}
          <span>${module.side === "recruiter" ? "Recruiter" : t("Rogue Agents", "Agentes Renegados")} ${module.package} · ${moduleNameForReader(module)}</span>
          <small>${t("selected:", "selecionado:")} ${t(selected ? "Yes" : "No", selected ? "Sim" : "Não")}</small>
        </legend>
        <div class="mind-choice-grid">
          <label class="mind-choice-card ${!selected ? "is-selected" : ""}">
            <input type="radio" name="mind-module-${module.id}" data-module="${module.id}" value="no" ${!selected ? "checked" : ""}>
            <span class="mind-choice-copy"><strong>${t("Do not use", "Não usar")}</strong><small>${t(noBodyEn, noBodyPt)}</small></span>
          </label>
          <label class="mind-choice-card ${selected ? "is-selected" : ""} ${!canUse ? "is-disabled" : ""}">
            <input type="radio" name="mind-module-${module.id}" data-module="${module.id}" value="yes" ${selected ? "checked" : ""} ${!canUse ? "disabled" : ""}>
            <span class="mind-choice-copy"><strong>${t("Use opened package", "Usar pacote aberto")}</strong>
              <small>${canUse
                ? `${details[0]} ${t("Components:", "Componentes:")} ${components.join("; ")}${interpretation ? ` ${t("Interpretation:", "Interpretação:")} ${interpretation}` : ""}`
                : t(`Package ${module.package} is not open yet. Modules unlock sequentially when this side loses a full game.`, `O pacote ${module.package} ainda não foi aberto. Os módulos são liberados em sequência quando este lado perde uma partida completa.`)}</small>
            </span>
          </label>
        </div>
        <div class="mind-module-references">${moduleReferences(module)}</div>
      </fieldset>`;
  }

  function extraChoice(extra) {
    const selected = extraSelected(extra.id);
    const packageRequirementMet = !extra.requiresPackage ||
      openedPackages(extra.requiresPackage.side) >= extra.requiresPackage.package;
    const moduleRequirementMet = !extra.requiresModule || moduleSelected(extra.requiresModule);
    const disabled = !packageRequirementMet || !moduleRequirementMet;
    const title = t(extra.name, extra.name);
    return `
      <fieldset class="mind-module-choice mind-extra-choice ${selected ? "is-selected" : ""}">
        <legend><span>${title}</span><small>${t("unlocked · selected:", "desbloqueado · selecionado:")} ${t(selected ? "Yes" : "No", selected ? "Sim" : "Não")}</small></legend>
        <p class="mind-extra-origin">${t("Source location:", "Local de origem:")} ${t(extra.sourceLocation.en, extra.sourceLocation.pt)} · ${t("Components:", "Componentes:")} ${t(extra.components.en.join("; "), extra.components.pt.join("; "))}</p>
        <div class="mind-choice-grid">
          <label class="mind-choice-card ${!selected ? "is-selected" : ""}">
            <input type="radio" name="mind-extra-${extra.id}" data-extra="${extra.id}" value="no" ${!selected ? "checked" : ""}>
            <span class="mind-choice-copy"><strong>${t("Not in this match", "Fora desta partida")}</strong><small>${t("Keep this extra card out of the selected match.", "Não use esta carta extra na partida selecionada.")}</small></span>
          </label>
          <label class="mind-choice-card ${selected ? "is-selected" : ""} ${disabled ? "is-disabled" : ""}">
            <input type="radio" name="mind-extra-${extra.id}" data-extra="${extra.id}" value="yes" ${selected ? "checked" : ""} ${disabled ? "disabled" : ""}>
            <span class="mind-choice-copy"><strong>${t("Include unlocked card", "Incluir carta desbloqueada")}</strong><small>${disabled
              ? t("Requires Rogue Agents package 3 to be opened; select Duncan during setup.", "Requer que o pacote 3 dos Rogue Agents esteja aberto; escolha Duncan durante a preparação.")
              : t(extra.details.en[0], extra.details.pt[0])}</small></span>
          </label>
        </div>
        <div class="mind-module-references">${referenceLink("extra", extra.page)}</div>
      </fieldset>`;
  }

  function moduleOptions() {
    if (state.mode !== "full") {
      return "";
    }
    const openedOptions = (side) => Array.from({ length: 8 }, (_, count) => ({
      value: String(count),
      titleEn: count === 0 ? "None opened" : `Through package ${count}`,
      titlePt: count === 0 ? "Nenhum aberto" : `Até o pacote ${count}`,
      bodyEn: count === 0
        ? "No packages are open; no permanent package contents or optional modules enter the match."
        : `Packages 1–${count} are open: their permanent contents enter the match, and optional modules can be selected below.`,
      bodyPt: count === 0
        ? "Nenhum pacote está aberto; nenhum conteúdo permanente ou módulo opcional entra na partida."
        : `Os pacotes 1–${count} estão abertos: seus conteúdos permanentes entram na partida e os módulos opcionais podem ser selecionados abaixo.`,
      checked: openedPackages(side) === count
    }));
    const openedControls = `
      ${radioGroup("openedRecruiter", "Recruiter packages opened", "Pacotes do Recruiter abertos", `Through ${state.openedRecruiter}`, `Até ${state.openedRecruiter}`, openedOptions("recruiter"))}
      ${radioGroup("openedAgents", "Rogue Agents packages opened", "Pacotes dos Rogue Agents abertos", `Through ${state.openedAgents}`, `Até ${state.openedAgents}`, openedOptions("agents"))}
      ${radioGroup("previousWinner", "Previous full-game winner", "Vencedor da partida completa anterior",
        state.previousWinner === "none" ? "Not selected" : sideName(state.previousWinner),
        state.previousWinner === "none" ? "Não selecionado" : sideName(state.previousWinner),
        [
          { value: "none", titleEn: "No prior result", titlePt: "Sem resultado anterior", bodyEn: "Leave this only when no optional modules are selected; if modules are selected, choose the previous full-game winner to apply campaign limits.", bodyPt: "Mantenha esta opção somente quando nenhum módulo opcional estiver selecionado; se houver módulos, escolha o vencedor da partida completa anterior para aplicar os limites da campanha.", checked: state.previousWinner === "none" },
          { value: "recruiter", titleEn: "Recruiter won", titlePt: "Recruiter venceu", bodyEn: "Rogue Agents select first; Recruiter selection is limited by the number chosen and the win streak.", bodyPt: "Rogue Agents escolhem primeiro; a seleção do Recruiter é limitada pela quantidade escolhida e pela sequência de vitórias.", checked: state.previousWinner === "recruiter" },
          { value: "agents", titleEn: "Rogue Agents won", titlePt: "Rogue Agents venceram", bodyEn: "Recruiter selects first; Rogue Agents selection is limited by the number chosen and the win streak.", bodyPt: "Recruiter escolhe primeiro; a seleção dos Rogue Agents é limitada pela quantidade escolhida e pela sequência de vitórias.", checked: state.previousWinner === "agents" }
        ])}
      ${state.previousWinner !== "none" ? radioGroup("winStreak", "Winning side's consecutive full-game wins", "Vitórias consecutivas do lado vencedor",
        state.winStreak === 1 ? "1 game" : state.winStreak === 2 ? "2 games" : "3 or more",
        state.winStreak === 1 ? "1 partida" : state.winStreak === 2 ? "2 partidas" : "3 ou mais",
        [
          { value: "1", titleEn: "1 win", titlePt: "1 vitória", bodyEn: "The winner may select one fewer module than the losing side.", bodyPt: "O vencedor pode selecionar um módulo a menos que o lado perdedor.", checked: state.winStreak === 1 },
          { value: "2", titleEn: "2 consecutive wins", titlePt: "2 vitórias consecutivas", bodyEn: "The winner may select two fewer modules than the losing side.", bodyPt: "O vencedor pode selecionar dois módulos a menos que o lado perdedor.", checked: state.winStreak === 2 },
          { value: "3", titleEn: "3 or more consecutive wins", titlePt: "3 ou mais vitórias consecutivas", bodyEn: "The winner may select three fewer modules than the losing side.", bodyPt: "O vencedor pode selecionar três módulos a menos que o lado perdedor.", checked: state.winStreak === 3 }
        ]) : ""}`;
    const losing = losingSide();
    const winner = winnerSide();
    const moduleGroupMarkup = (side) => {
      const selectedCount = moduleSelectionCount(side);
      const cards = SHIFT_MODULES.filter((module) => module.side === side && module.package <= openedPackages(module.side));
      if (side !== state.readingSide) {
        return `
          <p class="mind-config-note">${t(`This side has ${selectedCount} module(s) selected. Its titles and rules are hidden in the other reading view; switch the guide reader to ${sideName(side)} to configure them.`, `Este lado tem ${selectedCount} módulo(s) selecionado(s). Títulos e regras ficam escondidos na outra leitura; alterne o guia para ${sideName(side)} para configurá-los.`)}</p>`;
      }
      return cards.map(moduleChoice).join("") || `<p>${t("No packages are open for this side.", "Nenhum pacote deste lado foi aberto.")}</p>`;
    };
    const moduleGroups = state.previousWinner === "none" ? `
      <p class="mind-config-note">${t(
        state.openedRecruiter + state.openedAgents === 0
          ? "No packages are open, so this Full Game uses no SHIFT modules."
          : "Select the previous full-game winner before choosing modules. The losing side chooses first; the winning side's maximum is shown after that selection.",
        state.openedRecruiter + state.openedAgents === 0
          ? "Nenhum pacote foi aberto; esta Partida completa não usa módulos SHIFT."
          : "Selecione o vencedor da partida completa anterior antes de escolher módulos. O lado perdedor escolhe primeiro; o limite do vencedor aparece depois dessa seleção."
      )}</p>`
      : `
        <div class="mind-module-group">
          <h3>${t(`${sideName(losing)} choose first`, `${sideName(losing)} escolhem primeiro`)}</h3>
          ${moduleGroupMarkup(losing)}
        </div>
        <div class="mind-module-group">
          <h3>${t(`${sideName(winner)} choose next · maximum ${winnerModuleLimit()}`, `${sideName(winner)} escolhem em seguida · máximo ${winnerModuleLimit()}`)}</h3>
          <p class="mind-config-note">${t(`This side may choose up to ${winnerModuleLimit()} module(s), based on the number the losing side selected and the winning streak. It may choose fewer, including none.`, `Este lado pode escolher até ${winnerModuleLimit()} módulo(s), conforme a quantidade selecionada pelo lado perdedor e a sequência de vitórias. Pode escolher menos, inclusive nenhum.`)}</p>
          ${moduleGroupMarkup(winner)}
        </div>`;
    return `
      <div class="mind-module-setup">
        <p class="mind-config-note">${t("Packages unlock sequentially: after each full game, the losing side opens its next numbered package. Standard cards and tokens in an opened package are added permanently, even when its optional SHIFT module is not selected. The loser chooses any number of its opened modules first; the winner may choose fewer according to its streak. Selected modules override core rules where their components say so.", "Os pacotes são liberados em sequência: após cada partida completa, o lado perdedor abre o próximo pacote numerado. Cartas e fichas padrão de um pacote aberto entram permanentemente no jogo, mesmo quando seu módulo SHIFT opcional não é escolhido. O perdedor escolhe primeiro qualquer quantidade de módulos abertos; o vencedor pode escolher menos conforme sua sequência. Módulos selecionados substituem regras base quando seus componentes assim indicarem.")}</p>
        ${openedControls}
        ${moduleGroups}
      </div>`;
  }

  function extraOptions() {
    if (state.mode !== "full" || !state.revealExtras) {
      return "";
    }
    return `
      <div class="mind-extra-list">
        <p class="mind-spoiler-note">${t("Spoiler content: only mark cards your group has already unlocked. This selection is stored on this device, not in a shared link.", "Conteúdo com spoilers: marque somente cartas que o grupo já desbloqueou. Esta seleção fica neste dispositivo e não entra em links compartilhados.")}</p>
        <p class="mind-config-note">${t("Switch the reading side to configure that side's unlocked cards. Choices remain local to this device.", "Alterne o lado de leitura para configurar as cartas desbloqueadas daquele lado. As escolhas permanecem neste dispositivo.")}</p>
        ${EXTRA_CARDS.filter((extra) => extra.side === "shared" || extra.side === state.readingSide).map(extraChoice).join("")}
      </div>`;
  }

  function matchConfiguration() {
    const modeTitle = state.mode === "training" ? t("Training Mission", "Missão de Treinamento") : t("Full Game", "Partida completa");
    const issues = configIssues();
    return `
      <section class="controls-panel mind-config" id="build-match" aria-labelledby="mind-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="mind-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t("Choose the rules and player count first. The Recruiter and Rogue Agents are assigned at the table; the reader switch only filters this guide.", "Escolha as regras e o número de jogadores primeiro. Recruiter e Rogue Agents são definidos à mesa; o seletor de leitura apenas filtra este guia.")}</p>
          </div>
          <div class="mind-reading-picker">
            <span>${t("Read the guide as", "Ver o guia como")}</span>
            <div class="team-switch" role="group" aria-label="${t("Choose the role to read", "Escolha o papel para consultar")}">
              <button type="button" data-reading-side="recruiter" aria-pressed="${state.readingSide === "recruiter"}">${t("Recruiter", "Recruiter")}</button>
              <button type="button" data-reading-side="agents" aria-pressed="${state.readingSide === "agents"}">${t("Rogue Agents", "Rogue Agents")}</button>
            </div>
          </div>
        </div>
        ${radioGroup("mode", "Game mode", "Modo de jogo", modeTitle, modeTitle, [
          {
            value: "training", titleEn: "Training Mission · learn the core", titlePt: "Missão de Treinamento · aprenda o básico",
            bodyEn: "Uses 9 Recruit tokens and ends at 14:00; sets aside 1 Recruit and 1 Mind Slip token, Immortals, Allies, Shakedown, Move Immortal, Mayhem and SHIFT packages. Agent abilities are inactive.",
            bodyPt: "Usa 9 fichas Recruit e termina às 14:00; deixa de lado 1 Recruit e 1 Mind Slip, Immortals, Allies, Shakedown, Move Immortal, Mayhem e pacotes SHIFT. Habilidades dos Agentes ficam inativas.",
            checked: state.mode === "training"
          },
          {
            value: "full", titleEn: "Full Game · complete rules", titlePt: "Partida completa · regras completas",
            bodyEn: "Uses 12 Recruit tokens and ends at 16:00; includes 4 Immortals, the Recruiter's MOVE IMMORTAL action, Rogue Agents' SHAKEDOWN, Agent abilities and Allies. Opened packages and unlocked extras can be configured below.",
            bodyPt: "Usa 12 fichas Recruit e termina às 16:00; inclui 4 Immortals, a ação MOVE IMMORTAL do Recruiter, SHAKEDOWN dos Rogue Agents, habilidades dos Agentes e Allies. Configure abaixo pacotes abertos e extras desbloqueados.",
            checked: state.mode === "full"
          }
        ])}
        ${radioGroup("players", "Players", "Jogadores", `${state.players} players`, `${state.players} jogadores`, playerCountChoices())}
        ${radioGroup("startVisibility", "Starting location", "Localização inicial", state.startVisibility === "hidden" ? "Hidden" : "Revealed", state.startVisibility === "hidden" ? "Escondida" : "Revelada", [
          {
            value: "public", titleEn: "Reveal the starting location", titlePt: "Revele a localização inicial",
            bodyEn: "The Recruiter marks the start with a Confirmed Mental Note showing 1. This is the standard setup.",
            bodyPt: "O Recruiter marca o início com uma Mental Note Confirmed mostrando 1. Esta é a preparação padrão.",
            checked: state.startVisibility === "public"
          },
          {
            value: "hidden", titleEn: "Keep the starting location hidden", titlePt: "Mantenha a localização inicial escondida",
            bodyEn: "The Recruiter still writes 1 on the Secret Map but does not reveal it to the Rogue Agents.",
            bodyPt: "O Recruiter ainda escreve 1 no Secret Map, mas não revela a localização aos Rogue Agents.",
            checked: state.startVisibility === "hidden"
          }
        ])}
        ${state.mode === "full" ? `
          ${moduleOptions()}
          ${radioGroup("revealExtras", "Hidden envelope cards", "Cartas de envelopes escondidos", state.revealExtras ? "List unlocked cards" : "Keep hidden", state.revealExtras ? "Listar cartas desbloqueadas" : "Manter escondidas", [
            { value: "no", titleEn: "Do not reveal the extra-card list", titlePt: "Não revelar a lista de cartas extras", bodyEn: "Keep unlocked-envelope titles and effects out of the common guide view.", bodyPt: "Mantenha títulos e efeitos de envelopes fora da consulta comum.", checked: !state.revealExtras },
            { value: "yes", titleEn: "Configure already-unlocked cards", titlePt: "Configurar cartas já desbloqueadas", bodyEn: "Opens the spoiler list below. Only include a card if your group has physically unlocked it.", bodyPt: "Abre abaixo a lista com spoilers. Inclua uma carta somente se o grupo a desbloqueou fisicamente.", checked: state.revealExtras }
          ])}
          ${extraOptions()}` : ""}
        ${issues.length ? `<div class="mind-config-error" role="alert"><strong>${t("This match is not ready for Setup.", "Esta partida ainda não está pronta para a Preparação.")}</strong>${lineList(issues.map((issue) => `<span>${issue}</span>`))}</div>` : ""}
      </section>`;
  }

  function sectionNav() {
    const links = [
      ["quick-reference", t("Quick Reference", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["victory", t("Victory", "Vitória")],
      ["turn", t("Turns & actions", "Turnos e ações")],
      ["board", t("Board & tokens", "Tabuleiro e fichas")],
      ["modules", t("Selected content", "Conteúdo selecionado")],
      ["examples", t("Examples", "Exemplos")],
      ["glossary", t("Glossary", "Glossário")]
    ];
    return links.map(([id, label], index) => `
      <button type="button" data-scroll="${id}"><span class="toc-index">${String(index + 1).padStart(2, "0")}</span>${label}</button>`).join("");
  }

  function readingSideLine() {
    return `<p class="mind-reading-side">${t("Reading as:", "Lado em consulta:")} <strong>${sideName()}</strong></p>`;
  }

  function quickReference() {
    const recruiterTarget = state.mode === "training" ? 9 : moduleSelected("agents-2") ? 13 : 12;
    const timeTargetEn = state.mode === "training"
      ? "14:00"
      : extraSelected("evades")
        ? "16:00 (or 14:00 after activating Evades before round 9)"
        : "16:00";
    const timeTargetPt = state.mode === "training"
      ? "14:00"
      : extraSelected("evades")
        ? "16:00 (ou 14:00 após ativar Evades antes da rodada 9)"
        : "16:00";
    const recruiterLines = [
      ruleLine("Order", "Recruiter acts first each round, then the Rogue Agents; each side gets two turns and the round ends after all 4 Agents activate.", "Ordem", "O Recruiter age primeiro em cada rodada, depois os Rogue Agents; cada lado faz dois turnos e a rodada termina após a ativação dos 4 Agentes."),
      ruleLine("Recruiter turn", state.mode === "full"
        ? "Take 1 action and move 1 Immortal before or after it; after the action and Immortal moves, draw Feature cards until 2 remain, if possible, then advance Time."
        : "Take 1 action, then advance Time.",
      "Turno do Recruiter", state.mode === "full"
        ? "Faça 1 ação e mova 1 Immortal antes ou depois; após a ação e os movimentos, compre Features até restarem 2, se possível, e avance o Tempo."
        : "Faça 1 ação e depois avance o Tempo."),
      ruleLine("STEP", extraSelected("corners")
        ? "Move to 1 orthogonally adjacent unvisited location, or diagonally into or out of a Temple or any board corner. You may enter an Agent's location without revealing it; never revisit a location or move through Mayhem."
        : "Move to 1 orthogonally adjacent unvisited location, or diagonally into or out of a Temple. You may enter an Agent's location without revealing it; never revisit a location or move through Mayhem.",
      "STEP", extraSelected("corners")
        ? "Mova para 1 localização adjacente ortogonalmente ainda não visitada, ou na diagonal entrando ou saindo de um Temple ou de qualquer canto do tabuleiro. Pode entrar na localização de um Agente sem revelar; nunca revisite nem atravesse Mayhem."
        : "Mova para 1 localização adjacente ortogonalmente ainda não visitada, ou na diagonal entrando ou saindo de um Temple. Pode entrar na localização de um Agente sem revelar; nunca revisite nem atravesse Mayhem."),
      ruleLine("MIND SLIP", "Use the full straight-line move printed on the selected Recruiter card. You may pass through visited spaces and Mayhem, but skipped locations do not contact Recruits.", "MIND SLIP", "Use todo o movimento em linha reta impresso na carta Recruiter escolhida. Pode atravessar espaços visitados e Mayhem, mas localizações puladas não contatam Recruits."),
      ruleLine("Recruit", "A visited location contacts 1 Recruit per circled Feature matching one of the 3 secret Recruiter Feature cards. Reveal the round total only at a red Alert.", "Recruit", "Uma localização visitada contata 1 Recruit por Feature circulada que corresponda a uma das 3 cartas Feature secretas do Recruiter. Revele o total da rodada somente em um Alerta vermelho."),
      ruleLine("Respond to ASK", "Check the Secret Map. If any visited matching location lacks a Step or green Confirmed note, place one Step on one such location; a white Unconfirmed note does not block placement.", "Responder a ASK", "Consulte o Secret Map. Se alguma localização visitada correspondente não tiver Step nem nota Confirmed verde, coloque uma ficha Step em uma delas; uma nota Unconfirmed branca não impede a colocação."),
      ruleLine("No eligible ASK location", "If there is no visited match, or every match already has a Step or green Confirmed note, say you cannot place a new Step. Do not reveal which case applies.", "Sem localização elegível para ASK", "Se não houver localização visitada correspondente, ou se todas já tiverem Step ou nota Confirmed verde, diga que não pode colocar uma nova ficha Step. Não revele qual caso se aplica."),
      ruleLine("Step supply exhausted", "If all 8 Step tokens are on the board but an eligible unmarked visited match remains, the manuals give no fallback. This guide marks it as a source limitation; do not report that no match exists.", "Suprimento de Step esgotado", "Se as 8 fichas Step estiverem no tabuleiro, mas ainda houver uma localização visitada elegível sem marca, os manuais não dão alternativa. Este guia marca isso como limitação da fonte; não diga que não há localização correspondente."),
      ...(state.mode === "full" ? [
        ruleLine("Shakedown response", "If a Feature guess is correct, reveal that card and cross out matching circled Features on locations you have not visited. After any Shakedown, whether the guess was right or wrong, Rogue Agents may push the target Immortal if a legal push exists.", "Resposta a Shakedown", "Se acertar uma Feature, revele a carta e risque Features circuladas correspondentes nas localizações que ainda não visitou. Depois de qualquer Shakedown, acertando ou não, Rogue Agents podem empurrar o Immortal alvo se houver um destino legal.")
      ] : []),
      ...(state.mode === "full" ? [
        ruleLine("Extra Immortal move", "After the first Immortal move, you may place a Step token on a visited location without a Step or Confirmed note, then move a second Immortal. Once per turn.", "Movimento extra de Immortal", "Depois do primeiro movimento de Immortal, pode colocar Step em localização visitada sem Step nem nota Confirmed e mover outro Immortal. Uma vez por turno."),
        ruleLine("Immortal recruit", moduleSelected("recruiter-5")
          ? "Two different locations must each hold an Immortal or Right-Hand Man, and both must match the same Immortal Recruiting Feature. Reveal 1 Recruit immediately; this can win."
          : "Two Immortals must occupy different locations whose Feature matches an Immortal Recruiting card. Reveal 1 Recruit immediately; this can win immediately.",
        "Recruit de Immortal", moduleSelected("recruiter-5")
          ? "Duas localizações diferentes devem ter, cada uma, um Immortal ou Right-Hand Man; ambos devem corresponder à mesma Feature de Immortal Recruiting. Revele 1 Recruit imediatamente; isso pode vencer."
          : "Dois Immortals devem ocupar localizações diferentes com Feature correspondente a uma carta Immortal Recruiting. Revele 1 Recruit imediatamente; isso pode encerrar a partida na hora.")
      ] : []),
      ruleLine("Win", `Contact ${recruiterTarget} Recruits or survive until ${timeTargetEn}.`, "Vitória", `Contate ${recruiterTarget} Recruits ou sobreviva até ${timeTargetPt}.`)
    ];
    const agentLines = [
      ruleLine("Activate", "On each Rogue Agents turn, activate any 2 Agents that have not acted this round; each Agent may move and take 1 action.", "Ativação", "Em cada turno dos Rogue Agents, ative 2 Agentes que ainda não agiram nesta rodada; cada Agente pode mover e fazer 1 ação."),
      ruleLine("Move", "Move up to 2 orthogonal spaces and change direction if desired. Diagonal movement is allowed only into or out of a Temple. Mayhem blocks orthogonal crossing.", "Mover", "Mova até 2 espaços ortogonais e mude de direção se quiser. Movimento diagonal só é permitido entrando ou saindo de um Temple. Mayhem bloqueia travessias ortogonais."),
      ruleLine("Actions", state.mode === "training"
        ? "ASK, REVEAL, or CAPTURE."
        : openedPackages("agents") >= 3
          ? `ASK, REVEAL, SHAKEDOWN, or CAPTURE. An Agent at an Immortal cannot ASK or CAPTURE; only selected Duncan may REVEAL a token there${moduleSelected("recruiter-2") ? " after Dreamwalker is found" : ""}.`
          : "ASK, REVEAL, SHAKEDOWN, or CAPTURE. An Agent at an Immortal cannot ASK, REVEAL, or CAPTURE.",
      "Ações", state.mode === "training"
        ? "ASK, REVEAL ou CAPTURE."
        : openedPackages("agents") >= 3
          ? `ASK, REVEAL, SHAKEDOWN ou CAPTURE. Um Agente na localização de Immortal não pode usar ASK ou CAPTURE; somente Duncan, se escolhido, pode fazer REVEAL de ficha ali${moduleSelected("recruiter-2") ? " depois de encontrar Dreamwalker" : ""}.`
          : "ASK, REVEAL, SHAKEDOWN ou CAPTURE. Um Agente na localização de um Immortal não pode usar ASK, REVEAL ou CAPTURE."),
      ruleLine("ASK", "Ask about 1 Feature in your location. If the Recruiter has visited a matching location, they place 1 Step token if possible; a Temple is not a Feature.", "ASK", "Pergunte sobre 1 Feature da sua localização. Se o Recruiter visitou uma localização correspondente, coloca 1 ficha Step se possível; Temple não é Feature."),
      ruleLine("REVEAL", moduleSelected("recruiter-2")
        ? "Until the Dreamwalker is found, Reveal is unavailable. Otherwise, at a location with a Step token, discard it to learn the exact Time and replace it with a Confirmed Mental Note."
        : "At a location with a Step token, discard it to learn the exact Time and replace it with a Confirmed Mental Note.",
      "REVEAL", moduleSelected("recruiter-2")
        ? "Até encontrar Dreamwalker, Reveal não pode ser usado. Depois, numa localização com Step, descarte-a para descobrir o horário exato e substitua-a por uma Mental Note Confirmed."
        : "Em uma localização com ficha Step, descarte-a para descobrir o horário exato e substitua-a por uma Mental Note Confirmed."),
      ...(state.mode === "full" ? [
          ruleLine("SHAKEDOWN", "Use when your Agent is at an Immortal, at activation start or after completing a move; never during a move.", "SHAKEDOWN", "Use quando seu Agente estiver junto a um Immortal, no início da ativação ou depois de concluir o movimento; nunca durante o movimento."),
        ruleLine("Feature guess", "Name any board Feature except Temple. If it matches one of the Recruiter's 3 secret cards, the Recruiter reveals it; cross out matching Features on locations they have not visited.", "Adivinhar Feature", "Diga qualquer Feature do tabuleiro, exceto Temple. Se corresponder a uma das 3 cartas secretas do Recruiter, ele a revela; risque Features correspondentes em localizações que ainda não visitou."),
        ...(extraSelected("on-temples") ? [
          ruleLine("On Temples", "Instead of a Feature guess, ask how many Temple locations the Recruiter has visited; they answer 0, 1, or 2.", "On Temples", "Em vez de adivinhar uma Feature, pergunte quantas localizações Temple o Recruiter visitou; ele responde 0, 1 ou 2.")
        ] : []),
        ruleLine("Shakedown push", "If the target is an Immortal, you may push it 1 space to any orthogonally adjacent legal location after the question, regardless of the guess or answer. Do not push through Mayhem or into another Immortal; if none is legal, you cannot push. For Right-Hand Man, follow his module card.", "Empurrão de Shakedown", "Se o alvo for um Immortal, você pode, depois da pergunta, empurrá-lo 1 espaço para qualquer localização adjacente ortogonal legal, independentemente da adivinhação ou resposta. Não passe por Mayhem nem empurre para outro Immortal; se não houver destino legal, não pode empurrar. Para Right-Hand Man, siga a carta do módulo."),
        ...(extraSelected("futurist") ? [
          ruleLine("Futurist", "After Duncan's first wrong Feature guess in a Shakedown, he may make 1 additional Feature guess.", "Futurist", "Depois da primeira tentativa errada de adivinhar Feature de Duncan em um Shakedown, ele pode fazer mais 1 tentativa.")
        ] : []),
        ...(moduleSelected("recruiter-5") ? [
          ruleLine("Right-Hand Man", "The Catch Right-Hand Man card gives the special target procedure; a successful Shakedown removes him from the game.", "Right-Hand Man", "A carta Catch Right-Hand Man explica o alvo especial; um Shakedown bem-sucedido o remove da partida.")
        ] : [])
      ] : []),
      ruleLine("CAPTURE", openedPackages("recruiter") >= 1
        ? "Name your location and one of the Recruiter's 3 starting Feature cards. HIT requires both to be correct; otherwise the Recruiter says only MISS."
        : "Declare CAPTURE at your location. The Recruiter says HIT only if they are currently there; otherwise they say MISS.",
      "CAPTURE", openedPackages("recruiter") >= 1
        ? "Diga sua localização e uma das 3 cartas Feature iniciais do Recruiter. HIT exige os dois acertos; caso contrário, o Recruiter diz somente MISS."
        : "Declare CAPTURE na sua localização. O Recruiter diz HIT somente se estiver ali; caso contrário, diz MISS."),
      ...(moduleSelected("agents-4") ? [
        ruleLine("Lucky Umbrella", "After the Original Immortal collects both Umbrellas, use Lucky Umbrella once per game to attempt Capture at your location or one of its 4 orthogonally adjacent locations.", "Lucky Umbrella", "Depois que Original Immortal coletar os dois Umbrellas, use Lucky Umbrella uma vez por partida para tentar Capture na sua localização ou em uma das 4 adjacentes ortogonalmente.")
      ] : []),
      ...(openedPackages("recruiter") >= 1 ? [
        ruleLine("New Capture", "A previously exposed starting Feature may also be named; on a miss, the Recruiter does not identify which part was wrong.", "New Capture", "Uma Feature inicial já revelada também pode ser nomeada; em um MISS, o Recruiter não diz qual parte estava errada.")
      ] : [])
    ];
    const cards = state.readingSide === "recruiter"
      ? [
        infoCard("RECRUITER", "Your turn at a glance", recruiterLines, [["core", 6], ["core", 12]], "RECRUITER", "Seu turno em resumo"),
        infoCard("SHARED", "Time and Alerts", [
          ruleLine("Advance", "At each Recruiter turn end, move the Time token one space. White even-numbered spaces end the turn without an Alert.", "Avançar", "No fim de cada turno do Recruiter, avance o marcador de Tempo um espaço. Casas pares brancas encerram o turno sem Alerta."),
          ruleLine("Alert", "At a red Alert, report only the number of Recruits contacted across both Recruiter turns this round. Do not identify which location or turn earned them.", "Alerta", "Em um Alerta vermelho, informe somente quantos Recruits foram contatados nos dois turnos do Recruiter nesta rodada. Não identifique localizações nem turnos."),
          ruleLine("Last space", "The Rogue Agents do not take a turn after Time reaches the final space.", "Última casa", "Os Rogue Agents não fazem turno depois que o Tempo chega à última casa.")
        ], [["core", 6], ["core", 10]], "COMPARTILHADO", "Tempo e Alertas")
      ]
      : [
        infoCard("ROGUE AGENTS", "Your turn at a glance", agentLines, [["core", 11], ["core", 12], ["core", 14]], "ROGUE AGENTS", "Seu turno em resumo"),
        infoCard("SHARED", "What the Recruiter reveals", [
          ruleLine("Recruiter win", `The Recruiter wins with ${recruiterTarget} Recruits or by reaching the final Time space (${state.mode === "training" ? "14:00" : "16:00"}); an in-play card may change the Time Track.`, "Vitória do Recruiter", `O Recruiter vence com ${recruiterTarget} Recruits ou ao chegar à última casa do Tempo (${state.mode === "training" ? "14:00" : "16:00"}); uma carta em jogo pode alterar a Trilha do Tempo.`),
          ruleLine("Mental Notes", "White notes are unconfirmed and may be changed by Rogue Agents. Green Confirmed notes are placed by the Recruiter and cannot be changed or removed.", "Mental Notes", "Notas brancas são suspeitas e podem ser alteradas pelos Rogue Agents. Notas verdes Confirmed são colocadas pelo Recruiter e não podem ser alteradas nem removidas."),
          ruleLine("No Step on ASK", "If the Recruiter cannot place a Step while tokens remain in the supply, infer that no unmarked visited location matches that Feature. If all 8 tokens are already on the board, the manuals give no fallback; do not make that inference.", "Sem Step em ASK", "Se o Recruiter não puder colocar Step enquanto houver fichas no suprimento, conclua que nenhuma localização visitada sem marca corresponde à Feature. Se as 8 fichas já estiverem no tabuleiro, os manuais não dão alternativa; não faça essa dedução."),
          ruleLine("Limit", "You may use only the 15 Mental Note tokens to record information; do not keep other notes.", "Limite", "Use somente as 15 fichas Mental Note para registrar informações; não faça outras anotações.")
        ], [["core", 13]], "COMPARTILHADO", "O que o Recruiter revela")
      ];
    const selectedModuleCards = modulesForReader()
      .map((module) => infoCard(
        module.side === "recruiter" ? "RECRUITER MODULE" : "ROGUE AGENT MODULE",
        moduleNameForReader(module),
        [
          ...moduleDetailsForReader(module).map((line) => `<strong>${t("Rule", "Regra")}:</strong> ${line}`),
          ...(moduleInterpretationForReader(module)
            ? [`<strong>${t("Interpretation", "Interpretação")}:</strong> ${moduleInterpretationForReader(module)}`]
            : [])
        ],
        moduleSourcePairs(module),
        state.readingSide === "recruiter" ? "MÓDULO RECRUITER" : "MÓDULO ROGUE AGENTS",
        moduleNameForReader(module)
      ));
    const openedContentCards = openedContentForReader()
      .map((content) => infoCard(
        content.packageSide === "recruiter" ? "RECRUITER PACKAGE" : "ROGUE AGENTS PACKAGE",
        openedContentNameForReader(content),
        [
          ...openedContentLines(content, "detailsBySide").map((line) => `<strong>${t("Rule", "Regra")}:</strong> ${line}`),
          ...(openedContentInterpretationForReader(content)
            ? [`<strong>${t("Interpretation", "Interpretação")}:</strong> ${openedContentInterpretationForReader(content)}`]
            : [])
        ],
        openedContentSources(content),
        content.packageSide === "recruiter" ? "PACOTE RECRUITER" : "PACOTE ROGUE AGENTS",
        openedContentNameForReader(content)
      ));
    const selectedExtraCards = selectedExtras(state.readingSide).map((extra) => infoCard(
      "UNLOCKED EXTRA",
      extra.name,
      extra.details[state.language === "pt-BR" ? "pt" : "en"].map((line) => `<strong>${t("Effect", "Efeito")}:</strong> ${line}`),
      [["extra", extra.page]],
      "EXTRA DESBLOQUEADO",
      extra.name
    ));
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), "01", [["core", 6], ["core", 15]])}
      ${readingSideLine()}
      <div class="callout">${t(
        "Round order: Recruiter first turn → Rogue Agents activate 2 Agents → Recruiter second turn → Rogue Agents activate the remaining 2 Agents → stand all Agents for the next round.",
        "Ordem da rodada: primeiro turno do Recruiter → Rogue Agents ativam 2 Agentes → segundo turno do Recruiter → Rogue Agents ativam os outros 2 Agentes → levante todos os Agentes para a próxima rodada."
      )} ${referenceLink("core", 6)}</div>
      <div class="quick-grid">${cards.join("")}${selectedModuleCards.join("")}${openedContentCards.join("")}${selectedExtraCards.join("")}</div>`;
  }

  function selectedComponentItems() {
    const items = [];
    for (const module of modulesForReader()) {
      for (const [index, component] of moduleComponentsForReader(module).entries()) {
        items.push({
          name: component,
          origin: moduleSourcePairs(module),
          recipient: moduleComponentRecipient(module),
          key: `${module.id}-${index}`,
          kind: "module"
        });
      }
    }
    for (const content of openedContentForReader()) {
      for (const [index, component] of openedContentLines(content, "componentsBySide").entries()) {
        items.push({
          name: component,
          origin: openedContentSources(content),
          recipient: openedContentRecipient(content),
          key: `${content.id}-${index}`,
          kind: "opened"
        });
      }
    }
    for (const extra of selectedExtras(state.readingSide)) {
      for (const [index, component] of extra.components[state.language === "pt-BR" ? "pt" : "en"].entries()) {
        items.push({
          name: component,
          origin: [["extra", extra.page]],
          recipient: extra.side === "shared" ? t("Shared", "Compartilhado") : sideName(extra.side),
          key: `${extra.id}-${index}`,
          kind: "extra"
        });
      }
    }
    return items;
  }

  function componentInventory() {
    const training = state.mode === "training";
    const packagesOpened = state.openedRecruiter + state.openedAgents;
    const shiftPackageDescription = training
      ? t("Not used in this match.", "Não usados nesta partida.")
      : packagesOpened === 0
        ? t("No SHIFT packages are open; no package contents are added.", "Nenhum pacote SHIFT está aberto; nenhum conteúdo de pacote foi acrescentado.")
        : t(
          `${state.openedRecruiter} Recruiter and ${state.openedAgents} Rogue Agents packages opened; permanent contents are included, and selected optional modules are listed below.`,
          `${state.openedRecruiter} pacotes Recruiter e ${state.openedAgents} pacotes Rogue Agents abertos; conteúdos permanentes estão incluídos e os módulos opcionais selecionados aparecem abaixo.`
        );
    const components = [
      [t("1 double-sided city board and 1 Setup Reminder card", "1 tabuleiro dupla face da cidade e 1 carta Setup Reminder"), t("Center of the table", "Centro da mesa"), 3],
      [t("1 Mental Screen, 1 Secret Map, and 2 dry-erase markers", "1 Mental Screen, 1 Secret Map e 2 marcadores apagáveis"), t("Screen and map to Recruiter; 1 marker to each side", "Tela e mapa para o Recruiter; 1 marcador para cada lado"), 3],
      [t("4 base Agent cards and 4 Agent figures", "4 cartas Agent base e 4 figuras Agent"), t("Rogue Agents; choose 4 cards and figures start on board edges", "Rogue Agents; escolhem 4 cartas e as figuras começam nas bordas"), 3],
      [t("16 Feature cards", "16 cartas Feature"), t("Recruiter: 3 secret cards; remaining deck for Immortal Recruiting in Full Game", "Recruiter: 3 cartas secretas; baralho restante para Immortal Recruiting na Partida completa"), 3],
      [t("2 base Recruiter cards and 2 base Potential Recruiter cards", "2 cartas Recruiter base e 2 cartas Potential Recruiter base"), t("Base choices; opened-package additions are listed separately below.", "Opções base; cartas adicionadas por pacotes abertos aparecem separadamente abaixo."), 3],
      [t("5 Rogue Agent action cards and 2 Recruiter action cards", "5 cartas de ação Rogue Agent e 2 cartas de ação Recruiter"), t(training ? "Use Move, Ask, Reveal, Capture and Step; set Shakedown and Move Immortal aside." : "Rogue Agents use Move, Ask, Reveal, Shakedown and Capture; the Recruiter uses STEP and MOVE IMMORTAL.", training ? "Use Move, Ask, Reveal, Capture e Step; deixe Shakedown e Move Immortal de lado." : "Rogue Agents usam Move, Ask, Reveal, Shakedown e Capture; o Recruiter usa STEP e MOVE IMMORTAL."), 3],
      [t("15 Mental Note tokens, 8 Step tokens, 2 Mind Slip tokens, and 1 Time token", "15 fichas Mental Note, 8 fichas Step, 2 fichas Mind Slip e 1 ficha Time"), t("Mental Notes and shared tokens by the board; Mind Slip to their owners", "Mental Notes e fichas compartilhadas junto ao tabuleiro; Mind Slip com seus donos"), 3],
      [t("12 Recruit tokens", "12 fichas Recruit"), t(training ? "9 in the Training supply; 2 cover 15:00 and 16:00, and 1 remains unused as shown by the Training setup." : "All 12 in the Full Game supply.", training ? "9 no suprimento do Treinamento; 2 cobrem 15:00 e 16:00 e 1 fica sem uso conforme a preparação do Treinamento." : "As 12 no suprimento da Partida completa."), 3],
      [t("5 Mayhem tokens", "5 fichas Mayhem"), t(training ? "Not used in the Training Mission." : "Recruiter places them before choosing the starting location.", training ? "Não são usadas na Missão de Treinamento." : "Recruiter as coloca antes de escolher a localização inicial."), 3],
      [t("4 Immortal figures and 1 Ally card (Black Ops Dolphin)", "4 figuras Immortal e 1 carta Ally (Black Ops Dolphin)"), t(training ? "Set aside for Training." : "Recruiter controls the Immortals; Rogue Agents place the Ally face-up.", training ? "Deixe de lado no Treinamento." : "Recruiter controla os Immortals; Rogue Agents deixam a Ally visível."), 3],
      [t("14 SHIFT packages", "14 pacotes SHIFT"), shiftPackageDescription, 3]
    ];
    const visibleBase = components.filter((_, index) => !(training && index === 10));
    const extraItems = selectedComponentItems();
    return `
      <div class="mind-inventory-grid">
        ${visibleBase.map(([name, recipient, page], index) => `
          <article class="mind-inventory-item">
            <span class="component-label">${training && [8, 9].includes(index) ? t("NOT USED", "NÃO USADO") : t("BASE GAME", "JOGO BASE")}</span>
            <strong>${name}</strong><p>${t("Recipient / use:", "Destinatário / uso:")} ${recipient}</p>${referenceLink("core", page)}
          </article>`).join("")}
        ${extraItems.map((item) => `
          <article class="mind-inventory-item">
            <span class="component-label">${item.kind === "opened"
              ? t("OPENED-PACKAGE CONTENT", "CONTEÚDO DE PACOTE ABERTO")
              : item.kind === "extra"
                ? t("UNLOCKED EXTRA", "EXTRA DESBLOQUEADO")
                : t("SELECTED MODULE", "MÓDULO SELECIONADO")}</span>
            <strong>${item.name}</strong><p>${t("Recipient:", "Destinatário:")} ${item.recipient}</p>${item.origin.map(([book, page]) => referenceLink(book, page)).join(" ")}
          </article>`).join("")}
      </div>
      ${training ? `<p class="mind-config-note">${t("Training also sets aside the Move Immortal and Shakedown cards, 4 Immortals, the Ally, 5 Mayhem tokens, 1 Mind Slip token, 1 Recruit token, and all SHIFT packages.", "O Treinamento também deixa de lado Move Immortal e Shakedown, 4 Immortals, a Ally, 5 fichas Mayhem, 1 Mind Slip, 1 Recruit e todos os pacotes SHIFT.")}</p>` : ""}`;
  }

  function setupPhases() {
    const recruiterCardCount = 2 + (openedPackages("recruiter") >= 1 ? 1 : 0) + (openedPackages("recruiter") >= 7 ? 1 : 0);
    const expandedAgentRoster = openedPackages("agents") >= 3;
    const startStepNumber = state.mode === "training" ? 5 : expandedAgentRoster ? 7 : 6;
    const agentSelectionEn = expandedAgentRoster
      ? extraSelected("futurist")
        ? "Share 1 dry-erase marker. Choose 4 of the 5 Agent cards and include Duncan because Futurist requires him."
        : "Share 1 dry-erase marker. Choose any 4 of the 5 Agent cards; Duncan is optional."
      : "Share 1 dry-erase marker.";
    const agentSelectionPt = expandedAgentRoster
      ? extraSelected("futurist")
        ? "Compartilhe 1 marcador apagável. Escolha 4 das 5 cartas Agent e inclua Duncan, pois Futurist exige que ele esteja na partida."
        : "Compartilhe 1 marcador apagável. Escolha quaisquer 4 das 5 cartas Agent; Duncan é opcional."
      : "Compartilhe 1 marcador apagável.";
    const phases = [
      {
        id: "shared", side: "shared",
        title: t("1 · Prepare the board and shared supplies", "1 · Prepare o tabuleiro e os suprimentos compartilhados"),
        sources: [["core", 4], ["core", 5]],
        items: [
          t("Choose one player as Recruiter and the remaining players as Rogue Agents. Orient the board with each side facing its team.", "Escolha uma pessoa como Recruiter e as demais como Rogue Agents. Oriente o tabuleiro com o lado de cada equipe voltado para ela."),
          ...(state.mode === "full" ? [t("The Recruiter places the first of 5 Mayhem tokens between locations; then each player clockwise places one until all are placed. No two may touch, including in an L shape.", "O Recruiter coloca a primeira das 5 fichas Mayhem entre localizações; depois, cada jogador em sentido horário coloca uma até todas serem posicionadas. Nenhuma pode tocar outra, inclusive em L.")] : []),
          t("Place the Time token beside 01:00–05:00. Put Mental Notes, Step, Recruit and mode-appropriate Mind Slip tokens in their supplies.", "Coloque a ficha Time ao lado de 01:00–05:00. Ponha Mental Notes, Step, Recruit e as fichas Mind Slip correspondentes ao modo nos suprimentos."),
          t(state.mode === "training"
            ? "Place Move, Ask, Reveal, Capture and Step under the board labels; set Shakedown and Move Immortal aside."
            : "Place all Agent and Recruiter action cards under their matching board labels.",
          state.mode === "training"
            ? "Coloque Move, Ask, Reveal, Capture e Step sob os rótulos do tabuleiro; deixe Shakedown e Move Immortal de lado."
            : "Coloque todas as cartas de ação Agent e Recruiter sob os rótulos correspondentes no tabuleiro."),
          ...(state.mode === "training"
            ? [t("Cover the 15:00 and 16:00 Time Track spaces with 2 Recruit tokens; set 1 Recruit and 1 Mind Slip token aside. Keep 9 Recruits in the Training supply and use the 14:00 target.", "Cubra os espaços 15:00 e 16:00 da Trilha do Tempo com 2 fichas Recruit; deixe 1 Recruit e 1 Mind Slip de lado. Mantenha 9 Recruits no suprimento de Treinamento e use a meta 14:00.")]
            : [moduleSelected("agents-2")
              ? t("Use the Mind Web target of 13 Recruits for this match (instead of 12) and the final 16:00 Time Track space.", "Use a meta de 13 Recruits do Mind Web nesta partida (em vez de 12) e a última casa 16:00 da Trilha do Tempo.")
              : t("Use the Full Game target of 12 Recruits and the final 16:00 Time Track space.", "Use a meta de 12 Recruits e a última casa 16:00 da Partida completa.")]),
          ...selectedExtrasForOwner("shared").map((extra) => `${extra.name}: ${EXTRA_SETUP[extra.id][state.language === "pt-BR" ? "pt" : "en"]} ${referenceLink("extra", extra.page)}`)
        ]
      },
      {
        id: "recruiter", side: "recruiter",
        title: t("2 · Recruiter setup · private information", "2 · Preparação do Recruiter · informação privada"),
        sources: [["core", 4]],
        items: [
          t("Take the Secret Map, Mental Screen, and a dry-erase marker. Orient the map to match the board and keep it hidden from Rogue Agents for the entire game.", "Pegue o Secret Map, a Mental Screen e um marcador apagável. Oriente o mapa como o tabuleiro e mantenha-o escondido dos Rogue Agents durante toda a partida."),
          ...(state.mode === "full" ? [t("Copy all Mayhem locations to the Secret Map before choosing the start; the Recruiter may not cross Mayhem on the first four setup STEPs.", "Copie todas as localizações Mayhem no Secret Map antes de escolher o início; o Recruiter não pode atravessar Mayhem nos quatro STEPs iniciais.")] : []),
          t("Keep the Recruiter's first Mind Slip token visible to the Rogue Agents.", "Mantenha a primeira ficha Mind Slip do Recruiter visível aos Rogue Agents."),
          ...openedContentForReader().filter((content) => content.packageSide === "recruiter").flatMap((content) => openedContentSetup(content, "recruiter").map((line) => `${openedContentNameForReader(content)}: ${line} ${openedContentSources(content).map(([book, page]) => referenceLink(book, page)).join(" ")}`)),
          t(`After adding all available cards from opened Recruiter packages above, secretly choose or randomly draw 1 of the ${recruiterCardCount} Recruiter cards; return all unchosen cards without showing them.`, `Depois de acrescentar as cartas disponíveis dos pacotes Recruiter abertos acima, escolha em segredo ou compre aleatoriamente 1 das ${recruiterCardCount} cartas Recruiter; devolva todas as não escolhidas sem mostrá-las.`),
          t("Choose any location on the Secret Map (not on the game board) and write 1; the manual recommends avoiding the outer edge. Follow the selected option: reveal it with a Confirmed Mental Note, or keep it hidden.", "Escolha qualquer localização no Secret Map (não no tabuleiro) e escreva 1; o manual recomenda evitar a borda externa. Siga a opção selecionada: revele-a com uma Mental Note Confirmed ou mantenha-a escondida."),
          t("Shuffle the 16 Feature cards and secretly draw 3 behind the screen. Circle on the Secret Map every location Feature matching any of those 3 cards.", "Embaralhe as 16 cartas Feature e compre 3 em segredo atrás da tela. Circule no Secret Map cada Feature de localização que corresponda a uma dessas 3 cartas."),
          ...selectedModules("recruiter").flatMap((module) => moduleSetupForSide(module, "recruiter").map((line) => `${moduleNameForReader(module)}: ${line} ${moduleReferences(module)}`)),
          ...selectedModules("agents").filter((module) => module.setupBySide?.recruiter).flatMap((module) => moduleSetupForSide(module, "recruiter").map((line) => `${moduleNameForReader(module)}: ${line} ${moduleReferences(module)}`)),
          ...selectedExtrasForOwner("recruiter").map((extra) => `${extra.name}: ${EXTRA_SETUP[extra.id][state.language === "pt-BR" ? "pt" : "en"]} ${referenceLink("extra", extra.page)}`)
        ]
      },
      {
        id: "opening-path", side: "recruiter",
        title: t("3 · Recruiter's four opening STEPs", "3 · Quatro STEPs iniciais do Recruiter"),
        sources: [["core", 4], ["core", 7]],
        items: [
          t("Perform 4 STEP actions and write 2, 3, 4, and 5 on the Secret Map. Do not revisit a numbered location; follow Temple and Mayhem movement rules.", "Faça 4 ações STEP e escreva 2, 3, 4 e 5 no Secret Map. Não revisite uma localização numerada; siga as regras de movimento de Temple e Mayhem."),
          t("Count every circled Feature on locations 1–5. Take that many Recruit tokens from the supply and place them beside 01:00–05:00; do not reveal where each Recruit was contacted.", "Conte cada Feature circulada nas localizações 1–5. Pegue essa quantidade de fichas Recruit do suprimento e coloque-as junto a 01:00–05:00; não revele onde cada Recruit foi contatado.")
        ]
      },
      ...(state.mode === "full" ? [{
        id: "immortals", side: "recruiter",
        title: t("4 · Place Immortals", "4 · Posicione os Immortals"),
        sources: [["core", 4], ["core", 9]],
        items: [
          t("Place the 4 Immortals on different locations, not on the outside edge of the board.", "Coloque os 4 Immortals em localizações diferentes, não nas bordas externas do tabuleiro."),
          ...selectedModules("recruiter").filter((module) => ["recruiter-5", "recruiter-6"].includes(module.id)).flatMap((module) => moduleSetupForSide(module, "recruiter").map((line) => `${moduleNameForReader(module)}: ${line} ${moduleReferences(module)}`))
        ]
      }] : []),
      {
        id: "rogue-agents", side: "agents",
        title: t(`${state.mode === "training" ? "4" : "5"} · Rogue Agents setup`, `${state.mode === "training" ? "4" : "5"} · Preparação dos Rogue Agents`),
        sources: [["core", 4]],
        items: [
          t(`${agentSelectionEn} ${expandedAgentRoster ? "Distribute those 4" : "Distribute them"} by player count: at 2 players one Rogue controls all 4; at 3, each controls 2; at 4, each of 3 controls 1 and they share the fourth; at 5, each controls 1.`,
            `${agentSelectionPt} Distribua os 4 pelo número de jogadores: com 2, um Rogue controla os 4; com 3, cada um controla 2; com 4, cada um dos 3 controla 1 e dividem o quarto; com 5, cada um controla 1.`),
          ...(state.mode === "training" ? [t("Use the side of each Agent card without abilities; abilities are inactive in Training.", "Use o lado sem habilidades de cada carta Agent; habilidades não funcionam no Treinamento.")] : [t("Choose Agents randomly or by ability and place their ability sides face-up.", "Escolha os Agentes aleatoriamente ou por habilidade e deixe seus lados com habilidades visíveis.")]),
          t("Place the matching Agent figures on any locations along the board's outside edge.", "Coloque as figuras Agent correspondentes em quaisquer localizações da borda externa do tabuleiro."),
          t(`Place all ${recruiterCardCount} Potential Recruiter cards face-up under POTENTIAL; they show which Recruiter abilities may be in play.`, `Coloque as ${recruiterCardCount} cartas Potential Recruiter visíveis sob POTENTIAL; elas mostram quais habilidades de Recruiter podem estar em jogo.`),
          ...(state.mode === "full" ? [
            t("Place the Black Ops Dolphin Ally face-up under ALLIES. Rogue Agents choose a location orthogonally or diagonally adjacent to a Temple for the second Mind Slip token.", "Coloque a Ally Black Ops Dolphin visível sob ALLIES. Rogue Agents escolhem uma localização adjacente ortogonal ou diagonalmente a um Temple para a segunda ficha Mind Slip."),
            t("Apply the setup for each selected Rogue Agents module and unlocked Rogue Agents extra without revealing private placements to the Recruiter.", "Aplique a preparação de cada módulo Rogue Agents e extra desbloqueado sem revelar posicionamentos privados ao Recruiter.")
          ] : []),
          ...selectedModules("agents").filter((module) => !["agents-4", "agents-5"].includes(module.id)).flatMap((module) => moduleSetupForSide(module, "agents").map((line) => `${moduleNameForReader(module)}: ${line} ${moduleReferences(module)}`)),
          ...selectedModules("recruiter").filter((module) => module.visibleTo?.includes("agents")).flatMap((module) => moduleSetupForSide(module, "agents").map((line) => `${moduleNameForReader(module)}: ${line} ${moduleReferences(module)}`)),
          ...openedContentForReader().flatMap((content) => openedContentSetup(content, "agents").map((line) => `${openedContentNameForReader(content)}: ${line} ${openedContentSources(content).map(([book, page]) => referenceLink(book, page)).join(" ")}`)),
          ...selectedExtrasForOwner("agents").map((extra) => `${extra.name}: ${EXTRA_SETUP[extra.id][state.language === "pt-BR" ? "pt" : "en"]} ${referenceLink("extra", extra.page)}`)
        ]
      },
      ...(expandedAgentRoster ? [{
        id: "agent-roster", side: "recruiter",
        title: t("6 · Check the public Agent roster", "6 · Confira o elenco público de Agentes"),
        sources: [["extra", 14], ["extra", 15], ["extra", 17]],
        items: openedContentForReader()
          .filter((content) => content.packageSide === "agents")
          .flatMap((content) => openedContentSetup(content, "recruiter").map((line) => `${openedContentNameForReader(content)}: ${line} ${openedContentSources(content).map(([book, page]) => referenceLink(book, page)).join(" ")}`))
      }] : []),
      {
        id: "start", side: "shared",
        title: t(`${startStepNumber} · Start the game`, `${startStepNumber} · Comece a partida`),
        sources: [["core", 4], ["core", 6]],
        items: [
          ...(state.mode === "full" ? [t("The Recruiter draws 2 Feature cards face-up under IMMORTAL RECRUITING; these visible cards are the only Features the Immortals may use.", "O Recruiter compra 2 cartas Feature e as deixa visíveis sob IMMORTAL RECRUITING; essas são as únicas Features que os Immortals podem usar.")] : []),
          ...selectedModules("agents").filter((module) => module.id === "agents-4").flatMap((module) => moduleSetupForSide(module, "recruiter").map((line) => `${moduleNameForReader(module)}: ${line} ${moduleReferences(module)}`)),
          t("The Recruiter takes the first turn. Keep the Secret Map and all chosen Recruiter cards behind the Mental Screen.", "O Recruiter faz o primeiro turno. Mantenha o Secret Map e todas as cartas Recruiter escolhidas atrás da Mental Screen."),
          t("Each round, follow the printed order: Recruiter turn, two Agent activations, Recruiter turn, the other two Agent activations, then stand all Agents.", "Em cada rodada, siga a ordem impressa: turno Recruiter, duas ativações de Agente, segundo turno Recruiter, as outras duas ativações e então levante todos os Agentes.")
        ]
      }
    ];
    return phases;
  }

  function setupSection() {
    const issues = configIssues();
    if (issues.length) {
      return `
        ${sectionHeading("setup", t("Setup", "Preparação"), "02", [["core", 4]])}
        <div class="mind-config-error" role="alert">
          <strong>${t("Resolve the match configuration above before starting setup.", "Resolva a configuração da partida acima antes de começar a preparação.")}</strong>
          ${lineList(issues.map((issue) => `<span>${issue}</span>`))}
        </div>`;
    }
    const phases = setupPhases();
    const visible = phases.filter((phase) => phase.side === "shared" || phase.side === state.readingSide);
    const done = phases.filter((phase) => setupState.checks.includes(phase.id)).length;
    const markup = visible.map((phase, index) => `
      <article class="setup-phase">
        <header class="setup-phase-header">
          <span class="setup-phase-number">${String(index + 1).padStart(2, "0")}</span>
          <div><h3>${phase.title}</h3><div class="setup-phase-references">${phase.sources.map(([book, page]) => referenceLink(book, page)).join("")}</div></div>
        </header>
        <label class="mind-setup-check" for="setup-check-${phase.id}">
          <input id="setup-check-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span><strong>${t("Complete this phase", "Conclua esta etapa")}</strong><ul class="mind-setup-substeps">${phase.items.map((item) => `<li>${item}</li>`).join("")}</ul></span>
        </label>
      </article>`).join("");
    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), "02", [["core", 4], ["core", 5]])}
      ${readingSideLine()}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div><strong>${t("Match inventory", "Inventário da partida")}</strong><p>${t("Includes permanent contents of opened packages, selected modules, and this match's mode.", "Inclui conteúdos permanentes de pacotes abertos, módulos selecionados e o modo desta partida.")}</p></div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} phases checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup progress", "Progresso da preparação")}"></progress>
            <button type="button" class="button-secondary" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        ${componentInventory()}
        <p class="setup-storage-note">${t("Progress is saved separately from match options. Switching language or reading side does not clear it; changing mode, players, start visibility, modules, or extras does.", "O progresso é salvo separado das opções da partida. Trocar idioma ou lado de leitura não o apaga; alterar modo, jogadores, início, módulos ou extras apaga.")}</p>
        <p class="mind-config-note">${t("The inventory and instructions show your side's components plus public effects from the other side. Switch above to see the other team's checklist; private placements and assignments remain hidden.", "O inventário e as instruções mostram os componentes do seu lado e os efeitos públicos do outro. Alterne acima para ver a lista da outra equipe; posicionamentos e atribuições privadas continuam ocultos.")}</p>
      </div>
      <div class="setup-phases">${markup}</div>`;
  }

  function victorySection() {
    const recruiterTarget = state.mode === "training" ? 9 : moduleSelected("agents-2") ? 13 : 12;
    const timeTarget = state.mode === "training" ? "14:00" : "16:00";
    const timeRule = state.mode === "full" && extraSelected("evades")
      ? t("Reach 16:00 normally. If the Recruiter activates Evades before round 9 and covers 15:00/16:00, the time win moves to 14:00.", "Chegue a 16:00 normalmente. Se o Recruiter ativar Evades antes da rodada 9 e cobrir 15:00/16:00, a vitória por tempo passa a 14:00.")
      : t(`Reach ${timeTarget} without being captured.`, `Chegue a ${timeTarget} sem ser capturado.`);
    return `
      ${sectionHeading("victory", t("Victory", "Vitória"), "03", [["core", 6], ["core", 15], ...(extraSelected("evades") ? [["extra", 32]] : [])])}
      <div class="victory-grid">
        <article class="victory-card recruiter">
          <span class="component-label">${t("RECRUITER", "RECRUITER")}</span>
          <h3>${t("Win by recruiting or surviving", "Vença recrutando ou sobrevivendo")}</h3>
          ${lineList([
            ruleLine("Recruit", `Reveal your ${recruiterTarget}th Recruit. In the Full Game, an Immortal may also win immediately when it contacts the last required Recruit.`, "Recruit", `Revele seu ${recruiterTarget}º Recruit. Na Partida completa, um Immortal também pode vencer imediatamente ao contatar o último Recruit necessário.`),
            ruleLine("Evade", `${timeRule} ${t("The Rogue Agents do not take a turn after Time reaches the final space.", "Os Rogue Agents não fazem turno depois que o Tempo chega à última casa.")}`, "Escape", `${timeRule} ${t("The Rogue Agents do not take a turn after Time reaches the final space.", "Os Rogue Agents não fazem turno depois que o Tempo chega à última casa.")}`),
            ruleLine("Recruiter trapped", "If you have no legal location to move to, the Rogue Agents win immediately.", "Sem movimento", "Se não houver localização legal para onde se mover, os Rogue Agents vencem imediatamente.")
          ])}
        </article>
        <article class="victory-card rogue-agents">
          <span class="component-label">${t("ROGUE AGENTS", "ROGUE AGENTS")}</span>
          <h3>${t("Capture the Recruiter", "Capture o Recruiter")}</h3>
          ${lineList([
            ruleLine("Capture", openedPackages("recruiter") >= 1
              ? "With New Capture, both the Agent's location and one of the Recruiter's 3 starting Features must be correct for a win; otherwise the Recruiter says only MISS."
              : "A Capture succeeds only when the Recruiter is currently in the Agent's location; a successful Capture ends the game immediately.",
            "Capture", openedPackages("recruiter") >= 1
              ? "Com New Capture, a localização do Agente e uma das 3 Features iniciais do Recruiter devem estar corretas para vencer; caso contrário, o Recruiter diz somente MISS."
              : "Capture só dá certo quando o Recruiter está na localização do Agente; um Capture bem-sucedido encerra a partida imediatamente."),
            ...(openedPackages("recruiter") >= 1 ? [
              ruleLine("New Capture", "A revealed starting Feature may be named; a MISS does not identify whether the location or Feature was wrong.", "New Capture", "Uma Feature inicial revelada pode ser nomeada; um MISS não revela se a localização ou a Feature estava errada.")
            ] : []),
            ruleLine("Time", `${timeRule} If the Time condition is met, the Rogue Agents lose.`, "Tempo", `${timeRule} Se a condição de Tempo for atingida, os Rogue Agents perdem.`)
          ])}
        </article>
      </div>
      ${extraSelected("evades") ? `<p class="mind-config-note">${t("Evades is an optional in-game use: until the Recruiter activates it before round 9, the normal 16:00 target applies. Recruit totals are still revealed at every red Alert.", "Evades é um uso opcional durante a partida: até o Recruiter ativá-la antes da rodada 9, vale a meta normal de 16:00. Totais de Recruit ainda são revelados em cada Alerta vermelho.")} ${referenceLink("extra", 32)}</p>` : ""}`;
  }

  function recruiterTurnSection() {
    const actions = [
      ruleLine("STEP", extraSelected("corners")
        ? "Move to 1 orthogonally adjacent location, or diagonally into or out of a Temple or any of the four board corners. Write the next number on the Secret Map. You may enter an Agent's location without revealing it; do not revisit a numbered location or move through Mayhem."
        : "Move to 1 orthogonally adjacent location, or diagonally into or out of a Temple. Write the next number on the Secret Map. You may enter an Agent's location without revealing it; do not revisit a numbered location or move through Mayhem.",
      "STEP", extraSelected("corners")
        ? "Mova para 1 localização adjacente ortogonalmente, ou na diagonal entrando ou saindo de um Temple ou de qualquer canto do tabuleiro. Escreva o próximo número no Secret Map. Pode entrar na localização de um Agente sem revelar; não revisite local numerado nem atravesse Mayhem."
        : "Mova para 1 localização adjacente ortogonalmente, ou na diagonal entrando ou saindo de um Temple. Escreva o próximo número no Secret Map. Pode entrar na localização de um Agente sem revelar; não revisite local numerado nem atravesse Mayhem."),
      ruleLine("Temple", "A Temple is not a Feature. It allows diagonal movement into or out of the Temple; Mayhem never blocks diagonal movement.", "Temple", "Temple não é Feature. Ele permite movimento diagonal entrando ou saindo do Temple; Mayhem nunca bloqueia movimento diagonal."),
      ruleLine("Mayhem", "Neither side may move through a Mayhem token. The Recruiter may jump over Mayhem with MIND SLIP.", "Mayhem", "Nenhum lado pode atravessar uma ficha Mayhem. O Recruiter pode saltar Mayhem com MIND SLIP."),
      ruleLine("MIND SLIP", "Instead of STEP, use the full movement on the selected Recruiter card and place the spent token beside the Time token after advancing Time. Do not write numbers on skipped locations.", "MIND SLIP", "Em vez de STEP, use todo o movimento da carta Recruiter escolhida e coloque a ficha gasta ao lado do marcador Time após avançar o Tempo. Não escreva números nas localizações puladas."),
      ruleLine("Respond to ASK", "Check the Secret Map. If any visited matching location lacks a Step or green Confirmed note, place one Step there; a white Unconfirmed note does not block it.", "Responder a ASK", "Consulte o Secret Map. Se alguma localização visitada correspondente não tiver Step nem nota Confirmed verde, coloque uma ficha Step ali; uma nota Unconfirmed branca não impede."),
      ruleLine("No eligible ASK location", "If no visited match exists, or every match already has a Step or green Confirmed note, say you cannot place a new Step. Do not tell the Agents which case applies.", "Sem localização elegível para ASK", "Se não houver localização visitada correspondente, ou se todas já tiverem Step ou nota Confirmed verde, diga que não pode colocar uma nova ficha Step. Não diga aos Agentes qual caso se aplica."),
      ruleLine("Step supply exhausted", "If all 8 Step tokens are on the board but an eligible unmarked visited match remains, the manuals give no fallback. This guide marks it as a source limitation; do not say there is no eligible match.", "Suprimento de Step esgotado", "Se as 8 fichas Step estiverem no tabuleiro, mas ainda houver uma localização visitada elegível sem marca, os manuais não dão alternativa. Este guia marca isso como limitação da fonte; não diga que não há localização elegível."),
      ruleLine("Jumping", "A MIND SLIP may pass through visited locations and Mayhem. You visit only the destination, do not contact Recruits in skipped spaces, and may not fake or shorten the move.", "Salto", "MIND SLIP pode atravessar localizações visitadas e Mayhem. Você visita somente o destino, não contata Recruits nos espaços pulados e não pode fingir ou encurtar o movimento."),
      ...(state.mode === "full" ? [
        ruleLine("Retrieve the second token", "Visit its board location to retrieve it, but do not announce that you have picked it up. Reveal the retrieval only if you later use it.", "Recuperar a segunda ficha", "Visite sua localização no tabuleiro para recuperá-la, sem anunciar que a pegou. Revele a recuperação somente se depois a usar.")
      ] : []),
      ruleLine("Card text", "Ad Man and Pipe Girl have different MIND SLIP paths; follow the selected card. The exact feature icons remain on the cards and board.", "Texto da carta", "Ad Man e Pipe Girl têm caminhos MIND SLIP diferentes; siga a carta escolhida. Os ícones exatos de Feature permanecem nas cartas e no tabuleiro.")
    ];
    if (openedPackages("recruiter") >= 1) {
      actions.push(ruleLine("Magician", "Look along the row, column, and both diagonals from your current location. MIND SLIP to any location on those lines sharing either of your current location's Features; it need not be the closest match.", "Magician", "Procure na fileira, coluna e nas duas diagonais da localização atual. Use MIND SLIP até qualquer localização nessas linhas que compartilhe uma das Features atuais; não precisa ser a correspondência mais próxima."));
    }
    if (moduleSelected("recruiter-3") || moduleSelected("recruiter-6")) {
      actions.push(ruleLine("Blue Mayhem", "As a free action, place the blue Mayhem token. It may touch other Mayhem tokens, but must not divide the board into two sections; record it on the Secret Map.", "Mayhem azul", "Como ação gratuita, coloque a ficha Mayhem azul. Ela pode tocar outras fichas Mayhem, mas não pode dividir o tabuleiro em duas partes; registre-a no Secret Map."));
    }
    if (moduleSelected("agents-4")) {
      actions.push(ruleLine("Wind Ventriloquism", "Instead of moving an Immortal, if one is in the same row or column as the Original Immortal, pull the Original Immortal 1 space closer to it. Do not move through Mayhem.", "Wind Ventriloquism", "Em vez de mover um Immortal, se houver um na mesma linha ou coluna que Original Immortal, puxe Original Immortal 1 espaço em sua direção. Não passe por Mayhem."));
    }
    if (openedPackages("recruiter") >= 7) {
      actions.push(ruleLine("The Eraser", "Move in a straight row or column to the board edge or the first Mayhem token, whichever comes first. The destination cannot be a visited location.", "The Eraser", "Mova em linha reta por uma fileira ou coluna até a borda do tabuleiro ou a primeira ficha Mayhem, o que vier primeiro. O destino não pode ter sido visitado."));
    }
    if (extraSelected("ignore-ask")) {
      actions.push(ruleLine("Ignore Ask", "When an Agent takes ASK, you may discard an unused Mind Slip token to refuse the answer. The Agent may finish moving if it has not moved yet, but takes no other action.", "Ignore Ask", "Quando um Agente fizer ASK, pode descartar uma ficha Mind Slip não usada para não responder. O Agente pode terminar de se mover se ainda não o fez, mas não realiza outra ação."));
    }
    if (extraSelected("mental-fog")) {
      actions.push(ruleLine("Mental Fog", "Discard this card as an action to have all Rogue Agents close their eyes; then move, remove, or leave unchanged 1 Mental Note. Agents must not inspect the board during this action.", "Mental Fog", "Descarte esta carta como ação e peça que todos os Rogue Agents fechem os olhos; então mova, retire ou mantenha sem alterações 1 Mental Note. Os Agentes não podem observar o tabuleiro durante essa ação."));
    }
    const lines = [
      ruleLine("Recruiter action", "Take exactly one Recruiter action on each turn. In the Full Game, separately move one Immortal before or after that action; once per turn you may spend a STEP token to move a second Immortal.", "Ação do Recruiter", "Faça exatamente uma ação do Recruiter por turno. Na Partida completa, mova separadamente um Immortal antes ou depois dessa ação; uma vez por turno, pode gastar uma ficha STEP para mover um segundo Immortal."),
      ...actions,
      ruleLine("Contacting Recruits", "Each circled Feature matching one of the Recruiter's 3 secret cards contacts 1 Recruit when the Recruiter visits that location. A location can be visited only once.", "Contatar Recruits", "Cada Feature circulada que corresponda a uma das 3 cartas secretas do Recruiter contata 1 Recruit quando ele visita a localização. Cada localização só pode ser visitada uma vez."),
      ruleLine("Reveal the count", "At a red Alert, count matching circled Features on locations visited in both Recruiter turns this round. Place only the total beside the Time token.", "Revelar o total", "Em um Alerta vermelho, conte as Features circuladas correspondentes nas localizações visitadas nos dois turnos do Recruiter nesta rodada. Coloque somente o total ao lado do marcador Time."),
      ruleLine("Recruiter mistake", "Announce any discovered illegal move, wrong Step, or wrong Recruit count. Fix it immediately if the game state is unchanged; otherwise place one Confirmed Mental Note for each turn since the mistake on locations you choose, marked with their actual Time.", "Erro do Recruiter", "Anuncie qualquer movimento ilegal, Step errado ou contagem incorreta de Recruit descoberta. Corrija imediatamente se o estado não mudou; caso contrário, coloque uma Mental Note Confirmed para cada turno desde o erro, nas localizações que escolher, marcadas com o horário correto.")
    ];
    if (state.mode === "full") {
      lines.splice(1, 0, ruleLine("Immortal limit", "Recruiter starts with 4 Immortals. A Recruiter may contact Recruits with Immortals at most twice per turn, once for each Immortal Recruiting card.", "Limite de Immortals", "Recruiter começa com 4 Immortals. Pode contatar Recruits com Immortals no máximo duas vezes por turno, uma por carta Immortal Recruiting."));
      lines.splice(lines.length - 1, 0,
        ruleLine("MOVE IMMORTAL", "Move 1 Immortal orthogonally or diagonally to an adjacent location, including one with an Agent or one already visited by the Recruiter. Immortals cannot share a location or move through Mayhem.", "MOVE IMMORTAL", "Mova 1 Immortal ortogonal ou diagonalmente para uma localização adjacente, inclusive com Agente ou já visitada pelo Recruiter. Immortals não compartilham localização nem atravessam Mayhem."),
        ruleLine("Extra Immortal move", "After the first Immortal move, you may place a STEP token on a visited location without a STEP or Confirmed Mental Note, then move a second Immortal. Once per turn.", "Movimento extra de Immortal", "Depois do primeiro movimento de Immortal, pode colocar STEP em uma localização visitada sem STEP ou Mental Note Confirmed, então mover outro Immortal. Uma vez por turno."),
        ruleLine("Immortal protection", openedPackages("agents") >= 3
          ? "An Agent in an Immortal's location cannot Ask or Capture; only Duncan, if selected, may Reveal a token there. Agents cannot Ask about a Feature in any location occupied by an Immortal."
          : "An Agent in an Immortal's location cannot Ask, Reveal, or Capture. Agents also cannot Ask about a Feature in any location occupied by an Immortal.",
        "Proteção Immortal", openedPackages("agents") >= 3
          ? "Um Agente na localização de um Immortal não pode usar Ask ou Capture; somente Duncan, se escolhido, pode fazer Reveal de uma ficha ali. Agentes não podem perguntar sobre Feature em localização ocupada por Immortal."
          : "Um Agente na localização de um Immortal não pode usar Ask, Reveal ou Capture. Agentes também não podem perguntar sobre Feature em qualquer localização ocupada por Immortal."),
        ruleLine("Shakedown response", "If an Agent correctly guesses one of your 3 secret Features, reveal it and cross out matching circled Features on locations you have not visited. A wrong guess does not reveal a card. After any Shakedown, whether the guess was right or wrong, Rogue Agents may push the target Immortal if a legal push exists.", "Resposta a Shakedown", "Se um Agente adivinhar corretamente uma das suas 3 Features secretas, revele-a e risque Features circuladas correspondentes nas localizações que ainda não visitou. Uma tentativa errada não revela carta. Depois de qualquer Shakedown, acertando ou não, Rogue Agents podem empurrar o Immortal alvo se houver um destino legal."),
        ruleLine("Immortal Recruiting", moduleSelected("recruiter-5")
          ? "Two different locations must each hold an Immortal or Right-Hand Man, both matching the same face-up Immortal Recruiting Feature. Reveal 1 Recruit immediately; discard the used Feature and use a newly drawn card next turn."
          : "Two Immortals must stand on different locations matching the same face-up Immortal Recruiting Feature. Reveal 1 Recruit immediately; discard the used Feature and use a newly drawn card next turn.",
        "Immortal Recruiting", moduleSelected("recruiter-5")
          ? "Duas localizações diferentes devem ter, cada uma, um Immortal ou Right-Hand Man, ambos correspondendo à mesma Feature visível em Immortal Recruiting. Revele 1 Recruit imediatamente; descarte a Feature usada e use uma nova no próximo turno."
          : "Dois Immortals devem ocupar localizações diferentes que correspondam à mesma Feature visível em Immortal Recruiting. Revele 1 Recruit imediatamente; descarte a Feature usada e use a nova somente no próximo turno."),
        ruleLine("Draw Immortal Features", "After the Recruiter action and Immortal moves, draw until there are 2 Immortal Recruiting cards, if the deck allows. Do not recruit from cards just drawn this turn.", "Comprar Features de Immortal", "Depois da ação do Recruiter e dos movimentos de Immortal, compre até haver 2 cartas Immortal Recruiting, se o baralho permitir. Não recrute com cartas compradas neste turno."));
      if (moduleSelected("recruiter-5")) {
        lines.splice(lines.length - 1, 0, ruleLine("Right-Hand Man", "Instead of moving an Immortal, move Right-Hand Man up to 2 spaces. He may pass through Mayhem and revisited locations; only his final location can contact a Recruit, and it cannot also count a Recruit when the Recruiter visits that same location.", "Right-Hand Man", "Em vez de mover um Immortal, mova Right-Hand Man até 2 espaços. Ele pode atravessar Mayhem e locais já visitados; somente o destino pode contatar Recruit e não conta outro Recruit se o Recruiter visitar a mesma localização."));
      }
      if (moduleSelected("recruiter-6")) {
        lines.splice(lines.length - 1, 0, ruleLine("Homemaker", "Move Homemaker 1 space on each Recruiter turn. If it enters an Agent's location, push that Agent and place Chaos on a corner; Rogue Agents cannot enter the 4 locations it covers. It cannot share a location with Right-Hand Man.", "Homemaker", "Mova Homemaker 1 espaço a cada turno do Recruiter. Se entrar na localização de um Agente, empurre-o e coloque Chaos num canto; Rogue Agents não podem entrar nas 4 localizações cobertas. Não pode compartilhar localização com Right-Hand Man."));
      }
    }
    return `
      <div class="turn-block">
        <h3>${t("Recruiter turn", "Turno do Recruiter")}</h3>
        ${lineList(lines)}
        ${referenceLink("core", 7)} ${referenceLink("core", 8)} ${referenceLink("core", 9)} ${referenceLink("core", 10)} ${referenceLink("core", 12)} ${referenceLink("core", 14)}
      </div>`;
  }

  function rogueAgentTurnSection() {
    const actions = [
      ruleLine("Move", "Move up to 2 orthogonally adjacent spaces, changing direction if desired. You may move to another Agent's location or onto an Immortal, but not through Mayhem.", "Mover", "Mova até 2 espaços adjacentes ortogonalmente, mudando de direção se quiser. Pode ir à localização de outro Agente ou sobre um Immortal, mas não atravessar Mayhem."),
      ruleLine("Order", "Move and take one action in either order. If you move first, finish the whole move before taking the action; never interrupt movement with an action. If you act first, you may still move afterward.", "Ordem", "Mova e faça uma ação em qualquer ordem. Se mover primeiro, conclua todo o movimento antes da ação; nunca interrompa o movimento para agir. Se agir primeiro, ainda pode mover depois."),
      ruleLine("ASK", "Choose one Feature in your location. The Recruiter must place a Step token on one visited matching location without a Step or Confirmed note, if possible.", "ASK", "Escolha uma Feature da sua localização. Se possível, o Recruiter coloca uma ficha Step em uma localização visitada correspondente sem Step ou nota Confirmed."),
      ruleLine("ASK limits", "You cannot Ask about a Temple or a Feature in a location occupied by an Immortal; you cannot Ask while sharing a location with an Immortal. A question reveals at most one location.", "Limites de ASK", "Não pode perguntar sobre Temple ou Feature em localização ocupada por Immortal; não pode fazer Ask na mesma localização de Immortal. Uma pergunta revela no máximo uma localização."),
      ruleLine("No Step available", "If no matching unmarked visited location exists, the Recruiter says they cannot place a Step. Use an Unconfirmed Mental Note to mark the negative information.", "Sem Step disponível", "Se não houver localização visitada correspondente sem marca, o Recruiter diz que não pode colocar Step. Use uma Mental Note Unconfirmed para marcar a informação negativa."),
      ruleLine("REVEAL", `${moduleSelected("recruiter-2") ? "Until Dreamwalker is found, Reveal is unavailable. Afterward, " : ""}At a Step token, discard it and ask when the Recruiter visited. The Recruiter writes that Time on a Confirmed Mental Note. ${openedPackages("agents") >= 3 ? "A normal Agent cannot Reveal at an Immortal location; if selected, Duncan may Reveal a token there." : "You cannot Reveal at an Immortal location."}`,
      "REVEAL", `${moduleSelected("recruiter-2") ? "Até que Dreamwalker seja encontrado, Reveal não pode ser usado. Depois, " : ""}Em uma ficha Step, descarte-a e pergunte quando o Recruiter esteve ali. Ele escreve o horário em uma Mental Note Confirmed. ${openedPackages("agents") >= 3 ? "Um Agente normal não pode fazer Reveal em localização de Immortal; se escolhido, Duncan pode revelar uma ficha ali." : "Não pode fazer Reveal em uma localização de Immortal."}`),
      ruleLine("CAPTURE", openedPackages("recruiter") >= 1
        ? "Name your location and one of the Recruiter's 3 starting Feature cards. A HIT wins; otherwise the Recruiter says only MISS."
        : "Attempt to capture the Recruiter at your location. The Recruiter says HIT only if currently there; a HIT wins the game. Otherwise, they say MISS.",
      "CAPTURE", openedPackages("recruiter") >= 1
        ? "Diga sua localização e uma das 3 cartas Feature iniciais do Recruiter. Um HIT vence; caso contrário, o Recruiter diz somente MISS."
        : "Tente capturar o Recruiter na sua localização. Ele diz HIT somente se estiver ali; um HIT vence a partida. Caso contrário, diz MISS.")
    ];
    if (state.mode === "full") {
      actions.splice(6, 0,
        ruleLine("SHAKEDOWN", "Start your activation at an Immortal or move to its location, then take Shakedown after completing the move; do not interrupt movement to use it.", "SHAKEDOWN", "Comece a ativação junto a um Immortal ou mova-se até ele; depois de concluir o movimento, faça Shakedown. Não interrompa o movimento para usá-lo."),
        ruleLine("Feature guess", "Guess any board Feature except Temple. If it matches one of the Recruiter's 3 secret Feature cards, the Recruiter reveals that card and crosses out matching Features on locations they have not visited.", "Adivinhar Feature", "Adivinhe qualquer Feature do tabuleiro, exceto Temple. Se corresponder a uma das 3 cartas Feature secretas do Recruiter, ele a revela e risca Features correspondentes nas localizações que ainda não visitou."),
        ...(extraSelected("on-temples") ? [
          ruleLine("On Temples", "Instead of a Feature guess, ask how many Temple locations the Recruiter has visited; they answer 0, 1, or 2. Follow the normal Shakedown push rule afterward.", "On Temples", "Em vez de adivinhar uma Feature, pergunte quantas localizações Temple o Recruiter visitou; ele responde 0, 1 ou 2. Depois, siga a regra normal de empurrão de Shakedown.")
        ] : []),
        ruleLine("Shakedown push", "If the target is an Immortal, you may push it 1 space to any orthogonally adjacent legal location after the question, regardless of the guess or answer. Do not push through Mayhem or into another Immortal; if none is legal, you cannot push. For Right-Hand Man, follow his module card.", "Empurrão de Shakedown", "Se o alvo for um Immortal, você pode, depois da pergunta, empurrá-lo 1 espaço para qualquer localização adjacente ortogonal legal, independentemente da adivinhação ou resposta. Não passe por Mayhem nem empurre para outro Immortal; se não houver destino legal, não pode empurrar. Para Right-Hand Man, siga a carta do módulo."),
        ...(extraSelected("futurist") ? [
          ruleLine("Futurist", "After Duncan's first wrong Feature guess in a Shakedown, he may make 1 additional Feature guess.", "Futurist", "Depois da primeira tentativa errada de adivinhar Feature de Duncan em um Shakedown, ele pode fazer mais 1 tentativa.")
        ] : []),
        ...(moduleSelected("recruiter-5") ? [
          ruleLine("Right-Hand Man", "If an Agent at his location uses Shakedown and correctly identifies a Recruiter Feature, remove the Right-Hand Man from the game.", "Right-Hand Man", "Se um Agente na localização dele fizer Shakedown e identificar corretamente uma Feature do Recruiter, retire Right-Hand Man da partida.")
        ] : []),
      );
    }
    if (openedPackages("agents") >= 3) {
      actions.push(
        ruleLine("Dark Channels", "Only use it if Meru is selected, and only through the player controlling Meru. Each ASK is a separate action.", "Dark Channels", "Use somente se Meru for escolhido, e apenas por quem controla Meru. Cada ASK é uma ação separada."),
        ruleLine("Punks", "Follow the Punks card. The moving Agent may be standing or lying down, and an Immortal may share either Agent's location.", "Punks", "Siga a carta Punks. O Agente que se move pode estar em pé ou deitado, e um Immortal pode compartilhar a localização de qualquer Agente.")
      );
    }
    if (moduleSelected("agents-4")) {
      actions.push(ruleLine("Move Original Immortal", "An Agent that did not move may move the Original Immortal up to 2 spaces; an Agent that moved only 1 space may move it 1 space. Follow Immortal movement restrictions; remove it after it collects both Lucky Umbrella tokens.", "Mover Original Immortal", "Um Agente que não se moveu pode mover Original Immortal até 2 espaços; um Agente que se moveu somente 1 espaço pode movê-lo 1 espaço. Siga as restrições de movimento de Immortal; retire-o depois que coletar as duas fichas Lucky Umbrella."));
    }
    if (moduleSelected("agents-4")) {
      actions.push(ruleLine("Lucky Umbrella", "After the Original Immortal collects both Umbrellas, use this once per game to attempt Capture at your location or one of its 4 orthogonally adjacent locations.", "Lucky Umbrella", "Depois que Original Immortal coletar os dois Umbrellas, use esta ação uma vez por partida para tentar Capture na sua localização ou em uma das 4 adjacentes ortogonalmente."));
    }
    if (openedPackages("recruiter") >= 1) {
      actions.push(ruleLine("New Capture", "A revealed starting Feature may also be named; a MISS does not identify whether the location or Feature was wrong.", "New Capture", "Uma Feature inicial revelada também pode ser nomeada; um MISS não revela se a localização ou a Feature estava errada."));
    }
    if (openedPackages("agents") >= 7) {
      actions.push(ruleLine("Dusty's Army", "If Shakedown reveals a secret Recruiter Feature, complete the normal Shakedown first, including its optional legal push; then remove the targeted Immortal for the rest of the game. The Recruiter has 3 Immortals, or 2 if Right-Hand Man has also been removed.", "Dusty's Army", "Se Shakedown revelar uma Feature secreta do Recruiter, conclua primeiro o Shakedown normal, incluindo o empurrão legal opcional; depois retire o Immortal alvo pelo restante da partida. O Recruiter fica com 3 Immortals, ou 2 se Right-Hand Man também tiver sido removido."));
    }
    if (state.mode === "full") {
      actions.push(
        ruleLine("Agent abilities", "Each Agent may use its ability once per activation. Free abilities happen before or after movement/action, never during them.", "Habilidades dos Agentes", "Cada Agente pode usar sua habilidade uma vez por ativação. Habilidades gratuitas ocorrem antes ou depois do movimento/ação, nunca durante."),
        ruleLine("Allies", "Use an Ally during an Agent's activation, then discard it. With multiple Allies, one Agent may use more than one in a turn.", "Allies", "Use uma Ally durante a ativação de um Agente e descarte-a depois. Com várias Allies, um Agente pode usar mais de uma no turno.")
      );
    }
    return `
      <div class="turn-block">
        <h3>${t("Rogue Agents turn", "Turno dos Rogue Agents")}</h3>
        ${lineList(actions)}
        ${referenceLink("core", 11)} ${referenceLink("core", 12)} ${referenceLink("core", 13)} ${referenceLink("core", 14)}
      </div>`;
  }

  function abilitySection() {
    if (state.mode !== "full") {
      return "";
    }
    const abilities = [
      ruleLine("Meru · Psychic Crosshairs", "As an action, ask if the Recruiter is within 2 spaces in a straight orthogonal line, including your location. The Recruiter answers truthfully without placing a Step. Cannot use it at an Immortal.", "Meru · Psychic Crosshairs", "Como ação, pergunte se o Recruiter está a até 2 espaços em linha ortogonal reta, incluindo sua localização. Ele responde com verdade sem colocar Step. Não use na localização de Immortal."),
      ruleLine("Henry Lyme · Mental Block", "Immortals cannot recruit at your location or any orthogonally adjacent location.", "Henry Lyme · Mental Block", "Immortals não podem recrutar na sua localização nem nas localizações adjacentes ortogonalmente."),
      ruleLine("Bill Falls · Detect Weakness", "As a free action before or after moving, move an adjacent Immortal 1 orthogonal space, following all Immortal movement restrictions. Cannot move one in your location.", "Bill Falls · Detect Weakness", "Como ação gratuita antes ou depois de mover, mova um Immortal adjacente 1 espaço ortogonal, seguindo todas as restrições de Immortal. Não mova um que esteja na sua localização."),
      ruleLine("Dusty · Neuro Rhythm", "As a free action before or after moving, move any Agent 1 space plus 1 additional space for each Recruiter Feature card revealed by Shakedown.", "Dusty · Neuro Rhythm", "Como ação gratuita antes ou depois de mover, mova qualquer Agente 1 espaço mais 1 espaço por carta Feature do Recruiter revelada por Shakedown."),
      ruleLine("Black Ops Dolphin", "When taking ASK, use this Ally before the Recruiter answers to place Step tokens on all visited locations matching the chosen Feature that have no Step or Confirmed note; then discard it.", "Black Ops Dolphin", "Ao fazer ASK, use esta Ally antes da resposta do Recruiter para colocar fichas Step em todas as localizações visitadas que correspondem à Feature escolhida e não têm Step nem nota Confirmed; depois descarte-a.")
    ];
    if (openedPackages("agents") >= 3) {
      abilities.push(ruleLine("Duncan", "If selected, Duncan may REVEAL a token in a location occupied by an Immortal; follow his Agent card.", "Duncan", "Se escolhido, Duncan pode fazer REVEAL de uma ficha em localização ocupada por Immortal; siga a carta Agent dele."));
    }
    return `
      <div class="turn-block">
        <h3>${t("Agent abilities & Allies", "Habilidades dos Agentes e Allies")}</h3>
        ${lineList(abilities)}
        ${referenceLink("core", 15)}
      </div>`;
  }

  function boardSection() {
    const markers = [
      ["time-token.webp", "Time token", "The token advances one space at each Recruiter turn end; it reaches the final space at 14:00 in Training or 16:00 in the Full Game.", "Marcador Time", "Avance uma casa no fim de cada turno do Recruiter; chega ao fim às 14:00 no Treinamento ou 16:00 na Partida completa.", "core", 3],
      ["alert-icon.webp", "Alert icon", "At a red Alert, the Recruiter reveals the total Recruits contacted since the previous Alert.", "Ícone Alert", "Em um Alerta vermelho, o Recruiter revela o total de Recruits contatados desde o Alerta anterior.", "core", 10],
      ["step-token.webp", "STEP token", "Placed after an Ask to show a visited location, or discarded by Reveal to learn its exact Time.", "Ficha STEP", "Colocada após Ask para indicar uma localização visitada, ou descartada por Reveal para descobrir o horário exato.", "core", 12],
      ["mind-slip-token.webp", "MIND SLIP token", "Spent to use the Recruiter card's special movement instead of STEP; its use is marked beside the Time token.", "Ficha MIND SLIP", "Gasta para usar o movimento especial da carta Recruiter em vez de STEP; seu uso é marcado ao lado do marcador Time.", "core", 8],
      ["mayhem-token.webp", "Mayhem token", "Blocks orthogonal movement for both sides. It does not block diagonal movement through or to a Temple, and MIND SLIP may jump over it.", "Ficha Mayhem", "Bloqueia movimento ortogonal dos dois lados. Não bloqueia movimento diagonal por ou até Temple, e MIND SLIP pode saltá-la.", "core", 7],
      ["temple-location.webp", "Temple location", "A Temple is a special location, not a Feature; the Recruiter and Agents may move diagonally into or out of it.", "Localização Temple", "Temple é uma localização especial, não uma Feature; Recruiter e Agentes podem entrar ou sair dela na diagonal.", "core", 7],
      ["full-game-badge.webp", "Full Game marker", "Orange labels mark Full Game rules in the manual.", "Marcador Full Game", "Rótulos laranja marcam regras da Partida completa no manual.", "core", 3],
      ["training-badge.webp", "Training Mission marker", "Green labels mark Training Mission rules in the manual.", "Marcador Training Mission", "Rótulos verdes marcam regras da Missão de Treinamento no manual.", "core", 3]
    ];
    return `
      ${sectionHeading("board", t("Board, movement & tokens", "Tabuleiro, movimento e fichas"), "05", [["core", 3], ["core", 7], ["core", 13]])}
      <div class="mind-board-notes">
        <article class="map-note">
          <h3>${t("The city board", "Tabuleiro da cidade")}</h3>
          ${lineList([
            ruleLine("Locations", "The Zanzibar map is a grid of square locations, each with 2 Features. The Recruiter and Agents face opposite sides of the board.", "Localizações", "O mapa de Zanzibar é uma grade de localizações quadradas, cada uma com 2 Features. Recruiter e Agentes ficam em lados opostos do tabuleiro."),
            ruleLine("Temples", "A Temple is not a Feature. It enables diagonal movement into or out of its location for either side.", "Temples", "Temple não é Feature. Ele permite movimento diagonal entrando ou saindo de sua localização para ambos os lados."),
            ruleLine("Mayhem", moduleSelected("recruiter-3") || moduleSelected("recruiter-6")
              ? "The 5 base Mayhem tokens cannot touch. The blue module token may touch them, but cannot divide the board into two sections. All Mayhem block orthogonal movement only; diagonal Temple movement is never blocked."
              : "Mayhem tokens sit between locations and cannot touch one another. They block orthogonal movement only; diagonal Temple movement is never blocked.",
            "Mayhem", moduleSelected("recruiter-3") || moduleSelected("recruiter-6")
              ? "As 5 fichas Mayhem base não podem se tocar. A ficha azul do módulo pode tocá-las, mas não pode dividir o tabuleiro em duas partes. Todas bloqueiam somente movimento ortogonal; movimento diagonal por Temple nunca é bloqueado."
              : "Fichas Mayhem ficam entre localizações e não podem se tocar. Bloqueiam somente movimento ortogonal; movimento diagonal por Temple nunca é bloqueado."),
            ruleLine("Recruiter map", "Only the Recruiter records visited locations on the Secret Map. Rogue Agents may record suspicions only on the 15 Mental Note tokens.", "Mapa do Recruiter", "Somente o Recruiter registra localizações visitadas no Secret Map. Rogue Agents registram suspeitas somente nas 15 fichas Mental Note.")
          ])}
          ${referenceLink("core", 4)} ${referenceLink("core", 7)} ${referenceLink("core", 13)}
        </article>
        <div class="mind-icon-grid">${markers.map(([file, titleEn, bodyEn, titlePt, bodyPt, book, page]) => iconCard(file, titleEn, bodyEn, titlePt, bodyPt, book, page)).join("")}</div>
      </div>`;
  }

  function selectedContentSection() {
    const modules = modulesForReader();
    const openedContent = openedContentForReader();
    const extras = selectedExtras(state.readingSide);
    if (!modules.length && !openedContent.length && !extras.length) {
      return `
        ${sectionHeading("modules", t("Opened packages, modules & extras", "Pacotes abertos, módulos e extras"), "06", [["core", 16]])}
        <p class="mind-config-note">${t("No opened package content, SHIFT module, or unlocked extra applies to this side. The guide shows only the core rules for this role.", "Nenhum conteúdo de pacote aberto, módulo SHIFT ou extra desbloqueado se aplica a este lado. O guia mostra somente as regras base deste papel.")}</p>`;
    }
    const moduleMarkup = modules.map((module) => `
      <article class="mind-content-card">
        <div class="mind-content-heading">
          ${[module.iconBySide?.[state.readingSide] ?? module.icon, ...(module.extraIcon ? [module.extraIcon] : [])].filter(Boolean).map((file) => `<span class="mind-module-icon"><img src="${ICONS}${file}" alt=""></span>`).join("")}
          <div><span class="component-label">${t("SELECTED SHIFT MODULE", "MÓDULO SHIFT SELECIONADO")}</span><h3>${moduleNameForReader(module)}</h3></div>
        </div>
        ${lineList([
          ...moduleDetailsForReader(module).map((line) => `<strong>${t("Rule", "Regra")}:</strong> ${line}`),
          ...(moduleInterpretationForReader(module)
            ? [`<strong>${t("Interpretation", "Interpretação")}:</strong> ${moduleInterpretationForReader(module)}`]
            : []),
          ...moduleSetupForSide(module, state.readingSide).map((line) => `<strong>${t("Setup", "Preparação")}:</strong> ${line}`)
        ])}
        <p>${t("Components:", "Componentes:")} ${moduleComponentsForReader(module).join("; ")}</p>
        <p>${t("After the game:", "Depois da partida:")} ${moduleRetentionForReader(module)}</p>
        ${moduleReferences(module)}
      </article>`).join("");
    const openedContentMarkup = openedContent.map((content) => `
      <article class="mind-content-card">
        <span class="component-label">${t("PERMANENT OPENED-PACKAGE CONTENT", "CONTEÚDO PERMANENTE DE PACOTE ABERTO")}</span>
        <h3>${openedContentNameForReader(content)}</h3>
        ${lineList([
          ...openedContentLines(content, "detailsBySide").map((line) => `<strong>${t("Rule", "Regra")}:</strong> ${line}`),
          ...(openedContentInterpretationForReader(content)
            ? [`<strong>${t("Interpretation", "Interpretação")}:</strong> ${openedContentInterpretationForReader(content)}`]
            : []),
          ...openedContentSetup(content, state.readingSide).map((line) => `<strong>${t("Setup", "Preparação")}:</strong> ${line}`)
        ])}
        <p>${t("Components:", "Componentes:")} ${openedContentLines(content, "componentsBySide").join("; ")}</p>
        <p>${t("After the game:", "Depois da partida:")} ${openedContentRetention(content)}</p>
        ${openedContentSources(content).map(([book, page]) => referenceLink(book, page)).join(" ")}
      </article>`).join("");
    const extraMarkup = extras.map((extra) => `
      <article class="mind-content-card">
        <span class="component-label">${t("UNLOCKED EXTRA", "EXTRA DESBLOQUEADO")}</span>
        <h3>${extra.name}</h3>
        ${lineList(extra.details[state.language === "pt-BR" ? "pt" : "en"].map((line) => `<strong>${t("Effect", "Efeito")}:</strong> ${line}`))}
        <p>${t("Origin:", "Origem:")} ${t(extra.sourceLocation.en, extra.sourceLocation.pt)} · ${t("Components:", "Componentes:")} ${t(extra.components.en.join("; "), extra.components.pt.join("; "))}</p>
        ${referenceLink("extra", extra.page)}
      </article>`).join("");
    return `
      ${sectionHeading("modules", t("Opened packages, modules & extras", "Pacotes abertos, módulos e extras"), "06", [["core", 16]])}
      ${readingSideLine()}
      <p class="mind-config-note">${t("This view shows rules for the selected side, shared rules, and public effects needed to respond to the other side. Private placements and assignments remain hidden. Module components may override core rules; follow a selected component's more specific instruction.", "Esta leitura mostra as regras do lado escolhido, regras compartilhadas e efeitos públicos necessários para responder ao outro lado. Posicionamentos e atribuições privadas continuam ocultos. Componentes de módulos podem substituir regras base; siga a instrução mais específica do componente selecionado.")}</p>
      <div class="mind-content-grid">${moduleMarkup}${openedContentMarkup}${extraMarkup}</div>`;
  }

  function examplesSection() {
    const examples = [
      {
        title: t("1 · The opening route", "1 · O caminho inicial"),
        text: t("The Recruiter writes 1 at the start, then records four setup STEPs as 2–5. Afterward, the Recruiter counts every circled Feature at all five locations and puts that many Recruit tokens beside 01:00–05:00; opponents do not learn which location earned each one.", "O Recruiter escreve 1 no início e registra quatro STEPs de preparação como 2–5. Depois conta cada Feature circulada nas cinco localizações e coloca essa quantidade de fichas Recruit junto a 01:00–05:00; os oponentes não descobrem qual localização gerou cada uma.")
      },
      {
        title: t("2 · Temple and Mayhem", "2 · Temple e Mayhem"),
        text: t("An Agent may enter or leave a Temple diagonally. A Mayhem token between two locations blocks an orthogonal crossing, but never blocks that diagonal Temple move.", "Um Agente pode entrar ou sair diagonalmente de um Temple. Uma ficha Mayhem entre duas localizações bloqueia a passagem ortogonal, mas nunca esse movimento diagonal por Temple.")
      },
      {
        title: t("3 · MIND SLIP skips locations", "3 · MIND SLIP pula localizações"),
        text: t("If the selected Recruiter card jumps two spaces in a straight line, write the next Time only at the destination. Do not write numbers on skipped locations and do not count Features there as Recruits.", "Se a carta Recruiter escolhida permite saltar dois espaços em linha reta, escreva o próximo horário somente no destino. Não numere localizações puladas nem conte suas Features como Recruits.")
      },
      {
        title: moduleSelected("recruiter-2")
          ? t("4 · Search before Reveal", "4 · Busque antes de Reveal")
          : t("4 · Ask and reveal", "4 · Ask e Reveal"),
        text: moduleSelected("recruiter-2")
          ? t("While Dreamwalker has not been found, the Rogue Agents cannot use Reveal. After they locate Dreamwalker, Reveal at a Step token replaces it with a Confirmed Mental Note showing the exact Time.", "Enquanto Dreamwalker não for encontrado, os Rogue Agents não podem usar Reveal. Depois de localizá-lo, Reveal em uma ficha Step a substitui por uma Mental Note Confirmed com o horário exato.")
          : t("When asked about a Feature visited at several locations, the Recruiter places only one Step token, choosing a visited matching location without a Step or Confirmed note if possible. Later, Reveal on that token replaces it with a Confirmed note showing the exact Time.", "Quando perguntado sobre uma Feature visitada em várias localizações, o Recruiter coloca somente uma ficha Step, escolhendo se possível uma localização correspondente sem Step nem nota Confirmed. Depois, Reveal nessa ficha a substitui por uma nota Confirmed com o horário exato.")
      },
      ...(state.mode === "full" ? [{
        title: t("5 · Immortal Recruiting", "5 · Immortal Recruiting"),
        text: t("If two Immortals occupy two different locations with the same Feature shown under IMMORTAL RECRUITING, the Recruiter reveals one Recruit immediately and discards that Feature card. A newly drawn Feature is not usable until a later turn.", "Se dois Immortals ocuparem localizações diferentes com a mesma Feature exibida em IMMORTAL RECRUITING, o Recruiter revela um Recruit imediatamente e descarta a carta Feature. Uma carta recém-comprada só pode ser usada em um turno posterior.")
      }] : [])
    ];
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), "07", [["core", 7], ["core", 8], ["core", 9], ["core", 11], ["core", 13]])}
      <div class="mind-example-grid">${examples.map((example) => `
        <article class="mind-example-card"><h3>${example.title}</h3><p>${example.text}</p></article>`).join("")}</div>`;
  }

  function glossarySection() {
    const recruiterCardCount = 2 + (openedPackages("recruiter") >= 1 ? 1 : 0) + (openedPackages("recruiter") >= 7 ? 1 : 0);
    const items = [
      { term: ["Feature", "Feature"], side: null, page: 4, text: ["One of the two named properties printed at each board location. A Recruiter Feature card matches every location showing that property.", "Uma das duas características nomeadas impressas em cada localização. Uma carta Feature do Recruiter corresponde a cada localização com aquela característica."] },
      { term: ["Location", "Location"], side: null, page: 4, text: ["A square on the Zanzibar map with 2 Features; movement and visiting rules apply per location.", "Um quadrado no mapa de Zanzibar com 2 Features; regras de movimento e visita valem por localização."] },
      { term: ["STEP", "STEP"], side: "recruiter", page: 7, text: ["The Recruiter's normal orthogonal move to a new location, recorded with the next number on the Secret Map.", "Movimento ortogonal normal do Recruiter para uma nova localização, registrado com o próximo número no Secret Map."] },
      { term: ["MIND SLIP", "MIND SLIP"], side: "recruiter", page: 8, text: ["A special Recruiter-card move that replaces STEP and must be completed at its full printed distance.", "Movimento especial da carta Recruiter que substitui STEP e deve cumprir toda a distância impressa."] },
      { term: ["Temple", "Temple"], side: null, page: 7, text: ["A special board location that permits diagonal movement in or out; it is not a Feature.", "Localização especial do tabuleiro que permite movimento diagonal entrando ou saindo; não é Feature."] },
      { term: ["Mayhem", "Mayhem"], side: null, page: 7, text: ["A token placed between two locations that blocks orthogonal movement but never diagonal movement.", "Ficha colocada entre duas localizações que bloqueia movimento ortogonal, mas nunca diagonal."] },
      { term: ["Immortal", "Immortal"], side: "recruiter", page: 9, text: ["A Recruiter-controlled figure that can contact Recruits and prevent Rogue Agents from using certain actions.", "Figura controlada pelo Recruiter que pode contatar Recruits e impedir certas ações dos Rogue Agents."] },
      { term: ["Unconfirmed Mental Note", "Mental Note Unconfirmed"], side: "agents", page: 13, text: ["A white token for Rogue Agent suspicions; Agents may write on, move, or remove it.", "Ficha branca para suspeitas dos Rogue Agents; Agentes podem escrever, mover ou retirar."] },
      { term: ["Confirmed Mental Note", "Mental Note Confirmed"], side: "agents", page: 13, text: ["A green token placed by the Recruiter to confirm a location and its Time; it cannot be changed or removed.", "Ficha verde colocada pelo Recruiter para confirmar localização e horário; não pode ser alterada nem retirada."] },
      { term: ["Alert", "Alert"], side: null, page: 10, text: ["A red Time Track space where the Recruiter reveals only the total Recruits contacted since the previous Alert.", "Casa vermelha da Trilha do Tempo em que o Recruiter revela somente o total de Recruits contatados desde o Alerta anterior."] },
      { term: ["Immortal Recruiting", "Immortal Recruiting"], side: "recruiter", page: 9, text: ["The Full Game action that contacts a Recruit when 2 Immortals occupy different locations matching a visible recruiting Feature.", "Ação da Partida completa que contata um Recruit quando 2 Immortals ocupam localizações diferentes que correspondem a uma Feature visível de recrutamento."] },
      { term: ["SHIFT module", "Módulo SHIFT"], side: null, page: 16, text: ["An optional gameplay module from an opened package. The losing side chooses first; the winner's allowed count depends on its consecutive full-game wins.", "Módulo opcional de um pacote aberto. O lado perdedor escolhe primeiro; a quantidade permitida ao vencedor depende de suas vitórias completas consecutivas."] },
      { term: ["Potential Recruiter", "Potential Recruiter"], side: "agents", page: 4, text: [`The ${recruiterCardCount} face-up cards show Rogue Agents which Recruiter abilities could be selected; the Recruiter's actual selected card stays hidden.`, `As ${recruiterCardCount} cartas visíveis mostram aos Rogue Agents quais habilidades de Recruiter podem ter sido escolhidas; a carta escolhida fica escondida.`]
      }
    ];
    const visible = items.filter((item) => item.side === null || item.side === state.readingSide);
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), "08", [["core", 7], ["core", 13], ["core", 16]])}
      ${readingSideLine()}
      <div class="quick-grid glossary-grid">${visible.map((item) => `
        <article class="info-card glossary-card">
          <span class="component-label">${t("TERM", "TERMO")}</span>
          <h3>${t(item.term[0], item.term[1])}</h3>
          <p>${t(item.text[0], item.text[1])}</p>
          ${referenceLink("core", item.page)}
        </article>`).join("")}</div>`;
  }

  function renderHeader() {
    return `
      <header class="site-header">
        <a class="brand" href="#/" aria-label="${t("Field Manual home", "Página inicial do Manual de Campo")}">
          <span class="brand-mark" aria-hidden="true">MG</span>
          <span class="brand-copy"><strong>Field Manual</strong><small>${t("Board-game rulebooks", "Livros de regras")}</small></span>
        </a>
        <div class="header-right">
          <nav class="primary-nav" aria-label="${t("Main navigation", "Navegação principal")}">
            <a href="#/">${t("Game index", "Jogos")}</a>
          </nav>
          <div class="language-switch" role="group" aria-label="${t("Language", "Idioma")}">
            <button type="button" data-language="en-US" aria-pressed="${state.language === "en-US"}">EN-US</button>
            <button type="button" data-language="pt-BR" aria-pressed="${state.language === "pt-BR"}">PT-BR</button>
          </div>
        </div>
      </header>`;
  }

  function renderInto(host) {
    if (!state) {
      state = loadPreferences();
      setupState = loadSetup();
    }
    root = host;
    document.body.classList.add("theme-mind-mgmt");
    document.documentElement.lang = state.language;
    document.title = t("Mind MGMT — Field Manual", "Mind MGMT — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Mind MGMT: Training Mission and Full Game, with 2–5 players, asymmetric Recruiter and Rogue Agents rules, SHIFT modules, and unlocked extras.",
        "Regras interativas bilíngues de Mind MGMT: Missão de Treinamento e Partida completa, para 2–5 jogadores, com regras assimétricas de Recruiter e Rogue Agents, módulos SHIFT e extras desbloqueados."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook · asymmetric deduction", "Livro interativo · dedução assimétrica")}</p>
          <h1>Mind MGMT</h1>
          <p class="hero-intro">${t(
            "One Recruiter secretly crosses Zanzibar to contact Recruits. The Rogue Agents move four investigators, question locations, and try to capture the Recruiter before time runs out.",
            "Um Recruiter atravessa Zanzibar em segredo para contatar Recruits. Os Rogue Agents movem quatro investigadores, interrogam localizações e tentam capturar o Recruiter antes que o tempo acabe."
          )}</p>
          <div class="hero-meta"><span>${t("2–5 players", "2–5 jogadores")}</span><span>${t("Recruiter vs. Rogue Agents", "Recruiter vs. Rogue Agents")}</span><span>${t("Training + Full Game", "Treinamento + Partida completa")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/mind-mgmt.webp" alt="${t("Cover of the Mind MGMT rulebook", "Capa do manual de Mind MGMT")}" fetchpriority="high"><figcaption>${t("Rulebook cover · Sen-Foong Lim, Jay Cormier, and Matt Kindt", "Capa do manual · Sen-Foong Lim, Jay Cormier e Matt Kindt")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("Field guide", "Guia de campo")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column mind-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout mind-scope-note">${t(
            "Scope: the authorized core rules and supplied SHIFT/Extra references. Hidden-envelope cards stay out of the guide unless you explicitly reveal already-unlocked content for the selected reading side. Solo and Co-op require the official app and are not covered. Secret Map locations, selected Recruiter cards, and hidden placements are never stored or shared.",
            "Escopo: regras base autorizadas e referências SHIFT/Extra fornecidas. Cartas de envelopes escondidos ficam fora do guia até você revelar conteúdo já desbloqueado para o lado escolhido. Solo e Co-op exigem o aplicativo oficial e não são cobertos. Localizações do Secret Map, carta Recruiter escolhida e posicionamentos ocultos nunca são armazenados nem compartilhados."
          )}${state.readingSide === "agents" && extraSelected("psychic-snare") ? ` ${t(
            "App-only limitation: Extra p. 33 does not specify when or how to place a Psychic Snare. This guide includes only its printed trigger behavior; follow the official app for the placement procedure.",
            "Limitação do aplicativo: Extra p. 33 não especifica quando ou como colocar uma Psychic Snare. Este guia inclui somente o comportamento de ativação impresso; siga o aplicativo oficial para o procedimento de colocação."
          )} ${referenceLink("extra", 33)}` : ""} ${referenceLink("core", 17)}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${victorySection()}</section>
          <section class="rule-section">
            ${sectionHeading("turn", t("Turns & actions", "Turnos e ações"), "04", [["core", 6], ["core", 7], ["core", 11], ["core", 15]])}
            ${readingSideLine()}
            ${state.readingSide === "recruiter" ? recruiterTurnSection() : rogueAgentTurnSection()}
            ${state.readingSide === "agents" ? abilitySection() : ""}
          </section>
          <section class="rule-section">${boardSection()}</section>
          <section class="rule-section">${selectedContentSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the user-authorized Mind MGMT core, SHIFT summary, and extra mission-detail PDFs. © 2021 Off the Page Games; game design by Sen-Foong Lim and Jay Cormier; art and writing by Matt Kindt.",
        "Guia pessoal de consulta baseado nos PDFs autorizados pelo usuário: manual base, resumo SHIFT e detalhes extras de missões de Mind MGMT. © 2021 Off the Page Games; jogo de Sen-Foong Lim e Jay Cormier; arte e texto de Matt Kindt."
      )}</p></footer>`;
  }

  function updateProgress() {
    const phases = setupPhases();
    const done = phases.filter((phase) => setupState.checks.includes(phase.id)).length;
    const progress = root?.querySelector("#setup-progress");
    const label = root?.querySelector("#setup-progress-label");
    if (progress) {
      progress.value = done;
    }
    if (label) {
      label.textContent = t(`${done} of ${phases.length} phases checked`, `${done} de ${phases.length} etapas marcadas`);
    }
    updateStorageNotice();
  }

  function updateStorageNotice() {
    if (!root) {
      return;
    }
    let notice = root.querySelector("[data-storage-notice]");
    if (!storageIssues.size) {
      notice?.remove();
      return;
    }
    if (!notice) {
      notice = document.createElement("p");
      notice.className = "storage-notice";
      notice.dataset.storageNotice = "";
      notice.setAttribute("role", "status");
      root.querySelector(".mind-page")?.prepend(notice);
    }
    notice.textContent = storageNoticeText();
  }

  function onClick(event) {
    const button = event.target instanceof Element ? event.target.closest("button") : null;
    if (!button || !root || !root.contains(button)) {
      return;
    }
    if (button.dataset.language) {
      state.language = button.dataset.language === "en-US" ? "en-US" : "pt-BR";
      savePreferences();
      renderInto(root);
      return;
    }
    if (button.dataset.readingSide) {
      state.readingSide = button.dataset.readingSide === "agents" ? "agents" : "recruiter";
      savePreferences();
      renderInto(root);
      return;
    }
    if (button.hasAttribute("data-setup-reset")) {
      setupState = { fingerprint: configFingerprint(), checks: [] };
      saveSetup();
      renderInto(root);
      return;
    }
    if (button.dataset.scroll) {
      document.getElementById(button.dataset.scroll)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function onChange(event) {
    const input = event.target instanceof HTMLInputElement ? event.target : null;
    if (!input || !root || !root.contains(input)) {
      return;
    }
    if (input.dataset.setupCheck) {
      if (input.checked && !setupState.checks.includes(input.dataset.setupCheck)) {
        setupState.checks.push(input.dataset.setupCheck);
      } else if (!input.checked) {
        setupState.checks = setupState.checks.filter((id) => id !== input.dataset.setupCheck);
      }
      setupState.fingerprint = configFingerprint();
      saveSetup();
      updateProgress();
      return;
    }

    const before = configFingerprint();
    if (input.dataset.field) {
      switch (input.dataset.field) {
        case "mode":
          state.mode = input.value === "full" ? "full" : "training";
          break;
        case "players":
          state.players = Number(input.value);
          break;
        case "startVisibility":
          state.startVisibility = input.value === "hidden" ? "hidden" : "public";
          break;
        case "openedRecruiter":
          state.openedRecruiter = Number(input.value);
          break;
        case "openedAgents":
          state.openedAgents = Number(input.value);
          break;
        case "previousWinner":
          state.previousWinner = ["recruiter", "agents"].includes(input.value) ? input.value : "none";
          break;
        case "winStreak":
          state.winStreak = Number(input.value);
          break;
        case "revealExtras":
          state.revealExtras = input.value === "yes";
          break;
        default:
          return;
      }
    } else if (input.dataset.module) {
      state.shiftModules[input.dataset.module] = input.value === "yes";
    } else if (input.dataset.extra) {
      state.extras[input.dataset.extra] = input.value === "yes";
    } else {
      return;
    }
    state = normalizePreferences(state);
    const after = configFingerprint();
    if (before !== after) {
      setupState = { fingerprint: after, checks: [] };
      saveSetup();
    }
    savePreferences();
    renderInto(root);
  }

  window.MindMgmt = { renderInto, onClick, onChange };
})();
