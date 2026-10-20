(() => {
  "use strict";

  const STORAGE_KEY = "field-manual.pagan.v1";
  const MANUAL_FILE = "pagan-fate-of-roanoke_core.pdf";
  const PDF_PAGE_OFFSET = 2; // the booklet's printed page numbers start 2 pages after the PDF's own page 1 (cover)

  let storageAvailable = true;
  let storageNotice = "";
  let root = null;

  function defaultState() {
    return {
      language: "pt-BR",
      matchMode: "starter", // "starter" (Scenario: Welcome to Roanoke) or "custom" (standard game, built decks)
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
    if (saved.matchMode === "starter" || saved.matchMode === "custom") {
      next.matchMode = saved.matchMode;
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
      console.error("Could not read Pagan match settings.", error);
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
      console.error("Could not save Pagan match settings.", error);
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

  function configurationKey() {
    return JSON.stringify({ matchMode: state.matchMode });
  }

  function commit(mutator, restore) {
    const previous = configurationKey();
    mutator();
    state = normalizeState(state);
    if (configurationKey() !== previous) {
      state.setupChecks = [];
    }
    saveState();
    const restoreId = restore && restore.id ? restore.id : "";
    if (root) {
      renderInto(root);
    }
    if (!restoreId) {
      return;
    }
    const next = document.getElementById(restoreId);
    if (next) {
      next.focus();
    }
  }

  function manualUrl(printedPage) {
    const script = document.querySelector('script[src*="pagan.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${MANUAL_FILE}`, baseUrl).href}#page=${printedPage + PDF_PAGE_OFFSET}`;
  }

  function referenceLink(printedPage) {
    const label = t(`Manual p. ${printedPage} ↗`, `Manual p. ${printedPage} ↗`);
    return `<a class="source-link" href="${escapeHtml(manualUrl(printedPage))}" target="_blank" rel="noreferrer">${label}</a>`;
  }

  function sectionHeading(id, title, index, page) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("FIELD GUIDE", "GUIA DE CAMPO")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        ${referenceLink(page)}
      </div>`;
  }

  function iconCard(src, title, description) {
    return `
      <article class="icon-card">
        <span class="manual-icon-frame" aria-hidden="true"><img class="manual-icon" src="${src}" alt=""></span>
        <div><strong>${title}</strong><p>${description}</p></div>
      </article>`;
  }

  function storageNoticeText() {
    if (storageNotice === "read") {
      return t(
        "This browser could not read the saved Pagan match. The guide is showing a new default match, and it may not be possible to save changes.",
        "Este navegador não conseguiu ler a partida salva de Pagan. O guia está mostrando uma partida nova, e pode não ser possível salvar alterações."
      );
    }
    return t(
      "This browser refused to save the Pagan match. Your latest change is on screen only.",
      "Este navegador recusou salvar a partida de Pagan. A última alteração está só na tela."
    );
  }

  // --- Reference data -------------------------------------------------

  const VILLAGERS = [
    { name: "Mayor Biggs", faction: "stout", factionPt: "The Stout", color: "red", colorPt: "vermelha",
      en: "Look at the top 3 cards of the deck. Draw 1 and discard the rest.",
      pt: "Olhe as 3 cartas do topo do baralho. Compre 1 e descarte o resto." },
    { name: "Native Pamuy", faction: "stout", factionPt: "The Stout", color: "red", colorPt: "vermelha",
      en: "Play 1 card. Reduce its Influence cost by 1.",
      pt: "Jogue 1 carta. Reduza o custo em Influência dela em 1." },
    { name: "Widow Atkins", faction: "stout", factionPt: "The Stout", color: "red", colorPt: "vermelha",
      en: "Gain 1 Influence.",
      pt: "Ganhe 1 Influência." },
    { name: "Stranger Sue", faction: "recluses", factionPt: "Voluntary Recluses", color: "blue", colorPt: "azul",
      en: "Draw 2 cards.",
      pt: "Compre 2 cartas." },
    { name: "Preacher Wulfric", faction: "recluses", factionPt: "Voluntary Recluses", color: "blue", colorPt: "azul",
      en: "Play 1 card.",
      pt: "Jogue 1 carta." },
    { name: "Beau Johnson", faction: "recluses", factionPt: "Voluntary Recluses", color: "blue", colorPt: "azul",
      en: "Gain 2 Influence.",
      pt: "Ganhe 2 Influência." },
    { name: "Doctor Annie", faction: "caretakers", factionPt: "Caretakers", color: "green", colorPt: "verde",
      en: "Draw 1 card.",
      pt: "Compre 1 carta." },
    { name: "Hunter Adams", faction: "caretakers", factionPt: "Caretakers", color: "green", colorPt: "verde",
      en: "Play up to 2 cards. Increase the Influence cost of both by 1.",
      pt: "Jogue até 2 cartas. Aumente o custo em Influência de ambas em 1." },
    { name: "Nestling Mia", faction: "caretakers", factionPt: "Caretakers", color: "green", colorPt: "verde",
      en: "Gain 3 Influence. Your opponent gains 1 Influence.",
      pt: "Ganhe 3 Influência. Seu oponente ganha 1 Influência." }
  ];

  const CARD_TYPES = [
    { key: "ally", icon: "assets/pagan/card-ally.webp", side: "hunter", en: "Ally", pt: "Aliado",
      en_d: "An Ally assists you while alive, but costs Influence every Upkeep (its Upkeep cost). If you cannot or do not pay it, you must discard that Ally.",
      pt_d: "Um Aliado ajuda enquanto estiver vivo, mas custa Influência a cada Upkeep (seu custo de Upkeep). Se você não pagar, deve descartar esse Aliado.",
      example_en: "The Hunter plays \"Clerk\" for 2 Influence onto a free Ally spot. Next Upkeep, they use its effect and pay 1 Influence to keep it in play.",
      example_pt: "O Hunter joga \"Clerk\" por 2 de Influência em um espaço livre de Aliado. No Upkeep seguinte, usa o efeito dele e paga 1 de Influência para mantê-lo em jogo." },
    { key: "location", icon: "assets/pagan/card-location.webp", side: "hunter", en: "Location", pt: "Localização",
      en_d: "A Location gives you a new action. Placing an Action pawn on its Pawn Spot carries out its effect; it can be activated again on a later turn.",
      pt_d: "Uma Localização dá uma nova ação. Colocar um peão de ação no espaço indicado ativa seu efeito; pode ser ativada de novo em turnos seguintes.",
      example_en: "The Hunter plays \"Armory\" onto a free Location spot, then spends an Action pawn to activate it, removing 2 Secrets from villagers.",
      example_pt: "O Hunter joga \"Armory\" em um espaço livre de Localização e depois gasta um peão de ação para ativá-la, removendo 2 Segredos dos aldeões." },
    { key: "event", icon: "assets/pagan/card-event.webp", side: "hunter", en: "Event", pt: "Evento",
      en_d: "A sudden, one-time change. Apply its effect immediately, then discard it.",
      pt_d: "Uma mudança súbita e única. Aplique o efeito imediatamente e descarte a carta em seguida.",
      example_en: "\"Ransack\" is played and resolved at once: the Hunter gains Evidence, then the card goes to the discard pile.",
      example_pt: "\"Ransack\" é jogada e resolvida na hora: o Hunter ganha Evidência, e a carta vai para o descarte." },
    { key: "investigation", icon: "assets/pagan/card-investigation.webp", side: "hunter", en: "Investigation", pt: "Investigação",
      en_d: "Placed on a villager on the village board, on whichever side (Hunter's or Witch's) it benefits. Only one Investigation may be on a given villager at a time; it triggers whenever that villager is visited.",
      pt_d: "É colocada sobre um aldeão no tabuleiro de vilarejo, no lado (Hunter ou Witch) que ela beneficia. Só pode haver 1 Investigação por aldeão de cada vez; ela dispara sempre que esse aldeão é visitado.",
      example_en: "\"Persuasion\" is placed on \"Stranger Sue\", on the Hunter's side, since it benefits the Hunter every time that villager is visited.",
      example_pt: "\"Persuasion\" é colocada sobre \"Stranger Sue\", no lado do Hunter, pois o beneficia toda vez que esse aldeão é visitado." },
    { key: "brew", icon: "assets/pagan/card-brew.webp", side: "witch", en: "Brew", pt: "Poção",
      en_d: "Placed on a Brew spot. It cannot be used until enough Secrets (shown on the card) have been distributed onto it. Once ready, consume it as a free action on your turn (or during Upkeep) to apply its effect, return its Secrets to the supply, and discard it.",
      pt_d: "É colocada em um espaço de Poção. Não pode ser usada até acumular os Segredos indicados na carta. Pronta, consuma-a como ação gratuita no seu turno (ou no Upkeep) para aplicar o efeito, devolver os Segredos à reserva e descartá-la.",
      example_en: "\"Surplus Elixir\" needs 4 Secrets. Once filled, the Witch consumes it to add 1 Secret to every villager, then discards it.",
      example_pt: "\"Surplus Elixir\" precisa de 4 Segredos. Cheia, a Witch a consome para somar 1 Segredo a cada aldeão e depois a descarta." },
    { key: "charm", icon: "assets/pagan/card-charm.webp", side: "witch", en: "Charm", pt: "Encanto",
      en_d: "A one-time effect that can change the village board drastically. Apply it immediately, then discard it.",
      pt_d: "Um efeito único que pode mudar bastante o tabuleiro de vilarejo. Aplique-o imediatamente e descarte a carta em seguida.", },
    { key: "enchantment", icon: "assets/pagan/card-enchantment.webp", side: "witch", en: "Enchantment", pt: "Encantamento",
      en_d: "A powerful lasting effect placed on the leftmost free slot of the 3-slot Enchantment board. It costs 1 extra Influence per Enchantment already in play. With 3 already in play, you may discard one to make room. The Hunter can remove one by spending an action and paying its Lift cost (shown on the card), then sliding the rest left.",
      pt_d: "Um efeito contínuo poderoso, colocado no espaço livre mais à esquerda dos 3 do tabuleiro de Encantamentos. Custa 1 Influência extra por Encantamento já em jogo. Com 3 em jogo, você pode descartar um para abrir espaço. O Hunter pode remover um gastando uma ação e pagando o custo de remoção (na carta), deslizando os demais para a esquerda.",
      example_en: "With 1 Enchantment already in play, the Witch pays 4 Influence (3 printed + 1 extra) to play \"Entranced\" onto the second slot.",
      example_pt: "Com 1 Encantamento já em jogo, a Witch paga 4 de Influência (3 impressos + 1 extra) para jogar \"Entranced\" no segundo espaço." },
    { key: "familiar", icon: "assets/pagan/card-familiar.webp", side: "witch", en: "Familiar", pt: "Familiar",
      en_d: "Placed on a Familiar spot. When you visit a villager using the Familiar Action pawn, you may use exactly one Familiar in play to augment that visit. Paying the cost in parentheses Empowers it for a stronger effect.",
      pt_d: "É colocado em um espaço de Familiar. Ao visitar um aldeão usando o peão de ação do Familiar, você pode usar exatamente um Familiar em jogo para reforçar essa visita. Pagando o custo entre parênteses, você o Empodera para um efeito mais forte.",
      example_en: "Visiting with the Familiar pawn, the Witch uses \"Learn Secrets\" to gain 1 Influence, or discards 1 card to Empower it and gain 3 Influence instead.",
      example_pt: "Visitando com o peão do Familiar, a Witch usa \"Learn Secrets\" para ganhar 1 de Influência, ou descarta 1 carta para Empoderá-lo e ganhar 3 de Influência." }
  ];

  const TOKENS = [
    { icon: "assets/pagan/token-secret.webp", en: "Secret", pt: "Segredo",
      en_d: "Witch asset. Distributed when visiting a villager. 3 Secrets on a visited villager may be converted into 1 Favor (up to 2 times per visit).",
      pt_d: "Recurso da Witch. É distribuído ao visitar um aldeão. 3 Segredos no aldeão visitado podem virar 1 Favor (até 2 vezes por visita)." },
    { icon: "assets/pagan/token-favor.webp", en: "Favor", pt: "Favor",
      en_d: "Witch asset, converted from Secrets. 3+ Favors on the true witch's villager, plus the Perform Ritual action, wins the game for the Witch.",
      pt_d: "Recurso da Witch, convertido a partir de Segredos. 3+ Favores no aldeão que é a verdadeira bruxa, somados à ação Realizar o Ritual, vencem o jogo para a Witch." },
    { icon: "assets/pagan/token-clue.webp", en: "Clue", pt: "Pista",
      en_d: "Hunter asset. Distributed when visiting a villager. 3+ Clues on a visited villager grant 1 Evidence (the Clues stay on the villager).",
      pt_d: "Recurso do Hunter. É distribuído ao visitar um aldeão. 3+ Pistas no aldeão visitado concedem 1 Evidência (as Pistas continuam no aldeão)." },
    { icon: "assets/pagan/token-evidence.webp", en: "Evidence", pt: "Evidência",
      en_d: "Hunter asset gained from Clues. Spending 3 (or fewer, in the scenario) lets the Hunter Exonerate a villager, drawing a Suspect card.",
      pt_d: "Recurso do Hunter obtido a partir de Pistas. Gastar 3 (ou menos, no cenário) permite ao Hunter Exonerar um aldeão, comprando uma carta de Suspeito." }
  ];

  const SHARED_ICONS = [
    { icon: "assets/pagan/icon-influence.webp", en: "Influence", pt: "Influência",
      en_d: "Shared resource for both players, tracked on an Influence disc (1–20, with a marker added for each 21 beyond that). Pays card costs and Enchantment/Upkeep costs.",
      pt_d: "Recurso compartilhado por ambos os jogadores, marcado em um disco de Influência (1–20, somando um marcador a cada 21 além disso). Paga custos de cartas e de Encantamento/Upkeep." },
    { icon: "assets/pagan/icon-upkeep.webp", en: "Upkeep cost", pt: "Custo de Upkeep",
      en_d: "Printed on Allies: the Influence the Hunter must pay every Upkeep to keep that Ally in play, or discard it.",
      pt_d: "Impresso nos Aliados: a Influência que o Hunter deve pagar a cada Upkeep para manter esse Aliado em jogo, ou descartá-lo." },
    { icon: "assets/pagan/icon-empower.webp", en: "Empower", pt: "Empoderar",
      en_d: "Printed on Familiars in parentheses. Paying that cost (cards and/or Influence) turns the Familiar's basic effect into its stronger, empowered effect.",
      pt_d: "Impresso nos Familiares entre parênteses. Pagar esse custo (cartas e/ou Influência) transforma o efeito básico do Familiar no efeito Empoderado, mais forte." }
  ];

  const PAWN_ICONS = [
    { icon: "assets/pagan/pawn-hunter.webp", en: "Hunter Action pawn", pt: "Peão de ação do Hunter",
      en_d: "3 pawns. Used on villagers or the Hunter board to take Hunter actions.",
      pt_d: "3 peões. Usados em aldeões ou no tabuleiro do Hunter para realizar ações do Hunter." },
    { icon: "assets/pagan/pawn-witch.webp", en: "Witch Action pawn", pt: "Peão de ação da Witch",
      en_d: "2 regular pawns. Used on villagers or the Witch board to take Witch actions.",
      pt_d: "2 peões comuns. Usados em aldeões ou no tabuleiro da Witch para realizar ações da Witch." },
    { icon: "assets/pagan/pawn-familiar.webp", en: "Familiar Action pawn", pt: "Peão de ação do Familiar",
      en_d: "1 pawn for the Witch. Works like a regular Action pawn, but its villager visit may also use one Familiar in play.",
      pt_d: "1 peão da Witch. Funciona como um peão comum, mas a visita ao aldeão pode também usar um Familiar em jogo." }
  ];

  const SCENARIO = {
    name: "Welcome to Roanoke",
    namePt: "Bem-vindo a Roanoke",
    villagerSet: "Caretakers",
    hunter_en: "The Exonerate a Villager action only requires spending 1 Evidence (instead of 3). The Eliminate a Villager action does not require Clues on the other villagers.",
    hunter_pt: "A ação Exonerar um Aldeão exige gastar só 1 Evidência (em vez de 3). A ação Eliminar um Aldeão não exige Pistas nos outros aldeões.",
    witch_en: "The Witch may perform the ritual with only 2 Favors (instead of 3) on the true witch.",
    witch_pt: "A Witch pode realizar o ritual com apenas 2 Favores (em vez de 3) no verdadeiro bruxo."
  };

  const STARTER_HUNTER = [
    ["Headquarters", "Location", "0021", 2], ["Main Hall", "Location", "0020", 2], ["Study", "Location", "0022", 2],
    ["Persuasion", "Investigation", "0017", 2], ["Quarantine", "Investigation", "0015", 2], ["Gossip", "Investigation", "0013", 2], ["Harsh Treatment", "Investigation", "0019", 2],
    ["Ransack", "Event", "0011", 2], ["Rapid Decay", "Event", "0009", 2], ["On the Trail", "Event", "0010", 2], ["Bribe", "Event", "0007", 2],
    ["Thug", "Ally", "0005", 2], ["Native Guide", "Ally", "0001", 2], ["Operative", "Ally", "0004", 2], ["Clerk", "Ally", "0002", 2]
  ];

  const STARTER_WITCH = [
    ["Allure", "Charm", "0038", 2], ["Suggestion", "Charm", "0037", 2], ["Discredit", "Charm", "0034", 2], ["Misdirection", "Charm", "0035", 2],
    ["Assist", "Familiar", "0045", 2], ["Learn Secrets", "Familiar", "0048", 2], ["Qualm", "Familiar", "0049", 2], ["Gather", "Familiar", "0047", 2],
    ["Hypnotism", "Enchantment", "0040", 2], ["Witch's Mark", "Enchantment", "0043", 2], ["Obscuring Mist", "Enchantment", "0041", 2],
    ["Surplus Elixir", "Brew", "0030", 2], ["Potion of Knowledge", "Brew", "0029", 2], ["Blend of Nature", "Brew", "0028", 2], ["Flagon of Oblivion", "Brew", "0026", 2]
  ];

  const GLOSSARY_TERMS = [
    ["Add", "Adicionar", "Adding the specified tokens or cards to what is already present.", "Somar os marcadores ou cartas indicados ao que já está presente."],
    ["Blank", "Anular", "Treating a specific part of a card as if it were not there. Everything else on the card still applies.", "Tratar uma parte específica de uma carta como se não existisse. O resto da carta continua valendo."],
    ["Consume", "Consumir", "Using a Brew that has enough Secrets on it. Discard the Brew after applying its effect.", "Usar uma Poção que já tem Segredos suficientes. Descarte a Poção depois de aplicar o efeito."],
    ["Cost", "Custo", "The Influence cost printed in the top-right corner of an action card.", "O custo em Influência impresso no canto superior direito de uma carta de ação."],
    ["Discard", "Descartar", "Moving a card that is not in play to the discard pile.", "Mover uma carta que não está em jogo para o monte de descarte."],
    ["Draw", "Comprar", "Drawing cards from a deck, always from the top, one at a time.", "Comprar cartas de um baralho, sempre do topo, uma de cada vez."],
    ["Exonerate (a villager)", "Exonerar (um aldeão)", "The Hunter drawing the top card of the Suspect deck.", "O Hunter comprar a carta do topo do baralho de Suspeitos."],
    ["Faction", "Facção", "All villagers sharing a color, usually 3, but fewer if some have been eliminated.", "Todos os aldeões que compartilham uma cor, geralmente 3, mas menos se algum foi eliminado."],
    ["Gain", "Ganhar", "Attaining something not added to a card or board, such as Evidence from the supply or Influence on the disc.", "Obter algo que não é somado a uma carta ou tabuleiro, como Evidência da reserva ou Influência no disco."],
    ["Here", "Aqui", "Refers to the card itself; e.g. \"add a Clue here\" means add it to that card.", "Refere-se à própria carta; ex.: \"adicione uma Pista aqui\" significa adicioná-la a essa carta."],
    ["If possible", "Se possível", "The part of an effect that must be carried out only if it can be. The rest of the effect is carried out regardless.", "A parte de um efeito que só precisa ser cumprida se for possível. O resto do efeito é cumprido de qualquer forma."],
    ["In play", "Em jogo", "Cards present on, or connected to, a game board. Cards in hand are not in play.", "Cartas presentes em, ou ligadas a, um tabuleiro. Cartas na mão não estão em jogo."],
    ["Look at", "Olhar", "Looking at cards without revealing them to your opponent.", "Olhar cartas sem revelá-las ao oponente."],
    ["Move", "Mover", "Moving something already in play to another target also in play.", "Mover algo que já está em jogo para outro alvo também em jogo."],
    ["Permanently reveal", "Revelar permanentemente", "Revealing a card that stays face up for the rest of the game. It is not considered in play or in hand.", "Revelar uma carta que fica virada para cima pelo resto do jogo. Não é considerada em jogo nem na mão."],
    ["Play", "Jogar", "Playing 1 or more cards; they must come from your hand.", "Jogar 1 ou mais cartas; elas precisam vir da sua mão."],
    ["Present", "Presente", "Something available on the card.", "Algo disponível na carta."],
    ["Ready (state)", "Pronto (estado)", "A villager with no Action pawns on it.", "Um aldeão sem peões de ação sobre ele."],
    ["Ready (action)", "Preparar (ação)", "Removing an opponent's Action pawn(s) from a target villager.", "Remover o(s) peão(ões) de ação do oponente de um aldeão-alvo."],
    ["Remove", "Remover", "Removing something in play; tokens go to the supply, cards go to the owner's discard pile.", "Remover algo em jogo; marcadores vão para a reserva, cartas vão para o descarte do dono."],
    ["Reveal", "Revelar", "Showing card(s) to your opponent. Unless stated otherwise, revealed cards return to where they came from.", "Mostrar carta(s) ao oponente. Salvo indicação contrária, cartas reveladas voltam para onde estavam."],
    ["Skip", "Pular", "Completely ignoring the specified step of a turn or action.", "Ignorar completamente o passo indicado de um turno ou ação."],
    ["Supply", "Reserva", "Tokens not in play and not held by a player.", "Marcadores que não estão em jogo nem com um jogador."],
    ["Target", "Alvo", "An entity chosen by the player while performing an action; every \"target\" on a card refers to the same entity.", "Uma entidade escolhida pelo jogador ao realizar uma ação; todo \"alvo\" numa carta se refere à mesma entidade."],
    ["Visit", "Visitar", "The Visit a Villager action specifically. Ready, Raid, and Eliminate are not visits.", "Especificamente a ação Visitar um Aldeão. Preparar, Saquear e Eliminar não são visitas."]
  ];

  // --- Build your match -------------------------------------------------

  function matchModeChoices() {
    const options = [
      { value: "starter", title: t("Starter decks · Scenario", "Decks iniciais · Cenário"),
        detail: t(
          "Scenario \"Welcome to Roanoke\" with its fixed 30+30 card starter decks (printed in full below), the Caretakers villager set, and 2 rule tweaks: the Hunter's Exonerate costs only 1 Evidence and Eliminate ignores Clues on other villagers; the Witch may ritual with 2 Favors instead of 3. Recommended for a first game.",
          "Cenário \"Welcome to Roanoke\" com seus decks iniciais fixos de 30+30 cartas (listados por completo abaixo), o conjunto de aldeões Caretakers e 2 ajustes de regra: o Exonerar do Hunter custa só 1 Evidência e o Eliminar ignora Pistas nos outros aldeões; a Witch pode fazer o ritual com 2 Favores em vez de 3. Recomendado para a primeira partida."
        ) },
      { value: "custom", title: t("Custom decks · Standard game", "Decks personalizados · Jogo padrão"),
        detail: t(
          "Each player builds their own 50-card deck following the deckbuilding rules below. No scenario rule tweaks apply: Exonerate costs 3 Evidence, Eliminate requires Clues on every other villager, and the ritual needs 3 Favors. The Caretakers are still used as the Green faction, since no other green set ships in this core box.",
          "Cada jogador monta o próprio deck de 50 cartas seguindo as regras de deckbuilding abaixo. Nenhum ajuste de cenário se aplica: Exonerar custa 3 Evidências, Eliminar exige Pistas em todos os outros aldeões, e o ritual precisa de 3 Favores. Os Caretakers continuam sendo a facção Verde, pois esta caixa base não traz outro conjunto verde."
        ) }
    ];
    return options.map((option) => `
      <label class="sniper-choice-card${state.matchMode === option.value ? " selected" : ""}">
        <input type="radio" name="pagan-match-mode" value="${option.value}" data-match-mode ${state.matchMode === option.value ? "checked" : ""}>
        <span><strong>${option.title}</strong><small>${option.detail}</small></span>
      </label>`).join("");
  }

  function optionBlock(title, intro, control, pages) {
    return `
      <div class="optional-rule-group">
        <h4>${title}</h4>
        <p class="optional-rule-intro">${intro}</p>
        ${control}
        <div class="source-note">${pages.map((page) => referenceLink(page)).join(" ")}</div>
      </div>`;
  }

  function matchPanel() {
    return `
      <section class="controls-panel" aria-labelledby="pagan-match-title">
        <div class="panel-topline"><div><p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p><h2 id="pagan-match-title">${t("Build your match", "Configure a partida")}</h2><p>${t(
          "Pagan always pits one Witch against one Witch hunter, using the Red (The Stout) and Blue (Voluntary Recluses) villagers; that assignment is a table decision, not a setting here. The one real choice the booklet asks you to make before Setup is below.",
          "Pagan sempre opõe uma Witch a um Witch hunter, usando os aldeões Vermelho (The Stout) e Azul (Voluntary Recluses); essa atribuição é uma decisão da mesa, não uma opção aqui. A única escolha real que o livreto pede antes da Preparação está abaixo."
        )}</p></div><span class="saved-label">${storageAvailable ? t("Saved locally", "Salvo localmente") : t("Not saved", "Não salvo")}</span></div>
        ${optionBlock(
          t("Match mode", "Modo de partida"),
          t(
            "Choose between the booklet's recommended first scenario and a standard, deckbuilt game. This changes the Setup inventory, checklist, and two of the printed victory numbers.",
            "Escolha entre o cenário recomendado para a primeira partida e um jogo padrão com decks construídos. Isso muda o inventário e a checklist da Preparação, além de dois números impressos de vitória."
          ),
          `<div class="sniper-choice-grid">${matchModeChoices()}</div>`,
          [1, 25, 27]
        )}
        <p class="optional-mode-note">${t(
          "There is no Green-faction choice here: Caretakers is the only green villager set in this core box (The Stout is always red/Witch, Voluntary Recluses is always blue/Hunter). The \"Beyond the Palisades\" expansion and the three content packs mentioned on the manual's last pages are not covered by this guide.",
          "Não há escolha de facção Verde aqui: Caretakers é o único conjunto verde desta caixa base (The Stout é sempre vermelha/Witch, Voluntary Recluses é sempre azul/Hunter). A expansão \"Beyond the Palisades\" e os três pacotes de conteúdo citados nas últimas páginas do manual não são cobertos por este guia."
        )}</p>
      </section>`;
  }

  // --- Iconography ------------------------------------------------------

  function renderIcons() {
    const cardTypeItems = CARD_TYPES.map((c) => [c.icon, t(c.en, c.pt), t(c.en_d, c.pt_d)]);
    const tokenItems = TOKENS.map((c) => [c.icon, t(c.en, c.pt), t(c.en_d, c.pt_d)]);
    const sharedItems = SHARED_ICONS.map((c) => [c.icon, t(c.en, c.pt), t(c.en_d, c.pt_d)]);
    const pawnItems = PAWN_ICONS.map((c) => [c.icon, t(c.en, c.pt), t(c.en_d, c.pt_d)]);
    return `
      ${sectionHeading("iconography", t("Iconography", "Iconografia"), "01", 2)}
      <p class="glossary-intro">${t(
        "These marks are cropped from the official rulebook. Individual card effects that are not spelled out below are printed on those cards; this guide does not list them.",
        "Estas marcas foram recortadas do manual oficial. Efeitos individuais de carta que não estão escritos abaixo estão impressos nas próprias cartas; este guia não os lista."
      )}</p>
      <h3 class="subhead">${t("Card types", "Tipos de carta")}</h3>
      <div class="icon-grid">${cardTypeItems.map((item) => iconCard(...item)).join("")}</div>
      <h3 class="subhead">${t("Tokens", "Marcadores")}</h3>
      <div class="icon-grid">${tokenItems.map((item) => iconCard(...item)).join("")}</div>
      <h3 class="subhead">${t("Action pawns", "Peões de ação")}</h3>
      <div class="icon-grid">${pawnItems.map((item) => iconCard(...item)).join("")}</div>
      <h3 class="subhead">${t("Shared symbols", "Símbolos compartilhados")}</h3>
      <div class="icon-grid">${sharedItems.map((item) => iconCard(...item)).join("")}</div>
      <div class="source-note">${referenceLink(2)} ${referenceLink(8)} ${referenceLink(10)} ${referenceLink(12)}</div>`;
  }

  // --- Quick reference ----------------------------------------------------

  function jump(id, label) {
    return `<button type="button" data-scroll="${id}">${label}</button>`;
  }

  function quickReference() {
    const cards = [
      [t("Upkeep", "Upkeep"), t("Return all Action pawns. Resolve voluntary, then obligatory, Upkeep effects. The Hunter pays Upkeep for each Ally in play or discards it. Discard down to 7 cards.", "Devolva todos os peões de ação. Resolva efeitos voluntários e depois obrigatórios do Upkeep. O Hunter paga o Upkeep de cada Aliado em jogo ou o descarta. Descarte até 7 cartas."), "turns"],
      [t("Action phase", "Fase de Ação"), t("Place 1 Action pawn at a time on a ready villager or on your player board, carrying out its effect each time, until all pawns are placed.", "Coloque 1 peão de ação de cada vez em um aldeão pronto ou no seu tabuleiro, resolvendo o efeito a cada colocação, até usar todos os peões."), "turns"],
      [t("Visit (Hunter)", "Visitar (Hunter)"), t("Trigger Investigation → gain 1 Evidence if 3+ Clues already there → distribute Clues → use the villager's skill.", "Dispare a Investigação → ganhe 1 Evidência se já houver 3+ Pistas → distribua Pistas → use a habilidade do aldeão."), "cards"],
      [t("Visit (Witch)", "Visitar (Witch)"), t("Trigger Investigation → convert 3 Secrets to 1 Favor (up to 2×) → distribute Secrets → use the villager's skill (2× with 2+ Favors) → Familiar action if using that pawn.", "Dispare a Investigação → converta 3 Segredos em 1 Favor (até 2×) → distribua Segredos → use a habilidade do aldeão (2× com 2+ Favores) → ação de Familiar, se usar esse peão."), "cards"],
      [t("Hunter-only actions", "Ações exclusivas do Hunter"), t("Activate a ready Location · Raid a Villager (pay 3 like-colored Clues to strip 1 Favor or all Secrets) · Lift an Enchantment · Exonerate (pay 3, or 1 in the scenario, Evidence) · Eliminate a ready, 3-Clue villager with Clues on all others.", "Ativar uma Localização pronta · Saquear um Aldeão (pague 3 Pistas da mesma cor para remover 1 Favor ou todos os Segredos) · Remover um Encantamento · Exonerar (pague 3, ou 1 no cenário, Evidências) · Eliminar um aldeão pronto com 3 Pistas e Pistas em todos os outros."), "victory"],
      [t("Witch-only actions", "Ações exclusivas da Witch"), t("Consume a completed Brew (free action) · Perform the Ritual on the ready, true-witch villager with 3+ Favors (2+ in the scenario) to win.", "Consumir uma Poção completa (ação gratuita) · Realizar o Ritual no aldeão pronto que é a verdadeira bruxa, com 3+ Favores (2+ no cenário), para vencer."), "victory"],
      [t("Basic & common actions", "Ações básicas e comuns"), t("Either player: gain 2 Influence, draw 1 card, or play 1 card. Either player: Ready a Villager by paying 1 of your own Clues/Secrets on it to remove the opponent's pawn(s).", "Qualquer jogador: ganhe 2 de Influência, compre 1 carta ou jogue 1 carta. Qualquer jogador: Prepare um Aldeão pagando 1 de seus próprios Pistas/Segredos para remover o(s) peão(ões) do oponente."), "turns"]
    ];
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), "02", 6)}
      <div class="quick-grid">${cards.map(([title, body, target]) => `
        <article class="info-card"><h3>${title}</h3><p>${body}</p><p>${jump(target, t("Open the full rule", "Abrir a regra completa"))}</p></article>`).join("")}</div>
      <div class="callout">${t(
        "The Witch takes the first turn and, on that very first turn only, has 2 regular Action pawns (no Familiar pawn yet) and must visit villagers of their own faction.",
        "A Witch faz o primeiro turno e, só nesse primeiro turno, tem 2 peões de ação comuns (ainda sem o peão de Familiar) e deve visitar aldeões da própria facção."
      )}</div>`;
  }

  // --- Villagers ----------------------------------------------------------

  function villagerCard(v) {
    return `
      <article class="info-card villager-card villager-${v.color}">
        <span class="component-label">${t(v.factionPt === "The Stout" ? "RED · THE STOUT" : v.factionPt === "Voluntary Recluses" ? "BLUE · VOLUNTARY RECLUSES" : "GREEN · CARETAKERS",
          v.factionPt === "The Stout" ? "VERMELHA · THE STOUT" : v.factionPt === "Voluntary Recluses" ? "AZUL · VOLUNTARY RECLUSES" : "VERDE · CARETAKERS")}</span>
        <h3>${v.name}</h3>
        <p>${t(v.en, v.pt)}</p>
      </article>`;
  }

  function villagersSection() {
    return `
      ${sectionHeading("villagers", t("Villagers & Factions", "Aldeões e Facções"), "03", 9)}
      <p class="glossary-intro">${t(
        "9 villagers sit on the 3-part village board: 3 red, 3 blue, and 3 green. Each belongs to a named faction (used by scenarios) and has a fixed, fully-printed skill. The Witch secretly draws one matching Suspect card at setup: that villager is the true witch for the game.",
        "9 aldeões ficam no tabuleiro de 3 partes: 3 vermelhos, 3 azuis e 3 verdes. Cada um pertence a uma facção nomeada (usada pelos cenários) e tem uma habilidade fixa e totalmente impressa. A Witch compra em segredo, na preparação, a carta de Suspeito correspondente: esse aldeão é a verdadeira bruxa do jogo."
      )}</p>
      <div class="quick-grid">${VILLAGERS.map(villagerCard).join("")}</div>
      <p class="optional-mode-note">${t(
        "Each physical villager card also prints a target color and an asset value (how many Clues/Secrets you may distribute to villagers of that color when you visit it). That badge is small on the printed card and is not reliably legible from the digital manual at any resolution we could extract, so this guide does not restate specific numbers for it: check the card in front of you.",
        "Cada carta física de aldeão também traz uma cor-alvo e um valor de recurso (quantas Pistas/Segredos você pode distribuir a aldeões daquela cor ao visitá-lo). Esse selo é pequeno na carta impressa e não ficou legível de forma confiável no manual digital em nenhuma resolução que conseguimos extrair, então este guia não repete números específicos para ele: confira a carta à sua frente."
      )}</p>
      <div class="source-note">${referenceLink(9)} ${referenceLink(25)}</div>`;
  }

  // --- Cards ---------------------------------------------------------------

  function cardTypeCard(c) {
    return `
      <article class="icon-card card-type-card">
        <span class="manual-icon-frame" aria-hidden="true"><img class="manual-icon" src="${c.icon}" alt=""></span>
        <div>
          <strong>${t(c.en, c.pt)} <small>(${c.side === "hunter" ? t("Hunter", "Hunter") : t("Witch", "Witch")})</small></strong>
          <p>${t(c.en_d, c.pt_d)}</p>
          ${c.example_en ? `<p class="example-inline"><em>${t(c.example_en, c.example_pt)}</em></p>` : ""}
        </div>
      </article>`;
  }

  function cardsSection() {
    return `
      ${sectionHeading("cards", t("Cards", "Cartas"), "04", 8)}
      <p class="glossary-intro">${t(
        "Every card shows its type icon, name, Influence cost, effect text, version/expansion icon, and card number. A deck may never contain more than 2 copies of the same card. One-time cards (Charms, Events) are applied immediately and discarded; lasting cards (Allies, Locations, Brews, Familiars, Enchantments) occupy a board spot, and if none is free you must discard a card of that same type to make room.",
        "Toda carta mostra o ícone do tipo, nome, custo em Influência, texto de efeito, ícone de versão/expansão e número. Um deck nunca pode ter mais de 2 cópias da mesma carta. Cartas de efeito único (Encantos, Eventos) são aplicadas na hora e descartadas; cartas de efeito contínuo (Aliados, Localizações, Poções, Familiares, Encantamentos) ocupam um espaço do tabuleiro, e se não houver espaço livre você deve descartar uma carta do mesmo tipo para abrir espaço."
      )}</p>
      <div class="icon-grid">${CARD_TYPES.map(cardTypeCard).join("")}</div>
      <div class="source-note">${referenceLink(8)} ${referenceLink(10)} ${referenceLink(11)} ${referenceLink(12)} ${referenceLink(13)}</div>`;
  }

  // --- Setup ---------------------------------------------------------------

  function task(id, textEn, textPt, optional) {
    return { id, en: textEn, pt: textPt, optional: Boolean(optional) };
  }

  function setupPhases() {
    const starter = state.matchMode === "starter";
    const phases = [
      {
        title: t("The table", "A mesa"),
        refs: [4, 5],
        items: [
          task("roles", "Decide who plays the Witch and who plays the Witch hunter.", "Decidam quem joga de Witch e quem joga de Witch hunter."),
          task("boards", "Place the 3-part village board at the center of the table, and put the Enchantment board to one side of it.", "Coloque o tabuleiro de vilarejo (3 partes) no centro da mesa e o tabuleiro de Encantamentos ao lado dele."),
          task("player-boards", "Give the Witch their player board and the green Influence disc; give the Hunter their player board and the red Influence disc.", "Entregue à Witch seu tabuleiro e o disco verde de Influência; entregue ao Hunter seu tabuleiro e o disco vermelho de Influência."),
          task("pawns", "The Witch takes 3 Action pawns (2 regular + 1 Familiar); the Hunter takes 3 Action pawns.", "A Witch pega 3 peões de ação (2 comuns + 1 de Familiar); o Hunter pega 3 peões de ação."),
          task("supply", "Put the remaining tokens (Clues, Evidence, Secrets, Favors) in the general supply within reach of both players.", "Coloque os marcadores restantes (Pistas, Evidência, Segredos, Favores) na reserva geral, ao alcance dos dois jogadores.")
        ]
      },
      {
        title: t("Villagers and Suspects", "Aldeões e Suspeitos"),
        refs: [4, 6],
        items: [
          task("villagers", "Place the 9 villagers on the village board matching their printed symbol and color (3 red, 3 blue, 3 green).", "Coloque os 9 aldeões no tabuleiro de vilarejo conforme o símbolo e a cor impressos (3 vermelhos, 3 azuis, 3 verdes)."),
          task("suspect-deck", "Shuffle the 9 Suspect cards (matching the villagers) to form the Suspect deck.", "Embaralhe as 9 cartas de Suspeito (correspondentes aos aldeões) para formar o baralho de Suspeitos."),
          task("true-witch", "The Witch secretly draws the top Suspect card. This is the true witch for the game; keep it hidden from the Hunter.", "A Witch compra em segredo a carta do topo do baralho de Suspeitos. Esse é o verdadeiro bruxo do jogo; mantenha-a escondida do Hunter.", true)
        ]
      },
      {
        title: t("Decks and hands", "Decks e mãos"),
        refs: starter ? [27] : [26],
        items: starter
          ? [
            task("starter-decks", "Build the two 30-card starter decks exactly as listed below (the Hunter's and the Witch's), then shuffle each.", "Monte os dois decks iniciais de 30 cartas exatamente como listado abaixo (o do Hunter e o da Witch), depois embaralhe cada um."),
            task("draw-hands", "Each player draws 3 hand cards from their own deck and sets their Influence disc to 2.", "Cada jogador compra 3 cartas do próprio deck e ajusta o disco de Influência para 2.")
          ]
          : [
            task("custom-decks", "Each player builds a legal 50-card deck (max. 2 copies per card, at least 10 cards of each of their 4 card types) and shuffles it.", "Cada jogador monta um deck legal de 50 cartas (máx. 2 cópias por carta, ao menos 10 cartas de cada um dos 4 tipos do seu lado) e o embaralha."),
            task("draw-hands", "Each player draws 3 hand cards from their own deck and sets their Influence disc to 2.", "Cada jogador compra 3 cartas do próprio deck e ajusta o disco de Influência para 2.")
          ]
      },
      {
        title: t("Scenario", "Cenário"),
        refs: [1, 27],
        items: starter
          ? [
            task("scenario-set", `Use the "${SCENARIO.name}" scenario: villager set ${SCENARIO.villagerSet}, Hunter rule tweak (${t(SCENARIO.hunter_en, SCENARIO.hunter_pt)}), and Witch rule tweak (${t(SCENARIO.witch_en, SCENARIO.witch_pt)}).`, `Use o cenário "${SCENARIO.namePt}": conjunto de aldeões ${SCENARIO.villagerSet}, ajuste de regra do Hunter (${SCENARIO.hunter_pt}), e ajuste de regra da Witch (${SCENARIO.witch_pt}).`)
          ]
          : [
            task("green-faction", "No scenario is used. The Caretakers still serve as the Green faction, since this core box has no other green set to agree on.", "Nenhum cenário é usado. Os Caretakers continuam servindo de facção Verde, pois esta caixa base não traz outro conjunto verde para combinar.")
          ]
      },
      {
        title: t("Player aid", "Auxílio do jogador"),
        refs: [4],
        items: [
          task("player-aid", "If this is anyone's first game, place a player aid card next to each board.", "Se for a primeira partida de alguém, coloque uma carta de auxílio ao lado de cada tabuleiro.", true)
        ]
      }
    ];
    return phases;
  }

  function starterDeckTable(rows, side) {
    return `
      <table class="starter-deck-table">
        <caption>${side === "hunter" ? t("Hunter starter deck · 30 cards", "Deck inicial do Hunter · 30 cartas") : t("Witch starter deck · 30 cards", "Deck inicial da Witch · 30 cartas")}</caption>
        <thead><tr><th>${t("Name", "Nome")}</th><th>${t("Type", "Tipo")}</th><th>#</th><th>${t("Count", "Qtde")}</th></tr></thead>
        <tbody>${rows.map(([name, type, num, count]) => `<tr><td>${name}</td><td>${type}</td><td>${num}</td><td>${count}</td></tr>`).join("")}</tbody>
      </table>`;
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
          <div class="setup-phase-references">${phase.refs.map((page) => referenceLink(page)).join("")}</div>
        </header>
        <ul class="setup-check-list">${phase.items.map((item) => `
          <li class="setup-check-row${item.optional ? " optional" : ""}">
            <input id="setup-check-${item.id}" type="checkbox" data-setup-check="${item.id}" ${state.setupChecks.includes(item.id) ? "checked" : ""}>
            <label for="setup-check-${item.id}">${t(item.en, item.pt)}${item.optional ? `<span class="setup-optional-label">${t("Conditional", "Condicional")}</span>` : ""}</label>
          </li>`).join("")}</ul>
      </article>`).join("");
    const deckTables = state.matchMode === "starter"
      ? `<div class="quick-grid">${starterDeckTable(STARTER_HUNTER, "hunter")}${starterDeckTable(STARTER_WITCH, "witch")}</div>`
      : "";
    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), "05", 4)}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Set up this match", "Prepare esta partida")}</h3>
            <p>${t("Check each physical step as it is done. Progress is saved for this game only.", "Marque cada passo físico conforme for feito. O progresso fica salvo só neste jogo.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${required.length} required steps checked`, `${done} de ${required.length} etapas obrigatórias concluídas`)}</span>
            <progress id="setup-progress" max="${Math.max(required.length, 1)}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Changing the match mode clears this checklist. “Uncheck all” clears only these boxes. Changing language does not. The true-witch draw and the player aid card are conditional and do not count toward required progress.",
          "Mudar o modo de partida limpa esta lista. “Desmarcar tudo” limpa só estas caixas. Trocar o idioma não limpa. A compra do verdadeiro bruxo e a carta de auxílio são condicionais e não entram no progresso obrigatório."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}
      ${deckTables}`;
  }

  function inventoryCard(label, title, body, pages) {
    return `
      <article class="info-card">
        <span class="component-label">${label}</span>
        <h3>${title}</h3>
        <p>${body}</p>
        <div class="glossary-references">${pages.map((page) => referenceLink(page)).join(" ")}</div>
      </article>`;
  }

  function inventory() {
    const starter = state.matchMode === "starter";
    const cards = [
      inventoryCard(t("DECKS", "DECKS"), starter ? t("60 cards · starter decks", "60 cartas · decks iniciais") : t("100 cards · to build", "100 cartas · a montar"), starter
        ? t("30 Hunter cards + 30 Witch cards, exactly as listed below for the \"Welcome to Roanoke\" scenario.", "30 cartas do Hunter + 30 cartas da Witch, exatamente como listado abaixo para o cenário \"Welcome to Roanoke\".")
        : t("50 Hunter cards (Events, Allies, Locations, Investigations) + 50 Witch cards (Charms, Brews, Familiars, Enchantments). Build each deck following the deckbuilding rules in the Turns section below.", "50 cartas do Hunter (Eventos, Aliados, Localizações, Investigações) + 50 cartas da Witch (Encantos, Poções, Familiares, Encantamentos). Monte cada deck seguindo as regras de deckbuilding na seção Turnos abaixo."), starter ? [27] : [26]),
      inventoryCard(t("HUNTER", "HUNTER"), t("30 Clues · 9 Evidence · 3 pawns", "30 Pistas · 9 Evidência · 3 peões"), t(
        "Red small discs (Clues), red large tiles (Evidence), and 3 Action pawns. All tokens are limited to the box amount; if none are left in the supply when one would be gained, it is simply not placed.",
        "Discos pequenos vermelhos (Pistas), peças grandes vermelhas (Evidência) e 3 peões de ação. Todos os marcadores são limitados à quantidade da caixa; se não houver mais na reserva quando um seria ganho, ele simplesmente não é colocado."
      ), [4]),
      inventoryCard(t("WITCH", "WITCH"), t("30 Secrets · 20 Favors · 3 pawns", "30 Segredos · 20 Favores · 3 peões"), t(
        "Purple small discs (Secrets), purple large tiles (Favors), 2 regular Action pawns, and 1 Familiar Action pawn.",
        "Discos pequenos roxos (Segredos), peças grandes roxas (Favores), 2 peões de ação comuns e 1 peão de ação de Familiar."
      ), [4]),
      inventoryCard(t("INFLUENCE", "INFLUÊNCIA"), t("2 discs, set to 2 at start", "2 discos, ajustados para 2 no início"), t(
        "Green disc for the Witch, red disc for the Hunter, each tracking 0–20. Influence is not capped: add a marker beside the disc for every 21 beyond that. If it reaches 0, flip the disc until more is gained.",
        "Disco verde para a Witch, disco vermelho para o Hunter, cada um marcando de 0 a 20. Influência não tem teto: some um marcador ao lado do disco a cada 21 além disso. Se chegar a 0, vire o disco até ganhar mais."
      ), [4]),
      inventoryCard(t("VILLAGERS", "ALDEÕES"), t("9 villagers · 9 Suspects · 3 overview cards", "9 aldeões · 9 Suspeitos · 3 cartas de visão geral"), t(
        "3 red, 3 blue, 3 green villager cards on the village board, their matching Suspect deck, and 1 overview card per color.",
        "3 cartas de aldeão vermelhas, 3 azuis, 3 verdes no tabuleiro de vilarejo, o baralho de Suspeitos correspondente, e 1 carta de visão geral por cor."
      ), [4, 9]),
      inventoryCard(t("BOARDS", "TABULEIROS"), t("Village (3-part) · Enchantment · 2 player boards", "Vilarejo (3 partes) · Encantamentos · 2 tabuleiros de jogador"), t(
        "The village board holds the 9 villagers in order; the Enchantment board has 3 slots; each player board lists that side's actions and card spots.",
        "O tabuleiro de vilarejo guarda os 9 aldeões em ordem; o tabuleiro de Encantamentos tem 3 espaços; cada tabuleiro de jogador lista as ações e espaços de carta daquele lado."
      ), [4, 5])
    ];
    return `<div class="quick-grid">${cards.join("")}</div>`;
  }

  // --- Victory --------------------------------------------------------------

  function victorySection() {
    const starter = state.matchMode === "starter";
    const favorsNeeded = starter ? 2 : 3;
    const exonerateCost = starter ? 1 : 3;
    return `
      ${sectionHeading("victory", t("Victory", "Vitória"), "06", 24)}
      <div class="victory-grid">
        <article class="info-card"><h3>${t("Witch wins", "Witch vence")}</h3><p>${t(
          `Place an Action pawn on the ready villager who is the true witch and has at least ${favorsNeeded} Favors on it, then use the Perform Ritual action. The Witch also wins automatically if the Hunter eliminates a third innocent villager.`,
          `Coloque um peão de ação no aldeão pronto que é o verdadeiro bruxo e tem ao menos ${favorsNeeded} Favores, depois use a ação Realizar o Ritual. A Witch também vence automaticamente se o Hunter eliminar um terceiro aldeão inocente.`
        )}</p></article>
        <article class="info-card"><h3>${t("Hunter wins", "Hunter vence")}</h3><p>${t(
          `Eliminate the true witch (announced by the Witch at the moment of elimination), or Exonerate all 8 remaining Suspects (pay ${exonerateCost} Evidence per Exonerate action to draw a Suspect card).`,
          `Elimine o verdadeiro bruxo (anunciado pela Witch no momento da eliminação), ou Exonere os 8 Suspeitos restantes (pague ${exonerateCost} Evidência por ação de Exonerar para comprar uma carta de Suspeito).`
        )}</p></article>
        <article class="info-card"><h3>${t("Eliminating a villager", "Eliminar um aldeão")}</h3><p>${t(
          "When a villager is eliminated, the Witch must announce whether it was the true witch. If innocent, turn that villager face down, return all of its tokens and all Clues from every villager to the supply; it is out for the rest of the game.",
          "Quando um aldeão é eliminado, a Witch deve anunciar se era o verdadeiro bruxo. Se inocente, vire esse aldeão para baixo, devolva todos os marcadores dele e todas as Pistas de todos os aldeões à reserva; ele sai do jogo pelo resto da partida."
        )}</p></article>
      </div>
      ${state.matchMode === "starter" ? `<div class="callout">${t(
        `Scenario tweaks in effect: ${SCENARIO.hunter_en} ${SCENARIO.witch_en}`,
        `Ajustes do cenário em vigor: ${SCENARIO.hunter_pt} ${SCENARIO.witch_pt}`
      )}</div>` : ""}
      <div class="source-note">${referenceLink(7)} ${referenceLink(21)} ${referenceLink(23)} ${referenceLink(24)}</div>`;
  }

  // --- Turns -----------------------------------------------------------------

  function turnsSection() {
    return `
      ${sectionHeading("turns", t("Turns", "Turnos"), "07", 6)}
      <div class="turn-block"><h3>${t("Upkeep phase", "Fase de Upkeep")}</h3>
        <p>${t("1. Return your Action pawns to your supply.", "1. Devolva seus peões de ação à sua reserva.")}</p>
        <p>${t("2. Resolve any \"at the start of Upkeep\" effects on cards in play.", "2. Resolva efeitos \"no início do Upkeep\" de cartas em jogo.")}</p>
        <p>${t("3. Resolve obligatory \"during Upkeep\" effects, then any voluntary ones you want, in any order.", "3. Resolva efeitos obrigatórios \"durante o Upkeep\" e depois os voluntários que quiser, em qualquer ordem.")}</p>
        <p>${t("4. Hunter only: pay Influence equal to the total Upkeep of your Allies in play, discarding any you do not pay for.", "4. Só o Hunter: pague Influência igual ao Upkeep total dos seus Aliados em jogo, descartando os que não pagar.")}</p>
        <p>${t("5. Resolve any \"at the end of Upkeep\" effects.", "5. Resolva efeitos \"no fim do Upkeep\".")}</p>
        <p>${t("6. If you have more than 7 cards in hand, discard down to 7.", "6. Se tiver mais de 7 cartas na mão, descarte até ficar com 7.")}</p>
        ${referenceLink(6)}
      </div>
      <div class="turn-block"><h3>${t("Action phase", "Fase de Ação")}</h3>
        <p>${t("Take 3 Actions, one Action pawn at a time: place it on a ready villager (a villager action), or on your player board / a ready Location (a board action), then resolve its effect immediately before placing the next pawn.", "Faça 3 Ações, um peão de ação de cada vez: coloque-o num aldeão pronto (ação de aldeão), ou no seu tabuleiro / numa Localização pronta (ação de tabuleiro), e resolva o efeito imediatamente antes de colocar o próximo peão.")}</p>
        <p>${t("Exception: on the game's very first turn, the Witch has only 2 regular Action pawns (no Familiar pawn yet) and must use them to visit villagers of their own faction.", "Exceção: no primeiro turno do jogo, a Witch tem apenas 2 peões de ação comuns (ainda sem o peão de Familiar) e deve usá-los para visitar aldeões da própria facção.")}</p>
        ${referenceLink(7)}
      </div>
      <div class="turn-block"><h3>${t("Visiting a villager", "Visitando um aldeão")}</h3>
        <div class="action-grid">
          <article class="action-card"><strong>${t("Hunter", "Hunter")}</strong><p>${t("1) Trigger an Investigation on your side of that villager. 2) If it already has 3+ Clues, gain 1 Evidence (the Clues stay). 3) Distribute Clues equal to the visited villager's asset value, to villagers of the shown color. 4) Use the villager's skill.", "1) Dispare uma Investigação do seu lado desse aldeão. 2) Se ele já tiver 3+ Pistas, ganhe 1 Evidência (as Pistas continuam). 3) Distribua Pistas conforme o valor de recurso do aldeão visitado, para aldeões da cor indicada. 4) Use a habilidade do aldeão.")}</p></article>
          <article class="action-card"><strong>${t("Witch", "Witch")}</strong><p>${t("1) Trigger an Investigation on your side of that villager. 2) If it has 3+ Secrets, convert 3 into 1 Favor (up to 2 times). 3) Distribute Secrets to villagers of the shown color or to a Brew. 4) Use the villager's skill (twice if it has 2+ Favors). 5) If visiting with the Familiar pawn, use exactly one Familiar in play (optionally Empowered).", "1) Dispare uma Investigação do seu lado desse aldeão. 2) Se ele tiver 3+ Segredos, converta 3 em 1 Favor (até 2 vezes). 3) Distribua Segredos para aldeões da cor indicada ou para uma Poção. 4) Use a habilidade do aldeão (duas vezes se tiver 2+ Favores). 5) Se estiver visitando com o peão de Familiar, use exatamente um Familiar em jogo (opcionalmente Empoderado).")}</p></article>
        </div>
        ${referenceLink(16)} ${referenceLink(17)} ${referenceLink(18)} ${referenceLink(19)}
      </div>
      <div class="turn-block"><h3>${t("Deckbuilding (standard game)", "Deckbuilding (jogo padrão)")}</h3>
        <p>${t("Each deck has exactly 50 cards, with no more than 2 copies of any given card. A Hunter deck needs at least 10 each of Locations, Allies, Events, and Investigations, with the remaining 10 cards any mix of those 4 types. A Witch deck needs at least 10 each of Brews, Charms, Enchantments, and Familiars, with the remaining 10 cards any mix of those 4 types. This guide does not list the full card catalog beyond the printed starter decks: individual card texts live on the physical cards and in future expansions.", "Cada deck tem exatamente 50 cartas, com no máximo 2 cópias de qualquer carta. Um deck do Hunter precisa de ao menos 10 de cada: Localizações, Aliados, Eventos e Investigações, com as 10 cartas restantes em qualquer mistura desses 4 tipos. Um deck da Witch precisa de ao menos 10 de cada: Poções, Encantos, Encantamentos e Familiares, com as 10 cartas restantes em qualquer mistura desses 4 tipos. Este guia não lista o catálogo completo de cartas além dos decks iniciais impressos: os textos individuais das cartas estão nas cartas físicas e em expansões futuras.")}</p>
        ${referenceLink(26)}
      </div>`;
  }

  // --- Examples ----------------------------------------------------------------

  function examplesSection() {
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), "08", 22)}
      <div class="example-grid">
        <article class="example-card"><span class="card-number">01</span><h3>${t("Howard's Hunter turn", "O turno de Howard (Hunter)")}</h3>
          <p>${t(
            "Howard returns his 3 pawns, then pays 1 Influence Upkeep for his \"Clerk\" Ally. First pawn: he Readies \"Native Pamuy\" by paying 1 Clue already on her, removing Wilma's pawn. Second pawn: he visits her, gets a free Evidence from an Investigation, distributes 1 Clue, and uses her skill to play a card 1 Influence cheaper, playing \"Armory\" for free onto a Location spot. Third pawn: he Exonerates, paying 3 Evidence to draw the Suspect \"Stranger Sue\", learning her 2 Favors were a ruse.",
            "Howard devolve seus 3 peões e paga 1 de Influência de Upkeep pelo Aliado \"Clerk\". Primeiro peão: Prepara \"Native Pamuy\" pagando 1 Pista já nela, removendo o peão de Wilma. Segundo peão: visita-a, ganha 1 Evidência grátis por uma Investigação, distribui 1 Pista e usa a habilidade dela para jogar uma carta com 1 de Influência a menos, jogando \"Armory\" de graça numa Localização. Terceiro peão: Exonera, pagando 3 Evidências para comprar o Suspeito \"Stranger Sue\", descobrindo que os 2 Favores dela eram um blefe."
          )}</p>
          <div class="example-source"><span>${t("Worked example from the manual", "Exemplo do manual")}</span>${referenceLink(22)} ${referenceLink(23)}</div>
        </article>
        <article class="example-card"><span class="card-number">02</span><h3>${t("Wilma's Witch turn", "O turno de Wilma (Witch)")}</h3>
          <p>${t(
            "Wilma returns her pawns. First pawn: visiting \"Doctor Annie\", she puts 2 Secrets on her \"Surplus Elixir\" Brew instead of a villager, then draws a card from Annie's skill. She consumes the now-full Brew as a free action, adding 1 Secret to every villager. Second pawn: visiting \"Preacher Wulfric\", 3 Secrets there convert to 1 Favor, she pays 4 Influence (3 + 1 for a second Enchantment) to play \"Entranced\", and uses Wulfric's skill twice since he now has 2 Favors, playing her new Familiar \"Learn Secrets\". Third pawn (Familiar): visiting \"Nestling Mia\", she distributes a Secret, gains 3 Influence from the skill (Howard gains 1), then Empowers \"Learn Secrets\" by discarding a card for 3 Influence instead of 1.",
            "Wilma devolve os peões. Primeiro peão: visitando \"Doctor Annie\", coloca 2 Segredos na Poção \"Surplus Elixir\" em vez de num aldeão, e compra uma carta pela habilidade de Annie. Consome a Poção já cheia como ação gratuita, somando 1 Segredo a cada aldeão. Segundo peão: visitando \"Preacher Wulfric\", os 3 Segredos ali viram 1 Favor, ela paga 4 de Influência (3 + 1 pelo segundo Encantamento) para jogar \"Entranced\", e usa a habilidade de Wulfric duas vezes, pois ele agora tem 2 Favores, jogando o novo Familiar \"Learn Secrets\". Terceiro peão (Familiar): visitando \"Nestling Mia\", distribui um Segredo, ganha 3 de Influência pela habilidade (Howard ganha 1), e Empodera \"Learn Secrets\" descartando uma carta para ganhar 3 de Influência em vez de 1."
          )}</p>
          <div class="example-source"><span>${t("Same worked example", "Mesmo exemplo")}</span>${referenceLink(22)} ${referenceLink(23)}</div>
        </article>
      </div>
      <div class="source-note">${t(
        "The flavor letter to Mayor Biggs, the Kickstarter backer pages, and the \"Beyond the Palisades\" teaser are not extra rules. Effects printed only on a card stay on that card; this guide does not fill those gaps.",
        "A carta de abertura ao Mayor Biggs, as páginas de apoiadores do Kickstarter e o teaser de \"Beyond the Palisades\" não são regras extras. Efeitos impressos só numa carta permanecem nela; este guia não preenche essas lacunas."
      )}</div>`;
  }

  // --- Glossary ------------------------------------------------------------------

  function glossarySection() {
    const terms = GLOSSARY_TERMS.slice().sort((a, b) => a[state.language === "pt-BR" ? 1 : 0].localeCompare(b[state.language === "pt-BR" ? 1 : 0], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), "09", 28)}
      <p class="glossary-intro">${t(
        "Short meanings for the words used above.",
        "Significados curtos das palavras usadas acima."
      )}</p>
      <div class="quick-grid glossary-grid">${terms.map((item) => `
        <article class="info-card glossary-card"><span class="component-label">${t("TERM", "TERMO")}</span><h3>${t(item[0], item[1])}</h3><p>${t(item[2], item[3])}</p>
          <div class="glossary-references">${referenceLink(28)} ${referenceLink(29)}</div>
        </article>`).join("")}</div>`;
  }

  // --- Shell --------------------------------------------------------------------

  function renderHeader() {
    return `
      <header class="site-header">
        <a class="brand" href="#/" aria-label="${t("Field Manual home", "Página inicial do Manual de Campo")}">
          <span class="brand-mark" aria-hidden="true">PG</span>
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
    document.body.classList.add("theme-pagan");
    document.documentElement.lang = state.language;
    document.title = t("Pagan: The Fate of Roanoke — Field Manual", "Pagan: The Fate of Roanoke — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Interactive rules for Pagan: The Fate of Roanoke, the asymmetric Witch vs. Witch Hunter card game.",
        "Regras interativas de Pagan: The Fate of Roanoke, o jogo de cartas assimétrico Witch vs. Witch Hunter."
      );
    }
    const nav = [
      ["iconography", t("Iconography", "Iconografia")],
      ["quick-reference", t("Quick Ref", "Referência")],
      ["villagers", t("Villagers", "Aldeões")],
      ["cards", t("Cards", "Cartas")],
      ["setup", t("Setup", "Preparação")],
      ["victory", t("Victory", "Vitória")],
      ["turns", t("Turns", "Turnos")],
      ["examples", t("Examples", "Exemplos")],
      ["glossary", t("Glossary", "Glossário")]
    ];
    app.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook · base game", "Livro interativo · jogo base")}</p>
          <h1>Pagan: The Fate of Roanoke</h1>
          <p class="hero-intro">${t(
            "An asymmetric 2-player card duel: one Witch secretly performing a ritual of renaturation, one Witch hunter racing to expose them among 9 suspects. This guide follows the official rulebook and leaves individual card texts on the cards.",
            "Um duelo de cartas assimétrico para 2 jogadores: uma Witch realizando em segredo um ritual de renaturação, e um Witch hunter correndo para desmascará-la entre 9 suspeitos. Este guia segue o manual oficial e deixa os textos individuais das cartas nas próprias cartas."
          )}</p>
          <div class="hero-meta"><span>${t("2 players", "2 jogadores")}</span><span>${t("Asymmetric card game", "Jogo de cartas assimétrico")}</span><span>${t("Witch vs. Witch Hunter", "Witch vs. Witch Hunter")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/pagan-fate-of-roanoke.webp" alt="${t("Cover of the Pagan: The Fate of Roanoke rulebook", "Capa do manual de Pagan: The Fate of Roanoke")}" fetchpriority="high"><figcaption>${t("Rulebook cover", "Capa do manual")} · Wyrmgold</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("Field guide", "Guia de campo")}</h2>
          ${nav.map(([id, label], index) => `<button type="button" data-scroll="${id}"><span class="toc-index">${String(index + 1).padStart(2, "0")}</span>${label}</button>`).join("")}
        </aside>
        <div class="content-column">
          ${storageNotice ? `<p class="storage-notice" role="status">${storageNoticeText()}</p>` : ""}
          ${matchPanel()}
          <section class="rule-section">${renderIcons()}</section>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${villagersSection()}</section>
          <section class="rule-section">${cardsSection()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${victorySection()}</section>
          <section class="rule-section">${turnsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal guide for Pagan: The Fate of Roanoke. Summaries follow the official rulebook, whose PDF is included in this repository with permission. Effects the manual does not spell out stay on the physical cards.",
        "Guia pessoal de Pagan: The Fate of Roanoke. Os resumos seguem o manual oficial, cujo PDF está incluído neste repositório com autorização. Efeitos que o manual não detalha continuam nas cartas físicas."
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
      const phases = setupPhases();
      const tasks = phases.flatMap((phase) => phase.items);
      const required = tasks.filter((item) => !item.optional);
      const done = required.filter((item) => state.setupChecks.includes(item.id)).length;
      const progress = root.querySelector("#setup-progress");
      const label = root.querySelector("#setup-progress-label");
      if (progress) {
        progress.value = done;
      }
      if (label) {
        label.textContent = t(`${done} of ${required.length} required steps checked`, `${done} de ${required.length} etapas obrigatórias concluídas`);
      }
      return;
    }
    if (target instanceof HTMLInputElement && target.matches("[data-match-mode]")) {
      commit(() => {
        state.matchMode = target.value === "custom" ? "custom" : "starter";
      });
    }
  }

  function onInput() {
    // Pagan's match panel has no freeform text fields; nothing to do here.
  }

  window.Pagan = { renderInto, onClick, onChange, onInput };
})();
