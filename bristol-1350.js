(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.bristol-1350.v1";
  const SETUP_KEY = "field-manual.bristol-1350.setup.v1";
  const MANUAL_FILE = "bristol-1350_core.pdf";
  const ICONS = "assets/bristol-1350/icons/";
  // The printed page numbers start on the second PDF page (PDF page = printed page + 1).
  const PDF_OFFSET = 1;

  const PLAYER_COUNTS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  // [Birch, Cedar, Oak, starting Remedy cards] — rulebook p. 2 table.
  const TABLE = {
    1: [2, 1, 1, 2], 2: [2, 1, 1, 2], 3: [2, 1, 1, 2],
    4: [2, 1, 1, 1], 5: [2, 2, 1, 1], 6: [2, 2, 2, 0],
    7: [3, 2, 2, 0], 8: [3, 3, 2, 0], 9: [3, 3, 3, 0]
  };
  const CHARACTER_MODES = ["standard", "individual", "shared"];
  const VIOLENT_MODES = ["off", "redeal", "full"];
  const ALMS_MODES = ["off", "expansion", "homemade"];
  const defaults = {
    language: "pt-BR",
    players: "5",
    characters: "standard",
    mild: false,
    violent: "off",
    speedy: false,
    alms: "off",
    manuscript: false,
    points: false
  };
  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------

  function normalizePreferences(saved) {
    return {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      players: PLAYER_COUNTS.includes(String(saved?.players)) ? String(saved.players) : defaults.players,
      characters: CHARACTER_MODES.includes(saved?.characters) ? saved.characters : defaults.characters,
      mild: saved?.mild === true,
      violent: VIOLENT_MODES.includes(saved?.violent) ? saved.violent : defaults.violent,
      speedy: saved?.speedy === true,
      alms: ALMS_MODES.includes(saved?.alms) ? saved.alms : defaults.alms,
      manuscript: saved?.manuscript === true,
      points: saved?.points === true
    };
  }

  // Mild Strain only changes how a Mingle is played, not the preparation, so it is not part of the signature.
  function signature(source = state) {
    return [source.players, source.characters, source.violent, source.speedy, source.alms, source.manuscript, source.points].join("|");
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Bristol 1350 preferences.", error);
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
      console.error("Could not read Bristol 1350 setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Bristol 1350 preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Bristol 1350 setup progress.", error);
    }
  }

  function resetSetupForConfig() {
    setupState = { signature: signature(), checks: [] };
    saveSetup();
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function players() {
    return Number(state.players);
  }

  function ghosts() {
    return players() <= 3 ? 4 - players() : 0;
  }

  function hasGhosts() {
    return ghosts() > 0;
  }

  function isSolo() {
    return players() === 1;
  }

  function pawns() {
    return players() + ghosts();
  }

  function row() {
    return TABLE[players()];
  }

  function abilities() {
    return state.characters !== "standard";
  }

  function hasAlms() {
    return state.alms !== "off";
  }

  function redeal() {
    return !hasGhosts() && state.violent === "off";
  }

  function keepBuboes() {
    return state.violent === "full";
  }

  function manualUrl(page) {
    const script = document.querySelector('script[src*="bristol-1350.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${MANUAL_FILE}`, baseUrl).href}#page=${page + PDF_OFFSET}`;
  }

  function referenceLink(page) {
    return `<a class="source-link" href="${manualUrl(page)}" target="_blank" rel="noreferrer">${t(`Rulebook p. ${page} ↗`, `Manual p. ${page} ↗`)}</a>`;
  }

  function sectionHeading(id, title, index, pages) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("TOWN CRIER", "ARAUTO DA CIDADE")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="bristol-section-references">${pages.map(referenceLink).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
  }

  function iconCard(file, titleEn, bodyEn, titlePt, bodyPt, page) {
    const title = t(titleEn, titlePt);
    return `
      <article class="icon-card">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}.webp" alt="${title}"></span>
        <div><strong>${title}</strong><p>${t(bodyEn, bodyPt)}</p>${referenceLink(page)}</div>
      </article>`;
  }

  function infoCard(label, title, lines, page) {
    const pages = Array.isArray(page) ? page : [page];
    return `
      <article class="info-card">
        <span class="component-label">${label}</span>
        <h3>${title}</h3>
        ${lineList(lines)}
        ${pages.map(referenceLink).join(" ")}
      </article>`;
  }

  function interpretation(en, pt) {
    return `<span class="bristol-interpretation">${t("Guide's reading", "Leitura do guia")}</span> ${t(en, pt)}`;
  }

  function cartName(id) {
    return { birch: t("Birch", "Birch (bétula)"), cedar: t("Cedar", "Cedar (cedro)"), oak: t("Oak", "Oak (carvalho)") }[id];
  }

  function cartsLine() {
    const [birch, cedar, oak] = row();
    return t(
      `Birch ${birch} · Cedar ${cedar} · Oak ${oak}`,
      `Birch ${birch} · Cedar ${cedar} · Oak ${oak}`
    );
  }

  function sectionList() {
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["victory", t("Escaping & winning", "Fuga e vitória")],
      ["turn", t("Round & actions", "Rodada e ações")],
      ["mingles", t("Mingles & the plague", "Misturas e a peste")],
      ["remedies", t("Remedies", "Remédios")],
      ...(hasGhosts() ? [["ghosts", t("Ghosts (1–3 players)", "Fantasmas (1–3 jogadores)")]] : []),
      ...(activeModes().length ? [["modes", t("Optional modes in play", "Modos opcionais em jogo")]] : []),
      ["icons", t("Iconography", "Iconografia")],
      ["examples", t("Examples & clarifications", "Exemplos e esclarecimentos")],
      ["strategy", t("Strategy tips", "Dicas de estratégia")],
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
          <span class="brand-mark" aria-hidden="true">B</span>
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
      `${readFailed ? "This browser could not read the saved Bristol 1350 match or setup progress; defaults are shown. " : ""}${writeFailed ? "The latest change could not be saved and is visible on screen only." : ""}`,
      `${readFailed ? "Este navegador não conseguiu ler a partida ou o progresso de Bristol 1350 salvos; as opções padrão estão sendo mostradas. " : ""}${writeFailed ? "A alteração mais recente não pôde ser salva e aparece somente na tela." : ""}`
    ).trim();
  }

  // ---------- configuration ----------

  function choiceCard(name, value, dataAttr, checked, title, description) {
    return `
      <label class="bristol-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" ${dataAttr} ${checked ? "checked" : ""}>
        <span class="bristol-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function playersLabel(count = state.players) {
    const n = Number(count);
    if (n <= 3) {
      const g = 4 - n;
      return t(`${n} player${n === 1 ? "" : "s"} + ${g} Ghost${g === 1 ? "" : "s"}`, `${n} jogador${n === 1 ? "" : "es"} + ${g} Fantasma${g === 1 ? "" : "s"}`);
    }
    return t(`${n} players`, `${n} jogadores`);
  }

  function yesNoGroup(key, legendEn, legendPt, page, yesTitle, yesDesc, noTitle, noDesc) {
    const on = state[key] === true;
    return `
      <fieldset class="bristol-choice-group">
        <legend>${t(legendEn, legendPt)} · ${t("selected:", "selecionado:")} <span>${on ? yesTitle : noTitle}</span></legend>
        <p class="bristol-choice-intro">${referenceLink(page)}</p>
        <div class="bristol-choice-grid">
          ${choiceCard(`br-${key}`, "yes", `data-toggle="${key}" data-toggle-value="yes"`, on, yesTitle, yesDesc)}
          ${choiceCard(`br-${key}`, "no", `data-toggle="${key}" data-toggle-value="no"`, !on, noTitle, noDesc)}
        </div>
      </fieldset>`;
  }

  function matchConfiguration() {
    const playerChoices = PLAYER_COUNTS.map((count) => {
      const n = Number(count);
      const [birch, cedar, oak, remedies] = TABLE[n];
      const g = n <= 3 ? 4 - n : 0;
      const ghostText = g
        ? t(` Adds ${g} Ghost pawn${g === 1 ? "" : "s"} (automated villagers) to reach 4 pawns.${n === 1 ? " Solo: if you ever catch the plague, you lose at once." : ""}`, ` Acrescenta ${g} peão${g === 1 ? "" : "es"} Fantasma (aldeões automáticos) para chegar a 4 peões.${n === 1 ? " Solo: se você pegar a peste em qualquer momento, perde na hora." : ""}`)
        : "";
      return [count, playersLabel(count), t(
        `Pawns per cart: Birch ${birch}, Cedar ${cedar}, Oak ${oak}. Starting Remedy cards per player: ${remedies}.${ghostText}`,
        `Peões por carroça: Birch ${birch}, Cedar ${cedar}, Oak ${oak}. Cartas de Remédio iniciais por jogador: ${remedies}.${ghostText}`
      )];
    });
    const characterChoices = [
      ["standard", t("Standard side (recommended)", "Lado padrão (recomendado)"), t(
        "Everyone chooses a character card and keeps it on the standard side. Only the three basic actions exist. Use this if anyone at the table is new.",
        "Cada um escolhe uma carta de personagem e a mantém no lado padrão. Só existem as três ações básicas. Use se houver alguém novo na mesa."
      )],
      ["individual", t("Character Abilities · each their own", "Habilidades de Personagem · cada um a sua"), t(
        "Optional mode for advanced players: character cards are dealt at random, “Special Action” side up. Each player gains that card's special action as a 4th action choice. The effect is printed on the card.",
        "Modo opcional para jogadores avançados: as cartas de personagem são distribuídas ao acaso, com o lado “Special Action” (Ação Especial) para cima. Cada jogador ganha a ação especial da sua carta como 4ª opção de ação. O efeito está impresso na carta."
      )],
      ["shared", t("Character Abilities · one for everyone", "Habilidades de Personagem · uma para todos"), t(
        "Variant of the same mode: the group chooses one character's special ability and it becomes the 4th action available to all players for the whole game.",
        "Variante do mesmo modo: o grupo escolhe a habilidade especial de um personagem e ela vira a 4ª ação disponível para todos os jogadores durante a partida inteira."
      )]
    ];
    const violentChoices = [
      ["off", t("Off · normal deal", "Desligado · distribuição normal"), hasGhosts()
        ? t("Buboes (the 4s) are removed before dealing. With 1–3 players nobody is re-dealt for two 3s anyway (p. 9), so someone may start with the plague.", "Os Bubões (os 4) são retirados antes de distribuir. Com 1–3 jogadores ninguém recebe nova mão por dois 3 de qualquer forma (p. 9), então alguém pode começar com a peste.")
        : t("Buboes (the 4s) are removed before dealing, and anyone dealt two 3s gets two new cards, so everybody starts healthy (5 or less).", "Os Bubões (os 4) são retirados antes de distribuir, e quem receber dois 3 ganha duas cartas novas, então todos começam saudáveis (5 ou menos).")],
      ["redeal", t("Violent Strain · no re-deal", "Cepa Violenta · sem nova mão"), t(
        "Buboes are still removed, but a player dealt two 3s keeps them: some players may begin the game with the plague.",
        "Os Bubões ainda são retirados, mas quem receber dois 3 fica com eles: alguns jogadores podem começar a partida com a peste."
      )],
      ["full", t("Violent Strain · no re-deal and keep the 4s", "Cepa Violenta · sem nova mão e com os 4"), t(
        "The harder version: do not remove the 4s (Buboes) before dealing and do not re-deal. Starting with the plague becomes much more likely.",
        "A versão mais difícil: não retire os 4 (Bubões) antes de distribuir e não dê nova mão. Começar com a peste fica bem mais provável."
      )]
    ];
    const almsChoices = [
      ["off", t("No coins", "Sem moedas"), t("Alms are not used.", "Esmolas não são usadas.")],
      ["expansion", t("Alms mini-expansion", "Minexpansão Alms (Esmolas)"), t(
        "Requires the Alms mini-expansion: 6 coins go in the pouch and 6 Alms Remedy cards are shuffled into the Remedy deck. Playing Alms lets you secretly give a coin (Naught, Plague or Cured) to anyone.",
        "Exige a minexpansão Alms: 6 moedas vão para a bolsa e 6 cartas de Remédio Alms são embaralhadas no baralho de Remédios. Jogar Alms permite dar em segredo uma moeda (Naught, Plague ou Cured) a qualquer pessoa."
      )],
      ["homemade", t("Homemade coins (no expansion)", "Moedas caseiras (sem a expansão)"), t(
        "Make 4 “Naught”, 1 “Plague” and 1 “Cured” coin from cards, paper or tokens. There are no Alms cards: instead a Chicken Remedy may be played to draw and give a coin, or for its usual effect.",
        "Faça 4 moedas “Naught”, 1 “Plague” e 1 “Cured” com cartas, papel ou fichas. Não há cartas Alms: em vez disso, um Remédio Chicken pode ser jogado para tirar e dar uma moeda, ou para o efeito normal."
      )]
    ];
    const characterSummary = { standard: t("Standard", "Padrão"), individual: t("Abilities · each their own", "Habilidades · cada um a sua"), shared: t("Abilities · one for all", "Habilidades · uma para todos") }[state.characters];
    const violentSummary = { off: t("Off", "Desligada"), redeal: t("No re-deal", "Sem nova mão"), full: t("No re-deal + keep 4s", "Sem nova mão + com os 4") }[state.violent];
    const almsSummary = { off: t("No coins", "Sem moedas"), expansion: t("Mini-expansion", "Minexpansão"), homemade: t("Homemade coins", "Moedas caseiras") }[state.alms];

    return `
      <section class="controls-panel bristol-config" id="build-match" aria-labelledby="bristol-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="bristol-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "Choose the player count first: it sets how many pawns start on each cart, the starting Remedy cards and whether Ghosts join. The rulebook's optional game modes (p. 13–14) can be combined freely; leave them all off for a first game. Your choices filter the setup checklist and the rules below.",
              "Escolha primeiro o número de jogadores: ele define quantos peões começam em cada carroça, as cartas de Remédio iniciais e se entram Fantasmas. Os modos opcionais do manual (p. 13–14) podem ser combinados à vontade; deixe todos desligados na primeira partida. Suas escolhas filtram a lista de preparação e as regras abaixo."
            )}</p>
          </div>
        </div>
        <fieldset class="bristol-choice-group">
          <legend>${t("Players · selected:", "Jogadores · selecionado:")} <span>${playersLabel()}</span></legend>
          <p class="bristol-choice-intro">${t("From the setup table. Carts hold at most 3 pawns.", "Da tabela de preparação. Cada carroça leva no máximo 3 peões.")} ${referenceLink(2)} ${referenceLink(9)}</p>
          <div class="bristol-choice-grid bristol-choice-grid-3">${playerChoices.map(([value, title, desc]) => choiceCard("br-players", value, `data-players="${value}"`, state.players === value, title, desc)).join("")}</div>
        </fieldset>
        <fieldset class="bristol-choice-group">
          <legend>${t("Character cards · selected:", "Cartas de personagem · selecionado:")} <span>${characterSummary}</span></legend>
          <p class="bristol-choice-intro">${referenceLink(3)} ${referenceLink(13)}</p>
          <div class="bristol-choice-grid bristol-choice-grid-3">${characterChoices.map(([value, title, desc]) => choiceCard("br-characters", value, `data-characters="${value}"`, state.characters === value, title, desc)).join("")}</div>
        </fieldset>
        <fieldset class="bristol-choice-group">
          <legend>${t("Starting Symptoms (Violent Strain) · selected:", "Sintomas iniciais (Cepa Violenta) · selecionado:")} <span>${violentSummary}</span></legend>
          <p class="bristol-choice-intro">${t("“For plague-filled games.”", "“Para partidas cheias de peste.”")} ${referenceLink(3)} ${referenceLink(13)}</p>
          <div class="bristol-choice-grid bristol-choice-grid-3">${violentChoices.map(([value, title, desc]) => choiceCard("br-violent", value, `data-violent="${value}"`, state.violent === value, title, desc)).join("")}</div>
        </fieldset>
        ${yesNoGroup("mild", "Mild Strain", "Cepa Branda", 13,
          t("Mild Strain on", "Cepa Branda ligada"),
          t("“For less dramatic players”: in each Mingle every player contributes only one Symptom card, picked at random by a neighbor, instead of both.", "“Para jogadores menos dramáticos”: em cada Mistura cada jogador contribui com só uma carta de Sintoma, sorteada por um vizinho, em vez das duas."),
          t("Normal Mingles", "Misturas normais"),
          t("Each mingling player contributes both Symptom cards.", "Cada jogador na Mistura contribui com as duas cartas de Sintoma."))}
        ${yesNoGroup("speedy", "Speedy Wagon", "Carroça Veloz", 13,
          t("Head start", "Largada adiantada"),
          t("“For quicker games”, especially with many players: the carts begin some spaces forward (the group chooses how many).", "“Para partidas mais rápidas”, especialmente com muitos jogadores: as carroças começam alguns espaços à frente (o grupo escolhe quantos)."),
          t("Normal start", "Largada normal"),
          t("Carts begin on their printed starting positions.", "As carroças começam nas posições iniciais impressas."))}
        <fieldset class="bristol-choice-group">
          <legend>${t("Alms coins · selected:", "Moedas de Esmola · selecionado:")} <span>${almsSummary}</span></legend>
          <p class="bristol-choice-intro">${referenceLink(13)} ${referenceLink(14)}</p>
          <div class="bristol-choice-grid bristol-choice-grid-3">${almsChoices.map(([value, title, desc]) => choiceCard("br-alms", value, `data-alms="${value}"`, state.alms === value, title, desc)).join("")}</div>
        </fieldset>
        ${yesNoGroup("manuscript", "Illuminated Manuscript (anti-cheating)", "Manuscrito Iluminado (anticheat)", 14,
          t("Record Symptoms", "Registrar Sintomas"),
          t("After every Mingle each player secretly writes down (or photographs) their two Symptom numbers; at the end the revealed cards must match the last record.", "Depois de cada Mistura, cada jogador anota em segredo (ou fotografa) os números das suas duas cartas de Sintoma; no fim, as cartas reveladas devem bater com o último registro."),
          t("Trust the table", "Confiar na mesa"),
          t("No records are kept.", "Nenhum registro é feito."))}
        ${yesNoGroup("points", "Point System (several games)", "Sistema de Pontos (várias partidas)", 14,
          t("Keep score", "Marcar pontos"),
          t("For a series with the same group: escaping healthy players score 2 points; plagued players who stop every healthy player from winning score 1 point each.", "Para uma série com o mesmo grupo: jogadores saudáveis que escapam marcam 2 pontos; jogadores com peste que impedem todos os saudáveis de vencer marcam 1 ponto cada."),
          t("Single game", "Partida avulsa"),
          t("No running score.", "Sem placar acumulado."))}
      </section>`;
  }

  function activeModes() {
    const modes = [];
    if (abilities()) modes.push("abilities");
    if (state.mild) modes.push("mild");
    if (state.violent !== "off") modes.push("violent");
    if (state.speedy) modes.push("speedy");
    if (hasAlms()) modes.push("alms");
    if (state.manuscript) modes.push("manuscript");
    if (state.points) modes.push("points");
    return modes;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function setupPhases() {
    const [birch, cedar, oak, remedies] = row();
    const g = ghosts();
    const n = players();
    const phases = [
      {
        id: "board",
        title: t("Board, carts and dice", "Tabuleiro, carroças e dados"),
        pages: [1, 2, 5],
        items: [
          t("Lay out the map of Bristol in the middle of the table.", "Abra o mapa de Bristol no centro da mesa."),
          t("Place the 3 carts on their starting positions. Starting order for the first round, front to back: Birch (light cart) first, then Cedar (red), then Oak (dark brown).", "Coloque as 3 carroças nas posições iniciais. A ordem da primeira rodada, da frente para trás, é: Birch (carroça clara) primeiro, depois Cedar (vermelha), depois Oak (marrom-escura)."),
          state.speedy
            ? t("Speedy Wagon: agree on a number and move the carts that many spaces forward along the street before play. Alternatively the rulebook suggests extra board spaces or two laps for a longer game.", "Carroça Veloz: combinem um número e avancem as carroças esse número de espaços pela rua antes de começar. Como alternativa, o manual sugere espaços extras no tabuleiro ou duas voltas para uma partida mais longa.")
            : null,
          state.speedy
            ? interpretation("move all three carts the same number of spaces so the Birch–Cedar–Oak order is kept.", "avance as três carroças o mesmo número de espaços, mantendo a ordem Birch–Cedar–Oak.")
            : null,
          t("Put the 6 dice where everyone can reach them. Keep table space next to the board for the “New Symptoms” deck and for a Mingle area for each cart.", "Deixe os 6 dados ao alcance de todos. Reserve espaço ao lado do tabuleiro para o baralho de “New Symptoms” (Novos Sintomas) e para uma área de Mistura de cada carroça.")
        ]
      },
      {
        id: "characters",
        title: hasGhosts() ? t("Seats, character cards and Ghosts", "Lugares, cartas de personagem e Fantasmas") : t("Seats and character cards", "Lugares e cartas de personagem"),
        pages: hasGhosts() ? [2, 3, 9, 13] : [2, 3, 13],
        items: [
          state.characters === "individual"
            ? t(`Deal ${n === 1 ? "yourself" : "each player"} one character card at random, “Special Action” side up. The special action printed on it is a 4th action option for its owner.`, `Distribua ao acaso uma carta de personagem ${n === 1 ? "para você" : "para cada jogador"}, com o lado “Special Action” para cima. A ação especial impressa nela é uma 4ª opção de ação para o dono.`)
            : t(`${n === 1 ? "Choose one of the 9 character cards and keep" : "Each player chooses one of the 9 character cards and keeps"} it on the standard side.`, `${n === 1 ? "Escolha" : "Cada jogador escolhe"} uma das 9 cartas de personagem e a mantém no lado padrão.`),
          state.characters === "shared"
            ? t("Shared ability: the group picks one character's “Special Action” and leaves that card visible, Special Action side up, where everyone can read it — every player may use it as the 4th action.", "Habilidade compartilhada: o grupo escolhe a “Special Action” de um personagem e deixa essa carta à vista, com esse lado para cima, onde todos possam ler — todos os jogadores podem usá-la como 4ª ação.")
            : null,
          state.characters === "shared"
            ? interpretation("the rulebook does not say which side the other cards use in this variant; keeping them on the standard side avoids confusion.", "o manual não diz qual lado as outras cartas usam nesta variante; mantê-las no lado padrão evita confusão.")
            : null,
          g
            ? t(`Add ${g} Ghost${g === 1 ? "" : "s"}: give each Ghost a character card (and its matching pawn in the next step) and a seat at the table, like a normal player. Ghosts take turns in seat order.`, `Acrescente ${g} Fantasma${g === 1 ? "" : "s"}: dê a cada Fantasma uma carta de personagem (e o peão correspondente na próxima etapa) e um lugar à mesa, como um jogador normal. Fantasmas jogam na ordem dos lugares.`)
            : null,
          g
            ? interpretation("deal Ghosts' character cards at random from the leftovers; Ghosts never use special actions or Remedies — their turn is fixed (see Ghosts).", "distribua as cartas de personagem dos Fantasmas ao acaso entre as que sobraram; Fantasmas nunca usam ações especiais nem Remédios — o turno deles é fixo (veja Fantasmas).")
            : null,
          t("Return unused character cards and their pawns to the box.", "Devolva à caixa as cartas de personagem e peões não usados.")
        ]
      },
      {
        id: "pawns",
        title: t("Pawns onto the carts", "Peões nas carroças"),
        pages: [2],
        items: [
          t(`Put the ${pawns()} pawns whose colors match the character cards in play${g ? " (Ghosts included)" : ""} into the pouch and shake it.`, `Coloque na bolsa os ${pawns()} peões das cores das cartas de personagem em jogo${g ? " (Fantasmas incluídos)" : ""} e chacoalhe.`),
          t(`Draw them one at a time at random and seat them front to back: ${birch} on Birch, then ${cedar} on Cedar, then ${oak} on Oak.`, `Tire um de cada vez ao acaso e acomode-os da frente para trás: ${birch} na Birch, depois ${cedar} na Cedar, depois ${oak} na Oak.`),
          interpretation("fill Birch first, then Cedar, then Oak, each from its front seat backward. The first pawn drawn is the front of Birch and will start the first round.", "preencha primeiro a Birch, depois a Cedar e depois a Oak, cada uma do assento da frente para trás. O primeiro peão sorteado fica na frente da Birch e começa a primeira rodada.")
        ]
      },
      {
        id: "symptoms",
        title: t("Symptom cards (secret)", "Cartas de Sintoma (secretas)"),
        pages: hasGhosts() ? [3, 9, 13] : [3, 13],
        items: [
          keepBuboes()
            ? t("Violent Strain: keep the 4s (Buboes) in. Shuffle all 32 Symptom cards.", "Cepa Violenta: mantenha os 4 (Bubões). Embaralhe as 32 cartas de Sintoma.")
            : t("Take all the 4s (Buboes) out of the 32 Symptom cards and shuffle the rest.", "Retire todos os 4 (Bubões) das 32 cartas de Sintoma e embaralhe o restante."),
          t(`Deal 2 cards face down to ${g ? "each player and each Ghost" : "each player"}. Look only at your own; never show your Symptom cards to anyone.${g ? " Nobody looks at a Ghost's cards — keep them face down at the Ghost's seat." : ""}`, `Distribua 2 cartas viradas para baixo para ${g ? "cada jogador e cada Fantasma" : "cada jogador"}. Olhe só as suas; nunca mostre suas cartas de Sintoma a ninguém.${g ? " Ninguém olha as cartas de um Fantasma — deixe-as viradas para baixo no lugar dele." : ""}`),
          redeal()
            ? t("Anyone dealt two 3s shows them to the group and is dealt two new cards, so everybody starts with a total of 5 or less.", "Quem receber dois 3 mostra ao grupo e recebe duas cartas novas, para que todos comecem com total de 5 ou menos.")
            : hasGhosts()
              ? t("With 1–3 players nobody is re-dealt for two 3s: a player or Ghost may start with 6 (the plague).", "Com 1–3 jogadores ninguém recebe nova mão por dois 3: um jogador ou Fantasma pode começar com 6 (a peste).")
              : t("Violent Strain: nobody is re-dealt for two 3s — a total of 6 or more means you start with the plague.", "Cepa Violenta: ninguém recebe nova mão por dois 3 — total de 6 ou mais significa que você começa com a peste."),
          keepBuboes()
            ? t("Place the remaining cards face down as the Symptoms deck by the “New Symptoms” area of the board.", "Coloque as cartas restantes viradas para baixo como baralho de Sintomas junto à área “New Symptoms” do tabuleiro.")
            : t("Shuffle the leftover Symptoms together with the 4s and place the stack face down by the “New Symptoms” area of the board.", "Embaralhe os Sintomas que sobraram junto com os 4 e coloque a pilha virada para baixo junto à área “New Symptoms” do tabuleiro."),
          state.manuscript
            ? t("Illuminated Manuscript: everyone grabs paper (or a phone) to secretly record their two Symptom numbers after each Mingle.", "Manuscrito Iluminado: todos pegam papel (ou o celular) para registrar em segredo os números dos seus dois Sintomas depois de cada Mistura.")
            : null
        ]
      },
      {
        id: "remedies",
        title: t("Remedy cards", "Cartas de Remédio"),
        pages: state.alms === "expansion" ? [3, 13] : [3],
        items: [
          state.alms === "expansion"
            ? t("Shuffle the 6 Alms Remedy cards into the 27 Remedy cards (33 cards).", "Embaralhe as 6 cartas de Remédio Alms junto às 27 cartas de Remédio (33 cartas).")
            : t("Shuffle the 27 Remedy cards.", "Embaralhe as 27 cartas de Remédio."),
          remedies
            ? t(`Deal ${remedies} Remedy card${remedies === 1 ? "" : "s"} to ${n === 1 ? "yourself" : "each player"}. Keep them hidden until you play them.`, `Distribua ${remedies} carta${remedies === 1 ? "" : "s"} de Remédio para ${n === 1 ? "você" : "cada jogador"}. Mantenha-as escondidas até jogá-las.`)
            : t(`With ${n} players nobody starts with Remedy cards.`, `Com ${n} jogadores ninguém começa com cartas de Remédio.`),
          g
            ? interpretation("Ghosts are not dealt Remedies — they never draw or play them.", "Fantasmas não recebem Remédios — eles nunca compram nem jogam.")
            : null,
          t("Place the rest face down as the Remedy deck next to the top of the board.", "Coloque o resto virado para baixo como baralho de Remédios ao lado da parte de cima do tabuleiro.")
        ]
      }
    ];

    if (hasAlms()) {
      phases.push({
        id: "alms",
        title: t("Alms coins", "Moedas de Esmola"),
        pages: [13, 14],
        items: [
          state.alms === "expansion"
            ? t("After the pawns are seated, put all 6 Alms coins in the pouch (4 “Naught”, 1 “Plague”, 1 “Cured” — the word is on the tails side).", "Depois de acomodar os peões, coloque as 6 moedas de Esmola na bolsa (4 “Naught”, 1 “Plague”, 1 “Cured” — a palavra fica no lado coroa).")
            : t("Make 6 homemade coins that look identical from the back: 4 “Naught”, 1 “Plague”, 1 “Cured” (playing cards, paper or tokens). Put them in the pouch after the pawns are seated.", "Faça 6 moedas caseiras idênticas pelo verso: 4 “Naught” (nada), 1 “Plague” (peste), 1 “Cured” (curado) — com cartas, papel ou fichas. Coloque-as na bolsa depois de acomodar os peões."),
          interpretation("the pouch is also used for the pawns, so draw the pawns first and fill it with coins afterward.", "a bolsa também é usada para os peões; por isso sorteie os peões primeiro e só depois coloque as moedas.")
        ]
      });
    }

    if (state.points) {
      phases.push({
        id: "score",
        title: t("Score sheet", "Folha de pontos"),
        pages: [14],
        items: [
          t("Write every player's name on a sheet to carry the score from game to game (2 points for escaping healthy, 1 point for a plagued player who stops all healthy players).", "Escreva o nome de cada jogador numa folha para levar o placar de uma partida para outra (2 pontos por escapar saudável, 1 ponto para jogador com peste que impede todos os saudáveis).")
        ]
      });
    }

    phases.push({
      id: "start",
      title: t("First round", "Primeira rodada"),
      pages: [3, 5],
      items: [
        t("Any player rolls all six dice for the group.", "Qualquer jogador rola os seis dados pelo grupo."),
        t(`The ${g ? "player or Ghost" : "player"} whose pawn is at the front of Birch takes the first turn; turns then pass clockwise around the table (by seat, not by cart).`, `O ${g ? "jogador ou Fantasma" : "jogador"} cujo peão está na frente da Birch faz o primeiro turno; depois os turnos seguem em sentido horário ao redor da mesa (pelos lugares, não pelas carroças).`)
      ]
    });
    return phases;
  }

  function inventory() {
    const g = ghosts();
    const cards = [
      infoCard(t("SHARED", "COMPARTILHADO"), t("Board, carts and dice", "Tabuleiro, carroças e dados"), [
        t("1 map of Bristol · 3 carts: Birch (light), Cedar (red), Oak (dark brown).", "1 mapa de Bristol · 3 carroças: Birch (clara), Cedar (vermelha), Oak (marrom-escura)."),
        t("6 dice: each result shows an apple or a rat in one cart's color.", "6 dados: cada resultado mostra uma maçã ou um rato na cor de uma carroça."),
        t("1 pouch (to draw pawns" + (hasAlms() ? " and later the coins)." : ")."), "1 bolsa (para sortear peões" + (hasAlms() ? " e depois as moedas)." : ")."))
      ], [1, 5]),
      infoCard(t("DECKS", "BARALHOS"), t("Symptoms and Remedies", "Sintomas e Remédios"), [
        t(`32 Symptom cards (numbers; the 4s are Buboes)${keepBuboes() ? " — all used from the start" : " — 4s set aside for the deal, then shuffled back in"}.`, `32 cartas de Sintoma (números; os 4 são Bubões)${keepBuboes() ? " — todas usadas desde o início" : " — os 4 ficam de fora na distribuição e depois voltam ao baralho"}.`),
        t(`${state.alms === "expansion" ? "27 Remedy cards + 6 Alms Remedy cards" : "27 Remedy cards"} (each card shows two Remedy uses).`, `${state.alms === "expansion" ? "27 cartas de Remédio + 6 cartas de Remédio Alms" : "27 cartas de Remédio"} (cada carta mostra dois usos de Remédio).`),
        t(`Starting hand: ${row()[3]} Remedy card${row()[3] === 1 ? "" : "s"} per player.`, `Mão inicial: ${row()[3]} carta${row()[3] === 1 ? "" : "s"} de Remédio por jogador.`)
      ], [1, 2, 3]),
      infoCard(t(`VILLAGERS · ×${pawns()}`, `ALDEÕES · ×${pawns()}`), t("Character cards and pawns", "Cartas de personagem e peões"), [
        t(`${players()} player${players() === 1 ? "" : "s"}${g ? ` + ${g} Ghost${g === 1 ? "" : "s"}` : ""}: one character card and the matching pawn each (9 of each in the box).`, `${players()} jogador${players() === 1 ? "" : "es"}${g ? ` + ${g} Fantasma${g === 1 ? "" : "s"}` : ""}: uma carta de personagem e o peão correspondente para cada (9 de cada na caixa).`),
        t(`Seating: ${cartsLine()}.`, `Acomodação: ${cartsLine()}.`),
        state.characters === "individual" ? t("Character cards: “Special Action” side up.", "Cartas de personagem: lado “Special Action” para cima.") : state.characters === "shared" ? t("Character cards: standard side; only the one shared card is shown Special Action side up.", "Cartas de personagem: lado padrão; só a carta compartilhada fica com o lado Special Action para cima.") : t("Character cards: standard side.", "Cartas de personagem: lado padrão.")
      ], [1, 2])
    ];
    if (hasAlms()) {
      cards.push(infoCard(t("ALMS", "ESMOLAS"), t("Coins", "Moedas"), [
        t("4 “Naught” (no effect, good for bluffing).", "4 “Naught” (sem efeito, boas para blefar)."),
        t("1 “Plague” (the holder has the plague).", "1 “Plague” (quem a tem está com a peste)."),
        t("1 “Cured” (the holder is immune and cured).", "1 “Cured” (quem a tem está imune e curado)."),
        state.alms === "homemade" ? t("Homemade: made by the group; no Alms cards.", "Caseiras: feitas pelo grupo; sem cartas Alms.") : t("Plus the 6 Alms Remedy cards.", "Mais as 6 cartas de Remédio Alms.")
      ], [13, 14]));
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
        <label class="bristol-setup-check" for="br-setup-${phase.id}">
          <input id="br-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="bristol-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="bristol-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), sectionIndex("setup"), [1, 2, 3])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Set up this match", "Prepare esta partida")} · ${playersLabel()}</h3>
            <p>${t("One checkbox per coherent step. Progress is saved separately from the match configuration and language.", "Uma caixa por etapa coerente. O progresso é salvo separadamente da configuração da partida e do idioma.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Changing the player count, character mode, Violent Strain, Speedy Wagon, Alms, Illuminated Manuscript or Point System clears this checklist. Changing the language or Mild Strain does not. “Uncheck all” clears only these setup boxes.",
          "Trocar o número de jogadores, o modo de personagens, a Cepa Violenta, a Carroça Veloz, as Esmolas, o Manuscrito Iluminado ou o Sistema de Pontos limpa esta lista. Trocar o idioma ou a Cepa Branda não. “Desmarcar tudo” limpa somente as caixas da preparação."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}`;
  }

  // ---------- quick reference ----------

  function actionLines() {
    return [
      rl("Reroll", "reroll any two dice (or just one). Leave the other dice exactly as they are.", "Rerrolar", "role de novo quaisquer dois dados (ou só um). Deixe os outros dados exatamente como estão."),
      rl("Draw a Remedy", "take the top Remedy card. Not allowed if you already hold 3 Remedies.", "Comprar Remédio", "pegue a carta de Remédio do topo. Proibido se você já tem 3 Remédios na mão."),
      rl("Pawn Movement", "Elbow, Dash or Push (one of them).", "Movimento de Peão", "Cotovelada, Disparada ou Empurrão (um deles)."),
      hasGhosts() ? rl("Peek at a Ghost", "look at one Symptom card currently belonging to any Ghost (1–3 players only).", "Espiar um Fantasma", "olhe uma carta de Sintoma que pertence agora a qualquer Fantasma (só com 1–3 jogadores).") : null,
      state.characters === "individual" ? rl("Special Action", "the action printed on your character card's Special Action side.", "Ação Especial", "a ação impressa no lado Special Action da sua carta de personagem.") : null,
      state.characters === "shared" ? rl("Special Action", "the one special action the group chose for everyone.", "Ação Especial", "a ação especial que o grupo escolheu para todos.") : null
    ];
  }

  function quickReference() {
    const cards = [
      infoCard(t("ONE ROUND", "UMA RODADA"), t("Roll · turns · end of round", "Rolagem · turnos · fim da rodada"), [
        rl("1 · Roll", "any player rolls all six dice for the group.", "1 · Rolar", "qualquer jogador rola os seis dados pelo grupo."),
        rl("2 · Turns", `starting with the ${hasGhosts() ? "player or Ghost" : "player"} at the front of the cart furthest ahead, clockwise around the table: each takes one action, then may play any Remedies.`, "2 · Turnos", `começando por quem está na frente da carroça mais adiantada${hasGhosts() ? " (jogador ou Fantasma)" : ""}, em sentido horário ao redor da mesa: cada um faz uma ação e depois pode jogar quaisquer Remédios.`),
        rl("3 · Mingles", "each cart with 2+ rats of its color among the six dice Mingles.", "3 · Misturas", "cada carroça com 2+ ratos da sua cor entre os seis dados faz uma Mistura."),
        rl("4 · Move", "each unfinished cart (even empty) moves 1 space per die showing its color, apple or rat.", "4 · Mover", "cada carroça ainda na cidade (mesmo vazia) anda 1 espaço por dado da sua cor, maçã ou rato."),
        rl("5 · Finish", "a cart crossing the finish line reveals its riders' health.", "5 · Chegada", "uma carroça que cruza a linha de chegada revela a saúde dos ocupantes.")
      ], [3, 5]),
      infoCard(t("YOUR TURN", "SEU TURNO"), t("Choose ONE action", "Escolha UMA ação"), actionLines(), [3, 4]),
      infoCard(t("PAWN MOVEMENT", "MOVIMENTO DE PEÃO"), t("Elbow · Dash · Push", "Cotovelada · Disparada · Empurrão"), [
        rl("Elbow", "move your pawn to the front of your cart.", "Cotovelada", "leve seu peão para a frente da sua carroça."),
        rl("Dash", "only from the front of your cart: move to the back of the cart in front of yours (any distance). Full? Swap with its back pawn, who goes to the front of your old cart.", "Disparada", "só da frente da sua carroça: vá para o fundo da carroça à frente da sua (qualquer distância). Cheia? Troque com o peão do fundo dela, que vai para a frente da sua antiga carroça."),
        rl("Push", "push yourself or a pawn 1–2 seats behind you off your cart. It goes to the back of the rearmost cart behind it with a free seat.", "Empurrão", "empurre você mesmo ou um peão 1–2 assentos atrás de você para fora da carroça. Ele vai para o fundo da carroça mais atrasada, atrás dele, com assento livre."),
        rl("No seat behind / pushed off the 3rd cart", "the pushed villager is left behind and out. If they reveal they are healthy, the pusher is out too.", "Sem assento atrás / empurrado da 3ª carroça", "o aldeão empurrado fica para trás e sai do jogo. Se ele revelar que está saudável, quem empurrou também sai."),
        rl("Gaps", "pawns behind slide forward. Max 3 pawns per cart.", "Vagas", "os peões de trás deslizam para a frente. Máximo de 3 peões por carroça.")
      ], [4, 11]),
      infoCard(t("REMEDIES", "REMÉDIOS"), t("On your turn, after your action", "No seu turno, depois da sua ação"), [
        rl("When", "any number, after and in addition to your action — even a card drawn this turn. Whip is the exception (played when someone moves against you).", "Quando", "quantos quiser, depois e além da sua ação — até uma carta comprada neste turno. O Whip é a exceção (jogado quando alguém se move contra você)."),
        rl("Use", "each card has two uses (top or bottom); pick one, then discard the card.", "Uso", "cada carta tem dois usos (de cima ou de baixo); escolha um e descarte a carta."),
        rl("Arsenic", "lock two dice for this round.", "Arsenic", "trave dois dados nesta rodada."),
        rl("Chicken", "after a 2-dice reroll, reroll those dice up to 3 more times each.", "Chicken", "depois de rerrolar 2 dados, role esses dados até mais 3 vezes cada."),
        rl("Crushed Emeralds", "one extra Elbow, Dash or Push.", "Crushed Emeralds", "uma Cotovelada, Disparada ou Empurrão extra."),
        rl("Leeches", "draw 2 Symptoms, put 1 face down in any cart's Mingle area.", "Leeches", "compre 2 Sintomas, ponha 1 virado para baixo na área de Mistura de qualquer carroça."),
        rl("Pomander", "draw 2 Symptoms, keep any 2 of your 4.", "Pomander", "compre 2 Sintomas, fique com 2 quaisquer dos seus 4."),
        rl("Whip", "stop an Elbow past you, a Dash onto your cart or a Push of you.", "Whip", "impeça uma Cotovelada que passe por você, uma Disparada para sua carroça ou um Empurrão contra você."),
        hasAlms() ? (state.alms === "expansion"
          ? rl("Alms", "secretly draw a coin, look at it, give it to anyone (you included).", "Alms", "tire uma moeda em segredo, olhe e dê a qualquer um (inclusive você).")
          : rl("Chicken → coin", "instead of its effect, a Chicken may draw and give a coin.", "Chicken → moeda", "em vez do efeito normal, um Chicken pode tirar e dar uma moeda.")) : null
      ], [6, 8, 9]),
      infoCard(t("MINGLE", "MISTURA"), t("2+ rats of a cart's color", "2+ ratos da cor de uma carroça"), [
        rl("Contribute", state.mild ? "Mild Strain: each rider gives 1 Symptom, picked at random by the first clockwise non-mingling neighbor." : "every rider puts both Symptom cards in the cart's Mingle area.", "Contribuir", state.mild ? "Cepa Branda: cada ocupante dá 1 Sintoma, sorteado pelo primeiro vizinho em sentido horário que não está na Mistura." : "cada ocupante põe as duas cartas de Sintoma na área de Mistura da carroça."),
        rl("Add one", "plus 1 random card from the Symptoms deck — or, if Leeches put cards there, 1 of those at random instead (the others are discarded).", "Mais uma", "mais 1 carta aleatória do baralho de Sintomas — ou, se houver cartas de Leeches ali, 1 delas ao acaso no lugar (as outras são descartadas)."),
        rl("Deal back", state.mild ? "mix and deal 1 to each rider; discard the extra face down." : "mix and deal 2 to each rider; discard the extra face down.", "Devolver", state.mild ? "misture e dê 1 a cada ocupante; descarte a sobra virada para baixo." : "misture e dê 2 a cada ocupante; descarte a sobra virada para baixo."),
        rl("Plague", "two Symptoms totalling 6+ = the plague for the rest of the game.", "Peste", "dois Sintomas somando 6+ = peste pelo resto da partida."),
        rl("Alone", "a lone rider still Mingles. Empty carts don't (their Leeched cards are removed).", "Sozinho", "um ocupante sozinho ainda faz a Mistura. Carroças vazias não (as cartas de Leeches delas são removidas).")
      ], [5, 11, ...(state.mild ? [13] : [])]),
      infoCard(t("FINISH LINE", "LINHA DE CHEGADA"), t("Who escapes, who dies", "Quem escapa, quem morre"), [
        rl("All healthy", "everyone on that cart wins together; the game ends.", "Todos saudáveis", "todos naquela carroça vencem juntos; a partida acaba."),
        rl("Anyone plagued", "everyone on that cart dies; play continues.", "Alguém com peste", "todos naquela carroça morrem; o jogo continua."),
        rl("Gates close", "after the first (non-empty) cart crosses, the others have one more round; carts still in town then die.", "Portões fecham", "depois que a primeira carroça (não vazia) cruza, as outras têm mais uma rodada; as que ainda estiverem na cidade morrem."),
        rl("Plague wins", "if no all-healthy cart escapes, everyone who ever had the plague wins.", "A peste vence", "se nenhuma carroça totalmente saudável escapar, todos que tiveram a peste em algum momento vencem."),
        isSolo() ? rl("Solo", "if you ever catch the plague, you lose immediately.", "Solo", "se você pegar a peste em qualquer momento, perde na hora.") : null
      ], [2, 6, ...(hasGhosts() ? [10] : [])])
    ];
    if (hasGhosts()) {
      cards.push(infoCard(t("GHOST TURN", "TURNO DO FANTASMA"), t("Automatic, in seat order", "Automático, na ordem dos lugares"), [
        rl("Reroll", "one die of the furthest-ahead cart that is not the Ghost's own: an apple of that color if showing, otherwise a rat of that color.", "Rerrolar", "um dado da carroça mais adiantada que não seja a do Fantasma: uma maçã dessa cor se houver, senão um rato dessa cor."),
        rl("Apple result", "if the rerolled die now shows an apple, the Ghost moves forward.", "Deu maçã", "se o dado rerrolado agora mostra uma maçã, o Fantasma avança."),
        rl("Middle or back", "Elbow to the front.", "Meio ou fundo", "Cotovelada para a frente."),
        rl("Front of 2nd/3rd cart", "Dash to the cart in front.", "Frente da 2ª/3ª carroça", "Disparada para a carroça da frente."),
        rl("Front of 1st cart", "Push the pawn at the back of its cart (if any).", "Frente da 1ª carroça", "Empurra o peão do fundo da sua carroça (se houver)."),
        rl("Whips", "players may Whip a Ghost's move.", "Whips", "jogadores podem usar Whip contra o movimento de um Fantasma.")
      ], [10, 11]));
    }
    cards.push(infoCard(t("SECRETS", "SEGREDOS"), t("What stays hidden", "O que fica escondido"), [
      rl("Symptoms", "never show your Symptom cards (until you are revealed at the finish or die).", "Sintomas", "nunca mostre suas cartas de Sintoma (até revelar na chegada ou morrer)."),
      rl("Remedies", "hidden until played.", "Remédios", "escondidos até serem jogados."),
      hasAlms() ? rl("Coins", "kept hidden under your character card.", "Moedas", "ficam escondidas debaixo da sua carta de personagem.") : null,
      rl("Talking", "allowed and encouraged — but plagued villagers may lie.", "Conversa", "permitida e incentivada — mas aldeões com peste podem mentir.")
    ], [3, 6, 7]));
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), sectionIndex("quick-reference"), [2, 3, 4, 5, 6])}
      <div class="callout">${t(
        "Goal: be on the first cart to escape Bristol with only healthy villagers aboard. If your two Symptom cards ever total 6 or more you have the plague for the rest of the game — then your goal flips: make sure no healthy cart escapes.",
        "Objetivo: estar na primeira carroça a escapar de Bristol só com aldeões saudáveis a bordo. Se suas duas cartas de Sintoma somarem 6 ou mais em algum momento, você tem a peste pelo resto da partida — e seu objetivo se inverte: garantir que nenhuma carroça saudável escape."
      )}${isSolo() ? t(" Solo: you never switch sides — catching the plague means you lose at once.", " Solo: você nunca troca de lado — pegar a peste significa perder na hora.") : ""} ${referenceLink(2)}</div>
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- victory ----------

  function victorySection() {
    return `
      ${sectionHeading("victory", t("Escaping & winning", "Fuga e vitória"), sectionIndex("victory"), [2, 6, 11, 12])}
      <div class="quick-grid">
        <article class="info-card victory-card">
          <span class="component-label">${t("HEALTHY VILLAGERS", "ALDEÕES SAUDÁVEIS")}</span>
          <h3>${t("Escape on an all-healthy cart", "Escapar numa carroça toda saudável")}</h3>
          ${lineList([
            t("Each time a cart crosses the finish line (the town gate), every rider must reveal whether they have the plague.", "Cada vez que uma carroça cruza a linha de chegada (o portão da cidade), todos a bordo devem revelar se têm a peste."),
            t("If everyone on that cart is healthy, they all win together and the game ends immediately.", "Se todos naquela carroça estiverem saudáveis, todos vencem juntos e a partida acaba na hora."),
            t("If anyone on it has the plague, everyone on that cart dies of the plague and play continues.", "Se alguém nela tiver a peste, todos naquela carroça morrem da peste e o jogo continua."),
            t("It is fine if another cart finishes ahead of you, as long as someone aboard it has the plague.", "Não tem problema outra carroça chegar antes da sua, desde que alguém a bordo dela tenha a peste.")
          ])}
          ${referenceLink(6)}
        </article>
        <article class="info-card victory-card">
          <span class="component-label">${t("PLAGUED VILLAGERS", "ALDEÕES COM PESTE")}</span>
          <h3>${t("Make sure no healthy cart escapes", "Garantir que nenhuma carroça saudável escape")}</h3>
          ${lineList([
            t("You have the plague if your two Symptom cards ever added up to 6 or more — even if they later drop below 6.", "Você tem a peste se suas duas cartas de Sintoma já somaram 6 ou mais — mesmo que depois fiquem abaixo de 6."),
            t("Every cart that crosses must be empty or carry someone with the plague.", "Toda carroça que cruzar deve estar vazia ou levar alguém com a peste."),
            t("If all three carts cross with the plague, are empty when they cross, or fail to finish in time, everyone who ever had the plague wins (alive or dead).", "Se as três carroças cruzarem com a peste, cruzarem vazias ou não chegarem a tempo, todos que tiveram a peste em algum momento vencem (vivos ou mortos)."),
            t("Winning healthy is harder (and more impressive): avoid the plague at all costs.", "Vencer saudável é mais difícil (e mais impressionante): evite a peste a todo custo.")
          ])}
          ${referenceLink(2)} ${referenceLink(6)}
        </article>
        <article class="info-card victory-card">
          <span class="component-label">${t("THE GATES CLOSE", "OS PORTÕES SE FECHAM")}</span>
          <h3>${t("One more round after the first crossing", "Mais uma rodada depois da primeira chegada")}</h3>
          ${lineList([
            t("If play continues after a cart crosses, the 2nd and 3rd carts must escape within one additional round: they get the whole next round, and any cart still in town at the end of that round is trapped and everyone on it dies.", "Se o jogo continuar depois que uma carroça cruzar, a 2ª e a 3ª carroças precisam escapar dentro de uma rodada adicional: elas têm a rodada seguinte inteira, e a carroça que ainda estiver na cidade no fim dessa rodada fica presa e todos nela morrem."),
            t("An empty first cart does not start this countdown — the remaining carts are not limited to one more round.", "Uma primeira carroça vazia não inicia essa contagem — as carroças restantes não ficam limitadas a mais uma rodada."),
            t("Dice results for carts that already finished do nothing.", "Resultados de dado das carroças que já chegaram não fazem nada."),
            t("Several carts crossing in the same round: the one that would have travelled farther (more movement left over) crosses first; if still tied, the one that started the round farther ahead.", "Várias carroças cruzando na mesma rodada: cruza primeiro a que iria mais longe (mais movimento sobrando); se ainda empatar, a que começou a rodada mais à frente.")
          ])}
          ${referenceLink(6)} ${referenceLink(11)} ${referenceLink(12)}
        </article>
        <article class="info-card victory-card">
          <span class="component-label">${t("THE DEAD", "OS MORTOS")}</span>
          <h3>${t("Out of the game", "Fora do jogo")}</h3>
          ${lineList([
            t("Players who die at the finish line or during the game must truthfully reveal their health.", "Jogadores que morrem na chegada ou durante a partida devem revelar a saúde com sinceridade."),
            t("They take no more turns and cannot play Remedy cards.", "Eles não fazem mais turnos e não podem jogar cartas de Remédio."),
            t("They may still influence and advise others, now aiming for nobody to win.", "Ainda podem influenciar e aconselhar os outros, agora buscando que ninguém vença."),
            interpretation("a villager who is out during the game (left behind, or a pusher who “dies of shame”) has their pawn removed from the cart; the pawns behind slide forward. Their Symptom and Remedy cards stay face down in front of them, out of play. Pushing yourself off with no free seat behind simply puts you out.", "um aldeão que sai durante a partida (deixado para trás, ou quem empurrou e “morre de vergonha”) tem o peão retirado da carroça; os peões de trás deslizam para a frente. As cartas de Sintoma e de Remédio dele ficam viradas para baixo à sua frente, fora de jogo. Empurrar a si mesmo sem assento livre atrás simplesmente tira você do jogo.")
          ])}
          ${referenceLink(6)} ${referenceLink(11)}
        </article>
        ${hasGhosts() ? `
        <article class="info-card victory-card">
          <span class="component-label">${t("GHOSTS", "FANTASMAS")}</span>
          <h3>${t("Ghosts at the finish", "Fantasmas na chegada")}</h3>
          ${lineList([
            t("When a Ghost crosses, reveal its two Symptoms: 6 or more means it has the plague. Only its cards at the end matter.", "Quando um Fantasma cruza, revele seus dois Sintomas: 6 ou mais significa peste. Só importam as cartas que ele tem no fim."),
            t("A plagued Ghost kills its whole cart, and play continues as normal.", "Um Fantasma com peste mata a carroça inteira, e o jogo continua normalmente."),
            t("If a cart of only Ghosts crosses healthy, the Ghosts win and all players lose.", "Se uma carroça só de Fantasmas cruzar saudável, os Fantasmas vencem e todos os jogadores perdem."),
            isSolo() ? t("Solo: if you get the plague at any point, you lose and the game is over.", "Solo: se você pegar a peste em qualquer momento, você perde e a partida acaba.") : null,
            isSolo() ? interpretation("this includes being dealt 6 or more at setup (possible with no re-deal), and any other way you die or are put out (left behind, dying of shame, a plagued Ghost on your cart, a cart trapped when the gates close) — the solo goal is only to escape healthy.", "isso inclui receber 6 ou mais na preparação (possível sem nova mão) e qualquer outra forma de morrer ou sair (deixado para trás, morrer de vergonha, um Fantasma com peste na sua carroça, carroça presa quando os portões fecham) — no solo o objetivo é só escapar saudável.") : null
          ])}
          ${referenceLink(10)}
        </article>` : ""}
        ${state.points ? `
        <article class="info-card victory-card">
          <span class="component-label">${t("POINT SYSTEM", "SISTEMA DE PONTOS")}</span>
          <h3>${t("Score across games", "Placar entre partidas")}</h3>
          ${lineList([
            rl("2 points", "each healthy player who escapes and ends the game.", "2 pontos", "cada jogador saudável que escapa e encerra a partida."),
            rl("1 point", "each plagued player (Symptoms 6+ at any point) when all healthy players are prevented from winning.", "1 ponto", "cada jogador com peste (Sintomas 6+ em algum momento) quando todos os saudáveis são impedidos de vencer.")
          ])}
          ${referenceLink(14)}
        </article>` : ""}
      </div>`;
  }

  // ---------- round & actions ----------

  function turnSection() {
    return `
      ${sectionHeading("turn", t("Round & actions", "Rodada e ações"), sectionIndex("turn"), [3, 4, 5, 11])}
      <div class="quick-grid">
        ${infoCard(t("START OF ROUND", "INÍCIO DA RODADA"), t("Roll and turn order", "Rolagem e ordem de turnos"), [
          t("Any player rolls all six dice for the group. Dice are rolled simultaneously.", "Qualquer jogador rola os seis dados pelo grupo. Os dados são rolados ao mesmo tempo."),
          t(`The ${hasGhosts() ? "player or Ghost" : "player"} whose pawn is at the front of the cart furthest ahead takes the first turn (Birch in round 1).`, `Quem tem o peão na frente da carroça mais adiantada faz o primeiro turno${hasGhosts() ? " (jogador ou Fantasma)" : ""} (Birch na rodada 1).`),
          t("Then turns pass clockwise around the table — by seat, not by cart — until everyone still in the game has had one turn.", "Depois os turnos seguem em sentido horário ao redor da mesa — pelos lugares, não pelas carroças — até todos ainda no jogo terem feito um turno."),
          t("Cart order: the cart farther along the street is ahead. Carts on the same space keep the order they had at the start of the round (the one that started ahead is “nudged” slightly forward).", "Ordem das carroças: a que está mais adiante na rua está à frente. Carroças no mesmo espaço mantêm a ordem que tinham no início da rodada (a que começou à frente é “empurradinha” um pouco adiante).")
        ], [3, 5, 12])}
        ${infoCard(t("ACTIONS", "AÇÕES"), t("Exactly one per turn", "Exatamente uma por turno"), [
          ...actionLines(),
          t("The actions are also listed at the bottom of each character card.", "As ações também estão listadas na parte de baixo de cada carta de personagem.")
        ], [3, 4, ...(hasGhosts() ? [10] : []), ...(abilities() ? [13] : [])])}
        ${infoCard(t("REROLL", "RERROLAR"), t("Two dice (or one)", "Dois dados (ou um)"), [
          t("Pick any two dice and roll them again (you may choose to reroll only one).", "Escolha quaisquer dois dados e role-os de novo (você pode escolher rerrolar só um)."),
          t("Leave the other four exactly as they were after the initial roll or the previous player's turn.", "Deixe os outros quatro exatamente como estavam depois da rolagem inicial ou do turno do jogador anterior."),
          t("Dice locked by Arsenic cannot be rerolled. If all dice are locked, rerolling is no longer an action option this round.", "Dados travados por Arsenic não podem ser rerrolados. Se todos os dados estiverem travados, rerrolar deixa de ser opção de ação nesta rodada."),
          t("Only the six dice showing at the end of the round matter, for movement and Mingles.", "Só os seis dados que estiverem à mostra no fim da rodada importam, para movimento e Misturas.")
        ], [4, 8, 11])}
        ${infoCard(t("ELBOW", "COTOVELADA"), t("To the front of your cart", "Para a frente da sua carroça"), [
          t("Move your pawn in front of all other pawns on your cart.", "Coloque seu peão na frente de todos os outros peões da sua carroça."),
          t("A Whip from a pawn you would pass stops it; from the back, a Whip by either pawn in front keeps you at the back.", "Um Whip de um peão que você ultrapassaria impede a cotovelada; vindo do fundo, um Whip de qualquer um dos dois peões da frente mantém você no fundo.")
        ], [4, 9])}
        ${infoCard(t("DASH", "DISPARADA"), t("Jump to the cart in front", "Pular para a carroça da frente"), [
          t("Only if you are at the front of your cart.", "Só se você estiver na frente da sua carroça."),
          t("Move your pawn to the back of the cart in front of yours — no matter how far away it is.", "Leve seu peão para o fundo da carroça à frente da sua — não importa a distância."),
          t("Pawns on your former cart slide forward to fill your seat.", "Os peões da sua antiga carroça deslizam para a frente para ocupar seu lugar."),
          t("If that cart is full (3 pawns), swap with its back pawn: they go to the front of your former cart.", "Se aquela carroça estiver cheia (3 peões), troque com o peão do fundo dela: ele vai para a frente da sua antiga carroça."),
          interpretation("the cart at the very front cannot Dash, and nobody can Dash onto a cart that has already left town.", "a carroça da frente não pode fazer Disparada, e ninguém pode disparar para uma carroça que já saiu da cidade.")
        ], [4, 11])}
        ${infoCard(t("PUSH", "EMPURRÃO"), t("Throw someone off", "Jogar alguém para fora"), [
          t("Push yourself, or a pawn sitting one or two seats behind you on your cart, off the cart.", "Empurre você mesmo, ou um peão sentado um ou dois lugares atrás de você na sua carroça, para fora da carroça."),
          t("The pushed pawn goes to the back of the cart furthest behind that has an open seat (e.g., the last cart if it has room; otherwise the second cart).", "O peão empurrado vai para o fundo da carroça mais atrasada que tenha assento livre (ex.: a última, se tiver vaga; senão a segunda)."),
          t("Pawns on the former cart slide forward to fill the gap.", "Os peões da antiga carroça deslizam para a frente para ocupar a vaga."),
          t("If there is no free seat on a cart behind the one you were pushed from, or you were pushed off the 3rd cart, you are left behind and out of the game.", "Se não houver assento livre numa carroça atrás daquela de onde você foi empurrado, ou se foi empurrado da 3ª carroça, você fica para trás e está fora do jogo."),
          t("A left-behind villager reveals their health: if they do NOT have the plague, the pusher dies of shame and is out too.", "O aldeão deixado para trás revela a saúde: se NÃO tiver a peste, quem empurrou morre de vergonha e também sai."),
          hasGhosts() ? t("Ghosts can be pushed too; a Ghost pushed off the 3rd cart reveals its Symptoms — 5 or less means the pusher is out.", "Fantasmas também podem ser empurrados; um Fantasma empurrado da 3ª carroça revela os Sintomas — 5 ou menos significa que quem empurrou sai.") : null
        ], hasGhosts() ? [4, 10] : [4])}
        ${infoCard(t("END OF ROUND", "FIM DA RODADA"), t("Mingles first, then movement", "Primeiro Misturas, depois movimento"), [
          rl("1 · Mingles", "before the carts move, every cart with two or more rats of its color among the final six dice Mingles (see Mingles).", "1 · Misturas", "antes de as carroças andarem, cada carroça com dois ou mais ratos da sua cor entre os seis dados finais faz uma Mistura (veja Misturas)."),
          rl("2 · Movement", "move each cart still in town — including empty carts — one space per die showing its color (apples and rats both count).", "2 · Movimento", "mova cada carroça ainda na cidade — inclusive vazias — um espaço por dado que mostra sua cor (maçãs e ratos contam)."),
          rl("3 · Crossing", "a cart that passes the finish line leaves town: its riders reveal (see Escaping & winning).", "3 · Chegada", "a carroça que passa da linha de chegada sai da cidade: os ocupantes revelam a saúde (veja Fuga e vitória)."),
          rl("4 · New order", "carts sharing a space: the one that started the round ahead stays slightly ahead. Then start a new round.", "4 · Nova ordem", "carroças no mesmo espaço: a que começou a rodada à frente fica um pouco à frente. Depois comece uma nova rodada."),
          t("Carts only move at the end of the round, never during the roll or rerolls.", "As carroças só andam no fim da rodada, nunca durante a rolagem ou as rerrolagens.")
        ], [5, 12])}
      </div>`;
  }

  // ---------- mingles ----------

  function minglesSection() {
    return `
      ${sectionHeading("mingles", t("Mingles & the plague", "Misturas e a peste"), sectionIndex("mingles"), [2, 5, 11, ...(state.mild ? [13] : [])])}
      <div class="quick-grid">
        ${infoCard(t("TRIGGER", "GATILHO"), t("Two or more rats", "Dois ou mais ratos"), [
          t("At the end of each round, before the carts move, look at the final six dice.", "No fim de cada rodada, antes de as carroças andarem, olhe os seis dados finais."),
          t("For each cart with two or more rats in its color, everyone on that cart must Mingle.", "Para cada carroça com dois ou mais ratos da sua cor, todos naquela carroça precisam fazer a Mistura."),
          t("A single rider still Mingles. An empty cart does not, but any Leeched cards in its Mingle area are removed.", "Um ocupante sozinho ainda faz a Mistura. Uma carroça vazia não, mas as cartas de Leeches na área de Mistura dela são removidas."),
          abilities() ? t("When the Barmaid has looked at the Symptom deck and several carts Mingle, resolve them from the furthest-ahead cart backward.", "Quando a Barmaid tiver olhado o baralho de Sintomas e várias carroças fizerem Mistura, resolva-as da carroça mais adiantada para trás.") : null,
          interpretation("in other cases the order of several Mingles does not matter; using the same front-to-back order keeps it simple.", "nos outros casos a ordem de várias Misturas não importa; usar a mesma ordem da frente para trás simplifica.")
        ], [5, 11])}
        ${infoCard(t("HOW TO MINGLE", "COMO FAZER A MISTURA"), state.mild ? t("Mild Strain is on", "Cepa Branda ligada") : t("Everyone's cards in the pot", "As cartas de todos no monte"), state.mild ? [
          t("Each mingling rider contributes only one of their two Symptom cards, face down, to the cart's Mingle area.", "Cada ocupante na Mistura contribui com só uma das duas cartas de Sintoma, virada para baixo, na área de Mistura da carroça."),
          t("That card is picked at random by the rider's first clockwise neighbor who is not part of the Mingle.", "Essa carta é sorteada pelo primeiro vizinho do ocupante, em sentido horário, que não faz parte da Mistura."),
          t("Add one Symptom from the deck as normal (or one of the Leeched cards — see below).", "Acrescente um Sintoma do baralho, como normal (ou uma das cartas de Leeches — veja abaixo)."),
          interpretation("mix the cards, deal one back to each rider and discard the extra face down; a Ghost cannot pick, so skip Ghosts when finding the neighbor.", "misture as cartas, devolva uma a cada ocupante e descarte a sobra virada para baixo; um Fantasma não sorteia, então pule Fantasmas ao procurar o vizinho.")
        ] : [
          t("Every mingling rider adds both Symptom cards, face down, to the cart's Mingle area by the board.", "Cada ocupante na Mistura põe as duas cartas de Sintoma, viradas para baixo, na área de Mistura da carroça ao lado do tabuleiro."),
          t("Add one random Symptom from the deck — unless Leeches put cards there, in which case one of those is added instead.", "Acrescente um Sintoma aleatório do baralho — a não ser que Leeches tenham posto cartas ali; nesse caso, uma delas entra no lugar."),
          t("Mix all the cards and deal two to each rider; discard the extra card face down.", "Misture todas as cartas e dê duas para cada ocupante; descarte a carta extra virada para baixo."),
          hasGhosts() ? t("Ghosts on the cart contribute and receive two cards like normal players (still unseen).", "Fantasmas na carroça contribuem e recebem duas cartas como jogadores normais (ainda sem ninguém ver).") : null
        ], state.mild ? [5, 13] : [5, 10])}
        ${infoCard(t("LEECHED CARDS", "CARTAS DE LEECHES"), t("Only one gets in", "Só uma entra"), [
          t("Any number of Leeches can add cards to a cart's Mingle area.", "Qualquer número de Leeches pode acrescentar cartas na área de Mistura de uma carroça."),
          t("When that cart Mingles, shuffle all the Leeched cards and include only one; discard the others face down.", "Quando aquela carroça fizer Mistura, embaralhe todas as cartas de Leeches e inclua só uma; descarte as outras viradas para baixo."),
          t("Leeched cards stay in the area until a Mingle happens there.", "As cartas de Leeches ficam na área até acontecer uma Mistura ali.")
        ], [8, 9])}
        ${infoCard(t("THE PLAGUE", "A PESTE"), t("6 or more, for the rest of the game", "6 ou mais, pelo resto da partida"), [
          t("If your two Symptom cards add up to 6 or more at any point, you have the plague for the rest of the game.", "Se suas duas cartas de Sintoma somarem 6 ou mais em qualquer momento, você tem a peste pelo resto da partida."),
          t("Lower cards later do not cure you; once plagued, it no longer matters which cards you receive.", "Cartas menores depois não curam você; depois de pegar a peste, não importa mais quais cartas você recebe."),
          t("You must keep track of it yourself and reveal it truthfully at the finish or when you die.", "Você mesmo precisa lembrar disso e revelar com sinceridade na chegada ou quando morrer."),
          hasAlms() ? t("Alms: the “Plague” coin gives the plague regardless of your cards; the “Cured” coin makes you immune and cures you (it beats the Plague coin).", "Esmolas: a moeda “Plague” dá a peste independentemente das cartas; a moeda “Cured” deixa você imune e cura (ela vence a moeda Plague).") : null,
          state.manuscript ? t("Illuminated Manuscript: after each of your Mingles, secretly record your two numbers; mismatches at the end mean a lifetime ban (the rulebook's joke).", "Manuscrito Iluminado: depois de cada Mistura sua, registre em segredo os dois números; divergência no fim significa banimento vitalício (a piada do manual).") : null
        ], [2, 5, ...(hasAlms() ? [14] : [])])}
        ${infoCard(t("DECKS", "BARALHOS"), t("Running out", "Quando acabam"), [
          t("Whenever the Symptoms deck runs out, shuffle the Symptoms discard pile to form a new deck.", "Sempre que o baralho de Sintomas acabar, embaralhe o descarte de Sintomas para formar um novo baralho."),
          t("Whenever the Remedy deck runs out, shuffle its discard pile to form a new deck.", "Sempre que o baralho de Remédios acabar, embaralhe o descarte dele para formar um novo baralho.")
        ], [5, 6])}
      </div>`;
  }

  // ---------- remedies ----------

  function remediesSection() {
    return `
      ${sectionHeading("remedies", t("Remedies", "Remédios"), sectionIndex("remedies"), [6, 8, 9])}
      <div class="callout">${lineList([
        t("All Remedies except Whip are played on your turn, after and in addition to your main action (reroll, draw a Remedy, move a pawn).", "Todos os Remédios, exceto Whip, são jogados no seu turno, depois e além da sua ação principal (rerrolar, comprar Remédio, mover peão)."),
        t("Each Remedy card shows two possible uses; choose the top or the bottom one, then discard the card.", "Cada carta de Remédio mostra dois usos possíveis; escolha o de cima ou o de baixo e descarte a carta."),
        t("Play as many as you like per turn, including one drawn this turn. Keep your Remedies hidden until played.", "Jogue quantos quiser por turno, inclusive um comprado neste turno. Mantenha seus Remédios escondidos até jogá-los."),
        t("You may not draw a Remedy as your action while holding three.", "Você não pode comprar Remédio como ação se tiver três na mão.")
      ])} ${referenceLink(4)} ${referenceLink(6)}</div>
      <div class="icon-grid bristol-remedy-grid">
        ${iconCard("arsenic", "Arsenic", "Lock two dice by setting them on the board: they cannot be rerolled or changed for the rest of this round. If every die is locked, rerolling is no longer an action option this round.", "Arsenic (arsênico)", "Trave dois dados colocando-os sobre o tabuleiro: eles não podem ser rerrolados nem alterados pelo resto da rodada. Se todos os dados estiverem travados, rerrolar deixa de ser opção de ação nesta rodada.", 8)}
        ${iconCard("chicken", "Chicken", "Only if your action was rerolling two dice: reroll one or both of those same dice up to three extra times each (up to four rolls per die). Roll them together; you may stop one and keep rolling the other." + (state.alms === "homemade" ? " Homemade Alms: you may instead draw and give a coin." : ""), "Chicken (galinha)", "Só se a sua ação foi rerrolar dois dados: role um ou ambos esses mesmos dados até mais três vezes cada (até quatro rolagens por dado). Role-os juntos; você pode parar um e continuar rolando o outro." + (state.alms === "homemade" ? " Esmolas caseiras: em vez disso, você pode tirar e dar uma moeda." : ""), 8)}
        ${iconCard("crushed-emeralds", "Crushed Emeralds", "Take one extra Pawn Movement action (Elbow, Dash or Push). Your main action does not have to be a Pawn Movement.", "Crushed Emeralds (esmeraldas moídas)", "Faça uma ação extra de Movimento de Peão (Cotovelada, Disparada ou Empurrão). Sua ação principal não precisa ser um Movimento de Peão.", 8)}
        ${iconCard("leeches", "Leeches", "Draw two Symptoms and add one, face down, to any cart's Mingle stack (yours included). No limit per cart, but only one Leeched card per Mingle is used (shuffle them; discard the rest face down).", "Leeches (sanguessugas)", "Compre dois Sintomas e ponha um, virado para baixo, no monte de Mistura de qualquer carroça (inclusive a sua). Sem limite por carroça, mas só uma carta de Leeches é usada por Mistura (embaralhe; descarte o resto virado para baixo).", 8)}
        ${iconCard("pomander", "Pomander", "Draw two Symptoms, then keep any two of your four. Do not add your Symptoms together while you are doing this.", "Pomander (pomo de cheiro)", "Compre dois Sintomas e fique com dois quaisquer dos seus quatro. Não some seus Sintomas enquanto faz isso.", 9)}
        ${iconCard("whip", "Whip", "Prevent someone from Dashing to your cart, Elbowing past you or Pushing you off. Their prevented move still counts as their action. Each extra move from Crushed Emeralds needs its own Whip. Several Whippers decide in turn order (starting player, then clockwise).", "Whip (chicote)", "Impeça alguém de fazer Disparada para sua carroça, Cotovelada passando por você ou de empurrar você. O movimento impedido ainda conta como a ação da pessoa. Cada movimento extra de Crushed Emeralds exige seu próprio Whip. Se vários quiserem usar Whip, decidem na ordem do turno (quem começou a rodada, depois sentido horário).", 9)}
        ${state.alms === "expansion" ? iconCard("alms-coin", "Alms", "Discreetly draw one coin from the pouch, look at its tails side and give it to any player (yourself included). The recipient may look too, then hides it under their character card for the rest of the game.", "Alms (esmola)", "Tire discretamente uma moeda da bolsa, olhe o lado coroa e dê a qualquer jogador (inclusive você). Quem recebe também pode olhar e depois a esconde debaixo da carta de personagem pelo resto da partida.", 13) : ""}
      </div>
      <p class="glossary-intro">${interpretation(
        "the cards that Leeches and Pomander leave unused go face down to the Symptoms discard pile, like the other discarded Symptoms.",
        "as cartas que Leeches e Pomander deixam sem uso vão viradas para baixo para o descarte de Sintomas, como os outros Sintomas descartados."
      )} ${interpretation(
        "Chicken requires a reroll of two dice — a one-die reroll does not qualify.",
        "Chicken exige rerrolar dois dados — rerrolar só um dado não vale."
      )}</p>`;
  }

  // ---------- ghosts ----------

  function ghostsSection() {
    const g = ghosts();
    return `
      ${sectionHeading("ghosts", t("Ghosts (1–3 players)", "Fantasmas (1–3 jogadores)"), sectionIndex("ghosts"), [9, 10, 11])}
      <div class="callout">${t(
        `This match adds ${g} Ghost${g === 1 ? "" : "s"} so that there are 4 villagers. Everything else follows the normal rules, with these adjustments.`,
        `Esta partida acrescenta ${g} Fantasma${g === 1 ? "" : "s"} para que haja 4 aldeões. Todo o resto segue as regras normais, com estes ajustes.`
      )} ${referenceLink(9)}</div>
      <div class="quick-grid">
        ${infoCard(t("GHOST TURN", "TURNO DO FANTASMA"), t("Which die it rerolls", "Qual dado ele rerrola"), [
          t("On its turn a Ghost rerolls exactly one die belonging to the furthest-ahead cart possible that is not its own (a die showing that cart's color).", "No turno dele, um Fantasma rerrola exatamente um dado da carroça mais adiantada possível que não seja a sua (um dado mostrando a cor dessa carroça)."),
          t("It rerolls an apple of that color if one is showing; otherwise a rat of that color.", "Ele rerrola uma maçã dessa cor se houver uma à mostra; senão, um rato dessa cor."),
          t("If the only dice showing are for its own cart, it rerolls nothing (and so cannot move this turn).", "Se os únicos dados à mostra forem da própria carroça, ele não rerrola nada (e por isso não pode se mover neste turno)."),
          t("After a cart has crossed, Ghosts reroll dice for the unfinished cart that is not their own. If the Ghost is on the only cart left, it rerolls any die not of its own color.", "Depois que uma carroça cruzou, Fantasmas rerrolam dados da carroça ainda na cidade que não é a deles. Se o Fantasma estiver na única carroça restante, rerrola qualquer dado que não seja da sua cor."),
          interpretation("Ghosts skip dice locked by Arsenic, treating them as unavailable.", "Fantasmas ignoram dados travados por Arsenic, tratando-os como indisponíveis.")
        ], [10, 11])}
        ${infoCard(t("GHOST MOVE", "MOVIMENTO DO FANTASMA"), t("Only if the rerolled die shows an apple", "Só se o dado rerrolado mostrar maçã"), [
          rl("Middle or back of a cart", "it Elbows to the front.", "Meio ou fundo de uma carroça", "faz Cotovelada para a frente."),
          rl("Front of the 2nd or 3rd cart", "it Dashes to the back of the cart in front.", "Frente da 2ª ou 3ª carroça", "faz Disparada para o fundo da carroça da frente."),
          rl("Front of the 1st cart", "it Pushes off the pawn at the back of its cart (if there is one).", "Frente da 1ª carroça", "Empurra o peão do fundo da sua carroça (se houver)."),
          t("Players may use Whips to prevent a Ghost's Elbow, Dash or Push.", "Jogadores podem usar Whips para impedir a Cotovelada, Disparada ou Empurrão de um Fantasma."),
          interpretation("“apple” means an apple of any color on that rerolled die.", "“maçã” significa uma maçã de qualquer cor nesse dado rerrolado.")
        ], [10])}
        ${infoCard(t("GHOST SYMPTOMS", "SINTOMAS DOS FANTASMAS"), t("Hidden even from you", "Escondidos até de você"), [
          t("Ghosts are dealt two Symptoms at setup, and nobody is re-dealt for two 3s.", "Fantasmas recebem dois Sintomas na preparação, e ninguém recebe nova mão por dois 3."),
          state.mild ? t("When a Ghost's cart Mingles, it takes part like a player — with Mild Strain on, that means 1 card in (picked at random by the nearest non-mingling player clockwise) and 1 back.", "Quando a carroça de um Fantasma faz Mistura, ele participa como um jogador — com a Cepa Branda, isso significa 1 carta dada (sorteada pelo jogador mais próximo em sentido horário que não está na Mistura) e 1 recebida.") : t("When a Ghost's cart Mingles, it contributes its two Symptoms and receives two back, like a player.", "Quando a carroça de um Fantasma faz Mistura, ele contribui com os dois Sintomas e recebe dois de volta, como um jogador."),
          t("New action for players: use your action to look at one Symptom card currently belonging to any Ghost. Ghost cards are not shuffled between viewings.", "Nova ação para os jogadores: use sua ação para olhar uma carta de Sintoma que pertence agora a qualquer Fantasma. As cartas de Fantasmas não são embaralhadas entre espiadas."),
          t("A Ghost pushed off the 3rd cart reveals its Symptoms: if they total 5 or less, the pusher is out of the game.", "Um Fantasma empurrado da 3ª carroça revela os Sintomas: se somarem 5 ou menos, quem empurrou está fora do jogo."),
          interpretation("the same applies when a pushed Ghost is left behind because no cart behind has a free seat — it counts as healthy with 5 or less.", "o mesmo vale quando um Fantasma empurrado fica para trás porque nenhuma carroça atrás tem assento livre — ele conta como saudável com 5 ou menos.")
        ], [10, 11])}
        ${infoCard(t("GHOSTS AT THE FINISH", "FANTASMAS NA CHEGADA"), t("Only the final cards count", "Só as cartas finais contam"), [
          t("When a Ghost crosses, reveal its Symptoms: 6 or more = plague. It does not matter whether it had the plague earlier.", "Quando um Fantasma cruza, revele os Sintomas: 6 ou mais = peste. Não importa se ele teve a peste antes."),
          t("A plagued Ghost kills its whole cart and play continues.", "Um Fantasma com peste mata a carroça inteira e o jogo continua."),
          t("A cart of only Ghosts that crosses healthy: the Ghosts win and all players lose.", "Uma carroça só de Fantasmas que cruza saudável: os Fantasmas vencem e todos os jogadores perdem."),
          isSolo() ? t("Solo: if you get the plague at any point, you lose and the game is over.", "Solo: se você pegar a peste em qualquer momento, você perde e a partida acaba.") : null
        ], [10])}
      </div>
      <p class="glossary-intro">${interpretation(
        "any player may handle a Ghost's cards and pawn on its turn, without looking at its Symptoms. Ghosts never draw or play Remedies and never use special actions.",
        "qualquer jogador pode manusear as cartas e o peão de um Fantasma no turno dele, sem olhar os Sintomas. Fantasmas nunca compram nem jogam Remédios e nunca usam ações especiais."
      )}</p>`;
  }

  // ---------- optional modes ----------

  function modesSection() {
    const cards = [];
    if (abilities()) {
      cards.push(infoCard(t("CHARACTER ABILITIES", "HABILIDADES DE PERSONAGEM"), state.characters === "shared" ? t("One ability for everyone", "Uma habilidade para todos") : t("Each player's own ability", "A habilidade de cada jogador"), [
        state.characters === "shared"
          ? t("The special action the group chose is a 4th action option for every player, all game long.", "A ação especial escolhida pelo grupo é uma 4ª opção de ação para todos os jogadores, a partida inteira.")
          : t("Your card's special action is a 4th action option: on your turn you may do it instead of rerolling, drawing a Remedy or moving a pawn.", "A ação especial da sua carta é uma 4ª opção de ação: no seu turno você pode fazê-la em vez de rerrolar, comprar Remédio ou mover peão."),
        t("The exact effect is printed on the card's “Special Action” side; read it there.", "O efeito exato está impresso no lado “Special Action” da carta; leia-o ali."),
        rl("Barmaid", "if she viewed the Symptom deck and several carts then Mingle, Mingle from the furthest-ahead cart backward.", "Barmaid", "se ela viu o baralho de Sintomas e depois várias carroças fazem Mistura, misture da carroça mais adiantada para trás."),
        rl("Knight", "Whips cannot prevent his special action.", "Knight", "Whips não podem impedir a ação especial dele."),
        rl("Outlaw", "if he earns an extra action, he may use his special action again — as many times as he likes.", "Outlaw", "se ganhar uma ação extra, pode usar a ação especial de novo — quantas vezes quiser."),
        rl("Sheriff", "if he uses several turns to view the same player's Symptom cards, that player may shuffle them between viewings.", "Sheriff", "se usar vários turnos para ver as cartas de Sintoma do mesmo jogador, esse jogador pode embaralhá-las entre as olhadas.")
      ], [11, 12, 13]));
    }
    if (state.mild) {
      cards.push(infoCard(t("MILD STRAIN", "CEPA BRANDA"), t("Gentler Mingles", "Misturas mais brandas"), [
        t("Each Mingling player contributes one Symptom card instead of two, selected at random by their first clockwise neighbor who is not part of the Mingle.", "Cada jogador na Mistura contribui com uma carta de Sintoma em vez de duas, sorteada pelo primeiro vizinho em sentido horário que não faz parte da Mistura."),
        t("One Symptom from the deck is still added as normal.", "Um Sintoma do baralho ainda é acrescentado normalmente."),
        interpretation("deal one card back to each rider and discard the extra face down.", "devolva uma carta a cada ocupante e descarte a sobra virada para baixo.")
      ], [13]));
    }
    if (state.violent !== "off") {
      cards.push(infoCard(t("VIOLENT STRAIN", "CEPA VIOLENTA"), t("Plague from the start", "Peste desde o início"), [
        t("Players dealt two 3s are not re-dealt, so some may begin the game with the plague.", "Quem receber dois 3 não recebe nova mão, então alguns podem começar a partida com a peste."),
        state.violent === "full" ? t("The 4s (Buboes) stay in the deck for the initial deal.", "Os 4 (Bubões) ficam no baralho na distribuição inicial.") : null
      ], [13]));
    }
    if (state.speedy) {
      cards.push(infoCard(t("SPEEDY WAGON", "CARROÇA VELOZ"), t("A shorter street", "Uma rua mais curta"), [
        t("The carts began some spaces forward, so the race is shorter. Especially useful with many players.", "As carroças começaram alguns espaços à frente, então a corrida é mais curta. Útil principalmente com muitos jogadores."),
        t("For a longer game instead, the rulebook suggests extra board spaces or two laps.", "Para uma partida mais longa, o manual sugere espaços extras no tabuleiro ou duas voltas.")
      ], [13]));
    }
    if (hasAlms()) {
      cards.push(infoCard(t("ALMS", "ESMOLAS"), state.alms === "expansion" ? t("Alms mini-expansion", "Minexpansão Alms") : t("Homemade coins", "Moedas caseiras"), [
        state.alms === "expansion"
          ? t("Play an Alms Remedy on your turn: discreetly draw a coin, view its tails side, and give it to any player (including yourself).", "Jogue um Remédio Alms no seu turno: tire discretamente uma moeda, veja o lado coroa e dê a qualquer jogador (inclusive você).")
          : t("Play a Chicken Remedy on your turn to draw and give a coin instead of its usual effect: view its tails side and give it to any player (including yourself).", "Jogue um Remédio Chicken no seu turno para tirar e dar uma moeda em vez do efeito normal: veja o lado coroa e dê a qualquer jogador (inclusive você)."),
        t("The recipient may view it, then hides it under their character card for the rest of the game.", "Quem recebe pode olhar e depois a esconde debaixo da carta de personagem pelo resto da partida."),
        rl("Naught ×4", "no effect — useful for bluffing.", "Naught ×4", "sem efeito — útil para blefar."),
        rl("Plague ×1", "the holder has the plague for the rest of the game, whatever their Symptoms.", "Plague ×1", "quem a tem está com a peste pelo resto da partida, sejam quais forem os Sintomas."),
        rl("Cured ×1", "the holder is immune and is cured if already plagued; Cured beats Plague. But crossing with a plagued rider still loses.", "Cured ×1", "quem a tem fica imune e é curado se já tinha peste; Cured vence Plague. Mas cruzar com um ocupante com peste ainda perde."),
        interpretation("a cured holder no longer counts as plagued, so they cannot share the plague victory; once all 6 coins are given out, Alms has no further effect.", "quem tem a moeda Cured não conta mais como empestado, então não divide a vitória da peste; depois que as 6 moedas forem dadas, Esmolas não tem mais efeito."),
        state.alms === "homemade" ? interpretation("using a Chicken for a coin does not require a two-dice reroll — that condition belongs to Chicken's normal effect.", "usar um Chicken para uma moeda não exige rerrolar dois dados — essa condição é do efeito normal do Chicken.") : null,
        interpretation("reveal your coin along with your health at the finish or when you die.", "revele sua moeda junto com a saúde na chegada ou quando morrer.")
      ], [13, 14]));
    }
    if (state.manuscript) {
      cards.push(infoCard(t("ILLUMINATED MANUSCRIPT", "MANUSCRITO ILUMINADO"), t("Anti-cheating record", "Registro anticheat"), [
        t("After each time you Mingle, secretly write down your two Symptom numbers or photograph them.", "Depois de cada Mistura sua, anote em segredo os números dos seus dois Sintomas ou fotografe-os."),
        t("At the end, your revealed Symptoms must match your final record.", "No fim, os Sintomas revelados devem bater com o último registro."),
        t("Alternatively a bystander or eliminated player double-checks Symptoms after each Mingle.", "Como alternativa, um espectador ou jogador eliminado confere os Sintomas depois de cada Mistura.")
      ], [14]));
    }
    if (state.points) {
      cards.push(infoCard(t("POINT SYSTEM", "SISTEMA DE PONTOS"), t("For a series of games", "Para uma série de partidas"), [
        rl("2 points", "healthy players who escape and end the game.", "2 pontos", "jogadores saudáveis que escapam e encerram a partida."),
        rl("1 point each", "plagued players (6+ at any point) who prevent all healthy players from winning.", "1 ponto cada", "jogadores com peste (6+ em algum momento) que impedem todos os saudáveis de vencer.")
      ], [14]));
    }
    return `
      ${sectionHeading("modes", t("Optional modes in play", "Modos opcionais em jogo"), sectionIndex("modes"), [13, 14])}
      <p class="glossary-intro">${t("Only the modes selected in “Build your match” are shown. Any number of them may be combined with the standard rules.", "Só os modos selecionados em “Configure a partida” aparecem. Qualquer número deles pode ser combinado com as regras padrão.")}</p>
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- iconography ----------

  function iconsSection() {
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), sectionIndex("icons"), [1, 2, 4, 5, 6])}
      <p class="glossary-intro">${t("Each image is cropped individually from the rulebook. The Remedy illustrations are in the Remedies section.", "Cada imagem foi recortada individualmente do manual. As ilustrações dos Remédios estão na seção Remédios.")}</p>
      <h3 class="subhead">${t("Carts and dice", "Carroças e dados")}</h3>
      <div class="icon-grid">
        ${iconCard("cart-birch", "Birch cart", "The light cart. Front cart in the first round; its front rider starts round 1.", "Carroça Birch", "A carroça clara. É a carroça da frente na primeira rodada; o ocupante da frente dela começa a rodada 1.", 2)}
        ${iconCard("cart-cedar", "Cedar cart", "The red cart. Second in the first round.", "Carroça Cedar", "A carroça vermelha. Segunda na primeira rodada.", 2)}
        ${iconCard("cart-oak", "Oak cart", "The dark-brown cart. Last in the first round.", "Carroça Oak", "A carroça marrom-escura. Última na primeira rodada.", 2)}
        ${iconCard("die-rat", "Die result", "Each die shows apples and rats in the carts' colors. Every die of a cart's color moves that cart 1 space; 2+ rats of a cart's color make that cart Mingle.", "Resultado do dado", "Cada dado mostra maçãs e ratos nas cores das carroças. Cada dado da cor de uma carroça move essa carroça 1 espaço; 2+ ratos da cor de uma carroça fazem essa carroça Misturar.", 5)}
        ${iconCard("finish-gate", "Finish (town gate)", "The finish line at the end of the street. A cart passing it leaves town and its riders reveal their health.", "Chegada (portão da cidade)", "A linha de chegada no fim da rua. A carroça que passa por ela sai da cidade e os ocupantes revelam a saúde.", 6)}
      </div>
      <h3 class="subhead">${t("Pawn Movement", "Movimento de Peão")}</h3>
      <div class="icon-grid">
        ${iconCard("elbow", "Elbow", "Move your pawn in front of all other pawns on your cart.", "Cotovelada", "Leve seu peão para a frente de todos os outros peões da sua carroça.", 4)}
        ${iconCard("dash", "Dash", "From the front of your cart, move to the back of the cart in front; if it is full, swap with its back pawn.", "Disparada", "Da frente da sua carroça, vá para o fundo da carroça da frente; se estiver cheia, troque com o peão do fundo dela.", 4)}
        ${iconCard("push", "Push", "Push yourself or a pawn one or two seats behind you off your cart.", "Empurrão", "Empurre você mesmo ou um peão um ou dois lugares atrás de você para fora da carroça.", 4)}
      </div>
      <h3 class="subhead">${t("Cards and coins", "Cartas e moedas")}</h3>
      <div class="icon-grid">
        ${iconCard("remedy-card", "Remedy card", "The Remedy deck's card back. Draw one as an action (not with 3 in hand).", "Carta de Remédio", "O verso do baralho de Remédios. Compre uma como ação (não com 3 na mão).", 4)}
        ${iconCard("symptom-cards", "Symptom cards", "Green-backed cards with numbers; keep two, secret. Total 6+ = the plague.", "Cartas de Sintoma", "Cartas de verso verde com números; fique com duas, em segredo. Total 6+ = peste.", 5)}
        ${hasAlms() ? iconCard("alms-coin", "Alms coin", "Heads looks the same on every coin; the tails side says Naught, Plague or Cured.", "Moeda de Esmola", "A cara é igual em todas as moedas; o lado coroa diz Naught, Plague ou Cured.", 13) : ""}
      </div>`;
  }

  // ---------- examples ----------

  function examplesSection() {
    const examples = [
      [t("Where a pushed pawn lands", "Onde cai um peão empurrado"), [
        t("You push the pawn behind you off the lead cart. It goes to the back of the last cart if that cart has an open seat.", "Você empurra o peão atrás de você para fora da carroça da frente. Ele vai para o fundo da última carroça se ela tiver assento livre."),
        t("If the last cart is full, it goes to the back of the second cart instead.", "Se a última estiver cheia, ele vai para o fundo da segunda carroça."),
        t("If neither has room, it is left behind: it reveals, and if it is healthy you die of shame too.", "Se nenhuma tiver vaga, ele fica para trás: revela a saúde e, se estiver saudável, você também morre de vergonha.")
      ], 4],
      [t("Dashing to a full cart", "Disparada para uma carroça cheia"), [
        t("You are at the front of the second cart; the lead cart has 3 pawns and is far ahead.", "Você está na frente da segunda carroça; a da frente tem 3 peões e está bem adiante."),
        t("Distance does not matter: you swap with the lead cart's back pawn.", "A distância não importa: você troca com o peão do fundo da carroça da frente."),
        t("That pawn goes to the front of your former cart.", "Esse peão vai para a frente da sua antiga carroça.")
      ], 11],
      [t("Whipping an Elbow from the back", "Whip numa Cotovelada vinda do fundo"), [
        t("The back pawn of a 3-pawn cart tries to Elbow to the front.", "O peão do fundo de uma carroça com 3 peões tenta ir para a frente com Cotovelada."),
        t("If either of the two pawns in front plays a Whip, the Elbow fails completely — it passes nobody and stays at the back.", "Se qualquer um dos dois peões da frente jogar um Whip, a Cotovelada falha por completo — não passa ninguém e fica no fundo."),
        t("The failed move still counts as that player's action.", "O movimento fracassado ainda conta como a ação daquele jogador.")
      ], 9],
      [t("Two Leeches on one cart", "Dois Leeches numa carroça"), [
        t("Two players each Leech a high Symptom into Cedar's Mingle area.", "Dois jogadores colocam, cada um, um Sintoma alto via Leeches na área de Mistura da Cedar."),
        t("At the end of the round Cedar shows two rats: it Mingles.", "No fim da rodada a Cedar mostra dois ratos: ela faz Mistura."),
        t("The two Leeched cards are shuffled; one enters the Mingle instead of a deck card and the other is discarded face down.", "As duas cartas de Leeches são embaralhadas; uma entra na Mistura no lugar da carta do baralho e a outra é descartada virada para baixo.")
      ], 8],
      [t("An empty cart crosses first", "Uma carroça vazia cruza primeiro"), [
        t("Everyone was pushed off Birch, which still moves and crosses first.", "Todos foram empurrados para fora da Birch, que ainda anda e cruza primeiro."),
        t("Play continues and the other carts are not limited to one more round.", "O jogo continua e as outras carroças não ficam limitadas a mais uma rodada."),
        t("Plagued players like this: it leaves healthy players one fewer way out.", "Jogadores com peste gostam disso: sobra uma saída a menos para os saudáveis.")
      ], 11],
      [t("Two carts cross in the same round", "Duas carroças cruzam na mesma rodada"), [
        t("Cedar's dice would carry it 2 spaces past the finish; Oak's only 1 space past.", "Os dados da Cedar a levariam 2 espaços além da chegada; os da Oak só 1 espaço além."),
        t("Cedar crosses first. If its riders are all healthy, they win and Oak's riders never matter.", "A Cedar cruza primeiro. Se todos os ocupantes forem saudáveis, eles vencem e os da Oak não importam."),
        t("If tied on distance, the cart that started the round ahead crosses first.", "Se empatarem na distância, cruza primeiro a carroça que começou a rodada à frente.")
      ], 12]
    ];
    if (hasGhosts()) {
      examples.push([t("A Ghost's turn", "O turno de um Fantasma"), [
        t("A Ghost rides Oak; Birch leads and two dice show Birch apples.", "Um Fantasma está na Oak; a Birch lidera e dois dados mostram maçãs da Birch."),
        t("The Ghost rerolls one Birch apple. The die lands on a Cedar apple.", "O Fantasma rerrola uma maçã da Birch. O dado cai numa maçã da Cedar."),
        t("An apple: the Ghost is at the front of Oak (the 3rd cart), so it Dashes to the back of Cedar.", "Deu maçã: o Fantasma está na frente da Oak (a 3ª carroça), então faz Disparada para o fundo da Cedar.")
      ], 10]);
    }
    return `
      ${sectionHeading("examples", t("Examples & clarifications", "Exemplos e esclarecimentos"), sectionIndex("examples"), [...new Set(examples.map((example) => example[2]))].sort((a, b) => a - b))}
      <div class="example-grid">${examples.map(([title, items, page], index) => `
        <article class="example-card">
          <span class="card-number">${String(index + 1).padStart(2, "0")}</span>
          <h3>${title}</h3>
          ${lineList(items)}
          <div class="example-source"><span>${t("Based on the rulebook's rules and clarifications", "Com base nas regras e esclarecimentos do manual")}</span>${referenceLink(page)}</div>
        </article>`).join("")}</div>`;
  }

  // ---------- strategy ----------

  function strategySection() {
    return `
      ${sectionHeading("strategy", t("Strategy tips", "Dicas de estratégia"), sectionIndex("strategy"), [7, 8])}
      <div class="quick-grid">
        ${infoCard(t("HEALTHY", "SAUDÁVEL"), t("Managing Symptoms", "Controlar os Sintomas"), [
          t("Don't keep rat rolls for your own cart, to avoid Mingles.", "Não mantenha ratos da sua carroça nos dados, para evitar Misturas."),
          t("Lower your own numbers with Pomander.", "Baixe seus números com Pomander."),
          t("Use Leeches to influence the random card added to your cart's Mingle.", "Use Leeches para influenciar a carta aleatória que entra na Mistura da sua carroça.")
        ], 7)}
        ${infoCard(t("RACE", "CORRIDA"), t("Slowing other carts", "Atrasar outras carroças"), [
          t("Reroll the dice of fast carts.", "Rerrole os dados das carroças rápidas."),
          t("Force another cart to Mingle; its riders slow down while they rethink who to trust.", "Force outra carroça a fazer Mistura; os ocupantes desaceleram enquanto repensam em quem confiar."),
          t("Leech high Symptoms into a rival cart's Mingle — a plagued cart finishing first is fine for you.", "Coloque Sintomas altos via Leeches na Mistura de uma carroça rival — uma carroça com peste chegando antes não é problema para você.")
        ], 7)}
        ${infoCard(t("TABLE TALK", "CONVERSA NA MESA"), t("Communication & teamwork", "Comunicação e trabalho em equipe"), [
          t("Tell your cart-mates what you put in and got back in each Mingle.", "Conte aos colegas de carroça o que você colocou e recebeu em cada Mistura."),
          t("Plagued villagers will probably lie to look healthy.", "Aldeões com peste provavelmente vão mentir para parecer saudáveis."),
          t("Carts that shove each other off at random rarely win: use the Mingle hints before pushing.", "Carroças que se empurram ao acaso raramente vencem: use as pistas das Misturas antes de empurrar.")
        ], 7)}
        ${infoCard(t("PLAGUED", "COM PESTE"), t("Spreading the plague", "Espalhar a peste"), [
          t("Cause Mingles and raise your own Symptoms with Pomander.", "Provoque Misturas e aumente seus próprios Sintomas com Pomander."),
          t("Leech high Symptoms into Mingle areas.", "Coloque Sintomas altos nas áreas de Mistura via Leeches."),
          t("Sow mistrust among the leading carts to slow them.", "Semeie desconfiança nas carroças da frente para atrasá-las."),
          t("After the first cart crosses, careful rerolls can trap the others when the gates close.", "Depois que a primeira carroça cruzar, rerrolagens bem pensadas podem prender as outras quando os portões fecharem."),
          t("Getting empty carts across leaves healthy players fewer ways out.", "Fazer carroças vazias cruzarem deixa menos saídas para os saudáveis.")
        ], [8, 11])}
      </div>`;
  }

  // ---------- glossary ----------

  const glossary = [
    { term: ["Buboes", "Bubões (Buboes)"], text: ["The Symptom cards with value 4. They are removed for the initial deal (unless Violent Strain says otherwise) and then shuffled back into the deck.", "As cartas de Sintoma de valor 4. São retiradas na distribuição inicial (a menos que a Cepa Violenta diga o contrário) e depois embaralhadas de volta no baralho."], page: 3 },
    { term: ["Cart order", "Ordem das carroças"], text: ["Which cart is first, second and third along the street. It decides who starts the round and where Dashes and Pushes go. Ties on a space keep the order from the start of the round.", "Qual carroça é a primeira, segunda e terceira na rua. Decide quem começa a rodada e para onde vão Disparadas e Empurrões. Empates no mesmo espaço mantêm a ordem do início da rodada."], page: 5 },
    { term: ["Front / back of a cart", "Frente / fundo da carroça"], text: ["Each cart has up to 3 seats in a line. The front pawn of the leading cart starts each round; only the front pawn may Dash.", "Cada carroça tem até 3 assentos em fila. O peão da frente da carroça líder começa cada rodada; só o peão da frente pode fazer Disparada."], page: 4 },
    { term: ["Left behind", "Deixado para trás"], text: ["A pushed villager with no free seat in a cart behind (or pushed off the 3rd cart) is out of the game. If they are healthy, the pusher is out too.", "Um aldeão empurrado sem assento livre numa carroça atrás (ou empurrado da 3ª carroça) está fora do jogo. Se estiver saudável, quem empurrou também sai."], page: 4 },
    { term: ["Mingle", "Mistura (Mingle)"], text: ["The pooling and re-dealing of Symptom cards among everyone on a cart that shows 2+ rats of its color at the end of a round.", "O ajuntamento e a redistribuição das cartas de Sintoma entre todos de uma carroça que mostra 2+ ratos da sua cor no fim da rodada."], page: 5 },
    { term: ["Mingle area", "Área de Mistura"], text: ["A spot by the board for each cart where Mingling cards (and Leeched cards waiting for the next Mingle) are placed.", "Um lugar ao lado do tabuleiro para cada carroça onde ficam as cartas da Mistura (e as cartas de Leeches esperando a próxima Mistura)."], page: 5 },
    { term: ["Plague", "Peste"], text: ["You have it for the rest of the game once your two Symptom cards total 6 or more at any point.", "Você a tem pelo resto da partida assim que suas duas cartas de Sintoma somarem 6 ou mais em qualquer momento."], page: 2 },
    { term: ["Remedy", "Remédio"], text: ["A hidden card with two possible uses (top or bottom); one is chosen and the card is discarded.", "Uma carta escondida com dois usos possíveis (de cima ou de baixo); escolhe-se um e a carta é descartada."], page: 6 },
    { term: ["Symptom", "Sintoma"], text: ["A secret numbered card. You always hold two.", "Uma carta numerada secreta. Você sempre tem duas."], page: 3 }
  ];

  function glossarySection() {
    const visible = [...glossary];
    if (hasGhosts()) {
      visible.push({ term: ["Rider", "Ocupante"], text: ["This guide's word for any pawn — player or Ghost — sitting on a cart.", "Termo deste guia para qualquer peão — jogador ou Fantasma — sentado numa carroça."], page: 4 });
      visible.push({ term: ["Ghost", "Fantasma"], text: ["An automated villager added in 1–3 player games, with its own seat, character card, pawn and secret Symptoms.", "Um aldeão automático acrescentado em partidas de 1–3 jogadores, com lugar, carta de personagem, peão e Sintomas secretos próprios."], page: 9 });
    } else {
      visible.push({ term: ["Rider", "Ocupante"], text: ["This guide's word for any player's pawn sitting on a cart.", "Termo deste guia para o peão de qualquer jogador sentado numa carroça."], page: 4 });
    }
    if (abilities()) {
      visible.push({ term: ["Special Action", "Ação Especial"], text: ["The ability printed on the back side of a character card, used as a 4th action option in the Character Abilities mode.", "A habilidade impressa no verso da carta de personagem, usada como 4ª opção de ação no modo Habilidades de Personagem."], page: 13 });
    }
    if (hasAlms()) {
      visible.push({ term: ["Alms", "Esmolas (Alms)"], text: ["Coins secretly given to players: Naught (nothing), Plague (gives the plague) or Cured (immunity).", "Moedas dadas em segredo aos jogadores: Naught (nada), Plague (dá a peste) ou Cured (imunidade)."], page: 13 });
    }
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), sectionIndex("glossary"), [...new Set(visible.map((item) => item.page))].sort((a, b) => a - b))}
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
    document.body.classList.add("theme-bristol");
    document.documentElement.lang = state.language;
    document.title = t("Bristol 1350 — Field Manual", "Bristol 1350 — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Bristol 1350: 1–9 players with Ghosts, optional game modes, a match-filtered setup checklist, quick reference and iconography.",
        "Regras interativas bilíngues de Bristol 1350: 1–9 jogadores com Fantasmas, modos opcionais, lista de preparação filtrada, referência rápida e iconografia."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook · Dark Cities, volume 1", "Livro interativo · Dark Cities, volume 1")}</p>
          <h1>Bristol 1350</h1>
          <p class="hero-intro">${t(
            "The black plague has reached Bristol. Race one of three apple carts out of town — but if anyone aboard is sick when you leave, your whole cart dies. Roll and reroll shared dice, shove villagers between carts, and guess who is hiding their symptoms.",
            "A peste negra chegou a Bristol. Corra numa das três carroças de maçãs para fora da cidade — mas, se alguém a bordo estiver doente quando vocês saírem, a carroça inteira morre. Role e rerrole os dados compartilhados, empurre aldeões entre carroças e adivinhe quem está escondendo os sintomas."
          )}</p>
          <div class="hero-meta"><span>${t("1–9 players", "1–9 jogadores")}</span><span>${t("20–40 min", "20–40 min")}</span><span>${t("Ages 13+", "13+ anos")}</span><span>${t("Hidden roles · race", "Papéis ocultos · corrida")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/bristol-1350.webp" alt="${t("Cover of the Bristol 1350 rulebook", "Capa do manual de Bristol 1350")}" fetchpriority="high"><figcaption>${t("Rulebook cover · illustration by Sarah Keele", "Capa do manual · ilustração de Sarah Keele")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("Town crier", "Arauto da cidade")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column bristol-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied Bristol 1350 rulebook (Facade Games, 1st printing): the game for 1–9 players, Ghosts for 1–3 players, and all optional game modes. Character special actions are printed on the character cards; points marked “Guide's reading” are interpretations where the rulebook is silent. Page links use the rulebook's printed page numbers.",
            "Este guia cobre o manual fornecido de Bristol 1350 (Facade Games, 1ª impressão): o jogo para 1–9 jogadores, os Fantasmas para 1–3 jogadores e todos os modos opcionais. As ações especiais dos personagens estão impressas nas cartas de personagem; pontos marcados como “Leitura do guia” são interpretações onde o manual é omisso. Os links de página usam a numeração impressa do manual."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${victorySection()}</section>
          <section class="rule-section">${turnSection()}</section>
          <section class="rule-section">${minglesSection()}</section>
          <section class="rule-section">${remediesSection()}</section>
          ${hasGhosts() ? `<section class="rule-section">${ghostsSection()}</section>` : ""}
          ${activeModes().length ? `<section class="rule-section">${modesSection()}</section>` : ""}
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${strategySection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the Bristol 1350 rulebook. Rules & gameplay: Travis Hancock; graphic design: Holly Hancock; illustration: Sarah Keele. Published by Facade Games.",
        "Guia pessoal de consulta baseado no manual de Bristol 1350. Regras e jogabilidade: Travis Hancock; design gráfico: Holly Hancock; ilustração: Sarah Keele. Publicado pela Facade Games."
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
      renderInto(root);
      return;
    }
    if (button.hasAttribute("data-setup-reset")) {
      setupState = { signature: signature(), checks: [] };
      saveSetup();
      renderInto(root);
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
      root.querySelector(".bristol-page")?.prepend(notice);
    }
    notice.textContent = storageNoticeText();
  }

  function applyConfigChange(mutator) {
    const before = signature();
    const draft = JSON.parse(JSON.stringify(state));
    mutator(draft);
    state = normalizePreferences(draft);
    savePreferences();
    if (signature() !== before) {
      resetSetupForConfig();
    }
    const scrollY = window.scrollY;
    renderInto(root);
    window.scrollTo(0, scrollY);
  }

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !root || !root.contains(target)) {
      return;
    }
    if (target.matches("[data-players]")) {
      const value = target.dataset.players;
      if (PLAYER_COUNTS.includes(value) && value !== state.players) {
        applyConfigChange((draft) => { draft.players = value; });
      }
      return;
    }
    if (target.matches("[data-characters]")) {
      const value = target.dataset.characters;
      if (CHARACTER_MODES.includes(value) && value !== state.characters) {
        applyConfigChange((draft) => { draft.characters = value; });
      }
      return;
    }
    if (target.matches("[data-violent]")) {
      const value = target.dataset.violent;
      if (VIOLENT_MODES.includes(value) && value !== state.violent) {
        applyConfigChange((draft) => { draft.violent = value; });
      }
      return;
    }
    if (target.matches("[data-alms]")) {
      const value = target.dataset.alms;
      if (ALMS_MODES.includes(value) && value !== state.alms) {
        applyConfigChange((draft) => { draft.alms = value; });
      }
      return;
    }
    if (target.matches("[data-toggle]")) {
      const key = target.dataset.toggle;
      if (["mild", "speedy", "manuscript", "points"].includes(key)) {
        const value = target.dataset.toggleValue === "yes";
        if (value !== state[key]) {
          applyConfigChange((draft) => { draft[key] = value; });
        }
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

  window.Bristol1350 = { renderInto, onClick, onChange };
})();
