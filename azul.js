(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.azul.v1";
  const SETUP_KEY = "field-manual.azul.setup.v1";
  const MANUAL = "azul_core.pdf";
  const ICONS = "assets/azul/icons/";

  // ---------- rules data ----------

  const COLORS = {
    blue: { en: "Blue", pt: "Azul", lookEn: "plain dark blue", lookPt: "azul-escuro liso" },
    yellow: { en: "Yellow", pt: "Amarelo", lookEn: "orange-yellow with a red pattern", lookPt: "amarelo-alaranjado com desenho vermelho" },
    red: { en: "Red", pt: "Vermelho", lookEn: "plain red", lookPt: "vermelho liso" },
    black: { en: "Black", pt: "Preto", lookEn: "black with bluish rosettes", lookPt: "preto com rosetas azuladas" },
    turquoise: { en: "Turquoise", pt: "Turquesa", lookEn: "white with a turquoise star", lookPt: "branco com uma estrela turquesa" }
  };
  const COLOR_IDS = Object.keys(COLORS);

  // The colored side of the player board (rulebook pictures, pp. 2–5): each row is the row above shifted one space right.
  const WALL = [
    ["blue", "yellow", "red", "black", "turquoise"],
    ["turquoise", "blue", "yellow", "red", "black"],
    ["black", "turquoise", "blue", "yellow", "red"],
    ["red", "black", "turquoise", "blue", "yellow"],
    ["yellow", "red", "black", "turquoise", "blue"]
  ];

  // Floor line spaces, left to right (rulebook p. 5).
  const FLOOR = [-1, -1, -2, -2, -2, -3, -3];

  const PLAYER_COUNTS = ["2", "3", "4"];
  const SIDES = ["color", "gray"];
  const defaults = { language: "pt-BR", players: "2", side: "color" };
  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // The wall practice grid lives in memory only: it is never saved.
  let trainer = freshTrainer();

  // ---------- state & storage ----------

  function normalizePreferences(saved) {
    return {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      players: PLAYER_COUNTS.includes(String(saved?.players)) ? String(saved.players) : defaults.players,
      side: SIDES.includes(saved?.side) ? saved.side : defaults.side
    };
  }

  // The player count and the board side change the preparation; the language never clears the checklist.
  function signature(source = state) {
    return `${source.players}|${source.side}`;
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Azul preferences.", error);
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
      console.error("Could not read Azul setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Azul preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Azul setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function players() {
    return Number(state.players);
  }

  function gray() {
    return state.side === "gray";
  }

  // 2 players: 5 Factory displays, 3: 7, 4: 9 (rulebook p. 2).
  function factories(count = players()) {
    return Number(count) * 2 + 1;
  }

  function scriptBase() {
    const script = document.querySelector('script[src*="azul.js"]');
    return script?.src || document.baseURI;
  }

  // The PDF holds the booklet as two spreads of three pages: PDF page 1 = printed pages 2–4,
  // PDF page 2 = printed pages 5–6 and the cover (printed page 1).
  function pdfPage(page) {
    return page >= 2 && page <= 4 ? 1 : 2;
  }

  function manualUrl(page) {
    return `${new URL(`manuals/${MANUAL}`, scriptBase()).href}#page=${pdfPage(page)}`;
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
          <p class="eyebrow">${t("PALACE OF ÉVORA", "PALÁCIO DE ÉVORA")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="az-section-references">${uniquePages(pages).map(referenceLink).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
  }

  function interpretation(en, pt) {
    return `<span class="az-interpretation">${t("Guide's reading", "Leitura do guia")}</span> ${t(en, pt)}`;
  }

  // The supplied rulebook is in English: in PT-BR, show the printed English term so it can be matched.
  function en(term) {
    return state.language === "pt-BR" ? ` <span class="az-en" lang="en">(${term})</span>` : "";
  }

  function icon(file, alt) {
    return `<img class="az-inline-icon" src="${ICONS}${file}.webp" alt="${alt}">`;
  }

  function colorName(id) {
    return t(COLORS[id].en, COLORS[id].pt);
  }

  function tile(id) {
    return `${icon(`tile-${id}`, colorName(id))}<strong>${colorName(id)}</strong>`;
  }

  function allTiles() {
    return COLOR_IDS.map((id) => `<span class="az-nowrap">${tile(id)}</span>`).join(" · ");
  }

  function floorIcons() {
    return FLOOR.map((value) => icon(`floor-${Math.abs(value)}`, String(value).replace("-", "−"))).join("");
  }

  function iconCard(file, titleEn, bodyEn, titlePt, bodyPt, page) {
    const title = t(titleEn, titlePt);
    return `
      <article class="icon-card">
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

  function playersLabel(count = state.players) {
    return t(`${count} players`, `${count} jogadores`);
  }

  function sideLabel(side = state.side) {
    return side === "gray" ? t("Gray wall (variant)", "Parede cinza (variante)") : t("Colored wall", "Parede colorida");
  }

  // Where the rightmost tile of a complete pattern line goes, for the selected side.
  function wallDestination() {
    return gray()
      ? t(
        "to <strong>any free space of the wall row beside it</strong>, as long as that space's column (vertical line) does not already hold a tile of that color",
        "para <strong>qualquer espaço livre da linha da parede ao lado</strong>, desde que a coluna desse espaço ainda não tenha um azulejo dessa cor"
      )
      : t(
        "to the <strong>space of the same color</strong> in the wall row beside it",
        "para o <strong>espaço da mesma cor</strong> na linha da parede ao lado"
      );
  }

  // ---------- sections ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Reference", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["factory-offer", t("A · Factory offer", "A · Oferta das fábricas")],
      ["wall-tiling", t("B · Wall-tiling", "B · Azulejar a parede")],
      ["scoring", t("Scoring a tile", "Pontuar um azulejo")],
      ["next-round", t("C · Next round & game end", "C · Próxima rodada e fim")],
      ["icons", t("Iconography", "Iconografia")],
      ["examples", t("Examples", "Exemplos")],
      ["glossary", t("Glossary", "Glossário")]
    ];
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
          <span class="brand-mark" aria-hidden="true">AZ</span>
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
      `${readFailed ? "This browser could not read the saved Azul match or setup progress; defaults are shown. " : ""}${writeFailed ? "The latest change could not be saved and is visible on screen only." : ""}`,
      `${readFailed ? "Este navegador não conseguiu ler a partida ou o progresso de Azul salvos; as opções padrão estão sendo mostradas. " : ""}${writeFailed ? "A alteração mais recente não pôde ser salva e aparece somente na tela." : ""}`
    ).trim();
  }

  // ---------- configuration ----------

  function choiceCard(name, value, dataAttr, checked, title, description) {
    return `
      <label class="az-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" ${dataAttr} ${checked ? "checked" : ""}>
        <span class="az-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function group(legend, selected, intro, cards, columns = "") {
    return `
      <fieldset class="az-choice-group">
        <legend>${legend} <span>${selected}</span></legend>
        <p class="az-choice-intro">${intro}</p>
        <div class="az-choice-grid ${columns}">${cards}</div>
      </fieldset>`;
  }

  function playerChoiceText(count) {
    const n = Number(count);
    const f = factories(n);
    const left = 4 - n;
    return t(
      `${f} Factory displays, so ${f * 4} tiles are offered each round (4 per display). ${n} player boards and ${n} scoring markers are used${left ? `; ${left} of each stay${left === 1 ? "s" : ""} in the box` : ""}${f < 9 ? `, along with ${9 - f} Factory displays` : " — every Factory display is in play"}.`,
      `${f} Expositores de Fábrica, então ${f * 4} azulejos são oferecidos a cada rodada (4 por expositor). São usados ${n} tabuleiros e ${n} marcadores de pontuação${left ? `; ${left === 1 ? "1 de cada fica" : `${left} de cada ficam`} na caixa` : ""}${f < 9 ? `, junto com ${9 - f} Expositores de Fábrica` : " — todos os Expositores de Fábrica estão em jogo"}.`
    );
  }

  function matchConfiguration() {
    return `
      <section class="controls-panel az-config" id="build-match" aria-labelledby="az-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="az-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "The Azul rulebook has two decisions to make before setting up: how many people play, and which side of the player boards everyone uses. Everything below is filtered to this match and saved on this device only.",
              "O manual de Azul tem duas decisões a tomar antes da preparação: quantas pessoas jogam e qual lado dos tabuleiros todos usam. Tudo abaixo é filtrado para esta partida e salvo só neste aparelho."
            )}</p>
          </div>
        </div>
        ${group(t("Players · selected:", "Jogadores · selecionado:"), `${playersLabel()} · ${t(`${factories()} Factory displays`, `${factories()} Expositores de Fábrica`)}`,
          `${t("Azul plays 2 to 4. The rules are identical at every count; only the number of Factory displays changes — and with it how many tiles are offered each round.", "Azul é para 2 a 4 jogadores. As regras são idênticas em qualquer número; só muda a quantidade de Expositores de Fábrica — e, com ela, quantos azulejos são oferecidos a cada rodada.")} ${referenceLink(2)}`,
          PLAYER_COUNTS.map((count) => choiceCard("az-players", count, `data-players="${count}"`, state.players === count, playersLabel(count), playerChoiceText(count))).join(""), "az-three")}
        ${group(t("Player board side · selected:", "Lado do tabuleiro · selecionado:"), sideLabel(),
          `${t("Each player board is double-sided. Everyone must use the same side. The side changes only one rule: where a tile goes when it moves onto your wall.", "Cada tabuleiro tem dois lados. Todos devem usar o mesmo lado. O lado muda só uma regra: onde um azulejo vai quando passa para a sua parede.")} ${referenceLink(2)} ${referenceLink(6)}`,
          [
            choiceCard("az-side", "color", 'data-side="color"', state.side === "color", t("Colored wall — standard game", "Parede colorida — jogo padrão"), t(
              "The wall shows a printed pattern of the 5 colors, one space of each color per row and per column. A tile moving onto the wall always goes to the space of its own color in that row: no placement decision. Recommended to learn the game.",
              "A parede mostra um padrão impresso das 5 cores, um espaço de cada cor por linha e por coluna. Um azulejo que passa para a parede sempre vai para o espaço da sua cor naquela linha: não há decisão de posição. Recomendado para aprender o jogo."
            )),
            choiceCard("az-side", "gray", 'data-side="gray"', state.side === "gray", t("Gray wall — variant play", "Parede cinza — variante"), t(
              "The wall spaces are blank gray. You choose any free space of the row for each tile you move, but no color may appear twice in any column (vertical line). All other rules, scoring and bonuses stay the same; you must plan where colors go.",
              "Os espaços da parede são cinza, sem cor. Você escolhe qualquer espaço livre da linha para cada azulejo que move, mas nenhuma cor pode aparecer duas vezes numa coluna. Todas as outras regras, a pontuação e os bônus continuam iguais; é preciso planejar onde cada cor vai."
            ))
          ].join(""), "az-two")}
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function setupPhases() {
    const n = players();
    const f = factories();
    const left = 4 - n;
    return [
      {
        id: "boards",
        title: t(`Player boards and scoring markers · ×${n}`, `Tabuleiros e marcadores de pontuação · ×${n}`),
        pages: [2],
        items: [
          gray()
            ? t(`Give each player 1 player board${en("player board")} with the <strong>gray side</strong> up: its 5×5 wall has blank gray spaces. Everyone uses the gray side.`, `Dê a cada jogador 1 tabuleiro${en("player board")} com o <strong>lado cinza</strong> para cima: a parede 5×5 tem espaços cinza, sem cor. Todos usam o lado cinza.`)
            : t(`Give each player 1 player board${en("player board")} with the side showing the <strong>colored wall</strong> up: its 5×5 wall has a printed pattern of the 5 colors. Everyone uses this side.`, `Dê a cada jogador 1 tabuleiro${en("player board")} com o lado da <strong>parede colorida</strong> para cima: a parede 5×5 tem um padrão impresso das 5 cores. Todos usam esse lado.`),
          t("Find the four areas of your board: the <strong>score track</strong> (top, 0 to 100), the <strong>pattern lines</strong> (left: 5 stepped lines holding 1 to 5 tiles, line 1 at the top), the <strong>wall</strong> (right: 5×5 spaces, each row beside the pattern line of the same number) and the <strong>floor line</strong> (bottom: 7 spaces marked −1, −1, −2, −2, −2, −3, −3).", "Encontre as quatro áreas do tabuleiro: a <strong>trilha de pontuação</strong> (no alto, de 0 a 100), as <strong>linhas de padrão</strong> (à esquerda: 5 linhas em escada para 1 a 5 azulejos, a linha 1 no alto), a <strong>parede</strong> (à direita: 5×5 espaços, cada linha ao lado da linha de padrão do mesmo número) e a <strong>linha do chão</strong> (embaixo: 7 espaços marcados −1, −1, −2, −2, −2, −3, −3)."),
          t(`Each player places 1 scoring marker${en("scoring marker")} on space “0” of their own score track.`, `Cada jogador coloca 1 marcador de pontuação${en("scoring marker")} na casa “0” da própria trilha de pontuação.`),
          left ? t(`Return the ${left === 1 ? "unused player board and scoring marker" : `${left} unused player boards and scoring markers`} to the box.`, `Devolva à caixa ${left === 1 ? "o tabuleiro e o marcador de pontuação não usados" : `os ${left} tabuleiros e marcadores de pontuação não usados`}.`) : null
        ]
      },
      {
        id: "factories",
        title: t(`Factory displays · ${f}`, `Expositores de Fábrica · ${f}`),
        pages: [2],
        items: [
          t(`Place <strong>${f} Factory displays</strong>${en("Factory displays")} ${icon("factory-display", t("Factory display", "Expositor de Fábrica"))} in a circle around the middle of the table (${n} players → ${f}).`, `Coloque <strong>${f} Expositores de Fábrica</strong>${en("Factory displays")} ${icon("factory-display", t("Factory display", "Expositor de Fábrica"))} em círculo em volta do meio da mesa (${n} jogadores → ${f}).`),
          t("Keep the middle of the circle empty: it is the <strong>center of the table</strong>, where the tiles a player does not take from a display are pushed during the round.", "Deixe o meio do círculo vazio: é o <strong>centro da mesa</strong>, para onde vão os azulejos que um jogador não pega de um expositor durante a rodada."),
          f < 9 ? t(`Return the other ${9 - f} Factory displays to the box.`, `Devolva os outros ${9 - f} Expositores de Fábrica à caixa.`) : t("All 9 Factory displays are used.", "Todos os 9 Expositores de Fábrica são usados.")
        ]
      },
      {
        id: "bag",
        title: t("Bag, tiles and the box lid", "Saco, azulejos e a tampa da caixa"),
        pages: [2, 4],
        items: [
          t(`Put all <strong>100 tiles</strong> in the bag${en("bag")} ${icon("bag", t("bag", "saco"))}: 20 of each of the 5 colors — ${allTiles()}.`, `Ponha todos os <strong>100 azulejos</strong> no saco${en("bag")} ${icon("bag", t("saco", "saco"))}: 20 de cada uma das 5 cores — ${allTiles()}.`),
          `${t("The rulebook names blue, yellow, red and black; it never names the fifth color.", "O manual nomeia azul, amarelo, vermelho e preto; nunca dá nome à quinta cor.")} ${interpretation("this guide calls the white tile with a turquoise star “turquoise”.", "este guia chama de “turquesa” o azulejo branco com uma estrela turquesa.")}`,
          t("Keep the empty box lid within reach. During the game, tiles discarded from pattern lines and tiles that fall on the floor are stored in the lid; they go back into the bag only when the bag runs empty.", "Deixe a tampa da caixa vazia ao alcance. Durante a partida, os azulejos descartados das linhas de padrão e os que caem no chão são guardados na tampa; eles só voltam ao saco quando o saco esvazia.")
        ]
      },
      {
        id: "start",
        title: t("Starting player and the first factories", "Primeiro jogador e as primeiras fábricas"),
        pages: [2, 3],
        items: [
          t(`The player who most recently visited Portugal takes the starting player marker${en("starting player marker")} ${icon("start-player-marker", t("starting player marker", "marcador de primeiro jogador"))} (the “1” tile).`, `Quem visitou Portugal mais recentemente pega o marcador de primeiro jogador${en("starting player marker")} ${icon("start-player-marker", t("marcador de primeiro jogador", "marcador de primeiro jogador"))} (a peça “1”).`),
          t(`That player draws tiles at random from the bag and fills each Factory display with <strong>exactly 4 tiles</strong> (${f * 4} tiles in all).`, `Esse jogador tira azulejos do saco ao acaso e enche cada Expositor de Fábrica com <strong>exatamente 4 azulejos</strong> (${f * 4} azulejos no total).`),
          t("Round 1 begins with the Factory offer: the starting player puts the marker in the center of the table and takes the first turn; play goes clockwise.", "A rodada 1 começa com a Oferta das fábricas: o primeiro jogador põe o marcador no centro da mesa e faz o primeiro turno; o jogo segue em sentido horário.")
        ]
      }
    ];
  }

  function inventory() {
    const n = players();
    const f = factories();
    const left = 4 - n;
    const cards = [
      infoCard(t("SHARED", "COMPARTILHADO"), t("Middle of the table", "Meio da mesa"), [
        rl(`${f} Factory displays`, "in a circle, 4 tiles on each at the start of every round.", `${f} Expositores de Fábrica`, "em círculo, com 4 azulejos cada no início de toda rodada."),
        rl("Center of the table", "empty at first; receives the leftover tiles and, at the start of each round, the starting player marker.", "Centro da mesa", "vazio no início; recebe os azulejos que sobram e, no começo de cada rodada, o marcador de primeiro jogador."),
        rl("Bag", `100 tiles, 20 of each color (${f * 4} come out for round 1).`, "Saco", `100 azulejos, 20 de cada cor (${f * 4} saem para a rodada 1).`),
        rl("Box lid", "empty; the store for used tiles.", "Tampa da caixa", "vazia; o depósito dos azulejos usados."),
        rl("Starting player marker", "with the first player (it goes to the center when the round starts).", "Marcador de primeiro jogador", "com o primeiro jogador (vai ao centro quando a rodada começa).")
      ], [2]),
      infoCard(t(`PER PLAYER · ×${n}`, `POR JOGADOR · ×${n}`), t("Each player", "Cada jogador"), [
        t(`1 player board, ${gray() ? "gray" : "colored-wall"} side up.`, `1 tabuleiro, lado ${gray() ? "cinza" : "da parede colorida"} para cima.`),
        t("1 scoring marker on space 0 of their score track.", "1 marcador de pontuação na casa 0 da sua trilha."),
        t("No tiles: everyone starts with empty pattern lines, wall and floor line.", "Nenhum azulejo: todos começam com linhas de padrão, parede e linha do chão vazias.")
      ], [2]),
      infoCard(t("BACK IN THE BOX", "DE VOLTA À CAIXA"), t("Not used in this match", "Fora desta partida"), [
        f < 9 ? t(`${9 - f} Factory displays.`, `${9 - f} Expositores de Fábrica.`) : t("No Factory display: all 9 are used.", "Nenhum Expositor de Fábrica: os 9 são usados."),
        left ? t(`${left} player board${left === 1 ? "" : "s"} and ${left} scoring marker${left === 1 ? "" : "s"}.`, `${left} tabuleiro${left === 1 ? "" : "s"} e ${left} marcador${left === 1 ? "" : "es"} de pontuação.`) : t("No player board: all 4 are used.", "Nenhum tabuleiro: os 4 são usados."),
        interpretation("the rulebook has no component list; these counts follow from its setup (up to 4 boards and markers, up to 9 Factory displays).", "o manual não tem lista de componentes; estas quantidades decorrem da preparação (até 4 tabuleiros e marcadores, até 9 Expositores de Fábrica).")
      ], [2])
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
        <label class="az-setup-check" for="az-setup-${phase.id}">
          <input id="az-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="az-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="az-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), sectionIndex("setup"), [2])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Set up this match", "Prepare esta partida")} · ${playersLabel()} · ${sideLabel()}</h3>
            <p>${t("One checkbox per coherent step; tick it when all its substeps are done.", "Uma caixa por etapa coerente; marque quando todos os subpassos estiverem feitos.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved separately from the match configuration and language. Changing the player count or the board side clears this checklist; changing the language does not. “Uncheck all” clears only these setup boxes.",
          "O progresso é salvo separadamente da configuração da partida e do idioma. Trocar o número de jogadores ou o lado do tabuleiro limpa esta lista; trocar o idioma não. “Desmarcar tudo” limpa somente as caixas da preparação."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}`;
  }

  // ---------- quick reference ----------

  function quickReference() {
    const f = factories();
    const cards = [
      infoCard(t("EACH ROUND", "CADA RODADA"), t("Three phases", "Três fases"), [
        rl("A · Factory offer", "turns clockwise: each player takes tiles and places them, until every Factory display and the center are empty.", "A · Oferta das fábricas", "turnos em sentido horário: cada jogador pega azulejos e os coloca, até todos os expositores e o centro ficarem vazios."),
        rl("B · Wall-tiling", "everyone at once moves 1 tile from each complete pattern line onto the wall and scores it; then loses the floor line points.", "B · Azulejar a parede", "todos ao mesmo tempo passam 1 azulejo de cada linha de padrão completa para a parede e o pontuam; depois perdem os pontos da linha do chão."),
        rl("C · Next round", `if nobody has a complete horizontal line (row) on their wall yet, the starting player refills the ${f} Factory displays with 4 tiles each.`, "C · Próxima rodada", `se ninguém tiver uma linha horizontal completa na parede, o primeiro jogador reabastece os ${f} expositores com 4 azulejos cada.`)
      ], [3, 4, 5]),
      infoCard(t("YOUR TURN", "SEU TURNO"), t("Take one color, then place it", "Pegue uma cor e depois coloque"), [
        rl("From a Factory display", "take all its tiles of one color; push the rest of that display into the center.", "De um expositor", "pegue todos os azulejos de uma cor dele; empurre o resto desse expositor para o centro."),
        rl("Or from the center", `take all the center's tiles of one color. The first player to do so this round also takes the starting player marker ${icon("start-player-marker", t("starting player marker", "marcador de primeiro jogador"))} onto the leftmost free space of their floor line.`, "Ou do centro", `pegue todos os azulejos de uma cor do centro. O primeiro a fazer isso na rodada também pega o marcador de primeiro jogador ${icon("start-player-marker", t("marcador de primeiro jogador", "marcador de primeiro jogador"))} e o põe no espaço livre mais à esquerda da sua linha do chão.`),
        rl("Place", "choose one pattern line and put the tiles you took there, from right to left. Every tile that does not go there goes to your floor line.", "Coloque", "escolha uma linha de padrão e ponha ali os azulejos que pegou, da direita para a esquerda. Todo azulejo que não vai para ela vai para a sua linha do chão."),
        rl("Excess", "tiles beyond the line's free spaces fall to your floor line (a line already complete has no free space).", "Excesso", "os azulejos além dos espaços livres da linha caem na sua linha do chão (uma linha já completa não tem espaço livre)."),
        rl("Floor by choice", "you may put some or all of the tiles straight on your floor line, even if they would fit.", "Chão por escolha", "você pode pôr parte dos azulejos ou todos direto na linha do chão, mesmo que caibam."),
        rl("No passing", "you must take tiles every turn.", "Sem passar", "você é obrigado a pegar azulejos em todo turno.")
      ], [3, 4]),
      infoCard(t("PATTERN LINES", "LINHAS DE PADRÃO"), t("Where tiles may go", "Onde os azulejos podem ir"), [
        rl("Size", "line 1 holds 1 tile, line 2 holds 2 … line 5 holds 5.", "Tamanho", "a linha 1 comporta 1 azulejo, a linha 2 comporta 2 … a linha 5 comporta 5."),
        rl("One color", "a line that already holds tiles only accepts more of the same color.", "Uma cor", "uma linha que já tem azulejos só aceita mais da mesma cor."),
        rl("Not on the wall yet", "never a color that the wall row beside that line already holds.", "Ainda não na parede", "nunca uma cor que a linha da parede ao lado dela já tem."),
        gray() ? `${rl("Gray wall tip", "before filling a line, check that its color still has a free space in that wall row whose column lacks that color.", "Dica da parede cinza", "antes de encher uma linha, confira se a cor ainda tem um espaço livre nessa linha da parede cuja coluna não tenha essa cor.")} ${interpretation("placing there is not forbidden, but if the line's tile then has no legal space, this guide sends that line's tiles to the floor.", "colocar ali não é proibido, mas se o azulejo da linha depois não tiver espaço permitido, este guia manda os azulejos dessa linha para o chão.")}` : null,
        rl("Complete", "every space filled. Only complete lines move to the wall; incomplete ones wait for the next round.", "Completa", "todos os espaços cheios. Só linhas completas passam para a parede; as incompletas esperam a próxima rodada.")
      ], gray() ? [3, 4, 6] : [3, 4]),
      infoCard(t("FLOOR LINE", "LINHA DO CHÃO"), t("Fallen tiles cost points", "Azulejos caídos custam pontos"), [
        `${floorIcons()}`,
        rl("Fill", "left to right: −1, −1, −2, −2, −2, −3, −3 (−14 when full).", "Preencha", "da esquerda para a direita: −1, −1, −2, −2, −2, −3, −3 (−14 cheia)."),
        rl("Full", "any further fallen tiles go to the box lid, without penalty.", "Cheia", "os azulejos que ainda caírem vão para a tampa da caixa, sem penalidade."),
        rl("Starting player marker", "counts as a tile there, but returns to you, not to the lid. Floor line already full? It costs nothing more (guide's reading).", "Marcador de primeiro jogador", "conta como um azulejo ali, mas volta para você, não para a tampa. Linha do chão já cheia? Não custa nada a mais (leitura do guia)."),
        rl("Never below 0", "your score cannot drop under 0.", "Nunca abaixo de 0", "sua pontuação não pode ficar abaixo de 0.")
      ], [4, 5]),
      infoCard(t("WALL-TILING", "AZULEJAR A PAREDE"), t("Everyone at the same time", "Todos ao mesmo tempo"), [
        rl("Top to bottom", `for each <strong>complete</strong> pattern line, move its rightmost tile ${wallDestination()}.`, "De cima para baixo", `para cada linha de padrão <strong>completa</strong>, mova o azulejo mais à direita ${wallDestination()}.`),
        rl("Score", "each tile as soon as it is placed (see “Scoring a tile”).", "Pontue", "cada azulejo assim que ele é colocado (veja “Pontuar um azulejo”)."),
        rl("Clear", "the other tiles of those complete lines go to the box lid; incomplete lines stay.", "Limpe", "os outros azulejos dessas linhas completas vão para a tampa da caixa; as incompletas ficam."),
        rl("Floor", "lose the points above each floor tile; floor tiles to the lid; the starting player marker in front of you.", "Chão", "perca os pontos acima de cada azulejo do chão; os azulejos do chão vão para a tampa; o marcador de primeiro jogador fica à sua frente.")
      ], gray() ? [4, 5, 6] : [4, 5]),
      infoCard(t("SCORING A TILE", "PONTUAR UM AZULEJO"), t("Immediately, when it lands on the wall", "Na hora, quando chega à parede"), [
        rl("Alone", "no tile directly left, right, above or below: 1 point.", "Sozinho", "nenhum azulejo logo à esquerda, à direita, acima ou abaixo: 1 ponto."),
        rl("Horizontal", "touches tiles in its row: count the unbroken run of tiles in that row, the new one included → that many points.", "Horizontal", "encosta em azulejos na mesma linha horizontal da parede: conte a sequência contínua de azulejos dessa linha, incluindo o novo, e ganhe esse número de pontos."),
        rl("Vertical", "touches tiles in its column: count that unbroken run too, the new one included → add those points.", "Vertical", "encosta em azulejos na mesma coluna: conte também essa sequência contínua, incluindo o novo, e some esses pontos."),
        rl("Both", "a tile in a row run and a column run scores both runs, the new tile counted in each — no extra 1 point.", "Ambos", "um azulejo numa sequência de linha e numa de coluna pontua as duas sequências, com o azulejo novo contado em cada uma — sem o 1 ponto extra.")
      ], [5], "az-score-card"),
      infoCard(t("END OF THE GAME", "FIM DA PARTIDA"), t("After the Wall-tiling that completes a row", "Depois da fase de azulejar que completa uma linha"), [
        rl("Trigger", "the game ends right after the Wall-tiling phase in which at least one player completes a horizontal line of 5 tiles on their wall (a full pattern line 5 does not count).", "Gatilho", "a partida termina logo depois da fase de azulejar em que pelo menos um jogador completa uma linha horizontal de 5 azulejos na parede (uma linha de padrão 5 cheia não conta)."),
        rl(`${icon("bonus-row", "+2")} Row`, "+2 per complete horizontal line.", `${icon("bonus-row", "+2")} Linha`, "+2 por linha horizontal completa."),
        rl(`${icon("bonus-column", "+7")} Column`, "+7 per complete vertical line.", `${icon("bonus-column", "+7")} Coluna`, "+7 por coluna completa."),
        rl(`${icon("bonus-color", "+10")} Color`, "+10 per color with all 5 of its tiles on your wall.", `${icon("bonus-color", "+10")} Cor`, "+10 por cor com os 5 azulejos dela na sua parede."),
        rl("Winner", "most points. Tie: more complete horizontal lines; still tied: shared victory.", "Vencedor", "mais pontos. Empate: mais linhas horizontais completas; empate de novo: vitória compartilhada.")
      ], [3, 6], "victory-card")
    ];
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), sectionIndex("quick-reference"), [3, 4, 5, 6])}
      <div class="callout">${t(
        `Each round ${f * 4} tiles sit on ${f} Factory displays. Players take turns drafting all the tiles of one color, building up their pattern lines. When the offer is empty, every complete pattern line sends one tile to the wall, where it scores for the tiles it touches; tiles you could not use fall to the floor and cost points. The game ends after the round in which someone completes a horizontal row of their wall.`,
        `A cada rodada ${f * 4} azulejos ficam em ${f} Expositores de Fábrica. Na sua vez, cada jogador pega todos os azulejos de uma cor e vai montando suas linhas de padrão. Quando a oferta acaba, cada linha de padrão completa manda um azulejo para a parede, onde ele pontua pelos azulejos em que encosta; azulejos que você não conseguiu usar caem no chão e custam pontos. A partida termina depois da rodada em que alguém completa uma linha horizontal da parede.`
      )} ${referenceLink(3)}</div>
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- phase A ----------

  function factoryOfferSection() {
    return `
      ${sectionHeading("factory-offer", t("A · Factory offer", "A · Oferta das fábricas"), sectionIndex("factory-offer"), [3, 4])}
      <p class="glossary-intro">${t(
        "The game is a series of rounds, each in three phases: A · Factory offer, B · Wall-tiling and C · Preparing the next round. Your aim in phase A is to complete as many pattern lines as you can, because only complete lines move tiles onto your wall — and only tiles on the wall score.",
        "A partida é uma série de rodadas, cada uma em três fases: A · Oferta das fábricas, B · Azulejar a parede e C · Preparar a próxima rodada. Seu objetivo na fase A é completar o máximo de linhas de padrão, porque só linhas completas passam azulejos para a parede — e só azulejos na parede pontuam."
      )} ${referenceLink(3)}</p>
      <div class="quick-grid">
        ${infoCard(t("START OF THE PHASE", "INÍCIO DA FASE"), t("The starting player opens", "O primeiro jogador abre"), [
          t(`The player holding the starting player marker ${icon("start-player-marker", t("starting player marker", "marcador de primeiro jogador"))} puts it in the center of the table and takes the first turn.`, `Quem tem o marcador de primeiro jogador ${icon("start-player-marker", t("marcador de primeiro jogador", "marcador de primeiro jogador"))} o põe no centro da mesa e faz o primeiro turno.`),
          t("Play continues clockwise, one turn each, round and round the table.", "O jogo segue em sentido horário, um turno por jogador, dando voltas na mesa."),
          t("On your turn you <strong>must</strong> take tiles in one of the two ways below.", "Na sua vez você <strong>deve</strong> pegar azulejos de uma das duas formas abaixo.")
        ], [3])}
        ${infoCard(t("EITHER · OPTION A", "OU · OPÇÃO A"), t("Take from a Factory display", "Pegue de um Expositor de Fábrica"), [
          t("Choose any one Factory display and a color on it. Take <strong>all</strong> the tiles of that color from it.", "Escolha qualquer Expositor de Fábrica e uma cor que esteja nele. Pegue <strong>todos</strong> os azulejos dessa cor."),
          t("Move the remaining tiles of that display to the center of the table. The display is now empty for the rest of the round.", "Mova os azulejos que sobraram nesse expositor para o centro da mesa. O expositor fica vazio pelo resto da rodada.")
        ], [3])}
        ${infoCard(t("OR · OPTION B", "OU · OPÇÃO B"), t("Take from the center", "Pegue do centro"), [
          t("Choose a color in the center of the table and take <strong>all</strong> the tiles of that color there.", "Escolha uma cor no centro da mesa e pegue <strong>todos</strong> os azulejos dessa cor que estão lá."),
          t("If you are the <strong>first</strong> player this round to take tiles from the center, also take the starting player marker and place it on the leftmost free space of your floor line. It costs points like a tile, but you will start the next round.", "Se você é o <strong>primeiro</strong> jogador da rodada a pegar do centro, pegue também o marcador de primeiro jogador e ponha-o no espaço livre mais à esquerda da sua linha do chão. Ele custa pontos como um azulejo, mas você começará a próxima rodada."),
          `${t("The marker is not a color: you cannot take it on its own.", "O marcador não é uma cor: não dá para pegá-lo sozinho.")} ${interpretation("if your floor line is already full when you take it, keep it beside your board: it costs nothing extra (like other tiles beyond the floor line) and you still start the next round.", "se sua linha do chão já estiver cheia quando você o pegar, deixe-o ao lado do tabuleiro: ele não custa nada a mais (como outros azulejos além da linha do chão) e você ainda começa a próxima rodada.")}`
        ], [3])}
        ${infoCard(t("THEN", "DEPOIS"), t("Place the tiles on one pattern line", "Ponha os azulejos numa linha de padrão"), [
          t("Add the tiles you took to <strong>one</strong> of the 5 pattern lines of your board: line 1 has 1 space … line 5 has 5.", "Acrescente os azulejos que pegou a <strong>uma</strong> das 5 linhas de padrão do tabuleiro: a linha 1 tem 1 espaço … a linha 5 tem 5."),
          rl("Right to left", "place them one by one, starting from the rightmost space of the line.", "Da direita para a esquerda", "coloque-os um a um, começando pelo espaço mais à direita da linha."),
          rl("Same color", "if the line already holds tiles, you may only add tiles of that same color.", "Mesma cor", "se a linha já tem azulejos, você só pode acrescentar azulejos dessa mesma cor."),
          rl("Not on the wall", "you may not place a color in a pattern line whose wall row already holds a tile of that color. (In round 1 the wall is empty; from round 2 on this matters.)", "Não na parede", "você não pode pôr uma cor numa linha de padrão cuja linha da parede já tem um azulejo dessa cor. (Na rodada 1 a parede está vazia; da rodada 2 em diante isso conta.)"),
          rl("Complete", "a line with all its spaces filled is complete. Tiles you took beyond the free spaces of that line go to your floor line — so choosing a line that is already complete sends all of them to the floor.", "Completa", "uma linha com todos os espaços cheios está completa. Os azulejos que você pegou além dos espaços livres dessa linha vão para a linha do chão — então escolher uma linha já completa manda todos eles para o chão."),
          gray() ? `${rl("Gray wall", "a complete line must later find a space in its wall row whose column has no tile of that color.", "Parede cinza", "uma linha completa precisará depois de um espaço na sua linha da parede cuja coluna não tenha azulejo dessa cor.")} ${interpretation("before filling a pattern line, check that such a space still exists in that row; otherwise you are building a line whose tile can never reach the wall (see “B · Wall-tiling”).", "antes de encher uma linha de padrão, confira se esse espaço ainda existe naquela linha; caso contrário você está montando uma linha cujo azulejo nunca chega à parede (veja “B · Azulejar a parede”).")}` : null
        ], gray() ? [3, 4, 6] : [3, 4])}
        ${infoCard(t("FLOOR LINE", "LINHA DO CHÃO"), t("Tiles you cannot or will not place", "Azulejos que você não pode ou não quer colocar"), [
          `${floorIcons()}`,
          t("Any tiles you took that you cannot or do not want to place in a pattern line go to your floor line, filling its spaces from left to right.", "Todos os azulejos que você pegou e não pode ou não quer pôr numa linha de padrão vão para a linha do chão, preenchendo os espaços da esquerda para a direita."),
          t("They have fallen on the floor and give minus points at the end of the Wall-tiling phase: the number printed above each occupied space.", "Eles caíram no chão e dão pontos negativos no fim da fase de azulejar: o número impresso acima de cada espaço ocupado."),
          t("If all 7 spaces are occupied, put any further fallen tiles in the box lid for now (no further penalty).", "Se os 7 espaços estiverem ocupados, ponha os próximos azulejos caídos na tampa da caixa por enquanto (sem penalidade extra).")
        ], [4, 5])}
        ${infoCard(t("END OF THE PHASE", "FIM DA FASE"), t("When the offer is empty", "Quando a oferta acaba"), [
          t("Phase A ends when the center of the table <strong>and</strong> all the Factory displays hold no more tiles.", "A fase A termina quando o centro da mesa <strong>e</strong> todos os Expositores de Fábrica não têm mais azulejos."),
          t("Players may get different numbers of turns in a round. Then go on to B · Wall-tiling.", "Os jogadores podem ter números diferentes de turnos numa rodada. Depois passe para B · Azulejar a parede."),
          interpretation("if nobody took tiles from the center this round, the starting player marker is still there: the player who started this round takes it back and starts the next one.", "se ninguém pegou azulejos do centro nesta rodada, o marcador de primeiro jogador continua lá: quem começou esta rodada o pega de volta e começa a próxima.")
        ], [4])}
      </div>`;
  }

  // ---------- phase B ----------

  function wallTilingSection() {
    const variantCard = gray()
      ? infoCard(t("VARIANT · GRAY WALL", "VARIANTE · PAREDE CINZA"), t("Choosing the space", "Escolher o espaço"), [
        t("All rules are exactly as in the normal game, except where the tile goes: when you move a tile from a complete pattern line to your wall, you may place it on <strong>any</strong> free space of the wall row beside that line.", "Todas as regras são exatamente as do jogo normal, exceto onde o azulejo vai: quando você move um azulejo de uma linha de padrão completa para a parede, pode colocá-lo em <strong>qualquer</strong> espaço livre da linha da parede ao lado dessa linha."),
        rl("Columns", "in each of the 5 vertical lines of your wall, no color may appear more than once.", "Colunas", "em cada uma das 5 colunas da parede, nenhuma cor pode aparecer mais de uma vez."),
        rl("Rows", "the pattern-line rule still keeps each color to once per row.", "Linhas", "a regra das linhas de padrão continua limitando cada cor a uma vez por linha."),
        t("The choice is made when the tile moves and is final. Scoring and the end-game bonuses are unchanged; the +10 for a color still needs all 5 of its tiles on your wall.", "A escolha é feita quando o azulejo se move e é definitiva. A pontuação e os bônus de fim de jogo não mudam; os +10 de uma cor continuam exigindo os 5 azulejos dela na parede."),
        interpretation("the rulebook does not say what happens if a complete line's tile has no legal space in its row (every free space's column already holds that color). The guide moves all the tiles of that pattern line to your floor line (left to right; beyond 7 spaces, to the lid). Avoid it by checking before you fill a line.", "o manual não diz o que acontece se o azulejo de uma linha completa não tem espaço permitido na sua linha (a coluna de todo espaço livre já tem essa cor). O guia manda todos os azulejos dessa linha de padrão para a linha do chão (da esquerda para a direita; além dos 7 espaços, para a tampa). Evite isso conferindo antes de encher uma linha.")
      ], [6], "az-variant-card")
      : infoCard(t("COLORED WALL", "PAREDE COLORIDA"), t("Where each tile goes", "Para onde vai cada azulejo"), [
        t("Each wall row has exactly one space of each color, so a tile moving onto the wall always goes to the space of its color in that row.", "Cada linha da parede tem exatamente um espaço de cada cor, então um azulejo que passa para a parede sempre vai para o espaço da sua cor naquela linha."),
        t("Each column also holds every color once, so a color can never appear twice in a row or a column.", "Cada coluna também tem todas as cores uma vez, então uma cor nunca aparece duas vezes numa linha ou coluna."),
        t("The wall pattern (row 1 at the top): see the practice grid in “Scoring a tile”.", "O padrão da parede (linha 1 no alto): veja a grade de treino em “Pontuar um azulejo”.")
      ], [2, 4]);
    return `
      ${sectionHeading("wall-tiling", t("B · Wall-tiling", "B · Azulejar a parede"), sectionIndex("wall-tiling"), gray() ? [4, 5, 6] : [4, 5])}
      <p class="glossary-intro">${t(
        "All players can do this phase at the same time, each on their own board.",
        "Todos os jogadores podem fazer esta fase ao mesmo tempo, cada um no próprio tabuleiro."
      )} ${referenceLink(4)}</p>
      <div class="quick-grid">
        ${infoCard(t("STEP A", "PASSO A"), t("Move tiles onto the wall", "Passe azulejos para a parede"), [
          t("Go through your pattern lines <strong>from top to bottom</strong> (line 1 to line 5).", "Percorra suas linhas de padrão <strong>de cima para baixo</strong> (da linha 1 à linha 5)."),
          t(`For each <strong>complete</strong> line, move its <strong>rightmost</strong> tile ${wallDestination()}.`, `Para cada linha <strong>completa</strong>, mova o azulejo <strong>mais à direita</strong> ${wallDestination()}.`),
          t("Each time you move a tile, score it immediately (see “Scoring a tile”). Because you go top to bottom, a tile placed earlier this phase already counts as a neighbor for the next ones.", "Cada vez que move um azulejo, pontue-o na hora (veja “Pontuar um azulejo”). Como você vai de cima para baixo, um azulejo colocado antes nesta fase já conta como vizinho dos seguintes."),
          t("Ignore incomplete lines.", "Ignore as linhas incompletas.")
        ], [4, 5])}
        ${infoCard(t("STEP B", "PASSO B"), t("Clear the complete lines", "Limpe as linhas completas"), [
          t("Each complete line you just used now has an empty rightmost space: remove all the tiles still on those lines and put them in the box lid.", "Cada linha completa que você acabou de usar agora tem o espaço mais à direita vazio: tire todos os azulejos que ainda estão nessas linhas e ponha-os na tampa da caixa."),
          t("Any tiles remaining on incomplete pattern lines stay on your board for the next round.", "Os azulejos que restam em linhas de padrão incompletas ficam no tabuleiro para a próxima rodada.")
        ], [4])}
        ${infoCard(t("FINALLY", "POR FIM"), t("Floor line penalty", "Penalidade da linha do chão"), [
          `${floorIcons()}`,
          t("For each tile in your floor line, lose the number of points printed directly above it; move your scoring marker back accordingly.", "Para cada azulejo na linha do chão, perca o número de pontos impresso logo acima dele; recue seu marcador de pontuação de acordo."),
          rl("Never below 0", "your score can never drop below 0 points.", "Nunca abaixo de 0", "sua pontuação nunca fica abaixo de 0 pontos."),
          t("Then put all the tiles from your floor line in the box lid.", "Depois ponha todos os azulejos da linha do chão na tampa da caixa."),
          rl("Starting player marker", "if it is in your floor line it counted as a normal tile, but place it in front of you instead of in the lid: you start the next round.", "Marcador de primeiro jogador", "se estiver na sua linha do chão, contou como um azulejo normal, mas ponha-o à sua frente em vez de na tampa: você começa a próxima rodada.")
        ], [5])}
        ${variantCard}
      </div>`;
  }

  // ---------- scoring ----------

  function freshTrainer() {
    return { cells: {}, history: [], pick: "blue", message: null };
  }

  function cellAt(cells, r, c) {
    return r >= 0 && r < 5 && c >= 0 && c < 5 ? cells[`${r}-${c}`] : undefined;
  }

  function scorePlacement(cells, r, c) {
    let h = 1;
    for (let x = c - 1; cellAt(cells, r, x); x -= 1) h += 1;
    for (let x = c + 1; cellAt(cells, r, x); x += 1) h += 1;
    let v = 1;
    for (let y = r - 1; cellAt(cells, y, c); y -= 1) v += 1;
    for (let y = r + 1; cellAt(cells, y, c); y += 1) v += 1;
    const horizontal = h > 1 ? h : 0;
    const vertical = v > 1 ? v : 0;
    return { horizontal, vertical, points: horizontal || vertical ? horizontal + vertical : 1 };
  }

  function bonuses(cells) {
    let rows = 0;
    let columns = 0;
    for (let i = 0; i < 5; i += 1) {
      if ([0, 1, 2, 3, 4].every((j) => cells[`${i}-${j}`])) rows += 1;
      if ([0, 1, 2, 3, 4].every((j) => cells[`${j}-${i}`])) columns += 1;
    }
    const colors = COLOR_IDS.filter((id) => Object.values(cells).filter((value) => value === id).length === 5).length;
    return { rows, columns, colors, total: rows * 2 + columns * 7 + colors * 10 };
  }

  function placementBlocker(r, c, color) {
    for (let j = 0; j < 5; j += 1) {
      if (trainer.cells[`${r}-${j}`] === color) {
        return t(`Row ${r + 1} already holds ${colorName(color).toLowerCase()}: the pattern-line rule keeps a color to once per row.`, `A linha ${r + 1} já tem ${colorName(color).toLowerCase()}: a regra das linhas de padrão limita uma cor a uma vez por linha.`);
      }
      if (trainer.cells[`${j}-${c}`] === color) {
        return t(`Column ${c + 1} already holds ${colorName(color).toLowerCase()}: on the gray wall no color may appear twice in a column.`, `A coluna ${c + 1} já tem ${colorName(color).toLowerCase()}: na parede cinza nenhuma cor pode aparecer duas vezes numa coluna.`);
      }
    }
    return null;
  }

  function trainerMessage() {
    const m = trainer.message;
    if (!m) {
      return t("Click a space to place a tile there.", "Clique num espaço para colocar um azulejo nele.");
    }
    if (m.type === "blocked") {
      return m.text;
    }
    const where = t(`row ${m.r + 1}, column ${m.c + 1}`, `linha ${m.r + 1}, coluna ${m.c + 1}`);
    const parts = [];
    if (m.horizontal) parts.push(t(`${m.horizontal} horizontally linked`, `${m.horizontal} ligados na horizontal`));
    if (m.vertical) parts.push(t(`${m.vertical} vertically linked`, `${m.vertical} ligados na vertical`));
    const why = parts.length ? parts.join(" + ") : t("no adjacent tile", "nenhum azulejo adjacente");
    return t(
      `${colorName(m.color)} on ${where}: ${why} → <strong>+${m.points}</strong>.`,
      `${colorName(m.color)} na ${where}: ${why} → <strong>+${m.points}</strong>.`
    );
  }

  function trainerMarkup() {
    const isGray = gray();
    const placed = trainer.history.reduce((sum, step) => sum + step.points, 0);
    const bonus = bonuses(trainer.cells);
    const grid = WALL.map((row, r) => row.map((printed, c) => {
      const color = trainer.cells[`${r}-${c}`];
      const label = color
        ? t(`Row ${r + 1}, column ${c + 1}: ${colorName(color)} tile placed`, `Linha ${r + 1}, coluna ${c + 1}: azulejo ${colorName(color).toLowerCase()} colocado`)
        : isGray
          ? t(`Row ${r + 1}, column ${c + 1}: empty gray space`, `Linha ${r + 1}, coluna ${c + 1}: espaço cinza vazio`)
          : t(`Row ${r + 1}, column ${c + 1}: empty ${colorName(printed).toLowerCase()} space`, `Linha ${r + 1}, coluna ${c + 1}: espaço ${colorName(printed).toLowerCase()} vazio`);
      const shown = color || (isGray ? null : printed);
      const style = shown ? ` style="background-image:url('${ICONS}tile-${shown}.webp')"` : "";
      return `<button type="button" class="az-cell ${color ? "is-placed" : "is-empty"} ${isGray && !color ? "is-gray" : ""}" data-az-cell="${r}-${c}" aria-label="${label}" ${color ? 'aria-disabled="true"' : ""}${style}></button>`;
    }).join("")).join("");
    const palette = isGray ? `
      <div class="az-palette" role="group" aria-label="${t("Color to place", "Cor a colocar")}">
        <span>${t("Color to place:", "Cor a colocar:")}</span>
        ${COLOR_IDS.map((id) => `<button type="button" class="az-swatch" data-az-pick="${id}" aria-pressed="${trainer.pick === id}" title="${colorName(id)}"><img src="${ICONS}tile-${id}.webp" alt="${colorName(id)}"></button>`).join("")}
      </div>` : "";
    return `
      <div class="az-trainer" id="az-trainer">
        <div class="az-trainer-board">
          ${palette}
          <div class="az-wall" role="group" aria-label="${t("Practice wall, 5 by 5", "Parede de treino, 5 por 5")}">${grid}</div>
        </div>
        <div class="az-trainer-panel">
          <p class="az-trainer-message" aria-live="polite">${trainerMessage()}</p>
          <ul class="card-lines">
            <li><strong>${t("Placement points", "Pontos de colocação")}:</strong> ${placed} ${t(`(${trainer.history.length} tile${trainer.history.length === 1 ? "" : "s"})`, `(${trainer.history.length} azulejo${trainer.history.length === 1 ? "" : "s"})`)}</li>
            <li><strong>${t("End bonuses if the game ended now", "Bônus finais se a partida terminasse agora")}:</strong> ${t(`${bonus.rows} row${bonus.rows === 1 ? "" : "s"} × 2 + ${bonus.columns} column${bonus.columns === 1 ? "" : "s"} × 7 + ${bonus.colors} color${bonus.colors === 1 ? "" : "s"} × 10 = ${bonus.total}`, `${bonus.rows} linha${bonus.rows === 1 ? "" : "s"} × 2 + ${bonus.columns} coluna${bonus.columns === 1 ? "" : "s"} × 7 + ${bonus.colors} cor${bonus.colors === 1 ? "" : "es"} × 10 = ${bonus.total}`)}</li>
            <li><strong>${t("Total", "Total")}:</strong> ${placed + bonus.total} ${t("(no floor penalties in this practice)", "(sem penalidades do chão neste treino)")}</li>
          </ul>
          <div class="az-trainer-actions">
            <button class="button-secondary" type="button" data-az-undo ${trainer.history.length ? "" : "disabled"}>${t("Undo last tile", "Desfazer último azulejo")}</button>
            <button class="button-secondary" type="button" data-az-clear ${trainer.history.length ? "" : "disabled"}>${t("Clear the wall", "Limpar a parede")}</button>
          </div>
          <p class="az-trainer-note">${t(
            `Practice only — nothing here is saved, and it does not touch your setup or match. The points depend on the order you place tiles, as in the game.${isGray ? " Pick a color first; the grid refuses a color already in that row or column." : " Each space shows the color printed there on the colored wall."}`,
            `Só treino — nada aqui é salvo e não mexe na preparação nem na partida. Os pontos dependem da ordem em que você coloca os azulejos, como no jogo.${isGray ? " Escolha uma cor primeiro; a grade recusa uma cor que já esteja naquela linha ou coluna." : " Cada espaço mostra a cor impressa nele na parede colorida."}`
          )}</p>
        </div>
      </div>`;
  }

  function scoringSection() {
    return `
      ${sectionHeading("scoring", t("Scoring a tile", "Pontuar um azulejo"), sectionIndex("scoring"), [5])}
      <p class="glossary-intro">${t(
        "Each tile moved onto your wall goes to its space and scores at once. You only ever score the tile you have just placed, counting the tiles it is linked to at that moment.",
        "Cada azulejo que passa para a parede vai para o seu espaço e pontua na hora. Você só pontua o azulejo que acabou de colocar, contando os azulejos ligados a ele naquele momento."
      )} ${referenceLink(5)}</p>
      <div class="quick-grid">
        ${infoCard(t("NO NEIGHBOR", "SEM VIZINHO"), t("1 point", "1 ponto"), [
          t("If no tile is directly adjacent to the new tile — above, below, left or right — gain 1 point.", "Se nenhum azulejo está diretamente adjacente ao novo — acima, abaixo, à esquerda ou à direita — ganhe 1 ponto."),
          t("Diagonal tiles never count.", "Azulejos na diagonal nunca contam.")
        ], [5])}
        ${infoCard(t("WITH NEIGHBORS", "COM VIZINHOS"), t("Count the linked runs", "Conte as sequências ligadas"), [
          rl("1 · Horizontal", "if 1 or more tiles are horizontally linked to the new tile, count all the tiles in that unbroken row run, the new one included, and gain that many points.", "1 · Horizontal", "se 1 ou mais azulejos estão ligados na horizontal ao novo, conte todos os azulejos dessa sequência contínua da linha, incluindo o novo, e ganhe esse número de pontos."),
          rl("2 · Vertical", "then, if 1 or more tiles are vertically linked to it, count all the tiles in that unbroken column run, the new one included, and gain that many points too.", "2 · Vertical", "depois, se 1 ou mais azulejos estão ligados na vertical a ele, conte todos os azulejos dessa sequência contínua da coluna, incluindo o novo, e ganhe também esse número de pontos."),
          rl("Linked", "touching in a straight line with no empty space between. A gap ends the run.", "Ligados", "encostados em linha reta, sem espaço vazio entre eles. Um vão encerra a sequência."),
          rl("One direction only", "then you score only that run (the 1 point for a lone tile does not apply).", "Uma direção só", "então você pontua só essa sequência (o 1 ponto do azulejo sozinho não se aplica).")
        ], [5], "az-score-card")}
        ${infoCard(t("FROM THE RULEBOOK", "DO MANUAL"), t("Four placements", "Quatro colocações"), [
          t("A red tile with no neighbor: <strong>1</strong>.", "Um azulejo vermelho sem vizinho: <strong>1</strong>."),
          t("A yellow tile completing a run of 3 in its row, nothing above or below: <strong>3</strong>.", "Um amarelo completando uma sequência de 3 na linha, nada acima ou abaixo: <strong>3</strong>."),
          t("A blue tile completing a run of 3 in its column, nothing beside it: <strong>3</strong>.", "Um azul completando uma sequência de 3 na coluna, nada ao lado: <strong>3</strong>."),
          t("A yellow tile linking 4 in its row and 3 in its column: 4 + 3 = <strong>7</strong>.", "Um amarelo ligando 4 na linha e 3 na coluna: 4 + 3 = <strong>7</strong>.")
        ], [5])}
      </div>
      <h3 class="subhead">${t("Practice: place tiles on a wall", "Treino: coloque azulejos numa parede")} · ${sideLabel()}</h3>
      ${trainerMarkup()}`;
  }

  // ---------- phase C & end ----------

  function nextRoundSection() {
    const f = factories();
    return `
      ${sectionHeading("next-round", t("C · Next round & game end", "C · Próxima rodada e fim"), sectionIndex("next-round"), [3, 5, 6])}
      <div class="quick-grid">
        ${infoCard(t("PHASE C", "FASE C"), t("Preparing the next round", "Preparar a próxima rodada"), [
          t("If nobody has completed a horizontal line of 5 tiles on their wall, prepare the next round.", "Se ninguém completou uma linha horizontal de 5 azulejos na parede, prepare a próxima rodada."),
          t(`The player with the starting player marker refills each of the ${f} Factory displays with 4 tiles drawn from the bag, as in the setup.`, `Quem tem o marcador de primeiro jogador reabastece cada um dos ${f} Expositores de Fábrica com 4 azulejos tirados do saco, como na preparação.`),
          t("Then the new round starts with phase A: that player puts the marker in the center and takes the first turn.", "Depois a nova rodada começa pela fase A: esse jogador põe o marcador no centro e faz o primeiro turno."),
          rl("Bag empty", "refill it with all the tiles stored in the box lid, then go on filling the remaining displays.", "Saco vazio", "encha-o com todos os azulejos guardados na tampa da caixa e continue enchendo os expositores restantes."),
          rl("Still not enough", "in the rare case the tiles run out again and the lid is empty, start the round anyway with some displays not fully filled.", "Se ainda faltarem azulejos", "no caso raro de os azulejos acabarem de novo com a tampa vazia, comece a rodada assim mesmo, com alguns expositores incompletos.")
        ], [5])}
        ${infoCard(t("END OF THE GAME", "FIM DA PARTIDA"), t("When it ends", "Quando termina"), [
          t("The game ends right <strong>after</strong> the Wall-tiling phase (floor penalties included) in which at least one player has completed at least one <strong>horizontal</strong> line of 5 consecutive tiles on their wall.", "A partida termina logo <strong>depois</strong> da fase de azulejar (penalidades do chão incluídas) em que pelo menos um jogador completou pelo menos uma linha <strong>horizontal</strong> de 5 azulejos consecutivos na parede."),
          t("A complete vertical line does not end the game. There is no phase C after that round.", "Uma coluna completa não encerra a partida. Não há fase C depois dessa rodada."),
          t("Tiles left on pattern lines simply stay there: they score nothing.", "Azulejos que ficaram nas linhas de padrão simplesmente ficam lá: não pontuam nada.")
        ], [3, 5, 6], "victory-card")}
        ${infoCard(t("FINAL BONUSES", "BÔNUS FINAIS"), t("Printed at the bottom right of your board", "Impressos no canto inferior direito do tabuleiro"), [
          rl(`${icon("bonus-row", t("row bonus", "bônus de linha"))} +2`, "for each complete horizontal line of 5 consecutive tiles on your wall.", `${icon("bonus-row", t("bônus de linha", "bônus de linha"))} +2`, "por linha horizontal completa de 5 azulejos consecutivos na parede."),
          rl(`${icon("bonus-column", t("column bonus", "bônus de coluna"))} +7`, "for each complete vertical line of 5 consecutive tiles on your wall.", `${icon("bonus-column", t("bônus de coluna", "bônus de coluna"))} +7`, "por coluna completa de 5 azulejos consecutivos na parede."),
          rl(`${icon("bonus-color", t("color bonus", "bônus de cor"))} +10`, "for each color of which you have placed all 5 tiles on your wall.", `${icon("bonus-color", t("bônus de cor", "bônus de cor"))} +10`, "por cor da qual você colocou os 5 azulejos na parede.")
        ], [6], "victory-card")}
        ${infoCard(t("WINNER", "VENCEDOR"), t("Most points on the score track", "Mais pontos na trilha"), [
          t("The player with the most points on their score track wins.", "Vence quem tiver mais pontos na trilha de pontuação."),
          rl("Tie", "the tied player with more complete horizontal lines wins.", "Empate", "entre os empatados, vence quem tiver mais linhas horizontais completas."),
          rl("Still tied", "the victory is shared.", "Empate de novo", "a vitória é compartilhada."),
          interpretation("the score track ends at 100. If you go past it, start again from 0 and add 100 to that player's total.", "a trilha de pontuação termina em 100. Se você passar dela, recomece do 0 e some 100 ao total desse jogador.")
        ], [2, 6], "victory-card")}
      </div>`;
  }

  // ---------- iconography ----------

  function iconsSection() {
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), sectionIndex("icons"), [2, 3, 5, 6])}
      <p class="glossary-intro">${t("The tiles, components and symbols printed on the player board, each cropped individually from the rulebook's pictures.", "Os azulejos, componentes e símbolos impressos no tabuleiro, cada um recortado individualmente das imagens do manual.")}</p>
      <h3 class="subhead">${t("The five tile colors · 20 of each", "As cinco cores de azulejo · 20 de cada")}</h3>
      <div class="icon-grid">
        ${COLOR_IDS.map((id) => iconCard(`tile-${id}`, COLORS[id].en, `Tile: ${COLORS[id].lookEn}.${id === "turquoise" ? " The rulebook never names this color; “turquoise” is this guide's name." : ""}${gray() ? "" : ` On the colored wall it sits in row 1 at column ${WALL[0].indexOf(id) + 1}, one space further right on each row below (after column 5 it wraps back to column 1).`}`, COLORS[id].pt, `Azulejo: ${COLORS[id].lookPt}.${id === "turquoise" ? " O manual nunca nomeia esta cor; “turquesa” é o nome usado por este guia." : ""}${gray() ? "" : ` Na parede colorida fica na linha 1, coluna ${WALL[0].indexOf(id) + 1}, um espaço mais à direita a cada linha abaixo (depois da coluna 5 volta para a coluna 1).`}`, 3)).join("")}
      </div>
      <h3 class="subhead">${t("Components", "Componentes")}</h3>
      <div class="icon-grid">
        ${iconCard("factory-display", "Factory display", `${factories()} in this match, in a circle. Filled with 4 tiles each at the start of every round; take all of one color, the rest go to the center.`, "Expositor de Fábrica", `${factories()} nesta partida, em círculo. Recebe 4 azulejos no início de toda rodada; pegue todos de uma cor, o resto vai para o centro.`, 2)}
        ${iconCard("start-player-marker", "Starting player marker", "Goes to the center at the start of each round. The first player to take from the center puts it on their floor line (it costs points like a tile) and starts the next round.", "Marcador de primeiro jogador", "Vai para o centro no início de cada rodada. O primeiro a pegar do centro o põe na linha do chão (custa pontos como um azulejo) e começa a próxima rodada.", 2)}
        ${iconCard("bag", "Bag", "Holds the 100 tiles. Refilled from the box lid only when it runs empty while filling the Factory displays.", "Saco", "Guarda os 100 azulejos. É reabastecido com os azulejos da tampa da caixa só quando esvazia enquanto se enchem os expositores.", 2)}
      </div>
      <h3 class="subhead">${t("Floor line", "Linha do chão")}</h3>
      <div class="icon-grid">
        ${iconCard("floor-1", "−1 space", "The first 2 spaces of the floor line: each tile there costs 1 point at the end of the Wall-tiling phase.", "Espaço −1", "Os 2 primeiros espaços da linha do chão: cada azulejo ali custa 1 ponto no fim da fase de azulejar.", 5)}
        ${iconCard("floor-2", "−2 space", "Spaces 3 to 5: 2 points each.", "Espaço −2", "Espaços 3 a 5: 2 pontos cada.", 5)}
        ${iconCard("floor-3", "−3 space", "Spaces 6 and 7: 3 points each. Further fallen tiles go to the box lid without penalty.", "Espaço −3", "Espaços 6 e 7: 3 pontos cada. Os azulejos que ainda caírem vão para a tampa da caixa sem penalidade.", 5)}
      </div>
      <h3 class="subhead">${t("End-of-game bonuses (bottom right of the board)", "Bônus de fim de jogo (canto inferior direito do tabuleiro)")}</h3>
      <div class="icon-grid">
        ${iconCard("bonus-row", "Row bonus +2", "A horizontal line of 5 boxes ending in +2: 2 points per complete horizontal line of your wall.", "Bônus de linha +2", "Uma linha horizontal de 5 casas terminando em +2: 2 pontos por linha horizontal completa da parede.", 6)}
        ${iconCard("bonus-column", "Column bonus +7", "A vertical line of 5 boxes ending in +7: 7 points per complete vertical line of your wall.", "Bônus de coluna +7", "Uma coluna de 5 casas terminando em +7: 7 pontos por coluna completa da parede.", 6)}
        ${iconCard("bonus-color", "Color bonus +10", "Five “=” boxes around +10: 10 points per color with all 5 of its tiles on your wall.", "Bônus de cor +10", "Cinco casas “=” em volta de +10: 10 pontos por cor com os 5 azulejos dela na parede.", 6)}
      </div>`;
  }

  // ---------- examples ----------

  function examplesSection() {
    const examples = [
      [t("The end trigger", "O gatilho do fim"), [
        t("A wall row holding black, turquoise, blue, yellow and red side by side is a complete horizontal line of 5.", "Uma linha da parede com preto, turquesa, azul, amarelo e vermelho lado a lado é uma linha horizontal completa de 5."),
        t("The game ends after the round in which it was completed.", "A partida termina depois da rodada em que ela foi completada.")
      ], 3],
      [t("First turns", "Primeiros turnos"), [
        t("1. Peter takes the 2 black tiles from a Factory display and moves the 2 other tiles (yellow and turquoise) to the center.", "1. Peter pega os 2 azulejos pretos de um expositor e move os outros 2 (amarelo e turquesa) para o centro."),
        t("2. Martin takes the single yellow tile from another display and moves its 3 red tiles to the center.", "2. Martin pega o único azulejo amarelo de outro expositor e move os 3 vermelhos dele para o centro."),
        t("3. Andrea takes those 3 red tiles from the center. She is the first to take from the center, so she also takes the starting player marker and puts it on the leftmost space of her floor line.", "3. Andrea pega esses 3 vermelhos do centro. Ela é a primeira a pegar do centro, então pega também o marcador de primeiro jogador e o põe no espaço mais à esquerda da linha do chão.")
      ], 3],
      [t("Where can 2 yellow tiles go?", "Onde podem ir 2 azulejos amarelos?"), [
        t("Andrea takes 2 yellow tiles. Her 2nd and 3rd wall rows already hold yellow, so pattern lines 2 and 3 are forbidden.", "Andrea pega 2 amarelos. As linhas 2 e 3 da parede dela já têm amarelo, então as linhas de padrão 2 e 3 estão proibidas."),
        t("Her 4th pattern line already holds 1 blue tile: no other color may join it.", "A linha de padrão 4 já tem 1 azulejo azul: nenhuma outra cor pode entrar nela."),
        rl("A", "1 yellow in pattern line 1, the excess tile on the floor line.", "A", "1 amarelo na linha de padrão 1, o excedente na linha do chão."),
        rl("B", "both in pattern line 5.", "B", "os dois na linha de padrão 5."),
        rl("C", "both on the floor line — also allowed.", "C", "os dois na linha do chão — também permitido.")
      ], 4],
      [t("Peter's Wall-tiling", "Peter azuleja a parede"), [
        t("Pattern line 2 is complete with 2 red tiles: its rightmost tile moves to the red space of wall row 2 and scores 1 point.", "A linha de padrão 2 está completa com 2 vermelhos: o azulejo mais à direita vai para o espaço vermelho da linha 2 da parede e faz 1 ponto."),
        t("Line 3 is incomplete: ignored. Line 4 is complete: its rightmost blue tile moves to the blue space and scores 1 point. Line 5 is incomplete: ignored.", "A linha 3 está incompleta: ignorada. A linha 4 está completa: o azul mais à direita vai para o espaço azul e faz 1 ponto. A linha 5 está incompleta: ignorada."),
        t("He then puts the remaining tiles of lines 2 and 4 in the box lid; lines 3 and 5 keep their tiles for the next round.", "Depois ele põe os azulejos restantes das linhas 2 e 4 na tampa da caixa; as linhas 3 e 5 ficam com seus azulejos para a próxima rodada."),
        gray() ? t("This example uses the colored wall. On the gray wall Peter would instead choose any free space of wall rows 2 and 4 whose column does not hold red (row 2) or blue (row 4).", "Este exemplo usa a parede colorida. Na parede cinza, Peter escolheria qualquer espaço livre das linhas 2 e 4 da parede cuja coluna não tenha vermelho (linha 2) ou azul (linha 4).") : null
      ], 4],
      [t("Scoring placements", "Pontuar colocações"), [
        t("A lone red tile: 1 point.", "Um vermelho sozinho: 1 ponto."),
        t("A yellow tile making 3 horizontally linked tiles: 3 points.", "Um amarelo formando 3 azulejos ligados na horizontal: 3 pontos."),
        t("A blue tile making 3 vertically linked tiles: 3 points.", "Um azul formando 3 azulejos ligados na vertical: 3 pontos."),
        t("A yellow tile linking 4 horizontally and 3 vertically: 4 + 3 = 7 points.", "Um amarelo ligando 4 na horizontal e 3 na vertical: 4 + 3 = 7 pontos.")
      ], 5],
      [t("A crowded floor", "Um chão lotado"), [
        t("Peter has 4 tiles and the starting player marker in his floor line: 5 spaces filled.", "Peter tem 4 azulejos e o marcador de primeiro jogador na linha do chão: 5 espaços ocupados."),
        t("He loses 1 + 1 + 2 + 2 + 2 = 8 points. The tiles go to the lid; the marker goes in front of him and he starts the next round.", "Ele perde 1 + 1 + 2 + 2 + 2 = 8 pontos. Os azulejos vão para a tampa; o marcador fica à frente dele e ele começa a próxima rodada.")
      ], 5]
    ];
    const pages = examples.map((example) => example[2]);
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), sectionIndex("examples"), pages)}
      <div class="example-grid">${examples.map(([title, items, page], index) => `
        <article class="example-card">
          <span class="card-number">${String(index + 1).padStart(2, "0")}</span>
          <h3>${title}</h3>
          ${lineList(items)}
          <div class="example-source"><span>${t("From the rulebook's examples", "Dos exemplos do manual")}</span>${referenceLink(page)}</div>
        </article>`).join("")}</div>`;
  }

  // ---------- glossary ----------

  function glossarySection() {
    const visible = [
      { term: ["Adjacent / linked", "Adjacente / ligado"], en: "adjacent, linked", text: ["Directly above, below, left or right of a tile, with no gap. Diagonals never count.", "Logo acima, abaixo, à esquerda ou à direita de um azulejo, sem vão. Diagonais nunca contam."], page: 5 },
      { term: ["Bag", "Saco"], en: "bag", text: ["Holds the tiles to draw from. Refilled from the box lid when it runs empty.", "Guarda os azulejos para sortear. É reabastecido com os azulejos da tampa da caixa quando esvazia."], page: 2 },
      { term: ["Box lid", "Tampa da caixa"], en: "lid of the game box", text: ["Where discarded pattern-line tiles and floor tiles are stored until the bag runs empty.", "Onde ficam os azulejos descartados das linhas de padrão e do chão até o saco esvaziar."], page: 4 },
      { term: ["Center of the table", "Centro da mesa"], en: "center of the table", text: ["The space inside the circle of Factory displays. Receives leftover tiles and, each round, the starting player marker.", "O espaço dentro do círculo de expositores. Recebe os azulejos que sobram e, a cada rodada, o marcador de primeiro jogador."], page: 3 },
      { term: ["Complete line", "Linha completa"], en: "complete", text: ["A pattern line with every space filled. Only complete lines move a tile to the wall.", "Uma linha de padrão com todos os espaços cheios. Só linhas completas passam um azulejo para a parede."], page: 3 },
      { term: ["Factory display", "Expositor de Fábrica"], en: "Factory display", text: [`A round disc holding 4 tiles at the start of each round (${factories()} in this match).`, `Um disco redondo com 4 azulejos no início de cada rodada (${factories()} nesta partida).`], page: 2 },
      { term: ["Floor line", "Linha do chão"], en: "floor line", text: ["The 7 spaces at the bottom of your board for tiles you could not or would not place: −1, −1, −2, −2, −2, −3, −3.", "Os 7 espaços na base do tabuleiro para azulejos que você não pôde ou não quis colocar: −1, −1, −2, −2, −2, −3, −3."], page: 4 },
      { term: ["Horizontal line", "Linha horizontal"], en: "horizontal line", text: ["A row of 5 wall spaces. Completing one ends the game after that round; +2 each at the end; tie-breaker.", "Uma fileira de 5 espaços da parede. Completar uma encerra a partida depois dessa rodada; +2 cada no fim; critério de desempate."], page: 6 },
      { term: ["Pattern lines", "Linhas de padrão"], en: "pattern lines", text: ["The 5 stepped lines at the left of your board (1 to 5 spaces) where you collect tiles of one color.", "As 5 linhas em escada à esquerda do tabuleiro (1 a 5 espaços) onde você junta azulejos de uma cor."], page: 3 },
      { term: ["Round", "Rodada"], en: "round", text: ["Factory offer, Wall-tiling, then preparing the next round.", "Oferta das fábricas, azulejar a parede e depois preparar a próxima rodada."], page: 3 },
      { term: ["Score track", "Trilha de pontuação"], en: "score track", text: ["The 0–100 track at the top of your board, where your scoring marker shows your points.", "A trilha de 0–100 no alto do tabuleiro, onde seu marcador mostra seus pontos."], page: 2 },
      { term: ["Starting player marker", "Marcador de primeiro jogador"], en: "starting player marker", text: ["The “1” tile. Whoever takes it (first from the center) puts it on their floor line and starts the next round.", "A peça “1”. Quem a pega (o primeiro a pegar do centro) a põe na linha do chão e começa a próxima rodada."], page: 3 },
      { term: ["Vertical line", "Coluna"], en: "vertical line", text: [`A column of 5 wall spaces: +7 each when complete at the end.${gray() ? " On the gray wall, no color twice in one." : ""}`, `Uma coluna de 5 espaços da parede: +7 cada quando completa no fim.${gray() ? " Na parede cinza, nenhuma cor duas vezes numa delas." : ""}`], page: 6 },
      { term: ["Wall", "Parede"], en: "wall", text: [gray() ? "The 5×5 gray area at the right of your board: each row may take any color once, each column too." : "The 5×5 colored area at the right of your board: each row and column has one space of each color.", gray() ? "A área cinza 5×5 à direita do tabuleiro: cada linha aceita cada cor uma vez, cada coluna também." : "A área colorida 5×5 à direita do tabuleiro: cada linha e coluna tem um espaço de cada cor."], page: gray() ? 6 : 2 }
    ];
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
    document.body.classList.add("theme-azul");
    document.documentElement.lang = state.language;
    document.title = t("Azul — Field Manual", "Azul — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Azul: 2–4 players, colored or gray wall, a match-filtered setup checklist, quick reference, the three phases of a round, tile scoring with a practice wall, end-game bonuses, iconography and the rulebook's examples.",
        "Regras interativas bilíngues de Azul: 2–4 jogadores, parede colorida ou cinza, lista de preparação filtrada, referência rápida, as três fases da rodada, pontuação de azulejos com parede de treino, bônus finais, iconografia e os exemplos do manual."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook · core game", "Livro interativo · jogo base")}</p>
          <h1>Azul</h1>
          <p class="hero-intro">${t(
            "Introduced by the Moors, azulejos — originally white and blue ceramic tiles — were embraced by the Portuguese after King Manuel I, visiting the Alhambra, ordered his own palace decorated with similar wall tiles. You are a tile-laying artist embellishing the walls of the Royal Palace of Évora.",
            "Trazidos pelos mouros, os azulejos — originalmente peças de cerâmica brancas e azuis — foram adotados pelos portugueses depois que o rei D. Manuel I, ao visitar a Alhambra, mandou decorar seu próprio palácio com azulejos parecidos. Você é um azulejista encarregado de embelezar as paredes do Palácio Real de Évora."
          )}</p>
          <div class="hero-meta"><span>${t("2–4 players", "2–4 jogadores")}</span><span>${t("Rounds until a horizontal wall line is complete", "Rodadas até completar uma linha horizontal da parede")}</span><span>${t("Tile drafting · tile laying", "Seleção e colocação de azulejos")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/azul.webp" alt="${t("Cover of the Azul rulebook: the ornate AZUL title and the word Rulebook over blue and cream azulejo tiles", "Capa do manual de Azul: o título ornamentado AZUL e a palavra Rulebook sobre azulejos azuis e creme")}" fetchpriority="high"><figcaption>${t("Rulebook cover · game by Michael Kiesling, Plan B Games", "Capa do manual · jogo de Michael Kiesling, Plan B Games")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("The palace", "O palácio")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column az-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied Azul rulebook (Plan B Games, 2017, English): the base game for 2–4 players and its gray-wall variant. Points marked “Guide's reading” are interpretations where the rulebook is silent. Page links use the printed page numbers; the PDF stores the booklet as two spreads, so pages 2–4 open PDF page 1 and pages 5–6 open PDF page 2.",
            "Este guia cobre o manual fornecido de Azul (Plan B Games, 2017, em inglês): o jogo base para 2–4 jogadores e a variante da parede cinza. Pontos marcados como “Leitura do guia” são interpretações onde o manual é omisso. Os links usam a numeração impressa; o PDF guarda o livreto em duas folhas abertas, então as páginas 2–4 abrem a página 1 do PDF e as páginas 5–6 abrem a página 2."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${factoryOfferSection()}</section>
          <section class="rule-section">${wallTilingSection()}</section>
          <section class="rule-section">${scoringSection()}</section>
          <section class="rule-section">${nextRoundSection()}</section>
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the Azul rulebook. Game design: Michael Kiesling; illustrations: Chris Quilliams; art direction: Philippe Guérin. © 2017 Plan B Games Inc.",
        "Guia pessoal de consulta baseado no manual de Azul. Autor: Michael Kiesling; ilustrações: Chris Quilliams; direção de arte: Philippe Guérin. © 2017 Plan B Games Inc."
      )}</p></footer>`;
  }

  function rerender() {
    const scrollY = window.scrollY;
    renderInto(root);
    window.scrollTo(0, scrollY);
  }

  // Redraw only the practice grid so the page does not jump and focus stays on the grid.
  function refreshTrainer(focusSelector) {
    const current = root?.querySelector("#az-trainer");
    if (!current) {
      return;
    }
    current.outerHTML = trainerMarkup();
    if (focusSelector) {
      root.querySelector(`#az-trainer ${focusSelector}`)?.focus();
    }
  }

  function onTrainerClick(button) {
    if (button.dataset.azPick) {
      if (COLOR_IDS.includes(button.dataset.azPick)) {
        trainer.pick = button.dataset.azPick;
        trainer.message = null;
        refreshTrainer(`[data-az-pick="${trainer.pick}"]`);
      }
      return;
    }
    if (button.hasAttribute("data-az-undo")) {
      const last = trainer.history.pop();
      if (last) {
        delete trainer.cells[`${last.r}-${last.c}`];
      }
      trainer.message = null;
      refreshTrainer(trainer.history.length ? "[data-az-undo]" : `[data-az-cell="${last ? `${last.r}-${last.c}` : "0-0"}"]`);
      return;
    }
    if (button.hasAttribute("data-az-clear")) {
      trainer = { ...freshTrainer(), pick: trainer.pick };
      refreshTrainer('[data-az-cell="0-0"]');
      return;
    }
    const match = /^([0-4])-([0-4])$/.exec(button.dataset.azCell || "");
    if (!match) {
      return;
    }
    const r = Number(match[1]);
    const c = Number(match[2]);
    if (trainer.cells[`${r}-${c}`]) {
      return;
    }
    const color = gray() ? trainer.pick : WALL[r][c];
    const blocker = gray() ? placementBlocker(r, c, color) : null;
    if (blocker) {
      trainer.message = { type: "blocked", text: blocker };
    } else {
      trainer.cells[`${r}-${c}`] = color;
      const result = scorePlacement(trainer.cells, r, c);
      trainer.history.push({ r, c, color, ...result });
      trainer.message = { type: "placed", r, c, color, ...result };
    }
    refreshTrainer(`[data-az-cell="${r}-${c}"]`);
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
    if (button.closest("#az-trainer")) {
      onTrainerClick(button);
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
      root.querySelector(".az-page")?.prepend(notice);
    }
    notice.textContent = storageNoticeText();
  }

  function changePreference(patch) {
    const before = signature();
    const previousSide = state.side;
    state = normalizePreferences({ ...state, ...patch });
    savePreferences();
    if (signature() !== before) {
      setupState = { signature: signature(), checks: [] };
      saveSetup();
    }
    if (state.side !== previousSide) {
      trainer = freshTrainer();
    }
    rerender();
  }

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !root || !root.contains(target)) {
      return;
    }
    if (target.type === "radio" && target.dataset.players !== undefined) {
      if (PLAYER_COUNTS.includes(target.dataset.players) && target.dataset.players !== state.players) {
        changePreference({ players: target.dataset.players });
      }
      return;
    }
    if (target.type === "radio" && target.dataset.side !== undefined) {
      if (SIDES.includes(target.dataset.side) && target.dataset.side !== state.side) {
        changePreference({ side: target.dataset.side });
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

  window.Azul = { renderInto, onClick, onChange };
})();
