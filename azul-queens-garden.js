(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.azul-queens-garden.v1";
  const SETUP_KEY = "field-manual.azul-queens-garden.setup.v1";
  const MANUAL = "azul-queens-garden_core.pdf";
  const ICONS = "assets/azul-queens-garden/icons/";

  // ---------- rules data ----------

  // The six patterns and their value (cost to place = points per hexagon in a final group = minus points
  // when left in storage). The rulebook names tree, bird, butterfly and flower (pp. 3, 4, 6);
  // "leaves" and "bellflowers" are this guide's names for patterns 5 and 6.
  const PATTERNS = [
    { id: "tree", value: 1, en: "Tree", pt: "Árvore", cueEn: "1 tree", cuePt: "1 árvore", named: true },
    { id: "bird", value: 2, en: "Bird", pt: "Pássaro", cueEn: "2 wings", cuePt: "2 asas", named: true },
    { id: "butterfly", value: 3, en: "Butterfly", pt: "Borboleta", cueEn: "3 butterflies", cuePt: "3 borboletas", named: true },
    { id: "flower", value: 4, en: "Flower", pt: "Flor", cueEn: "4 petals", cuePt: "4 pétalas", named: true },
    { id: "leaves", value: 5, en: "Leaves", pt: "Folhas", cueEn: "a sprig of 5 leaves", cuePt: "um ramo de 5 folhas", named: false },
    { id: "bells", value: 6, en: "Bellflowers", pt: "Campânulas", cueEn: "a ring of 6 bell-shaped blossoms", cuePt: "um círculo de 6 flores em forma de sino", named: false }
  ];

  // The six colors, in the order of the evaluation track (blue first, p. 6; board picture, p. 2).
  const COLORS = [
    { id: "blue", en: "Blue", pt: "Azul", lookEn: "sky blue", lookPt: "azul-celeste", printedEn: "blue" },
    { id: "purple", en: "Purple", pt: "Roxo", lookEn: "dark violet", lookPt: "violeta-escuro", printedEn: null },
    { id: "lilac", en: "Lilac", pt: "Lilás", lookEn: "pale violet", lookPt: "violeta-claro", printedEn: null },
    { id: "yellow", en: "Yellow", pt: "Amarelo", lookEn: "golden yellow", lookPt: "amarelo-dourado", printedEn: "yellow" },
    { id: "light-green", en: "Light green", pt: "Verde-claro", lookEn: "grass green", lookPt: "verde-grama", printedEn: "light green" },
    { id: "dark-green", en: "Dark green", pt: "Verde-escuro", lookEn: "deep emerald green", lookPt: "verde-esmeralda escuro", printedEn: "green" }
  ];

  // Jokers received for completely surrounding each garden element (picture, p. 5).
  const ELEMENTS = [
    { id: "fountain", jokers: 1, en: "Fountain", pt: "Fonte" },
    { id: "statue", jokers: 2, en: "Statue", pt: "Estátua" },
    { id: "bench", jokers: 2, en: "Bench", pt: "Banco" },
    { id: "pavilion", jokers: 3, en: "Pavilion", pt: "Pavilhão" }
  ];

  // Garden expansions per round stack (setup step 5, p. 2). There are 36 in the box.
  const STACK_SIZE = { 2: 5, 3: 7, 4: 8 };
  const EXPANSIONS = 36;
  const TILES = 108;

  const PLAYER_COUNTS = ["2", "3", "4"];
  const SIDES = ["standard", "variant"];
  const defaults = { language: "pt-BR", players: "2", side: "standard" };
  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------

  function normalizePreferences(saved) {
    return {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      players: PLAYER_COUNTS.includes(String(saved?.players)) ? String(saved.players) : defaults.players,
      side: SIDES.includes(saved?.side) ? saved.side : defaults.side
    };
  }

  // The player count and the scoring-board side change the preparation; the language never clears the checklist.
  function signature(source = state) {
    return `${source.players}|${source.side}`;
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Azul: Queen's Garden preferences.", error);
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
      console.error("Could not read Azul: Queen's Garden setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Azul: Queen's Garden preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Azul: Queen's Garden setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function players() {
    return Number(state.players);
  }

  function variant() {
    return state.side === "variant";
  }

  function stackSize(count = players()) {
    return STACK_SIZE[Number(count)];
  }

  function supplySize(count = players()) {
    return EXPANSIONS - 4 * stackSize(count);
  }

  function scriptBase() {
    const script = document.querySelector('script[src*="azul-queens-garden.js"]');
    return script?.src || document.baseURI;
  }

  // The PDF holds the six square pages with the cover last: printed pages 2–6 are PDF pages 1–5,
  // and the cover (printed page 1) is PDF page 6.
  function pdfPage(page) {
    return page === 1 ? 6 : page - 1;
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
          <p class="eyebrow">${t("QUEEN'S GARDEN", "JARDIM DA RAINHA")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="aqg-section-references">${uniquePages(pages).map(referenceLink).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
  }

  function interpretation(en, pt) {
    return `<span class="aqg-interpretation">${t("Guide's reading", "Leitura do guia")}</span> ${t(en, pt)}`;
  }

  // The supplied rulebook is in English: in PT-BR, show the printed English term so it can be matched.
  function en(term) {
    return state.language === "pt-BR" ? ` <span class="aqg-en" lang="en">(${term})</span>` : "";
  }

  function icon(file, alt) {
    return `<img class="aqg-inline-icon" src="${ICONS}${file}.webp" alt="${alt}">`;
  }

  function patternName(p) {
    return t(p.en, p.pt);
  }

  function patternIcon(p) {
    return icon(`pattern-${p.value}-${p.id}`, patternName(p));
  }

  function pattern(p) {
    return `<span class="aqg-nowrap">${patternIcon(p)}<strong>${patternName(p)}</strong> (${p.value})</span>`;
  }

  function colorName(c) {
    return t(c.en, c.pt);
  }

  function color(c) {
    return `<span class="aqg-nowrap">${icon(`color-${c.id}`, colorName(c))}<strong>${colorName(c)}</strong></span>`;
  }

  function allPatterns() {
    return PATTERNS.map(pattern).join(" · ");
  }

  function allColors() {
    return COLORS.map(color).join(" · ");
  }

  function elementIcon(e) {
    return icon(`el-${e.id}`, t(e.en, e.pt));
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
    return side === "variant" ? t("Variant side", "Lado da variante") : t("Standard side", "Lado padrão");
  }

  function sideIcon(side = state.side) {
    return side === "variant"
      ? icon("side-variant-icon", t("orange central icon (variant side)", "ícone central laranja (lado da variante)"))
      : icon("side-standard-icon", t("pale green central icon (standard side)", "ícone central verde-claro (lado padrão)"));
  }

  // Final-scoring group bonus for the selected side.
  function bonusLine() {
    return variant()
      ? `${rl("Variant bonus", "groups of 4, 5 and 6 hexagons earn extra bonus points, printed at the bottom of the variant side of the scoring board — use those values.", "Bônus da variante", "grupos de 4, 5 e 6 hexágonos ganham pontos de bônus extras, impressos na parte de baixo do lado da variante do tabuleiro de pontuação — use esses valores.")} ${interpretation("each group earns only the bonus for its own size (a group of 6 gets the 6 bonus, not 4 + 5 + 6). The rulebook's small picture of that box seems to show +3 for 4 hexagons, +5 for 5 and +7 for 6; trust the board if it differs.", "cada grupo ganha só o bônus do seu próprio tamanho (um grupo de 6 ganha o bônus de 6, não 4 + 5 + 6). A pequena imagem desse quadro no manual parece mostrar +3 para 4 hexágonos, +5 para 5 e +7 para 6; se o tabuleiro mostrar outra coisa, vale o tabuleiro.")}`
      : rl("Bonus", "+6 points for each group of exactly 6 hexagons (the largest a group can be). Groups of 3, 4 or 5 get no bonus.", "Bônus", "+6 pontos para cada grupo de exatamente 6 hexágonos (o maior tamanho possível de um grupo). Grupos de 3, 4 ou 5 não ganham bônus.");
  }

  // ---------- sections ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Reference", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["basics", t("Patterns, colors & groups", "Padrões, cores e grupos")],
      ["acquire", t("A · Acquire hexagons", "A · Adquirir hexágonos")],
      ["place-tile", t("B · Place a tile", "B · Colocar uma peça")],
      ["expansion", t("C · Place a garden expansion", "C · Colocar uma expansão")],
      ["pass-scoring", t("D · Pass, scoring & next round", "D · Passar, pontuação e próxima rodada")],
      ["final", t("End of game & final scoring", "Fim e pontuação final")],
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
          <span class="brand-mark" aria-hidden="true">QG</span>
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
      `${readFailed ? "This browser could not read the saved Queen's Garden match or setup progress; defaults are shown. " : ""}${writeFailed ? "The latest change could not be saved and is visible on screen only." : ""}`,
      `${readFailed ? "Este navegador não conseguiu ler a partida ou o progresso de Queen's Garden salvos; as opções padrão estão sendo mostradas. " : ""}${writeFailed ? "A alteração mais recente não pôde ser salva e aparece somente na tela." : ""}`
    ).trim();
  }

  // ---------- configuration ----------

  function choiceCard(name, value, dataAttr, checked, title, description) {
    return `
      <label class="aqg-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" ${dataAttr} ${checked ? "checked" : ""}>
        <span class="aqg-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function group(legend, selected, intro, cards, columns = "") {
    return `
      <fieldset class="aqg-choice-group">
        <legend>${legend} <span>${selected}</span></legend>
        <p class="aqg-choice-intro">${intro}</p>
        <div class="aqg-choice-grid ${columns}">${cards}</div>
      </fieldset>`;
  }

  function playerChoiceText(count) {
    const n = Number(count);
    const s = stackSize(n);
    const left = 4 - n;
    return t(
      `4 round stacks of ${s} garden expansions each (${4 * s} of the 36); the other ${supplySize(n)} form the supply. ${n} garden boards, storages, fountain boards and scoring markers are used${left ? `; ${left} of each stay${left === 1 ? "s" : ""} in the box` : " — all of them"}.`,
      `4 pilhas de rodada com ${s} expansões de jardim cada (${4 * s} das 36); as outras ${supplySize(n)} formam a reserva. São usados ${n} tabuleiros de jardim, depósitos, tabuleiros de fonte e marcadores de pontuação${left ? `; ${left === 1 ? "1 de cada fica" : `${left} de cada ficam`} na caixa` : " — todos eles"}.`
    );
  }

  function matchConfiguration() {
    return `
      <section class="controls-panel aqg-config" id="build-match" aria-labelledby="aqg-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="aqg-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "The Queen's Garden rulebook has two decisions to make before setting up: how many people play, and which side of the scoring board you use (the normal game or the rulebook's Game Variant). Everything below is filtered to this match and saved on this device only.",
              "O manual de Queen's Garden tem duas decisões a tomar antes da preparação: quantas pessoas jogam e qual lado do tabuleiro de pontuação vocês usam (o jogo normal ou a variante do manual). Tudo abaixo é filtrado para esta partida e salvo só neste aparelho."
            )}</p>
          </div>
        </div>
        ${group(t("Players · selected:", "Jogadores · selecionado:"), `${playersLabel()} · ${t(`${stackSize()} expansions per round stack`, `${stackSize()} expansões por pilha de rodada`)}`,
          `${t("Queen's Garden plays 2 to 4. The rules are identical at every count; only the size of the four round stacks — and so how many garden expansions and tiles reach the display area each round — changes.", "Queen's Garden é para 2 a 4 jogadores. As regras são idênticas em qualquer número; só muda o tamanho das quatro pilhas de rodada — e, com ele, quantas expansões de jardim e peças chegam à área de oferta a cada rodada.")} ${referenceLink(2)}`,
          PLAYER_COUNTS.map((count) => choiceCard("aqg-players", count, `data-players="${count}"`, state.players === count, playersLabel(count), playerChoiceText(count))).join(""), "aqg-three")}
        ${group(t("Scoring board side · selected:", "Lado do tabuleiro de pontuação · selecionado:"), sideLabel(),
          `${t("The scoring board and its rotary wheel are double-sided; the central icon tells the sides apart. The side changes only two things: how patterns score in the end-of-round scoring, and the group bonuses in the final scoring.", "O tabuleiro de pontuação e sua roda giratória têm dois lados; o ícone central diferencia os lados. O lado muda só duas coisas: quanto os padrões pontuam na pontuação de fim de rodada e os bônus de grupo na pontuação final.")} ${referenceLink(2)} ${referenceLink(6)}`,
          [
            choiceCard("aqg-side", "standard", 'data-side="standard"', state.side === "standard", `${sideIcon("standard")} ${t("Standard side — normal game", "Lado padrão — jogo normal")}`, t(
              "Board and wheel on the side with the pale green central icon. Each end-of-round scoring uses the values of this side; in the final scoring, each group of 6 hexagons earns +6 bonus points. Recommended for a first game.",
              "Tabuleiro e roda no lado com o ícone central verde-claro. Cada pontuação de fim de rodada usa os valores deste lado; na pontuação final, cada grupo de 6 hexágonos ganha +6 pontos de bônus. Recomendado para a primeira partida."
            )),
            choiceCard("aqg-side", "variant", 'data-side="variant"', state.side === "variant", `${sideIcon("variant")} ${t("Variant side — Game Variant", "Lado da variante — variante do jogo")}`, t(
              "Board turned to the orange central icon, wheel assembled on that side. All rules are identical except: patterns score differently in the end-of-round scoring (values printed on this side), and groups of 4, 5 and 6 hexagons earn more bonus points in the final scoring.",
              "Tabuleiro virado para o ícone central laranja, roda montada nesse lado. Todas as regras são idênticas, exceto: os padrões pontuam de outro jeito na pontuação de fim de rodada (valores impressos neste lado) e grupos de 4, 5 e 6 hexágonos ganham mais pontos de bônus na pontuação final."
            ))
          ].join(""), "aqg-two")}
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function setupPhases() {
    const n = players();
    const s = stackSize();
    const left = 4 - n;
    return [
      {
        id: "players",
        title: t(`Player areas · ×${n}`, `Áreas dos jogadores · ×${n}`),
        pages: [2],
        items: [
          t("Each player chooses a player color.", "Cada jogador escolhe uma cor de jogador."),
          t(`Place 1 garden board${en("garden board")} in front of you. Its pale hexagon outlines show where garden expansions can be added later.`, `Ponha 1 tabuleiro de jardim${en("garden board")} à sua frente. Os contornos claros de hexágonos mostram onde expansões de jardim poderão ser acrescentadas depois.`),
          t(`Place 1 storage${en("storage")} ${icon("storage", t("storage", "depósito"))} next to it: 12 small hexagonal spaces (for tiles and jokers) above 2 large spaces (for garden expansions).`, `Ponha 1 depósito${en("storage")} ${icon("storage", "depósito")} ao lado: 12 espaços hexagonais pequenos (para peças e curingas) acima de 2 espaços grandes (para expansões de jardim).`),
          t(`Place 1 fountain board${en("fountain board")} in the middle of your garden board: a fountain ${elementIcon(ELEMENTS[0])} in the center, 6 free spaces around it, and statues ${elementIcon(ELEMENTS[1])} and benches ${elementIcon(ELEMENTS[2])} on its outer points. This is the start of your garden.`, `Ponha 1 tabuleiro de fonte${en("fountain board")} no meio do seu tabuleiro de jardim: uma fonte ${elementIcon(ELEMENTS[0])} no centro, 6 espaços livres em volta e estátuas ${elementIcon(ELEMENTS[1])} e bancos ${elementIcon(ELEMENTS[2])} nas pontas. Este é o começo do seu jardim.`),
          t(`Put 3 jokers${en("jokers")} ${icon("joker", t("joker", "curinga"))} on empty small spaces of your storage.`, `Ponha 3 curingas${en("jokers")} ${icon("joker", "curinga")} em espaços pequenos vazios do seu depósito.`),
          left ? t(`Return the ${left === 1 ? "unused garden board, storage, fountain board and scoring marker" : `${left} unused garden boards, storages, fountain boards and scoring markers`} to the box.`, `Devolva à caixa ${left === 1 ? "o tabuleiro de jardim, o depósito, o tabuleiro de fonte e o marcador de pontuação não usados" : `os ${left} tabuleiros de jardim, depósitos, tabuleiros de fonte e marcadores de pontuação não usados`}.`) : null
        ]
      },
      {
        id: "scoring-board",
        title: t(`Scoring board · ${variant() ? "variant side" : "standard side"}`, `Tabuleiro de pontuação · ${variant() ? "lado da variante" : "lado padrão"}`),
        pages: variant() ? [2, 6] : [2],
        items: [
          variant()
            ? t(`Place the scoring board${en("scoring board")} in the middle of the table with the <strong>orange central icon</strong> ${sideIcon("variant")} visible (Game Variant).`, `Ponha o tabuleiro de pontuação${en("scoring board")} no meio da mesa com o <strong>ícone central laranja</strong> ${sideIcon("variant")} visível (variante).`)
            : t(`Place the scoring board${en("scoring board")} in the middle of the table with the <strong>pale green central icon</strong> ${sideIcon("standard")} visible.`, `Ponha o tabuleiro de pontuação${en("scoring board")} no meio da mesa com o <strong>ícone central verde-claro</strong> ${sideIcon("standard")} visível.`),
          t(`Assemble the rotary wheel${en("rotary wheel")} on that side, in the middle of the board, and turn it to its starting position (marked on the board).`, `Monte a roda giratória${en("rotary wheel")} nesse lado, no meio do tabuleiro, e gire-a para a posição inicial (marcada no tabuleiro).`),
          t(`Put the evaluation marker${en("evaluation marker")} at the top of the evaluation track${en("evaluation track")} — the column of 6 colors followed by 6 patterns.`, `Ponha o marcador de avaliação${en("evaluation marker")} no alto da trilha de avaliação${en("evaluation track")} — a coluna com as 6 cores seguidas dos 6 padrões.`),
          t(`Each player puts the scoring marker${en("scoring marker")} of their color on the <strong>15th space</strong> of the scoring track${en("scoring track")} around the board.`, `Cada jogador põe o marcador de pontuação${en("scoring marker")} da sua cor na <strong>15ª casa</strong> da trilha de pontuação${en("scoring track")} em volta do tabuleiro.`),
          t(`Put the point tokens${en("point tokens")} ${icon("point-token", t("point token", "ficha de pontos"))} aside; you take yours when your marker completes a lap of the track.`, `Deixe as fichas de pontos${en("point tokens")} ${icon("point-token", "ficha de pontos")} de lado; você pega a sua quando seu marcador completa uma volta na trilha.`)
        ]
      },
      {
        id: "bag",
        title: t("Bag, tower and jokers", "Saco, torre e curingas"),
        pages: [2],
        items: [
          t(`Fill the bag${en("bag")} ${icon("bag", t("bag", "saco"))} with all <strong>${TILES} colored tiles</strong>${en("colored tiles")}.`, `Encha o saco${en("bag")} ${icon("bag", "saco")} com todas as <strong>${TILES} peças coloridas</strong>${en("colored tiles")}.`),
          t(`Place the tower${en("tower")} ${icon("tower", t("tower", "torre"))} next to the scoring board, empty: discarded tiles go into it.`, `Ponha a torre${en("tower")} ${icon("tower", "torre")} ao lado do tabuleiro de pontuação, vazia: as peças descartadas vão para ela.`),
          t(`Put the remaining jokers${en("jokers")} ${icon("joker", t("joker", "curinga"))} next to the tower: this is the joker supply.`, `Ponha os curingas${en("jokers")} ${icon("joker", "curinga")} restantes ao lado da torre: esta é a reserva de curingas.`)
        ]
      },
      {
        id: "stacks",
        title: t(`Round stacks and the display area · 4 × ${s}`, `Pilhas de rodada e área de oferta · 4 × ${s}`),
        pages: [2],
        items: [
          t(`Shuffle the 36 garden expansions${en("garden expansions")} face down (the side with 7 empty spaces up).`, `Embaralhe as 36 expansões de jardim${en("garden expansions")} com a face para baixo (o lado com 7 espaços vazios para cima).`),
          t(`Build <strong>4 face-down round stacks${en("round stacks")} of ${s} expansions each</strong> (${n} players → ${s}).`, `Monte <strong>4 pilhas de rodada${en("round stacks")} viradas para baixo, com ${s} expansões cada</strong> (${n} jogadores → ${s}).`),
          t(`Place the 1st round stack ${icon("round-stack-facedown", t("round stack", "pilha de rodada"))} in the middle of the table: this is the <strong>display area</strong>${en("display area")}.`, `Ponha a pilha da 1ª rodada ${icon("round-stack-facedown", "pilha de rodada")} no meio da mesa: esta é a <strong>área de oferta</strong>${en("display area")}.`),
          t("Place the stacks for rounds 2, 3 and 4 in a row above the scoring board.", "Ponha as pilhas das rodadas 2, 3 e 4 em fila, acima do tabuleiro de pontuação."),
          t(`Draw <strong>exactly 4 tiles</strong> at random from the bag and put them on the top expansion of the 1st round stack ${icon("round-stack", t("round stack with 4 tiles", "pilha de rodada com 4 peças"))}. They simply sit on it: its spaces are not used now.`, `Tire <strong>exatamente 4 peças</strong> do saco ao acaso e ponha-as sobre a expansão do topo da pilha da 1ª rodada ${icon("round-stack", "pilha de rodada com 4 peças")}. Elas só ficam em cima dela: os espaços dela não são usados agora.`)
        ]
      },
      {
        id: "supply",
        title: t(`Supply · ${supplySize()} expansions`, `Reserva · ${supplySize()} expansões`),
        pages: [2],
        items: [
          t(`Stack the remaining <strong>${supplySize()} garden expansions</strong> face down next to the row of round stacks: this is the supply${en("supply")}.`, `Empilhe as <strong>${supplySize()} expansões de jardim</strong> restantes viradas para baixo ao lado da fila de pilhas de rodada: esta é a reserva${en("supply")}.`),
          t(`Put the shield token${en("shield token")} ${icon("shield-token", t("shield token −6", "ficha de escudo −6"))} on top of it: a reminder that taking an expansion from the supply costs 6 points.`, `Ponha a ficha de escudo${en("shield token")} ${icon("shield-token", "ficha de escudo −6")} em cima dela: um lembrete de que pegar uma expansão da reserva custa 6 pontos.`)
        ]
      },
      {
        id: "start",
        title: t("First player", "Primeiro jogador"),
        pages: [2, 3],
        items: [
          t(`Place the first player marker${en("first player marker")} ${icon("first-player-marker", t("first player marker", "marcador de primeiro jogador"))} in the display area. It stays there until someone passes.`, `Ponha o marcador de primeiro jogador${en("first player marker")} ${icon("first-player-marker", "marcador de primeiro jogador")} na área de oferta. Ele fica ali até alguém passar.`),
          t("The <strong>youngest player</strong> takes the first turn of round 1; play goes clockwise.", "O <strong>jogador mais jovem</strong> faz o primeiro turno da rodada 1; o jogo segue em sentido horário.")
        ]
      }
    ];
  }

  function inventory() {
    const n = players();
    const s = stackSize();
    const left = 4 - n;
    const cards = [
      infoCard(t("SHARED", "COMPARTILHADO"), t("Middle of the table", "Meio da mesa"), [
        rl("Scoring board", `${sideLabel().toLowerCase()} up, rotary wheel at its starting position, evaluation marker at the top of the evaluation track, ${n} scoring markers on space 15.`, "Tabuleiro de pontuação", `${sideLabel().toLowerCase()} para cima, roda giratória na posição inicial, marcador de avaliação no alto da trilha de avaliação, ${n} marcadores de pontuação na casa 15.`),
        rl("Display area", `the 1st round stack (${s} expansions) with 4 tiles on top, and the first player marker.`, "Área de oferta", `a pilha da 1ª rodada (${s} expansões) com 4 peças em cima e o marcador de primeiro jogador.`),
        rl("Round stacks 2–4", `${s} face-down expansions each, in a row above the scoring board.`, "Pilhas das rodadas 2–4", `${s} expansões viradas para baixo cada, em fila acima do tabuleiro de pontuação.`),
        rl("Supply", `${supplySize()} face-down expansions under the shield token.`, "Reserva", `${supplySize()} expansões viradas para baixo sob a ficha de escudo.`),
        rl("Bag", `${TILES - 4} tiles once the first 4 are drawn.`, "Saco", `${TILES - 4} peças depois de tiradas as 4 primeiras.`),
        rl("Tower and joker supply", "the tower empty; the jokers beside it (they are not limited).", "Torre e reserva de curingas", "a torre vazia; os curingas ao lado (não são limitados)."),
        rl("Point tokens", "aside until needed.", "Fichas de pontos", "de lado até serem necessárias.")
      ], [2]),
      infoCard(t(`PER PLAYER · ×${n}`, `POR JOGADOR · ×${n}`), t("Each player", "Cada jogador"), [
        t("1 garden board with 1 fountain board in its middle.", "1 tabuleiro de jardim com 1 tabuleiro de fonte no meio."),
        t("1 storage holding 3 jokers.", "1 depósito com 3 curingas."),
        t("1 scoring marker on space 15 of the scoring track.", "1 marcador de pontuação na casa 15 da trilha."),
        t("No tiles: storage and garden start without hexagons.", "Nenhuma peça: depósito e jardim começam sem hexágonos.")
      ], [2]),
      infoCard(t("BACK IN THE BOX", "DE VOLTA À CAIXA"), t("Not used in this match", "Fora desta partida"), [
        left ? t(`${left} garden board${left === 1 ? "" : "s"}, ${left} storage${left === 1 ? "" : "s"}, ${left} fountain board${left === 1 ? "" : "s"} and ${left} scoring marker${left === 1 ? "" : "s"}.`, `${left} tabuleiro${left === 1 ? "" : "s"} de jardim, ${left} depósito${left === 1 ? "" : "s"}, ${left} tabuleiro${left === 1 ? "" : "s"} de fonte e ${left} marcador${left === 1 ? "" : "es"} de pontuação.`) : t("Nothing: all 4 player sets are used.", "Nada: os 4 conjuntos de jogador são usados."),
        left ? interpretation("the point tokens of unused colors stay in the box too.", "as fichas de pontos das cores não usadas também ficam na caixa.") : null,
        interpretation(`the rulebook has no component list. It gives ${TILES} tiles and 36 garden expansions; the rest of these counts follow from its setup.`, `o manual não tem lista de componentes. Ele informa ${TILES} peças e 36 expansões de jardim; o restante destas quantidades decorre da preparação.`)
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
        <label class="aqg-setup-check" for="aqg-setup-${phase.id}">
          <input id="aqg-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="aqg-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="aqg-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
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
          "Progress is saved separately from the match configuration and language. Changing the player count or the scoring board side clears this checklist; changing the language does not. “Uncheck all” clears only these setup boxes.",
          "O progresso é salvo separadamente da configuração da partida e do idioma. Trocar o número de jogadores ou o lado do tabuleiro de pontuação limpa esta lista; trocar o idioma não. “Desmarcar tudo” limpa somente as caixas da preparação."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}`;
  }

  // ---------- quick reference ----------

  function quickReference() {
    const cards = [
      infoCard(t("EACH ROUND · 4 ROUNDS", "CADA RODADA · 4 RODADAS"), t("Three phases", "Três fases"), [
        rl("Phase 1 · Actions", "starting with the first player (round 1: the youngest), clockwise, one action per turn, until every player has passed.", "Fase 1 · Ações", "começando pelo primeiro jogador (rodada 1: o mais jovem), em sentido horário, uma ação por turno, até todos os jogadores terem passado."),
        rl("Phase 2 · Scoring", "everyone scores the 3 patterns or colors shown by the wheel, plus 1 point per visible pavilion.", "Fase 2 · Pontuação", "todos pontuam os 3 padrões ou cores indicados pela roda, mais 1 ponto por pavilhão visível."),
        rl("Phase 3 · Next round", "rounds 1–3 only: turn the wheel, clear the display area, bring in the next round stack.", "Fase 3 · Próxima rodada", "só nas rodadas 1–3: gire a roda, limpe a área de oferta, traga a próxima pilha de rodada."),
        rl("After round 4", "its phase 2, then the final scoring.", "Depois da rodada 4", "a fase 2 dela e depois a pontuação final.")
      ], [3, 5, 6]),
      infoCard(t("YOUR TURN", "SEU TURNO"), t("Exactly one action", "Exatamente uma ação"), [
        rl("A · Acquire", "take every tile and face-up garden expansion of one pattern or one color from the display area into your storage.", "A · Adquirir", "pegue todas as peças e expansões de jardim viradas para cima de um padrão ou de uma cor da área de oferta para o seu depósito."),
        rl("B · Place a tile", "pay its value in hexagons from your storage and put it in your garden.", "B · Colocar uma peça", "pague o valor dela em hexágonos do seu depósito e ponha-a no seu jardim."),
        rl("C · Place a garden expansion", "from your storage (pay its value) or face down from the supply (6 points).", "C · Colocar uma expansão", "do seu depósito (pague o valor dela) ou virada para baixo da reserva (6 pontos)."),
        rl("D · Pass", "you are out until the next round.", "D · Passar", "você fica de fora até a próxima rodada."),
        rl("Must pass", "when you cannot do A, B or C.", "Obrigado a passar", "quando não puder fazer A, B nem C.")
      ], [3]),
      infoCard(t("A · ACQUIRE", "A · ADQUIRIR"), t("All of one pattern or one color", "Tudo de um padrão ou de uma cor"), [
        rl("Pattern", "take ALL hexagons of that pattern in the display area (they will all be different colors).", "Padrão", "pegue TODOS os hexágonos desse padrão na área de oferta (todos de cores diferentes)."),
        rl("Or color", "take ALL hexagons of that color (they will all be different patterns).", "Ou cor", "pegue TODOS os hexágonos dessa cor (todos de padrões diferentes)."),
        rl("Identical ones", "two or more identical hexagons (same pattern and color): take only one, your choice.", "Idênticos", "dois ou mais hexágonos idênticos (mesmo padrão e cor): pegue só um, à sua escolha."),
        rl("Storage limit", "12 small spaces (tiles and jokers), 2 large (expansions). If everything does not fit, choose something else.", "Limite do depósito", "12 espaços pequenos (peças e curingas), 2 grandes (expansões). Se não couber tudo, escolha outra coisa."),
        rl("Took a tile from the round stack", "move its top expansion, with its leftover tiles, beside the stack; put 4 new tiles from the bag on the new top.", "Pegou peça da pilha de rodada", "mova a expansão do topo, com as peças que sobraram, para o lado da pilha; ponha 4 peças novas do saco no novo topo."),
        rl("Empty expansions", "any expansion in the display area with no tiles left is turned face up: it is now available.", "Expansões vazias", "toda expansão da área de oferta sem peças é virada para cima: agora está disponível.")
      ], [3]),
      infoCard(t("B · PAY A COST", "B · PAGAR UM CUSTO"), t("Value = number of hexagons", "Valor = número de hexágonos"), [
        `${PATTERNS.map((p) => `${patternIcon(p)}${p.value}`).join(" ")}`,
        rl("Cost", "the pattern's value (1–6) in hexagons from your storage — tiles and/or face-up garden expansions. The one you place is one of them: a tree costs only itself, a bird itself + 1 more.", "Custo", "o valor do padrão (1–6) em hexágonos do seu depósito — peças e/ou expansões de jardim viradas para cima. O que você coloca é um deles: uma árvore custa só ela mesma, um pássaro ele mesmo + 1."),
        rl("Same pattern", "all of different colors — or —", "Mesmo padrão", "todos de cores diferentes — ou —"),
        rl("Same color", "all of different patterns. Never two identical ones.", "Mesma cor", "todos de padrões diferentes. Nunca dois idênticos."),
        rl("Jokers", "each replaces any hexagon except the one you place.", "Curingas", "cada um substitui qualquer hexágono, exceto o que você coloca."),
        rl("Discards", "tiles to the tower; expansions face down at the bottom of the supply stack; jokers to the joker supply.", "Descartes", "peças para a torre; expansões viradas para baixo no fundo da pilha da reserva; curingas para a reserva de curingas.")
      ], [4]),
      infoCard(t("B · PLACEMENT", "B · POSICIONAMENTO"), t("Where a hexagon may go", "Onde um hexágono pode ir"), [
        rl("Always", "a free space of your garden (no hexagon and no garden element on it), and then either:", "Sempre", "um espaço livre do seu jardim (sem hexágono e sem elemento de jardim) e, além disso, ou:"),
        rl("Alone", "touching no hexagon; or", "Sozinho", "sem encostar em nenhum hexágono; ou"),
        rl("Matching", "if it touches hexagons, it shares the pattern or the color of at least one of them.", "Combinando", "se encostar em hexágonos, tem o padrão ou a cor de pelo menos um deles."),
        rl("No twins in a group", "never create or extend a group (directly or by linking groups) that would hold 2 identical hexagons.", "Sem gêmeos no grupo", "nunca crie nem aumente um grupo (direto ou ligando grupos) que ficaria com 2 hexágonos idênticos."),
        rl("Surround", `completely surround a garden element → jokers into your storage: ${ELEMENTS.map((e) => `${elementIcon(e)}${e.jokers}`).join(" ")} (fountain 1, statue 2, bench 2, pavilion 3). No room → extras lost.`, "Cercar", `cerque completamente um elemento de jardim → curingas para o depósito: ${ELEMENTS.map((e) => `${elementIcon(e)}${e.jokers}`).join(" ")} (fonte 1, estátua 2, banco 2, pavilhão 3). Sem espaço → o excesso se perde.`)
      ], [5]),
      infoCard(t("C · GARDEN EXPANSION", "C · EXPANSÃO DE JARDIM"), t("More room for tiles", "Mais espaço para peças"), [
        rl("From your storage", "pay the cost of the hexagon printed on it (the expansion is one of the paid hexagons): 5 free spaces + a pavilion.", "Do seu depósito", "pague o custo do hexágono impresso nela (a expansão é um dos hexágonos pagos): 5 espaços livres + um pavilhão."),
        rl("Or from the supply", "take one face down by moving your marker back exactly 6 spaces (only with 6+ points): 7 free spaces.", "Ou da reserva", "pegue uma virada para baixo recuando seu marcador exatamente 6 casas (só com 6 pontos ou mais): 7 espaços livres."),
        rl("Place", "on a free expansion area around your fountain board, any orientation; its printed hexagon follows the placement rules.", "Coloque", "numa área de expansão livre em volta do tabuleiro de fonte, em qualquer orientação; o hexágono impresso segue as regras de posicionamento.")
      ], [5]),
      infoCard(t("D · PASS", "D · PASSAR"), t("Out for the rest of phase 1", "Fora pelo resto da fase 1"), [
        rl("Discard", "optionally discard any hexagons from your storage; lose their values in points.", "Descarte", "se quiser, descarte hexágonos do seu depósito; perca os valores deles em pontos."),
        rl("First to pass", `takes the first player marker ${icon("first-player-marker", t("first player marker", "marcador de primeiro jogador"))} and moves back 1 space.`, "Primeiro a passar", `pega o marcador de primeiro jogador ${icon("first-player-marker", "marcador de primeiro jogador")} e recua 1 casa.`),
        rl("After passing", "no more turns this round. Phase 1 ends when everyone has passed.", "Depois de passar", "nenhum turno a mais nesta rodada. A fase 1 acaba quando todos passaram.")
      ], [5]),
      infoCard(t("PHASE 2 · SCORING", "FASE 2 · PONTUAÇÃO"), t("After each round", "Depois de cada rodada"), [
        rl("Wheel", `it shows 3 patterns or colors; each hexagon in your garden matching one scores the points the board shows for it${variant() ? " (variant side values)" : ""}.`, "Roda", `ela indica 3 padrões ou cores; cada hexágono do seu jardim que combina com um deles marca os pontos que o tabuleiro mostra para ele${variant() ? " (valores do lado da variante)" : ""}.`),
        rl("Twice", "a hexagon matching an indicated pattern and an indicated color scores for both.", "Duas vezes", "um hexágono que combina com um padrão e com uma cor indicados pontua pelos dois."),
        rl("Pavilions", "+1 per visible pavilion in your garden.", "Pavilhões", "+1 por pavilhão visível no seu jardim.")
      ], [5, 6], "aqg-score-card"),
      infoCard(t("PHASE 3 · NEXT ROUND", "FASE 3 · PRÓXIMA RODADA"), t("Not after round 4", "Não depois da rodada 4"), [
        rl("Wheel", "turn it clockwise to its next position.", "Roda", "gire-a em sentido horário até a próxima posição."),
        rl("Display area", "leftover tiles to the tower; every expansion there face down to the supply.", "Área de oferta", "as peças que sobraram para a torre; todas as expansões dela viradas para baixo para a reserva."),
        rl("New stack", "next round stack into the display area, 4 tiles on its top.", "Nova pilha", "a pilha da próxima rodada na área de oferta, com 4 peças no topo."),
        rl("Start", "the first player marker holder puts it in the display area and starts.", "Início", "quem tem o marcador de primeiro jogador o põe na área de oferta e começa.")
      ], [5]),
      infoCard(t("END OF THE GAME", "FIM DA PARTIDA"), t("After round 4's scoring", "Depois da pontuação da rodada 4"), [
        rl("Storage", "+1 per joker; minus the value of every tile and expansion left.", "Depósito", "+1 por curinga; menos o valor de cada peça e expansão que sobrou."),
        rl("Groups", "for each color, then each pattern of the evaluation track: every group of 3+ matching hexagons scores the sum of their values.", "Grupos", "para cada cor e depois cada padrão da trilha de avaliação: todo grupo de 3+ hexágonos correspondentes pontua a soma dos valores."),
        bonusLine(),
        rl("Winner", "most points; a tie is a shared victory.", "Vencedor", "mais pontos; empate é vitória compartilhada.")
      ], [6], "victory-card"),
      infoCard(t("BAG RUNS SHORT", "SACO ACABANDO"), t("At any time", "A qualquer momento"), [
        rl("Refill", "not enough tiles to fill an expansion: put all tiles from the tower back into the bag.", "Reabasteça", "faltam peças para encher uma expansão: devolva todas as peças da torre ao saco."),
        rl("Still short", "fill it with fewer tiles, or none.", "Ainda falta", "encha-a com menos peças, ou nenhuma."),
        rl("None at all", "every empty expansion of the current round stack goes face up into the display area.", "Nenhuma", "todas as expansões vazias da pilha da rodada atual vão viradas para cima para a área de oferta.")
      ], [5])
    ];
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), sectionIndex("quick-reference"), [3, 4, 5, 6])}
      <div class="callout">${t(
        "Over 4 rounds you draft colored hexagon tiles into your storage, then pay for them with other hexagons to place them in your garden, side by side with matching patterns or colors. Garden expansions give you more room. Each round ends with a scoring of the wheel's 3 patterns or colors; the game ends with a scoring of every group of 3 or more matching hexagons.",
        "Ao longo de 4 rodadas você pega peças hexagonais coloridas para o seu depósito e depois paga por elas com outros hexágonos para colocá-las no seu jardim, lado a lado com padrões ou cores que combinam. Expansões de jardim dão mais espaço. Cada rodada termina com a pontuação dos 3 padrões ou cores da roda; a partida termina com a pontuação de cada grupo de 3 ou mais hexágonos correspondentes."
      )} ${referenceLink(3)}</div>
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- basics ----------

  function valueTable() {
    return `
      <div class="aqg-table-wrap">
        <table class="aqg-values">
          <caption>${t("The value of each pattern", "O valor de cada padrão")}</caption>
          <thead><tr>
            <th scope="col">${t("Pattern", "Padrão")}</th>
            <th scope="col">${icon("cost-icon", t("cost", "custo"))}${t("Cost to place", "Custo para colocar")}</th>
            <th scope="col">${icon("points-icon", t("points", "pontos"))}${t("Points in a final group", "Pontos num grupo final")}</th>
            <th scope="col">${t("Left in storage", "Sobra no depósito")}</th>
          </tr></thead>
          <tbody>${PATTERNS.map((p) => `
            <tr>
              <th scope="row">${patternIcon(p)}<span>${patternName(p)}<small>${t(p.cueEn, p.cuePt)}</small></span></th>
              <td>${t(`${p.value} hexagon${p.value === 1 ? "" : "s"}`, `${p.value} hexágono${p.value === 1 ? "" : "s"}`)}</td>
              <td>+${p.value}</td>
              <td>−${p.value}</td>
            </tr>`).join("")}</tbody>
        </table>
      </div>`;
  }

  function basicsSection() {
    return `
      ${sectionHeading("basics", t("Patterns, colors & groups", "Padrões, cores e grupos"), sectionIndex("basics"), [3, 5])}
      <p class="glossary-intro">${t(
        "Everything in Queen's Garden is a hexagon with a pattern and a color. Learn these four ideas before your first turn.",
        "Tudo em Queen's Garden é um hexágono com um padrão e uma cor. Aprenda estas quatro ideias antes do primeiro turno."
      )} ${referenceLink(3)}</p>
      ${valueTable()}
      <div class="quick-grid">
        ${infoCard(t("PATTERNS · 6", "PADRÕES · 6"), t("Each has a value from 1 to 6", "Cada um tem um valor de 1 a 6"), [
          allPatterns(),
          t("The value is both the <strong>cost</strong> to place a hexagon of that pattern and the <strong>points</strong> it is worth in a group at the end. The drawing helps you remember it: the bird has 2 wings, there are 3 butterflies, the flower has 4 petals, and so on.", "O valor é ao mesmo tempo o <strong>custo</strong> para colocar um hexágono desse padrão e os <strong>pontos</strong> que ele vale num grupo no fim. O desenho ajuda a lembrar: o pássaro tem 2 asas, são 3 borboletas, a flor tem 4 pétalas e assim por diante."),
          interpretation("the rulebook names only tree, bird, butterfly and flower; “leaves” (5) and “bellflowers” (6) are this guide's names.", "o manual só nomeia árvore, pássaro, borboleta e flor; “folhas” (5) e “campânulas” (6) são nomes deste guia.")
        ], [3, 6])}
        ${infoCard(t("COLORS · 6", "CORES · 6"), t("In evaluation-track order", "Na ordem da trilha de avaliação"), [
          allColors(),
          t("The 6 patterns are spread evenly across the 6 colors.", "Os 6 padrões estão distribuídos igualmente entre as 6 cores."),
          interpretation(`${TILES} tiles ÷ 36 pattern-and-color combinations = 3 tiles of each exact combination. The rulebook says “blue”, “yellow”, “light green” and “green”; “purple”, “lilac” and “dark green” are this guide's names.`, `${TILES} peças ÷ 36 combinações de padrão e cor = 3 peças de cada combinação exata. O manual diz “blue”, “yellow”, “light green” e “green”; “roxo”, “lilás” e “verde-escuro” são nomes deste guia.`)
        ], [3, 6])}
        ${infoCard(t("HEXAGON", "HEXÁGONO"), t("A pattern + a color", "Um padrão + uma cor"), [
          t("Any combination of a pattern and a color, wherever it is: on a <strong>tile</strong>, or printed on a <strong>face-up garden expansion</strong>.", "Qualquer combinação de um padrão e uma cor, onde estiver: numa <strong>peça</strong> ou impressa numa <strong>expansão de jardim virada para cima</strong>."),
          rl("Identical", "two hexagons with the same pattern <em>and</em> the same color.", "Idênticos", "dois hexágonos com o mesmo padrão <em>e</em> a mesma cor."),
          t("Jokers and garden elements (fountain, statues, benches, pavilions) are <strong>not</strong> hexagons.", "Curingas e elementos de jardim (fonte, estátuas, bancos, pavilhões) <strong>não</strong> são hexágonos.")
        ], [3])}
        ${infoCard(t("YOUR GARDEN", "SEU JARDIM"), t("Fountain board + expansions", "Tabuleiro de fonte + expansões"), [
          t(`You start with the fountain board: the fountain ${elementIcon(ELEMENTS[0])} in the center, <strong>6 free spaces</strong> around it, statues ${elementIcon(ELEMENTS[1])} and benches ${elementIcon(ELEMENTS[2])} on its points.`, `Você começa com o tabuleiro de fonte: a fonte ${elementIcon(ELEMENTS[0])} no centro, <strong>6 espaços livres</strong> em volta, estátuas ${elementIcon(ELEMENTS[1])} e bancos ${elementIcon(ELEMENTS[2])} nas pontas.`),
          t(`Garden expansions add 5 free spaces and a pavilion ${elementIcon(ELEMENTS[3])} (face up) or 7 free spaces (face down).`, `Expansões de jardim acrescentam 5 espaços livres e um pavilhão ${elementIcon(ELEMENTS[3])} (viradas para cima) ou 7 espaços livres (viradas para baixo).`),
          rl("Free space", "a space with no hexagon and no garden element on it.", "Espaço livre", "um espaço sem hexágono e sem elemento de jardim."),
          interpretation("tiles go only on the fountain board and on placed expansions; the pale outlines of the garden board only show where expansions fit.", "as peças vão só no tabuleiro de fonte e nas expansões colocadas; os contornos claros do tabuleiro de jardim só mostram onde as expansões se encaixam.")
        ], [2, 5])}
        ${infoCard(t("GROUPS", "GRUPOS"), t("What scores at the end", "O que pontua no fim"), [
          rl("Adjacent", "two hexagons that share an edge.", "Adjacentes", "dois hexágonos que compartilham uma borda."),
          rl("Group", "at least 2 adjacent hexagons sharing either the same pattern (in different colors) or the same color (with different patterns) — never both at once. A group extends through every connected hexagon of that pattern (or color).", "Grupo", "pelo menos 2 hexágonos adjacentes que têm o mesmo padrão (em cores diferentes) ou a mesma cor (com padrões diferentes) — nunca os dois ao mesmo tempo. Um grupo se estende por todo hexágono ligado desse padrão (ou cor)."),
          rl("Two groups at once", "a hexagon can belong to a group for its pattern and another for its color.", "Dois grupos ao mesmo tempo", "um hexágono pode estar num grupo pelo padrão e noutro pela cor."),
          rl("No twins", "a group may never contain 2 identical hexagons, so it holds at most 6.", "Sem gêmeos", "um grupo nunca pode ter 2 hexágonos idênticos, então tem no máximo 6."),
          rl("Scoring", "only groups of 3 or more score, in the final scoring.", "Pontuação", "só grupos de 3 ou mais pontuam, na pontuação final.")
        ], [5, 6])}
        ${infoCard(t("STORAGE", "DEPÓSITO"), t("Where acquired hexagons wait", "Onde os hexágonos adquiridos esperam"), [
          rl("12 small spaces", "for tiles and jokers.", "12 espaços pequenos", "para peças e curingas."),
          rl("2 large spaces", "for garden expansions.", "2 espaços grandes", "para expansões de jardim."),
          t("You pay every cost from your storage. What remains at the end of the game costs points (jokers earn +1).", "Você paga todo custo com o seu depósito. O que sobrar no fim da partida custa pontos (curingas valem +1)."),
          interpretation("the storage is never emptied between rounds; jokers share the 12 small spaces with tiles, as the setup picture shows.", "o depósito nunca é esvaziado entre rodadas; os curingas dividem os 12 espaços pequenos com as peças, como mostra a figura da preparação.")
        ], [2, 3, 6])}
      </div>`;
  }

  // ---------- A · acquire ----------

  function acquireSection() {
    return `
      ${sectionHeading("acquire", t("A · Acquire hexagons", "A · Adquirir hexágonos"), sectionIndex("acquire"), [3, 4, 5])}
      <p class="glossary-intro">${t(
        "Each round is played in 3 phases. In phase 1 (Players actions), starting with the first player and going clockwise, each player performs exactly one action per turn: A · Acquire tiles and garden expansions, B · Place a tile, C · Place a garden expansion, or D · Pass. Phase 1 goes on until everyone has passed.",
        "Cada rodada tem 3 fases. Na fase 1 (Ações dos jogadores), começando pelo primeiro jogador e seguindo em sentido horário, cada jogador faz exatamente uma ação por turno: A · Adquirir peças e expansões de jardim, B · Colocar uma peça, C · Colocar uma expansão de jardim ou D · Passar. A fase 1 continua até todos terem passado."
      )} ${referenceLink(3)}</p>
      <div class="quick-grid">
        ${infoCard(t("THE DISPLAY AREA", "A ÁREA DE OFERTA"), t("What can be taken", "O que pode ser pego"), [
          rl("Round stack", "only its top expansion holds tiles (4 when filled); the expansions below wait their turn.", "Pilha de rodada", "só a expansão do topo tem peças (4 quando abastecida); as de baixo esperam a vez."),
          rl("Expansions beside the stack", "face down, with the tiles left on them when they were moved there.", "Expansões ao lado da pilha", "viradas para baixo, com as peças que sobraram nelas quando foram movidas para lá."),
          rl("Face-up expansions", `${icon("faceup-expansion", t("face-up garden expansion", "expansão de jardim virada para cima"))} empty expansions turned face up: each shows 1 hexagon and a pavilion, and can be acquired like a tile.`, "Expansões viradas para cima", `${icon("faceup-expansion", "expansão de jardim virada para cima")} expansões vazias que foram viradas para cima: cada uma mostra 1 hexágono e um pavilhão e pode ser adquirida como uma peça.`),
          t("Tiles on any expansion in the display area can be taken, not only those on the round stack.", "As peças de qualquer expansão da área de oferta podem ser pegas, não só as da pilha de rodada.")
        ], [2, 3])}
        ${infoCard(t("CHOOSE", "ESCOLHA"), t("One pattern or one color", "Um padrão ou uma cor"), [
          rl("A pattern", "take ALL the tiles and face-up garden expansions of that pattern in the display area. They are of different colors.", "Um padrão", "pegue TODAS as peças e expansões viradas para cima desse padrão na área de oferta. Elas são de cores diferentes."),
          rl("Or a color", "take ALL the tiles and face-up garden expansions of that color. They show different patterns.", "Ou uma cor", "pegue TODAS as peças e expansões viradas para cima dessa cor. Elas mostram padrões diferentes."),
          rl("Identical hexagons", "if two or more in your selection are identical, take only one of them (you choose which) and leave the others.", "Hexágonos idênticos", "se dois ou mais da sua seleção forem idênticos, pegue só um deles (você escolhe qual) e deixe os outros."),
          t("You cannot take only part of a selection: it is all of them (minus the identical extras) or nothing.", "Não dá para pegar só parte de uma seleção: são todos (menos os idênticos extras) ou nada.")
        ], [3])}
        ${infoCard(t("INTO YOUR STORAGE", "PARA O SEU DEPÓSITO"), t("It must all fit", "Tudo precisa caber"), [
          t("Everything you acquire goes into your storage: tiles on the 12 small spaces (shared with your jokers), garden expansions on the 2 large spaces.", "Tudo o que você adquire vai para o seu depósito: peças nos 12 espaços pequenos (divididos com os seus curingas), expansões de jardim nos 2 espaços grandes."),
          t("If there is not enough room for every selected hexagon, that selection cannot be made: choose another one or another action.", "Se não houver espaço para todos os hexágonos selecionados, essa seleção não pode ser feita: escolha outra ou outra ação.")
        ], [3])}
        ${infoCard(t("THEN", "DEPOIS"), t("Update the display area", "Atualize a área de oferta"), [
          rl("1 · If you took at least one tile from the round stack's top expansion", "remove that top expansion together with any tiles still on it and set it on the table beside the stack: it now extends the display area.", "1 · Se você pegou pelo menos uma peça da expansão do topo da pilha", "retire essa expansão do topo, junto com as peças que ainda estão nela, e ponha-a na mesa ao lado da pilha: agora ela amplia a área de oferta."),
          rl("2 · Refill", "put exactly 4 tiles drawn at random from the bag on the new top expansion of the round stack.", "2 · Reabasteça", "ponha exatamente 4 peças tiradas do saco ao acaso na nova expansão do topo da pilha de rodada."),
          rl("3 · Flip empty ones", "every expansion in the display area with no tiles left is turned face up. It now shows a pavilion in its center and a hexagon, and can be acquired.", "3 · Vire as vazias", "toda expansão da área de oferta sem peças é virada para cima. Agora ela mostra um pavilhão no centro e um hexágono e pode ser adquirida."),
          t("If you took tiles only from expansions beside the stack, skip steps 1 and 2 (but still flip any that are now empty).", "Se você pegou peças só de expansões ao lado da pilha, pule os passos 1 e 2 (mas vire as que ficaram vazias)."),
          interpretation("when the last expansion of the round stack has been moved aside, there is no top left to refill; the round continues with what is in the display area.", "quando a última expansão da pilha de rodada já foi movida para o lado, não há topo para reabastecer; a rodada continua com o que está na área de oferta.")
        ], [3])}
        ${infoCard(t("BAG RUNS SHORT", "SACO ACABANDO"), t("Whenever tiles must be drawn", "Sempre que for preciso tirar peças"), [
          t("If the bag does not hold enough tiles to fill an expansion, put all the tiles from the tower back into the bag.", "Se o saco não tiver peças suficientes para encher uma expansão, devolva todas as peças da torre ao saco."),
          t("If there are still not enough, play on with fewer tiles on the stack, or none.", "Se ainda faltar, continue com menos peças na pilha, ou nenhuma."),
          t("If no tile at all can be placed on it, all the empty expansions of the current round stack are placed face up in the display area.", "Se nenhuma peça puder ser posta nela, todas as expansões vazias da pilha da rodada atual vão viradas para cima para a área de oferta.")
        ], [5])}
      </div>`;
  }

  // ---------- B · place a tile ----------

  function placeTileSection() {
    return `
      ${sectionHeading("place-tile", t("B · Place a tile", "B · Colocar uma peça"), sectionIndex("place-tile"), [4, 5])}
      <p class="glossary-intro">${t(
        "Choose one tile from your storage, pay its cost and place it in your garden. A tile must already be in your storage: acquiring it and placing it take two separate turns.",
        "Escolha uma peça do seu depósito, pague o custo dela e coloque-a no seu jardim. A peça precisa já estar no depósito: adquiri-la e colocá-la são dois turnos separados."
      )} ${referenceLink(4)}</p>
      <div class="quick-grid">
        ${infoCard(t("PAYING A COST", "PAGAR UM CUSTO"), t("The value of its pattern, in hexagons", "O valor do padrão, em hexágonos"), [
          t("The cost of each pattern is printed at the top of your garden board: tree 1, bird 2, butterfly 3, flower 4, leaves 5, bellflowers 6.", "O custo de cada padrão está impresso no alto do seu tabuleiro de jardim: árvore 1, pássaro 2, borboleta 3, flor 4, folhas 5, campânulas 6."),
          t("Discard that many hexagons — tiles and/or garden expansions from your storage — <strong>counting the tile you place</strong>. A tree costs just the tree itself.", "Descarte esse número de hexágonos — peças e/ou expansões de jardim do seu depósito — <strong>contando a peça que você coloca</strong>. Uma árvore custa só a própria árvore."),
          rl("Option 1", "all of them show the same pattern, each in a different color; or", "Opção 1", "todos mostram o mesmo padrão, cada um de uma cor diferente; ou"),
          rl("Option 2", "all of them are the same color, each with a different pattern.", "Opção 2", "todos são da mesma cor, cada um com um padrão diferente."),
          rl("Never", "two identical hexagons in one payment.", "Nunca", "dois hexágonos idênticos num pagamento.")
        ], [4])}
        ${infoCard(t("JOKERS", "CURINGAS"), t("Fill the gaps", "Completam o que falta"), [
          t(`If you lack hexagons of the needed pattern or color — or do not want to use them — complete the payment with jokers ${icon("joker", t("joker", "curinga"))}: 1 joker for each missing hexagon.`, `Se faltarem hexágonos do padrão ou da cor necessários — ou se você não quiser usá-los — complete o pagamento com curingas ${icon("joker", "curinga")}: 1 curinga para cada hexágono que falta.`),
          t("You must still have the hexagon you place: a joker can never be placed in your garden.", "Você ainda precisa ter o hexágono que coloca: um curinga nunca pode ir para o jardim."),
          t("Example: bellflowers (6) could be paid with the bellflowers tile + 5 jokers.", "Exemplo: campânulas (6) podem ser pagas com a peça de campânulas + 5 curingas.")
        ], [4])}
        ${infoCard(t("WHERE THE DISCARDS GO", "PARA ONDE VÃO OS DESCARTES"), t("Everything except the placed tile", "Tudo, menos a peça colocada"), [
          rl("Tiles", `into the tower ${icon("tower", t("tower", "torre"))}.`, "Peças", `para a torre ${icon("tower", "torre")}.`),
          rl("Garden expansions", "face down at the bottom of the supply stack.", "Expansões de jardim", "viradas para baixo, no fundo da pilha da reserva."),
          rl("Jokers", "back to the joker supply.", "Curingas", "de volta à reserva de curingas.")
        ], [4])}
        ${infoCard(t("PLACEMENT", "POSICIONAMENTO"), t("Where the tile may go", "Onde a peça pode ir"), [
          t("It must go on a <strong>free space</strong> of your garden (no hexagon and no garden element on it) <strong>and</strong> be either:", "Ela precisa ir num <strong>espaço livre</strong> do seu jardim (sem hexágono e sem elemento de jardim) <strong>e</strong> estar:"),
          rl("Alone", "with no adjacent hexagon; or", "Sozinha", "sem nenhum hexágono adjacente; ou"),
          rl("Matching", "next to one or more hexagons — then its pattern or its color must be the same as at least one of them. The other neighbors may differ.", "Combinando", "ao lado de um ou mais hexágonos — então o padrão ou a cor dela precisa ser igual ao de pelo menos um deles. Os outros vizinhos podem ser diferentes."),
          t("Garden elements around the space do not matter for this check.", "Os elementos de jardim em volta do espaço não contam nesta verificação.")
        ], [5])}
        ${infoCard(t("GROUP LIMIT", "LIMITE DOS GRUPOS"), t("No identical hexagons in a group", "Sem hexágonos idênticos num grupo"), [
          t("You may never create or extend a group that would then contain 2 identical hexagons (same pattern and same color).", "Você nunca pode criar nem aumentar um grupo que ficaria com 2 hexágonos idênticos (mesmo padrão e mesma cor)."),
          t("This applies both to the group the new hexagon joins directly and to groups it connects together: if linking two purple groups would put two purple birds in one group, that space is forbidden.", "Isso vale tanto para o grupo em que o hexágono novo entra direto quanto para grupos que ele liga: se juntar dois grupos roxos colocaria dois pássaros roxos no mesmo grupo, esse espaço é proibido."),
          interpretation("so an identical hexagon can never be placed next to its twin.", "portanto um hexágono nunca pode ser colocado ao lado do seu idêntico.")
        ], [5])}
        ${infoCard(t("SURROUND REWARDS", "RECOMPENSA POR CERCAR"), t("Jokers for garden elements", "Curingas por elementos de jardim"), [
          ...ELEMENTS.map((e) => rl(`${elementIcon(e)} ${e.en}`, `${e.jokers} joker${e.jokers === 1 ? "" : "s"}.`, `${elementIcon(e)} ${e.pt}`, `${e.jokers} curinga${e.jokers === 1 ? "" : "s"}.`)),
          t("When your placement completely surrounds a fountain, statue, bench or pavilion, take that many jokers from the joker supply and put them in your storage at once.", "Quando sua colocação cerca completamente uma fonte, estátua, banco ou pavilhão, pegue esse número de curingas da reserva e ponha-os no depósito na hora."),
          t("Not enough room in your storage: the extra jokers are lost. The jokers are not limited; if the supply runs out, use any substitute.", "Sem espaço no depósito: os curingas a mais se perdem. Os curingas não são limitados; se a reserva acabar, use qualquer substituto."),
          interpretation("“completely surrounded” means every space touching the element is covered by a hexagon or another garden element; an element on the edge of your garden needs an expansion placed beside it first.", "“completamente cercado” significa que todo espaço encostado no elemento está coberto por um hexágono ou outro elemento de jardim; um elemento na borda do jardim precisa antes de uma expansão colocada ao lado.")
        ], [5])}
      </div>`;
  }

  // ---------- C · garden expansion ----------

  function expansionSection() {
    return `
      ${sectionHeading("expansion", t("C · Place a garden expansion", "C · Colocar uma expansão de jardim"), sectionIndex("expansion"), [5])}
      <p class="glossary-intro">${t(
        "Garden expansions give your garden 5 or 7 more spaces for tiles. There are two ways to get one into your garden; each is one action.",
        "As expansões de jardim dão ao seu jardim mais 5 ou 7 espaços para peças. Há duas formas de pôr uma no jardim; cada uma é uma ação."
      )} ${referenceLink(5)}</p>
      <div class="quick-grid">
        ${infoCard(t("EITHER · FROM YOUR STORAGE", "OU · DO SEU DEPÓSITO"), t("A face-up expansion you acquired", "Uma expansão virada para cima que você adquiriu"), [
          `${icon("faceup-expansion", t("face-up garden expansion", "expansão de jardim virada para cima"))} ${t("Face up, it shows a pavilion in its center, 1 printed hexagon and 5 free spaces.", "Virada para cima, ela mostra um pavilhão no centro, 1 hexágono impresso e 5 espaços livres.")}`,
          t("Pay the cost of its hexagon's pattern exactly as for a tile: the expansion itself is one of the paid hexagons (like the tile you place), and stays in your garden.", "Pague o custo do padrão do hexágono dela exatamente como para uma peça: a própria expansão é um dos hexágonos pagos (como a peça que você coloca) e fica no seu jardim."),
          t("Its printed hexagon counts as a hexagon of your garden from then on (placement, groups, scoring); its pavilion scores 1 point in every end-of-round scoring.", "O hexágono impresso conta como hexágono do seu jardim a partir daí (posicionamento, grupos, pontuação); o pavilhão vale 1 ponto em toda pontuação de fim de rodada.")
        ], [4, 5])}
        ${infoCard(t("OR · FROM THE SUPPLY", "OU · DA RESERVA"), t("A face-down expansion for 6 points", "Uma expansão virada para baixo por 6 pontos"), [
          `${icon("shield-token", t("shield token −6", "ficha de escudo −6"))} ${t("Take the top garden expansion of the supply and keep it face down: 7 free spaces, no hexagon, no pavilion.", "Pegue a expansão de jardim do topo da reserva e mantenha-a virada para baixo: 7 espaços livres, sem hexágono, sem pavilhão.")}`,
          t("Spend exactly 6 points: move your scoring marker back 6 spaces.", "Gaste exatamente 6 pontos: recue seu marcador de pontuação 6 casas."),
          t("A score cannot become negative, so you need at least 6 points to do this.", "A pontuação não pode ficar negativa, então você precisa de pelo menos 6 pontos para isso.")
        ], [5])}
        ${infoCard(t("PLACING IT", "COLOCAR"), t("Around your fountain board", "Em volta do tabuleiro de fonte"), [
          t("Put it on a free expansion area around your fountain board (outlined on your garden board), in any orientation you like.", "Ponha-a numa área de expansão livre em volta do tabuleiro de fonte (marcada no seu tabuleiro de jardim), na orientação que quiser."),
          t("Follow the same placement rules as for tiles: a face-up expansion's printed hexagon must touch no hexagon or match the pattern or color of at least one it touches, and may not create or extend a group with 2 identical hexagons.", "Siga as mesmas regras de posicionamento das peças: o hexágono impresso de uma expansão virada para cima não pode encostar em hexágono nenhum ou precisa combinar no padrão ou na cor com pelo menos um em que encosta, e não pode criar nem aumentar um grupo com 2 hexágonos idênticos."),
          interpretation("a face-down expansion has no hexagon, so it only needs a free expansion area.", "uma expansão virada para baixo não tem hexágono, então só precisa de uma área de expansão livre."),
          t("Placing an expansion can complete the surroundings of a garden element and earn jokers, as for a tile.", "Colocar uma expansão pode completar o cerco de um elemento de jardim e render curingas, como uma peça.")
        ], [5])}
      </div>`;
  }

  // ---------- D · pass, scoring & next round ----------

  function passScoringSection() {
    return `
      ${sectionHeading("pass-scoring", t("D · Pass, scoring & next round", "D · Passar, pontuação e próxima rodada"), sectionIndex("pass-scoring"), [5])}
      <div class="quick-grid">
        ${infoCard(t("D · PASS", "D · PASSAR"), t("You may — or must — stop", "Você pode — ou deve — parar"), [
          rl("May", "pass when you no longer want to acquire or place hexagons.", "Pode", "passar quando não quiser mais adquirir nem colocar hexágonos."),
          rl("Must", "pass when you cannot perform action A, B or C.", "Deve", "passar quando não puder fazer a ação A, B nem C."),
          rl("Discard", "when you pass you may discard any number of hexagons from your storage; you lose points equal to their values (a bird −2, bellflowers −6…). This frees room for the next round.", "Descarte", "ao passar você pode descartar quantos hexágonos quiser do seu depósito; você perde pontos iguais aos valores deles (um pássaro −2, campânulas −6…). Isso libera espaço para a próxima rodada."),
          interpretation("discarded tiles go to the tower and expansions under the supply, as when paying; jokers are not hexagons and stay in your storage.", "peças descartadas vão para a torre e expansões para baixo da reserva, como num pagamento; curingas não são hexágonos e ficam no seu depósito."),
          rl("First to pass", `take the first player marker ${icon("first-player-marker", t("first player marker", "marcador de primeiro jogador"))} from the display area and move your scoring marker back 1 space. You will start the next round.`, "Primeiro a passar", `pegue o marcador de primeiro jogador ${icon("first-player-marker", "marcador de primeiro jogador")} da área de oferta e recue seu marcador de pontuação 1 casa. Você começará a próxima rodada.`),
          rl("After passing", "you take no more turns this phase; the others go on, skipping you. Phase 1 ends when everyone has passed.", "Depois de passar", "você não joga mais nesta fase; os outros continuam, pulando você. A fase 1 acaba quando todos passaram."),
          interpretation("no score drops below 0; points you cannot lose are ignored.", "nenhuma pontuação fica abaixo de 0; pontos que você não tem para perder são ignorados.")
        ], [5])}
        ${infoCard(t("PHASE 2 · SCORING", "FASE 2 · PONTUAÇÃO"), t(`4 times per game · ${sideLabel()}`, `4 vezes por partida · ${sideLabel()}`), [
          t("Starting with the first player (the holder of the first player marker), each player scores their garden in turn.", "Começando pelo primeiro jogador (quem tem o marcador de primeiro jogador), cada jogador pontua o seu jardim, um de cada vez."),
          rl("The wheel", "the rotary wheel indicates the 3 patterns or colors scored this round.", "A roda", "a roda giratória indica os 3 padrões ou cores pontuados nesta rodada."),
          rl("Matching hexagons", "for each hexagon in your garden matching an indicated pattern or color, score the number of points shown for it.", "Hexágonos que combinam", "para cada hexágono do seu jardim que combina com um padrão ou cor indicado, marque os pontos mostrados para ele."),
          interpretation(`the rulebook does not print these values; read them on the ${variant() ? "variant" : "standard"} side of the scoring board, next to the indicated patterns and colors.`, `o manual não imprime esses valores; leia-os no lado ${variant() ? "da variante" : "padrão"} do tabuleiro de pontuação, junto aos padrões e cores indicados.`),
          variant() ? rl("Variant", "patterns score differently on this side than in the normal game.", "Variante", "neste lado os padrões pontuam de forma diferente do jogo normal.") : null,
          rl("Twice", "the same hexagon can score for its pattern and for its color if both are indicated.", "Duas vezes", "o mesmo hexágono pode pontuar pelo padrão e pela cor, se os dois estiverem indicados."),
          rl(`${elementIcon(ELEMENTS[3])} Pavilions`, "then score 1 point for each visible pavilion in your garden.", `${elementIcon(ELEMENTS[3])} Pavilhões`, "depois marque 1 ponto para cada pavilhão visível no seu jardim."),
          interpretation("nothing can be placed on a pavilion, so every face-up expansion in your garden shows one visible pavilion; face-down expansions have none.", "nada pode ser colocado sobre um pavilhão, então cada expansão virada para cima no seu jardim mostra um pavilhão visível; expansões viradas para baixo não têm nenhum."),
          t("Phase 2 is over when every player has scored.", "A fase 2 termina quando todos pontuaram.")
        ], variant() ? [5, 6] : [5], "aqg-score-card")}
        ${infoCard(t("SCORING TRACK", "TRILHA DE PONTUAÇÃO"), t("It loops", "Ela dá voltas"), [
          t("The scoring track is continuous: when your marker passes the end, it carries on from the start.", "A trilha de pontuação é contínua: quando seu marcador passa do fim, continua do começo."),
          t(`Use the point tokens of your color ${icon("point-token", t("point tokens", "fichas de pontos"))} to keep track of your total.`, `Use as fichas de pontos da sua cor ${icon("point-token", "fichas de pontos")} para acompanhar o seu total.`),
          interpretation("the tokens in the picture are printed with multiples of 60 (60 and 180 are visible), so one lap of the track is 60 points: each time your marker completes a lap, show the token for the total of your completed laps. Your score is that token plus your marker's space.", "as fichas da figura têm múltiplos de 60 impressos (dá para ver 60 e 180), então uma volta da trilha vale 60 pontos: cada vez que seu marcador completa uma volta, mostre a ficha com o total das voltas completas. Sua pontuação é essa ficha mais a casa do marcador.")
        ], [2, 5])}
        ${infoCard(t("PHASE 3 · PREPARE THE NEXT ROUND", "FASE 3 · PREPARAR A PRÓXIMA RODADA"), t("After rounds 1, 2 and 3 only", "Só depois das rodadas 1, 2 e 3"), [
          rl("1 · Wheel", "turn the rotary wheel clockwise to its next position, indicated by the lines.", "1 · Roda", "gire a roda giratória em sentido horário até a próxima posição, indicada pelas linhas."),
          rl("2 · Tiles", "discard every tile still on the face-down expansions in the display area into the tower.", "2 · Peças", "descarte na torre todas as peças que ainda estão nas expansões viradas para baixo da área de oferta."),
          rl("3 · Expansions", "return every garden expansion still in the display area (the rest of the round stack included, and face-up ones) to the supply, face down.", "3 · Expansões", "devolva à reserva, viradas para baixo, todas as expansões de jardim que ainda estão na área de oferta (inclusive o resto da pilha de rodada e as viradas para cima)."),
          rl("4 · New stack", "place the next round stack in the display area and put exactly 4 tiles from the bag on its top.", "4 · Nova pilha", "ponha a pilha da próxima rodada na área de oferta e coloque exatamente 4 peças do saco no topo."),
          rl("5 · Start", "the owner of the first player marker places it in the display area near the new round stack and takes the first turn.", "5 · Início", "o dono do marcador de primeiro jogador o põe na área de oferta, perto da nova pilha, e faz o primeiro turno."),
          interpretation("the returned expansions go under the supply stack; all face-down sides are alike, so their order does not matter.", "as expansões devolvidas vão para baixo da pilha da reserva; todos os versos são iguais, então a ordem não importa.")
        ], [5])}
      </div>`;
  }

  // ---------- final ----------

  function finalSection() {
    return `
      ${sectionHeading("final", t("End of game & final scoring", "Fim da partida e pontuação final"), sectionIndex("final"), [6])}
      <p class="glossary-intro">${t(
        "The game ends after all players have passed in round 4. Score round 4's phase 2 as usual (there is no phase 3), then the final scoring.",
        "A partida termina depois que todos passaram na rodada 4. Faça a fase 2 da rodada 4 normalmente (não há fase 3) e depois a pontuação final."
      )} ${referenceLink(6)}</p>
      <div class="quick-grid">
        ${infoCard(t("STEP 1", "PASSO 1"), t("Empty your storage", "Esvazie o depósito"), [
          rl("Each joker", "+1 point.", "Cada curinga", "+1 ponto."),
          rl("Each tile or garden expansion", "minus the value of its pattern (tree −1, bird −2 … bellflowers −6).", "Cada peça ou expansão de jardim", "menos o valor do padrão (árvore −1, pássaro −2 … campânulas −6).")
        ], [6])}
        ${infoCard(t("STEP 2", "PASSO 2"), t("Walk the evaluation track", "Percorra a trilha de avaliação"), [
          t("Move the evaluation marker to the first step of the evaluation track (a blue hexagon). The track shows the 6 colors, then the 6 patterns.", "Mova o marcador de avaliação para o primeiro degrau da trilha de avaliação (um hexágono azul). A trilha mostra as 6 cores e depois os 6 padrões."),
          rl("Colors, top to bottom", allColors(), "Cores, de cima para baixo", allColors()),
          rl("Then patterns", allPatterns(), "Depois os padrões", allPatterns()),
          t("At each step, every player scores <strong>each group of at least 3 hexagons</strong> matching that color or pattern. There is no limit to how many groups a player scores per step.", "Em cada degrau, cada jogador pontua <strong>cada grupo de pelo menos 3 hexágonos</strong> daquela cor ou padrão. Não há limite de grupos pontuados por jogador em cada degrau."),
          rl("A group's points", "add up the value of each of its hexagons (values on the right side of the scoring board): a color group of tree, bird and butterfly = 1 + 2 + 3 = 6; a group of 4 butterflies = 3 + 3 + 3 + 3 = 12.", "Pontos de um grupo", "some o valor de cada hexágono dele (valores no lado direito do tabuleiro de pontuação): um grupo de cor com árvore, pássaro e borboleta = 1 + 2 + 3 = 6; um grupo de 4 borboletas = 3 + 3 + 3 + 3 = 12."),
          t("Groups of 2 hexagons score nothing.", "Grupos de 2 hexágonos não pontuam."),
          t("A hexagon can score twice: once in its color group, once in its pattern group.", "Um hexágono pode pontuar duas vezes: uma no grupo de cor, outra no grupo de padrão.")
        ], [6])}
        ${infoCard(t("STEP 3", "PASSO 3"), t(`Group bonus · ${sideLabel()}`, `Bônus de grupo · ${sideLabel()}`), [
          variant() ? icon("bonus-variant", t("variant bonus box", "quadro de bônus da variante")) : icon("bonus-standard", t("standard bonus box", "quadro de bônus padrão")),
          bonusLine(),
          t("The bonus is scored together with the group, at its step of the evaluation track.", "O bônus é marcado junto com o grupo, no degrau dele da trilha de avaliação.")
        ], [6], variant() ? "aqg-variant-card" : "")}
        ${infoCard(t("WINNER", "VENCEDOR"), t("Most points", "Mais pontos"), [
          t("At the end of the final scoring, whoever has the most points wins.", "No fim da pontuação final, quem tiver mais pontos vence."),
          rl("Tie", "the tied players share the victory.", "Empate", "os jogadores empatados dividem a vitória.")
        ], [6], "victory-card")}
      </div>`;
  }

  // ---------- iconography ----------

  function iconsSection() {
    const sideCards = variant()
      ? [
        iconCard("side-variant-icon", "Variant central icon", "The orange icon in the middle of the scoring board: this side is up for the Game Variant, with the wheel assembled on it.", "Ícone central da variante", "O ícone laranja no meio do tabuleiro de pontuação: este lado fica para cima na variante, com a roda montada nele.", 6),
        iconCard("board-variant", "Variant side of the scoring board", "The ring of 6 colors and 6 patterns around the wheel, with the orange center. Its phase-2 values differ from the standard side.", "Lado da variante do tabuleiro", "O anel com 6 cores e 6 padrões em volta da roda, com o centro laranja. Os valores da fase 2 são diferentes do lado padrão.", 6),
        iconCard("bonus-variant", "Variant group bonus", "The 6 colors and 6 patterns, then the bonuses for groups of 4, 5 and 6 hexagons in the final scoring.", "Bônus de grupo da variante", "As 6 cores e os 6 padrões e depois os bônus para grupos de 4, 5 e 6 hexágonos na pontuação final.", 6)
      ]
      : [
        iconCard("side-standard-icon", "Standard central icon", "The pale green icon in the middle of the scoring board: this side is up for the normal game.", "Ícone central padrão", "O ícone verde-claro no meio do tabuleiro de pontuação: este lado fica para cima no jogo normal.", 2),
        iconCard("bonus-standard", "Group-of-6 bonus", "Any color or pattern group of 6 hexagons earns +6 bonus points in the final scoring.", "Bônus do grupo de 6", "Qualquer grupo de cor ou padrão com 6 hexágonos ganha +6 pontos de bônus na pontuação final.", 6)
      ];
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), sectionIndex("icons"), [2, 3, 4, 5, 6])}
      <p class="glossary-intro">${t("Patterns, colors, components and garden elements, each cropped individually from the rulebook's pictures.", "Padrões, cores, componentes e elementos de jardim, cada um recortado individualmente das imagens do manual.")}</p>
      <h3 class="subhead">${t("The six patterns · value 1 to 6", "Os seis padrões · valor de 1 a 6")}</h3>
      <div class="icon-grid">
        ${PATTERNS.map((p) => iconCard(`pattern-${p.value}-${p.id}`, `${p.en} · ${p.value}`, `Drawn as ${p.cueEn}. Costs ${p.value} hexagon${p.value === 1 ? "" : "s"} to place, scores ${p.value} in a final group, −${p.value} if left in storage.${p.named ? "" : " This guide's name; the rulebook gives none."}`, `${p.pt} · ${p.value}`, `Desenhado como ${p.cuePt}. Custa ${p.value} hexágono${p.value === 1 ? "" : "s"} para colocar, vale ${p.value} num grupo final, −${p.value} se sobrar no depósito.${p.named ? "" : " Nome deste guia; o manual não dá nenhum."}`, 3)).join("")}
      </div>
      <h3 class="subhead">${t("The six colors · evaluation-track order", "As seis cores · ordem da trilha de avaliação")}</h3>
      <div class="icon-grid">
        ${COLORS.map((c, index) => iconCard(`color-${c.id}`, c.en, `${c.lookEn[0].toUpperCase()}${c.lookEn.slice(1)}. Step ${index + 1} of the evaluation track.${c.printedEn ? ` The rulebook calls it “${c.printedEn}”.` : " This guide's name; the rulebook gives none."}`, c.pt, `${c.lookPt[0].toUpperCase()}${c.lookPt.slice(1)}. Degrau ${index + 1} da trilha de avaliação.${c.printedEn ? ` O manual a chama de “${c.printedEn}”.` : " Nome deste guia; o manual não dá nenhum."}`, 6)).join("")}
      </div>
      <h3 class="subhead">${t("Cost and points", "Custo e pontos")}</h3>
      <div class="icon-grid">
        ${iconCard("cost-icon", "Cost", "A pattern's value as a cost: how many hexagons you discard (the placed one included) to place it.", "Custo", "O valor de um padrão como custo: quantos hexágonos você descarta (incluindo o colocado) para colocá-lo.", 3)}
        ${iconCard("points-icon", "Points", "A pattern's value as points: what each hexagon of that pattern scores in a final group.", "Pontos", "O valor de um padrão como pontos: quanto cada hexágono desse padrão vale num grupo final.", 3)}
      </div>
      <h3 class="subhead">${t("Garden elements · jokers for surrounding them", "Elementos de jardim · curingas por cercá-los")}</h3>
      <div class="icon-grid">
        ${iconCard("el-fountain", "Fountain · 1 joker", "In the center of your fountain board. Surround it completely: take 1 joker.", "Fonte · 1 curinga", "No centro do tabuleiro de fonte. Cerque-a completamente: pegue 1 curinga.", 5)}
        ${iconCard("el-statue", "Statue · 2 jokers", "On the points of your fountain board. Surround one completely: take 2 jokers.", "Estátua · 2 curingas", "Nas pontas do tabuleiro de fonte. Cerque uma completamente: pegue 2 curingas.", 5)}
        ${iconCard("el-bench", "Bench · 2 jokers", "On the points of your fountain board. Surround one completely: take 2 jokers.", "Banco · 2 curingas", "Nas pontas do tabuleiro de fonte. Cerque um completamente: pegue 2 curingas.", 5)}
        ${iconCard("el-pavilion", "Pavilion · 3 jokers", "In the center of a face-up garden expansion. Each one in your garden scores +1 point in every phase 2 (surrounding it does not hide it). Surround it completely: take 3 jokers.", "Pavilhão · 3 curingas", "No centro de uma expansão de jardim virada para cima. Cada um no seu jardim vale +1 ponto em toda fase 2 (cercá-lo não o esconde). Cerque-o completamente: pegue 3 curingas.", 5)}
      </div>
      <h3 class="subhead">${t("Components", "Componentes")}</h3>
      <div class="icon-grid">
        ${iconCard("round-stack", "Round stack (filled)", `${stackSize()} face-down garden expansions in this match; only the top one holds 4 tiles at a time.`, "Pilha de rodada (abastecida)", `${stackSize()} expansões de jardim viradas para baixo nesta partida; só a do topo tem 4 peças por vez.`, 3)}
        ${iconCard("round-stack-facedown", "Round stack (waiting)", "The stacks for rounds 2–4 wait above the scoring board; one comes into the display area in each phase 3.", "Pilha de rodada (esperando)", "As pilhas das rodadas 2–4 esperam acima do tabuleiro de pontuação; uma entra na área de oferta a cada fase 3.", 2)}
        ${iconCard("faceup-expansion", "Face-up garden expansion", "A pavilion, 1 printed hexagon and 5 free spaces. Acquired like a tile; placed by paying its hexagon's cost.", "Expansão de jardim virada para cima", "Um pavilhão, 1 hexágono impresso e 5 espaços livres. Adquirida como uma peça; colocada pagando o custo do hexágono dela.", 4)}
        ${iconCard("storage", "Storage", "12 small spaces for tiles and jokers above 2 large spaces for garden expansions (the picture shows its top part with 2 jokers and a tile).", "Depósito", "12 espaços pequenos para peças e curingas acima de 2 espaços grandes para expansões de jardim (a figura mostra a parte de cima, com 2 curingas e uma peça).", 6)}
        ${iconCard("joker", "Joker", "Replaces any hexagon in a payment except the one you place; +1 point if still in storage at the end. Never placed in the garden.", "Curinga", "Substitui qualquer hexágono num pagamento, exceto o que você coloca; +1 ponto se ainda estiver no depósito no fim. Nunca vai para o jardim.", 4)}
        ${iconCard("first-player-marker", "First player marker", "Waits in the display area; the first player to pass takes it (−1 point) and starts the next round.", "Marcador de primeiro jogador", "Fica na área de oferta; o primeiro a passar o pega (−1 ponto) e começa a próxima rodada.", 5)}
        ${iconCard("shield-token", "Shield token −6", "On top of the supply: a face-down expansion from there costs exactly 6 points.", "Ficha de escudo −6", "Em cima da reserva: uma expansão virada para baixo dali custa exatamente 6 pontos.", 2)}
        ${iconCard("bag", "Bag", `Holds the ${TILES} tiles. When it runs short, the tower's tiles go back into it.`, "Saco", `Guarda as ${TILES} peças. Quando falta peça, as da torre voltam para ele.`, 2)}
        ${iconCard("tower", "Tower", "Collects discarded tiles until the bag runs short.", "Torre", "Recolhe as peças descartadas até o saco ficar sem peças.", 2)}
        ${iconCard("point-token", "Point tokens", "Tokens in each player color, printed with multiples of 60 (the picture shows 60 and 180): they record the laps of your scoring marker.", "Fichas de pontos", "Fichas em cada cor de jogador, com múltiplos de 60 impressos (a figura mostra 60 e 180): registram as voltas do seu marcador de pontuação.", 2)}
      </div>
      <h3 class="subhead">${t(`Scoring board · ${sideLabel()}`, `Tabuleiro de pontuação · ${sideLabel()}`)}</h3>
      <div class="icon-grid">${sideCards.join("")}</div>`;
  }

  // ---------- examples ----------

  function examplesSection() {
    const examples = [
      [t("Michael acquires the blues", "Michael adquire os azuis"), [
        t("Round stack top: blue bird, yellow bird, blue butterfly, blue tree. Michael could take all blue hexagons, or all birds.", "Topo da pilha: pássaro azul, pássaro amarelo, borboleta azul, árvore azul. Michael poderia pegar todos os azuis ou todos os pássaros."),
        t("He takes the 3 blue tiles and puts them on empty spaces of his storage.", "Ele pega as 3 peças azuis e as põe em espaços vazios do depósito."),
        t("He took tiles from the round stack, so its top expansion moves beside the stack with the yellow bird still on it, and the new top gets 4 tiles from the bag.", "Ele pegou peças da pilha de rodada, então a expansão do topo vai para o lado da pilha com o pássaro amarelo ainda nela, e o novo topo recebe 4 peças do saco.")
      ], 4],
      [t("Ina and the two yellow birds", "Ina e os dois pássaros amarelos"), [
        t("New top: purple flower, yellow tree, dark green bird, yellow bird; beside the stack, the expansion holding a single yellow bird.", "Novo topo: flor roxa, árvore amarela, pássaro verde-escuro, pássaro amarelo; ao lado da pilha, a expansão com um único pássaro amarelo."),
        t("Ina selects birds. The two yellow birds are identical, so she takes only one — the one on the expansion beside the stack — plus the dark green bird.", "Ina escolhe pássaros. Os dois pássaros amarelos são idênticos, então ela pega só um — o da expansão ao lado da pilha — mais o pássaro verde-escuro."),
        t("The dark green bird came from the round stack: the top expansion moves aside (with its flower, tree and bird) and the stack is refilled.", "O pássaro verde-escuro veio da pilha de rodada: a expansão do topo vai para o lado (com a flor, a árvore e o pássaro) e a pilha é reabastecida."),
        t("The expansion she emptied is turned face up: it shows a light green tree and a pavilion. A later selection of trees or of light green includes it.", "A expansão que ela esvaziou é virada para cima: mostra uma árvore verde-clara e um pavilhão. Uma seleção futura de árvores ou de verde-claro a inclui.")
      ], 4],
      [t("Paying for a blue butterfly", "Pagar por uma borboleta azul"), [
        t("A butterfly costs 3: the blue butterfly plus 2 other hexagons from Michael's storage. Valid ways:", "Uma borboleta custa 3: a borboleta azul mais 2 outros hexágonos do depósito de Michael. Formas válidas:"),
        rl("Same pattern", "a purple butterfly and a yellow butterfly.", "Mesmo padrão", "uma borboleta roxa e uma borboleta amarela."),
        rl("Same color", "a blue leaves tile and a face-up expansion showing a blue hexagon of another pattern.", "Mesma cor", "uma peça de folhas azul e uma expansão virada para cima com um hexágono azul de outro padrão."),
        rl("Jokers", "2 jokers.", "Curingas", "2 curingas."),
        rl("Not allowed", "a second blue butterfly in the payment — identical hexagons.", "Proibido", "uma segunda borboleta azul no pagamento — hexágonos idênticos.")
      ], 4],
      [t("Where can it go?", "Onde ela pode ir?"), [
        t("A fountain board holds a purple leaves tile (right of the fountain) and a blue bird (lower left).", "Um tabuleiro de fonte tem uma peça de folhas roxa (à direita da fonte) e um pássaro azul (embaixo, à esquerda)."),
        rl("Purple butterfly", "allowed on the upper spaces (touching nothing, or the purple leaves) and on the lower right (touches the purple leaves); not on the left space, which touches only the blue bird.", "Borboleta roxa", "permitida nos espaços de cima (sem vizinho, ou ao lado das folhas roxas) e embaixo à direita (encosta nas folhas roxas); não no espaço da esquerda, que só encosta no pássaro azul."),
        rl("Yellow tree", "allowed only on the upper-left space, which touches no hexagon: every other free space touches only non-matching hexagons.", "Árvore amarela", "permitida só no espaço de cima à esquerda, que não encosta em hexágono nenhum: todos os outros espaços livres só encostam em hexágonos que não combinam.")
      ], 5],
      [t("Two purple birds may not meet", "Dois pássaros roxos não podem se encontrar"), [
        t("Purple leaves, a purple butterfly and a purple bird form a purple group on the fountain board. Next to it, a face-up expansion shows a purple tree.", "Folhas roxas, uma borboleta roxa e um pássaro roxo formam um grupo roxo no tabuleiro de fonte. Ao lado, uma expansão virada para cima mostra uma árvore roxa."),
        rl("A second purple bird", "cannot go next to the purple group (it would hold two purple birds), nor on the expansion space linking that group to the purple tree; it may go next to the purple tree alone.", "Um segundo pássaro roxo", "não pode ir ao lado do grupo roxo (ele ficaria com dois pássaros roxos) nem no espaço da expansão que liga esse grupo à árvore roxa; pode ir ao lado só da árvore roxa."),
        rl("Later, a purple flower", "may join the fountain group, but not the space that would link it to the tree-and-bird group: the merged group would hold both purple birds.", "Depois, uma flor roxa", "pode entrar no grupo da fonte, mas não no espaço que o ligaria ao grupo da árvore e do pássaro: o grupo unido ficaria com os dois pássaros roxos.")
      ], 5],
      [t("Placing garden expansions", "Colocar expansões de jardim"), [
        t("A face-up expansion showing a purple tree is placed beside the fountain board after paying a tree's cost (1: the expansion itself).", "Uma expansão virada para cima com uma árvore roxa é colocada ao lado do tabuleiro de fonte depois de pagar o custo de uma árvore (1: a própria expansão)."),
        t("A face-down expansion from the supply is placed the same way after spending 6 points.", "Uma expansão virada para baixo da reserva é colocada do mesmo jeito depois de gastar 6 pontos.")
      ], 5],
      [t("Michael's final scoring", "A pontuação final de Michael"), [
        rl("Storage", "2 jokers: 1 + 1 = +2; a blue flower tile: −4.", "Depósito", "2 curingas: 1 + 1 = +2; uma peça de flor azul: −4."),
        rl("Blue group", "1 + 2 + 3 + 6 = 12.", "Grupo azul", "1 + 2 + 3 + 6 = 12."),
        rl("Yellow group", "1 + 2 + 3 + 4 + 5 + 6 = 21, plus the group-of-6 bonus: +6.", "Grupo amarelo", "1 + 2 + 3 + 4 + 5 + 6 = 21, mais o bônus do grupo de 6: +6."),
        rl("Dark green group", "3 + 4 + 5 + 6 = 18.", "Grupo verde-escuro", "3 + 4 + 5 + 6 = 18."),
        rl("Trees", "1 + 1 + 1 + 1 + 1 = 5.", "Árvores", "1 + 1 + 1 + 1 + 1 = 5."),
        rl("Butterflies", "first group 3 + 3 + 3 = 9; second group 3 + 3 + 3 + 3 = 12.", "Borboletas", "primeiro grupo 3 + 3 + 3 = 9; segundo grupo 3 + 3 + 3 + 3 = 12."),
        rl("Not scored", "a dark green and a yellow leaves tile form a group of only 2.", "Não pontua", "uma peça de folhas verde-escura e uma amarela formam um grupo de só 2."),
        t("Total change, by this guide's sum: +81 points.", "Variação total, pela soma deste guia: +81 pontos."),
        variant() ? t("This example uses the standard side. On the variant side, replace the +6 with that side's bonuses and add them to every group of 4, 5 or 6 here: blue (4), yellow (6), dark green (4), trees (5) and the second butterfly group (4).", "Este exemplo usa o lado padrão. No lado da variante, troque os +6 pelos bônus desse lado e some-os a todo grupo de 4, 5 ou 6 daqui: azul (4), amarelo (6), verde-escuro (4), árvores (5) e o segundo grupo de borboletas (4).") : null
      ], 6]
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
      { term: ["Adjacent", "Adjacente"], en: "adjacent", text: ["Two spaces or hexagons sharing an edge.", "Dois espaços ou hexágonos que compartilham uma borda."], page: 5 },
      { term: ["Display area", "Área de oferta"], en: "display area", text: ["The middle of the table: the current round stack, the expansions moved beside it and the first player marker until someone passes.", "O meio da mesa: a pilha da rodada atual, as expansões movidas para o lado dela e o marcador de primeiro jogador até alguém passar."], page: 2 },
      { term: ["Evaluation track", "Trilha de avaliação"], en: "evaluation track", text: ["The column of 6 colors then 6 patterns on the scoring board, walked step by step in the final scoring.", "A coluna com 6 cores e depois 6 padrões no tabuleiro de pontuação, percorrida degrau a degrau na pontuação final."], page: 6 },
      { term: ["Face down / face up", "Virada para baixo / para cima"], en: "face down, face up", text: ["A garden expansion face down shows 7 empty spaces; face up it shows a pavilion, 1 hexagon and 5 spaces.", "Uma expansão de jardim virada para baixo mostra 7 espaços vazios; virada para cima mostra um pavilhão, 1 hexágono e 5 espaços."], page: 3 },
      { term: ["Free space", "Espaço livre"], en: "free space", text: ["A space of your garden with no hexagon and no garden element.", "Um espaço do seu jardim sem hexágono e sem elemento de jardim."], page: 5 },
      { term: ["Garden", "Jardim"], en: "garden", text: ["Your fountain board plus the garden expansions you have placed around it.", "Seu tabuleiro de fonte mais as expansões de jardim que você colocou em volta dele."], page: 2 },
      { term: ["Garden element", "Elemento de jardim"], en: "garden element", text: ["A fountain, statue, bench or pavilion: occupies a space, is not a hexagon, gives jokers when completely surrounded.", "Uma fonte, estátua, banco ou pavilhão: ocupa um espaço, não é hexágono e dá curingas quando completamente cercado."], page: 5 },
      { term: ["Garden expansion", "Expansão de jardim"], en: "garden expansion", text: ["A 7-space board piece: forms the round stacks and the supply, and adds 5 or 7 spaces to your garden.", "Uma peça de tabuleiro de 7 espaços: forma as pilhas de rodada e a reserva e acrescenta 5 ou 7 espaços ao seu jardim."], page: 2 },
      { term: ["Group", "Grupo"], en: "group", text: ["At least 2 adjacent hexagons sharing the same pattern (in different colors) or the same color (with different patterns); never 2 identical ones in it.", "Pelo menos 2 hexágonos adjacentes com o mesmo padrão (em cores diferentes) ou a mesma cor (com padrões diferentes); nunca 2 idênticos nele."], page: 5 },
      { term: ["Hexagon", "Hexágono"], en: "hexagon", text: ["Any pattern-and-color combination, on a tile or printed on a garden expansion.", "Qualquer combinação de padrão e cor, numa peça ou impressa numa expansão de jardim."], page: 3 },
      { term: ["Identical", "Idênticos"], en: "identical", text: ["Two hexagons with the same pattern and the same color.", "Dois hexágonos com o mesmo padrão e a mesma cor."], page: 3 },
      { term: ["Joker", "Curinga"], en: "joker", text: ["Gray token: replaces a hexagon in a payment (never the placed one); +1 point at the end.", "Ficha cinza: substitui um hexágono num pagamento (nunca o colocado); +1 ponto no fim."], page: 4 },
      { term: ["Pattern", "Padrão"], en: "pattern", text: ["The drawing on a hexagon: tree, bird, butterfly, flower, leaves or bellflowers, worth 1 to 6.", "O desenho de um hexágono: árvore, pássaro, borboleta, flor, folhas ou campânulas, que valem de 1 a 6."], page: 3 },
      { term: ["Round stack", "Pilha de rodada"], en: "round stack", text: [`${stackSize()} face-down garden expansions in this match; one stack per round.`, `${stackSize()} expansões de jardim viradas para baixo nesta partida; uma pilha por rodada.`], page: 2 },
      { term: ["Rotary wheel", "Roda giratória"], en: "rotary wheel", text: ["Turns on the scoring board; indicates the 3 patterns or colors scored in each phase 2.", "Gira no tabuleiro de pontuação; indica os 3 padrões ou cores pontuados em cada fase 2."], page: 5 },
      { term: ["Storage", "Depósito"], en: "storage", text: ["Your board for acquired hexagons: 12 small spaces (tiles, jokers), 2 large (expansions).", "Seu tabuleiro para hexágonos adquiridos: 12 espaços pequenos (peças, curingas), 2 grandes (expansões)."], page: 3 },
      { term: ["Supply", "Reserva"], en: "supply", text: ["The stack of face-down garden expansions under the shield token; one costs 6 points.", "A pilha de expansões de jardim viradas para baixo sob a ficha de escudo; uma custa 6 pontos."], page: 2 },
      { term: ["Tower", "Torre"], en: "tower", text: ["Holds discarded tiles; they go back into the bag when it runs short.", "Guarda as peças descartadas; elas voltam ao saco quando falta peça."], page: 4 },
      { term: ["Value", "Valor"], en: "value", text: ["A pattern's number, 1 to 6: its cost, its points in a group, and its penalty in storage.", "O número de um padrão, de 1 a 6: o custo, os pontos num grupo e a penalidade no depósito."], page: 3 }
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
    document.body.classList.add("theme-azul-queens-garden");
    document.documentElement.lang = state.language;
    document.title = t("Azul: Queen's Garden — Field Manual", "Azul: Queen's Garden — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Azul: Queen's Garden: 2–4 players, standard or variant scoring board, a match-filtered setup checklist, quick reference, the four actions, costs and placement, round and final scoring, iconography and the rulebook's examples.",
        "Regras interativas bilíngues de Azul: Queen's Garden: 2–4 jogadores, tabuleiro de pontuação padrão ou variante, lista de preparação filtrada, referência rápida, as quatro ações, custos e posicionamento, pontuação de rodada e final, iconografia e os exemplos do manual."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook · core game", "Livro interativo · jogo base")}</p>
          <h1>Azul: Queen's Garden</h1>
          <p class="hero-intro">${t(
            "King Manuel I has commissioned Portugal's finest garden designers to build the most extraordinary garden for his wife, Queen Maria of Aragon. Draft colorful hexagon tiles and arrange plants, trees and ornaments into patterns and colors to win the Queen's blessing.",
            "O rei D. Manuel I encomendou aos melhores jardineiros de Portugal o jardim mais extraordinário para sua esposa, a rainha Maria de Aragão. Escolha peças hexagonais coloridas e organize plantas, árvores e ornamentos em padrões e cores para conquistar a bênção da rainha."
          )}</p>
          <div class="hero-meta"><span>${t("2–4 players", "2–4 jogadores")}</span><span>${t("4 rounds", "4 rodadas")}</span><span>${t("Drafting · hexagon tile laying", "Seleção e colocação de hexágonos")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/azul-queens-garden.webp" alt="${t("Cover of the Azul: Queen's Garden rulebook: the ornate AZUL title and Queen's Garden over a ring of colored and cream hexagon tiles", "Capa do manual de Azul: Queen's Garden: o título ornamentado AZUL e Queen's Garden sobre um anel de peças hexagonais coloridas e creme")}" fetchpriority="high"><figcaption>${t("Rulebook cover · game by Michael Kiesling, Plan B Games", "Capa do manual · jogo de Michael Kiesling, Plan B Games")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("The garden", "O jardim")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column aqg-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied Azul: Queen's Garden rulebook (Plan B Games, 2021, English, 6 pages): the game for 2–4 players and its Game Variant. Points marked “Guide's reading” are interpretations where the rulebook is silent. Page links use the printed page numbers; the PDF puts the cover last, so printed pages 2–6 open PDF pages 1–5.",
            "Este guia cobre o manual fornecido de Azul: Queen's Garden (Plan B Games, 2021, em inglês, 6 páginas): o jogo para 2–4 jogadores e a sua variante. Pontos marcados como “Leitura do guia” são interpretações onde o manual é omisso. Os links usam a numeração impressa; o PDF põe a capa no fim, então as páginas impressas 2–6 abrem as páginas 1–5 do PDF."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${basicsSection()}</section>
          <section class="rule-section">${acquireSection()}</section>
          <section class="rule-section">${placeTileSection()}</section>
          <section class="rule-section">${expansionSection()}</section>
          <section class="rule-section">${passScoringSection()}</section>
          <section class="rule-section">${finalSection()}</section>
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the Azul: Queen's Garden rulebook. Game design: Michael Kiesling; illustration: Chris Quilliams; art direction: Sophie Gravel; development: Next Move. © 2021 Plan B Games Inc.",
        "Guia pessoal de consulta baseado no manual de Azul: Queen's Garden. Autor: Michael Kiesling; ilustração: Chris Quilliams; direção de arte: Sophie Gravel; desenvolvimento: Next Move. © 2021 Plan B Games Inc."
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
      root.querySelector(".aqg-page")?.prepend(notice);
    }
    notice.textContent = storageNoticeText();
  }

  function changePreference(patch) {
    const before = signature();
    state = normalizePreferences({ ...state, ...patch });
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

  window.AzulQueensGarden = { renderInto, onClick, onChange };
})();
