(() => {
  "use strict";

  const STORAGE_KEY = "field-manual.lotr-duel-for-middle-earth.v1";
  const BOOKS = {
    core: { file: "lotr-duel-for-middle-earth_core.pdf", en: "Rulebook", pt: "Manual" },
    aid: { file: "lotr-duel-for-middle-earth_player-aid.pdf", en: "Player Aid", pt: "Ajuda de jogo" }
  };
  const ASSETS = "assets/lotr-duel-for-middle-earth";

  let storageAvailable = true;
  let storageNotice = "";
  let root = null;

  function defaultState() {
    return {
      language: "pt-BR",
      setupChecks: []
    };
  }

  function normalizeState(saved) {
    const next = defaultState();
    if (!saved || typeof saved !== "object") {
      return next;
    }
    if (saved.language === "en-US" || saved.language === "pt-BR") {
      next.language = saved.language;
    }
    next.setupChecks = Array.isArray(saved.setupChecks)
      ? saved.setupChecks.filter((id) => typeof id === "string")
      : [];
    return next;
  }

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return defaultState();
      }
      return normalizeState(JSON.parse(raw));
    } catch (error) {
      storageAvailable = false;
      storageNotice = "read";
      console.error("Could not read the Duel for Middle-earth match settings.", error);
      return defaultState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      storageAvailable = true;
      if (storageNotice === "write") {
        storageNotice = "";
      }
    } catch (error) {
      storageAvailable = false;
      storageNotice = "write";
      console.error("Could not save the Duel for Middle-earth match settings.", error);
    }
  }

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function manualUrl(book, page) {
    const script = document.querySelector('script[src*="lotr-duel-for-middle-earth.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${BOOKS[book].file}`, baseUrl).href}#page=${page}`;
  }

  function referenceLink(page, book = "core") {
    const label = `${t(BOOKS[book].en, BOOKS[book].pt)} p. ${page} ↗`;
    return `<a class="source-link" href="${escapeHtml(manualUrl(book, page))}" target="_blank" rel="noreferrer">${label}</a>`;
  }

  function refs(...entries) {
    return entries.map((entry) => (Array.isArray(entry) ? referenceLink(entry[0], entry[1]) : referenceLink(entry))).join(" ");
  }

  function sectionHeading(id, title, index, links) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("FIELD GUIDE", "GUIA DE CAMPO")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="glossary-references">${links}</div>
      </div>`;
  }

  function icon(file) {
    return `${ASSETS}/${file}.webp`;
  }

  function iconCard(file, title, description, link) {
    return `
      <article class="icon-card">
        <span class="manual-icon-frame" aria-hidden="true"><img class="manual-icon" src="${icon(file)}" alt=""></span>
        <div><strong>${title}</strong><p>${description}</p>${link ? `<p class="duel-icon-ref">${link}</p>` : ""}</div>
      </article>`;
  }

  function figure(file, caption, alt, cls = "") {
    return `
      <figure class="duel-figure ${cls}">
        <img src="${icon(file)}" alt="${escapeHtml(alt)}" loading="lazy">
        <figcaption>${caption}</figcaption>
      </figure>`;
  }

  function jump(id, label) {
    return `<button type="button" data-scroll="${id}">${label}</button>`;
  }

  function storageNoticeText() {
    if (storageNotice === "read") {
      return t(
        "This browser could not read the saved Duel for Middle-earth match. The guide is showing a new default match, and it may not be possible to save changes.",
        "Este navegador não conseguiu ler a partida salva de Duel for Middle-earth. O guia está mostrando uma partida nova, e pode não ser possível salvar alterações."
      );
    }
    return t(
      "This browser refused to save the Duel for Middle-earth match. Your latest change is on screen only.",
      "Este navegador recusou salvar a partida de Duel for Middle-earth. A última alteração está só na tela."
    );
  }

  // --- Reference data --------------------------------------------------------

  const CARD_COLORS = [
    { file: "color-grey", en: "Grey · Skills", pt: "Cinza · Habilidades", en_d: "Provide Skill symbols used to pay for other cards and tiles.", pt_d: "Fornecem símbolos de Habilidade usados para pagar outras cartas e tiles.", target: "effects" },
    { file: "color-yellow", en: "Yellow · Coins", pt: "Amarela · Moedas", en_d: "Immediately give Coins from the reserve.", pt_d: "Dão Moedas da reserva imediatamente.", target: "effects" },
    { file: "color-blue", en: "Blue · Quest of the Ring", pt: "Azul · Demanda do Anel", en_d: "Immediately advance your character on the Quest of the Ring track.", pt_d: "Avançam seu personagem na trilha da Demanda do Anel imediatamente.", target: "quest" },
    { file: "color-green", en: "Green · Races", pt: "Verde · Raças", en_d: "Show Race symbols that build alliances and count toward the Support of the Races victory.", pt_d: "Mostram símbolos de Raça que formam alianças e contam para a vitória por Apoio das Raças.", target: "alliances" },
    { file: "color-red", en: "Red · Units", pt: "Vermelha · Unidades", en_d: "Immediately place Units in one of the two regions shown.", pt_d: "Colocam Unidades imediatamente em uma das duas regiões mostradas.", target: "conquest" },
    { file: "color-purple", en: "Purple · Maneuvers (chapter 3 only)", pt: "Roxa · Manobras (só no capítulo 3)", en_d: "Immediately complete movements, remove enemy Units or make your opponent lose Coins.", pt_d: "Completam movimentos, removem Unidades inimigas ou fazem o oponente perder Moedas, imediatamente.", target: "effects" }
  ];

  const SKILLS = [
    { file: "skill-ruse", en: "Ruse", pt: "Astúcia" },
    { file: "skill-strength", en: "Strength", pt: "Força" },
    { file: "skill-courage", en: "Courage", pt: "Coragem" },
    { file: "skill-knowledge", en: "Knowledge", pt: "Conhecimento" },
    { file: "skill-leadership", en: "Leadership", pt: "Liderança" }
  ];

  const RACES = [
    { key: "elves", file: "race-elves", en: "Elves", pt: "Elfos" },
    { key: "ents", file: "race-ents", en: "Ents", pt: "Ents" },
    { key: "hobbits", file: "race-hobbits", en: "Hobbits", pt: "Hobbits" },
    { key: "humans", file: "race-humans", en: "Humans", pt: "Humanos" },
    { key: "dwarves", file: "race-dwarves", en: "Dwarves", pt: "Anões" },
    { key: "wizards", file: "race-wizards", en: "Wizards", pt: "Magos" }
  ];

  const REGIONS = [
    { en: "Lindon", pt: "Lindon" },
    { en: "Arnor", pt: "Arnor" },
    { en: "Rhovanion", pt: "Rhovanion" },
    { en: "Enedwaith", pt: "Enedwaith" },
    { en: "Rohan", pt: "Rohan" },
    { en: "Gondor", pt: "Gondor" },
    { en: "Mordor", pt: "Mordor" }
  ];

  const LANDMARKS = [
    { name: "Barad-Dûr", region: "Mordor",
      en: ["Place 1 Fortress in Mordor.", "Take all the cards in the discard, secretly choose 1, and play it for free."],
      pt: ["Coloque 1 Fortaleza em Mordor.", "Pegue todas as cartas do descarte, escolha 1 em segredo e jogue-a de graça."] },
    { name: "Bree", region: "Arnor",
      en: ["Place 1 Fortress and 2 Units in Arnor.", "Complete 2 movements on the central board."],
      pt: ["Coloque 1 Fortaleza e 2 Unidades em Arnor.", "Complete 2 movimentos no tabuleiro central."] },
    { name: "Erebor", region: "Rhovanion",
      en: ["Place 1 Fortress in Rhovanion.", "Take 5 Coins from the reserve.", "Complete 1 movement on the central board."],
      pt: ["Coloque 1 Fortaleza em Rhovanion.", "Pegue 5 Moedas da reserva.", "Complete 1 movimento no tabuleiro central."] },
    { name: "Grey Havens", region: "Lindon",
      en: ["Place 1 Fortress in Lindon.", "Take the top 2 tokens of any Race and reveal them. Choose 1 to place in front of you. Put the second token, facedown, on top of its stack."],
      pt: ["Coloque 1 Fortaleza em Lindon.", "Pegue as 2 fichas do topo de qualquer Raça e revele-as. Escolha 1 para colocar à sua frente. Devolva a segunda ficha, virada para baixo, ao topo da sua pilha."] },
    { name: "Helm's Deep", region: "Rohan",
      en: ["Place 1 Fortress and 3 Units in Rohan."],
      pt: ["Coloque 1 Fortaleza e 3 Unidades em Rohan."] },
    { name: "Isengard", region: "Enedwaith",
      en: ["Place 1 Fortress in Enedwaith.", "Discard 1 Grey card from your opponent's play area.", "Move your character 1 space on the Quest of the Ring track."],
      pt: ["Coloque 1 Fortaleza em Enedwaith.", "Descarte 1 carta Cinza da área de jogo do seu oponente.", "Mova seu personagem 1 espaço na trilha da Demanda do Anel."] },
    { name: "Minas Tirith", region: "Gondor",
      en: ["Place 1 Fortress and 1 Unit in Gondor.", "Move your character 2 spaces on the Quest of the Ring track."],
      pt: ["Coloque 1 Fortaleza e 1 Unidade em Gondor.", "Mova seu personagem 2 espaços na trilha da Demanda do Anel."] }
  ];

  const BONUS_SPACES = [
    { file: "bonus-coin", en: "Coin", pt: "Moeda", en_d: "Take 1 Coin from the reserve.", pt_d: "Pegue 1 Moeda da reserva." },
    { file: "bonus-another-turn", en: "Another turn", pt: "Outro turno", en_d: "Take another turn after finishing this one.", pt_d: "Jogue outro turno depois de terminar este." },
    { file: "bonus-place-unit", en: "Place a Unit", pt: "Colocar Unidade", en_d: "Place 1 Unit in any region.", pt_d: "Coloque 1 Unidade em qualquer região." },
    { file: "bonus-remove-fortress", en: "Remove a Fortress", pt: "Remover Fortaleza", en_d: "Remove 1 enemy Fortress from any region and return it to your opponent.", pt_d: "Remova 1 Fortaleza inimiga de qualquer região e devolva-a ao seu oponente." },
    { file: "bonus-sauron-wins", en: "The One Ring", pt: "O Um Anel", en_d: "The Sauron player immediately wins the game. The One Ring is the marker that represents Frodo and Sam, so it is wherever they currently are (it starts in the middle of the track and moves with them). The Nazgûl reaching the One Ring means they have caught Frodo and Sam.", pt_d: "O jogador de Sauron vence a partida imediatamente. O Um Anel é o marcador que representa Frodo e Sam, então está onde eles estiverem no momento (começa no meio da trilha e se move com eles). O Nazgûl chegar ao Um Anel significa que alcançou Frodo e Sam." },
    { file: "bonus-fellowship-wins", en: "Mount Doom", pt: "Montanha da Perdição", en_d: "The Fellowship of the Ring player immediately wins the game. It is the last space of the track, at the right end, printed with the volcano.", pt_d: "O jogador da Sociedade do Anel vence a partida imediatamente. É o último espaço da trilha, na ponta direita, impresso com o vulcão." }
  ];

  const RACE_EFFECTS = {
    elves: [
      { file: "elves-yellow-another-turn", en: "When you play a Yellow card, take another turn after finishing this one.", pt: "Quando você jogar uma carta Amarela, jogue outro turno depois de terminar este." },
      { file: "elves-red-any-region", en: "When you play a Red card, you may place all of the concerned Units in any 1 of the 7 regions.", pt: "Quando você jogar uma carta Vermelha, pode colocar todas as Unidades envolvidas em qualquer 1 das 7 regiões." },
      { file: "elves-any-skill", en: "Once per turn, benefit from any Skill.", pt: "Uma vez por turno, use qualquer Habilidade." }
    ],
    dwarves: [
      { file: "dwarves-ignore-landmark-cost", en: "When you play a Landmark tile, ignore the additional Coin cost.", pt: "Quando você jogar uma tile de Marco, ignore o custo adicional em Moedas." },
      { file: "dwarves-landmark-another-turn", en: "When you play a Landmark tile, take another turn after finishing this one.", pt: "Quando você jogar uma tile de Marco, jogue outro turno depois de terminar este." },
      { file: "dwarves-green-movements", en: "When you play a Green card, also complete 2 movements on the central board.", pt: "Quando você jogar uma carta Verde, complete também 2 movimentos no tabuleiro central." }
    ],
    hobbits: [
      { file: "hobbits-eagle", en: "The Eagle symbol is an additional Race symbol that counts as 1 of the 6 required for the Support of the Races victory.", pt: "O símbolo da Águia é um símbolo de Raça adicional que conta como 1 dos 6 exigidos para a vitória por Apoio das Raças." },
      { file: "hobbits-blue-unit", en: "When you play a Blue card, also place 1 Unit in any region.", pt: "Quando você jogar uma carta Azul, coloque também 1 Unidade em qualquer região." },
      { file: "hobbits-chaining-coins", en: "When you play a card using a chaining symbol, take 3 Coins from the reserve.", pt: "Quando você jogar uma carta usando um símbolo de encadeamento, pegue 3 Moedas da reserva." }
    ],
    humans: [
      { file: "humans-yellow-quest", en: "When you play a Yellow card, also move your character 1 space on the Quest of the Ring track.", pt: "Quando você jogar uma carta Amarela, mova também seu personagem 1 espaço na trilha da Demanda do Anel." },
      { file: "humans-red-extra-unit", en: "When you play a Red card, place 1 additional Unit in the chosen region.", pt: "Quando você jogar uma carta Vermelha, coloque 1 Unidade adicional na região escolhida." },
      { file: "humans-discard-double", en: "When you discard a card, take 2 times the Coins associated with the current chapter (either 2, 4, or 6 Coins) from the reserve. That is the total you receive, replacing the normal 1, 2 or 3.", pt: "Quando você descartar uma carta, pegue da reserva 2 vezes as Moedas do capítulo atual (2, 4 ou 6 Moedas). Esse é o total recebido, no lugar das 1, 2 ou 3 normais." }
    ],
    ents: [
      { file: "ents-another-turn", en: "Take another turn after finishing this one.", pt: "Jogue outro turno depois de terminar este." },
      { file: "ents-remove-fortress", en: "Remove 1 enemy Fortress from any region and return it to your opponent.", pt: "Remova 1 Fortaleza inimiga de qualquer região e devolva-a ao seu oponente." },
      { file: "ents-choose-three", en: "Choose, 3 times, between: Remove 1 enemy Unit, Your opponent loses 1 Coin, or Complete 1 movement on the central board.", pt: "Escolha, 3 vezes, entre: Remover 1 Unidade inimiga, Seu oponente perde 1 Moeda, ou Completar 1 movimento no tabuleiro central." }
    ],
    wizards: [
      { file: "wizards-quest-two", en: "Move your character 2 spaces on the Quest of the Ring track.", pt: "Mova seu personagem 2 espaços na trilha da Demanda do Anel." },
      { file: "wizards-place-units", en: "Place 2 Units in 1 region of your choice, or 1 Unit in 2 regions of your choice.", pt: "Coloque 2 Unidades em 1 região à sua escolha, ou 1 Unidade em 2 regiões à sua escolha." },
      { file: "wizards-discard-play", en: "Take all the cards in the discard, secretly choose 1, and play it for free.", pt: "Pegue todas as cartas do descarte, escolha 1 em segredo e jogue-a de graça." }
    ]
  };

  const GLOSSARY_TERMS = [
    ["Available card", "Carta disponível", "A card in the central play area that is not partially covered by any other card. Only available cards may be taken.", "Uma carta na área central que não está parcialmente coberta por nenhuma outra. Só cartas disponíveis podem ser pegas.", [3]],
    ["Play area", "Área de jogo", "The space in front of each player where their played cards, Landmark tiles and chosen Alliance tokens stay. Stack cards by colour with their effects visible.", "O espaço à frente de cada jogador onde ficam suas cartas jogadas, tiles de Marco e fichas de Aliança escolhidas. Empilhe as cartas por cor, com os efeitos visíveis.", [3]],
    ["Central play area", "Área central", "The table space between the players where the chapter cards are laid out in the chapter diagram.", "O espaço da mesa entre os jogadores onde as cartas do capítulo são dispostas no diagrama do capítulo.", [2, 3]],
    ["Chapter", "Capítulo", "One of the 3 successive phases of the game. Each uses its own deck of 23 cards (sorted by the rune on the back) laid out in its own diagram; it ends when the last laid-out card is taken.", "Uma das 3 fases sucessivas da partida. Cada uma usa seu próprio baralho de 23 cartas (separadas pela runa do verso) disposto no seu próprio diagrama; termina quando a última carta disposta é pega.", [2, 3]],
    ["Discard", "Descarte", "A facedown pile next to the chapter decks. It receives the 3 leftover cards of each chapter and every card a player discards for Coins. Some effects let you take a card back from it.", "Uma pilha virada para baixo ao lado dos baralhos de capítulo. Recebe as 3 cartas restantes de cada capítulo e toda carta que um jogador descarta por Moedas. Alguns efeitos permitem pegar uma carta de volta dela.", [2, 3]],
    ["Reserve", "Reserva", "The common pool of Coins not owned by any player. Costs are paid to it; Yellow cards and effects take Coins from it.", "O estoque comum de Moedas que não pertence a nenhum jogador. Custos são pagos a ela; cartas Amarelas e efeitos pegam Moedas dela.", [2, 4]],
    ["Skill", "Habilidade", "One of 5 symbols (Ruse, Strength, Courage, Knowledge, Leadership) printed on Grey cards. Each symbol in your play area may be used once per turn to pay a Skill requirement; a missing symbol can be replaced by paying 1 Coin.", "Um de 5 símbolos (Astúcia, Força, Coragem, Conhecimento, Liderança) impressos nas cartas Cinza. Cada símbolo na sua área pode ser usado uma vez por turno para pagar um requisito de Habilidade; um símbolo faltante pode ser substituído pagando 1 Moeda.", [4, 5]],
    ["Chaining symbol", "Símbolo de encadeamento", "A symbol in the top-right corner of some played cards. From chapter 2, a card that asks for that symbol can be played for free if you already have a card showing it in your play area.", "Um símbolo no canto superior direito de algumas cartas jogadas. A partir do capítulo 2, uma carta que pede esse símbolo pode ser jogada de graça se você já tiver uma carta que o mostre na sua área de jogo.", [4]],
    ["Unit", "Unidade", "A pawn representing your troops. Units are placed by Red cards, Landmark tiles and effects, move along connections, and fight enemy Units in the same region.", "Um peão que representa suas tropas. Unidades são colocadas por cartas Vermelhas, tiles de Marco e efeitos, movem-se pelas conexões e lutam contra Unidades inimigas na mesma região.", [5, 7]],
    ["Fortress", "Fortaleza", "A pawn placed on a region's Fortress space by a Landmark tile. It counts as presence in the region, never fights, and can only be removed by specific effects.", "Um peão colocado no espaço de Fortaleza de uma região por uma tile de Marco. Conta como presença na região, nunca luta e só pode ser removido por efeitos específicos.", [5, 7]],
    ["Region / connection", "Região / conexão", "One of the 7 named areas of the central board (Lindon, Arnor, Rhovanion, Enedwaith, Rohan, Gondor, Mordor). Two regions are adjacent when a line printed on the board connects them.", "Uma das 7 áreas nomeadas do tabuleiro central (Lindon, Arnor, Rhovanion, Enedwaith, Rohan, Gondor, Mordor). Duas regiões são adjacentes quando uma linha impressa no tabuleiro as conecta.", [7]],
    ["Present in a region", "Presente numa região", "Having a Fortress and/or at least 1 Unit there. Used for the Conquering Middle-earth victory and the end-of-game count.", "Ter uma Fortaleza e/ou pelo menos 1 Unidade ali. Usado para a vitória por Conquista da Terra-média e para a contagem de fim de jogo.", [8]],
    ["Movement", "Movimento", "Moving 1 Unit to an adjacent region. Effects that grant several movements may move the same Unit repeatedly or different Units; each movement is resolved on its own, including any conflict.", "Mover 1 Unidade para uma região adjacente. Efeitos que dão vários movimentos podem mover a mesma Unidade várias vezes ou Unidades diferentes; cada movimento é resolvido sozinho, inclusive qualquer conflito.", [7]],
    ["Conflict", "Conflito", "Triggered when your Units are placed or moved into a region holding enemy Units. Both players remove 1 Unit at a time until one side has none left there.", "Disparado quando suas Unidades são colocadas ou movidas para uma região com Unidades inimigas. Os dois jogadores removem 1 Unidade por vez até que um lado não tenha mais nenhuma ali.", [7]],
    ["The One Ring", "O Um Anel", "The ring marker on the Quest of the Ring track that represents Frodo and Sam. It starts in the middle of the track and moves with them; the Nazgûl reaching it ends the game in Sauron's favour.", "O marcador de anel na trilha da Demanda do Anel que representa Frodo e Sam. Começa no meio da trilha e se move com eles; o Nazgûl alcançá-lo encerra a partida a favor de Sauron.", [6, 8]],
    ["Bonus space", "Espaço bônus", "A marked space on the Quest of the Ring track. Reaching or passing it lets you use its effect immediately, once.", "Um espaço marcado na trilha da Demanda do Anel. Alcançá-lo ou passar por ele permite usar seu efeito imediatamente, uma vez.", [6]],
    ["Alliance token", "Ficha de Aliança", "One of 18 tokens (3 per Race) kept in facedown stacks above the board. Gained by collecting Race symbols on Green cards; its effect is printed on the Player Aid.", "Uma de 18 fichas (3 por Raça) mantidas em pilhas viradas para baixo acima do tabuleiro. Obtida ao reunir símbolos de Raça nas cartas Verdes; seu efeito está impresso na Ajuda de jogo.", [6]],
    ["Race symbol", "Símbolo de Raça", "One of the 6 symbols (Elves, Ents, Hobbits, Humans, Dwarves, Wizards) printed on Green cards. The Eagle on one Hobbit Alliance token is a 7th symbol for the victory count.", "Um dos 6 símbolos (Elfos, Ents, Hobbits, Humanos, Anões, Magos) impressos nas cartas Verdes. A Águia de uma ficha de Aliança dos Hobbits é um 7º símbolo para a contagem da vitória.", [5, 8]]
  ];

  function discardEffectNote() {
    return `<p class="glossary-intro duel-interpretation">${t(
      "<strong>“Take all the cards in the discard, secretly choose 1, and play it for free”</strong> (Barad-Dûr and one Wizards token): the Player Aid says only this. Read it as: pick up the facedown discard and look through it alone, play the chosen card in your play area at no cost and resolve its effect as usual, then return every other card facedown to the discard without showing them. The “return the rest” step is this guide's interpretation; the sources do not spell it out.",
      "<strong>“Pegue todas as cartas do descarte, escolha 1 em segredo e jogue-a de graça”</strong> (Barad-Dûr e uma ficha dos Magos): a Ajuda de jogo diz só isso. Leia assim: pegue o descarte virado para baixo e examine-o sozinho, jogue a carta escolhida na sua área de jogo sem custo e resolva o efeito dela normalmente, depois devolva todas as outras cartas viradas para baixo ao descarte sem mostrá-las. O passo “devolva o resto” é interpretação deste guia; as fontes não o detalham."
    )}</p>`;
  }

  function effectOrderNote() {
    return `<p class="glossary-intro duel-interpretation">${t(
      "<strong>Several effects from one play.</strong> The rulebook fixes an order only inside a Landmark tile (its effects are listed in order). When a single play triggers more than one effect at once (the card's own effect, an Alliance just completed, a “When you play…” token you already own, a Bonus space passed on the track), this guide resolves them one at a time, fully, in the order the active player chooses; a token worded “When you play…” that you gain during a play applies from your next qualifying card on, not to the card that just completed the alliance (interpretation; the sources do not spell this out).",
      "<strong>Vários efeitos de uma mesma jogada.</strong> O manual fixa uma ordem só dentro de uma tile de Marco (os efeitos dela estão listados na ordem). Quando uma única jogada dispara mais de um efeito ao mesmo tempo (o efeito da própria carta, uma Aliança recém-completada, uma ficha “Quando você jogar…” que você já tem, um espaço bônus atravessado na trilha), este guia os resolve um de cada vez, por completo, na ordem que o jogador ativo escolher; uma ficha redigida “Quando você jogar…” obtida durante uma jogada vale a partir da sua próxima carta que cumpra a condição, não para a carta que acabou de completar a aliança (interpretação; as fontes não detalham isso)."
    )}</p>`;
  }

  // --- About -----------------------------------------------------------------

  function aboutGuide() {
    return `
      <div class="callout">${t(
        "This guide covers the full core box of The Lord of the Rings: Duel for Middle-earth. The game is always for exactly 2 players, one playing the Fellowship of the Ring and the other Sauron, and the rulebook has no expansions, variants or optional rules, so there is nothing to configure before Setup. The sections follow the 8-page rulebook in order, and the effects of the Landmark tiles, Quest bonus spaces and Alliance tokens are transcribed from the 2-page Player Aid, which is also linked.",
        "Este guia cobre a caixa base completa de The Lord of the Rings: Duel for Middle-earth. O jogo é sempre para exatamente 2 jogadores, um com a Sociedade do Anel e o outro com Sauron, e o manual não traz expansões, variantes nem regras opcionais, então não há nada para configurar antes da Preparação. As seções seguem o manual de 8 páginas na ordem, e os efeitos das tiles de Marco, dos espaços bônus da Demanda e das fichas de Aliança foram transcritos da Ajuda de jogo de 2 páginas, também linkada."
      )}</div>`;
  }

  // --- Quick reference --------------------------------------------------------

  function quickReference() {
    const cards = [
      [t("Your turn", "Seu turno"), t("Sauron plays first; then alternate. On your turn do exactly one thing: take 1 available Chapter card (play it, paying its cost, or discard it for Coins) OR take 1 face-up Landmark tile (pay its cost, place its Fortress, use its effects). After a card, reveal any cards that became available; after a tile, do not reveal a new tile.", "Sauron joga primeiro; depois alternem. No seu turno faça exatamente uma coisa: pegue 1 carta de Capítulo disponível (jogue-a, pagando o custo, ou descarte-a por Moedas) OU pegue 1 tile de Marco virada para cima (pague o custo, coloque a Fortaleza, use os efeitos). Depois de uma carta, revele as cartas que ficaram disponíveis; depois de uma tile, não revele uma tile nova."), "chapters"],
      [t("Paying for a card or tile", "Pagando uma carta ou tile"), t("Coin cost: pay it to the reserve. Skill cost: have the symbols on your Grey cards (each symbol once per turn) or pay 1 Coin per missing symbol, with no limit. Landmark tiles cost extra Coins equal to the Fortresses you already have on the board. From chapter 2, a matching chaining symbol in your play area makes a card free: no Skills and no Coins.", "Custo em Moedas: pague à reserva. Custo em Habilidades: tenha os símbolos nas suas cartas Cinza (cada símbolo uma vez por turno) ou pague 1 Moeda por símbolo faltante, sem limite. Tiles de Marco custam Moedas extras iguais às Fortalezas que você já tem no tabuleiro. A partir do capítulo 2, um símbolo de encadeamento igual na sua área torna uma carta gratuita: sem Habilidades e sem Moedas."), "costs"],
      [t("Discarding for Coins", "Descartando por Moedas"), t("Put the card facedown in the discard and take Coins from the reserve equal to the current chapter: 1 in chapter 1, 2 in chapter 2, 3 in chapter 3.", "Coloque a carta virada para baixo no descarte e pegue da reserva Moedas iguais ao capítulo atual: 1 no capítulo 1, 2 no capítulo 2, 3 no capítulo 3."), "chapters"],
      [t("Conflicts", "Conflitos"), t("Whenever your Units arrive in a region with enemy Units, both players remove 1 Unit at a time until one side has none left there. Fortresses never fight and never block placement.", "Sempre que suas Unidades chegam a uma região com Unidades inimigas, os dois jogadores removem 1 Unidade por vez até que um lado não tenha mais nenhuma ali. Fortalezas nunca lutam nem bloqueiam colocação."), "conquest"],
      [t("Win immediately", "Vitória imediata"), t("Quest of the Ring: Frodo and Sam reach Mount Doom (Fellowship) or the Nazgûl catch Frodo and Sam (Sauron). Support of the Races: 6 different Race symbols on your Green cards (the Eagle token counts). Conquering Middle-earth: a Fortress and/or Unit of yours in all 7 regions.", "Demanda do Anel: Frodo e Sam chegam à Montanha da Perdição (Sociedade) ou o Nazgûl alcança Frodo e Sam (Sauron). Apoio das Raças: 6 símbolos de Raça diferentes nas suas cartas Verdes (a ficha da Águia conta). Conquista da Terra-média: uma Fortaleza e/ou Unidade sua em todas as 7 regiões."), "end"],
      [t("End of chapter 3", "Fim do capítulo 3"), t("If nobody has won immediately when the last card of chapter 3 is taken, the player present in the most regions (Fortress and/or at least 1 Unit) wins. A tie is a shared victory.", "Se ninguém venceu imediatamente quando a última carta do capítulo 3 é pega, vence o jogador presente em mais regiões (Fortaleza e/ou pelo menos 1 Unidade). Empate é vitória compartilhada."), "end"],
      [t("Alliances", "Alianças"), t("2 matching Race symbols: reveal the top 2 tokens of that Race, keep 1, return the other facedown on top. Once per game, 3 different Race symbols: reveal the top token of each of those 3 Races, keep 1, return the other 2. Tokens are public.", "2 símbolos de Raça iguais: revele as 2 fichas do topo dessa Raça, fique com 1, devolva a outra virada para baixo ao topo. Uma vez por partida, 3 símbolos de Raça diferentes: revele a ficha do topo de cada uma dessas 3 Raças, fique com 1, devolva as outras 2. As fichas são públicas."), "alliances"],
      [t("Quest of the Ring track", "Trilha da Demanda do Anel"), t("Blue cards move your character 1 space per Ring symbol. Reaching or passing a Bonus space lets you use its effect once. The Nazgûl piece rides on top of the Frodo and Sam piece: when Frodo and Sam move, the Nazgûl are carried along and the gap stays the same; when the Nazgûl move, the gap shrinks.", "Cartas Azuis movem seu personagem 1 espaço por símbolo de Anel. Alcançar ou passar por um espaço bônus permite usar seu efeito uma vez. A peça do Nazgûl fica em cima da peça de Frodo e Sam: quando Frodo e Sam se movem, o Nazgûl é carregado junto e a distância fica igual; quando o Nazgûl se move, a distância diminui."), "quest"]
    ];
    const sides = [
      [t("Fellowship of the Ring", "Sociedade do Anel"), [
        t("Starts with 3 Coins.", "Começa com 3 Moedas."),
        t("Starts with 2 Units in Arnor.", "Começa com 2 Unidades em Arnor."),
        t("Character: Frodo and Sam, represented by the One Ring marker, starting in the middle of the track and moving right, toward Mount Doom.", "Personagem: Frodo e Sam, representados pelo marcador do Um Anel, começando no meio da trilha e avançando para a direita, rumo à Montanha da Perdição."),
        t("Quest victory: reach Mount Doom, the last space.", "Vitória na Demanda: chegar à Montanha da Perdição, o último espaço."),
        t("Plays second.", "Joga em segundo.")
      ]],
      [t("Sauron", "Sauron"), [
        t("Starts with 2 Coins.", "Começa com 2 Moedas."),
        t("Starts with 2 Units in Mordor.", "Começa com 2 Unidades em Mordor."),
        t("Character: the Nazgûl, starting on the first space at the left end of the track and chasing Frodo and Sam.", "Personagem: o Nazgûl, começando no primeiro espaço, na ponta esquerda da trilha, perseguindo Frodo e Sam."),
        t("Quest victory: catch Frodo and Sam, i.e. reach the space where the One Ring marker currently is.", "Vitória na Demanda: alcançar Frodo e Sam, ou seja, chegar ao espaço onde o marcador do Um Anel está no momento."),
        t("Plays first.", "Joga primeiro.")
      ]]
    ];
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), "01", refs(3, 8))}
      <div class="quick-grid">${cards.map(([title, body, target]) => `
        <article class="info-card"><h3>${title}</h3><p>${body}</p><p>${jump(target, t("Open the full rule", "Abrir a regra completa"))}</p></article>`).join("")}</div>
      <h3 class="subhead">${t("What differs between the two sides", "O que muda entre os dois lados")}</h3>
      <div class="quick-grid duel-sides">${sides.map(([title, lines]) => `
        <article class="info-card"><span class="component-label">${t("SIDE", "LADO")}</span><h3>${title}</h3><ul class="duel-list">${lines.map((line) => `<li>${line}</li>`).join("")}</ul>
          <div class="glossary-references">${refs(2, 6, 8)}</div></article>`).join("")}</div>
      <h3 class="subhead">${t("The six card colours", "As seis cores de carta")}</h3>
      <p class="glossary-intro">${t("Every card colour also has a printed colorblind symbol next to its cost line, shown here as cropped from the rulebook.", "Cada cor de carta também tem um símbolo impresso para daltônicos ao lado da linha de custo, mostrado aqui como recortado do manual.")}</p>
      <div class="icon-grid">${CARD_COLORS.map((card) => iconCard(card.file, t(card.en, card.pt), `${t(card.en_d, card.pt_d)} ${jump(card.target, t("Details", "Detalhes"))}`, referenceLink(1))).join("")}</div>`;
  }

  // --- Setup ---------------------------------------------------------------------

  function step(id, titleEn, titlePt, linesEn, linesPt, optional) {
    return { id, title: t(titleEn, titlePt), lines: state.language === "pt-BR" ? linesPt : linesEn, optional: Boolean(optional) };
  }

  function setupPhases() {
    return [
      {
        title: t("Sides and pawns", "Lados e peões"),
        refs: refs(1, 2),
        items: [
          step("sides", "Choose sides and take your pawns", "Escolham os lados e peguem os peões", [
            "Choose, or randomly determine, who plays the Fellowship of the Ring and who plays Sauron. Sauron will take the first turn of the game.",
            "Each player places the Unit and Fortress pawns of their side in front of them: 15 Units and 7 Fortresses each. The two sides are separate sets of pawns (one for the Fellowship, one for Sauron), as listed in the box contents."
          ], [
            "Escolham, ou sorteiem, quem joga com a Sociedade do Anel e quem joga com Sauron. Sauron fará o primeiro turno da partida.",
            "Cada jogador coloca à sua frente os peões de Unidade e de Fortaleza do seu lado: 15 Unidades e 7 Fortalezas cada. Os dois lados são conjuntos separados de peões (um da Sociedade, outro de Sauron), como listado no conteúdo da caixa."
          ])
        ]
      },
      {
        title: t("Central board and Quest track", "Tabuleiro central e trilha da Demanda"),
        refs: refs(2, 6),
        items: [
          step("board", "Place the central board and the starting Units", "Coloque o tabuleiro central e as Unidades iniciais", [
            "Place the central board between the two players, next to the central play area (the free table space where the chapter cards will be laid out, below the Quest track in the rulebook diagram).",
            "On the central board, place 2 Fellowship Units on Arnor and 2 Sauron Units on Mordor. Units go on a region's Unit space (the box next to its banner); the Fortress space is the banner itself and stays empty for now."
          ], [
            "Coloque o tabuleiro central entre os dois jogadores, ao lado da área central (o espaço livre da mesa onde as cartas de capítulo serão dispostas, abaixo da trilha da Demanda no diagrama do manual).",
            "No tabuleiro central, coloque 2 Unidades da Sociedade em Arnor e 2 Unidades de Sauron em Mordor. Unidades ficam no espaço de Unidade da região (a caixa ao lado do estandarte); o espaço de Fortaleza é o próprio estandarte e fica vazio por enquanto."
          ]),
          step("track", "Assemble the Quest of the Ring track", "Monte a trilha da Demanda do Anel", [
            "Assemble the Quest of the Ring track from its 4 pieces, as shown in the diagram on rulebook page 2, and place it below the central board.",
            "Frodo and Sam are represented by the One Ring marker: it starts on their starting space, in the middle of the track (the track diagram on rulebook p. 6 labels it). The Nazgûl start on the first space at the left end. The Nazgûl piece sits on top of the Frodo and Sam piece, so that it is carried along whenever Frodo and Sam move (rulebook p. 6). Mount Doom is the last space, at the right end."
          ], [
            "Monte a trilha da Demanda do Anel com suas 4 peças, como mostrado no diagrama da página 2 do manual, e coloque-a abaixo do tabuleiro central.",
            "Frodo e Sam são representados pelo marcador do Um Anel: ele começa no espaço inicial deles, no meio da trilha (o diagrama da trilha na página 6 do manual o identifica). O Nazgûl começa no primeiro espaço, na ponta esquerda. A peça do Nazgûl fica em cima da peça de Frodo e Sam, de modo a ser carregada sempre que Frodo e Sam se movem (manual p. 6). A Montanha da Perdição é o último espaço, na ponta direita."
          ])
        ]
      },
      {
        title: t("Coins", "Moedas"),
        refs: refs(2),
        items: [
          step("coins", "Deal the starting Coins and form the reserve", "Distribua as Moedas iniciais e forme a reserva", [
            "The Fellowship player takes 3 Coins; the Sauron player takes 2 Coins.",
            "Make a reserve with the remaining 25 Coins (30 in the box), within reach of both players, next to the chapter decks."
          ], [
            "O jogador da Sociedade pega 3 Moedas; o jogador de Sauron pega 2 Moedas.",
            "Forme uma reserva com as 25 Moedas restantes (a caixa tem 30), ao alcance dos dois jogadores, ao lado dos baralhos de capítulo."
          ])
        ]
      },
      {
        title: t("Alliance tokens and Landmark tiles", "Fichas de Aliança e tiles de Marco"),
        refs: refs(2),
        items: [
          step("alliances", "Stack the Alliance tokens", "Empilhe as fichas de Aliança", [
            "Sort the 18 Alliance tokens by their backs into 6 stacks, one per Race (Elves, Ents, Hobbits, Humans, Dwarves, Wizards), with 3 tokens each.",
            "Shuffle each stack separately and place them facedown above the central board, in the dedicated notches on its top edge."
          ], [
            "Separe as 18 fichas de Aliança pelos versos em 6 pilhas, uma por Raça (Elfos, Ents, Hobbits, Humanos, Anões, Magos), com 3 fichas cada.",
            "Embaralhe cada pilha separadamente e coloque-as viradas para baixo acima do tabuleiro central, nos encaixes dedicados da borda superior."
          ]),
          step("landmarks", "Reveal 3 Landmark tiles", "Revele 3 tiles de Marco", [
            "Shuffle the 7 Landmark tiles and place 3 of them faceup on the table, above the Alliance tokens in the rulebook diagram.",
            "Make a facedown stack with the remaining 4 tiles, next to the faceup ones."
          ], [
            "Embaralhe as 7 tiles de Marco e coloque 3 delas viradas para cima na mesa, acima das fichas de Aliança no diagrama do manual.",
            "Forme uma pilha virada para baixo com as 4 tiles restantes, ao lado das viradas para cima."
          ])
        ]
      },
      {
        title: t("Chapter cards", "Cartas de Capítulo"),
        refs: refs(2, 3),
        items: [
          step("decks", "Sort the Chapter cards into 3 decks", "Separe as cartas de Capítulo em 3 baralhos", [
            "Sort the 69 Chapter cards into 3 decks according to the rune on their backs: chapter 1, chapter 2 and chapter 3 (the three runes are shown below). Each deck has 23 cards.",
            "Shuffle each deck separately. Keep the chapter 2 and chapter 3 decks facedown, aside, next to the Coin reserve; they are only used when their chapter begins.",
            "Leave an empty space for the facedown Discard pile next to the chapter decks."
          ], [
            "Separe as 69 cartas de Capítulo em 3 baralhos conforme a runa do verso: capítulo 1, capítulo 2 e capítulo 3 (as três runas aparecem abaixo). Cada baralho tem 23 cartas.",
            "Embaralhe cada baralho separadamente. Mantenha os baralhos dos capítulos 2 e 3 virados para baixo, à parte, ao lado da reserva de Moedas; eles só são usados quando o seu capítulo começa.",
            "Deixe um espaço vazio para a pilha de Descarte, virada para baixo, ao lado dos baralhos de capítulo."
          ]),
          step("layout", "Lay out chapter 1", "Disponha o capítulo 1", [
            "From the chapter 1 deck, lay 20 cards in the central play area in the chapter 1 pyramid (diagram below and on the sides of the box): row 1 (top) 2 cards faceup; row 2: 3 cards facedown; row 3: 4 cards faceup; row 4: 5 cards facedown; row 5 (bottom): 6 cards faceup.",
            "Each row is staggered and overlaps the bottom edge of the row above it, so the 6 cards of the bottom row are the only ones not covered at all: they are the available cards at the start of the game.",
            "Place the 3 remaining cards of the chapter 1 deck facedown in the Discard, without looking at them."
          ], [
            "Do baralho do capítulo 1, disponha 20 cartas na área central na pirâmide do capítulo 1 (diagrama abaixo e nas laterais da caixa): fileira 1 (topo) 2 cartas viradas para cima; fileira 2: 3 cartas viradas para baixo; fileira 3: 4 cartas viradas para cima; fileira 4: 5 cartas viradas para baixo; fileira 5 (base): 6 cartas viradas para cima.",
            "Cada fileira é deslocada e cobre a borda inferior da fileira de cima, de modo que as 6 cartas da fileira de baixo são as únicas totalmente descobertas: elas são as cartas disponíveis no início da partida.",
            "Coloque as 3 cartas restantes do baralho do capítulo 1 viradas para baixo no Descarte, sem olhá-las."
          ])
        ]
      },
      {
        title: t("Start", "Início"),
        refs: refs(3),
        items: [
          step("first-player", "Sauron begins", "Sauron começa", [
            "Keep the Player Aid where both players can read it: it lists the effects of the Landmark tiles, Quest bonus spaces and Alliance tokens (all of them are also transcribed in this guide).",
            "The Sauron player takes the first turn. Players then alternate turns until the end of the game."
          ], [
            "Deixe a Ajuda de jogo onde os dois jogadores possam lê-la: ela lista os efeitos das tiles de Marco, dos espaços bônus da Demanda e das fichas de Aliança (todos também transcritos neste guia).",
            "O jogador de Sauron faz o primeiro turno. Depois os jogadores alternam turnos até o fim da partida."
          ])
        ]
      }
    ];
  }

  function inventoryCard(label, title, body, links) {
    return `
      <article class="info-card">
        <span class="component-label">${label}</span>
        <h3>${title}</h3>
        <p>${body}</p>
        <div class="glossary-references">${links}</div>
      </article>`;
  }

  function inventory() {
    const cards = [
      inventoryCard(t("CARDS", "CARTAS"), t("69 Chapter cards", "69 cartas de Capítulo"), t("Three decks of 23, told apart by the rune on the back. Six colours: Grey, Yellow, Blue, Green, Red and Purple (Purple only in chapter 3). Their individual costs and effects are printed on each card.", "Três baralhos de 23, distinguidos pela runa do verso. Seis cores: Cinza, Amarela, Azul, Verde, Vermelha e Roxa (Roxa só no capítulo 3). Os custos e efeitos individuais estão impressos em cada carta."), refs(1, 2, 3)),
      inventoryCard(t("TILES", "TILES"), t("7 Landmark tiles", "7 tiles de Marco"), t("Barad-Dûr, Bree, Erebor, Grey Havens, Helm's Deep, Isengard and Minas Tirith. 3 start faceup, 4 in a facedown stack. Each places a Fortress in a fixed region.", "Barad-Dûr, Bree, Erebor, Grey Havens, Helm's Deep, Isengard e Minas Tirith. 3 começam viradas para cima, 4 numa pilha virada para baixo. Cada uma coloca uma Fortaleza numa região fixa."), refs(1, 2, [1, "aid"])),
      inventoryCard(t("BOARD", "TABULEIRO"), t("1 central board", "1 tabuleiro central"), t("A map of Middle-earth with 7 regions, each with a banner (Fortress space) and a Unit space, linked by printed connections. Notches on the top edge hold the Alliance token stacks.", "Um mapa da Terra-média com 7 regiões, cada uma com um estandarte (espaço de Fortaleza) e um espaço de Unidade, ligadas por conexões impressas. Encaixes na borda superior guardam as pilhas de fichas de Aliança."), refs(1, 2, 7)),
      inventoryCard(t("TRACK", "TRILHA"), t("Quest of the Ring track · 4 pieces", "Trilha da Demanda do Anel · 4 peças"), t("Assembled into one long track with the Nazgûl's starting space at the left end, the One Ring (Frodo and Sam's start) in the middle, Bonus spaces along the way and Mount Doom at the right end. Frodo and Sam and the Nazgûl are the sliding characters on it.", "Montada numa trilha longa com o espaço inicial do Nazgûl na ponta esquerda, o Um Anel (início de Frodo e Sam) no meio, espaços bônus ao longo do caminho e a Montanha da Perdição na ponta direita. Frodo e Sam e o Nazgûl são os personagens deslizantes sobre ela."), refs(1, 2, 6)),
      inventoryCard(t("COINS", "MOEDAS"), t("30 Coins", "30 Moedas"), t("3 to the Fellowship, 2 to Sauron, 25 to the reserve.", "3 para a Sociedade, 2 para Sauron, 25 para a reserva."), refs(1, 2)),
      inventoryCard(t("TOKENS", "FICHAS"), t("18 Alliance tokens · 3 per Race", "18 fichas de Aliança · 3 por Raça"), t("Six facedown stacks (Elves, Ents, Hobbits, Humans, Dwarves, Wizards). Each token's effect is on the Player Aid and in the Race Alliances section.", "Seis pilhas viradas para baixo (Elfos, Ents, Hobbits, Humanos, Anões, Magos). O efeito de cada ficha está na Ajuda de jogo e na seção Alianças das Raças."), refs(1, 2, [2, "aid"])),
      inventoryCard(t("FELLOWSHIP", "SOCIEDADE"), t("15 Units + 7 Fortresses", "15 Unidades + 7 Fortalezas"), t("The Fellowship player's pawns. 2 Units start in Arnor; the rest stay in front of the player as their supply.", "Os peões do jogador da Sociedade. 2 Unidades começam em Arnor; o resto fica à frente do jogador como reserva pessoal."), refs(1, 2)),
      inventoryCard(t("SAURON", "SAURON"), t("15 Units + 7 Fortresses", "15 Unidades + 7 Fortalezas"), t("The Sauron player's pawns. 2 Units start in Mordor; the rest stay in front of the player as their supply.", "Os peões do jogador de Sauron. 2 Unidades começam em Mordor; o resto fica à frente do jogador como reserva pessoal."), refs(1, 2)),
      inventoryCard(t("REFERENCE", "REFERÊNCIA"), t("1 Player Aid + 1 Rulebook", "1 Ajuda de jogo + 1 Manual"), t("The Player Aid lists every Landmark, Quest bonus and Alliance token effect; both are linked from this guide.", "A Ajuda de jogo lista todos os efeitos de Marco, de bônus da Demanda e de ficha de Aliança; os dois estão linkados neste guia."), refs(1, [1, "aid"]))
    ];
    return `<div class="quick-grid">${cards.join("")}</div>`;
  }

  function setupSection() {
    const phases = setupPhases();
    const tasks = phases.flatMap((phase) => phase.items);
    const valid = new Set(tasks.map((item) => item.id));
    const kept = state.setupChecks.filter((id) => valid.has(id));
    if (kept.length !== state.setupChecks.length) {
      state.setupChecks = kept;
      saveState();
    }
    const required = tasks.filter((item) => !item.optional);
    const done = required.filter((item) => state.setupChecks.includes(item.id)).length;
    const phaseMarkup = phases.map((phase, index) => `
      <article class="setup-phase">
        <header class="setup-phase-header">
          <span class="setup-phase-number">${String(index + 1).padStart(2, "0")}</span>
          <h3>${phase.title}</h3>
          <div class="setup-phase-references">${phase.refs}</div>
        </header>
        <div class="setup-check-list">${phase.items.map((item) => `
          <label class="setup-check">
            <input type="checkbox" data-setup-check="${escapeHtml(item.id)}" ${state.setupChecks.includes(item.id) ? "checked" : ""}>
            <span>
              <strong>${item.title}</strong>
              <small class="setup-substeps" role="list">${item.lines.map((line) => `<span role="listitem">${line}</span>`).join("")}</small>
            </span>
          </label>`).join("")}</div>
        ${index === 4 ? chapterRunes() + figure("layout-chapter-1", t("Chapter 1 layout: light cards are faceup, dark cards are facedown. Rulebook p. 3.", "Disposição do capítulo 1: cartas claras viradas para cima, escuras viradas para baixo. Manual p. 3."), t("Diagram of the chapter 1 pyramid of 20 cards", "Diagrama da pirâmide de 20 cartas do capítulo 1"), "is-small") : ""}
        ${index === 1 ? figure("setup-diagram", t("Table layout from the rulebook: numbers match the setup steps on page 2.", "Disposição da mesa segundo o manual: os números correspondem aos passos de preparação da página 2."), t("Setup diagram showing the central board, Quest track, token stacks, Landmark tiles, chapter decks, discard and the two play areas", "Diagrama de preparação mostrando o tabuleiro central, a trilha da Demanda, as pilhas de fichas, as tiles de Marco, os baralhos de capítulo, o descarte e as duas áreas de jogo")) : ""}
      </article>`).join("");
    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), "02", refs(2))}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Set up this match", "Prepare esta partida")}</h3>
            <p>${t("Check each step once all of its lines are done. Progress is saved for this game only.", "Marque cada etapa quando todas as suas linhas estiverem feitas. O progresso fica salvo só neste jogo.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${required.length} steps checked`, `${done} de ${required.length} etapas concluídas`)}</span>
            <progress id="setup-progress" max="${Math.max(required.length, 1)}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "“Uncheck all” clears only these boxes. Changing language does not.",
          "“Desmarcar tudo” limpa só estas caixas. Trocar o idioma não limpa."
        )}</p>
      </div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}
      <div class="setup-phases">${phaseMarkup}</div>`;
  }

  function chapterRunes() {
    const runes = [
      ["rune-chapter-1", t("Chapter 1 rune", "Runa do capítulo 1"), t("Back of the 23 chapter 1 cards. The rune looks like a capital P with an angular bowl.", "Verso das 23 cartas do capítulo 1. A runa parece um P maiúsculo com a barriga angular.")],
      ["rune-chapter-2", t("Chapter 2 rune", "Runa do capítulo 2"), t("Back of the 23 chapter 2 cards. The rune looks like a capital R.", "Verso das 23 cartas do capítulo 2. A runa parece um R maiúsculo.")],
      ["rune-chapter-3", t("Chapter 3 rune", "Runa do capítulo 3"), t("Back of the 23 chapter 3 cards. The rune looks like a mirrored P: a vertical stroke with a pointed flag on its left. The 10 Purple cards are also only in this deck.", "Verso das 23 cartas do capítulo 3. A runa parece um P espelhado: um traço vertical com uma bandeirola pontuda à esquerda. As 10 cartas Roxas também estão só neste baralho.")]
    ];
    return `<div class="icon-grid duel-three">${runes.map(([file, title, body]) => iconCard(file, title, body, referenceLink(2))).join("")}</div>`;
  }

  // --- Chapters and turn ----------------------------------------------------------

  function chaptersSection() {
    const layouts = [
      ["layout-chapter-1", t("Chapter 1 · 20 cards", "Capítulo 1 · 20 cartas"), t("A pyramid that widens downward. Rows from the top: 2 faceup, 3 facedown, 4 faceup, 5 facedown, 6 faceup. Each row is centred under the one above, so every card is overlapped by the 2 cards below it. The bottom row of 6 is available first.", "Uma pirâmide que se alarga para baixo. Fileiras de cima para baixo: 2 viradas para cima, 3 para baixo, 4 para cima, 5 para baixo, 6 para cima. Cada fileira fica centralizada sob a de cima, então cada carta é sobreposta pelas 2 cartas abaixo dela. A fileira de baixo, com 6, fica disponível primeiro.")],
      ["layout-chapter-2", t("Chapter 2 · 20 cards", "Capítulo 2 · 20 cartas"), t("An inverted pyramid. Rows from the top: 6 faceup, 5 facedown, 4 faceup, 3 facedown, 2 faceup. Each row is centred under the one above: the 2 end cards of a row are overlapped by 1 card, the others by 2. The bottom row of 2 is available first.", "Uma pirâmide invertida. Fileiras de cima para baixo: 6 viradas para cima, 5 para baixo, 4 para cima, 3 para baixo, 2 para cima. Cada fileira fica centralizada sob a de cima: as 2 cartas das pontas de uma fileira são sobrepostas por 1 carta, as demais por 2. A fileira de baixo, com 2, fica disponível primeiro.")],
      ["layout-chapter-3", t("Chapter 3 · 20 cards", "Capítulo 3 · 20 cartas"), t("A diamond with a hole. Rows from the top: 2 faceup, 3 facedown, 4 faceup, 2 facedown, 4 faceup, 3 facedown, 2 faceup. The upper half widens like chapter 1. The row of 2 facedown cards leaves the centre empty: one card sits under the 2 left cards of the row of 4 above, the other under the 2 right cards. The next row of 4 overlaps them in pairs, then the lower half narrows like chapter 2. The bottom row of 2 is available first.", "Um losango com um vão. Fileiras de cima para baixo: 2 viradas para cima, 3 para baixo, 4 para cima, 2 para baixo, 4 para cima, 3 para baixo, 2 para cima. A metade de cima se alarga como no capítulo 1. A fileira de 2 cartas viradas para baixo deixa o centro vazio: uma carta fica sob as 2 cartas da esquerda da fileira de 4 acima, a outra sob as 2 da direita. A fileira de 4 seguinte as sobrepõe em pares, e depois a metade de baixo se estreita como no capítulo 2. A fileira de baixo, com 2, fica disponível primeiro.")]
    ];
    return `
      ${sectionHeading("chapters", t("Chapters & Turn", "Capítulos e Turno"), "03", refs(3))}
      <div class="turn-block"><h3>${t("Preparing a chapter", "Preparando um capítulo")}</h3>
        <p>${t("At the start of each chapter (1, 2, then 3), place cards from the corresponding chapter deck in the central play area, following the diagram below (there is a reminder on the sides of the box). Be careful: certain cards are placed faceup and others facedown. Each row is laid so that it partially covers the row above it: rows are offset by half a card, like bricks, and each card overlaps the bottom edge of the 1 or 2 cards above that it touches. A card becomes available when every card of the row below that overlaps it has been taken. Place the 3 remaining cards of the deck, facedown, in the discard.", "No início de cada capítulo (1, 2 e depois 3), coloque cartas do baralho do capítulo correspondente na área central, seguindo o diagrama abaixo (há um lembrete nas laterais da caixa). Atenção: certas cartas ficam viradas para cima e outras para baixo. Cada fileira é disposta de modo a cobrir parcialmente a fileira de cima: as fileiras ficam deslocadas meia carta, como tijolos, e cada carta sobrepõe a borda inferior da 1 ou 2 cartas de cima que ela toca. Uma carta fica disponível quando todas as cartas da fileira de baixo que a sobrepõem tiverem sido pegas. Coloque as 3 cartas restantes do baralho, viradas para baixo, no descarte.")}</p>
      </div>
      <div class="duel-layouts">${layouts.map(([file, title, body]) => `
        <figure class="duel-figure is-layout"><img src="${icon(file)}" alt="${escapeHtml(title)}" loading="lazy"><figcaption><strong>${title}</strong><br>${body}</figcaption></figure>`).join("")}
        ${figure("layout-legend", t("Legend: light = faceup card, dark = facedown card.", "Legenda: claro = carta virada para cima, escuro = carta virada para baixo."), t("Legend of the chapter diagrams", "Legenda dos diagramas de capítulo"), "is-legend")}
      </div>
      <div class="turn-block"><h3>${t("Turn overview", "Visão geral do turno")}</h3>
        <p>${t("The Sauron player begins the game, then both players take turns until the end of the game. On your turn, you may either <strong>take a Chapter card</strong> or <strong>take a Landmark tile</strong>.", "O jogador de Sauron começa a partida, e então os dois jogadores alternam turnos até o fim do jogo. No seu turno, você pode <strong>pegar uma carta de Capítulo</strong> ou <strong>pegar uma tile de Marco</strong>.")}</p>
      </div>
      <div class="turn-block"><h3>${t("A. Take a Chapter card", "A. Pegar uma carta de Capítulo")}</h3>
        <p>${t("From the central play area, choose an <strong>available</strong> card, meaning one that is not partially covered by any other card. Then play it in front of you or discard it.", "Da área central, escolha uma carta <strong>disponível</strong>, ou seja, uma que não esteja parcialmente coberta por nenhuma outra. Depois, jogue-a à sua frente ou descarte-a.")}</p>
        <div class="content-grid">
          <article class="action-card"><strong>${t("Play the card in front of you", "Jogar a carta à sua frente")}</strong><p>${t("Pay the card's cost, if any (see Costs), and place it in your play area. You may immediately benefit from its effect (see Card and tile effects). Stack your cards by colour, making sure you can still see their effects.", "Pague o custo da carta, se houver (veja Custos), e coloque-a na sua área de jogo. Você pode usar o efeito dela imediatamente (veja Efeitos das cartas e tiles). Empilhe suas cartas por cor, garantindo que os efeitos continuem visíveis.")}</p></article>
          <article class="action-card"><strong>${t("Discard the card", "Descartar a carta")}</strong><p>${t("Place the card facedown in the discard and take as many Coins from the reserve as the current chapter: chapter 1 = 1 Coin, chapter 2 = 2 Coins, chapter 3 = 3 Coins.", "Coloque a carta virada para baixo no descarte e pegue da reserva tantas Moedas quanto o capítulo atual: capítulo 1 = 1 Moeda, capítulo 2 = 2 Moedas, capítulo 3 = 3 Moedas.")}</p></article>
        </div>
        <p>${t("Finally, end your turn by revealing any facedown cards that are now available (no longer covered by any card).", "Por fim, encerre o turno revelando as cartas viradas para baixo que agora estejam disponíveis (não mais cobertas por nenhuma carta).")}</p>
        ${figure("available-card", t("Available cards are the ones with no card on top of them (ticked in the rulebook figure).", "Cartas disponíveis são as que não têm nenhuma carta por cima (marcadas na figura do manual)."), t("Diagram marking the uncovered, available cards of a layout", "Diagrama marcando as cartas descobertas e disponíveis de uma disposição"), "is-small")}
      </div>
      <div class="turn-block"><h3>${t("B. Take a Landmark tile", "B. Pegar uma tile de Marco")}</h3>
        <p>${t("Choose one of the faceup tiles. Pay its cost (see Costs) and place it in your play area. Immediately place a Fortress pawn on the corresponding region of the central board and benefit from its other effects (listed in Card and tile effects, from the Player Aid). Finally, end your turn <strong>without revealing a new tile</strong>: new tiles are only revealed at the end of a chapter.", "Escolha uma das tiles viradas para cima. Pague o custo dela (veja Custos) e coloque-a na sua área de jogo. Coloque imediatamente um peão de Fortaleza na região correspondente do tabuleiro central e use os outros efeitos dela (listados em Efeitos das cartas e tiles, a partir da Ajuda de jogo). Por fim, encerre o turno <strong>sem revelar uma tile nova</strong>: tiles novas só são reveladas no fim de um capítulo.")}</p>
      </div>
      <div class="turn-block"><h3>${t("End of a chapter", "Fim de um capítulo")}</h3>
        <p>${t("A chapter ends once the final card of this chapter has been taken. Set up the cards for the next chapter according to its diagram and reveal new Landmark tiles from the facedown stack until there are, if possible, 3 faceup. Then continue the game as normal.", "Um capítulo termina assim que a última carta desse capítulo é pega. Disponha as cartas do próximo capítulo conforme o diagrama dele e revele novas tiles de Marco da pilha virada para baixo até haver, se possível, 3 viradas para cima. Depois continue a partida normalmente.")}</p>
        <p>${t("<strong>Note:</strong> since you alternate taking turns, the player who ends a chapter does not begin the next one, unless they are using a “Take another turn” effect (from a Quest bonus space or an Alliance token).", "<strong>Nota:</strong> como os turnos são alternados, o jogador que encerra um capítulo não começa o próximo, a menos que esteja usando um efeito “Jogue outro turno” (de um espaço bônus da Demanda ou de uma ficha de Aliança).")}</p>
        <p>${t("After the final card of chapter 3 is taken, the game ends (see End of the game).", "Depois que a última carta do capítulo 3 é pega, a partida termina (veja Fim da partida).")}</p>
      </div>`;
  }

  // --- Costs --------------------------------------------------------------------------

  function costsSection() {
    return `
      ${sectionHeading("costs", t("Card and tile costs", "Custos das cartas e tiles"), "04", refs(4))}
      <div class="turn-block"><h3>${t("Coins", "Moedas")}</h3>
        <p>${t("In order to play them, certain cards have a Coin cost that you must pay to the reserve. The cost is printed on the card.", "Para jogá-las, certas cartas têm um custo em Moedas que você deve pagar à reserva. O custo está impresso na carta.")}</p>
      </div>
      <div class="turn-block"><h3>${t("Skills", "Habilidades")}</h3>
        <p>${t("In order to play them, tiles and the majority of cards require you to have one or more Skills in your play area (the symbols on your Grey cards; see Card and tile effects). If you do not have the required Skills, you may pay 1 Coin to the reserve per missing Skill symbol.", "Para jogá-las, as tiles e a maioria das cartas exigem que você tenha uma ou mais Habilidades na sua área de jogo (os símbolos das suas cartas Cinza; veja Efeitos das cartas e tiles). Se não tiver as Habilidades exigidas, você pode pagar 1 Moeda à reserva por símbolo de Habilidade faltante.")}</p>
        <ul class="duel-list">
          <li>${t("There is no limit to the number of Skills you may pay for, to the reserve, on your turn.", "Não há limite para o número de Habilidades que você pode pagar à reserva no seu turno.")}</li>
          <li>${t("If a card does not require a Skill or a Coin, it has no cost, so you may play it for free.", "Se uma carta não exige Habilidade nem Moeda, ela não tem custo, então você pode jogá-la de graça.")}</li>
          <li>${t("Each Skill symbol in your play area may only be used once per turn (see Grey cards).", "Cada símbolo de Habilidade na sua área de jogo só pode ser usado uma vez por turno (veja cartas Cinza).")}</li>
        </ul>
      </div>
      <div class="turn-block"><h3>${t("Landmark tiles: additional cost", "Tiles de Marco: custo adicional")}</h3>
        <p>${t("Landmark tiles have an additional Coin cost equal to the number of your Fortress pawns already on the central board, on top of the Skill cost printed on the tile. Therefore the additional cost of your first tile is 0 Coins, of your second tile 1 Coin, and so on.", "Tiles de Marco têm um custo adicional em Moedas igual ao número dos seus peões de Fortaleza já no tabuleiro central, além do custo em Habilidades impresso na tile. Portanto, o custo adicional da sua primeira tile é 0 Moedas, da segunda 1 Moeda, e assim por diante.")}</p>
      </div>
      <div class="turn-block"><h3>${t("Chaining", "Encadeamento")}</h3>
        <p>${t("Starting in chapter 2, certain cards may be played for free through their chaining symbol. If you have, in your play area, a card with a matching symbol in its top-right corner, you may play the card for free, without having the required Skills. “For free” means you pay nothing at all: neither the Skill cost nor any Coin cost printed on the card.", "A partir do capítulo 2, certas cartas podem ser jogadas de graça pelo seu símbolo de encadeamento. Se você tiver, na sua área de jogo, uma carta com o símbolo correspondente no canto superior direito, pode jogar a carta de graça, sem precisar das Habilidades exigidas. “De graça” significa não pagar nada: nem o custo em Habilidades nem qualquer custo em Moedas impresso na carta.")}</p>
        <p>${t("<strong>Note:</strong> if you do not have the matching chaining symbol for a card, you may still play it normally by paying its Skill and/or Coin cost.", "<strong>Nota:</strong> se você não tiver o símbolo de encadeamento correspondente, ainda pode jogar a carta normalmente pagando o custo em Habilidades e/ou Moedas.")}</p>
      </div>
      <div class="example-grid">
        <article class="example-card"><span class="card-number">01</span><h3>${t("Chaining across chapters", "Encadeamento entre capítulos")}</h3>
          <p>${t("In chapter 1, you play a card for free (this particular card has no printed cost; many other chapter 1 cards do). In addition to its effect, it shows a chaining symbol in its top-right corner. In chapter 2, you may play a card that asks for that same symbol for free, since you have the matching chaining symbol on one of your played cards. Otherwise, you would need to have the required Skills, or pay 1 Coin per missing Skill symbol.", "No capítulo 1, você joga uma carta de graça (esta carta específica não tem custo impresso; muitas outras do capítulo 1 têm). Além do efeito, ela mostra um símbolo de encadeamento no canto superior direito. No capítulo 2, você pode jogar de graça uma carta que pede esse mesmo símbolo, já que você tem o símbolo de encadeamento correspondente numa das suas cartas jogadas. Caso contrário, precisaria ter as Habilidades exigidas, ou pagar 1 Moeda por símbolo de Habilidade faltante.")}</p>
          <div class="example-source"><span>${t("Worked example from the manual", "Exemplo do manual")}</span>${referenceLink(4)}</div>
        </article>
        <article class="example-card"><span class="card-number">02</span><h3>${t("Paying for missing Skills", "Pagando Habilidades faltantes")}</h3>
          <p>${t("A card requires 2 Strength and 1 Knowledge. You have one Grey card with Strength that you have not used this turn and no Knowledge. You use that Strength symbol and pay 2 Coins to the reserve for the second Strength and the Knowledge. (Illustrative application of the rule on page 4.)", "Uma carta exige 2 Força e 1 Conhecimento. Você tem uma carta Cinza com Força que ainda não usou neste turno e nenhum Conhecimento. Você usa esse símbolo de Força e paga 2 Moedas à reserva pela segunda Força e pelo Conhecimento. (Aplicação ilustrativa da regra da página 4.)")}</p>
          <div class="example-source"><span>${t("Guide example", "Exemplo do guia")}</span>${referenceLink(4)}</div>
        </article>
      </div>`;
  }

  // --- Effects --------------------------------------------------------------------------

  function effectsSection() {
    const skillCards = SKILLS.map((skill) => iconCard(skill.file, t(skill.en, skill.pt), t("1 Skill symbol, usable once per turn to pay a Skill requirement.", "1 símbolo de Habilidade, usável uma vez por turno para pagar um requisito de Habilidade."), referenceLink(5))).join("");
    const raceCards = RACES.map((race) => iconCard(race.file, t(race.en, race.pt), t("Race symbol printed on Green cards. Counts toward alliances and toward the 6 symbols needed for the Support of the Races victory.", "Símbolo de Raça impresso nas cartas Verdes. Conta para alianças e para os 6 símbolos necessários à vitória por Apoio das Raças."), referenceLink(5))).join("");
    const purple = [
      ["purple-move-unit", t("Movement", "Movimento"), t("Move 1 of your Units to an adjacent region. Several arrows mean several movements (see Conquering Middle-earth).", "Mova 1 das suas Unidades para uma região adjacente. Várias setas significam vários movimentos (veja Conquista da Terra-média).")],
      ["purple-opponent-loses-coin", t("Opponent loses a Coin", "Oponente perde Moeda"), t("Your opponent loses 1 Coin (returned to the reserve).", "Seu oponente perde 1 Moeda (devolvida à reserva).")],
      ["purple-remove-enemy-unit", t("Remove an enemy Unit", "Remover Unidade inimiga"), t("Remove 1 enemy Unit from any region and return it to your opponent.", "Remova 1 Unidade inimiga de qualquer região e devolva-a ao seu oponente.")]
    ];
    const landmarkRows = LANDMARKS.map((tile) => `
      <tr><th scope="row">${tile.name}</th><td>${tile.region}</td><td><ul class="duel-list">${(state.language === "pt-BR" ? tile.pt : tile.en).map((line) => `<li>${line}</li>`).join("")}</ul></td></tr>`).join("");
    return `
      ${sectionHeading("effects", t("Card and tile effects", "Efeitos das cartas e tiles"), "05", refs(5, [1, "aid"]))}
      <div class="turn-block"><h3>${t("Grey cards: Skills", "Cartas Cinza: Habilidades")}</h3>
        <p>${t("Grey cards provide Skills that let you play other cards and tiles in your play area. You gain 1 Skill per symbol shown. Each symbol may only be used once per turn, on each of your turns.", "Cartas Cinza fornecem Habilidades que permitem jogar outras cartas e tiles na sua área de jogo. Você ganha 1 Habilidade por símbolo mostrado. Cada símbolo só pode ser usado uma vez por turno, em cada um dos seus turnos.")}</p>
        <div class="icon-grid">${skillCards}
          ${iconCard("skill-choice", t("Skills separated by a slash", "Habilidades separadas por barra"), t("When multiple Skills are separated by a “/”, you may only use one of them per turn (you choose which).", "Quando várias Habilidades estão separadas por “/”, você só pode usar uma delas por turno (você escolhe qual)."), referenceLink(5))}
        </div>
      </div>
      <div class="turn-block"><h3>${t("Yellow cards: Coins", "Cartas Amarelas: Moedas")}</h3>
        <div class="icon-grid">${iconCard("coin", t("Coin symbol", "Símbolo de Moeda"), t("Yellow cards immediately provide Coins that you will be able to spend to play other cards and tiles. Take, from the reserve, the number of Coins shown in the symbol.", "Cartas Amarelas dão imediatamente Moedas que você poderá gastar para jogar outras cartas e tiles. Pegue da reserva o número de Moedas mostrado no símbolo."), referenceLink(5))}</div>
      </div>
      <div class="turn-block"><h3>${t("Blue cards: Quest of the Ring", "Cartas Azuis: Demanda do Anel")}</h3>
        <div class="icon-grid">${iconCard("ring", t("Ring symbol", "Símbolo de Anel"), t("Blue cards immediately let you advance on the Quest of the Ring track. Move your character one space per Ring symbol (see Quest of the Ring).", "Cartas Azuis permitem avançar imediatamente na trilha da Demanda do Anel. Mova seu personagem um espaço por símbolo de Anel (veja Demanda do Anel)."), referenceLink(5))}</div>
      </div>
      <div class="turn-block"><h3>${t("Green cards: Races", "Cartas Verdes: Raças")}</h3>
        <p>${t("Green cards represent the Races of Middle-earth with whom you may ally (see Race Alliances).", "Cartas Verdes representam as Raças da Terra-média com quem você pode se aliar (veja Alianças das Raças).")}</p>
        <div class="icon-grid duel-three">${raceCards}</div>
      </div>
      <div class="turn-block"><h3>${t("Red cards: Units", "Cartas Vermelhas: Unidades")}</h3>
        <div class="icon-grid">${iconCard("red-placement", t("Unit placement", "Colocação de Unidades"), t("Red cards immediately let you place Units in the regions of Middle-earth. The number in the middle is how many Units to place; the two banners are the regions you may choose from. Choose one of the two regions and place all the Units in the chosen region (see Conquering Middle-earth for conflicts).", "Cartas Vermelhas permitem colocar imediatamente Unidades nas regiões da Terra-média. O número do meio é quantas Unidades colocar; os dois estandartes são as regiões entre as quais você pode escolher. Escolha uma das duas regiões e coloque todas as Unidades na região escolhida (veja Conquista da Terra-média para conflitos)."), referenceLink(5))}</div>
      </div>
      <div class="turn-block"><h3>${t("Purple cards: maneuvers (chapter 3 only)", "Cartas Roxas: manobras (só no capítulo 3)")}</h3>
        <p>${t("Purple cards immediately let you complete various maneuvers, shown by these symbols:", "Cartas Roxas permitem completar imediatamente várias manobras, mostradas por estes símbolos:")}</p>
        <div class="icon-grid duel-three">${purple.map(([file, title, body]) => iconCard(file, title, body, referenceLink(5))).join("")}</div>
      </div>
      <div class="turn-block"><h3>${t("Landmark tiles: Fortresses and unique effects", "Tiles de Marco: Fortalezas e efeitos únicos")}</h3>
        <div class="icon-grid">${iconCard("landmark-placement", t("Fortress placement", "Colocação de Fortaleza"), t("Landmark tiles immediately let you place a Fortress in the region shown by the banner and benefit from unique effects. The Fortress goes on the region's Fortress space (its banner).", "Tiles de Marco permitem colocar imediatamente uma Fortaleza na região mostrada pelo estandarte e usar efeitos únicos. A Fortaleza vai no espaço de Fortaleza da região (o estandarte dela)."), referenceLink(5))}</div>
        <p>${t("The effects of Landmarks are <strong>immediate effects that you may only use one time</strong>, when you gain the tile. The seven tiles, as printed on the Player Aid:", "Os efeitos dos Marcos são <strong>efeitos imediatos que você só pode usar uma vez</strong>, quando ganha a tile. As sete tiles, como impressas na Ajuda de jogo:")}</p>
        <table class="starter-deck-table duel-table">
          <caption>${t("Landmark tiles · 7", "Tiles de Marco · 7")} · ${referenceLink(1, "aid")}</caption>
          <thead><tr><th>${t("Tile", "Tile")}</th><th>${t("Fortress region", "Região da Fortaleza")}</th><th>${t("Effects (in order)", "Efeitos (na ordem)")}</th></tr></thead>
          <tbody>${landmarkRows}</tbody>
        </table>
        <p class="glossary-intro">${t("Each tile's Skill cost is printed on the tile itself; add the extra Coins for your Fortresses already on the board (see Costs).", "O custo em Habilidades de cada tile está impresso na própria tile; some as Moedas extras pelas suas Fortalezas já no tabuleiro (veja Custos).")}</p>
        <p class="glossary-intro duel-interpretation">${t("<strong>Isengard:</strong> the Player Aid does not say who picks the Grey card to discard. This guide reads it like every other effect you perform: you, the player resolving the tile, choose the card (interpretation). The guide also treats it as a plain removal to the facedown discard, not as the “discard a card for Coins” turn action (interpretation).", "<strong>Isengard:</strong> a Ajuda de jogo não diz quem escolhe a carta Cinza a descartar. Este guia lê como todo outro efeito que você executa: você, o jogador que resolve a tile, escolhe a carta (interpretação). O guia também trata isso como uma simples remoção para o descarte virado para baixo, e não como a ação de turno “descartar uma carta por Moedas” (interpretação).")}</p>
        ${discardEffectNote()}
        ${effectOrderNote()}
      </div>
      <div class="turn-block"><h3>${t("Edge cases the rulebook does not cover", "Casos-limite que o manual não cobre")}</h3>
        <p class="duel-interpretation">${t("<strong>Effect with no legal target or short supply</strong> (your opponent has 0 Coins to lose, no enemy Unit, Fortress or Grey card to remove, your own 15 Units or the Coin reserve run out, a Red card asks for more Units than you have left): the rulebook never addresses this. This guide applies the effect as far as possible and skips the rest; the play remains legal and nothing is owed later (interpretation).", "<strong>Efeito sem alvo legal ou com estoque curto</strong> (seu oponente tem 0 Moedas para perder, não há Unidade, Fortaleza ou carta Cinza inimiga para remover, suas 15 Unidades ou a reserva de Moedas acabam, uma carta Vermelha pede mais Unidades do que você tem): o manual nunca trata disso. Este guia aplica o efeito até onde for possível e ignora o resto; a jogada continua válida e nada fica devido depois (interpretação).")}</p>
        <p class="duel-interpretation">${t("<strong>Two “Take another turn” effects in the same turn</strong> (for example a Bonus space plus an Elves token): the sources do not say whether they add up. This guide reads them as not cumulative: you take one extra turn after the current one, no matter how many such effects fired (interpretation; agree before playing if your table prefers otherwise).", "<strong>Dois efeitos “Jogue outro turno” no mesmo turno</strong> (por exemplo, um espaço bônus mais uma ficha dos Elfos): as fontes não dizem se eles somam. Este guia os lê como não cumulativos: você joga um turno extra depois do atual, não importa quantos desses efeitos tenham disparado (interpretação; combinem antes de jogar se a mesa preferir o contrário).")}</p>
      </div>`;
  }

  // --- Quest of the Ring ------------------------------------------------------------------

  function questSection() {
    return `
      ${sectionHeading("quest", t("Quest of the Ring", "Demanda do Anel"), "06", refs(6, [1, "aid"]))}
      ${figure("quest-track", t("The assembled track: the Nazgûl's starting space (left end), Bonus spaces, the One Ring where Frodo and Sam start, more Bonus spaces, and Mount Doom (right end). Rulebook p. 6.", "A trilha montada: espaço inicial do Nazgûl (ponta esquerda), espaços bônus, o Um Anel onde Frodo e Sam começam, mais espaços bônus e a Montanha da Perdição (ponta direita). Manual p. 6."), t("The Quest of the Ring track with its labelled spaces", "A trilha da Demanda do Anel com seus espaços rotulados"))}
      <div class="turn-block"><h3>${t("Advancing", "Avançando")}</h3>
        <p>${t("When you advance on the Quest of the Ring track, slide your character (Frodo and Sam, represented by the One Ring marker, for the Fellowship; the Nazgûl for Sauron) from space to space. Both characters move in the same direction, from the left end toward Mount Doom. When you <strong>reach or pass</strong> a Bonus space, you may immediately benefit from its effect.", "Quando você avança na trilha da Demanda do Anel, deslize seu personagem (Frodo e Sam, representados pelo marcador do Um Anel, para a Sociedade; o Nazgûl para Sauron) de espaço em espaço. Os dois personagens se movem na mesma direção, da ponta esquerda rumo à Montanha da Perdição. Quando você <strong>alcança ou passa</strong> por um espaço bônus, pode usar o efeito dele imediatamente.")}</p>
        <p>${t("<strong>Note:</strong> the piece that represents the Nazgûl is placed on top of the piece that represents Frodo and Sam. Therefore, when Frodo and Sam move, the Nazgûl automatically moves as well (the gap stays the same). In other words, the distance between the characters will only decrease, never increase. When the Nazgûl advance, only the Nazgûl move, closing the gap.", "<strong>Nota:</strong> a peça que representa o Nazgûl fica em cima da peça que representa Frodo e Sam. Portanto, quando Frodo e Sam se movem, o Nazgûl se move automaticamente junto (a distância fica igual). Em outras palavras, a distância entre os personagens só diminui, nunca aumenta. Quando o Nazgûl avança, só o Nazgûl se move, fechando a distância.")}</p>
        <p class="duel-interpretation">${t("Bonus spaces belong to the player who advances: the rulebook grants them “when you advance” your character. When the Nazgûl are merely carried along by a Fellowship move, Sauron is not advancing, so this guide does not award Sauron the Bonus spaces the Nazgûl slide over that way (interpretation; the rulebook does not address the carried movement explicitly).", "Os espaços bônus pertencem a quem avança: o manual os concede “quando você avança” seu personagem. Quando o Nazgûl é apenas carregado por um movimento da Sociedade, Sauron não está avançando, então este guia não concede a Sauron os espaços bônus que o Nazgûl atravessa dessa forma (interpretação; o manual não trata explicitamente do movimento carregado).")}</p>
        <p>${t("The effects of the Quest of the Ring track are immediate effects that you may only use one time, when you gain them. The Bonus spaces, as printed on the Player Aid:", "Os efeitos da trilha da Demanda do Anel são efeitos imediatos que você só pode usar uma vez, quando os ganha. Os espaços bônus, como impressos na Ajuda de jogo:")}</p>
        <div class="icon-grid">${BONUS_SPACES.map((space) => iconCard(space.file, t(space.en, space.pt), t(space.en_d, space.pt_d), referenceLink(1, "aid"))).join("")}</div>
      </div>
      <div class="example-grid">
        <article class="example-card"><span class="card-number">01</span><h3>${t("Passing a Bonus space", "Passando por um espaço bônus")}</h3>
          <p>${t("As the Fellowship player, you play a Blue card with 2 Rings that lets you move Frodo and Sam 2 spaces. They pass a Bonus space, which lets you benefit from its effect (in this case, take 1 Coin from the reserve).", "Como jogador da Sociedade, você joga uma carta Azul com 2 Anéis que permite mover Frodo e Sam 2 espaços. Eles passam por um espaço bônus, o que permite usar o efeito dele (neste caso, pegar 1 Moeda da reserva).")}</p>
          <div class="example-source"><span>${t("Worked example from the manual", "Exemplo do manual")}</span>${referenceLink(6)}</div>
        </article>
      </div>`;
  }

  // --- Alliances --------------------------------------------------------------------------------

  function alliancesSection() {
    const raceGroups = RACES.map((race) => `
      <h3 class="subhead duel-race-head"><img class="duel-race-icon" src="${icon(race.file)}" alt="">${t(race.en, race.pt)}${race.key === "ents" || race.key === "wizards" ? ` <small>${t("· one-time, immediate effects", "· efeitos imediatos, de uso único")}</small>` : ""}</h3>
      <div class="icon-grid duel-three">${RACE_EFFECTS[race.key].map((effect, position) => iconCard(effect.file, `${t(race.en, race.pt)} · ${t("token", "ficha")} ${position + 1}`, t(effect.en, effect.pt), referenceLink(2, "aid"))).join("")}</div>`).join("");
    return `
      ${sectionHeading("alliances", t("Race Alliances", "Alianças das Raças"), "07", refs(6, [2, "aid"]))}
      <p class="glossary-intro">${t("During the game, you may form alliances with the Races of Middle-earth. To do this, in your play area, play Green cards with matching or different Race symbols, according to the following conditions:", "Durante a partida, você pode formar alianças com as Raças da Terra-média. Para isso, jogue na sua área de jogo cartas Verdes com símbolos de Raça iguais ou diferentes, conforme as condições a seguir:")}</p>
      <div class="content-grid">
        <article class="action-card"><strong>${t("2 matching Race symbols", "2 símbolos de Raça iguais")}</strong><p>${t("As soon as you have 2 matching Race symbols, take the top 2 Alliance tokens of this Race and reveal them. Choose 1 to place in front of you; you may now benefit from its effect. Put the other token, facedown, on top of its stack.", "Assim que você tiver 2 símbolos de Raça iguais, pegue as 2 fichas de Aliança do topo dessa Raça e revele-as. Escolha 1 para colocar à sua frente; você já pode usar o efeito dela. Devolva a outra ficha, virada para baixo, ao topo da pilha.")}</p></article>
        <article class="action-card"><strong>${t("3 different Race symbols (once per game)", "3 símbolos de Raça diferentes (uma vez por partida)")}</strong><p>${t("Once per game, when you have 3 different Race symbols, take the top Alliance token of each of these 3 Races and reveal them. Choose 1 to place in front of you; you may now benefit from its effect. Put the other 2 tokens, facedown, on top of their respective stacks.", "Uma vez por partida, quando você tiver 3 símbolos de Raça diferentes, pegue a ficha de Aliança do topo de cada uma dessas 3 Raças e revele-as. Escolha 1 para colocar à sua frente; você já pode usar o efeito dela. Devolva as outras 2 fichas, viradas para baixo, ao topo das suas pilhas.")}</p></article>
      </div>
      <ul class="duel-list duel-notes">
        <li>${t("A single Race symbol may be used for both conditions (2 matching symbols and 3 different symbols).", "Um mesmo símbolo de Raça pode ser usado para as duas condições (2 símbolos iguais e 3 símbolos diferentes).")}</li>
        <li>${t("Reveal tokens to both players. There is no hidden information about Alliance tokens: the ones you draw and the one you keep are shown to your opponent.", "Revele as fichas aos dois jogadores. Não há informação oculta sobre as fichas de Aliança: as que você compra e a que você fica são mostradas ao oponente.")}</li>
        <li>${t("The rulebook states the 2-matching-symbols condition once and does not say whether a second pair of the same Race (4 matching symbols) triggers it again. This guide reads it as triggering once per Race; agree on it before playing if your table prefers otherwise (interpretation).", "O manual enuncia a condição de 2 símbolos iguais uma vez e não diz se um segundo par da mesma Raça (4 símbolos iguais) a dispara de novo. Este guia lê como disparo único por Raça; combinem antes de jogar se a mesa preferir o contrário (interpretação).")}</li>
        <li>${t("A Race has only 3 tokens. If its stack is empty or has a single token when you qualify, you can only reveal what is left; the rulebook does not add any other rule for this case.", "Cada Raça tem só 3 fichas. Se a pilha estiver vazia ou tiver uma única ficha quando você cumprir a condição, só é possível revelar o que resta; o manual não acrescenta outra regra para esse caso.")}</li>
        <li>${t("The Player Aid marks only the Ent and Wizard effects as one-time, immediate effects used when you gain the token. The other Races' tokens are worded as conditions (“When you play a Yellow card…”, “Once per turn…”): keep them in front of you and apply them each time their condition occurs.", "A Ajuda de jogo marca só os efeitos de Ents e Magos como efeitos imediatos de uso único, usados quando você ganha a ficha. As fichas das outras Raças estão redigidas como condições (“Quando você jogar uma carta Amarela…”, “Uma vez por turno…”): mantenha-as à sua frente e aplique-as sempre que a condição ocorrer.")}</li>
      </ul>
      <h3 class="subhead">${t("Alliance token effects (Player Aid)", "Efeitos das fichas de Aliança (Ajuda de jogo)")}</h3>
      ${raceGroups}
      ${discardEffectNote()}
      ${effectOrderNote()}`;
  }

  // --- Conquest ------------------------------------------------------------------------------------

  function conquestSection() {
    return `
      ${sectionHeading("conquest", t("Conquering Middle-earth", "Conquista da Terra-média"), "08", refs(7))}
      ${figure("board-map", t("The central board: each region has a banner (Fortress space) with a Unit space beside it; lines are the connections between regions. Rulebook p. 7.", "O tabuleiro central: cada região tem um estandarte (espaço de Fortaleza) com um espaço de Unidade ao lado; as linhas são as conexões entre regiões. Manual p. 7."), t("The central board showing the seven regions and their connections", "O tabuleiro central mostrando as sete regiões e suas conexões"))}
      <div class="turn-block"><h3>${t("The seven regions", "As sete regiões")}</h3>
        <p>${REGIONS.map((region) => t(region.en, region.pt)).join(" · ")}. ${t("Two regions are adjacent when a line printed on the board connects them; use the lines on your board for every movement.", "Duas regiões são adjacentes quando uma linha impressa no tabuleiro as conecta; use as linhas do seu tabuleiro em todo movimento.")}</p>
      </div>
      <div class="turn-block"><h3>${t("Placing or moving Units", "Colocando ou movendo Unidades")}</h3>
        <p>${t("When you place or move one or more Units, two situations are possible:", "Quando você coloca ou move uma ou mais Unidades, duas situações são possíveis:")}</p>
        <ul class="duel-list">
          <li>${t("<strong>If no enemy Unit is present:</strong> nothing happens.", "<strong>Se não há Unidade inimiga presente:</strong> nada acontece.")}</li>
          <li>${t("<strong>If one or more enemy Units are present:</strong> trigger a conflict. Each player removes one of their Units and places it back in front of them. Repeat this until at least one player has no more Units in the region.", "<strong>Se há uma ou mais Unidades inimigas presentes:</strong> dispare um conflito. Cada jogador remove uma das suas Unidades e a devolve para a frente de si. Repita até que pelo menos um jogador não tenha mais Unidades na região.")}</li>
        </ul>
        <p>${t("<strong>Note:</strong> an enemy Fortress does not trigger conflicts and does not prevent you from placing your Units in its region. Therefore, it is possible for both players to be present in the same region.", "<strong>Nota:</strong> uma Fortaleza inimiga não dispara conflitos e não impede você de colocar Unidades na região dela. Portanto, é possível que os dois jogadores estejam presentes na mesma região.")}</p>
      </div>
      <div class="turn-block"><h3>${t("Multiple movements", "Vários movimentos")}</h3>
        <p>${t("When you complete multiple movements, you may move the same Unit multiple times, or split your movement between multiple Units. For each movement, move a Unit to an adjacent region (one with a connection). You must complete each movement independently, resolving any conflict triggered, one at a time.", "Quando você completa vários movimentos, pode mover a mesma Unidade várias vezes, ou dividir o movimento entre várias Unidades. Para cada movimento, mova uma Unidade para uma região adjacente (uma com conexão). Você deve completar cada movimento separadamente, resolvendo qualquer conflito disparado, um de cada vez.")}</p>
      </div>
      <div class="example-grid">
        <article class="example-card"><span class="card-number">01</span><h3>${t("Three movements and a conflict", "Três movimentos e um conflito")}</h3>
          <p>${t("You play a Purple card that provides 3 movements. The first lets you move a Unit from Enedwaith to Rohan. Since there is an enemy Unit present, you trigger a conflict and each player removes their Unit. You then use your second and third movements to send another Unit from Enedwaith to Mordor, passing through Rohan.", "Você joga uma carta Roxa que dá 3 movimentos. O primeiro permite mover uma Unidade de Enedwaith para Rohan. Como há uma Unidade inimiga presente, você dispara um conflito e cada jogador remove sua Unidade. Depois você usa o segundo e o terceiro movimentos para enviar outra Unidade de Enedwaith a Mordor, passando por Rohan.")}</p>
          <div class="example-source"><span>${t("Worked example from the manual", "Exemplo do manual")}</span>${referenceLink(7)}</div>
        </article>
      </div>`;
  }

  // --- End of the game -------------------------------------------------------------------------------

  function endSection() {
    return `
      ${sectionHeading("end", t("End of the game", "Fim da partida"), "09", refs(8))}
      <p class="glossary-intro">${t("There are three immediate victory conditions. As soon as one is fulfilled, the game ends and that player wins.", "Há três condições de vitória imediata. Assim que uma é cumprida, a partida termina e esse jogador vence.")}</p>
      <div class="quick-grid duel-three">
        <article class="info-card"><span class="component-label">${t("VICTORY 1", "VITÓRIA 1")}</span><h3>${t("Quest of the Ring", "Demanda do Anel")}</h3>
          <p>${t("<strong>For the Fellowship:</strong> if Frodo and Sam reach Mount Doom, they destroy the One Ring and you immediately win the game.", "<strong>Para a Sociedade:</strong> se Frodo e Sam chegam à Montanha da Perdição, eles destroem o Um Anel e você vence a partida imediatamente.")}</p>
          <p>${t("<strong>For Sauron:</strong> if the Nazgûl catch Frodo and Sam (reach their space), they seize the One Ring and you immediately win the game.", "<strong>Para Sauron:</strong> se o Nazgûl alcança Frodo e Sam (chega ao espaço deles), ele toma o Um Anel e você vence a partida imediatamente.")}</p></article>
        <article class="info-card"><span class="component-label">${t("VICTORY 2", "VITÓRIA 2")}</span><h3>${t("Support of the Races", "Apoio das Raças")}</h3>
          <p>${t("If you gather 6 different Race symbols on your Green cards, you rally the support of the Races of Middle-earth and immediately win the game.", "Se você reúne 6 símbolos de Raça diferentes nas suas cartas Verdes, você conquista o apoio das Raças da Terra-média e vence a partida imediatamente.")}</p>
          <p>${t("<strong>Note:</strong> the Eagle symbol, present on one Alliance token (Hobbits), is an additional Race symbol that counts as 1 of the 6 required symbols.", "<strong>Nota:</strong> o símbolo da Águia, presente numa ficha de Aliança (Hobbits), é um símbolo de Raça adicional que conta como 1 dos 6 símbolos exigidos.")}</p></article>
        <article class="info-card"><span class="component-label">${t("VICTORY 3", "VITÓRIA 3")}</span><h3>${t("Conquering Middle-earth", "Conquista da Terra-média")}</h3>
          <p>${t("If you are present in all 7 regions (with a Fortress and/or at least 1 Unit in each), you dominate Middle-earth and immediately win the game. Check presence after any conflict caused by the placement or movement has been resolved: Units removed in a conflict no longer count.", "Se você está presente em todas as 7 regiões (com uma Fortaleza e/ou pelo menos 1 Unidade em cada), você domina a Terra-média e vence a partida imediatamente. Verifique a presença depois de resolver qualquer conflito causado pela colocação ou pelo movimento: Unidades removidas num conflito não contam mais.")}</p></article>
      </div>
      <div class="turn-block"><h3>${t("End of chapter 3", "Fim do capítulo 3")}</h3>
        <p>${t("If none of these three victory conditions are achieved by the end of chapter 3 (when its final card is taken), the player who is present in the most regions of Middle-earth (with a Fortress and/or at least 1 Unit) wins the game. In case of a tie, share the victory.", "Se nenhuma das três condições de vitória for alcançada até o fim do capítulo 3 (quando a última carta dele é pega), vence o jogador presente em mais regiões da Terra-média (com uma Fortaleza e/ou pelo menos 1 Unidade). Em caso de empate, a vitória é compartilhada.")}</p>
        <p class="duel-interpretation">${t("<strong>Extra turn on the last card:</strong> the rulebook only mentions “Take another turn” effects in connection with starting the next chapter, and never describes a turn after the final card of chapter 3. This guide reads the rule literally: the chapter ends as soon as its final card is taken, so the region count happens at once and no extra turn is played. This is an interpretation; agree on it before playing if your table prefers otherwise.", "<strong>Turno extra na última carta:</strong> o manual só menciona efeitos “Jogue outro turno” em relação ao início do capítulo seguinte, e nunca descreve um turno após a última carta do capítulo 3. Este guia lê a regra ao pé da letra: o capítulo termina assim que a última carta é pega, então a contagem de regiões acontece na hora e nenhum turno extra é jogado. É uma interpretação; combinem antes de jogar se a mesa preferir o contrário.")}</p>
      </div>`;
  }

  // --- Glossary -------------------------------------------------------------------------------------

  function glossarySection() {
    const index = state.language === "pt-BR" ? 1 : 0;
    const terms = GLOSSARY_TERMS.slice().sort((a, b) => a[index].localeCompare(b[index], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), "10", refs(3, 7))}
      <p class="glossary-intro">${t("Short meanings for the words used above, with the page where the rulebook defines or uses them.", "Significados curtos das palavras usadas acima, com a página em que o manual as define ou usa.")}</p>
      <div class="quick-grid glossary-grid">${terms.map((item) => `
        <article class="info-card glossary-card"><span class="component-label">${t("TERM", "TERMO")}</span><h3>${t(item[0], item[1])}</h3><p>${t(item[2], item[3])}</p>
          <div class="glossary-references">${item[4].map((page) => referenceLink(page)).join(" ")}</div>
        </article>`).join("")}</div>`;
  }

  // --- Shell ------------------------------------------------------------------------------------------

  function renderHeader() {
    return `
      <header class="site-header">
        <a class="brand" href="#/" aria-label="${t("Field Manual home", "Página inicial do Manual de Campo")}">
          <span class="brand-mark" aria-hidden="true">DM</span>
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

  function renderInto(app) {
    root = app;
    document.body.classList.add("theme-lotr-duel");
    document.documentElement.lang = state.language;
    document.title = t("The Lord of the Rings: Duel for Middle-earth — Field Manual", "The Lord of the Rings: Duel for Middle-earth — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Interactive rules for The Lord of the Rings: Duel for Middle-earth, the 2-player card-drafting duel by Antoine Bauza and Bruno Cathala.",
        "Regras interativas de The Lord of the Rings: Duel for Middle-earth, o duelo de cartas para 2 jogadores de Antoine Bauza e Bruno Cathala."
      );
    }
    const nav = [
      ["quick-reference", t("Quick Ref", "Referência")],
      ["setup", t("Setup", "Preparação")],
      ["chapters", t("Chapters & Turn", "Capítulos e Turno")],
      ["costs", t("Costs", "Custos")],
      ["effects", t("Effects", "Efeitos")],
      ["quest", t("Quest of the Ring", "Demanda do Anel")],
      ["alliances", t("Alliances", "Alianças")],
      ["conquest", t("Conquest", "Conquista")],
      ["end", t("End of game", "Fim da partida")],
      ["glossary", t("Glossary", "Glossário")]
    ];
    app.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook · core game", "Livro interativo · jogo base")}</p>
          <h1>The Lord of the Rings: Duel for Middle-earth</h1>
          <p class="hero-intro">${t(
            "Will you play as the Fellowship of the Ring to defend the free races and destroy the One Ring? Or will you play as Sauron and pursue Frodo and Sam while deploying your hordes to the gates of the enemy cities? Over 3 chapters, draft cards and Landmark tiles to strengthen your Skills, hoard Coins, spread across Middle-earth, rally the Races or advance the Quest of the Ring.",
            "Você jogará com a Sociedade do Anel para defender os povos livres e destruir o Um Anel? Ou com Sauron, perseguindo Frodo e Sam enquanto leva suas hordas aos portões das cidades inimigas? Ao longo de 3 capítulos, recrute cartas e tiles de Marco para fortalecer suas Habilidades, acumular Moedas, espalhar-se pela Terra-média, reunir as Raças ou avançar na Demanda do Anel."
          )}</p>
          <div class="hero-meta"><span>${t("Exactly 2 players", "Exatamente 2 jogadores")}</span><span>${t("Fellowship vs. Sauron", "Sociedade vs. Sauron")}</span><span>${t("3 chapters", "3 capítulos")}</span><span>${t("3 ways to win", "3 formas de vencer")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/lotr-duel-for-middle-earth.webp" alt="${t("Front page of the Duel for Middle-earth rulebook", "Primeira página do manual de Duel for Middle-earth")}" fetchpriority="high"><figcaption>${t("Rulebook front page", "Primeira página do manual")} · Vincent Dutrait</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("Field guide", "Guia de campo")}</h2>
          ${nav.map(([id, label], index) => `<button type="button" data-scroll="${id}"><span class="toc-index">${String(index + 1).padStart(2, "0")}</span>${label}</button>`).join("")}
        </aside>
        <div class="content-column">
          ${storageNotice ? `<p class="storage-notice" role="status">${storageNoticeText()}</p>` : ""}
          ${aboutGuide()}
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${chaptersSection()}</section>
          <section class="rule-section">${costsSection()}</section>
          <section class="rule-section">${effectsSection()}</section>
          <section class="rule-section">${questSection()}</section>
          <section class="rule-section">${alliancesSection()}</section>
          <section class="rule-section">${conquestSection()}</section>
          <section class="rule-section">${endSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal guide for The Lord of the Rings: Duel for Middle-earth. Summaries follow the official rulebook and Player Aid, whose PDFs are included in this repository with permission. Designers: Antoine Bauza and Bruno Cathala; illustrator: Vincent Dutrait; Repos Production. Middle-earth, The Lord of the Rings and related names are trademarks of Middle-earth Enterprises, LLC.",
        "Guia pessoal de The Lord of the Rings: Duel for Middle-earth. Os resumos seguem o manual oficial e a Ajuda de jogo, cujos PDFs estão incluídos neste repositório com autorização. Design: Antoine Bauza e Bruno Cathala; ilustração: Vincent Dutrait; Repos Production. Middle-earth, The Lord of the Rings e nomes relacionados são marcas de Middle-earth Enterprises, LLC."
      )}</p></footer>`;
  }

  function onClick(event) {
    const button = event.target.closest("button");
    if (!button || !root || !root.contains(button)) {
      return;
    }
    if (button.dataset.language) {
      state.language = button.dataset.language === "en-US" ? "en-US" : "pt-BR";
      saveState();
      renderInto(root);
      return;
    }
    if (button.hasAttribute("data-setup-reset")) {
      state.setupChecks = [];
      saveState();
      renderInto(root);
      return;
    }
    if (button.dataset.scroll) {
      document.getElementById(button.dataset.scroll)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !root || !root.contains(target)) {
      return;
    }
    if (target instanceof HTMLInputElement && target.matches("[data-setup-check]")) {
      const id = target.dataset.setupCheck;
      const checked = new Set(state.setupChecks);
      if (target.checked) {
        checked.add(id);
      } else {
        checked.delete(id);
      }
      state.setupChecks = [...checked];
      saveState();
      const tasks = setupPhases().flatMap((phase) => phase.items);
      const required = tasks.filter((item) => !item.optional);
      const done = required.filter((item) => state.setupChecks.includes(item.id)).length;
      const progress = root.querySelector("#setup-progress");
      const label = root.querySelector("#setup-progress-label");
      if (progress) {
        progress.value = done;
      }
      if (label) {
        label.textContent = t(`${done} of ${required.length} steps checked`, `${done} de ${required.length} etapas concluídas`);
      }
    }
  }

  function onInput() {
    // Duel for Middle-earth has no freeform text fields; nothing to do here.
  }

  window.LotrDuelForMiddleEarth = { renderInto, onClick, onChange, onInput };
})();
