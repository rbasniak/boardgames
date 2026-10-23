(() => {
  "use strict";

  const PREFS_KEY = "field-manual.lotr-fate-of-the-fellowship.v1";
  const CHECKS_KEY = "field-manual.lotr-fate-of-the-fellowship.setup.v1";
  const MANUAL_FILE = "lotr-fate-of-the-fellowship_core.pdf";
  const ICON_DIR = "assets/lotr-fate-of-the-fellowship/";

  const LEVELS = ["intro", "standard", "heroic", "epic", "legendary"];
  const LEVEL_INFO = {
    intro: { skies: 4, objectives: 4 },
    standard: { skies: 5, objectives: 4 },
    heroic: { skies: 5, objectives: 5 },
    epic: { skies: 6, objectives: 5 },
    legendary: { skies: 6, objectives: 6 }
  };

  const PLAYER_INFO = {
    1: { events: 5, hand: 4 },
    2: { events: 6, hand: 4 },
    3: { events: 6, hand: 3 },
    4: { events: 7, hand: 2 },
    5: { events: 9, hand: 2 }
  };

  const SCENARIOS = {
    first: {
      en: "Your First Game", pt: "Sua Primeira Partida",
      levels: ["intro", "standard"],
      cards: ["Attain the Blessing of the Elves", "“Saruman, Your Staff Is Broken”", "Challenge Sauron"]
    },
    darkness: {
      en: "Keep the Darkness at Bay", pt: "Keep the Darkness at Bay (Mantenha a Escuridão Afastada)",
      levels: ["intro", "standard"],
      cards: ["Confront the Balrog", "Oathbreakers Fulfill Their Duty", "Subdue Umbar"]
    },
    rohan: {
      en: "Riders of Rohan", pt: "Riders of Rohan (Cavaleiros de Rohan)",
      levels: ["heroic", "epic"],
      cards: ["Ride with the Éored", "Free Théoden’s Mind", "Deal with Freca’s Heirs", "Shieldmaiden No Longer"]
    },
    elves: {
      en: "Fate of the Elves", pt: "Fate of the Elves (O Destino dos Elfos)",
      levels: ["heroic", "epic"],
      cards: ["“That Makes Six!”", "Arwen Unfurls the Banner", "Lay Bare the Pits", "Bring Light to Mirkwood"]
    },
    steward: {
      en: "Sons of the Steward", pt: "Sons of the Steward (Filhos do Regente)",
      levels: ["heroic", "epic"],
      cards: ["Boromir Reclaims His Honor", "Secure the Crossing of the Anduin", "Unseat Denethor", "Infiltrate Minas Morgul"]
    },
    hero: {
      en: "No Hero Too Small", pt: "No Hero Too Small (Nenhum Herói É Pequeno Demais)",
      levels: ["legendary"],
      cards: ["Avenge Balin!", "Lift Shadow from Dwarven Lands", "Rangers Secure Eriador", "Hobbits Pledge Their Loyalty", "Shelob’s Lair"]
    }
  };
  const OBJECTIVE_CHOICES = ["first", "darkness", "rohan", "elves", "steward", "hero", "random"];

  const CHARACTERS = [
    ["Aragorn", "Weather Hills", "Weather Hills (Colinas do Vento)"],
    ["Arwen", "Rivendell", "Rivendell (Valfenda)"],
    ["Boromir", "Minas Tirith", "Minas Tirith"],
    ["Éomer", "Eastemnet", "Eastemnet (Eastemnet)"],
    ["Éowyn", "Edoras", "Edoras"],
    ["Faramir", "Minas Tirith", "Minas Tirith"],
    ["Frodo & Sam", "The Shire", "The Shire (o Condado)"],
    ["Galadriel", "Lórien", "Lórien"],
    ["Gandalf", "Tharbad", "Tharbad"],
    ["Gimli", "Erebor", "Erebor"],
    ["Gollum", "Moria", "Moria"],
    ["Legolas", "Woodland Realm", "Woodland Realm (Reino da Floresta)"],
    ["Merry & Pippin", "The Shire", "The Shire (o Condado)"]
  ];

  const FIRST_PAIRS = [
    ["Frodo & Sam", "Legolas"],
    ["Merry & Pippin", "Éowyn"],
    ["Arwen", "Aragorn"],
    ["Gandalf", "Boromir"],
    ["Gimli", "Éomer"]
  ];
  const SOLO_FIRST = ["Merry & Pippin", "Éowyn", "Legolas", "Gandalf"];

  let storageNotice = "";
  let adjustNotices = [];
  let root = null;

  function defaultPrefs() {
    return {
      language: "pt-BR",
      players: 4,
      level: "intro",
      objectives: "first",
      characters: "first"
    };
  }

  function resolvePrefs(input) {
    const p = { ...input };
    p.players = Math.min(5, Math.max(1, Number(p.players) || 4));
    if (!LEVELS.includes(p.level)) {
      p.level = "intro";
    }
    if (!OBJECTIVE_CHOICES.includes(p.objectives)) {
      p.objectives = "random";
    }
    if (p.objectives !== "random" && !SCENARIOS[p.objectives].levels.includes(p.level)) {
      p.objectives = "random";
    }
    if (p.characters !== "first" && p.characters !== "random") {
      p.characters = "random";
    }
    if (p.objectives !== "first") {
      p.characters = "random";
    }
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
    const players = Number(saved.players);
    if (Number.isInteger(players) && players >= 1 && players <= 5) {
      next.players = players;
    }
    if (LEVELS.includes(saved.level)) {
      next.level = saved.level;
    }
    if (OBJECTIVE_CHOICES.includes(saved.objectives)) {
      next.objectives = saved.objectives;
    }
    if (saved.characters === "first" || saved.characters === "random") {
      next.characters = saved.characters;
    }
    return resolvePrefs(next);
  }

  function loadPrefs() {
    try {
      const raw = window.localStorage.getItem(PREFS_KEY);
      return raw ? normalizePrefs(JSON.parse(raw)) : normalizePrefs(null);
    } catch (error) {
      storageNotice = "read";
      console.error("Could not read Fate of the Fellowship match settings.", error);
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
      console.error("Could not read the Fate of the Fellowship setup checklist.", error);
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
      console.error("Could not save Fate of the Fellowship match settings.", error);
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
      console.error("Could not save the Fate of the Fellowship setup checklist.", error);
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

  function ref(page) {
    return `<a class="source-link" href="manuals/${MANUAL_FILE}#page=${page}" target="_blank" rel="noreferrer">${escapeHtml(t(`Manual p. ${page} ↗`, `Manual p. ${page} ↗`))}</a>`;
  }

  function refs(...pages) {
    return pages.map((page) => ref(page)).join(" ");
  }

  function iconLabel(name) {
    const labels = {
      friendship: "Friendship",
      valor: "Valor",
      stealth: "Stealth",
      resistance: "Resistance",
      "dwarven-location": t("Dwarven location", "Local Anão"),
      "elven-location": t("Elven location", "Local Élfico"),
      "rohirrim-location": t("Rohirrim location", "Local Rohirrim"),
      "gondor-location": t("Gondor location", "Local de Gondor"),
      "nazgul-result": "Nazgûl!"
    };
    if (labels[name]) {
      return labels[name];
    }
    return name.replace(/^(action|skies|order)-/, "").replace(/-/g, " ").replace(/^./, (letter) => letter.toUpperCase());
  }

  function icon(name) {
    return `<img class="lotr-inline-icon" src="${ICON_DIR}${name}.webp" alt="${escapeHtml(iconLabel(name))}">`;
  }

  function levelName(level) {
    return {
      intro: t("Introductory", "Introdutório"),
      standard: t("Standard", "Padrão"),
      heroic: t("Heroic", "Heroico"),
      epic: t("Epic", "Épico"),
      legendary: t("Legendary", "Lendário")
    }[level];
  }

  function scenarioName(id) {
    if (id === "random") {
      return t("Random objectives", "Objetivos sorteados");
    }
    return t(SCENARIOS[id].en, SCENARIOS[id].pt);
  }

  function describeChange(key, before, after) {
    if (key === "objectives") {
      return t(
        `Objectives changed from “${scenarioName(before)}” to “${scenarioName(after)}”, because that scenario is not offered for the ${levelName(prefs.level)} level.`,
        `Os objetivos mudaram de “${scenarioName(before)}” para “${scenarioName(after)}”, porque esse cenário não é oferecido no nível ${levelName(prefs.level)}.`
      );
    }
    if (key === "characters") {
      return t(
        "Characters changed to a random draw: the suggested characters belong to the “Your First Game” objectives.",
        "Os personagens passaram a ser sorteados: os personagens sugeridos pertencem aos objetivos de “Sua Primeira Partida”."
      );
    }
    return "";
  }

  function commit(mutator) {
    const previousKey = configurationKey();
    const draft = { ...prefs };
    mutator(draft);
    const resolved = resolvePrefs(draft);
    prefs = resolved;
    adjustNotices = Object.keys(resolved)
      .filter((key) => key !== "language" && resolved[key] !== draft[key])
      .map((key) => describeChange(key, draft[key], resolved[key]))
      .filter(Boolean);
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
    const solo = p.players === 1;
    const level = LEVEL_INFO[p.level];
    const playerInfo = PLAYER_INFO[p.players];
    const handTotal = solo ? playerInfo.hand : playerInfo.hand * p.players;
    const deckCards = 48 + playerInfo.events - handTotal;
    const base = Math.floor(deckCards / level.skies);
    const extra = deckCards % level.skies;
    const stackSizes = [];
    for (let index = 0; index < level.skies; index += 1) {
      stackSizes.push(base + (index < extra ? 1 : 0));
    }
    return {
      ...p,
      solo,
      skies: level.skies,
      objectiveCount: level.objectives,
      events: playerInfo.events,
      hand: playerInfo.hand,
      handTotal,
      deckCards,
      stackSizes,
      scenario: p.objectives === "random" ? null : SCENARIOS[p.objectives],
      firstCharacters: p.characters === "first" && p.objectives === "first",
      characterCount: solo ? 5 : p.players * 2,
      characterLimitNote: p.players <= 2
    };
  }

  function characterHome(name) {
    const row = CHARACTERS.find((item) => item[0] === name);
    return row ? t(row[1], row[2]) : "";
  }

  function sectionHeading(id, title, index, refHtml) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("FIELD GUIDE", "GUIA DE CAMPO")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="lotr-heading-refs">${refHtml}</div>
      </div>`;
  }

  function card(title, body, refHtml = "") {
    return `<article class="info-card"><h3>${title}</h3>${body}${refHtml ? `<p class="lotr-refs">${refHtml}</p>` : ""}</article>`;
  }

  function block(title, body, refHtml = "") {
    return `<div class="turn-block"><h3>${title}</h3>${body}${refHtml ? `<p class="lotr-refs">${refHtml}</p>` : ""}</div>`;
  }

  function para(text) {
    return `<p>${text}</p>`;
  }

  function list(items) {
    return `<ul class="lotr-list">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function steps(items) {
    return `<ol class="lotr-steps">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ol>`;
  }

  function note(text) {
    return `<p class="lotr-note">${text}</p>`;
  }

  function interpretation(text) {
    return `<p class="lotr-interpretation"><strong>${t("Interpretation:", "Interpretação:")}</strong> ${text}</p>`;
  }

  function jump(id, label) {
    return `<button type="button" data-scroll="${id}">${label}</button>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function storageNoticeText() {
    if (storageNotice === "read") {
      return t(
        "This browser could not read the saved Fate of the Fellowship match. A default match is shown, and it may not be possible to save changes.",
        "Este navegador não conseguiu ler a partida salva de Fate of the Fellowship. Uma partida padrão está na tela, e pode não ser possível salvar alterações."
      );
    }
    return t(
      "This browser refused to save the Fate of the Fellowship match. Your latest change is visible on screen only.",
      "Este navegador recusou salvar a partida de Fate of the Fellowship. A última alteração aparece apenas na tela."
    );
  }

  // --- Build your match ------------------------------------------------

  function radioOption(key, value, selected, title, description) {
    const id = `lotr-${key}-${value}`;
    const checked = String(selected) === String(value);
    return `
      <label class="lotr-choice-card ${checked ? "is-selected" : ""}" for="${id}">
        <input id="${id}" type="radio" name="lotr-${key}" value="${escapeHtml(value)}" data-pref="${key}" ${checked ? "checked" : ""}>
        <span class="lotr-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function radioGroup(key, title, summary, selected, options, refHtml = "", wide = false) {
    return `
      <fieldset class="lotr-choice-group">
        <legend>${title}</legend>
        <p class="lotr-choice-summary"><strong>${t("Selected:", "Selecionado:")}</strong> ${summary}</p>
        <div class="lotr-choice-grid ${wide ? "is-wide" : ""}">${options.map((item) => radioOption(key, item.value, selected, item.title, item.description)).join("")}</div>
        ${refHtml ? `<p class="lotr-refs">${refHtml}</p>` : ""}
      </fieldset>`;
  }

  function fixedGroup(title, summary, text, refHtml = "") {
    return `
      <fieldset class="lotr-choice-group is-fixed">
        <legend>${title}</legend>
        <p class="lotr-choice-summary"><strong>${t("Fixed:", "Fixo:")}</strong> ${summary}</p>
        <p class="lotr-option-note">${text}</p>
        ${refHtml ? `<p class="lotr-refs">${refHtml}</p>` : ""}
      </fieldset>`;
  }

  function playersLabel(count) {
    return count === 1 ? t("1 player (solo)", "1 jogador (solo)") : t(`${count} players`, `${count} jogadores`);
  }

  function renderConfiguration() {
    const m = match();
    const groups = [];

    const playerOptions = [1, 2, 3, 4, 5].map((count) => {
      const info = PLAYER_INFO[count];
      let description;
      if (count === 1) {
        description = t(
          `Solo game: you control Frodo & Sam plus 4 other characters in a row, passing a solo token from character to character. ${info.events} event cards in the player deck, a starting hand of ${info.hand} cards. The Fellowship action is not used and Prepare also needs the card’s region.`,
          `Partida solo: você controla Frodo & Sam e mais 4 personagens enfileirados, passando um marcador solo de personagem em personagem. ${info.events} cartas de evento no baralho de jogadores e mão inicial de ${info.hand} cartas. A ação Fellowship não é usada e Prepare também exige a região da carta.`
        );
      } else {
        description = t(
          `Each player controls 2 characters (${count * 2} in play). ${info.events} event cards in the player deck; each player starts with ${info.hand} cards.`,
          `Cada jogador controla 2 personagens (${count * 2} em jogo). ${info.events} cartas de evento no baralho de jogadores; cada jogador começa com ${info.hand} cartas.`
        );
      }
      if (count === 2) {
        description += t(" Objective sets that need more than 4 characters cannot be used.", " Conjuntos de objetivos que exijam mais de 4 personagens não podem ser usados.");
      }
      if (count === 1) {
        description += t(" Objective sets that need more than 5 characters cannot be used.", " Conjuntos de objetivos que exijam mais de 5 personagens não podem ser usados.");
      }
      return { value: String(count), title: playersLabel(count), description };
    });
    groups.push(radioGroup("players", t("1 · Players", "1 · Jogadores"), playersLabel(m.players), String(m.players), playerOptions, refs(8, 21, 22), true));

    const levelOptions = LEVELS.map((level) => {
      const info = LEVEL_INFO[level];
      const extra = {
        intro: t(" Recommended for your first game.", " Recomendado para a primeira partida."),
        standard: t(" A bigger challenge once you know the game.", " Um desafio maior depois que vocês conhecerem o jogo."),
        heroic: t(" For groups who regularly win standard games.", " Para grupos que vencem com frequência no Padrão."),
        epic: "",
        legendary: t(" The hardest level.", " O nível mais difícil.")
      }[level];
      return {
        value: level,
        title: levelName(level),
        description: t(
          `${info.skies} Skies Darken cards, so the player deck is split into ${info.skies} stacks. ${info.objectives} objectives (Destroy the One Ring + ${info.objectives - 1} others).${extra}`,
          `${info.skies} cartas Skies Darken (Os Céus Escurecem), então o baralho de jogadores é dividido em ${info.skies} pilhas. ${info.objectives} objetivos (Destroy the One Ring + ${info.objectives - 1} outros).${extra}`
        )
      };
    });
    groups.push(radioGroup("level", t("2 · Difficulty", "2 · Dificuldade"), t(`${levelName(m.level)} — ${m.skies} Skies Darken, ${m.objectiveCount} objectives`, `${levelName(m.level)} — ${m.skies} Skies Darken, ${m.objectiveCount} objetivos`), m.level, levelOptions, refs(8, 21), true));

    const objectiveOptions = OBJECTIVE_CHOICES
      .filter((id) => id === "random" || SCENARIOS[id].levels.includes(m.level))
      .map((id) => {
        if (id === "random") {
          return {
            value: id,
            title: scenarioName(id),
            description: t(
              `Destroy the One Ring (marked with a red star) plus ${m.objectiveCount - 1} objective cards drawn at random. ${m.players <= 2 ? `If the drawn cards require more characters than this game allows (${m.players === 1 ? 5 : 4} in total), shuffle the objectives and draw a new set.` : "Any characters those cards require are set aside before characters are dealt."}`,
              `Destroy the One Ring (marcado com estrela vermelha) mais ${m.objectiveCount - 1} cartas de objetivo sorteadas. ${m.players <= 2 ? `Se as cartas sorteadas exigirem mais personagens do que esta partida permite (${m.players === 1 ? 5 : 4} no total), embaralhe os objetivos e sorteie um novo conjunto.` : "Os personagens exigidos por essas cartas são separados antes de distribuir os personagens."}`
            )
          };
        }
        const scenario = SCENARIOS[id];
        const firstNote = id === "first"
          ? t(" Each of these cards is marked with a black star. Unlocks the suggested first-game characters below.", " Cada uma dessas cartas tem uma estrela preta. Libera abaixo os personagens sugeridos para a primeira partida.")
          : "";
        return {
          value: id,
          title: t(`Suggested scenario: ${scenarioName(id)}`, `Cenário sugerido: ${scenarioName(id)}`),
          description: t(`${scenario.cards.join("; ")}; Destroy the One Ring.${firstNote}`, `${scenario.cards.join("; ")}; Destroy the One Ring.${firstNote}`)
        };
      });
    groups.push(radioGroup("objectives", t("3 · Objectives", "3 · Objetivos"), scenarioName(m.objectives), m.objectives, objectiveOptions, refs(6, 21), true));

    if (m.objectives === "first") {
      const firstDescription = m.solo
        ? t(
          "Frodo & Sam by the board, plus Merry & Pippin, Éowyn, Legolas and Gandalf in your row.",
          "Frodo & Sam ao lado do tabuleiro, mais Merry & Pippin, Éowyn, Legolas e Gandalf na sua fileira."
        )
        : t(
          `Fixed pairs by seat: ${FIRST_PAIRS.slice(0, m.players).map((pair, index) => `player ${index + 1} ${pair.join(" & ")}`).join("; ")}. The player with Frodo takes the first turn.`,
          `Duplas fixas por lugar: ${FIRST_PAIRS.slice(0, m.players).map((pair, index) => `jogador ${index + 1} ${pair.join(" e ")}`).join("; ")}. Quem tem Frodo faz o primeiro turno.`
        );
      const randomDescription = m.solo
        ? t(
          "Frodo & Sam by the board, plus 4 other character cards drawn at random (any characters the objectives require are taken first).",
          "Frodo & Sam ao lado do tabuleiro, mais 4 outras cartas de personagem sorteadas (os personagens exigidos pelos objetivos são separados primeiro)."
        )
        : t(
          `Set aside the characters the objectives require, add random ones up to ${m.characterCount}, shuffle and deal 2 to each player. The player whose starting region card shows the lowest number goes first.`,
          `Separe os personagens exigidos pelos objetivos, complete com sorteados até ${m.characterCount}, embaralhe e dê 2 a cada jogador. Quem tiver a carta de região inicial com o menor número começa.`
        );
      groups.push(radioGroup("characters", t("4 · Characters", "4 · Personagens"), m.characters === "first" ? t("Suggested first-game characters", "Personagens sugeridos para a primeira partida") : t("Random characters", "Personagens sorteados"), m.characters, [
        { value: "first", title: t("Suggested first-game characters", "Personagens sugeridos para a primeira partida"), description: firstDescription },
        { value: "random", title: t("Random characters", "Personagens sorteados"), description: randomDescription }
      ], refs(6, 8, 22)));
    } else {
      groups.push(fixedGroup(t("4 · Characters", "4 · Personagens"), t("Random characters", "Personagens sorteados"), m.solo
        ? t("The suggested characters belong to the “Your First Game” objectives. Here: Frodo & Sam by the board, plus 4 other character cards — first any the objective cards require, then random ones.", "Os personagens sugeridos pertencem aos objetivos de “Sua Primeira Partida”. Aqui: Frodo & Sam ao lado do tabuleiro, mais 4 outras cartas de personagem — primeiro as exigidas pelos objetivos, depois sorteadas.")
        : t(`The suggested characters belong to the “Your First Game” objectives. Here: set aside the characters the objective cards require, add random ones up to ${m.characterCount}, shuffle and deal 2 to each player.`, `Os personagens sugeridos pertencem aos objetivos de “Sua Primeira Partida”. Aqui: separe os personagens exigidos pelas cartas de objetivo, complete com sorteados até ${m.characterCount}, embaralhe e dê 2 a cada jogador.`), refs(6, 22)));
    }

    const summary = t(
      `${playersLabel(m.players)} · ${levelName(m.level)} · ${scenarioName(m.objectives)} · ${m.events} events · ${m.skies} Skies Darken · player deck of ${m.deckCards} cards + ${m.skies} Skies Darken in ${m.skies} stacks.`,
      `${playersLabel(m.players)} · ${levelName(m.level)} · ${scenarioName(m.objectives)} · ${m.events} eventos · ${m.skies} Skies Darken · baralho de jogadores com ${m.deckCards} cartas + ${m.skies} Skies Darken em ${m.skies} pilhas.`
    );
    return `
      <section class="lotr-config" aria-labelledby="configure-title">
        <div class="section-heading"><div><p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p><h2 id="configure-title">${t("Build your match", "Configure a partida")}</h2></div><div class="lotr-heading-refs">${refs(8, 21)}</div></div>
        <p class="section-lead">${t("This core box has no expansions. The rulebook’s real choices are the player count (including the solo game), the difficulty level, which objectives to use, and — for a first game — the suggested characters. Every section below follows these choices.", "Esta caixa base não tem expansões. As escolhas reais do manual são o número de jogadores (inclusive a partida solo), o nível de dificuldade, quais objetivos usar e — na primeira partida — os personagens sugeridos. Todas as seções abaixo seguem estas escolhas.")}</p>
        ${adjustNotices.length ? `<div class="lotr-adjust" role="status">${adjustNotices.map((text) => `<p>${text}</p>`).join("")}</div>` : ""}
        ${groups.join("")}
        <p class="lotr-config-status">${summary}</p>
      </section>`;
  }

  // --- Overview ----------------------------------------------------------

  function overviewSection(index) {
    const m = match();
    return `
      ${sectionHeading("overview", t("Overview and key concepts", "Visão geral e conceitos-chave"), index, refs(2, 9))}
      <p class="section-lead">${t(
        "As members of the Fellowship and the allies who rise to aid them, you embark on a perilous journey that will save or doom Middle-earth. You protect Frodo, evade the searching Eye of Sauron and the Nazgûl in pursuit, and defeat enemy troops as they invade key locations. Finally, Frodo must cast the One Ring into the fires of Mount Doom.",
        "Como membros da Sociedade e aliados que se levantam para ajudá-la, vocês embarcam numa jornada perigosa que vai salvar ou condenar a Terra-média. Vocês protegem Frodo, fogem do Olho de Sauron que o procura e dos Nazgûl em perseguição, e derrotam tropas inimigas que invadem locais importantes. No fim, Frodo precisa lançar o Um Anel no fogo da Montanha da Perdição."
      )}</p>
      <div class="quick-grid">
        ${card(t("Cooperation", "Cooperação"), para(m.solo
          ? t("You play alone, coordinating Frodo & Sam and 4 other characters.", "Você joga sozinho, coordenando Frodo & Sam e mais 4 personagens.")
          : t("All players are on the same team and win or lose together. Discuss strategy and give advice freely, but each player decides what to do on their own turn.", "Todos estão no mesmo time e vencem ou perdem juntos. Discutam estratégias e deem conselhos à vontade, mas cada jogador decide o que fazer no próprio turno.")), ref(9))}
        ${card(t("Objective", "Objetivo"), para(t(
          `Complete the ${m.objectiveCount} objective cards chosen for this game. Destroy the One Ring must be completed last, and all of it must happen before Frodo loses all hope.`,
          `Cumpram as ${m.objectiveCount} cartas de objetivo escolhidas para esta partida. Destroy the One Ring (Destruir o Um Anel) precisa ser o último, e tudo precisa acontecer antes que Frodo perca toda a esperança.`
        )), ref(9))}
        ${card(t("Hope", "Esperança"), para(t(
          "The hope marker is Frodo’s morale. Effects make you gain or lose hope. If the marker ever reaches the bottom space of the hope track (despair, the 0 space), Frodo has lost all hope and everyone loses.",
          "O marcador de esperança é o moral de Frodo. Efeitos fazem vocês ganhar ou perder esperança. Se o marcador chegar ao espaço mais baixo da trilha de esperança (desespero, o espaço 0), Frodo perdeu toda a esperança e todos perdem."
        )), refs(9, 19))}
      </div>
      <h3 class="subhead">${t("The Free Peoples", "Os Povos Livres")}</h3>
      <div class="quick-grid">
        ${card(t("Characters", "Personagens"), para(m.solo
          ? t("You control 5 characters. Each has a card with unique abilities and a figure on the board.", "Você controla 5 personagens. Cada um tem uma carta com habilidades únicas e uma miniatura no tabuleiro.")
          : t("Each player controls 2 characters. Each has a card with unique abilities and a figure on the board. Abilities are printed on the character cards, not in the rulebook.", "Cada jogador controla 2 personagens. Cada um tem uma carta com habilidades únicas e uma miniatura no tabuleiro. As habilidades estão impressas nas cartas de personagem, não no manual.")), ref(9))}
        ${card(t("Friendly troops", "Tropas aliadas"), para(t("The armies of Gondor (blue), the Elves (green), the Rohirrim (brown) and the Dwarves (grey). They only move together with a character who Travels.", "Os exércitos de Gondor (azul), dos Elfos (verde), dos Rohirrim (marrom) e dos Anões (cinza). Só se movem junto com um personagem que faz Travel (Viajar).")), refs(9, 10))}
        ${card(t("Havens", "Refúgios"), para(t("Places of refuge. Shadow troops march toward them to take them over. Prepare happens at a haven; search “Exposed” results are ignored while Frodo is in one.", "Lugares de abrigo. As tropas da Sombra marcham em direção a eles para tomá-los. A ação Prepare acontece num refúgio; resultados “Exposed” da busca são ignorados enquanto Frodo estiver num.")), refs(9, 11))}
      </div>
      <h3 class="subhead">${t("The forces of Shadow", "As forças da Sombra")}</h3>
      <div class="quick-grid">
        ${card(t("The Eye of Sauron", "O Olho de Sauron"), para(t("Shows which region Sauron’s gaze is focused on. If a Skies Darken card is drawn while the Eye is in Frodo’s region, you lose 2 hope.", "Mostra em qual região está o olhar de Sauron. Se uma carta Skies Darken for comprada com o Olho na região de Frodo, vocês perdem 2 de esperança.")), refs(9, 15))}
        ${card(t("Nazgûl", "Nazgûl"), para(t("Sauron’s 9 chief lieutenants. Each occupies a whole region, not a location: its presence is felt in every location of that region. Several Nazgûl can share a region.", "Os 9 principais lugares-tenentes de Sauron. Cada um ocupa uma região inteira, não um local: sua presença vale em todos os locais daquela região. Vários Nazgûl podem estar na mesma região.")), ref(9))}
        ${card(t("Shadow troops and strongholds", "Tropas e fortalezas da Sombra"), para(t("Red shadow troops are the enemy foot soldiers (Orcs, Trolls, Easterlings, Southrons and others). A shadow stronghold is a location the board prints inside a red starburst, the same shape as the shadow stronghold icon: Isengard, Moria, Dol Guldur, Rhûn, Minas Morgul, Udûn, Barad-dûr and Umbar. A red location without that starburst, such as Dunland, Nûrn or Near Harad, is a shadow location and cannot be captured. There is no limit to how many shadow troops a location can hold.", "As tropas vermelhas da Sombra são os soldados inimigos (Orcs, Trolls, Orientais, Sulistas e outros). Fortaleza da Sombra é um local que o tabuleiro imprime dentro de uma estrela vermelha, o mesmo formato do ícone de fortaleza: Isengard, Moria, Dol Guldur, Rhûn, Minas Morgul, Udûn, Barad-dûr e Umbar. Um local vermelho sem essa estrela, como Dunland, Nûrn ou Near Harad, é um local da Sombra e não pode ser capturado. Não há limite de tropas da Sombra num local.")), refs(3, 5, 9))}
      </div>
      <h3 class="subhead">${t("The board", "O tabuleiro")}</h3>
      <div class="quick-grid">
        ${card(t("Regions and locations", "Regiões e locais"), para(t("The map is divided into named regions (Eriador, Rohan, Gondor, Mordor…), each containing several locations (circles). Characters and troops stand in locations; Nazgûl and the Eye stand in regions. Location colors matter: Dwarven, Elven, Rohirrim and Gondor locations (marked by their emblem) allow Muster; white locations are normal; red locations are shadow locations.", "O mapa é dividido em regiões nomeadas (Eriador, Rohan, Gondor, Mordor…), cada uma com vários locais (círculos). Personagens e tropas ficam em locais; os Nazgûl e o Olho ficam em regiões. A cor do local importa: locais Anões, Élficos, Rohirrim e de Gondor (marcados com seu emblema) permitem Muster (Recrutar); locais brancos são normais; locais vermelhos são locais da Sombra.")), ref(3))}
        ${card(t("Paths and battle lines", "Caminhos e linhas de batalha"), para(t("Normal paths are white lines. Special paths are lines with symbols printed on them: using one costs those symbols. Battle lines are colored arrows that run from a red shadow location to a haven; shadow troops advance along them, and characters may also Travel along them in either direction.", "Caminhos normais são linhas brancas. Caminhos especiais são linhas com símbolos impressos: usá-los custa esses símbolos. Linhas de batalha são setas coloridas que vão de um local vermelho da Sombra até um refúgio; as tropas da Sombra avançam por elas, e os personagens também podem Viajar por elas nos dois sentidos.")), refs(3, 10, 16))}
        ${card(t("Tracks and card areas", "Trilhas e áreas de cartas"), para(t("The threat rate track (top left) sets how many shadow cards are drawn each turn. The hope track runs down the left edge to despair. The shadow deck has draw, resolve and discard spaces at the bottom left; the player deck has draw and discard spaces at the bottom right. Friendly troop storage (the supply of each army) is at the left edge.", "A trilha de taxa de ameaça (no alto, à esquerda) define quantas cartas da Sombra são compradas por turno. A trilha de esperança desce pela borda esquerda até o desespero. O baralho da Sombra tem espaços de compra, resolução e descarte no canto inferior esquerdo; o baralho de jogadores tem espaços de compra e descarte no canto inferior direito. O depósito de tropas aliadas (a reserva de cada exército) fica na borda esquerda.")), ref(3))}
      </div>
      <h3 class="subhead">${t("Spending symbols", "Gastar símbolos")}</h3>
      <p class="section-lead">${t(
        `Region cards and symbol tokens show one of four symbols: ${icon("friendship")} Friendship, ${icon("valor")} Valor, ${icon("stealth")} Stealth and ${icon("resistance")} Resistance. To spend a symbol, either discard a player card showing it to the player discard pile, or return one of your tokens showing it to the supply. When you gain a token, take it from the supply; if the supply has none of that kind, you get nothing. ${m.solo ? "All of your characters share one hand and one set of tokens." : "Both of your characters share your hand and your tokens."} You may spend a card’s symbol in any location, whatever region the card shows.`,
        `Cartas de região e fichas de símbolo mostram um de quatro símbolos: ${icon("friendship")} Friendship (Amizade), ${icon("valor")} Valor (Bravura), ${icon("stealth")} Stealth (Furtividade) e ${icon("resistance")} Resistance (Resistência). Para gastar um símbolo, descarte uma carta de jogador que o mostre na pilha de descarte de jogadores, ou devolva à reserva uma ficha sua com esse símbolo. Ao ganhar uma ficha, pegue-a da reserva; se não houver daquele tipo, você não recebe nada. ${m.solo ? "Todos os seus personagens compartilham uma só mão e um só conjunto de fichas." : "Seus dois personagens compartilham sua mão e suas fichas."} Você pode gastar o símbolo de uma carta em qualquer local, seja qual for a região da carta.`
      )} ${refs(9, 20)}</p>`;
  }

  // --- Quick reference ---------------------------------------------------

  function quickReference(index) {
    const m = match();
    const turnLines = m.solo
      ? [
        t("<strong>1)</strong> Up to 4 actions with the character holding the solo token, plus 1 bonus action with Frodo & Sam before or after.", "<strong>1)</strong> Até 4 ações com o personagem que tem o marcador solo, mais 1 ação bônus com Frodo & Sam antes ou depois."),
        t("<strong>2)</strong> Draw 2 player cards.", "<strong>2)</strong> Compre 2 cartas de jogador."),
        t("<strong>3)</strong> Draw shadow cards equal to the threat rate.", "<strong>3)</strong> Compre cartas da Sombra igual à taxa de ameaça."),
        t("Then move the solo token one character to the right.", "Depois mova o marcador solo um personagem para a direita.")
      ]
      : [
        t("<strong>1)</strong> Up to 4 actions with one character and up to 1 with the other (finish one before starting the other).", "<strong>1)</strong> Até 4 ações com um personagem e até 1 com o outro (termine um antes de começar o outro)."),
        t("<strong>2)</strong> Draw 2 player cards.", "<strong>2)</strong> Compre 2 cartas de jogador."),
        t("<strong>3)</strong> Draw shadow cards equal to the threat rate.", "<strong>3)</strong> Compre cartas da Sombra igual à taxa de ameaça."),
        t("Then the player on your left plays.", "Depois joga quem está à sua esquerda.")
      ];
    const actionLines = m.solo
      ? [
        t(`<strong>Travel:</strong> Frodo along — 1 ${icon("stealth")} or a search.`, `<strong>Travel:</strong> com Frodo — 1 ${icon("stealth")} ou uma busca.`),
        t("<strong>Prepare:</strong> at a haven in the card’s region — discard a card to gain a token.", "<strong>Prepare:</strong> num refúgio da região da carta — descarte uma carta para ganhar uma ficha."),
        t(`<strong>Muster:</strong> 1 ${icon("friendship")}.`, `<strong>Muster:</strong> 1 ${icon("friendship")}.`),
        t("<strong>Attack:</strong> the Eye moves; roll 1–3 battle dice.", "<strong>Attack:</strong> o Olho se move; role 1–3 dados de batalha."),
        t(`<strong>Capture:</strong> 3 ${icon("valor")}.`, `<strong>Capture:</strong> 3 ${icon("valor")}.`),
        t("No Fellowship action in solo.", "Sem ação Fellowship no solo.")
      ]
      : [
        t(`<strong>Travel:</strong> Frodo along — 1 ${icon("stealth")} or a search.`, `<strong>Travel:</strong> com Frodo — 1 ${icon("stealth")} ou uma busca.`),
        t("<strong>Fellowship:</strong> give or take a player card of your region.", "<strong>Fellowship:</strong> dar ou pegar carta de jogador da sua região."),
        t("<strong>Prepare:</strong> at a haven — discard a card to gain a token.", "<strong>Prepare:</strong> num refúgio — descarte uma carta para ganhar uma ficha."),
        t(`<strong>Muster:</strong> 1 ${icon("friendship")}.`, `<strong>Muster:</strong> 1 ${icon("friendship")}.`),
        t("<strong>Attack:</strong> the Eye moves; roll 1–3 battle dice.", "<strong>Attack:</strong> o Olho se move; role 1–3 dados de batalha."),
        t(`<strong>Capture:</strong> 3 ${icon("valor")}.`, `<strong>Capture:</strong> 3 ${icon("valor")}.`)
      ];
    const cards = [
      [t("Your turn", "Seu turno"), turnLines, "turn"],
      [t("Actions", "Ações"), actionLines, "actions"],
      [t("Skies Darken", "Skies Darken"), [
        t("<strong>1)</strong> Threat rate +1.", "<strong>1)</strong> Taxa de ameaça +1."),
        t("<strong>2)</strong> Eye in Frodo’s region: lose 2 hope; otherwise move the Eye there.", "<strong>2)</strong> Olho na região de Frodo: perca 2 de esperança; senão, mova o Olho para lá."),
        t("<strong>3)</strong> Add 3 shadow troops to the location on the card (battle if friendly troops are there).", "<strong>3)</strong> Coloque 3 tropas da Sombra no local da carta (batalha se houver tropas aliadas)."),
        t("<strong>4)</strong> Shuffle the shadow discard pile onto the shadow deck. Remove the card from the game; no replacement draw.", "<strong>4)</strong> Embaralhe o descarte da Sombra sobre o baralho da Sombra. Remova a carta do jogo; não compre outra no lugar.")
      ], "player-cards"],
      [t("Shadow cards", "Cartas da Sombra"), [
        t("Flip one card per point of threat rate.", "Vire uma carta por ponto da taxa de ameaça."),
        t("Look at the back of the new top card.", "Olhe o verso da nova carta do topo."),
        t("<strong>Red flag:</strong> resolve the flipped card’s top half (Advance).", "<strong>Bandeira vermelha:</strong> resolva a metade de cima da carta virada (Advance/Avançar)."),
        t("<strong>Black banner:</strong> resolve its bottom half (Reinforce + special order).", "<strong>Estandarte preto:</strong> resolva a metade de baixo (Reinforce/Reforçar + ordem especial).")
      ], "shadow"],
      [t("Dice", "Dados"), [
        t("<strong>Search:</strong> 1 search die per Nazgûl in Frodo’s region and per shadow troop in his location, max 7.", "<strong>Busca:</strong> 1 dado de busca por Nazgûl na região de Frodo e por tropa da Sombra no local dele, máx. 7."),
        t("<strong>Battle from Attack:</strong> 1 die per friendly troop (1–3).", "<strong>Batalha por Attack:</strong> 1 dado por tropa aliada (1–3)."),
        t("<strong>Battle from a card:</strong> 1 die per shadow troop (max 3).", "<strong>Batalha por carta:</strong> 1 dado por tropa da Sombra (máx. 3)."),
        t("Resistance rerolls; Valor removes shadow troops in battles.", "Resistance rerrola; Valor remove tropas da Sombra em batalhas.")
      ], "dice"],
      [t("Limits", "Limites"), [
        t("Hand limit 7 player cards (discard or play events at once).", "Limite de mão: 7 cartas de jogador (descarte ou jogue eventos na hora)."),
        t("Lose 1 hope per shadow troop you cannot place and per player card you cannot draw.", "Perca 1 de esperança por tropa da Sombra que não puder colocar e por carta de jogador que não puder comprar."),
        t("Losing a haven costs 3 hope; capturing a stronghold gains 2.", "Perder um refúgio custa 3 de esperança; capturar uma fortaleza dá 2.")
      ], "hope"],
      [t("Win or lose", "Vitória ou derrota"), [
        t("<strong>Win:</strong> complete every other objective, then Frodo destroys the One Ring at Mount Doom (5 Resistance + a final search) with at least 1 hope left.", "<strong>Vitória:</strong> cumpram todos os outros objetivos; então Frodo destrói o Um Anel na Montanha da Perdição (5 Resistance + uma busca final) com pelo menos 1 de esperança restante."),
        t("<strong>Lose:</strong> hope reaches 0.", "<strong>Derrota:</strong> a esperança chega a 0.")
      ], "winning"]
    ];
    return `
      ${sectionHeading("quick", t("Quick reference", "Referência rápida"), index, refs(10, 24))}
      <div class="quick-grid">${cards.map(([title, lines, target]) => `
        <article class="info-card"><h3>${title}</h3>${lineList(lines)}<p>${jump(target, t("Open the full rule", "Abrir a regra completa"))}</p></article>`).join("")}</div>`;
  }

  // --- Setup ---------------------------------------------------------------

  function inventory(m) {
    const playersText = m.solo ? t("you", "você") : t(`${m.players} players`, `${m.players} jogadores`);
    const rows = [
      [t("Game board", "Tabuleiro"), t("1 · center of the table.", "1 · centro da mesa."), ref(4)],
      [t("Threat rate marker · hope marker", "Marcador de taxa de ameaça · marcador de esperança"), t("1 each · on the dot space of their tracks.", "1 de cada · no espaço com ponto de cada trilha."), ref(4)],
      [t("Shadow cards", "Cartas da Sombra"), t("50 · 2 special (Sauron and Saruman illustrations) start in the shadow discard pile; the other 48 are the shadow deck (9 of them are drawn and discarded during setup). They have 2 different backs: shuffle them all together.", "50 · 2 especiais (ilustrações de Sauron e Saruman) começam no descarte da Sombra; as outras 48 formam o baralho da Sombra (9 delas são compradas e descartadas na preparação). Têm 2 versos diferentes: embaralhe todas juntas."), ref(4)],
      [t("Shadow troops (red)", "Tropas da Sombra (vermelhas)"), t("48 · 18 on fixed red locations + 9 from shadow cards; 21 stay in the supply.", "48 · 18 em locais vermelhos fixos + 9 pelas cartas da Sombra; 21 ficam na reserva."), ref(5)],
      [t("Friendly troops", "Tropas aliadas"), t("35 (8 Dwarven grey, 9 Elven green, 8 Rohirrim brown, 10 Gondor blue) · 15 on the board, 5 of each army left in the supply (friendly troop storage on the board).", "35 (8 Anãs cinza, 9 Élficas verdes, 8 Rohirrim marrons, 10 de Gondor azuis) · 15 no tabuleiro e 5 de cada exército na reserva (depósito de tropas aliadas do tabuleiro)."), refs(4, 5)],
      [t("Nazgûl miniatures · Eye of Sauron", "Miniaturas de Nazgûl · Olho de Sauron"), t("9 Nazgûl in 5 regions · the Eye on Eriador.", "9 Nazgûl em 5 regiões · o Olho em Eriador."), ref(5)],
      [t("Objective cards", "Cartas de objetivo"), t(`24 · ${m.objectiveCount} face up by the board (Destroy the One Ring + ${m.objectiveCount - 1}); the rest go back in the box.`, `24 · ${m.objectiveCount} viradas para cima ao lado do tabuleiro (Destroy the One Ring + ${m.objectiveCount - 1}); o resto volta para a caixa.`), refs(6, 21)],
      [t("Character cards · character figures", "Cartas de personagem · miniaturas de personagem"), t(`13 each · ${m.characterCount} in play (${m.solo ? "Frodo & Sam + 4" : "2 per player"}), figures on their starting locations; the rest go back in the box.`, `13 de cada · ${m.characterCount} em jogo (${m.solo ? "Frodo & Sam + 4" : "2 por jogador"}), miniaturas nos locais iniciais; o resto volta para a caixa.`), refs(6, 7)],
      [t("Reference cards", "Cartas de referência"), t(`10 · 2 for ${m.solo ? "you" : "each player"} (actions on one side, dice on the other).`, `10 · 2 para ${m.solo ? "você" : "cada jogador"} (ações de um lado, dados do outro).`), ref(6)],
      [t("Region cards", "Cartas de região"), t("48 · all go into the player cards.", "48 · todas vão para as cartas de jogador."), ref(8)],
      [t("Event cards", "Cartas de evento"), t(`14 · ${m.events} drawn unseen into the player cards for ${playersText}; the other ${14 - m.events} go back in the box unseen.`, `14 · ${m.events} sorteadas sem olhar para as cartas de jogador com ${playersText}; as outras ${14 - m.events} voltam para a caixa sem serem vistas.`), ref(8)],
      [t("Skies Darken cards", "Cartas Skies Darken"), t(`12 · ${m.skies} shuffled into the player deck (1 per stack); the other ${12 - m.skies} go back in the box unseen.`, `12 · ${m.skies} embaralhadas no baralho de jogadores (1 por pilha); as outras ${12 - m.skies} voltam para a caixa sem serem vistas.`), refs(8, 21)],
      [t("Symbol tokens", "Fichas de símbolo"), t("36 · the supply, beside the board. Gained mainly through Prepare.", "36 · a reserva, ao lado do tabuleiro. Obtidas principalmente com Prepare."), refs(2, 9)],
      [t("Haven / shadow stronghold tokens", "Fichas de refúgio / fortaleza da Sombra"), t("6 · beside the board; used when a haven falls or a stronghold is captured.", "6 · ao lado do tabuleiro; usadas quando um refúgio cai ou uma fortaleza é capturada."), refs(13, 14)],
      [t("Dice", "Dados"), t("3 battle dice and 7 search dice, beside the board. The Barad-dûr dice tower can be used to roll them; the rulebook gives it no other rule.", "3 dados de batalha e 7 dados de busca, ao lado do tabuleiro. A torre de dados de Barad-dûr pode ser usada para rolá-los; o manual não lhe dá outra regra."), ref(2)],
      m.solo ? [t("Solo token", "Marcador solo"), t("1 · on the leftmost character card of your row.", "1 · na carta de personagem mais à esquerda da sua fileira."), ref(22)] : null
    ].filter(Boolean);
    return `
      <div class="lotr-inventory">
        <h3>${t("Components for this match", "Componentes desta partida")}</h3>
        <p>${t("Name, quantity, and where each component goes.", "Nome, quantidade e destino de cada componente.")}</p>
        <div class="lotr-inventory-grid">${rows.map(([title, text, refHtml]) => `<div><strong>${title}</strong><span>${text}</span><span class="lotr-refs">${refHtml}</span></div>`).join("")}</div>
      </div>`;
  }

  function item(id, title, lines) {
    return { id, title, lines: lines.filter(Boolean) };
  }

  function characterTable(names) {
    return names.map((name) => `${name} → ${characterHome(name)}`).join("; ");
  }

  function setupPhases() {
    const m = match();
    const phases = [];

    phases.push({
      title: t("Board, tracks and shadow deck", "Tabuleiro, trilhas e baralho da Sombra"),
      refs: [3, 4],
      items: [
        item("board", t("Place the board and the two markers", "Coloque o tabuleiro e os dois marcadores"), [
          t("Place the game board in the center of the table.", "Coloque o tabuleiro no centro da mesa."),
          t("Put the threat rate marker on the threat rate track (top left of the board), on the space that contains a dot.", "Coloque o marcador de taxa de ameaça na trilha de taxa de ameaça (no alto, à esquerda do tabuleiro), no espaço que tem um ponto."),
          t("Put the hope marker on the hope track (left edge of the board), on the space that contains a dot.", "Coloque o marcador de esperança na trilha de esperança (borda esquerda do tabuleiro), no espaço que tem um ponto.")
        ]),
        item("shadow-deck", t("Create the shadow deck", "Monte o baralho da Sombra"), [
          t("Find the 2 special shadow cards, The Drums of War and The Wheels of Saruman (illustrated with Sauron and Saruman), and place them face up in the shadow discard space on the board.", "Separe as 2 cartas especiais da Sombra, The Drums of War e The Wheels of Saruman (ilustradas com Sauron e Saruman), e coloque-as viradas para cima no espaço de descarte da Sombra no tabuleiro."),
          t("Shuffle the other 48 shadow cards together — they have 2 different backs (a red flag or a black banner); mix both kinds — and stack them face down on the shadow draw space.", "Embaralhe juntas as outras 48 cartas da Sombra — elas têm 2 versos diferentes (bandeira vermelha ou estandarte preto); misture os dois tipos — e empilhe-as viradas para baixo no espaço de compra da Sombra.")
        ])
      ]
    });

    phases.push({
      title: t("Starting troops, Nazgûl and the Eye", "Tropas iniciais, Nazgûl e o Olho"),
      refs: [4, 5],
      items: [
        item("friendly", t("Place 15 friendly troops", "Coloque 15 tropas aliadas"), [
          t("Small troop-shaped symbols on the colored locations show where troops start.", "Pequenos símbolos em forma de tropa nos locais coloridos mostram onde as tropas começam."),
          t("Dwarven (grey), 3: 1 in Ered Luin, 1 in Erebor, 1 in Iron Hills.", "Anãs (cinza), 3: 1 em Ered Luin, 1 em Erebor, 1 em Iron Hills (Colinas de Ferro)."),
          t("Elven (green), 4: 1 in the Grey Havens, 1 in Lórien, 1 in Woodland Realm, 1 in Rivendell.", "Élficas (verdes), 4: 1 em Grey Havens (Portos Cinzentos), 1 em Lórien, 1 em Woodland Realm (Reino da Floresta), 1 em Rivendell (Valfenda)."),
          t("Rohirrim (brown), 3: 1 in Helm’s Deep, 1 in Edoras, 1 in Eastemnet.", "Rohirrim (marrons), 3: 1 em Helm’s Deep (Abismo de Helm), 1 em Edoras, 1 em Eastemnet."),
          t("Gondor (blue), 5: 2 in Minas Tirith, 2 in Dol Amroth, 1 in Pelargir.", "Gondor (azuis), 5: 2 em Minas Tirith, 2 em Dol Amroth, 1 em Pelargir."),
          t("Put the remaining friendly troops in the friendly troop storage at the left edge of the board (the supply): 5 of each army should be left.", "Coloque as tropas aliadas restantes no depósito de tropas aliadas na borda esquerda do tabuleiro (a reserva): devem sobrar 5 de cada exército.")
        ]),
        item("shadow-troops", t("Place 18 shadow troops on red locations", "Coloque 18 tropas da Sombra em locais vermelhos"), [
          t("1 in Dunland, 1 in Isengard, 2 in Moria, 1 in Dol Guldur, 3 in Rhûn.", "1 em Dunland (Terra Parda), 1 em Isengard, 2 em Moria, 1 em Dol Guldur, 3 em Rhûn."),
          t("2 in Minas Morgul, 2 in Barad-dûr, 3 in Nûrn, 1 in Umbar, 2 in Near Harad.", "2 em Minas Morgul, 2 em Barad-dûr, 3 em Nûrn, 1 em Umbar, 2 em Near Harad (Harad Próximo).")
        ]),
        item("shadow-draw", t("Add 9 more shadow troops from shadow cards", "Coloque mais 9 tropas da Sombra pelas cartas da Sombra"), [
          t("Draw 9 shadow cards, 1 at a time. For each, put 1 shadow troop into the red location featured on that card. Ignore every other instruction on the cards during setup.", "Compre 9 cartas da Sombra, 1 por vez. Para cada uma, coloque 1 tropa da Sombra no local vermelho mostrado nela. Ignore todas as outras instruções das cartas durante a preparação."),
          t("Discard these 9 cards to the shadow discard pile (with the 2 special cards).", "Descarte essas 9 cartas na pilha de descarte da Sombra (junto com as 2 especiais)."),
          t("Leave the remaining 21 shadow troops in the supply beside the board.", "Deixe as 21 tropas da Sombra restantes na reserva ao lado do tabuleiro.")
        ]),
        item("nazgul", t("Place the 9 Nazgûl and the Eye of Sauron", "Coloque os 9 Nazgûl e o Olho de Sauron"), [
          t("Icons near the region labels show the starting positions. Nazgûl stand in regions, not in locations.", "Ícones perto dos nomes das regiões mostram as posições iniciais. Os Nazgûl ficam em regiões, não em locais."),
          t("2 in Eriador, 1 in Rhudaur, 1 in the Misty Mountains, 1 in Gondor, 4 in Mordor.", "2 em Eriador, 1 em Rhudaur, 1 em Misty Mountains (Montanhas Sombrias), 1 em Gondor, 4 em Mordor."),
          t("Put the Eye of Sauron on Eriador.", "Coloque o Olho de Sauron em Eriador."),
          t("Put the 3 battle dice, 7 search dice, 36 symbol tokens and 6 haven / shadow stronghold tokens beside the board.", "Coloque os 3 dados de batalha, 7 dados de busca, 36 fichas de símbolo e 6 fichas de refúgio / fortaleza da Sombra ao lado do tabuleiro.")
        ])
      ]
    });

    const objectiveLines = [];
    if (m.scenario) {
      objectiveLines.push(t(
        `Put these ${m.objectiveCount} objective cards face up by the board: Destroy the One Ring (red star); ${m.scenario.cards.join("; ")}.`,
        `Coloque estas ${m.objectiveCount} cartas de objetivo viradas para cima ao lado do tabuleiro: Destroy the One Ring (estrela vermelha); ${m.scenario.cards.join("; ")}.`
      ));
      if (m.characterLimitNote) {
        objectiveLines.push(t(
          `Count the characters these cards require (printed on the cards). If they need more than ${m.solo ? 5 : 4} characters in total, this scenario cannot be played at this player count: choose another objective set above.`,
          `Conte os personagens exigidos por essas cartas (impressos nelas). Se precisarem de mais de ${m.solo ? 5 : 4} personagens no total, este cenário não pode ser jogado com este número de jogadores: escolha outro conjunto de objetivos acima.`
        ));
      }
    } else {
      objectiveLines.push(t(
        `Put Destroy the One Ring (marked with a red star) face up by the board. Shuffle the other 23 objective cards and draw ${m.objectiveCount - 1} at random; put them face up beside it.`,
        `Coloque Destroy the One Ring (marcada com estrela vermelha) virada para cima ao lado do tabuleiro. Embaralhe as outras 23 cartas de objetivo e sorteie ${m.objectiveCount - 1}; coloque-as viradas para cima ao lado dela.`
      ));
      if (m.characterLimitNote) {
        objectiveLines.push(t(
          `If the drawn cards require more characters than this game allows (${m.solo ? 5 : 4} in total, counting Frodo & Sam), shuffle the objectives and draw a new set.`,
          `Se as cartas sorteadas exigirem mais personagens do que esta partida permite (${m.solo ? 5 : 4} no total, contando Frodo & Sam), embaralhe os objetivos e sorteie um novo conjunto.`
        ));
      }
    }
    objectiveLines.push(t("Return the unused objective cards to the box.", "Devolva as cartas de objetivo não usadas à caixa."));
    objectiveLines.push(t("Follow any setup instructions printed on the chosen objective cards.", "Siga as instruções de preparação impressas nas cartas de objetivo escolhidas."));
    if (!m.firstCharacters) {
      objectiveLines.push(t("Some objective cards require certain characters: set those character cards aside for the next step.", "Algumas cartas de objetivo exigem certos personagens: separe essas cartas de personagem para o próximo passo."));
    }

    const characterLines = [];
    if (m.solo) {
      if (m.firstCharacters) {
        characterLines.push(t("Place the Frodo & Sam character card by the side of the board.", "Coloque a carta de personagem Frodo & Sam ao lado do tabuleiro."));
        characterLines.push(t("Place Merry & Pippin, Éowyn, Legolas and Gandalf face up, side by side in a row in front of you (the rulebook does not fix their order).", "Coloque Merry & Pippin, Éowyn, Legolas e Gandalf viradas para cima, lado a lado numa fileira à sua frente (o manual não fixa a ordem)."));
      } else {
        characterLines.push(t("Place the Frodo & Sam character card by the side of the board.", "Coloque a carta de personagem Frodo & Sam ao lado do tabuleiro."));
        characterLines.push(t("Take any other character cards set aside for the objectives, then add randomly selected character cards until you have 4 besides Frodo & Sam. Place these 4 face up, side by side in a row in front of you.", "Pegue as outras cartas de personagem separadas pelos objetivos e complete com cartas sorteadas até ter 4 além de Frodo & Sam. Coloque essas 4 viradas para cima, lado a lado numa fileira à sua frente."));
      }
      characterLines.push(t("Put the solo token on the leftmost character card of the row (never on Frodo & Sam).", "Coloque o marcador solo na carta de personagem mais à esquerda da fileira (nunca em Frodo & Sam)."));
      characterLines.push(t("Take 2 reference cards (actions on one side, dice on the other).", "Pegue 2 cartas de referência (ações de um lado, dados do outro)."));
    } else if (m.firstCharacters) {
      FIRST_PAIRS.slice(0, m.players).forEach((pair, index) => {
        characterLines.push(t(`Player ${index + 1}: ${pair.join(" and ")}.`, `Jogador ${index + 1}: ${pair.join(" e ")}.`));
      });
      characterLines.push(t("Hand each player 2 reference cards (actions on one side, dice on the other).", "Dê a cada jogador 2 cartas de referência (ações de um lado, dados do outro)."));
    } else {
      characterLines.push(t(`Take the character cards set aside for the objectives and add randomly selected character cards until you have ${m.characterCount} (2 per player).`, `Pegue as cartas de personagem separadas pelos objetivos e complete com cartas sorteadas até ter ${m.characterCount} (2 por jogador).`));
      characterLines.push(t("Shuffle these character cards together and give each player 2 at random.", "Embaralhe essas cartas de personagem juntas e dê 2 a cada jogador, ao acaso."));
      characterLines.push(t("Hand each player 2 reference cards (actions on one side, dice on the other).", "Dê a cada jogador 2 cartas de referência (ações de um lado, dados do outro)."));
    }
    characterLines.push(t("Frodo & Sam count as 1 character for all game purposes, as do Merry & Pippin; when the rules mention one of them, his companion is there too.", "Frodo & Sam contam como 1 personagem para todos os fins, assim como Merry & Pippin; quando as regras citam um deles, o companheiro está junto."));

    const figureNames = m.firstCharacters
      ? (m.solo ? ["Frodo & Sam", ...SOLO_FIRST] : FIRST_PAIRS.slice(0, m.players).flat())
      : null;
    const figureLines = [
      figureNames
        ? t(`Put each character figure on the starting location shown on its card: ${characterTable(figureNames)}.`, `Coloque cada miniatura no local inicial mostrado na sua carta: ${characterTable(figureNames)}.`)
        : t(`Put each character figure on the starting location shown on its card. For reference: ${characterTable(CHARACTERS.map((row) => row[0]))}.`, `Coloque cada miniatura no local inicial mostrado na sua carta. Para referência: ${characterTable(CHARACTERS.map((row) => row[0]))}.`),
      t("Return all unused character cards, character figures and reference cards to the box.", "Devolva à caixa todas as cartas de personagem, miniaturas e cartas de referência não usadas.")
    ];

    phases.push({
      title: t("Objectives and characters", "Objetivos e personagens"),
      refs: m.solo ? [6, 7, 22] : [6, 7],
      items: [
        item("objectives", t(`Select ${m.objectiveCount} objective cards`, `Escolha ${m.objectiveCount} cartas de objetivo`), objectiveLines),
        item("characters", m.solo ? t("Set up your 5 characters and the solo token", "Prepare seus 5 personagens e o marcador solo") : t("Hand out characters and reference cards", "Distribua personagens e cartas de referência"), characterLines),
        item("figures", t("Place the character figures", "Coloque as miniaturas dos personagens"), figureLines)
      ]
    });

    const handLine = m.solo
      ? t(`Deal yourself a starting hand of ${m.hand} cards from these cards.`, `Compre uma mão inicial de ${m.hand} cartas dessas cartas.`)
      : t(`Deal each player a starting hand of ${m.hand} cards from these cards (${m.handTotal} in total).`, `Dê a cada jogador uma mão inicial de ${m.hand} cartas dessas cartas (${m.handTotal} no total).`);
    const stackText = m.stackSizes.join(", ");
    phases.push({
      title: t("Player cards", "Cartas de jogador"),
      refs: [8, 21],
      items: [
        item("hands", t("Mix region and event cards and deal starting hands", "Misture regiões e eventos e distribua as mãos iniciais"), [
          t("Set the 12 Skies Darken cards aside.", "Separe as 12 cartas Skies Darken."),
          t(`Shuffle the 14 event cards and, without looking, take ${m.events} of them.`, `Embaralhe as 14 cartas de evento e, sem olhar, pegue ${m.events} delas.`),
          t(`Shuffle these ${m.events} events with the 48 region cards (${48 + m.events} cards).`, `Embaralhe esses ${m.events} eventos com as 48 cartas de região (${48 + m.events} cartas).`),
          handLine,
          m.solo ? t("Keep your hand face up.", "Mantenha sua mão virada para cima.") : t("Players keep their hands face up for everyone to see.", "Os jogadores mantêm as mãos viradas para cima, à vista de todos.")
        ]),
        item("player-deck", t(`Build the player deck with ${m.skies} Skies Darken cards`, `Monte o baralho de jogadores com ${m.skies} cartas Skies Darken`), [
          t(`Divide the remaining ${m.deckCards} player cards into ${m.skies} face-down stacks as evenly as possible (${stackText} cards).`, `Divida as ${m.deckCards} cartas de jogador restantes em ${m.skies} pilhas viradas para baixo, o mais iguais possível (${stackText} cartas).`),
          t(`Shuffle 1 Skies Darken card face down into each stack (${m.skies} in total), and shuffle each stack.`, `Embaralhe 1 carta Skies Darken virada para baixo em cada pilha (${m.skies} no total) e embaralhe cada pilha.`),
          t("Pile all the stacks on top of each other to form the player deck, with any larger stacks nearest the top.", "Empilhe todas as pilhas umas sobre as outras para formar o baralho de jogadores, com as pilhas maiores mais perto do topo."),
          t("Place the player deck on the draw space in the lower right corner of the board.", "Coloque o baralho de jogadores no espaço de compra no canto inferior direito do tabuleiro."),
          t(`Return the unused ${14 - m.events} event cards and ${12 - m.skies} Skies Darken cards to the box without looking at them.`, `Devolva à caixa, sem olhar, as ${14 - m.events} cartas de evento e as ${12 - m.skies} cartas Skies Darken não usadas.`)
        ])
      ]
    });

    phases.push({
      title: t("First turn", "Primeiro turno"),
      refs: m.solo ? [8, 22] : [8],
      items: [
        item("first-turn", t("Decide who starts", "Decida quem começa"), m.solo
          ? [t("You take every turn. On the first turn, the character with the solo token (the leftmost in your row) does the 4 actions.", "Você faz todos os turnos. No primeiro turno, o personagem com o marcador solo (o mais à esquerda da fileira) faz as 4 ações.")]
          : m.firstCharacters
            ? [t("The player with Frodo (player 1) takes the first turn. Play continues clockwise.", "O jogador com Frodo (jogador 1) faz o primeiro turno. O jogo segue no sentido horário.")]
            : [t("The player whose hand contains the region card showing the lowest number takes the first turn. Play continues clockwise.", "O jogador cuja mão tem a carta de região com o menor número faz o primeiro turno. O jogo segue no sentido horário.")])
      ]
    });
    return phases;
  }

  function setupSection(index) {
    const m = match();
    const phases = setupPhases();
    const allItems = phases.flatMap((phase) => phase.items);
    const validIds = new Set(allItems.map((entry) => entry.id));
    const normalized = setupChecks.filter((id) => validIds.has(id));
    if (normalized.length !== setupChecks.length) {
      setupChecks = normalized;
      saveChecks();
    }
    const checkedCount = allItems.filter((entry) => setupChecks.includes(entry.id)).length;
    const phaseMarkup = phases.map((phase, phaseIndex) => `
      <section class="setup-phase">
        <div class="setup-phase-header">
          <span class="setup-phase-number">${String(phaseIndex + 1).padStart(2, "0")}</span>
          <h3>${phase.title}</h3>
          <div class="setup-phase-references">${phase.refs.map((page) => ref(page)).join("")}</div>
        </div>
        <div class="setup-check-list">
          ${phase.items.map((entry) => `
            <label class="setup-check">
              <input type="checkbox" data-setup-check="${escapeHtml(entry.id)}" ${setupChecks.includes(entry.id) ? "checked" : ""}>
              <span>
                <strong>${entry.title}</strong>
                <small class="setup-substeps" role="list">${entry.lines.map((line) => `<span role="listitem">${line}</span>`).join("")}</small>
              </span>
            </label>`).join("")}
        </div>
      </section>`).join("");
    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), index, refs(4, 5, 6, 7, 8))}
      <p class="section-lead">${m.solo
        ? t("Setup as normal, with the solo changes already folded in.", "Preparação normal, já com as mudanças do solo incluídas.")
        : t("The rulebook’s 10 setup steps, filtered for this match.", "Os 10 passos de preparação do manual, filtrados para esta partida.")}</p>
      ${inventory(m)}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div><h3>${t("Set up the table in order", "Prepare a mesa em ordem")}</h3><p>${t("Each checkbox groups one coherent setup stage; complete all of its substeps before checking it.", "Cada caixa agrupa uma etapa coerente; complete todas as subetapas antes de marcá-la.")}</p></div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${checkedCount} of ${allItems.length} setup groups checked`, `${checkedCount} de ${allItems.length} grupos de preparação concluídos`)}</span>
            <progress id="setup-progress" max="${Math.max(allItems.length, 1)}" value="${checkedCount}" aria-label="${t("Setup checklist progress", "Progresso da checklist")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t("Changing a match choice above clears this checklist. Changing language does not. “Uncheck all” clears only the checkboxes.", "Alterar uma escolha da partida acima limpa esta checklist. Trocar o idioma não limpa. “Desmarcar tudo” limpa somente as caixas.")}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>`;
  }

  // --- Turn and actions ----------------------------------------------------

  function turnSection(index) {
    const m = match();
    const order = steps([
      t("<strong>Do actions</strong> (below).", "<strong>Fazer ações</strong> (abaixo)."),
      t("<strong>Draw 2 player cards</strong> (including any Skies Darken cards).", "<strong>Comprar 2 cartas de jogador</strong> (inclusive eventuais Skies Darken)."),
      t("<strong>Draw shadow cards</strong>, as many as the current threat rate.", "<strong>Comprar cartas da Sombra</strong>, tantas quanto a taxa de ameaça atual.")
    ]);
    const actionsBody = m.solo
      ? para(t(
        "During your turn, the character with the solo token can do up to 4 actions. Either before or after all of that character’s actions, you may do 1 bonus action with Frodo & Sam. Then complete the rest of the turn as usual. Finally, shift the solo token to the right onto the next character in the row; after all 4 characters in the row have had a turn, return it to the leftmost character. The token never goes on Frodo & Sam, so they never get a 4-action turn — but other characters can bring them along when they Travel, to help them toward Mount Doom.",
        "No seu turno, o personagem com o marcador solo pode fazer até 4 ações. Antes ou depois de todas as ações desse personagem, você pode fazer 1 ação bônus com Frodo & Sam. Depois complete o resto do turno normalmente. Por fim, passe o marcador solo para a direita, para o próximo personagem da fileira; depois que os 4 personagens da fileira tiverem jogado, volte-o ao mais à esquerda. O marcador nunca vai para Frodo & Sam, então eles nunca têm um turno de 4 ações — mas outros personagens podem levá-los junto ao fazer Travel, para ajudá-los a chegar à Montanha da Perdição."
      ))
      : para(t(
        "On your turn you may do up to 4 actions with 1 of your characters and up to 1 action with the other. You may start with either character, but you must complete all actions with one before doing any with the other. Example: with Gimli and Legolas, do 4 with Gimli then 1 with Legolas, or 1 with Legolas then 4 with Gimli. In the rare case that you are missing a character, do 4 actions with the one you have.",
        "No seu turno você pode fazer até 4 ações com 1 dos seus personagens e até 1 ação com o outro. Pode começar por qualquer um, mas precisa terminar todas as ações de um antes de fazer qualquer ação com o outro. Exemplo: com Gimli e Legolas, faça 4 com Gimli e depois 1 com Legolas, ou 1 com Legolas e depois 4 com Gimli. No caso raro de faltar um personagem, faça 4 ações com o que você tem."
      ));
    const actions = [];
    actions.push(block(`${icon("action-travel")} Travel ${t("", "(Viajar)")}`, [
      para(t("Move the character you are doing actions with to a connected location along a normal path, a special path or a battle line. Any of the other characters in your starting location may come along with you, while the rest stay (ask before moving another player’s character), and you may take any of the friendly troops there — some, all or none. Friendly troops never move on their own.", "Mova o personagem com que você está agindo para um local conectado por um caminho normal, um caminho especial ou uma linha de batalha. Quaisquer dos outros personagens no seu local de partida podem vir junto, e os demais ficam (peça permissão antes de mover o personagem de outro jogador), e você pode levar quaisquer tropas aliadas dali — algumas, todas ou nenhuma. Tropas aliadas nunca se movem sozinhas.")),
      list([
        t("<strong>Special paths</strong> show a cost printed on them: the character doing the Travel action must spend those additional symbols.", "<strong>Caminhos especiais</strong> mostram um custo impresso: o personagem que faz o Travel precisa gastar esses símbolos adicionais."),
        t("<strong>Battle lines</strong> can be traveled in either direction; ignore their arrows (they only direct shadow troops).", "<strong>Linhas de batalha</strong> podem ser percorridas nos dois sentidos; ignore as setas (elas só orientam as tropas da Sombra)."),
        t(`<strong>When Frodo travels</strong> — either he does the Travel action, or another character’s Travel brings him along — the character doing the Travel must either spend 1 ${icon("stealth")} Stealth or roll a search in the destination (see Dice). This is in addition to any special path cost.`, `<strong>Quando Frodo viaja</strong> — ele mesmo faz o Travel, ou o Travel de outro personagem o leva junto — o personagem que faz o Travel precisa gastar 1 ${icon("stealth")} Stealth ou rolar uma busca no destino (veja Dados). Isso é além do custo de um caminho especial.`)
      ])
    ].join(""), refs(10, 11)));
    if (!m.solo) {
      actions.push(block(`${icon("action-fellowship")} Fellowship ${t("", "(Sociedade)")}`, [
        para(t("If your character is in the same location as another player’s character and you both agree, do 1 of the following: give that player a card matching your region, or take a card matching your region from that player. “Your region” is the region your acting character is in.", "Se seu personagem estiver no mesmo local que o personagem de outro jogador e ambos concordarem, faça 1 destas: dê a esse jogador uma carta da sua região, ou pegue dele uma carta da sua região. “Sua região” é a região onde está o personagem que age.")),
        para(t("If the player who receives the card now has more than 7 cards, that player must immediately discard a card or play an event card. Symbol tokens cannot be handed over with Fellowship. This is a good way for Frodo to collect the Resistance he needs to destroy the One Ring.", "Se quem recebe a carta passar a ter mais de 7 cartas, essa pessoa precisa descartar uma carta ou jogar uma carta de evento imediatamente. Fichas de símbolo não podem ser passadas com Fellowship. É um bom jeito de Frodo juntar a Resistance de que precisa para destruir o Um Anel."))
      ].join(""), ref(12)));
    }
    actions.push(block(`${icon("action-prepare")} Prepare ${t("", "(Preparar)")}`, [
      para(m.solo
        ? t(`At a haven that is in the card’s region, discard a region card to take a symbol token matching the symbol on the card (${icon("friendship")}, ${icon("valor")}, ${icon("stealth")} or ${icon("resistance")}). If the supply has no token of that type, you cannot do this action. Some region cards cannot be Prepared in solo, because some regions have no haven.`, `Num refúgio que esteja na região da carta, descarte uma carta de região para pegar uma ficha de símbolo igual ao símbolo da carta (${icon("friendship")}, ${icon("valor")}, ${icon("stealth")} ou ${icon("resistance")}). Se a reserva não tiver ficha desse tipo, você não pode fazer esta ação. Algumas cartas de região não podem ser preparadas no solo, porque algumas regiões não têm refúgio.`)
        : t(`At a haven, discard a region card to take a symbol token matching the symbol on the card (${icon("friendship")}, ${icon("valor")}, ${icon("stealth")} or ${icon("resistance")}). If the supply has no token of that type, you cannot do this action. Preparing helps reduce your hand size.`, `Num refúgio, descarte uma carta de região para pegar uma ficha de símbolo igual ao símbolo da carta (${icon("friendship")}, ${icon("valor")}, ${icon("stealth")} ou ${icon("resistance")}). Se a reserva não tiver ficha desse tipo, você não pode fazer esta ação. Preparar ajuda a reduzir o tamanho da sua mão.`))
    ].join(""), m.solo ? refs(12, 22) : ref(12)));
    actions.push(block(`${icon("action-muster")} Muster ${t("", "(Recrutar)")}`, para(t(
      `At a Dwarven ${icon("dwarven-location")}, Elven ${icon("elven-location")}, Rohirrim ${icon("rohirrim-location")} or Gondor ${icon("gondor-location")} location, spend 1 ${icon("friendship")} Friendship to add 1 troop of that location’s color to it from the supply. You cannot Muster in white or red locations, nor when the supply has no troops of that color left.`,
      `Num local Anão ${icon("dwarven-location")}, Élfico ${icon("elven-location")}, Rohirrim ${icon("rohirrim-location")} ou de Gondor ${icon("gondor-location")}, gaste 1 ${icon("friendship")} Friendship para colocar ali 1 tropa da cor desse local, vinda da reserva. Não é possível recrutar em locais brancos ou vermelhos, nem quando a reserva não tiver mais tropas dessa cor.`
    )), ref(13)));
    actions.push(block(`${icon("action-attack")} Attack ${t("", "(Atacar)")}`, [
      para(t("You may Attack only if there are both friendly troops and shadow troops in your character’s location. First, shift the Eye of Sauron to the region where the attack is taking place (attacks distract Sauron, which can draw his gaze away from Frodo). Then roll a battle: choose how many battle dice to roll, 1 per friendly troop in the location, minimum 1 and maximum 3. You must roll at least 1 die. See Dice for the results.", "Só é possível atacar se houver tropas aliadas e tropas da Sombra no local do seu personagem. Primeiro, mova o Olho de Sauron para a região onde acontece o ataque (ataques distraem Sauron, o que pode afastar o olhar dele de Frodo). Depois role uma batalha: escolha quantos dados de batalha rolar, 1 por tropa aliada no local, mínimo 1 e máximo 3. É obrigatório rolar pelo menos 1 dado. Veja os resultados em Dados."))
    ].join(""), refs(13, 20)));
    actions.push(block(`${icon("action-capture")} Capture ${t("", "(Capturar)")}`, [
      para(t(`If your character is at a shadow stronghold with at least 1 friendly troop and no shadow troops, your character may spend 3 ${icon("valor")} Valor to capture it. The printed strongholds are the locations drawn inside a red starburst: Isengard, Moria, Dol Guldur, Rhûn, Minas Morgul, Udûn, Barad-dûr and Umbar. Dunland, Nûrn and Near Harad are red shadow locations without that starburst, so they cannot be captured. A haven that has fallen is also a stronghold while its token is on it.`, `Se seu personagem estiver numa fortaleza da Sombra com pelo menos 1 tropa aliada e nenhuma tropa da Sombra, ele pode gastar 3 ${icon("valor")} Valor para capturá-la. As fortalezas impressas são os locais desenhados dentro de uma estrela vermelha: Isengard, Moria, Dol Guldur, Rhûn, Minas Morgul, Udûn, Barad-dûr e Umbar. Dunland, Nûrn e Near Harad são locais vermelhos da Sombra sem essa estrela, então não podem ser capturados. Um refúgio que caiu também é fortaleza enquanto a ficha estiver sobre ele.`)),
      list([
        t(`${icon("capture-printed")} A stronghold printed on the board: place a haven token on it. It now works as a haven.`, `${icon("capture-printed")} Uma fortaleza impressa no tabuleiro: coloque uma ficha de refúgio sobre ela. Ela passa a funcionar como refúgio.`),
        t(`${icon("capture-former-haven")} A stronghold that was formerly a haven: remove the shadow stronghold token. It works as a haven again.`, `${icon("capture-former-haven")} Uma fortaleza que antes era refúgio: remova a ficha de fortaleza da Sombra. Ela volta a funcionar como refúgio.`),
        t("Then shift the Eye of Sauron to that region and gain 2 hope.", "Depois mova o Olho de Sauron para aquela região e ganhe 2 de esperança."),
        t("Once a location has been captured and is a haven, do not add a shadow troop there when a shadow card tells you to. The rulebook names Moria, Isengard, Dol Guldur and Umbar for this, and the same skip applies to any captured location.", "Depois que um local foi capturado e é um refúgio, não coloque tropa da Sombra ali quando uma carta da Sombra mandar. O manual cita Moria, Isengard, Dol Guldur e Umbar, e a mesma regra vale para qualquer local capturado.")
      ])
    ].join(""), refs(14, 15)));
    actions.push(block(t("Special action: Destroying the One Ring", "Ação especial: Destruir o Um Anel"), [
      para(t(`Frodo can do this special action at Mount Doom by spending 5 ${icon("resistance")} Resistance, but only after all the other objectives have been completed. Frodo makes a final search roll: 1 search die for each Nazgûl in his region and each shadow troop in his location (as usual), plus 1 search die for each hope missing from the hope track (for example, with only 3 hope left, add 5 dice). Roll at most 7 dice. After that roll is resolved, if at least 1 hope remains, the players win. The rulebook calls this a special action of Frodo’s, so do it as one of his actions on a turn${match().solo ? " (in solo, his 1 bonus action)" : ""}.`, `Frodo pode fazer esta ação especial na Montanha da Perdição gastando 5 ${icon("resistance")} Resistance, mas só depois de cumpridos todos os outros objetivos. Frodo faz uma rolagem final de busca: 1 dado de busca para cada Nazgûl na região dele e cada tropa da Sombra no local dele (como sempre), mais 1 dado de busca para cada ponto de esperança que falta na trilha (por exemplo, com só 3 de esperança, acrescente 5 dados). Role no máximo 7 dados. Depois de resolver essa rolagem, se restar pelo menos 1 de esperança, os jogadores vencem. O manual chama isso de ação especial de Frodo, então ela é feita como uma das ações dele num turno${match().solo ? " (no solo, a ação bônus dele)" : ""}.`))
    ].join(""), refs(12, 19)));
    return `
      ${sectionHeading("turn", t("Playing the game", "Jogando a partida"), index, refs(10, 22))}
      ${block(t("Turn order", "Ordem do turno"), order + para(m.solo
        ? t("After the Draw Shadow Cards step, your turn ends and the solo token moves on.", "Depois do passo Comprar cartas da Sombra, seu turno termina e o marcador solo avança.")
        : t("After the Draw Shadow Cards step your turn ends; the player on your left takes the next turn. Your hand can hold both region and event cards. Most event cards can be played at any time, even on another player’s turn.", "Depois do passo Comprar cartas da Sombra seu turno termina; o jogador à sua esquerda faz o próximo turno. Sua mão pode ter cartas de região e de evento. A maioria dos eventos pode ser jogada a qualquer momento, até no turno de outro jogador.")), m.solo ? refs(10, 22) : ref(10))}
      ${block(t("1. Do actions", "1. Fazer ações"), actionsBody + para(t(`Select any combination of the ${m.solo ? 5 : 6} actions below. You may do the same action several times; each time counts as 1 action. Character abilities (on the character cards) may change how you do an action.`, `Escolha qualquer combinação das ${m.solo ? 5 : 6} ações abaixo. Você pode repetir a mesma ação; cada vez conta como 1 ação. Habilidades de personagem (nas cartas de personagem) podem mudar como você faz uma ação.`)), m.solo ? refs(10, 22) : ref(10))}
      <h3 class="subhead" id="actions">${t("The actions", "As ações")}</h3>
      ${actions.join("")}
      ${m.solo ? note(t("The Fellowship action is not used in a solo game, since all of your characters share the same hand of cards.", "A ação Fellowship não é usada na partida solo, pois todos os seus personagens compartilham a mesma mão.")) : ""}`;
  }

  // --- Dice ------------------------------------------------------------------

  function diceSection(index) {
    return `
      ${sectionHeading("dice", t("Dice: searches and battles", "Dados: buscas e batalhas"), index, refs(11, 13, 20))}
      ${block(`${icon("search-die")} ${t("Rolling a search", "Rolando uma busca")}`, [
        para(t("Whenever you are told to roll a search: roll 1 search die for each Nazgûl in Frodo’s region and each shadow troop in Frodo’s location (if he is traveling, check his destination). Roll at most 7 dice. If there are no Nazgûl and no shadow troops, do not roll.", "Sempre que mandarem rolar uma busca: role 1 dado de busca para cada Nazgûl na região de Frodo e cada tropa da Sombra no local de Frodo (se ele estiver viajando, verifique o destino). Role no máximo 7 dados. Se não houver Nazgûl nem tropas da Sombra, não role.")),
        `<div class="lotr-results">
          <div>${icon("slip-by")}<p><strong>Slip By</strong> — ${t("no effect.", "sem efeito.")}</p></div>
          <div>${icon("weary")}<p><strong>Weary</strong> — ${t("lose 1 hope.", "perca 1 de esperança.")}</p></div>
          <div>${icon("exposed")}<p><strong>Exposed</strong> — ${t("lose 1 hope. Ignore this result if Frodo is in a haven.", "perca 1 de esperança. Ignore este resultado se Frodo estiver num refúgio.")}</p></div>
          <div>${icon("recall")}<p><strong>Recall</strong> — ${t("if Nazgûl are present (in Frodo’s region), move 1 of them to Mordor. If Frodo is in Mordor, no effect.", "se houver Nazgûl presentes (na região de Frodo), mova 1 deles para Mordor. Se Frodo estiver em Mordor, sem efeito.")}</p></div>
        </div>`,
        para(t(`<strong>Fate:</strong> after the roll, any characters present in Frodo’s location may reroll 1 search die for each ${icon("resistance")} Resistance they spend. After a reroll you may spend more Resistance to reroll again.`, `<strong>Fate (Destino):</strong> depois da rolagem, quaisquer personagens presentes no local de Frodo podem rerrolar 1 dado de busca para cada ${icon("resistance")} Resistance que gastarem. Depois de rerrolar, pode-se gastar mais Resistance para rerrolar de novo.`)),
        para(t("When Frodo Puts on the Ring (an ability printed on his character card), he loses 1 hope, shifts the Eye to his region, then rolls a search ignoring all shadow troops in his location; Nazgûl are not ignored.", "Quando Frodo Puts on the Ring (Põe o Anel — uma habilidade impressa na carta dele), ele perde 1 de esperança, move o Olho para a região dele e rola uma busca ignorando todas as tropas da Sombra no seu local; os Nazgûl não são ignorados."))
      ].join(""), refs(11, 20))}
      ${block(`${icon("battle-die")} ${t("Rolling a battle", "Rolando uma batalha")}`, [
        list([
          t("<strong>Started by the Attack action:</strong> roll up to 1 battle die per friendly troop in your character’s location (minimum 1, maximum 3). Shift the Eye first, as the Attack action says.", "<strong>Iniciada pela ação Attack:</strong> role até 1 dado de batalha por tropa aliada no local do seu personagem (mínimo 1, máximo 3). Mova o Olho antes, como manda a ação Attack."),
          t("<strong>Started by a shadow card or a Skies Darken card:</strong> roll 1 battle die per shadow troop in the battle location (maximum 3). Do not shift the Eye.", "<strong>Iniciada por uma carta da Sombra ou Skies Darken:</strong> role 1 dado de batalha por tropa da Sombra no local da batalha (máximo 3). Não mova o Olho.")
        ]),
        `<div class="lotr-results">
          <div>${icon("rout")}<p><strong>Rout</strong> — ${t("remove 1 shadow troop.", "remova 1 tropa da Sombra.")}</p></div>
          <div>${icon("exchange")}<p><strong>Exchange</strong> — ${t("remove 1 shadow troop and 1 friendly troop.", "remova 1 tropa da Sombra e 1 tropa aliada.")}</p></div>
          <div>${icon("overrun")}<p><strong>Overrun</strong> — ${t("remove 1 friendly troop. Ignore this result if the battle is in a haven.", "remova 1 tropa aliada. Ignore este resultado se a batalha for num refúgio.")}</p></div>
          <div>${icon("nazgul-result")}<p><strong>Nazgûl!</strong> — ${t("if Nazgûl are present (in the battle location’s region), remove 2 friendly troops; otherwise no effect.", "se houver Nazgûl presentes (na região do local da batalha), remova 2 tropas aliadas; senão, sem efeito.")}</p></div>
        </div>`,
        list([
          t(`<strong>Fate:</strong> after rolling, any characters present in the battle location may reroll 1 battle die for each ${icon("resistance")} Resistance they spend, and may keep spending to reroll again.`, `<strong>Fate (Destino):</strong> depois da rolagem, quaisquer personagens presentes no local da batalha podem rerrolar 1 dado de batalha para cada ${icon("resistance")} Resistance que gastarem, e podem continuar gastando para rerrolar de novo.`),
          t(`<strong>Show Valor:</strong> after rolling, characters present may remove 1 shadow troop for each ${icon("valor")} Valor they spend.`, `<strong>Show Valor (Mostrar Bravura):</strong> depois da rolagem, personagens presentes podem remover 1 tropa da Sombra para cada ${icon("valor")} Valor que gastarem.`),
          t("<strong>Losing a haven:</strong> if shadow troops now occupy a haven and no friendly troops are present, it becomes a shadow stronghold: cover it with a shadow stronghold token (or, if it was a captured stronghold, remove its haven token) and lose 3 hope.", "<strong>Perder um refúgio:</strong> se agora houver tropas da Sombra num refúgio e nenhuma tropa aliada, ele vira fortaleza da Sombra: cubra-o com uma ficha de fortaleza da Sombra (ou, se era uma fortaleza capturada, remova a ficha de refúgio) e perca 3 de esperança."),
          t("<strong>End:</strong> when all of this is resolved, the battle roll is over. Both friendly and shadow troops may remain in the location.", "<strong>Fim:</strong> resolvido tudo isso, a batalha acaba. Podem restar tropas aliadas e da Sombra no local.")
        ]),
        list([
          t("If friendly troops must be removed and several armies are present, the current player decides which troops to remove.", "Se for preciso remover tropas aliadas e houver vários exércitos no local, o jogador da vez decide quais remover."),
          t("If you must remove more troops than are present, remove what you can and ignore the excess.", "Se for preciso remover mais tropas do que existem, remova o que puder e ignore o excesso."),
          t("Removed troops go back to the supply, where Muster, Reinforce and Skies Darken take them from again. (Interpretation: the rulebook does not say this explicitly, but its supply limits only make sense that way.)", "Tropas removidas voltam para a reserva, de onde Muster, Reinforce e Skies Darken as tiram de novo. (Interpretação: o manual não diz isso explicitamente, mas os limites de reserva só fazem sentido assim.)"),
          t("Shift the Eye only for the Attack action — not when Skies Darken or shadow cards start a battle, nor when other abilities remove shadow troops.", "Mova o Olho só na ação Attack — não quando Skies Darken ou cartas da Sombra iniciam uma batalha, nem quando outras habilidades removem tropas da Sombra.")
        ])
      ].join(""), refs(13, 20))}`;
  }

  // --- Player cards -----------------------------------------------------------

  function playerCardsSection(index) {
    return `
      ${sectionHeading("player-cards", t("2. Draw 2 player cards", "2. Comprar 2 cartas de jogador"), index, ref(15))}
      ${block(t("Drawing", "Compra"), para(t("After doing actions, draw the top 2 cards of the player deck together. If the player deck runs out, lose 1 hope for each player card you cannot draw.", "Depois das ações, compre juntas as 2 cartas do topo do baralho de jogadores. Se o baralho de jogadores acabar, perca 1 de esperança para cada carta que não puder comprar.")), ref(15))}
      ${block(t("Skies Darken cards", "Cartas Skies Darken (Os Céus Escurecem)"), [
        para(t("If your draw includes a Skies Darken card, resolve it at once, in this order:", "Se a sua compra incluir uma carta Skies Darken, resolva-a na hora, nesta ordem:")),
        steps([
          t(`${icon("skies-shadow-grows")} <strong>The Shadow Grows:</strong> advance the threat rate marker 1 space on the threat rate track.`, `${icon("skies-shadow-grows")} <strong>The Shadow Grows (A Sombra Cresce):</strong> avance o marcador de taxa de ameaça 1 espaço na trilha.`),
          t(`${icon("skies-i-see-you")} <strong>I See You!:</strong> if the Eye of Sauron is in Frodo’s region, lose 2 hope. Otherwise, shift the Eye to Frodo’s region.`, `${icon("skies-i-see-you")} <strong>I See You! (Eu Vejo Você!):</strong> se o Olho de Sauron estiver na região de Frodo, perca 2 de esperança. Senão, mova o Olho para a região de Frodo.`),
          t(`${icon("skies-under-cover")} <strong>Under Cover of Darkness:</strong> add 3 shadow troops to the location shown on the card. Lose 1 hope for each shadow troop you cannot place because the supply is empty. If friendly troops are in that location, roll a battle (1 die per shadow troop there, maximum 3).`, `${icon("skies-under-cover")} <strong>Under Cover of Darkness (Sob o Manto da Escuridão):</strong> coloque 3 tropas da Sombra no local mostrado na carta. Perca 1 de esperança por tropa que não puder colocar por falta na reserva. Se houver tropas aliadas nesse local, role uma batalha (1 dado por tropa da Sombra ali, máximo 3).`),
          t(`${icon("skies-danger")} <strong>The Danger Intensifies:</strong> shuffle the cards in the shadow discard pile, then place them face down on top of the shadow deck.`, `${icon("skies-danger")} <strong>The Danger Intensifies (O Perigo Aumenta):</strong> embaralhe as cartas do descarte da Sombra e coloque-as viradas para baixo no topo do baralho da Sombra.`)
        ]),
        para(t("It is rare but possible to draw 2 Skies Darken cards at once: do all 4 steps once, then do them all again. After resolving Skies Darken cards, remove them from the game; do not draw replacement cards.", "É raro, mas possível, comprar 2 Skies Darken de uma vez: faça os 4 passos uma vez e depois todos de novo. Depois de resolvidas, as Skies Darken são removidas do jogo; não compre cartas para substituí-las."))
      ].join(""), ref(15))}
      ${block(t("Event cards", "Cartas de evento"), para(t("During a turn, any player may play event cards. Playing one is not an action. The player who plays it decides how it is used, then discards it to the player discard pile. The effect is printed on each card.", "Durante um turno, qualquer jogador pode jogar cartas de evento. Jogar uma não é uma ação. Quem a joga decide como usá-la e depois a descarta na pilha de descarte de jogadores. O efeito está impresso em cada carta.")), refs(15, 20))}
      ${block(t("Hand limit", "Limite de mão"), para(t("If you ever have more than 7 cards in hand (after first resolving any Skies Darken cards you drew), discard cards and/or play events until you have 7. Only player cards count toward the limit; tokens do not.", "Se em algum momento você tiver mais de 7 cartas na mão (depois de resolver eventuais Skies Darken compradas), descarte cartas e/ou jogue eventos até ficar com 7. Só cartas de jogador contam para o limite; fichas não.")), refs(15, 20))}`;
  }

  // --- Shadow cards -----------------------------------------------------------

  function shadowSection(index) {
    return `
      ${sectionHeading("shadow", t("3. Draw shadow cards", "3. Comprar cartas da Sombra"), index, refs(16, 18, 19))}
      ${block(t("Which half to resolve", "Qual metade resolver"), [
        para(t("Flip the top card of the shadow deck and place it face up next to the deck. The flipped card shows 2 sections, and the back of the new top card of the deck now shows either a red flag or a black banner. Resolve only half of the flipped card:", "Vire a carta do topo do baralho da Sombra e coloque-a virada para cima ao lado do baralho. A carta virada mostra 2 seções, e o verso da nova carta do topo do baralho mostra uma bandeira vermelha ou um estandarte preto. Resolva só metade da carta virada:")),
        list([
          t(`${icon("action-advance")} <strong>Red flag on top of the deck:</strong> resolve the top section — Advance.`, `${icon("action-advance")} <strong>Bandeira vermelha no topo do baralho:</strong> resolva a seção de cima — Advance (Avançar).`),
          t(`${icon("action-reinforce")} <strong>Black banner on top of the deck:</strong> resolve the bottom section — Reinforce.`, `${icon("action-reinforce")} <strong>Estandarte preto no topo do baralho:</strong> resolva a seção de baixo — Reinforce (Reforçar).`)
        ]),
        para(t("Do this as many times as the current threat rate shown on the threat rate track. Place the flipped cards in the resolve area of the board to keep count; when you have resolved all of them for this turn, move them to the shadow discard area.", "Faça isso tantas vezes quanto a taxa de ameaça atual na trilha. Coloque as cartas viradas na área de resolução do tabuleiro para contar; quando tiver resolvido todas deste turno, mova-as para a área de descarte da Sombra.")),
        para(t("You may look at both discard piles at any time. You may not look at the backs of the shadow draw pile except for its top card.", "Vocês podem olhar as duas pilhas de descarte a qualquer momento. Não podem olhar os versos do baralho de compra da Sombra, exceto a carta do topo."))
      ].join(""), refs(16, 20))}
      ${block(`${icon("action-advance")} Advance ${t("", "(Avançar)")}`, [
        para(t("The top section shows a battle line. Battle lines start at a red shadow location, follow a colored arrow and end at a haven. Move every shadow troop on that battle line 1 space forward: begin with the frontmost shadow troops on the line, then the next location back with shadow troops, and so on, until every troop on the line has moved once.", "A seção de cima mostra uma linha de batalha. Linhas de batalha começam num local vermelho da Sombra, seguem uma seta colorida e terminam num refúgio. Mova cada tropa da Sombra dessa linha 1 espaço para frente: comece pelas tropas mais à frente na linha, depois o próximo local para trás com tropas da Sombra, e assim por diante, até que todas as tropas da linha tenham se movido uma vez.")),
        list([
          t("Shadow troops advance even if they are in a location with friendly troops.", "Tropas da Sombra avançam mesmo que estejam num local com tropas aliadas."),
          t("If there are no shadow troops anywhere on that battle line, nothing happens.", "Se não houver tropas da Sombra em nenhum ponto da linha, nada acontece."),
          t("Shadow troops already at the end of the line (the haven) do not advance, but still roll a battle if friendly troops are present.", "Tropas da Sombra já no fim da linha (o refúgio) não avançam, mas ainda rolam batalha se houver tropas aliadas."),
          t("<strong>Resolve battles:</strong> after advancing, roll a battle in each location on that line that has both shadow and friendly troops, starting with the frontmost location and moving backward (1 die per shadow troop, max 3).", "<strong>Resolver batalhas:</strong> depois do avanço, role uma batalha em cada local da linha que tenha tropas da Sombra e aliadas, começando pelo local mais à frente e indo para trás (1 dado por tropa da Sombra, máx. 3)."),
          t("<strong>Losing a haven:</strong> if shadow troops now occupy a haven with no friendly troops, it becomes a shadow stronghold (token) and you lose 3 hope.", "<strong>Perder um refúgio:</strong> se agora houver tropas da Sombra num refúgio sem tropas aliadas, ele vira fortaleza da Sombra (ficha) e vocês perdem 3 de esperança.")
        ])
      ].join(""), refs(16, 17))}
      ${block(`${icon("action-reinforce")} Reinforce ${t("", "(Reforçar)")}`, [
        list([
          t("Add 1 shadow troop to the location shown. There is no limit to shadow troops in a location. If the supply is empty, lose 1 hope for each troop you cannot place.", "Coloque 1 tropa da Sombra no local mostrado. Não há limite de tropas da Sombra num local. Se a reserva estiver vazia, perca 1 de esperança por tropa que não puder colocar."),
          t("If that location was captured (it is now a haven), do not add the shadow troop.", "Se esse local foi capturado (agora é refúgio), não coloque a tropa da Sombra."),
          t("<strong>Resolve battles:</strong> if friendly troops are present there, roll a battle (1 die per shadow troop, max 3).", "<strong>Resolver batalhas:</strong> se houver tropas aliadas ali, role uma batalha (1 dado por tropa da Sombra, máx. 3)."),
          t("<strong>Special order:</strong> then follow the instruction at the bottom of the card. There are 3 kinds:", "<strong>Ordem especial:</strong> depois siga a instrução no pé da carta. Há 3 tipos:")
        ]),
        `<div class="lotr-results">
          <div>${icon("order-shift-eye")}<p><strong>${t("Shift the Eye of Sauron to Frodo’s region", "Mover o Olho de Sauron para a região de Frodo")}</strong> ${t("(16 cards) — if the Eye is already in Frodo’s region, roll a search instead.", "(16 cartas) — se o Olho já estiver na região de Frodo, role uma busca.")}</p></div>
          <div>${icon("order-move-nazgul")}<p><strong>${t("Move 2 Nazgûl closer to Frodo", "Mover 2 Nazgûl para perto de Frodo")}</strong> ${t("(16 cards) — move the 2 Nazgûl closest to Frodo (not counting those already in his region), 1 at a time, 1 region closer to him.", "(16 cartas) — mova os 2 Nazgûl mais próximos de Frodo (sem contar os que já estão na região dele), 1 por vez, 1 região mais perto dele.")}</p></div>
          <div>${icon("order-deploy-nazgul")}<p><strong>${t("Deploy 3 Nazgûl from Mordor to the Eye of Sauron", "Enviar 3 Nazgûl de Mordor até o Olho de Sauron")}</strong> ${t("(16 cards) — move 3 Nazgûl directly into the Eye’s region, 1 at a time, from Mordor. If Mordor is empty, take them 1 at a time from the region(s) with the most Nazgûl (not the Eye’s region). If the Eye is in Mordor, instead recall 3 Nazgûl to Mordor, 1 at a time, from the largest group outside Mordor.", "(16 cartas) — mova 3 Nazgûl diretamente para a região do Olho, 1 por vez, saindo de Mordor. Se Mordor estiver vazia, pegue-os 1 por vez da(s) região(ões) com mais Nazgûl (sem ser a região do Olho). Se o Olho estiver em Mordor, em vez disso chame de volta 3 Nazgûl para Mordor, 1 por vez, do maior grupo fora de Mordor.")}</p></div>
        </div>`,
        para(t("<strong>Multiple possible outcomes:</strong> if a special order could be carried out in several ways (for example, several paths for a Nazgûl or tied groups), the current player chooses.", "<strong>Vários resultados possíveis:</strong> se uma ordem especial puder ser cumprida de várias formas (por exemplo, vários caminhos para um Nazgûl ou grupos empatados), o jogador da vez escolhe."))
      ].join(""), refs(18, 19))}
      ${block(t("Special shadow cards", "Cartas especiais da Sombra"), para(t("The Drums of War and The Wheels of Saruman work differently. They start in the shadow discard pile and enter the deck when The Danger Intensifies reshuffles it. When either is drawn, follow the instructions on the card instead of advancing or reinforcing.", "The Drums of War e The Wheels of Saruman funcionam de outro jeito. Começam no descarte da Sombra e entram no baralho quando The Danger Intensifies o reembaralha. Quando uma delas for comprada, siga as instruções da carta em vez de avançar ou reforçar.")), refs(4, 19))}`;
  }

  // --- Winning, hope, fine points ---------------------------------------------

  function winningSection(index) {
    const m = match();
    return `
      ${sectionHeading("winning", t("Winning and losing", "Vitória e derrota"), index, refs(19, 20))}
      <div class="quick-grid">
        ${card(t("You win", "Vocês vencem"), para(t("When Frodo successfully completes the Destroy the One Ring objective — the final search roll leaves at least 1 hope.", "Quando Frodo cumpre o objetivo Destroy the One Ring — a rolagem final de busca deixa pelo menos 1 de esperança.")), ref(19))}
        ${card(t("You lose", "Vocês perdem"), para(t("If Frodo loses all hope: the hope marker reaches the 0 space on the hope track.", "Se Frodo perder toda a esperança: o marcador chega ao espaço 0 da trilha de esperança.")), ref(19))}
        ${card(t("Completing objectives", "Cumprir objetivos"), para(t(`The requirements of each objective are printed on its card. When they are met, follow the card’s “When Completed” rules, then turn it face down to show it is done. Destroy the One Ring can only be completed after all ${m.objectiveCount - 1} other objective cards.`, `Os requisitos de cada objetivo estão impressos na carta. Quando forem cumpridos, sigam as regras “When Completed” (Quando Cumprido) da carta e virem-na para baixo para marcar que está feito. Destroy the One Ring só pode ser cumprido depois das outras ${m.objectiveCount - 1} cartas de objetivo.`)), ref(19))}
      </div>
      <div class="quick-grid" id="hope">
        ${card(`${icon("despair")} ${t("Losing hope", "Perder esperança")}`, list([
          t("Each Weary or Exposed result on a search: lose 1.", "Cada resultado Weary ou Exposed numa busca: perca 1."),
          t("A Skies Darken card drawn while the Eye is in Frodo’s region: lose 2.", "Uma Skies Darken comprada com o Olho na região de Frodo: perca 2."),
          t("Shadow troops take over a haven: lose 3.", "Tropas da Sombra tomam um refúgio: perca 3."),
          t("Each shadow troop you must add when the supply is empty: lose 1.", "Cada tropa da Sombra que precisa ser colocada com a reserva vazia: perca 1."),
          t("Each player card you must draw when the player deck is empty: lose 1.", "Cada carta de jogador que precisa ser comprada com o baralho vazio: perca 1."),
          t("Some abilities, such as Frodo putting on the Ring, also cost hope.", "Algumas habilidades, como Frodo pôr o Anel, também custam esperança.")
        ]), ref(19))}
        ${card(`${icon("hope")} ${t("Gaining hope", "Ganhar esperança")}`, para(t("Capturing a shadow stronghold gains 2 hope. Many objectives and some abilities also give hope. If the hope marker is at the top of the track, you cannot gain more.", "Capturar uma fortaleza da Sombra dá 2 de esperança. Muitos objetivos e algumas habilidades também dão esperança. Se o marcador estiver no topo da trilha, não é possível ganhar mais.")), ref(19))}
      </div>`;
  }

  function finePointsSection(index) {
    return `
      ${sectionHeading("fine-points", t("Fine points", "Pontos finos"), index, ref(20))}
      <div class="quick-grid">
        ${card(t("Timing", "Momento"), list([
          t("Most events and some character abilities can be used at any time, on any player’s turn — but not while a search, a battle, or another card or ability is resolving, unless explicitly allowed. For example, you cannot play an event until all steps of a shadow card are resolved, but you can play one before drawing the next shadow card.", "A maioria dos eventos e algumas habilidades podem ser usados a qualquer momento, no turno de qualquer jogador — mas não enquanto uma busca, uma batalha ou outra carta ou habilidade estiver sendo resolvida, salvo permissão explícita. Por exemplo, não dá para jogar um evento antes de resolver todos os passos de uma carta da Sombra, mas dá para jogar um antes de comprar a próxima carta da Sombra."),
          t("Skies Darken cards and shadow cards are resolved immediately when drawn.", "Cartas Skies Darken e da Sombra são resolvidas assim que compradas."),
          t("If a haven has shadow troops and no friendly troops after a battle, an action or any other effect, lose 3 hope and turn it into a shadow stronghold.", "Se um refúgio ficar com tropas da Sombra e sem tropas aliadas depois de uma batalha, ação ou qualquer outro efeito, percam 3 de esperança e transformem-no em fortaleza da Sombra."),
          t("If 2 card effects happen at the same time, the players choose their order freely.", "Se 2 efeitos de carta acontecerem ao mesmo tempo, os jogadores escolhem a ordem livremente.")
        ]), ref(20))}
        ${card(t("Cards", "Cartas"), list([
          t("Characters controlled by the same player share that player’s hand and tokens: gain a card or token with one character and use it with another.", "Personagens do mesmo jogador compartilham a mão e as fichas desse jogador: ganhe uma carta ou ficha com um personagem e use-a com outro."),
          t("You may spend a card’s symbol in any location, regardless of the region on the card. The region matters only for some actions (Fellowship, solo Prepare) and character abilities.", "Você pode gastar o símbolo de uma carta em qualquer local, seja qual for a região dela. A região só importa para algumas ações (Fellowship, Prepare no solo) e habilidades."),
          t("Keep player cards face up for all to see. Only player cards count toward the hand limit of 7.", "Mantenha as cartas de jogador viradas para cima, à vista de todos. Só cartas de jogador contam para o limite de 7."),
          t("You may inspect the player discard pile and the shadow discard pile at any time, but not the backs of the shadow draw pile (except its top card).", "Vocês podem olhar o descarte de jogadores e o descarte da Sombra a qualquer momento, mas não os versos do baralho de compra da Sombra (exceto a carta do topo).")
        ]), ref(20))}
        ${card(t("Battles and searches", "Batalhas e buscas"), list([
          t("Characters present in the battle location may spend Valor and Resistance after the dice are rolled; after a Resistance reroll you may spend more to reroll again.", "Personagens presentes no local da batalha podem gastar Valor e Resistance depois de rolar os dados; depois de uma rerrolagem, pode-se gastar mais para rerrolar de novo."),
          t("You cannot Attack in a location without shadow troops, and an Attack always rolls at least 1 die.", "Não é possível atacar num local sem tropas da Sombra, e um ataque sempre rola pelo menos 1 dado."),
          t("Characters present in Frodo’s location may spend Resistance after search dice are rolled, and again after each reroll.", "Personagens presentes no local de Frodo podem gastar Resistance depois de rolar os dados de busca, e de novo depois de cada rerrolagem.")
        ]), ref(20))}
        ${card(t("Not covered by the rulebook", "Não coberto pelo manual"), para(t("The rulebook does not say what happens if the shadow draw pile runs out; The Danger Intensifies (on every Skies Darken card) puts the discard pile back on top of it.", "O manual não diz o que acontece se o baralho de compra da Sombra acabar; The Danger Intensifies (em toda Skies Darken) devolve o descarte ao topo dele.")), ref(15))}
      </div>`;
  }

  function soloSection(index) {
    const m = match();
    if (!m.solo) {
      return "";
    }
    return `
      ${sectionHeading("solo", t("Solo game summary", "Resumo da partida solo"), index, ref(22))}
      <div class="quick-grid">
        ${card(t("Your characters", "Seus personagens"), para(t("Frodo & Sam (card by the board) plus 4 characters in a row in front of you. All 5 share one hand of player cards and one set of symbol tokens.", "Frodo & Sam (carta ao lado do tabuleiro) mais 4 personagens enfileirados à sua frente. Os 5 compartilham uma só mão de cartas e um só conjunto de fichas.")), ref(22))}
        ${card(t("The solo token", "O marcador solo"), para(t("The character with the token does up to 4 actions; Frodo & Sam may do 1 bonus action before or after. After the rest of the turn (draw 2 player cards, then shadow cards equal to the threat rate), move the token to the next character on the right, wrapping back to the leftmost after the 4th.", "O personagem com o marcador faz até 4 ações; Frodo & Sam podem fazer 1 ação bônus antes ou depois. Depois do resto do turno (comprar 2 cartas de jogador, depois cartas da Sombra igual à taxa de ameaça), passe o marcador para o próximo personagem à direita, voltando ao mais à esquerda depois do 4º.")), ref(22))}
        ${card(t("Changed actions", "Ações alteradas"), para(t("Prepare also requires the character to be in the card’s region (and at a haven). Fellowship is not used.", "Prepare também exige que o personagem esteja na região da carta (e num refúgio). Fellowship não é usada.")), ref(22))}
      </div>`;
  }

  function nextGameSection(index) {
    const m = match();
    return `
      ${sectionHeading("next-game", t("Difficulty and suggested scenarios", "Dificuldade e cenários sugeridos"), index, ref(21))}
      <p class="section-lead">${t(`This match: ${levelName(m.level)} with ${scenarioName(m.objectives)}. Use a different mix of characters, objectives, events and Skies Darken cards every time you play. If you regularly win the introductory and standard games, try heroic, epic or legendary.`, `Esta partida: ${levelName(m.level)} com ${scenarioName(m.objectives)}. Use uma combinação diferente de personagens, objetivos, eventos e Skies Darken a cada partida. Se vocês vencem com frequência no Introdutório e no Padrão, experimentem Heroico, Épico ou Lendário.`)}</p>
      <div class="lotr-table-wrap"><table class="lotr-table">
        <thead><tr><th>${t("Level", "Nível")}</th><th>Skies Darken</th><th>${t("Objectives", "Objetivos")}</th></tr></thead>
        <tbody>${LEVELS.map((level) => `<tr class="${level === m.level ? "is-current" : ""}"><td>${levelName(level)}</td><td>${LEVEL_INFO[level].skies}</td><td>${LEVEL_INFO[level].objectives}</td></tr>`).join("")}</tbody>
      </table></div>
      <div class="lotr-table-wrap"><table class="lotr-table">
        <thead><tr><th>${t("Players", "Jogadores")}</th><th>${t("Events", "Eventos")}</th><th>${t("Starting hand", "Mão inicial")}</th></tr></thead>
        <tbody>${[5, 4, 3, 2, 1].map((count) => `<tr class="${count === m.players ? "is-current" : ""}"><td>${playersLabel(count)}</td><td>${PLAYER_INFO[count].events}</td><td>${PLAYER_INFO[count].hand}</td></tr>`).join("")}</tbody>
      </table></div>`;
  }

  // --- Examples ------------------------------------------------------------------

  function examplesSection(index) {
    const m = match();
    const examples = [
      !m.solo ? [t("4 + 1 actions", "4 + 1 ações"), t("You control Gimli and Legolas: you might do 4 actions with Gimli and then 1 with Legolas, or 1 with Legolas and then 4 with Gimli.", "Você controla Gimli e Legolas: pode fazer 4 ações com Gimli e depois 1 com Legolas, ou 1 com Legolas e depois 4 com Gimli."), 10] : null,
      [t("Special path 1", "Caminho especial 1"), t("It is Aragorn’s turn. Aragorn Travels with Arwen and Éowyn from Rivendell to Carrock; the cost is 1 Stealth. Aragorn spends 1 Stealth and moves with all 3 characters into Carrock.", "É o turno de Aragorn. Aragorn faz Travel com Arwen e Éowyn de Rivendell até Carrock; o custo é 1 Stealth. Aragorn gasta 1 Stealth e entra em Carrock com os 3 personagens."), 11],
      [t("Special path 2", "Caminho especial 2"), t("Gimli Travels from Hollin to Moria with 3 Dwarven troops; the cost is 1 Friendship. He spends 1 Friendship and moves with all 3 troops into Moria.", "Gimli faz Travel de Hollin até Moria com 3 tropas Anãs; o custo é 1 Friendship. Ele gasta 1 Friendship e entra em Moria com as 3 tropas."), 11],
      [t("Search", "Busca"), t("Frodo moves from Tharbad to Dunland without spending Stealth. Dunland has 3 shadow troops and Enedwaith (its region) has 1 Nazgûl, so he rolls 4 search dice: Weary, Weary, Slip By and Recall. He spends 1 Resistance to reroll 1 Weary and gets Slip By. He loses 1 hope, and 1 Nazgûl is recalled to Mordor.", "Frodo vai de Tharbad para Dunland sem gastar Stealth. Dunland tem 3 tropas da Sombra e Enedwaith (a região) tem 1 Nazgûl, então ele rola 4 dados de busca: Weary, Weary, Slip By e Recall. Ele gasta 1 Resistance para rerrolar 1 Weary e tira Slip By. Perde 1 de esperança, e 1 Nazgûl volta para Mordor."), 11],
      !m.solo ? [t("Fellowship", "Fellowship"), t("Gandalf and Frodo are in the Shire. Gandalf hands Frodo an Eriador card as an action: it is an Eriador card, Gandalf is in Eriador, and both are in the same location.", "Gandalf e Frodo estão no Condado. Gandalf entrega a Frodo uma carta de Eriador como ação: é uma carta de Eriador, Gandalf está em Eriador e os dois estão no mesmo local."), 12] : null,
      m.solo
        ? [t("Prepare (solo)", "Prepare (solo)"), t("Legolas discards the Friendship region card for Mirkwood to gain a Friendship token while in the Woodland Realm, a haven in Mirkwood.", "Legolas descarta a carta de região Friendship de Mirkwood (Floresta das Trevas) para ganhar uma ficha de Friendship, estando em Woodland Realm, um refúgio em Mirkwood."), 22]
        : [t("Prepare", "Prepare"), t("While at Rivendell, Frodo discards a region card with Resistance on it to take a Resistance token from the supply.", "Em Rivendell, Frodo descarta uma carta de região com Resistance para pegar uma ficha de Resistance da reserva."), 12],
      [t("Muster", "Muster"), t("Éowyn, in Lórien (an Elven location), spends 1 Friendship to add 1 Elven troop to Lórien.", "Éowyn, em Lórien (um local Élfico), gasta 1 Friendship para colocar 1 tropa Élfica em Lórien."), 13],
      [t("Attack", "Attack"), t("Helm’s Deep has 2 Rohirrim troops, 1 Elven troop and 3 shadow troops; Rohan has 2 Nazgûl. Arwen Attacks: she moves the Eye to Rohan and chooses to roll 2 battle dice (she could roll 3) to limit losses. Results: Rout and Nazgûl!. She removes 1 shadow troop, then 2 friendly troops (1 Rohirrim and 1 Elven) because Nazgûl are present. Legolas, also there, spends 1 Valor token to remove 1 more shadow troop. Helm’s Deep is left with 1 friendly troop and 1 shadow troop; Arwen could Attack again with another action.", "Helm’s Deep tem 2 tropas Rohirrim, 1 Élfica e 3 tropas da Sombra; Rohan tem 2 Nazgûl. Arwen ataca: move o Olho para Rohan e escolhe rolar 2 dados de batalha (poderia rolar 3) para limitar perdas. Resultados: Rout e Nazgûl!. Ela remove 1 tropa da Sombra e depois 2 tropas aliadas (1 Rohirrim e 1 Élfica), porque há Nazgûl presentes. Legolas, também ali, gasta 1 ficha de Valor para remover mais 1 tropa da Sombra. Helm’s Deep fica com 1 tropa aliada e 1 da Sombra; Arwen pode atacar de novo com outra ação."), 14],
      [t("Capture", "Capture"), t("Gimli is in Moria, a shadow stronghold, with 1 friendly troop and no shadow troops. He spends 3 Valor, gains 2 hope, moves the Eye to the Misty Mountains and places a haven token on Moria. Moria is now a haven.", "Gimli está em Moria, uma fortaleza da Sombra, com 1 tropa aliada e nenhuma tropa da Sombra. Ele gasta 3 Valor, ganha 2 de esperança, move o Olho para Misty Mountains e coloca uma ficha de refúgio em Moria. Moria agora é um refúgio."), 15],
      [t("Advance", "Advance"), t("The green battle line runs from Moria to Rivendell. The 2 shadow troops in the Weather Hills advance into Rivendell (joining the 1 already there, which does not move because Rivendell is the end of the line); then the 1 in Hollin moves into Tharbad; then the 4 in Moria move into Hollin. Troops in Dunland are not on this line and stay. A battle in Rivendell rolls 3 dice (3 shadow troops): the results remove 2 shadow troops and the last Elven troop. Shadow troops remain with no friendly troops, so Rivendell falls: place a shadow stronghold token on it and lose 3 hope.", "A linha de batalha verde vai de Moria a Rivendell. As 2 tropas da Sombra em Weather Hills avançam para Rivendell (juntando-se à 1 que já estava lá, que não se move porque Rivendell é o fim da linha); depois a 1 de Hollin vai para Tharbad; depois as 4 de Moria vão para Hollin. As tropas de Dunland não estão nessa linha e ficam. A batalha em Rivendell rola 3 dados (3 tropas da Sombra): os resultados removem 2 tropas da Sombra e a última tropa Élfica. Restam tropas da Sombra sem tropas aliadas, então Rivendell cai: coloquem uma ficha de fortaleza da Sombra e percam 3 de esperança."), 17],
      [t("Reinforce 1", "Reinforce 1"), t("Add a shadow troop to Rhûn; friendly troops are there, so roll 1 battle die (1 shadow troop). Then the special order Deploy 3 Nazgûl from Mordor to the Eye: the 1 Nazgûl in Mordor goes straight to Gondor (the Eye’s region). Mordor is now empty, so the next comes from the region with the most Nazgûl: Rohan (4) — now Rohan and Dale each have 3. The current player picks Rohan or Dale for the third.", "Coloque uma tropa da Sombra em Rhûn; há tropas aliadas ali, então role 1 dado de batalha (1 tropa da Sombra). Depois a ordem especial Deploy 3 Nazgûl from Mordor to the Eye: o 1 Nazgûl de Mordor vai direto para Gondor (a região do Olho). Mordor fica vazia, então o próximo sai da região com mais Nazgûl: Rohan (4) — agora Rohan e Dale têm 3 cada. O jogador da vez escolhe Rohan ou Dale para o terceiro."), 18],
      [t("Reinforce 2", "Reinforce 2"), t("Isengard was captured and is a haven, so no shadow troop is added there. Special order Move 2 Nazgûl closer to Frodo: Frodo is in Eriador; the closest Nazgûl is in the Misty Mountains and moves 1 region closer, to Enedwaith or Rhudaur (current player decides). The next closest are in Rhovanion and Haradwaith; the current player moves one of them 1 region closer (Rhovanion → Rohan or Haradwaith → Gondor).", "Isengard foi capturada e é um refúgio, então nenhuma tropa da Sombra é colocada ali. Ordem especial Move 2 Nazgûl closer to Frodo: Frodo está em Eriador; o Nazgûl mais próximo está em Misty Mountains e se move 1 região para perto, para Enedwaith ou Rhudaur (o jogador da vez decide). Os próximos mais próximos estão em Rhovanion e Haradwaith; o jogador da vez move um deles 1 região para perto (Rhovanion → Rohan ou Haradwaith → Gondor)."), 19]
    ].filter(Boolean);
    return `
      ${sectionHeading("examples", t("Examples from the rulebook", "Exemplos do manual"), index, refs(11, 14, 17, 18))}
      <div class="example-grid">${examples.map(([title, text, page], position) => `
        <article class="example-card"><span class="card-number">${String(position + 1).padStart(2, "0")}</span><h3>${title}</h3><p>${text}</p>
          <div class="example-source"><span>${t("Worked example from the manual", "Exemplo do manual")}</span>${ref(page)}</div></article>`).join("")}</div>`;
  }

  // --- Iconography ---------------------------------------------------------------

  function iconCard(name, title, description, page) {
    return `
      <article class="icon-card">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICON_DIR}${name}.webp" alt="${escapeHtml(title)}"></span>
        <div><strong>${title}</strong><p>${description} ${ref(page)}</p></div>
      </article>`;
  }

  function iconographySection(index) {
    const m = match();
    const groups = [
      [t("Symbols", "Símbolos"), [
        ["friendship", "Friendship", t("Spend 1 when Mustering to add 1 friendly troop to a Dwarven, Elven, Rohirrim or Gondor location.", "Gaste 1 ao fazer Muster para colocar 1 tropa aliada num local Anão, Élfico, Rohirrim ou de Gondor."), 24],
        ["valor", "Valor", t("Spend 1 during a battle to remove 1 shadow troop; spend 3 when Capturing.", "Gaste 1 durante uma batalha para remover 1 tropa da Sombra; gaste 3 ao fazer Capture."), 24],
        ["stealth", "Stealth", t("Spend 1 when Traveling with Frodo to avoid rolling a search.", "Gaste 1 ao fazer Travel com Frodo para não rolar uma busca."), 24],
        ["resistance", "Resistance", t("Spend 1 to reroll a search die or a battle die. Frodo spends 5 to attempt to destroy the One Ring.", "Gaste 1 para rerrolar um dado de busca ou de batalha. Frodo gasta 5 para tentar destruir o Um Anel."), 24]
      ]],
      [t("Board and pieces", "Tabuleiro e peças"), [
        ["haven", t("Haven", "Refúgio"), t("A place of refuge that shadow troops march toward. Prepare happens here.", "Lugar de abrigo para onde marcham as tropas da Sombra. Prepare acontece aqui."), 24],
        ["shadow-stronghold", t("Shadow stronghold", "Fortaleza da Sombra"), t("The red starburst printed on Isengard, Moria, Dol Guldur, Rhûn, Minas Morgul, Udûn, Barad-dûr and Umbar. Capture one with 3 Valor. The same icon is the token that covers a lost haven.", "A estrela vermelha impressa em Isengard, Moria, Dol Guldur, Rhûn, Minas Morgul, Udûn, Barad-dûr e Umbar. Capture uma com 3 Valor. O mesmo ícone é a ficha que cobre um refúgio perdido."), 24],
        ["shadow-location", t("Shadow location", "Local da Sombra"), t("Red location where battle lines start and Reinforce adds shadow troops. You cannot Muster here.", "Local vermelho onde começam as linhas de batalha e Reinforce coloca tropas da Sombra. Não é possível recrutar aqui."), 24],
        ["dwarven-location", t("Dwarven location", "Local Anão"), t("Muster adds a Dwarven (grey) troop here.", "Muster coloca uma tropa Anã (cinza) aqui."), 24],
        ["elven-location", t("Elven location", "Local Élfico"), t("Muster adds an Elven (green) troop here.", "Muster coloca uma tropa Élfica (verde) aqui."), 24],
        ["rohirrim-location", t("Rohirrim location", "Local Rohirrim"), t("Muster adds a Rohirrim (brown) troop here.", "Muster coloca uma tropa Rohirrim (marrom) aqui."), 24],
        ["gondor-location", t("Gondor location", "Local de Gondor"), t("Muster adds a Gondor (blue) troop here.", "Muster coloca uma tropa de Gondor (azul) aqui."), 24],
        ["eye-of-sauron", t("Eye of Sauron", "Olho de Sauron"), t("Marks the region Sauron is watching. Attack and Capture move it; Skies Darken pulls it to Frodo.", "Marca a região que Sauron está observando. Attack e Capture o movem; Skies Darken o puxa até Frodo."), 24],
        ["nazgul", "Nazgûl", t("Occupies a whole region; adds search dice and makes the Nazgûl! battle result count.", "Ocupa uma região inteira; acrescenta dados de busca e faz valer o resultado de batalha Nazgûl!."), 24],
        ["shadow-troop", t("Shadow troop", "Tropa da Sombra"), t("Red enemy troop. No limit per location.", "Tropa inimiga vermelha. Sem limite por local."), 24],
        ["friendly-troop", t("Friendly troop", "Tropa aliada"), t("Any troop of the Free Peoples (shown in grey on cards and diagrams).", "Qualquer tropa dos Povos Livres (mostrada em cinza nas cartas e diagramas)."), 24],
        ["dwarven-troop", t("Dwarven troop", "Tropa Anã"), t("Grey friendly troop (8 in the box).", "Tropa aliada cinza (8 na caixa)."), 24],
        ["elven-troop", t("Elven troop", "Tropa Élfica"), t("Green friendly troop (9 in the box).", "Tropa aliada verde (9 na caixa)."), 24],
        ["rohirrim-troop", t("Rohirrim troop", "Tropa Rohirrim"), t("Brown friendly troop (8 in the box).", "Tropa aliada marrom (8 na caixa)."), 24],
        ["gondor-troop", t("Gondor troop", "Tropa de Gondor"), t("Blue friendly troop (10 in the box).", "Tropa aliada azul (10 na caixa)."), 24],
        ["threat-marker", t("Threat rate marker", "Marcador de taxa de ameaça"), t("Its space on the threat rate track is the number of shadow cards drawn each turn.", "Seu espaço na trilha de taxa de ameaça é o número de cartas da Sombra compradas por turno."), 24],
        ["hope-marker", t("Hope marker", "Marcador de esperança"), t("Frodo’s morale on the hope track.", "O moral de Frodo na trilha de esperança."), 24],
        ["hope", t("Hope", "Esperança"), t("Gain or lose hope as shown on cards.", "Ganhe ou perca esperança conforme as cartas."), 24],
        ["despair", t("Despair", "Desespero"), t("The bottom (0) space of the hope track: reaching it loses the game.", "O espaço mais baixo (0) da trilha de esperança: chegar a ele perde o jogo."), 24],
        m.solo ? ["solo-token", t("Solo token", "Marcador solo"), t("Marks the character who does 4 actions this turn in a solo game.", "Marca o personagem que faz 4 ações neste turno na partida solo."), 24] : null
      ].filter(Boolean)],
      [t("Search die", "Dado de busca"), [
        ["search-die", t("Search die", "Dado de busca"), t("1 per Nazgûl in Frodo’s region and per shadow troop in his location, max 7.", "1 por Nazgûl na região de Frodo e por tropa da Sombra no local dele, máx. 7."), 11],
        ["slip-by", "Slip By", t("No effect.", "Sem efeito."), 11],
        ["weary", "Weary", t("Lose 1 hope.", "Perca 1 de esperança."), 11],
        ["exposed", "Exposed", t("Lose 1 hope; ignored if Frodo is in a haven.", "Perca 1 de esperança; ignorado se Frodo estiver num refúgio."), 11],
        ["recall", "Recall", t("If Nazgûl are present, move 1 to Mordor; no effect if Frodo is in Mordor.", "Se houver Nazgûl presentes, mova 1 para Mordor; sem efeito se Frodo estiver em Mordor."), 11]
      ]],
      [t("Battle die", "Dado de batalha"), [
        ["battle-die", t("Battle die", "Dado de batalha"), t("Attack: 1 per friendly troop (1–3). Card-started battle: 1 per shadow troop (max 3).", "Attack: 1 por tropa aliada (1–3). Batalha por carta: 1 por tropa da Sombra (máx. 3)."), 13],
        ["rout", "Rout", t("Remove 1 shadow troop.", "Remova 1 tropa da Sombra."), 13],
        ["exchange", "Exchange", t("Remove 1 shadow troop and 1 friendly troop.", "Remova 1 tropa da Sombra e 1 aliada."), 13],
        ["overrun", "Overrun", t("Remove 1 friendly troop; ignored in a haven.", "Remova 1 tropa aliada; ignorado num refúgio."), 13],
        ["nazgul-result", "Nazgûl!", t("If Nazgûl are present, remove 2 friendly troops; otherwise no effect.", "Se houver Nazgûl presentes, remova 2 tropas aliadas; senão, sem efeito."), 13]
      ]],
      [t("Actions", "Ações"), [
        ["action-travel", "Travel", t("Move to a connected location, optionally bringing characters and friendly troops.", "Mova-se para um local conectado, podendo levar personagens e tropas aliadas."), 10],
        !m.solo ? ["action-fellowship", "Fellowship", t("Give or take a card of your region with a player in your location.", "Dê ou pegue uma carta da sua região com um jogador no seu local."), 12] : null,
        ["action-prepare", "Prepare", t("At a haven, turn a region card into a matching symbol token.", "Num refúgio, troque uma carta de região por uma ficha do mesmo símbolo."), 12],
        ["action-muster", "Muster", t("Spend 1 Friendship to add a troop of the location’s color.", "Gaste 1 Friendship para colocar uma tropa da cor do local."), 13],
        ["action-attack", "Attack", t("Move the Eye here and roll 1–3 battle dice.", "Mova o Olho para cá e role 1–3 dados de batalha."), 13],
        ["action-capture", "Capture", t("Spend 3 Valor at an empty shadow stronghold with a friendly troop.", "Gaste 3 Valor numa fortaleza da Sombra sem inimigos e com uma tropa aliada."), 14],
        ["capture-printed", t("Capture a printed stronghold", "Capturar fortaleza impressa"), t("Place a haven token on it.", "Coloque uma ficha de refúgio sobre ela."), 14],
        ["capture-former-haven", t("Recapture a former haven", "Recapturar um antigo refúgio"), t("Remove the shadow stronghold token.", "Remova a ficha de fortaleza da Sombra."), 14]
      ].filter(Boolean)],
      [t("Skies Darken and shadow cards", "Skies Darken e cartas da Sombra"), [
        ["skies-shadow-grows", "The Shadow Grows", t("Threat rate +1.", "Taxa de ameaça +1."), 15],
        ["skies-i-see-you", "I See You!", t("Eye in Frodo’s region: lose 2 hope; otherwise move the Eye there.", "Olho na região de Frodo: perca 2 de esperança; senão, mova o Olho para lá."), 15],
        ["skies-under-cover", "Under Cover of Darkness", t("Add 3 shadow troops to the location on the card.", "Coloque 3 tropas da Sombra no local da carta."), 15],
        ["skies-danger", "The Danger Intensifies", t("Shuffle the shadow discard pile onto the top of the shadow deck.", "Embaralhe o descarte da Sombra e coloque-o no topo do baralho da Sombra."), 15],
        ["action-advance", "Advance", t("Top half: every shadow troop on the battle line moves 1 space forward.", "Metade de cima: cada tropa da Sombra na linha de batalha avança 1 espaço."), 16],
        ["action-reinforce", "Reinforce", t("Bottom half: add 1 shadow troop to the location, then the special order.", "Metade de baixo: coloque 1 tropa da Sombra no local, depois a ordem especial."), 18],
        ["order-shift-eye", t("Shift the Eye to Frodo", "Mover o Olho até Frodo"), t("If it is already there, roll a search.", "Se já estiver lá, role uma busca."), 18],
        ["order-move-nazgul", t("Move 2 Nazgûl closer to Frodo", "Mover 2 Nazgûl para perto de Frodo"), t("The 2 closest outside his region each move 1 region closer.", "Os 2 mais próximos fora da região dele avançam 1 região cada."), 18],
        ["order-deploy-nazgul", t("Deploy 3 Nazgûl to the Eye", "Enviar 3 Nazgûl até o Olho"), t("From Mordor (or the largest groups) into the Eye’s region; if the Eye is in Mordor, recall 3 instead.", "De Mordor (ou dos maiores grupos) para a região do Olho; se o Olho estiver em Mordor, chame 3 de volta."), 18]
      ]]
    ];
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), index, refs(24))}
      <p class="section-lead">${t("Each symbol below is cropped from the rulebook, with its meaning and source page.", "Cada símbolo abaixo foi recortado do manual, com seu significado e a página de origem.")}</p>
      ${groups.map(([title, items]) => `<h3 class="subhead">${title}</h3><div class="icon-grid lotr-icon-grid">${items.map(([name, label, text, page]) => iconCard(name, label, text, page)).join("")}</div>`).join("")}`;
  }

  // --- Glossary ------------------------------------------------------------------

  function glossarySection(index) {
    const m = match();
    const terms = [
      [t("Region", "Região"), t("A named area of the map (Eriador, Rohan, Gondor, Mordor…) containing several locations. Nazgûl and the Eye of Sauron occupy regions.", "Área nomeada do mapa (Eriador, Rohan, Gondor, Mordor…) com vários locais. Os Nazgûl e o Olho de Sauron ocupam regiões."), 3],
      [t("Location", "Local"), t("A circle on the map. Characters and troops are always in a location.", "Um círculo no mapa. Personagens e tropas sempre estão num local."), 3],
      [t("Present", "Presente"), t("A character or troop is present in its location. A Nazgûl is present in every location of its region.", "Um personagem ou tropa está presente no seu local. Um Nazgûl está presente em todos os locais da sua região."), 9],
      [t("Haven", "Refúgio"), t("A place of refuge; shadow troops march toward havens. A captured stronghold with a haven token is also a haven.", "Lugar de abrigo; as tropas da Sombra marcham para os refúgios. Uma fortaleza capturada com ficha de refúgio também é refúgio."), 9],
      [t("Shadow stronghold", "Fortaleza da Sombra"), t("A location printed inside a red starburst (Isengard, Moria, Dol Guldur, Rhûn, Minas Morgul, Udûn, Barad-dûr, Umbar), or a lost haven covered by a shadow stronghold token.", "Um local impresso dentro de uma estrela vermelha (Isengard, Moria, Dol Guldur, Rhûn, Minas Morgul, Udûn, Barad-dûr, Umbar), ou um refúgio perdido coberto por uma ficha de fortaleza da Sombra."), 3],
      [t("Battle line", "Linha de batalha"), t("A colored arrow from a red shadow location to a haven. Shadow troops advance along it; characters may Travel along it in either direction.", "Seta colorida de um local vermelho da Sombra até um refúgio. As tropas da Sombra avançam por ela; os personagens podem Viajar por ela nos dois sentidos."), 16],
      [t("Frontmost", "Mais à frente"), t("On a battle line, the location closest to the haven at its end.", "Numa linha de batalha, o local mais próximo do refúgio no fim dela."), 16],
      [t("Special path", "Caminho especial"), t("A path with symbols printed on it; the traveling character pays those symbols.", "Caminho com símbolos impressos; o personagem que viaja paga esses símbolos."), 10],
      [t("Supply", "Reserva"), t("The pool of unused troops and tokens. Shadow troops, symbol tokens and haven / shadow stronghold tokens sit beside the board; friendly troops are stored at the left edge of the board.", "O estoque de tropas e fichas não usadas. Tropas da Sombra, fichas de símbolo e fichas de refúgio / fortaleza da Sombra ficam ao lado do tabuleiro; as tropas aliadas ficam no depósito da borda esquerda do tabuleiro."), 9],
      [t("Threat rate", "Taxa de ameaça"), t("The number under the threat rate marker: how many shadow cards are drawn each turn. Each Skies Darken card raises it by 1.", "O número sob o marcador de taxa de ameaça: quantas cartas da Sombra são compradas por turno. Cada Skies Darken o aumenta em 1."), 16],
      [t("Player cards", "Cartas de jogador"), t("Region cards, event cards and Skies Darken cards, drawn from the player deck.", "Cartas de região, de evento e Skies Darken, compradas do baralho de jogadores."), 8],
      [t("Current player", "Jogador da vez"), t(m.solo ? "You." : "The player whose turn it is. They break ties and choose among multiple outcomes.", m.solo ? "Você." : "Quem está jogando o turno. Desempata e escolhe entre resultados possíveis."), 18],
      [t("Fate", "Fate (Destino)"), t("Spending Resistance after a roll to reroll dice.", "Gastar Resistance depois de uma rolagem para rerrolar dados."), 11],
      [t("Show Valor", "Show Valor (Mostrar Bravura)"), t("Spending Valor after a battle roll to remove shadow troops.", "Gastar Valor depois de uma rolagem de batalha para remover tropas da Sombra."), 13]
    ];
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), index, refs(3, 9))}
      <dl class="lotr-glossary">${terms.map(([term, definition, page]) => `<div><dt>${term}</dt><dd>${definition} ${ref(page)}</dd></div>`).join("")}</dl>
      <p class="source-note">${t("Character abilities, objective requirements, event effects and special shadow cards are printed on the cards; card text takes precedence over this guide.", "Habilidades de personagem, requisitos de objetivo, efeitos de evento e cartas especiais da Sombra estão impressos nas cartas; o texto da carta prevalece sobre este guia.")}</p>`;
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
      ["dice", t("Dice", "Dados")],
      ["player-cards", t("Player cards", "Cartas")],
      ["shadow", t("Shadow", "Sombra")],
      ["winning", t("Win/lose", "Vitória")],
      ["fine-points", t("Fine points", "Detalhes")],
      m.solo ? ["solo", "Solo"] : null,
      ["next-game", t("Difficulty", "Dificuldade")],
      ["examples", t("Examples", "Exemplos")],
      ["icons", t("Icons", "Ícones")],
      ["glossary", t("Glossary", "Glossário")]
    ].filter(Boolean);
    return `<nav class="lotr-jump" aria-label="${t("Sections", "Seções")}">${items.map(([id, label]) => jump(id, label)).join("")}</nav>`;
  }

  function renderInto(host) {
    root = host;
    const m = match();
    document.body.classList.remove("theme-nem", "theme-avalon", "theme-pagan", "theme-odins-ravens", "theme-western-legends");
    document.body.classList.add("theme-lotr");
    document.documentElement.lang = prefs.language;
    document.title = t("The Lord of the Rings: Fate of the Fellowship — Field Manual", "O Senhor dos Anéis: Fate of the Fellowship — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "A bilingual interactive rulebook for The Lord of the Rings: Fate of the Fellowship, with player count, difficulty, objectives, filtered setup, turns, dice and source references.",
        "Livro de regras interativo e bilíngue de The Lord of the Rings: Fate of the Fellowship, com número de jogadores, dificuldade, objetivos, preparação filtrada, turnos, dados e referências."
      );
    }
    const sections = [
      overviewSection,
      quickReference,
      setupSection,
      turnSection,
      diceSection,
      playerCardsSection,
      shadowSection,
      winningSection,
      finePointsSection,
      soloSection,
      nextGameSection,
      examplesSection,
      iconographySection,
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
          <span class="brand-mark" aria-hidden="true">FF</span>
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
          <p class="eyebrow">${t("PANDEMIC SYSTEM · CORE GAME · 1–5 PLAYERS", "PANDEMIC SYSTEM · JOGO BASE · 1–5 JOGADORES")}</p>
          <h1>The Lord of the Rings:<br>Fate of the Fellowship</h1>
          <p class="hero-intro">${t("A cooperative journey across Middle-earth by Matt Leacock. Guide Frodo to Mount Doom while the Fellowship and its allies hold back Sauron’s armies, dodge his searching Eye and outrun the Nazgûl.", "Uma jornada cooperativa pela Terra-média, de Matt Leacock. Leve Frodo até a Montanha da Perdição enquanto a Sociedade e seus aliados seguram os exércitos de Sauron, escapam do Olho que procura e fogem dos Nazgûl.")}</p>
          <div class="hero-meta"><span>${t("Cooperative", "Cooperativo")}</span><span>${playersLabel(m.players)}</span><span>${t(`This match: ${levelName(m.level)} · ${scenarioName(m.objectives)}`, `Esta partida: ${levelName(m.level)} · ${scenarioName(m.objectives)}`)}</span></div>
        </div>
        <figure class="hero-map lotr-cover">
          <img src="assets/covers/lotr-fate-of-the-fellowship.webp" alt="${t("Cover of the Fate of the Fellowship rulebook", "Capa do manual de Fate of the Fellowship")}">
          <figcaption>${t("Rulebook · p. 1", "Manual · p. 1")} · Cory Godbey</figcaption>
        </figure>
      </div></section>
      <main class="page-wrap content-column lotr-page">
        ${navigation()}
        ${renderConfiguration()}
        ${body}
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal guide for The Lord of the Rings: Fate of the Fellowship. It paraphrases the official rulebook, whose PDF is included in this repository with permission (manuals/lotr-fate-of-the-fellowship_core.pdf). Game design by Matt Leacock; Z-Man Games; Middle-earth Enterprises.",
        "Guia pessoal de The Lord of the Rings: Fate of the Fellowship. Parafraseia o manual oficial, cujo PDF está incluído neste repositório com autorização (manuals/lotr-fate-of-the-fellowship_core.pdf). Design de Matt Leacock; Z-Man Games; Middle-earth Enterprises."
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
        if (key === "players") {
          draft.players = Number(value);
        } else if (key === "level" && LEVELS.includes(value)) {
          draft.level = value;
        } else if (key === "objectives" && OBJECTIVE_CHOICES.includes(value)) {
          draft.objectives = value;
        } else if (key === "characters") {
          draft.characters = value === "first" ? "first" : "random";
        }
      });
    }
  }

  window.LotrFateOfTheFellowship = { renderInto, onClick, onChange };
})();
