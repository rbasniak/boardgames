(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.betrayal-at-house-on-the-hill.v1";
  const SETUP_KEY = "field-manual.betrayal-at-house-on-the-hill.setup.v1";
  const MANUAL = "betrayal-at-house-on-the-hill_core.pdf";
  const ICONS = "assets/betrayal-at-house-on-the-hill/icons/";
  const ART = "assets/betrayal-at-house-on-the-hill/art/";

  // ---------- rules data ----------

  const PLAYER_COUNTS = ["3", "4", "5", "6"];
  const defaults = { language: "pt-BR", players: "4" };

  // Box contents, rulebook p. 6.
  const BOX = { boards: 6, figures: 6, clips: 30, dice: 8, events: 43, items: 22, omens: 9, scenarios: 5, playerRefs: 6, roomTiles: 42, startingTiles: 3, tokens: 114 };

  // The five Scenario cards, titles as printed on the pictured cards (p. 6).
  const SCENARIOS = ["A Mysterious Invitation", "Cursed!", "For Sale", "A Strange Disappearance", "Paranormal Investigators"];

  // Board colors: the six boards pictured on p. 6 (Isa yellow, Stephanie blue, Father Warren white, Brittani purple,
  // Oliver red, Sammy green). The second character of each pair is this guide's reading of the matching portrait
  // background on pp. 20–21.
  const COLORS = {
    red: ["Red", "Vermelho"],
    blue: ["Blue", "Azul"],
    green: ["Green", "Verde"],
    yellow: ["Yellow", "Amarelo"],
    white: ["White", "Branco"],
    purple: ["Purple", "Roxo"]
  };

  // Character descriptions, pp. 20–21. month is 1–12.
  const CHARACTERS = [
    { id: "josef", name: "Josef “Brosef” Hooper", age: 25, month: 2, day: 25, color: "red", page: 20, text: ["A college athlete with a soft spot for the people he cares about.", "Atleta universitário que se mostra protetor com as pessoas de quem gosta."] },
    { id: "oliver", name: "Oliver Swift", age: 33, month: 7, day: 3, color: "red", page: 20, text: ["A fast runner and loner who studies philosophy.", "Corredor veloz e solitário que estuda filosofia."] },
    { id: "persephone", name: "Persephone Puleri", age: 49, month: 4, day: 15, color: "blue", page: 20, text: ["Runs a shop of crystals, herbs and paranormal supplies.", "Tem uma loja de cristais, ervas e artigos paranormais."] },
    { id: "stephanie", name: "Stephanie Richter", age: 40, month: 1, day: 12, color: "blue", page: 20, text: ["An amateur documentary filmmaker looking for a story.", "Documentarista amadora em busca de uma história."] },
    { id: "sammy", name: "Sammy Angler", age: 9, month: 9, day: 18, color: "green", page: 20, text: ["A 9-year-old obsessed with stage magic.", "Um menino de 9 anos obcecado por mágica de palco."] },
    { id: "jaden", name: "Jaden Jones", age: 11, month: 10, day: 4, color: "green", page: 20, text: ["A kid detective documenting everything.", "Um detetive mirim que documenta tudo."] },
    { id: "isa", name: "Isa Valencia", age: 11, month: 3, day: 30, color: "yellow", page: 21, text: ["A strange kid who strongly believes in the supernatural.", "Uma menina estranha que acredita muito no sobrenatural."] },
    { id: "anita", name: "Anita Hernandez", age: 12, month: 6, day: 11, color: "yellow", page: 21, text: ["Works in her superstitious parents’ tea shop.", "Trabalha na loja de chá dos pais supersticiosos."] },
    { id: "dan", name: "Dan Nguyen, M.D.", age: 60, month: 5, day: 6, color: "white", page: 21, text: ["The town doctor, tired of the house’s strange injuries.", "O médico da cidade, cansado dos ferimentos estranhos ligados à casa."] },
    { id: "warren", name: "Father Warren Leung", age: 71, month: 11, day: 17, color: "white", page: 21, text: ["A no-nonsense priest who has banished a demon or two.", "Um padre durão que já expulsou um ou dois demônios."] },
    { id: "michelle", name: "Michelle Monroe", age: 19, month: 8, day: 19, color: "purple", page: 21, text: ["A lacrosse player used to being the underdog.", "Jogadora de lacrosse acostumada a ser azarona."] },
    { id: "brittani", name: "Brittani “Beat Box” Bowen", age: 22, month: 12, day: 1, color: "purple", page: 21, text: ["A DJ hunting for new party locations.", "Uma DJ em busca de novos lugares para festas."] }
  ];

  // The 114 tokens (p. 6). Two faces under one count = front and back of the same token (guide's reading of the total).
  const TOKENS = [
    { files: ["large-monster"], count: 16, printed: false, name: ["Large Monster tokens (pictured: Werewolf)", "Fichas de Monstro Grande (na imagem: Werewolf)"], note: ["Round. The name “Large Monster token” is used in the rulebook’s haunt sample. Flip a monster token to its stunned side when the monster is stunned.", "Redondas. O nome “Large Monster token” aparece no exemplo de assombração do manual. Vire a ficha do monstro para o lado atordoado quando ele for atordoado."], page: [6, 16, 19] },
    { files: ["small-monster"], count: 20, printed: true, name: ["Small Monster", "Small Monster (Monstro Pequeno)"], note: ["Monster tokens: flip to the stunned side when stunned.", "Fichas de monstro: vire para o lado atordoado quando ele for atordoado."], page: [6, 19] },
    { files: ["explorer"], count: 6, printed: false, name: ["Explorer portrait tokens", "Fichas com retrato de explorador"], note: ["Pentagons with a character portrait. The rulebook gives them no name; the haunt tells you when they are used.", "Pentágonos com retrato de personagem. O manual não lhes dá nome; a assombração diz quando são usadas."], page: 6 },
    { files: ["trait"], count: 8, printed: true, name: ["Trait", "Trait (Atributo)"], note: ["Used only when a haunt calls for them.", "Usadas só quando uma assombração as pede."], page: 6 },
    { files: ["number"], count: 18, printed: false, name: ["Number tokens (pictured: 1)", "Fichas numéricas (na imagem: 1)"], note: ["Used only when a haunt calls for them.", "Usadas só quando uma assombração as pede."], page: 6 },
    { files: ["secret-passage"], count: 2, printed: true, name: ["Secret Passage", "Secret Passage (Passagem Secreta)"], note: ["Used only when a haunt calls for them.", "Usadas só quando uma assombração as pede."], page: 6 },
    { files: ["blessing"], count: 1, printed: true, name: ["Blessing", "Blessing (Bênção)"], note: ["Used only when a haunt calls for it.", "Usada só quando uma assombração a pede."], page: 6 },
    { files: ["obstacle"], count: 3, printed: true, name: ["Obstacle", "Obstacle (Obstáculo)"], note: ["Printed: it costs 2 moves to leave this tile. Some tokens are obstacles even before the haunt.", "Impresso: custa 2 movimentos sair desta peça. Algumas fichas são obstáculos mesmo antes da assombração."], page: [6, 15] },
    { files: ["videotape", "portal"], count: 5, printed: true, name: ["Videotape / Portal", "Videotape / Portal"], note: ["Two faces of one token.", "Duas faces da mesma ficha."], page: 6 },
    { files: ["trap", "food"], count: 5, printed: true, name: ["Trap / Food", "Trap / Food (Armadilha / Comida)"], note: ["Two faces of one token.", "Duas faces da mesma ficha."], page: 6 },
    { files: ["hidden", "searched"], count: 5, printed: true, name: ["Hidden / Searched", "Hidden / Searched (Escondido / Revistado)"], note: ["Two faces of one token.", "Duas faces da mesma ficha."], page: 6 },
    { files: ["altar", "contract"], count: 1, printed: true, name: ["Altar / Contract", "Altar / Contract (Altar / Contrato)"], note: ["Two faces of one token.", "Duas faces da mesma ficha."], page: 6 },
    { files: ["nest", "blood"], count: 5, printed: true, name: ["Nest / Blood", "Nest / Blood (Ninho / Sangue)"], note: ["Two faces of one token. The rulebook mentions tokens counting the blood you have collected.", "Duas faces da mesma ficha. O manual cita fichas que contam o sangue coletado."], page: [6, 8] },
    { files: ["fire"], count: 6, printed: true, name: ["Fire", "Fire (Fogo)"], note: ["Used only when a haunt calls for them.", "Usadas só quando uma assombração as pede."], page: 6 },
    { files: ["on", "off"], count: 5, printed: true, name: ["On / Off", "On / Off (Ligado / Desligado)"], note: ["Two faces of one token.", "Duas faces da mesma ficha."], page: 6 },
    { files: ["rune"], count: 8, printed: false, name: ["Green symbol tokens", "Fichas de símbolo verde"], note: ["Small green squares with a symbol and no printed name.", "Pequenos quadrados verdes com um símbolo e sem nome impresso."], page: 6 }
  ];

  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------
  // Only the language and the player count are stored. The guide never asks for, shows or stores
  // who the traitor is, which haunt was triggered or anything from the haunt books.

  function normalizePreferences(saved) {
    return {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      players: PLAYER_COUNTS.includes(String(saved?.players)) ? String(saved.players) : defaults.players
    };
  }

  // The player count changes the preparation; the language never clears the checklist.
  function signature(source = state) {
    return `${source.players}`;
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Betrayal at House on the Hill preferences.", error);
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
      console.error("Could not read Betrayal at House on the Hill setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Betrayal at House on the Hill preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Betrayal at House on the Hill setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function players() {
    return Number(state.players);
  }

  function scriptBase() {
    const script = document.querySelector('script[src*="betrayal-at-house-on-the-hill.js"]');
    return script?.src || document.baseURI;
  }

  // The PDF keeps the cover (printed p. 1) and the back cover (printed p. 24) as single pages and stores
  // printed pages 2–23 as two-page spreads: printed pages 2–3 are PDF page 2, 4–5 are PDF page 3, and so on.
  function pdfPage(page) {
    return page === 1 ? 1 : Math.floor(page / 2) + 1;
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
          <p class="eyebrow">${t("THE HOUSE ON THE HILL", "A CASA DA COLINA")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="bth-section-references">${uniquePages(pages).map(referenceLink).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
  }

  function interpretation(en, pt) {
    return `<span class="bth-interpretation">${t("Guide's reading", "Leitura do guia")}</span> ${t(en, pt)}`;
  }

  // The supplied rulebook is in English: in PT-BR, show the printed English term so components can be matched.
  function en(term) {
    return state.language === "pt-BR" ? ` <span class="bth-en" lang="en">(${term})</span>` : "";
  }

  function sym(file, alt) {
    return `<img class="bth-inline-icon" src="${ICONS}${file}.webp" alt="${alt}">`;
  }

  function eventSym() {
    return sym("event", t("Event symbol", "Símbolo de Evento"));
  }

  function itemSym() {
    return sym("item", t("Item symbol", "Símbolo de Item"));
  }

  function omenSym() {
    return sym("omen", t("Omen symbol", "Símbolo de Presságio"));
  }

  function actionSym() {
    return sym("special-action", t("Special action symbol", "Símbolo de ação especial"));
  }

  function skullSym() {
    return sym("death", t("Skull (death) symbol", "Símbolo de caveira (morte)"));
  }

  function iconCard(file, titleEn, bodyEn, titlePt, bodyPt, pages) {
    const title = t(titleEn, titlePt);
    return `
      <article class="icon-card">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}.webp" alt="${title}"></span>
        <div><strong>${title}</strong><p>${t(bodyEn, bodyPt)}</p>${refs(pages)}</div>
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

  function figure(file, altEn, altPt, captionEn, captionPt, page) {
    return `
      <figure class="bth-figure">
        <img src="${ART}${file}.webp" alt="${t(altEn, altPt)}" loading="lazy">
        <figcaption>${t(captionEn, captionPt)} ${referenceLink(page)}</figcaption>
      </figure>`;
  }

  function playersLabel(count = state.players) {
    return t(`${count} players`, `${count} jogadores`);
  }

  // Variable player count {3/4/5/6}: position of the value to read, p. 18.
  function countPosition(count = players()) {
    return Number(count) - 2;
  }

  function ordinal(n) {
    return t(["", "1st", "2nd", "3rd", "4th"][n], ["", "1º", "2º", "3º", "4º"][n]);
  }

  function sampleValue(count = players()) {
    return [1, 5, 7, 9][Number(count) - 3];
  }

  function colorName(color) {
    return t(COLORS[color][0], COLORS[color][1]);
  }

  function monthName(month) {
    const namesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const namesPt = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    return t(namesEn[month - 1], namesPt[month - 1]);
  }

  function birthdayLabel(character) {
    return t(`${monthName(character.month)} ${character.day}`, `${character.day} de ${monthName(character.month)}`);
  }

  // Days from today (local date) until each character's next birthday; a birthday today counts as 0.
  function daysUntil(character, today = new Date()) {
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let next = new Date(today.getFullYear(), character.month - 1, character.day);
    if (next < start) {
      next = new Date(today.getFullYear() + 1, character.month - 1, character.day);
    }
    return Math.round((next - start) / 86400000);
  }

  function birthdayOrder() {
    return [...CHARACTERS].sort((a, b) => daysUntil(a) - daysUntil(b));
  }

  function partner(character) {
    return CHARACTERS.find((other) => other.color === character.color && other.id !== character.id);
  }

  // ---------- header ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["explorers", t("Explorers & traits", "Exploradores e atributos")],
      ["turn", t("Before the haunt", "Antes da assombração")],
      ["cards-dice", t("Cards & dice", "Cartas e dados")],
      ["haunt", t("The haunt begins", "A assombração começa")],
      ["after-haunt", t("After the haunt begins", "Depois que a assombração começa")],
      ["icons", t("Iconography", "Iconografia")],
      ["examples", t("Examples", "Exemplos")],
      ["changes", t("Changes from earlier editions", "Mudanças das edições anteriores")],
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
          <span class="brand-mark" aria-hidden="true">BH</span>
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
      `${readFailed ? "This browser could not read the saved Betrayal match or setup progress; defaults are shown. " : ""}${writeFailed ? "The latest change could not be saved and is visible on screen only." : ""}`,
      `${readFailed ? "Este navegador não conseguiu ler a partida ou o progresso de Betrayal salvos; as opções padrão estão sendo mostradas. " : ""}${writeFailed ? "A alteração mais recente não pôde ser salva e aparece somente na tela." : ""}`
    ).trim();
  }

  // ---------- configuration ----------

  function choiceCard(name, value, dataAttr, checked, title, description) {
    return `
      <label class="bth-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" ${dataAttr} ${checked ? "checked" : ""}>
        <span class="bth-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function group(legend, selected, intro, cards, columns = "") {
    return `
      <fieldset class="bth-choice-group">
        <legend>${legend} <span>${selected}</span></legend>
        <p class="bth-choice-intro">${intro}</p>
        <div class="bth-choice-grid ${columns}">${cards}</div>
      </fieldset>`;
  }

  function playerChoiceText(count) {
    const n = Number(count);
    const unused = 6 - n;
    const boxText = unused
      ? t(`${unused} board${unused === 1 ? "" : "s"}, figure${unused === 1 ? "" : "s"} and Player reference card${unused === 1 ? "" : "s"} stay in the box.`, `${unused} tabuleiro${unused === 1 ? "" : "s"}, miniatura${unused === 1 ? "" : "s"} e carta${unused === 1 ? "" : "s"} de referência do jogador ficam na caixa.`)
      : t("Every board, figure and Player reference card is in use.", "Todos os tabuleiros, miniaturas e cartas de referência do jogador são usados.");
    return `${t(`${n} explorers, ${n} character boards (one side each), ${4 * n} clips.`, `${n} exploradores, ${n} tabuleiros de personagem (um lado cada), ${4 * n} presilhas.`)} ${boxText} ${t(`In haunt values written {3/4/5/6}, read the ${ordinal(countPosition(n))} number.`, `Nos valores de assombração escritos {3/4/5/6}, leia o ${ordinal(countPosition(n))} número.`)}`;
  }

  function matchConfiguration() {
    return `
      <section class="controls-panel bth-config" id="build-match" aria-labelledby="bth-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="bth-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "The rulebook has no expansions or optional modes: the only choice that changes the preparation is how many explore the house. It sets how many boards, figures, clips and reference cards you use and which number you read in the haunt books’ {3/4/5/6} values. The character, the Scenario card and the haunt are picked at the table and are not stored here. The guide never asks for, shows or saves who becomes the traitor or anything from the haunt books — only the language and the player count are stored on this device.",
              "O manual não tem expansões nem modos opcionais: a única escolha que muda a preparação é quantos exploram a casa. Ela define quantos tabuleiros, miniaturas, presilhas e cartas de referência você usa e qual número ler nos valores {3/4/5/6} dos livros de assombração. O personagem, a carta de Cenário e a assombração são escolhidos à mesa e não ficam salvos aqui. O guia nunca pede, mostra nem salva quem vira traidor nem nada dos livros de assombração — só o idioma e o número de jogadores ficam salvos neste aparelho."
            )}</p>
          </div>
        </div>
        ${group(t("Explorers · selected:", "Exploradores · selecionado:"), playersLabel(),
          `${t("Betrayal at House on the Hill (3rd edition) is for 3–6 players. The rulebook gives no rules for 2 or 7+ players.", "Betrayal at House on the Hill (3ª edição) é para 3–6 jogadores. O manual não traz regras para 2 ou 7+ jogadores.")} ${referenceLink(1)} ${referenceLink(18)}`,
          PLAYER_COUNTS.map((count) => choiceCard("bth-players", count, `data-players="${count}"`, state.players === count, playersLabel(count), playerChoiceText(count))).join(""))}
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function setupPhases() {
    const n = players();
    const unused = 6 - n;
    return [
      {
        id: "books",
        title: t("Haunt books and reference cards", "Livros de assombração e cartas de referência"),
        pages: [6, 7],
        items: [
          t("Set aside the two haunt books, <em>Traitor’s Tome</em> and <em>Secrets of Survival</em>, closed. You use them only once the haunt has started — and then each side reads only its own book and only the haunt the game sends you to.", "Separe os dois livros de assombração, <em>Traitor’s Tome</em> (Tomo do Traidor) e <em>Secrets of Survival</em> (Segredos da Sobrevivência), fechados. Eles só são usados depois que a assombração começa — e então cada lado lê só o próprio livro e só a assombração indicada pelo jogo."),
          t("Place the Monster reference card and the Traitor reference card face up on the table, within sight of all players.", "Coloque a carta de referência de Monstro e a carta de referência do Traidor viradas para cima na mesa, à vista de todos."),
          t(`Give each of the ${n} players a Player reference card.${unused ? ` Return the other ${unused === 1 ? "one" : unused} to the box.` : ""}`, `Dê a cada um dos ${n} jogadores uma carta de referência do jogador.${unused ? (unused === 1 ? " Devolva a outra à caixa." : ` Devolva as outras ${unused} à caixa.`) : ""}`)
        ]
      },
      {
        id: "explorers",
        title: t("Choose your explorers", "Escolham os exploradores"),
        pages: [6, 7, 8, 9, 20, 21],
        items: [
          t("Each player chooses a character and takes the matching character board, figure and figure base (matched by color). Insert each figure into its base.", "Cada jogador escolhe um personagem e pega o tabuleiro de personagem, a miniatura e a base de miniatura correspondentes (pela cor). Encaixe cada miniatura na sua base."),
          `${t("The 6 boards are double-sided: 12 characters, one per side. Play your character’s side face up.", "Os 6 tabuleiros têm dois lados: 12 personagens, um por lado. Jogue com o lado do seu personagem para cima.")} ${interpretation("each board color has a single figure and base, so two players cannot use the two sides of the same board. The pairs are listed under Explorers & traits.", "cada cor de tabuleiro tem uma só miniatura e uma só base, então dois jogadores não podem usar os dois lados do mesmo tabuleiro. Os pares estão em Exploradores e atributos.")}`,
          t("Give each player 4 plastic clips. Clip them onto the board so each one points to a different green number: the starting values of Might, Speed, Knowledge and Sanity. Trait values are public — never hide them.", "Dê 4 presilhas de plástico a cada jogador. Prenda-as no tabuleiro de modo que cada uma aponte para um número verde diferente: os valores iniciais de Força, Velocidade, Conhecimento e Sanidade. Os valores dos atributos são públicos — nunca os esconda."),
          `${unused ? t(`Return the ${unused} unused board${unused === 1 ? "" : "s"}, figure${unused === 1 ? "" : "s"} and base${unused === 1 ? "" : "s"} to the box.`, `Devolva à caixa ${unused === 1 ? "o tabuleiro, a miniatura e a base não usados" : `os ${unused} tabuleiros, miniaturas e bases não usados`}.`) : t("All six boards, figures and bases are in use.", "Todos os seis tabuleiros, miniaturas e bases estão em uso.")} ${interpretation(`the other ${BOX.clips - 4 * n} clips are spares; the rulebook gives them no use.`, `as outras ${BOX.clips - 4 * n} presilhas são reservas; o manual não lhes dá uso.`)}`
        ]
      },
      {
        id: "decks",
        title: t("Dice and card decks", "Dados e baralhos"),
        pages: [6, 7, 8],
        items: [
          t("Place all 8 dice within easy reach of all players.", "Deixe os 8 dados ao alcance de todos os jogadores."),
          `${t(`Sort the 74 game cards by type (back): ${BOX.events} Event${eventSym()}, ${BOX.items} Item${itemSym()} and ${BOX.omens} Omen${omenSym()}.`, `Separe as 74 cartas de jogo por tipo (verso): ${BOX.events} de Evento${eventSym()}, ${BOX.items} de Item${itemSym()} e ${BOX.omens} de Presságio${omenSym()}${en("Event / Item / Omen")}.`)}`,
          t("Shuffle each type into its own face-down deck and place the three decks within easy reach of all players.", "Embaralhe cada tipo num baralho próprio, virado para baixo, e deixe os três baralhos ao alcance de todos.")
        ]
      },
      {
        id: "house",
        title: t("Start building the house", "Comece a construir a casa"),
        pages: [6, 7],
        items: [
          `${t(`Find the 3 starting tiles, each marked with the starting-tile symbol ${sym("starting-tile", "Starting tile symbol")}: the long triple tile (Ground Floor Staircase / Hallway / Entrance Hall), the Basement Landing and the Upper Landing.`, `Encontre as 3 peças iniciais, cada uma marcada com o símbolo de peça inicial ${sym("starting-tile", "Símbolo de peça inicial")}: a peça tripla comprida (Ground Floor Staircase / Hallway / Entrance Hall — escadaria do térreo, corredor e saguão de entrada), o Basement Landing (patamar do porão) e o Upper Landing (patamar superior).`)}`,
          t("Place them in the center of the table, about 20–25 cm (8–10 inches) apart: each one is the seed of a region — Ground Floor, Basement and Upper Floor — and needs room to grow.", "Coloque-as no centro da mesa, a cerca de 20–25 cm (8–10 polegadas) umas das outras: cada uma é o começo de uma região — Térreo, Porão e Andar Superior — e precisa de espaço para crescer."),
          t(`Shuffle the remaining ${BOX.roomTiles} room tiles together and put them on the table in one face-down stack. The back of each tile shows its region.`, `Embaralhe as ${BOX.roomTiles} peças de cômodo restantes e ponha-as na mesa numa única pilha virada para baixo. O verso de cada peça mostra a sua região.`),
          t("Place every explorer figure on the Entrance Hall space of the large starting tile.", "Coloque todas as miniaturas de explorador no espaço do Entrance Hall (saguão de entrada) da peça inicial grande.")
        ]
      },
      {
        id: "scenario",
        title: t("Choose the Scenario card", "Escolham a carta de Cenário"),
        pages: [5, 6, 7, 14],
        items: [
          t(`As a group, review the ${BOX.scenarios} Scenario cards: ${SCENARIOS.map((name) => `<em>${name}</em>`).join(", ")}.`, `Em grupo, leiam as ${BOX.scenarios} cartas de Cenário${en("Scenario")}: ${SCENARIOS.map((name) => `<em>${name}</em>`).join(", ")}.`),
          t("Choose one. Its story is why your explorers came to the house, and it decides which haunt you will face. Keep it on the table, visible to everyone.", "Escolham uma. A história dela é o motivo de os exploradores estarem na casa, e ela decide qual assombração vocês vão enfrentar. Deixem-na na mesa, à vista de todos."),
          t(`Return the other ${BOX.scenarios - 1} Scenario cards to the game box.`, `Devolvam as outras ${BOX.scenarios - 1} cartas de Cenário à caixa.`),
          t("Do not look anything up in the haunt books now: the Scenario card is only read when the haunt starts.", "Não consultem nada nos livros de assombração agora: a carta de Cenário só é consultada quando a assombração começa.")
        ]
      },
      {
        id: "aside",
        title: t("Set the haunt components aside", "Separe os componentes da assombração"),
        pages: [6, 7, 8],
        items: [
          t("Set aside the Number Track and its pointer.", "Separe a Trilha Numérica (Number Track) e o seu marcador."),
          t(`Set aside the ${BOX.tokens} cardboard tokens. Some of these come into play at the start of the haunt; the haunt’s “Tokens Needed” list says which.`, `Separe as ${BOX.tokens} fichas de papelão. Algumas entram em jogo no início da assombração; a lista “Tokens Needed” da assombração diz quais.`)
        ]
      },
      {
        id: "first",
        title: t("Find the first player", "Descubra quem começa"),
        pages: [7, 20, 21],
        items: [
          t("Check the birthdays printed on the character boards. The player whose explorer has the next birthday takes the first turn. Play then goes clockwise.", "Confiram os aniversários impressos nos tabuleiros de personagem. Quem tiver o explorador com o próximo aniversário faz o primeiro turno. Depois o jogo segue em sentido horário."),
          `${interpretation("“next” counts forward from today’s date, and a birthday today counts as the next one.", "“próximo” conta a partir da data de hoje, e um aniversário hoje conta como o próximo.")} ${t("Today’s order of all 12 characters is under Explorers & traits.", "A ordem de hoje dos 12 personagens está em Exploradores e atributos.")}`
        ]
      }
    ];
  }

  function thumb(file, altEn, altPt) {
    return `<img class="bth-thumb" src="${ART}${file}.webp" alt="${t(altEn, altPt)}" loading="lazy">`;
  }

  function inventory() {
    const n = players();
    const unused = 6 - n;
    const cards = [
      infoCard(t(`PER PLAYER · ×${n}`, `POR JOGADOR · ×${n}`), t("In front of each explorer", "À frente de cada explorador"), [
        `${thumb("board-isa", "Character board (Isa Valencia)", "Tabuleiro de personagem (Isa Valencia)")} ${t("1 character board, one side face up, with 4 clips on the green starting values.", "1 tabuleiro de personagem, um lado para cima, com 4 presilhas nos valores iniciais verdes.")}`,
        `${thumb("figures", "The six character figures", "As seis miniaturas de personagem")} ${t("1 figure in its colored base (on the Entrance Hall).", "1 miniatura na base colorida (no Entrance Hall).")}`,
        `${thumb("player-reference", "Player reference card", "Carta de referência do jogador")} ${t("1 Player reference card.", "1 carta de referência do jogador.")}`,
        t("Later: the Items and Omens you find, face up in front of you.", "Depois: os Itens e Presságios que você encontrar, virados para cima à sua frente.")
      ], [6, 7, 8]),
      infoCard(t("TABLE", "MESA"), t("Shared components", "Componentes compartilhados"), [
        `${thumb("dice", "Dice", "Dados")} ${t("8 dice (faces with 0, 1 or 2 dots).", "8 dados (faces com 0, 1 ou 2 pontos).")}`,
        `${thumb("back-event", "Event card back", "Verso de carta de Evento")}${thumb("back-item", "Item card back", "Verso de carta de Item")}${thumb("back-omen", "Omen card back", "Verso de carta de Presságio")} ${t(`3 face-down decks: ${BOX.events} Events, ${BOX.items} Items, ${BOX.omens} Omens.`, `3 baralhos virados para baixo: ${BOX.events} Eventos, ${BOX.items} Itens, ${BOX.omens} Presságios.`)}`,
        `${thumb("starting-tiles", "The three starting tiles", "As três peças iniciais")} ${t("3 starting tiles in the center, 20–25 cm apart.", "3 peças iniciais no centro, a 20–25 cm umas das outras.")}`,
        `${thumb("room-tile-back", "Room tile back (Basement)", "Verso de peça de cômodo (Basement)")} ${t(`1 face-down stack of ${BOX.roomTiles} room tiles.`, `1 pilha virada para baixo de ${BOX.roomTiles} peças de cômodo.`)}`,
        `${thumb("monster-reference", "Monster reference card", "Carta de referência de Monstro")}${thumb("traitor-reference", "Traitor reference card", "Carta de referência do Traidor")} ${t("Monster and Traitor reference cards, face up.", "Cartas de referência de Monstro e do Traidor, viradas para cima.")}`,
        `${thumb("scenario-card", "Scenario card", "Carta de Cenário")} ${t("The chosen Scenario card.", "A carta de Cenário escolhida.")}`
      ], [6, 7]),
      infoCard(t("SET ASIDE", "SEPARADO"), t("Until the haunt", "Até a assombração"), [
        `${thumb("secrets-of-survival", "Secrets of Survival book", "Livro Secrets of Survival")}${thumb("traitors-tome", "Traitor's Tome book", "Livro Traitor's Tome")} ${t("2 haunt books, closed.", "2 livros de assombração, fechados.")}`,
        `${thumb("number-track", "Number Track", "Trilha Numérica")} ${t("Number Track and pointer.", "Trilha Numérica e marcador.")}`,
        t(`${BOX.tokens} tokens (see Iconography for every kind).`, `${BOX.tokens} fichas (veja todos os tipos em Iconografia).`)
      ], [6, 7]),
      infoCard(t("BACK IN THE BOX", "DE VOLTA À CAIXA"), t("Not used in this match", "Não usado nesta partida"), [
        t(`${BOX.scenarios - 1} Scenario cards.`, `${BOX.scenarios - 1} cartas de Cenário.`),
        unused ? t(`${unused} board${unused === 1 ? "" : "s"}, figure${unused === 1 ? "" : "s"}, base${unused === 1 ? "" : "s"} and Player reference card${unused === 1 ? "" : "s"}.`, `${unused} tabuleiro${unused === 1 ? "" : "s"}, miniatura${unused === 1 ? "" : "s"}, base${unused === 1 ? "" : "s"} e carta${unused === 1 ? "" : "s"} de referência do jogador.`) : t("No boards: all six are in use.", "Nenhum tabuleiro: os seis estão em uso."),
        `${thumb("clips", "Clips", "Presilhas")} ${t(`${BOX.clips - 4 * n} spare clips (no rule uses them).`, `${BOX.clips - 4 * n} presilhas reservas (nenhuma regra as usa).`)}`
      ], [6, 7])
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
          <div class="setup-phase-references">${uniquePages(phase.pages).map(referenceLink).join("")}</div>
        </header>
        <label class="bth-setup-check" for="bth-setup-${phase.id}">
          <input id="bth-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="bth-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="bth-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), sectionIndex("setup"), [6, 7])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Set up this match", "Prepare esta partida")} · ${playersLabel()}</h3>
            <p>${t("One checkbox per coherent step; tick it when all its substeps are done. The steps follow the rulebook’s 13-step setup on p. 7.", "Uma caixa por etapa coerente; marque quando todos os subpassos estiverem feitos. As etapas seguem a preparação de 13 passos do manual, na p. 7.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved separately from the match configuration and the language. Changing the player count clears this checklist; changing the language does not. “Uncheck all” clears only these setup boxes.",
          "O progresso é salvo separadamente da configuração da partida e do idioma. Trocar o número de jogadores limpa esta lista; trocar o idioma não. “Desmarcar tudo” limpa somente as caixas da preparação."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}`;
  }

  // ---------- quick reference ----------

  function quickReference() {
    const n = players();
    const cards = [
      infoCard(t("BEFORE THE HAUNT", "ANTES DA ASSOMBRAÇÃO"), t("Your turn — any order, any mix", "Seu turno — qualquer ordem, qualquer mistura"), [
        rl("Move", "through up to as many tiles as your Speed, read at the start of your turn (a Speed change mid-turn does not change it).", "Mover", "passe por até tantas peças quanto sua Velocidade, lida no início do turno (mudar a Velocidade no meio do turno não muda isso)."),
        rl("Discover", "use a point of movement to go through an unexplored doorway and place a new room — this ends your turn.", "Descobrir", "use um ponto de movimento para passar por uma porta inexplorada e colocar um cômodo novo — isso encerra seu turno."),
        rl("Obstacle tokens", "leaving a tile with an obstacle costs 2 movement, even before the haunt.", "Fichas de obstáculo", "sair de uma peça com obstáculo custa 2 de movimento, mesmo antes da assombração."),
        rl("Trade", "once per turn, Items and Omens with an explorer on your tile, if both agree.", "Trocar", "uma vez por turno, Itens e Presságios com um explorador na sua peça, se os dois concordarem."),
        rl("Special actions", "each one once per turn, only with Items/Omens you held when your turn started.", "Ações especiais", "uma vez por turno cada, só com Itens/Presságios que você tinha no início do turno."),
        rl("Stop", "any time. You never have to use all your movement or actions.", "Parar", "a qualquer momento. Você nunca é obrigado a usar todo o movimento ou todas as ações.")
      ], [11, 13]),
      infoCard(t("DISCOVER A ROOM", "DESCOBRIR UM CÔMODO"), t("Six steps, then your turn is over", "Seis passos e o turno acaba"), [
        rl("1 · Region", "the top tile must belong to your explorer’s region (shown on its back). If not, bury it and check the next one.", "1 · Região", "a peça do topo precisa ser da região do seu explorador (mostrada no verso). Se não for, enterre-a e veja a próxima."),
        rl("2 · Place", "connect it so one of its doorways meets the doorway you went through.", "2 · Colocar", "encaixe-a de modo que uma das portas dela encontre a porta pela qual você passou."),
        rl("3 · Enter", "put your figure on the new tile.", "3 · Entrar", "ponha sua miniatura na peça nova."),
        rl("4 · Tile text", "resolve “when you discover / enter this tile”.", "4 · Texto da peça", "resolva “when you discover / enter this tile” (ao descobrir / entrar nesta peça)."),
        rl("5 · Card", `${eventSym()}${itemSym()}${omenSym()} symbol: draw that card, read it aloud, resolve it.`, "5 · Carta", `símbolo ${eventSym()}${itemSym()}${omenSym()}: compre essa carta, leia em voz alta e resolva.`),
        rl("6 · End", "your turn ends.", "6 · Fim", "seu turno acaba.")
      ], [12, 13]),
      infoCard(t("CARDS", "CARTAS"), t("What to do with a drawn card", "O que fazer com a carta comprada"), [
        rl("When", "only when you place (discover) a tile showing the symbol — walking into it later draws nothing.", "Quando", "só ao colocar (descobrir) uma peça com o símbolo — entrar nela depois não compra nada."),
        rl("Event", "read its italic text aloud, then follow the card’s instructions (with a roll, read only the matching result); then bury it.", "Evento", "leia o texto em itálico em voz alta e siga as instruções da carta (com rolagem, leia só o resultado correspondente); depois enterre-a."),
        rl("Item", "read it aloud and keep it face up in front of you.", "Item", "leia em voz alta e mantenha-a virada para cima à sua frente."),
        rl("Omen", "read it aloud, keep it face up — then make a haunt roll at once.", "Presságio", "leia em voz alta, mantenha-a virada para cima — e faça uma rolagem de assombração na hora."),
        rl("Bury", "a tile goes to the bottom of the tile stack; a card to the bottom of its deck.", "Enterrar", "uma peça vai para o fundo da pilha de peças; uma carta para o fundo do baralho correspondente.")
      ], [12]),
      infoCard(t("ROLLS", "ROLAGENS"), t("Dice show 0, 1 or 2 dots", "Os dados mostram 0, 1 ou 2 pontos"), [
        rl("Result", "add up the dots on all dice rolled.", "Resultado", "some os pontos de todos os dados rolados."),
        rl("Trait roll", "roll as many dice as your current value in that trait.", "Rolagem de atributo", "role tantos dados quanto o seu valor atual nesse atributo."),
        rl("Attack", "attacker and defender roll the same trait (usually Might).", "Ataque", "atacante e defensor rolam o mesmo atributo (normalmente Força)."),
        rl("Haunt roll", "one die per Omen held by all players; 5 or more starts the haunt.", "Rolagem de assombração", "um dado por Presságio de todos os jogadores; 5 ou mais começa a assombração."),
        rl("“Roll N dice”", "not a trait roll: bonuses to trait rolls do not apply.", "“Role N dados”", "não é rolagem de atributo: bônus de rolagens de atributo não valem.")
      ], [10]),
      infoCard(t("TRAITS & DAMAGE", "ATRIBUTOS E DANO"), t("Move clips by spaces, not by numbers", "Mova as presilhas por espaços, não por números"), [
        rl("Physical", "lose Might and/or Speed.", "Físico", "perca Força e/ou Velocidade."),
        rl("Mental", "lose Knowledge and/or Sanity.", "Mental", "perca Conhecimento e/ou Sanidade."),
        rl("General", "you choose which traits.", "Geral", "você escolhe quais atributos."),
        rl("Split", "divide the damage as you like among the allowed traits.", "Dividir", "reparta o dano como quiser entre os atributos permitidos."),
        rl("Critical", "never choose a critical trait while another allowed trait can still drop.", "Crítico", "nunca escolha um atributo crítico enquanto outro atributo permitido ainda puder baixar."),
        rl("Heal", "back up to the green starting value (no change if already at or above it).", "Curar", "volte ao valor inicial verde (nada muda se já estiver nele ou acima)."),
        rl("Before the haunt", "nobody dies: a trait stops at critical.", "Antes da assombração", "ninguém morre: o atributo para no crítico.")
      ], [9]),
      infoCard(t("THE HAUNT STARTS", "A ASSOMBRAÇÃO COMEÇA"), t("Find it, read it, split up", "Encontrem, leiam, separem-se"), [
        rl("Trigger", "a haunt roll of 5+ after an Omen, or the last Omen card is drawn. Whoever rolled (or drew the last Omen) is the haunt revealer.", "Gatilho", "uma rolagem de assombração de 5+ depois de um Presságio, ou a última carta de Presságio é comprada. Quem rolou (ou comprou o último Presságio) é o revelador da assombração."),
        rl("Look up", "the Scenario card’s row for the Omen just drawn gives the haunt number and who the traitor is.", "Consulta", "a linha da carta de Cenário para o Presságio recém-comprado dá o número da assombração e quem é o traidor."),
        rl("Books", "heroes take Secrets of Survival, the traitor takes Traitor’s Tome. Read only that haunt.", "Livros", "os heróis pegam o Secrets of Survival, o traidor pega o Traitor’s Tome. Leiam só essa assombração."),
        rl("Order", "heroes’ intro aloud → heroes’ setup → traitor’s intro aloud → traitor’s setup → separate rooms to read the rest.", "Ordem", "introdução dos heróis em voz alta → preparação dos heróis → introdução do traidor em voz alta → preparação do traidor → salas separadas para ler o resto."),
        rl("Secrets", "anything you use from your book must be read aloud if the other side asks.", "Segredos", "tudo o que você usa do seu livro precisa ser lido em voz alta se o outro lado pedir.")
      ], [12, 14, 15]),
      infoCard(t("AFTER THE HAUNT BEGINS", "DEPOIS QUE A ASSOMBRAÇÃO COMEÇA"), t("Same turn, plus", "O mesmo turno, mais"), [
        rl("Attack", "once per turn, a monster or explorer not on your team, on your tile.", "Atacar", "uma vez por turno, um monstro ou explorador que não é do seu time, na sua peça."),
        rl("Haunt special actions", `${actionSym()} any number, each once per turn.`, "Ações especiais da assombração", `${actionSym()} quantas quiser, uma vez por turno cada.`),
        rl("Loot", "once per turn, take 1 Item or Omen from a corpse on your tile.", "Saquear", "uma vez por turno, pegue 1 Item ou Presságio de um cadáver na sua peça."),
        rl("Obstacles", "leaving a tile with enemies or obstacle tokens costs 2 movement (stunned monsters don’t count).", "Obstáculos", "sair de uma peça com inimigos ou fichas de obstáculo custa 2 de movimento (monstros atordoados não contam)."),
        rl("Line of sight", "tiles reachable in a straight line, without changing direction or region.", "Linha de visão", "peças alcançáveis em linha reta, sem mudar de direção nem de região."),
        rl("No more haunt rolls", "Omens no longer trigger rolls.", "Sem rolagens de assombração", "Presságios não disparam mais rolagens.")
      ], [15, 18]),
      infoCard(t("ATTACK", "ATAQUE"), t("Both roll, higher hurts lower", "Os dois rolam, o maior fere o menor"), [
        rl("Roll", "attacker and defender both roll Might (or the trait the effect names).", "Rolar", "atacante e defensor rolam Força (ou o atributo que o efeito indicar)."),
        rl("Damage", "the higher roll deals damage equal to the difference to the loser; a tie deals nothing. The defender can win too.", "Dano", "a rolagem maior causa ao perdedor dano igual à diferença; empate não causa nada. O defensor também pode vencer."),
        rl("Type", "Physical damage — Mental if the attack used Sanity or Knowledge.", "Tipo", "dano Físico — Mental se o ataque usou Sanidade ou Conhecimento."),
        rl("Weapons", "one per attack, announced; never to defend; not one you obtained this turn; once used, it can’t be traded this turn.", "Armas", "uma por ataque, anunciada; nunca para defender; não uma obtida neste turno; depois de usada, não pode ser trocada neste turno.")
      ], [10, 15]),
      infoCard(t("DEATH & VICTORY", "MORTE E VITÓRIA"), t("Only after the haunt starts", "Só depois que a assombração começa"), [
        rl("Death", `any trait at or below the skull ${skullSym()} = dead, unless the haunt says otherwise.`, "Morte", `qualquer atributo na caveira ${skullSym()} ou abaixo = morto, a menos que a assombração diga outra coisa.`),
        rl("Corpse", "tip the figure over on its tile; its Items and Omens stay with it for looting.", "Cadáver", "deite a miniatura na peça; os Itens e Presságios ficam com ele para serem saqueados."),
        rl("Victory", "the first side to complete its haunt objectives wins; it reads “If You Win” aloud.", "Vitória", "o primeiro lado a cumprir os objetivos da assombração vence; ele lê “If You Win” em voz alta.")
      ], [19], "victory-card"),
      infoCard(t("TRAITOR & MONSTERS", "TRAIDOR E MONSTROS"), t("Usual extra powers", "Poderes extras habituais"), [
        rl("Tiles", "the traitor and monsters may ignore damaging tile effects (the traitor still rolls for the Mystic Elevator and still slides down the Laundry Chute).", "Peças", "o traidor e os monstros podem ignorar efeitos de peça que causam dano (o traidor ainda rola no Mystic Elevator e ainda escorrega pelo Laundry Chute)."),
        rl("Events", "the traitor may skip Event symbols; a drawn Event is resolved normally.", "Eventos", "o traidor pode ignorar símbolos de Evento; um Evento comprado é resolvido normalmente."),
        rl("Monster move", "at the start of the monster turn, roll as many dice as the monster’s Speed; the total is the most tiles it may move (at least 1). Roll once per monster type.", "Movimento do monstro", "no início do turno dos monstros, role tantos dados quanto a Velocidade do monstro; o total é o máximo de peças que ele pode mover (no mínimo 1). Role uma vez por tipo de monstro."),
        rl("Stun", "a damaged monster is flipped to stunned; stunned at the start of its turn → flip back, its turn ends.", "Atordoar", "um monstro ferido é virado para atordoado; atordoado no início do turno → desvire, o turno dele acaba.")
      ], [18, 19]),
      infoCard(t("VARIABLE PLAYER COUNT", "NÚMERO VARIÁVEL DE JOGADORES"), `{3/4/5/6} · ${playersLabel()}`, [
        `${sym("variable-count", t("Variable player count symbol", "Símbolo de número variável de jogadores"))}`,
        t(`Read the ${ordinal(countPosition(n))} value. Example: {1/5/7/9} → <strong>${sampleValue(n)}</strong>.`, `Leia o ${ordinal(countPosition(n))} valor. Exemplo: {1/5/7/9} → <strong>${sampleValue(n)}</strong>.`)
      ], [18])
    ];
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), sectionIndex("quick-reference"), [10, 11, 12, 15, 19])}
      <div class="callout">${t(
        `Two games in one. First you explore the house together: move, discover rooms, draw Events, Items and Omens, and grow stronger. Every Omen risks a haunt roll. When the haunt begins, the Scenario card picks one of 50 haunts and — usually — one of you becomes the traitor. From then on each side follows its own haunt book, and the first side to meet its goal wins. ${playersLabel()}.`,
        `Dois jogos em um. Primeiro vocês exploram a casa juntos: movem-se, descobrem cômodos, compram Eventos, Itens e Presságios e ficam mais fortes. Cada Presságio arrisca uma rolagem de assombração. Quando a assombração começa, a carta de Cenário escolhe uma de 50 assombrações e — normalmente — um de vocês vira o traidor. Daí em diante cada lado segue o próprio livro de assombração, e o primeiro a cumprir o objetivo vence. ${playersLabel()}.`
      )} ${referenceLink(2)} ${referenceLink(4)}</div>
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- explorers & traits ----------

  function explorersSection() {
    const order = birthdayOrder();
    const todayList = order.map((ch) => {
      const days = daysUntil(ch);
      const when = days === 0 ? t("today", "hoje") : t(`in ${days} day${days === 1 ? "" : "s"}`, `em ${days} dia${days === 1 ? "" : "s"}`);
      return `<strong>${ch.name}</strong> — ${birthdayLabel(ch)} (${when})`;
    });
    const characterCards = CHARACTERS.map((ch) => `
      <article class="info-card bth-character bth-board-${ch.color}">
        <div class="bth-character-head">
          <h3>${ch.name}</h3>
          <span class="bth-board-chip">${colorName(ch.color)}</span>
        </div>
        <p>${t(`Age ${ch.age} · birthday ${birthdayLabel(ch)}`, `${ch.age} anos · aniversário em ${birthdayLabel(ch)}`)}</p>
        <p class="bth-character-text">${t(ch.text[0], ch.text[1])}</p>
        <p class="bth-character-pair">${t(`Other side of the board: ${partner(ch).name}`, `Outro lado do tabuleiro: ${partner(ch).name}`)}</p>
        ${referenceLink(ch.page)}
      </article>`).join("");
    return `
      ${sectionHeading("explorers", t("Explorers & traits", "Exploradores e atributos"), sectionIndex("explorers"), [8, 9, 20, 21])}
      <p class="glossary-intro">${t(
        "Your explorer has four traits — Might, Speed, Knowledge and Sanity — tracked with clips on the character board. Values are public. Most effects raise, lower or test them, and once the haunt has started a trait at the skull means death.",
        "Seu explorador tem quatro atributos — Força, Velocidade, Conhecimento e Sanidade — marcados com presilhas no tabuleiro de personagem. Os valores são públicos. A maioria dos efeitos os aumenta, diminui ou testa, e depois que a assombração começa um atributo na caveira significa morte."
      )}${en("Might, Speed, Knowledge, Sanity")}</p>
      <div class="quick-grid">
        ${infoCard(t("THE BOARD", "O TABULEIRO"), t("Reading a trait track", "Lendo uma trilha de atributo"), [
          rl("Starting value", "the number printed in green. Your clip starts there.", "Valor inicial", "o número impresso em verde. A presilha começa nele."),
          rl("Critical", "the lowest value, next to the skull (printed in red).", "Crítico", "o menor valor, ao lado da caveira (impresso em vermelho)."),
          rl("Skull", `${skullSym()} the end of the track: after the haunt starts, reaching it means death.`, "Caveira", `${skullSym()} o fim da trilha: depois que a assombração começa, chegar nela significa morte.`),
          rl("Highest", "the top value. A trait there cannot be raised any higher.", "Máximo", "o valor do topo. Um atributo nele não pode subir mais."),
          rl("Public", "trait values are never hidden from other players.", "Público", "os valores dos atributos nunca são escondidos dos outros jogadores.")
        ], [9])}
        ${infoCard(t("GAIN, LOSE, HEAL", "GANHAR, PERDER, CURAR"), t("Clip movement", "Movimento da presilha"), [
          rl("Gain / Lose N", "move that clip N spaces up or down.", "Ganhar / Perder N", "mova essa presilha N espaços para cima ou para baixo."),
          rl("Duplicates", "some tracks repeat numbers, so a move may not change the value at once.", "Repetidos", "algumas trilhas repetem números, então um movimento pode não mudar o valor na hora."),
          rl("Heal a trait", "return it to its green starting value. If it is already at or above that value, it stays where it is.", "Curar um atributo", "volte-o ao valor inicial verde. Se já estiver nesse valor ou acima, ele fica onde está.")
        ], [9])}
        ${infoCard(t("DAMAGE", "DANO"), t("Three types", "Três tipos"), [
          rl("Physical", "lose Might and/or Speed equal to the damage.", "Físico", "perca Força e/ou Velocidade igual ao dano."),
          rl("Mental", "lose Knowledge and/or Sanity equal to the damage.", "Mental", "perca Conhecimento e/ou Sanidade igual ao dano."),
          rl("General", "you choose which of your traits are affected.", "Geral", "você escolhe quais dos seus atributos são afetados."),
          rl("Spaces, not values", "lower the clip by the number of spaces, not by the printed number.", "Espaços, não valores", "baixe a presilha pelo número de espaços, não pelo número impresso."),
          rl("Split freely", "divide the damage however you like, but only among the associated traits.", "Divida à vontade", "reparta o dano como quiser, mas só entre os atributos associados."),
          rl("Critical traits", "you cannot choose to lower a critical trait if you have other traits that could still be lowered.", "Atributos críticos", "você não pode escolher baixar um atributo crítico se tiver outros atributos que ainda possam baixar.")
        ], [9])}
        ${infoCard(t("CHARACTER DEATH", "MORTE DO PERSONAGEM"), t("Before vs. after the haunt", "Antes vs. depois da assombração"), [
          rl("Before the haunt", "characters cannot die. Damage that would push a trait below critical leaves it at critical.", "Antes da assombração", "personagens não podem morrer. Dano que levaria um atributo abaixo do crítico o deixa no crítico."),
          rl("After the haunt starts", "if any trait is reduced to the skull, that character is dead (see Dying).", "Depois que a assombração começa", "se qualquer atributo for reduzido à caveira, o personagem está morto (veja Morrer).")
        ], [9, 19])}
      </div>
      ${figure("might-track", "Oliver Swift's Might track: the clip moves from 6 down to 5", "A trilha de Força de Oliver Swift: a presilha desce do 6 para o 5", "Oliver takes 2 Physical damage on Might. His track reads 3 3 4 4 5 6 6 7 and his clip is on the second 6: two spaces down puts it on 5, so his Might drops by only 1.", "Oliver sofre 2 de dano Físico na Força. A trilha dele é 3 3 4 4 5 6 6 7 e a presilha está no segundo 6: dois espaços abaixo a põem no 5, então a Força dele cai só 1.", 9)}
      <h3 class="subhead">${t("The 12 characters", "Os 12 personagens")}</h3>
      <p class="glossary-intro">${t(
        "Six double-sided boards, one character per side. Each board color has its own figure and base. Trait values are printed only on the boards.",
        "Seis tabuleiros de dois lados, um personagem por lado. Cada cor de tabuleiro tem a própria miniatura e base. Os valores dos atributos estão impressos só nos tabuleiros."
      )} ${interpretation("the rulebook does not list which two characters share a board; the pairs below follow the portrait backgrounds on pp. 20–21, which match the board colors pictured on p. 6. Check your boards.", "o manual não lista quais dois personagens dividem um tabuleiro; os pares abaixo seguem os fundos dos retratos nas pp. 20–21, que combinam com as cores dos tabuleiros mostrados na p. 6. Confira nos seus tabuleiros.")}</p>
      <div class="bth-character-grid">${characterCards}</div>
      <article class="info-card bth-birthdays">
        <span class="component-label">${t("FIRST PLAYER", "PRIMEIRO JOGADOR")}</span>
        <h3>${t("Next birthdays from today", "Próximos aniversários a partir de hoje")}</h3>
        <p>${t("The first of your chosen explorers in this list takes the first turn (setup step “Find the first player”). Computed from this device’s date.", "O primeiro dos exploradores escolhidos nesta lista faz o primeiro turno (etapa “Descubra quem começa” da preparação). Calculado pela data deste aparelho.")}</p>
        <ol class="bth-birthday-list">${todayList.map((item) => `<li>${item}</li>`).join("")}</ol>
        ${referenceLink(7)}
      </article>`;
  }

  // ---------- before the haunt ----------

  function turnSection() {
    return `
      ${sectionHeading("turn", t("Before the haunt: your turn", "Antes da assombração: seu turno"), sectionIndex("turn"), [11, 12, 13])}
      <p class="glossary-intro">${t(
        "Before the haunt everyone is on the same team, exploring the house. Players take turns clockwise, starting with the first player.",
        "Antes da assombração todos estão no mesmo time, explorando a casa. Os jogadores jogam em sentido horário, começando pelo primeiro jogador."
      )}</p>
      <div class="quick-grid">
        ${infoCard(t("ON YOUR TURN", "NO SEU TURNO"), t("Do any of these, in any order", "Faça qualquer um destes, em qualquer ordem"), [
          rl("Move", "around the house and discover new room tiles (discovering a room ends your turn).", "Mover", "pela casa e descobrir novas peças de cômodo (descobrir um cômodo encerra o turno)."),
          rl("Trade", "Items and Omens with an explorer on your tile, with their permission.", "Trocar", "Itens e Presságios com um explorador na sua peça, com a permissão dele."),
          rl("Special actions", `use your Items and Omens marked ${actionSym()}, each once during your turn.`, "Ações especiais", `use seus Itens e Presságios marcados com ${actionSym()}, uma vez por turno cada.`),
          rl("Mix them", "for example: move once, trade, move again, perform a special action, then move a third time.", "Misture", "por exemplo: mova uma vez, troque, mova de novo, faça uma ação especial e mova uma terceira vez."),
          rl("End", "when you cannot or do not want to do anything else — or automatically when you discover a room.", "Fim", "quando você não puder ou não quiser fazer mais nada — ou automaticamente ao descobrir um cômodo.")
        ], [11])}
        ${infoCard(t("MOVEMENT", "MOVIMENTO"), t("Speed sets your moves", "A Velocidade define os movimentos"), [
          rl("Allowance", "at the beginning of your turn, your Speed is the maximum number of tiles you may move through this turn.", "Limite", "no início do seu turno, sua Velocidade é o número máximo de peças pelas quais você pode passar neste turno."),
          rl("Fixed", "if your Speed changes during the turn, your movement for this turn does not change.", "Fixo", "se a sua Velocidade mudar durante o turno, o movimento deste turno não muda."),
          rl("1 point", "each point of movement moves you to an adjacent tile.", "1 ponto", "cada ponto de movimento leva você a uma peça adjacente."),
          rl("Obstacles", "leaving a tile with obstacles costs 2 points (see After the haunt begins).", "Obstáculos", "sair de uma peça com obstáculos custa 2 pontos (veja Depois que a assombração começa).")
        ], [11, 15])}
        ${infoCard(t("ADJACENCY", "ADJACÊNCIA"), t("Only connected doorways count", "Só portas conectadas contam"), [
          rl("Adjacent", "two tiles that share a directly connected doorway.", "Adjacentes", "duas peças que compartilham uma porta diretamente conectada."),
          rl("Printed links", "some tiles name a connection, e.g. the Ground Floor Staircase “Leads to the Upper Landing”: once both are discovered, they are adjacent.", "Ligações impressas", "algumas peças citam uma ligação, por exemplo a Ground Floor Staircase “Leads to the Upper Landing” (leva ao patamar superior): quando as duas estão descobertas, são adjacentes."),
          rl("False feature", "if two tiles touch but only one shows a doorway, they are not adjacent; that doorway is just a closet or an alcove.", "Falsa passagem", "se duas peças se tocam mas só uma mostra porta, elas não são adjacentes; essa porta é só um armário ou uma alcova.")
        ], [11])}
        ${infoCard(t("FORCED MOVEMENT", "MOVIMENTO FORÇADO"), t("When something moves an explorer", "Quando algo move um explorador"), [
          t("Some Items, Omens and special actions move your explorer or another player’s explorer a number of tiles.", "Alguns Itens, Presságios e ações especiais movem o seu explorador ou o de outro jogador um número de peças."),
          rl("“Up to” N tiles", "whoever is doing the moving decides how far, even if another player normally controls that explorer.", "“Até” N peças", "quem está fazendo o movimento decide a distância, mesmo que outro jogador controle esse explorador normalmente.")
        ], [11])}
      </div>
      ${figure("adjacency", "Four room tiles: two connected by matching doorways, and a doorway that opens onto a wall", "Quatro peças de cômodo: duas ligadas por portas que coincidem e uma porta que dá numa parede", "Top: the Upper Landing and the tile below share a doorway — adjacent. Bottom: the Nursery’s doorway meets the Operating Theatre’s wall — a false feature, not adjacent.", "Em cima: o Upper Landing e a peça abaixo compartilham uma porta — adjacentes. Embaixo: a porta do Nursery dá na parede do Operating Theatre — falsa passagem, não adjacentes.", 11)}
      <h3 class="subhead">${t("Discovering new rooms", "Descobrir novos cômodos")}</h3>
      <div class="quick-grid">
        ${infoCard(t("DISCOVER", "DESCOBRIR"), t("Walk through an unexplored doorway", "Atravesse uma porta inexplorada"), [
          t("During your movement, if you are on a tile with an unexplored doorway, you may move through it to discover a new room:", "Durante o movimento, se você estiver numa peça com porta inexplorada, pode atravessá-la para descobrir um cômodo novo:"),
          rl("1 · Regions", "the house has three regions — Basement, Ground Floor and Upper Floor. The back of each room tile shows where it may be placed. Your region is the one your explorer is in.", "1 · Regiões", "a casa tem três regiões — Porão, Térreo e Andar Superior (Basement, Ground Floor, Upper Floor). O verso de cada peça mostra onde ela pode ser colocada. Sua região é a do seu explorador."),
          rl("2 · Draw and connect", "if the top tile of the stack matches your region, turn it over and connect it to your tile so one of its doorways lines up with the doorway you went through. Other doorways need not line up.", "2 · Revele e encaixe", "se a peça do topo da pilha for da sua região, vire-a e encaixe-a na sua peça de modo que uma das portas dela se alinhe com a porta que você atravessou. As outras portas não precisam se alinhar."),
          rl("Wrong region", "bury that tile (bottom of the stack) and repeat until a tile for your region appears.", "Região errada", "enterre essa peça (fundo da pilha) e repita até aparecer uma peça da sua região."),
          interpretation("the rulebook gives explorers no fixed route between regions besides printed links such as the Ground Floor Staircase to the Upper Landing; other ways up or down come from tile and card texts. Only monsters treat the Basement Landing and the Ground Floor Staircase as adjacent.", "o manual não dá aos exploradores uma rota fixa entre regiões além de ligações impressas como a da Ground Floor Staircase ao Upper Landing; outros caminhos para cima ou para baixo vêm dos textos de peças e cartas. Só os monstros tratam o Basement Landing e a Ground Floor Staircase como adjacentes."),
          rl("3 · Enter", "place your figure on the new tile.", "3 · Entrar", "coloque sua miniatura na peça nova."),
          rl("4 · Tile text", "resolve any text saying “when you discover this tile…” or “when you enter this tile…”.", "4 · Texto da peça", "resolva qualquer texto que diga “when you discover this tile…” (ao descobrir esta peça) ou “when you enter this tile…” (ao entrar nesta peça)."),
          rl("5 · Card", `if the tile shows ${eventSym()}, ${itemSym()} or ${omenSym()}, draw a card from the matching deck, read it aloud and resolve it.`, "5 · Carta", `se a peça mostra ${eventSym()}, ${itemSym()} ou ${omenSym()}, compre uma carta do baralho correspondente, leia em voz alta e resolva.`),
          rl("6 · End", "your turn ends.", "6 · Fim", "seu turno acaba."),
          interpretation("moving into the new room uses one point of movement like any move; the rulebook implies it by saying a failed attempt (no tiles left) costs no move.", "entrar no cômodo novo usa um ponto de movimento como qualquer movimento; o manual dá a entender isso ao dizer que uma tentativa sem peças restantes não custa movimento.")
        ], [12, 13])}
        ${infoCard(t("MORE ABOUT DISCOVERING", "MAIS SOBRE DESCOBRIR"), t("Closets, empty stacks and dead ends", "Armários, pilhas vazias e becos sem saída"), [
          rl("Unmatched doorways", "it is fine if not every doorway on the new tile can match: you have created a closet or an alcove.", "Portas sem par", "tudo bem se nem todas as portas da peça nova coincidirem: você criou um armário ou uma alcova."),
          rl("Region out of tiles", "if no tile is left for your region, the attempt costs no move: carry on with your turn.", "Região sem peças", "se não sobrar peça da sua região, a tentativa não custa movimento: continue o turno."),
          rl("Keep a way out", "after placing a tile, there must always be at least one open doorway in your region. If the only possible placement would block further tiles there, bury that tile and draw a new one.", "Mantenha uma saída", "depois de colocar uma peça, sempre precisa haver ao menos uma porta aberta na sua região. Se a única colocação possível impediria novas peças ali, enterre essa peça e compre outra."),
          rl("No legal placement", "if you cannot place a tile without closing off your region, adjust the tiles in that region so you can — changing the house as little as possible.", "Sem colocação possível", "se não der para colocar uma peça sem fechar a sua região, ajuste as peças dessa região para conseguir — mudando a casa o mínimo possível.")
        ], [13])}
        ${infoCard(t("ENDING YOUR TURN", "ENCERRAR O TURNO"), t("Automatic or voluntary", "Automático ou voluntário"), [
          rl("Automatic", "when you discover (place) a new room tile: resolve the tile’s effects, draw and follow the card if a symbol is shown — then your turn is over.", "Automático", "ao descobrir (colocar) uma peça nova: resolva os efeitos da peça, compre e siga a carta se houver símbolo — e o turno acaba."),
          rl("Voluntary", "you may end your turn at any time without discovering a tile.", "Voluntário", "você pode encerrar o turno quando quiser, sem descobrir peça."),
          rl("Never forced", "you do not have to use all your movement or take all available actions.", "Nunca obrigado", "você não precisa usar todo o movimento nem fazer todas as ações disponíveis.")
        ], [13])}
        ${infoCard(t("TRADING", "TROCAR"), t("Once per turn, same tile", "Uma vez por turno, mesma peça"), [
          t("If you are on the same tile as another explorer, you may change ownership of Items and Omens with that explorer.", "Se você estiver na mesma peça que outro explorador, pode trocar a posse de Itens e Presságios com ele."),
          rl("Agreement", "both players must agree. Trades need not be equal: give or take any number, including none.", "Acordo", "os dois precisam concordar. A troca não precisa ser equilibrada: dê ou pegue qualquer quantidade, inclusive nenhuma."),
          rl("Restriction", "you cannot give away an Item or Omen whose special action you already used this turn, or a weapon you attacked with this turn.", "Restrição", "você não pode dar um Item ou Presságio cuja ação especial já usou neste turno, nem uma arma com que atacou neste turno."),
          rl("No stealing", "taking an Item from an enemy you defeated is not a standard ability; a haunt will say so if it allows stealing.", "Sem roubo", "pegar um Item de um inimigo derrotado não é uma habilidade padrão; a assombração dirá se permitir roubo.")
        ], [5, 13])}
        ${infoCard(t("SPECIAL ACTIONS", "AÇÕES ESPECIAIS"), `${actionSym()} ${t("On Items, Omens and haunts", "Em Itens, Presságios e assombrações")}`, [
          rl("Optional", "each special action tells you when and how it works; you never have to use it.", "Opcional", "cada ação especial diz quando e como funciona; você nunca é obrigado a usá-la."),
          rl("Once each", "unless noted, each special action once per turn: you may use every one you have, but not repeat any.", "Uma vez cada", "salvo indicação, cada ação especial uma vez por turno: você pode usar todas as que tem, mas não repetir nenhuma."),
          rl("Held at turn start", "you may not take a special action with an Item or Omen you did not have at the start of your turn.", "Desde o início do turno", "você não pode fazer ação especial com um Item ou Presságio que não tinha no início do turno."),
          rl("Always on", "effects without the symbol are not special actions: they work as long as you have the card.", "Sempre ativo", "efeitos sem o símbolo não são ações especiais: funcionam enquanto você tiver a carta.")
        ], [13])}
      </div>
      <div class="bth-figure-pair">
        ${figure("placement-illegal", "Secret Staircase placed so its doorway meets a wall: crossed out", "Secret Staircase colocada com a porta dando numa parede: riscada", "Illegal placement: the doors do not connect.", "Colocação ilegal: as portas não se conectam.", 12)}
        ${figure("placement-legal", "Furnace Room placed with a doorway meeting the Underground Cavern's doorway: checked", "Furnace Room colocada com uma porta encontrando a porta do Underground Cavern: aprovada", "Legal placement: the doors connect.", "Colocação legal: as portas se conectam.", 12)}
      </div>`;
  }

  // ---------- cards & dice ----------

  function cardsDiceSection() {
    return `
      ${sectionHeading("cards-dice", t("Cards & dice", "Cartas e dados"), sectionIndex("cards-dice"), [8, 10, 12])}
      <div class="quick-grid">
        ${infoCard(`${eventSym()} ${t("EVENT · 43 CARDS", "EVENTO · 43 CARTAS")}`, t("Spooky things that happen", "Coisas assustadoras que acontecem"), [
          t("Examples: Flickering Lights, Wandering Ghost. Consequences can be good or bad.", "Exemplos: Flickering Lights, Wandering Ghost. As consequências podem ser boas ou ruins."),
          rl("Play", "read its italicized text aloud, then follow the card’s instructions.", "Jogar", "leia o texto em itálico em voz alta e depois siga as instruções da carta."),
          rl("Results table", "an Event that asks for a trait roll lists results: read only the one that matches your roll.", "Tabela de resultados", "um Evento que pede rolagem de atributo lista resultados: leia só o que corresponde à sua rolagem."),
          rl("Afterwards", "bury the card (bottom of the Event deck).", "Depois", "enterre a carta (fundo do baralho de Eventos).")
        ], [8, 12])}
        ${infoCard(`${itemSym()} ${t("ITEM · 22 CARDS", "ITEM · 22 CARTAS")}`, t("Useful objects", "Objetos úteis"), [
          t("Examples: Flashlight, Chainsaw, First Aid Kit. Items give special abilities that help you survive.", "Exemplos: Flashlight, Chainsaw, First Aid Kit. Itens dão habilidades especiais que ajudam a sobreviver."),
          rl("Play", "read its text aloud, then place it face up in front of you. You now possess that Item.", "Jogar", "leia o texto em voz alta e coloque-a virada para cima à sua frente. Agora o Item é seu."),
          rl("Weapons", "some Items are marked as weapons (see Attacking).", "Armas", "alguns Itens são marcados como armas (veja Atacar).")
        ], [8, 12, 15])}
        ${infoCard(`${omenSym()} ${t("OMEN · 9 CARDS", "PRESSÁGIO · 9 CARTAS")}`, t("Eerie harbingers of evil", "Arautos sinistros do mal"), [
          t("Examples: Dog, Idol, Mask. Like Items, but only Omens can start the haunt.", "Exemplos: Dog, Idol, Mask. Como Itens, mas só Presságios podem começar a assombração."),
          rl("Play", "read its text aloud, place it face up in front of you — you possess it — then make a haunt roll.", "Jogar", "leia o texto em voz alta, coloque-a virada para cima à sua frente — ela é sua — e faça uma rolagem de assombração."),
          rl("Fewer cards than symbols", "there are fewer Omen cards than tiles with Omen symbols. Drawing the final Omen card starts the haunt automatically.", "Menos cartas que símbolos", "há menos cartas de Presságio do que peças com símbolo de Presságio. Comprar a última carta de Presságio começa a assombração automaticamente.")
        ], [8, 12])}
        ${infoCard(t("OTHER CARDS", "OUTRAS CARTAS"), t("Not drawn during play", "Não compradas durante o jogo"), [
          rl("Scenario cards (5)", "themed reasons for your visit; the chosen one decides which haunt you play.", "Cartas de Cenário (5)", "motivos temáticos da visita; a escolhida decide qual assombração vocês jogam."),
          rl("Player reference cards (6)", "reminders of the actions you can take on your turn.", "Cartas de referência do jogador (6)", "lembretes das ações que você pode fazer no seu turno."),
          rl("Traitor & Monster reference cards", "step-by-step reminders of what the traitor and monsters can do on their turns.", "Referências do Traidor e de Monstro", "lembretes passo a passo do que o traidor e os monstros podem fazer nos turnos deles.")
        ], [8])}
        ${infoCard(t("BURYING", "ENTERRAR"), t("Bottom of the pile", "Fundo da pilha"), [
          rl("Bury a tile", "put it on the bottom of the tile stack.", "Enterrar uma peça", "coloque-a no fundo da pilha de peças."),
          rl("Bury a card", "put it on the bottom of its deck.", "Enterrar uma carta", "coloque-a no fundo do baralho correspondente.")
        ], [12])}
        ${infoCard(t("DICE", "DADOS"), t("8 dice with 0–2 dots per face", "8 dados com 0–2 pontos por face"), [
          rl("Result", "after rolling, the number of dots showing is your result.", "Resultado", "depois de rolar, o número de pontos à mostra é o seu resultado."),
          rl("Trait roll", "for Might, Speed, Knowledge or Sanity, roll as many dice as your current value in that trait.", "Rolagem de atributo", "para Força, Velocidade, Conhecimento ou Sanidade, role tantos dados quanto o seu valor atual nesse atributo."),
          rl("Attack roll", "the attacker makes a trait roll and the defender rolls the same trait — usually Might, but some Items and Omens name another. Whoever rolls lower takes damage equal to the difference.", "Rolagem de ataque", "o atacante faz uma rolagem de atributo e o defensor rola o mesmo atributo — normalmente Força, mas alguns Itens e Presságios indicam outro. Quem rolar menos sofre dano igual à diferença."),
          rl("Haunt roll", "roll dice equal to the total number of Omens drawn; 5 or more and the haunt begins.", "Rolagem de assombração", "role dados iguais ao total de Presságios comprados; 5 ou mais e a assombração começa."),
          rl("Other rolls", "“Roll 2 dice” and the like are not trait rolls and are not affected by things that only affect trait rolls.", "Outras rolagens", "“Role 2 dados” e afins não são rolagens de atributo e não são afetadas pelo que só afeta rolagens de atributo.")
        ], [10])}
        ${infoCard(t("HAUNT ROLL", "ROLAGEM DE ASSOMBRAÇÃO"), t("Every Omen risks it", "Cada Presságio arrisca"), [
          rl("When", "whenever you draw an Omen, you must make a haunt roll — only before the haunt has started.", "Quando", "sempre que comprar um Presságio, você precisa fazer uma rolagem de assombração — só antes de a assombração começar."),
          rl("Dice", "count the Omens held by all players and roll that many dice.", "Dados", "conte os Presságios de todos os jogadores e role essa quantidade de dados."),
          rl("5+", "the haunt begins. The player who made the roll is the haunt revealer.", "5+", "a assombração começa. Quem fez a rolagem é o revelador da assombração."),
          rl("Last Omen", "if the haunt has not started when the last Omen card is drawn, it starts automatically.", "Último Presságio", "se a assombração não começou quando a última carta de Presságio é comprada, ela começa automaticamente."),
          interpretation("the rulebook counts the dice as Omens “held by all players” (pp. 12, 14) and as Omens “drawn” or “discovered” (pp. 5, 10). Normally the same number; if an Omen has left play, decide as a group, as the rulebook advises for anything ambiguous. When the last Omen triggers the haunt, its drawer is the haunt revealer.", "o manual conta os dados como Presságios “de todos os jogadores” (pp. 12, 14) e como Presságios “comprados” ou “descobertos” (pp. 5, 10). Normalmente é o mesmo número; se um Presságio saiu de jogo, decidam em grupo, como o manual aconselha para qualquer ambiguidade. Quando o último Presságio dispara a assombração, quem o comprou é o revelador.")
        ], [5, 10, 12, 14])}
      </div>`;
  }

  // ---------- the haunt begins ----------

  function hauntSection() {
    const n = players();
    const types = [
      ["NO TRAITOR", "SEM TRAIDOR", "No Traitor", "Sem traidor", [
        ["All players work together.", "Todos os jogadores trabalham juntos."],
        ["Everyone reads from Secrets of Survival. You do not need the Traitor’s Tome.", "Todos leem o Secrets of Survival. O Traitor’s Tome não é necessário."]
      ]],
      ["ONE TRAITOR", "UM TRAIDOR", "One Traitor", "Um traidor", [
        ["One player is the traitor; everyone else is a hero.", "Um jogador é o traidor; todos os outros são heróis."],
        ["The two sides have different goals: the first to achieve theirs wins.", "Os dois lados têm objetivos diferentes: o primeiro a cumprir o seu vence."],
        ["Heroes read Secrets of Survival; the traitor reads Traitor’s Tome.", "Os heróis leem o Secrets of Survival; o traidor lê o Traitor’s Tome."]
      ]],
      ["HIDDEN TRAITOR", "TRAIDOR OCULTO", "Hidden Traitor", "Traidor oculto", [
        ["The traitor’s identity is not initially known to all players.", "A identidade do traidor não é conhecida por todos no início."],
        ["Explorers may attack each other — anyone could be the traitor.", "Exploradores podem atacar uns aos outros — qualquer um pode ser o traidor."],
        ["These haunts are found in Secrets of Survival. Follow that haunt for how the traitor’s identity is handled.", "Essas assombrações estão no Secrets of Survival. Siga essa assombração para saber como a identidade do traidor é tratada."]
      ]],
      ["FREE-FOR-ALL", "TODOS CONTRA TODOS", "Free-for-All", "Todos contra todos", [
        ["Every explorer for themselves: all players compete for the same win condition.", "Cada explorador por si: todos disputam a mesma condição de vitória."],
        ["Explorers may attack each other. Not everyone can win.", "Exploradores podem atacar uns aos outros. Nem todos podem vencer."],
        ["These haunts appear only in the Traitor’s Tome.", "Essas assombrações aparecem só no Traitor’s Tome."]
      ]]
    ];
    return `
      ${sectionHeading("haunt", t("The haunt begins", "A assombração começa"), sectionIndex("haunt"), [14, 15, 16, 18])}
      <div class="callout bth-spoiler">${t(
        "Spoilers make the game less fun for everyone. Read only the haunt your Scenario card points to, and never read the other team’s haunt book. This guide does not reproduce any haunt: everything specific to a haunt — goals, monsters, special rules, tokens — is in the two haunt books.",
        "Spoilers estragam a diversão de todos. Leia só a assombração indicada pela carta de Cenário e nunca leia o livro do outro time. Este guia não reproduz nenhuma assombração: tudo o que é específico de uma assombração — objetivos, monstros, regras especiais, fichas — está nos dois livros de assombração."
      )} ${referenceLink(14)}</div>
      <div class="quick-grid">
        ${infoCard(t("TRIGGER", "GATILHO"), t("How the haunt starts", "Como a assombração começa"), [
          t("Whenever a player draws an Omen, they roll dice equal to the Omens held by all players. On 5 or more the haunt begins — and the drawn Omen is the haunt’s trigger.", "Sempre que um jogador compra um Presságio, ele rola dados iguais aos Presságios de todos os jogadores. Com 5 ou mais a assombração começa — e o Presságio comprado é o gatilho."),
          rl("Haunt revealer", "the player who made that roll.", "Revelador da assombração", "o jogador que fez essa rolagem."),
          rl("Last Omen", "drawing the final Omen card starts the haunt automatically.", "Último Presságio", "comprar a última carta de Presságio começa a assombração automaticamente."),
          interpretation("the Omen draw happens when a tile is discovered, so the revealer’s turn is over. If the haunt’s setup does not say who takes the first turn of the haunt (the rulebook’s sample haunt does), the player to the left of the haunt revealer (next clockwise) takes it.", "a compra do Presságio acontece ao descobrir uma peça, então o turno do revelador acabou. Se a preparação da assombração não disser quem faz o primeiro turno dela (o exemplo do manual diz), quem faz é o jogador à esquerda do revelador (o próximo em sentido horário).")
        ], [12, 14, 17])}
        ${infoCard(t("FIND YOUR HAUNT", "ENCONTRE A ASSOMBRAÇÃO"), t("Scenario card + Omen", "Carta de Cenário + Presságio"), [
          rl("1", "take the Scenario card chosen at the start and find the row of the Omen that was just drawn.", "1", "pegue a carta de Cenário escolhida no início e encontre a linha do Presságio recém-comprado."),
          rl("2", "it gives the haunt number and tells you which player is the traitor (or that there is none).", "2", "ela dá o número da assombração e diz qual jogador é o traidor (ou que não há traidor)."),
          rl("3", "find that number in both haunt books. Near each title, check that the Scenario card, the trigger (Omen) and the traitor match.", "3", "encontre esse número nos dois livros. Perto de cada título, confira se a carta de Cenário, o gatilho (Presságio) e o traidor batem."),
          rl("4", "the explorers — now heroes — take Secrets of Survival; the traitor takes Traitor’s Tome.", "4", "os exploradores — agora heróis — pegam o Secrets of Survival; o traidor pega o Traitor’s Tome.")
        ], [14, 16])}
        ${infoCard(t("WHO IS THE TRAITOR?", "QUEM É O TRAIDOR?"), t("As the Scenario card says", "Como a carta de Cenário diz"), [
          rl("Usually", "the haunt revealer.", "Normalmente", "o revelador da assombração."),
          rl("Highest or lowest trait", "if two or more players tie, the tied player closest to the haunt revealer in turn order (going clockwise from the revealer) is the traitor.", "Maior ou menor atributo", "se dois ou mais jogadores empatarem, o empatado mais próximo do revelador na ordem de turno (em sentido horário a partir do revelador) é o traidor."),
          interpretation("if the haunt revealer is one of the tied players, the revealer is the closest.", "se o revelador estiver entre os empatados, ele é o mais próximo."),
          rl("Left of the revealer", "when the traitor is “the player to the left of the haunt revealer”, the revealer can never be the traitor.", "À esquerda do revelador", "quando o traidor é “o jogador à esquerda do revelador”, o revelador nunca pode ser o traidor.")
        ], [14, 18])}
        ${infoCard(t("RELUCTANT TRAITORS", "TRAIDORES RELUTANTES"), t("Someone else may volunteer", "Outra pessoa pode se oferecer"), [
          t("Being evil is a big responsibility. If the designated traitor would rather not play the role, another player may volunteer instead.", "Ser mau é uma grande responsabilidade. Se o traidor designado preferir não fazer o papel, outro jogador pode se oferecer."),
          rl("Swap", "swap the locations of the two explorer figures, and pass the card that triggered the haunt to the volunteer.", "Troca", "troquem de lugar as duas miniaturas de explorador e passem a carta que disparou a assombração ao voluntário."),
          interpretation("each player keeps their own explorer, board, traits and other cards; only the two figures’ positions and the triggering Omen change hands.", "cada jogador mantém o próprio explorador, tabuleiro, atributos e demais cartas; só as posições das duas miniaturas e o Presságio que disparou a assombração mudam de mão.")
        ], [18])}
      </div>
      <h3 class="subhead">${t("The four types of haunt", "Os quatro tipos de assombração")}</h3>
      <div class="quick-grid">${types.map(([labelEn, labelPt, titleEn, titlePt, lines]) => infoCard(t(labelEn, labelPt), t(titleEn, titlePt), lines.map(([a, b]) => t(a, b)), [14], "bth-haunt-type")).join("")}</div>
      <h3 class="subhead">${t("Starting the haunt", "Iniciar a assombração")}</h3>
      <div class="quick-grid">
        ${infoCard(t("IN THIS ORDER", "NESTA ORDEM"), t("Once both books are open at the right haunt", "Com os dois livros abertos na assombração certa"), [
          rl("1", "the heroes read the introduction to their haunt aloud, to all players.", "1", "os heróis leem a introdução da assombração deles em voz alta, para todos."),
          rl("2", "the heroes perform all their setup steps, in order.", "2", "os heróis fazem todos os passos de preparação deles, em ordem."),
          rl("3", "the traitor reads the introduction to their haunt aloud, to all players.", "3", "o traidor lê a introdução da assombração dele em voz alta, para todos."),
          rl("4", "the traitor performs all their setup steps, in order.", "4", "o traidor faz todos os passos de preparação dele, em ordem."),
          rl("5", "heroes and traitor go into separate rooms (out of earshot) to read the rest of their haunts, discuss strategy and learn the special rules.", "5", "heróis e traidor vão para salas separadas (sem se ouvir) para ler o resto das assombrações, discutir estratégia e aprender as regras especiais."),
          rl("No Traitor", "everyone is a hero: steps 1–2 only, from Secrets of Survival; nobody splits off.", "Sem traidor", "todos são heróis: só os passos 1–2, pelo Secrets of Survival; ninguém se separa."),
          interpretation("a Free-for-All haunt is only in the Traitor’s Tome and has no hero side: all players read its introduction aloud and do its setup in order, together; the haunt itself says what each player may keep secret.", "uma assombração de todos contra todos está só no Traitor’s Tome e não tem lado dos heróis: todos leem a introdução em voz alta e fazem a preparação em ordem, juntos; a própria assombração diz o que cada jogador pode manter em segredo.")
        ], [5, 15])}
        ${infoCard(t("OPEN INFORMATION", "INFORMAÇÃO ABERTA"), t("Secret only until used", "Segredo só até ser usado"), [
          t("At the start of the haunt, most of your haunt book can be kept secret from the other side.", "No início da assombração, a maior parte do seu livro pode ficar em segredo para o outro lado."),
          rl("When you use it", "taking a special action or following a rule from your haunt book — the other side can ask you to read that part aloud, and you must read the entire text.", "Quando você usa", "ao fazer uma ação especial ou seguir uma regra do seu livro — o outro lado pode pedir que você leia esse trecho em voz alta, e você precisa ler o texto inteiro."),
          rl("Tokens", "your book may not explain how a token works: the other team has that information.", "Fichas", "seu livro pode não explicar como uma ficha funciona: o outro time tem essa informação.")
        ], [5, 15, 16])}
        ${infoCard(t("PLAYING THE HAUNT", "JOGANDO A ASSOMBRAÇÃO"), t("Same turns, new goals", "Os mesmos turnos, novos objetivos"), [
          t("Heroes and traitor all still count as explorers and can do everything they did before the haunt.", "Heróis e traidor continuam contando como exploradores e podem fazer tudo o que faziam antes da assombração."),
          t("Players keep taking turns as normal, using their new actions to complete their objectives.", "Os jogadores continuam jogando os turnos normalmente, usando as novas ações para cumprir os objetivos."),
          t("There are no more haunt rolls.", "Não há mais rolagens de assombração.")
        ], [18])}
      </div>
      <h3 class="subhead">${t("Anatomy of a haunt", "Anatomia de uma assombração")}</h3>
      <p class="glossary-intro">${t(
        "Each haunt entry has four sections — five in the Traitor’s Tome when it has monsters. The rulebook illustrates them with Haunt 1 in both books; this guide does not repeat its content.",
        "Cada assombração tem quatro seções — cinco no Traitor’s Tome quando há monstros. O manual as ilustra com a Assombração 1 nos dois livros; este guia não repete o conteúdo dela."
      )} ${sym("monster-info", t("Monster information symbol", "Símbolo de informação de monstro"))}</p>
      <div class="quick-grid">
        ${infoCard("1", t("Haunt identification", "Identificação da assombração"), [
          t("The haunt number from your Scenario card, plus the Scenario card, haunt trigger and traitor — use them to check you are in the right place.", "O número da assombração da carta de Cenário, mais a carta de Cenário, o gatilho e o traidor — use-os para conferir que está no lugar certo."),
          t("When the haunt is in both books, this section is the same in both: both sides should be reading the same haunt.", "Quando a assombração está nos dois livros, esta seção é igual nos dois: os dois lados devem estar lendo a mesma assombração.")
        ], [16])}
        ${infoCard("2", t("Introduction and setup", "Introdução e preparação"), [
          rl("Introduction", "each side’s version of the story. No rules, but maybe clues about what the other side is up to.", "Introdução", "a versão da história de cada lado. Sem regras, mas talvez com pistas do que o outro lado tramou."),
          rl("Setup", "additional setup steps, different for each side. All of it happens before the first turn of the haunt and may change the house.", "Preparação", "passos extras de preparação, diferentes para cada lado. Tudo acontece antes do primeiro turno da assombração e pode mudar a casa.")
        ], [16])}
        ${infoCard("3", t("Main haunt gameplay", "Jogo principal da assombração"), [
          rl("A · Special rules", "rules unique to the haunt: in effect all haunt long (e.g. tile discovery changes) or triggered by events (the end of your turn, a character’s death).", "A · Regras especiais", "regras únicas da assombração: valem a assombração toda (por exemplo, mudanças na descoberta de peças) ou disparam com eventos (o fim do seu turno, a morte de um personagem)."),
          rl("B · Special actions", `${actionSym()} optional actions on your turn: any number of them, each once per turn.`, "B · Ações especiais", `${actionSym()} ações opcionais no seu turno: quantas quiser, uma vez por turno cada.`)
        ], [16])}
        ${infoCard("4", t("Other information", "Outras informações"), [
          rl("Objective", "a brief summary of how to win.", "Objetivo", "um resumo de como vencer."),
          rl("Tokens Needed", "every token the haunt uses, often with what it represents. Same in both books.", "Tokens Needed", "todas as fichas usadas, muitas vezes com o que representam. Igual nos dois livros."),
          rl("Important Locations (Not Pictured)", "tiles the haunt cares about and their regions.", "Important Locations (Not Pictured)", "peças que importam na assombração e as regiões delas."),
          rl("If You Win", "read it aloud for a closing scene when your side wins.", "If You Win", "leia em voz alta como cena final quando o seu lado vencer.")
        ], [16])}
        ${infoCard("5", t("Monster boxes (Traitor’s Tome only)", "Quadros de monstro (só no Traitor’s Tome)"), [
          rl("Top", "the monster’s name and traits — the dice it rolls for trait rolls.", "Topo", "o nome e os atributos do monstro — os dados que ele rola nas rolagens de atributo."),
          rl("Below", "special rules for that monster (walking through walls, attacking with another trait…) and its special actions.", "Abaixo", "regras especiais desse monstro (atravessar paredes, atacar com outro atributo…) e as ações especiais dele."),
          rl("Scope", "rule changes and special actions in a box apply only to that monster.", "Alcance", "mudanças de regra e ações especiais num quadro valem só para esse monstro.")
        ], [16])}
      </div>
      <h3 class="subhead">${t("Haunt bookkeeping", "Controles da assombração")}</h3>
      <div class="quick-grid">
        ${infoCard(t("VARIABLE PLAYER COUNT", "NÚMERO VARIÁVEL DE JOGADORES"), `${t("Read the", "Leia o")} ${ordinal(countPosition(n))} ${t("value", "valor")} · ${playersLabel()}`, [
          `${sym("variable-count", t("Variable player count symbol {3/4/5/6}", "Símbolo de número variável de jogadores {3/4/5/6}"))}`,
          t("Haunt values may differ by player count, written in braces. Example {1/5/7/9}: 1 in a three-player game, 5 with four, 7 with five, 9 with six.", "Valores da assombração podem mudar com o número de jogadores, escritos entre chaves. Exemplo {1/5/7/9}: 1 com três jogadores, 5 com quatro, 7 com cinco, 9 com seis."),
          t(`In this ${n}-player game, {1/5/7/9} means <strong>${sampleValue(n)}</strong>.`, `Nesta partida de ${n} jogadores, {1/5/7/9} significa <strong>${sampleValue(n)}</strong>.`)
        ], [18])}
        ${infoCard(t("NUMBER TRACK", "TRILHA NUMÉRICA"), t("Recording values", "Registrar valores"), [
          `${thumb("number-track", "Number Track 0–9 with its pointer", "Trilha Numérica de 0 a 9 com o marcador")} ${t("Some haunts use the Number Track (0–9) and its pointer to record values.", "Algumas assombrações usam a Trilha Numérica (0–9) e o marcador para registrar valores.")}`
        ], [18])}
        ${infoCard(t("FINDING SPECIFIC TILES", "ENCONTRAR PEÇAS ESPECÍFICAS"), t("Look through the stack", "Consulte a pilha"), [
          t("If a haunt cares about a tile and you are lost, you may look through the tile stack as a reference.", "Se uma assombração se importa com uma peça e vocês estiverem perdidos, podem consultar a pilha de peças."),
          t("Shuffle the stack when you are done.", "Embaralhem a pilha ao terminar.")
        ], [18])}
      </div>`;
  }

  // ---------- after the haunt begins ----------

  function afterHauntSection() {
    return `
      ${sectionHeading("after-haunt", t("After the haunt begins", "Depois que a assombração começa"), sectionIndex("after-haunt"), [15, 18, 19])}
      <div class="quick-grid">
        ${infoCard(t("ATTACKING", "ATACAR"), t("Once per turn, on your tile", "Uma vez por turno, na sua peça"), [
          rl("Who", "once the haunt begins, you may attack monsters and other explorers on your tile, if they are not on your team.", "Quem", "depois que a assombração começa, você pode atacar monstros e outros exploradores na sua peça, se não forem do seu time."),
          rl("How often", "only one attack per turn.", "Frequência", "só um ataque por turno."),
          rl("Roll", "you and your opponent both roll Might.", "Rolar", "você e o oponente rolam Força."),
          rl("Result", "whoever rolls higher wins and deals Physical damage to the loser equal to the difference. A tie deals no damage.", "Resultado", "quem rolar mais vence e causa ao perdedor dano Físico igual à diferença. Empate não causa dano."),
          rl("Other traits", "if an effect (such as a weapon) lets you attack with another trait, both roll that trait instead. Sanity or Knowledge attacks deal Mental damage instead of Physical.", "Outros atributos", "se um efeito (como uma arma) permitir atacar com outro atributo, os dois rolam esse atributo. Ataques de Sanidade ou Conhecimento causam dano Mental em vez de Físico."),
          rl("Hidden traitor & free-for-all", "explorers are permitted to attack each other.", "Traidor oculto e todos contra todos", "exploradores podem atacar uns aos outros.")
        ], [14, 15])}
        ${infoCard(t("WEAPONS", "ARMAS"), t("Items and Omens marked “weapon”", "Itens e Presságios marcados “weapon” (arma)"), [
          rl("One", "only one weapon per attack; if you have several, announce which you are using. You may attack without one.", "Uma", "só uma arma por ataque; se tiver várias, anuncie qual está usando. Você pode atacar sem arma."),
          rl("No defending", "you may not use a weapon to defend against an attack.", "Sem defesa", "você não pode usar uma arma para se defender de um ataque."),
          rl("New this turn", "you cannot attack with a weapon you obtained this turn.", "Nova neste turno", "você não pode atacar com uma arma obtida neste turno."),
          rl("No trading after", "a weapon you attacked with cannot be traded later that turn.", "Sem troca depois", "uma arma usada no ataque não pode ser trocada mais tarde nesse turno.")
        ], [15])}
        ${infoCard(t("LINE OF SIGHT", "LINHA DE VISÃO"), t("Straight through, same region", "Em linha reta, mesma região"), [
          t("Two tiles are within line of sight if an explorer could move from one to the other without changing direction or region. Other tiles may lie in between.", "Duas peças estão em linha de visão se um explorador puder ir de uma à outra sem mudar de direção nem de região. Pode haver outras peças no meio."),
          t("Everyone (explorers and monsters) on a tile in line of sight is in line of sight too.", "Todos (exploradores e monstros) numa peça em linha de visão também estão em linha de visão.")
        ], [15])}
        ${infoCard(t("OBSTACLES", "OBSTÁCULOS"), t("Two moves to leave", "Dois movimentos para sair"), [
          rl("Cost", "leaving a tile with one or more obstacles takes 2 points of movement instead of 1, however many obstacles there are.", "Custo", "sair de uma peça com um ou mais obstáculos custa 2 pontos de movimento em vez de 1, não importa quantos obstáculos haja."),
          rl("Before the haunt", "some tokens are obstacles.", "Antes da assombração", "algumas fichas são obstáculos."),
          interpretation("all tokens start set aside; one reaches the house before the haunt only when a card or tile tells you to place it.", "todas as fichas começam separadas; uma só chega à casa antes da assombração quando uma carta ou peça manda colocá-la."),
          rl("After the haunt", "characters of the opposite team (explorers and/or monsters) also act as obstacles: the traitor and monsters slow heroes, and heroes slow them.", "Depois da assombração", "personagens do time oposto (exploradores e/ou monstros) também são obstáculos: o traidor e os monstros atrasam os heróis, e os heróis os atrasam."),
          rl("Stunned monsters", "do not slow heroes’ movement.", "Monstros atordoados", "não atrasam o movimento dos heróis.")
        ], [15, 18, 19])}
        ${infoCard(t("LOOTING BODIES", "SAQUEAR CORPOS"), t("Once per turn, from a corpse", "Uma vez por turno, de um cadáver"), [
          t("Dead explorers still hold their Items and Omens, and you can still “trade” with them.", "Exploradores mortos continuam com os Itens e Presságios, e você ainda pode “trocar” com eles."),
          rl("Take one", "once per turn, while on the same tile as another explorer’s corpse, take one Item or Omen they were carrying. No permission needed.", "Pegue um", "uma vez por turno, estando na mesma peça que o cadáver de outro explorador, pegue um Item ou Presságio que ele carregava. Sem pedir permissão."),
          interpretation("the rulebook calls looting a “trade” with the corpse, so it counts as your one trade for that turn.", "o manual chama o saque de “troca” com o cadáver, então ele conta como a sua única troca daquele turno.")
        ], [5, 15, 19])}
        ${infoCard(t("THE TRAITOR’S SPECIAL POWERS", "PODERES ESPECIAIS DO TRAIDOR"), t("On top of the haunt’s own rules", "Além das regras da própria assombração"), [
          rl("Tile damage", "the traitor may ignore tiles’ damaging effects: no damage falling through the Collapsed Room or ending a turn in the Furnace Room.", "Dano de peças", "o traidor pode ignorar efeitos de peça que causam dano: nenhum dano ao cair pelo Collapsed Room ou ao terminar o turno no Furnace Room."),
          rl("Still applies", "the traitor must still roll for the Mystic Elevator and still slides down the Laundry Chute.", "Ainda vale", "o traidor ainda precisa rolar no Mystic Elevator e ainda escorrega pelo Laundry Chute."),
          rl("Events", "the traitor may ignore Event symbols on tiles. If they decide to draw an Event card, they must resolve it as normal.", "Eventos", "o traidor pode ignorar símbolos de Evento nas peças. Se decidir comprar uma carta de Evento, precisa resolvê-la normalmente."),
          rl("Reference", "the Traitor reference card on the table summarizes this.", "Referência", "a carta de referência do Traidor na mesa resume isso.")
        ], [18, 19])}
        ${infoCard(t("CONTROLLING MONSTERS", "CONTROLAR MONSTROS"), t("When the haunt gives the traitor monsters", "Quando a assombração dá monstros ao traidor"), [
          rl("Reference", "such haunts tell you to use the Monster reference card.", "Referência", "essas assombrações mandam usar a carta de referência de Monstro."),
          rl("Traits", "monsters typically have fixed traits that do not go up or down.", "Atributos", "monstros normalmente têm atributos fixos que não sobem nem descem."),
          rl("Stunned, not killed", "a monster that takes damage is usually stunned: flip its token to the stunned side. If it is stunned at the start of its turn, turn the token face up again and end that monster’s turn.", "Atordoado, não morto", "um monstro que sofre dano normalmente fica atordoado: vire a ficha para o lado atordoado. Se estiver atordoado no início do turno dele, desvire a ficha e encerre o turno desse monstro."),
          rl("Exceptions", "some monsters are killed instead (remove them and set their tokens aside in case they are needed later); some cannot be stunned (do not flip their token).", "Exceções", "alguns monstros morrem em vez disso (retire-os e guarde as fichas caso sejam necessárias depois); alguns não podem ser atordoados (não vire a ficha)."),
          rl("Movement", "at the beginning of the monster turn, roll dice equal to the monster’s Speed: that is the most tiles it can move (always at least 1). Roll once per monster type, not per monster.", "Movimento", "no início do turno dos monstros, role dados iguais à Velocidade do monstro: esse é o máximo de peças que ele pode mover (sempre ao menos 1). Role uma vez por tipo de monstro, não por monstro."),
          rl("Stairs shortcut", "monsters can move between the Basement Landing and the Ground Floor Staircase as though they were adjacent.", "Atalho da escada", "monstros podem se mover entre o Basement Landing e a Ground Floor Staircase como se fossem adjacentes."),
          rl("Attacks", "normal attack rules; unless noted, monsters attack with Might.", "Ataques", "regras normais de ataque; salvo indicação, monstros atacam com Força."),
          rl("Tiles", "monsters may ignore damaging tile effects; if a monster uses a tile effect, it must roll for it.", "Peças", "monstros podem ignorar efeitos de peça que causam dano; se um monstro usar um efeito de peça, precisa rolar para ele."),
          rl("Limits", "unless the haunt says otherwise, monsters cannot hold Items or Omens and cannot explore new tiles.", "Limites", "salvo indicação da assombração, monstros não podem ter Itens nem Presságios e não podem explorar peças novas."),
          t("When the monster turn happens is set by the haunt (its monster box).", "Quando acontece o turno dos monstros é definido pela assombração (o quadro do monstro).")
        ], [16, 19])}
        ${infoCard(t("DYING", "MORRER"), t("Only after the haunt has started", "Só depois que a assombração começou"), [
          rl("Death", `if any of an explorer’s four traits is at or below the skull ${skullSym()}, that explorer has died — unless the haunt specifies otherwise.`, "Morte", `se qualquer um dos quatro atributos de um explorador estiver na caveira ${skullSym()} ou abaixo, ele morreu — a menos que a assombração diga outra coisa.`),
          rl("Corpse", "tip the figure over and leave it on the tile where the explorer died. Keep their Items and Omens near their character board.", "Cadáver", "deite a miniatura e deixe-a na peça onde o explorador morreu. Deixe os Itens e Presságios dele perto do tabuleiro de personagem."),
          rl("Loot", "other explorers may loot that corpse on future turns.", "Saque", "outros exploradores podem saquear esse cadáver em turnos futuros."),
          interpretation("the rulebook does not say what a dead player does next. The dead explorer takes no more turns, but still belongs to their side, which can still win — unless the haunt says otherwise.", "o manual não diz o que um jogador morto faz depois. O explorador morto não joga mais turnos, mas continua no seu lado, que ainda pode vencer — a menos que a assombração diga outra coisa.")
        ], [5, 19])}
        ${infoCard(t("END OF THE GAME", "FIM DA PARTIDA"), t("First side to finish wins", "O primeiro lado a terminar vence"), [
          t("The first side (traitor or heroes) to complete its objectives for the haunt wins.", "O primeiro lado (traidor ou heróis) a cumprir os objetivos da assombração vence."),
          t("Someone from the winning side reads the “If You Win” section of that side’s haunt book aloud.", "Alguém do lado vencedor lê em voz alta a seção “If You Win” do livro desse lado."),
          t("In a no-traitor haunt everyone plays together; in a free-for-all all compete for the same condition, and not everyone can win.", "Numa assombração sem traidor todos jogam juntos; numa assombração de todos contra todos, cada um disputa a mesma condição, e nem todos podem vencer.")
        ], [14, 19], "victory-card")}
      </div>
      ${figure("line-of-sight", "Line-of-sight diagram: straight green arrows reach checked tiles; a red arrow that changes direction is crossed out", "Diagrama de linha de visão: setas verdes retas chegam a peças aprovadas; uma seta vermelha que muda de direção está riscada", "From the explorer, tiles reached in a straight line through connected doorways are in line of sight (checks); the tile that would need a turn is not (cross).", "A partir do explorador, peças alcançadas em linha reta por portas conectadas estão em linha de visão (marcadas); a peça que exigiria uma curva não está (riscada).", 15)}`;
  }

  // ---------- iconography ----------

  function tokenCard(token) {
    const name = t(token.name[0], token.name[1]);
    const images = token.files.map((file) => `<img src="${ICONS}token-${file}.webp" alt="${t(`${file} token`, `ficha ${file}`)}">`).join("");
    return `
      <article class="icon-card bth-token">
        <span class="bth-token-frame ${token.files.length > 1 ? "is-pair" : ""}">${images}</span>
        <div><strong>${name} ×${token.count}</strong><p>${t(token.note[0], token.note[1])}${token.printed ? "" : ` ${interpretation("descriptive name: no name is printed for these tokens.", "nome descritivo: estas fichas não têm nome impresso.")}`}</p>${refs(token.page)}</div>
      </article>`;
  }

  function iconsSection() {
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), sectionIndex("icons"), [4, 6, 18])}
      <p class="glossary-intro">${t("The rulebook and the haunt books use these symbols. Each image is cropped individually from the rulebook.", "O manual e os livros de assombração usam estes símbolos. Cada imagem foi recortada individualmente do manual.")} ${referenceLink(4)}</p>
      <h3 class="subhead">${t("Card types", "Tipos de carta")}</h3>
      <div class="icon-grid">
        ${iconCard("event", "Event", "Spooky happenings. When you discover a tile with this symbol, draw an Event; read it, resolve it, bury it.", "Evento (Event)", "Acontecimentos assustadores. Ao descobrir uma peça com este símbolo, você compra um Evento: leia, resolva e enterre.", [4, 8, 12])}
        ${iconCard("item", "Item", "Useful objects. When you discover a tile with this symbol, draw an Item and keep it face up.", "Item", "Objetos úteis. Ao descobrir uma peça com este símbolo, você compra um Item e o mantém virado para cima.", [4, 8, 12])}
        ${iconCard("omen", "Omen", "Harbingers of evil. When you discover a tile with this symbol, draw an Omen, keep it — and make a haunt roll.", "Presságio (Omen)", "Arautos do mal. Ao descobrir uma peça com este símbolo, você compra um Presságio, fica com ele — e faz uma rolagem de assombração.", [4, 8, 12])}
      </div>
      <h3 class="subhead">${t("Rule symbols", "Símbolos de regra")}</h3>
      <div class="icon-grid">
        ${iconCard("starting-tile", "Starting tile", "Marks the three starting tiles placed in the center during setup (step “Start building the house”).", "Peça inicial (Starting tile)", "Marca as três peças iniciais colocadas no centro na preparação (etapa “Comece a construir a casa”).", [4, 7])}
        ${iconCard("special-action", "Special action", "An optional action on an Item, Omen or haunt; each once per turn.", "Ação especial (Special action)", "Uma ação opcional num Item, Presságio ou assombração; uma vez por turno cada.", [4, 13, 16])}
        ${iconCard("monster-info", "Monster information", "Marks the monster boxes in the Traitor’s Tome: name, traits, special rules and actions of a monster.", "Informação de monstro (Monster information)", "Marca os quadros de monstro no Traitor’s Tome: nome, atributos, regras especiais e ações de um monstro.", [4, 16])}
        ${iconCard("death", "Death", "The skull at the bottom of each trait track. After the haunt starts, a trait at or below it means the explorer is dead.", "Morte (Death)", "A caveira no fim de cada trilha de atributo. Depois que a assombração começa, um atributo nela ou abaixo significa que o explorador morreu.", [4, 9, 19])}
        ${iconCard("important", "Important changes", "Flags rules that changed from earlier editions (see Changes from earlier editions).", "Mudanças importantes (Important changes)", "Sinaliza regras que mudaram das edições anteriores (veja Mudanças das edições anteriores).", [4, 5])}
        ${iconCard("variable-count", "Variable player count", `Haunt values written {3/4/5/6}: read the value for your player count. With ${playersLabel()}, read the ${ordinal(countPosition())} one.`, "Número variável de jogadores", `Valores de assombração escritos {3/4/5/6}: leia o valor do seu número de jogadores. Com ${playersLabel()}, leia o ${ordinal(countPosition())}.`, [18])}
      </div>
      <h3 class="subhead">${t("Tokens · 114 · set aside until a haunt calls for them", "Fichas · 114 · separadas até uma assombração pedi-las")}</h3>
      <p class="glossary-intro">${t(
        "Most tokens are used only in haunts, which say where to place them, how to use them and what they represent — check each haunt’s “Tokens Needed” list. Names below are as printed on the pictured tokens. Where two faces share one count, they are the front and back of the same token (the guide’s reading, consistent with the 114 total).",
        "A maioria das fichas só é usada nas assombrações, que dizem onde colocá-las, como usá-las e o que representam — veja a lista “Tokens Needed” de cada assombração. Os nomes abaixo são os impressos nas fichas ilustradas. Quando duas faces dividem uma contagem, são frente e verso da mesma ficha (leitura do guia, coerente com o total de 114)."
      )} ${referenceLink(8)}</p>
      <div class="icon-grid bth-token-grid">${TOKENS.map(tokenCard).join("")}</div>`;
  }

  // ---------- examples ----------

  function examplesSection() {
    const n = players();
    const examples = [
      [t("A trait roll: Funeral", "Uma rolagem de atributo: Funeral"), [
        t("Michelle draws Funeral, an Event that asks her to make a Sanity roll.", "Michelle compra Funeral, um Evento que pede uma rolagem de Sanidade."),
        t("Her Sanity is 5, so she rolls 5 dice and adds up the dots.", "A Sanidade dela é 5, então ela rola 5 dados e soma os pontos."),
        t("She reads only the result line of the card that matches her total.", "Ela lê só a linha de resultado da carta que corresponde ao total.")
      ], [10, 12]],
      [t("Not a trait roll: Phone Call", "Não é rolagem de atributo: Phone Call"), [
        t("The Event Phone Call says “Roll 2 dice.”", "O Evento Phone Call diz “Roll 2 dice” (role 2 dados)."),
        t("That is an “other roll”: anything that only boosts trait rolls does not apply.", "Isso é uma “outra rolagem”: o que só melhora rolagens de atributo não vale.")
      ], [10]],
      [t("Damage counts spaces", "O dano conta espaços"), [
        t("Oliver takes 2 Physical damage and assigns it to Might. His Might track reads 3 3 4 4 5 6 6 7, clip on the second 6.", "Oliver sofre 2 de dano Físico e o põe na Força. A trilha de Força dele é 3 3 4 4 5 6 6 7, com a presilha no segundo 6."),
        t("He moves the clip two spaces down: first 6, then 5. His Might is now 5 — only 1 lower.", "Ele desce a presilha dois espaços: primeiro 6, depois 5. A Força dele agora é 5 — só 1 a menos.")
      ], [9]],
      [t("Splitting damage", "Dividir o dano"), [
        t("You take 3 Physical damage.", "Você sofre 3 de dano Físico."),
        t("You may lower Might by 2 and Speed by 1 — but never Knowledge or Sanity.", "Você pode baixar a Força em 2 e a Velocidade em 1 — mas nunca Conhecimento ou Sanidade.")
      ], [9]],
      [t("A critical trait before the haunt", "Um atributo crítico antes da assombração"), [
        t("The haunt has not started. Your Might is critical; your Speed is not.", "A assombração não começou. Sua Força está crítica; sua Velocidade não."),
        t("You take 2 Physical damage: you cannot put it on Might and must lose Speed.", "Você sofre 2 de dano Físico: não pode pô-lo na Força e precisa perder Velocidade.")
      ], [9]],
      [t("Mixing actions", "Misturar ações"), [
        t("On one turn you move once, trade an Item, move again, perform a special action and move a third time.", "Num turno você move uma vez, troca um Item, move de novo, faz uma ação especial e move uma terceira vez."),
        t("All of it counts against one Speed allowance, read at the start of the turn.", "Tudo conta contra um único limite de Velocidade, lido no início do turno.")
      ], [11]],
      [t("Stairs that connect", "Escadas que se conectam"), [
        t("The Ground Floor Staircase says it “Leads to the Upper Landing.”", "A Ground Floor Staircase diz que “Leads to the Upper Landing” (leva ao patamar superior)."),
        t("Both are discovered, so they are adjacent: one point of movement goes from one to the other.", "As duas estão descobertas, então são adjacentes: um ponto de movimento vai de uma à outra.")
      ], [11]],
      [t("A doorway onto a wall", "Uma porta que dá numa parede"), [
        t("The Nursery shows a doorway on the side touching the Operating Theatre, but the Operating Theatre has none there.", "O Nursery mostra uma porta no lado que toca o Operating Theatre, mas o Operating Theatre não tem porta ali."),
        t("They are not adjacent: that doorway is a false feature, like a closet.", "Eles não são adjacentes: essa porta é uma falsa passagem, como um armário.")
      ], [11]],
      [t("Placing a tile", "Colocar uma peça"), [
        t("Next to the Underground Cavern, a Secret Staircase placed with its doorway against a wall is illegal: the doors do not connect.", "Ao lado do Underground Cavern, uma Secret Staircase colocada com a porta contra uma parede é ilegal: as portas não se conectam."),
        t("A Furnace Room turned so one doorway meets the Cavern’s doorway is legal.", "Um Furnace Room girado para que uma porta encontre a porta do Cavern é legal.")
      ], [12]],
      [t("Trading", "Trocar"), [
        t("It’s Samantha’s turn. She moves Father Warren to the Ballroom, where Marley’s explorer Brittani is waiting.", "É o turno de Samantha. Ela move Father Warren para o Ballroom, onde Brittani, a exploradora de Marley, está esperando."),
        t("Samantha trades her Strange Amulet to Marley for the Mask.", "Samantha troca o Strange Amulet dela com Marley pela Mask."),
        t("Earlier this turn she attacked a Zombie with her Crossbow, so the Crossbow cannot be traded this turn.", "Antes, neste turno, ela atacou um Zombie com a Crossbow, então a Crossbow não pode ser trocada neste turno.")
      ], [13]],
      [t("The Mask: two kinds of effect", "A Mask: dois tipos de efeito"), [
        t("The Mask has an effect that is always on while you have it, plus a special action.", "A Mask tem um efeito sempre ativo enquanto você a tem, mais uma ação especial."),
        t("You can’t use the Mask and then give it to someone, or take it from someone and then use it, in the same turn.", "Você não pode usar a Mask e depois dá-la a alguém, nem pegá-la de alguém e depois usá-la, no mesmo turno.")
      ], [13]],
      [t("An attack with a weapon", "Um ataque com arma"), [
        t("Eric is the traitor. He attacks Deirdre’s character with the Machete; both roll Might.", "Eric é o traidor. Ele ataca a personagem de Deirdre com o Machete; os dois rolam Força."),
        t("Eric rolls 4 and adds 1 for the Machete: 5. Deirdre rolls 3.", "Eric tira 4 e soma 1 pelo Machete: 5. Deirdre tira 3."),
        t("Deirdre’s character takes 2 Physical damage; she loses 1 Speed and 1 Might.", "A personagem de Deirdre sofre 2 de dano Físico; ela perde 1 de Velocidade e 1 de Força.")
      ], [15]],
      [t("Reading the Scenario card", "Lendo a carta de Cenário"), [
        t("The rulebook pictures “A Mysterious Invitation”: a table with the columns Omen, Haunt Number and Traitor.", "O manual mostra “A Mysterious Invitation”: uma tabela com as colunas Omen (Presságio), Haunt Number (número) e Traitor (traidor)."),
        t("Its Idol row reads haunt 9, “Free-for-All”. Other rows show entries such as “Haunt Revealer” and “No Traitor”.", "A linha do Idol indica a assombração 9, “Free-for-All” (todos contra todos). Outras linhas mostram entradas como “Haunt Revealer” (revelador) e “No Traitor” (sem traidor).")
      ], [14]],
      [t(`Variable values with ${n} players`, `Valores variáveis com ${n} jogadores`), [
        t("A haunt gives the traitor {1/5/7/9} hellhounds (the rulebook’s example).", "Uma assombração dá ao traidor {1/5/7/9} cães infernais (exemplo do manual)."),
        t(`With ${n} players, read the ${ordinal(countPosition(n))} value: ${sampleValue(n)}.`, `Com ${n} jogadores, leia o ${ordinal(countPosition(n))} valor: ${sampleValue(n)}.`)
      ], [18]],
      [t("Line of sight", "Linha de visão"), [
        t("From the Observatory, tiles in a straight line through connected doorways on the same floor are in line of sight.", "A partir do Observatory, as peças em linha reta por portas conectadas no mesmo andar estão em linha de visão."),
        t("A tile reached only by turning a corner is not.", "Uma peça alcançada só virando uma esquina não está.")
      ], [15]]
    ];
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), sectionIndex("examples"), [...new Set(examples.flatMap((example) => example[2]))])}
      <div class="example-grid">${examples.map(([title, items, pages], index) => `
        <article class="example-card">
          <span class="card-number">${String(index + 1).padStart(2, "0")}</span>
          <h3>${title}</h3>
          ${lineList(items)}
          <div class="example-source"><span>${t("From the rulebook's examples", "Dos exemplos do manual")}</span>${refs(pages)}</div>
        </article>`).join("")}</div>`;
  }

  // ---------- changes ----------

  function changesSection() {
    const changes = [
      ["Scenario cards", "Cartas de Cenário", "The haunt is no longer found with the haunt matrix: you choose a Scenario card before playing, and it reveals the haunt and the traitor.", "A assombração não é mais encontrada pela tabela de assombrações: vocês escolhem uma carta de Cenário antes de jogar, e ela revela a assombração e o traidor."],
      ["Haunt roll", "Rolagem de assombração", "Roll one die per Omen discovered; 5 or higher starts the haunt. The last Omen starts it automatically.", "Role um dado por Presságio descoberto; 5 ou mais começa a assombração. O último Presságio a começa automaticamente."],
      ["New terms", "Termos novos", "General damage, heal, bury, critical, special actions and line of sight.", "Dano geral, curar, enterrar, crítico, ações especiais e linha de visão."],
      ["No stealing", "Sem roubo", "Taking an Item from an enemy defeated with a Might attack is no longer a standard ability; haunts say so when they allow it.", "Pegar um Item de um inimigo derrotado com ataque de Força não é mais uma habilidade padrão; as assombrações avisam quando permitem."],
      ["Turns end differently", "Turnos acabam diferente", "Discovering (placing) a new room ends your turn after you resolve the tile and its card. You may still end your turn voluntarily.", "Descobrir (colocar) um cômodo novo encerra o turno depois de resolver a peça e a carta. Você ainda pode encerrar o turno voluntariamente."],
      ["Read before you split up", "Leiam antes de se separar", "Both sides read their introduction and setup aloud before going to separate rooms.", "Os dois lados leem a introdução e a preparação em voz alta antes de irem para salas separadas."],
      ["Open information", "Informação aberta", "During a haunt the other team can ask you to read aloud the entire text of an action you take.", "Durante a assombração o outro time pode pedir que você leia em voz alta o texto inteiro de uma ação que fizer."],
      ["Corpses", "Cadáveres", "Dead explorers stay on their tile as corpses; others may take their Items and Omens.", "Exploradores mortos ficam na peça como cadáveres; outros podem pegar os Itens e Presságios deles."]
    ];
    return `
      ${sectionHeading("changes", t("Changes from earlier editions", "Mudanças das edições anteriores"), sectionIndex("changes"), [5])}
      <p class="glossary-intro">${t("For veterans of earlier editions. Changed rules are flagged with this symbol in the rulebook:", "Para veteranos das edições anteriores. Regras alteradas são marcadas com este símbolo no manual:")} ${sym("important", t("Important changes symbol", "Símbolo de mudanças importantes"))}</p>
      <div class="quick-grid">${changes.map(([titleEn, titlePt, bodyEn, bodyPt]) => `
        <article class="info-card bth-change">
          <span class="component-label">${sym("important", "")} ${t("CHANGED", "MUDOU")}</span>
          <h3>${t(titleEn, titlePt)}</h3>
          <p>${t(bodyEn, bodyPt)}</p>
          ${referenceLink(5)}
        </article>`).join("")}</div>
      <div class="callout">${t(
        "The rulebook’s most important rule: this is a game and you must have fun. If the outcome of a move seems ambiguous, decide as a group how to handle it and move on — you won’t break the game.",
        "A regra mais importante do manual: isto é um jogo e vocês precisam se divertir. Se o resultado de uma jogada parecer ambíguo, decidam em grupo como resolver e sigam em frente — vocês não vão quebrar o jogo."
      )} ${referenceLink(5)}</div>`;
  }

  // ---------- glossary ----------

  function glossarySection() {
    const visible = [
      { term: ["Adjacent", "Adjacente"], en: "Adjacent", text: ["Two tiles sharing a directly connected doorway, or linked by printed text once both are discovered.", "Duas peças que compartilham uma porta diretamente conectada, ou ligadas por texto impresso quando as duas estão descobertas."], page: 11 },
      { term: ["Bury", "Enterrar"], en: "Bury", text: ["Put a tile on the bottom of the tile stack, or a card on the bottom of its deck.", "Pôr uma peça no fundo da pilha de peças, ou uma carta no fundo do baralho correspondente."], page: 12 },
      { term: ["Corpse", "Cadáver"], en: "Corpse", text: ["A dead explorer’s figure, tipped over on its tile, still holding its Items and Omens for looting.", "A miniatura de um explorador morto, deitada na peça, ainda com os Itens e Presságios para saque."], page: 19 },
      { term: ["Critical", "Crítico"], en: "Critical", text: ["A trait at its lowest value, next to the skull (printed in red).", "Um atributo no menor valor, ao lado da caveira (impresso em vermelho)."], page: 9 },
      { term: ["Explorer / hero / traitor", "Explorador / herói / traidor"], en: "Explorer / hero / traitor", text: ["Everyone is an explorer, before and after the haunt starts. Once it begins, the explorers on the traitor’s opposing side are called heroes.", "Todos são exploradores, antes e depois de a assombração começar. Quando ela começa, os exploradores do lado oposto ao traidor são chamados de heróis."], page: [14, 18] },
      { term: ["False feature", "Falsa passagem"], en: "False feature", text: ["A doorway that meets a wall: a closet or alcove. It does not make tiles adjacent.", "Uma porta que dá numa parede: um armário ou alcova. Ela não torna as peças adjacentes."], page: [11, 13] },
      { term: ["General damage", "Dano geral"], en: "General damage", text: ["Damage you assign to any traits you choose.", "Dano que você distribui entre os atributos que escolher."], page: 9 },
      { term: ["Haunt", "Assombração"], en: "Haunt", text: ["The second part of the game: one of 50 scenarios from the haunt books, usually with a hero version (Secrets of Survival) and a traitor version (Traitor’s Tome).", "A segunda parte do jogo: um de 50 cenários dos livros de assombração, normalmente com uma versão dos heróis (Secrets of Survival) e uma do traidor (Traitor’s Tome)."], page: 14 },
      { term: ["Haunt revealer", "Revelador da assombração"], en: "Haunt revealer", text: ["The player whose haunt roll started the haunt — or who drew the last Omen card. Usually the traitor.", "O jogador cuja rolagem começou a assombração — ou que comprou a última carta de Presságio. Normalmente o traidor."], page: [12, 18] },
      { term: ["Haunt roll", "Rolagem de assombração"], en: "Haunt roll", text: ["After drawing an Omen: one die per Omen; 5+ starts the haunt.", "Depois de comprar um Presságio: um dado por Presságio; 5+ começa a assombração."], page: [10, 12] },
      { term: ["Heal", "Curar"], en: "Heal", text: ["Return a trait to its green starting value if it is below it.", "Voltar um atributo ao valor inicial verde se estiver abaixo dele."], page: 9 },
      { term: ["Line of sight", "Linha de visão"], en: "Line of sight", text: ["Tiles reachable from one another without changing direction or region.", "Peças alcançáveis umas das outras sem mudar de direção nem de região."], page: 15 },
      { term: ["Mental damage", "Dano mental"], en: "Mental damage", text: ["Lose Knowledge and/or Sanity.", "Perder Conhecimento e/ou Sanidade."], page: 9 },
      { term: ["Obstacle", "Obstáculo"], en: "Obstacle", text: ["Anything that makes leaving a tile cost 2 movement: some tokens, and after the haunt the opposite team’s characters.", "Qualquer coisa que faça sair de uma peça custar 2 de movimento: algumas fichas e, depois da assombração, os personagens do time oposto."], page: [15, 18] },
      { term: ["Physical damage", "Dano físico"], en: "Physical damage", text: ["Lose Might and/or Speed.", "Perder Força e/ou Velocidade."], page: 9 },
      { term: ["Region", "Região"], en: "Region", text: ["Basement, Ground Floor or Upper Floor. A tile’s back shows its region.", "Porão, Térreo ou Andar Superior (Basement, Ground Floor, Upper Floor). O verso da peça mostra a região."], page: [8, 12] },
      { term: ["Scenario card", "Carta de Cenário"], en: "Scenario card", text: ["Chosen at setup; when the haunt begins, its row for the triggering Omen gives the haunt number and the traitor.", "Escolhida na preparação; quando a assombração começa, a linha do Presságio que a disparou dá o número da assombração e o traidor."], page: [7, 14] },
      { term: ["Special action", "Ação especial"], en: "Special action", text: ["An optional action marked with the special-action symbol; each once per turn.", "Uma ação opcional marcada com o símbolo de ação especial; uma vez por turno cada."], page: [13, 16] },
      { term: ["Stunned", "Atordoado"], en: "Stunned", text: ["A damaged monster, token flipped. It recovers instead of acting on its next turn and does not slow heroes.", "Um monstro ferido, com a ficha virada. Ele se recupera em vez de agir no próximo turno e não atrasa os heróis."], page: 19 },
      { term: ["Trait", "Atributo"], en: "Trait", text: ["Might, Speed, Knowledge or Sanity, tracked by a clip on the character board.", "Força, Velocidade, Conhecimento ou Sanidade, marcados por uma presilha no tabuleiro."], page: 9 },
      { term: ["Trait roll", "Rolagem de atributo"], en: "Trait roll", text: ["Roll as many dice as your current value in that trait.", "Rolar tantos dados quanto o valor atual nesse atributo."], page: 10 },
      { term: ["Weapon", "Arma"], en: "Weapon", text: ["An Item or Omen marked as a weapon that modifies your attack; one per attack, never for defense.", "Um Item ou Presságio marcado como arma que modifica seu ataque; uma por ataque, nunca para defesa."], page: 15 }
    ];
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), sectionIndex("glossary"), [...new Set(visible.flatMap((item) => uniquePages(item.page)))])}
      <div class="quick-grid glossary-grid">${visible.map((item) => `
        <article class="info-card glossary-card">
          <span class="component-label">${t("TERM", "TERMO")}</span>
          <h3>${t(item.term[0], item.term[1])}${lang ? en(item.en) : ""}</h3>
          <p>${t(item.text[0], item.text[1])}</p>
          ${refs(item.page)}
        </article>`).join("")}</div>`;
  }

  // ---------- render ----------

  function renderInto(host) {
    root = host;
    document.body.classList.add("theme-betrayal");
    document.documentElement.lang = state.language;
    document.title = t("Betrayal at House on the Hill — Field Manual", "Betrayal at House on the Hill — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Betrayal at House on the Hill (3rd edition): 3–6 players, setup checklist, exploration, cards, the haunt roll, the traitor and heroes procedure and every rulebook symbol — no haunt spoilers.",
        "Regras interativas bilíngues de Betrayal at House on the Hill (3ª edição): 3–6 jogadores, lista de preparação, exploração, cartas, a rolagem de assombração, o procedimento de traidor e heróis e todos os símbolos do manual — sem spoilers de assombração."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook · third edition", "Livro interativo · terceira edição")}</p>
          <h1>Betrayal at House on the Hill</h1>
          <p class="hero-intro">${t(
            "Explore an abandoned house that builds itself room by room. Find Items, suffer Events, gather Omens — until a haunt roll turns one of you into the traitor and the house shows what it wants.",
            "Explore uma casa abandonada que se monta cômodo a cômodo. Encontre Itens, sofra Eventos, junte Presságios — até que uma rolagem de assombração transforme um de vocês em traidor e a casa mostre o que quer."
          )}</p>
          <div class="hero-meta"><span>${t("3–6 players", "3–6 jogadores")}</span><span>${t("Ages 12+", "12+ anos")}</span><span>${t("60–90 min", "60–90 min")}</span><span>${t("Exploration · hidden traitor", "Exploração · traidor")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/betrayal-at-house-on-the-hill.webp" alt="${t("Cover of the Betrayal at House on the Hill 3rd edition rulebook: a raven filled with the haunted house", "Capa do manual de Betrayal at House on the Hill 3ª edição: um corvo preenchido pela casa assombrada")}" fetchpriority="high"><figcaption>${t("Rulebook cover · Avalon Hill, 3rd edition", "Capa do manual · Avalon Hill, 3ª edição")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("The house", "A casa")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column bth-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied 24-page rulebook of Betrayal at House on the Hill, 3rd edition (Avalon Hill): setup, exploring the house before the haunt, cards and dice, how the haunt starts, the traitor-and-heroes procedure and the general rules after the haunt begins. The 50 haunts themselves live in the two haunt books, <em>Secrets of Survival</em> and <em>Traitor’s Tome</em>, which are not part of the PDF: use them for every haunt’s goals, setup, monsters and special rules. Points marked “Guide's reading” are interpretations where the rulebook is silent. Page links use the printed page numbers.",
            "Este guia cobre o manual fornecido de 24 páginas de Betrayal at House on the Hill, 3ª edição (Avalon Hill): preparação, exploração da casa antes da assombração, cartas e dados, como a assombração começa, o procedimento de traidor e heróis e as regras gerais depois que a assombração começa. As 50 assombrações estão nos dois livros de assombração, <em>Secrets of Survival</em> e <em>Traitor’s Tome</em>, que não fazem parte do PDF: use-os para os objetivos, a preparação, os monstros e as regras especiais de cada assombração. Pontos marcados como “Leitura do guia” são interpretações onde o manual é omisso. Os links de página usam a numeração impressa."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${explorersSection()}</section>
          <section class="rule-section">${turnSection()}</section>
          <section class="rule-section">${cardsDiceSection()}</section>
          <section class="rule-section">${hauntSection()}</section>
          <section class="rule-section">${afterHauntSection()}</section>
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${changesSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the Betrayal at House on the Hill 3rd edition rulebook. Design: Noah Cohen, Brian Neff; card and token art: Derek Ring; room art: Henning Ludvigsen. BETRAYAL AT HOUSE ON THE HILL and AVALON HILL are trademarks of Hasbro, Inc. © 2022 Hasbro.",
        "Guia pessoal de consulta baseado no manual de Betrayal at House on the Hill, 3ª edição. Design: Noah Cohen, Brian Neff; arte das cartas e fichas: Derek Ring; arte dos cômodos: Henning Ludvigsen. BETRAYAL AT HOUSE ON THE HILL e AVALON HILL são marcas da Hasbro, Inc. © 2022 Hasbro."
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
      root.querySelector(".bth-page")?.prepend(notice);
    }
    notice.textContent = storageNoticeText();
  }

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !root || !root.contains(target)) {
      return;
    }
    if (target.type === "radio" && target.dataset.players !== undefined) {
      const value = target.dataset.players;
      if (PLAYER_COUNTS.includes(value) && value !== state.players) {
        const before = signature();
        state = normalizePreferences({ ...state, players: value });
        savePreferences();
        if (signature() !== before) {
          setupState = { signature: signature(), checks: [] };
          saveSetup();
        }
        rerender();
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

  window.BetrayalAtHouseOnTheHill = { renderInto, onClick, onChange };
})();
