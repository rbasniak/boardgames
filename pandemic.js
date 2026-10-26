(() => {
  "use strict";

  const PREFS_KEY = "field-manual.pandemic.v1";
  const CHECKS_KEY = "field-manual.pandemic.setup.v1";
  const ICON_DIR = "assets/pandemic/";

  const BOOKS = {
    core: { file: "pandemic_core.pdf", en: "Core", pt: "Base" },
    otb: { file: "pandemic_on-the-brink.pdf", en: "On the Brink", pt: "On the Brink" },
    itl: { file: "pandemic_in-the-lab.pdf", en: "In the Lab", pt: "In the Lab" },
    soe: { file: "pandemic_state-of-emergency.pdf", en: "State of Emergency", pt: "State of Emergency" }
  };

  const BOX_PREFS = { otb: "boxOtb", itl: "boxItl", soe: "boxSoe" };

  const LEVELS = ["intro", "standard", "heroic", "legendary"];
  const LEVEL_INFO = {
    intro: { epidemics: 4, box: "core" },
    standard: { epidemics: 5, box: "core" },
    heroic: { epidemics: 6, box: "core" },
    legendary: { epidemics: 7, box: "otb" }
  };

  // Starting hand size by player count (Core p. 2; the 5-player row comes from On the Brink).
  const HAND_SIZES = { 2: 4, 3: 3, 4: 2, 5: 2 };

  const INFECTION_RATE_TRACK = [2, 2, 2, 3, 3, 4, 4];

  const CITIES = {
    blue: ["San Francisco", "Chicago", "Montréal", "New York", "Atlanta", "Washington", "London", "Madrid", "Paris", "Essen", "Milan", "St. Petersburg"],
    yellow: ["Los Angeles", "Mexico City", "Miami", "Bogotá", "Lima", "Santiago", "São Paulo", "Buenos Aires", "Lagos", "Kinshasa", "Johannesburg", "Khartoum"],
    black: ["Algiers", "Istanbul", "Moscow", "Cairo", "Baghdad", "Tehran", "Riyadh", "Karachi", "Delhi", "Mumbai", "Kolkata", "Chennai"],
    red: ["Beijing", "Seoul", "Tokyo", "Osaka", "Shanghai", "Hong Kong", "Taipei", "Bangkok", "Ho Chi Minh City", "Manila", "Jakarta", "Sydney"]
  };

  // Challenge catalogue. `box` is the expansion that supplies it.
  const CHALLENGE_IDS = ["virulent-strain", "mutation", "bio-terrorist", "lab", "quarantines", "hinterlands", "emergency-events", "superbug"];
  const CHALLENGE_PREF = {
    "virulent-strain": "chVirulent",
    mutation: "chMutation",
    "bio-terrorist": "chBioTerrorist",
    lab: "chLab",
    quarantines: "chQuarantines",
    hinterlands: "chHinterlands",
    "emergency-events": "chEmergency",
    superbug: "chSuperbug"
  };
  const CHALLENGE_BOX = {
    "virulent-strain": "otb",
    mutation: "otb",
    "bio-terrorist": "otb",
    lab: "itl",
    quarantines: "soe",
    hinterlands: "soe",
    "emergency-events": "soe",
    superbug: "soe"
  };

  // Every pair the manuals forbid, with the page that says so.
  const EXCLUSIONS = [
    { a: "mutation", b: "bio-terrorist", book: "otb", page: 5 },
    { a: "quarantines", b: "bio-terrorist", book: "soe", page: 2 },
    { a: "superbug", b: "mutation", book: "soe", page: 5 },
    { a: "superbug", b: "bio-terrorist", book: "soe", page: 5 }
  ];

  // Challenges that pull another challenge in with them.
  const REQUIREMENTS = [{ challenge: "superbug", needs: "quarantines", book: "soe", page: 5 }];

  // Content data. These arrays are transcriptions of the four rulebooks; see README.
  // <<<DATA:ROLES>>>
  const ROLES = [
  {
      id: "contingency-planner",
      book: "core",
      page: 8,
      requires: null,
      replaces: null,
      name: { en: "Contingency Planner", pt: "Planejador de Contingência (Contingency Planner)" },
      color: { en: "Teal", pt: "Turquesa" },
      card: {
        en: [
          "As an action, take any discarded Event card and store it on this card.",
          "When you play the stored Event card, remove it from the game."
        ],
        pt: [
          "Como ação, pegue qualquer carta de Evento (Event card) descartada e guarde-a nesta carta.",
          "Quando jogar a carta de Evento (Event card) guardada, remova-a do jogo."
        ]
      },
      limit: {
        en: "Limit: 1 Event card on this card at a time, which is not part of your hand.",
        pt: "Limite: 1 carta de Evento (Event card) nesta carta por vez, que não faz parte da sua mão."
      },
      notes: {
        en: [
          "The Event card may be taken from anywhere in the Player Discard Pile.",
          "Only 1 Event card can be on his role card at a time, and it does not count against his hand limit.",
          "When he plays the stored Event card, remove it from the game instead of discarding it.",
          "Event cards left face up as reminders are not yet in the Player Discard Pile, so the Contingency Planner cannot take them."
        ],
        pt: [
          "A carta de Evento (Event card) pode ser retirada de qualquer posição da Pilha de Descarte de Jogadores (Player Discard Pile).",
          "Só pode haver 1 carta de Evento na carta de função dele por vez, e ela não conta para o limite de mão (hand limit).",
          "Quando ele joga a carta de Evento guardada, ela é removida do jogo em vez de ser descartada.",
          "Cartas de Evento deixadas viradas para cima como lembrete ainda não estão na Pilha de Descarte de Jogadores, portanto o Planejador de Contingência não pode pegá-las."
        ]
      }
    },
    {
      id: "dispatcher",
      book: "core",
      page: 8,
      requires: null,
      replaces: null,
      name: { en: "Dispatcher", pt: "Despachante (Dispatcher)" },
      color: { en: "Magenta", pt: "Magenta" },
      card: {
        en: [
          "Move another player's pawn as if it were yours.",
          "As an action, move any pawn to a city with another pawn."
        ],
        pt: [
          "Mova o peão (pawn) de outro jogador como se fosse o seu.",
          "Como ação, mova qualquer peão (pawn) para uma cidade que contenha outro peão."
        ]
      },
      limit: null,
      notes: {
        en: [
          "The role card also prints: Get permission before moving another player's pawn.",
          "Moving any pawn to a city containing another pawn requires its owner's agreement.",
          "When moving a player's pawn as if it were your own, discard cards for Direct and Charter Flights from your own hand.",
          "A card discarded for a Charter Flight must match the city the pawn is moving from.",
          "The Dispatcher can only move other players' pawns; he may not direct them to do other actions, such as Treat Disease.",
          "The Dispatcher may not use the Operations Expert's special move ability when moving the Operations Expert's pawn.",
          "The Medic's automatic removal of cubes of cured diseases still happens when the Dispatcher moves him.",
          "On the Brink: pawns affected by the Virulent Strain effect Government Interference cannot be moved by the Dispatcher unless the current player first Treats a cube in the same city as the pawn being moved.",
          "State of Emergency: the Emergency Event CDC Planes Grounded does not prevent the Dispatcher from moving pawns to other pawns."
        ],
        pt: [
          "A carta de função também traz impresso: peça permissão antes de mover o peão (pawn) de outro jogador.",
          "Mover um peão qualquer para uma cidade que contenha outro peão exige a concordância do dono do peão movido.",
          "Ao mover o peão de outro jogador como se fosse o seu, descarte as cartas de Voo Direto (Direct Flight) e Voo Fretado (Charter Flight) da sua própria mão.",
          "A carta descartada para um Voo Fretado deve corresponder à cidade de onde o peão está saindo.",
          "O Despachante só pode mover os peões dos outros jogadores; ele não pode mandá-los executar outras ações, como Tratar Doença (Treat Disease).",
          "O Despachante não pode usar a habilidade especial de movimento do Especialista em Operações (Operations Expert) ao mover o peão dele.",
          "A remoção automática de cubos de doenças curadas feita pelo Médico (Medic) continua valendo quando o Despachante o move.",
          "On the Brink: peões afetados pelo efeito Interferência do Governo (Government Interference) da Cepa Virulenta (Virulent Strain) não podem ser movidos pelo Despachante, a menos que o jogador da vez primeiro Trate um cubo na mesma cidade do peão a ser movido.",
          "State of Emergency: o Evento de Emergência Aviões do CDC em Terra (CDC Planes Grounded) não impede o Despachante de mover peões até outros peões."
        ]
      }
    },
    {
      id: "medic",
      book: "core",
      page: 8,
      requires: null,
      replaces: null,
      name: { en: "Medic", pt: "Médico (Medic)" },
      color: { en: "Orange", pt: "Laranja" },
      card: {
        en: [
          "Remove all cubes of one color when doing Treat Disease.",
          "Automatically remove cubes of cured diseases from the city you are in (and prevent them from being placed there)."
        ],
        pt: [
          "Remova todos os cubos de uma cor ao executar Tratar Doença (Treat Disease).",
          "Remova automaticamente os cubos de doenças já curadas da cidade em que você está (e impeça que sejam colocados ali)."
        ]
      },
      limit: null,
      notes: {
        en: [
          "The Medic removes all cubes of the same color, not 1, when doing the Treat Disease action.",
          "If a disease has been cured, he automatically removes all cubes of that color from a city simply by entering it or being there; this does not take an action.",
          "The Medic's automatic removal of cubes can occur on other players' turns, if he is moved by the Dispatcher or the Airlift Event.",
          "The Medic also prevents placing disease cubes (and outbreaks) of cured diseases in his location.",
          "State of Emergency: in the Superbug challenge, use the Superbug version of this role card instead."
        ],
        pt: [
          "O Médico remove todos os cubos de uma mesma cor, e não apenas 1, ao executar a ação Tratar Doença (Treat Disease).",
          "Se uma doença já foi curada, ele remove automaticamente todos os cubos daquela cor de uma cidade apenas por entrar nela ou por estar nela; isso não custa ação.",
          "Essa remoção automática pode ocorrer no turno de outros jogadores, caso ele seja movido pelo Despachante (Dispatcher) ou pelo Evento Ponte Aérea (Airlift).",
          "O Médico também impede a colocação de cubos de doença (e surtos) de doenças curadas no local onde está.",
          "State of Emergency: no desafio Superbactéria (Superbug), use a versão Superbactéria desta carta de função no lugar desta."
        ]
      }
    },
    {
      id: "operations-expert",
      book: "core",
      page: 8,
      requires: null,
      replaces: null,
      name: { en: "Operations Expert", pt: "Especialista em Operações (Operations Expert)" },
      color: { en: "Light green (lime)", pt: "Verde-claro (limão)" },
      card: {
        en: [
          "As an action, build a research station in the city you are in (no City card needed).",
          "Once per turn as an action, move from a research station to any city by discarding any City card."
        ],
        pt: [
          "Como ação, construa uma Estação de Pesquisa (Research Station) na cidade em que você está (sem precisar de Carta de Cidade / City card).",
          "Uma vez por turno, como ação, mova-se de uma Estação de Pesquisa para qualquer cidade descartando uma Carta de Cidade qualquer."
        ]
      },
      limit: null,
      notes: {
        en: [
          "The special move costs 1 action and may be used only once per turn.",
          "The role card prints the move as \"Once per turn as an action\", while the prose lists it among the actions he \"may, as an action,\" do; the manual leaves the phrasing slightly different, but both readings mean the same thing.",
          "He builds a research station in his current city without discarding (or using) a City card.",
          "The Dispatcher may not use the Operations Expert's special move ability when moving the Operations Expert's pawn.",
          "State of Emergency: as Hinterlands spaces have no City cards, research stations may be built there only by the Event Government Grant or the Operations Expert's ability.",
          "State of Emergency: in the Superbug challenge he can use his special movement ability from a vaccine factory.",
          "State of Emergency: the Emergency Event CDC Planes Grounded does not prevent his discard-to-move ability."
        ],
        pt: [
          "O movimento especial custa 1 ação e pode ser usado apenas uma vez por turno.",
          "A carta de função imprime o movimento como \"uma vez por turno, como ação\", enquanto o texto do manual o lista entre as ações que ele \"pode, como ação,\" executar; o manual mantém as duas redações ligeiramente diferentes, mas ambas significam o mesmo.",
          "Ele constrói uma Estação de Pesquisa (Research Station) na cidade onde está sem descartar (nem usar) uma Carta de Cidade (City card).",
          "O Despachante (Dispatcher) não pode usar a habilidade especial de movimento do Especialista em Operações ao mover o peão (pawn) dele.",
          "State of Emergency: como os espaços de Hinterlands não têm Cartas de Cidade, só é possível construir Estações de Pesquisa neles com o Evento Subvenção do Governo (Government Grant) ou com a habilidade do Especialista em Operações.",
          "State of Emergency: no desafio Superbactéria (Superbug), ele pode usar sua habilidade especial de movimento a partir de uma fábrica de vacinas (vaccine factory).",
          "State of Emergency: o Evento de Emergência Aviões do CDC em Terra (CDC Planes Grounded) não impede a habilidade dele de descartar para se mover."
        ]
      }
    },
    {
      id: "quarantine-specialist",
      book: "core",
      page: 8,
      requires: null,
      replaces: null,
      name: { en: "Quarantine Specialist", pt: "Especialista em Quarentena (Quarantine Specialist)" },
      color: { en: "Dark green", pt: "Verde-escuro" },
      card: {
        en: [
          "Prevent disease cube placements (and outbreaks) in the city you are in and all cities connected to it."
        ],
        pt: [
          "Impeça a colocação de cubos de doença (e surtos / outbreaks) na cidade em que você está e em todas as cidades conectadas a ela."
        ]
      },
      limit: null,
      notes: {
        en: [
          "She does not affect cubes placed during setup.",
          "State of Emergency: if she prevents outbreaks or cube placements in a city with a quarantine marker, that marker is not flipped over or removed.",
          "State of Emergency: in the Superbug challenge, her ability is one of the ways purple cubes can be prevented from being placed."
        ],
        pt: [
          "Ela não afeta os cubos colocados durante a preparação (setup).",
          "State of Emergency: se ela impedir surtos (outbreaks) ou a colocação de cubos em uma cidade com marcador de quarentena (quarantine marker), esse marcador não é virado nem removido.",
          "State of Emergency: no desafio Superbactéria (Superbug), a habilidade dela é uma das formas de impedir a colocação de cubos roxos."
        ]
      }
    },
    {
      id: "researcher",
      book: "core",
      page: 8,
      requires: null,
      replaces: null,
      name: { en: "Researcher", pt: "Pesquisadora (Researcher)" },
      color: { en: "Brown", pt: "Marrom" },
      card: {
        en: [
          "You may give any 1 of your City cards when you Share Knowledge. It need not match your city. A player who Shares Knowledge with you on their turn can take any 1 of your City cards."
        ],
        pt: [
          "Você pode dar qualquer 1 das suas Cartas de Cidade (City cards) ao Compartilhar Conhecimento (Share Knowledge). Ela não precisa corresponder à sua cidade. Um jogador que Compartilhar Conhecimento com você no turno dele pode pegar qualquer 1 das suas Cartas de Cidade."
        ]
      },
      limit: null,
      notes: {
        en: [
          "The transfer must be from her hand to the other player's hand, but it can occur on either player's turn.",
          "Commonly Overlooked Rules: on your turn, you may take any City card from the Researcher (only), if you are both in the same city.",
          "In the Lab: in the Lab challenge, use the Lab version of the Researcher instead of this card."
        ],
        pt: [
          "A transferência deve ser da mão dela para a mão do outro jogador, mas pode acontecer no turno de qualquer um dos dois.",
          "Regras Frequentemente Esquecidas: no seu turno, você pode pegar qualquer Carta de Cidade (City card) da Pesquisadora (e somente dela), se ambos estiverem na mesma cidade.",
          "In the Lab: no desafio Laboratório (Lab), use a versão de Laboratório da Pesquisadora no lugar desta carta."
        ]
      }
    },
    {
      id: "scientist",
      book: "core",
      page: 8,
      requires: null,
      replaces: null,
      name: { en: "Scientist", pt: "Cientista (Scientist)" },
      color: { en: "White (light grey)", pt: "Branco (cinza-claro)" },
      card: {
        en: [
          "You need only 4 cards of the same color to do the Discover a Cure action."
        ],
        pt: [
          "Você precisa de apenas 4 cartas da mesma cor para executar a ação Descobrir a Cura (Discover a Cure)."
        ]
      },
      limit: null,
      notes: {
        en: [
          "The Scientist needs only 4 (not 5) City cards of the same disease color to Discover a Cure for that disease.",
          "On the Brink: under the Virulent Strain effect Complex Molecular Structure, the Scientist would turn in 5 cards to cure the Virulent Strain.",
          "In the Lab: in the Lab challenge a cure costs 3 City cards, and effects that change that number apply to 3, so the Scientist discards 2."
        ],
        pt: [
          "O Cientista precisa de apenas 4 (e não 5) Cartas de Cidade (City cards) da mesma cor de doença para Descobrir a Cura (Discover a Cure) daquela doença.",
          "On the Brink: sob o efeito Estrutura Molecular Complexa (Complex Molecular Structure) da Cepa Virulenta (Virulent Strain), o Cientista entregaria 5 cartas para curar a Cepa Virulenta.",
          "In the Lab: no desafio Laboratório (Lab) a cura custa 3 Cartas de Cidade, e os efeitos que alteram esse número se aplicam a 3; assim, o Cientista descarta 2."
        ]
      }
    },
    {
      id: "archivist",
      book: "otb",
      page: 8,
      requires: null,
      replaces: null,
      name: { en: "Archivist", pt: "Arquivista (Archivist)" },
      color: { en: "Blue", pt: "Azul" },
      card: {
        en: [
          "Your hand limit is 8 cards.",
          "Once per turn, as an action, you may take the City card that matches the city you are in from the Player Discard Pile into your hand."
        ],
        pt: [
          "Seu limite de mão (hand limit) é de 8 cartas.",
          "Uma vez por turno, como ação, você pode pegar da Pilha de Descarte de Jogadores (Player Discard Pile) para a sua mão a Carta de Cidade (City card) correspondente à cidade em que você está."
        ]
      },
      limit: null,
      notes: {
        en: [
          "Players may not freely discard cards for the Archivist to retrieve; they may discard only by doing an action requiring a discard or when over their hand limits.",
          "State of Emergency: the Emergency Event Limited Options reduces the Archivist's hand limit to 7, not 6."
        ],
        pt: [
          "Os jogadores não podem descartar cartas livremente para o Arquivista recuperá-las; só podem descartar ao executar uma ação que exija descarte ou quando estiverem acima do limite de mão (hand limit).",
          "State of Emergency: o Evento de Emergência Opções Limitadas (Limited Options) reduz o limite de mão do Arquivista para 7, e não para 6."
        ]
      }
    },
    {
      id: "containment-specialist",
      book: "otb",
      page: 8,
      requires: null,
      replaces: null,
      name: { en: "Containment Specialist", pt: "Especialista em Contenção (Containment Specialist)" },
      color: { en: "Cream (tan)", pt: "Creme (bege)" },
      card: {
        en: [
          "When you enter a city with 2 or more disease cubes of the same color, remove 1 of them."
        ],
        pt: [
          "Quando você entrar em uma cidade com 2 ou mais cubos de doença da mesma cor, remova 1 deles."
        ]
      },
      limit: null,
      notes: {
        en: [
          "He does this when moved by others (the Dispatcher or the Events Airlift and Special Orders).",
          "If several diseases with 2 or more cubes are present, he removes 1 cube from each of these diseases.",
          "With the Event Mobile Hospital he first removes 1 cube of each color with 2 or more cubes present, and then removes 1 more cube, for each city entered.",
          "Removing (but not Treating) a Virulent Strain disease cube with his power does not satisfy the Government Interference effect's requirement.",
          "In the Lab: the Event Improved Sanitation affects only cubes removed by Treat Disease actions, not cubes removed by the Containment Specialist's ability."
        ],
        pt: [
          "Ele faz isso mesmo quando é movido por outros (pelo Despachante / Dispatcher ou pelos Eventos Ponte Aérea / Airlift e Ordens Especiais / Special Orders).",
          "Se houver várias doenças com 2 ou mais cubos presentes, ele remove 1 cubo de cada uma dessas doenças.",
          "Com o Evento Hospital Móvel (Mobile Hospital), ele primeiro remove 1 cubo de cada cor que tenha 2 ou mais cubos presentes e depois remove mais 1 cubo, a cada cidade em que entra.",
          "Remover (mas não Tratar) um cubo da Cepa Virulenta (Virulent Strain) com o poder dele não satisfaz a exigência do efeito Interferência do Governo (Government Interference).",
          "In the Lab: o Evento Saneamento Aprimorado (Improved Sanitation) afeta apenas os cubos removidos por ações Tratar Doença (Treat Disease), e não os removidos pela habilidade do Especialista em Contenção."
        ]
      }
    },
    {
      id: "epidemiologist",
      book: "otb",
      page: 8,
      requires: null,
      replaces: null,
      name: { en: "Epidemiologist", pt: "Epidemiologista (Epidemiologist)" },
      color: { en: "Pale pink", pt: "Rosa-claro" },
      card: {
        en: [
          "Once during your turn, you may (with permission) take any City card from a player in the same city with you. Doing this is not an action."
        ],
        pt: [
          "Uma vez durante o seu turno, você pode (com permissão) pegar qualquer Carta de Cidade (City card) de um jogador que esteja na mesma cidade que você. Fazer isso não é uma ação."
        ]
      },
      limit: null,
      notes: {
        en: [
          "She may do this once per turn and on her turn only; the other player must agree.",
          "In the Lab: in the Lab challenge, use the Lab version of the Epidemiologist instead of this card."
        ],
        pt: [
          "Ela pode fazer isso uma vez por turno e somente no turno dela; o outro jogador precisa concordar.",
          "In the Lab: no desafio Laboratório (Lab), use a versão de Laboratório da Epidemiologista no lugar desta carta."
        ]
      }
    },
    {
      id: "field-operative",
      book: "otb",
      page: 8,
      requires: null,
      replaces: null,
      excludedBy: ["lab"],
      name: { en: "Field Operative", pt: "Agente de Campo (Field Operative)" },
      color: { en: "Yellow", pt: "Amarelo" },
      card: {
        en: [
          "Once per turn, as an action, you may move 1 disease cube from the city you are in onto this Role card.",
          "When you Discover a Cure, you may replace 2 of the needed City cards with 3 cubes of the cure color from this card."
        ],
        pt: [
          "Uma vez por turno, como ação, você pode mover 1 cubo de doença da cidade em que está para esta carta de função.",
          "Ao Descobrir a Cura (Discover a Cure), você pode substituir 2 das Cartas de Cidade (City cards) necessárias por 3 cubos da cor da cura que estejam nesta carta."
        ]
      },
      limit: null,
      notes: {
        en: [
          "The cube moved onto his role card is kept there as a sample.",
          "When he Discovers a Cure, he may replace exactly 2 of the needed City cards by returning 3 cubes of the cure color from his role card to the supply.",
          "He may return sample cubes from his role card back to the supply at any time, following the Event card timing rules.",
          "In the Lab: do not use the Field Operative role in the Lab challenge.",
          "On the Brink: under Complex Molecular Structure he could turn in 4 cards and 3 Virulent Strain samples to cure the Virulent Strain.",
          "Removing (but not Treating) a Virulent Strain disease cube with his sample power does not satisfy the Government Interference effect's requirement.",
          "In the Lab: the Event Improved Sanitation does not apply to cubes removed by the Field Operative's ability.",
          "State of Emergency: the Field Operative may not sample purple Superbug cubes."
        ],
        pt: [
          "O cubo movido para a carta de função dele fica ali como amostra.",
          "Ao Descobrir a Cura (Discover a Cure), ele pode substituir exatamente 2 das Cartas de Cidade (City cards) necessárias devolvendo ao estoque 3 cubos da cor da cura que estejam na carta de função dele.",
          "Ele pode devolver os cubos-amostra da carta de função ao estoque a qualquer momento, seguindo as regras de momento de uso das cartas de Evento (Event cards).",
          "In the Lab: não use a função Agente de Campo no desafio Laboratório (Lab).",
          "On the Brink: sob o efeito Estrutura Molecular Complexa (Complex Molecular Structure), ele poderia entregar 4 cartas e 3 amostras da Cepa Virulenta (Virulent Strain) para curá-la.",
          "Remover (mas não Tratar) um cubo da Cepa Virulenta com o poder de amostra dele não satisfaz a exigência do efeito Interferência do Governo (Government Interference).",
          "In the Lab: o Evento Saneamento Aprimorado (Improved Sanitation) não se aplica aos cubos removidos pela habilidade do Agente de Campo.",
          "State of Emergency: o Agente de Campo não pode recolher amostras de cubos roxos da Superbactéria (Superbug)."
        ]
      }
    },
    {
      id: "generalist",
      book: "otb",
      page: 8,
      requires: null,
      replaces: null,
      name: { en: "Generalist", pt: "Generalista (Generalist)" },
      color: { en: "Grey (silver)", pt: "Cinza (prateado)" },
      card: {
        en: [
          "You may do up to 5 actions each turn."
        ],
        pt: [
          "Você pode executar até 5 ações por turno."
        ]
      },
      limit: null,
      notes: {
        en: [
          "If the Event New Assignment is played and the current player was selected and swapped either from or to the Generalist role, then he may do up to 5 actions this turn."
        ],
        pt: [
          "Se o Evento Nova Designação (New Assignment) for jogado e o jogador da vez for o escolhido e trocar a função saindo da ou entrando na função Generalista, então ele pode executar até 5 ações neste turno."
        ]
      }
    },
    {
      id: "troubleshooter",
      book: "otb",
      page: 8,
      requires: null,
      replaces: null,
      name: { en: "Troubleshooter", pt: "Solucionadora de Problemas (Troubleshooter)" },
      color: { en: "Red", pt: "Vermelho" },
      card: {
        en: [
          "Start your turn by looking at as many Infection cards as the current infection rate.",
          "When you do a Direct Flight, reveal the City card used (but do not discard it)."
        ],
        pt: [
          "Comece o seu turno olhando tantas cartas de Infecção (Infection cards) quanto for a taxa de infecção (infection rate) atual.",
          "Ao executar um Voo Direto (Direct Flight), revele a Carta de Cidade (City card) usada (mas não a descarte)."
        ]
      },
      limit: null,
      notes: {
        en: [
          "She takes the cards from the top of the Infection Deck, looks at them, and puts them back in the same order.",
          "She reveals the City card used for a Direct Flight to the other players, but does not discard it.",
          "She may reveal the card when moving other pawns via the Event Special Orders, but not when being moved by other players.",
          "In the Mutation challenge, if the Troubleshooter sees a Mutation card, she does not get to look at the bottom Infection Deck card.",
          "If she sees a Virulent Strain city card while Rate Effect is in effect, she does not look at an additional card.",
          "State of Emergency: in the Superbug challenge, do not draw any additional Infection cards when resolving her ability."
        ],
        pt: [
          "Ela pega as cartas do topo do Baralho de Infecção (Infection Deck), olha-as e as devolve na mesma ordem.",
          "Ela revela aos demais jogadores a Carta de Cidade (City card) usada em um Voo Direto (Direct Flight), mas não a descarta.",
          "Ela pode revelar a carta ao mover outros peões (pawns) com o Evento Ordens Especiais (Special Orders), mas não quando é movida por outros jogadores.",
          "No desafio Mutação (Mutation), se ela vir uma carta de Mutação, não tem direito de olhar a carta do fundo do Baralho de Infecção.",
          "Se ela vir uma carta de cidade da Cepa Virulenta (Virulent Strain) enquanto o efeito Efeito da Taxa (Rate Effect) estiver ativo, ela não olha uma carta adicional.",
          "State of Emergency: no desafio Superbactéria (Superbug), não compre cartas de Infecção adicionais ao resolver a habilidade dela."
        ]
      }
    },
    {
      id: "bio-terrorist",
      book: "otb",
      page: 8,
      requires: "bio-terrorist",
      replaces: null,
      name: { en: "Bio-Terrorist", pt: "Bioterrorista (Bio-Terrorist)" },
      color: { en: "Black", pt: "Preto" },
      card: {
        en: [
          "After each player turn, do up to 2 actions, plus 1 Drive/Ferry action (in any order)."
        ],
        pt: [
          "Após o turno de cada jogador, execute até 2 ações, mais 1 ação Dirigir/Balsa (Drive/Ferry), em qualquer ordem."
        ]
      },
      limit: null,
      notes: {
        en: [
          "The role card prints: Use only in the Bio-Terrorist Challenge.",
          "The Bio-Terrorist is used only in the Bio-Terrorist challenge; use this Role card only when playing that challenge.",
          "State of Emergency: the Emergency Event Limited Options does not affect the Bio-Terrorist player.",
          "State of Emergency: the Emergency Event CDC Planes Grounded does not prevent the Bio-Terrorist's Flight or Escape actions.",
          "State of Emergency: the Quarantines rules can be combined with any challenge except the Bio-Terrorist challenge."
        ],
        pt: [
          "A carta de função traz impresso: use apenas no desafio Bioterrorista (Bio-Terrorist Challenge).",
          "O Bioterrorista é usado somente no desafio Bioterrorista; use esta carta de função apenas quando jogar esse desafio.",
          "State of Emergency: o Evento de Emergência Opções Limitadas (Limited Options) não afeta o jogador Bioterrorista.",
          "State of Emergency: o Evento de Emergência Aviões do CDC em Terra (CDC Planes Grounded) não impede as ações de Voo (Flight) nem de Fuga (Escape) do Bioterrorista.",
          "State of Emergency: as regras de Quarentenas (Quarantines) podem ser combinadas com qualquer desafio, exceto o desafio Bioterrorista."
        ]
      }
    },
    {
      id: "field-director",
      book: "itl",
      page: 8,
      requires: null,
      replaces: null,
      name: { en: "Field Director", pt: "Diretor de Campo (Field Director)" },
      color: { en: "Magenta (dark pink)", pt: "Magenta (rosa-escuro)" },
      card: {
        en: [
          "You may Treat Disease in a city connected to the city you are in.",
          "Once per turn, you may (with permission) move another player's pawn in your city, or a city connected to it, by Drive/Ferry. Doing this is a free bonus action."
        ],
        pt: [
          "Você pode executar Tratar Doença (Treat Disease) em uma cidade conectada à cidade em que você está.",
          "Uma vez por turno, você pode (com permissão) mover por Dirigir/Balsa (Drive/Ferry) o peão (pawn) de outro jogador que esteja na sua cidade ou em uma cidade conectada a ela. Fazer isso é uma ação bônus gratuita."
        ]
      },
      limit: null,
      notes: {
        en: [
          "He may Treat Disease in a city connected to the city he is in, instead of the city he is in.",
          "He must get permission before moving another player's pawn.",
          "The Field Director cannot move the Pilot.",
          "State of Emergency: in the Hinterlands challenge he may Treat Disease in adjacent spaces using Hinterlands connections.",
          "State of Emergency: in the Superbug challenge he may Distribute Vaccine to a city connected to him."
        ],
        pt: [
          "Ele pode executar Tratar Doença (Treat Disease) em uma cidade conectada à cidade em que está, em vez da própria cidade onde está.",
          "Ele precisa pedir permissão antes de mover o peão (pawn) de outro jogador.",
          "O Diretor de Campo não pode mover o Piloto (Pilot).",
          "State of Emergency: no desafio Hinterlands, ele pode executar Tratar Doença em espaços adjacentes usando as conexões de Hinterlands.",
          "State of Emergency: no desafio Superbactéria (Superbug), ele pode executar Distribuir Vacina (Distribute Vaccine) em uma cidade conectada à dele."
        ]
      }
    },
    {
      id: "virologist",
      book: "itl",
      page: 8,
      requires: null,
      replaces: null,
      name: { en: "Virologist", pt: "Virologista (Virologist)" },
      color: { en: "Green", pt: "Verde" },
      card: {
        en: [
          "When you Discover a Cure, you may discard 2 City cards of the same color to replace 1 City card of the cure color.",
          "As an action, discard a City card to remove 1 cube of its color from any city, returning it to the supply."
        ],
        pt: [
          "Ao Descobrir a Cura (Discover a Cure), você pode descartar 2 Cartas de Cidade (City cards) da mesma cor para substituir 1 Carta de Cidade da cor da cura.",
          "Como ação, descarte uma Carta de Cidade para remover 1 cubo da cor dela de qualquer cidade, devolvendo-o ao estoque."
        ]
      },
      limit: null,
      notes: {
        en: [
          "She may discard several pairs of City cards to Discover a Cure; for example, she could discard 2 yellow, 2 blue and 3 red City cards to Discover a Cure for the red disease.",
          "In the Lab challenge, effects that change the number of cards needed to Discover a Cure apply to the Lab requirement of 3, not the base requirement of 5."
        ],
        pt: [
          "Ela pode descartar vários pares de Cartas de Cidade (City cards) para Descobrir a Cura (Discover a Cure); por exemplo, poderia descartar 2 cartas amarelas, 2 azuis e 3 vermelhas para curar a doença vermelha.",
          "No desafio Laboratório (Lab), os efeitos que alteram a quantidade de cartas para Descobrir a Cura se aplicam à exigência de 3 cartas do Laboratório, e não à exigência básica de 5."
        ]
      }
    },
    {
      id: "local-liaison",
      book: "itl",
      page: 8,
      requires: null,
      replaces: null,
      name: { en: "Local Liaison", pt: "Ligação Local (Local Liaison)" },
      color: { en: "Pink", pt: "Rosa" },
      card: {
        en: [
          "Once during your turn, as an action, you may give a City card that matches the color of the city you are in to a player in any city of the same color.",
          "Lab Challenge: once per turn, at a research station, you may either Characterize a Disease or Test a Cure as a free bonus action."
        ],
        pt: [
          "Uma vez durante o seu turno, como ação, você pode dar uma Carta de Cidade (City card) que corresponda à cor da cidade em que você está a um jogador em qualquer cidade da mesma cor.",
          "Desafio Laboratório (Lab Challenge): uma vez por turno, em uma Estação de Pesquisa (Research Station), você pode executar Caracterizar uma Doença (Characterize a Disease) ou Testar uma Cura (Test a Cure) como ação bônus gratuita."
        ]
      },
      limit: null,
      notes: {
        en: [
          "Giving the card is an action, which she may do once a turn and only on her turn.",
          "Her second ability is used only in the Lab challenge."
        ],
        pt: [
          "Dar a carta é uma ação, que ela pode executar uma vez por turno e somente no turno dela.",
          "A segunda habilidade dela é usada apenas no desafio Laboratório (Lab)."
        ]
      }
    },
    {
      id: "pilot",
      book: "itl",
      page: 8,
      requires: null,
      replaces: null,
      name: { en: "Pilot", pt: "Piloto (Pilot)" },
      color: { en: "Light blue", pt: "Azul-claro" },
      card: {
        en: [
          "You cannot do movement actions (Drive/Ferry or flights), nor build research stations.",
          "You may, as an action, fly to any city within 3 connections of the city you are in, skipping cities in between. You may (with permission) take 1 other pawn with you."
        ],
        pt: [
          "Você não pode executar ações de movimento (Dirigir/Balsa / Drive/Ferry nem voos) nem construir Estações de Pesquisa (Research Stations).",
          "Você pode, como ação, voar para qualquer cidade a até 3 conexões da cidade em que está, pulando as cidades intermediárias. Você pode (com permissão) levar 1 outro peão (pawn) com você."
        ]
      },
      limit: null,
      notes: {
        en: [
          "He must get permission before taking along another player's pawn, and it must be in the same city as he is.",
          "Passenger abilities that occur when a city is entered, such as the Containment Specialist's ability, affect only the city moved to, not cities in between.",
          "When moved by the Dispatcher or the Event Special Orders, the Pilot may not fly and instead uses the normal movement actions.",
          "The Field Director cannot move the Pilot.",
          "State of Emergency: the Pilot may fly in or out of a Hinterlands space, but cannot fly through a Hinterlands space in a single action."
        ],
        pt: [
          "Ele precisa pedir permissão antes de levar o peão (pawn) de outro jogador, e esse peão deve estar na mesma cidade que ele.",
          "Habilidades do passageiro que acontecem ao entrar em uma cidade, como a do Especialista em Contenção (Containment Specialist), afetam apenas a cidade de destino, e não as cidades intermediárias.",
          "Quando é movido pelo Despachante (Dispatcher) ou pelo Evento Ordens Especiais (Special Orders), o Piloto não pode voar e usa as ações normais de movimento.",
          "O Diretor de Campo (Field Director) não pode mover o Piloto.",
          "State of Emergency: o Piloto pode voar para dentro ou para fora de um espaço de Hinterlands, mas não pode voar através de um espaço de Hinterlands em uma única ação."
        ]
      }
    },
    {
      id: "epidemiologist-lab",
      book: "itl",
      page: 8,
      requires: "lab",
      replaces: "epidemiologist",
      name: { en: "Epidemiologist (Lab version)", pt: "Epidemiologista (Epidemiologist) — versão de Laboratório" },
      color: { en: "Pale pink", pt: "Rosa-claro" },
      card: {
        en: [
          "Once during your turn, you may (with permission) take any City card from a player in the same city with you. Doing this is not an action.",
          "Lab Challenge: once per turn, at a research station, you may Process a Sample as a free bonus action."
        ],
        pt: [
          "Uma vez durante o seu turno, você pode (com permissão) pegar qualquer Carta de Cidade (City card) de um jogador que esteja na mesma cidade que você. Fazer isso não é uma ação.",
          "Desafio Laboratório (Lab Challenge): uma vez por turno, em uma Estação de Pesquisa (Research Station), você pode executar Processar uma Amostra (Process a Sample) como ação bônus gratuita."
        ]
      },
      limit: null,
      notes: {
        en: [
          "Use the Lab version of the Epidemiologist only when playing the Lab challenge.",
          "In the Lab challenge she may Process a Sample as a free bonus action, once during her turn, at a research station.",
          "Her abilities are unchanged except for the new Lab challenge ability."
        ],
        pt: [
          "Use a versão de Laboratório da Epidemiologista apenas quando jogar o desafio Laboratório (Lab).",
          "No desafio Laboratório, ela pode executar Processar uma Amostra (Process a Sample) como ação bônus gratuita, uma vez durante o turno dela, em uma Estação de Pesquisa (Research Station).",
          "As habilidades dela não mudam, exceto pela nova habilidade do desafio Laboratório."
        ]
      }
    },
    {
      id: "researcher-lab",
      book: "itl",
      page: 8,
      requires: "lab",
      replaces: "researcher",
      name: { en: "Researcher (Lab version)", pt: "Pesquisadora (Researcher) — versão de Laboratório" },
      color: { en: "Brown", pt: "Marrom" },
      card: {
        en: [
          "You may give any 1 of your City cards when you Share Knowledge. It need not match your city. A player who Shares Knowledge with you on their turn can take any 1 of your City cards.",
          "Lab Challenge: once per turn, at a research station, you may Sequence a Disease as a free bonus action."
        ],
        pt: [
          "Você pode dar qualquer 1 das suas Cartas de Cidade (City cards) ao Compartilhar Conhecimento (Share Knowledge). Ela não precisa corresponder à sua cidade. Um jogador que Compartilhar Conhecimento com você no turno dele pode pegar qualquer 1 das suas Cartas de Cidade.",
          "Desafio Laboratório (Lab Challenge): uma vez por turno, em uma Estação de Pesquisa (Research Station), você pode executar Sequenciar uma Doença (Sequence a Disease) como ação bônus gratuita."
        ]
      },
      limit: null,
      notes: {
        en: [
          "Use the Lab version of the Researcher only when playing the Lab challenge.",
          "In the Lab challenge she may Sequence a Disease as a free bonus action, once during her turn, at a research station.",
          "Her abilities are unchanged except for the new Lab challenge ability."
        ],
        pt: [
          "Use a versão de Laboratório da Pesquisadora apenas quando jogar o desafio Laboratório (Lab).",
          "No desafio Laboratório, ela pode executar Sequenciar uma Doença (Sequence a Disease) como ação bônus gratuita, uma vez durante o turno dela, em uma Estação de Pesquisa (Research Station).",
          "As habilidades dela não mudam, exceto pela nova habilidade do desafio Laboratório."
        ]
      }
    },
    {
      id: "colonel",
      book: "soe",
      page: 8,
      requires: "quarantines",
      replaces: null,
      name: { en: "Colonel", pt: "Coronel (Colonel)" },
      color: { en: "Purple", pt: "Roxo" },
      card: {
        en: [
          "When you enter a city with a \"1\" quarantine marker, flip it to its \"2\" side.",
          "As an action, you may discard a City card to place a quarantine marker in any city."
        ],
        pt: [
          "Ao entrar em uma cidade com um marcador de quarentena (quarantine marker) no lado \"1\", vire-o para o lado \"2\".",
          "Como ação, você pode descartar uma Carta de Cidade (City card) para colocar um marcador de quarentena em qualquer cidade."
        ]
      },
      limit: null,
      notes: {
        en: [
          "Use this role only with Quarantines; during setup, add 2 more quarantine markers to the supply.",
          "The role card states the same restriction as: use only with quarantines; use all 6 quarantine markers."
        ],
        pt: [
          "Use esta função apenas com as Quarentenas (Quarantines); durante a preparação, acrescente mais 2 marcadores de quarentena (quarantine markers) ao estoque.",
          "A carta de função expressa a mesma restrição assim: use apenas com quarentenas; use todos os 6 marcadores de quarentena."
        ]
      }
    },
    {
      id: "first-responder",
      book: "soe",
      page: 8,
      requires: null,
      replaces: null,
      name: { en: "First Responder", pt: "Socorrista (First Responder)" },
      color: { en: "Light green", pt: "Verde-claro" },
      card: {
        en: [
          "As an action, she may move to any city with a research station.",
          "After resolving an Epidemic, she may — out of turn — move to the epidemic city and Treat Disease there (before Infections)."
        ],
        pt: [
          "Como ação, ela pode se mover para qualquer cidade que tenha uma Estação de Pesquisa (Research Station).",
          "Depois de resolver uma Epidemia (Epidemic), ela pode — fora do seu turno — mover-se até a cidade da epidemia e executar Tratar Doença (Treat Disease) ali, antes do passo de Infecções (Infections)."
        ]
      },
      limit: null,
      notes: {
        en: [
          "The \"epidemic city\" is the city matching the card drawn from the bottom of the Infection deck during the Infect step of resolving the Epidemic.",
          "State of Emergency: in the Superbug challenge she can use her special movement ability from a vaccine factory."
        ],
        pt: [
          "A \"cidade da epidemia\" é a cidade correspondente à carta comprada do fundo do Baralho de Infecção (Infection deck) durante o passo Infectar (Infect) da resolução da Epidemia (Epidemic).",
          "State of Emergency: no desafio Superbactéria (Superbug), ela pode usar sua habilidade especial de movimento a partir de uma fábrica de vacinas (vaccine factory)."
        ]
      }
    },
    {
      id: "gene-splicer",
      book: "soe",
      page: 8,
      requires: null,
      replaces: null,
      name: { en: "Gene Splicer", pt: "Engenheira Genética (Gene Splicer)" },
      color: { en: "Navy blue", pt: "Azul-marinho" },
      card: {
        en: [
          "You may Discover a Cure at a research station in a city of the color being cured by turning in 2 City cards of the cure color, plus 1 City card each of the 3 other (standard) disease colors."
        ],
        pt: [
          "Você pode Descobrir a Cura (Discover a Cure) em uma Estação de Pesquisa (Research Station) situada em uma cidade da cor que está sendo curada, entregando 2 Cartas de Cidade (City cards) da cor da cura mais 1 Carta de Cidade de cada uma das 3 outras cores (padrão) de doença."
        ]
      },
      limit: null,
      notes: {
        en: [
          "She may, instead, Discover a Cure normally.",
          "The Gene Splicer's ability cannot be used to cure the purple disease (in any challenge).",
          "When playing the In the Lab expansion's Lab challenge, she needs to discard 1 card each of the (standard) non-cure colors to Discover a Cure, in a research station located in a city of the cure color.",
          "If affected by the On the Brink Virulent Strain effect Complex Molecular Structure, she needs to discard 1 additional card of the cure color to Discover a Cure."
        ],
        pt: [
          "Ela pode, em vez disso, Descobrir a Cura (Discover a Cure) normalmente.",
          "A habilidade da Engenheira Genética não pode ser usada para curar a doença roxa (em nenhum desafio).",
          "Ao jogar o desafio Laboratório (Lab) da expansão In the Lab, ela precisa descartar 1 carta de cada uma das cores (padrão) diferentes da cor da cura para Descobrir a Cura, em uma Estação de Pesquisa (Research Station) situada em uma cidade da cor da cura.",
          "Se for afetada pelo efeito Estrutura Molecular Complexa (Complex Molecular Structure) da Cepa Virulenta (Virulent Strain) de On the Brink, ela precisa descartar 1 carta adicional da cor da cura para Descobrir a Cura."
        ]
      }
    },
    {
      id: "pharmacist",
      book: "soe",
      page: 8,
      requires: null,
      replaces: null,
      name: { en: "Pharmacist", pt: "Farmacêutico (Pharmacist)" },
      color: { en: "Pale yellow", pt: "Amarelo-claro" },
      card: {
        en: [
          "As an action, he may reveal a City card to Treat Disease in that city.",
          "In the Superbug challenge, he may instead reveal a City card to Distribute Vaccine in that city.",
          "As an action, he may remove 1 cube of a cured disease from any city to the supply."
        ],
        pt: [
          "Como ação, ele pode revelar uma Carta de Cidade (City card) para executar Tratar Doença (Treat Disease) naquela cidade.",
          "No desafio Superbactéria (Superbug), ele pode revelar uma Carta de Cidade para executar Distribuir Vacina (Distribute Vaccine) naquela cidade.",
          "Como ação, ele pode remover 1 cubo de uma doença já curada de qualquer cidade, devolvendo-o ao estoque."
        ]
      },
      limit: null,
      notes: {
        en: [
          "In the Superbug challenge, he must discard a vaccine dose to Distribute Vaccine.",
          "In the Superbug challenge, cured Superbug disease cubes may be removed by his removal action without a vaccine dose.",
          "When playing the Superbug challenge, the Pharmacist may reveal an Isolated Disease Sample card to remove 1 disease cube of that color from any city of that color."
        ],
        pt: [
          "No desafio Superbactéria, ele precisa descartar uma dose de vacina (vaccine dose) para executar Distribuir Vacina (Distribute Vaccine).",
          "No desafio Superbactéria, cubos da doença roxa já curada podem ser removidos pela ação de remoção dele sem gastar dose de vacina.",
          "Ao jogar o desafio Superbactéria, o Farmacêutico pode revelar uma carta de Amostra Isolada de Doença (Isolated Disease Sample) para remover 1 cubo daquela cor de qualquer cidade daquela cor."
        ]
      }
    },
    {
      id: "veterinarian",
      book: "soe",
      page: 8,
      requires: "hinterlands",
      replaces: null,
      name: { en: "Veterinarian", pt: "Veterinário (Veterinarian)" },
      color: { en: "Copper (orange-brown)", pt: "Cobre (marrom-alaranjado)" },
      card: {
        en: [
          "As an action at a research station, he may move to any Hinterlands space.",
          "In a Hinterlands space, he removes 2 cubes of an uncured disease with Treat Disease (if 2 or more cubes are there)."
        ],
        pt: [
          "Como ação, estando em uma Estação de Pesquisa (Research Station), ele pode se mover para qualquer espaço de Hinterlands.",
          "Em um espaço de Hinterlands, ele remove 2 cubos de uma doença ainda não curada ao executar Tratar Doença (Treat Disease), se houver 2 ou mais cubos ali."
        ]
      },
      limit: null,
      notes: {
        en: [
          "Use this role only in the Hinterlands challenge.",
          "State of Emergency: in the Superbug challenge he can use his special movement ability from a vaccine factory."
        ],
        pt: [
          "Use esta função apenas no desafio Hinterlands.",
          "State of Emergency: no desafio Superbactéria (Superbug), ele pode usar sua habilidade especial de movimento a partir de uma fábrica de vacinas (vaccine factory)."
        ]
      }
    },
    {
      id: "medic-superbug",
      book: "soe",
      page: 8,
      requires: "superbug",
      replaces: "medic",
      name: { en: "Medic (Superbug version)", pt: "Médico (Medic) — versão Superbactéria" },
      color: { en: "Orange", pt: "Laranja" },
      card: {
        en: [
          "Remove all cubes of one color when doing Treat Disease.",
          "Automatically remove cubes of cured diseases from the city you are in — purple cubes require discarding a vaccine dose — and prevent them from being placed there."
        ],
        pt: [
          "Remova todos os cubos de uma cor ao executar Tratar Doença (Treat Disease).",
          "Remova automaticamente os cubos de doenças já curadas da cidade em que você está — cubos roxos exigem descartar uma dose de vacina (vaccine dose) — e impeça que sejam colocados ali."
        ]
      },
      limit: null,
      notes: {
        en: [
          "Use this version only in the Superbug challenge.",
          "When automatically removing cubes of the cured superbug disease in a city, the Medic must also return 1 vaccine dose (or else no cubes are removed). Otherwise, this role is unchanged.",
          "He does this automatically, without using an action, whenever he is in a city with at least 1 purple cube, if he has a vaccine dose on his Role card to discard.",
          "He automatically prevents placement of new purple cubes in his city — once the purple disease has been cured — without using vaccine doses.",
          "The manual shows this card only as a small thumbnail; the page 8 rules text is the authoritative wording and the card bullets above follow it."
        ],
        pt: [
          "Use esta versão apenas no desafio Superbactéria (Superbug).",
          "Ao remover automaticamente os cubos da superbactéria já curada em uma cidade, o Médico precisa também devolver 1 dose de vacina (vaccine dose), ou nenhum cubo é removido. Fora isso, esta função não muda.",
          "Ele faz isso automaticamente, sem gastar ação, sempre que estiver em uma cidade com ao menos 1 cubo roxo, desde que tenha uma dose de vacina na carta de função para descartar.",
          "Ele impede automaticamente a colocação de novos cubos roxos na cidade onde está — depois que a doença roxa é curada — sem gastar doses de vacina.",
          "O manual mostra esta carta apenas como uma miniatura pequena; o texto de regras da página 8 é a redação autoritativa, e os tópicos da carta acima a seguem."
        ]
      }
    }
  ];
  // <<<DATA:EVENTS>>>
  const EVENTS = [
  {
      id: "airlift",
      book: "core",
      page: 7,
      deck: "player",
      requires: null,
      name: { en: "Airlift", pt: "Ponte Aérea (Airlift)" },
      text: {
        en: "Move any 1 pawn to any city. Get permission before moving another player's pawn.",
        pt: "Mova 1 peão qualquer para qualquer cidade. Peça permissão antes de mover o peão de outro jogador."
      },
      textOnCard: false,
      notes: {
        en: [
          "Timing (core, p. 7): like every Event, Airlift cannot be played between drawing and resolving a card. If the first Infection card drawn causes an outbreak, you may not play Airlift to move the Quarantine Specialist to prevent it; once that outbreak is resolved you may play it, before the next Infection card is flipped over.",
          "Core, p. 8: the Medic automatically removes cubes of cured diseases when Airlift moves him, even on another player's turn.",
          "On the Brink, p. 8: the Containment Specialist also uses her ability when she is moved by Airlift.",
          "On the Brink, p. 3: a pawn affected by the Virulent Strain effect Government Interference cannot be moved by Airlift unless the current player first treats a cube in the city that pawn is in.",
          "State of Emergency, p. 3: in the Hinterlands challenge, Airlift is one of the few ways to fly a pawn into a Hinterlands space, since those spaces have no City cards.",
          "State of Emergency, p. 4: while the Emergency Event CDC Planes Grounded is face up, Airlift cannot be used."
        ],
        pt: [
          "Momento de jogo (manual básico, p. 7): como todo Evento, a Ponte Aérea não pode ser jogada entre comprar uma carta e resolvê-la. Se a primeira carta de Infecção (Infection card) comprada causar um surto, você não pode jogar a Ponte Aérea para mover a Especialista em Quarentena (Quarantine Specialist) e evitá-lo; depois que o surto for resolvido, você pode jogá-la, antes de virar a próxima carta de Infecção.",
          "Manual básico, p. 8: o Médico (Medic) remove automaticamente os cubos de doenças curadas quando a Ponte Aérea o move, mesmo no turno de outro jogador.",
          "On the Brink, p. 8: a Especialista em Contenção (Containment Specialist) também usa sua habilidade quando é movida pela Ponte Aérea.",
          "On the Brink, p. 3: um peão afetado pelo efeito Interferência do Governo (Government Interference) da Cepa Virulenta (Virulent Strain) não pode ser movido pela Ponte Aérea, a menos que o jogador da vez primeiro trate um cubo na cidade em que esse peão está.",
          "State of Emergency, p. 3: no desafio Hinterlands, a Ponte Aérea é uma das poucas formas de levar um peão por via aérea até um espaço Hinterlands, já que esses espaços não têm cartas de Cidade (City cards).",
          "State of Emergency, p. 4: enquanto o Evento de Emergência (Emergency Event) Aviões do CDC em Terra (CDC Planes Grounded) estiver virado para cima, a Ponte Aérea não pode ser usada."
        ]
      }
    },
    {
      id: "forecast",
      book: "core",
      page: 7,
      deck: "player",
      requires: null,
      name: { en: "Forecast", pt: "Previsão (Forecast)" },
      text: null,
      textOnCard: true,
      notes: {
        en: [
          "State of Emergency, p. 6: in the Superbug challenge, do not draw any additional Infection cards when resolving the Event Forecast."
        ],
        pt: [
          "State of Emergency, p. 6: no desafio Superbug, não compre nenhuma carta de Infecção (Infection card) adicional ao resolver o Evento Previsão."
        ]
      }
    },
    {
      id: "government-grant",
      book: "core",
      page: 7,
      deck: "player",
      requires: null,
      name: { en: "Government Grant", pt: "Verba do Governo (Government Grant)" },
      text: null,
      textOnCard: true,
      notes: {
        en: [
          "In the Lab, p. 4: when a research station is placed with the Event Government Grant, the player may still do a bonus lab action, even if the new research station is not in the city that player is in.",
          "State of Emergency, p. 3: Hinterlands spaces have no City cards, so a research station can be built there only with Government Grant or the Operations Expert's ability."
        ],
        pt: [
          "In the Lab, p. 4: quando uma Estação de Pesquisa (Research Station) é colocada com o Evento Verba do Governo, o jogador ainda pode fazer uma ação bônus de laboratório, mesmo que a nova estação não esteja na cidade em que ele se encontra.",
          "State of Emergency, p. 3: os espaços Hinterlands não possuem cartas de Cidade (City cards), então só é possível construir uma Estação de Pesquisa neles com a Verba do Governo ou com a habilidade do Especialista em Operações (Operations Expert)."
        ]
      }
    },
    {
      id: "one-quiet-night",
      book: "core",
      page: 7,
      deck: "player",
      requires: null,
      name: { en: "One Quiet Night", pt: "Uma Noite Tranquila (One Quiet Night)" },
      text: {
        en: "Skip the next Infect Cities step (do not flip over any Infection cards).",
        pt: "Pule a próxima etapa Infectar Cidades (Infect Cities) — não vire nenhuma carta de Infecção (Infection card)."
      },
      textOnCard: false,
      notes: {
        en: [
          "State of Emergency, p. 3: do not roll the Hinterlands die if One Quiet Night is played to skip Infections."
        ],
        pt: [
          "State of Emergency, p. 3: não role o dado Hinterlands se Uma Noite Tranquila for jogada para pular as Infecções."
        ]
      }
    },
    {
      id: "resilient-population",
      book: "core",
      page: 7,
      deck: "player",
      requires: null,
      name: { en: "Resilient Population", pt: "População Resiliente (Resilient Population)" },
      text: {
        en: "Remove any 1 card in the Infection Discard Pile from the game. You may play this between the Infect and Intensify steps of an Epidemic.",
        pt: "Remova do jogo 1 carta qualquer da Pilha de Descarte de Infecção (Infection Discard Pile). Você pode jogar esta carta entre as etapas Infectar (Infect) e Intensificar (Intensify) de uma Epidemia."
      },
      textOnCard: false,
      notes: {
        en: [
          "On the Brink, p. 4: Resilient Population cannot be used to remove a Mutation card from the Infection Discard Pile."
        ],
        pt: [
          "On the Brink, p. 4: a População Resiliente não pode ser usada para remover uma carta de Mutação (Mutation card) da Pilha de Descarte de Infecção (Infection Discard Pile)."
        ]
      }
    },
    {
      id: "commercial-travel-ban",
      book: "otb",
      page: 1,
      deck: "player",
      requires: null,
      name: { en: "Commercial Travel Ban", pt: "Proibição de Voos Comerciais (Commercial Travel Ban)" },
      text: {
        en: "The infection rate is 1 until the current player's next turn begins. Put this card in front of this player. Discard it when his next turn begins.",
        pt: "A taxa de infecção passa a ser 1 até o início do próximo turno do jogador da vez. Coloque esta carta à frente desse jogador e descarte-a quando o próximo turno dele começar."
      },
      textOnCard: false,
      notes: {
        en: [
          "On the Brink, p. 2: the new Event cards are simply added to the other Event cards and shuffled; none of them is restricted to a challenge.",
          "On the Brink prints no Fine Point for this Event."
        ],
        pt: [
          "On the Brink, p. 2: as novas cartas de Evento são apenas somadas às demais cartas de Evento e embaralhadas; nenhuma delas é restrita a um desafio.",
          "On the Brink não imprime nenhum Detalhe (Fine Point) para este Evento."
        ]
      }
    },
    {
      id: "special-orders",
      book: "otb",
      page: 1,
      deck: "player",
      requires: null,
      name: { en: "Special Orders", pt: "Ordens Especiais (Special Orders)" },
      text: {
        en: "This turn, the player may spend actions to move 1 other pawn (with permission), as if it were his own.",
        pt: "Neste turno, o jogador pode gastar ações para mover 1 outro peão (com permissão), como se fosse o dele."
      },
      textOnCard: false,
      notes: {
        en: [
          "Fine Point (p. 2): as when moving other pawns with the Dispatcher, the current player must discard (or reveal) any cards used to move that pawn by Direct or Charter Flights. Powers that are part of movement (such as the Medic's power to remove cured disease cubes or the Containment Specialist's power) do occur.",
          "On the Brink, p. 3: a pawn affected by the Virulent Strain effect Government Interference cannot be moved with Special Orders unless the current player first treats a cube in the city that pawn is in."
        ],
        pt: [
          "Detalhe (Fine Point, p. 2): assim como ao mover peões alheios com o Despachante (Dispatcher), o jogador da vez deve descartar (ou revelar) as cartas usadas para mover aquele peão por Voo Direto (Direct Flight) ou Voo Fretado (Charter Flight). Poderes que fazem parte do movimento (como o do Médico (Medic), que remove cubos de doenças curadas, ou o da Especialista em Contenção (Containment Specialist)) continuam valendo.",
          "On the Brink, p. 3: um peão afetado pelo efeito Interferência do Governo (Government Interference) da Cepa Virulenta (Virulent Strain) não pode ser movido com as Ordens Especiais, a menos que o jogador da vez primeiro trate um cubo na cidade em que esse peão está."
        ]
      }
    },
    {
      id: "rapid-vaccine-deployment",
      book: "otb",
      page: 1,
      deck: "player",
      requires: null,
      name: { en: "Rapid Vaccine Deployment", pt: "Distribuição Rápida de Vacina (Rapid Vaccine Deployment)" },
      text: {
        en: "Play immediately after a Discover a Cure action to remove 1-5 cubes of the cured disease. These disease cubes must come from connected cities.",
        pt: "Jogue imediatamente após uma ação Descobrir uma Cura (Discover a Cure) para remover de 1 a 5 cubos da doença curada. Esses cubos devem vir de cidades conectadas entre si."
      },
      textOnCard: false,
      notes: {
        en: [
          "The card's timing line reads \"Play after Cure. Not an action.\" (p. 1).",
          "Fine Point (p. 2): this can be played only immediately after a Discover a Cure action. Each affected city must be connected to at least 1 other city affected by this event (unless this event affects just 1 city). At least 1 cube must be removed from each of these cities.",
          "On the Brink, p. 3: removing a Virulent Strain cube with this Event does not satisfy the Government Interference requirement, because the cube is removed rather than treated."
        ],
        pt: [
          "A linha de tempo impressa na carta diz \"Jogue após a Cura. Não é uma ação.\" (p. 1).",
          "Detalhe (Fine Point, p. 2): só pode ser jogada imediatamente após uma ação Descobrir uma Cura. Cada cidade afetada deve estar conectada a pelo menos 1 outra cidade afetada por este evento (a menos que ele afete apenas 1 cidade). Pelo menos 1 cubo deve ser removido de cada uma dessas cidades.",
          "On the Brink, p. 3: remover um cubo da Cepa Virulenta (Virulent Strain) com este Evento não cumpre a exigência da Interferência do Governo (Government Interference), pois o cubo é removido e não tratado."
        ]
      }
    },
    {
      id: "mobile-hospital",
      book: "otb",
      page: 1,
      deck: "player",
      requires: null,
      name: { en: "Mobile Hospital", pt: "Hospital Móvel (Mobile Hospital)" },
      text: {
        en: "This turn, remove 1 disease cube from each city the player drives/ferries to.",
        pt: "Neste turno, remova 1 cubo de doença de cada cidade para a qual o jogador se mover por Carro/Balsa (Drive/Ferry)."
      },
      textOnCard: false,
      notes: {
        en: [
          "Fine Point (p. 2): the Containment Specialist first removes 1 cube of each color with 2 or more cubes present and then removes 1 more cube (for each city entered).",
          "On the Brink, p. 3: Mobile Hospital does satisfy the Virulent Strain effect Government Interference."
        ],
        pt: [
          "Detalhe (Fine Point, p. 2): a Especialista em Contenção (Containment Specialist) primeiro remove 1 cubo de cada cor que tenha 2 ou mais cubos presentes e depois remove mais 1 cubo (para cada cidade em que entrar).",
          "On the Brink, p. 3: o Hospital Móvel cumpre, sim, a exigência do efeito Interferência do Governo (Government Interference) da Cepa Virulenta (Virulent Strain)."
        ]
      }
    },
    {
      id: "new-assignment",
      book: "otb",
      page: 1,
      deck: "player",
      requires: null,
      name: { en: "New Assignment", pt: "Nova Missão (New Assignment)" },
      text: {
        en: "Select a player. This player may swap his Role card with any one of the unused roles.",
        pt: "Escolha um jogador. Esse jogador pode trocar sua carta de Função (Role card) por qualquer uma das funções não utilizadas."
      },
      textOnCard: false,
      notes: {
        en: [
          "Fine Point (p. 2): if the current player was selected and he swapped either from or to the Generalist role, then he may do up to 5 actions this turn."
        ],
        pt: [
          "Detalhe (Fine Point, p. 2): se o jogador da vez for o escolhido e ele trocar para a função Generalista (Generalist) — ou deixar de ser o Generalista —, ele pode fazer até 5 ações neste turno."
        ]
      }
    },
    {
      id: "borrowed-time",
      book: "otb",
      page: 1,
      deck: "player",
      requires: null,
      name: { en: "Borrowed Time", pt: "Tempo Emprestado (Borrowed Time)" },
      text: {
        en: "Take 2 extra actions this turn.",
        pt: "Faça 2 ações extras neste turno."
      },
      textOnCard: false,
      notes: {
        en: [
          "Fine Point (p. 2): the player drawing this card may not immediately play it to continue taking actions (as that player is now in the Draw Cards step of his turn)."
        ],
        pt: [
          "Detalhe (Fine Point, p. 2): o jogador que comprar esta carta não pode jogá-la imediatamente para continuar fazendo ações, pois ele já está na etapa Comprar Cartas (Draw Cards) do turno dele."
        ]
      }
    },
    {
      id: "re-examined-research",
      book: "otb",
      page: 1,
      deck: "player",
      requires: null,
      name: { en: "Re-examined Research", pt: "Pesquisa Reexaminada (Re-examined Research)" },
      text: {
        en: "Select a player. This player may draw any 1 City card from the Player Discard Pile into his hand (discarding if over his hand limit).",
        pt: "Escolha um jogador. Esse jogador pode pegar 1 carta de Cidade (City card) qualquer da Pilha de Descarte de Jogadores (Player Discard Pile) para a mão dele (descartando, caso fique acima do limite de mão)."
      },
      textOnCard: false,
      notes: {
        en: [
          "On the Brink prints no Fine Point for this Event."
        ],
        pt: [
          "On the Brink não imprime nenhum Detalhe (Fine Point) para este Evento."
        ]
      }
    },
    {
      id: "remote-treatment",
      book: "otb",
      page: 1,
      deck: "player",
      requires: null,
      name: { en: "Remote Treatment", pt: "Tratamento Remoto (Remote Treatment)" },
      text: {
        en: "Remove 2 disease cubes from the board.",
        pt: "Remova 2 cubos de doença do tabuleiro."
      },
      textOnCard: false,
      notes: {
        en: [
          "On the Brink prints no Fine Point for this Event.",
          "On the Brink, p. 3: removing a Virulent Strain cube with this Event does not satisfy the Government Interference requirement, because the cube is removed rather than treated."
        ],
        pt: [
          "On the Brink não imprime nenhum Detalhe (Fine Point) para este Evento.",
          "On the Brink, p. 3: remover um cubo da Cepa Virulenta (Virulent Strain) com este Evento não cumpre a exigência da Interferência do Governo (Government Interference), pois o cubo é removido e não tratado."
        ]
      }
    },
    {
      id: "infection-zone-ban",
      book: "itl",
      page: 2,
      deck: "player",
      requires: null,
      name: { en: "Infection Zone Ban", pt: "Bloqueio da Zona de Infecção (Infection Zone Ban)" },
      text: {
        en: "Ignore all chain reaction outbreaks until the player's next turn begins. Put this card in front of this player. Discard it when his next turn begins.",
        pt: "Ignore todos os surtos em reação em cadeia até o início do próximo turno deste jogador. Coloque esta carta à frente dele e descarte-a quando o próximo turno dele começar."
      },
      textOnCard: false,
      notes: {
        en: [
          "Fine Point (p. 2): like other Events, this cannot be played between drawing and resolving an Infection or Epidemic card; it must be played before the card is drawn, so you must plan ahead. Outbreaks can still occur; this just prevents any chain reaction outbreaks from being caused by them for 1 round.",
          "Fine Point (p. 2): Event cards placed face up as reminders do not count against a player's hand limit. They are not yet in the Player Discard Pile."
        ],
        pt: [
          "Detalhe (Fine Point, p. 2): como os demais Eventos, esta carta não pode ser jogada entre comprar e resolver uma carta de Infecção (Infection card) ou de Epidemia (Epidemic card); ela precisa ser jogada antes de a carta ser comprada, então é preciso planejar com antecedência. Os surtos continuam acontecendo; o que se evita por 1 rodada são apenas os surtos em reação em cadeia provocados por eles.",
          "Detalhe (Fine Point, p. 2): cartas de Evento deixadas viradas para cima como lembrete não contam para o limite de mão do jogador. Elas ainda não estão na Pilha de Descarte de Jogadores (Player Discard Pile)."
        ]
      }
    },
    {
      id: "improved-sanitation",
      book: "itl",
      page: 2,
      deck: "player",
      requires: null,
      name: { en: "Improved Sanitation", pt: "Saneamento Aprimorado (Improved Sanitation)" },
      text: {
        en: "Treat Disease removes 1 more cube of the same color, if present, until the player's next turn begins. Put this card in front of this player. Discard it when his next turn begins.",
        pt: "A ação Tratar Doença (Treat Disease) remove 1 cubo a mais da mesma cor, se houver, até o início do próximo turno deste jogador. Coloque esta carta à frente dele e descarte-a quando o próximo turno dele começar."
      },
      textOnCard: false,
      notes: {
        en: [
          "Fine Point (p. 2): this Event affects only cubes removed by Treat Disease actions, not cubes removed in other ways, such as role abilities or other Events.",
          "Fine Point (p. 2): Event cards placed face up as reminders do not count against a player's hand limit. They are not yet in the Player Discard Pile."
        ],
        pt: [
          "Detalhe (Fine Point, p. 2): este Evento afeta apenas os cubos removidos por ações Tratar Doença (Treat Disease), e não cubos removidos de outras formas, como habilidades de papéis ou outros Eventos.",
          "Detalhe (Fine Point, p. 2): cartas de Evento deixadas viradas para cima como lembrete não contam para o limite de mão do jogador. Elas ainda não estão na Pilha de Descarte de Jogadores (Player Discard Pile)."
        ]
      }
    },
    {
      id: "sequencing-breakthrough",
      book: "itl",
      page: 2,
      deck: "player",
      requires: null,
      name: { en: "Sequencing Breakthrough", pt: "Avanço no Sequenciamento (Sequencing Breakthrough)" },
      text: {
        en: "Discard 1 fewer City card than needed to do the next Discover a Cure. Put this card next to the Player Discard Pile. Discard it when the next cure is discovered.",
        pt: "Descarte 1 carta de Cidade (City card) a menos do que o necessário para fazer a próxima ação Descobrir uma Cura (Discover a Cure). Coloque esta carta ao lado da Pilha de Descarte de Jogadores (Player Discard Pile) e descarte-a quando a próxima cura for descoberta."
      },
      textOnCard: false,
      notes: {
        en: [
          "Fine Point (p. 2): in the Mutation challenge, the cure cards must still include 1 (or 2) City cards with at least 1 purple cube.",
          "In the Lab, p. 5: effects that change the number of cards discarded apply to 3 cards (not 5) in the Lab challenge, so here Sequencing Breakthrough makes Discover a Cure cost 2 cards.",
          "Fine Point (p. 2): Event cards placed face up as reminders do not count against a player's hand limit. They are not yet in the Player Discard Pile."
        ],
        pt: [
          "Detalhe (Fine Point, p. 2): no desafio Mutação (Mutation), as cartas usadas para a cura ainda precisam incluir 1 (ou 2) cartas de Cidade com pelo menos 1 cubo roxo.",
          "In the Lab, p. 5: efeitos que mudam a quantidade de cartas descartadas se aplicam a 3 cartas (não 5) no desafio do Laboratório (Lab), então ali o Avanço no Sequenciamento faz Descobrir uma Cura custar 2 cartas.",
          "Detalhe (Fine Point, p. 2): cartas de Evento deixadas viradas para cima como lembrete não contam para o limite de mão do jogador. Elas ainda não estão na Pilha de Descarte de Jogadores."
        ]
      }
    },
    {
      id: "emergency-response",
      book: "soe",
      page: 1,
      deck: "player",
      requires: null,
      confidence: "medium",
      name: { en: "Emergency Response", pt: "Resposta de Emergência (Emergency Response)" },
      text: null,
      textOnCard: true,
      notes: {
        en: [
          "Fine Point (p. 2): finish all Epidemic steps. Then, you may play this before doing the next Infections step. The \"epidemic city\" is the city of the card drawn from the bottom of the Infection Deck during the Infect step of resolving the Epidemic."
        ],
        pt: [
          "Detalhe (Fine Point, p. 2): termine todas as etapas da Epidemia. Depois, você pode jogar esta carta antes de fazer a próxima etapa de Infecções. A \"cidade da epidemia\" é a cidade da carta comprada do fundo do Baralho de Infecção durante a etapa Infectar da resolução da Epidemia."
        ]
      }
    },
    {
      id: "advance-team",
      book: "soe",
      page: 1,
      deck: "player",
      requires: null,
      confidence: "medium",
      name: { en: "Advance Team", pt: "Equipe Avançada (Advance Team)" },
      text: null,
      textOnCard: true,
      notes: {
        en: [
          "Fine Point (p. 2): after it is played, this card does not count against a player's hand limit. If adding multiple disease cubes to a city would produce the next outbreak, bring the number of these cubes in that city up to 3 (but do not do the outbreak)."
        ],
        pt: [
          "Detalhe (Fine Point, p. 2): depois de jogada, esta carta não conta para o limite de mão do jogador. Se a colocação de vários cubos de doença em uma cidade fosse provocar o próximo surto, leve a quantidade desses cubos naquela cidade até 3 (mas não faça o surto)."
        ]
      }
    },
    {
      id: "local-initiative",
      book: "soe",
      page: 1,
      deck: "player",
      requires: "quarantines",
      name: { en: "Local Initiative", pt: "Iniciativa Local (Local Initiative)" },
      text: {
        en: "Use only with Quarantines. Place a quarantine marker in any city (without one).",
        pt: "Use apenas com as Quarentenas (Quarantines). Coloque um marcador de quarentena em qualquer cidade que ainda não tenha um."
      },
      textOnCard: false,
      notes: {
        en: [
          "State of Emergency, p. 2 (restriction box): use the Event Local Initiative only when using Quarantines.",
          "State of Emergency, p. 2: a quarantine marker is placed with its \"2\" side face up and prevents the next cube placements or outbreaks in that city.",
        ],
        pt: [
          "State of Emergency, p. 2 (quadro de restrições): use o Evento Iniciativa Local somente quando estiver jogando com as Quarentenas.",
          "State of Emergency, p. 2: o marcador de quarentena é colocado com a face \"2\" virada para cima e impede as próximas colocações de cubos ou surtos naquela cidade.",
        ]
      }
    },
    {
      id: "resource-planning",
      book: "soe",
      page: 1,
      deck: "player",
      requires: null,
      confidence: "medium",
      name: { en: "Resource Planning", pt: "Planejamento de Recursos (Resource Planning)" },
      text: null,
      textOnCard: true,
      notes: {
        en: [
          "Fine Point (p. 2): the hand limit does not apply as you do this Event."
        ],
        pt: [
          "Detalhe (Fine Point, p. 2): o limite de mão não se aplica enquanto você resolve este Evento."
        ]
      }
    },
    {
      id: "sample-delivery",
      book: "soe",
      page: 1,
      deck: "player",
      requires: null,
      confidence: "medium",
      name: { en: "Sample Delivery", pt: "Entrega de Amostras (Sample Delivery)" },
      text: null,
      textOnCard: true,
      notes: { en: [], pt: [] }
    },
    {
      id: "emergency-conference",
      book: "soe",
      page: 1,
      deck: "player",
      requires: null,
      confidence: "medium",
      name: { en: "Emergency Conference", pt: "Conferência de Emergência (Emergency Conference)" },
      text: null,
      textOnCard: true,
      notes: {
        en: [
          "Fine Point (p. 2): this cannot move pawns affected by the On the Brink Virulent Strain effect Government Interference."
        ],
        pt: [
          "Detalhe (Fine Point, p. 2): esta carta não move peões afetados pelo efeito Interferência do Governo da Cepa Virulenta (Virulent Strain) de On the Brink."
        ]
      }
    },
    {
      id: "infection-rumor",
      book: "soe",
      page: 1,
      deck: "player",
      requires: null,
      confidence: "medium",
      name: { en: "Infection Rumor", pt: "Boato de Infecção (Infection Rumor)" },
      text: null,
      textOnCard: true,
      notes: {
        en: [
          "Read the card's timing line before resolving the Infections step."
        ],
        pt: [
          "Leia a linha de tempo da carta antes de resolver a etapa de Infecções."
        ]
      }
    },
    {
      id: "cdc-planes-grounded",
      book: "soe",
      page: 4,
      deck: "emergency-event",
      requires: "emergency-events",
      name: { en: "CDC Planes Grounded", pt: "Aviões do CDC em Terra (CDC Planes Grounded)" },
      text: {
        en: "Players cannot move by Direct, Charter, or Shuttle Flights (or the Event Airlift). Put this card face up. Discard it after playing the next Emergency Event.",
        pt: "Os jogadores não podem se mover por Voo Direto (Direct Flight), Voo Fretado (Charter Flight) nem Voo de Ponte Aérea entre estações (Shuttle Flight), nem pelo Evento Ponte Aérea (Airlift). Deixe esta carta virada para cima e descarte-a depois que o próximo Evento de Emergência (Emergency Event) for jogado."
      },
      textOnCard: false,
      notes: {
        en: [
          "Emergency Event card: read it aloud and follow it immediately when drawn. Emergency Events are not Event cards (p. 4) and do not count against players' hand limits.",
          "This card has a \"continuing effect\" band: leave it face up near the Player Deck as a reminder until it is discarded.",
          "Fine Point (p. 4): this does not prevent the Dispatcher from moving pawns to other pawns, nor the Operations Expert's discard-to-move ability, nor — in other expansions — the Pilot from flying or the Bio-Terrorist's Flight or Escape actions."
        ],
        pt: [
          "Carta de Evento de Emergência (Emergency Event): leia-a em voz alta e siga suas instruções imediatamente ao comprá-la. Eventos de Emergência não são cartas de Evento (p. 4) e não contam para o limite de mão dos jogadores.",
          "Esta carta traz a faixa de \"efeito contínuo\": deixe-a virada para cima perto do Baralho de Jogadores (Player Deck) como lembrete até que seja descartada.",
          "Detalhe (Fine Point, p. 4): isto não impede o Despachante (Dispatcher) de mover peões até outros peões, nem a habilidade do Especialista em Operações (Operations Expert) de descartar para se mover, nem — em outras expansões — o Piloto (Pilot) de voar ou as ações de Voo ou Fuga do Bioterrorista (Bio-Terrorist)."
        ]
      }
    },
    {
      id: "containment-failure",
      book: "soe",
      page: 4,
      deck: "emergency-event",
      requires: "emergency-events",
      name: { en: "Containment Failure", pt: "Falha na Contenção (Containment Failure)" },
      text: {
        en: "When doing the next outbreak, add 2 (not 1) disease cubes to each connected city. Put this card face up. Discard it after the next outbreak.",
        pt: "Ao fazer o próximo surto, acrescente 2 cubos de doença (e não 1) em cada cidade conectada. Deixe esta carta virada para cima e descarte-a depois do próximo surto."
      },
      textOnCard: false,
      notes: {
        en: [
          "Emergency Event card: read it aloud and follow it immediately when drawn. Emergency Events are not Event cards (p. 4) and do not count against players' hand limits.",
          "This card has a delayed effect: leave it face up near the Player Deck as a reminder until it is discarded.",
          "Fine Point (p. 4): if a connected city has 2 cubes of this disease's color, add 1 cube and then do a chain reaction outbreak there. The On the Brink Virulent Strain effect Highly Contagious does not add to Containment Failure."
        ],
        pt: [
          "Carta de Evento de Emergência (Emergency Event): leia-a em voz alta e siga suas instruções imediatamente ao comprá-la. Eventos de Emergência não são cartas de Evento (p. 4) e não contam para o limite de mão dos jogadores.",
          "Esta carta tem efeito retardado: deixe-a virada para cima perto do Baralho de Jogadores (Player Deck) como lembrete até que seja descartada.",
          "Detalhe (Fine Point, p. 4): se uma cidade conectada já tiver 2 cubos da cor desta doença, acrescente 1 cubo e então faça um surto em reação em cadeia ali. O efeito Altamente Contagiosa (Highly Contagious) da Cepa Virulenta (Virulent Strain), de On the Brink, não se soma à Falha na Contenção."
        ]
      }
    },
    {
      id: "disease-hot-spot",
      book: "soe",
      page: 4,
      deck: "emergency-event",
      requires: "emergency-events",
      name: { en: "Disease Hot Spot", pt: "Foco da Doença (Disease Hot Spot)" },
      text: {
        en: "Draw 1 card from the Infection Deck bottom. If this disease is not eradicated, add 3 cubes of this color to its city. Discard the Infection card to the Infection Discard Pile.",
        pt: "Compre 1 carta do fundo do Baralho de Infecção (Infection Deck). Se essa doença não estiver erradicada, acrescente 3 cubos dessa cor na cidade indicada. Descarte a carta de Infecção na Pilha de Descarte de Infecção (Infection Discard Pile)."
      },
      textOnCard: false,
      notes: {
        en: [
          "Emergency Event card: read it aloud and follow it immediately when drawn. Emergency Events are not Event cards (p. 4) and do not count against players' hand limits.",
          "Fine Point (p. 4): if any cubes of the drawn card's color are already in this city, adjust their number to 3 and then do an outbreak there."
        ],
        pt: [
          "Carta de Evento de Emergência (Emergency Event): leia-a em voz alta e siga suas instruções imediatamente ao comprá-la. Eventos de Emergência não são cartas de Evento (p. 4) e não contam para o limite de mão dos jogadores.",
          "Detalhe (Fine Point, p. 4): se já houver cubos da cor da carta comprada nessa cidade, ajuste a quantidade para 3 e então faça um surto ali."
        ]
      }
    },
    {
      id: "limited-options",
      book: "soe",
      page: 4,
      deck: "emergency-event",
      requires: "emergency-events",
      name: { en: "Limited Options", pt: "Opções Limitadas (Limited Options)" },
      text: {
        en: "Reduce players' hand limits to 6 cards. Discard cards or play Events as needed. Put this card face up. Discard it after playing the next Emergency Event.",
        pt: "Reduza o limite de mão dos jogadores para 6 cartas. Descarte cartas ou jogue Eventos conforme a necessidade. Deixe esta carta virada para cima e descarte-a depois que o próximo Evento de Emergência (Emergency Event) for jogado."
      },
      textOnCard: false,
      notes: {
        en: [
          "Emergency Event card: read it aloud and follow it immediately when drawn. Emergency Events are not Event cards (p. 4) and do not count against players' hand limits.",
          "This card has a \"continuing effect\" band: leave it face up near the Player Deck as a reminder until it is discarded.",
          "Fine Point (p. 4): if several players wish to play Events instead of discarding, do so in any order. This event does not affect the On the Brink Bio-Terrorist player. The On the Brink Archivist's hand limit is reduced to 7, not 6."
        ],
        pt: [
          "Carta de Evento de Emergência (Emergency Event): leia-a em voz alta e siga suas instruções imediatamente ao comprá-la. Eventos de Emergência não são cartas de Evento (p. 4) e não contam para o limite de mão dos jogadores.",
          "Esta carta traz a faixa de \"efeito contínuo\": deixe-a virada para cima perto do Baralho de Jogadores (Player Deck) como lembrete até que seja descartada.",
          "Detalhe (Fine Point, p. 4): se vários jogadores quiserem jogar Eventos em vez de descartar, façam isso em qualquer ordem. Este evento não afeta o jogador Bioterrorista (Bio-Terrorist) de On the Brink. O limite de mão da Arquivista (Archivist), de On the Brink, é reduzido para 7, e não para 6."
        ]
      }
    },
    {
      id: "patient-zero",
      book: "soe",
      page: 4,
      deck: "emergency-event",
      requires: "emergency-events",
      name: { en: "Patient Zero", pt: "Paciente Zero (Patient Zero)" },
      text: {
        en: "Draw 1 card from the Infection Deck bottom. Add 1 disease cube of this color to this city every turn before Infecting. Put this card and its Infection card face up. Discard them after playing the next Emergency Event.",
        pt: "Compre 1 carta do fundo do Baralho de Infecção (Infection Deck). Acrescente 1 cubo de doença dessa cor nessa cidade todo turno, antes de Infectar. Deixe esta carta e a carta de Infecção dela viradas para cima e descarte ambas depois que o próximo Evento de Emergência (Emergency Event) for jogado."
      },
      textOnCard: false,
      notes: {
        en: [
          "Emergency Event card: read it aloud and follow it immediately when drawn. Emergency Events are not Event cards (p. 4) and do not count against players' hand limits.",
          "This card has a \"continuing effect\" band: leave it face up near the Player Deck as a reminder until it is discarded.",
          "Fine Point (p. 4): this can affect an eradicated disease, and will continue to do so until this event is discarded. After it is discarded, discard its Infection card to the Infection Discard Pile."
        ],
        pt: [
          "Carta de Evento de Emergência (Emergency Event): leia-a em voz alta e siga suas instruções imediatamente ao comprá-la. Eventos de Emergência não são cartas de Evento (p. 4) e não contam para o limite de mão dos jogadores.",
          "Esta carta traz a faixa de \"efeito contínuo\": deixe-a virada para cima perto do Baralho de Jogadores (Player Deck) como lembrete até que seja descartada.",
          "Detalhe (Fine Point, p. 4): este evento pode, sim, afetar uma doença erradicada, e continuará afetando até que a carta seja descartada. Depois de descartá-la, coloque a carta de Infecção dela na Pilha de Descarte de Infecção (Infection Discard Pile)."
        ]
      }
    },
    {
      id: "widespread-panic",
      book: "soe",
      page: 4,
      deck: "emergency-event",
      requires: "emergency-events",
      name: { en: "Widespread Panic", pt: "Pânico Generalizado (Widespread Panic)" },
      text: {
        en: "When doing the next outbreak, move the Outbreaks marker forward 1 extra space. Put this card face up. Discard it after the next outbreak.",
        pt: "Ao fazer o próximo surto, avance o marcador de Surtos (Outbreaks marker) 1 espaço extra. Deixe esta carta virada para cima e descarte-a depois do próximo surto."
      },
      textOnCard: false,
      notes: {
        en: [
          "Emergency Event card: read it aloud and follow it immediately when drawn. Emergency Events are not Event cards (p. 4) and do not count against players' hand limits.",
          "This card has a delayed effect: leave it face up near the Player Deck as a reminder until it is discarded.",
          "Fine Point (p. 4): in On the Brink, this effect does add to the Virulent Strain effect Slippery Slope."
        ],
        pt: [
          "Carta de Evento de Emergência (Emergency Event): leia-a em voz alta e siga suas instruções imediatamente ao comprá-la. Eventos de Emergência não são cartas de Evento (p. 4) e não contam para o limite de mão dos jogadores.",
          "Esta carta tem efeito retardado: deixe-a virada para cima perto do Baralho de Jogadores (Player Deck) como lembrete até que seja descartada.",
          "Detalhe (Fine Point, p. 4): em On the Brink, este efeito se soma, sim, ao efeito Ladeira Abaixo (Slippery Slope) da Cepa Virulenta (Virulent Strain)."
        ]
      }
    },
    {
      id: "disease-zones-expand",
      book: "soe",
      page: 1,
      deck: "emergency-event",
      requires: "emergency-events",
      confidence: "medium",
      name: { en: "Disease Zones Expand", pt: "Zonas de Doença se Expandem (Disease Zones Expand)" },
      text: null,
      textOnCard: true,
      notes: {
        en: [
          "Emergency Event card: read it aloud and follow it immediately when drawn. Emergency Events are not Event cards (p. 4) and do not count against players' hand limits.",
          "Read the effect printed on the physical Emergency Event card."
        ],
        pt: [
          "Carta de Evento de Emergência (Emergency Event): leia-a em voz alta e siga suas instruções imediatamente ao comprá-la. Eventos de Emergência não são cartas de Evento (p. 4) e não contam para o limite de mão dos jogadores.",
          "Leia o efeito impresso na própria carta de Evento de Emergência."
        ]
      }
    },
    {
      id: "logistics-failure",
      book: "soe",
      page: 3,
      deck: "emergency-event",
      requires: "emergency-events",
      name: { en: "Logistics Failure", pt: "Falha Logística (Logistics Failure)" },
      text: null,
      textOnCard: true,
      notes: {
        en: [
          "Emergency Event card: read it aloud and follow it immediately when drawn. Emergency Events are not Event cards (p. 4) and do not count against players' hand limits.",
          "In the Hinterlands challenge, roll the Hinterlands die twice after resolving Logistics Failure."
        ],
        pt: [
          "Carta de Evento de Emergência (Emergency Event): leia-a em voz alta e siga suas instruções imediatamente ao comprá-la. Eventos de Emergência não são cartas de Evento (p. 4) e não contam para o limite de mão dos jogadores.",
          "No desafio Hinterlands, role o dado Hinterlands duas vezes depois de resolver Logistics Failure."
        ]
      }
    }
  ];
  // <<<DATA:CHALLENGES>>>
  const CHALLENGES = [
  {
      id: "virulent-strain",
      book: "otb",
      pages: [2, 3],
      hiddenInfo: false,
      name: { en: "Virulent Strain", pt: "Cepa Virulenta" },
      summary: {
        en: "One of the four base diseases becomes the Virulent Strain and, from the first Virulent Strain Epidemic card on, behaves in nasty and unpredictable ways: the Epidemic cards themselves are replaced by 4-7 Virulent Strain Epidemic cards, each adding an extra effect that hits only that one disease.",
        pt: "Uma das quatro doenças básicas se torna a Cepa Virulenta (Virulent Strain) e, a partir da primeira carta de Epidemia da Cepa Virulenta, passa a se comportar de formas cruéis e imprevisíveis: as cartas de Epidemia normais são substituídas por 4 a 7 cartas de Epidemia da Cepa Virulenta, cada uma com um efeito extra que atinge somente essa doença."
      },
      players: null,
      components: [],
      setup: {
        en: [
          "Put the normal Epidemic cards in the box — you will not need them.",
          "Select the Virulent Strain Epidemic cards to use by shuffling the 8 of them face down before taking the needed number (4-7, based on your difficulty level).",
          "Put the unused Virulent Strain Epidemic cards away without looking at them.",
          "Prepare the Player Deck using the Virulent Strain Epidemic cards instead of the normal ones.",
          "Divide the remaining Player cards into face down piles, as equal in size as you can, so that the number of piles matches the number of Virulent Strain Epidemic cards you are using.",
          "Shuffle 1 Virulent Strain Epidemic card into each pile, face down.",
          "Stack these piles to form the Player Deck, placing smaller piles on the bottom.",
          "Set up everything else as in the base game."
        ],
        pt: [
          "Guarde as cartas de Epidemia (Epidemic) normais na caixa — você não vai precisar delas.",
          "Escolha quais cartas de Epidemia da Cepa Virulenta (Virulent Strain Epidemic) serão usadas: embaralhe as 8 com a face para baixo e então pegue a quantidade necessária (4 a 7, conforme o seu nível de dificuldade).",
          "Guarde as cartas de Epidemia da Cepa Virulenta não usadas sem olhar para elas.",
          "Prepare o Baralho de Jogadores (Player Deck) usando as cartas de Epidemia da Cepa Virulenta no lugar das normais.",
          "Divida as cartas de jogador restantes em montes com a face para baixo, o mais iguais possível em tamanho, de modo que o número de montes seja igual ao número de cartas de Epidemia da Cepa Virulenta que você está usando.",
          "Embaralhe 1 carta de Epidemia da Cepa Virulenta dentro de cada monte, com a face para baixo.",
          "Empilhe esses montes para formar o Baralho de Jogadores, colocando os montes menores por baixo.",
          "Prepare todo o resto como no jogo básico."
        ]
      },
      rules: [
        {
          title: { en: "Determining the Virulent Strain", pt: "Determinando a Cepa Virulenta" },
          page: 3,
          lines: {
            en: [
              "When a player draws the first Virulent Strain Epidemic card, determine which disease will be the Virulent Strain for the rest of the game.",
              "After performing this card's Infect step, the disease with the most cubes on the board is the Virulent Strain.",
              "Finish doing this Epidemic and its Virulent Strain effect.",
              "Put this card next to the Virulent Strain's cube supply as a reminder.",
              "If several diseases are tied for most cubes on the board, randomly choose the Virulent Strain from among the tied diseases.",
              "If you are also playing with the Mutation or Bio-Terrorist challenge, the purple disease cannot be the Virulent Strain. Ignore it when determining the Virulent Strain.",
              "Once determined, the Virulent Strain stays the same disease for the rest of the game."
            ],
            pt: [
              "Quando um jogador comprar a primeira carta de Epidemia da Cepa Virulenta (Virulent Strain Epidemic), determine qual doença será a Cepa Virulenta (Virulent Strain) pelo resto da partida.",
              "Depois de executar a etapa Infectar (Infect) dessa carta, a doença com mais cubos no tabuleiro é a Cepa Virulenta.",
              "Termine de resolver essa Epidemia e o efeito de Cepa Virulenta dela.",
              "Coloque essa carta ao lado do estoque de cubos da Cepa Virulenta como lembrete.",
              "Se várias doenças estiverem empatadas com o maior número de cubos no tabuleiro, escolha a Cepa Virulenta aleatoriamente entre as doenças empatadas.",
              "Se você também estiver jogando com o desafio da Mutação (Mutation) ou do Bioterrorista (Bio-Terrorist), a doença roxa não pode ser a Cepa Virulenta. Ignore-a ao determinar a Cepa Virulenta.",
              "Uma vez determinada, a Cepa Virulenta continua sendo a mesma doença pelo resto da partida."
            ]
          }
        },
        {
          title: { en: "Virulent Strain Epidemic effects", pt: "Efeitos das Epidemias da Cepa Virulenta" },
          page: 3,
          lines: {
            en: [
              "Every Virulent Strain Epidemic card still carries the three normal Epidemic steps: 1-Increase (move the infection rate marker forward 1 space), 2-Infect (draw the bottom card from the Infection Deck, put 3 cubes on that city, discard that card) and 3-Intensify (shuffle the cards in the Infection Discard Pile and put them on top of the Infection Deck).",
              "Besides its Epidemic effects, each Virulent Strain Epidemic card has an effect which applies only to the Virulent Strain disease. Read the card aloud and follow its instructions.",
              "Some cards have a continuing effect; these affect play after the Epidemic is done. Keep these cards face up as reminders.",
              "Others have an immediate effect, taking place before the Intensify step of the Epidemic. Flip these cards face down after their effect and Epidemic is done.",
              "On the Brink has five continuing cards with the CONTINUING EFFECT infinity badge: Chronic Effect, Complex Molecular Structure, Government Interference, Rate Effect and Slippery Slope.",
              "In the Lab adds two more continuing cards: Highly Contagious and Resistant to Treatment. Read their effects on the physical cards.",
              "The three immediate On the Brink cards carry no badge and their text begins \"Before doing this card's Intensify step, ...\": Hidden Pocket, Unacceptable Loss and Uncounted Populations.",
              "Continuing effects of different cards stack: a card already face up keeps applying when a later Virulent Strain Epidemic card is drawn."
            ],
            pt: [
              "Toda carta de Epidemia da Cepa Virulenta (Virulent Strain Epidemic) mantém as três etapas normais de Epidemia: 1-Aumentar (Increase) — avance o marcador de taxa de infecção 1 espaço; 2-Infectar (Infect) — compre a carta do fundo do Baralho de Infecção (Infection Deck), coloque 3 cubos naquela cidade e descarte a carta; e 3-Intensificar (Intensify) — embaralhe as cartas da Pilha de Descarte de Infecção (Infection Discard Pile) e coloque-as no topo do Baralho de Infecção.",
              "Além dos efeitos de Epidemia, cada carta de Epidemia da Cepa Virulenta tem um efeito que se aplica somente à doença da Cepa Virulenta. Leia a carta em voz alta e siga as instruções dela.",
              "Algumas cartas têm efeito contínuo (continuing); elas afetam a partida depois que a Epidemia termina. Mantenha essas cartas com a face para cima como lembrete.",
              "Outras têm efeito imediato (immediate), que acontece antes da etapa Intensificar da Epidemia. Vire essas cartas com a face para baixo depois que o efeito e a Epidemia terminarem.",
              "On the Brink tem cinco cartas contínuas com o selo CONTINUING EFFECT e o símbolo de infinito: Efeito Crônico (Chronic Effect), Estrutura Molecular Complexa (Complex Molecular Structure), Interferência do Governo (Government Interference), Efeito de Taxa (Rate Effect) e Ladeira Escorregadia (Slippery Slope).",
              "In the Lab acrescenta duas cartas contínuas: Highly Contagious e Resistant to Treatment. Leia os efeitos nas próprias cartas.",
              "As três cartas imediatas de On the Brink não têm selo e seu texto começa com \"Antes de fazer a etapa de Intensificar desta carta, ...\": Foco Oculto (Hidden Pocket), Perda Inaceitável (Unacceptable Loss) e Populações Não Contabilizadas (Uncounted Populations).",
              "Os efeitos contínuos de cartas diferentes se acumulam: uma carta já virada para cima continua valendo quando outra carta de Epidemia da Cepa Virulenta for comprada depois."
            ]
          }
        },
        {
          title: { en: "Virulent Strain Epidemic cards", pt: "Cartas de Epidemia da Cepa Virulenta" },
          page: 3,
          lines: {
            en: [
              "Chronic Effect — During Infections, when a Virulent Strain city is drawn, place 2 Virulent Strain disease cubes if the city has no Virulent Strain cubes (otherwise, place 1 cube normally). This does not affect Epidemics or Outbreaks.",
              "Complex Molecular Structure — If the Virulent Strain has not been cured, you need 1 more Virulent Strain City card to Discover a Cure for it. Otherwise, ignore this effect.",
              "Government Interference — To leave a city with Virulent Strain disease cubes, a player must first, on that turn, Treat at least 1 Virulent Strain cube in that city.",
              "Hidden Pocket — Before doing this card's Intensify step, if the Virulent Strain is eradicated but at least 1 Virulent Strain card is in the Infection Discard Pile: flip its cure marker back to its cure-vial side; and place 1 cube on each Virulent Strain city whose card is in this discard pile. Otherwise, ignore this effect.",
              "Rate Effect — During Infections, draw 1 more card than the infection rate if at least 1 Infection card drawn was a Virulent Strain card (and the Virulent Strain is not yet eradicated).",
              "Slippery Slope — Move the outbreaks marker forward 2 spaces (not 1) when an outbreak of the Virulent Strain occurs.",
              "Unacceptable Loss — Before doing this card's Intensify step, remove 4 Virulent Strain disease cubes from the supply to the box. If fewer than 4 of these cubes are in the supply, instead remove them all.",
              "Uncounted Populations — Before doing this card's Intensify step, place 1 Virulent Strain disease cube on each city with exactly 1 of these cubes (ignore cubes of other colors)."
            ],
            pt: [
              "Efeito Crônico (Chronic Effect) — Durante as Infecções, quando uma cidade da Cepa Virulenta (Virulent Strain) for comprada, coloque 2 cubos de doença da Cepa Virulenta se a cidade não tiver nenhum cubo da Cepa Virulenta (caso contrário, coloque 1 cubo normalmente). Isso não afeta Epidemias nem Surtos.",
              "Estrutura Molecular Complexa (Complex Molecular Structure) — Se a Cepa Virulenta ainda não foi curada, você precisa de 1 carta de cidade da Cepa Virulenta a mais para Descobrir uma Cura (Discover a Cure) para ela. Caso contrário, ignore este efeito.",
              "Interferência do Governo (Government Interference) — Para sair de uma cidade com cubos de doença da Cepa Virulenta, o jogador precisa antes, naquele mesmo turno, Tratar (Treat) pelo menos 1 cubo da Cepa Virulenta naquela cidade.",
              "Foco Oculto (Hidden Pocket) — Antes de fazer a etapa de Intensificar desta carta, se a Cepa Virulenta estiver erradicada mas houver pelo menos 1 carta da Cepa Virulenta na Pilha de Descarte de Infecção (Infection Discard Pile): vire o marcador de cura dela de volta para o lado do frasco de cura; e coloque 1 cubo em cada cidade da Cepa Virulenta cuja carta esteja nessa pilha de descarte. Caso contrário, ignore este efeito.",
              "Efeito de Taxa (Rate Effect) — Durante as Infecções, compre 1 carta a mais do que a taxa de infecção se pelo menos 1 carta de Infecção comprada for uma carta da Cepa Virulenta (e a Cepa Virulenta ainda não estiver erradicada).",
              "Ladeira Escorregadia (Slippery Slope) — Avance o marcador de surtos 2 espaços (e não 1) quando ocorrer um surto da Cepa Virulenta.",
              "Perda Inaceitável (Unacceptable Loss) — Antes de fazer a etapa de Intensificar desta carta, retire 4 cubos de doença da Cepa Virulenta do estoque e devolva-os à caixa. Se houver menos de 4 desses cubos no estoque, retire todos eles.",
              "Populações Não Contabilizadas (Uncounted Populations) — Antes de fazer a etapa de Intensificar desta carta, coloque 1 cubo de doença da Cepa Virulenta em cada cidade que tenha exatamente 1 desses cubos (ignore cubos de outras cores)."
            ]
          }
        },
        {
          title: { en: "Combining with the Mutation or Bio-Terrorist challenge", pt: "Combinando com o desafio da Mutação ou do Bioterrorista" },
          page: 3,
          lines: {
            en: [
              "Experienced players may combine the Virulent Strain with either the Mutation or Bio-Terrorist challenge.",
              "The purple disease can never be the Virulent Strain; ignore it when determining the Virulent Strain.",
              "Rate Effect and the Mutation challenge: when combining this challenge with the Mutation challenge, if the card drawn to resolve a Mutation card is a Virulent Strain city, that card does not count towards Rate Effect.",
            ],
            pt: [
              "Jogadores experientes podem combinar a Cepa Virulenta (Virulent Strain) com o desafio da Mutação (Mutation) ou com o do Bioterrorista (Bio-Terrorist).",
              "A doença roxa nunca pode ser a Cepa Virulenta; ignore-a ao determinar a Cepa Virulenta.",
              "Efeito de Taxa (Rate Effect) e o desafio da Mutação: ao combinar este desafio com o da Mutação, se a carta comprada para resolver uma carta de Mutação for uma cidade da Cepa Virulenta, essa carta não conta para o Efeito de Taxa.",
            ]
          }
        }
      ],
      finePoints: [
        {
          page: 3,
          text: {
            en: "Complex Molecular Structure: A player would need to turn in 6 city cards of the Virulent Strain color to cure the Virulent Strain, except the Scientist, who would turn in 5 cards, or the Field Operative, who could turn in 4 cards and 3 Virulent Strain samples.",
            pt: "Estrutura Molecular Complexa (Complex Molecular Structure): um jogador precisaria entregar 6 cartas de cidade da cor da Cepa Virulenta (Virulent Strain) para curá-la, exceto o Cientista (Scientist), que entregaria 5 cartas, ou o Agente de Campo (Field Operative), que poderia entregar 4 cartas e 3 amostras da Cepa Virulenta."
          }
        },
        {
          page: 3,
          text: {
            en: "Government Interference: Removing (but not Treating) a Virulent Strain disease cube — with the Containment Specialist's power, the Field Operative's sample power, or the Events Remote Treatment or Rapid Vaccine Deployment — does not satisfy this effect's requirement. The Event Mobile Hospital does satisfy it. Other players' pawns affected by this effect cannot be moved by the Dispatcher or the Events Airlift or Special Order, unless the current player first Treats a cube in the same city that the pawn being moved is in.",
            pt: "Interferência do Governo (Government Interference): remover (sem Tratar) um cubo de doença da Cepa Virulenta (Virulent Strain) — com o poder do Especialista em Contenção (Containment Specialist), com o poder de amostra do Agente de Campo (Field Operative) ou com os Eventos Tratamento Remoto (Remote Treatment) ou Implantação Rápida de Vacina (Rapid Vaccine Deployment) — não satisfaz a exigência deste efeito. O Evento Hospital Móvel (Mobile Hospital) satisfaz. Peões de outros jogadores afetados por este efeito não podem ser movidos pelo Despachante (Dispatcher) nem pelos Eventos Ponte Aérea (Airlift) ou Ordens Especiais (Special Order), a menos que o jogador da vez primeiro Trate um cubo na mesma cidade em que está o peão a ser movido."
          }
        },
        {
          page: 3,
          text: {
            en: "Rate Effect: If the Troubleshooter sees a Virulent Strain city card when looking at Infection cards while Rate Effect is in effect, the Troubleshooter does not look at an additional card. When combining this challenge with the Mutation challenge, if the card drawn to resolve a Mutation card is a Virulent Strain city, that card does not count towards Rate Effect.",
            pt: "Efeito de Taxa (Rate Effect): se a Solucionadora de Problemas (Troubleshooter) vir uma carta de cidade da Cepa Virulenta (Virulent Strain) ao olhar as cartas de Infecção enquanto o Efeito de Taxa estiver ativo, ela não olha uma carta adicional. Ao combinar este desafio com o da Mutação (Mutation), se a carta comprada para resolver uma carta de Mutação for uma cidade da Cepa Virulenta, essa carta não conta para o Efeito de Taxa."
          }
        }
      ],
      winLose: {
        en: [
          "This challenge is won or lost normally, as in the base game. Good luck!"
        ],
        pt: [
          "Este desafio é vencido ou perdido normalmente, como no jogo básico. Boa sorte!"
        ]
      },
      quickRef: {
        en: [
          "Virulent Strain — after the first Virulent Strain Epidemic card's Infect step, the disease with the most cubes on the board; ties are broken randomly.",
          "Purple — never the Virulent Strain; ignore it when determining the strain.",
          "Continuing effect — the card stays face up and keeps applying for the rest of the game.",
          "Immediate effect — resolve it before the Epidemic's Intensify step, then flip the card face down.",
          "Epidemic steps — Increase, Infect and Intensify still happen on every Virulent Strain Epidemic card.",
          "Normal Epidemic cards — not used at all; they go back in the box.",
          "Winning and losing — exactly as in the base game."
        ],
        pt: [
          "Cepa Virulenta (Virulent Strain) — depois da etapa Infectar da primeira carta de Epidemia da Cepa Virulenta, é a doença com mais cubos no tabuleiro; empates são resolvidos ao acaso.",
          "Roxa — nunca é a Cepa Virulenta; ignore-a ao determinar a cepa.",
          "Efeito contínuo — a carta fica com a face para cima e continua valendo pelo resto da partida.",
          "Efeito imediato — resolva antes da etapa Intensificar (Intensify) da Epidemia e depois vire a carta para baixo.",
          "Etapas da Epidemia — Aumentar, Infectar e Intensificar continuam acontecendo em toda carta de Epidemia da Cepa Virulenta.",
          "Cartas de Epidemia normais — não são usadas; voltam para a caixa.",
          "Vitória e derrota — exatamente como no jogo básico."
        ]
      },
      cardsOnTable: {
        en: [
          "The 8 On the Brink Virulent Strain card effects are reproduced in the manual. In the Lab adds Highly Contagious and Resistant to Treatment; read those two effects on their physical cards.",
          "Each physical Virulent Strain Epidemic card also prints the standard Epidemic steps 1-INCREASE, 2-INFECT and 3-INTENSIFY above its special effect.",
          "The continuing cards are marked on the card itself with a white infinity glyph over the words CONTINUING EFFECT; the immediate cards carry no badge."
        ],
        pt: [
          "Os efeitos das 8 cartas de Epidemia da Cepa Virulenta de On the Brink estão reproduzidos no manual. In the Lab acrescenta Highly Contagious e Resistant to Treatment; leia os efeitos dessas duas cartas nos componentes.",
          "Cada carta física de Epidemia da Cepa Virulenta também traz impressas as etapas normais de Epidemia 1-INCREASE, 2-INFECT e 3-INTENSIFY acima do seu efeito especial.",
          "As cartas contínuas são identificadas na própria carta por um símbolo de infinito branco sobre as palavras CONTINUING EFFECT; as cartas de efeito imediato não têm selo algum."
        ]
      },
      compatibility: [
        {
          page: 2,
          text: {
            en: "Experienced players may combine the Virulent Strain with either the Mutation or Bio-Terrorist challenges.",
            pt: "Jogadores experientes podem combinar a Cepa Virulenta (Virulent Strain) com o desafio da Mutação (Mutation) ou com o do Bioterrorista (Bio-Terrorist)."
          }
        },
        {
          page: 3,
          text: {
            en: "If you are also playing with the Mutation or Bio-Terrorist challenge, the purple disease cannot be the Virulent Strain. Ignore it when determining the Virulent Strain.",
            pt: "Se você também estiver jogando com o desafio da Mutação (Mutation) ou do Bioterrorista (Bio-Terrorist), a doença roxa não pode ser a Cepa Virulenta (Virulent Strain). Ignore-a ao determinar a Cepa Virulenta."
          }
        },
        {
          page: 3,
          text: {
            en: "When combining this challenge with the Mutation challenge, if the card drawn to resolve a Mutation card is a Virulent Strain city, that card does not count towards Rate Effect.",
            pt: "Ao combinar este desafio com o da Mutação (Mutation), se a carta comprada para resolver uma carta de Mutação for uma cidade da Cepa Virulenta (Virulent Strain), essa carta não conta para o Efeito de Taxa (Rate Effect)."
          }
        },
        {
          page: 5,
          text: {
            en: "The Bio-Terrorist challenge may be combined with the Virulent Strain challenge, but not the Mutation challenge.",
            pt: "O desafio do Bioterrorista (Bio-Terrorist) pode ser combinado com o desafio da Cepa Virulenta (Virulent Strain), mas não com o desafio da Mutação (Mutation)."
          }
        }
      ]
    },
    {
      id: "mutation",
      book: "otb",
      pages: [4],
      hiddenInfo: false,
      name: { en: "Mutation", pt: "Mutação" },
      summary: {
        en: "The Mutation challenge adds a 5th purple disease to the game that appears in unpredictable ways. Players must either cure all 5 diseases or cure the 4 other diseases and have no purple disease cubes on the board.",
        pt: "O desafio da Mutação (Mutation) acrescenta ao jogo uma 5ª doença, roxa, que surge de formas imprevisíveis. Os jogadores precisam curar as 5 doenças ou então curar as 4 outras doenças e não ter nenhum cubo da doença roxa no tabuleiro."
      },
      players: null,
      components: [
        {
          qty: { en: "12", pt: "12" },
          name: { en: "purple disease cubes", pt: "cubos roxos de doença" },
          from: { en: "On the Brink box", pt: "caixa On the Brink" },
          to: { en: "placed near the other cubes as a supply", pt: "colocados perto dos outros cubos como estoque" },
          page: 4
        },
        {
          qty: { en: "1 + 1", pt: "1 + 1" },
          name: {
            en: "purple Discovered Cure Indicator (sticker or card) and purple cure marker",
            pt: "Indicador de Cura Descoberta (Discovered Cure Indicator) roxo — adesivo ou carta — e marcador de cura roxo"
          },
          from: { en: "On the Brink box", pt: "caixa On the Brink" },
          to: { en: "placed on the board", pt: "colocados no tabuleiro" },
          page: 4
        },
        {
          qty: { en: "2", pt: "2" },
          name: { en: "Mutation cards", pt: "cartas de Mutação (Mutation)" },
          from: { en: "On the Brink box", pt: "caixa On the Brink" },
          to: {
            en: "put in the Infection Discard Pile (do not shuffle them into the Infection Deck)",
            pt: "colocadas na Pilha de Descarte de Infecção (Infection Discard Pile) — não as embaralhe no Baralho de Infecção"
          },
          page: 4
        },
        {
          qty: { en: "3", pt: "3" },
          name: { en: "Mutation Event cards", pt: "cartas de Evento de Mutação (Mutation Event)" },
          from: { en: "On the Brink box", pt: "caixa On the Brink" },
          to: {
            en: "shuffled with the remaining Player cards after dealing hands, before preparing the Player Deck",
            pt: "embaralhadas com as cartas de jogador restantes depois de distribuir as mãos e antes de preparar o Baralho de Jogadores (Player Deck)"
          },
          page: 4
        }
      ],
      setup: {
        en: [
          "Put the 12 purple disease cubes near the other cubes as a supply.",
          "Put the purple Discovered Cure Indicator (apply the sticker or use the Cure Indicator card) and the purple cure marker on the board.",
          "Put the 2 Mutation cards in the Infection Discard Pile; do not shuffle them into the Infection Deck.",
          "Set up the rest of the game normally and deal the players their starting hands.",
          "After dealing starting hands, shuffle the 3 Mutation Event cards with the remaining Player cards in the Player Deck phase.",
          "Then prepare the Player Deck as usual: divide those cards into piles, shuffle 1 Epidemic card into each pile and stack the piles."
        ],
        pt: [
          "Coloque os 12 cubos roxos de doença perto dos outros cubos, como estoque.",
          "Coloque no tabuleiro o Indicador de Cura Descoberta (Discovered Cure Indicator) roxo — cole o adesivo ou use a carta Cure Indicator — e o marcador de cura roxo.",
          "Coloque as 2 cartas de Mutação (Mutation) na Pilha de Descarte de Infecção (Infection Discard Pile); não as embaralhe no Baralho de Infecção (Infection Deck).",
          "Prepare o resto do jogo normalmente e distribua as mãos iniciais aos jogadores.",
          "Depois de distribuir as mãos iniciais, embaralhe as 3 cartas de Evento de Mutação com as cartas de Jogador restantes na etapa do Baralho de Jogadores.",
          "Em seguida, prepare o Baralho de Jogadores como de costume: divida essas cartas em montes, embaralhe 1 carta de Epidemia (Epidemic) em cada monte e empilhe os montes."
        ]
      },
      rules: [
        {
          title: { en: "The Mutation (purple) disease", pt: "A doença da Mutação (roxa)" },
          page: 4,
          lines: {
            en: [
              "The purple disease is like the other 4 diseases, except as noted below.",
              "Purple disease cubes enter play in three ways: through Mutation cards, through Mutation Event cards, and through Infections of a city that already has at least 1 purple cube on it.",
              "There are only 12 (not 24) purple cubes in the supply.",
              "Like any other disease, if you cannot place the number of purple cubes actually needed on the board, your team loses.",
              "Purple outbreaks are resolved normally, exactly as for the other colours. The purple \"flare-out\" outbreak rule printed on page 6 applies to the Bio-Terrorist challenge only, not the Mutation challenge."
            ],
            pt: [
              "A doença roxa funciona como as outras 4 doenças, exceto no que está indicado a seguir.",
              "Os cubos roxos de doença entram em jogo de três maneiras: pelas cartas de Mutação (Mutation), pelas cartas de Evento de Mutação (Mutation Event) e pelas Infecções de uma cidade que já tenha pelo menos 1 cubo roxo.",
              "Há apenas 12 (e não 24) cubos roxos no estoque.",
              "Como em qualquer outra doença, se você não conseguir colocar no tabuleiro a quantidade de cubos roxos efetivamente necessária, sua equipe perde.",
              "Os surtos roxos são resolvidos normalmente, igual aos das outras cores. A regra de surto roxo \"explosivo\" (flare-out) impressa na página 6 vale somente para o desafio do Bioterrorista (Bio-Terrorist), não para o da Mutação."
            ]
          }
        },
        {
          title: { en: "Mutation cards", pt: "Cartas de Mutação" },
          page: 4,
          lines: {
            en: [
              "The 2 Mutation cards start in the Infection Discard Pile, so they only reach the Infection Deck when an Epidemic's Intensify step shuffles the discard pile back on top.",
              "During Infections, if a Mutation card is drawn (and the purple disease is not eradicated), draw an Infection card from the bottom of the Infection Deck and place 1 purple cube on that city.",
              "Do not place a cube of the card's color on the city.",
              "Discard both cards to the Infection Discard Pile.",
              "This counts as 1 Infection card draw for the turn.",
              "If the purple disease is eradicated and a Mutation card is drawn during Infections, just discard it. It still counts as 1 Infection card draw for the turn.",
              "Card text, exactly as printed on the Mutation card: \"If the purple disease is not eradicated, draw a card from the bottom of the Infection Deck. Place 1 purple disease cube (only) on this city. Discard the card drawn and this card to the Infection Discard Pile. If the purple disease is eradicated, just discard this card. In both cases, this counts as 1 Infection card draw.\""
            ],
            pt: [
              "As 2 cartas de Mutação (Mutation) começam na Pilha de Descarte de Infecção (Infection Discard Pile), de modo que só chegam ao Baralho de Infecção (Infection Deck) quando a etapa Intensificar (Intensify) de uma Epidemia devolve a pilha de descarte ao topo do baralho.",
              "Durante as Infecções, se uma carta de Mutação for comprada (e a doença roxa não estiver erradicada), compre uma carta de Infecção do fundo do Baralho de Infecção e coloque 1 cubo roxo naquela cidade.",
              "Não coloque na cidade nenhum cubo da cor da carta comprada.",
              "Descarte as duas cartas na Pilha de Descarte de Infecção.",
              "Isso conta como 1 compra de carta de Infecção no turno.",
              "Se a doença roxa estiver erradicada e uma carta de Mutação for comprada durante as Infecções, apenas descarte-a. Ainda assim isso conta como 1 compra de carta de Infecção no turno.",
              "Texto exato impresso na carta de Mutação: \"Se a doença roxa não estiver erradicada, compre uma carta do fundo do Baralho de Infecção. Coloque 1 cubo (apenas) da doença roxa nesta cidade. Descarte a carta comprada e esta carta na Pilha de Descarte de Infecção. Se a doença roxa estiver erradicada, apenas descarte esta carta. Nos dois casos, isso conta como 1 compra de carta de Infecção.\""
            ]
          }
        },
        {
          title: { en: "Mutation Event cards", pt: "Cartas de Evento de Mutação" },
          page: 4,
          lines: {
            en: [
              "The 3 Mutation Event cards are shuffled into the Player cards, so a player meets them when drawing Player cards.",
              "When a Mutation Event card is drawn, follow its instructions and discard it. Do not draw a Player card to replace it.",
              "All three are headed MUTATION EVENT with the subtitle \"Play at once. Not an action.\" — they are resolved immediately by whoever draws them.",
              "If a player draws both a Mutation Event card and an Epidemic card, do the Mutation Event first.",
              "If a player draws 2 Mutation Event cards, the player decides the order to do them.",
              "2 Mutation Event cards place purple cubes on cities of cards drawn from the bottom of the Infection Draw Pile. Do not place cubes of those cards' colors on those cities."
            ],
            pt: [
              "As 3 cartas de Evento de Mutação (Mutation Event) são embaralhadas junto com as cartas de jogador, então um jogador as encontra ao comprar cartas de jogador.",
              "Quando uma carta de Evento de Mutação for comprada, siga as instruções dela e descarte-a. Não compre uma carta de jogador para substituí-la.",
              "As três têm o cabeçalho MUTATION EVENT e o subtítulo \"Play at once. Not an action.\" (jogue imediatamente; não é uma ação) — são resolvidas na hora por quem as comprou.",
              "Se um jogador comprar uma carta de Evento de Mutação e uma carta de Epidemia (Epidemic) na mesma compra, resolva primeiro o Evento de Mutação.",
              "Se um jogador comprar 2 cartas de Evento de Mutação, ele decide a ordem em que as resolve.",
              "2 das cartas de Evento de Mutação colocam cubos roxos nas cidades de cartas compradas do fundo do Baralho de Infecção (Infection Draw Pile). Não coloque nessas cidades cubos das cores dessas cartas."
            ]
          }
        },
        {
          title: { en: "The 3 Mutation Event cards", pt: "As 3 cartas de Evento de Mutação" },
          page: 4,
          lines: {
            en: [
              "The Mutation Threatens! — If the purple disease is not eradicated, draw a card from the bottom of the Infection Deck. Place 3 purple disease cubes (only) on this city. Discard that card to the Infection Discard Pile.",
              "The Mutation Spreads — If the purple disease is not eradicated, draw 3 cards from the bottom of the Infection Deck. Place 1 purple disease cube (only) on each of these cities. Discard these cards to the Infection Discard Pile.",
              "The Mutation Intensifies! — Place 1 purple disease cube on each city with exactly 2 purple cubes (ignore cubes of other colors)."
            ],
            pt: [
              "A Mutação Ameaça! (The Mutation Threatens!) — Se a doença roxa não estiver erradicada, compre uma carta do fundo do Baralho de Infecção (Infection Deck). Coloque 3 cubos (apenas) da doença roxa nesta cidade. Descarte essa carta na Pilha de Descarte de Infecção (Infection Discard Pile).",
              "A Mutação se Espalha (The Mutation Spreads) — Se a doença roxa não estiver erradicada, compre 3 cartas do fundo do Baralho de Infecção. Coloque 1 cubo (apenas) da doença roxa em cada uma dessas cidades. Descarte essas cartas na Pilha de Descarte de Infecção.",
              "A Mutação se Intensifica! (The Mutation Intensifies!) — Coloque 1 cubo da doença roxa em cada cidade que tenha exatamente 2 cubos roxos (ignore cubos de outras cores)."
            ]
          }
        },
        {
          title: { en: "Infections", pt: "Infecções" },
          page: 4,
          lines: {
            en: [
              "During Infections, if an Infection card is drawn for a city with at least 1 purple cube on it, place both 1 purple cube (if purple is not eradicated) and 1 cube of this card's color (if that disease is not eradicated) on the city, resolving any outbreak(s) normally.",
              "An Infection draw is the only time when cubes of both colors are placed.",
              "When drawing cards from the bottom of the Infection Deck, either just cubes of that card's color (for Epidemics) or just purple cubes (for Mutation cards and Mutation Events) are placed."
            ],
            pt: [
              "Durante as Infecções, se uma carta de Infecção for comprada para uma cidade que tenha pelo menos 1 cubo roxo, coloque nessa cidade tanto 1 cubo roxo (se a doença roxa não estiver erradicada) quanto 1 cubo da cor da carta (se aquela doença não estiver erradicada), resolvendo normalmente qualquer surto.",
              "A compra de uma carta de Infecção é o único momento em que se colocam cubos de duas cores.",
              "Ao comprar cartas do fundo do Baralho de Infecção (Infection Deck), coloca-se ou apenas cubos da cor daquela carta (nas Epidemias) ou apenas cubos roxos (nas cartas de Mutação e nos Eventos de Mutação)."
            ]
          }
        },
        {
          title: { en: "Curing and eradicating the purple disease", pt: "Curando e erradicando a doença roxa" },
          page: 4,
          lines: {
            en: [
              "When Discovering a Cure for the purple disease, discard 5 City cards in any mix of colors, with at least 1 of them a city that has 1 or more purple cubes on it.",
              "As with any cure, this is an action taken at a research station; flip the purple cure marker onto the purple Discovered Cure Indicator.",
              "When a cured purple disease has no cubes remaining, flip its cure marker to the eradication side as in the base game.",
              "Several rules check whether purple is eradicated — Mutation cards, Mutation Event cards and Infections all behave differently once it is."
            ],
            pt: [
              "Ao Descobrir uma Cura (Discover a Cure) para a doença roxa, descarte 5 cartas de cidade em qualquer combinação de cores, sendo que pelo menos 1 delas precisa ser uma cidade que tenha 1 ou mais cubos roxos.",
              "Como em qualquer cura, essa é uma ação realizada em uma Estação de Pesquisa (Research Station); vire o marcador de cura roxo sobre o Indicador de Cura Descoberta (Discovered Cure Indicator) roxo.",
              "Quando não houver cubos de uma doença roxa já curada, vire seu marcador de cura para o lado de erradicação, como no jogo básico.",
              "Várias regras verificam se a doença roxa está erradicada — cartas de Mutação (Mutation), cartas de Evento de Mutação (Mutation Event) e as Infecções se comportam de outra forma depois disso."
            ]
          }
        }
      ],
      finePoints: [
        {
          page: 4,
          text: {
            en: "A Mutation card drawn during Infections counts as 1 Infection card draw for the turn.",
            pt: "Uma carta de Mutação (Mutation) comprada durante as Infecções conta como 1 compra de carta de Infecção no turno."
          }
        },
        {
          page: 4,
          text: {
            en: "The Event Resilient Population cannot be used to remove a Mutation card from the Infection Discard Pile.",
            pt: "O Evento População Resiliente (Resilient Population) não pode ser usado para remover uma carta de Mutação (Mutation) da Pilha de Descarte de Infecção (Infection Discard Pile)."
          }
        },
        {
          page: 4,
          text: {
            en: "If the purple disease is eradicated and a Mutation card is drawn during Infections, just discard it. It still counts as 1 Infection card draw for the turn.",
            pt: "Se a doença roxa estiver erradicada e uma carta de Mutação (Mutation) for comprada durante as Infecções, apenas descarte-a. Mesmo assim ela conta como 1 compra de carta de Infecção no turno."
          }
        },
        {
          page: 4,
          text: {
            en: "2 Mutation Event cards place purple cubes on cities of cards drawn from the bottom of the Infection Draw Pile. Do not place cubes of those cards' colors on those cities.",
            pt: "2 das cartas de Evento de Mutação (Mutation Event) colocam cubos roxos nas cidades de cartas compradas do fundo do Baralho de Infecção (Infection Draw Pile). Não coloque nessas cidades cubos das cores dessas cartas."
          }
        },
        {
          page: 4,
          text: {
            en: "If a player draws both a Mutation Event card and an Epidemic card, do the Mutation Event first.",
            pt: "Se um jogador comprar uma carta de Evento de Mutação (Mutation Event) e uma carta de Epidemia (Epidemic), resolva primeiro o Evento de Mutação."
          }
        },
        {
          page: 4,
          text: {
            en: "If a player draws 2 Mutation Event cards, the player decides the order to do them.",
            pt: "Se um jogador comprar 2 cartas de Evento de Mutação (Mutation Event), ele decide a ordem em que as resolve."
          }
        },
        {
          page: 4,
          text: {
            en: "An Infection draw is the only time when cubes of both colors are placed. When drawing cards from the bottom of the Infection Deck, either just cubes of that card's color (for Epidemics) or just purple cubes (for Mutation cards and Mutation Events) are placed.",
            pt: "A compra de uma carta de Infecção é o único momento em que se colocam cubos de duas cores. Ao comprar cartas do fundo do Baralho de Infecção (Infection Deck), coloca-se ou apenas cubos da cor daquela carta (nas Epidemias) ou apenas cubos roxos (nas cartas de Mutação e nos Eventos de Mutação)."
          }
        },
        {
          page: 4,
          text: {
            en: "When a Scientist or Field Operative turns in fewer City cards, at least 1 of them must be a city with 1 or more purple cubes on it.",
            pt: "Quando a Cientista (Scientist) ou o Agente de Campo (Field Operative) entregar menos cartas de cidade, pelo menos 1 delas precisa ser uma cidade com 1 ou mais cubos roxos."
          }
        },
        {
          page: 4,
          text: {
            en: "Like any other disease, if you cannot place the number of purple cubes actually needed on the board, your team loses. There are only 12 (not 24) purple cubes in the supply!",
            pt: "Como em qualquer outra doença, se você não conseguir colocar no tabuleiro a quantidade de cubos roxos efetivamente necessária, sua equipe perde. Há apenas 12 (e não 24) cubos roxos no estoque!"
          }
        }
      ],
      winLose: {
        en: [
          "The players win immediately if they either cure all 5 diseases or cure the 4 other diseases and have no purple disease cubes on the board.",
          "Like any other disease, if you cannot place the number of purple cubes actually needed on the board, your team loses. There are only 12 (not 24) purple cubes in the supply!",
          "All the base-game losing conditions still apply."
        ],
        pt: [
          "Os jogadores vencem imediatamente se curarem as 5 doenças ou se curarem as 4 outras doenças e não houver nenhum cubo da doença roxa no tabuleiro.",
          "Como em qualquer outra doença, se você não conseguir colocar no tabuleiro a quantidade de cubos roxos efetivamente necessária, sua equipe perde. Há apenas 12 (e não 24) cubos roxos no estoque!",
          "Todas as condições de derrota do jogo básico continuam valendo."
        ]
      },
      quickRef: {
        en: [
          "Purple disease — the 5th disease; only 12 cubes in the supply, and running out loses the game.",
          "Mutation card drawn during Infections — draw the bottom Infection card, place 1 purple cube only there, discard both; counts as 1 Infection card draw.",
          "Mutation Event card drawn — resolve it at once and discard it; do not draw a replacement Player card.",
          "Infection card for a city that already has a purple cube — place 1 purple cube and 1 cube of the card's colour.",
          "Curing purple — discard 5 City cards in any mix of colours, at least 1 of them a city with purple cubes on it.",
          "Resilient Population — cannot remove a Mutation card from the Infection Discard Pile.",
          "Purple outbreaks — resolved normally; the flare-out rule belongs to the Bio-Terrorist challenge only.",
          "Winning — cure all 5 diseases, or cure the other 4 and have no purple cubes on the board."
        ],
        pt: [
          "Doença roxa — a 5ª doença; apenas 12 cubos no estoque, e ficar sem eles faz a equipe perder.",
          "Carta de Mutação (Mutation) comprada nas Infecções — compre a carta do fundo do Baralho de Infecção (Infection Deck), coloque só 1 cubo roxo ali e descarte as duas cartas; conta como 1 compra de carta de Infecção.",
          "Carta de Evento de Mutação (Mutation Event) comprada — resolva na hora e descarte; não compre uma carta de jogador para substituí-la.",
          "Carta de Infecção de uma cidade que já tem cubo roxo — coloque 1 cubo roxo e 1 cubo da cor da carta.",
          "Curar o roxo — descarte 5 cartas de cidade em qualquer combinação de cores, sendo pelo menos 1 de uma cidade com cubos roxos.",
          "População Resiliente (Resilient Population) — não pode remover uma carta de Mutação da Pilha de Descarte de Infecção (Infection Discard Pile).",
          "Surtos roxos — resolvidos normalmente; a regra de surto explosivo (flare-out) é só do desafio do Bioterrorista (Bio-Terrorist).",
          "Vitória — cure as 5 doenças, ou cure as outras 4 e não tenha nenhum cubo roxo no tabuleiro."
        ]
      },
      cardsOnTable: {
        en: [
          "Nothing in this challenge lives only on the components: the Mutation card face and all 3 Mutation Event card texts are reproduced in the manual (pages 1 and 4).",
          "The purple Discovered Cure Indicator comes both as a sticker for the board and as a separate Cure Indicator card; the manual's only instruction is \"Apply the sticker or use the card for the Mutation or Bio-Terrorist challenges\".",
          "The purple cure marker is two-sided: a plain vial on one side and a vial with a no-entry slash on the other for when the disease is eradicated."
        ],
        pt: [
          "Nada neste desafio existe apenas nos componentes: a face da carta de Mutação (Mutation) e os textos das 3 cartas de Evento de Mutação (Mutation Event) estão reproduzidos no manual (páginas 1 e 4).",
          "O Indicador de Cura Descoberta (Discovered Cure Indicator) roxo vem tanto como adesivo para o tabuleiro quanto como carta avulsa; a única instrução do manual é \"Apply the sticker or use the card for the Mutation or Bio-Terrorist challenges\" (use o adesivo ou a carta nos desafios da Mutação ou do Bioterrorista).",
          "O marcador de cura roxo tem dois lados: um frasco comum de um lado e um frasco com o símbolo de proibido do outro, usado quando a doença é erradicada."
        ]
      },
      compatibility: [
        {
          page: 2,
          text: {
            en: "Experienced players may combine the Virulent Strain with either the Mutation or Bio-Terrorist challenges.",
            pt: "Jogadores experientes podem combinar a Cepa Virulenta (Virulent Strain) com o desafio da Mutação (Mutation) ou com o do Bioterrorista (Bio-Terrorist)."
          }
        },
        {
          page: 5,
          text: {
            en: "The Bio-Terrorist challenge may be combined with the Virulent Strain challenge, but not the Mutation challenge.",
            pt: "O desafio do Bioterrorista (Bio-Terrorist) pode ser combinado com o desafio da Cepa Virulenta (Virulent Strain), mas não com o desafio da Mutação (Mutation)."
          }
        },
        {
          page: 3,
          text: {
            en: "If you are also playing with the Mutation or Bio-Terrorist challenge, the purple disease cannot be the Virulent Strain. Ignore it when determining the Virulent Strain.",
            pt: "Se você também estiver jogando com o desafio da Mutação (Mutation) ou do Bioterrorista (Bio-Terrorist), a doença roxa não pode ser a Cepa Virulenta (Virulent Strain). Ignore-a ao determinar a Cepa Virulenta."
          }
        },
        {
          page: 3,
          text: {
            en: "When combining this challenge with the Mutation challenge, if the card drawn to resolve a Mutation card is a Virulent Strain city, that card does not count towards Rate Effect.",
            pt: "Ao combinar aquele desafio com o da Mutação (Mutation), se a carta comprada para resolver uma carta de Mutação for uma cidade da Cepa Virulenta (Virulent Strain), essa carta não conta para o Efeito de Taxa (Rate Effect)."
          }
        },
        {
          page: 6,
          text: {
            en: "This applies to the Bio-Terrorist challenge only, not the Mutation challenge.",
            pt: "Isso vale somente para o desafio do Bioterrorista (Bio-Terrorist), não para o desafio da Mutação (Mutation)."
          }
        },
        {
          page: 8,
          text: {
            en: "In the Mutation challenge, if the Troubleshooter sees a Mutation card, she does not get to look at the bottom Infection Deck card.",
            pt: "No desafio da Mutação (Mutation), se a Solucionadora de Problemas (Troubleshooter) vir uma carta de Mutação, ela não chega a olhar a carta do fundo do Baralho de Infecção (Infection Deck)."
          }
        }
      ]
    },
    {
      id: "bio-terrorist",
      book: "otb",
      pages: [5, 6, 7],
      hiddenInfo: true,
      name: { en: "Bio-Terrorist", pt: "Bioterrorista" },
      summary: {
        en: "This challenge pits one player, the Bio-Terrorist, against the others, seeking to create panic throughout the world with a 5th disease: he moves secretly around the board, writing his location and actions on a folded Location sheet, and spreads purple cubes while the rest of the team hunts, captures and cures.",
        pt: "Este desafio coloca um jogador, o Bioterrorista (Bio-Terrorist), contra os demais, tentando espalhar pânico pelo mundo com uma 5ª doença: ele se move secretamente pelo tabuleiro, anotando sua localização e suas ações em uma folha de Localização (Location sheet) dobrada, e espalha cubos roxos enquanto o resto da equipe o caça, captura e busca as curas."
      },
      players: {
        min: 3,
        max: 4,
        note: {
          en: "This challenge works with 3 or 4 players. 5 players (1 Bio-Terrorist and 4 other players) is not recommended.",
          pt: "Este desafio funciona com 3 ou 4 jogadores. 5 jogadores (1 Bioterrorista e 4 outros jogadores) não é recomendado."
        }
      },
      components: [
        {
          qty: { en: "1", pt: "1" },
          name: { en: "Bio-Terrorist Role card", pt: "carta de Função do Bioterrorista (Bio-Terrorist Role card)" },
          from: { en: "On the Brink box", pt: "caixa On the Brink" },
          to: { en: "given to the Bio-Terrorist player", pt: "entregue ao jogador Bioterrorista" },
          page: 5
        },
        {
          qty: { en: "1", pt: "1" },
          name: { en: "black pawn", pt: "peão preto" },
          from: { en: "On the Brink box", pt: "caixa On the Brink" },
          to: { en: "kept by the Bio-Terrorist; it begins off the board", pt: "fica com o Bioterrorista; começa fora do tabuleiro" },
          page: 5
        },
        {
          qty: { en: "1 + 1", pt: "1 + 1" },
          name: { en: "Location sheet and a pencil", pt: "folha de Localização (Location sheet) e um lápis" },
          from: { en: "Bio-Terrorist location pad", pt: "bloco de localização do Bioterrorista" },
          to: { en: "given folded to the Bio-Terrorist, who keeps it hidden behind the fold", pt: "entregues dobrados ao Bioterrorista, que os mantém escondidos atrás da dobra" },
          page: 5
        },
        {
          qty: { en: "12", pt: "12" },
          name: { en: "purple disease cubes", pt: "cubos roxos de doença" },
          from: { en: "On the Brink box", pt: "caixa On the Brink" },
          to: { en: "placed near the other cubes as a supply", pt: "colocados perto dos outros cubos como estoque" },
          page: 5
        },
        {
          qty: { en: "1 + 1", pt: "1 + 1" },
          name: {
            en: "purple Discovered Cure Indicator (sticker or card) and purple cure marker",
            pt: "Indicador de Cura Descoberta (Discovered Cure Indicator) roxo — adesivo ou carta — e marcador de cura roxo"
          },
          from: { en: "On the Brink box", pt: "caixa On the Brink" },
          to: { en: "placed on the board", pt: "colocados no tabuleiro" },
          page: 5
        },
        {
          qty: { en: "2", pt: "2" },
          name: { en: "Infection cards", pt: "cartas de Infecção (Infection cards)" },
          from: { en: "Infection Deck", pt: "Baralho de Infecção (Infection Deck)" },
          to: { en: "dealt to the Bio-Terrorist as his starting hand, after infecting 9 cities", pt: "distribuídas ao Bioterrorista como mão inicial, depois de infectar 9 cidades" },
          page: 5
        }
      ],
      setup: {
        en: [
          "Select the Bio-Terrorist player, either randomly, by including the Bio-Terrorist Role card among the Roles dealt out, or by choosing a volunteer.",
          "Give him the Bio-Terrorist Role card, the black pawn, a folded Location sheet, and a pencil. The black pawn begins off the board.",
          "Deal the other Role cards to the non-Terrorist players as usual.",
          "Put the 12 purple disease cubes near the other cubes as a supply.",
          "Put the purple Discovered Cure Indicator and cure marker on the board.",
          "Use 2 Event cards per player in the game, including the Bio-Terrorist (for this purpose only).",
          "Deal Player cards to the non-Terrorist players normally; the Bio-Terrorist gets no Player cards.",
          "After completing the Infect 9 cities setup phase, deal 2 Infection cards to the Bio-Terrorist.",
          "Prepare the Player Deck as usual with the Epidemic cards.",
          "Determine the first player among the non-Terrorist players.",
          "The Bio-Terrorist then secretly notes on his Location sheet the city he will start in, writing it in the STARTING CITY field behind the fold.",
          "The first player begins play."
        ],
        pt: [
          "Escolham o jogador Bioterrorista (Bio-Terrorist): ao acaso, incluindo a carta de Função do Bioterrorista entre as Funções distribuídas, ou escolhendo um voluntário.",
          "Dê a ele a carta de Função do Bioterrorista, o peão preto, uma folha de Localização (Location sheet) dobrada e um lápis. O peão preto começa fora do tabuleiro.",
          "Distribua as demais cartas de Função aos jogadores não terroristas normalmente.",
          "Coloque os 12 cubos roxos de doença perto dos outros cubos, como estoque.",
          "Coloque no tabuleiro o Indicador de Cura Descoberta (Discovered Cure Indicator) roxo e o marcador de cura roxo.",
          "Use 2 cartas de Evento (Event) por jogador da partida, incluindo o Bioterrorista (apenas para essa contagem).",
          "Distribua cartas de jogador aos jogadores não terroristas normalmente; o Bioterrorista não recebe cartas de jogador.",
          "Depois de concluir a etapa Infect 9 cities da preparação, distribua 2 cartas de Infecção ao Bioterrorista.",
          "Prepare o Baralho de Jogadores (Player Deck) como de costume, com as cartas de Epidemia (Epidemic).",
          "Determinem o primeiro jogador entre os jogadores não terroristas.",
          "O Bioterrorista então anota em segredo, na folha de Localização, a cidade em que vai começar, escrevendo-a no campo STARTING CITY atrás da dobra.",
          "O primeiro jogador começa a partida."
        ]
      },
      rules: [
        {
          title: { en: "Turn order and the Bio-Terrorist's turn", pt: "Ordem dos turnos e o turno do Bioterrorista" },
          page: 5,
          lines: {
            en: [
              "Non-Terrorist players take their turns normally, except they now have a possible Capture action.",
              "The Bio-Terrorist takes a turn after each player's turn (after that player Infects Cities).",
              "The Bio-Terrorist can do up to 2 actions, plus 1 Drive/Ferry action (in any order). The optional Drive/Ferry may be done before, after, or between his other 2 actions.",
              "The Bio-Terrorist does not automatically Draw Cards nor Infect Cities; he must use actions to do so.",
              "The Bio-Terrorist uses Infection cards (not Player cards) during play, discarding them to the Infection Discard Pile.",
              "His hand limit is 7 cards; if he has more than 7, he must discard the 8th card to the Infection Discard Pile (without effect).",
              "He may skip any of his actions; the Location sheet has a dash notation for a skipped action."
            ],
            pt: [
              "Os jogadores não terroristas jogam seus turnos normalmente, com a diferença de que agora dispõem de uma possível ação de Capturar (Capture).",
              "O Bioterrorista (Bio-Terrorist) joga um turno depois do turno de cada jogador (depois que aquele jogador Infecta Cidades).",
              "O Bioterrorista pode realizar até 2 ações, mais 1 ação de Dirigir/Balsa (Drive/Ferry), em qualquer ordem. Essa ação opcional de Dirigir/Balsa pode ser feita antes, depois ou entre as outras 2 ações.",
              "O Bioterrorista não compra cartas nem infecta cidades automaticamente; ele precisa gastar ações para isso.",
              "O Bioterrorista usa cartas de Infecção (Infection cards), e não cartas de jogador, durante a partida, descartando-as na Pilha de Descarte de Infecção (Infection Discard Pile).",
              "O limite de mão dele é 7 cartas; se tiver mais de 7, precisa descartar a 8ª carta na Pilha de Descarte de Infecção (sem efeito algum).",
              "Ele pode abrir mão de qualquer uma de suas ações; a folha de Localização (Location sheet) tem uma notação de travessão para a ação pulada."
            ]
          }
        },
        {
          title: { en: "Bio-Terrorist secrecy", pt: "O sigilo do Bioterrorista" },
          page: 5,
          lines: {
            en: [
              "The Bio-Terrorist moves secretly about the board, keeping track of his actions on his Location sheet. The map section is folded down over the action log so that his current location stays hidden from the other players.",
              "The other players never see his written log or his hand of Infection cards; they learn his position only from the public consequences of his actions.",
              "Whenever the Bio-Terrorist is in the same city as other player(s), the Bio-Terrorist is spotted and puts his pawn on the board.",
              "If he (or another player) then moves so that the Bio-Terrorist is not in the same city as another player, the Bio-Terrorist removes his pawn from the board.",
              "If the Bio-Terrorist moves by a Direct or Charter Flight, he discards the card to the Infection Discard Pile and announces that his pawn was sighted at that airport.",
              "He does not reveal if he used the card for a Direct or Charter flight nor on which of his actions this flight took place.",
              "He performs his actions one at a time, possibly placing purple disease cubes, discarding cards, or announcing airport sightings. He does not announce which action he is doing, but players may be able to deduce information based on the order in which things happen.",
              "He is on the honor system for recording his own location and for reporting whenever he is spotted."
            ],
            pt: [
              "O Bioterrorista (Bio-Terrorist) se move em segredo pelo tabuleiro, registrando suas ações na folha de Localização (Location sheet). A parte do mapa é dobrada sobre o registro de ações, de modo que a posição atual dele fique escondida dos outros jogadores.",
              "Os outros jogadores nunca veem o registro escrito nem a mão de cartas de Infecção (Infection) dele; só descobrem onde ele está pelas consequências públicas das ações dele.",
              "Sempre que o Bioterrorista estiver na mesma cidade que outro(s) jogador(es), ele é avistado (spotted) e coloca o peão dele no tabuleiro.",
              "Se ele (ou outro jogador) se mover de modo que o Bioterrorista não esteja mais na mesma cidade que outro jogador, o Bioterrorista retira o peão do tabuleiro.",
              "Se o Bioterrorista se mover por Voo Direto (Direct Flight) ou Voo Fretado (Charter Flight), ele descarta a carta na Pilha de Descarte de Infecção (Infection Discard Pile) e anuncia que o peão dele foi avistado naquele aeroporto.",
              "Ele não revela se usou a carta para um Voo Direto ou um Voo Fretado, nem em qual das ações dele esse voo aconteceu.",
              "Ele executa suas ações uma de cada vez, podendo colocar cubos roxos de doença, descartar cartas ou anunciar avistamentos em aeroportos. Ele não anuncia qual ação está fazendo, mas os jogadores podem deduzir informações pela ordem em que as coisas acontecem.",
              "Ele joga por honra ao anotar a própria localização e ao avisar sempre que for avistado."
            ]
          }
        },
        {
          title: { en: "Capturing the Bio-Terrorist", pt: "Capturando o Bioterrorista" },
          page: 5,
          lines: {
            en: [
              "If the Bio-Terrorist pawn is on the board, a player in the same city as the Bio-Terrorist may, for an action, capture him.",
              "Capture: Put the Bio-Terrorist pawn on the capturing player's Role card. He discards all cards in hand to the Infection Discard Pile (without effect).",
              "While players often plan out their entire turn before taking any actions, turns are done one action at a time. A player who moves and spots the Bio-Terrorist may, if he has any actions left, then choose to capture the Bio-Terrorist.",
              "While captured, the Bio-Terrorist can do only Draw Card or Escape actions."
            ],
            pt: [
              "Se o peão do Bioterrorista (Bio-Terrorist) estiver no tabuleiro, um jogador que esteja na mesma cidade que ele pode, gastando uma ação, capturá-lo.",
              "Capturar (Capture): coloque o peão do Bioterrorista sobre a carta de Função do jogador que o capturou. Ele descarta todas as cartas da mão dele na Pilha de Descarte de Infecção (Infection Discard Pile), sem efeito algum.",
              "Embora os jogadores costumem planejar o turno inteiro antes de agir, os turnos são feitos uma ação de cada vez. Um jogador que se move e avista o Bioterrorista pode, se ainda tiver ações, escolher capturá-lo em seguida.",
              "Enquanto está capturado, o Bioterrorista só pode fazer as ações Comprar Carta (Draw Card) ou Fugir (Escape)."
            ]
          }
        },
        {
          title: { en: "Bio-Terrorist actions", pt: "Ações do Bioterrorista" },
          page: 6,
          lines: {
            en: [
              "On his turn, the Bio-Terrorist may take up to 2 actions, plus 1 Drive/Ferry action.",
              "Each action type may be chosen for either regular action slot. Drive/Ferry can therefore be done twice in the 2 regular slots, plus the optional extra Drive/Ferry (up to 3 total).",
              "Draw Card — Draw 1 card from the Infection Deck into hand.",
              "Drive/Ferry — Move to a connected city.",
              "Direct Flight — Discard an Infection card to move to its city. Announce an airport sighting there.",
              "Charter Flight — Discard the Infection card that matches the city you are in to move to any city. Announce an airport sighting in the city you left."
            ],
            pt: [
              "No turno dele, o Bioterrorista (Bio-Terrorist) pode fazer até 2 ações, mais 1 ação de Dirigir/Balsa (Drive/Ferry).",
              "Cada tipo de ação pode ser escolhido para qualquer um dos 2 espaços de ação comuns. Assim, Dirigir/Balsa pode ser feito nos 2 espaços, mais a ação extra opcional (até 3 vezes no total).",
              "Comprar Carta (Draw Card) — Compre 1 carta do Baralho de Infecção (Infection Deck) para a mão.",
              "Dirigir/Balsa (Drive/Ferry) — Mova-se para uma cidade conectada.",
              "Voo Direto (Direct Flight) — Descarte uma carta de Infecção para se mover até a cidade dela. Anuncie um avistamento no aeroporto de lá.",
              "Voo Fretado (Charter Flight) — Descarte a carta de Infecção correspondente à cidade em que você está para se mover até qualquer cidade. Anuncie um avistamento no aeroporto da cidade de onde você saiu."
            ]
          }
        },
        {
          title: { en: "Hidden actions", pt: "Ações ocultas" },
          page: 6,
          lines: {
            en: [
              "Each hidden action may be done once per turn only while the Bio-Terrorist's pawn is currently off the board (not spotted) and he is not captured.",
              "Infect Locally — Place 1 purple cube on your current city.",
              "Infect Remotely — Discard an Infection card to place 1 purple cube (only) on that city.",
              "Sabotage — Remove a Research Station in your city, discarding an Infection card whose color matches this city. Return the Research Station to the supply.",
              "The Bio-Terrorist may Infect Remotely the city he is in.",
              "Because a hidden action can be taken only while his pawn is off the board, the other players can tell that one happened, but not from where: Infect Locally reveals the city a cube appears in without confirming he is there, while Infect Remotely and Sabotage name a city through the discarded card."
            ],
            pt: [
              "Cada ação oculta pode ser feita uma vez por turno somente enquanto o peão do Bioterrorista estiver fora do tabuleiro (não estiver avistado) e ele não estiver capturado.",
              "Infectar Localmente (Infect Locally) — Coloque 1 cubo roxo na cidade em que você está.",
              "Infectar Remotamente (Infect Remotely) — Descarte uma carta de Infecção (Infection) para colocar 1 cubo roxo (apenas) naquela cidade.",
              "Sabotagem (Sabotage) — Remova uma Estação de Pesquisa (Research Station) da cidade em que você está, descartando uma carta de Infecção cuja cor corresponda à desta cidade. Devolva a Estação de Pesquisa ao estoque.",
              "O Bioterrorista pode Infectar Remotamente a própria cidade em que ele está.",
              "Como uma ação oculta só pode ser feita com o peão fora do tabuleiro, os outros jogadores percebem que ela aconteceu, mas não de onde: Infectar Localmente revela a cidade onde o cubo aparece sem confirmar que ele está lá, enquanto Infectar Remotamente e Sabotagem apontam uma cidade pela carta descartada."
            ]
          }
        },
        {
          title: { en: "While captured and the Escape action", pt: "Enquanto capturado e a ação de Fugir" },
          page: 6,
          lines: {
            en: [
              "While Captured: the Bio-Terrorist can do only Draw Card or Escape actions.",
              "Escape — Discard an Infection Card to move to its city. Announce an airport sighting there. Take back the Bio-Terrorist pawn",
              "Since the Bio-Terrorist loses all cards in hand when captured, his 1st action after being captured will be Draw Card.",
              "He can use this card to Escape or draw another card (skipping his Drive/Ferry action).",
              "After the Bio-Terrorist does an Escape action, he completes his turn normally (taking a 2nd action if he escaped on his 1st action, plus his optional Drive/Ferry action)."
            ],
            pt: [
              "Enquanto Capturado: o Bioterrorista (Bio-Terrorist) só pode fazer as ações Comprar Carta (Draw Card) ou Fugir (Escape).",
              "Fugir (Escape) — Descarte uma carta de Infecção (Infection) para se mover até a cidade dela. Anuncie um avistamento no aeroporto de lá. Retome o peão do Bioterrorista",
              "Como o Bioterrorista perde todas as cartas da mão ao ser capturado, a 1ª ação dele depois da captura será Comprar Carta.",
              "Ele pode usar essa carta para Fugir ou comprar outra carta (abrindo mão da ação de Dirigir/Balsa).",
              "Depois de fazer uma ação de Fugir, o Bioterrorista completa o turno normalmente (fazendo uma 2ª ação, se fugiu na 1ª, mais a ação opcional de Dirigir/Balsa)."
            ]
          }
        },
        {
          title: { en: "Location sheet notation key", pt: "Chave de notação da folha de Localização" },
          page: 5,
          lines: {
            en: [
              "Heading of the key — 2 actions, plus 1 Drive/Ferry, in any order.",
              "Drive/Ferry — write the city name alone, e.g. Atlanta.",
              "Direct Flight — write a straight arrow then the city, e.g. -> Atlanta; announce the airport.",
              "Charter Flight — write a curved arrow then the city, e.g. ~> Atlanta; announce the airport.",
              "Draw Card — write D.",
              "Skipped action — write a dash.",
              "Infect Locally — write I; this is a hidden action, each only once per turn.",
              "Infect Remotely — write R followed by the city, e.g. R Atlanta; discard that city card.",
              "Sabotage — write S; discard a card whose color matches this city.",
              "Captured — write C; you lose your cards.",
              "Draw Card while captured — write D.",
              "Escape — write E followed by an arrow and the city, e.g. E -> Atlanta; announce the airport.",
              "Sheet layout — the pad has a STARTING CITY field, numbered turn rows 1-27, and header columns for Date, Bio-Terrorist, Player 1, Player 2, Player 3 and Winner.",
              "The map half of the sheet folds down over the action log, so the written record stays private while the sheet sits on the table."
            ],
            pt: [
              "Cabeçalho da chave — 2 ações, mais 1 Dirigir/Balsa (Drive/Ferry), em qualquer ordem.",
              "Dirigir/Balsa — escreva apenas o nome da cidade, p. ex. Atlanta.",
              "Voo Direto (Direct Flight) — escreva uma seta reta e a cidade, p. ex. -> Atlanta; anuncie o aeroporto.",
              "Voo Fretado (Charter Flight) — escreva uma seta curva e a cidade, p. ex. ~> Atlanta; anuncie o aeroporto.",
              "Comprar Carta (Draw Card) — escreva D.",
              "Ação pulada — escreva um travessão.",
              "Infectar Localmente (Infect Locally) — escreva I; é uma ação oculta, cada uma só uma vez por turno.",
              "Infectar Remotamente (Infect Remotely) — escreva R seguido da cidade, p. ex. R Atlanta; descarte a carta daquela cidade.",
              "Sabotagem (Sabotage) — escreva S; descarte uma carta cuja cor corresponda à desta cidade.",
              "Capturado (Captured) — escreva C; você perde suas cartas.",
              "Comprar Carta enquanto capturado — escreva D.",
              "Fugir (Escape) — escreva E seguido de uma seta e da cidade, p. ex. E -> Atlanta; anuncie o aeroporto.",
              "Disposição da folha — o bloco tem um campo STARTING CITY (cidade inicial), linhas de turno numeradas de 1 a 27 e colunas de cabeçalho para Date, Bio-Terrorist, Player 1, Player 2, Player 3 e Winner.",
              "A metade do mapa dobra-se sobre o registro de ações, de modo que as anotações continuem privadas mesmo com a folha sobre a mesa."
            ]
          }
        }
        ,
        {
          title: { en: "The Bio-Terrorist (purple) disease and Infections", pt: "A doença do Bioterrorista (roxa) e as Infecções" },
          page: 6,
          lines: {
            en: [
              "The purple disease is like the other 4 diseases, except as noted below.",
              "Purple disease cubes enter play by Bio-Terrorist actions and infections.",
              "There are only 12 (not 24) purple cubes in the supply.",
              "During Infections, if an Infection card is drawn for a city with at least 1 purple cube on it, place both 1 purple cube (if purple is not eradicated) and 1 cube of the card's color (if that disease is not eradicated) on the city, resolving any outbreak(s) normally for the card's color and as below for purple.",
              "An Infection draw is the only time when cubes of both colors are placed.",
              "When the Bio-Terrorist Infects Remotely, only 1 purple cube is placed.",
              "When drawing a card for an Epidemic, only 3 cubes of that color are placed."
            ],
            pt: [
              "A doença roxa funciona como as outras 4 doenças, exceto no que está indicado a seguir.",
              "Os cubos roxos de doença entram em jogo pelas ações do Bioterrorista (Bio-Terrorist) e pelas infecções.",
              "Há apenas 12 (e não 24) cubos roxos no estoque.",
              "Durante as Infecções, se uma carta de Infecção for comprada para uma cidade que tenha pelo menos 1 cubo roxo, coloque nessa cidade tanto 1 cubo roxo (se a doença roxa não estiver erradicada) quanto 1 cubo da cor da carta (se aquela doença não estiver erradicada), resolvendo normalmente qualquer surto da cor da carta e, para o roxo, conforme a regra abaixo.",
              "A compra de uma carta de Infecção é o único momento em que se colocam cubos de duas cores.",
              "Quando o Bioterrorista Infecta Remotamente (Infect Remotely), apenas 1 cubo roxo é colocado.",
              "Ao comprar uma carta para uma Epidemia (Epidemic), apenas 3 cubos daquela cor são colocados."
            ]
          }
        },
        {
          title: { en: "Purple flare-out outbreaks", pt: "Surtos roxos explosivos (flare-out)" },
          page: 6,
          lines: {
            en: [
              "Outbreaks of the Bio-Terrorist's purple disease (only) are so intense that they flare out, leaving the cities they outbreak from with just 1 purple cube.",
              "To do a purple outbreak, remove 2 purple cubes from that city (returning them to the supply) and then place 1 purple cube on each city connected to it (moving the outbreaks marker forward 1 space).",
              "If a purple disease outbreak results in chain reaction outbreaks, do not add purple cubes to cities that have already had an outbreak as part of resolving the current action or Infection card.",
              "This applies to the Bio-Terrorist challenge only, not the Mutation challenge.",
              "Outbreaks of the other 4 colours are resolved exactly as in the base game."
            ],
            pt: [
              "Os surtos da doença roxa do Bioterrorista (Bio-Terrorist) — e somente dela — são tão intensos que se esgotam explodindo (flare out), deixando as cidades de onde partiram com apenas 1 cubo roxo.",
              "Para resolver um surto roxo, retire 2 cubos roxos daquela cidade (devolvendo-os ao estoque) e então coloque 1 cubo roxo em cada cidade conectada a ela (avançando o marcador de surtos 1 espaço).",
              "Se um surto da doença roxa provocar surtos em cadeia, não acrescente cubos roxos em cidades que já tiveram surto durante a resolução da ação ou da carta de Infecção atual.",
              "Isso vale somente para o desafio do Bioterrorista, não para o desafio da Mutação (Mutation).",
              "Os surtos das outras 4 cores são resolvidos exatamente como no jogo básico."
            ]
          }
        },
        {
          title: { en: "Curing the purple disease", pt: "Curando a doença roxa" },
          page: 6,
          lines: {
            en: [
              "When Discovering a Cure for the purple disease, discard 5 City cards in any mix of colors, with at least 1 of them a city that has 1 or more purple cubes on it.",
              "When a Scientist or Field Operative turns in fewer City cards, at least 1 of them must be a city with 1 or more purple cubes on it.",
              "When a cured purple disease has no cubes remaining, flip its cure marker to the eradication side as in the base game.",
              "Eradicating purple knocks the Bio-Terrorist out of the game, so he must be careful not to allow the purple disease to be cured and then immediately eradicated."
            ],
            pt: [
              "Ao Descobrir uma Cura (Discover a Cure) para a doença roxa, descarte 5 cartas de cidade em qualquer combinação de cores, sendo que pelo menos 1 delas precisa ser uma cidade que tenha 1 ou mais cubos roxos.",
              "Quando a Cientista (Scientist) ou o Agente de Campo (Field Operative) entregar menos cartas de cidade, pelo menos 1 delas precisa ser uma cidade com 1 ou mais cubos roxos.",
              "Quando não houver cubos de uma doença roxa já curada, vire seu marcador de cura para o lado de erradicação, como no jogo básico.",
              "Erradicar o roxo tira o Bioterrorista (Bio-Terrorist) da partida, então ele precisa tomar cuidado para não deixar a doença roxa ser curada e logo em seguida erradicada."
            ]
          }
        },
        {
          title: { en: "Etiquette", pt: "Etiqueta à mesa" },
          page: 7,
          lines: {
            en: [
              "The Bio-Terrorist may listen to the other players as they discuss their plans and cards, but should not interrupt them on their turns.",
              "The non-Terrorist players may not hold private discussions nor pass notes to each other.",
              "The Bio-Terrorist may not reveal Infection Cards in hand until playing them, but must disclose, when asked, how many cards are in his hand.",
              "The Bio-Terrorist is on the honor system for recording his own location and reporting whenever he is spotted.",
              "As the Bio-Terrorist can do nothing on the other players' turns and they can do nothing on Bio-Terrorist turns, we recommend that everyone keeps this in mind and plays briskly (although tricky situations needing discussion can arise — this is not intended to prevent these discussions)."
            ],
            pt: [
              "O Bioterrorista (Bio-Terrorist) pode ouvir os outros jogadores enquanto eles discutem planos e cartas, mas não deve interrompê-los nos turnos deles.",
              "Os jogadores não terroristas não podem fazer conversas privadas nem passar bilhetes uns aos outros.",
              "O Bioterrorista não pode revelar as cartas de Infecção (Infection) da mão dele até jogá-las, mas precisa informar, quando perguntado, quantas cartas tem na mão.",
              "O Bioterrorista joga por honra ao anotar a própria localização e ao avisar sempre que for avistado.",
              "Como o Bioterrorista não pode fazer nada nos turnos dos outros jogadores e eles não podem fazer nada nos turnos dele, recomendamos que todos tenham isso em mente e joguem com agilidade (embora possam surgir situações delicadas que exijam discussão — a intenção não é impedir essas conversas)."
            ]
          }
        },
        {
          title: { en: "Example", pt: "Exemplo" },
          page: 7,
          lines: {
            en: [
              "In the mid-game, there is 1 purple cube each in Cairo and Seoul. The Bio-Terrorist is hidden in Seoul and holds 3 Infection cards: Cairo, Istanbul, and Shanghai.",
              "On his turn, the Bio-Terrorist Infects Remotely in Cairo (discarding his Cairo card), Infects Locally in Seoul, and Drives to Shanghai.",
              "He writes on log row 7: R Cairo | I | Shanghai.",
              "The next player takes her turn, neither entering Shanghai nor removing any purple cubes. She draws an Epidemic card that puts 3 red cubes in Beijing and the Infection discards back on the deck.",
              "During the Infections step, Cairo is drawn. Both 1 black cube and 1 purple cube are placed in Cairo.",
              "The Bio-Terrorist then discards his Shanghai card for a Charter Flight to Cairo, announcing a Shanghai airport sighting; Infects Locally in Cairo, producing an outbreak there; and then Drives to Istanbul.",
              "He writes on log row 8: a curved arrow to Cairo | I | Istanbul C.",
              "The next player, however, enters Istanbul with an action left. The Bio-Terrorist announces that he is spotted and places his pawn on Istanbul. The player then Captures him. The Bio-Terrorist discards his Istanbul card and gives this player his pawn.",
              "He writes on log row 9: D | E -> Mexico City | Los Angeles.",
              "On his turn, the Bio-Terrorist draws Mexico City and Escapes, discarding Mexico City and announcing an airport sighting there. He takes back his pawn and then Drives to Los Angeles. His plans to create an outbreak in Istanbul foiled, he heads towards Seoul..."
            ],
            pt: [
              "No meio da partida, há 1 cubo roxo no Cairo e 1 em Seul. O Bioterrorista (Bio-Terrorist) está escondido em Seul e tem 3 cartas de Infecção (Infection) na mão: Cairo, Istambul e Xangai.",
              "No turno dele, o Bioterrorista Infecta Remotamente (Infect Remotely) no Cairo, descartando a carta do Cairo; Infecta Localmente (Infect Locally) em Seul; e Dirige (Drive/Ferry) até Xangai.",
              "Ele anota na linha 7 do registro: R Cairo | I | Xangai.",
              "A jogadora seguinte faz o turno dela sem entrar em Xangai nem remover cubos roxos. Ela compra uma carta de Epidemia (Epidemic) que coloca 3 cubos vermelhos em Pequim e devolve os descartes de Infecção ao topo do baralho.",
              "Durante a etapa de Infecções, o Cairo é comprado. São colocados no Cairo 1 cubo preto e 1 cubo roxo.",
              "O Bioterrorista então descarta a carta de Xangai para um Voo Fretado (Charter Flight) até o Cairo, anunciando um avistamento no aeroporto de Xangai; Infecta Localmente no Cairo, provocando um surto ali; e depois Dirige até Istambul.",
              "Ele anota na linha 8 do registro: seta curva para Cairo | I | Istambul C.",
              "A jogadora seguinte, porém, entra em Istambul ainda com uma ação sobrando. O Bioterrorista anuncia que foi avistado e coloca o peão dele em Istambul. A jogadora então o Captura (Capture). O Bioterrorista descarta a carta de Istambul e entrega o peão dele a essa jogadora.",
              "Ele anota na linha 9 do registro: D | E -> Cidade do México | Los Angeles.",
              "No turno dele, o Bioterrorista compra Cidade do México e Foge (Escape), descartando a carta e anunciando um avistamento no aeroporto de lá. Ele retoma o peão e depois Dirige até Los Angeles. Com os planos de causar um surto em Istambul frustrados, ele ruma para Seul..."
            ]
          }
        }
      ],
      finePoints: [
        {
          page: 5,
          text: {
            en: "While players often plan out their entire turn before taking any actions, turns are done one action at a time. A player who moves and spots the Bio-Terrorist may, if he has any actions left, then choose to capture the Bio-Terrorist.",
            pt: "Embora os jogadores costumem planejar o turno inteiro antes de agir, os turnos são feitos uma ação de cada vez. Um jogador que se move e avista o Bioterrorista (Bio-Terrorist) pode, se ainda tiver ações, escolher capturá-lo em seguida."
          }
        },
        {
          page: 5,
          text: {
            en: "The Bio-Terrorist performs his actions one at a time, possibly placing purple disease cubes, discarding cards, or announcing airport sightings. He does not announce which action he is doing, but players may be able to deduce information based on the order in which things happen.",
            pt: "O Bioterrorista (Bio-Terrorist) executa suas ações uma de cada vez, podendo colocar cubos roxos de doença, descartar cartas ou anunciar avistamentos em aeroportos. Ele não anuncia qual ação está fazendo, mas os jogadores podem deduzir informações pela ordem em que as coisas acontecem."
          }
        },
        {
          page: 6,
          text: {
            en: "As the Bio-Terrorist, record your actions on your Location sheet to track your current location. Suggested notation is provided.",
            pt: "Como Bioterrorista (Bio-Terrorist), anote suas ações na folha de Localização (Location sheet) para acompanhar onde você está. Uma notação sugerida é fornecida."
          }
        },
        {
          page: 6,
          text: {
            en: "The Bio-Terrorist's hand limit is 7 cards; if he has more than 7, he must discard the 8th card to the Infection Discard Pile (without effect).",
            pt: "O limite de mão do Bioterrorista (Bio-Terrorist) é 7 cartas; se ele tiver mais de 7, precisa descartar a 8ª carta na Pilha de Descarte de Infecção (Infection Discard Pile), sem efeito algum."
          }
        },
        {
          page: 6,
          text: {
            en: "The Bio-Terrorist may Infect Remotely the city he is in.",
            pt: "O Bioterrorista (Bio-Terrorist) pode Infectar Remotamente (Infect Remotely) a própria cidade em que ele está."
          }
        },
        {
          page: 6,
          text: {
            en: "Since the Bio-Terrorist loses all cards in hand when captured, his 1st action after being captured will be Draw Card. He can use this card to Escape or draw another card (skipping his Drive/Ferry action). After the Bio-Terrorist does an Escape action, he completes his turn normally (taking a 2nd action if he escaped on his 1st action, plus his optional Drive/Ferry action).",
            pt: "Como o Bioterrorista (Bio-Terrorist) perde todas as cartas da mão ao ser capturado, a 1ª ação dele depois da captura será Comprar Carta (Draw Card). Ele pode usar essa carta para Fugir (Escape) ou comprar outra carta (abrindo mão da ação de Dirigir/Balsa). Depois de uma ação de Fugir, ele completa o turno normalmente (fazendo uma 2ª ação, se fugiu na 1ª, mais a ação opcional de Dirigir/Balsa)."
          }
        },
        {
          page: 6,
          text: {
            en: "An Infection draw is the only time when cubes of both colors are placed. When the Bio-Terrorist Infects Remotely, only 1 purple cube is placed. When drawing a card for an Epidemic, only 3 cubes of that color are placed.",
            pt: "A compra de uma carta de Infecção (Infection) é o único momento em que se colocam cubos de duas cores. Quando o Bioterrorista (Bio-Terrorist) Infecta Remotamente, apenas 1 cubo roxo é colocado. Ao comprar uma carta para uma Epidemia (Epidemic), apenas 3 cubos daquela cor são colocados."
          }
        },
        {
          page: 6,
          text: {
            en: "If a purple disease outbreak results in chain reaction outbreaks, do not add purple cubes to cities that have already had an outbreak as part of resolving the current action or Infection card.",
            pt: "Se um surto da doença roxa provocar surtos em cadeia, não acrescente cubos roxos em cidades que já tiveram surto durante a resolução da ação ou da carta de Infecção (Infection) atual."
          }
        },
        {
          page: 6,
          text: {
            en: "When a Scientist or Field Operative turns in fewer City cards, at least 1 of them must be a city with 1 or more purple cubes on it.",
            pt: "Quando a Cientista (Scientist) ou o Agente de Campo (Field Operative) entregar menos cartas de cidade, pelo menos 1 delas precisa ser uma cidade com 1 ou mais cubos roxos."
          }
        },
        {
          page: 7,
          text: {
            en: "Like any other disease, if you cannot place the number of purple cubes actually needed on the board, the players lose (and the Bio-Terrorist wins). There are only 12 (not 24) purple cubes in the supply!",
            pt: "Como em qualquer outra doença, se não for possível colocar no tabuleiro a quantidade de cubos roxos efetivamente necessária, os jogadores perdem (e o Bioterrorista vence). Há apenas 12 (e não 24) cubos roxos no estoque!"
          }
        },
        {
          page: 7,
          text: {
            en: "The Bio-Terrorist must be careful not to allow the purple disease to be cured and then immediately eradicated.",
            pt: "O Bioterrorista (Bio-Terrorist) precisa tomar cuidado para não deixar a doença roxa ser curada e logo em seguida erradicada."
          }
        },
        {
          page: 7,
          text: {
            en: "As the Bio-Terrorist can do nothing on the other players' turns and they can do nothing on Bio-Terrorist turns, we recommend that everyone keeps this in mind and plays briskly (although tricky situations needing discussion can arise — this is not intended to prevent these discussions).",
            pt: "Como o Bioterrorista (Bio-Terrorist) não pode fazer nada nos turnos dos outros jogadores e eles não podem fazer nada nos turnos dele, recomendamos que todos tenham isso em mente e joguem com agilidade (embora possam surgir situações delicadas que exijam discussão — a intenção não é impedir essas conversas)."
          }
        }
      ],
      winLose: {
        en: [
          "The non-Terrorist players win if they either cure all 5 diseases or cure the 4 standard diseases and have no purple disease cubes on the board.",
          "The Bio-Terrorist wins if the players lose and there is at least 1 purple cube on the board.",
          "The Bio-Terrorist loses (and is out of the game) if the players ever eradicate the purple disease.",
          "Everyone loses if the players lose and there are no purple cubes on the board.",
          "Like any other disease, if you cannot place the number of purple cubes actually needed on the board, the players lose (and the Bio-Terrorist wins). There are only 12 (not 24) purple cubes in the supply!",
          "All the base-game losing conditions still apply to the non-Terrorist players.",
          "Guide interpretation after eradication: set the Bio-Terrorist pawn and any Infection cards in his hand aside; he takes no further turns, and the other players continue until one of their stated win or loss conditions is met."
        ],
        pt: [
          "Os jogadores não terroristas vencem se curarem as 5 doenças ou se curarem as 4 doenças padrão e não houver nenhum cubo da doença roxa no tabuleiro.",
          "O Bioterrorista (Bio-Terrorist) vence se os jogadores perderem e houver pelo menos 1 cubo roxo no tabuleiro.",
          "O Bioterrorista perde (e sai da partida) se os jogadores chegarem a erradicar a doença roxa.",
          "Todos perdem se os jogadores perderem e não houver nenhum cubo roxo no tabuleiro.",
          "Como em qualquer outra doença, se não for possível colocar no tabuleiro a quantidade de cubos roxos efetivamente necessária, os jogadores perdem (e o Bioterrorista vence). Há apenas 12 (e não 24) cubos roxos no estoque!",
          "Todas as condições de derrota do jogo básico continuam valendo para os jogadores não terroristas.",
          "Interpretação do guia após a erradicação: deixe de lado o peão do Bioterrorista e as cartas de Infecção que estiverem na mão dele; ele não joga mais turnos, e os outros jogadores continuam até que uma de suas condições de vitória ou derrota aconteça."
        ]
      },
      quickRef: {
        en: [
          "Turn order — the Bio-Terrorist takes a turn after each player's turn, once that player has infected cities.",
          "Bio-Terrorist turn — up to 2 actions plus 1 Drive/Ferry, in any order; no free card draw and no free infection.",
          "Open actions — Draw Card, Drive/Ferry, Direct Flight, Charter Flight; each may use either regular action slot. Drive/Ferry can be used twice in those slots plus the optional extra (up to 3 total).",
          "Hidden actions — Infect Locally, Infect Remotely, Sabotage; once each per turn only while his pawn is off the board and he is not captured. He is spotted only while sharing a city with a player.",
          "Capture — costs 1 action in the Bio-Terrorist's city: put the pawn on the capturing player's Role card; he discards his whole hand. While captured, only Draw Card and Escape are allowed.",
          "Purple outbreak — remove 2 purple cubes from the city, advance the outbreaks marker 1 space, then place 1 purple cube on each connected city. A city cannot outbreak twice while resolving the same action or Infection card.",
          "Win/lose — non-Terrorists win by curing all 5, or the 4 standard diseases with no purple cubes; the Bio-Terrorist wins if they lose with purple remaining, loses and leaves if purple is eradicated, and everyone loses if they lose with no purple cubes."
        ],
        pt: [
          "Ordem dos turnos — o Bioterrorista (Bio-Terrorist) joga depois do turno de cada jogador, assim que aquele jogador infectou as cidades.",
          "Turno do Bioterrorista — até 2 ações mais 1 Dirigir/Balsa (Drive/Ferry), em qualquer ordem; sem compra de carta grátis e sem infecção grátis.",
          "Ações abertas — Comprar Carta (Draw Card), Dirigir/Balsa (Drive/Ferry), Voo Direto (Direct Flight) e Voo Fretado (Charter Flight); cada uma pode ocupar qualquer um dos 2 espaços comuns. Dirigir/Balsa pode ocupar os dois espaços mais a ação extra (até 3 no total).",
          "Ações ocultas — Infectar Localmente (Infect Locally), Infectar Remotamente (Infect Remotely) e Sabotagem (Sabotage); uma vez cada por turno somente enquanto o peão estiver fora do tabuleiro e o Bioterrorista não estiver capturado. Ele só está avistado enquanto divide uma cidade com outro jogador.",
          "Capturar (Capture) — custa 1 ação na cidade do Bioterrorista: coloque o peão na carta de Papel do jogador que o capturou; o Bioterrorista descarta a mão inteira. Enquanto capturado, só pode Comprar Carta (Draw Card) ou Fugir (Escape).",
          "Surto roxo — retire 2 cubos roxos da cidade, avance o marcador de surtos 1 espaço e então coloque 1 cubo roxo em cada cidade conectada. Uma cidade não entra em surto duas vezes na mesma ação ou carta de Infecção.",
          "Vitória/derrota — os não terroristas vencem curando as 5 doenças, ou as 4 padrão sem cubos roxos; o Bioterrorista vence se eles perderem com roxo restante, perde e sai quando o roxo é erradicado, e todos perdem se eles perderem sem cubos roxos."
        ]
      },
      cardsOnTable: {
        en: [
          "The Bio-Terrorist's own information is physical, not public: his starting city and every action are written on the folded Location sheet, and his hand of Infection cards stays face down until a card is played.",
          "The Location sheet itself is the only place the full notation key, the STARTING CITY field, the numbered turn rows 1-27 and the Date / Bio-Terrorist / Player 1-3 / Winner columns exist; the manual reproduces the notation key on pages 1 and 5.",
          "The Bio-Terrorist Role card prints: \"Use only in the Bio-Terrorist Challenge.\" and \"After each player turn, do up to 2 actions, plus 1 Drive/Ferry action (in any order).\""
        ],
        pt: [
          "As informações do próprio Bioterrorista (Bio-Terrorist) são físicas, não públicas: a cidade inicial e todas as ações ficam escritas na folha de Localização (Location sheet) dobrada, e a mão de cartas de Infecção (Infection) fica virada para baixo até que uma carta seja jogada.",
          "A própria folha de Localização é o único lugar onde existem a chave de notação completa, o campo STARTING CITY, as linhas de turno numeradas de 1 a 27 e as colunas Date / Bio-Terrorist / Player 1-3 / Winner; o manual reproduz a chave de notação nas páginas 1 e 5.",
          "A carta de Papel do Bioterrorista traz impresso: \"Use only in the Bio-Terrorist Challenge.\" e \"After each player turn, do up to 2 actions, plus 1 Drive/Ferry action (in any order).\""
        ]
      },
      compatibility: [
        {
          page: 5,
          text: {
            en: "This challenge works with 3 or 4 players. 5 players (1 Bio-Terrorist and 4 other players) is not recommended.",
            pt: "Este desafio funciona com 3 ou 4 jogadores. 5 jogadores (1 Bioterrorista e 4 outros jogadores) não é recomendado."
          }
        },
        {
          page: 5,
          text: {
            en: "The Bio-Terrorist challenge may be combined with the Virulent Strain challenge, but not the Mutation challenge.",
            pt: "O desafio do Bioterrorista (Bio-Terrorist) pode ser combinado com o desafio da Cepa Virulenta (Virulent Strain), mas não com o desafio da Mutação (Mutation)."
          }
        },
        {
          page: 2,
          text: {
            en: "Experienced players may combine the Virulent Strain with either the Mutation or Bio-Terrorist challenges.",
            pt: "Jogadores experientes podem combinar a Cepa Virulenta (Virulent Strain) com o desafio da Mutação (Mutation) ou com o do Bioterrorista (Bio-Terrorist)."
          }
        },
        {
          page: 3,
          text: {
            en: "If you are also playing with the Mutation or Bio-Terrorist challenge, the purple disease cannot be the Virulent Strain. Ignore it when determining the Virulent Strain.",
            pt: "Se você também estiver jogando com o desafio da Mutação (Mutation) ou do Bioterrorista (Bio-Terrorist), a doença roxa não pode ser a Cepa Virulenta (Virulent Strain). Ignore-a ao determinar a Cepa Virulenta."
          }
        },
        {
          page: 6,
          text: {
            en: "This applies to the Bio-Terrorist challenge only, not the Mutation challenge.",
            pt: "Isso vale somente para o desafio do Bioterrorista (Bio-Terrorist), não para o desafio da Mutação (Mutation)."
          }
        }
      ]
    },
  {
      id: "lab",
      book: "itl",
      pages: [3, 4, 5],
      name: { en: "Lab Challenge", pt: "Desafio do Laboratório (Lab Challenge)" },
      summary: {
        en: "Cures must be developed in the lab before they can be discovered: each disease must be characterized and sequenced, and its cure tested, using lab actions at research stations.",
        pt: "As curas precisam ser desenvolvidas no laboratório antes de poderem ser descobertas: cada doença precisa ser caracterizada e sequenciada, e sua cura testada, usando ações de laboratório (lab actions) nas estações de pesquisa (research stations)."
      },
      players: null,
      components: [
        {
          qty: { en: "1", pt: "1" },
          name: { en: "Lab board", pt: "Tabuleiro do Laboratório (lab board)" },
          from: { en: "In the Lab box", pt: "caixa In the Lab" },
          to: { en: "placed next to the game board", pt: "colocado ao lado do tabuleiro principal" },
          page: 3
        },
        {
          qty: { en: "5", pt: "5" },
          name: { en: "petri dishes", pt: "placas de Petri (petri dishes)" },
          from: { en: "In the Lab box", pt: "caixa In the Lab" },
          to: { en: "one on each of the lab board's 5 circles", pt: "uma em cada um dos 5 círculos do Tabuleiro do Laboratório" },
          page: 3
        },
        {
          qty: { en: "14", pt: "14" },
          name: { en: "Sequence cards", pt: "cartas de Sequência (Sequence cards)" },
          from: { en: "In the Lab box", pt: "caixa In the Lab" },
          to: { en: "shuffled into a draw pile next to the lab board; 1 is drawn face up onto the upper sequence space", pt: "embaralhadas em um monte de compra ao lado do Tabuleiro do Laboratório; 1 delas é comprada e colocada com a face para cima no espaço de Sequência superior" },
          page: 3
        },
        {
          qty: { en: "5", pt: "5" },
          name: { en: "Cure Vials (black, blue, red, yellow, purple)", pt: "Frascos de Cura (Cure Vials) — preto, azul, vermelho, amarelo e roxo" },
          from: { en: "In the Lab box", pt: "caixa In the Lab" },
          to: { en: "used in place of the cure markers; the purple vial only when combining this challenge with the Mutation or Bio-Terrorist challenges", pt: "usados no lugar dos marcadores de cura; o frasco roxo somente ao combinar este desafio com os desafios da Mutação (Mutation) ou do Bioterrorista (Bio-Terrorist)" },
          page: 3
        },
        {
          qty: { en: "5", pt: "5" },
          name: { en: "Lab Reference cards", pt: "cartas de referência de Ações de Laboratório (Lab Reference cards)" },
          from: { en: "In the Lab box", pt: "caixa In the Lab" },
          to: { en: "1 to each player", pt: "1 para cada jogador" },
          page: 3
        },
        {
          qty: { en: "2", pt: "2" },
          name: { en: "revised Role cards (Lab versions of the Epidemiologist and the Researcher)", pt: "cartas de Função revisadas (versões de Laboratório do Epidemiologista e da Pesquisadora)" },
          from: { en: "In the Lab box", pt: "caixa In the Lab" },
          to: { en: "used instead of their base-game cards; the Field Operative role is not used", pt: "usadas no lugar das cartas do jogo básico; a função Agente de Campo (Field Operative) não é usada" },
          page: 3
        },
        {
          qty: { en: "4", pt: "4" },
          name: { en: "Role cards (Field Director, Virologist, Local Liaison, Pilot)", pt: "cartas de Função (Diretor de Campo, Virologista, Agente de Ligação Local e Piloto)" },
          from: { en: "In the Lab box", pt: "caixa In the Lab" },
          to: { en: "added to the other Role cards before shuffling and dealing 1 to each player", pt: "adicionadas às demais cartas de Função antes de embaralhar e distribuir 1 para cada jogador" },
          page: 2
        },
        {
          qty: { en: "3", pt: "3" },
          name: { en: "Event cards (Infection Zone Ban, Improved Sanitation, Sequencing Breakthrough)", pt: "cartas de Evento (Bloqueio da Zona de Infecção, Saneamento Aprimorado e Avanço no Sequenciamento)" },
          from: { en: "In the Lab box", pt: "caixa In the Lab" },
          to: { en: "added to the other Event cards and shuffled face down; use 2 Event cards per player", pt: "adicionadas às demais cartas de Evento e embaralhadas com a face para baixo; use 2 cartas de Evento por jogador" },
          page: 2
        },
        {
          qty: { en: "4", pt: "4" },
          name: { en: "Pawns (magenta, green, pink, light blue)", pt: "peões (magenta, verde, rosa e azul-claro)" },
          from: { en: "In the Lab box", pt: "caixa In the Lab" },
          to: { en: "available so that players of the new roles have a matching pawn", pt: "disponíveis para que os jogadores das novas funções tenham um peão correspondente" },
          page: 1
        }
      ],
      setup: {
        en: [
          "Set up the base game normally, then apply the changes below.",
          "Place the lab board next to the game board. Put the 5 petri dishes on the 5 circles.",
          "Shuffle the Sequence cards. Place this draw pile next to the lab board. Draw a Sequence card and put it face up on the upper sequence space. The lower sequence space starts empty: research line 2 cannot be opened until a 2nd research station is built.",
          "Substitute the cure vials for the cure markers. Use the purple cure vial only when combining this challenge with the Mutation or Bio-Terrorist challenges.",
          "Give each player a Lab Actions reference card.",
          "Do not use the Field Operative role. Use the Lab versions of the Researcher and Epidemiologist instead of their base-game cards.",
          "Add the 4 new Role cards (Field Director, Virologist, Local Liaison, Pilot) to the other Role cards before shuffling and dealing 1 Role card to each player.",
          "Add the 3 new Event cards to the other Event cards and shuffle them face down. Use 2 Event cards per player.",
        ],
        pt: [
          "Prepare o jogo básico normalmente e depois aplique as mudanças abaixo.",
          "Coloque o Tabuleiro do Laboratório (lab board) ao lado do tabuleiro principal. Ponha as 5 placas de Petri (petri dishes) nos 5 círculos.",
          "Embaralhe as cartas de Sequência (Sequence cards). Coloque esse monte de compra ao lado do Tabuleiro do Laboratório. Compre uma carta de Sequência e ponha-a com a face para cima no espaço de Sequência superior. O espaço de Sequência inferior começa vazio: a linha de pesquisa (research line) 2 só pode ser aberta depois que uma 2ª estação de pesquisa (research station) for construída.",
          "Substitua os marcadores de cura pelos Frascos de Cura (Cure Vials). Use o frasco de cura roxo apenas ao combinar este desafio com os desafios da Mutação (Mutation) ou do Bioterrorista (Bio-Terrorist).",
          "Dê a cada jogador uma carta de referência de Ações de Laboratório (Lab Actions reference card).",
          "Não use a função Agente de Campo (Field Operative). Use as versões de Laboratório da Pesquisadora (Researcher) e do Epidemiologista (Epidemiologist) no lugar das cartas do jogo básico.",
          "Acrescente as 4 novas cartas de Função (Diretor de Campo, Virologista, Agente de Ligação Local e Piloto) às demais cartas de Função antes de embaralhar e distribuir 1 carta de Função para cada jogador.",
          "Acrescente as 3 novas cartas de Evento às demais cartas de Evento e embaralhe-as com a face para baixo. Use 2 cartas de Evento por jogador.",
        ]
      },
      rules: [
        {
          title: { en: "How a cure is developed", pt: "Como uma cura é desenvolvida" },
          page: 3,
          lines: {
            en: [
              "In this challenge, before a player can Discover a Cure, the disease must first be characterized and sequenced, and its cure tested, using lab actions to do so.",
              "Each Sequence card shows a disease's structure. The Characterize a Disease lab action determines which disease is being cured. Cubes must then be moved onto the card, using Process a Sample lab actions, to fill each spot on it, 1 cube per spot. Gray spots are filled by cubes of the cure color.",
              "Cubes enter the lab board as samples from Treat Disease actions, in the 2 left-most dishes, before being processed.",
              "2 cures can be worked on at once in separate research lines, as shown by the pairs of spaces on the lab board."
            ],
            pt: [
              "Neste desafio, antes que um jogador possa Descobrir uma Cura (Discover a Cure), a doença precisa primeiro ser caracterizada e sequenciada, e sua cura precisa ser testada, tudo isso por meio de ações de laboratório (lab actions).",
              "Cada carta de Sequência (Sequence card) mostra a estrutura de uma doença. A ação de laboratório Caracterizar uma Doença (Characterize a Disease) determina qual doença está sendo curada. Depois disso, cubos precisam ser movidos para a carta, com ações de laboratório Processar uma Amostra (Process a Sample), até preencher cada ponto dela, 1 cubo por ponto. Os pontos cinzas são preenchidos com cubos da cor da cura.",
              "Os cubos entram no Tabuleiro do Laboratório (lab board) como amostras vindas de ações Tratar Doença (Treat Disease), nas 2 placas mais à esquerda, antes de serem processados.",
              "É possível trabalhar em 2 curas ao mesmo tempo, em linhas de pesquisa (research lines) separadas, como mostram os pares de espaços do Tabuleiro do Laboratório."
            ]
          }
        },
        {
          title: { en: "Play — the master restriction", pt: "Jogo — a restrição principal" },
          page: 3,
          lines: {
            en: [
              "Take turns as in the base game. Some actions are done differently, as noted below.",
              "Important: lab actions must be done at research stations. Any research station can be used — you do not have to use the one you built.",
              "A lab action is an ordinary action: it costs 1 of your 4 actions, unless a role or Build a Research Station grants it as a free bonus action.",
              "Note: the manual sets no separate cap on how many lab actions a player may take in a turn, beyond the 4-action limit and the 'once per turn' wording of the roles that grant free bonus lab actions."
            ],
            pt: [
              "Jogue os turnos como no jogo básico. Algumas ações são feitas de maneira diferente, conforme indicado a seguir.",
              "Importante: as ações de laboratório (lab actions) precisam ser feitas em estações de pesquisa (research stations). Qualquer estação de pesquisa pode ser usada — não precisa ser a que você construiu.",
              "Uma ação de laboratório é uma ação comum: custa 1 das suas 4 ações, a menos que uma função ou a ação Construir uma Estação de Pesquisa (Build a Research Station) a conceda como ação bônus gratuita.",
              "Observação: o manual não estabelece nenhum limite específico de quantas ações de laboratório um jogador pode fazer por turno, além do limite de 4 ações e do texto 'uma vez por turno' das funções que concedem ações de laboratório bônus gratuitas."
            ]
          }
        },
        {
          title: { en: "The lab board", pt: "O Tabuleiro do Laboratório" },
          page: 4,
          lines: {
            en: [
              "Dishes (the 5 circles, left to right): the 2 sample dishes are the two left-most circles — cubes enter the lab here. The centrifuge dish is the top middle circle, the growth dish the centre middle circle, and the separator dish the bottom middle circle. These five names are the ones printed as labels on the lab board diagram.",
              "Research lines (the right half): two panels, the upper one being research line 1 and the lower one research line 2.",
              "Each research line panel has three spaces, left to right: a Sequence space (holds this line's Sequence card), a Characterize space (holds the City card played to set the cure color) and a Test space (holds the City card played to Test a Cure).",
              "The cure vial sits on the Sequence card once the line has been characterized; it leaves the lab board for its cure indicator when the disease is cured.",
              "Between the two panels, four round icons show the workflow order: Sequence card, Characterize, Test, cure vial. This strip is a reminder, not a cure track.",
              "Arrows printed between the dishes show which Process a Sample moves are legal, and each arrow carries a small symbol for the adjustment that move makes.",
              "Gap: those arrow adjustment symbols are too small to be legible in the rulebook art at any available resolution, so this guide does not describe the glyphs themselves. The manual's Process a Sample text states every legal move and its adjustment in full — use that text (see 'Process a Sample').",
              "The lab board labels the City card on a characterize space as a \"Characterize card\"; this is a City card in play, not a separate component."
            ],
            pt: [
              "Placas (os 5 círculos, da esquerda para a direita): as 2 placas de amostra (sample dishes) são os dois círculos mais à esquerda — é por elas que os cubos entram no laboratório. A placa da centrífuga (centrifuge dish) é o círculo central superior, a placa de cultivo (growth dish) é o círculo central do meio e a placa do separador (separator dish) é o círculo central inferior. Esses cinco nomes são exatamente os impressos como legendas no diagrama do Tabuleiro do Laboratório (lab board).",
              "Linhas de pesquisa (research lines), na metade direita: dois painéis, sendo o de cima a linha de pesquisa 1 e o de baixo a linha de pesquisa 2.",
              "Cada painel de linha de pesquisa tem três espaços, da esquerda para a direita: o espaço de Sequência (Sequence space), que recebe a carta de Sequência (Sequence card) daquela linha; o espaço de caracterização (Characterize space), que recebe a carta de Cidade (City card) jogada para definir a cor da cura; e o espaço de teste (Test space), que recebe a carta de Cidade jogada para Testar uma Cura (Test a Cure).",
              "O frasco de cura (cure vial) fica sobre a carta de Sequência assim que a linha é caracterizada; ele deixa o Tabuleiro do Laboratório rumo ao seu indicador de cura quando a doença é curada.",
              "Entre os dois painéis, quatro ícones redondos mostram a ordem do fluxo de trabalho: carta de Sequência, Caracterizar, Testar e frasco de cura. Essa faixa é um lembrete, não uma trilha de cura.",
              "Setas impressas entre as placas mostram quais movimentos de Processar uma Amostra (Process a Sample) são legais, e cada seta traz um pequeno símbolo do ajuste que aquele movimento provoca.",
              "Lacuna: esses símbolos de ajuste das setas são pequenos demais para serem legíveis na arte do manual em qualquer resolução disponível, por isso este guia não descreve os desenhos em si. O texto de Processar uma Amostra do manual informa por extenso todos os movimentos legais e seus ajustes — use esse texto (veja 'Processar uma Amostra').",
              "O diagrama do Tabuleiro do Laboratório rotula a carta de Cidade em um espaço de caracterização como \"Characterize card\"; trata-se de uma carta de Cidade em jogo, não de um componente separado."
            ]
          }
        },
        {
          title: { en: "Lab actions", pt: "Ações de laboratório" },
          page: 4,
          lines: {
            en: [
              "Characterize a Disease — place 1 City card on a research line's characterize space to be that line's cure color; it must match 1 of the Sequence card's vial symbols, and that cure vial goes onto the Sequence card.",
              "Process a Sample — move all cubes from 1 dish along 1 arrow to a new dish or Sequence card, adjusting them as shown on the arrow used; cubes may not be moved onto a Sequence card without a cure vial.",
              "Test a Cure — if a research line's Sequence card has any cubes on it, place 1 City card that matches the line's cure color on the test space and remove 1 cube of this color from any city to the supply.",
              "Sequence a Disease — draw a Sequence card and place, swap, or discard it; if swapped and its cure vial still matches, keep the vial and any matching cubes.",
              "Discover a Cure — at any research station, discard 3 City cards of the cure color to cure a complete research line's disease, then open a new research line.",
              "The first four are the actions printed on the 'Lab Actions (Must be at a Research Station)' side of the reference card and are the ones the rulebook labels '(lab action)'. Discover a Cure is printed on the 'Revised Actions' side and also requires a research station."
            ],
            pt: [
              "Caracterizar uma Doença (Characterize a Disease) — coloque 1 carta de Cidade (City card) no espaço de caracterização de uma linha de pesquisa para definir a cor da cura daquela linha; ela precisa corresponder a 1 dos símbolos de frasco da carta de Sequência, e esse frasco de cura vai para cima da carta de Sequência.",
              "Processar uma Amostra (Process a Sample) — mova todos os cubos de 1 placa por 1 seta até uma nova placa ou carta de Sequência, ajustando-os conforme indicado na seta usada; cubos não podem ser movidos para uma carta de Sequência que não tenha um frasco de cura.",
              "Testar uma Cura (Test a Cure) — se a carta de Sequência de uma linha de pesquisa tiver pelo menos 1 cubo, coloque no espaço de teste 1 carta de Cidade que corresponda à cor da cura daquela linha e remova 1 cubo dessa cor de qualquer cidade, devolvendo-o à reserva.",
              "Sequenciar uma Doença (Sequence a Disease) — compre uma carta de Sequência e coloque-a, troque-a ou descarte-a; se for trocada e o frasco de cura ainda corresponder, mantenha o frasco e todos os cubos compatíveis.",
              "Descobrir uma Cura (Discover a Cure) — em qualquer estação de pesquisa, descarte 3 cartas de Cidade da cor da cura para curar a doença de uma linha de pesquisa completa e então abra uma nova linha de pesquisa.",
              "As quatro primeiras são as ações impressas no lado 'Lab Actions (Must be at a Research Station)' da carta de referência e são as que o manual rotula como '(lab action)'. Descobrir uma Cura está impressa no lado 'Revised Actions' e também exige uma estação de pesquisa."
            ]
          }
        },
        {
          title: { en: "Revised base actions", pt: "Ações básicas revisadas" },
          page: 3,
          lines: {
            en: [
              "Build a Research Station — discard the City card that matches the city you are in to place a research station there. Do 1 lab action, as a free, bonus action.",
              "Treat Disease — remove 1 disease cube from the city you are in. If this color is cured, remove all cubes of that color from the city. You may put 1 removed cube in a sample dish.",
              "Discover a Cure — at any research station, discard 3 City cards of the same disease color to cure that disease (the research line must be complete). Open a new research line.",
              "Share Knowledge (no change) — either give the card that matches the city you are in to another player, or take that card from another player. The other player must also be in the city with you.",
              "All other base-game actions are unchanged."
            ],
            pt: [
              "Construir uma Estação de Pesquisa (Build a Research Station) — descarte a carta de Cidade correspondente à cidade em que você está para colocar uma estação de pesquisa ali. Faça 1 ação de laboratório como ação bônus gratuita.",
              "Tratar Doença (Treat Disease) — remova 1 cubo de doença da cidade em que você está. Se essa cor estiver curada, remova todos os cubos daquela cor da cidade. Você pode colocar 1 cubo removido em uma placa de amostra.",
              "Descobrir uma Cura (Discover a Cure) — em qualquer estação de pesquisa, descarte 3 cartas de Cidade da mesma cor de doença para curar aquela doença (a linha de pesquisa precisa estar completa). Abra uma nova linha de pesquisa.",
              "Compartilhar Conhecimento (Share Knowledge), sem alteração — ou dê a carta correspondente à cidade em que você está para outro jogador, ou pegue essa carta de outro jogador. O outro jogador também precisa estar na cidade com você.",
              "Todas as demais ações do jogo básico permanecem inalteradas."
            ]
          }
        },
        {
          title: { en: "Build a Research Station in the Lab challenge", pt: "Construir uma Estação de Pesquisa no Desafio do Laboratório" },
          page: 4,
          lines: {
            en: [
              "After building a research station, the player building it may immediately do 1 lab action as a free, bonus action.",
              "When placing a research station with the Event, Government Grant, the player may still do a bonus lab action, even if the new research station is not in the city that player is in."
            ],
            pt: [
              "Depois de construir uma estação de pesquisa (research station), o jogador que a construiu pode imediatamente fazer 1 ação de laboratório (lab action) como ação bônus gratuita.",
              "Ao colocar uma estação de pesquisa com o Evento Verba Governamental (Government Grant), o jogador ainda assim pode fazer uma ação de laboratório bônus, mesmo que a nova estação de pesquisa não esteja na cidade em que ele se encontra."
            ]
          }
        },
        {
          title: { en: "Treat Disease — taking samples", pt: "Tratar Doença — coletando amostras" },
          page: 4,
          lines: {
            en: [
              "1 cube removed by this action may be put in either of the 2 sample dishes (instead of the supply).",
              "This is the only way cubes enter the lab: a cube removed from the board by Events, the Containment Specialist's ability, the Medic's ability to automatically remove cured disease cubes, etc. may not be placed in a sample dish.",
              "Cubes cannot be freely returned from the lab to the supply — once in the lab, a cube leaves only through an adjustment, by filling a Sequence card spot, or when a Sequence card is discarded."
            ],
            pt: [
              "1 cubo removido por esta ação pode ser colocado em qualquer uma das 2 placas de amostra (sample dishes), em vez de voltar para a reserva.",
              "Essa é a única forma de os cubos entrarem no laboratório: um cubo removido do tabuleiro por Eventos, pela habilidade do Especialista em Contenção (Containment Specialist), pela habilidade do Médico (Medic) de remover automaticamente cubos de doenças curadas etc. não pode ser colocado em uma placa de amostra.",
              "Os cubos não podem ser devolvidos livremente do laboratório para a reserva — uma vez no laboratório, um cubo só sai por meio de um ajuste, ao preencher um ponto de uma carta de Sequência (Sequence card) ou quando uma carta de Sequência é descartada."
            ]
          }
        },
        {
          title: { en: "Characterize a Disease (lab action)", pt: "Caracterizar uma Doença (ação de laboratório)" },
          page: 4,
          lines: {
            en: [
              "Play a City card on a characterize space to set the cure color for this research line. This color must match a vial symbol shown on the Sequence card.",
              "Move this color's cure vial onto the Sequence card to mark it.",
              "A research line must be characterized before cubes can be moved onto its Sequence card.",
              "Sequence cards differ in how many cure colors they allow: the illustrated examples show cards with 1 vial symbol, with 2, and with all 5.",
              "If a research line is characterized as the same disease as the other research line, move the cure vial. Close the other research line by discarding its City and Sequence cards, returning any cubes to the supply.",
              "In the Mutation or Bio-Terrorist challenges, the City card used to characterize the purple disease must be a city with at least 1 purple cube."
            ],
            pt: [
              "Jogue uma carta de Cidade (City card) em um espaço de caracterização (characterize space) para definir a cor da cura desta linha de pesquisa. Essa cor precisa corresponder a um símbolo de frasco mostrado na carta de Sequência (Sequence card).",
              "Mova o frasco de cura (cure vial) dessa cor para cima da carta de Sequência, marcando-a.",
              "Uma linha de pesquisa precisa estar caracterizada antes que cubos possam ser movidos para a sua carta de Sequência.",
              "As cartas de Sequência variam quanto ao número de cores de cura que permitem: os exemplos ilustrados mostram cartas com 1 símbolo de frasco, com 2 e com todos os 5.",
              "Se uma linha de pesquisa for caracterizada com a mesma doença da outra linha de pesquisa, mova o frasco de cura. Feche a outra linha de pesquisa, descartando a carta de Cidade e a carta de Sequência dela e devolvendo à reserva todos os cubos que estiverem lá.",
              "Nos desafios da Mutação (Mutation) ou do Bioterrorista (Bio-Terrorist), a carta de Cidade usada para caracterizar a doença roxa precisa ser uma cidade com pelo menos 1 cubo roxo."
            ]
          }
        },
        {
          title: { en: "Process a Sample (lab action)", pt: "Processar uma Amostra (ação de laboratório)" },
          page: 4,
          lines: {
            en: [
              "Move all cubes from 1 dish along 1 arrow to a new dish or Sequence card, adjusting them as shown on the arrow used. Return any cubes lost from adjustments to the supply.",
              "All cubes in the source dish must be moved — you may not move only part of a dish.",
              "Sample dish to centrifuge dish: put all cubes of 1 color in it and return the rest to the supply.",
              "Sample dish to separator dish: put 1 cube of each color present in it and return the rest to the supply.",
              "Cubes already in the centrifuge or separator dish (from earlier process actions) are not affected.",
              "Centrifuge or separator dish to growth dish: double each cube moved, using cubes from the supply. Cubes already in the growth dish (from earlier process actions) are not affected.",
              "Centrifuge, separator or growth dish to 1 Sequence card (not both): this Sequence card must be characterized. Fill empty Sequence card spots with cubes that match their colors, 1 cube per spot. Return any cubes left over to the supply.",
              "Each spot on a Sequence card is either red, yellow, blue, black, or gray. Cubes on gray spots must match the cure color. A spot with an eradicated disease's color can be filled with any color cube.",
              "If you can't place the number of cubes needed in the growth dish, because there are not enough of the needed cubes left in the supply, the game ends and your team has lost!",
              "Example: 1 red and 2 blue cubes are in a sample dish. They can be moved to either the centrifuge dish (returning either 1 red or 2 blue cubes to the supply) or the separator dish (returning 1 blue cube to the supply).",
              "Example: 1 yellow and 2 black cubes in the separator dish are moved to the growth dish, doubling to become 2 yellow and 4 black cubes."
            ],
            pt: [
              "Mova todos os cubos de 1 placa por 1 seta até uma nova placa ou carta de Sequência (Sequence card), ajustando-os conforme indicado na seta usada. Devolva à reserva todos os cubos perdidos nos ajustes.",
              "Todos os cubos da placa de origem precisam ser movidos — não é permitido mover apenas parte do conteúdo de uma placa.",
              "Placa de amostra (sample dish) para a placa da centrífuga (centrifuge dish): coloque nela todos os cubos de 1 cor e devolva os demais à reserva.",
              "Placa de amostra para a placa do separador (separator dish): coloque nela 1 cubo de cada cor presente e devolva os demais à reserva.",
              "Os cubos que já estiverem na placa da centrífuga ou na placa do separador (de ações de processamento anteriores) não são afetados.",
              "Placa da centrífuga ou do separador para a placa de cultivo (growth dish): dobre cada cubo movido, pegando cubos da reserva. Os cubos que já estiverem na placa de cultivo (de ações anteriores) não são afetados.",
              "Placa da centrífuga, do separador ou de cultivo para 1 carta de Sequência (não para as duas): essa carta de Sequência precisa estar caracterizada. Preencha os pontos vazios da carta de Sequência com cubos que correspondam às cores deles, 1 cubo por ponto. Devolva à reserva os cubos que sobrarem.",
              "Cada ponto de uma carta de Sequência é vermelho, amarelo, azul, preto ou cinza. Os cubos nos pontos cinzas precisam corresponder à cor da cura. Um ponto da cor de uma doença erradicada pode ser preenchido com um cubo de qualquer cor.",
              "Se você não conseguir colocar a quantidade de cubos necessária na placa de cultivo porque não restam cubos suficientes da cor exigida na reserva, o jogo acaba e sua equipe perdeu!",
              "Exemplo: há 1 cubo vermelho e 2 cubos azuis em uma placa de amostra. Eles podem ser movidos para a placa da centrífuga (devolvendo à reserva 1 cubo vermelho ou 2 cubos azuis) ou para a placa do separador (devolvendo 1 cubo azul à reserva).",
              "Exemplo: 1 cubo amarelo e 2 cubos pretos na placa do separador são movidos para a placa de cultivo, dobrando e se tornando 2 cubos amarelos e 4 cubos pretos."
            ]
          }
        },
        {
          title: { en: "Test a Cure (lab action)", pt: "Testar uma Cura (ação de laboratório)" },
          page: 5,
          lines: {
            en: [
              "Play a City card of the cure color on a research line's test space. This research line's Sequence card must have at least 1 cube on it. Remove 1 cube of the cure color from any city to the supply.",
              "So a cure cannot be tested until the line has been characterized (it has no cure color before that) and at least 1 cube is on its Sequence card.",
              "The cube removed by Test a Cure is returned to the supply — it does not enter the lab.",
              "The removed cube may be taken from any city on the board; you do not have to be in that city.",
              "A research line is tested once this card is on its test space; the test card stays there until the line is cured, closed, or its Sequence card is swapped for a non-matching one.",
              "A different player than the one who intends to Discover a Cure can test it.",
              "In the Mutation: Worldwide Panic scenario (only), the city card used to Test a Cure for the purple disease must be a city with at least 1 purple cube in it (which need not be the cube removed). In the Bio-Terrorist and standard Mutation challenges, any city card may be used."
            ],
            pt: [
              "Jogue uma carta de Cidade (City card) da cor da cura no espaço de teste (test space) de uma linha de pesquisa (research line). A carta de Sequência (Sequence card) dessa linha de pesquisa precisa ter pelo menos 1 cubo sobre ela. Remova 1 cubo da cor da cura de qualquer cidade, devolvendo-o à reserva.",
              "Portanto, uma cura não pode ser testada enquanto a linha não tiver sido caracterizada (antes disso ela não tem cor de cura) e não houver pelo menos 1 cubo na carta de Sequência dela.",
              "O cubo removido por Testar uma Cura (Test a Cure) volta para a reserva — ele não entra no laboratório.",
              "O cubo removido pode ser retirado de qualquer cidade do tabuleiro; você não precisa estar naquela cidade.",
              "Uma linha de pesquisa está testada assim que essa carta estiver no espaço de teste; a carta de teste permanece ali até que a linha seja curada, fechada, ou até que a carta de Sequência dela seja trocada por outra que não corresponda.",
              "Um jogador diferente daquele que pretende Descobrir uma Cura (Discover a Cure) pode fazer o teste.",
              "No cenário Mutação: Pânico Mundial (Mutation: Worldwide Panic), e somente nele, a carta de cidade usada para Testar uma Cura da doença roxa precisa ser uma cidade com pelo menos 1 cubo roxo (que não precisa ser o cubo removido). Nos desafios do Bioterrorista (Bio-Terrorist) e da Mutação padrão, qualquer carta de cidade pode ser usada."
            ]
          }
        },
        {
          title: { en: "Discover a Cure in the Lab challenge", pt: "Descobrir uma Cura no Desafio do Laboratório" },
          page: 5,
          lines: {
            en: [
              "If a research line is complete — meaning that it has been characterized, tested, and all spots on its Sequence card are filled with cubes — then discard 3 (not 5) City cards matching its cure color at a research station to cure this disease.",
              "So all three conditions must hold at once: characterized, tested, and every spot on the Sequence card filled.",
              "Move the cure vial to its cure indicator. Discard the City cards to the Player Discard Pile. Discard the Sequence card, returning its cubes to the supply. Draw and place a new Sequence card to open a new research line.",
              "The City cards played on the characterize and test spaces are separate from the 3 cards discarded here.",
              "The Scientist discards 2, not 3, cards to Discover a Cure. Some game effects change the number of discards needed to Discover a Cure; apply them to 3 (not 5) in the Lab challenge.",
              "In the Mutation or Bio-Terrorist challenges, the City cards discarded to cure the purple disease can be of any color. These cities need not have purple cubes on them.",
              "Guide interpretation: because the cure vials replace the cure markers, a cured disease's vial goes to that disease's cure indicator on the main game board. The lab board's central strip is a workflow reminder, not a cure track."
            ],
            pt: [
              "Se uma linha de pesquisa (research line) estiver completa — ou seja, se ela tiver sido caracterizada, testada e todos os pontos da carta de Sequência (Sequence card) dela estiverem preenchidos com cubos —, descarte 3 (e não 5) cartas de Cidade (City cards) da cor da cura dela, estando em uma estação de pesquisa (research station), para curar essa doença.",
              "Portanto, as três condições precisam valer ao mesmo tempo: caracterizada, testada e com todos os pontos da carta de Sequência preenchidos.",
              "Mova o frasco de cura (cure vial) para o indicador de cura dele. Descarte as cartas de Cidade na Pilha de Descarte dos Jogadores (Player Discard Pile). Descarte a carta de Sequência, devolvendo à reserva os cubos que estavam nela. Compre e coloque uma nova carta de Sequência para abrir uma nova linha de pesquisa.",
              "As cartas de Cidade jogadas nos espaços de caracterização e de teste são separadas das 3 cartas descartadas aqui.",
              "A Cientista (Scientist) descarta 2 cartas, e não 3, para Descobrir uma Cura (Discover a Cure). Alguns efeitos de jogo alteram o número de descartes necessários para Descobrir uma Cura; no Desafio do Laboratório, aplique-os sobre 3 (e não sobre 5).",
              "Nos desafios da Mutação (Mutation) ou do Bioterrorista (Bio-Terrorist), as cartas de Cidade descartadas para curar a doença roxa podem ser de qualquer cor. Essas cidades não precisam ter cubos roxos.",
              "Interpretação do guia: como os frascos de cura substituem os marcadores, o frasco de uma doença curada vai para o indicador de cura daquela doença no tabuleiro principal. A faixa central do Tabuleiro do Laboratório é um lembrete do fluxo de trabalho, não uma trilha de cura."
            ]
          }
        },
        {
          title: { en: "Sequence a Disease (lab action)", pt: "Sequenciar uma Doença (ação de laboratório)" },
          page: 5,
          lines: {
            en: [
              "Draw a Sequence card (reshuffle the discards to form a new draw pile if there are none left to draw). Place it on an empty Sequence space, swap it for an existing Sequence card, or discard it.",
              "You may not place a Sequence card on an empty Sequence space until a 2nd research station is built.",
              "If a swapped Sequence card had been characterized and the new Sequence card doesn't match its cure vial, discard its characterization card, as well as any test card, and return its cure vial and any cubes on it to the supply.",
              "If the new Sequence card does match its cure vial, then use any cubes on the old card to fill out spots on the new one, returning any excess cubes to the supply.",
              "Discard the old Sequence card.",
              "So a matching swap keeps the line characterized and tested and carries its cubes over as far as the new card's spots allow; a non-matching swap wipes the line back to an uncharacterized, untested Sequence card.",
              "Since an open research line already has a Sequence card, this action is not necessary to Discover a Cure. It allows players to open the 2nd research line, replace Sequence cards for already cured diseases with new ones, or find more efficient Sequence cards."
            ],
            pt: [
              "Compre uma carta de Sequência (Sequence card) — se não houver mais nenhuma para comprar, embaralhe os descartes para formar um novo monte de compra. Coloque-a em um espaço de Sequência vazio, troque-a por uma carta de Sequência já em jogo ou descarte-a.",
              "Você não pode colocar uma carta de Sequência em um espaço de Sequência vazio enquanto uma 2ª estação de pesquisa (research station) não tiver sido construída.",
              "Se a carta de Sequência trocada já tiver sido caracterizada e a nova carta de Sequência não corresponder ao frasco de cura (cure vial) dela, descarte a carta de caracterização, bem como qualquer carta de teste, e devolva à reserva o frasco de cura e todos os cubos que estiverem sobre a carta.",
              "Se a nova carta de Sequência corresponder ao frasco de cura, use os cubos que estavam na carta antiga para preencher os pontos da nova, devolvendo à reserva os cubos excedentes.",
              "Descarte a carta de Sequência antiga.",
              "Ou seja: uma troca compatível mantém a linha caracterizada e testada e transfere os cubos até onde os pontos da nova carta permitirem; uma troca incompatível zera a linha, deixando apenas uma carta de Sequência não caracterizada e não testada.",
              "Como uma linha de pesquisa aberta já tem uma carta de Sequência, esta ação não é necessária para Descobrir uma Cura (Discover a Cure). Ela serve para abrir a 2ª linha de pesquisa, substituir cartas de Sequência de doenças já curadas por novas, ou procurar cartas de Sequência mais eficientes."
            ]
          }
        },
        {
          title: { en: "Sequence cards and Characterize cards", pt: "Cartas de Sequência e cartas de caracterização" },
          page: 3,
          lines: {
            en: [
              "A Sequence card shows a disease's structure: coloured spots joined by bonds. Each spot takes exactly 1 cube and is red, yellow, blue, black, or gray; gray spots must be filled with cubes of the cure color, and a spot of an eradicated disease's color can be filled by a cube of any color.",
              "Top right of the card is a circle holding 1 to 5 small cure vial symbols: these are the cure colors this card may be characterized as. The cure vial played is placed on the card.",
              "The coloured squares along the card's top edge correspond to its spots; use the physical card to see the spot colours and cure-vial choices.",
              "Every In the Lab card, Sequence cards included, carries the expansion icon in its lower right corner so you can separate them from base-game cards.",
              "The 14 Sequence cards have different spot arrangements and cure-vial choices; use the face-up physical card when filling a research line.",
              "The \"Characterize card\" and \"test card\" labels mean City cards played face up on those research-line spaces; neither is a separate component.",
              "The illustrated example of a research line in play: a Sequence card marked with the red cure vial and partly filled (1 yellow cube and 4 red cubes, with 1 gray spot still empty), a Bangkok City card on the characterize space, and a Sydney City card being played onto the test space."
            ],
            pt: [
              "Uma carta de Sequência (Sequence card) mostra a estrutura de uma doença: pontos coloridos ligados por traços. Cada ponto recebe exatamente 1 cubo e é vermelho, amarelo, azul, preto ou cinza; os pontos cinzas precisam ser preenchidos com cubos da cor da cura, e um ponto da cor de uma doença erradicada pode ser preenchido por um cubo de qualquer cor.",
              "No canto superior direito da carta há um círculo com 1 a 5 pequenos símbolos de frasco de cura (cure vial): são as cores de cura com que aquela carta pode ser caracterizada. O frasco de cura jogado é colocado sobre a carta.",
              "Os quadradinhos coloridos na borda superior da carta correspondem aos seus pontos; use a carta física para ver as cores e as opções de frasco de cura.",
              "Toda carta de In the Lab, incluindo as cartas de Sequência, traz o ícone da expansão no canto inferior direito, para que você possa separá-las das cartas do jogo básico.",
              "As 14 cartas de Sequência têm combinações diferentes de pontos e opções de frasco de cura; use a carta física virada para cima ao preencher uma linha de pesquisa.",
              "Os rótulos \"Characterize card\" e \"test card\" indicam cartas de Cidade jogadas com a face para cima nesses espaços da linha de pesquisa; nenhum deles é um componente separado.",
              "O exemplo ilustrado de uma linha de pesquisa em jogo: uma carta de Sequência marcada com o frasco de cura vermelho e parcialmente preenchida (1 cubo amarelo e 4 cubos vermelhos, com 1 ponto cinza ainda vazio), uma carta de Cidade de Bangkok no espaço de caracterização e uma carta de Cidade de Sydney sendo jogada no espaço de teste."
            ]
          }
        },
        {
          title: { en: "Roles and research lines", pt: "Funções e linhas de pesquisa" },
          page: 3,
          lines: {
            en: [
              "Do not use the Field Operative role. Use the Lab versions of the Researcher and Epidemiologist.",
              "The Researcher's and Epidemiologist's abilities are unchanged, except for their new Lab challenge abilities. The Local Liaison also has a Lab challenge ability (used only in this challenge).",
              "Lab version of the Researcher: once per turn, at a research station, she may Sequence a Disease as a free bonus action.",
              "Lab version of the Epidemiologist: once per turn, at a research station, she may Process a Sample as a free bonus action.",
              "Local Liaison: once per turn, at a research station, she may either Characterize a Disease or Test a Cure as a free bonus action.",
              "The described ways to close a research line are characterizing the other line as the same disease, or closing one by Bio-Terrorist Sabotage.",
              "In the Bio-Terrorist challenge, if the number of research stations on the board is, due to Sabotage, fewer than the number of Sequence cards on the lab board, the Bio-Terrorist chooses a line of research to close, discarding its Sequence card (returning any cubes on it to the supply) and any City cards played to characterize it or test its cure."
            ],
            pt: [
              "Não use a função Agente de Campo (Field Operative). Use as versões de Laboratório da Pesquisadora (Researcher) e do Epidemiologista (Epidemiologist).",
              "As habilidades da Pesquisadora e do Epidemiologista não mudam, exceto pelas novas habilidades do Desafio do Laboratório. A Agente de Ligação Local (Local Liaison) também tem uma habilidade do Desafio do Laboratório (usada apenas neste desafio).",
              "Versão de Laboratório da Pesquisadora: uma vez por turno, em uma estação de pesquisa (research station), ela pode Sequenciar uma Doença (Sequence a Disease) como ação bônus gratuita.",
              "Versão de Laboratório do Epidemiologista: uma vez por turno, em uma estação de pesquisa, ele pode Processar uma Amostra (Process a Sample) como ação bônus gratuita.",
              "Agente de Ligação Local: uma vez por turno, em uma estação de pesquisa, ela pode Caracterizar uma Doença (Characterize a Disease) ou Testar uma Cura (Test a Cure) como ação bônus gratuita.",
              "As formas descritas de fechar uma linha de pesquisa são caracterizar a outra linha como a mesma doença ou fechá-la por causa da Sabotagem do Bioterrorista.",
              "No desafio do Bioterrorista, se o número de estações de pesquisa no tabuleiro for, por causa da Sabotagem, menor que o número de cartas de Sequência (Sequence cards) no Tabuleiro do Laboratório (lab board), o Bioterrorista escolhe uma linha de pesquisa para fechar, descartando a carta de Sequência dela (devolvendo à reserva os cubos que estiverem sobre ela) e todas as cartas de Cidade (City cards) jogadas para caracterizá-la ou testar a cura dela."
            ]
          }
        },
        {
          title: { en: "Reminders", pt: "Lembretes" },
          page: 5,
          lines: {
            en: [
              "Lab actions must be done at research stations.",
              "All cubes in a dish must be moved when processing a sample.",
              "Cubes cannot be freely returned from the lab to the supply.",
              "Cubes cannot be moved onto a Sequence card until it is characterized.",
              "Gray spots on Sequence cards must be filled with cubes matching the cure color.",
              "A cure cannot be tested until at least 1 cube is on its Sequence card.",
              "The cube removed by Test a Cure is returned to the supply.",
              "Different players than the one intending to Discover a Cure can characterize or test it.",
              "Spots of an eradicated disease's color on a Sequence card can be filled by cubes of any color.",
              "Cubes of an eradicated disease in the lab can still be used to fill out spots on Sequence cards."
            ],
            pt: [
              "As ações de laboratório (lab actions) precisam ser feitas em estações de pesquisa (research stations).",
              "Todos os cubos de uma placa precisam ser movidos ao processar uma amostra.",
              "Os cubos não podem ser devolvidos livremente do laboratório para a reserva.",
              "Os cubos não podem ser movidos para uma carta de Sequência (Sequence card) enquanto ela não estiver caracterizada.",
              "Os pontos cinzas das cartas de Sequência precisam ser preenchidos com cubos da cor da cura.",
              "Uma cura não pode ser testada enquanto não houver pelo menos 1 cubo na carta de Sequência dela.",
              "O cubo removido por Testar uma Cura (Test a Cure) volta para a reserva.",
              "Jogadores diferentes daquele que pretende Descobrir uma Cura (Discover a Cure) podem caracterizá-la ou testá-la.",
              "Pontos da cor de uma doença erradicada em uma carta de Sequência podem ser preenchidos por cubos de qualquer cor.",
              "Cubos de uma doença erradicada que estejam no laboratório ainda podem ser usados para preencher pontos das cartas de Sequência."
            ]
          }
        }

      ],
      finePoints: [
        {
          page: 3,
          text: {
            en: "Use the purple cure vial only when combining this challenge with the Mutation or Bio-Terrorist challenges.",
            pt: "Use o frasco de cura (cure vial) roxo apenas ao combinar este desafio com os desafios da Mutação (Mutation) ou do Bioterrorista (Bio-Terrorist)."
          }
        },
        {
          page: 3,
          text: {
            en: "The Researcher's and Epidemiologist's abilities are unchanged, except for their new Lab challenge abilities. The Local Liaison also has a Lab challenge ability (used only in this challenge).",
            pt: "As habilidades da Pesquisadora (Researcher) e do Epidemiologista (Epidemiologist) não mudam, exceto pelas novas habilidades do Desafio do Laboratório (Lab challenge). A Agente de Ligação Local (Local Liaison) também tem uma habilidade do Desafio do Laboratório, usada apenas neste desafio."
          }
        },
        {
          page: 4,
          text: {
            en: "When placing a research station with the Event, Government Grant, the player may still do a bonus lab action, even if the new research station is not in the city that player is in.",
            pt: "Ao colocar uma estação de pesquisa (research station) com o Evento Verba Governamental (Government Grant), o jogador ainda assim pode fazer uma ação de laboratório (lab action) bônus, mesmo que a nova estação de pesquisa não esteja na cidade em que ele se encontra."
          }
        },
        {
          page: 4,
          text: {
            en: "A cube removed from the board by Events, the Containment Specialist's ability, the Medic's ability to automatically remove cured disease cubes, etc. may not be placed in a sample dish.",
            pt: "Um cubo removido do tabuleiro por Eventos, pela habilidade do Especialista em Contenção (Containment Specialist), pela habilidade do Médico (Medic) de remover automaticamente cubos de doenças curadas etc. não pode ser colocado em uma placa de amostra (sample dish)."
          }
        },
        {
          page: 4,
          text: {
            en: "If a research line is characterized as the same disease as the other research line, move the cure vial. Close the other research line by discarding its City and Sequence cards, returning any cubes to the supply.",
            pt: "Se uma linha de pesquisa (research line) for caracterizada com a mesma doença da outra linha de pesquisa, mova o frasco de cura (cure vial). Feche a outra linha de pesquisa, descartando a carta de Cidade (City card) e a carta de Sequência (Sequence card) dela e devolvendo à reserva todos os cubos que estiverem lá."
          }
        },
        {
          page: 4,
          text: {
            en: "In the Mutation or Bio-Terrorist challenges, the City card used to characterize the purple disease must be a city with at least 1 purple cube.",
            pt: "Nos desafios da Mutação (Mutation) ou do Bioterrorista (Bio-Terrorist), a carta de Cidade (City card) usada para caracterizar a doença roxa precisa ser uma cidade com pelo menos 1 cubo roxo."
          }
        },
        {
          page: 4,
          text: {
            en: "In the Bio-Terrorist challenge, if the number of research stations on the board is, due to Sabotage, fewer than the number of Sequence cards on the lab board, the Bio-Terrorist chooses a line of research to close, discarding its Sequence card (returning any cubes on it to the supply) and any City cards played to characterize it or test its cure.",
            pt: "No desafio do Bioterrorista (Bio-Terrorist), se o número de estações de pesquisa (research stations) no tabuleiro for, por causa da Sabotagem (Sabotage), menor que o número de cartas de Sequência (Sequence cards) no Tabuleiro do Laboratório (lab board), o Bioterrorista escolhe uma linha de pesquisa (research line) para fechar, descartando a carta de Sequência dela (devolvendo à reserva os cubos que estiverem sobre ela) e todas as cartas de Cidade (City cards) jogadas para caracterizá-la ou testar a cura dela."
          }
        },
        {
          page: 5,
          text: {
            en: "In the Mutation: Worldwide Panic scenario (only), the city card used to Test a Cure for the purple disease must be a city with at least 1 purple cube in it (which need not be the cube removed). In the Bio-Terrorist and standard Mutation challenges, any city card may be used.",
            pt: "No cenário Mutação: Pânico Mundial (Mutation: Worldwide Panic), e somente nele, a carta de cidade usada para Testar uma Cura (Test a Cure) da doença roxa precisa ser uma cidade com pelo menos 1 cubo roxo (que não precisa ser o cubo removido). Nos desafios do Bioterrorista (Bio-Terrorist) e da Mutação (Mutation) padrão, qualquer carta de cidade pode ser usada."
          }
        },
        {
          page: 5,
          text: {
            en: "The Scientist discards 2, not 3, cards to Discover a Cure. Some game effects change the number of discards needed to Discover a Cure; apply them to 3 (not 5) in the Lab challenge.",
            pt: "A Cientista (Scientist) descarta 2 cartas, e não 3, para Descobrir uma Cura (Discover a Cure). Alguns efeitos de jogo alteram o número de descartes necessários para Descobrir uma Cura; no Desafio do Laboratório (Lab challenge), aplique-os sobre 3 (e não sobre 5)."
          }
        },
        {
          page: 5,
          text: {
            en: "In the Mutation or Bio-Terrorist challenges, the City cards discarded to cure the purple disease can be of any color. These cities need not have purple cubes on them.",
            pt: "Nos desafios da Mutação (Mutation) ou do Bioterrorista (Bio-Terrorist), as cartas de Cidade (City cards) descartadas para curar a doença roxa podem ser de qualquer cor. Essas cidades não precisam ter cubos roxos."
          }
        },
        {
          page: 5,
          text: {
            en: "Since an open research line already has a Sequence card, this action is not necessary to Discover a Cure. It allows players to open the 2nd research line, replace Sequence cards for already cured diseases with new ones, or find more efficient Sequence cards.",
            pt: "Como uma linha de pesquisa (research line) aberta já tem uma carta de Sequência (Sequence card), esta ação não é necessária para Descobrir uma Cura (Discover a Cure). Ela permite aos jogadores abrir a 2ª linha de pesquisa, substituir por novas as cartas de Sequência de doenças já curadas, ou procurar cartas de Sequência mais eficientes."
          }
        },
        {
          page: 5,
          text: {
            en: "Exception (very rare): if a game ends because a player cannot draw needed cards and 1 or more colors of disease cubes never appeared in any cities — either during setup or play — then the players win if they cured all the other diseases. (Since, in this challenge, players cannot cure a disease without at least 1 cube of its color.)",
            pt: "Exceção (muito rara): se uma partida terminar porque um jogador não consegue comprar as cartas necessárias e 1 ou mais cores de cubos de doença nunca apareceram em nenhuma cidade — nem na preparação, nem durante o jogo —, então os jogadores vencem se tiverem curado todas as outras doenças. (Afinal, neste desafio, os jogadores não conseguem curar uma doença sem pelo menos 1 cubo da cor dela.)"
          }
        }
      ],
      winLose: {
        en: [
          "This challenge is won or lost normally, as in the base game: the players win by discovering all 4 cures, and lose on too many outbreaks, on running out of disease cubes of a color when cubes must be placed, or on running out of Player cards.",
          "New loss condition: if you can't place the number of cubes needed in the growth dish, because there are not enough of the needed cubes left in the supply, the game ends and your team has lost!",
          "Exception (very rare): if a game ends because a player cannot draw needed cards and 1 or more colors of disease cubes never appeared in any cities — either during setup or play — then the players win if they cured all the other diseases. (Since, in this challenge, players cannot cure a disease without at least 1 cube of its color.)",
          "Tip: if very few cubes of a color are present, use them to cure that color disease, not other diseases."
        ],
        pt: [
          "Este desafio é vencido ou perdido normalmente, como no jogo básico: os jogadores vencem ao descobrir as 4 curas e perdem se houver surtos demais, se faltarem cubos de doença de uma cor quando for preciso colocá-los, ou se o Baralho de Jogadores (Player Deck) acabar.",
          "Nova condição de derrota: se você não conseguir colocar a quantidade de cubos necessária na placa de cultivo (growth dish) porque não restam cubos suficientes da cor exigida na reserva, o jogo acaba e sua equipe perdeu!",
          "Exceção (muito rara): se uma partida terminar porque um jogador não consegue comprar as cartas necessárias e 1 ou mais cores de cubos de doença nunca apareceram em nenhuma cidade — nem na preparação, nem durante o jogo —, então os jogadores vencem se tiverem curado todas as outras doenças. (Afinal, neste desafio, os jogadores não conseguem curar uma doença sem pelo menos 1 cubo da cor dela.)",
          "Dica: se houver pouquíssimos cubos de uma cor disponíveis, use-os para curar a doença daquela cor, e não outras doenças."
        ]
      },
      quickRef: {
        en: [
          "Lab actions — must be done at a research station; any research station works.",
          "Cure path — characterize the line, fill every spot on its Sequence card, test it, then discard 3 City cards of the cure color.",
          "Samples — only a cube removed by Treat Disease may go into a sample dish, 1 per Treat Disease action.",
          "Process a Sample — move all of one dish: 1 color only into the centrifuge, 1 cube per color into the separator, doubled into the growth dish, or exact color matches onto a characterized Sequence card.",
          "Gray spots — take cubes of the cure color; spots of an eradicated color take any color.",
          "Build a Research Station — grants 1 free bonus lab action, Government Grant included.",
          "Research line 2 — no Sequence card may be placed on the empty space until a 2nd research station is built.",
          "Instant loss — not enough cubes in the supply to double into the growth dish ends the game at once."
        ],
        pt: [
          "Ações de laboratório (lab actions) — precisam ser feitas em uma estação de pesquisa (research station); qualquer uma serve.",
          "Caminho da cura — caracterize a linha, preencha todos os pontos da carta de Sequência (Sequence card) dela, teste-a e então descarte 3 cartas de Cidade (City cards) da cor da cura.",
          "Amostras — só um cubo removido por Tratar Doença (Treat Disease) pode ir para uma placa de amostra (sample dish), 1 por ação de Tratar Doença.",
          "Processar uma Amostra (Process a Sample) — mova todo o conteúdo de uma placa: só 1 cor para a centrífuga, 1 cubo por cor para o separador, em dobro para a placa de cultivo, ou cubos de cor exata para uma carta de Sequência caracterizada.",
          "Pontos cinzas — recebem cubos da cor da cura; pontos de uma cor erradicada recebem qualquer cor.",
          "Construir uma Estação de Pesquisa (Build a Research Station) — concede 1 ação de laboratório bônus gratuita, inclusive via Verba Governamental (Government Grant).",
          "Linha de pesquisa 2 — nenhuma carta de Sequência pode ser colocada no espaço vazio enquanto uma 2ª estação de pesquisa não for construída.",
          "Derrota imediata — faltar cubos na reserva para dobrar na placa de cultivo encerra o jogo na hora."
        ]
      },
      cardsOnTable: {
        en: [
          "The four lab actions are printed on the 'Lab Actions (Must be at a Research Station)' side of the Lab Reference card, and the revised Build a Research Station, Treat Disease, Discover a Cure and Share Knowledge texts on its 'Revised Actions (Lab Challenge)' side.",
          "Each Sequence card's spots, their colors and the cure colors it allows are printed only on the card itself; the rulebook never lists the contents of the 14 Sequence cards.",
          "The lab board's arrows and their adjustment symbols are printed on the board; the rulebook's Process a Sample text is the authoritative description of what each move does.",
          "The Lab challenge abilities of the Local Liaison and of the Lab versions of the Researcher and Epidemiologist are printed on their role cards.",
          "The exact effect of each of the 2 new Virulent Strain Epidemic cards is printed on the card."
        ],
        pt: [
          "As quatro ações de laboratório (lab actions) estão impressas no lado 'Lab Actions (Must be at a Research Station)' da carta de referência de Laboratório, e os textos revisados de Construir uma Estação de Pesquisa (Build a Research Station), Tratar Doença (Treat Disease), Descobrir uma Cura (Discover a Cure) e Compartilhar Conhecimento (Share Knowledge), no lado 'Revised Actions (Lab Challenge)'.",
          "Os pontos de cada carta de Sequência (Sequence card), suas cores e as cores de cura que ela permite estão impressos somente na própria carta; o manual nunca lista o conteúdo das 14 cartas de Sequência.",
          "As setas do Tabuleiro do Laboratório (lab board) e seus símbolos de ajuste estão impressos no tabuleiro; o texto de Processar uma Amostra (Process a Sample) do manual é a descrição oficial do que cada movimento faz.",
          "As habilidades do Desafio do Laboratório (Lab challenge) da Agente de Ligação Local (Local Liaison) e das versões de Laboratório da Pesquisadora (Researcher) e do Epidemiologista (Epidemiologist) estão impressas nas cartas de Função delas.",
          "O efeito exato de cada uma das 2 novas cartas de Epidemia da Cepa Virulenta (Virulent Strain Epidemic cards) está impresso na carta."
        ]
      },
      compatibility: [
        {
          page: 3,
          text: {
            en: "This challenge can be played with just the base game or combined with other challenges, except the Team game.",
            pt: "Este desafio pode ser jogado apenas com o jogo básico ou combinado com outros desafios, exceto o jogo em equipe (Team game)."
          }
        },
        {
          page: 3,
          text: {
            en: "Use the purple cure vial only when combining this challenge with the Mutation or Bio-Terrorist challenges.",
            pt: "Use o frasco de cura (cure vial) roxo apenas ao combinar este desafio com os desafios da Mutação (Mutation) ou do Bioterrorista (Bio-Terrorist)."
          }
        },
        {
          page: 2,
          text: {
            en: "Use the Lab versions of the Epidemiologist and Researcher only when playing the Lab challenge.",
            pt: "Use as versões de Laboratório do Epidemiologista (Epidemiologist) e da Pesquisadora (Researcher) somente ao jogar o Desafio do Laboratório (Lab challenge)."
          }
        },
        {
          page: 2,
          text: {
            en: "Add these 2 cards to the other Virulent Strain Epidemic cards during setup of the On the Brink Virulent Strain challenge. There are no other changes to setup or play.",
            pt: "Acrescente estas 2 cartas às demais cartas de Epidemia da Cepa Virulenta (Virulent Strain Epidemic cards) durante a preparação do desafio da Cepa Virulenta de On the Brink. Não há nenhuma outra mudança na preparação nem no jogo."
          }
        },
        {
          page: 2,
          text: {
            en: "When combined with the Virulent Strain challenge, the purple disease now can be the Virulent Strain. If it is, Complex Molecular Structure's additional cure card must be a city with at least 1 purple cube; Hidden Pocket has no effect; and Rate Effect applies to Mutation cards drawn.",
            pt: "Quando combinado com o desafio da Cepa Virulenta (Virulent Strain), a doença roxa agora pode ser a Cepa Virulenta. Se for, a carta de cura adicional exigida por Estrutura Molecular Complexa (Complex Molecular Structure) precisa ser uma cidade com pelo menos 1 cubo roxo; Bolsão Oculto (Hidden Pocket) não tem efeito; e Efeito de Taxa (Rate Effect) se aplica às cartas de Mutação (Mutation) compradas."
          }
        }
      ]
    },
  {
      id: "quarantines",
      book: "soe",
      kind: "module",
      pages: [1, 2, 8],
      requiresChallenges: [],
      name: { en: "Quarantines", pt: "Quarentenas (Quarantines)" },
      summary: {
        en: "A module rather than a challenge: as an action a player may impose a quarantine on the city he is in, placing a marker that cancels the next 2 attempts to place disease cubes there or to outbreak there, buying the team time to find cures.",
        pt: "Mais um módulo do que um desafio propriamente dito: como ação, um jogador pode impor uma quarentena na cidade em que está, colocando um Marcador de Quarentena (quarantine marker) que cancela as 2 próximas tentativas de colocar cubos de doença ali ou de causar um surto, dando tempo à equipe para descobrir as curas."
      },
      players: null,
      components: [
        {
          qty: { en: "4 (6 with the Colonel)", pt: "4 (6 com o Colonel)" },
          name: { en: "Quarantine markers", pt: "Marcadores de Quarentena (quarantine markers)" },
          from: { en: "State of Emergency box", pt: "caixa State of Emergency" },
          to: { en: "the supply", pt: "a reserva" },
          page: 2
        },
        {
          qty: { en: "1", pt: "1" },
          name: { en: "Colonel Role card", pt: "carta de Função do Colonel (Colonel Role card)" },
          from: { en: "State of Emergency box", pt: "caixa State of Emergency" },
          to: { en: "shuffled in with the other Role cards; use this role only when using Quarantines", pt: "embaralhada com as demais cartas de Função; use esta função somente quando estiver usando Quarentenas" },
          page: 2
        },
        {
          qty: { en: "1", pt: "1" },
          name: { en: "Local Initiative Event card", pt: "carta de Evento Local Initiative" },
          from: { en: "State of Emergency box", pt: "caixa State of Emergency" },
          to: { en: "shuffled face down with the other Event cards; use this Event only when using Quarantines", pt: "embaralhada com as outras cartas de Evento, viradas para baixo; use este Evento somente quando estiver usando Quarentenas" },
          page: 2
        }
      ],
      setup: {
        en: [
          "Put 4 quarantine markers in the supply. If the Colonel is in play, use all 6 quarantine markers.",
          "Use the Colonel role only when using Quarantines. Add its Role card to the other Role cards before shuffling and dealing 1 Role card to each player.",
          "Use the Event Local Initiative only when using Quarantines. Add it to the other Event cards and shuffle them face down.",
          "Set up everything else normally, including any challenge you are combining Quarantines with."
        ],
        pt: [
          "Coloque 4 Marcadores de Quarentena (quarantine markers) na reserva. Se o Colonel estiver em jogo, use todos os 6 marcadores.",
          "A carta de Função do Colonel (Colonel Role card) dá a mesma instrução pelo outro lado: durante a preparação, acrescente mais 2 marcadores de quarentena à reserva.",
          "Use a função do Colonel somente quando estiver usando Quarentenas. Junte a carta dele às demais cartas de Função antes de embaralhar e distribuir 1 carta de Função para cada jogador.",
          "Use o Evento Local Initiative somente quando estiver usando Quarentenas. Junte-o às outras cartas de Evento e embaralhe tudo com as cartas viradas para baixo.",
          "Prepare todo o resto normalmente, inclusive qualquer desafio que você esteja combinando com as Quarentenas."
        ]
      },
      rules: [
        {
          title: { en: "Imposing a quarantine", pt: "Impondo uma quarentena" },
          page: 2,
          lines: {
            en: [
              "As an action, a player may impose a quarantine on the city he is in by placing a quarantine marker in that city with its \"2\" side face up.",
              "A player may not put a quarantine marker in a city that already has one.",
              "If all 4 (or 6 with the Colonel) quarantine markers are on the board, the player moves a quarantine marker to his current city, flipping it to its \"2\" side if needed.",
              "In the Hinterlands challenge, a player standing in a Hinterlands space may quarantine that space in the same way."
            ],
            pt: [
              "Como ação, um jogador pode impor uma quarentena na cidade em que está, colocando ali um Marcador de Quarentena (quarantine marker) com o lado \"2\" virado para cima.",
              "Um jogador não pode colocar um marcador de quarentena em uma cidade que já tenha um.",
              "Se todos os 4 marcadores (ou 6, com o Colonel) já estiverem no tabuleiro, o jogador move um marcador de quarentena para a cidade em que está, virando-o para o lado \"2\" se necessário.",
              "No desafio Hinterlands, um jogador que esteja em um espaço Hinterlands pode colocar aquele espaço em quarentena da mesma maneira."
            ]
          }
        },
        {
          title: { en: "What a quarantine marker prevents", pt: "O que um marcador de quarentena impede" },
          page: 2,
          lines: {
            en: [
              "Each quarantine marker prevents the next 2 attempts to place disease cubes or do an outbreak in that city.",
              "When new disease cubes would be placed (or an outbreak would occur), do not add any cubes to the city (and do not do an outbreak there). Instead, flip the marker over to its \"1\" side (the first time) and then remove it (the second time), returning it to the supply.",
              "A quarantine marker blocks placements and outbreaks caused by Infections, Epidemics, Emergency Events, Superbug Infections, and the expansion Virulent Strain or Mutation effects alike.",
              "Markers returned to the supply are available again and may be placed by a later quarantine action."
            ],
            pt: [
              "Cada marcador de quarentena impede as 2 próximas tentativas de colocar cubos de doença ou de causar um surto naquela cidade.",
              "Quando novos cubos de doença seriam colocados (ou um surto ocorreria), não adicione nenhum cubo à cidade (e não faça o surto ali). Em vez disso, vire o marcador para o lado \"1\" (na primeira vez) e depois remova-o (na segunda vez), devolvendo-o à reserva.",
              "Um marcador de quarentena bloqueia igualmente colocações e surtos causados por Infecções, Epidemias, Eventos de Emergência (Emergency Events), Infecções da Superbactéria (Superbug Infections) e pelos efeitos de Cepa Virulenta (Virulent Strain) ou Mutação (Mutation) das expansões.",
              "Marcadores devolvidos à reserva ficam disponíveis de novo e podem ser colocados por uma nova ação de quarentena."
            ]
          }
        },
        {
          title: { en: "The Colonel", pt: "O Colonel" },
          page: 8,
          lines: {
            en: [
              "Use this role only with Quarantines. During setup, add 2 more quarantine markers to the supply, for 6 in total.",
              "When he enters a city with a \"1\" quarantine marker, flip it to its \"2\" side.",
              "As an action, he may discard a City card to place a quarantine marker in any city."
            ],
            pt: [
              "Use esta função somente com as Quarentenas. Durante a preparação, acrescente mais 2 marcadores de quarentena à reserva, totalizando 6.",
              "Quando ele entra em uma cidade com um marcador de quarentena no lado \"1\", vire-o para o lado \"2\".",
              "Como ação, ele pode descartar uma carta de Cidade (City card) para colocar um marcador de quarentena em qualquer cidade."
            ]
          }
        },
        {
          title: { en: "The Event Local Initiative", pt: "O Evento Local Initiative" },
          page: 1,
          confidence: "low",
          lines: {
            en: [
              "Use the Event Local Initiative only when using Quarantines.",
              "The card reads: \"Use only with Quarantines. Place a quarantine marker in any city (without one).\"",
              "Read the printed card aloud when you play it."
            ],
            pt: [
              "Use o Evento Local Initiative somente quando estiver usando Quarentenas.",
              "A carta diz: \"Use somente com Quarentenas. Coloque um marcador de quarentena em qualquer cidade (que não tenha um).\"",
              "Leia a carta impressa em voz alta quando jogá-la."
            ]
          }
        }
      ],
      finePoints: [
        {
          page: 2,
          text: {
            en: "A quarantine marker prevents placing disease cubes (or outbreaks) in the city it is in by Infections, Epidemics, Emergency Events, Superbug Infections (and expansion Virulent Strain or Mutation effects). Instead, flip (or remove) a quarantine marker each time one of these effects would place cube(s) in a city with a quarantine marker.",
            pt: "Um marcador de quarentena impede a colocação de cubos de doença (ou surtos) na cidade em que está, seja por Infecções, Epidemias, Eventos de Emergência (Emergency Events), Infecções da Superbactéria (Superbug Infections) ou pelos efeitos de Cepa Virulenta (Virulent Strain) ou Mutação (Mutation) das expansões. Em vez disso, vire (ou remova) o marcador de quarentena cada vez que um desses efeitos fosse colocar cubo(s) em uma cidade com marcador."
          }
        },
        {
          page: 2,
          text: {
            en: "If the Quarantine Specialist prevents outbreaks or placements of disease cubes in a city with a quarantine marker, do not flip over or remove that city's quarantine marker.",
            pt: "Se a Especialista em Quarentena (Quarantine Specialist) impedir surtos ou colocações de cubos de doença em uma cidade com marcador de quarentena, não vire nem remova o marcador daquela cidade."
          }
        },
        {
          page: 2,
          text: {
            en: "An outbreak in a connected city that produces chain reaction outbreak(s) which would also place cubes in a city under quarantine counts as 1 cube placement (not 2 or more), resulting in a single flip/removal of that city's quarantine marker.",
            pt: "Um surto em uma cidade conectada que provoque surto(s) em reação em cadeia e que também colocaria cubos em uma cidade em quarentena conta como 1 única colocação de cubo (não 2 ou mais), resultando em apenas uma viragem/remoção do marcador daquela cidade."
          }
        },
        {
          page: 2,
          text: {
            en: "Placing 2 differently colored cubes at the same time in a quarantined city — in the Superbug challenge or the Emergency Event Disease Zones Expand (or the expansion Mutation challenge) — counts as a 1 cube placement (not 2).",
            pt: "Colocar 2 cubos de cores diferentes ao mesmo tempo em uma cidade em quarentena — no desafio Superbactéria (Superbug), no Evento de Emergência Disease Zones Expand ou no desafio Mutação (Mutation) das expansões — conta como 1 única colocação de cubo (não 2)."
          }
        },
        {
          page: 2,
          text: {
            en: "The On the Brink Virulent Strain effect Government Interference does not apply to pawns in cities with quarantine markers.",
            pt: "O efeito Government Interference, da Cepa Virulenta (Virulent Strain) de On the Brink, não se aplica a peões que estejam em cidades com marcadores de quarentena."
          }
        }
      ],
      winLose: null,
      quickRef: {
        en: [
          "Markers: 4 in the supply, or all 6 when the Colonel is in play.",
          "Impose quarantine: an action; place a marker \"2\" side up in your city; never 2 markers in one city.",
          "All markers already on the board: move one to your city instead, flipping it to \"2\" if needed.",
          "Effect: cancels the next 2 cube placements or outbreaks there — flip to \"1\", then remove.",
          "Counts as one placement: chain-reaction outbreaks, and 2 differently coloured cubes placed at the same time.",
          "Quarantine Specialist: when she prevents the placement, do not flip or remove the marker.",
          "Extras: the Colonel role and the Event Local Initiative may only be used with Quarantines.",
          "Not allowed with: the On the Brink Bio-Terrorist challenge."
        ],
        pt: [
          "Marcadores: 4 na reserva, ou todos os 6 quando o Colonel estiver em jogo.",
          "Impor quarentena: é uma ação; coloque um Marcador de Quarentena (quarantine marker) com o lado \"2\" para cima na sua cidade; nunca 2 marcadores na mesma cidade.",
          "Todos os marcadores já no tabuleiro: mova um deles para a sua cidade, virando-o para o \"2\" se necessário.",
          "Efeito: cancela as 2 próximas colocações de cubos ou surtos ali — vire para o \"1\" e depois remova.",
          "Conta como uma só colocação: surtos em reação em cadeia e 2 cubos de cores diferentes colocados ao mesmo tempo.",
          "Especialista em Quarentena (Quarantine Specialist): quando ela impede a colocação, não vire nem remova o marcador.",
          "Extras: a função do Colonel e o Evento Local Initiative só podem ser usados com as Quarentenas.",
          "Não pode ser usado com: o desafio Bio-Terrorist de On the Brink."
        ]
      },
      cardsOnTable: {
        en: [
          "The \"2\" and \"1\" faces of the quarantine markers are printed on the discs themselves; the manual only shows them in the component picture on page 1.",
          "Read the effect printed on the Local Initiative Event card when you use it.",
          "The exact ability text of the Colonel is printed on his Role card; the manual restates the abilities in prose on page 8."
        ],
        pt: [
          "As faces \"2\" e \"1\" dos Marcadores de Quarentena (quarantine markers) estão impressas nos próprios discos; o manual só as mostra na ilustração de componentes da página 1.",
          "O texto exato do efeito do Evento Local Initiative está impresso apenas na carta — o manual nunca o repete no corpo das regras.",
          "O texto exato da habilidade do Colonel está impresso na carta de Função dele; o manual reapresenta as habilidades em prosa na página 8."
        ]
      },
      compatibility: [
        {
          page: 2,
          text: {
            en: "This expansion requires only the base Pandemic game to play, but is compatible with both its On the Brink and In the Lab expansions. Rules notes for these expansions appear in sidebars.",
            pt: "Esta expansão exige apenas o jogo básico de Pandemic para ser jogada, mas é compatível tanto com a expansão On the Brink quanto com a In the Lab. Notas de regras para essas expansões aparecem em boxes laterais."
          }
        },
        {
          page: 2,
          text: {
            en: "They can be combined with any challenge except the On the Brink Bio-Terrorist challenge.",
            pt: "Elas podem ser combinadas com qualquer desafio, exceto o desafio Bio-Terrorist de On the Brink."
          }
        },
        {
          page: 2,
          text: {
            en: "When using Quarantines, you can use the Colonel role and the Event Local Initiative.",
            pt: "Ao usar as Quarentenas, você pode usar a função do Colonel e o Evento Local Initiative."
          }
        },
        {
          page: 2,
          text: {
            en: "Typically, challenges increase the game's difficulty. Consider playing with 1 fewer Epidemic card than you normally use when trying a new challenge.",
            pt: "Normalmente, os desafios aumentam a dificuldade do jogo. Considere jogar com 1 carta de Epidemia a menos do que você costuma usar ao experimentar um desafio novo."
          }
        },
        {
          page: 5,
          text: {
            en: "Quarantines (see page 2) must be used with this challenge (so players have a way to slow infections of the superbug disease).",
            pt: "As Quarentenas (veja a página 2) precisam obrigatoriamente ser usadas com este desafio (para que os jogadores tenham como retardar as infecções da doença superbactéria)."
          }
        }
      ]
    },
    {
      id: "hinterlands",
      book: "soe",
      kind: "challenge",
      pages: [1, 3, 8],
      requiresChallenges: [],
      name: { en: "Hinterlands Challenge", pt: "Desafio Hinterlands (Hinterlands Challenge)" },
      summary: {
        en: "Four Hinterlands spaces beside the board hold animal disease strains in the farm areas beyond the cities; a die roll infects them before every Infections step and they can outbreak into their connected cities, but visiting them makes Sharing Knowledge — and so curing — far easier.",
        pt: "Quatro espaços Hinterlands ao lado do tabuleiro abrigam cepas animais nas áreas rurais além das cidades; uma rolagem de dado os infecta antes de cada etapa de Infecções e eles podem causar surtos nas cidades conectadas, mas visitá-los torna o Compartilhar Conhecimento (Share Knowledge) — e, portanto, a descoberta das curas — bem mais fácil."
      },
      players: null,
      components: [
        {
          qty: { en: "2", pt: "2" },
          name: { en: "Hinterlands boards", pt: "tabuleiros Hinterlands (Hinterlands boards)" },
          from: { en: "State of Emergency box", pt: "caixa State of Emergency" },
          to: { en: "placed next to the Pandemic board; each board section carries 2 of the 4 Hinterlands spaces", pt: "colocados ao lado do tabuleiro de Pandemic; cada seção contém 2 dos 4 espaços Hinterlands" },
          page: 3
        },
        {
          qty: { en: "18 (black 5, blue 4, red 5, yellow 4)", pt: "18 (5 pretos, 4 azuis, 5 vermelhos, 4 amarelos)" },
          name: { en: "transparent disks", pt: "discos transparentes (transparent disks)" },
          from: { en: "State of Emergency box", pt: "caixa State of Emergency" },
          to: { en: "on the main board, on the cities connected to the four Hinterlands spaces, matching disk colors to city colors", pt: "no tabuleiro principal, sobre as cidades conectadas aos quatro espaços Hinterlands, combinando a cor do disco com a cor da cidade" },
          page: 3
        },
        {
          qty: { en: "1", pt: "1" },
          name: { en: "Hinterlands die", pt: "dado Hinterlands (Hinterlands die)" },
          from: { en: "State of Emergency box", pt: "caixa State of Emergency" },
          to: { en: "on top of the Infection deck as a reminder", pt: "sobre o topo do baralho de Infecção, como lembrete" },
          page: 3
        },
        {
          qty: { en: "1", pt: "1" },
          name: { en: "Veterinarian Role card", pt: "carta de Função do Veterinarian (Veterinarian Role card)" },
          from: { en: "State of Emergency box", pt: "caixa State of Emergency" },
          to: { en: "shuffled in with the other Role cards; use this role only when playing the Hinterlands challenge", pt: "embaralhada com as demais cartas de Função; use esta função somente ao jogar o desafio Hinterlands" },
          page: 2
        }
      ],
      setup: {
        en: [
          "Set up the game normally, except as follows.",
          "Place the Hinterlands boards next to the Pandemic board.",
          "On the main board, place the 18 colored transparent disks on the cities connected to the four Hinterlands spaces, matching disk colors to city colors. The disks allow players to easily see which cities connect to each Hinterlands space.",
          "During the Infect 9 cities setup phase, place 1 disease cube of the matching color in each Hinterlands space.",
          "Place the Hinterlands die on top of the Infection deck as a reminder that it is rolled before Infection cards are drawn.",
          "Use the Veterinarian role only when playing the Hinterlands challenge; add its Role card to the other Role cards before shuffling and dealing roles."
        ],
        pt: [
          "Prepare o jogo normalmente, exceto pelo que segue.",
          "Coloque os tabuleiros Hinterlands (Hinterlands boards) ao lado do tabuleiro de Pandemic.",
          "No tabuleiro principal, coloque os 18 discos transparentes coloridos sobre as cidades conectadas aos quatro espaços Hinterlands, combinando a cor dos discos com a cor das cidades. Os discos permitem que os jogadores vejam facilmente quais cidades se conectam a cada espaço Hinterlands.",
          "Durante a etapa Infect 9 cities da preparação, coloque 1 cubo de doença da cor correspondente em cada espaço Hinterlands.",
          "Coloque o dado Hinterlands (Hinterlands die) sobre o topo do baralho de Infecção, como lembrete de que ele é rolado antes de comprar cartas de Infecção.",
          "Use a função do Veterinarian somente ao jogar o desafio Hinterlands; junte a carta dele às demais cartas de Função antes de embaralhar e distribuir."
        ]
      },
      rules: [
        {
          title: { en: "Turn sequence", pt: "Sequência do turno" },
          page: 3,
          lines: {
            en: [
              "Take turns doing actions normally, except as noted below.",
              "After each player's turn, before Infections, infect the Hinterlands by rolling the Hinterlands die."
            ],
            pt: [
              "Jogue os turnos e faça as ações normalmente, exceto pelo que está indicado a seguir.",
              "Após o turno de cada jogador, antes das Infecções, infecte os Hinterlands rolando o dado Hinterlands (Hinterlands die)."
            ]
          }
        },
        {
          title: { en: "The Hinterlands spaces", pt: "Os espaços Hinterlands" },
          page: 3,
          lines: {
            en: [
              "The Hinterlands spaces behave like normal \"city\" spaces.",
              "There are 4 Hinterlands spaces, two on each board section, one per standard disease colour, each marked with an animal symbol: blue = cow, black = rooster, yellow = monkey, red = pig.",
              "Players may move to (or from) a Hinterlands space with a Drive/Ferry action from (or to) any of its connected spaces (the ones carrying a transparent disk of that color).",
              "Players may fly to a Hinterlands space by the Event Airlift or Charter Flight. (Direct Flights are not possible since there are no City cards for Hinterlands spaces.)",
              "A player in a Hinterlands space may Treat Disease there normally (or quarantine the space if playing with Quarantines)."
            ],
            pt: [
              "Os espaços Hinterlands funcionam como espaços de \"cidade\" normais.",
              "Existem 4 espaços Hinterlands, dois em cada seção de tabuleiro, um para cada cor padrão de doença, cada um marcado com um símbolo de animal: azul = vaca, preto = galo, amarelo = macaco, vermelho = porco.",
              "Os jogadores podem se mover para (ou a partir de) um espaço Hinterlands com a ação Dirigir/Balsa (Drive/Ferry) a partir de (ou para) qualquer um dos espaços conectados a ele (aqueles que têm um disco transparente daquela cor).",
              "Os jogadores podem voar até um espaço Hinterlands pelo Evento Ponte Aérea (Airlift) ou por um Voo Fretado (Charter Flight). (Voos Diretos (Direct Flight) não são possíveis, pois não existem cartas de Cidade para os espaços Hinterlands.)",
              "Um jogador em um espaço Hinterlands pode Tratar Doença (Treat Disease) ali normalmente (ou colocar o espaço em quarentena, se estiver jogando com as Quarentenas)."
            ]
          }
        },
        {
          title: { en: "Share Knowledge in the Hinterlands", pt: "Compartilhar Conhecimento nos Hinterlands" },
          page: 3,
          lines: {
            en: [
              "The Share Knowledge action works differently: a player in a Hinterlands space with another player may either give any City card matching the color of this space to that player or take any City card of the matching color from the other player.",
              "The card does not have to match the space the players are standing in — only its colour matters."
            ],
            pt: [
              "A ação Compartilhar Conhecimento (Share Knowledge) funciona de maneira diferente: um jogador que esteja em um espaço Hinterlands junto com outro jogador pode dar qualquer carta de Cidade (City card) da cor daquele espaço àquele jogador, ou pegar dele qualquer carta de Cidade da cor correspondente.",
              "A carta não precisa corresponder ao espaço em que os jogadores estão — apenas a cor importa."
            ]
          }
        },
        {
          title: { en: "Eradication", pt: "Erradicação" },
          page: 3,
          lines: {
            en: [
              "Important: to eradicate a cured disease, all cubes of that color must be removed from both the main board and the Hinterlands board."
            ],
            pt: [
              "Importante: para erradicar uma doença já curada, todos os cubos daquela cor precisam ser removidos tanto do tabuleiro principal quanto do tabuleiro Hinterlands."
            ]
          }
        },
        {
          title: { en: "Hinterlands Infections", pt: "Infecções dos Hinterlands" },
          page: 3,
          lines: {
            en: [
              "Before drawing Infection cards, roll the Hinterlands die.",
              "If a colored die face is rolled, place 1 disease cube of that color in that Hinterlands space (or do an outbreak if 3 cubes of that color are present, placing a cube in each connected city).",
              "If a blank die face is rolled, there is no effect.",
              "Draw and resolve Infection cards normally. Then, place the Hinterlands die on top of the Infection deck as a reminder.",
              "Hinterlands spaces receive cubes from any outbreaks in their connected cities (which might result in a chain reaction outbreak in the Hinterlands space)."
            ],
            pt: [
              "Antes de comprar cartas de Infecção, role o dado Hinterlands (Hinterlands die).",
              "Se sair uma face colorida, coloque 1 cubo de doença daquela cor no espaço Hinterlands correspondente (ou faça um surto, se já houver 3 cubos daquela cor ali, colocando 1 cubo em cada cidade conectada).",
              "Se sair uma face em branco, nada acontece.",
              "Compre e resolva as cartas de Infecção normalmente. Depois, coloque o dado Hinterlands sobre o topo do baralho de Infecção, como lembrete.",
              "Os espaços Hinterlands recebem cubos de qualquer surto ocorrido nas cidades conectadas a eles (o que pode provocar um surto em reação em cadeia no próprio espaço Hinterlands)."
            ]
          }
        },
        {
          title: { en: "Hinterlands boards and die", pt: "Tabuleiros e dado Hinterlands" },
          page: 3,
          lines: {
            en: [
              "Matching transparent-disk colours on the main board show which cities connect to each Hinterlands space; follow those markings on the components.",
              "The Hinterlands die's physical faces show its results; roll the die rather than assuming a face distribution."
            ],
            pt: [
              "As cores correspondentes dos discos transparentes no tabuleiro principal mostram quais cidades se conectam a cada espaço Hinterlands; siga essas marcações nos componentes.",
              "As faces do dado Hinterlands mostram os resultados; role o dado físico sem presumir uma distribuição de faces."
            ]
          }
        },
        {
          title: { en: "The Veterinarian", pt: "O Veterinarian" },
          page: 8,
          lines: {
            en: [
              "Use this role only in the Hinterlands challenge.",
              "As an action at a research station, he may move to any Hinterlands space.",
              "In a Hinterlands space, he removes 2 cubes of an uncured disease with Treat Disease (if 2 or more cubes are there)."
            ],
            pt: [
              "Use esta função somente no desafio Hinterlands.",
              "Como ação, estando em uma Estação de Pesquisa (research station), ele pode se mover para qualquer espaço Hinterlands.",
              "Em um espaço Hinterlands, ele remove 2 cubos de uma doença ainda não curada ao Tratar Doença (Treat Disease), se houver 2 ou mais cubos ali."
            ]
          }
        }
      ],
      finePoints: [
        {
          page: 3,
          text: {
            en: "As Hinterlands spaces do not have City cards, research stations may be built in them only by the Event Government Grant or the Operations Expert's ability.",
            pt: "Como os espaços Hinterlands não possuem cartas de Cidade (City card), só é possível construir Estações de Pesquisa (research station) neles por meio do Evento Verba Governamental (Government Grant) ou da habilidade do Especialista em Operações (Operations Expert)."
          }
        },
        {
          page: 3,
          text: {
            en: "In the Superbug challenge, Regional Response Team Bonus cards may go to matching-colour Hinterlands spaces. The In the Lab Pilot may fly in or out of a Hinterlands space, but cannot fly through one in a single action.",
            pt: "No desafio Superbug, cartas de Bônus Regional Response Team podem ir para espaços Hinterlands da cor correspondente. O Piloto de In the Lab pode voar para dentro ou para fora de um espaço Hinterlands, mas não pode atravessá-lo em uma única ação."
          }
        },
        {
          page: 3,
          text: {
            en: "The In the Lab Field Director may Treat Disease in adjacent spaces using Hinterlands connections.",
            pt: "O Diretor de Campo (Field Director) de In the Lab pode Tratar Doença (Treat Disease) em espaços adjacentes usando as conexões dos Hinterlands."
          }
        },
        {
          page: 3,
          text: {
            en: "This less restrictive Share Knowledge action in the Hinterlands spaces represents the benefits of studying the related animal disease strains.",
            pt: "Essa versão menos restritiva do Compartilhar Conhecimento (Share Knowledge) nos espaços Hinterlands representa os benefícios de estudar as cepas animais relacionadas."
          }
        },
        {
          page: 3,
          text: {
            en: "Do not roll the Hinterlands die if the Event One Quiet Night is played to skip Infections. Roll the Hinterlands die twice after the Emergency Event Logistics Failure. Infection effects from the On the Brink Virulent Strain Chronic Effect or, if present, Mutation cubes, also apply to Hinterlands die infections.",
            pt: "Não role o dado Hinterlands (Hinterlands die) se o Evento Uma Noite Tranquila (One Quiet Night) for jogado para pular as Infecções. Role o dado Hinterlands duas vezes após o Evento de Emergência (Emergency Event) Logistics Failure. Efeitos de infecção do Chronic Effect da Cepa Virulenta (Virulent Strain) de On the Brink ou, se presentes, cubos de Mutação (Mutation) também se aplicam às infecções provocadas pelo dado Hinterlands."
          }
        }
      ],
      winLose: {
        en: [
          "The Hinterlands challenge is won or lost as in the base game (or any challenge it is combined with).",
          "Remember that eradication now also requires clearing the Hinterlands boards of that colour."
        ],
        pt: [
          "O desafio Hinterlands é vencido ou perdido como no jogo básico (ou como no desafio ao qual ele estiver combinado).",
          "Lembre-se de que a erradicação agora também exige limpar daquela cor os tabuleiros Hinterlands."
        ]
      },
      quickRef: {
        en: [
          "Hinterlands spaces: 4 — blue cow, black rooster, yellow monkey, red pig — they act as normal city spaces.",
          "Hinterlands die: roll it after each player's turn, before drawing Infection cards; blank face does nothing.",
          "Coloured face: 1 cube in that Hinterlands space; with 3 cubes already there, outbreak into every connected city.",
          "Movement: Drive/Ferry via the coloured disks, or Airlift or Charter Flight — never Direct Flight.",
          "Share Knowledge there: give or take any City card of the space's colour.",
          "Eradication: all cubes of that colour must be gone from the main board and the Hinterlands boards.",
          "Research station there: only by Government Grant or the Operations Expert.",
          "One Quiet Night: skip the die roll. Logistics Failure: roll the die twice."
        ],
        pt: [
          "Espaços Hinterlands: 4 — vaca azul, galo preto, macaco amarelo, porco vermelho — funcionam como espaços de cidade normais.",
          "Dado Hinterlands (Hinterlands die): role após o turno de cada jogador, antes de comprar cartas de Infecção; face em branco não faz nada.",
          "Face colorida: 1 cubo naquele espaço Hinterlands; com 3 cubos já lá, surto em todas as cidades conectadas.",
          "Movimento: Dirigir/Balsa (Drive/Ferry) pelos discos coloridos, ou Ponte Aérea (Airlift) e Voo Fretado (Charter Flight) — nunca Voo Direto (Direct Flight).",
          "Compartilhar Conhecimento (Share Knowledge) ali: dê ou pegue qualquer carta de Cidade da cor do espaço.",
          "Erradicação: todos os cubos daquela cor precisam sumir do tabuleiro principal e dos tabuleiros Hinterlands.",
          "Estação de Pesquisa (research station) ali: somente por Verba Governamental (Government Grant) ou pelo Especialista em Operações (Operations Expert).",
          "Uma Noite Tranquila (One Quiet Night): não role o dado. Logistics Failure: role o dado duas vezes."
        ]
      },
      cardsOnTable: {
        en: [
          "The matching disk colours and animal symbols on the boards identify Hinterlands connections and spaces; use those component markings.",
          "Roll the physical Hinterlands die and follow the result shown on its face.",
          "The animal symbol identifying each Hinterlands space (cow, rooster, monkey, pig) is printed on the Hinterlands boards.",
          "The Veterinarian's exact ability text is printed on the Role card; page 8 of the manual restates it in prose."
        ],
        pt: [
          "As cores dos discos correspondentes e os símbolos de animais nos tabuleiros identificam as conexões e os espaços Hinterlands; use essas marcações dos componentes.",
          "Role o dado Hinterlands físico e siga o resultado mostrado na face.",
          "O símbolo de animal que identifica cada espaço Hinterlands (vaca, galo, macaco, porco) está impresso nos tabuleiros Hinterlands.",
          "O texto exato da habilidade do Veterinarian está impresso na carta de Função; a página 8 do manual o reapresenta em prosa."
        ]
      },
      compatibility: [
        {
          page: 3,
          text: {
            en: "This challenge can be combined with Quarantines and the Emergency Event or Superbug challenges (and all expansion challenges). Since this challenge makes the game both easier and harder (in various ways), it can be played as a change of pace, without increasing the overall difficulty.",
            pt: "Este desafio pode ser combinado com as Quarentenas (Quarantines) e com os desafios Eventos de Emergência (Emergency Event) ou Superbactéria (Superbug), e também com todos os desafios das expansões. Como este desafio torna o jogo ao mesmo tempo mais fácil e mais difícil (de várias maneiras), ele pode ser jogado como uma mudança de ritmo, sem aumentar a dificuldade geral."
          }
        },
        {
          page: 5,
          text: {
            en: "This challenge can be combined with Emergency Events or the Hinterlands challenge if desired.",
            pt: "Este desafio pode ser combinado com os Eventos de Emergência (Emergency Events) ou com o desafio Hinterlands, se você quiser."
          }
        },
        {
          page: 2,
          text: {
            en: "This expansion requires only the base Pandemic game to play, but is compatible with both its On the Brink and In the Lab expansions. Rules notes for these expansions appear in sidebars.",
            pt: "Esta expansão exige apenas o jogo básico de Pandemic para ser jogada, mas é compatível tanto com a expansão On the Brink quanto com a In the Lab. Notas de regras para essas expansões aparecem em boxes laterais."
          }
        },
        {
          page: 2,
          text: {
            en: "Typically, challenges increase the game's difficulty. Consider playing with 1 fewer Epidemic card than you normally use when trying a new challenge.",
            pt: "Normalmente, os desafios aumentam a dificuldade do jogo. Considere jogar com 1 carta de Epidemia a menos do que você costuma usar ao experimentar um desafio novo."
          }
        }
      ]
    },
    {
      id: "emergency-events",
      book: "soe",
      kind: "challenge",
      pages: [1, 3, 4],
      requiresChallenges: [],
      name: { en: "Emergency Event Challenge", pt: "Desafio Eventos de Emergência (Emergency Event Challenge)" },
      summary: {
        en: "One Emergency Event card is shuffled into each Player card pile alongside its Epidemic card; when drawn it is read aloud and resolved at once, hitting the team with a nasty, unpredictable effect that may continue or be delayed.",
        pt: "Uma carta de Evento de Emergência (Emergency Event) é embaralhada em cada pilha de cartas de Jogador junto com a carta de Epidemia daquela pilha; quando comprada, ela é lida em voz alta e resolvida na hora, atingindo a equipe com um efeito desagradável e imprevisível, que pode ser contínuo ou retardado."
      },
      players: null,
      components: [
        {
          qty: { en: "10", pt: "10" },
          name: { en: "Emergency Event cards", pt: "cartas de Evento de Emergência (Emergency Event cards)" },
          from: { en: "State of Emergency box", pt: "caixa State of Emergency" },
          to: { en: "shuffled face down; as many as there are Epidemic cards are shuffled into the Player card piles, 1 per pile", pt: "embaralhadas viradas para baixo; tantas quantas forem as cartas de Epidemia são embaralhadas nas pilhas de cartas de Jogador, 1 por pilha" },
          page: 4
        }
      ],
      setup: {
        en: [
          "Set up the game normally, except as follows.",
          "Shuffle all 10 Emergency Event cards face down.",
          "Use as many Emergency Event cards as Epidemic cards.",
          "Put unused Emergency Event cards away without looking at them.",
          "When preparing the Player Deck, shuffle 1 Emergency Event card into each Player card pile (along with its Epidemic card).",
          "Stack the prepared piles to form the Player Deck as usual."
        ],
        pt: [
          "Prepare o jogo normalmente, exceto pelo que segue.",
          "Embaralhe todas as 10 cartas de Evento de Emergência (Emergency Event cards) viradas para baixo.",
          "Use tantas cartas de Evento de Emergência quantas forem as cartas de Epidemia.",
          "Guarde as cartas de Evento de Emergência não usadas sem olhá-las.",
          "Ao preparar o Baralho de Jogadores, embaralhe 1 carta de Evento de Emergência em cada pilha de cartas de Jogador (junto com a carta de Epidemia daquela pilha).",
          "Empilhe as pilhas preparadas para formar o Baralho de Jogadores, como de costume."
        ]
      },
      rules: [
        {
          title: { en: "Play", pt: "Partida" },
          page: 4,
          lines: {
            en: [
              "When you draw an Emergency Event, immediately read the card aloud and follow its instructions.",
              "Some Emergency Events have continuing effects until discarded or delayed effects. Place them face up near the Player Deck as reminders until discarded.",
              "These cards do not count against players' hand limits.",
              "Since these events add extra player turns and space out epidemics a bit more, they also make the game slightly easier in other ways."
            ],
            pt: [
              "Quando você comprar um Evento de Emergência (Emergency Event), leia a carta em voz alta imediatamente e siga suas instruções.",
              "Alguns Eventos de Emergência têm efeitos contínuos, que duram até serem descartados, ou efeitos retardados. Coloque essas cartas viradas para cima perto do Baralho de Jogadores como lembrete até que sejam descartadas.",
              "Essas cartas não contam para o limite de cartas na mão dos jogadores.",
              "Como esses eventos acrescentam turnos extras de jogador e espaçam um pouco mais as epidemias, eles também deixam o jogo ligeiramente mais fácil em outros aspectos."
            ]
          }
        },
        {
          title: { en: "Drawing order", pt: "Ordem de compra" },
          page: 4,
          lines: {
            en: [
              "If a player draws both an Epidemic card and an Emergency Event, do the Emergency Event first.",
              "If a player draws 2 Emergency Events, the player chooses the order that they take effect."
            ],
            pt: [
              "Se um jogador comprar ao mesmo tempo uma carta de Epidemia e um Evento de Emergência (Emergency Event), resolva o Evento de Emergência primeiro.",
              "Se um jogador comprar 2 Eventos de Emergência, ele escolhe a ordem em que eles entram em efeito."
            ]
          }
        },
        {
          title: { en: "Emergency Event cards", pt: "As cartas de Evento de Emergência" },
          page: 4,
          lines: {
            en: [
              "CDC Planes Grounded — Continuing effect. Players cannot move by Direct, Charter, or Shuttle Flights (or the Event Airlift). Put this card face up. Discard it after playing the next Emergency Event.",
              "Containment Failure — Delayed effect. When doing the next outbreak, add 2 (not 1) disease cubes to each connected city. Put this card face up. Discard it after the next outbreak.",
              "Disease Hot Spot — Draw 1 card from the Infection Deck BOTTOM. If this disease is not eradicated, add 3 cubes of this color to its city. Discard the Infection card to the Infection Discard Pile.",
              "Limited Options — Continuing effect. Reduce players' hand limits to 6 cards. Discard cards or play Events as needed. Put this card face up. Discard it after playing the next Emergency Event.",
              "Patient Zero — Continuing effect. Draw 1 card from the Infection Deck bottom. Add 1 disease cube of this color to this city every turn before Infecting. Put this card and its Infection card face up. Discard them after playing the next Emergency Event.",
              "Widespread Panic — Delayed effect. When doing the next outbreak, move the Outbreaks marker forward 1 extra space. Put this card face up. Discard it after the next outbreak.",
              "The card's printed text is authoritative; read its full effect aloud when it is drawn."
            ],
            pt: [
              "CDC Planes Grounded — Efeito contínuo. Os jogadores não podem se mover por Voo Direto (Direct Flight), Voo Fretado (Charter Flight) ou Voo de Transporte (Shuttle Flight), nem pelo Evento Ponte Aérea (Airlift). Deixe esta carta virada para cima. Descarte-a depois de jogar o próximo Evento de Emergência (Emergency Event).",
              "Containment Failure — Efeito retardado. Ao fazer o próximo surto, acrescente 2 (e não 1) cubos de doença em cada cidade conectada. Deixe esta carta virada para cima. Descarte-a depois do próximo surto.",
              "Disease Hot Spot — Compre 1 carta do FUNDO do Baralho de Infecção. Se esta doença não estiver erradicada, acrescente 3 cubos desta cor na cidade indicada. Descarte a carta de Infecção na Pilha de Descarte de Infecção.",
              "Limited Options — Efeito contínuo. Reduza o limite de cartas na mão dos jogadores para 6 cartas. Descarte cartas ou jogue Eventos conforme necessário. Deixe esta carta virada para cima. Descarte-a depois de jogar o próximo Evento de Emergência.",
              "Patient Zero — Efeito contínuo. Compre 1 carta do fundo do Baralho de Infecção. Acrescente 1 cubo de doença desta cor nesta cidade a cada turno, antes de Infectar. Deixe esta carta e a carta de Infecção dela viradas para cima. Descarte ambas depois de jogar o próximo Evento de Emergência.",
              "Widespread Panic — Efeito retardado. Ao fazer o próximo surto, avance o marcador de Surtos 1 espaço adicional. Deixe esta carta virada para cima. Descarte-a depois do próximo surto.",
              "O texto impresso na carta prevalece; leia o efeito completo em voz alta quando ela for comprada."
            ]
          }
        },
        {
          title: { en: "Additional Emergency Event cards", pt: "Outras cartas de Evento de Emergência" },
          page: 1,
          confidence: "low",
          lines: {
            en: [
              "Disease Zones Expand — read its physical card aloud and follow its effect.",
              "Logistics Failure — read its physical card aloud and follow it; after resolving it, roll the Hinterlands die twice."
            ],
            pt: [
              "Disease Zones Expand — leia a própria carta em voz alta e siga o efeito impresso.",
              "Logistics Failure — leia a própria carta em voz alta e siga-a; depois de resolvê-la, role o dado Hinterlands duas vezes."
            ]
          }
        }
      ],
      finePoints: [
        {
          page: 4,
          text: {
            en: "Emergency Events are not Event cards.",
            pt: "Eventos de Emergência (Emergency Events) não são cartas de Evento (Event cards)."
          }
        },
        {
          page: 4,
          text: {
            en: "CDC Planes Grounded: this does not prevent the Dispatcher from moving pawns to other pawns; the Operations Expert's discard to move ability; or — in other expansions — the Pilot from flying or the Bio-Terrorist's Flight or Escape actions.",
            pt: "CDC Planes Grounded: isso não impede o Despachante (Dispatcher) de mover peões até outros peões, nem a habilidade do Especialista em Operações (Operations Expert) de descartar uma carta para se mover, nem — em outras expansões — o Piloto (Pilot) de voar ou as ações Flight e Escape do Bio-Terrorist."
          }
        },
        {
          page: 4,
          text: {
            en: "Containment Failure: if a connected city has 2 cubes of this disease's color, add 1 cube and then do a chain reaction outbreak there. (The On the Brink Virulent Strain effect Highly Contagious does not add to Containment Failure.)",
            pt: "Containment Failure: se uma cidade conectada tiver 2 cubos da cor desta doença, acrescente 1 cubo e então faça um surto em reação em cadeia ali. (O efeito Highly Contagious da Cepa Virulenta (Virulent Strain) de On the Brink não soma com o Containment Failure.)"
          }
        },
        {
          page: 4,
          text: {
            en: "Disease Hot Spot: if any cubes of the drawn card's color are in this city, adjust their number to 3 and then do an outbreak there.",
            pt: "Disease Hot Spot: se já houver cubos da cor da carta comprada nesta cidade, ajuste a quantidade deles para 3 e então faça um surto ali."
          }
        },
        {
          page: 4,
          text: {
            en: "Limited Options: if several players wish to play Events (instead of discarding), do so in any order. This event does not affect the On the Brink Bio-Terrorist player. The On the Brink Archivist's hand limit is reduced to 7, not 6.",
            pt: "Limited Options: se vários jogadores quiserem jogar Eventos (em vez de descartar), façam isso em qualquer ordem. Este evento não afeta o jogador Bio-Terrorist de On the Brink. O limite de cartas na mão do Arquivista (Archivist) de On the Brink é reduzido para 7, e não para 6."
          }
        },
        {
          page: 4,
          text: {
            en: "Patient Zero: this can affect an eradicated disease. It will continue to do so until this event is discarded. After it is discarded, discard its Infection card to the Infection Discard Pile.",
            pt: "Patient Zero: isto pode afetar uma doença já erradicada, e continuará a afetá-la até que este evento seja descartado. Depois de descartá-lo, descarte também a carta de Infecção dele na Pilha de Descarte de Infecção."
          }
        },
        {
          page: 4,
          text: {
            en: "Widespread Panic: in On the Brink, this effect does add to the Virulent Strain effect Slippery Slope.",
            pt: "Widespread Panic: em On the Brink, este efeito soma, sim, com o efeito Slippery Slope da Cepa Virulenta (Virulent Strain)."
          }
        }
      ],
      winLose: null,
      quickRef: {
        en: [
          "Deck: shuffle 1 Emergency Event into each Player card pile, one per Epidemic card; unused ones are put away unseen.",
          "On drawing: read it aloud immediately and follow it — it is not an Event card and costs no action.",
          "Hand limit: Emergency Events never count against it.",
          "Continuing or delayed effects: leave the card face up by the Player Deck until it is discarded.",
          "Epidemic and Emergency Event drawn together: resolve the Emergency Event first.",
          "Two Emergency Events at once: the drawing player chooses the order.",
          "Card text: read each Emergency Event aloud and follow the effect printed on that card."
        ],
        pt: [
          "Baralho: embaralhe 1 Evento de Emergência (Emergency Event) em cada pilha de cartas de Jogador, um por carta de Epidemia; os não usados são guardados sem serem vistos.",
          "Ao comprar: leia em voz alta imediatamente e siga a carta — ela não é uma carta de Evento e não custa ação.",
          "Limite de mão: Eventos de Emergência nunca contam para ele.",
          "Efeitos contínuos ou retardados: deixe a carta virada para cima ao lado do Baralho de Jogadores até ser descartada.",
          "Epidemia e Evento de Emergência comprados juntos: resolva o Evento de Emergência primeiro.",
          "Dois Eventos de Emergência de uma vez: quem comprou escolhe a ordem.",
          "Texto das cartas: leia cada Evento de Emergência em voz alta e siga o efeito impresso nela."
        ]
      },
      cardsOnTable: {
        en: [
          "The physical Emergency Event card gives its effect; read it aloud when drawn.",
          "Read Disease Zones Expand and Logistics Failure directly from their physical cards.",
          "Every Emergency Event card carries the header band \"EMERGENCY EVENT\" and the line \"Play immediately when drawn.\"; cards with a lasting effect also carry a \"CONTINUING EFFECT\" band."
        ],
        pt: [
          "A carta física de Evento de Emergência contém seu efeito; leia-a em voz alta quando for comprada.",
          "Leia Disease Zones Expand e Logistics Failure diretamente nas cartas físicas.",
          "Toda carta de Evento de Emergência traz a faixa de cabeçalho \"EMERGENCY EVENT\" e a linha \"Play immediately when drawn\"; as cartas com efeito duradouro trazem também a faixa \"CONTINUING EFFECT\"."
        ]
      },
      compatibility: [
        {
          page: 4,
          text: {
            en: "This challenge can be combined with Quarantines and all other challenges. When you're considering adding another Epidemic card to make the game more challenging, adding Emergency Events instead will increase both its difficulty and variety.",
            pt: "Este desafio pode ser combinado com as Quarentenas (Quarantines) e com todos os outros desafios. Quando você estiver pensando em acrescentar mais uma carta de Epidemia para deixar o jogo mais desafiador, acrescentar Eventos de Emergência (Emergency Events) no lugar aumentará tanto a dificuldade quanto a variedade."
          }
        },
        {
          page: 4,
          text: {
            en: "When combining this challenge with the On the Brink Mutation challenge, if you draw both an Emergency Event and a Mutation Event, do the Emergency Event first.",
            pt: "Ao combinar este desafio com o desafio Mutação (Mutation) de On the Brink, se você comprar ao mesmo tempo um Evento de Emergência (Emergency Event) e um Evento de Mutação, resolva o Evento de Emergência primeiro."
          }
        },
        {
          page: 3,
          text: {
            en: "This challenge [Hinterlands] can be combined with Quarantines and the Emergency Event or Superbug challenges (and all expansion challenges).",
            pt: "O desafio Hinterlands pode ser combinado com as Quarentenas (Quarantines) e com os desafios Eventos de Emergência (Emergency Event) ou Superbactéria (Superbug), e também com todos os desafios das expansões."
          }
        },
        {
          page: 5,
          text: {
            en: "This challenge [Superbug] can be combined with Emergency Events or the Hinterlands challenge if desired.",
            pt: "O desafio Superbactéria (Superbug) pode ser combinado com os Eventos de Emergência (Emergency Events) ou com o desafio Hinterlands, se você quiser."
          }
        },
        {
          page: 2,
          text: {
            en: "This expansion requires only the base Pandemic game to play, but is compatible with both its On the Brink and In the Lab expansions. Rules notes for these expansions appear in sidebars.",
            pt: "Esta expansão exige apenas o jogo básico de Pandemic para ser jogada, mas é compatível tanto com a expansão On the Brink quanto com a In the Lab. Notas de regras para essas expansões aparecem em boxes laterais."
          }
        }
      ]
    },
    {
      id: "superbug",
      book: "soe",
      kind: "challenge",
      pages: [1, 5, 6, 7, 8],
      requiresChallenges: ["quarantines"],
      name: { en: "Superbug Challenge", pt: "Desafio Superbactéria (Superbug Challenge)" },
      summary: {
        en: "A 5th, purple disease that cannot be treated spreads across the board; players must cure it, convert research stations into vaccine factories, and deliver vaccine doses to every infected city to eradicate it.",
        pt: "Uma 5ª doença, de cor roxa e impossível de tratar, se espalha pelo tabuleiro; os jogadores precisam curá-la, converter Estações de Pesquisa (research stations) em Fábricas de Vacina (vaccine factories) e entregar doses de vacina a cada cidade infectada para erradicá-la."
      },
      players: null,
      components: [
        {
          qty: { en: "24", pt: "24" },
          name: { en: "purple Disease cubes", pt: "cubos de Doença roxos (purple Disease cubes)" },
          from: { en: "State of Emergency box", pt: "caixa State of Emergency" },
          to: { en: "the supply", pt: "a reserva" },
          page: 5
        },
        {
          qty: { en: "1 marker + 1 card", pt: "1 marcador + 1 carta" },
          name: { en: "purple Cure marker and Cure Indicator card", pt: "marcador de Cura roxo e carta Indicadora de Cura (Cure marker and Cure Indicator card)" },
          from: { en: "State of Emergency box", pt: "caixa State of Emergency" },
          to: { en: "used for the superbug disease, as for the other four diseases", pt: "usados para a doença superbactéria, como para as outras quatro doenças" },
          page: 5
        },
        {
          qty: { en: "24", pt: "24" },
          name: { en: "Vaccine doses", pt: "doses de Vacina (Vaccine doses)" },
          from: { en: "State of Emergency box", pt: "caixa State of Emergency" },
          to: { en: "near the supply", pt: "perto da reserva" },
          page: 5
        },
        {
          qty: { en: "4", pt: "4" },
          name: { en: "Vaccine factories", pt: "Fábricas de Vacina (Vaccine factories)" },
          from: { en: "State of Emergency box", pt: "caixa State of Emergency" },
          to: { en: "near the supply; built by converting research stations after the purple cure", pt: "perto da reserva; construídas convertendo Estações de Pesquisa (research stations) depois da cura roxa" },
          page: 5
        },
        {
          qty: { en: "8", pt: "8" },
          name: { en: "Superbug Bonus cards (Isolated Disease Sample)", pt: "cartas de Bônus de Superbactéria (Superbug Bonus cards — Isolated Disease Sample)" },
          from: { en: "State of Emergency box", pt: "caixa State of Emergency" },
          to: { en: "shuffled face down; as many as there are Epidemic cards are shuffled into the Player card piles, 1 per pile", pt: "embaralhadas viradas para baixo; tantas quantas forem as cartas de Epidemia são embaralhadas nas pilhas de cartas de Jogador, 1 por pilha" },
          page: 5
        },
        {
          qty: { en: "2", pt: "2" },
          name: { en: "Superbug Infection cards (\"SUPERBUG MUTATION\")", pt: "cartas de Infecção de Superbactéria (Superbug Infection cards — \"SUPERBUG MUTATION\")" },
          from: { en: "State of Emergency box", pt: "caixa State of Emergency" },
          to: { en: "1 in the Infection Discard Pile and 1 on top of the Infection Deck during setup", pt: "1 na Pilha de Descarte de Infecção e 1 no topo do Baralho de Infecção durante a preparação" },
          page: 5
        },
        {
          qty: { en: "4", pt: "4" },
          name: { en: "Superbug Reference cards", pt: "cartas de Referência de Superbactéria (Superbug Reference cards)" },
          from: { en: "State of Emergency box", pt: "caixa State of Emergency" },
          to: { en: "1 to each player", pt: "1 para cada jogador" },
          page: 5
        },
        {
          qty: { en: "1", pt: "1" },
          name: { en: "revised Medic Role card (Superbug version)", pt: "carta de Função revisada do Médico (Medic, versão Superbug)" },
          from: { en: "State of Emergency box", pt: "caixa State of Emergency" },
          to: { en: "replaces the normal Medic Role card if the Medic is in play", pt: "substitui a carta de Função normal do Médico se o Médico estiver em jogo" },
          page: 5
        },
        {
          qty: { en: "4 (6 with the Colonel)", pt: "4 (6 com o Colonel)" },
          name: { en: "Quarantine markers", pt: "Marcadores de Quarentena (quarantine markers)" },
          from: { en: "State of Emergency box", pt: "caixa State of Emergency" },
          to: { en: "the supply — Quarantines are mandatory in this challenge", pt: "a reserva — as Quarentenas são obrigatórias neste desafio" },
          page: 5
        }
      ],
      setup: {
        en: [
          "Set up the game normally, except as follows.",
          "Add 24 purple cubes to the supply and use the purple cure marker and indicator for the superbug disease.",
          "Put the vaccine doses and the 4 vaccine factories near the supply.",
          "During the Infect 9 cities setup phase, replace 1 disease cube with a purple cube when placing cubes for the 1st, 4th, and 7th cities drawn.",
          "Put 1 Superbug Infection card in the Infection Discard Pile and 1 on top of the Infection Deck.",
          "Give each player a Superbug Reference card.",
          "If the Medic is in play, use the Superbug version of the Medic.",
          "Add 4 quarantine markers to the supply (use all 6 if the Colonel is in play).",
          "Shuffle the 8 Superbug Bonus cards face down and use as many as Epidemic cards. Put away unused Bonus cards without looking at them.",
          "When preparing the Player Deck, shuffle 1 Bonus card into each Player card pile (along with its Epidemic card).",
          "Check your setup: this challenge begins with 18 disease cubes on the board, 3 of them purple, plus 10 Infection cards in the Infection Discard Pile (the 9 City cards from the initial Infection setup, plus 1 Superbug Infection card)."
        ],
        pt: [
          "Prepare o jogo normalmente, exceto pelo que segue.",
          "Acrescente 24 cubos roxos à reserva e use o marcador de cura roxo e o indicador correspondente para a doença superbactéria (superbug).",
          "Coloque as doses de Vacina (Vaccine doses) e as 4 Fábricas de Vacina (vaccine factories) perto da reserva.",
          "Durante a etapa Infect 9 cities da preparação, substitua 1 cubo de doença por um cubo roxo ao colocar cubos na 1ª, na 4ª e na 7ª cidades compradas.",
          "Coloque 1 carta de Infecção de Superbactéria (Superbug Infection card) na Pilha de Descarte de Infecção e 1 no topo do Baralho de Infecção.",
          "Dê a cada jogador uma carta de Referência de Superbactéria (Superbug Reference card).",
          "Se o Médico (Medic) estiver em jogo, use a versão Superbug do Médico.",
          "Acrescente 4 Marcadores de Quarentena (quarantine markers) à reserva (use todos os 6 se o Colonel estiver em jogo).",
          "Embaralhe as 8 cartas de Bônus de Superbactéria (Superbug Bonus cards) viradas para baixo e use tantas quantas forem as cartas de Epidemia. Guarde as cartas de Bônus não usadas sem olhá-las.",
          "Ao preparar o Baralho de Jogadores, embaralhe 1 carta de Bônus em cada pilha de cartas de Jogador (junto com a carta de Epidemia daquela pilha).",
          "Confira a preparação: este desafio começa com 18 cubos de doença no tabuleiro, 3 deles roxos, além de 10 cartas de Infecção na Pilha de Descarte de Infecção (as 9 cartas de Cidade da preparação inicial de Infecção, mais 1 carta de Infecção de Superbactéria)."
        ]
      },
      rules: [
        {
          title: { en: "Overview", pt: "Visão geral" },
          page: 5,
          lines: {
            en: [
              "To win, players must discover cures for all 5 diseases and eradicate the purple Superbug disease.",
              "The Treat Disease action cannot be used to remove purple disease cubes.",
              "Purple disease cubes can be prevented from being placed on the board normally (by quarantine markers, the Quarantine Specialist's ability, various Events, or — once the purple disease is cured — by the Medic).",
              "3 purple cubes begin play in cities. More enter play when these cities are re-infected or when Superbug Infection cards convert regular infections into purple infections. Purple disease outbreaks occur normally.",
              "After the purple disease is cured, players remove purple cubes by collecting vaccine doses from vaccine factories and delivering them to purple infected cities.",
              "Each vaccine factory produces 1 vaccine dose when built and after every player's turn. The research station where the purple disease is cured converts into a vaccine factory. Players can convert other research stations into vaccine factories."
            ],
            pt: [
              "Para vencer, os jogadores precisam descobrir a cura das 5 doenças e erradicar a doença Superbactéria (Superbug) roxa.",
              "A ação Tratar Doença (Treat Disease) não pode ser usada para remover cubos de doença roxos.",
              "A colocação de cubos roxos no tabuleiro pode ser impedida normalmente (por Marcadores de Quarentena (quarantine markers), pela habilidade da Especialista em Quarentena (Quarantine Specialist), por diversos Eventos ou — depois que a doença roxa estiver curada — pelo Médico (Medic)).",
              "3 cubos roxos começam a partida nas cidades. Outros entram em jogo quando essas cidades são reinfectadas ou quando cartas de Infecção de Superbactéria (Superbug Infection cards) convertem infecções comuns em infecções roxas. Surtos da doença roxa acontecem normalmente.",
              "Depois que a doença roxa for curada, os jogadores removem cubos roxos coletando doses de Vacina (Vaccine doses) nas Fábricas de Vacina (vaccine factories) e entregando-as às cidades infectadas de roxo.",
              "Cada Fábrica de Vacina produz 1 dose de vacina ao ser construída e após o turno de cada jogador. A Estação de Pesquisa (research station) onde a doença roxa for curada se converte em Fábrica de Vacina. Os jogadores podem converter outras Estações de Pesquisa em Fábricas de Vacina."
            ]
          }
        },
        {
          title: { en: "Play", pt: "Partida" },
          page: 5,
          lines: {
            en: [
              "Take turns and do actions as in the base game.",
              "Important: the Treat Disease action cannot remove purple disease cubes.",
              "Once the purple disease is cured, at the end of every player's turn (after Infections), each vaccine factory itself produces vaccine. Mark this by placing 1 vaccine dose on each space with a vaccine factory."
            ],
            pt: [
              "Jogue os turnos e faça as ações como no jogo básico.",
              "Importante: a ação Tratar Doença (Treat Disease) não remove cubos de doença roxos.",
              "Depois que a doença roxa estiver curada, ao final do turno de cada jogador (após as Infecções), cada Fábrica de Vacina (vaccine factory) produz vacina por conta própria. Marque isso colocando 1 dose de Vacina (Vaccine dose) em cada espaço que tenha uma Fábrica de Vacina."
            ]
          }
        },
        {
          title: { en: "Superbug actions", pt: "Ações de Superbactéria" },
          page: 6,
          lines: {
            en: [
              "Discover a Cure (superbug disease only): at a research station, discard 5 city cards — 2 (or more) of these cards' cities must have at least 1 purple disease cube — to cure the purple superbug disease. Remove this research station from the game, replacing it with a vaccine factory and 1 vaccine dose.",
              "Build Vaccine Factory (after superbug cure): at a research station, replace it with a vaccine factory and 1 vaccine dose, removing the station from the game.",
              "Build Vaccine Factory: once all 4 vaccine factories have been built, this action may not be done.",
              "Build Vaccine Factory: players may do Shuttle Flights between a vaccine factory and a research station or two vaccine factories. Players may not Discover a Cure at a vaccine factory. A research station can be built in a city with a vaccine factory.",
              "Collect Vaccine: at a vaccine factory, transfer any number of its doses to your Role card. At any time, players may return vaccine doses from their Role cards to the supply.",
              "Distribute Vaccine: return 1 vaccine dose from your Role card to the supply to remove all purple superbug cubes from the city you are in."
            ],
            pt: [
              "Descobrir uma Cura (Discover a Cure — somente para a doença superbactéria): em uma Estação de Pesquisa (research station), descarte 5 cartas de cidade — 2 (ou mais) dessas cartas precisam ser de cidades com pelo menos 1 cubo de doença roxo — para curar a doença superbactéria roxa. Remova essa Estação de Pesquisa do jogo, substituindo-a por uma Fábrica de Vacina (vaccine factory) com 1 dose de Vacina.",
              "Construir Fábrica de Vacina (Build Vaccine Factory — após a cura da superbactéria): em uma Estação de Pesquisa, substitua-a por uma Fábrica de Vacina com 1 dose de Vacina, removendo a estação do jogo.",
              "Construir Fábrica de Vacina: depois que as 4 Fábricas de Vacina tiverem sido construídas, esta ação não pode mais ser feita.",
              "Construir Fábrica de Vacina: os jogadores podem fazer Voos de Transporte (Shuttle Flight) entre uma Fábrica de Vacina e uma Estação de Pesquisa, ou entre duas Fábricas de Vacina. Os jogadores não podem Descobrir uma Cura em uma Fábrica de Vacina. Uma Estação de Pesquisa pode ser construída em uma cidade que tenha uma Fábrica de Vacina.",
              "Coletar Vacina (Collect Vaccine): em uma Fábrica de Vacina, transfira quantas doses dela você quiser para a sua carta de Função. A qualquer momento, os jogadores podem devolver doses de Vacina de suas cartas de Função para a reserva.",
              "Distribuir Vacina (Distribute Vaccine): devolva 1 dose de Vacina da sua carta de Função para a reserva para remover todos os cubos roxos de superbactéria da cidade em que você está."
            ]
          }
        },
        {
          title: { en: "Superbug Infections", pt: "Infecções de Superbactéria" },
          page: 6,
          lines: {
            en: [
              "When an Infection card drawn (for Infections, Epidemics, or Emergency Events) is a city with 1 or more purple cubes, add 1 purple cube to it (in addition to that card's normal effect) or conduct a purple outbreak if this city has 3 purple cubes.",
              "During Infections, whenever a Superbug Infection card is drawn, it does not count as an Infection card draw. Instead, draw another Infection card and apply the Superbug Infection card's effect to it.",
              "If the next Infection card's city has no purple cubes (and this color disease hasn't been eradicated), then add 1 purple cube instead of 1 disease cube of the card's color. Otherwise, do the Infection normally (adding both 1 cube of the city's color and 1 purple cube).",
              "In either case, discard the Superbug Infection card to the Infection Discard Pile.",
              "Once the purple disease is eradicated, remove Superbug Infection cards from the game when they are drawn."
            ],
            pt: [
              "Quando uma carta de Infecção comprada (por Infecções, Epidemias ou Eventos de Emergência) for de uma cidade com 1 ou mais cubos roxos, acrescente 1 cubo roxo nela (além do efeito normal daquela carta) ou faça um surto roxo, se a cidade já tiver 3 cubos roxos.",
              "Durante as Infecções, sempre que uma carta de Infecção de Superbactéria (Superbug Infection card) for comprada, ela não conta como compra de carta de Infecção. Em vez disso, compre outra carta de Infecção e aplique a ela o efeito da carta de Infecção de Superbactéria.",
              "Se a cidade da carta de Infecção seguinte não tiver cubos roxos (e essa cor de doença não estiver erradicada), acrescente 1 cubo roxo em vez de 1 cubo de doença da cor da carta. Caso contrário, faça a Infecção normalmente (acrescentando tanto 1 cubo da cor da cidade quanto 1 cubo roxo).",
              "Nos dois casos, descarte a carta de Infecção de Superbactéria na Pilha de Descarte de Infecção.",
              "Depois que a doença roxa for erradicada, retire do jogo as cartas de Infecção de Superbactéria quando forem compradas."
            ]
          }
        },
        {
          title: { en: "The SUPERBUG MUTATION card text", pt: "O texto da carta SUPERBUG MUTATION" },
          page: 5,
          confidence: "medium",
          lines: {
            en: [
              "The physical Superbug Infection card is purple and titled \"SUPERBUG MUTATION\".",
              "Its body reads: \"If the next Infection card's city has no purple cubes (and its disease is not eradicated), then add 1 purple cube instead of a cube of the card's color. Otherwise, this card has no effect; do the Infection normally (adding both 1 cube of the city's color and 1 purple cube). Discard this card to the Infection Discard Pile.\"",
              "Follow the timing line printed on the physical card when it is drawn."
            ],
            pt: [
              "A carta física de Infecção de Superbactéria (Superbug Infection card) é roxa e se chama \"SUPERBUG MUTATION\".",
              "O corpo dela diz: \"Se a cidade da próxima carta de Infecção não tiver cubos roxos (e a doença dela não estiver erradicada), acrescente 1 cubo roxo em vez de um cubo da cor da carta. Caso contrário, esta carta não tem efeito; faça a Infecção normalmente (acrescentando tanto 1 cubo da cor da cidade quanto 1 cubo roxo). Descarte esta carta na Pilha de Descarte de Infecção.\"",
              "Siga a linha de temporização impressa na própria carta quando ela for comprada."
            ]
          }
        },
        {
          title: { en: "Superbug Bonus cards", pt: "Cartas de Bônus de Superbactéria" },
          page: 5,
          lines: {
            en: [
              "The 8 Superbug Bonus cards are titled \"ISOLATED DISEASE SAMPLE\" under a \"BONUS / SUPERBUG\" header band.",
              "Each card reads: use this card as a City card of its printed colour for Share Knowledge (it matches any city of that colour) and for Discover a Cure.",
              "They are shuffled into the Player card piles during setup, 1 per pile, one for each Epidemic card used.",
              "Use the colour printed on each of the 8 cards; do not assume an equal number of cards per colour."
            ],
            pt: [
              "As 8 cartas de Bônus de Superbactéria (Superbug Bonus cards) têm o título \"ISOLATED DISEASE SAMPLE\" sob a faixa de cabeçalho \"BONUS / SUPERBUG\".",
              "Cada carta diz: use esta carta como uma carta de Cidade (City card) da cor impressa nela para Compartilhar Conhecimento (Share Knowledge) — ela serve para qualquer cidade daquela cor — e para Descobrir uma Cura (Discover a Cure).",
              "Elas são embaralhadas nas pilhas de cartas de Jogador durante a preparação, 1 por pilha, uma para cada carta de Epidemia usada.",
              "Use a cor impressa em cada uma das 8 cartas; não presuma uma quantidade igual de cartas por cor."
            ]
          }
        },
        {
          title: { en: "Superbug Lab Challenge (with In the Lab)", pt: "Desafio Superbactéria + Laboratório (com In the Lab)" },
          page: 7,
          lines: {
            en: [
              "To combine this challenge with the In the Lab Lab challenge, during setup place 1 purple cube on the treat symbol next to the two sample dishes on the lab board. Before doing a Process a Sample lab action, a player may immediately add this cube to either sample dish.",
              "Warning: do not Process a Sample in ways that remove this purple cube, as it is needed to sequence the purple disease. Without it, it is impossible to cure the purple disease, as purple cubes cannot be treated (and placed in the lab sample dishes).",
              "The City cards used to Characterize a Disease and Test a Cure for the purple disease must be cities with at least 1 purple cube (at the time these actions are taken). Any 3 City cards can be discarded to cure the purple disease; they need not be cities with purple cubes.",
              "A Superbug Bonus Isolated Disease Sample card can be used to either Characterize a Disease or Test a Cure when developing a cure of that color in the Superbug Lab challenge.",
              "Lab actions cannot be done at a vaccine factory (only at research stations)."
            ],
            pt: [
              "Para combinar este desafio com o desafio Laboratório (Lab) de In the Lab, durante a preparação coloque 1 cubo roxo sobre o símbolo de tratamento ao lado das duas placas de amostra no tabuleiro do laboratório. Antes de fazer a ação de laboratório Processar uma Amostra (Process a Sample), um jogador pode imediatamente acrescentar esse cubo a qualquer uma das placas de amostra.",
              "Atenção: não faça Processar uma Amostra de maneiras que removam esse cubo roxo, pois ele é necessário para sequenciar a doença roxa. Sem ele, é impossível curar a doença roxa, já que cubos roxos não podem ser tratados (nem colocados nas placas de amostra do laboratório).",
              "As cartas de Cidade usadas para Caracterizar uma Doença (Characterize a Disease) e Testar uma Cura (Test a Cure) da doença roxa precisam ser de cidades com pelo menos 1 cubo roxo (no momento em que essas ações forem feitas). Quaisquer 3 cartas de Cidade podem ser descartadas para curar a doença roxa; elas não precisam ser de cidades com cubos roxos.",
              "Uma carta de Bônus de Superbactéria Isolated Disease Sample pode ser usada tanto para Caracterizar uma Doença quanto para Testar uma Cura ao desenvolver a cura daquela cor no desafio Superbactéria + Laboratório.",
              "Ações de laboratório não podem ser feitas em uma Fábrica de Vacina (vaccine factory), apenas em Estações de Pesquisa (research stations)."
            ]
          }
        },
        {
          title: { en: "Virulent Strain Superbug (with On the Brink)", pt: "Superbactéria com Cepa Virulenta (com On the Brink)" },
          page: 7,
          lines: {
            en: [
              "When combining this challenge with the On the Brink Virulent Strain challenge, the purple superbug disease can become the virulent strain. If it does, several Virulent Strain Epidemic card effects are modified.",
              "Chronic Effect — this applies only when a Superbug Infection card converts a disease cube into a purple cube.",
              "Complex Molecular Structure — the additional City card must be a city with at least 1 purple cube.",
              "Hidden Pocket — this has no effect.",
              "Rate Effect — this applies only when a Superbug Infection card converts a disease cube into a purple cube.",
              "Resistant to Treatment — this has no effect."
            ],
            pt: [
              "Ao combinar este desafio com o desafio Cepa Virulenta (Virulent Strain) de On the Brink, a doença superbactéria roxa pode se tornar a cepa virulenta. Se isso acontecer, vários efeitos das cartas de Epidemia da Cepa Virulenta são modificados.",
              "Chronic Effect — aplica-se apenas quando uma carta de Infecção de Superbactéria (Superbug Infection card) converte um cubo de doença em um cubo roxo.",
              "Complex Molecular Structure — a carta de Cidade adicional precisa ser de uma cidade com pelo menos 1 cubo roxo.",
              "Hidden Pocket — não tem efeito algum.",
              "Rate Effect — aplica-se apenas quando uma carta de Infecção de Superbactéria converte um cubo de doença em um cubo roxo.",
              "Resistant to Treatment — não tem efeito algum."
            ]
          }
        },
        {
          title: { en: "Roles in the Superbug challenge", pt: "Funções no desafio Superbactéria" },
          page: 8,
          lines: {
            en: [
              "Medic (Superbug version): use this version only in the Superbug challenge. When automatically removing cubes of the cured superbug disease in a city, the Medic must also return 1 vaccine dose (or else no cubes are removed). Otherwise, this role is unchanged.",
              "Pharmacist: as an action, he may reveal a city card to Treat Disease — or Distribute Vaccine in this challenge — in that city; he must discard a vaccine dose to Distribute Vaccine.",
              "Pharmacist: as an action, he may remove 1 cube of a cured disease from any city to the supply. Cured Superbug disease cubes may be removed by this action without a vaccine dose.",
              "Gene Splicer: her ability cannot be used to cure the purple disease, in any challenge.",
              "Operations Expert, First Responder and Veterinarian: each can use their special movement ability from a vaccine factory."
            ],
            pt: [
              "Médico (Medic, versão Superbug): use esta versão apenas no desafio Superbactéria. Ao remover automaticamente cubos da doença superbactéria já curada em uma cidade, o Médico também precisa devolver 1 dose de Vacina (Vaccine dose) — caso contrário, nenhum cubo é removido. No mais, esta função é inalterada.",
              "Pharmacist: como ação, ele pode revelar uma carta de cidade para Tratar Doença (Treat Disease) — ou Distribuir Vacina (Distribute Vaccine), neste desafio — naquela cidade; ele precisa descartar uma dose de Vacina para Distribuir Vacina.",
              "Pharmacist: como ação, ele pode remover 1 cubo de uma doença já curada de qualquer cidade para a reserva. Cubos da doença superbactéria já curada podem ser removidos por essa ação sem gastar dose de Vacina.",
              "Gene Splicer: a habilidade dela não pode ser usada para curar a doença roxa, em desafio algum.",
              "Especialista em Operações (Operations Expert), First Responder e Veterinarian: cada um deles pode usar sua habilidade especial de movimento a partir de uma Fábrica de Vacina (vaccine factory)."
            ]
          }
        }
      ],
      finePoints: [
        {
          page: 5,
          text: {
            en: "Purple cubes can be removed in other ways, by certain expansion roles and Events; and — once the purple disease is cured — by the Pharmacist's or Medic's abilities (if the Medic can discard a vaccine dose) or the On the Brink Event Rapid Vaccine Deployment. However, the On the Brink Field Operative may not sample purple cubes.",
            pt: "Cubos roxos podem ser removidos de outras maneiras, por certas funções e Eventos das expansões; e — depois que a doença roxa estiver curada — pelas habilidades do Pharmacist ou do Médico (Medic), se o Médico puder descartar uma dose de Vacina (Vaccine dose), ou pelo Evento Rapid Vaccine Deployment de On the Brink. Entretanto, o Field Operative de On the Brink não pode coletar amostras de cubos roxos."
          }
        },
        {
          page: 5,
          text: {
            en: "If fewer vaccine doses are in the supply than the number of built vaccine factories, the player ending a turn decides which factories produce a dose.",
            pt: "Se houver menos doses de Vacina (Vaccine doses) na reserva do que o número de Fábricas de Vacina (vaccine factories) construídas, o jogador que está encerrando o turno decide quais fábricas produzem uma dose."
          }
        },
        {
          page: 6,
          text: {
            en: "The Operations Expert, First Responder, and Veterinarian can use their special movement ability from a vaccine factory.",
            pt: "O Especialista em Operações (Operations Expert), o First Responder e o Veterinarian podem usar sua habilidade especial de movimento a partir de uma Fábrica de Vacina (vaccine factory)."
          }
        },
        {
          page: 6,
          text: {
            en: "The In the Lab Field Director may Distribute Vaccine to a city connected to him.",
            pt: "O Diretor de Campo (Field Director) de In the Lab pode Distribuir Vacina (Distribute Vaccine) em uma cidade conectada à dele."
          }
        },
        {
          page: 6,
          text: {
            en: "The Medic does this automatically (without using an action) whenever he is in a city with at least 1 purple cube, if the Medic has a vaccine dose on his Role card to discard. The Medic automatically prevents placement of new purple cubes in his city — once the purple disease has been cured — without using vaccine doses.",
            pt: "O Médico (Medic) faz isso automaticamente (sem gastar ação) sempre que estiver em uma cidade com pelo menos 1 cubo roxo, desde que tenha uma dose de Vacina (Vaccine dose) na carta de Função dele para descartar. O Médico também impede automaticamente a colocação de novos cubos roxos na cidade em que está — depois que a doença roxa estiver curada — sem gastar doses de Vacina."
          }
        },
        {
          page: 6,
          text: {
            en: "Add 1 purple cube even if the City card's disease color has been eradicated.",
            pt: "Acrescente 1 cubo roxo mesmo que a cor de doença da carta de Cidade já tenha sido erradicada."
          }
        },
        {
          page: 6,
          text: {
            en: "If you draw both Superbug Infection cards in a row, apply their effect once to the next Infection card drawn.",
            pt: "Se você comprar as duas cartas de Infecção de Superbactéria (Superbug Infection cards) em sequência, aplique o efeito delas uma única vez à próxima carta de Infecção comprada."
          }
        },
        {
          page: 6,
          text: {
            en: "Do not draw any additional Infection cards when resolving the Event Forecast (or the On the Brink Troubleshooter's ability).",
            pt: "Não compre nenhuma carta de Infecção adicional ao resolver o Evento Previsão (Forecast) nem a habilidade do Troubleshooter de On the Brink."
          }
        },
        {
          page: 6,
          text: {
            en: "This rule is different from the other expansions' Mutation challenges.",
            pt: "Esta regra é diferente da dos desafios de Mutação (Mutation) das outras expansões."
          }
        },
        {
          page: 8,
          text: {
            en: "The Gene Splicer's ability cannot be used to cure the purple disease (in any challenge). When playing the In the Lab expansion's Lab challenge, the Gene Splicer needs to discard 1 card each of the (standard) non-cure colors to Discover a Cure (in a research station located in a city of the cure color). If affected by the On the Brink Virulent Strain effect Complex Molecular Structure, the Gene Splicer needs to discard 1 additional card of the cure color to Discover a Cure.",
            pt: "A habilidade da Gene Splicer não pode ser usada para curar a doença roxa (em desafio algum). Ao jogar o desafio Laboratório (Lab) da expansão In the Lab, a Gene Splicer precisa descartar 1 carta de cada uma das cores padrão que não sejam a cor da cura para Descobrir uma Cura (em uma Estação de Pesquisa localizada em uma cidade da cor da cura). Se for afetada pelo efeito Complex Molecular Structure da Cepa Virulenta (Virulent Strain) de On the Brink, a Gene Splicer precisa descartar 1 carta adicional da cor da cura para Descobrir uma Cura."
          }
        },
        {
          page: 7,
          text: {
            en: "The Superbug Lab Challenge is quite hard, since both challenges place additional time pressure on the players. Do not attempt it until you have succeeded with both the Superbug and Lab challenges separately.",
            pt: "O Desafio Superbactéria + Laboratório (Superbug Lab Challenge) é bastante difícil, já que os dois desafios colocam pressão de tempo adicional sobre os jogadores. Não tente jogá-lo antes de ter vencido o desafio Superbactéria e o desafio Laboratório separadamente."
          }
        }
      ],
      winLose: {
        en: [
          "The players win immediately if they cure all 5 diseases and eradicate the purple superbug disease.",
          "They lose normally — by outbreaks, by running out of a colour of disease cubes, or by running out of Player cards.",
          "Tip: use quarantine markers to slow the growth of the purple disease, as purple cubes cannot be treated and your team will lose if you cannot place the number of purple cubes actually needed on the board."
        ],
        pt: [
          "Os jogadores vencem imediatamente se curarem todas as 5 doenças e erradicarem a doença superbactéria roxa.",
          "Eles perdem normalmente — por surtos, por acabarem os cubos de alguma cor de doença ou por acabarem as cartas de Jogador.",
          "Dica: use os Marcadores de Quarentena (quarantine markers) para retardar o crescimento da doença roxa, já que cubos roxos não podem ser tratados e a sua equipe perde se não for possível colocar no tabuleiro a quantidade de cubos roxos efetivamente necessária."
        ]
      },
      quickRef: {
        en: [
          "Required: Quarantines must be used with this challenge; it cannot be combined with Mutation or the Bio-Terrorist.",
          "Purple disease: Treat Disease can never remove purple cubes — only vaccine (and a few specific abilities) can.",
          "Cure purple: at a research station discard 5 City cards, at least 2 of them cities holding a purple cube; the station becomes a vaccine factory with 1 dose.",
          "Vaccine factories: 4 maximum; each produces 1 dose when built and after every player's turn once purple is cured.",
          "Collect Vaccine: at a factory, move any number of its doses onto your Role card.",
          "Distribute Vaccine: return 1 dose to the supply to remove all purple cubes from the city you are in.",
          "Superbug Infection card: it is not an Infection card draw — draw another Infection card and apply the Superbug card's effect to it.",
          "Win: cure all 5 diseases and eradicate purple."
        ],
        pt: [
          "Obrigatório: as Quarentenas (Quarantines) precisam ser usadas com este desafio; ele não pode ser combinado com Mutação (Mutation) nem com o Bio-Terrorist.",
          "Doença roxa: Tratar Doença (Treat Disease) nunca remove cubos roxos — só a vacina (e algumas habilidades específicas) consegue.",
          "Curar a roxa: em uma Estação de Pesquisa (research station), descarte 5 cartas de Cidade, sendo pelo menos 2 de cidades com cubo roxo; a estação vira uma Fábrica de Vacina (vaccine factory) com 1 dose.",
          "Fábricas de Vacina: no máximo 4; cada uma produz 1 dose ao ser construída e após o turno de cada jogador, depois que a roxa estiver curada.",
          "Coletar Vacina (Collect Vaccine): em uma fábrica, mova quantas doses quiser dela para a sua carta de Função.",
          "Distribuir Vacina (Distribute Vaccine): devolva 1 dose à reserva para remover todos os cubos roxos da cidade em que você está.",
          "Carta de Infecção de Superbactéria (Superbug Infection card): não conta como compra de carta de Infecção — compre outra carta de Infecção e aplique nela o efeito da carta de Superbactéria.",
          "Vitória: cure as 5 doenças e erradique a roxa."
        ]
      },
      cardsOnTable: {
        en: [
          "The exact text of the 4 Superbug Reference cards is printed on the cards; the manual only pictures one of them.",
          "Use the disease colour printed on each Superbug Bonus card; check the physical cards rather than assuming an equal number per colour.",
          "Follow the timing line printed on the SUPERBUG MUTATION card when it is drawn.",
          "The revised Medic's exact bullets are printed on the Role card; page 8 of the manual restates the rule in prose.",
          "The Superbug Bonus card reads: header band \"BONUS / SUPERBUG\", title \"ISOLATED DISEASE SAMPLE\", then \"Use this card as a [colour] City card for: Share Knowledge (matches any [colour] cities) / Discover a Cure\"."
        ],
        pt: [
          "O texto exato das 4 cartas de Referência de Superbactéria (Superbug Reference cards) está impresso nas cartas; o manual só ilustra uma delas.",
          "Use a cor da doença impressa em cada carta de Bônus de Superbactéria (Superbug Bonus); confira as próprias cartas em vez de presumir quantidades iguais por cor.",
          "Siga a linha de temporização impressa na carta SUPERBUG MUTATION quando ela for comprada.",
          "Os tópicos exatos do Médico (Medic) revisado estão impressos na carta de Função; a página 8 do manual reapresenta a regra em prosa.",
          "A carta de Bônus de Superbactéria traz: faixa de cabeçalho \"BONUS / SUPERBUG\", título \"ISOLATED DISEASE SAMPLE\" e então \"Use esta carta como uma carta de Cidade [cor] para: Compartilhar Conhecimento (serve para quaisquer cidades [cor]) / Descobrir uma Cura\"."
        ]
      },
      compatibility: [
        {
          page: 5,
          text: {
            en: "Quarantines (see page 2) must be used with this challenge (so players have a way to slow infections of the superbug disease). This challenge can be combined with Emergency Events or the Hinterlands challenge if desired. This expansion is quite a bit harder than the previous two challenges.",
            pt: "As Quarentenas (Quarantines — veja a página 2) precisam obrigatoriamente ser usadas com este desafio (para que os jogadores tenham como retardar as infecções da doença superbactéria). Este desafio pode ser combinado com os Eventos de Emergência (Emergency Events) ou com o desafio Hinterlands, se você quiser. Esta expansão é bem mais difícil do que os dois desafios anteriores."
          }
        },
        {
          page: 5,
          text: {
            en: "This challenge cannot be combined with the expansion Mutation or Bio-Terrorist challenges. See the separate sections below for how to combine this challenge with the expansion Virulent Strain or Lab challenges.",
            pt: "Este desafio não pode ser combinado com os desafios Mutação (Mutation) nem Bio-Terrorist das expansões. Veja as seções específicas adiante para saber como combinar este desafio com os desafios Cepa Virulenta (Virulent Strain) ou Laboratório (Lab) das expansões."
          }
        },
        {
          page: 7,
          text: {
            en: "When combining this challenge with the On the Brink Virulent Strain challenge, the purple superbug disease can become the virulent strain.",
            pt: "Ao combinar este desafio com o desafio Cepa Virulenta (Virulent Strain) de On the Brink, a doença superbactéria roxa pode, sim, se tornar a cepa virulenta."
          }
        },
        {
          page: 7,
          text: {
            en: "The Superbug Lab Challenge is quite hard, since both challenges place additional time pressure on the players. Do not attempt it until you have succeeded with both the Superbug and Lab challenges separately.",
            pt: "O Desafio Superbactéria + Laboratório (Superbug Lab Challenge) é bastante difícil, já que os dois desafios colocam pressão de tempo adicional sobre os jogadores. Não tente jogá-lo antes de ter vencido o desafio Superbactéria e o desafio Laboratório separadamente."
          }
        },
        {
          page: 2,
          text: {
            en: "This expansion requires only the base Pandemic game to play, but is compatible with both its On the Brink and In the Lab expansions. Rules notes for these expansions appear in sidebars.",
            pt: "Esta expansão exige apenas o jogo básico de Pandemic para ser jogada, mas é compatível tanto com a expansão On the Brink quanto com a In the Lab. Notas de regras para essas expansões aparecem em boxes laterais."
          }
        }
      ]
    }
  ];
  // <<<DATA:CHANGES>>>
  const CHANGES = [
  {
      id: "two-event-cards-per-player",
      book: "otb",
      page: 2,
      when: { box: "otb", challenge: null },
      topic: { en: "Event cards", pt: "Cartas de Evento" },
      text: {
        en: "Add the 8 new Event cards to the 5 base game Event cards and shuffle them face down. Add 2 Event cards per player to the Player cards, before shuffling and dealing Player cards to each player. Put unused Event cards back in the box without looking at them. The manual flags this explicitly: \"This is a rules change from the base game.\"",
        pt: "Junte as 8 novas cartas de Evento (Event) às 5 cartas de Evento do jogo básico e embaralhe-as com a face para baixo. Acrescente 2 cartas de Evento por jogador às cartas de jogador, antes de embaralhar e distribuir as cartas de jogador. Devolva as cartas de Evento não usadas à caixa sem olhar para elas. O manual destaca isto explicitamente: \"Esta é uma mudança de regra em relação ao jogo básico.\""
      }
    },
    {
      id: "fifth-player",
      book: "otb",
      page: 2,
      when: { box: "otb", challenge: null },
      topic: { en: "5-player game", pt: "Partida com 5 jogadores" },
      text: {
        en: "Pandemic can be played with 5 players. During setup, deal a Role card to the 5th player.",
        pt: "Pandemic pode ser jogado com 5 jogadores. Durante a preparação, distribua uma carta de Função (Role) também ao 5º jogador."
      }
    },
    {
      id: "five-player-starting-hand",
      book: "otb",
      page: 2,
      when: { box: "otb", challenge: null },
      topic: { en: "5-player starting hand", pt: "Mão inicial com 5 jogadores" },
      text: {
        en: "With 5 players, deal 2 Player cards to each player. The standard 7-card hand limit still applies.",
        pt: "Com 5 jogadores, distribua 2 cartas de Jogador para cada um. O limite de mão padrão de 7 cartas continua valendo."
      }
    },
    {
      id: "legendary-difficulty",
      book: "otb",
      page: 2,
      when: { box: "otb", challenge: null },
      topic: { en: "Legendary difficulty (7 Epidemics)", pt: "Dificuldade Lendária (7 Epidemias)" },
      text: {
        en: "Feeling invincible? Try the Legendary difficulty level. Use the Epidemic card in this expansion to play with 7 Epidemic cards. Set up the game normally, separating the Player cards into 7 piles before shuffling an Epidemic card into each pile. When you draw the 7th Epidemic, the infection rate remains at 4 (the track maximum). Warning: Not for the faint of heart.",
        pt: "Sentindo-se invencível? Experimente o nível de dificuldade Lendário (Legendary). Use a carta de Epidemia (Epidemic) desta expansão para jogar com 7 cartas de Epidemia. Prepare o jogo normalmente, separando as cartas de jogador em 7 montes antes de embaralhar 1 carta de Epidemia em cada monte. Quando a 7ª Epidemia for comprada, a taxa de infecção permanece em 4 (o máximo da trilha). Aviso: não é para os fracos de coração."
      }
    },
    {
      id: "one-fewer-epidemic-with-a-challenge",
      book: "otb",
      page: 2,
      when: { box: "otb", challenge: null },
      topic: { en: "Adding challenges", pt: "Acrescentando desafios" },
      text: {
        en: "Each challenge adds some difficulty, so you may wish to try each new challenge with 1 fewer Epidemic card than you would normally use when playing the base game.",
        pt: "Cada desafio aumenta um pouco a dificuldade, então talvez você queira experimentar cada desafio novo com 1 carta de Epidemia (Epidemic) a menos do que usaria normalmente no jogo básico."
      }
    },
    {
      id: "new-roles-added",
      book: "otb",
      page: 2,
      when: { box: "otb", challenge: null },
      topic: { en: "New roles", pt: "Novas Funções" },
      text: {
        en: "Add the 6 new Role cards — Archivist, Containment Specialist, Epidemiologist, Field Operative, Generalist and Troubleshooter — to the base game Role cards before dealing roles. The 7th new role, the Bio-Terrorist, is not shuffled in with them.",
        pt: "Junte as 6 novas cartas de Função (Role) — Arquivista (Archivist), Especialista em Contenção (Containment Specialist), Epidemiologista (Epidemiologist), Agente de Campo (Field Operative), Generalista (Generalist) e Solucionadora de Problemas (Troubleshooter) — às cartas de Função do jogo básico antes de distribuí-las. A 7ª função nova, o Bioterrorista (Bio-Terrorist), não entra nessa mistura."
      }
    },
    {
      id: "bio-terrorist-role-restricted",
      book: "otb",
      page: 2,
      when: { box: "otb", challenge: null },
      topic: { en: "Bio-Terrorist Role card", pt: "Carta de Função do Bioterrorista" },
      text: {
        en: "Use the Bio-Terrorist Role card only when playing the Bio-Terrorist challenge.",
        pt: "Use a carta de Função do Bioterrorista (Bio-Terrorist) somente quando estiver jogando o desafio do Bioterrorista."
      }
    },
    {
      id: "archivist-no-free-discard",
      book: "otb",
      page: 8,
      when: { box: "otb", challenge: null },
      topic: { en: "Discarding cards", pt: "Descartar cartas" },
      text: {
        en: "Players may not freely discard cards (for the Archivist to retrieve); they may discard only by doing an action requiring a discard or when over their hand limits.",
        pt: "Os jogadores não podem descartar cartas livremente (para o Arquivista (Archivist) recuperá-las); só podem descartar ao executar uma ação que exija descarte ou quando estiverem acima do limite de mão."
      }
    },
    {
      id: "archivist-hand-limit-8",
      book: "otb",
      page: 8,
      when: { box: "otb", challenge: null },
      topic: { en: "Hand limit", pt: "Limite de mão" },
      text: {
        en: "The Archivist's hand limit is 8 cards, instead of the base game's 7.",
        pt: "O limite de mão do Arquivista (Archivist) é de 8 cartas, em vez das 7 do jogo básico."
      }
    },
    {
      id: "vs-normal-epidemics-removed",
      book: "otb",
      page: 3,
      when: { box: "otb", challenge: "virulent-strain" },
      topic: { en: "Epidemic cards", pt: "Cartas de Epidemia" },
      text: {
        en: "Put the normal Epidemic cards in the box — you will not need them. The Player Deck is prepared with Virulent Strain Epidemic cards instead.",
        pt: "Guarde as cartas de Epidemia (Epidemic) normais na caixa — você não vai precisar delas. O Baralho de Jogadores (Player Deck) é montado com as cartas de Epidemia da Cepa Virulenta (Virulent Strain Epidemic) no lugar delas."
      }
    },
    {
      id: "vs-player-deck-piles",
      book: "otb",
      page: 3,
      when: { box: "otb", challenge: "virulent-strain" },
      topic: { en: "Preparing the Player Deck", pt: "Preparando o Baralho de Jogadores" },
      text: {
        en: "Divide the remaining Player cards into face-down piles, as equal in size as possible, with one pile per Virulent Strain Epidemic card selected for this match. Shuffle 1 card into each pile and stack the piles with smaller ones on the bottom.",
        pt: "Divida as cartas de Jogador restantes em montes virados para baixo, do tamanho mais parecido possível, com um monte para cada carta de Epidemia da Cepa Virulenta selecionada nesta partida. Embaralhe 1 carta em cada monte e empilhe-os com os menores por baixo."
      }
    },
    {
      id: "purple-disease-twelve-cubes",
      book: "otb",
      page: 4,
      when: { box: "otb", challenge: null },
      topic: { en: "A 5th (purple) disease", pt: "Uma 5ª doença (roxa)" },
      text: {
        en: "In the Mutation and Bio-Terrorist challenges a 5th, purple disease is added to the game, with its own cure marker and Discovered Cure Indicator. There are only 12 (not 24) purple cubes in the supply, and running out of them loses the game as with any other colour.",
        pt: "Nos desafios da Mutação (Mutation) e do Bioterrorista (Bio-Terrorist), uma 5ª doença, roxa, é acrescentada ao jogo, com marcador de cura e Indicador de Cura Descoberta (Discovered Cure Indicator) próprios. Há apenas 12 (e não 24) cubos roxos no estoque, e ficar sem eles faz perder a partida, como acontece com qualquer outra cor."
      }
    },
    {
      id: "purple-alternate-win-condition",
      book: "otb",
      page: 4,
      when: { box: "otb", challenge: null },
      topic: { en: "Winning", pt: "Vitória" },
      text: {
        en: "In the Mutation and Bio-Terrorist challenges the players win if they either cure all 5 diseases or cure the 4 other diseases and have no purple disease cubes on the board.",
        pt: "Nos desafios da Mutação (Mutation) e do Bioterrorista (Bio-Terrorist), os jogadores vencem se curarem as 5 doenças ou se curarem as 4 outras doenças e não houver nenhum cubo da doença roxa no tabuleiro."
      }
    },
    {
      id: "purple-cure-any-colors",
      book: "otb",
      page: 4,
      when: { box: "otb", challenge: null },
      topic: { en: "Discover a Cure for purple", pt: "Descobrir uma Cura para o roxo" },
      text: {
        en: "In the Mutation and Bio-Terrorist challenges, when Discovering a Cure for the purple disease, discard 5 City cards in any mix of colors, with at least 1 of them a city that has 1 or more purple cubes on it. When a Scientist or Field Operative turns in fewer City cards, at least 1 of them must still be a city with 1 or more purple cubes on it.",
        pt: "Nos desafios da Mutação (Mutation) e do Bioterrorista (Bio-Terrorist), ao Descobrir uma Cura (Discover a Cure) para a doença roxa, descarte 5 cartas de cidade em qualquer combinação de cores, sendo que pelo menos 1 delas precisa ser uma cidade com 1 ou mais cubos roxos. Quando a Cientista (Scientist) ou o Agente de Campo (Field Operative) entregar menos cartas de cidade, pelo menos 1 delas ainda precisa ser uma cidade com 1 ou mais cubos roxos."
      }
    },
    {
      id: "purple-infection-two-colors",
      book: "otb",
      page: 4,
      when: { box: "otb", challenge: null },
      topic: { en: "Infections in purple cities", pt: "Infecções em cidades com roxo" },
      text: {
        en: "In the Mutation and Bio-Terrorist challenges, during Infections, if an Infection card is drawn for a city with at least 1 purple cube on it, place both 1 purple cube (if purple is not eradicated) and 1 cube of this card's color (if that disease is not eradicated) on the city. An Infection draw is the only time when cubes of both colors are placed.",
        pt: "Nos desafios da Mutação (Mutation) e do Bioterrorista (Bio-Terrorist), durante as Infecções, se uma carta de Infecção (Infection) for comprada para uma cidade que tenha pelo menos 1 cubo roxo, coloque nessa cidade tanto 1 cubo roxo (se a doença roxa não estiver erradicada) quanto 1 cubo da cor da carta (se aquela doença não estiver erradicada). A compra de uma carta de Infecção é o único momento em que se colocam cubos de duas cores."
      }
    },
    {
      id: "mutation-resilient-population",
      book: "otb",
      page: 4,
      when: { box: "otb", challenge: "mutation" },
      topic: { en: "Resilient Population", pt: "População Resiliente" },
      text: {
        en: "The Event Resilient Population cannot be used to remove a Mutation card from the Infection Discard Pile.",
        pt: "O Evento População Resiliente (Resilient Population) não pode ser usado para remover uma carta de Mutação (Mutation) da Pilha de Descarte de Infecção (Infection Discard Pile)."
      }
    },
    {
      id: "bt-purple-flare-out",
      book: "otb",
      page: 6,
      when: { box: "otb", challenge: "bio-terrorist" },
      topic: { en: "Purple outbreaks", pt: "Surtos roxos" },
      text: {
        en: "Outbreaks of the Bio-Terrorist's purple disease (only) are so intense that they flare out, leaving the cities they outbreak from with just 1 purple cube: remove 2 purple cubes from that city (returning them to the supply) and then place 1 purple cube on each city connected to it (moving the outbreaks marker forward 1 space). This applies to the Bio-Terrorist challenge only, not the Mutation challenge.",
        pt: "Os surtos da doença roxa do Bioterrorista (Bio-Terrorist) — e somente dela — são tão intensos que se esgotam explodindo (flare out), deixando as cidades de onde partiram com apenas 1 cubo roxo: retire 2 cubos roxos daquela cidade (devolvendo-os ao estoque) e então coloque 1 cubo roxo em cada cidade conectada a ela (avançando o marcador de surtos 1 espaço). Isso vale somente para o desafio do Bioterrorista, não para o desafio da Mutação (Mutation)."
      }
    },
    {
      id: "bt-capture-action",
      book: "otb",
      page: 5,
      when: { box: "otb", challenge: "bio-terrorist" },
      topic: { en: "Capture action", pt: "Ação de Capturar" },
      text: {
        en: "Non-Terrorist players take their turns normally, except they now have a possible Capture action: if the Bio-Terrorist pawn is on the board, a player in the same city may, for an action, put the pawn on the capturing player's Role card; the Bio-Terrorist discards all cards in hand to the Infection Discard Pile (without effect).",
        pt: "Os jogadores não terroristas jogam seus turnos normalmente, com a diferença de que agora dispõem de uma possível ação de Capturar (Capture): se o peão do Bioterrorista estiver no tabuleiro, um jogador na mesma cidade pode, gastando uma ação, colocá-lo sobre a própria carta de Papel; o Bioterrorista descarta todas as cartas da mão na Pilha de Descarte de Infecção, sem efeito algum."
      }
    },
    {
      id: "bt-event-cards-count-him",
      book: "otb",
      page: 5,
      when: { box: "otb", challenge: "bio-terrorist" },
      topic: { en: "Event card count", pt: "Contagem de cartas de Evento" },
      text: {
        en: "Use 2 Event cards per player in the game, including the Bio-Terrorist (for this purpose only). He is counted when building the deck even though he never holds Player cards.",
        pt: "Use 2 cartas de Evento (Event) por jogador da partida, incluindo o Bioterrorista (Bio-Terrorist) — apenas para essa contagem. Ele entra na conta ao montar o baralho, embora nunca tenha cartas de jogador na mão."
      }
    },
    {
      id: "bt-hand-limit-infection-cards",
      book: "otb",
      page: 6,
      when: { box: "otb", challenge: "bio-terrorist" },
      topic: { en: "Bio-Terrorist hand", pt: "Mão do Bioterrorista" },
      text: {
        en: "The Bio-Terrorist uses Infection cards (not Player cards) during play, discarding them to the Infection Discard Pile. His hand limit is 7 cards; if he has more than 7, he must discard the 8th card to the Infection Discard Pile (without effect).",
        pt: "O Bioterrorista (Bio-Terrorist) usa cartas de Infecção (Infection), e não cartas de jogador, durante a partida, descartando-as na Pilha de Descarte de Infecção (Infection Discard Pile). O limite de mão dele é 7 cartas; se tiver mais de 7, precisa descartar a 8ª carta na Pilha de Descarte de Infecção, sem efeito algum."
      }
    },
  {
      id: "itl-two-event-cards-per-player",
      book: "itl",
      page: 2,
      when: { box: "itl", challenge: null },
      topic: { en: "Event cards per player", pt: "Cartas de Evento por jogador" },
      text: {
        en: "Add the 3 new Event cards to the other Event cards and shuffle them face down. The manual changes the base game's rule: use 2 Event cards per player. Play the new Events normally.",
        pt: "Acrescente as 3 novas cartas de Evento às demais cartas de Evento e embaralhe-as com a face para baixo. O manual altera a regra do jogo básico: use 2 cartas de Evento por jogador. Jogue os novos Eventos normalmente."
      }
    },
    {
      id: "itl-new-roles-in-pool",
      book: "itl",
      page: 2,
      when: { box: "itl", challenge: null },
      topic: { en: "New roles", pt: "Novas funções" },
      text: {
        en: "Add the 4 new Role cards — Field Director, Virologist, Local Liaison and Pilot — to the other Role cards before shuffling and dealing 1 Role card to each player.",
        pt: "Acrescente as 4 novas cartas de Função — Diretor de Campo (Field Director), Virologista (Virologist), Agente de Ligação Local (Local Liaison) e Piloto (Pilot) — às demais cartas de Função antes de embaralhar e distribuir 1 carta de Função para cada jogador."
      }
    },
    {
      id: "itl-new-events-in-pool",
      book: "itl",
      page: 2,
      when: { box: "itl", challenge: null },
      topic: { en: "New Events", pt: "Novos Eventos" },
      text: {
        en: "The 3 new Event cards — Infection Zone Ban, Improved Sanitation and Sequencing Breakthrough — join the Event pool and are played like any other Event.",
        pt: "As 3 novas cartas de Evento — Bloqueio da Zona de Infecção (Infection Zone Ban), Saneamento Aprimorado (Improved Sanitation) e Avanço no Sequenciamento (Sequencing Breakthrough) — entram no conjunto de Eventos e são jogadas como qualquer outro Evento."
      }
    },
    {
      id: "itl-face-up-reminder-events",
      book: "itl",
      page: 2,
      when: { box: "itl", challenge: null },
      topic: { en: "Face-up reminder Events", pt: "Eventos deixados à vista como lembrete" },
      text: {
        en: "Event cards placed face up as reminders do not count against a player's hand limit. They are not yet in the Player Discard Pile.",
        pt: "As cartas de Evento colocadas com a face para cima como lembrete não contam para o limite de cartas na mão do jogador. Elas ainda não estão na Pilha de Descarte dos Jogadores (Player Discard Pile)."
      }
    },
    {
      id: "itl-two-extra-virulent-strain-epidemics",
      book: "itl",
      page: 2,
      when: { box: "itl", challenge: null },
      topic: { en: "2 extra Virulent Strain Epidemic cards", pt: "2 cartas de Epidemia da Cepa Virulenta adicionais" },
      text: {
        en: "This box adds 2 new Virulent Strain Epidemic cards, Highly Contagious and Resistant to Treatment, both continuing effects. Add these 2 cards to the other Virulent Strain Epidemic cards during setup of the On the Brink Virulent Strain challenge. There are no other changes to setup or play.",
        pt: "Esta caixa acrescenta 2 novas cartas de Epidemia da Cepa Virulenta (Virulent Strain Epidemic cards), Altamente Contagiosa (Highly Contagious) e Resistente ao Tratamento (Resistant to Treatment), ambas de efeito contínuo. Acrescente estas 2 cartas às demais cartas de Epidemia da Cepa Virulenta durante a preparação do desafio da Cepa Virulenta de On the Brink. Não há nenhuma outra mudança na preparação nem no jogo."
      }
    },
    {
      id: "itl-mutation-worldwide-panic",
      book: "itl",
      page: 2,
      when: { box: "itl", challenge: null },
      topic: { en: "Mutation: Worldwide Panic", pt: "Mutação: Pânico Mundial" },
      text: {
        en: "This scenario modifies the On the Brink Mutation challenge. Setup: raise the purple cube supply to 24 and use the 2 red-titled Mutation cards instead of the On the Brink ones; while infecting 9 cities, add 1 purple cube to the 1st city drawn, 2 purple cubes to the 4th, and 3 purple cubes to the 7th, on top of that card's own cubes. Play: place 2 purple cubes, not 1, when a Mutation card is drawn, and to Discover a Cure for the purple disease discard 5 City cards (in any colors) with at least 2 of them, not 1, being cities that have at least 1 purple cube.",
        pt: "Este cenário modifica o desafio da Mutação (Mutation) de On the Brink. Preparação: aumente a reserva de cubos roxos para 24 e use as 2 cartas de Mutação de título vermelho no lugar das de On the Brink; ao infectar 9 cidades, acrescente 1 cubo roxo à 1ª cidade comprada, 2 cubos roxos à 4ª e 3 cubos roxos à 7ª, além dos cubos da própria carta. Jogo: coloque 2 cubos roxos, e não 1, quando uma carta de Mutação for comprada; e, para Descobrir uma Cura (Discover a Cure) da doença roxa, descarte 5 cartas de Cidade (City cards) de quaisquer cores, sendo que pelo menos 2 delas, e não 1, precisam ser cidades com pelo menos 1 cubo roxo."
      }
    },
    {
      id: "lab-discover-a-cure-three-cards",
      book: "itl",
      page: 5,
      when: { box: "itl", challenge: "lab" },
      topic: { en: "Discover a Cure costs 3 cards", pt: "Descobrir uma Cura custa 3 cartas" },
      text: {
        en: "Discover a Cure discards 3 City cards of the cure color instead of 5, but only from a complete research line — one that has been characterized, tested, and has all spots on its Sequence card filled with cubes.",
        pt: "Descobrir uma Cura (Discover a Cure) descarta 3 cartas de Cidade (City cards) da cor da cura, em vez de 5, mas somente a partir de uma linha de pesquisa (research line) completa — ou seja, caracterizada, testada e com todos os pontos da carta de Sequência (Sequence card) preenchidos com cubos."
      }
    },
    {
      id: "lab-cure-discard-modifiers-apply-to-three",
      book: "itl",
      page: 5,
      when: { box: "itl", challenge: "lab" },
      topic: { en: "Effects that change the cure cost", pt: "Efeitos que alteram o custo da cura" },
      text: {
        en: "The Scientist discards 2, not 3, cards to Discover a Cure. Any game effect that changes the number of discards needed to Discover a Cure is applied to 3, not 5, in the Lab challenge.",
        pt: "A Cientista (Scientist) descarta 2 cartas, e não 3, para Descobrir uma Cura (Discover a Cure). Qualquer efeito de jogo que altere o número de descartes necessários para Descobrir uma Cura é aplicado sobre 3, e não sobre 5, no Desafio do Laboratório (Lab challenge)."
      }
    },
    {
      id: "lab-build-grants-bonus-lab-action",
      book: "itl",
      page: 4,
      when: { box: "itl", challenge: "lab" },
      topic: { en: "Build a Research Station", pt: "Construir uma Estação de Pesquisa" },
      text: {
        en: "After building a research station, the player building it may immediately do 1 lab action as a free, bonus action.",
        pt: "Depois de construir uma estação de pesquisa (research station), o jogador que a construiu pode imediatamente fazer 1 ação de laboratório (lab action) como ação bônus gratuita."
      }
    },
    {
      id: "lab-government-grant-bonus-lab-action",
      book: "itl",
      page: 4,
      when: { box: "itl", challenge: "lab" },
      topic: { en: "Government Grant", pt: "Verba Governamental" },
      text: {
        en: "When placing a research station with the Event, Government Grant, the player may still do a bonus lab action, even if the new research station is not in the city that player is in.",
        pt: "Ao colocar uma estação de pesquisa (research station) com o Evento Verba Governamental (Government Grant), o jogador ainda assim pode fazer uma ação de laboratório (lab action) bônus, mesmo que a nova estação de pesquisa não esteja na cidade em que ele se encontra."
      }
    },
    {
      id: "lab-treat-disease-sampling",
      book: "itl",
      page: 4,
      when: { box: "itl", challenge: "lab" },
      topic: { en: "Treat Disease", pt: "Tratar Doença" },
      text: {
        en: "1 cube removed by a Treat Disease action may be put in either of the 2 sample dishes instead of going back to the supply.",
        pt: "1 cubo removido por uma ação Tratar Doença (Treat Disease) pode ser colocado em qualquer uma das 2 placas de amostra (sample dishes), em vez de voltar para a reserva."
      }
    },
    {
      id: "lab-only-treat-cubes-enter-the-lab",
      book: "itl",
      page: 4,
      when: { box: "itl", challenge: "lab" },
      topic: { en: "Which cubes may enter the lab", pt: "Quais cubos podem entrar no laboratório" },
      text: {
        en: "A cube removed from the board by Events, the Containment Specialist's ability, the Medic's ability to automatically remove cured disease cubes, etc. may not be placed in a sample dish. Cubes also cannot be freely returned from the lab to the supply.",
        pt: "Um cubo removido do tabuleiro por Eventos, pela habilidade do Especialista em Contenção (Containment Specialist), pela habilidade do Médico (Medic) de remover automaticamente cubos de doenças curadas etc. não pode ser colocado em uma placa de amostra (sample dish). Os cubos também não podem ser devolvidos livremente do laboratório para a reserva."
      }
    },
    {
      id: "lab-cure-vials-replace-cure-markers",
      book: "itl",
      page: 3,
      when: { box: "itl", challenge: "lab" },
      topic: { en: "Cure vials", pt: "Frascos de cura" },
      text: {
        en: "Substitute the cure vials for the cure markers. A line's cure vial sits on its Sequence card from the moment it is characterized, and moves to its cure indicator when the disease is cured. Use the purple cure vial only when combining this challenge with the Mutation or Bio-Terrorist challenges.",
        pt: "Substitua os marcadores de cura pelos frascos de cura (cure vials). O frasco de cura de uma linha fica sobre a carta de Sequência (Sequence card) dela desde o momento em que é caracterizada e vai para o indicador de cura quando a doença é curada. Use o frasco de cura roxo apenas ao combinar este desafio com os desafios da Mutação (Mutation) ou do Bioterrorista (Bio-Terrorist)."
      }
    },
    {
      id: "lab-no-field-operative",
      book: "itl",
      page: 3,
      when: { box: "itl", challenge: "lab" },
      topic: { en: "Field Operative", pt: "Agente de Campo" },
      text: {
        en: "Do not use the Field Operative role in the Lab challenge.",
        pt: "Não use a função Agente de Campo (Field Operative) no Desafio do Laboratório (Lab challenge)."
      }
    },
    {
      id: "lab-versions-of-researcher-and-epidemiologist",
      book: "itl",
      page: 3,
      when: { box: "itl", challenge: "lab" },
      topic: { en: "Lab versions of two roles", pt: "Versões de Laboratório de duas funções" },
      text: {
        en: "Use the Lab versions of the Researcher and Epidemiologist in place of their base-game cards; their abilities are unchanged except for the new Lab challenge ability each gains. The Local Liaison's second ability also only works in this challenge.",
        pt: "Use as versões de Laboratório da Pesquisadora (Researcher) e do Epidemiologista (Epidemiologist) no lugar das cartas do jogo básico; as habilidades delas não mudam, exceto pela nova habilidade do Desafio do Laboratório (Lab challenge) que cada uma ganha. A segunda habilidade da Agente de Ligação Local (Local Liaison) também só funciona neste desafio."
      }
    },
    {
      id: "lab-actions-require-a-research-station",
      book: "itl",
      page: 3,
      when: { box: "itl", challenge: "lab" },
      topic: { en: "Where lab actions happen", pt: "Onde as ações de laboratório acontecem" },
      text: {
        en: "Lab actions must be done at research stations. Any research station can be used.",
        pt: "As ações de laboratório (lab actions) precisam ser feitas em estações de pesquisa (research stations). Qualquer estação de pesquisa pode ser usada."
      }
    },
    {
      id: "lab-second-research-line-needs-second-station",
      book: "itl",
      page: 5,
      when: { box: "itl", challenge: "lab" },
      topic: { en: "Opening the 2nd research line", pt: "Abrindo a 2ª linha de pesquisa" },
      text: {
        en: "You may not place a Sequence card on an empty Sequence space until a 2nd research station is built, so only one research line is usable at the start of the game.",
        pt: "Você não pode colocar uma carta de Sequência (Sequence card) em um espaço de Sequência vazio enquanto uma 2ª estação de pesquisa (research station) não tiver sido construída, de modo que apenas uma linha de pesquisa (research line) fica utilizável no início da partida."
      }
    },
    {
      id: "lab-growth-dish-loss",
      book: "itl",
      page: 4,
      when: { box: "itl", challenge: "lab" },
      topic: { en: "New loss condition", pt: "Nova condição de derrota" },
      text: {
        en: "If you can't place the number of cubes needed in the growth dish, because there are not enough of the needed cubes left in the supply, the game ends and your team has lost!",
        pt: "Se você não conseguir colocar a quantidade de cubos necessária na placa de cultivo (growth dish) porque não restam cubos suficientes da cor exigida na reserva, o jogo acaba e sua equipe perdeu!"
      }
    },
    {
      id: "lab-rare-win-exception",
      book: "itl",
      page: 5,
      when: { box: "itl", challenge: "lab" },
      topic: { en: "Rare win exception", pt: "Exceção rara de vitória" },
      text: {
        en: "Exception (very rare): if a game ends because a player cannot draw needed cards and 1 or more colors of disease cubes never appeared in any cities — either during setup or play — then the players win if they cured all the other diseases.",
        pt: "Exceção (muito rara): se uma partida terminar porque um jogador não consegue comprar as cartas necessárias e 1 ou mais cores de cubos de doença nunca apareceram em nenhuma cidade — nem na preparação, nem durante o jogo —, então os jogadores vencem se tiverem curado todas as outras doenças."
      }
    },
    {
      id: "lab-purple-card-requirements",
      book: "itl",
      page: 4,
      when: { box: "itl", challenge: "lab" },
      topic: { en: "Purple disease card requirements", pt: "Exigências de cartas para a doença roxa" },
      text: {
        en: "In the Mutation or Bio-Terrorist challenges, the City card used to characterize the purple disease must be a city with at least 1 purple cube. In the Mutation: Worldwide Panic scenario only, the City card used to Test a Cure for the purple disease must also be a city with at least 1 purple cube, which need not be the cube removed. The City cards discarded to cure the purple disease, however, can be of any color and those cities need not have purple cubes on them.",
        pt: "Nos desafios da Mutação (Mutation) ou do Bioterrorista (Bio-Terrorist), a carta de Cidade (City card) usada para caracterizar a doença roxa precisa ser uma cidade com pelo menos 1 cubo roxo. Somente no cenário Mutação: Pânico Mundial (Mutation: Worldwide Panic), a carta de Cidade usada para Testar uma Cura (Test a Cure) da doença roxa também precisa ser uma cidade com pelo menos 1 cubo roxo, que não precisa ser o cubo removido. Já as cartas de Cidade descartadas para curar a doença roxa podem ser de qualquer cor, e essas cidades não precisam ter cubos roxos."
      }
    },
    {
      id: "lab-sabotage-closes-a-research-line",
      book: "itl",
      page: 4,
      when: { box: "itl", challenge: "lab" },
      topic: { en: "Sabotage and research lines", pt: "Sabotagem e linhas de pesquisa" },
      text: {
        en: "In the Bio-Terrorist challenge, if the number of research stations on the board is, due to Sabotage, fewer than the number of Sequence cards on the lab board, the Bio-Terrorist chooses a line of research to close, discarding its Sequence card (returning any cubes on it to the supply) and any City cards played to characterize it or test its cure.",
        pt: "No desafio do Bioterrorista (Bio-Terrorist), se o número de estações de pesquisa (research stations) no tabuleiro for, por causa da Sabotagem (Sabotage), menor que o número de cartas de Sequência (Sequence cards) no Tabuleiro do Laboratório (lab board), o Bioterrorista escolhe uma linha de pesquisa (research line) para fechar, descartando a carta de Sequência dela (devolvendo à reserva os cubos que estiverem sobre ela) e todas as cartas de Cidade (City cards) jogadas para caracterizá-la ou testar a cura dela."
      }
    },
  {
      id: "soe-two-event-cards-per-player",
      book: "soe",
      page: 2,
      when: { box: "soe", challenge: null },
      topic: { en: "Event cards", pt: "Cartas de Evento" },
      text: {
        en: "Add the new Event cards to the other Event cards and shuffle them face down. Use 2 Event cards per player (as in On the Brink and In the Lab). This is a rule change from the base game. Play the new Events normally.",
        pt: "Junte as novas cartas de Evento às demais cartas de Evento e embaralhe tudo viradas para baixo. Use 2 cartas de Evento por jogador (como em On the Brink e In the Lab). Isto é uma mudança de regra em relação ao jogo básico. Jogue os novos Eventos normalmente."
      }
    },
    {
      id: "soe-quarantine-markers-block-placement",
      book: "soe",
      page: 2,
      when: { box: "soe", challenge: "quarantines" },
      topic: { en: "Placing disease cubes and outbreaks", pt: "Colocação de cubos de doença e surtos" },
      text: {
        en: "A quarantine marker prevents the next 2 attempts to place disease cubes or do an outbreak in its city — a new global interrupt that applies to Infections, Epidemics, Emergency Events, Superbug Infections and the expansion Virulent Strain or Mutation effects. Flip the marker from \"2\" to \"1\" the first time and remove it the second time instead of placing cubes.",
        pt: "Um Marcador de Quarentena (quarantine marker) impede as 2 próximas tentativas de colocar cubos de doença ou de causar um surto na cidade dele — uma nova interrupção global que vale para Infecções, Epidemias, Eventos de Emergência (Emergency Events), Infecções de Superbactéria (Superbug Infections) e os efeitos de Cepa Virulenta (Virulent Strain) ou Mutação (Mutation) das expansões. Vire o marcador do \"2\" para o \"1\" na primeira vez e remova-o na segunda, em vez de colocar os cubos."
      }
    },
    {
      id: "soe-quarantine-specialist-no-flip",
      book: "soe",
      page: 2,
      when: { box: "soe", challenge: "quarantines" },
      topic: { en: "Quarantine Specialist", pt: "Especialista em Quarentena" },
      text: {
        en: "If the Quarantine Specialist prevents outbreaks or placements of disease cubes in a city with a quarantine marker, do not flip over or remove that city's quarantine marker.",
        pt: "Se a Especialista em Quarentena (Quarantine Specialist) impedir surtos ou colocações de cubos de doença em uma cidade com Marcador de Quarentena (quarantine marker), não vire nem remova o marcador daquela cidade."
      }
    },
    {
      id: "soe-chain-outbreak-counts-once",
      book: "soe",
      page: 2,
      when: { box: "soe", challenge: "quarantines" },
      topic: { en: "Chain reaction outbreaks", pt: "Surtos em reação em cadeia" },
      text: {
        en: "An outbreak in a connected city that produces chain reaction outbreak(s) which would also place cubes in a quarantined city counts as 1 cube placement (not 2 or more), so the marker is flipped or removed only once.",
        pt: "Um surto em uma cidade conectada que provoque surto(s) em reação em cadeia e que também colocaria cubos em uma cidade em quarentena conta como 1 única colocação de cubo (não 2 ou mais), de modo que o marcador é virado ou removido apenas uma vez."
      }
    },
    {
      id: "soe-two-colors-count-once",
      book: "soe",
      page: 2,
      when: { box: "soe", challenge: "quarantines" },
      topic: { en: "Two colours placed at once", pt: "Duas cores colocadas ao mesmo tempo" },
      text: {
        en: "Placing 2 differently colored cubes at the same time in a quarantined city — in the Superbug challenge or the Emergency Event Disease Zones Expand (or the expansion Mutation challenge) — counts as 1 cube placement, not 2.",
        pt: "Colocar 2 cubos de cores diferentes ao mesmo tempo em uma cidade em quarentena — no desafio Superbactéria (Superbug), no Evento de Emergência Disease Zones Expand ou no desafio Mutação (Mutation) das expansões — conta como 1 colocação de cubo, e não 2."
      }
    },
    {
      id: "soe-government-interference-quarantine",
      book: "soe",
      page: 2,
      when: { box: "soe", challenge: "quarantines" },
      topic: { en: "Government Interference", pt: "Efeito Government Interference" },
      text: {
        en: "The On the Brink Virulent Strain effect Government Interference does not apply to pawns in cities with quarantine markers.",
        pt: "O efeito Government Interference, da Cepa Virulenta (Virulent Strain) de On the Brink, não se aplica a peões em cidades com Marcadores de Quarentena (quarantine markers)."
      }
    },
    {
      id: "soe-hinterlands-eradication",
      book: "soe",
      page: 3,
      when: { box: "soe", challenge: "hinterlands" },
      topic: { en: "Eradicating a disease", pt: "Erradicar uma doença" },
      text: {
        en: "To eradicate a cured disease, all cubes of that color must be removed from both the main board and the Hinterlands board — not just from the main board as in the base game.",
        pt: "Para erradicar uma doença já curada, todos os cubos daquela cor precisam ser removidos tanto do tabuleiro principal quanto do tabuleiro Hinterlands (Hinterlands board) — e não apenas do tabuleiro principal, como no jogo básico."
      }
    },
    {
      id: "soe-hinterlands-share-knowledge",
      book: "soe",
      page: 3,
      when: { box: "soe", challenge: "hinterlands" },
      topic: { en: "Share Knowledge", pt: "Compartilhar Conhecimento" },
      text: {
        en: "In a Hinterlands space the Share Knowledge action is less restrictive: a player there with another player may give any City card matching the colour of the space, or take any City card of that colour from the other player. The card does not have to match the space they are in.",
        pt: "Em um espaço Hinterlands, a ação Compartilhar Conhecimento (Share Knowledge) é menos restritiva: um jogador ali, junto com outro jogador, pode dar qualquer carta de Cidade (City card) da cor do espaço, ou pegar do outro jogador qualquer carta de Cidade daquela cor. A carta não precisa corresponder ao espaço em que eles estão."
      }
    },
    {
      id: "soe-hinterlands-no-direct-flight",
      book: "soe",
      page: 3,
      when: { box: "soe", challenge: "hinterlands" },
      topic: { en: "Movement and research stations", pt: "Movimento e Estações de Pesquisa" },
      text: {
        en: "Direct Flights to a Hinterlands space are impossible, since there are no City cards for Hinterlands spaces; players reach them by Drive/Ferry along the disk connections, or by Airlift or Charter Flight. For the same reason, research stations can be built there only by the Event Government Grant or the Operations Expert's ability.",
        pt: "Voos Diretos (Direct Flight) para um espaço Hinterlands são impossíveis, pois não existem cartas de Cidade para os espaços Hinterlands; os jogadores chegam lá por Dirigir/Balsa (Drive/Ferry) seguindo as conexões marcadas pelos discos, ou pela Ponte Aérea (Airlift) e pelo Voo Fretado (Charter Flight). Pelo mesmo motivo, só é possível construir Estações de Pesquisa (research stations) ali pelo Evento Verba Governamental (Government Grant) ou pela habilidade do Especialista em Operações (Operations Expert)."
      }
    },
    {
      id: "soe-hinterlands-die-step",
      book: "soe",
      page: 3,
      when: { box: "soe", challenge: "hinterlands" },
      topic: { en: "A new infection step", pt: "Uma nova etapa de infecção" },
      text: {
        en: "A new step is inserted into every player's turn: roll the Hinterlands die before drawing Infection cards. Do not roll it if the Event One Quiet Night is played to skip Infections, and roll it twice after the Emergency Event Logistics Failure.",
        pt: "Uma nova etapa é inserida no turno de cada jogador: role o dado Hinterlands (Hinterlands die) antes de comprar cartas de Infecção. Não role o dado se o Evento Uma Noite Tranquila (One Quiet Night) for jogado para pular as Infecções, e role-o duas vezes após o Evento de Emergência (Emergency Event) Logistics Failure."
      }
    },
    {
      id: "soe-hinterlands-field-director",
      book: "soe",
      page: 3,
      when: { box: "soe", challenge: "hinterlands" },
      topic: { en: "In the Lab Field Director", pt: "Diretor de Campo de In the Lab" },
      text: {
        en: "The In the Lab Field Director may Treat Disease in adjacent spaces using Hinterlands connections.",
        pt: "O Diretor de Campo (Field Director) de In the Lab pode Tratar Doença (Treat Disease) em espaços adjacentes usando as conexões dos Hinterlands."
      }
    },
    {
      id: "soe-hinterlands-pilot",
      book: "soe",
      page: 3,
      when: { box: "soe", challenge: "hinterlands" },
      topic: { en: "In the Lab Pilot", pt: "Piloto de In the Lab" },
      text: {
        en: "The In the Lab Pilot may fly in or out of a Hinterlands space, but cannot fly through a Hinterlands space in a single action.",
        pt: "O Piloto (Pilot) de In the Lab pode voar para dentro ou para fora de um espaço Hinterlands, mas não pode voar atravessando um espaço Hinterlands em uma única ação."
      }
    },
    {
      id: "soe-emergency-events-not-event-cards",
      book: "soe",
      page: 4,
      when: { box: "soe", challenge: "emergency-events" },
      topic: { en: "Emergency Events and hand limits", pt: "Eventos de Emergência e limite de mão" },
      text: {
        en: "Emergency Events are not Event cards: they cannot be held or played at will, they are resolved immediately when drawn, and they never count against players' hand limits.",
        pt: "Eventos de Emergência (Emergency Events) não são cartas de Evento: não podem ser guardados nem jogados à vontade, são resolvidos imediatamente ao serem comprados e nunca contam para o limite de cartas na mão dos jogadores."
      }
    },
    {
      id: "soe-emergency-event-draw-order",
      book: "soe",
      page: 4,
      when: { box: "soe", challenge: "emergency-events" },
      topic: { en: "Order of drawn cards", pt: "Ordem das cartas compradas" },
      text: {
        en: "If a player draws both an Epidemic card and an Emergency Event, do the Emergency Event first; the same applies when an Emergency Event and an On the Brink Mutation Event are drawn together. If a player draws 2 Emergency Events, that player chooses their order.",
        pt: "Se um jogador comprar ao mesmo tempo uma carta de Epidemia e um Evento de Emergência (Emergency Event), resolva o Evento de Emergência primeiro; o mesmo vale quando um Evento de Emergência e um Evento de Mutação (Mutation) de On the Brink são comprados juntos. Se um jogador comprar 2 Eventos de Emergência, ele escolhe a ordem deles."
      }
    },
    {
      id: "soe-highly-contagious-containment-failure",
      book: "soe",
      page: 4,
      when: { box: "soe", challenge: "emergency-events" },
      topic: { en: "Highly Contagious", pt: "Efeito Highly Contagious" },
      text: {
        en: "The On the Brink Virulent Strain effect Highly Contagious does not add to the Emergency Event Containment Failure.",
        pt: "O efeito Highly Contagious da Cepa Virulenta (Virulent Strain) de On the Brink não soma com o Evento de Emergência (Emergency Event) Containment Failure."
      }
    },
    {
      id: "soe-slippery-slope-widespread-panic",
      book: "soe",
      page: 4,
      when: { box: "soe", challenge: "emergency-events" },
      topic: { en: "Slippery Slope", pt: "Efeito Slippery Slope" },
      text: {
        en: "In On the Brink, the Emergency Event Widespread Panic does add to the Virulent Strain effect Slippery Slope.",
        pt: "Em On the Brink, o Evento de Emergência (Emergency Event) Widespread Panic soma, sim, com o efeito Slippery Slope da Cepa Virulenta (Virulent Strain)."
      }
    },
    {
      id: "soe-limited-options-exceptions",
      book: "soe",
      page: 4,
      when: { box: "soe", challenge: "emergency-events" },
      topic: { en: "Limited Options and hand limits", pt: "Limited Options e limites de mão" },
      text: {
        en: "The Emergency Event Limited Options does not affect the On the Brink Bio-Terrorist player, and it reduces the On the Brink Archivist's hand limit to 7, not 6. If several players wish to play Events instead of discarding, they may do so in any order.",
        pt: "O Evento de Emergência (Emergency Event) Limited Options não afeta o jogador Bio-Terrorist de On the Brink, e reduz o limite de cartas na mão do Arquivista (Archivist) de On the Brink para 7, e não para 6. Se vários jogadores quiserem jogar Eventos em vez de descartar, podem fazê-lo em qualquer ordem."
      }
    },
    {
      id: "soe-treat-disease-cannot-remove-purple",
      book: "soe",
      page: 5,
      when: { box: "soe", challenge: "superbug" },
      topic: { en: "Treat Disease", pt: "Tratar Doença" },
      text: {
        en: "The Treat Disease action cannot be used to remove purple superbug disease cubes — a fundamental change to the core action. Purple cubes leave the board only through vaccine doses or a few specific role and Event abilities.",
        pt: "A ação Tratar Doença (Treat Disease) não pode ser usada para remover cubos roxos da doença superbactéria (superbug) — uma mudança fundamental na ação básica. Cubos roxos só saem do tabuleiro por meio de doses de Vacina (Vaccine doses) ou de algumas habilidades específicas de funções e Eventos."
      }
    },
    {
      id: "soe-superbug-discover-cure",
      book: "soe",
      page: 6,
      when: { box: "soe", challenge: "superbug" },
      topic: { en: "Discover a Cure for purple", pt: "Descobrir a Cura da roxa" },
      text: {
        en: "Curing the purple superbug disease requires discarding 5 City cards at a research station, at least 2 of them cities with at least 1 purple cube, and consumes that research station: remove it from the game and replace it with a vaccine factory holding 1 vaccine dose.",
        pt: "Curar a doença superbactéria roxa exige descartar 5 cartas de Cidade (City cards) em uma Estação de Pesquisa (research station), sendo pelo menos 2 delas de cidades com pelo menos 1 cubo roxo, e consome essa Estação de Pesquisa: remova-a do jogo e substitua-a por uma Fábrica de Vacina (vaccine factory) com 1 dose de Vacina."
      }
    },
    {
      id: "soe-research-stations-become-factories",
      book: "soe",
      page: 6,
      when: { box: "soe", challenge: "superbug" },
      topic: { en: "Research stations and vaccine factories", pt: "Estações de Pesquisa e Fábricas de Vacina" },
      text: {
        en: "After the purple cure, research stations can be converted into vaccine factories and are removed from the game when they are. Discover a Cure cannot be done at a vaccine factory, Shuttle Flight works between a factory and a station or between two factories, and a research station may still be built in a city that holds a vaccine factory. Once all 4 factories are built, the Build Vaccine Factory action may not be done.",
        pt: "Depois da cura da roxa, Estações de Pesquisa (research stations) podem ser convertidas em Fábricas de Vacina (vaccine factories) e são removidas do jogo quando isso acontece. Descobrir uma Cura (Discover a Cure) não pode ser feito em uma Fábrica de Vacina, o Voo de Transporte (Shuttle Flight) funciona entre uma fábrica e uma estação ou entre duas fábricas, e ainda é possível construir uma Estação de Pesquisa em uma cidade que tenha uma Fábrica de Vacina. Depois que as 4 fábricas tiverem sido construídas, a ação Construir Fábrica de Vacina não pode mais ser feita."
      }
    },
    {
      id: "soe-superbug-medic",
      book: "soe",
      page: 8,
      when: { box: "soe", challenge: "superbug" },
      topic: { en: "Medic", pt: "Médico" },
      text: {
        en: "Use the Superbug version of the Medic. When automatically removing cubes of the cured superbug disease in a city, the Medic must also return 1 vaccine dose, or else no cubes are removed. He still prevents the placement of new purple cubes in his city after the cure without spending a dose. Otherwise, this role is unchanged.",
        pt: "Use a versão Superbug do Médico (Medic). Ao remover automaticamente cubos da doença superbactéria já curada em uma cidade, o Médico também precisa devolver 1 dose de Vacina (Vaccine dose), caso contrário nenhum cubo é removido. Ele continua impedindo a colocação de novos cubos roxos na cidade em que está, depois da cura, sem gastar dose. No mais, a função é inalterada."
      }
    },
    {
      id: "soe-superbug-pharmacist",
      book: "soe",
      page: 8,
      when: { box: "soe", challenge: "superbug" },
      topic: { en: "Pharmacist", pt: "Função Pharmacist" },
      text: {
        en: "The Pharmacist must discard a vaccine dose to Distribute Vaccine with his reveal-a-card action, but cured Superbug disease cubes may be removed by his remove-1-cube-of-a-cured-disease action without any vaccine dose.",
        pt: "O Pharmacist precisa descartar uma dose de Vacina (Vaccine dose) para Distribuir Vacina (Distribute Vaccine) com a ação dele de revelar uma carta, mas cubos da doença superbactéria já curada podem ser removidos pela ação dele de remover 1 cubo de uma doença curada sem gastar dose alguma."
      }
    },
    {
      id: "soe-gene-splicer-not-purple",
      book: "soe",
      page: 8,
      when: { box: "soe", challenge: "superbug" },
      topic: { en: "Gene Splicer", pt: "Função Gene Splicer" },
      text: {
        en: "The Gene Splicer's ability can never be used to cure the purple disease, in any challenge. Her ability is also re-specified for the In the Lab Lab challenge and for the On the Brink Virulent Strain effect Complex Molecular Structure.",
        pt: "A habilidade da Gene Splicer nunca pode ser usada para curar a doença roxa, em desafio algum. A habilidade dela também é reespecificada para o desafio Laboratório (Lab) de In the Lab e para o efeito Complex Molecular Structure da Cepa Virulenta (Virulent Strain) de On the Brink."
      }
    },
    {
      id: "soe-superbug-infection-not-a-draw",
      book: "soe",
      page: 6,
      when: { box: "soe", challenge: "superbug" },
      topic: { en: "Superbug Infection cards", pt: "Cartas de Infecção de Superbactéria" },
      text: {
        en: "Drawing a Superbug Infection card does not count as an Infection card draw: draw another Infection card and apply the Superbug card's effect to it. The manual stresses that this rule is different from the other expansions' Mutation challenges.",
        pt: "Comprar uma carta de Infecção de Superbactéria (Superbug Infection card) não conta como compra de carta de Infecção: compre outra carta de Infecção e aplique a ela o efeito da carta de Superbactéria. O manual ressalta que esta regra é diferente da dos desafios de Mutação (Mutation) das outras expansões."
      }
    },
    {
      id: "soe-forecast-troubleshooter-no-extra-draws",
      book: "soe",
      page: 6,
      when: { box: "soe", challenge: "superbug" },
      topic: { en: "Forecast and the Troubleshooter", pt: "Previsão e a Troubleshooter" },
      text: {
        en: "Do not draw any additional Infection cards when resolving the Event Forecast, or the On the Brink Troubleshooter's ability, in this challenge.",
        pt: "Não compre nenhuma carta de Infecção adicional ao resolver o Evento Previsão (Forecast) nem a habilidade da Troubleshooter de On the Brink neste desafio."
      }
    },
    {
      id: "soe-field-operative-no-purple",
      book: "soe",
      page: 5,
      when: { box: "soe", challenge: "superbug" },
      topic: { en: "On the Brink Field Operative", pt: "Field Operative de On the Brink" },
      text: {
        en: "The On the Brink Field Operative may not sample purple cubes.",
        pt: "A Field Operative de On the Brink não pode coletar amostras de cubos roxos."
      }
    },
    {
      id: "soe-virulent-strain-superbug",
      book: "soe",
      page: 7,
      when: { box: "soe", challenge: "superbug" },
      topic: { en: "Virulent Strain effects on purple", pt: "Efeitos da Cepa Virulenta na doença roxa" },
      text: {
        en: "If the purple superbug disease becomes the virulent strain, several Virulent Strain Epidemic card effects change: Chronic Effect and Rate Effect apply only when a Superbug Infection card converts a disease cube into a purple cube; Complex Molecular Structure's additional City card must be a city with at least 1 purple cube; Hidden Pocket and Resistant to Treatment have no effect.",
        pt: "Se a doença superbactéria roxa se tornar a cepa virulenta, vários efeitos das cartas de Epidemia da Cepa Virulenta (Virulent Strain) mudam: Chronic Effect e Rate Effect só se aplicam quando uma carta de Infecção de Superbactéria (Superbug Infection card) converte um cubo de doença em um cubo roxo; a carta de Cidade adicional do Complex Molecular Structure precisa ser de uma cidade com pelo menos 1 cubo roxo; Hidden Pocket e Resistant to Treatment não têm efeito algum."
      }
    },
    {
      id: "soe-superbug-lab-challenge",
      book: "soe",
      page: 7,
      when: { box: "soe", challenge: "superbug" },
      topic: { en: "Combining with the In the Lab Lab challenge", pt: "Combinação com o desafio Laboratório de In the Lab" },
      text: {
        en: "In the Superbug Lab challenge, 1 purple cube starts on the treat symbol next to the sample dishes and may be added to either dish before a Process a Sample action; the City cards used to Characterize a Disease and Test a Cure for purple must be cities with at least 1 purple cube, while any 3 City cards cure it; Isolated Disease Sample cards may be used to Characterize or Test; and lab actions cannot be done at a vaccine factory.",
        pt: "No desafio Superbactéria + Laboratório, 1 cubo roxo começa sobre o símbolo de tratamento ao lado das placas de amostra e pode ser acrescentado a qualquer uma das placas antes de uma ação Processar uma Amostra (Process a Sample); as cartas de Cidade usadas para Caracterizar uma Doença (Characterize a Disease) e Testar uma Cura (Test a Cure) da roxa precisam ser de cidades com pelo menos 1 cubo roxo, enquanto quaisquer 3 cartas de Cidade a curam; cartas Isolated Disease Sample podem ser usadas para Caracterizar ou Testar; e ações de laboratório não podem ser feitas em uma Fábrica de Vacina (vaccine factory)."
      }
    }
  ];
  // <<<DATA:ICONS>>>
  const ICONS = [
  {
      "file": "cube-blue.webp",
      "name": {
        "en": "Blue disease cube",
        "pt": "Cubo de doença azul"
      },
      "meaning": {
        "en": "One cube of the blue disease. Infecting a city places 1 cube of its colour; a city never holds a 4th cube of a colour — an outbreak happens instead. The game is lost if a needed cube cannot be placed because the supply of that colour is empty.",
        "pt": "Um cubo da doença azul. Ao infectar uma cidade coloca‑se 1 cubo da cor dela; uma cidade nunca recebe um 4º cubo da mesma cor — ocorre um surto. O jogo é perdido se um cubo necessário não puder ser colocado por falta daquela cor na reserva."
      },
      "page": 1,
      "book": "core"
    },
    {
      "file": "cube-yellow.webp",
      "name": {
        "en": "Yellow disease cube",
        "pt": "Cubo de doença amarelo"
      },
      "meaning": {
        "en": "One cube of the yellow disease (same rules as the other colours; 24 cubes per colour, 96 in total).",
        "pt": "Um cubo da doença amarela (mesmas regras das outras cores; 24 cubos por cor, 96 no total)."
      },
      "page": 1,
      "book": "core"
    },
    {
      "file": "cube-red.webp",
      "name": {
        "en": "Red disease cube",
        "pt": "Cubo de doença vermelho"
      },
      "meaning": {
        "en": "One cube of the red disease (same rules as the other colours).",
        "pt": "Um cubo da doença vermelha (mesmas regras das outras cores)."
      },
      "page": 1,
      "book": "core"
    },
    {
      "file": "cube-black.webp",
      "name": {
        "en": "Black disease cube",
        "pt": "Cubo de doença preto"
      },
      "meaning": {
        "en": "One cube of the black disease (same rules as the other colours).",
        "pt": "Um cubo da doença preta (mesmas regras das outras cores)."
      },
      "page": 6,
      "book": "core"
    },
    {
      "file": "cube-purple.webp",
      "name": {
        "en": "Purple disease cube",
        "pt": "Cubo de doença roxo"
      },
      "meaning": {
        "en": "The cube for the fifth disease in a purple-disease challenge; this match's inventory gives its supply quantity.",
        "pt": "Cubo da quinta doença nos desafios que usam a doença roxa; o inventário desta partida informa a quantidade na reserva."
      },
      "page": 1,
      "book": "otb",
      "challengeAny": [
        "mutation",
        "bio-terrorist"
      ]
    },
    {
      "file": "research-station.webp",
      "name": {
        "en": "Research station",
        "pt": "Centro de pesquisa"
      },
      "meaning": {
        "en": "One of the 6 research stations. Atlanta starts with one; you may Build a Research Station, Shuttle Flight between two of them, and you must be at one to Discover a Cure.",
        "pt": "Um dos 6 centros de pesquisa. Atlanta começa com um; pode‑se Construir um Centro, fazer Voo Fretado entre dois deles, e é preciso estar em um para Descobrir uma Cura."
      },
      "page": 1,
      "book": "core"
    },
    {
      "file": "pawn.webp",
      "name": {
        "en": "Player pawn (role pawn)",
        "pt": "Peão do jogador (peão do papel)"
      },
      "meaning": {
        "en": "Your pawn marks the city you are in. The 7 pawns are colour variants of the same shape, one per role card.",
        "pt": "Seu peão marca a cidade em que você está. Os 7 peões são variações de cor da mesma forma, um por carta de papel."
      },
      "page": 2,
      "book": "core"
    },
    {
      "file": "cure-marker-red.webp",
      "name": {
        "en": "Cure marker, red — \"vial\" (cured) side",
        "pt": "Marcador de cura vermelho — lado \"frasco\" (curada)"
      },
      "meaning": {
        "en": "\"Place the 4 cure markers, 'vial' side up, near the Discovered Cure Indicators.\" The vial side shown on its indicator means that disease has been cured.",
        "pt": "\"Coloque os 4 marcadores de cura com o lado 'frasco' para cima, perto dos Indicadores de Cura Descoberta.\" O lado frasco sobre o indicador significa que a doença foi curada."
      },
      "page": 1,
      "book": "core"
    },
    {
      "file": "cure-marker-yellow.webp",
      "name": {
        "en": "Cure marker, yellow — \"vial\" side",
        "pt": "Marcador de cura amarelo — lado \"frasco\""
      },
      "meaning": {
        "en": "Same as the red cure marker, for the yellow disease.",
        "pt": "Igual ao marcador vermelho, para a doença amarela."
      },
      "page": 1,
      "book": "core"
    },
    {
      "file": "cure-marker-blue.webp",
      "name": {
        "en": "Cure marker, blue — \"vial\" side",
        "pt": "Marcador de cura azul — lado \"frasco\""
      },
      "meaning": {
        "en": "Same as the red cure marker, for the blue disease.",
        "pt": "Igual ao marcador vermelho, para a doença azul."
      },
      "page": 1,
      "book": "core"
    },
    {
      "file": "cure-marker-black.webp",
      "name": {
        "en": "Cure marker, black — \"vial\" side",
        "pt": "Marcador de cura preto — lado \"frasco\""
      },
      "meaning": {
        "en": "Same as the red cure marker, for the black disease.",
        "pt": "Igual ao marcador vermelho, para a doença preta."
      },
      "page": 1,
      "book": "core"
    },
    {
      "file": "eradicated.webp",
      "name": {
        "en": "Eradication \"⊘\" side of a cure marker",
        "pt": "Lado \"⊘\" (erradicada) do marcador de cura"
      },
      "meaning": {
        "en": "The reverse of a cure marker. Flip the marker to this side when the last cube of a cured disease is removed from the board: the disease is eradicated and no new cubes of that colour are ever placed.",
        "pt": "O verso do marcador de cura. Vire para este lado quando o último cubo de uma doença curada sair do tabuleiro: a doença está erradicada e nenhum cubo novo daquela cor é colocado."
      },
      "page": 1,
      "book": "core"
    },
    {
      "file": "infection-rate-marker.webp",
      "name": {
        "en": "Infection rate marker",
        "pt": "Marcador de taxa de infecção"
      },
      "meaning": {
        "en": "Green disc with a white biohazard symbol. \"Place the infection rate marker on the left-most '2' space of the Infection Rate Track.\" The space it occupies is how many Infection cards are drawn each turn; an Epidemic moves it forward 1 space.",
        "pt": "Disco verde com símbolo branco de risco biológico. \"Coloque o marcador de taxa de infecção no espaço '2' mais à esquerda da Trilha de Taxa de Infecção.\" O espaço ocupado indica quantas cartas de Infecção se compra por turno; uma Epidemia o avança 1 espaço."
      },
      "page": 1,
      "book": "core"
    },
    {
      "file": "outbreaks-marker.webp",
      "name": {
        "en": "Outbreaks marker",
        "pt": "Marcador de surtos"
      },
      "meaning": {
        "en": "Green 4‑pointed badge with white 4‑way arrows. \"Place the outbreaks marker on the '0' space of the Outbreaks Track\"; it moves forward 1 space for each outbreak.",
        "pt": "Emblema verde de 4 pontas com setas brancas. \"Coloque o marcador de surtos no espaço '0' da Trilha de Surtos\"; ele avança 1 espaço a cada surto."
      },
      "page": 1,
      "book": "core"
    },
    {
      "file": "outbreak-track-skull.webp",
      "name": {
        "en": "Skull space of the Outbreaks Track",
        "pt": "Espaço da caveira na Trilha de Surtos"
      },
      "meaning": {
        "en": "The final (8th) space of the Outbreaks Track. \"If the outbreaks marker reaches the last space of the Outbreaks Track, the game ends and your team has lost!\" (8 outbreaks = worldwide panic). *Crop note: a 1‑pt tip of the track's own dashed connector line touches the upper‑right corner; it is board art, not another icon.*",
        "pt": "O último espaço (8º) da Trilha de Surtos. \"Se o marcador de surtos chegar ao último espaço da Trilha de Surtos, o jogo acaba e sua equipe perdeu!\" (8 surtos = pânico mundial)."
      },
      "page": 2,
      "book": "core"
    },
    {
      "file": "epidemic-card.webp",
      "name": {
        "en": "Epidemic card face",
        "pt": "Face da carta de Epidemia"
      },
      "meaning": {
        "en": "The card face that triggers \"1‑INCREASE / 2‑INFECT / 3‑INTENSIFY\": move the infection rate marker forward 1 space; draw the bottom Infection card and put 3 cubes on that city; shuffle the Infection Discard Pile and put it on top of the Infection Deck. *Crop note: card artwork including its own printed title — Pandemic has no separate Epidemic glyph.*",
        "pt": "A face da carta que dispara \"1‑AUMENTAR / 2‑INFECTAR / 3‑INTENSIFICAR\": avance o marcador de taxa de infecção 1 espaço; compre a carta de Infecção do fundo e ponha 3 cubos naquela cidade; embaralhe a pilha de descarte de Infecção e coloque‑a sobre o Baralho de Infecção."
      },
      "page": 3,
      "book": "core"
    },
    {
      "file": "event-card.webp",
      "name": {
        "en": "Event card face",
        "pt": "Face da carta de Evento"
      },
      "meaning": {
        "en": "An Event card from the Player Deck. \"Event cards can be played at any time\" — any player may play one at any moment, even on another player's turn, without using an action. *Crop note: card artwork including its printed \"EVENT\" band — the base game has no separate Event glyph.*",
        "pt": "Uma carta de Evento do Baralho de Jogadores. \"Cartas de Evento podem ser jogadas a qualquer momento\" — qualquer jogador pode jogá‑la a qualquer instante, mesmo no turno de outro, sem gastar ação."
      },
      "page": 7,
      "book": "core"
    },
    {
      "file": "disease-symbol-yellow.webp",
      "name": {
        "en": "Yellow disease symbol (virion)",
        "pt": "Símbolo da doença amarela (vírion)"
      },
      "meaning": {
        "en": "The symbol of the yellow disease, used on the Discovered Cure Indicators, on Infection card faces and on the board's city nodes.",
        "pt": "Símbolo da doença amarela, usado nos Indicadores de Cura Descoberta, nas faces das cartas de Infecção e nos nós de cidade do tabuleiro."
      },
      "page": 6,
      "book": "core"
    },
    {
      "file": "disease-symbol-blue.webp",
      "name": {
        "en": "Blue disease symbol (virion)",
        "pt": "Símbolo da doença azul (vírion)"
      },
      "meaning": {
        "en": "As above, for the blue disease.",
        "pt": "Idem, para a doença azul."
      },
      "page": 6,
      "book": "core"
    },
    {
      "file": "disease-symbol-black.webp",
      "name": {
        "en": "Black disease symbol (virion)",
        "pt": "Símbolo da doença preta (vírion)"
      },
      "meaning": {
        "en": "As above, for the black disease.",
        "pt": "Idem, para a doença preta."
      },
      "page": 1,
      "book": "core"
    },
    {
      "file": "disease-symbol-red.webp",
      "name": {
        "en": "Red disease symbol (virion)",
        "pt": "Símbolo da doença vermelha (vírion)"
      },
      "meaning": {
        "en": "As above, for the red disease.",
        "pt": "Idem, para a doença vermelha."
      },
      "page": 1,
      "book": "core"
    },
    {
      "file": "warning.webp",
      "name": {
        "en": "Warning triangle",
        "pt": "Triângulo de atenção"
      },
      "meaning": {
        "en": "The manual's alert glyph, printed beside rules that are easy to get wrong (Fine Points / cautions). The same triangle is printed on the Epidemic card header.",
        "pt": "Glifo de alerta do manual, impresso ao lado de regras fáceis de errar (Detalhes Importantes / avisos). O mesmo triângulo aparece no cabeçalho da carta de Epidemia."
      },
      "page": 6,
      "book": "core"
    },
    {
      "file": "player-card-back.webp",
      "name": {
        "en": "Player card back",
        "pt": "Verso da carta de Jogador"
      },
      "meaning": {
        "en": "The back used to identify Player cards. This match's Player Deck contents are listed in Setup; draw 2 Player cards at the end of each turn.",
        "pt": "O verso que identifica as cartas de Jogador. A composição do Baralho de Jogadores desta partida está indicada na Preparação; comprem 2 cartas de Jogador ao fim de cada turno."
      },
      "page": 1,
      "book": "core"
    },
    {
      "file": "infection-card-back.webp",
      "name": {
        "en": "Infection card back",
        "pt": "Verso da carta de Infecção"
      },
      "meaning": {
        "en": "The back of the 48‑card Infection Deck. Cards are drawn from it during Infect Cities, and from its *bottom* during an Epidemic.",
        "pt": "O verso do Baralho de Infecção (48 cartas). Compram‑se cartas dele em Infectar Cidades e, do *fundo*, durante uma Epidemia."
      },
      "page": 1,
      "book": "core"
    },
    {
      "file": "action-drive-ferry.webp",
      "name": {
        "en": "Drive / Ferry",
        "pt": "Dirigir / Balsa"
      },
      "meaning": {
        "en": "Move to a city connected by a white line to the one you are in.",
        "pt": "Mova‑se para uma cidade ligada por linha branca àquela em que você está."
      },
      "page": 4,
      "book": "core"
    },
    {
      "file": "action-direct-flight.webp",
      "name": {
        "en": "Direct Flight",
        "pt": "Voo direto"
      },
      "meaning": {
        "en": "Discard a City card to move to the city named on that card.",
        "pt": "Descarte uma carta de Cidade para se mover à cidade nomeada nela."
      },
      "page": 4,
      "book": "core"
    },
    {
      "file": "action-charter-flight.webp",
      "name": {
        "en": "Charter Flight",
        "pt": "Voo fretado (carta da cidade atual)"
      },
      "meaning": {
        "en": "Discard the City card that matches the city you are in to move to any city.",
        "pt": "Descarte a carta da cidade em que você está para se mover a qualquer cidade."
      },
      "page": 4,
      "book": "core"
    },
    {
      "file": "action-shuttle-flight.webp",
      "name": {
        "en": "Shuttle Flight",
        "pt": "Voo de traslado"
      },
      "meaning": {
        "en": "Move from a city with a research station to any other city that has a research station.",
        "pt": "Mova‑se de uma cidade com centro de pesquisa para outra cidade que tenha um centro de pesquisa."
      },
      "page": 4,
      "book": "core"
    },
    {
      "file": "action-build-research-station.webp",
      "name": {
        "en": "Build a Research Station",
        "pt": "Construir um centro de pesquisa"
      },
      "meaning": {
        "en": "Discard the City card that matches the city you are in to place a research station there.",
        "pt": "Descarte a carta da cidade em que você está para colocar ali um centro de pesquisa."
      },
      "page": 4,
      "book": "core"
    },
    {
      "file": "action-treat-disease.webp",
      "name": {
        "en": "Treat Disease",
        "pt": "Tratar doença"
      },
      "meaning": {
        "en": "Remove 1 disease cube from the city you are in; if that colour is already cured, remove **all** cubes of that colour from the city.",
        "pt": "Remova 1 cubo de doença da cidade em que você está; se aquela cor já estiver curada, remova **todos** os cubos daquela cor da cidade."
      },
      "page": 4,
      "book": "core"
    },
    {
      "file": "action-share-knowledge.webp",
      "name": {
        "en": "Share Knowledge",
        "pt": "Compartilhar conhecimento"
      },
      "meaning": {
        "en": "Either give the card that matches the city you are in to another player, or take that card from another player. The other player must also be in that city.",
        "pt": "Dê a carta que corresponde à cidade em que você está a outro jogador, ou pegue essa carta de outro jogador. O outro jogador precisa estar na mesma cidade."
      },
      "page": 4,
      "book": "core"
    },
    {
      "file": "action-discover-cure.webp",
      "name": {
        "en": "Discover a Cure",
        "pt": "Descobrir uma cura"
      },
      "meaning": {
        "en": "At a research station, discard 5 City cards of the same colour to cure that disease; flip its cure marker to the \"vial\" side on the Discovered Cure Indicator.",
        "pt": "Em um centro de pesquisa, descarte 5 cartas de Cidade da mesma cor para curar aquela doença; vire o marcador de cura para o lado \"frasco\" no Indicador de Cura Descoberta."
      },
      "page": 4,
      "book": "core"
    },
    {
      "file": "on-the-brink-icon.webp",
      "name": {
        "en": "On the Brink expansion icon",
        "pt": "Ícone da expansão On the Brink"
      },
      "meaning": {
        "en": "\"On the Brink cards have this icon in their lower right corners, so you can easily separate them.\"",
        "pt": "\"As cartas de On the Brink têm este ícone no canto inferior direito, para que você possa separá‑las facilmente.\""
      },
      "page": 1,
      "book": "otb",
      "box": "otb"
    },
    {
      "file": "continuing-effect.webp",
      "name": {
        "en": "∞ \"Continuing Effect\" badge",
        "pt": "Selo ∞ de \"Efeito Contínuo\""
      },
      "meaning": {
        "en": "Printed on the Virulent Strain Epidemic cards that keep working after the Epidemic is resolved: \"Some cards have a *continuing* effect; these affect play after the Epidemic is done. Keep these cards face up as reminders.\" Cards without the badge have a one‑time, immediate effect. *Crop note: the source glyph is a low‑resolution raster (~12 pt wide in the manual); it is the real glyph, upscaled.*",
        "pt": "Impresso nas cartas de Epidemia da Cepa Virulenta que continuam valendo após a Epidemia: \"Algumas cartas têm efeito *contínuo*; elas afetam o jogo depois que a Epidemia termina. Mantenha essas cartas viradas para cima como lembrete.\" Cartas sem o selo têm efeito imediato, único."
      },
      "page": 3,
      "book": "otb",
      "challenge": "virulent-strain"
    },
    {
      "file": "virulent-strain-epidemic-card.webp",
      "name": {
        "en": "Virulent Strain Epidemic card",
        "pt": "Carta de Epidemia da Cepa Virulenta"
      },
      "meaning": {
        "en": "Replaces ordinary Epidemic cards in this challenge: \"Besides its Epidemic effects, each Virulent Strain Epidemic card has an effect which applies only to the Virulent Strain disease. Read the card aloud and follow its instructions.\" *(The card shown is COMPLEX MOLECULAR STRUCTURE, a continuing‑effect card.)*",
        "pt": "Substitui as cartas de Epidemia comuns neste desafio: \"Além dos efeitos de Epidemia, cada carta de Epidemia da Cepa Virulenta tem um efeito que se aplica somente à doença da Cepa Virulenta. Leia a carta em voz alta e siga suas instruções.\""
      },
      "page": 3,
      "book": "otb",
      "challenge": "virulent-strain"
    },
    {
      "file": "cure-marker-purple.webp",
      "name": {
        "en": "Purple cure marker — \"vial\" side",
        "pt": "Marcador de cura roxo — lado \"frasco\""
      },
      "meaning": {
        "en": "Marks the cure state of the purple disease; use the active challenge's cure rules.",
        "pt": "Marca o estado de cura da doença roxa; siga as regras de cura do desafio ativo."
      },
      "page": 1,
      "book": "otb",
      "challengeAny": [
        "mutation",
        "bio-terrorist"
      ]
    },
    {
      "file": "eradicated-purple.webp",
      "name": {
        "en": "Purple cure marker — eradication \"⊘\" side",
        "pt": "Marcador de cura roxo — lado \"⊘\" (erradicada)"
      },
      "meaning": {
        "en": "The eradication side of the purple cure marker. The active challenge defines what happens when the purple disease is eradicated.",
        "pt": "O lado de erradicação do marcador roxo. O desafio ativo define o que acontece quando a doença roxa é erradicada."
      },
      "page": 1,
      "book": "otb",
      "challengeAny": [
        "mutation",
        "bio-terrorist"
      ]
    },
    {
      "file": "mutation-virion.webp",
      "name": {
        "en": "Purple disease symbol",
        "pt": "Símbolo da doença roxa"
      },
      "meaning": {
        "en": "The symbol for the purple disease, used on its Discovered Cure Indicator and challenge cards.",
        "pt": "Símbolo da doença roxa, usado em seu Indicador de Cura Descoberta e nas cartas do desafio."
      },
      "page": 4,
      "book": "otb",
      "challengeAny": [
        "mutation",
        "bio-terrorist"
      ]
    },
    {
      "file": "bio-terrorist-pawn.webp",
      "name": {
        "en": "Bio‑Terrorist pawn (black)",
        "pt": "Peão do Bioterrorista (preto)"
      },
      "meaning": {
        "en": "The black pawn belongs to the Bio‑Terrorist. He is normally hidden; his pawn goes on the board only when he is spotted, and onto a player's role card when captured.",
        "pt": "O peão preto é do Bioterrorista. Normalmente ele está escondido; o peão só vai ao tabuleiro quando ele é avistado, e vai para a carta de papel de um jogador quando capturado."
      },
      "page": 1,
      "book": "otb",
      "challenge": "bio-terrorist"
    },
    {
      "file": "bt-capture.webp",
      "name": {
        "en": "Capture (open handcuffs)",
        "pt": "Capturar (algemas abertas)"
      },
      "meaning": {
        "en": "A non‑Terrorist player's extra action: \"If the Bio‑Terrorist pawn is on the board, a player in the same city as the Bio‑Terrorist may, for an action, capture him. Put the Bio‑Terrorist pawn on your role card. He discards all cards in hand to the Infection Discard Pile (without effect).\"",
        "pt": "Ação extra dos jogadores não‑Terroristas: \"Se o peão do Bioterrorista estiver no tabuleiro, um jogador na mesma cidade pode, como ação, capturá‑lo. Coloque o peão na sua carta de papel. Ele descarta toda a mão na pilha de descarte de Infecção (sem efeito).\""
      },
      "page": 5,
      "book": "otb",
      "challenge": "bio-terrorist"
    },
    {
      "file": "bt-draw-card.webp",
      "name": {
        "en": "Draw Card (Bio‑Terrorist action)",
        "pt": "Comprar Carta (ação do Bioterrorista)"
      },
      "meaning": {
        "en": "\"Draw 1 card from the Infection Deck into hand.\" The Bio‑Terrorist does not draw automatically — he must spend an action.",
        "pt": "\"Compre 1 carta do Baralho de Infecção para a mão.\" O Bioterrorista não compra automaticamente — precisa gastar uma ação."
      },
      "page": 6,
      "book": "otb",
      "challenge": "bio-terrorist"
    },
    {
      "file": "bt-infect-locally.webp",
      "name": {
        "en": "Infect Locally (hidden action)",
        "pt": "Infectar Localmente (ação oculta)"
      },
      "meaning": {
        "en": "\"Place 1 purple cube on your current city.\" A hidden action — may be done only once per turn and only while the Bio‑Terrorist is not spotted or captured.",
        "pt": "\"Coloque 1 cubo roxo na cidade atual.\" Ação oculta — só pode ser feita uma vez por turno e enquanto o Bioterrorista não estiver avistado nem capturado."
      },
      "page": 6,
      "book": "otb",
      "challenge": "bio-terrorist"
    },
    {
      "file": "bt-infect-remotely.webp",
      "name": {
        "en": "Infect Remotely (hidden action)",
        "pt": "Infectar Remotamente (ação oculta)"
      },
      "meaning": {
        "en": "\"Discard an Infection card to place 1 purple cube (only) on that city.\" (He may also Infect Remotely the city he is in.)",
        "pt": "\"Descarte uma carta de Infecção para colocar 1 cubo roxo (apenas) naquela cidade.\" (Ele também pode Infectar Remotamente a cidade em que está.)"
      },
      "page": 6,
      "book": "otb",
      "challenge": "bio-terrorist"
    },
    {
      "file": "bt-sabotage.webp",
      "name": {
        "en": "Sabotage (hidden action)",
        "pt": "Sabotar (ação oculta)"
      },
      "meaning": {
        "en": "\"Remove a Research Station in your city, discarding an Infection card whose *colour* matches this city. Return the Research Station to the supply.\"",
        "pt": "\"Remova um Centro de Pesquisa da sua cidade, descartando uma carta de Infecção cuja *cor* corresponda a essa cidade. Devolva o Centro de Pesquisa à reserva.\""
      },
      "page": 6,
      "book": "otb",
      "challenge": "bio-terrorist"
    },
    {
      "file": "bt-escape.webp",
      "name": {
        "en": "Escape",
        "pt": "Escapar"
      },
      "meaning": {
        "en": "Available while captured: \"Discard an Infection Card to move to its city. Announce an airport sighting there. Take back the Bio‑Terrorist pawn\". While captured he may do only Draw Card or Escape.",
        "pt": "Disponível enquanto capturado: \"Descarte uma carta de Infecção para ir à cidade dela. Anuncie um avistamento no aeroporto. Pegue de volta o peão do Bioterrorista\". Capturado, ele só pode Comprar Carta ou Escapar."
      },
      "page": 6,
      "book": "otb",
      "challenge": "bio-terrorist"
    },
    {
      "file": "in-the-lab-icon.webp",
      "name": {
        "en": "In the Lab expansion icon",
        "pt": "Ícone da expansão In the Lab"
      },
      "meaning": {
        "en": "\"*In the Lab* cards have this icon in their lower right corner, so you can easily separate them.\"",
        "pt": "\"As cartas de *In the Lab* têm este ícone no canto inferior direito, para que você possa separá‑las facilmente.\""
      },
      "page": 1,
      "book": "itl",
      "box": "itl"
    },
    {
      "file": "lab-action-characterize.webp",
      "name": {
        "en": "Characterize a Disease (lab action)",
        "pt": "Caracterizar uma doença (ação de laboratório)"
      },
      "meaning": {
        "en": "\"Place 1 City card to be this research line's cure colour. It must match 1 of the Sequence card's vials. Put this cure vial on the Sequence card.\" Lab actions must be done at a research station.",
        "pt": "\"Coloque 1 carta de Cidade para definir a cor da cura desta linha de pesquisa. Ela deve corresponder a 1 dos frascos da carta de Sequência. Ponha esse frasco de cura sobre a carta de Sequência.\" Ações de laboratório só podem ser feitas em centros de pesquisa."
      },
      "page": 4,
      "book": "itl",
      "box": "itl",
      "challenge": "lab"
    },
    {
      "file": "lab-action-process-sample.webp",
      "name": {
        "en": "Process a Sample (lab action)",
        "pt": "Processar uma amostra (ação de laboratório)"
      },
      "meaning": {
        "en": "\"Move all cubes from a dish along 1 arrow, adjusting them as shown. Cubes may not be moved onto a Sequence card without a cure vial.\"",
        "pt": "\"Mova todos os cubos de uma placa por 1 seta, ajustando‑os conforme indicado. Cubos não podem ser movidos para uma carta de Sequência sem frasco de cura.\""
      },
      "page": 4,
      "book": "itl",
      "box": "itl",
      "challenge": "lab"
    },
    {
      "file": "lab-action-test-cure.webp",
      "name": {
        "en": "Test a Cure (lab action)",
        "pt": "Testar uma cura (ação de laboratório)"
      },
      "meaning": {
        "en": "\"If a research line's Sequence card has any cubes on it, place 1 City card that matches the line's cure colour. Remove 1 cube of this colour from any city to the supply.\"",
        "pt": "\"Se a carta de Sequência de uma linha de pesquisa tiver algum cubo, coloque 1 carta de Cidade que corresponda à cor de cura da linha. Remova 1 cubo dessa cor de qualquer cidade para a reserva.\""
      },
      "page": 5,
      "book": "itl",
      "box": "itl",
      "challenge": "lab"
    },
    {
      "file": "lab-action-sequence-disease.webp",
      "name": {
        "en": "Sequence a Disease (lab action)",
        "pt": "Sequenciar uma doença (ação de laboratório)"
      },
      "meaning": {
        "en": "\"Draw a Sequence card. Place, swap, or discard it. If swapped and its cure vial still matches, keep it and any matching cubes.\"",
        "pt": "\"Compre uma carta de Sequência. Coloque‑a, troque‑a ou descarte‑a. Se trocada e o frasco de cura ainda corresponder, mantenha‑a com os cubos correspondentes.\""
      },
      "page": 5,
      "book": "itl",
      "box": "itl",
      "challenge": "lab"
    },
    {
      "file": "lab-action-discover-cure.webp",
      "name": {
        "en": "Discover a Cure (Lab version)",
        "pt": "Descobrir uma cura (versão Laboratório)"
      },
      "meaning": {
        "en": "In the Lab challenge the cost drops: \"At *any* research station, discard **3** City cards of the same disease colour to cure that disease. Open a new research line.\" The disease must first be characterized, sequenced and its cure tested.",
        "pt": "No desafio do Laboratório o custo cai: \"Em *qualquer* centro de pesquisa, descarte **3** cartas de Cidade da mesma cor para curar aquela doença. Abra uma nova linha de pesquisa.\" A doença precisa antes ser caracterizada, sequenciada e ter sua cura testada."
      },
      "page": 5,
      "book": "itl",
      "box": "itl",
      "challenge": "lab"
    },
    {
      "file": "lab-cure-vial-black.webp",
      "name": {
        "en": "Cure vial, black",
        "pt": "Frasco de cura preto"
      },
      "meaning": {
        "en": "One of the 5 Cure Vials. \"Substitute the cure vials for the cure markers.\" A vial sits on a Sequence card once that research line is characterized, and marks the cured disease at the end.",
        "pt": "Um dos 5 Frascos de Cura. \"Substitua os marcadores de cura pelos frascos de cura.\" O frasco fica sobre a carta de Sequência quando a linha é caracterizada e marca a doença curada ao final."
      },
      "page": 1,
      "book": "itl",
      "box": "itl",
      "challenge": "lab"
    },
    {
      "file": "lab-cure-vial-blue.webp",
      "name": {
        "en": "Cure vial, blue",
        "pt": "Frasco de cura azul"
      },
      "meaning": {
        "en": "As above, for the blue disease.",
        "pt": "Idem, para a doença azul."
      },
      "page": 1,
      "book": "itl",
      "box": "itl",
      "challenge": "lab"
    },
    {
      "file": "lab-cure-vial-red.webp",
      "name": {
        "en": "Cure vial, red",
        "pt": "Frasco de cura vermelho"
      },
      "meaning": {
        "en": "As above, for the red disease.",
        "pt": "Idem, para a doença vermelha."
      },
      "page": 1,
      "book": "itl",
      "box": "itl",
      "challenge": "lab"
    },
    {
      "file": "lab-cure-vial-yellow.webp",
      "name": {
        "en": "Cure vial, yellow",
        "pt": "Frasco de cura amarelo"
      },
      "meaning": {
        "en": "As above, for the yellow disease.",
        "pt": "Idem, para a doença amarela."
      },
      "page": 1,
      "book": "itl",
      "box": "itl",
      "challenge": "lab"
    },
    {
      "file": "lab-cure-vial-purple.webp",
      "name": {
        "en": "Cure vial, purple",
        "pt": "Frasco de cura roxo"
      },
      "meaning": {
        "en": "\"Use the purple cure vial only when combining this challenge with the Mutation or Bio‑Terrorist challenges.\"",
        "pt": "\"Use o frasco de cura roxo somente ao combinar este desafio com os desafios da Mutação ou do Bioterrorista.\""
      },
      "page": 1,
      "book": "itl",
      "box": "itl",
      "challengeAll": [
        "lab"
      ],
      "challengeAny": [
        "mutation",
        "bio-terrorist"
      ]
    },
    {
      "file": "petri-dish.webp",
      "name": {
        "en": "Petri dish (sample dish)",
        "pt": "Placa de Petri (placa de amostra)"
      },
      "meaning": {
        "en": "\"Put the 5 petri dishes on the 5 circles\" of the lab board. Cubes enter the lab board as *samples* from Treat Disease actions, in the 2 left‑most dishes, before being processed.",
        "pt": "\"Coloque as 5 placas de Petri nos 5 círculos\" do tabuleiro de laboratório. Os cubos entram no laboratório como *amostras* vindas de ações Tratar Doença, nas 2 placas mais à esquerda, antes de serem processados."
      },
      "page": 4,
      "book": "itl",
      "box": "itl",
      "challenge": "lab"
    },
    {
      "file": "sequence-card.webp",
      "name": {
        "en": "Sequence card",
        "pt": "Carta de Sequência"
      },
      "meaning": {
        "en": "\"Each Sequence card shows a disease's structure.\" Cubes are moved onto the card with Process a Sample actions to fill each spot, 1 cube per spot; grey spots are filled by cubes of the cure colour. The small vial icon in its corner shows which cure colours the card can be characterized as.",
        "pt": "\"Cada carta de Sequência mostra a estrutura de uma doença.\" Cubos são movidos para a carta com ações Processar uma Amostra para preencher cada espaço, 1 cubo por espaço; espaços cinzas são preenchidos por cubos da cor da cura. O frasco no canto indica as cores de cura possíveis para a carta."
      },
      "page": 1,
      "book": "itl",
      "box": "itl",
      "challenge": "lab"
    },
    {
      "file": "soe-quarantine-2.webp",
      "name": {
        "en": "Quarantine marker, \"2\" face",
        "pt": "Marcador de quarentena, face \"2\""
      },
      "meaning": {
        "en": "Place the \"2\" side up when imposing quarantine; it prevents the next 2 cube placements or outbreaks in that city.",
        "pt": "Coloque a face \"2\" para cima ao impor uma quarentena; ela impede as próximas 2 colocações de cubo ou surtos naquela cidade."
      },
      "page": 1,
      "book": "soe",
      "challengeAny": [
        "quarantines",
        "superbug"
      ]
    },
    {
      "file": "soe-quarantine-pair.webp",
      "name": {
        "en": "Quarantine marker flip (2 to 1)",
        "pt": "Virada do marcador de quarentena (2 para 1)"
      },
      "meaning": {
        "en": "The paired markers illustrate the sequence: after one prevented placement, flip \"2\" to \"1\"; after the next, remove the marker.",
        "pt": "Os marcadores em par ilustram a sequência: após impedir uma colocação, vire de \"2\" para \"1\"; após a próxima, remova o marcador."
      },
      "page": 2,
      "book": "soe",
      "challengeAny": [
        "quarantines",
        "superbug"
      ]
    },
    {
      "file": "soe-hinterlands-die.webp",
      "name": {
        "en": "Hinterlands die",
        "pt": "Dado Hinterlands"
      },
      "meaning": {
        "en": "Before Infection cards, roll the die: a coloured face adds 1 cube to its matching Hinterlands space; a blank face has no effect.",
        "pt": "Antes das cartas de Infecção, role o dado: uma face colorida acrescenta 1 cubo ao espaço Hinterlands correspondente; uma face em branco não tem efeito."
      },
      "page": 1,
      "book": "soe",
      "challenge": "hinterlands"
    },
    {
      "file": "soe-transparent-disk.webp",
      "name": {
        "en": "Transparent connection disk",
        "pt": "Disco transparente de conexão"
      },
      "meaning": {
        "en": "A disk's colour matches the city and Hinterlands space it connects; use the disks on the board to trace those connections.",
        "pt": "A cor do disco corresponde à cidade e ao espaço Hinterlands que ele conecta; use os discos no tabuleiro para localizar essas ligações."
      },
      "page": 1,
      "book": "soe",
      "challenge": "hinterlands"
    },
    {
      "file": "soe-vaccine-factory.webp",
      "name": {
        "en": "Vaccine factory",
        "pt": "Fábrica de vacina"
      },
      "meaning": {
        "en": "After the purple cure, a research station can be converted into a factory; each factory gets 1 dose when built and produces a dose after each player's turn.",
        "pt": "Depois da cura roxa, uma estação de pesquisa pode ser convertida em fábrica; cada fábrica recebe 1 dose ao ser construída e produz uma dose após o turno de cada jogador."
      },
      "page": 1,
      "book": "soe",
      "challenge": "superbug"
    },
    {
      "file": "soe-vaccine-dose.webp",
      "name": {
        "en": "Vaccine dose",
        "pt": "Dose de vacina"
      },
      "meaning": {
        "en": "Collect doses from a vaccine factory; return 1 dose to the supply to distribute vaccine and remove all purple cubes from your city.",
        "pt": "Colete doses em uma fábrica de vacina; devolva 1 dose à reserva para distribuir vacina e remover todos os cubos roxos da sua cidade."
      },
      "page": 1,
      "book": "soe",
      "challenge": "superbug"
    },
    {
      "file": "soe-superbug-cube.webp",
      "name": {
        "en": "Purple Superbug disease cube",
        "pt": "Cubo roxo da doença Superbug"
      },
      "meaning": {
        "en": "The fifth disease has a supply of 24 purple cubes. Treat Disease cannot remove purple cubes.",
        "pt": "A quinta doença tem uma reserva de 24 cubos roxos. Tratar Doença não remove cubos roxos."
      },
      "page": 1,
      "book": "soe",
      "challenge": "superbug"
    },
    {
      "file": "soe-superbug-cure-marker.webp",
      "name": {
        "en": "Superbug cure marker, plain face",
        "pt": "Marcador de cura Superbug, face simples"
      },
      "meaning": {
        "en": "The purple cure marker records whether the Superbug disease has been cured.",
        "pt": "O marcador de cura roxo indica se a doença Superbug foi curada."
      },
      "page": 1,
      "book": "soe",
      "challenge": "superbug"
    },
    {
      "file": "soe-superbug-eradicated.webp",
      "name": {
        "en": "Superbug cure marker, eradication face",
        "pt": "Marcador de cura Superbug, face de erradicação"
      },
      "meaning": {
        "en": "Flip to this face when the purple Superbug disease is eradicated; eradication is required to win.",
        "pt": "Vire para esta face quando a doença Superbug roxa for erradicada; a erradicação é necessária para vencer."
      },
      "page": 1,
      "book": "soe",
      "challenge": "superbug"
    },
    {
      "file": "soe-expansion-icon.webp",
      "name": {
        "en": "State of Emergency expansion icon",
        "pt": "Ícone da expansão State of Emergency"
      },
      "meaning": {
        "en": "Cards from this expansion carry this icon in the lower-right corner to identify and separate them.",
        "pt": "Cartas desta expansão trazem este ícone no canto inferior direito para identificá-las e separá-las."
      },
      "page": 1,
      "book": "soe",
      "box": "soe"
    },
    {
      "file": "soe-hinterlands-cow.webp",
      "name": {
        "en": "Blue Hinterlands cow",
        "pt": "Vaca azul dos Hinterlands"
      },
      "meaning": {
        "en": "The cow identifies the blue Hinterlands space.",
        "pt": "A vaca identifica o espaço Hinterlands azul."
      },
      "page": 1,
      "book": "soe",
      "challenge": "hinterlands"
    },
    {
      "file": "soe-hinterlands-rooster.webp",
      "name": {
        "en": "Black Hinterlands rooster",
        "pt": "Galo preto dos Hinterlands"
      },
      "meaning": {
        "en": "The rooster identifies the black Hinterlands space.",
        "pt": "O galo identifica o espaço Hinterlands preto."
      },
      "page": 1,
      "book": "soe",
      "challenge": "hinterlands"
    },
    {
      "file": "soe-hinterlands-monkey.webp",
      "name": {
        "en": "Yellow Hinterlands monkey",
        "pt": "Macaco amarelo dos Hinterlands"
      },
      "meaning": {
        "en": "The monkey identifies the yellow Hinterlands space.",
        "pt": "O macaco identifica o espaço Hinterlands amarelo."
      },
      "page": 1,
      "book": "soe",
      "challenge": "hinterlands"
    },
    {
      "file": "soe-hinterlands-pig.webp",
      "name": {
        "en": "Red Hinterlands pig",
        "pt": "Porco vermelho dos Hinterlands"
      },
      "meaning": {
        "en": "The pig identifies the red Hinterlands space.",
        "pt": "O porco identifica o espaço Hinterlands vermelho."
      },
      "page": 1,
      "book": "soe",
      "challenge": "hinterlands"
    },
    {
      "file": "soe-action-discover-cure.webp",
      "name": {
        "en": "Discover a Cure (Superbug) action",
        "pt": "Ação Descobrir uma Cura (Superbug)"
      },
      "meaning": {
        "en": "At a research station, discard 5 City cards, at least 2 from cities with purple cubes, to cure the purple disease; convert that station into a factory with 1 dose.",
        "pt": "Em uma estação de pesquisa, descarte 5 cartas de Cidade, sendo pelo menos 2 de cidades com cubos roxos, para curar a doença roxa; converta a estação em fábrica com 1 dose."
      },
      "page": 6,
      "book": "soe",
      "challenge": "superbug"
    },
    {
      "file": "soe-action-build-factory.webp",
      "name": {
        "en": "Build Vaccine Factory action",
        "pt": "Ação Construir Fábrica de Vacina"
      },
      "meaning": {
        "en": "After the purple cure, replace a research station with a factory and 1 dose; no more than 4 factories can be built.",
        "pt": "Depois da cura roxa, substitua uma estação de pesquisa por uma fábrica e 1 dose; no máximo 4 fábricas podem ser construídas."
      },
      "page": 6,
      "book": "soe",
      "challenge": "superbug"
    },
    {
      "file": "soe-action-collect-vaccine.webp",
      "name": {
        "en": "Collect Vaccine action",
        "pt": "Ação Coletar Vacina"
      },
      "meaning": {
        "en": "At a factory, transfer any number of doses from it to your Role card.",
        "pt": "Em uma fábrica, transfira qualquer quantidade de doses dela para sua carta de Papel."
      },
      "page": 6,
      "book": "soe",
      "challenge": "superbug"
    },
    {
      "file": "soe-warning.webp",
      "name": {
        "en": "Superbug Lab warning triangle",
        "pt": "Triângulo de alerta do Superbug Lab"
      },
      "meaning": {
        "en": "Do not Process a Sample in a way that removes the purple cube on the lab board's treat symbol; it is needed to sequence the purple disease.",
        "pt": "Não processe uma amostra de modo a remover o cubo roxo do símbolo de tratamento no tabuleiro do laboratório; ele é necessário para sequenciar a doença roxa."
      },
      "page": 7,
      "book": "soe",
      "box": "soe",
      "challengeAll": [
        "lab",
        "superbug"
      ]
    }
  ];
  // <<<DATA:END>>>

  let storageNotice = "";
  let adjustNotices = [];
  let root = null;

  function defaultPrefs() {
    return {
      language: "pt-BR",
      boxOtb: "no",
      boxItl: "no",
      boxSoe: "no",
      players: 4,
      level: "intro",
      chVirulent: "no",
      chMutation: "no",
      chBioTerrorist: "no",
      chLab: "no",
      chQuarantines: "no",
      chHinterlands: "no",
      chEmergency: "no",
      chSuperbug: "no"
    };
  }

  function yesNo(value, fallback = "no") {
    return value === "yes" || value === "no" ? value : fallback;
  }

  function hasBox(p, box) {
    return box === "core" || p[BOX_PREFS[box]] === "yes";
  }

  function challengeOn(p, id) {
    return p[CHALLENGE_PREF[id]] === "yes";
  }

  /**
   * Clamps a draft configuration to something the manuals actually allow.
   * `priority` is the preference key the player just changed: when two options
   * conflict, the one they just picked wins and the other is switched off.
   */
  function resolvePrefs(input, priority = "") {
    const p = { ...input };
    p.language = p.language === "en-US" ? "en-US" : "pt-BR";
    Object.values(BOX_PREFS).forEach((key) => {
      p[key] = yesNo(p[key]);
    });
    Object.values(CHALLENGE_PREF).forEach((key) => {
      p[key] = yesNo(p[key]);
    });

    const maxPlayers = p.boxOtb === "yes" ? 5 : 4;
    const players = Number(p.players);
    p.players = Number.isInteger(players) ? Math.min(maxPlayers, Math.max(2, players)) : 4;

    if (!LEVELS.includes(p.level)) {
      p.level = "intro";
    }
    if (!hasBox(p, LEVEL_INFO[p.level].box)) {
      p.level = "heroic";
    }

    // A challenge needs the box that supplies it.
    CHALLENGE_IDS.forEach((id) => {
      if (!hasBox(p, CHALLENGE_BOX[id])) {
        p[CHALLENGE_PREF[id]] = "no";
      }
    });

    // The Bio-Terrorist plays against the team and needs a team to play against.
    if (p.chBioTerrorist === "yes" && p.players < 3) {
      if (priority === "players") {
        p.chBioTerrorist = "no";
      } else {
        p.players = 3;
      }
    }

    EXCLUSIONS.forEach(({ a, b }) => {
      const keyA = CHALLENGE_PREF[a];
      const keyB = CHALLENGE_PREF[b];
      if (p[keyA] === "yes" && p[keyB] === "yes") {
        if (priority === keyA) {
          p[keyB] = "no";
        } else {
          p[keyA] = "no";
        }
      }
    });

    REQUIREMENTS.forEach(({ challenge, needs }) => {
      const key = CHALLENGE_PREF[challenge];
      const needsKey = CHALLENGE_PREF[needs];
      if (p[key] === "yes") {
        if (priority === needsKey && p[needsKey] === "no") {
          p[key] = "no";
        } else {
          p[needsKey] = "yes";
        }
      }
    });

    // A requirement can switch a challenge back on after an exclusion ran; settle it.
    EXCLUSIONS.forEach(({ a, b }) => {
      const keyA = CHALLENGE_PREF[a];
      const keyB = CHALLENGE_PREF[b];
      if (p[keyA] === "yes" && p[keyB] === "yes") {
        p[priority === keyA ? keyB : keyA] = "no";
      }
    });

    return p;
  }

  function normalizePrefs(saved) {
    const next = defaultPrefs();
    if (!saved || typeof saved !== "object") {
      return resolvePrefs(next);
    }
    if (saved.language === "en-US" || saved.language === "pt-BR") {
      next.language = saved.language;
    }
    Object.values(BOX_PREFS).forEach((key) => {
      if (saved[key] === "yes" || saved[key] === "no") {
        next[key] = saved[key];
      }
    });
    Object.values(CHALLENGE_PREF).forEach((key) => {
      if (saved[key] === "yes" || saved[key] === "no") {
        next[key] = saved[key];
      }
    });
    const players = Number(saved.players);
    if (Number.isInteger(players) && players >= 2 && players <= 5) {
      next.players = players;
    }
    if (LEVELS.includes(saved.level)) {
      next.level = saved.level;
    }
    return resolvePrefs(next);
  }

  function loadPrefs() {
    try {
      const raw = window.localStorage.getItem(PREFS_KEY);
      return raw ? normalizePrefs(JSON.parse(raw)) : normalizePrefs(null);
    } catch (error) {
      storageNotice = "read";
      console.error("Could not read the Pandemic match settings.", error);
      return normalizePrefs(null);
    }
  }

  let prefs = loadPrefs();

  function configurationKey(p = prefs) {
    const copy = { ...p };
    delete copy.language;
    return JSON.stringify(copy);
  }

  function loadChecks() {
    try {
      const raw = window.localStorage.getItem(CHECKS_KEY);
      if (!raw) {
        return [];
      }
      const saved = JSON.parse(raw);
      if (!saved || saved.config !== configurationKey() || !Array.isArray(saved.checks)) {
        return [];
      }
      return [...new Set(saved.checks.filter((id) => typeof id === "string"))];
    } catch (error) {
      storageNotice = "read";
      console.error("Could not read the Pandemic setup checklist.", error);
      return [];
    }
  }

  let setupChecks = loadChecks();

  function savePrefs() {
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      if (storageNotice === "write") {
        storageNotice = "";
      }
    } catch (error) {
      storageNotice = "write";
      console.error("Could not save the Pandemic match settings.", error);
    }
  }

  function saveChecks() {
    try {
      window.localStorage.setItem(CHECKS_KEY, JSON.stringify({ config: configurationKey(), checks: setupChecks }));
      if (storageNotice === "write") {
        storageNotice = "";
      }
    } catch (error) {
      storageNotice = "write";
      console.error("Could not save the Pandemic setup checklist.", error);
    }
  }

  function t(en, pt) {
    return prefs.language === "pt-BR" ? pt : en;
  }

  function tr(value, fallback = "") {
    if (!value) {
      return fallback;
    }
    if (typeof value === "string") {
      return applyOverrides(value);
    }
    return applyOverrides(t(value.en, value.pt)) || fallback;
  }

  function trList(value) {
    if (!value) {
      return [];
    }
    const picked = prefs.language === "pt-BR" ? value.pt : value.en;
    return Array.isArray(picked) ? picked.filter(Boolean).map(applyOverrides) : [];
  }

  /**
   * Notes transcribed from the manuals often start with the name of the box
   * that adds them, or name a challenge. Those lines are noise for a reader
   * whose table does not have that box or challenge, so they are dropped.
   */
  const NOTE_BOX_WORD = [
    [/\bOn the Brink\b/i, "otb"],
    [/\bIn the Lab\b/i, "itl"],
    [/\bState of Emergency\b/i, "soe"]
  ];
  const NOTE_CHALLENGE_WORD = [
    [/Virulent Strain/i, "virulent-strain"],
    [/Mutation|mutated/i, "mutation"],
    [/Bio-?Terrorist/i, "bio-terrorist"],
    [/\bLab Challenge\b/i, "lab"],
    [/Hinterlands/i, "hinterlands"],
    [/Emergency Event/i, "emergency-events"],
    [/Superbug/i, "superbug"]
  ];
  const PURPLE_CHALLENGES = ["mutation", "bio-terrorist", "superbug"];
  // Deck-building lines that the configured setup phase now states precisely.
  const DECK_LINE = /^(Put the normal Epidemic|Epidemic cards$|Select the Virulent Strain Epidemic|Put the unused Virulent Strain|Prepare the Player Deck|Preparing the Player Deck|Divide the remaining Player cards|Shuffle 1 Virulent Strain Epidemic card into each pile|Stack these piles)/i;

  const OUT_OF_SCOPE = /\b(team game|solo game|solo play|team play)\b/i;
  const EDITORIAL_NOISE = /(\b200\s*dpi\b|low-?resolution|the manual leaves the phrasing)/i;

  let scopeCache = null;
  let scopeCacheKey = "";

  function wordRegex(name) {
    return new RegExp(`\\b${String(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  }

  /**
   * Names of roles and Event cards that are not in this match. A transcribed
   * note that names one of them belongs to a different table, so it is cut.
   * A name that is a substring of an available name (Medic inside Superbug
   * Medic) is kept, otherwise the available role's own notes would vanish.
   */
  function scopeContext() {
    const key = configurationKey();
    if (scopeCache && scopeCacheKey === key) {
      return scopeCache;
    }
    const m = match();
    const roleNames = availableRoles().map((role) => role.name.en);
    const eventNames = EVENTS.filter((entry) => eventAvailable(entry, m)).map((entry) => entry.name.en);
    const blocked = ROLES.map((role) => role.name.en)
      .filter((name) => !roleNames.some((available) => available.includes(name)))
      .concat(EVENTS.map((entry) => entry.name.en).filter((name) => !eventNames.includes(name)))
      .map(wordRegex);
    scopeCache = { m, blocked };
    scopeCacheKey = key;
    return scopeCache;
  }

  function outOfScope(probe) {
    if (!probe) {
      return false;
    }
    if (OUT_OF_SCOPE.test(probe) || EDITORIAL_NOISE.test(probe)) {
      return true;
    }
    const context = scopeContext();
    const m = context.m;
    if (NOTE_BOX_WORD.some(([pattern, box]) => pattern.test(probe) && !m.hasBox(box))) {
      return true;
    }
    if (NOTE_CHALLENGE_WORD.some(([pattern, id]) => pattern.test(probe) && !m.has(id))) {
      return true;
    }
    if (/\bpurple\b/i.test(probe) && !PURPLE_CHALLENGES.some((id) => m.has(id))) {
      return true;
    }
    if (/\bLegendary\b/i.test(probe) && m.level !== "legendary") {
      return true;
    }
    if (/\b(5[- ]players?|5th player|fifth player)\b/i.test(probe) && m.players !== 5) {
      return true;
    }
    return context.blocked.some((pattern) => pattern.test(probe));
  }

  /**
   * In the Lab prints "Mutation: Worldwide Panic" as an optional scenario that
   * players choose, not as an automatic override, so its numbers must never be
   * applied silently. The transcribed lines are left exactly as printed and the
   * scenario is shown separately, clearly labelled as optional.
   */
  function applyOverrides(line) {
    return line;
  }

  function scopedList(value, extraDrop) {
    if (!value) {
      return [];
    }
    const en = Array.isArray(value.en) ? value.en : [];
    const picked = prefs.language === "pt-BR" ? value.pt : value.en;
    return (Array.isArray(picked) ? picked : []).filter((line, position) => {
      if (!line) {
        return false;
      }
      const probe = en[position] || line;
      if (extraDrop && extraDrop(probe)) {
        return false;
      }
      return !outOfScope(probe);
    }).map(applyOverrides);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function bookName(book) {
    const entry = BOOKS[book] || BOOKS.core;
    return t(entry.en, entry.pt);
  }

  function ref(page, book = "core") {
    const entry = BOOKS[book] || BOOKS.core;
    const label = `${bookName(book)} p. ${page} ↗`;
    return `<a class="source-link" href="manuals/${entry.file}#page=${page}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
  }

  function refs(book, ...pages) {
    return pages.map((page) => ref(page, book)).join(" ");
  }

  function coreRefs(...pages) {
    return refs("core", ...pages);
  }

  function eventRuleSources(m) {
    const sources = [["core", 2]];
    if (m.hasBox("otb")) {
      sources.push(["otb", 2]);
    }
    if (m.hasBox("itl")) {
      sources.push(["itl", 2]);
    }
    if (m.hasBox("soe")) {
      sources.push(["soe", 2]);
    }
    return sources;
  }

  function eventRulesRefs(m) {
    return eventRuleSources(m).map(([book, page]) => ref(page, book)).join(" ");
  }

  function icon(name, label) {
    return `<img class="pandemic-inline-icon" src="${ICON_DIR}${name}.webp" alt="${escapeHtml(label || name.replace(/-/g, " "))}">`;
  }

  function levelName(level) {
    return {
      intro: t("Introductory", "Introdutório"),
      standard: t("Standard", "Padrão"),
      heroic: t("Heroic", "Heroico"),
      legendary: t("Legendary", "Lendário")
    }[level];
  }

  function challengeName(id) {
    const entry = (typeof CHALLENGES !== "undefined" ? CHALLENGES : []).find((item) => item.id === id);
    if (entry) {
      return tr(entry.name);
    }
    return {
      "virulent-strain": t("Virulent Strain", "Cepa Virulenta"),
      mutation: t("Mutation", "Mutação"),
      "bio-terrorist": t("Bio-Terrorist", "Bioterrorista"),
      lab: t("Lab Challenge", "Desafio do Laboratório"),
      quarantines: t("Quarantines", "Quarentenas"),
      hinterlands: t("Hinterlands", "Hinterlands"),
      "emergency-events": t("Emergency Events", "Eventos de Emergência"),
      superbug: t("Superbug", "Superbactéria")
    }[id];
  }

  function playersLabel(count) {
    return t(`${count} players`, `${count} jogadores`);
  }

  function describeChange(key, before, after) {
    if (key === "players") {
      return t(
        `Player count changed from ${before} to ${after}.`,
        `O número de jogadores mudou de ${before} para ${after}.`
      );
    }
    if (key === "level") {
      return t(
        `Difficulty changed from ${levelName(before)} to ${levelName(after)}, because ${levelName(before)} needs the On the Brink box.`,
        `A dificuldade mudou de ${levelName(before)} para ${levelName(after)}, porque ${levelName(before)} precisa da caixa On the Brink.`
      );
    }
    const challengeId = CHALLENGE_IDS.find((id) => CHALLENGE_PREF[id] === key);
    if (!challengeId) {
      return "";
    }
    const name = challengeName(challengeId);
    if (after === "yes") {
      const requirement = REQUIREMENTS.find((entry) => CHALLENGE_PREF[entry.needs] === key);
      if (requirement) {
        return t(
          `${name} was switched on: ${challengeName(requirement.challenge)} must be used with it.`,
          `${name} foi ligado: ${challengeName(requirement.challenge)} exige esse módulo.`
        );
      }
      return t(`${name} was switched on.`, `${name} foi ligado.`);
    }
    if (!hasBox(prefs, CHALLENGE_BOX[challengeId])) {
      return t(
        `${name} was switched off: it comes in the ${bookName(CHALLENGE_BOX[challengeId])} box, which this match does not use.`,
        `${name} foi desligado: ele vem na caixa ${bookName(CHALLENGE_BOX[challengeId])}, que não está nesta partida.`
      );
    }
    const clash = EXCLUSIONS.find((entry) => (entry.a === challengeId && challengeOn(prefs, entry.b)) || (entry.b === challengeId && challengeOn(prefs, entry.a)));
    if (clash) {
      const other = clash.a === challengeId ? clash.b : clash.a;
      return t(
        `${name} was switched off: the manuals do not allow it together with ${challengeName(other)}.`,
        `${name} foi desligado: os manuais não permitem combiná-lo com ${challengeName(other)}.`
      );
    }
    if (challengeId === "bio-terrorist" && prefs.players < 3) {
      return t(
        `${name} was switched off: the challenge works with 3 or 4 players.`,
        `${name} foi desligado: o desafio funciona com 3 ou 4 jogadores.`
      );
    }
    const requirement = REQUIREMENTS.find((entry) => entry.challenge === challengeId);
    if (requirement && !challengeOn(prefs, requirement.needs)) {
      return t(
        `${name} was switched off: it must be used with ${challengeName(requirement.needs)}.`,
        `${name} foi desligado: ele precisa ser usado com ${challengeName(requirement.needs)}.`
      );
    }
    return t(`${name} was switched off.`, `${name} foi desligado.`);
  }

  function commit(key, mutator) {
    const previousKey = configurationKey();
    const draft = { ...prefs };
    mutator(draft);
    const resolved = resolvePrefs(draft, key);
    prefs = resolved;
    adjustNotices = Object.keys(resolved)
      .filter((item) => item !== "language" && item !== key && resolved[item] !== draft[item])
      .map((item) => describeChange(item, draft[item], resolved[item]))
      .filter(Boolean);
    savePrefs();
    if (configurationKey() !== previousKey) {
      setupChecks = [];
      saveChecks();
    }
    if (root) {
      renderInto(root);
    }
  }

  // --- Derived match facts -------------------------------------------------

  function match() {
    const p = prefs;
    const boxes = ["core", ...Object.keys(BOX_PREFS).filter((box) => p[BOX_PREFS[box]] === "yes")];
    const challenges = CHALLENGE_IDS.filter((id) => challengeOn(p, id));
    const epidemics = LEVEL_INFO[p.level].epidemics;
    const hand = HAND_SIZES[p.players];
    const has = (id) => challenges.includes(id);
    // The Bio-Terrorist is one of the players, so the team is one smaller.
    const teamPlayers = has("bio-terrorist") ? p.players - 1 : p.players;
    // On the Brink, In the Lab and State of Emergency all replace the base
    // Event rule with "2 Event cards per player".
    const eventsPerPlayer = boxes.length > 1 ? 2 : null;
    const eventPool = EVENTS.filter((entry) => (entry.deck || "player") === "player"
      && boxes.includes(entry.book)
      && (!entry.requires || challenges.includes(entry.requires))).length;
    return {
      ...p,
      boxes,
      challenges,
      has,
      hasBox: (box) => boxes.includes(box),
      epidemics,
      hand,
      handTotal: hand * teamPlayers,
      teamPlayers,
      eventsPerPlayer,
      eventPool,
      // On the Brink counts the Bio-Terrorist for this purpose only.
      eventCount: eventsPerPlayer ? eventsPerPlayer * p.players : 5,
      purple: PURPLE_CHALLENGES.some(has),
      levelLabel: levelName(p.level),
      anyChallenge: challenges.length > 0
    };
  }

  // --- Markup helpers ------------------------------------------------------

  function sectionHeading(id, title, index, refHtml) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("FIELD GUIDE", "GUIA DE CAMPO")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="pandemic-heading-refs">${refHtml}</div>
      </div>`;
  }

  function card(title, body, refHtml = "") {
    return `<article class="info-card"><h3>${title}</h3>${body}${refHtml ? `<p class="pandemic-refs">${refHtml}</p>` : ""}</article>`;
  }

  function block(title, body, refHtml = "") {
    return `<div class="turn-block"><h3>${title}</h3>${body}${refHtml ? `<p class="pandemic-refs">${refHtml}</p>` : ""}</div>`;
  }

  function para(text) {
    return `<p>${text}</p>`;
  }

  function list(items) {
    return `<ul class="pandemic-list">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function steps(items) {
    return `<ol class="pandemic-steps">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ol>`;
  }

  function note(text) {
    return `<p class="pandemic-note">${text}</p>`;
  }

  function cardOnly(text) {
    return `<p class="pandemic-interpretation"><strong>${t("On the component:", "No componente:")}</strong> ${text}</p>`;
  }

  function jump(id, label) {
    return `<button type="button" data-scroll="${id}">${label}</button>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function storageNoticeText() {
    if (storageNotice === "read") {
      return t(
        "This browser could not read the saved Pandemic match. A default match is shown, and it may not be possible to save changes.",
        "Este navegador não conseguiu ler a partida salva de Pandemic. Uma partida padrão está na tela, e pode não ser possível salvar alterações."
      );
    }
    return t(
      "This browser refused to save the Pandemic match. Your latest change is visible on screen only.",
      "Este navegador recusou salvar a partida de Pandemic. A última alteração aparece apenas na tela."
    );
  }

  // --- Build your match ----------------------------------------------------

  function radioOption(key, value, selected, title, description) {
    const id = `pandemic-${key}-${value}`;
    const checked = String(selected) === String(value);
    return `
      <label class="pandemic-choice-card ${checked ? "is-selected" : ""}" for="${id}">
        <input id="${id}" type="radio" name="pandemic-${key}" value="${escapeHtml(value)}" data-pref="${key}" ${checked ? "checked" : ""}>
        <span class="pandemic-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function radioGroup(key, title, summary, selected, options, refHtml = "", wide = false) {
    return `
      <fieldset class="pandemic-choice-group">
        <legend>${title}</legend>
        <p class="pandemic-choice-summary"><strong>${t("Selected:", "Selecionado:")}</strong> ${summary}</p>
        <div class="pandemic-choice-grid ${wide ? "is-wide" : ""}">${options.map((item) => radioOption(key, item.value, selected, item.title, item.description)).join("")}</div>
        ${refHtml ? `<p class="pandemic-refs">${refHtml}</p>` : ""}
      </fieldset>`;
  }

  function fixedGroup(title, summary, text, refHtml = "") {
    return `
      <fieldset class="pandemic-choice-group is-fixed">
        <legend>${title}</legend>
        <p class="pandemic-choice-summary"><strong>${t("Unavailable:", "Indisponível:")}</strong> ${summary}</p>
        <p class="pandemic-option-note">${text}</p>
        ${refHtml ? `<p class="pandemic-refs">${refHtml}</p>` : ""}
      </fieldset>`;
  }

  function boxGroup(box, index, title, yesEffect, noEffect) {
    const key = BOX_PREFS[box];
    const on = prefs[key] === "yes";
    return radioGroup(
      key,
      `${index} · ${title}`,
      on ? t("In play", "Na mesa") : t("Not used", "Fora da mesa"),
      prefs[key],
      [
        { value: "yes", title: t("Yes, we have it", "Sim, temos"), description: yesEffect },
        { value: "no", title: t("No", "Não"), description: noEffect }
      ],
      ref(1, box)
    );
  }

  /** Why a challenge cannot be switched on right now, or "" when it can. */
  function challengeBlocker(id) {
    const p = prefs;
    if (!hasBox(p, CHALLENGE_BOX[id])) {
      return t(
        `Comes in the ${bookName(CHALLENGE_BOX[id])} box. Switch that box on above to use it.`,
        `Vem na caixa ${bookName(CHALLENGE_BOX[id])}. Ligue essa caixa acima para usá-lo.`
      );
    }
    if (id === "bio-terrorist" && p.players < 3) {
      return t(
        "This challenge works with 3 or 4 players: one of them plays as the Bio-Terrorist against the others.",
        "Este desafio funciona com 3 ou 4 jogadores: um deles joga como o Bioterrorista contra os outros."
      );
    }
    const clash = EXCLUSIONS.find((entry) => (entry.a === id && challengeOn(p, entry.b)) || (entry.b === id && challengeOn(p, entry.a)));
    if (clash) {
      const other = clash.a === id ? clash.b : clash.a;
      return t(
        `The manuals do not allow this together with ${challengeName(other)}. Switch that challenge off first.`,
        `Os manuais não permitem combinar isto com ${challengeName(other)}. Desligue aquele desafio primeiro.`
      );
    }
    return "";
  }

  function challengeGroup(id, index) {
    const key = CHALLENGE_PREF[id];
    const entry = (typeof CHALLENGES !== "undefined" ? CHALLENGES : []).find((item) => item.id === id);
    const book = CHALLENGE_BOX[id];
    const pages = entry && Array.isArray(entry.pages) && entry.pages.length ? entry.pages : [1];
    const refHtml = refs(book, ...pages);
    const blocker = challengeBlocker(id);
    const title = `${index} · ${challengeName(id)}`;
    if (blocker) {
      return fixedGroup(title, t("Not available in this match", "Não disponível nesta partida"), blocker, refHtml);
    }
    const summary = tr(entry && entry.summary, t("Changes how the match plays.", "Muda a forma de jogar a partida."));
    const requirement = REQUIREMENTS.find((item) => item.challenge === id);
    const yesExtra = requirement
      ? ` ${t(`Also switches ${challengeName(requirement.needs)} on, which it requires.`, `Também liga ${challengeName(requirement.needs)}, que ele exige.`)}`
      : "";
    return radioGroup(
      key,
      title,
      challengeOn(prefs, id) ? t("On", "Ligado") : t("Off", "Desligado"),
      prefs[key],
      [
        { value: "yes", title: t("Play it", "Jogar com ele"), description: `${summary}${yesExtra}` },
        { value: "no", title: t("Skip it", "Sem ele"), description: t("Its components stay in the box and its rules are hidden from this guide.", "Os componentes dele ficam na caixa e as regras dele somem deste guia.") }
      ],
      refHtml
    );
  }

  function renderConfiguration() {
    const m = match();
    const groups = [];

    groups.push(boxGroup(
      "otb", "1",
      t("On the Brink expansion", "Expansão On the Brink"),
      t("Adds a 5th player, 6 roles, 8 Event cards, the Legendary difficulty (7 Epidemics), 2 Event cards per player, petri dishes, and the Virulent Strain, Mutation and Bio-Terrorist challenges.", "Acrescenta um 5º jogador, 6 papéis, 8 cartas de Evento, a dificuldade Lendária (7 Epidemias), 2 cartas de Evento por jogador, placas de Petri e os desafios Cepa Virulenta, Mutação e Bioterrorista."),
      t("Keeps the match to 2-4 players and the 3 base difficulties.", "Mantém a partida em 2-4 jogadores e nas 3 dificuldades do jogo base.")
    ));
    groups.push(boxGroup(
      "itl", "2",
      t("In the Lab expansion", "Expansão In the Lab"),
      t("Adds 4 roles, 3 Event cards, 2 extra Virulent Strain Epidemic cards and the Lab challenge, where curing a disease takes work at the lab board.", "Acrescenta 4 papéis, 3 cartas de Evento, 2 cartas de Epidemia da Cepa Virulenta extras e o Desafio do Laboratório, em que descobrir a cura exige trabalho no tabuleiro do laboratório."),
      t("No lab board and no extra roles or Events from this box.", "Sem o tabuleiro do laboratório e sem os papéis e Eventos desta caixa.")
    ));
    groups.push(boxGroup(
      "soe", "3",
      t("State of Emergency expansion", "Expansão State of Emergency"),
      t("Adds 5 roles, 7 Event cards, the Quarantines module and the Hinterlands, Emergency Events and Superbug challenges.", "Acrescenta 5 papéis, 7 cartas de Evento, o módulo de Quarentenas e os desafios Hinterlands, Eventos de Emergência e Superbactéria."),
      t("No quarantine markers and none of this box's roles, Events or challenges.", "Sem marcadores de quarentena e sem os papéis, Eventos e desafios desta caixa.")
    ));

    const maxPlayers = m.boxOtb === "yes" ? 5 : 4;
    const playerOptions = [2, 3, 4, 5].filter((count) => count <= maxPlayers).map((count) => ({
      value: String(count),
      title: playersLabel(count),
      description: t(
        `${HAND_SIZES[count]} cards in each starting hand.${count === 5 ? " Needs the On the Brink box." : ""}`,
        `${HAND_SIZES[count]} cartas na mão inicial de cada um.${count === 5 ? " Precisa da caixa On the Brink." : ""}`
      )
    }));
    groups.push(radioGroup(
      "players",
      t("4 · Players", "4 · Jogadores"),
      playersLabel(m.players),
      String(m.players),
      playerOptions,
      m.boxOtb === "yes" ? `${coreRefs(2)} ${ref(2, "otb")}` : coreRefs(2),
      true
    ));

    const levelOptions = LEVELS.filter((level) => hasBox(prefs, LEVEL_INFO[level].box)).map((level) => ({
      value: level,
      title: levelName(level),
      description: t(
        `${LEVEL_INFO[level].epidemics} Epidemic cards in the Player Deck.${level === "intro" ? " Hands are played face up." : ""}${level === "legendary" ? " Needs the On the Brink box." : ""}`,
        `${LEVEL_INFO[level].epidemics} cartas de Epidemia no Baralho de Jogadores.${level === "intro" ? " As mãos ficam abertas na mesa." : ""}${level === "legendary" ? " Precisa da caixa On the Brink." : ""}`
      )
    }));
    groups.push(radioGroup(
      "level",
      t("5 · Difficulty", "5 · Dificuldade"),
      `${m.levelLabel} · ${t(`${m.epidemics} Epidemics`, `${m.epidemics} Epidemias`)}`,
      m.level,
      levelOptions,
      m.boxOtb === "yes" ? `${coreRefs(3, 7)} ${ref(2, "otb")}` : coreRefs(3, 7),
      true
    ));

    CHALLENGE_IDS.forEach((id, position) => {
      groups.push(challengeGroup(id, String(position + 6)));
    });

    const onList = m.challenges.map((id) => challengeName(id));
    const status = `
      <p class="pandemic-config-status">
        <strong>${t("This match:", "Esta partida:")}</strong>
        ${m.boxes.map((box) => bookName(box)).join(" + ")} ·
        ${playersLabel(m.players)} ·
        ${m.levelLabel} (${t(`${m.epidemics} Epidemics`, `${m.epidemics} Epidemias`)}) ·
        ${onList.length ? t(`Challenges: ${onList.join(", ")}`, `Desafios: ${onList.join(", ")}`) : t("no challenges", "sem desafios")}
      </p>`;

    const adjust = adjustNotices.length
      ? `<div class="pandemic-adjust" role="status">${adjustNotices.map((text) => `<p>${text}</p>`).join("")}</div>`
      : "";

    return `
      <section class="rule-section pandemic-config" aria-labelledby="configure-title">
        <div class="section-heading"><div><p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p><h2 id="configure-title">${t("Build your match", "Configure a partida")}</h2></div><div class="pandemic-heading-refs">${coreRefs(2, 3)}</div></div>
        <p class="section-lead">${t(
          "Pick the boxes on your table, the player count, the difficulty and the challenges. Everything below this panel is rewritten to match: components, setup, turns, roles, Events and the quick reference.",
          "Escolha as caixas que estão na sua mesa, o número de jogadores, a dificuldade e os desafios. Tudo abaixo deste painel é reescrito de acordo: componentes, preparação, turnos, papéis, Eventos e a referência rápida."
        )}</p>
        ${status}
        ${adjust}
        ${groups.join("")}
      </section>`;
  }

  // --- Sections ------------------------------------------------------------

  function activeChallenges() {
    const m = match();
    return CHALLENGES.filter((entry) => m.has(entry.id));
  }

  function mentionsInactiveChallenge(text) {
    return outOfScope(text);
  }

  function changeChallenge(entry) {
    const when = entry.when || {};
    if (when.challenge) {
      return when.challenge;
    }
    const probe = `${(entry.topic && entry.topic.en) || ""} ${(entry.text && entry.text.en) || ""}`;
    const hit = NOTE_CHALLENGE_WORD.find(([pattern]) => pattern.test(probe));
    return hit ? hit[1] : null;
  }

  function activeChanges() {
    const m = match();
    return CHANGES.filter((entry) => {
      const when = entry.when || {};
      if (when.box && !m.hasBox(when.box)) {
        return false;
      }
      if (when.challenge && !m.has(when.challenge)) {
        return false;
      }
      const probe = `${(entry.topic && entry.topic.en) || ""} ${(entry.text && entry.text.en) || ""}`;
      if (DECK_LINE.test((entry.topic && entry.topic.en) || "") && m.has("virulent-strain")) {
        return false;
      }
      return !outOfScope(probe);
    });
  }

  function cureLine(short = false) {
    const m = match();
    if (m.has("lab")) {
      return short
        ? t("at any research station, once a disease's research line is characterized, tested and fully filled, discard 3 City cards of that colour", "em qualquer estação de pesquisa, quando a linha de pesquisa da doença estiver caracterizada, testada e totalmente preenchida, descarte 3 cartas de Cidade daquela cor")
        : t("at <em>any</em> research station, once that disease's research line is characterized, tested and has every spot on its Sequence card filled, discard <strong>3</strong> City cards of that colour (not 5)", "em <em>qualquer</em> estação de pesquisa, quando a linha de pesquisa daquela doença estiver caracterizada, testada e com todos os pontos da carta de Sequência preenchidos, descarte <strong>3</strong> cartas de Cidade daquela cor (e não 5)");
    }
    return short
      ? t("at any research station, discard 5 City cards of one colour", "em qualquer estação de pesquisa, descarte 5 cartas de Cidade da mesma cor")
      : t("at <em>any</em> research station, discard <strong>5</strong> City cards of the same colour", "em <em>qualquer</em> estação de pesquisa, descarte <strong>5</strong> cartas de Cidade da mesma cor");
  }

  function handLimitLine(m) {
    if (m.has("emergency-events")) {
      if (m.hasBox("otb")) {
        return m.has("bio-terrorist")
          ? t("Normally 7 Player cards; Limited Options sets 6 for other players and 7 for the Archivist; the Bio-Terrorist stays at 7", "Normalmente 7 cartas de Jogador; Limited Options define 6 para os demais e 7 para o Arquivista; o limite do Bioterrorista continua 7")
          : t("Normally 7 Player cards; Limited Options sets 6 (7 for the Archivist)", "Normalmente 7 cartas de Jogador; Limited Options define 6 (7 para o Arquivista)");
      }
      return t("Normally 7 Player cards; 6 while Limited Options is active", "Normalmente 7 cartas de Jogador; 6 enquanto Limited Options estiver ativo");
    }
    return m.hasBox("otb")
      ? t("7 Player cards; the Archivist's limit is 8; Role and Reference cards do not count", "7 cartas de Jogador; o limite do Arquivista é 8; cartas de Papel e de Referência não contam")
      : t("7 Player cards; Role and Reference cards do not count", "7 cartas de Jogador; cartas de Papel e de Referência não contam");
  }

  function purpleCureLine(m = match()) {
    if (m.has("lab") && m.has("superbug")) {
      return t(
        "In the Superbug Lab combination, complete the purple research line; the Characterize and Test City cards must each be from a city with at least 1 purple cube, then discard any 3 City cards to cure it. The station becomes a vaccine factory with 1 dose. Role abilities may change the card count; see Roles.",
        "Na combinação Superbactéria + Laboratório, complete a linha de pesquisa roxa; as cartas de Cidade de Caracterização e Teste precisam ser de cidades com pelo menos 1 cubo roxo cada, depois descarte quaisquer 3 cartas de Cidade para curá-la. A estação vira uma Fábrica de Vacina com 1 dose. Habilidades de Papel podem mudar a quantidade; veja Papéis."
      );
    }
    if (m.has("lab")) {
      return t(
        "At a research station, complete the purple research line and discard 3 City cards of any colours; these cards need not be cities with purple cubes. Move the purple Cure Vial to its Cure Indicator. Role abilities may change the card count; see Roles.",
        "Em uma estação de pesquisa, complete a linha de pesquisa roxa e descarte 3 cartas de Cidade de quaisquer cores; essas cartas não precisam ser de cidades com cubos roxos. Mova o Frasco de Cura roxo para seu Indicador de Cura. Habilidades de Papel podem mudar a quantidade; veja Papéis."
      );
    }
    if (m.has("superbug")) {
      return t(
        "At a research station, discard 5 City cards; at least 2 must be cities with 1 or more purple cubes. The station becomes a vaccine factory with 1 dose. Role abilities may change the card count; see Roles.",
        "Em uma estação de pesquisa, descarte 5 cartas de Cidade; pelo menos 2 devem ser de cidades com 1 ou mais cubos roxos. A estação vira uma Fábrica de Vacina com 1 dose. Habilidades de Papel podem mudar a quantidade; veja Papéis."
      );
    }
    return t(
      "Discard 5 City cards in any mix of colours; at least 1 must be a city that has 1 or more purple cubes. Move the cure marker to its Cure Indicator. Role abilities may change the card count; see Roles.",
      "Descarte 5 cartas de Cidade de quaisquer cores; pelo menos 1 deve ser de uma cidade com 1 ou mais cubos roxos. Mova o marcador de cura para seu Indicador de Cura. Habilidades de Papel podem mudar a quantidade; veja Papéis."
    );
  }

  function winLine() {
    const m = match();
    if (m.has("superbug")) {
      return t(
        "Cure all <strong>5</strong> diseases <em>and</em> eradicate the purple superbug disease.",
        "Curar as <strong>5</strong> doenças <em>e</em> erradicar a doença roxa superbactéria (superbug)."
      );
    }
    if (m.has("bio-terrorist")) {
      return t(
        "The non-Terrorist players win by curing all <strong>5</strong> diseases, or by curing the 4 standard diseases with no purple cubes on the board.",
        "Os jogadores não terroristas vencem curando as <strong>5</strong> doenças, ou curando as 4 doenças padrão sem nenhum cubo roxo no tabuleiro."
      );
    }
    if (m.has("mutation")) {
      return t(
        "Cure all <strong>5</strong> diseases, or cure the 4 standard diseases with no purple cubes on the board.",
        "Curar as <strong>5</strong> doenças, ou curar as 4 doenças padrão sem nenhum cubo roxo no tabuleiro."
      );
    }
    return t("Cure all <strong>4</strong> diseases.", "Curar as <strong>4</strong> doenças.");
  }

  function overviewSection(index) {
    const m = match();
    const changes = activeChanges().filter((entry) => !changeChallenge(entry));
    return `
      ${sectionHeading("overview", t("Overview", "Visão geral"), index, coreRefs(1))}
      <p class="section-lead">${t(
        m.has("bio-terrorist")
          ? "The non-Terrorist players cooperate to discover cures; the Bio-Terrorist plays against them."
          : "You are a disease control team. You all win or lose together: the goal is to discover cures before the world is overrun.",
        m.has("bio-terrorist")
          ? "Os jogadores não terroristas cooperam para descobrir curas; o Bioterrorista joga contra eles."
          : "Vocês são uma equipe de controle de doenças. Todos ganham ou perdem juntos: o objetivo é descobrir as curas antes que o mundo seja tomado."
      )}</p>
      <div class="info-grid">
        ${card(t("Goal", "Objetivo"), para(`${winLine()} ${t(
          "Cubes left on the board do not matter unless a rule below says otherwise.",
          "Os cubos que sobraram no tabuleiro não importam, a menos que alguma regra abaixo diga o contrário."
        )}`), coreRefs(1, 7))}
        ${card(t("Cooperation", "Cooperação"), para(t(
          m.has("bio-terrorist")
            ? "The team wins or loses together — except for the Bio-Terrorist, who is one of the players and plays against the rest of the table."
            : "Players freely advise each other, but the player whose turn it is decides what to do.",
          m.has("bio-terrorist")
            ? "A equipe ganha ou perde junta — exceto o Bioterrorista, que é um dos jogadores e joga contra o resto da mesa."
            : "Os jogadores dão conselhos livremente, mas quem decide é o jogador da vez."
        )), coreRefs(1, 3))}
        ${card(t("How you lose", "Como se perde"), lineList([
          t("<strong>8 outbreaks</strong> — the outbreaks marker reaches the last space of the Outbreaks Track.", "<strong>8 surtos</strong> — o marcador de surtos chega ao último espaço da Trilha de Surtos."),
          t("<strong>Out of cubes</strong> — a needed cube colour's supply is empty, so you cannot make a required placement.", "<strong>Sem cubos</strong> — a reserva de uma cor necessária acabou e você não consegue fazer uma colocação obrigatória."),
          t("<strong>Out of time</strong> — a player cannot draw 2 Player cards after their actions.", "<strong>Sem tempo</strong> — um jogador não consegue comprar 2 cartas de Jogador depois das ações.")
        ]), coreRefs(1, 7))}
        ${card(t("This match", "Esta partida"), lineList([
          t(`<strong>Boxes</strong> — ${m.boxes.map((box) => bookName(box)).join(" + ")}.`, `<strong>Caixas</strong> — ${m.boxes.map((box) => bookName(box)).join(" + ")}.`),
          t(
            m.has("bio-terrorist")
              ? `<strong>Players</strong> — ${m.players} total; the ${m.teamPlayers} non-Terrorist players receive ${m.hand} Player cards each (${m.handTotal} total), and the Bio-Terrorist receives 2 Infection cards after the initial infection setup.`
              : `<strong>Players</strong> — ${m.players}; ${m.hand} Player cards each at the start (${m.handTotal} total).`,
            m.has("bio-terrorist")
              ? `<strong>Jogadores</strong> — ${m.players} no total; os ${m.teamPlayers} jogadores não terroristas recebem ${m.hand} cartas de Jogador cada (${m.handTotal} no total), e o Bioterrorista recebe 2 cartas de Infecção após a preparação inicial das infecções.`
              : `<strong>Jogadores</strong> — ${m.players}; ${m.hand} cartas de Jogador cada no início (${m.handTotal} no total).`
          ),
          t(`<strong>Difficulty</strong> — ${m.levelLabel}, ${m.epidemics} Epidemic cards.`, `<strong>Dificuldade</strong> — ${m.levelLabel}, ${m.epidemics} cartas de Epidemia.`),
          m.anyChallenge
            ? t(`<strong>Challenges</strong> — ${m.challenges.map((id) => challengeName(id)).join(", ")}.`, `<strong>Desafios</strong> — ${m.challenges.map((id) => challengeName(id)).join(", ")}.`)
            : t("<strong>Challenges</strong> — none selected.", "<strong>Desafios</strong> — nenhum selecionado.")
        ]))}
      </div>
      ${changes.length ? `
        <h3 class="subhead">${t("What your boxes change", "O que suas caixas mudam")}</h3>
        <div class="info-grid">${changes.map((entry) => card(
          tr(entry.topic),
          para(tr(entry.text)),
          ref(entry.page, entry.book)
        )).join("")}</div>` : ""}
      <h3 class="subhead">${t("The four diseases", "As quatro doenças")}</h3>
      <p>${t(
        "Each of the 48 cities has one printed disease colour. Cubes represent diseases, not city ownership: outbreaks and challenges can place other colours there, up to 3 cubes of each colour.",
        "Cada uma das 48 cidades tem uma cor de doença impressa. Os cubos representam doenças, não a cidade: surtos e desafios podem colocar cubos de outras cores ali, até 3 de cada cor."
      )}</p>
      <div class="info-grid">
        ${card(t("Blue (12)", "Azul (12)"), para(CITIES.blue.join(" · ")))}
        ${card(t("Yellow (12)", "Amarela (12)"), para(CITIES.yellow.join(" · ")))}
        ${card(t("Black (12)", "Preta (12)"), para(CITIES.black.join(" · ")))}
        ${card(t("Red (12)", "Vermelha (12)"), para(CITIES.red.join(" · ")))}
      </div>
      ${note(t(
        "The city colours and links are printed on the board; this guide does not reproduce the map. The base game supplies 24 cubes of each of the four standard colours.",
        "As cores e ligações das cidades estão impressas no tabuleiro; este guia não reproduz o mapa. O jogo base fornece 24 cubos de cada uma das quatro cores padrão."
      ))}
      ${m.purple ? note(t(
        `The ${m.has("superbug") ? "Superbug" : m.has("bio-terrorist") ? "Bio-Terrorist" : "Mutation"} challenge adds a fifth, purple disease with no cities of its own; its supply has ${m.has("superbug") ? 24 : 12} cubes. A city may hold purple cubes as well as cubes of its printed colour, up to 3 purple cubes.`,
        `O desafio ${m.has("superbug") ? "Superbug" : m.has("bio-terrorist") ? "Bioterrorista" : "Mutação"} acrescenta uma quinta doença, roxa, sem cidades próprias; sua reserva tem ${m.has("superbug") ? 24 : 12} cubos. Uma cidade pode ter cubos roxos junto com cubos da cor impressa nela, até 3 cubos roxos.`
      )) : ""}`;
  }

  function quickReference(index) {
    const m = match();
    const cards = [
      [t("Your turn", "Seu turno"), [
        t("<strong>1. Do up to 4 actions</strong> — any combination, repeats allowed; you may stop early.", "<strong>1. Faça até 4 ações</strong> — qualquer combinação, podendo repetir; você pode parar antes."),
        t(`<strong>2. Draw 2 Player cards</strong> into your hand; resolve any Epidemics and cards that say to play immediately. Hold Event cards for later; discard to your limit (${handLimitLine(m)}).`, `<strong>2. Compre 2 cartas de Jogador</strong> para a mão; resolva Epidemias e cartas que mandem jogar imediatamente. Guarde as cartas de Evento para depois; descarte até o limite (${handLimitLine(m)}).`),
        m.has("emergency-events")
          ? t("<strong>Before Infecting</strong> — resolve any face-up Patient Zero effect.", "<strong>Antes de Infectar</strong> — resolva o efeito de qualquer Patient Zero que esteja virado para cima.")
          : "",
        m.has("hinterlands")
          ? t("<strong>Before Infection cards</strong> — roll the Hinterlands die; skip if One Quiet Night skips Infections, and roll twice after Logistics Failure.", "<strong>Antes das cartas de Infecção</strong> — role o dado Hinterlands; pule se Uma Noite Tranquila pular as Infecções e role duas vezes após Logistics Failure.")
          : "",
        m.has("hinterlands") && m.has("emergency-events")
          ? t("<strong>Timing note</strong> — the manuals place both Patient Zero and the Hinterlands roll before Infection cards, but do not specify which comes first; agree on an order before play.", "<strong>Momento</strong> — os manuais colocam Patient Zero e a rolagem dos Hinterlands antes das cartas de Infecção, mas não especificam qual vem primeiro; combinem uma ordem antes de jogar.")
          : "",
        t(`<strong>3. Infect cities</strong> — flip Infection cards equal to the infection rate.`, "<strong>3. Infecte cidades</strong> — vire cartas de Infecção conforme a taxa de infecção."),
        t("<strong>Then</strong> — the player on your left takes a turn.", "<strong>Depois</strong> — joga quem está à sua esquerda.")
      ].filter(Boolean), "turn"],
      [t("Actions", "Ações"), [
        t("<strong>Drive / Ferry</strong> — move to a city connected by a white line.", "<strong>Dirigir / Navegar (Drive / Ferry)</strong> — mova-se para uma cidade ligada por uma linha branca."),
        t("<strong>Direct Flight</strong> — discard a City card to move to that city.", "<strong>Voo Direto (Direct Flight)</strong> — descarte uma carta de Cidade e vá para essa cidade."),
        t("<strong>Charter Flight</strong> — discard the card matching your city to move anywhere.", "<strong>Voo Fretado (Charter Flight)</strong> — descarte a carta da cidade em que está e vá para qualquer cidade."),
        t("<strong>Shuttle Flight</strong> — move between two cities that both have research stations.", "<strong>Voo de Traslado (Shuttle Flight)</strong> — mova-se entre duas cidades que tenham estação de pesquisa."),
        t(m.has("lab")
          ? "<strong>Build a Research Station</strong> — discard the card matching your city; then do 1 free bonus lab action."
          : "<strong>Build a Research Station</strong> — discard the card matching your city.",
        m.has("lab")
          ? "<strong>Construir Estação de Pesquisa</strong> — descarte a carta da cidade em que está; depois faça 1 ação de laboratório bônus grátis."
          : "<strong>Construir Estação de Pesquisa</strong> — descarte a carta da cidade em que está."),
        m.has("superbug")
          ? t("<strong>Treat Disease</strong> — remove cubes normally, but never remove purple superbug cubes.", "<strong>Tratar Doença</strong> — remova cubos normalmente, mas nunca cubos roxos da superbactéria.")
          : t(`<strong>Treat Disease</strong> — remove 1 cube; if that colour is cured, remove all cubes of that colour from your city.${m.has("lab") ? " You may put 1 removed cube in a sample dish." : ""}`, `<strong>Tratar Doença</strong> — remova 1 cubo; se a cor estiver curada, remova todos os cubos daquela cor da sua cidade.${m.has("lab") ? " Você pode colocar 1 cubo removido numa placa de amostra." : ""}`),
        t("<strong>Share Knowledge</strong> — give or take the City card matching your shared city; both players must agree, and the receiver immediately resolves any hand-limit excess.", "<strong>Compartilhar Conhecimento</strong> — dê ou pegue a carta de Cidade da cidade compartilhada; ambos precisam concordar, e quem recebe resolve imediatamente qualquer excesso do limite de mão."),
        m.purple
          ? t(`<strong>Discover a Cure for purple</strong> — ${purpleCureLine(m)}`, `<strong>Descobrir a Cura roxa</strong> — ${purpleCureLine(m)}`)
          : t(`<strong>Discover a Cure</strong> — ${cureLine(true)}; role abilities may change the card count (see ${jump("roles", t("Roles", "Papéis"))}).`, `<strong>Descobrir a Cura</strong> — ${cureLine(true)}; habilidades de Papel podem mudar a quantidade de cartas (veja ${jump("roles", t("Papéis", "Papéis"))}).`),
        m.has("superbug")
          ? t(`<strong>Impose Quarantine</strong>, <strong>Build Vaccine Factory</strong>, <strong>Collect Vaccine</strong> and <strong>Distribute Vaccine</strong> each cost 1 action; see ${jump("challenge-superbug", t("Superbug rules", "regras de Superbug"))} for their conditions and effects.`, `<strong>Impor Quarentena</strong>, <strong>Construir Fábrica de Vacina</strong>, <strong>Coletar Vacina</strong> e <strong>Distribuir Vacina</strong> custam 1 ação cada; veja ${jump("challenge-superbug", t("as regras de Superbug", "as regras de Superbug"))} para condições e efeitos.`)
          : ""
      ].filter(Boolean), "actions"],
      [t("Epidemic", "Epidemia"), [
        t("<strong>1 Increase</strong> — move the infection rate marker forward 1 space.", "<strong>1 Aumentar</strong> — avance o marcador de taxa de infecção 1 espaço."),
        t("<strong>2 Infect</strong> — draw the <em>bottom</em> Infection card; unless its colour is eradicated put 3 cubes on that city (top it up to 3 and it outbreaks), then discard it.", "<strong>2 Infectar</strong> — compre a carta de Infecção de <em>baixo</em>; a menos que a cor esteja erradicada, ponha 3 cubos naquela cidade (complete até 3 e ocorre um surto) e descarte-a."),
        t("<strong>3 Intensify</strong> — reshuffle only the Infection Discard Pile and put it on <em>top</em> of the Infection Deck.", "<strong>3 Intensificar</strong> — embaralhe somente a Pilha de Descarte de Infecção e coloque-a <em>sobre</em> o Baralho de Infecção."),
        t("<strong>Two at once</strong> — do all three steps once, then again.", "<strong>Duas de uma vez</strong> — faça os três passos uma vez e depois outra."),
        t(m.has("virulent-strain")
          ? "<strong>No replacement</strong> — remove a resolved base Epidemic from the game. Keep continuing Virulent Strain cards face up and flip immediate ones face down; do not draw a replacement."
          : "<strong>No replacement</strong> — remove the resolved Epidemic card from the game; do not draw a replacement.",
        m.has("virulent-strain")
          ? "<strong>Sem reposição</strong> — tire da partida uma Epidemia básica resolvida. Mantenha as cartas contínuas da Cepa Virulenta viradas para cima e vire as imediatas para baixo; não compre cartas no lugar delas."
          : "<strong>Sem reposição</strong> — tire da partida a carta de Epidemia resolvida; não compre uma carta no lugar."),
      ], "draw"],
      [t("Infections", "Infecções"), [
        t(`<strong>Infection rate track</strong> — ${INFECTION_RATE_TRACK.join(" · ")}; read the number under the marker.`, `<strong>Trilha de taxa de infecção</strong> — ${INFECTION_RATE_TRACK.join(" · ")}; leia o número sob o marcador.`),
        m.purple
          ? t(`<strong>Purple supply</strong> — ${m.has("superbug") ? 24 : 12} cubes; at most 3 purple cubes per city. Running out when cubes are needed loses the game.`, `<strong>Reserva roxa</strong> — ${m.has("superbug") ? 24 : 12} cubos; no máximo 3 cubos roxos por cidade. Ficar sem cubos quando forem necessários faz perder a partida.`)
          : "",
        t("<strong>One at a time</strong> — flip, infect, discard, then the next card.", "<strong>Uma de cada vez</strong> — vire, infecte, descarte e só então a próxima carta."),
        t(m.has("superbug")
          ? "<strong>Place cubes</strong> of the Infection card's colour normally; if that city has purple cubes, apply the Superbug purple-cube or outbreak rule."
          : m.has("bio-terrorist") || m.has("mutation")
            ? "<strong>Place cubes</strong> of the Infection card's colour if not eradicated; if that city already has purple cubes, also place 1 purple cube if purple is not eradicated."
          : "<strong>Place 1 cube</strong> of the Infection card's colour unless that disease is eradicated; cities can hold cubes of several colours.",
        m.has("superbug")
          ? "<strong>Coloque cubos</strong> da cor da carta de Infecção normalmente; se a cidade tiver cubos roxos, aplique a regra de cubos roxos ou surto da Superbactéria."
          : m.has("bio-terrorist") || m.has("mutation")
            ? "<strong>Coloque cubos</strong> da cor da carta de Infecção se não estiver erradicada; se a cidade já tiver cubos roxos, coloque também 1 cubo roxo se o roxo não estiver erradicado."
          : "<strong>Coloque 1 cubo</strong> da cor da carta de Infecção, a menos que a doença esteja erradicada; cidades podem ter cubos de várias cores."),
        t("<strong>Already 3 cubes</strong> — no 4th cube; an outbreak happens instead.", "<strong>Já com 3 cubos</strong> — não coloque o 4º; ocorre um surto."),
        t("<strong>Eradicated colour</strong> — do not place cubes of that colour.", "<strong>Cor erradicada</strong> — não coloque cubos daquela cor.")
      ], "infections"],
      [t("Outbreak", "Surto"), [
        t("<strong>Marker</strong> — move the outbreaks marker forward 1 space.", "<strong>Marcador</strong> — avance o marcador de surtos 1 espaço."),
        t("<strong>Spread</strong> — 1 cube of that colour on every connected city.", "<strong>Espalhe</strong> — 1 cubo daquela cor em cada cidade ligada."),
        t("<strong>Chain reaction</strong> — a connected city already at 3 cubes outbreaks after the current one.", "<strong>Reação em cadeia</strong> — uma cidade ligada que já tenha 3 cubos entra em surto depois do atual."),
        m.has("hinterlands")
          ? t("<strong>Hinterlands</strong> — outbreaks there also advance the same marker; remove all cured-colour cubes from both boards to eradicate.", "<strong>Hinterlands</strong> — surtos ali também avançam o mesmo marcador; para erradicar, remova os cubos de cor curada dos dois tabuleiros.")
          : "",
        t("<strong>Once per card</strong> — a city never outbreaks twice while resolving the same Infection card.", "<strong>Uma vez por carta</strong> — uma cidade nunca entra em surto duas vezes na mesma carta de Infecção."),
        t("<strong>Mixed cities</strong> — a city may hold cubes of several colours, up to 3 of each.", "<strong>Cidades mistas</strong> — uma cidade pode ter cubos de várias cores, até 3 de cada.")
      ], "infections"],
      [t("Cures and eradication", "Curas e erradicação"), [
        t(
          m.purple
            ? `<strong>Standard disease cure</strong> — ${cureLine(true)}; role abilities may change the card count. Move its marker to the Cure Indicator.`
            : `<strong>Cure</strong> — ${cureLine(true)}; move its cure marker to the Cure Indicator.`,
          m.purple
            ? `<strong>Cura de doença padrão</strong> — ${cureLine(true)}; habilidades de Papel podem mudar a quantidade. Mova o marcador ao Indicador de Cura.`
            : `<strong>Cura</strong> — ${cureLine(true)}; mova o marcador de cura para o Indicador de Cura.`
        ),
        m.purple
          ? t(`<strong>Purple cure</strong> — ${purpleCureLine(m)}`, `<strong>Cura roxa</strong> — ${purpleCureLine(m)}`)
          : "",
        t("<strong>Any station</strong> — the station's own colour does not matter.", "<strong>Qualquer estação</strong> — a cor da cidade da estação não importa."),
        t("<strong>Cured, not gone</strong> — cubes stay on the board and new ones can still be placed.", "<strong>Curada, não sumida</strong> — os cubos continuam no tabuleiro e novos ainda podem ser colocados."),
        t(m.has("hinterlands")
          ? "<strong>Eradicated</strong> — remove all cubes of a cured colour from both the main board and Hinterlands board, then flip its marker; no more cubes of that colour are placed."
          : "<strong>Eradicated</strong> — when the last cube of a cured colour leaves the board, flip its cure marker to the “⊘” side; that colour is never placed again.",
        m.has("hinterlands")
          ? "<strong>Erradicada</strong> — remova todos os cubos de uma cor curada do tabuleiro principal e do tabuleiro Hinterlands, depois vire o marcador; nenhum cubo daquela cor volta a ser colocado."
          : "<strong>Erradicada</strong> — quando o último cubo de uma cor curada sai do tabuleiro, vire o marcador de cura dela para o lado “⊘”; aquela cor nunca mais é colocada.")
      ], "cures"],
      [t("Limits", "Limites"), [
        t(`<strong>Hand limit</strong> — ${handLimitLine(m)}`, `<strong>Limite de mão</strong> — ${handLimitLine(m)}`),
        t("<strong>Cubes per city</strong> — at most 3 of each colour.", "<strong>Cubos por cidade</strong> — no máximo 3 de cada cor."),
        t("<strong>Research stations</strong> — 6 in total; if all 6 are built, a new one is made by moving an existing station.", "<strong>Estações de pesquisa</strong> — 6 no total; se as 6 estiverem construídas, uma nova surge movendo uma já existente."),
        t("<strong>Events</strong> — playable at any time except between drawing a card and resolving it; playing one is not an action.", "<strong>Eventos</strong> — jogáveis a qualquer momento, exceto entre comprar uma carta e resolvê-la; jogar um não é uma ação.")
      ], "events"],
      [t("Win and lose", "Vitória e derrota"), [
        t(`<strong>Win</strong> — ${winLine()}`, `<strong>Vitória</strong> — ${winLine()}`),
        t("<strong>Lose</strong> — the outbreaks marker reaches the last space (the 8th outbreak).", "<strong>Derrota</strong> — o marcador de surtos chega ao último espaço (o 8º surto)."),
        t("<strong>Lose</strong> — a required cube cannot be placed because that colour's supply is empty.", "<strong>Derrota</strong> — um cubo obrigatório não pode ser colocado porque a reserva daquela cor acabou."),
        t("<strong>Lose</strong> — fewer than 2 cards remain when a player must draw.", "<strong>Derrota</strong> — restam menos de 2 cartas quando um jogador precisa comprar.")
      ], "winning"],
      [t("Roles and Events", "Papéis e Eventos"), [
        t(`Role abilities can change the rules — ${jump("roles", t("see the roles in this match", "veja os papéis desta partida"))}.`, `Habilidades de Papel podem mudar as regras — ${jump("roles", t("veja os papéis desta partida", "veja os papéis desta partida"))}.`),
        t(`Events can be played at the allowed timing without spending an action — ${jump("events", t("see the available cards", "veja as cartas disponíveis"))}.`, `Eventos podem ser jogados no momento permitido sem gastar ação — ${jump("events", t("veja as cartas disponíveis", "veja as cartas disponíveis"))}.`)
      ], "events"]
    ];
    const challengeCards = activeChallenges()
      .map((entry) => {
        const superbugLab = entry.id === "superbug" && m.has("lab");
        const lines = scopedList(entry.quickRef, (probe) => superbugLab
          && /^Cure purple: at a research station discard 5 City cards/i.test(probe));
        if (superbugLab) {
          lines.splice(2, 0, t(
            "<strong>Cure purple (Superbug Lab)</strong> — complete the purple research line at a research station; Characterize and Test must use cities with purple cubes, then discard any 3 City cards. The station becomes a vaccine factory with 1 dose.",
            "<strong>Curar o roxo (Superbug + Laboratório)</strong> — complete uma linha de pesquisa roxa em uma Estação de Pesquisa; Caracterizar e Testar exigem cidades com cubos roxos, depois descarte quaisquer 3 cartas de Cidade. A estação vira uma Fábrica de Vacina com 1 dose."
          ));
        }
        if (entry.id === "virulent-strain") {
          lines.unshift(t(
            `Player Deck: this match uses ${m.epidemics} Virulent Strain Epidemic cards, 1 per pile, chosen from ${m.hasBox("itl") ? 10 : 8}.`,
            `Baralho de Jogadores: esta partida usa ${m.epidemics} cartas de Epidemia da Cepa Virulenta, 1 por monte, escolhidas entre ${m.hasBox("itl") ? 10 : 8}.`
          ));
        }
        return lines.length ? [challengeName(entry.id), lines, `challenge-${entry.id}`] : null;
      })
      .filter(Boolean);
    const all = [...cards, ...challengeCards];
    return `
      ${sectionHeading("quick", t("Quick reference", "Referência rápida"), index, coreRefs(4, 6, 7))}
      <p class="section-lead">${t(
        "One line per rule, so you can find it mid-turn without reading a paragraph.",
        "Uma linha por regra, para achar no meio do turno sem ler um parágrafo."
      )}</p>
      <div class="quick-grid">${all.map(([title, lines, target]) => `
        <article class="info-card"><h3>${title}</h3>${lineList(lines)}<p>${jump(target, t("Open the full rule", "Abrir a regra completa"))}</p></article>`).join("")}</div>`;
  }

  // --- Setup ---------------------------------------------------------------

  function inventory(m) {
    const roleCount = availableRoles().length;
    const dealtRoleCount = roleCount - (m.has("bio-terrorist") ? 1 : 0);
    const rows = [
      [t("Board", "Tabuleiro"), t("1 · center of the table.", "1 · no centro da mesa."), coreRefs(2)],
      [t("Research stations", "Estações de pesquisa"), t("6 total · 1 in Atlanta, the other 5 in a supply pile next to the board.", "6 no total · 1 em Atlanta e as outras 5 numa pilha de reserva ao lado do tabuleiro."), coreRefs(2, 4)],
      [t("Disease cubes", "Cubos de doença"), t(m.anyChallenge
        ? "96 standard cubes (24 blue, yellow, black and red) · 4 supply piles. Place 18 during the base infection setup; your selected challenges specify any additional cubes."
        : "96 cubes (24 blue, 24 yellow, 24 black, 24 red) · 4 supply piles next to the board. Place 18 during the initial infection setup.",
      m.anyChallenge
        ? "96 cubos padrão (24 azuis, amarelos, pretos e vermelhos) · 4 pilhas de reserva. Coloque 18 durante a preparação das infecções; os desafios selecionados especificam cubos adicionais."
        : "96 cubos (24 azuis, 24 amarelos, 24 pretos e 24 vermelhos) · 4 pilhas de reserva ao lado do tabuleiro. Coloque 18 durante a preparação inicial das infecções."), coreRefs(1, 3)],
      [t("Cure markers", "Marcadores de cura"), t(
        m.has("lab")
          ? m.has("superbug")
            ? "Use the 4 standard-colour Cure Vials instead of those cure markers; the Superbug purple cure marker is used for purple, and the Lab's purple vial stays aside."
            : `Use the ${m.purple ? 5 : 4} Cure Vials from In the Lab instead of cure markers${m.purple ? "; use the purple vial for the selected purple-disease challenge." : "; leave the purple vial aside."}`
          : `${m.purple ? 5 : 4} · “vial” side up, near the Discovered Cure Indicators.`,
        m.has("lab")
          ? m.has("superbug")
            ? "Use os 4 Frascos de Cura das cores padrão no lugar desses marcadores; use o marcador roxo de Superbug para a superbactéria e deixe de lado o frasco roxo do Laboratório."
            : `Use os ${m.purple ? 5 : 4} Frascos de Cura de In the Lab no lugar dos marcadores${m.purple ? "; use o frasco roxo para o desafio de doença roxa selecionado." : "; deixe o frasco roxo de lado."}`
          : `${m.purple ? 5 : 4} · com o lado “frasco” para cima, perto dos Indicadores de Cura Descoberta.`
      ), coreRefs(2)],
      [t("Outbreaks marker", "Marcador de surtos"), t("1 · on the “0” space of the Outbreaks Track.", "1 · no espaço “0” da Trilha de Surtos."), coreRefs(2)],
      [t("Infection rate marker", "Marcador de taxa de infecção"), t("1 · on the left-most “2” space of the Infection Rate Track.", "1 · no espaço “2” mais à esquerda da Trilha de Taxa de Infecção."), coreRefs(3)],
      [t("Infection cards", "Cartas de Infecção"), t(
        m.has("bio-terrorist")
          ? "48 · shuffle; flip 9 for the initial infections onto the Infection Discard Pile, then deal 2 Infection cards to the Bio-Terrorist. The remaining cards form the Infection Deck."
          : "48 · shuffle; flip 9 for the initial infections onto the Infection Discard Pile. The remaining cards form the Infection Deck.",
        m.has("bio-terrorist")
          ? "48 · embaralhe; vire 9 para as infecções iniciais na Pilha de Descarte de Infecção e depois distribua 2 cartas de Infecção ao Bioterrorista. As cartas restantes formam o Baralho de Infecção."
          : "48 · embaralhe; vire 9 para as infecções iniciais na Pilha de Descarte de Infecção. As cartas restantes formam o Baralho de Infecção."
      ), coreRefs(3)],
      [t("Role cards and pawns", "Cartas de Papel e peões"), t(
        m.has("bio-terrorist")
          ? `${roleCount} role cards in the match, including the separate Bio-Terrorist card · give that card and the black pawn to the chosen player (pawn starts off the board); shuffle the other ${dealtRoleCount} cards and deal 1 to each of the ${m.teamPlayers} non-Terrorist players, whose pawns start in Atlanta.`
          : `${roleCount} role cards in the pool · shuffle, deal 1 face up to each of the ${m.players} players, and put the matching pawns in Atlanta; remove the undealt cards.`,
        m.has("bio-terrorist")
          ? `${roleCount} cartas de Papel na partida, incluindo a carta separada do Bioterrorista · entregue essa carta e o peão preto ao jogador escolhido (o peão começa fora do tabuleiro); embaralhe as outras ${dealtRoleCount} cartas e distribua 1 a cada um dos ${m.teamPlayers} jogadores não terroristas, cujos peões começam em Atlanta.`
          : `${roleCount} cartas de Papel no monte · embaralhe, distribua 1 aberta para cada um dos ${m.players} jogadores e coloque os peões correspondentes em Atlanta; retire as cartas não distribuídas.`
      ), coreRefs(2)],
      [t("Reference cards", "Cartas de Referência"), t(`1 for each of the ${m.players} players. They do not count against the hand limit.`, `1 para cada um dos ${m.players} jogadores. Não contam para o limite de mão.`), coreRefs(2, 7)],
      [t("City cards", "Cartas de Cidade"), t(`48 · shuffle with ${m.eventsPerPlayer ? m.eventCount : 5} Event cards; deal ${m.handTotal} as starting hands (${m.hand} to each of ${m.teamPlayers} ${m.has("bio-terrorist") ? "non-Terrorist players" : "players"}), then build the Player Deck with the rest.`, `48 · embaralhe com ${m.eventsPerPlayer ? m.eventCount : 5} cartas de Evento; distribua ${m.handTotal} como mãos iniciais (${m.hand} para cada um dos ${m.teamPlayers} ${m.has("bio-terrorist") ? "jogadores não terroristas" : "jogadores"}), depois monte o Baralho de Jogadores com o restante.`), coreRefs(2, 3)],
      m.has("virulent-strain")
        ? [t("Epidemic cards", "Cartas de Epidemia"), t(`${m.epidemics} Virulent Strain Epidemic cards, chosen at random from ${m.hasBox("itl") ? 10 : 8} · the normal Epidemic cards are not used and go back in the box.`, `${m.epidemics} Epidemias da Cepa Virulenta, sorteadas entre ${m.hasBox("itl") ? 10 : 8} · as Epidemias normais não são usadas e voltam para a caixa.`), `${coreRefs(3)} ${ref(3, "otb")}`]
        : [t("Epidemic cards", "Cartas de Epidemia"), t(
          m.epidemics === 7
            ? "7 total for Legendary: all 6 base Epidemic cards plus the Legendary Epidemic card from On the Brink; shuffle 1 into each Player-card pile."
            : `${m.epidemics} of the 6 base Epidemic cards for ${m.levelLabel} · set aside the others, then shuffle 1 into each of the ${m.epidemics} Player-card piles.`,
          m.epidemics === 7
            ? "7 no total para Lendário: as 6 cartas de Epidemia básicas mais a carta de Epidemia Lendária de On the Brink; embaralhe 1 em cada pilha de cartas de Jogador."
            : `${m.epidemics} das 6 cartas de Epidemia do jogo base para o nível ${m.levelLabel} · separe as demais e embaralhe 1 em cada uma das ${m.epidemics} pilhas de cartas de Jogador.`
        ), m.epidemics === 7 ? `${coreRefs(3)} ${ref(2, "otb")}` : coreRefs(3)],
      [t("Event cards", "Cartas de Evento"), m.eventsPerPlayer
        ? t(`${m.eventCount} of the ${m.eventPool} available (${m.eventsPerPlayer} per player) · drawn at random, then shuffled into the Player cards before the deal. The rest go back in the box unseen.${m.has("bio-terrorist") ? " Count the Bio-Terrorist for this Event-card total; that player receives no Player cards." : ""}`, `${m.eventCount} das ${m.eventPool} disponíveis (${m.eventsPerPlayer} por jogador) · sorteadas e embaralhadas nas cartas de Jogador antes da distribuição. As demais voltam para a caixa sem serem vistas.${m.has("bio-terrorist") ? " Conte o Bioterrorista neste total de Eventos; esse jogador não recebe cartas de Jogador." : ""}`)
        : t("5 · shuffle with the City cards before dealing starting hands.", "5 · embaralhe com as cartas de Cidade antes de distribuir as mãos iniciais."),
        m.eventsPerPlayer ? eventRulesRefs(m) : coreRefs(1, 7)]
    ];
    activeChallenges().forEach((entry) => {
      if (entry.id === "virulent-strain") {
        return;
      }
      (entry.components || []).forEach((component) => {
        rows.push([
          tr(component.name),
          `${tr(component.qty)} · ${tr(component.from)} → ${tr(component.to)}`,
          ref(component.page || (entry.pages && entry.pages[0]) || 1, entry.book)
        ]);
      });
    });
    const seen = new Set();
    const unique = rows.filter(([title, text]) => {
      const key = `${title}|${text}`.toLowerCase();
      if (seen.has(key) || outOfScope(text)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    return `
      <div class="pandemic-inventory">
        <h3>${t("Components for this match", "Componentes desta partida")}</h3>
        <p>${t("Name, quantity, where it comes from and where it goes.", "Nome, quantidade, de onde vem e para onde vai.")}</p>
        <div class="pandemic-inventory-grid">${unique.map(([title, text, refHtml]) => `<div><strong>${title}</strong><span>${text}</span><span class="pandemic-refs">${refHtml}</span></div>`).join("")}</div>
      </div>`;
  }

  function item(id, title, lines) {
    return { id, title, lines: lines.filter(Boolean) };
  }

  function setupPhases() {
    const m = match();
    const roleDeckCount = availableRoles().length - (m.has("bio-terrorist") ? 1 : 0);
    const eventRefs = m.eventsPerPlayer ? eventRuleSources(m) : [["core", 2]];
    const phases = [];

    phases.push({
      title: t("Board, pieces and tracks", "Tabuleiro, peças e trilhas"),
      refs: [["core", 2]],
      items: [
        item("board", t("Set out the board and the supplies", "Monte o tabuleiro e as reservas"), [
          t("Place the board within easy reach of all players.", "Coloque o tabuleiro ao alcance de todos."),
          m.has("hinterlands")
            ? t("Place the 2 Hinterlands boards beside the main board and the 18 matching transparent disks on their connected cities, following the printed components.", "Coloque os 2 tabuleiros Hinterlands ao lado do tabuleiro principal e os 18 discos transparentes correspondentes nas cidades conectadas, seguindo as marcações dos componentes.")
            : "",
          t("Put the 6 research stations and the disease cubes next to the board.", "Ponha as 6 estações de pesquisa e os cubos de doença ao lado do tabuleiro."),
          t("Separate the cubes by colour into 4 supply piles.", "Separe os cubos por cor em 4 pilhas de reserva."),
          m.has("superbug")
            ? t("Set out 24 purple superbug cubes as a separate supply, with the vaccine doses and 4 vaccine factories beside it.", "Separe 24 cubos roxos da superbactéria em uma reserva própria, com as doses de vacina e as 4 fábricas de vacina ao lado.")
            : "",
          t("Place 1 research station in Atlanta — the home of the CDC.", "Coloque 1 estação de pesquisa em Atlanta — a sede do CDC.")
        ]),
        item("tracks", t("Place the markers on their tracks", "Coloque os marcadores nas trilhas"), [
          t("Put the outbreaks marker on the “0” space of the Outbreaks Track.", "Ponha o marcador de surtos no espaço “0” da Trilha de Surtos."),
          m.has("lab")
            ? t(
              m.has("superbug")
                ? "Substitute the 4 standard-colour Cure Vials for the base cure markers; use the Superbug purple cure marker for purple and leave the Lab's purple vial aside."
                : `Substitute the ${m.purple ? 5 : 4} Cure Vials for the cure markers.${m.purple ? " Use the purple vial for this purple-disease challenge." : " Leave the purple vial aside."}`,
              m.has("superbug")
                ? "Substitua os marcadores de cura básicos pelos 4 Frascos de Cura das cores padrão; use o marcador roxo de Superbug para a superbactéria e deixe de lado o frasco roxo do Laboratório."
                : `Substitua os marcadores de cura pelos ${m.purple ? 5 : 4} Frascos de Cura.${m.purple ? " Use o frasco roxo neste desafio de doença roxa." : " Deixe o frasco roxo de lado."}`
            )
            : t(`Put the ${m.purple ? 5 : 4} cure markers “vial” side up near the Discovered Cure Indicators.`, `Ponha os ${m.purple ? 5 : 4} marcadores de cura com o lado “frasco” para cima, perto dos Indicadores de Cura Descoberta.`),
          t("Put the infection rate marker on the left-most “2” space of the Infection Rate Track.", "Ponha o marcador de taxa de infecção no espaço “2” mais à esquerda da Trilha de Taxa de Infecção.")
        ])
      ]
    });

    phases.push({
      title: t("Infect 9 cities", "Infecte 9 cidades"),
      refs: [["core", 3]],
      items: [
        item("infect", t("Seed the board with 18 cubes", "Semeie o tabuleiro com 18 cubos"), [
          m.anyChallenge ? t("Any selected challenge that changes this initial infection is stated inline here; follow those added instructions in order.", "Todo desafio selecionado que alterar esta infecção inicial está indicado nesta etapa; siga as instruções extras na ordem.") : "",
          t("Shuffle the Infection cards.", "Embaralhe as cartas de Infecção."),
          t("Flip 3 cards and put 3 cubes of the matching colour on each of those cities.", "Vire 3 cartas e ponha 3 cubos da cor correspondente em cada uma dessas cidades."),
          m.has("superbug")
            ? t("On the 1st city drawn, replace 1 of its 3 cubes with 1 purple cube.", "Na 1ª cidade comprada, substitua 1 dos 3 cubos por 1 cubo roxo.")
            : "",
          t("Flip 3 more and put 2 cubes on each.", "Vire mais 3 e ponha 2 cubos em cada."),
          m.has("superbug")
            ? t("On the 4th city drawn, replace 1 of its 2 cubes with 1 purple cube.", "Na 4ª cidade comprada, substitua 1 dos 2 cubos por 1 cubo roxo.")
            : "",
          t("Flip 3 more and put 1 cube on each.", "Vire mais 3 e ponha 1 cubo em cada."),
          m.has("superbug")
            ? t("On the 7th city drawn, replace its cube with 1 purple cube.", "Na 7ª cidade comprada, substitua o cubo dela por 1 cubo roxo.")
            : "",
          t("Leave those 9 cards face up on the Infection Discard Pile; place the remaining Infection Deck and its discard pile beside the board.", "Deixe essas 9 cartas viradas para cima na Pilha de Descarte de Infecção; coloque o restante do Baralho de Infecção e sua pilha de descarte ao lado do tabuleiro."),
          m.has("hinterlands")
            ? t("Also place 1 cube of the matching colour in each of the 4 Hinterlands spaces.", "Coloque também 1 cubo da cor correspondente em cada um dos 4 espaços Hinterlands.")
            : "",
          m.has("bio-terrorist")
            ? t("After these 9 cities are infected, deal 2 Infection cards to the Bio-Terrorist's hand.", "Depois de infectar essas 9 cidades, distribua 2 cartas de Infecção para a mão do Bioterrorista.")
            : ""
        ].filter(Boolean))
      ]
    });

    activeChallenges().forEach((entry) => {
      const lines = scopedList(entry.setup, (probe) => entry.id === "virulent-strain"
        || (entry.id === "hinterlands" && m.has("superbug") && /place the hinterlands die on top of the infection deck/i.test(probe))
        || (entry.id === "quarantines" && /local initiative/i.test(probe))
        || /set up (the )?(game|base game|rest of the game) normally|set up everything else as in the base game|player deck|player card piles|epidemic cards|mutation event cards|emergency event cards|starting hands|deal (the )?(players|other role)|deal.*player cards|after dealing|after infecting 9 cities|after completing the infect 9 cities setup phase|during the infect 9 cities setup phase|step 3|determine the first player|first player begins|starting city|starting city field|role cards?|role only|role pool|deal.*role|medic is in play|select the bio-terrorist|choose.*bio-terrorist|give him.*bio-terrorist role|use 2 event cards per player|check your setup|add 24 purple cubes|purple cure marker and indicator|vaccine doses and the 4 vaccine factories|substitute the cure vials for the cure markers/i.test(probe)
        || (entry.id === "hinterlands" && /place the hinterlands boards|transparent disks on the cities/i.test(probe))
        || (entry.id === "superbug" && /quarantine markers/i.test(probe)));
      if (entry.id === "lab" && m.has("superbug")) {
        lines.push(t(
          "In the Superbug Lab combination, put 1 purple cube on the treat symbol beside the two sample dishes. Before a Process a Sample action, a player may add it to either dish; do not process it away.",
          "Na combinação Superbactéria + Laboratório, coloque 1 cubo roxo no símbolo de tratamento ao lado das duas placas de amostra. Antes de uma ação Processar uma Amostra, um jogador pode acrescentá-lo a qualquer uma das placas; não o processe para fora."
        ));
      }
      if (entry.id === "hinterlands" && m.has("superbug")) {
        lines.push(t(
          "Place the Hinterlands die beside the Infection Deck as a reminder so it does not cover the Superbug Infection card set on top of the deck.",
          "Coloque o dado Hinterlands ao lado do Baralho de Infecção como lembrete, para que ele não cubra a carta de Infecção de Superbactéria colocada no topo."
        ));
      }
      if (entry.id === "quarantines") {
        lines.push(t(
          "The manual says to use 6 quarantine markers if the Colonel is in play. Guide interpretation: because roles are dealt randomly, use all 6 whenever the Colonel is in the Role pool, even if no player is dealt the Colonel.",
          "O manual diz para usar 6 marcadores de quarentena se o Colonel estiver em jogo. Interpretação do guia: como os papéis são distribuídos ao acaso, use os 6 sempre que o Colonel estiver no monte de Papéis, mesmo que nenhum jogador receba o Colonel."
        ));
      }
      if (!lines.length) {
        return;
      }
      phases.push({
        title: t(`Challenge components: ${tr(entry.name)}`, `Componentes do desafio: ${tr(entry.name)}`),
        refs: (entry.pages || [1]).map((page) => [entry.book, page]),
        items: [item(`challenge-${entry.id}`, t(`Prepare ${tr(entry.name)} components`, `Prepare os componentes de ${tr(entry.name)}`), lines)]
      });
    });

    phases.push({
      title: t("Roles and starting hands", "Papéis e mãos iniciais"),
      refs: eventRefs,
      items: [
        item("roles", t("Deal the roles and place the pawns", "Distribua os papéis e coloque os peões"), [
          t("Give each player a Reference card.", "Dê uma carta de Referência a cada jogador."),
          m.has("bio-terrorist")
            ? t("Choose a Bio-Terrorist player at random or by volunteer, give them the Bio-Terrorist Role card, black pawn, folded Location sheet and pencil. Keep the black pawn off the board.", "Escolha o jogador Bioterrorista ao acaso ou por voluntariado e entregue a ele a carta de Papel do Bioterrorista, o peão preto, a folha de Localização dobrada e um lápis. Mantenha o peão preto fora do tabuleiro.")
            : "",
          m.has("quarantines")
            ? t("Include the Colonel Role card in the pool before shuffling.", "Inclua a carta de Papel do Colonel no monte antes de embaralhar.")
            : "",
          m.has("hinterlands")
            ? t("Include the Veterinarian Role card in the pool before shuffling.", "Inclua a carta de Papel do Veterinarian no monte antes de embaralhar.")
            : "",
          m.has("bio-terrorist")
            ? t(`Shuffle the other ${roleDeckCount} Role cards and deal 1 face up to each of the ${m.teamPlayers} non-Terrorist players.`, `Embaralhe as outras ${roleDeckCount} cartas de Papel e distribua 1 aberta a cada um dos ${m.teamPlayers} jogadores não terroristas.`)
            : t(`Shuffle the ${roleDeckCount} Role cards of this match and deal 1 face up in front of each of the ${m.players} players.`, `Embaralhe as ${roleDeckCount} cartas de Papel desta partida e distribua 1 virada para cima na frente de cada um dos ${m.players} jogadores.`),
          t(m.has("bio-terrorist")
            ? "Put the non-Terrorist pawns in Atlanta; the black pawn remains off the board until the Bio-Terrorist is spotted."
            : "Put the matching coloured pawns in Atlanta.",
          m.has("bio-terrorist")
            ? "Ponha os peões dos jogadores não terroristas em Atlanta; o peão preto fica fora do tabuleiro até o Bioterrorista ser avistado."
            : "Ponha os peões das cores correspondentes em Atlanta."),
          t("Remove the remaining Role cards and pawns from the game.", "Tire da partida as cartas de Papel e os peões restantes.")
        ].filter(Boolean)),
        item("hands", t("Build the Player cards and deal the starting hands", "Monte as cartas de Jogador e distribua as mãos iniciais"), [
          m.has("virulent-strain")
            ? t("Put all normal Epidemic cards back in the box; this match uses selected Virulent Strain Epidemic cards instead.", "Devolva todas as cartas de Epidemia normais à caixa; esta partida usa as cartas de Epidemia da Cepa Virulenta selecionadas.")
            : m.epidemics === 7
              ? t("Use all 6 base Epidemic cards plus the Legendary Epidemic card from On the Brink; set them aside for the Player Deck phase.", "Use todas as 6 cartas de Epidemia básicas mais a carta de Epidemia Lendária de On the Brink; separe-as para a etapa do Baralho de Jogadores.")
              : t(`Set aside ${m.epidemics} of the 6 base Epidemic cards for the Player Deck phase; put the other ${6 - m.epidemics} away.`, `Separe ${m.epidemics} das 6 cartas de Epidemia do jogo base para a etapa do Baralho de Jogadores; guarde as outras ${6 - m.epidemics}.`),
          m.eventsPerPlayer
            ? t(`Shuffle all ${m.eventPool} Event cards of this match face down and take ${m.eventCount} of them (${m.eventsPerPlayer} per player).${m.has("bio-terrorist") ? " Count the Bio-Terrorist for this Event-card total; that player receives no Player cards." : ""} Put the unused Event cards back in the box without looking at them.`, `Embaralhe viradas para baixo todas as ${m.eventPool} cartas de Evento desta partida e pegue ${m.eventCount} delas (${m.eventsPerPlayer} por jogador).${m.has("bio-terrorist") ? " Conte o Bioterrorista neste total de Eventos; esse jogador não recebe cartas de Jogador." : ""} Devolva as cartas de Evento não usadas à caixa sem olhar.`)
            : "",
          m.eventsPerPlayer
            ? t(`Shuffle the selected ${m.eventCount} Event cards with the 48 City cards; do not deal Events separately.`, `Embaralhe as ${m.eventCount} cartas de Evento selecionadas junto com as 48 cartas de Cidade; não distribua Eventos separadamente.`)
            : t("Shuffle the 48 City cards and 5 base Event cards together.", "Embaralhe juntas as 48 cartas de Cidade e as 5 cartas de Evento do jogo base."),
          t(
            m.has("bio-terrorist")
              ? `Deal ${m.hand} Player cards to each of the ${m.teamPlayers} non-Terrorist players (${m.handTotal} cards total); the Bio-Terrorist receives no Player cards.`
              : `Deal ${m.hand} Player cards to each of the ${m.players} players (${m.handTotal} cards total).`,
            m.has("bio-terrorist")
              ? `Distribua ${m.hand} cartas de Jogador a cada um dos ${m.teamPlayers} jogadores não terroristas (${m.handTotal} cartas no total); o Bioterrorista não recebe cartas de Jogador.`
              : `Distribua ${m.hand} cartas de Jogador a cada um dos ${m.players} jogadores (${m.handTotal} cartas no total).`
          )
        ].filter(Boolean))
      ]
    });

    phases.push(m.has("virulent-strain")
      ? {
        title: t("Build the Player Deck (Virulent Strain)", "Monte o Baralho de Jogadores (Cepa Virulenta)"),
        refs: [["core", 3], ["otb", 3]],
        items: [
          item("deck", t(`Shuffle in ${m.epidemics} Virulent Strain Epidemic cards`, `Embaralhe ${m.epidemics} Epidemias da Cepa Virulenta`), [
            t("This challenge replaces the normal Epidemic cards. Put every normal Epidemic card back in the box — you will not use them at all.", "Este desafio substitui as cartas de Epidemia normais. Devolva todas as Epidemias normais à caixa — elas não são usadas."),
            t(`Shuffle the ${m.hasBox("itl") ? 10 : 8} Virulent Strain Epidemic cards face down and take ${m.epidemics} of them — the same number of Epidemic cards the ${m.levelLabel} level uses. Put the rest away without looking at them.`, `Embaralhe viradas para baixo as ${m.hasBox("itl") ? 10 : 8} Epidemias da Cepa Virulenta e pegue ${m.epidemics} delas — a mesma quantidade de Epidemias que o nível ${m.levelLabel} usa. Guarde as demais sem olhar.`),
            t(`Optional manual recommendation: 4 cards for a first game, or 6 after mastering Standard. This configured match uses ${m.epidemics}; change that only if your group chooses the recommendation instead.`, `Recomendação opcional do manual: 4 cartas na primeira partida ou 6 depois de dominar o Padrão. Esta partida configurada usa ${m.epidemics}; altere esse número somente se o grupo escolher a recomendação.`),
            t(`Divide the remaining Player cards into ${m.epidemics} face-down piles, as equal in size as you can.`, `Divida as cartas de Jogador restantes em ${m.epidemics} pilhas viradas para baixo, do tamanho mais parecido possível.`),
            t("Shuffle 1 Virulent Strain Epidemic card face down into each pile.", "Embaralhe 1 Epidemia da Cepa Virulenta virada para baixo em cada pilha."),
            t("Stack the piles to form the Player Deck, with the smaller piles on the bottom.", "Empilhe as pilhas para formar o Baralho de Jogadores, com as menores por baixo."),
            t("Put the Player Deck next to the board, with room beside it for the Player Discard Pile.", "Ponha o Baralho de Jogadores ao lado do tabuleiro, com espaço ao lado para a Pilha de Descarte de Jogador.")
          ])
        ]
      }
      : {
        title: t("Build the Player Deck", "Monte o Baralho de Jogadores"),
        refs: [["core", 3]],
        items: [
          item("deck", t(`Shuffle in ${m.epidemics} Epidemic cards`, `Embaralhe ${m.epidemics} cartas de Epidemia`), [
            t(`The ${m.levelLabel} level uses ${m.epidemics} Epidemic cards. Remove any unused Epidemic cards from the game.`, `O nível ${m.levelLabel} usa ${m.epidemics} cartas de Epidemia. Tire da partida as Epidemias não usadas.`),
            t(`Divide the remaining Player cards into ${m.epidemics} face-down piles, as equal in size as you can.`, `Divida as cartas de Jogador restantes em ${m.epidemics} pilhas viradas para baixo, do tamanho mais parecido possível.`),
            t("Shuffle 1 Epidemic card face down into each pile.", "Embaralhe 1 carta de Epidemia virada para baixo em cada pilha."),
            t("Stack the piles to form the Player Deck, with the smaller piles on the bottom.", "Empilhe as pilhas para formar o Baralho de Jogadores, com as menores por baixo."),
            t("Put the Player Deck next to the board, with room beside it for the Player Discard Pile.", "Ponha o Baralho de Jogadores ao lado do tabuleiro, com espaço ao lado para a Pilha de Descarte de Jogador.")
          ])
        ]
      });

    const deckLines = phases[phases.length - 1].items[0].lines;
    if (m.has("mutation")) {
      const mutationEvents = t(
        "After the starting hands are dealt, shuffle the 3 Mutation Event cards with the remaining Player cards, before dividing the piles.",
        "Depois de distribuir as mãos iniciais, embaralhe as 3 cartas de Evento de Mutação com as cartas de Jogador restantes, antes de dividir os montes."
      );
      const divideIndex = deckLines.findIndex((line) => /Divide the remaining Player cards|Divida as cartas de Jogador restantes/.test(line));
      deckLines.splice(divideIndex < 0 ? deckLines.length : divideIndex, 0, mutationEvents);
    }
    if (m.has("superbug")) {
      const bonusSelection = t(
        `Shuffle the 8 Superbug Bonus cards face down and take ${m.epidemics}, one for each Epidemic card; put unused Bonus cards away without looking at them.`,
        `Embaralhe viradas para baixo as 8 cartas de Bônus de Superbug e pegue ${m.epidemics}, uma para cada carta de Epidemia; guarde as não usadas sem olhar.`
      );
      const divideIndex = deckLines.findIndex((line) => /Divide the remaining Player cards|Divida as cartas de Jogador restantes/.test(line));
      deckLines.splice(divideIndex < 0 ? deckLines.length : divideIndex, 0, bonusSelection);
    }
    if (m.has("emergency-events")) {
      const emergencySelection = t(
        `Shuffle all 10 Emergency Event cards face down, take ${m.epidemics}, and put the unused cards away without looking at them.`,
        `Embaralhe viradas para baixo as 10 cartas de Evento de Emergência, pegue ${m.epidemics} e guarde as não usadas sem olhar.`
      );
      const divideIndex = deckLines.findIndex((line) => /Divide the remaining Player cards|Divida as cartas de Jogador restantes/.test(line));
      deckLines.splice(divideIndex < 0 ? deckLines.length : divideIndex, 0, emergencySelection);
      const emergencyEvents = t(
        `Shuffle 1 of the ${m.epidemics} selected Emergency Event cards into each Player-card pile alongside its Epidemic card.`,
        `Embaralhe 1 das ${m.epidemics} cartas de Evento de Emergência selecionadas em cada pilha de cartas de Jogador junto com sua carta de Epidemia.`
      );
      const stackIndex = deckLines.findIndex((line) => /Stack the piles|Empilhe os montes/.test(line));
      deckLines.splice(stackIndex < 0 ? deckLines.length : stackIndex, 0, emergencyEvents);
    }
    if (m.has("superbug")) {
      const bonusCards = t(
        `Shuffle 1 selected Superbug Bonus card into each of the ${m.epidemics} Player-card piles alongside its Epidemic card.`,
        `Embaralhe 1 carta de Bônus de Superbug selecionada em cada uma das ${m.epidemics} pilhas de cartas de Jogador junto com sua carta de Epidemia.`
      );
      const stackIndex = deckLines.findIndex((line) => /Stack the piles|Empilhe os montes/.test(line));
      deckLines.splice(stackIndex < 0 ? deckLines.length : stackIndex, 0, bonusCards);
    }

    phases.push({
      title: t("Begin play", "Comece a jogar"),
      refs: [["core", 3]],
      items: [
        item("first-player", t("Choose the first player and begin", "Escolha quem começa e inicie"), [
          m.has("bio-terrorist")
            ? t("The non-Terrorist players compare the populations on their City cards; the player with the highest population goes first. The Bio-Terrorist has no City cards and is not part of this choice.", "Os jogadores não terroristas comparam as populações das cartas de Cidade; quem tiver a maior população começa. O Bioterrorista não tem cartas de Cidade e não participa desta escolha.")
            : t("Everyone looks at the City cards in their hand. The player holding the city with the highest population goes first.", "Todos olham as cartas de Cidade da sua mão. Começa quem tiver a cidade de maior população."),
          t("The population is printed on each City card.", "A população está impressa em cada carta de Cidade."),
          m.has("bio-terrorist")
            ? t("The Bio-Terrorist secretly writes the starting city in the STARTING CITY field of the folded Location sheet; do not place the black pawn yet.", "O Bioterrorista anota em segredo a cidade inicial no campo STARTING CITY da folha de Localização dobrada; ainda não coloque o peão preto.")
            : "",
          t(
            m.has("bio-terrorist")
              ? "The first player begins; turns continue to the left. The Bio-Terrorist takes a turn after each non-Terrorist player's turn."
              : "The first player begins; turns continue to the left.",
            m.has("bio-terrorist")
              ? "O primeiro jogador começa; os turnos seguem para a esquerda. O Bioterrorista joga depois do turno de cada jogador não terrorista."
              : "O primeiro jogador começa; os turnos seguem para a esquerda."
          )
        ])
      ]
    });
    return phases;
  }

  function setupSection(index) {
    const m = match();
    const phases = setupPhases();
    const allItems = phases.flatMap((phase) => phase.items);
    const validIds = new Set(allItems.map((entry) => entry.id));
    const normalized = setupChecks.filter((id) => validIds.has(id));
    if (normalized.length !== setupChecks.length) {
      setupChecks = normalized;
      saveChecks();
    }
    const checkedCount = allItems.filter((entry) => setupChecks.includes(entry.id)).length;
    const phaseMarkup = phases.map((phase, phaseIndex) => `
      <section class="setup-phase">
        <div class="setup-phase-header">
          <span class="setup-phase-number">${String(phaseIndex + 1).padStart(2, "0")}</span>
          <h3>${phase.title}</h3>
          <div class="setup-phase-references">${phase.refs.map(([book, page]) => ref(page, book)).join("")}</div>
        </div>
        <div class="setup-check-list">
          ${phase.items.map((entry) => `
            <label class="setup-check">
              <input type="checkbox" data-setup-check="${escapeHtml(entry.id)}" ${setupChecks.includes(entry.id) ? "checked" : ""}>
              <span>
                <strong>${entry.title}</strong>
                <small class="setup-substeps" role="list">${entry.lines.map((line) => `<span role="listitem">${line}</span>`).join("")}</small>
              </span>
            </label>`).join("")}
        </div>
      </section>`).join("");
    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), index, coreRefs(2, 3))}
      <p class="section-lead">${t(
        `Everything below is tailored to ${m.players} players, the ${m.levelLabel} level and the boxes in this match. Only components for selected challenges are listed.`,
        `Tudo abaixo está ajustado para ${m.players} jogadores, o nível ${m.levelLabel} e as caixas desta partida. Só aparecem componentes dos desafios selecionados.`
      )}</p>
      ${inventory(m)}
      ${m.anyChallenge ? note(t(
        "Follow the challenge-component stages immediately after the initial infection setup; apply their instructions before dealing roles and building the Player Deck.",
        "Siga as etapas de componentes dos desafios logo após a preparação inicial das infecções; aplique essas instruções antes de distribuir os papéis e montar o Baralho de Jogadores."
      )) : ""}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div><h3>${t("Set up the table in order", "Prepare a mesa em ordem")}</h3><p>${t("Each checkbox marks one coherent setup stage; complete all its substeps before checking it.", "Cada caixa marca uma etapa coerente; complete todas as subetapas antes de marcá-la.")}</p></div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${checkedCount} of ${allItems.length} setup checklist items checked`, `${checkedCount} de ${allItems.length} itens da checklist de preparação concluídos`)}</span>
            <progress id="setup-progress" max="${Math.max(allItems.length, 1)}" value="${checkedCount}" aria-label="${t("Setup checklist progress", "Progresso da checklist")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t("Changing a match choice above clears this checklist. Changing language does not. “Uncheck all” clears only the checkboxes.", "Alterar uma escolha da partida acima limpa esta checklist. Trocar o idioma não limpa. “Desmarcar tudo” limpa somente as caixas.")}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>`;
  }

  // --- Turn ----------------------------------------------------------------

  function turnSection(index) {
    const m = match();
    const order = steps([
      t("<strong>Do up to 4 actions.</strong> You may stop early.", "<strong>Faça até 4 ações.</strong> Você pode parar antes."),
      t("<strong>Draw 2 Player cards</strong> into your hand. Resolve any Epidemics and cards that say to play immediately; hold Event cards for later, then discard to your hand limit.", "<strong>Compre 2 cartas de Jogador</strong> para a sua mão. Resolva Epidemias e cartas que mandem jogar imediatamente; guarde as cartas de Evento para depois e descarte até o limite de mão."),
      m.has("emergency-events")
        ? t("<strong>Before Infecting:</strong> resolve a face-up Patient Zero effect, if one is in play.", "<strong>Antes de Infectar:</strong> resolva o efeito de Patient Zero virado para cima, se estiver em jogo.")
        : "",
      m.has("hinterlands")
        ? t("<strong>Before drawing Infection cards:</strong> roll the Hinterlands die; skip it if One Quiet Night skips Infections, and roll twice after Logistics Failure.", "<strong>Antes de comprar cartas de Infecção:</strong> role o dado Hinterlands; pule-o se Uma Noite Tranquila pular as Infecções e role duas vezes após Logistics Failure.")
        : "",
      t("<strong>Infect cities.</strong>", "<strong>Infecte cidades.</strong>")
    ].filter(Boolean));
    const movement = list([
      t("<strong>Drive / Ferry</strong> — move to a city connected by a white line to the one you are in. A white line that runs off the board wraps around to the other edge: Sydney and Los Angeles are connected.", "<strong>Dirigir / Navegar (Drive / Ferry)</strong> — mova-se para uma cidade ligada por uma linha branca à cidade em que está. Uma linha branca que sai do tabuleiro dá a volta pela outra borda: Sydney e Los Angeles são ligadas."),
      t("<strong>Direct Flight</strong> — discard a City card to move to the city named on that card.", "<strong>Voo Direto (Direct Flight)</strong> — descarte uma carta de Cidade para ir até a cidade escrita nela."),
      t("<strong>Charter Flight</strong> — discard the City card that <em>matches the city you are in</em> to move to <em>any</em> city.", "<strong>Voo Fretado (Charter Flight)</strong> — descarte a carta de Cidade que <em>corresponde à cidade em que está</em> para ir a <em>qualquer</em> cidade."),
      t("<strong>Shuttle Flight</strong> — move from a city with a research station to any other city that has a research station.", "<strong>Voo de Traslado (Shuttle Flight)</strong> — vá de uma cidade com estação de pesquisa até qualquer outra cidade que tenha estação de pesquisa.")
    ]);
    const other = list([
      t(
        m.has("lab")
          ? "<strong>Build a Research Station</strong> — discard the City card matching your city and place a station there; then do 1 lab action as a free bonus action."
          : "<strong>Build a Research Station</strong> — discard the City card matching your city and place a station there.",
        m.has("lab")
          ? "<strong>Construir Estação de Pesquisa</strong> — descarte a carta de Cidade correspondente à sua cidade e coloque uma estação ali; depois faça 1 ação de laboratório como ação bônus grátis."
          : "<strong>Construir Estação de Pesquisa</strong> — descarte a carta de Cidade correspondente à sua cidade e coloque uma estação ali."
      ),
      m.has("superbug")
        ? t(
          `<strong>Treat Disease</strong> — remove cubes of any disease except the purple superbug; cured colours remove all cubes of that colour from your city.${m.has("lab") ? " You may put 1 removed cube in a sample dish." : ""}`,
          `<strong>Tratar Doença</strong> — remova cubos de qualquer doença, exceto da superbactéria roxa; cores curadas removem todos os cubos daquela cor da sua cidade.${m.has("lab") ? " Você pode colocar 1 cubo removido numa placa de amostra." : ""}`
        )
        : t(
          `<strong>Treat Disease</strong> — remove 1 disease cube from your city to the supply. If that colour is cured, remove <em>all</em> cubes of that colour from your city instead. With several cured colours present, you need one action per colour.${m.has("lab") ? " You may put 1 removed cube in a sample dish." : ""}`,
          `<strong>Tratar Doença</strong> — devolva 1 cubo de doença da sua cidade para a reserva. Se aquela cor estiver curada, remova <em>todos</em> os cubos daquela cor da sua cidade. Com várias cores curadas presentes, é preciso uma ação por cor.${m.has("lab") ? " Você pode colocar 1 cubo removido numa placa de amostra." : ""}`
        ),
      t(`<strong>Share Knowledge</strong> — give the City card matching your city to another player in that same city, or take that card from them. Both of you must agree. If the receiver exceeds their hand limit (${handLimitLine(m)}), they immediately discard or play an Event.`, `<strong>Compartilhar Conhecimento</strong> — dê a carta de Cidade da cidade em que está a outro jogador que esteja nela, ou pegue essa carta dele. Os dois precisam concordar. Se quem recebe exceder o limite (${handLimitLine(m)}), descarta ou joga um Evento imediatamente.`),
      t(
        m.purple
          ? `<strong>Discover a Cure</strong> — ${cureLine()} for a standard disease; ${purpleCureLine(m)}`
          : `<strong>Discover a Cure</strong> — ${cureLine()} to cure that disease. Role abilities can change the card count; see Roles.`,
        m.purple
          ? `<strong>Descobrir a Cura</strong> — ${cureLine()} para uma doença padrão; ${purpleCureLine(m)}`
          : `<strong>Descobrir a Cura</strong> — ${cureLine()} para curar aquela doença. Habilidades de Papel podem mudar a quantidade de cartas; veja Papéis.`
      ),
      m.has("superbug")
        ? t("Superbug actions (each costs 1 action): Impose Quarantine; Build a Vaccine Factory after the purple cure by replacing a research station (each new factory starts with 1 dose; 4 maximum); Collect Vaccine at a factory; Distribute Vaccine by returning 1 dose to remove all purple cubes from your city.", "Ações de Superbug (cada uma custa 1 ação): Impor Quarentena; Construir Fábrica de Vacina após a cura roxa, substituindo uma estação de pesquisa (cada fábrica nova começa com 1 dose; máximo de 4); Coletar Vacina em uma fábrica; Distribuir Vacina devolvendo 1 dose para remover todos os cubos roxos da sua cidade.")
        : ""
    ].filter(Boolean));
    return `
      ${sectionHeading("turn", t("Your turn", "Seu turno"), index, coreRefs(3, 4, 6, 7))}
      <p class="section-lead">${t("Three parts, always in this order.", "Três partes, sempre nesta ordem.")}</p>
      ${block(t("Turn order", "Ordem do turno"), order, coreRefs(3))}
      ${m.has("hinterlands") && m.has("emergency-events") ? note(t(
        "The manuals place both Patient Zero and the Hinterlands die before Infection cards but do not order them relative to each other; agree on an order before play.",
        "Os manuais colocam Patient Zero e o dado Hinterlands antes das cartas de Infecção, mas não ordenam um em relação ao outro; combinem uma ordem antes de jogar."
      )) : ""}
      <h3 class="subhead" id="actions">${t("1 · Do up to 4 actions", "1 · Faça até 4 ações")}</h3>
      <p>${t(
        "You may do up to 4 actions, in any combination, repeating the same action as often as you like; you may stop early. Each action costs 1 unless a rule says otherwise. Cards discarded for actions go to the Player Discard Pile. Your role may change an action.",
        "Você pode fazer até 4 ações, em qualquer combinação, repetindo a mesma ação quantas vezes quiser; pode parar antes. Cada ação custa 1, a menos que uma regra diga o contrário. Cartas descartadas por ações vão para a Pilha de Descarte de Jogadores. Seu papel pode alterar uma ação."
      )}</p>
      ${block(t("Movement actions", "Ações de movimento"), movement, coreRefs(4))}
      ${block(t("Other actions", "Outras ações"), other, coreRefs(4))}
      <h3 class="subhead" id="draw">${t("2 · Draw 2 Player cards", "2 · Compre 2 cartas de Jogador")}</h3>
      <p>${t("After up to 4 actions, draw the top 2 cards of the Player Deck together into your hand.", "Depois de até 4 ações, compre juntas as 2 cartas do topo do Baralho de Jogadores para a sua mão.")}</p>
      ${note(t(
        "If fewer than 2 cards remain when you are about to draw, the game ends and the team has lost. Do not reshuffle the discards into a new deck.",
        "Se restarem menos de 2 cartas no momento da compra, a partida acaba e a equipe perde. Não embaralhe os descartes para formar um novo baralho."
      ))}
      ${block(t("Epidemic cards", "Cartas de Epidemia"), steps([
        t("<strong>Increase</strong> — move the infection rate marker forward 1 space on the Infection Rate Track.", "<strong>Aumentar</strong> — avance o marcador de taxa de infecção 1 espaço na Trilha de Taxa de Infecção."),
        t("<strong>Infect</strong> — draw the <em>bottom</em> card of the Infection Deck. Unless its colour is eradicated, put 3 cubes of that colour on the named city. If the city already has cubes of that colour, top it up to 3 and then an outbreak happens there. Discard the card.", "<strong>Infectar</strong> — compre a carta de <em>baixo</em> do Baralho de Infecção. A menos que a cor esteja erradicada, ponha 3 cubos daquela cor na cidade indicada. Se a cidade já tiver cubos daquela cor, complete até 3 e então ocorre um surto ali. Descarte a carta."),
        t("<strong>Intensify</strong> — reshuffle <em>only</em> the Infection Discard Pile and place it on <em>top</em> of the Infection Deck.", "<strong>Intensificar</strong> — embaralhe <em>somente</em> a Pilha de Descarte de Infecção e coloque-a <em>sobre</em> o Baralho de Infecção.")
      ]) + list([
        t("<strong>Two Epidemics at once</strong> — rare but possible: do all three steps once, then do them again. Events may be played between the two.", "<strong>Duas Epidemias de uma vez</strong> — raro, mas possível: faça os três passos uma vez e depois de novo. Eventos podem ser jogados entre elas."),
        t(m.has("virulent-strain")
          ? "<strong>After resolving</strong> — remove a base Epidemic from the game; keep a continuing Virulent Strain card face up and flip an immediate one face down. You do <em>not</em> draw a replacement."
          : "<strong>After resolving</strong> — remove the Epidemic card from the game. You do <em>not</em> draw a replacement.",
        m.has("virulent-strain")
          ? "<strong>Depois de resolver</strong> — tire uma Epidemia básica da partida; mantenha uma carta contínua da Cepa Virulenta virada para cima e vire uma imediata para baixo. Você <em>não</em> compra uma carta no lugar."
          : "<strong>Depois de resolver</strong> — tire a carta de Epidemia da partida. Você <em>não</em> compra uma carta no lugar.")
      ]), coreRefs(6))}
      ${note(t(
        "If a required cube cannot be placed because the supply of that colour is empty, the game ends and the team has lost. This can happen during an epidemic, an outbreak or infections.",
        "Se um cubo obrigatório não puder ser colocado porque a reserva daquela cor acabou, a partida acaba e a equipe perde. Isso pode acontecer numa epidemia, num surto ou nas infecções."
      ))}
      ${block(t("Hand limit", "Limite de mão"), para(t(
        `If you exceed your hand limit (${handLimitLine(m)}) after resolving any Epidemic, discard Player cards or play Events until you are within it. Role and Reference cards do not count.`,
        `Se exceder o limite de mão (${handLimitLine(m)}) depois de resolver qualquer Epidemia, descarte cartas de Jogador ou jogue Eventos até ficar dentro dele. Cartas de Papel e de Referência não contam.`
      )), coreRefs(6, 7))}
      <h3 class="subhead" id="infections">${t("3 · Infect cities", "3 · Infecte cidades")}</h3>
      ${block(t("Flipping Infection cards", "Virando cartas de Infecção"), list([
        t(`<strong>How many</strong> — as many as the current infection rate, read under the marker on the Infection Rate Track (${INFECTION_RATE_TRACK.join(" · ")}).`, `<strong>Quantas</strong> — tantas quanto a taxa de infecção atual, lida sob o marcador na Trilha de Taxa de Infecção (${INFECTION_RATE_TRACK.join(" · ")}).`),
        t("<strong>One at a time</strong> — flip a card, infect that city, discard it, then flip the next.", "<strong>Uma de cada vez</strong> — vire uma carta, infecte aquela cidade, descarte-a e só então vire a próxima."),
        t(m.has("superbug")
          ? "<strong>Infecting</strong> — resolve the Infection card normally; if its city has purple cubes, also add 1 purple cube or resolve a purple outbreak as the Superbug rules specify."
          : m.has("bio-terrorist") || m.has("mutation")
            ? "<strong>Infecting</strong> — place 1 cube of the Infection card's colour; if the city already has purple cubes, also place 1 purple cube if purple is not eradicated."
          : "<strong>Infecting</strong> — place 1 cube of the Infection card's colour unless that disease is eradicated; cities may hold different colours.",
        m.has("superbug")
          ? "<strong>Infectar</strong> — resolva a carta de Infecção normalmente; se a cidade tiver cubos roxos, acrescente 1 cubo roxo ou resolva um surto roxo conforme as regras de Superbug."
          : m.has("bio-terrorist") || m.has("mutation")
            ? "<strong>Infectar</strong> — coloque 1 cubo da cor da carta de Infecção; se a cidade já tiver cubos roxos, coloque também 1 cubo roxo se o roxo não estiver erradicado."
          : "<strong>Infectar</strong> — coloque 1 cubo da cor da carta de Infecção, a menos que a doença esteja erradicada; cidades podem ter cores diferentes."),
        t("<strong>Already at 3</strong> — do not place a 4th cube; an outbreak of that colour happens in the city instead.", "<strong>Já com 3</strong> — não coloque um 4º cubo; em vez disso ocorre um surto daquela cor na cidade.")
      ]), coreRefs(6))}
      ${block(t("Outbreaks", "Surtos"), list([
        t("<strong>Move the marker</strong> — advance the outbreaks marker 1 space on the Outbreaks Track.", "<strong>Mova o marcador</strong> — avance o marcador de surtos 1 espaço na Trilha de Surtos."),
        t("<strong>Spread</strong> — place 1 cube of that colour on every city connected to the outbreaking city.", "<strong>Espalhe</strong> — ponha 1 cubo daquela cor em cada cidade ligada à cidade do surto."),
        t("<strong>Chain reaction</strong> — any connected city already holding 3 cubes of that colour does not get a 4th; it outbreaks itself once the current outbreak is finished. Move the marker again, then spread again.", "<strong>Reação em cadeia</strong> — uma cidade ligada que já tenha 3 cubos daquela cor não recebe o 4º; ela própria entra em surto quando o surto atual terminar. Avance o marcador de novo e espalhe de novo."),
        m.has("hinterlands")
          ? t("<strong>Hinterlands outbreaks</strong> — advance the same outbreaks marker for each outbreak there; check the Hinterlands rules for the cities that receive cubes.", "<strong>Surtos nos Hinterlands</strong> — avance o mesmo marcador de surtos a cada surto ali; consulte as regras dos Hinterlands para as cidades que recebem cubos.")
          : "",
        t("<strong>Never twice</strong> — while resolving one Infection card, do not add a cube to a city that has already outbroken.", "<strong>Nunca duas vezes</strong> — ao resolver uma carta de Infecção, não acrescente cubo a uma cidade que já tenha entrado em surto."),
        t("<strong>Mixed cities</strong> — outbreaks can leave a city with cubes of several colours, up to 3 of each.", "<strong>Cidades mistas</strong> — surtos podem deixar uma cidade com cubos de várias cores, até 3 de cada.")
      ]), coreRefs(7))}
      ${note(t(
        "If the outbreaks marker reaches the last space of the Outbreaks Track, the game ends and the team has lost.",
        "Se o marcador de surtos chegar ao último espaço da Trilha de Surtos, a partida acaba e a equipe perde."
      ))}
      ${m.has("superbug") ? note(t(
        "After each player's turn, once the purple disease is cured, each vaccine factory produces 1 dose.",
        "Depois do turno de cada jogador, quando a doença roxa estiver curada, cada Fábrica de Vacina produz 1 dose."
      ), ref(6, "soe")) : ""}
      <p>${t("After infecting cities and discarding those Infection cards, your turn is over and the player on your left begins.", "Depois de infectar as cidades e descartar aquelas cartas de Infecção, seu turno acaba e começa o do jogador à sua esquerda.")} ${coreRefs(7)}</p>
      ${m.has("bio-terrorist") ? note(t(
        "After each non-Terrorist player's turn, the Bio-Terrorist takes a turn before the next non-Terrorist player.",
        "Depois do turno de cada jogador não terrorista, o Bioterrorista joga antes do próximo jogador não terrorista."
      ), ref(5, "otb")) : ""}`;
  }

  function curesSection(index) {
    const m = match();
    return `
      ${sectionHeading("cures", t("Cures, eradication, winning and losing", "Curas, erradicação, vitória e derrota"), index, coreRefs(4, 7))}
      <div class="info-grid">
        ${card(t("Discover a cure", "Descobrir a cura"), para(t(
          m.purple
            ? `As an action, ${cureLine()} for a standard disease; for purple, ${purpleCureLine(m)} The station's city colour does not matter.`
            : `As an action, ${cureLine()} and move that disease's cure marker onto its Cure Indicator. The colour of the station's own city does not matter. Role abilities may change the card count; see Roles.`,
          m.purple
            ? `Como ação, ${cureLine()} para uma doença padrão; para o roxo, ${purpleCureLine(m)} A cor da cidade da estação não importa.`
            : `Como ação, ${cureLine()} e mova o marcador de cura daquela doença para o Indicador de Cura dela. A cor da cidade da estação não importa. Habilidades de Papel podem mudar a quantidade de cartas; veja Papéis.`
        )), coreRefs(4, 8))}
        ${card(t("What a cure changes", "O que a cura muda"), lineList([
          t(m.has("superbug")
            ? "<strong>Treating</strong> — cured standard colours remove all matching cubes from your city; purple superbug cubes cannot be removed by Treat Disease."
            : "<strong>Treating</strong> — one Treat Disease action now removes every cube of that colour from your city.",
          m.has("superbug")
            ? "<strong>Tratar</strong> — cores padrão curadas removem todos os cubos correspondentes da sua cidade; cubos roxos da superbactéria não podem ser removidos por Tratar Doença."
            : "<strong>Tratar</strong> — uma ação de Tratar Doença passa a remover todos os cubos daquela cor da sua cidade."),
          t("<strong>Not immunity</strong> — cubes stay on the board and new ones are still placed by epidemics and infections.", "<strong>Não é imunidade</strong> — os cubos continuam no tabuleiro e novos ainda são colocados por epidemias e infecções.")
        ]), coreRefs(4))}
        ${card(t("Eradication", "Erradicação"), lineList([
          t(m.has("hinterlands")
            ? "<strong>Trigger</strong> — remove every cube of the cured colour from both the main board and Hinterlands board."
            : "<strong>Trigger</strong> — the last cube of a <em>cured</em> disease leaves the board, whether by treating it or by curing it when no cubes are out.",
          m.has("hinterlands")
            ? "<strong>Gatilho</strong> — remova todos os cubos da cor curada tanto do tabuleiro principal quanto do tabuleiro Hinterlands."
            : "<strong>Gatilho</strong> — o último cubo de uma doença <em>curada</em> sai do tabuleiro, seja ao tratá-la, seja ao curá-la quando não há cubos em jogo."),
          t("<strong>Mark it</strong> — flip that cure marker from its “vial” side to its “⊘” side.", "<strong>Marque</strong> — vire o marcador de cura do lado do “frasco” para o lado “⊘”."),
          t("<strong>Effect</strong> — no new cubes of an eradicated colour are placed; simply discard those Infection cards.", "<strong>Efeito</strong> — nenhum cubo de uma cor erradicada volta a ser colocado; apenas descarte aquelas cartas de Infecção."),
          t(m.has("superbug")
            ? "<strong>Required to win</strong> — the Superbug challenge requires purple to be eradicated. Removing the last cube of a disease that is not cured does nothing."
            : m.has("bio-terrorist")
              ? "<strong>Bio-Terrorist</strong> — if the players eradicate purple, the Bio-Terrorist loses and leaves the game; see the challenge rules for what continues."
              : "<strong>Usually optional</strong> — eradication is not needed to win. Removing the last cube of a disease that is not cured does nothing.",
          m.has("superbug")
            ? "<strong>Necessária para vencer</strong> — o desafio Superbug exige que a doença roxa seja erradicada. Remover o último cubo de uma doença não curada não tem efeito."
            : m.has("bio-terrorist")
              ? "<strong>Bioterrorista</strong> — se os jogadores erradicarem o roxo, o Bioterrorista perde e sai da partida; veja as regras do desafio para saber o que continua."
              : "<strong>Geralmente opcional</strong> — erradicar não é necessário para vencer. Remover o último cubo de uma doença não curada não tem efeito.")
        ]), coreRefs(4))}
      </div>
      <h3 class="subhead" id="winning">${t("Winning and losing", "Vitória e derrota")}</h3>
      <div class="info-grid">
        ${card(t("You win", "Vocês vencem"), para(`${winLine()} ${t(
          "The game ends immediately when that happens.",
          "A partida acaba na hora em que isso acontece."
        )}`), coreRefs(7))}
        ${card(t("You lose", "Vocês perdem"), lineList([
          t("<strong>Outbreaks</strong> — the outbreaks marker reaches the last space of the Outbreaks Track.", "<strong>Surtos</strong> — o marcador de surtos chega ao último espaço da Trilha de Surtos."),
          t("<strong>Cubes</strong> — a required cube cannot be placed because that colour's supply is empty.", "<strong>Cubos</strong> — um cubo obrigatório não pode ser colocado porque a reserva daquela cor acabou."),
          t("<strong>Cards</strong> — a player cannot draw 2 Player cards after doing their actions.", "<strong>Cartas</strong> — um jogador não consegue comprar 2 cartas de Jogador depois das ações.")
        ]), coreRefs(7))}
        ${m.anyChallenge ? card(t("Changed by your challenges", "Alterado pelos seus desafios"), lineList(
          activeChallenges().flatMap((entry) => scopedWinLose(entry).map((line) => `<strong>${tr(entry.name)}</strong> — ${line}`))
        ) || para(t("None of your challenges changes how the game ends.", "Nenhum dos seus desafios muda como a partida termina."))) : ""}
      </div>`;
  }

  // --- Roles, Events and challenges ----------------------------------------

  function availableRoles() {
    const m = match();
    const usable = ROLES.filter((role) => {
      if (!m.hasBox(role.book)) {
        return false;
      }
      if (role.requires && !m.has(role.requires)) {
        return false;
      }
      if (Array.isArray(role.excludedBy) && role.excludedBy.some((id) => m.has(id))) {
        return false;
      }
      return true;
    });
    const replaced = new Set(usable.map((role) => role.replaces).filter(Boolean));
    return usable.filter((role) => !replaced.has(role.id));
  }

  function rolesSection(index) {
    const roles = availableRoles();
    if (!roles.length) {
      return "";
    }
    const m = match();
    const replacedIds = new Set(roles.map((role) => role.replaces).filter(Boolean));
    const activeRoleCards = ROLES.filter((role) => m.hasBox(role.book)
      && (!role.requires || m.has(role.requires)));
    const excludedIds = new Set(activeRoleCards
      .filter((role) => Array.isArray(role.excludedBy) && role.excludedBy.some((id) => m.has(id)))
      .map((role) => role.id));
    const removedRoles = activeRoleCards.filter((role) => replacedIds.has(role.id) || excludedIds.has(role.id));
    const countByBook = ["core", "otb", "itl", "soe"].map((book) => [
      book,
      activeRoleCards.filter((role) => role.book === book).length
    ]).filter(([, count]) => count > 0);
    const countEquation = `${countByBook.map(([book, count]) => `${bookName(book)} (${count})`).join(" + ")} − ${removedRoles.length} replaced/excluded = ${roles.length}`;
    const countNote = note(t(
      `Role-pool math: ${countEquation}.`,
      `Cálculo do monte de Papéis: ${countEquation}.`
    ));
    const poolNote = removedRoles.length
      ? note(t(
          `Before shuffling, remove these physical Role cards from the pool: ${removedRoles.map((role) => tr(role.name)).join(", ")}. Their replacement or exclusion applies in this match.`,
          `Antes de embaralhar, retire estas cartas físicas de Papel do monte: ${removedRoles.map((role) => tr(role.name)).join(", ")}. A substituição ou exclusão delas vale nesta partida.`
        ))
      : "";
    return `
      ${sectionHeading("roles", t("Roles", "Papéis"), index, coreRefs(8))}
      <p class="section-lead">${t(
        m.has("bio-terrorist")
          ? `${roles.length} Role cards are used, including the Bio-Terrorist card. Give that card to the chosen player; shuffle the other ${roles.length - 1} and deal 1 to each of the ${m.teamPlayers} non-Terrorist players. Each role bends one rule in your favour.`
          : `${roles.length} Role cards are in the pool; shuffle and deal 1 to each of the ${m.players} players, then remove the undealt cards. Each role bends one rule in your favour.`,
        m.has("bio-terrorist")
          ? `São usadas ${roles.length} cartas de Papel, incluindo a carta do Bioterrorista. Entregue essa carta ao jogador escolhido; embaralhe as outras ${roles.length - 1} e distribua 1 a cada um dos ${m.teamPlayers} jogadores não terroristas. Cada papel altera uma regra a favor de vocês.`
          : `${roles.length} cartas de Papel estão no monte; embaralhe e distribua 1 a cada um dos ${m.players} jogadores, depois retire as cartas não distribuídas. Cada papel altera uma regra a favor de vocês.`
      )}</p>
      ${countNote}
      ${poolNote}
      <div class="info-grid">${roles.map((role) => card(
        `${tr(role.name)} <small class="pandemic-role-color">${tr(role.color)}</small>`,
        lineList(scopedList(role.card).length ? scopedList(role.card) : trList(role.card)) +
          (role.limit ? note(tr(role.limit)) : "") +
          (scopedList(role.notes).length ? list(scopedList(role.notes)) : ""),
        ref(role.page, role.book)
      )).join("")}</div>`;
  }

  function eventAvailable(entry, m) {
    if (!m.hasBox(entry.book)) {
      return false;
    }
    return !(entry.requires && !m.has(entry.requires));
  }

  function availableEvents(deck) {
    const m = match();
    return EVENTS.filter((entry) => (entry.deck || "player") === deck && eventAvailable(entry, m));
  }

  function eventCard(entry) {
    const body = entry.textOnCard || !entry.text
      ? cardOnly(t(
          "Read the effect printed on the physical card.",
          "Leia o efeito impresso na carta física."
        ))
      : para(tr(entry.text));
    const extras = scopedList(entry.notes);
    return card(
      tr(entry.name),
      body + (extras.length ? list(extras) : ""),
      ref(entry.page, entry.book)
    );
  }

  function eventsSection(index) {
    const m = match();
    const player = availableEvents("player");
    const emergency = availableEvents("emergency-event");
    if (!player.length && !emergency.length) {
      return "";
    }
    return `
      ${sectionHeading("events", t("Event cards", "Cartas de Evento"), index, coreRefs(7))}
      <p class="section-lead">${t(
        "Any player may play an Event card at any time, except between drawing a card and resolving it. Playing one is not an action, and the player who plays it decides how it is used. Discard it afterwards.",
        "Qualquer jogador pode jogar uma carta de Evento a qualquer momento, exceto entre comprar uma carta e resolvê-la. Jogar uma não é uma ação, e quem a joga decide como ela é usada. Descarte-a depois."
      )}</p>
      ${note(t(
        m.eventsPerPlayer
          ? `In this match ${m.eventCount} of the ${m.eventPool} Event cards below (${m.eventsPerPlayer} per player) are drawn at random and shuffled into the Player Deck; the rest go back in the box unseen, so only some of the cards below will appear.`
          : "The 5 Event cards are shuffled into the Player Deck, so they turn up as you draw.",
        m.eventsPerPlayer
          ? `Nesta partida ${m.eventCount} das ${m.eventPool} cartas de Evento abaixo (${m.eventsPerPlayer} por jogador) são sorteadas e embaralhadas no Baralho de Jogadores; as demais voltam para a caixa sem serem vistas, então só algumas das cartas abaixo vão aparecer.`
          : "As 5 cartas de Evento são embaralhadas no Baralho de Jogadores, então aparecem conforme vocês compram."
      ))}
      ${player.length ? `<div class="info-grid">${player.map(eventCard).join("")}</div>` : ""}
      ${emergency.length ? `
        <h3 class="subhead">${t("Emergency Event cards", "Cartas de Evento de Emergência")}</h3>
        <p>${t(
          "These are not Event cards you hold: they are their own deck, used by the Emergency Events challenge.",
          "Estas não são cartas de Evento que você segura: elas formam um baralho próprio, usado pelo desafio de Eventos de Emergência."
        )}</p>
        <div class="info-grid">${emergency.map(eventCard).join("")}</div>` : ""}
      <p class="source-note">${t(
        "Timing example: during infections, the first Infection card causes an outbreak. You may not play Airlift to move the Quarantine Specialist and prevent it — but once that outbreak has happened, you may play it before the next Infection card is flipped.",
        "Exemplo de momento: nas infecções, a primeira carta de Infecção causa um surto. Você não pode jogar Ponte Aérea (Airlift) para mover a Especialista em Quarentena e impedi-lo — mas, depois que o surto acontecer, pode jogá-la antes de virar a próxima carta de Infecção."
      )} ${coreRefs(7)}</p>`;
  }

  function scopedPoints(points) {
    return (points || []).filter((point) => {
      const english = point.text && point.text.en;
      return !outOfScope(english) && !mentionsInactiveChallenge(english || "");
    });
  }

  function scopedWinLose(entry) {
    const m = match();
    return scopedList(entry.winLose, (probe) => entry.id === "lab" && m.purple
      && /all 4 cures|discover all four cures|discovering all 4 cures/i.test(probe));
  }

  function challengeSection(entry, index) {
    const setup = [];
    const isSuperbugLab = entry.id === "superbug" && match().has("lab");
    const rules = (entry.rules || [])
      .filter((rule) => {
        const title = rule.title && rule.title.en;
        return !outOfScope(title);
      })
      .map((rule) => {
        const superbugActions = isSuperbugLab
          && rule.title && rule.title.en === "Superbug actions";
        const visible = scopedList(rule.lines, (probe) => superbugActions
          && /Discover a Cure \(superbug disease only\)/i.test(probe));
        if (superbugActions) {
          visible.unshift(t(
            "Discover a Cure for purple (Superbug Lab): at a research station, complete the purple research line. The Characterize and Test City cards must each be from a city with at least 1 purple cube; discard any 3 City cards, then replace the station with a vaccine factory and 1 dose.",
            "Descobrir uma Cura para o roxo (Superbug + Laboratório): em uma Estação de Pesquisa, complete a linha de pesquisa roxa. As cartas de Cidade de Caracterizar e Testar precisam ser de cidades com pelo menos 1 cubo roxo; descarte quaisquer 3 cartas de Cidade e substitua a estação por uma Fábrica de Vacina com 1 dose."
          ));
        }
        return { ...rule, visible };
      })
      .filter((rule) => rule.visible.length);
    const fine = scopedPoints(entry.finePoints);
    const cardsText = scopedList(entry.cardsOnTable);
    const overrides = activeChanges().filter((change) => changeChallenge(change) === entry.id
      && !(isSuperbugLab && change.id === "soe-superbug-discover-cure"));
    const playersNote = entry.players && entry.players.note ? tr(entry.players.note) : "";
    const pages = entry.pages && entry.pages.length ? entry.pages : [1];
    const m = match();
    const worldwidePanicOptional = entry.id === "mutation" && m.hasBox("itl");
    const labResearchLineNote = entry.id === "lab"
      ? note(t(
          "Guide interpretation: the setup says not to place a Sequence card in the empty second research line until a second research station is built. Read the later instruction to “open a new research line” subject to that restriction; until then, use only the first line.",
          "Interpretação do guia: a preparação diz para não colocar uma carta de Sequência na segunda linha de pesquisa vazia até construir uma segunda estação de pesquisa. Leia a instrução posterior de “abrir uma nova linha de pesquisa” sujeita a essa restrição; até lá, use somente a primeira linha."
        ), ref(3, "itl"))
      : "";
    const labPurpleNote = entry.id === "lab" && m.purple
      ? note(t(
          m.has("superbug")
            ? "Superbug + Lab: place 1 purple cube on the lab board's treat symbol during setup. Characterize and Test with City cards from cities that each have at least 1 purple cube; complete the line, then discard any 3 City cards to cure purple. Lab actions cannot be done at vaccine factories."
            : "Purple with the Lab: the City card used to Characterize the purple disease must be from a city with at least 1 purple cube. To cure it, complete its research line and discard 3 City cards of any colours; the discarded-card cities need not have purple cubes.",
          m.has("superbug")
            ? "Superbug + Laboratório: durante a preparação, coloque 1 cubo roxo no símbolo de tratamento do tabuleiro do laboratório. Caracterize e Teste com cartas de Cidade de cidades que tenham pelo menos 1 cubo roxo cada; complete a linha e descarte quaisquer 3 cartas de Cidade para curar o roxo. Ações de laboratório não podem ser feitas em Fábricas de Vacina."
            : "Roxo com o Laboratório: a carta de Cidade usada para Caracterizar a doença roxa precisa ser de uma cidade com pelo menos 1 cubo roxo. Para curá-la, complete a linha de pesquisa e descarte 3 cartas de Cidade de quaisquer cores; as cidades dessas cartas não precisam ter cubos roxos."
        ), m.has("superbug") ? ref(7, "soe") : `${ref(4, "itl")} ${ref(5, "itl")}`)
      : "";
    return `
      ${sectionHeading(`challenge-${entry.id}`, tr(entry.name), index, refs(entry.book, ...pages))}
      <p class="section-lead">${tr(entry.summary)}</p>
      ${playersNote ? note(playersNote) : ""}
      ${labResearchLineNote}${labPurpleNote}
      ${worldwidePanicOptional ? note(t(
        "Mutation: Worldwide Panic is an optional scenario from In the Lab. It is not active by default; the regular On the Brink Mutation rules above remain in force unless your group chooses this scenario before setup.",
        "Mutação: Pânico Mundial (Worldwide Panic) é um cenário opcional de In the Lab. Ele não fica ativo por padrão; as regras normais de Mutação de On the Brink continuam valendo, a menos que o grupo escolha este cenário antes da preparação."
      ), ref(2, "itl")) : ""}
      ${overrides.length ? block(t(
        worldwidePanicOptional ? "Optional In the Lab scenario — use only if chosen" : "Your other boxes change this challenge",
        worldwidePanicOptional ? "Cenário opcional de In the Lab — use somente se escolhido" : "Suas outras caixas mudam este desafio"
      ), list(overrides.map((change) => `<strong>${change.id === "itl-mutation-worldwide-panic" ? t("Optional scenario", "Cenário opcional") : tr(change.topic)}</strong> — ${tr(change.text)} ${ref(change.page, change.book)}`))) : ""}
      ${setup.length ? block(t("Setup changes", "Mudanças na preparação"), steps(setup), refs(entry.book, ...pages)) : ""}
      ${rules.map((rule) => block(tr(rule.title), list(rule.visible), ref(rule.page || pages[0], entry.book))).join("")}
      ${fine.length ? block(t("Fine points", "Detalhes finos"), list(fine.map((point) => `${tr(point.text)} ${ref(point.page || pages[0], entry.book)}`))) : ""}
      ${scopedWinLose(entry).length ? block(t("Winning and losing", "Vitória e derrota"), list(scopedWinLose(entry)), refs(entry.book, ...pages)) : ""}
      ${cardsText.length ? block(t("What stays on the components", "O que fica nos componentes"), list(cardsText.map((line) => `${line}`))) : ""}`;
  }

  function challengesSections() {
    return activeChallenges().map((entry) => (indexValue) => challengeSection(entry, indexValue));
  }

  // --- Examples, reminders, icons and glossary ------------------------------

  function examplesSection(index) {
    return `
      ${sectionHeading("examples", t("Worked examples", "Exemplos resolvidos"), index, coreRefs(5, 6, 7))}
      <p class="section-lead">${t(
        "Player names and situations in printed examples are illustrative; follow the player count and rules configured above.",
        "Os nomes e as situações dos exemplos impressos são ilustrativos; siga o número de jogadores e as regras configuradas acima."
      )}</p>
      <div class="info-grid">
        ${card(t("A first turn", "Um primeiro turno"), para(t(
          "Ben does 4 actions: Drive to Chicago from Atlanta, Drive to San Francisco, Treat Disease in San Francisco removing a blue cube, and Treat Disease there again removing a second blue cube. His actions are done.",
          "Ben faz 4 ações: Dirigir de Atlanta para Chicago, Dirigir para San Francisco, Tratar Doença em San Francisco removendo um cubo azul e Tratar Doença de novo removendo um segundo cubo azul. As ações dele acabaram."
        )), coreRefs(5))}
        ${card(t("Curing and eradicating", "Curar e erradicar"), lineList([
          t("The red disease is already cured. 3 red cubes are left on the board, in Manila, where Anna the Scientist starts her turn.", "A doença vermelha já está curada. Restam 3 cubos vermelhos no tabuleiro, em Manila, onde a Cientista Anna começa o turno."),
          t("<strong>1</strong> Treat Disease in Manila removes all 3 cubes at once, because red is cured. That was the last red cube, so red is eradicated: flip its marker to the “⊘” side.", "<strong>1</strong> Tratar Doença em Manila remove os 3 cubos de uma vez, porque o vermelho está curado. Era o último cubo vermelho, então o vermelho é erradicado: vire o marcador dele para o lado “⊘”."),
          t("<strong>2</strong> She discards her Manila card for a Charter Flight to Chennai, where George has built a research station.", "<strong>2</strong> Ela descarta a carta de Manila para um Voo Fretado até Chennai, onde George construiu uma estação de pesquisa."),
          t("<strong>3</strong> Share Knowledge: she takes George's Chennai card, giving her 4 black cards.", "<strong>3</strong> Compartilhar Conhecimento: ela pega a carta de Chennai de George, ficando com 4 cartas pretas."),
          match().has("lab")
            ? t("<strong>4</strong> In the Lab Challenge curing works differently — she would also need black's research line characterized, tested and filled, and would discard 2 cards as the Scientist. See the Lab Challenge section.", "<strong>4</strong> No Desafio do Laboratório a cura funciona diferente — ela também precisaria da linha de pesquisa preta caracterizada, testada e preenchida, e descartaria 2 cartas como Cientista. Veja a seção do Desafio do Laboratório.")
            : t("<strong>4</strong> As the Scientist she needs only 4, so she Discovers a Cure for black at the Chennai station.", "<strong>4</strong> Como Cientista ela precisa de apenas 4, então Descobre a Cura do preto na estação de Chennai.")
        ]), coreRefs(5))}
        ${card(t("Infecting cities", "Infectando cidades"), lineList([
          t("The infection rate is 3, so Anna flips 3 Infection cards: Seoul, Paris, Algiers.", "A taxa de infecção é 3, então Anna vira 3 cartas de Infecção: Seul, Paris, Argel."),
          t("<strong>Seoul</strong> — red is eradicated, so she simply discards the card.", "<strong>Seul</strong> — o vermelho está erradicado, então ela só descarta a carta."),
          t("<strong>Paris</strong> — has 1 blue cube; she adds a second and discards.", "<strong>Paris</strong> — tem 1 cubo azul; ela acrescenta o segundo e descarta."),
          t("<strong>Algiers</strong> — black is cured but not eradicated, and the city already has 3 black cubes. No 4th cube: a black outbreak happens in Algiers.", "<strong>Argel</strong> — o preto está curado, mas não erradicado, e a cidade já tem 3 cubos pretos. Sem 4º cubo: ocorre um surto preto em Argel.")
        ]), coreRefs(6))}
        ${card(t("Outbreak and chain reaction", "Surto e reação em cadeia"), lineList([
          t("The outbreak in Algiers moves the outbreaks marker 1 space and puts 1 black cube on Madrid, Paris, Istanbul and Cairo.", "O surto em Argel avança o marcador de surtos 1 espaço e põe 1 cubo preto em Madri, Paris, Istambul e Cairo."),
          t("Cairo already has 3 black cubes, so it does not get a 4th: a chain reaction outbreak happens there.", "Cairo já tem 3 cubos pretos, então não recebe o 4º: ocorre ali um surto em reação em cadeia."),
          t("The marker moves 1 more space and 1 black cube goes on Istanbul, Baghdad, Riyadh and Khartoum — but not Algiers, which already outbroke while resolving this card.", "O marcador avança mais 1 espaço e 1 cubo preto vai para Istambul, Bagdá, Riad e Cartum — mas não para Argel, que já entrou em surto nesta carta."),
          t("Then the Algiers Infection card is discarded.", "Depois a carta de Infecção de Argel é descartada.")
        ]), coreRefs(7))}
      </div>`;
  }

  function overlookedSection(index) {
    const m = match();
    const challengeReminders = activeChallenges().flatMap((entry) =>
      scopedPoints(entry.finePoints).slice(0, 2).map((point) => `<strong>${tr(entry.name)}</strong> — ${tr(point.text)} ${ref(point.page || (entry.pages && entry.pages[0]) || 1, entry.book)}`)
    );
    return `
      ${sectionHeading("overlooked", t("Commonly overlooked rules", "Regras que costumam passar batido"), index, coreRefs(8))}
      ${list([
        t("You do <em>not</em> draw a replacement card after drawing an Epidemic card.", "Você <em>não</em> compra uma carta no lugar de uma Epidemia comprada."),
        t("You may Discover a Cure at <em>any</em> research station — the colour of its city does not need to match the disease you are curing.", "Você pode Descobrir a Cura em <em>qualquer</em> estação de pesquisa — a cor da cidade dela não precisa corresponder à doença que está curando."),
        t("On your turn you may take a card from another player if you are both in the city that <em>matches</em> the card you are taking.", "No seu turno você pode pegar uma carta de outro jogador se os dois estiverem na cidade que <em>corresponde</em> à carta pegada."),
        t("On your turn you may take any City card <em>from the Researcher</em> (only), if you are both in the same city.", "No seu turno você pode pegar qualquer carta de Cidade <em>da Pesquisadora</em> (somente dela), se os dois estiverem na mesma cidade."),
        t("Your hand limit applies immediately after getting a card from another player.", "O limite de mão vale imediatamente depois de receber uma carta de outro jogador.")
      ])}
      ${m.level === "intro"
        ? note(t("In the Introductory game, play with your cards face up in front of you so everyone can see them.", "No jogo Introdutório, jogue com suas cartas abertas na mesa para que todos as vejam."))
        : m.level === "legendary"
          ? note(t("In the Legendary game, keep your hand private so everyone has information to contribute to the discussion. Experienced groups may agree to play with open hands.", "No jogo Lendário, mantenha sua mão escondida para que todos tenham informação a contribuir na discussão. Grupos experientes podem combinar jogar com as mãos abertas."))
          : note(t("In Standard and Heroic games, keep your hand private so everyone has information to contribute to the discussion. Experienced groups may agree to play with open hands.", "Nos jogos Padrão e Heroico, mantenha sua mão escondida para que todos tenham informação a contribuir na discussão. Grupos experientes podem combinar jogar com as mãos abertas."))}
      ${challengeReminders.length ? `<h3 class="subhead">${t("From your challenges", "Dos seus desafios")}</h3>${list(challengeReminders)}` : ""}`;
  }

  function iconographySection(index) {
    const m = match();
    const shown = ICONS.filter((entry) => {
      if (entry.box && !m.hasBox(entry.box)) {
        return false;
      }
      if (entry.challenge && !m.has(entry.challenge)) {
        return false;
      }
      if (Array.isArray(entry.challengeAll) && !entry.challengeAll.every((id) => m.has(id))) {
        return false;
      }
      if (Array.isArray(entry.challengeAny) && !entry.challengeAny.some((id) => m.has(id))) {
        return false;
      }
      return true;
    });
    if (!shown.length) {
      return "";
    }
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), index, coreRefs(1, 4))}
      <p class="section-lead">${t(
        "Every symbol you will meet on the board, the cards and the components of this match.",
        "Todos os símbolos que você vai encontrar no tabuleiro, nas cartas e nos componentes desta partida."
      )}</p>
      <div class="icon-grid pandemic-icon-grid">${shown.map((entry) => `
        <article class="icon-card">
          <div class="manual-icon-frame"><img class="manual-icon" src="${ICON_DIR}${entry.file}" alt="${escapeHtml(tr(entry.name))}" loading="lazy"></div>
          <h3>${tr(entry.name)}</h3>
          <p>${tr(entry.meaning)}</p>
          <p class="pandemic-refs">${ref(entry.page, entry.book)}</p>
        </article>`).join("")}</div>`;
  }

  function glossarySection(index) {
    const m = match();
    const terms = [
      [t("Outbreak", "Surto"), t("What happens instead of placing a 4th cube of one colour in a city: the outbreaks marker advances and 1 cube spreads to every connected city.", "O que acontece em vez de colocar um 4º cubo de uma cor numa cidade: o marcador de surtos avança e 1 cubo se espalha para cada cidade ligada."), "core", 7],
      [t("Chain reaction outbreak", "Surto em reação em cadeia"), t("An outbreak triggered by another outbreak. A city never outbreaks twice while one Infection card is resolved.", "Um surto disparado por outro surto. Uma cidade nunca entra em surto duas vezes na resolução de uma carta de Infecção."), "core", 7],
      [t("Epidemic", "Epidemia"), t(
        m.has("virulent-strain")
          ? "A card in the Player Deck. Resolve Increase, Infect and Intensify; keep continuing Virulent Strain cards face up, flip immediate ones face down, and remove base Epidemics from play."
          : "A card in the Player Deck. Resolve Increase, Infect and Intensify in order, then remove the card from the game. No replacement is drawn.",
        m.has("virulent-strain")
          ? "Uma carta no Baralho de Jogadores. Resolva Aumentar, Infectar e Intensificar; mantenha as cartas contínuas da Cepa Virulenta viradas para cima, vire as imediatas para baixo e remova as Epidemias básicas da partida."
          : "Uma carta no Baralho de Jogadores. Resolva Aumentar, Infectar e Intensificar em ordem e depois tire a carta da partida. Não compre uma carta no lugar."
      ), "core", 6],
      [t("Infection rate", "Taxa de infecção"), t("How many Infection cards are flipped in the Infect cities step. Read it under the marker on the Infection Rate Track.", "Quantas cartas de Infecção são viradas no passo de infectar cidades. Leia sob o marcador na Trilha de Taxa de Infecção."), "core", 6],
      [t("Cured", "Curada"), t("A disease whose cure marker sits on its Cure Indicator. Treating it removes every cube of that colour from a city with one action.", "Uma doença cujo marcador de cura está no Indicador de Cura dela. Tratá-la remove todos os cubos daquela cor de uma cidade com uma única ação."), "core", 4],
      [t("Eradicated", "Erradicada"), t("A cured disease with no cubes left on the board. Its marker is flipped to the “⊘” side and its cities are never infected again.", "Uma doença curada sem nenhum cubo no tabuleiro. O marcador dela é virado para o lado “⊘” e as cidades dela nunca mais são infectadas."), "core", 4],
      [t("Research station", "Estação de pesquisa"), t("A building where cures are discovered and between which pawns can take Shuttle Flights. 6 are supplied.", "Uma construção onde as curas são descobertas e entre as quais os peões podem fazer Voos de Traslado. São 6 fornecidas."), "core", 4],
      [t("Player Deck", "Baralho de Jogadores"), t("City cards, Event cards and the Epidemic cards for your difficulty. Running out of it loses the game.", "Cartas de Cidade, cartas de Evento e as Epidemias da sua dificuldade. Ficar sem ele faz vocês perderem."), "core", 7],
      [t("Infection Deck", "Baralho de Infecção"), t("The 48 Infection cards. Infections draw from the top; an Epidemic draws from the bottom.", "As 48 cartas de Infecção. As infecções compram do topo; uma Epidemia compra de baixo."), "core", 6],
      [t("Hand limit", "Limite de mão"), t(handLimitLine(m), handLimitLine(m)), "core", 6]
    ];
    activeChallenges().forEach((entry) => {
      terms.push([tr(entry.name), tr(entry.summary), entry.book, (entry.pages && entry.pages[0]) || 1]);
    });
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), index, coreRefs(4, 6, 7))}
      <dl class="pandemic-glossary">${terms.map(([term, definition, book, page]) => `<div><dt>${term}</dt><dd>${definition} ${ref(page, book)}</dd></div>`).join("")}</dl>
      <p class="source-note">${t(
        `City names and populations, the links between cities and the exact wording of individual cards are printed on the components themselves; the component always takes precedence over this guide. This match uses ${m.boxes.map((box) => bookName(box)).join(" + ")}.`,
        `Nomes e populações das cidades, as ligações entre elas e o texto exato de cada carta estão impressos nos próprios componentes; o componente sempre prevalece sobre este guia. Esta partida usa ${m.boxes.map((box) => bookName(box)).join(" + ")}.`
      )}</p>`;
  }

  // --- Page ----------------------------------------------------------------

  function navigation() {
    const m = match();
    const items = [
      ["configure-title", t("Match", "Partida")],
      ["overview", t("Overview", "Visão geral")],
      ["quick", t("Quick ref", "Referência")],
      ["setup", t("Setup", "Preparação")],
      ["turn", t("Turn", "Turno")],
      ["cures", t("Cures", "Curas")],
      availableRoles().length ? ["roles", t("Roles", "Papéis")] : null,
      EVENTS.length ? ["events", t("Events", "Eventos")] : null,
      ...activeChallenges().map((entry) => [`challenge-${entry.id}`, tr(entry.name)]),
      ["examples", t("Examples", "Exemplos")],
      ["overlooked", t("Overlooked", "Esquecidas")],
      ICONS.length ? ["icons", t("Icons", "Ícones")] : null,
      ["glossary", t("Glossary", "Glossário")]
    ].filter(Boolean);
    return `<nav class="pandemic-jump" aria-label="${t("Sections", "Seções")}">${items.map(([id, label]) => jump(id, label)).join("")}</nav>`;
  }

  function renderInto(host) {
    root = host;
    const m = match();
    const playerRange = m.hasBox("otb") ? "2–5" : "2–4";
    const manualFiles = {
      core: "pandemic_core.pdf",
      otb: "pandemic_on-the-brink.pdf",
      itl: "pandemic_in-the-lab.pdf",
      soe: "pandemic_state-of-emergency.pdf"
    };
    const includedManuals = m.boxes.map((box) => `manuals/${manualFiles[box]}`).join(", ");
    document.body.classList.remove("theme-nem", "theme-avalon", "theme-pagan", "theme-odins-ravens", "theme-western-legends", "theme-lotr");
    document.body.classList.add("theme-pandemic");
    document.documentElement.lang = prefs.language;
    document.title = t("Pandemic — Field Manual", "Pandemic — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "A bilingual interactive rulebook for Pandemic and its On the Brink, In the Lab and State of Emergency expansions, with player count, difficulty, challenges, filtered setup, turns, roles, Events and source references.",
        "Livro de regras interativo e bilíngue de Pandemic e das expansões On the Brink, In the Lab e State of Emergency, com número de jogadores, dificuldade, desafios, preparação filtrada, turnos, papéis, Eventos e referências."
      );
    }
    const sections = [
      overviewSection,
      quickReference,
      setupSection,
      turnSection,
      curesSection,
      rolesSection,
      eventsSection,
      ...challengesSections(),
      examplesSection,
      overlookedSection,
      iconographySection,
      glossarySection
    ];
    let number = 0;
    const body = sections.map((build) => {
      const html = build(String(number + 1).padStart(2, "0"));
      if (!html) {
        return "";
      }
      number += 1;
      return `<section class="rule-section">${html}</section>`;
    }).join("");
    const boxLabel = m.boxes.length > 1
      ? m.boxes.slice(1).map((box) => bookName(box)).join(" + ")
      : t("BASE GAME", "JOGO BASE");
    root.innerHTML = `
      <header class="site-header">
        <a class="brand" href="#/" aria-label="${t("Field Manual home", "Página inicial do Manual de Campo")}">
          <span class="brand-mark" aria-hidden="true">FF</span>
          <span class="brand-copy"><strong>Field Manual</strong><small>${t("Board-game rulebooks", "Livros de regras")}</small></span>
        </a>
        <div class="header-right">
          <nav class="primary-nav" aria-label="${t("Main navigation", "Navegação principal")}">
            <a href="#/">${t("Game index", "Índice de jogos")}</a>
          </nav>
          <div class="language-switch" role="group" aria-label="${t("Language", "Idioma")}">
            <button type="button" data-language="en-US" aria-pressed="${prefs.language === "en-US"}">EN-US</button>
            <button type="button" data-language="pt-BR" aria-pressed="${prefs.language === "pt-BR"}">PT-BR</button>
          </div>
        </div>
      </header>
      ${storageNotice ? `<p class="storage-notice" role="status">${storageNoticeText()}</p>` : ""}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t(`COOPERATIVE · ${playerRange} PLAYERS · ${boxLabel.toUpperCase()}`, `COOPERATIVO · ${playerRange} JOGADORES · ${boxLabel.toUpperCase()}`)}</p>
          <h1>Pandemic</h1>
          <p class="hero-intro">${t(
            m.has("bio-terrorist")
              ? "The non-Terrorist players try to discover cures while the Bio-Terrorist spreads the purple disease."
              : m.purple
                ? "The four standard diseases and the selected purple-disease challenge race to overrun the world; discover cures before time runs out."
                : "Four deadly diseases are breaking out at once and your team of specialists is all that stands in the way. Travel the globe, treat infections and find the cures before the world runs out of time.",
            m.has("bio-terrorist")
              ? "Os jogadores não terroristas tentam descobrir curas enquanto o Bioterrorista espalha a doença roxa."
              : m.purple
                ? "As quatro doenças padrão e o desafio selecionado de doença roxa ameaçam o mundo; descubram as curas antes que o tempo acabe."
                : "Quatro doenças mortais irrompem ao mesmo tempo e só a sua equipe de especialistas está no caminho delas. Viajem pelo mundo, tratem as infecções e descubram as curas antes que o tempo acabe."
          )}</p>
          <div class="hero-meta"><span>${t("Cooperative", "Cooperativo")}</span><span>${playersLabel(m.players)}</span><span>${t(`This match: ${m.levelLabel} · ${m.epidemics} Epidemics`, `Esta partida: ${m.levelLabel} · ${m.epidemics} Epidemias`)}</span></div>
        </div>
        <figure class="hero-map pandemic-cover">
          <img src="assets/covers/pandemic.webp" alt="${t("Cover of the Pandemic rulebook", "Capa do manual de Pandemic")}">
          <figcaption>${t("Pandemic core manual cover · p. 1", "Capa do manual base de Pandemic · p. 1")}</figcaption>
        </figure>
      </div></section>
      <main class="page-wrap content-column pandemic-page">
        ${navigation()}
        ${renderConfiguration()}
        ${body}
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        `Personal guide for this Pandemic match. It paraphrases the official rulebooks, whose PDFs are included in this repository with permission (${includedManuals}). Game design by Matt Leacock; artwork by Chris Quilliams; Z-Man Games.`,
        `Guia pessoal desta partida de Pandemic. Parafraseia os manuais oficiais, cujos PDFs estão incluídos neste repositório com autorização (${includedManuals}). Design de Matt Leacock; arte de Chris Quilliams; Z-Man Games.`
      )}</p></footer>`;
  }

  function onClick(event) {
    const button = event.target.closest("button");
    if (!button || !root || !root.contains(button)) {
      return;
    }
    if (button.dataset.language) {
      prefs.language = button.dataset.language === "en-US" ? "en-US" : "pt-BR";
      adjustNotices = [];
      savePrefs();
      renderInto(root);
      return;
    }
    if (button.hasAttribute("data-setup-reset")) {
      setupChecks = [];
      saveChecks();
      renderInto(root);
      return;
    }
    if (button.dataset.scroll) {
      document.getElementById(button.dataset.scroll)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !root || !root.contains(target)) {
      return;
    }
    if (target.matches("[data-setup-check]")) {
      const id = target.dataset.setupCheck;
      const checked = new Set(setupChecks);
      if (target.checked) {
        checked.add(id);
      } else {
        checked.delete(id);
      }
      setupChecks = [...checked];
      saveChecks();
      const total = setupPhases().flatMap((phase) => phase.items).length;
      const done = setupChecks.length;
      const progress = root.querySelector("#setup-progress");
      const label = root.querySelector("#setup-progress-label");
      if (progress) {
        progress.value = done;
      }
      if (label) {
        label.textContent = t(`${done} of ${total} setup checklist items checked`, `${done} de ${total} itens da checklist de preparação concluídos`);
      }
      return;
    }
    if (target.type === "radio" && target.checked && target.dataset.pref) {
      const key = target.dataset.pref;
      const value = target.value;
      commit(key, (draft) => {
        if (key === "players") {
          draft.players = Number(value);
        } else if (key === "level") {
          if (LEVELS.includes(value)) {
            draft.level = value;
          }
        } else {
          draft[key] = value === "yes" ? "yes" : "no";
        }
      });
    }
  }

  window.Pandemic = { renderInto, onClick, onChange };
})();
