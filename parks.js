(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.parks.v1";
  const SETUP_KEY = "field-manual.parks.setup.v1";
  const MANUAL_FILE = "parks_core.pdf";
  const ASSETS = "assets/parks/";
  const ICONS = `${ASSETS}icons/`;
  const ART = `${ASSETS}art/`;
  // The PDF stores two printed pages per PDF page: PDF 1 = cover, PDF 2 = printed pp. 1–2,
  // PDF 3 = pp. 3–4, PDF 4 = pp. 5–6, PDF 5 = pp. 7–8, PDF 6 = pp. 9–10, PDF 7 = solo reference.
  // Every link and "p." reference in this guide uses the PDF page number.
  const PLAYERS = [1, 2, 3, 4, 5];
  const YEAR_MODES = ["choose", "first"];
  const defaults = { language: "pt-BR", players: 2, year: "choose" };
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
      year: YEAR_MODES.includes(saved?.year) ? saved.year : defaults.year
    };
  }

  function signature(source = state) {
    return `${source.players}|${source.year}`;
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Parks preferences.", error);
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
      console.error("Could not read Parks setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Parks preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Parks setup progress.", error);
    }
  }

  // ---------- derived match values ----------

  function isSolo(players = state.players) {
    return players === 1;
  }

  function isLarge(players = state.players) {
    return players >= 4;
  }

  function basicCount(players = state.players) {
    return isLarge(players) ? 6 : 5;
  }

  function trailLength(season, players = state.players) {
    return basicCount(players) + season;
  }

  function discountSlots(players = state.players) {
    if (isSolo(players)) {
      return 0;
    }
    return isLarge(players) ? 2 : 1;
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function manualUrl(page) {
    const script = document.querySelector('script[src*="parks.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${MANUAL_FILE}`, baseUrl).href}#page=${page}`;
  }

  function referenceLink(page) {
    return `<a class="source-link" href="${manualUrl(page)}" target="_blank" rel="noreferrer">${t(`Rules PDF p. ${page} ↗`, `Regras PDF p. ${page} ↗`)}</a>`;
  }

  function sectionHeading(id, title, index, pages) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("TRAIL GUIDE", "GUIA DA TRILHA")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="pk-section-references">${pages.map(referenceLink).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
  }

  function glyphLabel(name) {
    return {
      forest: t("Forest token", "Ficha de Floresta"),
      mountain: t("Mountain token", "Ficha de Montanha"),
      sunshine: t("Sunshine token", "Ficha de Sol"),
      water: t("Water token", "Ficha de Água"),
      wildlife: t("Wildlife token", "Ficha de Vida Selvagem"),
      photo: t("Photo", "Foto"),
      camera: t("Camera", "Câmera"),
      "first-hiker": t("First Hiker Marker", "Marcador de Primeiro Caminhante"),
      "draw-canteen": t("Draw a Canteen card", "Comprar uma carta de Cantil"),
      "filled-canteen": t("Canteen in a player's area", "Cantil na área de um jogador"),
      campfire: t("Campfire", "Fogueira"),
      trailhead: t("Trailhead", "Início da Trilha"),
      "trail-end": t("Trail End", "Fim da Trilha"),
      "basic-site": t("Trail Site symbol", "Símbolo de Local da Trilha"),
      "advanced-site": t("Advanced Site symbol", "Símbolo de Local Avançado"),
      season: t("Season", "Estação"),
      year: t("Year card", "Carta de Ano"),
      "weather-pattern": t("Weather Pattern", "Padrão Climático"),
      solo: t("Solo", "Solo"),
      instant: t("Instant action", "Ação instantânea"),
      "token-symbol": t("Token symbol: any token", "Símbolo de ficha: qualquer ficha"),
      "site-parks": t("Parks Site", "Local de Parques"),
      "site-gear": t("Buy Gear", "Comprar Equipamento"),
      "site-photo": t("Photo action", "Ação de Foto"),
      "site-exchange": t("Exchange ×2 Site", "Local de Troca ×2"),
      "site-wildlife": t("Wildlife Site", "Local de Vida Selvagem"),
      "site-river": t("River Site", "Local do Rio"),
      "site-two-sunshine": t("Two Sunshine Site", "Local de dois Sóis"),
      "site-two-water": t("Two Water Site", "Local de duas Águas"),
      "site-sun-water": t("Sunshine + Water Site (4+)", "Local de Sol + Água (4+)"),
      "last-hiker": t("Last Hiker on the Trail", "Último Caminhante na Trilha")
    }[name] || name;
  }

  function glyph(name) {
    const label = glyphLabel(name);
    return `<img class="pk-glyph" src="${ICONS}${name}.webp" alt="${label}" title="${label}">`;
  }

  function iconCard(file, titleEn, bodyEn, titlePt, bodyPt, pages, wide = false) {
    const title = t(titleEn, titlePt);
    const list = Array.isArray(pages) ? pages : [pages];
    return `
      <article class="icon-card${wide ? " pk-icon-wide" : ""}">
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
    return `<figure class="pk-art"><img src="${ART}${file}.webp" alt="${alt}" loading="lazy"><figcaption>${alt}</figcaption></figure>`;
  }

  function interpretation(en, pt) {
    return `<span class="pk-interpretation">${t("Guide's reading", "Leitura do guia")}</span> ${t(en, pt)}`;
  }

  function playersLabel(players = state.players) {
    return players === 1 ? t("Solo (1 player)", "Solo (1 jogador)") : t(`${players} players`, `${players} jogadores`);
  }

  function yearName(value = state.year) {
    return value === "first"
      ? t("First game: 1 Year card each", "Primeira partida: 1 carta de Ano cada")
      : t("Standard: deal 2, keep 1", "Padrão: receber 2, ficar com 1");
  }

  function matchSummary() {
    return `${playersLabel()} · ${state.year === "first" ? t("first game", "primeira partida") : t("standard Year cards", "cartas de Ano padrão")}`;
  }

  function trailLengths() {
    return [1, 2, 3, 4].map((season) => trailLength(season)).join(" / ");
  }

  // ---------- header ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["victory", t("Scoring & winning", "Pontuação e vitória")],
      ["turns", t("Turns & Trail Sites", "Turnos e Locais")],
      ["trail-end", t("At the Trail End", "No Fim da Trilha")],
      ["details", t("Canteens, Photos, Campfires", "Cantis, Fotos, Fogueiras")],
      ["seasons", t("Seasons", "Estações")],
      isSolo() ? ["solo", t("Solo mode", "Modo solo")] : null,
      ["icons", t("Iconography", "Iconografia")],
      ["examples", t("Examples", "Exemplos")],
      ["faq", t("Common questions", "Perguntas comuns")],
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
          <span class="brand-mark" aria-hidden="true">PK</span>
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
      `${readFailed ? "This browser could not read the saved match or setup progress for this game; defaults are shown. " : ""}${writeFailed ? "The latest change could not be saved and is visible on screen only." : ""}`,
      `${readFailed ? "Este navegador não conseguiu ler a partida ou o progresso da preparação salvos deste jogo; as opções padrão estão sendo mostradas. " : ""}${writeFailed ? "A alteração mais recente não pôde ser salva e aparece somente na tela." : ""}`
    ).trim();
  }

  // ---------- configuration ----------

  function choiceCard(name, value, dataAttr, checked, title, description) {
    return `
      <label class="pk-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" ${dataAttr} ${checked ? "checked" : ""}>
        <span class="pk-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function playerChoiceText(players) {
    if (isSolo(players)) {
      return t(
        "You hike against two Park Rangers driven by the Gear deck. Adds the Ranger Tracker and 8 solo event cards, the Trail End on its SOLO side, no Gear revealed at setup and no Gear discount. You start with the Camera and the First Hiker Marker. Trails of 6 / 7 / 8 / 9 Sites; scored against a rating scale.",
        "Você caminha contra dois Guardas-parque movidos pelo baralho de Equipamento. Acrescenta o Rastreador dos Guardas e 8 cartas de evento solo, o Fim da Trilha no lado SOLO, nenhum Equipamento revelado na preparação e nenhum desconto de Equipamento. Você começa com a Câmera e o Marcador de Primeiro Caminhante. Trilhas de 6 / 7 / 8 / 9 Locais; pontuação comparada a uma escala."
      );
    }
    if (isLarge(players)) {
      return t(
        `Adds the 6th Basic Site (Sunshine + Water, marked 4+) to every Trail, so Trails have ${[1, 2, 3, 4].map((s) => trailLength(s, players)).join(" / ")} Sites. At the Trail End, the first two Hikers to Buy Gear each get a 1 Sunshine discount. ${players * 2} Hikers on the Trail.`,
        `Acrescenta o 6º Local Básico (Sol + Água, marcado 4+) a todas as Trilhas, que têm ${[1, 2, 3, 4].map((s) => trailLength(s, players)).join(" / ")} Locais. No Fim da Trilha, os dois primeiros Caminhantes a Comprar Equipamento ganham 1 Sol de desconto cada. ${players * 2} Caminhantes na Trilha.`
      );
    }
    return t(
      `The Sunshine + Water Site (4+) goes back to the box. Trails have ${[1, 2, 3, 4].map((s) => trailLength(s, players)).join(" / ")} Sites. At the Trail End, only the first Hiker to Buy Gear gets a 1 Sunshine discount. ${players * 2} Hikers on the Trail.`,
      `O Local de Sol + Água (4+) volta para a caixa. As Trilhas têm ${[1, 2, 3, 4].map((s) => trailLength(s, players)).join(" / ")} Locais. No Fim da Trilha, só o primeiro Caminhante a Comprar Equipamento ganha 1 Sol de desconto. ${players * 2} Caminhantes na Trilha.`
    );
  }

  function matchConfiguration() {
    return `
      <section class="controls-panel pk-config" id="build-match" aria-labelledby="pk-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="pk-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "The supplied rulebook has no expansions. Two choices change the setup and rules: the number of players (solo mode and 4–5 players change the Trail and the Gear discount) and how Year cards are dealt. Player colours are chosen at the table in setup, so they are not stored here.",
              "O livro de regras fornecido não tem expansões. Duas escolhas mudam a preparação e as regras: o número de jogadores (o modo solo e 4–5 jogadores mudam a Trilha e o desconto de Equipamento) e como as cartas de Ano são distribuídas. As cores dos jogadores são escolhidas à mesa na preparação, por isso não ficam salvas aqui."
            )}</p>
          </div>
        </div>
        <fieldset class="pk-choice-group">
          <legend>${t("Players · selected:", "Jogadores · selecionado:")} <span>${playersLabel()}</span></legend>
          <p class="pk-choice-intro">${t("Box: 1 to 5 players. Each player controls two Hikers of one colour.", "Caixa: de 1 a 5 jogadores. Cada jogador controla dois Caminhantes de uma cor.")} ${referenceLink(2)} ${referenceLink(6)}</p>
          <div class="pk-choice-grid pk-choice-grid-players">
            ${PLAYERS.map((players) => choiceCard("pk-players", players, `data-players="${players}"`, state.players === players, playersLabel(players), playerChoiceText(players))).join("")}
          </div>
        </fieldset>
        <fieldset class="pk-choice-group">
          <legend>${t("Year cards (Personal Bonus) · selected:", "Cartas de Ano (Bônus Pessoal) · selecionado:")} <span>${yearName()}</span></legend>
          <p class="pk-choice-intro">${t(
            "Each player has one secret Year card: a personal goal worth 2 or 3 extra points at the end. The rulebook suggests dealing just one in your first game.",
            "Cada jogador tem uma carta de Ano secreta: um objetivo pessoal que vale 2 ou 3 pontos extras no final. O livro sugere distribuir só uma na primeira partida."
          )} ${referenceLink(2)} ${referenceLink(5)}</p>
          <div class="pk-choice-grid">
            ${choiceCard("pk-year", "choose", 'data-year="choose"', state.year === "choose", yearName("choose"), t(
              "Deal 2 Year cards to each player. Each keeps 1 face down as their Personal Bonus and discards the other face down. Unused cards go back to the box face down.",
              "Distribua 2 cartas de Ano a cada jogador. Cada um fica com 1 virada para baixo como Bônus Pessoal e descarta a outra virada para baixo. As cartas não usadas voltam para a caixa viradas para baixo."
            ))}
            ${choiceCard("pk-year", "first", 'data-year="first"', state.year === "first", yearName("first"), t(
              "Recommended for your first game: deal just 1 Year card to each player, kept face down. No choice to make. Unused cards go back to the box face down.",
              "Recomendado para a primeira partida: distribua só 1 carta de Ano a cada jogador, mantida virada para baixo. Não há escolha a fazer. As cartas não usadas voltam para a caixa viradas para baixo."
            ))}
          </div>
        </fieldset>
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function setupPhases() {
    const solo = isSolo();
    const players = state.players;
    const phases = [
      {
        id: "board",
        title: t("Board and token supply", "Tabuleiro e reserva de fichas"),
        pages: [2],
        items: [
          t(`Place the tri-fold board ${solo ? "in front of you" : "between all players"}. Its areas: Canteens (top left), Parks area (top), Seasons (left), Upkeep (bottom left) and Gear area (bottom).`, `Coloque o tabuleiro dobrável ${solo ? "à sua frente" : "entre todos os jogadores"}. Suas áreas: Cantis (canto superior esquerdo), área de Parques (em cima), Estações (à esquerda), Manutenção (canto inferior esquerdo) e área de Equipamento (embaixo).`),
          t("Place the two token trays to the left and right of the board, within everyone's reach, and return their lids to the box.", "Coloque as duas bandejas de fichas à esquerda e à direita do tabuleiro, ao alcance de todos, e devolva as tampas à caixa."),
          t(`Each tray holds every token type and Photos; together they form the supply: 16 Forest ${glyph("forest")}, 16 Mountain ${glyph("mountain")}, 30 Sunshine ${glyph("sunshine")}, 30 Water ${glyph("water")}, 12 Wildlife ${glyph("wildlife")} and 28 Photos ${glyph("photo")}.`, `Cada bandeja guarda todos os tipos de ficha e as Fotos; juntas elas formam a reserva: 16 Florestas ${glyph("forest")}, 16 Montanhas ${glyph("mountain")}, 30 Sóis ${glyph("sunshine")}, 30 Águas ${glyph("water")}, 12 Vidas Selvagens ${glyph("wildlife")} e 28 Fotos ${glyph("photo")}.`)
        ],
        art: ["board-areas", t("Rulebook PDF p. 2: the board areas — Canteens, Parks area, Seasons, Upkeep, Gear area", "Livro PDF p. 2: as áreas do tabuleiro — Cantis, área de Parques, Estações, Manutenção, área de Equipamento")]
      },
      {
        id: "decks",
        title: t("Parks and Gear decks", "Baralhos de Parques e de Equipamento"),
        pages: [2, 6],
        items: [
          t("Shuffle the 48 Park cards (large tarot-size cards) face down. Deal 3 face up into the top Park slots of the board and place the deck on the Parks deck area, top right.", "Embaralhe as 48 cartas de Parque (as cartas grandes, tamanho tarô) viradas para baixo. Revele 3 nas casas de Parque do alto do tabuleiro e coloque o baralho na área do baralho de Parques, no canto superior direito."),
          solo
            ? t("Shuffle the 36 Gear cards face down and place the deck on its area, bottom right. Solo: do NOT reveal any Gear cards — the Rangers fill the Gear slots during play.", "Embaralhe as 36 cartas de Equipamento viradas para baixo e coloque o baralho na sua área, no canto inferior direito. Solo: NÃO revele nenhuma carta de Equipamento — os Guardas preenchem as casas de Equipamento durante a partida.")
            : t("Shuffle the 36 Gear cards face down. Deal 3 face up into the bottom Gear slots of the board and place the deck on the Gear deck area, bottom right.", "Embaralhe as 36 cartas de Equipamento viradas para baixo. Revele 3 nas casas de Equipamento de baixo do tabuleiro e coloque o baralho na área do baralho de Equipamento, no canto inferior direito.")
        ]
      },
      {
        id: "canteens",
        title: t("Starting Canteens", "Cantis iniciais"),
        pages: [2],
        items: [
          t("Shuffle the 15 Canteen cards face down.", "Embaralhe as 15 cartas de Cantil viradas para baixo."),
          t(`Deal 1 face up to ${solo ? "yourself" : "each player"}: this is ${solo ? "your" : "their"} starting Canteen, placed in front of ${solo ? "you" : "them"}.`, `Distribua 1 virada para cima ${solo ? "para você" : "para cada jogador"}: é o Cantil inicial, colocado à ${solo ? "sua" : "sua"} frente.`),
          t("Place the rest of the Canteen deck on its area, top left of the board.", "Coloque o resto do baralho de Cantis na sua área, no canto superior esquerdo do tabuleiro.")
        ]
      },
      {
        id: "year",
        title: t(`Year cards · ${yearName()}`, `Cartas de Ano · ${yearName()}`),
        pages: [2, 5],
        items: [
          t("Shuffle the 12 Year cards.", "Embaralhe as 12 cartas de Ano."),
          state.year === "first"
            ? t(`First game: deal 1 Year card face down to ${solo ? "yourself" : "each player"}. It is ${solo ? "your" : "that player's"} Personal Bonus.`, `Primeira partida: distribua 1 carta de Ano virada para baixo ${solo ? "para você" : "para cada jogador"}. Ela é o Bônus Pessoal ${solo ? "seu" : "desse jogador"}.`)
            : t(`Deal 2 Year cards to ${solo ? "yourself" : "each player"}. ${solo ? "Choose" : "Each player secretly chooses"} 1 as the Personal Bonus for the Year and discards the other face down.`, `Distribua 2 cartas de Ano ${solo ? "para você" : "para cada jogador"}. ${solo ? "Escolha" : "Cada jogador escolhe em segredo"} 1 como Bônus Pessoal do Ano e descarta a outra virada para baixo.`),
          t("Keep your Year card face down until it is scored at the end of the game. Return all unused Year cards face down to the box.", "Mantenha a sua carta de Ano virada para baixo até ela ser pontuada no fim da partida. Devolva à caixa todas as cartas de Ano não usadas, viradas para baixo.")
        ]
      },
      {
        id: "seasons",
        title: t("Season deck and first Season", "Baralho de Estações e primeira Estação"),
        pages: [2, 3],
        items: [
          t(`Shuffle the 10 Season cards ${glyph("season")} and place the deck on the Season area of the board.`, `Embaralhe as 10 cartas de Estação ${glyph("season")} e coloque o baralho na área de Estação do tabuleiro.`),
          t("Reveal the top card: it is the first Season. Read its Season effect (top of the card) — it changes play for this round — and check whether it asks for an immediate action.", "Revele a carta do topo: ela é a primeira Estação. Leia o efeito da Estação (no alto da carta) — ele muda o jogo nesta rodada — e veja se ele pede uma ação imediata."),
          t("The game lasts 4 Seasons: only 4 of the 10 Season cards are revealed; the rest stay in the deck.", "A partida dura 4 Estações: só 4 das 10 cartas de Estação são reveladas; as demais ficam no baralho.")
        ]
      },
      {
        id: "trail",
        title: t(`First Trail (${trailLength(1)} Sites)`, `Primeira Trilha (${trailLength(1)} Locais)`),
        pages: [2],
        items: [
          t(`Below the board, place the Trailhead tile ${glyph("trailhead")} on the far left.`, `Abaixo do tabuleiro, coloque a peça de Início da Trilha ${glyph("trailhead")} na extrema esquerda.`),
          t(`Gather the 5 Basic Site tiles: they show only ${glyph("basic-site")} in the bottom-right corner. Advanced Sites show ${glyph("advanced-site")} (a * next to the symbol).`, `Separe as 5 peças de Local Básico: elas mostram só ${glyph("basic-site")} no canto inferior direito. Os Locais Avançados mostram ${glyph("advanced-site")} (um * junto ao símbolo).`),
          isLarge()
            ? t(`${players} players: add the Sunshine + Water Site ${glyph("site-sun-water")} (marked 4+ in the bottom right) to the Basic Sites — 6 Basic Sites.`, `${players} jogadores: acrescente o Local de Sol + Água ${glyph("site-sun-water")} (marcado 4+ no canto inferior direito) aos Locais Básicos — 6 Locais Básicos.`)
            : t(`${solo ? "Solo" : `${players} players`}: return the Sunshine + Water Site ${glyph("site-sun-water")} (marked 4+) to the box.`, `${solo ? "Solo" : `${players} jogadores`}: devolva à caixa o Local de Sol + Água ${glyph("site-sun-water")} (marcado 4+).`),
          t(`Shuffle the 4 Advanced Site tiles and add 1 of them to the Basic Sites: this is the Trail deck (${trailLength(1)} tiles). Place the other 3 Advanced Sites face down to the left of the Trailhead.`, `Embaralhe as 4 peças de Local Avançado e acrescente 1 delas aos Locais Básicos: este é o baralho da Trilha (${trailLength(1)} peças). Coloque os outros 3 Locais Avançados virados para baixo à esquerda do Início da Trilha.`),
          t("Shuffle the Trail deck and reveal one Site at a time, placing the first directly to the right of the Trailhead and each next one to the right of the previous one, until all are face up.", "Embaralhe o baralho da Trilha e revele um Local de cada vez, pondo o primeiro logo à direita do Início da Trilha e cada um seguinte à direita do anterior, até todos estarem virados para cima."),
          solo
            ? t(`Place the Trail End ${glyph("trail-end")} to the right of the last Site, on its SOLO side ${glyph("solo")} (the solo icon in the bottom right).`, `Coloque o Fim da Trilha ${glyph("trail-end")} à direita do último Local, no lado SOLO ${glyph("solo")} (o ícone solo no canto inferior direito).`)
            : t(`Place the Trail End ${glyph("trail-end")} to the right of the last Site. Make sure it is NOT on the side showing the SOLO icon ${glyph("solo")} in the bottom right.`, `Coloque o Fim da Trilha ${glyph("trail-end")} à direita do último Local. Confira que ele NÃO está no lado que mostra o ícone SOLO ${glyph("solo")} no canto inferior direito.`)
        ],
        art: ["trail-setup", t("Rulebook PDF p. 2: a first-Season Trail — Trailhead on the left, the shuffled Sites, the Trail End on the right", "Livro PDF p. 2: uma Trilha da primeira Estação — Início da Trilha à esquerda, os Locais embaralhados, o Fim da Trilha à direita")]
      },
      solo
        ? {
          id: "hikers",
          title: t("Your Hikers and the Rangers", "Seus Caminhantes e os Guardas"),
          pages: [6],
          items: [
            t(`Choose your colour: take its 2 Hikers and its Campfire ${glyph("campfire")}, placed lit side up in front of you.`, `Escolha a sua cor: pegue os 2 Caminhantes e a Fogueira ${glyph("campfire")} dela, posta com o lado aceso para cima à sua frente.`),
            t("Choose another colour for the Rangers: take its 2 Hikers — they are the 2 Park Rangers. Rangers do not need a Campfire.", "Escolha outra cor para os Guardas: pegue os 2 Caminhantes dela — eles são os 2 Guardas-parque. Os Guardas não precisam de Fogueira."),
            t(`Place your 2 Hikers and the 2 Rangers on the Trailhead ${glyph("trailhead")}.`, `Coloque os seus 2 Caminhantes e os 2 Guardas no Início da Trilha ${glyph("trailhead")}.`),
            t(`You begin the game with the Camera ${glyph("camera")} and the First Hiker Marker ${glyph("first-hiker")}.`, `Você começa a partida com a Câmera ${glyph("camera")} e o Marcador de Primeiro Caminhante ${glyph("first-hiker")}.`),
            t("Return the unused Hikers and Campfires to the box.", "Devolva à caixa os Caminhantes e Fogueiras não usados.")
          ]
        }
        : {
          id: "hikers",
          title: t(`Player colours (${players} × 2 Hikers)`, `Cores dos jogadores (${players} × 2 Caminhantes)`),
          pages: [2],
          items: [
            t(`Each player chooses a colour, takes the 2 Hikers of that colour and places them on the Trailhead ${glyph("trailhead")}.`, `Cada jogador escolhe uma cor, pega os 2 Caminhantes dessa cor e os coloca no Início da Trilha ${glyph("trailhead")}.`),
            t(`Each player takes the Campfire ${glyph("campfire")} matching their Hikers and places it lit side up in front of them.`, `Cada jogador pega a Fogueira ${glyph("campfire")} da cor dos seus Caminhantes e a coloca com o lado aceso para cima à sua frente.`),
            t(`Give the First Hiker Marker ${glyph("first-hiker")} to the player who most recently took a hike.`, `Dê o Marcador de Primeiro Caminhante ${glyph("first-hiker")} ao jogador que fez uma trilha mais recentemente.`),
            t(`Give the Camera ${glyph("camera")} to the player to the right of the First Hiker (the last player in turn order).`, `Dê a Câmera ${glyph("camera")} ao jogador à direita do Primeiro Caminhante (o último na ordem de jogo).`),
            t(`Return the unused Hikers and Campfires (${5 - players} colour${5 - players === 1 ? "" : "s"}) to the box.`, `Devolva à caixa os Caminhantes e Fogueiras não usados (${5 - players} cor${5 - players === 1 ? "" : "es"}).`)
          ]
        }
    ];
    if (solo) {
      phases.push({
        id: "solo-deck",
        title: t("Ranger Tracker and solo deck", "Rastreador dos Guardas e baralho solo"),
        pages: [6, 7],
        items: [
          t(`Take the 9 Solo cards ${glyph("solo")}. Place the Ranger Tracker card from that deck next to your play area. It has two rows: the top for Sunshine ${glyph("sunshine")}, the bottom for Water ${glyph("water")}.`, `Pegue as 9 cartas Solo ${glyph("solo")}. Coloque a carta do Rastreador dos Guardas desse baralho ao lado da sua área de jogo. Ela tem duas linhas: a de cima para Sol ${glyph("sunshine")}, a de baixo para Água ${glyph("water")}.`),
          t("Shuffle the remaining Solo cards into the SOLO deck and place it near the Tracker.", "Embaralhe as outras cartas Solo formando o baralho SOLO e coloque-o perto do Rastreador."),
          t("Reveal the top card so its colours line up with the Tracker: its two events (one per row) are the upcoming events that may happen.", "Revele a carta do topo de modo que as cores se alinhem com o Rastreador: os seus dois eventos (um por linha) são os próximos eventos que podem acontecer.")
        ],
        art: ["solo-tracker", t("Rulebook PDF p. 6: the Ranger Tracker (Sunshine row on top, Water row below) with a revealed solo event card lined up beside it", "Livro PDF p. 6: o Rastreador dos Guardas (linha de Sol em cima, linha de Água embaixo) com uma carta de evento solo revelada alinhada ao lado")]
      });
    }
    phases.push({
      id: "weather",
      title: t("Weather Pattern and first turn", "Padrão Climático e primeiro turno"),
      pages: [3, 5],
      items: [
        t(`Look at the Weather Pattern ${glyph("weather-pattern")} on the bottom right of the Season card: a short sequence of tokens.`, `Veja o Padrão Climático ${glyph("weather-pattern")} no canto inferior direito da carta de Estação: uma curta sequência de fichas.`),
        t(`Starting with the 2nd Trail Site (the Trailhead is not a Site; the Site after it is the 1st), take the indicated tokens from the supply and place them on the Trail, one per Site, from left to right. Repeat the pattern down the Trail and stop at the Trail End: ${trailLength(1) - 1} tokens this Season.`, `A partir do 2º Local da Trilha (o Início da Trilha não é um Local; o Local depois dele é o 1º), pegue da reserva as fichas indicadas e coloque-as na Trilha, uma por Local, da esquerda para a direita. Repita o padrão ao longo da Trilha e pare no Fim da Trilha: ${trailLength(1) - 1} fichas nesta Estação.`),
        t("If the Season is Rain or Splendor, also place one token of its type (Water or Sunshine) on top of each of the 3 Parks on the board, as its card shows.", "Se a Estação for de Chuva (Rain) ou de Esplendor (Splendor), coloque também uma ficha do seu tipo (Água ou Sol) em cima de cada um dos 3 Parques do tabuleiro, como mostra a carta."),
        solo
          ? interpretation("the rulebook only says turns alternate between you and the Rangers; you start, as you hold the First Hiker Marker.", "o livro só diz que os turnos alternam entre você e os Guardas; você começa, pois tem o Marcador de Primeiro Caminhante.")
          : t(`The player with the First Hiker Marker ${glyph("first-hiker")} takes the first turn; play goes clockwise.`, `O jogador com o Marcador de Primeiro Caminhante ${glyph("first-hiker")} faz o primeiro turno; o jogo segue em sentido horário.`)
      ],
      art: ["weather-example", t("Rulebook PDF p. 3: Weather Pattern example — the pattern Sunshine, Water, Sunshine begins on the 2nd Trail Site and repeats until the Trail End", "Livro PDF p. 3: exemplo de Padrão Climático — o padrão Sol, Água, Sol começa no 2º Local da Trilha e se repete até o Fim da Trilha")]
    });
    return phases;
  }

  function inventory() {
    const solo = isSolo();
    const players = state.players;
    const boxLines = [
      solo || !isLarge() ? t("The Sunshine + Water Site (4+).", "O Local de Sol + Água (4+).") : null,
      t(`3 Advanced Sites wait face down left of the Trailhead (one joins the Trail each new Season).`, `3 Locais Avançados aguardam virados para baixo à esquerda do Início da Trilha (um entra na Trilha a cada nova Estação).`),
      t(`Year cards: ${12 - (state.year === "first" ? players : players * 2)} never dealt${state.year === "choose" ? ` + ${players} discarded` : ""}, face down.`, `Cartas de Ano: ${12 - (state.year === "first" ? players : players * 2)} não distribuídas${state.year === "choose" ? ` + ${players} descartadas` : ""}, viradas para baixo.`),
      solo ? t("3 unused colours of Hikers and Campfires, plus the Rangers' Campfire.", "3 cores não usadas de Caminhantes e Fogueiras, mais a Fogueira dos Guardas.") : t(`${5 - players} unused colour${5 - players === 1 ? "" : "s"} of Hikers and Campfires.`, `${5 - players} cor${5 - players === 1 ? "" : "es"} não usada${5 - players === 1 ? "" : "s"} de Caminhantes e Fogueiras.`),
      solo ? null : t("The 9 Solo cards (Ranger Tracker + 8 event cards).", "As 9 cartas Solo (Rastreador dos Guardas + 8 cartas de evento).")
    ];
    const cardsHtml = [
      infoCard(t("SHARED", "COMPARTILHADO"), t("Board and Trail", "Tabuleiro e Trilha"), [
        rl("Parks", "3 face up + the deck (48 cards).", "Parques", "3 virados para cima + o baralho (48 cartas)."),
        rl("Gear", solo ? "deck only; no card revealed." : "3 face up + the deck (36 cards).", "Equipamento", solo ? "só o baralho; nenhuma carta revelada." : "3 virados para cima + o baralho (36 cartas)."),
        rl("Canteens", "deck, top left (15 minus the starting ones).", "Cantis", "baralho, canto superior esquerdo (15 menos os iniciais)."),
        rl("Seasons", "deck of 10, top card revealed.", "Estações", "baralho de 10, carta do topo revelada."),
        rl("Trail", `Trailhead + ${trailLength(1)} Sites + Trail End${solo ? " (SOLO side)" : ""}.`, "Trilha", `Início da Trilha + ${trailLength(1)} Locais + Fim da Trilha${solo ? " (lado SOLO)" : ""}.`),
        rl("Weather", `${trailLength(1) - 1} tokens on Sites 2 to ${trailLength(1)}.`, "Clima", `${trailLength(1) - 1} fichas nos Locais 2 a ${trailLength(1)}.`)
      ], [2, 3]),
      infoCard(solo ? t("YOU", "VOCÊ") : t(`PER PLAYER · ×${players}`, `POR JOGADOR · ×${players}`), t("Your area", "Sua área"), [
        rl("Hikers", "2 of your colour, on the Trailhead.", "Caminhantes", "2 da sua cor, no Início da Trilha."),
        rl("Campfire", "1, lit side up.", "Fogueira", "1, lado aceso para cima."),
        rl("Canteen", "1 starting Canteen, face up.", "Cantil", "1 Cantil inicial, virado para cima."),
        rl("Year card", "1, face down (Personal Bonus).", "Carta de Ano", "1, virada para baixo (Bônus Pessoal)."),
        solo ? rl("Markers", "Camera and First Hiker Marker.", "Marcadores", "Câmera e Marcador de Primeiro Caminhante.") : rl("Markers", "First Hiker Marker to the most recent hiker; Camera to the player on their right.", "Marcadores", "Marcador de Primeiro Caminhante a quem fez trilha mais recentemente; Câmera ao jogador à direita dele."),
        rl("Tokens", "none at the start.", "Fichas", "nenhuma no início.")
      ], [2, 6]),
      solo ? infoCard(t("RANGERS", "GUARDAS"), t("Solo opponents", "Adversários do solo"), [
        rl("Rangers", "2 Hikers of a second colour, on the Trailhead; no Campfire.", "Guardas", "2 Caminhantes de uma segunda cor, no Início da Trilha; sem Fogueira."),
        rl("Ranger Tracker", "1 card, next to your area.", "Rastreador dos Guardas", "1 carta, ao lado da sua área."),
        rl("SOLO deck", "8 event cards, top card revealed beside the Tracker.", "Baralho SOLO", "8 cartas de evento, carta do topo revelada ao lado do Rastreador.")
      ], [6, 7]) : "",
      infoCard(t("SUPPLY", "RESERVA"), t("Token trays", "Bandejas de fichas"), [
        `${glyph("forest")} 16 · ${glyph("mountain")} 16 · ${glyph("sunshine")} 30 · ${glyph("water")} 30`,
        `${glyph("wildlife")} 12 ${t("Wildlife (12 shapes)", "Vidas Selvagens (12 formatos)")} · ${glyph("photo")} 28 ${t("Photos (1 point each)", "Fotos (1 ponto cada)")}`
      ], [2]),
      infoCard(t("IN THE BOX", "NA CAIXA"), t("Not in play now", "Fora de jogo agora"), boxLines, [2])
    ];
    return `<div class="quick-grid">${cardsHtml.join("")}</div>`;
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
        <label class="pk-setup-check" for="pk-setup-${phase.id}">
          <input id="pk-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="pk-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="pk-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
        ${phase.art ? `<div class="pk-art-row">${figure(phase.art[0], phase.art[1])}</div>` : ""}
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), sectionIndex("setup"), isSolo() ? [2, 3, 6] : [2, 3])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Prepare this hike", "Prepare esta trilha")} · ${matchSummary()}</h3>
            <p>${t("One checkbox per coherent step. Year cards stay secret: the checklist never records them.", "Uma caixa por etapa coerente. As cartas de Ano ficam secretas: a lista nunca as registra.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved separately from the match configuration and language. Changing the player count or the Year-card option clears this checklist; changing the language does not. “Uncheck all” clears only these setup boxes.",
          "O progresso é salvo separadamente da configuração da partida e do idioma. Trocar o número de jogadores ou a opção das cartas de Ano limpa esta lista; trocar o idioma não. “Desmarcar tudo” limpa somente as caixas da preparação."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}`;
  }

  // ---------- quick reference ----------

  function gearDiscountLine() {
    if (isSolo()) {
      return rl("Discount", "none in solo.", "Desconto", "nenhum no solo.");
    }
    return isLarge()
      ? rl("Discount", "the first two Hikers to Buy Gear each Season (the two Sunshine slots) pay 1 Sunshine less.", "Desconto", "os dois primeiros Caminhantes a Comprar Equipamento na Estação (as duas casas de Sol) pagam 1 Sol a menos.")
      : rl("Discount", "the first Hiker to Buy Gear each Season (the Sunshine slot without 4+) pays 1 Sunshine less.", "Desconto", "o primeiro Caminhante a Comprar Equipamento na Estação (a casa de Sol sem 4+) paga 1 Sol a menos.");
  }

  function quickReference() {
    const solo = isSolo();
    const cards = [
      infoCard(t("YOUR TURN", "SEU TURNO"), t("Move one Hiker, take one action", "Mova um Caminhante, faça uma ação"), [
        rl("Move", "pick either of your Hikers and move it to any Site to its right (you may skip Sites), or to the Trail End.", "Mover", "escolha qualquer um dos seus Caminhantes e mova-o para qualquer Local à direita dele (pode pular Locais), ou para o Fim da Trilha."),
        rl("Act", "take the Site's action. You must be able to take it to visit the Site.", "Agir", "faça a ação do Local. Você precisa conseguir fazê-la para visitar o Local."),
        rl("Weather", "first Hiker to land on a Site with a weather token takes it as a bonus (usable right away).", "Clima", "o primeiro Caminhante a parar num Local com ficha de clima a pega como bônus (pode usá-la na hora)."),
        rl("Occupied", `a Site with any Hiker${solo ? " or Ranger" : ""} (even your own) needs your lit Campfire ${glyph("campfire")}: flip it to extinguished.`, "Ocupado", `um Local com qualquer Caminhante${solo ? " ou Guarda" : ""} (até seu) exige a sua Fogueira ${glyph("campfire")} acesa: vire-a para o lado apagado.`),
        rl("Limit", "at the end of your turn, discard down to 12 tokens.", "Limite", "no fim do seu turno, descarte até ficar com 12 fichas."),
        solo ? rl("Then", "the Rangers take a turn (see Solo).", "Depois", "os Guardas fazem um turno (veja Solo).") : rl("Then", "next player clockwise. A player whose 2 Hikers are at the Trail End is skipped.", "Depois", "próximo jogador em sentido horário. Quem tem os 2 Caminhantes no Fim da Trilha é pulado.")
      ], [3]),
      infoCard(t("BASIC SITES", "LOCAIS BÁSICOS"), t("Gain tokens", "Ganhe fichas"), [
        `${glyph("forest")} ${t("gain 1 Forest.", "ganhe 1 Floresta.")}`,
        `${glyph("mountain")} ${t("gain 1 Mountain.", "ganhe 1 Montanha.")}`,
        `${glyph("site-two-sunshine")} ${t("gain 2 Sunshine.", "ganhe 2 Sóis.")}`,
        `${glyph("site-two-water")} ${t("gain 2 Water.", "ganhe 2 Águas.")}`,
        `${glyph("draw-canteen")} ${t("draw a Canteen, <strong>or</strong>", "compre um Cantil, <strong>ou</strong>")} ${glyph("site-photo")} ${t("turn in 2 tokens (1 with the Camera) for a Photo and take the Camera.", "entregue 2 fichas (1 com a Câmera) por uma Foto e pegue a Câmera.")}`,
        isLarge() ? `${glyph("site-sun-water")} ${t("gain 1 Sunshine and 1 Water (4–5 players).", "ganhe 1 Sol e 1 Água (4–5 jogadores).")}` : null
      ], [3]),
      infoCard(t("ADVANCED SITES", "LOCAIS AVANÇADOS"), t("One more joins each Season", "Mais um entra a cada Estação"), [
        `${glyph("site-wildlife")} ${t("turn in any 1 token, gain 1 Wildlife.", "entregue 1 ficha qualquer, ganhe 1 Vida Selvagem.")}`,
        `${glyph("site-exchange")} ${t("turn in 1 token, gain any 1 token (not Wildlife); you may do it a second time.", "entregue 1 ficha, ganhe 1 ficha qualquer (não Vida Selvagem); pode repetir uma segunda vez.")}`,
        `${glyph("site-parks")} ${t("Reserve or Visit a Park, <strong>or</strong> Buy a Gear card.", "Reserve ou Visite um Parque, <strong>ou</strong> Compre uma carta de Equipamento.")}`,
        `${glyph("site-river")} ${t("turn in 1 Water to copy the action of another Site occupied by a Hiker.", "entregue 1 Água para copiar a ação de outro Local ocupado por um Caminhante.")}`
      ], [3]),
      infoCard(t("TRAIL END", "FIM DA TRILHA"), t("Relight, then choose one area", "Reacenda e escolha uma área"), [
        rl("Relight", "your Campfire, if extinguished.", "Reacender", "a sua Fogueira, se estiver apagada."),
        rl("Reserve a Park", `take one of the 3 board Parks or the top of the deck, place it horizontally in front of you. ${solo ? "" : `First Hiker here takes the First Hiker Marker ${glyph("first-hiker")}.`}`, "Reservar um Parque", `pegue um dos 3 Parques do tabuleiro ou o do topo do baralho e coloque-o na horizontal à sua frente. ${solo ? "" : `O primeiro Caminhante aqui pega o Marcador de Primeiro Caminhante ${glyph("first-hiker")}.`}`),
        rl("Buy Gear", "pay its cost in Sunshine for one of the 3 Gear cards.", "Comprar Equipamento", "pague o custo em Sol por uma das 3 cartas de Equipamento."),
        gearDiscountLine(),
        rl("Visit a Park", "pay the tokens shown on a board Park or one you reserved; place it vertically in your score area.", "Visitar um Parque", "pague as fichas mostradas num Parque do tabuleiro ou num reservado por você; coloque-o na vertical na sua área de pontos."),
        solo
          ? rl("Last ones", "both your Hikers at the Trail End → Rangers pulled there (no action); both Rangers there first → your remaining Hikers move there, one final action.", "Últimos", "seus dois Caminhantes no Fim da Trilha → Guardas puxados para lá (sem ação); os dois Guardas lá antes → seus Caminhantes restantes vão para lá, uma ação final.")
          : rl("Last Hiker", "when only one Hiker is left on the Trail, its owner must move it straight to the Trail End on their next turn.", "Último Caminhante", "quando só resta um Caminhante na Trilha, o dono deve levá-lo direto ao Fim da Trilha no próximo turno dele.")
      ], [4, 5]),
      infoCard(t("TOKENS", "FICHAS"), t("Canteens, Photos, Wildlife", "Cantis, Fotos, Vida Selvagem"), [
        rl("Canteen", `fill ${glyph("filled-canteen")} only with a Water gained THIS turn: put it on the Canteen instead of your supply and do the Canteen's action. It stays until Season end.`, "Cantil", `encha ${glyph("filled-canteen")} só com uma Água ganha NESTE turno: ponha-a no Cantil em vez de na sua reserva e faça a ação do Cantil. Ela fica até o fim da Estação.`),
        rl("Photo", `${glyph("photo")} = 1 point. Photo site: 2 tokens, or 1 with the Camera ${glyph("camera")}.`, "Foto", `${glyph("photo")} = 1 ponto. Local da Foto: 2 fichas, ou 1 com a Câmera ${glyph("camera")}.`),
        rl("Wildlife", `${glyph("wildlife")} replaces any token for Parks, Photos, Gear and the River — never for Canteens or the Exchange Site.`, "Vida Selvagem", `${glyph("wildlife")} substitui qualquer ficha em Parques, Fotos, Equipamento e no Rio — nunca em Cantis nem no Local de Troca.`),
        rl("Out of a token", "a Site whose token is out of the supply cannot be visited until some return.", "Ficha esgotada", "um Local cuja ficha acabou na reserva não pode ser visitado até algumas voltarem.")
      ], [3, 4, 5]),
      infoCard(t("SEASON END", "FIM DA ESTAÇÃO"), solo ? t("When everyone is at the Trail End", "Quando todos estão no Fim da Trilha") : t("When the last Hiker reaches the Trail End", "Quando o último Caminhante chega ao Fim da Trilha"), [
        rl("1 · Camera", `the Camera holder may turn in 1 token for a Photo.`, "1 · Câmera", "quem tem a Câmera pode entregar 1 ficha por uma Foto."),
        rl("2 · Canteens", "return all Water on Canteens to the supply.", "2 · Cantis", "devolva à reserva toda Água dos Cantis."),
        rl("3 · Hikers", `all ${solo ? "Hikers and Rangers" : "Hikers"} back to the Trailhead.`, "3 · Caminhantes", `todos os ${solo ? "Caminhantes e Guardas" : "Caminhantes"} voltam ao Início da Trilha.`),
        solo ? rl("Solo", "refill Park slots emptied by the Rangers.", "Solo", "reponha as casas de Parque esvaziadas pelos Guardas.") : null,
        rl("New Season", "Trail +1 Advanced Site, reshuffled; old Season card to the bottom, reveal the next; apply the Weather Pattern; First Hiker starts.", "Nova Estação", "Trilha +1 Local Avançado, reembaralhada; carta de Estação antiga para baixo do baralho, revele a próxima; aplique o Padrão Climático; o Primeiro Caminhante começa."),
        rl("Game end", "after the 4th Season's Photo step.", "Fim de jogo", "depois do passo da Foto da 4ª Estação.")
      ], [5])
    ];
    if (solo) {
      cards.push(infoCard(t("RANGERS' TURN", "TURNO DOS GUARDAS"), t("Flip a Gear card, move a Ranger", "Vire um Equipamento, mova um Guarda"), [
        rl("Flip", "top Gear card into a slot by cost: 1 → left, 2 → middle, 3 → right.", "Virar", "carta do topo do Equipamento numa casa pelo custo: 1 → esquerda, 2 → meio, 3 → direita."),
        rl("Which Ranger", "a Hiker ahead of both Rangers → the Front Ranger; a Ranger ahead of or tied with your Front Hiker → the Back Ranger.", "Qual Guarda", "um Caminhante à frente dos dois Guardas → o Guarda da Frente; um Guarda à frente ou empatado com o seu Caminhante da Frente → o Guarda de Trás."),
        rl("Move", "as many spaces as the Gear's cost; landing on a Hiker → skip to the next Site.", "Mover", "tantos espaços quanto o custo do Equipamento; parar num Caminhante → pula para o próximo Local."),
        rl("Weather", "a Ranger landing on a weather token puts it on the Tracker; 3 of a type → that row's event.", "Clima", "um Guarda que para numa ficha de clima a põe no Rastreador; 3 de um tipo → o evento dessa linha."),
        rl("Trail End", "slot by the cost of the Gear that brought it: 1 top, 2 middle, 3 bottom.", "Fim da Trilha", "casa pelo custo do Equipamento que o levou: 1 em cima, 2 no meio, 3 embaixo.")
      ], [7]));
    }
    cards.push(infoCard(t("SCORING", "PONTUAÇÃO"), t("After 4 Seasons", "Depois de 4 Estações"), [
      rl("Parks", "points printed on each visited Park.", "Parques", "pontos impressos em cada Parque visitado."),
      rl("Photos", "1 point each.", "Fotos", "1 ponto cada."),
      rl("Year", "reveal: 2 or 3 points depending on how well you met the goal.", "Ano", "revele: 2 ou 3 pontos conforme o objetivo cumprido."),
      rl("First Hiker Marker", "1 point to whoever holds it.", "Marcador de Primeiro Caminhante", "1 ponto para quem o tiver."),
      solo ? rl("Rating", "under 20 · 20–24 · 25–29 · 30+.", "Avaliação", "menos de 20 · 20–24 · 25–29 · 30+.") : rl("Tie", "most Parks visited; still tied → shared win.", "Empate", "mais Parques visitados; ainda empatado → vitória compartilhada.")
    ], [5, 6]));
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), sectionIndex("quick-reference"), [3, 4, 5])}
      <div class="callout">${t(
        `Over 4 Seasons, each ${solo ? "of your" : "player's"} two Hikers walk a Trail of Sites that grows by one Site per Season (${trailLengths()} Sites). Each turn one Hiker moves right and takes the action of the Site it lands on — usually gaining tokens. At the Trail End, tokens are spent to reserve or visit Parks (points) or buy Gear. ${solo ? "Two Rangers move along with you and trigger events." : "Most points wins."}`,
        `Ao longo de 4 Estações, os dois Caminhantes ${solo ? "seus" : "de cada jogador"} percorrem uma Trilha de Locais que cresce um Local por Estação (${trailLengths()} Locais). A cada turno um Caminhante anda para a direita e faz a ação do Local onde para — em geral ganhando fichas. No Fim da Trilha, as fichas são gastas para reservar ou visitar Parques (pontos) ou comprar Equipamento. ${solo ? "Dois Guardas andam junto com você e disparam eventos." : "Vence quem tiver mais pontos."}`
      )} ${referenceLink(2)}</div>
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- victory ----------

  function victorySection() {
    const solo = isSolo();
    return `
      ${sectionHeading("victory", t("Scoring & winning", "Pontuação e vitória"), sectionIndex("victory"), solo ? [5, 6] : [5])}
      <div class="quick-grid">
        <article class="info-card victory-card">
          <span class="component-label">${t("GAME END", "FIM DE JOGO")}</span>
          <h3>${t("After the 4th Season", "Depois da 4ª Estação")}</h3>
          ${lineList([
            t("The game is over when the fourth Season ends, after its end-of-Season Photo opportunity (Camera holder).", "A partida termina quando acaba a quarta Estação, depois da oportunidade de Foto do fim da Estação (quem tem a Câmera)."),
            t("Everyone reveals their Year card.", "Todos revelam a sua carta de Ano."),
            t(`Score: the points printed on each Park you visited + 1 point per Photo ${glyph("photo")} + your Year card's Personal Bonus + 1 point for the First Hiker Marker ${glyph("first-hiker")} if you hold it.`, `Pontue: os pontos impressos em cada Parque que você visitou + 1 ponto por Foto ${glyph("photo")} + o Bônus Pessoal da sua carta de Ano + 1 ponto pelo Marcador de Primeiro Caminhante ${glyph("first-hiker")} se estiver com você.`),
            interpretation("reserved Parks that were never visited are not in your score area, so they score nothing.", "Parques reservados que nunca foram visitados não estão na sua área de pontos, então não pontuam.")
          ])}
          ${referenceLink(5)}
        </article>
        ${solo ? `
        <article class="info-card victory-card">
          <span class="component-label">${t("SOLO RATING", "AVALIAÇÃO SOLO")}</span>
          <h3>${t("How was your hike?", "Como foi a sua trilha?")}</h3>
          ${lineList([
            rl("Less than 20", "you went hiking, but missed some great Sites.", "Menos de 20", "você fez a trilha, mas perdeu ótimos Locais."),
            rl("20–24", "a casual enthusiast.", "20–24", "um entusiasta casual."),
            rl("25–29", "a seasoned Hiker; the Rangers thank you.", "25–29", "um Caminhante experiente; os Guardas agradecem."),
            rl("30+", "an unforgettable experience. Congrats!", "30+", "uma experiência inesquecível. Parabéns!")
          ])}
          ${referenceLink(6)}
        </article>` : `
        <article class="info-card victory-card">
          <span class="component-label">${t("WINNER", "VENCEDOR")}</span>
          <h3>${t("Most points", "Mais pontos")}</h3>
          ${lineList([
            t("The player with the most points wins.", "Vence o jogador com mais pontos."),
            rl("Tie", "the tied player who visited the most Parks wins.", "Empate", "vence, entre os empatados, quem visitou mais Parques."),
            rl("Still tied", "the win is shared.", "Ainda empatado", "a vitória é compartilhada.")
          ])}
          ${referenceLink(5)}
        </article>`}
        <article class="info-card victory-card">
          <span class="component-label">${t("YEAR CARDS", "CARTAS DE ANO")}</span>
          <h3>${t("Personal Bonus", "Bônus Pessoal")}</h3>
          ${lineList([
            t("Each Year card gives 2 or 3 extra points depending on how well you met its goal; the exact goal is printed on the card.", "Cada carta de Ano dá 2 ou 3 pontos extras conforme o quanto você cumpriu o objetivo; o objetivo exato está impresso na carta."),
            t(`Example: “Visit 6 Parks with ${glyph("forest")}” gives 2 points if 6 of your visited Park cards show a Forest symbol (the pictured card gives 3 points for 8).`, `Exemplo: “Visite 6 Parques com ${glyph("forest")}” dá 2 pontos se 6 dos Parques que você visitou mostram um símbolo de Floresta (a carta da figura dá 3 pontos por 8).`),
            t(`Other goals count Photos ${glyph("year-photos")} or a number of one symbol across your visited Parks.`, `Outros objetivos contam Fotos ${glyph("year-photos")} ou uma quantidade de um símbolo nos seus Parques visitados.`),
            rl("Year of Plenty", "12 (or 18) of the same symbol across your visited Parks; any of the four types.", "Ano da Fartura (Year of Plenty)", "12 (ou 18) do mesmo símbolo nos seus Parques visitados; qualquer um dos quatro tipos.")
          ])}
          ${referenceLink(4)} ${referenceLink(5)}
        </article>
      </div>
      <div class="pk-art-row">
        ${figure("park-details", t("Rulebook PDF p. 5: a Park card — date established, points, state(s) location, tokens required to visit, artist, park fact", "Livro PDF p. 5: uma carta de Parque — data de criação, pontos, estado(s), fichas necessárias para visitar, artista, curiosidade do parque"))}
        ${figure("year-cards", t("Rulebook PDF p. 5: a stack of visited Parks showing their tokens and points, a Year card (Visit 6 Parks with Forest = 2, 8 = 3), the First Hiker Marker and Photos", "Livro PDF p. 5: uma pilha de Parques visitados mostrando fichas e pontos, uma carta de Ano (Visite 6 Parques com Floresta = 2, 8 = 3), o Marcador de Primeiro Caminhante e Fotos"))}
      </div>`;
  }

  // ---------- turns & sites ----------

  function turnsSection() {
    const solo = isSolo();
    return `
      ${sectionHeading("turns", t("Turns & Trail Sites", "Turnos e Locais da Trilha"), sectionIndex("turns"), [3])}
      <div class="quick-grid">
        ${infoCard(t("TAKING TURNS", "TURNOS"), t("One Hiker, one Site", "Um Caminhante, um Local"), [
          solo
            ? t("Turns alternate between you and the Rangers.", "Os turnos alternam entre você e os Guardas.")
            : t(`The player with the First Hiker Marker ${glyph("first-hiker")} takes the first turn of the Season; then turns go clockwise until the Season ends.`, `O jogador com o Marcador de Primeiro Caminhante ${glyph("first-hiker")} faz o primeiro turno da Estação; depois os turnos seguem em sentido horário até a Estação acabar.`),
          t("On your turn, choose either one of your Hikers and move it down the Trail to a Site of your choice — anywhere to the right of its current location.", "No seu turno, escolha qualquer um dos seus Caminhantes e mova-o ao longo da Trilha para um Local à sua escolha — qualquer lugar à direita da posição atual."),
          interpretation("the Trail End is also to the right, so you may move a Hiker straight to it (the rulebook's turn text speaks only of Sites, but its end-of-Season rules assume Hikers reach the Trail End this way).", "o Fim da Trilha também fica à direita, então você pode levar um Caminhante direto para ele (o texto do turno fala só de Locais, mas as regras de fim de Estação supõem que os Caminhantes chegam assim ao Fim da Trilha)."),
          t("When the Hiker lands on the new Site, take that Site's action. You must be able to take the action in order to visit the Site.", "Quando o Caminhante para no novo Local, faça a ação desse Local. Você precisa conseguir fazer a ação para visitar o Local."),
          t(`If another Hiker${solo ? " or a Ranger" : ""} — even your own — already occupies a Site, you cannot visit it unless you use your Campfire.`, `Se outro Caminhante${solo ? " ou um Guarda" : ""} — até um seu — já ocupa um Local, você não pode visitá-lo a menos que use a sua Fogueira.`),
          t("If your Hiker is the first to land on a Site with a token from the Weather Pattern, take that token into your supply as a bonus, along with the Site's action.", "Se o seu Caminhante é o primeiro a parar num Local com uma ficha do Padrão Climático, ponha essa ficha na sua reserva como bônus, além da ação do Local."),
          t("Once both of a player's Hikers reach the Trail End, that player takes no more turns this Season.", "Quando os dois Caminhantes de um jogador chegam ao Fim da Trilha, ele não faz mais turnos nesta Estação.")
        ], [3, 5])}
        ${infoCard(t("TOKEN LIMIT", "LIMITE DE FICHAS"), t("Limit of 12", "Limite de 12"), [
          t("You can carry up to 12 tokens. If you have more than 12 at the end of your turn, discard down to 12.", "Você pode carregar até 12 fichas. Se tiver mais de 12 no fim do seu turno, descarte até ficar com 12."),
          interpretation("Wildlife tokens are tokens and count; Photos and Water sitting on Canteens are not in your supply and do not count. You choose which tokens to discard, returning them to the supply.", "fichas de Vida Selvagem são fichas e contam; Fotos e Água posta em Cantis não estão na sua reserva e não contam. Você escolhe quais fichas descartar, devolvendo-as à reserva.")
        ], [3])}
        ${infoCard(t("SYMBOLS ON SITES", "SÍMBOLOS NOS LOCAIS"), t("Reading the tiles", "Lendo as peças"), [
          t(`All Basic and Advanced Sites are Trail Sites ${glyph("basic-site")}. The Trailhead ${glyph("trailhead")} and the Trail End ${glyph("trail-end")} are NOT Sites.`, `Todos os Locais Básicos e Avançados são Locais da Trilha ${glyph("basic-site")}. O Início da Trilha ${glyph("trailhead")} e o Fim da Trilha ${glyph("trail-end")} NÃO são Locais.`),
          t(`Token symbol ${glyph("token-symbol")}: a brown square means any token may be used; the number inside says how many.`, `Símbolo de ficha ${glyph("token-symbol")}: um quadrado marrom significa que qualquer ficha pode ser usada; o número dentro diz quantas.`),
          t(`Site symbol ${glyph("site-symbol")}: Gear cards often name a specific Trail Site by its icon next to the Trail symbol.`, `Símbolo de Local ${glyph("site-symbol")}: as cartas de Equipamento muitas vezes citam um Local específico pelo ícone dele junto ao símbolo da Trilha.`)
        ], [3])}
      </div>
      <h3 class="subhead">${t("Basic Sites", "Locais Básicos")} ${glyph("basic-site")}</h3>
      <div class="icon-grid">
        ${iconCard("forest", "Forest Site", "Gain a Forest token into your supply.", "Local de Floresta", "Ganhe uma ficha de Floresta na sua reserva.", 3)}
        ${iconCard("mountain", "Mountain Site", "Gain a Mountain token into your supply.", "Local de Montanha", "Ganhe uma ficha de Montanha na sua reserva.", 3)}
        ${iconCard("site-two-sunshine", "Two Sunshine Site", "Gain two Sunshine tokens into your supply.", "Local de dois Sóis", "Ganhe duas fichas de Sol na sua reserva.", 3)}
        ${iconCard("site-two-water", "Two Water Site", "Gain two Water tokens into your supply.", "Local de duas Águas", "Ganhe duas fichas de Água na sua reserva.", 3)}
        ${iconCard("draw-canteen", "Canteen / Photo Site (1 of 2)", "Draw a Canteen card — OR — take the Photo action shown next to it.", "Local de Cantil / Foto (1 de 2)", "Compre uma carta de Cantil — OU — faça a ação de Foto mostrada ao lado.", 3)}
        ${iconCard("site-photo", "Canteen / Photo Site (2 of 2)", "Turn in 2 tokens (any) to take a Photo and gain the Camera from whoever has it. With the Camera already, a Photo costs 1 token.", "Local de Cantil / Foto (2 de 2)", "Entregue 2 fichas (quaisquer) para pegar uma Foto e ganhar a Câmera de quem a tiver. Se você já tem a Câmera, a Foto custa 1 ficha.", [3, 4])}
        ${isLarge() ? iconCard("site-sun-water", "Sunshine + Water Site (4+)", "Gain a Sunshine and a Water token into your supply. Only used in 4–5 player games.", "Local de Sol + Água (4+)", "Ganhe uma ficha de Sol e uma de Água na sua reserva. Só usado em partidas de 4–5 jogadores.", 3) : ""}
      </div>
      <h3 class="subhead">${t("Advanced Sites", "Locais Avançados")} ${glyph("advanced-site")}</h3>
      <p class="glossary-intro">${t(
        "The first Trail has 1 random Advanced Site; each new Season adds one more, so all 4 are on the Trail in the 4th Season.",
        "A primeira Trilha tem 1 Local Avançado aleatório; cada nova Estação acrescenta mais um, então os 4 estão na Trilha na 4ª Estação."
      )}</p>
      <div class="icon-grid">
        ${iconCard("site-wildlife", "Wildlife Site", "Turn in any one token to gain a Wildlife token.", "Local de Vida Selvagem", "Entregue uma ficha qualquer para ganhar uma ficha de Vida Selvagem.", 3, true)}
        ${iconCard("site-exchange", "Exchange Site (×2)", "Turn in one token and gain any one token (excluding Wildlife). You may do this a second time. Wildlife can be neither turned in nor gained here; you may gain the same type you turned in.", "Local de Troca (×2)", "Entregue uma ficha e ganhe uma ficha qualquer (exceto Vida Selvagem). Pode fazer isso uma segunda vez. Vida Selvagem não pode ser entregue nem ganha aqui; você pode ganhar o mesmo tipo que entregou.", [3, 5], true)}
        ${iconCard("site-parks", "Parks Site", "Reserve or Visit a Park (same rules as at the Trail End) — OR — Buy a Gear card.", "Local de Parques", "Reserve ou Visite um Parque (mesmas regras do Fim da Trilha) — OU — Compre uma carta de Equipamento.", [3, 4])}
        ${iconCard("site-river", "River Site", "Turn in a Water to copy the action of another Site occupied by a Hiker. It does not count as visiting the copied Site (Gear naming that Site does not trigger), but tokens gained can still trigger Season effects.", "Local do Rio", "Entregue uma Água para copiar a ação de outro Local ocupado por um Caminhante. Não conta como visitar o Local copiado (Equipamento que cita esse Local não dispara), mas fichas ganhas ainda podem disparar efeitos de Estação.", [3, 5], true)}
      </div>
      <p class="glossary-intro">${interpretation(
        "at the Parks Site neither the Gear discount nor the First Hiker Marker applies: the rulebook ties both to slots of the Trail End areas.",
        "no Local de Parques não valem nem o desconto de Equipamento nem o Marcador de Primeiro Caminhante: o livro liga os dois às casas das áreas do Fim da Trilha."
      )}</p>
      <div class="pk-art-row">
        ${figure("turn-example", t("Rulebook PDF p. 3: the green player moves a Hiker down the Trail to the Wildlife Site and takes its action", "Livro PDF p. 3: o jogador verde move um Caminhante pela Trilha até o Local de Vida Selvagem e faz a ação dele"))}
      </div>`;
  }

  // ---------- trail end ----------

  function trailEndSection() {
    const solo = isSolo();
    return `
      ${sectionHeading("trail-end", t("At the Trail End", "No Fim da Trilha"), sectionIndex("trail-end"), solo ? [4, 7] : [4])}
      <p class="glossary-intro">${t(
        `When a Hiker arrives at the Trail End ${glyph("trail-end")}, its player immediately relights their Campfire if it is extinguished, then chooses one of the three areas and places the Hiker standing up in the farthest-right available slot of that area. Any number of Hikers may use each area; the slots matter only for the First Hiker Marker and the Gear discount.${solo ? " Solo: your Hikers have the same three options (Gear at no discount); your Campfire relights each time one of your Hikers arrives." : ""}`,
        `Quando um Caminhante chega ao Fim da Trilha ${glyph("trail-end")}, o jogador reacende na hora a sua Fogueira, se estiver apagada, e escolhe uma das três áreas, pondo o Caminhante em pé na casa livre mais à direita dessa área. Qualquer número de Caminhantes pode usar cada área; as casas só importam para o Marcador de Primeiro Caminhante e o desconto de Equipamento.${solo ? " Solo: os seus Caminhantes têm as mesmas três opções (Equipamento sem desconto); a sua Fogueira reacende cada vez que um dos seus Caminhantes chega." : ""}`
      )}</p>
      <div class="quick-grid">
        ${infoCard(t("AREA 1", "ÁREA 1"), t("Reserve a Park", "Reservar um Parque"), [
          t("Choose one of the 3 Parks on the board, or draw the top card of the Parks deck.", "Escolha um dos 3 Parques do tabuleiro, ou compre a carta do topo do baralho de Parques."),
          t("Place it face up horizontally in front of you, separate from your vertically stacked visited Parks.", "Coloque-o virado para cima, na horizontal, à sua frente, separado da pilha vertical dos seus Parques visitados."),
          t("If you took it from a board slot, reveal a new Park from the deck into the empty slot.", "Se você o tirou de uma casa do tabuleiro, revele um novo Parque do baralho na casa vazia."),
          t("On a later Visit a Park action you may visit one of your reserved Parks or one of the 3 on the board.", "Numa ação Visitar um Parque futura você pode visitar um dos seus Parques reservados ou um dos 3 do tabuleiro."),
          solo
            ? t(`If you are first here this Season, place your Hiker in the far-right slot and take the First Hiker Marker ${glyph("first-hiker")} (if a Ranger took it, see Solo).`, `Se você é o primeiro aqui nesta Estação, ponha o Caminhante na casa mais à direita e pegue o Marcador de Primeiro Caminhante ${glyph("first-hiker")} (se um Guarda o pegou, veja Solo).`)
            : t(`The first player to place a Hiker here this Season puts it in the far-right slot and gains the First Hiker Marker ${glyph("first-hiker")}. Any number of other players may still reserve Parks here, without the marker.`, `O primeiro jogador a pôr um Caminhante aqui nesta Estação o coloca na casa mais à direita e ganha o Marcador de Primeiro Caminhante ${glyph("first-hiker")}. Qualquer número de outros jogadores ainda pode reservar Parques aqui, sem o marcador.`),
          t("The First Hiker Marker decides who starts the next Season and is worth 1 point at the end of the game.", "O Marcador de Primeiro Caminhante decide quem começa a próxima Estação e vale 1 ponto no fim da partida."),
          interpretation("the rulebook sets no limit on how many Parks you may hold reserved.", "o livro não limita quantos Parques você pode ter reservados.")
        ], [4, 5])}
        ${infoCard(t("AREA 2", "ÁREA 2"), t("Buy Gear", "Comprar Equipamento"), [
          t("Place your Hiker on the Buy Gear area. Choose one of the 3 Gear cards on the board and turn in Sunshine equal to its cost (Wildlife may replace Sunshine).", "Ponha o seu Caminhante na área Comprar Equipamento. Escolha uma das 3 cartas de Equipamento do tabuleiro e entregue Sóis iguais ao custo dela (Vida Selvagem pode substituir Sol)."),
          solo
            ? t("Solo: no discount.", "Solo: sem desconto.")
            : isLarge()
              ? t("4–5 players: the first two Hikers to Buy Gear this Season take the two Sunshine slots (the far-right one is marked 4+) and each pays 1 Sunshine less. Later buyers pay full price.", "4–5 jogadores: os dois primeiros Caminhantes a Comprar Equipamento nesta Estação ocupam as duas casas de Sol (a mais à direita marcada 4+) e cada um paga 1 Sol a menos. Quem comprar depois paga o preço cheio.")
              : t("2–3 players: the first Hiker to Buy Gear this Season takes the Sunshine slot without 4+ and pays 1 Sunshine less. Any number of others may still buy Gear, at full price.", "2–3 jogadores: o primeiro Caminhante a Comprar Equipamento nesta Estação ocupa a casa de Sol sem 4+ e paga 1 Sol a menos. Qualquer número de outros ainda pode comprar, pelo preço cheio."),
          t(`Place the Gear face up in front of you. Every Gear card has an ongoing ability; some also have an Instant action ${glyph("instant")}, used once immediately on purchase.`, `Coloque o Equipamento virado para cima à sua frente. Toda carta de Equipamento tem uma habilidade contínua; algumas também têm uma Ação instantânea ${glyph("instant")}, usada uma vez assim que comprada.`),
          solo
            ? interpretation("in solo the Rangers' Gear flips refill the slots, so do not refill a slot after you buy.", "no solo os Equipamentos virados pelos Guardas repõem as casas, então não reponha uma casa depois de comprar.")
            : interpretation("refill the empty Gear slot from the Gear deck (the rulebook states the refill only for Parks).", "reponha a casa de Equipamento vazia com o baralho de Equipamento (o livro só fala de reposição para Parques).")
        ], [4, 5])}
        ${infoCard(t("AREA 3", "ÁREA 3"), t("Visit a Park", "Visitar um Parque"), [
          t("Any number of Hikers can occupy the Visit a Park area.", "Qualquer número de Caminhantes pode ocupar a área Visitar um Parque."),
          t("Choose one of the 3 Parks on the board or one you reserved, and turn in the tokens shown on it to the supply (Wildlife may replace any of them; Gear may reduce the cost).", "Escolha um dos 3 Parques do tabuleiro ou um reservado por você e entregue à reserva as fichas mostradas nele (Vida Selvagem pode substituir qualquer uma; Equipamentos podem reduzir o custo)."),
          t("Place the Park vertically in your score area; Parks can be stacked so their tokens and points stay visible. Its points score at the end of the game.", "Coloque o Parque na vertical na sua área de pontos; os Parques podem ser empilhados deixando fichas e pontos visíveis. Os pontos dele contam no fim da partida."),
          t("Whenever a Park is visited from the board, reveal a new Park from the deck into the empty slot.", "Sempre que um Parque do tabuleiro é visitado, revele um novo Parque do baralho na casa vazia.")
        ], [4, 5])}
        ${infoCard(t("LAST HIKER", "ÚLTIMO CAMINHANTE"), t(`Last Hiker on the Trail ${glyph("last-hiker")}`, `Último Caminhante na Trilha ${glyph("last-hiker")}`), [
          solo
            ? t("Solo has its own rule for the last Hikers and Rangers — see the Solo section.", "O solo tem regra própria para os últimos Caminhantes e Guardas — veja a seção Solo.")
            : t("When only one Hiker remains on the Trail, its player must move it directly to the Trail End on their next turn (they are the only player still taking turns) and choose an action there. This ends the Season.", "Quando só resta um Caminhante na Trilha, o dono dele deve movê-lo direto para o Fim da Trilha no próximo turno dele (é o único jogador que ainda joga) e escolher uma ação lá. Isso encerra a Estação."),
          solo ? null : t("Use this strategically: going to the Trail End early can limit another player's time on the Trail.", "Use isso estrategicamente: ir cedo ao Fim da Trilha pode limitar o tempo de outro jogador na Trilha.")
        ], [5])}
      </div>
      <div class="pk-art-row">
        ${figure("trail-end-reserve", t("Rulebook PDF p. 4: the Trail End — Reserve a Park (with the First Hiker Marker slot), Buy Gear (Sunshine discount slots), Visit a Park", "Livro PDF p. 4: o Fim da Trilha — Reservar um Parque (com a casa do Marcador de Primeiro Caminhante), Comprar Equipamento (casas de desconto de Sol), Visitar um Parque"))}
        ${figure("gear-card", t("Rulebook PDF p. 4: a Gear card (Water Bottle) — cost top right, Instant action that draws a Canteen, ongoing ability at the bottom", "Livro PDF p. 4: uma carta de Equipamento (Water Bottle) — custo no canto superior direito, Ação instantânea que compra um Cantil, habilidade contínua embaixo"))}
      </div>`;
  }

  // ---------- details ----------

  function detailsSection() {
    const solo = isSolo();
    return `
      ${sectionHeading("details", t("Canteens, Photos, Campfires", "Cantis, Fotos, Fogueiras"), sectionIndex("details"), [3, 4])}
      <div class="quick-grid">
        ${infoCard(t("CANTEENS", "CANTIS"), t("Fill with fresh Water", "Encha com Água fresca"), [
          t(`${glyph("draw-canteen")} means draw a Canteen card: place it face up in front of you. ${glyph("filled-canteen")} refers to Canteens in a player's area.`, `${glyph("draw-canteen")} significa comprar uma carta de Cantil: coloque-a virada para cima à sua frente. ${glyph("filled-canteen")} se refere aos Cantis na área de um jogador.`),
          t("A Canteen can only be filled with a Water gained on the current turn: place that Water on the Canteen instead of in your supply, then perform the Canteen's action.", "Um Cantil só pode ser enchido com uma Água ganha no turno atual: ponha essa Água no Cantil em vez de na sua reserva e então faça a ação do Cantil."),
          t("Water already in your supply from an earlier turn can never fill a Canteen. Wildlife cannot fill a Canteen.", "Água que já estava na sua reserva de um turno anterior nunca pode encher um Cantil. Vida Selvagem não pode encher Cantil."),
          t("You may have any number of Canteens and fill any number of them on one turn if you gain several Water, in any order — even a Canteen drawn that same turn.", "Você pode ter qualquer número de Cantis e encher quantos quiser num turno se ganhar várias Águas, em qualquer ordem — até um Cantil comprado nesse mesmo turno."),
          t("Once filled, the Water stays on the Canteen until the end of the Season and cannot be used in any other way.", "Depois de cheio, a Água fica no Cantil até o fim da Estação e não pode ser usada de nenhum outro jeito."),
          t("Each Canteen's action is printed on the card.", "A ação de cada Cantil está impressa na carta.")
        ], [4, 5])}
        ${infoCard(t("PHOTOS & CAMERA", "FOTOS E CÂMERA"), t("1 point per Photo", "1 ponto por Foto"), [
          t(`At the Canteen / Photo Site ${glyph("site-photo")}, return any 2 tokens to the supply and take a Photo ${glyph("photo")} (worth 1 point).`, `No Local de Cantil / Foto ${glyph("site-photo")}, devolva 2 fichas quaisquer à reserva e pegue uma Foto ${glyph("photo")} (vale 1 ponto).`),
          t(`After taking a Photo there, take the Camera ${glyph("camera")} from whoever currently has it.`, `Depois de tirar uma Foto lá, pegue a Câmera ${glyph("camera")} de quem a tiver.`),
          t("While you hold the Camera, a Photo at that Site costs 1 token instead of 2.", "Enquanto você tem a Câmera, uma Foto nesse Local custa 1 ficha em vez de 2."),
          t("At each Season's end, the Camera holder may take one Photo at the reduced price (1 token).", "No fim de cada Estação, quem tem a Câmera pode tirar uma Foto pelo preço reduzido (1 ficha)."),
          t("Some Gear cards give extra Photo opportunities, but they do not give the Camera.", "Alguns Equipamentos dão oportunidades extras de Foto, mas não dão a Câmera."),
          solo ? t("Solo: a Ranger ending in the middle Trail End slot returns the Camera to the supply; take it back with your next Photo at the Site.", "Solo: um Guarda que termina na casa do meio do Fim da Trilha devolve a Câmera à reserva; você a recupera com a próxima Foto no Local.") : null
        ], solo ? [4, 7] : [4])}
        ${infoCard(t("CAMPFIRES", "FOGUEIRAS"), t("Sharing an occupied Site", "Dividir um Local ocupado"), [
          t(`To visit a Site already occupied by another Hiker${solo ? " or a Ranger" : ""} — including your own — you must use your Campfire ${glyph("campfire")}: flip it to the extinguished side.`, `Para visitar um Local já ocupado por outro Caminhante${solo ? " ou por um Guarda" : ""} — inclusive um seu — você precisa usar a sua Fogueira ${glyph("campfire")}: vire-a para o lado apagado.`),
          t("While your Campfire is extinguished, you cannot visit an occupied Site.", "Enquanto a sua Fogueira está apagada, você não pode visitar um Local ocupado."),
          t("Your Campfire relights when one of your Hikers reaches the Trail End.", "A sua Fogueira reacende quando um dos seus Caminhantes chega ao Fim da Trilha.")
        ], solo ? [4, 7] : [4])}
        ${infoCard(t("WILDLIFE", "VIDA SELVAGEM"), t("Wild tokens", "Fichas coringa"), [
          t(`Wildlife ${glyph("wildlife")} comes in 12 shapes, but they are all simply Wildlife.`, `A Vida Selvagem ${glyph("wildlife")} vem em 12 formatos, mas todas são simplesmente Vida Selvagem.`),
          t("It can replace any other token to visit Parks, take Photos, buy Gear and visit the River.", "Ela pode substituir qualquer outra ficha para visitar Parques, tirar Fotos, comprar Equipamento e visitar o Rio."),
          t("It cannot fill a Canteen, nor be turned in or gained at the Exchange Site or through a Canteen.", "Ela não pode encher um Cantil, nem ser entregue ou ganha no Local de Troca ou por um Cantil.")
        ], [3])}
        ${infoCard(t("GEAR", "EQUIPAMENTO"), t("Ongoing abilities", "Habilidades contínuas"), [
          t("Gear gives extra benefits at Trail Sites or makes certain Parks easier to visit; each card's text explains its ability.", "O Equipamento dá benefícios extras nos Locais ou facilita visitar certos Parques; o texto de cada carta explica a habilidade."),
          t("Discount Gear (such as Maps, Compasses, Journals) stacks: several can reduce one Park's cost, but a token type on a Park never goes below zero.", "Equipamentos de desconto (como Mapas, Bússolas, Diários) se somam: vários podem reduzir o custo de um Parque, mas um tipo de ficha num Parque nunca fica abaixo de zero."),
          t("Sunscreen and Rain Gear let you pay a Park with a different token type in place of another; this applies to the symbols printed on the Park, not to discounts from other Gear.", "Protetor Solar (Sunscreen) e Capa de Chuva (Rain Gear) deixam você pagar um Parque com outro tipo de ficha no lugar de outro; isso vale para os símbolos impressos no Parque, não para descontos de outros Equipamentos."),
          t("Water Bottle: when you visit the Site shown, you may take a Water from the supply for free and put it into a Canteen to activate it.", "Garrafa de Água (Water Bottle): quando você visita o Local mostrado, pode pegar de graça uma Água da reserva e pô-la num Cantil para ativá-lo.")
        ], [4, 5])}
      </div>
      <div class="pk-art-row">
        ${figure("canteen-example", t("Rulebook PDF p. 4: a Water gained this turn is placed on a Canteen, whose action here gives 2 Sunshine", "Livro PDF p. 4: uma Água ganha neste turno é posta num Cantil, cuja ação aqui dá 2 Sóis"))}
        ${figure("campfire-example", t("Rulebook PDF p. 4: the pink player shares the Two Sunshine Site with the green Hiker by flipping their Campfire to extinguished", "Livro PDF p. 4: o jogador rosa divide o Local de dois Sóis com o Caminhante verde virando a Fogueira para o lado apagado"))}
      </div>`;
  }

  // ---------- seasons ----------

  function seasonsSection() {
    const solo = isSolo();
    return `
      ${sectionHeading("seasons", t("Seasons", "Estações"), sectionIndex("seasons"), [3, 5])}
      <p class="glossary-intro">${t(
        `The 4 Seasons of the Year are the 4 rounds of the game. A Season ends when all ${solo ? "Hikers and Rangers" : "Hikers"} have reached the Trail End. Trails this match: ${trailLengths()} Sites in Seasons 1–4.`,
        `As 4 Estações do Ano são as 4 rodadas da partida. Uma Estação acaba quando todos os ${solo ? "Caminhantes e Guardas" : "Caminhantes"} chegaram ao Fim da Trilha. Trilhas nesta partida: ${trailLengths()} Locais nas Estações 1–4.`
      )}</p>
      <div class="quick-grid">
        ${infoCard(t("START OF A SEASON", "INÍCIO DA ESTAÇÃO"), t("Season effect and weather", "Efeito da Estação e clima"), [
          t(`Read the Season effect on the card ${glyph("season")}: it changes play for this round. Do any immediate action it asks for.`, `Leia o efeito da Estação na carta ${glyph("season")}: ele muda o jogo nesta rodada. Faça qualquer ação imediata que ele pedir.`),
          t(`Apply the Weather Pattern ${glyph("weather-pattern")} from the bottom right of the card: tokens from the supply, one per Site, starting on the 2nd Trail Site, repeated to the Trail End.`, `Aplique o Padrão Climático ${glyph("weather-pattern")} do canto inferior direito da carta: fichas da reserva, uma por Local, começando no 2º Local da Trilha, repetido até o Fim da Trilha.`),
          t("Season effects with “one per turn” wording give their bonus only once per turn, even if you trigger them twice.", "Efeitos de Estação com “um por turno” dão o bônus só uma vez por turno, mesmo que você os dispare duas vezes."),
          t("Actions taken on Canteens and at the Exchange Site count toward Season effects.", "Ações feitas em Cantis e no Local de Troca contam para os efeitos de Estação."),
          rl("Rain / Splendor", "at the start of the Season put 1 Water (Rain) or 1 Sunshine (Splendor) on each of the 3 board Parks. Whoever visits or reserves that Park also gains the token, usable at once (even toward that Park or a Canteen). Parks revealed later get none.", "Chuva / Esplendor", "no início da Estação ponha 1 Água (Chuva) ou 1 Sol (Esplendor) em cada um dos 3 Parques do tabuleiro. Quem visitar ou reservar esse Parque ganha também a ficha, usável na hora (até para esse Parque ou um Cantil). Parques revelados depois não recebem ficha.")
        ], [3, 5])}
        ${infoCard(t("END OF A SEASON", "FIM DA ESTAÇÃO"), t("Upkeep (reminder on the board)", "Manutenção (lembrete no tabuleiro)"), [
          solo
            ? t("The Season ends when all your Hikers and the Rangers are at the Trail End (see Solo for the last ones).", "A Estação acaba quando todos os seus Caminhantes e os Guardas estão no Fim da Trilha (veja Solo para os últimos).")
            : t("When only one Hiker is left on the Trail, its player moves it straight to the Trail End and chooses an action there: this marks the end of the Season.", "Quando só resta um Caminhante na Trilha, o dono o leva direto ao Fim da Trilha e escolhe uma ação lá: isso marca o fim da Estação."),
          rl("1", `the player with the Camera ${glyph("camera")} may turn in 1 token to take a Photo.`, "1", `o jogador com a Câmera ${glyph("camera")} pode entregar 1 ficha para tirar uma Foto.`),
          rl("2", `empty all Canteens ${glyph("filled-canteen")} by returning their Water to the supply.`, "2", `esvazie todos os Cantis ${glyph("filled-canteen")} devolvendo a Água deles à reserva.`),
          rl("3", `return all ${solo ? "Hikers and Rangers" : "Hikers"} to the Trailhead.`, "3", `devolva todos os ${solo ? "Caminhantes e Guardas" : "Caminhantes"} ao Início da Trilha.`),
          interpretation("weather tokens still on the Trail go back to the supply when the Sites are picked up (the rulebook does not mention them).", "fichas de clima que ainda estão na Trilha voltam à reserva quando os Locais são recolhidos (o livro não fala delas)."),
          solo ? rl("Solo", "also refill any empty Park slots emptied by the Rangers.", "Solo", "reponha também as casas de Parque esvaziadas pelos Guardas.") : null,
          rl("After Season 4", "the game ends (see Scoring).", "Depois da Estação 4", "a partida acaba (veja Pontuação).")
        ], [5, 7])}
        ${infoCard(t("BEGIN A NEW SEASON", "COMEÇAR NOVA ESTAÇÃO"), t("One Site longer", "Um Local mais longa"), [
          rl("1", "pick up all Trail Sites (not the Trailhead or Trail End), add one more face-down Advanced Site, shuffle and lay out the new Trail as in setup — one Site longer than before.", "1", "recolha todos os Locais da Trilha (não o Início nem o Fim da Trilha), acrescente mais um Local Avançado virado para baixo, embaralhe e monte a nova Trilha como na preparação — um Local maior que antes."),
          rl("2", "put the previous Season card on the bottom of the Season deck and reveal the new Season from the top.", "2", "ponha a carta de Estação anterior embaixo do baralho de Estações e revele a nova Estação do topo."),
          rl("3", `apply the new Weather Pattern. The player with the First Hiker Marker ${glyph("first-hiker")} takes the first turn.`, "3", `aplique o novo Padrão Climático. O jogador com o Marcador de Primeiro Caminhante ${glyph("first-hiker")} faz o primeiro turno.`)
        ], [5])}
      </div>
      <div class="pk-art-row">
        ${figure("end-of-season", t("Rulebook PDF p. 5: end-of-Season reminder — 1 Camera Photo, 2 empty Canteens, 3 Hikers back to the Trailhead", "Livro PDF p. 5: lembrete de fim de Estação — 1 Foto da Câmera, 2 esvaziar Cantis, 3 Caminhantes de volta ao Início da Trilha"))}
        ${figure("new-season", t("Rulebook PDF p. 5: new-Season reminder — 1 add a Site, 2 new Season, 3 Weather Pattern", "Livro PDF p. 5: lembrete de nova Estação — 1 acrescentar um Local, 2 nova Estação, 3 Padrão Climático"))}
      </div>`;
  }

  // ---------- solo ----------

  function soloSection() {
    if (!isSolo()) {
      return "";
    }
    return `
      ${sectionHeading("solo", t("Solo mode", "Modo solo"), sectionIndex("solo"), [6, 7])}
      <p class="glossary-intro">${t(
        "Two Park Rangers move along the Trail with you. The Gear deck drives them, and when they collect enough weather tokens the SOLO deck triggers events. The goal is the same: score as many points as possible from Parks, Year, Photos and the First Hiker Marker.",
        "Dois Guardas-parque andam pela Trilha com você. O baralho de Equipamento os move e, quando eles juntam fichas de clima suficientes, o baralho SOLO dispara eventos. O objetivo é o mesmo: fazer o máximo de pontos com Parques, Ano, Fotos e o Marcador de Primeiro Caminhante."
      )}</p>
      <div class="quick-grid">
        ${infoCard(t("YOUR TURN", "SEU TURNO"), t("Same as multiplayer", "Igual ao multijogador"), [
          t("Turns alternate between you and the Rangers.", "Os turnos alternam entre você e os Guardas."),
          t("On your turn, move either of your Hikers down the Trail to a Site and take its action, with the normal movement rules.", "No seu turno, mova qualquer um dos seus Caminhantes pela Trilha até um Local e faça a ação dele, com as regras normais de movimento."),
          t("You may use your Campfire to share a Site with one of your Hikers or with a Ranger.", "Você pode usar a Fogueira para dividir um Local com um dos seus Caminhantes ou com um Guarda."),
          interpretation("whoever holds the First Hiker Marker takes the first turn of a Season (you, unless a Ranger took it).", "quem tem o Marcador de Primeiro Caminhante faz o primeiro turno de uma Estação (você, a menos que um Guarda o tenha pegado).")
        ], [7])}
        ${infoCard(t("RANGERS' TURN", "TURNO DOS GUARDAS"), t("Gear card → Ranger movement", "Carta de Equipamento → movimento do Guarda"), [
          rl("1 · Flip", `turn over the top Gear card and place it in a Gear slot by its cost: 1 ${glyph("sunshine")} → left-most slot, 2 → middle slot, 3 → right slot.`, "1 · Virar", `vire a carta do topo do Equipamento e ponha-a numa casa de Equipamento conforme o custo: 1 ${glyph("sunshine")} → casa da esquerda, 2 → casa do meio, 3 → casa da direita.`),
          interpretation("if that slot already holds Gear, put the new card on top; only the top card of each slot can be bought.", "se a casa já tiver Equipamento, ponha a nova carta por cima; só a carta de cima de cada casa pode ser comprada."),
          rl("2 · Choose", "if one of your Hikers is ahead of both Rangers, move the Front Ranger (the one furthest down the Trail). If a Ranger is ahead of or tied with your Front Hiker, move the Back Ranger (the one furthest from the Trail End).", "2 · Escolher", "se um dos seus Caminhantes está à frente dos dois Guardas, mova o Guarda da Frente (o mais adiantado na Trilha). Se um Guarda está à frente ou empatado com o seu Caminhante da Frente, mova o Guarda de Trás (o mais longe do Fim da Trilha)."),
          interpretation("a Ranger already at the Trail End cannot move, so move the other one; your Front Hiker is your Hiker furthest down the Trail that is not yet at the Trail End.", "um Guarda já no Fim da Trilha não pode andar, então mova o outro; o seu Caminhante da Frente é o seu Caminhante mais adiantado que ainda não chegou ao Fim da Trilha."),
          rl("3 · Move", "move that Ranger as many spaces down the Trail as the Gear's cost. It is the Active Ranger.", "3 · Mover", "mova esse Guarda pela Trilha tantos espaços quanto o custo do Equipamento. Ele é o Guarda Ativo."),
          t("Rangers can land on a Site already occupied by a Ranger, but if their movement would land them on a Hiker, they skip to the next Site.", "Guardas podem parar num Local já ocupado por um Guarda, mas se o movimento os faria parar num Caminhante, eles pulam para o próximo Local."),
          interpretation("the Trail End counts as the last space: a Ranger that would move past it stops there and takes its Trail End slot.", "o Fim da Trilha conta como o último espaço: um Guarda que passaria dele para ali e ocupa a sua casa do Fim da Trilha."),
          interpretation("the rulebook does not cover an empty Gear deck; if it runs out, shuffle every Gear card on the board except the top card of each slot into a new deck.", "o livro não trata do baralho de Equipamento vazio; se acabar, embaralhe todas as cartas de Equipamento do tabuleiro, exceto a de cima de cada casa, formando um novo baralho."),
          interpretation("Rangers are not Hikers: the River can copy only a Site occupied by one of your Hikers.", "Guardas não são Caminhantes: o Rio só copia um Local ocupado por um dos seus Caminhantes.")
        ], [7])}
        ${infoCard(t("EVENTS", "EVENTOS"), t("The Ranger Tracker", "O Rastreador dos Guardas"), [
          t(`When a Ranger lands on a weather token, collect it and place it on the Ranger Tracker: top row for Sunshine ${glyph("sunshine")}, bottom row for Water ${glyph("water")}.`, `Quando um Guarda para numa ficha de clima, recolha-a e ponha-a no Rastreador dos Guardas: linha de cima para Sol ${glyph("sunshine")}, linha de baixo para Água ${glyph("water")}.`),
          t("When a row holds 3 tokens of the same type, the event on the revealed SOLO card for that row triggers: resolve its text (printed on the card).", "Quando uma linha tem 3 fichas do mesmo tipo, o evento da carta SOLO revelada para essa linha dispara: resolva o texto dela (impresso na carta)."),
          t("Then put that card on the bottom of the SOLO deck, reveal a new one, and return the 3 matching tokens to the supply. Other tokens on the Tracker stay.", "Depois ponha essa carta embaixo do baralho SOLO, revele uma nova e devolva as 3 fichas iguais à reserva. As outras fichas no Rastreador ficam."),
          t("“Active Ranger” on a card means the Ranger that is moving. If an event moves one of your Hikers to a Site, you do not get that Site's action.", "“Guarda Ativo” numa carta é o Guarda que está se movendo. Se um evento move um Caminhante seu para um Local, você não ganha a ação desse Local.")
        ], [7])}
        ${infoCard(t("RANGERS AT THE TRAIL END", "GUARDAS NO FIM DA TRILHA"), t("Three dark green slots", "Três casas verde-escuras"), [
          t("The three dark green slots on the left of the SOLO Trail End are for Rangers. The cost of the Gear that brought the Ranger there sets its slot:", "As três casas verde-escuras à esquerda do Fim da Trilha SOLO são dos Guardas. O custo do Equipamento que levou o Guarda até lá define a casa:"),
          rl("Top (1)", `discard the left-most Park (slot 1). The Ranger moves right to the First Hiker slot and gains the First Hiker Marker ${glyph("first-hiker")} if you have not already claimed that slot this Season. If you have, the Ranger moves to the Reserve a Park area, making that action unavailable until the next Season.`, "Em cima (1)", `descarte o Parque da esquerda (casa 1). O Guarda vai para a direita, para a casa do Primeiro Caminhante, e ganha o Marcador de Primeiro Caminhante ${glyph("first-hiker")} se você ainda não ocupou essa casa nesta Estação. Se já ocupou, o Guarda vai para a área Reservar um Parque, tornando essa ação indisponível até a próxima Estação.`),
          rl("Middle (2)", `discard the middle Park (slot 2) and return the Camera ${glyph("camera")} to the supply.`, "Meio (2)", `descarte o Parque do meio (casa 2) e devolva a Câmera ${glyph("camera")} à reserva.`),
          rl("Bottom (3)", "discard the right Park (slot 3) and shuffle all 3-cost Gear on the board back into the Gear deck.", "Embaixo (3)", "descarte o Parque da direita (casa 3) e embaralhe todos os Equipamentos de custo 3 do tabuleiro de volta no baralho de Equipamento."),
          t("Park slots emptied by a Ranger stay empty until the end of the Season; Parks you visit are replaced as usual. If a second Ranger would take the same slot, nothing happens.", "Casas de Parque esvaziadas por um Guarda ficam vazias até o fim da Estação; Parques que você visita são repostos normalmente. Se um segundo Guarda fosse ocupar a mesma casa, nada acontece.")
        ], [7])}
        ${infoCard(t("LAST ON THE TRAIL", "ÚLTIMOS NA TRILHA"), t("Last Hikers or Rangers", "Últimos Caminhantes ou Guardas"), [
          t("If both your Hikers reach the Trail End before the Rangers, all remaining Rangers are pulled to the Trail End and take no Trail End action.", "Se os seus dois Caminhantes chegam ao Fim da Trilha antes dos Guardas, todos os Guardas restantes são puxados para o Fim da Trilha e não fazem ação de Fim da Trilha."),
          t("If both Rangers reach the Trail End first, all your Hikers still on the Trail move to the Trail End. Whether one or two of them were left, you choose only one final Trail End action before the Season ends.", "Se os dois Guardas chegam primeiro ao Fim da Trilha, todos os seus Caminhantes ainda na Trilha vão para o Fim da Trilha. Seja um ou dois, você escolhe só uma ação final do Fim da Trilha antes de a Estação acabar."),
          t("Season end: refill the Park slots emptied by the Rangers, then do the normal end-of-Season steps. The game ends after the 4th Season as usual.", "Fim da Estação: reponha as casas de Parque esvaziadas pelos Guardas e então faça os passos normais de fim de Estação. A partida acaba depois da 4ª Estação, como sempre.")
        ], [7])}
      </div>
      <div class="pk-art-row">
        ${figure("solo-trail-end", t("Rulebook PDF p. 7: the three Ranger slots — top: discard Park 1, Ranger to the First Hiker slot; middle: discard Park 2, Camera to the supply; bottom: discard Park 3, 3-cost Gear back into the deck", "Livro PDF p. 7: as três casas dos Guardas — em cima: descarta o Parque 1, Guarda para a casa do Primeiro Caminhante; meio: descarta o Parque 2, Câmera para a reserva; embaixo: descarta o Parque 3, Equipamento de custo 3 de volta ao baralho"))}
      </div>`;
  }

  // ---------- icons ----------

  function iconsSection() {
    const solo = isSolo();
    const icons = [
      iconCard("forest", "Forest token", "Forest resource (16 in the supply).", "Ficha de Floresta", "Recurso de Floresta (16 na reserva).", 2),
      iconCard("mountain", "Mountain token", "Mountain resource (16).", "Ficha de Montanha", "Recurso de Montanha (16).", 2),
      iconCard("sunshine", "Sunshine token", "Sunshine resource (30). Also the currency for Gear.", "Ficha de Sol", "Recurso de Sol (30). Também é a moeda do Equipamento.", [2, 4]),
      iconCard("water", "Water token", "Water resource (30). Fresh Water can fill Canteens; the River costs one.", "Ficha de Água", "Recurso de Água (30). Água fresca pode encher Cantis; o Rio custa uma.", [2, 4]),
      iconCard("wildlife", "Wildlife token", "12 unique shapes, all simply Wildlife: replaces any token for Parks, Photos, Gear and the River.", "Ficha de Vida Selvagem", "12 formatos únicos, todos simplesmente Vida Selvagem: substitui qualquer ficha em Parques, Fotos, Equipamento e no Rio.", [2, 3]),
      iconCard("token-symbol", "Token symbol", "A brown square: any token may be used; the number inside says how many.", "Símbolo de ficha", "Um quadrado marrom: qualquer ficha pode ser usada; o número dentro diz quantas.", 3),
      iconCard("photo", "Photo", "Worth 1 point each (28 in the supply).", "Foto", "Vale 1 ponto cada (28 na reserva).", [2, 4]),
      iconCard("year-photos", "Photos on Year cards", "Certain Year cards require a number of Photos to be taken.", "Fotos nas cartas de Ano", "Certas cartas de Ano exigem uma quantidade de Fotos tiradas.", 4),
      iconCard("camera", "Camera", "Makes Photos at the Photo Site cost 1 token; its holder may take a 1-token Photo at each Season's end.", "Câmera", "Faz as Fotos no Local da Foto custarem 1 ficha; quem a tem pode tirar uma Foto de 1 ficha no fim de cada Estação.", [2, 4]),
      iconCard("first-hiker", "First Hiker Marker", "Starts the Season; taken by the first Hiker to Reserve a Park at the Trail End; 1 point at the end.", "Marcador de Primeiro Caminhante", "Começa a Estação; pego pelo primeiro Caminhante a Reservar um Parque no Fim da Trilha; 1 ponto no final.", [2, 4]),
      iconCard("campfire", "Campfire", "Flip to extinguished to visit an occupied Site; relights when one of your Hikers reaches the Trail End.", "Fogueira", "Vire para o lado apagado para visitar um Local ocupado; reacende quando um Caminhante seu chega ao Fim da Trilha.", 4),
      iconCard("draw-canteen", "Draw a Canteen", "Refers to drawing a Canteen card.", "Comprar um Cantil", "Refere-se a comprar uma carta de Cantil.", 4),
      iconCard("filled-canteen", "Canteen in your area", "Refers to Canteens in a player's area (to fill with fresh Water).", "Cantil na sua área", "Refere-se aos Cantis na área de um jogador (para encher com Água fresca).", 4),
      iconCard("trailhead", "Trailhead", "Where Hikers start each Season. Not a Site.", "Início da Trilha", "Onde os Caminhantes começam cada Estação. Não é um Local.", [2, 3]),
      iconCard("basic-site", "Trail Site / Basic Site", "All Basic and Advanced Sites are Trail Sites; Basic Site tiles show only this symbol.", "Local da Trilha / Local Básico", "Todos os Locais Básicos e Avançados são Locais da Trilha; as peças de Local Básico mostram só este símbolo.", [2, 3]),
      iconCard("advanced-site", "Advanced Site", "Advanced Site tiles carry a * by the Trail symbol.", "Local Avançado", "As peças de Local Avançado têm um * junto ao símbolo da Trilha.", [2, 3]),
      iconCard("trail-end", "Trail End", "Where Hikers end the Season and Reserve, Buy Gear or Visit. Not a Site.", "Fim da Trilha", "Onde os Caminhantes terminam a Estação e Reservam, Compram Equipamento ou Visitam. Não é um Local.", [3, 4]),
      iconCard("site-symbol", "Site symbol", "Gear cards name a specific Trail Site through its icon next to the Trail symbol.", "Símbolo de Local", "As cartas de Equipamento citam um Local específico pelo ícone dele junto ao símbolo da Trilha.", 3, true),
      iconCard("season", "Season", "Season cards: one per round, each with an effect and a Weather Pattern.", "Estação", "Cartas de Estação: uma por rodada, cada uma com um efeito e um Padrão Climático.", [2, 3]),
      iconCard("weather-pattern", "Weather Pattern", "The tokens on the bottom right of the Season card, laid on the Trail from the 2nd Site on.", "Padrão Climático", "As fichas no canto inferior direito da carta de Estação, postas na Trilha a partir do 2º Local.", 3),
      iconCard("year", "Year", "Year cards: your secret Personal Bonus goal.", "Ano", "Cartas de Ano: o seu objetivo secreto de Bônus Pessoal.", 2),
      iconCard("instant", "Instant action", "On Gear: used one time immediately upon purchase.", "Ação instantânea", "No Equipamento: usada uma vez, assim que comprado.", 4),
      iconCard("site-gear", "Buy Gear", "The Buy Gear area of the Trail End (also an option of the Parks Site).", "Comprar Equipamento", "A área Comprar Equipamento do Fim da Trilha (também uma opção do Local de Parques).", [3, 4]),
      iconCard("reserve-park", "Reserve a Park", "The Reserve a Park area of the Trail End.", "Reservar um Parque", "A área Reservar um Parque do Fim da Trilha.", 4, true),
      iconCard("visit-park", "Visit a Park", "The Visit a Park area of the Trail End: pay tokens, take the Park.", "Visitar um Parque", "A área Visitar um Parque do Fim da Trilha: pague fichas, pegue o Parque.", 4, true),
      iconCard("last-hiker", "Last Hiker on the Trail", "The last Hiker on the Trail must go straight to the Trail End.", "Último Caminhante na Trilha", "O último Caminhante na Trilha deve ir direto ao Fim da Trilha.", 5),
      iconCard("solo", "Solo", "Solo mode: SOLO deck, Trail End SOLO side.", "Solo", "Modo solo: baralho SOLO, lado SOLO do Fim da Trilha.", [2, 6])
    ];
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), sectionIndex("icons"), [2, 3, 4])}
      <p class="glossary-intro">${t(
        `Each image is cropped individually from the rulebook. The Site icons are shown in the Turns & Trail Sites section.${solo ? "" : " The Solo icon is shown because the Trail End must be placed on its other side."}`,
        `Cada imagem foi recortada individualmente do livro de regras. Os ícones dos Locais estão na seção Turnos e Locais da Trilha.${solo ? "" : " O ícone Solo aparece porque o Fim da Trilha deve ficar do outro lado."}`
      )}</p>
      <div class="icon-grid">${icons.join("")}</div>`;
  }

  // ---------- examples ----------

  function examplesSection() {
    const solo = isSolo();
    const manualExamples = [
      {
        title: t("Weather Pattern", "Padrão Climático"),
        art: ["weather-example", t("Rulebook PDF p. 3: the pattern starts on the 2nd Site", "Livro PDF p. 3: o padrão começa no 2º Local")],
        lines: [
          t(`The Season card's Weather Pattern shows Sunshine, Water, Sunshine ${glyph("sunshine")}${glyph("water")}${glyph("sunshine")}.`, `O Padrão Climático da carta de Estação mostra Sol, Água, Sol ${glyph("sunshine")}${glyph("water")}${glyph("sunshine")}.`),
          t("Nothing goes on the 1st Site. From the 2nd Site: Sunshine, Water, Sunshine, then the pattern repeats (Sunshine, Water, Sunshine…) until the Trail End.", "Nada vai no 1º Local. A partir do 2º Local: Sol, Água, Sol, e então o padrão se repete (Sol, Água, Sol…) até o Fim da Trilha.")
        ],
        pages: [3]
      },
      {
        title: t("Moving down the Trail", "Andando pela Trilha"),
        art: ["turn-example", t("Rulebook PDF p. 3: green moves to the Wildlife Site", "Livro PDF p. 3: o verde vai ao Local de Vida Selvagem")],
        lines: [
          t("The green player chooses to move a Hiker down the Trail to the Wildlife Site, skipping the Sites in between.", "O jogador verde escolhe mover um Caminhante pela Trilha até o Local de Vida Selvagem, pulando os Locais do meio."),
          t("They take its action: turn in any one token to gain a Wildlife token.", "Ele faz a ação: entrega uma ficha qualquer para ganhar uma ficha de Vida Selvagem.")
        ],
        pages: [3]
      },
      {
        title: t("Using a Campfire", "Usando a Fogueira"),
        art: ["campfire-example", t("Rulebook PDF p. 4: the pink Campfire is flipped", "Livro PDF p. 4: a Fogueira rosa é virada")],
        lines: [
          t(`The pink player wants to visit the Two Sunshine Site ${glyph("site-two-sunshine")}, but the green Hiker is already there.`, `O jogador rosa quer visitar o Local de dois Sóis ${glyph("site-two-sunshine")}, mas o Caminhante verde já está lá.`),
          t("Pink flips their Campfire to the extinguished side, shares the Site and takes its action. Pink cannot share another Site until one of their Hikers reaches the Trail End.", "O rosa vira a Fogueira para o lado apagado, divide o Local e faz a ação. O rosa não pode dividir outro Local até um Caminhante seu chegar ao Fim da Trilha.")
        ],
        pages: [4]
      },
      {
        title: t("Season of Snow at the Exchange Site", "Estação da Neve no Local de Troca"),
        lines: [
          t(`During the Season of Snow you turn in a Sunshine ${glyph("sunshine")} to gain a Mountain ${glyph("mountain")} at the Exchange Site.`, `Durante a Estação da Neve (Season of Snow) você entrega um Sol ${glyph("sunshine")} para ganhar uma Montanha ${glyph("mountain")} no Local de Troca.`),
          t(`This triggers the Season effect, so you gain a Water ${glyph("water")}.`, `Isso dispara o efeito da Estação, então você ganha uma Água ${glyph("water")}.`),
          t("You may then turn in that Water to gain another Mountain, since the action may be repeated a second time.", "Você pode então entregar essa Água para ganhar outra Montanha, já que a ação pode ser repetida uma segunda vez."),
          t("You do not gain another Water from the Season effect: it is one Water per turn.", "Você não ganha outra Água pelo efeito da Estação: é uma Água por turno.")
        ],
        pages: [5]
      },
      {
        title: t("Filling a brand-new Canteen", "Enchendo um Cantil novinho"),
        lines: [
          t(`On one turn you gain a Water ${glyph("water")} and draw a Canteen ${glyph("draw-canteen")} (for example, a Water weather token on the Canteen / Photo Site).`, `Num turno você ganha uma Água ${glyph("water")} e compra um Cantil ${glyph("draw-canteen")} (por exemplo, uma ficha de clima de Água no Local de Cantil / Foto).`),
          t("You may use that Water to fill the Canteen you just drew and take its action.", "Você pode usar essa Água para encher o Cantil que acabou de comprar e fazer a ação dele."),
          t("Weather tokens are collected immediately, so they can also pay for that Site's action — such as the token turned in at the Wildlife Site.", "Fichas de clima são recolhidas na hora, então também podem pagar a ação do Local — como a ficha entregue no Local de Vida Selvagem.")
        ],
        pages: [5]
      },
      {
        title: t("A Year card goal", "Um objetivo de carta de Ano"),
        art: ["year-cards", t("Rulebook PDF p. 5: Year of Leaves, visited Parks, First Hiker Marker, Photos", "Livro PDF p. 5: Ano das Folhas, Parques visitados, Marcador de Primeiro Caminhante, Fotos")],
        lines: [
          t(`“Visit 6 Parks with ${glyph("forest")}” rewards 2 points if you visit 6 Park cards that have a Forest symbol on them.`, `“Visite 6 Parques com ${glyph("forest")}” dá 2 pontos se você visitar 6 cartas de Parque que tenham um símbolo de Floresta.`),
          t("The pictured card (Year of Leaves) gives 3 points instead for 8 such Parks.", "A carta da figura (Ano das Folhas) dá 3 pontos se forem 8 desses Parques.")
        ],
        pages: [5]
      }
    ];
    if (solo) {
      manualExamples.push({
        title: t("Ranger turn", "Turno dos Guardas"),
        art: ["solo-ranger-example", t("Rulebook PDF p. 7: the Front Ranger skips the Site your Hiker occupies", "Livro PDF p. 7: o Guarda da Frente pula o Local ocupado pelo seu Caminhante")],
        lines: [
          t("Your Hiker is currently ahead on the Trail. A 2-cost Gear card is revealed into the middle Gear slot, so the Front Ranger moves two spaces forward.", "O seu Caminhante está à frente na Trilha. Uma carta de Equipamento de custo 2 é revelada na casa do meio, então o Guarda da Frente anda dois espaços."),
          t("Your Hiker occupies that Site, so instead of landing there the Ranger moves to the next open Site down the Trail.", "O seu Caminhante ocupa esse Local, então em vez de parar lá o Guarda vai ao próximo Local livre da Trilha."),
          t(`It picks up that Site's Water ${glyph("water")} weather token and places it on the Tracker's Water row.`, `Ele pega a ficha de clima de Água ${glyph("water")} desse Local e a coloca na linha de Água do Rastreador.`)
        ],
        pages: [7]
      });
    }
    const guideExamples = [
      {
        title: t("A trip to the Trail End", "Uma ida ao Fim da Trilha"),
        lines: [
          t("Guide's own example. Ana holds 2 Forest, 1 Water and 1 Wildlife; a board Park costs Forest, Forest, Water, Sunshine.", "Exemplo do próprio guia. Ana tem 2 Florestas, 1 Água e 1 Vida Selvagem; um Parque do tabuleiro custa Floresta, Floresta, Água, Sol."),
          t("She moves a Hiker to the Trail End, relights her Campfire, and chooses Visit a Park: she pays 2 Forest, 1 Water and the Wildlife in place of the Sunshine.", "Ela leva um Caminhante ao Fim da Trilha, reacende a Fogueira e escolhe Visitar um Parque: paga 2 Florestas, 1 Água e a Vida Selvagem no lugar do Sol."),
          t("She places the Park vertically in her score area and a new Park is revealed into the empty slot.", "Ela põe o Parque na vertical na sua área de pontos e um novo Parque é revelado na casa vazia."),
          solo ? null : t("Bruno arrives next and chooses Reserve a Park: he is the first there this Season, so he takes the far-right slot and the First Hiker Marker.", "Bruno chega depois e escolhe Reservar um Parque: ele é o primeiro lá nesta Estação, então ocupa a casa mais à direita e pega o Marcador de Primeiro Caminhante.")
        ],
        pages: [4]
      }
    ];
    const card = (example, index, sourceEn, sourcePt) => `
      <article class="example-card">
        <span class="card-number">${String(index + 1).padStart(2, "0")}</span>
        <h3>${example.title}</h3>
        ${example.art ? figure(example.art[0], example.art[1]) : ""}
        ${lineList(example.lines)}
        <div class="example-source"><span>${t(sourceEn, sourcePt)}</span>${example.pages.map(referenceLink).join(" ")}</div>
      </article>`;
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), sectionIndex("examples"), [3, 4, 5])}
      <div class="example-grid pk-example-grid">${manualExamples.map((example, index) => card(example, index, "Rulebook example", "Exemplo do manual")).join("")}${guideExamples.map((example, index) => card(example, manualExamples.length + index, "Guide's example", "Exemplo do guia")).join("")}</div>`;
  }

  // ---------- FAQ ----------

  function faqSection() {
    const items = [
      [t("Can I visit a Site without taking its action?", "Posso visitar um Local sem fazer a ação dele?"), t("No. To visit a Site you must take the full action; if you cannot (for example, no token to exchange at the Exchange Site), you cannot visit it.", "Não. Para visitar um Local você precisa fazer a ação completa; se não puder (por exemplo, sem ficha para trocar no Local de Troca), não pode visitá-lo.")],
      [t("Can I use weather toward a Site's action?", "Posso usar o clima na ação do Local?"), t("Yes. Weather tokens on a Site are collected immediately, so they can pay for that Site's action.", "Sim. As fichas de clima de um Local são recolhidas na hora, então podem pagar a ação desse Local.")],
      [t("What if we run out of a token?", "E se uma ficha acabar?"), t("If a token type is gone from the supply, the Site linked to it cannot be visited, since its action cannot be taken. Once tokens return to the supply, the Site is available again.", "Se um tipo de ficha acabou na reserva, o Local ligado a ele não pode ser visitado, pois a ação não pode ser feita. Quando as fichas voltam à reserva, o Local fica disponível de novo.")],
      [t("When can I fill a Canteen?", "Quando posso encher um Cantil?"), t("Only with Water collected on that turn, in any order, even into a Canteen gained that same turn. Water collected earlier cannot.", "Só com Água recolhida naquele turno, em qualquer ordem, até num Cantil ganho no mesmo turno. Água recolhida antes não serve.")],
      [t("How does the Exchange ×2 Site work?", "Como funciona o Local de Troca ×2?"), t("Turn in any token to gain any token; you may immediately do it a second time. Wildlife can be neither turned in nor gained there. You may gain the same type you turned in.", "Entregue qualquer ficha para ganhar qualquer ficha; pode repetir na hora uma segunda vez. Vida Selvagem não pode ser entregue nem ganha lá. Você pode ganhar o mesmo tipo que entregou.")],
      [t("Does the Exchange Site count toward Season effects?", "O Local de Troca conta para efeitos de Estação?"), t("Yes (see the Season of Snow example). So do actions on Canteens.", "Sim (veja o exemplo da Estação da Neve). As ações de Cantis também contam.")],
      [t("Does the River activate Gear that names a Site?", "O Rio ativa Equipamento que cita um Local?"), t("No. It copies another Site's action but does not count as visiting it. Tokens gained there can still benefit from Season effects.", "Não. Ele copia a ação de outro Local mas não conta como visitá-lo. Fichas ganhas lá ainda podem se beneficiar de efeitos de Estação.")],
      [t("Can Maps, Compasses and Journals combine?", "Mapas, Bússolas e Diários se somam?"), t("Yes. Their discounts on visiting a Park are cumulative, but a token type on a Park can never go below zero.", "Sim. Os descontos para visitar um Parque são cumulativos, mas um tipo de ficha num Parque nunca fica abaixo de zero.")],
      [t("How do Sunscreen and Rain Gear work?", "Como funcionam Protetor Solar e Capa de Chuva?"), t("They let you visit a Park using a different token type in place of another, applied to the symbols printed on the Park card (not to other Gear's discounts).", "Deixam você visitar um Parque usando outro tipo de ficha no lugar de outro, aplicado aos símbolos impressos na carta do Parque (não aos descontos de outros Equipamentos).")],
      [t("How does the Water Bottle's free fill work?", "Como funciona o enchimento grátis da Garrafa de Água?"), t("When you visit the Site it names, you may take a Water from the supply for free and put it into a Canteen to activate it.", "Quando você visita o Local que ele cita, pode pegar de graça uma Água da reserva e pô-la num Cantil para ativá-lo.")],
      [t("How do the Seasons of Rain and Splendor work?", "Como funcionam as Estações de Chuva e de Esplendor?"), t("At the start of the Season, one Water (Rain) or Sunshine (Splendor) goes on each of the 3 board Parks. Visiting or reserving that Park also gives the token, usable at once. Parks revealed later in the Season get none.", "No início da Estação, uma Água (Chuva) ou um Sol (Esplendor) vai em cada um dos 3 Parques do tabuleiro. Visitar ou reservar esse Parque dá também a ficha, usável na hora. Parques revelados depois na Estação não recebem.")]
    ];
    return `
      ${sectionHeading("faq", t("Common questions", "Perguntas comuns"), sectionIndex("faq"), [5])}
      <div class="quick-grid">${items.map(([q, a]) => `
        <article class="info-card">
          <span class="component-label">${t("RULEBOOK FAQ", "FAQ DO LIVRO")}</span>
          <h3>${q}</h3>
          <p>${a}</p>
          ${referenceLink(5)}
        </article>`).join("")}</div>`;
  }

  // ---------- glossary ----------

  function glossarySection() {
    const solo = isSolo();
    const visible = [
      { term: ["Hiker", "Caminhante"], text: ["Your two meeples. They walk the Trail from the Trailhead to the Trail End each Season.", "Os seus dois peões. Eles percorrem a Trilha do Início ao Fim a cada Estação."], page: 2 },
      { term: ["Trail", "Trilha"], text: ["The row of Site tiles between the Trailhead and the Trail End; rebuilt one Site longer each Season.", "A fila de peças de Local entre o Início e o Fim da Trilha; remontada com um Local a mais a cada Estação."], page: 2 },
      { term: ["Site", "Local"], text: ["A Basic or Advanced Site tile on the Trail; landing on it gives its action. The Trailhead and Trail End are not Sites.", "Uma peça de Local Básico ou Avançado na Trilha; parar nele dá a ação dele. O Início e o Fim da Trilha não são Locais."], page: 3 },
      { term: ["Supply", "Reserva"], text: ["The two token trays (shared), and also your own tokens in front of you (“into your supply”).", "As duas bandejas de fichas (compartilhadas), e também as suas fichas à sua frente (“na sua reserva”)."], page: 2 },
      { term: ["Season", "Estação"], text: ["One of the 4 rounds; its card gives an effect and a Weather Pattern.", "Uma das 4 rodadas; a carta dá um efeito e um Padrão Climático."], page: 3 },
      { term: ["Weather Pattern", "Padrão Climático"], text: ["Tokens placed on the Trail from the 2nd Site; the first Hiker on each such Site takes the token.", "Fichas postas na Trilha a partir do 2º Local; o primeiro Caminhante em cada Local desses pega a ficha."], page: 3 },
      { term: ["Park", "Parque"], text: ["Large card with a token cost and points. Reserved Parks lie horizontally; visited Parks stand vertically in your score area.", "Carta grande com custo em fichas e pontos. Parques reservados ficam na horizontal; os visitados, na vertical na sua área de pontos."], page: 4 },
      { term: ["Gear", "Equipamento"], text: ["Cards bought with Sunshine; ongoing abilities, sometimes an Instant action.", "Cartas compradas com Sol; habilidades contínuas, às vezes uma Ação instantânea."], page: 4 },
      { term: ["Canteen", "Cantil"], text: ["Card filled with a Water gained that turn to trigger its action; emptied at Season end.", "Carta enchida com uma Água ganha no turno para disparar a ação; esvaziada no fim da Estação."], page: 4 },
      { term: ["Campfire", "Fogueira"], text: ["Your one-use pass to share an occupied Site, relit at the Trail End.", "O seu passe de uso único para dividir um Local ocupado, reaceso no Fim da Trilha."], page: 4 },
      { term: ["Year card", "Carta de Ano"], text: ["Secret Personal Bonus goal worth 2 or 3 points.", "Objetivo secreto de Bônus Pessoal que vale 2 ou 3 pontos."], page: 5 },
      { term: ["Wildlife", "Vida Selvagem"], text: ["Wild token that replaces any token except for Canteens and the Exchange Site.", "Ficha coringa que substitui qualquer ficha, exceto em Cantis e no Local de Troca."], page: 3 },
      { term: ["Upkeep", "Manutenção"], text: ["The board area with the end-of-Season reminder.", "A área do tabuleiro com o lembrete de fim de Estação."], page: 2 },
      solo ? { term: ["Ranger", "Guarda-parque"], text: ["One of the two solo opponents (Hikers of another colour), moved by Gear card costs.", "Um dos dois adversários do solo (Caminhantes de outra cor), movidos pelo custo das cartas de Equipamento."], page: 7 } : null,
      solo ? { term: ["Front / Back Ranger", "Guarda da Frente / de Trás"], text: ["The Ranger furthest down the Trail / furthest from the Trail End.", "O Guarda mais adiantado na Trilha / o mais longe do Fim da Trilha."], page: 7 } : null,
      solo ? { term: ["Front Hiker", "Caminhante da Frente"], text: ["Your Hiker furthest down the Trail.", "O seu Caminhante mais adiantado na Trilha."], page: 7 } : null,
      solo ? { term: ["Ranger Tracker", "Rastreador dos Guardas"], text: ["Solo card collecting Rangers' weather tokens; 3 of a type triggers an event.", "Carta do solo que junta as fichas de clima dos Guardas; 3 de um tipo disparam um evento."], page: 7 } : null
    ].filter(Boolean);
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), sectionIndex("glossary"), [2, 3, 4])}
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
    document.body.classList.add("theme-parks");
    document.documentElement.lang = state.language;
    document.title = t("Parks — Field Manual", "Parks — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Parks: hike the Trail over four Seasons, collect tokens, visit national Parks — setup checklist filtered by player count (solo with Rangers to 5 players), Trail Sites, Trail End, Canteens, Photos, Seasons and the rulebook examples.",
        "Regras interativas bilíngues de Parks: percorra a Trilha em quatro Estações, junte fichas, visite Parques nacionais — lista de preparação filtrada pelo número de jogadores (solo com Guardas até 5 jogadores), Locais da Trilha, Fim da Trilha, Cantis, Fotos, Estações e os exemplos do manual."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook", "Livro interativo")}</p>
          <h1>Parks</h1>
          <p class="hero-intro">${t(
            "Two hikers, four Seasons, one growing Trail. Walk past forests, mountains, rivers and lookouts, gather what you see, snap Photos, and spend it all at the Trail End to visit America's national parks.",
            "Dois caminhantes, quatro Estações, uma Trilha que cresce. Passe por florestas, montanhas, rios e mirantes, junte o que encontrar, tire Fotos e gaste tudo no Fim da Trilha para visitar os parques nacionais dos EUA."
          )}</p>
          <div class="hero-meta"><span>${t("1–5 players", "1–5 jogadores")}</span><span>${t("4 Seasons", "4 Estações")}</span><span>${t("Solo mode included", "Modo solo incluído")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/parks.webp" alt="${t("Cover of the Parks rulebook", "Capa do livro de regras de Parks")}" fetchpriority="high"><figcaption>${t("Rulebook cover · Keymaster Games", "Capa do livro de regras · Keymaster Games")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("The trail", "A trilha")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column pk-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied English rulebook (Keymaster Games, version 1.1). The PDF stores two printed pages per PDF page, so links use PDF pages: PDF 2 = printed pp. 1–2, PDF 3 = pp. 3–4, PDF 4 = pp. 5–6, PDF 5 = pp. 7–8, PDF 6 = pp. 9–10 (artists, credits, solo setup) and PDF 7 = the solo reference. Season effects, Year goals, Canteen actions, Gear abilities and solo events are printed on their cards. Points marked “Guide's reading” are interpretations where the rulebook is silent.",
            "Este guia cobre o livro de regras em inglês fornecido (Keymaster Games, versão 1.1). O PDF guarda duas páginas impressas por página do PDF, então os links usam páginas do PDF: PDF 2 = pp. impressas 1–2, PDF 3 = pp. 3–4, PDF 4 = pp. 5–6, PDF 5 = pp. 7–8, PDF 6 = pp. 9–10 (artistas, créditos, preparação solo) e PDF 7 = a referência do solo. Efeitos de Estação, objetivos de Ano, ações de Cantil, habilidades de Equipamento e eventos solo estão impressos nas cartas. Trechos marcados como “Leitura do guia” são interpretações onde o livro é omisso."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${victorySection()}</section>
          <section class="rule-section">${turnsSection()}</section>
          <section class="rule-section">${trailEndSection()}</section>
          <section class="rule-section">${detailsSection()}</section>
          <section class="rule-section">${seasonsSection()}</section>
          ${isSolo() ? `<section class="rule-section">${soloSection()}</section>` : ""}
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${faqSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the Parks rulebook. Parks is a game by Henry Audubon, published by Keymaster Games, with art from the Fifty-Nine Parks Print Series.",
        "Guia pessoal de consulta baseado no livro de regras de Parks. Parks é um jogo de Henry Audubon, publicado pela Keymaster Games, com arte da Fifty-Nine Parks Print Series."
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
      root.querySelector(".pk-page")?.prepend(notice);
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
    if (target.matches("[data-year]")) {
      const value = target.dataset.year;
      if (YEAR_MODES.includes(value) && value !== state.year) {
        applyMatchChange({ year: value });
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

  window.Parks = { renderInto, onClick, onChange };
})();
