(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.point-galaxy.v1";
  const SETUP_KEY = "field-manual.point-galaxy.setup.v1";
  const MANUAL_FILE = "point-galaxy_core.pdf";
  const ASSETS = "assets/point-galaxy/";
  const ICONS = `${ASSETS}icons/`;
  const ART = `${ASSETS}art/`;
  // The supplied rulebook (AEG / Flatout Games, 2025) is a 16-page scan without a text layer.
  // PDF page = printed page: 3 Overview & Components, 4–5 Setup, 6–8 Gameplay & card types,
  // 9 Rocket/Research symbols & Turn End, 10–11 Game End & Scoring, 12–14 Solo mode,
  // 15 Clarifications (Rocket Token scoring), 16 Quick Reference.
  // No expansions. Match options: player count (1 = solo against the AI opponent) and, solo only,
  // the AI difficulty. Only the player count changes the setup, so it alone is the setup signature.
  const PLAYERS = [1, 2, 3, 4, 5];
  const DIFFICULTIES = ["easy", "medium", "hard"];
  const DECK = { 1: [81, 59, 10], 2: [81, 59, 10], 3: [55, 85, 12], 4: [29, 111, 14], 5: [3, 137, 16] };
  const defaults = { language: "pt-BR", players: 2, difficulty: "medium" };
  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------

  function normalizePreferences(saved) {
    const players = Number(saved?.players);
    return {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      players: PLAYERS.includes(players) ? players : defaults.players,
      difficulty: DIFFICULTIES.includes(saved?.difficulty) ? saved.difficulty : defaults.difficulty
    };
  }

  function signature(source = state) {
    return `p${source.players}`;
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Point Galaxy preferences.", error);
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
      console.error("Could not read Point Galaxy setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Point Galaxy preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Point Galaxy setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function isSolo(players = state.players) {
    return players === 1;
  }

  function manualUrl(page) {
    const script = document.querySelector('script[src*="point-galaxy.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${MANUAL_FILE}`, baseUrl).href}#page=${page}`;
  }

  function referenceLink(page) {
    return `<a class="source-link" href="${manualUrl(page)}" target="_blank" rel="noreferrer">${t(`Rulebook p. ${page} ↗`, `Livro p. ${page} ↗`)}</a>`;
  }

  function sectionHeading(id, title, index, pages) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("STAR CHART", "MAPA ESTELAR")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="pg-section-references">${pages.map(referenceLink).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
  }

  function glyphLabel(name) {
    const rocketNames = {
      "rocket-01": ["Rocket Token 1 — pairs of one planet colour", "Ficha de Foguete 1 — pares de uma cor de planeta"],
      "rocket-02": ["Rocket Token 2 — big Solar Systems", "Ficha de Foguete 2 — Sistemas Solares grandes"],
      "rocket-03": ["Rocket Token 3 — Rocket Tokens", "Ficha de Foguete 3 — Fichas de Foguete"],
      "rocket-04": ["Rocket Token 4 — Asteroids", "Ficha de Foguete 4 — Asteroides"],
      "rocket-05": ["Rocket Token 5 — Wormholes", "Ficha de Foguete 5 — Buracos de Minhoca"],
      "rocket-06": ["Rocket Token 6 — sets of 3 Moons", "Ficha de Foguete 6 — trios de Luas"],
      "rocket-07": ["Rocket Token 7 — pairs of Research symbols", "Ficha de Foguete 7 — pares de símbolos de Pesquisa"],
      "rocket-08": ["Rocket Token 8 — one planet number", "Ficha de Foguete 8 — um número de planeta"],
      "rocket-09": ["Rocket Token 9 — all 5 planet colours", "Ficha de Foguete 9 — as 5 cores de planeta"],
      "rocket-10": ["Rocket Token 10 — trios of named colours", "Ficha de Foguete 10 — trios de cores indicadas"],
      "rocket-11": ["Rocket Token 11 — Suns", "Ficha de Foguete 11 — Sóis"],
      "rocket-12": ["Rocket Token 12 — 3 identical Research symbols", "Ficha de Foguete 12 — 3 símbolos de Pesquisa idênticos"]
    };
    if (rocketNames[name]) {
      return t(rocketNames[name][0], rocketNames[name][1]);
    }
    return {
      sun: t("Sun (scorepad row)", "Sol (linha do bloco)"),
      planet: t("Planet (scorepad row)", "Planeta (linha do bloco)"),
      moon: t("Moon (scorepad row)", "Lua (linha do bloco)"),
      research: t("Research (scorepad row)", "Pesquisa (linha do bloco)"),
      "rocket-token": t("Rocket Token (scorepad row)", "Ficha de Foguete (linha do bloco)"),
      asteroids: t("Asteroids (scorepad row)", "Asteroides (linha do bloco)"),
      "rocket-symbol": t("Rocket symbol", "Símbolo de foguete"),
      "research-symbol": t("Research symbol", "Símbolo de Pesquisa"),
      "first-player": t("Starting player symbol", "Símbolo de primeiro jogador"),
      "card-planet": t("Planet Card", "Carta de Planeta"),
      "card-planet-ring": t("Planet Card with a Research symbol", "Carta de Planeta com símbolo de Pesquisa"),
      "card-planet-x": t("Planet X Card", "Carta de Planeta X"),
      "card-sun": t("Sun Card", "Carta de Sol"),
      "card-starting-sun": t("Starting Sun Card (star marker)", "Carta de Sol Inicial (marca de estrela)"),
      "card-moon": t("Moon Card", "Carta de Lua"),
      "card-asteroids": t("Asteroids Card", "Carta de Asteroides"),
      "card-wormhole": t("Wormhole Card", "Carta de Buraco de Minhoca"),
      "card-player-aid": t("Player Aid Card", "Carta de Ajuda"),
      "token-back": t("Rocket Token, back", "Ficha de Foguete, verso"),
      "token-front": t("Rocket Token, front", "Ficha de Foguete, frente"),
      scorepad: t("Scorepad sheet", "Folha do bloco de pontuação")
    }[name] || name;
  }

  function glyph(name) {
    const label = glyphLabel(name);
    return `<img class="pg-glyph" src="${ICONS}${name}.webp" alt="${label}" title="${label}">`;
  }

  function iconCard(file, bodyEn, bodyPt, pages, extraClass = "") {
    const title = glyphLabel(file);
    const list = Array.isArray(pages) ? pages : [pages];
    return `
      <article class="icon-card ${extraClass}">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}.webp" alt="${title}"></span>
        <div><strong>${title}</strong><p>${t(bodyEn, bodyPt)}</p>${list.map(referenceLink).join(" ")}</div>
      </article>`;
  }

  function infoCard(label, title, lines, page, extraClass = "") {
    const pages = Array.isArray(page) ? page : [page];
    return `
      <article class="info-card ${extraClass}">
        <span class="component-label">${label}</span>
        <h3>${title}</h3>
        ${lineList(lines)}
        ${pages.map(referenceLink).join(" ")}
      </article>`;
  }

  function figure(file, alt) {
    return `<figure class="pg-art"><img src="${ART}${file}.webp" alt="${alt}" loading="lazy"><figcaption>${alt}</figcaption></figure>`;
  }

  function interpretation(en, pt) {
    return `<span class="pg-interpretation">${t("Guide's reading", "Leitura do guia")}</span> ${t(en, pt)}`;
  }

  function playersLabel(players = state.players) {
    return isSolo(players) ? t("1 · Solo vs AI", "1 · Solo contra IA") : t(`${players} players`, `${players} jogadores`);
  }

  function difficultyName(value = state.difficulty) {
    return {
      easy: t("Easy (E)", "Fácil (E)"),
      medium: t("Medium (M)", "Médio (M)"),
      hard: t("Hard (H)", "Difícil (H)")
    }[value];
  }

  function difficultyValues(value = state.difficulty) {
    return { easy: [1, 0, 2], medium: [3, 1, 3], hard: [4, 3, 4] }[value];
  }

  // ---------- header ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["victory", t("End & scoring", "Fim e pontuação")],
      ["turns", t("Your turn", "Seu turno")],
      ["cards", t("Placing cards", "Colocar cartas")],
      ["rockets", t("Rockets & research", "Foguetes e pesquisa")],
      isSolo() ? ["solo", t("AI opponent", "Oponente IA")] : null,
      ["icons", t("Iconography", "Iconografia")],
      ["examples", t("Examples", "Exemplos")],
      ["faq", t("Guide's readings", "Leituras do guia")],
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

  function storageNoticeText() {
    const readFailed = storageIssues.has("preferences-read") || storageIssues.has("setup-read");
    const writeFailed = storageIssues.has("preferences-write") || storageIssues.has("setup-write");
    return t(
      `${readFailed ? "This browser could not read the saved options or setup progress for this game; defaults are shown. " : ""}${writeFailed ? "The latest change could not be saved and is visible on screen only." : ""}`,
      `${readFailed ? "Este navegador não conseguiu ler as opções ou o progresso da preparação salvos deste jogo; as opções padrão estão sendo mostradas. " : ""}${writeFailed ? "A alteração mais recente não pôde ser salva e aparece somente na tela." : ""}`
    ).trim();
  }

  // ---------- configuration ----------

  function choiceCard(name, value, dataAttr, checked, title, description) {
    return `
      <label class="pg-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" ${dataAttr} ${checked ? "checked" : ""}>
        <span class="pg-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function playerChoiceText(players) {
    const [remove, use, tokens] = DECK[players];
    if (isSolo(players)) {
      return t(
        `You against an automatic AI opponent. Set up as for 2 players (remove ${remove} cards, use ${use}; ${tokens} Rocket Tokens), but the Rocket Tokens are laid in a left-to-right line and one extra face-down Rocket Token marks which 2 cards the AI drafts each turn. You go first. Pick the AI difficulty below; it changes only how the AI scores.`,
        `Você contra um oponente automático (IA). Prepare como para 2 jogadores (remova ${remove} cartas, use ${use}; ${tokens} Fichas de Foguete), mas as Fichas de Foguete ficam numa fila da esquerda para a direita e uma Ficha de Foguete extra, virada para baixo, marca quais 2 cartas a IA pega a cada turno. Você começa. Escolha a dificuldade da IA abaixo; ela muda só a pontuação da IA.`
      );
    }
    return t(
      `Remove ${remove} Planet/Space cards, play with ${use}. ${tokens} Rocket Tokens in the supply. 13 turns each; the first player is the one whose Player Aid shows the starting player symbol.`,
      `Remova ${remove} cartas de Planeta/Espaço, jogue com ${use}. ${tokens} Fichas de Foguete na reserva. 13 turnos para cada um; começa quem tiver a Carta de Ajuda com o símbolo de primeiro jogador.`
    );
  }

  function difficultyText(value) {
    const [sun, dup, rocket] = difficultyValues(value);
    const research = {
      easy: t("unique Research symbols only", "só símbolos de Pesquisa únicos"),
      medium: t("unique Research symbols + 1 per duplicate", "símbolos de Pesquisa únicos + 1 por duplicata"),
      hard: t("unique Research symbols + 3 per duplicate", "símbolos de Pesquisa únicos + 3 por duplicata")
    }[value];
    return t(
      `AI scores ${sun} per Sun Card, ${rocket} per Rocket Token, and ${research}. Planets, Moons and Asteroids score the same at every level.`,
      `A IA marca ${sun} por Carta de Sol, ${rocket} por Ficha de Foguete e ${research}. Planetas, Luas e Asteroides pontuam igual em qualquer nível.`
    );
  }

  function matchConfiguration() {
    return `
      <section class="controls-panel pg-config" id="build-match" aria-labelledby="pg-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="pg-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "The supplied rulebook has no expansions or optional rules. The number of players changes how many cards and Rocket Tokens are used; with 1 player you play the solo mode against an AI opponent, which adds a difficulty level. Changing the number of players clears the setup checklist; the difficulty and the language do not.",
              "O livro de regras fornecido não tem expansões nem regras opcionais. O número de jogadores muda quantas cartas e Fichas de Foguete são usadas; com 1 jogador você joga o modo solo contra um oponente IA, que acrescenta um nível de dificuldade. Mudar o número de jogadores limpa a lista da preparação; a dificuldade e o idioma não."
            )}</p>
          </div>
        </div>
        <fieldset class="pg-choice-group">
          <legend>${t("Players · selected:", "Jogadores · selecionado:")} <span>${playersLabel()}</span></legend>
          <p class="pg-choice-intro">${t("Box: 1 to 5 players.", "Caixa: de 1 a 5 jogadores.")} ${referenceLink(4)} ${referenceLink(12)}</p>
          <div class="pg-choice-grid pg-choice-grid-players">
            ${PLAYERS.map((players) => choiceCard("pg-players", players, `data-players="${players}"`, state.players === players, playersLabel(players), playerChoiceText(players))).join("")}
          </div>
        </fieldset>
        ${isSolo() ? `
        <fieldset class="pg-choice-group">
          <legend>${t("AI difficulty · selected:", "Dificuldade da IA · selecionado:")} <span>${difficultyName()}</span></legend>
          <p class="pg-choice-intro">${t("Solo only. The AI drafts and builds the same way at every level; only its final score changes.", "Só no solo. A IA pega e monta cartas do mesmo jeito em qualquer nível; só a pontuação final dela muda.")} ${referenceLink(13)} ${referenceLink(14)}</p>
          <div class="pg-choice-grid pg-choice-grid-players">
            ${DIFFICULTIES.map((value) => choiceCard("pg-difficulty", value, `data-difficulty="${value}"`, state.difficulty === value, difficultyName(value), difficultyText(value))).join("")}
          </div>
        </fieldset>` : ""}
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function setupPhases() {
    const solo = isSolo();
    const [remove, use, tokens] = DECK[state.players];
    const phases = [
      {
        id: "deck",
        title: t("Planet/Space deck for this player count", "Baralho de Planeta/Espaço para este número de jogadores"),
        pages: [4],
        items: [
          t("Take all 140 double-sided Planet/Space cards. Each card has a Planet side (blue background, a planet with a number — the card “front”) and a Space side (black background: a Sun, Moon, Asteroids or Wormhole — the card “back”).", "Pegue as 140 cartas dupla-face de Planeta/Espaço. Cada carta tem um lado Planeta (fundo azul, um planeta com número — a “frente” da carta) e um lado Espaço (fundo preto: Sol, Lua, Asteroides ou Buraco de Minhoca — o “verso” da carta)."),
          t("Shuffle them thoroughly, always keeping the Planet side down and the Space side up.", "Embaralhe-as bem, sempre com o lado Planeta para baixo e o lado Espaço para cima."),
          t(`${solo ? "Solo uses the 2-player count: r" : "R"}emove ${remove} cards without looking and return them to the box — they are not used this game. You play with ${use} cards.`, `${solo ? "O solo usa a contagem de 2 jogadores: r" : "R"}emova ${remove} cartas sem olhar e devolva-as à caixa — não são usadas nesta partida. Você joga com ${use} cartas.`)
        ]
      },
      {
        id: "market",
        title: t("Draw piles and the 9-card market", "Pilhas de compra e o mercado de 9 cartas"),
        pages: [4, 5],
        items: [
          t("Split the remaining cards into three roughly equal draw piles, Planet side down (Space side up), in a row in the centre of the table within everyone's reach.", "Divida as cartas restantes em três pilhas de compra mais ou menos iguais, lado Planeta para baixo (lado Espaço para cima), em fila no centro da mesa, ao alcance de todos."),
          t("From each pile, flip over 2 cards to their Planet side and place them in a column below that pile.", "De cada pilha, vire 2 cartas para o lado Planeta e coloque-as numa coluna abaixo dessa pilha."),
          t("This is the market: 9 cards — the 3 Space cards showing on top of the piles (top row) and the 6 face-up Planet cards below them (two rows).", "Este é o mercado: 9 cartas — as 3 cartas de Espaço visíveis no topo das pilhas (fileira de cima) e as 6 cartas de Planeta viradas para cima abaixo delas (duas fileiras).")
        ],
        art: ["setup-example", t("Rulebook p. 5: 3-player setup example — draw piles with 2 Planet cards flipped below each, Rocket Tokens, Starting Suns and Player Aids", "Livro p. 5: exemplo de preparação para 3 jogadores — pilhas de compra com 2 cartas de Planeta viradas abaixo de cada uma, Fichas de Foguete, Sóis Iniciais e Cartas de Ajuda")]
      },
      {
        id: "rockets",
        title: t("Rocket Token supply", "Reserva de Fichas de Foguete"),
        pages: solo ? [4, 12] : [4],
        items: [
          t(`Flip all 24 Rocket Tokens face down ${glyph("token-back")} and shuffle them.`, `Vire as 24 Fichas de Foguete para baixo ${glyph("token-back")} e misture-as.`),
          t(`Take ${tokens} of them at random and flip them face up ${glyph("token-front")}.`, `Pegue ${tokens} delas ao acaso e vire-as para cima ${glyph("token-front")}.`),
          solo
            ? t("Solo: lay these 10 face-up tokens in a single line next to the market, forming an order from left to right (the AI always takes the leftmost one still available).", "Solo: coloque essas 10 fichas viradas para cima numa única fila junto ao mercado, formando uma ordem da esquerda para a direita (a IA sempre pega a mais à esquerda ainda disponível).")
            : t("Arrange them face up as a supply next to the market, where every player can easily read them.", "Arrume-as viradas para cima como reserva junto ao mercado, onde todos possam lê-las facilmente."),
          solo
            ? t("Solo: place one of the leftover tokens face down to the left of the leftmost draw pile (beside the top row), its tip pointing inward toward the market. This is the AI drafting marker (position 1 of the solo diagram).", "Solo: coloque uma das fichas que sobraram virada para baixo à esquerda da pilha de compra mais à esquerda (ao lado da fileira de cima), com a ponta apontando para dentro do mercado. Este é o marcador de compra da IA (posição 1 do diagrama solo).")
            : null,
          interpretation("the other leftover tokens go back to the box unseen.", "as demais fichas que sobraram voltam para a caixa sem serem vistas.")
        ],
        art: solo ? ["solo-diagram", t("Rulebook p. 12: solo setup — the AI drafting marker starts at position 1 and moves clockwise around the market through positions 2–13", "Livro p. 12: preparação solo — o marcador de compra da IA começa na posição 1 e anda em sentido horário em volta do mercado pelas posições 2–13")] : null
      },
      {
        id: "suns",
        title: t("Starting Suns", "Sóis Iniciais"),
        pages: solo ? [4, 12] : [4],
        items: [
          t(`Shuffle the 5 Starting Sun Cards ${glyph("card-starting-sun")} (marked with a star).`, `Embaralhe as 5 Cartas de Sol Inicial ${glyph("card-starting-sun")} (marcadas com uma estrela).`),
          solo
            ? t("Deal one at random to yourself and one to the AI opponent. Each Sun goes in front of its owner as their first Solar System; leave room next to the market for the AI's cards.", "Distribua uma ao acaso para você e uma para o oponente IA. Cada Sol fica na frente do dono como o seu primeiro Sistema Solar; deixe espaço junto ao mercado para as cartas da IA.")
            : t("Deal one at random to each player. Each player places it in front of them: this is their first Solar System.", "Distribua uma ao acaso para cada jogador. Cada jogador a coloca à sua frente: é o seu primeiro Sistema Solar."),
          t("Return the unused Starting Suns to the box.", "Devolva os Sóis Iniciais não usados à caixa.")
        ]
      },
      {
        id: "start",
        title: solo ? t("Player Aid and first turn", "Carta de Ajuda e primeiro turno") : t("Player Aids and first player", "Cartas de Ajuda e primeiro jogador"),
        pages: solo ? [4, 12] : [4],
        items: solo
          ? [
              t(`Take one Player Aid Card ${glyph("card-player-aid")} for yourself; return the rest to the box.`, `Pegue uma Carta de Ajuda ${glyph("card-player-aid")} para você; devolva as outras à caixa.`),
              t("You take the first turn of the game; the AI plays after each of your turns.", "Você faz o primeiro turno da partida; a IA joga depois de cada turno seu."),
              t("You are ready to play.", "Você está pronto para jogar.")
            ]
          : [
              t(`Take ${state.players} Player Aid Cards ${glyph("card-player-aid")}, making sure one of them is the card with the starting player symbol ${glyph("first-player")}. Return the other aids to the box.`, `Pegue ${state.players} Cartas de Ajuda ${glyph("card-player-aid")}, garantindo que uma delas seja a carta com o símbolo de primeiro jogador ${glyph("first-player")}. Devolva as outras à caixa.`),
              t("Each player takes one of these aids at random and turns it over.", "Cada jogador pega uma dessas cartas ao acaso e a vira."),
              t(`The player whose aid shows the starting player symbol ${glyph("first-player")} is the first player. Play goes clockwise.`, `O jogador cuja carta mostra o símbolo de primeiro jogador ${glyph("first-player")} é o primeiro jogador. O jogo segue em sentido horário.`),
              t("You are ready to play.", "Vocês estão prontos para jogar.")
            ]
      }
    ];
    return phases;
  }

  function inventory() {
    const solo = isSolo();
    const [remove, use, tokens] = DECK[state.players];
    const cards = [
      infoCard(t("CENTRE", "CENTRO"), t("Market and supply", "Mercado e reserva"), [
        rl("Planet/Space cards", `${use} in play (3 draw piles + 6 face-up Planets); ${remove} back in the box.`, "Cartas de Planeta/Espaço", `${use} em jogo (3 pilhas de compra + 6 Planetas virados para cima); ${remove} de volta na caixa.`),
        rl("Rocket Tokens", `${tokens} face up${solo ? ", in a left-to-right line" : ""}.`, "Fichas de Foguete", `${tokens} viradas para cima${solo ? ", numa fila da esquerda para a direita" : ""}.`),
        solo ? rl("AI marker", "1 more Rocket Token, face down, beside the market at position 1.", "Marcador da IA", "mais 1 Ficha de Foguete, virada para baixo, junto ao mercado na posição 1.") : null
      ], [4]),
      infoCard(solo ? t("YOU AND THE AI", "VOCÊ E A IA") : t(`PER PLAYER · ×${state.players}`, `POR JOGADOR · ×${state.players}`), t("Your Galaxy", "Sua Galáxia"), [
        rl("Starting Sun", solo ? "1 for you, 1 for the AI." : "1 each — your first Solar System.", "Sol Inicial", solo ? "1 para você, 1 para a IA." : "1 cada — o seu primeiro Sistema Solar."),
        rl("Player Aid", solo ? "1 for you." : "1 each (one shows the starting player symbol).", "Carta de Ajuda", solo ? "1 para você." : "1 cada (uma mostra o símbolo de primeiro jogador).")
      ], [4]),
      infoCard(t("SHARED", "COMPARTILHADO"), t("At the end", "No fim"), [
        rl("Scorepad", "1 sheet: Suns, Planets, Moons, Research, Rocket Tokens, Asteroids, total.", "Bloco de pontuação", "1 folha: Sóis, Planetas, Luas, Pesquisa, Fichas de Foguete, Asteroides, total.")
      ], [3, 10]),
      infoCard(t("IN THE BOX", "NA CAIXA"), t("Full component list", "Lista completa de componentes"), [
        t("140 double-sided Planet/Space cards", "140 cartas dupla-face de Planeta/Espaço"),
        t("5 double-sided Starting Sun cards", "5 cartas dupla-face de Sol Inicial"),
        t("5 double-sided Player Aid cards", "5 cartas dupla-face de Ajuda"),
        t("24 unique Rocket Tokens", "24 Fichas de Foguete diferentes"),
        t("1 scorepad, 1 rulebook", "1 bloco de pontuação, 1 livro de regras")
      ], [3])
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
          <div class="setup-phase-references">${phase.pages.map(referenceLink).join("")}</div>
        </header>
        <label class="pg-setup-check" for="pg-setup-${phase.id}">
          <input id="pg-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="pg-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="pg-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
        ${phase.art ? `<div class="pg-art-row">${figure(phase.art[0], phase.art[1])}</div>` : ""}
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), sectionIndex("setup"), isSolo() ? [4, 5, 12] : [4, 5])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Prepare the galaxy", "Prepare a galáxia")} · ${playersLabel()}</h3>
            <p>${t("One checkbox per coherent step; the rulebook's 7 numbered setup steps are grouped into 5.", "Uma caixa por etapa coerente; os 7 passos numerados da preparação no livro estão agrupados em 5.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved separately from the match options. Changing the number of players clears it; changing the language or the AI difficulty does not. “Uncheck all” clears only these setup boxes.",
          "O progresso é salvo separadamente das opções da partida. Mudar o número de jogadores o limpa; mudar o idioma ou a dificuldade da IA não. “Desmarcar tudo” limpa somente estas caixas da preparação."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}`;
  }

  // ---------- quick reference ----------

  function quickReference() {
    const solo = isSolo();
    const cards = [
      infoCard(t("YOUR TURN", "SEU TURNO"), t("4 steps", "4 passos"), [
        rl("1 · Draft", "take ANY 2 cards from the market, one at a time.", "1 · Pegar", "pegue QUAISQUER 2 cartas do mercado, uma de cada vez."),
        rl("2 · Place", "put both into Solar Systems of your Galaxy, in either order.", "2 · Colocar", "ponha as duas em Sistemas Solares da sua Galáxia, em qualquer ordem."),
        rl("3 · Check Rockets", `reached a new multiple of 5 ${glyph("rocket-symbol")}? take a Rocket Token.`, "3 · Conferir foguetes", `chegou a um novo múltiplo de 5 ${glyph("rocket-symbol")}? pegue uma Ficha de Foguete.`),
        rl("4 · Refill", "flip cards from each pile into its empty Planet slots.", "4 · Repor", "vire cartas de cada pilha para as casas de Planeta vazias abaixo dela."),
        solo ? rl("Then", "the AI takes its turn (see AI opponent).", "Depois", "a IA faz o turno dela (veja Oponente IA).") : rl("Then", "next player clockwise.", "Depois", "próximo jogador em sentido horário.")
      ], [6, 9, 16]),
      infoCard(t("THE MARKET", "O MERCADO"), t("Planet or Space side", "Lado Planeta ou Espaço"), [
        rl("Top row", "the Space card on top of each pile (Sun, Moon, Asteroids, Wormhole).", "Fileira de cima", "a carta de Espaço no topo de cada pilha (Sol, Lua, Asteroides, Buraco de Minhoca)."),
        rl("Bottom 6", "face-up Planet cards.", "6 de baixo", "cartas de Planeta viradas para cima."),
        rl("Take a pile top", "the next Space card is revealed; you may draft it as your 2nd card.", "Pegou um topo", "a próxima carta de Espaço aparece; você pode pegá-la como 2ª carta."),
        rl("No refill", "empty Planet slots are refilled only at the end of the turn.", "Sem repor", "casas de Planeta vazias só são repostas no fim do turno.")
      ], [4, 6]),
      infoCard(t("PLACEMENT", "COLOCAÇÃO"), t("Where each card goes", "Onde cada carta vai"), [
        rl("Planet / Moon / Wormhole", "above (tucked behind) or below (on top of) a Solar System's card sequence, or start a new Solar System.", "Planeta / Lua / Buraco de Minhoca", "acima (por trás) ou abaixo (por cima) da sequência de cartas de um Sistema Solar, ou comece um novo Sistema Solar."),
        rl("Planet numbers", "after the 2nd Planet the direction is fixed: always higher on one end, lower on the other; gaps allowed.", "Números dos planetas", "depois do 2º Planeta a direção fica fixa: sempre maior numa ponta, menor na outra; lacunas permitidas."),
        rl("Sun", "on top of a Solar System with no Sun, or start a new one. Max 1 per system.", "Sol", "no topo de um Sistema Solar sem Sol, ou comece um novo. Máx. 1 por sistema."),
        rl("Asteroids", "tucked behind a Sun, max 1 per Sun. No free Sun → you may not draft it.", "Asteroides", "atrás de um Sol, máx. 1 por Sol. Sem Sol livre → você não pode pegá-la."),
        rl("Wormhole", "resets the number sequence beyond it.", "Buraco de Minhoca", "reinicia a sequência de números além dele.")
      ], [6, 7, 8]),
      infoCard(t("ROCKETS", "FOGUETES"), t("Every 5 rocket symbols", "A cada 5 símbolos de foguete"), [
        rl("Count", `all ${glyph("rocket-symbol")} in your whole Galaxy, at the end of your turn.`, "Contar", `todos os ${glyph("rocket-symbol")} da sua Galáxia inteira, no fim do turno.`),
        rl("5, 10, 15…", `each new multiple reached → choose 1 available Rocket Token ${glyph("token-front")}.`, "5, 10, 15…", `cada novo múltiplo alcançado → escolha 1 Ficha de Foguete ${glyph("token-front")} disponível.`),
        rl("Tokens", "score their printed bonus at the end (see Rockets & research).", "Fichas", "pontuam o bônus impresso no fim (veja Foguetes e pesquisa).")
      ], [9, 15]),
      infoCard(t("GAME END", "FIM"), t("After everyone's 13th turn", "Depois do 13º turno de todos"), [
        rl("End", "after the last player's 13th turn only 7 cards remain in the market; discard them.", "Fim", "depois do 13º turno do último jogador restam só 7 cartas no mercado; descarte-as."),
        rl("Suns", `${glyph("sun")} each Sun's condition, scored once per complete set in its own system.`, "Sóis", `${glyph("sun")} a condição de cada Sol, pontuada uma vez por conjunto completo no próprio sistema.`),
        rl("Planets", `${glyph("planet")} per Solar System, unique numbers: 1/2/3/5/7/9/12 pts.`, "Planetas", `${glyph("planet")} por Sistema Solar, números únicos: 1/2/3/5/7/9/12 pts.`),
        rl("Moons", `${glyph("moon")} printed points if next to the required colour(s).`, "Luas", `${glyph("moon")} pontos impressos se ao lado da(s) cor(es) exigida(s).`),
        rl("Research", `${glyph("research")} unique symbols in the Galaxy: 1/2/3/5/7/9/12 pts.`, "Pesquisa", `${glyph("research")} símbolos únicos na Galáxia: 1/2/3/5/7/9/12 pts.`),
        rl("Rocket Tokens", `${glyph("rocket-token")} their bonuses.`, "Fichas de Foguete", `${glyph("rocket-token")} os seus bônus.`),
        rl("Asteroids", `${glyph("asteroids")} most 10, 2nd 6, 3rd 2.`, "Asteroides", `${glyph("asteroids")} mais 10, 2º 6, 3º 2.`),
        rl("Tie", "most rocket symbols; then shared victory.", "Empate", "mais símbolos de foguete; depois vitória compartilhada.")
      ], [10, 11], "victory-card")
    ];
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), sectionIndex("quick-reference"), [16])}
      <div class="callout">${t(
        `Each turn draft 2 cards from the market and add them to the Solar Systems (columns) of your Galaxy. Planets must follow a number sequence; Suns, Moons, Asteroids and Wormholes score or help in their own ways. Collect rocket symbols to earn Rocket Tokens. After 13 turns each, the biggest galaxy score wins.${solo ? " Solo: an automatic AI opponent drafts 2 cards after each of your turns." : ""}`,
        `A cada turno pegue 2 cartas do mercado e acrescente-as aos Sistemas Solares (colunas) da sua Galáxia. Planetas precisam seguir uma sequência numérica; Sóis, Luas, Asteroides e Buracos de Minhoca pontuam ou ajudam do seu jeito. Junte símbolos de foguete para ganhar Fichas de Foguete. Depois de 13 turnos de cada um, vence a galáxia com mais pontos.${solo ? " Solo: um oponente IA automático pega 2 cartas depois de cada turno seu." : ""}`
      )} ${referenceLink(3)}</div>
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- victory ----------

  function scoreTable(kindEn, kindPt) {
    const pts = [1, 2, 3, 5, 7, 9, 12];
    return `
      <table class="pg-score-table">
        <caption>${t(kindEn, kindPt)}</caption>
        <tr><th scope="row">${t("Count", "Quantidade")}</th>${pts.map((_, i) => `<td>${i + 1}</td>`).join("")}</tr>
        <tr><th scope="row">${t("Points", "Pontos")}</th>${pts.map((p) => `<td><strong>${p}</strong></td>`).join("")}</tr>
      </table>`;
  }

  function victorySection() {
    return `
      ${sectionHeading("victory", t("Game end & scoring", "Fim do jogo e pontuação"), sectionIndex("victory"), [10, 11])}
      <div class="quick-grid">
        ${infoCard(t("GAME END", "FIM DE JOGO"), t("13 turns each", "13 turnos para cada um"), [
          t(`The game ends after the final player has taken their 13th turn${isSolo() ? " (solo: after you and the AI have each taken 13 turns)" : ""}.`, `A partida termina depois que o último jogador faz o seu 13º turno${isSolo() ? " (solo: depois que você e a IA fizeram 13 turnos cada)" : ""}.`),
          t("At that point the market holds only 7 cards and cannot be refilled. Discard those 7 cards and go to scoring.", "Nesse momento o mercado tem só 7 cartas e não pode ser reposto. Descarte essas 7 cartas e passe à pontuação."),
          t("Write each category on the scorepad, one column per player.", "Anote cada categoria no bloco de pontuação, uma coluna por jogador.")
        ], [10])}
        ${infoCard(t("1 · SUN CARDS", "1 · CARTAS DE SOL"), t("Per Solar System", "Por Sistema Solar"), [
          t(`Each Sun ${glyph("sun")} shows a condition: a number of points, a slash, and a set of pictured items (usually planet colours).`, `Cada Sol ${glyph("sun")} mostra uma condição: um número de pontos, uma barra e um conjunto de itens desenhados (geralmente cores de planeta).`),
          t("It scores only with cards in its own Solar System, once for every complete set there (2 complete sets = twice the points).", "Ele só pontua com cartas do próprio Sistema Solar, uma vez por conjunto completo ali (2 conjuntos completos = o dobro de pontos)."),
          t("A two-coloured planet counts as one colour or the other for a given Sun, never both.", "Um planeta de duas cores conta como uma cor ou a outra para um mesmo Sol, nunca as duas."),
          t("Each card can be part of only one set of the same Sun.", "Cada carta só pode fazer parte de um conjunto do mesmo Sol."),
          interpretation("example (not from the rulebook): a Sun showing “2 / blue + pink” in a system with 2 blue and 3 pink Planets has 2 complete sets → 4 points; the third pink is left over.", "exemplo (não é do livro): um Sol que mostra “2 / azul + rosa” num sistema com 2 Planetas azuis e 3 rosa tem 2 conjuntos completos → 4 pontos; o terceiro rosa sobra."),
          t("Add all your Suns together.", "Some todos os seus Sóis.")
        ], [10, 15])}
        ${infoCard(t("2 · UNIQUE PLANETS", "2 · PLANETAS ÚNICOS"), t("Per Solar System", "Por Sistema Solar"), [
          t(`For each Solar System ${glyph("planet")}, count how many different numbers (1–7) its Planet cards show, and score from the table below.`, `Para cada Sistema Solar ${glyph("planet")}, conte quantos números diferentes (1–7) as cartas de Planeta mostram e pontue pela tabela abaixo.`),
          t("Each number counts once per Solar System, even if a Wormhole let you play it twice.", "Cada número conta uma vez por Sistema Solar, mesmo que um Buraco de Minhoca tenha permitido jogá-lo duas vezes."),
          t("Add all your Solar Systems together.", "Some todos os seus Sistemas Solares.")
        ], [7, 8, 10])}
        ${infoCard(t("3 · MOON CARDS", "3 · CARTAS DE LUA"), t("Next to the right colours", "Ao lado das cores certas"), [
          t(`Each Moon ${glyph("moon")} scores the points printed on it if it is adjacent to Planet card(s) of its required colour(s).`, `Cada Lua ${glyph("moon")} marca os pontos impressos nela se estiver ao lado de carta(s) de Planeta da(s) cor(es) exigida(s).`),
          t("One-colour Moon: that planet directly above or below it.", "Lua de uma cor: esse planeta logo acima ou abaixo dela."),
          t("Two-colour Moon: between two planets, each matching a different one of the two colours.", "Lua de duas cores: entre dois planetas, cada um de uma das duas cores."),
          t("Otherwise it scores 0.", "Caso contrário ela vale 0.")
        ], [7, 8, 10])}
        ${infoCard(t("4 · RESEARCH", "4 · PESQUISA"), t("Unique symbols in your Galaxy", "Símbolos únicos na sua Galáxia"), [
          t(`Count the different Research symbols ${glyph("research-symbol")} anywhere in your Galaxy (there are 7 kinds) and score from the table below.`, `Conte os símbolos de Pesquisa ${glyph("research-symbol")} diferentes em qualquer lugar da sua Galáxia (há 7 tipos) e pontue pela tabela abaixo.`),
          t("Duplicates add nothing here (some Rocket Tokens do use them).", "Duplicatas não somam nada aqui (algumas Fichas de Foguete as usam).")
        ], [9, 10])}
        ${infoCard(t("5 · ROCKET TOKENS", "5 · FICHAS DE FOGUETE"), t("Their printed bonuses", "Os bônus impressos"), [
          t(`Score each of your Rocket Tokens ${glyph("rocket-token")} by its bonus (see Rockets & research for all 12 kinds) and add them together.`, `Pontue cada uma das suas Fichas de Foguete ${glyph("rocket-token")} pelo seu bônus (veja os 12 tipos em Foguetes e pesquisa) e some.`),
          t("Each token is scored independently: a two-coloured planet may count as a different colour for each token.", "Cada ficha é pontuada de forma independente: um planeta de duas cores pode contar como uma cor diferente para cada ficha.")
        ], [10, 15])}
        ${infoCard(t("6 · ASTEROIDS", "6 · ASTEROIDES"), t("Majority: 10 / 6 / 2", "Maioria: 10 / 6 / 2"), [
          t(`Count your Asteroids Cards ${glyph("asteroids")}. Most: 10 points; 2nd most: 6; 3rd most: 2.`, `Conte as suas Cartas de Asteroides ${glyph("asteroids")}. Mais: 10 pontos; 2º: 6; 3º: 2.`),
          t("Tie: add the points of the tied placement and the placement(s) below it, divide by the number of tied players; those placements are used up.", "Empate: some os pontos da colocação empatada e da(s) colocação(ões) abaixo, divida pelo número de empatados; essas colocações ficam usadas."),
          t("Example: two tie for most → (10 + 6) ÷ 2 = 8 each; the next player gets 3rd place, 2 points.", "Exemplo: dois empatam com mais → (10 + 6) ÷ 2 = 8 cada; o próximo jogador fica com o 3º lugar, 2 pontos."),
          interpretation("a player with no Asteroids Cards scores nothing here; with 2 players (or solo) only 10 and 6 can be given; a fraction stays a fraction (e.g. 3 tied for 2nd: 8 ÷ 3).", "um jogador sem Cartas de Asteroides não marca nada aqui; com 2 jogadores (ou solo) só existem 10 e 6; frações ficam como estão (ex.: 3 empatados em 2º: 8 ÷ 3).")
        ], [8, 11])}
        ${infoCard(t("WINNER", "VENCEDOR"), t("Most points", "Mais pontos"), [
          t("Total all categories. The player with the most points wins.", "Some todas as categorias. Vence quem tiver mais pontos."),
          rl("Tie", "the tied player with the most rocket symbols in their Galaxy wins.", "Empate", "vence o empatado com mais símbolos de foguete na Galáxia."),
          rl("Still tied", "the tied players share the victory.", "Ainda empatados", "os empatados dividem a vitória."),
          isSolo() ? t("Solo: you win if your total beats the AI's total.", "Solo: você vence se o seu total superar o da IA.") : null
        ], [11], "victory-card")}
      </div>
      <div class="pg-tables">
        ${scoreTable("Unique planet numbers in one Solar System", "Números de planeta únicos num Sistema Solar")}
        ${scoreTable("Unique Research symbols in your Galaxy", "Símbolos de Pesquisa únicos na sua Galáxia")}
      </div>`;
  }

  // ---------- turns ----------

  function turnsSection() {
    return `
      ${sectionHeading("turns", t("Your turn", "Seu turno"), sectionIndex("turns"), [6, 9])}
      <div class="quick-grid">
        ${infoCard(t("STEP 1", "PASSO 1"), t("Draft any 2 cards", "Pegue quaisquer 2 cartas"), [
          t("Take 2 cards from the market: 2 Planets from the bottom 6 slots, 2 Space cards from the tops of the piles, or 1 of each.", "Pegue 2 cartas do mercado: 2 Planetas das 6 casas de baixo, 2 cartas de Espaço do topo das pilhas, ou 1 de cada."),
          t("A card is used on the side you take it: a Planet slot gives a Planet card; a pile top gives that Space card.", "A carta é usada pelo lado em que você a pega: uma casa de Planeta dá uma carta de Planeta; um topo de pilha dá aquela carta de Espaço."),
          t("Draft one card at a time. Taking a pile's top card reveals the next Space card, which you may take as your second card.", "Pegue uma carta de cada vez. Pegar o topo de uma pilha revela a próxima carta de Espaço, que você pode pegar como segunda carta."),
          t("Empty Planet slots are NOT refilled until the end of the turn.", "As casas de Planeta vazias NÃO são repostas até o fim do turno."),
          t("You may not draft an Asteroids Card unless you have a Sun with no Asteroids Card behind it.", "Você não pode pegar uma Carta de Asteroides se não tiver um Sol sem Asteroides atrás."),
          interpretation("if taking a pile's top card empties that pile, replace it at once the usual way (split the largest pile, bottom half to the empty spot) so its new top Space card can be drafted.", "se pegar o topo de uma pilha a esvaziar, reponha-a na hora do jeito normal (divida a maior pilha, metade de baixo para o lugar vazio) para que a nova carta de Espaço do topo possa ser pega.")
        ], [6, 8, 9])}
        ${infoCard(t("STEP 2", "PASSO 2"), t("Place them into your Galaxy", "Coloque-as na sua Galáxia"), [
          t("Your Galaxy is your personal tableau; each column of cards is a Solar System.", "A sua Galáxia é a sua área pessoal; cada coluna de cartas é um Sistema Solar."),
          t("Place each card into an existing Solar System or start a new Solar System with it (no limit on how many).", "Coloque cada carta num Sistema Solar existente ou comece um novo Sistema Solar com ela (sem limite de quantidade)."),
          t("You may place the 2 cards in either order.", "Você pode colocar as 2 cartas em qualquer ordem."),
          t("Each card type has its own placement rule — see Placing cards.", "Cada tipo de carta tem a sua regra de colocação — veja Colocar cartas.")
        ], [6])}
        ${infoCard(t("STEP 3", "PASSO 3"), t("Check Rockets", "Confira os foguetes"), [
          t(`Count all rocket symbols ${glyph("rocket-symbol")} in your whole Galaxy.`, `Conte todos os símbolos de foguete ${glyph("rocket-symbol")} da sua Galáxia inteira.`),
          t("If the total has reached or passed a new multiple of 5 (5, 10, 15…), immediately choose one available Rocket Token and place it beside your Galaxy.", "Se o total alcançou ou passou um novo múltiplo de 5 (5, 10, 15…), escolha na hora uma Ficha de Foguete disponível e coloque-a junto à sua Galáxia."),
          t("Each token is earned once: 5 gives one, 10 the next, and so on.", "Cada ficha é ganha uma vez: 5 dá uma, 10 a seguinte, e assim por diante."),
          t("A card has at most two rocket symbols, so one turn adds at most 4 and can never cross two multiples at once.", "Uma carta tem no máximo dois símbolos de foguete, então um turno soma no máximo 4 e nunca cruza dois múltiplos de uma vez."),
          interpretation("when no Rocket Tokens are left in the supply, reaching a new multiple gives nothing.", "quando não há mais Fichas de Foguete na reserva, alcançar um novo múltiplo não dá nada.")
        ], [9])}
        ${infoCard(t("STEP 4", "PASSO 4"), t("Turn end: refill the market", "Fim do turno: reponha o mercado"), [
          t("For each empty Planet slot, draw the top card of the pile of that column, flip it from its Space side to its Planet side and put it in the slot.", "Para cada casa de Planeta vazia, compre a carta do topo da pilha daquela coluna, vire-a do lado Espaço para o lado Planeta e coloque-a na casa."),
          t("If a draw pile runs out, split the largest pile roughly in half and move its bottom half to replace the empty pile (the Space card on top of the largest pile stays where it is).", "Se uma pilha de compra acabar, divida a maior pilha mais ou menos ao meio e mova a metade de baixo para o lugar da pilha vazia (a carta de Espaço do topo da maior pilha fica onde está)."),
          t(`Once the slots are refilled, ${isSolo() ? "the AI takes its turn" : "the next player clockwise takes a turn"}.`, `Depois de repor as casas, ${isSolo() ? "a IA faz o turno dela" : "o próximo jogador em sentido horário joga"}.`)
        ], [9])}
      </div>
      <div class="pg-art-row">
        ${figure("market-draft", t("Rulebook p. 6: draft any 2 cards — here a Moon from a pile top and a Planet from a slot", "Livro p. 6: pegue quaisquer 2 cartas — aqui uma Lua do topo de uma pilha e um Planeta de uma casa"))}
        ${figure("turn-end", t("Rulebook p. 9: refilling — cards are flipped from the pile of the same column into the empty slots", "Livro p. 9: reposição — cartas são viradas da pilha da mesma coluna para as casas vazias"))}
      </div>`;
  }

  // ---------- placing cards ----------

  function cardsSection() {
    return `
      ${sectionHeading("cards", t("Placing cards in Solar Systems", "Colocar cartas nos Sistemas Solares"), sectionIndex("cards"), [6, 7, 8])}
      <div class="callout">${lineList([
        t("A Solar System is one column: at most one Sun on top (with at most one Asteroids Card tucked behind it, above), and below it a card sequence of Planets, Moons and Wormholes.", "Um Sistema Solar é uma coluna: no máximo um Sol no topo (com no máximo uma Carta de Asteroides atrás dele, acima) e abaixo uma sequência de cartas de Planetas, Luas e Buracos de Minhoca."),
        t("Cards join a sequence only at its ends: above (tucked behind, showing only its top strip) or below (on top of the previous card). You never insert a card in the middle.", "Cartas entram numa sequência só pelas pontas: acima (por trás, mostrando só a faixa de cima) ou abaixo (por cima da carta anterior). Nunca se insere uma carta no meio."),
        interpretation("in a Solar System with a Sun, a card added “above” goes at the top of the sequence, between the Sun and the sequence; the Sun (and its Asteroids) always stay at the very top.", "num Sistema Solar com Sol, uma carta acrescentada “acima” vai para o topo da sequência, entre o Sol e a sequência; o Sol (e os seus Asteroides) ficam sempre no topo."),
        interpretation("a Starting Sun is a Sun Card in every respect: it can hold an Asteroids Card, scores its condition and counts for Rocket Token 11.", "um Sol Inicial é uma Carta de Sol em tudo: pode segurar uma Carta de Asteroides, pontua a sua condição e conta para a Ficha de Foguete 11.")
      ])} ${referenceLink(6)}</div>
      <div class="quick-grid">
        ${infoCard(t("PLANET CARDS", "CARTAS DE PLANETA"), t("Number sequences", "Sequências numéricas"), [
          t(`Each Planet ${glyph("card-planet")} has a number (1–7) and a colour/type (some have two).`, `Cada Planeta ${glyph("card-planet")} tem um número (1–7) e uma cor/tipo (alguns têm duas).`),
          t("Place it above or below any Solar System's sequence, or use it to start a Solar System.", "Coloque-o acima ou abaixo da sequência de qualquer Sistema Solar, ou use-o para começar um Sistema Solar."),
          t("When the 2nd Planet enters a Solar System, its direction is set. From then on, numbers must keep running from highest to lowest (or lowest to highest) along the column; gaps are allowed.", "Quando o 2º Planeta entra num Sistema Solar, a direção fica definida. Daí em diante os números precisam continuar do maior para o menor (ou do menor para o maior) ao longo da coluna; lacunas são permitidas."),
          t("A number can never repeat within one sequence: each new card must be strictly higher than the card at its end, or strictly lower, according to the direction.", "Um número nunca pode se repetir numa mesma sequência: cada carta nova precisa ser estritamente maior que a carta da ponta, ou estritamente menor, conforme a direção."),
          t("Example: with 5 at the top and 3 below it, a card added above must be 6 or 7 and a card added below must be 1 or 2; 3, 4 and 5 can no longer enter (unless a Wormhole is played).", "Exemplo: com 5 no topo e 3 abaixo, uma carta acrescentada acima precisa ser 6 ou 7 e uma acrescentada abaixo precisa ser 1 ou 2; 3, 4 e 5 não entram mais (a não ser que se jogue um Buraco de Minhoca).")
        ], [6, 7])}
        ${infoCard(t("PLANET X", "PLANETA X"), t("Wild number, no colour", "Número curinga, sem cor"), [
          t(`Planet X cards ${glyph("card-planet-x")} have no colour but may be considered any number — very flexible in sequences.`, `Cartas de Planeta X ${glyph("card-planet-x")} não têm cor, mas podem ser consideradas qualquer número — muito flexíveis nas sequências.`),
          interpretation("when you place it, decide which number it stands for (one that is legal there); it keeps that number for the sequence and for unique-number scoring. It never counts as a colour, and Rocket Token 8 cannot count it.", "ao colocá-lo, decida que número ele representa (um que seja válido ali); ele mantém esse número para a sequência e para a pontuação de números únicos. Ele nunca conta como cor, e a Ficha de Foguete 8 não pode contá-lo.")
        ], [7, 15])}
        ${infoCard(t("SUN CARDS", "CARTAS DE SOL"), t("One per Solar System", "Um por Sistema Solar"), [
          t(`A Sun ${glyph("card-sun")} goes above the card sequence of a Solar System.`, `Um Sol ${glyph("card-sun")} vai acima da sequência de cartas de um Sistema Solar.`),
          t("Each Solar System may have only one Sun. You may add a Sun to an existing Solar System with no Sun, or start a new Solar System with it.", "Cada Sistema Solar pode ter só um Sol. Você pode acrescentar um Sol a um Sistema Solar sem Sol, ou começar um novo Sistema Solar com ele."),
          t("Its condition scores only with the cards in that Solar System.", "A condição dele só pontua com as cartas daquele Sistema Solar.")
        ], [7])}
        ${infoCard(t("MOON CARDS", "CARTAS DE LUA"), t("Score next to the right colour", "Pontuam ao lado da cor certa"), [
          t(`A Moon ${glyph("card-moon")} is placed above or below any sequence, or starts a Solar System — like a Planet, but it has no number and does not affect the number sequence.`, `Uma Lua ${glyph("card-moon")} é colocada acima ou abaixo de qualquer sequência, ou começa um Sistema Solar — como um Planeta, mas sem número e sem afetar a sequência numérica.`),
          t("It scores only if adjacent to Planet card(s) of the colour(s) shown on it. One colour: that planet just above or below. Two colours: it must sit between two Planets, each matching a different one of the two colours.", "Ela só pontua se estiver ao lado de carta(s) de Planeta da(s) cor(es) mostrada(s) nela. Uma cor: esse planeta logo acima ou abaixo. Duas cores: ela precisa ficar entre dois Planetas, cada um de uma das duas cores."),
          t("A two-coloured planet satisfies only one of the two colours, so it cannot cover both.", "Um planeta de duas cores satisfaz só uma das duas cores, então não cobre as duas."),
          t("Moons may always be placed, even where they will not score.", "Luas sempre podem ser colocadas, mesmo onde não vão pontuar."),
          interpretation("to sit between two planets, place the Moon at an end and later add a matching Planet beyond it (the Planet must still follow the number sequence of the other planets).", "para ficar entre dois planetas, coloque a Lua numa ponta e depois acrescente um Planeta adequado além dela (o Planeta ainda precisa seguir a sequência numérica dos outros planetas).")
        ], [7, 8])}
        ${infoCard(t("ASTEROIDS CARDS", "CARTAS DE ASTEROIDES"), t("Behind a Sun", "Atrás de um Sol"), [
          t(`An Asteroids Card ${glyph("card-asteroids")} must be tucked behind (above) a Sun Card.`, `Uma Carta de Asteroides ${glyph("card-asteroids")} precisa ficar atrás (acima) de uma Carta de Sol.`),
          t("Only one per Sun, so the number you can draft is limited by your Suns. No open space above a Sun → you may not draft one.", "Só uma por Sol, então quantas você pode pegar depende dos seus Sóis. Sem espaço livre acima de um Sol → você não pode pegar uma."),
          t("At the end, Asteroids score by majority across all players (10 / 6 / 2).", "No fim, Asteroides pontuam por maioria entre todos os jogadores (10 / 6 / 2)."),
          interpretation("a Sun drafted earlier in the same turn counts as an open space, since you may place your two cards in either order.", "um Sol pego antes no mesmo turno conta como espaço livre, já que você pode colocar as duas cartas em qualquer ordem.")
        ], [8, 11])}
        ${infoCard(t("WORMHOLE CARDS", "CARTAS DE BURACO DE MINHOCA"), t("Reset the sequence", "Reiniciam a sequência"), [
          t(`A Wormhole ${glyph("card-wormhole")} may be placed in any Solar System, above or below its sequence, or start a Solar System.`, `Um Buraco de Minhoca ${glyph("card-wormhole")} pode ser colocado em qualquer Sistema Solar, acima ou abaixo da sequência, ou começar um Sistema Solar.`),
          t("It reverses the pull of gravity: the number sequence is reset above and below it, so that Solar System gets two separate number sequences and previously skipped numbers can be added.", "Ele inverte a gravidade: a sequência numérica é reiniciada acima e abaixo dele, então aquele Sistema Solar ganha duas sequências numéricas separadas e números antes pulados podem entrar."),
          t("Planets still score once per number per Solar System: repeating a number on the other side adds nothing to unique-planet scoring.", "Planetas ainda pontuam uma vez por número por Sistema Solar: repetir um número do outro lado não soma nada aos planetas únicos."),
          interpretation("the planets beyond the Wormhole form a fresh sequence: the first may be any number and its direction is set by its first two planets, like a new Solar System. The sequence on the other side keeps its own rule at its free end.", "os planetas além do Buraco de Minhoca formam uma sequência nova: o primeiro pode ser qualquer número e a direção é definida pelos dois primeiros planetas, como num Sistema Solar novo. A sequência do outro lado mantém a própria regra na sua ponta livre.")
        ], [8])}
      </div>
      <div class="pg-art-row">
        ${figure("galaxy", t("Rulebook p. 6: a Galaxy of three Solar Systems — Asteroids behind Suns, sequences of Planets, Moons and Wormholes below", "Livro p. 6: uma Galáxia de três Sistemas Solares — Asteroides atrás dos Sóis, sequências de Planetas, Luas e Buracos de Minhoca abaixo"))}
        ${figure("sequence", t("Rulebook p. 7: a Planet goes above or below a sequence; once 5 and 3 are set, above must be 6–7 and below 1–2", "Livro p. 7: um Planeta vai acima ou abaixo de uma sequência; com 5 e 3 definidos, acima precisa ser 6–7 e abaixo 1–2"))}
        ${figure("moon-single", t("Rulebook p. 7: a green Moon scores next to a green Planet, not next to an orange one", "Livro p. 7: uma Lua verde pontua ao lado de um Planeta verde, não ao lado de um laranja"))}
        ${figure("moon-double", t("Rulebook p. 8: a two-colour Moon scores only between two Planets matching one colour each", "Livro p. 8: uma Lua de duas cores só pontua entre dois Planetas, cada um de uma das cores"))}
      </div>`;
  }

  // ---------- rockets ----------

  function rocketsSection() {
    const tokens = [
      ["rocket-01", "1 point for every set of 2 Planet cards of the colour/type shown, in your entire Galaxy.", "1 ponto por conjunto de 2 cartas de Planeta da cor/tipo mostrada, na sua Galáxia inteira."],
      ["rocket-02", "The points shown for every Solar System with at least the number of Planet cards shown (e.g. “system w/ 4+”).", "Os pontos mostrados por Sistema Solar com pelo menos o número de cartas de Planeta indicado (ex.: “system w/ 4+”)."],
      ["rocket-03", "1 point for every Rocket Token you earned, including this one.", "1 ponto por Ficha de Foguete que você ganhou, incluindo esta."],
      ["rocket-04", "1 point for every Asteroids Card in your entire Galaxy.", "1 ponto por Carta de Asteroides na sua Galáxia inteira."],
      ["rocket-05", "1 point for every Wormhole Card in your entire Galaxy.", "1 ponto por Carta de Buraco de Minhoca na sua Galáxia inteira."],
      ["rocket-06", "2 points for every set of 3 Moon Cards in your entire Galaxy.", "2 pontos por conjunto de 3 Cartas de Lua na sua Galáxia inteira."],
      ["rocket-07", "1 point for every set of 2 Research symbols in your entire Galaxy (duplicates count).", "1 ponto por conjunto de 2 símbolos de Pesquisa na sua Galáxia inteira (duplicatas contam)."],
      ["rocket-08", "1 point for every Planet card of the specific number shown (e.g. #7) in your entire Galaxy. Planet X cards do not count.", "1 ponto por carta de Planeta do número indicado (ex.: #7) na sua Galáxia inteira. Planetas X não contam."],
      ["rocket-09", "2 points for every full set of all 5 Planet colours/types in your entire Galaxy.", "2 pontos por conjunto completo das 5 cores/tipos de Planeta na sua Galáxia inteira."],
      ["rocket-10", "1 point for every set of 3 Planet cards of the colours/types shown in your entire Galaxy.", "1 ponto por conjunto de 3 cartas de Planeta das cores/tipos mostradas na sua Galáxia inteira."],
      ["rocket-11", "1 point per Sun Card in your entire Galaxy.", "1 ponto por Carta de Sol na sua Galáxia inteira."],
      ["rocket-12", "4 points per set of 3 identical Research symbols in your entire Galaxy.", "4 pontos por conjunto de 3 símbolos de Pesquisa idênticos na sua Galáxia inteira."]
    ];
    return `
      ${sectionHeading("rockets", t("Rocket & Research symbols, Rocket Tokens", "Símbolos de foguete e de Pesquisa, Fichas de Foguete"), sectionIndex("rockets"), [9, 15])}
      <div class="quick-grid">
        ${infoCard(t("SYMBOL", "SÍMBOLO"), t("Rocket symbols", "Símbolos de foguete"), [
          t(`Many cards show one or two rocket symbols ${glyph("rocket-symbol")} in their top-right corner.`, `Muitas cartas mostram um ou dois símbolos de foguete ${glyph("rocket-symbol")} no canto superior direito.`),
          t("Every rocket symbol anywhere in your Galaxy counts — on any card, in any Solar System.", "Todo símbolo de foguete em qualquer lugar da sua Galáxia conta — em qualquer carta, em qualquer Sistema Solar."),
          t("At the end of each of your turns: for every new multiple of 5 reached (5, 10, 15…), choose one available Rocket Token.", "No fim de cada turno seu: para cada novo múltiplo de 5 alcançado (5, 10, 15…), escolha uma Ficha de Foguete disponível."),
          t("Rocket symbols also break a tie for the win.", "Símbolos de foguete também desempatam a vitória.")
        ], [9, 11])}
        ${infoCard(t("SYMBOL", "SÍMBOLO"), t("Research symbols", "Símbolos de Pesquisa"), [
          t(`Some cards show one Research symbol ${glyph("research-symbol")}: a picture with a letter, on a banner.`, `Algumas cartas mostram um símbolo de Pesquisa ${glyph("research-symbol")}: um desenho com uma letra, numa faixa.`),
          t("There are 7 different ones. At the end you score for how many different ones your Galaxy has (1/2/3/5/7/9/12).", "Há 7 diferentes. No fim você pontua por quantos diferentes a sua Galáxia tem (1/2/3/5/7/9/12)."),
          interpretation("two symbols are identical when they show the same picture and letter.", "dois símbolos são idênticos quando mostram o mesmo desenho e a mesma letra.")
        ], [9, 10])}
      </div>
      <h3 class="subhead">${t("The 12 kinds of Rocket Token (24 tokens)", "Os 12 tipos de Ficha de Foguete (24 fichas)")}</h3>
      <p class="glossary-intro">${t(
        "Each token shows “rocket ×5” on its tip (you earn it for every 5 rocket symbols) and a bonus: points / what is counted. Colours and numbers on your actual token may differ from the pictures. Each token scores independently, so a two-coloured planet may count as one colour for one token and the other colour for another token — never both for the same token.",
        "Cada ficha mostra “foguete ×5” na ponta (você a ganha a cada 5 símbolos de foguete) e um bônus: pontos / o que é contado. As cores e números da sua ficha podem ser diferentes das figuras. Cada ficha pontua de forma independente, então um planeta de duas cores pode contar como uma cor para uma ficha e a outra cor para outra ficha — nunca as duas para a mesma ficha."
      )} ${referenceLink(15)}</p>
      <div class="icon-grid">
        ${tokens.map(([file, en, pt]) => iconCard(file, en, pt, 15)).join("")}
      </div>`;
  }

  // ---------- solo ----------

  function soloSection() {
    if (!isSolo()) {
      return "";
    }
    const [sun, dup, rocket] = difficultyValues();
    const achievements = [
      ["Score 50+ points", "Marque 50+ pontos"], ["Score 55+ points", "Marque 55+ pontos"], ["Score 60+ points", "Marque 60+ pontos"],
      ["Score 65+ points", "Marque 65+ pontos"], ["Score 70+ points", "Marque 70+ pontos"], ["Score 10+ points from Suns", "Marque 10+ pontos com Sóis"],
      ["Score 15+ points from Suns", "Marque 15+ pontos com Sóis"], ["Score 20+ points from Planets", "Marque 20+ pontos com Planetas"],
      ["Score 25+ points from Planets", "Marque 25+ pontos com Planetas"], ["Score 30+ points from Planets", "Marque 30+ pontos com Planetas"],
      ["Score 10+ points from Moons", "Marque 10+ pontos com Luas"], ["Score 15+ points from Moons", "Marque 15+ pontos com Luas"],
      ["Collect all 7 Research symbols", "Junte os 7 símbolos de Pesquisa"], ["Score 7+ points from Rocket Tokens", "Marque 7+ pontos com Fichas de Foguete"],
      ["Score 12+ points from Rocket Tokens", "Marque 12+ pontos com Fichas de Foguete"]
    ];
    return `
      ${sectionHeading("solo", t("Solo mode: the AI opponent", "Modo solo: o oponente IA"), sectionIndex("solo"), [12, 13, 14])}
      <div class="callout">${t(
        `Gameplay is the same as in a multiplayer game: you take the first turn, then the AI takes a turn, alternating until each of you has taken 13 turns. Difficulty: ${difficultyName()}.`,
        `O jogo é igual ao multijogador: você faz o primeiro turno, depois a IA faz um turno, alternando até cada um ter feito 13 turnos. Dificuldade: ${difficultyName()}.`
      )} ${referenceLink(12)}</div>
      <div class="quick-grid">
        ${infoCard(t("AI TURN · 1", "TURNO DA IA · 1"), t("Draft the 2 closest cards", "Pegar as 2 cartas mais próximas"), [
          t("The AI takes the two market cards closest to the face-down marker token, in the direction its tip points.", "A IA pega as duas cartas do mercado mais próximas da ficha marcadora virada para baixo, na direção para onde a ponta aponta."),
          t("The marker moves clockwise through 13 positions, one per AI turn (position 13 is the same spot as position 1):", "O marcador anda em sentido horário por 13 posições, uma por turno da IA (a posição 13 é o mesmo lugar da posição 1):"),
          rl("1 and 13 · left of the top row", "the top-left and top-middle pile tops.", "1 e 13 · à esquerda da fileira de cima", "os topos das pilhas da esquerda e do meio."),
          rl("2 · 3 · 4 · above the left / middle / right column", "that pile's top card and the Planet just below it.", "2 · 3 · 4 · acima da coluna esquerda / do meio / direita", "o topo daquela pilha e o Planeta logo abaixo."),
          rl("5 · 6 · 7 · right of the top / middle / bottom row", "the right and middle cards of that row.", "5 · 6 · 7 · à direita da fileira de cima / do meio / de baixo", "as cartas da direita e do meio dessa fileira."),
          rl("8 · 9 · 10 · below the right / middle / left column", "the bottom and middle Planets of that column.", "8 · 9 · 10 · abaixo da coluna direita / do meio / esquerda", "os Planetas de baixo e do meio dessa coluna."),
          rl("11 · 12 · left of the bottom / middle row", "the left and middle cards of that row.", "11 · 12 · à esquerda da fileira de baixo / do meio", "as cartas da esquerda e do meio dessa fileira."),
          interpretation("this pairing is read from the rulebook diagram (“the two closest cards in the direction the token is pointing”). Both cards are taken at once; a Space card revealed under a taken pile top is not taken.", "esses pares foram lidos do diagrama do livro (“as duas cartas mais próximas na direção para onde a ficha aponta”). As duas cartas são pegas ao mesmo tempo; uma carta de Espaço revelada sob um topo pego não é pega.")
        ], [12])}
        ${infoCard(t("AI TURN · 2", "TURNO DA IA · 2"), t("Build the AI tableau", "Montar a área da IA"), [
          rl("Planets", "into columns where each column holds only one copy of each number; order does not matter. If the number is already in a column, try the next column; if it is in every column, start a new column.", "Planetas", "em colunas onde cada coluna tem só uma cópia de cada número; a ordem não importa. Se o número já está numa coluna, tente a próxima; se está em todas, comece uma nova coluna."),
          rl("Suns, Moons, Asteroids, Wormholes", "anywhere in the AI tableau; they are not associated with any column. The AI needs no Sun to take Asteroids.", "Sóis, Luas, Asteroides, Buracos de Minhoca", "em qualquer lugar da área da IA; não ficam associados a nenhuma coluna. A IA não precisa de Sol para pegar Asteroides."),
          interpretation("the AI's Starting Sun counts as one of its Sun Cards when scoring.", "o Sol Inicial da IA conta como uma das suas Cartas de Sol na pontuação."),
          t("You still choose your own Rocket Tokens freely; only the AI takes the leftmost one.", "Você continua escolhendo livremente as suas Fichas de Foguete; só a IA pega a mais à esquerda."),
          interpretation("a Planet X goes into the first column and counts as a number missing there.", "um Planeta X vai para a primeira coluna e conta como um número que falta ali.")
        ], [12, 13])}
        ${infoCard(t("AI TURN · 3", "TURNO DA IA · 3"), t("Rockets, marker, refill", "Foguetes, marcador, reposição"), [
          rl("Check Rockets", "count the AI's rocket symbols; on each new multiple of 5 it takes the leftmost available Rocket Token.", "Conferir foguetes", "conte os símbolos de foguete da IA; a cada novo múltiplo de 5 ela pega a Ficha de Foguete disponível mais à esquerda."),
          rl("Move the marker", "one position clockwise around the market, tip still pointing inward (positions 1 → 13).", "Mover o marcador", "uma posição em sentido horário em volta do mercado, ponta ainda para dentro (posições 1 → 13)."),
          rl("Refill", "the market as on a player's turn. Then it is your turn.", "Repor", "o mercado como no turno de um jogador. Depois é a sua vez.")
        ], [13])}
        ${infoCard(t("AI SCORING", "PONTUAÇÃO DA IA"), difficultyName(), [
          rl("Suns", `${sun} point${sun > 1 ? "s" : ""} per Sun Card.`, "Sóis", `${sun} ponto${sun > 1 ? "s" : ""} por Carta de Sol.`),
          rl("Planets", "per AI column, by unique numbers (1/2/3/5/7/9/12); sequence does not matter.", "Planetas", "por coluna da IA, por números únicos (1/2/3/5/7/9/12); a sequência não importa."),
          rl("Moons", "the points printed on each Moon (no adjacency needed).", "Luas", "os pontos impressos em cada Lua (sem precisar de vizinhos)."),
          rl("Research", `unique symbols (1/2/3/5/7/9/12)${dup ? ` + ${dup} per duplicate Research symbol` : ""}.`, "Pesquisa", `símbolos únicos (1/2/3/5/7/9/12)${dup ? ` + ${dup} por símbolo de Pesquisa duplicado` : ""}.`),
          rl("Rocket Tokens", `${rocket} points each; printed bonuses are ignored.`, "Fichas de Foguete", `${rocket} pontos cada; os bônus impressos são ignorados.`),
          rl("Asteroids", "compare with you as with any player (10 for most, 6 for second).", "Asteroides", "compare com você como com qualquer jogador (10 para quem tem mais, 6 para o segundo)."),
          rl("You", "score exactly as in a multiplayer game.", "Você", "pontua exatamente como no multijogador."),
          interpretation("a “duplicate” is every Research symbol beyond the first of its kind.", "uma “duplicata” é cada símbolo de Pesquisa além do primeiro do seu tipo.")
        ], [13, 14], "victory-card")}
      </div>
      <h3 class="subhead">${t("Solo achievements", "Conquistas do solo")}</h3>
      <p class="glossary-intro">${t(
        "Each time you beat the AI (any difficulty), check whether you met any of these 15 criteria; pick one of them and mark your symbol on the achievements chart printed on rulebook p. 14. Earn all 15 to become a Point Galaxy Master.",
        "Cada vez que você vence a IA (qualquer dificuldade), veja se cumpriu algum destes 15 critérios; escolha um e marque o seu símbolo no quadro de conquistas impresso no livro, p. 14. Conquiste os 15 para virar Point Galaxy Master."
      )} ${referenceLink(14)}</p>
      <ol class="pg-achievements">${achievements.map(([en, pt]) => `<li>${t(en, pt)}</li>`).join("")}</ol>
      <div class="pg-art-row">${figure("solo-diagram", t("Rulebook p. 12: the 13 positions of the AI marker around the market, clockwise", "Livro p. 12: as 13 posições do marcador da IA em volta do mercado, em sentido horário"))}</div>`;
  }

  // ---------- iconography ----------

  function iconsSection() {
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), sectionIndex("icons"), [3, 7, 8, 9, 10])}
      <p class="glossary-intro">${t(
        "Each picture is cut from the rulebook, which is a low-resolution scan; small card details are easier to read on your real cards. Card layout: a Planet card shows its number and colour icon top left and its rocket or Research symbols top right; Space cards show their symbols in a strip along the top.",
        "Cada imagem foi recortada do livro, que é uma digitalização de baixa resolução; detalhes pequenos das cartas são mais fáceis de ler nas cartas reais. Disposição: uma carta de Planeta mostra o número e o ícone de cor no alto à esquerda e os símbolos de foguete ou de Pesquisa no alto à direita; cartas de Espaço mostram os seus símbolos numa faixa no alto."
      )}</p>
      <h3 class="subhead">${t("Symbols on cards", "Símbolos nas cartas")}</h3>
      <div class="icon-grid">
        ${iconCard("rocket-symbol", "Printed on many cards (one or two). Every 5 in your Galaxy earns a Rocket Token; also the win tie-breaker.", "Impresso em muitas cartas (um ou dois). Cada 5 na sua Galáxia rendem uma Ficha de Foguete; também desempata a vitória.", 9)}
        ${iconCard("research-symbol", "A Research symbol (picture + letter). 7 different kinds; unique ones score at the end.", "Um símbolo de Pesquisa (desenho + letra). 7 tipos diferentes; os únicos pontuam no fim.", [9, 10])}
        ${iconCard("first-player", "Printed on one Player Aid: whoever draws it is the first player.", "Impresso numa Carta de Ajuda: quem a tirar é o primeiro jogador.", 4)}
      </div>
      <h3 class="subhead">${t("Scoring categories (scorepad rows)", "Categorias de pontuação (linhas do bloco)")}</h3>
      <div class="icon-grid">
        ${iconCard("sun", "Sun Cards: each Sun's condition, per complete set in its Solar System.", "Cartas de Sol: a condição de cada Sol, por conjunto completo no seu Sistema Solar.", 10)}
        ${iconCard("planet", "Unique Planets: different numbers per Solar System, 1/2/3/5/7/9/12. On Rocket Tokens a grey planet means “any Planet card”.", "Planetas únicos: números diferentes por Sistema Solar, 1/2/3/5/7/9/12. Nas Fichas de Foguete um planeta cinza significa “qualquer carta de Planeta”.", [10, 15])}
        ${iconCard("moon", "Moon Cards: printed points when next to the required colour(s).", "Cartas de Lua: pontos impressos quando ao lado da(s) cor(es) exigida(s).", 10)}
        ${iconCard("research", "Unique Research symbols in your Galaxy, 1/2/3/5/7/9/12.", "Símbolos de Pesquisa únicos na sua Galáxia, 1/2/3/5/7/9/12.", 10)}
        ${iconCard("rocket-token", "Rocket Token bonuses.", "Bônus das Fichas de Foguete.", 10)}
        ${iconCard("asteroids", "Asteroids majority: 10 / 6 / 2.", "Maioria de Asteroides: 10 / 6 / 2.", 11)}
      </div>
      <h3 class="subhead">${t("Cards and tokens", "Cartas e fichas")}</h3>
      <div class="icon-grid">
        ${iconCard("card-planet", "Planet side (front): number 1–7 and colour/type top left; rocket symbols top right.", "Lado Planeta (frente): número 1–7 e cor/tipo no alto à esquerda; símbolos de foguete no alto à direita.", [3, 6])}
        ${iconCard("card-planet-ring", "A Planet with a Research symbol (the banner top right).", "Um Planeta com símbolo de Pesquisa (a faixa no alto à direita).", [3, 9])}
        ${iconCard("card-planet-x", "Planet X: no colour, any number.", "Planeta X: sem cor, qualquer número.", 7)}
        ${iconCard("card-sun", "Space side: Sun. Its centre shows its scoring condition (points / set).", "Lado Espaço: Sol. O centro mostra a condição de pontuação (pontos / conjunto).", [3, 7])}
        ${iconCard("card-starting-sun", "Starting Sun: like a Sun, with a star in the corner; one per player at setup.", "Sol Inicial: como um Sol, com uma estrela no canto; um por jogador na preparação.", [3, 4])}
        ${iconCard("card-moon", "Space side: Moon. Its top strip shows the colour(s) it needs and, in a circle, its points.", "Lado Espaço: Lua. A faixa de cima mostra a(s) cor(es) que ela exige e, num círculo, os seus pontos.", [3, 7])}
        ${iconCard("card-asteroids", "Space side: Asteroids. Its top strip shows the majority values 10 / 6 / 2.", "Lado Espaço: Asteroides. A faixa de cima mostra os valores de maioria 10 / 6 / 2.", 8)}
        ${iconCard("card-wormhole", "Space side: Wormhole. Resets the number sequence beyond it.", "Lado Espaço: Buraco de Minhoca. Reinicia a sequência numérica além dele.", [3, 8])}
        ${iconCard("card-player-aid", "Player Aid: card types on one side, setup and scoring summary on the other.", "Carta de Ajuda: tipos de carta de um lado, resumo de preparação e pontuação do outro.", 3)}
        ${iconCard("token-back", "Rocket Token back (face down).", "Verso da Ficha de Foguete (virada para baixo).", 3)}
        ${iconCard("token-front", "Rocket Token front: “×5” on the tip, bonus below.", "Frente da Ficha de Foguete: “×5” na ponta, bônus embaixo.", [3, 15])}
        ${iconCard("scorepad", "Scorepad: one column per player, one row per category, total at the bottom.", "Bloco: uma coluna por jogador, uma linha por categoria, total embaixo.", [3, 11])}
      </div>`;
  }

  // ---------- examples ----------

  function examplesSection() {
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), sectionIndex("examples"), [5, 7, 8, 11])}
      <div class="quick-grid pg-example-grid">
        <article class="info-card">
          <span class="component-label">${t("RULEBOOK EXAMPLE", "EXEMPLO DO LIVRO")}</span>
          <h3>${t("Number sequence", "Sequência numérica")}</h3>
          ${figure("sequence", t("Rulebook p. 7", "Livro p. 7"))}
          ${lineList([
            t("A Planet goes above or below an existing sequence, or into a new Solar System.", "Um Planeta vai acima ou abaixo de uma sequência existente, ou num Sistema Solar novo."),
            t("With 5 on top and 3 below, the next card above must be 6 or 7 and the next below 1 or 2.", "Com 5 em cima e 3 embaixo, a próxima carta acima precisa ser 6 ou 7 e a próxima abaixo 1 ou 2."),
            t("3, 4 and 5 could not be placed in that system (unless a Wormhole was played).", "3, 4 e 5 não poderiam entrar nesse sistema (a não ser que se jogasse um Buraco de Minhoca).")
          ])}
          ${referenceLink(7)}
        </article>
        <article class="info-card">
          <span class="component-label">${t("RULEBOOK EXAMPLE", "EXEMPLO DO LIVRO")}</span>
          <h3>${t("Moons", "Luas")}</h3>
          ${figure("moon-double", t("Rulebook p. 8", "Livro p. 8"))}
          ${lineList([
            t("This Moon needs two colours: it scores only between two Planets, one of each colour.", "Esta Lua precisa de duas cores: só pontua entre dois Planetas, um de cada cor."),
            t("A two-coloured Planet above it still counts for only one colour, so the first two columns fail; the third scores.", "Um Planeta de duas cores acima dela ainda conta só para uma cor, então as duas primeiras colunas falham; a terceira pontua.")
          ])}
          ${referenceLink(8)}
        </article>
        <article class="info-card">
          <span class="component-label">${t("RULEBOOK EXAMPLE", "EXEMPLO DO LIVRO")}</span>
          <h3>${t("Scoring a Galaxy: 55 points", "Pontuando uma Galáxia: 55 pontos")}</h3>
          ${figure("scoring-example", t("Rulebook p. 11", "Livro p. 11"))}
          ${lineList([
            rl("Suns", "11 (as written on the scorepad).", "Sóis", "11 (como anotado no bloco)."),
            rl("Planets", "24: systems with 6, 5, 4 and 3 different numbers score 9 + 7 + 5 + 3.", "Planetas", "24: sistemas com 6, 5, 4 e 3 números diferentes marcam 9 + 7 + 5 + 3."),
            rl("Moons", "7: three Moons next to their colours (3 + 2 + 2); a fourth Moon sits next to the wrong colours and scores 0.", "Luas", "7: três Luas ao lado das suas cores (3 + 2 + 2); uma quarta Lua está ao lado das cores erradas e vale 0."),
            rl("Research", "3: three different symbols (one is duplicated).", "Pesquisa", "3: três símbolos diferentes (um é repetido)."),
            rl("Rocket Tokens", "4: “1 per system with 5+ planets” (2 systems → 2) and “2 per full set of 5 colours” (1 set → 2).", "Fichas de Foguete", "4: “1 por sistema com 5+ planetas” (2 sistemas → 2) e “2 por conjunto completo de 5 cores” (1 conjunto → 2)."),
            rl("Asteroids", "6: two Asteroids Cards, second most.", "Asteroides", "6: duas Cartas de Asteroides, segundo lugar."),
            t("The Sun pictures are too small in the scanned rulebook to break the 11 down reliably; the guide does not guess them.", "Os desenhos dos Sóis são pequenos demais no livro digitalizado para detalhar os 11 com segurança; o guia não os adivinha.")
          ])}
          ${referenceLink(11)}
        </article>
        <article class="info-card">
          <span class="component-label">${t("RULEBOOK EXAMPLE", "EXEMPLO DO LIVRO")}</span>
          <h3>${t("Asteroid tie", "Empate de Asteroides")}</h3>
          ${lineList([
            t("Two players tie for most Asteroids: 10 + 6 = 16, divided by 2 → 8 points each.", "Dois jogadores empatam com mais Asteroides: 10 + 6 = 16, divididos por 2 → 8 pontos cada."),
            t("The player with the next most takes 3rd place: 2 points.", "O jogador seguinte fica com o 3º lugar: 2 pontos.")
          ])}
          ${referenceLink(11)}
        </article>
      </div>`;
  }

  // ---------- guide's readings ----------

  function faqSection() {
    const items = [
      [t("Can I draft a card from a pile top and then the card under it?", "Posso pegar o topo de uma pilha e depois a carta de baixo?"), t("Yes — the rulebook says so explicitly: drafting a pile top reveals the next Space card, which may be your second card.", "Sim — o livro diz isso explicitamente: pegar o topo de uma pilha revela a próxima carta de Espaço, que pode ser a sua segunda carta."), 6],
      [t("What does Planet X count as?", "Como conta o Planeta X?"), t("The rulebook only says it may be considered any number and has no colour. This guide fixes its number when you place it (a legal number there) and uses that number for unique-planet scoring.", "O livro só diz que ele pode ser considerado qualquer número e não tem cor. Este guia fixa o número ao colocá-lo (um número válido ali) e usa esse número na pontuação de planetas únicos."), 7],
      [t("How does the sequence work after a Wormhole?", "Como funciona a sequência depois de um Buraco de Minhoca?"), t("The rulebook says the sequence is reset above and below it. This guide treats the planets beyond it as a fresh sequence: any first number, direction set by its first two planets.", "O livro diz que a sequência é reiniciada acima e abaixo dele. Este guia trata os planetas além dele como uma sequência nova: qualquer primeiro número, direção definida pelos dois primeiros planetas."), 8],
      [t("May I draft Asteroids together with the Sun that will hold them?", "Posso pegar Asteroides junto com o Sol que vai segurá-los?"), t("The rulebook requires an open space above a Sun but also lets you place your two cards in either order. This guide allows it if the Sun was drafted first that turn.", "O livro exige um espaço livre acima de um Sol, mas também deixa colocar as duas cartas em qualquer ordem. Este guia permite se o Sol foi pego primeiro naquele turno."), 8],
      [t("What if the Rocket Token supply runs out?", "E se a reserva de Fichas de Foguete acabar?"), t("The rulebook does not say. This guide reads it as: no more tokens can be earned; rocket symbols still count for the tie-breaker.", "O livro não diz. Este guia entende que: não se ganha mais nenhuma ficha; os símbolos de foguete ainda contam para o desempate."), 9],
      [t("Can I move cards already in my Galaxy?", "Posso mover cartas que já estão na minha Galáxia?"), t("The rulebook gives no way to do so. This guide treats placed cards as fixed.", "O livro não dá nenhum meio de fazer isso. Este guia considera as cartas colocadas como fixas."), 6],
      [t("Does a player with no Asteroids score 3rd place?", "Um jogador sem Asteroides fica com o 3º lugar?"), t("The rulebook ranks players by how many Asteroids Cards they have. This guide gives nothing to a player with none.", "O livro classifica os jogadores por quantas Cartas de Asteroides têm. Este guia não dá nada a quem não tem nenhuma."), 11]
    ];
    return `
      ${sectionHeading("faq", t("Guide's readings", "Leituras do guia"), sectionIndex("faq"), [6, 7, 8, 9, 11])}
      <p class="glossary-intro">${t("Where the rulebook is silent or ambiguous, this guide states its own reading, labelled as such.", "Onde o livro é omisso ou ambíguo, este guia dá a sua própria leitura, identificada como tal.")}</p>
      <div class="quick-grid">${items.map(([q, a, page]) => `
        <article class="info-card">
          <span class="component-label">${t("GUIDE'S READING", "LEITURA DO GUIA")}</span>
          <h3>${q}</h3>
          <p>${a}</p>
          ${referenceLink(page)}
        </article>`).join("")}</div>`;
  }

  // ---------- glossary ----------

  function glossarySection() {
    const visible = [
      { term: ["Galaxy", "Galáxia"], text: ["Your personal tableau: all your Solar Systems.", "A sua área pessoal: todos os seus Sistemas Solares."], page: 6 },
      { term: ["Solar System", "Sistema Solar"], text: ["One column of your Galaxy: at most one Sun (with at most one Asteroids Card behind it) above a card sequence.", "Uma coluna da sua Galáxia: no máximo um Sol (com no máximo uma Carta de Asteroides atrás) acima de uma sequência de cartas."], page: 6 },
      { term: ["Card sequence", "Sequência de cartas"], text: ["The Planets, Moons and Wormholes stacked in a Solar System; cards join only at its top or bottom.", "Os Planetas, Luas e Buracos de Minhoca empilhados num Sistema Solar; cartas entram só pelo topo ou pela base."], page: 6 },
      { term: ["Tucked behind / on top of", "Por trás / por cima"], text: ["Above the sequence a card slides behind, showing its top strip; below, a card overlaps the previous one.", "Acima da sequência a carta desliza por trás, mostrando a faixa de cima; abaixo, a carta cobre a anterior."], page: 6 },
      { term: ["Market", "Mercado"], text: ["3 draw piles (Space card on top) plus 6 face-up Planet cards below them.", "3 pilhas de compra (carta de Espaço no topo) mais 6 cartas de Planeta viradas para cima abaixo delas."], page: 4 },
      { term: ["Planet side / Space side", "Lado Planeta / lado Espaço"], text: ["The front (numbered planet) and back (Sun, Moon, Asteroids or Wormhole) of each Planet/Space card.", "A frente (planeta numerado) e o verso (Sol, Lua, Asteroides ou Buraco de Minhoca) de cada carta de Planeta/Espaço."], page: 4 },
      { term: ["Colour/type", "Cor/tipo"], text: ["The planet colour icon by the number; there are 5. Some Planets have two (count as one or the other per scoring item).", "O ícone de cor do planeta junto ao número; há 5. Alguns Planetas têm duas (contam como uma ou outra por item de pontuação)."], page: 15 },
      { term: ["Rocket Token", "Ficha de Foguete"], text: ["Earned for every 5 rocket symbols; scores its printed bonus at the end.", "Ganha a cada 5 símbolos de foguete; pontua o bônus impresso no fim."], page: 9 },
      { term: ["Set", "Conjunto"], text: ["A group of the pictured items; each card can belong to only one set of a given Sun or token.", "Um grupo dos itens desenhados; cada carta pode pertencer a só um conjunto de um mesmo Sol ou ficha."], page: 15 },
      { term: ["Unique", "Único"], text: ["Different: numbers per Solar System, Research symbols per Galaxy.", "Diferente: números por Sistema Solar, símbolos de Pesquisa por Galáxia."], page: 10 }
    ];
    if (isSolo()) {
      visible.push({ term: ["AI opponent", "Oponente IA"], text: ["The automatic solo rival: drafts the 2 cards the marker points at and scores by the difficulty table.", "O rival automático do solo: pega as 2 cartas que o marcador aponta e pontua pela tabela de dificuldade."], page: 12 });
    }
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), sectionIndex("glossary"), [3])}
      <div class="quick-grid glossary-grid">${visible.map((item) => `
        <article class="info-card glossary-card">
          <span class="component-label">${t("TERM", "TERMO")}</span>
          <h3>${t(item.term[0], item.term[1])}</h3>
          <p>${t(item.text[0], item.text[1])}</p>
          ${referenceLink(item.page)}
        </article>`).join("")}</div>`;
  }

  // ---------- render ----------

  function renderInto(host) {
    root = host;
    document.body.classList.add("theme-point-galaxy");
    document.documentElement.lang = state.language;
    document.title = t("Point Galaxy — Field Manual", "Point Galaxy — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Point Galaxy: draft planets and space cards into Solar Systems — setup by player count, the market, placement rules, rockets, scoring and the solo AI opponent.",
        "Regras interativas bilíngues de Point Galaxy: pegue planetas e cartas de espaço para os seus Sistemas Solares — preparação por número de jogadores, mercado, regras de colocação, foguetes, pontuação e o oponente IA do solo."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook", "Livro interativo")}</p>
          <h1>Point Galaxy</h1>
          <p class="hero-intro">${t(
            "Draft planets, suns, moons, asteroids and wormholes, line planets up in number sequences across your Solar Systems, and build the galaxy worth the most points.",
            "Pegue planetas, sóis, luas, asteroides e buracos de minhoca, alinhe os planetas em sequências numéricas nos seus Sistemas Solares e construa a galáxia que vale mais pontos."
          )}</p>
          <div class="hero-meta"><span>${t("1–5 players", "1–5 jogadores")}</span><span>Flatout Games</span><span>AEG</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/point-galaxy.webp" alt="${t("Cover of the Point Galaxy rulebook", "Capa do livro de regras de Point Galaxy")}" fetchpriority="high"><figcaption>${t("Rulebook cover · Flatout Games / AEG", "Capa do livro de regras · Flatout Games / AEG")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("The galaxy", "A galáxia")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column pg-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied English rulebook of Point Galaxy (Flatout Games / AEG, 2025), 16 pages including the solo mode. The PDF is a scan without searchable text; page links use the printed page numbers, which match the PDF pages. Points marked “Guide's reading” are interpretations where the rulebook is silent.",
            "Este guia cobre o livro de regras em inglês fornecido de Point Galaxy (Flatout Games / AEG, 2025), 16 páginas incluindo o modo solo. O PDF é uma digitalização sem texto pesquisável; os links usam os números de página impressos, que coincidem com as páginas do PDF. Trechos marcados como “Leitura do guia” são interpretações onde o livro é omisso."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${victorySection()}</section>
          <section class="rule-section">${turnsSection()}</section>
          <section class="rule-section">${cardsSection()}</section>
          <section class="rule-section">${rocketsSection()}</section>
          ${isSolo() ? `<section class="rule-section">${soloSection()}</section>` : ""}
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${faqSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the Point Galaxy rulebook. Point Galaxy is a game by Molly Johnson, Robert Melvin and Shawn Stankewich, illustrated by Dylan Mangini, published by Flatout Games and AEG.",
        "Guia pessoal de consulta baseado no livro de regras de Point Galaxy. Point Galaxy é um jogo de Molly Johnson, Robert Melvin e Shawn Stankewich, ilustrado por Dylan Mangini, publicado por Flatout Games e AEG."
      )}</p></footer>`;
  }

  function onClick(event) {
    const button = event.target instanceof Element ? event.target.closest("button") : null;
    if (!button || !root || !root.contains(button)) {
      return;
    }
    if (button.dataset.language) {
      state.language = button.dataset.language === "en-US" ? "en-US" : "pt-BR";
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

  function rerender() {
    const scrollY = window.scrollY;
    renderInto(root);
    window.scrollTo(0, scrollY);
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
      root.querySelector(".pg-page")?.prepend(notice);
    }
    notice.textContent = storageNoticeText();
  }

  function applyMatchChange(next) {
    const before = signature();
    state = normalizePreferences({ ...state, ...next });
    savePreferences();
    if (signature() !== before) {
      setupState = { signature: signature(), checks: [] };
      saveSetup();
    }
    rerender();
  }

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !root || !root.contains(target)) {
      return;
    }
    if (target.matches("[data-players]")) {
      const value = Number(target.dataset.players);
      if (PLAYERS.includes(value) && value !== state.players) {
        applyMatchChange({ players: value });
      }
      return;
    }
    if (target.matches("[data-difficulty]")) {
      const value = target.dataset.difficulty;
      if (DIFFICULTIES.includes(value) && value !== state.difficulty) {
        applyMatchChange({ difficulty: value });
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

  window.PointGalaxy = { renderInto, onClick, onChange };
})();
