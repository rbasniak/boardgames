(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.wingspan.v1";
  const SETUP_KEY = "field-manual.wingspan.setup.v1";
  const MANUALS = {
    c: "wingspan_core.pdf",
    e: "wingspan_europe.pdf",
    o: "wingspan_oceania.pdf",
    a: "wingspan_asia.pdf",
    m: "wingspan_asia.pdf"
  };
  const ASSETS = "assets/wingspan/";
  const ICONS = `${ASSETS}icons/`;
  const ART = `${ASSETS}art/`;
  // Sources (printed page = PDF page unless noted):
  // "c" = Wingspan base rulebook (Stonemaier, 2019, 12 pp.). The base Appendix (bonus cards, goals, bird powers,
  //       quick-reference guide) and the base Automa rulebook are NOT supplied.
  // "e" = European Expansion rulebook (12 pp.; p. 11 Automa expansion rules).
  // "o" = Oceania Expansion rulebook (12 pp.).
  // "a" = Wingspan Asia rulebook (scanned, pp. 1–16 of the PDF; Duet in red boxes, Flock in blue boxes).
  // "m" = Asia-Automa rules, printed pp. 1–8 = PDF pp. 17–24 of the same Asia file (solo vs Automa, original
  //       end-of-round goals in green boxes, Duet mode in red boxes). The Asia Appendix is not in the file.
  const MODES = ["standard", "duet", "flock", "solo"];
  const YES_NO = ["no", "yes"];
  const SIDES = ["green", "blue"];
  const SOLO_GOALS = ["original", "duet"];
  const DIFFICULTIES = ["eaglet", "eagle", "eagle-eyed"];
  const AUTOMA_SCORING = ["cache", "hoard"];
  const defaults = {
    language: "pt-BR",
    base: "yes",
    europe: "no",
    oceania: "no",
    asia: "no",
    mode: "standard",
    players: 4,
    side: "green",
    soloGoals: "original",
    difficulty: "eagle",
    automa: "cache",
    swift: "no",
    ravens: "keep",
    beak: "include"
  };
  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------

  function yn(value, fallback) {
    return YES_NO.includes(value) ? value : fallback;
  }

  function modeAllowed(mode, s) {
    if (mode === "standard") {
      return s.base === "yes";
    }
    if (mode === "duet" || mode === "solo") {
      return s.asia === "yes";
    }
    return s.base === "yes" && s.asia === "yes";
  }

  function playerOptions(mode) {
    if (mode === "standard") {
      return [2, 3, 4, 5];
    }
    if (mode === "flock") {
      return [6, 7];
    }
    return mode === "duet" ? [2] : [1];
  }

  function normalizePreferences(saved) {
    const s = {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      base: yn(saved?.base, defaults.base),
      europe: yn(saved?.europe, defaults.europe),
      oceania: yn(saved?.oceania, defaults.oceania),
      asia: yn(saved?.asia, defaults.asia)
    };
    // A playable box is needed: the base game or the stand-alone Asia box.
    if (s.base === "no" && s.asia === "no") {
      s.base = "yes";
    }
    let mode = MODES.includes(saved?.mode) ? saved.mode : defaults.mode;
    if (!modeAllowed(mode, s)) {
      mode = s.base === "yes" ? "standard" : "duet";
    }
    s.mode = mode;
    const allowedPlayers = playerOptions(mode);
    let players = Number(saved?.players);
    if (!allowedPlayers.includes(players)) {
      players = allowedPlayers.includes(defaults.players) ? defaults.players : allowedPlayers[0];
    }
    s.players = players;
    s.side = SIDES.includes(saved?.side) ? saved.side : defaults.side;
    let soloGoals = SOLO_GOALS.includes(saved?.soloGoals) ? saved.soloGoals : defaults.soloGoals;
    if (soloGoals === "original" && s.base === "no") {
      soloGoals = "duet";
    }
    s.soloGoals = soloGoals;
    s.difficulty = DIFFICULTIES.includes(saved?.difficulty) ? saved.difficulty : defaults.difficulty;
    s.automa = AUTOMA_SCORING.includes(saved?.automa) ? saved.automa : defaults.automa;
    s.swift = yn(saved?.swift, defaults.swift);
    s.ravens = saved?.ravens === "remove" ? "remove" : "keep";
    s.beak = saved?.beak === "leave" ? "leave" : "include";
    return s;
  }

  // Only the choices that change the physical setup are part of the checklist signature.
  function signature(source = state) {
    const s = source;
    const parts = [`b${s.base}`, `e${s.europe}`, `o${s.oceania}`, `a${s.asia}`, s.mode, `p${s.players}`];
    if (s.mode === "standard" || (s.mode === "solo" && s.soloGoals === "original")) {
      parts.push(s.side);
    }
    if (s.mode === "solo") {
      parts.push(s.soloGoals);
    }
    if (s.mode === "duet") {
      parts.push(`sw${s.swift}`);
    }
    if (s.oceania === "yes" && s.base === "yes") {
      parts.push(`rv${s.ravens}`);
    }
    if (s.oceania === "yes" && (s.mode === "standard" || s.mode === "flock")) {
      parts.push(`bk${s.beak}`);
    }
    return parts.join("-");
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Wingspan preferences.", error);
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
      console.error("Could not read Wingspan setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Wingspan preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Wingspan setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function base() {
    return state.base === "yes";
  }

  function europe() {
    return state.europe === "yes";
  }

  function oceania() {
    return state.oceania === "yes";
  }

  function asia() {
    return state.asia === "yes";
  }

  function standard() {
    return state.mode === "standard";
  }

  function duet() {
    return state.mode === "duet";
  }

  function flock() {
    return state.mode === "flock";
  }

  function solo() {
    return state.mode === "solo";
  }

  function soloOriginal() {
    return solo() && state.soloGoals === "original";
  }

  function duetMap() {
    return duet() || (solo() && state.soloGoals === "duet");
  }

  function goalBoardSides() {
    return standard() || soloOriginal();
  }

  function roundEndPowers() {
    return europe() || asia();
  }

  function gameEndPowers() {
    return oceania() || asia();
  }

  function beakOption() {
    return oceania() && (standard() || flock());
  }

  function beakTiles() {
    return beakOption() && state.beak === "include";
  }

  function ravenOption() {
    return oceania() && base();
  }

  function manualUrl(code) {
    const script = document.querySelector('script[src*="wingspan.js"]');
    const baseUrl = script?.src || document.baseURI;
    const kind = code[0];
    let page = Number(code.slice(1));
    if (kind === "m") {
      page += 16;
    }
    return `${new URL(`manuals/${MANUALS[kind]}`, baseUrl).href}#page=${page}`;
  }

  // Page codes: c = base rulebook, e = Europe, o = Oceania, a = Asia rulebook, m = Asia-Automa rules (printed page).
  function referenceLink(code) {
    const page = code.slice(1);
    const labels = {
      c: t(`Base p. ${page} ↗`, `Base p. ${page} ↗`),
      e: t(`Europe p. ${page} ↗`, `Europa p. ${page} ↗`),
      o: t(`Oceania p. ${page} ↗`, `Oceania p. ${page} ↗`),
      a: t(`Asia p. ${page} ↗`, `Ásia p. ${page} ↗`),
      m: t(`Asia Automa p. ${page} ↗`, `Automa da Ásia p. ${page} ↗`)
    };
    return `<a class="source-link" href="${manualUrl(code)}" target="_blank" rel="noreferrer">${labels[code[0]]}</a>`;
  }

  function codeAvailable(code) {
    const kind = code[0];
    if (kind === "c") {
      return base();
    }
    if (kind === "e") {
      return europe();
    }
    if (kind === "o") {
      return oceania();
    }
    return asia();
  }

  function refs(codes) {
    return codes.filter(codeAvailable).map(referenceLink).join("");
  }

  function sectionHeading(id, title, codes) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("FIELD NOTEBOOK", "CADERNO DE CAMPO")} / ${sectionIndex(id)}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="ws-section-references">${refs(codes)}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
  }

  function infoCard(label, title, lines, codes, extraClass = "") {
    return `
      <article class="info-card ${extraClass}">
        <span class="component-label">${label}</span>
        <h3>${title}</h3>
        ${lineList(lines)}
        ${refs(codes)}
      </article>`;
  }

  function interpretation(en, pt) {
    return `<span class="ws-interpretation">${t("Guide's reading", "Leitura do guia")}:</span> ${t(en, pt)}`;
  }

  function glyph(file, alt) {
    return `<img class="ws-glyph" src="${ICONS}${file}.webp" alt="${alt}">`;
  }

  function playersLabel(players = state.players) {
    return players === 1 ? t("1 player + Automa", "1 jogador + Automa") : t(`${players} players`, `${players} jogadores`);
  }

  function modeName(mode = state.mode) {
    return {
      standard: t("Standard game", "Partida padrão"),
      duet: t("Duet (Asia)", "Dueto (Ásia)"),
      flock: t("Flock (Asia)", "Revoada (Ásia)"),
      solo: t("Solo vs Automa", "Solo contra a Automa")
    }[mode];
  }

  function sideName(side = state.side) {
    return side === "blue" ? t("blue side (1 point per item)", "lado azul (1 ponto por item)") : t("green side (majority)", "lado verde (maioria)");
  }

  function difficultyName(value = state.difficulty) {
    return {
      eaglet: t("Eaglet", "Filhote de águia (Eaglet)"),
      eagle: t("Eagle (normal)", "Águia (Eagle, normal)"),
      "eagle-eyed": t("Eagle-eyed Eagle", "Olhos de Águia (Eagle-eyed Eagle)")
    }[value];
  }

  function difficultyNumbers(value = state.difficulty) {
    return { eaglet: [5, 3], eagle: [4, 4], "eagle-eyed": [3, 5] }[value];
  }

  function boxesLabel() {
    return [base() ? t("Base", "Base") : "", europe() ? t("Europe", "Europa") : "", oceania() ? "Oceania" : "", asia() ? t("Asia", "Ásia") : ""].filter(Boolean).join(" + ");
  }

  function coreBox() {
    // Which box supplies mats, birdfeeder, tray and cubes for a 1–2 player table.
    return base() ? "base" : "asia";
  }

  // ---------- sections ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["overview", t("Rounds & turns", "Rodadas e turnos")],
      ["actions", t("The four actions", "As quatro ações")],
      ["powers", t("Bird powers", "Poderes das aves")],
      ...(oceania() ? [["nectar", t("Nectar (Oceania)", "Néctar (Oceania)")]] : []),
      ["round-end", t("End of round & goals", "Fim da rodada e objetivos")],
      ["game-end", t("Game end & scoring", "Fim de jogo e pontuação")],
      ...(duetMap() ? [["duet", t("Duet map", "Mapa do Dueto")]] : []),
      ...(flock() ? [["flock", t("Flock mode", "Modo Revoada")]] : []),
      ...(solo() ? [["solo", t("Automa (solo)", "Automa (solo)")]] : []),
      ...(europe() || oceania() || asia() ? [["expansions", t("Expansion notes", "Notas das expansões")]] : []),
      ["icons", t("Iconography", "Iconografia")],
      ["examples", t("Examples", "Exemplos")],
      ["faq", t("Guide's readings", "Leituras do guia")],
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
          <span class="brand-mark" aria-hidden="true">WS</span>
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

  function choiceCard(name, dataAttr, value, checked, title, description, disabled = false) {
    return `
      <label class="ws-choice-card ${checked ? "is-selected" : ""} ${disabled ? "is-disabled" : ""}">
        <input type="radio" name="${name}" value="${value}" data-${dataAttr}="${value}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}>
        <span class="ws-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function yesNoGroup(key, legend, intro, noTitle, noText, yesTitle, yesText, codes, disabledYes = false, disabledNo = false) {
    const on = state[key] === "yes";
    return `
      <fieldset class="ws-choice-group">
        <legend>${legend} · ${t("selected:", "selecionado:")} <span>${on ? t("Yes", "Sim") : t("No", "Não")}</span></legend>
        <p class="ws-choice-intro">${intro} ${codes.map(referenceLink).join("")}</p>
        <div class="ws-choice-grid">
          ${choiceCard(`ws-${key}`, key, "no", !on, noTitle, noText, disabledNo)}
          ${choiceCard(`ws-${key}`, key, "yes", on, yesTitle, yesText, disabledYes)}
        </div>
      </fieldset>`;
  }

  function modeText(mode) {
    return {
      standard: t("2–5 players with the base game's mats, birdfeeder dice tower, bird tray and goal board. Needs the base game.", "2–5 jogadores com os tabuleiros, a torre-comedouro, a bandeja de aves e o tabuleiro de objetivos do jogo base. Precisa do jogo base."),
      duet: t("Exactly 2 players with Asia's Duet map: every bird you play also claims a matching map space; Duet end-of-round goals reward only the leader; largest connected group of Duet tokens scores at the end. Needs Asia (the base game is optional).", "Exatamente 2 jogadores com o mapa do Dueto da Ásia: cada ave jogada também ocupa um espaço correspondente do mapa; os objetivos de rodada do Dueto premiam só quem lidera; o maior grupo conectado de fichas de Dueto pontua no fim. Precisa da Ásia (o jogo base é opcional)."),
      flock: t("6 or 7 players in two groups, each with its own bird tray and birdfeeder; two players take their turns at the same time (turn-order dial). About 2 hours the first time. Needs the base game and Asia.", "6 ou 7 jogadores em dois grupos, cada um com a própria bandeja de aves e comedouro; dois jogadores jogam ao mesmo tempo (disco de ordem de turno). Cerca de 2 horas na primeira vez. Precisa do jogo base e da Ásia."),
      solo: t("1 player against the Automa, an artificial opponent driven by its own deck. Uses the Asia-Automa rules and Asia's Automa cards (the only Automa rules supplied). Needs Asia.", "1 jogador contra a Automa, um oponente artificial guiado por um baralho próprio. Usa as regras Asia-Automa e as cartas de Automa da Ásia (as únicas regras de Automa fornecidas). Precisa da Ásia.")
    }[mode];
  }

  function matchConfiguration() {
    const modeOptions = MODES.map((mode) => {
      const allowed = modeAllowed(mode, state);
      const reason = allowed ? "" : ` <em>${t("Not available with the boxes selected above.", "Indisponível com as caixas selecionadas acima.")}</em>`;
      return choiceCard("ws-mode", "mode", mode, state.mode === mode, modeName(mode), `${modeText(mode)}${reason}`, !allowed);
    }).join("");
    const playerText = (n) => ({
      2: t("2 mats, 2 cube colours. On the green goal side only 1st and 2nd place can be reached.", "2 tabuleiros, 2 cores de cubos. No lado verde dos objetivos só 1º e 2º lugar são possíveis."),
      3: t("3 mats and cube colours.", "3 tabuleiros e cores de cubos."),
      4: t("4 mats and cube colours.", "4 tabuleiros e cores de cubos."),
      5: t("All 5 base mats and cube colours. On the green side 4th and 5th place score 0.", "Os 5 tabuleiros e cores de cubos da base. No lado verde 4º e 5º lugar marcam 0."),
      6: t("Two groups of 3 (3+3). Each group has its own tray and birdfeeder.", "Dois grupos de 3 (3+3). Cada grupo tem bandeja e comedouro próprios."),
      7: t("Groups of 3 and 4 (3+4). In rounds 2 and 4 one player takes a last turn alone; some turns of the 4-group are resolved one after the other.", "Grupos de 3 e 4 (3+4). Nas rodadas 2 e 4 um jogador faz um último turno sozinho; alguns turnos do grupo de 4 são resolvidos um depois do outro.")
    }[n]);
    const playersGroup = (standard() || flock()) ? `
        <fieldset class="ws-choice-group">
          <legend>${t("Players · selected:", "Jogadores · selecionado:")} <span>${playersLabel()}</span></legend>
          <p class="ws-choice-intro">${flock() ? t("Flock mode is for 6 or 7 players.", "O modo Revoada é para 6 ou 7 jogadores.") : t("The standard game is for 2–5 players (1 player = Solo mode).", "A partida padrão é para 2–5 jogadores (1 jogador = modo Solo).")} ${refs(["c1", "a3"])}</p>
          <div class="ws-choice-grid ws-choice-grid-4">
            ${playerOptions(state.mode).map((n) => choiceCard("ws-players", "players", n, state.players === n, playersLabel(n), playerText(n))).join("")}
          </div>
        </fieldset>` : "";
    const sideGroup = goalBoardSides() ? `
        <fieldset class="ws-choice-group">
          <legend>${t("Goal board side · selected:", "Lado do tabuleiro de objetivos · selecionado:")} <span>${sideName()}</span></legend>
          <p class="ws-choice-intro">${t("Decides how the 4 end-of-round goals score.", "Decide como os 4 objetivos de fim de rodada pontuam.")}${europe() ? ` ${t("Europe recommends the green side: some of its goals do not work well with the blue side.", "A Europa recomenda o lado verde: alguns objetivos dela não funcionam bem com o lado azul.")}` : ""} ${refs(["c2", "c11", "e2", "a15"])}</p>
          <div class="ws-choice-grid">
            ${choiceCard("ws-side", "side", "green", state.side === "green", t("Green — majority (default)", "Verde — maioria (padrão)"), t("1st, 2nd and 3rd place for each goal; more direct competition. Ties share the summed places, rounded down; you need at least 1 of the item to score.", "1º, 2º e 3º lugar em cada objetivo; competição mais direta. Empates dividem a soma das posições, arredondando para baixo; é preciso ter ao menos 1 do item para pontuar."))}
            ${choiceCard("ws-side", "side", "blue", state.side === "blue", t("Blue — 1 point per item", "Azul — 1 ponto por item"), t("Score 1 point per targeted item, maximum 5. Less competition; Asia recommends it for new players.", "Marque 1 ponto por item do objetivo, máximo 5. Menos competição; a Ásia o recomenda para iniciantes."))}
          </div>
        </fieldset>` : "";
    const soloGroups = solo() ? `
        <fieldset class="ws-choice-group">
          <legend>${t("Automa goals · selected:", "Objetivos da Automa · selecionado:")} <span>${state.soloGoals === "duet" ? t("Duet map", "Mapa do Dueto") : t("Original goals", "Objetivos originais")}</span></legend>
          <p class="ws-choice-intro">${t("The Automa plays either with the base game's goal board and tiles or with Asia's Duet map and Duet goal tiles.", "A Automa joga com o tabuleiro e as peças de objetivo do jogo base ou com o mapa do Dueto e as peças de objetivo do Dueto da Ásia.")} ${refs(["m1", "m2"])}</p>
          <div class="ws-choice-grid">
            ${choiceCard("ws-solo-goals", "solo-goals", "original", state.soloGoals === "original", t("Original end-of-round goals", "Objetivos de fim de rodada originais"), t("Base goal board and goal tiles; the Automa scores with the end-of-round goal scoring cards (a base value per goal) plus her cubes on the goal tile. Needs the base game, whose Automa scoring cards are not listed in the supplied base rulebook.", "Tabuleiro e peças de objetivo da base; a Automa pontua com as cartas de pontuação de objetivos (um valor base por objetivo) mais os cubos dela na peça. Precisa do jogo base, cujas cartas de pontuação da Automa não aparecem no livro base fornecido."), !base())}
            ${choiceCard("ws-solo-goals", "solo-goals", "duet", state.soloGoals === "duet", t("Duet map", "Mapa do Dueto"), t("Both of you place Duet tokens on the Duet map; the Automasian Alliance card joins the Automa deck; the “on edge of map / not on edge of map” goal tile is not used.", "Vocês dois põem fichas de Dueto no mapa do Dueto; a carta Automasian Alliance entra no baralho da Automa; a peça de objetivo “na borda do mapa / fora da borda do mapa” não é usada."))}
          </div>
        </fieldset>
        <fieldset class="ws-choice-group">
          <legend>${t("Automa difficulty · selected:", "Dificuldade da Automa · selecionado:")} <span>${difficultyName()}</span></legend>
          <p class="ws-choice-intro">${t("Changes only the Automa's final score; no setup change.", "Muda só a pontuação final da Automa; não muda a preparação.")} ${refs(["m6"])}</p>
          <div class="ws-choice-grid ws-choice-grid-3">
            ${choiceCard("ws-difficulty", "difficulty", "eaglet", state.difficulty === "eaglet", difficultyName("eaglet"), t("Game end: 1 egg per 5 of her tokens; face-down birds 3 points each.", "Fim de jogo: 1 ovo a cada 5 fichas dela; aves viradas para baixo 3 pontos cada."))}
            ${choiceCard("ws-difficulty", "difficulty", "eagle", state.difficulty === "eagle", difficultyName("eagle"), t("Game end: 1 egg per 4 tokens; face-down birds 4 points each.", "Fim de jogo: 1 ovo a cada 4 fichas; aves viradas para baixo 4 pontos cada."))}
            ${choiceCard("ws-difficulty", "difficulty", "eagle-eyed", state.difficulty === "eagle-eyed", difficultyName("eagle-eyed"), t("Game end: 1 egg per 3 tokens; face-down birds 5 points each.", "Fim de jogo: 1 ovo a cada 3 fichas; aves viradas para baixo 5 pontos cada."))}
          </div>
        </fieldset>
        <fieldset class="ws-choice-group">
          <legend>${t("Automa's tokens · selected:", "Fichas da Automa · selecionado:")} <span>${state.automa === "hoard" ? t("Automa's Hoard (variant)", "Tesouro da Automa (variante)") : t("Automa's Cache", "Esconderijo da Automa (Cache)")}</span></legend>
          <p class="ws-choice-intro">${t("How the Automa profits when your white or brown power gives something to other players. Food tokens stand for her tokens. No setup change.", "Como a Automa lucra quando o seu poder branco ou marrom dá algo aos outros jogadores. Fichas de comida representam as fichas dela. Não muda a preparação.")} ${refs(["m4", "m8"])}</p>
          <div class="ws-choice-grid">
            ${choiceCard("ws-automa", "automa", "cache", state.automa === "cache", t("Automa's Cache (standard)", "Esconderijo da Automa (padrão)"), t("She gets 2 tokens per thing she would gain, or 1 per thing if she would have to pay something to take part.", "Ela recebe 2 fichas por coisa que ganharia, ou 1 por coisa se tivesse de pagar algo para participar."))}
            ${choiceCard("ws-automa", "automa", "hoard", state.automa === "hoard", t("Automa's Hoard (variant)", "Tesouro da Automa (variante)"), t("A detailed price list: food/die 1 token, nectar 2, card 2, egg 3, bonus card 6, cache or tuck 3; she also loses tokens for what she would pay.", "Uma tabela detalhada: comida/dado 1 ficha, néctar 2, carta 2, ovo 3, carta de bônus 6, guardar ou enfiar 3; ela também perde fichas pelo que pagaria."))}
          </div>
        </fieldset>` : "";
    const swiftGroup = duet() ? `
        <fieldset class="ws-choice-group">
          <legend>${t("Duet Swift-Start · selected:", "Início rápido do Dueto · selecionado:")} <span>${state.swift === "yes" ? t("Yes", "Sim") : t("No", "Não")}</span></legend>
          <p class="ws-choice-intro">${t("Asia recommends the Swift-Start guides and cards for your first Duet game. The two guides are printed booklets (not supplied): this guide cannot repeat their contents.", "A Ásia recomenda os guias e cartas de início rápido para o primeiro Dueto. Os dois guias são livretos impressos (não fornecidos): este guia não pode repetir o conteúdo deles.")} ${refs(["a5"])}</p>
          <div class="ws-choice-grid">
            ${choiceCard("ws-swift", "swift", "no", state.swift !== "yes", t("No — normal start", "Não — início normal"), t("Deal 5 random birds, 2 bonus cards and 5 food; each player keeps 5 resources.", "Distribua 5 aves ao acaso, 2 cartas de bônus e 5 comidas; cada jogador fica com 5 recursos."))}
            ${choiceCard("ws-swift", "swift", "yes", state.swift === "yes", t("Yes — Swift-Start guides", "Sim — guias de início rápido"), t("The first player takes the Player A guide, the other the Player B guide. The guides say which cards and food each player starts with (6 Swift-Start cards with red corners) and walk you through the first turns.", "O primeiro jogador pega o guia Player A, o outro o guia Player B. Os guias dizem com quais cartas e comidas cada um começa (6 cartas de início rápido com cantos vermelhos) e conduzem os primeiros turnos."))}
          </div>
        </fieldset>` : "";
    const oceaniaGroups = `${ravenOption() ? `
        <fieldset class="ws-choice-group">
          <legend>${t("Chihuahuan Raven and Common Raven · selected:", "Corvo-de-chihuahua e Corvo-comum · selecionado:")} <span>${state.ravens === "remove" ? t("Removed", "Removidos") : t("Kept", "Mantidos")}</span></legend>
          <p class="ws-choice-intro">${t("With Oceania the wild-food symbol always includes nectar. If that makes these two base birds too strong for your table, Oceania lets you remove them.", "Com a Oceania o símbolo de comida curinga sempre inclui néctar. Se isso deixar essas duas aves da base fortes demais para a sua mesa, a Oceania permite removê-las.")} ${refs(["o2"])}</p>
          <div class="ws-choice-grid">
            ${choiceCard("ws-ravens", "ravens", "keep", state.ravens !== "remove", t("Keep them", "Manter"), t("Both ravens stay in the bird deck.", "Os dois corvos ficam no baralho de aves."))}
            ${choiceCard("ws-ravens", "ravens", "remove", state.ravens === "remove", t("Remove them", "Remover"), t("Take the Chihuahuan Raven and the Common Raven out of the bird deck before shuffling.", "Tire o Corvo-de-chihuahua (Chihuahuan Raven) e o Corvo-comum (Common Raven) do baralho de aves antes de embaralhar."))}
          </div>
        </fieldset>` : ""}${beakOption() ? `
        <fieldset class="ws-choice-group">
          <legend>${t("Beak-direction goal tile · selected:", "Peça de objetivo da direção do bico · selecionado:")} <span>${state.beak === "leave" ? t("Left out", "Fora") : t("Included", "Incluída")}</span></legend>
          <p class="ws-choice-intro">${t("Oceania's “beak pointing left/right” goal tile asks you to judge the art. If your table may disagree, leave it out.", "A peça de objetivo “bico apontando para a esquerda/direita” da Oceania pede para julgar a ilustração. Se a mesa puder discordar, deixe-a fora.")} ${refs(["o11"])}</p>
          <div class="ws-choice-grid">
            ${choiceCard("ws-beak", "beak", "include", state.beak !== "leave", t("Include it", "Incluir"), t("Shuffle it with the other goal tiles. Clarifications and the list of birds facing straight ahead are in End of round.", "Embaralhe com as outras peças de objetivo. Esclarecimentos e a lista de aves de frente estão em Fim da rodada."))}
            ${choiceCard("ws-beak", "beak", "leave", state.beak === "leave", t("Leave it out", "Deixar fora"), t("Return that tile to the box before shuffling the goal tiles.", "Devolva essa peça à caixa antes de embaralhar as peças de objetivo."))}
          </div>
        </fieldset>` : ""}`;
    return `
      <section class="controls-panel ws-config" id="build-match" aria-labelledby="ws-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="ws-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "First say which boxes you are playing with, then the mode. Only compatible choices can be selected. Changing a box, the mode, the player count, the goal-board side, the Automa goals, Swift-Start or an Oceania option clears the setup checklist; the Automa difficulty, the Automa's tokens and the language clear nothing.",
              "Diga primeiro com quais caixas vão jogar, depois o modo. Só escolhas compatíveis podem ser marcadas. Mudar uma caixa, o modo, o número de jogadores, o lado do tabuleiro de objetivos, os objetivos da Automa, o início rápido ou uma opção da Oceania limpa a lista da preparação; a dificuldade da Automa, as fichas da Automa e o idioma não limpam nada."
            )}</p>
          </div>
        </div>
        ${yesNoGroup("base", t("Base game (core box)", "Jogo base (caixa principal)"),
          t("Needed for the standard 2–5 player game and for Flock mode. Without it you can still play Asia alone (Duet or Solo).", "Necessário para a partida padrão de 2–5 jogadores e para o modo Revoada. Sem ele ainda dá para jogar só com a Ásia (Dueto ou Solo)."),
          t("No — no base box", "Não — sem a caixa base"), t("Only possible with Asia, which is stand-alone. The 170 base birds, 26 base bonus cards and the base goal board stay out.", "Só possível com a Ásia, que é independente. As 170 aves, 26 cartas de bônus e o tabuleiro de objetivos da base ficam de fora."),
          t("Yes — base game", "Sim — jogo base"), t("170 bird cards, 26 bonus cards, 5 player mats, birdfeeder dice tower, bird tray, goal board with 8 goal tiles, 40 cubes in 5 colours.", "170 cartas de aves, 26 cartas de bônus, 5 tabuleiros de jogador, torre-comedouro de dados, bandeja de aves, tabuleiro de objetivos com 8 peças, 40 cubos em 5 cores."),
          ["c1"], false, !asia())}
        ${yesNoGroup("europe", t("European Expansion", "Expansão Europeia"),
          t("Shuffled into the decks; adds teal “round end” powers.", "Embaralhada nos baralhos; acrescenta os poderes azul-petróleo de “fim de rodada”."),
          t("No", "Não"), t("No European birds, bonus cards or goal tiles.", "Sem aves, cartas de bônus ou peças de objetivo europeias."),
          t("Yes — add Europe", "Sim — acrescentar a Europa"), t("81 birds, 5 bonus cards, 5 goal tiles, 15 eggs, 38 food tokens and a reference tile join the game from the start. Teal round-end powers resolve before each goal is scored. With the Automa: 2 Automa-only bonus cards and 2 more goal scoring cards.", "81 aves, 5 cartas de bônus, 5 peças de objetivo, 15 ovos, 38 fichas de comida e uma peça de referência entram desde o início. Poderes azul-petróleo de fim de rodada são resolvidos antes de pontuar cada objetivo. Com a Automa: 2 cartas de bônus exclusivas da Automa e mais 2 cartas de pontuação de objetivo."),
          ["e1", "e2"])}
        ${yesNoGroup("oceania", t("Oceania Expansion", "Expansão Oceania"),
          t("Adds nectar, a wild sixth food that you lose at the end of each round unless spent.", "Acrescenta o néctar, uma sexta comida curinga que se perde no fim de cada rodada se não for gasta."),
          t("No", "Não"), t("Base food dice and base player mats.", "Dados de comida e tabuleiros de jogador da base."),
          t("Yes — add Oceania", "Sim — acrescentar a Oceania"), t("95 birds, 5 bonus cards, 4 goal tiles, 15 eggs, 69 nectar tokens. The 5 Oceania dice and player mats replace the base ones (new “reset” upgrades). Everyone starts with 1 nectar. Yellow “game end” powers. Spent nectar scores 5/2 points per habitat majority.", "95 aves, 5 cartas de bônus, 4 peças de objetivo, 15 ovos, 69 fichas de néctar. Os 5 dados e os tabuleiros da Oceania substituem os da base (novas melhorias de “reiniciar”). Todos começam com 1 néctar. Poderes amarelos de “fim de jogo”. Néctar gasto vale 5/2 pontos por maioria em cada habitat."),
          ["o1", "o2", "o3"])}
        ${yesNoGroup("asia", t("Wingspan Asia", "Wingspan Ásia"),
          t("A stand-alone box; its birds and bonus cards also mix into the other decks. It brings the Duet and Flock modes and the Automa rules used here.", "Uma caixa independente; as aves e cartas de bônus também se misturam aos outros baralhos. Traz os modos Dueto e Revoada e as regras da Automa usadas aqui."),
          t("No", "Não"), t("No Asian birds; Duet, Flock and Solo are unavailable.", "Sem aves asiáticas; Dueto, Revoada e Solo ficam indisponíveis."),
          t("Yes — add Asia", "Sim — acrescentar a Ásia"), t("90 birds, 14 bonus cards (3 updated versions of base cards), 30 eggs, 81 food, 5 dice, birdfeeder board, bird tray, 2 double-sided mats, 16 cubes in 2 colours, Duet map/Flock goal board, 6 Duet goal tiles, 30 Duet tokens, turn-order dial, Automa cards. With the base game, leave out the base Historian bonus card.", "90 aves, 14 cartas de bônus (3 versões atualizadas de cartas da base), 30 ovos, 81 comidas, 5 dados, tabuleiro-comedouro, bandeja de aves, 2 tabuleiros dupla face, 16 cubos em 2 cores, mapa do Dueto/tabuleiro de objetivos da Revoada, 6 peças de objetivo do Dueto, 30 fichas de Dueto, disco de ordem de turno, cartas da Automa. Com o jogo base, deixe fora a carta de bônus Historian da base."),
          ["a1", "a2"], false, !base())}
        <fieldset class="ws-choice-group">
          <legend>${t("Mode · selected:", "Modo · selecionado:")} <span>${modeName()}</span></legend>
          <p class="ws-choice-intro">${t("Duet, Flock and Solo come from Wingspan Asia.", "Dueto, Revoada e Solo vêm de Wingspan Ásia.")} ${refs(["c1", "a1", "a3", "m1"])}</p>
          <div class="ws-choice-grid ws-choice-grid-4">${modeOptions}</div>
        </fieldset>
        ${playersGroup}
        ${sideGroup}
        ${soloGroups}
        ${swiftGroup}
        ${oceaniaGroups}
        <p class="ws-config-summary"><strong>${t("This match:", "Esta partida:")}</strong> ${boxesLabel()} · ${modeName()} · ${playersLabel()}${goalBoardSides() ? ` · ${sideName()}` : ""}${solo() ? ` · ${state.soloGoals === "duet" ? t("Duet map", "Mapa do Dueto") : t("original goals", "objetivos originais")} · ${difficultyName()}` : ""}</p>
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function birdDeckLine() {
    const decks = [
      base() ? t("170 base birds", "170 aves da base") : "",
      europe() ? t("81 European birds (EE)", "81 aves europeias (EE)") : "",
      oceania() ? t("95 Oceania birds (OE)", "95 aves da Oceania (OE)") : "",
      asia() ? t("90 Asia birds (red “A” mark)", "90 aves da Ásia (marca vermelha “A”)") : ""
    ].filter(Boolean);
    if (decks.length === 1) {
      return t(`Shuffle the ${decks[0]} into one bird deck.`, `Embaralhe as ${decks[0]} num único baralho de aves.`);
    }
    return t(`Shuffle into one bird deck: ${decks.join(" + ")}. The expansion mark is in the bottom-right corner of each card.`, `Embaralhe num único baralho de aves: ${decks.join(" + ")}. A marca da expansão fica no canto inferior direito de cada carta.`);
  }

  function bonusDeckLines() {
    const lines = [];
    const decks = [
      base() ? t("26 base", "26 da base") : "",
      europe() ? t("5 European", "5 europeias") : "",
      oceania() ? t("5 Oceania", "5 da Oceania") : "",
      asia() ? t("14 Asia", "14 da Ásia") : ""
    ].filter(Boolean);
    lines.push(t(`Bonus cards: ${decks.join(" + ")}.`, `Cartas de bônus: ${decks.join(" + ")}.`));
    if (base() && asia()) {
      lines.push(flock()
        ? t("Remove the base Historian (Flock mode uses every bonus card except the Historian).", "Remova a Historian da base (a Revoada usa todas as cartas de bônus menos a Historian).")
        : t("Remove the base Historian: Asia has no birds named after people (Asia recommends leaving it out).", "Remova a Historian da base: a Ásia não tem aves com nomes de pessoas (a Ásia recomenda deixá-la fora)."));
      lines.push(t("Photographer, Cartographer and Anatomist exist in both boxes: keep Asia's versions (more detailed lists) and put the base originals back in the box.", "Photographer, Cartographer e Anatomist existem nas duas caixas: fique com as versões da Ásia (listas mais detalhadas) e devolva as originais da base à caixa."));
    }
    if (solo()) {
      lines.push(t("Keep the Automa-only bonus cards (2 from Asia" + (europe() ? ", 2 from Europe" : "") + ", separate from the regular bonus cards) apart: they never go in the bonus deck.", "Separe as cartas de bônus exclusivas da Automa (2 da Ásia" + (europe() ? ", 2 da Europa" : "") + ", separadas das cartas de bônus normais): elas nunca vão para o baralho de bônus."));
    }
    lines.push(t("Shuffle the bonus deck and put it face down on the table" + (flock() ? ", shared by both groups." : "."), "Embaralhe o baralho de bônus e deixe-o virado para baixo na mesa" + (flock() ? ", compartilhado pelos dois grupos." : ".")));
    return lines;
  }

  function supplyLine() {
    const food = [base() ? "103" : "", europe() ? "38" : "", asia() ? "81" : ""].filter(Boolean).join(" + ");
    const eggs = [base() ? "75" : "", europe() ? "15" : "", oceania() ? "15" : "", asia() ? "30" : ""].filter(Boolean).join(" + ");
    return t(
      `Supply: all food tokens (${food}${oceania() ? " + 69 nectar" : ""}) and all egg miniatures (${eggs}) within reach of everyone. Egg colour does not matter. Both are unlimited: use a substitute if one runs out.`,
      `Reserva: todas as fichas de comida (${food}${oceania() ? " + 69 de néctar" : ""}) e todos os ovos (${eggs}) ao alcance de todos. A cor do ovo não importa. Ambos são ilimitados: use um substituto se acabar.`
    );
  }

  function goalTilePool() {
    const parts = [base() ? t("8 base", "8 da base") : "", europe() ? t("5 European", "5 europeias") : "", oceania() && !soloOriginal() ? t(`${beakTiles() || !beakOption() ? 4 : 3} Oceania`, `${beakTiles() || !beakOption() ? 4 : 3} da Oceania`) : ""].filter(Boolean);
    return parts.join(" + ");
  }

  function playerMatLine(n) {
    if (flock()) {
      return oceania()
        ? t(`1 player mat each: the 5 Oceania mats plus the 2 Asia mats on their exterior (Oceania-style) section, ${n} in total.`, `1 tabuleiro para cada: os 5 da Oceania mais os 2 da Ásia na seção externa (estilo Oceania), ${n} no total.`)
        : t(`1 player mat each: the 5 base mats plus the 2 Asia mats on their inside section, ${n} in total.`, `1 tabuleiro para cada: os 5 da base mais os 2 da Ásia na seção interna, ${n} no total.`);
    }
    if (oceania()) {
      return coreBox() === "asia"
        ? interpretation("an Oceania player mat each (Oceania replaces the mats); the Asia mats' exterior section is the same Oceania layout and works too.", "um tabuleiro da Oceania para cada (a Oceania substitui os tabuleiros); a seção externa dos tabuleiros da Ásia tem o mesmo desenho e também serve.")
        : t("1 Oceania player mat each (they replace the base mats).", "1 tabuleiro da Oceania para cada (eles substituem os da base).");
    }
    return coreBox() === "asia"
      ? (solo() ? t("1 Asia player mat for you, inside section up (the exterior section is only for Oceania).", "1 tabuleiro da Ásia para você, seção interna para cima (a externa é só para a Oceania).") : t("1 Asia player mat each, inside section up (the exterior section is only for Oceania).", "1 tabuleiro da Ásia para cada, seção interna para cima (a externa é só para a Oceania)."))
      : (solo() ? t("1 base player mat for you.", "1 tabuleiro da base para você.") : t("1 base player mat each.", "1 tabuleiro da base para cada."));
  }

  function startingHandLines() {
    const lines = [
      t("Deal each player 2 random bonus cards, 5 random bird cards and 5 food tokens (1 each: invertebrate, seed, fish, fruit, rodent).", "Dê a cada jogador 2 cartas de bônus, 5 cartas de aves ao acaso e 5 fichas de comida (1 de cada: invertebrado, semente, peixe, fruta, roedor)."),
      t("Keep up to 5 birds; for each bird you keep, discard 1 of your food tokens (you keep 5 of the 10 resources, e.g. 2 birds + 3 food, or 4 birds + 1 food). Discarded birds go to the discard pile.", "Fique com até 5 aves; para cada ave que ficar, descarte 1 ficha de comida (você fica com 5 dos 10 recursos, ex.: 2 aves + 3 comidas, ou 4 aves + 1 comida). Aves descartadas vão para a pilha de descarte."),
      t("Keep 1 of your 2 bonus cards and discard the other. You may look at both while choosing birds (and vice versa).", "Fique com 1 das 2 cartas de bônus e descarte a outra. Pode olhar as duas enquanto escolhe as aves (e vice-versa)."),
      t("Tip: keep the food shown in the top-left of the birds you keep; brown powers that bring cards or food are strong early.", "Dica: fique com as comidas mostradas no canto superior esquerdo das aves que ficar; poderes marrons que trazem cartas ou comida são fortes no início."),
      oceania() ? t("Oceania: after choosing, every player gains 1 nectar (nectar is never among the 5 starting food).", "Oceania: depois de escolher, todo jogador ganha 1 néctar (o néctar nunca está entre as 5 comidas iniciais).") : "",
      t("Your hand may be public or private, as you like.", "A mão pode ficar pública ou privada, como preferir.")
    ];
    if (duet() && state.swift === "yes") {
      return [
        t("Swift-Start: do not deal birds, bonus cards or food. Give the first player the Player A guide and the other player the Player B guide.", "Início rápido: não distribua aves, bônus nem comida. Dê ao primeiro jogador o guia Player A e ao outro o guia Player B."),
        t("Each guide says which of the 6 Swift-Start cards (red corners) and which food that player starts with. Follow it; the guides also walk you through the first turns.", "Cada guia diz com quais das 6 cartas de início rápido (cantos vermelhos) e comidas o jogador começa. Siga-o; os guias também conduzem os primeiros turnos."),
        oceania() ? t("Oceania: each player also gains 1 nectar.", "Oceania: cada jogador também ganha 1 néctar.") : "",
        t("After learning, shuffle the Swift-Start cards back into their decks (they are marked so you can pull them out again).", "Depois de aprender, embaralhe as cartas de início rápido de volta nos baralhos (são marcadas para poder separá-las de novo).")
      ];
    }
    return lines;
  }

  function setupPhases() {
    const n = state.players;
    const phases = [];
    // 1. Decks.
    phases.push({
      id: "decks",
      title: flock() ? t("Bird decks and trays (one per group)", "Baralhos de aves e bandejas (um por grupo)") : t("Bird deck and bird tray", "Baralho de aves e bandeja"),
      codes: ["c2", "a2", "a3", "e2", "o1"],
      items: [
        ravenOption() && state.ravens === "remove" ? t("First take the Chihuahuan Raven and the Common Raven out of the base birds.", "Primeiro tire o Corvo-de-chihuahua (Chihuahuan Raven) e o Corvo-comum (Common Raven) das aves da base.") : "",
        birdDeckLine(),
        flock()
          ? t("Split the deck in half. Put each half next to a bird tray (base tray + Asia tray), one per group, and fill each tray with 3 face-up birds.", "Divida o baralho ao meio. Ponha cada metade ao lado de uma bandeja (bandeja da base + da Ásia), uma por grupo, e encha cada bandeja com 3 aves viradas para cima.")
          : t("Put the deck next to the bird tray and fill the tray with 3 face-up birds. Discards will form a face-up pile.", "Ponha o baralho ao lado da bandeja e encha a bandeja com 3 aves viradas para cima. Os descartes formam uma pilha virada para cima.")
      ]
    });
    phases.push({ id: "bonus", title: t("Bonus deck", "Baralho de bônus"), codes: ["c2", "a2", "a3", "a15", "a16", "e2", "o1"], items: bonusDeckLines() });
    phases.push({
      id: "supply",
      title: t("Supply and birdfeeder", "Reserva e comedouro"),
      codes: ["c2", "a2", "a3", "o1"],
      items: [
        supplyLine(),
        flock()
          ? (oceania()
            ? t("Two birdfeeders (base dice tower + Asia birdfeeder board), one per group. Each gets 2 Oceania (nectar) dice + 3 regular dice (base dice in the tower, Asia dice on the board); roll them in. The 5th Oceania die and the other 4 regular dice stay in the box.", "Dois comedouros (torre da base + tabuleiro-comedouro da Ásia), um por grupo. Cada um recebe 2 dados da Oceania (de néctar) + 3 dados normais (dados da base na torre, da Ásia no tabuleiro); role-os dentro. O 5º dado da Oceania e os outros 4 dados normais ficam na caixa.")
            : t("Two birdfeeders, one per group: the base dice tower with the 5 base dice and the Asia birdfeeder board with the 5 Asia dice. Roll the dice in.", "Dois comedouros, um por grupo: a torre da base com os 5 dados da base e o tabuleiro-comedouro da Ásia com os 5 dados da Ásia. Role os dados dentro."))
          : (coreBox() === "base"
            ? t(`Toss the 5 ${oceania() ? "Oceania food dice (they replace the base dice)" : "food dice"} into the birdfeeder dice tower.`, `Jogue os 5 ${oceania() ? "dados de comida da Oceania (eles substituem os da base)" : "dados de comida"} na torre-comedouro.`)
            : t(`Roll the 5 ${oceania() ? "Oceania food dice (they replace the regular dice)" : "food dice"} onto the Asia birdfeeder board.`, `Role os 5 ${oceania() ? "dados de comida da Oceania (eles substituem os normais)" : "dados de comida"} no tabuleiro-comedouro da Ásia.`)),
        europe() || oceania() ? t(`Put the ${[europe() ? "European" : "", oceania() ? "Oceania" : ""].filter(Boolean).join(" and ")} reference tile${europe() && oceania() ? "s" : ""} near ${duetMap() ? "the Duet map" : "the goal board"} (end-of-round steps).`, `Ponha a${europe() && oceania() ? "s" : ""} peça${europe() && oceania() ? "s" : ""} de referência ${[europe() ? "europeia" : "", oceania() ? "da Oceania" : ""].filter(Boolean).join(" e ")} perto ${duetMap() ? "do mapa do Dueto" : "do tabuleiro de objetivos"} (passos do fim de rodada).`) : ""
      ]
    });
    // Goals.
    if (duetMap()) {
      phases.push({
        id: "goals",
        title: t("Duet map and Duet goals", "Mapa do Dueto e objetivos do Dueto"),
        codes: ["a2", "m2"],
        items: [
          t("Put the Duet map on the table (Duet side up).", "Ponha o mapa do Dueto na mesa (lado do Dueto para cima)."),
          solo()
            ? t("Take the 6 Duet goal tiles (red corners), remove the one marked “on edge of map / not on edge of map”, shuffle the other 5 without looking and put 4 of them, random side up, in the 4 slots below the map.", "Pegue as 6 peças de objetivo do Dueto (cantos vermelhos), remova a marcada “na borda do mapa / fora da borda do mapa”, embaralhe as outras 5 sem olhar e ponha 4, com lado aleatório, nas 4 vagas abaixo do mapa.")
            : t("Shuffle the 6 Duet goal tiles (double-sided, red corners) without looking and put 4 at random in the 4 slots below the map. Return the others to the box.", "Embaralhe as 6 peças de objetivo do Dueto (dupla face, cantos vermelhos) sem olhar e ponha 4 ao acaso nas 4 vagas abaixo do mapa. Devolva as outras à caixa."),
          t("The standard goal board and goal tiles are not used.", "O tabuleiro de objetivos padrão e as peças de objetivo não são usados.")
        ]
      });
    } else {
      phases.push({
        id: "goals",
        title: flock() ? t("Flock goal board and goal tiles", "Tabuleiro de objetivos da Revoada e peças") : t("Goal board and goal tiles", "Tabuleiro de objetivos e peças"),
        codes: flock() ? ["a3"] : ["c2", "e2", "o11", "m2"],
        items: [
          flock()
            ? t("Put the Duet map board with its back side up: the Flock mode goal board (majority, friendly ties). One goal board for the whole table.", "Ponha o mapa do Dueto com o verso para cima: o tabuleiro de objetivos da Revoada (maioria, empates amigáveis). Um tabuleiro de objetivos para a mesa toda.")
            : t(`Put the goal board on the table, ${sideName()} up.`, `Ponha o tabuleiro de objetivos na mesa, ${sideName()} para cima.`),
          beakOption() && state.beak === "leave" ? t("Return Oceania's beak-pointing-left/right goal tile to the box.", "Devolva à caixa a peça de objetivo bico-para-a-esquerda/direita da Oceania.") : "",
          soloOriginal() && oceania() ? interpretation("leave the 4 Oceania goal tiles in the box: no Automa scoring card in the supplied material gives a base value for them.", "deixe as 4 peças de objetivo da Oceania na caixa: nenhuma carta de pontuação da Automa no material fornecido dá valor base para elas.") : "",
          t(`Shuffle the standard goal tiles (${goalTilePool()}; never the red-cornered Duet tiles) without looking — they are double-sided — and put 1, random side up, on each of the 4 blank spaces (rounds 1–4). Return the rest to the box.`, `Embaralhe as peças de objetivo padrão (${goalTilePool()}; nunca as do Dueto, de cantos vermelhos) sem olhar — são dupla face — e ponha 1, com lado aleatório, em cada um dos 4 espaços vazios (rodadas 1–4). Devolva o resto à caixa.`)
        ]
      });
    }
    if (flock()) {
      phases.push({
        id: "flock",
        title: t("Groups, seats and turn-order dial", "Grupos, lugares e disco de ordem de turno"),
        codes: ["a3"],
        items: [
          t(`Split the players into 2 fixed groups at the same table: ${n === 6 ? "3 + 3" : "3 + 4"}. Each group sits together on its own side of the table (as pictured on Asia p. 3) and uses only its own tray and birdfeeder.`, `Divida os jogadores em 2 grupos fixos na mesma mesa: ${n === 6 ? "3 + 3" : "3 + 4"}. Cada grupo senta junto no seu lado da mesa (como na figura da Ásia p. 3) e usa só a própria bandeja e comedouro.`),
          t(`Put the turn-order dial in the middle; make sure both of its pieces show the ${n}-player side.`, `Ponha o disco de ordem de turno no meio; confira se as duas peças mostram o lado de ${n} jogadores.`),
          t("Hand out the action-cube colours around the table in exactly the same order as the colours on the dial (players may sit to get a favourite colour).", "Distribua as cores de cubos ao redor da mesa exatamente na mesma ordem das cores do disco (os jogadores podem escolher o lugar pela cor favorita).")
        ]
      });
    }
    phases.push({
      id: "players",
      title: solo() ? t("Your player area", "Sua área de jogador") : t(`Player areas (×${n})`, `Áreas dos jogadores (×${n})`),
      codes: ["c2", "a2", "o1"],
      items: [
        playerMatLine(n),
        (solo() ? t("8 action cubes of one colour for you.", "8 cubos de ação de uma cor para você.") : t("8 action cubes of one colour each.", "8 cubos de ação de uma cor para cada.")),
        duetMap() ? t(`${solo() ? "You" : "Each player"}: put 1 Duet token of your colour on each of the 15 bird slots of your mat (15 tokens).`, `${solo() ? "Você" : "Cada jogador"}: ponha 1 ficha de Dueto da sua cor em cada um dos 15 espaços de ave do tabuleiro (15 fichas).`) : ""
      ]
    });
    phases.push({
      id: "hands",
      title: t("Starting birds, food and bonus card", "Aves, comida e carta de bônus iniciais"),
      codes: ["c2", "a2", "a5", "o1"],
      items: startingHandLines()
    });
    if (solo()) {
      const [tokens, points] = difficultyNumbers();
      phases.push({
        id: "automa",
        title: t("The Automa's area", "A área da Automa"),
        codes: ["m1", "m2", "e11"],
        items: [
          t("Leave a small area for the Automa: no mat, no hand, no food.", "Deixe uma pequena área para a Automa: sem tabuleiro, sem mão, sem comida."),
          t("Put the current-round tracker card in the centre of that area, oriented so “Round 1” shows in the banner at the top.", "Ponha a carta marcadora de rodada no centro dessa área, virada para mostrar “Round 1” no topo."),
          state.soloGoals === "duet" ? t("Put the Duet map tracker card immediately to its right, also with “Round 1” at the top. Give the Automa 15 Duet tokens of an unused colour.", "Ponha a carta marcadora do mapa do Dueto logo à direita, também com “Round 1” no topo. Dê à Automa 15 fichas de Dueto de uma cor não usada.") : "",
          state.soloGoals === "duet"
            ? t("Shuffle the 10 Automa cards with the Automasian Alliance card and place them face down to the right of the tracker cards: the Automa deck.", "Embaralhe as 10 cartas da Automa com a carta Automasian Alliance e ponha-as viradas para baixo à direita das marcadoras: o baralho da Automa.")
            : t("Shuffle the 10 Automa cards with at most 1 special Automa card you own (its text is on the card) and place them face down to the right of the tracker card: the Automa deck.", "Embaralhe as 10 cartas da Automa com no máximo 1 carta especial de Automa que tiver (o texto está na carta) e ponha-as viradas para baixo à direita da marcadora: o baralho da Automa."),
          interpretation("give the Automa a full set of 8 action cubes of an unused colour (the booklet gives no number); she uses them " + (state.soloGoals === "duet" ? "to mark the Duet goals." : "on the goal tiles and to mark the goals."), "dê à Automa um conjunto completo de 8 cubos de ação de uma cor não usada (o livreto não dá o número); ela os usa " + (state.soloGoals === "duet" ? "para marcar os objetivos do Dueto." : "nas peças de objetivo e para marcar os objetivos.")),
          t("Keep the 3 Automa summary cards at hand as a reminder.", "Deixe as 3 cartas-resumo da Automa à mão como lembrete."),
          t(`Automa bonus card: pick one of the Automa-only bonus cards at random${europe() ? " (2 from Asia + 2 from Europe; Europe notes that the Automubon Society special card hits harder together with them)" : ""}. Alternative: before you are dealt bonus cards, reveal bonus cards until one shows “(X% of cards)”, give it to the Automa and reshuffle the bonus deck (for Pellet Dissector she takes birds that can cache food).`, `Carta de bônus da Automa: escolha ao acaso uma das cartas de bônus exclusivas da Automa${europe() ? " (2 da Ásia + 2 da Europa; a Europa avisa que a carta especial Automubon Society pesa mais junto com elas)" : ""}. Alternativa: antes de receber as suas cartas de bônus, revele cartas de bônus até sair uma com “(X% of cards)”, dê-a à Automa e embaralhe de novo o baralho de bônus (com Pellet Dissector ela pega aves que podem guardar comida).`),
          soloOriginal() ? t("Put the end-of-round goal scoring card that matches the Round 1 goal tile beside the goal board, “Round 1” facing up.", "Ponha ao lado do tabuleiro de objetivos a carta de pontuação de objetivo que corresponde à peça da rodada 1, com “Round 1” para cima.") : "",
          t(`Difficulty ${difficultyName()}: at game end she converts every ${tokens} tokens into 1 egg and scores ${points} points per face-down bird.`, `Dificuldade ${difficultyName()}: no fim ela converte cada ${tokens} fichas em 1 ovo e marca ${points} pontos por ave virada para baixo.`)
        ]
      });
    }
    phases.push({
      id: "start",
      title: t("First player", "Primeiro jogador"),
      codes: ["c2", "a2", "a3", "m2"],
      items: [
        solo()
          ? t("You always take the first turn of each round; the Automa always takes the last.", "Você sempre faz o primeiro turno de cada rodada; a Automa sempre faz o último.")
          : t("Choose the first player at random and give them the first-player token.", "Sorteie o primeiro jogador e dê a ele o marcador de primeiro jogador."),
        flock() ? t("Rotate the turn-order dial so its star points to the player with the first-player token.", "Gire o disco de ordem de turno para que a estrela aponte para quem tem o marcador de primeiro jogador.") : ""
      ]
    });
    return phases;
  }

  function inventory() {
    const n = state.players;
    const cards = [
      infoCard(t("SHARED", "COMPARTILHADO"), boxesLabel(), [
        rl("Bird deck", `${[base() ? 170 : 0, europe() ? 81 : 0, oceania() ? 95 : 0, asia() ? 90 : 0].reduce((a, b) => a + b, 0) - (ravenOption() && state.ravens === "remove" ? 2 : 0)} cards${flock() ? ", split in 2" : ""}.`, "Baralho de aves", `${[base() ? 170 : 0, europe() ? 81 : 0, oceania() ? 95 : 0, asia() ? 90 : 0].reduce((a, b) => a + b, 0) - (ravenOption() && state.ravens === "remove" ? 2 : 0)} cartas${flock() ? ", dividido em 2" : ""}.`),
        rl("Bird tray", flock() ? "2 (base + Asia), 3 face-up birds each." : "1, 3 face-up birds.", "Bandeja de aves", flock() ? "2 (base + Ásia), 3 aves viradas para cima em cada." : "1, 3 aves viradas para cima."),
        rl("Birdfeeder", flock() ? "2 (base tower + Asia board), 5 dice each." : (coreBox() === "base" ? "base dice tower, 5 dice." : "Asia birdfeeder board, 5 dice."), "Comedouro", flock() ? "2 (torre da base + tabuleiro da Ásia), 5 dados cada." : (coreBox() === "base" ? "torre de dados da base, 5 dados." : "tabuleiro-comedouro da Ásia, 5 dados.")),
        oceania() ? rl("Oceania dice", flock() ? "2 nectar dice per birdfeeder." : "replace the regular dice.", "Dados da Oceania", flock() ? "2 dados de néctar por comedouro." : "substituem os dados normais.") : "",
        rl("Goals", duetMap() ? (solo() ? "Duet map + 4 of 5 Duet goal tiles." : "Duet map + 4 of 6 Duet goal tiles.") : (flock() ? "Flock goal board + 4 standard goal tiles." : `goal board (${state.side}) + 4 goal tiles.`), "Objetivos", duetMap() ? (solo() ? "mapa do Dueto + 4 de 5 peças do Dueto." : "mapa do Dueto + 4 de 6 peças do Dueto.") : (flock() ? "tabuleiro da Revoada + 4 peças padrão." : `tabuleiro de objetivos (${state.side === "blue" ? "azul" : "verde"}) + 4 peças.`)),
        solo() ? "" : rl("First-player token", "1.", "Marcador de primeiro jogador", "1."),
        flock() ? rl("Turn-order dial", `${n}-player side.`, "Disco de ordem de turno", `lado de ${n} jogadores.`) : "",
        rl("Scorepad", "1.", "Bloco de pontos", "1.")
      ], ["c1", "e1", "o1", "a1"]),
      infoCard(t("PER PLAYER", "POR JOGADOR"), solo() ? t("You", "Você") : t(`${n} sets`, `${n} conjuntos`), [
        rl("Player mat", oceania() ? "Oceania layout." : (coreBox() === "base" || flock() ? "base layout." : "Asia, inside section."), "Tabuleiro", oceania() ? "desenho da Oceania." : (coreBox() === "base" || flock() ? "desenho da base." : "Ásia, seção interna.")),
        rl("Action cubes", "8 of one colour.", "Cubos de ação", "8 de uma cor."),
        rl("Dealt", "2 bonus cards, 5 birds, 5 food (1 of each type).", "Recebe", "2 cartas de bônus, 5 aves, 5 comidas (1 de cada tipo)."),
        rl("Kept", "1 bonus card + 5 resources (birds and food).", "Fica com", "1 carta de bônus + 5 recursos (aves e comidas)."),
        oceania() ? rl("Nectar", "1 after choosing.", "Néctar", "1 depois de escolher.") : "",
        duetMap() ? rl("Duet tokens", "15 on the mat's bird slots.", "Fichas de Dueto", "15 nos espaços de ave do tabuleiro.") : ""
      ], ["c2", "a2"]),
      ...(solo() ? [infoCard(t("AUTOMA", "AUTOMA"), difficultyName(), [
        rl("Tracker cards", state.soloGoals === "duet" ? "current round + Duet map tracker." : "current round.", "Cartas marcadoras", state.soloGoals === "duet" ? "rodada atual + marcadora do mapa do Dueto." : "rodada atual."),
        rl("Automa deck", state.soloGoals === "duet" ? "10 Automa cards + Automasian Alliance." : "10 Automa cards (+ at most 1 special card).", "Baralho da Automa", state.soloGoals === "duet" ? "10 cartas + Automasian Alliance." : "10 cartas (+ no máximo 1 carta especial)."),
        rl("Cubes", "an unused colour.", "Cubos", "uma cor não usada."),
        rl("Bonus card", "1 Automa-only card (or an “X% of cards” card).", "Carta de bônus", "1 exclusiva da Automa (ou uma “X% of cards”)."),
        soloOriginal() ? rl("Scoring cards", `round 1 card beside the goal board${europe() ? " (Europe adds 2 for its goal tiles)" : ""}.`, "Cartas de pontuação", `carta da rodada 1 ao lado do tabuleiro${europe() ? " (a Europa traz 2 para as peças dela)" : ""}.`) : "",
        state.soloGoals === "duet" ? rl("Duet tokens", "15 of an unused colour.", "Fichas de Dueto", "15 de uma cor não usada.") : "",
        rl("Reference", "3 Automa summary cards.", "Referência", "3 cartas-resumo da Automa.")
      ], ["m1", "m2"])] : [])
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
          <div class="setup-phase-references">${refs(phase.codes)}</div>
        </header>
        <label class="ws-setup-check" for="ws-setup-${phase.id}">
          <input id="ws-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="ws-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="ws-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");
    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), ["c2", "e2", "o1", "a2", "a3", "m2"])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${modeName()} · ${playersLabel()} · ${boxesLabel()}</h3>
            <p>${t("One checkbox per coherent step, in the rulebooks' order.", "Uma caixa por etapa coerente, na ordem dos livros.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved on this device separately from the match options. Changing a choice that changes the setup clears it; the language, Automa difficulty and Automa's tokens do not. “Uncheck all” clears only these setup boxes.",
          "O progresso é salvo neste aparelho separado das opções da partida. Mudar uma escolha que altera a preparação o limpa; o idioma, a dificuldade e as fichas da Automa não. “Desmarcar tudo” limpa somente estas caixas da preparação."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      ${duetMap() ? `<figure class="ws-art"><img src="${ART}duet-map.webp" alt="${t("The Duet map with the 4 Duet goal slots below it", "O mapa do Dueto com as 4 vagas de objetivo do Dueto abaixo")}" loading="lazy"><figcaption>${t("The Duet map (Asia p. 10): forest, wetland and grassland regions; reset space at bottom left.", "O mapa do Dueto (Ásia p. 10): regiões de floresta, pântano e campo; espaço de reinício embaixo à esquerda.")}</figcaption></figure>` : ""}
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}`;
  }

  // ---------- quick reference ----------

  function roundEndLines() {
    const steps = [
      roundEndPowers() ? ["Round-end powers (teal)", "in player order from this round's first player; your own in any order. They never trigger pink powers.", "Poderes de fim de rodada (azul-petróleo)", "na ordem dos jogadores a partir do primeiro desta rodada; os seus em qualquer ordem. Nunca ativam poderes rosa."] : null,
      oceania() ? ["Nectar", "discard unspent nectar from your personal supply to the general supply (so it never counts for goals or the tie-break).", "Néctar", "descarte o néctar não gasto da sua reserva pessoal para a reserva geral (então ele nunca conta para objetivos nem para o desempate)."] : null,
      ["Score the goal", (duetMap() ? "Duet goal: the leader puts a cube above the tile and takes those points; second puts a cube below it for 0." : (flock() ? "Flock board, friendly ties; each player marks with 1 of their action cubes." : (state.side === "blue" ? "1 per item, max 5; each player marks with 1 of their action cubes (on 0 too)." : "rank 1st/2nd/3rd; each player marks with 1 of their action cubes (on 0 too)."))) + " That cube stays there for the rest of the game.", "Pontue o objetivo", (duetMap() ? "objetivo do Dueto: quem lidera põe um cubo acima da peça e leva esses pontos; o segundo põe um cubo abaixo dela e marca 0." : (flock() ? "tabuleiro da Revoada, empates amigáveis; cada jogador marca com 1 dos seus cubos de ação." : (state.side === "blue" ? "1 por item, máx. 5; cada jogador marca com 1 dos seus cubos de ação (até no 0)." : "classifique 1º/2º/3º; cada jogador marca com 1 dos seus cubos de ação (até no 0)."))) + " Esse cubo fica ali pelo resto do jogo."],
      ["Round 4 only", `${gameEndPowers() ? "game-end (yellow) powers, then " : ""}final scoring — the game ends here; skip the steps below.`, "Só na rodada 4", `${gameEndPowers() ? "poderes de fim de jogo (amarelos), depois " : ""}contagem final — o jogo acaba aqui; pule os passos abaixo.`],
      ["Clean up", flock() ? "take all remaining action cubes off your player mat (goal cubes stay); in BOTH bird trays discard the face-up birds and deal 3 new ones from that tray's deck." : "take all remaining action cubes off your player mat (goal cubes stay); discard the face-up birds in the tray and deal 3 new ones.", "Limpeza", flock() ? "tire os cubos de ação restantes do seu tabuleiro de jogador (os cubos do objetivo ficam); nas DUAS bandejas descarte as aves viradas para cima e ponha 3 novas do baralho daquela bandeja." : "tire os cubos de ação restantes do seu tabuleiro de jogador (os cubos do objetivo ficam); descarte as aves viradas para cima da bandeja e ponha 3 novas."],
      ["First player", duet() ? "token to whoever came second on the goal (tie: to the player who did not have it)." : (flock() ? "token to the left; turn the dial so the star points to them." : (solo() ? "no token: you start every round. Adjust the Automa deck (Automa section)." : "token passes clockwise to the next player.")), "Primeiro jogador", duet() ? "marcador para quem ficou em segundo no objetivo (empate: para quem não o tinha)." : (flock() ? "marcador para a esquerda; gire o disco para a estrela apontar para ele." : (solo() ? "sem marcador: você começa toda rodada. Ajuste o baralho da Automa (seção Automa)." : "o marcador passa em sentido horário para o próximo jogador."))]
    ].filter(Boolean);
    return steps.map(([le, be, lp, bp], index) => rl(`${index + 1} · ${le}`, be, `${index + 1} · ${lp}`, bp));
  }

  function quickReference() {
    const cards = [
      infoCard(t("EACH ROUND", "CADA RODADA"), t("4 rounds, 1 action per turn", "4 rodadas, 1 ação por turno"), [
        rl("Turns", (flock() ? "in the order set by the turn-order dial (see Flock below)" : "clockwise") + " until everyone has placed all their cubes: 8, 7, 6, 5 turns in rounds 1–4 (one cube per round goes to the goal).", "Turnos", (flock() ? "na ordem dada pelo disco de ordem de turno (veja Revoada abaixo)" : "em sentido horário") + " até todos porem todos os cubos: 8, 7, 6, 5 turnos nas rodadas 1–4 (um cubo por rodada vai para o objetivo)."),
        oceania() && !duetMap() ? rl("“No goal” tile", "no scoring that round; keep your cube: every following round has 1 more turn.", "Peça “sem objetivo”", "nada é pontuado nessa rodada; fique com o cubo: cada rodada seguinte tem 1 turno a mais.") : "",
        flock() ? rl("Flock", "the 2 players the dial points to play at the same time; turn the dial only when both say they are done.", "Revoada", "os 2 jogadores apontados pelo disco jogam ao mesmo tempo; gire o disco só quando os dois disserem que terminaram.") : "",
        solo() ? rl("Solo", "you, then the Automa, alternately; you go first and she goes last each round.", "Solo", "você e a Automa alternadamente; você começa e ela termina cada rodada.") : "",
        `${glyph("action-play-bird", t("Play a bird", "Jogar uma ave"))} ${rl("Play a bird", "from your hand.", "Jogar uma ave", "da mão.")}`,
        `${glyph("action-gain-food", t("Forest", "Floresta"))} ${rl("Gain food", "and activate forest birds.", "Ganhar comida", "e ativar aves da floresta.")}`,
        `${glyph("action-lay-eggs", t("Grassland", "Campo"))} ${rl("Lay eggs", "and activate grassland birds.", "Pôr ovos", "e ativar aves do campo.")}`,
        `${glyph("action-draw-cards", t("Wetland", "Pântano"))} ${rl("Draw bird cards", "and activate wetland birds.", "Comprar cartas de aves", "e ativar aves do pântano.")}`
      ], ["c4", "c5", "a4"]),
      infoCard(t("PLAY A BIRD", "JOGAR UMA AVE"), t("Pay, place, white power", "Pague, posicione, poder branco"), [
        rl("Cube", "on the Play a Bird spot above the column the bird will go to (the leftmost empty slot of its habitat row).", "Cubo", "no espaço Jogar uma Ave acima da coluna onde a ave vai entrar (o espaço vazio mais à esquerda da fileira do habitat)."),
        rl("Egg cost", "column 1 free; columns 2–3 discard 1 egg; columns 4–5 discard 2 eggs (from any of your birds).", "Custo em ovos", "coluna 1 grátis; colunas 2–3 descarte 1 ovo; colunas 4–5 descarte 2 ovos (de quaisquer aves suas)."),
        rl("Food cost", `top-left of the card, from food next to your mat (never cached food). “/” = or; wild = any food; crossed circle = free. Any 2 food may pay as 1 (only when playing a bird)${oceania() ? "; nectar is wild here and goes to the spent-nectar space of that habitat" : ""}.`, "Custo em comida", `canto superior esquerdo da carta, com comida ao lado do tabuleiro (nunca comida guardada). “/” = ou; curinga = qualquer comida; círculo riscado = grátis. Quaisquer 2 comidas pagam como 1 (só ao jogar ave)${oceania() ? "; o néctar é curinga aqui e vai para o espaço de néctar gasto desse habitat" : ""}.`),
        rl("Habitat", "one shown on the card; max 5 birds per row.", "Habitat", "um dos mostrados na carta; máx. 5 aves por fileira."),
        rl("Power", "only a white “WHEN PLAYED” power is used now; the row is not activated.", "Poder", "só um poder branco “WHEN PLAYED” é usado agora; a fileira não é ativada."),
        duetMap() ? rl("Duet", "move the Duet token from that mat slot onto a matching free space of the Duet map.", "Dueto", "mova a ficha de Dueto daquele espaço do tabuleiro para um espaço livre correspondente do mapa.") : ""
      ], ["c6", "a6", "o2"]),
      infoCard(t("FOREST · EGGS · WETLAND", "FLORESTA · OVOS · PÂNTANO"), t("Same 3 steps", "Os mesmos 3 passos"), [
        rl("1 · Cube", "on the leftmost exposed slot of the row; take that slot's benefit (food dice / eggs / cards shown).", "1 · Cubo", "no espaço exposto mais à esquerda da fileira; pegue o benefício dele (dados de comida / ovos / cartas mostrados)."),
        rl("Bonus conversion", "if the slot shows one, at most once: discard 1 card → +1 food; pay 1 food → +1 egg; discard 1 egg → +1 card. Optional.", "Conversão bônus", "se o espaço mostrar, no máximo uma vez: descarte 1 carta → +1 comida; pague 1 comida → +1 ovo; descarte 1 ovo → +1 carta. Opcional."),
        oceania() ? rl("Reset (Oceania, columns 2 and 4)", "forest: discard 1 food to reset the birdfeeder; wetland: discard 1 food to reset the bird tray — done before taking food/cards.", "Reiniciar (Oceania, colunas 2 e 4)", "floresta: descarte 1 comida para reiniciar o comedouro; pântano: descarte 1 comida para reiniciar a bandeja — antes de pegar comida/cartas.") : "",
        rl("2 · Activate", "move the cube right to left: each brown “WHEN ACTIVATED” power in that row, optional.", "2 · Ativar", "mova o cubo da direita para a esquerda: cada poder marrom “WHEN ACTIVATED” dessa fileira, opcional."),
        rl("3 · End", "leave the cube at the far left of the row (it stays until round end).", "3 · Fim", "deixe o cubo na ponta esquerda da fileira (ele fica até o fim da rodada)."),
        rl("Food", "1 token per die you take; a two-food face gives 1 of either. All dice left in it show one face (or only 1 die is left): you may throw all 5 dice — including those already taken out — back in before gaining. Empty feeder: throw all 5 back in.", "Comida", "1 ficha por dado retirado; face com duas comidas dá 1 das duas. Todos os dados que restam com a mesma face (ou só 1 dado): pode jogar os 5 dados — inclusive os já retirados — de volta antes de ganhar. Comedouro vazio: jogue os 5 de volta."),
        rl("Eggs", "any of your birds, up to each bird's egg limit; excess is lost.", "Ovos", "em quaisquer aves suas, até o limite de ovos de cada; o excesso se perde."),
        rl("Cards", "from the 3 face-up birds and/or the deck top; refill the tray at the end of your turn; no hand limit.", "Cartas", "das 3 aves viradas para cima e/ou do topo do baralho; reponha a bandeja no fim do turno; sem limite de mão.")
      ], ["c7", "c8", "c9", "a7", "a8", "a9", "o3"]),
      infoCard(t("POWER COLOURS", "CORES DOS PODERES"), t("All optional", "Todos opcionais"), [
        rl("Brown · When activated", "each time you use that habitat's action, right to left.", "Marrom · Quando ativado", "toda vez que usa a ação desse habitat, da direita para a esquerda."),
        rl("Pink · Once between turns", "on other players' turns when their action triggers it; once between your own turns.", "Rosa · Uma vez entre turnos", "nos turnos dos outros quando a ação deles o dispara; uma vez entre os seus turnos."),
        rl("White · When played", "only when the bird is played.", "Branco · Quando jogada", "só quando a ave é jogada."),
        roundEndPowers() ? rl("Teal · Round end", "at the end of every round, before goal scoring.", "Azul-petróleo · Fim de rodada", "no fim de cada rodada, antes de pontuar o objetivo.") : "",
        gameEndPowers() ? rl("Yellow · Game end", "once, after the round 4 end-of-round steps.", "Amarelo · Fim de jogo", "uma vez, depois dos passos de fim da rodada 4.") : "",
        rl("No power", "plain bird; only points and traits.", "Sem poder", "ave simples; só pontos e características.")
      ], ["c10", "e2", "o3", "a12", "a13"]),
      infoCard(t("END OF ROUND", "FIM DA RODADA"), t("In this order", "Nesta ordem"), roundEndLines(), ["c11", "e1", "o2", "a14"]),
      infoCard(t("FINAL SCORE", "PONTUAÇÃO FINAL"), t("Scorepad", "Bloco de pontos"), [
        rl("Birds", "points printed on your birds.", "Aves", "pontos impressos nas suas aves."),
        rl("Bonus cards", "as printed on each card you hold.", "Cartas de bônus", "como impresso em cada carta que tiver."),
        rl("End-of-round goals", duetMap() ? "Duet goal points from the map board." : "points marked on the goal board.", "Objetivos de rodada", duetMap() ? "pontos dos objetivos do Dueto no mapa." : "pontos marcados no tabuleiro de objetivos."),
        oceania() ? rl("Nectar", "5 / 2 points for most / second-most spent nectar in each habitat (at least 1 needed).", "Néctar", "5 / 2 pontos para mais / segundo mais néctar gasto em cada habitat (pelo menos 1).") : "",
        rl("1 point each", "egg on a bird, food cached on a bird, card tucked under a bird.", "1 ponto cada", "ovo em ave, comida guardada em ave, carta enfiada sob ave."),
        duetMap() ? rl("Duet map", "1 point per token in your largest contiguous group.", "Mapa do Dueto", "1 ponto por ficha no seu maior grupo contíguo.") : "",
        rl("Tie", solo() ? "the Automa wins if she has more tokens left (after her egg conversion) than you have unused food tokens; otherwise you win (guide's reading)." : "most unused food tokens; still tied, shared win.", "Empate", solo() ? "a Automa vence se tiver mais fichas sobrando (depois da conversão em ovos) do que você tem comida não usada; senão você vence (leitura do guia)." : "mais fichas de comida não usadas; persistindo, vitória compartilhada.")
      ], ["c5", "a5", "o3", "a14", "m5"])
    ];
    if (duetMap()) {
      cards.push(infoCard(t("DUET MAP", "MAPA DO DUETO"), t("Every bird you play", "Cada ave que jogar"), [
        rl("Region", "the map region of the habitat where you played the bird.", "Região", "a região do mapa do habitat onde jogou a ave."),
        rl("Symbol", "a nest the bird has (star = any nest); a food you actually spent on it; 50+ cm / &lt;50 cm wingspan; beak direction.", "Símbolo", "um ninho que a ave tem (estrela = qualquer ninho); uma comida que você de fato gastou nela; envergadura 50+ cm / &lt;50 cm; direção do bico."),
        rl("One token per space", "spaces with an egg, card or food die give you that item.", "Uma ficha por espaço", "espaços com ovo, carta ou dado de comida dão esse item."),
        rl("No match / don't want", "put it on the reset space; later on your turn remove it to reset the bird tray or the birdfeeder.", "Sem correspondência / não quer", "ponha no espaço de reinício; depois, no seu turno, retire-a para reiniciar a bandeja ou o comedouro.")
      ], ["a10", "a14"]));
    }
    if (flock()) {
      cards.push(infoCard(t("FLOCK", "REVOADA"), t("Two active players", "Dois jogadores ativos"), [
        rl("Your group", "use only your group's tray and birdfeeder (“any die” = your group's dice).", "Seu grupo", "use só a bandeja e o comedouro do seu grupo (“qualquer dado” = dados do seu grupo)."),
        rl("Pink powers", "never while you are active; they reset when you become active; any active player at the table can trigger them.", "Poderes rosa", "nunca enquanto você estiver ativo; renovam quando você fica ativo; qualquer jogador ativo da mesa pode dispará-los."),
        rl("“All/other players”", "the whole table; the other active player uses it only after finishing their turn.", "“Todos/outros jogadores”", "a mesa toda; o outro jogador ativo só usa depois de terminar o turno."),
        rl("Goals", "friendly ties: tied players all get full points and the next place is still awarded.", "Objetivos", "empates amigáveis: todos os empatados levam os pontos cheios e a próxima posição continua valendo.")
      ], ["a11", "a13", "a14"]));
    }
    if (solo()) {
      cards.push(infoCard(t("AUTOMA TURN", "TURNO DA AUTOMA"), t("Draw 1 Automa card", "Compre 1 carta da Automa"), [
        rl("Card", "place it face up on the previous ones over the tracker; use only the section for the current round (the arrow).", "Carta", "ponha virada para cima sobre as anteriores na marcadora; use só a seção da rodada atual (a seta)."),
        `${glyph("automa-draw-cards", t("Draw cards", "Comprar cartas"))} ${rl("Draw cards", "discard the 3 face-up birds; she takes 1 face down from the deck.", "Comprar cartas", "descarte as 3 aves viradas para cima; ela pega 1 virada para baixo do baralho.")}`,
        `${glyph("automa-play-bird", t("Play a bird", "Jogar ave"))} ${rl("Play a bird", "of the face-up birds that fit her bonus card she keeps the highest-point one face up; discard the others that fit; none fits → 1 face down from the deck.", "Jogar ave", "das aves viradas para cima que servem à carta de bônus dela, fica com a de mais pontos virada para cima; descarte as outras que servem; nenhuma → 1 virada para baixo do baralho.")}`,
        `${glyph("automa-lay-eggs", t("Egg", "Ovo"))} ${rl("Lay eggs", "1 egg from the supply per egg icon.", "Pôr ovos", "1 ovo da reserva por ícone de ovo.")}`,
        `${glyph("automa-gain-food", t("Gain food", "Ganhar comida"))} ${rl("Gain food", "remove all dice of the first face in the key that is in the feeder (she gets no food).", "Ganhar comida", "retire todos os dados da primeira face da chave que estiver no comedouro (ela não ganha comida).")}`,
        `${glyph("automa-pink-powers", t("Activate all pink powers", "Ativar todos os poderes rosa"))} ${rl("Pink", "you activate all your pink powers.", "Rosa", "você ativa todos os seus poderes rosa.")}`,
        soloOriginal() ? `${glyph("automa-place-cube", t("Place cube", "Pôr cubo"))} ${glyph("automa-remove-cube", t("Remove cube", "Tirar cubo"))} ${rl("Cubes", "add or remove one of her cubes on this round's goal tile.", "Cubos", "ponha ou tire um cubo dela na peça de objetivo desta rodada.")}` : "",
        state.soloGoals === "duet" ? rl("Duet token", "after Draw cards or Play a bird she places 1 Duet token (see Automa section).", "Ficha de Dueto", "depois de Comprar cartas ou Jogar ave ela põe 1 ficha de Dueto (veja a seção da Automa).") : ""
      ], ["m3", "m4", "m6", "m7"]));
    }
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), ["c4", "c5", "c11", "a4", "a14"])}
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- rule sections ----------

  function overviewSection() {
    return `
      ${sectionHeading("overview", t("Rounds and turns", "Rodadas e turnos"), ["c4", "c5", "a4"])}
      <div class="quick-grid">
        ${infoCard(t("GOAL", "OBJETIVO"), t("Most points wins", "Vence quem tiver mais pontos"), [
          t("You attract birds to your mat (your aviary/wildlife preserve). Each bird chains into combos with the other birds in its habitat row.", "Você atrai aves para o seu tabuleiro (o seu aviário/santuário). Cada ave forma combos com as outras aves da mesma fileira de habitat."),
          t("Points come from birds, bonus cards, end-of-round goals, eggs, cached food and tucked cards" + (oceania() ? ", nectar majorities" : "") + (duetMap() ? " and your largest Duet-token group" : "") + ".", "Pontos vêm de aves, cartas de bônus, objetivos de fim de rodada, ovos, comida guardada e cartas enfiadas" + (oceania() ? ", maiorias de néctar" : "") + (duetMap() ? " e o seu maior grupo de fichas de Dueto" : "") + ".")
        ], ["c1", "a1"])}
        ${infoCard(t("ROUNDS", "RODADAS"), t("Four rounds, fewer cubes each time", "Quatro rodadas, menos cubos a cada vez"), [
          rl("Round 1", "8 turns per player.", "Rodada 1", "8 turnos por jogador."),
          rl("Round 2", "7 turns.", "Rodada 2", "7 turnos."),
          rl("Round 3", "6 turns.", "Rodada 3", "6 turnos."),
          rl("Round 4", "5 turns.", "Rodada 4", "5 turnos."),
          t("At the end of each round you use 1 action cube to mark your result on that round's goal, so you have 1 cube fewer next round.", "No fim de cada rodada você usa 1 cubo de ação para marcar o resultado no objetivo da rodada, então tem 1 cubo a menos na rodada seguinte."),
          oceania() && !duetMap() ? t("Oceania “no goal” tile: nothing is scored that round and you keep your cube, so every following round has 1 more turn than usual.", "Peça “sem objetivo” da Oceania: nada é pontuado nessa rodada e você fica com o cubo, então cada rodada seguinte tem 1 turno a mais do que o normal.") : "",
          solo() ? t("The Automa also places or removes cubes only as her cards say; you take the first turn of every round and she takes the last.", "A Automa também põe ou tira cubos só como as cartas mandam; você faz o primeiro turno de toda rodada e ela o último.") : ""
        ], ["c5", "a4", "o11", "m2"])}
        ${infoCard(t("YOUR TURN", "SEU TURNO"), t("Exactly one of four actions", "Exatamente uma de quatro ações"), [
          t("Take 1 action from the left side of your mat: play a bird, gain food (forest), lay eggs (grassland) or draw bird cards (wetland).", "Faça 1 ação do lado esquerdo do tabuleiro: jogar uma ave, ganhar comida (floresta), pôr ovos (campo) ou comprar cartas de aves (pântano)."),
          t("You may choose the same action as often as you like. Your first turns are simple; combos grow as rows fill up.", "Pode escolher a mesma ação quantas vezes quiser. Os primeiros turnos são simples; os combos crescem conforme as fileiras se enchem."),
          t("The egg icons at the top of columns 2–5 are the egg cost of playing a bird there; you never pay eggs when using the three habitat actions.", "Os ovos no topo das colunas 2–5 são o custo em ovos de jogar uma ave ali; você nunca paga ovos ao usar as três ações de habitat."),
          t("Cubes stay where you put them until the round ends: some powers and goals count them.", "Os cubos ficam onde foram postos até a rodada acabar: alguns poderes e objetivos os contam.")
        ], ["c4", "a4", "e2", "o1"])}
      </div>`;
  }

  function actionsSection() {
    return `
      ${sectionHeading("actions", t("The four actions", "As quatro ações"), ["c6", "c7", "c8", "c9", "a6", "a7", "a8", "a9"])}
      <div class="quick-grid">
        ${infoCard(t("OPTION 1", "OPÇÃO 1"), `${glyph("action-play-bird", "")} ${t("Play a bird from your hand", "Jogar uma ave da mão")}`, [
          rl("Check first", "habitat, food cost and egg cost; if you cannot pay the full cost you cannot play it.", "Confira antes", "habitat, custo em comida e em ovos; se não puder pagar tudo, não pode jogá-la."),
          rl("1 · Choose", "a bird in hand and one of the habitats shown on it (several symbols = your choice). Max 5 birds per row.", "1 · Escolha", "uma ave da mão e um dos habitats mostrados nela (vários símbolos = você escolhe). Máx. 5 aves por fileira."),
          rl("2 · Cube and eggs", "put a cube at the top of the column where the bird will go — always the leftmost open spot of that row — and pay that column's eggs: none in column 1, 1 egg in columns 2–3, 2 eggs in columns 4–5, taken from any of your birds back to the supply.", "2 · Cubo e ovos", "ponha um cubo no topo da coluna onde a ave vai entrar — sempre o espaço livre mais à esquerda dessa fileira — e pague os ovos da coluna: nenhum na coluna 1, 1 ovo nas colunas 2–3, 2 ovos nas colunas 4–5, tirados de quaisquer aves suas para a reserva."),
          rl("3 · Food", "discard the food cost from the tokens next to your mat (cached food on birds cannot be spent).", "3 · Comida", "descarte o custo em comida das fichas ao lado do tabuleiro (comida guardada em aves não pode ser gasta)."),
          rl("2-for-1", "while playing a bird, any 2 food tokens count as any 1 food. Not usable at other times.", "2 por 1", "ao jogar uma ave, quaisquer 2 fichas de comida valem como 1 comida qualquer. Não vale em outros momentos."),
          rl("4 · Place", "put the bird in the leftmost open slot and move your cube to the left side of the Play a Bird row.", "4 · Posicione", "ponha a ave no espaço livre mais à esquerda e mova o cubo para o lado esquerdo da fileira Jogar uma Ave."),
          rl("5 · Power", "if it has a white “WHEN PLAYED” power you may use it now. Playing a bird is the only action that activates no row.", "5 · Poder", "se tiver poder branco “WHEN PLAYED”, pode usá-lo agora. Jogar ave é a única ação que não ativa fileira."),
          duetMap() ? rl("Duet", "then place the Duet token from that mat slot on the Duet map (Duet map section).", "Dueto", "depois ponha a ficha de Dueto daquele espaço no mapa do Dueto (seção do mapa).") : ""
        ], ["c6", "a6"])}
        ${infoCard(t("OPTION 2 · FOREST", "OPÇÃO 2 · FLORESTA"), `${glyph("action-gain-food", "")} ${t("Gain food and activate forest birds", "Ganhar comida e ativar aves da floresta")}`, [
          rl("1 · Cube", "on the leftmost exposed slot of the “gain food” row; take that many dice from the birdfeeder.", "1 · Cubo", "no espaço exposto mais à esquerda da fileira “ganhar comida”; pegue esse número de dados do comedouro."),
          rl("Each die", "remove it from the birdfeeder onto the table and take 1 matching food token to your supply (public). A die face with two foods gives 1 token of either, not 2.", "Cada dado", "tire-o do comedouro para a mesa e pegue 1 ficha de comida igual para a sua reserva (pública). Uma face com duas comidas dá 1 ficha de uma delas, não 2."),
          oceania() ? rl("Reset first (Oceania, columns 2 and 4)", "you may discard any 1 food to reset (reroll) the birdfeeder before taking food.", "Reiniciar antes (Oceania, colunas 2 e 4)", "pode descartar 1 comida qualquer para reiniciar (rolar de novo) o comedouro antes de pegar comida.") : "",
          rl("2 · Card → food", "if the slot shows it: discard at most 1 bird card from hand for 1 more food, from the dice still in the birdfeeder. Optional.", "2 · Carta → comida", "se o espaço mostrar: descarte no máximo 1 carta de ave da mão por 1 comida a mais, dos dados que ainda estão no comedouro. Opcional."),
          rl("3 · Activate", "brown powers of your forest birds, right to left, each optional. End your turn with the cube on the left of the row.", "3 · Ativar", "poderes marrons das aves da floresta, da direita para a esquerda, cada um opcional. Termine o turno com o cubo à esquerda da fileira."),
          rl("Birdfeeder", "dice taken stay out until it is refilled. Empty → throw all 5 back in. All dice in it show the same face (including only 1 die left) and you are about to gain food for any reason → you may first throw all 5 dice (including those taken out) back in. The two-food face counts as its own face.", "Comedouro", "dados pegos ficam fora até ele ser reabastecido. Vazio → jogue os 5 de volta. Todos os dados nele com a mesma face (inclusive só 1 dado) e você vai ganhar comida por qualquer motivo → pode antes jogar os 5 dados (inclusive os retirados) de volta. A face de duas comidas conta como face própria."),
          rl("Food tokens", "no limit by your mat, on your birds or in the supply; use a substitute if a type runs out.", "Fichas de comida", "sem limite ao lado do tabuleiro, nas aves ou na reserva; use um substituto se um tipo acabar.")
        ], ["c7", "a7", "o3"])}
        ${infoCard(t("OPTION 3 · GRASSLAND", "OPÇÃO 3 · CAMPO"), `${glyph("action-lay-eggs", "")} ${t("Lay eggs and activate grassland birds", "Pôr ovos e ativar aves do campo")}`, [
          rl("1 · Cube", "on the leftmost exposed slot of the “lay eggs” row; lay that many eggs.", "1 · Cubo", "no espaço exposto mais à esquerda da fileira “pôr ovos”; ponha esse número de ovos."),
          rl("Laying", "take an egg from the supply (any colour) and put it on one of your birds with room. Any mix of birds, all on one is fine, but never above a bird's egg limit (the egg icons on the card). Excess eggs are lost.", "Pondo", "pegue um ovo da reserva (qualquer cor) e ponha numa ave sua com espaço. Qualquer combinação de aves, todos numa só também vale, mas nunca acima do limite de ovos da ave (os ícones de ovo na carta). Ovos em excesso se perdem."),
          rl("2 · Food → egg", "if the slot shows it: pay at most 1 food for 1 more egg. Optional.", "2 · Comida → ovo", "se o espaço mostrar: pague no máximo 1 comida por 1 ovo a mais. Opcional."),
          rl("3 · Activate", "brown powers of your grassland birds, right to left. End with the cube on the left of the row.", "3 · Ativar", "poderes marrons das aves do campo, da direita para a esquerda. Termine com o cubo à esquerda da fileira."),
          rl("Eggs", "stay on the bird for the game unless discarded; each is worth 1 point at the end. Unlimited supply.", "Ovos", "ficam na ave o jogo todo, salvo descarte; cada um vale 1 ponto no fim. Reserva ilimitada.")
        ], ["c8", "a8"])}
        ${infoCard(t("OPTION 4 · WETLAND", "OPÇÃO 4 · PÂNTANO"), `${glyph("action-draw-cards", "")} ${t("Draw bird cards and activate wetland birds", "Comprar cartas e ativar aves do pântano")}`, [
          rl("1 · Cube", "on the leftmost exposed slot of the “draw cards” row; draw that many from the 3 face-up birds and/or the top of the deck. No hand limit.", "1 · Cubo", "no espaço exposto mais à esquerda da fileira “comprar cartas”; compre esse número das 3 aves viradas para cima e/ou do topo do baralho. Sem limite de mão."),
          oceania() ? rl("Reset first (Oceania, columns 2 and 4)", "you may discard any 1 food to reset the bird tray (discard the face-up birds, deal 3 new) before drawing.", "Reiniciar antes (Oceania, colunas 2 e 4)", "pode descartar 1 comida qualquer para reiniciar a bandeja (descartar as aves viradas para cima e pôr 3 novas) antes de comprar.") : "",
          rl("2 · Egg → card", "if the slot shows it: discard at most 1 egg from one of your birds for 1 more card. Optional.", "2 · Ovo → carta", "se o espaço mostrar: descarte no máximo 1 ovo de uma ave sua por 1 carta a mais. Opcional."),
          rl("3 · Activate", "brown powers of your wetland birds, right to left. End with the cube on the left of the row.", "3 · Ativar", "poderes marrons das aves do pântano, da direita para a esquerda. Termine com o cubo à esquerda da fileira."),
          rl("Tray", "empty face-up slots are refilled only at the end of your turn. Each round end: discard the remaining face-up birds and deal 3 new.", "Bandeja", "espaços vazios só são repostos no fim do seu turno. A cada fim de rodada: descarte as aves viradas para cima restantes e ponha 3 novas."),
          rl("Deck", "if it runs out, reshuffle all discarded birds into a new deck. The discard pile is face up.", "Baralho", "se acabar, embaralhe todas as aves descartadas num novo baralho. A pilha de descarte fica virada para cima.")
        ], ["c9", "a9", "o3"])}
      </div>
      <div class="ws-icon-strip" aria-label="${t("Food types", "Tipos de comida")}">
        ${["invertebrate", "seed", "fish", "fruit", "rodent"].map((food) => glyph(`food-${food}`, food)).join("")}${glyph("food-wild", t("wild", "curinga"))}${oceania() ? glyph("nectar", t("nectar", "néctar")) : ""}
      </div>`;
  }

  function powersSection() {
    return `
      ${sectionHeading("powers", t("Bird powers", "Poderes das aves"), ["c10", "a12", "a13", "e2", "o3"])}
      <p class="ws-lede">${t("Every power is optional. The text of each power is printed on its card." + (base() ? " The base Appendix with every base power is in the box but not supplied." : "") + (asia() ? " The Asia Appendix is not in the supplied file either." : "") + " Clarifications for European and Oceania birds are in Expansion notes.", "Todo poder é opcional. O texto de cada poder está impresso na carta." + (base() ? " O Apêndice da base com todos os poderes vem na caixa mas não foi fornecido." : "") + (asia() ? " O Apêndice da Ásia também não está no arquivo fornecido." : "") + " Esclarecimentos de aves europeias e da Oceania estão em Notas das expansões.")}</p>
      <div class="quick-grid">
        ${infoCard(t("BROWN", "MARROM"), t("When activated", "Quando ativado"), [
          t("May be used, right to left, every time you take the action of that bird's habitat row.", "Pode ser usado, da direita para a esquerda, toda vez que você faz a ação da fileira do habitat da ave."),
          t("Never used when the bird is played.", "Nunca é usado quando a ave é jogada.")
        ], ["c10", "a12"])}
        ${infoCard(t("PINK", "ROSA"), t("Once between turns", "Uma vez entre turnos"), [
          t("Triggered on opponents' turns by what they do (the card says what).", "Disparado nos turnos dos adversários pelo que eles fazem (a carta diz o quê)."),
          t("Each pink power works only once between two of your own turns.", "Cada poder rosa funciona só uma vez entre dois turnos seus."),
          t("Tell the table what your pink powers are and what triggers them; everyone helps notice.", "Conte à mesa quais são os seus poderes rosa e o que os dispara; todos ajudam a perceber."),
          roundEndPowers() || gameEndPowers() ? t("Round-end and game-end powers never trigger pink powers.", "Poderes de fim de rodada e de fim de jogo nunca disparam poderes rosa.") : "",
          flock() ? t("Flock: never while you are an active player; they reset each time you become active.", "Revoada: nunca enquanto você é jogador ativo; renovam toda vez que você fica ativo.") : ""
        ], ["c10", "a12", "e2", "a13"])}
        ${infoCard(t("WHITE", "BRANCO"), t("When played", "Quando jogada"), [
          t("Used only when the bird is played (never again). The base rulebook calls them “no colour”.", "Usado só quando a ave é jogada (nunca mais). O livro base os chama de “sem cor”."),
          t("A bird played by another bird's power (“play a second bird…”) also uses its white power.", "Uma ave jogada pelo poder de outra (“jogue uma segunda ave…”) também usa o poder branco.")
        ], ["c10", "a12", "e10"])}
        ${roundEndPowers() ? infoCard(t("TEAL", "AZUL-PETRÓLEO"), t("Round end", "Fim de rodada"), [
          t("Resolved when all turns of the round are done, before scoring that round's goal (so up to 4 times per bird).", "Resolvidos quando todos os turnos da rodada acabam, antes de pontuar o objetivo dela (até 4 vezes por ave)."),
          t("In player order, starting with the player who went first this round; your own teal birds in any order.", "Na ordem dos jogadores, começando por quem jogou primeiro nesta rodada; as suas aves azul-petróleo em qualquer ordem."),
          t("They do not activate pink powers. Cubes are still on the mats at this point — some teal powers count them.", "Não ativam poderes rosa. Os cubos ainda estão nos tabuleiros nesse momento — alguns poderes azul-petróleo os contam.")
        ], ["e2", "a13"]) : ""}
        ${gameEndPowers() ? infoCard(t("YELLOW", "AMARELO"), t("Game end", "Fim de jogo"), [
          t("Activated only once, after all end-of-round steps of round 4 (after scoring the last goal).", "Ativados uma única vez, depois de todos os passos de fim da rodada 4 (depois de pontuar o último objetivo)."),
          t("Several yellow birds: any order. They do not trigger pink powers.", "Várias aves amarelas: qualquer ordem. Não disparam poderes rosa.")
        ], ["o3", "a13"]) : ""}
        ${infoCard(t("SYMBOLS", "SÍMBOLOS"), t("On the cards", "Nas cartas"), [
          `${glyph("predator", t("Predator", "Predador"))} ${rl("Predator", "the power hunts (some pink powers react to a predator succeeding).", "Predador", "o poder caça (alguns poderes rosa reagem a um predador bem-sucedido).")}`,
          `${glyph("tuck", t("Flocking", "Bando"))} ${rl("Flocking", "the power tucks other bird cards under it (a flock); each tucked card is 1 point.", "Bando", "o poder enfia outras cartas de ave sob ela (um bando); cada carta enfiada vale 1 ponto.")}`,
          rl("Cache", "put a food token on a bird. It cannot be spent and is worth 1 point at the end. If food tokens run out, cache discarded cards instead.", "Guardar (cache)", "ponha uma ficha de comida numa ave. Ela não pode ser gasta e vale 1 ponto no fim. Se acabarem as fichas de comida, guarde cartas descartadas no lugar delas."),
          rl("Wingspan", "in cm on the card; some powers and bonus cards compare it.", "Envergadura", "em cm na carta; alguns poderes e cartas de bônus a comparam."),
          oceania() ? rl("Flightless (*)", "a * instead of a wingspan: wild for every wingspan condition (predators, bonus cards).", "Não voadora (*)", "um * no lugar da envergadura: curinga para toda condição de envergadura (predadores, cartas de bônus).") : "",
          oceania() ? rl("Adjacent", "orthogonal: immediately left/right in the row and immediately above/below.", "Adjacente", "ortogonal: imediatamente à esquerda/direita na fileira e imediatamente acima/abaixo.") : "",
          europe() ? rl("* in the food cost", "an alternative cost is written in the card's text (hunting and fishing powers).", "* no custo", "um custo alternativo está escrito no texto da carta (poderes de caça e pesca).") : ""
        ], ["c10", "a12", "o3", "e2"])}
      </div>`;
  }

  function nectarSection() {
    return `
      ${sectionHeading("nectar", t("Nectar (Oceania)", "Néctar (Oceania)"), ["o2", "o3"])}
      <div class="quick-grid">
        ${infoCard(t("WILD FOOD", "COMIDA CURINGA"), `${glyph("nectar", "")} ${t("When nectar is wild", "Quando o néctar é curinga")}`, [
          t("Paying a bird's food cost, an “any food” bird ability, or a mat upgrade (reset, extra egg, extra card…): nectar substitutes for any of the other 5 foods.", "Ao pagar o custo de uma ave, uma habilidade de “qualquer comida” ou uma melhoria do tabuleiro (reiniciar, ovo extra, carta extra…): o néctar substitui qualquer das outras 5 comidas."),
          t("Some birds cost nectar: you may pay 2 other food tokens for that 1 nectar (2-for-1).", "Algumas aves custam néctar: você pode pagar 2 outras fichas de comida por esse 1 néctar (2 por 1)."),
          t("The wild-food symbol always includes nectar.", "O símbolo de comida curinga sempre inclui néctar."),
          t("You may not use nectar as one of the 2 tokens of a 2-for-1 payment (it is already wild).", "Não se pode usar néctar como uma das 2 fichas de um pagamento 2 por 1 (ele já é curinga)."),
          t("Not wild for bird powers that name a specific food: a power looking for rodents in the birdfeeder does not count nectar there.", "Não é curinga para poderes que nomeiam uma comida específica: um poder que procura roedores no comedouro não conta o néctar ali.")
        ], ["o2", "o3"])}
        ${infoCard(t("SPENT NECTAR", "NÉCTAR GASTO"), `${glyph("spent-nectar", "")} ${t("Goes on your mat", "Vai para o tabuleiro")}`, [
          t("Nectar you spend as nectar goes on the “spent nectar” space of a row: when playing a bird, the row you played it in; otherwise the row you activated this turn.", "O néctar gasto como néctar vai para o espaço “néctar gasto” de uma fileira: ao jogar uma ave, a fileira onde a jogou; senão, a fileira ativada neste turno."),
          t("Counts: a bird's food cost, an ability with the wild icon, a mat upgrade.", "Conta: custo de ave, habilidade com o ícone curinga, melhoria do tabuleiro."),
          t("A nectar paid with 2-for-1 never enters your supply and is not put on the spent-nectar space.", "Um néctar pago com 2 por 1 nunca entra na sua reserva e não vai para o espaço de néctar gasto.")
        ], ["o3"])}
        ${infoCard(t("ROUND END", "FIM DA RODADA"), t("Use it or lose it", "Use ou perca"), [
          t("Unspent nectar in your personal supply is discarded at the end of every round (back to the general supply).", "O néctar não gasto da sua reserva pessoal é descartado no fim de toda rodada (de volta à reserva geral)."),
          t("Nectar on spent-nectar spaces or cached on birds stays.", "Néctar nos espaços de néctar gasto ou guardado em aves fica."),
          t("Game end, in each habitat: most spent nectar 5 points, second-most 2 points; at least 1 nectar needed.", "Fim de jogo, em cada habitat: mais néctar gasto 5 pontos, segundo mais 2 pontos; é preciso pelo menos 1 néctar."),
          flock()
            ? t("Flock: friendly ties — several players can be first, and second place still goes to the next-highest amount.", "Revoada: empates amigáveis — vários jogadores podem ser primeiros, e o segundo lugar ainda vai para a próxima maior quantidade.")
            : t("Ties: add the points of the tied places and split, rounded down (two tied for most: 3 each; two tied for second: 1 each).", "Empates: some os pontos das posições empatadas e divida, arredondando para baixo (dois empatados em primeiro: 3 cada; dois em segundo: 1 cada)."),
          solo() ? interpretation("the supplied Automa rules give the Automa no nectar majority; she has no mat, so you take first place (5) in each habitat where you spent at least 1 nectar.", "as regras de Automa fornecidas não dão maioria de néctar à Automa; ela não tem tabuleiro, então você fica em primeiro (5) em cada habitat onde gastou pelo menos 1 néctar.") : ""
        ], ["o2", "o3", "a11"])}
        ${infoCard(t("NEW MAT", "NOVO TABULEIRO"), t("Reset upgrades", "Melhorias de reiniciar"), [
          `${glyph("reset-birdfeeder", t("Reset birdfeeder", "Reiniciar comedouro"))} ${rl("Forest, columns 2 and 4", "discard any 1 food to reset the birdfeeder.", "Floresta, colunas 2 e 4", "descarte 1 comida para reiniciar o comedouro.")}`,
          `${glyph("reset-tray", t("Reset bird tray", "Reiniciar bandeja"))} ${rl("Wetland, columns 2 and 4", "discard any 1 food to reset the bird tray.", "Pântano, colunas 2 e 4", "descarte 1 comida para reiniciar a bandeja.")}`,
          t("Use a space's actions in printed order: reset first if you want, then take food or cards.", "Use as ações do espaço na ordem impressa: reinicie primeiro se quiser, depois pegue comida ou cartas.")
        ], ["o3"])}
      </div>`;
  }

  function roundEndSection() {
    const cards = [
      infoCard(t("ORDER", "ORDEM"), t("When every cube is placed", "Quando todos os cubos estiverem postos"), roundEndLines(), ["c11", "e1", "o2", "a14"])
    ];
    if (duetMap()) {
      cards.push(infoCard(t("DUET GOALS", "OBJETIVOS DO DUETO"), t("Only the leader scores", "Só quem lidera pontua"), [
        t("Each tile describes what is compared on the Duet map (for example tokens in any one horizontal row, or on certain foods); read the tile.", "Cada peça descreve o que é comparado no mapa do Dueto (por exemplo fichas em qualquer fileira horizontal, ou em certas comidas); leia a peça."),
        rl("First", "places a cube in the space above the tile and scores the points shown there (2, 3, 4 and 5 points in rounds 1–4 in the rulebook's picture).", "Primeiro", "põe um cubo no espaço acima da peça e marca os pontos mostrados ali (2, 3, 4 e 5 pontos nas rodadas 1–4 na figura do livro)."),
        rl("Second", "places a cube below the tile: 0 points" + (solo() ? "." : ", and takes the first-player token for the next round."), "Segundo", "põe um cubo abaixo da peça: 0 pontos" + (solo() ? "." : ", e pega o marcador de primeiro jogador para a próxima rodada.")),
        rl("Tie", "friendly: both players score the points above the tile; the first-player token goes to the player who did not have it this round.", "Empate", "amigável: os dois marcam os pontos acima da peça; o marcador de primeiro jogador vai para quem não o tinha nesta rodada."),
        solo() ? t("Against the Automa the Duet goals are scored the same way: she competes with her own Duet tokens and marks with one of her cubes. You still always start each round (no first-player token).", "Contra a Automa os objetivos do Dueto são pontuados do mesmo jeito: ela compete com as próprias fichas de Dueto e marca com um cubo dela. Você continua começando toda rodada (sem marcador de primeiro jogador).") : ""
      ], ["a14", "m5"]));
    } else if (flock()) {
      cards.push(infoCard(t("FLOCK GOAL BOARD", "TABULEIRO DA REVOADA"), t("Majority, friendly ties", "Maioria, empates amigáveis"), [
        t("Count your quantity of the targeted item; rank the table and place cubes on the place spaces (the points per place are printed on the board).", "Conte a sua quantidade do item; classifique a mesa e ponha cubos nas posições (os pontos por posição estão impressos no tabuleiro)."),
        t("Friendly ties: if 2 players tie for first they both get full first-place points, and second place is still available.", "Empates amigáveis: se 2 empatam em primeiro, os dois levam os pontos cheios de primeiro, e o segundo lugar continua disponível."),
        interpretation("as on the base green side, you need at least 1 of the item to score and everyone still places a cube (at 0 if needed).", "como no lado verde da base, é preciso ter ao menos 1 do item para pontuar e todos ainda põem um cubo (no 0 se preciso).")
      ], ["a14", "c11"]));
    } else if (state.side === "blue") {
      cards.push(infoCard(t("BLUE SIDE", "LADO AZUL"), t("1 point per item", "1 ponto por item"), [
        t("Count your quantity of the targeted item: 1 point each, maximum 5.", "Conte a sua quantidade do item: 1 ponto cada, máximo 5."),
        t("Mark it with an action cube on the 5-4-3-2-1-0 track next to the goal. With none, you still place a cube on 0.", "Marque com um cubo de ação na trilha 5-4-3-2-1-0 ao lado do objetivo. Sem nenhum, ainda põe um cubo no 0."),
        solo() ? t("The Automa marks her score the same way with her own quantity (see Automa).", "A Automa marca a pontuação do mesmo jeito com a própria quantidade (veja Automa).") : ""
      ], ["c11", "a15", "m5"]));
    } else {
      cards.push(infoCard(t("GREEN SIDE", "LADO VERDE"), t("Majority: 1st, 2nd, 3rd", "Maioria: 1º, 2º, 3º"), [
        t("Count your quantity of the targeted item, compare, and place cubes on the place spaces by rank.", "Conte a sua quantidade do item, compare e ponha os cubos nas posições pela classificação."),
        t("You need at least 1 of the item to score (e.g. at least 1 grassland bird for “most birds in grassland”).", "É preciso ter ao menos 1 do item para pontuar (ex.: ao menos 1 ave do campo para “mais aves no campo”)."),
        t("Tie: put all tied cubes on that place and do not award the next place(s). At game end add the points of that place and the skipped place(s), divide by the tied players, round down; 4th place scores 0. Example: tie for 1st on a 5/2/1 goal = 3 points each, nobody gets 2nd.", "Empate: ponha todos os cubos empatados nessa posição e não conceda a(s) seguinte(s). No fim some os pontos dessa posição e da(s) pulada(s), divida pelos empatados, arredonde para baixo; o 4º lugar vale 0. Exemplo: empate em 1º num objetivo 5/2/1 = 3 pontos cada, ninguém fica em 2º."),
        t("4th and 5th place (or 0 items) still place a cube on the 0 space.", "4º e 5º lugar (ou 0 itens) ainda põem um cubo no espaço 0.")
      ], ["c11", "a15"]));
    }
    if (!duetMap()) {
      const goalLines = [
        base() ? t("Base goal tiles (birds or eggs in a habitat or nest type…): the explanation is in the base Appendix, which is not supplied — read the tile.", "Peças de objetivo da base (aves ou ovos num habitat ou tipo de ninho…): a explicação está no Apêndice da base, que não foi fornecido — leia a peça.") : "",
        europe() ? rl("Food in supply", "food tokens in your personal supply (food cached on birds does not count).", "Comida na reserva", "fichas de comida na sua reserva pessoal (comida guardada em aves não conta).") : "",
        europe() ? rl("Bird cards in hand", "cards in your hand.", "Cartas de aves na mão", "cartas na sua mão.") : "",
        europe() ? rl("Birds worth over 4 points", "played birds with a printed value above 4.", "Aves que valem mais de 4", "aves jogadas com valor impresso acima de 4.") : "",
        europe() ? rl("Birds with no eggs", "played birds with no egg on them when scored.", "Aves sem ovos", "aves jogadas sem nenhum ovo no momento da pontuação.") : "",
        europe() ? rl("Birds in 1 row", "birds in your habitat with the most birds.", "Aves em 1 fileira", "aves no seu habitat com mais aves.") : "",
        europe() ? rl("Filled columns", "columns with all 3 spaces filled.", "Colunas cheias", "colunas com os 3 espaços ocupados.") : "",
        europe() ? rl("Brown powers", "played birds with a brown power.", "Poderes marrons", "aves jogadas com poder marrom.") : "",
        europe() ? rl("White & no powers", "played birds with no power or a “when played” power.", "Brancos e sem poder", "aves jogadas sem poder ou com poder “quando jogada”.") : "",
        europe() ? rl("Birds with tucked cards", "played birds with at least 1 tucked card.", "Aves com cartas enfiadas", "aves jogadas com pelo menos 1 carta enfiada.") : "",
        europe() ? rl("Food cost of played birds", "total food symbols in your birds' costs; a choice (“/”) counts as 1.", "Custo em comida das aves jogadas", "total de símbolos de comida nos custos das suas aves; uma escolha (“/”) conta 1.") : "",
        oceania() && !soloOriginal() ? rl("(Food) in food cost of your birds", "count those food symbols in your played birds' costs; a “/” cost counts once; wild and nectar are not counted.", "(Comida) no custo das suas aves", "conte esses símbolos de comida nos custos das aves jogadas; um custo “/” conta uma vez; curinga e néctar não contam.") : "",
        oceania() && !soloOriginal() ? rl("No goal", "nothing is scored; keep your cube — every later round has 1 more turn.", "Sem objetivo", "nada é pontuado; fique com o cubo — cada rodada seguinte tem 1 turno a mais.") : "",
        oceania() && !soloOriginal() ? rl("Cubes on “Play a Bird”", "cubes you placed on Play a Bird this round (cubes stay in their rows until scored).", "Cubos em “Jogar uma Ave”", "cubos que você pôs em Jogar uma Ave nesta rodada (os cubos ficam nas fileiras até a pontuação).") : "",
        beakTiles() ? rl("Beak pointing left / right", "birds whose beak faces that way; straight-ahead beaks count for neither. Wrybill counts as left; Common Loon counts for both; Great Crested Grebe counts once as left.", "Bico para a esquerda / direita", "aves com o bico virado para esse lado; bicos de frente não contam para nenhum. Wrybill conta como esquerda; Common Loon conta para os dois; Great Crested Grebe conta uma vez como esquerda.") : "",
        beakTiles() ? rl("Facing straight ahead", `Barn Owl, Barred Owl, Burrowing Owl, California Condor, Eastern Screech-Owl, Great Horned Owl, Horned Lark, Spotted Owl${europe() ? "; Little Owl, Snowy Owl, Short-Toed Treecreeper" : ""}; Australian Owlet-Nightjar, Kākāpō, Rufous Owl.`, "De frente", `Barn Owl, Barred Owl, Burrowing Owl, California Condor, Eastern Screech-Owl, Great Horned Owl, Horned Lark, Spotted Owl${europe() ? "; Little Owl, Snowy Owl, Short-Toed Treecreeper" : ""}; Australian Owlet-Nightjar, Kākāpō, Rufous Owl.`) : "",
        europe() ? rl("Double-counting birds", "Eurasian Green Woodpecker, Greylag Goose, Cetti's Warbler count double toward the goal if they qualify (not their eggs, not bonus cards).", "Aves que contam em dobro", "Eurasian Green Woodpecker, Greylag Goose, Cetti's Warbler contam em dobro para o objetivo se qualificarem (não os ovos, nem bônus).") : "",
        europe() ? rl("Sideways birds", "count as 1 bird but fill 2 spaces (twice for filled columns).", "Aves de lado", "contam como 1 ave mas ocupam 2 espaços (duas vezes em colunas cheias).") : ""
      ];
      cards.push(infoCard(t("GOAL TILES", "PEÇAS DE OBJETIVO"), t("What each tile counts", "O que cada peça conta"), goalLines, ["c11", "e3", "e10", "o11"]));
    }
    return `
      ${sectionHeading("round-end", t("End of round and goals", "Fim da rodada e objetivos"), ["c11", "e2", "o2", "a14", "a15"])}
      <div class="quick-grid">${cards.join("")}</div>
      ${duetMap() ? `<figure class="ws-art"><img src="${ART}duet-goals.webp" alt="${t("Duet goal slots: round 1 2 points, round 2 3 points, round 3 4 points, round 4 5 points; 0 points below", "Vagas de objetivo do Dueto: rodada 1 2 pontos, rodada 2 3 pontos, rodada 3 4 pontos, rodada 4 5 pontos; 0 pontos abaixo")}" loading="lazy"><figcaption>${t("Duet goals (Asia p. 14).", "Objetivos do Dueto (Ásia p. 14).")}</figcaption></figure>` : ""}
      ${flock() ? `<figure class="ws-art"><img src="${ART}flock-goal-board.webp" alt="${t("Flock mode goal board with four rounds of place spaces", "Tabuleiro de objetivos da Revoada com quatro rodadas de posições")}" loading="lazy"><figcaption>${t("Flock goal board (Asia p. 14).", "Tabuleiro de objetivos da Revoada (Ásia p. 14).")}</figcaption></figure>` : ""}`;
  }

  function gameEndSection() {
    const [tokens, points] = difficultyNumbers();
    return `
      ${sectionHeading("game-end", t("Game end and scoring", "Fim de jogo e pontuação"), ["c5", "a5", "o2", "m5"])}
      <div class="quick-grid">
        ${infoCard(t("WHEN", "QUANDO"), t("After round 4", "Depois da rodada 4"), [
          t("Complete the end-of-round steps of round 4 (including scoring its goal).", "Complete os passos de fim da rodada 4 (inclusive pontuar o objetivo)."),
          gameEndPowers() ? t("Then activate yellow “game end” powers (any order for your own).", "Depois ative os poderes amarelos de “fim de jogo” (qualquer ordem para os seus).") : "",
          t("Then add up with the scorepad.", "Depois some com o bloco de pontos.")
        ], ["c5", "a5", "o2"])}
        ${infoCard(t("SCOREPAD", "BLOCO DE PONTOS"), t("Add together", "Some"), [
          rl("Birds", "the points printed on each bird on your mat.", "Aves", "os pontos impressos em cada ave do tabuleiro."),
          rl("Bonus cards", "as printed (details of base bonus cards are in the base Appendix, not supplied).", "Cartas de bônus", "como impresso (detalhes das cartas de bônus da base estão no Apêndice da base, não fornecido)."),
          rl("End-of-round goals", duetMap() ? "Duet goal points." : "points on the goal board.", "Objetivos de rodada", duetMap() ? "pontos dos objetivos do Dueto." : "pontos no tabuleiro de objetivos."),
          oceania() ? rl("Nectar", "5/2 per habitat majority.", "Néctar", "5/2 por maioria em cada habitat.") : "",
          rl("Eggs / cached food / tucked cards", "1 point each.", "Ovos / comida guardada / cartas enfiadas", "1 ponto cada."),
          duetMap() ? rl("Duet tokens", "1 point per token in your largest contiguous group (spaces joined by a line on the map).", "Fichas de Dueto", "1 ponto por ficha no seu maior grupo contíguo (espaços ligados por uma linha no mapa).") : ""
        ], ["c5", "a5", "a14"])}
        ${infoCard(t("WINNER", "VENCEDOR"), t("Most points", "Mais pontos"), solo() ? [
          t(`The Automa first converts her tokens: 1 egg for every ${tokens} of her tokens, which go back to the supply (${difficultyName()}).`, `A Automa primeiro converte as fichas: 1 ovo para cada ${tokens} fichas dela, que voltam à reserva geral (${difficultyName()}).`),
          t(`She scores: printed points of her face-up birds, ${points} per face-down bird, 1 per egg, plus ${state.soloGoals === "duet" ? "her Duet goal points and her largest contiguous Duet group" : "her end-of-round goal points"}. No points for her bonus card.`, `Ela marca: pontos impressos das aves viradas para cima, ${points} por ave virada para baixo, 1 por ovo, mais ${state.soloGoals === "duet" ? "os pontos dos objetivos do Dueto e o maior grupo contíguo de fichas dela" : "os pontos dos objetivos de rodada"}. Sem pontos pela carta de bônus.`),
          t("Tie: the Automa wins if she has more tokens left (those not converted into eggs) than you have unused food tokens.", "Empate: a Automa vence se tiver mais fichas sobrando (as que não viraram ovos) do que você tem fichas de comida não usadas."),
          interpretation("if she does not have more, you win.", "se ela não tiver mais, você vence.")
        ] : [
          t("Most points wins. Tie: most unused food tokens (in your supply). Still tied: shared victory.", "Vence quem tiver mais pontos. Empate: mais fichas de comida não usadas (na reserva). Persistindo: vitória compartilhada.")
        ], ["c5", "a5", "m5", "m6"])}
      </div>`;
  }

  function duetSection() {
    return `
      ${sectionHeading("duet", t("The Duet map", "O mapa do Dueto"), ["a10", "a14", "m6", "m7"])}
      <div class="quick-grid">
        ${infoCard(t("PLACING", "COLOCANDO"), `${glyph("duet-token", "")} ${t("Each bird you play", "Cada ave que você joga")}`, [
          t("When you play a bird onto your mat, move the Duet token from that slot onto an unclaimed space of the Duet map that matches the bird.", "Ao jogar uma ave no tabuleiro, mova a ficha de Dueto daquele espaço para um espaço livre do mapa que corresponda à ave."),
          rl("Region", "the space must be in the map region of the habitat where you played the bird.", "Região", "o espaço tem de estar na região do mapa do habitat onde jogou a ave."),
          rl("Nest space", "the bird must have that nest; a star nest matches any nest symbol.", "Espaço de ninho", "a ave tem de ter esse ninho; o ninho estrela corresponde a qualquer ninho."),
          rl("Food space", "you must have spent that food. With 2-for-1, count the food you needed, not the 2 you spent." + (oceania() ? " Nectar spent as wild counts as the food it replaced; nectar paid for a nectar cost matches any food space." : ""), "Espaço de comida", "você tem de ter gastado essa comida. Com 2 por 1, conta a comida que precisava, não as 2 gastas." + (oceania() ? " Néctar gasto como curinga conta como a comida que substituiu; néctar pago num custo de néctar corresponde a qualquer espaço de comida." : "")),
          rl("50+ cm / &lt;50 cm", "the bird's wingspan.", "50+ cm / &lt;50 cm", "a envergadura da ave."),
          rl("Beak", "the direction the bird's beak points (rulebook example: “left-facing beak”).", "Bico", "a direção para onde o bico da ave aponta (exemplo do livro: “bico para a esquerda”)."),
          t("Having the habitat or food on the card is not enough: you must have played it in that habitat and used that food.", "Ter o habitat ou a comida na carta não basta: tem de ter jogado naquele habitat e usado aquela comida."),
          t("Only one token per space.", "Só uma ficha por espaço.")
        ], ["a10", "a14"])}
        ${infoCard(t("WHEN", "QUANDO"), t("Every bird played, nothing else", "Toda ave jogada, nada mais"), [
          t("Whenever you play a bird: the Play a Bird action and powers that play another bird both count.", "Sempre que jogar uma ave: a ação Jogar uma Ave e poderes que jogam outra ave contam."),
          t("The tokens on your mat are only reminders: moving a bird with a power places no new token; playing a bird on top of another bird does place one.", "As fichas do tabuleiro são só lembretes: mover uma ave com um poder não põe ficha nova; jogar uma ave por cima de outra põe."),
          europe() ? t("Europe: Greylag Goose, Cetti's Warbler and Eurasian Green Woodpecker (double for goals) place 2 tokens on different spaces (one or both may go to the reset space). Sideways birds place only 1.", "Europa: Greylag Goose, Cetti's Warbler e Eurasian Green Woodpecker (dobro nos objetivos) põem 2 fichas em espaços diferentes (uma ou as duas podem ir ao espaço de reinício). Aves de lado põem só 1.") : "",
          t("More than 15 birds in a game: use a substitute token.", "Mais de 15 aves no jogo: use uma ficha substituta.")
        ], ["a10", "a14"])}
        ${infoCard(t("BONUSES & RESET", "BÔNUS E REINÍCIO"), t("Special spaces", "Espaços especiais"), [
          rl("Bonus", "a space showing an egg, a card or a food die gives you that item when you claim it.", "Bônus", "um espaço com ovo, carta ou dado de comida dá esse item quando você o ocupa."),
          interpretation("egg = lay 1 egg from the supply on one of your birds with room; card = draw 1 bird from the tray or the deck; food die = gain 1 food from the birdfeeder, taking the die as usual.", "ovo = ponha 1 ovo da reserva numa ave sua com espaço; carta = compre 1 ave da bandeja ou do baralho; dado de comida = ganhe 1 comida do comedouro, retirando o dado como sempre."),
          rl("Reset space", "if no space matches, or you prefer, put your token on the reset space (lower left).", "Espaço de reinício", "se nenhum espaço corresponder, ou se preferir, ponha a ficha no espaço de reinício (embaixo à esquerda)."),
          rl("Using it", "at any time on your turn later, remove that token to reset the bird tray or the birdfeeder.", "Usando", "a qualquer momento num turno seu depois, retire essa ficha para reiniciar a bandeja ou o comedouro."),
          interpretation("the one-token-per-space limit is for map spaces; the reset space may hold several tokens, of both players. A removed token is set aside (it no longer counts for your group) and can be used from your next turn on.", "o limite de uma ficha por espaço vale para os espaços do mapa; o espaço de reinício pode ter várias fichas, dos dois jogadores. A ficha retirada fica de lado (não conta mais para o seu grupo) e pode ser usada a partir do seu próximo turno.")
        ], ["a10"])}
        ${infoCard(t("SCORING", "PONTUAÇÃO"), t("Goals and the largest group", "Objetivos e o maior grupo"), [
          t("End of each round: Duet goals (see End of round).", "Fim de cada rodada: objetivos do Dueto (veja Fim da rodada)."),
          t("Game end: find your largest contiguous group of Duet tokens; 1 point per token in it. Two spaces are contiguous if a line connects them on the map.", "Fim de jogo: ache o seu maior grupo contíguo de fichas de Dueto; 1 ponto por ficha nele. Dois espaços são contíguos se uma linha os liga no mapa.")
        ], ["a14"])}
      </div>`;
  }

  function flockSection() {
    const seven = state.players === 7;
    return `
      ${sectionHeading("flock", t("Flock mode", "Modo Revoada"), ["a3", "a4", "a11", "a13", "a14"])}
      <div class="quick-grid">
        ${infoCard(t("TURNS", "TURNOS"), `${glyph("flock-dial", "")} ${t("Two active players", "Dois jogadores ativos")}`, [
          t("The 2 players the turn-order dial points to are active and take their turns at the same time (usually one from each group).", "Os 2 jogadores apontados pelo disco são os ativos e jogam ao mesmo tempo (normalmente um de cada grupo)."),
          t("Each announces when done. When both are done, rotate the dial clockwise: 2 new active players.", "Cada um avisa quando termina. Quando os dois terminarem, gire o disco em sentido horário: 2 novos jogadores ativos."),
          t("Wait for both before moving the dial. Continue until everyone has used their cubes.", "Espere os dois antes de girar o disco. Continue até todos usarem os cubos."),
          t("You compete as individuals; groups only decide which tray and birdfeeder you use.", "Vocês competem individualmente; os grupos só decidem qual bandeja e comedouro cada um usa.")
        ], ["a3", "a11"])}
        ${seven ? infoCard(t("7 PLAYERS", "7 JOGADORES"), t("Special circumstances", "Situações especiais"), [
          t("Rounds 2 and 4: everyone has an odd number of turns, so the person to the right of the first-player token has 1 cube left when everyone else is done; they take that last turn alone.", "Rodadas 2 e 4: todos têm número ímpar de turnos, então a pessoa à direita do marcador de primeiro jogador fica com 1 cubo quando os outros terminam; ela faz esse último turno sozinha."),
          t("The 2 players at the edges of the 4-player group are active together on half their turns; they play one after the other instead of simultaneously.", "Os 2 jogadores nas pontas do grupo de 4 ficam ativos juntos em metade dos turnos; eles jogam um depois do outro em vez de simultaneamente."),
          rl("Who goes first then", "rounds 1 and 3: the player the star points to (“1,3” on the dial); rounds 2 and 4: the non-star player (“2,4”).", "Quem joga primeiro então", "rodadas 1 e 3: quem a estrela aponta (“1,3” no disco); rodadas 2 e 4: o jogador sem estrela (“2,4”)."),
          t("If that first active player draws cards, the tray refills at the end of their turn, before the second one plays.", "Se esse primeiro jogador ativo comprar cartas, a bandeja é reposta no fim do turno dele, antes de o segundo jogar.")
        ], ["a11"]) : ""}
        ${infoCard(t("INTERACTION", "INTERAÇÃO"), t("Powers across groups", "Poderes entre grupos"), [
          t("Your powers that affect other players affect the whole table, not just your group.", "Os seus poderes que afetam outros jogadores afetam a mesa toda, não só o seu grupo."),
          rl("Pink", "never activate while you are active; they reset each time you become active; any active player can trigger them.", "Rosa", "nunca ativam enquanto você está ativo; renovam toda vez que você fica ativo; qualquer jogador ativo pode dispará-los."),
          rl("“All players” / “other players”", "everyone at the table, including the other active player — who is affected only after finishing their turn and cannot use those resources in it." + (seven ? " With 7, the second of two sequential active players must also wait." : ""), "“Todos” / “outros jogadores”", "todos na mesa, inclusive o outro jogador ativo — que só é afetado depois de terminar o turno e não pode usar esses recursos nele." + (seven ? " Com 7, o segundo de dois jogadores ativos em sequência também espera." : "")),
          rl("Choosing in turn order", "(e.g. Ruby-throated Hummingbird) each group chooses from its own cards or dice; in the other group, order starts with its active player after they finish their own turn (they still gain only what “all players” get)." + (seven ? " With 7, if that group has no active player, start with the player there who will be first next." : ""), "Escolher em ordem", "(ex.: Ruby-throated Hummingbird) cada grupo escolhe das próprias cartas ou dados; no outro grupo a ordem começa pelo jogador ativo dele depois de terminar o próprio turno (ele ainda só ganha o que “todos” ganham)." + (seven ? " Com 7, se esse grupo não tiver jogador ativo, comece por quem será o primeiro a seguir." : "")),
          rl("“Another player”", "anyone at the table. Left/right = your physical neighbour, whatever their group.", "“Outro jogador”", "qualquer um da mesa. Esquerda/direita = o vizinho físico, de qualquer grupo."),
          oceania() ? rl("Emu", "gain all seed from your group's birdfeeder; you may give the remainder to anyone at the table.", "Emu", "ganhe toda a semente do comedouro do seu grupo; pode dar o restante a qualquer um da mesa.") : ""
        ], ["a13", "a11"])}
        ${infoCard(t("ROUND END", "FIM DA RODADA"), t("Flock changes", "Mudanças da Revoada"), [
          t("Goals: friendly ties — tied players all get full points, and the next place is still awarded.", "Objetivos: empates amigáveis — todos os empatados levam os pontos cheios, e a próxima posição continua valendo."),
          t("Pass the first-player token to the left, then turn the dial so the star points to that player: the 2 starting players of the next round.", "Passe o marcador de primeiro jogador para a esquerda e gire o disco para a estrela apontar para ele: os 2 jogadores iniciais da próxima rodada."),
          oceania() ? t("Nectar majorities also use friendly ties.", "As maiorias de néctar também usam empates amigáveis.") : ""
        ], ["a4", "a14", "a11"])}
      </div>`;
  }

  function soloSection() {
    const hoard = state.automa === "hoard";
    const duetSolo = state.soloGoals === "duet";
    return `
      ${sectionHeading("solo", t("Solo: the Automa", "Solo: a Automa"), ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "e11"])}
      <p class="ws-lede">${t("You always follow the multiplayer rules. The Automa does not: she gets no mat and no starting hand, collects birds, eggs and sometimes tokens only for scoring, pays for nothing, and takes part in your powers only as described here.", "Você sempre segue as regras multijogador. A Automa não: ela não tem tabuleiro nem mão inicial, junta aves, ovos e às vezes fichas só para pontuar, não paga nada e participa dos seus poderes só como descrito aqui.")}</p>
      <div class="quick-grid">
        ${infoCard(t("HER TURN", "TURNO DELA"), t("One Automa card", "Uma carta da Automa"), [
          t("Draw the top Automa card and place it face up over the previous ones, covering half of the tracker card(s) and lined up with the arrow(s). The arrow points to the section for the current round; ignore the other three.", "Compre a carta do topo do baralho da Automa e ponha-a virada para cima sobre as anteriores, cobrindo metade da(s) marcadora(s) e alinhada com a(s) seta(s). A seta aponta a seção da rodada atual; ignore as outras três."),
          t("Resolve each icon in that section.", "Resolva cada ícone dessa seção."),
          interpretation("her turns trigger your pink powers only through the “activate all pink powers” icon; her other icons are not player actions.", "os turnos dela só disparam os seus poderes rosa pelo ícone “ativar todos os poderes rosa”; os outros ícones dela não são ações de jogador."),
          interpretation("refill empty tray slots at the end of her turn, as after a player's turn.", "reponha os espaços vazios da bandeja no fim do turno dela, como depois do turno de um jogador."),
          interpretation("you and the Automa alternate turns, so she takes one turn after each of yours (you first, she last).", "você e a Automa alternam turnos, então ela faz um turno depois de cada turno seu (você primeiro, ela por último).")
        ], ["m2", "m3"])}
        ${infoCard(t("ACTIONS", "AÇÕES"), t("Automa icons", "Ícones da Automa"), [
          `${glyph("automa-draw-cards", "")} ${rl("Draw cards", `discard all 3 face-up birds from the tray; she takes 1 card from the deck face down into her supply (worth ${difficultyNumbers()[1]} points at the end).`, "Comprar cartas", `descarte as 3 aves viradas para cima da bandeja; ela pega 1 carta do baralho virada para baixo para a reserva dela (vale ${difficultyNumbers()[1]} pontos no fim).`)}`,
          `${glyph("automa-play-bird", "")} ${rl("Play a bird", "from the 3 face-up birds pick up all that meet her bonus card's requirement; she keeps the one with the highest point value face up (any if tied) and the rest are discarded. None qualifies: she takes 1 face-down card from the deck.", "Jogar ave", "das 3 aves viradas para cima, pegue todas que atendem à carta de bônus dela; ela fica com a de maior valor virada para cima (qualquer uma se empatar) e o resto é descartado. Nenhuma atende: ela pega 1 carta virada para baixo do baralho.")}`,
          `${glyph("automa-lay-eggs", "")} ${rl("Lay eggs", "1 egg from the supply per egg icon in the section.", "Pôr ovos", "1 ovo da reserva por ícone de ovo na seção.")}`,
          `${glyph("automa-gain-food", "")} ${rl("Gain food", "if all dice in the birdfeeder show the same face, throw all 5 in again. Then follow the food key in the section from the left: the first face that is in the birdfeeder — remove ALL dice showing it. She takes no food.", "Ganhar comida", "se todos os dados do comedouro mostram a mesma face, jogue os 5 de novo. Depois siga a chave de comida da seção pela esquerda: a primeira face que estiver no comedouro — retire TODOS os dados com ela. Ela não pega comida.")}`,
          `${glyph("automa-pink-powers", "")} ${rl("Activate all pink powers", "you activate all pink powers on your mat; she does nothing.", "Ativar todos os poderes rosa", "você ativa todos os poderes rosa do seu tabuleiro; ela não faz nada.")}`,
          !duetSolo ? `${glyph("automa-place-cube", "")} ${rl("Place end-of-round cube", "put 1 of her cubes on this round's goal tile.", "Pôr cubo de fim de rodada", "ponha 1 cubo dela na peça de objetivo desta rodada.")}` : "",
          !duetSolo ? `${glyph("automa-remove-cube", "")} ${rl("Remove end-of-round cube", "take 1 of her cubes off this round's goal tile (none there: ignore).", "Tirar cubo de fim de rodada", "tire 1 cubo dela da peça de objetivo desta rodada (se não houver: ignore).")}` : "",
          duetSolo ? rl("Duet token", "every time she takes Draw cards or Play a bird she places 1 Duet token (see “Her Duet tokens”).", "Ficha de Dueto", "toda vez que ela faz Comprar cartas ou Jogar ave, põe 1 ficha de Dueto (veja “Fichas de Dueto dela”).") : ""
        ], ["m3"])}
        ${duetSolo ? infoCard(t("HER DUET TOKENS", "FICHAS DE DUETO DELA"), t("Navigating the map", "Navegando pelo mapa"), [
          t("She ignores the bird's restrictions, gets no bonus from bonus spaces, places at most 1 token per turn and at most 15 per game.", "Ela ignora as restrições da ave, não ganha bônus dos espaços de bônus, põe no máximo 1 ficha por turno e 15 por jogo."),
          rl("Navigate", "the small map picture on the Duet map tracker card shows one of four icons in each corner (one corner shows no icon at all). Look at the icon in the right column of her Automa card that lines up with the map section of the tracker; the corner with the same icon (no icon on her card = the corner without an icon) is where she starts. Check each space of that corner's row toward the other side; then return to the starting side, move one row toward the opposite edge (down if you started at the top, up if you started at the bottom) and repeat until a space works. Example: no icon, upper-right corner → top row right to left, then the next row down right to left.", "Navegar", "o pequeno mapa na carta marcadora do mapa do Dueto mostra um de quatro ícones em cada canto (um canto não tem ícone). Veja o ícone da coluna direita da carta da Automa alinhado com a seção de mapa da marcadora; o canto com o mesmo ícone (sem ícone na carta = o canto sem ícone) é onde ela começa. Confira cada espaço da fileira desse canto em direção ao outro lado; depois volte ao lado inicial, desça ou suba uma fileira em direção à borda oposta (para baixo se começou em cima, para cima se começou embaixo) e repita até achar um espaço. Exemplo: sem ícone, canto superior direito → fileira de cima da direita para a esquerda, depois a fileira de baixo da direita para a esquerda."),
          rl("After Play a bird", "the first available space that improves her progress on this round's Duet goal; if none would, simply the first available space.", "Depois de Jogar ave", "o primeiro espaço disponível que melhora o progresso dela no objetivo do Dueto desta rodada; se nenhum melhorar, simplesmente o primeiro disponível."),
          rl("After Draw cards", "the first available space matching both the type (nest, food or other) and the habitat shown by the icons of her card that line up with the type and habitat sections of the Duet map tracker.", "Depois de Comprar cartas", "o primeiro espaço disponível que combine o tipo (ninho, comida ou outro) e o habitat indicados pelos ícones da carta dela alinhados às seções de tipo e de habitat da marcadora do mapa."),
          t("No valid space: she places no token.", "Sem espaço válido: ela não põe ficha.")
        ], ["m6", "m7"]) : ""}
        ${infoCard(t("YOUR TURN", "SEU TURNO"), hoard ? t("Automa's Hoard (variant)", "Tesouro da Automa (variante)") : t("Automa's Cache", "Esconderijo da Automa"), hoard ? [
          t("She takes part only in white and brown powers. For each resource she would gain: food or die 1 hoard token; nectar 2; card 2; egg 3; bonus card 6. Cache food or tuck a bird: 3.", "Ela participa só de poderes brancos e marrons. Por recurso que ganharia: comida ou dado 1 ficha de tesouro; néctar 2; carta 2; ovo 3; carta de bônus 6. Guardar comida ou enfiar ave: 3."),
          t("For each resource she would lose in exchange: food/die 1, nectar 1, card 1, egg 2 tokens back to the supply.", "Por recurso que perderia em troca: comida/dado 1, néctar 1, carta 1, ovo 2 fichas de volta à reserva."),
          t("She never takes part if she would lose more tokens than she gains. When she may choose a resource type she always chooses a card.", "Ela nunca participa se perderia mais fichas do que ganha. Quando pode escolher o tipo de recurso, sempre escolhe carta."),
          t("Anything you give her goes back to the supply; she gets hoard tokens instead. Do not use Automa's Cache with this variant.", "O que você der a ela volta à reserva; ela recebe fichas de tesouro no lugar. Não use o Esconderijo da Automa com esta variante.")
        ] : [
          t("When you trigger a white or brown power that should give her something: if she would have to pay something to take part, give her 1 token per thing gained; otherwise 2 tokens per thing.", "Quando você dispara um poder branco ou marrom que deveria dar algo a ela: se ela tivesse de pagar algo para participar, dê 1 ficha por coisa ganha; senão, 2 fichas por coisa."),
          t("Food tokens represent her tokens; the type does not matter. Anything you give her goes back to the supply.", "Fichas de comida representam as fichas dela; o tipo não importa. O que você der a ela volta à reserva."),
          t("She always meets any condition needed to gain from your power.", "Ela sempre cumpre qualquer condição para ganhar com o seu poder."),
          t("Examples: all players lay 2 eggs, you lay 2 more → she gains 4; each player may discard 1 egg to draw 1 card → 1; give 1 card to another player → 2; all draw 1 and keep it if it eats invertebrate or seed → 2.", "Exemplos: todos põem 2 ovos, você põe mais 2 → ela ganha 4; cada um pode descartar 1 ovo para comprar 1 carta → 1; dar 1 carta a outro jogador → 2; todos compram 1 e ficam se comer invertebrado ou semente → 2.")
        ], hoard ? ["m8"] : ["m4"])}
        ${infoCard(t("INTERACTIVE POWERS", "PODERES INTERATIVOS"), t("On your turn", "No seu turno"), [
          rl("Does she have something?", "the number of cube icons on her current Automa card is how many she has (so nothing on your first turn of a round).", "Ela tem algo?", "o número de ícones de cubo na carta atual dela é quanto ela tem (então nada no seu primeiro turno da rodada)."),
          rl("Steal / gain from her", "whatever you take comes from the supply.", "Roubar / ganhar dela", "o que você pegar vem da reserva."),
          rl("She gains or may gain", "she gains cache (or hoard) tokens instead, as many as possible — also for cache, draw, tuck.", "Ela ganha ou pode ganhar", "ela ganha fichas de esconderijo (ou tesouro), o máximo possível — também para guardar, comprar, enfiar."),
          rl("Use another player's bird", "use any power of that type from the 3 face-up birds in the tray.", "Usar a ave de outro jogador", "use qualquer poder daquele tipo das 3 aves viradas para cima da bandeja."),
          rl("Use another player's bonus cards", "draw 2 bonus cards face up into the supply: they are her bonus cards for that power.", "Usar cartas de bônus de outro jogador", "compre 2 cartas de bônus viradas para cima para a reserva: são as cartas dela para esse poder."),
          europe() ? interpretation("the European booklet ties steal and teal “other player” powers to the Automa's cubes on this round's goal tile; the newer Asia-Automa rules, which reprint the whole Automa rulebook, use the cube icons on her current card. The guide follows Asia; with original goals the two usually agree only by chance — pick one before the game.", "o livreto europeu liga poderes de roubo e poderes azul-petróleo de “outro jogador” aos cubos da Automa na peça de objetivo da rodada; as regras Asia-Automa, mais novas e que reimprimem todo o livro da Automa, usam os ícones de cubo da carta atual dela. O guia segue a Ásia; com objetivos originais as duas só coincidem por acaso — escolham uma antes do jogo.") : ""
        ], ["m4", "e11"])}
        ${infoCard(t("END OF ROUND", "FIM DA RODADA"), t("Scoring and the deck", "Pontuação e o baralho"), [
          duetSolo
            ? t("Duet goals are scored as in the 2-player Duet rules.", "Os objetivos do Dueto são pontuados como no Dueto de 2 jogadores.")
            : t("Her quantity = the base value on the current scoring card (match the symbols of this round's goal tile) + her cubes on the goal tile. Like you, she needs more than 0 to score; at most 5 birds for a “birds in a habitat row” goal. Mark her rank (or score on the blue side) with one of her cubes and return the cubes on the tile to her supply. Put the scoring card for the next round beside the next goal tile.", "A quantidade dela = o valor base da carta de pontuação atual (combine com os símbolos da peça desta rodada) + os cubos dela na peça. Como você, ela precisa de mais de 0 para pontuar; no máximo 5 aves num objetivo de “aves numa fileira de habitat”. Marque a posição dela (ou a pontuação no lado azul) com um cubo dela e devolva os cubos da peça para a reserva dela. Ponha a carta de pontuação da próxima rodada ao lado da próxima peça."),
          t("After round 4 skip to the end of the game.", "Depois da rodada 4 vá direto ao fim de jogo."),
          t("Otherwise flip the current-round tracker so the next round shows in the banner and its arrow points right" + (duetSolo ? "; do the same with the Duet map tracker, immediately to its right." : "."), "Senão, vire a marcadora de rodada para a próxima rodada aparecer no topo, com a seta apontando para a direita" + (duetSolo ? "; faça o mesmo com a marcadora do mapa do Dueto, logo à direita." : ".")),
          t("Remove (to the box) the Automa card that says “Remove after round” for the round just completed, reshuffle the Automa deck and put it beside the tracker card(s).", "Remova (para a caixa) a carta da Automa que diz “Remove after round” da rodada que acabou, embaralhe o baralho da Automa e ponha-o ao lado da(s) marcadora(s)."),
          interpretation("“reshuffle the Automa deck” includes the cards revealed this round (on the tracker); only the removed card leaves.", "“embaralhe o baralho da Automa” inclui as cartas reveladas nesta rodada (sobre a marcadora); só a carta removida sai."),
          europe() && !duetSolo ? t("Europe: 2 more scoring cards give her base values for the European goal tiles.", "Europa: mais 2 cartas de pontuação dão os valores base dela para as peças europeias.") : ""
        ], ["m5", "e11"])}
      </div>`;
  }

  function expansionsSection() {
    const cards = [];
    if (europe()) {
      cards.push(infoCard(t("EUROPE", "EUROPA"), t("Power clarifications", "Esclarecimentos de poderes"), [
        rl("Reset the birdfeeder… gain", "if the named food is not there after the reset, you gain nothing.", "Reiniciar o comedouro… ganhar", "se a comida citada não estiver lá depois do reinício, você não ganha nada."),
        rl("Steal from another player", "they then gain 1 food of their choice from the birdfeeder (not necessarily the type stolen).", "Roubar de outro jogador", "ele então ganha 1 comida à escolha do comedouro (não necessariamente o tipo roubado)."),
        rl("Coal Tit / Eurasian Nuthatch", "food cached there can be spent at any time, but does not count as in your supply for goals.", "Coal Tit / Eurasian Nuthatch", "comida guardada ali pode ser gasta a qualquer momento, mas não conta como reserva para objetivos."),
        rl("Pay cards instead of food (Bonelli's Eagle, Northern Goshawk…)", "each card paid is tucked; counts as tucking and as a predator succeeding (pink triggers).", "Pagar cartas em vez de comida (Bonelli's Eagle, Northern Goshawk…)", "cada carta paga é enfiada; conta como enfiar e como predador bem-sucedido (dispara rosa)."),
        rl("Play on top of another bird (Common Buzzard, Red Kite…)", "pay neither food nor eggs; the covered bird's eggs are discarded and it becomes a tucked card (its tucked cards stay). Counts as tucking and as a predator succeeding.", "Jogar sobre outra ave (Common Buzzard, Red Kite…)", "não paga comida nem ovos; os ovos da ave coberta são descartados e ela vira carta enfiada (as cartas enfiadas nela ficam). Conta como enfiar e como predador bem-sucedido."),
        rl("Sideways birds (Long-tailed Tit, European Roller, Common Blackbird, Grey Heron)", "cover 2 spaces, pay the lower egg cost; the next bird goes to their right. Played in column 5 they simply lose the power.", "Aves de lado (Long-tailed Tit, European Roller, Common Blackbird, Grey Heron)", "cobrem 2 espaços, pagam o menor custo em ovos; a próxima ave vai à direita delas. Jogadas na coluna 5 só perdem o poder."),
        rl("Play another bird (round end / when activated)", "its white power triggers; a teal power on that bird also triggers when played that way.", "Jogar outra ave (fim de rodada / quando ativado)", "o poder branco dela é disparado; um poder azul-petróleo dela também dispara quando jogada assim."),
        rl("Draw cards to keep 1 (Great Crested Grebe, Wilson's Storm-Petrel)", "keep them apart; they cannot be spent this turn; sort them at the end of your turn while the next player starts.", "Comprar cartas para ficar com 1 (Great Crested Grebe, Wilson's Storm-Petrel)", "deixe-as separadas; não podem ser gastas neste turno; escolha no fim do turno enquanto o próximo começa."),
        rl("Bonus-card birds (Red Knot…)", "you may look at the bonus card before the second part of the power.", "Aves de carta de bônus (Red Knot…)", "pode olhar a carta de bônus antes da segunda parte do poder."),
        rl("Bonus words", "Cartographer: Eurasian, European, Corsican, Moor; Anatomist: back, leg, toe; Photographer: coal, grey" + (oceania() ? " (Oceania corrects the European booklet: honey is not a colour)" : ", honey") + ".", "Palavras de bônus", "Cartographer: Eurasian, European, Corsican, Moor; Anatomist: back, leg, toe; Photographer: coal, grey" + (oceania() ? " (a Oceania corrige o livreto europeu: honey não é cor)" : ", honey") + ".")
      ], ["e2", "e4", "e5", "e7", "e9", "e10"]));
    }
    if (oceania()) {
      cards.push(infoCard(t("OCEANIA", "OCEANIA"), t("Power clarifications", "Esclarecimentos de poderes"), [
        rl("Game-end egg layers", "eggs are laid after scoring round 4's goal; the bird's egg limit still applies.", "Aves que põem ovos no fim", "os ovos são postos depois de pontuar o objetivo da rodada 4; o limite de ovos da ave vale."),
        rl("Play a bird at game end (Magpie-Lark, Gould's Finch, Grey-Headed Mannikin)", "only white or game-end powers of that bird may be used; nectar is already discarded, so make nectar with 2-for-1.", "Jogar ave no fim (Magpie-Lark, Gould's Finch, Grey-Headed Mannikin)", "só os poderes brancos ou de fim de jogo dessa ave podem ser usados; o néctar já foi descartado, então faça néctar com 2 por 1."),
        rl("Reset the birdfeeder and gain…", "remove the die when you gain, as usual; roll only once for Masked Lapwing.", "Reiniciar o comedouro e ganhar…", "retire o dado ao ganhar, como sempre; o Masked Lapwing rola só uma vez."),
        rl("Southern Cassowary", "replace a forest bird (its eggs, cache and tucked cards are discarded), pay food but no eggs, then lay 4 eggs and gain 2 fruit; on an empty space pay eggs and get nothing extra.", "Southern Cassowary", "substitui uma ave da floresta (ovos, comida guardada e cartas enfiadas dela são descartados), paga comida mas não ovos, depois põe 4 ovos e ganha 2 frutas; num espaço vazio paga ovos e não ganha extra."),
        rl("Copy a brown power (Superb Lyrebird, Tūī)", "only a brown “when activated” power of the neighbour's named habitat.", "Copiar poder marrom (Superb Lyrebird, Tūī)", "só um poder marrom “quando ativado” do habitat indicado do vizinho."),
        rl("Discard piles", "discarded bonus cards and birds stay separate from their decks even when a power shuffles or searches them.", "Pilhas de descarte", "cartas de bônus e aves descartadas ficam separadas dos baralhos mesmo quando um poder as embaralha ou procura."),
        rl("Bonus words", "Photographer: crimson, orange, pink, rufous, silver, sulphur, tawny; Cartographer: Australasian, Australian, mallee, New Holland, North, Pacific, plains, sea, scrub, South; Anatomist: back, ear, foot, head, mouth, wattle (not Mistletoebird's “toe”).", "Palavras de bônus", "Photographer: crimson, orange, pink, rufous, silver, sulphur, tawny; Cartographer: Australasian, Australian, mallee, New Holland, North, Pacific, plains, sea, scrub, South; Anatomist: back, ear, foot, head, mouth, wattle (não o “toe” do Mistletoebird)."),
        rl("Data Analyst (forest/grassland/wetland)", "consecutive birds in that row with ascending or descending wingspans, equal allowed, anywhere in the row: 3 birds 3, 4 birds 5, 5 birds 8 points.", "Data Analyst (floresta/campo/pântano)", "aves consecutivas na fileira com envergadura crescente ou decrescente, iguais valem, em qualquer trecho: 3 aves 3, 4 aves 5, 5 aves 8 pontos."),
        rl("Mechanical Engineer", "sets of all 4 nest types among your birds; a star fills one type in one set; 1 set 3, 2 sets 8.", "Mechanical Engineer", "conjuntos dos 4 tipos de ninho entre as suas aves; uma estrela preenche um tipo em um conjunto; 1 conjunto 3, 2 conjuntos 8."),
        rl("Site Selection Expert", "per column: 2 matching nests 1 point, 3 matching 3 points; a star counts once.", "Site Selection Expert", "por coluna: 2 ninhos iguais 1 ponto, 3 iguais 3 pontos; uma estrela conta uma vez.")
      ], ["o4", "o5", "o6", "o7", "o8", "o10", "o11"]));
    }
    if (asia()) {
      cards.push(infoCard(t("ASIA", "ÁSIA"), t("Mixing the boxes", "Misturando as caixas"), [
        t("Asia birds and bonus cards can be combined with the base game and the other expansions (and vice versa); Asia cards carry a red “A” in the bottom-right corner.", "As aves e cartas de bônus da Ásia podem ser combinadas com o jogo base e as outras expansões (e vice-versa); as cartas da Ásia têm um “A” vermelho no canto inferior direito."),
        t("If you know Wingspan, there are no new rules outside Duet and Flock; there are new bird powers (their texts are on the cards; the Asia Appendix is not in the supplied file).", "Quem já conhece Wingspan não tem regras novas fora do Dueto e da Revoada; há novos poderes de aves (os textos estão nas cartas; o Apêndice da Ásia não está no arquivo fornecido)."),
        base() ? t("Historian: Asia has no birds named after people, so leave the base Historian out. Photographer, Cartographer and Anatomist have updated Asia versions; you can discard the originals.", "Historian: a Ásia não tem aves com nomes de pessoas, então deixe a Historian da base fora. Photographer, Cartographer e Anatomist têm versões atualizadas na Ásia; pode descartar as originais.") : "",
        t("Wingspans of Asian birds were extrapolated where no measurement existed; use the number printed.", "As envergaduras das aves asiáticas foram extrapoladas onde não havia medida; use o número impresso.")
      ], ["a2", "a15", "a16"]));
    }
    return `
      ${sectionHeading("expansions", t("Expansion notes", "Notas das expansões"), ["e2", "o4", "a16"])}
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  function iconsSection() {
    const items = [
      ["action-play-bird", t("Play a bird", "Jogar uma ave"), t("Action 1: play a bird from your hand.", "Ação 1: jogar uma ave da mão."), base() ? "c6" : "a6"],
      ["action-gain-food", t("Forest · gain food", "Floresta · ganhar comida"), t("Action 2 and the forest habitat.", "Ação 2 e o habitat de floresta."), base() ? "c7" : "a7"],
      ["action-lay-eggs", t("Grassland · lay eggs", "Campo · pôr ovos"), t("Action 3 and the grassland habitat.", "Ação 3 e o habitat de campo."), base() ? "c8" : "a8"],
      ["action-draw-cards", t("Wetland · draw cards", "Pântano · comprar cartas"), t("Action 4 and the wetland habitat.", "Ação 4 e o habitat de pântano."), base() ? "c9" : "a9"],
      ["habitat-forest", t("Forest", "Floresta"), t("Habitat symbol on the card: the bird may go in the forest row.", "Símbolo de habitat na carta: a ave pode ir na fileira da floresta."), base() ? "c6" : "a6"],
      ["habitat-grassland", t("Grassland", "Campo"), t("The bird may go in the grassland row.", "A ave pode ir na fileira do campo."), base() ? "c6" : "a6"],
      ["habitat-wetland", t("Wetland", "Pântano"), t("The bird may go in the wetland row.", "A ave pode ir na fileira do pântano."), base() ? "c6" : "a6"],
      ["food-invertebrate", t("Invertebrate", "Invertebrado"), t("A caterpillar; stands for all insects and similar prey.", "Uma lagarta; representa todos os insetos e presas parecidas."), base() ? "c6" : "a6"],
      ["food-seed", t("Seed", "Semente"), t("Seed food.", "Comida semente."), base() ? "c6" : "a6"],
      ["food-fish", t("Fish", "Peixe"), t("Fish food.", "Comida peixe."), base() ? "c6" : "a6"],
      ["food-fruit", t("Fruit", "Fruta"), t("Fruit food.", "Comida fruta."), base() ? "c6" : "a6"],
      ["food-rodent", t("Rodent", "Roedor"), t("Rodent food.", "Comida roedor."), base() ? "c6" : "a6"],
      ["food-wild", t("Wild", "Curinga"), t("In a food cost: pay any of the 5 foods" + (oceania() ? " (or nectar)" : "") + ".", "No custo: pague qualquer das 5 comidas" + (oceania() ? " (ou néctar)" : "") + "."), base() ? "c6" : "a6"],
      ["no-food", t("No food", "Sem comida"), t("Crossed-out circle: the bird has no food cost.", "Círculo riscado: a ave não tem custo em comida."), base() ? "c6" : "a6"],
      ["two-for-one", t("2 food = 1", "2 comidas = 1"), t("When playing a bird, any 2 food tokens pay as any 1.", "Ao jogar uma ave, quaisquer 2 fichas pagam como 1 qualquer."), base() ? "c6" : "a6", "wide"],
      ["nest-platform", t("Platform nest", "Ninho plataforma"), t("Nest type, under the score; used by goals and bonus cards.", "Tipo de ninho, sob a pontuação; usado por objetivos e bônus."), base() ? "c8" : "a8"],
      ["nest-bowl", t("Bowl nest", "Ninho tigela"), t("Nest type.", "Tipo de ninho."), base() ? "c8" : "a8"],
      ["nest-cavity", t("Cavity nest", "Ninho cavidade"), t("Nest type.", "Tipo de ninho."), base() ? "c8" : "a8"],
      ["nest-ground", t("Ground nest", "Ninho no chão"), t("Nest type.", "Tipo de ninho."), base() ? "c8" : "a8"],
      ["nest-star", t("Star nest", "Ninho estrela"), t("Wild: matches any nest type for goals, bonus cards" + (asia() ? ", bird powers and the Duet map" : "") + ".", "Curinga: vale qualquer tipo de ninho para objetivos, bônus" + (asia() ? ", poderes e o mapa do Dueto" : "") + "."), base() ? "c8" : "a8"],
      ["predator", t("Predator", "Predador"), t("The bird has a predator power.", "A ave tem poder de predador."), base() ? "c10" : "a12"],
      ["tuck", t("Flocking", "Bando"), t("The power tucks bird cards under this bird; each is 1 point.", "O poder enfia cartas de aves sob esta ave; cada uma vale 1 ponto."), base() ? "c10" : "a12"],
      ...(oceania() ? [
        ["nectar", t("Nectar", "Néctar"), t("Oceania's wild food; discarded at round end if unspent.", "Comida curinga da Oceania; descartada no fim da rodada se não gasta."), "o3"],
        ["spent-nectar", t("Spent nectar space", "Espaço de néctar gasto"), t("One per habitat on the Oceania mat: 5/2 points for majorities at game end.", "Um por habitat no tabuleiro da Oceania: 5/2 pontos por maioria no fim."), "o3", "wide"],
        ["reset-birdfeeder", t("Reset birdfeeder", "Reiniciar comedouro"), t("Forest columns 2 and 4: discard 1 food to reroll the birdfeeder.", "Floresta colunas 2 e 4: descarte 1 comida para rolar o comedouro de novo."), "o3", "wide"],
        ["reset-tray", t("Reset bird tray", "Reiniciar bandeja"), t("Wetland columns 2 and 4: discard 1 food to replace the tray.", "Pântano colunas 2 e 4: descarte 1 comida para trocar a bandeja."), "o3", "wide"]
      ] : []),
      ...(duetMap() ? [["duet-token", t("Duet token", "Ficha de Dueto"), t("15 per player on the mat's bird slots; moved to the Duet map when you play a bird.", "15 por jogador nos espaços de ave do tabuleiro; vão para o mapa quando você joga uma ave."), "a1"]] : []),
      ...(flock() ? [["flock-dial", t("Turn-order dial", "Disco de ordem de turno"), t("Points to the 2 active players; the star marks the first player.", "Aponta os 2 jogadores ativos; a estrela marca o primeiro jogador."), "a3"]] : []),
      ...(solo() ? [
        ["automa-draw-cards", t("Automa: draw cards", "Automa: comprar cartas"), t("Discard the tray; she takes 1 face-down card.", "Descarte a bandeja; ela pega 1 carta virada para baixo."), "m3"],
        ["automa-play-bird", t("Automa: play a bird", "Automa: jogar ave"), t("She keeps the best face-up bird for her bonus card.", "Ela fica com a melhor ave virada para cima, segundo a carta de bônus dela."), "m3"],
        ["automa-lay-eggs", t("Automa: egg", "Automa: ovo"), t("1 egg per icon.", "1 ovo por ícone."), "m3"],
        ["automa-gain-food", t("Automa: gain food", "Automa: ganhar comida"), t("Remove all dice of the first available face in the key.", "Retire todos os dados da primeira face disponível na chave."), "m3"],
        ["automa-pink-powers", t("Automa: pink powers", "Automa: poderes rosa"), t("You activate all your pink powers.", "Você ativa todos os seus poderes rosa."), "m3"],
        ...(soloOriginal() ? [
          ["automa-place-cube", t("Automa: place cube", "Automa: pôr cubo"), t("1 of her cubes onto this round's goal tile.", "1 cubo dela na peça desta rodada."), "m3"],
          ["automa-remove-cube", t("Automa: remove cube", "Automa: tirar cubo"), t("1 of her cubes off this round's goal tile.", "1 cubo dela fora da peça desta rodada."), "m3"]
        ] : [])
      ] : [])
    ];
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), ["c6", "c8", "c10", "a6", "a8", "a12"])}
      <p class="glossary-intro">${t("Each picture is cut from the supplied rulebooks and shown with the rulebook's explanation.", "Cada imagem foi recortada dos livros fornecidos e aparece com a explicação do livro.")}</p>
      <div class="icon-grid">
        ${items.map(([file, name, text, code, wide]) => `
          <article class="icon-card ${wide ? "ws-icon-wide" : ""}">
            <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}.webp" alt="${name}" loading="lazy"></span>
            <div><strong>${name}</strong><p>${text}</p>${referenceLink(code)}</div>
          </article>`).join("")}
      </div>`;
  }

  function examplesSection() {
    const ex = (labelCode, title, lines, codes) => infoCard(t(`EXAMPLE · ${labelCode}`, `EXEMPLO · ${labelCode}`), title, lines, codes);
    const cards = [
      ex(base() ? "Base p. 2" : "Asia p. 2", t("Starting choice", "Escolha inicial"), [
        t("You might keep 2 bird cards and 3 food, or 4 bird cards and 1 food.", "Você pode ficar com 2 cartas de aves e 3 comidas, ou 4 cartas e 1 comida.")
      ], ["c2", "a2"]),
      ex(base() ? "Base p. 7" : "Asia p. 7", t("Gain food", "Ganhar comida"), [
        t("Gain 1 food token from a die.", "Ganhe 1 ficha de comida de um dado."),
        t("Then you may discard 1 bird card to gain another food from a die.", "Depois pode descartar 1 carta de ave para ganhar outra comida de um dado."),
        t("Then you may activate the forest bird's brown power (e.g. gain 1 invertebrate from the supply).", "Depois pode ativar o poder marrom da ave da floresta (ex.: ganhe 1 invertebrado da reserva).")
      ], ["c7", "a7"]),
      ex(base() ? "Base p. 8" : "Asia p. 8", t("Lay eggs", "Pôr ovos"), [
        t("Lay 2 eggs.", "Ponha 2 ovos."),
        t("Then you may pay 1 food to lay another egg.", "Depois pode pagar 1 comida para pôr outro ovo."),
        t("Then you may activate the grassland bird's power.", "Depois pode ativar o poder da ave do campo.")
      ], ["c8", "a8"]),
      ex(base() ? "Base p. 9" : "Asia p. 9", t("Draw cards", "Comprar cartas"), [
        t("Draw 1 bird card.", "Compre 1 carta de ave."),
        t("Then you may discard 1 egg to draw another card.", "Depois pode descartar 1 ovo para comprar outra carta."),
        t("Then you may activate the wetland bird's power.", "Depois pode ativar o poder da ave do pântano.")
      ], ["c9", "a9"]),
      ex(base() ? "Base p. 6" : "Asia p. 6", t("2 food for 1", "2 comidas por 1"), [
        t("You need 1 fish but have none: pay any other 2 food tokens instead (only when playing a bird).", "Precisa de 1 peixe e não tem: pague quaisquer outras 2 fichas no lugar (só ao jogar ave).")
      ], ["c6", "a6"])
    ];
    if (goalBoardSides() && state.side === "green") {
      cards.push(ex("Base p. 11", t("Tie on the green side", "Empate no lado verde"), [
        t("Goal paying 5 / 2 / 1. Two players tie for 1st: each scores 3 ((5 + 2) ÷ 2, rounded down).", "Objetivo que paga 5 / 2 / 1. Dois jogadores empatam em 1º: cada um marca 3 ((5 + 2) ÷ 2, para baixo)."),
        t("Nobody is awarded 2nd place.", "Ninguém recebe o 2º lugar.")
      ], ["c11", "a15"]));
    }
    if (oceania()) {
      cards.push(ex("Oceania p. 3–4", t("Nectar ties and Data Analyst", "Empates de néctar e Data Analyst"), [
        flock() ? t("Flock uses friendly ties instead: two players tied for most nectar in a habitat both get 5, and the next player still gets 2.", "A Revoada usa empates amigáveis: dois empatados em mais néctar num habitat levam 5 cada, e o próximo jogador ainda leva 2.") : t("Two players tied for most nectar in a habitat get 3 each; two tied for second get 1 each.", "Dois empatados em mais néctar num habitat levam 3 cada; dois empatados em segundo, 1 cada."),
        t("Wetland wingspans ascending for the first 3 birds, then the 4th is smaller than the 3rd: the sequence is 3, so Wetland Data Analyst gives 3 points.", "Envergaduras do pântano crescentes nas 3 primeiras aves e a 4ª menor que a 3ª: a sequência é 3, então o Wetland Data Analyst dá 3 pontos."),
        t("Mechanical Engineer: cavity + platform + 2 stars = 1 set; 2 bowl + 2 cavity + 2 platform + 1 star = only 1 set.", "Mechanical Engineer: cavidade + plataforma + 2 estrelas = 1 conjunto; 2 tigelas + 2 cavidades + 2 plataformas + 1 estrela = só 1 conjunto.")
      ], ["o3", "o4"]));
    }
    if (duetMap()) {
      cards.push(ex("Asia p. 10", t("Placing a Duet token", "Pondo uma ficha de Dueto"), [
        t("The Brown Shrike was played in the grassland, so its token may go on a free grassland-region space showing invertebrate, rodent, bowl nest, &lt;50 cm or left-facing beak.", "O Brown Shrike foi jogado no campo, então a ficha pode ir num espaço livre da região do campo com invertebrado, roedor, ninho tigela, &lt;50 cm ou bico para a esquerda."),
        t("The white player placed it on a bowl-nest space in the grassland region.", "O jogador branco a pôs num espaço de ninho tigela na região do campo.")
      ], ["a10"]));
      cards.push(ex("Asia p. 14", t("Largest group", "Maior grupo"), [
        t("In the board snippet the white player's largest connected group has 4 tokens (4 points) and the black player's has 3 (3 points).", "No trecho do mapa o maior grupo conectado do branco tem 4 fichas (4 pontos) e o do preto tem 3 (3 pontos).")
      ], ["a14"]));
    }
    if (solo()) {
      cards.push(ex("Asia Automa p. 3", t("Automa plays a bird", "A Automa joga uma ave"), [
        t("Her bonus card is Cartographer: she picks up every face-up bird with a geography term in its name, keeps the highest-value one face up and discards the rest.", "A carta de bônus dela é Cartographer: ela pega toda ave virada para cima com termo geográfico no nome, fica com a de maior valor virada para cima e descarta as outras.")
      ], ["m3"]));
      if (state.automa === "hoard") {
        cards.push(ex("Asia Automa p. 8", t("Hoard tokens", "Fichas de tesouro"), [
          t("All players may tuck a card from hand and/or cache 1 fruit from supply: she gains 6 (3 + 3) and returns 2 (1 for the card, 1 for the fruit).", "Todos podem enfiar uma carta da mão e/ou guardar 1 fruta da reserva: ela ganha 6 (3 + 3) e devolve 2 (1 pela carta, 1 pela fruta)."),
          t("Others may discard any 2 resources to draw a bonus card and keep 1: she gains 6 for the bonus card and returns 2 for two cards.", "Os outros podem descartar 2 recursos quaisquer para comprar carta de bônus e ficar com 1: ela ganha 6 pela carta de bônus e devolve 2 por duas cartas."),
          t("All players may discard an egg to gain 1 wild food: she would gain 1 but lose 2, so she does nothing.", "Todos podem descartar um ovo para ganhar 1 comida curinga: ela ganharia 1 mas perderia 2, então não faz nada.")
        ], ["m8"]));
      }
    }
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), ["c6", "c7", "c8", "c9", "c11", "a10", "a14"])}
      <p class="glossary-intro">${t("The rulebooks' examples, filtered to this match.", "Os exemplos dos livros, filtrados para esta partida.")}</p>
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  function faqSection() {
    const items = [
      [t("Where are the bonus cards and base goals explained?", "Onde estão explicadas as cartas de bônus e os objetivos da base?"), t("In the base game's Appendix, which is in the box but not supplied. The guide uses what the cards and tiles print; European and Oceania goals and Oceania bonus cards are explained in their booklets and repeated here.", "No Apêndice do jogo base, que vem na caixa mas não foi fornecido. O guia usa o que as cartas e peças imprimem; objetivos europeus e da Oceania e as cartas de bônus da Oceania estão nos livretos e foram repetidos aqui."), base() ? "c11" : "a15"],
      [t("Base and expansion round-end orders differ: which one?", "As ordens de fim de rodada da base e das expansões diferem: qual vale?"), t("The base book removes cubes before scoring; Europe, Oceania and Asia score first and keep cubes on the mats until after scoring because some powers and goals count them. The guide always uses the expansion order — with the base alone the result is the same.", "O livro base tira os cubos antes de pontuar; Europa, Oceania e Ásia pontuam antes e mantêm os cubos nos tabuleiros até depois, porque alguns poderes e objetivos os contam. O guia usa sempre a ordem das expansões — só com a base o resultado é o mesmo."), "e1"],
      ...(base() && !asia() ? [] : [[t("Do Europe and Oceania need the base box?", "Europa e Oceania precisam da caixa base?"), t("Their booklets assume you add them to Wingspan. Asia is stand-alone and says its cards combine with previous expansions, so the guide lets you mix Europe or Oceania into an Asia-only Duet or Solo game.", "Os livretos supõem que você as acrescenta a Wingspan. A Ásia é independente e diz que as cartas combinam com expansões anteriores, então o guia permite misturar Europa ou Oceania num Dueto ou Solo só com a Ásia."), "a1"]]),
      ...(solo() ? [
        [t("How many turns does the Automa take?", "Quantos turnos a Automa faz?"), t("The booklet says only that you take the first turn and she takes the last. The guide alternates: one Automa turn after each of yours.", "O livreto diz só que você faz o primeiro turno e ela o último. O guia alterna: um turno da Automa depois de cada turno seu."), "m2"],
        [t("Is the base Automa needed?", "A Automa da base é necessária?"), t("The supplied Automa rules (in the Asia booklet) reprint the full original Automa rules and use Asia's Automa cards and tracker cards. The end-of-round goal scoring cards for original goals come from the base box (not listed in the supplied base rulebook) and Europe.", "As regras de Automa fornecidas (no livreto da Ásia) reimprimem todas as regras originais da Automa e usam as cartas e marcadoras da Ásia. As cartas de pontuação de objetivos para os objetivos originais vêm da caixa base (não listadas no livro base fornecido) e da Europa."), "m1"],
        ...(oceania() ? [[t("Automa and nectar?", "Automa e néctar?"), t("The supplied Automa rules only price nectar in the Hoard variant. The guide gives the Automa no nectar majority and leaves Oceania goal tiles out of original-goal solo games (no scoring card for them).", "As regras de Automa fornecidas só dão preço ao néctar na variante do Tesouro. O guia não dá maioria de néctar à Automa e deixa as peças de objetivo da Oceania fora do solo com objetivos originais (não há carta de pontuação para elas)."), "o3"]] : [])
      ] : []),
      ...(flock() ? [[t("Do you need at least 1 item on the Flock goal board?", "É preciso ter pelo menos 1 item no tabuleiro da Revoada?"), t("Asia only describes friendly ties. The guide keeps the base rule: at least 1 of the item to score, and everyone still places a cube.", "A Ásia só descreve os empates amigáveis. O guia mantém a regra da base: ao menos 1 do item para pontuar, e todos ainda põem um cubo."), "a14"]] : []),
      ...(duet() || (solo() && state.soloGoals === "duet") ? [[t("Which side of a Duet goal tile is used?", "Qual lado da peça de objetivo do Dueto é usado?"), t("The booklet says the tiles are double-sided and placed at random; the guide uses whichever side comes up.", "O livreto diz que as peças são dupla face e postas ao acaso; o guia usa o lado que sair."), "a2"]] : []),
      ...(oceania() && duetMap() && !flock() ? [[t("Which dice with Oceania in a Duet or Asia game?", "Quais dados com a Oceania num Dueto ou jogo com a Ásia?"), t("Oceania replaces all 5 food dice with its 5 nectar dice; the guide does the same on the Asia birdfeeder board.", "A Oceania troca os 5 dados de comida pelos 5 dados de néctar dela; o guia faz o mesmo no tabuleiro-comedouro da Ásia."), "o1"]] : [])
    ];
    return `
      ${sectionHeading("faq", t("Guide's readings", "Leituras do guia"), ["c11", "e1", "a1", "m2"])}
      <p class="glossary-intro">${t("Where the rulebooks are silent or disagree, this guide states its own reading, labelled as such.", "Onde os livros são omissos ou divergem, este guia dá a sua própria leitura, identificada como tal.")}</p>
      <div class="quick-grid">${items.map(([q, a, code]) => `
        <article class="info-card">
          <span class="component-label">${t("GUIDE'S READING", "LEITURA DO GUIA")}</span>
          <h3>${q}</h3>
          <p>${a}</p>
          ${codeAvailable(code) ? referenceLink(code) : ""}
        </article>`).join("")}</div>`;
  }

  function glossarySection() {
    const code = (c, a) => (base() ? c : a);
    const visible = [
      { term: ["Action cube", "Cubo de ação"], text: ["8 per player; one per turn, one per round spent on the goal.", "8 por jogador; um por turno, um por rodada gasto no objetivo."], code: code("c4", "a4") },
      { term: ["Birdfeeder", "Comedouro"], text: ["The dice you gain food from; all 5 are thrown back in when it is empty, and may be when the dice left show one face.", "Os dados de onde se ganha comida; os 5 voltam a ser jogados quando ele esvazia, e podem voltar quando os dados restantes mostram uma só face."], code: code("c7", "a7") },
      { term: ["Bird tray", "Bandeja de aves"], text: ["3 face-up birds you may draw; refilled at the end of the turn, replaced every round.", "3 aves viradas para cima que podem ser compradas; repostas no fim do turno, trocadas a cada rodada."], code: code("c9", "a9") },
      { term: ["Cache", "Guardar (cache)"], text: ["Food placed on a bird: 1 point, cannot be spent.", "Comida posta numa ave: 1 ponto, não pode ser gasta."], code: code("c10", "a12") },
      { term: ["Tuck", "Enfiar (tuck)"], text: ["Slide a bird card under a bird: 1 point each.", "Pôr uma carta de ave sob uma ave: 1 ponto cada."], code: code("c10", "a12") },
      { term: ["Egg limit", "Limite de ovos"], text: ["The egg icons on a bird: the most eggs it can hold.", "Os ícones de ovo na ave: o máximo de ovos que ela comporta."], code: code("c8", "a8") },
      { term: ["Exposed slot", "Espaço exposto"], text: ["The leftmost slot of a row not covered by a bird; it sets the benefit of that action.", "O espaço mais à esquerda da fileira não coberto por ave; define o benefício da ação."], code: code("c4", "a4") },
      { term: ["Habitat", "Habitat"], text: ["Forest, grassland or wetland: the three rows of your mat.", "Floresta, campo ou pântano: as três fileiras do tabuleiro."], code: code("c6", "a6") },
      { term: ["Bonus card", "Carta de bônus"], text: ["Secret end-game scoring condition; you keep 1 of 2 at the start.", "Condição secreta de pontuação no fim; você fica com 1 de 2 no início."], code: code("c11", "a15") },
      { term: ["Supply", "Reserva"], text: ["General supply of food and eggs; “your supply” = the food next to your mat.", "Reserva geral de comida e ovos; “sua reserva” = a comida ao lado do tabuleiro."], code: code("c2", "a2") },
      { term: ["Reset the birdfeeder", "Reiniciar o comedouro"], text: ["Roll all 5 dice again.", "Rolar os 5 dados de novo."], code: code("c7", "a7") },
      { term: ["Reset the bird tray", "Reiniciar a bandeja"], text: ["Discard the face-up birds and deal 3 new ones.", "Descartar as aves viradas para cima e pôr 3 novas."], code: code("c9", "a9") },
      ...(oceania() ? [{ term: ["Nectar", "Néctar"], text: ["Oceania's wild food; spent nectar scores majorities.", "Comida curinga da Oceania; néctar gasto pontua por maioria."], code: "o2" }, { term: ["Flightless", "Não voadora"], text: ["A * wingspan: wild for wingspan conditions.", "Envergadura *: curinga para condições de envergadura."], code: "o3" }] : []),
      ...(duetMap() ? [{ term: ["Duet token", "Ficha de Dueto"], text: ["Marks the map spaces you claimed.", "Marca os espaços do mapa que você ocupou."], code: "a10" }, { term: ["Contiguous", "Contíguo"], text: ["Map spaces connected by a printed line.", "Espaços do mapa ligados por uma linha impressa."], code: "a14" }] : []),
      ...(flock() ? [{ term: ["Active player", "Jogador ativo"], text: ["One of the 2 players the dial points to.", "Um dos 2 jogadores apontados pelo disco."], code: "a11" }, { term: ["Friendly tie", "Empate amigável"], text: ["Tied players all score fully; the next place is still awarded.", "Todos os empatados pontuam cheio; a próxima posição continua valendo."], code: "a14" }] : []),
      ...(solo() ? [{ term: ["Automa", "Automa"], text: ["The artificial opponent run by the Automa deck.", "O oponente artificial movido pelo baralho da Automa."], code: "m1" }, { term: ["Tracker card", "Carta marcadora"], text: ["Shows the current round; Automa cards are lined up against its arrow.", "Mostra a rodada atual; as cartas da Automa se alinham à seta dela."], code: "m2" }] : [])
    ];
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), ["c4", "c10", "a12"])}
      <div class="quick-grid glossary-grid">${visible.map((item) => `
        <article class="info-card glossary-card">
          <span class="component-label">${t("TERM", "TERMO")}</span>
          <h3>${t(item.term[0], item.term[1])}</h3>
          <p>${t(item.text[0], item.text[1])}</p>
          ${codeAvailable(item.code) ? referenceLink(item.code) : ""}
        </article>`).join("")}</div>`;
  }

  // ---------- render ----------

  function renderInto(host) {
    root = host;
    document.body.classList.add("theme-wingspan");
    document.documentElement.lang = state.language;
    document.title = t("Wingspan — Field Manual", "Wingspan — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Wingspan with the European, Oceania and Asia expansions: setup by boxes and mode, the four actions, bird powers, nectar, goals, Duet, Flock and solo Automa.",
        "Regras interativas bilíngues de Wingspan com as expansões Europa, Oceania e Ásia: preparação por caixas e modo, as quatro ações, poderes das aves, néctar, objetivos, Dueto, Revoada e Automa solo."
      );
    }
    const playersMeta = solo() ? t("1 player", "1 jogador") : duet() ? t("2 players", "2 jogadores") : flock() ? t("6–7 players", "6–7 jogadores") : t("2–5 players", "2–5 jogadores");
    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook", "Livro interativo")}</p>
          <h1>Wingspan</h1>
          <p class="hero-intro">${t(
            "Attract birds to your wildlife preserve. Each bird extends a chain of combos in its habitat: the forest brings food, the grassland eggs, the wetland new cards. Four rounds, fewer actions each time — make every one count.",
            "Atraia aves para o seu santuário. Cada ave estende uma cadeia de combos no seu habitat: a floresta traz comida, o campo ovos, o pântano novas cartas. Quatro rodadas, menos ações a cada vez — faça cada uma valer."
          )}</p>
          <div class="hero-meta"><span>${playersMeta}</span><span>${flock() ? t("~2 h", "~2 h") : t("40–70 min", "40–70 min")}</span><span>${t("Engine building", "Construção de motor")}</span><span>${boxesLabel()}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/wingspan.webp" alt="${t("First page of the Wingspan rulebook with the components", "Primeira página do livro de regras de Wingspan com os componentes")}" fetchpriority="high"><figcaption>${t("Base rulebook, page 1", "Livro base, página 1")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("Field notebook", "Caderno de campo")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column ws-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied rulebooks: Wingspan base (12 pages), European Expansion (12), Oceania Expansion (12) and Wingspan Asia (16, with the 8-page Asia-Automa rules in the same file). Not supplied: the base Appendix (bonus cards, goal tiles, bird powers), the Asia Appendix, the base Automa rulebook and the Swift-Start guides. Bird powers and bonus-card conditions are printed on the cards. Points marked “Guide's reading” are interpretations where the books are silent or disagree.",
            "Este guia cobre os livros fornecidos: Wingspan base (12 páginas), Expansão Europeia (12), Expansão Oceania (12) e Wingspan Ásia (16, com as 8 páginas das regras Asia-Automa no mesmo arquivo). Não fornecidos: o Apêndice da base (cartas de bônus, peças de objetivo, poderes das aves), o Apêndice da Ásia, o livro da Automa da base e os guias de início rápido. Os poderes das aves e as condições das cartas de bônus estão impressos nas cartas. Trechos marcados como “Leitura do guia” são interpretações onde os livros são omissos ou divergem."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${overviewSection()}</section>
          <section class="rule-section">${actionsSection()}</section>
          <section class="rule-section">${powersSection()}</section>
          ${oceania() ? `<section class="rule-section">${nectarSection()}</section>` : ""}
          <section class="rule-section">${roundEndSection()}</section>
          <section class="rule-section">${gameEndSection()}</section>
          ${duetMap() ? `<section class="rule-section">${duetSection()}</section>` : ""}
          ${flock() ? `<section class="rule-section">${flockSection()}</section>` : ""}
          ${solo() ? `<section class="rule-section">${soloSection()}</section>` : ""}
          ${europe() || oceania() || asia() ? `<section class="rule-section">${expansionsSection()}</section>` : ""}
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${faqSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal, non-commercial companion guide based on the rulebooks of Wingspan and its European, Oceania and Asia expansions by Elizabeth Hargrave (Stonemaier Games); Automa by David Studley and the Automa Factory. Rules are paraphrased; pictures are cut from the supplied manuals for reference.",
        "Guia pessoal e não comercial de consulta baseado nos livros de regras de Wingspan e das expansões Europa, Oceania e Ásia, de Elizabeth Hargrave (Stonemaier Games); Automa de David Studley e da Automa Factory. As regras são parafraseadas; as imagens foram recortadas dos manuais fornecidos para referência."
      )}</p></footer>`;
  }

  function onClick(event) {
    const target = event.target instanceof Element ? event.target.closest("button") : null;
    if (!target || !root || !root.contains(target)) {
      return;
    }
    if (target.dataset.language) {
      state.language = target.dataset.language === "en-US" ? "en-US" : "pt-BR";
      savePreferences();
      rerender();
      return;
    }
    if (target.hasAttribute("data-setup-reset")) {
      setupState = { signature: signature(), checks: [] };
      saveSetup();
      rerender();
      return;
    }
    if (target.dataset.scroll) {
      document.getElementById(target.dataset.scroll)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      root.querySelector(".ws-page")?.prepend(notice);
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

  const OPTION_INPUTS = [
    ["base", "base", (value) => value, YES_NO],
    ["europe", "europe", (value) => value, YES_NO],
    ["oceania", "oceania", (value) => value, YES_NO],
    ["asia", "asia", (value) => value, YES_NO],
    ["mode", "mode", (value) => value, MODES],
    ["players", "players", (value) => Number(value), [1, 2, 3, 4, 5, 6, 7]],
    ["side", "side", (value) => value, SIDES],
    ["solo-goals", "soloGoals", (value) => value, SOLO_GOALS],
    ["difficulty", "difficulty", (value) => value, DIFFICULTIES],
    ["automa", "automa", (value) => value, AUTOMA_SCORING],
    ["swift", "swift", (value) => value, YES_NO],
    ["ravens", "ravens", (value) => value, ["keep", "remove"]],
    ["beak", "beak", (value) => value, ["include", "leave"]]
  ];

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !root || !root.contains(target)) {
      return;
    }
    for (const [attr, key, parse, list] of OPTION_INPUTS) {
      if (target.hasAttribute(`data-${attr}`)) {
        const value = parse(target.getAttribute(`data-${attr}`));
        if (list.includes(value) && value !== state[key]) {
          const next = { [key]: value };
          // Picking a mode moves the player count to that mode's default.
          if (key === "mode") {
            next.players = value === "standard" ? 4 : playerOptions(value)[0];
          }
          applyMatchChange(next);
        }
        return;
      }
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

  window.Wingspan = { renderInto, onClick, onChange };
})();
