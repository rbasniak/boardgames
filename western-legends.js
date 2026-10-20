(() => {
  "use strict";

  const PREFS_KEY = "field-manual.western-legends.v1";
  const CHECKS_KEY = "field-manual.western-legends.setup.v1";
  const ICON_DIR = "assets/western-legends/icons/";

  const BOOKS = {
    core: {
      file: "western-legends_core.pdf",
      en: "Core", pt: "Base",
      pdfPage: (page) => page
    },
    ante: {
      file: "western-legends_ante-up.pdf",
      en: "Ante Up", pt: "Ante Up",
      pdfPage: (page) => (page <= 1 ? 1 : page >= 16 ? 9 : Math.floor(page / 2) + 1)
    },
    blood: {
      file: "western-legends_blood-money.pdf",
      en: "Blood Money", pt: "Blood Money",
      pdfPage: (page) => (page <= 1 ? 1 : page <= 11 ? Math.floor(page / 2) + 1 : page === 12 ? 7 : page - 5)
    },
    fistful: {
      file: "western-legends_fistful-of-extras.pdf",
      en: "Fistful of Extras", pt: "Fistful of Extras",
      pdfPage: (page) => page
    },
    gbh: {
      file: "western-legends_the-good-the-bad-and-the-handsome.pdf",
      en: "The Good, the Bad and the Handsome", pt: "The Good, the Bad and the Handsome",
      pdfPage: (page) => page
    },
    wild: {
      file: "western-legends_wild-bunch-of-extras.pdf",
      en: "Wild Bunch of Extras", pt: "Wild Bunch of Extras",
      pdfPage: (page) => page
    },
    faq: {
      file: "western-legends_faq.pdf",
      en: "FAQ", pt: "FAQ",
      pdfPage: (page) => page
    }
  };

  const MODES = ["standard", "first", "serenade", "golden", "law", "risky", "border"];
  const BLOOD_MODES = ["serenade", "golden", "law", "risky", "border"];
  const EXPANSIONS = ["ante", "blood", "fistful", "gbh", "wild"];
  const OPTIONS = ["goals", "altPoker", "bandit", "highStakes", "title", "gang", "sheriffDeck"];

  const MODE_INFO = {
    serenade: { page: 14, setupPage: 15, players: [3, 5], lp: [15, 20], requires: ["gbh"], story: "core" },
    golden: { page: 16, setupPage: 17, players: [3, 6], lp: [20], requires: [], story: "core" },
    law: { page: 18, setupPage: 19, players: [3, 6], lp: [20], requires: ["wild"], story: "core" },
    risky: { page: 20, setupPage: 21, players: [3, 5], lp: [20, 25], requires: [], story: "legendary" },
    border: { page: 22, setupPage: 23, players: [2, 4], lp: [15, 20], requires: ["wild"], story: "core" }
  };

  let storageNotice = "";
  let adjustNotices = [];
  let root = null;

  function defaultPrefs() {
    return {
      language: "pt-BR",
      mode: "standard",
      players: 4,
      ante: false,
      blood: false,
      fistful: false,
      gbh: false,
      wild: false,
      story: "legendary",
      lp: 20,
      goals: false,
      altPoker: true,
      bandit: false,
      highStakes: false,
      title: false,
      gang: false,
      sheriffDeck: false
    };
  }

  function playerRange(mode) {
    if (mode === "first") {
      return [3, 4];
    }
    return [2, 6];
  }

  function resolvePrefs(input) {
    const p = { ...input };
    const mode = p.mode;
    if (mode === "first") {
      EXPANSIONS.forEach((key) => {
        p[key] = false;
      });
      OPTIONS.forEach((key) => {
        p[key] = false;
      });
      p.lp = 15;
    }
    if (BLOOD_MODES.includes(mode)) {
      p.ante = true;
      p.blood = true;
      MODE_INFO[mode].requires.forEach((key) => {
        p[key] = true;
      });
      OPTIONS.forEach((key) => {
        p[key] = false;
      });
      p.altPoker = true;
      if (mode === "law") {
        p.gang = true;
      }
      if (mode === "risky") {
        p.goals = true;
      }
      p.story = MODE_INFO[mode].story;
    }
    if (!p.ante) {
      p.blood = false;
      p.highStakes = false;
    }
    if (!p.blood) {
      p.story = "core";
    }
    if (!p.ante && !p.blood) {
      p.altPoker = false;
    }
    if (!p.fistful) {
      p.bandit = false;
    }
    if (!p.wild) {
      p.title = false;
      p.gang = false;
      p.sheriffDeck = false;
    }
    const [min, max] = playerRange(mode);
    p.players = Math.min(max, Math.max(min, p.players));
    return p;
  }

  function normalizePrefs(saved) {
    const next = defaultPrefs();
    if (!saved || typeof saved !== "object") {
      return resolvePrefs(next);
    }
    if (saved.language === "en-US" || saved.language === "pt-BR") {
      next.language = saved.language;
    }
    if (MODES.includes(saved.mode)) {
      next.mode = saved.mode;
    }
    const players = Number(saved.players);
    if (Number.isInteger(players) && players >= 2 && players <= 6) {
      next.players = players;
    }
    [...EXPANSIONS, ...OPTIONS].forEach((key) => {
      if (typeof saved[key] === "boolean") {
        next[key] = saved[key];
      }
    });
    if (saved.story === "core" || saved.story === "legendary") {
      next.story = saved.story;
    }
    if ([15, 20, 25].includes(Number(saved.lp))) {
      next.lp = Number(saved.lp);
    }
    return resolvePrefs(next);
  }

  function loadPrefs() {
    try {
      const raw = window.localStorage.getItem(PREFS_KEY);
      return raw ? normalizePrefs(JSON.parse(raw)) : normalizePrefs(null);
    } catch (error) {
      storageNotice = "read";
      console.error("Could not read Western Legends match settings.", error);
      return normalizePrefs(null);
    }
  }

  let prefs = loadPrefs();

  function configurationKey(p = prefs) {
    const copy = { ...p };
    delete copy.language;
    return JSON.stringify(copy);
  }

  function loadChecks() {
    try {
      const raw = window.localStorage.getItem(CHECKS_KEY);
      if (!raw) {
        return [];
      }
      const saved = JSON.parse(raw);
      if (!saved || saved.config !== configurationKey() || !Array.isArray(saved.checks)) {
        return [];
      }
      return [...new Set(saved.checks.filter((id) => typeof id === "string"))];
    } catch (error) {
      storageNotice = "read";
      console.error("Could not read the Western Legends setup checklist.", error);
      return [];
    }
  }

  let setupChecks = loadChecks();

  function savePrefs() {
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      if (storageNotice === "write") {
        storageNotice = "";
      }
    } catch (error) {
      storageNotice = "write";
      console.error("Could not save Western Legends match settings.", error);
    }
  }

  function saveChecks() {
    try {
      window.localStorage.setItem(CHECKS_KEY, JSON.stringify({ config: configurationKey(), checks: setupChecks }));
      if (storageNotice === "write") {
        storageNotice = "";
      }
    } catch (error) {
      storageNotice = "write";
      console.error("Could not save the Western Legends setup checklist.", error);
    }
  }

  function t(en, pt) {
    return prefs.language === "pt-BR" ? pt : en;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function bookName(book) {
    return t(BOOKS[book].en, BOOKS[book].pt);
  }

  function ref(book, page) {
    const info = BOOKS[book];
    const label = `${bookName(book)} p. ${page} ↗`;
    return `<a class="source-link" href="manuals/${info.file}#page=${info.pdfPage(page)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
  }

  function refs(...pairs) {
    return pairs.map(([book, page]) => ref(book, page)).join(" ");
  }

  function describeChange(key, before, after) {
    const names = {
      ante: t("Ante Up", "Ante Up"),
      blood: t("Blood Money", "Blood Money"),
      fistful: t("Fistful of Extras", "Fistful of Extras"),
      gbh: t("The Good, the Bad and the Handsome", "The Good, the Bad and the Handsome"),
      wild: t("Wild Bunch of Extras", "Wild Bunch of Extras"),
      goals: t("Goal cards", "Cartas de objetivo"),
      altPoker: t("Alternate poker cards", "Cartas de pôquer alternativas"),
      bandit: t("Bandit cards", "Cartas de bandido"),
      highStakes: t("High stakes poker", "Pôquer de apostas altas"),
      title: t("Title card", "Carta de título"),
      gang: t("Gang/Posse cards", "Cartas de Gangue/Bando"),
      sheriffDeck: t("Sheriff deck", "Baralho de Xerife"),
      story: t("Story system", "Sistema de histórias"),
      lp: t("Game length", "Duração"),
      players: t("Players", "Jogadores")
    };
    if (!names[key]) {
      return "";
    }
    if (typeof after === "boolean") {
      return after
        ? t(`${names[key]} was switched on because the chosen mode requires it.`, `${names[key]} foi ativado porque o modo escolhido exige.`)
        : t(`${names[key]} was switched off because it is not available with the current choices.`, `${names[key]} foi desativado porque não está disponível com as escolhas atuais.`);
    }
    return t(`${names[key]} changed from ${before} to ${after} to fit the current choices.`, `${names[key]} mudou de ${before} para ${after} para se adequar às escolhas atuais.`);
  }

  function commit(mutator) {
    const previousKey = configurationKey();
    const draft = { ...prefs };
    mutator(draft);
    const resolved = resolvePrefs(draft);
    adjustNotices = Object.keys(resolved)
      .filter((key) => key !== "language" && key !== "mode" && resolved[key] !== draft[key])
      .map((key) => describeChange(key, draft[key], resolved[key]))
      .filter(Boolean);
    prefs = resolved;
    savePrefs();
    if (configurationKey() !== previousKey) {
      setupChecks = [];
      saveChecks();
    }
    if (root) {
      renderInto(root);
    }
  }

  // Derived match facts used by every section.
  function match() {
    const p = prefs;
    const mode = p.mode;
    const bloodMode = BLOOD_MODES.includes(mode);
    const legendary = p.blood && p.story === "legendary";
    return {
      ...p,
      bloodMode,
      legendary,
      coreStory: !legendary,
      mib: p.players === 2 && mode !== "border",
      border: mode === "border",
      trader: p.blood && mode !== "serenade" && mode !== "border",
      deeds: p.blood && !["serenade", "law", "border"].includes(mode),
      injuries: p.blood && mode !== "golden",
      events: p.ante,
      discs: p.players >= 5 ? 3 : 2,
      storyDiscsEach: legendary ? 3 : 2
    };
  }

  function sectionHeading(id, title, index, refHtml) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("FIELD GUIDE", "GUIA DE CAMPO")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="wl-heading-refs">${refHtml}</div>
      </div>`;
  }

  function card(title, body, refHtml = "") {
    return `<article class="info-card"><h3>${title}</h3>${body}${refHtml ? `<p class="wl-refs">${refHtml}</p>` : ""}</article>`;
  }

  function list(items) {
    return `<ul class="wl-list">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function steps(items) {
    return `<ol class="wl-steps">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ol>`;
  }

  function faqNote(text, page) {
    return `<p class="wl-faq-note"><strong>${t("FAQ clarification:", "Esclarecimento do FAQ:")}</strong> ${text} ${ref("faq", page)}</p>`;
  }

  function jump(id, label) {
    return `<button type="button" data-scroll="${id}">${label}</button>`;
  }

  function storageNoticeText() {
    if (storageNotice === "read") {
      return t(
        "This browser could not read the saved Western Legends match. A default match is shown, and it may not be possible to save changes.",
        "Este navegador não conseguiu ler a partida salva de Western Legends. Uma partida padrão está na tela, e pode não ser possível salvar alterações."
      );
    }
    return t(
      "This browser refused to save the Western Legends match. Your latest change is visible on screen only.",
      "Este navegador recusou salvar a partida de Western Legends. A última alteração aparece apenas na tela."
    );
  }

  // --- Build your match ------------------------------------------------

  function radioOption(key, value, selected, title, description) {
    const id = `wl-${key}-${value}`;
    const checked = String(selected) === String(value);
    return `
      <label class="wl-choice-card ${checked ? "is-selected" : ""}" for="${id}">
        <input id="${id}" type="radio" name="wl-${key}" value="${escapeHtml(value)}" data-pref="${key}" ${checked ? "checked" : ""}>
        <span class="wl-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function radioGroup(key, title, summary, selected, options, refHtml = "", wide = false) {
    return `
      <fieldset class="wl-choice-group">
        <legend>${title}</legend>
        <p class="wl-choice-summary"><strong>${t("Selected:", "Selecionado:")}</strong> ${summary}</p>
        <div class="wl-choice-grid ${wide ? "is-wide" : ""}">${options.map((item) => radioOption(key, item.value, selected, item.title, item.description)).join("")}</div>
        ${refHtml ? `<p class="wl-choice-references">${refHtml}</p>` : ""}
      </fieldset>`;
  }

  function yesNo(key, title, value, yesTitle, yesText, noTitle, noText, refHtml) {
    return radioGroup(key, title, value ? yesTitle : noTitle, String(value), [
      { value: "true", title: yesTitle, description: yesText },
      { value: "false", title: noTitle, description: noText }
    ], refHtml);
  }

  function fixedGroup(title, summary, text, refHtml = "") {
    return `
      <fieldset class="wl-choice-group is-fixed">
        <legend>${title}</legend>
        <p class="wl-choice-summary"><strong>${t("Fixed:", "Fixo:")}</strong> ${summary}</p>
        <p class="wl-option-note">${text}</p>
        ${refHtml ? `<p class="wl-choice-references">${refHtml}</p>` : ""}
      </fieldset>`;
  }

  function modeTitle(mode) {
    return {
      standard: t("Standard game (sandbox)", "Partida padrão (sandbox)"),
      first: t("First game (introductory setup)", "Primeira partida (preparação introdutória)"),
      serenade: t("Serenade of the Six Guns", "Serenade of the Six Guns (Serenata dos Seis Tiros)"),
      golden: t("The Golden Rule", "The Golden Rule (A Regra de Ouro)"),
      law: t("Law and Disorder", "Law and Disorder (Lei e Desordem)"),
      risky: t("Risky Business", "Risky Business (Negócio Arriscado)"),
      border: t("Who Runs Border Town", "Who Runs Border Town (Quem Manda na Cidade de Fronteira)")
    }[mode];
  }

  function modeDescription(mode) {
    return {
      standard: t(
        "The normal open-ended game for 2–6 players. You decide below which expansions and which optional systems to use. With 2 players the Man in Black automatically joins as a rival.",
        "O jogo normal e aberto para 2–6 jogadores. Você decide abaixo quais expansões e sistemas opcionais usar. Com 2 jogadores, o Man in Black entra automaticamente como rival."
      ),
      first: t(
        "Core box only, for 3–4 players learning the game: 4 fixed characters, a 20-card story deck, no cattle, no goal cards, 3 items removed and a short 15 LP game. Expansions and variants are switched off.",
        "Somente a caixa base, para 3–4 jogadores aprendendo: 4 personagens fixos, baralho de 20 histórias, sem gado, sem objetivos, 3 itens removidos e partida curta de 15 LP. Expansões e variantes ficam desligadas."
      ),
      serenade: t(
        "Blood Money mode focused on shootouts between players: fighter characters, only “Initiate a fight with another player” story cards, injuries, no Traveling Trader and no deeds; everyone starts with 2 extra poker cards. Needs Core + Ante Up + Blood Money + The Good, the Bad and the Handsome. Recommended 3–5 players, 15 or 20 LP.",
        "Modo do Blood Money focado em tiroteios entre jogadores: personagens lutadores, só histórias “Inicie uma luta com outro jogador”, ferimentos graves, sem Mercador Viajante e sem escrituras; todos começam com 2 cartas de pôquer extras. Exige Base + Ante Up + Blood Money + The Good, the Bad and the Handsome. Recomendado 3–5 jogadores, 15 ou 20 LP."
      ),
      golden: t(
        "Blood Money mode about getting rich: mining, ranching, gambling and deeds. Money scores 1 LP per $40, the richest player gains 1 LP, injury cards are not used, only “Spend $80 or more in a town” story cards. Needs Core + Ante Up + Blood Money. Recommended 3–6 players, 20 LP.",
        "Modo do Blood Money sobre enriquecer: mineração, gado, jogatina e escrituras. Dinheiro vale 1 LP a cada $40, o mais rico ganha 1 LP, sem cartas de ferimento grave, só histórias “Gaste $80 ou mais numa cidade”. Exige Base + Ante Up + Blood Money. Recomendado 3–6 jogadores, 20 LP."
      ),
      law: t(
        "Blood Money mode about Marshals against outlaws: characters that start Marshal or Wanted, the Gang/Posse cards are mandatory, Wanted players can stay “Infamous” when arrested, no deeds. Needs Core + Ante Up + Blood Money + Wild Bunch of Extras. Recommended 3–6 players, 20 LP.",
        "Modo do Blood Money sobre Delegados contra fora da lei: personagens que começam Delegado ou Procurado, cartas de Gangue/Bando obrigatórias, Procurados podem permanecer “Infames” ao serem presos, sem escrituras. Exige Base + Ante Up + Blood Money + Wild Bunch of Extras. Recomendado 3–6 jogadores, 20 LP."
      ),
      risky: t(
        "Blood Money mode built around Legendary Stories and the risk die: story-loving characters, all events, goal cards mandatory, and +1 LP every time your cube reaches space 4 of the Story track. Needs Core + Ante Up + Blood Money. Recommended 3–5 players, 20–25 LP.",
        "Modo do Blood Money em torno das Histórias Lendárias e do dado de risco: personagens de história, todos os eventos, objetivos obrigatórios e +1 LP sempre que seu cubo chega ao espaço 4 da trilha de História. Exige Base + Ante Up + Blood Money. Recomendado 3–5 jogadores, 20–25 LP."
      ),
      border: t(
        "Blood Money mode played entirely on the Buzzard Gulch board: homesteads, gold nuggets used as money, no Bank/Cabaret/Doctor, a 3-stop train and no Man in Black even with 2 players. Needs Core + Ante Up + Blood Money + Wild Bunch of Extras story cards. Recommended 2–4 players, 15–20 LP.",
        "Modo do Blood Money jogado inteiramente no tabuleiro de Buzzard Gulch: propriedades rurais, pepitas usadas como dinheiro, sem Banco/Cabaré/Médico, trem com 3 paradas e sem Man in Black mesmo com 2 jogadores. Exige Base + Ante Up + Blood Money + histórias do Wild Bunch of Extras. Recomendado 2–4 jogadores, 15–20 LP."
      )
    }[mode];
  }

  function modeRefs(mode) {
    if (mode === "standard") {
      return refs(["core", 6], ["core", 22]);
    }
    if (mode === "first") {
      return refs(["core", 24]);
    }
    return refs(["blood", 13], ["blood", MODE_INFO[mode].page], ["blood", MODE_INFO[mode].setupPage]);
  }

  function renderConfiguration() {
    const m = match();
    const groups = [];
    groups.push(radioGroup("mode", t("1 · Game mode", "1 · Modo de jogo"), modeTitle(m.mode), m.mode, MODES.map((mode) => ({
      value: mode,
      title: modeTitle(mode),
      description: modeDescription(mode)
    })), `${modeRefs(m.mode)}`, true));

    const [minP, maxP] = playerRange(m.mode);
    const playerOptions = [];
    for (let count = minP; count <= maxP; count += 1) {
      let description;
      if (count === 2 && m.mode === "border") {
        description = t("Two players, no Man in Black: this mode plays exactly the same at every player count.", "Dois jogadores, sem Man in Black: este modo é jogado igual em qualquer número de jogadores.");
      } else if (count === 2) {
        description = t("Two players plus the Man in Black, an automated rival who moves, fights, scores LP and can win the game.", "Dois jogadores mais o Man in Black, um rival automático que se move, luta, ganha LP e pode vencer a partida.");
      } else if (count <= 4) {
        description = t(`${count} players. Core story cards need 2 story discs to resolve.`, `${count} jogadores. Cartas de história da base precisam de 2 discos para resolver.`);
      } else {
        description = t(`${count} players. Core story cards need 3 story discs to resolve.`, `${count} jogadores. Cartas de história da base precisam de 3 discos para resolver.`);
      }
      if (m.bloodMode) {
        const [rMin, rMax] = MODE_INFO[m.mode].players;
        description += count >= rMin && count <= rMax
          ? t(" Within the mode's recommended count.", " Dentro da quantidade recomendada para o modo.")
          : t(" Outside the mode's recommended count (allowed, not recommended).", " Fora da quantidade recomendada para o modo (permitido, mas não recomendado).");
      }
      if (m.mode === "first") {
        description = count === 3
          ? t("3 players use Annie Oakley, Bass Reeves and Billy the Kid.", "3 jogadores usam Annie Oakley, Bass Reeves e Billy the Kid.")
          : t("4 players add Bloody Knife to those three characters.", "4 jogadores acrescentam Bloody Knife a esses três personagens.");
      }
      playerOptions.push({ value: String(count), title: t(`${count} players`, `${count} jogadores`), description });
    }
    groups.push(radioGroup("players", t("2 · Players", "2 · Jogadores"), t(`${m.players} players${m.mib ? " + Man in Black" : ""}`, `${m.players} jogadores${m.mib ? " + Man in Black" : ""}`), String(m.players), playerOptions,
      m.mode === "first" ? refs(["core", 24]) : refs(["core", 14], ["core", 22], ["faq", 8])));

    // Expansions
    const expansionGroups = [];
    const lockedByMode = (key) => m.mode === "first" || (m.bloodMode && (key === "ante" || key === "blood" || MODE_INFO[m.mode].requires.includes(key)));
    const expansionText = {
      ante: {
        title: "Ante Up",
        yes: t("Adds the Buzzard Gulch board and Gambler/Train board, the Trading Post, the Gambler track, the event deck and event tokens (outlaws, claim jumpers, high rollers, longhorns, gold nuggets), the Train and Train Heists, Mountain Passes, Frontier spaces, faro, the Outlaw Camp and Marshal's Office, 8 characters, 24 items, 32 goal cards and 10 alternate poker cards. Player mats are always flipped to the legendary-token side.", "Adiciona o tabuleiro de Buzzard Gulch e o de Apostador/Trem, o Entreposto Comercial, a trilha de Apostador, o baralho de eventos e as fichas de evento (fora da lei, ladrões de concessão, apostadores, gado longhorn, pepitas), o Trem e os Assaltos ao Trem, Passagens de Montanha, espaços de Fronteira, faro, o Acampamento Fora da Lei e o Escritório do Delegado, 8 personagens, 24 itens, 32 objetivos e 10 cartas de pôquer alternativas. Os tabuleiros de jogador sempre ficam no lado com fichas lendárias."),
        no: t("Play on the original board only.", "Jogue somente no tabuleiro original.")
      },
      blood: {
        title: "Blood Money",
        yes: t("Requires Ante Up. Adds Legendary Stories (Story track, legendary story cards, risk die), injury cards, the Traveling Trader with Legendary items, deeds (claim action), ruins and the repair action, 8 characters, 36 items, 32 goal cards and 6 alternate poker cards. Setup follows the Blood Money order. Its book also contains the five game modes.", "Exige Ante Up. Adiciona Histórias Lendárias (trilha de História, cartas de história lendária, dado de risco), cartas de ferimento grave, o Mercador Viajante com itens Lendários, escrituras (ação de reivindicar), ruínas e a ação de reparar, 8 personagens, 36 itens, 32 objetivos e 6 cartas de pôquer alternativas. A preparação segue a ordem do Blood Money. O livro também traz os cinco modos de jogo."),
        no: t("No Blood Money content.", "Sem conteúdo do Blood Money.")
      },
      fistful: {
        title: "Fistful of Extras",
        yes: t("Shuffles in 6 characters (with 24 goal cards), 24 story cards, 18 items and 2 Jokers into the poker deck; adds a cloth bag for legendary tokens. Unlocks the optional Bandit card variant.", "Embaralha 6 personagens (com 24 objetivos), 24 cartas de história, 18 itens (inclusive o Workhorse) e 2 Coringas no baralho de pôquer; acrescenta um saco de pano para as fichas lendárias. Libera a variante opcional de cartas de bandido."),
        no: t("No Fistful of Extras content.", "Sem conteúdo do Fistful of Extras.")
      },
      gbh: {
        title: "The Good, the Bad and the Handsome",
        yes: t("Shuffles in 3 characters (12 goal cards) and 16 story cards with the new trigger “Initiate a fight with another player” (you contribute even if you lose); some of them reward one of the 12 Legendary items.", "Embaralha 3 personagens (12 objetivos) e 16 cartas de história com o novo gatilho “Inicie uma luta com outro jogador” (você contribui mesmo se perder); algumas dão como recompensa um dos 12 itens Lendários."),
        no: t("No Good, Bad and Handsome content.", "Sem conteúdo do The Good, the Bad and the Handsome.")
      },
      wild: {
        title: "Wild Bunch of Extras",
        yes: t("Adds 22 story cards, 12 items, 8 Legendary items and 11 Man in Black cards (with ruin tokens) to every game; with Ante Up it also adds 4 characters, 8 event cards and 16 unique event tokens, 6 train encounters and 3 frontier tokens. Unlocks the Title card, Gang/Posse and Sheriff deck variants.", "Adiciona 22 cartas de história, 12 itens, 8 itens Lendários e 11 cartas do Man in Black (com fichas de ruína) a qualquer partida; com Ante Up também adiciona 4 personagens, 8 cartas de evento e 16 fichas de evento únicas, 6 encontros de trem e 3 fichas de fronteira. Libera as variantes Carta de título, Gangue/Bando e Baralho de Xerife."),
        no: t("No Wild Bunch of Extras content.", "Sem conteúdo do Wild Bunch of Extras.")
      }
    };
    const expansionRefs = {
      ante: refs(["ante", 2], ["ante", 4]),
      blood: refs(["blood", 1], ["blood", 2]),
      fistful: refs(["fistful", 1]),
      gbh: refs(["gbh", 1]),
      wild: refs(["wild", 1])
    };
    EXPANSIONS.forEach((key) => {
      const info = expansionText[key];
      const title = info.title;
      if (lockedByMode(key)) {
        expansionGroups.push(fixedGroup(title, m[key] ? t("In use", "Em uso") : t("Not used", "Não usada"), m[key]
          ? t(`Required by ${modeTitle(m.mode)}. ${info.yes}`, `Exigida por ${modeTitle(m.mode)}. ${info.yes}`)
          : t("The first game uses only the core box.", "A primeira partida usa somente a caixa base."), expansionRefs[key]));
        return;
      }
      if (key === "blood" && !m.ante) {
        expansionGroups.push(fixedGroup(title, t("Unavailable", "Indisponível"), t("Blood Money requires Ante Up. Choose Ante Up first to enable it.", "Blood Money exige Ante Up. Ative o Ante Up primeiro para liberá-la."), expansionRefs[key]));
        return;
      }
      const extra = m.bloodMode && !lockedByMode(key)
        ? t(" In game modes, this content only adds characters/items named in the mode's lists; skip any you do not own.", " Nos modos de jogo, este conteúdo só acrescenta personagens/itens citados nas listas do modo; pule o que você não tiver.")
        : "";
      expansionGroups.push(yesNo(key, title, m[key], t("Use it", "Usar"), info.yes + extra, t("Do not use", "Não usar"), info.no, expansionRefs[key]));
    });
    groups.push(`<div class="wl-group-block"><h3 class="wl-block-title">${t("3 · Expansions", "3 · Expansões")}</h3><p class="wl-block-intro">${t("Each expansion is an independent Yes/No choice. Their content is shuffled into the matching core decks; the setup checklist below tells you exactly what goes where.", "Cada expansão é uma escolha Sim/Não independente. O conteúdo é embaralhado nos baralhos correspondentes da base; a checklist de preparação abaixo diz exatamente onde vai cada coisa.")}</p><div class="wl-optional-groups">${expansionGroups.join("")}</div></div>`);

    // Story system
    if (m.blood) {
      if (m.mode === "standard") {
        groups.push(radioGroup("story", t("4 · Story system", "4 · Sistema de histórias"), m.legendary ? t("Legendary Stories", "Histórias Lendárias") : t("Core story cards (variant)", "Cartas de história da base (variante)"), m.story, [
          { value: "legendary", title: t("Legendary Stories (Blood Money default)", "Histórias Lendárias (padrão do Blood Money)"), description: t("Replaces the old story system. One legendary story card is in play at a time with 2–3 conditions; each condition is claimed by one player who places a story disc and gains its reward at once. Players earn Story Points on the Story track (from cards, the risk die and some characters); reaching space 4 lets you take 1 GP, LP, MP or WP. Each player has 3 story discs. Uses the risk die and the 3 map tokens.", "Substitui o sistema antigo. Há uma carta de história lendária por vez, com 2–3 condições; cada condição é reivindicada por um jogador, que coloca um disco e recebe a recompensa na hora. Os jogadores ganham Pontos de História na trilha (por cartas, dado de risco e alguns personagens); chegar ao espaço 4 dá 1 GP, LP, MP ou WP à escolha. Cada jogador tem 3 discos. Usa o dado de risco e as 3 fichas de mapa.") },
          { value: "core", title: t("Core story cards (Core Story Card Variant)", "Cartas de história da base (variante)"), description: t("Keep the original two story decks: each card has one trigger and resolves when 2 (2–4 players) or 3 (5–6 players) discs are on it. Blood Money's Legendary Stories system — Story track, legendary story cards and risk die — is left out. Each player has 2 story discs.", "Mantém os dois baralhos de história originais: cada carta tem um gatilho e resolve quando houver 2 (2–4 jogadores) ou 3 (5–6 jogadores) discos. O sistema de Histórias Lendárias do Blood Money — trilha de História, cartas lendárias e dado de risco — fica de fora. Cada jogador tem 2 discos.") }
        ], refs(["blood", 6], ["blood", 7], ["blood", 13])));
      } else {
        groups.push(fixedGroup(t("4 · Story system", "4 · Sistema de histórias"), m.legendary ? t("Legendary Stories", "Histórias Lendárias") : t("Core story cards, filtered", "Cartas de história da base, filtradas"), m.legendary
          ? t("Risky Business uses the standard Blood Money setup, so Legendary Stories, the Story track and the risk die are in play.", "Risky Business usa a preparação padrão do Blood Money, então Histórias Lendárias, trilha de História e dado de risco estão em jogo.")
          : t("This mode uses the Core Story Card Variant with only the story cards whose back shows the trigger(s) listed in the mode setup. The Story track, legendary story cards and risk die are not used.", "Este modo usa a variante de cartas de história da base, apenas com as cartas cujo verso mostra o(s) gatilho(s) da preparação do modo. Trilha de História, cartas lendárias e dado de risco não são usados."), refs(["blood", MODE_INFO[m.mode].setupPage])));
      }
    }

    // Game length
    if (m.mode === "first") {
      groups.push(fixedGroup(t("5 · Game length", "5 · Duração"), "15 LP", t("The first game always ends when a player reaches 15 LP.", "A primeira partida sempre termina quando alguém chega a 15 LP."), refs(["core", 24])));
    } else {
      const rec = m.bloodMode ? MODE_INFO[m.mode].lp : [];
      const lpOption = (lp, en, pt) => ({
        value: String(lp),
        title: `${lp} LP`,
        description: t(en, pt) + (rec.length ? (rec.includes(lp) ? t(" Recommended for this mode.", " Recomendado para este modo.") : t(" Not the mode's recommendation.", " Não é a recomendação do modo.")) : "")
      });
      groups.push(radioGroup("lp", t("5 · Game length", "5 · Duração"), `${m.lp} LP`, String(m.lp), [
        lpOption(15, "Short game: the end is triggered when a player reaches 15 LP.", "Partida curta: o fim é acionado quando alguém chega a 15 LP."),
        lpOption(20, "Average game: the end is triggered at 20 LP.", "Partida média: o fim é acionado em 20 LP."),
        lpOption(25, "Long game: the end is triggered at 25 LP.", "Partida longa: o fim é acionado em 25 LP.")
      ], refs(["core", 6], ["core", 21])));
    }

    // Optional systems
    const opt = [];
    const modeFixed = m.mode !== "standard";
    if (m.mode === "standard") {
      opt.push(yesNo("goals", t("Goal cards", "Cartas de objetivo"), m.goals,
        t("Use goal cards", "Usar objetivos"),
        t("Each player keeps 3 of their character's 4 secret goal cards (1 random card goes back to the box unseen). Completing a goal (on your own turn, no action) earns facedown legendary tokens worth 1–3 LP at the end; you may complete at most 3 goals and keep at most 3 tokens. Mats use the legendary-token side.", "Cada jogador mantém 3 dos 4 objetivos secretos do seu personagem (1 aleatório volta à caixa sem ser visto). Cumprir um objetivo (no seu turno, sem gastar ação) rende fichas lendárias viradas para baixo, valendo 1–3 LP no final; no máximo 3 objetivos cumpridos e 3 fichas guardadas. O tabuleiro de jogador usa o lado com espaço para fichas lendárias."),
        t("No goal cards", "Sem objetivos"),
        t("Goal cards stay in the box." + (m.ante ? " Legendary tokens can still be won from the Gambler track and frontier tokens." : ""), "Os objetivos ficam na caixa." + (m.ante ? " Ainda é possível ganhar fichas lendárias na trilha de Apostador e em fichas de fronteira." : "")),
        refs(["core", 22], ["faq", 9])));
    } else if (m.goals) {
      opt.push(fixedGroup(t("Goal cards", "Cartas de objetivo"), t("In use", "Em uso"), t("Risky Business requires the Goal Cards Variant.", "Risky Business exige a variante de objetivos."), refs(["blood", 21])));
    }
    if ((m.ante || m.blood) && m.mode === "standard") {
      opt.push(yesNo("altPoker", t("Alternate poker cards", "Cartas de pôquer alternativas"), m.altPoker,
        t("Swap them in (recommended)", "Trocar (recomendado)"),
        t(`Replace each base poker card with the expansion card of the same suit and value: ${[m.ante ? "Ante Up's Vendetta, Rumors, Jackpot, Scout and Outfit (10 cards)" : "", m.blood ? "Blood Money's Dead or Alive, Ruthless and Stagecoach (6 cards)" : ""].filter(Boolean).join(" and ")}. Removed base cards go back to the box. The books strongly recommend this.`, `Substitua cada carta de pôquer da base pela carta da expansão de mesmo naipe e valor: ${[m.ante ? "Vendetta, Rumors, Jackpot, Scout e Outfit do Ante Up (10 cartas)" : "", m.blood ? "Dead or Alive, Ruthless e Stagecoach do Blood Money (6 cartas)" : ""].filter(Boolean).join(" e ")}. As cartas base retiradas voltam à caixa. Os livros recomendam fortemente.`),
        t("Keep the base cards", "Manter as cartas base"),
        t("Leave the alternate cards in the box and play with the original 52-card poker deck.", "Deixe as alternativas na caixa e jogue com o baralho de pôquer original de 52 cartas."),
        refs(["ante", 4], ["blood", 3], ["blood", 6])));
    } else if (m.bloodMode) {
      opt.push(fixedGroup(t("Poker deck", "Baralho de pôquer"), t("Base Blood Money poker deck + mode changes", "Baralho base do Blood Money + mudanças do modo"), t("Game modes swap in every alternate poker card from the expansions and the Fistful of Extras Jokers if you own them, then apply the mode's remove/add list.", "Os modos trocam todas as cartas de pôquer alternativas das expansões e usam os Coringas do Fistful of Extras se você tiver, e então aplicam a lista de remover/adicionar do modo."), refs(["blood", 13])));
    }
    if (m.mode === "standard" && m.ante) {
      opt.push(yesNo("highStakes", t("High stakes poker (Ante Up variant)", "Pôquer de apostas altas (variante do Ante Up)"), m.highStakes,
        t("Allow high stakes poker", "Permitir apostas altas"),
        t("Adds a second poker game at Saloons (it does not replace normal poker): $10 ante, a $20 raise to stay after the flop, turn and river cards, and the winner always gains the pot, 1 Gambler point and 1 LP.", "Adiciona um segundo jogo de pôquer nos Saloons (não substitui o normal): aposta inicial de $10, $20 para continuar após o flop, cartas turn e river, e o vencedor sempre ganha o pote, 1 ponto de Apostador e 1 LP."),
        t("Normal poker only", "Somente pôquer normal"),
        t("Saloons offer normal poker, faro and high rollers only.", "Os Saloons oferecem só pôquer normal, faro e apostadores."),
        refs(["ante", 15], ["faq", 6])));
    }
    if (m.mode === "standard" && m.fistful) {
      opt.push(yesNo("bandit", t("Bandit cards (Fistful of Extras variant)", "Cartas de bandido (variante do Fistful of Extras)"), m.bandit,
        t("Use bandit cards", "Usar cartas de bandido"),
        t(`Each of the 6 bandit minis carries its own numbered sticker (1 Gambler, 2 Desperado, 3 Fugitive, 4 Robber, 5 Bandido, 6 Horse Thief). After you enter a bandit's space, reveal the top bandit card and read the entry for that bandit's number: a fight effect, an extra reward, an extra penalty or just a quote (nothing happens). Then fight normally with that effect.${m.wild ? " Wild Bunch adds 2 more bandit cards." : ""} You must apply the stickers first.`, `Cada uma das 6 miniaturas de bandido tem seu adesivo numerado (1 Gambler, 2 Desperado, 3 Fugitive, 4 Robber, 5 Bandido, 6 Horse Thief). Depois de entrar no espaço de um bandido, revele a carta de bandido do topo e leia a entrada do número dele: efeito de luta, recompensa extra, penalidade extra ou só uma frase (nada acontece). Então lute normalmente com esse efeito.${m.wild ? " O Wild Bunch adiciona mais 2 cartas de bandido." : ""} É preciso colar os adesivos antes.`),
        t("Normal bandits", "Bandidos normais"),
        t("Bandit fights follow the core rules only.", "Lutas contra bandidos seguem só as regras da base."),
        refs(["fistful", 2], ["wild", 1], ["faq", 1])));
    }
    if (m.mode === "standard" && m.wild) {
      opt.push(yesNo("title", t("Title card (Wild Bunch variant)", "Carta de título (variante do Wild Bunch)"), m.title,
        t("Reveal a title card", "Revelar uma carta de título"),
        t("During setup shuffle the 12 title cards and reveal 1; it adds or changes one or two rules for the whole game (for example, Shootist gives 1 LP for each fight won against another player). If it conflicts with the rulebook, the title card wins.", "Na preparação embaralhe as 12 cartas de título e revele 1; ela adiciona ou altera uma ou duas regras pela partida toda (por exemplo, Shootist dá 1 LP por luta vencida contra outro jogador). Se conflitar com o livro, vale a carta."),
        t("No title card", "Sem carta de título"),
        t("Title cards stay in the box.", "As cartas de título ficam na caixa."),
        refs(["wild", 2], ["faq", 3])));
      opt.push(yesNo("gang", t("Gang/Posse cards (Wild Bunch variant)", "Cartas de Gangue/Bando (variante do Wild Bunch)"), m.gang,
        t("Use gangs and posses", "Usar gangues e bandos"),
        t("Adds the recruit action: a Marshal pays $20 at the Sheriff's or Marshal's Office for a posse card; a Wanted player pays $20 at the Outlaw Camp for a gang card. The double-sided card sits next to your mat and its printed text helps you (for example extra poker cards at the start of certain fights, or cancelling wounds and discarding it when you would lose a fight). Never more than 1 posse/gang card per player." + (m.ante ? "" : " Without Ante Up there is no Outlaw Camp, so only posses can be recruited."), "Adiciona a ação de recrutar: um Delegado paga $20 no Escritório do Xerife ou do Delegado por uma carta de bando; um Procurado paga $20 no Acampamento Fora da Lei por uma carta de gangue. A carta dupla-face fica ao lado do seu tabuleiro e o texto impresso ajuda você (por exemplo cartas de pôquer extras no início de certas lutas, ou cancelar ferimentos e descartá-la quando você perderia uma luta). Nunca mais de 1 carta de bando/gangue por jogador." + (m.ante ? "" : " Sem Ante Up não existe Acampamento Fora da Lei, então só é possível recrutar bandos.")),
        t("No gangs or posses", "Sem gangues ou bandos"),
        t("The recruit action is not available.", "A ação de recrutar não existe."),
        refs(["wild", 2], ["faq", 2])));
      opt.push(yesNo("sheriffDeck", t("Sheriff deck (Wild Bunch variant)", "Baralho de Xerife (variante do Wild Bunch)"), m.sheriffDeck,
        t("Use the Sheriff deck", "Usar o baralho de Xerife"),
        t("Reveal 1 of 6 sheriff personality cards; it changes how the Sheriff behaves. When the Sheriff loses a fight, discard it and reveal a new one. Arrests still give 1 wound and remove all Wanted points.", "Revele 1 de 6 cartas de personalidade do Xerife; ela muda o comportamento dele. Quando o Xerife perde uma luta, descarte e revele outra. Prisões continuam dando 1 ferimento e zerando os pontos de Procurado."),
        t("Standard Sheriff", "Xerife padrão"),
        t("The Sheriff follows the core rules only.", "O Xerife segue só as regras da base."),
        refs(["wild", 3])));
    } else if (m.gang) {
      opt.push(fixedGroup(t("Gang/Posse cards", "Cartas de Gangue/Bando"), t("In use", "Em uso"), t("Law and Disorder includes the Wild Bunch Gang/Posse variant in its setup.", "Law and Disorder inclui a variante de Gangue/Bando do Wild Bunch na preparação."), refs(["blood", 19], ["wild", 2])));
    }
    if (modeFixed) {
      opt.push(`<p class="wl-option-note">${m.mode === "first"
        ? t("The first game uses no variants.", "A primeira partida não usa variantes.")
        : t("Game modes say: “Unless otherwise noted, variants should not be used with the game modes.” Only the variants the mode names are active.", "Os modos dizem: “Salvo indicação, variantes não devem ser usadas nos modos de jogo.” Só as variantes citadas pelo modo ficam ativas.")} ${m.mode === "first" ? ref("core", 24) : ref("blood", 13)}</p>`);
    }
    if (!opt.length) {
      opt.push(`<p class="wl-option-note">${t("No optional systems are available with these expansions.", "Nenhum sistema opcional está disponível com estas expansões.")}</p>`);
    }
    groups.push(`<div class="wl-group-block"><h3 class="wl-block-title">${t("6 · Optional systems", "6 · Sistemas opcionais")}</h3><p class="wl-block-intro">${t("Only systems compatible with the mode and expansions above are shown. Each one is independent.", "Só aparecem sistemas compatíveis com o modo e as expansões acima. Cada um é independente.")}</p><div class="wl-optional-groups">${opt.join("")}</div></div>`);

    const warnings = [];
    if (m.bloodMode) {
      const [rMin, rMax] = MODE_INFO[m.mode].players;
      if (m.players < rMin || m.players > rMax) {
        warnings.push(t(`${modeTitle(m.mode)} recommends ${rMin}–${rMax} players.`, `${modeTitle(m.mode)} recomenda ${rMin}–${rMax} jogadores.`));
      }
      if (!MODE_INFO[m.mode].lp.includes(m.lp)) {
        warnings.push(t(`Recommended length: ${MODE_INFO[m.mode].lp.join(" or ")} LP.`, `Duração recomendada: ${MODE_INFO[m.mode].lp.join(" ou ")} LP.`));
      }
    }
    return `
      <section class="controls-panel wl-config" aria-labelledby="configure-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="configure-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t("Choose the game mode first; it unlocks or fixes the other choices. Everything below — setup, turn rules, scoring, icons — is filtered to this match. Changes here clear only the setup checklist.", "Escolha primeiro o modo de jogo; ele libera ou fixa as demais escolhas. Tudo abaixo — preparação, regras do turno, pontuação, ícones — é filtrado para esta partida. Alterações aqui limpam somente a checklist de preparação.")}</p>
          </div>
          <span class="saved-label">${t("Saved per game", "Salvo por jogo")}</span>
        </div>
        ${groups.join("")}
        ${adjustNotices.length ? `<div class="wl-adjust" role="status">${adjustNotices.map((text) => `<p>${text}</p>`).join("")}</div>` : ""}
        <p class="wl-config-status" role="status">${t("Configuration complete — the guide below matches these choices.", "Configuração completa — o guia abaixo corresponde a estas escolhas.")}${warnings.length ? ` <span class="wl-warning">${warnings.join(" ")}</span>` : ""}</p>
      </section>`;
  }

  // --- Setup -------------------------------------------------------------

  const MODE_STORES = {
    serenade: {
      store: ["Revolver", "Rifle", "Shotgun", "Bedroll", "Provisions", "Holster", "Derringer", "Mustang", "Peacekeeper", "Burro", "Snake Oil", "Gazette"],
      post: ["Boot Knife", "Repeating Shotgun", "Whiskey", "Quarter Horse", "Miner's Map", "Medicine Pouch"],
      trader: null,
      legendary: ["Bandolier", "Bowie Knife", "Canteen", "Dragoons", "Dynamite", "Marshal's Badge", "Saber", "Serape", "Short Cut", "Shot Glass", "Spyglass", "Tomahawk"]
    },
    golden: {
      store: ["Bullwhip", "Derringer", "Gazette", "Mule", "Mustang", "Pocket Watch", "Revolver", "Saddle Bags", "Snake Oil", "Ten-Gallon", "Whiskey", "Workhorse"],
      post: ["Burro", "Miner's Map", "Peacekeeper", "Provisions", "Quarter Horse", "Shotgun"],
      trader: ["Bedroll", "Boot Knife", "Carbine", "Holster", "Medicine Pouch", "Rifle", "Repeating Shotgun"],
      legendary: ["Bandolier", "Black Coat", "Canteen", "Cattle Brand", "Lasso", "Lucky Coin", "Marked Cards", "Marshal's Badge", "Mesa Deed", "Molasses", "Portrait", "Shot Glass", "Short Cut", "Silver Flask", "Snakeskin Boots", "Spurs", "Telegram", "Treasure Map"]
    },
    law: {
      store: ["Boot Knife", "Holster", "Medicine Pouch", "Peacekeeper", "Pocket Watch", "Provisions", "Quarter Horse", "Revolver", "Saddle Bags", "Shotgun", "Snake Oil", "Whiskey"],
      post: ["Bedroll", "Bullwhip", "Burro", "Gazette", "Mustang", "Repeating Shotgun"],
      trader: ["Carbine", "Derringer", "Miner's Map", "Mule", "Rifle", "Ten-Gallon", "Workhorse"],
      legendary: ["Bandolier", "Black Coat", "Bowie Knife", "Canteen", "Dragoons", "Dynamite", "Lightning", "Marshal's Badge", "Outlaw's Mask", "Portrait", "Saber", "Serape", "Short Cut", "Shot Glass", "Silver Flask", "Snakeskin Boots", "Spurs", "Telegram", "Thunder", "Tomahawk"]
    },
    risky: {
      store: ["Boot Knife", "Bullwhip", "Pocket Watch", "Provisions", "Quarter Horse", "Revolver", "Repeating Shotgun", "Rifle", "Saddle Bags", "Shotgun", "Ten-Gallon", "Whiskey"],
      post: ["Bedroll", "Burro", "Gazette", "Medicine Pouch", "Mustang", "Peacekeeper"],
      trader: ["Carbine", "Derringer", "Holster", "Miner's Map", "Mule", "Snake Oil", "Workhorse"],
      legendaryExcept: ["Cattle Brand", "Companion", "Lasso", "Lightning"]
    },
    border: {
      combined: ["Bedroll", "Boot Knife", "Bullwhip", "Burro", "Derringer", "Gazette", "Holster", "Medicine Pouch", "Mustang", "Provisions", "Repeating Shotgun", "Revolver", "Shotgun", "Rifle", "Snake Oil", "Ten-Gallon", "Whiskey", "Workhorse"],
      trader: null,
      legendaryExcept: ["Fiddle", "Short Cut", "Dime Western", "Pump Trolley"]
    }
  };

  const MODE_CHARACTERS = {
    serenade: ["Elfego Baca", "Bass Reeves", "Annie Oakley", "Kit Carson", "Johnny Ringo", "“Doc” Holliday", "Allan Pinkerton", "Dave Rudabaugh", "Butch Cassidy", "Joaquin Murrietta", "William “Curly Bill” Brocius", "Jesse James"],
    golden: ["Al Swearengen", "Ben Hodges", "Buffalo Bill Cody", "“Doc” Holliday", "Fee Lee Wong", "Isom Dart", "Maria Gertrudis Barcelo", "Poker Alice", "“Soapy” Smith", "“Stagecoach” Mary Fields", "“Texas” John Slaughter", "Wild Bill Hickok"],
    law: ["Ada Curnutt", "Bass Reeves", "Ben Hodges", "Billy the Kid", "Butch Cassidy", "Dave Rudabaugh", "Elfego Baca", "Jesse James", "Judge Roy Bean", "Lozen", "Pat Garrett", "Seth Bullock", "Sundance Kid", "“Texas” John Slaughter", "Tiburcio Vasquez", "William “Curly Bill” Brocius", "Wyatt Earp"],
    risky: ["Allan Pinkerton", "Bat Masterson", "Ben Hodges", "Bloody Knife", "Buckshot Roberts", "Calamity Jane", "Charley Parkhurst", "“Doc” Holliday", "Elfego Baca", "James “Bloody Arm” Beckwourth", "Johnny Ringo", "Lottie Deno", "Maria Gertrudis Barcelo", "“Stagecoach Mary” Fields", "“Texas” John Slaughter", "Wild Bill Hickok"]
  };

  const FIRST_GAME_STORIES = ["The Wild Wild West", "Dead or Alive", "The Pinkertons", "Local Rabble", "Fortune Favors the Bold", "The Cruel Wastes", "Bloody Money", "High Noon", "Rub Some Dirt In It", "The Law", "Tribes of the Mesa", "Cheap Horse", "Ghost Mine", "Snake Oil Salesman", "The Widow", "Spit-shined and Proper", "The Preacher", "Tools of the Trade", "The Sheriff of Darkrock", "Harsh Times"];

  function names(listOfNames) {
    return listOfNames.join(", ");
  }

  function storyTriggers(mode) {
    return {
      serenade: [t("“Initiate a fight with another player”", "“Inicie uma luta com outro jogador”")],
      golden: [t("“Spend $80 or more in a town with a single action”", "“Gaste $80 ou mais numa cidade com uma única ação”")],
      law: [t("“Initiate a fight with another player”", "“Inicie uma luta com outro jogador”"), t("“Gain any number of Marshal or Wanted points”", "“Ganhe qualquer quantidade de pontos de Delegado ou Procurado”")],
      border: [t("“Initiate a fight with another player”", "“Inicie uma luta com outro jogador”"), t("“End your move in a space with an event token or frontier token”", "“Termine seu movimento num espaço com ficha de evento ou ficha de fronteira”")]
    }[mode] || [];
  }

  function storyPoolLines(m) {
    const lines = [t("Core box: 40 story cards.", "Caixa base: 40 cartas de história.")];
    if (m.fistful) {
      lines.push(t("Fistful of Extras: 24 story cards.", "Fistful of Extras: 24 cartas de história."));
    }
    if (m.gbh) {
      lines.push(t("The Good, the Bad and the Handsome: 16 story cards (trigger “Initiate a fight with another player”).", "The Good, the Bad and the Handsome: 16 cartas (gatilho “Inicie uma luta com outro jogador”)."));
    }
    if (m.wild) {
      lines.push(m.ante
        ? t("Wild Bunch of Extras: 22 story cards.", "Wild Bunch of Extras: 22 cartas de história.")
        : t("Wild Bunch of Extras: only the 5 cards whose trigger also exists in earlier products. Leave out the cards with “End your move in a space with an event or frontier token” (they need Ante Up) and the card “History Repeats Itself”.", "Wild Bunch of Extras: só as 5 cartas cujo gatilho já existe em produtos anteriores. Deixe de fora as cartas com “Termine seu movimento num espaço com ficha de evento ou de fronteira” (exigem Ante Up) e a carta “History Repeats Itself”."));
    }
    return lines;
  }

  function characterPoolLine(m) {
    const parts = [t("12 core", "12 da base")];
    if (m.ante) {
      parts.push(t("8 Ante Up", "8 do Ante Up"));
    }
    if (m.blood) {
      parts.push(t("8 Blood Money", "8 do Blood Money"));
    }
    if (m.fistful) {
      parts.push(t("6 Fistful of Extras", "6 do Fistful of Extras"));
    }
    if (m.gbh) {
      parts.push(t("3 The Good, the Bad and the Handsome", "3 do The Good, the Bad and the Handsome"));
    }
    if (m.wild && m.ante) {
      parts.push(t("4 Wild Bunch of Extras", "4 do Wild Bunch of Extras"));
    }
    return t(`Character pool: ${parts.join(" + ")}.`, `Personagens disponíveis: ${parts.join(" + ")}.`);
  }

  function legendaryItemsSource(m) {
    const sources = [];
    if (m.gbh) {
      sources.push(t("12 from The Good, the Bad and the Handsome", "12 do The Good, the Bad and the Handsome"));
    }
    if (m.wild) {
      sources.push(t("8 from Wild Bunch of Extras", "8 do Wild Bunch of Extras"));
    }
    if (m.blood) {
      sources.push(t("the Blood Money Legendary items", "os itens Lendários do Blood Money"));
    }
    return sources.join(", ");
  }

  function pokerAltLine(m) {
    const cards = [];
    if (m.ante) {
      cards.push(t("Ante Up: Vendetta, Rumors, Jackpot, Scout, Outfit (2 copies each)", "Ante Up: Vendetta, Rumors, Jackpot, Scout, Outfit (2 cópias de cada)"));
    }
    if (m.blood) {
      cards.push(t("Blood Money: Dead or Alive, Ruthless, Stagecoach (2 copies each)", "Blood Money: Dead or Alive, Ruthless, Stagecoach (2 cópias de cada)"));
    }
    return cards.join("; ");
  }

  function modePokerLines(mode) {
    const swap = (removeEn, removePt, addEn, addPt) => t(`Remove both ${removeEn} cards and put back the two base ${addEn} cards of the same suits.`, `Retire as duas cartas ${removePt} e devolva as duas cartas base ${addPt} dos mesmos naipes.`);
    return {
      serenade: [swap("Rumors (7)", "Rumors (7)", "Reputation (7)", "Reputation (7)"), swap("Scout (8)", "Scout (8)", "Wallop (8)", "Wallop (8)"), swap("Jackpot (9)", "Jackpot (9)", "Instincts (9)", "Instincts (9)")],
      golden: [swap("Dead or Alive (4)", "Dead or Alive (4)", "Manhunt (4)", "Manhunt (4)"), swap("Vendetta (5)", "Vendetta (5)", "Payday (5)", "Payday (5)"), swap("Scout (8)", "Scout (8)", "Wallop (8)", "Wallop (8)"), swap("Outfit (10)", "Outfit (10)", "Fool's Gold (10)", "Fool's Gold (10)")],
      law: [swap("Rumors (7)", "Rumors (7)", "Reputation (7)", "Reputation (7)"), swap("Jackpot (9)", "Jackpot (9)", "Instincts (9)", "Instincts (9)")]
    }[mode] || [];
  }

  function itemsStep(m) {
    const legendary = legendaryItemsSource(m);
    const lines = [];
    if (m.mode === "first") {
      lines.push(t("Put every core item card in the General Store stand, except Whiskey, Ten-Gallon and Miner's Map: return those three to the box.", "Coloque todas as cartas de item da base no expositor do Armazém, exceto Whiskey, Ten-Gallon e Miner's Map: devolva essas três à caixa."));
      return { id: "items", title: t("Stock the General Store", "Abasteça o Armazém"), lines };
    }
    if (m.bloodMode) {
      const s = MODE_STORES[m.mode];
      lines.push(t("Assemble the store stands. Use only the items listed; return every other item to the box. Each item name means all copies of that card.", "Monte os expositores. Use somente os itens listados; devolva todos os outros à caixa. Cada nome de item significa todas as cópias daquela carta."));
      if (s.combined) {
        lines.push(t(`General Store and Trading Post (both are one store for purchases): ${names(s.combined)}.`, `Armazém e Entreposto (contam como uma só loja para compras): ${names(s.combined)}.`));
      } else {
        lines.push(t(`General Store: ${names(s.store)}.`, `Armazém (General Store): ${names(s.store)}.`));
        lines.push(t(`Trading Post: ${names(s.post)}.`, `Entreposto (Trading Post): ${names(s.post)}.`));
      }
      if (s.trader) {
        lines.push(t(`Traveling Trader (the 2 item spaces): ${names(s.trader)}.`, `Mercador Viajante (os 2 espaços de item): ${names(s.trader)}.`));
      } else {
        lines.push(t("The Traveling Trader is not used: leave its stand, cart token and movement deck in the box.", "O Mercador Viajante não é usado: deixe expositor, carroça e baralho de movimento na caixa."));
      }
      if (s.legendary) {
        lines.push(t(`Legendary item deck: ${names(s.legendary)}.`, `Baralho de itens Lendários: ${names(s.legendary)}.`));
      } else {
        lines.push(t(`Legendary item deck: every Legendary item except ${names(s.legendaryExcept)}.`, `Baralho de itens Lendários: todos os itens Lendários exceto ${names(s.legendaryExcept)}.`));
      }
      lines.push(s.trader
        ? t("Shuffle the Legendary item deck, put the blocker card at its bottom and place it in the top-left section of the Traveling Trader stand, back facing out. Reveal 3 into the 3 bottom-row spaces.", "Embaralhe o baralho Lendário, ponha a carta bloqueadora embaixo e coloque-o na seção superior esquerda do expositor do Mercador, com o verso para fora. Revele 3 nos 3 espaços da fileira de baixo.")
        : t("Shuffle the Legendary item deck facedown near the board. Legendary items cannot be purchased in this mode; they are only gained through card effects (draw from this deck).", "Embaralhe o baralho Lendário virado para baixo perto do tabuleiro. Itens Lendários não podem ser comprados neste modo; só são ganhos por efeitos de cartas (compre deste baralho)."));
      lines.push(t("If you do not own some listed item, simply skip it.", "Se você não tiver algum item listado, apenas pule-o."));
      return { id: "items", title: t("Stock the stores for this mode", "Abasteça as lojas deste modo"), lines };
    }
    if (m.blood) {
      lines.push(t("Assemble the General Store, Trading Post and Traveling Trader stands.", "Monte os expositores do Armazém, do Entreposto e do Mercador Viajante."));
      lines.push(t(`Shuffle all Legendary items together (${legendary}) to form the Legendary item deck. Put the blocker card at its bottom and place the deck in the top-left section of the Traveling Trader stand with the back facing out.`, `Embaralhe todos os itens Lendários (${legendary}) formando o baralho Lendário. Ponha a carta bloqueadora embaixo e coloque o baralho na seção superior esquerda do expositor do Mercador, com o verso para fora.`));
      lines.push(t("Draw 3 Legendary items and place 1 in each of the 3 bottom-row spaces of the Traveling Trader stand.", "Compre 3 itens Lendários e coloque 1 em cada um dos 3 espaços da fileira de baixo do expositor do Mercador."));
      lines.push(t("Randomly select 1 weapon type and 1 mount type and place all copies in the General Store. Then do the same for the Trading Post.", "Sorteie 1 tipo de arma e 1 tipo de montaria e coloque todas as cópias no Armazém. Depois faça o mesmo para o Entreposto."));
      lines.push(t("One type at a time, randomly select items and place all copies in the General Store and Trading Post until no empty space remains.", "Um tipo por vez, sorteie itens e coloque todas as cópias no Armazém e no Entreposto até não sobrar espaço vazio."));
      lines.push(t("Place every remaining item in the 2 empty item spaces of the Traveling Trader stand (one space may hold several items).", "Coloque todos os itens restantes nos 2 espaços de item vazios do expositor do Mercador (um espaço pode ter vários itens)."));
      return { id: "items", title: t("Stock the stores and the Traveling Trader", "Abasteça as lojas e o Mercador Viajante"), lines };
    }
    const extra = [m.fistful ? t("Fistful of Extras' 18 items", "os 18 itens do Fistful of Extras") : "", m.wild ? t("Wild Bunch's 12 items", "os 12 itens do Wild Bunch") : ""].filter(Boolean).join(t(" and ", " e "));
    if (m.ante) {
      lines.push(t("Place the General Store and Trading Post stands within reach of all players.", "Coloque os expositores do Armazém e do Entreposto ao alcance de todos."));
      lines.push(t(`Count how many different items (card types) you are using: core + Ante Up's 24 cards${extra ? ` + ${extra}` : ""}.`, `Conte quantos itens diferentes (tipos de carta) você vai usar: base + 24 cartas do Ante Up${extra ? ` + ${extra}` : ""}.`));
      lines.push(t("Trading Post: randomly place 1 weapon and 1 mount, then add miscellaneous items by that total: 13–14 items → 2 miscellaneous; 15–17 → 3; 18 or more → 4.", "Entreposto: sorteie e coloque 1 arma e 1 montaria, depois acrescente itens diversos conforme o total: 13–14 itens → 2 diversos; 15–17 → 3; 18 ou mais → 4."));
      lines.push(t("Put all remaining items in the General Store stand.", "Coloque todos os itens restantes no expositor do Armazém."));
    } else {
      lines.push(t(`Put all item cards in the General Store stand${extra ? ` (including ${extra})` : ""}.`, `Coloque todas as cartas de item no expositor do Armazém${extra ? ` (incluindo ${extra})` : ""}.`));
    }
    if (m.gbh || m.wild) {
      lines.push(t(`Legendary items (${legendary}): if the stand(s) still have an open space, place them there facedown, card backs facing the players; if every space is full, shuffle them together and place them facedown beside the board. Whenever an effect gives a Legendary item, draw one from that facedown pile.`, `Itens Lendários (${legendary}): se o(s) expositor(es) ainda tiver(em) espaço livre, coloque-os ali virados para baixo, com o verso para os jogadores; se todos os espaços estiverem cheios, embaralhe-os e deixe-os virados para baixo ao lado do tabuleiro. Sempre que um efeito der um item Lendário, compre um dessa pilha.`));
    }
    return { id: "items", title: m.ante ? t("Stock the General Store and Trading Post", "Abasteça o Armazém e o Entreposto") : t("Stock the General Store", "Abasteça o Armazém"), lines };
  }

  function pokerStep(m) {
    const lines = [];
    if (m.bloodMode) {
      lines.push(t(`Build the Base Blood Money poker deck: exchange every base poker card with the alternate card of the same suit and value (${pokerAltLine(m)}); return the removed base cards to the box.`, `Monte o baralho base do Blood Money: troque cada carta de pôquer base pela alternativa de mesmo naipe e valor (${pokerAltLine(m)}); devolva as cartas base retiradas à caixa.`));
      if (m.fistful) {
        lines.push(t("Shuffle in the 2 Fistful of Extras Jokers.", "Embaralhe os 2 Coringas do Fistful of Extras."));
      }
      modePokerLines(m.mode).forEach((line) => lines.push(line));
    } else if (m.altPoker) {
      lines.push(t(`Exchange each base poker card with the alternate card of the same suit and value (${pokerAltLine(m)}). Return the removed base cards to the box.`, `Troque cada carta de pôquer base pela alternativa de mesmo naipe e valor (${pokerAltLine(m)}). Devolva as cartas base retiradas à caixa.`));
    } else if (m.ante) {
      lines.push(t("Return the alternate expansion poker cards to the box.", "Devolva as cartas de pôquer alternativas das expansões à caixa."));
    }
    if (m.fistful && !m.bloodMode) {
      lines.push(t("Shuffle in the 2 Fistful of Extras Jokers.", "Embaralhe os 2 Coringas do Fistful of Extras."));
    }
    lines.push(t("Shuffle the poker deck and place it facedown in its board space. Discarded poker cards go faceup in a pile to the right of the deck.", "Embaralhe o baralho de pôquer e coloque-o virado para baixo no seu espaço. Cartas descartadas ficam viradas para cima numa pilha à direita do baralho."));
    return { id: "poker", title: t("Prepare the poker deck", "Prepare o baralho de pôquer"), lines };
  }

  function storyStep(m) {
    const lines = [];
    if (m.legendary) {
      lines.push(t("Shuffle the 40 legendary story cards, then split them into 2 decks that each contain one card of every number 1–20. Choose 1 deck and return the other to the box unseen.", "Embaralhe as 40 cartas de história lendária e separe 2 baralhos, cada um com uma carta de cada número 1–20. Escolha 1 baralho e devolva o outro à caixa sem olhar."));
      lines.push(t("Shuffle the chosen deck and place it facedown on the story board overlay. Put the 3 map tokens and the ruin tokens near the board.", "Embaralhe o baralho escolhido e coloque-o virado para baixo na sobreposição de histórias. Deixe as 3 fichas de mapa e as fichas de ruína perto do tabuleiro."));
      lines.push(t("When the game begins, the first player reveals the top card, reads its story text aloud and applies its rules text (a legendary story card is always in play).", "Quando a partida começar, o primeiro jogador revela a carta do topo, lê o texto da história em voz alta e aplica o texto de regras (sempre há uma carta de história lendária em jogo)."));
      lines.push(t("Return every other story card to the box: the core decks and any expansion story cards with a trigger on the back. Legendary Stories does not use them.", "Devolva todas as outras cartas de história à caixa: os baralhos da base e quaisquer cartas de expansão com gatilho no verso. Histórias Lendárias não as usam."));
      return { id: "story", title: t("Prepare the legendary story deck", "Prepare o baralho de histórias lendárias"), lines };
    }
    if (m.mode === "first") {
      lines.push(t(`Use only these 20 story cards, shuffled into a single facedown deck: ${names(FIRST_GAME_STORIES)}.`, `Use somente estas 20 cartas de história, embaralhadas num único baralho virado para baixo: ${names(FIRST_GAME_STORIES)}.`));
      lines.push(t("Return every other story card to the box.", "Devolva todas as outras cartas de história à caixa."));
      return { id: "story", title: t("Prepare the story deck", "Prepare o baralho de histórias"), lines };
    }
    if (m.bloodMode) {
      lines.push(t(`Gather every story card you own and keep only those whose back shows ${storyTriggers(m.mode).join(t(" or ", " ou "))}. Return the rest to the box.`, `Reúna todas as cartas de história que você tiver e mantenha só as que mostram no verso ${storyTriggers(m.mode).join(t(" ou ", " ou "))}. Devolva o resto à caixa.`));
    } else {
      lines.push(t("Shuffle together the story cards from:", "Embaralhe juntas as cartas de história de:"));
      storyPoolLines(m).forEach((line) => lines.push(`• ${line}`));
    }
    lines.push(t("Place them facedown in two roughly even decks on the two story card spaces of the board. The top card of each deck shows its trigger on its back.", "Coloque-as viradas para baixo em dois baralhos de tamanho parecido nos dois espaços de história do tabuleiro. A carta do topo de cada baralho mostra o gatilho no verso."));
    if (m.blood) {
      lines.push(t("Do not use the story board overlay, the legendary story cards, the Story track or the risk die. (Interpretation: the Core Story Card Variant keeps the base system, so the overlay that holds the Story track stays in the box.)", "Não use a sobreposição de histórias, as cartas lendárias, a trilha de História nem o dado de risco. (Interpretação: a variante de histórias da base mantém o sistema original, então a sobreposição que contém a trilha de História fica na caixa.)"));
    }
    return { id: "story", title: t("Prepare the two story decks", "Prepare os dois baralhos de histórias"), lines };
  }

  function charactersStep(m) {
    const lines = [];
    if (m.mode === "first") {
      lines.push(m.players === 3
        ? t("Each player chooses one of: Annie Oakley, Bass Reeves, Billy the Kid.", "Cada jogador escolhe um entre: Annie Oakley, Bass Reeves, Billy the Kid.")
        : t("Each player chooses one of: Annie Oakley, Bass Reeves, Billy the Kid, Bloody Knife.", "Cada jogador escolhe um entre: Annie Oakley, Bass Reeves, Billy the Kid, Bloody Knife."));
    } else {
      if (MODE_CHARACTERS[m.mode]) {
        lines.push(t(`Character pool for this mode: ${names(MODE_CHARACTERS[m.mode])}. Skip any you do not own.`, `Personagens deste modo: ${names(MODE_CHARACTERS[m.mode])}. Pule os que você não tiver.`));
      } else if (m.border) {
        lines.push(t("Character pool: every character you own except Al Swearengen, Bloody Knife, Buffalo Bill Cody, Charley Parkhurst, James “Bloody Arm” Beckwourth, Kit Carson, Lottie Deno and Tom Tobin.", "Personagens: todos os que você tiver, exceto Al Swearengen, Bloody Knife, Buffalo Bill Cody, Charley Parkhurst, James “Bloody Arm” Beckwourth, Kit Carson, Lottie Deno e Tom Tobin."));
      } else {
        lines.push(characterPoolLine(m));
      }
      lines.push(t("Shuffle the pool, deal 2 to each player; each chooses 1 and returns the other to the box.", "Embaralhe, dê 2 a cada jogador; cada um escolhe 1 e devolve o outro à caixa."));
    }
    lines.push(t("Each player gains every starting bonus printed on the back of their character card: items (placed in the mount/weapon/miscellaneous areas of the mat), money, poker cards" + (m.ante ? ", Gambler points" : "") + (m.blood ? ", Legendary points" : "") + (m.legendary ? ", Story points" : "") + " and Marshal or Wanted points. Place a cube on the matching space of each track where you start with points; when the card says “do not gain rewards” (as Billy the Kid's does), skip the rewards printed on those track spaces." + (m.legendary ? "" : " If the card lists Story points, ignore them: this match has no Story track."), "Cada jogador recebe todos os bônus iniciais impressos no verso do personagem: itens (nas áreas de montaria/arma/diversos do tabuleiro), dinheiro, cartas de pôquer" + (m.ante ? ", pontos de Apostador" : "") + (m.blood ? ", pontos de Lenda" : "") + (m.legendary ? ", pontos de História" : "") + " e pontos de Delegado ou Procurado. Coloque um cubo no espaço correspondente de cada trilha onde você começa com pontos; quando o cartão diz “do not gain rewards” (como o de Billy the Kid), ignore as recompensas impressas nesses espaços." + (m.legendary ? "" : " Se a carta listar pontos de História, ignore-os: esta partida não tem trilha de História.")));
    if (!m.goals) {
      lines.push(t("Goal cards are not used in this match. Leave every goal card in the box.", "Objetivos não são usados nesta partida. Deixe todas as cartas de objetivo na caixa."));
    }
    lines.push(t("Starting items count as gained: if an item gives something when you gain it, you get it now.", "Itens iniciais contam como ganhos: se um item dá algo ao ser ganho, você recebe agora.") + " " + ref("faq", 10));
    return { id: "characters", title: t("Choose characters and take starting bonuses", "Escolha personagens e receba os bônus iniciais"), lines };
  }

  function playerKitStep(m) {
    const cubes = 2 + (m.ante ? 1 : 0) + (m.legendary ? 1 : 0) + (m.border ? 1 : 0);
    const lines = [
      t(`Each player takes a player mat, a ring of their color, ${cubes} scoring cubes${m.border ? " (one of them will be the homestead marker)" : ""}, ${m.storyDiscsEach} story discs${m.ante ? ", 2 faro bet markers" : ""} and a wound token.`, `Cada jogador pega um tabuleiro de jogador, um anel da sua cor, ${cubes} cubos de pontuação${m.border ? " (um deles será o marcador de propriedade)" : ""}, ${m.storyDiscsEach} discos de história${m.ante ? ", 2 marcadores de aposta de faro" : ""} e uma ficha de ferimento.`),
      m.ante || m.goals
        ? t("Use the side of the player mat with spaces for legendary tokens (above the character card).", "Use o lado do tabuleiro de jogador com espaços para fichas lendárias (acima do personagem).")
        : t("Use the side of the player mat without spaces for legendary tokens.", "Use o lado do tabuleiro de jogador sem espaços para fichas lendárias."),
      t("Place 1 cube to the left of space 1 of the Legendary Point (LP) track.", "Coloque 1 cubo à esquerda do espaço 1 da trilha de Pontos de Lenda (LP).")
    ];
    if (m.legendary) {
      lines.push(t("Place 1 cube on the start space (space 1) of the Story track on the overlay.", "Coloque 1 cubo no espaço inicial (espaço 1) da trilha de História na sobreposição."));
    }
    if (m.ante) {
      lines.push(t("Keep 1 cube next to the Gambler track (it enters the track when you gain your first Gambler point).", "Deixe 1 cubo ao lado da trilha de Apostador (ele entra quando você ganhar o primeiro ponto de Apostador)."));
    }
      lines.push(t("Keep 1 cube beside the board for the Marshal or Wanted track, and the story discs to the left of the board.", "Deixe 1 cubo ao lado do tabuleiro para a trilha de Delegado ou Procurado, e os discos de história à esquerda do tabuleiro."));
    if (m.border) {
      lines.push(t("Set 1 cube aside near your mat as your homestead marker.", "Separe 1 cubo perto do seu tabuleiro como marcador de propriedade."));
    }
    lines.push(t("Each player selects any free mini (minis are not tied to characters) and attaches their ring.", "Cada jogador escolhe qualquer miniatura livre (miniaturas não são ligadas a personagens) e encaixa seu anel."));
    lines.push(t("Place the wound token on the starting crosshair space of the wound track; characters that start with wounds move it accordingly.", "Coloque a ficha de ferimento na mira inicial da trilha de ferimentos; personagens que começam com ferimentos a avançam."));
    return { id: "players", title: t("Hand out player components", "Distribua os componentes dos jogadores"), lines };
  }

  function placementStep(m) {
    const lines = [
      m.mode === "first"
        ? t("Billy the Kid takes the first player token (he starts with the most Wanted points).", "Billy the Kid pega o marcador de primeiro jogador (ele começa com mais pontos de Procurado).")
        : t("The player with the most Wanted points takes the first player token; if tied or nobody is Wanted, choose another way. It is highly recommended that Wanted players sit next to each other in clockwise order. The first player never changes.", "O jogador com mais pontos de Procurado pega o marcador de primeiro jogador; em caso de empate ou sem Procurados, decidam de outra forma. É muito recomendado que Procurados se sentem lado a lado em sentido horário. O primeiro jogador nunca muda.")
    ];
    if (m.border) {
      lines.push(t("Ignore the Starting Location printed on characters. After turn order is set, players (in turn order — interpretation) each place their mini on any unoccupied space of the Buzzard Gulch board.", "Ignore o Local Inicial impresso nos personagens. Depois de definida a ordem, os jogadores (em ordem de turno — interpretação) colocam a miniatura em qualquer espaço desocupado do tabuleiro de Buzzard Gulch."));
    } else {
      lines.push(t(`Each player places their mini on the Starting Location printed on the back of their character. If it is a General Store${m.ante ? ", Trading Post" : ""} or Saloon, choose any of the 3 spaces touching that building.`, `Cada jogador coloca a miniatura no Local Inicial impresso no verso do personagem. Se for um Armazém${m.ante ? ", Entreposto" : ""} ou Saloon, escolha qualquer um dos 3 espaços que tocam o prédio.`));
    }
    if (m.ante) {
      lines.push(t("Remove any event token (outlaw, claim jumper, high roller, longhorn or unique event token) from a space where a player places their mini; return it to the supply.", "Retire qualquer ficha de evento (fora da lei, ladrão de concessão, apostador, longhorn ou ficha de evento única) do espaço onde um jogador colocar a miniatura; devolva ao suprimento."));
    }
    return { id: "placement", title: t("First player and starting positions", "Primeiro jogador e posições iniciais"), lines };
  }

  function npcStep(m) {
    const lines = [];
    if (m.border) {
      lines.push(t("Put the brown ring on a free mini: this is the Sheriff. Place him at the Buzzard Gulch Marshal's Office, which counts as the Sheriff's Office in this mode (interpretation: the main board is covered).", "Coloque o anel marrom numa miniatura livre: é o Xerife. Coloque-o no Escritório do Delegado de Buzzard Gulch, que conta como Escritório do Xerife neste modo (interpretação: o tabuleiro principal fica coberto)."));
      lines.push(t("Put grey rings on free minis as bandits and place one on each Bandit Hideout token that has no player mini. The three Buzzard Gulch spaces are lettered A, B and C; that letter is the gang.", "Coloque anéis cinza em miniaturas livres como bandidos e ponha um em cada ficha de Esconderijo sem miniatura de jogador. Os três espaços de Buzzard Gulch têm as letras A, B e C; essa letra é a gangue."));
    } else {
      lines.push(t("Put the brown ring on a free mini: this is the Sheriff. Place him on the Sheriff's Office space in Darkrock.", "Coloque o anel marrom numa miniatura livre: é o Xerife. Coloque-o no espaço do Escritório do Xerife em Darkrock."));
      lines.push(t("Put grey rings on 6 free minis as bandits. Place one on each of the 6 lettered Bandit Hideouts that does not contain a player mini." + (m.ante ? " The Outlaw Camp does not get one of these six." : ""), "Coloque anéis cinza em 6 miniaturas livres como bandidos. Ponha um em cada um dos 6 Esconderijos de Bandidos com letra que não tenha miniatura de jogador." + (m.ante ? " O Acampamento Fora da Lei não recebe um desses seis." : "")));
    }
    if (m.bandit) {
      lines.push(t(`Bandit card variant: make sure each bandit mini has its numbered sticker (1–6), shuffle the ${m.wild ? "8" : "6"} bandit cards and place them near the fight deck.`, `Variante de cartas de bandido: confirme que cada miniatura de bandido tem seu adesivo numerado (1–6), embaralhe as ${m.wild ? "8" : "6"} cartas de bandido e coloque-as perto do baralho de luta.`));
    }
    return { id: "npcs", title: t("Place the Sheriff and the bandits", "Posicione o Xerife e os bandidos"), lines };
  }

  function goalStep(m) {
    return {
      id: "goals",
      title: t("Goal cards variant", "Variante de objetivos"),
      lines: [
        t("Each player takes the 4 goal cards of their character, returns 1 random card to the box without looking, and keeps the other 3 secret.", "Cada jogador pega os 4 objetivos do seu personagem, devolve 1 aleatório à caixa sem olhar e mantém os outros 3 em segredo."),
        t("Legendary tokens stay facedown in the shared supply" + (m.fistful ? " (or in the Fistful of Extras cloth bag)" : "") + ".", "As fichas lendárias ficam viradas para baixo no suprimento comum" + (m.fistful ? " (ou no saco de pano do Fistful of Extras)" : "") + ".")
      ]
    };
  }

  function mibStep(m) {
    const lines = [
      t("Choose a free mini as the Man in Black and place him on the Rail Station" + (m.ante ? " of the original board (Spike's View)" : "") + ". Place a cube of his color to the left of space 1 (the “0” space) of the LP track.", "Escolha uma miniatura livre como Man in Black e coloque-o na Estação Ferroviária" + (m.ante ? " do tabuleiro original (Spike's View)" : "") + ". Coloque um cubo da cor dele à esquerda do espaço 1 (o espaço “0”) da trilha de LP.")
    ];
    if (m.mode === "serenade") {
      lines.push(t("Use only Man in Black cards 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15 and 19.", "Use somente as cartas do Man in Black 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15 e 19."));
    } else {
      lines.push(t(`Deck: the 10 core Man in Black action cards${m.wild ? (m.ante ? " + the 11 Wild Bunch cards" : " + the Wild Bunch cards except 16, 20 and 21 (they reference the Ante Up board)") : ""}. Keep the rules card as reference.`, `Baralho: as 10 cartas de ação do Man in Black da base${m.wild ? (m.ante ? " + as 11 cartas do Wild Bunch" : " + as cartas do Wild Bunch exceto 16, 20 e 21 (citam o tabuleiro do Ante Up)") : ""}. Deixe a carta de regras como referência.`));
    }
    if (m.wild || m.blood) {
      lines.push(t("Keep the ruin tokens nearby: some Man in Black cards ruin a location.", "Deixe as fichas de ruína por perto: algumas cartas do Man in Black arruinam um local."));
    }
    lines.push(t("Shuffle the Man in Black deck and place it near the board.", "Embaralhe o baralho do Man in Black e coloque-o perto do tabuleiro."));
    return { id: "mib", title: t("Man in Black (2 players)", "Man in Black (2 jogadores)"), lines };
  }

  function variantStep(m) {
    const lines = [];
    if (m.title) {
      lines.push(t("Title card: shuffle the 12 title cards, reveal 1 and leave it faceup for the whole game. Return the rest to the box.", "Carta de título: embaralhe as 12 cartas de título, revele 1 e deixe-a aberta a partida toda. Devolva as outras à caixa."));
    }
    if (m.gang) {
      lines.push(t("Gang/Posse: place the 6 double-sided gang/posse cards beside the board.", "Gangue/Bando: coloque as 6 cartas dupla-face de gangue/bando ao lado do tabuleiro."));
    }
    if (m.sheriffDeck) {
      lines.push(t("Sheriff deck: shuffle the 6 sheriff cards and reveal the top one; it stays active until the Sheriff loses a fight.", "Baralho de Xerife: embaralhe as 6 cartas de xerife e revele a do topo; ela vale até o Xerife perder uma luta."));
    }
    if (!lines.length) {
      return null;
    }
    return { id: "variants", title: t("Wild Bunch variants", "Variantes do Wild Bunch"), lines };
  }

  function aidsStep(m) {
    const lines = [t(m.blood ? "Give each player a Blood Money player aid (it replaces all earlier aids)." : m.ante ? "Give each player an Ante Up player aid." : "Give each player a player aid.", m.blood ? "Dê a cada jogador uma ajuda do Blood Money (substitui todas as anteriores)." : m.ante ? "Dê a cada jogador uma ajuda do Ante Up." : "Dê a cada jogador uma ajuda de jogo.")];
    if (m.blood && !m.mib) {
      lines.push(t("Leave the Man in Black cards in the box. He is not in this match.", "Deixe as cartas do Man in Black na caixa. Ele não entra nesta partida."));
    }
    if (m.lp) {
      lines.push(t(`Check that the end of game marker is on space ${m.lp} of the LP track.`, `Confira se o marcador de fim de jogo está no espaço ${m.lp} da trilha de LP.`));
    }
    return { id: "aids", title: t("Player aids and final check", "Ajudas de jogo e conferência final"), lines };
  }

  function setupPhases() {
    const m = match();
    const phases = [];
    if (!m.blood) {
      const board = [];
      const boardLines = [t("Place the game board in the middle of the table.", "Coloque o tabuleiro no centro da mesa.")];
      if (m.ante) {
        boardLines.push(t("Place the Gambler/Train board above the original board, and the Buzzard Gulch board to the right of the original board.", "Coloque o tabuleiro de Apostador/Trem acima do original, e o de Buzzard Gulch à direita do original."));
        boardLines.push(t("Put all Ante Up tokens in separate facedown piles grouped by matching icon (outlaw, claim jumper, high roller, longhorn).", "Separe todas as fichas do Ante Up em pilhas viradas para baixo, agrupadas pelo ícone (fora da lei, ladrão de concessão, apostador, longhorn)."));
      }
      boardLines.push(t(`Place the end of game marker on space ${m.lp} of the LP track.`, `Coloque o marcador de fim de jogo no espaço ${m.lp} da trilha de LP.`));
      boardLines.push(t("Place all money cards ($10 and $20) in their area.", "Coloque todo o dinheiro ($10 e $20) na sua área."));
      board.push({ id: "board", title: t("Boards and money", "Tabuleiros e dinheiro"), lines: boardLines });
      board.push(itemsStep(m));
      board.push(pokerStep(m));
      const supply = [
        m.mode === "first"
          ? t("Return all cattle tokens to the box: in the first game nobody may take the Acquire Cattle action.", "Devolva todas as fichas de gado à caixa: na primeira partida ninguém pode fazer a ação Adquirir Gado.")
          : t(`Place the cattle tokens facedown (rewards hidden) on the Ranch spaces of their matching color${m.ante ? ", including the orange cattle on the Buzzard Gulch Ranch" : ""}.`, `Coloque as fichas de gado viradas para baixo (recompensa oculta) nos Ranchos da mesma cor${m.ante ? ", inclusive o gado laranja no Rancho de Buzzard Gulch" : ""}.`),
        t("Place the 2 prospecting dice and the gold nugget supply in their area.", "Coloque os 2 dados de prospecção e o suprimento de pepitas na sua área."),
        t("Shuffle the fight deck and place it in its area.", "Embaralhe o baralho de luta e coloque-o na sua área.")
      ];
      if (m.goals || m.ante) {
        supply.push(t("Place the legendary tokens facedown in a shared supply" + (m.fistful ? " (or in the Fistful of Extras cloth bag)" : "") + ".", "Coloque as fichas lendárias viradas para baixo num suprimento comum" + (m.fistful ? " (ou no saco de pano do Fistful of Extras)" : "") + "."));
      }
      if (!m.mib) {
        supply.push(t("Leave the 11 Man in Black cards in the box. They enter the game only with 2 players, and not in Who Runs Border Town.", "Deixe as 11 cartas do Man in Black na caixa. Elas só entram com 2 jogadores, e não em Who Runs Border Town."));
      }
      board.push({ id: "supply", title: t("Cattle, gold, fight deck and tokens", "Gado, ouro, baralho de luta e fichas"), lines: supply });
      phases.push({ title: t("Table and supply", "Mesa e suprimento"), refs: [["core", 4], ...(m.ante ? [["ante", 4]] : [])], items: board });
      if (m.ante) {
        phases.push({
          title: t("Ante Up territory", "Território do Ante Up"),
          refs: [["ante", 4], ["ante", 5], ["faq", 2]],
          items: [
            {
              id: "train",
              title: t("Train and frontier", "Trem e fronteira"),
              lines: [
                t("Place the Train mini on the Spike's View Rail Station facing right, toward Buzzard Gulch.", "Coloque a miniatura do Trem na Estação de Spike's View, virada para a direita, rumo a Buzzard Gulch."),
                t(`Shuffle the train encounter cards${m.wild ? " (with the 6 Wild Bunch encounters)" : ""} into a facedown deck.`, `Embaralhe as cartas de encontro de trem${m.wild ? " (com os 6 encontros do Wild Bunch)" : ""} num baralho virado para baixo.`),
                t(`Shuffle the frontier tokens${m.wild ? " (with the 3 Wild Bunch tokens)" : ""} and place 1 at random, number side up, on each of the 9 frontier spaces that have a printed number. Numbers are not meant to match. Return unused tokens to the box.`, `Embaralhe as fichas de fronteira${m.wild ? " (com as 3 do Wild Bunch)" : ""} e coloque 1 aleatória, com o número para cima, em cada um dos 9 espaços de fronteira com número impresso. Os números não precisam coincidir. Devolva as não usadas à caixa.`),
                t("Place the 2 mountain pass markers at Bandit Hideout A (Sunny Hills) and Bandit Hideout C (Cliff Junction).", "Coloque os 2 marcadores de passagem de montanha no Esconderijo A (Sunny Hills) e no Esconderijo C (Cliff Junction).")
              ]
            },
            {
              id: "events",
              title: t("Events", "Eventos"),
              lines: [
                t(`Place 1 event marker on space 5 of the Gambler, Marshal and Wanted tracks, and 1 on every 5th space of the LP track before the end of game marker (${[5, 10, 15, 20].filter((value) => value < m.lp).join(", ")}).`, `Coloque 1 marcador de evento no espaço 5 das trilhas de Apostador, Delegado e Procurado, e 1 em cada 5º espaço da trilha de LP antes do marcador de fim (${[5, 10, 15, 20].filter((value) => value < m.lp).join(", ")}).`),
                t(`Shuffle the event cards${m.wild ? " (with the 8 Wild Bunch unique event cards; keep their 16 blue tokens nearby)" : ""} into a facedown deck.`, `Embaralhe as cartas de evento${m.wild ? " (com as 8 cartas de evento únicas do Wild Bunch; deixe as 16 fichas azuis por perto)" : ""} num baralho virado para baixo.`),
                t(`Draw and resolve ${Math.ceil(m.players / 2)} event card(s) (1 per 2 players, rounded up). Ignore any Sheriff movement — he is not on the board yet. Tokens are only placed on unoccupied spaces (gold nuggets excepted). Discard resolved events faceup next to the deck.`, `Compre e resolva ${Math.ceil(m.players / 2)} carta(s) de evento (1 a cada 2 jogadores, arredondando para cima). Ignore movimento do Xerife — ele ainda não está no tabuleiro. Fichas só vão para espaços desocupados (exceto pepitas). Descarte os eventos resolvidos ao lado do baralho.`)
              ]
            }
          ]
        });
      }
      const players = [playerKitStep(m), charactersStep(m), placementStep(m)];
      phases.push({ title: t("Players", "Jogadores"), refs: [["core", 4], ["core", 5], ...(m.ante ? [["ante", 5]] : []), ...(m.mode === "first" ? [["core", 24]] : [])], items: players });
      const final = [storyStep(m), {
        id: "discs",
        title: t("Story discs", "Discos de história"),
        lines: [t(`Each player puts both story discs to the left of the board. With ${m.players} players a story card resolves when it holds ${m.discs} discs.`, `Cada jogador põe os dois discos de história à esquerda do tabuleiro. Com ${m.players} jogadores, uma carta de história resolve quando tiver ${m.discs} discos.`)]
      }, npcStep(m)];
      if (m.goals) {
        final.push(goalStep(m));
      }
      if (m.mib) {
        final.push(mibStep(m));
      }
      const variants = variantStep(m);
      if (variants) {
        final.push(variants);
      }
      final.push(aidsStep(m));
      phases.push({ title: t("Stories, NPCs and variants", "Histórias, NPCs e variantes"), refs: [["core", 5], ["core", 22], ...(m.mib ? [["faq", 8]] : []), ...(m.wild ? [["wild", 1]] : [])], items: final });
      return phases;
    }

    // Blood Money flow: pre-setup, play area, final setup.
    const pre = [];
    const boardLines = [];
    if (m.border) {
      boardLines.push(t("Lay out the original board, then place the Buzzard Gulch board on top of it sideways: its edge with the Rail Station sits just above the LP track and its leftmost edge just right of the story deck spaces (the LP track and story deck spaces stay visible).", "Monte o tabuleiro original e coloque o de Buzzard Gulch por cima, de lado: a borda com a Estação fica logo acima da trilha de LP e a borda esquerda logo à direita dos espaços dos baralhos de história (trilha de LP e espaços de história continuam visíveis)."));
      boardLines.push(t("Fold under the rightmost section of the Gambler/Train board and place it just above the Buzzard Gulch board, its left edge just right of the Wanted track.", "Dobre para baixo a seção da direita do tabuleiro de Apostador/Trem e coloque-o logo acima do de Buzzard Gulch, com a borda esquerda logo à direita da trilha de Procurado."));
      boardLines.push(t("Place the 3 Bandit Hideout tokens (Blood Money location tokens or 3D buildings) on the spaces with a red Bandit Hideout icon, and the 2 Mine tokens on the spaces with a yellow Mine icon.", "Coloque as 3 fichas de Esconderijo (fichas de local do Blood Money ou prédios 3D) nos espaços com ícone vermelho de Esconderijo, e as 2 fichas de Mina nos espaços com ícone amarelo de Mina."));
    } else {
      boardLines.push(t("Place the original board in the center, the Gambler/Train board above it, and the Buzzard Gulch board to its right.", "Coloque o tabuleiro original no centro, o de Apostador/Trem acima dele e o de Buzzard Gulch à direita."));
    }
    if (m.legendary) {
      boardLines.push(t("Place the story board overlay on top of the story card spaces of the board.", "Coloque a sobreposição de histórias sobre os espaços de cartas de história do tabuleiro."));
    }
    pre.push({ id: "board", title: t("Boards", "Tabuleiros"), lines: boardLines });
    pre.push(itemsStep(m));
    const money = [t("Separate the money cards by value into 2 decks ($10 and $20).", "Separe o dinheiro por valor em 2 montes ($10 e $20).")];
    if (m.deeds) {
      money.push(t("Separate the 17 deed cards by type (icon) and place them in stacks.", "Separe as 17 escrituras por tipo (ícone) e empilhe-as."));
    } else {
      money.push(t("Deed cards are not used in this mode: leave them in the box.", "Escrituras não são usadas neste modo: deixe-as na caixa."));
    }
    pre.push({ id: "money", title: m.deeds ? t("Money and deeds", "Dinheiro e escrituras") : t("Money", "Dinheiro"), lines: money });
    pre.push(pokerStep(m));
    pre.push(storyStep(m));
    const decks = [];
    let eventLine = t("Event deck: all event cards", "Baralho de eventos: todas as cartas de evento");
    if (m.mode === "serenade" || m.mode === "law") {
      eventLine = t("Event deck: remove every high roller event card and every Unique event card", "Baralho de eventos: retire todas as cartas de evento de apostador (high roller) e todas as cartas de evento Únicas");
    } else if (m.mode === "golden") {
      eventLine = t("Event deck: remove the Unique events Orphan, Grizzly Bear, Wounded Deputy and Bathcat", "Baralho de eventos: retire os eventos Únicos Orphan, Grizzly Bear, Wounded Deputy e Bathcat");
    } else if (m.border) {
      eventLine = t("Event deck: remove every Unique event card and every event that spawns at the Darkrock Bank or the Red Falls Cabaret", "Baralho de eventos: retire todas as cartas de evento Únicas e todos os eventos que surgem no Banco de Darkrock ou no Cabaré de Red Falls");
    } else if (m.wild) {
      eventLine = t("Event deck: all event cards, including the 8 Wild Bunch unique events (keep their 16 blue tokens nearby)", "Baralho de eventos: todas as cartas de evento, inclusive as 8 únicas do Wild Bunch (deixe as 16 fichas azuis por perto)");
    }
    decks.push(`${eventLine}.`);
    decks.push(t("Fight deck.", "Baralho de luta."));
    decks.push(m.injuries ? t("Injury deck (18 cards).", "Baralho de ferimentos graves (18 cartas).") : t("Injury cards are not used in this mode.", "Cartas de ferimento grave não são usadas neste modo."));
    decks.push(t(`Train encounter deck${m.wild ? " (with the 6 Wild Bunch encounters)" : ""}.`, `Baralho de encontros de trem${m.wild ? " (com os 6 encontros do Wild Bunch)" : ""}.`));
    if (m.trader) {
      decks.push(t("Traveling Trader movement deck (9 cards).", "Baralho de movimento do Mercador Viajante (9 cartas)."));
    }
    pre.push({ id: "decks", title: t("Shuffle the decks and place them on the board", "Embaralhe os baralhos e coloque-os no tabuleiro"), lines: decks });
    const tokens = [
      m.border
        ? t("Only the Buzzard Gulch Ranch is in play: put the orange cattle facedown there and return the other cattle to the box.", "Só o Rancho de Buzzard Gulch está em jogo: ponha o gado laranja virado para baixo nele e devolva o resto à caixa.")
        : t("Cattle tokens facedown on the Ranch spaces of their color (including orange at Buzzard Gulch Ranch).", "Fichas de gado viradas para baixo nos Ranchos da mesma cor (inclusive laranja no Rancho de Buzzard Gulch)."),
      t("Outlaw, high roller, claim jumper and longhorn tokens in separate facedown piles.", "Fichas de fora da lei, apostador, ladrão de concessão e longhorn em pilhas separadas viradas para baixo."),
      t("Legendary tokens shuffled facedown in a supply" + (m.fistful ? " (or in the Fistful of Extras bag)" : "") + ".", "Fichas lendárias embaralhadas viradas para baixo num suprimento" + (m.fistful ? " (ou no saco do Fistful of Extras)" : "") + "."),
      t("Prospecting dice, " + (m.legendary ? "risk die, " : "") + "gold nugget supply" + (m.border ? "" : ", mountain pass markers (at Bandit Hideout A in Sunny Hills and Bandit Hideout C in Cliff Junction)") + (m.legendary ? ", 3 map tokens" : "") + " and ruin tokens.", "Dados de prospecção, " + (m.legendary ? "dado de risco, " : "") + "suprimento de pepitas" + (m.border ? "" : ", marcadores de passagem (no Esconderijo A em Sunny Hills e no Esconderijo C em Cliff Junction)") + (m.legendary ? ", 3 fichas de mapa" : "") + " e fichas de ruína."),
      m.border
        ? t("Place the Train mini on the Buzzard Gulch Rail Station.", "Coloque a miniatura do Trem na Estação de Buzzard Gulch.")
        : t("Place the Train mini on the Spike's View Rail Station facing toward Buzzard Gulch.", "Coloque a miniatura do Trem na Estação de Spike's View, virada para Buzzard Gulch.")
    ];
    pre.push({ id: "tokens", title: t("Tokens, dice and Train", "Fichas, dados e Trem"), lines: tokens });
    phases.push({ title: t("Pre-setup and play area", "Pré-preparação e área de jogo"), refs: [["blood", 2], ["blood", 3], ...(m.bloodMode ? [["blood", MODE_INFO[m.mode].setupPage]] : [])], items: pre });

    const final = [];
    final.push({
      id: "lp-events",
      title: t("Game length and events", "Duração e eventos"),
      lines: [
        t(`Place the end of game marker on space ${m.lp} of the LP track.`, `Coloque o marcador de fim de jogo no espaço ${m.lp} da trilha de LP.`),
        t(`Place 1 event marker on space 5 of the Gambler, Marshal and Wanted tracks and on every 5th LP space before the marker (${[5, 10, 15, 20].filter((value) => value < m.lp).join(", ")}). Return unused markers to the box.`, `Coloque 1 marcador de evento no espaço 5 das trilhas de Apostador, Delegado e Procurado e em cada 5º espaço de LP antes do marcador (${[5, 10, 15, 20].filter((value) => value < m.lp).join(", ")}). Devolva os não usados à caixa.`),
        t(`Draw and resolve ${Math.ceil(m.players / 2)} event card(s) (1 per 2 players, rounded up), ignoring any Sheriff movement.${m.border ? " Locations named on the main board use their Buzzard Gulch equivalent; the active player (here, whoever sets up) chooses if several qualify." : ""}`, `Compre e resolva ${Math.ceil(m.players / 2)} carta(s) de evento (1 a cada 2 jogadores, arredondando para cima), ignorando movimento do Xerife.${m.border ? " Locais do tabuleiro principal viram o equivalente em Buzzard Gulch; o jogador ativo (aqui, quem prepara) escolhe se houver vários." : ""}`),
        t("Randomly assign 1 frontier token, number side up, to each of the 9 numbered frontier spaces; keep the unused frontier tokens in a supply near the board.", "Coloque 1 ficha de fronteira aleatória, com o número para cima, em cada um dos 9 espaços de fronteira numerados; deixe as não usadas num suprimento perto do tabuleiro.")
      ].concat(m.trader ? [t("Reveal the top trader movement card and place the cart token on any empty space in the region it shows.", "Revele a carta do topo do movimento do Mercador e coloque a carroça em qualquer espaço vazio da região mostrada.")] : [])
    });
    final.push(playerKitStep(m));
    final.push(charactersStep(m));
    final.push(placementStep(m));
    final.push(npcStep(m));
    if (m.goals) {
      final.push(goalStep(m));
    }
    if (m.mib) {
      final.push(mibStep(m));
    }
    const variants = variantStep(m);
    if (variants) {
      final.push(variants);
    }
    if (m.mode === "serenade") {
      final.push({ id: "serenade-cards", title: t("Serenade: extra starting cards", "Serenade: cartas iniciais extras"), lines: [t("Every player draws 2 extra poker cards.", "Cada jogador compra 2 cartas de pôquer extras.")] });
    }
    final.push(aidsStep(m));
    phases.push({ title: t("Final setup", "Preparação final"), refs: [["blood", 4], ["blood", 5], ...(m.bloodMode ? [["blood", MODE_INFO[m.mode].setupPage]] : [])], items: final });
    return phases;
  }

  function inventory(m) {
    const rows = [];
    rows.push([t("Core box", "Caixa base"), t("1 board, 6 two-sided player mats, 13 minis + 13 rings (6 player colors, 6 grey bandit, 1 brown Sheriff), 12 scoring cubes, 12 story discs, 6 wound tokens, 36 gold nuggets, 2 prospecting dice, 16 cattle tokens, 18 legendary tokens, 1 end of game marker, 1 first player token, 54 money cards (36 × $10, 18 × $20), 12 characters, 48 goal cards, 40 story cards, 52 poker cards, 13 fight cards, 54 item cards, 11 Man in Black cards, General Store stand, 6 player aids.", "1 tabuleiro, 6 tabuleiros de jogador dupla-face, 13 miniaturas + 13 anéis (6 cores de jogador, 6 cinza de bandido, 1 marrom do Xerife), 12 cubos, 12 discos de história, 6 fichas de ferimento, 36 pepitas, 2 dados de prospecção, 16 fichas de gado, 18 fichas lendárias, 1 marcador de fim de jogo, 1 marcador de primeiro jogador, 54 cartas de dinheiro (36 × $10, 18 × $20), 12 personagens, 48 objetivos, 40 histórias, 52 cartas de pôquer, 13 cartas de luta, 54 itens, 11 cartas do Man in Black, expositor do Armazém, 6 ajudas."), ref("core", 3)]);
    if (m.ante) {
      rows.push(["Ante Up", t("Buzzard Gulch board, Gambler/Train board, Trading Post stand, Train mini, 6 scoring cubes, 12 faro bet markers, 8 characters, 32 goal cards, 24 items, 10 alternate poker cards, 8 train encounters, 22 event cards, 7 event markers, 9 outlaw, 3 claim jumper, 6 longhorn, 3 high roller, 8 cattle, 9 legendary and 12 frontier tokens, 2 mountain pass markers.", "Tabuleiro de Buzzard Gulch, tabuleiro de Apostador/Trem, expositor do Entreposto, miniatura do Trem, 6 cubos, 12 marcadores de aposta de faro, 8 personagens, 32 objetivos, 24 itens, 10 cartas de pôquer alternativas, 8 encontros de trem, 22 cartas de evento, 7 marcadores de evento, 9 fichas de fora da lei, 3 de ladrão de concessão, 6 de longhorn, 3 de apostador, 8 de gado, 9 lendárias e 12 de fronteira, 2 marcadores de passagem de montanha."), ref("ante", 2)]);
    }
    if (m.blood) {
      rows.push(["Blood Money", t("40 legendary story cards, story board overlay, risk die, 3 map tokens, 36 items, 7 Legendary items + blocker card, 32 goal cards, 18 injury cards, 17 deeds, 12 ruin tokens, Traveling Trader stand + cart token + 9 movement cards, 8 characters, 6 alternate poker cards, 6 scoring cubes, 6 story discs, 6 bullet markers, 6 player aids.", "40 histórias lendárias, sobreposição de histórias, dado de risco, 3 fichas de mapa, 36 itens, 7 itens Lendários + carta bloqueadora, 32 objetivos, 18 ferimentos graves, 17 escrituras, 12 fichas de ruína, expositor do Mercador + carroça + 9 cartas de movimento, 8 personagens, 6 cartas de pôquer alternativas, 6 cubos, 6 discos, 6 marcadores de bala, 6 ajudas."), ref("blood", 1)]);
    }
    if (m.fistful) {
      rows.push(["Fistful of Extras", t("6 characters + 6 minis, 24 goal cards, 24 story cards, 18 items, 2 Jokers, 6 bandit cards, sticker sheet, legendary token bag.", "6 personagens + 6 miniaturas, 24 objetivos, 24 histórias, 18 itens, 2 Coringas, 6 cartas de bandido, adesivos, saco para fichas lendárias."), ref("fistful", 1)]);
    }
    if (m.gbh) {
      rows.push(["The Good, the Bad and the Handsome", t("3 characters, 12 goal cards, 16 story cards, 12 Legendary items.", "3 personagens, 12 objetivos, 16 histórias, 12 itens Lendários."), ref("gbh", 1)]);
    }
    if (m.wild) {
      rows.push(["Wild Bunch of Extras", t("4 characters, 16 goal cards, 12 items (6 copies of 2), 8 Legendary items, 11 Man in Black cards, 3 ruin tokens, 2 bandit cards, 12 title cards, 22 story cards, 6 train encounters, 6 gang/posse cards, 3 frontier tokens, 8 event cards + 16 event tokens, 6 sheriff cards, 6 wooden wound markers and 18 bullet markers (cosmetic replacements).", "4 personagens, 16 objetivos, 12 itens (6 cópias de 2), 8 itens Lendários, 11 cartas do Man in Black, 3 fichas de ruína, 2 cartas de bandido, 12 títulos, 22 histórias, 6 encontros de trem, 6 cartas de gangue/bando, 3 fichas de fronteira, 8 cartas de evento + 16 fichas, 6 cartas de xerife, 6 marcadores de ferimento de madeira e 18 marcadores de bala (substitutos cosméticos)."), ref("wild", 1)]);
    }
    return `
      <div class="wl-inventory">
        <h3>${t("Components in this match", "Componentes desta partida")}</h3>
        <div class="wl-inventory-grid">${rows.map(([title, text, refHtml]) => `<div><strong>${title}</strong><span>${text}</span><span class="wl-refs">${refHtml}</span></div>`).join("")}</div>
      </div>`;
  }

  function setupSection(index) {
    const m = match();
    const phases = setupPhases();
    const allItems = phases.flatMap((phase) => phase.items);
    const validIds = new Set(allItems.map((item) => item.id));
    const normalized = setupChecks.filter((id) => validIds.has(id));
    if (normalized.length !== setupChecks.length) {
      setupChecks = normalized;
      saveChecks();
    }
    const checkedCount = allItems.filter((item) => setupChecks.includes(item.id)).length;
    const phaseMarkup = phases.map((phase, phaseIndex) => `
      <section class="setup-phase">
        <div class="setup-phase-header">
          <span class="setup-phase-number">${String(phaseIndex + 1).padStart(2, "0")}</span>
          <h3>${phase.title}</h3>
          <div class="setup-phase-references">${phase.refs.map(([book, page]) => ref(book, page)).join("")}</div>
        </div>
        <div class="setup-check-list">
          ${phase.items.map((item) => `
            <label class="setup-check">
              <input type="checkbox" data-setup-check="${escapeHtml(item.id)}" ${setupChecks.includes(item.id) ? "checked" : ""}>
              <span>
                <strong>${item.title}</strong>
                <small class="setup-substeps" role="list">${item.lines.map((line) => `<span role="listitem">${line}</span>`).join("")}</small>
              </span>
            </label>`).join("")}
        </div>
      </section>`).join("");
    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), index, m.blood ? refs(["blood", 2], ["blood", 4]) : refs(["core", 4], ["core", 5]))}
      <p class="section-lead">${m.blood
        ? t("With Blood Money the whole setup follows its three-phase order (pre-setup, play area, final setup); Ante Up steps are already folded in.", "Com Blood Money, toda a preparação segue sua ordem em três fases (pré-preparação, área de jogo, preparação final); os passos do Ante Up já estão incluídos.")
        : m.ante
          ? t("Core setup steps with the Ante Up supplements inserted where they belong.", "Passos da preparação da base com os complementos do Ante Up inseridos no lugar certo.")
          : t("Core setup steps, filtered for this match.", "Passos da preparação da base, filtrados para esta partida.")}</p>
      ${inventory(m)}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div><h3>${t("Build the table in order", "Prepare a mesa em ordem")}</h3><p>${t("Each checkbox groups one coherent setup stage; complete all of its substeps before checking it.", "Cada caixa agrupa uma etapa coerente; complete todas as subetapas antes de marcá-la.")}</p></div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${checkedCount} of ${allItems.length} setup groups checked`, `${checkedCount} de ${allItems.length} grupos de preparação concluídos`)}</span>
            <progress id="setup-progress" max="${Math.max(allItems.length, 1)}" value="${checkedCount}" aria-label="${t("Setup checklist progress", "Progresso da checklist")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t("Changing a setup-affecting choice clears this checklist. Changing language does not. “Uncheck all” clears only the checkboxes.", "Alterar uma escolha que afeta a preparação limpa esta checklist. Trocar o idioma não limpa. “Desmarcar tudo” limpa somente as caixas.")}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>`;
  }

  // --- Rules sections ----------------------------------------------------

  function activeSystems(m) {
    const items = [];
    items.push(m.legendary ? t("Legendary Stories (Story track, legendary story cards, risk die)", "Histórias Lendárias (trilha de História, cartas lendárias, dado de risco)") : t(`Core story cards (${m.discs} discs resolve a card)`, `Cartas de história da base (${m.discs} discos resolvem uma carta)`));
    if (m.ante) {
      items.push(t("Buzzard Gulch, Trading Post, Gambler track, events, Train, Mountain Passes, frontier, faro, high rollers", "Buzzard Gulch, Entreposto, trilha de Apostador, eventos, Trem, Passagens de Montanha, fronteira, faro, apostadores"));
    }
    if (m.trader) {
      items.push(t("Traveling Trader and Legendary items for $40", "Mercador Viajante e itens Lendários por $40"));
    }
    if (m.injuries) {
      items.push(t("Injury cards", "Cartas de ferimento grave"));
    }
    if (m.deeds) {
      items.push(t("Deeds (claim action)", "Escrituras (ação de reivindicar)"));
    }
    if (m.blood) {
      items.push(t("Ruins and the repair action", "Ruínas e a ação de reparar"));
    }
    if (m.goals) {
      items.push(t("Goal cards", "Cartas de objetivo"));
    }
    if (m.mib) {
      items.push(t("Man in Black (automated rival)", "Man in Black (rival automático)"));
    }
    if (m.highStakes) {
      items.push(t("High stakes poker", "Pôquer de apostas altas"));
    }
    if (m.bandit) {
      items.push(t("Bandit cards", "Cartas de bandido"));
    }
    if (m.title) {
      items.push(t("Title card", "Carta de título"));
    }
    if (m.gang) {
      items.push(t("Gang/Posse cards", "Cartas de Gangue/Bando"));
    }
    if (m.sheriffDeck) {
      items.push(t("Sheriff deck", "Baralho de Xerife"));
    }
    if (m.bloodMode || m.mode === "first") {
      items.push(t(`Mode rules: ${modeTitle(m.mode)}`, `Regras do modo: ${modeTitle(m.mode)}`));
    }
    return items;
  }

  function overviewSection(index) {
    const m = match();
    return `
      ${sectionHeading("overview", t("Overview and goal", "Visão geral e objetivo"), index, refs(["core", 3], ["core", 6]))}
      <div class="content-grid">
        ${card(t("What you do", "O que você faz"), `<p>${t("Each player is a historical figure of the Wild West. On your turn you take 3 actions — move, fight, gamble, mine, drive cattle, shop, rob or arrest — in an open sandbox. Everything you do aims at one thing: Legendary Points (LP) on the LP track.", "Cada jogador é uma figura histórica do Velho Oeste. No seu turno você faz 3 ações — mover, lutar, jogar, minerar, conduzir gado, comprar, roubar ou prender — num sandbox aberto. Tudo serve a um objetivo: Pontos de Lenda (LP) na trilha de LP.")}</p>`, refs(["core", 3]))}
        ${card(t("How the game ends and who wins", "Como termina e quem vence"), `<p>${t(`When a player ends a turn with ${m.lp} LP or more, finish the round, then everyone (starting with the first player) takes one last turn. Final scoring adds money, upgraded gear, track bonuses and more; the most LP wins.`, `Quando um jogador termina o turno com ${m.lp} LP ou mais, termine a rodada; depois todos (a partir do primeiro jogador) fazem um último turno. A pontuação final soma dinheiro, equipamento melhorado, bônus de trilhas e mais; vence quem tiver mais LP.`)}${m.mib ? t(" The Man in Black also scores LP and can win.", " O Man in Black também ganha LP e pode vencer.") : ""}</p>`, refs(["core", 21]) + (m.blood ? ` ${ref("blood", 11)}` : ""))}
        ${card(t("Marshal, Wanted or neither", "Delegado, Procurado ou nenhum"), `<p>${t("You may follow the law (Marshal points: fight bandits, wrangle cattle, arrest), turn outlaw (Wanted points: " + (m.border ? "" : "rob the Bank, ") + "rustle cattle, rob players) or stay unaligned. You can never have both kinds of points; a Marshal who gains any Wanted point loses all Marshal progress.", "Você pode seguir a lei (pontos de Delegado: lutar contra bandidos, conduzir gado, prender), virar fora da lei (pontos de Procurado: " + (m.border ? "" : "assaltar o Banco, ") + "roubar gado, roubar jogadores) ou ficar neutro. Nunca se tem os dois tipos; um Delegado que ganha qualquer ponto de Procurado perde todo o progresso de Delegado.")}</p>`, refs(["core", 15]))}
        ${card(t("Systems active in this match", "Sistemas ativos nesta partida"), list(activeSystems(m)))}
      </div>`;
  }

  function quickReference(index) {
    const m = match();
    const start = [
      m.ante ? t("Move the Train to its next checkpoint.", "Mova o Trem para o próximo ponto de parada.") : "",
      t("Resolve start-of-turn effects (you choose their order).", "Resolva efeitos de início de turno (você escolhe a ordem)."),
      t("Choose one: $20, or 2 poker cards, or $10 + 1 poker card (decide before drawing).", "Escolha um: $20, ou 2 cartas de pôquer, ou $10 + 1 carta (decida antes de comprar)."),
      t("Choose your active weapon and mount.", "Escolha arma e montaria ativas.")
    ];
    const actions = [
      t("Move (2 spaces on foot, or your mount's value).", "Mover (2 espaços a pé, ou o valor da montaria)."),
      t("Use an ACTION on a card.", "Usar uma AÇÃO de carta."),
      t("Fight a player in your space: Arrest, Duel or Rob.", "Lutar com um jogador no seu espaço: Prender, Duelar ou Roubar."),
      t("Take a location action.", "Fazer uma ação de local."),
      m.trader ? t("Take a trader action in the cart's region.", "Fazer uma ação de mercador na região da carroça.") : "",
      m.legendary ? t("Once per Action phase: roll the risk die (not an action).", "Uma vez na fase de ações: rolar o dado de risco (não é ação).") : ""
    ];
    const end = m.blood
      ? [
        t("End-of-turn effects (your order).", "Efeitos de fim de turno (sua ordem)."),
        m.legendary ? t("Story conditions about where you end your turn.", "Condições de história sobre onde você termina o turno.") : "",
        m.legendary ? t("Resolve the legendary story card if all conditions are met.", "Resolva a carta lendária se todas as condições estiverem cumpridas.") : t(`Resolve story cards holding ${m.discs} discs.`, `Resolva cartas de história com ${m.discs} discos.`),
        t("Discard down to 5 poker cards minus 1 per wound.", "Descarte até 5 cartas menos 1 por ferimento."),
        t("Wanted: gain 1/2/3 LP for your Wanted-track row.", "Procurado: ganhe 1/2/3 LP pela linha na trilha de Procurado."),
        t(`Check for ${m.lp} LP (end trigger).`, `Verifique ${m.lp} LP (gatilho do fim).`)
      ]
      : [
        t(`Resolve story cards holding ${m.discs} discs.`, `Resolva cartas de história com ${m.discs} discos.`),
        t("Discard down to 5 poker cards minus 1 per wound.", "Descarte até 5 cartas menos 1 por ferimento."),
        t("Wanted: gain 1/2/3 LP for your Wanted-track row.", "Procurado: ganhe 1/2/3 LP pela linha na trilha de Procurado."),
        t(`Check for ${m.lp} LP (end trigger).`, `Verifique ${m.lp} LP (gatilho do fim).`)
      ];
    return `
      ${sectionHeading("quick", t("Quick reference", "Referência rápida"), index, refs(["core", 7], ["core", 13]) + (m.blood ? ` ${ref("blood", 9)}` : m.ante ? ` ${ref("ante", 8)}` : ""))}
      <div class="quick-grid">
        ${card(t("1 · Start of turn", "1 · Início do turno"), steps(start))}
        ${card(t("2 · Action phase: 3 actions", "2 · Fase de ações: 3 ações"), `${steps(actions)}<p class="wl-note">${t("You may repeat the same action, unless a rule limits it (for example, one heist per turn, one fight per opponent per turn).", "Você pode repetir a mesma ação, salvo limite (por exemplo, um assalto por turno, uma luta por adversário por turno).")}</p>`)}
        ${card(t("3 · End of turn", "3 · Fim do turno"), steps(end))}
        ${card(t("Fights at a glance", "Lutas num relance"), list([
          t("Both sides play 1 card facedown, reveal, apply Bonus effects, trade Reactions, then apply fight-card text. Higher rank wins: a number card equals its printed number (2 is the lowest), then Jack, Queen, King, Ace.", "Os dois lados jogam 1 carta virada, revelam, aplicam Bônus, trocam Reações e então aplicam o texto da carta de luta. O maior valor vence: carta numérica vale o número impresso (2 é o menor), depois Valete, Dama, Rei, Ás."),
          t("Ties: the active player beats another player; NPCs (bandits, guards, Sheriff, dealer" + (m.mib ? ", Man in Black" : "") + ") win ties.", "Empates: o jogador ativo vence outro jogador; NPCs (bandidos, guardas, Xerife, crupiê" + (m.mib ? ", Man in Black" : "") + ") vencem empates."),
          t("Loser always gains exactly 1 wound and draws 1 poker card.", "Quem perde sempre ganha exatamente 1 ferimento e compra 1 carta de pôquer."),
          t("NPC hands: bandit 2 fight cards" + (m.border ? "" : ", Bank guard 3") + ", Sheriff 4" + (m.ante ? ", outlaws/claim jumpers/train guards as printed" : "") + (m.mib ? ", Man in Black top 3 (uses the highest)" : "") + ".", "Mãos dos NPCs: bandido 2 cartas de luta" + (m.border ? "" : ", guarda do Banco 3") + ", Xerife 4" + (m.ante ? ", fora da lei/ladrões/guardas do trem conforme impresso" : "") + (m.mib ? ", Man in Black 3 do topo (usa a maior)" : "") + ".")
        ]))}
      </div>`;
  }

  function turnSection(index) {
    const m = match();
    return `
      ${sectionHeading("turn", t("Turn structure", "Estrutura do turno"), index, refs(["core", 7], ["core", 13]))}
      <div class="content-grid">
        ${card(t("Start of turn", "Início do turno"), `${steps([
          m.ante ? t(`Move the Train mini to the next checkpoint along the route printed on the Gambler/Train board (Rail Stations, Mountain Passes and Bandit Hideouts${m.border ? "; in this mode it starts on the Buzzard Gulch Rail Station and the circuit is only that station → Mountain Pass A → Mountain Pass C → back" : "; it starts at Spike's View, facing Buzzard Gulch"}). The space under its front is the Train's location this turn${m.border ? ", on Buzzard Gulch" : ""}.`, `Mova o Trem para o próximo ponto de parada da rota impressa no tabuleiro de Apostador/Trem (Estações, Passagens de Montanha e Esconderijos${m.border ? "; neste modo ele começa na Estação de Buzzard Gulch e o circuito é só essa estação → Passagem A → Passagem C → volta" : "; ele começa em Spike's View, virado para Buzzard Gulch"}). O espaço sob a frente é o local do Trem neste turno${m.border ? ", em Buzzard Gulch" : ""}.`) : "",
          t("Check start-of-turn effects; if you have several, choose the order.", "Verifique efeitos de início de turno; se houver vários, escolha a ordem."),
          t("Choose exactly one income: gain $20; draw 2 poker cards; or gain $10 and draw 1 poker card. Decide before drawing.", "Escolha exatamente uma renda: ganhe $20; compre 2 cartas; ou ganhe $10 e compre 1 carta. Decida antes de comprar.") + " " + ref("faq", 3),
          t("Choose your active weapon and active mount. You keep every weapon and mount you own, but only one of each is active; you can switch only now or when buying a new one. If the new mount carries less, discard the excess nuggets/cattle.", "Escolha sua arma e montaria ativas. Você mantém todas que possui, mas só uma de cada fica ativa; só dá para trocar agora ou ao comprar uma nova. Se a nova montaria carrega menos, descarte o excesso de pepitas/gado.") + " " + ref("faq", 8)
        ])}`, refs(["core", 7]) + (m.ante ? ` ${ref("ante", 8)}` : "") + (m.blood ? ` ${ref("blood", 9)}` : ""))}
        ${card(t("Action phase", "Fase de ações"), `<p>${t("Take 3 actions, one at a time, in any combination:", "Faça 3 ações, uma de cada vez, em qualquer combinação:")}</p>${list([
          t("<strong>Move</strong> — see Movement.", "<strong>Mover</strong> — veja Movimento."),
          t("<strong>Use an ACTION on a card</strong> — poker, item or character cards printed with “ACTION”: place it faceup, read it aloud, do it; a poker card is then discarded, other cards stay.", "<strong>Usar AÇÃO de carta</strong> — cartas de pôquer, item ou personagem com “ACTION”: coloque aberta, leia em voz alta, execute; a carta de pôquer é então descartada, as outras ficam."),
          t("<strong>Fight another player</strong> in your space — see Fights.", "<strong>Lutar com outro jogador</strong> no seu espaço — veja Lutas."),
          t("<strong>Location action</strong> — see Locations.", "<strong>Ação de local</strong> — veja Locais."),
          m.trader ? t("<strong>Trader action</strong> — in any space of the Traveling Trader's region.", "<strong>Ação de mercador</strong> — em qualquer espaço da região do Mercador Viajante.") : "",
          m.legendary ? t("<strong>Risk die</strong> — once per Action phase, at any moment except while resolving an action; it is not an action.", "<strong>Dado de risco</strong> — uma vez por fase de ações, a qualquer momento exceto durante a resolução de uma ação; não é uma ação.") : ""
        ])}<p class="wl-note">${t("BONUS and REACTION effects never cost an action and can be used outside your turn.", "Efeitos BONUS e REACTION nunca custam ação e podem ser usados fora do seu turno.")}</p>`, refs(["core", 7], ["core", 8]))}
        ${card(t("End of turn", "Fim do turno"), steps(m.blood ? [
          t("Resolve end-of-turn abilities/effects (you choose the order). Effects “while you hold” a token also check here.", "Resolva habilidades/efeitos de fim de turno (você escolhe a ordem). Efeitos “enquanto você tiver” uma ficha também verificam aqui.") + " " + ref("faq", 1),
          m.legendary ? t("Resolve legendary story conditions tied to where you end your turn.", "Resolva condições de história lendária ligadas a onde você termina o turno.") : "",
          m.legendary ? t("If every condition of the legendary story card is met, resolve it (see Stories).", "Se todas as condições da carta lendária estiverem cumpridas, resolva-a (veja Histórias).") : t(`Resolve every story card that holds ${m.discs} discs.`, `Resolva toda carta de história com ${m.discs} discos.`),
          t("Discard down to your hand limit: 5 poker cards minus 1 per wound.", "Descarte até o limite da mão: 5 cartas menos 1 por ferimento."),
          t("If Wanted, gain LP for your Wanted-track row (1, 2 or 3).", "Se Procurado, ganhe LP pela sua linha na trilha de Procurado (1, 2 ou 3)."),
          t(`If you have ${m.lp}+ LP, the end of the game is triggered.`, `Se você tiver ${m.lp}+ LP, o fim do jogo é acionado.`),
          t("The next player clockwise starts their turn.", "O próximo jogador em sentido horário começa o turno.") + (m.mib ? t(" After both players have played, the Man in Black takes his turn.", " Depois que os dois jogadores jogarem, o Man in Black faz o turno dele.") : "")
        ] : [
          t(`Resolve every story card that holds ${m.discs} discs.`, `Resolva toda carta de história com ${m.discs} discos.`),
          t("Discard down to your hand limit: 5 poker cards minus 1 per wound.", "Descarte até o limite da mão: 5 cartas menos 1 por ferimento."),
          t("If Wanted, gain LP for your Wanted-track row (1, 2 or 3).", "Se Procurado, ganhe LP pela sua linha na trilha de Procurado (1, 2 ou 3)."),
          t(`If you have ${m.lp}+ LP, the end of the game is triggered.`, `Se você tiver ${m.lp}+ LP, o fim do jogo é acionado.`),
          t("The next player clockwise starts their turn.", "O próximo jogador em sentido horário começa o turno.") + (m.mib ? t(" After both players have played, the Man in Black takes his turn.", " Depois que os dois jogadores jogarem, o Man in Black faz o turno dele.") : "")
        ]), refs(["core", 13]) + (m.blood ? ` ${ref("blood", 11)}` : ""))}
        ${card(t("Limits to remember", "Limites a lembrar"), list([
          t("Money: at most $120; any excess is lost." + (m.border ? " (Gold nuggets used as money in this mode do not count toward it.)" : ""), "Dinheiro: no máximo $120; o excesso é perdido." + (m.border ? " (Pepitas usadas como dinheiro neste modo não contam.)" : "")),
          t("Gold nuggets: carry at most 4 (some items raise it).", "Pepitas: carregue no máximo 4 (alguns itens aumentam)."),
          t("Cattle: carry 1 token (2 with the Workhorse, and each delivered token gives its own Marshal/Wanted point)." + (m.ante ? " Longhorns are unlimited." : ""), "Gado: carregue 1 ficha (2 com o Workhorse, e cada ficha entregue dá seu próprio ponto de Delegado/Procurado)." + (m.ante ? " Longhorns são ilimitados." : "")) + " " + ref("faq", 1),
          t("Wounds: at most 3; extra wounds are ignored" + (m.injuries ? " — except that they trigger an injury card" : "") + ".", "Ferimentos: no máximo 3; ferimentos extras são ignorados" + (m.injuries ? " — exceto que acionam uma carta de ferimento grave" : "") + "."),
          t("Miscellaneous items: at most 3. Only 1 copy of each item.", "Itens diversos: no máximo 3. Só 1 cópia de cada item."),
          t("If a reward exceeds a limit, take as much as you can.", "Se uma recompensa passar do limite, receba o quanto couber.") + " " + ref("faq", 1),
          t("You cannot discard cards just because you want to: only to pay a cost or effect.", "Não se descarta carta só por querer: apenas para pagar custo ou efeito.") + " " + ref("faq", 1)
        ]), refs(["core", 9], ["core", 11], ["core", 20]))}
      </div>`;
  }

  function movementSection(index) {
    const m = match();
    const ante = m.ante && !m.border ? [
      card(t("Travel by rail", "Viajar de trem"), `<p>${t("Start a move action on a Rail Station, pay $10, place your mini on the other Rail Station and continue that same move action from there, up to your full movement. It is one move action. Passing through the far station does not count as ending a move there.", "Comece uma ação de mover numa Estação, pague $10, coloque a miniatura na outra Estação e continue essa mesma ação de lá, até o movimento completo. É uma única ação de mover. Passar pela estação de destino não conta como terminar o movimento ali.")}</p>`, refs(["ante", 11], ["faq", 2], ["faq", 4])),
      card(t("Mountain Pass trail", "Trilha da Passagem de Montanha"), `<p>${t("At a Mountain Pass trail head, take a trail action (a location/move action that uses all your movement) to jump to the paired trail head: Pass A links Bandit Hideout A (top right of the original board) with Mountain Pass A (top left of Buzzard Gulch); Pass C links Bandit Hideout C (bottom right) with Mountain Pass C (bottom left of Buzzard Gulch). You may also Work there.", "Numa entrada de Passagem de Montanha, faça uma ação de trilha (ação de local/movimento que usa todo seu movimento) para ir à entrada par: a Passagem A liga o Esconderijo A (canto superior direito do tabuleiro original) à Passagem A (canto superior esquerdo de Buzzard Gulch); a Passagem C liga o Esconderijo C (inferior direito) à Passagem C (inferior esquerdo de Buzzard Gulch). Também se pode Trabalhar ali.")}</p>`, refs(["ante", 11], ["faq", 2]))
    ] : [];
    return `
      ${sectionHeading("movement", t("Movement and the map", "Movimento e mapa"), index, refs(["core", 7]))}
      <div class="content-grid">
        ${card(t("Move action", "Ação de mover"), list([
          t("Move up to 2 spaces without a mount, or up to your active mount's movement.", "Mova até 2 espaços sem montaria, ou até o movimento da montaria ativa."),
          m.ante ? t("Each longhorn token you carry reduces your movement by 1 (minimum 1).", "Cada ficha de longhorn que você carrega reduz seu movimento em 1 (mínimo 1).") : "",
          t("Move into any adjacent space. Diagonal spaces are adjacent, and spaces on the outer edge of the map are adjacent too (the faded lines are only art).", "Mova para qualquer espaço adjacente. Diagonais são adjacentes, e espaços na borda do mapa também (as linhas apagadas são só arte).") + " " + refs(["faq", 2], ["faq", 3]),
          t("You may move back into a space you just left.", "Você pode voltar a um espaço de onde acabou de sair.") + " " + ref("faq", 2),
          t("The two mesas (red dashed lines in the board center) are not spaces: nobody enters them, the Sheriff included.", "As duas mesas (linhas vermelhas tracejadas no centro) não são espaços: ninguém entra nelas, nem o Xerife.") + " " + ref("faq", 5),
          t("Entering a space with a bandit" + (m.ante ? ", outlaw token or claim jumper token" : "") + " ends your movement and starts a fight. That fight does not cost another action. Bandits never move by themselves.", "Entrar num espaço com bandido" + (m.ante ? ", ficha de fora da lei ou ladrão de concessão" : "") + " encerra o movimento e inicia uma luta. Essa luta não custa outra ação. Bandidos nunca se movem sozinhos."),
          t("A Wanted player can never enter the Sheriff's space.", "Um Procurado nunca pode entrar no espaço do Xerife.")
        ]), refs(["core", 7], ["core", 23]))}
        ${card(t("Moving is not always a move action", "Mover nem sempre é ação de mover"), `<p>${t("Only movement labeled “move action” is one. Card actions such as Saddle Up, character abilities" + (m.legendary ? ", the risk die's “move 1”" : "") + (m.deeds ? ", deed abilities" : "") + " simply move you: you cannot follow them with Sprint, and they do not count for effects that trigger “at the end of”/“after” a move action (such as delivering cattle or picking up nuggets). Bandits still stop you.", "Só é ação de mover o movimento rotulado assim. Ações de carta como Saddle Up, habilidades de personagem" + (m.legendary ? ", o “mover 1” do dado de risco" : "") + (m.deeds ? ", habilidades de escrituras" : "") + " apenas movem você: não dá para emendar Sprint, e não contam para efeitos “ao fim de”/“depois de” uma ação de mover (como entregar gado ou pegar pepitas). Bandidos continuam parando você.")}</p>`, refs(["faq", 2], ["faq", 3], ["faq", 10]))}
        ${card(t("Towns and locations", "Cidades e locais"), list([
          t("Spaces inside the thick borders of Darkrock and Red Falls" + (m.ante ? " (and Buzzard Gulch)" : "") + " are “in town”; everything else is “outside of town”.", "Espaços dentro das bordas grossas de Darkrock e Red Falls" + (m.ante ? " (e Buzzard Gulch)" : "") + " estão “na cidade”; o resto está “fora da cidade”."),
          t("General Stores" + (m.ante ? ", Trading Posts" : "") + " and Saloons sit on intersections: you are at them from any of the 3 spaces touching the building.", "Armazéns" + (m.ante ? ", Entrepostos" : "") + " e Saloons ficam em cruzamentos: você está neles a partir de qualquer um dos 3 espaços que tocam o prédio."),
          t("Every other location is used from its own space; you never need to “enter the building”. The Rail Station is a single space across the rails.", "Os demais locais são usados no próprio espaço; não é preciso “entrar no prédio”. A Estação é um único espaço dos dois lados dos trilhos."),
          m.ante ? t("A frontier space stays a location after its token is gone (you can still Work there).", "Um espaço de fronteira continua sendo local após a ficha sair (ainda se pode Trabalhar).") : ""
        ]), refs(["core", 7], ["core", 9], ["faq", 2]))}
        ${ante.join("")}
      </div>`;
  }

  function locationsSection(index) {
    const m = match();
    const cards = [];
    cards.push(card(t("General Store" + (m.ante ? " and Trading Post" : ""), "Armazém" + (m.ante ? " e Entreposto" : "")), `<p>${t("Action from a touching space: buy and/or upgrade any number of items you can afford. " + (m.ante ? "Each stand sells only the items placed in it" + (m.border ? "; in this mode both stands count as one store" : "") : "The core game has one General Store stand, and every store space sells from it") + ". To upgrade a mount or weapon, pay its cost again; you may make a newly bought mount/weapon active immediately.", "Ação de um espaço adjacente: compre e/ou melhore quantos itens puder pagar. " + (m.ante ? "Cada expositor vende só os itens colocados nele" + (m.border ? "; neste modo os dois expositores contam como uma loja" : "") : "A base tem um só expositor de Armazém, e todo espaço de loja vende dele") + ". Para melhorar montaria ou arma, pague o custo de novo; uma montaria/arma recém-comprada pode ficar ativa na hora.")}${m.ante && m.altPoker ? t(" Promotional items are available at both; the Outfit poker card treats you as being at both.", " Itens promocionais estão nas duas; a carta Outfit considera você nas duas.") : ""}</p>`, refs(["core", 9], ["core", 19]) + (m.ante ? ` ${ref("ante", 10)} ${ref("faq", 4)}` : "")));
    cards.push(card(t("Saloon", "Saloon"), `<p>${t("Action from a touching space: play poker" + (m.ante ? ", play faro, challenge a high roller token there" : "") + (m.highStakes ? ", or play high stakes poker" : "") + ". See Gambling.", "Ação de um espaço adjacente: jogar pôquer" + (m.ante ? ", jogar faro, desafiar uma ficha de apostador ali" : "") + (m.highStakes ? ", ou jogar pôquer de apostas altas" : "") + ". Veja Jogatina.")}</p>`, refs(["core", 10]) + (m.ante ? ` ${ref("ante", 12)}` : "")));
    cards.push(card(t("Mine — prospect for gold", "Mina — prospectar ouro"), `<p>${t("Action: roll both prospecting dice. Gold nugget = gain 1 nugget; Tailings = $10; Gold dust = $10 and reroll that die, applying the new result too; Gravel = nothing. Carry at most 4 nuggets.", "Ação: role os dois dados. Pepita = ganhe 1 pepita; Rejeito = $10; Pó de ouro = $10 e role esse dado de novo, aplicando também o novo resultado; Cascalho = nada. Carregue no máximo 4 pepitas.")}${m.border ? t(" In this mode the 2 Mine tokens on Buzzard Gulch are the mines.", " Neste modo as 2 fichas de Mina em Buzzard Gulch são as minas.") : ""}</p>`, refs(["core", 11])));
    if (!m.border) {
      cards.push(card(t("Bank — deposit or heist", "Banco — depositar ou assaltar"), list([
        t("Deposit: action; each nugget sold gives $20 and 1 LP (all at once in one action).", "Depositar: ação; cada pepita vendida dá $20 e 1 LP (todas de uma vez numa ação).") + " " + ref("faq", 2),
        t("Heist: once per turn, action; fight the Bank guard (3 fight cards, guard wins ties). Win: $80 and 3 Wanted points. Lose: 1 Wanted point, 1 wound, draw 1 poker card.", "Assalto: uma vez por turno, ação; lute contra o guarda (3 cartas de luta, guarda vence empates). Vitória: $80 e 3 pontos de Procurado. Derrota: 1 ponto de Procurado, 1 ferimento, compre 1 carta.")
      ]), refs(["core", 11])));
      cards.push(card(t("Doctor's Office — heal", "Consultório — curar"), `<p>${t("Action and $10: lose all wounds, then draw 1 poker card per wound lost.", "Ação e $10: perca todos os ferimentos e compre 1 carta por ferimento perdido.")}</p>`, refs(["core", 12])));
      cards.push(card(t("Cabaret — revel", "Cabaré — festejar"), `<p>${t("Action: spend money in $30 steps; each $30 gives 1 LP ($30 / $60 / $90 / $120 → 1 / 2 / 3 / 4 LP).", "Ação: gaste dinheiro em blocos de $30; cada $30 dá 1 LP ($30 / $60 / $90 / $120 → 1 / 2 / 3 / 4 LP).")}</p>`, refs(["core", 12])));
    }
    cards.push(card(t("Ranch — cattle", "Rancho — gado"), m.mode === "first" ? `<p>${t("Not used in the first game (no cattle tokens).", "Não usado na primeira partida (sem fichas de gado).")}</p>` : list([
      t("Acquire: action at a Ranch while carrying no cattle token: take 1 facedown cattle token of that Ranch onto your mat.", "Adquirir: ação num Rancho sem estar carregando gado: pegue 1 ficha virada daquele Rancho para seu tabuleiro."),
      t("Wrangle (no action): after ending a move action at a Rail Station, deliver it for 1 Marshal point + the token's reward. A Wanted player cannot wrangle, because Wanted players cannot gain Marshal points; they rustle instead.", "Conduzir (sem ação): após terminar uma ação de mover numa Estação, entregue-a por 1 ponto de Delegado + a recompensa da ficha. Um Procurado não pode conduzir, porque Procurados não ganham pontos de Delegado; eles roubam o gado."),
      t("Rustle (no action): after ending a move action at a Ranch of the opposing color, deliver it for 1 Wanted point + the token's reward." + (m.border ? " This mode has only the orange Ranch, so rustling does not come up." : m.ante ? " With three colors, any Ranch of a different color counts (interpretation)." : ""), "Roubar gado (sem ação): após terminar uma ação de mover num Rancho da cor oposta, entregue por 1 ponto de Procurado + a recompensa." + (m.border ? " Este modo tem só o Rancho laranja, então roubar gado não acontece." : m.ante ? " Com três cores, qualquer Rancho de outra cor conta (interpretação)." : "")),
      t("Delivered tokens are shuffled back into their own Ranch.", "Fichas entregues voltam embaralhadas ao próprio Rancho."),
      m.ante ? t("Longhorns can also be dropped at any Ranch (see Event tokens).", "Longhorns também podem ser entregues em qualquer Rancho (veja Fichas de evento).") : ""
    ]), refs(["core", 12]) + (m.ante ? ` ${ref("ante", 10)}` : "")));
    cards.push(card(t("Work — any location", "Trabalhar — qualquer local"), `<p>${t("Action at any location: gain $10.", "Ação em qualquer local: ganhe $10.")}</p>`, refs(["core", 12])));
    if (m.ante) {
      cards.push(card(t("Train — heist", "Trem — assalto"), `<p>${t(
        "The Train is an extra location in the space where its front is. " + (m.border
          ? "In this mode that space is on Buzzard Gulch: the Rail Station, Mountain Pass A or Mountain Pass C. "
          : "Its spaces on the Gambler/Train board stand for the Bandit Hideout of the same letter: the FAQ treats that train space and that Bandit Hideout as one space (interpretation: the hideout beside the train board). ") +
        "Once per turn, as an action, draw a train encounter card and follow it — usually a guard fight with the printed number of fight cards (guard wins ties). Win: the card's rewards. Lose: the card's consequences plus the normal 1 wound and 1 poker card. “Player arrested” applies every arrest effect.",
        "O Trem é um local extra no espaço onde está sua frente. " + (m.border
          ? "Neste modo esse espaço fica em Buzzard Gulch: a Estação, a Passagem A ou a Passagem C. "
          : "Os espaços dele no tabuleiro de Apostador/Trem representam o Esconderijo da mesma letra: o FAQ trata esse espaço do trem e esse Esconderijo como um só espaço (interpretação: o esconderijo ao lado do tabuleiro do trem). ") +
        "Uma vez por turno, como ação, compre um encontro de trem e siga-o — normalmente luta com o guarda usando o número impresso de cartas de luta (guarda vence empates). Vitória: recompensas da carta. Derrota: consequências da carta mais o normal de 1 ferimento e 1 carta. “Player arrested” aplica todos os efeitos de prisão."
      )}</p>`, refs(["ante", 8], ["ante", 9], ["faq", 3], ["faq", 4])));
cards.push(card(t("Frontier space", "Espaço de fronteira"), `<p>${t("Action on a frontier space that still has its token (placed number side up): discard poker cards whose values add up to at least the space's printed number + the token's number (2–9 = face value, 10/J/Q/K = 10, A = 11). Flip the token to its reward side, gain those rewards and return it to the box. “Gain an upgraded mount” gives a new mount already upgraded.", "Ação num espaço de fronteira que ainda tem a ficha (colocada com o número para cima): descarte cartas cujo valor some pelo menos o número impresso no espaço + o número da ficha (2–9 = valor, 10/J/Q/K = 10, A = 11). Vire a ficha para o lado da recompensa, receba-a e devolva a ficha à caixa. “Ganhe uma montaria melhorada” dá uma montaria nova já melhorada.")}</p>`, refs(["ante", 11], ["faq", 2])));
      cards.push(card(t("Outlaw Camp", "Acampamento Fora da Lei"), `<p>${t("A Ranch and Bandit Hideout in one. After ending a move action here, rustle cattle tokens of any color (1 Wanted point + reward each) and drop longhorns (1 LP + $30 each). Outlaw tokens may spawn here; resolve the rustle and the outlaw fight in the order you choose.", "Um Rancho e Esconderijo ao mesmo tempo. Após terminar uma ação de mover aqui, roube gado de qualquer cor (1 ponto de Procurado + recompensa cada) e entregue longhorns (1 LP + $30 cada). Fichas de fora da lei podem surgir aqui; resolva o roubo de gado e a luta na ordem que quiser.")}${m.gang ? t(" A Wanted player can also recruit a gang here.", " Um Procurado também pode recrutar uma gangue aqui.") : ""}</p>`, refs(["ante", 14], ["faq", 3])));
      cards.push(card(t("Marshal's Office", "Escritório do Delegado"), `<p>${t("Wanted players arrested in the Buzzard Gulch territories (by the Sheriff or a player) go here, and the Sheriff moves here with them." + (m.border ? " In this mode it also counts as the Sheriff's Office for every purpose." : ""), "Procurados presos nos territórios de Buzzard Gulch (pelo Xerife ou por jogador) vêm para cá, e o Xerife vem junto." + (m.border ? " Neste modo também conta como Escritório do Xerife para tudo." : ""))}${m.gang ? t(" Marshals can recruit a posse here or at the Sheriff's Office.", " Delegados podem recrutar um bando aqui ou no Escritório do Xerife.") : ""}</p>`, refs(["ante", 14]) + (m.border ? ` ${ref("blood", 24)}` : "")));
    }
    if (m.trader) {
      cards.push(card(t("Traveling Trader — trader action", "Mercador Viajante — ação de mercador"), `<p>${t("Action in any space of the region shown on the current trader movement card (the cart token marks it): buy any of the trader's items and/or its faceup Legendary items ($40 each; several per action — refill each bought Legendary item from the deck at once). In the same action you may pay to upgrade any of your items, wherever they came from. Afterwards reveal the next trader movement card and move the cart to that region (reshuffle the discards when the deck runs out).", "Ação em qualquer espaço da região mostrada na carta de movimento atual (a carroça marca): compre itens do mercador e/ou itens Lendários abertos ($40 cada; vários por ação — reponha cada Lendário comprado na hora). Na mesma ação você pode pagar para melhorar qualquer item seu, venha de onde vier. Depois revele a próxima carta de movimento e leve a carroça para aquela região (reembaralhe o descarte quando acabar).")}</p>`, refs(["blood", 8], ["blood", 9])));
    }
    if (m.deeds) {
      cards.push(card(t("Claim a deed", "Reivindicar escritura"), `<p>${t("Claim action at a location: pay the deed's cost and take that deed, ability side up (each deed exists once; no limit per player). Later, spend an action to use its once-per-game ability, then flip it to the scoring side; you cannot use it while its location has a ruin token. Unused deeds are flipped at the end and score anyway.", "Ação de reivindicar num local: pague o custo e pegue a escritura com o lado de habilidade para cima (cada escritura existe uma vez; sem limite por jogador). Depois, gaste uma ação para usar a habilidade única, e vire para o lado de pontuação; não dá para usar se o local estiver arruinado. Escrituras não usadas são viradas no final e pontuam igual.")}</p>`, refs(["blood", 10], ["faq", 1])));
    }
    if (m.blood) {
      cards.push(card(t("Ruins and repair", "Ruínas e reparo"), `<p>${t("Some effects destroy a location: put a ruin token on it. Nobody can take claim, location or work actions there. Repair action (at the location, or a touching space for General Store/Saloon/Trading Post): then discard 1 poker card, gain 2 Story points and remove the ruin. A ruined deed does not score.", "Alguns efeitos destroem um local: ponha uma ficha de ruína. Ninguém pode fazer ações de reivindicar, de local ou de trabalho ali. Ação de reparar (no local, ou espaço adjacente para Armazém/Saloon/Entreposto): depois descarte 1 carta, ganhe 2 pontos de História e retire a ruína. Escritura arruinada não pontua.")}${m.legendary ? "" : t(" Without the Story track, the 2 Story points have no effect (interpretation).", " Sem a trilha de História, os 2 pontos de História não têm efeito (interpretação).")}${m.mib && m.wild ? t(" A Man in Black card that ruins a location says it cannot be used for the rest of the game; follow the card.", " Uma carta do Man in Black que arruína um local diz que ele não pode ser usado pelo resto da partida; siga a carta.") : ""}</p>`, refs(["blood", 10])));
    } else if (m.mib && m.wild) {
      cards.push(card(t("Ruins (Man in Black)", "Ruínas (Man in Black)"), `<p>${t("Some Wild Bunch Man in Black cards put a ruin token on a location: nobody may use it for the rest of the game.", "Algumas cartas do Man in Black do Wild Bunch colocam ficha de ruína num local: ninguém pode usá-lo pelo resto da partida.")}</p>`, refs(["wild", 3])));
    }
    if (m.gang) {
      cards.push(card(t("Recruit (Gang/Posse)", "Recrutar (Gangue/Bando)"), `<p>${t("A Marshal pays $20 at the Sheriff's" + (m.ante ? " or Marshal's" : "") + " Office for a posse card; a Wanted player pays $20 at the Outlaw Camp for a gang card. Never more than 1 such card. Its effects stack (for example, a gang can make you draw 3 poker cards when an arrest is attempted, and then it is discarded).", "Um Delegado paga $20 no Escritório do Xerife" + (m.ante ? " ou do Delegado" : "") + " por uma carta de bando; um Procurado paga $20 no Acampamento Fora da Lei por uma carta de gangue. Nunca mais de 1. Os efeitos se acumulam (por exemplo, uma gangue pode fazer você comprar 3 cartas quando tentarem prendê-lo, e então é descartada).")}</p>`, refs(["wild", 2], ["faq", 2])));
    }
    if (m.border) {
      cards.push(card(t("Settler action and Homestead", "Ação de colono e Propriedade"), list([
        t("Settler (once per game): on a frontier space with no frontier token and no other homestead, spend an action and $40 to place your homestead marker there.", "Colono (uma vez por partida): num espaço de fronteira sem ficha e sem outra propriedade, gaste uma ação e $40 para colocar seu marcador de propriedade."),
        t("At your Homestead — Improvement action: gain 1 LP per $30 spent (each gold nugget counts as $20).", "Na sua Propriedade — ação Melhoria: ganhe 1 LP a cada $30 gastos (cada pepita vale $20)."),
        t("At your Homestead — Recuperate action: lose all wounds and draw 1 poker card per wound lost.", "Na sua Propriedade — ação Recuperar: perca todos os ferimentos e compre 1 carta por ferimento perdido.")
      ]), refs(["blood", 22])));
    }
    return `
      ${sectionHeading("locations", t("Location actions", "Ações de local"), index, refs(["core", 9], ["core", 12]) + (m.ante ? ` ${ref("ante", 10)}` : ""))}
      <p class="section-lead">${t("Each costs 1 action unless marked “no action”. You must be in the location's space (or a touching space for stores and Saloons).", "Cada uma custa 1 ação, salvo “sem ação”. Você precisa estar no espaço do local (ou num espaço adjacente para lojas e Saloons).")}${m.border ? t(" In Who Runs Border Town the Bank, Cabaret and Doctor's Office are not used.", " Em Who Runs Border Town, Banco, Cabaré e Consultório não são usados.") : ""}</p>
      <div class="content-grid">${cards.join("")}</div>`;
  }

  function gamblingSection(index) {
    const m = match();
    const hands = [
      [t("Five of a kind", "Quina"), t("Highest hand: four of a kind plus a wild card (Cheat" + (m.fistful ? " or a Joker" : "") + ")", "Mão mais alta: quadra mais uma carta curinga (Cheat" + (m.fistful ? " ou um Coringa" : "") + ")")],
      [t("Royal flush", "Royal flush"), "A-K-Q-J-10 " + t("of one suit", "do mesmo naipe")],
      [t("Straight flush", "Straight flush"), t("5 in sequence, one suit", "5 em sequência, mesmo naipe")],
      [t("Four of a kind", "Quadra"), t("4 of the same value", "4 de mesmo valor")],
      [t("Full house", "Full house"), t("3 of a value + 2 of another", "3 de um valor + 2 de outro")],
      [t("Flush", "Flush"), t("5 of one suit, not in sequence", "5 do mesmo naipe, fora de sequência")],
      [t("Straight", "Sequência"), t("5 in sequence, mixed suits (Ace high or low)", "5 em sequência, naipes mistos (Ás alto ou baixo)")],
      [t("Three of a kind", "Trinca"), t("3 of the same value", "3 de mesmo valor")],
      [t("Two pair", "Dois pares"), t("2 different pairs", "2 pares diferentes")],
      [t("Pair", "Par"), t("2 of the same value", "2 de mesmo valor")],
      [t("High card", "Carta alta"), t("Highest card played", "A carta mais alta jogada")]
    ];
    const cards = [];
    cards.push(card(t("Poker", "Pôquer"), `${steps([
      t("At a Saloon, take an action (a gamble action), pay a $10 ante and draw 1 poker card.", "Num Saloon, faça uma ação (de jogatina), pague $10 de aposta inicial e compre 1 carta."),
      t("Every other player in the same town may also pay $10 and draw 1 card to join (they need not be at the Saloon).", "Qualquer outro jogador na mesma cidade pode pagar $10 e comprar 1 carta para entrar (não precisa estar no Saloon)."),
      t("If nobody joins, the player to your right is the dealer: they set their hand aside and draw 4 poker cards as the dealer's hand.", "Se ninguém entrar, o jogador à sua direita é o crupiê: separa a própria mão e compra 4 cartas como mão do crupiê."),
      t("The Saloon adds $50 to the antes: that is the pot.", "O Saloon soma $50 às apostas: esse é o pote."),
      t("Reveal the top 3 poker cards (the flop). Each player picks 2 cards from hand and makes the best 5-card hand with the flop. With an empty hand before the ante, you play the 1 card you drew. A Cheat in the flop counts only as a 2.", "Revele as 3 cartas do topo (o flop). Cada um escolhe 2 cartas da mão e forma a melhor mão de 5 com o flop. Se estava sem cartas antes de apostar, jogue a 1 carta comprada. Um Cheat no flop vale só 2.") + " " + ref("faq", 6),
      t("Best hand takes the pot; losing players draw 1 poker card. Ties between players: the active player wins; two tied non-active players split the pot (rounded down). Against the dealer, the dealer (an NPC) wins ties; if the dealer wins, nobody gains anything and the pot returns to the supply.", "A melhor mão leva o pote; os perdedores compram 1 carta. Empate entre jogadores: o ativo vence; dois não ativos empatados dividem o pote (para baixo). Contra o crupiê, ele (NPC) vence empates; se o crupiê vencer, ninguém ganha e o pote volta ao suprimento.") + " " + ref("faq", 7),
      m.ante
        ? t("Reward: if the active player wins, they also choose 1 LP or 1 Gambler point; any other winner gains 1 Gambler point. Discard all played cards and the flop.", "Recompensa: se o ativo vencer, também escolhe 1 LP ou 1 ponto de Apostador; outro vencedor ganha 1 ponto de Apostador. Descarte as cartas jogadas e o flop.")
        : t("Reward: if the active player wins, they also gain 1 LP. Discard all played cards and the flop.", "Recompensa: se o ativo vencer, também ganha 1 LP. Descarte as cartas jogadas e o flop.")
    ])}`, refs(["core", 10]) + (m.ante ? ` ${ref("ante", 12)}` : "")));
    cards.push(card(t("Poker hands, highest first", "Mãos de pôquer, da maior"), `<dl class="wl-hands">${hands.map(([name, text]) => `<div><dt>${name}</dt><dd>${text}</dd></div>`).join("")}</dl><p class="wl-note">${t("A wild card (Cheat" + (m.fistful ? " or a Joker" : "") + ") changes the value only, never the suit. The original table placed five of a kind below the royal flush; the FAQ corrects it to the top.", "Uma carta curinga (Cheat" + (m.fistful ? " ou um Coringa" : "") + ") muda só o valor, nunca o naipe. A tabela original punha a quina abaixo do royal flush; o FAQ a corrige para o topo.")} ${refs(["faq", 5], ["faq", 6])}</p>`, refs(["core", 10])));
    if (m.fistful) {
      cards.push(card(t("Jokers", "Coringas"), `<p>${t("A Joker has no value in fights or poker. Instead you play it as a stand-in for another card that stays in your hand (you reveal that card and keep it). A Joker revealed in the flop or played by the dealer counts as whatever suit and value each player chooses, like Cheat.", "Um Coringa não tem valor em lutas nem no pôquer. Você o joga representando outra carta que fica na sua mão (revele-a e mantenha-a). Coringa revelado no flop ou jogado pelo crupiê vale o naipe e valor que cada jogador escolher, como o Cheat.")}</p>`, refs(["fistful", 1], ["faq", 7])));
    }
    if (m.ante) {
      cards.push(card(t("Faro", "Faro"), steps([
        t("At a Saloon, take a gamble action and invite everyone in the same town. If anyone joins, you (the active player) gain $10.", "Num Saloon, faça uma ação de jogatina e convide todos na mesma cidade. Se alguém entrar, você (ativo) ganha $10."),
        t("Dealer: the closest player to your right who is not playing (if everyone plays, you deal). The dealer draws the top 4 fight cards and reveals 3 of them.", "Crupiê: o jogador mais próximo à sua direita que não esteja jogando (se todos jogarem, você distribui). Ele compra as 4 cartas de luta do topo e revela 3."),
        t("Clockwise, ending with you, each player places 1 or 2 bet markers ($10 or $20 side) on the revealed values. Total bets cannot exceed your money.", "Em sentido horário, terminando em você, cada um põe 1 ou 2 marcadores de aposta (lado $10 ou $20) nos valores revelados. O total não pode passar do seu dinheiro."),
        t("The dealer shuffles the 4 cards facedown and offers you the cut. Card 1: bets on that value lose (pay the bet to the supply).", "O crupiê embaralha as 4 cartas viradas e oferece o corte a você. Carta 1: apostas nesse valor perdem (pague a aposta ao suprimento)."),
        t("Card 2: bets on it win 1:1 and gain 1 Gambler point. In betting order, everyone with markers left chooses to take them back or stay for the bonus.", "Carta 2: apostas nela ganham 1:1 e 1 ponto de Apostador. Na ordem de apostas, quem ainda tem marcadores escolhe recolher ou ficar para o bônus."),
        t("Card 3 (bonus): bets on it win 3:1 and gain 1 Gambler point; every other remaining bet loses. Return the 4 cards to the bottom of the fight deck.", "Carta 3 (bônus): apostas nela ganham 3:1 e 1 ponto de Apostador; as demais apostas restantes perdem. Devolva as 4 cartas ao fundo do baralho de luta.")
      ]), refs(["ante", 12], ["ante", 13], ["faq", 6])));
      cards.push(card(t("High roller tokens", "Fichas de apostador"), steps([
        t("At a Saloon with a high roller token you may (not must) take an action to challenge it head-to-head; nobody else can join.", "Num Saloon com ficha de apostador você pode (não é obrigatório) fazer uma ação para desafiá-lo cara a cara; ninguém mais entra."),
        t("Draw 1 poker card and ante $20. Flip the token; the dealer (player to your right) sets their hand aside and draws the number of poker cards above the line. The dealer adds no money.", "Compre 1 carta e aposte $20. Vire a ficha; o crupiê (à sua direita) separa a mão e compra o número de cartas acima da linha. O crupiê não põe dinheiro."),
        t("Reveal a 3-card flop; both make the best hand with 2 cards from hand.", "Revele um flop de 3 cartas; ambos formam a melhor mão com 2 cartas da mão."),
        t("Win: get your $20 back plus the token's rewards (and bonuses such as Lady Luck or Jackpot). Lose: the $20 goes to the supply and you draw 1 poker card. Either way discard the token. It counts as gambling.", "Vitória: recupere os $20 mais as recompensas da ficha (e bônus como Lady Luck ou Jackpot). Derrota: os $20 vão ao suprimento e você compra 1 carta. Em ambos os casos descarte a ficha. Conta como jogatina.") + " " + ref("faq", 7)
      ]), refs(["ante", 6], ["faq", 7])));
    }
    if (m.highStakes) {
      cards.push(card(t("High stakes poker (variant)", "Pôquer de apostas altas (variante)"), steps([
        t("At a Saloon, action; ante $10 and draw 1 card; others in town may join the same way. With no joiners, the dealer draws 5 poker cards. The Saloon adds $40.", "Num Saloon, ação; aposte $10 e compre 1 carta; outros na cidade podem entrar igual. Sem participantes, o crupiê compra 5 cartas. O Saloon soma $40."),
        t("Reveal a 3-card flop. Clockwise, the active player last, each player pays $20 to stay or folds (loses what they put in). If only one player remains, they win.", "Revele um flop de 3. Em sentido horário, o ativo por último, cada um paga $20 para ficar ou desiste (perde o que apostou). Se sobrar só um, ele vence."),
        t("If play continues the Saloon adds $20; against the dealer alone, the dealer always stays. Reveal 2 more cards (turn and river).", "Se continuar, o Saloon soma $20; contra o crupiê sozinho, ele sempre fica. Revele mais 2 cartas (turn e river)."),
        t("Best hand from 2 cards in hand + 3 of the 5 shared cards (with no cards before ante: the drawn card + 3 shared).", "Melhor mão com 2 cartas da mão + 3 das 5 comunitárias (sem cartas antes da aposta: a carta comprada + 3 comunitárias)."),
        t("The winner — whoever started it — takes the pot, 1 Gambler point and 1 LP. Ties: the active player wins; tied non-active players each gain 1 Gambler point and 1 LP and split the pot (rounded down).", "O vencedor — quem quer que tenha iniciado — leva o pote, 1 ponto de Apostador e 1 LP. Empates: o ativo vence; não ativos empatados ganham 1 ponto de Apostador e 1 LP cada e dividem o pote (para baixo).")
      ]), refs(["ante", 15], ["faq", 7])));
    }
    if (m.border) {
      cards.push(card(t("Gold nuggets as money", "Pepitas como dinheiro"), `<p>${t("In this mode you can spend gold nuggets as $20 each — including faro bets and purchases. They do not count toward the $120 cap.", "Neste modo você pode gastar pepitas como $20 cada — inclusive em apostas de faro e compras. Elas não contam no limite de $120.")}</p>`, refs(["blood", 22], ["blood", 24])));
    }
    return `
      ${sectionHeading("gambling", t("Gambling", "Jogatina"), index, refs(["core", 10]) + (m.ante ? ` ${ref("ante", 12)}` : ""))}
      ${m.ante ? `<p class="section-lead">${t("Poker, faro and high roller challenges all count as “gambling” for every effect, for everyone taking part. Effects that say “poker” work only with poker.", "Pôquer, faro e desafios de apostador contam como “jogatina” para qualquer efeito, para todos que participam. Efeitos que dizem “pôquer” valem só no pôquer.")} ${refs(["ante", 7], ["faq", 7])}</p>` : ""}
      <div class="content-grid">${cards.join("")}</div>`;
  }

  function fightsSection(index) {
    const m = match();
    const cards = [];
    cards.push(card(t("Fight another player: 4 steps", "Lutar com outro jogador: 4 passos"), steps([
      t("<strong>Declaration.</strong> Target a player in your space and declare Arrest, Duel or Rob. Arrest requires you to have 1+ Marshal points and the target 1+ Wanted points. Players alternate “start of fight” effects, starting with you. You play 1 poker card facedown; the target either plays 1 facedown or declines. Declining skips to the reward: you still win, you still discard your card, and the target has lost (1 wound and 1 poker card, plus the fight's other loss effects).", "<strong>Declaração.</strong> Escolha um jogador no seu espaço e declare Prender, Duelar ou Roubar. Prender exige que você tenha 1+ ponto de Delegado e o alvo 1+ ponto de Procurado. Os jogadores alternam efeitos de “início de luta”, começando por você. Você joga 1 carta virada; o alvo joga 1 virada ou recusa. Recusar pula para a recompensa: você ainda vence, ainda descarta sua carta, e o alvo perdeu (1 ferimento e 1 carta, mais os outros efeitos de derrota da luta)."),
      t("<strong>Reveal.</strong> Flip both cards together and apply Bonus effects (abilities, items, weapons, the cards). The active player's card resolves first.", "<strong>Revelação.</strong> Vire as duas cartas juntas e aplique efeitos Bonus (habilidades, itens, armas, as cartas). A carta do jogador ativo resolve primeiro.") + " " + ref("faq", 6),
      t("<strong>Reaction.</strong> Starting with you, players alternate playing Reactions one at a time until both pass (you may come back in after passing). Each specific Reaction can be used once per fight (one Holster use, one Stick 'Em Up).", "<strong>Reação.</strong> Começando por você, alternem Reações uma por vez até os dois passarem (dá para voltar depois de passar). Cada Reação específica vale uma vez por luta (um uso do Holster, um Stick 'Em Up).") + " " + refs(["faq", 5], ["faq", 7]),
      t("<strong>Reward.</strong> Higher value wins; values can only be lowered, never below 2. The active player wins ties. The loser gains 1 wound and draws 1 poker card. Only the active player earns the fight's reward. Discard the played cards. You may fight each other player only once per turn.", "<strong>Recompensa.</strong> Maior valor vence; valores só diminuem, nunca abaixo de 2. O ativo vence empates. O perdedor ganha 1 ferimento e compra 1 carta. Só o ativo recebe a recompensa da luta. Descarte as cartas jogadas. Você pode lutar com cada outro jogador uma vez por turno.")
    ]), refs(["core", 8], ["core", 9])));
    cards.push(card(t("Fight rewards (active player wins)", "Recompensas (o ativo vence)"), list([
      t("<strong>Duel:</strong> gain 2 LP.", "<strong>Duelo:</strong> ganhe 2 LP."),
      t("<strong>Rob:</strong> gain 1 Wanted point and steal half the target's money or half their gold nuggets (rounded up); you may also steal 1 cattle token" + (m.ante ? " or 1 longhorn (not both)" : "") + ".", "<strong>Roubo:</strong> ganhe 1 ponto de Procurado e roube metade do dinheiro ou metade das pepitas do alvo (arredonde para cima); pode também roubar 1 ficha de gado" + (m.ante ? " ou 1 longhorn (não ambos)" : "") + "."),
      t("<strong>Arrest (Marshals only):</strong> gain 1 Marshal point. The arrested player draws 1 poker card, goes to the Sheriff's Office" + (m.ante ? " (Marshal's Office in the Buzzard Gulch territories)" : "") + " and the Sheriff goes there too; they lose all Wanted points, all cattle" + (m.ante ? " and longhorn" : "") + " tokens and half their money and half their gold nuggets (rounded up). Their single wound for losing is the only wound.", "<strong>Prisão (só Delegados):</strong> ganhe 1 ponto de Delegado. O preso compra 1 carta, vai para o Escritório do Xerife" + (m.ante ? " (do Delegado nos territórios de Buzzard Gulch)" : "") + " e o Xerife vai junto; perde todos os pontos de Procurado, todas as fichas de gado" + (m.ante ? " e longhorn" : "") + " e metade do dinheiro e metade das pepitas (arredonde para cima). O único ferimento é o da derrota.") + " " + refs(["faq", 4]),
      t("After an arrest, the former Wanted player may later become a Marshal. A Wanted player can never gain Marshal points unless an effect explicitly allows it.", "Depois de preso, o ex-Procurado pode depois virar Delegado. Um Procurado nunca ganha pontos de Delegado a menos que um efeito permita explicitamente.") + " " + refs(["core", 23], ["faq", 4]),
      m.mode === "law" ? t("<strong>Infamous (Law and Disorder):</strong> see Mode rules.", "<strong>Infame (Law and Disorder):</strong> veja Regras do modo.") : ""
    ]), refs(["core", 9])));
    cards.push(card(t("NPC fights (bandits, guards, tokens)", "Lutas contra NPCs (bandidos, guardas, fichas)"), `${steps([
      t("The player to the active player's right draws the NPC's fight cards: bandit 2" + (m.border ? "" : ", Bank guard 3") + (m.ante ? ", outlaw/claim jumper = number above the line on the token, train guard = number on the encounter card" : "") + ".", "O jogador à direita do ativo compra as cartas de luta do NPC: bandido 2" + (m.border ? "" : ", guarda do Banco 3") + (m.ante ? ", fora da lei/ladrão de concessão = número acima da linha da ficha, guarda do trem = número na carta de encontro" : "") + "."),
      t("Resolve start-of-fight effects. You play 1 poker card facedown; the NPC's controller picks 1 fight card facedown.", "Resolva efeitos de início de luta. Você joga 1 carta virada; quem controla o NPC escolhe 1 carta de luta virada."),
      t("Reveal; apply Bonus effects; you may play any number of Reactions; then apply the played fight card's text, whichever side won.", "Revele; aplique Bonus; você pode jogar quantas Reações quiser; então aplique o texto da carta de luta jogada, vença quem vencer."),
      t("Higher value wins; the NPC wins ties.", "Maior valor vence; o NPC vence empates."),
      t("Discard your card(s); return the drawn fight cards to the bottom of the fight deck in random order.", "Descarte sua(s) carta(s); devolva as cartas de luta compradas ao fundo do baralho em ordem aleatória.")
    ])}${list([
      t("<strong>Bandit:</strong> win → choose 1 LP or 1 Marshal point (Wanted players must take the LP); lose → 1 wound + 1 card. The bandit is removed either way.", "<strong>Bandido:</strong> vitória → escolha 1 LP ou 1 ponto de Delegado (Procurados devem pegar o LP); derrota → 1 ferimento + 1 carta. O bandido sai de qualquer forma."),
      m.ante ? t("<strong>Outlaw / claim jumper token:</strong> entering stops you; flip it; win → reward below the line (“fight again” tokens give the reward per fight won); lose → 1 wound + 1 card. Return the token to the event token supply either way. Wounds printed in a reward are still part of the fight (Bulletproof cancels them).", "<strong>Ficha de fora da lei / ladrão de concessão:</strong> entrar para você; vire-a; vitória → recompensa abaixo da linha (fichas “lute de novo” dão a recompensa a cada luta vencida); derrota → 1 ferimento + 1 carta. Devolva a ficha ao suprimento de qualquer forma. Ferimentos impressos na recompensa ainda fazem parte da luta (Bulletproof os cancela).") + " " + refs(["faq", 3], ["faq", 4]) : "",
      t("<strong>Story card fights</strong> count as NPC fights (not bandit fights): only the card's rewards and your “win a fight” item effects apply. Each player fights separately, active player first, then clockwise.", "<strong>Lutas de cartas de história</strong> contam como lutas contra NPC (não contra bandido): valem só as recompensas da carta e efeitos de item “ao vencer uma luta”. Cada jogador luta separadamente, o ativo primeiro e depois em sentido horário.") + " " + refs(["faq", 3], ["faq", 6]),
      t("<strong>Shootout (8)</strong> against an NPC: the NPC discards its fight cards and draws a full new hand for the new fight.", "<strong>Shootout (8)</strong> contra NPC: o NPC descarta as cartas de luta e compra uma mão nova completa para a nova luta.") + " " + ref("faq", 6)
    ])}`, refs(["core", 11], ["core", 17]) + (m.ante ? ` ${ref("ante", 6)} ${ref("ante", 9)}` : "")));
    cards.push(card(t("Bandits on the board", "Bandidos no tabuleiro"), list([
      t("Three gangs (A, B, C), each with two Bandit Hideouts outside town" + (m.border ? " — in this mode, the 3 Bandit Hideout tokens on Buzzard Gulch" : "") + ".", "Três gangues (A, B, C), cada uma com dois Esconderijos fora da cidade" + (m.border ? " — neste modo, as 3 fichas de Esconderijo em Buzzard Gulch" : "") + "."),
      t("After setup, bandits appear only when an effect spawns them (story cards" + (m.legendary ? ", Story track space 3" : "") + ", events" + (m.mib ? ", the Man in Black" : "") + "), and only in an unoccupied hideout: no other bandit, player, Sheriff" + (m.ante ? " or token" : "") + ".", "Depois da preparação, bandidos só surgem quando um efeito os cria (histórias" + (m.legendary ? ", espaço 3 da trilha de História" : "") + ", eventos" + (m.mib ? ", o Man in Black" : "") + "), e só num esconderijo desocupado: sem outro bandido, jogador, Xerife" + (m.ante ? " ou ficha" : "") + ".") + " " + ref("faq", 3),
      m.bandit ? t("Bandit cards: after you enter a bandit's space, reveal the top bandit card and apply the line for that bandit's sticker number, then fight normally. A card's extra MP/WP is gained after the normal reward. Whoever spawns bandits chooses which minis go where.", "Cartas de bandido: depois de entrar no espaço do bandido, revele a carta do topo e aplique a linha do número do adesivo dele, depois lute normalmente. O MP/WP extra da carta vem depois da recompensa normal. Quem cria bandidos escolhe quais miniaturas vão para onde.") + " " + refs(["fistful", 2], ["faq", 1]) : ""
    ]), refs(["core", 17])));
    cards.push(card(t("The Sheriff", "O Xerife"), list([
      t("The Sheriff can move only while at least one player is Wanted (“Sheriff active”). Without Wanted players he stays put (you can still play Manhunt for its LP by moving him 0).", "O Xerife só se move enquanto houver pelo menos um Procurado (“Sheriff active”). Sem Procurados ele fica parado (dá para jogar Manhunt pelo LP movendo-o 0).") + " " + refs(["faq", 4]),
      t("He moves when a resolved story card shows Sheriff movement (the resolving player moves him 0–6 spaces), with the Manhunt action (up to 3)" + (m.legendary ? ", from Story track space 2 (up to 3)" : "") + (m.ante ? " and from event cards" : "") + ". He cannot cross mesas" + (m.ante ? "; Rail Station to Rail Station and trail head to trail head each count as 1 space" : "") + ". Entering a bandit's space does nothing.", "Ele se move quando uma história resolvida mostra movimento do Xerife (quem resolve o move 0–6 espaços), com a ação Manhunt (até 3)" + (m.legendary ? ", pelo espaço 2 da trilha de História (até 3)" : "") + (m.ante ? " e por cartas de evento" : "") + ". Não atravessa mesas" + (m.ante ? "; Estação a Estação e entrada a entrada de trilha contam 1 espaço cada" : "") + ". Entrar no espaço de um bandido não faz nada.") + " " + refs(["faq", 1], ["faq", 5]),
      t("When he enters a space with Wanted players, each of them discards 1 poker card of their choice; the player who moved him picks which Wanted player he tries to arrest.", "Quando ele entra num espaço com Procurados, cada um descarta 1 carta à escolha; quem o moveu escolhe qual Procurado ele tenta prender.") + " " + ref("faq", 5),
      t("Arrest attempt: start-of-fight effects; the Wanted player plays 1 card facedown or declines (arrested); the player to their right draws 4 fight cards and picks 1; reveal, Bonus, the Wanted player's Reactions, fight-card text; the Sheriff wins ties.", "Tentativa de prisão: efeitos de início; o Procurado joga 1 carta virada ou recusa (preso); o jogador à direita dele compra 4 cartas de luta e escolhe 1; revele, Bonus, Reações do Procurado, texto da carta de luta; o Xerife vence empates."),
      t("Sheriff wins: full arrest effects (1 wound, 1 card, to the office with him, lose all Wanted points, cattle, half money and nuggets). Wanted player wins: the Sheriff returns to his office; no reward.", "Xerife vence: todos os efeitos de prisão (1 ferimento, 1 carta, ao escritório com ele, perde pontos de Procurado, gado, metade do dinheiro e das pepitas). Procurado vence: o Xerife volta ao escritório; sem recompensa."),
      t("There is no limit to Sheriff arrest attempts in a turn: ending your turn on his office while Wanted is dangerous. Becoming Wanted while sharing his space does not trigger an arrest.", "Não há limite de tentativas do Xerife num turno: terminar o turno no escritório dele sendo Procurado é perigoso. Virar Procurado no mesmo espaço dele não provoca prisão.") + " " + refs(["faq", 3], ["faq", 5]),
      m.sheriffDeck ? t("Sheriff deck: the faceup sheriff card changes his behavior as printed; when he loses a fight, discard it and reveal a new one (reshuffle when empty). Arrests still give 1 wound and remove all Wanted points.", "Baralho de Xerife: a carta aberta muda o comportamento dele como impresso; quando ele perde uma luta, descarte-a e revele outra (reembaralhe quando acabar). Prisões continuam dando 1 ferimento e zerando os pontos de Procurado.") + " " + ref("wild", 3) : ""
    ]), refs(["core", 18])));
    return `
      ${sectionHeading("fights", t("Fights, NPCs and the Sheriff", "Lutas, NPCs e o Xerife"), index, refs(["core", 8], ["core", 17], ["core", 18]))}
      <p class="section-lead">${t("Every conflict is one-on-one, even against NPCs. Bandits, guards, the Sheriff, the poker dealer" + (m.mib ? " and the Man in Black" : "") + " are NPCs.", "Todo conflito é um contra um, até contra NPCs. Bandidos, guardas, o Xerife, o crupiê do pôquer" + (m.mib ? " e o Man in Black" : "") + " são NPCs.")} ${ref("faq", 3)}</p>
      <div class="content-grid">${cards.join("")}</div>`;
  }

  function tracksSection(index) {
    const m = match();
    const cards = [];
    cards.push(card(t("Marshal track", "Trilha de Delegado"), `${list([
      t("Earn Marshal points (MP): defeat a bandit (1, instead of 1 LP), wrangle cattle (1), arrest a Wanted player (1), Living Legend action (1), story rewards.", "Ganhe pontos de Delegado (MP): derrotar bandido (1, em vez de 1 LP), conduzir gado (1), prender Procurado (1), ação Living Legend (1), recompensas de história."),
      t("Move your cube one space per point and gain each space's reward as you pass or land: 1 $20 · 2 $20 · 3 2 LP · 4 $30 · 5 $30 · 6 4 LP · 7 $40 · 8 $40 · 9 6 LP. Each point beyond space 9 gives 1 LP instead.", "Avance o cubo um espaço por ponto e receba a recompensa de cada espaço por onde passa ou para: 1 $20 · 2 $20 · 3 2 LP · 4 $30 · 5 $30 · 6 4 LP · 7 $40 · 8 $40 · 9 6 LP. Cada ponto além do 9 dá 1 LP."),
      t("End of game: Marshals score their row — spaces 1–3 = 1 LP, 4–6 = 2 LP, 7–9 = 3 LP.", "Fim de jogo: Delegados pontuam pela linha — espaços 1–3 = 1 LP, 4–6 = 2 LP, 7–9 = 3 LP."),
      t("Gaining any Wanted point moves your cube to the start of the Wanted track and wipes your Marshal progress.", "Ganhar qualquer ponto de Procurado leva o cubo ao início da trilha de Procurado e apaga o progresso de Delegado.")
    ])}<p class="wl-note">${t("Space 1's value is partly hidden in the rulebook image; it matches the rulebook example ($20).", "O valor do espaço 1 aparece parcialmente na imagem do livro; coincide com o exemplo do livro ($20).")}</p>`, refs(["core", 15], ["core", 16])));
    cards.push(card(t("Wanted track", "Trilha de Procurado"), list([
      t("Earn Wanted points (WP): " + (m.border ? "" : "Bank heist (3 if successful, 1 if not), ") + "rob a player (1), rustle cattle (1), Living Legend action (1), story rewards" + (m.ante ? ", train encounters" : "") + ".", "Ganhe pontos de Procurado (WP): " + (m.border ? "" : "assalto ao Banco (3 com sucesso, 1 sem), ") + "roubar jogador (1), roubar gado (1), ação Living Legend (1), recompensas de história" + (m.ante ? ", encontros de trem" : "") + "."),
      t("Space rewards: 1 Sheriff active · 2 draw 1 card · 4 draw 1 · 6 draw 1 · 8 draw 1 (3, 5, 7, 9 nothing). Each point beyond 9 gives 1 LP.", "Recompensas: 1 Xerife ativo · 2 compre 1 carta · 4 compre 1 · 6 compre 1 · 8 compre 1 (3, 5, 7, 9 nada). Cada ponto além do 9 dá 1 LP."),
      t("At the end of each of your turns: 1 LP on row 1 (spaces 1–3), 2 LP on row 2 (4–6), 3 LP on row 3 (7–9).", "No fim de cada turno seu: 1 LP na linha 1 (espaços 1–3), 2 LP na linha 2 (4–6), 3 LP na linha 3 (7–9)."),
      t("End of game: the most Wanted player gains 3 LP (if tied, each tied player gains 1 LP instead); every other Wanted player gains 1 LP.", "Fim de jogo: o mais Procurado ganha 3 LP (empate: cada empatado ganha 1 LP); cada outro Procurado ganha 1 LP."),
      t("Reputation can be played at most once per turn; it still works when the point turns into LP on a full track.", "Reputation pode ser jogada no máximo uma vez por turno; vale mesmo quando o ponto vira LP com a trilha cheia.") + " " + refs(["core", 23], ["faq", 5])
    ]), refs(["core", 16])));
    if (m.ante) {
      cards.push(card(t("Gambler track", "Trilha de Apostador"), list([
        t("Anyone can advance, whatever their alignment. Each Gambler point (GP) moves you 1 space and gives its reward at once.", "Qualquer um avança, seja qual for o alinhamento. Cada ponto de Apostador (GP) avança 1 espaço e dá a recompensa na hora."),
        t("1 $10 or draw 1 card · 2 1 LP · 3 $10 or draw 1 · 4 1 legendary token · 5 $20 or draw 2 · 6 2 LP · 7 2 legendary tokens. Each GP after 7 gives the 7 reward again.", "1 $10 ou compre 1 · 2 1 LP · 3 $10 ou compre 1 · 4 1 ficha lendária · 5 $20 ou compre 2 · 6 2 LP · 7 2 fichas lendárias. Cada GP depois do 7 repete a recompensa do 7."),
        t("End of game: the player farthest along gains 1 LP (all tied players gain it).", "Fim de jogo: quem estiver mais à frente ganha 1 LP (todos os empatados ganham).")
      ]), refs(["ante", 7], ["ante", 14])));
    }
    if (m.legendary) {
      cards.push(card(t("Story track", "Trilha de História"), list([
        t("Earn Story points (SP) from legendary story conditions, the risk die, repairs and some characters. Move 1 space per SP and resolve each new space entered.", "Ganhe pontos de História (SP) por condições lendárias, dado de risco, reparos e alguns personagens. Avance 1 espaço por SP e resolva cada novo espaço."),
        t("1 Start · 2 move the Sheriff up to 3 spaces · 3 spawn bandits at Bandit Hideouts A, B or C (the space text; interpretation: choose one letter and spawn at each unoccupied hideout of that gang) · 4 choose 1 GP, 1 LP, 1 MP or 1 WP" + (m.mode === "risky" ? " (+1 LP in Risky Business)" : "") + ".", "1 Início · 2 mova o Xerife até 3 espaços · 3 crie bandidos nos Esconderijos A, B ou C (texto do espaço; interpretação: escolha uma letra e crie em cada esconderijo desocupado dessa gangue) · 4 escolha 1 GP, 1 LP, 1 MP ou 1 WP" + (m.mode === "risky" ? " (+1 LP no Risky Business)" : "") + "."),
        t("On reaching space 4 your cube stops there (extra SP are lost), you take the reward, then return the cube to space 1.", "Ao chegar ao espaço 4 o cubo para (SP extras se perdem), você recebe a recompensa e volta o cubo ao espaço 1.")
      ]), refs(["blood", 6])));
    }
    if (m.ante) {
      cards.push(card(t("Event markers", "Marcadores de evento"), `<p>${t(`The first time any player's cube enters or passes a track space holding an event marker (Gambler, Marshal and Wanted space 5; LP ${[5, 10, 15, 20].filter((value) => value < m.lp).join(", ")}), that player immediately resolves the top event card. Finish the effect that moved the cube first, then resolve the event. Each marker fires only once (removing it then is a handy reminder).`, `Na primeira vez que o cubo de qualquer jogador entra ou passa por um espaço de trilha com marcador de evento (espaço 5 de Apostador, Delegado e Procurado; LP ${[5, 10, 15, 20].filter((value) => value < m.lp).join(", ")}), esse jogador resolve na hora a carta de evento do topo. Termine primeiro o efeito que moveu o cubo e depois resolva o evento. Cada marcador dispara uma só vez (retirá-lo então ajuda a lembrar).`)}</p>`, refs(["ante", 6], ["faq", 1])));
    }
    return `
      ${sectionHeading("tracks", t("Tracks", "Trilhas"), index, refs(["core", 15], ["core", 16]))}
      <p class="section-lead">${t("You can have Marshal points or Wanted points, never both. Switching tracks always starts you at the beginning of the new track.", "Você tem pontos de Delegado ou de Procurado, nunca os dois. Trocar de trilha sempre começa do início da nova.")} ${ref("faq", 4)}</p>
      <div class="content-grid">${cards.join("")}</div>`;
  }

  function storiesSection(index) {
    const m = match();
    if (m.legendary) {
      return `
        ${sectionHeading("stories", t("Legendary Stories", "Histórias Lendárias"), index, refs(["blood", 6], ["blood", 7]))}
        <div class="content-grid">
          ${card(t("The card in play", "A carta em jogo"), list([
            t("One legendary story card is always faceup on the overlay. When a new one is revealed, the active player reads the story text aloud, then its rules text, and performs any instruction. Ongoing effects last until the card resolves.", "Há sempre uma carta lendária aberta na sobreposição. Quando uma nova é revelada, o jogador ativo lê a história em voz alta, depois o texto de regras, e executa as instruções. Efeitos contínuos duram até a carta resolver."),
            t("Each card has 2 or 3 conditions (ignore the third overlay space if there are only 2).", "Cada carta tem 2 ou 3 condições (ignore o terceiro espaço se houver só 2).")
          ]), refs(["blood", 7]))}
          ${card(t("Contributing", "Contribuir"), list([
            t("When you meet an open condition, place 1 of your 3 story discs next to it on the overlay and gain its listed rewards at once.", "Ao cumprir uma condição aberta, coloque 1 dos seus 3 discos ao lado dela e receba as recompensas na hora."),
            t("Each condition takes only one disc: once someone contributes to it, nobody else can. You may contribute to several conditions of the same card.", "Cada condição aceita um só disco: depois que alguém contribui, ninguém mais pode. Você pode contribuir em várias condições da mesma carta."),
            t("Rumors (7) lets you place a disc on a condition while ignoring its requirements and costs, still gaining the reward.", "Rumors (7) permite colocar um disco numa condição ignorando requisitos e custos, recebendo a recompensa.") + " " + ref("faq", 5)
          ]), refs(["blood", 7]))}
          ${card(t("Map tokens", "Fichas de mapa"), list([
            t("Some cards place the 3 map tokens facedown where they say. Reveal one when instructed.", "Algumas cartas colocam as 3 fichas de mapa viradas onde indicam. Revele quando mandar."),
            t("The “danger” X gives the revealer 1 wound at once. Resolve the card text for the token revealed, then keep it near your mat.", "O X de “perigo” dá 1 ferimento na hora a quem revelou. Resolva o texto da carta para a ficha revelada e guarde-a perto do tabuleiro.")
          ]), refs(["blood", 7]))}
          ${card(t("Resolving the card", "Resolver a carta"), steps([
            t("In the End of Turn phase, if every condition is met, the last contributor sets the discs aside, flips the card and reads the story aloud.", "Na fase de fim de turno, se todas as condições foram cumpridas, o último a contribuir separa os discos, vira a carta e lê a história."),
            t("Every contributor gains the reward; then resolve the consequences.", "Todos os que contribuíram recebem a recompensa; depois resolva as consequências."),
            t("Return the card to the box, shuffle the map tokens back to the supply, everyone takes back their discs, and the active player reveals and reads the next card.", "Devolva a carta à caixa, embaralhe as fichas de mapa de volta, todos recuperam os discos, e o jogador ativo revela e lê a próxima carta.")
          ]), refs(["blood", 7]))}
          ${card(t("Risk die", "Dado de risco"), steps([
            t("Once during your Action phase (not while an action is resolving), announce the roll.", "Uma vez na sua fase de ações (não durante a resolução de uma ação), anuncie a rolagem."),
            t("Choose a bonus first: draw 1 poker card, gain $10, or move 1 space (not a move action).", "Escolha um bônus antes: comprar 1 carta, ganhar $10, ou mover 1 espaço (não é ação de mover)."),
            t("Roll and apply the face: Story points, wounds or both. Then take your bonus.", "Role e aplique a face: pontos de História, ferimentos ou ambos. Depois receba o bônus.")
          ]), refs(["blood", 8], ["faq", 3]))}
        </div>`;
    }
    return `
      ${sectionHeading("stories", t("Story cards", "Cartas de história"), index, refs(["core", 14], ["core", 15]))}
      <div class="content-grid">
        ${card(t("Triggers and discs", "Gatilhos e discos"), list([
          t("The back of the top card of each story deck shows its trigger. When you meet a trigger during your turn, you may place 1 story disc on the first free space of that card.", "O verso da carta do topo de cada baralho mostra o gatilho. Ao cumprir um gatilho no seu turno, você pode colocar 1 disco no primeiro espaço livre daquela carta."),
          t("Only on your own turn, and at most 1 disc on 1 story card per turn. If both cards show the same trigger, choose one.", "Só no seu turno, e no máximo 1 disco em 1 carta por turno. Se as duas mostrarem o mesmo gatilho, escolha uma."),
          t("If both your discs are already placed, you may move one from the other card to the triggered card.", "Se seus dois discos já estiverem colocados, você pode mover um da outra carta para a carta acionada."),
          t(`A card resolves at the end of the turn of whoever places its ${m.discs === 2 ? "2nd" : "3rd"} disc (${m.discs} discs with ${m.players} players).`, `A carta resolve no fim do turno de quem colocar o ${m.discs === 2 ? "2º" : "3º"} disco (${m.discs} discos com ${m.players} jogadores).`),
          t("“Gain 2 or more LP from a single action” counts every reward caused by that action (for example an arrest that also completes a track), but not LP gained in the End of Turn phase.", "“Ganhe 2 ou mais LP com uma única ação” conta todas as recompensas causadas por aquela ação (por exemplo uma prisão que também completa uma trilha), mas não LP ganho na fase de fim de turno.") + " " + ref("faq", 3),
          m.gbh || m.mode === "serenade" || m.mode === "law" || m.border ? t("“Initiate a fight with another player”: starting the fight is enough; you contribute even if you lose.", "“Inicie uma luta com outro jogador”: basta iniciar a luta; você contribui mesmo se perder.") + " " + ref("gbh", 1) : ""
        ]), refs(["core", 14]))}
        ${card(t("Resolving a story card", "Resolver uma carta de história"), steps([
          t("Remove the discs (owners take them back). Read the narrative text aloud.", "Retire os discos (os donos os recuperam). Leia o texto narrativo."),
          t("Every player who contributed gains the reward once, even with 2 discs on it." + ((m.gbh || m.wild || m.blood) ? " A Legendary item reward is drawn facedown from the Legendary item pile; still only 1 per player." : ""), "Cada jogador que contribuiu recebe a recompensa uma vez, mesmo com 2 discos." + ((m.gbh || m.wild || m.blood) ? " Recompensa de item Lendário é comprada virada da pilha Lendária; ainda só 1 por jogador." : "")) + (m.gbh ? ` ${ref("gbh", 1)}` : ""),
          t("Spawn bandits at the hideouts shown (only unoccupied ones).", "Crie bandidos nos esconderijos indicados (só nos desocupados)."),
          t("If the Sheriff is active, the resolving player moves him the distance printed on the card (0–6, or “up to” that number when the card says so) along any path they choose; this can cause an arrest attempt.", "Se o Xerife estiver ativo, quem resolve o move a distância impressa na carta (0–6, ou “até” esse número quando a carta diz) por qualquer caminho; isso pode gerar tentativa de prisão."),
          t("Remove that story card from its deck. The new top card, still facedown, is the next available story and its back is the new trigger. Spent story cards are not reshuffled.", "Retire essa carta de história do baralho. A nova carta do topo, ainda virada, é a próxima história disponível e o verso é o novo gatilho. Cartas de história usadas não são reembaralhadas."),
          t("Follow the order of operations on the card: a reward you just gained can already satisfy a later clause.", "Siga a ordem de operações da carta: uma recompensa recém-ganha já pode satisfazer uma cláusula seguinte.") + " " + ref("faq", 3)
        ]), refs(["core", 14], ["core", 15]))}
        ${m.mib ? card(t("Man in Black and stories", "Man in Black e histórias"), `<p>${t("The Man in Black never places story discs.", "O Man in Black nunca coloca discos de história.")}</p>`, ref("faq", 8)) : ""}
      </div>`;
  }

  function cardsSection(index) {
    const m = match();
    const cards = [];
    cards.push(card(t("Poker card effects", "Efeitos das cartas de pôquer"), list([
      t("<strong>ACTION:</strong> costs an action on your turn; discard the card after resolving.", "<strong>ACTION:</strong> custa uma ação no seu turno; descarte a carta depois."),
      t("<strong>BONUS:</strong> applies after cards are revealed, only when its condition is met; no action, also outside your turn. Using a card for its Action does not trigger its Bonus.", "<strong>BONUS:</strong> vale depois da revelação, só se a condição for cumprida; sem ação, também fora do seu turno. Usar a carta pela Ação não ativa o Bonus.") + " " + ref("core", 23),
      t("<strong>REACTION:</strong> play from hand when its condition happens; no action, also outside your turn. Normally only 1 Reaction per triggering event (you cannot chain two Sprints after one move); fights are the exception where players trade Reactions.", "<strong>REACTION:</strong> jogue da mão quando a condição acontecer; sem ação, também fora do turno. Normalmente só 1 Reação por evento gatilho (não dá para emendar dois Sprints num movimento); lutas são a exceção onde se trocam Reações.") + " " + ref("faq", 5),
      t("A card played as your fight card counts only for its value, so you can still play another copy as a Reaction. “Value” means the number only, never the suit. Bonus and Reaction modifiers stack.", "Uma carta jogada como carta de luta conta só pelo valor, então dá para jogar outra cópia como Reação. “Valor” é só o número, nunca o naipe. Modificadores de Bonus e Reação se acumulam.") + " " + refs(["faq", 4], ["faq", 5], ["faq", 6]),
      t("Instincts (9) Bonus triggers on any effect that uses the word “discard”" + (m.ante ? " (for example paying a frontier cost)" : "") + ". Names such as Manhunt, Reputation, Holster, Sprint, Saddle Up and Living Legend are individual cards or character abilities: follow the text printed on them.", "O Bonus de Instincts (9) dispara em qualquer efeito com a palavra “descartar”" + (m.ante ? " (por exemplo pagar uma fronteira)" : "") + ". Nomes como Manhunt, Reputation, Holster, Sprint, Saddle Up e Living Legend são cartas ou habilidades de personagem: siga o texto impresso nelas.") + " " + ref("faq", 4),
      t("When the deck runs out, shuffle the discard pile into a new deck and keep drawing.", "Quando o baralho acabar, embaralhe o descarte como novo baralho e continue comprando.")
    ]), refs(["core", 20])));
    cards.push(card(t("Items", "Itens"), list([
      t("Mounts give movement; weapons give fight bonuses. You may own several, but only your active mount and active weapon work during your turn. Both can be upgraded (pay the cost again) for extra effects and end-game LP (top-left corner).", "Montarias dão movimento; armas dão bônus em lutas. Você pode ter várias, mas só a montaria e a arma ativas funcionam no seu turno. Ambas podem ser melhoradas (pagando o custo de novo) para efeitos extras e LP no final (canto superior esquerdo)."),
      t("Miscellaneous items cannot be upgraded; at most 3. You can only free a slot with items that discard themselves (such as Provisions or Whiskey). Discarded items return to the General Store stand.", "Itens diversos não são melhorados; no máximo 3. Só se libera espaço com itens que se descartam (como Provisions ou Whiskey). Itens descartados voltam ao expositor do Armazém."),
      t("Never more than 1 copy of the same item. Item and weapon abilities can trigger every time their condition happens.", "Nunca mais de 1 cópia do mesmo item. Habilidades de itens e armas disparam toda vez que a condição acontecer.") + " " + ref("faq", 7),
      (m.gbh || m.wild || m.blood) ? t("Legendary items are mounts, weapons or miscellaneous items that can never be upgraded; some give end-game LP. Gaining one when you already have 3 miscellaneous items lets you discard another to make room. Discarded Legendary items return to their deck, which is reshuffled.", "Itens Lendários são montarias, armas ou itens diversos que nunca são melhorados; alguns dão LP no final. Ganhar um tendo 3 diversos permite descartar outro para abrir espaço. Lendários descartados voltam ao baralho, que é reembaralhado.") + " " + refs(["gbh", 2], ["wild", 4], ["faq", 7]) : ""
    ]), refs(["core", 19])));
    cards.push(card(t("Wounds", "Ferimentos"), list([
      t("Each wound lowers your hand limit by 1 and costs 1 LP at the end of the game. Maximum 3 wounds.", "Cada ferimento reduz o limite da mão em 1 e custa 1 LP no fim do jogo. Máximo 3."),
      t("At the maximum you can still “gain” wounds for effects that trigger on gaining them (such as Doc Holliday drawing a card).", "No máximo você ainda “ganha” ferimentos para efeitos que disparam ao ganhar (como Doc Holliday comprando carta).") + " " + ref("faq", 4),
      t("Losing any fight gives exactly 1 wound, unless a card says otherwise.", "Perder qualquer luta dá exatamente 1 ferimento, salvo carta dizendo o contrário.") + " " + ref("faq", 4),
      t("Heal: Doctor's Office ($10, lose all, draw 1 per wound)" + (m.border ? " — not used in Border Town, use your Homestead's Recuperate" : "") + ", Bulletproof in a fight, Whiskey, Provisions.", "Curar: Consultório ($10, perde todos, compra 1 por ferimento)" + (m.border ? " — não usado no Border Town, use Recuperar na Propriedade" : "") + ", Bulletproof numa luta, Whiskey, Provisions.")
    ]), refs(["core", 20])));
    if (m.injuries) {
      cards.push(card(t("Injury cards", "Ferimentos graves"), list([
        t("When you would gain 1 or more wounds beyond your maximum, draw 1 injury card (only 1 even if several wounds come from one source), resolve it and keep it by your mat (immediate and/or ongoing effect).", "Quando você ganharia 1 ou mais ferimentos além do máximo, compre 1 carta de ferimento grave (só 1 mesmo que vários venham de uma fonte), resolva e guarde junto ao tabuleiro (efeito imediato e/ou contínuo).") + " " + ref("faq", 2),
        t("You can hold only 1 injury. While you have one, every wound you gain also makes you discard 1 poker card — even if you have partly healed.", "Só se pode ter 1 ferimento grave. Enquanto tiver um, cada ferimento ganho também obriga a descartar 1 carta — mesmo após cura parcial.") + " " + ref("faq", 2),
        t("Lose all your wounds to discard the injury (shuffle it back into the injury deck). Injuries are not wounds; some cost LP at the end (printed at the bottom).", "Perca todos os ferimentos para descartar o ferimento grave (embaralhe de volta). Ferimento grave não é ferimento; alguns custam LP no final (impresso embaixo).")
      ]), refs(["blood", 8])));
    }
    return `
      ${sectionHeading("cards", t("Poker cards, items and wounds", "Cartas de pôquer, itens e ferimentos"), index, refs(["core", 19], ["core", 20]))}
      <p class="section-lead">${t("Hand limit: 5 poker cards minus 1 per wound, checked only at the end of your turn.", "Limite da mão: 5 cartas menos 1 por ferimento, verificado só no fim do seu turno.")}</p>
      <div class="content-grid">${cards.join("")}</div>`;
  }

  function expansionSection(index) {
    const m = match();
    const cards = [];
    if (m.ante) {
      cards.push(card(t("Event cards and event tokens", "Cartas e fichas de evento"), list([
        t("An event card tells you what to place and where. Every token it places is an event token, even if placed by other means.", "A carta de evento diz o que colocar e onde. Toda ficha colocada é ficha de evento, mesmo que posta de outra forma."),
        t("A token is placed only on an unoccupied space — no mini and no token of any kind. Gold nuggets ignore this. If something cannot be placed, that part does nothing and no replacement event is drawn.", "Uma ficha só vai para espaço desocupado — sem miniatura nem ficha de qualquer tipo. Pepitas ignoram isso. Se algo não puder ser colocado, essa parte não acontece e nenhum evento substituto é comprado.") + " " + refs(["ante", 6], ["faq", 1], ["faq", 3]),
        t("If interacting with a token needs an action, its card says so; otherwise (for example Ol' Flippy, Grizzly Bear) it triggers when a player moves into its space — not for a player already there, and not when you only pass through by rail.", "Se interagir com a ficha exigir ação, a carta diz; senão (por exemplo Ol' Flippy, Grizzly Bear) ela dispara quando um jogador entra no espaço — não para quem já está lá, nem ao só passar de trem.") + " " + refs(["faq", 1], ["faq", 2]),
        t("After a token is triggered, return it to the box (outlaws, claim jumpers and high rollers go back to the event token supply).", "Depois de acionada, a ficha volta à caixa (fora da lei, ladrões e apostadores voltam ao suprimento de fichas de evento)."),
        m.wild ? t("Unique events (blue cards, Wild Bunch): spawn the matching blue token as the card says and keep the card beside the board as a reference.", "Eventos únicos (cartas azuis, Wild Bunch): crie a ficha azul correspondente como a carta diz e deixe a carta ao lado do tabuleiro como referência.") + " " + ref("wild", 4) : ""
      ]), refs(["ante", 6])));
      cards.push(card(t("Longhorns and loose gold", "Longhorns e ouro solto"), list([
        t("Get longhorns by an action in their space, as a frontier reward (automatic, must keep) or by robbing someone who has one.", "Obtenha longhorns com uma ação no espaço deles, como recompensa de fronteira (automático, é obrigatório ficar) ou roubando quem tem.") + " " + ref("faq", 2),
        t("Carry any number, apart from normal cattle; each lowers your movement by 1 (minimum 1).", "Carregue quantos quiser, à parte do gado normal; cada um reduz o movimento em 1 (mínimo 1)."),
        t("Drop them like cattle (after ending a move action) at any Ranch, either Rail Station or the Outlaw Camp: 1 LP + $30 each. This is not wrangling or rustling, so no Marshal/Wanted point.", "Entregue-os como gado (após terminar uma ação de mover) em qualquer Rancho, qualquer Estação ou no Acampamento Fora da Lei: 1 LP + $30 cada. Não é conduzir nem roubar gado, então não dá ponto de Delegado/Procurado.") + " " + ref("faq", 2),
        t("Arrested: discard all longhorns. Robbed: the robber may take 1 longhorn instead of a cattle token.", "Preso: descarte todos os longhorns. Roubado: o ladrão pode pegar 1 longhorn em vez de uma ficha de gado."),
        t("Gold nuggets lying on the board: after ending a move action there, pick up any number up to your capacity (no action).", "Pepitas soltas no tabuleiro: após terminar uma ação de mover ali, pegue quantas couberem (sem ação)."),
        t("Timing: these happen “after” a move action ends, so a Sprint must be played before them, never after.", "Tempo: isso acontece “depois” do fim da ação de mover, então um Sprint deve ser jogado antes, nunca depois.") + " " + ref("faq", 6)
      ]), refs(["ante", 6], ["ante", 7])));
    }
    if (m.goals || m.ante) {
      cards.push(card(t("Goal cards and legendary tokens", "Objetivos e fichas lendárias"), list([
        m.goals ? t("On your own turn only, when you meet a goal's requirement all at once, reveal it and announce it — no action needed; several per turn allowed; at most 3 goals per game. No penalty for unfinished goals.", "Só no seu turno, ao cumprir de uma vez o requisito de um objetivo, revele-o e anuncie — sem gastar ação; vários por turno; no máximo 3 por partida. Sem penalidade pelos não cumpridos.") + " " + refs(["core", 22], ["faq", 9]) : "",
        m.goals ? t("Discarding an item to complete a goal is a cost: you do not get that item's Action effect.", "Descartar um item para cumprir um objetivo é custo: você não recebe o efeito de Ação do item.") + " " + ref("faq", 9) : "",
        m.goals ? t("Completing your Nth goal: draw N tokens, look at them together with yours and keep (tokens you had + 1), never more than 3.", "Ao cumprir seu N-ésimo objetivo: compre N fichas, veja-as junto com as suas e fique com (as que tinha + 1), nunca mais de 3.") + " " + ref("faq", 9) : "",
        m.ante ? t("Other sources (Gambler track, frontier tokens, card effects" + (m.goals ? ", completed goals" : "") + "): draw the number gained and keep up to 3 in total, choosing the best.", "Outras fontes (trilha de Apostador, fichas de fronteira, efeitos de carta" + (m.goals ? ", objetivos cumpridos" : "") + "): compre a quantidade ganha e fique com até 3 no total, escolhendo as melhores.") + " " + ref("faq", 9) : "",
        t("Tokens stay facedown and add their value (1–3 LP) to your final score. The 18 core tokens: 6 × 1 LP, 9 × 2 LP, 3 × 3 LP" + (m.ante ? "; Ante Up adds 9 more" : "") + ".", "As fichas ficam viradas e somam seu valor (1–3 LP) no final. As 18 da base: 6 × 1 LP, 9 × 2 LP, 3 × 3 LP" + (m.ante ? "; o Ante Up adiciona mais 9" : "") + ".")
      ]), refs(["core", 22])));
    }
    if (m.title) {
      cards.push(card(t("Title card", "Carta de título"), `<p>${t("The revealed title card's rule is in force all game and overrides the rulebook where they conflict. Shootist's LP for winning against a player also applies when you win as the defender. Vigilante's LP for defeating a bandit comes on top of the normal choice of 1 LP or 1 MP (or WP).", "A regra da carta de título revelada vale a partida toda e prevalece sobre o livro em conflito. O LP do Shootist por vencer um jogador vale também quando você vence como defensor. O LP do Vigilante por derrotar bandido vem além da escolha normal de 1 LP ou 1 MP (ou WP).")}</p>`, refs(["wild", 2], ["faq", 3])));
    }
    return cards.length ? `
      ${sectionHeading("systems", t("Expansion systems", "Sistemas das expansões"), index, (m.ante ? refs(["ante", 6], ["ante", 7]) : "") + (m.goals ? ` ${ref("core", 22)}` : ""))}
      <div class="content-grid">${cards.join("")}</div>` : "";
  }

  function mibSection(index) {
    const m = match();
    if (!m.mib) {
      return "";
    }
    return `
      ${sectionHeading("mib", t("The Man in Black (2 players)", "O Man in Black (2 jogadores)"), index, refs(["core", 22], ["faq", 8], ["faq", 9]))}
      <div class="content-grid">
        ${card(t("His turn", "O turno dele"), list([
          t("Once per round, after both players have taken their turns, draw and resolve 1 Man in Black card (move him, fight, spawn bandits at the hideouts shown by a bandit icon, and so on).", "Uma vez por rodada, depois que os dois jogadores jogaram, compre e resolva 1 carta do Man in Black (movê-lo, lutar, criar bandidos nos esconderijos do ícone de bandido etc.)."),
          t("He is an NPC that acts like a third player: he gains LP, but never Marshal points, Wanted points or wounds, and never places story discs. He has unlimited money and gold nuggets.", "Ele é um NPC que age como terceiro jogador: ganha LP, mas nunca pontos de Delegado, de Procurado ou ferimentos, e nunca põe discos de história. Tem dinheiro e pepitas ilimitados."),
          t("When a card says he removes a bandit and gains 1 LP, he gains it only if a bandit was actually removed.", "Quando uma carta diz que ele remove um bandido e ganha 1 LP, só ganha se um bandido foi de fato removido.")
        ]), refs(["faq", 8], ["faq", 9]))}
        ${card(t("Fighting him", "Lutar com ele"), list([
          t("A player in his space may Duel or Rob him (you cannot Arrest him: he has no Wanted points).", "Um jogador no espaço dele pode Duelar ou Roubar (não dá para Prender: ele não tem pontos de Procurado)."),
          t("After the player chooses their poker card, draw the top 3 fight cards; he uses the highest value. Lower the player's card value by 1. He wins all ties (even against Jesse James). Return the fight cards to the bottom in random order.", "Depois que o jogador escolhe a carta, compre as 3 cartas de luta do topo; ele usa a de maior valor. Reduza em 1 o valor da carta do jogador. Ele vence todos os empates (até contra Jesse James). Devolva as cartas ao fundo em ordem aleatória."),
          t("Results are treated as if he were a player, and only the active player earns rewards: if he attacks you and you win, you just avoid the loss.", "Os resultados são tratados como se ele fosse jogador, e só o ativo recebe recompensas: se ele ataca e você vence, você só evita a derrota."),
          t("Robbing him: gain 1 Wanted point and take $60 or 2 gold nuggets from the supply.", "Roubá-lo: ganhe 1 ponto de Procurado e pegue $60 ou 2 pepitas do suprimento.")
        ]), refs(["faq", 8]))}
        ${card(t("Game end with him", "Fim de jogo com ele"), `<p>${t(`If he reaches ${m.lp} LP he triggers the end: finish the round, then everyone, him included, takes one more turn. If he has the most LP — or ties for most — he wins.`, `Se ele chegar a ${m.lp} LP aciona o fim: termine a rodada e então todos, ele incluído, fazem mais um turno. Se ele tiver mais LP — ou empatar no topo — ele vence.`)}</p>`, refs(["faq", 8]))}
      </div>`;
  }

  function modeSection(index) {
    const m = match();
    if (!m.bloodMode && m.mode !== "first") {
      return "";
    }
    const rules = {
      first: [
        t("Core box only, 3–4 players, the 4 listed characters, a single 20-card story deck, no cattle tokens and no Acquire Cattle action, no goal cards, no Whiskey/Ten-Gallon/Miner's Map, Billy the Kid starts. The first player to reach 15 LP triggers the end.", "Somente a caixa base, 3–4 jogadores, os 4 personagens listados, um único baralho de 20 histórias, sem fichas de gado e sem a ação Adquirir Gado, sem objetivos, sem Whiskey/Ten-Gallon/Miner's Map, Billy the Kid começa. O primeiro a chegar a 15 LP aciona o fim.")
      ],
      serenade: [
        t("Everyone starts with 2 extra poker cards.", "Todos começam com 2 cartas de pôquer extras."),
        t("No Traveling Trader: Legendary items are gained only through game effects. No deeds.", "Sem Mercador Viajante: itens Lendários só por efeitos de jogo. Sem escrituras.")
      ],
      golden: [
        t("End of game: 1 LP for every $40 instead of every $60.", "Fim de jogo: 1 LP a cada $40 em vez de $60."),
        t("End of game: the player with the greatest combined value of items, money and deeds gains 1 LP. Upgraded mounts and weapons count only their base cost; Legendary items count $40. (The book does not cover ties; letting each tied player gain it is our suggestion.)", "Fim de jogo: o jogador com maior valor somado de itens, dinheiro e escrituras ganha 1 LP. Montarias e armas melhoradas contam só o custo base; itens Lendários valem $40. (O livro não trata empates; dar a cada empatado é sugestão nossa.)"),
        t("Injury cards are not used.", "Cartas de ferimento grave não são usadas.")
      ],
      law: [
        t("Infamous: when a Wanted player is arrested (by a player or the Sheriff), after drawing their card for losing and after both the Sheriff and their mini are placed in the office, they may discard their entire hand of poker cards. If they do, they do not lose all Wanted points: their cube moves to space 1 of the Wanted track instead. The Sheriff does not try to arrest them again this turn. Every other arrest effect still applies.", "Infame: quando um Procurado é preso (por jogador ou pelo Xerife), depois de comprar a carta da derrota e de o Xerife e a miniatura irem para o escritório, ele pode descartar a mão inteira. Se fizer, não perde todos os pontos de Procurado: o cubo vai para o espaço 1 da trilha. O Xerife não tenta prendê-lo de novo neste turno. Todos os outros efeitos da prisão continuam."),
        t("The Gang/Posse variant is in play. No deeds.", "A variante de Gangue/Bando está em jogo. Sem escrituras.")
      ],
      risky: [
        t("Each time your cube reaches space 4 of the Story track, gain 1 LP in addition to the reward you choose there.", "Cada vez que seu cubo chegar ao espaço 4 da trilha de História, ganhe 1 LP além da recompensa escolhida."),
        t("All event cards are used, and the Goal Cards Variant is mandatory.", "Todas as cartas de evento são usadas, e a variante de objetivos é obrigatória.")
      ],
      border: [
        t("Played only on the Buzzard Gulch board; the 3 Bandit Hideout and 2 Mine tokens are real locations. The Bank, Cabaret and Doctor's Office are not used; the Marshal's Office is also the Sheriff's Office.", "Jogado só no tabuleiro de Buzzard Gulch; as 3 fichas de Esconderijo e 2 de Mina são locais de verdade. Banco, Cabaré e Consultório não são usados; o Escritório do Delegado também é o do Xerife."),
        t("Card text naming a location or region of the main board uses the Buzzard Gulch equivalent; if several qualify, the active player chooses (for example “Sunny Hills Mine” → either Buzzard Gulch mine).", "Texto de carta que cita local ou região do tabuleiro principal usa o equivalente em Buzzard Gulch; se houver vários, o jogador ativo escolhe (por exemplo “Sunny Hills Mine” → qualquer mina de Buzzard Gulch)."),
        t("Gold nuggets cannot be deposited; spend them as $20 each (outside the $120 cap). Each nugget left at the end is worth 1 LP.", "Pepitas não podem ser depositadas; gaste-as como $20 cada (fora do limite de $120). Cada pepita no final vale 1 LP."),
        t("Train circuit: Buzzard Gulch Rail Station → Mountain Pass A → Mountain Pass C → back. The Train mini stays on Buzzard Gulch. Rail travel and the Mountain Pass trail are not used: both would leave this board. Mountain Passes are only Train checkpoints here.", "Circuito do Trem: Estação de Buzzard Gulch → Passagem A → Passagem C → volta. A miniatura do Trem fica em Buzzard Gulch. Viagem de trem e a trilha da Passagem não são usadas: as duas sairiam deste tabuleiro. Aqui as Passagens são só pontos de parada do Trem."),
        t("Settler action and Homestead (Improvement, Recuperate): see Location actions.", "Ação de colono e Propriedade (Melhoria, Recuperar): veja Ações de local."),
        t("General Store and Trading Post are one store. No Traveling Trader, no deeds. With 2 players there is no Man in Black.", "Armazém e Entreposto são uma loja. Sem Mercador Viajante, sem escrituras. Com 2 jogadores não há Man in Black.")
      ]
    }[m.mode];
    const general = m.bloodMode ? card(t("General game-mode rules", "Regras gerais dos modos"), list([
      t("Follow the normal Blood Money setup and every Western Legends rule, except where the mode says otherwise.", "Siga a preparação normal do Blood Money e todas as regras de Western Legends, exceto onde o modo diz o contrário."),
      t("Variants are not used unless the mode names them.", "Variantes não são usadas a menos que o modo as cite."),
      t("Listed small-expansion content marked as required is essential; any other listed character or item you do not own is simply skipped.", "Conteúdo de expansão pequena marcado como obrigatório é essencial; qualquer outro personagem ou item listado que você não tenha é apenas pulado.")
    ]), refs(["blood", 13])) : "";
    return `
      ${sectionHeading("mode", t(`Mode rules: ${modeTitle(m.mode)}`, `Regras do modo: ${modeTitle(m.mode)}`), index, modeRefs(m.mode))}
      <div class="content-grid">${card(t("Special rules", "Regras especiais"), list(rules), modeRefs(m.mode))}${general}</div>`;
  }

  function endSection(index) {
    const m = match();
    const scoring = [
      t("+ LP shown on each upgraded mount and upgraded weapon you own.", "+ LP de cada montaria e arma melhorada que você tiver."),
      (m.gbh || m.wild || m.blood) ? t("+ LP shown on your Legendary items.", "+ LP dos seus itens Lendários.") : "",
      m.mode === "golden" ? t("+ 1 LP per full $40 you have (Golden Rule).", "+ 1 LP a cada $40 completos (Golden Rule).") : t("+ 1 LP per full $60 you have (no rounding).", "+ 1 LP a cada $60 completos (sem arredondar)."),
      m.border ? t("+ 1 LP per gold nugget you have.", "+ 1 LP por pepita que você tiver.") : "",
      t("− 1 LP per wound.", "− 1 LP por ferimento."),
      m.injuries ? t("− LP printed at the bottom of your injury card, if any.", "− LP impresso embaixo do seu ferimento grave, se houver.") : "",
      t("Most Wanted: + 3 LP (if tied, each tied player + 1 LP instead); every other Wanted player + 1 LP.", "Mais Procurado: + 3 LP (empate: cada empatado + 1 LP); cada outro Procurado + 1 LP."),
      t("Marshals: + LP for their row on the Marshal track (1 / 2 / 3).", "Delegados: + LP pela linha na trilha de Delegado (1 / 2 / 3)."),
      m.ante ? t("Farthest on the Gambler track: + 1 LP (each tied player gains it).", "Mais à frente na trilha de Apostador: + 1 LP (cada empatado ganha).") : "",
      (m.goals || m.ante) ? t("+ the value of your legendary tokens (at most 3).", "+ o valor das suas fichas lendárias (no máximo 3).") : "",
      m.deeds ? t("+ LP from your deeds' scoring sides (flip unused ones first); deeds of ruined locations score nothing. Example: 3 Saloon deeds score 3 LP each (9 LP).", "+ LP do lado de pontuação das escrituras (vire as não usadas antes); escrituras de locais arruinados não pontuam. Exemplo: 3 escrituras de Saloon valem 3 LP cada (9 LP).") + " " + refs(["blood", 10], ["faq", 1]) : "",
      m.mode === "golden" ? t("Greatest combined value of items, money and deeds: + 1 LP (see Mode rules).", "Maior valor somado de itens, dinheiro e escrituras: + 1 LP (veja Regras do modo).") : ""
    ];
    return `
      ${sectionHeading("end", t("End of the game and scoring", "Fim do jogo e pontuação"), index, refs(["core", 21]) + (m.blood ? ` ${ref("blood", 11)}` : "") + (m.ante ? ` ${ref("ante", 14)}` : ""))}
      <div class="content-grid">
        ${card(t("Trigger and final round", "Gatilho e rodada final"), steps([
          t(`At the end of a turn, a player with ${m.lp} LP or more triggers the end.`, `No fim de um turno, um jogador com ${m.lp} LP ou mais aciona o fim.`),
          t("Finish the current round (until the player to the right of the first player has played).", "Termine a rodada atual (até jogar o jogador à direita do primeiro jogador)."),
          t("Then, starting with the first player, everyone — including the one who triggered it — takes one last turn, so everybody has the same number of turns." + (m.mib ? " The Man in Black takes his final turn too." : ""), "Depois, a partir do primeiro jogador, todos — inclusive quem acionou — fazem um último turno, para que todos tenham o mesmo número de turnos." + (m.mib ? " O Man in Black também faz o último turno." : "")),
          t("Then calculate final scores.", "Então calcule a pontuação final.")
        ]), refs(["core", 6], ["core", 21]))}
        ${card(t("Final scoring for this match", "Pontuação final desta partida"), list(scoring), refs(["core", 21]) + (m.blood ? ` ${ref("blood", 11)}` : "") + (m.bloodMode ? ` ${ref("blood", MODE_INFO[m.mode].page)}` : ""))}
        ${card(t("Winner and ties", "Vencedor e empates"), steps([
          t("Most LP wins.", "Mais LP vence."),
          t("Tie: the tied player with the most Marshal or Wanted points.", "Empate: o empatado com mais pontos de Delegado ou de Procurado."),
          t("Still tied: most gold nuggets.", "Ainda empatado: mais pepitas."),
          t("Still tied: fewest wounds.", "Ainda empatado: menos ferimentos."),
          t("Still tied: shared victory." + (m.mib ? " Any tie with the Man in Black goes to him." : ""), "Ainda empatado: vitória compartilhada." + (m.mib ? " Qualquer empate com o Man in Black é dele." : ""))
        ]), refs(["core", 21]))}
      </div>`;
  }

  // --- Iconography, examples, glossary ------------------------------------

  function iconList(m) {
    const icon = (file, en, pt, textEn, textPt, book, page, show = true) => ({ file, en, pt, textEn, textPt, book, page, show });
    return [
      icon("general-store", "General Store", "Armazém", "Buy/upgrade items from a touching space.", "Compre/melhore itens a partir de um espaço adjacente.", "core", 12),
      icon("saloon", "Saloon", "Saloon", "Poker" + (m.ante ? ", faro, high rollers" : "") + " from a touching space.", "Pôquer" + (m.ante ? ", faro, apostadores" : "") + " a partir de espaço adjacente.", "core", 12),
      icon("mine", "Mine", "Mina", "Prospect for gold with both dice.", "Prospecte ouro com os dois dados.", "core", 12),
      icon("bank", "Bank", "Banco", "Deposit nuggets ($20 + 1 LP each) or heist.", "Deposite pepitas ($20 + 1 LP cada) ou assalte.", "core", 12, !m.border),
      icon("doctors-office", "Doctor's Office", "Consultório", "$10: lose all wounds, draw 1 card each.", "$10: perca todos os ferimentos, compre 1 carta por cada.", "core", 12, !m.border),
      icon("cabaret", "Cabaret", "Cabaré", "Revel: 1 LP per $30 spent.", "Festejar: 1 LP a cada $30 gastos.", "core", 12, !m.border),
      icon("sheriffs-office", "Sheriff's Office", "Escritório do Xerife", "Sheriff's start; arrested players go here.", "Início do Xerife; presos vêm para cá.", "core", 12, !m.border),
      icon("bandit-hideout", "Bandit Hideout", "Esconderijo de Bandidos", "Bandits start and spawn here.", "Bandidos começam e surgem aqui.", "core", 12),
      icon("rail-station", "Rail Station", "Estação Ferroviária", "Wrangle cattle" + (m.ante ? ", drop longhorns, travel by rail" : "") + ".", "Conduza gado" + (m.ante ? ", entregue longhorns, viaje de trem" : "") + ".", "core", 12),
      icon("ranch-green", t("Green Ranch", "Rancho verde"), t("Green Ranch", "Rancho verde"), "Acquire green cattle; rustle other colors here.", "Adquira gado verde; roube gado de outras cores aqui.", "core", 12, m.mode !== "first"),
      icon("ranch-blue", t("Blue Ranch", "Rancho azul"), t("Blue Ranch", "Rancho azul"), "Acquire blue cattle; rustle other colors here.", "Adquira gado azul; roube gado de outras cores aqui.", "core", 12, m.mode !== "first"),
      icon("die-gold-nugget", t("Die: gold nugget", "Dado: pepita"), t("Die: gold nugget", "Dado: pepita"), "Gain 1 gold nugget.", "Ganhe 1 pepita.", "core", 11),
      icon("die-tailings", t("Die: tailings", "Dado: rejeito"), t("Die: tailings", "Dado: rejeito"), "Gain $10.", "Ganhe $10.", "core", 11),
      icon("die-gold-dust", t("Die: gold dust", "Dado: pó de ouro"), t("Die: gold dust", "Dado: pó de ouro"), "Gain $10 and reroll this die.", "Ganhe $10 e role este dado de novo.", "core", 11),
      icon("die-gravel", t("Die: gravel", "Dado: cascalho"), t("Die: gravel", "Dado: cascalho"), "Nothing but gravel.", "Só cascalho, nada.", "core", 11),
      icon("bandit-spawn", t("Bandit spawn", "Surgimento de bandidos"), t("Bandit spawn", "Surgimento de bandidos"), "On story cards: spawn bandits at the lettered hideouts.", "Nas histórias: crie bandidos nos esconderijos com essas letras.", "core", 14, !m.legendary),
      icon("train", "Train", "Trem", "Moves each turn; heist it at its space.", "Move a cada turno; assalte-o no espaço dele.", "ante", 8, m.ante),
      icon("mountain-pass", "Mountain Pass", "Passagem de Montanha", "Trail action between the boards.", "Ação de trilha entre os tabuleiros.", "ante", 11, m.ante),
      icon("ranch-orange", t("Orange Ranch", "Rancho laranja"), t("Orange Ranch", "Rancho laranja"), "Buzzard Gulch Ranch (orange cattle).", "Rancho de Buzzard Gulch (gado laranja).", "ante", 10, m.ante),
      icon("frontier-space", t("Frontier space", "Espaço de fronteira"), t("Frontier space", "Espaço de fronteira"), "Printed number used in the frontier action.", "Número impresso usado na ação de fronteira.", "ante", 11, m.ante),
      icon("frontier-token", t("Frontier token", "Ficha de fronteira"), t("Frontier token", "Ficha de fronteira"), "Its number adds to the space's; flip for rewards.", "Seu número soma ao do espaço; vire para as recompensas.", "ante", 11, m.ante),
      icon("marshals-office", "Marshal's Office", "Escritório do Delegado", "Arrests in Buzzard Gulch territories go here.", "Prisões nos territórios de Buzzard Gulch vêm para cá.", "ante", 14, m.ante),
      icon("outlaw-camp", "Outlaw Camp", "Acampamento Fora da Lei", "Rustle any color, drop longhorns, outlaws.", "Roube gado de qualquer cor, entregue longhorns, fora da lei.", "ante", 14, m.ante),
      icon("token-outlaw", t("Outlaw token", "Ficha de fora da lei"), t("Outlaw token", "Ficha de fora da lei"), "Fight: cards above the line, reward below.", "Luta: cartas acima da linha, recompensa abaixo.", "ante", 6, m.ante),
      icon("token-claim-jumper", t("Claim jumper token", "Ficha de ladrão de concessão"), t("Claim jumper token", "Ficha de ladrão de concessão"), "Fight like an outlaw.", "Luta como fora da lei.", "ante", 6, m.ante),
      icon("token-high-roller", t("High roller token", "Ficha de apostador"), t("High roller token", "Ficha de apostador"), "At a Saloon: head-to-head poker, $20 ante.", "Num Saloon: pôquer cara a cara, aposta de $20.", "ante", 6, m.ante),
      icon("token-longhorn", t("Longhorn token", "Ficha de longhorn"), t("Longhorn token", "Ficha de longhorn"), "−1 movement each; drop for 1 LP + $30.", "−1 de movimento cada; entregue por 1 LP + $30.", "ante", 6, m.ante),
      icon("token-event", t("Event marker", "Marcador de evento"), t("Event marker", "Marcador de evento"), "First cube to reach it resolves an event.", "O primeiro cubo a alcançá-lo resolve um evento.", "ante", 6, m.ante),
      icon("trader-cart", t("Traveling Trader cart", "Carroça do Mercador"), t("Traveling Trader cart", "Carroça do Mercador"), "Trader actions in its region.", "Ações de mercador na região dela.", "blood", 9, m.trader),
      icon("map-token-o", t("Map token O", "Ficha de mapa O"), t("Map token O", "Ficha de mapa O"), "Resolve the story card's text for this token.", "Resolva o texto da história para esta ficha.", "blood", 7, m.legendary),
      icon("map-token-danger", t("“Danger” X map token", "Ficha de mapa X “perigo”"), t("“Danger” X map token", "Ficha de mapa X “perigo”"), "Revealer gains 1 wound at once.", "Quem revela ganha 1 ferimento na hora.", "blood", 7, m.legendary),
      icon("map-token-x", t("Map token X", "Ficha de mapa X"), t("Map token X", "Ficha de mapa X"), "Resolve the story card's text for this token.", "Resolva o texto da história para esta ficha.", "blood", 7, m.legendary)
    ].filter((item) => item.show);
  }

  function iconographySection(index) {
    const m = match();
    const icons = iconList(m);
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), index, refs(["core", 11], ["core", 12]))}
      <p class="section-lead">${t("Only icons relevant to this match are shown. Each image is cropped from the manual page linked on its card.", "Só aparecem os ícones relevantes nesta partida. Cada imagem foi recortada da página do manual indicada no cartão.")}</p>
      <div class="icon-grid wl-icon-grid">${icons.map((item) => `
        <article class="icon-card">
          <div class="manual-icon-frame"><img class="manual-icon" src="${ICON_DIR}${item.file}.webp" alt="${escapeHtml(t(item.en, item.pt))}" loading="lazy"></div>
          <div><h3>${t(item.en, item.pt)}</h3><p>${t(item.textEn, item.textPt)}</p>${ref(item.book, item.page)}</div>
        </article>`).join("")}</div>`;
  }

  function examplesSection(index) {
    const m = match();
    const examples = [
      {
        title: t("Duel with a start-of-fight ability", "Duelo com habilidade de início de luta"),
        text: t("Annie Oakley duels Bass Reeves in their space. Her ability makes him discard a card or take a wound; he discards. Both play facedown: Annie a King, Bass a Queen. Bass's upgraded Shotgun lowers Annie's King to a Queen. Tie — Annie is active and wins: she gains 2 LP; Bass gains 1 wound and draws 1 card. She cannot fight Bass again this turn.", "Annie Oakley duela com Bass Reeves no mesmo espaço. A habilidade dela o faz descartar uma carta ou ganhar ferimento; ele descarta. Ambos jogam virado: Annie um Rei, Bass uma Dama. A Shotgun melhorada de Bass reduz o Rei de Annie a Dama. Empate — Annie é a ativa e vence: ganha 2 LP; Bass ganha 1 ferimento e compra 1 carta. Ela não pode lutar com Bass de novo neste turno."),
        refHtml: ref("core", 8)
      },
      {
        title: t("Bandit fight with a Reaction", "Luta contra bandido com Reação"),
        text: t("Annie enters a bandit's space and stops. The player to her right draws 2 fight cards and plays a Jack; Annie plays a 10. After the reveal she plays Stick 'Em Up! to lower the Jack by 2 to a 9, and wins. The fight card's text still applies (she gets $10). She chooses 1 LP or 1 Marshal point; the bandit leaves the board.", "Annie entra no espaço de um bandido e para. O jogador à direita compra 2 cartas de luta e joga um Valete; Annie joga um 10. Após a revelação ela joga Stick 'Em Up! reduzindo o Valete em 2, para 9, e vence. O texto da carta de luta ainda vale (ela ganha $10). Ela escolhe 1 LP ou 1 ponto de Delegado; o bandido sai do tabuleiro."),
        refHtml: ref("core", 17)
      },
      ...(!m.border ? [{
        title: t("Bank heist", "Assalto ao Banco"),
        text: t("Billy the Kid robs the Darkrock Bank. The guard draws 3, 7 and J and plays the 3 (whose text would give 2 wounds). Billy reveals Bulletproof (Jack), cancelling those wounds, and wins with the higher card: $80 and 3 Wanted points.", "Billy the Kid assalta o Banco de Darkrock. O guarda compra 3, 7 e J e joga o 3 (cujo texto daria 2 ferimentos). Billy revela Bulletproof (Valete), cancelando os ferimentos, e vence com a carta maior: $80 e 3 pontos de Procurado."),
        refHtml: ref("core", 11)
      }] : []),
      {
        title: t("Hand limit at the end of turn", "Limite da mão no fim do turno"),
        text: t("Billy ends his turn with 6 poker cards and 2 wounds: his limit is 5 − 2 = 3, so he discards 3 cards. Being on space 2 of the Wanted track (row 1), he gains 1 LP.", "Billy termina o turno com 6 cartas e 2 ferimentos: o limite é 5 − 2 = 3, então ele descarta 3. Estando no espaço 2 da trilha de Procurado (linha 1), ganha 1 LP."),
        refHtml: ref("core", 13)
      },
      {
        title: t("Final round timing", "Tempo da rodada final"),
        text: t("In a 15 LP game, Blue reaches 15 LP. Blue finishes the turn, Purple (the last seat before the first player) plays to close the round, then starting with Red (first player) everyone takes one more turn, ending with Purple.", "Numa partida de 15 LP, Azul chega a 15 LP. Azul termina o turno, Roxo (último assento antes do primeiro jogador) joga para fechar a rodada e, a partir do Vermelho (primeiro jogador), todos fazem mais um turno, terminando no Roxo."),
        refHtml: ref("core", 21)
      }
    ];
    if (!m.legendary) {
      examples.push({
        title: t("Resolving a story card", "Resolvendo uma carta de história"),
        text: t("In a 5-player game Red places the 3rd disc on a story card. At the end of Red's turn the discs come off and Yellow, Blue and Red gain the reward once each. A bandit spawn fails where a bandit already stands and where a player is. Red, being Wanted, moves the Sheriff 3 spaces away from himself.", "Numa partida de 5, Vermelho coloca o 3º disco numa história. No fim do turno dele os discos saem e Amarelo, Azul e Vermelho recebem a recompensa uma vez cada. Um bandido não surge onde já há bandido nem onde há jogador. Vermelho, sendo Procurado, move o Xerife 3 espaços para longe."),
        refHtml: ref("core", 15)
      });
    }
    if (m.goals) {
      examples.push({
        title: t("Netting legendary tokens", "Saldo de fichas lendárias"),
        text: t("You already hold 2 legendary tokens" + (m.ante ? " (from the Gambler track)" : "") + " and complete your 2nd goal: draw 2, look at all 4 and keep 3 — a net gain of 1. Holding 3 and gaining another only lets you swap for better values.", "Você já tem 2 fichas lendárias" + (m.ante ? " (da trilha de Apostador)" : "") + " e cumpre o 2º objetivo: compre 2, olhe as 4 e fique com 3 — saldo de +1. Com 3 na mão, ganhar outra só permite trocar por valores melhores."),
        refHtml: ref("faq", 9)
      });
    }
    if (m.ante) {
      examples.push({
        title: t("Frontier action", "Ação de fronteira"),
        text: t("A frontier space printed 4 holds a token numbered 5: discard poker cards worth at least 9, for example a 10 alone (10/J/Q/K count 10, Aces 11). Flip the token, take its rewards and return it to the box.", "Um espaço de fronteira com 4 impresso tem uma ficha 5: descarte cartas que somem pelo menos 9, por exemplo um 10 sozinho (10/J/Q/K valem 10, Ás 11). Vire a ficha, receba as recompensas e devolva-a à caixa."),
        refHtml: ref("ante", 11)
      });
    }
    if (m.deeds) {
      examples.push({
        title: t("Deed scoring", "Pontuação de escrituras"),
        text: t("Dave owns the Darkrock and Red Falls Saloon deeds, the Red Falls Doctor's Office and the Darkrock Bank. Each Saloon deed scores 1 LP per Saloon he owns (2 + 2), the Doctor's Office 1 LP, and the Bank 1 LP per deed owned including itself (4): 9 LP.", "Dave tem as escrituras dos Saloons de Darkrock e Red Falls, do Consultório de Red Falls e do Banco de Darkrock. Cada Saloon vale 1 LP por Saloon que ele tem (2 + 2), o Consultório 1 LP, e o Banco 1 LP por escritura incluindo ele mesmo (4): 9 LP."),
        refHtml: ref("blood", 10)
      });
    }
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), index, refs(["core", 8], ["core", 21]))}
      <div class="example-grid">${examples.map((example, number) => `
        <article class="example-card">
          <span class="card-number">${String(number + 1).padStart(2, "0")}</span>
          <h3>${example.title}</h3>
          <p>${example.text}</p>
          <div class="example-source"><span>${t("Paraphrased from the manual", "Paráfrase do manual")}</span>${example.refHtml}</div>
        </article>`).join("")}</div>`;
  }

  function glossarySection(index) {
    const m = match();
    const terms = [
      [t("LP", "LP"), t("Legendary Points: the score. The LP track also shows the end of game marker.", "Pontos de Lenda: a pontuação. A trilha de LP também mostra o marcador de fim.")],
      [t("MP / WP", "MP / WP"), t("Marshal points / Wanted points, tracked on their own tracks. Never both at once.", "Pontos de Delegado / Procurado, cada um na sua trilha. Nunca os dois ao mesmo tempo.")],
      [t("Active player", "Jogador ativo"), t("The player taking the turn. Wins ties against other players and is the only one to earn a fight's reward.", "Quem está jogando o turno. Vence empates contra outros jogadores e é o único a ganhar a recompensa da luta.")],
      [t("NPC", "NPC"), t("Non-player character: bandits" + (m.border ? "" : ", the Bank guard") + (m.ante ? ", the train guard" : "") + ", the Sheriff, the poker dealer" + (m.ante ? ", outlaw/claim jumper tokens" : "") + (m.mib ? ", the Man in Black" : "") + ". NPCs win ties.", "Personagem não jogador: bandidos" + (m.border ? "" : ", o guarda do Banco") + (m.ante ? ", o guarda do trem" : "") + ", o Xerife, o crupiê" + (m.ante ? ", fichas de fora da lei/ladrão" : "") + (m.mib ? ", o Man in Black" : "") + ". NPCs vencem empates.")],
      [t("Fight card", "Carta de luta"), t("The 13-card deck the right-hand player draws from to play for an NPC" + (m.ante ? "; faro also uses it" : "") + ".", "O baralho de 13 cartas de onde o jogador à direita compra para jogar pelo NPC" + (m.ante ? "; o faro também o usa" : "") + ".")],
      [t("Location", "Local"), t("A space with a building or feature where location actions are taken; any location allows Work.", "Espaço com prédio ou elemento onde se fazem ações de local; qualquer local permite Trabalhar.")],
      [t("In town / outside of town", "Na cidade / fora da cidade"), t("Inside / outside the thick town borders.", "Dentro / fora das bordas grossas da cidade.")],
      [t("Unoccupied", "Desocupado"), t("A space with no mini (player, bandit, Sheriff)" + (m.ante ? " and no token" : "") + ". Required to spawn bandits" + (m.ante ? " or place event tokens; gold nuggets ignore it" : "") + ".", "Espaço sem miniatura (jogador, bandido, Xerife)" + (m.ante ? " e sem ficha" : "") + ". Exigido para criar bandidos" + (m.ante ? " ou colocar fichas de evento; pepitas ignoram" : "") + ".")],
      [t("Discard", "Descartar"), t("Only when an effect or cost says so. Poker cards go faceup to the right of the deck.", "Só quando um efeito ou custo manda. Cartas de pôquer vão abertas à direita do baralho.")],
      [t("Legendary ability", "Habilidade lendária"), t("Each character's extra power, active once you have 5+ LP. It must be unlocked when you start an action to apply at its end.", "Poder extra de cada personagem, ativo a partir de 5+ LP. Precisa estar liberado quando você começa a ação para valer no fim dela.") + " " + refs(["core", 6], ["faq", 10])]
    ];
    if (m.ante) {
      terms.push([t("GP", "GP"), t("Gambler points on the Gambler track.", "Pontos de Apostador na trilha de Apostador.")]);
      terms.push([t("Gambling", "Jogatina"), t("Poker, faro, high roller challenges" + (m.highStakes ? " and high stakes poker" : "") + ".", "Pôquer, faro, desafios de apostador" + (m.highStakes ? " e pôquer de apostas altas" : "") + ".")]);
      terms.push([t("Train checkpoint", "Ponto de parada"), t("Rail Stations, Mountain Passes and Bandit Hideouts where the Train stops.", "Estações, Passagens de Montanha e Esconderijos onde o Trem para.")]);
    }
    if (m.legendary) {
      terms.push([t("SP", "SP"), t("Story points on the Story track.", "Pontos de História na trilha de História.")]);
    }
    if (m.blood) {
      terms.push([t("Region", "Região"), t("A named area of the boards, used by trader movement cards.", "Área nomeada dos tabuleiros, usada pelas cartas de movimento do Mercador.")]);
      terms.push([t("Ruin token", "Ficha de ruína"), t("Marks a destroyed location: no claim, location or work actions there until repaired.", "Marca local destruído: sem ações de reivindicar, de local ou de trabalho até ser reparado.")]);
    }
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), index, refs(["core", 17], ["core", 23]))}
      <dl class="wl-glossary">${terms.map(([term, definition]) => `<div><dt>${term}</dt><dd>${definition}</dd></div>`).join("")}</dl>
      <p class="source-note">${t("Card text overrides this guide where it differs. Rules marked “interpretation” are not stated in the books; they are the most consistent reading of the rules.", "O texto das cartas prevalece sobre este guia em caso de divergência. Regras marcadas como “interpretação” não estão nos livros; são a leitura mais consistente das regras.")}</p>`;
  }

  // --- Page ---------------------------------------------------------------

  function navigation() {
    const m = match();
    const items = [
      ["configure-title", t("Match", "Partida")],
      ["overview", t("Overview", "Visão geral")],
      ["quick", t("Quick ref", "Referência")],
      ["setup", t("Setup", "Preparação")],
      ["turn", t("Turn", "Turno")],
      ["locations", t("Locations", "Locais")],
      ["fights", t("Fights", "Lutas")],
      ["tracks", t("Tracks", "Trilhas")],
      ["stories", t("Stories", "Histórias")],
      m.ante || m.goals ? ["systems", t("Systems", "Sistemas")] : null,
      m.mib ? ["mib", "Man in Black"] : null,
      m.bloodMode || m.mode === "first" ? ["mode", t("Mode", "Modo")] : null,
      ["end", t("Scoring", "Pontuação")],
      ["glossary", t("Glossary", "Glossário")]
    ].filter(Boolean);
    return `<nav class="wl-jump" aria-label="${t("Sections", "Seções")}">${items.map(([id, label]) => jump(id, label)).join("")}</nav>`;
  }

  function renderInto(host) {
    root = host;
    const m = match();
    document.body.classList.remove("theme-nem", "theme-avalon", "theme-pagan", "theme-odins-ravens");
    document.body.classList.add("theme-western-legends");
    document.documentElement.lang = prefs.language;
    document.title = t("Western Legends — Field Manual", "Western Legends — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "A bilingual interactive rulebook for Western Legends and its expansions, with game modes, filtered setup, turns, fights, scoring and source references.",
        "Livro de regras interativo e bilíngue de Western Legends e suas expansões, com modos de jogo, preparação filtrada, turnos, lutas, pontuação e referências."
      );
    }
    const sections = [
      overviewSection,
      quickReference,
      iconographySection,
      setupSection,
      turnSection,
      movementSection,
      locationsSection,
      gamblingSection,
      fightsSection,
      tracksSection,
      storiesSection,
      cardsSection,
      expansionSection,
      mibSection,
      modeSection,
      endSection,
      examplesSection,
      glossarySection
    ];
    let number = 0;
    const body = sections.map((build) => {
      const html = build(String(number + 1).padStart(2, "0"));
      if (!html) {
        return "";
      }
      number += 1;
      return `<section class="rule-section">${html}</section>`;
    }).join("");
    root.innerHTML = `
      <header class="site-header">
        <a class="brand" href="#/" aria-label="${t("Field Manual home", "Página inicial do Manual de Campo")}">
          <span class="brand-mark" aria-hidden="true">WL</span>
          <span class="brand-copy"><strong>Field Manual</strong><small>${t("Board-game rulebooks", "Livros de regras")}</small></span>
        </a>
        <div class="header-right">
          <nav class="primary-nav" aria-label="${t("Main navigation", "Navegação principal")}">
            <a href="#/">${t("Game index", "Índice de jogos")}</a>
          </nav>
          <div class="language-switch" role="group" aria-label="${t("Language", "Idioma")}">
            <button type="button" data-language="en-US" aria-pressed="${prefs.language === "en-US"}">EN-US</button>
            <button type="button" data-language="pt-BR" aria-pressed="${prefs.language === "pt-BR"}">PT-BR</button>
          </div>
        </div>
      </header>
      ${storageNotice ? `<p class="storage-notice" role="status">${storageNoticeText()}</p>` : ""}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("CORE · ANTE UP · BLOOD MONEY · SMALL EXPANSIONS · FAQ", "BASE · ANTE UP · BLOOD MONEY · EXPANSÕES PEQUENAS · FAQ")}</p>
          <h1>Western<br>Legends</h1>
          <p class="hero-intro">${t("Ride into a Wild West sandbox as a historical legend: rob or protect the Bank, drive cattle, gamble, mine gold and chase Legendary Points. This guide merges the core rulebook, every expansion and the official FAQ into one filtered reference.", "Entre num sandbox do Velho Oeste como uma lenda histórica: roube ou proteja o Banco, conduza gado, aposte, minere ouro e corra atrás de Pontos de Lenda. Este guia une o livro base, todas as expansões e o FAQ oficial numa referência filtrada.")}</p>
          <div class="hero-meta"><span>${t("2–6 players", "2–6 jogadores")}</span><span>${t("7 ways to play", "7 formas de jogar")}</span><span>${t(`This match: ${modeTitle(m.mode)}, ${m.players} players, ${m.lp} LP`, `Esta partida: ${modeTitle(m.mode)}, ${m.players} jogadores, ${m.lp} LP`)}</span></div>
        </div>
        <figure class="hero-map wl-cover">
          <img src="assets/covers/western-legends.webp" alt="${t("Cover of the Western Legends rulebook", "Capa do livro de regras de Western Legends")}">
          <figcaption>${t("Core rulebook · p. 1", "Livro base · p. 1")}</figcaption>
        </figure>
      </div></section>
      <main class="page-wrap content-column wl-page">
        ${navigation()}
        ${renderConfiguration()}
        ${body}
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "This guide paraphrases the Western Legends core rulebook, Ante Up, Blood Money (with its Game Modes book), Fistful of Extras, The Good, the Bad and the Handsome, Wild Bunch of Extras and the official FAQ. Source PDFs live in manuals/; page links open the printed page. FAQ rulings are folded into the text where they correct or clarify the books.",
        "Este guia parafraseia o livro base de Western Legends, Ante Up, Blood Money (com o livro de Modos de Jogo), Fistful of Extras, The Good, the Bad and the Handsome, Wild Bunch of Extras e o FAQ oficial. Os PDFs estão em manuals/; os links abrem a página impressa. As decisões do FAQ estão incorporadas ao texto onde corrigem ou esclarecem os livros."
      )}</p></footer>`;
  }

  function onClick(event) {
    const button = event.target.closest("button");
    if (!button || !root || !root.contains(button)) {
      return;
    }
    if (button.dataset.language) {
      prefs.language = button.dataset.language === "en-US" ? "en-US" : "pt-BR";
      adjustNotices = [];
      savePrefs();
      renderInto(root);
      return;
    }
    if (button.hasAttribute("data-setup-reset")) {
      setupChecks = [];
      saveChecks();
      renderInto(root);
      return;
    }
    if (button.dataset.scroll) {
      document.getElementById(button.dataset.scroll)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !root || !root.contains(target)) {
      return;
    }
    if (target.matches("[data-setup-check]")) {
      const id = target.dataset.setupCheck;
      const checked = new Set(setupChecks);
      if (target.checked) {
        checked.add(id);
      } else {
        checked.delete(id);
      }
      setupChecks = [...checked];
      saveChecks();
      const total = setupPhases().flatMap((phase) => phase.items).length;
      const done = setupChecks.length;
      const progress = root.querySelector("#setup-progress");
      const label = root.querySelector("#setup-progress-label");
      if (progress) {
        progress.value = done;
      }
      if (label) {
        label.textContent = t(`${done} of ${total} setup groups checked`, `${done} de ${total} grupos de preparação concluídos`);
      }
      return;
    }
    if (target.type === "radio" && target.checked && target.dataset.pref) {
      const key = target.dataset.pref;
      const value = target.value;
      commit((draft) => {
        if (key === "mode" && MODES.includes(value)) {
          draft.mode = value;
        } else if (key === "players") {
          draft.players = Number(value);
        } else if (key === "lp") {
          draft.lp = Number(value);
        } else if (key === "story") {
          draft.story = value === "core" ? "core" : "legendary";
        } else if ([...EXPANSIONS, ...OPTIONS].includes(key)) {
          draft[key] = value === "true";
        }
      });
    }
  }

  window.WesternLegends = { renderInto, onClick, onChange };
})();
