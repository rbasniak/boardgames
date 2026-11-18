(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.carcassonne.v1";
  const SETUP_KEY = "field-manual.carcassonne.setup.v1";
  const ICONS = "assets/carcassonne/icons/";
  const ART = "assets/carcassonne/art/";

  // ---------- sources ----------
  // Reference codes: first letter = booklet, rest = printed page ("c3", "s1", "i2", "d4", "f", "b", "g2").
  // The core PDF holds the 6-page rulebook (PDF pages 1–6, printed numbers = PDF numbers) followed by the
  // 2-page supplemental rules sheet (printed pages 1–2 = PDF pages 7–8). Every expansion PDF uses printed = PDF.
  const BOOKS = {
    c: { file: "carcassonne_core.pdf", en: "Rulebook", pt: "Manual", offset: 0 },
    s: { file: "carcassonne_core.pdf", en: "Supplement", pt: "Suplemento", offset: 6 },
    i: { file: "carcassonne_inns_and_cathedrals.pdf", en: "Inns & Cathedrals", pt: "Inns & Cathedrals", offset: 0 },
    d: { file: "carcassonne_dragon_and_fairy.pdf", en: "Dragon & Fairy", pt: "Dragon & Fairy", offset: 0 },
    f: { file: "carcassonne_festival.pdf", en: "The Festival", pt: "The Festival", offset: 0, single: true },
    b: { file: "carcassonne_drawbridges.pdf", en: "The Drawbridges", pt: "The Drawbridges", offset: 0, single: true },
    g: { file: "carcassonne_german-cathedrals.pdf", en: "German Cathedrals", pt: "German Cathedrals", offset: 0 }
  };

  // ---------- rules data ----------

  const PLAYER_COUNTS = ["2", "3", "4", "5", "6"];
  const OPTIONS = ["farmers", "river", "abbot", "inns", "dragon", "festival", "drawbridges", "cathedrals"];
  const defaults = { language: "pt-BR", players: "4", farmers: "no", river: "no", abbot: "no", inns: "no", dragon: "no", festival: "no", drawbridges: "no", cathedrals: "no" };

  // Component counts. Base rulebook p. 2: 84 tiles, 12 of them river tiles; the starting tile and the river tiles
  // have dark backs, so 71 tiles have the normal back (the guide's arithmetic). Expansion counts from each booklet's
  // component list. The Inns & Cathedrals river tile with an inn is one of its 24 tiles (setup: "the new river tile" /
  // "the rest of the new land tiles").
  const BOX = { tiles: 84, river: 12, baseLand: 71, innsTiles: 24, innsLand: 23, dragonLand: 26, dragonRemoved: 5, festival: 12, drawbridges: 12, cathedrals: 6 };

  const COLORS = [
    { id: "black", en: "black", pt: "preto" },
    { id: "red", en: "red", pt: "vermelho" },
    { id: "green", en: "green", pt: "verde" },
    { id: "blue", en: "blue", pt: "azul" },
    { id: "yellow", en: "yellow", pt: "amarelo" }
  ];

  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;
  let notice = "";

  // ---------- state & storage ----------

  function yesNo(value) {
    return value === "yes" ? "yes" : "no";
  }

  function normalizePreferences(saved) {
    const next = {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      players: PLAYER_COUNTS.includes(String(saved?.players)) ? String(saved.players) : defaults.players
    };
    OPTIONS.forEach((key) => {
      next[key] = yesNo(saved?.[key]);
    });
    // Six players needs the pink figures from Inns & Cathedrals (I&C p. 1).
    if (next.players === "6" && next.inns !== "yes") {
      next.players = "5";
    }
    return next;
  }

  // Everything except the language changes the preparation.
  function signature(source = state) {
    return [source.players, ...OPTIONS.map((key) => `${key}:${source[key]}`)].join("|");
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Carcassonne preferences.", error);
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
      console.error("Could not read Carcassonne setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Carcassonne preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Carcassonne setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function on(key) {
    return state[key] === "yes";
  }

  function players() {
    return Number(state.players);
  }

  function when(condition, html) {
    return condition ? html : "";
  }

  function scriptBase() {
    const script = document.querySelector('script[src*="carcassonne.js"]');
    return script?.src || document.baseURI;
  }

  function parseRef(code) {
    const book = BOOKS[code[0]];
    const page = Number(code.slice(1)) || 1;
    return { book, page };
  }

  function manualUrl(code) {
    const { book, page } = parseRef(code);
    return `${new URL(`manuals/${book.file}`, scriptBase()).href}#page=${page + book.offset}`;
  }

  function referenceLink(code) {
    const { book, page } = parseRef(code);
    const name = t(book.en, book.pt);
    const label = book.single ? `${name} ↗` : `${name} p. ${page} ↗`;
    return `<a class="source-link" href="${manualUrl(code)}" target="_blank" rel="noreferrer">${label}</a>`;
  }

  function uniqueRefs(codes) {
    return [...new Set(Array.isArray(codes) ? codes : [codes])].filter(Boolean);
  }

  function refs(codes) {
    return uniqueRefs(codes).map(referenceLink).join(" ");
  }

  function sectionHeading(id, title, codes) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">CARCASSONNE / ${sectionIndex(id)}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="ccs-section-references">${uniqueRefs(codes).map(referenceLink).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    const label = t(labelEn, labelPt);
    return `<strong>${label}${label.endsWith("?") ? "" : ":"}</strong> ${t(bodyEn, bodyPt)}`;
  }

  function interpretation(en, pt) {
    return `<span class="ccs-interpretation">${t("Guide's reading", "Leitura do guia")}</span><span class="ccs-visually-hidden">:</span> ${t(en, pt)}`;
  }

  // The supplied booklets are in English: in PT-BR, show the printed English term so it can be matched.
  function en(term) {
    return state.language === "pt-BR" ? ` <span class="ccs-en" lang="en">(${term})</span>` : "";
  }

  function sym(file, alt) {
    return `<img class="ccs-inline-icon" src="${ICONS}${file}.webp" alt="${alt}">`;
  }

  function thumb(file, altEn, altPt) {
    return `<img class="ccs-thumb" src="${ART}${file}.webp" alt="${t(altEn, altPt)}" loading="lazy">`;
  }

  function iconCard(file, titleEn, bodyEn, titlePt, bodyPt, codes) {
    const title = t(titleEn, titlePt);
    return `
      <article class="icon-card">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}.webp" alt="${title}"></span>
        <div><strong>${title}</strong><p>${t(bodyEn, bodyPt)}</p>${refs(codes)}</div>
      </article>`;
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

  function figure(file, altEn, altPt, captionEn, captionPt, code, extraClass = "") {
    return `
      <figure class="ccs-figure ${extraClass}">
        <img src="${ART}${file}.webp" alt="${t(altEn, altPt)}" loading="lazy">
        <figcaption>${t(captionEn, captionPt)} ${referenceLink(code)}</figcaption>
      </figure>`;
  }

  function playersLabel(count = state.players) {
    return t(`${count} players`, `${count} jogadores`);
  }

  function meepleIcon(color) {
    return sym(`meeple-${color.id}`, t(`${color.en} meeple`, `meeple ${color.pt}`));
  }

  function colorList() {
    const base = COLORS.map((color) => `${meepleIcon(color)}${t(color.en, color.pt)}`).join(", ");
    return on("inns") ? `${base}, <span class="ccs-pink-dot" aria-hidden="true"></span>${t("pink", "rosa")}` : base;
  }

  // Shorthand for the expansion names (printed English product names in both languages).
  const NAMES = {
    farmers: ["Fields & farmers", "Campos e camponeses"],
    river: ["The River", "The River (O Rio)"],
    abbot: ["The Abbot", "The Abbot (O Abade)"],
    inns: ["Inns & Cathedrals", "Inns & Cathedrals (Estalagens e Catedrais)"],
    dragon: ["Dragon & Fairy", "Dragon & Fairy (Dragão e Fada)"],
    festival: ["The Festival", "The Festival (O Festival)"],
    drawbridges: ["The Drawbridges", "The Drawbridges (As Pontes Levadiças)"],
    cathedrals: ["German Cathedrals", "German Cathedrals (Catedrais Alemãs)"]
  };

  function optName(key) {
    return t(NAMES[key][0], NAMES[key][1]);
  }

  function activeModules() {
    return OPTIONS.filter((key) => on(key));
  }

  // ---------- tile counts ----------

  function landCount() {
    return BOX.baseLand
      + (on("inns") ? BOX.innsLand : 0)
      + (on("dragon") ? BOX.dragonLand - BOX.dragonRemoved : 0)
      + (on("festival") ? BOX.festival : 0)
      + (on("drawbridges") ? BOX.drawbridges : 0)
      + (on("cathedrals") ? BOX.cathedrals : 0);
  }

  // River stack without the starting (source) tile and, with Dragon & Fairy, without the double lake.
  function riverStackCount() {
    // 12 river tiles minus the source: 11 (10 others + the lake). +1 river tile with an inn.
    return 11 + (on("inns") ? 1 : 0);
  }

  // ---------- header ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["turn", t("Your turn", "Seu turno")],
      ["features", t("Features & scoring", "Construções e pontuação")],
      on("river") ? ["river", t("The River", "O Rio")] : null,
      on("abbot") ? ["abbot", t("The Abbot", "O Abade")] : null,
      on("farmers") ? ["farmers", t("Fields & farmers", "Campos e camponeses")] : null,
      on("inns") ? ["inns", "Inns & Cathedrals"] : null,
      on("dragon") ? ["dragon", "Dragon & Fairy"] : null,
      on("festival") ? ["festival", "The Festival"] : null,
      on("drawbridges") ? ["drawbridges", "The Drawbridges"] : null,
      on("cathedrals") ? ["cathedrals", "German Cathedrals"] : null,
      combinationItems().length ? ["combinations", t("Combining expansions", "Combinando expansões")] : null,
      ["end", t("Game end & final scoring", "Fim e pontuação final")],
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
      `${readFailed ? "This browser could not read the saved Carcassonne match or setup progress; defaults are shown. " : ""}${writeFailed ? "The latest change could not be saved and is visible on screen only." : ""}`,
      `${readFailed ? "Este navegador não conseguiu ler a partida ou o progresso de Carcassonne salvos; as opções padrão estão sendo mostradas. " : ""}${writeFailed ? "A alteração mais recente não pôde ser salva e aparece somente na tela." : ""}`
    ).trim();
  }

  // ---------- configuration ----------

  function choiceCard(name, value, dataAttr, checked, title, description) {
    return `
      <label class="ccs-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" ${dataAttr} ${checked ? "checked" : ""}>
        <span class="ccs-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function group(legend, selected, intro, cards, columns = "") {
    return `
      <fieldset class="ccs-choice-group">
        <legend>${legend} <span>${selected}</span></legend>
        <p class="ccs-choice-intro">${intro}</p>
        <div class="ccs-choice-grid ${columns}">${cards}</div>
      </fieldset>`;
  }

  function playerChoiceText(count) {
    const n = Number(count);
    const unused = (on("inns") ? 6 : 5) - n;
    const base = t(
      `${n} colors in play. Each player: 7 meeple in the supply + 1 on the scoreboard.`,
      `${n} cores em jogo. Cada jogador: 7 meeples na reserva + 1 na trilha de pontuação.`
    );
    const rest = unused
      ? t(`The figures of ${unused} color${unused === 1 ? "" : "s"} stay in the box.`, `As figuras de ${unused} cor${unused === 1 ? "" : "es"} ficam na caixa.`)
      : t("Every color is in use.", "Todas as cores são usadas.");
    const pink = n === 6 ? t(" The 6th color is the pink set from Inns & Cathedrals.", " A 6ª cor é o conjunto rosa de Inns & Cathedrals.") : "";
    return `${base} ${rest}${pink}`;
  }

  function yesNoGroup(key, legend, intro, yesTitle, yesText, noTitle, noText) {
    const selected = on(key) ? t("Yes", "Sim") : t("No", "Não");
    return group(`${legend} ·`, selected, intro, [
      choiceCard(`ccs-${key}`, "yes", `data-option="${key}"`, on(key), yesTitle, yesText),
      choiceCard(`ccs-${key}`, "no", `data-option="${key}"`, !on(key), noTitle, noText)
    ].join(""), "is-pair");
  }

  function matchConfiguration() {
    const counts = PLAYER_COUNTS.filter((count) => count !== "6" || on("inns"));
    return `
      <section class="controls-panel ccs-config" id="build-match" aria-labelledby="ccs-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="ccs-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "Choose how many play, whether you use the farmers, the two mini-expansions printed in the base rulebook (The River, The Abbot) and each expansion you own. Every choice is independent; the setup checklist, the component counts, the rules, the icons and the examples below only show what this match uses. Who takes which color is decided at the table. Everything except the language clears the setup checklist when changed.",
              "Escolham quantos jogam, se usam os camponeses, as duas minis impressas no manual base (The River, The Abbot) e cada expansão que vocês têm. Cada escolha é independente; a lista de preparação, as contagens de componentes, as regras, os ícones e os exemplos abaixo mostram só o que esta partida usa. Quem fica com cada cor é decidido à mesa. Qualquer mudança aqui, exceto o idioma, limpa a lista de preparação."
            )}</p>
          </div>
        </div>
        ${notice ? `<p class="ccs-config-notice" role="status">${notice}</p>` : ""}
        ${group(t("Players · selected:", "Jogadores · selecionado:"), playersLabel(),
          `${t(
            "The base game has figures in 5 colors (8 meeple each). The rulebook prints no player count; the guide offers 2–5, the box's count. Inns & Cathedrals adds a 6th color (pink), so 6 players appears only when it is selected.",
            "O jogo base tem figuras em 5 cores (8 meeples cada). O manual não imprime o número de jogadores; o guia oferece 2–5, o número da caixa. Inns & Cathedrals acrescenta uma 6ª cor (rosa), então 6 jogadores só aparece quando ela está selecionada."
          )} ${referenceLink("c2")} ${referenceLink("i1")}`,
          counts.map((count) => choiceCard("ccs-players", count, `data-players="${count}"`, state.players === count, playersLabel(count), playerChoiceText(count))).join(""), "is-players")}
        <h3 class="ccs-config-subhead">${t("Base game: supplemental rules and mini-expansions", "Jogo base: regras suplementares e minis")}</h3>
        ${yesNoGroup("farmers", optName("farmers"),
          `${t("Supplemental rule for after your first 2–3 games.", "Regra suplementar para depois das 2–3 primeiras partidas.")} ${referenceLink("c6")} ${referenceLink("s1")}`,
          t("Yes — play with farmers", "Sim — jogar com camponeses"),
          t("You may also place a meeple lying down on a field as a farmer. Farmers stay until the end and are scored only in the final scoring: 3 points for each completed city touching their field. More long-term planning; meeple on fields never come back during the game.", "Você também pode deitar um meeple num campo como camponês. Camponeses ficam até o fim e só pontuam na pontuação final: 3 pontos por cidade completa que toca o campo. Mais planejamento de longo prazo; meeples nos campos nunca voltam durante o jogo."),
          t("No — first games", "Não — primeiras partidas"),
          t("The rulebook's recommendation for the first games: no meeple on fields and no field scoring. Fields only separate the other features on the tiles.", "A recomendação do manual para as primeiras partidas: nenhum meeple nos campos e nenhuma pontuação de campo. Os campos só separam as outras construções nas peças.")
        )}
        ${yesNoGroup("river", optName("river"),
          `${t("Mini-expansion in the base box: 12 tiles with a dark back.", "Mini no jogo base: 12 peças com verso escuro.")} ${referenceLink("c2")} ${referenceLink("s2")}`,
          t("Yes — start with the river", "Sim — começar com o rio"),
          t("The river tiles replace the starting tile: the game opens by drawing only river tiles, from the source to the lake, before any normal tile. Meeple may go on river tiles but never on the river itself.", "As peças de rio substituem a peça inicial: o jogo começa comprando só peças de rio, da nascente ao lago, antes de qualquer peça normal. Meeples podem ir em peças de rio, mas nunca no próprio rio."),
          t("No — starting tile", "Não — peça inicial"),
          t("Start from the single starting tile. All river tiles stay in the box (also those of the expansions selected below).", "Comece pela peça inicial única. Todas as peças de rio ficam na caixa (também as das expansões selecionadas abaixo).")
        )}
        ${yesNoGroup("abbot", optName("abbot"),
          `${t("Mini-expansion in the base box: 5 abbots, plus the gardens printed on some tiles.", "Mini no jogo base: 5 abades, mais os jardins impressos em algumas peças.")} ${referenceLink("c2")} ${referenceLink("s2")}`,
          t("Yes — each player gets an abbot", "Sim — cada jogador recebe um abade"),
          t("The abbot goes only on a monastery or a garden (gardens score like monasteries). If you place no figure on your turn, you may take your abbot back and score its monastery or garden immediately, even unfinished.", "O abade só vai num mosteiro ou num jardim (jardins pontuam como mosteiros). Se você não colocar nenhuma figura no turno, pode recolher o abade e pontuar o mosteiro ou jardim dele na hora, mesmo incompleto."),
          t("No — abbots stay in the box", "Não — abades ficam na caixa"),
          t("Return the 5 abbots, as the rulebook suggests for the first game. Gardens are scenery: nobody can be placed on them.", "Devolva os 5 abades, como o manual sugere para a primeira partida. Jardins são decoração: ninguém pode ser colocado neles.")
        )}
        <h3 class="ccs-config-subhead">${t("Expansions and mini-expansions", "Expansões e minis")}</h3>
        ${yesNoGroup("inns", optName("inns"),
          `${t("Expansion 1. Can be combined with other expansions.", "Expansão 1. Pode ser combinada com outras expansões.")} ${referenceLink("i1")}`,
          t("Yes — inns, cathedrals, large meeple", "Sim — estalagens, catedrais, meeple grande"),
          t(`Adds ${BOX.innsTiles} tiles: completed roads with an inn score 2 per tile, completed cities with a cathedral 3 per tile and coat of arms — but both score as usual (1) if unfinished at the end. Each player gets a large meeple that counts as 2 for majorities. Adds the pink figures (a 6th player) and 6 score tiles 50/100.`, `Acrescenta ${BOX.innsTiles} peças: estradas completas com estalagem valem 2 por peça, cidades completas com catedral 3 por peça e brasão — mas as duas pontuam como de costume (1) se inacabadas no fim. Cada jogador recebe um meeple grande que conta como 2 nas maiorias. Acrescenta as figuras rosas (6º jogador) e 6 fichas de pontuação 50/100.`),
          t("No", "Não"),
          t("Its tiles, large meeple, pink figures and score tiles stay in the box. Maximum 5 players.", "As peças, os meeples grandes, as figuras rosas e as fichas de pontuação ficam na caixa. Máximo de 5 jogadores.")
        )}
        ${yesNoGroup("dragon", optName("dragon"),
          `${t("Expansion 3. Can be combined with other expansions; The River is recommended with it.", "Expansão 3. Pode ser combinada com outras expansões; The River é recomendada com ela.")} ${referenceLink("d1")}`,
          t("Yes — dragon, fairy, magic portals", "Sim — dragão, fada, portais mágicos"),
          t(`Adds ${BOX.dragonLand} tiles (6 dragon hoards, 10 dragon symbols, 6 magic portals) and 5 random tiles go back to the box unseen. A neutral dragon eats every meeple on the tiles it crosses; the fairy protects one meeple and is worth 3 points. With The River, a double source and a double lake (with a dragon hoard) replace the source and close the river.`, `Acrescenta ${BOX.dragonLand} peças (6 tesouros do dragão, 10 símbolos de dragão, 6 portais mágicos) e 5 peças aleatórias voltam à caixa sem ser vistas. Um dragão neutro devora todos os meeples das peças por onde passa; a fada protege um meeple e vale 3 pontos. Com The River, uma nascente dupla e um lago duplo (com tesouro do dragão) substituem a nascente e fecham o rio.`),
          t("No", "Não"),
          t("Its tiles, the dragon and the fairy stay in the box.", "As peças, o dragão e a fada ficam na caixa.")
        )}
        ${yesNoGroup("festival", optName("festival"),
          `${t("Mini-expansion for the base game; no official rules for combinations with other expansions.", "Mini para o jogo base; sem regras oficiais para combinações com outras expansões.")} ${referenceLink("f")}`,
          t("Yes — 12 festival tiles", "Sim — 12 peças de festival"),
          t("Adds 12 tiles with the “15” symbol. When you place one and don't place a meeple, you may instead take back any one of your meeple from the landscape (no points).", "Acrescenta 12 peças com o símbolo “15”. Quando você coloca uma delas e não coloca meeple, pode, em vez disso, recolher qualquer um dos seus meeples da paisagem (sem pontos)."),
          t("No", "Não"),
          t("The 12 festival tiles stay in the box.", "As 12 peças de festival ficam na caixa.")
        )}
        ${yesNoGroup("drawbridges", optName("drawbridges"),
          `${t("Mini-expansion for the base game; no official rules for combinations with other expansions.", "Mini para o jogo base; sem regras oficiais para combinações com outras expansões.")} ${referenceLink("b")}`,
          t("Yes — 12 drawbridge tiles", "Sim — 12 peças com ponte levadiça"),
          t("Adds 12 tiles with a drawbridge at each city gate. When a road leading to a drawbridge is completed while that city is still incomplete, the player who alone has the majority on the road may move their meeple from the road into the city.", "Acrescenta 12 peças com uma ponte levadiça em cada portão de cidade. Quando uma estrada que leva a uma ponte levadiça é completada enquanto essa cidade ainda está incompleta, o jogador que tem sozinho a maioria na estrada pode mover os meeples dele da estrada para a cidade."),
          t("No", "Não"),
          t("The 12 drawbridge tiles stay in the box.", "As 12 peças com ponte levadiça ficam na caixa.")
        )}
        ${yesNoGroup("cathedrals", optName("cathedrals"),
          `${t("Mini-expansion for the base game; its booklet answers a few combinations (Inns & Cathedrals, the dragon).", "Mini para o jogo base; o livreto responde algumas combinações (Inns & Cathedrals, o dragão).")} ${referenceLink("g1")} ${referenceLink("g3")}`,
          t("Yes — 6 cathedral tiles", "Sim — 6 peças de catedral"),
          t("Adds 6 tiles, each with a famous German cathedral standing in the fields and 3 or 4 roads starting from it. Completed roads to a cathedral score 2 per tile (highwayman); a meeple on the cathedral (archbishop) scores all its roads once they are all closed.", "Acrescenta 6 peças, cada uma com uma catedral alemã famosa no meio do campo e 3 ou 4 estradas saindo dela. Estradas completas até uma catedral valem 2 por peça (salteador); um meeple na catedral (arcebispo) pontua todas as estradas dela quando todas estiverem fechadas."),
          t("No", "Não"),
          t("The 6 cathedral tiles stay in the box.", "As 6 peças de catedral ficam na caixa.")
        )}
        <p class="ccs-config-summary"><strong>${t("This match:", "Esta partida:")}</strong> ${playersLabel()} · ${activeModules().length ? activeModules().map(optName).join(" · ") : t("base game only, no farmers", "só o jogo base, sem camponeses")} · ${t(`${landCount()} land tiles in the stacks`, `${landCount()} peças de terreno nas pilhas`)}</p>
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function markerIcon(key) {
    return {
      inns: sym("inns-cathedrals-marker", t("Inns & Cathedrals tile marker", "Marca das peças de Inns & Cathedrals")),
      dragon: sym("dragon-fairy-marker", t("Dragon & Fairy tile marker", "Marca das peças de Dragon & Fairy")),
      festival: sym("festival-15", t("Festival 15 symbol", "Símbolo 15 do Festival")),
      drawbridges: sym("drawbridge", t("Drawbridge", "Ponte levadiça")),
      cathedrals: sym("german-cathedrals-symbol", t("German Cathedrals symbol", "Símbolo de German Cathedrals"))
    }[key];
  }

  function expansionContents(key) {
    return {
      inns: `${thumb("inns-cathedrals-cathedral-tile", "Cathedral tile", "Peça de catedral")}${thumb("inns-cathedrals-inn-tile", "Inn tile", "Peça de estalagem")}${thumb("inns-cathedrals-river-tile", "River tile with an inn", "Peça de rio com estalagem")}${thumb("large-meeples", "The 6 large meeple", "Os 6 meeples grandes")}${thumb("pink-figures", "8 pink meeple and the pink abbot", "8 meeples rosas e o abade rosa")} ` + t(`<strong>Inns & Cathedrals:</strong> ${BOX.innsTiles} tiles marked with ${markerIcon("inns")}, 6 large meeple (one per color), 8 pink meeple and 1 pink abbot, 6 score tiles 50/100.`, `<strong>Inns & Cathedrals:</strong> ${BOX.innsTiles} peças marcadas com ${markerIcon("inns")}, 6 meeples grandes (um por cor), 8 meeples rosas e 1 abade rosa, 6 fichas de pontuação 50/100.`),
      dragon: `${thumb("dragon-hoard-tile", "Dragon-hoard tile", "Peça de tesouro do dragão")}${thumb("dragon-symbol-tile", "Dragon-symbol tile", "Peça com símbolo de dragão")}${thumb("magic-portal-tile", "Magic-portal tile", "Peça com portal mágico")} ` + t(`<strong>Dragon & Fairy:</strong> ${BOX.dragonLand} land tiles marked with ${markerIcon("dragon")}, the double source tile, the double lake tile (two-sided), the dragon and the fairy.`, `<strong>Dragon & Fairy:</strong> ${BOX.dragonLand} peças de terreno marcadas com ${markerIcon("dragon")}, a peça de nascente dupla, a peça de lago duplo (dupla face), o dragão e a fada.`),
      festival: `${thumb("festival-tiles", "The festival tiles", "As peças de festival")} ` + t(`<strong>The Festival:</strong> ${BOX.festival} tiles with the “15” symbol ${markerIcon("festival")}.`, `<strong>The Festival:</strong> ${BOX.festival} peças com o símbolo “15” ${markerIcon("festival")}.`),
      drawbridges: `${thumb("drawbridges-tiles", "Drawbridge tiles", "Peças com ponte levadiça")} ` + t(`<strong>The Drawbridges:</strong> ${BOX.drawbridges} tiles with a drawbridge ${markerIcon("drawbridges")} at each city gate.`, `<strong>The Drawbridges:</strong> ${BOX.drawbridges} peças com uma ponte levadiça ${markerIcon("drawbridges")} em cada portão de cidade.`),
      cathedrals: `${thumb("german-cathedrals-tiles", "The six German cathedral tiles", "As seis peças de catedral alemã")} ` + t(`<strong>German Cathedrals:</strong> ${BOX.cathedrals} tiles, each showing a German cathedral with 3 or 4 roads.`, `<strong>German Cathedrals:</strong> ${BOX.cathedrals} peças, cada uma com uma catedral alemã e 3 ou 4 estradas.`)
    }[key];
  }

  function unusedTileHints() {
    const hints = {
      inns: t(`Inns & Cathedrals tiles (marked ${markerIcon("inns")})`, `peças de Inns & Cathedrals (marca ${markerIcon("inns")})`),
      dragon: t(`Dragon & Fairy tiles (marked ${markerIcon("dragon")}), double source and double lake`, `peças de Dragon & Fairy (marca ${markerIcon("dragon")}), nascente dupla e lago duplo`),
      festival: t(`Festival tiles (“15” symbol ${markerIcon("festival")})`, `peças do Festival (símbolo “15” ${markerIcon("festival")})`),
      drawbridges: t("Drawbridges tiles (a drawbridge at every city gate)", "peças de The Drawbridges (ponte levadiça em cada portão de cidade)"),
      cathedrals: t("German Cathedrals tiles (a German cathedral in the middle)", "peças de German Cathedrals (uma catedral alemã no meio)")
    };
    return ["inns", "dragon", "festival", "drawbridges", "cathedrals"].filter((key) => !on(key)).map((key) => hints[key]);
  }

  function setupPhases() {
    const n = players();
    const colorsInBox = (on("inns") ? 6 : 5) - n;
    const phases = [];
    const hints = unusedTileHints();

    phases.push({
      id: "gather",
      title: t("Gather this match's components", "Reúna os componentes desta partida"),
      refs: ["c2", "i1", "d1", "f", "b", "g1"].filter((code) => code[0] === "c" || ({ i: on("inns"), d: on("dragon"), f: on("festival"), b: on("drawbridges"), g: on("cathedrals") })[code[0]]),
      items: [
        `${thumb("city-tile", "City tile", "Peça de cidade")}${thumb("road-tile", "Road tile", "Peça de estrada")}${thumb("monastery-tile", "Monastery tile", "Peça de mosteiro")} ` + t(`<strong>Base game:</strong> ${BOX.tiles} tiles — the starting tile and the ${BOX.river} river tiles have a dark back, the other ${BOX.baseLand} a normal back — 40 meeple (8 each in black, red, green, blue and yellow), 5 abbots and the scoreboard.`, `<strong>Jogo base:</strong> ${BOX.tiles} peças — a peça inicial e as ${BOX.river} peças de rio têm verso escuro, as outras ${BOX.baseLand} verso normal — 40 meeples (8 de cada em preto, vermelho, verde, azul e amarelo), 5 abades e o tabuleiro de pontuação.`),
        ...["inns", "dragon", "festival", "drawbridges", "cathedrals"].filter(on).map(expansionContents),
        hints.length ? `${t("If your box also holds tiles of expansions not used in this match, take them out and keep them in the box:", "Se a sua caixa também tem peças de expansões que não entram nesta partida, tire-as e deixe-as na caixa:")} ${hints.join("; ")}.` : "",
        !on("cathedrals") ? interpretation("the German Cathedrals booklet does not mention a tile marker; recognize those tiles by their cathedral picture.", "o livreto de German Cathedrals não menciona marca nas peças; reconheça essas peças pela imagem da catedral.") : ""
      ]
    });

    phases.push({
      id: "board",
      title: t("Scoreboard", "Tabuleiro de pontuação"),
      refs: on("inns") ? ["c2", "c6", "i1"] : ["c2", "c6"],
      items: [
        t("Place the scoreboard near the play area.", "Coloque o tabuleiro de pontuação perto da área de jogo."),
        on("inns")
          ? t("Lay aside the 6 score tiles 50/100 within reach. When you reach or pass 50 points, take one and place it in front of you, 50 side up; your scoring meeple keeps going round the track.", "Deixe separadas as 6 fichas de pontuação 50/100 ao alcance de todos. Ao alcançar ou passar 50 pontos, pegue uma e coloque-a à sua frente, lado 50 para cima; seu meeple marcador continua dando a volta na trilha.")
          : t("No score tiles: when your scoring meeple reaches or passes 50/0, lay it down (or note it) — a lying scorer means “50 + the space it is on”.", "Sem fichas de pontuação: quando seu meeple de pontuação alcançar ou passar 50/0, deite-o (ou anote) — um marcador deitado significa “50 + a casa em que está”."),
        on("inns") ? "" : interpretation("a lying scorer only shows one lap: note every further pass of 50/0 on paper (100, 150…).", "um marcador deitado só mostra uma volta: anote no papel cada nova passagem por 50/0 (100, 150…)."),
        on("inns") ? interpretation("at 100 points flip your tile to its 100 side; there is one tile per player, so note any lap beyond that on paper.", "aos 100 pontos vire sua ficha para o lado 100; há uma ficha por jogador, então anote no papel qualquer volta além disso.") : ""
      ]
    });

    phases.push({
      id: "colors",
      title: t("Colors and figures", "Cores e figuras"),
      refs: on("inns") ? ["c2", "s2", "i1"] : on("abbot") ? ["c2", "s2"] : ["c2"],
      items: [
        `${t(`Each of the ${n} players chooses a color:`, `Cada um dos ${n} jogadores escolhe uma cor:`)} ${colorList()}.`,
        t("Take 7 meeple of your color: this is your supply, in front of you.", "Pegue 7 meeples da sua cor: esta é a sua reserva, à sua frente."),
        t("Place your 8th meeple on the “0” space of the scoreboard: it is your scoring meeple and never enters the landscape.", "Coloque o seu 8º meeple na casa “0” do tabuleiro de pontuação: ele é o seu marcador de pontos e nunca entra na paisagem."),
        on("abbot") ? `${thumb("abbots", "The five abbots", "Os cinco abades")} ${t("The Abbot: also take the abbot of your color into your supply.", "The Abbot: pegue também o abade da sua cor para a sua reserva.")}` : "",
        on("inns") ? t("Inns & Cathedrals: also take the large meeple of your color into your supply.", "Inns & Cathedrals: pegue também o meeple grande da sua cor para a sua reserva.") : "",
        colorsInBox
          ? t(`Return all figures of the ${colorsInBox} unused color${colorsInBox === 1 ? "" : "s"} to the box: their 8 meeple${on("abbot") ? ", abbot" : ""}${on("inns") ? ", large meeple" : ""}.`, `Devolva à caixa todas as figuras da${colorsInBox === 1 ? "" : "s"} ${colorsInBox} cor${colorsInBox === 1 ? "" : "es"} não usada${colorsInBox === 1 ? "" : "s"}: os 8 meeples${on("abbot") ? ", o abade" : ""}${on("inns") ? ", o meeple grande" : ""}.`)
          : t("Every color is in use.", "Todas as cores estão em uso."),
        on("abbot") ? "" : t(`Return all ${on("inns") ? 6 : 5} abbots to the box (The Abbot is not used).`, `Devolva todos os ${on("inns") ? 6 : 5} abades à caixa (The Abbot não é usada).`)
      ]
    });

    if (!on("river")) {
      phases.push({
        id: "start",
        title: t("Starting tile", "Peça inicial"),
        refs: on("dragon") ? ["c2", "d1"] : ["c2"],
        items: [
          `${thumb("starting-tile", "Starting tile", "Peça inicial")} ${t("Find the starting tile (dark back; a city edge above a road) and place it face up in the middle of the table.", "Encontre a peça inicial (verso escuro; borda de cidade acima de uma estrada) e coloque-a virada para cima no meio da mesa.")}`,
          `${thumb("back-dark", "Dark tile back", "Verso escuro de peça")}${thumb("river-tile", "A river tile", "Uma peça de rio")} ${t(`Return the ${BOX.river} river tiles (the other dark-backed tiles) to the box.`, `Devolva as ${BOX.river} peças de rio (as outras peças de verso escuro) à caixa.`)}`,
          on("dragon") ? t("Dragon & Fairy without The River: also return its double source and double lake tiles to the box.", "Dragon & Fairy sem The River: devolva também as peças de nascente dupla e de lago duplo à caixa.") : "",
          on("inns") ? `${t("Inns & Cathedrals: also return its river tile with an inn to the box.", "Inns & Cathedrals: devolva também a peça de rio com estalagem à caixa.")} ${interpretation("the booklet only says how to use it with The River; a river tile cannot continue a landscape without a river.", "o livreto só diz como usá-la com The River; uma peça de rio não continua uma paisagem sem rio.")}` : ""
        ]
      });
    } else if (!on("dragon")) {
      phases.push({
        id: "river",
        title: t("River stack and source", "Pilha do rio e nascente"),
        refs: on("inns") ? ["s2", "i1"] : ["s2"],
        items: [
          `${thumb("back-dark", "Dark tile back", "Verso escuro de peça")}${thumb("river-tile", "A river tile", "Uma peça de rio")} ${t("Take the 12 dark-backed river tiles. Return the normal starting tile (also dark-backed) to the box: the river replaces it.", "Pegue as 12 peças de rio de verso escuro. Devolva a peça inicial normal (também de verso escuro) à caixa: o rio a substitui.")}`,
          `${thumb("river-example", "The River: source at the top, lake at the bottom", "The River: nascente em cima, lago embaixo")} ${t("Set aside the source tile (where the river springs) and the lake tile (where it ends).", "Separe a peça da nascente (onde o rio nasce) e a peça do lago (onde ele termina).")}`,
          on("inns") ? t("Inns & Cathedrals: add its river tile with an inn to the other river tiles (it is shuffled face down with them).", "Inns & Cathedrals: junte a peça de rio com estalagem às outras peças de rio (ela é embaralhada virada para baixo com elas).") : "",
          t(`Shuffle the other ${riverStackCount() - 1} river tiles and stack them face down; then put the lake tile face down at the bottom of this river stack (${riverStackCount()} tiles).`, `Embaralhe as outras ${riverStackCount() - 1} peças de rio e empilhe-as viradas para baixo; depois ponha a peça do lago virada para baixo no fundo desta pilha do rio (${riverStackCount()} peças).`),
          t("Place the source tile face up in the middle of the table: it is the starting tile.", "Coloque a nascente virada para cima no meio da mesa: ela é a peça inicial.")
        ]
      });
    } else {
      phases.push({
        id: "river",
        title: t("River stack and double source", "Pilha do rio e nascente dupla"),
        refs: on("inns") ? ["s2", "d1", "d2", "i1"] : ["s2", "d1", "d2"],
        items: [
          t("Return the normal starting tile and The River's source tile to the box.", "Devolva à caixa a peça inicial normal e a nascente de The River."),
          `${thumb("double-source", "Double source tile", "Peça de nascente dupla")} ${t("Place the double source tile face up in the middle of the table: it is the starting tile. It counts as 2 adjacent tiles and has two open river ends.", "Coloque a peça de nascente dupla virada para cima no meio da mesa: ela é a peça inicial. Ela conta como 2 peças adjacentes e tem duas pontas de rio abertas.")}`,
          `${thumb("double-lake", "Double lake tile", "Peça de lago duplo")} ${t("Lay aside the double lake tile (two-sided, with a dragon hoard). It will be the last river tile placed.", "Separe a peça de lago duplo (dupla face, com um tesouro do dragão). Ela será a última peça de rio colocada.")}`,
          on("inns") ? t("Inns & Cathedrals: add its river tile with an inn to the river tiles (it is shuffled face down with them).", "Inns & Cathedrals: junte a peça de rio com estalagem às peças de rio (ela é embaralhada virada para baixo com elas).") : "",
          t(`Shuffle the remaining ${riverStackCount()} river tiles — including The River's lake tile — face down: this is the river stack.`, `Embaralhe as ${riverStackCount()} peças de rio restantes — incluindo o lago de The River — viradas para baixo: esta é a pilha do rio.`),
          interpretation("keep the double lake face up next to the river stack; the player whose turn comes when the stack is empty takes it as their tile instead of drawing.", "deixe o lago duplo virado para cima ao lado da pilha do rio; o jogador cujo turno chega quando a pilha acaba usa-o como a sua peça em vez de comprar.")
        ]
      });
    }

    const breakdown = [
      t(`${BOX.baseLand} base tiles with a normal back`, `${BOX.baseLand} peças base de verso normal`),
      on("inns") ? t(`${BOX.innsLand} Inns & Cathedrals tiles (its ${BOX.innsTiles} minus the river tile)`, `${BOX.innsLand} peças de Inns & Cathedrals (as ${BOX.innsTiles} menos a peça de rio)`) : "",
      on("dragon") ? t(`${BOX.dragonLand} Dragon & Fairy land tiles`, `${BOX.dragonLand} peças de terreno de Dragon & Fairy`) : "",
      on("festival") ? t(`${BOX.festival} Festival tiles`, `${BOX.festival} peças do Festival`) : "",
      on("drawbridges") ? t(`${BOX.drawbridges} Drawbridges tiles`, `${BOX.drawbridges} peças de The Drawbridges`) : "",
      on("cathedrals") ? t(`${BOX.cathedrals} German Cathedrals tiles`, `${BOX.cathedrals} peças de German Cathedrals`) : ""
    ].filter(Boolean);
    const shuffled = landCount() + (on("dragon") ? BOX.dragonRemoved : 0);
    phases.push({
      id: "land",
      title: t("Land tile stacks", "Pilhas de peças de terreno"),
      refs: ["c2", on("inns") ? "i1" : "", on("dragon") ? "d1" : "", on("festival") ? "f" : "", on("drawbridges") ? "b" : "", on("cathedrals") ? "g1" : ""].filter(Boolean),
      items: [
        `${thumb("back-normal", "Normal tile back", "Verso normal de peça")} ${t(`Take the land tiles: ${breakdown.join(" + ")} = ${shuffled} tiles.`, `Pegue as peças de terreno: ${breakdown.join(" + ")} = ${shuffled} peças.`)}`,
        t("Shuffle them all together face down.", "Embaralhe todas juntas viradas para baixo."),
        on("dragon") ? t(`Dragon & Fairy: return ${BOX.dragonRemoved} random tiles face down to the box without looking at them: ${landCount()} tiles remain.`, `Dragon & Fairy: devolva ${BOX.dragonRemoved} peças aleatórias viradas para baixo à caixa, sem olhá-las: restam ${landCount()} peças.`) : "",
        t("Split them into several face-down stacks within easy reach of all players.", "Divida-as em várias pilhas viradas para baixo, ao alcance de todos."),
        interpretation(`${BOX.baseLand} is the rulebook's ${BOX.tiles} tiles minus the starting tile and the ${BOX.river} river tiles; the expansion counts are printed in each booklet.`, `${BOX.baseLand} são as ${BOX.tiles} peças do manual menos a peça inicial e as ${BOX.river} peças de rio; as contagens das expansões estão impressas em cada livreto.`)
      ]
    });

    if (on("dragon")) {
      phases.push({
        id: "dragon",
        title: t("Dragon and fairy", "Dragão e fada"),
        refs: ["d1"],
        items: [
          t("Place the dragon and the fairy next to the play area, not on a tile.", "Coloque o dragão e a fada ao lado da área de jogo, fora das peças."),
          on("river")
            ? t("The dragon enters the landscape on the dragon hoard of the double lake, the tile that ends the river (the river is built before any land tile with a hoard can be drawn).", "O dragão entra na paisagem no tesouro do dragão do lago duplo, a peça que termina o rio (o rio é construído antes que qualquer peça de terreno com tesouro possa ser comprada).")
            : t("The dragon enters the landscape when the first dragon-hoard tile is placed.", "O dragão entra na paisagem quando a primeira peça de tesouro do dragão é colocada."),
          t("The fairy enters play only when a player earns it (see Dragon & Fairy).", "A fada só entra em jogo quando um jogador a conquista (veja Dragon & Fairy).")
        ]
      });
    }

    phases.push({
      id: "first",
      title: t("First player", "Primeiro jogador"),
      refs: on("river") ? ["c3", "s2"] : ["c3"],
      items: [
        t("The youngest player starts. Play goes clockwise.", "O jogador mais jovem começa. O jogo segue em sentido horário."),
        on("river") ? t("Until the river stack is used up, everyone draws from it instead of the land stacks.", "Até a pilha do rio acabar, todos compram dela em vez das pilhas de terreno.") : ""
      ]
    });
    return phases;
  }

  function inventory() {
    const n = players();
    const colorsInBox = (on("inns") ? 6 : 5) - n;
    const box = [
      colorsInBox ? t(`Figures of ${colorsInBox} unused color${colorsInBox === 1 ? "" : "s"}.`, `Figuras de ${colorsInBox} cor${colorsInBox === 1 ? "" : "es"} não usada${colorsInBox === 1 ? "" : "s"}.`) : "",
      on("abbot") ? "" : t("All abbots.", "Todos os abades."),
      on("river") ? t(on("dragon") ? "The starting tile and The River's source." : "The starting tile.", on("dragon") ? "A peça inicial e a nascente de The River." : "A peça inicial.") : t(`All river tiles (${BOX.river}${on("inns") ? " + the Inns & Cathedrals river tile" : ""}${on("dragon") ? " + double source and double lake" : ""}).`, `Todas as peças de rio (${BOX.river}${on("inns") ? " + a peça de rio de Inns & Cathedrals" : ""}${on("dragon") ? " + nascente dupla e lago duplo" : ""}).`),
      on("dragon") ? t(`${BOX.dragonRemoved} random land tiles, unseen.`, `${BOX.dragonRemoved} peças de terreno aleatórias, sem olhar.`) : "",
      ...["inns", "dragon", "festival", "drawbridges", "cathedrals"].filter((key) => !on(key)).map((key) => t(`Everything from ${NAMES[key][0]}.`, `Tudo de ${NAMES[key][0]}.`))
    ];
    const cards = [
      infoCard(t(`PER PLAYER · ×${n}`, `POR JOGADOR · ×${n}`), t("In front of each player", "À frente de cada jogador"), [
        `${thumb("meeples", "Meeple in the five base colors", "Meeples nas cinco cores base")} ${t("7 meeple in your supply.", "7 meeples na sua reserva.")}`,
        t("1 scoring meeple on the “0” space of the scoreboard.", "1 meeple marcador na casa “0” do tabuleiro de pontuação."),
        on("abbot") ? `${sym("abbot-red", t("Abbot", "Abade"))} ${t("1 abbot in your supply.", "1 abade na sua reserva.")}` : "",
        on("inns") ? `${sym("large-meeple", t("Large meeple", "Meeple grande"))} ${t("1 large meeple in your supply.", "1 meeple grande na sua reserva.")}` : ""
      ], on("inns") ? ["c2", "i1"] : ["c2"]),
      infoCard(t("TABLE", "MESA"), t("Shared components", "Componentes compartilhados"), [
        t("The scoreboard, near the play area.", "O tabuleiro de pontuação, perto da área de jogo."),
        !on("river") ? `${thumb("starting-tile", "Starting tile", "Peça inicial")} ${t("The starting tile, in the middle.", "A peça inicial, no meio.")}` : "",
        on("river") && !on("dragon") ? t(`The source in the middle; river stack of ${riverStackCount()} face down, lake at the bottom.`, `A nascente no meio; pilha do rio com ${riverStackCount()} peças viradas para baixo, lago no fundo.`) : "",
        on("river") && on("dragon") ? t(`The double source in the middle; river stack of ${riverStackCount()} face down; the double lake beside it.`, `A nascente dupla no meio; pilha do rio com ${riverStackCount()} peças viradas para baixo; o lago duplo ao lado.`) : "",
        `${thumb("back-normal", "Normal tile back", "Verso normal de peça")} ${t(`${landCount()} land tiles in several face-down stacks.`, `${landCount()} peças de terreno em várias pilhas viradas para baixo.`)}`,
        on("inns") ? `${thumb("score-tiles", "Score tiles 50/100", "Fichas de pontuação 50/100")} ${t("6 score tiles 50/100.", "6 fichas de pontuação 50/100.")}` : "",
        on("dragon") ? `${sym("dragon", t("Dragon", "Dragão"))}${sym("fairy", t("Fairy", "Fada"))} ${t("Dragon and fairy next to the play area.", "Dragão e fada ao lado da área de jogo.")}` : ""
      ], ["c2"]),
      infoCard(t("BACK IN THE BOX", "DE VOLTA À CAIXA"), t("Not used in this match", "Não usado nesta partida"), box.filter(Boolean).length ? box : [t("Nothing.", "Nada.")], ["c2"])
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
          <div class="setup-phase-references">${uniqueRefs(phase.refs).map(referenceLink).join("")}</div>
        </header>
        <label class="ccs-setup-check" for="ccs-setup-${phase.id}">
          <input id="ccs-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="ccs-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="ccs-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), ["c2", "c3"])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Set up this match", "Prepare esta partida")} · ${playersLabel()}</h3>
            <p>${t("One checkbox per coherent step; tick it when all its substeps are done.", "Uma caixa de seleção por etapa; marque-a quando todos os subpassos estiverem feitos.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved separately from the match configuration and the language. Changing the player count or any option clears this checklist; changing the language does not. “Uncheck all” clears only these setup boxes.",
          "O progresso é salvo separadamente da configuração da partida e do idioma. Trocar o número de jogadores ou qualquer opção limpa esta lista; trocar o idioma não. “Desmarcar tudo” limpa somente as caixas da preparação."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}`;
  }

  // ---------- quick reference ----------

  function scoreTableRows() {
    // [feature, completed during the game, unfinished at the end, refs]
    return [
      [t("Road", "Estrada"), t("1 per tile", "1 por peça"), t("1 per tile", "1 por peça"), ["c3", "c6"]],
      on("inns") ? [t("Road with an inn", "Estrada com estalagem"), t("2 per tile", "2 por peça"), on("cathedrals") ? t("1 per tile (0 if it leads to a German cathedral)", "1 por peça (0 se levar a uma catedral alemã)") : t("1 per tile", "1 por peça"), on("cathedrals") ? ["i2", "i4", "g3"] : ["i2", "i4"]] : null,
      on("cathedrals") ? [t("Road leading to a German cathedral (highwayman)", "Estrada até uma catedral alemã (salteador)"), on("inns") ? t("2 per tile · 3 with an inn", "2 por peça · 3 com estalagem") : t("2 per tile", "2 por peça"), on("inns") ? t("1 per tile · 0 with an inn", "1 por peça · 0 com estalagem") : t("1 per tile", "1 por peça"), ["g2", "g3"]] : null,
      [t("City", "Cidade"), t("2 per tile + 2 per shield", "2 por peça + 2 por brasão"), t("1 per tile + 1 per shield", "1 por peça + 1 por brasão"), ["c4", "c6"]],
      on("inns") ? [t("City with a cathedral", "Cidade com catedral"), t("3 per tile + 3 per coat of arms", "3 por peça + 3 por brasão"), t("1 per tile + 1 per coat of arms", "1 por peça + 1 por brasão"), ["i2", "i4"]] : null,
      [t("Monastery", "Mosteiro"), t("9 (itself + 8 around)", "9 (ele + 8 em volta)"), t("1 + 1 per surrounding tile", "1 + 1 por peça em volta"), ["c4", "c6"]],
      on("abbot") ? [t("Garden (abbot only)", "Jardim (só abade)"), t("9 (itself + 8 around)", "9 (ele + 8 em volta)"), t("1 + 1 per surrounding tile", "1 + 1 por peça em volta"), ["s2"]] : null,
      on("cathedrals") ? [t("German cathedral (archbishop)", "Catedral alemã (arcebispo)"), on("inns") ? t("when all its roads are closed: 1 per road tile of all its roads (2 on roads with an inn)", "quando todas as estradas estiverem fechadas: 1 por peça de estrada de todas elas (2 nas estradas com estalagem)") : t("when all its roads are closed: 1 per road tile of all its roads", "quando todas as estradas estiverem fechadas: 1 por peça de estrada de todas elas"), on("inns") ? t("1 per road tile leading to it · unfinished roads with an inn: 0", "1 por peça de estrada que leva a ela · estradas inacabadas com estalagem: 0") : t("1 per road tile leading to it", "1 por peça de estrada que leva a ela"), ["g2", "g3"]] : null,
      on("farmers") ? [t("Field (farmers)", "Campo (camponeses)"), t("never scored during the game", "nunca pontua durante o jogo"), t("3 per completed city touching it", "3 por cidade completa que o toca"), ["c6", "s1"]] : null,
      on("dragon") ? [t("Fairy bonus", "Bônus da fada"), t("+3 when the feature of the meeple with the fairy is scored", "+3 quando a construção do meeple com a fada é pontuada"), t("+3", "+3"), ["d6"]] : null
    ].filter(Boolean);
  }

  function scoreTable() {
    return `
      <div class="ccs-table-wrap">
        <table class="ccs-score-table">
          <thead><tr><th scope="col">${t("Feature", "Construção")}</th><th scope="col">${t("Completed (during the game)", "Completa (durante o jogo)")}</th><th scope="col">${t("Unfinished (final scoring)", "Inacabada (pontuação final)")}</th></tr></thead>
          <tbody>${scoreTableRows().map(([name, done, end, codes]) => `<tr><th scope="row">${name}<span class="ccs-table-refs">${refs(codes)}</span></th><td>${done}</td><td>${end}</td></tr>`).join("")}</tbody>
        </table>
      </div>`;
  }

  function quickReference() {
    const cards = [
      infoCard(t("YOUR TURN", "SEU TURNO"), t("Three steps, in this order", "Três passos, nesta ordem"), [
        on("dragon") ? rl("Dragon in front of you?", "first put it on a dragon hoard of your choice and orient it.", "Dragão à sua frente?", "primeiro ponha-o num tesouro do dragão à sua escolha e oriente-o.") : "",
        rl("1 · Place a land tile", `draw exactly 1 tile${on("river") ? " (from the river stack while it lasts)" : ""} and place it face up so it continues the landscape.`, "1 · Colocar uma peça", `compre exatamente 1 peça${on("river") ? " (da pilha do rio enquanto ela durar)" : ""} e coloque-a virada para cima continuando a paisagem.`),
        on("dragon") ? rl("Dragon symbol on your tile", "if the dragon stands on a tile, it moves twice before you place the tile.", "Símbolo de dragão na sua peça", "se o dragão estiver numa peça, ele se move duas vezes antes de você colocar a peça.") : "",
        rl("2 · Place a meeple (optional)", "at most 1 figure from your supply, on the tile you just placed.", "2 · Colocar um meeple (opcional)", "no máximo 1 figura da sua reserva, na peça que você acabou de colocar."),
        on("abbot") ? rl("…or recall your abbot", "if you placed no figure, you may take your abbot back and score its monastery or garden now.", "…ou recolha o abade", "se não colocou nenhuma figura, pode recolher o abade e pontuar o mosteiro ou jardim dele agora.") : "",
        on("festival") ? rl("…or (festival tile) take a meeple back", "if you placed no figure on your festival tile, you may return any one of your meeple from the landscape to your supply.", "…ou (peça de festival) recolha um meeple", "se não colocou nenhuma figura na sua peça de festival, pode devolver à reserva qualquer um dos seus meeples da paisagem.") : "",
        rl("3 · Score points", "score every feature your tile completed and return those meeple to their owners.", "3 · Pontuar", "pontue cada construção que sua peça completou e devolva esses meeples aos donos."),
        on("dragon") ? rl("Fairy", "after scoring, if you completed a road or city that scored you nothing, you may assign the fairy to one of your meeple.", "Fada", "depois de pontuar, se você completou uma estrada ou cidade que não lhe deu pontos, pode atribuir a fada a um dos seus meeples.") : "",
        rl("Next", "the player to your left (clockwise).", "Próximo", "o jogador à sua esquerda (sentido horário).")
      ], ["c3", "c5", on("abbot") ? "s2" : "", on("dragon") ? "d4" : "", on("dragon") ? "d6" : "", on("festival") ? "f" : ""].filter(Boolean), "ccs-step-card"),
      infoCard(t("1 · PLACE A TILE", "1 · COLOCAR UMA PEÇA"), t("Continue the landscape", "Continue a paisagem"), [
        rl("Touch", "place it next to a tile already in play, edge to edge.", "Encostar", "coloque-a ao lado de uma peça já em jogo, lado a lado."),
        rl("Match", "every edge it touches must continue: road to road, city to city, field to field. An incomplete city can only be continued by a city edge.", "Combinar", "cada lado que ela toca precisa continuar: estrada com estrada, cidade com cidade, campo com campo. Uma cidade incompleta só pode ser continuada por um lado de cidade."),
        rl("No legal spot", "return the tile to the box and draw a new one.", "Sem lugar válido", "devolva a peça à caixa e compre outra."),
        on("river") ? rl("River first", "river tiles must extend the river itself; a bend may not turn the same way as the previous bend.", "Rio primeiro", "peças de rio precisam prolongar o próprio rio; uma curva não pode virar para o mesmo lado que a curva anterior.") : ""
      ], ["c3", "c4", "c5", on("river") ? "s2" : ""].filter(Boolean), "ccs-step-1"),
      infoCard(t("2 · PLACE A MEEPLE", "2 · COLOCAR UM MEEPLE"), t("One figure, one free feature", "Uma figura, uma construção livre"), [
        rl("Where", `only on the tile you just placed${on("dragon") ? " (magic portal: anywhere)" : ""}.`, "Onde", `só na peça que você acabou de colocar${on("dragon") ? " (portal mágico: em qualquer lugar)" : ""}.`),
        rl("Free", "the whole connected feature must have no meeple anywhere — not just this tile.", "Livre", "a construção inteira, com tudo o que está conectado, não pode ter meeple em lugar nenhum — não só nesta peça."),
        rl("Roles", `traveler on a road, knight in a city, monk on a monastery${on("farmers") ? ", farmer lying on a field" : ""}.`, "Papéis", `viajante na estrada, cavaleiro na cidade, monge no mosteiro${on("farmers") ? ", camponês deitado no campo" : ""}.`),
        on("abbot") ? rl("Abbot", "only on a monastery or a garden; a normal meeple can't go on a garden.", "Abade", "só num mosteiro ou num jardim; um meeple normal não pode ir num jardim.") : "",
        on("inns") ? rl("Large meeple", `instead of a normal one, as traveler, knight, monk${on("farmers") ? " or farmer" : ""}; counts as 2.`, "Meeple grande", `no lugar de um normal, como viajante, cavaleiro, monge${on("farmers") ? " ou camponês" : ""}; conta como 2.`) : "",
        on("cathedrals") ? rl("Archbishop", "a meeple on the cathedral of a German cathedral tile.", "Arcebispo", "um meeple na catedral de uma peça de catedral alemã.") : "",
        on("dragon") ? rl("Dragon-hoard tile", "move the dragon onto it and orient it; no meeple may go on that tile.", "Peça de tesouro do dragão", "mova o dragão para ela e oriente-o; nenhum meeple pode ir nessa peça.") : "",
        rl("Sneak in", "place on a separate segment now and connect it later: that is how features get several meeple.", "Infiltrar", "coloque num trecho separado agora e conecte depois: é assim que construções ganham vários meeples.")
      ], ["c3", "c5", on("farmers") ? "s1" : "", on("abbot") ? "s2" : "", on("inns") ? "i3" : "", on("cathedrals") ? "g1" : "", on("dragon") ? "d3" : "", on("dragon") ? "d7" : ""].filter(Boolean), "ccs-step-2"),
      infoCard(t("3 · SCORE", "3 · PONTUAR"), t("Who scores a completed feature", "Quem pontua uma construção completa"), [
        rl("When", "a feature scores the moment it is completed, whoever placed the completing tile.", "Quando", "uma construção pontua no momento em que é completada, não importa quem colocou a peça que a completou."),
        rl("Majority", `the player with the most meeple in it scores the full points; the others score nothing${on("inns") ? " (large meeple = 2)" : ""}.`, "Maioria", `quem tem mais meeples nela recebe os pontos inteiros; os outros não recebem nada${on("inns") ? " (meeple grande = 2)" : ""}.`),
        rl("Tie", "every tied player scores the full points.", "Empate", "todos os empatados recebem os pontos inteiros."),
        rl("Return", `all meeple of the scored feature go back to their owners' supplies${on("farmers") ? "; farmers stay until the end" : ""}.`, "Devolver", `todos os meeples da construção pontuada voltam às reservas dos donos${on("farmers") ? "; camponeses ficam até o fim" : ""}.`),
        rl("Track", "move your scoring meeple 1 space per point.", "Trilha", "avance seu meeple marcador 1 casa por ponto."),
        on("drawbridges") ? rl("Drawbridge", "after a road to an incomplete drawbridge city scores, the road's sole majority holder may move their meeple from the road into that city.", "Ponte levadiça", "depois que uma estrada até uma cidade incompleta com ponte levadiça pontua, quem tem sozinho a maioria na estrada pode mover os meeples dele da estrada para essa cidade.") : ""
      ], ["c3", "c5", on("inns") ? "i3" : "", on("drawbridges") ? "b" : ""].filter(Boolean), "ccs-step-3"),
      infoCard(t("GAME END", "FIM DE JOGO"), t("When the tiles run out", "Quando as peças acabam"), [
        rl("End", "all land tiles have been placed and a player cannot draw one on their turn. The player who placed the last tile still finishes that turn (meeple and scoring).", "Fim", "todas as peças de terreno foram colocadas e um jogador não consegue comprar uma no turno. Quem colocou a última peça ainda termina esse turno (meeple e pontuação)."),
        rl("Final scoring", "every meeple still in the landscape scores its unfinished feature (see the table).", "Pontuação final", "cada meeple ainda na paisagem pontua a construção inacabada (veja a tabela)."),
        rl("Winner", "most points; a tie means joint winners.", "Vencedor", "mais pontos; empate significa vitória compartilhada.")
      ], ["c6"], "victory-card")
    ];
    if (on("dragon")) {
      cards.push(infoCard(t("DRAGON", "DRAGÃO"), t("Hoard, symbol, movement", "Tesouro, símbolo, movimento"), [
        rl("Hoard placed", "take the dragon from wherever it is, put it on that tile and orient it.", "Tesouro colocado", "pegue o dragão de onde estiver, ponha-o nessa peça e oriente-o."),
        rl("Orient", "it must face a directly adjacent tile; and a meeple in a straight line (front, back, left, right — gaps block) if there is one. Several options: you choose.", "Orientar", "ele precisa olhar para uma peça diretamente adjacente; e para um meeple em linha reta (frente, trás, esquerda, direita — buracos bloqueiam) se houver. Várias opções: você escolhe."),
        rl("Symbol drawn", "dragon on a tile → 2 movements before you place your tile; dragon off the board → ignore the symbol.", "Símbolo comprado", "dragão numa peça → 2 movimentos antes de você colocar a sua; dragão fora do tabuleiro → ignore o símbolo."),
        rl("Movement", "straight ahead tile by tile until no tile is in front; remove every meeple on each tile it enters; orient at the end.", "Movimento", "em linha reta, peça a peça, até não haver peça à frente; remova todos os meeples de cada peça em que entrar; oriente no fim."),
        rl("Fairy's tile", "the dragon is removed instead; the fairy's meeple stays, others on that tile go; its owner keeps the dragon in front of them and puts it back on a hoard at the start of their own next turn.", "Peça da fada", "o dragão é que sai; o meeple da fada fica, os outros dessa peça saem; o dono desse meeple fica com o dragão à sua frente e o devolve a um tesouro no início do próprio turno seguinte.")
      ], ["d3", "d4", "d6"]));
    }
    if (on("drawbridges")) {
      cards.push(infoCard(t("DRAWBRIDGE", "PONTE LEVADIÇA"), t("After the road scores", "Depois que a estrada pontua"), [
        rl("City complete", "drawbridge up: nothing happens.", "Cidade completa", "ponte erguida: nada acontece."),
        rl("City incomplete", "drawbridge down: the player with the majority on the road may move their meeple from the road into the city — occupied or not.", "Cidade incompleta", "ponte abaixada: quem tem a maioria na estrada pode mover os meeples dele da estrada para a cidade — ocupada ou não."),
        rl("Several meeple / bridges", "decide for each meeple: into one of the incomplete drawbridge cities, or back to your supply.", "Vários meeples / pontes", "decida para cada meeple: para uma das cidades incompletas com ponte, ou de volta à reserva."),
        rl("No sole majority", "nobody moves.", "Sem maioria única", "ninguém se move.")
      ], ["b"]));
    }
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), ["c3", "c5", "c6"])}
      <div class="callout">${t(
        `Build the landscape one tile at a time. Each turn you add a tile and may claim one of its roads, cities${on("farmers") ? ", fields" : ""} or monasteries with a meeple. Completed features score at once and give the meeple back; at the end, unfinished ones score less. The player with the most points wins. ${playersLabel()}.`,
        `Construa a paisagem uma peça por vez. A cada turno você acrescenta uma peça e pode ocupar uma estrada, cidade${on("farmers") ? ", campo" : ""} ou mosteiro dela com um meeple. Construções completas pontuam na hora e devolvem o meeple; no fim, as inacabadas valem menos. Vence quem tiver mais pontos. ${playersLabel()}.`
      )} ${referenceLink("c3")}</div>
      <div class="quick-grid">${cards.join("")}</div>
      <h3 class="subhead">${t("Scoring table for this match", "Tabela de pontuação desta partida")}</h3>
      ${scoreTable()}`;
  }

  // ---------- your turn ----------

  function turnSection() {
    const cards = [
      infoCard(t("STEP 1", "PASSO 1"), t("Place a land tile", "Colocar uma peça de terreno"), [
        on("dragon") ? rl("Before drawing", "if the dragon is in front of you, place it on a dragon hoard of your choice and orient it (see Dragon & Fairy).", "Antes de comprar", "se o dragão estiver à sua frente, ponha-o num tesouro do dragão à sua escolha e oriente-o (veja Dragon & Fairy).") : "",
        rl("Draw", `you must draw exactly 1 tile from a stack${on("river") ? " — from the river stack until every river tile is placed" : ""}.`, "Comprar", `você precisa comprar exatamente 1 peça de uma pilha${on("river") ? " — da pilha do rio até todas as peças de rio estarem colocadas" : ""}.`),
        on("dragon") ? rl("Dragon symbol", "if the tile shows one and the dragon stands on a tile, the dragon makes 2 movements now, before you place your tile.", "Símbolo de dragão", "se a peça tiver um e o dragão estiver numa peça, o dragão faz 2 movimentos agora, antes de você colocar a sua peça.") : "",
        rl("Place", "face up, next to a tile already in play, so that every edge it touches continues the landscape: roads meet roads, city edges meet city edges, fields meet fields. You may turn it any way.", "Colocar", "virada para cima, ao lado de uma peça já em jogo, de modo que cada lado que ela toca continue a paisagem: estrada encontra estrada, borda de cidade encontra borda de cidade, campo encontra campo. Você pode girá-la como quiser."),
        rl("Cities", "an incomplete city can only be continued by another city tile.", "Cidades", "uma cidade incompleta só pode ser continuada por outra peça de cidade."),
        rl("Monasteries", "always sit in the middle of a tile; only the edges of the tile need to match.", "Mosteiros", "ficam sempre no meio da peça; só os lados da peça precisam combinar."),
        rl("No legal spot", "in the rare case the tile cannot continue the landscape anywhere, return it to the box and draw a new one.", "Sem lugar válido", "no caso raro de a peça não poder continuar a paisagem em lugar nenhum, devolva-a à caixa e compre outra."),
        rl("Completing for others", "you may place a tile that completes a feature in which only other players have meeple; it is scored for them.", "Completar para os outros", "você pode colocar uma peça que completa uma construção em que só outros jogadores têm meeples; ela é pontuada para eles.")
      ], ["c3", "c4", "c5", on("dragon") ? "d4" : "", on("dragon") ? "d6" : "", on("river") ? "s2" : ""].filter(Boolean), "ccs-step-1"),
      infoCard(t("STEP 2", "PASSO 2"), t("Place a meeple (optional)", "Colocar um meeple (opcional)"), [
        rl("One figure", "you may place exactly 1 meeple from your supply — or none.", "Uma figura", "você pode colocar exatamente 1 meeple da sua reserva — ou nenhum."),
        rl("This tile only", `on one feature of the tile you have just placed${on("dragon") ? " (exception: magic portal)" : ""}.`, "Só nesta peça", `numa construção da peça que você acabou de colocar${on("dragon") ? " (exceção: portal mágico)" : ""}.`),
        rl("Unoccupied", `the feature must have no meeple anywhere along it — check the whole road, the whole city${on("farmers") ? ", the whole field" : ""}, not only this tile.`, "Desocupada", `a construção não pode ter meeple em lugar nenhum — confira a estrada inteira, a cidade inteira${on("farmers") ? ", o campo inteiro" : ""}, não só esta peça.`),
        rl("Traveler", "standing on one road segment of the tile.", "Viajante", "em pé num trecho de estrada da peça."),
        rl("Knight", "standing on one city segment of the tile.", "Cavaleiro", "em pé num trecho de cidade da peça."),
        rl("Monk (or nun)", "standing on the monastery.", "Monge (ou freira)", "em pé no mosteiro."),
        on("farmers") ? rl("Farmer", "lying down on a field (see Fields & farmers).", "Camponês", "deitado num campo (veja Campos e camponeses).") : rl("Fields", "not used in this match: nobody is placed on fields.", "Campos", "não usados nesta partida: ninguém é colocado nos campos."),
        on("abbot") ? rl("Abbot", "standing on a monastery or a garden only (see The Abbot).", "Abade", "em pé só num mosteiro ou num jardim (veja The Abbot).") : "",
        on("inns") ? rl("Large meeple", `may replace the normal meeple as traveler, knight, monk${on("farmers") ? " or farmer" : ""}${on("abbot") || on("cathedrals") ? ` — never as ${[on("abbot") ? "abbot" : "", on("cathedrals") ? "archbishop" : ""].filter(Boolean).join(" or ")}` : ""} (see Inns & Cathedrals).`, "Meeple grande", `pode substituir o meeple normal como viajante, cavaleiro, monge${on("farmers") ? " ou camponês" : ""}${on("abbot") || on("cathedrals") ? ` — nunca como ${[on("abbot") ? "abade" : "", on("cathedrals") ? "arcebispo" : ""].filter(Boolean).join(" ou ")}` : ""} (veja Inns & Cathedrals).`) : "",
        on("cathedrals") ? rl("Archbishop", "standing on the cathedral of a German cathedral tile.", "Arcebispo", "em pé na catedral de uma peça de catedral alemã.") : "",
        rl("Empty supply", "your meeple come back only when their feature is scored; with none left in your supply you cannot place one.", "Reserva vazia", "seus meeples só voltam quando a construção deles é pontuada; sem nenhum na reserva você não pode colocar."),
        on("festival") ? rl("Festival tile", "placing no figure on it lets you return one of your meeple instead (see The Festival).", "Peça de festival", "não colocar nenhuma figura nela permite recolher um dos seus meeples (veja The Festival).") : ""
      ], ["c3", "c5", on("abbot") ? "s2" : "", on("farmers") ? "s1" : ""].filter(Boolean), "ccs-step-2"),
      infoCard(t("STEP 3", "PASSO 3"), t("Score points", "Pontuar"), [
        rl("What", "score every feature completed by the tile you placed this turn — one tile can complete several.", "O quê", "pontue cada construção completada pela peça que você colocou neste turno — uma peça pode completar várias."),
        rl("Your new meeple too", "a meeple you just placed on a feature that this same tile completes is scored at once and comes straight back.", "Seu meeple novo também", "um meeple que você acabou de colocar numa construção que esta mesma peça completa é pontuado na hora e volta direto."),
        rl("Who", "every player with meeple in a completed feature takes part; the majority decides who scores.", "Quem", "todo jogador com meeples numa construção completa participa; a maioria decide quem pontua."),
        rl("Record", "move your scoring meeple forward 1 space per point.", "Registrar", "avance seu meeple marcador 1 casa por ponto."),
        rl("Return", "then return all meeple of each scored feature to their owners' supplies; meeple in features that are not complete stay.", "Devolver", "depois devolva todos os meeples de cada construção pontuada às reservas dos donos; meeples em construções incompletas ficam."),
        on("drawbridges") ? rl("Drawbridges", "a completed road leading to a drawbridge may move meeple into the city instead of returning them (see The Drawbridges).", "Pontes levadiças", "uma estrada completa que leva a uma ponte levadiça pode mover meeples para a cidade em vez de devolvê-los (veja The Drawbridges).") : "",
        on("dragon") ? rl("Fairy", "after all scoring, check whether you earned the fairy (see Dragon & Fairy).", "Fada", "depois de toda a pontuação, veja se você ganhou a fada (veja Dragon & Fairy).") : ""
      ], ["c3", "c5"], "ccs-step-3")
    ];
    return `
      ${sectionHeading("turn", t("Your turn", "Seu turno"), ["c3", "c5"])}
      <p class="glossary-intro">${t("Carcassonne is played clockwise, starting with the youngest player. On your turn do these three steps in order; then the next player takes their turn.", "Carcassonne é jogado em sentido horário, começando pelo jogador mais jovem. No seu turno faça estes três passos em ordem; depois o próximo jogador faz o turno dele.")} ${referenceLink("c3")}</p>
      <div class="quick-grid ccs-steps">${cards.join("")}</div>`;
  }

  // ---------- features ----------

  function featuresSection() {
    const cards = [
      infoCard(t("ROAD · TRAVELER", "ESTRADA · VIAJANTE"), t("Roads", "Estradas"), [
        rl("Complete", "when it is closed at both ends: each end runs into a village (a cluster of houses where roads meet), a city, a monastery or another feature that visibly stops it — or the road loops back into itself. A road that simply runs off the edge of a tile with no tile there is open.", "Completa", "quando está fechada nas duas pontas: cada ponta chega a um vilarejo (um grupo de casas onde estradas se encontram), uma cidade, um mosteiro ou outra construção que visivelmente a interrompe — ou a estrada faz um laço sobre si mesma. Uma estrada que sai pela borda da peça sem peça ao lado está aberta."),
        rl("Score", "1 point per tile of the road.", "Pontos", "1 ponto por peça da estrada."),
        rl("At the end", "unfinished: still 1 point per tile.", "No fim", "inacabada: ainda 1 ponto por peça.")
      ], ["c3", "c5", "c6"]),
      infoCard(t("CITY · KNIGHT", "CIDADE · CAVALEIRO"), t("Cities", "Cidades"), [
        rl("Complete", "when it is entirely surrounded by walls and has no gaps inside.", "Completa", "quando está inteiramente cercada por muralhas e sem buracos por dentro."),
        rl("Score", `2 points per city tile + 2 per shield ${sym("shield", t("shield", "brasão"))} in the city.`, "Pontos", `2 pontos por peça de cidade + 2 por brasão ${sym("shield", t("shield", "brasão"))} na cidade.`),
        rl("At the end", "unfinished: 1 per tile + 1 per shield (half).", "No fim", "inacabada: 1 por peça + 1 por brasão (metade).")
      ], ["c4", "c5", "c6"]),
      infoCard(t("MONASTERY · MONK", "MOSTEIRO · MONGE"), t("Monasteries", "Mosteiros"), [
        rl("Complete", "when it is surrounded by 8 tiles (all around, diagonals included).", "Completo", "quando está cercado por 8 peças (em toda a volta, diagonais incluídas)."),
        rl("Score", "1 point per surrounding tile + 1 for the monastery tile: 9.", "Pontos", "1 ponto por peça em volta + 1 pela peça do mosteiro: 9."),
        rl("At the end", "unfinished: 1 + 1 per surrounding tile.", "No fim", "inacabado: 1 + 1 por peça em volta.")
      ], ["c4", "c5", "c6"]),
      on("abbot") ? infoCard(t("GARDEN · ABBOT", "JARDIM · ABADE"), t("Gardens", "Jardins"), [
        `${sym("garden", t("Garden", "Jardim"))} ${t("Only an abbot may occupy a garden; it is scored exactly like a monastery (9 when surrounded).", "Só um abade pode ocupar um jardim; ele pontua exatamente como um mosteiro (9 quando cercado).")}`
      ], ["s2"]) : "",
      on("farmers") ? infoCard(t("FIELD · FARMER", "CAMPO · CAMPONÊS"), t("Fields", "Campos"), [
        rl("Never complete", "fields are scored only in the final scoring.", "Nunca completos", "campos só pontuam na pontuação final."),
        rl("At the end", "3 points per completed city touching the field.", "No fim", "3 pontos por cidade completa que toca o campo.")
      ], ["s1", "c6"]) : "",
      infoCard(t("MAJORITY", "MAIORIA"), t("Several meeple in one feature", "Vários meeples na mesma construção"), [
        rl("How it happens", "you cannot place on an occupied feature, but you can claim a separate segment and connect it later with another tile.", "Como acontece", "você não pode colocar numa construção ocupada, mas pode ocupar um trecho separado e conectá-lo depois com outra peça."),
        rl("Most meeple", `only the player with the most meeple in the feature scores, and scores the full points${on("inns") ? " (a large meeple counts as 2)" : ""}.`, "Mais meeples", `só quem tem mais meeples na construção pontua, e recebe os pontos inteiros${on("inns") ? " (meeple grande conta como 2)" : ""}.`),
        rl("Tie", "all tied players score the full points.", "Empate", "todos os empatados recebem os pontos inteiros."),
        rl("Everyone returns", "after scoring, every meeple of that feature goes back — the losers' too.", "Todos voltam", "depois da pontuação, todos os meeples dessa construção voltam — inclusive os de quem perdeu.")
      ], ["c5"]),
      infoCard(t("SCOREBOARD", "TRILHA DE PONTOS"), t("Recording points", "Registrando pontos"), [
        rl("Move", "your scoring meeple 1 space per point.", "Mover", "seu meeple marcador 1 casa por ponto."),
        on("inns")
          ? rl("Past 50", "take a score tile 50/100 and place it in front of you, showing the points you reached.", "Depois de 50", "pegue uma ficha de pontuação 50/100 e coloque-a à sua frente, mostrando os pontos que alcançou.")
          : rl("Past 50", "when you reach or cross 50/0, note it or lay your scoring meeple down: lying = 50 + its space. Note any further lap on paper (guide's reading).", "Depois de 50", "ao alcançar ou passar 50/0, anote ou deite seu meeple marcador: deitado = 50 + a casa dele. Anote no papel cada volta a mais (leitura do guia).")
      ], on("inns") ? ["c3", "c6", "i1"] : ["c3", "c6"])
    ];
    return `
      ${sectionHeading("features", t("Features & scoring", "Construções e pontuação"), ["c3", "c4", "c5", "c6"])}
      <div class="quick-grid">${cards.filter(Boolean).join("")}</div>
      ${figure("meeples", "Meeple in black, red, green, blue and yellow", "Meeples preto, vermelho, verde, azul e amarelo", on("farmers") ? "Meeple: the same figure is a traveler, knight, monk or farmer depending on where you place it." : "Meeple: the same figure is a traveler, knight or monk depending on where you place it.", on("farmers") ? "Meeple: a mesma figura é viajante, cavaleiro, monge ou camponês conforme onde você a coloca." : "Meeple: a mesma figura é viajante, cavaleiro ou monge conforme onde você a coloca.", "c2", "is-small")}`;
  }

  // ---------- modules ----------

  function riverSection() {
    const dragon = on("dragon");
    const cards = [
      infoCard(t("STEP 1 · RIVER TILES", "PASSO 1 · PEÇAS DE RIO"), t("Building the river", "Construindo o rio"), [
        rl("River stack first", "at the start, draw from the river stack instead of the land stacks until all river tiles are placed.", "Pilha do rio primeiro", "no início, compre da pilha do rio em vez das pilhas de terreno até todas as peças de rio estarem colocadas."),
        rl("Continue the river", "a river tile must match the landscape as usual and must extend the river itself.", "Continuar o rio", "uma peça de rio precisa combinar com a paisagem como de costume e precisa prolongar o próprio rio."),
        rl("Bends", "the river may not loop back into itself: a bend may not turn in the same direction as the previously placed bend.", "Curvas", "o rio não pode voltar sobre si mesmo: uma curva não pode virar para o mesmo lado da curva colocada antes."),
        dragon ? "" : rl("Lake", "the lake is the last tile of the stack and caps the river.", "Lago", "o lago é a última peça da pilha e fecha o rio."),
        rl("Then", "when the river is finished, continue with the normal land tiles.", "Depois", "com o rio terminado, continue com as peças de terreno normais.")
      ], ["s2"], "ccs-step-1"),
      infoCard(t("STEP 2 · MEEPLE", "PASSO 2 · MEEPLE"), t("Meeple on river tiles", "Meeples em peças de rio"), [
        rl("Allowed", "you may place a meeple on a river tile following the normal rules (its roads, cities, monasteries…).", "Permitido", "você pode colocar um meeple numa peça de rio pelas regras normais (estradas, cidades, mosteiros dela…)."),
        rl("Never on the water", "meeple cannot be placed on the river itself.", "Nunca na água", "meeples não podem ser colocados no próprio rio."),
        on("farmers") ? rl("Fields", "the river separates fields.", "Campos", "o rio separa campos.") : "",
        on("inns") ? rl("Inn river tile", "the Inns & Cathedrals river tile has an inn on its road.", "Peça de rio com estalagem", "a peça de rio de Inns & Cathedrals tem uma estalagem na estrada.") : ""
      ], on("inns") ? ["s2", "s1", "i1"] : ["s2", "s1"], "ccs-step-2")
    ];
    if (dragon) {
      cards.push(infoCard(t("DRAGON & FAIRY", "DRAGON & FAIRY"), t("Double source and double lake", "Nascente dupla e lago duplo"), [
        rl("Two tiles each", "the double source and the double lake each count as 2 adjacent land tiles.", "Duas peças cada", "a nascente dupla e o lago duplo contam cada um como 2 peças de terreno adjacentes."),
        rl("Two ends", "with the double source, when you place a river tile choose which of the two open river ends it extends.", "Duas pontas", "com a nascente dupla, ao colocar uma peça de rio escolha qual das duas pontas abertas do rio ela prolonga."),
        rl("The River's lake", "is shuffled into the stack; when drawn, place it at either end. From then on, river tiles go only on the other end.", "O lago de The River", "vai embaralhado na pilha; quando comprado, coloque-o em qualquer ponta. Daí em diante, peças de rio só vão na outra ponta."),
        interpretation("with two river arms, apply the bend rule to each arm separately: compare with the last bend on the same arm.", "com dois braços de rio, aplique a regra das curvas a cada braço separadamente: compare com a última curva do mesmo braço."),
        rl("Double lake last", "it is placed as the last river tile; flip it to either side first; usual placement rules.", "Lago duplo por último", "ele é colocado como a última peça de rio; vire-o para o lado que quiser antes; regras normais de colocação."),
        rl("Two halves", "the dragon hoard is on one half (the lake); the other half shows the river bend. The no-meeple rule covers only the hoard half.", "Duas metades", "o tesouro do dragão fica numa metade (o lago); a outra metade mostra a curva do rio. A regra de nenhum meeple vale só para a metade do tesouro."),
        rl("Then", `you may place a meeple on its river-bend half as usual${on("abbot") || on("farmers") ? ` (${[on("abbot") ? t("the abbot on its garden", "o abade no jardim") : "", on("farmers") ? t("a farmer", "um camponês") : ""].filter(Boolean).join(t(" or ", " ou "))})` : ""}; then place the dragon on its dragon hoard and orient it — it can only face the one adjacent tile.`, "Depois", `você pode colocar um meeple na metade da curva do rio como de costume${on("abbot") || on("farmers") ? ` (${[on("abbot") ? t("the abbot on its garden", "o abade no jardim") : "", on("farmers") ? t("a farmer", "um camponês") : ""].filter(Boolean).join(t(" or ", " ou "))})` : ""}; depois ponha o dragão no tesouro do dragão dela e oriente-o — ele só pode olhar para a única peça adjacente.`)
      ], ["d2", "d3"]));
    }
    return `
      ${sectionHeading("river", t("The River", "O Rio (The River)"), dragon ? ["s2", "d2"] : ["s2"])}
      <p class="glossary-intro">${t(`The first mini-expansion: ${BOX.river} dark-backed river tiles${on("inns") ? " (+1 from Inns & Cathedrals)" : ""} that replace the starting tile and vary the opening.`, `A primeira mini: ${BOX.river} peças de rio de verso escuro${on("inns") ? " (+1 de Inns & Cathedrals)" : ""} que substituem a peça inicial e variam a abertura.`)} ${referenceLink("s2")}</p>
      <div class="quick-grid">${cards.join("")}</div>
      <div class="ccs-figure-row">
        ${figure("river-example", "An example river from the source tile down to the lake tile", "Um exemplo de rio da nascente até o lago", "Example of how the river can look: source at the top, lake at the bottom.", "Exemplo de como o rio pode ficar: nascente em cima, lago embaixo.", "s2", "is-tall")}
        ${dragon ? figure("double-lake", "Double lake tile with a dragon hoard", "Peça de lago duplo com tesouro do dragão", "The double lake (two-sided) closes the river and carries a dragon hoard.", "O lago duplo (dupla face) fecha o rio e tem um tesouro do dragão.", "d2") : ""}
      </div>`;
  }

  function abbotSection() {
    const cards = [
      infoCard(t("STEP 2", "PASSO 2"), t("Place a meeple or your abbot", "Colocar um meeple ou o seu abade"), [
        rl("Tile with a monastery or garden", "you may place either a normal meeple or your abbot on it.", "Peça com mosteiro ou jardim", "você pode colocar um meeple normal ou o seu abade nela."),
        rl("Abbot", "only on a monastery or a garden — never on a road, city or field.", "Abade", "só num mosteiro ou num jardim — nunca em estrada, cidade ou campo."),
        rl("Normal meeple", `cannot be placed on a garden${on("inns") ? " (nor can the large meeple)" : ""}.`, "Meeple normal", `não pode ser colocado num jardim${on("inns") ? " (nem o meeple grande)" : ""}.`),
        rl("One feature, one figure", "a monastery with a monk cannot take an abbot, and vice versa.", "Uma construção, uma figura", "um mosteiro com monge não recebe abade, e vice-versa.")
      ], on("inns") ? ["s2", "i4"] : ["s2"], "ccs-step-2"),
      infoCard(t("STEP 3", "PASSO 3"), t("Scoring with the abbot", "Pontuando com o abade"), [
        rl("Surrounded", "a monastery or garden surrounded by 8 tiles scores 9 points for the abbot; gardens score like monasteries.", "Cercado", "um mosteiro ou jardim cercado por 8 peças vale 9 pontos para o abade; jardins pontuam como mosteiros."),
        rl("Early recall", "if you did not place a meeple in step 2, you may return your abbot from its tile to your supply and go straight to step 3: score its monastery or garden now — 1 per surrounding tile + 1 for itself.", "Recolher antes", "se você não colocou meeple no passo 2, pode devolver o abade da peça à sua reserva e ir direto ao passo 3: pontue o mosteiro ou jardim dele agora — 1 por peça em volta + 1 por ele mesmo."),
        rl("Other features", "anything else your tile completed this turn is scored as normal in the same step.", "Outras construções", "o que mais a sua peça completou neste turno é pontuado normalmente no mesmo passo."),
        rl("Final scoring", "an abbot still on the board scores like a normal monk: 1 + 1 per surrounding tile.", "Pontuação final", "um abade ainda no tabuleiro pontua como um monge normal: 1 + 1 por peça em volta.")
      ], ["s2"], "ccs-step-3")
    ];
    return `
      ${sectionHeading("abbot", t("The Abbot", "O Abade (The Abbot)"), ["s2"])}
      <p class="glossary-intro">${t(`The second mini-expansion: one abbot per player and the gardens ${sym("garden", "Garden")} printed on some tiles.`, `A segunda mini: um abade por jogador e os jardins ${sym("garden", "Jardim")} impressos em algumas peças.`)} ${referenceLink("s2")}</p>
      <div class="quick-grid">${cards.join("")}</div>
      ${figure("abbot-example", "Red returns the abbot from a garden and scores 6 points", "Vermelho recolhe o abade de um jardim e marca 6 pontos", "You place a tile but no meeple. Instead you return your abbot and score 6 points (5 surrounding tiles + the garden).", "Você coloca uma peça mas nenhum meeple. Em vez disso recolhe o abade e marca 6 pontos (5 peças em volta + o jardim).", "s2")}`;
  }

  function farmersSection() {
    const cards = [
      infoCard(t("STEP 2", "PASSO 2"), t("Place a meeple as a farmer", "Colocar um meeple como camponês"), [
        rl("Fields", "the green landscape on the tiles.", "Campos", "a paisagem verde das peças."),
        rl("Lying down", "farmers are placed lying down — a reminder that they score only at the end.", "Deitado", "camponeses ficam deitados — um lembrete de que só pontuam no fim."),
        rl("Unoccupied field", "only on a field with no farmer on it anywhere.", "Campo desocupado", "só num campo sem nenhum camponês em lugar nenhum."),
        rl("Borders", `fields are separated by cities, roads${on("river") ? ", the river" : ""} and other features that visually divide them.`, "Divisas", `campos são separados por cidades, estradas${on("river") ? ", o rio" : ""} e outras construções que os dividem visualmente.`),
        rl("Sneaking in", "as with other features, you can later connect your own farmer to an occupied field.", "Infiltrar", "como nas outras construções, você pode depois conectar o seu camponês a um campo ocupado.")
      ], ["s1"], "ccs-step-2"),
      infoCard(t("FINAL SCORING", "PONTUAÇÃO FINAL"), t("Scoring fields", "Pontuando campos"), [
        rl("Only at the end", "fields are never scored during the game; farmers never return to your supply.", "Só no fim", "campos nunca pontuam durante o jogo; camponeses nunca voltam à reserva."),
        rl("Size doesn't matter", "how many tiles the field covers is irrelevant.", "Tamanho não importa", "quantas peças o campo cobre é irrelevante."),
        rl("Points", "3 per completed city touching the field. Unfinished cities count for nothing.", "Pontos", "3 por cidade completa que toca o campo. Cidades inacabadas não contam nada."),
        rl("Majority", `the player with the most farmers on the field scores; ties all score the full points${on("inns") ? " (large meeple = 2)" : ""}.`, "Maioria", `quem tem mais camponeses no campo pontua; todos os empatados recebem os pontos inteiros${on("inns") ? " (meeple grande = 2)" : ""}.`),
        rl("Shared cities", "one city can touch several fields and counts for each of them (rulebook example).", "Cidades compartilhadas", "uma cidade pode tocar vários campos e conta para cada um deles (exemplo do manual).")
      ], ["s1", "c6"], "ccs-step-3")
    ];
    const extra = [
      on("inns") ? rl("Inns & Cathedrals", "where a city wall meets the tile corner, the corner separates the two field segments.", "Inns & Cathedrals", "onde uma muralha de cidade encontra o canto da peça, o canto separa os dois trechos de campo.") : "",
      on("dragon") ? rl("Dragon & Fairy", "fields are never “completed”, even when enclosed on all sides. A tunnel road does not divide the fields it passes under; a city corner separates two fields.", "Dragon & Fairy", "campos nunca estão “completos”, mesmo fechados por todos os lados. Uma estrada em túnel não divide os campos sob os quais passa; um canto de cidade separa dois campos.") : "",
      on("drawbridges") ? rl("The Drawbridges", "ditches and moats are not a boundary: the meadow extends right up to the city.", "The Drawbridges", "valas e fossos não são divisa: o campo vai até a cidade.") : ""
    ].filter(Boolean);
    if (extra.length) {
      cards.push(infoCard(t("EXPANSION TILES", "PEÇAS DAS EXPANSÕES"), t("Field borders on special tiles", "Divisas de campo em peças especiais"), extra, [on("inns") ? "i3" : "", on("dragon") ? "d7" : "", on("drawbridges") ? "b" : ""].filter(Boolean)));
    }
    return `
      ${sectionHeading("farmers", t("Fields & farmers", "Campos e camponeses"), ["s1", "c6"])}
      <p class="glossary-intro">${t("Supplemental rule for after your first games: meeple on fields become farmers.", "Regra suplementar para depois das primeiras partidas: meeples nos campos viram camponeses.")} ${referenceLink("s1")}</p>
      <div class="quick-grid">${cards.join("")}</div>
      ${figure("field-example", "Field scoring example with cities A, B, C and D", "Exemplo de pontuação de campo com as cidades A, B, C e D", "Red and Blue tie on the outlined field touching completed cities A, B and D: 9 points each (C is unfinished). Black outnumbers Yellow on the black field: 12 points. Yellow alone in the corner field: 6 (A and B).", "Vermelho e Azul empatam no campo contornado que toca as cidades completas A, B e D: 9 pontos cada (C está inacabada). Preto tem mais que Amarelo no campo preto: 12 pontos. Amarelo sozinho no campo do canto: 6 (A e B).", "s1", "is-wide")}`;
  }

  function innsSection() {
    const special = [
      on("farmers") ? rl("City corner", "where a city wall reaches the corner of the tile, the corner separates the two field segments.", "Canto de cidade", "onde a muralha chega ao canto da peça, o canto separa os dois trechos de campo.") : "",
      rl("Monastery between roads", "the monastery is a closed end for both roads.", "Mosteiro entre estradas", "o mosteiro é uma ponta fechada para as duas estradas."),
      rl("Three-way junction with an inn", "the junction closes all 3 roads; the inn (on the pond beside the junction) counts only for the two roads it lies along — left and right in the booklet's picture — not for the third road leading away from it (down).", "Junção de três com estalagem", "a junção fecha as 3 estradas; a estalagem (na lagoa ao lado da junção) conta só para as duas estradas ao longo das quais ela fica — esquerda e direita na imagem do livreto —, não para a terceira estrada que se afasta dela (para baixo)."),
      rl("Ring road around a pond", "it is not a closed end: it is one single road splitting into 4 directions; all its open ends must be closed to complete it.", "Estrada em anel em volta de uma lagoa", "não é ponta fechada: é uma única estrada que se divide em 4 direções; todas as pontas abertas precisam ser fechadas para completá-la."),
      rl("Four-way junction between two cities", "closes all 4 roads; the two short roads to the city are already complete — a meeple placed on one scores 1 point at once.", "Cruzamento de quatro entre duas cidades", "fecha as 4 estradas; as duas estradinhas até a cidade já estão completas — um meeple colocado numa delas marca 1 ponto na hora.")
    ];
    return `
      ${sectionHeading("inns", "Inns & Cathedrals", ["i1", "i2", "i3", "i4"])}
      <p class="glossary-intro">${t(`Expansion 1 ${sym("inns-cathedrals-badge", "Expansion 1 badge")}: ${BOX.innsTiles} tiles marked ${markerIcon("inns")} (among them 2 cathedrals, 7 inns and 1 river tile with an inn), 6 large meeple, the pink figures for a 6th player and 6 score tiles 50/100. If a step is not explained here, the base rules apply.`, `Expansão 1 ${sym("inns-cathedrals-badge", "Selo da expansão 1")}: ${BOX.innsTiles} peças marcadas ${markerIcon("inns")} (entre elas 2 catedrais, 7 estalagens e 1 peça de rio com estalagem), 6 meeples grandes, as figuras rosas para um 6º jogador e 6 fichas de pontuação 50/100. Se um passo não é explicado aqui, valem as regras base.`)} ${referenceLink("i1")}</p>
      <div class="quick-grid">
        ${infoCard(t("STEP 3 · INN", "PASSO 3 · ESTALAGEM"), t("Roads with an inn", "Estradas com estalagem"), [
          `${sym("inn", t("Inn", "Estalagem"))} ${t("An inn is drawn beside a road, next to a small pond.", "Uma estalagem aparece ao lado de uma estrada, junto a uma pequena lagoa.")}`,
          rl("Completed", "a road with one or more inns scores 2 points per tile instead of 1.", "Completa", "uma estrada com uma ou mais estalagens vale 2 pontos por peça em vez de 1."),
          rl("Several inns", "the bonus counts only once: still 2 per tile.", "Várias estalagens", "o bônus conta uma vez só: continua 2 por peça."),
          rl("Unfinished at the end", "1 point per tile, as usual.", "Inacabada no fim", "1 ponto por peça, como de costume.")
        ], ["i2", "i4"], "ccs-step-3")}
        ${infoCard(t("STEP 3 · CATHEDRAL", "PASSO 3 · CATEDRAL"), t("Cities with a cathedral", "Cidades com catedral"), [
          `${sym("cathedral", t("Cathedral", "Catedral"))} ${t("A cathedral fills a city tile.", "Uma catedral ocupa uma peça de cidade.")}`,
          rl("Completed", "a city with one or more cathedrals scores 3 points per tile and per coat of arms (shield) instead of 2.", "Completa", "uma cidade com uma ou mais catedrais vale 3 pontos por peça e por brasão em vez de 2."),
          rl("Unfinished at the end", "1 point per tile and coat of arms, as usual.", "Inacabada no fim", "1 ponto por peça e brasão, como de costume.")
        ], ["i2", "i4"], "ccs-step-3")}
        ${infoCard(t("STEP 2 · LARGE MEEPLE", "PASSO 2 · MEEPLE GRANDE"), t("The large meeple", "O meeple grande"), [
          `${sym("large-meeple", t("Large meeple", "Meeple grande"))} ${t("One per player, in your supply.", "Um por jogador, na sua reserva.")}`,
          rl("Placing", `instead of a standard meeple, as a traveler, knight, monk${on("farmers") ? " or farmer" : ""}, by the usual rules — only on features without a meeple.`, "Colocar", `no lugar de um meeple normal, como viajante, cavaleiro, monge${on("farmers") ? " ou camponês" : ""}, pelas regras normais — só em construções sem meeple.`),
          rl("Strength 2", "when determining the majority in a feature it counts as 2 standard meeple.", "Força 2", "na hora de definir a maioria numa construção ele conta como 2 meeples normais."),
          rl("Scoring", "it scores and returns like any meeple — the points are not doubled.", "Pontuação", "ele pontua e volta como qualquer meeple — os pontos não dobram.")
        ], ["i3", "i4"], "ccs-step-2")}
        ${infoCard(t("SPECIAL LAND TILES", "PEÇAS ESPECIAIS"), t("Closed ends and junctions", "Pontas fechadas e cruzamentos"), special, ["i3", "i4"])}
      </div>
      <p class="ccs-note">${t("“Majority” in a feature now means the highest total strength. Pink is a 6th color: 8 meeple and 1 abbot; the pink large meeple is among the 6 large meeple.", "“Maioria” numa construção passa a ser a maior força total. Rosa é uma 6ª cor: 8 meeples e 1 abade; o meeple grande rosa está entre os 6 meeples grandes.")} ${referenceLink("i1")} ${referenceLink("i3")}</p>`;
  }

  function dragonSection() {
    return `
      ${sectionHeading("dragon", "Dragon & Fairy", ["d1", "d3", "d4", "d5", "d6", "d7", "d8"])}
      <p class="glossary-intro">${t(`Expansion 3 ${sym("dragon-fairy-badge", "Expansion 3 badge")}: ${BOX.dragonLand} tiles marked ${markerIcon("dragon")} — among them 6 dragon hoards, 10 dragon symbols and 6 magic portals — plus the neutral dragon and fairy${on("river") ? ", the double source and the double lake (see The River)" : ""}. If a step is not explained here, the base rules apply.`, `Expansão 3 ${sym("dragon-fairy-badge", "Selo da expansão 3")}: ${BOX.dragonLand} peças marcadas ${markerIcon("dragon")} — entre elas 6 tesouros do dragão, 10 símbolos de dragão e 6 portais mágicos — mais o dragão e a fada neutros${on("river") ? ", a nascente dupla e o lago duplo (veja The River)" : ""}. Se um passo não é explicado aqui, valem as regras base.`)} ${referenceLink("d1")}</p>
      <div class="quick-grid">
        ${infoCard(t("STEP 2 · DRAGON HOARD", "PASSO 2 · TESOURO DO DRAGÃO"), t("Placing a dragon-hoard tile", "Colocando uma peça de tesouro do dragão"), [
          `${sym("dragon-hoard", t("Dragon hoard", "Tesouro do dragão"))} ${t("You must take the dragon from wherever it is (at first, next to the play area), put it on this tile and orient it.", "Você precisa pegar o dragão de onde estiver (no início, ao lado da área de jogo), pô-lo nesta peça e orientá-lo.")}`,
          rl("No meeple here", "you may never place a meeple on — or move one onto — a tile with a dragon hoard.", "Sem meeple aqui", "você nunca pode colocar um meeple — nem movê-lo — numa peça com tesouro do dragão.")
        ], ["d3", "d8"], "ccs-step-2")}
        ${infoCard(t("ORIENTING THE DRAGON", "ORIENTANDO O DRAGÃO"), t("Choose 1 of 4 directions", "Escolha 1 de 4 direções"), [
          `${sym("dragon", t("Dragon", "Dragão"))} ${t("Whenever the dragon is placed or ends a movement, turn it to face:", "Sempre que o dragão é colocado ou termina um movimento, vire-o para olhar para:")}`,
          rl("An adjacent tile", "it must face a tile directly adjacent to its own (orthogonally).", "Uma peça adjacente", "ele precisa olhar para uma peça diretamente adjacente à dele (ortogonal)."),
          rl("A meeple in line", "it must face a meeple that is in a straight line in front, behind, left or right of it; a gap in the landscape interrupts that line of sight. No meeple in line → ignore this condition.", "Um meeple em linha", "ele precisa olhar para um meeple em linha reta à frente, atrás, à esquerda ou à direita; um buraco na paisagem interrompe essa linha de visão. Nenhum meeple em linha → ignore esta condição."),
          rl("Several options", "you must choose one of them.", "Várias opções", "você precisa escolher uma delas.")
        ], ["d3", "d8"])}
        ${infoCard(t("STEP 1 · DRAGON SYMBOL", "PASSO 1 · SÍMBOLO DE DRAGÃO"), t("The dragon awakens", "O dragão desperta"), [
          `${sym("dragon-symbol", t("Dragon symbol", "Símbolo de dragão"))} ${t("You draw a tile with a dragon symbol and the dragon stands on a tile: before you place your tile, the dragon makes exactly 2 movements.", "Você compra uma peça com símbolo de dragão e o dragão está numa peça: antes de você colocar a sua peça, o dragão faz exatamente 2 movimentos.")}`,
          rl("Movement", "move it in the direction it faces (no turning first), straight ahead tile by tile until there is no tile directly in front of it; it stops on that last tile.", "Movimento", "mova-o na direção para a qual olha (sem virar antes), em linha reta, peça a peça, até não haver peça diretamente à frente; ele para nessa última peça."),
          rl("Eating", "remove every meeple from every tile the dragon enters and return them to their owners' supplies (no points).", "Devorar", "remova todos os meeples de cada peça em que o dragão entrar e devolva-os às reservas dos donos (sem pontos)."),
          rl("Orient", "at the end of each movement, orient it again by the usual rules; then the second movement.", "Orientar", "no fim de cada movimento, oriente-o de novo pelas regras normais; depois o segundo movimento."),
          rl("Then", "place the tile with the dragon symbol by the base rules and continue your turn.", "Depois", "coloque a peça com o símbolo de dragão pelas regras base e continue o turno."),
          rl("Dragon not on a tile", "if it is next to the play area or in front of a player, ignore the symbol.", "Dragão fora das peças", "se ele estiver ao lado da área de jogo ou à frente de um jogador, ignore o símbolo.")
        ], ["d4", "d5", "d8"], "ccs-step-1")}
        ${infoCard(t("STEP 3 · FAIRY", "PASSO 3 · FADA"), t("Earning and scoring the fairy", "Ganhando e pontuando a fada"), [
          `${sym("fairy", t("Fairy", "Fada"))} ${t("First score points as usual. After that:", "Primeiro pontue normalmente. Depois disso:")}`,
          rl("Earn it", "if this turn you completed at least 1 road or city that scored you no points (no matter whether someone else scored it), you may take the fairy from where it is and assign it to one of your meeple in the landscape; stand it next to that meeple.", "Ganhá-la", "se neste turno você completou ao menos 1 estrada ou cidade que não lhe deu pontos (não importa se outro pontuou), pode pegar a fada de onde estiver e atribuí-la a um dos seus meeples na paisagem; ponha-a ao lado desse meeple."),
          rl("3 points", "during the game, when a feature is scored in which the fairy's meeple stands, its owner scores 3 points — even without scoring the feature itself.", "3 pontos", "durante o jogo, quando uma construção em que está o meeple da fada é pontuada, o dono dele marca 3 pontos — mesmo sem pontuar a construção."),
          rl("Never alone", "whenever the fairy's meeple is moved or removed (for example by scoring), put the fairy next to the play area.", "Nunca sozinha", "sempre que o meeple da fada for movido ou removido (por exemplo pela pontuação), ponha a fada ao lado da área de jogo."),
          rl("Final scoring", "if the fairy still stands next to one of your meeple, you score 3 points for it — once, on top of what that meeple's unfinished feature scores.", "Pontuação final", "se a fada ainda estiver ao lado de um meeple seu, você marca 3 pontos por ela — uma vez só, além do que a construção inacabada desse meeple pontuar.")
        ], ["d5", "d6", "d8"], "ccs-step-3")}
        ${infoCard(t("STEP 1 · PROTECTION", "PASSO 1 · PROTEÇÃO"), t("The fairy chases the dragon away", "A fada espanta o dragão"), [
          rl("Dragon enters the fairy's tile", "the dragon is immediately removed from the play area; the fairy and its meeple stay, but every other meeple on that tile is removed.", "Dragão entra na peça da fada", "o dragão sai imediatamente da área de jogo; a fada e o meeple dela ficam, mas todos os outros meeples dessa peça são removidos."),
          rl("Movements end", "the dragon's remaining movement is cancelled; play continues as usual.", "Movimentos acabam", "o movimento restante do dragão é cancelado; o jogo segue normalmente."),
          rl("In front of you", "the owner of the protected meeple places the dragon in front of them.", "À sua frente", "o dono do meeple protegido põe o dragão à frente dele."),
          rl("Back into play", "at the start of that player's own next turn, they must place it on a dragon hoard of their choice and orient it, then draw a tile.", "De volta ao jogo", "no início do próprio turno seguinte, esse jogador precisa pô-lo num tesouro do dragão à sua escolha e orientá-lo, e então comprar uma peça."),
          rl("Hoard drawn meanwhile", "whoever places a dragon-hoard tile puts the dragon on it, even if it is in front of a player.", "Tesouro comprado antes", "quem colocar uma peça de tesouro do dragão põe o dragão nela, mesmo que ele esteja à frente de um jogador.")
        ], ["d6", "d8"], "ccs-step-1")}
        ${infoCard(t("STEP 2 · MAGIC PORTAL", "PASSO 2 · PORTAL MÁGICO"), t("Place a meeple anywhere", "Coloque um meeple em qualquer lugar"), [
          `${sym("magic-portal", t("Magic portal", "Portal mágico"))} ${t("After placing a tile with a magic portal, you may place a meeple on this tile as usual or on any other tile in the landscape.", "Depois de colocar uma peça com portal mágico, você pode colocar um meeple nesta peça como de costume ou em qualquer outra peça da paisagem.")}`,
          rl("Usual rules", "the feature must still be unoccupied and the figure must fit it.", "Regras normais", "a construção ainda precisa estar desocupada e a figura precisa poder ir nela."),
          rl("Not allowed", "in completed features or on tiles with a dragon hoard.", "Não permitido", "em construções completas nem em peças com tesouro do dragão."),
          on("abbot") ? rl("Abbot", "counts as a meeple: it may use the portal too.", "Abade", "conta como meeple: também pode usar o portal.") : "",
          on("farmers") ? rl("Fields", "are never “completed”, even if enclosed on all sides.", "Campos", "nunca estão “completos”, mesmo fechados por todos os lados.") : ""
        ], ["d7", "d8"], "ccs-step-2")}
        ${infoCard(t("SPECIAL LAND TILES", "PEÇAS ESPECIAIS"), on("farmers") ? t("Tunnel and corners", "Túnel e cantos") : t("Tunnel", "Túnel"), [
          rl("Tunnel", `one single road that is not closed at either end: it passes through a tunnel under the city${on("farmers") ? "; the fields above and below are not divided by it" : ""}.`, "Túnel", `uma única estrada que não está fechada em nenhuma ponta: ela passa por um túnel sob a cidade${on("farmers") ? "; os campos de cima e de baixo não são divididos por ela" : ""}.`),
          on("farmers") ? rl("City corner", "where the wall meets the corner, the corner separates the two fields.", "Canto de cidade", "onde a muralha encontra o canto, o canto separa os dois campos.") : ""
        ], ["d7"])}
      </div>
      ${on("river") ? "" : `<p class="ccs-note">${t("Without The River, the double source and the double lake stay in the box; the dragon enters play on the first dragon-hoard land tile.", "Sem The River, a nascente dupla e o lago duplo ficam na caixa; o dragão entra em jogo na primeira peça de terreno com tesouro do dragão.")} ${referenceLink("d1")}</p>`}
      <div class="ccs-figure-row">
        ${figure("dragon-movement", "Dragon movement example: two straight movements, a meeple removed", "Exemplo de movimento do dragão: dois movimentos retos, um meeple removido", "You draw a dragon symbol: the dragon moves straight until no tile is ahead and turns toward the meeple in line; its second movement enters your tile and removes that meeple; you then orient it toward the blue meeple.", "Você compra um símbolo de dragão: o dragão segue reto até não haver peça à frente e vira para o meeple em linha; o segundo movimento entra na sua peça e remove esse meeple; então você o orienta para o meeple azul.", "d4")}
        ${figure("fairy-protection", "Fairy protection example", "Exemplo de proteção da fada", "The dragon heads for the fairy's tile, removing the blue meeple on the way; Yellow's meeple is protected, so the dragon is removed and Yellow places it in front of them.", "O dragão vai até a peça da fada, removendo o meeple azul no caminho; o meeple amarelo está protegido, então o dragão sai e Amarelo o põe à sua frente.", "d6")}
      </div>`;
  }

  function festivalSection() {
    return `
      ${sectionHeading("festival", "The Festival", ["f"])}
      <p class="glossary-intro">${t(`A mini-expansion for Carcassonne's 15th anniversary: ${BOX.festival} land tiles with the “15” symbol ${markerIcon("festival")}. It was developed for the base game; there are no official rules for combinations with other expansions.`, `Uma mini do 15º aniversário de Carcassonne: ${BOX.festival} peças de terreno com o símbolo “15” ${markerIcon("festival")}. Foi feita para o jogo base; não há regras oficiais para combinações com outras expansões.`)} ${referenceLink("f")}</p>
      <div class="quick-grid">
        ${infoCard(t("STEPS 1–2", "PASSOS 1–2"), t("Festival tiles", "Peças de festival"), [
          rl("Place the tile", "as usual.", "Colocar a peça", "normalmente."),
          rl("Place a meeple", "you may place one of your meeple on the festival tile by the usual rules.", "Colocar um meeple", "você pode colocar um dos seus meeples na peça de festival pelas regras normais."),
          rl("…or leave early", "if you choose not to place one, you may instead return any one of your meeple from the landscape to your supply. It scores nothing.", "…ou sair mais cedo", "se escolher não colocar, você pode em vez disso devolver à sua reserva qualquer um dos seus meeples da paisagem. Ele não pontua nada.")
        ], ["f"], "ccs-step-2")}
      </div>`;
  }

  function drawbridgesSection() {
    return `
      ${sectionHeading("drawbridges", "The Drawbridges", ["b"])}
      <p class="glossary-intro">${t(`A mini-expansion: ${BOX.drawbridges} land tiles with a drawbridge ${markerIcon("drawbridges")} at each city gate. Steps 1 and 2 are as usual. It was developed for the base game; there are no official rules for combinations with other expansions.`, `Uma mini: ${BOX.drawbridges} peças de terreno com uma ponte levadiça ${markerIcon("drawbridges")} em cada portão de cidade. Os passos 1 e 2 são normais. Foi feita para o jogo base; não há regras oficiais para combinações com outras expansões.`)} ${referenceLink("b")}</p>
      <div class="quick-grid">
        ${infoCard(t("STEP 3", "PASSO 3"), t("Completing a road to a drawbridge", "Completando uma estrada até uma ponte levadiça"), [
          rl("First", "score the road as usual.", "Primeiro", "pontue a estrada normalmente."),
          rl("Bridge up", "if the city with the drawbridge is completed, the drawbridge is up: nothing else happens. Completing the road and that city at the same time counts as completed — bridge up.", "Ponte erguida", "se a cidade com a ponte levadiça está completa, a ponte está erguida: nada mais acontece. Completar a estrada e essa cidade ao mesmo tempo conta como completa — ponte erguida."),
          rl("Bridge down", "if the city is still incomplete, the drawbridge is down: the player with the majority on the road may move their meeple from the road into that city.", "Ponte abaixada", "se a cidade ainda está incompleta, a ponte está abaixada: quem tem a maioria na estrada pode mover os meeples dele da estrada para essa cidade."),
          rl("Doesn't matter", "who completed the road, or whether the city already has meeple (yours or others').", "Não importa", "quem completou a estrada, nem se a cidade já tem meeples (seus ou de outros)."),
          rl("No single majority", "if no single player has the majority on the road, nobody moves.", "Sem maioria única", "se nenhum jogador sozinho tem a maioria na estrada, ninguém se move."),
          rl("Everyone else", "returns their road meeple to their supply as usual.", "Os demais", "devolvem os meeples da estrada às reservas normalmente.")
        ], ["b"], "ccs-step-3")}
        ${infoCard(t("SPECIAL CASE", "CASO ESPECIAL"), t("Several drawbridges or several meeple", "Várias pontes ou vários meeples"), [
          rl("Several drawbridges on the road", "you choose into which of the incomplete cities you place your meeple.", "Várias pontes na estrada", "você escolhe para qual das cidades incompletas vai o seu meeple."),
          rl("Several of your meeple", "decide for each one: move it to one of the incomplete cities, or take it back.", "Vários meeples seus", "decida para cada um: movê-lo para uma das cidades incompletas, ou recolhê-lo."),
          rl("Spread or together", "moved meeple may all go to one city or to different incomplete cities.", "Juntos ou separados", "os meeples movidos podem ir todos para uma cidade ou para cidades incompletas diferentes.")
        ], ["b"])}
        ${infoCard(t("NEW LAND TILES", "PEÇAS NOVAS"), t("Reading the drawbridge tiles", "Lendo as peças com ponte"), [
          rl("Road passing a drawbridge", "a drawbridge does not close a road by itself: where the road runs past the gate and continues, it is complete only when both of its ends are closed elsewhere.", "Estrada que passa por uma ponte", "uma ponte levadiça não fecha uma estrada sozinha: onde a estrada passa pelo portão e continua, ela só fica completa quando as duas pontas estiverem fechadas em outro lugar."),
          rl("Road between two cities", "a road can lead to 2 separate cities, each with a drawbridge.", "Estrada entre duas cidades", "uma estrada pode levar a 2 cidades separadas, cada uma com ponte levadiça."),
          on("farmers") ? rl("Moats", "ditches or moats are not a boundary: the meadows extend right up to the city.", "Fossos", "valas e fossos não são divisa: os campos vão até a cidade.") : ""
        ], ["b"])}
      </div>
      ${figure("drawbridges-example", "Drawbridge example: a road with drawbridges at both ends", "Exemplo de ponte levadiça: uma estrada com pontes nas duas pontas", "You complete a road with drawbridges at both ends leading to incomplete cities. With the majority you score 6; Blue scores nothing and takes their meeple back. You move one of your two meeple into the bigger city and return the other.", "Você completa uma estrada com pontes levadiças nas duas pontas que levam a cidades incompletas. Com a maioria você marca 6; Azul não marca nada e recolhe o meeple. Você move um dos seus dois meeples para a cidade maior e recolhe o outro.", "b")}`;
  }

  function cathedralsSection() {
    return `
      ${sectionHeading("cathedrals", "German Cathedrals", ["g1", "g2", "g3"])}
      <p class="glossary-intro">${t(`A mini-expansion: ${BOX.cathedrals} tiles with well-known German cathedrals (Cologne, Munich's Frauenkirche, Dresden, Hamburg's St. Michael's, Ulm, Aachen). Unlike the cathedrals of Inns & Cathedrals, these stand in the fields and have their own function; each tile has 3 or 4 road segments starting from the cathedral. Developed for the base game; the booklet answers a few combinations.`, `Uma mini: ${BOX.cathedrals} peças com catedrais alemãs famosas (Colônia, Frauenkirche de Munique, Dresden, São Miguel de Hamburgo, Ulm, Aachen). Diferente das catedrais de Inns & Cathedrals, estas ficam no campo e têm função própria; cada peça tem 3 ou 4 trechos de estrada saindo da catedral. Feita para o jogo base; o livreto responde algumas combinações.`)} ${referenceLink("g1")}</p>
      <div class="quick-grid">
        ${infoCard(t("STEPS 1–2", "PASSOS 1–2"), t("Placing a cathedral tile", "Colocando uma peça de catedral"), [
          rl("Tile", "place it by the usual rules.", "Peça", "coloque-a pelas regras normais."),
          rl("Meeple", `you may place one of your meeple on it by the usual rules: on a road${on("farmers") ? ", in a field" : ""} or on the cathedral as an archbishop.`, "Meeple", `você pode colocar um dos seus meeples nela pelas regras normais: numa estrada${on("farmers") ? ", num campo" : ""} ou na catedral como arcebispo.`),
          rl("Highwayman", "the name for a meeple on a road leading to a cathedral.", "Salteador", "o nome do meeple numa estrada que leva a uma catedral."),
          interpretation("the roads start at the cathedral, so the cathedral closes them at that end (as in the booklet's examples).", "as estradas começam na catedral, então a catedral as fecha nessa ponta (como nos exemplos do livreto).")
        ], ["g1"], "ccs-step-2")}
        ${infoCard(t("STEP 3", "PASSO 3"), t("Scoring", "Pontuação"), [
          rl("Closed road", `a completed road leading directly to a cathedral gives its highwayman 2 points per tile of the road${on("inns") ? " (3 with an inn)" : ""}.`, "Estrada fechada", `uma estrada completa que leva diretamente a uma catedral dá ao salteador 2 pontos por peça da estrada${on("inns") ? " (3 com estalagem)" : ""}.`),
          rl("Loop on the cathedral", "a road that leaves the cathedral on one segment and comes back on another: unlike the base rules, the two road segments are counted separately, so the cathedral tile counts twice. It is still one road, scored once (booklet example: cathedral ×2 + 3 other tiles = 5 tiles × 2 = 10).", "Laço na catedral", "uma estrada que sai da catedral por um trecho e volta por outro: diferente das regras base, os dois trechos são contados separadamente, então a peça da catedral conta duas vezes. Continua sendo uma estrada, pontuada uma vez (exemplo do livreto: catedral ×2 + 3 outras peças = 5 peças × 2 = 10)."),
          rl("Cathedral", `scored only once all roads leading to it are closed: the archbishop scores 1 point per road tile of all those roads${on("inns") ? " (2 on closed roads with an inn)" : ""}; the 3 or 4 road segments on the cathedral tile are counted separately.`, "Catedral", `só pontua quando todas as estradas que levam a ela estão fechadas: o arcebispo marca 1 ponto por peça de estrada de todas essas estradas${on("inns") ? " (2 nas estradas fechadas com estalagem)" : ""}; os 3 ou 4 trechos de estrada da peça da catedral contam separadamente.`),
          rl("Afterwards", "take the meeple back as usual.", "Depois", "recolha o meeple como de costume."),
          interpretation("several highwaymen on one road: the usual majority rule decides who scores.", "vários salteadores na mesma estrada: a regra normal de maioria decide quem pontua.")
        ], on("inns") ? ["g2", "g3"] : ["g2"], "ccs-step-3")}
        ${infoCard(t("FINAL SCORING", "PONTUAÇÃO FINAL"), t("Unfinished roads and cathedrals", "Estradas e catedrais inacabadas"), [
          rl("Highwayman", "1 point per tile of an unfinished road leading to a cathedral.", "Salteador", "1 ponto por peça de uma estrada inacabada que leva a uma catedral."),
          rl("Archbishop", "1 point per road tile leading to an unfinished cathedral.", "Arcebispo", "1 ponto por peça de estrada que leva a uma catedral inacabada."),
          on("inns") ? rl("With inns", "unfinished roads with an inn are worth 0 for the highwayman and the archbishop (see Combining expansions).", "Com estalagens", "estradas inacabadas com estalagem valem 0 para o salteador e o arcebispo (veja Combinando expansões).") : ""
        ], on("inns") ? ["g2", "g3"] : ["g2"])}
      </div>
      <div class="ccs-figure-row">
        ${figure("german-cathedrals-tiles", "The six German cathedral tiles", "As seis peças de catedral alemã", "The six tiles: Cologne Cathedral, Frauenkirche Munich, Dresden Cathedral, St. Michael's Church Hamburg, Ulm Minster, Aachen Cathedral.", "As seis peças: Catedral de Colônia, Frauenkirche de Munique, Catedral de Dresden, Igreja de São Miguel de Hamburgo, Catedral de Ulm, Catedral de Aachen.", "g1", "is-wide")}
        ${figure("german-cathedrals-example", "Archbishop and highwayman scoring example", "Exemplo de pontuação de arcebispo e salteador", "You finish the cathedral, whose 3 road segments form two closed roads: a loop counting 5 road tiles (the cathedral twice) and Blue's road of 3 tiles. Your archbishop scores 5 + 3 = 8 points; Blue's highwayman scores 3 × 2 = 6.", "Você termina a catedral, cujos 3 trechos de estrada formam duas estradas fechadas: um laço que conta 5 peças de estrada (a catedral duas vezes) e a estrada azul de 3 peças. Seu arcebispo marca 5 + 3 = 8 pontos; o salteador azul marca 3 × 2 = 6.", "g2")}
      </div>`;
  }

  // ---------- combinations ----------

  function combinationItems() {
    const items = [];
    if (on("inns") && on("cathedrals")) {
      items.push({
        title: t("Inns & Cathedrals + German Cathedrals", "Inns & Cathedrals + German Cathedrals"),
        lines: [
          rl("Official", "a closed road with an inn leading to a cathedral gives the highwayman 3 points per tile instead of 2, and the archbishop 2 instead of 1. Unfinished roads with an inn are worth 0 at the end — for the highwayman and the archbishop.", "Oficial", "uma estrada fechada com estalagem que leva a uma catedral dá ao salteador 3 pontos por peça em vez de 2, e ao arcebispo 2 em vez de 1. Estradas inacabadas com estalagem valem 0 no fim — para o salteador e o arcebispo."),
          interpretation("source conflict: the 2025 Inns & Cathedrals booklet scores an ordinary unfinished inn road 1 per tile, while the 2020 German Cathedrals booklet keeps 0 for inn roads leading to its cathedrals. The guide applies the German Cathedrals rule only to highwaymen and archbishops and 1 per tile to every other traveler.", "conflito de fontes: o livreto de Inns & Cathedrals (2025) dá 1 por peça a uma estrada comum inacabada com estalagem, enquanto o de German Cathedrals (2020) mantém 0 para estradas com estalagem que levam às suas catedrais. O guia aplica a regra de German Cathedrals só a salteadores e arcebispos e 1 por peça a todos os outros viajantes."),
          interpretation("at the final scoring an archbishop counts every closed road at 1 per tile; the 2-per-tile inn rate applies when the cathedral itself is completed.", "na pontuação final o arcebispo conta cada estrada fechada a 1 por peça; a taxa de 2 por peça da estalagem vale quando a própria catedral é completada."),
          interpretation("the large meeple's eligible features are road, city, monastery and field, so it can be a highwayman but not an archbishop.", "as construções permitidas ao meeple grande são estrada, cidade, mosteiro e campo, então ele pode ser salteador mas não arcebispo.")
        ],
        refs: ["g3", "i2", "i4"]
      });
    }
    if (on("dragon") && on("cathedrals")) {
      items.push({
        title: t("Dragon & Fairy + German Cathedrals", "Dragon & Fairy + German Cathedrals"),
        lines: [
          rl("Official", "the dragon eats the archbishop when it moves onto a cathedral tile.", "Oficial", "o dragão devora o arcebispo quando entra numa peça de catedral."),
          interpretation("the booklet says “third expansion”; with Dragon & Fairy this matches its own rule — the dragon removes every meeple on the tiles it enters.", "o livreto diz “terceira expansão”; com Dragon & Fairy isso coincide com a regra dela — o dragão remove todos os meeples das peças em que entra.")
        ],
        refs: ["g3", "d4"]
      });
    }
    if (on("abbot") && on("festival")) {
      items.push({
        title: t("The Abbot + The Festival", "The Abbot + The Festival"),
        lines: [
          interpretation("both are used when you place no figure. On a festival tile choose one: return any one of your meeple for no points (the abbot included), or recall your abbot and score its monastery or garden.", "as duas valem quando você não coloca nenhuma figura. Numa peça de festival escolha uma: devolver qualquer meeple seu sem pontos (inclusive o abade), ou recolher o abade e pontuar o mosteiro ou jardim dele.")
        ],
        refs: ["f", "s2"]
      });
    }
    if (on("abbot") && on("dragon")) {
      items.push({
        title: t("The Abbot + Dragon & Fairy", "The Abbot + Dragon & Fairy"),
        lines: [
          rl("Official", "the abbot counts as a meeple for the magic portal, and the dragon removes it like any meeple.", "Oficial", "o abade conta como meeple para o portal mágico, e o dragão o remove como qualquer meeple."),
          interpretation("since the abbot counts as a meeple, the fairy may also be assigned to it.", "como o abade conta como meeple, a fada também pode ser atribuída a ele.")
        ],
        refs: ["d5", "d7"]
      });
    }
    if (on("dragon") && on("festival")) {
      items.push({
        title: t("Dragon & Fairy + The Festival", "Dragon & Fairy + The Festival"),
        lines: [
          rl("Fairy", "if the meeple you return from a festival tile carries the fairy, the fairy goes next to the play area (it never stands alone).", "Fada", "se o meeple que você recolhe por uma peça de festival estiver com a fada, a fada vai para o lado da área de jogo (ela nunca fica sozinha).")
        ],
        refs: ["d6", "f"]
      });
    }
    if (on("dragon") && on("drawbridges")) {
      items.push({
        title: t("Dragon & Fairy + The Drawbridges", "Dragon & Fairy + The Drawbridges"),
        lines: [
          rl("Fairy", "a meeple that crosses a drawbridge into the city is “moved”: its fairy goes next to the play area — after the 3 fairy points for the road, if it was there.", "Fada", "um meeple que atravessa a ponte para a cidade é “movido”: a fada dele vai para o lado da área de jogo — depois dos 3 pontos da fada pela estrada, se ela estava lá."),
          interpretation("moving meeple across drawbridges is part of the scoring step; the fairy is earned only after it.", "mover meeples pelas pontes faz parte do passo de pontuação; a fada só é ganha depois disso.")
        ],
        refs: ["d6", "b"]
      });
    }
    if (on("inns") && on("drawbridges")) {
      items.push({
        title: t("Inns & Cathedrals + The Drawbridges", "Inns & Cathedrals + The Drawbridges"),
        lines: [
          interpretation("the majority on the road counts strength (large meeple = 2); a road with an inn scores 2 per tile before the drawbridge check.", "a maioria na estrada conta força (meeple grande = 2); uma estrada com estalagem vale 2 por peça antes da verificação da ponte.")
        ],
        refs: ["i3", "b"]
      });
    }
    if (on("inns") && on("abbot")) {
      items.push({
        title: t("Inns & Cathedrals + The Abbot", "Inns & Cathedrals + The Abbot"),
        lines: [
          rl("Pink abbot", "the pink set includes an abbot, so a 6th player also has one.", "Abade rosa", "o conjunto rosa inclui um abade, então o 6º jogador também tem um."),
          rl("Gardens", "only the abbot may occupy a garden — not the large meeple.", "Jardins", "só o abade pode ocupar um jardim — não o meeple grande.")
        ],
        refs: ["i1", "s2"]
      });
    }
    if (on("abbot") && on("cathedrals")) {
      items.push({
        title: t("The Abbot + German Cathedrals", "The Abbot + German Cathedrals"),
        lines: [
          rl("Archbishop", "the abbot may stand only on a monastery or a garden, so it cannot be an archbishop.", "Arcebispo", "o abade só pode ficar num mosteiro ou num jardim, então não pode ser arcebispo.")
        ],
        refs: ["s2", "g1"]
      });
    }
    if (on("festival") || on("drawbridges")) {
      const minis = [on("festival") ? "The Festival" : "", on("drawbridges") ? "The Drawbridges" : ""].filter(Boolean).join(t(" and ", " e "));
      const others = activeModules().filter((key) => !["farmers", "festival", "drawbridges"].includes(key));
      if (others.length) {
        items.push({
          title: t("No official combination rules", "Sem regras oficiais de combinação"),
          lines: [t(`${minis}: the publisher states there will be no official rules for combinations with other expansions. Where this guide combines them, it marks its reading.`, `${minis}: a editora avisa que não haverá regras oficiais para combinações com outras expansões. Onde este guia as combina, ele marca a sua leitura.`)],
          refs: [on("festival") ? "f" : "", on("drawbridges") ? "b" : ""].filter(Boolean)
        });
      }
    }
    return items;
  }

  function combinationsSection() {
    const items = combinationItems();
    if (!items.length) {
      return "";
    }
    return `
      ${sectionHeading("combinations", t("Combining expansions", "Combinando expansões"), [...new Set(items.flatMap((item) => item.refs))])}
      <p class="glossary-intro">${t("Rules that only matter because several of the selected modules meet. “Official” rules are printed in a booklet; the rest are the guide's readings.", "Regras que só importam porque vários dos módulos selecionados se encontram. Regras “oficiais” estão impressas num livreto; o resto são leituras do guia.")}</p>
      <div class="quick-grid">${items.map((item) => infoCard(t("COMBINATION", "COMBINAÇÃO"), item.title, item.lines, item.refs)).join("")}</div>`;
  }

  // ---------- end ----------

  function endSection() {
    const lines = [
      rl("Roads", `1 point per road tile, as for a completed road${on("inns") ? " — inns add nothing" : ""}.`, "Estradas", `1 ponto por peça de estrada, como numa estrada completa${on("inns") ? " — estalagens não acrescentam nada" : ""}.`),
      rl("Cities", `1 point per city tile and shield — half of what it would score during the game${on("inns") ? "; cathedrals add nothing" : ""}.`, "Cidades", `1 ponto por peça de cidade e brasão — metade do que valeria durante o jogo${on("inns") ? "; catedrais não acrescentam nada" : ""}.`),
      rl("Monasteries", `1 point + 1 per surrounding tile${on("abbot") ? "; the same for gardens, and the abbot scores like a monk" : ""}.`, "Mosteiros", `1 ponto + 1 por peça em volta${on("abbot") ? "; o mesmo para jardins, e o abade pontua como monge" : ""}.`),
      on("cathedrals") ? rl("German cathedrals", `highwaymen and archbishops: 1 point per road tile leading to the cathedral${on("inns") ? " (unfinished roads with an inn: 0)" : ""}.`, "Catedrais alemãs", `salteadores e arcebispos: 1 ponto por peça de estrada que leva à catedral${on("inns") ? " (estradas inacabadas com estalagem: 0)" : ""}.`) : "",
      on("farmers") ? rl("Fields", "3 points per completed city adjacent to the field, to the farmer majority.", "Campos", "3 pontos por cidade completa adjacente ao campo, para a maioria de camponeses.") : "",
      on("dragon") ? rl("Fairy", "3 points, once, to the owner of the meeple with the fairy.", "Fada", "3 pontos, uma vez só, para o dono do meeple com a fada.") : "",
      rl("Majority", `as during the game: most meeple${on("inns") ? " (strength)" : ""} in the feature scores; ties all score.`, "Maioria", `como durante o jogo: quem tem mais meeples${on("inns") ? " (força)" : ""} na construção pontua; empatados todos pontuam.`)
    ];
    return `
      ${sectionHeading("end", t("Game end & final scoring", "Fim e pontuação final"), on("dragon") ? ["c6", "d6"] : ["c6"])}
      <div class="quick-grid">
        ${infoCard(t("GAME END", "FIM DE JOGO"), t("When does it end?", "Quando termina?"), [
          rl("Trigger", "the game ends when all land tiles have been placed and a player is unable to draw and place a tile on their turn. The turn that placed the last tile is played out normally (meeple and scoring).", "Gatilho", "o jogo termina quando todas as peças de terreno foram colocadas e um jogador não consegue comprar e colocar uma peça no turno. O turno que colocou a última peça é jogado normalmente (meeple e pontuação)."),
          rl("Then", "resolve the final scoring.", "Então", "faça a pontuação final."),
          rl("Winner", "the player with the most points wins. If there is a draw, the tied players are joint winners.", "Vencedor", "vence quem tiver mais pontos. Em caso de empate, os empatados vencem juntos.")
        ], ["c6"], "victory-card")}
        ${infoCard(t("FINAL SCORING", "PONTUAÇÃO FINAL"), t("Every meeple still in the landscape scores", "Todo meeple ainda na paisagem pontua"), [
          t("Completed features were already scored, so only unfinished features score now:", "Construções completas já foram pontuadas, então só as inacabadas pontuam agora:"),
          ...lines
        ], on("dragon") ? ["c6", "d6"] : ["c6"])}
      </div>`;
  }

  // ---------- iconography ----------

  function multiIconCard(files, title, body, codes) {
    return `
      <article class="icon-card ccs-multi-icon">
        <span class="ccs-icon-strip">${files.map(([file, alt]) => `<img src="${ICONS}${file}.webp" alt="${alt}">`).join("")}</span>
        <div><strong>${title}</strong><p>${body}</p>${refs(codes)}</div>
      </article>`;
  }

  function iconsSection() {
    const figures = [
      multiIconCard(COLORS.map((color) => [`meeple-${color.id}`, t(`${color.en} meeple`, `meeple ${color.pt}`)]), t("Meeple", "Meeple"),
        t(`Your followers, 8 per color${on("inns") ? " (pink from Inns & Cathedrals)" : ""}: 7 in your supply and 1 on the scoreboard. A meeple becomes a traveler, knight${on("farmers") ? ", monk or farmer" : " or monk"} depending on where it stands.`, `Seus seguidores, 8 por cor${on("inns") ? " (rosa de Inns & Cathedrals)" : ""}: 7 na reserva e 1 no tabuleiro de pontuação. Um meeple vira viajante, cavaleiro${on("farmers") ? ", monge ou camponês" : " ou monge"} conforme onde fica.`), ["c2"]),
      on("abbot") ? multiIconCard(COLORS.map((color) => [`abbot-${color.id}`, t(`${color.en} abbot`, `abade ${color.pt}`)]), t("Abbot (or abbess)", "Abade (ou abadessa)"),
        t("One per color. Goes only on a monastery or a garden; may be recalled early to score.", "Um por cor. Só vai num mosteiro ou num jardim; pode ser recolhido antes para pontuar."), ["c2", "s2"]) : "",
      on("inns") ? iconCard("large-meeple", "Large meeple", "Strength 2. Eligible features: road, city, monastery, field. Placed instead of a meeple, on features without a meeple.", "Meeple grande", "Força 2. Construções permitidas: estrada, cidade, mosteiro, campo. Colocado no lugar de um meeple, em construções sem meeple.", ["i3", "i4"]) : "",
      on("dragon") ? iconCard("dragon", "Dragon", "Neutral figure. Orients itself toward directly adjacent tiles and meeple; with several options, choose one.", "Dragão", "Figura neutra. Orienta-se para peças diretamente adjacentes e meeples; com várias opções, escolha uma.", ["d8"]) : "",
      on("dragon") ? iconCard("fairy", "Fairy", "Neutral figure. Assigned to one of your meeple when you complete a road or city without scoring; worth 3 points when that feature is scored and at the final scoring; protects its meeple from the dragon.", "Fada", "Figura neutra. Atribuída a um dos seus meeples quando você completa uma estrada ou cidade sem pontuar; vale 3 pontos quando essa construção é pontuada e na pontuação final; protege o meeple do dragão.", ["d5", "d6", "d8"]) : ""
    ];
    const tiles = [
      iconCard("shield", "Shield (coat of arms)", `Printed in some city segments: +2 points when the city is completed${on("inns") ? " (+3 with a cathedral)" : ""}, +1 in the final scoring.`, "Brasão (shield / coat of arms)", `Impresso em alguns trechos de cidade: +2 pontos quando a cidade é completada${on("inns") ? " (+3 com catedral)" : ""}, +1 na pontuação final.`, on("inns") ? ["c4", "c6", "i2"] : ["c4", "c6"]),
      on("abbot")
        ? iconCard("garden", "Garden", "Only an abbot may occupy it; it is scored exactly like a monastery.", "Jardim", "Só um abade pode ocupá-lo; pontua exatamente como um mosteiro.", ["s2"])
        : iconCard("garden", "Garden", "Used only with The Abbot. In this match it is scenery: nobody can be placed on it.", "Jardim", "Usado só com The Abbot. Nesta partida é decoração: ninguém pode ser colocado nele.", ["c2", "s2"]),
      on("inns") ? iconCard("inn", "Inn", "2 points per tile for a completed road with an inn; 1 point per tile in the final scoring.", "Estalagem (inn)", "2 pontos por peça para uma estrada completa com estalagem; 1 ponto por peça na pontuação final.", ["i2", "i4"]) : "",
      on("inns") ? iconCard("cathedral", "Cathedral", "3 points per tile and coat of arms for a completed city with a cathedral; 1 point per tile and coat of arms in the final scoring.", "Catedral (cathedral)", "3 pontos por peça e brasão para uma cidade completa com catedral; 1 ponto por peça e brasão na pontuação final.", ["i2", "i4"]) : "",
      on("dragon") ? iconCard("dragon-hoard", "Dragon hoard", "Place the dragon on it and orient it. You may never place a meeple here.", "Tesouro do dragão (dragon hoard)", "Ponha o dragão nela e oriente-o. Você nunca pode colocar um meeple aqui.", ["d3", "d8"]) : "",
      on("dragon") ? iconCard("dragon-symbol", "Dragon symbol", "Before you place the tile: move the dragon straight ahead and orient it, then move and orient it again; it removes the meeple on the tiles it enters.", "Símbolo de dragão (dragon symbol)", "Antes de colocar a peça: mova o dragão em linha reta e oriente-o, depois mova e oriente de novo; ele remove os meeples das peças em que entra.", ["d4", "d8"]) : "",
      on("dragon") ? iconCard("magic-portal", "Magic portal", "You may place your meeple on a feature on any tile; the usual placement rules apply.", "Portal mágico (magic portal)", "Você pode colocar seu meeple numa construção de qualquer peça; valem as regras normais de colocação.", ["d7", "d8"]) : "",
      on("drawbridges") ? iconCard("drawbridge", "Drawbridge", "At a city gate. Down while its city is incomplete: lets the road majority move into the city when the road is completed.", "Ponte levadiça (drawbridge)", "Num portão de cidade. Abaixada enquanto a cidade está incompleta: deixa a maioria da estrada entrar na cidade quando a estrada é completada.", ["b"]) : "",
      on("festival") ? iconCard("festival-15", "Festival “15” symbol", "Marks the 12 festival tiles: instead of placing a meeple on one, you may take one of yours back.", "Símbolo “15” do Festival", "Marca as 12 peças de festival: em vez de colocar um meeple numa delas, você pode recolher um dos seus.", ["f"]) : ""
    ];
    const markers = [
      on("inns") ? iconCard("inns-cathedrals-marker", "Inns & Cathedrals tile marker", "Printed on its 24 tiles, so you can sort them back out.", "Marca das peças de Inns & Cathedrals", "Impressa nas 24 peças dela, para você separá-las depois.", ["i1"]) : "",
      on("inns") ? iconCard("inns-cathedrals-badge", "Expansion 1", "The Inns & Cathedrals badge on its booklet.", "Expansão 1", "O selo de Inns & Cathedrals no livreto.", ["i1"]) : "",
      on("dragon") ? iconCard("dragon-fairy-marker", "Dragon & Fairy tile marker", "Printed on its 26 land tiles.", "Marca das peças de Dragon & Fairy", "Impressa nas 26 peças de terreno dela.", ["d1"]) : "",
      on("dragon") ? iconCard("dragon-fairy-badge", "Expansion 3", "The Dragon & Fairy badge on its booklet.", "Expansão 3", "O selo de Dragon & Fairy no livreto.", ["d1"]) : "",
      on("festival") ? iconCard("festival-symbol", "The Festival", "The mini-expansion's emblem on its rules sheet.", "The Festival", "O emblema da mini na folha de regras.", ["f"]) : "",
      on("drawbridges") ? iconCard("drawbridges-symbol", "The Drawbridges", "The mini-expansion's emblem on its rules sheet.", "The Drawbridges", "O emblema da mini na folha de regras.", ["b"]) : "",
      on("cathedrals") ? iconCard("german-cathedrals-symbol", "German Cathedrals", "The mini-expansion's emblem (a cathedral silhouette) on its booklet.", "German Cathedrals", "O emblema da mini (uma silhueta de catedral) no livreto.", ["g1"]) : ""
    ].filter(Boolean);
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), ["c2", on("inns") ? "i4" : "", on("dragon") ? "d8" : ""].filter(Boolean))}
      <p class="glossary-intro">${t("Each image is cropped individually from the supplied booklets; only the symbols of this match are shown.", "Cada imagem foi recortada individualmente dos livretos fornecidos; só aparecem os símbolos desta partida.")}</p>
      <h3 class="subhead">${t("Figures", "Figuras")}</h3>
      <div class="icon-grid">${figures.filter(Boolean).join("")}</div>
      <h3 class="subhead">${t("On the tiles", "Nas peças")}</h3>
      <div class="icon-grid">${tiles.filter(Boolean).join("")}</div>
      ${markers.length ? `<h3 class="subhead">${t("Expansion emblems and tile markers", "Emblemas das expansões e marcas das peças")}</h3><div class="icon-grid">${markers.join("")}</div>` : ""}`;
  }

  // ---------- examples ----------

  function examplesSection() {
    const examples = [
      [t("A traveler on a new road", "Um viajante numa estrada nova"), [
        t("You draw a tile with 3 roads leading out of a village and place it so road and fields continue.", "Você compra uma peça com 3 estradas saindo de um vilarejo e a coloca de modo que estrada e campos continuem."),
        t("No meeple is on that road, so you place one as a traveler. The road is incomplete: nothing scores.", "Não há meeple nessa estrada, então você coloca um como viajante. A estrada está incompleta: nada pontua.")
      ], ["c3"]],
      [t("An occupied road", "Uma estrada ocupada"), [
        t("Blue extends the same road, which already has your meeple: Blue cannot place on that road.", "Azul prolonga a mesma estrada, que já tem o seu meeple: Azul não pode colocar nessa estrada."),
        t("Blue places a meeple as a knight on the city of the new tile instead.", "Azul coloca um meeple como cavaleiro na cidade da peça nova.")
      ], ["c3"]],
      [t("Scoring a road", "Pontuando uma estrada"), [
        t("Another player's tile closes your road at both ends: it is complete and must be scored.", "A peça de outro jogador fecha a sua estrada nas duas pontas: ela está completa e precisa ser pontuada."),
        t("3 tiles = 3 points for you. Your traveler returns; Blue's knight stays — the city is not complete.", "3 peças = 3 pontos para você. Seu viajante volta; o cavaleiro azul fica — a cidade não está completa.")
      ], ["c3"]],
      [t("A city of 3 tiles and 1 shield", "Uma cidade de 3 peças e 1 brasão"), [
        t("Your tile extends an empty city by 1 tile, so you place a knight on its city segment.", "Sua peça prolonga uma cidade vazia em 1 peça, então você põe um cavaleiro no trecho de cidade dela."),
        t("Next round your tile closes it: 3 tiles × 2 + 1 shield × 2 = 8 points; your knight returns.", "Na rodada seguinte sua peça a fecha: 3 peças × 2 + 1 brasão × 2 = 8 pontos; seu cavaleiro volta.")
      ], ["c4"]],
      [t("A monastery", "Um mosteiro"), [
        t("You place a monastery tile and a monk on it.", "Você coloca uma peça de mosteiro e um monge nela."),
        t("Later your tile fills the 8th space around it: 9 points, and the monk returns.", "Depois sua peça preenche a 8ª casa em volta: 9 pontos, e o monge volta.")
      ], ["c4"]],
      [t("Not joining an occupied road", "Não se juntar a uma estrada ocupada"), [
        t("Your tile could complete a road that already has a meeple, so you could not place on it.", "Sua peça poderia completar uma estrada que já tem meeple, então você não poderia colocar nela."),
        t("You place the tile matching the landscape but not connected to that road, with your meeple on a new road.", "Você coloca a peça combinando a paisagem mas sem conectar a essa estrada, com o seu meeple numa estrada nova.")
      ], ["c5"]],
      [t("A shared road", "Uma estrada compartilhada"), [
        t("Next turn your tile joins the two incomplete roads, which hold 1 meeple each (yours and Yellow's).", "No turno seguinte sua peça junta as duas estradas incompletas, com 1 meeple cada (o seu e o amarelo)."),
        t("The road is complete: tie for the most meeple, so you and Yellow both score 4 points.", "A estrada está completa: empate na maioria, então você e Amarelo marcam 4 pontos cada.")
      ], ["c5"]],
      [t("Taking over a city", "Tomando uma cidade"), [
        t("You place a city tile not connected to Yellow's city and put a knight on it.", "Você coloca uma peça de cidade não conectada à cidade de Amarelo e põe um cavaleiro nela."),
        t("Later a tile connects all the segments into one completed city: with 2 knights against 1 you alone score the 10 points; everyone's knights return.", "Depois uma peça conecta todos os trechos numa cidade completa: com 2 cavaleiros contra 1 você sozinho marca os 10 pontos; todos os cavaleiros voltam.")
      ], ["c5"]],
      [t("Final scoring", "Pontuação final"), [
        t("Blue: unfinished city of 2 tiles and 1 shield = 3 points.", "Azul: cidade inacabada de 2 peças e 1 brasão = 3 pontos."),
        t("Green: 2 meeple in a large unfinished city of 5 tiles and 3 shields = 8 points; Black, with 1, scores nothing.", "Verde: 2 meeples numa cidade grande inacabada de 5 peças e 3 brasões = 8 pontos; Preto, com 1, não marca nada."),
        t("Yellow: unfinished monastery with 3 surrounding tiles = 4. You: unfinished road of 3 tiles = 3.", "Amarelo: mosteiro inacabado com 3 peças em volta = 4. Você: estrada inacabada de 3 peças = 3.")
      ], ["c6"]],
      on("farmers") ? [t("Placing a farmer", "Colocando um camponês"), [
        t("Your tile adds to a large field running along a road up to a city where you already have a knight.", "Sua peça aumenta um campo grande que segue ao longo de uma estrada até uma cidade onde você já tem um cavaleiro."),
        t("You lay a meeple down on that field as a farmer.", "Você deita um meeple nesse campo como camponês.")
      ], ["s1"]] : null,
      on("farmers") ? [t("Scoring fields", "Pontuando campos"), [
        t("Red and Blue (1 farmer each) share a field touching completed cities A, B and D; city C is not complete: 9 points each.", "Vermelho e Azul (1 camponês cada) dividem um campo que toca as cidades completas A, B e D; a cidade C não está completa: 9 pontos cada."),
        t("Black has more farmers than Yellow on another field touching 4 completed cities: Black scores 12.", "Preto tem mais camponeses que Amarelo em outro campo que toca 4 cidades completas: Preto marca 12."),
        t("Yellow's other farmer, alone in a corner field touching A and B, scores 6.", "O outro camponês amarelo, sozinho num campo de canto que toca A e B, marca 6.")
      ], ["s1"]] : null,
      on("abbot") ? [t("Recalling the abbot", "Recolhendo o abade"), [
        t("You place a tile but no meeple.", "Você coloca uma peça mas nenhum meeple."),
        t("You return your abbot from its garden, which has 5 tiles around it: 6 points.", "Você recolhe o abade do jardim, que tem 5 peças em volta: 6 pontos.")
      ], ["s2"]] : null,
      on("inns") ? [t("Roads with inns", "Estradas com estalagens"), [
        t("A completed road of 3 tiles with an inn: 6 points.", "Uma estrada completa de 3 peças com estalagem: 6 pontos."),
        t("A completed road of 4 tiles with 2 inns: the bonus counts once, 4 × 2 = 8.", "Uma estrada completa de 4 peças com 2 estalagens: o bônus conta uma vez, 4 × 2 = 8.")
      ], ["i2"]] : null,
      on("inns") ? [t("A city with a cathedral", "Uma cidade com catedral"), [
        t("6 city segments and 1 coat of arms, completed with a cathedral: 7 × 3 = 21 points.", "6 trechos de cidade e 1 brasão, completa com catedral: 7 × 3 = 21 pontos.")
      ], ["i2"]] : null,
      on("inns") ? [t("Large meeple majority", "Maioria com meeple grande"), [
        t("Your large meeple and Blue's standard meeple are in one completed city: strength 2 against 1.", "Seu meeple grande e o meeple normal azul estão numa cidade completa: força 2 contra 1."),
        t("You have the majority: you score 8, Blue scores 0.", "Você tem a maioria: você marca 8, Azul marca 0.")
      ], ["i3"]] : null,
      on("inns") && on("farmers") ? [t("Large meeple on a field", "Meeple grande num campo"), [
        t("At the final scoring your large farmer shares a field with Blue's 2 standard farmers.", "Na pontuação final seu camponês grande divide um campo com 2 camponeses normais azuis."),
        t("2 against 2: nobody has the majority, so you both score the field.", "2 contra 2: ninguém tem a maioria, então os dois pontuam o campo.")
      ], ["i3"]] : null,
      on("inns") ? [t("Short roads already complete", "Estradinhas já completas"), [
        t("On the junction tile between two city parts, the two short roads to the city are closed at both ends as soon as the tile is placed.", "Na peça de cruzamento entre duas partes de cidade, as duas estradinhas até a cidade ficam fechadas nas duas pontas assim que a peça é colocada."),
        t("A meeple you place on one of them scores 1 point at once.", "Um meeple que você colocar numa delas marca 1 ponto na hora.")
      ], ["i4"]] : null,
      on("dragon") ? [t("Placing the dragon on a hoard", "Pondo o dragão num tesouro"), [
        t("You place a dragon-hoard tile and put the dragon on it.", "Você coloca uma peça de tesouro do dragão e põe o dragão nela."),
        t("A blue meeple is in a straight line with it, so the dragon must face that meeple; the adjacent tile on the other side is not allowed.", "Um meeple azul está em linha reta com ele, então o dragão precisa olhar para esse meeple; a peça adjacente do outro lado não é permitida.")
      ], ["d3"]] : null,
      on("dragon") && on("river") ? [t("The dragon at the end of the river", "O dragão no fim do rio"), [
        t("After the double lake completes the river, the only tile adjacent to the dragon is the lake's other half, so it can face only that way.", "Depois que o lago duplo completa o rio, a única peça adjacente ao dragão é a outra metade do lago, então ele só pode olhar para lá.")
      ], ["d3"]] : null,
      on("dragon") ? [t("The dragon awakens", "O dragão desperta"), [
        t("You draw a dragon-symbol tile; before placing it the dragon moves twice.", "Você compra uma peça com símbolo de dragão; antes de colocá-la o dragão se move duas vezes."),
        t(`1st movement: straight ahead until no tile is in front; then it turns toward your meeple in line${on("farmers") ? " (a farmer)" : " (a farmer in the picture)"}.`, `1º movimento: em linha reta até não haver peça à frente; depois vira para o seu meeple em linha${on("farmers") ? " (um camponês)" : " (um camponês na imagem)"}.`),
        t("2nd movement: it enters that meeple's tile — your meeple is removed. At the end you choose to orient it toward the blue meeple.", "2º movimento: entra na peça desse meeple — o seu meeple é removido. No fim você escolhe orientá-lo para o meeple azul.")
      ], ["d4"]] : null,
      on("dragon") ? [t("Turning around", "Dando meia-volta"), [
        t("The dragon's 1st movement removes a meeple (an abbot in the picture) and ends where only the tile behind it is adjacent.", "O 1º movimento do dragão remove um meeple (um abade na imagem) e termina onde só a peça atrás dele é adjacente."),
        t("You rotate it 180° to face that tile; the 2nd movement goes back the way it came.", "Você o gira 180° para olhar essa peça; o 2º movimento volta pelo caminho de onde veio.")
      ], ["d5"]] : null,
      on("dragon") ? [t("Earning the fairy", "Ganhando a fada"), [
        t("This turn you completed a road that scored you no points.", "Neste turno você completou uma estrada que não lhe deu pontos."),
        t("You may assign the fairy to one of your meeple.", "Você pode atribuir a fada a um dos seus meeples.")
      ], ["d5"]] : null,
      on("dragon") ? [t("The fairy's protection", "A proteção da fada"), [
        t(`The dragon moves toward the fairy's tile and removes Blue's meeple${on("farmers") ? " (a farmer)" : " (a farmer in the picture)"} on its way.`, `O dragão vai até a peça da fada e remove o meeple azul${on("farmers") ? " (um camponês)" : " (um camponês na imagem)"} no caminho.`),
        t("Yellow's meeple with the fairy is not removed — the dragon is. Yellow places the dragon in front of them.", "O meeple amarelo com a fada não é removido — o dragão é. Amarelo põe o dragão à sua frente.")
      ], ["d6"]] : null,
      on("dragon") ? [t("Through the magic portal", "Pelo portal mágico"), [
        t("You place a magic-portal tile and put your meeple on the incomplete, unoccupied monastery of another tile.", "Você coloca uma peça com portal mágico e põe o seu meeple no mosteiro incompleto e desocupado de outra peça.")
      ], ["d7"]] : null,
      on("festival") ? [t("Leaving for the festival", "Saindo para o festival"), [
        t("You place the festival tile you drew.", "Você coloca a peça de festival que comprou."),
        t("Instead of placing a meeple on it, you take your knight from the city next to it back into your supply.", "Em vez de colocar um meeple nela, você recolhe à reserva o seu cavaleiro da cidade ao lado.")
      ], ["f"]] : null,
      on("drawbridges") ? [t("Over the drawbridge", "Pela ponte levadiça"), [
        t("Your tile completes the road leading to the drawbridge: you score 2 points.", "Sua peça completa a estrada que leva à ponte levadiça: você marca 2 pontos."),
        t("The city is incomplete, so you move your meeple from the road into that city.", "A cidade está incompleta, então você move o seu meeple da estrada para essa cidade.")
      ], ["b"]] : null,
      on("drawbridges") ? [t("Drawbridges at both ends", "Pontes nas duas pontas"), [
        t("You complete a road with drawbridges at both ends leading to incomplete cities. You have 2 meeple there, Blue 1.", "Você completa uma estrada com pontes nas duas pontas que levam a cidades incompletas. Você tem 2 meeples ali, Azul 1."),
        t("You score 6 with the majority; Blue scores nothing and takes their meeple back.", "Você marca 6 com a maioria; Azul não marca nada e recolhe o meeple."),
        t("You move one meeple into the bigger city and return the other to your supply.", "Você move um meeple para a cidade maior e devolve o outro à reserva.")
      ], ["b"]] : null,
      on("cathedrals") ? [t("A road looping on a cathedral", "Uma estrada em laço numa catedral"), [
        t("Your road leaves the cathedral, runs through 3 other tiles and comes back to the same cathedral tile.", "Sua estrada sai da catedral, passa por 3 outras peças e volta à mesma peça de catedral."),
        t("The cathedral tile counts once per road segment: 5 tiles × 2 = 10 points for the closed road.", "A peça da catedral conta uma vez por trecho de estrada: 5 peças × 2 = 10 pontos pela estrada fechada.")
      ], ["g2"]] : null,
      on("cathedrals") ? [t("Archbishop and highwayman", "Arcebispo e salteador"), [
        t("You finish a cathedral whose closed roads are worth 5 and 3: your archbishop scores 8.", "Você termina uma catedral cujas estradas fechadas valem 5 e 3: seu arcebispo marca 8."),
        t("Blue's highwayman scores 6 for the 3-tile closed road.", "O salteador azul marca 6 pela estrada fechada de 3 peças.")
      ], ["g2"]] : null
    ].filter(Boolean);
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), [...new Set(examples.flatMap((example) => example[2]))])}
      <p class="glossary-intro">${t("The booklets' examples that apply to this match. In them, “you” is the red player.", "Os exemplos dos livretos que se aplicam a esta partida. Neles, “você” é o jogador vermelho.")}</p>
      <div class="example-grid">${examples.map(([title, items, codes], index) => `
        <article class="example-card">
          <span class="card-number">${String(index + 1).padStart(2, "0")}</span>
          <h3>${title}</h3>
          ${lineList(items)}
          <div class="example-source"><span>${t("From the booklet's examples", "Dos exemplos do livreto")}</span>${refs(codes)}</div>
        </article>`).join("")}</div>`;
  }

  // ---------- glossary ----------

  function glossarySection() {
    const items = [
      { term: ["Closed end", "Ponta fechada"], en: "Closed end", text: ["Where a road stops: a village, a city, a monastery, a junction, something blocking it — or the road loops into itself.", "Onde uma estrada para: um vilarejo, uma cidade, um mosteiro, um cruzamento, algo que a bloqueia — ou a estrada fecha um laço."], refs: ["c3", "c5"] },
      { term: ["Complete feature", "Construção completa"], en: "Complete", text: ["A road closed at both ends, a city fully walled with no gaps, a monastery surrounded by 8 tiles. Scored at once.", "Uma estrada fechada nas duas pontas, uma cidade toda murada sem buracos, um mosteiro cercado por 8 peças. Pontua na hora."], refs: ["c5"] },
      { term: ["Feature", "Construção"], en: "Feature", text: [`Anything a meeple can occupy and score: road, city, monastery${on("abbot") ? ", garden" : ""}${on("farmers") ? ", field" : ""}${on("cathedrals") ? ", German cathedral" : ""}.`, `Tudo o que um meeple pode ocupar e pontuar: estrada, cidade, mosteiro${on("abbot") ? ", jardim" : ""}${on("farmers") ? ", campo" : ""}${on("cathedrals") ? ", catedral alemã" : ""}.`], refs: ["c4"] },
      { term: ["Knight", "Cavaleiro"], en: "Knight", text: ["A meeple standing in a city.", "Um meeple em pé numa cidade."], refs: ["c4"] },
      { term: ["Land tile", "Peça de terreno"], en: "Land tile", text: ["A square tile showing roads, cities, monasteries and fields. Drawn and placed one per turn.", "Uma peça quadrada com estradas, cidades, mosteiros e campos. Comprada e colocada uma por turno."], refs: ["c2", "c3"] },
      { term: ["Majority", "Maioria"], en: "Majority", text: [`Having the most meeple${on("inns") ? " (by strength)" : ""} in a feature; the majority scores the full points, ties all score.`, `Ter mais meeples${on("inns") ? " (por força)" : ""} numa construção; a maioria recebe os pontos inteiros, empatados todos pontuam.`], refs: ["c5"] },
      { term: ["Meeple", "Meeple"], en: "Meeple", text: ["“My people”: your follower figure. Singular and plural.", "“My people” (minha gente): a sua figura de seguidor. Singular e plural."], refs: ["c2"] },
      { term: ["Monk", "Monge"], en: "Monk", text: ["A meeple standing on a monastery.", "Um meeple em pé num mosteiro."], refs: ["c4"] },
      { term: ["Scoring meeple", "Meeple marcador"], en: "8th meeple", text: ["Your 8th meeple, which marks your points on the scoreboard and never enters the landscape.", "O seu 8º meeple, que marca seus pontos no tabuleiro de pontuação e nunca entra na paisagem."], refs: ["c2", "c3"] },
      { term: ["Segment", "Trecho"], en: "Segment", text: ["The part of one feature printed on one tile; a meeple stands on one segment of the tile just placed.", "A parte de uma construção impressa numa peça; um meeple fica num trecho da peça recém-colocada."], refs: ["c3", "c4"] },
      { term: ["Shield", "Brasão"], en: on("inns") ? "Shield / coat of arms" : "Shield", text: ["A small blue-and-white shield printed in a city segment, worth extra points with the city.", "Um pequeno escudo azul e branco impresso num trecho de cidade, que vale pontos extras com a cidade."], refs: on("inns") ? ["c4", "i2"] : ["c4"] },
      { term: ["Sneaking in", "Infiltrar"], en: "Sneak", text: ["Placing a meeple on a separate segment and connecting it to an occupied feature later.", "Colocar um meeple num trecho separado e conectá-lo depois a uma construção ocupada."], refs: ["c5", "s1"] },
      { term: ["Supply", "Reserva"], en: "Supply", text: ["The meeple in front of you, available to place.", "Os meeples à sua frente, disponíveis para colocar."], refs: ["c2"] },
      { term: ["Village", "Vilarejo"], en: "Village", text: ["A cluster of small houses where roads meet; every road ends there.", "Um grupo de casinhas onde estradas se encontram; toda estrada termina ali."], refs: ["c3"] },
      { term: ["Traveler", "Viajante"], en: "Traveler", text: ["A meeple standing on a road.", "Um meeple em pé numa estrada."], refs: ["c3"] },
      on("farmers") ? { term: ["Farmer", "Camponês"], en: "Farmer", text: ["A meeple lying down on a field; scored only at the end.", "Um meeple deitado num campo; pontua só no fim."], refs: ["s1"] } : null,
      on("farmers") ? { term: ["Field", "Campo"], en: "Field", text: ["The green landscape, divided by roads, cities and other features. Never completed.", "A paisagem verde, dividida por estradas, cidades e outras construções. Nunca fica completa."], refs: ["s1", "d7"] } : null,
      on("abbot") ? { term: ["Abbot", "Abade"], en: "Abbot", text: ["A special figure that occupies only monasteries and gardens and can be recalled early to score.", "Uma figura especial que só ocupa mosteiros e jardins e pode ser recolhida antes para pontuar."], refs: ["s2"] } : null,
      on("abbot") ? { term: ["Garden", "Jardim"], en: "Garden", text: ["A flower garden in the middle of a tile; only the abbot may occupy it; scored like a monastery.", "Um jardim de flores no meio de uma peça; só o abade pode ocupá-lo; pontua como mosteiro."], refs: ["s2"] } : null,
      on("river") ? { term: ["Source / lake", "Nascente / lago"], en: "Source / Lake", text: ["The river's first tile (the starting tile) and its last tile.", "A primeira peça do rio (a peça inicial) e a última."], refs: ["s2"] } : null,
      on("river") ? { term: ["Bend", "Curva"], en: "Bend", text: ["A river tile turning left or right; a bend may not turn the same way as the previous bend.", "Uma peça de rio que vira à esquerda ou à direita; uma curva não pode virar para o mesmo lado da curva anterior."], refs: ["s2", "d2"] } : null,
      on("inns") ? { term: ["Inn", "Estalagem"], en: "Inn", text: ["A building by a pond beside a road: its completed road scores 2 per tile.", "Um prédio junto a uma lagoa ao lado de uma estrada: a estrada completa vale 2 por peça."], refs: ["i2"] } : null,
      on("inns") ? { term: ["Cathedral (in a city)", "Catedral de cidade"], en: "Cathedral", text: ["Inns & Cathedrals: a completed city with one scores 3 per tile and coat of arms.", "Inns & Cathedrals: uma cidade completa com ela vale 3 por peça e brasão."], refs: ["i2"] } : null,
      on("inns") ? { term: ["Large meeple", "Meeple grande"], en: "Large meeple", text: ["A meeple with strength 2 for majorities.", "Um meeple com força 2 nas maiorias."], refs: ["i3"] } : null,
      on("inns") ? { term: ["Strength", "Força"], en: "Strength", text: ["What a figure counts for in a majority: 1 for a meeple, 2 for the large meeple.", "Quanto uma figura conta numa maioria: 1 para o meeple, 2 para o meeple grande."], refs: ["i3", "i4"] } : null,
      on("inns") ? { term: ["Score tile", "Ficha de pontuação"], en: "Score tile 50/100", text: ["Taken when you reach the points shown, to track scores beyond the board.", "Pegue-a ao alcançar os pontos mostrados, para registrar pontos além do tabuleiro."], refs: ["i1"] } : null,
      on("dragon") ? { term: ["Dragon hoard", "Tesouro do dragão"], en: "Dragon hoard", text: ["Tile feature where the dragon is placed; no meeple may ever be on that tile.", "Elemento de peça onde o dragão é colocado; nenhum meeple pode ficar nessa peça."], refs: ["d3"] } : null,
      on("dragon") ? { term: ["Dragon movement", "Movimento do dragão"], en: "Dragon movement", text: ["Straight ahead tile by tile until no tile is in front; removes meeple from the tiles it enters.", "Em linha reta, peça a peça, até não haver peça à frente; remove meeples das peças em que entra."], refs: ["d4"] } : null,
      on("dragon") ? { term: ["Orient", "Orientar"], en: "Orient", text: ["Turn the dragon toward an adjacent tile — toward a meeple in line if there is one.", "Virar o dragão para uma peça adjacente — para um meeple em linha, se houver."], refs: ["d3"] } : null,
      on("dragon") ? { term: ["Fairy", "Fada"], en: "Fairy", text: ["Neutral figure next to one of your meeple: 3 points when that feature scores, protection from the dragon.", "Figura neutra ao lado de um dos seus meeples: 3 pontos quando essa construção pontua, proteção contra o dragão."], refs: ["d5", "d6"] } : null,
      on("dragon") ? { term: ["Magic portal", "Portal mágico"], en: "Magic portal", text: ["Lets you place your meeple on any tile instead of the one just placed.", "Permite colocar seu meeple em qualquer peça em vez da recém-colocada."], refs: ["d7"] } : null,
      on("festival") ? { term: ["Festival tile", "Peça de festival"], en: "Festival tile", text: ["A tile with the “15” symbol: placing no meeple on it lets you take one back.", "Uma peça com o símbolo “15”: não colocar meeple nela permite recolher um."], refs: ["f"] } : null,
      on("drawbridges") ? { term: ["Drawbridge (up / down)", "Ponte levadiça (erguida / abaixada)"], en: "Drawbridge", text: ["Up when its city is complete, down while it is not; down lets the road majority move into the city.", "Erguida quando a cidade está completa, abaixada enquanto não está; abaixada deixa a maioria da estrada entrar na cidade."], refs: ["b"] } : null,
      on("cathedrals") ? { term: ["Archbishop", "Arcebispo"], en: "Archbishop", text: ["A meeple on a German cathedral; scores all its roads when they are all closed.", "Um meeple numa catedral alemã; pontua todas as estradas dela quando todas estiverem fechadas."], refs: ["g1", "g2"] } : null,
      on("cathedrals") ? { term: ["Highwayman", "Salteador"], en: "Highwayman", text: ["A meeple on a road leading to a German cathedral: 2 per tile when the road is completed.", "Um meeple numa estrada que leva a uma catedral alemã: 2 por peça quando a estrada é completada."], refs: ["g2"] } : null
    ].filter(Boolean);
    const lang = state.language === "pt-BR" ? 1 : 0;
    items.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), [...new Set(items.flatMap((item) => item.refs))])}
      <div class="quick-grid glossary-grid">${items.map((item) => `
        <article class="info-card glossary-card">
          <span class="component-label">${t("TERM", "TERMO")}</span>
          <h3>${t(item.term[0], item.term[1])}${lang && item.en !== item.term[1] ? en(item.en) : ""}</h3>
          <p>${t(item.text[0], item.text[1])}</p>
          ${refs(item.refs)}
        </article>`).join("")}</div>`;
  }

  // ---------- render ----------

  function renderInto(host) {
    root = host;
    document.body.classList.add("theme-carcassonne");
    document.documentElement.lang = state.language;
    document.title = t("Carcassonne — Field Manual", "Carcassonne — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Carcassonne: base game with farmers, The River and The Abbot, plus Inns & Cathedrals, Dragon & Fairy, The Festival, The Drawbridges and German Cathedrals — pick what you use and get a filtered setup checklist and rules.",
        "Regras interativas bilíngues de Carcassonne: jogo base com camponeses, The River e The Abbot, mais Inns & Cathedrals, Dragon & Fairy, The Festival, The Drawbridges e German Cathedrals — escolha o que usa e receba lista de preparação e regras filtradas."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook · base game, mini-expansions and expansions", "Livro interativo · jogo base, minis e expansões")}</p>
          <h1>Carcassonne</h1>
          <p class="hero-intro">${t(
            "Draw a land tile, fit it into the growing landscape of southern France and decide whether to send one of your meeple onto its road, city or monastery. Completed features score at once; at the end, the most points wins.",
            "Compre uma peça de terreno, encaixe-a na paisagem do sul da França que vai crescendo e decida se manda um dos seus meeples para a estrada, a cidade ou o mosteiro dela. Construções completas pontuam na hora; no fim, vence quem tiver mais pontos."
          )}</p>
          <div class="hero-meta"><span>${t("2–5 players · 6 with Inns & Cathedrals", "2–5 jogadores · 6 com Inns & Cathedrals")}</span><span>${t("Tile laying", "Colocação de peças")}</span><span>${t("6 booklets", "6 livretos")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/carcassonne.webp" alt="${t("Cover of the Carcassonne rulebook: a landscape of tiles with roads, cities, a river and the walled city of Carcassonne on the horizon", "Capa do manual de Carcassonne: uma paisagem de peças com estradas, cidades, um rio e a cidade murada de Carcassonne no horizonte")}" fetchpriority="high"><figcaption>${t("Rulebook cover · Z-Man Games / Hans im Glück", "Capa do manual · Z-Man Games / Hans im Glück")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("The landscape", "A paisagem")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column ccs-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied English booklets: the Carcassonne rulebook (Z-Man Games, 2023) and its supplemental rules sheet (farmers, The River, The Abbot), Inns & Cathedrals and Dragon & Fairy (Hans im Glück, 2025), The Festival (2024), The Drawbridges (2023) and German Cathedrals (2020). Points marked “Guide's reading” are interpretations where the booklets are silent or disagree. Page links use the printed page numbers; “Supplement” is the 2-page sheet at the end of the rulebook PDF.",
            "Este guia cobre os livretos fornecidos, em inglês: o manual de Carcassonne (Z-Man Games, 2023) e a folha de regras suplementares (camponeses, The River, The Abbot), Inns & Cathedrals e Dragon & Fairy (Hans im Glück, 2025), The Festival (2024), The Drawbridges (2023) e German Cathedrals (2020). Pontos marcados como “Leitura do guia” são interpretações onde os livretos são omissos ou discordam. Os links de página usam a numeração impressa; “Suplemento” é a folha de 2 páginas no fim do PDF do manual."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${turnSection()}</section>
          <section class="rule-section">${featuresSection()}</section>
          ${on("river") ? `<section class="rule-section">${riverSection()}</section>` : ""}
          ${on("abbot") ? `<section class="rule-section">${abbotSection()}</section>` : ""}
          ${on("farmers") ? `<section class="rule-section">${farmersSection()}</section>` : ""}
          ${on("inns") ? `<section class="rule-section">${innsSection()}</section>` : ""}
          ${on("dragon") ? `<section class="rule-section">${dragonSection()}</section>` : ""}
          ${on("festival") ? `<section class="rule-section">${festivalSection()}</section>` : ""}
          ${on("drawbridges") ? `<section class="rule-section">${drawbridgesSection()}</section>` : ""}
          ${on("cathedrals") ? `<section class="rule-section">${cathedralsSection()}</section>` : ""}
          ${combinationItems().length ? `<section class="rule-section">${combinationsSection()}</section>` : ""}
          <section class="rule-section">${endSection()}</section>
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the Carcassonne rulebooks. Game design: Klaus-Jürgen Wrede & the Hans im Glück team; illustration: Anne Pätzke, Marcel Gröber. Carcassonne © Hans im Glück Verlags-GmbH; English edition Z-Man Games.",
        "Guia pessoal de consulta baseado nos livretos de Carcassonne. Design: Klaus-Jürgen Wrede e equipe Hans im Glück; ilustração: Anne Pätzke, Marcel Gröber. Carcassonne © Hans im Glück Verlags-GmbH; edição em inglês Z-Man Games."
      )}</p></footer>`;
  }

  function onClick(event) {
    const button = event.target instanceof Element ? event.target.closest("button") : null;
    if (!button || !root || !root.contains(button)) {
      return;
    }
    if (button.dataset.language) {
      state.language = button.dataset.language === "en-US" ? "en-US" : "pt-BR";
      notice = "";
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
      root.querySelector(".ccs-page")?.prepend(element);
    }
    element.textContent = storageNoticeText();
  }

  function applyPreferences(next) {
    const before = signature();
    state = normalizePreferences(next);
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
      const value = target.dataset.players;
      if (PLAYER_COUNTS.includes(value) && value !== state.players) {
        notice = "";
        applyPreferences({ ...state, players: value });
      }
      return;
    }
    if (target.type === "radio" && target.dataset.option !== undefined) {
      const key = target.dataset.option;
      const value = yesNo(target.value);
      if (OPTIONS.includes(key) && value !== state[key]) {
        notice = key === "inns" && value === "no" && state.players === "6"
          ? t("Six players needs the pink figures from Inns & Cathedrals: the match was switched to 5 players.", "Seis jogadores precisa das peças rosas de Inns & Cathedrals: a partida passou para 5 jogadores.")
          : "";
        applyPreferences({ ...state, [key]: value });
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

  window.Carcassonne = { renderInto, onClick, onChange };
})();
