(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.cascadia.v1";
  const SETUP_KEY = "field-manual.cascadia.setup.v1";
  const MANUAL = "cascadia_core.pdf";
  const ICONS = "assets/cascadia/icons/";
  const CARD_ART = "assets/cascadia/cards/";
  const ART = "assets/cascadia/art/";

  // ---------- rules data ----------

  const WILDLIFE = {
    bear: { en: "Bear", pt: "Urso", plEn: "bears", plPt: "ursos" },
    elk: { en: "Elk", pt: "Alce", plEn: "elk", plPt: "alces" },
    salmon: { en: "Salmon", pt: "Salmão", plEn: "salmon", plPt: "salmões" },
    hawk: { en: "Hawk", pt: "Gavião", plEn: "hawks", plPt: "gaviões" },
    fox: { en: "Fox", pt: "Raposa", plEn: "foxes", plPt: "raposas" }
  };
  const WILDLIFE_IDS = Object.keys(WILDLIFE);

  const HABITATS = {
    mountain: { en: "Mountains", pt: "Montanhas" },
    forest: { en: "Forests", pt: "Florestas" },
    prairie: { en: "Prairies", pt: "Pradarias" },
    wetland: { en: "Wetlands", pt: "Pântanos" },
    river: { en: "Rivers", pt: "Rios" }
  };
  const HABITAT_IDS = Object.keys(HABITATS);
  const LETTERS = ["A", "B", "C", "D"];

  // General rules per wildlife (rulebook p. 11).
  const WILDLIFE_RULES = {
    bear: [
      ["Bear groups may be any shape or orientation, but two groups may not be next to one another: touching bears always form one single group.", "Os grupos de ursos podem ter qualquer forma ou orientação, mas dois grupos não podem ficar encostados: ursos que se tocam formam sempre um único grupo."],
      ["A group scores only if it holds <strong>exactly</strong> the number of bears shown on the card.", "Um grupo só pontua se tiver <strong>exatamente</strong> o número de ursos mostrado na carta."]
    ],
    elk: [
      ["Most elk cards require the exact shape or formation pictured on the card.", "A maioria das cartas de alce exige a forma ou formação exata desenhada na carta."],
      ["Unlike bears, elk groups may sit next to one another, but each elk scores only once, for a single group or formation.", "Ao contrário dos ursos, grupos de alces podem ficar encostados, mas cada alce pontua só uma vez, em um único grupo ou formação."],
      ["When connected elk could be split in several ways, always use the split that scores the most points.", "Quando alces conectados podem ser divididos de várias formas, use sempre a divisão que dá mais pontos."]
    ],
    salmon: [
      ["Salmon score in <strong>runs</strong>: a group of adjacent salmon in which each salmon touches no more than 2 other salmon.", "Salmões pontuam em <strong>corridas</strong> (runs): um grupo de salmões adjacentes em que cada salmão encosta em no máximo 2 outros salmões."],
      ["3 salmon in a triangle may count as a run, but then no other salmon may be attached to it.", "3 salmões em triângulo podem contar como corrida, mas aí nenhum outro salmão pode estar ligado a ela."],
      ["A run may not have any other salmon adjacent to it; a cluster that breaks these rules is not a run.", "Uma corrida não pode ter nenhum outro salmão adjacente; um aglomerado que quebra essas regras não é uma corrida."]
    ],
    hawk: [
      ["Hawks score for spreading out: per hawk, per pair of hawks, or per line of sight between hawks, depending on the card.", "Gaviões pontuam por se espalharem: por gavião, por par de gaviões ou por linha de visão entre gaviões, conforme a carta."],
      ["A <strong>line of sight</strong> is a straight line from flat side to flat side of the hexes. Only another hawk interrupts it: it cannot pass through a hawk.", "Uma <strong>linha de visão</strong> é uma linha reta de lado plano a lado plano dos hexágonos. Só outro gavião a interrompe: ela não atravessa um gavião."],
      ["<span class=\"csc-interpretation\">Guide's reading</span> since only hawks block it, a line of sight also crosses tiles without tokens and gaps with no tile, and two adjacent hawks see each other.", "<span class=\"csc-interpretation\">Leitura do guia</span> como só gaviões a bloqueiam, a linha de visão também atravessa peças sem ficha e vãos sem peça, e dois gaviões adjacentes se veem."]
    ],
    fox: [
      ["Foxes score individually (or in pairs on card D); each fox or fox pair is scored independently.", "Raposas pontuam individualmente (ou em pares na carta D); cada raposa ou par de raposas é pontuado de forma independente."],
      ["What counts is the animals on the adjacent spaces: 6 around a single fox, 8 around a fox pair.", "O que conta são os animais nos espaços adjacentes: 6 em volta de uma raposa, 8 em volta de um par de raposas."]
    ]
  };

  function rows(list) {
    return list.map(([en, pt, points]) => ({ en, pt, points }));
  }

  function sizes(values, firstSize = 1, plusLast = false) {
    return values.map((points, index) => {
      const size = String(firstSize + index) + (plusLast && index === values.length - 1 ? "+" : "");
      return { en: size, pt: size, points };
    });
  }

  // Wildlife Scoring Cards (values read from the card pictures, rulebook p. 11).
  const CARDS = {
    bear: {
      A: { col: ["Pairs", "Pares"], rows: sizes([4, 11, 19, 27]), lines: [
        ["Count your groups of exactly 2 bears (pairs) and score once, by the total number of pairs.", "Conte seus grupos de exatamente 2 ursos (pares) e pontue uma vez, pelo total de pares."],
        ["Single bears and groups of 3+ bears score nothing on this card.", "Ursos sozinhos e grupos de 3+ ursos não pontuam nesta carta."]
      ], reading: ["the card prints values up to 4 pairs; this guide treats 27 as the maximum.", "a carta mostra valores até 4 pares; este guia trata 27 como o máximo."] },
      B: { col: ["Group", "Grupo"], rows: rows([["Exactly 3 bears", "Exatamente 3 ursos", 10]]), lines: [
        ["Score 10 points for each group of exactly 3 bears, in any shape.", "Marque 10 pontos por grupo de exatamente 3 ursos, em qualquer forma."],
        ["Groups of 1, 2 or 4+ bears score nothing.", "Grupos de 1, 2 ou 4+ ursos não pontuam."]
      ] },
      C: { col: ["Group size", "Tamanho do grupo"], rows: sizes([2, 5, 8]), lines: [
        ["Score each group of 1, 2 or 3 bears by its size.", "Pontue cada grupo de 1, 2 ou 3 ursos pelo tamanho."],
        ["<strong>+3 bonus</strong> once if you have at least one group of each size (1, 2 and 3).", "<strong>Bônus de +3</strong> uma vez se você tiver pelo menos um grupo de cada tamanho (1, 2 e 3)."],
        ["Groups of 4+ bears score nothing.", "Grupos de 4+ ursos não pontuam."]
      ] },
      D: { col: ["Group size", "Tamanho do grupo"], rows: sizes([5, 8, 13], 2), lines: [
        ["Score each group of 2, 3 or 4 bears by its size.", "Pontue cada grupo de 2, 3 ou 4 ursos pelo tamanho."],
        ["Single bears and groups of 5+ score nothing.", "Ursos sozinhos e grupos de 5+ não pontuam."]
      ] }
    },
    elk: {
      A: { col: ["Straight line of", "Linha reta de"], rows: sizes([2, 5, 9, 13]), lines: [
        ["Score each straight line of elk: hexes joined flat side to flat side in one direction, in any orientation.", "Pontue cada linha reta de alces: hexágonos ligados de lado plano a lado plano numa só direção, em qualquer orientação."],
        ["A single elk counts as a line of 1.", "Um alce sozinho conta como linha de 1."]
      ], reading: ["the card stops at 4; split a longer line into lines of up to 4 the way that scores most (the rulebook's “largest number of points” rule).", "a carta para em 4; divida uma linha maior em linhas de até 4 da forma que der mais pontos (regra do “maior número de pontos” do manual)."] },
      B: { col: ["Exact shape", "Forma exata"], rows: rows([
        ["1 elk", "1 alce", 2],
        ["2 elk side by side", "2 alces lado a lado", 5],
        ["3 elk in a triangle (each touches the other two)", "3 alces em triângulo (cada um encosta nos outros dois)", 9],
        ["4 elk in a diamond: 2 side by side, plus 1 touching both from each side, as pictured", "4 alces em losango: 2 lado a lado e mais 1 encostando nos dois de cada lado, como na figura", 13]
      ]), lines: [
        ["Score each group that forms exactly one of the pictured shapes, in any orientation.", "Pontue cada grupo que forma exatamente uma das formas desenhadas, em qualquer orientação."],
        ["A bigger cluster of elk may be divided into several of these shapes (each elk counts once), choosing the division that scores most.", "Um aglomerado maior de alces pode ser dividido em várias dessas formas (cada alce conta uma vez), escolhendo a divisão que dá mais pontos."]
      ] },
      C: { col: ["Group size", "Tamanho do grupo"], rows: sizes([2, 4, 7, 10, 14, 18, 23, 28], 1, true), lines: [
        ["Score each contiguous group of elk by its size, in any shape.", "Pontue cada grupo contíguo de alces pelo tamanho, em qualquer forma."]
      ], reading: ["this card scores each whole contiguous group as it is; it is not split into smaller groups (8 or more touching elk score 28).", "esta carta pontua cada grupo contíguo inteiro como está; ele não é dividido em grupos menores (8 ou mais alces encostados valem 28)."] },
      D: { col: ["Elk in the ring", "Alces no anel"], rows: sizes([2, 5, 8, 12, 16, 21]), lines: [
        ["Score each group in a circular formation, as pictured: elk on the ring of 6 spaces around one central space.", "Pontue cada grupo em formação circular, como na figura: alces no anel de 6 espaços em volta de um espaço central."]
      ], reading: ["the table runs from 1 to 6, so a partial ring (1–5 elk on that ring) also scores; the central space is not part of the group.", "a tabela vai de 1 a 6, então um anel parcial (1–5 alces nesse anel) também pontua; o espaço central não faz parte do grupo."] }
    },
    salmon: {
      A: { col: ["Run size", "Tamanho da corrida"], rows: sizes([2, 5, 8, 12, 16, 20, 25], 1, true), lines: [
        ["Score each run by its size; runs of 7 or more score 25.", "Pontue cada corrida pelo tamanho; corridas de 7 ou mais valem 25."]
      ] },
      B: { col: ["Run size", "Tamanho da corrida"], rows: sizes([2, 4, 9, 11, 17], 1, true), lines: [
        ["Score each run by its size; runs of 5 or more score 17.", "Pontue cada corrida pelo tamanho; corridas de 5 ou mais valem 17."]
      ] },
      C: { col: ["Run size", "Tamanho da corrida"], rows: sizes([10, 12, 15], 3, true), lines: [
        ["Score each run of 3, 4 or 5+ salmon.", "Pontue cada corrida de 3, 4 ou 5+ salmões."],
        ["Runs of 1 or 2 salmon score nothing.", "Corridas de 1 ou 2 salmões não pontuam."]
      ] },
      D: { col: ["Each run", "Cada corrida"], rows: rows([["Per salmon in the run", "Por salmão na corrida", 1], ["Per animal token adjacent to the run (any type)", "Por ficha de animal adjacente à corrida (qualquer tipo)", 1]]), lines: [
        ["Score each run: 1 point per salmon in it, plus 1 point per adjacent animal token, whatever its type.", "Pontue cada corrida: 1 ponto por salmão nela, mais 1 ponto por ficha de animal adjacente, de qualquer tipo."]
      ], reading: ["count each adjacent token once, even if it touches several salmon of the run.", "conte cada ficha adjacente uma vez, mesmo que encoste em vários salmões da corrida."] }
    },
    hawk: {
      A: { col: ["Isolated hawks", "Gaviões isolados"], rows: sizes([2, 5, 8, 11, 14, 18, 22, 26], 1, true), lines: [
        ["Count your hawks that are not adjacent to any other hawk and score once, by that number.", "Conte seus gaviões que não encostam em nenhum outro gavião e pontue uma vez, por esse número."]
      ] },
      B: { col: ["Qualifying hawks", "Gaviões válidos"], rows: sizes([5, 9, 12, 16, 20, 24, 28], 2), lines: [
        ["Count your hawks that are not adjacent to any other hawk <strong>and</strong> have a direct line of sight to another hawk; score once, by that number.", "Conte seus gaviões que não encostam em nenhum outro gavião <strong>e</strong> têm linha de visão direta para outro gavião; pontue uma vez, por esse número."]
      ], reading: ["the last column is printed “8”; this guide also scores 28 for more than 8.", "a última coluna está impressa como “8”; este guia também dá 28 para mais de 8."] },
      C: { col: ["Line of sight", "Linha de visão"], rows: rows([["Each line of sight between two hawks", "Cada linha de visão entre dois gaviões", 3]]), lines: [
        ["Score 3 points for each line of sight between two of your hawks.", "Marque 3 pontos por linha de visão entre dois dos seus gaviões."],
        ["Several lines of sight may involve the same hawk.", "Várias linhas de visão podem envolver o mesmo gavião."]
      ] },
      D: { col: ["Animal types between", "Tipos de animal entre eles"], rows: sizes([4, 7, 9], 1, true), lines: [
        ["Form pairs of hawks; each hawk may be part of only one pair.", "Forme pares de gaviões; cada gavião pode fazer parte de um só par."],
        ["Score each pair by the number of different animal types between the two hawks (other hawks do not count).", "Pontue cada par pelo número de tipos diferentes de animal entre os dois gaviões (outros gaviões não contam)."]
      ], reading: ["as pictured, the two hawks of a pair see each other along a line of sight, and the animals counted are the tokens on the spaces between them.", "como na figura, os dois gaviões de um par se veem por uma linha de visão, e os animais contados são as fichas nos espaços entre eles."] }
    },
    fox: {
      A: { col: ["Different adjacent types", "Tipos diferentes adjacentes"], rows: sizes([1, 2, 3, 4, 5]), lines: [
        ["Score each fox by the number of different animal types on the 6 spaces around it, <strong>foxes included</strong>.", "Pontue cada raposa pelo número de tipos diferentes de animal nos 6 espaços em volta dela, <strong>raposas incluídas</strong>."]
      ] },
      B: { col: ["Different adjacent pairs", "Pares de animais diferentes adjacentes"], rows: sizes([3, 5, 7]), lines: [
        ["Score each fox by the number of different animal types of which at least 2 tokens (a pair) are adjacent to it. Foxes never count as one of these pairs.", "Pontue cada raposa pelo número de tipos diferentes de animal com pelo menos 2 fichas (um par) adjacentes a ela. Raposas nunca contam como um desses pares."],
        ["A pair is 2 or more tokens of the same type; each type counts once. The two animals of a pair do not need to touch each other.", "Um par são 2 ou mais fichas do mesmo tipo; cada tipo conta uma vez. Os dois animais de um par não precisam encostar um no outro."]
      ] },
      C: { col: ["Most common adjacent type", "Tipo adjacente mais comum"], rows: sizes([1, 2, 3, 4, 5, 6]), lines: [
        ["Score each fox by how many tokens of its most abundant adjacent animal type surround it (foxes excluded). Only that one type scores.", "Pontue cada raposa por quantas fichas do tipo de animal adjacente mais numeroso a cercam (raposas excluídas). Só esse tipo pontua."]
      ] },
      D: { col: ["Different adjacent pairs", "Pares de animais diferentes adjacentes"], rows: sizes([5, 7, 9, 11]), lines: [
        ["Score each <strong>fox pair</strong> (2 adjacent foxes) by the number of different animal pairs on the 8 spaces around it. Foxes never count as one of these animal pairs.", "Pontue cada <strong>par de raposas</strong> (2 raposas adjacentes) pelo número de pares diferentes de animais nos 8 espaços em volta dele. Raposas nunca contam como um desses pares de animais."],
        ["A pair is 2 or more tokens of the same type; each type counts once. The two animals of a pair do not need to touch each other.", "Um par são 2 ou mais fichas do mesmo tipo; cada tipo conta uma vez. Os dois animais de um par não precisam encostar um no outro."]
      ], reading: ["each fox belongs to one fox pair at most; with 3 or more touching foxes, choose the pairing that scores most.", "cada raposa pertence a no máximo um par de raposas; com 3 ou mais raposas encostadas, escolha a formação de pares que dá mais pontos."] }
    }
  };

  // Achievements · Scenarios (rulebook p. 13). Card letters in the order bear, elk, salmon, hawk, fox.
  const G = {
    fullyFox: { icon: "key-fully-score", en: "<strong>Fully score Foxes 3 times.</strong>", pt: "<strong>Pontuar Raposas por completo 3 vezes.</strong>", readEn: "3 foxes each reach the top value of Fox card B: 3 different adjacent pairs → 7 points each.", readPt: "3 raposas atingem cada uma o valor máximo da carta Raposa B: 3 pares diferentes adjacentes → 7 pontos cada." },
    play4: { icon: "key-play-wildlife", en: "<strong>Play at least 4 of each wildlife</strong>: 4+ bears, elk, salmon, hawks and foxes in your environment.", pt: "<strong>Jogar pelo menos 4 de cada animal</strong>: 4+ ursos, alces, salmões, gaviões e raposas no seu ambiente." },
    hawk20: { icon: "key-each-wildlife", en: "<strong>Score at least 20 points with Hawks.</strong>", pt: "<strong>Fazer pelo menos 20 pontos com Gaviões.</strong>" },
    nature5: { icon: "nature-token", en: "<strong>Score at least 5 points from Nature Tokens</strong> (end with 5+ unused Nature Tokens).", pt: "<strong>Fazer pelo menos 5 pontos com Fichas de Natureza</strong> (terminar com 5+ fichas não usadas)." },
    bearElk: { icon: "key-no-adjacent-wildlife", en: "<strong>A bear may never be placed next to an elk</strong> (bear beside bear and elk beside elk are fine).", pt: "<strong>Um urso nunca pode ser colocado encostado num alce</strong> (urso ao lado de urso e alce ao lado de alce podem)." },
    each10: { icon: "key-each-wildlife", en: "<strong>Score at least 10 points with each of the 5 wildlife.</strong>", pt: "<strong>Fazer pelo menos 10 pontos com cada um dos 5 animais.</strong>" },
    habitat5: { icon: "key-each-habitat", en: "<strong>Score at least 5 points in each of the 5 habitats.</strong>", pt: "<strong>Fazer pelo menos 5 pontos em cada um dos 5 habitats.</strong>" },
    w60: { icon: "key-category-total", en: "<strong>Score at least 60 points in total from Wildlife</strong> (the W subtotal).", pt: "<strong>Fazer pelo menos 60 pontos no total com Animais</strong> (o subtotal W)." },
    any3h7: { icon: "key-any-habitats", en: "<strong>Score at least 7 points in each of any 3 habitats.</strong>", pt: "<strong>Fazer pelo menos 7 pontos em cada um de 3 habitats quaisquer.</strong>" },
    bear30: { icon: "key-each-wildlife", en: "<strong>Score at least 30 points with Bears.</strong>", pt: "<strong>Fazer pelo menos 30 pontos com Ursos.</strong>" },
    forestRiver: { icon: "key-no-adjacent-habitat", en: "<strong>A Forest edge may never touch a River edge</strong> of another tile.", pt: "<strong>Uma borda de Floresta nunca pode tocar uma borda de Rio</strong> de outra peça." },
    fullySalmon: { icon: "key-fully-score", en: "<strong>Fully score Salmon once.</strong>", pt: "<strong>Pontuar Salmões por completo 1 vez.</strong>", readEn: "one run reaches the top value of Salmon card A: a run of 7+ salmon → 25 points.", readPt: "uma corrida atinge o valor máximo da carta Salmão A: uma corrida de 7+ salmões → 25 pontos." },
    elkForest: { icon: "key-wildlife-not-on-habitat", en: "<strong>Elk may never be placed on a Forest.</strong>", pt: "<strong>Alces nunca podem ser colocados numa Floresta.</strong>" },
    any1h12: { icon: "key-any-habitats", en: "<strong>Score at least 12 points in any 1 habitat.</strong>", pt: "<strong>Fazer pelo menos 12 pontos em 1 habitat qualquer.</strong>" },
    fullyElk: { icon: "key-fully-score", en: "<strong>Fully score Elk once.</strong>", pt: "<strong>Pontuar Alces por completo 1 vez.</strong>", readEn: "one group reaches the top value of Elk card C: a group of 8+ elk → 28 points.", readPt: "um grupo atinge o valor máximo da carta Alce C: um grupo de 8+ alces → 28 pontos." },
    play5hawks: { icon: "key-play-wildlife", en: "<strong>Play at least 5 Hawks.</strong>", pt: "<strong>Jogar pelo menos 5 Gaviões.</strong>" },
    hawkElk: { icon: "key-wildlife-adjacent", en: "<strong>Hawks must be adjacent to Elk.</strong>", pt: "<strong>Gaviões precisam estar adjacentes a Alces.</strong>", readEn: "checked at the end of the game: every hawk touches at least one elk (an elk may be placed after the hawk).", readPt: "conferido no fim da partida: todo gavião encosta em pelo menos um alce (o alce pode ser colocado depois do gavião)." },
    mountainPrairie: { icon: "key-no-adjacent-habitat", en: "<strong>A Mountain edge may never touch a Prairie edge</strong> of another tile.", pt: "<strong>Uma borda de Montanha nunca pode tocar uma borda de Pradaria</strong> de outra peça." },
    wetlandRiver: { icon: "key-no-adjacent-habitat", en: "<strong>A Wetland edge may never touch a River edge</strong> of another tile.", pt: "<strong>Uma borda de Pântano nunca pode tocar uma borda de Rio</strong> de outra peça." },
    h35: { icon: "key-category-total", en: "<strong>Score at least 35 points in total from Habitats</strong> (the H subtotal).", pt: "<strong>Fazer pelo menos 35 pontos no total com Habitats</strong> (o subtotal H)." },
    any2w20: { icon: "key-any-wildlife", en: "<strong>Score at least 20 points with each of any 2 wildlife.</strong>", pt: "<strong>Fazer pelo menos 20 pontos com cada um de 2 animais quaisquer.</strong>" }
  };

  const SCENARIOS = [
    { target: 80, cards: "AAAAA", goals: [] },
    { target: 80, cards: "BBBBB", goals: [] },
    { target: 80, cards: "CCCCC", goals: [] },
    { target: 85, cards: "DDDDD", goals: [] },
    { target: 85, cards: "CDBBB", goals: [G.fullyFox] },
    { target: 85, cards: "DBCCB", goals: [G.play4] },
    { target: 90, cards: "BCCDC", goals: [G.hawk20] },
    { target: 90, cards: "CBBAD", goals: [G.nature5, G.bearElk] },
    { target: 90, cards: "CADCB", goals: [G.each10, G.habitat5] },
    { target: 95, cards: "CBDBB", goals: [G.w60, G.any3h7] },
    { target: 95, cards: "BAACA", goals: [G.bear30, G.forestRiver] },
    { target: 95, cards: "ABAAC", goals: [G.fullySalmon, G.elkForest, G.any1h12] },
    { target: 100, cards: "DCCBC", goals: [G.fullyElk, G.play5hawks, G.hawkElk] },
    { target: 100, cards: "ACBAD", goals: [G.mountainPrairie, G.wetlandRiver, G.h35] },
    { target: 100, cards: "ADADA", goals: [G.nature5, G.any3h7, G.any2w20] }
  ];

  // Achievements · Rule Restrictions (rulebook p. 14).
  const RESTRICTIONS = [
    { en: "At least one Habitat must match when placing tiles.", pt: "Pelo menos um Habitat precisa combinar ao colocar peças.",
      readEn: "each new tile must have at least one edge whose habitat matches the edge it touches on a tile already in your environment.", readPt: "cada peça nova precisa ter pelo menos uma borda cujo habitat combine com a borda que ela toca numa peça já presente no seu ambiente." },
    { en: "No matching Habitats may touch when placing tiles. Ignore Habitat scoring this game.", pt: "Nenhum Habitat igual pode se tocar ao colocar peças. Ignore a pontuação de Habitats nesta partida.",
      readEn: "no edge of the new tile may touch an edge of the same habitat; final scoring skips steps 2 and 3 (corridors and majorities).", readPt: "nenhuma borda da peça nova pode tocar uma borda do mesmo habitat; a pontuação final pula as etapas 2 e 3 (corredores e maiorias)." },
    { en: "Habitat scoring change: all Habitat corridors of exactly three count for 3 points each.", pt: "Mudança na pontuação de Habitats: todo corredor de exatamente três peças vale 3 pontos.",
      readEn: "this replaces step 2 (largest corridor); the majorities of step 3 still compare each player's largest corridor, as their rule says.", readPt: "isso substitui a etapa 2 (maior corredor); as maiorias da etapa 3 continuam comparando o maior corredor de cada jogador, como diz a regra delas." },
    { en: "Habitat scoring change: Habitat corridors must be 5+ in size to score.", pt: "Mudança na pontuação de Habitats: corredores precisam ter 5+ peças para pontuar.",
      readEn: "a largest corridor of 1–4 tiles scores 0 in step 2; the majorities of step 3 still compare each player's largest corridor.", readPt: "um maior corredor de 1–4 peças vale 0 na etapa 2; as maiorias da etapa 3 continuam comparando o maior corredor de cada jogador." },
    { en: "Play with a display of only three pairs of tiles/tokens.", pt: "Jogue com uma oferta de apenas três pares de peça/ficha.",
      readEn: "reveal 3 tiles and 3 tokens, and return one more random tile to the box at setup so each player still plays 20 turns; three identical tokens are the 3-of-a-kind case (optional wipe, once per turn).", readPt: "revele 3 peças e 3 fichas e devolva mais uma peça aleatória à caixa na preparação, para cada jogador ainda fazer 20 turnos; três fichas iguais são o caso de 3 iguais (renovação opcional, uma vez por turno)." },
    { en: "Play with two sets of Wildlife Scoring Cards — players each choose which of the two they wish to score.", pt: "Jogue com dois conjuntos de Cartas de Pontuação — cada jogador escolhe qual dos dois quer pontuar.",
      readEn: "draw 2 random cards per wildlife and lay them out as two rows of 5 (set 1 and set 2); at final scoring each player picks one whole set for all five wildlife.", readPt: "tire 2 cartas aleatórias por animal e arrume-as em duas fileiras de 5 (conjunto 1 e conjunto 2); na pontuação final cada jogador escolhe um conjunto inteiro para os cinco animais." },
    { en: "Do not use Starter Habitat Tiles. Instead, each player's environment starts with two random Habitat Tiles.", pt: "Não use as Peças Iniciais de Habitat. Em vez disso, o ambiente de cada jogador começa com duas Peças de Habitat aleatórias.",
      readEn: "deal them face up from the tiles counted for this game, before stacking, and place your two touching; the stack is then 2 tiles per player shorter, so everyone plays 18 turns.", readPt: "distribua-as viradas para cima dentre as peças contadas para a partida, antes de empilhar, e coloque as suas duas encostadas; a pilha fica 2 peças por jogador menor, então todos fazem 18 turnos." },
    { en: "Two Nature Tokens are required to take a Nature Token action.", pt: "São necessárias duas Fichas de Natureza para fazer uma ação de Ficha de Natureza." },
    { en: "You may not place the Wildlife Token on the Habitat Tile you just placed.", pt: "Você não pode colocar a Ficha de Animal na Peça de Habitat que acabou de colocar." },
    { en: "Play with revealing scoring cards — each player starts with one of the five Wildlife Scoring Cards in their hand (secret), and any remaining are public on the table. When you play a Nature Token, reveal your scoring card by placing it face up on the table.", pt: "Jogue revelando cartas de pontuação — cada jogador começa com uma das cinco Cartas de Pontuação na mão (secreta), e as restantes ficam públicas na mesa. Quando você usar uma Ficha de Natureza, revele sua carta colocando-a virada para cima na mesa.",
      readEn: "shuffle the five drawn cards face down and deal one to each player, who looks only at their own; the others go face up. All five cards still score for everyone at the end.", readPt: "embaralhe as cinco cartas sorteadas viradas para baixo e dê uma a cada jogador, que olha só a sua; as outras ficam viradas para cima. As cinco cartas continuam pontuando para todos no fim." }
  ];

  // Achievements · Normal Game (rulebook p. 14).
  const NORMAL_ACHIEVEMENTS = [
    ["Score 80+ Points", "Fazer 80+ pontos"], ["Score 85+ Points", "Fazer 85+ pontos"], ["Score 90+ Points", "Fazer 90+ pontos"],
    ["Score 95+ Points", "Fazer 95+ pontos"], ["Score 100+ Points", "Fazer 100+ pontos"], ["Score 105+ Points", "Fazer 105+ pontos"],
    ["Score 110+ Points", "Fazer 110+ pontos"], ["Have no Nature Tokens left", "Não ter nenhuma Ficha de Natureza sobrando"],
    ["Have no Bears", "Não ter Ursos"], ["Have no Elk", "Não ter Alces"], ["Have no Salmon", "Não ter Salmões"],
    ["Have no Hawks", "Não ter Gaviões"], ["Have no Foxes", "Não ter Raposas"], ["Have more than 10 of a single Wildlife", "Ter mais de 10 de um mesmo animal"],
    ["Win Majority for 3 Habitats", "Vencer a maioria em 3 Habitats"], ["Score 5+ Points for all Habitats", "Fazer 5+ pontos em todos os Habitats"],
    ["Score 12+ Points for a single Habitat", "Fazer 12+ pontos num mesmo Habitat"], ["Score 15+ Points from a single Habitat", "Fazer 15+ pontos num mesmo Habitat"],
    ["Score 10+ Points for each Wildlife", "Fazer 10+ pontos com cada animal"], ["Score 20+ Points for two Wildlife", "Fazer 20+ pontos com dois animais"],
    ["Score 30+ Points for a single Wildlife", "Fazer 30+ pontos com um mesmo animal"], ["End the game with 5+ Nature Tokens", "Terminar a partida com 5+ Fichas de Natureza"],
    ["End the game with 10+ Nature Tokens", "Terminar a partida com 10+ Fichas de Natureza"], ["Have no completed Keystone Habitats", "Não ter nenhuma Peça-chave completada"],
    ["Only have 3 types of Wildlife", "Ter só 3 tipos de animal"]
  ];

  const PLAYER_COUNTS = ["1", "2", "3", "4"];
  const CARD_MODES = ["standard", "family", "intermediate"];
  const DEALS = ["recommended", "random"];
  const YES_NO = ["yes", "no"];
  const ACHIEVEMENT_MODES = ["none", "scenario", "normal", "restriction"];
  const defaults = { language: "pt-BR", players: "2", cards: "standard", deal: "recommended", majority: "yes", achievements: "none", scenario: "1", restriction: "1" };
  const storageIssues = new Set();
  let notice = null;
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------

  function normalizePreferences(saved) {
    const next = {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      players: PLAYER_COUNTS.includes(String(saved?.players)) ? String(saved.players) : defaults.players,
      cards: CARD_MODES.includes(saved?.cards) ? saved.cards : defaults.cards,
      deal: DEALS.includes(saved?.deal) ? saved.deal : defaults.deal,
      majority: YES_NO.includes(saved?.majority) ? saved.majority : defaults.majority,
      achievements: ACHIEVEMENT_MODES.includes(saved?.achievements) ? saved.achievements : defaults.achievements,
      scenario: /^(?:[1-9]|1[0-5])$/.test(String(saved?.scenario)) ? String(saved.scenario) : defaults.scenario,
      restriction: /^(?:[1-9]|10)$/.test(String(saved?.restriction)) ? String(saved.restriction) : defaults.restriction
    };
    // Achievement modes use the standard A–D cards; Normal Game and Rule Restrictions are multi-player only.
    if (next.cards !== "standard") {
      next.achievements = "none";
    }
    if (next.players === "1" && (next.achievements === "normal" || next.achievements === "restriction")) {
      next.achievements = "none";
    }
    return next;
  }

  // Only choices that change the physical preparation clear the checklist (never the language or majority scoring).
  function signature(source = state) {
    const mode = source.achievements;
    return [
      source.players,
      source.cards,
      source.cards === "standard" ? effectiveDeal(source) : "-",
      mode === "scenario" ? `s${source.scenario}` : "",
      mode === "restriction" ? `r${source.restriction}` : ""
    ].join("|");
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Cascadia preferences.", error);
      return normalizePreferences(defaults);
    }
  }

  function loadSetup() {
    try {
      const raw = localStorage.getItem(SETUP_KEY);
      if (!raw) {
        return { signature: signature(), checks: [] };
      }
      const saved = JSON.parse(raw);
      const valid = phaseIds();
      return {
        signature: signature(),
        checks: saved?.signature === signature() && Array.isArray(saved.checks)
          ? [...new Set(saved.checks.filter((id) => valid.includes(id)))]
          : []
      };
    } catch (error) {
      storageIssues.add("setup-read");
      console.error("Could not read Cascadia setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Cascadia preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Cascadia setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function players() {
    return Number(state.players);
  }

  function solo() {
    return state.players === "1";
  }

  function standard() {
    return state.cards === "standard";
  }

  function mode() {
    return state.achievements;
  }

  function scenario() {
    return mode() === "scenario" ? SCENARIOS[Number(state.scenario) - 1] : null;
  }

  function restriction() {
    return mode() === "restriction" ? Number(state.restriction) : 0;
  }

  function hasRestriction(number) {
    return restriction() === number;
  }

  // Rule restrictions 6 and 10 need random cards (a recommended A set would make them meaningless).
  function effectiveDeal(source = state) {
    if (source.achievements === "scenario") {
      return "scenario";
    }
    if (source.achievements === "restriction" && (source.restriction === "6" || source.restriction === "10")) {
      return "random";
    }
    return source.deal;
  }

  function majorityOn() {
    return standard() || state.majority === "yes";
  }

  function habitatScoringOn() {
    return !hasRestriction(2);
  }

  // 2 players: 43 tiles, 3: 63, 4: 83 (20 per player + 3); solo uses the 2-player count (rulebook pp. 4, 10).
  function tileCount() {
    const base = solo() ? 43 : players() * 20 + 3;
    return hasRestriction(5) ? base - 1 : base;
  }

  function turnsEach() {
    return hasRestriction(7) ? 18 : 20;
  }

  function displaySize() {
    return hasRestriction(5) ? 3 : 4;
  }

  function scriptBase() {
    const script = document.querySelector('script[src*="cascadia.js"]');
    return script?.src || document.baseURI;
  }

  function manualUrl(page) {
    return `${new URL(`manuals/${MANUAL}`, scriptBase()).href}#page=${page}`;
  }

  function referenceLink(page) {
    return `<a class="source-link" href="${manualUrl(page)}" target="_blank" rel="noreferrer">${t(`Rulebook p. ${page} ↗`, `Manual p. ${page} ↗`)}</a>`;
  }

  function uniquePages(pages) {
    return [...new Set(Array.isArray(pages) ? pages : [pages])].sort((a, b) => a - b);
  }

  function refs(pages) {
    return uniquePages(pages).map(referenceLink).join(" ");
  }

  function sectionHeading(id, title, index, pages) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("PACIFIC NORTHWEST", "NOROESTE DO PACÍFICO")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="csc-section-references">${uniquePages(pages).map(referenceLink).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
  }

  function interpretation(en, pt) {
    return `<span class="csc-interpretation">${t("Guide's reading", "Leitura do guia")}</span> ${t(en, pt)}`;
  }

  // The supplied rulebook is in English: in PT-BR, show the printed English term so it can be matched.
  function en(term) {
    return state.language === "pt-BR" ? ` <span class="csc-en" lang="en">(${term})</span>` : "";
  }

  function icon(file, alt) {
    return `<img class="csc-inline-icon" src="${ICONS}${file}.webp" alt="${alt}">`;
  }

  function wName(id) {
    return t(WILDLIFE[id].en, WILDLIFE[id].pt);
  }

  function wPlural(id) {
    return t(WILDLIFE[id].plEn, WILDLIFE[id].plPt);
  }

  function hName(id) {
    return t(HABITATS[id].en, HABITATS[id].pt);
  }

  function token(id) {
    return `<span class="csc-nowrap">${icon(`token-${id}`, wName(id))}<strong>${wName(id)}</strong></span>`;
  }

  function habitat(id) {
    return `<span class="csc-nowrap">${icon(`habitat-${id}`, hName(id))}<strong>${hName(id)}</strong></span>`;
  }

  function allTokens() {
    return WILDLIFE_IDS.map(token).join(" · ");
  }

  function allHabitats() {
    return HABITAT_IDS.map(habitat).join(" · ");
  }

  function natureIcon() {
    return icon("nature-token", t("Nature Token", "Ficha de Natureza"));
  }

  function iconCard(file, titleEn, bodyEn, titlePt, bodyPt, page, extraClass = "") {
    const title = t(titleEn, titlePt);
    return `
      <article class="icon-card ${extraClass}">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}.webp" alt="${title}"></span>
        <div><strong>${title}</strong><p>${t(bodyEn, bodyPt)}</p>${referenceLink(page)}</div>
      </article>`;
  }

  function infoCard(label, title, lines, pages, extraClass = "") {
    return `
      <article class="info-card ${extraClass}">
        <span class="component-label">${label}</span>
        <h3>${title}</h3>
        ${lineList(lines)}
        ${refs(pages)}
      </article>`;
  }

  function figure(file, captionEn, captionPt, page, extraClass = "") {
    const caption = t(captionEn, captionPt);
    return `
      <figure class="csc-figure ${extraClass}">
        <img src="${ART}${file}.webp" alt="${caption}" loading="lazy">
        <figcaption>${caption} ${referenceLink(page)}</figcaption>
      </figure>`;
  }

  function playersLabel(count = state.players) {
    return count === "1" ? t("Solo (1 player)", "Solo (1 jogador)") : t(`${count} players`, `${count} jogadores`);
  }

  function cardModeLabel(value = state.cards) {
    return {
      standard: t("Standard Wildlife Scoring Cards", "Cartas de Pontuação padrão"),
      family: t("Family Variant", "Variante Família"),
      intermediate: t("Intermediate Variant", "Variante Intermediária")
    }[value];
  }

  function cardCode(id, letter) {
    return `${wName(id)} ${letter}`;
  }

  function scenarioCardList(data) {
    return WILDLIFE_IDS.map((id, index) => cardCode(id, data.cards[index])).join(", ");
  }

  // Which cards the guide must show for each wildlife: the fixed letter, or all four when drawn at random.
  function lettersFor(id) {
    if (!standard()) {
      return [];
    }
    const deal = effectiveDeal();
    if (deal === "scenario") {
      return [scenario().cards[WILDLIFE_IDS.indexOf(id)]];
    }
    if (deal === "recommended") {
      return ["A"];
    }
    return LETTERS;
  }

  function cardChips() {
    if (!standard()) {
      return `<div class="csc-card-chips"><span class="csc-card-chip">${cardModeLabel()}</span></div>`;
    }
    const deal = effectiveDeal();
    return `<div class="csc-card-chips">${WILDLIFE_IDS.map((id) => {
      const letters = lettersFor(id);
      const label = letters.length === 1 ? letters[0] : t(hasRestriction(6) ? "2 random" : "random", hasRestriction(6) ? "2 aleatórias" : "aleatória");
      return `<span class="csc-card-chip"><img src="${ICONS}token-${id}.webp" alt="">${wName(id)} (${label})</span>`;
    }).join(" ")}</div>${deal === "random" && !hasRestriction(6) ? `<p class="csc-note">${hasRestriction(10) ? t("Note the letters of the face-up cards; the secret cards are read when they are revealed (when spending a Nature Token, or at final scoring).", "Anote as letras das cartas viradas para cima; as secretas são lidas quando forem reveladas (ao gastar uma Ficha de Natureza, ou na pontuação final).") : t("Note the letter (bottom-right corner) of the card drawn for each wildlife and read that card in “Wildlife Scoring Cards”.", "Anote a letra (canto inferior direito) da carta sorteada para cada animal e leia essa carta em “Cartas de Pontuação”.")}</p>` : ""}`;
  }

  function majorityLines() {
    if (!habitatScoringOn()) {
      return [t("Rule restriction 2: habitat scoring is ignored this game — no corridor points and no majority bonuses.", "Restrição 2: a pontuação de habitats é ignorada nesta partida — sem pontos de corredor e sem bônus de maioria.")];
    }
    if (!majorityOn()) {
      return [t("Skipped in this match (Family/Intermediate option): no habitat bonus.", "Pulada nesta partida (opção da Família/Intermediária): sem bônus de habitat.")];
    }
    if (solo()) {
      return [rl("Solo", "+2 points for each habitat whose largest corridor has 7 or more tiles.", "Solo", "+2 pontos para cada habitat cujo maior corredor tem 7 ou mais peças.")];
    }
    if (players() === 2) {
      return [
        rl("Largest", "+2 to the player with the largest corridor of that habitat.", "Maior", "+2 para quem tem o maior corredor daquele habitat."),
        interpretation("a player with no tile of a habitat cannot take its bonus.", "um jogador sem nenhuma peça de um habitat não pode levar o bônus dele."),
        rl("Tie", "+1 each. No bonus for second largest.", "Empate", "+1 para cada. Sem bônus para o segundo maior.")
      ];
    }
    return [
      rl("Largest", "+3; second largest +1.", "Maior", "+3; segundo maior +1."),
      rl("Two tie for largest", "+2 each, nothing for the next largest.", "Dois empatam no maior", "+2 para cada, nada para o próximo."),
      players() === 3 ? rl("All three tie for largest", "+1 each.", "Os três empatam no maior", "+1 para cada.") : rl("Three or four tie for largest", "+1 each, nothing for the next largest.", "Três ou quatro empatam no maior", "+1 para cada, nada para o próximo."),
      rl("Tie for second largest", "0 points each.", "Empate no segundo maior", "nenhum ponto para eles."),
      interpretation("a player with no tile of a habitat cannot take its bonus.", "um jogador sem nenhuma peça de um habitat não pode levar o bônus dele.")
    ];
  }

  // ---------- sections ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Reference", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["turn", t("Your turn", "Seu turno")],
      ["wildlife-cards", t("Wildlife Scoring Cards", "Cartas de Pontuação")],
      ["end-game", t("End game & scoring", "Fim e pontuação")],
      mode() !== "none" ? ["achievements", t("Achievements", "Conquistas")] : null,
      ["icons", t("Iconography", "Iconografia")],
      ["examples", t("Examples", "Exemplos")],
      ["glossary", t("Glossary", "Glossário")]
    ].filter(Boolean);
  }

  function sectionNav() {
    return sectionList().map(([id, label], index) => `
      <button type="button" data-scroll="${id}"><span class="toc-index">${String(index + 1).padStart(2, "0")}</span>${label}</button>`).join("");
  }

  function sectionIndex(id) {
    return String(sectionList().findIndex(([sid]) => sid === id) + 1).padStart(2, "0");
  }

  function renderHeader() {
    return `
      <header class="site-header">
        <a class="brand" href="#/" aria-label="${t("Field Manual home", "Página inicial do Manual de Campo")}">
          <span class="brand-mark" aria-hidden="true">CA</span>
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

  function storageNoticeText() {
    const readFailed = storageIssues.has("preferences-read") || storageIssues.has("setup-read");
    const writeFailed = storageIssues.has("preferences-write") || storageIssues.has("setup-write");
    return t(
      `${readFailed ? "This browser could not read the saved Cascadia match or setup progress; defaults are shown. " : ""}${writeFailed ? "The latest change could not be saved and is visible on screen only." : ""}`,
      `${readFailed ? "Este navegador não conseguiu ler a partida ou o progresso de Cascadia salvos; as opções padrão estão sendo mostradas. " : ""}${writeFailed ? "A alteração mais recente não pôde ser salva e aparece somente na tela." : ""}`
    ).trim();
  }

  // ---------- configuration ----------

  function choiceCard(name, value, dataAttr, checked, title, description) {
    return `
      <label class="csc-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" ${dataAttr} ${checked ? "checked" : ""}>
        <span class="csc-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function group(legend, selected, intro, cards, columns = "") {
    return `
      <fieldset class="csc-choice-group">
        <legend>${legend} <span>${selected}</span></legend>
        <p class="csc-choice-intro">${intro}</p>
        <div class="csc-choice-grid ${columns}">${cards}</div>
      </fieldset>`;
  }

  function playerChoiceText(count) {
    const n = Number(count);
    if (n === 1) {
      return t(
        "Set up like 2 players (43 Habitat Tiles) with only your Starter Habitat Tile. Each turn the tile and token furthest from the stacks are discarded. Habitat bonus: +2 per habitat with a corridor of 7+. Compare your score to the rating chart.",
        "Prepare como para 2 jogadores (43 Peças de Habitat) com só a sua Peça Inicial. A cada turno a peça e a ficha mais distantes das pilhas são descartadas. Bônus de habitat: +2 por habitat com corredor de 7+. Compare sua pontuação com a tabela de avaliação."
      );
    }
    const tiles = n * 20 + 3;
    return t(
      `${tiles} Habitat Tiles (remove ${85 - tiles}), ${n} Starter Habitat Tiles. Habitat majority: ${n === 2 ? "+2 for the largest corridor, +1 each if tied" : "+3 for the largest corridor, +1 for second largest"}. Each player plays exactly 20 turns.`,
      `${tiles} Peças de Habitat (remova ${85 - tiles}), ${n} Peças Iniciais. Maioria de habitat: ${n === 2 ? "+2 para o maior corredor, +1 para cada se empatar" : "+3 para o maior corredor, +1 para o segundo maior"}. Cada jogador faz exatamente 20 turnos.`
    );
  }

  function scenarioChoiceText(index) {
    const data = SCENARIOS[index];
    const extra = data.goals.length;
    return t(
      `Score ${data.target}+${extra ? ` and ${extra} more objective${extra === 1 ? "" : "s"}` : ""}. Cards: ${scenarioCardList(data)}.`,
      `Faça ${data.target}+${extra ? ` e mais ${extra} objetivo${extra === 1 ? "" : "s"}` : ""}. Cartas: ${scenarioCardList(data)}.`
    );
  }

  function matchConfiguration() {
    const groups = [];
    groups.push(group(t("Players · selected:", "Jogadores · selecionado:"), playersLabel(),
      `${t("Cascadia plays 1 to 4. The player count sets how many Habitat Tiles are used and the habitat bonus; solo changes how the display is refilled.", "Cascadia é para 1 a 4 jogadores. O número de jogadores define quantas Peças de Habitat são usadas e o bônus de habitat; no solo muda a forma de repor a oferta.")} ${referenceLink(4)} ${referenceLink(10)}`,
      PLAYER_COUNTS.map((count) => choiceCard("csc-players", count, `data-players="${count}"`, state.players === count, playersLabel(count), playerChoiceText(count))).join("")));

    groups.push(group(t("Wildlife scoring · selected:", "Pontuação dos animais · selecionado:"), cardModeLabel(),
      `${t("How wildlife scores is set by the cards in the middle of the table. The standard game uses one of four cards (A–D) per wildlife; the two variants replace them all with one simpler card.", "A forma como os animais pontuam é definida pelas cartas no meio da mesa. O jogo padrão usa uma de quatro cartas (A–D) por animal; as duas variantes trocam todas por uma carta mais simples.")} ${referenceLink(4)} ${referenceLink(10)}`,
      [
        choiceCard("csc-cards", "standard", 'data-cards="standard"', state.cards === "standard", cardModeLabel("standard"), t("5 cards on the table, one per wildlife (Bear, Elk, Salmon, Hawk, Fox), each with its own pattern: pairs of bears, lines of elk, runs of salmon, spread-out hawks, foxes beside other animals. Habitat majorities are always scored.", "5 cartas na mesa, uma por animal (Urso, Alce, Salmão, Gavião, Raposa), cada uma com seu padrão: pares de ursos, linhas de alces, corridas de salmões, gaviões espalhados, raposas ao lado de outros animais. As maiorias de habitat sempre pontuam.")),
        choiceCard("csc-cards", "family", 'data-cards="family"', state.cards === "family", cardModeLabel("family"), t("Only the Family Variant card: every wildlife scores the same way, by group size (1 → 2, 2 → 5, 3+ → 9 points). Turns are unchanged. You may skip the habitat majority bonus.", "Só a carta da Variante Família: todos os animais pontuam igual, pelo tamanho do grupo (1 → 2, 2 → 5, 3+ → 9 pontos). Os turnos não mudam. Você pode pular o bônus de maioria de habitat.")),
        choiceCard("csc-cards", "intermediate", 'data-cards="intermediate"', state.cards === "intermediate", cardModeLabel("intermediate"), t("The other side of the same card: group sizes score differently (values printed on the card, not in the rulebook). Otherwise identical to the Family Variant.", "O outro lado da mesma carta: os tamanhos de grupo pontuam de outra forma (valores impressos na carta, não no manual). No resto, igual à Variante Família."))
      ].join(""), "is-three"));

    if (standard() && mode() !== "scenario") {
      const forced = effectiveDeal() === "random" && state.deal !== "random";
      groups.push(group(t("Which cards · selected:", "Quais cartas · selecionado:"), effectiveDeal() === "recommended" ? t("Recommended A cards", "Cartas A recomendadas") : t("Random, one per wildlife", "Aleatórias, uma por animal"),
        `${t("The rulebook draws one card per wildlife at random, and recommends the cards marked “A” for a first game.", "O manual sorteia uma carta por animal e recomenda as cartas marcadas com “A” para a primeira partida.")} ${forced ? t("Rule restriction 6 or 10 needs random cards, so they are drawn at random this match.", "A restrição 6 ou 10 precisa de cartas aleatórias, então elas são sorteadas nesta partida.") : ""} ${referenceLink(4)}`,
        [
          choiceCard("csc-deal", "recommended", 'data-deal="recommended"', state.deal === "recommended", t("First game: the A cards", "Primeira partida: as cartas A"), t("Bear A (pairs), Elk A (straight lines), Salmon A (runs up to 7), Hawk A (isolated hawks), Fox A (different neighbours). Everyone knows the cards in advance; the guide shows only these five.", "Urso A (pares), Alce A (linhas retas), Salmão A (corridas até 7), Gavião A (gaviões isolados), Raposa A (vizinhos diferentes). Todos conhecem as cartas de antemão; o guia mostra só essas cinco.")),
          choiceCard("csc-deal", "random", 'data-deal="random"', state.deal === "random", t("Random: 1 of 4 per wildlife", "Aleatórias: 1 de 4 por animal"), t("Shuffle each wildlife's 4 cards (A–D) and draw one: 1,024 possible combinations. You only know them at setup, so the guide shows all four cards of each wildlife.", "Embaralhe as 4 cartas (A–D) de cada animal e tire uma: 1.024 combinações possíveis. Você só as conhece na preparação, então o guia mostra as quatro cartas de cada animal."))
        ].join(""), "is-pair"));
    }

    if (!standard()) {
      groups.push(group(t("Habitat majority bonus · selected:", "Bônus de maioria de habitat · selecionado:"), state.majority === "yes" ? t("Scored", "Pontuado") : t("Skipped", "Pulado"),
        `${t("With the Family or Intermediate card you may choose whether to score step 3 of final scoring.", "Com a carta Família ou Intermediária você pode escolher se pontua a etapa 3 da pontuação final.")} ${referenceLink(10)}`,
        [
          choiceCard("csc-majority", "yes", 'data-majority="yes"', state.majority === "yes", t("Yes — score the habitat bonus", "Sim — pontuar o bônus de habitat"), solo() ? t("Solo: +2 for each habitat with a corridor of 7 or more tiles.", "Solo: +2 para cada habitat com corredor de 7 ou mais peças.") : t(`Bonus points for the largest corridor of each habitat (${players() === 2 ? "2 / tie 1 each" : "3 and 1 for second"}).`, `Pontos extras para o maior corredor de cada habitat (${players() === 2 ? "2 / empate 1 cada" : "3, e 1 para o segundo"}).`)),
          choiceCard("csc-majority", "no", 'data-majority="no"', state.majority === "no", t("No — skip step 3", "Não — pular a etapa 3"), t("Each habitat still scores 1 point per tile of your largest corridor, but nobody gets bonus points. Simpler for young players.", "Cada habitat ainda vale 1 ponto por peça do seu maior corredor, mas ninguém ganha pontos extras. Mais simples para crianças."))
        ].join(""), "is-pair"));
    }

    if (standard()) {
      const multi = !solo();
      groups.push(group(t("Achievements · selected:", "Conquistas · selecionado:"), {
        none: t("None", "Nenhuma"), scenario: t(`Scenario ${state.scenario}`, `Cenário ${state.scenario}`), normal: t("Normal Game", "Partida normal"), restriction: t(`Rule restriction ${state.restriction}`, `Restrição ${state.restriction}`)
      }[mode()],
        `${t("Optional long-term goals tracked on the rulebook's hiking chart (pages 12–14). Each game you may play in one Achievement mode.", "Objetivos opcionais de longo prazo marcados no mapa de trilha do manual (páginas 12–14). Em cada partida você pode jogar num modo de Conquistas.")} ${solo() ? t("Solo can use Scenarios only; Normal Game and Rule Restrictions are multi-player.", "No solo só há Cenários; Partida normal e Restrições são para vários jogadores.") : ""} ${referenceLink(12)}`,
        [
          choiceCard("csc-ach", "none", 'data-achievements="none"', mode() === "none", t("No achievements", "Sem conquistas"), t("Play the game as configured above; nothing is tracked.", "Jogue a partida como configurada acima; nada é registrado.")),
          choiceCard("csc-ach", "scenario", 'data-achievements="scenario"', mode() === "scenario", t("Scenario (1–15)", "Cenário (1–15)"), t("The scenario fixes the 5 scoring cards and sets 1–4 objectives (always a target score) that must all be met. Everyone who passes fills in a shape. Solo or multi-player.", "O cenário fixa as 5 cartas de pontuação e define 1–4 objetivos (sempre uma pontuação-alvo) que precisam ser todos cumpridos. Quem passa preenche uma forma. Solo ou vários jogadores.")),
          multi ? choiceCard("csc-ach", "normal", 'data-achievements="normal"', mode() === "normal", t("Normal Game", "Partida normal"), t("Normal rules. Afterwards the winner may fill in one achievement from a list of 25 (e.g. Score 90+ Points, Have no Bears).", "Regras normais. Depois, o vencedor pode preencher uma conquista de uma lista de 25 (ex.: Fazer 90+ pontos, Não ter Ursos).")) : "",
          multi ? choiceCard("csc-ach", "restriction", 'data-achievements="restriction"', mode() === "restriction", t("Rule Restriction (1–10)", "Restrição de regra (1–10)"), t("Normal rules plus one restriction that changes placement, scoring, the display or the cards. The winner fills in that restriction's shape.", "Regras normais mais uma restrição que muda a colocação, a pontuação, a oferta ou as cartas. O vencedor preenche a forma dessa restrição.")) : ""
        ].join(""), multi ? "" : "is-pair"));

      if (mode() === "scenario") {
        groups.push(group(t("Scenario · selected:", "Cenário · selecionado:"), t(`${state.scenario} · ${scenario().target}+ points`, `${state.scenario} · ${scenario().target}+ pontos`),
          `${t("Scenarios get harder from 1 to 15; solo players are advised to go in order. In multi-player choose any.", "Os cenários ficam mais difíceis de 1 a 15; no solo, recomenda-se seguir a ordem. Com vários jogadores, escolha qualquer um.")} ${referenceLink(13)}`,
          SCENARIOS.map((data, index) => choiceCard("csc-scenario", String(index + 1), `data-scenario="${index + 1}"`, state.scenario === String(index + 1), t(`Scenario ${index + 1}`, `Cenário ${index + 1}`), scenarioChoiceText(index))).join(""), "is-five"));
      }
      if (mode() === "restriction") {
        groups.push(group(t("Rule restriction · selected:", "Restrição · selecionado:"), state.restriction,
          `${t("Exactly one restriction per game.", "Exatamente uma restrição por partida.")} ${referenceLink(14)}`,
          RESTRICTIONS.map((data, index) => choiceCard("csc-restriction", String(index + 1), `data-restriction="${index + 1}"`, state.restriction === String(index + 1), t(`Restriction ${index + 1}`, `Restrição ${index + 1}`), t(data.en, data.pt))).join(""), "is-five"));
      }
    } else {
      groups.push(`<p class="csc-config-summary">${t("Achievements are not offered with the Family or Intermediate card: scenarios name the standard A–D cards, and Normal Game / Rule Restrictions say to use the normal rules. Choose the standard cards to use them.", "As Conquistas não são oferecidas com a carta Família ou Intermediária: os cenários indicam as cartas padrão A–D, e Partida normal / Restrições mandam usar as regras normais. Escolha as cartas padrão para usá-las.")} ${interpretation("the rulebook does not combine the variants with achievements.", "o manual não combina as variantes com as conquistas.")}</p>`);
    }

    return `
      <section class="controls-panel csc-config" id="build-match" aria-labelledby="csc-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="csc-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "Choose the player count, how wildlife will score and, if you like, an Achievement mode. Everything below — setup, turn, scoring cards, final scoring, icons and examples — is filtered to this match and saved on this device only.",
              "Escolha o número de jogadores, como os animais vão pontuar e, se quiser, um modo de Conquistas. Tudo abaixo — preparação, turno, cartas de pontuação, pontuação final, ícones e exemplos — é filtrado para esta partida e salvo só neste aparelho."
            )}</p>
          </div>
        </div>
        ${notice ? `<p class="csc-config-notice" role="status">${notice}</p>` : ""}
        ${groups.join("")}
        <p class="csc-config-summary"><strong>${t("This match", "Esta partida")}:</strong> ${matchSummary()}</p>
      </section>`;
  }

  function matchSummary() {
    const parts = [playersLabel(), cardModeLabel()];
    if (standard()) {
      const deal = effectiveDeal();
      parts.push(deal === "scenario" ? scenarioCardList(scenario()) : deal === "recommended" ? t("A cards", "cartas A") : t(hasRestriction(6) ? "2 random cards per wildlife" : "random cards", hasRestriction(6) ? "2 cartas aleatórias por animal" : "cartas aleatórias"));
    } else {
      parts.push(state.majority === "yes" ? t("habitat bonus on", "com bônus de habitat") : t("no habitat bonus", "sem bônus de habitat"));
    }
    if (mode() === "scenario") {
      parts.push(t(`Scenario ${state.scenario} (${scenario().target}+)`, `Cenário ${state.scenario} (${scenario().target}+)`));
    } else if (mode() === "normal") {
      parts.push(t("Normal Game achievements", "conquistas da Partida normal"));
    } else if (mode() === "restriction") {
      parts.push(t(`Rule restriction ${state.restriction}`, `Restrição ${state.restriction}`));
    }
    parts.push(t(`${tileCount()} Habitat Tiles`, `${tileCount()} Peças de Habitat`), t(`${turnsEach()} turns each`, `${turnsEach()} turnos cada`));
    return parts.join(" · ");
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function cardsPhase() {
    const pages = [3, 4];
    const intro = t(
      `Find the <strong>21 Wildlife Scoring Cards</strong>${en("Wildlife Scoring Cards")}: 4 per wildlife (Bear, Elk, Salmon, Hawk, Fox — the letter A, B, C or D is in the bottom-right corner) and 1 double-sided Family/Intermediate card.`,
      `Encontre as <strong>21 Cartas de Pontuação de Animais</strong>${en("Wildlife Scoring Cards")}: 4 por animal (Urso, Alce, Salmão, Gavião, Raposa — a letra A, B, C ou D fica no canto inferior direito) e 1 carta dupla Família/Intermediária.`
    );
    if (state.cards === "family" || state.cards === "intermediate") {
      const family = state.cards === "family";
      return {
        id: "cards", title: t(`Scoring card · ${cardModeLabel()}`, `Carta de pontuação · ${cardModeLabel()}`), pages: [3, 4, 10], items: [
          intro,
          family
            ? t("Place the Family/Intermediate card in the center with the <strong>Family Variant</strong> side up (the 5 animals above a group-size table: 1 → 2, 2 → 5, 3+ → 9 points).", "Ponha a carta Família/Intermediária no centro com o lado <strong>Variante Família</strong> para cima (os 5 animais sobre uma tabela de tamanho de grupo: 1 → 2, 2 → 5, 3+ → 9 pontos).")
            : t("Place the Family/Intermediate card in the center with the <strong>Intermediate Variant</strong> side up (the side that is not marked Family Variant). Its group-size values are printed on it; the rulebook does not list them.", "Ponha a carta Família/Intermediária no centro com o lado <strong>Variante Intermediária</strong> para cima (o lado que não diz Family Variant). Os valores por tamanho de grupo estão impressos nela; o manual não os lista."),
          t("Return all 20 wildlife cards (A–D) to the box: this card alone scores every wildlife.", "Devolva as 20 cartas de animais (A–D) à caixa: só esta carta pontua todos os animais.")
        ]
      };
    }
    const deal = effectiveDeal();
    const items = [intro];
    if (deal === "scenario") {
      const data = scenario();
      items.push(t(`Scenario ${state.scenario} fixes the cards: place <strong>${scenarioCardList(data)}</strong> face up in the center, in view of everyone.`, `O Cenário ${state.scenario} fixa as cartas: ponha <strong>${scenarioCardList(data)}</strong> viradas para cima no centro, à vista de todos.`));
      items.push(t("Return the other 15 wildlife cards and the Family/Intermediate card to the box.", "Devolva as outras 15 cartas de animais e a carta Família/Intermediária à caixa."));
      pages.push(13);
    } else if (deal === "recommended") {
      items.push(t("Place <strong>Bear A, Elk A, Salmon A, Hawk A and Fox A</strong> face up in the center, in view of everyone (the rulebook's recommendation for a first game).", "Ponha <strong>Urso A, Alce A, Salmão A, Gavião A e Raposa A</strong> viradas para cima no centro, à vista de todos (a recomendação do manual para a primeira partida)."));
      items.push(t("Return the other 15 wildlife cards and the Family/Intermediate card to the box.", "Devolva as outras 15 cartas de animais e a carta Família/Intermediária à caixa."));
    } else if (hasRestriction(6)) {
      items.push(t("Sort the 20 wildlife cards into 5 piles of 4 (one pile per wildlife) and shuffle each pile face down.", "Separe as 20 cartas de animais em 5 montes de 4 (um monte por animal) e embaralhe cada monte virado para baixo."));
      items.push(`${t("Rule restriction 6: draw <strong>2 cards from each pile</strong>. Lay the first card of each wildlife face up as a row (set 1) and the second as a second row (set 2): 10 cards in two sets of 5.", "Restrição 6: tire <strong>2 cartas de cada monte</strong>. Arrume a primeira carta de cada animal virada para cima numa fileira (conjunto 1) e a segunda numa segunda fileira (conjunto 2): 10 cartas em dois conjuntos de 5.")} ${interpretation(RESTRICTIONS[5].readEn, RESTRICTIONS[5].readPt)}`);
      items.push(t("Return the other 10 wildlife cards and the Family/Intermediate card to the box.", "Devolva as outras 10 cartas de animais e a carta Família/Intermediária à caixa."));
      pages.push(14);
    } else if (hasRestriction(10)) {
      items.push(t("Sort the 20 wildlife cards into 5 piles of 4 (one per wildlife), shuffle each face down and draw 1 from each <strong>without looking</strong>.", "Separe as 20 cartas de animais em 5 montes de 4 (um por animal), embaralhe cada um virado para baixo e tire 1 de cada <strong>sem olhar</strong>."));
      items.push(`${t(`Rule restriction 10: shuffle those 5 cards face down and deal <strong>1 to each player</strong> (${players()} secret card${players() === 1 ? "" : "s"}). Look only at your own card and keep it hidden in your hand. Turn the remaining ${5 - players()} face up in the center.`, `Restrição 10: embaralhe essas 5 cartas viradas para baixo e dê <strong>1 a cada jogador</strong> (${players()} carta${players() === 1 ? "" : "s"} secreta${players() === 1 ? "" : "s"}). Olhe só a sua carta e mantenha-a escondida na mão. Vire as ${5 - players()} restantes para cima no centro.`)} ${interpretation(RESTRICTIONS[9].readEn, RESTRICTIONS[9].readPt)}`);
      items.push(t("Return the other 15 wildlife cards and the Family/Intermediate card to the box.", "Devolva as outras 15 cartas de animais e a carta Família/Intermediária à caixa."));
      pages.push(14);
    } else {
      items.push(t("Sort the 20 wildlife cards into 5 piles of 4 (one per wildlife: A, B, C, D), shuffle each pile face down and draw <strong>1 card from each</strong>.", "Separe as 20 cartas de animais em 5 montes de 4 (um por animal: A, B, C, D), embaralhe cada monte virado para baixo e tire <strong>1 carta de cada</strong>."));
      items.push(t("Place the 5 drawn cards face up in the center, in view of everyone, and note their letters: the guide's “Wildlife Scoring Cards” section explains every card.", "Ponha as 5 cartas tiradas viradas para cima no centro, à vista de todos, e anote as letras: a seção “Cartas de Pontuação” do guia explica todas as cartas."));
      items.push(t("Return the other 15 wildlife cards and the Family/Intermediate card to the box.", "Devolva as outras 15 cartas de animais e a carta Família/Intermediária à caixa."));
    }
    return { id: "cards", title: t(hasRestriction(6) ? "Wildlife Scoring Cards · 2 sets of 5" : "Wildlife Scoring Cards · 5", hasRestriction(6) ? "Cartas de Pontuação · 2 conjuntos de 5" : "Cartas de Pontuação · 5"), pages, items };
  }

  function environmentPhase() {
    const n = players();
    if (hasRestriction(7)) {
      return {
        id: "environment", title: t("Starting environments · 2 Habitat Tiles each", "Ambientes iniciais · 2 Peças de Habitat cada"), pages: [4, 14], items: [
          t("Rule restriction 7: do not use Starter Habitat Tiles — return all 5 to the box.", "Restrição 7: não use as Peças Iniciais de Habitat — devolva as 5 à caixa."),
          `${t("Each player places the 2 Habitat Tiles dealt to them face up in front of them, touching each other along one side: that is the start of their environment.", "Cada jogador coloca as 2 Peças de Habitat que recebeu viradas para cima à sua frente, encostadas por um lado: esse é o início do seu ambiente.")} ${interpretation("the rulebook does not say how the two tiles are arranged; placing them side by side follows the normal placement rule.", "o manual não diz como as duas peças ficam; colocá-las lado a lado segue a regra normal de colocação.")}`
        ]
      };
    }
    return {
      id: "environment", title: solo() ? t("Your Starter Habitat Tile", "Sua Peça Inicial de Habitat") : t(`Starter Habitat Tiles · ${n}`, `Peças Iniciais de Habitat · ${n}`), pages: solo() ? [3, 4, 10] : [3, 4], items: [
        t(`Shuffle the <strong>5 Starter Habitat Tiles</strong>${en("Starter Habitat Tiles")} ${icon("starter-tile", "Starter Habitat Tile")} (each is 3 habitat hexes joined in a triangle) and deal ${solo() ? "<strong>1 to yourself</strong>" : "<strong>1 at random to each player</strong>"}, face up in front of ${solo() ? "you" : "them"}.`, `Embaralhe as <strong>5 Peças Iniciais de Habitat</strong>${en("Starter Habitat Tiles")} ${icon("starter-tile", "Peça Inicial de Habitat")} (cada uma tem 3 hexágonos de habitat unidos em triângulo) e dê ${solo() ? "<strong>1 para você</strong>" : "<strong>1 ao acaso a cada jogador</strong>"}, virada para cima à ${solo() ? "sua" : "frente de cada um"}${solo() ? " frente" : ""}.`),
        t(`Return the other ${5 - n} Starter Habitat Tile${5 - n === 1 ? "" : "s"} to the box.`, `Devolva as outras ${5 - n} Peça${5 - n === 1 ? "" : "s"} Inicia${5 - n === 1 ? "l" : "is"} à caixa.`),
        t(`This tile starts your <strong>environment</strong>: the whole arrangement of tiles and tokens in front of you. Every Habitat Tile you add must touch it or another tile already placed.`, `Esta peça inicia o seu <strong>ambiente</strong>${en("environment")}: todo o arranjo de peças e fichas à sua frente. Toda Peça de Habitat que você acrescentar precisa encostar nela ou em outra peça já colocada.`),
        `${t("One of its hexes carries the keystone marker on its edge and shows a single wildlife; place the tile any way round.", "Um dos hexágonos tem a marca de peça-chave na borda e mostra um único animal; coloque a peça em qualquer orientação.")} ${interpretation("each of the 3 hexes counts as a Habitat Tile for placing tokens, adjacency and corridors, and the marked hex is a Keystone Tile.", "cada um dos 3 hexágonos conta como uma Peça de Habitat para colocar fichas, adjacência e corredores, e o hexágono marcado é uma Peça-chave.")}`
      ]
    };
  }

  function setupPhases() {
    const n = players();
    const tiles = tileCount();
    const removed = 85 - tiles;
    const size = displaySize();
    const tileItems = [
      t(`The box holds <strong>85 Habitat Tiles</strong>${en("Habitat Tiles")} (single hexes with a wooden back; 25 of them are Keystone Tiles). Without looking at their faces, take <strong>${tiles}</strong> at random and return the other <strong>${removed}</strong> to the box unseen — they are not used this game.`, `A caixa tem <strong>85 Peças de Habitat</strong>${en("Habitat Tiles")} (hexágonos com verso de madeira; 25 delas são Peças-chave). Sem olhar as faces, pegue <strong>${tiles}</strong> ao acaso e devolva as outras <strong>${removed}</strong> à caixa sem ver — elas não são usadas nesta partida.`),
      solo()
        ? t("Solo uses the 2-player count: 43 tiles (remove 42).", "O solo usa a contagem de 2 jogadores: 43 peças (remova 42).")
        : t(`${n} players → ${n * 20 + 3} tiles: 20 per player plus 3 (2 players 43 · 3 players 63 · 4 players 83).`, `${n} jogadores → ${n * 20 + 3} peças: 20 por jogador mais 3 (2 jogadores 43 · 3 jogadores 63 · 4 jogadores 83).`),
      hasRestriction(5) ? `${t(`Rule restriction 5: take one tile fewer (${tiles} instead of ${tiles + 1}).`, `Restrição 5: pegue uma peça a menos (${tiles} em vez de ${tiles + 1}).`)} ${interpretation("with only 3 pairs this keeps every player at exactly 20 turns.", "com só 3 pares isso mantém cada jogador em exatamente 20 turnos.")}` : null,
      hasRestriction(7) ? t(`Rule restriction 7: shuffle the ${tiles} tiles face down, then deal <strong>2 to each player</strong> face up (${2 * n} tiles) before stacking the rest.`, `Restrição 7: embaralhe as ${tiles} peças viradas para baixo e dê <strong>2 a cada jogador</strong> viradas para cima (${2 * n} peças) antes de empilhar o resto.`) : null,
      t("Shuffle the tiles face down and stack them in any number of face-down stacks within reach of everyone.", "Embaralhe as peças viradas para baixo e empilhe-as em quantas pilhas quiser, viradas para baixo, ao alcance de todos."),
      solo() ? t("Solo: put the stacks at the <strong>left side</strong> of the play area; the display will run from them to the right.", "Solo: ponha as pilhas no <strong>lado esquerdo</strong> da área de jogo; a oferta vai delas para a direita.") : null
    ];
    const phases = [
      {
        id: "bag", title: t("Wildlife Tokens in the bag · 100", "Fichas de Animais no saco · 100"), pages: [3, 4], items: [
          t(`Put all <strong>100 Wildlife Tokens</strong>${en("Wildlife Tokens")} into the <strong>Cloth Bag</strong>${en("Cloth Bag")} ${icon("cloth-bag", "Cloth Bag")} and shake it well: 20 each of ${allTokens()}.`, `Ponha as <strong>100 Fichas de Animais</strong>${en("Wildlife Tokens")} no <strong>saco de pano</strong>${en("Cloth Bag")} ${icon("cloth-bag", "saco de pano")} e sacuda bem: 20 de cada — ${allTokens()}.`)
        ]
      },
      { id: "tiles", title: t(`Habitat Tile stacks · ${tiles}`, `Pilhas de Peças de Habitat · ${tiles}`), pages: hasRestriction(5) || hasRestriction(7) ? [4, 14] : solo() ? [4, 10] : [4], items: tileItems },
      cardsPhase(),
      environmentPhase(),
      {
        id: "display", title: t(`The display · ${size} pairs`, `A oferta · ${size} pares`), pages: hasRestriction(5) ? [4, 14] : solo() ? [4, 10] : [4], items: [
          t(`Reveal the top <strong>${size} Habitat Tiles</strong> from the stacks and lay them face up in a row in the center, within reach of everyone.`, `Revele as <strong>${size} Peças de Habitat</strong> do topo das pilhas e coloque-as viradas para cima numa fileira no centro, ao alcance de todos.`),
          t(`Draw <strong>${size} Wildlife Tokens</strong> from the bag one at a time and place one below each tile, in order, forming ${size} pairs of 1 tile + 1 token.`, `Tire <strong>${size} Fichas de Animais</strong> do saco, uma de cada vez, e coloque uma abaixo de cada peça, em ordem, formando ${size} pares de 1 peça + 1 ficha.`),
          solo() ? t("Solo: the row starts right next to the stacks. At the end of every turn the tile and the token furthest from the stacks are discarded.", "Solo: a fileira começa logo ao lado das pilhas. No fim de todo turno a peça e a ficha mais distantes das pilhas são descartadas.") : null,
          solo() ? t("Do not check for overpopulation now: you do it at the start of your first turn.", "Não confira a superpopulação agora: você faz isso no começo do seu primeiro turno.") : t("Do not check for overpopulation now: the first player does it at the start of their turn.", "Não confira a superpopulação agora: o primeiro jogador faz isso no começo do turno dele.")
        ]
      },
      {
        id: "supply", title: t("Nature Tokens and the Scorepad", "Fichas de Natureza e o bloco de pontuação"), pages: [3, 4, 8], items: [
          t(`Place the <strong>25 Nature Tokens</strong>${en("Nature Tokens")} ${natureIcon()} (pine cones) within reach of everyone as the supply. Nobody starts with any: you earn them by placing wildlife on Keystone Tiles.`, `Coloque as <strong>25 Fichas de Natureza</strong>${en("Nature Tokens")} ${natureIcon()} (pinhas) ao alcance de todos como reserva. Ninguém começa com nenhuma: elas são ganhas colocando animais em Peças-chave.`),
          t("Keep the <strong>Scorepad</strong> and a pen or pencil for final scoring (no pen is listed among the components).", "Separe o <strong>bloco de pontuação</strong> e uma caneta ou lápis para a pontuação final (nenhuma caneta consta dos componentes).")
        ]
      }
    ];
    if (mode() !== "none") {
      const items = [
        t("Open the rulebook at page 12 (Cascadia Achievements). Each player tracking achievements writes their name under one of the 5 colored hiking tracks — once; keep the same track in later games.", "Abra o manual na página 12 (Cascadia Achievements). Cada jogador que registra conquistas escreve o nome sob uma das 5 trilhas coloridas — uma vez só; mantenha a mesma trilha nas próximas partidas."),
        t(`Your track's shape — ${icon("shape-circle", "circle")} circle, ${icon("shape-oval", "oval")} oval, ${icon("shape-triangle", "triangle")} triangle, ${icon("shape-diamond", "diamond")} diamond or ${icon("shape-square", "square")} square — is the shape you fill in on pages 13–14 when you earn an achievement.`, `A forma da sua trilha — ${icon("shape-circle", "círculo")} círculo, ${icon("shape-oval", "oval")} oval, ${icon("shape-triangle", "triângulo")} triângulo, ${icon("shape-diamond", "losango")} losango ou ${icon("shape-square", "quadrado")} quadrado — é a forma que você preenche nas páginas 13–14 ao ganhar uma conquista.`)
      ];
      if (mode() === "scenario") {
        items.push(t(`Read Scenario ${state.scenario}'s objectives aloud (see “Achievements”): ${scenario().target}+ points${scenario().goals.length ? ` and ${scenario().goals.length} more` : ""}. All must be met at the end to pass.`, `Leia em voz alta os objetivos do Cenário ${state.scenario} (veja “Conquistas”): ${scenario().target}+ pontos${scenario().goals.length ? ` e mais ${scenario().goals.length}` : ""}. Todos precisam ser cumpridos no fim para passar.`));
      } else if (mode() === "restriction") {
        items.push(t(`Read rule restriction ${state.restriction} aloud so everyone plays by it: “${RESTRICTIONS[restriction() - 1].en}”`, `Leia a restrição ${state.restriction} em voz alta para todos jogarem com ela: “${RESTRICTIONS[restriction() - 1].pt}”`));
      } else {
        items.push(t("Glance at the 25 Normal Game achievements on page 14 (listed under “Achievements”): only the winner may fill one in after the game.", "Dê uma olhada nas 25 conquistas da Partida normal na página 14 (listadas em “Conquistas”): só o vencedor pode preencher uma depois da partida."));
      }
      phases.push({ id: "achievements", title: t("Achievement tracking", "Registro de conquistas"), pages: mode() === "scenario" ? [12, 13] : [12, 14], items });
    }
    phases.push({
      id: "first", title: solo() ? t("Start playing", "Comece a jogar") : t("First player", "Primeiro jogador"), pages: solo() ? [10] : [4, 5], items: solo()
        ? [t("You take every turn. Begin with turn 1 (see “Your turn”); you will play exactly 20 turns.", "Você faz todos os turnos. Comece pelo turno 1 (veja “Seu turno”); você fará exatamente 20 turnos.")]
        : [
          t("The player who most recently saw one of the game's wildlife (a bear, elk, salmon, hawk or fox) goes first — or choose the first player randomly.", "Quem viu mais recentemente um dos animais do jogo (urso, alce, salmão, gavião ou raposa) começa — ou sorteie o primeiro jogador."),
          t(`Play goes clockwise; each player will play exactly ${turnsEach()} turns.`, `O jogo segue em sentido horário; cada jogador fará exatamente ${turnsEach()} turnos.`)
        ]
    });
    return phases;
  }

  function inventory() {
    const n = players();
    const tiles = tileCount();
    const size = displaySize();
    const dealt = hasRestriction(7) ? 2 * n : 0;
    const stack = tiles - size - dealt;
    let cardsLine;
    let cardsBox;
    if (!standard()) {
      cardsLine = t(`1 card, ${state.cards === "family" ? "Family" : "Intermediate"} side up.`, `1 carta, lado ${state.cards === "family" ? "Família" : "Intermediária"} para cima.`);
      cardsBox = t("All 20 wildlife cards (A–D).", "As 20 cartas de animais (A–D).");
    } else if (hasRestriction(6)) {
      cardsLine = t("10 cards face up: two sets of 5.", "10 cartas viradas para cima: dois conjuntos de 5.");
      cardsBox = t("10 wildlife cards and the Family/Intermediate card.", "10 cartas de animais e a carta Família/Intermediária.");
    } else if (hasRestriction(10)) {
      cardsLine = t(`${5 - n} face up; ${n} secret in players' hands.`, `${5 - n} viradas para cima; ${n} secretas nas mãos dos jogadores.`);
      cardsBox = t("15 wildlife cards and the Family/Intermediate card.", "15 cartas de animais e a carta Família/Intermediária.");
    } else {
      cardsLine = t("5 cards face up, one per wildlife.", "5 cartas viradas para cima, uma por animal.");
      cardsBox = t("15 wildlife cards and the Family/Intermediate card.", "15 cartas de animais e a carta Família/Intermediária.");
    }
    const cards = [
      infoCard(t("CENTER", "CENTRO"), t("Shared area", "Área compartilhada"), [
        rl("Display", `${size} Habitat Tiles face up in a row, each paired with 1 Wildlife Token below it.`, "Oferta", `${size} Peças de Habitat viradas para cima numa fileira, cada uma com 1 Ficha de Animal abaixo.`),
        rl("Stacks", `${stack} face-down Habitat Tiles${solo() ? ", at the left of the display" : ""}.`, "Pilhas", `${stack} Peças de Habitat viradas para baixo${solo() ? ", à esquerda da oferta" : ""}.`),
        rl("Cloth Bag", `${100 - size} Wildlife Tokens.`, "Saco de pano", `${100 - size} Fichas de Animais.`),
        rl("Supply", "25 Nature Tokens.", "Reserva", "25 Fichas de Natureza."),
        rl("Scoring", cardsLine, "Pontuação", cardsLine),
        t("Scorepad (bring your own pen).", "Bloco de pontuação (com uma caneta sua).")
      ], [3, 4]),
      infoCard(solo() ? t("YOU", "VOCÊ") : t(`PER PLAYER · ×${n}`, `POR JOGADOR · ×${n}`), solo() ? t("Your environment", "Seu ambiente") : t("Each player", "Cada jogador"), [
        hasRestriction(7) ? t("2 Habitat Tiles face up, touching (no Starter Habitat Tile).", "2 Peças de Habitat viradas para cima, encostadas (sem Peça Inicial).") : t("1 Starter Habitat Tile face up: the start of the environment.", "1 Peça Inicial de Habitat virada para cima: o início do ambiente."),
        t("No Nature Tokens.", "Nenhuma Ficha de Natureza."),
        hasRestriction(10) ? t("1 secret Wildlife Scoring Card in hand.", "1 Carta de Pontuação secreta na mão.") : null
      ], hasRestriction(7) || hasRestriction(10) ? [4, 14] : [4]),
      infoCard(t("BACK IN THE BOX", "DE VOLTA À CAIXA"), t("Not used in this match", "Fora desta partida"), [
        t(`${85 - tiles} Habitat Tiles, unseen.`, `${85 - tiles} Peças de Habitat, sem olhar.`),
        hasRestriction(7) ? t("All 5 Starter Habitat Tiles.", "As 5 Peças Iniciais de Habitat.") : t(`${5 - n} Starter Habitat Tile${5 - n === 1 ? "" : "s"}.`, `${5 - n} Peça${5 - n === 1 ? "" : "s"} Inicia${5 - n === 1 ? "l" : "is"} de Habitat.`),
        cardsBox
      ], [4])
    ];
    return `<div class="quick-grid">${cards.join("")}</div>`;
  }

  function setupSection() {
    const phases = setupPhases();
    const done = phases.filter((phase) => setupState.checks.includes(phase.id)).length;
    const phaseMarkup = phases.map((phase, index) => `
      <article class="setup-phase">
        <header class="setup-phase-header">
          <span class="setup-phase-number">${String(index + 1).padStart(2, "0")}</span>
          <h3>${phase.title}</h3>
          <div class="setup-phase-references">${uniquePages(phase.pages).map(referenceLink).join("")}</div>
        </header>
        <label class="csc-setup-check" for="csc-setup-${phase.id}">
          <input id="csc-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="csc-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="csc-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), sectionIndex("setup"), [3, 4])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Set up this match", "Prepare esta partida")} · ${playersLabel()} · ${cardModeLabel()}</h3>
            <p>${t("One checkbox per coherent step; tick it when all its substeps are done.", "Uma caixa por etapa coerente; marque quando todos os subpassos estiverem feitos.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved separately from the match configuration and language. Changing the player count, the scoring cards, how they are chosen, the scenario or the rule restriction clears this checklist; changing the language or the habitat bonus option does not. “Uncheck all” clears only these setup boxes.",
          "O progresso é salvo separadamente da configuração da partida e do idioma. Trocar o número de jogadores, as cartas de pontuação, a forma de escolhê-las, o cenário ou a restrição limpa esta lista; trocar o idioma ou a opção do bônus de habitat não. “Desmarcar tudo” limpa somente as caixas da preparação."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}
      ${figure("setup-layout", "The rulebook picture of a standard 3-player setup (your counts are in the steps above): (1) bag, (2) tile stacks, (3) the five scoring cards, (4) Starter Habitat Tiles, (5–6) the display of 4 tiles and 4 tokens, (7) Nature Tokens.", "A imagem do manual de uma preparação padrão para 3 jogadores (as suas quantidades estão nas etapas acima): (1) saco, (2) pilhas de peças, (3) as cinco cartas de pontuação, (4) Peças Iniciais, (5–6) a oferta de 4 peças e 4 fichas, (7) Fichas de Natureza.", 5, "is-wide")}`;
  }

  // ---------- quick reference ----------

  function placementLimits() {
    const lines = [];
    if (hasRestriction(1)) {
      lines.push(rl("Restriction 1", "each new tile must match the habitat of a tile it touches on at least one edge.", "Restrição 1", "cada peça nova precisa combinar o habitat de uma peça em que encosta em pelo menos uma borda."));
    }
    if (hasRestriction(2)) {
      lines.push(rl("Restriction 2", "no edge of a new tile may touch an edge of the same habitat.", "Restrição 2", "nenhuma borda de uma peça nova pode tocar uma borda do mesmo habitat."));
    }
    if (hasRestriction(9)) {
      lines.push(rl("Restriction 9", "the token may not go on the tile you placed this turn.", "Restrição 9", "a ficha não pode ir na peça que você colocou neste turno."));
    }
    const data = scenario();
    if (data) {
      data.goals.filter((goal) => /no-adjacent|not-on/.test(goal.icon)).forEach((goal) => lines.push(`${t("Scenario", "Cenário")} ${state.scenario}: ${t(goal.en, goal.pt)}`));
    }
    return lines;
  }

  function quickReference() {
    const size = displaySize();
    const natureCost = hasRestriction(8) ? 2 : 1;
    const cards = [
      infoCard(t("YOUR TURN", "SEU TURNO"), t("Draft, place, refill", "Escolha, coloque, reponha"), [
        rl("Start", "check the display's tokens for overpopulation (see Overpopulation).", "Início", "confira a superpopulação das fichas da oferta (veja Superpopulação)."),
        rl("Nature Tokens (optional)", "spend any number before choosing.", "Fichas de Natureza (opcional)", "gaste quantas quiser antes de escolher."),
        rl("1 · Select", "take one pair: the tile and the token in the same column.", "1 · Escolha", "pegue um par: a peça e a ficha da mesma coluna."),
        rl("2 · Place", "the tile and the token, in either order, into your environment.", "2 · Coloque", "a peça e a ficha, em qualquer ordem, no seu ambiente."),
        rl("3 · Refill", solo() ? "discard the tile and the token furthest from the stacks (each on its own, from what is left after your pick), slide the other 2 tiles and 2 tokens away from the stacks, draw 2 tiles and 2 tokens." : "a new tile from the top of any stack and a token from the bag into the empty spots; do not move the others.", "3 · Reponha", solo() ? "descarte a peça e a ficha mais distantes das pilhas (cada uma por si, do que sobrou depois da sua escolha), deslize as outras 2 peças e 2 fichas para longe das pilhas, compre 2 peças e 2 fichas." : "uma peça nova do topo de qualquer pilha e uma ficha do saco nos espaços vazios; não mova as outras."),
        rl("Next", solo() ? "your next turn." : "play passes clockwise.", "Próximo", solo() ? "seu próximo turno." : "a vez passa em sentido horário.")
      ], solo() ? [5, 6, 7, 10] : [5, 6, 7], "csc-step-1"),
      infoCard(t("OVERPOPULATION", "SUPERPOPULAÇÃO"), t("Before you select", "Antes de escolher"), [
        size === 4 ? rl("4 identical tokens", "wiped automatically: set them aside, draw 4 new ones one at a time and pair them in order. Can happen several times per turn.", "4 fichas iguais", "renovadas automaticamente: separe-as, tire 4 novas uma de cada vez e forme os pares em ordem. Pode acontecer várias vezes no turno.") : null,
        rl("3 identical tokens", "you may wipe just those 3 (once per turn): set aside, draw 3 new, pair them in order.", "3 fichas iguais", "você pode renovar só essas 3 (uma vez por turno): separe, tire 3 novas, forme os pares em ordem."),
        rl("Afterwards", "put all wiped tokens back into the bag.", "Depois", "devolva todas as fichas renovadas ao saco."),
        size === 3 ? interpretation("with 3 pairs (restriction 5) three identical tokens are the 3-of-a-kind case.", "com 3 pares (restrição 5) três fichas iguais são o caso de 3 iguais.") : null
      ], hasRestriction(5) ? [6, 14] : [6]),
      infoCard(t("NATURE TOKENS", "FICHAS DE NATUREZA"), t(`Spend before selecting · ${natureCost} per action`, `Gaste antes de escolher · ${natureCost} por ação`), [
        rl("Gain", "place a Wildlife Token on a Keystone Tile → take 1 from the supply.", "Ganhe", "coloque uma Ficha de Animal numa Peça-chave → pegue 1 da reserva."),
        rl("Option 1", "take ANY one of the tiles and ANY one of the tokens in the display.", "Opção 1", "pegue QUALQUER peça e QUALQUER ficha da oferta."),
        rl("Option 2", "wipe ANY number of tokens and replace them (overpopulation process).", "Opção 2", "renove QUALQUER número de fichas e reponha-as (processo da superpopulação)."),
        rl("Limit", `none: spend as many as you like${natureCost === 2 ? " — but each action costs 2 (restriction 8)" : ""}. Spent tokens return to the supply.`, "Limite", `nenhum: gaste quantas quiser${natureCost === 2 ? " — mas cada ação custa 2 (restrição 8)" : ""}. As fichas gastas voltam à reserva.`),
        rl("End", "each unused Nature Token = 1 point; also the tie-breaker.", "Fim", "cada Ficha de Natureza não usada = 1 ponto; também desempata.")
      ], hasRestriction(8) ? [6, 8, 14] : [6, 8]),
      infoCard(t("PLACEMENT", "COLOCAÇÃO"), t("Tile and token rules", "Regras da peça e da ficha"), [
        rl("Tile", "must touch at least one side of a tile already in your environment; never on top of another, never move tiles. Matching habitats is not required (but scores).", "Peça", "precisa encostar em pelo menos um lado de uma peça do seu ambiente; nunca em cima de outra, nunca mova peças. Combinar habitats não é obrigatório (mas pontua)."),
        rl("Token", "on any tile of your environment that has no token yet and shows that wildlife — the new tile or an older one. Max 1 token per tile.", "Ficha", "em qualquer peça do seu ambiente que ainda não tem ficha e mostra esse animal — a peça nova ou uma antiga. Máx. 1 ficha por peça."),
        rl("Cannot or will not place it", "return the token to the bag.", "Não pode ou não quer colocar", "devolva a ficha ao saco."),
        ...placementLimits()
      ], [7]),
      infoCard(t("SCORING CARDS", "CARTAS DE PONTUAÇÃO"), t("In this match", "Nesta partida"), [
        `${cardChips()}`,
        standard() ? t("Each wildlife scores only by its own card; see “Wildlife Scoring Cards”.", "Cada animal pontua só pela própria carta; veja “Cartas de Pontuação”.") : t("Every wildlife scores by group size on the one card.", "Todo animal pontua pelo tamanho do grupo na carta única.")
      ], standard() ? [11] : [10]),
      infoCard(t("GAME END", "FIM DA PARTIDA"), t("When a taken tile cannot be replaced", "Quando a peça que foi pega não pode ser reposta"), [
        solo() ? rl("Trigger", "after your 20th turn only 1 face-down tile is left, fewer than the 2 you must draw → the game ends.", "Gatilho", "depois do seu 20º turno resta só 1 peça virada para baixo, menos que as 2 que você precisa comprar → a partida acaba.") : rl("Trigger", `at the end of a turn there is no face-down tile left to refill the display → the game ends at once (everyone has played exactly ${turnsEach()} turns).`, "Gatilho", `no fim de um turno não há peça virada para baixo para repor a oferta → a partida acaba na hora (todos fizeram exatamente ${turnsEach()} turnos).`),
        rl(`${icon("score-wildlife-total", "W")} 1 · Wildlife`, standard() ? "score each wildlife by its card." : "score every wildlife's groups with the variant card.", `${icon("score-wildlife-total", "W")} 1 · Animais`, standard() ? "pontue cada animal pela carta dele." : "pontue os grupos de todos os animais com a carta da variante."),
        habitatScoringOn() ? rl(`${icon("score-habitat-total", "H")} 2 · Corridors`, "1 point per tile of your largest corridor in each of the 5 habitats.", `${icon("score-habitat-total", "H")} 2 · Corredores`, "1 ponto por peça do seu maior corredor em cada um dos 5 habitats.") : null,
        habitatScoringOn() && majorityOn() ? rl(`${icon("score-majority-plus", "+")} 3 · ${solo() ? "Habitat bonus" : "Majorities"}`, solo() ? "+2 per habitat with a corridor of 7+." : (players() === 2 ? "largest corridor +2 (tie 1 each)." : "largest +3, second +1 (ties: see End game)."), `${icon("score-majority-plus", "+")} 3 · ${solo() ? "Bônus de habitat" : "Maiorias"}`, solo() ? "+2 por habitat com corredor de 7+." : (players() === 2 ? "maior corredor +2 (empate 1 cada)." : "maior +3, segundo +1 (empates: veja Fim e pontuação).")) : null,
        !habitatScoringOn() ? rl("2–3 · Habitats", "skipped (rule restriction 2).", "2–3 · Habitats", "puladas (restrição 2).") : !majorityOn() ? rl(`${icon("score-majority-plus", "+")} 3`, "skipped in this match: leave the bonus corners blank.", `${icon("score-majority-plus", "+")} 3`, "pulada nesta partida: deixe os cantos de bônus em branco.") : null,
        rl(`${natureIcon()} 4 · Nature Tokens`, "1 point each.", `${natureIcon()} 4 · Fichas de Natureza`, "1 ponto cada."),
        solo() ? rl("Rating", "60+ A good start! · 70+ You're getting it! · 80+ Very Good! · 90+ Excellent! · 100+ Elite! · 110+ Ascended!!", "Avaliação", "60+ A good start! · 70+ You're getting it! · 80+ Very Good! · 90+ Excellent! · 100+ Elite! · 110+ Ascended!! (traduções em Fim e pontuação)") : rl("Winner", "most points; tie → most Nature Tokens; still tied → shared victory.", "Vencedor", "mais pontos; empate → mais Fichas de Natureza; empate de novo → vitória compartilhada.")
      ], [8, 9], "victory-card")
    ];
    if (mode() === "scenario") {
      cards.push(infoCard(t(`SCENARIO ${state.scenario}`, `CENÁRIO ${state.scenario}`), t("Pass only if all are met", "Passe só se cumprir todos"), [
        t(`<strong>Score at least ${scenario().target} points.</strong>`, `<strong>Fazer pelo menos ${scenario().target} pontos.</strong>`),
        ...scenario().goals.map((goal) => t(goal.en, goal.pt))
      ], [13], "csc-mode-card"));
    } else if (mode() === "restriction") {
      const data = RESTRICTIONS[restriction() - 1];
      cards.push(infoCard(t(`RULE RESTRICTION ${state.restriction}`, `RESTRIÇÃO ${state.restriction}`), t("Active all game", "Vale a partida toda"), [
        t(data.en, data.pt),
        data.readEn ? interpretation(data.readEn, data.readPt) : null,
        t("The winner fills in their shape under this restriction.", "O vencedor preenche sua forma sob esta restrição.")
      ], [14], "csc-mode-card"));
    } else if (mode() === "normal") {
      cards.push(infoCard(t("NORMAL GAME", "PARTIDA NORMAL"), t("Achievements", "Conquistas"), [
        t("Normal rules. After scoring, the winner fills in at most one of the 25 achievements they earned (see “Achievements”).", "Regras normais. Depois da pontuação, o vencedor preenche no máximo uma das 25 conquistas que ganhou (veja “Conquistas”).")
      ], [14], "csc-mode-card"));
    }
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), sectionIndex("quick-reference"), [5, 6, 7, 8, 9])}
      <div class="callout">${t(
        `Each turn you take one of the ${size} tile-and-token pairs from the display and add both to your environment: tiles build habitat corridors, tokens form the wildlife patterns shown on the scoring cards. After ${turnsEach()} turns each, score wildlife, your largest corridor in each habitat${habitatScoringOn() && majorityOn() ? (solo() ? ", the habitat bonus" : ", habitat majorities") : ""} and unused Nature Tokens.`,
        `A cada turno você pega um dos ${size} pares de peça e ficha da oferta e acrescenta os dois ao seu ambiente: as peças formam corredores de habitat, as fichas formam os padrões de animais das cartas de pontuação. Depois de ${turnsEach()} turnos cada, pontue os animais, o seu maior corredor de cada habitat${habitatScoringOn() && majorityOn() ? (solo() ? ", o bônus de habitat" : ", as maiorias de habitat") : ""} e as Fichas de Natureza não usadas.`
      )} ${referenceLink(5)}</div>
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- turn ----------

  function turnSection() {
    const size = displaySize();
    const natureCost = hasRestriction(8) ? 2 : 1;
    const limits = placementLimits();
    return `
      ${sectionHeading("turn", t("Your turn", "Seu turno"), sectionIndex("turn"), solo() ? [5, 6, 7, 8, 10] : [5, 6, 7, 8])}
      <p class="glossary-intro">${t(
        solo()
          ? "You take turns one after another. On each turn you select a Habitat Tile + Wildlife Token pair, place both in your environment, then refill the display the solo way. You play exactly 20 turns."
          : `Beginning with the first player and going clockwise, each player selects a Habitat Tile + Wildlife Token pair, places both in their environment, then refills the display. Each player plays exactly ${turnsEach()} turns.`,
        solo()
          ? "Você joga um turno depois do outro. Em cada turno escolhe um par Peça de Habitat + Ficha de Animal, coloca os dois no seu ambiente e repõe a oferta do jeito solo. Você faz exatamente 20 turnos."
          : `Começando pelo primeiro jogador e seguindo em sentido horário, cada jogador escolhe um par Peça de Habitat + Ficha de Animal, coloca os dois no seu ambiente e repõe a oferta. Cada jogador faz exatamente ${turnsEach()} turnos.`
      )} ${referenceLink(5)}</p>
      <div class="quick-grid">
        ${infoCard(t("STEP 1", "PASSO 1"), t("Select a Habitat Tile and Wildlife Token", "Escolha uma Peça de Habitat e uma Ficha de Animal"), [
          t(`At the start of your turn the display shows ${size} Habitat Tiles, each paired with the Wildlife Token below it: ${size} choices.`, `No começo do seu turno a oferta mostra ${size} Peças de Habitat, cada uma com a Ficha de Animal abaixo dela: ${size} escolhas.`),
          rl("First", "check for overpopulation (see Overpopulation below).", "Primeiro", "confira a superpopulação (veja Superpopulação abaixo)."),
          rl("Then, optionally", `spend Nature Tokens (${natureCost} per action) — see Nature Token actions below.`, "Depois, se quiser", `gaste Fichas de Natureza (${natureCost} por ação) — veja Ações de Ficha de Natureza abaixo.`),
          rl("Finally", "take one existing pair: the tile and the token in the same column. Without a Nature Token action you must take an existing pair.", "Por fim", "pegue um par existente: a peça e a ficha da mesma coluna. Sem uma ação de Ficha de Natureza, você é obrigado a pegar um par existente.")
        ], [6], "csc-step-1")}
        ${infoCard(t("BEFORE SELECTING", "ANTES DE ESCOLHER"), t("Overpopulation", "Superpopulação"), [
          size === 4 ? rl("All 4 tokens the same", "they are wiped automatically. Set all 4 aside, then draw 4 new tokens from the bag one at a time, pairing each in order with a tile. This can happen several times in one turn.", "As 4 fichas iguais", "são renovadas automaticamente. Separe as 4, depois tire 4 novas do saco uma de cada vez, formando os pares em ordem com as peças. Isso pode acontecer várias vezes num turno.") : null,
          rl("3 tokens the same", "you may choose to wipe them: set only those 3 aside, draw 3 new tokens one at a time and pair each, in order, with a tile. Only once per turn (guide's reading: also after a Nature Token wipe, if not used yet).", "3 fichas iguais", "você pode escolher renová-las: separe só essas 3, tire 3 novas uma de cada vez e forme os pares, em ordem, com as peças. Só uma vez por turno (leitura do guia: também depois de uma renovação por Ficha de Natureza, se ainda não foi usada)."),
          rl("When all overpopulation is resolved", "put the wiped tokens back into the bag (so they cannot come straight back).", "Quando toda a superpopulação estiver resolvida", "devolva as fichas renovadas ao saco (assim elas não voltam na hora)."),
          size === 3 ? interpretation("with 3 pairs (restriction 5), three identical tokens are the whole display: they follow the optional 3-token rule above.", "com 3 pares (restrição 5), três fichas iguais são a oferta inteira: elas seguem a regra opcional de 3 fichas acima.") : null
        ], hasRestriction(5) ? [6, 14] : [6])}
        ${infoCard(t("OPTIONAL", "OPCIONAL"), t("Nature Token actions", "Ações de Ficha de Natureza"), [
          t(`Before you select, you may spend ${natureCost === 2 ? "<strong>2 Nature Tokens</strong> (rule restriction 8)" : "a Nature Token"} ${natureIcon()} to do <strong>one</strong> of these:`, `Antes de escolher, você pode gastar ${natureCost === 2 ? "<strong>2 Fichas de Natureza</strong> (restrição 8)" : "uma Ficha de Natureza"} ${natureIcon()} para fazer <strong>uma</strong> destas:`),
          rl("1 · Free choice", `take ANY one of the ${size} tiles and ANY one of the ${size} tokens, even if they are not paired.`, "1 · Escolha livre", `pegue QUALQUER uma das ${size} peças e QUALQUER uma das ${size} fichas, mesmo que não formem par.`),
          rl("2 · Wipe", "wipe ANY number of tokens and replace them with the overpopulation process (set aside, draw one at a time in order, then the wiped tokens go back into the bag).", "2 · Renovar", "renove QUALQUER número de fichas e reponha-as com o processo da superpopulação (separe, tire uma de cada vez em ordem, e depois as renovadas voltam ao saco)."),
          rl("No limit", "spend as many Nature Tokens as you like on your turn (for example, wipe and then take any tile + token). Spent tokens return to the supply.", "Sem limite", "gaste quantas Fichas de Natureza quiser no seu turno (por exemplo, renovar e depois pegar qualquer peça + ficha). As fichas gastas voltam à reserva."),
          (displaySize() === 4 ? interpretation("if any wipe (the optional 3-token wipe or a Nature Token wipe) leaves all 4 tokens the same, the automatic wipe applies again before you select.", "se qualquer renovação (a opcional de 3 fichas ou a de Ficha de Natureza) deixar as 4 fichas iguais, a renovação automática vale de novo antes de você escolher.") : interpretation("with 3 pairs, three identical tokens after a Nature Token wipe may be wiped for free only if you have not used the free 3-token wipe this turn.", "com 3 pares, três fichas iguais depois de uma renovação por Ficha de Natureza só podem ser renovadas de graça se você ainda não usou a renovação grátis de 3 fichas neste turno.")),
          hasRestriction(10) ? `${t("Rule restriction 10: the first time you spend a Nature Token, reveal your secret scoring card face up before carrying out the action.", "Restrição 10: na primeira vez que você gastar uma Ficha de Natureza, revele sua carta secreta virada para cima antes de fazer a ação.")} ${interpretation("“play a Nature Token” means spending one, not earning one.", "“usar uma Ficha de Natureza” significa gastá-la, não ganhá-la.")}` : null
        ], hasRestriction(8) ? [6, 8, 14] : [6, 8])}
        ${infoCard(t("STEP 2", "PASSO 2"), t("Place the tile and the token", "Coloque a peça e a ficha"), [
          t("Place both into your environment, in either order.", "Coloque as duas no seu ambiente, em qualquer ordem."),
          rl("Tile · A", "it must touch at least one side of a tile already in your environment (or your Starter Habitat Tile).", "Peça · A", "ela precisa encostar em pelo menos um lado de uma peça do seu ambiente (ou da sua Peça Inicial)."),
          rl("Tile · B", "never on top of another tile, and tiles already placed never move. You may turn the tile to any orientation.", "Peça · B", "nunca em cima de outra peça, e as peças já colocadas nunca se movem. Você pode girar a peça em qualquer orientação."),
          rl("Habitats", "matching terrain is not a placement rule, but it builds the corridors that score at the end.", "Habitats", "combinar o terreno não é regra de colocação, mas forma os corredores que pontuam no fim."),
          rl("Token · A", "only on a tile that has no Wildlife Token yet (max 1 token per tile).", "Ficha · A", "só numa peça que ainda não tem Ficha de Animal (máx. 1 ficha por peça)."),
          rl("Token · B", "only on a tile that shows that wildlife (tiles show 1–3 wildlife symbols). It may be the tile you just placed or any other tile of your environment.", "Ficha · B", "só numa peça que mostra esse animal (as peças mostram 1–3 símbolos de animais). Pode ser a peça que você acabou de colocar ou qualquer outra do seu ambiente."),
          rl("Cannot or do not want to place it", "return the token to the bag.", "Não pode ou não quer colocar", "devolva a ficha ao saco."),
          rl(`${icon("keystone-marker", t("Keystone marker", "Marca de peça-chave"))} Keystone Tile`, "a token placed on a Keystone Tile earns you 1 Nature Token from the supply.", `${icon("keystone-marker", t("Keystone marker", "Marca de peça-chave"))} Peça-chave`, "uma ficha colocada numa Peça-chave rende 1 Ficha de Natureza da reserva."),
          interpretation("you may turn a tile freely; the rulebook only restricts where it goes.", "você pode girar a peça livremente; o manual só restringe onde ela vai."),
          ...limits
        ], hasRestriction(1) || hasRestriction(2) || hasRestriction(9) ? [7, 8, 14] : [7, 8], "csc-step-2")}
        ${infoCard(t("STEP 3", "PASSO 3"), solo() ? t("Refill the display · solo", "Reponha a oferta · solo") : t("Refill the display", "Reponha a oferta"), solo()
          ? [
            rl("Discard", "the Habitat Tile and the Wildlife Token furthest from the draw stacks are removed from the game (not returned to the bag).", "Descarte", "a Peça de Habitat e a Ficha de Animal mais distantes das pilhas saem do jogo (não voltam ao saco)."),
            rl("Slide", "move the remaining 2 tiles and 2 tokens away from the stacks, forming 2 pairs (if not already paired).", "Deslize", "mova as 2 peças e as 2 fichas restantes para longe das pilhas, formando 2 pares (se ainda não estiverem pareadas)."),
            rl("Refill", "draw 2 new Habitat Tiles from the stacks and 2 new Wildlife Tokens from the bag into the empty spaces next to the stacks.", "Reponha", "compre 2 Peças de Habitat novas das pilhas e 2 Fichas de Animais novas do saco para os espaços vazios ao lado das pilhas."),
            t("Your turn is complete.", "Seu turno terminou.")
          ]
          : [
            rl("Tile", "replace the tile you took with the top tile of any face-down stack.", "Peça", "reponha a peça que você pegou com a do topo de qualquer pilha virada para baixo."),
            rl("Token", "replace the token you took with one drawn at random from the bag.", "Ficha", "reponha a ficha que você pegou com uma tirada ao acaso do saco."),
            rl("Do not shift", "leave the other tiles and tokens where they are; just fill the empty spots.", "Não desloque", "deixe as outras peças e fichas onde estão; só preencha os espaços vazios."),
            t("Your turn is complete; play passes clockwise.", "Seu turno terminou; a vez passa em sentido horário.")
          ], solo() ? [7, 10] : [7], "csc-step-3")}
        ${infoCard(t("GAME END", "FIM DA PARTIDA"), t("No tile to refill", "Sem peça para repor"), [
          t("If, at the end of any player's turn, no face-down Habitat Tile is left to replace the one taken, the game ends immediately and scores are tallied.", "Se, no fim do turno de qualquer jogador, não houver mais Peça de Habitat virada para baixo para repor a peça que foi pega, a partida acaba na hora e os pontos são contados."),
          solo() ? t("Solo: after your 20th turn only 1 tile is left, not enough for the 2 you must draw — the game ends.", "Solo: depois do seu 20º turno resta só 1 peça, menos que as 2 que você precisa comprar — a partida acaba.") : t(`With the tile count above, everyone plays exactly ${turnsEach()} turns.`, `Com a contagem de peças acima, todos fazem exatamente ${turnsEach()} turnos.`)
        ], solo() ? [8, 10] : [8], "victory-card")}
      </div>
      ${figure("tile-and-token", "Step 2: the selected tile is placed touching the environment and the salmon token goes onto a tile that shows a salmon.", "Passo 2: a peça escolhida é colocada encostada no ambiente e a ficha de salmão vai para uma peça que mostra salmão.", 7)}
      ${solo() ? `
        <h3 class="subhead">${t("Solo turn example", "Exemplo de turno solo")}</h3>
        ${figure("solo-step-1", "1 · You spend a Nature Token to take the Keystone Tile and the elk token, which are not paired.", "1 · Você gasta uma Ficha de Natureza para pegar a Peça-chave e a ficha de alce, que não formam par.", 10)}
        ${figure("solo-step-2", "2 · After placing them, the tile and the token furthest from the stacks (the Mountains–Wetlands tile and the bear) are removed from the game.", "2 · Depois de colocá-las, a peça e a ficha mais distantes das pilhas (a peça Montanhas–Pântanos e o urso) saem do jogo.", 10)}
        ${figure("solo-step-3", "3 · The remaining two tiles and two tokens slide away from the stacks; 2 new tiles and 2 new tokens fill the spaces by the stacks.", "3 · As duas peças e as duas fichas restantes deslizam para longe das pilhas; 2 peças e 2 fichas novas preenchem os espaços ao lado das pilhas.", 10)}` : ""}`;
  }

  // ---------- wildlife scoring cards ----------

  function pointsTable(card) {
    return `
      <table class="csc-points">
        <thead><tr><th scope="col">${t(card.col[0], card.col[1])}</th><th scope="col">${t("Points", "Pontos")}</th></tr></thead>
        <tbody>${card.rows.map((row) => `<tr><td>${t(row.en, row.pt)}</td><td><strong>${row.points}</strong></td></tr>`).join("")}</tbody>
      </table>`;
  }

  function scoreCard(id, letter) {
    const card = CARDS[id][letter];
    const title = t(`${WILDLIFE[id].en} card ${letter}`, `Carta ${WILDLIFE[id].pt} ${letter}`);
    return `
      <article class="csc-score-card">
        <img src="${CARD_ART}${id}-${letter.toLowerCase()}.webp" alt="${title}" loading="lazy">
        <div>
          <h4>${title}</h4>
          ${pointsTable(card)}
          ${lineList([...card.lines.map(([lineEn, linePt]) => t(lineEn, linePt)), card.reading ? interpretation(card.reading[0], card.reading[1]) : null])}
        </div>
      </article>`;
  }

  function wildlifeCardsSection() {
    if (!standard()) {
      const family = state.cards === "family";
      return `
        ${sectionHeading("wildlife-cards", t("Wildlife Scoring Cards", "Cartas de Pontuação"), sectionIndex("wildlife-cards"), [10])}
        <p class="glossary-intro">${t("In both variants one card scores every wildlife type the same way: by groups.", "Nas duas variantes uma só carta pontua todos os tipos de animal do mesmo jeito: por grupos.")} ${referenceLink(10)}</p>
        <div class="csc-card-grid is-single">
          <article class="csc-score-card is-tall">
            <img src="${CARD_ART}family.webp" alt="${state.cards === "family" ? t("Family Variant scoring card", "Carta de pontuação da Variante Família") : t("The Family side of the Family/Intermediate card (the rulebook shows only this side; use the other side)", "O lado Família da carta Família/Intermediária (o manual mostra só este lado; use o outro lado)")}" loading="lazy">
            <div>
              <h4>${family ? t("Family Variant card", "Carta da Variante Família") : t("Intermediate Variant card (back of the Family card)", "Carta da Variante Intermediária (verso da carta Família)")}</h4>
              ${family ? pointsTable({ col: ["Group size", "Tamanho do grupo"], rows: sizes([2, 5, 9], 1, true) }) : ""}
              ${lineList([
                rl("Groups", "all touching tokens of the same wildlife form one group, in any shape. Groups of the same animal are never adjacent (if they touch, they are one group).", "Grupos", "todas as fichas encostadas do mesmo animal formam um grupo, em qualquer forma. Grupos do mesmo animal nunca são adjacentes (se encostam, são um grupo só)."),
                family
                  ? rl("Score", "every group of every wildlife by its size: 1 token → 2, 2 → 5, 3 or more → 9 points.", "Pontue", "cada grupo de cada animal pelo tamanho: 1 ficha → 2, 2 → 5, 3 ou mais → 9 pontos.")
                  : rl("Score", "every group of every wildlife by its size, using the values printed on the Intermediate side — it scores different group sizes differently. The rulebook does not reproduce them: read them on the card.", "Pontue", "cada grupo de cada animal pelo tamanho, com os valores impressos no lado Intermediária — ele pontua tamanhos de grupo de outra forma. O manual não os reproduz: leia-os na carta."),
                rl("Different animals", "groups of different wildlife may touch freely; only same-animal tokens join.", "Animais diferentes", "grupos de animais diferentes podem se encostar livremente; só fichas do mesmo animal se juntam."),
                rl("Record", "write each wildlife's total in its row of the Scorepad, as in the standard game.", "Anote", "escreva o total de cada animal na linha dele do bloco, como no jogo padrão.")
              ])}
            </div>
          </article>
        </div>`;
    }
    const deal = effectiveDeal();
    const intro = deal === "random"
      ? t("Your cards were drawn at random, so all four cards of each wildlife are shown below: read only the letter on the table.", "Suas cartas foram sorteadas, então as quatro cartas de cada animal aparecem abaixo: leia só a letra que está na mesa.")
      : deal === "scenario"
        ? t(`Scenario ${state.scenario} uses: ${scenarioCardList(scenario())}.`, `O Cenário ${state.scenario} usa: ${scenarioCardList(scenario())}.`)
        : t("This match uses the five A cards recommended for a first game.", "Esta partida usa as cinco cartas A recomendadas para a primeira partida.");
    return `
      ${sectionHeading("wildlife-cards", t("Wildlife Scoring Cards", "Cartas de Pontuação"), sectionIndex("wildlife-cards"), [11])}
      <p class="glossary-intro">${t("At the end, each wildlife scores only by its own card. Point values are read from the card pictures in the rulebook; the explanations paraphrase its card clarifications. A result below a table's first column scores 0 (for example a fox with no animal beside it).", "No fim, cada animal pontua só pela própria carta. Os valores vêm das imagens das cartas no manual; as explicações parafraseiam os esclarecimentos dele. Um resultado abaixo da primeira coluna de uma tabela vale 0 (por exemplo, uma raposa sem nenhum animal ao lado).")} ${intro} ${referenceLink(11)}</p>
      ${hasRestriction(6) ? `<p class="csc-note">${t("Rule restriction 6: two cards per wildlife are on the table; at final scoring each player chooses one set of five.", "Restrição 6: há duas cartas por animal na mesa; na pontuação final cada jogador escolhe um conjunto de cinco.")} ${interpretation(RESTRICTIONS[5].readEn, RESTRICTIONS[5].readPt)}</p>` : ""}
      ${WILDLIFE_IDS.map((id) => {
        const letters = lettersFor(id);
        return `
          <section class="csc-wildlife" aria-label="${wName(id)}">
            <header><img src="${ICONS}token-${id}.webp" alt=""><h3>${wName(id)}</h3></header>
            ${lineList(WILDLIFE_RULES[id].map(([lineEn, linePt]) => t(lineEn, linePt)))}
            <div class="csc-card-grid ${letters.length === 1 ? "is-single" : ""}">${letters.map((letter) => scoreCard(id, letter)).join("")}</div>
          </section>`;
      }).join("")}`;
  }

  // ---------- end game ----------

  function endGameSection() {
    const n = players();
    const habitats = habitatScoringOn();
    const stepRows = [
      [icon("score-wildlife-total", "W"), t("1 · Wildlife Scoring Cards", "1 · Cartas de Pontuação"), standard() ? `${t("Each player scores each wildlife by the card used for it this game; write it in that wildlife's row. The sum is the W subtotal.", "Cada jogador pontua cada animal pela carta usada para ele nesta partida; anote na linha desse animal. A soma é o subtotal W.")}${hasRestriction(10) ? ` ${t("Rule restriction 10: first reveal every secret card still in a hand.", "Restrição 10: antes, revele toda carta secreta ainda na mão.")} ${interpretation(RESTRICTIONS[9].readEn, RESTRICTIONS[9].readPt)}` : ""}${hasRestriction(6) ? ` ${t("Rule restriction 6: each player first chooses set 1 or set 2.", "Restrição 6: cada jogador escolhe antes o conjunto 1 ou o 2.")}` : ""}` : t("Each player scores each wildlife's groups with the variant card; write each in its row. The sum is the W subtotal.", "Cada jogador pontua os grupos de cada animal com a carta da variante; anote cada um na sua linha. A soma é o subtotal W.")],
      habitats ? [icon("habitat-forest", hName("forest")), t("2 · Habitat Tile corridors", "2 · Corredores de habitat"), hasRestriction(3) ? t("Rule restriction 3: each corridor of exactly 3 tiles of a habitat scores 3 points (instead of the largest corridor). Top-left of the habitat's box.", "Restrição 3: cada corredor de exatamente 3 peças de um habitat vale 3 pontos (em vez do maior corredor). Canto superior esquerdo da casa do habitat.") : hasRestriction(4) ? t("Rule restriction 4: 1 point per tile of your largest corridor in each habitat, but only if it has 5+ tiles (otherwise 0). Top-left of the habitat's box.", "Restrição 4: 1 ponto por peça do seu maior corredor em cada habitat, mas só se ele tiver 5+ peças (senão 0). Canto superior esquerdo da casa do habitat.") : t("1 point per tile in your largest contiguous corridor of each of the 5 habitats. Write it in the top-left of that habitat's box.", "1 ponto por peça do seu maior corredor contíguo em cada um dos 5 habitats. Anote no canto superior esquerdo da casa desse habitat.")] : null,
      habitats && majorityOn() ? [icon("score-majority-plus", "+"), solo() ? t("3 · Habitat bonus (solo)", "3 · Bônus de habitat (solo)") : t("3 · Habitat corridor majorities", "3 · Maiorias de corredor"), `${solo() ? t("+2 for each habitat whose largest corridor has 7 or more tiles.", "+2 para cada habitat cujo maior corredor tem 7 ou mais peças.") : t(`Compare the largest corridor of each habitat (the step-2 numbers) and give the ${n}-player bonus below. Write it in the bottom-right of the box.`, `Compare o maior corredor de cada habitat (os números da etapa 2) e dê o bônus de ${n} jogadores abaixo. Anote no canto inferior direito da casa.`)}${hasRestriction(3) || hasRestriction(4) ? ` ${interpretation(RESTRICTIONS[restriction() - 1].readEn, RESTRICTIONS[restriction() - 1].readPt)}` : ""}`] : null,
      [natureIcon(), t("4 · Nature Tokens", "4 · Fichas de Natureza"), t("1 point per unused Nature Token.", "1 ponto por Ficha de Natureza não usada.")],
      [icon("score-total", t("Total", "Total")), t("Total", "Total"), solo() ? t("Add everything up and compare with the rating chart below.", "Some tudo e compare com a tabela de avaliação abaixo.") : t("Most points wins. Tie: the tied player with the most Nature Tokens wins; still tied, they share the victory.", "Mais pontos vence. Empate: entre os empatados, vence quem tem mais Fichas de Natureza; se ainda empatar, dividem a vitória.")]
    ].filter(Boolean);
    return `
      ${sectionHeading("end-game", t("End game & scoring", "Fim e pontuação"), sectionIndex("end-game"), solo() ? [8, 9, 10] : [8, 9])}
      <p class="glossary-intro">${t(`The game ends when a taken tile cannot be replaced (everyone has played ${turnsEach()} turns). Record the scores on the Scorepad: ${!habitats ? "steps 1 and 4 (steps 2–3 are skipped)" : !majorityOn() ? "steps 1, 2 and 4 (step 3 is skipped)" : "four steps"}.`, `A partida termina quando a peça que foi pega não pode ser reposta (todos fizeram ${turnsEach()} turnos). Anote os pontos no bloco: ${!habitats ? "etapas 1 e 4 (as etapas 2–3 são puladas)" : !majorityOn() ? "etapas 1, 2 e 4 (a etapa 3 é pulada)" : "quatro etapas"}.`)} ${referenceLink(8)}</p>
      ${!habitats ? `<p class="csc-config-notice">${t("Rule restriction 2: ignore habitat scoring this game — skip steps 2 and 3.", "Restrição 2: ignore a pontuação de habitats nesta partida — pule as etapas 2 e 3.")}</p>` : ""}
      ${!majorityOn() ? `<p class="csc-note">${t("This match skips step 3 (Family/Intermediate option).", "Esta partida pula a etapa 3 (opção da Família/Intermediária).")}</p>` : ""}
      <div class="csc-table-wrap">
        <table class="csc-score-table">
          <thead><tr><th scope="col">${t("Scorepad", "Bloco")}</th><th scope="col">${t("Step", "Etapa")}</th><th scope="col">${t("What to record", "O que anotar")}</th></tr></thead>
          <tbody>${stepRows.map(([glyph, step, text]) => `<tr><td>${glyph}</td><th scope="row">${step}</th><td>${text}</td></tr>`).join("")}</tbody>
        </table>
      </div>
      <div class="quick-grid" style="margin-top:14px">
        ${habitats ? infoCard(t("CORRIDORS", "CORREDORES"), t("What is a habitat corridor?", "O que é um corredor de habitat?"), [
          t(`A corridor is a group of connected tiles of one habitat: ${allHabitats()}.`, `Um corredor é um grupo de peças conectadas de um habitat: ${allHabitats()}.`),
          t("Two tiles are in the same corridor if they share at least one matching edge (of a tile's 6 edges).", "Duas peças estão no mesmo corredor se compartilham pelo menos uma borda que combina (das 6 bordas de uma peça)."),
          t("Only your largest corridor of each habitat scores: a group of 3 Forests and a group of 4 Forests → 4 points.", "Só o seu maior corredor de cada habitat pontua: um grupo de 3 Florestas e um de 4 Florestas → 4 pontos."),
          interpretation("a tile with two habitats can belong to a corridor of each of them; each hex of a Starter Habitat Tile counts as one tile.", "uma peça com dois habitats pode fazer parte de um corredor de cada um deles; cada hexágono da Peça Inicial conta como uma peça.")
        ], [8]) : ""}
        ${habitats && majorityOn() ? infoCard(solo() ? t("SOLO", "SOLO") : t(`${n} PLAYERS`, `${n} JOGADORES`), solo() ? t("Habitat bonus", "Bônus de habitat") : t("Majority bonus per habitat", "Bônus de maioria por habitat"), majorityLines(), [9], "victory-card") : ""}
        ${infoCard(t("SCOREPAD", "BLOCO"), t("Where each number goes", "Onde vai cada número"), [
          rl("Top rows", "one row per wildlife, then the W subtotal.", "Linhas de cima", "uma linha por animal e depois o subtotal W."),
          habitats ? rl("Habitat rows", `one box per habitat split diagonally: corridor points top-left, bonus bottom-right (marked +)${majorityOn() ? "" : " — leave the bonus corners blank in this match"}. Then the H subtotal.`, "Linhas de habitat", `uma casa por habitat dividida na diagonal: pontos do corredor em cima à esquerda, bônus embaixo à direita (marcado com +)${majorityOn() ? "" : " — deixe os cantos de bônus em branco nesta partida"}. Depois o subtotal H.`) : null,
          rl("Bottom", "Nature Tokens, then the total.", "Embaixo", "Fichas de Natureza e depois o total.")
        ], [8, 9])}
        ${solo() ? infoCard(t("SOLO RATING", "AVALIAÇÃO SOLO"), t("Compare your score", "Compare sua pontuação"), [
          ...[["60+ · A good start!", "um bom começo"], ["70+ · You're getting it!", "você está pegando o jeito"], ["80+ · Very Good!", "muito bom"], ["90+ · Excellent!", "excelente"], ["100+ · Elite!", "elite"], ["110+ · Ascended!!", "ascendeu"]].map(([label, gloss]) => state.language === "pt-BR" ? `${label} (${gloss})` : label),
          t("For the full solo experience, try the Scenarios (Achievements).", "Para a experiência solo completa, experimente os Cenários (Conquistas).")
        ], [10], "victory-card") : ""}
      </div>`;
  }

  // ---------- achievements ----------

  function achievementsSection() {
    if (mode() === "none") {
      return "";
    }
    const common = infoCard(t("HIKING CHART", "MAPA DE TRILHA"), t("Tracking achievements (page 12)", "Registrando conquistas (página 12)"), [
      t("Up to 5 people track their progress on the rulebook's hiking chart, each on one colored track with its own shape.", "Até 5 pessoas acompanham o progresso no mapa de trilha do manual, cada uma numa trilha colorida com a sua forma."),
      t("Whenever you gain an achievement, fill in your shape under that mode (pages 13–14), then come back to page 12 and fill in the next shape on your hike, from left to right.", "Sempre que ganhar uma conquista, preencha a sua forma sob esse modo (páginas 13–14), depois volte à página 12 e preencha a próxima forma da sua trilha, da esquerda para a direita."),
      t("Milestones: 8 River Study · 16 Wetland Study · 24 Forest Study · 32 Mountain Study · 40 Prairie Study · 50 Cascadian Biologist.", "Marcos: 8 River Study · 16 Wetland Study · 24 Forest Study · 32 Mountain Study · 40 Prairie Study · 50 Cascadian Biologist."),
      t("You may start gaining achievements at any time; each game uses one mode: Scenarios, Normal Game or Rule Restrictions.", "Você pode começar a ganhar conquistas a qualquer momento; cada partida usa um modo: Cenários, Partida normal ou Restrições.")
    ], [12]);
    let body = "";
    if (mode() === "scenario") {
      const data = scenario();
      const goals = [{ icon: "key-total", en: `<strong>Score at least ${data.target} points.</strong>`, pt: `<strong>Fazer pelo menos ${data.target} pontos.</strong>` }, ...data.goals];
      body = `
        <article class="info-card csc-mode-card">
          <span class="component-label">${t(`SCENARIO ${state.scenario}`, `CENÁRIO ${state.scenario}`)}</span>
          <h3>${t(`${data.target}+ points${data.goals.length ? ` and ${data.goals.length} more objective${data.goals.length === 1 ? "" : "s"}` : ""}`, `${data.target}+ pontos${data.goals.length ? ` e mais ${data.goals.length} objetivo${data.goals.length === 1 ? "" : "s"}` : ""}`)}</h3>
          ${lineList([
            t(`Scoring cards: <strong>${scenarioCardList(data)}</strong>.`, `Cartas de pontuação: <strong>${scenarioCardList(data)}</strong>.`),
            solo() ? t("Solo: pass when you meet every objective; scenarios are meant to be played from 1 to 15.", "Solo: você passa ao cumprir todos os objetivos; os cenários foram feitos para jogar de 1 a 15.") : t("Multi-player: every player who meets every objective passes and fills in their shape (not only the winner).", "Vários jogadores: todo jogador que cumprir todos os objetivos passa e preenche a sua forma (não só o vencedor).")
          ])}
          <ul class="csc-objectives">${goals.map((goal) => `<li><img src="${ICONS}${goal.icon}.webp" alt=""><span>${t(goal.en, goal.pt)}${goal.readEn ? ` ${interpretation(goal.readEn, goal.readPt)}` : ""}</span></li>`).join("")}</ul>
          <p class="csc-note">${t("The symbols shown are the key's generic symbols (page 12); the scenario prints the specific animals and habitats described here.", "Os símbolos mostrados são os genéricos da legenda (página 12); o cenário imprime os animais e habitats específicos descritos aqui.")}</p>
          ${refs([12, 13])}
        </article>
        ${infoCard(t("READING THE OBJECTIVES", "LENDO OS OBJETIVOS"), t("How this guide applies the key", "Como este guia aplica a legenda"), [
          interpretation("“points in a habitat” = that habitat's corridor points plus its bonus, as both sit in the habitat's Scorepad box (the H subtotal on page 9 includes the bonuses).", "“pontos num habitat” = os pontos do corredor desse habitat mais o bônus, pois os dois ficam na casa do habitat no bloco (o subtotal H da página 9 inclui os bônus)."),
          interpretation("“placed next to one another” = for wildlife, tokens on two touching tiles; for habitats, the touching edges of two different tiles (the two halves of one tile with two habitats, and the hexes of your Starter Habitat Tile among themselves, do not count). These are placement bans: such a placement is not allowed.", "“colocados encostados” = para animais, fichas em duas peças que se tocam; para habitats, as bordas que se tocam de duas peças diferentes (as duas metades de uma peça com dois habitats, e os hexágonos da sua Peça Inicial entre si, não contam). São proibições de colocação: essa colocação não é permitida."),
          interpretation("“cannot be placed on a habitat” = not on any tile that shows that habitat, even as one of its two habitats.", "“não pode ser colocado num habitat” = em nenhuma peça que mostre esse habitat, mesmo como um dos seus dois habitats."),
          interpretation("“fully score” = a scoring group reaches the highest value printed on that wildlife's card.", "“pontuar por completo” = um grupo que pontua atinge o maior valor impresso na carta daquele animal.")
        ], [12, 13])}`;
    } else if (mode() === "normal") {
      body = `
        <article class="info-card csc-mode-card">
          <span class="component-label">${t("NORMAL GAME", "PARTIDA NORMAL")}</span>
          <h3>${t("The winner fills in at most one achievement", "O vencedor preenche no máximo uma conquista")}</h3>
          ${lineList([
            t("Set up and play a multi-player game with the normal rules.", "Prepare e jogue uma partida com vários jogadores e as regras normais."),
            interpretation("if the victory is shared, every tied winner may fill in one shape.", "se a vitória for dividida, todo vencedor empatado pode preencher uma forma."),
            t("After scoring, the winner may fill in a maximum of one shape in their column, if they earned one of these achievements:", "Depois da pontuação, o vencedor pode preencher no máximo uma forma na sua coluna, se ganhou uma destas conquistas:")
          ])}
          <ol class="card-lines">${NORMAL_ACHIEVEMENTS.map(([itemEn, itemPt]) => `<li>${t(itemEn, itemPt)}</li>`).join("")}</ol>
          ${refs([14])}
        </article>`;
    } else {
      const data = RESTRICTIONS[restriction() - 1];
      body = `
        <article class="info-card csc-mode-card">
          <span class="component-label">${t(`RULE RESTRICTION ${state.restriction}`, `RESTRIÇÃO ${state.restriction}`)}</span>
          <h3>${t(data.en, data.pt)}</h3>
          ${lineList([
            data.readEn ? interpretation(data.readEn, data.readPt) : null,
            t("Set up and play a multi-player game with the normal rules plus this one restriction.", "Prepare e jogue uma partida com vários jogadores com as regras normais mais esta restrição."),
            t("The winner fills in their shape under this restriction on page 14 (then the next shape on the hiking chart).", "O vencedor preenche sua forma sob esta restrição na página 14 (e depois a próxima forma do mapa de trilha)."),
            interpretation("if the victory is shared, every tied winner fills in their shape.", "se a vitória for dividida, todo vencedor empatado preenche sua forma.")
          ])}
          ${refs([14])}
        </article>`;
    }
    return `
      ${sectionHeading("achievements", t("Achievements", "Conquistas"), sectionIndex("achievements"), mode() === "scenario" ? [12, 13] : [12, 14])}
      <p class="glossary-intro">${t("Study the habitats and wildlife to gain achievements as you hike toward becoming a Cascadian biologist. Achievements are recorded by writing in the rulebook itself.", "Estude os habitats e os animais para ganhar conquistas enquanto percorre a trilha até virar um biólogo de Cascadia. As conquistas são registradas escrevendo no próprio manual.")} ${referenceLink(12)}</p>
      <div class="quick-grid">${body}${common}</div>`;
  }

  // ---------- iconography ----------

  const KEY_TEXT = {
    "key-total": ["Score at least # total points", "Fazer pelo menos # pontos no total"],
    "key-fully-score": ["Fully score Wildlife # of times", "Pontuar o animal por completo # vezes"],
    "key-any-habitats": ["Score at least # points per any # Habitats", "Fazer pelo menos # pontos em cada um de # Habitats quaisquer"],
    "key-each-wildlife": ["Score at least # points in each Wildlife shown", "Fazer pelo menos # pontos em cada animal mostrado"],
    "key-each-habitat": ["Score at least # points per Habitat shown", "Fazer pelo menos # pontos em cada Habitat mostrado"],
    "key-category-total": ["Score # total points in (W)ildlife or (H)abitat", "Fazer # pontos no total em Animais (W) ou Habitats (H)"],
    "key-play-wildlife": ["Play at least # of each Wildlife shown", "Jogar pelo menos # de cada animal mostrado"],
    "key-no-adjacent-wildlife": ["Wildlife types cannot be placed next to one another", "Os tipos de animal não podem ser colocados encostados"],
    "key-no-adjacent-habitat": ["Habitat types cannot be placed next to one another", "Os tipos de habitat não podem ser colocados encostados"],
    "key-wildlife-not-on-habitat": ["Wildlife type cannot be placed on Habitat type", "O tipo de animal não pode ser colocado no tipo de habitat"],
    "key-wildlife-adjacent": ["1st Wildlife type must be adjacent to 2nd Wildlife type", "O 1º tipo de animal precisa estar adjacente ao 2º"],
    "key-any-wildlife": ["Score at least # points per any # Wildlife", "Fazer pelo menos # pontos em cada um de # animais quaisquer"]
  };

  const HABITAT_LOOK = {
    mountain: ["snowy gray-white peaks", "picos cinza e brancos com neve"],
    forest: ["dense dark-green tree tops", "copas verde-escuras e densas"],
    prairie: ["plain golden yellow grass", "capim amarelo-dourado liso"],
    wetland: ["light green with blue pools", "verde-claro com poças azuis"],
    river: ["blue water with gray rocks", "água azul com pedras cinza"]
  };

  function iconsSection() {
    const keyIcons = mode() === "scenario"
      ? ["key-total", ...new Set(scenario().goals.map((goal) => goal.icon).filter((file) => file.startsWith("key-")))]
      : [];
    const countIcon = solo() ? "players-2" : `players-${players()}`;
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), sectionIndex("icons"), [3, 8, 9])}
      <p class="glossary-intro">${t("Tokens, habitats, tiles and printed symbols, each cropped individually from the rulebook's pictures.", "Fichas, habitats, peças e símbolos impressos, cada um recortado individualmente das imagens do manual.")}</p>
      <h3 class="subhead">${t("Wildlife Tokens · 20 of each", "Fichas de Animais · 20 de cada")}</h3>
      <div class="icon-grid">
        ${WILDLIFE_IDS.map((id) => iconCard(`token-${id}`, `${WILDLIFE[id].en} token`, `Round token (${{ bear: "brown", elk: "tan", salmon: "pink", hawk: "light blue", fox: "orange" }[id]}). It may only go on a tile that shows the ${WILDLIFE[id].en.toLowerCase()} symbol and has no token yet.`, `Ficha de ${WILDLIFE[id].pt}`, `Ficha redonda (${{ bear: "marrom", elk: "bege", salmon: "rosa", hawk: "azul-claro", fox: "laranja" }[id]}). Só pode ir numa peça que mostre o símbolo do ${WILDLIFE[id].pt.toLowerCase()} e ainda não tenha ficha.`.replace("do raposa", "da raposa"), 3)).join("")}
      </div>
      <h3 class="subhead">${t("The five habitats", "Os cinco habitats")}</h3>
      <div class="icon-grid">
        ${HABITAT_IDS.map((id) => iconCard(`habitat-${id}`, HABITATS[id].en, `Habitat: ${HABITAT_LOOK[id][0]}.${habitatScoringOn() ? " Your largest corridor of it scores 1 point per tile." : ""} Shown on the Scorepad as this hex.`, HABITATS[id].pt, `Habitat: ${HABITAT_LOOK[id][1]}.${habitatScoringOn() ? " O seu maior corredor dele vale 1 ponto por peça." : ""} Aparece assim no bloco de pontuação.`, 9)).join("")}
      </div>
      <h3 class="subhead">${t("Tiles", "Peças")}</h3>
      <div class="icon-grid">
        ${iconCard("tile-wetland-river", "Two-habitat tile", "Wetlands and Rivers on one tile, with 3 wildlife options: a salmon, bear or hawk may be placed on it.", "Peça com dois habitats", "Pântanos e Rios numa peça, com 3 opções de animal: pode receber salmão, urso ou gavião.", 8)}
        ${iconCard("tile-mountain-prairie", "Two-habitat tile", "Mountains and Prairies, with 2 wildlife options: a bear or a fox.", "Peça com dois habitats", "Montanhas e Pradarias, com 2 opções de animal: urso ou raposa.", 8)}
        ${iconCard("tile-keystone-forest", "Keystone Tile", "A single habitat and a single wildlife (here Forest and elk). Placing the matching token on it earns a Nature Token.", "Peça-chave", "Um único habitat e um único animal (aqui Floresta e alce). Colocar a ficha correspondente nela rende uma Ficha de Natureza.", 8)}
        ${iconCard("keystone-marker", "Keystone marker", "The small white tab at the top edge that identifies a Keystone Tile. 25 of the 85 Habitat Tiles are Keystone Tiles.", "Marca de peça-chave", "A pequena aba branca na borda de cima que identifica uma Peça-chave. 25 das 85 Peças de Habitat são Peças-chave.", 8)}
        ${HABITAT_IDS.map((id) => iconCard(`keystone-${id}`, `Keystone Tile · ${HABITATS[id].en}`, `One of the Keystone Tiles of the ${HABITATS[id].en} (component page).`, `Peça-chave · ${HABITATS[id].pt}`, `Uma das Peças-chave de ${HABITATS[id].pt} (página de componentes).`, 3)).join("")}
        ${hasRestriction(7) ? "" : iconCard("starter-tile", "Starter Habitat Tile", "3 habitat hexes joined in a triangle; the top hex is a keystone hex. One per player starts the environment (5 in the box).", "Peça Inicial de Habitat", "3 hexágonos de habitat unidos em triângulo; o de cima é uma peça-chave. Uma por jogador inicia o ambiente (5 na caixa).", 3)}
      </div>
      <h3 class="subhead">${t("Components and Scorepad", "Componentes e bloco de pontuação")}</h3>
      <div class="icon-grid">
        ${iconCard("cloth-bag", "Cloth Bag", "Holds the 100 Wildlife Tokens; refill tokens are drawn at random from it and wiped tokens return to it.", "Saco de pano", "Guarda as 100 Fichas de Animais; as fichas de reposição saem dele ao acaso e as renovadas voltam para ele.", 3)}
        ${iconCard("nature-token", "Nature Token", "A pine cone (25 in the supply). Earned on Keystone Tiles; spend before selecting for a free choice or a wipe; 1 point each at the end.", "Ficha de Natureza", "Uma pinha (25 na reserva). Ganha em Peças-chave; gaste antes de escolher para escolha livre ou renovação; 1 ponto cada no fim.", 8)}
        ${iconCard(countIcon, solo() ? "Player count · 2 (solo setup)" : `Player count · ${players()}`, solo() ? "The setup chart's 2-player line: solo uses its 43 tiles." : `The setup chart's line for ${players()} players: ${players() * 20 + 3} tiles${hasRestriction(5) ? " (restriction 5 then removes 1 more)" : ""}.`, solo() ? "Número de jogadores · 2 (preparação solo)" : `Número de jogadores · ${players()}`, solo() ? "A linha de 2 jogadores da tabela de preparação: o solo usa as 43 peças dela." : `A linha de ${players()} jogadores da tabela de preparação: ${players() * 20 + 3} peças${hasRestriction(5) ? " (a restrição 5 tira mais 1)" : ""}.`, 4, "is-wide")}
        ${iconCard("score-wildlife-total", "W · Wildlife subtotal", "Scorepad row with the sum of the five wildlife rows.", "W · Subtotal de animais", "Linha do bloco com a soma das cinco linhas de animais.", 9)}
        ${habitatScoringOn() ? iconCard("score-habitat-total", "H · Habitat subtotal", "Scorepad row with the sum of the habitat corridors and bonuses.", "H · Subtotal de habitats", "Linha do bloco com a soma dos corredores e bônus de habitat.", 9) : ""}
        ${habitatScoringOn() && majorityOn() ? iconCard("score-majority-plus", "+ · Bonus corner", "Bottom-right corner of each habitat box: the majority (or solo) bonus goes there.", "+ · Canto do bônus", "Canto inferior direito de cada casa de habitat: ali vai o bônus de maioria (ou do solo).", 9) : ""}
        ${iconCard("score-total", "Total", "Final row of the Scorepad: the player's total.", "Total", "Última linha do bloco: o total do jogador.", 9)}
      </div>
      ${mode() !== "none" ? `
        <h3 class="subhead">${t("Achievement shapes (one per hiking track)", "Formas de conquista (uma por trilha)")}</h3>
        <div class="icon-grid">
          ${[["circle", "Circle", "Círculo"], ["oval", "Oval", "Oval"], ["triangle", "Triangle", "Triângulo"], ["diamond", "Diamond", "Losango"], ["square", "Square", "Quadrado"]].map(([id, nameEn, namePt]) => iconCard(`shape-${id}`, nameEn, "If your hiking track uses this shape, fill it in under each achievement you earn and along your trail.", namePt, "Se a sua trilha usa esta forma, preencha-a sob cada conquista que ganhar e ao longo da sua trilha.", 12)).join("")}
        </div>` : ""}
      ${keyIcons.length ? `
        <h3 class="subhead">${t("Achievement key used by this scenario", "Legenda de conquistas usada por este cenário")}</h3>
        <div class="icon-grid">
          ${keyIcons.map((file) => iconCard(file, KEY_TEXT[file][0], "Key symbol from page 12; “#” is replaced by the scenario's number and the pictured animals/habitats by its own.", KEY_TEXT[file][1], "Símbolo da legenda da página 12; o “#” é trocado pelo número do cenário e os animais/habitats desenhados pelos dele.", 12, "is-wide")).join("")}
        </div>` : ""}`;
  }

  // ---------- examples ----------

  function examplesSection() {
    const examples = [];
    examples.push({
      title: t("The display", "A oferta"), page: 6, art: "display-options", lines: [
        t("Four Habitat Tiles, each with the Wildlife Token below it: Options A to D.", "Quatro Peças de Habitat, cada uma com a Ficha de Animal abaixo: Opções A a D."),
        displaySize() === 3 ? t("In this match (restriction 5) the display has only 3 pairs.", "Nesta partida (restrição 5) a oferta tem só 3 pares.") : null,
        t("Without a Nature Token you take one whole column, e.g. Option C: the tile above and the bear below.", "Sem Ficha de Natureza você pega uma coluna inteira, ex.: Opção C: a peça de cima e o urso de baixo.")
      ]
    });
    if (displaySize() === 4) {
      examples.push({
        title: t("Overpopulation: 4 salmon", "Superpopulação: 4 salmões"), page: 6, art: "overpopulation-4", lines: [
          t("All 4 tokens are salmon: they are wiped automatically before the active player selects.", "As 4 fichas são salmões: elas são renovadas automaticamente antes de o jogador ativo escolher."),
          t("Set the 4 aside, draw 4 new tokens one at a time and pair them in order; return the salmon to the bag afterwards.", "Separe as 4, tire 4 fichas novas uma de cada vez e forme os pares em ordem; depois devolva os salmões ao saco.")
        ]
      });
    }
    examples.push({
      title: t("Overpopulation: 3 foxes", "Superpopulação: 3 raposas"), page: 6, art: "overpopulation-3", lines: [
        t("Three tokens are foxes: the active player may choose to wipe just those 3 (the bear stays).", "Três fichas são raposas: o jogador ativo pode escolher renovar só essas 3 (o urso fica)."),
        t("This optional wipe can be used only once per turn.", "Essa renovação opcional só pode ser usada uma vez por turno.")
      ]
    });
    examples.push({
      title: t("Where can a tile go?", "Onde uma peça pode ir?"), page: 7, art: "tile-adjacency", lines: [
        t("Every space marked with a check touches at least one side of a tile already in the environment.", "Todo espaço marcado com um visto encosta em pelo menos um lado de uma peça já presente no ambiente."),
        t("The space marked with an X touches no tile, so it is not allowed. Matching habitats is not required.", "O espaço marcado com X não encosta em nenhuma peça, então não é permitido. Combinar habitats não é obrigatório.")
      ]
    });
    examples.push({
      title: t("Where can the fox go?", "Onde a raposa pode ir?"), page: 7, art: "token-placement", lines: [
        t("There are 2 possible tiles: open tiles (no token yet) that show a fox symbol.", "Há 2 peças possíveis: peças livres (sem ficha) que mostram o símbolo da raposa."),
        t("The tiles marked with an X are not allowed: one has no fox symbol, the other already holds a token.", "As peças marcadas com X não são permitidas: uma não tem o símbolo da raposa, a outra já tem uma ficha.")
      ]
    });
    if (habitatScoringOn()) {
      examples.push({
        title: t("Largest corridor", "Maior corredor"), page: 8, lines: [
          t("You have a group of 3 connected Forests and a separate group of 4 Forests.", "Você tem um grupo de 3 Florestas conectadas e outro grupo separado de 4 Florestas."),
          t("Only the largest counts: 4 points for Forests (top-left of the Forest box).", "Só o maior conta: 4 pontos de Floresta (no canto superior esquerdo da casa da Floresta)."),
          hasRestriction(4) ? t("With rule restriction 4 a largest corridor of 4 would score 0.", "Com a restrição 4, um maior corredor de 4 valeria 0.") : null,
          hasRestriction(3) ? t("With rule restriction 3 only the group of exactly 3 scores, for 3 points.", "Com a restrição 3, só o grupo de exatamente 3 pontua, valendo 3 pontos.") : null
        ]
      });
    }
    if (standard()) {
      examples.push({ jade: true, title: t("Scoring Jade's environment (A cards, 3 players)", "Pontuando o ambiente de Jade (cartas A, 3 jogadores)"), page: 9 });
    }
    if (!standard()) {
      examples.push({
        title: state.cards === "family" ? t("Family Variant groups", "Grupos da Variante Família") : t("Counting groups (the rulebook's Family example)", "Contando grupos (exemplo da Família no manual)"), page: 10, art: "family-example", lines: [
          t("A group of 3 salmon, a group of 2 foxes, a group of 2 elk, 2 single bears and 3 single hawks.", "Um grupo de 3 salmões, um grupo de 2 raposas, um grupo de 2 alces, 2 ursos sozinhos e 3 gaviões sozinhos."),
          state.cards === "family" ? t("With the Family card: 9 + 5 + 5 + 2 × 2 + 3 × 2 = 29 points (this guide's arithmetic).", "Com a carta Família: 9 + 5 + 5 + 2 × 2 + 3 × 2 = 29 pontos (a conta é deste guia).") : t("With the Intermediate card, score the same groups with the values printed on that side.", "Com a carta Intermediária, pontue os mesmos grupos com os valores impressos nesse lado.")
        ]
      });
    }
    const pages = examples.map((example) => example.page);
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), sectionIndex("examples"), pages)}
      <div class="example-grid">${examples.filter((example) => !example.jade).map((example, index) => `
        <article class="example-card">
          <span class="card-number">${String(index + 1).padStart(2, "0")}</span>
          <h3>${example.title}</h3>
          ${lineList(example.lines)}
          ${example.art ? `<img src="${ART}${example.art}.webp" alt="${example.title}" loading="lazy" style="width:100%;height:auto;margin-top:10px;border:1px solid var(--line)">` : ""}
          <div class="example-source"><span>${t("From the rulebook's examples", "Dos exemplos do manual")}</span>${referenceLink(example.page)}</div>
        </article>`).join("")}</div>
      ${standard() ? jadeExample() : ""}`;
  }

  function jadeExample() {
    const rowsData = [
      [icon("token-bear", wName("bear")), wName("bear"), "11", "19", "4"],
      [icon("token-elk", wName("elk")), wName("elk"), "14", "7", "11"],
      [icon("token-salmon", wName("salmon")), wName("salmon"), "12", "20", "16"],
      [icon("token-hawk", wName("hawk")), wName("hawk"), "11", "8", "14"],
      [icon("token-fox", wName("fox")), wName("fox"), "11", "13", "10"],
      [icon("score-wildlife-total", "W"), t("Wildlife (W)", "Animais (W)"), "59", "67", "55", true],
      [icon("habitat-mountain", hName("mountain")), hName("mountain"), "6 + 2", "5", "6 + 2"],
      [icon("habitat-forest", hName("forest")), hName("forest"), "4 + 1", "4 + 1", "4 + 1"],
      [icon("habitat-prairie", hName("prairie")), hName("prairie"), "7 + 1", "3", "8 + 3"],
      [icon("habitat-wetland", hName("wetland")), hName("wetland"), "8 + 3", "7 + 1", "6"],
      [icon("habitat-river", hName("river")), hName("river"), "5", "7 + 2", "7 + 2"],
      [icon("score-habitat-total", "H"), t("Habitats (H)", "Habitats (H)"), "37", "30", "39", true],
      [natureIcon(), t("Nature Tokens", "Fichas de Natureza"), "2", "0", "1"],
      [icon("score-total", "Total"), "Total", "98", "97", "95", true]
    ];
    return `
      <h3 class="subhead">${t("Scoring Jade's environment (A cards, 3 players)", "Pontuando o ambiente de Jade (cartas A, 3 jogadores)")}</h3>
      ${effectiveDeal() !== "recommended" || players() !== 3 ? `<p class="csc-note">${t("This rulebook example uses the five A cards and the 3-player majorities; your match may differ, but the method is the same.", "Este exemplo do manual usa as cinco cartas A e as maiorias de 3 jogadores; sua partida pode ser diferente, mas o método é o mesmo.")}</p>` : ""}
      ${figure("jade-environment", "Jade's environment and her two unused Nature Tokens.", "O ambiente de Jade e suas duas Fichas de Natureza não usadas.", 9)}
      <div class="quick-grid" style="margin-top:14px">
        ${infoCard(t("JADE", "JADE"), t("Wildlife and habitats", "Animais e habitats"), [
          rl("Bear A", "two pairs of bears → 11.", "Urso A", "dois pares de ursos → 11."),
          rl("Elk A", "a line of 2 elk and a line of 3 elk → 5 + 9 = 14.", "Alce A", "uma linha de 2 alces e uma de 3 → 5 + 9 = 14."),
          rl("Salmon A", "a run of 4 salmon → 12.", "Salmão A", "uma corrida de 4 salmões → 12."),
          rl("Hawk A", "four isolated hawks → 11.", "Gavião A", "quatro gaviões isolados → 11."),
          rl("Fox A", "three foxes → 3 + 5 + 3 = 11.", "Raposa A", "três raposas → 3 + 5 + 3 = 11."),
          rl("Mountains", "6 connected, tied with Ash for largest → 6 + 2.", "Montanhas", "6 conectadas, empate com Ash no maior → 6 + 2."),
          rl("Forests", "4 connected, a three-way tie → 4 + 1.", "Florestas", "4 conectadas, empate triplo → 4 + 1."),
          rl("Prairies", "7 connected, less than Ash's 8 → 7 + 1 (second largest).", "Pradarias", "7 conectadas, menos que as 8 de Ash → 7 + 1 (segundo maior)."),
          rl("Wetlands", "8 connected, more than Lee and Ash → 8 + 3.", "Pântanos", "8 conectados, mais que Lee e Ash → 8 + 3."),
          rl("Rivers", "5 connected, the least → 5, no bonus.", "Rios", "5 conectados, o menor → 5, sem bônus."),
          rl("Nature Tokens", "2 unused → 2.", "Fichas de Natureza", "2 não usadas → 2.")
        ], [9])}
        <div class="csc-table-wrap">
          <table class="csc-score-table">
            <thead><tr><th scope="col"></th><th scope="col">${t("Row", "Linha")}</th><th scope="col">Jade</th><th scope="col">Lee</th><th scope="col">Ash</th></tr></thead>
            <tbody>${rowsData.map(([glyph, label, a, b, c, total]) => `<tr class="${total ? "is-total" : ""}"><td>${glyph}</td><th scope="row">${label}</th><td>${a}</td><td>${b}</td><td>${c}</td></tr>`).join("")}</tbody>
          </table>
        </div>
      </div>
      <p class="csc-note">${t("Habitat cells show corridor + bonus. Jade wins with 98, Lee 97, Ash 95. Rivers: Lee and Ash tie for largest (7) → 2 each, so nobody gets the second-place point.", "As casas de habitat mostram corredor + bônus. Jade vence com 98, Lee 97, Ash 95. Rios: Lee e Ash empatam no maior (7) → 2 para cada, então ninguém ganha o ponto de segundo lugar.")} ${referenceLink(9)}</p>`;
  }

  // ---------- glossary ----------

  function glossarySection() {
    const visible = [
      { term: ["Adjacent", "Adjacente"], en: "adjacent", text: ["Sharing a side. Each hex has 6 neighbours; two touching hexes have 8 neighbours between them.", "Compartilhando um lado. Cada hexágono tem 6 vizinhos; dois hexágonos encostados têm, juntos, 8 vizinhos."], page: 7 },
      { term: ["Display", "Oferta"], en: "center of the play area", text: [`The ${displaySize()} Habitat Tile + Wildlife Token pairs in the center that players draft from.`, `Os ${displaySize()} pares Peça de Habitat + Ficha de Animal no centro de onde os jogadores escolhem.`], page: 6 },
      { term: ["Environment", "Ambiente"], en: "environment", text: ["The whole arrangement of tiles and tokens in front of a player, including the Starter Habitat Tile.", "Todo o arranjo de peças e fichas à frente de um jogador, incluindo a Peça Inicial de Habitat."], page: 5 },
      { term: ["Habitat corridor", "Corredor de habitat"], en: "habitat corridor", text: ["A group of connected tiles of one habitat, joined by matching edges. Your largest one per habitat scores.", "Um grupo de peças conectadas de um habitat, unidas por bordas que combinam. O seu maior em cada habitat pontua."], page: 8 },
      { term: ["Habitat Tile", "Peça de Habitat"], en: "Habitat Tile", text: ["A hex with one or two habitats and one to three wildlife symbols.", "Um hexágono com um ou dois habitats e de um a três símbolos de animais."], page: 8 },
      { term: ["Keystone Tile", "Peça-chave"], en: "Keystone Tile", text: ["A single-habitat tile with one wildlife symbol and the keystone marker; a matching token on it earns a Nature Token.", "Uma peça de um só habitat com um símbolo de animal e a marca de peça-chave; a ficha correspondente nela rende uma Ficha de Natureza."], page: 8 },
      { term: ["Nature Token", "Ficha de Natureza"], en: "Nature Token", text: ["A pine cone earned on Keystone Tiles, spent for a free choice or a wipe, worth 1 point at the end.", "Uma pinha ganha em Peças-chave, gasta para escolha livre ou renovação, valendo 1 ponto no fim."], page: 8 },
      { term: ["Overpopulation", "Superpopulação"], en: "overpopulation", text: displaySize() === 3 ? ["Too many identical tokens in the display: with 3 pairs, 3 identical tokens may be wiped once per turn.", "Fichas iguais demais na oferta: com 3 pares, 3 fichas iguais podem ser renovadas uma vez por turno."] : ["Too many identical tokens in the display: 4 are wiped automatically, 3 may be wiped once per turn.", "Fichas iguais demais na oferta: 4 são renovadas automaticamente, 3 podem ser renovadas uma vez por turno."], page: 6 },
      { term: ["Pair (display)", "Par (oferta)"], en: "combination", text: ["One Habitat Tile and the Wildlife Token below it, taken together.", "Uma Peça de Habitat e a Ficha de Animal abaixo dela, pegas juntas."], page: 4 },
      { term: ["Scorepad", "Bloco de pontuação"], en: "Scorepad", text: ["The score sheet: wildlife rows, W, habitat boxes (corridor/bonus), H, Nature Tokens, total.", "A folha de pontos: linhas de animais, W, casas de habitat (corredor/bônus), H, Fichas de Natureza, total."], page: 9 },
      { term: ["Starter Habitat Tile", "Peça Inicial de Habitat"], en: "Starter Habitat Tile", text: ["A 3-hex tile that starts each environment.", "Uma peça de 3 hexágonos que inicia cada ambiente."], page: 4 },
      { term: ["Wildlife Scoring Card", "Carta de Pontuação"], en: "Wildlife Scoring Card", text: standard() ? ["One card per wildlife (A–D) that says how that wildlife scores this game.", "Uma carta por animal (A–D) que diz como esse animal pontua nesta partida."] : ["Here, the single Family/Intermediate card that scores every wildlife by groups.", "Aqui, a carta única Família/Intermediária que pontua todo animal por grupos."], page: 11 },
      { term: ["Wildlife Token", "Ficha de Animal"], en: "Wildlife Token", text: ["A round token showing a bear, elk, salmon, hawk or fox; at most one per tile.", "Uma ficha redonda com urso, alce, salmão, gavião ou raposa; no máximo uma por peça."], page: 3 },
      { term: ["Wipe", "Renovar"], en: "wipe", text: ["Set tokens aside, draw replacements one at a time in order, then return the wiped tokens to the bag.", "Separar fichas, tirar substitutas uma de cada vez em ordem e depois devolver as renovadas ao saco."], page: 6 }
    ];
    if (standard()) {
      visible.push(
        { term: ["Line of sight", "Linha de visão"], en: "line of sight", text: ["A straight line from flat side to flat side of the hexes, interrupted only by another hawk.", "Uma linha reta de lado plano a lado plano dos hexágonos, interrompida só por outro gavião."], page: 11 },
        { term: ["Run (salmon)", "Corrida (salmão)"], en: "run", text: ["Adjacent salmon where each touches at most 2 others, with no other salmon attached.", "Salmões adjacentes em que cada um encosta em no máximo 2 outros, sem outro salmão ligado."], page: 11 },
        { term: ["Group", "Grupo"], en: "group", text: ["Touching tokens of the same wildlife (bears, elk, or any animal with the variant cards).", "Fichas encostadas do mesmo animal (ursos, alces ou qualquer animal com as cartas das variantes)."], page: 11 }
      );
    } else {
      visible.push({ term: ["Group", "Grupo"], en: "group", text: ["All touching tokens of the same wildlife; scored by size on the variant card.", "Todas as fichas encostadas do mesmo animal; pontuadas pelo tamanho na carta da variante."], page: 10 });
    }
    if (habitatScoringOn() && majorityOn() && !solo()) {
      visible.push({ term: ["Majority", "Maioria"], en: "Habitat Tile Corridor Majorities", text: ["Bonus for the largest (and in 3–4 players second largest) corridor of each habitat.", "Bônus para o maior (e com 3–4 jogadores o segundo maior) corredor de cada habitat."], page: 9 });
    }
    if (mode() !== "none") {
      visible.push({ term: ["Achievement", "Conquista"], en: "Achievement", text: ["A long-term goal recorded by filling in your shape in the rulebook (pages 12–14).", "Um objetivo de longo prazo registrado preenchendo a sua forma no manual (páginas 12–14)."], page: 12 });
    }
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    const pages = visible.map((item) => item.page);
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), sectionIndex("glossary"), pages)}
      ${state.language === "pt-BR" ? `<p class="glossary-intro">O manual fornecido está em inglês; cada termo mostra entre parênteses a palavra impressa nele.</p>` : ""}
      <div class="quick-grid glossary-grid">${visible.map((item) => `
        <article class="info-card glossary-card">
          <span class="component-label">${t("TERM", "TERMO")}</span>
          <h3>${t(item.term[0], item.term[1])}${en(item.en)}</h3>
          <p>${t(item.text[0], item.text[1])}</p>
          ${referenceLink(item.page)}
        </article>`).join("")}</div>`;
  }

  // ---------- render ----------

  function renderInto(host) {
    root = host;
    document.body.classList.add("theme-cascadia");
    document.documentElement.lang = state.language;
    document.title = t("Cascadia — Field Manual", "Cascadia — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Cascadia: 1–4 players, standard, Family or Intermediate scoring, achievements (scenarios, normal game, rule restrictions), a match-filtered setup checklist, quick reference, turn, every wildlife scoring card, final scoring, iconography and the rulebook's examples.",
        "Regras interativas bilíngues de Cascadia: 1–4 jogadores, pontuação padrão, Família ou Intermediária, conquistas (cenários, partida normal, restrições), lista de preparação filtrada, referência rápida, turno, todas as cartas de pontuação, pontuação final, iconografia e os exemplos do manual."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook · core game", "Livro interativo · jogo base")}</p>
          <h1>Cascadia</h1>
          <p class="hero-intro">${t(
            "A puzzly tile-laying and token-drafting game of the habitats and wildlife of the Pacific Northwest. Draft Habitat Tiles and Wildlife Tokens to build the most diverse environment: arrange wildlife into the scoring patterns on the cards while competing for the largest habitat corridors.",
            "Um jogo de quebra-cabeça com colocação de peças e escolha de fichas, sobre os habitats e os animais do noroeste do Pacífico. Escolha Peças de Habitat e Fichas de Animais para montar o ambiente mais diverso: organize os animais nos padrões das cartas enquanto disputa os maiores corredores de habitat."
          )}</p>
          <div class="hero-meta"><span>${t("1–4 players", "1–4 jogadores")}</span><span>${t("20 turns each", "20 turnos cada")}</span><span>${t("Tile laying · drafting", "Colocação de peças · escolha")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/cascadia.webp" alt="${t("Cover of the Cascadia rulebook: a Roosevelt elk in front of snowy mountains, a lake and a forest, under the title CASCADIA", "Capa do manual de Cascadia: um alce-de-roosevelt diante de montanhas nevadas, um lago e uma floresta, sob o título CASCADIA")}" fetchpriority="high"><figcaption>${t("Rulebook cover · game by Randy Flynn, Flatout Games / AEG", "Capa do manual · jogo de Randy Flynn, Flatout Games / AEG")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("The trail", "A trilha")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column csc-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied Cascadia rulebook (AEG / Flatout Games, 2021, English): the game for 2–4 players, Solo Mode, the Family and Intermediate variants and the Achievements (15 scenarios, 25 Normal Game achievements and 10 rule restrictions). Points marked “Guide's reading” are interpretations where the rulebook is silent. Page links open the PDF at the printed page number.",
            "Este guia cobre o manual fornecido de Cascadia (AEG / Flatout Games, 2021, em inglês): o jogo para 2–4 jogadores, o modo solo, as variantes Família e Intermediária e as Conquistas (15 cenários, 25 conquistas da Partida normal e 10 restrições). Pontos marcados como “Leitura do guia” são interpretações onde o manual é omisso. Os links abrem o PDF na página impressa."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${turnSection()}</section>
          <section class="rule-section">${wildlifeCardsSection()}</section>
          <section class="rule-section">${endGameSection()}</section>
          ${mode() !== "none" ? `<section class="rule-section">${achievementsSection()}</section>` : ""}
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the Cascadia rulebook. Design: Randy Flynn; illustration: Beth Sobel; solo mode: Shawn Stankewich. © 2021 Alderac Entertainment Group / Flatout Games.",
        "Guia pessoal de consulta baseado no manual de Cascadia. Autor: Randy Flynn; ilustração: Beth Sobel; modo solo: Shawn Stankewich. © 2021 Alderac Entertainment Group / Flatout Games."
      )}</p></footer>`;
  }

  function rerender() {
    const scrollY = window.scrollY;
    renderInto(root);
    window.scrollTo(0, scrollY);
  }

  function onClick(event) {
    const button = event.target instanceof Element ? event.target.closest("button") : null;
    if (!button || !root || !root.contains(button)) {
      return;
    }
    if (button.dataset.language) {
      state.language = button.dataset.language === "en-US" ? "en-US" : "pt-BR";
      notice = null;
      savePreferences();
      rerender();
      return;
    }
    if (button.hasAttribute("data-setup-reset")) {
      setupState = { signature: signature(), checks: [] };
      saveSetup();
      rerender();
      return;
    }
    if (button.dataset.scroll) {
      document.getElementById(button.dataset.scroll)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
      label.textContent = t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`);
    }
    updateStorageNotice();
  }

  function updateStorageNotice() {
    if (!root) {
      return;
    }
    let element = root.querySelector("[data-storage-notice]");
    if (!storageIssues.size) {
      element?.remove();
      return;
    }
    if (!element) {
      element = document.createElement("p");
      element.className = "storage-notice";
      element.dataset.storageNotice = "";
      element.setAttribute("role", "status");
      root.querySelector(".csc-page")?.prepend(element);
    }
    element.textContent = storageNoticeText();
  }

  function changePreference(patch) {
    const before = signature();
    const requested = { ...state, ...patch };
    state = normalizePreferences(requested);
    notice = null;
    if (requested.achievements !== state.achievements) {
      notice = requested.cards !== "standard"
        ? t("Achievements use the standard Wildlife Scoring Cards, so the Achievement mode was set to None.", "As Conquistas usam as Cartas de Pontuação padrão, então o modo de Conquistas voltou para Nenhuma.")
        : t("Normal Game and Rule Restrictions are multi-player modes, so the Achievement mode was set to None for solo.", "Partida normal e Restrições são modos para vários jogadores, então o modo de Conquistas voltou para Nenhuma no solo.");
    }
    savePreferences();
    if (signature() !== before) {
      setupState = { signature: signature(), checks: [] };
      saveSetup();
    }
    rerender();
  }

  const RADIO_FIELDS = {
    players: PLAYER_COUNTS,
    cards: CARD_MODES,
    deal: DEALS,
    majority: YES_NO,
    achievements: ACHIEVEMENT_MODES,
    scenario: SCENARIOS.map((_, index) => String(index + 1)),
    restriction: RESTRICTIONS.map((_, index) => String(index + 1))
  };

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !root || !root.contains(target)) {
      return;
    }
    if (target.type === "radio") {
      for (const [field, allowed] of Object.entries(RADIO_FIELDS)) {
        const value = target.dataset[field];
        if (value !== undefined) {
          if (allowed.includes(value) && value !== state[field]) {
            changePreference({ [field]: value });
          }
          return;
        }
      }
      return;
    }
    if (target.matches("[data-setup-check]")) {
      const id = target.dataset.setupCheck;
      if (!phaseIds().includes(id)) {
        return;
      }
      const checks = new Set(setupState.checks);
      if (target.checked) {
        checks.add(id);
      } else {
        checks.delete(id);
      }
      setupState = { signature: signature(), checks: [...checks] };
      saveSetup();
      updateProgress();
    }
  }

  window.Cascadia = { renderInto, onClick, onChange };
})();
