(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.knitting-circle.v1";
  const SETUP_KEY = "field-manual.knitting-circle.setup.v1";
  const MANUAL_FILE = "knitting-circle_core.pdf";
  const ASSETS = "assets/knitting-circle/";
  const ICONS = `${ASSETS}icons/`;
  const ART = `${ASSETS}art/`;
  // The PDF page number equals the printed page number (cover = page 1).
  const MODES = ["standard", "family", "solo", "quilting"];
  const PLAYER_COUNTS = [2, 3, 4];
  const CHALLENGES = ["none", "achievements", "scenario", "rules"];
  const defaults = { language: "pt-BR", mode: "standard", players: 3, requests: "no", challenge: "none", scenario: 1, rule: 1 };
  const storageIssues = new Set();

  // Rulebook p. 18: Request Cards, minimum score and extra objectives of each Scenario.
  const SCENARIOS = [
    { cards: [10, 5, 11, 2], min: 55, goals: [] },
    { cards: [16, 9, 3, 17], min: 60, goals: [] },
    { cards: [12, 6, 8, 15], min: 65, goals: [] },
    { cards: [7, 18, 13, 4], min: 70, goals: [] },
    { cards: [1, 14, 3, 11], min: 65, goals: [["Score 25+ from Garments", "Faça 25+ pontos com Roupas"]] },
    { cards: [7, 18, 6, 5], min: 70, goals: [["Score 15+ from Buttons", "Faça 15+ pontos com Botões"]] },
    { cards: [9, 1, 13, 14], min: 75, goals: [["Score 15+ from Garment Bonuses", "Faça 15+ pontos com Bônus de roupa"]] },
    { cards: [2, 15, 17, 8], min: 75, goals: [["Score 10+ from Request Cards", "Faça 10+ pontos com Cartas de Pedido"]] },
    { cards: [4, 10, 12, 16], min: 80, goals: [["Don't knit any Yellow", "Não tricote nenhum Amarelo"]] },
    { cards: [18, 11, 3, 6], min: 85, goals: [["Don't have any ugly buttons", "Não tenha nenhum botão de roupa feia"]] },
    { cards: [10, 14, 12, 1], min: 70, goals: [["Don't use the Flip Yarn action", "Não use a ação Virar lã"], ["All garments must be minimum length", "Todas as roupas devem ter o comprimento mínimo"]] },
    { cards: [5, 16, 18, 4], min: 70, goals: [["Only keep 1 yarn in your Personal Yarn Bowl for the next round", "Guarde só 1 lã na sua Tigela de lã para a próxima rodada"], ["7+ Yarn Tiles of each of 2 different colors (across your completed garments)", "7+ Peças de lã de cada uma de 2 cores diferentes (somando as suas roupas completas)"]] },
    { cards: [9, 17, 15, 8], min: 75, goals: [["Complete 2+ Long Johns", "Complete 2+ Ceroulas (Long Johns)"], ["All garments must be maximum length", "Todas as roupas devem ter o comprimento máximo"]] },
    { cards: [7, 4, 3, 11], min: 75, goals: [["Finish the game with 2+ Grabby Paws", "Termine a partida com 2+ Patinhas"], ["Make 5+ garment types", "Faça 5+ tipos de roupa"]] },
    { cards: [14, 13, 2, 6], min: 80, goals: [["Score 20+ from Garment Bonuses", "Faça 20+ pontos com Bônus de roupa"], ["Don't use Grabby Paws", "Não use Patinhas"]] },
    { cards: [3, 9, 12, 10], min: 80, goals: [["Yarn Bowl limit of 0 between rounds", "Limite de 0 lãs na Tigela entre rodadas"], ["Make each of the 4 pattern types", "Faça cada um dos 4 tipos de padrão"]] },
    { cards: [15, 2, 8, 17], min: 85, goals: [["Have at least 1 Button on each Garment", "Tenha pelo menos 1 Botão em cada roupa"], ["Make 8+ Garments", "Faça 8+ roupas"]] },
    { cards: [16, 5, 12, 10], min: 85, goals: [["Make only 3 garment types", "Faça só 3 tipos de roupa"], ["Only knit 4 colors", "Tricote só 4 cores"], ["Complete 3+ Request Cards", "Complete 3+ Cartas de Pedido"]] },
    { cards: [1, 4, 14, 11], min: 90, goals: [["Make 3+ pairs of garments", "Faça 3+ pares de roupas"], ["Make 2+ Solid garments", "Faça 2+ roupas Lisas"], ["Make all garments full length", "Faça todas as roupas no comprimento total"]] },
    { cards: [13, 6, 7, 18], min: 90, goals: [["Make 2+ garments of each of 3 pattern types", "Faça 2+ roupas de cada um de 3 tipos de padrão"], ["Score 30+ from Buttons", "Faça 30+ pontos com Botões"], ["Don't knit any Indigo", "Não tricote nenhum Anil"]] }
  ];

  // Rulebook p. 19: modified rules / setups.
  const RULE_MODS = [
    ["Drafting: move to any available space, as long as it is the opposite type (knit/purl) of the space you just left.", "Coleta: mova para qualquer espaço disponível, desde que seja do tipo oposto (direito/avesso) ao do espaço que você acabou de deixar."],
    ["Play with only 1 Knitting Needle.", "Jogue com só 1 Agulha de tricô."],
    ["Only take the top Garment Card (no choice of 2).", "Pegue só a Carta de Roupa do topo (sem escolher entre 2)."],
    ["Only 1 Yarn Tile may be kept between rounds.", "Só 1 Peça de lã pode ser guardada entre rodadas."],
    ["You must not make a duplicate garment type.", "Você não pode fazer um tipo de roupa repetido."],
    ["You must only make minimum-length garments.", "Você só pode fazer roupas de comprimento mínimo."],
    ["You must only make full-length garments.", "Você só pode fazer roupas de comprimento total."],
    ["You must not flip Yarn Tiles (neither in your Personal Yarn Bowl nor by spending a tile); tiles pulled from the bag stay as they come out.", "Você não pode virar Peças de lã (nem na Tigela pessoal, nem gastando uma peça); peças tiradas do saco ficam como saírem."],
    ["Deal 1 Garment Card of each type plus 1 extra Sock and 1 extra Mitten to each player. Complete them in any order; no additional Garment Cards may be taken.", "Distribua a cada jogador 1 Carta de Roupa de cada tipo, mais 1 Meia e 1 Luva extras. Complete-as em qualquer ordem; nenhuma Carta de Roupa adicional pode ser pega."],
    ["Deal 2 personal Request Cards to each player and only 2 shared Request Cards to the center. Only you can complete your personal cards, and you gain a Grabby Paw as usual.", "Distribua 2 Cartas de Pedido pessoais a cada jogador e só 2 Cartas de Pedido comuns no centro. Só você pode completar as suas cartas pessoais, e ganha uma Patinha normalmente."]
  ];

  // Rulebook p. 19: achievements playable with the standard rules and setup.
  const ACHIEVEMENTS = [
    ["Score 50+ points", "Faça 50+ pontos"], ["Score 60+ points", "Faça 60+ pontos"], ["Score 70+ points", "Faça 70+ pontos"],
    ["Score 80+ points", "Faça 80+ pontos"], ["Score 90+ points", "Faça 90+ pontos"], ["Score 100+ points", "Faça 100+ pontos"],
    ["Score 20+ from Buttons", "Faça 20+ com Botões"], ["Score 25+ from Buttons", "Faça 25+ com Botões"], ["Score 30+ from Buttons", "Faça 30+ com Botões"],
    ["Score 30+ from Garments", "Faça 30+ com Roupas"], ["Score 35+ from Garments", "Faça 35+ com Roupas"], ["Score 40+ from Garments", "Faça 40+ com Roupas"],
    ["Score 15+ from Garment Bonuses", "Faça 15+ com Bônus de roupa"], ["Score 20+ from Garment Bonuses", "Faça 20+ com Bônus de roupa"], ["Score 25+ from Garment Bonuses", "Faça 25+ com Bônus de roupa"],
    ["Score 2+ Request Cards", "Pontue 2+ Cartas de Pedido"], ["Score 3+ Request Cards", "Pontue 3+ Cartas de Pedido"], ["Score all 4 Request Cards", "Pontue as 4 Cartas de Pedido"],
    ["Complete 5+ Garments", "Complete 5+ roupas"], ["Complete 7+ Garments", "Complete 7+ roupas"], ["Complete 9+ Garments", "Complete 9+ roupas"],
    ["Complete 10+ Buttons", "Complete 10+ Botões"], ["Complete 12+ Buttons", "Complete 12+ Botões"], ["Complete 15+ Buttons", "Complete 15+ Botões"],
    ["Complete 4+ of any garment type", "Complete 4+ de um mesmo tipo de roupa"], ["Have all full-length garments", "Tenha todas as roupas no comprimento total"],
    ["Have 3 Grabby Paws at game end", "Tenha 3 Patinhas no fim da partida"], ["Finish the game with only 5 colors knit in all garments", "Termine com só 5 cores tricotadas em todas as roupas"],
    ["Knit 10+ of the same color", "Tricote 10+ da mesma cor"], ["Finish the game with no leftover yarn tiles", "Termine a partida sem peças de lã sobrando"]
  ];

  // Rulebook p. 13: clarifications of the 18 Request Cards (each card prints its own name, picture and points).
  const REQUESTS = [
    ["Complete all 4 pattern types (stripes, colorblock, symmetrical and solid) across your garments. They do not need to be accompanied by buttons.", "Complete os 4 tipos de padrão (listras, blocos de cor, simétrico e liso) entre as suas roupas. Não precisam vir acompanhados de botões."],
    ["Complete 4 garments that are completed only to their minimum length (only the mandatory spaces filled, no optional space).", "Complete 4 roupas terminadas só até o comprimento mínimo (só os espaços obrigatórios preenchidos, nenhum opcional)."],
    ["Complete 4 garments completed to their full length (no remaining spaces).", "Complete 4 roupas terminadas no comprimento total (sem espaços sobrando)."],
    ["2 garments with identical stripe patterns: the same combination of 2 colors. They need not be the same length and may start with opposite colors, but the two stripe colors must be the same.", "2 roupas com listras idênticas: a mesma combinação de 2 cores. Não precisam ter o mesmo comprimento e podem começar com cores opostas, mas as duas cores das listras devem ser as mesmas."],
    ["Complete 4 garments that all contain any number of Yarn Tiles of one chosen color.", "Complete 4 roupas que contenham, todas, qualquer quantidade de Peças de lã de uma mesma cor escolhida."],
    ["Complete 2 Socks of the same length but with a different pattern type. Colors may differ or match. Socks with Ugly Garment Buttons do not count as having a pattern.", "Complete 2 Meias do mesmo comprimento, mas com tipos de padrão diferentes. As cores podem ser diferentes ou iguais. Meias com Botão de roupa feia não contam como tendo padrão."],
    ["Complete 5 or more garments that achieve a Color Button.", "Complete 5 ou mais roupas que conquistem um Botão de Cor."],
    ["Complete 5 or more garments that achieve a Pattern Button.", "Complete 5 ou mais roupas que conquistem um Botão de Padrão."],
    ["Complete 5 or more garments that achieve a Garment Button.", "Complete 5 ou mais roupas que conquistem um Botão de Roupa."],
    ["Have 7 or more of any 1 color on all your completed garments.", "Tenha 7 ou mais de uma mesma cor somando todas as suas roupas completas."],
    ["Complete 2 Sweaters with different pattern types that share no common colors. Sweaters with Ugly Garment Buttons do not count as having a pattern.", "Complete 2 Suéteres com tipos de padrão diferentes e sem nenhuma cor em comum. Suéteres com Botão de roupa feia não contam como tendo padrão."],
    ["Complete 2 Mittens with the same combination of colors, the same length and the same pattern: the exact same configuration of Yarn Tiles.", "Complete 2 Luvas com a mesma combinação de cores, o mesmo comprimento e o mesmo padrão: exatamente a mesma configuração de Peças de lã."],
    ["Complete any 2 garments containing any 3 common colors.", "Complete 2 roupas quaisquer que tenham 3 cores em comum."],
    ["Complete any 3 garments containing any 2 common colors.", "Complete 3 roupas quaisquer que tenham 2 cores em comum."],
    ["Have 3 or more of all 6 colors on all your completed garments.", "Tenha 3 ou mais de cada uma das 6 cores somando todas as suas roupas completas."],
    ["Complete 4 or more garments of the same pattern type. They do not need Pattern Buttons.", "Complete 4 ou mais roupas do mesmo tipo de padrão. Não precisam de Botões de Padrão."],
    ["Complete a Mitten and a Hat with the same combination of colors, the same length and the same pattern: the exact same configuration of Yarn Tiles.", "Complete uma Luva e um Gorro com a mesma combinação de cores, o mesmo comprimento e o mesmo padrão: exatamente a mesma configuração de Peças de lã."],
    ["Complete 1 or more of each garment type. They do not need buttons.", "Complete 1 ou mais de cada tipo de roupa. Não precisam de botões."]
  ];

  // Garment types; colour = card back, also the colour of the Yarn Tile paid to start one (rulebook pp. 3, 7).
  const GARMENTS = [
    { id: "mitten", en: "Mitten", pt: "Luva", color: "indigo" },
    { id: "sock", en: "Sock", pt: "Meia", color: "purple" },
    { id: "hat", en: "Hat", pt: "Gorro", color: "pink" },
    { id: "scarf", en: "Scarf", pt: "Cachecol", color: "yellow" },
    { id: "sweater", en: "Sweater", pt: "Suéter", color: "green" },
    { id: "longjohns", en: "Long Johns", pt: "Ceroulas (Long Johns)", color: "teal" }
  ];

  const COLORS = {
    teal: { en: "Teal", pt: "Turquesa", symbolEn: "drop", symbolPt: "gota" },
    green: { en: "Green", pt: "Verde", symbolEn: "leaf", symbolPt: "folha" },
    yellow: { en: "Yellow", pt: "Amarelo", symbolEn: "moon", symbolPt: "lua" },
    purple: { en: "Purple", pt: "Roxo", symbolEn: "mushroom", symbolPt: "cogumelo" },
    pink: { en: "Pink", pt: "Rosa", symbolEn: "flower", symbolPt: "flor" },
    indigo: { en: "Indigo", pt: "Anil", symbolEn: "berry / round dot", symbolPt: "fruta / bolinha" }
  };

  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------

  function clampInt(value, min, max, fallback) {
    const number = Number(value);
    return Number.isInteger(number) && number >= min && number <= max ? number : fallback;
  }

  function normalizePreferences(saved) {
    const mode = MODES.includes(saved?.mode) ? saved.mode : defaults.mode;
    let challenge = CHALLENGES.includes(saved?.challenge) ? saved.challenge : "none";
    if (mode !== "standard" && mode !== "solo") {
      challenge = "none";
    }
    return {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      mode,
      players: PLAYER_COUNTS.includes(Number(saved?.players)) ? Number(saved.players) : defaults.players,
      requests: saved?.requests === "yes" ? "yes" : "no",
      challenge,
      scenario: clampInt(saved?.scenario, 1, SCENARIOS.length, 1),
      rule: clampInt(saved?.rule, 1, RULE_MODS.length, 1)
    };
  }

  function effective(source = state) {
    const quilting = source.mode === "quilting";
    const challenge = source.challenge;
    const scenario = challenge === "scenario" ? source.scenario : 0;
    const rule = challenge === "rules" ? source.rule : 0;
    return {
      mode: source.mode,
      players: source.mode === "solo" ? 1 : source.players,
      requests: !quilting && (source.requests === "yes" || scenario > 0 || rule === 10),
      challenge,
      scenario,
      rule
    };
  }

  function signature(source = state) {
    return JSON.stringify(effective(source));
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Knitting Circle preferences.", error);
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
      console.error("Could not read Knitting Circle setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Knitting Circle preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Knitting Circle setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function pair(item) {
    return t(item[0], item[1]);
  }

  // Function declarations (hoisted): loadSetup() runs before this point and needs them.
  function cfg() { return effective(); }
  function isFamily() { return state.mode === "family"; }
  function isSolo() { return state.mode === "solo"; }
  function isQuilting() { return state.mode === "quilting"; }
  function ruleMod() { return cfg().rule; }
  function scenarioNo() { return cfg().scenario; }
  function usesRequests() { return cfg().requests; }
  function usesUgly() { return !isFamily(); }
  function usesOrientation() { return !isFamily(); }

  function needles() {
    return ruleMod() === 2 ? 1 : 2;
  }

  function bowlLimit() {
    if (scenarioNo() === 16) {
      return 0;
    }
    if (ruleMod() === 4 || scenarioNo() === 12) {
      return 1;
    }
    return 2;
  }

  function canFlip() {
    return ruleMod() !== 8 && scenarioNo() !== 11;
  }

  function colorName(id) {
    return t(COLORS[id].en, COLORS[id].pt);
  }

  function garmentName(garment) {
    return t(garment.en, garment.pt);
  }

  function manualUrl(page) {
    const script = document.querySelector('script[src*="knitting-circle.js"]');
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
          <p class="eyebrow">${t("KNITTING CIRCLE", "CÍRCULO DE TRICÔ")} / ${sectionIndex(id)}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="kc-section-references">${pages.map(referenceLink).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
  }

  function glyph(name, label) {
    return `<img class="kc-glyph" src="${ICONS}${name}.webp" alt="${label}" title="${label}">`;
  }

  function colorGlyph(id) {
    return glyph(`color-${id}`, colorName(id));
  }

  function iconCard(file, titleEn, bodyEn, titlePt, bodyPt, pages, wide = false) {
    const title = t(titleEn, titlePt);
    const list = Array.isArray(pages) ? pages : [pages];
    return `
      <article class="icon-card${wide ? " kc-icon-wide" : ""}">
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
    return `<figure class="kc-art"><img src="${ART}${file}.webp" alt="${alt}" loading="lazy"><figcaption>${alt}</figcaption></figure>`;
  }

  function interpretation(en, pt) {
    return `<span class="kc-interpretation">${t("Guide's reading:", "Leitura do guia:")}</span> ${t(en, pt)}`;
  }

  function modeLabel(mode = state.mode) {
    return {
      standard: t("Standard game", "Jogo padrão"),
      family: t("Family Mode", "Modo Família"),
      solo: t("Solo Mode", "Modo Solo"),
      quilting: t("Quilting Circle (for Calico)", "Quilting Circle (para Calico)")
    }[mode];
  }

  function challengeLabel(challenge = state.challenge) {
    return {
      none: t("No achievement mode", "Sem modo de conquistas"),
      achievements: t("Achievements (standard game)", "Conquistas (jogo padrão)"),
      scenario: t("Scenario", "Cenário"),
      rules: t("Rule Modification", "Modificação de regra")
    }[challenge];
  }

  function matchSummary() {
    const c = cfg();
    const parts = [modeLabel()];
    if (!isQuilting()) {
      parts.push(isSolo() ? t("1 player + solo opponent", "1 jogador + oponente solo") : t(`${c.players} players`, `${c.players} jogadores`));
      parts.push(c.requests ? t("Request Cards", "Cartas de Pedido") : t("no Request Cards", "sem Cartas de Pedido"));
      if (c.scenario) {
        parts.push(t(`Scenario ${c.scenario}`, `Cenário ${c.scenario}`));
      } else if (c.rule) {
        parts.push(t(`Rule Modification ${c.rule}`, `Modificação de regra ${c.rule}`));
      } else if (c.challenge === "achievements") {
        parts.push(t("Achievements", "Conquistas"));
      }
    } else {
      parts.push(t(`${c.players} players`, `${c.players} jogadores`));
    }
    return parts.join(" · ");
  }

  // ---------- header ----------

  function sectionList() {
    if (isQuilting()) {
      return [
        ["quick-reference", t("Quick Ref", "Referência rápida")],
        ["setup", t("Setup", "Preparação")],
        ["turn", t("Drafting", "Coleta")],
        ["icons", t("Iconography", "Iconografia")],
        ["glossary", t("Glossary", "Glossário")]
      ];
    }
    const list = [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["round", t("A round", "Uma rodada")],
      ["crafting", t("Crafting", "Confecção")],
      ["patterns", t("Patterns", "Padrões")],
      ["scoring", t("Scoring & winning", "Pontuação e vitória")]
    ];
    if (usesRequests() || cfg().challenge !== "none") {
      list.push(["requests", t("Requests & challenges", "Pedidos e desafios")]);
    }
    list.push(["icons", t("Iconography", "Iconografia")], ["examples", t("Examples", "Exemplos")], ["glossary", t("Glossary", "Glossário")]);
    return list;
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
          <span class="brand-mark" aria-hidden="true">KC</span>
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
      <label class="kc-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" ${dataAttr} ${checked ? "checked" : ""}>
        <span class="kc-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function choiceGroup(legend, selected, intro, cards, extraClass = "") {
    return `
      <fieldset class="kc-choice-group ${extraClass}">
        <legend>${legend} · ${t("selected:", "selecionado:")} <span>${selected}</span></legend>
        ${intro ? `<p class="kc-choice-intro">${intro}</p>` : ""}
        <div class="kc-choice-grid">${cards.join("")}</div>
      </fieldset>`;
  }

  function modeGroup() {
    const card = (mode, en, pt) => choiceCard("kc-mode", mode, `data-kc-mode="${mode}"`, state.mode === mode, modeLabel(mode), t(en, pt));
    return choiceGroup(t("Mode", "Modo"), modeLabel(), t(
      "The rulebook has the standard game (pp. 4–13), a streamlined Family Mode (p. 14), a Solo Mode against an automated cat (p. 16) and Quilting Circle, a mini-expansion that uses this box's boards and cats inside a different game, Calico (p. 15).",
      "O livro traz o jogo padrão (pp. 4–13), um Modo Família simplificado (p. 14), um Modo Solo contra um gato automático (p. 16) e Quilting Circle, uma minexpansão que usa os tabuleiros e gatos desta caixa dentro de outro jogo, Calico (p. 15)."
    ) + ` ${referenceLink(14)} ${referenceLink(15)} ${referenceLink(16)}`, [
      card("standard", "2–4 players, 6 rounds. Starting a garment costs 1 Yarn Tile of the card's color; knit/purl orientation matters; garment-card bonuses score; a garment with no pattern gets an Ugly Garment Button (−3). Optional Request Cards and achievement challenges below.", "2–4 jogadores, 6 rodadas. Começar uma roupa custa 1 Peça de lã da cor da carta; o lado direito/avesso importa; os bônus das Cartas de Roupa pontuam; uma roupa sem padrão recebe um Botão de roupa feia (−3). Cartas de Pedido e desafios de conquistas opcionais abaixo."),
      card("family", "2–4 players, for younger or newer players. Garment Cards are free to start (any type, 1 card, no choice of 2); knit/purl is ignored (flip tiles freely); garment-card bonuses are ignored; no Ugly Garment Buttons. Request Cards still optional.", "2–4 jogadores, para jogadores mais jovens ou novatos. Começar Cartas de Roupa é grátis (qualquer tipo, 1 carta, sem escolher entre 2); direito/avesso é ignorado (vire as peças à vontade); bônus das Cartas de Roupa são ignorados; sem Botões de roupa feia. Cartas de Pedido continuam opcionais."),
      card("solo", "1 player using the 2-player setup. A second cat is the solo opponent: you flip the First Player Marker like a coin to move it, and it removes Yarn Tiles from the board. It does not score; you aim for a score rating (40+ to 100+).", "1 jogador com a preparação de 2 jogadores. Um segundo gato é o oponente solo: você joga o Marcador de primeiro jogador como moeda para movê-lo, e ele remove Peças de lã do tabuleiro. Ele não pontua; você busca uma faixa de pontuação (40+ a 100+)."),
      card("quilting", "Not a Knitting Circle game: you need a copy of Calico and its rulebook (not included here). Only the Central Knitting Circle Board and the Cat Tokens from this box are used, to change how Calico's Patch Tiles are drafted.", "Não é uma partida de Knitting Circle: você precisa de uma cópia de Calico e do livro dele (não incluído aqui). Só o Tabuleiro central e os Gatos desta caixa são usados, para mudar como as Peças de retalho de Calico são escolhidas.")
    ]);
  }

  function playersGroup() {
    if (isSolo()) {
      return "";
    }
    const cards = PLAYER_COUNTS.map((count) => choiceCard("kc-players", count, `data-kc-players="${count}"`, state.players === count, t(`${count} players`, `${count} jogadores`), isQuilting()
      ? t(`Use the Central Knitting Circle Board side that shows ${count} player figures, and ${count} Cat Tokens.`, `Use o lado do Tabuleiro central que mostra ${count} figuras de jogador, e ${count} Gatos.`)
      : t(
        `Use the Central Knitting Circle Board side that shows ${count} player figures. ${count} Cat Tokens, ${count} Player Boards and ${count * needles()} Knitting Needle tokens are used.`,
        `Use o lado do Tabuleiro central que mostra ${count} figuras de jogador. São usados ${count} Gatos, ${count} Tabuleiros pessoais e ${count * needles()} Agulhas de tricô.`
      )));
    return choiceGroup(t("Players", "Jogadores"), t(`${state.players}`, `${state.players}`), isQuilting()
      ? t("The board is chosen by player count. The rulebook gives no board for a 1-player Calico game, so this guide offers 2–4.", "O tabuleiro é escolhido pelo número de jogadores. O livro não indica tabuleiro para Calico com 1 jogador, então este guia oferece 2–4.")
      : t("The Central Knitting Circle Board side depends on the player count (setup step 3). For 1 player, choose Solo Mode.", "O lado do Tabuleiro central depende do número de jogadores (etapa 3 da preparação). Para 1 jogador, escolha o Modo Solo.") + ` ${referenceLink(4)}`, cards, "kc-compact");
  }

  function requestsGroup() {
    if (isQuilting()) {
      return "";
    }
    const c = cfg();
    if (c.scenario || c.rule === 10) {
      const reason = c.scenario
        ? t(`Scenario ${c.scenario} plays with its 4 designated Request Cards (#${SCENARIOS[c.scenario - 1].cards.join(", #")}), so Request Cards are on.`, `O Cenário ${c.scenario} usa as suas 4 Cartas de Pedido designadas (nº ${SCENARIOS[c.scenario - 1].cards.join(", ")}), então as Cartas de Pedido estão ligadas.`)
        : t("Rule Modification 10 deals personal and shared Request Cards, so Request Cards are on.", "A Modificação de regra 10 distribui Cartas de Pedido pessoais e comuns, então as Cartas de Pedido estão ligadas.");
      return choiceGroup(t("Request Cards (Advanced Setup)", "Cartas de Pedido (Preparação avançada)"), t("Yes — required", "Sim — obrigatório"), reason, [
        choiceCard("kc-requests", "yes", 'data-kc-requests="yes"', true, t("Yes (required by your challenge)", "Sim (exigido pelo seu desafio)"), t("Change the achievement mode below to make this optional again.", "Mude o modo de conquistas abaixo para torná-las opcionais de novo."))
      ]);
    }
    return choiceGroup(t("Request Cards (Advanced Setup)", "Cartas de Pedido (Preparação avançada)"), state.requests === "yes" ? t("Yes", "Sim") : t("No", "Não"), (isFamily()
      ? t("Allowed in Family Mode, but the rulebook recommends adding them only once players know the game.", "Permitidas no Modo Família, mas o livro recomenda acrescentá-las só quando os jogadores já conhecem o jogo.")
      : t("Advanced Setup step A1.", "Etapa A1 da Preparação avançada.")) + ` ${referenceLink(4)} ${referenceLink(10)}`, [
      choiceCard("kc-requests", "no", 'data-kc-requests="no"', state.requests !== "yes", t("No", "Não"), t("The 18 Request Cards stay in the box.", "As 18 Cartas de Pedido ficam na caixa.")),
      choiceCard("kc-requests", "yes", 'data-kc-requests="yes"', state.requests === "yes", t("Yes", "Sim"), isSolo()
        ? t("4 Request Cards are dealt face up. Completing one in rounds 1–4 earns you a Grabby Paw; in rounds 5–6 it does not. Each completed card scores its printed points at the end.", "4 Cartas de Pedido são reveladas. Completar uma nas rodadas 1–4 dá uma Patinha; nas rodadas 5–6 não. Cada carta completada pontua os pontos impressos no fim.")
        : t("4 Request Cards are dealt face up (Grabby Paw bonus side up). The first player(s) to complete one take a Grabby Paw; completed cards flip at round end, but anyone may still complete them for their printed points at the end.", "4 Cartas de Pedido são reveladas (lado com bônus de Patinha para cima). O(s) primeiro(s) a completar uma pega(m) uma Patinha; cartas completadas viram no fim da rodada, mas qualquer um ainda pode completá-las pelos pontos impressos no fim."))
    ]);
  }

  function challengeGroup() {
    if (state.mode !== "standard" && state.mode !== "solo") {
      return "";
    }
    const card = (value, en, pt) => choiceCard("kc-challenge", value, `data-kc-challenge="${value}"`, state.challenge === value, challengeLabel(value), t(en, pt));
    let picker = "";
    if (state.challenge === "scenario") {
      picker = choiceGroup(t("Scenario", "Cenário"), String(state.scenario), t("Each Scenario fixes the 4 Request Cards, a minimum score and extra objectives. The rulebook recommends starting with #1 and moving on once you complete each one.", "Cada Cenário fixa as 4 Cartas de Pedido, uma pontuação mínima e objetivos extras. O livro recomenda começar pelo nº 1 e avançar quando completar cada um.") + ` ${referenceLink(18)}`, SCENARIOS.map((scenario, index) => choiceCard("kc-scenario", index + 1, `data-kc-scenario="${index + 1}"`, state.scenario === index + 1, t(`Scenario ${index + 1} · ${scenario.min}+ points`, `Cenário ${index + 1} · ${scenario.min}+ pontos`), `${t("Request Cards", "Cartas de Pedido")} #${scenario.cards.join(", #")}${scenario.goals.length ? ` · ${scenario.goals.map(pair).join("; ")}` : ""}`)), "kc-dense");
    }
    if (state.challenge === "rules") {
      picker = choiceGroup(t("Rule Modification", "Modificação de regra"), String(state.rule), t("Play a full game under one modified rule or setup.", "Jogue uma partida inteira sob uma regra ou preparação modificada.") + ` ${referenceLink(19)}`, RULE_MODS.map((mod, index) => choiceCard("kc-rule", index + 1, `data-kc-rule="${index + 1}"`, state.rule === index + 1, t(`Modification ${index + 1}`, `Modificação ${index + 1}`), pair(mod))), "kc-dense");
    }
    return choiceGroup(t("Achievement mode", "Modo de conquistas"), challengeLabel(), t("Optional long-term goals (pp. 17–19): every time you play you may pick one mode; each achievement earned is marked with your color symbol in the rulebook and advances your row on the p. 17 chart. The rulebook ties the Achievements list to the standard game; this guide also offers Scenarios and Rule Modifications in Solo Mode, as p. 16 suggests.", "Metas de longo prazo opcionais (pp. 17–19): a cada partida você pode escolher um modo; cada conquista é marcada com o símbolo da sua cor no livro e avança a sua fileira no quadro da p. 17. O livro liga a lista de Conquistas ao jogo padrão; este guia também oferece Cenários e Modificações de regra no Modo Solo, como sugere a p. 16.") + ` ${referenceLink(17)}`, [
      card("none", "Just play: no extra goals.", "Só jogar: sem metas extras."),
      card("achievements", "Standard rules and setup; the guide lists the 30 achievements (scores, buttons, garments, Request Cards…) to tick off after the game.", "Regras e preparação padrão; o guia lista as 30 conquistas (pontuações, botões, roupas, Cartas de Pedido…) para marcar após a partida."),
      card("scenario", "20 Scenarios: fixed Request Cards, a minimum score (55+ to 90+) and up to 3 extra objectives. Turns Request Cards on.", "20 Cenários: Cartas de Pedido fixas, pontuação mínima (55+ a 90+) e até 3 objetivos extras. Liga as Cartas de Pedido."),
      card("rules", "10 modified rules or setups (1 needle, no flipping, fixed garments, personal Request Cards…). The selected modification is applied throughout this guide.", "10 regras ou preparações modificadas (1 agulha, sem virar, roupas fixas, Cartas de Pedido pessoais…). A modificação escolhida é aplicada em todo o guia.")
    ]) + picker;
  }

  function matchConfiguration() {
    return `
      <section class="controls-panel kc-config" id="build-match" aria-labelledby="kc-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="kc-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "Pick the mode and options the rulebook offers; the checklist, rules, icons and examples below show only what this match uses. Which cat and Player Board each person takes is decided at the table during setup.",
              "Escolha o modo e as opções que o livro oferece; a lista de preparação, as regras, os ícones e os exemplos abaixo mostram só o que esta partida usa. Qual gato e qual Tabuleiro pessoal cada pessoa pega é decidido à mesa durante a preparação."
            )}</p>
            <p class="kc-summary"><strong>${t("This match:", "Esta partida:")}</strong> ${matchSummary()}</p>
          </div>
        </div>
        ${modeGroup()}
        ${playersGroup()}
        ${requestsGroup()}
        ${challengeGroup()}
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function setupPhases() {
    if (isQuilting()) {
      return quiltingPhases();
    }
    const c = cfg();
    const players = c.players;
    const solo = isSolo();
    const mod = c.rule;
    const phases = [
      {
        id: "boards",
        title: t("Player Boards and Knitting Needles", "Tabuleiros pessoais e Agulhas de tricô"),
        pages: [3, 4],
        items: [
          solo
            ? t(`Take 1 Player Board and ${needles()} Knitting Needle token${needles() > 1 ? "s" : ""}. The solo opponent gets no Player Board, needles, yarn or buttons.`, `Pegue 1 Tabuleiro pessoal e ${needles()} Agulha${needles() > 1 ? "s" : ""} de tricô. O oponente solo não recebe Tabuleiro, agulhas, lã nem botões.`)
            : t(`Give each of the ${players} players a Player Board and ${needles()} Knitting Needle token${needles() > 1 ? "s" : ""}.`, `Dê a cada um dos ${players} jogadores um Tabuleiro pessoal e ${needles()} Agulha${needles() > 1 ? "s" : ""} de tricô.`),
          mod === 2 ? t("Rule Modification 2: only 1 Knitting Needle each, so only 1 garment can be in progress at a time.", "Modificação de regra 2: só 1 Agulha de tricô cada, então só 1 roupa pode estar em andamento por vez.") : null,
          t("Each Player Board has: 4 numbered yarn slots along the top, the Personal Yarn Bowl (basket, “2 max at round end”), a 6-slot button workspace in the middle (2 circles, 2 triangles, 2 squares), Grabby Paw slots on the right edge and a turn summary along the bottom.", "Cada Tabuleiro pessoal tem: 4 vagas numeradas de lã no alto, a Tigela de lã pessoal (cesto, “2 no máximo no fim da rodada”), uma área de botões com 6 vagas no meio (2 círculos, 2 triângulos, 2 quadrados), vagas de Patinha na borda direita e um resumo do turno embaixo."),
          bowlLimit() !== 2 ? t(`The bowl's printed “2 max” does not apply to this match: keep at most ${bowlLimit()} between rounds.`, `O “2 máx.” impresso na tigela não vale nesta partida: guarde no máximo ${bowlLimit()} entre rodadas.`) : null,
          interpretation("the boards are double-sided and the rulebook never explains the two sides; every picture shows the side marked “A”, so use that side. The cat drawn on a board has no special power.", "os tabuleiros têm dois lados e o livro nunca explica a diferença; todas as figuras mostram o lado marcado “A”, então use esse lado. O gato desenhado no tabuleiro não tem poder especial."),
          `${t("Return unused Player Boards and Knitting Needles to the box.", "Devolva à caixa os Tabuleiros e as Agulhas não usados.")}`
        ]
      },
      {
        id: "bag",
        title: t("Fill the Yarn Bag", "Encha o Saco de lã"),
        pages: [3, 4],
        items: [
          t("Put all 144 Yarn Tiles (24 of each of the 6 colors) in the cloth Yarn Bag and shuffle them thoroughly.", "Ponha todas as 144 Peças de lã (24 de cada uma das 6 cores) no Saco de lã de pano e misture bem."),
          t(`Each color has its own symbol: ${Object.keys(COLORS).map((id) => `${colorGlyph(id)} ${colorName(id)}`).join(", ")}.`, `Cada cor tem o seu símbolo: ${Object.keys(COLORS).map((id) => `${colorGlyph(id)} ${colorName(id)}`).join(", ")}.`),
          usesOrientation()
            ? t(`Every tile has a knit side ${glyph("yarn-knit", "knit")} (“V” stitches) and a purl side ${glyph("yarn-purl", "purl")} (smooth, solid color).`, `Toda peça tem um lado direito ${glyph("yarn-knit", "direito")} (pontos em “V”) e um lado avesso ${glyph("yarn-purl", "avesso")} (liso, cor sólida).`)
            : t("Tiles have a knit side and a purl side, but in Family Mode the side never matters.", "As peças têm um lado direito e um lado avesso, mas no Modo Família o lado nunca importa.")
        ]
      },
      {
        id: "circle",
        title: t("Central Knitting Circle Board", "Tabuleiro central (Knitting Circle)"),
        pages: solo ? [4, 16] : [4],
        items: [
          solo
            ? t(`Solo Mode uses the 2-player setup: take the board side showing 2 player figures ${glyph("board-player-count", "player-count icon")} in its center basket.`, `O Modo Solo usa a preparação de 2 jogadores: pegue o lado do tabuleiro que mostra 2 figuras de jogador ${glyph("board-player-count", "ícone de número de jogadores")} no cesto central.`)
            : t(`There are 2 double-sided Central Knitting Circle Boards. Take the side showing ${players} player figures ${glyph("board-player-count", "player-count icon")} in its center basket.`, `Há 2 Tabuleiros centrais de dupla face. Pegue o lado que mostra ${players} figuras de jogador ${glyph("board-player-count", "ícone de número de jogadores")} no cesto central.`),
          t("Place it in the center of the play area, within easy reach of all players.", "Coloque-o no centro da área de jogo, ao alcance de todos."),
          usesOrientation()
            ? t(`Around the rim are the cat spaces. Each one is a knit space ${glyph("space-knit", "knit space")} (tile drawn with zigzag stitches) or a purl space ${glyph("space-purl", "purl space")} (plain tile). Small dots mark the starting spaces ${glyph("board-start-space", "starting space")} and a star marks the first-player space ${glyph("board-first-space", "first-player space")}; small arrows show the clockwise direction.`, `Na borda ficam os espaços dos gatos. Cada um é um espaço de direito ${glyph("space-knit", "espaço de direito")} (peça desenhada com pontos em zigue-zague) ou de avesso ${glyph("space-purl", "espaço de avesso")} (peça lisa). Pontinhos marcam os espaços iniciais ${glyph("board-start-space", "espaço inicial")} e uma estrela marca o espaço do primeiro jogador ${glyph("board-first-space", "espaço do primeiro jogador")}; setinhas mostram o sentido horário.`)
            : t(`Around the rim are the cat spaces. Small dots mark the starting spaces ${glyph("board-start-space", "starting space")} and a star marks the first-player space ${glyph("board-first-space", "first-player space")}. Their knit/purl drawings are ignored in Family Mode.`, `Na borda ficam os espaços dos gatos. Pontinhos marcam os espaços iniciais ${glyph("board-start-space", "espaço inicial")} e uma estrela marca o espaço do primeiro jogador ${glyph("board-first-space", "espaço do primeiro jogador")}. Os desenhos de direito/avesso são ignorados no Modo Família.`)
        ]
      },
      {
        id: "cats",
        title: t("Cats and First Player Marker", "Gatos e Marcador de primeiro jogador"),
        pages: solo ? [4, 16] : [4],
        items: solo
          ? [
            t("Place your chosen Cat Token on the first-player space (the star).", "Coloque o Gato escolhido no espaço do primeiro jogador (a estrela)."),
            t("Place another Cat Token of your choice on the other starting space: it is the solo opponent's cat.", "Coloque outro Gato à sua escolha no outro espaço inicial: é o gato do oponente solo."),
            t("Take the First Player Marker. You are always the first player; in Solo Mode the marker is also the coin that moves the opponent (one face is knit, the other purl).", "Pegue o Marcador de primeiro jogador. Você é sempre o primeiro jogador; no Modo Solo o marcador também é a moeda que move o oponente (uma face é direito, a outra avesso)."),
            interpretation("the rulebook does not picture the marker's two faces; treat the face with V stitches as knit and the smooth face as purl, like the tiles.", "o livro não mostra as duas faces do marcador; trate a face com pontos em V como direito e a lisa como avesso, como nas peças.")
          ]
          : [
            t("Each player takes one of the 4 unique wooden Cat Tokens.", "Cada jogador pega um dos 4 Gatos de madeira, todos diferentes."),
            t(`Place the ${players} cats at random on the ${players} starting spaces: one per player — the star space plus ${players - 1} space${players > 2 ? "s" : ""} marked with a dot.`, `Coloque os ${players} gatos ao acaso nos ${players} espaços iniciais: um por jogador — o espaço da estrela mais ${players - 1} espaço${players > 2 ? "s" : ""} marcado${players > 2 ? "s" : ""} com pontinho.`),
            interpretation("for a random placement, put the chosen cats in the empty Yarn Bag or a hand and draw them one at a time onto the starting spaces.", "para sortear, ponha os gatos escolhidos no Saco de lã vazio ou numa mão e tire-os um a um para os espaços iniciais."),
            t("Give the First Player Marker to the player whose cat is on the first-player space (the star).", "Dê o Marcador de primeiro jogador a quem tiver o gato no espaço do primeiro jogador (a estrela).")
          ]
      },
      {
        id: "rounds",
        title: t("Round tracker: 6 tiles in the center", "Marcador de rodadas: 6 peças no centro"),
        pages: [4, 9],
        items: [
          t("Search the Yarn Bag and remove 6 Yarn Tiles, one of each of the 6 colors.", "Procure no Saco de lã e tire 6 Peças de lã, uma de cada uma das 6 cores."),
          t("Place them in the center basket of the Central Knitting Circle Board. They count the rounds: each round the first player moves one of them out to the rim (last setup step and round end). When the sixth one leaves, the game is in its sixth and final round.", "Coloque-as no cesto central do Tabuleiro central. Elas contam as rodadas: a cada rodada o primeiro jogador leva uma delas para a borda (última etapa da preparação e fim da rodada). Quando a sexta sai, a partida está na sexta e última rodada.")
        ]
      },
      {
        id: "yarn",
        title: t("Yarn around the board", "Lã ao redor do tabuleiro"),
        pages: isFamily() ? [4, 14] : [4],
        items: [
          t("Draw 2 random Yarn Tiles from the bag and place them side by side next to each cat space, pointing out from the board (one near slot, one far slot).", "Tire 2 Peças de lã ao acaso do saco e coloque-as lado a lado junto a cada espaço de gato, apontando para fora do tabuleiro (uma vaga perto, uma longe)."),
          usesOrientation()
            ? t("Flip each pair to the side its space shows: knit side up next to a knit space, purl side up next to a purl space.", "Vire cada par para o lado que o seu espaço mostra: direito para cima junto a um espaço de direito, avesso para cima junto a um espaço de avesso.")
            : t("Family Mode: no need to flip tiles to knit or purl — leave them as they come.", "Modo Família: não precisa virar as peças para direito ou avesso — deixe-as como saírem.")
        ]
      },
      {
        id: "bowls",
        title: t("Personal Yarn Bowls", "Tigelas de lã pessoais"),
        pages: [4],
        items: [
          solo
            ? t("Draw 2 random Yarn Tiles from the bag and place them in your Personal Yarn Bowl.", "Tire 2 Peças de lã ao acaso do saco e coloque-as na sua Tigela de lã pessoal.")
            : t("Give each player 2 random Yarn Tiles from the bag, placed in their Personal Yarn Bowl.", "Dê a cada jogador 2 Peças de lã ao acaso do saco, colocadas na Tigela de lã pessoal dele."),
          canFlip() && usesOrientation()
            ? t("Tiles in the bowl are flexible: you choose their side when you knit with them.", "As peças da tigela são flexíveis: você escolhe o lado quando tricotar com elas.")
            : null
        ]
      },
      {
        id: "buttons",
        title: t("Button Tokens and workspaces", "Botões e áreas de botões"),
        pages: [3, 4],
        items: [
          t(`Separate the 90 Button Tokens by shape: 30 round Color Buttons ${glyph("button-color", "Color Button")}, 30 triangular Pattern Buttons ${glyph("button-pattern", "Pattern Button")}, 30 square Garment Buttons ${glyph("button-garment", "Garment Button")}.`, `Separe os 90 Botões por formato: 30 Botões de Cor redondos ${glyph("button-color", "Botão de Cor")}, 30 Botões de Padrão triangulares ${glyph("button-pattern", "Botão de Padrão")}, 30 Botões de Roupa quadrados ${glyph("button-garment", "Botão de Roupa")}.`),
          t("Shuffle each type and place it in a face-down pile (blank “X” side up) within easy reach.", "Embaralhe cada tipo e forme uma pilha virada para baixo (lado com “X” para cima) ao alcance de todos."),
          solo
            ? t("Take 2 of each type, flip them face up and put them in the matching slots of your workspace (6 buttons).", "Pegue 2 de cada tipo, vire-os para cima e coloque-os nas vagas correspondentes da sua área (6 botões).")
            : t("Give each player 2 of each type; each player flips them face up and puts them in the matching slots of their workspace (6 buttons each).", "Dê a cada jogador 2 de cada tipo; cada um os vira para cima e os coloca nas vagas correspondentes da sua área (6 botões cada)."),
          t("Leave room for a discard pile next to the button piles.", "Deixe espaço para uma pilha de descarte ao lado das pilhas de botões.")
        ]
      },
      {
        id: "supply",
        title: t("Grabby Paws and Ugly Garment Buttons", "Patinhas e Botões de roupa feia"),
        pages: isFamily() ? [4, 14] : [4],
        items: [
          t(`Place the 12 Grabby Paw tokens ${glyph("grabby-paw", "Grabby Paw")} within reach as a supply.`, `Coloque os 12 marcadores de Patinha ${glyph("grabby-paw", "Patinha")} ao alcance, como reserva.`),
          solo
            ? t("Take 1 Grabby Paw and put it in a Grabby Paw slot of your Player Board.", "Pegue 1 Patinha e coloque-a numa vaga de Patinha do seu Tabuleiro.")
            : t("Give each player 1 Grabby Paw, placed in a Grabby Paw slot of their Player Board.", "Dê a cada jogador 1 Patinha, colocada numa vaga de Patinha do seu Tabuleiro."),
          usesUgly()
            ? t(`Place the 12 Ugly Garment Button tokens ${glyph("ugly-button", "Ugly Garment Button")} within reach.`, `Coloque os 12 Botões de roupa feia ${glyph("ugly-button", "Botão de roupa feia")} ao alcance.`)
            : t("Family Mode: set the 12 Ugly Garment Button tokens aside — they are not used.", "Modo Família: deixe de lado os 12 Botões de roupa feia — eles não são usados.")
        ]
      },
      garmentPhase(),
      requestPhase(),
      {
        id: "start",
        title: t("Round 1: first tile out of the center", "Rodada 1: primeira peça sai do centro"),
        pages: solo ? [4, 16] : [4],
        items: [
          solo
            ? t("You (always the first player) select one of the 6 Yarn Tiles in the center of the board.", "Você (sempre o primeiro jogador) escolhe uma das 6 Peças de lã do centro do tabuleiro.")
            : t("The player with the First Player Marker selects one of the 6 Yarn Tiles in the center of the board.", "Quem tem o Marcador de primeiro jogador escolhe uma das 6 Peças de lã do centro do tabuleiro."),
          t("Add it to any yarn slot around the board, replacing the Yarn Tile in that slot; discard the replaced tile to the Yarn Bag. 5 tiles remain in the center.", "Coloque-a em qualquer vaga de lã ao redor do tabuleiro, no lugar da Peça de lã que estava ali; descarte a peça substituída no Saco de lã. Restam 5 peças no centro."),
          usesOrientation() ? interpretation("turn the new tile to the side its space shows (knit or purl), like every other tile around the board.", "vire a peça nova para o lado que o espaço mostra (direito ou avesso), como todas as outras peças ao redor do tabuleiro.") : null,
          t("Setup is complete: start round 1 with the Yarn Drafting Phase.", "A preparação terminou: comece a rodada 1 pela Fase de coleta de lã.")
        ]
      }
    ];
    return phases.filter(Boolean);
  }

  function garmentPhase() {
    const mod = ruleMod();
    const solo = isSolo();
    const items = [
      t("Sort the 84 Garment Cards into their 6 types by card back (Mitten, Sock, Hat, Scarf, Sweater, Long Johns), shuffle each deck and place the 6 face-down stacks within reach.", "Separe as 84 Cartas de Roupa nos 6 tipos pelo verso (Luva, Meia, Gorro, Cachecol, Suéter, Ceroulas), embaralhe cada baralho e coloque as 6 pilhas viradas para baixo ao alcance.")
    ];
    if (mod === 9) {
      items.push(
        t("Rule Modification 9: deal each player 1 Garment Card of each of the 6 types plus 1 extra Sock and 1 extra Mitten (8 cards), face up in their play area.", "Modificação de regra 9: dê a cada jogador 1 Carta de Roupa de cada um dos 6 tipos, mais 1 Meia e 1 Luva extras (8 cartas), viradas para cima na área dele."),
        t(`Each player places ${needles() > 1 ? "one of their Knitting Needles" : "their Knitting Needle"} on one of those cards to start it. No more Garment Cards may be taken during the game. This first start is free, as in normal setup.`, `Cada jogador põe ${needles() > 1 ? "uma das suas Agulhas" : "a sua Agulha"} numa dessas cartas para começá-la. Nenhuma outra Carta de Roupa pode ser pega durante a partida. Este primeiro começo é grátis, como na preparação normal.`),
        interpretation("the other dealt cards wait in your play area; starting one later still needs a free Knitting Needle and the usual Yarn Tile of its color, instead of drawing.", "as outras cartas distribuídas esperam na sua área; começar uma depois ainda exige uma Agulha livre e a Peça de lã da cor dela, como de costume, em vez de comprar.")
      );
    } else if (isFamily()) {
      items.push(
        t(`${solo ? "Choose any garment type and draw 1 card of that type" : "Each player chooses any garment type and draws 1 card of that type"}. Family Mode needs no choice of 2: bonuses are ignored, so all cards of a type work the same.`, `${solo ? "Escolha qualquer tipo de roupa e compre 1 carta desse tipo" : "Cada jogador escolhe qualquer tipo de roupa e compra 1 carta desse tipo"}. O Modo Família dispensa a escolha entre 2: os bônus são ignorados, então todas as cartas de um tipo funcionam igual.`),
        t("Place it in your play area with one of your Knitting Needles on it.", "Coloque-a na sua área com uma das suas Agulhas de tricô em cima.")
      );
    } else if (mod === 3) {
      items.push(
        t(`${solo ? "Choose any garment type and take only the top card" : "Each player chooses any garment type and takes only the top card"} of that deck (Rule Modification 3: no choice of 2).`, `${solo ? "Escolha qualquer tipo de roupa e pegue só a carta do topo desse baralho" : "Cada jogador escolhe qualquer tipo de roupa e pega só a carta do topo desse baralho"} (Modificação de regra 3: sem escolher entre 2).`),
        t(`Place it in your play area with ${needles() > 1 ? "one of your Knitting Needles" : "your Knitting Needle"} on it.`, `Coloque-a na sua área com ${needles() > 1 ? "uma das suas Agulhas" : "a sua Agulha"} em cima.`)
      );
    } else {
      items.push(
        t(`${solo ? "Choose any single garment type, draw 2 cards of that type and keep 1" : "Each player chooses any single garment type, draws 2 cards of that type and keeps 1"}. Tip from the rulebook: choose a type that suits the Button Tokens you received.`, `${solo ? "Escolha um tipo de roupa qualquer, compre 2 cartas desse tipo e fique com 1" : "Cada jogador escolhe um tipo de roupa qualquer, compra 2 cartas desse tipo e fica com 1"}. Dica do livro: escolha um tipo que combine com os Botões que recebeu.`),
        t(`Place the chosen card in your play area with ${needles() > 1 ? "one of your Knitting Needles" : "your Knitting Needle"} on it. Put the other card face down at the bottom of its deck.`, `Coloque a carta escolhida na sua área com ${needles() > 1 ? "uma das suas Agulhas" : "a sua Agulha"} em cima. Ponha a outra carta virada para baixo no fundo do baralho dela.`),
        t("This first garment is free: no Yarn Tile is paid during setup.", "Esta primeira roupa é grátis: nenhuma Peça de lã é paga na preparação.")
      );
    }
    return { id: "garments", title: t("Garment decks and your first garment", "Baralhos de Roupa e a sua primeira roupa"), pages: isFamily() ? [4, 14] : mod ? [4, 19] : [4], items };
  }

  function requestPhase() {
    const c = cfg();
    if (!c.requests) {
      return null;
    }
    const items = [];
    if (c.scenario) {
      const scenario = SCENARIOS[c.scenario - 1];
      items.push(
        t(`Scenario ${c.scenario}: find Request Cards #${scenario.cards.join(", #")} (the number is printed in each card's bottom-right corner) and place them face up within view of everyone, Grabby Paw bonus side up (the side with “1st” and a paw in the top-right corner).`, `Cenário ${c.scenario}: encontre as Cartas de Pedido nº ${scenario.cards.join(", ")} (o número está no canto inferior direito de cada carta) e coloque-as viradas para cima à vista de todos, com o lado de bônus de Patinha para cima (o lado com “1st” e uma pata no canto superior direito).`),
        t(`Goal: finish with ${scenario.min}+ points${scenario.goals.length ? ` and: ${scenario.goals.map(pair).join("; ")}` : ""}.`, `Meta: terminar com ${scenario.min}+ pontos${scenario.goals.length ? ` e: ${scenario.goals.map(pair).join("; ")}` : ""}.`),
        t("Return the other Request Cards to the box.", "Devolva à caixa as outras Cartas de Pedido.")
      );
    } else if (c.rule === 10) {
      items.push(
        t("Shuffle the 18 Request Cards. Deal 2 to each player face up in front of them (personal) and 2 face up in the center (shared), Grabby Paw bonus side up (“1st” and a paw in the top-right corner).", "Embaralhe as 18 Cartas de Pedido. Dê 2 a cada jogador, viradas para cima à frente dele (pessoais), e 2 viradas para cima no centro (comuns), com o lado de bônus de Patinha para cima (“1st” e uma pata no canto superior direito)."),
        t("Return the rest to the box.", "Devolva o resto à caixa.")
      );
    } else {
      items.push(
        t("Shuffle the 18 double-sided Request Cards and deal 4 of them face up within view of all players, Grabby Paw bonus side up (the side with “1st” and a paw in the top-right corner).", "Embaralhe as 18 Cartas de Pedido de dupla face e revele 4 delas à vista de todos, com o lado de bônus de Patinha para cima (o lado com “1st” e uma pata no canto superior direito)."),
        t("Return the rest to the box.", "Devolva o resto à caixa.")
      );
    }
    return { id: "requests", title: t("Request Cards (Advanced Setup A1)", "Cartas de Pedido (Preparação avançada A1)"), pages: c.scenario ? [4, 18] : c.rule ? [4, 19] : [4], items };
  }

  function quiltingPhases() {
    const players = cfg().players;
    return [
      {
        id: "calico",
        title: t("Calico setup, except step H", "Preparação de Calico, exceto a etapa H"),
        pages: [15],
        items: [
          t("Follow the standard setup in the Calico rulebook (not supplied with this guide), with the exceptions below.", "Siga a preparação padrão do livro de Calico (não fornecido com este guia), com as exceções abaixo."),
          t("Skip Calico's setup step H: do not reveal 3 Patch Tiles as a tile market.", "Pule a etapa H da preparação de Calico: não revele 3 Peças de retalho como mercado.")
        ]
      },
      {
        id: "circle",
        title: t("Central Knitting Circle Board", "Tabuleiro central (Knitting Circle)"),
        pages: [4, 15],
        items: [
          t(`From the Knitting Circle box, take the Central Knitting Circle Board side showing ${players} player figures ${glyph("board-player-count", "player-count icon")}.`, `Da caixa de Knitting Circle, pegue o lado do Tabuleiro central que mostra ${players} figuras de jogador ${glyph("board-player-count", "ícone de número de jogadores")}.`),
          t("Place it in the center of the play area, within easy reach of all players.", "Coloque-o no centro da área de jogo, ao alcance de todos.")
        ]
      },
      {
        id: "cats",
        title: t("Cat Tokens", "Gatos"),
        pages: [4, 15],
        items: [
          t("Each player selects a Cat Token to play with.", "Cada jogador escolhe um Gato para jogar."),
          t(`Place the ${players} cats at random on the starting spaces (dots and star), as in Knitting Circle.`, `Coloque os ${players} gatos ao acaso nos espaços iniciais (pontinhos e estrela), como em Knitting Circle.`),
          interpretation("the knit/purl drawings of the spaces and the first-player star have no Quilting Circle meaning; who plays first comes from the Calico rules.", "os desenhos de direito/avesso dos espaços e a estrela do primeiro jogador não têm efeito em Quilting Circle; quem começa segue as regras de Calico.")
        ]
      },
      {
        id: "patches",
        title: t("Patch Tiles around the board", "Peças de retalho ao redor do tabuleiro"),
        pages: [15],
        items: [
          t("Place 2 random Patch Tiles from Calico's Tile Bag next to each space around the Central Knitting Circle Board, just as you would with Yarn Tiles in Knitting Circle.", "Coloque 2 Peças de retalho ao acaso do Saco de peças de Calico junto a cada espaço ao redor do Tabuleiro central, como faria com as Peças de lã em Knitting Circle.")
        ]
      }
    ];
  }

  function inventory() {
    const c = cfg();
    if (isQuilting()) {
      return `<div class="quick-grid">${[
        infoCard(t("FROM THIS BOX", "DESTA CAIXA"), t("Used in Calico", "Usado em Calico"), [
          rl("Central Knitting Circle Board", `1, side for ${c.players} players.`, "Tabuleiro central", `1, lado de ${c.players} jogadores.`),
          rl("Cat Tokens", `${c.players}.`, "Gatos", `${c.players}.`),
          t("Everything else from Knitting Circle stays in its box.", "Todo o resto de Knitting Circle fica na caixa.")
        ], [3, 15]),
        infoCard(t("FROM CALICO", "DE CALICO"), t("Your Calico copy", "A sua cópia de Calico"), [
          t("All components of a standard Calico game for this player count, per the Calico rulebook.", "Todos os componentes de uma partida padrão de Calico para esse número de jogadores, conforme o livro de Calico."),
          t(`Patch Tiles: 2 next to each cat space, drawn from the Tile Bag, instead of the 3-tile market.`, `Peças de retalho: 2 junto a cada espaço de gato, tiradas do Saco de peças, no lugar do mercado de 3 peças.`)
        ], [15])
      ].join("")}</div>`;
    }
    const people = isSolo() ? 1 : c.players;
    const cards = [
      infoCard(t("SHARED", "COMPARTILHADO"), t("Middle of the table", "Meio da mesa"), [
        rl("Central Knitting Circle Board", `1, side for ${isSolo() ? 2 : c.players} players.`, "Tabuleiro central", `1, lado de ${isSolo() ? 2 : c.players} jogadores.`),
        rl("Yarn Bag", "144 Yarn Tiles at the start (24 per color); 6 go to the center, 2 to each rim space, 2 to each bowl.", "Saco de lã", "144 Peças de lã no início (24 por cor); 6 vão para o centro, 2 para cada espaço da borda, 2 para cada tigela."),
        rl("Button piles", `3 face-down piles of 30 (Color, Pattern, Garment), minus ${people * 6} dealt; plus a discard pile.`, "Pilhas de botões", `3 pilhas viradas para baixo de 30 (Cor, Padrão, Roupa), menos ${people * 6} distribuídos; mais uma pilha de descarte.`),
        rl("Garment decks", c.rule === 9 ? "6 stacks, used only for dealing (Rule Modification 9)." : "6 face-down stacks (84 cards, 12–16 per type).", "Baralhos de Roupa", c.rule === 9 ? "6 pilhas, usadas só para distribuir (Modificação de regra 9)." : "6 pilhas viradas para baixo (84 cartas, 12–16 por tipo)."),
        rl("Grabby Paws", `supply of ${12 - people}.`, "Patinhas", `reserva de ${12 - people}.`),
        usesUgly() ? rl("Ugly Garment Buttons", "supply of 12.", "Botões de roupa feia", "reserva de 12.") : null,
        c.requests ? rl("Request Cards", c.rule === 10 ? `2 shared in the center + 2 personal per player.` : "4 face up, Grabby Paw side up.", "Cartas de Pedido", c.rule === 10 ? "2 comuns no centro + 2 pessoais por jogador." : "4 viradas para cima, lado da Patinha para cima.") : null,
        rl("Scorepad", "1, for the end of the game.", "Bloco de pontuação", "1, para o fim da partida.")
      ], [3, 4]),
      infoCard(isSolo() ? t("YOU", "VOCÊ") : t(`PER PLAYER · ×${c.players}`, `POR JOGADOR · ×${c.players}`), t("Your area", "Sua área"), [
        rl("Player Board", "1 (side A).", "Tabuleiro pessoal", "1 (lado A)."),
        rl("Cat Token", "1, on the Central Knitting Circle Board.", "Gato", "1, no Tabuleiro central."),
        rl("Knitting Needles", `${needles()}.`, "Agulhas de tricô", `${needles()}.`),
        rl("Yarn Tiles", "2 in your Personal Yarn Bowl.", "Peças de lã", "2 na sua Tigela de lã pessoal."),
        rl("Button Tokens", "6 face up in your workspace (2 of each shape).", "Botões", "6 virados para cima na sua área (2 de cada formato)."),
        rl("Grabby Paw", "1.", "Patinha", "1."),
        rl("Garment Card", c.rule === 9 ? "8 dealt (1 of each type + extra Sock and Mitten), 1 with a needle." : "1, with a Knitting Needle on it.", "Carta de Roupa", c.rule === 9 ? "8 distribuídas (1 de cada tipo + Meia e Luva extras), 1 com agulha." : "1, com uma Agulha de tricô em cima."),
        c.requests && c.rule === 10 ? rl("Personal Request Cards", "2.", "Cartas de Pedido pessoais", "2.") : null,
        isSolo() ? rl("First Player Marker", "yours for the whole game; also the solo coin.", "Marcador de primeiro jogador", "seu a partida toda; também é a moeda do solo.") : null
      ], [4]),
      isSolo()
        ? infoCard(t("SOLO OPPONENT", "OPONENTE SOLO"), t("The other cat", "O outro gato"), [
          t("1 Cat Token on the other starting space — nothing else.", "1 Gato no outro espaço inicial — nada mais."),
          t("The tiles it removes are set aside out of the game and count its turns.", "As peças que ele remove ficam de lado, fora do jogo, e contam os turnos dele.")
        ], [16])
        : infoCard(t("FIRST PLAYER", "PRIMEIRO JOGADOR"), t("First Player Marker", "Marcador de primeiro jogador"), [
          t("Starts with the player on the star space; passes clockwise each round.", "Começa com o jogador no espaço da estrela; passa em sentido horário a cada rodada.")
        ], [4, 9]),
      infoCard(t("IN THE BOX", "NA CAIXA"), t("Not used this match", "Não usado nesta partida"), [
        t(`${4 - people - (isSolo() ? 1 : 0)} Cat Token(s), ${4 - people} Player Board(s), ${8 - people * needles()} Knitting Needles, 1 unused Central Knitting Circle Board.`, `${4 - people - (isSolo() ? 1 : 0)} Gato(s), ${4 - people} Tabuleiro(s) pessoal(is), ${8 - people * needles()} Agulhas de tricô, 1 Tabuleiro central não usado.`),
        c.requests ? null : t("The 18 Request Cards.", "As 18 Cartas de Pedido."),
        usesUgly() ? null : t("The 12 Ugly Garment Button tokens.", "Os 12 Botões de roupa feia.")
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
        <label class="kc-setup-check" for="kc-setup-${phase.id}">
          <input id="kc-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="kc-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="kc-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), isQuilting() ? [15] : [4, 5])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Set up this match", "Prepare esta partida")} · ${matchSummary()}</h3>
            <p>${t("One checkbox per coherent step, in the rulebook's order.", "Uma caixa por etapa coerente, na ordem do livro.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved separately from the match configuration and language. Changing any match option clears this checklist; changing the language does not. “Uncheck all” clears only these setup boxes.",
          "O progresso é salvo separadamente da configuração da partida e do idioma. Trocar qualquer opção da partida limpa esta lista; trocar o idioma não. “Desmarcar tudo” limpa somente as caixas da preparação."
        )}</p>
      </div>
      ${isQuilting() ? `<div class="kc-art-row">${figure("quilting-circle", t("Rulebook p. 15: Calico Patch Tiles in pairs around the Central Knitting Circle Board, with 4 cats", "Livro p. 15: Peças de retalho de Calico em pares ao redor do Tabuleiro central, com 4 gatos"))}</div>` : `<div class="kc-art-row">${figure("setup-example", t("Rulebook p. 5: 3-player setup example — numbers match the setup steps (A1 = Request Cards)", "Livro p. 5: exemplo de preparação para 3 jogadores — os números correspondem às etapas (A1 = Cartas de Pedido)"))}</div>`}
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}`;
  }

  // ---------- quick reference ----------

  function draftLines() {
    if (ruleMod() === 1) {
      return [
        rl("Move (Modification 1)", "move your cat to ANY available space, as long as it is the opposite type (knit ↔ purl) of the space you just left.", "Mover (Modificação 1)", "mova o seu gato para QUALQUER espaço disponível, desde que seja do tipo oposto (direito ↔ avesso) ao do espaço que você acabou de deixar."),
        rl("Available", "no other cat on it and at least 1 Yarn Tile next to it.", "Disponível", "sem outro gato e com pelo menos 1 Peça de lã ao lado.")
      ];
    }
    return [
      rl("Move", "your cat 1 or 2 spaces clockwise, to one of the next two available spaces. You must move.", "Mover", "o seu gato 1 ou 2 espaços em sentido horário, para um dos dois próximos espaços disponíveis. Mover é obrigatório."),
      rl("Available", "no other cat on it and at least 1 Yarn Tile next to it. Skip (do not count) occupied or empty spaces.", "Disponível", "sem outro gato e com pelo menos 1 Peça de lã ao lado. Pule (não conte) espaços ocupados ou vazios."),
      interpretation("if only one other space is available, move there. The board always holds more tiles than a round's drafting uses, so a cat is never stuck.", "se só houver um outro espaço disponível, vá para ele. O tabuleiro sempre tem mais peças do que a coleta de uma rodada usa, então um gato nunca fica preso.")
    ];
  }

  function quickReference() {
    if (isQuilting()) {
      return `
        ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), [15])}
        <div class="callout">${t(
          "Quilting Circle is a mini-expansion for Calico, the previous game in the series. You play Calico with its own rules, components and scoring; only the way Patch Tiles are drafted changes. You need the Calico rulebook: this guide only covers the changes printed in the Knitting Circle rulebook.",
          "Quilting Circle é uma minexpansão para Calico, o jogo anterior da série. Você joga Calico com as regras, componentes e pontuação dele; só muda a forma de escolher as Peças de retalho. Você precisa do livro de Calico: este guia cobre só as mudanças impressas no livro de Knitting Circle."
        )} ${referenceLink(15)}</div>
        <div class="quick-grid">
          ${infoCard(t("SETUP CHANGES", "MUDANÇAS NA PREPARAÇÃO"), t("Instead of the 3-tile market", "No lugar do mercado de 3 peças"), [
            rl("Board", "Central Knitting Circle Board for your player count, in the middle.", "Tabuleiro", "Tabuleiro central do seu número de jogadores, no meio."),
            rl("Cats", "each player picks a cat; place them at random on the starting spaces.", "Gatos", "cada jogador escolhe um gato; coloque-os ao acaso nos espaços iniciais."),
            rl("Patches", "2 random Patch Tiles next to each space.", "Retalhos", "2 Peças de retalho ao acaso junto a cada espaço.")
          ], [15])}
          ${infoCard(t("YOUR TURN · STEP 2", "SEU TURNO · PASSO 2"), t("Draft a Patch Tile", "Escolha uma Peça de retalho"), [
            ...draftLinesQuilting(),
            rl("Refill", "if the space you drafted from is now empty of Patch Tiles, immediately refill it with 2 random Patch Tiles from the Tile Bag.", "Repor", "se o espaço de onde você pegou ficou sem Peças de retalho, reponha na hora com 2 Peças de retalho ao acaso do Saco de peças."),
            rl("Everything else", "standard Calico rules and scoring.", "Todo o resto", "regras e pontuação padrão de Calico.")
          ], [15])}
        </div>`;
    }
    const c = cfg();
    const cards = [
      infoCard(t("THE GAME", "A PARTIDA"), t("6 rounds, 3 parts each", "6 rodadas, 3 partes cada"), [
        rl("1 · Yarn Drafting", isSolo() ? "you and the solo opponent alternate (you first) until each has taken 4 tiles." : "in turn order from the first player, clockwise, until everyone has taken exactly 4 tiles.", "1 · Coleta de lã", isSolo() ? "você e o oponente solo alternam (você primeiro) até cada um pegar 4 peças." : "em ordem de turno a partir do primeiro jogador, sentido horário, até todos pegarem exatamente 4 peças."),
        rl("2 · Crafting", "everyone at the same time; any number of actions.", "2 · Confecção", "todos ao mesmo tempo; quantas ações quiserem."),
        rl("3 · Round end", "4 clean-up steps; skipped after round 6, which goes straight to scoring.", "3 · Fim da rodada", "4 passos de arrumação; pulados após a rodada 6, que vai direto à pontuação."),
        rl("Last round", "round 6 is the one set up when the sixth and last center tile is moved out (round-end step 4 of round 5).", "Última rodada", "a rodada 6 é a preparada quando a sexta e última peça do centro sai (passo 4 do fim da rodada 5).")
      ], [6, 9]),
      infoCard(t("DRAFT TURN", "TURNO DE COLETA"), t("Move, take, place", "Mover, pegar, colocar"), [
        ...draftLines(),
        rl("Take", "one of the Yarn Tiles next to the space you moved to.", "Pegar", "uma das Peças de lã junto ao espaço para onde você foi."),
        rl("Place", `in the next free slot along the top of your Player Board.${usesOrientation() ? " Keep the side it was drafted on: no flipping during drafting." : ""}`, "Colocar", `na próxima vaga livre no alto do seu Tabuleiro.${usesOrientation() ? " Mantenha o lado em que foi pega: nada de virar durante a coleta." : ""}`)
      ], [6]),
      isSolo() ? infoCard(t("SOLO OPPONENT", "OPONENTE SOLO"), t("After each of your draft turns", "Depois de cada turno seu de coleta"), [
        rl("Flip", "toss the First Player Marker like a coin.", "Jogar", "jogue o Marcador de primeiro jogador como moeda."),
        rl("Knit", "the opponent's cat moves to the next available knit space (clockwise).", "Direito", "o gato do oponente vai para o próximo espaço de direito disponível (sentido horário)."),
        rl("Purl", "it moves to the next available purl space.", "Avesso", "ele vai para o próximo espaço de avesso disponível."),
        rl("Remove", "the Yarn Tile nearest to the board at that space; set it aside out of the game (it counts the opponent's 4 turns).", "Remover", "a Peça de lã mais perto do tabuleiro naquele espaço; deixe-a de lado, fora do jogo (ela conta os 4 turnos do oponente)."),
        rl("Score", "the opponent never scores.", "Pontos", "o oponente nunca pontua.")
      ], [16]) : null,
      infoCard(t("CRAFTING ACTIONS", "AÇÕES DE CONFECÇÃO"), t("Any order, any number", "Qualquer ordem, quantas quiser"), [
        isFamily()
          ? rl("Start a garment", `free: draw a Garment Card of any type and put a free Knitting Needle on it (max ${needles()} in progress).`, "Começar roupa", `grátis: compre uma Carta de Roupa de qualquer tipo e ponha uma Agulha livre nela (máx. ${needles()} em andamento).`)
          : ruleMod() === 9
            ? rl("Start a garment", "put a free Knitting Needle on one of your dealt cards and discard 1 Yarn Tile of its color to the bag (Modification 9: no drawing).", "Começar roupa", "ponha uma Agulha livre numa das cartas distribuídas e descarte no saco 1 Peça de lã da cor dela (Modificação 9: sem comprar).")
            : rl("Start a garment", `need a free Knitting Needle (max ${needles()} in progress); discard 1 Yarn Tile of the card's color to the bag; draw ${ruleMod() === 3 ? "the top card (Modification 3)" : "2, keep 1 (other to the bottom)"}; needle on it.`, "Começar roupa", `precisa de uma Agulha livre (máx. ${needles()} em andamento); descarte no saco 1 Peça de lã da cor da carta; ${ruleMod() === 3 ? "pegue a carta do topo (Modificação 3)" : "compre 2, fique com 1 (a outra vai para o fundo)"}; agulha nela.`),
        rl("Knit", usesOrientation() ? `place one of your tiles in the next empty space of an active garment, top to bottom, knit tile in a knit space, purl in purl.${canFlip() ? " Bowl tiles may be turned to either side." : ""} Bonus space: take the bonus at once.` : "place one of your tiles in the next empty space of an active garment, top to bottom; sides do not matter. Bonus spaces are ignored in Family Mode.", "Tricotar", usesOrientation() ? `ponha uma das suas Peças de lã no próximo espaço vazio de uma roupa ativa, de cima para baixo, peça com o direito em espaço de direito, avesso em avesso.${canFlip() ? " Peças da tigela podem ser viradas para qualquer lado." : ""} Espaço de bônus: pegue o bônus na hora.` : "ponha uma das suas Peças de lã no próximo espaço vazio de uma roupa ativa, de cima para baixo; o lado não importa. Espaços de bônus são ignorados no Modo Família."),
        usesOrientation() && canFlip() ? rl("Flip Yarn", "discard any 1 Yarn Tile to the bag to flip any number of your other tiles.", "Virar lã", "descarte no saco 1 Peça de lã qualquer para virar quantas outras peças suas quiser.") : null,
        usesOrientation() && !canFlip() ? rl("No flipping", ruleMod() === 8 ? "Modification 8: no Flip Yarn action and bowl tiles keep the side they came out of the bag." : "Scenario 11: do not use the Flip Yarn action.", "Sem virar", ruleMod() === 8 ? "Modificação 8: sem a ação Virar lã, e as peças da tigela ficam com o lado com que saíram do saco." : "Cenário 11: não use a ação Virar lã.") : null,
        rl("Grabby Paw", "discard 1 Grabby Paw to the supply to search the bag for any Yarn Tile; it goes to your bowl.", "Patinha", "descarte 1 Patinha na reserva para procurar no saco qualquer Peça de lã; ela vai para a sua tigela."),
        rl("Complete", "all mandatory spaces filled → cast off (see next card).", "Completar", "todos os espaços obrigatórios preenchidos → arremate (veja o próximo cartão).")
      ], [7, 8, 14]),
      infoCard(t("COMPLETE A GARMENT", "COMPLETAR UMA ROUPA"), t("Cast off", "Arrematar"), [
        rl("When", "all lighter (mandatory) spaces are filled; optional darker spaces may stay empty.", "Quando", "todos os espaços claros (obrigatórios) estão preenchidos; os escuros (opcionais) podem ficar vazios."),
        rl("Needle", "remove the Knitting Needle: the garment is finished and the needle is free again.", "Agulha", "retire a Agulha: a roupa está pronta e a agulha fica livre."),
        !isFamily() ? rl("Completion bonus", "collect any immediate reward at the bottom of the card (Yarn Tile from the bag or Grabby Paw).", "Bônus de conclusão", "pegue qualquer recompensa imediata no pé da carta (Peça de lã do saco ou Patinha).") : null,
        rl("Buttons", "move every workspace button the garment satisfies to above the card — max 1 Color, 1 Pattern and 1 Garment Button per garment.", "Botões", "leve cada botão da sua área que a roupa satisfaz para cima da carta — no máx. 1 Botão de Cor, 1 de Padrão e 1 de Roupa por roupa."),
        usesUgly() ? rl("No pattern?", "take an Ugly Garment Button and place it below the card (−3 at the end).", "Sem padrão?", "pegue um Botão de roupa feia e coloque-o abaixo da carta (−3 no fim).") : rl("No pattern?", "no penalty in Family Mode (but no Pattern Button either).", "Sem padrão?", "sem penalidade no Modo Família (mas também sem Botão de Padrão)."),
        rl("Refill", "do not refill the workspace now — only at round end.", "Repor", "não reponha a área agora — só no fim da rodada.")
      ], [8]),
      infoCard(t("PATTERNS", "PADRÕES"), t("Read the finished garment top to bottom", "Leia a roupa pronta de cima para baixo"), [
        rl("Stripes · min 3", "exactly 2 colors, alternating every tile (A B A B…).", "Listras · mín. 3", "exatamente 2 cores, alternando a cada Peça de lã (A B A B…)."),
        rl("Colorblock · min 4", "2+ colors, every color in one block of 2+ tiles (A A B B B…).", "Blocos de cor · mín. 4", "2+ cores, cada cor num único bloco de 2+ Peças de lã (A A B B B…)."),
        rl("Symmetrical · min 4", "reads the same both ways, and is not Stripes or Solid (A B B A).", "Simétrico · mín. 4", "lê igual nos dois sentidos e não é Listras nem Liso (A B B A)."),
        rl("Solid · min 3", "all one color (A A A).", "Liso · mín. 3", "tudo de uma cor (A A A).")
      ], [12]),
      infoCard(t("ROUND END", "FIM DA RODADA"), t("Rounds 1–5 only", "Só nas rodadas 1–5"), [
        rl("1 · Keep yarn", `move unplaced tiles from your top slots to your bowl; keep at most ${bowlLimit()} in the bowl, discard the rest to the bag.`, "1 · Guardar lã", `leve as peças não usadas das vagas do alto para a tigela; guarde no máximo ${bowlLimit()} na tigela, descarte o resto no saco.`),
        rl("2 · Buttons", "you may discard 1 workspace button, then refill to 6 from the piles (reshuffle the discards if a pile runs out).", "2 · Botões", "você pode descartar 1 botão da sua área e depois completar até 6 com as pilhas (reembaralhe os descartes se uma pilha acabar)."),
        rl("3 · Refill the board", `${isSolo() ? "slide remaining tiles from far slots to near slots; then, " : ""}from the first player's cat space clockwise, fill every empty yarn slot from the bag${usesOrientation() ? ", flipped to the space's side" : ""}.`, "3 · Repor o tabuleiro", `${isSolo() ? "deslize as peças restantes das vagas longe para as vagas perto; depois, " : ""}a partir do espaço do gato do primeiro jogador, em sentido horário, preencha cada vaga de lã vazia com o saco${usesOrientation() ? ", virada para o lado do espaço" : ""}.`),
        rl("4 · First player", isSolo() ? "you stay first player: move 1 center tile to any yarn slot, replacing that tile (discard it to the bag)." : "pass the marker clockwise; the new first player moves 1 center tile to any yarn slot, replacing that tile (discard it to the bag).", "4 · Primeiro jogador", isSolo() ? "você continua primeiro jogador: leve 1 peça do centro para qualquer vaga de lã, substituindo a peça dali (descarte-a no saco)." : "passe o marcador em sentido horário; o novo primeiro jogador leva 1 peça do centro para qualquer vaga de lã, substituindo a peça dali (descarte-a no saco)."),
        c.requests && !isSolo() ? rl("Requests", "flip any Request Card completed this round: no more Grabby Paws from it.", "Pedidos", "vire toda Carta de Pedido completada nesta rodada: ela não dá mais Patinhas.") : null
      ], isSolo() ? [9, 16] : [9]),
      infoCard(t("SCORING", "PONTUAÇÃO"), t("After round 6", "Depois da rodada 6"), [
        rl("Incomplete garments", "score nothing; return them (with their tiles) to the box.", "Roupas incompletas", "não pontuam; devolva-as (com as Peças de lã) à caixa."),
        rl("Buttons", "sum the points printed on the buttons above your completed garments.", "Botões", "some os pontos impressos nos botões acima das suas roupas completas."),
        rl("Garments", "on each completed garment, only the number next to the lowest filled space.", "Roupas", "em cada roupa completa, só o número junto ao espaço preenchido mais baixo."),
        !isFamily() ? rl("Garment bonuses", "the bonus strip at the bottom of each completed card.", "Bônus de roupa", "a faixa de bônus no pé de cada carta completa.") : null,
        usesUgly() ? rl("Ugly buttons", "−3 each.", "Botões feios", "−3 cada.") : null,
        c.requests ? rl("Request Cards", "printed points of each card whose conditions you met.", "Cartas de Pedido", "pontos impressos de cada carta cujas condições você cumpriu.") : null,
        isSolo() ? rl("Rating", "40+ Great Start · 50+ Getting It · 60+ Very Good · 70+ Excellent · 80+ Crafty · 90+ Knitting Pro · 100+ Knitting Master.", "Faixa", "40+ Ótimo começo · 50+ Pegando o jeito · 60+ Muito bom · 70+ Excelente · 80+ Habilidoso · 90+ Profissional do tricô · 100+ Mestre do tricô.") : rl("Win", "most points; tie → most remaining Yarn Tiles; still tied → shared victory.", "Vitória", "mais pontos; empate → mais Peças de lã restantes; ainda empatados → vitória compartilhada.")
      ], [10, 11, 16])
    ];
    if (c.requests) {
      cards.push(infoCard(t("REQUEST CARDS", "CARTAS DE PEDIDO"), t("Shared goals", "Metas comuns"), requestRuleLines(), isSolo() ? [4, 16] : [4, 10]));
    }
    if (isFamily()) {
      cards.push(infoCard(t("FAMILY MODE", "MODO FAMÍLIA"), t("What is different", "O que muda"), [
        rl("Garments", "free to start, any type, 1 card.", "Roupas", "começar é grátis, qualquer tipo, 1 carta."),
        rl("Knit/purl", "ignored: choose any side, flip for free.", "Direito/avesso", "ignorado: escolha qualquer lado, vire de graça."),
        rl("Card bonuses", "ignored (no completion bonuses, no end-game bonuses).", "Bônus das cartas", "ignorados (sem bônus de conclusão nem de fim de partida)."),
        rl("Ugly buttons", "not used; no penalty for a garment without a pattern.", "Botões feios", "não usados; sem penalidade para roupa sem padrão.")
      ], [14]));
    }
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), [2, 6, 9])}
      <div class="callout">${t(
        "Goal: knit the coziest wardrobe. Draft Yarn Tiles from the Central Knitting Circle Board with your cat, knit them into garments in color patterns, earn Button Tokens and bonuses, and have the most points after 6 rounds.",
        "Objetivo: tricotar o guarda-roupa mais aconchegante. Pegue Peças de lã do Tabuleiro central com o seu gato, tricote-as em roupas com padrões de cor, conquiste Botões e bônus e tenha mais pontos depois de 6 rodadas."
      )} ${referenceLink(2)}</div>
      ${challengeCallout()}
      <div class="quick-grid">${cards.filter(Boolean).join("")}</div>`;
  }

  function draftLinesQuilting() {
    return [
      rl("Move", "instead of choosing from Calico's 3 face-up Patch Tiles, move your cat 1 or 2 spaces clockwise to one of the next two available spaces (no other cat, at least 1 Patch Tile).", "Mover", "em vez de escolher entre as 3 Peças de retalho reveladas de Calico, mova o seu gato 1 ou 2 espaços em sentido horário para um dos dois próximos espaços disponíveis (sem outro gato, com pelo menos 1 Peça de retalho)."),
      rl("Take", "any one of the Patch Tiles at the space you moved to (you take one tile).", "Pegar", "qualquer uma das Peças de retalho do espaço para onde você foi (você pega uma peça).")
    ];
  }

  function requestRuleLines() {
    const c = cfg();
    const lines = [
      rl("Conditions", "printed on each card; see the clarifications in Requests & challenges.", "Condições", "impressas em cada carta; veja os esclarecimentos em Pedidos e desafios.")
    ];
    if (isSolo()) {
      lines.push(
        rl("Grabby Paw", "complete a Request Card in rounds 1–4: take a Grabby Paw from the supply. In rounds 5–6: no Grabby Paw.", "Patinha", "complete uma Carta de Pedido nas rodadas 1–4: pegue uma Patinha da reserva. Nas rodadas 5–6: sem Patinha."),
        interpretation("check during the Crafting Phase, as soon as your completed garments meet a card; each card gives you at most 1 Grabby Paw — turn it over once it has.", "confira durante a Fase de confecção, assim que as suas roupas completas cumprirem uma carta; cada carta dá no máximo 1 Patinha — vire-a depois disso.")
      );
    } else {
      lines.push(
        rl("First to complete", "may take a Grabby Paw from the supply; if 2+ players complete it in the same round, each may take one.", "Primeiro a completar", "pode pegar uma Patinha da reserva; se 2+ jogadores a completarem na mesma rodada, cada um pode pegar uma."),
        rl("Round end", "flip completed cards: no more Grabby Paws from them.", "Fim da rodada", "vire as cartas completadas: elas não dão mais Patinhas.")
      );
    }
    if (c.rule === 10) {
      lines.push(rl("Personal cards (Modification 10)", "only their owner can complete them; they give a Grabby Paw as usual.", "Cartas pessoais (Modificação 10)", "só o dono pode completá-las; elas dão uma Patinha normalmente."));
    }
    lines.push(rl("End of game", "every player who meets a card's conditions scores its printed points.", "Fim da partida", "todo jogador que cumpre as condições de uma carta marca os pontos impressos nela."));
    return lines;
  }

  function challengeCallout() {
    const c = cfg();
    if (c.scenario) {
      const scenario = SCENARIOS[c.scenario - 1];
      return `<div class="callout kc-challenge-callout"><strong>${t(`Scenario ${c.scenario}`, `Cenário ${c.scenario}`)}:</strong> ${lineList([
        t(`Request Cards #${scenario.cards.join(", #")}.`, `Cartas de Pedido nº ${scenario.cards.join(", ")}.`),
        t(`Minimum score: ${scenario.min}.`, `Pontuação mínima: ${scenario.min}.`),
        ...scenario.goals.map(pair),
        scenario.goals.length ? interpretation("objectives count your completed garments at the end (buttons not required); restrictions such as “Don't…” apply all game.", "os objetivos contam as suas roupas completas no fim (botões não são exigidos); restrições como “Não…” valem a partida toda.") : null
      ])} ${referenceLink(18)}</div>`;
    }
    if (c.rule) {
      return `<div class="callout kc-challenge-callout"><strong>${t(`Rule Modification ${c.rule}`, `Modificação de regra ${c.rule}`)}:</strong> ${pair(RULE_MODS[c.rule - 1])} ${referenceLink(19)}</div>`;
    }
    if (c.challenge === "achievements") {
      return `<div class="callout kc-challenge-callout"><strong>${t("Achievements", "Conquistas")}:</strong> ${t("standard rules; after scoring, check the 30 achievements in Requests & challenges.", "regras padrão; depois da pontuação, confira as 30 conquistas em Pedidos e desafios.")} ${referenceLink(19)}</div>`;
    }
    return "";
  }

  // ---------- round ----------

  function roundSection() {
    if (isQuilting()) {
      return `
        ${sectionHeading("turn", t("Drafting Patch Tiles", "Escolhendo Peças de retalho"), [6, 15])}
        <div class="quick-grid">
          ${infoCard(t("CALICO · PLAYER TURN STEP 2", "CALICO · PASSO 2 DO TURNO"), t("Draft with your cat", "Escolha com o seu gato"), [
            ...draftLinesQuilting(),
            t("You must always move 1 or 2 spaces; skip (do not count) spaces with another cat or with no Patch Tiles left.", "Você sempre deve mover 1 ou 2 espaços; pule (não conte) espaços com outro gato ou sem Peças de retalho."),
            rl("Refill", "once you have drafted, if that space is now empty of Patch Tiles, immediately refill it with 2 random Patch Tiles from the Tile Bag.", "Repor", "depois de pegar, se aquele espaço ficou sem Peças de retalho, reponha na hora com 2 Peças de retalho ao acaso do Saco de peças."),
            t("The rest of the turn, the gameplay and the scoring are the standard Calico rules (Calico rulebook).", "O resto do turno, o jogo e a pontuação seguem as regras padrão de Calico (livro de Calico)."),
            interpretation("the space you move to normally has 1 or 2 Patch Tiles, so you see your options for future turns: that is the point of the variant.", "o espaço para onde você vai normalmente tem 1 ou 2 Peças de retalho, então você enxerga as opções dos próximos turnos: é essa a graça da variante.")
          ], [6, 15])}
        </div>`;
    }
    const solo = isSolo();
    return `
      ${sectionHeading("round", t("A round", "Uma rodada"), [6, 9])}
      <p class="glossary-intro">${t(
        "Knitting Circle lasts 6 rounds. Each round has a Yarn Drafting Phase and a Crafting Phase, followed by the round-end clean-up (not after round 6).",
        "Knitting Circle dura 6 rodadas. Cada rodada tem uma Fase de coleta de lã e uma Fase de confecção, seguidas da arrumação do fim da rodada (não após a rodada 6)."
      )}</p>
      <div class="quick-grid">
        ${infoCard(t("PHASE 1", "FASE 1"), t("Yarn Drafting Phase", "Fase de coleta de lã"), [
          solo
            ? t("You take the first turn (moving and selecting a tile as below), then the solo opponent moves; alternate until you and the opponent have each taken exactly 4 tiles.", "Você faz o primeiro turno (movendo e escolhendo uma peça como abaixo), depois o oponente solo se move; alternem até você e o oponente terem pego exatamente 4 peças cada.")
            : t("Starting with the first player and going clockwise, each player takes one turn at a time until every player has taken 4 turns (4 tiles).", "Começando pelo primeiro jogador e seguindo em sentido horário, cada jogador faz um turno por vez até todos terem feito 4 turnos (4 peças)."),
          ...draftLines(),
          t("Select one of the available Yarn Tiles adjacent to the space you moved to.", "Escolha uma das Peças de lã disponíveis ao lado do espaço para onde você foi."),
          t("Place it in the next available slot along the top of your Player Board (slots 1 → 4).", "Coloque-a na próxima vaga livre no alto do seu Tabuleiro (vagas 1 → 4)."),
          usesOrientation() ? rl("Important", "drafted tiles stay in the orientation (knit or purl) they were drafted in; they may not be flipped during the Yarn Drafting Phase.", "Importante", "as peças pegas ficam no lado (direito ou avesso) em que foram pegas; não podem ser viradas durante a Fase de coleta.") : null,
          t("The phase ends when all 4 slots along the top of every Player Board are full.", "A fase termina quando as 4 vagas do alto de todos os Tabuleiros estão cheias.")
        ], solo ? [6, 16] : [6])}
        ${solo ? infoCard(t("SOLO OPPONENT", "OPONENTE SOLO"), t("Moving the automated cat", "Movendo o gato automático"), [
          t("After each of your drafting turns, flip the First Player Marker like a coin. The side that lands face up decides where the opponent's cat goes.", "Depois de cada turno seu de coleta, jogue o Marcador de primeiro jogador como moeda. O lado que cair para cima decide para onde vai o gato do oponente."),
          rl("Knit", "it moves to the next available knit space.", "Direito", "ele vai para o próximo espaço de direito disponível."),
          rl("Purl", "it moves to the next available purl space.", "Avesso", "ele vai para o próximo espaço de avesso disponível."),
          t("Remove the Yarn Tile nearest to the Central Knitting Circle Board at that space and place it to the side of the play area: it is out of the game and counts the opponent's turns.", "Retire a Peça de lã mais perto do Tabuleiro central naquele espaço e coloque-a ao lado da área de jogo: ela sai do jogo e conta os turnos do oponente."),
          interpretation("“next” means clockwise, skipping unavailable spaces (another cat or no tiles), as for your cat. If only one tile is left at the space, remove that one. If no space of the flipped type is available, move it to the next available space of the other type.", "“próximo” é em sentido horário, pulando espaços indisponíveis (outro gato ou sem peças), como para o seu gato. Se sobrar só uma peça no espaço, remova essa. Se não houver espaço disponível do tipo sorteado, mova-o para o próximo espaço disponível do outro tipo.")
        ], [16]) : ""}
        ${infoCard(t("PHASE 2", "FASE 2"), t("Crafting Phase", "Fase de confecção"), [
          t("All players play simultaneously; there are no turns.", "Todos jogam ao mesmo tempo; não há turnos."),
          t("You may carry out any number of the crafting actions (next section), in any order, as long as you have the required resources.", "Você pode fazer quantas ações de confecção quiser (próxima seção), em qualquer ordem, desde que tenha os recursos."),
          t("The round ends once all players have completed all the actions they want.", "A rodada termina quando todos tiverem feito todas as ações que quiserem.")
        ], [7])}
        ${infoCard(t("ROUND END", "FIM DA RODADA"), t("Set up the next round (skip after round 6)", "Prepare a próxima rodada (pule após a rodada 6)"), [
          rl("1 · Transfer yarn", `each player may move unplaced Yarn Tiles from the top slots to their Personal Yarn Bowl, but may keep only ${bowlLimit()} tile${bowlLimit() === 1 ? "" : "s"} in the bowl for the next round; discard any excess to the Yarn Bag. Use as many tiles as you can while crafting.`, "1 · Transferir lã", `cada jogador pode levar as Peças de lã não usadas das vagas do alto para a Tigela pessoal, mas só pode guardar ${bowlLimit()} peça${bowlLimit() === 1 ? "" : "s"} na tigela para a próxima rodada; descarte o excesso no Saco de lã. Use o máximo de peças que puder na confecção.`),
          bowlLimit() !== 2 ? t(`(${scenarioNo() ? `Scenario ${scenarioNo()}` : `Rule Modification ${ruleMod()}`} changes the usual limit of 2.)`, `(${scenarioNo() ? `O Cenário ${scenarioNo()}` : `A Modificação de regra ${ruleMod()}`} muda o limite habitual de 2.)`) : null,
          rl("2 · Refill workspace", "optionally discard any single 1 of your Button Tokens to a discard pile next to the button piles, then draw from the matching piles to fill every empty slot. You always have 6 buttons at the start of a round. If a pile runs out, shuffle its discards and use them again.", "2 · Repor a área", "se quiser, descarte 1 Botão qualquer numa pilha de descarte ao lado das pilhas e depois compre das pilhas correspondentes até preencher todas as vagas vazias. Você sempre tem 6 botões no início de uma rodada. Se uma pilha acabar, embaralhe os descartes dela e use-os de novo."),
          solo ? rl("Before 3 · Slide (solo)", "before refilling, slide any remaining Yarn Tiles from the far slots to the slots nearest to the board.", "Antes do 3 · Deslizar (solo)", "antes de repor, deslize as Peças de lã restantes das vagas longe para as vagas mais perto do tabuleiro.") : null,
          rl("3 · Refill the board", `starting at the space with the first player's cat and moving clockwise, fill all open yarn slots around the board with random tiles from the bag${usesOrientation() ? ", flipped to the orientation of their space" : ""}.`, "3 · Repor o tabuleiro", `começando no espaço do gato do primeiro jogador e seguindo em sentido horário, preencha todas as vagas de lã abertas com peças ao acaso do saco${usesOrientation() ? ", viradas para o lado do seu espaço" : ""}.`),
          rl("4 · New first player", solo ? "you remain the first player: choose one of the remaining center tiles and add it to any yarn slot, replacing the tile there and discarding that one to the bag." : "pass the First Player Marker clockwise. The new first player selects one of the remaining center tiles and adds it to any yarn slot, replacing the tile there and discarding that one to the bag.", "4 · Novo primeiro jogador", solo ? "você continua primeiro jogador: escolha uma das peças restantes do centro e coloque-a em qualquer vaga de lã, substituindo a peça dali e descartando essa no saco." : "passe o Marcador de primeiro jogador em sentido horário. O novo primeiro jogador escolhe uma das peças restantes do centro e a coloca em qualquer vaga de lã, substituindo a peça dali e descartando essa no saco."),
          cfg().requests && !solo ? rl("Request Cards", "flip over any Request Card completed during the round (no further Grabby Paws from it).", "Cartas de Pedido", "vire toda Carta de Pedido completada durante a rodada (ela não dá mais Patinhas).") : null,
          interpretation("cats stay where they are between rounds; the next round's drafting continues from those spaces. Garments in progress keep their needles and tiles.", "os gatos ficam onde estão entre rodadas; a coleta da próxima rodada continua desses espaços. Roupas em andamento mantêm as agulhas e as Peças de lã.")
        ], solo ? [9, 16] : [9])}
        ${infoCard(t("GAME END", "FIM DA PARTIDA"), t("After round 6", "Depois da rodada 6"), [
          t("The 6th round is the round in which the final of the 6 center Yarn Tiles has been added to the rim (it is moved out at the end of round 5, setting up round 6).", "A 6ª rodada é aquela em que a última das 6 Peças de lã do centro já foi levada para a borda (ela sai no fim da rodada 5, preparando a rodada 6)."),
          t("After both phases of round 6, skip the round-end steps and go straight to scoring.", "Depois das duas fases da rodada 6, pule os passos de fim de rodada e vá direto à pontuação.")
        ], [9])}
      </div>
      <div class="kc-art-row">
        ${figure("drafting", t("Rulebook p. 6: (1) the black cat moves 1 or 2 available spaces and (2) its tile goes to the next slot along the top of the Player Board", "Livro p. 6: (1) o gato preto anda 1 ou 2 espaços disponíveis e (2) a peça vai para a próxima vaga no alto do Tabuleiro"))}
        ${figure("round-end-transfer", t(`Rulebook p. 9, step 1: unplaced tiles go to the bowl — 2 max${bowlLimit() !== 2 ? ` (your match: ${bowlLimit()} max)` : ""}`, `Livro p. 9, passo 1: Peças de lã não usadas vão para a tigela — no máx. 2${bowlLimit() !== 2 ? ` (nesta partida: no máx. ${bowlLimit()})` : ""}`))}
        ${figure("round-end-buttons", t("Rulebook p. 9, step 2: discard up to 1 button, then refill the workspace from the three piles", "Livro p. 9, passo 2: descarte até 1 botão e reponha a área com as três pilhas"))}
        ${figure("round-end-board", solo
          ? t("Rulebook p. 9, steps 3–4 (multiplayer picture): refill the rim clockwise from the first player's cat; in Solo Mode you keep the marker and move a center tile out yourself", "Livro p. 9, passos 3–4 (figura de multijogador): reponha a borda em sentido horário a partir do gato do primeiro jogador; no Modo Solo você fica com o marcador e leva você mesmo uma peça do centro para fora")
          : t("Rulebook p. 9, steps 3–4: refill the rim clockwise from the first player's cat; pass the marker and move a center tile out", "Livro p. 9, passos 3–4: reponha a borda em sentido horário a partir do gato do primeiro jogador; passe o marcador e leve uma peça do centro para fora"))}
      </div>`;
  }

  // ---------- crafting ----------

  function craftingSection() {
    if (isQuilting()) {
      return "";
    }
    const family = isFamily();
    const mod = ruleMod();
    const startLines = family
      ? [
        t(`You need an available Knitting Needle: you may never have more than ${needles()} garments in progress.`, `Você precisa de uma Agulha livre: nunca pode ter mais de ${needles()} roupas em andamento.`),
        t("Family Mode: Garment Cards have no cost. Simply draw a Garment Card of any type and put one of your Knitting Needles on it.", "Modo Família: Cartas de Roupa não têm custo. Basta comprar uma Carta de Roupa de qualquer tipo e pôr uma das suas Agulhas nela.")
      ]
      : [
        t(`You need an available Knitting Needle: you may never have more than ${needles()} garment${needles() > 1 ? "s" : ""} in progress.`, `Você precisa de uma Agulha livre: nunca pode ter mais de ${needles()} roupa${needles() > 1 ? "s" : ""} em andamento.`),
        mod === 5 ? null : interpretation("any type may be started, including one you already have in progress or completed; the rulebook sets no limit (only Rule Modification 5 forbids duplicates).", "qualquer tipo pode ser começado, inclusive um que você já tenha em andamento ou completo; o livro não põe limite (só a Modificação de regra 5 proíbe repetidos)."),
        t("Discard 1 Yarn Tile of the card's color to the Yarn Bag. The required color is the color of the card back, also shown by the symbol in the top-right corner of the card back:", "Descarte no Saco de lã 1 Peça de lã da cor da carta. A cor exigida é a cor do verso da carta, também mostrada pelo símbolo no canto superior direito do verso:"),
        GARMENTS.map((garment) => `${colorGlyph(garment.color)} ${garmentName(garment)} → ${colorName(garment.color)}`).join(" · "),
        mod === 9
          ? t("Rule Modification 9: instead of drawing, put the needle on one of the Garment Cards you were dealt. You may not take any other Garment Card.", "Modificação de regra 9: em vez de comprar, ponha a agulha numa das Cartas de Roupa que recebeu. Você não pode pegar nenhuma outra Carta de Roupa.")
          : mod === 3
            ? t("Take only the top card of that type's deck (Rule Modification 3) and put a Knitting Needle on it.", "Pegue só a carta do topo do baralho desse tipo (Modificação de regra 3) e ponha uma Agulha nela.")
            : t("Draw 2 cards from the matching Garment deck and choose one. Cards of the same type have the same spaces but different completion bonuses. Place the chosen card in your play area with a Knitting Needle on it; put the other face down at the bottom of its deck.", "Compre 2 cartas do baralho de Roupa correspondente e escolha uma. Cartas do mesmo tipo têm os mesmos espaços, mas bônus diferentes. Coloque a escolhida na sua área com uma Agulha em cima; ponha a outra virada para baixo no fundo do baralho."),
        mod === 9 ? null : interpretation("the yarn you pay may come from your top slots or your bowl. If a Garment deck runs out, that type cannot be started any more.", "a lã paga pode vir das vagas do alto ou da tigela. Se um baralho de Roupa acabar, esse tipo não pode mais ser começado.")
      ];
    const constraints = [];
    if (mod === 5) constraints.push(pair(RULE_MODS[4]));
    if (mod === 6 || scenarioNo() === 11) constraints.push(t("All your garments must be minimum length: cast off as soon as the last mandatory space is filled.", "Todas as suas roupas devem ter o comprimento mínimo: arremate assim que o último espaço obrigatório for preenchido."));
    if (mod === 7 || scenarioNo() === 13 || scenarioNo() === 19) constraints.push(t("All your garments must be full length: fill every optional space before casting off.", "Todas as suas roupas devem ter o comprimento total: preencha todos os espaços opcionais antes de arrematar."));
    return `
      ${sectionHeading("crafting", t("Crafting actions", "Ações de confecção"), family ? [7, 8, 14] : [7, 8])}
      <div class="quick-grid">
        ${infoCard(t("ACTION", "AÇÃO"), t("Start a garment", "Começar uma roupa"), startLines, family ? [7, 14] : [7])}
        ${infoCard(t("ACTION", "AÇÃO"), t("Knit", "Tricotar"), [
          t("Take any of your available Yarn Tiles (top slots or bowl) and place it onto a space of one of your active garments (a Garment Card with a Knitting Needle on it and spaces left to fill).", "Pegue qualquer Peça de lã disponível sua (vagas do alto ou tigela) e coloque-a num espaço de uma das suas roupas ativas (Carta de Roupa com Agulha em cima e espaços para preencher)."),
          t("Spaces on a garment must always be filled from top to bottom.", "Os espaços de uma roupa devem sempre ser preenchidos de cima para baixo."),
          family
            ? t("Family Mode: knit and purl are ignored — choose either side of any tile, flip freely at no cost.", "Modo Família: direito e avesso são ignorados — escolha qualquer lado de qualquer peça, vire à vontade sem custo.")
            : t("Each space must match the tile's orientation: knit tiles (V-stitch side) in knit spaces, purl tiles (solid side) in purl spaces. The texture drawn in each card space shows which it is.", "Cada espaço deve combinar com o lado da peça: peças com o direito (lado com pontos em V) em espaços de direito, com o avesso (lado liso) em espaços de avesso. A textura desenhada em cada espaço da carta mostra qual é."),
          !family && canFlip() ? t("Tiles from your Personal Yarn Bowl are flexible: flip them to either side. Tiles in the top slots keep the side they were drafted on (unless you Flip Yarn).", "Peças da Tigela pessoal são flexíveis: vire-as para qualquer lado. Peças nas vagas do alto mantêm o lado em que foram pegas (a não ser com Virar lã).") : null,
          !family && mod === 8 ? t("Rule Modification 8: bowl tiles are not flexible — they keep the side they came out of the bag.", "Modificação de regra 8: as peças da tigela não são flexíveis — elas mantêm o lado com que saíram do saco.") : null,
          !family ? t(`Bonus spaces: if the space you filled shows a bonus Yarn Tile ${glyph("bonus-yarn-space", "bonus Yarn Tile space")}, immediately draw a tile from the Yarn Bag into your bowl; if it shows a Grabby Paw ${glyph("bonus-paw", "Grabby Paw bonus")}, immediately take one from the supply into a Grabby Paw slot. You may use them at once.`, `Espaços de bônus: se o espaço preenchido mostra uma Peça de lã bônus ${glyph("bonus-yarn-space", "espaço de Peça de lã bônus")}, tire na hora uma peça do Saco de lã para a sua tigela; se mostra uma Patinha ${glyph("bonus-paw", "bônus de Patinha")}, pegue na hora uma da reserva para uma vaga de Patinha. Você pode usá-las na hora.`) : t("Family Mode ignores card bonuses, including bonus spaces.", "O Modo Família ignora os bônus das cartas, inclusive os espaços de bônus."),
          !family ? interpretation("a bonus Yarn Tile is drawn at random (the space shows “+?”); only a Grabby Paw lets you choose a tile.", "a Peça de lã bônus é tirada ao acaso (o espaço mostra “+?”); só uma Patinha deixa você escolher a peça.") : null
        ], family ? [7, 14] : [7])}
        ${!family && canFlip() ? infoCard(t("ACTION", "AÇÃO"), t("Flip Yarn", "Virar lã"), [
          t("Discard any 1 Yarn Tile to the Yarn Bag in order to flip the orientation (knit to purl or purl to knit) of any number of your other Yarn Tiles.", "Descarte no Saco de lã 1 Peça de lã qualquer para virar o lado (direito para avesso ou avesso para direito) de quantas outras Peças de lã suas quiser."),
          interpretation("tiles already knitted into a garment stay as they are.", "peças já tricotadas numa roupa ficam como estão.")
        ], [7]) : ""}
        ${infoCard(t("ACTION", "AÇÃO"), t("Use a Grabby Paw", "Usar uma Patinha"), [
          t("Discard 1 Grabby Paw token from your Player Board to the supply.", "Descarte 1 Patinha do seu Tabuleiro na reserva."),
          t("Search the Yarn Bag for a Yarn Tile of your choice and place it in your Personal Yarn Bowl.", "Procure no Saco de lã uma Peça de lã à sua escolha e coloque-a na sua Tigela pessoal."),
          scenarioNo() === 15 ? t("Scenario 15: do not use Grabby Paws.", "Cenário 15: não use Patinhas.") : null,
          interpretation("the rulebook sets no limit on how many Grabby Paws you hold; if the Grabby Paw supply runs out, a reward that gives one gives nothing.", "o livro não limita quantas Patinhas você guarda; se a reserva de Patinhas acabar, uma recompensa que dá uma não dá nada.")
        ], [8])}
        ${infoCard(t("ACTION", "AÇÃO"), t("Complete a garment", "Completar uma roupa"), [
          t("When all the mandatory spaces of a Garment Card are filled, you may “cast off”. Mandatory spaces are the lighter ones at the top; the last mandatory space is the first one with a point number to its left. The darker spaces below are optional.", "Quando todos os espaços obrigatórios de uma Carta de Roupa estão preenchidos, você pode “arrematar”. Os obrigatórios são os mais claros, no alto; o último obrigatório é o primeiro com um número de pontos à esquerda. Os espaços mais escuros abaixo são opcionais."),
          t("Remove the Knitting Needle from the garment.", "Retire a Agulha de tricô da roupa."),
          family ? null : t("Check the bonus at the bottom of the card: if it is an immediate reward (Yarn Tile from the bag or Grabby Paw), collect it now into your bowl or Grabby Paw slot. End-of-game bonuses score later.", "Confira o bônus no pé da carta: se for recompensa imediata (Peça de lã do saco ou Patinha), pegue-a agora para a tigela ou vaga de Patinha. Bônus de fim de partida pontuam depois."),
          rl("Color Button", "the garment contains all of the color(s) shown on it.", "Botão de Cor", "a roupa contém todas as cores mostradas nele."),
          rl("Pattern Button", "the garment's pattern is the one printed on it (Stripes, Colorblock, Symmetrical or Solid).", "Botão de Padrão", "o padrão da roupa é o impresso nele (Listras, Blocos de cor, Simétrico ou Liso)."),
          rl("Garment Button", "the garment is the type pictured on it.", "Botão de Roupa", "a roupa é do tipo desenhado nele."),
          t("Move each satisfied button from your workspace to just above the Garment Card. Only 1 of each of the 3 shapes per garment: if 2 buttons of the same shape are satisfied, choose 1.", "Leve cada botão satisfeito da sua área para logo acima da Carta de Roupa. Só 1 de cada um dos 3 formatos por roupa: se 2 botões do mesmo formato forem satisfeitos, escolha 1."),
          t("Do not refill your workspace now; that only happens at round end.", "Não reponha a sua área agora; isso só acontece no fim da rodada."),
          usesUgly() ? t("If the garment has none of the 4 patterns, take an Ugly Garment Button from the supply and place it below the Garment Card: −3 points at the end.", "Se a roupa não tiver nenhum dos 4 padrões, pegue um Botão de roupa feia da reserva e coloque-o abaixo da Carta de Roupa: −3 pontos no fim.") : t("Family Mode: no penalty for a garment without a pattern (it just earns no Pattern Button).", "Modo Família: sem penalidade para roupa sem padrão (ela só não ganha Botão de Padrão)."),
          interpretation("once cast off, a garment is finished: no more tiles may be added. You may keep knitting optional spaces before casting off, even in a later round.", "depois de arrematada, a roupa está pronta: não dá para acrescentar Peças de lã. Você pode continuar tricotando os espaços opcionais antes de arrematar, mesmo numa rodada posterior.")
        ], family ? [8, 14] : [8, 12])}
        ${constraints.length ? infoCard(t("YOUR CHALLENGE", "SEU DESAFIO"), t("Extra restrictions", "Restrições extras"), constraints, [18, 19]) : ""}
      </div>
      <div class="kc-art-row">
        ${figure("start-garment", family ? t("Rulebook p. 7: start a garment by discarding a matching yarn (not needed in Family Mode)", "Livro p. 7: comece uma roupa descartando uma lã correspondente (dispensado no Modo Família)") : t("Rulebook p. 7: discard a pink tile, draw 2 Hats, keep 1 and put a needle on it", "Livro p. 7: descarte uma peça rosa, compre 2 Gorros, fique com 1 e ponha uma agulha nele"))}
        ${figure("knit", t("Rulebook p. 7: knitting tiles from the top slots and the bowl into the Hat; a bonus space sends a tile from the bag to the bowl", "Livro p. 7: tricotando peças das vagas do alto e da tigela no Gorro; um espaço de bônus manda uma peça do saco para a tigela"))}
        ${!family && canFlip() ? figure("flip-yarn", t("Rulebook p. 7: discard a pink tile to flip the yellow and teal tiles", "Livro p. 7: descarte uma peça rosa para virar as peças amarela e turquesa")) : ""}
        ${figure("use-grabby-paw", t("Rulebook p. 8: spend a Grabby Paw to take any tile from the bag", "Livro p. 8: gaste uma Patinha para pegar qualquer peça do saco"))}
        ${figure("garment-anatomy", t("Rulebook p. 8: garment card anatomy — type, mandatory and optional spaces, completion bonus", "Livro p. 8: anatomia da carta de roupa — tipo, espaços obrigatórios e opcionais, bônus de conclusão"))}
        ${figure("complete-garment", t("Rulebook p. 8: a completed Hat takes one Color Button (choosing between two that match), the matching Pattern Button and the Hat Garment Button", "Livro p. 8: um Gorro completo leva um Botão de Cor (escolhendo entre dois que combinam), o Botão de Padrão correspondente e o Botão de Roupa do Gorro"))}
      </div>`;
  }

  // ---------- patterns ----------

  function patternsSection() {
    if (isQuilting()) {
      return "";
    }
    return `
      ${sectionHeading("patterns", t("Pattern explanations", "Explicação dos padrões"), [12])}
      <p class="glossary-intro">${t(
        `Read the tiles of a completed garment from top to bottom; A, B, C stand for colors. Length = the number of tiles knitted. ${usesUgly() ? "A garment that fits none of the four patterns gets an Ugly Garment Button." : "In Family Mode a garment without a pattern is not penalised, but patterns still earn Pattern Buttons."}`,
        `Leia as Peças de lã de uma roupa completa de cima para baixo; A, B, C são cores. Comprimento = número de Peças de lã tricotadas. ${usesUgly() ? "Uma roupa que não se encaixa em nenhum dos quatro padrões recebe um Botão de roupa feia." : "No Modo Família uma roupa sem padrão não é penalizada, mas padrões continuam valendo Botões de Padrão."}`
      )}</p>
      <div class="quick-grid">
        ${infoCard(t("PATTERN", "PADRÃO"), t("Stripes · minimum length 3", "Listras · comprimento mínimo 3"), [
          t("Exactly two colors, alternating: A, B, A, B, A… or B, A, B, A…", "Exatamente duas cores, alternando: A, B, A, B, A… ou B, A, B, A…")
        ], [12])}
        ${infoCard(t("PATTERN", "PADRÃO"), t("Colorblock · minimum length 4", "Blocos de cor · comprimento mínimo 4"), [
          t("All colors in blocks (consecutive groups) of 2 or more.", "Todas as cores em blocos (grupos seguidos) de 2 ou mais."),
          t("All tiles of a color are in the same block: no color repeats in two blocks.", "Todas as Peças de lã de uma cor ficam no mesmo bloco: nenhuma cor se repete em dois blocos."),
          t("Examples: A, A, B, B, B, C, C · A, A, A, B, B, B · A, A, B, B.", "Exemplos: A, A, B, B, B, C, C · A, A, A, B, B, B · A, A, B, B."),
          interpretation("a garment of a single color is Solid, not Colorblock: every rulebook example of Colorblock has 2+ colors, and a garment has only one pattern.", "uma roupa de uma só cor é Lisa, não Blocos de cor: todos os exemplos de Blocos de cor do livro têm 2+ cores, e uma roupa tem um só padrão.")
        ], [12])}
        ${infoCard(t("PATTERN", "PADRÃO"), t("Symmetrical · minimum length 4", "Simétrico · comprimento mínimo 4"), [
          t("Reads the same from top to bottom and bottom to top.", "Lê igual de cima para baixo e de baixo para cima."),
          t("Examples: A, B, C, B, A · A, B, B, A · A, B, C, D, C, B, A · A, A, B, B, A, A.", "Exemplos: A, B, C, B, A · A, B, B, A · A, B, C, D, C, B, A · A, A, B, B, A, A."),
          t("A garment that is also Stripes or Solid counts as Stripes or Solid, NOT Symmetrical: A, B, A, B, A is Stripes; A, A, A is Solid.", "Uma roupa que também é Listras ou Liso conta como Listras ou Liso, NÃO como Simétrico: A, B, A, B, A é Listras; A, A, A é Liso.")
        ], [12])}
        ${infoCard(t("PATTERN", "PADRÃO"), t("Solid · minimum length 3", "Liso · comprimento mínimo 3"), [
          t("All tiles the same color: A, A, A…", "Todas as Peças de lã da mesma cor: A, A, A…")
        ], [12])}
      </div>
      <div class="kc-art-row">${figure("patterns", t("Rulebook p. 12: valid (✓) and invalid (✗) garments for each pattern, with minimum lengths", "Livro p. 12: roupas válidas (✓) e inválidas (✗) para cada padrão, com os comprimentos mínimos"))}</div>`;
  }

  // ---------- scoring ----------

  function bonusLines() {
    return [
      `${glyph("bonus-2x-color", "1 / 2X color")} ${t("1 point for every 2 Yarn Tiles of the pictured color (rounded down) across all your completed garments.", "1 ponto para cada 2 Peças de lã da cor mostrada (arredondado para baixo) somando todas as suas roupas completas.")}`,
      `${glyph("bonus-full", "1 / FULL")} ${t("1 point per garment completed to its full length (no spaces left).", "1 ponto por roupa completada no comprimento total (sem espaços sobrando).")}`,
      `${glyph("bonus-type", "1 / TYPE")} ${t("1 point per garment type among your completed garments (maximum 6).", "1 ponto por tipo de roupa entre as suas roupas completas (máximo 6).")}`,
      `${glyph("bonus-garment", "2 / garment type")} ${t("The printed points per completed garment of the pictured type (values vary by card).", "Os pontos impressos por roupa completa do tipo desenhado (valores variam por carta).")}`,
      `${glyph("bonus-2-buttons", "1 / W/ 2 BUTTONS")} ${t("1 point per garment with exactly 2 buttons. Ugly Garment Buttons are not buttons here.", "1 ponto por roupa com exatamente 2 botões. Botões de roupa feia não contam como botões aqui.")}`,
      `${glyph("bonus-3-buttons", "1 / W/ 3 BUTTONS")} ${t("1 point per garment with exactly 3 buttons (Ugly Garment Buttons not counted).", "1 ponto por roupa com exatamente 3 botões (Botões de roupa feia não contam).")}`,
      `${glyph("bonus-type-2plus", "2 / TYPE W/ 2+")} ${t("2 points per garment type of which you completed 2 or more garments.", "2 pontos por tipo de roupa do qual você completou 2 ou mais roupas.")}`,
      `${glyph("bonus-pattern", "2 / pattern")} ${t("2 points per garment with the printed pattern (various patterns on different cards); no Pattern Button needed.", "2 pontos por roupa com o padrão impresso (padrões variados em cartas diferentes); não precisa de Botão de Padrão.")}`,
      `${glyph("bonus-paw", "+ Grabby Paw")} ${t("Immediate bonuses (+ Grabby Paw, + Yarn Tile) are collected when you complete the garment and score nothing at the end.", "Bônus imediatos (+ Patinha, + Peça de lã) são pegos ao completar a roupa e não pontuam no fim.")}`
    ];
  }

  function scoringSection() {
    if (isQuilting()) {
      return "";
    }
    const c = cfg();
    let step = 0;
    const n = () => String(++step);
    return `
      ${sectionHeading("scoring", t("Scoring & winning", "Pontuação e vitória"), [10, 11, 13])}
      <div class="quick-grid">
        ${infoCard(n(), t("Incomplete garments", "Roupas incompletas"), [
          t("Incomplete garments do not score. At the end of the game, remove them (with their Yarn Tiles) and return them to the box.", "Roupas incompletas não pontuam. No fim da partida, retire-as (com as Peças de lã) e devolva-as à caixa."),
          usesUgly() ? t("Incomplete garments never receive Ugly Garment Buttons.", "Roupas incompletas nunca recebem Botões de roupa feia.") : null
        ], [10])}
        ${infoCard(n(), t("Buttons", "Botões"), [
          t("Add up the points printed on all Button Tokens above each of your completed garments.", "Some os pontos impressos em todos os Botões acima de cada roupa completa sua."),
          t("Buttons still in your workspace score nothing.", "Botões ainda na sua área não pontuam.")
        ], [10])}
        ${infoCard(n(), t("Garments", "Roupas"), [
          t("On each completed Garment Card, score the number next to the lowest filled yarn space — only the lowest number, not all of them.", "Em cada Carta de Roupa completa, marque o número junto ao espaço de lã preenchido mais baixo — só o número mais baixo, não todos.")
        ], [10])}
        ${isFamily() ? "" : infoCard(n(), t("Garment bonuses", "Bônus de roupa"), [
          t("Add up the points from the bonuses at the bottom of your completed Garment Cards. Each bonus counts across all your completed garments:", "Some os pontos dos bônus no pé das suas Cartas de Roupa completas. Cada bônus conta sobre todas as suas roupas completas:"),
          ...bonusLines()
        ], [10, 13])}
        ${usesUgly() ? infoCard(n(), t("Ugly Garment Buttons", "Botões de roupa feia"), [
          t(`Subtract 3 points for each Ugly Garment Button ${glyph("ugly-button-back", "−3")} below your garments.`, `Subtraia 3 pontos por Botão de roupa feia ${glyph("ugly-button-back", "−3")} abaixo das suas roupas.`)
        ], [10]) : ""}
        ${c.requests ? infoCard(n(), t("Request Cards", "Cartas de Pedido"), [
          t("Add up the points of the Request Cards whose conditions you met (points in each card's top-left circle).", "Some os pontos das Cartas de Pedido cujas condições você cumpriu (pontos no círculo do canto superior esquerdo de cada carta)."),
          t("Several players may score the same Request Card.", "Vários jogadores podem pontuar a mesma Carta de Pedido."),
          c.rule === 10 ? t("Personal Request Cards score only for their owner.", "Cartas de Pedido pessoais pontuam só para o dono.") : null
        ], [10]) : ""}
        ${isSolo()
          ? infoCard(t("RESULT", "RESULTADO"), t("How well did you do?", "Como você foi?"), [
            t("The solo opponent does not score. Compare your total with the chart:", "O oponente solo não pontua. Compare o seu total com a tabela:"),
            t("40+ Great Start! · 50+ You're Getting It! · 60+ Very Good! · 70+ Excellent! · 80+ Crafty! · 90+ Knitting Pro! · 100+ Knitting Master!", "40+ Ótimo começo! · 50+ Você está pegando o jeito! · 60+ Muito bom! · 70+ Excelente! · 80+ Habilidoso! · 90+ Profissional do tricô! · 100+ Mestre do tricô!"),
            c.scenario ? t(`Scenario ${c.scenario} is completed with ${SCENARIOS[c.scenario - 1].min}+ points and every objective met.`, `O Cenário ${c.scenario} é completado com ${SCENARIOS[c.scenario - 1].min}+ pontos e todos os objetivos cumpridos.`) : null
          ], [16, 18], "victory-card")
          : infoCard(t("WINNER", "VENCEDOR"), t("Most points", "Mais pontos"), [
            t("The player with the most total points wins.", "Vence o jogador com mais pontos no total."),
            t("Tie: the tied player with the most remaining Yarn Tiles wins.", "Empate: vence, entre os empatados, quem tiver mais Peças de lã restantes."),
            t("Still tied: the players share the victory.", "Ainda empatados: os jogadores dividem a vitória."),
            interpretation("“remaining Yarn Tiles” are the tiles left in your top slots and Personal Yarn Bowl, not those knitted into garments.", "“Peças de lã restantes” são as que sobraram nas vagas do alto e na Tigela pessoal, não as tricotadas nas roupas.")
          ], [10], "victory-card")}
      </div>
      <div class="kc-art-row">
        ${figure("garment-points", t("Rulebook p. 10: only the number next to the lowest filled space scores", "Livro p. 10: só o número junto ao espaço preenchido mais baixo pontua"))}
        ${isFamily() ? "" : figure("garment-bonuses", t("Rulebook p. 10: garment bonuses at the bottom of the cards", "Livro p. 10: bônus de roupa no pé das cartas"))}
      </div>`;
  }

  // ---------- requests & challenges ----------

  function requestsSection() {
    if (isQuilting()) {
      return "";
    }
    const c = cfg();
    if (!c.requests && c.challenge === "none") {
      return "";
    }
    const parts = [sectionHeading("requests", t("Requests & challenges", "Pedidos e desafios"), [13, 17, 18, 19])];
    if (c.requests) {
      const numbers = c.scenario ? SCENARIOS[c.scenario - 1].cards : REQUESTS.map((_, index) => index + 1);
      parts.push(`
        <h3 class="subhead">${t("Request Card clarifications", "Esclarecimentos das Cartas de Pedido")}</h3>
        <p class="glossary-intro">${c.scenario
          ? t(`Your Scenario uses these 4 cards. Each card prints its name, picture and points; the number is in its bottom-right corner.`, `O seu Cenário usa estas 4 cartas. Cada carta traz nome, figura e pontos; o número fica no canto inferior direito.`)
          : t("Find the number in the bottom-right corner of each dealt card. The card prints its name, picture and points; these clarifications come from p. 13.", "Encontre o número no canto inferior direito de cada carta revelada. A carta traz nome, figura e pontos; estes esclarecimentos vêm da p. 13.")} ${interpretation("a number of garments means at least that many; “minimum length” means only the mandatory spaces were filled.", "um número de roupas significa pelo menos essa quantidade; “comprimento mínimo” significa que só os espaços obrigatórios foram preenchidos.")}</p>
        <div class="quick-grid kc-request-grid">${numbers.map((number) => `
          <article class="info-card glossary-card">
            <span class="component-label">${t("REQUEST", "PEDIDO")} #${number}</span>
            <p>${pair(REQUESTS[number - 1])}</p>
            ${referenceLink(13)}
          </article>`).join("")}</div>
        <div class="kc-art-row">${figure("request-cards", t("Rulebook p. 10: Request Cards — points top left, Grabby Paw “1st” bonus top right, number bottom right", "Livro p. 10: Cartas de Pedido — pontos no alto à esquerda, bônus “1st” de Patinha no alto à direita, número embaixo à direita"))}</div>`);
    }
    if (c.challenge !== "none") {
      parts.push(`
        <h3 class="subhead">${t("Achievement points", "Pontos de conquista")}</h3>
        <div class="quick-grid">
          ${infoCard(t("TRACKING", "REGISTRO"), t("The p. 17 chart", "O quadro da p. 17"), [
            t("Write your name above one of the colored rows on p. 17 (each row has a color symbol).", "Escreva o seu nome acima de uma das fileiras coloridas da p. 17 (cada fileira tem um símbolo de cor)."),
            t("Whenever you earn an Achievement point, fill in your color's symbol next to that achievement or scenario, then fill in the next stitch of your row, left to right.", "Sempre que ganhar um ponto de conquista, pinte o símbolo da sua cor junto àquela conquista ou cenário e depois pinte o próximo ponto da sua fileira, da esquerda para a direita."),
            interpretation("each player can earn each achievement, scenario or modification once (one symbol per color). A Scenario is completed by finishing with at least its minimum score and every objective met; a Rule Modification is earned by finishing a game under it.", "cada jogador pode ganhar cada conquista, cenário ou modificação uma vez (um símbolo por cor). Um Cenário é completado terminando com pelo menos a pontuação mínima e todos os objetivos cumpridos; uma Modificação de regra é ganha terminando uma partida sob ela."),
            interpretation("the rulebook says to write on these pages; use a copy if you prefer to keep the rulebook clean.", "o livro diz para escrever nestas páginas; use uma cópia se preferir manter o livro limpo.")
          ], [17])}
          ${c.challenge === "achievements" ? infoCard(t("STANDARD GAME", "JOGO PADRÃO"), t("30 achievements", "30 conquistas"), ACHIEVEMENTS.map((item, index) => `<strong>${index + 1}.</strong> ${pair(item)}`), [19]) : ""}
          ${c.scenario ? infoCard(t("SCENARIO", "CENÁRIO"), t(`Scenario ${c.scenario}`, `Cenário ${c.scenario}`), [
            t(`Request Cards #${SCENARIOS[c.scenario - 1].cards.join(", #")}.`, `Cartas de Pedido nº ${SCENARIOS[c.scenario - 1].cards.join(", ")}.`),
            t(`Minimum score ${SCENARIOS[c.scenario - 1].min}.`, `Pontuação mínima ${SCENARIOS[c.scenario - 1].min}.`),
            ...SCENARIOS[c.scenario - 1].goals.map(pair),
            t("The rulebook recommends attempting the next Scenario once you complete this one.", "O livro recomenda tentar o próximo Cenário quando completar este.")
          ], [18]) : ""}
          ${c.rule ? infoCard(t("RULE MODIFICATION", "MODIFICAÇÃO DE REGRA"), t(`Modification ${c.rule}`, `Modificação ${c.rule}`), [pair(RULE_MODS[c.rule - 1]), t("This guide's setup and rules already apply it.", "A preparação e as regras deste guia já a aplicam.")], [19]) : ""}
        </div>`);
    }
    return parts.join("");
  }

  // ---------- iconography ----------

  function iconsSection() {
    const family = isFamily();
    const quilting = isQuilting();
    const icons = quilting
      ? [
        iconCard("board-player-count", "Player-count icon", "Figures in the center basket: use the side matching your player count.", "Ícone de número de jogadores", "Figuras no cesto central: use o lado que corresponde ao número de jogadores.", [4, 15]),
        iconCard("board-start-space", "Starting space", "A small dot next to a cat space: cats start on these spaces.", "Espaço inicial", "Um pontinho junto a um espaço de gato: os gatos começam nesses espaços.", [4]),
        iconCard("board-first-space", "First-player space", "The starting space marked with a star.", "Espaço do primeiro jogador", "O espaço inicial marcado com uma estrela.", [4])
      ]
      : [
        !family ? iconCard("yarn-knit", "Knit side", "The side of a Yarn Tile with “V” stitches. Goes in knit spaces.", "Lado direito", "O lado da Peça de lã com pontos em “V”. Vai em espaços de direito.", [4, 7]) : null,
        !family ? iconCard("yarn-purl", "Purl side", "The solid-color side of a Yarn Tile. Goes in purl spaces.", "Lado avesso", "O lado de cor sólida da Peça de lã. Vai em espaços de avesso.", [4, 7]) : null,
        ...Object.keys(COLORS).map((id) => iconCard(`color-${id}`, `${COLORS[id].en} (${COLORS[id].symbolEn})`, `Symbol of the ${COLORS[id].en.toLowerCase()} Yarn Tiles (24 in the box).${GARMENTS.find((g) => g.color === id) ? ` ${GARMENTS.find((g) => g.color === id).en} cards have this back color.` : ""}`, `${COLORS[id].pt} (${COLORS[id].symbolPt})`, `Símbolo da cor ${COLORS[id].pt}: há 24 Peças de lã dessa cor na caixa.${GARMENTS.find((g) => g.color === id) ? ` As cartas de ${GARMENTS.find((g) => g.color === id).pt} têm esse verso.` : ""}`, [3, 17])),
        iconCard("board-player-count", "Player-count icon", "Figures in the center basket of the Central Knitting Circle Board: use the side matching your player count.", "Ícone de número de jogadores", "Figuras no cesto central do Tabuleiro central: use o lado que corresponde ao número de jogadores.", [4]),
        iconCard("board-start-space", "Starting space", "A small dot next to a cat space: cats start on these spaces.", "Espaço inicial", "Um pontinho junto a um espaço de gato: os gatos começam nesses espaços.", [4]),
        iconCard("board-first-space", "First-player space", "The starting space marked with a star. Its cat's player takes the First Player Marker.", "Espaço do primeiro jogador", "O espaço inicial marcado com uma estrela. O dono desse gato pega o Marcador de primeiro jogador.", [4]),
        !family ? iconCard("space-knit", "Knit space", "Cat space showing a zigzag-stitched tile: its yarn is turned knit side up.", "Espaço de direito", "Espaço de gato com uma peça desenhada em zigue-zague: a lã ao lado fica com o direito para cima.", [4, 9]) : null,
        !family ? iconCard("space-purl", "Purl space", "Cat space showing a plain tile: its yarn is turned purl side up.", "Espaço de avesso", "Espaço de gato com uma peça lisa: a lã ao lado fica com o avesso para cima.", [4, 9]) : null,
        iconCard("first-player", "First Player Marker", isSolo() ? "You keep it all game; flip it like a coin to move the solo opponent (knit or purl side)." : "Its holder drafts first and moves a center tile out each round; passes clockwise.", "Marcador de primeiro jogador", isSolo() ? "Fica com você a partida toda; jogue-o como moeda para mover o oponente solo (lado direito ou avesso)." : "Quem o tem pega primeiro e leva uma peça do centro para fora a cada rodada; passa em sentido horário.", isSolo() ? [4, 16] : [4, 9]),
        iconCard("knitting-needle", "Knitting Needle", `Marks a garment in progress. You have ${needles()}, so at most ${needles()} garment${needles() > 1 ? "s" : ""} in progress.`, "Agulha de tricô", `Marca uma roupa em andamento. Você tem ${needles()}, então no máximo ${needles()} roupa${needles() > 1 ? "s" : ""} em andamento.`, [4, 7]),
        iconCard("grabby-paw", "Grabby Paw", "Discard it to search the bag for any Yarn Tile.", "Patinha", "Descarte-a para procurar no saco qualquer Peça de lã.", [4, 8]),
        iconCard("button-color", "Color Button", "Round. Earned by a garment containing all the color(s) shown; scores its printed number.", "Botão de Cor", "Redondo. Ganho por uma roupa que contenha todas as cores mostradas; pontua o número impresso.", [3, 8]),
        iconCard("button-pattern", "Pattern Button", "Triangle. Earned by a garment with the printed pattern (Stripes, Colorblock, Symmetrical, Solid).", "Botão de Padrão", "Triângulo. Ganho por uma roupa com o padrão impresso (Listras, Blocos de cor, Simétrico, Liso).", [3, 8]),
        iconCard("button-garment", "Garment Button", "Square. Earned by a garment of the pictured type.", "Botão de Roupa", "Quadrado. Ganho por uma roupa do tipo desenhado.", [3, 8]),
        usesUgly() ? iconCard("ugly-button", "Ugly Garment Button", "Placed below a completed garment with no pattern.", "Botão de roupa feia", "Colocado abaixo de uma roupa completa sem padrão.", [8]) : null,
        usesUgly() ? iconCard("ugly-button-back", "−3", "Each Ugly Garment Button is worth −3 at the end.", "−3", "Cada Botão de roupa feia vale −3 no fim.", [8, 10]) : null,
        !family ? iconCard("bonus-yarn-space", "Bonus Yarn Tile space", "A garment space showing “+?” and a tile: when you fill it, draw a Yarn Tile from the bag into your bowl.", "Espaço de Peça de lã bônus", "Um espaço de roupa com “+?” e uma peça: ao preenchê-lo, tire uma Peça de lã do saco para a tigela.", [7, 8]) : null,
        !family ? iconCard("bonus-paw", "+ Grabby Paw", "In a space or as a completion bonus: take a Grabby Paw from the supply.", "+ Patinha", "Num espaço ou como bônus de conclusão: pegue uma Patinha da reserva.", [7, 8]) : null,
        ...(!family ? [
          iconCard("bonus-2x-color", "1 / 2X color", "End: 1 point per 2 tiles of that color on your completed garments.", "1 / 2X cor", "Fim: 1 ponto por 2 peças daquela cor nas suas roupas completas.", [13], true),
          iconCard("bonus-full", "1 / FULL", "End: 1 point per full-length garment.", "1 / FULL (total)", "Fim: 1 ponto por roupa de comprimento total.", [13], true),
          iconCard("bonus-type", "1 / TYPE", "End: 1 point per garment type you completed (max 6).", "1 / TYPE (tipo)", "Fim: 1 ponto por tipo de roupa completado (máx. 6).", [13], true),
          iconCard("bonus-garment", "N / garment type", "End: the printed points per completed garment of that type.", "N / tipo de roupa", "Fim: os pontos impressos por roupa completa daquele tipo.", [13], true),
          iconCard("bonus-2-buttons", "1 / W/ 2 BUTTONS", "End: 1 point per garment with exactly 2 buttons (not ugly ones).", "1 / W/ 2 BUTTONS", "Fim: 1 ponto por roupa com exatamente 2 botões (sem contar os feios).", [13], true),
          iconCard("bonus-3-buttons", "1 / W/ 3 BUTTONS", "End: 1 point per garment with exactly 3 buttons (not ugly ones).", "1 / W/ 3 BUTTONS", "Fim: 1 ponto por roupa com exatamente 3 botões (sem contar os feios).", [13], true),
          iconCard("bonus-type-2plus", "2 / TYPE W/ 2+", "End: 2 points per garment type with 2+ completed garments.", "2 / TYPE W/ 2+", "Fim: 2 pontos por tipo de roupa com 2+ roupas completas.", [13], true),
          iconCard("bonus-pattern", "2 / pattern", "End: 2 points per garment with that pattern; no button needed.", "2 / padrão", "Fim: 2 pontos por roupa com aquele padrão; não precisa de botão.", [13], true)
        ] : [])
      ];
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), quilting ? [4, 15] : [3, 4, 8, 13])}
      <p class="glossary-intro">${t("Each image is cropped individually from the rulebook's pictures.", "Cada imagem foi recortada individualmente das figuras do livro de regras.")}${family ? t(" Knit/purl and garment-bonus icons are hidden: Family Mode ignores them.", " Ícones de direito/avesso e de bônus de roupa estão ocultos: o Modo Família os ignora.") : ""}</p>
      <div class="icon-grid">${icons.filter(Boolean).join("")}</div>
      ${quilting ? "" : `<div class="kc-art-row">${figure("player-board", t("Rulebook p. 5: a Player Board — 4 top slots, Personal Yarn Bowl, 6-button workspace, Grabby Paw slots — next to a Sock in progress", "Livro p. 5: um Tabuleiro pessoal — 4 vagas no alto, Tigela de lã, área de 6 botões, vagas de Patinha — ao lado de uma Meia em andamento"))}</div>`}`;
  }

  // ---------- examples ----------

  function examplesSection() {
    if (isQuilting()) {
      return "";
    }
    const family = isFamily();
    const manualExamples = [
      family ? null : {
        title: t("Scoring example (EV, 71 points)", "Exemplo de pontuação (EV, 71 pontos)"),
        art: ["scoring-example", t("Rulebook p. 11: EV's garments, buttons and Request Cards, and the scorepad column", "Livro p. 11: as roupas, botões e Cartas de Pedido de EV, e a coluna do bloco de pontos")],
        lines: [
          t("An incomplete Hat (needle still on it) does not score and returns to the box.", "Um Gorro incompleto (ainda com agulha) não pontua e volta à caixa."),
          rl("Buttons", "27 — the printed numbers on all buttons above completed garments.", "Botões", "27 — os números impressos em todos os botões acima das roupas completas."),
          rl("Garments", "25 — the lowest filled number of each completed card.", "Roupas", "25 — o número mais baixo preenchido de cada carta completa."),
          rl("Garment bonuses", "14: Sock “1 / FULL” ×3 (3 full garments) = 3; Hat “1 / W/3 BUTTONS” ×2 = 2; Long Johns “2 / STRIPES” ×1 = 2; second Sock “1 / FULL” ×3 = 3; Sweater “2 / TYPE W/2+” ×1 (socks) = 2; Mitten “1 / 2X green” with 5 green tiles = 2.", "Bônus de roupa", "14: Meia “1 / FULL” ×3 (3 roupas totais) = 3; Gorro “1 / W/3 BUTTONS” ×2 = 2; Ceroulas “2 / STRIPES” ×1 = 2; segunda Meia “1 / FULL” ×3 = 3; Suéter “2 / TYPE W/2+” ×1 (meias) = 2; Luva “1 / 2X verde” com 5 peças verdes = 2."),
          rl("Ugly buttons", "−3 (one on the Hat).", "Botões feios", "−3 (um no Gorro)."),
          usesRequests() ? rl("Request Cards", "8 — Favorite Color (8 purple tiles) and Garment Master (5 Garment Buttons).", "Cartas de Pedido", "8 — Favorite Color (8 peças roxas) e Garment Master (5 Botões de Roupa).") : t("(EV also scored 8 from Request Cards, which this match does not use.)", "(EV também marcou 8 com Cartas de Pedido, que esta partida não usa.)"),
          rl("Total", "71.", "Total", "71.")
        ],
        pages: [11]
      },
      {
        title: t("Garment points", "Pontos das roupas"),
        art: ["garment-points", t("Rulebook p. 10: the circled number is the one that scores", "Livro p. 10: o número circulado é o que pontua")],
        lines: [
          t("A Sock filled down to its first numbered space scores that number only.", "Uma Meia preenchida até o primeiro espaço numerado marca só esse número."),
          t("A Sock filled one space further scores the second number, not both.", "Uma Meia preenchida um espaço a mais marca o segundo número, não os dois."),
          t("A full Sweater scores the number of its last space.", "Um Suéter completo marca o número do último espaço.")
        ],
        pages: [10]
      },
      {
        title: t("Completing a Hat", "Completando um Gorro"),
        art: ["complete-garment", t("Rulebook p. 8", "Livro p. 8")],
        lines: [
          t("The Hat's mandatory spaces are filled, so it is cast off and the needle removed.", "Os espaços obrigatórios do Gorro estão preenchidos, então ele é arrematado e a agulha retirada."),
          t("Two Color Buttons in the workspace are satisfied: only one may go above the Hat, so the player chooses.", "Dois Botões de Cor da área são satisfeitos: só um pode ir acima do Gorro, então o jogador escolhe."),
          t("The Hat Garment Button and the matching Pattern Button also move above the card.", "O Botão de Roupa do Gorro e o Botão de Padrão correspondente também vão para cima da carta."),
          t("The emptied workspace slots are refilled only at round end.", "As vagas esvaziadas da área só são repostas no fim da rodada.")
        ],
        pages: [8]
      }
    ].filter(Boolean);
    const guideExamples = [
      {
        title: t("Which pattern is it?", "Qual é o padrão?"),
        lines: [
          t("Guide's own examples, built from the p. 12 definitions (colors read top to bottom):", "Exemplos do próprio guia, construídos com as definições da p. 12 (cores lidas de cima para baixo):"),
          rl("Yellow, Teal, Yellow", "Stripes (length 3).", "Amarelo, Turquesa, Amarelo", "Listras (comprimento 3)."),
          rl("Pink, Pink, Pink", "Solid.", "Rosa, Rosa, Rosa", "Liso."),
          rl("Green, Green, Purple, Purple", "Colorblock.", "Verde, Verde, Roxo, Roxo", "Blocos de cor."),
          rl("Green, Purple, Purple, Green", "Symmetrical (Green repeats in two blocks, so not Colorblock).", "Verde, Roxo, Roxo, Verde", "Simétrico (Verde se repete em dois blocos, então não é Blocos de cor)."),
          rl("Teal, Pink, Teal, Pink, Teal", "Stripes — also symmetrical, but Stripes wins.", "Turquesa, Rosa, Turquesa, Rosa, Turquesa", "Listras — também simétrico, mas vale Listras."),
          rl("Teal, Teal, Pink", "no pattern (Colorblock needs length 4)" + (usesUgly() ? ": Ugly Garment Button." : "."), "Turquesa, Turquesa, Rosa", "sem padrão (Blocos de cor exige comprimento 4)" + (usesUgly() ? ": Botão de roupa feia." : "."))
        ],
        pages: [12]
      },
      {
        title: t("A drafting turn", "Um turno de coleta"),
        art: ["drafting", t("Rulebook p. 6", "Livro p. 6")],
        lines: [
          ruleMod() === 1
            ? t("Guide's example with Rule Modification 1: your cat leaves a purl space, so it may jump to any available knit space anywhere around the board.", "Exemplo do guia com a Modificação de regra 1: o seu gato deixa um espaço de avesso, então pode saltar para qualquer espaço de direito disponível ao redor do tabuleiro.")
            : t("The black cat may move to the next available space or the one after (“OR”). A space with another cat, or with no tiles left, is skipped and not counted.", "O gato preto pode ir para o próximo espaço disponível ou o seguinte (“OR”). Um espaço com outro gato, ou sem peças, é pulado e não conta."),
          t("It takes one of the two tiles beside its new space and puts it in the next free top slot of its Player Board.", "Ele pega uma das duas peças junto ao novo espaço e a põe na próxima vaga livre do alto do seu Tabuleiro."),
          usesOrientation() ? t("The tile keeps its knit or purl side until the Crafting Phase.", "A peça mantém o lado direito ou avesso até a Fase de confecção.") : null
        ],
        pages: [6]
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
      ${sectionHeading("examples", t("Examples", "Exemplos"), [6, 8, 10, 11, 12])}
      <div class="example-grid kc-example-grid">${manualExamples.map((example, index) => card(example, index, "Rulebook example", "Exemplo do manual")).join("")}${guideExamples.map((example, index) => card(example, manualExamples.length + index, index === 0 ? "Guide's example, built from the rules" : "Rulebook picture, guide's wording", index === 0 ? "Exemplo do guia, construído a partir das regras" : "Figura do manual, texto do guia")).join("")}</div>`;
  }

  // ---------- glossary ----------

  function glossarySection() {
    const quilting = isQuilting();
    const all = [
      { term: ["Available space", "Espaço disponível"], text: ["A cat space with no other cat on it and at least 1 tile next to it.", "Um espaço de gato sem outro gato e com pelo menos 1 peça ao lado."], page: 6, q: true },
      { term: ["Central Knitting Circle Board", "Tabuleiro central"], text: ["The round basket board in the middle; cats move clockwise around its rim.", "O tabuleiro redondo em forma de cesto no meio; os gatos andam em sentido horário pela borda."], page: 4, q: true },
      { term: ["Cat Token", "Gato"], text: ["Your wooden cat on the central board; it moves to draft tiles.", "O seu gato de madeira no tabuleiro central; ele se move para pegar peças."], page: 6, q: true },
      { term: ["Patch Tile", "Peça de retalho"], text: ["Calico's hexagonal fabric tile, drafted with the cats in Quilting Circle.", "A peça hexagonal de tecido de Calico, escolhida com os gatos em Quilting Circle."], page: 15, onlyQ: true },
      { term: ["Active garment", "Roupa ativa"], text: ["A Garment Card with a Knitting Needle on it and spaces left to fill.", "Uma Carta de Roupa com Agulha em cima e espaços a preencher."], page: 7 },
      { term: ["Button Token", "Botão"], text: ["Round Color, triangular Pattern or square Garment goal in your workspace; moved above a garment that meets it.", "Meta redonda de Cor, triangular de Padrão ou quadrada de Roupa na sua área; vai para cima da roupa que a cumpre."], page: 8 },
      { term: ["Cast off", "Arrematar"], text: isFamily() ? ["Complete a garment whose mandatory spaces are filled: remove its needle and take its buttons.", "Completar uma roupa com os espaços obrigatórios preenchidos: retirar a agulha e pegar os botões."] : ["Complete a garment whose mandatory spaces are filled: remove its needle, take bonuses and buttons.", "Completar uma roupa com os espaços obrigatórios preenchidos: retirar a agulha, pegar bônus e botões."], page: 8 },
      { term: ["Colorblock", "Blocos de cor"], text: ["Pattern: every color in a single block of 2+ tiles; min length 4.", "Padrão: cada cor num único bloco de 2+ peças; comprimento mínimo 4."], page: 12 },
      { term: ["Garment Card", "Carta de Roupa"], text: ["A Mitten, Sock, Hat, Scarf, Sweater or Long Johns to knit, with mandatory and optional spaces and a bonus.", "Uma Luva, Meia, Gorro, Cachecol, Suéter ou Ceroulas para tricotar, com espaços obrigatórios e opcionais e um bônus."], page: 8 },
      { term: ["Grabby Paw", "Patinha"], text: ["Token spent to pick any Yarn Tile from the bag.", "Marcador gasto para escolher qualquer Peça de lã do saco."], page: 8 },
      { term: ["Knit / purl", "Direito / avesso"], text: ["The two sides of a Yarn Tile (V stitches / solid) and of board and garment spaces.", "Os dois lados de uma Peça de lã (pontos em V / liso) e dos espaços do tabuleiro e das roupas."], page: 4, noFamily: true },
      { term: ["Knitting Needle", "Agulha de tricô"], text: ["Marks a garment in progress; limits how many you can have.", "Marca uma roupa em andamento; limita quantas você pode ter."], page: 7 },
      { term: ["Mandatory spaces", "Espaços obrigatórios"], text: ["The lighter top spaces of a Garment Card, down to the first one with a point number.", "Os espaços claros do alto de uma Carta de Roupa, até o primeiro com um número de pontos."], page: 8 },
      { term: ["Optional spaces", "Espaços opcionais"], text: ["The darker spaces below; filling them raises the garment's score.", "Os espaços mais escuros abaixo; preenchê-los aumenta a pontuação da roupa."], page: 8 },
      { term: ["Personal Yarn Bowl", "Tigela de lã pessoal"], text: [`The basket on your Player Board; its tiles are flexible and only ${bowlLimit()} may stay between rounds.`, `O cesto do seu Tabuleiro; as peças dali são flexíveis e só ${bowlLimit()} ${bowlLimit() === 1 ? "pode" : "podem"} ficar entre rodadas.`], page: 9 },
      { term: ["Request Card", "Carta de Pedido"], text: ["Advanced goal (shared, or personal with Rule Modification 10): Grabby Paw for the first to complete it, printed points at the end.", "Meta avançada (comum, ou pessoal com a Modificação de regra 10): Patinha para o primeiro a completá-la, pontos impressos no fim."], page: 4, requests: true },
      { term: ["Solid", "Liso"], text: ["Pattern: all tiles one color; min length 3.", "Padrão: todas as Peças de lã de uma cor; comprimento mínimo 3."], page: 12 },
      { term: ["Stripes", "Listras"], text: ["Pattern: exactly 2 alternating colors; min length 3.", "Padrão: exatamente 2 cores alternadas; comprimento mínimo 3."], page: 12 },
      { term: ["Symmetrical", "Simétrico"], text: ["Pattern: reads the same both ways, and is not Stripes or Solid; min length 4.", "Padrão: lê igual nos dois sentidos e não é Listras nem Liso; comprimento mínimo 4."], page: 12 },
      { term: ["Ugly Garment Button", "Botão de roupa feia"], text: ["−3 token placed below a completed garment with no pattern.", "Marcador de −3 posto abaixo de uma roupa completa sem padrão."], page: 8, noFamily: true },
      { term: ["Workspace", "Área de botões"], text: ["The 6 button slots in the middle of your Player Board; refilled at round end.", "As 6 vagas de botões no meio do seu Tabuleiro; repostas no fim da rodada."], page: 9 },
      { term: ["Yarn slot", "Vaga de lã"], text: ["One tile position: 2 next to each cat space (near and far), and 4 along the top of your Player Board.", "Uma posição de peça: 2 junto a cada espaço de gato (perto e longe) e 4 no alto do seu Tabuleiro."], page: 4 }
    ];
    const visible = all.filter((item) => {
      if (quilting) {
        return item.q || item.onlyQ;
      }
      if (item.onlyQ) return false;
      if (item.noFamily && isFamily()) return false;
      if (item.requests && !usesRequests()) return false;
      return true;
    });
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), quilting ? [15] : [7, 8, 12])}
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
    document.body.classList.add("theme-knitting-circle");
    document.documentElement.lang = state.language;
    document.title = t("Knitting Circle — Field Manual", "Knitting Circle — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Knitting Circle: standard, Family and Solo modes, Request Cards, Scenarios, Achievements, Rule Modifications and the Quilting Circle variant for Calico, with a filtered setup checklist.",
        "Regras interativas bilíngues de Knitting Circle: modos padrão, Família e Solo, Cartas de Pedido, Cenários, Conquistas, Modificações de regra e a variante Quilting Circle para Calico, com lista de preparação filtrada."
      );
    }

    const sections = [quickReference(), setupSection(), roundSection(), craftingSection(), patternsSection(), scoringSection(), requestsSection(), iconsSection(), examplesSection(), glossarySection()]
      .filter(Boolean)
      .map((markup) => `<section class="rule-section">${markup}</section>`)
      .join("");

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook", "Livro interativo")}</p>
          <h1>Knitting Circle</h1>
          <p class="hero-intro">${t(
            "A cozy tile-drafting puzzle: send your cat around the knitting basket for yarn, knit it into mittens, socks, hats, scarves, sweaters and long johns in just the right color patterns, and finish them with buttons.",
            "Um quebra-cabeça aconchegante de escolher peças: mande o seu gato pela cesta de tricô atrás de lã, tricote luvas, meias, gorros, cachecóis, suéteres e ceroulas nos padrões de cor certos e finalize com botões."
          )}</p>
          <div class="hero-meta"><span>${t("1–4 players", "1–4 jogadores")}</span><span>${t("Ages 10+", "10+ anos")}</span><span>${t("6 rounds · a Calico game", "6 rodadas · um jogo da série Calico")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/knitting-circle.webp" alt="${t("Cover of the Knitting Circle rulebook", "Capa do livro de regras de Knitting Circle")}" fetchpriority="high"><figcaption>${t("Rulebook cover · Flatout Games / AEG", "Capa do livro de regras · Flatout Games / AEG")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("Knitting basket", "Cesta de tricô")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column kc-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied 20-page English rulebook (Flatout Games / AEG, 2025). PDF page numbers match the printed ones. Card and token names stay as printed where useful. Request Card names, Garment Card points and bonuses are printed on the cards: read them there. Points marked “Guide's reading” are interpretations where the rulebook is silent.",
            "Este guia cobre o livro de regras em inglês fornecido, de 20 páginas (Flatout Games / AEG, 2025). Os números de página do PDF correspondem aos impressos. Nomes de cartas e marcadores ficam como impressos quando útil. Os nomes das Cartas de Pedido e os pontos e bônus das Cartas de Roupa estão impressos nas cartas: leia-os lá. Trechos marcados como “Leitura do guia” são interpretações onde o livro é omisso."
          )}</div>
          ${sections}
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the Knitting Circle rulebook. Created by Emily Vincent and the Flatout Games CoLab; illustrated by Beth Sobel. © 2025 Alderac Entertainment Group. Knitting Circle and Calico are trademarks of AEG or Flatout Games.",
        "Guia pessoal de consulta baseado no livro de regras de Knitting Circle. Criado por Emily Vincent e o Flatout Games CoLab; ilustrado por Beth Sobel. © 2025 Alderac Entertainment Group. Knitting Circle e Calico são marcas da AEG ou da Flatout Games."
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
      root.querySelector(".kc-page")?.prepend(notice);
    }
    notice.textContent = storageNoticeText();
  }

  function applyPreference(patch) {
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
    if (target.matches("[data-kc-mode]")) {
      applyPreference({ mode: target.dataset.kcMode });
      return;
    }
    if (target.matches("[data-kc-players]")) {
      applyPreference({ players: Number(target.dataset.kcPlayers) });
      return;
    }
    if (target.matches("[data-kc-requests]")) {
      applyPreference({ requests: target.dataset.kcRequests });
      return;
    }
    if (target.matches("[data-kc-challenge]")) {
      applyPreference({ challenge: target.dataset.kcChallenge });
      return;
    }
    if (target.matches("[data-kc-scenario]")) {
      applyPreference({ scenario: Number(target.dataset.kcScenario) });
      return;
    }
    if (target.matches("[data-kc-rule]")) {
      applyPreference({ rule: Number(target.dataset.kcRule) });
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

  window.KnittingCircle = { renderInto, onClick, onChange };
})();
