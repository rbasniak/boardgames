(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.fit-to-print.v1";
  const SETUP_KEY = "field-manual.fit-to-print.setup.v1";
  const MANUAL_FILE = "fit-to-print_core.pdf";
  const ICONS = "assets/fit-to-print/icons/";
  const ART = "assets/fit-to-print/art/";
  // The PDF page numbers match the printed page numbers (page 1 is the cover).
  const MODES = ["standard", "solo", "family", "turn", "newsroom", "puzzle", "scenario"];
  const TIMERS = { frantic: "3:00", standard: "4:00", relaxed: "5:00" };
  const MODS = ["none", "1", "2", "3", "4", "5", "6", "7"];
  const defaults = {
    language: "pt-BR",
    mode: "standard",
    players: "4",
    timer: "standard",
    powers: "no",
    breaking: "no",
    mod: "none",
    puzzle: "1",
    scenario: "1"
  };

  const CENTERPIECE_NAMES = {
    S1: "Prized Collection Appraised",
    S3: "Star Photographer Shines",
    S4: "Tips for Finding Balance",
    S5: "Sponsored Photos",
    S6: "Setting Boundaries",
    "2A": "Local Exhibition Grows",
    "3A": "Flying Circus Fun for All",
    "3B": "Travelling Circus Arrives",
    "4A": "Parking Solutions Sought",
    "4B": "Parking Space Runs Short",
    "6B": "Disaster Relief Efforts",
    "7A": "Space at a Premium",
    "8B": "Top Ways to Declutter",
    "9A": "Shelves Stacked for Holidays",
    "10A": "Election Campaign Ramps Up",
    "12B": "Edge Cases Ruled Out"
  };

  // p. 23 — Clarifications: centerpieces.
  const CENTERPIECE_NOTES = {
    S4: ["Tiles may be any number of spaces above the fold to count. Count the number of articles, not the number of smiley and frowny faces on them.", "As peças podem estar a qualquer distância acima da dobra para contar. Conte o número de artigos, não o número de rostos sorridentes e tristes neles."],
    S5: ["Each photo counts only once for this centerpiece, even if it is adjacent to several ads.", "Cada foto conta só uma vez para esta peça central, mesmo que esteja adjacente a vários anúncios."],
    "3A": ["At the end of the round, choose 1 article color; this centerpiece scores as if it were a photo for that color. For placement it is still a centerpiece, not a photo.", "No fim da rodada, escolha 1 cor de artigo; esta peça central pontua como se fosse uma foto daquela cor. Para o posicionamento ela continua sendo peça central, não foto."],
    "3B": ["This centerpiece must still fit within the region of the current round.", "Esta peça central ainda precisa caber na região da rodada atual."],
    "4A": ["Square areas do not count toward this centerpiece.", "Áreas quadradas não contam para esta peça central."],
    "8B": ["You may not place tiles on your paper during the Reporting Phase — the normal rule still applies with this centerpiece; score it as its tile says.", "Você não pode colocar peças no seu jornal durante a Fase de Reportagem — a regra normal continua valendo com esta peça central; pontue-a como diz a peça."],
    "10A": ["You may flip any number of tiles before taking up to 2 tiles during the Layout Phase.", "Você pode virar quantas peças quiser antes de pegar até 2 peças durante a Fase de Diagramação."]
  };

  // p. 23 — Clarifications: character cards (the other powers are explained only on the cards).
  const CHARACTER_NOTES = {
    Owl: ["You may flip any number of tiles before taking one during the Layout Phase.", "Você pode virar quantas peças quiser antes de pegar uma durante a Fase de Diagramação."],
    Bear: ["If you have several white space areas of the same size that are your smallest, subtract 1 from all of them for the White Space Bonus.", "Se você tiver várias áreas de espaço em branco do mesmo tamanho que sejam as suas menores, subtraia 1 de todas elas para o Bônus de Espaço em Branco."],
    Rabbit: ["Your mood penalty is reduced to a minimum of 0. (Guide's reading: the Rabbit's card reduces your mood penalty; the reduction can bring it to 0 but never turns it into bonus points.)", "Sua penalidade de humor é reduzida a no mínimo 0. (Leitura do guia: a carta do Coelho reduz a sua penalidade de humor; a redução pode levá-la a 0, mas nunca a transforma em pontos de bônus.)"]
  };

  // p. 23 — Clarifications: Breaking News cards (deck + card number).
  const BREAKING_NOTES = [
    { day: "Fri", n: 1, name: "Keep it tidy!", text: ["Tiles may be placed above or below the fold, but any tile on the fold itself must be flipped over.", "Peças podem ficar acima ou abaixo da dobra, mas qualquer peça sobre a própria dobra deve ser virada."] },
    { day: "Fri", n: 12, name: "Build on what we've started!", text: ["Tiles must be adjacent to one another in a single group. If you have more than 1 contiguous group, flip every group that does not contain your centerpiece. Flipped tiles may be part of a contiguous group.", "As peças devem ficar adjacentes umas às outras num único grupo. Se você tiver mais de 1 grupo contíguo, vire todos os grupos que não contêm a sua peça central. Peças viradas podem fazer parte de um grupo contíguo."] },
    { day: "Sat", n: 2, name: "Quality, not quantity!", text: ["Facedown tiles count toward this Breaking News.", "Peças viradas para baixo contam para este Breaking News."] },
    { day: "Sat", n: 3, name: "Quantity, not quality!", text: ["Facedown tiles count toward this Breaking News.", "Peças viradas para baixo contam para este Breaking News."] },
    { day: "Sun", n: 10, name: "Give it prime position!", text: ["If your centerpiece is adjacent to an edge of your paper, shift it so it touches no edge, removing tiles and placing them on your desk if necessary.", "Se a sua peça central estiver adjacente a uma borda do jornal, desloque-a para que não toque nenhuma borda, removendo peças e colocando-as na sua mesa se necessário."] },
    { day: "Sun", n: 12, name: "Every space counts!", text: ["The White Space Bonus is still scored this round.", "O Bônus de Espaço em Branco ainda é pontuado nesta rodada."] }
  ];

  // p. 19 — Scenarios: [number, difficulty, character, Fri centerpiece, Fri BN, Sat centerpiece, Sat BN, Sun centerpiece, Sun BN, min ad, min points, extra goal].
  const SCENARIOS = [
    [1, "easy", "Fox", "S1", 1, "2B", 4, "11A", 1, 12, 45, null],
    [2, "easy", "Owl", "S2", 3, "5B", 1, "9B", 2, 12, 47, null],
    [3, "easy", "Bear", "S5", 5, "4A", 12, "1B", 12, 13, 47, null],
    [4, "easy", "Squirrel", "S4", 7, "6B", 7, "1A", 8, 13, 49, null],
    [5, "easy", "Rabbit", "S6", 10, "3B", 11, "5A", 10, 14, 50, null],
    [6, "easy", "Raccoon", "S3", 9, "4B", 9, "9A", 7, 14, 52, null],
    [7, "medium", "Fox", "S6", 12, "3A", 8, "2B", 3, 15, 52, null],
    [8, "medium", "Owl", "S5", 6, "1A", 1, "8A", 8, 15, 54, null],
    [9, "medium", "Bear", "S2", 8, "10A", 10, "4A", 6, 16, 55, null],
    [10, "medium", "Squirrel", "S1", 4, "12B", 1, "7A", 9, 16, 57, ["No mood penalty greater than -2 in all three rounds", "Nenhuma penalidade de humor pior que -2 nas três rodadas"]],
    [11, "medium", "Rabbit", "S4", 2, "6A", 12, "8B", 11, 17, 57, ["Score 2+ points on the White Space Bonus in all three rounds", "Marcar 2+ pontos no Bônus de Espaço em Branco nas três rodadas"]],
    [12, "medium", "Raccoon", "S3", 11, "2A", 4, "3B", 10, 17, 59, ["Score 20+ points from photos", "Marcar 20+ pontos com fotos"]],
    [13, "hard", "Fox", "S2", 7, "3A", 7, "1B", 2, 18, 60, ["You may not play any tiles on their flip side", "Você não pode jogar nenhuma peça virada"]],
    [14, "hard", "Owl", "S4", 11, "2B", 8, "4A", 3, 18, 62, ["Score 25+ points from photos", "Marcar 25+ pontos com fotos"]],
    [15, "hard", "Bear", "S6", 12, "1A", 4, "4B", 9, 20, 63, ["Score 40+ points from articles", "Marcar 40+ pontos com artigos"]],
    [16, "hard", "Squirrel", "S5", 5, "6A", 11, "7A", 12, 20, 65, ["Score 15+ points from centerpieces", "Marcar 15+ pontos com peças centrais"]],
    [17, "hard", "Rabbit", "S1", 6, "2A", 10, "11B", 1, 15, 70, ["No unplaced tiles in all three rounds", "Nenhuma peça sobrando nas três rodadas"]],
    [18, "hard", "Raccoon", "S3", 3, "9A", 9, "10B", 8, 15, 70, ["No mood penalty in all three rounds", "Nenhuma penalidade de humor nas três rodadas"]]
  ];

  // pp. 15–16 — Puzzles: [number, day, centerpiece, page, bronze, silver, gold].
  const PUZZLES = [
    [1, "Fri", "S3", 15, 12, 15, 17],
    [2, "Sat", "7A", 15, 20, 22, 24],
    [3, "Sun", "3A", 15, 24, 26, 28],
    [4, "Fri", "S6", 15, 12, 15, 17],
    [5, "Sat", "4B", 15, 20, 22, 24],
    [6, "Sun", "12B", 15, 26, 28, 30],
    [7, "Fri", "S5", 16, 13, 15, 17],
    [8, "Sat", "4A", 16, 17, 19, 22],
    [9, "Sun", "2A", 16, 21, 23, 25],
    [10, "Fri", "S1", 16, 15, 17, 19],
    [11, "Sat", "9A", 16, 18, 19, 21],
    [12, "Sun", "6B", 16, 23, 25, 27]
  ];

  // p. 18 — Rules Modifications.
  const MOD_TEXT = {
    1: ["-1 point per empty square instead of the White Space Bonus", "-1 ponto por quadrado vazio em vez do Bônus de Espaço em Branco"],
    2: ["Use a 2-minute timer for each round", "Use um cronômetro de 2 minutos em cada rodada"],
    3: ["Play with your Paper Board upside down: all tiles must be placed upside down relative to you", "Jogue com o Tabuleiro de Jornal de cabeça para baixo: todas as peças devem ser colocadas de cabeça para baixo em relação a você"],
    4: ["When one player says “Print!”, the round ends for all players", "Quando um jogador diz “Imprimir!”, a rodada acaba para todos"],
    5: ["At the end of each round, any ads placed on players' papers are discarded from play", "No fim de cada rodada, todos os anúncios colocados nos jornais são descartados do jogo"],
    6: ["Newspaper Tiles cannot be moved once placed on your paper", "Peças de Jornal não podem ser movidas depois de colocadas no seu jornal"],
    7: ["Use only one hand when laying out your paper", "Use só uma mão ao diagramar o seu jornal"]
  };

  // p. 18 — Achievements (Standard Game mode).
  const ACHIEVEMENTS = [
    ["Score 60+ points", "Marcar 60+ pontos"],
    ["Score 70+ points", "Marcar 70+ pontos"],
    ["Score 80+ points", "Marcar 80+ pontos"],
    ["Score 35+ points from articles", "Marcar 35+ pontos com artigos"],
    ["Score 40+ points from articles", "Marcar 40+ pontos com artigos"],
    ["Score 50+ points from articles", "Marcar 50+ pontos com artigos"],
    ["Score 20+ points from photos", "Marcar 20+ pontos com fotos"],
    ["Score 25+ points from photos", "Marcar 25+ pontos com fotos"],
    ["Score 30+ points from photos", "Marcar 30+ pontos com fotos"],
    ["Earn $15+ in ad revenue", "Ganhar $15+ em receita de anúncios"],
    ["Earn $20+ in ad revenue", "Ganhar $20+ em receita de anúncios"],
    ["Earn $25+ in ad revenue", "Ganhar $25+ em receita de anúncios"],
    ["Score 15+ points from centerpieces", "Marcar 15+ pontos com peças centrais"],
    ["Score 18+ points from centerpieces", "Marcar 18+ pontos com peças centrais"],
    ["Score 20+ points from centerpieces", "Marcar 20+ pontos com peças centrais"],
    ["Completely fill your Paper Board on Sunday", "Preencher completamente o Tabuleiro de Jornal no domingo"],
    ["Score 5+ points from a single photo", "Marcar 5+ pontos com uma única foto"],
    ["Score 8+ points from a single photo", "Marcar 8+ pontos com uma única foto"],
    ["Get the lowest Finishing Token in all three rounds", "Pegar a Ficha de Finalização mais baixa nas três rodadas"],
    ["Earn the top White Space Bonus in all three rounds", "Ganhar o maior Bônus de Espaço em Branco nas três rodadas"],
    ["Have no more than -3 points total from mood penalties", "Ter no máximo -3 pontos no total em penalidades de humor"],
    ["Win a game where you lose 12 or more points total from mood penalties", "Vencer uma partida em que você perdeu 12 ou mais pontos no total em penalidades de humor"],
    ["Win a game without having the highest number of points", "Vencer uma partida sem ter o maior número de pontos"],
    ["Win a game where you received 15 or more negative points", "Vencer uma partida em que você recebeu 15 ou mais pontos negativos"],
    ["Finish a game with no leftover tiles in all three rounds", "Terminar uma partida sem peças sobrando nas três rodadas"]
  ];

  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------

  function pick(value, allowed, fallback) {
    return allowed.includes(String(value)) ? String(value) : fallback;
  }

  function playerRange(mode) {
    if (mode === "solo" || mode === "puzzle") {
      return [1, 1];
    }
    if (mode === "scenario") {
      return [1, 6];
    }
    return [2, 6];
  }

  function normalizePreferences(saved) {
    const mode = pick(saved?.mode, MODES, defaults.mode);
    const [min, max] = playerRange(mode);
    const rawPlayers = Number.parseInt(saved?.players, 10);
    const players = Number.isFinite(rawPlayers) ? Math.min(max, Math.max(min, rawPlayers)) : Math.min(max, Math.max(min, Number(defaults.players)));
    let mod = pick(saved?.mod, MODS, "none");
    if (mode !== "standard" && mode !== "solo") {
      mod = "none";
    }
    if (mode === "solo" && mod === "4") {
      mod = "none";
    }
    return {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      mode,
      players: String(players),
      timer: pick(saved?.timer, Object.keys(TIMERS), defaults.timer),
      powers: pick(saved?.powers, ["yes", "no"], "no"),
      breaking: pick(saved?.breaking, ["yes", "no"], "no"),
      mod,
      puzzle: pick(saved?.puzzle, PUZZLES.map(([n]) => String(n)), "1"),
      scenario: pick(saved?.scenario, SCENARIOS.map(([n]) => String(n)), "1")
    };
  }

  // Only the choices that change the physical setup are part of the checklist signature.
  function signature(source = state) {
    const parts = [source.mode, source.players];
    if (isRealtime(source)) {
      parts.push(source.mod === "2" ? "2min" : source.timer);
    }
    if (offersPowers(source)) {
      parts.push(`p${source.powers}`);
    }
    if (offersBreaking(source)) {
      parts.push(`b${source.breaking}`);
    }
    if (source.mode === "standard" || source.mode === "solo") {
      parts.push(`m${source.mod}`);
    }
    if (source.mode === "puzzle") {
      parts.push(`z${source.puzzle}`);
    }
    if (source.mode === "scenario") {
      parts.push(`s${source.scenario}`);
    }
    return parts.join("|");
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Fit to Print preferences.", error);
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
      console.error("Could not read Fit to Print setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Fit to Print preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Fit to Print setup progress.", error);
    }
  }

  // ---------- mode helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function mode(source = state) {
    return source.mode;
  }

  function count(source = state) {
    return Number(source.players);
  }

  function isRealtime(source = state) {
    return ["standard", "solo", "family", "newsroom", "scenario"].includes(source.mode);
  }

  function offersPowers(source = state) {
    return source.mode === "standard" || source.mode === "solo";
  }

  function offersBreaking(source = state) {
    return ["standard", "solo", "turn", "newsroom"].includes(source.mode);
  }

  function scenario(source = state) {
    return SCENARIOS.find(([n]) => String(n) === source.scenario) || SCENARIOS[0];
  }

  function puzzle(source = state) {
    return PUZZLES.find(([n]) => String(n) === source.puzzle) || PUZZLES[0];
  }

  function powersOn() {
    return mode() === "scenario" || (offersPowers() && state.powers === "yes");
  }

  function breakingOn() {
    return mode() === "scenario" || (offersBreaking() && state.breaking === "yes");
  }

  function modOn(n) {
    return (mode() === "standard" || mode() === "solo") && state.mod === String(n);
  }

  function threeDays() {
    return ["standard", "solo", "family", "newsroom", "scenario"].includes(mode());
  }

  function usesDesk() {
    return ["standard", "solo", "turn", "newsroom", "scenario"].includes(mode());
  }

  function usesTokens() {
    return ["standard", "solo", "newsroom", "scenario"].includes(mode());
  }

  function soloRules() {
    return mode() === "solo" || mode() === "puzzle" || (mode() === "scenario" && count() === 1);
  }

  // Two competitors: 2 players, or 2 teams in Newsroom Mode (guide's reading for Newsroom).
  function twoSides() {
    return ["standard", "scenario", "newsroom"].includes(mode()) && count() === 2;
  }

  function lowestAdMinusFive() {
    return mode() === "family" || mode() === "turn";
  }

  function noMood() {
    return mode() === "family";
  }

  function noWhiteSpace() {
    return mode() === "family";
  }

  function timerText() {
    if (modOn(2)) {
      return "2:00";
    }
    return TIMERS[state.timer];
  }

  function timerName(key = state.timer) {
    return {
      frantic: t("Frantic", "Frenético"),
      standard: t("Standard", "Padrão"),
      relaxed: t("Relaxed", "Tranquilo")
    }[key];
  }

  function competitors() {
    return mode() === "newsroom" ? t("teams", "equipes") : t("players", "jogadores");
  }

  function playersLabel(n = count(), m = mode()) {
    if (m === "newsroom") {
      return t(`${n} teams (${n * 2} players)`, `${n} equipes (${n * 2} jogadores)`);
    }
    return n === 1 ? t("1 player", "1 jogador") : t(`${n} players`, `${n} jogadores`);
  }

  function modeName(m = mode()) {
    return {
      standard: t("Standard game", "Jogo padrão"),
      solo: t("Solo mode", "Modo solo"),
      family: t("Family mode", "Modo família"),
      turn: t("Turn-based mode", "Modo por turnos"),
      newsroom: t("Newsroom mode", "Modo redação"),
      puzzle: t("Puzzle mode", "Modo quebra-cabeça"),
      scenario: t("Scenario", "Cenário")
    }[m];
  }

  function dayName(day) {
    return {
      Fri: t("Friday", "Sexta-feira"),
      Sat: t("Saturday", "Sábado"),
      Sun: t("Sunday", "Domingo")
    }[day];
  }

  function characterName(key) {
    return {
      Fox: t("Fox", "Raposa"),
      Owl: t("Owl", "Coruja"),
      Bear: t("Bear", "Urso"),
      Squirrel: t("Squirrel", "Esquilo"),
      Rabbit: t("Rabbit", "Coelho"),
      Raccoon: t("Raccoon", "Guaxinim")
    }[key];
  }

  function difficultyName(key) {
    return { easy: t("Easy", "Fácil"), medium: t("Medium", "Médio"), hard: t("Hard", "Difícil") }[key];
  }

  function centerpieceLabel(code) {
    const name = CENTERPIECE_NAMES[code];
    return name ? `${code} · “${name}”` : code;
  }

  function manualUrl(page) {
    const script = document.querySelector('script[src*="fit-to-print.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${MANUAL_FILE}`, baseUrl).href}#page=${page}`;
  }

  function referenceLink(page) {
    return `<a class="source-link" href="${manualUrl(page)}" target="_blank" rel="noreferrer">${t(`Rules p. ${page} ↗`, `Regras p. ${page} ↗`)}</a>`;
  }

  function sectionHeading(id, title, pages) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("THE DAILY EDITION", "EDIÇÃO DO DIA")} / ${sectionIndex(id)}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="ftp-section-references">${pages.map(referenceLink).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
  }

  function interpretation(en, pt) {
    return `<span class="ftp-interpretation">${t("Guide's reading", "Leitura do guia")}</span> ${t(en, pt)}`;
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

  function iconCard(file, titleEn, bodyEn, titlePt, bodyPt, page) {
    const title = t(titleEn, titlePt);
    return `
      <article class="icon-card">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}.webp" alt="${title}" loading="lazy"></span>
        <div><strong>${title}</strong><p>${t(bodyEn, bodyPt)}</p>${referenceLink(page)}</div>
      </article>`;
  }

  // ---------- header ----------

  function sectionList() {
    const list = [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["victory", t("Winning", "Vitória")],
      ["play", playTitle()],
      ["placement", t("Placement rules", "Regras de posicionamento")],
      ["scoring", t("Scoring", "Pontuação")]
    ];
    if (hasClarifications()) {
      list.push(["cards", t("Cards & centerpieces", "Cartas e peças centrais")]);
    }
    if (["standard", "solo", "scenario"].includes(mode())) {
      list.push(["achievements", t("Achievements", "Conquistas")]);
    }
    list.push(["icons", t("Iconography", "Iconografia")], ["examples", t("Examples", "Exemplos")], ["glossary", t("Glossary", "Glossário")]);
    return list;
  }

  function playTitle() {
    return {
      turn: t("A turn, step by step", "Um turno, passo a passo"),
      puzzle: t("Solving a puzzle", "Resolvendo um quebra-cabeça"),
      family: t("A family round", "Uma rodada em família"),
      newsroom: t("A newsroom round", "Uma rodada na redação")
    }[mode()] || t("A round, phase by phase", "Uma rodada, fase a fase");
  }

  function sectionIndex(id) {
    return String(sectionList().findIndex(([sid]) => sid === id) + 1).padStart(2, "0");
  }

  function sectionNav() {
    return sectionList().map(([id, label], index) => `
      <button type="button" data-scroll="${id}"><span class="toc-index">${String(index + 1).padStart(2, "0")}</span>${label}</button>`).join("");
  }

  function renderHeader() {
    return `
      <header class="site-header">
        <a class="brand" href="#/" aria-label="${t("Field Manual home", "Página inicial do Manual de Campo")}">
          <span class="brand-mark" aria-hidden="true">FP</span>
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
      `${readFailed ? "This browser could not read the saved Fit to Print match or setup progress; defaults are shown. " : ""}${writeFailed ? "The latest change could not be saved and is visible on screen only." : ""}`,
      `${readFailed ? "Este navegador não conseguiu ler a partida ou o progresso de Fit to Print salvos; as opções padrão estão sendo mostradas. " : ""}${writeFailed ? "A alteração mais recente não pôde ser salva e aparece somente na tela." : ""}`
    ).trim();
  }

  // ---------- configuration ----------

  function choiceCard(name, value, dataAttr, checked, title, description) {
    return `
      <label class="ftp-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" ${dataAttr} ${checked ? "checked" : ""}>
        <span class="ftp-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function choiceGroup(legend, summary, intro, cards) {
    return `
      <fieldset class="ftp-choice-group">
        <legend>${legend} · ${t("selected:", "selecionado:")} <span>${summary}</span></legend>
        ${intro ? `<p class="ftp-choice-intro">${intro}</p>` : ""}
        <div class="ftp-choice-grid">${cards.join("")}</div>
      </fieldset>`;
  }

  function modeDescription(m) {
    return {
      standard: t("2–6 players, real time. Three timed rounds (Friday, Saturday, Sunday) on growing papers: grab tiles in the Reporting Phase, lay them out in the Layout Phase, say “Print!”. Lowest total ad revenue goes out of business. p. 4–13.", "2–6 jogadores, em tempo real. Três rodadas cronometradas (sexta, sábado, domingo) em jornais cada vez maiores: pegue peças na Fase de Reportagem, diagrame na Fase de Diagramação, diga “Imprimir!”. Quem tiver a menor receita total de anúncios vai à falência. p. 4–13."),
      solo: t("1 player, the standard game with changes: 5 tiles of each size removed, choose 1 of 2 centerpieces, a fixed White Space table and at least $12 of ad revenue. p. 14.", "1 jogador, o jogo padrão com mudanças: 5 peças de cada tamanho retiradas, escolha 1 de 2 peças centrais, tabela fixa de Espaço em Branco e pelo menos $12 de receita de anúncios. p. 14."),
      family: t("2–6 players, simpler: no desks, Finishing Tokens or Centerpiece Tiles; take and place tiles in one phase; no mood penalty and no white space scoring; lowest ad revenue only loses 5 points. p. 20.", "2–6 jogadores, mais simples: sem mesas, Fichas de Finalização nem Peças Centrais; pegar e colocar peças numa só fase; sem penalidade de humor nem pontuação de espaço em branco; a menor receita de anúncios só perde 5 pontos. p. 20."),
      turn: t("2–6 players, no timer: a single Saturday paper played in turns (place a tile, reveal up to 2, take 1), with Rearrange and Search special actions. Lowest ad revenue loses 5 points. p. 20–21.", "2–6 jogadores, sem cronômetro: um único jornal de sábado jogado em turnos (colocar uma peça, revelar até 2, pegar 1), com as ações especiais Reorganizar e Procurar. A menor receita de anúncios perde 5 pontos. p. 20–21."),
      newsroom: t("4–12 players in teams of 2 on two tables about 12 feet (3.5 m) apart: the Reporter carries tiles on the desk, the Layout Editor lays out the paper. Standard scoring. p. 22.", "4–12 jogadores em equipes de 2, em duas mesas a cerca de 12 pés (3,5 m) de distância: o Repórter carrega peças na mesa 3D, o Editor de Diagramação monta o jornal. Pontuação padrão. p. 22."),
      puzzle: t("1 player: lay out a fixed set of tiles from one of the 12 puzzles printed in the rulebook and chase its bronze, silver and gold scores. Every ad must be placed. p. 14–16.", "1 jogador: diagrame um conjunto fixo de peças de um dos 12 quebra-cabeças impressos no manual e busque as pontuações bronze, prata e ouro. Todo anúncio precisa ser colocado. p. 14–16."),
      scenario: t("1–6 players: one of the 18 achievement scenarios fixes the character, the centerpiece and the Breaking News card of each day, plus minimum ad revenue, minimum points and sometimes an extra goal. p. 17–19.", "1–6 jogadores: um dos 18 cenários de conquista fixa o personagem, a peça central e a carta de Breaking News de cada dia, além de receita mínima de anúncios, pontos mínimos e às vezes uma meta extra. p. 17–19.")
    }[m];
  }

  function playerChoiceText(n) {
    const m = mode();
    if (m === "newsroom") {
      return t(`${n} Paper Boards, ${n} desks and Finishing Tokens 1–${n}; each team has a Reporter and a Layout Editor.`, `${n} Tabuleiros de Jornal, ${n} mesas 3D e Fichas de Finalização 1–${n}; cada equipe tem um Repórter e um Editor de Diagramação.`);
    }
    if (m === "scenario" && n === 1) {
      return t("Solo scenario: solo-mode rules (tiles removed, White Space table) with the scenario's goals.", "Cenário solo: regras do modo solo (peças retiradas, tabela de Espaço em Branco) com as metas do cenário.");
    }
    if (m === "turn") {
      return t(`${n + 1} centerpieces are offered; each player starts with 2 tiles on their desk.`, `${n + 1} peças centrais são oferecidas; cada jogador começa com 2 peças na mesa 3D.`);
    }
    if (m === "family") {
      return t(`${n} Paper Boards and ${n} Starting Centerpiece Tiles on their blank side.`, `${n} Tabuleiros de Jornal e ${n} Peças Centrais Iniciais no lado sem pontuação.`);
    }
    if (n === 2) {
      return t("2-player rules: 3 centerpieces to choose from after Friday and Saturday; more than $5 less ad revenue costs 10 points instead of going out of business.", "Regras para 2: 3 peças centrais para escolher após sexta e sábado; ter mais de $5 a menos de receita de anúncios custa 10 pontos em vez de falir.");
    }
    return t(`${n} Paper Boards, desks and Finishing Tokens 1–${n}; ${n} centerpieces offered after Friday and Saturday.`, `${n} Tabuleiros de Jornal, mesas 3D e Fichas de Finalização 1–${n}; ${n} peças centrais oferecidas após sexta e sábado.`);
  }

  function matchConfiguration() {
    const m = mode();
    const groups = [];
    groups.push(choiceGroup(
      t("Game mode", "Modo de jogo"),
      modeName(),
      `${t("The rulebook offers the standard game plus six other ways to play. The Advanced Setup options, the Rules Modifications and the Scenarios belong to the modes they are listed under below.", "O manual traz o jogo padrão e mais seis formas de jogar. As opções de Preparação Avançada, as Modificações de Regras e os Cenários pertencem aos modos em que aparecem abaixo.")} ${referenceLink(4)} ${referenceLink(14)} ${referenceLink(20)}`,
      MODES.map((value) => choiceCard("ftp-mode", value, `data-mode="${value}"`, m === value, modeName(value), modeDescription(value)))
    ));

    const [min, max] = playerRange(m);
    if (min !== max) {
      const counts = [];
      for (let n = min; n <= max; n += 1) {
        counts.push(n);
      }
      groups.push(choiceGroup(
        m === "newsroom" ? t("Teams", "Equipes") : t("Players", "Jogadores"),
        playersLabel(),
        m === "newsroom"
          ? t("Newsroom mode is played by 4 to 12 players in teams of 2, so 2 to 6 teams (one Paper Board, desk and Finishing Token per team).", "O modo redação é jogado por 4 a 12 jogadores em equipes de 2, ou seja, 2 a 6 equipes (um Tabuleiro de Jornal, uma mesa 3D e uma Ficha de Finalização por equipe).")
          : t("The box holds 6 Paper Boards, 6 desks and 6 Finishing Tokens.", "A caixa tem 6 Tabuleiros de Jornal, 6 mesas 3D e 6 Fichas de Finalização."),
        counts.map((n) => choiceCard("ftp-players", String(n), `data-players="${n}"`, count() === n, playersLabel(n), playerChoiceText(n)))
      ));
    }

    if (m === "puzzle") {
      groups.push(choiceGroup(
        t("Puzzle", "Quebra-cabeça"),
        t(`Puzzle ${puzzle()[0]}`, `Quebra-cabeça ${puzzle()[0]}`),
        `${t("Each puzzle names its day (the board area), its centerpiece and pictures its exact tiles. Puzzles 1–6 use different tiles from each other, as do puzzles 7–12.", "Cada quebra-cabeça indica o dia (a área do tabuleiro), a peça central e mostra em figura as peças exatas. Os quebra-cabeças 1–6 usam peças diferentes entre si, assim como os 7–12.")} ${referenceLink(15)} ${referenceLink(16)}`,
        PUZZLES.map(([n, day, cp, page, b, s, g]) => choiceCard("ftp-puzzle", String(n), `data-puzzle="${n}"`, puzzle()[0] === n, t(`Puzzle ${n} · ${dayName(day)}`, `Quebra-cabeça ${n} · ${dayName(day)}`), t(`Centerpiece ${centerpieceLabel(cp)}. Top scores ${b}+ / ${s}+ / ${g}+. Tiles pictured on p. ${page}.`, `Peça central ${centerpieceLabel(cp)}. Melhores pontuações ${b}+ / ${s}+ / ${g}+. Peças na figura da p. ${page}.`)))
      ));
    }

    if (m === "scenario") {
      groups.push(choiceGroup(
        t("Scenario", "Cenário"),
        t(`Scenario ${scenario()[0]} · ${difficultyName(scenario()[1])}`, `Cenário ${scenario()[0]} · ${difficultyName(scenario()[1])}`),
        `${t("Each row of the Scenarios table fixes the character card, the centerpiece and Breaking News card of each day, and the goals to complete it.", "Cada linha da tabela de Cenários fixa a carta de personagem, a peça central e a carta de Breaking News de cada dia, e as metas para completá-lo.")} ${referenceLink(19)}`,
        SCENARIOS.map(([n, diff, ch, fc, fb, sc, sb, uc, ub, ad, pts, goal]) => choiceCard("ftp-scenario", String(n), `data-scenario="${n}"`, scenario()[0] === n, t(`${n} · ${difficultyName(diff)} · ${characterName(ch)}`, `${n} · ${difficultyName(diff)} · ${characterName(ch)}`), t(`Fri ${fc} + BN ${fb} · Sat ${sc} + BN ${sb} · Sun ${uc} + BN ${ub}. Goals: $${ad}+ ad revenue, ${pts}+ points${goal ? `, ${goal[0].toLowerCase()}` : ""}.`, `Sex ${fc} + BN ${fb} · Sáb ${sc} + BN ${sb} · Dom ${uc} + BN ${ub}. Metas: $${ad}+ de anúncios, ${pts}+ pontos${goal ? `, ${goal[1].toLowerCase()}` : ""}.`)))
      ));
    }

    if (isRealtime()) {
      groups.push(choiceGroup(
        t("Round timer", "Cronômetro da rodada"),
        modOn(2) ? t("2:00 (Rules Modification 2)", "2:00 (Modificação de Regras 2)") : `${timerText()} · ${timerName()}`,
        `${t("Every round is timed with a smartphone or other timer everyone can see. Groups wanting an even more relaxed game may set any length they like.", "Cada rodada é cronometrada com um celular ou outro cronômetro que todos vejam. Grupos que queiram um jogo ainda mais tranquilo podem usar qualquer duração.")}${modOn(2) ? ` ${t("Rules Modification 2 replaces this choice with 2 minutes.", "A Modificação de Regras 2 substitui esta escolha por 2 minutos.")}` : ""} ${referenceLink(4)}`,
        Object.entries(TIMERS).map(([key, time]) => choiceCard("ftp-timer", key, `data-timer="${key}"`, state.timer === key, `${time} · ${timerName(key)}`, {
          frantic: t("Shortest rounds: very little time to choose and lay out tiles.", "Rodadas mais curtas: pouquíssimo tempo para escolher e diagramar peças."),
          standard: t("The recommended length for each round.", "A duração recomendada de cada rodada."),
          relaxed: t("More time per round; you may also pick any longer time your group prefers.", "Mais tempo por rodada; vocês também podem escolher qualquer tempo maior.")
        }[key]))
      ));
    }

    if (offersPowers()) {
      groups.push(choiceGroup(
        t("A1 · Player Powers (Advanced Setup)", "A1 · Poderes dos Jogadores (Preparação Avançada)"),
        state.powers === "yes" ? t("Yes", "Sim") : t("No", "Não"),
        `${t("Recommended once you have played with the standard setup. Can be combined with Breaking News or used alone.", "Recomendado depois de jogar com a preparação padrão. Pode ser combinado com Breaking News ou usado sozinho.")} ${referenceLink(4)}`,
        [
          choiceCard("ftp-powers", "no", 'data-powers="no"', state.powers === "no", t("No", "Não"), t("Everyone uses the Player Aid side of their card (phase reminders, no power).", "Todos usam o lado de Ajuda do Jogador da carta (lembretes das fases, sem poder).")),
          choiceCard("ftp-powers", "yes", 'data-powers="yes"', state.powers === "yes", t("Yes", "Sim"), t("Deal the Player Aid/Character Cards at random; each player uses the character side with a unique power, printed on the card.", "Distribua as cartas de Ajuda/Personagem ao acaso; cada jogador usa o lado de personagem com um poder único, impresso na carta."))
        ]
      ));
    }

    if (offersBreaking()) {
      groups.push(choiceGroup(
        t("A2 · Breaking News (Advanced Setup)", "A2 · Breaking News (Preparação Avançada)"),
        state.breaking === "yes" ? t("Yes", "Sim") : t("No", "Não"),
        `${m === "turn" ? t("Turn-based mode allows Breaking News cards if you wish.", "O modo por turnos permite cartas de Breaking News se vocês quiserem.") : t("Can be combined with Player Powers or used alone.", "Pode ser combinado com os Poderes dos Jogadores ou usado sozinho.")} ${referenceLink(4)}${m === "turn" ? ` ${referenceLink(20)}` : ""}`,
        [
          choiceCard("ftp-breaking", "no", 'data-breaking="no"', state.breaking === "no", t("No", "Não"), t("The 36 Breaking News cards stay in the box.", "As 36 cartas de Breaking News ficam na caixa.")),
          choiceCard("ftp-breaking", "yes", 'data-breaking="yes"', state.breaking === "yes", t("Yes", "Sim"), m === "turn"
            ? t("One face-up card adds a public restriction, requirement or bonus for the single Saturday paper.", "Uma carta aberta acrescenta uma restrição, exigência ou bônus público ao único jornal de sábado.")
            : t("Each day, one face-up card from that day's deck (Friday, Saturday, Sunday) adds a public restriction, requirement or bonus. The next day's card is revealed before centerpieces are chosen.", "A cada dia, uma carta aberta do baralho daquele dia (sexta, sábado, domingo) acrescenta uma restrição, exigência ou bônus público. A carta do dia seguinte é revelada antes da escolha das peças centrais."))
        ]
      ));
    }

    if (m === "standard" || m === "solo") {
      const values = MODS.filter((value) => !(m === "solo" && value === "4"));
      groups.push(choiceGroup(
        t("Rules Modification (achievement challenge)", "Modificação de Regras (desafio de conquista)"),
        state.mod === "none" ? t("None", "Nenhuma") : t(`Modification ${state.mod}`, `Modificação ${state.mod}`),
        `${t("One of the three Achievement modes: play a game with one rule change from the list. Leave “None” for a normal game.", "Um dos três modos de Conquista: jogue uma partida com uma mudança de regra da lista. Deixe “Nenhuma” para um jogo normal.")} ${referenceLink(17)} ${referenceLink(18)}`,
        values.map((value) => choiceCard("ftp-mod", value, `data-mod="${value}"`, state.mod === value, value === "none" ? t("None", "Nenhuma") : t(`Modification ${value}`, `Modificação ${value}`), value === "none" ? t("Play the rules as written.", "Jogue as regras como estão.") : `${t(MOD_TEXT[value][0], MOD_TEXT[value][1])}.`))
      ));
    }

    const notes = [];
    if (m === "family") {
      notes.push(t("Family mode uses neither Player Powers nor Breaking News: the rulebook presents it as the simplest way to play and lists no advanced options for it (guide's reading).", "O modo família não usa Poderes dos Jogadores nem Breaking News: o manual o apresenta como o jeito mais simples de jogar e não lista opções avançadas para ele (leitura do guia)."));
    }
    if (m === "turn") {
      notes.push(t("Turn-based mode does not use the character powers (stated on p. 20).", "O modo por turnos não usa os poderes de personagem (dito na p. 20)."));
    }
    if (m === "newsroom") {
      notes.push(t("Character powers are not offered in Newsroom mode: several of them refer to the Reporting and Layout Phases, which this mode does not have (guide's reading).", "Os poderes de personagem não são oferecidos no modo redação: vários deles se referem às Fases de Reportagem e Diagramação, que este modo não tem (leitura do guia)."));
    }
    if (m === "scenario") {
      notes.push(t("The scenario fixes the character and the Breaking News cards, so those options are not asked.", "O cenário fixa o personagem e as cartas de Breaking News, por isso essas opções não são perguntadas."));
    }

    return `
      <section class="controls-panel ftp-config" id="build-match" aria-labelledby="ftp-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="ftp-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t("Choose the way you will play first; only the options that mode allows are shown. Your choices filter the setup checklist and every rule below.", "Escolha primeiro a forma de jogar; só aparecem as opções que esse modo permite. Suas escolhas filtram a lista de preparação e todas as regras abaixo.")}</p>
          </div>
        </div>
        ${groups.join("")}
        ${notes.length ? `<p class="ftp-choice-intro">${notes.join(" ")}</p>` : ""}
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function boardSideText() {
    const m = mode();
    if (m === "turn") {
      return t("Saturday side: the “Fri/Sat” side, using its entire grid", "lado do sábado: o lado “Fri/Sat”, usando a grade inteira");
    }
    if (m === "puzzle") {
      const day = puzzle()[1];
      return day === "Sun"
        ? t("“Sun” side faceup (Sunday puzzle: the entire grid)", "lado “Sun” para cima (quebra-cabeça de domingo: a grade inteira)")
        : day === "Sat"
          ? t("“Fri/Sat” side faceup (Saturday puzzle: the entire grid, including the shaded “Sat” region)", "lado “Fri/Sat” para cima (quebra-cabeça de sábado: a grade inteira, inclusive a região sombreada “Sat”)")
          : t("“Fri/Sat” side faceup (Friday puzzle: only the lighter “Fri” region)", "lado “Fri/Sat” para cima (quebra-cabeça de sexta: só a região mais clara “Fri”)");
    }
    return t("“Fri/Sat” side faceup", "lado “Fri/Sat” para cima");
  }

  function setupPhases() {
    const m = mode();
    const n = count();
    const sc = scenario();
    const pz = puzzle();
    const phases = [];

    if (m === "newsroom") {
      phases.push({
        id: "teams",
        title: t("Teams, roles and two tables", "Equipes, papéis e duas mesas"),
        pages: [22],
        items: [
          t(`Form ${n} teams of 2 players.`, `Formem ${n} equipes de 2 jogadores.`),
          t("In each team, one player is the Reporter (collects tiles) and the other is the Layout Editor (puts tiles onto the paper).", "Em cada equipe, um jogador é o Repórter (coleta peças) e o outro é o Editor de Diagramação (coloca as peças no jornal)."),
          t("Use two tables about 12 feet (3.5 m) apart, or even in different rooms if possible: the tile table and the layout table.", "Usem duas mesas a cerca de 12 pés (3,5 m) de distância, ou até em cômodos diferentes se possível: a mesa de peças e a mesa de diagramação."),
          t("Layout Editors sit at the layout table.", "Os Editores de Diagramação se sentam à mesa de diagramação.")
        ]
      });
    }

    if (usesDesk()) {
      phases.push({
        id: "desks",
        title: t("3D Desks", "Mesas 3D"),
        pages: [3, 4],
        items: [
          t("First game only: build the desks. Fold each desk leg piece at a 90° angle at the scored joints and slot it into the underside of the desktop. Built desks nest inside each other to go back in the box.", "Só na primeira partida: monte as mesas. Dobre cada peça de pé da mesa em 90° nos vincos e encaixe-a na parte de baixo do tampo. Montadas, as mesas se encaixam umas nas outras para voltar à caixa."),
          m === "newsroom"
            ? t(`Give 1 desk to each of the ${n} Reporters.`, `Dê 1 mesa a cada um dos ${n} Repórteres.`)
            : t(`Give 1 desk to ${n === 1 ? "yourself" : `each of the ${n} players`}.`, `Pegue 1 mesa ${n === 1 ? "para você" : `para cada um dos ${n} jogadores`}.`),
          6 - n > 0 ? t(`Return the other ${6 - n} desk${6 - n === 1 ? "" : "s"} to the box.`, `Devolva ${6 - n === 1 ? "a outra mesa" : `as outras ${6 - n} mesas`} à caixa.`) : null
        ]
      });
    }

    const boardItems = [];
    if (m === "puzzle") {
      boardItems.push(t(`Place 1 Paper Board in front of you, unfolded, title of the paper at the top, ${boardSideText()}.`, `Coloque 1 Tabuleiro de Jornal à sua frente, aberto, com o título do jornal no alto, ${boardSideText()}.`));
    } else {
      boardItems.push(m === "newsroom"
        ? t(`At the layout table, place ${n} Paper Boards, one in front of each Layout Editor: unfolded, ${boardSideText()}, title of the paper at the top.`, `Na mesa de diagramação, coloque ${n} Tabuleiros de Jornal, um diante de cada Editor de Diagramação: abertos, ${boardSideText()}, com o título do jornal no alto.`)
        : t(`Each player places 1 Paper Board in front of themselves: unfolded, ${boardSideText()}, oriented so the title of the paper is at the top.`, `Cada jogador coloca 1 Tabuleiro de Jornal à sua frente: aberto, ${boardSideText()}, virado de modo que o título do jornal fique no alto.`));
      if (usesDesk() && m !== "newsroom") {
        boardItems.push(t("Put your 3D Desk to either side of your Paper Board.", "Coloque a sua mesa 3D de um dos lados do seu Tabuleiro de Jornal."));
      }
      if (m === "family") {
        boardItems.push(t("Family mode: put the 3D Desks back in the box; they are not used.", "Modo família: devolva as mesas 3D à caixa; elas não são usadas."));
      }
      if (modOn(3)) {
        boardItems.push(t("Rules Modification 3: turn your Paper Board upside down relative to you (title towards you). Every tile must be placed upside down relative to you, i.e. readable from the board's top edge.", "Modificação de Regras 3: vire o seu Tabuleiro de Jornal de cabeça para baixo em relação a você (título voltado para você). Toda peça deve ser colocada de cabeça para baixo em relação a você, ou seja, legível a partir da borda de cima do tabuleiro."));
      }
    }
    phases.push({ id: "boards", title: t("Paper Boards", "Tabuleiros de Jornal"), pages: m === "puzzle" ? [8, 14] : [4, 8], items: boardItems });

    if (m !== "puzzle") {
      let aidItems;
      if (m === "scenario") {
        aidItems = [
          t(`Take the ${characterName(sc[2])} Player Aid/Character Card and use its character side (unique power).`, `Pegue a carta de Ajuda/Personagem ${characterName(sc[2])} e use o lado de personagem (poder único).`),
          n > 1 ? interpretation(`the rulebook does not say how a single character card works with several players. This guide's reading: every player plays with the ${characterName(sc[2])} power; keep the card faceup where all can read it, and give the other players a Player Aid side to use as a reminder.`, `o manual não diz como uma única carta de personagem funciona com vários jogadores. Leitura deste guia: todos jogam com o poder ${characterName(sc[2])}; deixem a carta aberta onde todos possam ler e deem aos outros jogadores um lado de Ajuda como lembrete.`) : null,
          t("The power's text is printed only on the card; see “Cards & centerpieces” for the rulebook's clarifications.", "O texto do poder está impresso só na carta; veja “Cartas e peças centrais” para os esclarecimentos do manual.")
        ];
      } else if (powersOn()) {
        aidItems = [
          t(`Shuffle the 6 Player Aid/Character Cards and deal 1 at random to ${n === 1 ? "yourself" : "each player"}.`, `Embaralhe as 6 cartas de Ajuda/Personagem e distribua 1 ao acaso ${n === 1 ? "para você" : "para cada jogador"}.`),
          t("Use the character side, which features a unique player power (read it on your card).", "Use o lado de personagem, que traz um poder único (leia-o na sua carta)."),
          t("Return the unused cards to the box.", "Devolva as cartas não usadas à caixa.")
        ];
      } else {
        aidItems = [
          m === "newsroom"
            ? interpretation("give each team 1 Player Aid/Character Card on its Player Aid side, as a reminder of the phases.", "dê a cada equipe 1 carta de Ajuda/Personagem no lado de Ajuda do Jogador, como lembrete das fases.")
            : t(`Give ${n === 1 ? "yourself" : "each player"} 1 Player Aid/Character Card, flipped to the side with the player aid text.`, `Dê ${n === 1 ? "a você" : "a cada jogador"} 1 carta de Ajuda/Personagem, virada para o lado com o texto de ajuda.`),
          t("The character side is not used in this match.", "O lado de personagem não é usado nesta partida.")
        ];
      }
      phases.push({ id: "aids", title: t("Player Aid/Character Cards", "Cartas de Ajuda/Personagem"), pages: m === "scenario" ? [4, 19] : [4], items: aidItems });
    }

    if (m === "puzzle") {
      phases.push({
        id: "puzzle-tiles",
        title: t(`Puzzle ${pz[0]} tiles`, `Peças do quebra-cabeça ${pz[0]}`),
        pages: [pz[3], 14],
        items: [
          t(`Open the rulebook at page ${pz[3]} and find “Puzzle ${pz[0]} – ${dayName(pz[1]).toUpperCase()} – ${centerpieceLabel(pz[2])}”.`, `Abra o manual na página ${pz[3]} e procure “Puzzle ${pz[0]} – ${pz[1] === "Fri" ? "FRIDAY" : pz[1] === "Sat" ? "SATURDAY" : "SUNDAY"} – ${centerpieceLabel(pz[2])}”.`),
          t("Find every article, photo and ad tile pictured under that title among the 120 Newspaper Tiles and lay them faceup in front of you.", "Encontre entre as 120 Peças de Jornal cada artigo, foto e anúncio mostrado sob esse título e coloque-os abertos à sua frente."),
          t(`Find centerpiece ${pz[2]} (${pz[2].startsWith("S") ? "a Starting Centerpiece Tile, scoring side" : `Centerpiece Tile ${pz[2].replace(/[AB]$/, "")}, side ${pz[2].slice(-1)}`}) and place it so it covers the star square.`, `Encontre a peça central ${pz[2]} (${pz[2].startsWith("S") ? "uma Peça Central Inicial, lado com pontuação" : `Peça Central ${pz[2].replace(/[AB]$/, "")}, lado ${pz[2].slice(-1)}`}) e coloque-a cobrindo o quadrado da estrela.`),
          t("Puzzles 1–6 use different tiles from each other, so you can sort out all six puzzles once; the same goes for puzzles 7–12.", "Os quebra-cabeças 1–6 usam peças diferentes entre si, então dá para separar os seis de uma vez; o mesmo vale para os 7–12."),
          t("Put the other tiles back in the box. There is no Reporting Phase: you already have every tile you need.", "Devolva as outras peças à caixa. Não há Fase de Reportagem: você já tem todas as peças necessárias."),
          interpretation("the rulebook gives puzzles no time limit; play them untimed (or set a timer if you want an extra challenge).", "o manual não dá limite de tempo aos quebra-cabeças; jogue-os sem cronômetro (ou use um se quiser um desafio extra).")
        ]
      });
    } else {
      const tileItems = [
        m === "newsroom"
          ? t("Place all 120 Newspaper Tiles facedown on the tile table and shuffle them thoroughly. It does not matter if some tiles overlap.", "Coloque as 120 Peças de Jornal viradas para baixo na mesa de peças e embaralhe-as bem. Não importa se algumas se sobrepõem.")
          : t("Place all 120 Newspaper Tiles facedown in the middle of the table, where everyone can reach them, and shuffle them thoroughly. It does not matter if some tiles overlap.", "Coloque as 120 Peças de Jornal viradas para baixo no meio da mesa, ao alcance de todos, e embaralhe-as bem. Não importa se algumas se sobrepõem.")
      ];
      if (soloRules()) {
        tileItems.push(t("Solo: sort the facedown tiles by size (the tiles come in 5 different sizes), then remove 5 tiles of each size at random — 25 tiles — and set them aside without looking: they are not used this game.", "Solo: separe as peças viradas para baixo por tamanho (há 5 tamanhos diferentes) e retire 5 peças de cada tamanho ao acaso — 25 peças — deixando-as de lado sem olhar: elas não são usadas nesta partida."));
      }
      if (m === "turn") {
        tileItems.push(t("Then, at random, flip faceup 1 tile of each of the 5 sizes so everyone can see them.", "Depois, ao acaso, vire para cima 1 peça de cada um dos 5 tamanhos para todos verem."));
      }
      phases.push({ id: "tiles", title: t("Newspaper Tiles", "Peças de Jornal"), pages: m === "turn" ? [20] : soloRules() ? [4, 14] : [4], items: tileItems });
    }

    if (m === "standard" || m === "solo" || m === "newsroom") {
      phases.push({
        id: "centerpieces",
        title: t("Centerpiece Tiles", "Peças Centrais"),
        pages: [4, 6],
        items: [
          t(`Shuffle the 6 Starting Centerpiece Tiles and give 1 to ${m === "newsroom" ? "each Layout Editor" : n === 1 ? "yourself" : "each player"}, using the side with a scoring condition listed.`, `Embaralhe as 6 Peças Centrais Iniciais e dê 1 ${m === "newsroom" ? "a cada Editor de Diagramação" : n === 1 ? "para você" : "a cada jogador"}, usando o lado com uma condição de pontuação.`),
          t("Place it directly onto your Paper Board, inside the Friday region, covering the square with the star icon. Its exact position is not important yet: you may move it during the Layout Phase as long as it still covers the star.", "Coloque-a direto no seu Tabuleiro de Jornal, dentro da região de sexta, cobrindo o quadrado com o ícone de estrela. A posição exata ainda não importa: você pode movê-la na Fase de Diagramação desde que continue cobrindo a estrela."),
          t("Return the unused Starting Centerpiece Tiles to the box: they are not used this game.", "Devolva à caixa as Peças Centrais Iniciais não usadas: elas não são usadas nesta partida."),
          t(`Shuffle the 12 double-sided Centerpiece Tiles, flipping them as you do so their facing is random, and set them aside in a stack${m === "newsroom" ? " on the layout table" : ""}. They are used after Friday and Saturday.`, `Embaralhe as 12 Peças Centrais de dupla face, virando-as enquanto embaralha para que o lado fique aleatório, e deixe-as de lado numa pilha${m === "newsroom" ? " na mesa de diagramação" : ""}. Elas são usadas depois de sexta e sábado.`)
        ]
      });
    }

    if (m === "family") {
      phases.push({
        id: "centerpieces",
        title: t("Starting Centerpiece Tiles (blank side)", "Peças Centrais Iniciais (lado sem pontuação)"),
        pages: [20],
        items: [
          t(`Randomly give each player 1 Starting Centerpiece Tile flipped to the side with no scoring. Each player uses it for all three rounds.`, `Dê ao acaso a cada jogador 1 Peça Central Inicial virada para o lado sem pontuação. Cada jogador a usa nas três rodadas.`),
          t("Place it onto your Paper Board so it covers the star square.", "Coloque-a no seu Tabuleiro de Jornal cobrindo o quadrado da estrela."),
          t("Put the 12 Centerpiece Tiles, the unused Starting Centerpiece Tiles and the Finishing Tokens back in the box: Family mode does not use them.", "Devolva à caixa as 12 Peças Centrais, as Peças Centrais Iniciais não usadas e as Fichas de Finalização: o modo família não as usa.")
        ]
      });
    }

    if (m === "scenario") {
      const [, , , fc, , sc2, , uc] = sc;
      phases.push({
        id: "centerpieces",
        title: t(`Scenario ${sc[0]} centerpieces`, `Peças centrais do cenário ${sc[0]}`),
        pages: [19, 4],
        items: [
          t(`Find the three centerpieces of the scenario: Friday ${centerpieceLabel(fc)} (Starting Centerpiece Tile, scoring side), Saturday ${centerpieceLabel(sc2)} and Sunday ${centerpieceLabel(uc)} (Centerpiece Tile number, letter = side faceup; the code is printed on the tile).`, `Encontre as três peças centrais do cenário: sexta ${centerpieceLabel(fc)} (Peça Central Inicial, lado com pontuação), sábado ${centerpieceLabel(sc2)} e domingo ${centerpieceLabel(uc)} (número da Peça Central, letra = lado para cima; o código está impresso na peça).`),
          n === 1
            ? t(`Place ${fc} onto your Paper Board, covering the star square. Set ${sc2} and ${uc} aside with the listed side up for Saturday and Sunday.`, `Coloque ${fc} no seu Tabuleiro de Jornal, cobrindo o quadrado da estrela. Deixe ${sc2} e ${uc} de lado com o lado indicado para cima, para sábado e domingo.`)
            : t(`With several players, use the flip side (no scoring) of the Starting Centerpiece Tiles as proxies: each player places one on their Paper Board covering the star square, and everyone scores as if it were the specified centerpiece. Keep ${n === 6 ? "" : `${fc}, `}${sc2} and ${uc} faceup, with the listed side up, where everyone can read them.`, `Com vários jogadores, usem o verso (sem pontuação) das Peças Centrais Iniciais como substitutos: cada jogador coloca um no seu Tabuleiro de Jornal cobrindo o quadrado da estrela, e todos pontuam como se fosse a peça central indicada. Deixem ${n === 6 ? "" : `${fc}, `}${sc2} e ${uc} abertas, com o lado indicado para cima, onde todos possam ler.`),
          n > 1 ? interpretation("keep your proxy on your board for all three days; each day it scores as that day's listed centerpiece.", "mantenha o seu substituto no tabuleiro nos três dias; a cada dia ele pontua como a peça central indicada daquele dia.") : null,
          n === 6 ? interpretation(`with 6 players all six Starting Centerpiece Tiles are needed as proxies, ${fc} included: read ${fc}'s scoring condition aloud (or note it) before it is flipped to its blank side.`, `com 6 jogadores as seis Peças Centrais Iniciais são necessárias como substitutos, inclusive ${fc}: leiam em voz alta (ou anotem) a condição de pontuação de ${fc} antes de virá-la para o lado em branco.`) : null,
          t("Return every Centerpiece Tile not listed above (and any unused Starting Centerpiece Tile) to the box: there is no choosing of centerpieces between rounds.", "Devolva à caixa toda Peça Central não indicada acima (e as Peças Centrais Iniciais não usadas): não há escolha de peças centrais entre as rodadas.")
        ]
      });
    }

    if (m === "turn") {
      phases.push({
        id: "centerpieces",
        title: t("Centerpiece draft", "Escolha das peças centrais"),
        pages: [20],
        items: [
          t("Build the pool: either side of the Starting Centerpiece Tiles, or Centerpiece Tiles 1–9 on side A only (tiles 10–12 and every B side are not used).", "Monte o conjunto: qualquer lado das Peças Centrais Iniciais, ou as Peças Centrais 1–9 somente no lado A (as peças 10–12 e todos os lados B não são usados)."),
          t(`Randomly select ${n + 1} centerpieces (players + 1) from that pool and place them within easy reach of everyone.`, `Selecione ao acaso ${n + 1} peças centrais (jogadores + 1) desse conjunto e coloque-as ao alcance de todos.`),
          t("Randomly determine a starting player.", "Sorteiem um jogador inicial."),
          t("Starting with the player to the right of the starting player and going counterclockwise, each player selects 1 centerpiece for the game (the starting player chooses last). The extra one goes back to the box.", "Começando pelo jogador à direita do jogador inicial e seguindo no sentido anti-horário, cada jogador escolhe 1 peça central para a partida (o jogador inicial escolhe por último). A que sobrar volta à caixa."),
          t("Place your centerpiece onto your Paper Board so it covers the star square.", "Coloque a sua peça central no seu Tabuleiro de Jornal cobrindo o quadrado da estrela.")
        ]
      });
      phases.push({
        id: "first-tiles",
        title: t("Starting tiles", "Peças iniciais"),
        pages: [20],
        items: [
          t("Each player selects any 2 facedown Newspaper Tiles from the center of the table, flips them over and places them on their 3D Desk.", "Cada jogador escolhe 2 Peças de Jornal viradas para baixo quaisquer do centro da mesa, vira-as e coloca-as na sua mesa 3D."),
          interpretation("the rulebook does not use the Finishing Tokens or the timer in Turn-based mode; leave them in the box.", "o manual não usa as Fichas de Finalização nem o cronômetro no modo por turnos; deixem-nos na caixa.")
        ]
      });
    }

    if (isRealtime()) {
      phases.push({
        id: "timer",
        title: t("Round timer", "Cronômetro da rodada"),
        pages: modOn(2) ? [4, 18] : [4],
        items: [
          t(`Use a smartphone or other timer as the round timer and place it within view of all players${m === "newsroom" ? " (and within earshot of the Reporters at the tile table)" : ""}.`, `Use um celular ou outro cronômetro como cronômetro da rodada e coloque-o à vista de todos${m === "newsroom" ? " (e ao alcance do ouvido dos Repórteres na mesa de peças)" : ""}.`),
          modOn(2)
            ? t("Set it to 2:00 (Rules Modification 2) for every round.", "Ajuste-o para 2:00 (Modificação de Regras 2) em todas as rodadas.")
            : t(`Set it to ${timerText()} (${timerName()}) for every round.`, `Ajuste-o para ${timerText()} (${timerName()}) em todas as rodadas.`)
        ]
      });
    }

    if (usesTokens()) {
      phases.push({
        id: "tokens",
        title: t("Finishing Tokens", "Fichas de Finalização"),
        pages: [4],
        items: [
          t(`Place Finishing Tokens 1${n > 1 ? `–${n}` : ""} within easy reach of ${m === "newsroom" ? "the Layout Editors (on the layout table)" : "all players"}, lined up from lowest number to highest.`, `Coloque as Fichas de Finalização 1${n > 1 ? `–${n}` : ""} ao alcance ${m === "newsroom" ? "dos Editores de Diagramação (na mesa de diagramação)" : "de todos"}, enfileiradas do menor número para o maior.`),
          t(`Use only as many tokens as ${m === "newsroom" ? "teams" : "players"}${6 - n > 0 ? `: return tokens ${n + 1}–6 to the box` : ""}.`, `Use só tantas fichas quanto ${m === "newsroom" ? "equipes" : "jogadores"}${6 - n > 0 ? `: devolva as fichas ${n + 1}–6 à caixa` : ""}.`),
          n === 1 ? t("Solo: token 1 only marks that you have said “Print!” (it matters for achievement 19).", "Solo: a ficha 1 só marca que você disse “Imprimir!” (conta para a conquista 19).") : null
        ]
      });
    }

    if (breakingOn()) {
      let items;
      if (m === "scenario") {
        items = [
          t("The three decks are told apart by their backs: “1 FRI”, “2 SAT” and “3 SUN”. Each card's number (1–12 within its deck) is printed on its face.", "Os três baralhos se distinguem pelo verso: “1 FRI”, “2 SAT” e “3 SUN”. O número de cada carta (1–12 dentro do baralho) está impresso na frente."),
          t(`From the Friday deck take card ${sc[4]}, from the Saturday deck card ${sc[6]} and from the Sunday deck card ${sc[8]}.`, `Do baralho de sexta pegue a carta ${sc[4]}, do de sábado a carta ${sc[6]} e do de domingo a carta ${sc[8]}.`),
          t(`Place Friday card ${sc[4]} faceup in the play area where all players can see it. Keep the Saturday and Sunday cards aside, facedown, to reveal before those rounds.`, `Coloque a carta ${sc[4]} de sexta aberta na área de jogo, à vista de todos. Deixe as cartas de sábado e domingo de lado, viradas para baixo, para revelar antes dessas rodadas.`),
          t("Return the other Breaking News cards to the box.", "Devolva as outras cartas de Breaking News à caixa.")
        ];
      } else if (m === "turn") {
        items = [
          interpretation("the game is played on Saturday, so shuffle the Saturday deck and draw 1 card; place it faceup where all players can see it. The rulebook only says the cards may be used.", "a partida é jogada no sábado, então embaralhe o baralho de sábado e compre 1 carta; coloque-a aberta à vista de todos. O manual só diz que as cartas podem ser usadas.")
        ];
      } else {
        items = [
          t("Shuffle each of the 3 Breaking News decks separately (Friday, Saturday and Sunday — their backs read “1 FRI”, “2 SAT” and “3 SUN”).", "Embaralhe separadamente cada um dos 3 baralhos de Breaking News (sexta, sábado e domingo — os versos trazem “1 FRI”, “2 SAT” e “3 SUN”)."),
          t("Draw 1 card from the Friday deck, place it faceup in the play area where all players can see it, and read it aloud before the first timer starts.", "Compre 1 carta do baralho de sexta, coloque-a aberta na área de jogo, à vista de todos, e leia-a em voz alta antes de iniciar o primeiro cronômetro."),
          t("Keep the Saturday and Sunday decks nearby: one card of each is drawn later, before players choose centerpieces for that round.", "Deixe os baralhos de sábado e domingo por perto: uma carta de cada é comprada depois, antes de os jogadores escolherem as peças centrais daquela rodada.")
        ];
      }
      phases.push({ id: "breaking", title: t("Breaking News", "Breaking News"), pages: m === "scenario" ? [4, 19] : [4], items });
    }

    phases.push({
      id: "scorepad",
      title: t("Scorepad", "Bloco de pontuação"),
      pages: [12, 13],
      items: [
        t("Take a sheet of the scorepad and a pen.", "Pegue uma folha do bloco de pontuação e uma caneta."),
        m === "puzzle"
          ? t(`Your result goes in the “Name / Score” boxes next to Puzzle ${pz[0]} on page ${pz[3]}, with its bronze ${pz[4]}+, silver ${pz[5]}+ and gold ${pz[6]}+ badges.`, `O seu resultado vai nas caixas “Name / Score” ao lado do quebra-cabeça ${pz[0]} na página ${pz[3]}, com os selos bronze ${pz[4]}+, prata ${pz[5]}+ e ouro ${pz[6]}+.`)
          : t(`Choose a scorekeeper: they record each scoring category for each ${m === "newsroom" ? "team" : "player"}${threeDays() ? " in the Fri, Sat and Sun columns" : " in one column"}.`, `Escolham um anotador: ele registra cada categoria de pontuação de cada ${m === "newsroom" ? "equipe" : "jogador"}${threeDays() ? " nas colunas Fri, Sat e Sun" : " numa coluna"}.`),
        ["standard", "solo", "scenario"].includes(m) ? t("Achievements: if you track them, write your name on one of the Achievement Desk Tracks on page 17 (one per player, up to 6).", "Conquistas: se vocês as acompanham, escreva seu nome numa das Trilhas de Conquista na página 17 (uma por jogador, até 6).") : null,
        isRealtime() ? t("To begin a round, make sure all players are ready, then start the timer.", "Para começar uma rodada, confiram que todos estão prontos e então iniciem o cronômetro.") : null,
        m === "turn" ? t("The starting player takes the first turn.", "O jogador inicial faz o primeiro turno.") : null
      ]
    });
    return phases;
  }

  function inventory() {
    const m = mode();
    const n = count();
    const cards = [];
    if (m === "puzzle") {
      cards.push(infoCard(t("THIS PUZZLE", "ESTE QUEBRA-CABEÇA"), t(`Puzzle ${puzzle()[0]}`, `Quebra-cabeça ${puzzle()[0]}`), [
        rl("Paper Board", `1, ${boardSideText()}.`, "Tabuleiro de Jornal", `1, ${boardSideText()}.`),
        rl("Tiles", `only those pictured for Puzzle ${puzzle()[0]} on p. ${puzzle()[3]}.`, "Peças", `somente as mostradas para o quebra-cabeça ${puzzle()[0]} na p. ${puzzle()[3]}.`),
        rl("Centerpiece", centerpieceLabel(puzzle()[2]), "Peça central", centerpieceLabel(puzzle()[2])),
        rl("Not used", "desks, Finishing Tokens, Player Aid/Character Cards, Breaking News.", "Não usado", "mesas 3D, Fichas de Finalização, cartas de Ajuda/Personagem, Breaking News.")
      ], [puzzle()[3]]));
    } else {
      cards.push(infoCard(t("SHARED", "COMPARTILHADO"), t("Table components", "Componentes da mesa"), [
        rl("Newspaper Tiles", `120 (57 articles, 29 photos, 34 ads), facedown${soloRules() ? "; 25 set aside unseen" : ""}.`, "Peças de Jornal", `120 (57 artigos, 29 fotos, 34 anúncios), viradas para baixo${soloRules() ? "; 25 deixadas de lado sem olhar" : ""}.`),
        isRealtime() ? rl("Timer", `a smartphone or other timer set to ${timerText()}.`, "Cronômetro", `um celular ou outro cronômetro em ${timerText()}.`) : null,
        usesTokens() ? rl("Finishing Tokens", `1${n > 1 ? `–${n}` : ""}, in a row.`, "Fichas de Finalização", `1${n > 1 ? `–${n}` : ""}, em fila.`) : null,
        ["standard", "solo", "newsroom"].includes(m) ? rl("Centerpiece Tiles", "12 double-sided, shuffled with random faces, in a stack.", "Peças Centrais", "12 de dupla face, embaralhadas com lados aleatórios, numa pilha.") : null,
        breakingOn() ? rl("Breaking News", m === "scenario" ? `Friday ${scenario()[4]}, Saturday ${scenario()[6]}, Sunday ${scenario()[8]}.` : m === "turn" ? "1 Saturday card faceup." : "3 decks of 12 (Friday, Saturday, Sunday); 1 Friday card faceup.", "Breaking News", m === "scenario" ? `sexta ${scenario()[4]}, sábado ${scenario()[6]}, domingo ${scenario()[8]}.` : m === "turn" ? "1 carta de sábado aberta." : "3 baralhos de 12 (sexta, sábado, domingo); 1 carta de sexta aberta.") : null,
        rl("Scorepad", "1 sheet and a pen.", "Bloco de pontuação", "1 folha e uma caneta.")
      ], [3, 4]));
      cards.push(infoCard(m === "newsroom" ? t(`PER TEAM · ×${n}`, `POR EQUIPE · ×${n}`) : t(`PER PLAYER · ×${n}`, `POR JOGADOR · ×${n}`), t("Your newspaper", "Seu jornal"), [
        rl("Paper Board", `1, ${boardSideText()}.`, "Tabuleiro de Jornal", `1, ${boardSideText()}.`),
        usesDesk() ? rl("3D Desk", m === "newsroom" ? "1, carried by the Reporter." : "1, beside the board.", "Mesa 3D", m === "newsroom" ? "1, carregada pelo Repórter." : "1, ao lado do tabuleiro.") : null,
        rl("Centerpiece", {
          standard: "1 Starting Centerpiece Tile, scoring side.",
          solo: "1 Starting Centerpiece Tile, scoring side.",
          newsroom: "1 Starting Centerpiece Tile, scoring side.",
          family: "1 Starting Centerpiece Tile, blank side, for all three rounds.",
          turn: "1, drafted from players + 1.",
          scenario: n === 1 ? `${scenario()[3]}, then ${scenario()[5]} and ${scenario()[7]}.` : `a proxy (blank side of a Starting Centerpiece Tile) scoring as ${scenario()[3]}, ${scenario()[5]}, ${scenario()[7]}.`
        }[m], "Peça central", {
          standard: "1 Peça Central Inicial, lado com pontuação.",
          solo: "1 Peça Central Inicial, lado com pontuação.",
          newsroom: "1 Peça Central Inicial, lado com pontuação.",
          family: "1 Peça Central Inicial, lado sem pontuação, nas três rodadas.",
          turn: "1, escolhida entre jogadores + 1.",
          scenario: n === 1 ? `${scenario()[3]}, depois ${scenario()[5]} e ${scenario()[7]}.` : `um substituto (verso sem pontuação de uma Peça Central Inicial) que pontua como ${scenario()[3]}, ${scenario()[5]}, ${scenario()[7]}.`
        }[m]),
        rl("Card", powersOn() ? "Player Aid/Character Card, character side." : "Player Aid/Character Card, player aid side.", "Carta", powersOn() ? "carta de Ajuda/Personagem, lado de personagem." : "carta de Ajuda/Personagem, lado de ajuda.")
      ], [3, 4]));
      const unused = [];
      if (6 - n > 0) {
        unused.push(t(`${6 - n} Paper Board${6 - n === 1 ? "" : "s"}${usesDesk() ? `, ${6 - n} desk${6 - n === 1 ? "" : "s"}` : ""}${usesTokens() ? ` and Finishing Tokens ${n + 1}–6` : ""}.`, `${6 - n} ${6 - n === 1 ? "Tabuleiro" : "Tabuleiros"} de Jornal${usesDesk() ? `, ${6 - n} ${6 - n === 1 ? "mesa" : "mesas"} 3D` : ""}${usesTokens() ? ` e Fichas de Finalização ${n + 1}–6` : ""}.`));
      }
      if (!usesDesk()) {
        unused.push(t("All 3D Desks.", "Todas as mesas 3D."));
      }
      if (!usesTokens()) {
        unused.push(t("All Finishing Tokens.", "Todas as Fichas de Finalização."));
      }
      if (!breakingOn()) {
        unused.push(t("All 36 Breaking News cards.", "As 36 cartas de Breaking News."));
      }
      if (m === "family") {
        unused.push(t("The 12 Centerpiece Tiles.", "As 12 Peças Centrais."));
      }
      cards.push(infoCard(t("IN THE BOX", "NA CAIXA"), t("Not used this match", "Não usado nesta partida"), unused.length ? unused : [t("Everything is in use.", "Tudo está em uso.")], [3]));
    }
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
        <label class="ftp-setup-check" for="ftp-setup-${phase.id}">
          <input id="ftp-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="ftp-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="ftp-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), mode() === "puzzle" ? [14, puzzle()[3]] : [4, 5])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Set up this match", "Prepare esta partida")} · ${modeName()}${mode() === "puzzle" ? "" : ` · ${playersLabel()}`}</h3>
            <p>${t("One checkbox per coherent step; setup is done once per game.", "Uma caixa por etapa coerente; a preparação é feita uma vez por partida.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved separately from the match configuration and language. Changing any choice that alters the setup clears this checklist; changing the language does not. “Uncheck all” clears only these setup boxes.",
          "O progresso é salvo separadamente da configuração da partida e do idioma. Mudar qualquer escolha que altere a preparação limpa esta lista; trocar o idioma não. “Desmarcar tudo” limpa somente as caixas da preparação."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}`;
  }

  // ---------- shared rule fragments ----------

  function regionLines() {
    return [
      rl("Friday", "only the lighter “Fri” region of the grid on the Fri/Sat side.", "Sexta", "só a região mais clara “Fri” da grade, no lado Fri/Sat."),
      rl("Saturday", "the entire grid of the Fri/Sat side, including the shaded “Sat” region.", "Sábado", "a grade inteira do lado Fri/Sat, inclusive a região sombreada “Sat”."),
      rl("Sunday", "flip the Paper Board to the “Sun” side and use its entire grid.", "Domingo", "vire o Tabuleiro de Jornal para o lado “Sun” e use a grade inteira.")
    ];
  }

  function placementLines() {
    const lines = [
      rl("1 · Grid", "tiles must be aligned with the grid and cannot go over the boundary of the grid for that round.", "1 · Grade", "as peças devem ficar alinhadas com a grade e não podem passar do limite da grade daquela rodada."),
      rl("2 · Centerpiece", "your centerpiece must cover the star square on the top half of the paper.", "2 · Peça central", "a sua peça central deve cobrir o quadrado da estrela na metade de cima do jornal."),
      rl("3 · Orientation", `centerpieces, articles, photos and ads must be placed in the correct orientation; tiles may never be rotated in any way — their words and pictures must stay readable${modOn(3) ? " (Rules Modification 3: readable from the opposite side, i.e. upside down to you)" : ""}.`, "3 · Orientação", `peças centrais, artigos, fotos e anúncios devem ficar na orientação correta; as peças nunca podem ser giradas — palavras e imagens precisam continuar legíveis${modOn(3) ? " (Modificação de Regras 3: legíveis do lado oposto, ou seja, de cabeça para baixo para você)" : ""}.`),
      rl("4 · Articles", "articles of the same color may not be adjacent on any side.", "4 · Artigos", "artigos da mesma cor não podem ficar adjacentes por nenhum lado."),
      rl("5 · Ads", "ads may not be adjacent on any side.", "5 · Anúncios", "anúncios não podem ficar adjacentes por nenhum lado."),
      rl("6 · Photos", "photos may not be adjacent on any side, whatever their type.", "6 · Fotos", "fotos não podem ficar adjacentes por nenhum lado, qualquer que seja o tipo."),
      rl("7 · Fold", "tiles may go over the fold (the shadow line across the middle of the Paper Board).", "7 · Dobra", "peças podem passar por cima da dobra (a linha de sombra no meio do Tabuleiro de Jornal)."),
      rl("8 · Facedown", "tiles may be flipped and placed facedown, back showing, still in the correct orientation. Facedown tiles are worth no points but fill white space and avoid leftover tiles.", "8 · Virada", "peças podem ser viradas e colocadas com o verso para cima, ainda na orientação correta. Peças viradas não valem pontos, mas preenchem espaço em branco e evitam sobras.")
    ];
    return lines;
  }

  function conflictLines() {
    return [
      t("Breaking rules 4–6 is not forbidden while you lay out, but at scoring you must flip tiles facedown until no same-color articles, ads or photos touch.", "Desrespeitar as regras 4–6 não é proibido enquanto você diagrama, mas na pontuação é preciso virar peças até que nenhum artigo da mesma cor, anúncio ou foto se toquem."),
      t("Any article, photo or ad that is rotated or goes off the edge of that round's grid is removed and placed onto your 3D Desk (it becomes a leftover tile).", "Qualquer artigo, foto ou anúncio girado ou que passe da borda da grade daquela rodada é removido e colocado na sua mesa 3D (vira uma peça sobrando)."),
      interpretation("the owner of the paper chooses which tile(s) of a conflict to flip, flipping only as many as needed.", "o dono do jornal escolhe qual(is) peça(s) do conflito virar, virando só as necessárias.")
    ];
  }

  // ---------- quick reference ----------

  function quickReference() {
    const m = mode();
    const cards = [];
    if (["standard", "solo", "scenario"].includes(m)) {
      cards.push(infoCard(t("EVERY ROUND", "TODA RODADA"), t("Round flow", "Fluxo da rodada"), [
        rl("Start", `everyone ready → start the ${timerText()} timer.`, "Início", `todos prontos → iniciem o cronômetro de ${timerText()}.`),
        rl("Reporting", "one hand: take tiles from the center, keep them on your desk or put them back faceup.", "Reportagem", "uma mão: pegue peças do centro, guarde na mesa 3D ou devolva abertas."),
        rl("“Layout!”", "say it to stop taking tiles; now place tiles on your board with both hands.", "“Diagramação!”", "diga isso para parar de pegar peças; agora coloque peças no tabuleiro com as duas mãos."),
        rl("“Print!”", "say it when done; take the lowest unclaimed Finishing Token; hands off your board.", "“Imprimir!”", "diga isso ao terminar; pegue a Ficha de Finalização livre mais baixa; não toque mais no tabuleiro."),
        rl("Round end", modOn(4) ? "Rules Modification 4: the first “Print!” ends the round for everyone (the others take the next tokens)." : "timer runs out or everyone has said “Print!”.", "Fim da rodada", modOn(4) ? "Modificação de Regras 4: o primeiro “Imprimir!” encerra a rodada para todos (os outros pegam as próximas fichas)." : "o cronômetro acaba ou todos disseram “Imprimir!”."),
        m === "scenario"
          ? rl("Then", "check conflicts, score, reset tiles; the next day's centerpiece is fixed by the scenario.", "Depois", "verifiquem conflitos, pontuem, recolham as peças; a peça central do próximo dia é fixada pelo cenário.")
          : rl("Then", "check conflicts, score, reset tiles, choose next centerpieces.", "Depois", "verifiquem conflitos, pontuem, recolham as peças, escolham as próximas peças centrais.")
      ], [6, 8, 9]));
    }
    if (m === "newsroom") {
      cards.push(infoCard(t("EVERY ROUND", "TODA RODADA"), t("Reporter and Layout Editor", "Repórter e Editor de Diagramação"), [
        rl("Start", `everyone ready → start the ${timerText()} timer. Reporters begin standing next to their Layout Editor.`, "Início", `todos prontos → iniciem o cronômetro de ${timerText()}. Os Repórteres começam em pé ao lado do seu Editor.`),
        rl("Reporter", "walks to the tile table with the desk, reveals tiles above it, keeps them on the desk or returns them faceup.", "Repórter", "vai à mesa de peças com a mesa 3D, revela peças acima dela, guarda-as na mesa ou devolve-as abertas."),
        rl("Carrying", "hold the desk by its legs; never touch the tiles on top; pick up fallen tiles and put them back.", "Carregar", "segure a mesa pelos pés; nunca toque nas peças em cima; recolha peças caídas e devolva-as à mesa."),
        rl("Delivery", "dump the tiles on the layout table; go back as often as you like.", "Entrega", "despeje as peças na mesa de diagramação; volte quantas vezes quiser."),
        rl("Layout Editor", "stays seated and places tiles as normal; only they touch the board.", "Editor de Diagramação", "fica sentado e coloca as peças normalmente; só ele toca no tabuleiro."),
        rl("“Print!”", "the Layout Editor says it and takes the lowest unclaimed Finishing Token.", "“Imprimir!”", "o Editor de Diagramação diz isso e pega a Ficha de Finalização livre mais baixa.")
      ], [22]));
    }
    if (m === "family") {
      cards.push(infoCard(t("EVERY ROUND", "TODA RODADA"), t("One combined phase", "Uma fase combinada"), [
        rl("Start", `everyone ready → start the ${timerText()} timer.`, "Início", `todos prontos → iniciem o cronômetro de ${timerText()}.`),
        rl("Take", "pick a tile from the center (flip a facedown tile above your board); keep it or put it back faceup.", "Pegar", "pegue uma peça do centro (vire uma peça fechada acima do seu tabuleiro); fique com ela ou devolva-a aberta."),
        rl("Place", "a kept tile MUST go onto your Paper Board right away.", "Colocar", "uma peça que você fica DEVE ir para o seu Tabuleiro de Jornal na hora."),
        rl("Move", "rearrange your tiles any time; a taken tile can never leave your board.", "Mover", "reorganize suas peças a qualquer momento; uma peça pega nunca sai do seu tabuleiro."),
        rl("End", "everyone plays the full time; no Finishing Tokens.", "Fim", "todos jogam o tempo inteiro; sem Fichas de Finalização.")
      ], [20]));
    }
    if (m === "turn") {
      cards.push(infoCard(t("YOUR TURN", "SEU TURNO"), t("Three steps", "Três passos"), [
        rl("1 · Place", "put 1 tile from your desk onto your board (standard placement rules) — or discard 1 desk tile for a special action.", "1 · Colocar", "coloque 1 peça da mesa 3D no tabuleiro (regras normais) — ou descarte 1 peça da mesa para uma ação especial."),
        rl("2 · Reveal", "flip up to 2 tiles in the center faceup (optional).", "2 · Revelar", "vire até 2 peças do centro para cima (opcional)."),
        rl("3 · Take", "take any faceup or facedown tile from the center onto your desk.", "3 · Pegar", "pegue qualquer peça, aberta ou fechada, do centro para a sua mesa 3D."),
        rl("Fixed", "placed tiles cannot be moved later; your centerpiece can, if still legal.", "Fixas", "peças colocadas não podem ser movidas depois; a peça central pode, se continuar legal."),
        rl("Rearrange", "special action: remove 3 tiles from your board and place them back anywhere.", "Reorganizar", "ação especial: retire 3 peças do tabuleiro e recoloque-as em qualquer lugar."),
        rl("Search", "special action: flip up to 3 more tiles in the center (up to 5 this turn).", "Procurar", "ação especial: vire até mais 3 peças do centro (até 5 neste turno)."),
        rl("“Print!”", "on your turn, when no tile on your desk fits anymore: game ends after the others place their desk tiles.", "“Imprimir!”", "no seu turno, quando nenhuma peça da mesa 3D cabe mais: o jogo acaba depois de os outros colocarem as peças das mesas.")
      ], [21]));
    }
    if (m === "puzzle") {
      const pz = puzzle();
      cards.push(infoCard(t("THIS PUZZLE", "ESTE QUEBRA-CABEÇA"), t(`Puzzle ${pz[0]} · ${dayName(pz[1])}`, `Quebra-cabeça ${pz[0]} · ${dayName(pz[1])}`), [
        rl("Area", boardSideText(), "Área", boardSideText()),
        rl("Centerpiece", centerpieceLabel(pz[2]), "Peça central", centerpieceLabel(pz[2])),
        rl("Only Layout", "you already have all tiles; place them with the standard rules.", "Só diagramação", "você já tem todas as peças; coloque-as com as regras normais."),
        rl("Ads", "ALL ads must be placed, without conflict, or the puzzle is “incomplete”.", "Anúncios", "TODOS os anúncios devem ser colocados, sem conflito, ou o quebra-cabeça fica “incompleto”."),
        rl("Leftovers", "no penalty for tiles you could not place (except ads).", "Sobras", "sem penalidade pelas peças que não couberam (exceto anúncios)."),
        rl("Target", `bronze ${pz[4]}+ · silver ${pz[5]}+ · gold ${pz[6]}+.`, "Meta", `bronze ${pz[4]}+ · prata ${pz[5]}+ · ouro ${pz[6]}+.`)
      ], [14, pz[3]]));
    }
    cards.push(infoCard(t("LAYOUT", "DIAGRAMAÇÃO"), t("Placement at a glance", "Posicionamento num relance"), [
      rl("Grid", "aligned, inside this round's region.", "Grade", "alinhadas, dentro da região da rodada."),
      rl("Star", "your centerpiece covers the star square.", "Estrela", "a sua peça central cobre o quadrado da estrela."),
      rl("Upright", "never rotate a tile.", "Em pé", "nunca gire uma peça."),
      rl("No touching", "same-color articles, ads, photos — on any side.", "Sem encostar", "artigos da mesma cor, anúncios, fotos — por nenhum lado."),
      rl("Facedown", "allowed; 0 points but fills space.", "Virada", "permitida; 0 ponto mas preenche espaço.")
    ], [9]));
    cards.push(infoCard(t("SCORING", "PONTUAÇÃO"), t("Each round", "A cada rodada"), scoringSummaryLines(), [12]));
    if (threeDays() && m !== "family") {
      cards.push(infoCard(t("BETWEEN ROUNDS", "ENTRE RODADAS"), t("Reset for the next day", "Prepare o próximo dia"), betweenRoundLines(true), [12]));
    }
    cards.push(infoCard(t("GAME END", "FIM DA PARTIDA"), t("Who wins", "Quem vence"), victoryLines(true), victoryPages()));
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), [6, 9, 12])}
      <div class="callout">${t(
        "Goal: lay out the best newspaper — score points with articles, photos and your centerpiece, keep the white space small and the mood balanced, and earn enough ad revenue to stay in business.",
        "Objetivo: diagramar o melhor jornal — marque pontos com artigos, fotos e a sua peça central, mantenha pouco espaço em branco e o humor equilibrado, e ganhe receita de anúncios suficiente para não falir."
      )} ${referenceLink(6)}</div>
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  function scoringSummaryLines() {
    const lines = [
      rl("Articles", "the sum of the numbers on your faceup articles.", "Artigos", "a soma dos números dos seus artigos abertos."),
      rl("Photos", "1 per orthogonally adjacent article of the color or mood shown on the photo.", "Fotos", "1 por artigo ortogonalmente adjacente da cor ou humor mostrado na foto."),
      rl("Centerpiece", "as printed on it (it must cover the star).", "Peça central", "conforme impresso nela (deve cobrir a estrela).")
    ];
    if (modOn(1)) {
      lines.push(rl("Empty squares", "Rules Modification 1: -1 per empty square (no White Space Bonus).", "Quadrados vazios", "Modificação de Regras 1: -1 por quadrado vazio (sem Bônus de Espaço em Branco)."));
    } else if (!noWhiteSpace()) {
      lines.push(soloRules()
        ? rl("White space", "largest empty area: 0–1 → +3, 2–3 → +2, 4–5 → +1, 6–7 → 0, 8+ → -1.", "Espaço em branco", "maior área vazia: 0–1 → +3, 2–3 → +2, 4–5 → +1, 6–7 → 0, 8+ → -1.")
        : rl("White space", "compare largest empty areas: smallest +3, largest -1, everyone else +1 (ties each get it).", "Espaço em branco", "comparem as maiores áreas vazias: menor +3, maior -1, os demais +1 (empatados recebem cada um)."));
    }
    if (!noMood()) {
      lines.push(rl("Mood", "minus the difference between smiley and frowny faces on your articles.", "Humor", "menos a diferença entre rostos sorridentes e tristes nos seus artigos."));
    }
    if (usesDesk()) {
      lines.push(rl("Leftovers", mode() === "puzzle" ? "no penalty." : threeDays() ? "-1 per tile left on your desk (it stays there for the next round)." : "-1 per tile left on your desk.", "Sobras", mode() === "puzzle" ? "sem penalidade." : threeDays() ? "-1 por peça na sua mesa 3D (ela fica lá para a próxima rodada)." : "-1 por peça que ficou na sua mesa 3D."));
    }
    lines.push(mode() === "puzzle"
      ? rl("Ads", "not scored, but every ad must be placed without conflict.", "Anúncios", "não pontuam, mas todo anúncio deve ser colocado sem conflito.")
      : rl("Ads", "no points; ad revenue = the number of $ signs.", "Anúncios", "sem pontos; receita = número de símbolos $."));
    if (mode() !== "puzzle") {
      lines.push(rl("Floor", "a round's total can't go below 0 points or $0.", "Mínimo", "o total da rodada não fica abaixo de 0 ponto nem de $0."));
    }
    return lines;
  }

  function betweenRoundLines(short = false) {
    const m = mode();
    const n = count();
    const lines = [
      rl("Centerpieces", m === "scenario" ? (count() === 1 ? "set the used one aside; the next day's centerpiece is fixed by the scenario." : "the proxies stay on the boards; the listed tiles in the middle are only there to be read.") : "set the used Centerpiece Tiles aside (they are not used again).", "Peças centrais", m === "scenario" ? (count() === 1 ? "deixem de lado a usada; a peça central do próximo dia é fixada pelo cenário." : "os substitutos ficam nos tabuleiros; as peças indicadas no meio servem só para leitura.") : "deixem de lado as Peças Centrais usadas (não voltam ao jogo)."),
      rl("Tiles", `all Newspaper Tiles from the Paper Boards go facedown back to the ${m === "newsroom" ? "tile table" : "center"} and are shuffled; leftover tiles stay on the desks${modOn(5) ? " (Rules Modification 5: after scoring, the ads on the papers are discarded from play instead — guide's reading: facedown ads too; ads left on desks are not on a paper and stay)" : ""}.`, "Peças", `todas as Peças de Jornal dos tabuleiros voltam viradas ${m === "newsroom" ? "à mesa de peças" : "ao centro"} e são embaralhadas; as sobras ficam nas mesas 3D${modOn(5) ? " (Modificação de Regras 5: depois da pontuação, os anúncios dos jornais são descartados do jogo — leitura do guia: inclusive anúncios virados; anúncios que ficaram nas mesas 3D não estão num jornal e permanecem)" : ""}.`)
    ];
    if (breakingOn()) {
      lines.push(rl("Breaking News", m === "scenario" ? "reveal the scenario's card for the next day." : "draw 1 card from the next day's deck and place it faceup — before choosing centerpieces.", "Breaking News", m === "scenario" ? "revelem a carta do cenário para o próximo dia." : "comprem 1 carta do baralho do próximo dia e coloquem-na aberta — antes de escolher as peças centrais."));
    }
    if (m !== "scenario") {
      lines.push(soloRules()
        ? rl("Choose", "draw 2 Centerpiece Tiles at random and choose 1 (use its faceup side).", "Escolher", "comprem 2 Peças Centrais ao acaso e escolham 1 (use o lado que estiver para cima).")
        : rl("Choose", `lay out ${n === 2 ? "3 Centerpiece Tiles (2-player rule)" : `${n} Centerpiece Tiles (1 per ${m === "newsroom" ? "team" : "player"})`} from the stack; the lowest Finishing Token picks first, then the next lowest… Use the faceup side.`, "Escolher", `abram ${n === 2 ? "3 Peças Centrais (regra para 2)" : `${n} Peças Centrais (1 por ${m === "newsroom" ? "equipe" : "jogador"})`} da pilha; a Ficha de Finalização mais baixa escolhe primeiro, depois a seguinte… Use o lado que estiver para cima.`));
    }
    if (m !== "scenario" && !short) {
      lines.push(interpretation("Centerpiece Tiles laid out or drawn but not chosen are set aside with the used ones; they do not go back into the stack.", "Peças Centrais abertas ou compradas mas não escolhidas ficam de lado com as usadas; não voltam à pilha."));
    }
    if (m === "scenario") {
      lines.push(count() === 1
        ? rl("Ready", "place the scenario's centerpiece for the next day on your Paper Board covering the star, return Finishing Token 1 to its place, and start the next round.", "Pronto", "coloque a peça central do cenário para o próximo dia no Tabuleiro de Jornal cobrindo a estrela, devolva a Ficha de Finalização 1 ao lugar e comecem a próxima rodada.")
        : rl("Ready", "everyone keeps their proxy on the board (it now scores as the next day's listed centerpiece), returns the Finishing Tokens to their row, and the next round starts.", "Pronto", "todos mantêm o substituto no tabuleiro (agora ele pontua como a peça central indicada do próximo dia), devolvem as Fichas de Finalização à fila e começa a próxima rodada."));
      return lines;
    }
    lines.push(rl("Ready", `place the new centerpiece on your Paper Board${short ? "" : " covering the star"}, return the Finishing Tokens to their row, ${short ? "go" : "and you are ready for the next round"}.`, "Pronto", `coloquem a nova peça central no Tabuleiro de Jornal${short ? "" : " cobrindo a estrela"}, devolvam as Fichas de Finalização à fila${short ? " e sigam" : " e estão prontos para a próxima rodada"}.`));
    return lines;
  }

  function victoryPages() {
    return { solo: [14], puzzle: [14], family: [20], turn: [21], newsroom: [22, 13], scenario: [17, 19, 13] }[mode()] || [13];
  }

  function victoryLines(short = false) {
    const m = mode();
    const sc = scenario();
    const lines = [];
    if (m === "puzzle") {
      const pz = puzzle();
      lines.push(rl("Result", "your score for the single round, compared with the badges.", "Resultado", "sua pontuação na única rodada, comparada aos selos."));
      lines.push(rl("Badges", `bronze ${pz[4]}+, silver ${pz[5]}+, gold ${pz[6]}+ — tick the box you reached.`, "Selos", `bronze ${pz[4]}+, prata ${pz[5]}+, ouro ${pz[6]}+ — marquem a caixa alcançada.`));
      lines.push(rl("Incomplete", "an ad left unplaced (or in conflict) makes the score “incomplete”.", "Incompleto", "um anúncio não colocado (ou em conflito) deixa a pontuação “incompleta”."));
      lines.push(t("Compete with others to see who gets the highest score on the same puzzle.", "Desafie outras pessoas a ver quem faz mais pontos no mesmo quebra-cabeça."));
      return lines;
    }
    if (m === "turn") {
      lines.push(rl("When", "the game ends after the player who said “Print!” and everyone else has placed their remaining desk tiles; score once.", "Quando", "a partida acaba depois que o jogador que disse “Imprimir!” e todos os outros colocaram as peças restantes das mesas; pontuem uma vez."));
    } else if (threeDays()) {
      lines.push(rl("When", "after the Sunday round (3 rounds).", "Quando", "depois da rodada de domingo (3 rodadas)."));
    }
    if (m === "family" || m === "turn") {
      lines.push(rl("Ads", "if a single player has the lowest total ad revenue, they score -5 points (no one goes out of business).", "Anúncios", "se um único jogador tiver a menor receita total de anúncios, ele marca -5 pontos (ninguém vai à falência)."));
      lines.push(rl("Winner", "the highest score.", "Vencedor", "a maior pontuação."));
      lines.push(interpretation("there are no Finishing Tokens to break a tie, so tied players share the victory.", "não há Fichas de Finalização para desempatar, então os empatados dividem a vitória."));
      return lines;
    }
    if (soloRules()) {
      const minAd = m === "scenario" ? sc[9] : 12;
      lines.push(rl("Ad revenue", `you must have at least $${minAd} total ad revenue at the end of the game${m === "scenario" ? " (the scenario's minimum)" : ""}.`, "Receita de anúncios", `você precisa ter pelo menos $${minAd} de receita total de anúncios no fim da partida${m === "scenario" ? " (o mínimo do cenário)" : ""}.`));
      if (m === "scenario") {
        lines.push(rl("Points", `at least ${sc[10]} total points.`, "Pontos", `pelo menos ${sc[10]} pontos no total.`));
        if (sc[11]) {
          lines.push(rl("Extra goal", sc[11][0], "Meta extra", sc[11][1]));
        }
        lines.push(interpretation("meet every listed goal to complete the scenario and fill in your shape; the rulebook does not spell this out.", "cumprir todas as metas listadas completa o cenário e você preenche a sua forma; o manual não detalha isso."));
      } else {
        lines.push(rl("Score", "compete against yourself (or friends' solo scores) for the highest total.", "Pontuação", "compita contra você mesmo (ou as pontuações solo de amigos) pelo maior total."));
        lines.push(interpretation("below $12 your paper goes out of business, as in the multiplayer game: the game counts as lost.", "abaixo de $12 o seu jornal vai à falência, como no jogo multijogador: a partida conta como perdida."));
      }
      return lines;
    }
    lines.push(rl("Out of business", `if a single ${m === "newsroom" ? "team" : "player"} has the lowest total ad revenue, they go out of business and cannot win${twoSides() ? " — but not with 2: see below" : ""}.`, "Falência", `se ${m === "newsroom" ? "uma única equipe tiver" : "um único jogador tiver"} a menor receita total de anúncios, vai à falência e não pode vencer${twoSides() ? " — mas não com 2: veja abaixo" : ""}.`));
    if (twoSides()) {
      lines.push(rl("2 players", `instead, a ${m === "newsroom" ? "team" : "player"} with more than $5 less ad revenue than the other gets a 10-point penalty but can still win.`, "2 jogadores", `em vez disso, ${m === "newsroom" ? "a equipe" : "o jogador"} com mais de $5 a menos de receita que o outro recebe 10 pontos de penalidade, mas ainda pode vencer.`));
      if (m === "newsroom") {
        lines.push(interpretation("with 2 teams, use the 2-player rules (this one and 3 centerpieces to choose from).", "com 2 equipes, usem as regras para 2 jogadores (esta e 3 peças centrais para escolher)."));
      }
    }
    lines.push(rl("Winner", `the remaining ${m === "newsroom" ? "team" : "player"} with the highest score.`, "Vencedor", `${m === "newsroom" ? "a equipe restante" : "o jogador restante"} com a maior pontuação.`));
    lines.push(rl("Tie", `the tied ${m === "newsroom" ? "team" : "player"} who took the lower Finishing Token on Sunday wins.`, "Empate", `vence ${m === "newsroom" ? "a equipe empatada" : "o empatado"} que pegou a Ficha de Finalização mais baixa no domingo.`));
    if (!short) {
      lines.push(interpretation("if several players share the lowest ad revenue, no one goes out of business — the rule names a single player.", "se vários jogadores empatarem com a menor receita de anúncios, ninguém vai à falência — a regra fala de um único jogador."));
    }
    if (m === "scenario") {
      if (sc[11] && sc[0] === 11) {
        lines.push(interpretation("with several players the White Space Bonus is +3, +1 or -1, so “2+ points” means having the smallest largest area (ties included) in every round.", "com vários jogadores o Bônus de Espaço em Branco é +3, +1 ou -1, então “2+ pontos” significa ter a menor maior-área (empates incluídos) em todas as rodadas."));
      }
      lines.push(interpretation("goals are checked per player: each player who meets all of them completes the scenario and fills in their own shape; the winner of the game is still decided by the rules above.", "as metas são conferidas por jogador: cada um que cumprir todas completa o cenário e preenche a própria forma; o vencedor da partida continua sendo decidido pelas regras acima."));
      lines.push(rl("Scenario goals", `each player checks their game totals: $${sc[9]}+ ad revenue and ${sc[10]}+ points${sc[11] ? ` and: ${t(sc[11][0], sc[11][1]).toLowerCase()}` : ""}.`, "Metas do cenário", `cada jogador confere os seus totais da partida: $${sc[9]}+ de anúncios e ${sc[10]}+ pontos${sc[11] ? ` e: ${t(sc[11][0], sc[11][1]).toLowerCase()}` : ""}.`));
    }
    return lines;
  }

  // ---------- victory ----------

  function victorySection() {
    const cards = [infoCard(t("END OF THE GAME", "FIM DA PARTIDA"), t("Winning", "Vitória"), victoryLines(), victoryPages(), "victory-card")];
    if (["standard", "solo", "scenario"].includes(mode())) {
      cards.push(infoCard(t("ACHIEVEMENTS", "CONQUISTAS"), t("A longer game across sessions", "Um jogo mais longo entre sessões"), [
        t("Achievements can be earned in multiplayer and solo games. Each time you play, choose one Achievement mode: Standard Game, Rules Modifications or Scenarios.", "Conquistas podem ser obtidas em partidas multijogador e solo. A cada partida, escolham um modo de Conquista: Jogo Padrão, Modificações de Regras ou Cenários."),
        t("When you gain one, fill in your shape in that table, then fill in a task on your Achievement Desk Track (p. 17).", "Ao obter uma, preencha a sua forma naquela tabela e depois uma tarefa na sua Trilha de Conquista (p. 17)."),
        t("See the Achievements section below for the lists.", "Veja a seção Conquistas abaixo para as listas.")
      ], [17], "victory-card"));
    }
    return `
      ${sectionHeading("victory", t("Winning", "Vitória"), victoryPages())}
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- play ----------

  function playSection() {
    const m = mode();
    const cards = [];
    if (threeDays() || m === "puzzle") {
      cards.push(`
        <article class="info-card">
          <span class="component-label">${t("THE PAPER", "O JORNAL")}</span>
          <h3>${m === "puzzle" ? t("Where tiles may go", "Onde as peças podem ir") : t("Three days, three sizes", "Três dias, três tamanhos")}</h3>
          ${lineList(m === "puzzle" ? [boardSideText()] : regionLines())}
          <figure class="ftp-example-art"><img src="${ART}board-regions.webp" alt="${t("Paper Board: Friday region, Saturday region and Sunday side", "Tabuleiro de Jornal: região de sexta, região de sábado e lado de domingo")}" loading="lazy"><figcaption>${t("Friday region (red), Saturday region (blue), Sunday side (orange). The star is the centerpiece square.", "Região de sexta (vermelho), região de sábado (azul), lado de domingo (laranja). A estrela é o quadrado da peça central.")}</figcaption></figure>
          ${referenceLink(8)}
        </article>`);
    }

    if (["standard", "solo", "scenario"].includes(m)) {
      cards.push(infoCard(t("PHASE 1", "FASE 1"), t("The Reporting Phase", "A Fase de Reportagem"), [
        t("There are no turns: everyone plays at once as soon as the timer starts.", "Não há turnos: todos jogam ao mesmo tempo assim que o cronômetro começa."),
        rl("One hand", "using only one hand, pick up a tile from the center of the table, faceup or facedown.", "Uma mão", "usando só uma mão, pegue uma peça do centro da mesa, aberta ou fechada."),
        rl("Flip", "a facedown tile must be brought above your 3D Desk or Paper Board and flipped faceup there.", "Virar", "uma peça fechada deve ser levada acima da sua mesa 3D ou Tabuleiro de Jornal e virada ali."),
        rl("Put back", "if you don't want it, put it back in the middle faceup, so others can now see it.", "Devolver", "se não quiser, devolva-a ao meio aberta, para os outros a verem."),
        rl("Keep", "otherwise place it faceup on your 3D Desk. You may look through your desk tiles any time, but once kept a tile never returns to the center.", "Guardar", "senão coloque-a aberta na sua mesa 3D. Você pode olhar as peças da mesa a qualquer momento, mas uma peça guardada nunca volta ao centro."),
        rl("Desk only", "tiles stay on the desk during this phase (you may not place them on your board yet).", "Só na mesa", "as peças ficam na mesa 3D durante esta fase (ainda não podem ir para o tabuleiro)."),
        rl("“Layout!”", "when you are happy with the number of tiles, say “Layout!”: you enter the Layout Phase and cannot take any more tiles. Others may still be reporting.", "“Diagramação!”", "quando estiver satisfeito com o número de peças, diga “Diagramação!”: você entra na Fase de Diagramação e não pode pegar mais peças. Outros podem continuar na reportagem.")
      ], [6, 8]));
      cards.push(infoCard(t("PHASE 2", "FASE 2"), t("The Layout Phase", "A Fase de Diagramação"), [
        rl("Both hands", `place tiles from your desk onto your Paper Board using both hands${modOn(7) ? " — Rules Modification 7: only one hand" : ""}.`, "Duas mãos", `coloque peças da mesa 3D no Tabuleiro de Jornal usando as duas mãos${modOn(7) ? " — Modificação de Regras 7: só uma mão" : ""}.`),
        rl("Spread out", "you may take the tiles off the desk and spread them on the table in front of you to see them better.", "Espalhar", "você pode tirar as peças da mesa 3D e espalhá-las na mesa à sua frente para vê-las melhor."),
        rl("Rearrange", modOn(6) ? "Rules Modification 6: once placed on your paper, a tile cannot be moved." : "move tiles around as much as you like, including the centerpiece (it must keep covering the star).", "Reorganizar", modOn(6) ? "Modificação de Regras 6: depois de colocada no jornal, uma peça não pode ser movida." : "mova as peças quanto quiser, inclusive a peça central (que deve continuar cobrindo a estrela)."),
        rl("Rules", "follow the placement rules (next section).", "Regras", "siga as regras de posicionamento (próxima seção)."),
        rl("“Print!”", "when finished — you need not place every tile — say “Print!” and take the lowest unclaimed Finishing Token. From then on you may not touch your Paper Board in any way.", "“Imprimir!”", "ao terminar — não é preciso colocar todas as peças — diga “Imprimir!” e pegue a Ficha de Finalização livre mais baixa. A partir daí você não pode mais tocar no tabuleiro."),
        rl("Unplaced", "tiles left on your desk cost a penalty at scoring but stay there for the next round.", "Não colocadas", "peças que ficam na mesa 3D dão penalidade na pontuação, mas continuam lá para a próxima rodada.")
      ], [9]));
      cards.push(infoCard(t("ROUND END", "FIM DA RODADA"), t("Time's up", "Acabou o tempo"), [
        rl("Ends", modOn(4) ? "Rules Modification 4: as soon as one player says “Print!”, the round ends for all players." : "when the timer runs out or all players have said “Print!”.", "Termina", modOn(4) ? "Modificação de Regras 4: assim que um jogador diz “Imprimir!”, a rodada acaba para todos." : "quando o cronômetro acaba ou todos disseram “Imprimir!”."),
        rl("Forced", "if the timer (or the round end) forces you to print, stop playing immediately and take the next available (lowest unclaimed) Finishing Token; players forced at the same moment take them in any order (guide's reading).", "Forçado", "se o cronômetro (ou o fim da rodada) obrigar você a imprimir, pare imediatamente e pegue a próxima Ficha de Finalização disponível (a mais baixa livre); jogadores forçados no mesmo instante as pegam em qualquer ordem (leitura do guia)."),
        rl("Then", "check conflicts and score every paper (see Scoring).", "Depois", "verifiquem conflitos e pontuem todos os jornais (veja Pontuação).")
      ], [9]));
      cards.push(infoCard(t("BETWEEN ROUNDS", "ENTRE RODADAS"), t("After Friday and Saturday", "Depois de sexta e sábado"), betweenRoundLines(), [12, 4]));
    }

    if (m === "newsroom") {
      cards.push(infoCard(t("THE REPORTER", "O REPÓRTER"), t("Collecting tiles", "Coletando peças"), [
        t("There are no Reporting and Layout Phases: both roles work at the same time for the whole round.", "Não há Fases de Reportagem e Diagramação: os dois papéis trabalham ao mesmo tempo durante toda a rodada."),
        t("Begin standing next to your Layout Editor. Walk between the two tables holding your desk.", "Comece em pé ao lado do seu Editor de Diagramação. Ande entre as duas mesas segurando a sua mesa 3D."),
        rl("Reveal", "as in the standard game: pick up one tile at a time, flip it above your desk, then keep it on the desk or return it to the table faceup.", "Revelar", "como no jogo padrão: pegue uma peça por vez, vire-a acima da sua mesa 3D e então guarde-a na mesa ou devolva-a aberta."),
        rl("Keep", "put any number of tiles on the desk before carrying them; once on your desk a tile must be kept.", "Guardar", "ponha quantas peças quiser na mesa antes de carregá-las; uma peça na mesa deve ser mantida."),
        rl("Carry", "hold the desk by its legs; you cannot touch the tiles on top. If tiles fall, pick them up and return them to the desk.", "Carregar", "segure a mesa pelos pés; você não pode tocar nas peças em cima. Se peças caírem, recolha-as e devolva-as à mesa."),
        rl("Deliver", "at your partner, dump the tiles on the layout table, and go back for more as often as you choose.", "Entregar", "junto ao parceiro, despeje as peças na mesa e volte por mais quantas vezes quiser."),
        rl("Hands off", "the Reporter may not place tiles on the Paper Board, but may give placement advice.", "Sem mexer", "o Repórter não pode colocar peças no Tabuleiro de Jornal, mas pode dar sugestões.")
      ], [22]));
      cards.push(infoCard(t("THE LAYOUT EDITOR", "O EDITOR DE DIAGRAMAÇÃO"), t("Laying out the paper", "Diagramando o jornal"), [
        t("Must remain seated. May begin laying out tiles as soon as the partner delivers them.", "Deve permanecer sentado. Pode começar a diagramar assim que o parceiro entregar peças."),
        t("Places tiles as normal (placement rules) and does not need to place all tiles before more arrive.", "Coloca peças normalmente (regras de posicionamento) e não precisa colocar todas antes de chegarem mais."),
        t("Both players may communicate as much as they like.", "Os dois podem se comunicar quanto quiserem."),
        rl("“Print!”", "the Layout Editor decides when to say it and takes the lowest unclaimed Finishing Token, as normal.", "“Imprimir!”", "o Editor de Diagramação decide quando dizer e pega a Ficha de Finalização livre mais baixa, como normal."),
        interpretation("at round end, put the tiles your team collected but did not place on your team's desk: they count as leftover tiles (-1 each) and stay there for the next round, as in the standard game.", "no fim da rodada, ponham na mesa 3D da equipe as peças que ela coletou mas não colocou: elas contam como sobras (-1 cada) e ficam lá para a próxima rodada, como no jogo padrão."),
        interpretation("the conflict check is done by the Layout Editors, each checking the paper of the team seated to their left.", "a verificação de conflitos é feita pelos Editores de Diagramação, cada um conferindo o jornal da equipe sentada à sua esquerda."),
        interpretation("centerpieces 8B and 10A refer to Reporting and Layout Phases, which this mode does not have: if one is laid out, flip it to its other side (8A / 10B).", "as peças centrais 8B e 10A falam das Fases de Reportagem e Diagramação, que este modo não tem: se uma delas for aberta, virem-na para o outro lado (8A / 10B).")
      ], [22]));
      cards.push(infoCard(t("ROUND END", "FIM DA RODADA"), t("Time's up", "Acabou o tempo"), [
        t("The round ends when the timer runs out or every Layout Editor has said “Print!”; a team forced by the timer takes the next available (lowest unclaimed) token.", "A rodada acaba quando o cronômetro termina ou todo Editor de Diagramação disse “Imprimir!”; uma equipe forçada pelo cronômetro pega a próxima ficha disponível (a mais baixa livre)."),
        interpretation("once your Layout Editor says “Print!” (or time runs out), your Reporter stops collecting and comes back to the layout table; tiles still on the desk stay there and count as leftover tiles.", "assim que o seu Editor diz “Imprimir!” (ou o tempo acaba), o seu Repórter para de coletar e volta à mesa de diagramação; peças ainda na mesa 3D ficam lá e contam como sobras."),
        interpretation("at the start of the next round, the Reporter dumps any leftover tiles from the desk onto the layout table before the timer starts, so the Layout Editor can use them.", "no começo da rodada seguinte, o Repórter despeja as sobras da mesa 3D na mesa de diagramação antes de o cronômetro começar, para o Editor poder usá-las."),
        breakingOn() ? t("Read the day's Breaking News card aloud before starting the timer.", "Leiam em voz alta a carta de Breaking News do dia antes de iniciar o cronômetro.") : null,
        t("Scoring works as in the standard mode.", "A pontuação funciona como no modo padrão.")
      ], [22, 9]));
      cards.push(infoCard(t("BETWEEN ROUNDS", "ENTRE RODADAS"), t("After Friday and Saturday", "Depois de sexta e sábado"), betweenRoundLines(), [12]));
    }

    if (m === "family") {
      cards.push(infoCard(t("ONE PHASE", "UMA FASE"), t("Take and place", "Pegar e colocar"), [
        t("Reporting and Layout happen in the same phase, for the whole timer.", "Reportagem e Diagramação acontecem na mesma fase, durante todo o cronômetro."),
        rl("Take", "all players play at the same time: pick up one tile at a time from the center, faceup (including tiles others put back) or facedown; flip a facedown tile above your board (as in the standard Reporting Phase).", "Pegar", "todos jogam ao mesmo tempo: pegue uma peça por vez do centro, aberta (inclusive as que outros devolveram) ou fechada; vire uma peça fechada acima do seu tabuleiro (como na Fase de Reportagem padrão)."),
        rl("Decide", "keep it, or place it back faceup in the middle of the table.", "Decidir", "fique com ela ou devolva-a aberta ao meio da mesa."),
        rl("Place", "a tile you keep MUST be placed onto your Paper Board.", "Colocar", "uma peça que você fica DEVE ser colocada no seu Tabuleiro de Jornal."),
        rl("Rearrange", "you may rearrange tiles on your board at any time; once taken, a tile may not be removed, only moved to another location on the board.", "Reorganizar", "você pode reorganizar as peças do tabuleiro a qualquer momento; depois de pega, uma peça não pode sair, só mudar de lugar no tabuleiro."),
        rl("Facedown", "if a tile does not fit faceup without a conflict, you may place it facedown (placement rule 8).", "Virada", "se uma peça não couber aberta sem conflito, você pode colocá-la virada (regra 8)."),
        rl("Full time", "there are no Finishing Tokens and no bonus for finishing first: everyone uses the full time to perfect their paper.", "Tempo todo", "não há Fichas de Finalização nem bônus por terminar primeiro: todos usam o tempo inteiro para aperfeiçoar o jornal.")
      ], [20]));
      cards.push(infoCard(t("ROUND END", "FIM DA RODADA"), t("Score and reset", "Pontuar e recolher"), [
        t("When the timer runs out, check conflicts and score (see Scoring).", "Quando o cronômetro acabar, verifiquem conflitos e pontuem (veja Pontuação)."),
        t("Your blank-side Starting Centerpiece Tile stays with you for all three rounds.", "A sua Peça Central Inicial do lado sem pontuação fica com você nas três rodadas."),
        t("Put all Newspaper Tiles from the boards facedown back in the center and shuffle them.", "Devolvam todas as Peças de Jornal dos tabuleiros viradas ao centro e embaralhem."),
        interpretation("Family mode has no desk: tiles removed for being rotated or off the grid also go back to the center, with no leftover penalty.", "o modo família não tem mesa 3D: peças removidas por estarem giradas ou fora da grade também voltam ao centro, sem penalidade de sobra."),
        interpretation("the round also ends early if every player agrees their paper is finished.", "a rodada também acaba antes se todos concordarem que o jornal está pronto.")
      ], [20, 12]));
    }

    if (m === "turn") {
      cards.push(infoCard(t("YOUR TURN", "SEU TURNO"), t("Take these actions in order", "Faça estas ações em ordem"), [
        rl("1 · Place", "place a Newspaper Tile from your 3D Desk onto your Paper Board, following the standard placement rules.", "1 · Colocar", "coloque uma Peça de Jornal da sua mesa 3D no Tabuleiro de Jornal, seguindo as regras de posicionamento."),
        rl("2 · Reveal", "flip over up to 2 Newspaper Tiles in the center of the table, revealing them to all players. You may skip this step.", "2 · Revelar", "vire até 2 Peças de Jornal do centro da mesa, revelando-as a todos. Você pode pular este passo."),
        rl("3 · Take", "select any faceup or facedown Newspaper Tile from the center and place it on your 3D Desk — one you flipped this turn or any other faceup tile (including those revealed during setup).", "3 · Pegar", "escolha qualquer Peça de Jornal do centro, aberta ou fechada, e coloque-a na sua mesa 3D — uma que você virou neste turno ou qualquer outra aberta (inclusive as reveladas na preparação)."),
        rl("Fixed tiles", "once tiles are placed onto your board they may not be moved on future turns (except with special actions).", "Peças fixas", "depois de colocadas no tabuleiro, as peças não podem ser movidas em turnos futuros (exceto com ações especiais)."),
        rl("Centerpiece", "may always be moved, as long as it can be placed legally in another configuration.", "Peça central", "pode sempre ser movida, desde que possa ser colocada legalmente em outra configuração."),
        interpretation("play continues clockwise from the starting player (the rulebook gives no direction for turns; the centerpiece draft went counterclockwise).", "o jogo segue no sentido horário a partir do jogador inicial (o manual não indica a direção dos turnos; a escolha das peças centrais foi anti-horária).")
      ], [21]));
      cards.push(infoCard(t("SPECIAL ACTIONS", "AÇÕES ESPECIAIS"), t("Instead of placing a tile", "Em vez de colocar uma peça"), [
        t("Discard a Newspaper Tile from your 3D Desk to perform one of these:", "Descarte uma Peça de Jornal da sua mesa 3D para fazer uma destas:"),
        rl("Rearrange", "remove 3 Newspaper Tiles from their positions on your board and place them back anywhere.", "Reorganizar", "retire 3 Peças de Jornal das suas posições no tabuleiro e recoloque-as em qualquer lugar."),
        rl("Search", "flip over up to 3 Newspaper Tiles in the center, revealing them to all. This is in addition to step 2: you may reveal up to 5 tiles this turn.", "Procurar", "vire até 3 Peças de Jornal do centro, revelando-as a todos. Isso é além do passo 2: você pode revelar até 5 peças neste turno."),
        t("After a special action you still carry out steps 2 and 3 (flip tiles, take a tile).", "Depois de uma ação especial você ainda faz os passos 2 e 3 (virar peças, pegar uma peça)."),
        interpretation("the discarded tile leaves the game; set it aside out of play.", "a peça descartada sai do jogo; deixe-a de lado, fora de jogo.")
      ], [21]));
      cards.push(infoCard(t("GAME END", "FIM DA PARTIDA"), t("Saying “Print!”", "Dizendo “Imprimir!”"), [
        t("On your turn, before or after placing a tile, you may say “Print!” — only if you have no space left to place the tile(s) remaining on your desk.", "No seu turno, antes ou depois de colocar uma peça, você pode dizer “Imprimir!” — só se não houver mais espaço para as peças que restam na sua mesa 3D."),
        t("Your turn ends immediately: you do not flip or take a tile.", "Seu turno acaba na hora: você não vira nem pega peça."),
        t("All other players then simultaneously play any tiles remaining on their desks onto their boards. You do not place any more tiles.", "Então todos os outros jogadores colocam ao mesmo tempo as peças que restam nas suas mesas. Você não coloca mais peças."),
        t("Then go to final scoring.", "Depois sigam para a pontuação final."),
        t("Even without room for your remaining tiles, you may take a special action instead of saying “Print!”; then the game end is not triggered.", "Mesmo sem espaço para as peças restantes, você pode fazer uma ação especial em vez de dizer “Imprimir!”; aí o fim da partida não é acionado.")
      ], [21]));
    }

    if (m === "puzzle") {
      const pz = puzzle();
      cards.push(infoCard(t("LAYOUT ONLY", "SÓ DIAGRAMAÇÃO"), t(`Puzzle ${pz[0]}: find the best layout`, `Quebra-cabeça ${pz[0]}: ache a melhor diagramação`), [
        t("You already have all the tiles you need, so you only play the Layout Phase.", "Você já tem todas as peças necessárias, então só joga a Fase de Diagramação."),
        t("Placement rules are the same as in the standard solo or multiplayer game.", "As regras de posicionamento são as mesmas do jogo padrão solo ou multijogador."),
        rl("Exception", "ALL ads MUST be placed. Failing to place an ad gives an “incomplete” score for the puzzle.", "Exceção", "TODOS os anúncios DEVEM ser colocados. Deixar um anúncio de fora dá pontuação “incompleta” ao quebra-cabeça."),
        t("You will not be able to play all of the tiles provided; there is no penalty for unplaced tiles (except ads).", "Não dá para jogar todas as peças fornecidas; não há penalidade por peças não colocadas (exceto anúncios)."),
        t("Tiles with conflicts must be flipped to resolve the conflicts before scoring.", "Peças em conflito devem ser viradas para resolver os conflitos antes de pontuar."),
        t("Try again as often as you like: the page has room to record several attempts.", "Tente quantas vezes quiser: a página tem espaço para anotar várias tentativas.")
      ], [14, pz[3]]));
    }

    const pages = { turn: [20, 21], puzzle: [14], family: [20], newsroom: [22] }[m] || [6, 8, 9, 12];
    return `
      ${sectionHeading("play", playTitle(), pages)}
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- placement ----------

  function placementSection() {
    return `
      ${sectionHeading("placement", t("Placement rules", "Regras de posicionamento"), [9, 12])}
      <div class="quick-grid">
        ${infoCard(t("THE 8 RULES", "AS 8 REGRAS"), t("Laying out your paper", "Diagramando o seu jornal"), placementLines(), [9])}
        <article class="info-card">
          <span class="component-label">${t("ILLUSTRATED", "ILUSTRADO")}</span>
          <h3>${t("The rules on a paper", "As regras num jornal")}</h3>
          <figure class="ftp-example-art"><img src="${ART}layout-rules.webp" alt="${t("Rulebook example paper with numbered markers 1 to 8, ticks and crosses", "Jornal de exemplo do manual com marcadores numerados de 1 a 8, certos e xis")}" loading="lazy"><figcaption>${t("Each number matches the rule of the same number; a tick is legal, a cross breaks the rule.", "Cada número corresponde à regra de mesmo número; um certo é legal, um xis desrespeita a regra.")}</figcaption></figure>
          ${referenceLink(9)}
        </article>
        ${infoCard(t("AT SCORING", "NA PONTUAÇÃO"), t("Conflicts", "Conflitos"), [
          mode() === "puzzle" || count() === 1
            ? t("Check your own paper before scoring.", "Confira o seu próprio jornal antes de pontuar.")
            : t("Once all papers are finished, each player checks the board of the player to their left for conflicts.", "Quando todos os jornais estiverem prontos, cada jogador confere o tabuleiro do jogador à sua esquerda."),
          ...conflictLines().filter((line, index) => !(index === 1 && !usesDesk()))
        ], [12])}
      </div>`;
  }

  // ---------- scoring ----------

  function scoringSection() {
    const m = mode();
    const cards = [];
    cards.push(infoCard(t("POINTS", "PONTOS"), t("Articles and photos", "Artigos e fotos"), [
      rl("Articles", "earn points equal to the total of the numbers shown on each tile (1 or 2, by size). Facedown tiles score nothing.", "Artigos", "valem a soma dos números mostrados em cada peça (1 ou 2, conforme o tamanho). Peças viradas não pontuam."),
      rl("Photos", "earn 1 point per orthogonally adjacent Article Tile of the color or mood shown by the icon on the photo.", "Fotos", "valem 1 ponto por Peça de Artigo ortogonalmente adjacente da cor ou humor indicado pelo ícone na foto."),
      t("Each adjacent article scores only 1 point for a photo, whatever its mood or point value.", "Cada artigo adjacente vale só 1 ponto para uma foto, qualquer que seja seu humor ou valor."),
      t("Several photos can each score the same article if it touches all of them.", "Várias fotos podem pontuar o mesmo artigo se ele tocar todas.")
    ], [10, 12]));
    cards.push(infoCard(t("CENTERPIECE", "PEÇA CENTRAL"), t("Your centerpiece", "Sua peça central"), [
      m === "family"
        ? t("Family mode: your centerpiece is on its blank side and scores nothing; it still must cover the star.", "Modo família: a sua peça central está do lado sem pontuação e não marca nada; ainda deve cobrir a estrela.")
        : t("Earns points according to the value printed on it, and must be placed so the star square is covered.", "Vale pontos conforme o valor impresso nela e deve ficar cobrindo o quadrado da estrela."),
      m !== "family" ? t("Some centerpieces grant extra bonuses that affect other parts of your score.", "Algumas peças centrais dão bônus extras que afetam outras partes da sua pontuação.") : null,
      rl("Above the fold", "a tile is “above the fold” if any part of it is above the fold line.", "Acima da dobra", "uma peça está “acima da dobra” se qualquer parte dela estiver acima da linha da dobra."),
      m === "scenario" && count() > 1 ? t("Scenario with proxies: score as if your proxy were the scenario's centerpiece for that day.", "Cenário com substitutos: pontue como se o seu substituto fosse a peça central do cenário naquele dia.") : null,
      m === "family" ? t("The ad-revenue -5 penalty is recorded in the “Centerpiece” row of the scorepad.", "A penalidade de -5 por receita de anúncios é anotada na linha “Centerpiece” do bloco.") : null
    ], m === "family" ? [20, 12] : [12]));

    if (modOn(1)) {
      cards.push(infoCard(t("RULES MODIFICATION 1", "MODIFICAÇÃO DE REGRAS 1"), t("Empty squares", "Quadrados vazios"), [
        t("Score -1 point per empty square instead of the White Space Bonus.", "Marque -1 ponto por quadrado vazio em vez do Bônus de Espaço em Branco."),
        interpretation("count every empty square inside this round's region (Friday: the “Fri” region only).", "conte todo quadrado vazio dentro da região da rodada (sexta: só a região “Fri”).")
      ], [18]));
    } else if (!noWhiteSpace()) {
      const wsLines = [
        t("Count your largest area of adjacent empty squares of the grid (squares with no Newspaper Tile on them). Only the largest area counts.", "Conte a sua maior área de quadrados vazios adjacentes da grade (quadrados sem Peça de Jornal). Só a maior área conta."),
        interpretation("count only squares inside this round's region; on Friday the shaded “Sat” area is not part of the paper.", "conte só os quadrados dentro da região da rodada; na sexta a área sombreada “Sat” não faz parte do jornal.")
      ];
      if (soloRules()) {
        wsLines.push(rl("0–1 squares", "+3 points", "0–1 quadrados", "+3 pontos"), rl("2–3 squares", "+2 points", "2–3 quadrados", "+2 pontos"), rl("4–5 squares", "+1 point", "4–5 quadrados", "+1 ponto"), rl("6–7 squares", "0 points", "6–7 quadrados", "0 ponto"), rl("8 or more", "-1 point", "8 ou mais", "-1 ponto"));
      } else {
        wsLines.push(t("All players compare their largest areas:", "Todos comparam as suas maiores áreas:"), rl("Smallest", "+3 points", "Menor", "+3 pontos"), rl("Largest", "-1 point", "Maior", "-1 ponto"), rl("Neither", "+1 point", "Nenhum dos dois", "+1 ponto"), t("If tied, each tied player receives the reward or penalty.", "Em caso de empate, cada empatado recebe o bônus ou a penalidade."));
      }
      cards.push(infoCard(t("WHITE SPACE BONUS", "BÔNUS DE ESPAÇO EM BRANCO"), soloRules() ? t("Solo table", "Tabela solo") : t("Compare with everyone", "Compare com todos"), wsLines, soloRules() ? [14, 11] : [11, 12]));
    }

    if (!noMood()) {
      cards.push(infoCard(t("MOOD", "HUMOR"), t("Keep the paper balanced", "Mantenha o jornal equilibrado"), [
        t("Articles are good news (yellow smiley face icons) or bad news (blue frowny face icons); larger articles may show several.", "Artigos são boas notícias (ícones de rosto sorridente amarelo) ou más notícias (ícones de rosto triste azul); artigos maiores podem ter vários."),
        t("Count all smiley and all frowny faces on the faceup articles of your paper. Unless they are equal, you lose points equal to the difference.", "Conte todos os rostos sorridentes e tristes nos artigos abertos do seu jornal. A menos que sejam iguais, você perde pontos iguais à diferença."),
        t("The mood icons printed on photos (some photos score good or bad news articles) do not count toward your mood.", "Os ícones de humor impressos nas fotos (algumas fotos pontuam artigos de boa ou má notícia) não contam para o seu humor."),
        rl("Example", "5 smiley and 3 frowny faces → mood 2 → -2 points.", "Exemplo", "5 rostos sorridentes e 3 tristes → humor 2 → -2 pontos.")
      ], [11, 12]));
    } else {
      cards.push(infoCard(t("FAMILY MODE", "MODO FAMÍLIA"), t("Not scored", "Não pontuado"), [
        t("There is no mood penalty for an imbalance of good and bad news. Some photos still earn points for adjacent articles of a specific mood.", "Não há penalidade de humor por desequilíbrio entre boas e más notícias. Algumas fotos ainda pontuam artigos adjacentes de um humor específico."),
        t("There is no white space scoring: simply try to fill your board to gain the most points from your tiles.", "Não há pontuação de espaço em branco: tente apenas preencher o tabuleiro para ganhar o máximo de pontos com as peças.")
      ], [20]));
    }

    const adLines = [];
    if (m === "puzzle") {
      adLines.push(t("Ads are not scored, but every ad must be placed on the paper without conflict, or the score is “incomplete”.", "Anúncios não pontuam, mas todo anúncio deve ser colocado no jornal sem conflito, ou a pontuação fica “incompleta”."));
    } else {
      adLines.push(t("Ads do not earn points but earn ad revenue equal to the number of dollar signs on the tile.", "Anúncios não dão pontos, mas dão receita igual ao número de símbolos de dólar na peça."));
      if (usesDesk()) {
        adLines.push(rl("Leftovers", `each unplaced tile left on your desk counts -1 point, whatever its type or size.${threeDays() ? " These tiles stay on your desk and may be used in the following round." : ""}`, "Sobras", `cada peça não colocada que fica na sua mesa 3D vale -1 ponto, qualquer que seja o tipo ou tamanho.${threeDays() ? " Essas peças ficam na mesa e podem ser usadas na rodada seguinte." : ""}`));
      }
      if (threeDays()) adLines.push(t("Points and ad revenue are added up from one round to the next, so everyone knows the standings going into each round.", "Pontos e receita de anúncios são somados de uma rodada para a outra, para todos saberem a classificação a cada rodada."));
      adLines.push(t("A round's total score and ad revenue can't be negative: if it happens, that round gives 0 points or $0.", "A pontuação e a receita de uma rodada não podem ser negativas: se acontecer, a rodada dá 0 ponto ou $0."));
      if (breakingOn()) {
        adLines.push(t("Breaking News cards score in their most relevant category on the scorepad.", "As cartas de Breaking News pontuam na categoria mais adequada do bloco."));
      }
    }
    cards.push(infoCard(t("ADS & TOTALS", "ANÚNCIOS E TOTAIS"), t("Revenue, leftovers, totals", "Receita, sobras, totais"), adLines, m === "puzzle" ? [14] : [12]));

    cards.push(infoCard(t("SCOREPAD", "BLOCO"), t("Rows of the scorepad", "Linhas do bloco"), [
      t("Articles · Photos · Centerpiece · White space · Mood · Leftovers → Round total → Total.", "Articles (artigos) · Photos (fotos) · Centerpiece (peça central) · White space (espaço em branco) · Mood (humor) · Leftovers (sobras) → Round total → Total."),
      t("Round ad → Total ad (ad revenue).", "Round ad → Total ad (receita de anúncios)."),
      m === "family" ? t("Family mode: leave White space, Mood and Leftovers at 0; the -5 ad penalty goes in the Centerpiece row at the end of the game.", "Modo família: deixem White space, Mood e Leftovers em 0; a penalidade de -5 por anúncios vai na linha Centerpiece no fim da partida.") : null,
      m === "puzzle" ? t("Puzzle mode: Leftovers stay at 0; ads are not scored.", "Modo quebra-cabeça: Leftovers fica em 0; anúncios não pontuam.") : null,
      threeDays() ? t("One column per day: Fri, Sat, Sun.", "Uma coluna por dia: Fri, Sat, Sun.") : t("Use a single column (the game is one round).", "Use uma só coluna (a partida tem uma rodada).")
    ], [13]));

    return `
      ${sectionHeading("scoring", t("Scoring", "Pontuação"), m === "puzzle" ? [14, 12] : [10, 11, 12])}
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- clarifications ----------

  function centerpiecesInPlay() {
    const m = mode();
    if (m === "puzzle") {
      return [puzzle()[2]];
    }
    if (m === "scenario") {
      return [scenario()[3], scenario()[5], scenario()[7]];
    }
    if (m === "family") {
      return [];
    }
    if (m === "turn") {
      return Object.keys(CENTERPIECE_NOTES).filter((code) => code.startsWith("S") || (/^[1-9]A$/.test(code)));
    }
    if (m === "newsroom") {
      return Object.keys(CENTERPIECE_NOTES).filter((code) => code !== "8B" && code !== "10A");
    }
    return Object.keys(CENTERPIECE_NOTES);
  }

  function centerpieceNotesInPlay() {
    return centerpiecesInPlay().filter((code) => CENTERPIECE_NOTES[code]);
  }

  function charactersInPlay() {
    if (mode() === "scenario") {
      return [scenario()[2]].filter((key) => CHARACTER_NOTES[key]);
    }
    return powersOn() ? Object.keys(CHARACTER_NOTES) : [];
  }

  function breakingInPlay() {
    if (mode() === "scenario") {
      const sc = scenario();
      return BREAKING_NOTES.filter((note) => (note.day === "Fri" && note.n === sc[4]) || (note.day === "Sat" && note.n === sc[6]) || (note.day === "Sun" && note.n === sc[8]));
    }
    if (!breakingOn()) {
      return [];
    }
    return mode() === "turn" ? BREAKING_NOTES.filter((note) => note.day === "Sat") : BREAKING_NOTES;
  }

  function hasClarifications() {
    return mode() !== "family";
  }

  function cardsSection() {
    const m = mode();
    const cards = [];
    const cps = centerpieceNotesInPlay();
    const cpLines = cps.map((code) => rl(`${code} · ${CENTERPIECE_NAMES[code]}`, CENTERPIECE_NOTES[code][0], `${code} · ${CENTERPIECE_NAMES[code]}`, CENTERPIECE_NOTES[code][1]));
    cards.push(infoCard(t("CENTERPIECES", "PEÇAS CENTRAIS"), t("Read the tile; these need a note", "Leia a peça; estas precisam de nota"), [
      t("Each centerpiece's scoring condition is printed on the tile itself. Tile numbers (1–12) with a letter (A/B) name a Centerpiece Tile and its side; S1–S6 are the Starting Centerpiece Tiles.", "A condição de pontuação de cada peça central está impressa na própria peça. Números (1–12) com letra (A/B) indicam uma Peça Central e o seu lado; S1–S6 são as Peças Centrais Iniciais."),
      ...(cpLines.length ? cpLines : [t("None of the centerpieces in this match has a clarification in the rulebook.", "Nenhuma peça central desta partida tem esclarecimento no manual.")])
    ], [23]));
    const chars = charactersInPlay();
    if (powersOn()) {
      cards.push(infoCard(t("CHARACTERS", "PERSONAGENS"), m === "scenario" ? t(`Character: ${characterName(scenario()[2])}`, `Personagem: ${characterName(scenario()[2])}`) : t("Player powers", "Poderes dos jogadores"), [
        t("Each character's power is printed on its card (Fox, Owl, Bear, Squirrel, Rabbit, Raccoon). The rulebook clarifies three:", "O poder de cada personagem está impresso na carta (Raposa, Coruja, Urso, Esquilo, Coelho, Guaxinim). O manual esclarece três:"),
        ...(chars.length ? chars.map((key) => rl(characterName(key), CHARACTER_NOTES[key][0], characterName(key), CHARACTER_NOTES[key][1])) : [t(`The ${characterName(scenario()[2])} card has no clarification in the rulebook: follow the card.`, `A carta ${characterName(scenario()[2])} não tem esclarecimento no manual: siga a carta.`)])
      ], [23, 7]));
    }
    if (breakingOn()) {
      const notes = breakingInPlay();
      cards.push(infoCard(t("BREAKING NEWS", "BREAKING NEWS"), t("Daily restrictions and bonuses", "Restrições e bônus do dia"), [
        !threeDays() ? t("Each card's effect is printed on it.", "O efeito de cada carta está impresso nela.")
          : m === "scenario" ? t("Each card's effect is printed on it. Each day's card is revealed between rounds, before that day's round starts.", "O efeito de cada carta está impresso nela. A carta de cada dia é revelada entre as rodadas, antes de começar a rodada daquele dia.")
            : t("Each card's effect is printed on it. Cards are revealed before players choose centerpieces for the next round.", "O efeito de cada carta está impresso nela. As cartas são reveladas antes de os jogadores escolherem as peças centrais da próxima rodada."),
        threeDays() ? interpretation("only the current day's card applies: when the next day's card is revealed, set the previous one aside.", "só vale a carta do dia atual: quando a carta do dia seguinte for revelada, deixem a anterior de lado.") : null,
        t("If you place tiles that violate the round's card, you must flip tiles over to resolve the conflict.", "Se você colocar peças que violem a carta da rodada, precisa virar peças para resolver o conflito."),
        t("Tiles that cross the fold count as both above and below the fold.", "Peças que cruzam a dobra contam como acima e abaixo da dobra."),
        ...notes.map((note) => rl(`${dayName(note.day)} ${note.n} · ${note.name}`, note.text[0], `${dayName(note.day)} ${note.n} · ${note.name}`, note.text[1])),
        mode() === "scenario" && !notes.length ? t("The scenario's three cards have no further clarification: follow the cards.", "As três cartas do cenário não têm esclarecimento adicional: sigam as cartas.") : null
      ], [23]));
    }
    return `
      ${sectionHeading("cards", t("Cards & centerpieces", "Cartas e peças centrais"), [23])}
      <p class="glossary-intro">${t("The rulebook's Clarifications page, filtered to what this match can show.", "A página de Esclarecimentos do manual, filtrada para o que esta partida pode mostrar.")}</p>
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- achievements ----------

  function achievementsSection() {
    const m = mode();
    const cards = [];
    if (m === "scenario") {
      const sc = scenario();
      cards.push(infoCard(t(`SCENARIO ${sc[0]}`, `CENÁRIO ${sc[0]}`), `${difficultyName(sc[1])} · ${characterName(sc[2])}`, [
        rl("Friday", `centerpiece ${centerpieceLabel(sc[3])}, Breaking News ${sc[4]}.`, "Sexta", `peça central ${centerpieceLabel(sc[3])}, Breaking News ${sc[4]}.`),
        rl("Saturday", `centerpiece ${centerpieceLabel(sc[5])}, Breaking News ${sc[6]}.`, "Sábado", `peça central ${centerpieceLabel(sc[5])}, Breaking News ${sc[6]}.`),
        rl("Sunday", `centerpiece ${centerpieceLabel(sc[7])}, Breaking News ${sc[8]}.`, "Domingo", `peça central ${centerpieceLabel(sc[7])}, Breaking News ${sc[8]}.`),
        rl("Minimum ad value", `$${sc[9]}.`, "Receita mínima", `$${sc[9]}.`),
        rl("Minimum points", `${sc[10]}.`, "Pontos mínimos", `${sc[10]}.`),
        sc[11] ? rl("Additional goal", sc[11][0], "Meta adicional", sc[11][1]) : null,
        t("Completed: fill in your shape on the scenario's row (p. 19) and a task on your desk track (p. 17).", "Completado: preencha a sua forma na linha do cenário (p. 19) e uma tarefa na sua trilha (p. 17).")
      ], [19]));
    } else {
      cards.push(infoCard(t("STANDARD GAME MODE", "MODO JOGO PADRÃO"), t("25 achievements", "25 conquistas"), ACHIEVEMENTS.map(([en, pt], index) => `<strong>${index + 1}.</strong> ${t(en, pt)}`), [18]));
      cards.push(infoCard(t("RULES MODIFICATIONS", "MODIFICAÇÕES DE REGRAS"), state.mod === "none" ? t("7 rule changes", "7 mudanças de regra") : t(`Playing modification ${state.mod}`, `Jogando a modificação ${state.mod}`), [
        ...Object.entries(MOD_TEXT).filter(([key]) => !(m === "solo" && key === "4")).map(([key, [en, pt]]) => `<strong>${key}${state.mod === key ? " ✓" : ""}.</strong> ${t(en, pt)}`),
        interpretation("the rulebook does not say what earns a Rules Modification achievement; agree on it before you play (for example: finish the game, or win it, with that change).", "o manual não diz o que garante uma conquista de Modificação de Regras; combinem antes de jogar (por exemplo: terminar a partida, ou vencê-la, com essa mudança).")
      ], [18]));
    }
    cards.push(infoCard(t("TRACKING", "ACOMPANHAMENTO"), t("Achievement Desk Tracks", "Trilhas de Conquista"), [
      t("Up to 6 players write their name on one of the desks on page 17; each desk has a shape (triangle, pentagon, diamond, hexagon, star, square).", "Até 6 jogadores escrevem o nome numa das mesas da página 17; cada mesa tem uma forma (triângulo, pentágono, losango, hexágono, estrela, quadrado)."),
      t("Whenever you gain an achievement in any mode, fill in your shape under that mode, then fill in one task on your desk.", "Sempre que obtiver uma conquista em qualquer modo, preencha a sua forma naquele modo e depois uma tarefa na sua mesa."),
      t("You may begin gaining achievements at any time.", "Você pode começar a obter conquistas a qualquer momento.")
    ], [17]));
    return `
      ${sectionHeading("achievements", t("Achievements", "Conquistas"), m === "scenario" ? [17, 19] : [17, 18])}
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- iconography ----------

  function iconsSection() {
    const icons = [
      iconCard("sports-entertainment", "Sports and Entertainment", "Pink article color/icon. Two pink articles may not touch.", "Esportes e Entretenimento", "Cor/ícone rosa de artigo. Dois artigos rosa não podem se tocar.", 10),
      iconCard("business-technology", "Business and Technology", "Green article color/icon. Two green articles may not touch.", "Negócios e Tecnologia", "Cor/ícone verde de artigo. Dois artigos verdes não podem se tocar.", 10),
      iconCard("news", "News", "Blue article color/icon. Two blue articles may not touch.", "Notícias", "Cor/ícone azul de artigo. Dois artigos azuis não podem se tocar.", 10)
    ];
    if (!noMood()) {
      icons.push(
        iconCard("good-news", "Good news (smiley face)", "Yellow mood icon on articles. Count them against the frowny faces for your mood penalty.", "Boa notícia (rosto sorridente)", "Ícone amarelo de humor nos artigos. Conte-os contra os rostos tristes para a penalidade de humor.", 11),
        iconCard("bad-news", "Bad news (frowny face)", "Blue mood icon on articles. Larger articles may show several.", "Má notícia (rosto triste)", "Ícone azul de humor nos artigos. Artigos maiores podem ter vários.", 11)
      );
    } else {
      icons.push(
        iconCard("good-news", "Good news (smiley face)", "Yellow mood icon on articles. Family mode has no mood penalty, but some photos score good-news articles.", "Boa notícia (rosto sorridente)", "Ícone amarelo de humor nos artigos. O modo família não tem penalidade de humor, mas algumas fotos pontuam artigos de boa notícia.", 11),
        iconCard("bad-news", "Bad news (frowny face)", "Blue mood icon on articles. Some photos score bad-news articles.", "Má notícia (rosto triste)", "Ícone azul de humor nos artigos. Algumas fotos pontuam artigos de má notícia.", 11)
      );
    }
    icons.push(
      iconCard("article-points", "Article points", "The orange rosette on an article shows its value: 1 or 2 points, depending on the article's size.", "Pontos do artigo", "A roseta laranja num artigo mostra o seu valor: 1 ou 2 pontos, conforme o tamanho do artigo.", 10),
      iconCard("photo-scoring", "Photo scoring icon", "1 point × the icon shown: 1 point per orthogonally adjacent article of that color (here Business and Technology) or that mood.", "Ícone de pontuação da foto", "1 ponto × o ícone mostrado: 1 ponto por artigo ortogonalmente adjacente daquela cor (aqui Negócios e Tecnologia) ou daquele humor.", 10),
      iconCard("ad-revenue", "Ad revenue ($)", mode() === "puzzle" ? "Dollar signs on an ad. In Puzzle mode ads are not scored but must all be placed." : "Each dollar sign on an ad is $1 of ad revenue (this one: $2).", "Receita de anúncio ($)", mode() === "puzzle" ? "Símbolos de dólar num anúncio. No modo quebra-cabeça os anúncios não pontuam, mas todos devem ser colocados." : "Cada símbolo de dólar num anúncio vale $1 de receita (este: $2).", 10),
      iconCard("star-square", "Star square", "The square on the top half of the Paper Board that your centerpiece must cover.", "Quadrado da estrela", "O quadrado na metade de cima do Tabuleiro de Jornal que a sua peça central deve cobrir.", 8)
    );
    if (usesTokens()) {
      icons.push(iconCard("finishing-token", "Finishing Token", "Numbered 1–6. Take the lowest unclaimed one when you say “Print!”. Low numbers choose centerpieces first and win ties.", "Ficha de Finalização", "Numeradas de 1 a 6. Pegue a mais baixa livre ao dizer “Imprimir!”. Números baixos escolhem peças centrais primeiro e vencem empates.", 3));
    }
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), [10, 11])}
      <p class="glossary-intro">${t("Each symbol below is cropped individually from the rulebook's pictures.", "Cada símbolo abaixo foi recortado individualmente das figuras do manual.")}</p>
      <div class="icon-grid">${icons.join("")}</div>`;
  }

  // ---------- examples ----------

  function exampleCard(example, index, sourceEn, sourcePt) {
    return `
      <article class="example-card">
        <span class="card-number">${String(index + 1).padStart(2, "0")}</span>
        <h3>${example.title}</h3>
        ${example.art ? `<figure class="ftp-example-art"><img src="${ART}${example.art[0]}.webp" alt="${example.art[1]}" loading="lazy"><figcaption>${example.art[1]}</figcaption></figure>` : ""}
        ${lineList(example.lines)}
        <div class="example-source"><span>${t(sourceEn, sourcePt)}</span>${referenceLink(example.page)}</div>
      </article>`;
  }

  function examplesSection() {
    const m = mode();
    const manual = [
      {
        title: t("Tile types and a scoring photo", "Tipos de peça e uma foto pontuando"),
        art: ["tile-types", t("Article parts (color, mood, points), a photo scoring Business and Technology articles, an ad worth $2 and a sample paper", "Partes do artigo (cor, humor, pontos), uma foto que pontua artigos de Negócios e Tecnologia, um anúncio de $2 e um jornal de exemplo")],
        lines: [
          t("An article shows its color icon, its mood faces and its point value.", "Um artigo mostra o ícone de cor, os rostos de humor e o valor em pontos."),
          t("The train photo scores 1 point per adjacent Business and Technology article.", "A foto do trem pontua 1 por artigo de Negócios e Tecnologia adjacente."),
          t("The “Vote” ad brings $2 of ad revenue.", "O anúncio “Vote” traz $2 de receita.")
        ],
        page: 10
      }
    ];
    if (!noMood()) {
      manual.push({
        title: t("Mood penalty", "Penalidade de humor"),
        lines: [
          t("A paper with 5 smiley face icons and 3 frowny face icons has a mood of 2.", "Um jornal com 5 rostos sorridentes e 3 tristes tem humor 2."),
          t("It receives a mood penalty of -2.", "Ele recebe penalidade de humor -2.")
        ],
        page: 11
      });
    }
    if (!noWhiteSpace() && !modOn(1)) {
      manual.push({
        title: t("Largest white space", "Maior espaço em branco"),
        art: ["white-space", t("A paper with empty areas of 2, 4 and 6 squares", "Um jornal com áreas vazias de 2, 4 e 6 quadrados")],
        lines: [
          t("This paper has empty areas of 2, 4 and 6 squares.", "Este jornal tem áreas vazias de 2, 4 e 6 quadrados."),
          t("Only the largest contiguous area counts: 6.", "Só a maior área contínua conta: 6."),
          soloRules() ? t("Solo table: 6–7 squares = 0 points.", "Tabela solo: 6–7 quadrados = 0 ponto.") : t("It is then compared with the other players' largest areas.", "Ela é então comparada com as maiores áreas dos outros jogadores.")
        ],
        page: 11
      });
    }
    if (m !== "family" && m !== "puzzle") {
      manual.push({
        title: t("A scored Friday paper", "Um jornal de sexta pontuado"),
        art: ["scoring-example", t("The Babbling Brook paper with its scorepad column", "O jornal The Babbling Brook com a sua coluna no bloco")],
        lines: [
          rl("1", "8 points for the 7 articles.", "1", "8 pontos pelos 7 artigos."),
          rl("2", "5 points for 2 photos: the Sports and Entertainment/News photo earns 4 (2 pink and 2 blue articles adjacent), the bad-news photo earns 1 (1 bad-news article adjacent).", "2", "5 pontos por 2 fotos: a foto de Esportes e Entretenimento/Notícias faz 4 (2 artigos rosa e 2 azuis adjacentes), a foto de má notícia faz 1 (1 artigo de má notícia adjacente)."),
          rl("3", "2 points for the centerpiece: 2 pairs of good- and bad-news articles above the fold.", "3", "2 pontos pela peça central: 2 pares de artigos de boa e má notícia acima da dobra."),
          rl("4", "largest white space: 4 squares — the smallest of all players, so +3.", "4", "maior espaço em branco: 4 quadrados — o menor de todos os jogadores, então +3."),
          rl("5", "5 frowny and 3 smiley faces: -2.", "5", "5 rostos tristes e 3 sorridentes: -2."),
          rl("6", "-2 for 2 unplaced tiles.", "6", "-2 por 2 peças não colocadas."),
          rl("7", "$3 of ad revenue for the 2 ads.", "7", "$3 de receita pelos 2 anúncios."),
          t("Points: 8 + 5 + 2 + 3 − 2 − 2 = 14.", "Pontos: 8 + 5 + 2 + 3 − 2 − 2 = 14.")
        ],
        page: 13
      });
    }
    const guide = [];
    if (twoSides()) {
      guide.push({
        title: t("Two-player ad penalty", "Penalidade de anúncios com 2"),
        lines: [
          t("Guide's example: after Sunday Ana has $14 of ad revenue and Bia $8.", "Exemplo do guia: depois de domingo Ana tem $14 de receita e Bia $8."),
          t("Bia has $6 less — more than $5 — so she loses 10 points but can still win.", "Bia tem $6 a menos — mais de $5 — então perde 10 pontos, mas ainda pode vencer."),
          t("With $9 she would have exactly $5 less: no penalty.", "Com $9 ela teria exatamente $5 a menos: sem penalidade.")
        ],
        page: 13
      });
    } else if (!soloRules() && !lowestAdMinusFive()) {
      guide.push({
        title: t("Out of business", "Falência"),
        lines: [
          t(`Guide's example, ${count()} ${competitors()}: after Sunday the highest score is 52, but that paper has the lowest total ad revenue ($9; everyone else has more).`, `Exemplo do guia, ${count()} ${competitors()}: depois de domingo a maior pontuação é 52, mas esse jornal tem a menor receita total ($9; todos os outros têm mais).`),
          t("It goes out of business; the next highest score wins.", "Ele vai à falência; vence a próxima maior pontuação."),
          t("Two players at 48 tie for the win: the one who took the lower Finishing Token on Sunday wins.", "Dois jogadores com 48 empatam: vence quem pegou a Ficha de Finalização mais baixa no domingo.")
        ],
        page: 13
      });
    }
    if (lowestAdMinusFive()) {
      guide.push({
        title: t("The -5 ad penalty", "A penalidade de -5 por anúncios"),
        lines: [
          t("Guide's example: final ad revenue Ana $9, Bia $6, Caio $6.", "Exemplo do guia: receita final Ana $9, Bia $6, Caio $6."),
          t("Bia and Caio share the lowest total, so no single player has it: nobody loses 5 points.", "Bia e Caio dividem o menor total, então nenhum jogador sozinho o tem: ninguém perde 5 pontos."),
          t("Had Caio $7, only Bia would score -5.", "Se Caio tivesse $7, só Bia marcaria -5.")
        ],
        page: m === "family" ? 20 : 21
      });
    }
    if (m === "turn") {
      guide.push({
        title: t("A turn with Search", "Um turno com Procurar"),
        lines: [
          t("Guide's example: Ana discards a tile from her desk to Search and flips 3 center tiles.", "Exemplo do guia: Ana descarta uma peça da mesa 3D para Procurar e vira 3 peças do centro."),
          t("Step 2: she flips 2 more (5 revealed this turn).", "Passo 2: ela vira mais 2 (5 reveladas neste turno)."),
          t("Step 3: she takes one faceup tile onto her desk. She placed no tile this turn.", "Passo 3: ela pega uma peça aberta para a mesa 3D. Ela não colocou peça neste turno.")
        ],
        page: 21
      });
    }
    if (soloRules() && m !== "puzzle") {
      guide.push({
        title: t("Solo white space", "Espaço em branco solo"),
        lines: [
          t("Guide's example: your largest empty area is 3 squares → +2. With 5 squares → +1; with 8 → -1.", "Exemplo do guia: sua maior área vazia tem 3 quadrados → +2. Com 5 → +1; com 8 → -1."),
          t(`At the end your ad revenue must total at least $${m === "scenario" ? scenario()[9] : 12}.`, `No fim sua receita deve somar pelo menos $${m === "scenario" ? scenario()[9] : 12}.`)
        ],
        page: 14
      });
    }
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), [10, 11, 13])}
      <div class="example-grid ftp-example-grid">${manual.map((example, index) => exampleCard(example, index, "Rulebook example", "Exemplo do manual")).join("")}${guide.map((example, index) => exampleCard(example, manual.length + index, "Guide's example, built from the rules", "Exemplo do guia, construído a partir das regras")).join("")}</div>`;
  }

  // ---------- glossary ----------

  function glossarySection() {
    const m = mode();
    const items = [
      { term: ["Above the fold", "Acima da dobra"], text: ["A tile with any part above the fold line. Tiles crossing the fold are both above and below it.", "Uma peça com qualquer parte acima da linha da dobra. Peças que cruzam a dobra estão acima e abaixo dela."], page: 12 },
      { term: ["Ad", "Anúncio"], text: ["Orange tile worth no points; each $ is $1 of ad revenue. Ads may not touch each other.", "Peça laranja que não vale pontos; cada $ é $1 de receita. Anúncios não podem se tocar."], page: 10 },
      { term: ["Adjacent", "Adjacente"], text: ["Touching along a side (orthogonally), not only at a corner.", "Encostado por um lado (ortogonalmente), não só pela quina."], page: 10 },
      { term: ["Article", "Artigo"], text: ["Story tile with a color (pink, green, blue), mood faces and a value of 1 or 2 points.", "Peça de matéria com cor (rosa, verde, azul), rostos de humor e valor de 1 ou 2 pontos."], page: 10 },
      { term: ["Centerpiece", "Peça central"], text: ["The tile covering your star square; its scoring condition is printed on it.", "A peça que cobre o quadrado da estrela; a condição de pontuação está impressa nela."], page: 12 },
      { term: ["Conflict", "Conflito"], text: ["Same-color articles, two ads or two photos touching; resolved by flipping tiles at scoring.", "Artigos da mesma cor, dois anúncios ou duas fotos se tocando; resolvido virando peças na pontuação."], page: 12 },
      { term: ["Facedown tile", "Peça virada"], text: ["A tile placed back up: 0 points, but it fills space and is not a leftover.", "Uma peça colocada com o verso para cima: 0 ponto, mas preenche espaço e não é sobra."], page: 9 },
      { term: ["Fold", "Dobra"], text: ["The shadow line across the middle of the Paper Board. Tiles may cross it.", "A linha de sombra no meio do Tabuleiro de Jornal. Peças podem cruzá-la."], page: 9 },
      { term: ["Mood", "Humor"], text: noMood() ? ["Good news (smiley) or bad news (frowny) on an article. Family mode has no mood penalty; some photos score articles of one mood.", "Boa notícia (sorriso) ou má notícia (triste) num artigo. O modo família não tem penalidade de humor; algumas fotos pontuam artigos de um humor."] : ["Difference between smiley and frowny faces on your articles; it costs that many points.", "Diferença entre rostos sorridentes e tristes nos seus artigos; custa essa quantidade de pontos."], page: 11 },
      { term: ["Paper Board", "Tabuleiro de Jornal"], text: ["Your gridded newspaper. Fri/Sat side (lighter Fri region and shaded Sat region) and Sun side.", "O seu jornal quadriculado. Lado Fri/Sat (região mais clara Fri e região sombreada Sat) e lado Sun."], page: 8 },
      { term: ["Photo", "Foto"], text: ["Picture tile scoring 1 per adjacent article of the color or mood it shows. Photos may not touch each other.", "Peça de imagem que vale 1 por artigo adjacente da cor ou humor que mostra. Fotos não podem se tocar."], page: 10 },
      { term: ["Region", "Região"], text: ["The part of the grid allowed this round: Fri region, whole Fri/Sat side, or the Sun side.", "A parte da grade permitida na rodada: região Fri, lado Fri/Sat inteiro ou lado Sun."], page: 8 },
      { term: ["Star square", "Quadrado da estrela"], text: ["The square your centerpiece must cover.", "O quadrado que a sua peça central deve cobrir."], page: 9 },
      { term: ["Starting Centerpiece Tile", "Peça Central Inicial"], text: ["Tiles S1–S6: a scoring side and a blank side (used by Family mode and as scenario proxies).", "Peças S1–S6: um lado com pontuação e um lado em branco (usado no modo família e como substituto nos cenários)."], page: 4 },
      { term: ["White space", "Espaço em branco"], text: ["Your largest area of adjacent empty squares.", "A sua maior área de quadrados vazios adjacentes."], page: 11 }
    ];
    if (usesDesk()) {
      items.push({ term: ["3D Desk", "Mesa 3D"], text: ["Where you keep the tiles you have taken. Tiles left there are leftovers at scoring.", "Onde você guarda as peças que pegou. Peças que ficam lá são sobras na pontuação."], page: 8 });
      if (m !== "puzzle") {
        items.push({ term: ["Leftover tile", "Peça sobrando"], text: threeDays() ? ["An unplaced tile on your desk at scoring: -1 point, kept for the next round.", "Uma peça não colocada na sua mesa 3D na pontuação: -1 ponto, mantida para a próxima rodada."] : ["An unplaced tile on your desk at scoring: -1 point.", "Uma peça não colocada na sua mesa 3D na pontuação: -1 ponto."], page: 12 });
      }
    }
    if (usesTokens()) {
      items.push({ term: ["Finishing Token", "Ficha de Finalização"], text: m === "scenario" ? ["Taken when you say “Print!”, lowest first. The Sunday token breaks ties.", "Pega ao dizer “Imprimir!”, a mais baixa primeiro. A ficha de domingo desempata."] : ["Taken when you say “Print!”, lowest first. Sets the centerpiece choice order and breaks ties.", "Pega ao dizer “Imprimir!”, a mais baixa primeiro. Define a ordem de escolha das peças centrais e desempata."], page: 9 });
    }
    if (["standard", "solo", "scenario"].includes(m)) {
      items.push(
        { term: ["Reporting Phase", "Fase de Reportagem"], text: ["One-handed tile grabbing onto your desk; ends when you say “Layout!”.", "Pegar peças com uma mão para a mesa 3D; acaba quando você diz “Diagramação!”."], page: 8 },
        { term: ["Layout Phase", "Fase de Diagramação"], text: ["Two-handed placing of tiles on your paper; ends when you say “Print!”.", "Colocar peças no jornal com as duas mãos; acaba quando você diz “Imprimir!”."], page: 9 }
      );
    }
    if (m === "newsroom") {
      items.push(
        { term: ["Reporter", "Repórter"], text: ["Team member who carries tiles on the desk between the tables.", "Membro da equipe que leva peças na mesa 3D entre as mesas."], page: 22 },
        { term: ["Layout Editor", "Editor de Diagramação"], text: ["Seated team member who places tiles and says “Print!”.", "Membro sentado da equipe que coloca as peças e diz “Imprimir!”."], page: 22 }
      );
    }
    if (m === "turn") {
      items.push({ term: ["Special action", "Ação especial"], text: ["Discard a desk tile to Rearrange 3 board tiles or Search (flip up to 3 more center tiles).", "Descartar uma peça da mesa 3D para Reorganizar 3 peças do tabuleiro ou Procurar (virar até mais 3 peças do centro)."], page: 21 });
    }
    if (breakingOn()) {
      items.push({ term: ["Breaking News", "Breaking News"], text: ["Daily card with a public restriction, requirement or bonus.", "Carta diária com restrição, exigência ou bônus público."], page: 4 });
    }
    if (powersOn()) {
      items.push({ term: ["Character side", "Lado de personagem"], text: ["The side of the Player Aid/Character Card with a unique power.", "O lado da carta de Ajuda/Personagem com um poder único."], page: 4 });
    }
    const lang = state.language === "pt-BR" ? 1 : 0;
    items.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), [8, 9, 10, 11, 12])}
      <div class="quick-grid glossary-grid">${items.map((item) => `
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
    document.body.classList.add("theme-fit-to-print");
    document.documentElement.lang = state.language;
    document.title = t("Fit to Print — Field Manual", "Fit to Print — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Fit to Print: standard, solo, family, turn-based, newsroom, puzzle and scenario modes, a match-filtered setup checklist, the Reporting and Layout Phases, placement rules and scoring.",
        "Regras interativas bilíngues de Fit to Print: modos padrão, solo, família, por turnos, redação, quebra-cabeça e cenário, lista de preparação filtrada, Fases de Reportagem e Diagramação, regras de posicionamento e pontuação."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook", "Livro interativo")}</p>
          <h1>Fit to Print</h1>
          <p class="hero-intro">${t(
            "Thistleville's editors race the clock: grab newspaper tiles, then lay out articles, photos and ads on a paper that grows from Friday to Sunday — balanced, full and profitable.",
            "Os editores de Thistleville correm contra o relógio: pegue peças de jornal e depois diagrame artigos, fotos e anúncios num jornal que cresce de sexta a domingo — equilibrado, cheio e lucrativo."
          )}</p>
          <div class="hero-meta"><span>${t("1–6 players", "1–6 jogadores")}</span><span>${t("Ages 10+", "10+ anos")}</span><span>${t("Real-time tile laying", "Peças em tempo real")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/fit-to-print.webp" alt="${t("Cover of the Fit to Print rulebook", "Capa do manual de Fit to Print")}" fetchpriority="high"><figcaption>${t("Rulebook cover · art by Ian O'Toole", "Capa do manual · arte de Ian O'Toole")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("Today's edition", "Edição de hoje")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column ftp-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied 24-page English Fit to Print rulebook (Flatout Games / AEG); page numbers match the printed ones. Card powers, Breaking News effects and centerpiece conditions are printed on the components — the guide gives the rulebook's clarifications for them. Points marked “Guide's reading” are interpretations where the rulebook is silent.",
            "Este guia cobre o manual de Fit to Print em inglês fornecido (Flatout Games / AEG), de 24 páginas; os números de página batem com os impressos. Poderes das cartas, efeitos de Breaking News e condições das peças centrais estão impressos nos componentes — o guia traz os esclarecimentos do manual sobre eles. Trechos marcados como “Leitura do guia” são interpretações onde o manual é omisso."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${victorySection()}</section>
          <section class="rule-section">${playSection()}</section>
          <section class="rule-section">${placementSection()}</section>
          <section class="rule-section">${scoringSection()}</section>
          ${hasClarifications() ? `<section class="rule-section">${cardsSection()}</section>` : ""}
          ${["standard", "solo", "scenario"].includes(mode()) ? `<section class="rule-section">${achievementsSection()}</section>` : ""}
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the Fit to Print rulebook. Design: Peter McPherson and the Flatout Games CoLab; illustration and graphic design: Ian O'Toole; solo and puzzle mode design: Shawn Stankewich. Published by Alderac Entertainment Group (AEG) and Flatout Games.",
        "Guia pessoal de consulta baseado no manual de Fit to Print. Design: Peter McPherson e o Flatout Games CoLab; ilustração e design gráfico: Ian O'Toole; design dos modos solo e quebra-cabeça: Shawn Stankewich. Publicado pela Alderac Entertainment Group (AEG) e Flatout Games."
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
      root.querySelector(".ftp-page")?.prepend(notice);
    }
    notice.textContent = storageNoticeText();
  }

  const CONFIG_FIELDS = {
    mode: "mode",
    players: "players",
    timer: "timer",
    powers: "powers",
    breaking: "breaking",
    mod: "mod",
    puzzle: "puzzle",
    scenario: "scenario"
  };

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !root || !root.contains(target)) {
      return;
    }
    const field = Object.keys(CONFIG_FIELDS).find((key) => target.dataset[key] !== undefined);
    if (field && target.type === "radio") {
      const before = signature();
      state = normalizePreferences({ ...state, [field]: target.dataset[field] });
      savePreferences();
      if (signature() !== before) {
        setupState = { signature: signature(), checks: [] };
        saveSetup();
      }
      rerender();
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

  window.FitToPrint = { renderInto, onClick, onChange };
})();
