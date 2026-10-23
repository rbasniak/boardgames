(() => {
  "use strict";

  const PREFS_KEY = "field-manual.witcher-path-of-destiny.v1";
  const CHECKS_KEY = "field-manual.witcher-path-of-destiny.setup.v1";
  const ICON_DIR = "assets/witcher-path-of-destiny/";

  const BOOKS = {
    core: { file: "witcher-path-of-destiny_core.pdf", en: "Core", pt: "Base" },
    stretch: { file: "witcher-path-of-destiny_stretch-goals.pdf", en: "Stretch Goals", pt: "Stretch Goals" },
    grain: { file: "witcher-path-of-destiny_a-grain-of-truth.pdf", en: "A Grain of Truth", pt: "A Grain of Truth" },
    wildhunt: { file: "witcher-path-of-destiny_wild-hunt.pdf", en: "Wild Hunt", pt: "Wild Hunt" },
    legendary: { file: "witcher-path-of-destiny_legendary-monsters.pdf", en: "Legendary Monsters", pt: "Legendary Monsters" },
    naglfar: { file: "witcher-path-of-destiny_naglfar.pdf", en: "Naglfar", pt: "Naglfar" },
    roach: { file: "witcher-path-of-destiny_geralt-on-roach.pdf", en: "Geralt on Roach", pt: "Geralt on Roach" }
  };

  const OWN_KEYS = ["ownStretch", "ownGrain", "ownWildHunt", "ownLegendary", "ownNaglfar", "ownRoach"];

  const CORE_CHARACTERS = ["Geralt", "Yennefer", "Dandelion", "Ciri", "Vesemir"];
  const STRETCH_CHARACTERS = ["Triss", "Letho", "Yarpen", "Regis", "Dijkstra"];

  const TALES = {
    edge: {
      en: "The Edge of the World", pt: "The Edge of the World (O Fim do Mundo)",
      book: "core", pages: [23], min: 1, max: 5, needs: null,
      order: ["Letho", "Triss", "Ciri", "Yennefer", "Geralt", "Regis", "Dijkstra", "Yarpen", "Dandelion", "Vesemir"]
    },
    striga: {
      en: "Striga", pt: "Striga",
      book: "core", pages: [24, 25], min: 1, max: 5, needs: null,
      order: ["Letho", "Geralt", "Vesemir", "Ciri", "Regis", "Yarpen", "Triss", "Yennefer", "Dandelion", "Dijkstra"]
    },
    lesser: {
      en: "The Lesser Evil", pt: "The Lesser Evil (O Mal Menor)",
      book: "core", pages: [26, 27], min: 1, max: 5, needs: null,
      order: ["Dandelion", "Vesemir", "Yarpen", "Dijkstra", "Regis", "Geralt", "Yennefer", "Letho", "Ciri", "Triss"]
    },
    grain: {
      en: "A Grain of Truth", pt: "A Grain of Truth (Um Grão de Verdade)",
      book: "stretch", pages: [12, 13, 14], min: 1, max: 4, needs: "grain",
      order: ["Dijkstra", "Dandelion", "Yennefer", "Triss", "Yarpen", "Regis", "Ciri", "Vesemir", "Geralt", "Letho"]
    },
    skellige: {
      en: "Skellige", pt: "Skellige",
      book: "stretch", pages: [15, 16, 17, 18], min: 3, max: 5, needs: "stretch",
      order: ["Triss", "Yennefer", "Vesemir", "Letho", "Regis", "Dandelion", "Dijkstra", "Ciri", "Yarpen", "Geralt"]
    },
    doppler: {
      en: "Doppler", pt: "Doppler",
      book: "stretch", pages: [19, 20, 21], min: 3, max: 5, needs: "stretch",
      order: ["Geralt", "Yarpen", "Ciri", "Letho", "Regis", "Dandelion", "Dijkstra", "Vesemir", "Triss", "Yennefer"]
    },
    dragon: {
      en: "Golden Dragon", pt: "Golden Dragon (O Dragão Dourado)",
      book: "stretch", pages: [22, 23, 24], min: 1, max: 5, needs: "stretch",
      order: ["Triss", "Yennefer", "Vesemir", "Letho", "Regis", "Dandelion", "Dijkstra", "Ciri", "Yarpen", "Geralt"]
    },
    wish: {
      en: "The Last Wish", pt: "The Last Wish (O Último Desejo)",
      book: "stretch", pages: [25, 26, 27], min: 1, max: 5, needs: "stretch",
      order: ["Letho", "Triss", "Ciri", "Yennefer", "Geralt", "Regis", "Dijkstra", "Yarpen", "Dandelion", "Vesemir"]
    }
  };
  const TALE_IDS = Object.keys(TALES);

  const WILD_HUNT_ORDER = ["the Wild Hunt", "Dandelion", "Vesemir", "Yarpen", "Dijkstra", "Regis", "Geralt", "Yennefer", "Letho", "Ciri", "Triss"];
  const LEGENDARY_ORDER = ["Triss", "Yennefer", "Ciri", "Letho", "Dijkstra", "Regis", "Vesemir", "Geralt", "Yarpen"];

  const MODES = ["tale", "wildhunt", "legendary"];
  const SOLO_LEVELS = {
    story: { start: 0, en: "Just the Story", pt: "Just the Story (Só a História)" },
    normal: { start: 2, en: "Normal", pt: "Normal" },
    swords: { start: 4, en: "Story and Swords", pt: "Story and Swords (História e Espadas)" },
    blood: { start: 6, en: "Blood and Broken Bones", pt: "Blood and Broken Bones (Sangue e Ossos Quebrados)" },
    deathmarch: { start: 8, en: "Death March!", pt: "Death March! (Marcha da Morte!)" }
  };
  const COMPANIONS = { none: null, shani: "Shani", keira: "Keira Metz", milva: "Milva", roche: "Vernon Roche", zoltan: "Zoltan Chivay" };
  const VILLAINS = { none: null, vilgefortz: "Vilgefortz", bonhart: "Leo Bonhart", odimm: "Gaunter O’Dimm" };
  const MONSTERS = ["leshen", "hym", "katakan", "fourth", "wildhunt"];
  const LM_COMPANIONS = ["none", "lambert", "eskel"];
  const RUNESTONES = ["standard", "easy", "beginner", "hard", "veryhard"];
  const MONSTER_LIFE = { 1: 30, 2: 60, 3: 85, 4: 110, 5: 130 };

  let storageNotice = "";
  let adjustNotices = [];
  let root = null;

  function defaultPrefs() {
    return {
      language: "pt-BR",
      ownStretch: true,
      ownGrain: true,
      ownWildHunt: true,
      ownLegendary: true,
      ownNaglfar: true,
      ownRoach: true,
      mode: "tale",
      players: 3,
      tale: "edge",
      firstPlay: false,
      soloLevel: "normal",
      companion: "none",
      villain: "none",
      voice: false,
      roach: false,
      naglfar: false,
      monster: "leshen",
      lmCompanion: "none",
      runestones: "standard"
    };
  }

  function taleAvailable(id, p) {
    const needs = TALES[id].needs;
    if (needs === "stretch") {
      return p.ownStretch;
    }
    if (needs === "grain") {
      return p.ownStretch || p.ownGrain;
    }
    return true;
  }

  function resolvePrefs(input) {
    const p = { ...input };
    OWN_KEYS.forEach((key) => {
      p[key] = Boolean(p[key]);
    });
    if (!MODES.includes(p.mode)) {
      p.mode = "tale";
    }
    if (p.mode === "wildhunt" && !p.ownWildHunt) {
      p.mode = "tale";
    }
    if (p.mode === "legendary" && !p.ownLegendary) {
      p.mode = "tale";
    }
    if (!TALE_IDS.includes(p.tale) || !taleAvailable(p.tale, p)) {
      p.tale = "edge";
    }
    p.players = Math.min(5, Math.max(1, Number(p.players) || 3));
    if (p.mode === "tale") {
      const tale = TALES[p.tale];
      p.players = Math.min(tale.max, Math.max(tale.min, p.players));
    }
    p.firstPlay = Boolean(p.firstPlay);
    if (!SOLO_LEVELS[p.soloLevel]) {
      p.soloLevel = "normal";
    }
    if (!(p.companion in COMPANIONS) || !p.ownStretch) {
      p.companion = "none";
    }
    if (!(p.villain in VILLAINS) || !p.ownStretch) {
      p.villain = "none";
    }
    p.voice = Boolean(p.voice) && p.ownStretch;
    p.roach = Boolean(p.roach) && p.ownRoach;
    p.naglfar = Boolean(p.naglfar) && p.ownNaglfar;
    if (!MONSTERS.includes(p.monster) || (p.monster === "wildhunt" && !p.ownNaglfar)) {
      p.monster = "leshen";
    }
    if (!LM_COMPANIONS.includes(p.lmCompanion)) {
      p.lmCompanion = "none";
    }
    if (!RUNESTONES.includes(p.runestones)) {
      p.runestones = "standard";
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
    Object.keys(next).forEach((key) => {
      if (key !== "language" && key in saved && typeof saved[key] === typeof next[key]) {
        next[key] = saved[key];
      }
    });
    return resolvePrefs(next);
  }

  function loadPrefs() {
    try {
      const raw = window.localStorage.getItem(PREFS_KEY);
      return raw ? normalizePrefs(JSON.parse(raw)) : normalizePrefs(null);
    } catch (error) {
      storageNotice = "read";
      console.error("Could not read the Path of Destiny match settings.", error);
      return normalizePrefs(null);
    }
  }

  let prefs = loadPrefs();

  // Derived match facts used by every section. Options that a mode forbids are switched off here.
  function match(p = prefs) {
    const isTale = p.mode === "tale";
    const isWH = p.mode === "wildhunt";
    const isLM = p.mode === "legendary";
    const solo = p.players === 1;
    const characters = CORE_CHARACTERS.concat(p.ownStretch ? STRETCH_CHARACTERS : (p.ownGrain ? ["Triss"] : []))
      .filter((name) => !(isLM && name === "Dandelion"));
    return {
      ...p,
      isTale,
      isWH,
      isLM,
      solo,
      tale: isTale ? p.tale : null,
      taleInfo: isTale ? TALES[p.tale] : null,
      heroes: isWH ? (solo ? 1 : p.players - 1) : 0,
      spots: p.players >= 4 ? 5 : 4,
      characters,
      firstPlay: isTale && p.tale === "edge" && p.firstPlay,
      soloLevel: solo && !isLM ? p.soloLevel : null,
      companion: isTale ? p.companion : "none",
      villain: isTale ? p.villain : "none",
      voice: isTale && p.voice,
      roach: isTale && p.roach,
      naglfar: isWH && p.naglfar,
      monster: isLM ? p.monster : null,
      lmCompanion: isLM ? p.lmCompanion : "none",
      runestones: isLM ? p.runestones : null,
      sideQuests: isTale ? !(p.tale === "edge" && p.firstPlay) && p.tale !== "doppler" : isWH
    };
  }

  function configurationKey(p = prefs) {
    const m = match(p);
    return JSON.stringify([
      OWN_KEYS.map((key) => m[key]), m.mode, m.players, m.tale, m.firstPlay, m.soloLevel, m.companion,
      m.villain, m.voice, m.roach, m.naglfar, m.monster, m.lmCompanion, m.runestones
    ]);
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
      console.error("Could not read the Path of Destiny setup checklist.", error);
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
      console.error("Could not save the Path of Destiny match settings.", error);
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
      console.error("Could not save the Path of Destiny setup checklist.", error);
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

  function ref(book, page) {
    const info = BOOKS[book];
    return `<a class="source-link" href="manuals/${info.file}#page=${page}" target="_blank" rel="noreferrer">${escapeHtml(`${t(info.en, info.pt)} p. ${page} ↗`)}</a>`;
  }

  function refs(book, ...pages) {
    return pages.map((page) => ref(book, page)).join(" ");
  }

  // A Grain of Truth is printed in both the Stretch Goals book and its own retail box.
  function grainRef(stretchPage, ...grainPages) {
    return prefs.ownStretch ? ref("stretch", stretchPage) : refs("grain", ...grainPages);
  }

  function taleRefs(id) {
    const tale = TALES[id];
    if (id === "grain") {
      return prefs.ownStretch ? refs("stretch", 12, 13, 14) : refs("grain", 5, 6, 7, 8);
    }
    return refs(tale.book, ...tale.pages);
  }

  function iconLabel(name) {
    return {
      magic: t("Magic", "Magia"),
      diplomacy: t("Diplomacy", "Diplomacia"),
      exploration: t("Exploration", "Exploração"),
      fight: t("Fight", "Luta"),
      "victory-point": t("Victory Point", "Ponto de Vitória"),
      experience: t("Experience Point", "Ponto de Experiência"),
      "left-path": t("Left Path", "Caminho da Esquerda"),
      "right-path": t("Right Path", "Caminho da Direita"),
      "lost-symbol": t("Lost Symbol token", "Ficha de Símbolo Perdido")
    }[name] || name;
  }

  function icon(name) {
    return `<img class="wpd-inline-icon" src="${ICON_DIR}${name}.webp" alt="${escapeHtml(iconLabel(name))}">`;
  }

  function taleName(id) {
    return t(TALES[id].en, TALES[id].pt);
  }

  function modeName(mode) {
    return {
      tale: t("Competitive Tale", "Conto competitivo"),
      wildhunt: t("Wild Hunt (one against many)", "Wild Hunt (um contra todos)"),
      legendary: t("Legendary Monsters (cooperative)", "Legendary Monsters (cooperativo)")
    }[mode];
  }

  function monsterName(id) {
    return {
      leshen: "Ancient Leshen",
      hym: "Hym",
      katakan: "Katakan",
      fourth: t("The fourth monster in the box", "O quarto monstro da caixa"),
      wildhunt: t("The Wild Hunt (Naglfar)", "A Wild Hunt (Naglfar)")
    }[id];
  }

  function runestoneName(id) {
    return {
      standard: t("Standard", "Padrão"),
      easy: t("Easy (+1 bonus card)", "Fácil (+1 carta bônus)"),
      beginner: t("Beginner (+2 bonus cards)", "Iniciante (+2 cartas bônus)"),
      hard: t("Hard (−1 card)", "Difícil (−1 carta)"),
      veryhard: t("Very hard (−2 cards)", "Muito difícil (−2 cartas)")
    }[id];
  }

  function soloLevelName(id) {
    return t(SOLO_LEVELS[id].en, SOLO_LEVELS[id].pt);
  }

  function playersLabel(count, mode = prefs.mode) {
    if (mode === "wildhunt") {
      return count === 1
        ? t("1 player (solo vs. the Wild Hunt Automa)", "1 jogador (solo contra o Automa da Wild Hunt)")
        : t(`${count} players (1 Wild Hunt + ${count - 1} Hero${count - 1 > 1 ? "es" : ""})`, `${count} jogadores (1 Wild Hunt + ${count - 1} Herói${count - 1 > 1 ? "s" : ""})`);
    }
    if (count === 1) {
      return mode === "legendary" ? t("1 player (solo, no Automa)", "1 jogador (solo, sem Automa)") : t("1 player (solo vs. Automa)", "1 jogador (solo contra o Automa)");
    }
    return t(`${count} players`, `${count} jogadores`);
  }

  function describeChange(key, before, after) {
    if (key === "mode") {
      return t(`Mode changed to ${modeName(after)}: you no longer own the box for ${modeName(before)}.`, `O modo mudou para ${modeName(after)}: você não marcou mais a caixa de ${modeName(before)}.`);
    }
    if (key === "tale") {
      return t(`Tale changed from “${taleName(before)}” to “${taleName(after)}”: the box with that Tale is not marked as owned.`, `O Conto mudou de “${taleName(before)}” para “${taleName(after)}”: a caixa desse Conto não está marcada.`);
    }
    if (key === "players") {
      const tale = TALES[prefs.tale];
      return t(`Player count changed from ${before} to ${after}: “${taleName(prefs.tale)}” is played with ${tale.min}–${tale.max} players.`, `O número de jogadores mudou de ${before} para ${after}: “${taleName(prefs.tale)}” é jogado com ${tale.min}–${tale.max} jogadores.`);
    }
    if (["companion", "villain", "voice"].includes(key)) {
      return t("Stretch Goals modules were switched off: the Stretch Goals box is not marked as owned.", "Os módulos de Stretch Goals foram desligados: a caixa Stretch Goals não está marcada.");
    }
    if (key === "roach") {
      return t("Geralt on Roach was switched off: that box is not marked as owned.", "Geralt on Roach foi desligado: essa caixa não está marcada.");
    }
    if (key === "naglfar" || key === "monster") {
      return t("Naglfar content was switched off: the Naglfar box is not marked as owned.", "O conteúdo de Naglfar foi desligado: a caixa Naglfar não está marcada.");
    }
    return "";
  }

  function commit(mutator) {
    const previousKey = configurationKey();
    const draft = { ...prefs };
    mutator(draft);
    const resolved = resolvePrefs(draft);
    prefs = resolved;
    const notices = Object.keys(resolved)
      .filter((key) => key !== "language" && resolved[key] !== draft[key])
      .map((key) => describeChange(key, draft[key], resolved[key]))
      .filter(Boolean);
    adjustNotices = [...new Set(notices)];
    savePrefs();
    if (configurationKey() !== previousKey) {
      setupChecks = [];
      saveChecks();
    }
    if (root) {
      renderInto(root);
    }
  }

  // --- Small HTML helpers ----------------------------------------------------

  function sectionHeading(id, title, index, refHtml) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("FIELD GUIDE", "GUIA DE CAMPO")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="wpd-heading-refs">${refHtml}</div>
      </div>`;
  }

  function card(title, body, refHtml = "") {
    return `<article class="info-card"><h3>${title}</h3>${body}${refHtml ? `<p class="wpd-refs">${refHtml}</p>` : ""}</article>`;
  }

  function block(title, body, refHtml = "") {
    return `<div class="turn-block"><h3>${title}</h3>${body}${refHtml ? `<p class="wpd-refs">${refHtml}</p>` : ""}</div>`;
  }

  function para(text) {
    return `<p>${text}</p>`;
  }

  function list(items) {
    return `<ul class="wpd-list">${items.filter(Boolean).map((entry) => `<li>${entry}</li>`).join("")}</ul>`;
  }

  function steps(items) {
    return `<ol class="wpd-steps">${items.filter(Boolean).map((entry) => `<li>${entry}</li>`).join("")}</ol>`;
  }

  function note(text) {
    return `<p class="wpd-note">${text}</p>`;
  }

  function interpretation(text) {
    return `<p class="wpd-interpretation"><strong>${t("Not covered by the rulebook:", "Não coberto pelo manual:")}</strong> ${text}</p>`;
  }

  function table(headers, rows, currentIndex = -1) {
    return `<div class="wpd-table-wrap"><table class="wpd-table"><thead><tr>${headers.map((cell) => `<th>${cell}</th>`).join("")}</tr></thead><tbody>${rows.map((row, index) => `<tr class="${index === currentIndex ? "is-current" : ""}">${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  function jump(id, label) {
    return `<button type="button" data-scroll="${id}">${label}</button>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function orderLine(order, available) {
    return order.filter((name) => name === "the Wild Hunt" || available.includes(name))
      .map((name) => (name === "the Wild Hunt" ? t("the Wild Hunt", "a Wild Hunt") : name))
      .join(" → ");
  }

  function storageNoticeText() {
    if (storageNotice === "read") {
      return t(
        "This browser could not read the saved Path of Destiny match. A default match is shown, and it may not be possible to save changes.",
        "Este navegador não conseguiu ler a partida salva de Path of Destiny. Uma partida padrão está na tela, e pode não ser possível salvar alterações."
      );
    }
    return t(
      "This browser refused to save the Path of Destiny match. Your latest change is visible on screen only.",
      "Este navegador recusou salvar a partida de Path of Destiny. A última alteração aparece apenas na tela."
    );
  }

  // --- Build your match --------------------------------------------------------

  function radioOption(key, value, selected, title, description) {
    const id = `wpd-${key}-${value}`;
    const checked = String(selected) === String(value);
    return `
      <label class="wpd-choice-card ${checked ? "is-selected" : ""}" for="${id}">
        <input id="${id}" type="radio" name="wpd-${key}" value="${escapeHtml(value)}" data-pref="${key}" ${checked ? "checked" : ""}>
        <span class="wpd-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function radioGroup(key, title, summary, selected, options, refHtml = "", wide = false) {
    return `
      <fieldset class="wpd-choice-group">
        <legend>${title}</legend>
        <p class="wpd-choice-summary"><strong>${t("Selected:", "Selecionado:")}</strong> ${summary}</p>
        <div class="wpd-choice-grid ${wide ? "is-wide" : ""}">${options.map((option) => radioOption(key, option.value, selected, option.title, option.description)).join("")}</div>
        ${refHtml ? `<p class="wpd-refs">${refHtml}</p>` : ""}
      </fieldset>`;
  }

  function fixedGroup(title, summary, text, refHtml = "") {
    return `
      <fieldset class="wpd-choice-group is-fixed">
        <legend>${title}</legend>
        <p class="wpd-choice-summary"><strong>${t("Fixed:", "Fixo:")}</strong> ${summary}</p>
        <p class="wpd-option-note">${text}</p>
        ${refHtml ? `<p class="wpd-refs">${refHtml}</p>` : ""}
      </fieldset>`;
  }

  function ownCard(key, checked, title, description) {
    const id = `wpd-own-${key}`;
    return `
      <label class="wpd-choice-card ${checked ? "is-selected" : ""}" for="${id}">
        <input id="${id}" type="checkbox" data-own="${key}" ${checked ? "checked" : ""}>
        <span class="wpd-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function renderConfiguration() {
    const m = match();
    const groups = [];
    let number = 0;
    const label = (en, pt) => {
      number += 1;
      return t(`${number} · ${en}`, `${number} · ${pt}`);
    };

    const owned = [
      ["ownStretch", "Stretch Goals", t("5 Tales, 5 Characters (Triss, Letho, Yarpen, Regis, Dijkstra), Companions, Villains, Voice of Reason envelopes, new Automa boards.", "5 Contos, 5 Personagens (Triss, Letho, Yarpen, Regis, Dijkstra), Companheiros, Vilões, envelopes Voice of Reason, novos tabuleiros de Automa.")],
      ["ownGrain", "A Grain of Truth", t("Retail box with Triss and the A Grain of Truth Tale (the same rules also appear in Stretch Goals).", "Caixa de varejo com Triss e o Conto A Grain of Truth (as mesmas regras também estão em Stretch Goals).")],
      ["ownWildHunt", "Wild Hunt", t("A new Tale played one against many, or solo against the Wild Hunt Automa.", "Um novo Conto jogado um contra todos, ou solo contra o Automa da Wild Hunt.")],
      ["ownLegendary", "Legendary Monsters", t("Cooperative mode against a Legendary Monster.", "Modo cooperativo contra um Monstro Lendário.")],
      ["ownNaglfar", "Naglfar", t("Adds Naglfar to Wild Hunt and lets you fight the Wild Hunt as a Legendary Monster.", "Adiciona Naglfar à Wild Hunt e permite enfrentar a Wild Hunt como Monstro Lendário.")],
      ["ownRoach", "Geralt on Roach", t("An alternative Geralt board, miniature and starting cards.", "Um tabuleiro, miniatura e cartas iniciais alternativos para Geralt.")]
    ];
    groups.push(`
      <fieldset class="wpd-choice-group">
        <legend>${label("Boxes you own", "Caixas que você tem")}</legend>
        <p class="wpd-choice-summary"><strong>${t("Always:", "Sempre:")}</strong> ${t("the core box (3 Tales, 5 Characters, solo mode).", "a caixa base (3 Contos, 5 Personagens, modo solo).")}</p>
        <div class="wpd-choice-grid is-wide">${owned.map(([key, title, text]) => ownCard(key, m[key], title, text)).join("")}</div>
        <p class="wpd-refs">${refs("core", 4, 5)} ${ref("stretch", 4)} ${ref("grain", 4)} ${ref("wildhunt", 5)} ${ref("legendary", 4)} ${ref("naglfar", 2)} ${ref("roach", 2)}</p>
      </fieldset>`);

    const modeOptions = [
      { value: "tale", title: modeName("tale"), description: t("1–5 players, each for themselves, through one of the Tales. Solo against the Automa.", "1–5 jogadores, cada um por si, num dos Contos. Solo contra o Automa.") }
    ];
    if (m.ownWildHunt) {
      modeOptions.push({ value: "wildhunt", title: modeName("wildhunt"), description: t("One player is the Wild Hunt; the others are Heroes who win or lose as a team. No other modules or expansion components, except Naglfar.", "Um jogador é a Wild Hunt; os outros são Heróis que vencem ou perdem juntos. Sem outros módulos ou componentes de expansão, exceto Naglfar.") });
    }
    if (m.ownLegendary) {
      modeOptions.push({ value: "legendary", title: modeName("legendary"), description: t("Everyone against one Legendary Monster. No other modules or expansions (Naglfar’s Wild Hunt monster is the exception).", "Todos contra um Monstro Lendário. Sem outros módulos ou expansões (o monstro Wild Hunt de Naglfar é a exceção).") });
    }
    groups.push(radioGroup("mode", label("Mode", "Modo"), modeName(m.mode), m.mode, modeOptions, `${ref("core", 3)} ${m.ownWildHunt ? ref("wildhunt", 4) : ""} ${m.ownLegendary ? ref("legendary", 5) : ""}`, true));

    if (m.isTale) {
      const taleOptions = TALE_IDS.filter((id) => taleAvailable(id, m)).map((id) => {
        const tale = TALES[id];
        const extras = {
          edge: t("Extra Effort cards. Recommended for learning (can be played without its special rules).", "Cartas Extra Effort. Recomendado para aprender (pode ser jogado sem as regras especiais)."),
          striga: t("Secret Objectives and Requirement cards.", "Objetivos Secretos e cartas de Requisito."),
          lesser: t("Renfri and Stregobor Alliance cards; the biggest supporter of the Dominating Path is penalized.", "Cartas de Aliança de Renfri e Stregobor; quem mais apoiou o Caminho Dominante é penalizado."),
          grain: t("Nivellen on the Initiative track and Mystery cards.", "Nivellen na trilha de Iniciativa e cartas de Mistério."),
          skellige: t("Hidden-information deduction: find the Killer with Alibi cards.", "Dedução com informação oculta: encontre o Assassino com cartas de Álibi."),
          doppler: t("Hidden roles: one or two dopplers among you.", "Papéis ocultos: um ou dois dopplers entre vocês."),
          dragon: t("Protect the Golden Dragon with Dragon Protection cards; it can die and end the game early.", "Proteja o Dragão Dourado com cartas Dragon Protection; ele pode morrer e encerrar o jogo antes."),
          wish: t("Seal tokens and the Djinn track grant Wish cards.", "Fichas de Selo e a trilha do Djinn concedem cartas de Desejo.")
        }[id];
        return { value: id, title: taleName(id), description: `${t(`${tale.min}–${tale.max} players`, `${tale.min}–${tale.max} jogadores`)}. ${extras}` };
      });
      groups.push(radioGroup("tale", label("Tale", "Conto"), taleName(m.tale), m.tale, taleOptions, taleRefs(m.tale), true));
    }

    const range = m.isTale ? [m.taleInfo.min, m.taleInfo.max] : [1, 5];
    const playerOptions = [1, 2, 3, 4, 5].filter((count) => count >= range[0] && count <= range[1]).map((count) => {
      let description = count >= 4 ? t("5 spots of card pairs on the playmat.", "5 espaços de pares de cartas no tapete.") : t("4 spots of card pairs on the playmat.", "4 espaços de pares de cartas no tapete.");
      if (m.isTale && count === 1) {
        description += t(" You play against the Automa, set up like a 2-player game.", " Você joga contra o Automa, preparado como uma partida de 2 jogadores.");
      }
      if (m.isTale && count === 2) {
        description += t(" 2-player exception when placing the Destiny token.", " Exceção de 2 jogadores ao colocar a ficha de Destino.");
      }
      if (m.isWH) {
        description += count === 1
          ? t(" You are one Hero; the Automa controls the Wild Hunt.", " Você é um Herói; o Automa controla a Wild Hunt.")
          : t(` One player is the Wild Hunt, ${count - 1} play Heroes.`, ` Um jogador é a Wild Hunt, ${count - 1} jogam com Heróis.`);
      }
      if (m.isLM) {
        description += t(` Monster Life ${MONSTER_LIFE[count]}; ${count === 1 ? 5 : count === 5 ? 8 : 7} Health Points each.`, ` Vida do Monstro ${MONSTER_LIFE[count]}; ${count === 1 ? 5 : count === 5 ? 8 : 7} Pontos de Saúde cada.`);
      }
      return { value: String(count), title: playersLabel(count), description };
    });
    groups.push(radioGroup("players", label("Players", "Jogadores"), playersLabel(m.players), String(m.players), playerOptions, m.isTale ? `${refs("core", 9, 17, 20)}` : m.isWH ? refs("wildhunt", 6, 10) : refs("legendary", 6, 7, 8), true));

    if (m.isTale && m.tale === "edge") {
      groups.push(radioGroup("firstPlay", label("First play", "Primeira partida"), m.firstPlay ? t("Without Extra Effort cards and Side Quests", "Sem cartas Extra Effort e sem Missões Secundárias") : t("Full Tale rules", "Regras completas do Conto"), m.firstPlay ? "yes" : "no", [
        { value: "no", title: t("Full Tale rules", "Regras completas do Conto"), description: t("Use the Extra Effort cards and Side Quests.", "Use as cartas Extra Effort e as Missões Secundárias.") },
        { value: "yes", title: t("First play / teaching game", "Primeira partida / partida de ensino"), description: t("The rulebook’s recommended introduction: ignore the setup and rules of the Extra Effort cards and of the Side Quests.", "A introdução recomendada pelo manual: ignore a preparação e as regras das cartas Extra Effort e das Missões Secundárias.") }
      ], refs("core", 8, 23)));
    }

    if (m.solo && !m.isLM) {
      const levelOptions = Object.keys(SOLO_LEVELS).map((id) => ({
        value: id,
        title: soloLevelName(id),
        description: t(`The Automa’s regular Experience marker starts on spot ${SOLO_LEVELS[id].start}.${id === "deathmarch" ? " Its second Special Ability is available from the start." : ""}`, `O marcador normal de Experiência do Automa começa no espaço ${SOLO_LEVELS[id].start}.${id === "deathmarch" ? " Sua segunda Habilidade Especial já vale desde o início." : ""}`)
      }));
      groups.push(radioGroup("soloLevel", label("Automa difficulty", "Dificuldade do Automa"), soloLevelName(m.soloLevel), m.soloLevel, levelOptions, `${ref("core", 20)}${m.isWH ? ` ${ref("wildhunt", 10)}` : ""}`, true));
    }

    if (m.isTale && m.ownStretch) {
      const companionOptions = Object.keys(COMPANIONS).map((id) => ({
        value: id,
        title: id === "none" ? t("No Companion", "Sem Companheiro") : COMPANIONS[id],
        description: id === "none" ? t("Play without the Companions module.", "Jogue sem o módulo de Companheiros.") : t("Its 5 cards give one ability per Chapter next to the bottom spot.", "Suas 5 cartas dão uma habilidade por Capítulo ao lado do espaço de baixo.") + (id === "zoltan" ? t(" Uses the core Solo Mode Destiny token to decide outcomes.", " Usa a ficha de Destino do Modo Solo da caixa base para decidir resultados.") : "")
      }));
      groups.push(radioGroup("companion", label("Companion (optional module)", "Companheiro (módulo opcional)"), m.companion === "none" ? t("None", "Nenhum") : COMPANIONS[m.companion], m.companion, companionOptions, ref("stretch", 5), true));
      const villainOptions = Object.keys(VILLAINS).map((id) => ({
        value: id,
        title: id === "none" ? t("No Villain", "Sem Vilão") : VILLAINS[id],
        description: {
          none: t("Play without the Villains module.", "Jogue sem o módulo de Vilões."),
          vilgefortz: t("3 random Vilgefortz cards in the Main deck add ongoing passive effects on the cards you play.", "3 cartas de Vilgefortz sorteadas no baralho principal impõem efeitos passivos contínuos às cartas jogadas."),
          bonhart: t("3 random Leo Bonhart cards in the Main deck demand specific effects in your last 2 cards, or you lose a Symbol.", "3 cartas de Leo Bonhart sorteadas no baralho principal exigem efeitos específicos nas suas 2 últimas cartas, ou você perde um Símbolo."),
          odimm: t("When someone gains their 15th Experience Point, O’Dimm offers a Pact.", "Quando alguém ganha o 15º Ponto de Experiência, O’Dimm oferece um Pacto.")
        }[id]
      }));
      groups.push(radioGroup("villain", label("Villain (optional module)", "Vilão (módulo opcional)"), m.villain === "none" ? t("None", "Nenhum") : VILLAINS[m.villain], m.villain, villainOptions, refs("stretch", 6, 7), true));
      groups.push(radioGroup("voice", label("Voice of Reason envelopes", "Envelopes Voice of Reason"), m.voice ? t("Used", "Usados") : t("Not used", "Não usados"), m.voice ? "yes" : "no", [
        { value: "no", title: t("Not used", "Não usados"), description: t("No achievement tracking this game.", "Sem conquistas nesta partida.") },
        { value: "yes", title: t("Use the envelope of this Tale", "Usar o envelope deste Conto"), description: t("Try to complete its achievements to unlock its sealed content.", "Tente cumprir as conquistas para liberar o conteúdo lacrado.") }
      ], ref("stretch", 8)));
    }

    if (m.isTale && m.ownRoach) {
      groups.push(radioGroup("roach", label("Geralt on Roach", "Geralt on Roach"), m.roach ? t("Available if someone chooses Geralt", "Disponível se alguém escolher Geralt") : t("Not used", "Não usado"), m.roach ? "yes" : "no", [
        { value: "no", title: t("Not used", "Não usado"), description: t("Geralt uses his normal components.", "Geralt usa os componentes normais.") },
        { value: "yes", title: t("Use if Geralt is chosen", "Usar se Geralt for escolhido"), description: t("The player who chooses Geralt may swap in the Geralt on Roach board, miniature and starting cards.", "Quem escolher Geralt pode trocar pelo tabuleiro, miniatura e cartas iniciais de Geralt on Roach.") }
      ], ref("roach", 2)));
    }

    if (m.isWH) {
      if (m.ownNaglfar) {
        groups.push(radioGroup("naglfar", label("Naglfar", "Naglfar"), m.naglfar ? t("Naglfar helps the Generals", "Naglfar ajuda os Generais") : t("Not used", "Não usado"), m.naglfar ? "yes" : "no", [
          { value: "no", title: t("Not used", "Não usado"), description: t("Standard Wild Hunt.", "Wild Hunt padrão.") },
          { value: "yes", title: t("Add Naglfar", "Adicionar Naglfar"), description: t("Naglfar protects one General; Heroes get Broken Sextant cards instead.", "Naglfar protege um General; os Heróis recebem cartas Broken Sextant em troca.") }
        ], refs("naglfar", 2, 3)));
      }
      groups.push(fixedGroup(label("Other modules", "Outros módulos"), t("None", "Nenhum"), t("The Wild Hunt rulebook forbids any other modules or components from other expansions: no Companions, Villains, Voice of Reason envelopes or Geralt on Roach. This guide’s reading: the Characters from Stretch Goals and A Grain of Truth stay in the pool, because the Wild Hunt Initiative order lists them.", "O manual da Wild Hunt proíbe outros módulos e componentes de outras expansões: nada de Companheiros, Vilões, envelopes Voice of Reason ou Geralt on Roach. Leitura deste guia: os Personagens de Stretch Goals e A Grain of Truth continuam disponíveis, porque a ordem de Iniciativa da Wild Hunt os lista."), `${ref("wildhunt", 4)} ${refs("stretch", 5, 6)}`));
    }

    if (m.isLM) {
      const monsterOptions = MONSTERS.filter((id) => id !== "wildhunt" || m.ownNaglfar).map((id) => ({
        value: id,
        title: monsterName(id),
        description: {
          leshen: t("Uses Root tokens.", "Usa fichas de Raiz."),
          hym: t("Uses Suffering tokens.", "Usa fichas de Sofrimento."),
          katakan: t("Uses the Power token on its card.", "Usa a ficha de Poder na sua carta."),
          fourth: t("The box has 4 monsters; the rulebook gives monster-specific setup only for the other three. Follow its cards.", "A caixa tem 4 monstros; o manual só dá preparação específica para os outros três. Siga as cartas dele."),
          wildhunt: t("From the Naglfar box: Wild Hunt Legendary Monster cards and Naglfar cards.", "Da caixa Naglfar: cartas de Monstro Lendário da Wild Hunt e cartas de Naglfar.")
        }[id]
      }));
      groups.push(radioGroup("monster", label("Legendary Monster", "Monstro Lendário"), monsterName(m.monster), m.monster, monsterOptions, `${refs("legendary", 6, 8)}${m.ownNaglfar ? ` ${ref("naglfar", 6)}` : ""}`, true));
      groups.push(radioGroup("lmCompanion", label("Lambert or Eskel (optional)", "Lambert ou Eskel (opcional)"), m.lmCompanion === "none" ? t("None", "Nenhum") : (m.lmCompanion === "lambert" ? "Lambert" : "Eskel"), m.lmCompanion, [
        { value: "none", title: t("No Companion", "Sem Companheiro"), description: t("Bottom spot gives the Extra Experience Point as usual.", "O espaço de baixo dá o Ponto de Experiência Extra como sempre.") },
        { value: "lambert", title: "Lambert", description: t("A new Lambert card each Chapter next to the bottom spot.", "Uma nova carta de Lambert a cada Capítulo ao lado do espaço de baixo.") },
        { value: "eskel", title: "Eskel", description: t("A new Eskel card each Chapter next to the bottom spot.", "Uma nova carta de Eskel a cada Capítulo ao lado do espaço de baixo.") }
      ], refs("legendary", 6, 15), true));
      groups.push(radioGroup("runestones", label("Difficulty (Runestone cards)", "Dificuldade (cartas Runestone)"), runestoneName(m.runestones), m.runestones, RUNESTONES.map((id) => ({
        value: id,
        title: runestoneName(id),
        description: {
          standard: t("The Runestone cards for your player count.", "As cartas Runestone do seu número de jogadores."),
          easy: t("Add 1 card marked with the bonus icon (easy game).", "Adicione 1 carta marcada com o ícone de bônus (partida fácil)."),
          beginner: t("Add 2 cards marked with the bonus icon (beginner game).", "Adicione 2 cartas marcadas com o ícone de bônus (partida de iniciante)."),
          hard: t("Remove any 1 card (hard game).", "Remova 1 carta qualquer (partida difícil)."),
          veryhard: t("Remove any 2 cards (very hard game).", "Remova 2 cartas quaisquer (partida muito difícil).")
        }[id]
      })), ref("legendary", 7), true));
      groups.push(fixedGroup(label("Other modules", "Outros módulos"), t("None", "Nenhum"), t("The Legendary Monsters rulebook forbids other modules (such as the Voice of Reason envelopes) and other expansions: no Stretch Goals Companions or Villains and no Geralt on Roach. Dandelion may not be chosen. This guide’s reading: the Characters from Stretch Goals and A Grain of Truth stay in the pool, because the Legendary Monsters Initiative order lists them.", "O manual de Legendary Monsters proíbe outros módulos (como os envelopes Voice of Reason) e outras expansões: nada de Companheiros ou Vilões de Stretch Goals e nada de Geralt on Roach. Dandelion não pode ser escolhido. Leitura deste guia: os Personagens de Stretch Goals e A Grain of Truth continuam disponíveis, porque a ordem de Iniciativa de Legendary Monsters os lista."), `${refs("legendary", 5, 7)} ${refs("stretch", 5, 6)}`));
    }

    const summaryParts = [modeName(m.mode), playersLabel(m.players)];
    if (m.isTale) {
      summaryParts.push(taleName(m.tale));
      if (m.firstPlay) {
        summaryParts.push(t("first play", "primeira partida"));
      }
      if (m.companion !== "none") {
        summaryParts.push(COMPANIONS[m.companion]);
      }
      if (m.villain !== "none") {
        summaryParts.push(VILLAINS[m.villain]);
      }
      if (m.voice) {
        summaryParts.push("Voice of Reason");
      }
      if (m.roach) {
        summaryParts.push("Geralt on Roach");
      }
    }
    if (m.soloLevel) {
      summaryParts.push(soloLevelName(m.soloLevel));
    }
    if (m.naglfar) {
      summaryParts.push("Naglfar");
    }
    if (m.isLM) {
      summaryParts.push(monsterName(m.monster), runestoneName(m.runestones));
      if (m.lmCompanion !== "none") {
        summaryParts.push(m.lmCompanion === "lambert" ? "Lambert" : "Eskel");
      }
    }

    return `
      <section class="wpd-config" aria-labelledby="configure-title">
        <div class="section-heading"><div><p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p><h2 id="configure-title">${t("Build your match", "Configure a partida")}</h2></div><div class="wpd-heading-refs">${refs("core", 8)}</div></div>
        <p class="section-lead">${t("Mark the boxes you own, then choose the mode. The three modes cannot be mixed: Wild Hunt and Legendary Monsters each forbid the other modules. Only the options allowed by the rulebooks for this mode appear, and every section below follows these choices.", "Marque as caixas que você tem e escolha o modo. Os três modos não se misturam: Wild Hunt e Legendary Monsters proíbem os outros módulos. Só aparecem as opções permitidas pelos manuais neste modo, e todas as seções abaixo seguem estas escolhas.")}</p>
        ${adjustNotices.length ? `<div class="wpd-adjust" role="status">${adjustNotices.map((text) => `<p>${text}</p>`).join("")}</div>` : ""}
        ${groups.join("")}
        <p class="wpd-config-status">${summaryParts.join(" · ")}</p>
      </section>`;
  }

  // --- Overview ----------------------------------------------------------------

  function overviewSection(index) {
    const m = match();
    let modeCards;
    if (m.isTale) {
      modeCards = [
        card(t("Goal", "Objetivo"), para(t(
          `Everyone takes part in the same story, but each player competes to have the biggest influence on it. The player with the most Victory Points ${icon("victory-point")} at the end is the winner and is remembered as the main hero of the Tale.${m.solo ? " Solo: you face a virtual opponent, the Automa." : ""}`,
          `Todos participam da mesma história, mas cada jogador disputa quem mais a influencia. Quem tiver mais Pontos de Vitória ${icon("victory-point")} no fim vence e é lembrado como o herói principal do Conto.${m.solo ? " Solo: você enfrenta um oponente virtual, o Automa." : ""}`
        )), ref("core", 3)),
        card(t("Tale cards", "Cartas de Conto"), para(t(
          "Each Tale is a numbered deck read like a book, never shuffled. It introduces the story, organizes the 3 Chapters and holds several endings. You read only some of its cards in each game. The Active Symbols of the coming Chapter are shown at the bottom of the current card.",
          "Cada Conto é um baralho numerado lido como um livro, nunca embaralhado. Ele apresenta a história, organiza os 3 Capítulos e traz vários finais. Em cada partida você lê só algumas cartas. Os Símbolos Ativos do próximo Capítulo aparecem na parte de baixo da carta atual."
        )), refs("core", 6, 11))
      ];
    } else if (m.isWH) {
      modeCards = [
        card(t("Two teams", "Dois times"), para(m.solo
          ? t("You play one Hero against the Wild Hunt Automa.", "Você joga com um Herói contra o Automa da Wild Hunt.")
          : t(`One player is the Wild Hunt — elves trying to capture Ciri to save their world. The other ${m.heroes} player${m.heroes > 1 ? "s are Heroes who form" : " is a Hero who forms"} a cooperative team. The Heroes score Victory Points together and win as a group, or the Wild Hunt player wins.`, `Um jogador é a Wild Hunt — elfos tentando capturar Ciri para salvar seu mundo. ${m.heroes > 1 ? `Os outros ${m.heroes} jogadores são Heróis que formam` : "O outro jogador é um Herói que forma"} um time cooperativo. Os Heróis marcam Pontos de Vitória juntos e vencem como grupo, ou vence o jogador da Wild Hunt.`)), ref("wildhunt", 4)),
        card(t("Talking and sharing", "Conversa e compartilhamento"), para(t("Heroes may freely discuss their strategy — but only openly, in front of everyone — and decide together what to draft, play and when to use Abilities. They may not share cards or any other components. Each Hero still tracks their own Experience.", "Os Heróis podem discutir livremente a estratégia — mas só abertamente, na frente de todos — e decidir juntos o que pegar, jogar e quando usar Habilidades. Não podem compartilhar cartas nem outros componentes. Cada Herói continua controlando a própria Experiência.")), ref("wildhunt", 4)),
        card(t("Generals", "Generais"), para(t("Four Generals stand on their own Threat tracks on the Generals playmat: Imlerith (red), Eredin (green), Nithral (blue) and Caranthir (yellow). The Wild Hunt advances them to unlock their Traits; Heroes play cards of one color to push them back and draw their Weakness cards.", "Quatro Generais ficam nas suas trilhas de Ameaça no tapete dos Generais: Imlerith (vermelho), Eredin (verde), Nithral (azul) e Caranthir (amarelo). A Wild Hunt os faz avançar para ativar seus Traços; os Heróis jogam cartas de uma cor para empurrá-los de volta e comprar suas cartas de Fraqueza.")), refs("wildhunt", 4, 7))
      ];
    } else {
      modeCards = [
        card(t("Cooperation", "Cooperação"), para(t(`Everyone fights one Legendary Monster together. The goal is to reduce its Life Points to 0 before the end of the game without any player losing their last Health Point. If even one player is eliminated, everyone loses.${m.solo ? " Solo: you face the Monster alone with the regular rules; there is no Automa." : ""}`, `Todos enfrentam juntos um Monstro Lendário. O objetivo é reduzir a Vida dele a 0 antes do fim da partida sem que nenhum jogador perca seu último Ponto de Saúde. Se um único jogador for eliminado, todos perdem.${m.solo ? " Solo: você enfrenta o Monstro sozinho com as regras normais; não há Automa." : ""}`)), refs("legendary", 5, 12, 13, 14)),
        card(t("Only Fight is Active", "Só Luta é Ativo"), para(t(`There is no Tale and no choice of Path. Throughout the game, Fight ${icon("fight")} is the only Active Symbol, corresponding to both the Left and Right Path. The other three Symbols are Non-Active.`, `Não há Conto nem escolha de Caminho. Durante toda a partida, Luta ${icon("fight")} é o único Símbolo Ativo, correspondendo ao Caminho da Esquerda e ao da Direita. Os outros três Símbolos são Não Ativos.`)), refs("legendary", 5, 9)),
        card(t("No Victory Points", "Sem Pontos de Vitória"), para(t("Players do not gain Victory Points. Whenever a player would gain Victory Points, they deal that much damage to the Monster instead. Fight Symbols at the end of each Chapter and the Golden Experience marker at the end of the game also deal damage.", "Os jogadores não ganham Pontos de Vitória. Sempre que um jogador ganharia Pontos de Vitória, ele causa esse dano ao Monstro. Os Símbolos de Luta no fim de cada Capítulo e o marcador Dourado de Experiência no fim da partida também causam dano.")), refs("legendary", 5, 13)),
        card(t("Talking and sharing", "Conversa e compartilhamento"), para(t("Players may freely discuss their strategy and decide together what to draft, play and when to use Abilities. They may not share cards or any other components.", "Os jogadores podem discutir livremente a estratégia e decidir juntos o que pegar, jogar e quando usar Habilidades. Não podem compartilhar cartas nem outros componentes.")), ref("legendary", 5))
      ];
    }
    return `
      ${sectionHeading("overview", t("Overview and key concepts", "Visão geral e conceitos-chave"), index, `${refs("core", 3, 6, 7, 11)}`)}
      <p class="section-lead">${m.isLM
        ? t(
          "A tableau-building card game set in the stories of The Witcher. Over 3 Chapters of 3 Turns each, you draft pairs of Action cards and play them into your Timeline. In this mode their Symbols deal damage to the Legendary Monster and give Experience Points.",
          "Um jogo de cartas de construção de tableau nas histórias de The Witcher. Em 3 Capítulos de 3 Turnos cada, você pega pares de cartas de Ação e as joga na sua Linha do Tempo (Timeline). Neste modo os Símbolos delas causam dano ao Monstro Lendário e dão Pontos de Experiência."
        )
        : t(
          "A tableau-building card game set in the stories of The Witcher. Over 3 Chapters of 3 Turns each, you draft pairs of Action cards and play them into your Timeline. The Symbols on them decide which way the story goes and score Victory and Experience Points.",
          "Um jogo de cartas de construção de tableau nas histórias de The Witcher. Em 3 Capítulos de 3 Turnos cada, você pega pares de cartas de Ação e as joga na sua Linha do Tempo (Timeline). Os Símbolos nelas decidem para onde a história vai e rendem Pontos de Vitória e de Experiência."
        )}</p>
      <div class="quick-grid">${modeCards.join("")}</div>
      <h3 class="subhead">${t("Symbols", "Símbolos")}</h3>
      <div class="quick-grid">
        ${card(t("The four Symbols", "Os quatro Símbolos"), para(t(
          `${icon("magic")} Magic, ${icon("diplomacy")} Diplomacy, ${icon("exploration")} Exploration and ${icon("fight")} Fight. You gather them mostly from the Action cards in your Timeline, and also as Symbol tokens gained from card effects, Abilities or Tale rules. A Symbol counts the same whether it is printed on a card or on a token.`,
          `${icon("magic")} Magia (Magic), ${icon("diplomacy")} Diplomacia (Diplomacy), ${icon("exploration")} Exploração (Exploration) e ${icon("fight")} Luta (Fight). Você os junta principalmente com as cartas de Ação da sua Linha do Tempo e também como fichas de Símbolo ganhas por efeitos de carta, Habilidades ou regras do Conto. Um Símbolo vale igual, impresso na carta ou numa ficha.`
        )), ref("core", 6))}
        ${m.isLM ? "" : card(t("Active and Non-Active", "Ativos e Não Ativos"), para(t(
          `Each Chapter, the Tale card shows 2 Active Symbols: one for the Left Path ${icon("left-path")} (light arrow) and one for the Right Path ${icon("right-path")} (dark arrow). At the end of the Chapter, one becomes the Dominating Symbol and gives Victory Points; the other is Non-Dominating and gives Experience Points. The 2 Non-Active Symbols score nothing directly, but card effects and Abilities can still use them.`,
          `A cada Capítulo, a carta de Conto mostra 2 Símbolos Ativos: um do Caminho da Esquerda ${icon("left-path")} (seta clara) e um do Caminho da Direita ${icon("right-path")} (seta escura). No fim do Capítulo, um vira o Símbolo Dominante e dá Pontos de Vitória; o outro é o Não Dominante e dá Pontos de Experiência. Os 2 Símbolos Não Ativos não pontuam diretamente, mas efeitos de carta e Habilidades ainda podem usá-los.`
        )), refs("core", 6, 11))}
        ${card(t("Losing Symbols", "Perder Símbolos"), para(t(
          `When you must lose a Symbol, either discard a matching Symbol token from your Token pool, or cover a matching Symbol on any card in your Timeline with a Lost Symbol token ${icon("lost-symbol")}.`,
          `Quando precisar perder um Símbolo, descarte uma ficha de Símbolo correspondente da sua reserva de fichas (Token pool), ou cubra um Símbolo correspondente em qualquer carta da sua Linha do Tempo com uma ficha de Símbolo Perdido ${icon("lost-symbol")}.`
        )), refs("core", 6, 15))}
      </div>
      <h3 class="subhead">${t("Cards, boards and points", "Cartas, tabuleiros e pontos")}</h3>
      <div class="quick-grid">
        ${card(t("Action cards", "Cartas de Ação"), para(t(
          "Each card has a color banner (red, green, blue or yellow), Symbols at the top left and often an effect (a condition and a result). A multicolor card has all of its banner colors at the same time for every purpose, unless stated otherwise. Your Timeline is the row of Action cards you play in one Chapter.",
          "Cada carta tem uma faixa de cor (vermelha, verde, azul ou amarela), Símbolos no canto superior esquerdo e muitas vezes um efeito (uma condição e um resultado). Uma carta multicolorida tem todas as cores das suas faixas ao mesmo tempo para qualquer fim, salvo indicação contrária. Sua Linha do Tempo é a fileira de cartas de Ação que você joga num Capítulo."
        )), refs("core", 7, 15))}
        ${card(t("Player board", "Tabuleiro de jogador"), para(t(
          `Shows the Character, 4 Abilities and the Experience Points ${icon("experience")} track. Reaching or passing an Ability spot unlocks that Ability; each Ability is used once per game.${m.sideQuests ? " Each Character also has a Side Quest card tucked under the board, visible to everyone, that scores Victory Points at the end." : ""}`,
          `Mostra o Personagem, 4 Habilidades e a trilha de Pontos de Experiência ${icon("experience")}. Alcançar ou passar o espaço de uma Habilidade a desbloqueia; cada Habilidade é usada uma vez por partida.${m.sideQuests ? " Cada Personagem também tem uma carta de Missão Secundária (Side Quest) sob o tabuleiro, visível a todos, que vale Pontos de Vitória no fim." : ""}`
        )), refs("core", 7, 12, 13))}
        ${card(t("Experience Points", "Pontos de Experiência"), para(t(
          `Move your regular marker along the track. When it reaches the 20 Experience spot, take your Golden Experience marker and place it on the 0 spot: it tracks any further Experience, unlocks nothing, but at the end ${m.isLM ? "deals damage to the Monster equal to the Victory Point value it reached" : "scores bonus Victory Points (the values are printed along the track)"}. When the Golden marker reaches 20, it stops and you cannot gain more Experience.`,
          `Mova seu marcador normal pela trilha. Quando ele chega ao espaço 20, pegue seu marcador Dourado de Experiência e coloque-o no espaço 0: ele registra a Experiência extra, não desbloqueia nada, mas no fim ${m.isLM ? "causa ao Monstro dano igual ao valor em Pontos de Vitória que alcançou" : "dá Pontos de Vitória bônus (os valores estão impressos ao longo da trilha)"}. Quando o marcador Dourado chega a 20, ele para e você não ganha mais Experiência.`
        )), ref("core", 12))}
        ${card(t("Initiative track", "Trilha de Iniciativa"), para(t(
          "The order of the standees on the Initiative track (top to bottom) is the drafting order and breaks ties. It changes every Turn, depending on which spot each player drafts from.",
          "A ordem dos marcadores na trilha de Iniciativa (de cima para baixo) é a ordem de escolha e desempata. Ela muda a cada Turno, conforme o espaço de onde cada jogador pega cartas."
        )), refs("core", 13, 14))}
      </div>`;
  }

  // --- Quick reference ---------------------------------------------------------

  function quickReference(index) {
    const m = match();
    const draft = m.isLM
      ? [
        t("In Initiative order, take a pair of cards from a spot (or 2 from the deck at the top spot).", "Na ordem de Iniciativa, pegue um par de um espaço (ou 2 do baralho no espaço de cima)."),
        t("After each player drafts, the Monster activates.", "Depois de cada jogador escolher, o Monstro ativa."),
        t("Bottom spot: +1 Experience.", "Espaço de baixo: +1 Experiência.")
      ]
      : [
        t("Discard the topmost pair (not in the first Turn), slide the pairs up and refill.", "Descarte o par mais alto (não no primeiro Turno), suba os pares e reponha."),
        t("In Initiative order, take a pair from a spot, or 2 cards from the deck at the top spot (shared).", "Na ordem de Iniciativa, pegue um par de um espaço, ou 2 cartas do baralho no espaço de cima (compartilhado)."),
        t("Bottom spot: +1 Experience (some Tales change this).", "Espaço de baixo: +1 Experiência (alguns Contos mudam isso).")
      ];
    const play = [
      t("Everyone picks 2 cards face down and reveals them at once.", "Todos escolhem 2 cartas viradas para baixo e revelam juntos."),
      t("Add them to your Timeline, resolving effects left to right, to the maximum extent possible.", "Coloque-as na Linha do Tempo, resolvendo os efeitos da esquerda para a direita, o máximo possível.")
    ];
    let destiny;
    if (m.isLM) {
      destiny = [
        t("Put the next Destiny token on the Monster card to mark the end of the Turn.", "Coloque a próxima ficha de Destino na carta do Monstro para marcar o fim do Turno."),
        t("The 3rd token ends the Chapter.", "A 3ª ficha encerra o Capítulo.")
      ];
    } else if (m.isWH) {
      destiny = [
        t("After the Wild Hunt Step (Strategic Withdrawal, then Advancement), compare Active Symbols.", "Depois da Etapa da Wild Hunt (Retirada Estratégica e depois Avanço), compare Símbolos Ativos."),
        t("The Destiny token goes to the Active Symbol the Wild Hunt has more of; a tie sets it aside.", "A ficha de Destino vai para o Símbolo Ativo que a Wild Hunt tem mais; empate a deixa de lado.")
      ];
    } else if (m.solo) {
      destiny = [
        t("Flip the Solo Mode Destiny token: that Active Symbol is added to the Automa’s pool.", "Jogue a ficha de Destino do Modo Solo: esse Símbolo Ativo vai para a reserva do Automa."),
        t("The Destiny token goes to the Active Symbol the Automa has more of; a tie sets it aside.", "A ficha de Destino vai para o Símbolo Ativo que o Automa tem mais; empate a deixa de lado.")
      ];
    } else {
      destiny = [
        t("Each player announces which Active Symbol they have more of (or a tie).", "Cada jogador anuncia de qual Símbolo Ativo tem mais (ou empate)."),
        t("The Destiny token goes to the Path the majority announced; a tie between players sets it aside.", "A ficha de Destino vai para o Caminho que a maioria anunciou; empate entre jogadores a deixa de lado."),
        m.players === 2 ? t("With 2 players, face-up cards left on the playmat vote as a 3rd player.", "Com 2 jogadores, cartas viradas para cima que sobraram no tapete votam como 3º jogador.") : ""
      ];
    }
    let chapter;
    if (m.isLM) {
      chapter = [
        t("Trail card: meet it for +3 Experience, or roll the Monster die.", "Carta de Trilha: cumpra para +3 Experiência, ou role o dado do Monstro."),
        t("Gain Experience for the Non-Active Symbols shown on it.", "Ganhe Experiência pelos Símbolos Não Ativos mostrados nela."),
        t("Total all Fight Symbols as damage.", "Some todos os Símbolos de Luta como dano."),
        t("Keep 1 card (after Chapter 1) or 2 (after Chapter 2).", "Guarde 1 carta (após o Capítulo 1) ou 2 (após o Capítulo 2).")
      ];
    } else if (m.isWH) {
      chapter = [
        t("Dominating Symbol is decided by Destiny tokens.", "Símbolo Dominante é decidido pelas fichas de Destino."),
        t("Heroes score Dominating Symbols of their best and worst Hero; the Wild Hunt scores its own plus a bonus per Hero with fewer.", "Heróis marcam Símbolos Dominantes do melhor e do pior Herói; a Wild Hunt marca os seus mais bônus por Herói com menos."),
        t("Everyone gains Experience for Non-Dominating Symbols.", "Todos ganham Experiência pelos Não Dominantes."),
        t("Keep 1 card / 2 cards.", "Guarde 1 carta / 2 cartas.")
      ];
    } else {
      chapter = [
        t("Dominating Symbol = more Destiny tokens (tie: higher-numbered token).", "Símbolo Dominante = mais fichas de Destino (empate: ficha de número maior)."),
        t("+1 Victory Point per Dominating Symbol, +1 Experience per Non-Dominating.", "+1 Ponto de Vitória por Símbolo Dominante, +1 Experiência por Não Dominante."),
        t("Path tokens to the most Left and most Right Symbols.", "Fichas de Caminho para quem tem mais Símbolos da Esquerda e da Direita."),
        t("Discard tokens; keep 1 card (after Chapter 1) or 2 (after Chapter 2).", "Descarte fichas; guarde 1 carta (após o Capítulo 1) ou 2 (após o Capítulo 2)."),
        t("Read the Tale card the Dominating Symbol points to.", "Leia a carta de Conto indicada pelo Símbolo Dominante.")
      ];
    }
    let end;
    if (m.isLM) {
      end = [
        t("After Chapter 3, the Golden Experience marker deals its Victory Point value as damage.", "Depois do Capítulo 3, o marcador Dourado de Experiência causa como dano o seu valor em Pontos de Vitória."),
        t("Monster at 0 or less: you win.", "Monstro em 0 ou menos: vocês vencem."),
        t("Otherwise, or if anyone loses their last Health Point at any time, you lose.", "Caso contrário, ou se alguém perder o último Ponto de Saúde a qualquer momento, vocês perdem.")
      ];
    } else if (m.isWH) {
      end = [
        t("One Hero (most Experience) scores the Golden Experience bonus for the Heroes; the Wild Hunt scores its own.", "Um Herói (mais Experiência) marca o bônus de Experiência Dourada pelos Heróis; a Wild Hunt marca o dela."),
        t("Both sides score their Side Quests.", "Os dois lados marcam suas Missões Secundárias.")
      ];
    } else {
      end = [
        t("Chapter 3 scoring.", "Pontuação do Capítulo 3."),
        m.sideQuests ? t("Side Quests.", "Missões Secundárias.") : "",
        t("Golden Experience bonus (needs at least 20 Experience) and the Tale’s own scoring.", "Bônus de Experiência Dourada (exige pelo menos 20 de Experiência) e a pontuação própria do Conto."),
        t("Most Victory Points wins; ties go to the player higher on the Initiative track.", "Vence quem tiver mais Pontos de Vitória; empate vai para quem está mais alto na trilha de Iniciativa.")
      ];
    }
    const cards = [
      [t("1 · Drafting cards", "1 · Escolher cartas"), draft, "turn"],
      [t("2 · Playing cards", "2 · Jogar cartas"), play, "turn"],
      [t("3 · Placing the Destiny token", "3 · Colocar a ficha de Destino"), destiny, "turn"],
      [t("End of each Chapter", "Fim de cada Capítulo"), chapter, "chapter-end"],
      [t("End of the game", "Fim da partida"), end, "game-end"]
    ];
    return `
      ${sectionHeading("quick", t("Quick reference", "Referência rápida"), index, ref("core", 22))}
      <p class="section-lead">${m.isLM
        ? t("3 Chapters × 3 Turns × 3 Steps. There are no Tale cards in this mode: the Legendary Monster card and the Trail cards take their place.", "3 Capítulos × 3 Turnos × 3 Etapas. Não há cartas de Conto neste modo: a carta do Monstro Lendário e as cartas de Trilha ocupam o lugar delas.")
        : t("3 Chapters × 3 Turns × 3 Steps. Tale cards are read before the first Chapter, between Chapters and at the end.", "3 Capítulos × 3 Turnos × 3 Etapas. As cartas de Conto são lidas antes do primeiro Capítulo, entre Capítulos e no fim.")}</p>
      <div class="quick-grid">${cards.map(([title, lines, target]) => `
        <article class="info-card"><h3>${title}</h3>${lineList(lines)}<p>${jump(target, t("Open the full rule", "Abrir a regra completa"))}</p></article>`).join("")}</div>`;
  }

  // --- Setup -------------------------------------------------------------------

  function item(id, title, lines) {
    return { id, title, lines: lines.filter(Boolean) };
  }

  function characterChoiceLines(m) {
    const pool = m.characters.filter((name) => !(m.solo && name === "Letho" && !m.isLM));
    const lines = [];
    if (m.isWH && !m.solo) {
      lines.push(t("One player takes the Wild Hunt Character board and its components. The other players are Heroes.", "Um jogador pega o tabuleiro de Personagem da Wild Hunt e seus componentes. Os outros jogadores são Heróis."));
    }
    if (m.isWH && m.solo) {
      lines.push(t("Choose any Character as your Hero and take the Wild Hunt Automa board.", "Escolha qualquer Personagem como seu Herói e pegue o tabuleiro de Automa da Wild Hunt."));
    } else {
      lines.push(t(`Character pool: ${pool.join(", ")}.`, `Personagens disponíveis: ${pool.join(", ")}.`));
      if (m.isLM) {
        lines.push(t("Dandelion may not be chosen in Legendary Monsters.", "Dandelion não pode ser escolhido em Legendary Monsters."));
      }
      if (m.isTale && m.solo && m.ownStretch) {
        lines.push(t("Letho cannot be chosen as your Character in Solo mode (he is left out of the pool above).", "Letho não pode ser escolhido como seu Personagem no modo Solo (ele ficou de fora da lista acima)."));
      }
      lines.push(t(`The ${m.isWH ? "Hero " : ""}player who most recently read any “The Witcher” book chooses first, then the others in clockwise order.`, `O ${m.isWH ? "Herói " : "jogador "}que leu mais recentemente qualquer livro de “The Witcher” escolhe primeiro, depois os outros em sentido horário.`));
      lines.push(t("Shuffle all the Player boards of the pool face down. Deal 2 to the choosing player, who looks at them, keeps one and returns the other to the pool. Then the next player does the same.", "Embaralhe todos os tabuleiros de jogador disponíveis virados para baixo. Dê 2 a quem vai escolher; ele os olha, fica com um e devolve o outro para os disponíveis. Depois o próximo jogador faz o mesmo."));
      if (pool.length === 5 && (m.isWH ? m.heroes : m.players) === 5) {
        lines.push(t("With exactly 5 boards in the pool and 5 players, the last player receives the last remaining Character.", "Com exatamente 5 tabuleiros e 5 jogadores, o último jogador recebe o Personagem que sobrou."));
      }
    }
    if (m.roach) {
      lines.push(t("Geralt on Roach: after a player chooses Geralt, they may replace his Player board, miniature and starting Action cards with the Geralt on Roach ones, then complete the setup using Geralt’s other components. Geralt on Roach counts as Geralt for the starting Initiative order.", "Geralt on Roach: depois que um jogador escolher Geralt, ele pode trocar o tabuleiro de jogador, a miniatura e as cartas de Ação iniciais pelas de Geralt on Roach, e completar a preparação com os outros componentes de Geralt. Geralt on Roach conta como Geralt na ordem inicial de Iniciativa."));
    }
    return lines;
  }

  function playerComponentLines(m) {
    const lines = [
      t("Experience markers: the regular one on the 0 spot of the Experience Points track; the Golden one waits on the spot indicated at the right of the track. It moves to the 0 spot only when your regular marker reaches 20 Experience.", "Marcadores de Experiência: o normal no espaço 0 da trilha de Pontos de Experiência; o Dourado espera no espaço indicado à direita da trilha. Ele só vai para o espaço 0 quando o marcador normal chega a 20 de Experiência."),
      t("Ability tokens: place 1 on the first Ability from the left, active side up (the side with an icon) — it is available from the start. Keep the other 3 next to your board.", "Fichas de Habilidade: coloque 1 na primeira Habilidade da esquerda, com o lado ativo para cima (o lado com ícone) — ela já está disponível. Deixe as outras 3 ao lado do tabuleiro.")
    ];
    if (m.ownStretch && !(m.isTale && m.solo)) {
      lines.push(t("Letho is the exception: his first Ability is not available from the beginning of the game. The rulebook does not say when it becomes available; follow his Player board.", "Letho é a exceção: a primeira Habilidade dele não está disponível no início da partida. O manual não diz quando ela passa a estar; siga o tabuleiro dele."));
    }
    lines.push(m.isLM
      ? t("Standee: on the Initiative track, following the starting Initiative order below (top to bottom).", "Marcador de pé: na trilha de Iniciativa, seguindo a ordem inicial abaixo (de cima para baixo).")
      : t("Standee: on the Initiative track, following the starting Initiative order below (the Character highest on the Initiative is closest to the Tale cards).", "Marcador de pé: na trilha de Iniciativa, seguindo a ordem inicial abaixo (o Personagem mais alto na Iniciativa fica mais perto das cartas de Conto)."));
    if (m.isLM) {
      lines.push(t("Player tokens: do not place any Victory Point marker (there are no Victory Points in this mode).", "Fichas de jogador: não coloque marcador de Pontos de Vitória (não há Pontos de Vitória neste modo)."));
    } else if (m.isWH) {
      lines.push(t("Heroes do not use individual Victory Point markers: the Heroes score together on Ciri’s Victory Point marker (see Tale setup).", "Os Heróis não usam marcadores individuais de Pontos de Vitória: eles marcam juntos no marcador de Pontos de Vitória de Ciri (veja a preparação do Conto)."));
      lines.push(interpretation(t("the Wild Hunt rulebook does not say so in these words; it only says to use Ciri’s marker for the Heroes and the Wild Hunt scoring miniature for the Wild Hunt.", "o manual da Wild Hunt não diz isso com essas palavras; só manda usar o marcador de Ciri para os Heróis e a miniatura de pontuação para a Wild Hunt.")));
    } else {
      lines.push(t("Player tokens: use 1 as your Victory Point marker on the 0 spot of the Victory Point track. The other ones have no use unless a special rule says otherwise.", "Fichas de jogador: use 1 como marcador de Pontos de Vitória no espaço 0 da trilha de Pontos de Vitória. As outras não têm uso, salvo regra especial."));
    }
    lines.push(t("Take your 5 starting Action cards: they form your starting hand.", "Pegue suas 5 cartas de Ação iniciais: elas formam sua mão inicial."));
    if (m.isWH) {
      lines.push(t("Side Quests: use the Side Quest cards from the Wild Hunt box instead of the regular ones, with the side matching the number of Heroes, tucked under the side of the board face up.", "Missões Secundárias: use as cartas de Missão Secundária da caixa Wild Hunt em vez das normais, com o lado correspondente ao número de Heróis, encaixadas viradas para cima ao lado do tabuleiro."));
    } else if (m.isLM) {
      lines.push(t("Side Quests are not used.", "As Missões Secundárias não são usadas."));
    } else if (m.sideQuests) {
      lines.push(t("Tuck your Side Quest card face up under the side of your Player board.", "Encaixe sua carta de Missão Secundária virada para cima sob a lateral do seu tabuleiro."));
    } else {
      lines.push(m.tale === "doppler"
        ? t("Do not use Side Quests in Doppler.", "Não use Missões Secundárias em Doppler.")
        : t("First play: leave the Side Quest cards in the box.", "Primeira partida: deixe as cartas de Missão Secundária na caixa."));
    }
    return lines;
  }

  function taleSetupItems(m) {
    const s = [];
    const id = m.tale;
    if (id === "edge") {
      s.push(m.firstPlay
        ? item("edge-first", t("The Edge of the World — first play", "The Edge of the World — primeira partida"), [
          t("Leave the 12 Extra Effort cards in the box: this game uses no special Tale rules.", "Deixe as 12 cartas Extra Effort na caixa: esta partida não usa regras especiais do Conto.")
        ])
        : item("edge-effort", t("The Edge of the World — Extra Effort cards", "The Edge of the World — cartas Extra Effort"), [
          t("The 12 Extra Effort cards are 4 for each of the 3 Chapters. Place 1 random card for each Chapter face up next to the playmat.", "As 12 cartas Extra Effort são 4 para cada um dos 3 Capítulos. Coloque 1 carta sorteada de cada Capítulo virada para cima ao lado do tapete.")
        ]));
    }
    if (id === "striga") {
      s.push(item("striga-objectives", t("Striga — Secret Objectives and Requirements", "Striga — Objetivos Secretos e Requisitos"), [
        m.solo ? t("Solo: first replace the 6 Secret Objective cards with Fight and Magic on their back with the 6 Solo Mode Secret Objective cards.", "Solo: primeiro troque as 6 cartas de Objetivo Secreto com Luta e Magia no verso pelas 6 cartas de Objetivo Secreto do Modo Solo.") : "",
        t("The Secret Objective cards have 4 types of back: Fight; Magic; Fight, Diplomacy or Exploration; Magic, Diplomacy or Exploration. Randomly choose 1 card of each type and place the 4 face down on the table.", "As cartas de Objetivo Secreto têm 4 tipos de verso: Luta; Magia; Luta, Diplomacia ou Exploração; Magia, Diplomacia ou Exploração. Sorteie 1 carta de cada tipo e coloque as 4 viradas para baixo na mesa."),
        t("Place 1 random Requirement card next to each Secret Objective card.", "Coloque 1 carta de Requisito sorteada ao lado de cada Objetivo Secreto."),
        t("The Tale’s contents also list 2 Special Symbol tokens. The rulebook gives no rule for them: keep them at hand and use them as the Tale cards say.", "O conteúdo do Conto também lista 2 fichas de Símbolo Especial. O manual não dá regra para elas: deixe-as à mão e use-as como as cartas de Conto mandarem.")
      ]));
    }
    if (id === "lesser") {
      s.push(item("lesser-alliance", t("The Lesser Evil — Alliance tokens and cards", "The Lesser Evil — fichas e cartas de Aliança"), [
        t("Replace the Extra Experience token with the Renfri/Stregobor Alliance token (bottom spot).", "Troque a ficha de Experiência Extra pela ficha de Aliança Renfri/Stregobor (espaço de baixo)."),
        t("Place the Renfri Alliance token and the Stregobor Alliance token, in random order, next to the next spots up from the bottom.", "Coloque as fichas de Aliança de Renfri e de Stregobor, em ordem aleatória, ao lado dos próximos espaços acima do de baixo."),
        t("Shuffle the 32 Alliance cards into two face-down decks, one for Renfri and one for Stregobor, nearby.", "Embaralhe as 32 cartas de Aliança em dois baralhos virados para baixo, um de Renfri e um de Stregobor, por perto.")
      ]));
    }
    if (id === "grain") {
      s.push(item("grain-nivellen", t("A Grain of Truth — Nivellen and Mystery cards", "A Grain of Truth — Nivellen e cartas de Mistério"), [
        t("Do not place the Extra Experience token. Instead, players gain an extra Experience Point by drafting from a spot below Nivellen’s.", "Não coloque a ficha de Experiência Extra. Em vez disso, os jogadores ganham um Ponto de Experiência extra ao escolher um espaço abaixo do de Nivellen."),
        t("Place Nivellen’s standee below all Characters on the Initiative track.", "Coloque o marcador de Nivellen abaixo de todos os Personagens na trilha de Iniciativa."),
        t("Look through the 16 Mystery cards and remove those that correspond to the Characters the players chose. Shuffle the rest and place the deck face down next to the playmat, near the Victory Points track. Draw the first 2 Mystery cards before the Action card pairs for the first Turn are revealed (see the Tale rules).", "Olhe as 16 cartas de Mistério e retire as que correspondem aos Personagens escolhidos. Embaralhe o resto e coloque o baralho virado para baixo ao lado do tapete, perto da trilha de Pontos de Vitória. Compre as 2 primeiras cartas de Mistério antes de revelar os pares de cartas de Ação do primeiro Turno (veja as regras do Conto)."),
        t("Place Nivellen’s Vote token, the Determination token and the Authority token nearby.", "Coloque por perto a ficha de Voto de Nivellen, a ficha de Determinação e a ficha de Autoridade.")
      ]));
    }
    if (id === "skellige") {
      const alibi = { 3: [3, 4, 2], 4: [2, 3, 2], 5: [1, 2, 2] }[m.players];
      s.push(item("skellige-alibi", t("Skellige — Alibi cards", "Skellige — cartas de Álibi"), [
        t(`Shuffle the 16 Alibi cards. Place ${alibi[0]} face up (the Innocent pool) and ${alibi[1]} face down (the Suspect pool) next to the playmat.`, `Embaralhe as 16 cartas de Álibi. Coloque ${alibi[0]} viradas para cima (grupo dos Inocentes) e ${alibi[1]} viradas para baixo (grupo dos Suspeitos) ao lado do tapete.`),
        t("Place 3 cards face down as the Killer pool: the first 2 are revealed at the end of Chapters 1 and 2; the 3rd is the Killer you must identify.", "Coloque 3 cartas viradas para baixo como grupo do Assassino: as 2 primeiras são reveladas no fim dos Capítulos 1 e 2; a 3ª é o Assassino que vocês precisam identificar."),
        t(`Deal ${alibi[2]} cards to each player, who inspect them secretly.`, `Dê ${alibi[2]} cartas a cada jogador, que as olha em segredo.`),
        t("Each player takes a Deduction pad sheet, a pencil and a screen to take secret notes.", "Cada jogador pega uma folha do bloco de Dedução, um lápis e um anteparo para anotações secretas.")
      ]));
      s.push(item("skellige-board", t("Skellige — Investigation board", "Skellige — tabuleiro de Investigação"), [
        t("Set up the Investigation board next to the playmat. Shuffle the 10 Investigation cards and place the pile face up below its left space (A).", "Monte o tabuleiro de Investigação ao lado do tapete. Embaralhe as 10 cartas de Investigação e coloque a pilha virada para cima abaixo do espaço da esquerda (A)."),
        t("Place 1 card from the top of the pile below each of the spaces with the Active Symbols (B and C).", "Coloque 1 carta do topo da pilha abaixo de cada espaço com os Símbolos Ativos (B e C)."),
        t("Place the Investigation token next to the Investigation board, and the 16 Clue tokens nearby.", "Coloque a ficha de Investigação ao lado do tabuleiro de Investigação e as 16 fichas de Pista por perto.")
      ]));
    }
    if (id === "doppler") {
      const ids = { 3: [2, 1], 4: [3, 2], 5: [3, 2] }[m.players];
      s.push(item("doppler-goal", t("Doppler — Goal track and Mistrust", "Doppler — trilha de Objetivo e Desconfiança"), [
        t("Place the Goal track next to the playmat with the 4 Goal tokens on its 0 spot.", "Coloque a trilha de Objetivo ao lado do tapete com as 4 fichas de Objetivo no espaço 0."),
        t("Each player puts 3 Mistrust tokens and the Player tokens matching their Character next to their Player board. One Mistrust token is placed per Chapter: worth 1 in Chapters 1 and 2, worth 2 in Chapter 3 (see the Tale rules).", "Cada jogador coloca 3 fichas de Desconfiança e as fichas de jogador do seu Personagem ao lado do tabuleiro. Uma ficha de Desconfiança é colocada por Capítulo: vale 1 nos Capítulos 1 e 2 e vale 2 no Capítulo 3 (veja as regras do Conto).")
      ]));
      s.push(item("doppler-identity", t("Doppler — Hint and Identity cards", "Doppler — cartas de Dica e de Identidade"), [
        t("Before your first game, prepare 4 bags: set aside the 2 Doppler cards; split the Goal cards (“You are not a doppler”) and Hint cards into 4 piles by Goal color — each pile has 3 Goal cards of one color (e.g. yellow) and the 3 Hint cards showing which colors are not the Goal (e.g. blue, green, red) — and put each pile in its own bag.", "Antes da primeira partida, prepare 4 sacos: separe as 2 cartas de Doppler; divida as cartas de Objetivo (“Você não é um doppler”) e de Dica em 4 pilhas pela cor do Objetivo — cada pilha tem 3 cartas de Objetivo de uma cor (ex.: amarela) e as 3 cartas de Dica que mostram quais cores não são o Objetivo (ex.: azul, verde, vermelha) — e ponha cada pilha no seu saco."),
        t("Randomly pick one bag and put the rest back in the box. Take out its face-down cards and separate them by their backs. Place the 3 Hint cards next to the playmat: they correspond to the 3 Chapters.", "Sorteie um saco e devolva os outros à caixa. Tire as cartas viradas para baixo e separe-as pelo verso. Coloque as 3 cartas de Dica ao lado do tapete: elas correspondem aos 3 Capítulos."),
        t(`Take ${ids[0]} Goal cards and ${ids[1]} Doppler card${ids[1] > 1 ? "s" : ""}, shuffle them and deal 1 to each player.${m.players === 4 ? " In a 4-player game one card is left: return it to the box without revealing it." : ""}`, `Pegue ${ids[0]} cartas de Objetivo e ${ids[1]} carta${ids[1] > 1 ? "s" : ""} de Doppler, embaralhe e dê 1 a cada jogador.${m.players === 4 ? " Com 4 jogadores sobra uma carta: devolva-a à caixa sem revelar." : ""}`),
        t("Everyone looks at their own Identity card and places it next to their board. You may look at yours at any moment; nobody may look at anyone else’s during the game.", "Todos olham a própria carta de Identidade e a colocam ao lado do tabuleiro. Você pode olhar a sua a qualquer momento; ninguém pode olhar a de outro durante a partida."),
        t("After the game, put the Hint and Goal cards back in their bag and keep the 2 Doppler cards separate.", "Depois da partida, devolva as cartas de Dica e de Objetivo ao saco e mantenha as 2 cartas de Doppler separadas.")
      ]));
    }
    if (id === "dragon") {
      s.push(item("dragon-board", t("Golden Dragon — Dragon board", "Golden Dragon — tabuleiro do Dragão"), [
        t("Split the 9 Dragon board tiles into 3 piles by the letter in their corner (A, B, C), random side up. Shuffle each pile, take 2 tiles from each and shuffle those 6 together.", "Separe os 9 hexágonos do tabuleiro do Dragão em 3 pilhas pela letra no canto (A, B, C), com lado aleatório para cima. Embaralhe cada pilha, pegue 2 de cada e embaralhe esses 6 juntos."),
        t("Place the 6 tiles around the central tile to form the Dragon board. Place the Golden Dragon standee on the tile marked by the central tile.", "Coloque os 6 hexágonos ao redor do hexágono central formando o tabuleiro do Dragão. Coloque o marcador do Dragão Dourado no hexágono indicado pelo central."),
        t(`Place ${[1, 3, 5].includes(m.players) ? 3 : 4} Life Point tokens on the central tile (3 for 1, 3 or 5 players; 4 for 2 or 4 players). Keep the Golden Dragon token nearby.`, `Coloque ${[1, 3, 5].includes(m.players) ? 3 : 4} fichas de Vida no hexágono central (3 com 1, 3 ou 5 jogadores; 4 com 2 ou 4 jogadores). Deixe a ficha do Dragão Dourado por perto.`)
      ]));
      const extra = m.players === 2 ? 2 : 1;
      s.push(item("dragon-cards", t("Golden Dragon — Dragon Protection cards", "Golden Dragon — cartas Dragon Protection"), [
        t(`After the starting hands are taken, each player draws ${extra} Dragon Protection card${extra > 1 ? "s" : ""} (2 in a 2-player game, otherwise 1).`, `Depois de formadas as mãos iniciais, cada jogador compra ${extra} carta${extra > 1 ? "s" : ""} Dragon Protection (2 numa partida de 2 jogadores, senão 1).`),
        m.villain === "vilgefortz" || m.villain === "bonhart" || m.voice
          ? t("Optional modules may have added cards to the Main deck: before shuffling in the Dragon Protection cards, make sure the Main deck holds 68 cards, discarding the excess at random.", "Módulos opcionais podem ter colocado cartas no baralho principal: antes de embaralhar as Dragon Protection, confira que o baralho principal tem 68 cartas, descartando o excesso ao acaso.")
          : t("If optional modules added cards to the Main deck, first bring it back to 68 cards, discarding the excess at random.", "Se módulos opcionais colocaram cartas no baralho principal, primeiro volte-o a 68 cartas, descartando o excesso ao acaso."),
        t("Shuffle the remaining Dragon Protection cards into the Main deck.", "Embaralhe as Dragon Protection restantes no baralho principal."),
        t(`All players simultaneously discard ${extra} card${extra > 1 ? "s" : ""} from their hand; they may discard a Dragon Protection card.`, `Todos descartam ao mesmo tempo ${extra} carta${extra > 1 ? "s" : ""} da mão; podem descartar uma Dragon Protection.`)
      ]));
    }
    if (id === "wish") {
      s.push(item("wish-djinn", t("The Last Wish — Djinn track, Wish cards and Seals", "The Last Wish — trilha do Djinn, cartas de Desejo e Selos"), [
        t("Place the Djinn track next to the playmat; each player places a Player token on its starting spot. Place the Djinn board next to it.", "Coloque a trilha do Djinn ao lado do tapete; cada jogador coloca uma ficha de jogador no espaço inicial. Coloque o tabuleiro do Djinn ao lado."),
        t("Separate the 15 Wish cards by the Chapter number on their back. Shuffle each pile and draw 1 face down for each Chapter; place them next to the Djinn board and return the rest to the box.", "Separe as 15 cartas de Desejo pelo número do Capítulo no verso. Embaralhe cada pilha e compre 1 virada para baixo de cada Capítulo; coloque-as ao lado do tabuleiro do Djinn e devolva o resto à caixa."),
        t("Put the 12 Seal tokens (3 of each of the 4 colors) in the velvet bag and shuffle. Nobody may inspect the bag during the game. Draw 4 and place them in the Past Seal pool on the Djinn board.", "Ponha as 12 fichas de Selo (3 de cada uma das 4 cores) no saco de veludo e misture. Ninguém pode olhar o saco durante a partida. Compre 4 e coloque-as no grupo de Selos Passados do tabuleiro do Djinn."),
        m.solo ? t("Solo: the Automa also uses a token on the Djinn track; at the start of each Chapter place it 2 spots further than yours.", "Solo: o Automa também usa uma ficha na trilha do Djinn; no início de cada Capítulo coloque-a 2 espaços à frente da sua.") : ""
      ]));
    }
    return s;
  }

  function setupPhases() {
    const m = match();
    const phases = [];
    if (m.isTale) {
      const tale = m.taleInfo;
      phases.push({
        title: t("Playmat and Tale", "Tapete e Conto"),
        refs: [["core", 8]],
        items: [
          item("playmat", t("Place the playmat", "Coloque o tapete"), [
            t("The playmat organizes the main play area. Leave room for each player’s Player board and Timeline, and for the components of the chosen Tale.", "O tapete organiza a área principal. Deixe espaço para o tabuleiro de jogador e a Linha do Tempo de cada um, e para os componentes do Conto escolhido.")
          ]),
          item("tale-deck", t(`Place the Tale cards of “${taleName(m.tale)}”`, `Coloque as cartas de Conto de “${taleName(m.tale)}”`), [
            t("Put the Tale deck on its place on the playmat, cover face up, like a book you are about to read. Never shuffle it: keep it in the order of the numbers in the bottom corner.", "Ponha o baralho do Conto no lugar dele no tapete, com a capa para cima, como um livro prestes a ser lido. Nunca embaralhe: mantenha a ordem dos números do canto inferior."),
            t("Stack the Destiny tokens next to the Tale cards: III at the bottom, then II, then I on top. Place the 2 Path tokens next to them.", "Empilhe as fichas de Destino ao lado das cartas de Conto: III embaixo, depois II, e I em cima. Coloque as 2 fichas de Caminho ao lado.")
          ])
        ]
      });
      phases.push({
        title: t("Action cards and tokens", "Cartas de Ação e fichas"),
        refs: [["core", 9]],
        items: [
          item("main-deck", t(`Main deck and the ${m.spots} spots`, `Baralho principal e os ${m.spots} espaços`), [
            t("Shuffle the Main deck of 68 Action cards and place it face down on its spot on the playmat.", "Embaralhe o baralho principal de 68 cartas de Ação e coloque-o virado para baixo no lugar dele no tapete."),
            m.villain === "vilgefortz" || m.villain === "bonhart" ? t(`${VILLAINS[m.villain]}: shuffle 3 random ${VILLAINS[m.villain]} cards into the Main deck and return the rest to the box.`, `${VILLAINS[m.villain]}: embaralhe 3 cartas sorteadas de ${VILLAINS[m.villain]} no baralho principal e devolva o resto à caixa.`) : "",
            t(`Draw a pair of cards from the top of the deck face up onto each designated spot (row) of the playmat, below the Main deck: ${m.spots} spots for ${m.solo ? "a solo game (set up as 2 players)" : `${m.players} players`} (4 spots for 1–3 players, 5 for 4–5). The Main deck’s own spot at the top is not one of these and gets no face-up pair.`, `Compre um par de cartas do topo do baralho virado para cima em cada espaço (fileira) do tapete, abaixo do baralho principal: ${m.spots} espaços para ${m.solo ? "a partida solo (preparada como 2 jogadores)" : `${m.players} jogadores`} (4 espaços para 1–3 jogadores, 5 para 4–5). O espaço do próprio baralho principal, no alto, não é um deles e não recebe par virado.`)
          ]),
          item("extra-xp", t("Extra Experience token and Symbol tokens", "Ficha de Experiência Extra e fichas de Símbolo"), [
            m.tale === "grain"
              ? t("A Grain of Truth: do not place the Extra Experience token (see the Tale setup).", "A Grain of Truth: não coloque a ficha de Experiência Extra (veja a preparação do Conto).")
              : m.tale === "lesser"
                ? t("The Lesser Evil: the Extra Experience token is replaced by the Renfri/Stregobor Alliance token (see the Tale setup).", "The Lesser Evil: a ficha de Experiência Extra é trocada pela ficha de Aliança Renfri/Stregobor (veja a preparação do Conto).")
                : t(`Place the Extra Experience token next to the bottom available spot (the ${m.spots === 4 ? "4th" : "5th"} spot).`, `Coloque a ficha de Experiência Extra ao lado do espaço disponível mais baixo (o ${m.spots === 4 ? "4º" : "5º"} espaço).`),
            t("Place the Symbol tokens (Exploration, Fight, Magic, Diplomacy) and the Lost Symbol tokens on the table.", "Coloque na mesa as fichas de Símbolo (Exploração, Luta, Magia, Diplomacia) e as fichas de Símbolo Perdido.")
          ])
        ]
      });
      const characterItems = [
        item("characters", t(m.solo ? "Choose your Character" : "Choose Characters", m.solo ? "Escolha seu Personagem" : "Escolham os Personagens"), characterChoiceLines(m)),
        item("player-components", t("Player components", "Componentes de jogador"), playerComponentLines(m)),
        item("initiative", t("Starting Initiative order", "Ordem inicial de Iniciativa"), [
          t(`${taleName(m.tale)}, top to bottom: ${orderLine(tale.order, m.characters)}. Place the standees of the Characters in play in this order${m.tale === "grain" ? ", with Nivellen below all of them" : ""}.`, `${taleName(m.tale)}, de cima para baixo: ${orderLine(tale.order, m.characters)}. Coloque os marcadores dos Personagens em jogo nessa ordem${m.tale === "grain" ? ", com Nivellen abaixo de todos" : ""}.`),
          t("The lists always include every released Character; skip those not in play.", "As listas sempre incluem todos os Personagens lançados; pule os que não estão em jogo.")
        ])
      ];
      phases.push({ title: t("Characters", "Personagens"), refs: [["core", 10]], items: characterItems });
      if (m.solo) {
        const boards = [t("any Character not chosen", "qualquer Personagem não escolhido")];
        if (m.ownStretch) {
          boards.push(t("the Crimson Avenger / Asshole double-sided board (choose a side)", "o tabuleiro dupla face Crimson Avenger / Asshole (escolha um lado)"));
        }
        phases.push({
          title: t("Solo: the Automa", "Solo: o Automa"),
          refs: [["core", 20], ...(m.ownStretch ? [["stretch", 11]] : [])],
          items: [
            item("automa", t("Set up the Automa", "Prepare o Automa"), [
              t("Set up as for a regular 2-player game, with the changes below and on the Tale-specific Solo Rules cards.", "Prepare como numa partida normal de 2 jogadores, com as mudanças abaixo e as das cartas de Regras Solo do Conto."),
              t(`Instead of a second Player board, take an Automa board: ${boards.join(t(" or ", " ou "))}.${m.ownStretch || m.ownGrain ? t(" The new Characters’ Automa boards are part of the pool.", " Os tabuleiros de Automa dos novos Personagens fazem parte das opções.") : ""}`, `Em vez de um segundo tabuleiro de jogador, pegue um tabuleiro de Automa: ${boards.join(t(" or ", " ou "))}.${m.ownStretch || m.ownGrain ? " Os tabuleiros de Automa dos novos Personagens fazem parte das opções." : ""}`),
              t("Take 1 Solo Mode Destiny token and place it nearby.", "Pegue 1 ficha de Destino do Modo Solo e deixe-a por perto."),
              t(`Place the Automa’s Experience markers and its matching Victory Point token following the standard rules — but the Regular Experience marker goes on spot ${SOLO_LEVELS[m.soloLevel].start} of the Automa’s Experience track (${soloLevelName(m.soloLevel)}).`, `Coloque os marcadores de Experiência do Automa e a ficha de Pontos de Vitória correspondente pelas regras normais — mas o marcador normal de Experiência vai no espaço ${SOLO_LEVELS[m.soloLevel].start} da trilha de Experiência do Automa (${soloLevelName(m.soloLevel)}).`),
              t("Place the Automa’s standee by the Tale’s Initiative order and put the rest of the Automa Character’s components back in the box (the Automa has no Side Quest and no hand).", "Coloque o marcador do Automa pela ordem de Iniciativa do Conto e devolva à caixa os outros componentes do Personagem do Automa (o Automa não tem Missão Secundária nem mão)."),
              m.ownStretch ? interpretation(t("the Crimson Avenger / Asshole board is not a Character, so the Tales’ Initiative orders do not list it and the rulebook gives it no position. This guide suggests placing its standee last on the Initiative track.", "o tabuleiro Crimson Avenger / Asshole não é um Personagem, então as ordens de Iniciativa dos Contos não o listam e o manual não lhe dá posição. Este guia sugere colocar o marcador dele por último na trilha de Iniciativa.")) : ""
            ])
          ]
        });
      }
      const taleItems = taleSetupItems(m);
      if (taleItems.length) {
        phases.push({ title: t(`Tale setup: ${taleName(m.tale)}`, `Preparação do Conto: ${taleName(m.tale)}`), refs: m.tale === "grain" ? [] : tale.pages.map((page) => [tale.book, page]), grain: m.tale === "grain", items: taleItems });
      }
      const moduleItems = [];
      if (m.companion !== "none") {
        moduleItems.push(item("companion", t(`Companion: ${COMPANIONS[m.companion]}`, `Companheiro: ${COMPANIONS[m.companion]}`), [
          t(`Shuffle the 5 ${COMPANIONS[m.companion]} cards face down and place them next to the playmat. The first one comes out at the start of Chapter 1 (see the module rules: 1 card per Chapter, 3 per game).${m.companion === "zoltan" ? " The set also includes 1 Field Marshal Windbag card; the rulebook gives it no separate rule, so follow its card text." : ""}`, `Embaralhe as 5 cartas de ${COMPANIONS[m.companion]} viradas para baixo e coloque-as ao lado do tapete. A primeira sai no início do Capítulo 1 (veja as regras do módulo: 1 carta por Capítulo, 3 por partida).${m.companion === "zoltan" ? " O conjunto também tem 1 carta Field Marshal Windbag; o manual não lhe dá regra própria, então siga o texto da carta." : ""}`),
          m.companion === "zoltan" ? t("Keep the core Solo Mode Destiny token at hand: Zoltan’s abilities flip it in the air to decide the outcome.", "Deixe à mão a ficha de Destino do Modo Solo da caixa base: as habilidades de Zoltan a lançam para o alto para decidir o resultado.") : ""
        ]));
      }
      if (m.villain === "odimm") {
        moduleItems.push(item("odimm", t("Villain: Gaunter O’Dimm", "Vilão: Gaunter O’Dimm"), [
          t("Shuffle the 6 O’Dimm cards and place them in a face-down pile next to the playmat.", "Embaralhe as 6 cartas de O’Dimm e coloque-as numa pilha virada para baixo ao lado do tapete.")
        ]));
      }
      if (m.villain === "vilgefortz" || m.villain === "bonhart") {
        moduleItems.push(item("villain-check", t(`Villain: ${VILLAINS[m.villain]}`, `Vilão: ${VILLAINS[m.villain]}`), [
          t("Already done in the Main deck step: 3 random Villain cards are in the Main deck. Leave room next to the playmat for drawn Villain cards.", "Já feito na etapa do baralho principal: 3 cartas de Vilão sorteadas estão no baralho principal. Deixe espaço ao lado do tapete para as cartas de Vilão que forem compradas.")
        ]));
      }
      if (m.voice) {
        moduleItems.push(item("voice", t("Voice of Reason envelope", "Envelope Voice of Reason"), [
          t(`After the rest of the setup${m.solo ? " (also in Solo mode)" : ""}, find the envelope matching “${taleName(m.tale)}” and read its achievement list: extra tasks you may complete during the game. Keep a pen at hand.`, `Depois do resto da preparação${m.solo ? " (também no modo Solo)" : ""}, ache o envelope de “${taleName(m.tale)}” e leia a lista de conquistas: tarefas extras que vocês podem cumprir na partida. Deixe uma caneta à mão.`),
          t("You may also unlock 2 achievements of the RONIN envelope when playing any Tale. Its other 2 can only be unlocked by playing RONIN; mark them as completed if you do not own it.", "Também dá para liberar 2 conquistas do envelope RONIN jogando qualquer Conto. As outras 2 só se liberam jogando RONIN; marque-as como cumpridas se você não o tiver."),
          t("If you are replaying this Tale with content from an already opened envelope, add it now, following the clarifications found inside the envelope. The rulebook advises 2–3 unlocked modules at most.", "Se estiver rejogando este Conto com conteúdo de um envelope já aberto, adicione-o agora, seguindo as instruções de dentro do envelope. O manual recomenda no máximo 2–3 módulos liberados.")
        ]));
      }
      if (moduleItems.length) {
        phases.push({ title: t("Optional modules", "Módulos opcionais"), refs: [["stretch", 5], ["stretch", 6], ["stretch", 8]], items: moduleItems });
      }
      return phases;
    }

    if (m.isWH) {
      phases.push({
        title: t("Playmats and the Wild Hunt Tale", "Tapetes e o Conto da Wild Hunt"),
        refs: [["wildhunt", 6], ...(m.naglfar ? [["naglfar", 2]] : [])],
        items: [
          item("wh-playmats", t("Place both playmats", "Coloque os dois tapetes"), [
            t("Place the main playmat as usual, and the Generals playmat next to it, in front of the Wild Hunt player.", "Coloque o tapete principal como sempre, e o tapete dos Generais ao lado dele, na frente do jogador da Wild Hunt."),
            m.naglfar ? t("Naglfar: place the Naglfar miniature next to the Generals playmat.", "Naglfar: coloque a miniatura de Naglfar ao lado do tapete dos Generais.") : ""
          ]),
          item("wh-tale", t("Wild Hunt Tale cards and Destiny tokens", "Cartas de Conto da Wild Hunt e fichas de Destino"), [
            t("Use the 23 Tale cards from this expansion: put the deck on its place on the playmat, cover face up, in numerical order.", "Use as 23 cartas de Conto desta expansão: ponha o baralho no lugar dele no tapete, com a capa para cima, em ordem numérica."),
            t("Place the Destiny tokens next to the Tale cards (III at the bottom, then II, then I on top). Do not use the Path tokens.", "Coloque as fichas de Destino ao lado das cartas de Conto (III embaixo, depois II, e I em cima). Não use as fichas de Caminho.")
          ])
        ]
      });
      phases.push({
        title: t("Action cards and tokens", "Cartas de Ação e fichas"),
        refs: [["wildhunt", 6], ...(m.naglfar ? [["naglfar", 2]] : [])],
        items: [
          item("wh-deck", t(`Main deck and the ${m.spots} spots`, `Baralho principal e os ${m.spots} espaços`), [
            t("Shuffle the Main deck and place it on its spot on the playmat.", "Embaralhe o baralho principal e coloque-o no lugar dele no tapete."),
            t(`Fill the available spots below the Main deck with face-up pairs of cards: ${m.spots} spots (4 for 1–3 players, 5 for 4–5; the Wild Hunt player counts). The Main deck’s own spot at the top gets no pair.`, `Preencha os espaços disponíveis abaixo do baralho principal com pares de cartas viradas: ${m.spots} espaços (4 com 1–3 jogadores, 5 com 4–5; o jogador da Wild Hunt conta). O espaço do próprio baralho, no alto, não recebe par.`),
            t("Place the Extra Experience token next to the bottom-most filled spot, and the Symbol tokens and Lost Symbol tokens on the table.", "Coloque a ficha de Experiência Extra ao lado do espaço preenchido mais baixo, e as fichas de Símbolo e de Símbolo Perdido na mesa.")
          ]),
          m.naglfar ? item("wh-sextant", t("Naglfar: Broken Sextant cards", "Naglfar: cartas Broken Sextant"), [
            t("Shuffle the 4 Broken Sextant cards, remove one from the game unseen, and place the other 3 face down in a pile next to the Generals playmat.", "Embaralhe as 4 cartas Broken Sextant, retire uma do jogo sem olhar e coloque as outras 3 viradas para baixo numa pilha ao lado do tapete dos Generais.")
          ]) : null
        ].filter(Boolean)
      });
      phases.push({
        title: t("Characters", "Personagens"),
        refs: [["wildhunt", 6], ["wildhunt", 7], ["core", 10]],
        items: [
          item("wh-characters", t("Choose Characters", "Escolham os Personagens"), characterChoiceLines(m)),
          item("wh-hero-components", t(m.solo ? "Your Hero’s components" : "Heroes’ components", m.solo ? "Componentes do seu Herói" : "Componentes dos Heróis"), playerComponentLines(m)),
          item(m.solo ? "wh-automa" : "wh-player", t(m.solo ? "The Wild Hunt Automa" : "The Wild Hunt player’s components", m.solo ? "O Automa da Wild Hunt" : "Componentes do jogador da Wild Hunt"), m.solo ? [
            t("Follow the core Solo Mode setup (core p. 20) with the Wild Hunt Automa board instead of a Character’s Automa board: take 1 Solo Mode Destiny token and place it nearby.", "Siga a preparação do Modo Solo da caixa base (base p. 20) com o tabuleiro de Automa da Wild Hunt no lugar do Automa de um Personagem: pegue 1 ficha de Destino do Modo Solo e deixe-a por perto."),
            t(`Difficulty (${soloLevelName(m.soloLevel)}): place the Automa’s Regular Experience marker on spot ${SOLO_LEVELS[m.soloLevel].start} of its Experience track.`, `Dificuldade (${soloLevelName(m.soloLevel)}): coloque o marcador normal de Experiência do Automa no espaço ${SOLO_LEVELS[m.soloLevel].start} da trilha de Experiência dele.`),
            t("Place the Wild Hunt standee on the Initiative track and its scoring miniature on the 0 spot of the Victory Point track.", "Coloque o marcador da Wild Hunt na trilha de Iniciativa e a miniatura de pontuação dele no espaço 0 da trilha de Pontos de Vitória."),
            t("The Automa gets no starting hand and no Side Quest: it plays the cards it drafts immediately.", "O Automa não recebe mão inicial nem Missão Secundária: ele joga na hora as cartas que escolhe.")
          ] : [
            t("The Wild Hunt starts with its 6 starting Action cards in hand and 5 Ability markers: place 1 on the first Ability from the left, active side up.", "A Wild Hunt começa com suas 6 cartas de Ação iniciais na mão e 5 marcadores de Habilidade: coloque 1 na primeira Habilidade da esquerda, com o lado ativo para cima."),
            t("Place its 2 Experience markers on its track: the regular one on the 0 spot and the gray one at the right of the track (treat the gray one as the Golden marker, following the core rules).", "Coloque os 2 marcadores de Experiência dela na trilha: o normal no espaço 0 e o cinza à direita da trilha (trate o cinza como o marcador Dourado, pelas regras da caixa base)."),
            t("Give the Wild Hunt its Side Quest from the Wild Hunt box, side matching the number of Heroes.", "Dê à Wild Hunt a Missão Secundária dela da caixa Wild Hunt, com o lado do número de Heróis."),
            t("Place the Wild Hunt scoring miniature on the 0 spot of the Victory Point track.", "Coloque a miniatura de pontuação da Wild Hunt no espaço 0 da trilha de Pontos de Vitória.")
          ]),
          item("wh-initiative", t("Starting Initiative order", "Ordem inicial de Iniciativa"), [
            t(`Top to bottom: ${orderLine(WILD_HUNT_ORDER, m.characters)}. Place the standees in play in this order.`, `De cima para baixo: ${orderLine(WILD_HUNT_ORDER, m.characters)}. Coloque os marcadores em jogo nessa ordem.`)
          ])
        ]
      });
      phases.push({
        title: t("Tale setup: Generals", "Preparação do Conto: Generais"),
        refs: [["wildhunt", 7]],
        items: [
          item("wh-generals", t("Generals, Traits and Weaknesses", "Generais, Traços e Fraquezas"), [
            t("Split the 16 General Trait cards into 4 piles, one per General. Place 1 random card from each face up on its space of the Generals playmat, in this order: Imlerith (red), Eredin (green), Nithral (blue), Caranthir (yellow).", "Divida as 16 cartas de Traço de General em 4 pilhas, uma por General. Coloque 1 carta sorteada de cada, virada para cima, no espaço dela no tapete dos Generais, nesta ordem: Imlerith (vermelho), Eredin (verde), Nithral (azul), Caranthir (amarelo)."),
            t("Split the 16 General Weakness cards into 4 piles, one per General. Shuffle each separately and place it face down on its space of the Generals playmat.", "Divida as 16 cartas de Fraqueza de General em 4 pilhas, uma por General. Embaralhe cada uma separadamente e coloque-a virada para baixo no espaço dela no tapete dos Generais."),
            t("Place the 4 General miniatures on the starting spaces of their Threat tracks.", "Coloque as 4 miniaturas de General nos espaços iniciais das trilhas de Ameaça.")
          ]),
          item("wh-scoring", t("Victory Point markers", "Marcadores de Pontos de Vitória"), [
            t(`Use Ciri’s Victory Point marker for the Heroes and place it on the ${m.players <= 2 ? "9 Victory Points spot (Solo and 2-player exception)" : "0 spot"} of the Victory Point track.`, `Use o marcador de Pontos de Vitória de Ciri para os Heróis e coloque-o no ${m.players <= 2 ? "espaço 9 de Pontos de Vitória (exceção de Solo e 2 jogadores)" : "espaço 0"} da trilha de Pontos de Vitória.`),
            t("The Wild Hunt scoring miniature starts on 0.", "A miniatura de pontuação da Wild Hunt começa no 0.")
          ])
        ]
      });
      return phases;
    }

    const hp = m.players === 1 ? 5 : m.players === 5 ? 8 : 7;
    phases.push({
      title: t("Playmat and Monster", "Tapete e Monstro"),
      refs: [["legendary", 6], ...(m.monster === "wildhunt" ? [["naglfar", 6]] : [])],
      items: [
        item("lm-playmat", t("Place the playmat and the Monster cards", "Coloque o tapete e as cartas do Monstro"), [
          t("Place the playmat on the table.", "Coloque o tapete na mesa."),
          m.monster === "wildhunt"
            ? t("Place the Wild Hunt Legendary Monster cards (Naglfar box) on the designated place of the playmat, with the side for your player count face up.", "Coloque as cartas de Monstro Lendário da Wild Hunt (caixa Naglfar) no lugar indicado do tapete, com o lado do seu número de jogadores para cima.")
            : t(`Place the ${monsterName(m.monster)} cards on the designated place of the playmat, with the side for your player count face up.`, `Coloque as cartas de ${monsterName(m.monster)} no lugar indicado do tapete, com o lado do seu número de jogadores para cima.`),
          t("Place the Destiny tokens nearby (they only mark the end of each Turn).", "Coloque as fichas de Destino por perto (elas só marcam o fim de cada Turno).")
        ]),
        item("lm-deck", t(`Main deck and the ${m.spots} spots`, `Baralho principal e os ${m.spots} espaços`), [
          t("Remove the Action cards numbered 2, 7, 9 and 50 from the Main deck. Shuffle the rest and place it on its spot on the playmat.", "Retire do baralho principal as cartas de Ação de número 2, 7, 9 e 50. Embaralhe o resto e coloque-o no lugar dele no tapete."),
          t(`Fill the available spots with pairs of cards: ${m.spots} spots (4 for 1–3 players, 5 for 4–5).`, `Preencha os espaços disponíveis com pares de cartas: ${m.spots} espaços (4 com 1–3 jogadores, 5 com 4–5).`),
          t("Place the Extra Experience token next to the bottom-most filled spot, and the Symbol tokens and Lost Symbol tokens on the table.", "Coloque a ficha de Experiência Extra ao lado do espaço preenchido mais baixo, e as fichas de Símbolo e de Símbolo Perdido na mesa."),
          m.lmCompanion !== "none" ? t(`${m.lmCompanion === "lambert" ? "Lambert" : "Eskel"}: shuffle his 5 Companion cards face down and place them next to the playmat.`, `${m.lmCompanion === "lambert" ? "Lambert" : "Eskel"}: embaralhe as 5 cartas de Companheiro dele viradas para baixo e coloque-as ao lado do tapete.`) : ""
        ])
      ]
    });
    phases.push({
      title: t("Characters", "Personagens"),
      refs: [["legendary", 6], ["legendary", 7], ["core", 10]],
      items: [
        item("lm-characters", t(m.solo ? "Choose your Character" : "Choose Characters", m.solo ? "Escolha seu Personagem" : "Escolham os Personagens"), characterChoiceLines(m)),
        item("lm-components", t("Player components", "Componentes de jogador"), playerComponentLines(m)),
        item("lm-initiative", t("Initiative and Health Points", "Iniciativa e Pontos de Saúde"), [
          t(`Starting Initiative order, top to bottom: ${orderLine(LEGENDARY_ORDER, m.characters)}.`, `Ordem inicial de Iniciativa, de cima para baixo: ${orderLine(LEGENDARY_ORDER, m.characters)}.`),
          t(`Each player takes ${hp} Health Point tokens (1 player: 5; 2–4 players: 7 each; 5 players: 8 each), healthy side up.`, `Cada jogador pega ${hp} fichas de Ponto de Saúde (1 jogador: 5; 2–4 jogadores: 7 cada; 5 jogadores: 8 cada), com o lado saudável para cima.`)
        ])
      ]
    });
    const runeLine = {
      standard: t("Use exactly those cards.", "Use exatamente essas cartas."),
      easy: t("Easy game: also add 1 card marked with the bonus icon.", "Partida fácil: adicione também 1 carta marcada com o ícone de bônus."),
      beginner: t("Beginner game: also add 2 cards marked with the bonus icon.", "Partida de iniciante: adicione também 2 cartas marcadas com o ícone de bônus."),
      hard: t("Hard game: remove any 1 of those cards.", "Partida difícil: retire 1 dessas cartas, qualquer uma."),
      veryhard: t("Very hard game: remove any 2 of those cards.", "Partida muito difícil: retire 2 dessas cartas, quaisquer.")
    }[m.runestones];
    phases.push({
      title: t("Runestones and Trail cards", "Runestones e cartas de Trilha"),
      refs: [["legendary", 7]],
      items: [
        item("lm-runes", t("Runestone cards", "Cartas Runestone"), [
          t("Choose the Runestone cards for your player count (following the icons in their corner) and place them face up near the playmat.", "Escolha as cartas Runestone do seu número de jogadores (pelos ícones no canto) e coloque-as viradas para cima perto do tapete."),
          runeLine
        ]),
        item("lm-trails", t("Trail cards", "Cartas de Trilha"), [
          t("Split the 27 Trail cards into 3 piles by the Chapter number on their back. Shuffle each pile and place them face down next to the playmat.", "Divida as 27 cartas de Trilha em 3 pilhas pelo número do Capítulo no verso. Embaralhe cada pilha e coloque-as viradas para baixo ao lado do tapete.")
        ])
      ]
    });
    const specific = {
      leshen: t("Ancient Leshen: place the Root tokens nearby (the backside of the Suffering tokens).", "Ancient Leshen: coloque as fichas de Raiz por perto (o verso das fichas de Sofrimento)."),
      hym: t("Hym: place the Suffering tokens nearby (the backside of the Root tokens).", "Hym: coloque as fichas de Sofrimento por perto (o verso das fichas de Raiz)."),
      katakan: t("Katakan: place the Power token on Katakan’s card, on its starting position for the number of players (marked on the card’s Power level track).", "Katakan: coloque a ficha de Poder na carta de Katakan, na posição inicial do número de jogadores (marcada na trilha de nível de Poder da carta)."),
      fourth: t("The rulebook gives monster-specific setup only for Ancient Leshen, Hym and Katakan: follow this monster’s cards.", "O manual só dá preparação específica para Ancient Leshen, Hym e Katakan: siga as cartas deste monstro."),
      wildhunt: t("The Wild Hunt: shuffle the 4 Naglfar cards and remove one from the game. Place the other 3 face down in a pile next to the playmat and reveal the top one. Keep the Naglfar miniature on the Legendary Monster card.", "A Wild Hunt: embaralhe as 4 cartas de Naglfar e retire uma do jogo. Coloque as outras 3 viradas para baixo numa pilha ao lado do tapete e revele a do topo. Deixe a miniatura de Naglfar na carta do Monstro Lendário.")
    }[m.monster];
    phases.push({
      title: t("Monster setup", "Preparação do Monstro"),
      refs: [["legendary", 8], ...(m.monster === "wildhunt" ? [["naglfar", 6]] : [])],
      items: [
        item("lm-monster", t("Miniature, Movement deck and Life", "Miniatura, baralho de Movimento e Vida"), [
          t("Place the Monster miniature next to the playmat.", "Coloque a miniatura do Monstro ao lado do tapete."),
          t("Prepare the Monster Movement deck with the cards for your player count (following the icons in their corner), shuffle it and place it next to the playmat.", "Monte o baralho de Movimento do Monstro com as cartas do seu número de jogadores (pelos ícones no canto), embaralhe e coloque-o ao lado do tapete."),
          t(`Set the Monster’s Life Points on the counter to ${MONSTER_LIFE[m.players]} (1 player 30, 2 players 60, 3 players 85, 4 players 110, 5 players 130).`, `Marque a Vida do Monstro no contador em ${MONSTER_LIFE[m.players]} (1 jogador 30, 2 jogadores 60, 3 jogadores 85, 4 jogadores 110, 5 jogadores 130).`)
        ]),
        item("lm-specific", t("Monster-specific setup", "Preparação específica do Monstro"), [specific, t("Keep the Monster die nearby.", "Deixe o dado do Monstro por perto.")])
      ]
    });
    if (m.monster === "wildhunt") {
      phases[phases.length - 1].items[1].lines.push(interpretation(t("the Naglfar rulebook does not say where the miniature waits; it says the player who defends successfully “returns its miniature to the Legendary Monster card”, so it starts there.", "o manual de Naglfar não diz onde a miniatura fica; ele diz que o jogador que se defende “devolve a miniatura à carta do Monstro Lendário”, então ela começa lá.")));
    }
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
          <div class="setup-phase-references">${phase.grain ? taleRefs("grain") : phase.refs.map(([book, page]) => ref(book, page)).join("")}</div>
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
    const lead = m.isTale
      ? t("The core setup steps, filtered for this match, with the Tale, solo and module changes folded in.", "Os passos de preparação da caixa base, filtrados para esta partida, já com as mudanças do Conto, do solo e dos módulos.")
      : m.isWH
        ? t("The Wild Hunt follows the regular setup with the changes below.", "A Wild Hunt segue a preparação normal com as mudanças abaixo.")
        : t("Legendary Monsters follows the regular setup with the changes below.", "Legendary Monsters segue a preparação normal com as mudanças abaixo.");
    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), index, refs("core", 8, 9, 10))}
      <p class="section-lead">${lead}</p>
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
      <div class="setup-phases">${phaseMarkup}</div>
      <p class="source-note">${m.isLM
        ? t("Then prepare the Trail cards for the first Chapter (see “Each Chapter”) and start the first Turn.", "Depois prepare as cartas de Trilha do primeiro Capítulo (veja “Cada Capítulo”) e comece o primeiro Turno.")
        : t("Then turn over the first Tale card (the introduction), read it and any special rules of the Tale, and turn the next card as you would turn a page.", "Depois vire a primeira carta de Conto (a introdução), leia-a e as regras especiais do Conto, e vire a próxima carta como quem vira uma página.")} ${m.isLM ? ref("legendary", 10) : ref("core", 11)}</p>`;
  }

  // --- Turn ----------------------------------------------------------------------

  function draftingBlock(m) {
    const lines = [
      t("Players draft in Initiative order, from top to bottom.", "Os jogadores escolhem na ordem de Iniciativa, de cima para baixo."),
      t("If this is not the first Turn of the game, discard the topmost pair of Action cards onto the face-up discard pile next to the Main deck. Then move the remaining pairs up to fill the topmost spots and reveal new cards to refill the available spots.", "Se não for o primeiro Turno da partida, descarte o par de cartas de Ação mais alto na pilha de descarte virada para cima ao lado do baralho principal. Depois suba os pares restantes para os espaços de cima e revele cartas novas para repor os espaços disponíveis."),
      t("The player on the topmost Initiative spot moves their standee to any available space and takes the 2 cards there into their hand; then the next player, and so on.", "Quem está no espaço mais alto da Iniciativa move seu marcador para qualquer espaço disponível e pega as 2 cartas dele para a mão; depois o próximo, e assim por diante."),
      t("The topmost spot is the Main deck’s own spot, above the face-up pairs (it holds no face-up cards). It can be chosen by several players: each one places their standee below those already there and draws 2 cards from the top of the Main deck. Every other spot holds 2 face-up cards and can be chosen by only one player.", "O espaço mais alto é o próprio espaço do baralho principal, acima dos pares virados (não tem cartas viradas). Vários jogadores podem escolhê-lo: cada um coloca o marcador abaixo dos que já estão lá e compra 2 cartas do topo do baralho principal. Os demais espaços têm 2 cartas viradas para cima e só um jogador pode escolher cada um."),
      t("If the Main deck runs out at any time, shuffle the entire discard pile to form a new Main deck.", "Se o baralho principal acabar a qualquer momento, embaralhe toda a pilha de descarte para formar um novo baralho principal.")
    ];
    if (m.isTale && m.tale === "grain") {
      lines.push(t("Bottom spot: there is no Extra Experience token in A Grain of Truth — see Nivellen below.", "Espaço de baixo: não há ficha de Experiência Extra em A Grain of Truth — veja Nivellen abaixo."));
    } else if (m.isTale && m.tale === "lesser") {
      lines.push(t("Bottom spot: The Lesser Evil replaces the Extra Experience token with Alliance tokens — see the Tale rules.", "Espaço de baixo: The Lesser Evil troca a ficha de Experiência Extra por fichas de Aliança — veja as regras do Conto."));
    } else {
      lines.push(t("The bottom spot has a bonus: the player who places their standee there immediately gains 1 Experience Point.", "O espaço de baixo tem um bônus: quem coloca o marcador ali ganha imediatamente 1 Ponto de Experiência."));
    }
    if (m.companion !== "none") {
      lines.push(t(`${COMPANIONS[m.companion]}: when you choose the spot next to the Companion card, before drafting cards you may use its ability instead of the usual Tale effect of that spot (typically the extra Experience Point).`, `${COMPANIONS[m.companion]}: ao escolher o espaço ao lado da carta de Companheiro, antes de pegar as cartas você pode usar a habilidade dele em vez do efeito normal do Conto naquele espaço (normalmente o Ponto de Experiência extra).`));
    }
    if (m.lmCompanion !== "none") {
      lines.push(t(`${m.lmCompanion === "lambert" ? "Lambert" : "Eskel"}: when you choose the spot next to his card, before drafting cards you may use his ability instead of gaining the Extra Experience Point.`, `${m.lmCompanion === "lambert" ? "Lambert" : "Eskel"}: ao escolher o espaço ao lado da carta dele, antes de pegar as cartas você pode usar a habilidade dele em vez de ganhar o Ponto de Experiência Extra.`));
    }
    if (m.isLM) {
      lines.push(t("<strong>After each player drafts, the Monster activates</strong> (see Monster below).", "<strong>Depois de cada jogador escolher, o Monstro ativa</strong> (veja Monstro abaixo)."));
    }
    if (m.villain === "vilgefortz" || m.villain === "bonhart") {
      lines.push(t(`${VILLAINS[m.villain]}: whenever a Villain card is drawn, set it aside face up next to the playmat and keep drawing.`, `${VILLAINS[m.villain]}: sempre que uma carta de Vilão for comprada, separe-a virada para cima ao lado do tapete e continue comprando.`));
    }
    lines.push(t("After all players have drafted, move the standees back to the Initiative track, keeping their new order. Then go to Playing cards.", "Depois que todos escolherem, volte os marcadores para a trilha de Iniciativa, mantendo a nova ordem. Então vá para Jogar cartas."));
    return lines;
  }

  function playingLines() {
    return [
      t("Each player chooses 2 Action cards from their hand and holds them face down, keeping their order, until everyone is ready.", "Cada jogador escolhe 2 cartas de Ação da mão e as segura viradas para baixo, mantendo a ordem, até todos estarem prontos."),
      t("Everyone reveals simultaneously and adds the 2 cards to their Timeline.", "Todos revelam ao mesmo tempo e colocam as 2 cartas na Linha do Tempo."),
      t("Resolve the effects of the 2 cards just added one by one, starting with the left one.", "Resolva os efeitos das 2 cartas recém-colocadas uma de cada vez, começando pela da esquerda."),
      t("Symbols you gain become tokens placed on the left side of your Timeline: your Token pool.", "Os Símbolos ganhos viram fichas colocadas à esquerda da sua Linha do Tempo: sua reserva de fichas (Token pool)."),
      t("An effect counts the Symbols in your Token pool, all cards played earlier in your Timeline, and the card it is on.", "Um efeito considera os Símbolos da sua reserva de fichas, todas as cartas jogadas antes na Linha do Tempo e a própria carta."),
      t("If you can resolve an effect, you must, to the maximum extent possible; you cannot forfeit it. Most effects are single use; a 1-3 multiple effect gives a result depending on the level its condition is met (up to 3 times).", "Se puder resolver um efeito, você deve, o máximo possível; não pode abrir mão. A maioria dos efeitos é de uso único; um efeito múltiplo 1-3 dá um resultado conforme o nível em que a condição é cumprida (até 3 vezes)."),
      t("When all effects are resolved, go to the next Step.", "Quando todos os efeitos estiverem resolvidos, vá para a próxima Etapa.")
    ];
  }

  function destinyLines(m) {
    if (m.isLM) {
      return [t("Put the next Destiny token on the Legendary Monster card to mark the end of the Turn. When the 3rd Destiny token is placed on the card, the Chapter ends.", "Coloque a próxima ficha de Destino na carta do Monstro Lendário para marcar o fim do Turno. Quando a 3ª ficha for colocada na carta, o Capítulo termina.")];
    }
    if (m.isWH) {
      return [t("The Destiny token with the current Turn number goes on the Active Symbol the Wild Hunt player has more of (on cards in their Timeline and in their Token pool). The Heroes’ Symbols do not count. If the Wild Hunt has a tie, set the token aside.", "A ficha de Destino com o número do Turno atual vai para o Símbolo Ativo que o jogador da Wild Hunt tem mais (nas cartas da Linha do Tempo e na reserva de fichas). Os Símbolos dos Heróis não contam. Se a Wild Hunt empatar, deixe a ficha de lado.")];
    }
    if (m.solo) {
      return [
        t("After you play your cards, flip the Solo Mode Destiny token in the air: the result shows which Active Symbol is added to the Automa’s Token pool.", "Depois de jogar suas cartas, lance para o alto a ficha de Destino do Modo Solo: o resultado mostra qual Símbolo Ativo entra na reserva de fichas do Automa."),
        t("The Destiny token for the Turn goes on the Active Symbol the Automa has more of. If the Automa’s Active Symbols are tied, set the Destiny token aside.", "A ficha de Destino do Turno vai para o Símbolo Ativo que o Automa tem mais. Se os Símbolos Ativos do Automa empatarem, deixe a ficha de lado.")
      ];
    }
    const lines = [
      t("Each player counts the Active Symbols on the cards in their Timeline and in their Token pool and announces which of the two they have more of — or a tie, if equal.", "Cada jogador conta os Símbolos Ativos nas cartas da Linha do Tempo e na reserva de fichas e anuncia de qual dos dois tem mais — ou empate, se forem iguais."),
      t("The Destiny token with the current Turn number goes on the Tale card (Path) of the Symbol that the majority of players announced.", "A ficha de Destino com o número do Turno atual vai na carta de Conto (Caminho) do Símbolo que a maioria dos jogadores anunciou."),
      t("If there is a tie among the players, do not place the Destiny token this Turn: put it aside until the next Chapter begins. A token set aside counts for neither Symbol when the Dominating Symbol is decided.", "Se houver empate entre os jogadores, não coloque a ficha de Destino neste Turno: deixe-a de lado até começar o próximo Capítulo. Uma ficha deixada de lado não conta para nenhum Símbolo ao definir o Símbolo Dominante."),
      t("Rulebook example: one player has more Left, one has more Right and one is tied — the token is set aside.", "Exemplo do manual: um jogador tem mais Esquerda, outro mais Direita e um está empatado — a ficha fica de lado."),
      m.players >= 3 ? interpretation(t("the rulebook does not say whether players who announce a tie count when deciding the majority (for example 2 Left, 1 Right and 2 tied with 5 players). This guide reads “majority” as more players for one Symbol than for the other, ignoring tied players, so that example goes to the Left Path; agree on this before the game.", "o manual não diz se quem anuncia empate conta para definir a maioria (por exemplo 2 Esquerda, 1 Direita e 2 empatados com 5 jogadores). Este guia lê “maioria” como mais jogadores num Símbolo do que no outro, ignorando os empatados, então esse exemplo vai para o Caminho da Esquerda; combinem isso antes da partida.")) : ""
    ];
    if (m.players === 2) {
      lines.push(t("<strong>2-player exception:</strong> only for this Step, the Action cards still left on the playmat act as a 3rd player. Count all the Symbols on those cards (ignoring effects) to see which Active Symbol they have more of; if they show equal numbers, the cards announce a tie like a player. Example: Player 1 has 1 Left and 2 Right, Player 2 has 3 Left and 0 Right, the face-up cards show 0 Left and 1 Right — place the Destiny token on the Right Path.", "<strong>Exceção de 2 jogadores:</strong> só nesta Etapa, as cartas de Ação que sobraram no tapete agem como um 3º jogador. Conte todos os Símbolos dessas cartas (ignorando efeitos) para ver de qual Símbolo Ativo elas têm mais; se mostrarem quantidades iguais, as cartas anunciam empate como um jogador. Exemplo: o Jogador 1 tem 1 Esquerda e 2 Direita, o Jogador 2 tem 3 Esquerda e 0 Direita, as cartas viradas mostram 0 Esquerda e 1 Direita — coloque a ficha de Destino no Caminho da Direita."));
    }
    return lines;
  }

  function afterPlayingSteps(m) {
    const extra = [];
    if (m.isTale) {
      if (m.tale === "edge" && !m.firstPlay) {
        extra.push(t("Extra Effort check (The Edge of the World)", "Conferir Extra Effort (The Edge of the World)"));
      }
      if (m.tale === "striga") {
        extra.push(t("Requirement cards check (Striga)", "Conferir cartas de Requisito (Striga)"));
      }
      if (m.tale === "skellige") {
        extra.push(t("Investigation Step (Skellige)", "Etapa de Investigação (Skellige)"));
      }
      if (m.tale === "doppler") {
        extra.push(t("Hint card peek, once per Chapter (Doppler)", "Espiar a carta de Dica, uma vez por Capítulo (Doppler)"));
      }
      if (m.tale === "dragon") {
        extra.push(t("Golden Dragon Step: move the Dragon, then protect it", "Etapa do Dragão Dourado: mover o Dragão e depois protegê-lo"));
      }
      if (m.tale === "wish") {
        extra.push(t("Draw the +2 Seal and move on the Djinn track (The Last Wish)", "Comprar o Selo +2 e andar na trilha do Djinn (The Last Wish)"));
      }
      if (m.villain === "vilgefortz" || m.villain === "bonhart") {
        extra.push(t("Villain ability, then check for defeating Villains", "Habilidade do Vilão e depois conferir derrota de Vilões"));
      }
    }
    if (m.isWH) {
      extra.push(t("The Wild Hunt Step: Strategic Withdrawal, then Advancement", "Etapa da Wild Hunt: Retirada Estratégica e depois Avanço"));
    }
    if (m.isLM && m.monster === "wildhunt") {
      extra.push(t("The player with Naglfar checks their last 2 cards", "Quem está com Naglfar confere suas 2 últimas cartas"));
    }
    return extra;
  }

  function turnSection(index) {
    const m = match();
    const extra = afterPlayingSteps(m);
    const order = steps([
      t("<strong>Drafting cards</strong>", "<strong>Escolher cartas</strong>") + (m.isTale && m.tale === "wish" ? t(" (draw the +1 Seal first)", " (antes, compre o Selo +1)") : "") + (m.isTale && m.tale === "skellige" ? t(" (reveal the new Investigation card first)", " (antes, revele a nova carta de Investigação)") : ""),
      t("<strong>Playing cards</strong>", "<strong>Jogar cartas</strong>"),
      ...extra.map((text) => `<em>${text}</em>`),
      t("<strong>Placing the Destiny token</strong>", "<strong>Colocar a ficha de Destino</strong>")
    ]);
    return `
      ${sectionHeading("turn", t("A Turn", "Um Turno"), index, refs("core", 14, 15, 16, 17))}
      <p class="section-lead">${t("Each Chapter has 3 Turns. Each Turn has 3 Steps; some Tales and modules add Steps or modify them, as shown in italics.", "Cada Capítulo tem 3 Turnos. Cada Turno tem 3 Etapas; alguns Contos e módulos acrescentam ou alteram Etapas, como mostrado em itálico.")}</p>
      ${order}
      ${block(t("1 · Drafting cards", "1 · Escolher cartas"), list(draftingBlock(m)), `${ref("core", 14)}${m.isLM ? ` ${ref("legendary", 11)}` : ""}`)}
      ${block(t("2 · Playing cards", "2 · Jogar cartas"), list(playingLines()) + (m.isLM ? note(t("Legendary Monsters makes no changes to this Step.", "Legendary Monsters não muda nada nesta Etapa.")) : ""), refs("core", 15, 28))}
      ${block(t("3 · Placing the Destiny token", "3 · Colocar a ficha de Destino"), list(destinyLines(m)), m.isLM ? ref("legendary", 13) : m.isWH ? ref("wildhunt", 9) : m.solo ? ref("core", 21) : refs("core", 16, 17))}
      ${m.isTale && !m.solo && m.tale !== "grain" ? `<div class="turn-block"><h3>${t("Destiny examples from the rulebook", "Exemplos de Destino do manual")}</h3>${list([
        t("Player 1 has 3 Left and 0 Right (Left majority); players 2 and 3 each have 1 Left and 2 Right (Right majority). Two players have a Right majority: the token goes on the Right Path.", "Jogador 1 tem 3 da Esquerda e 0 da Direita (maioria Esquerda); jogadores 2 e 3 têm 1 da Esquerda e 2 da Direita (maioria Direita). Dois jogadores têm maioria Direita: a ficha vai no Caminho da Direita."),
        t("4 players: players 1 and 4 have a Right majority, players 2 and 3 a Left majority. Tie among players: the token is set aside.", "4 jogadores: jogadores 1 e 4 têm maioria Direita, jogadores 2 e 3 maioria Esquerda. Empate entre jogadores: a ficha fica de lado."),
        t("Player 1 has 4 Left and 5 Right, player 2 has 4 and 4 (a tie), player 3 has 6 Left and 2 Right. One vote each way: the token is set aside.", "Jogador 1 tem 4 da Esquerda e 5 da Direita, jogador 2 tem 4 e 4 (empate), jogador 3 tem 6 da Esquerda e 2 da Direita. Um voto para cada lado: a ficha fica de lado."),
        m.players === 2 ? t("2 players: player 1 has 1 Left and 2 Right, player 2 has 3 Left and 0 Right, the face-up cards on the playmat show 0 Left and 1 Right. Two of three votes are Right: the token goes on the Right Path.", "2 jogadores: jogador 1 tem 1 da Esquerda e 2 da Direita, jogador 2 tem 3 da Esquerda e 0 da Direita, as cartas viradas no tapete mostram 0 da Esquerda e 1 da Direita. Dois de três votos são Direita: a ficha vai no Caminho da Direita.") : ""
      ])}<p class="wpd-refs">${refs("core", 16, 17)}</p></div>` : ""}
      ${abilitiesBlock(m)}`;
  }

  function abilitiesBlock(m) {
    return block(t("Using Abilities", "Usar Habilidades"), list([
      t("You start with your first Ability (the leftmost) available. Reaching or passing a new Ability spot on your Experience track unlocks the next one: place an Ability token on it, active side up.", "Você começa com a primeira Habilidade (a da esquerda) disponível. Alcançar ou passar o espaço de uma nova Habilidade na trilha de Experiência libera a próxima: coloque uma ficha de Habilidade nela, com o lado ativo para cima."),
      t("Each Ability can be used only once per game; its description says when. After using it, turn its token to the non-active side.", "Cada Habilidade só pode ser usada uma vez por partida; a descrição diz quando. Depois de usar, vire a ficha para o lado inativo."),
      t("If several players want to use Abilities at the same time, they do so simultaneously. If an order is needed, follow the Initiative track.", "Se vários jogadores quiserem usar Habilidades ao mesmo tempo, usam simultaneamente. Se for preciso uma ordem, siga a trilha de Iniciativa."),
      m.characters.includes("Yarpen") ? t("Yarpen uses his Abilities before all other players, and Letho after all other players, ignoring the Initiative order.", "Yarpen usa suas Habilidades antes de todos os outros jogadores, e Letho depois de todos, ignorando a ordem de Iniciativa.") : ""
    ]), `${refs("core", 12, 13)}${m.ownStretch ? ` ${refs("stretch", 9, 10)}` : ""}`);
  }

  // --- Mode-specific steps ---------------------------------------------------------

  function wildHuntStepSection(index) {
    const m = match();
    if (!m.isWH) {
      return "";
    }
    const thresholds = { 1: 2, 2: 3, 3: 4, 4: 5 }[m.heroes];
    return `
      ${sectionHeading("wh-step", t("The Wild Hunt Step", "A Etapa da Wild Hunt"), index, refs("wildhunt", 8, 9))}
      <p class="section-lead">${t("Heroes and the Wild Hunt draft and play cards with the regular rules; the Wild Hunt drafts in Initiative order like any player. After the Playing cards Step, play this additional Step: the Heroes try to push a General back, then the Wild Hunt advances its Generals.", "Heróis e Wild Hunt escolhem e jogam cartas pelas regras normais; a Wild Hunt escolhe na ordem de Iniciativa como qualquer jogador. Depois da Etapa de Jogar cartas, jogue esta Etapa adicional: os Heróis tentam empurrar um General de volta, depois a Wild Hunt faz avançar seus Generais.")}</p>
      ${block(t("Strategic Withdrawal", "Retirada Estratégica"), list([
        t(`With ${m.heroes} Hero${m.heroes > 1 ? "es" : ""}, if the Heroes together have <strong>${thresholds}</strong> or more cards of the same color among the last 2 cards of their Timelines, they Defeat the General of that color (1/2/3/4 Heroes need 2/3/4/5 cards).`, `Com ${m.heroes} Herói${m.heroes > 1 ? "s" : ""}, se os Heróis juntos tiverem <strong>${thresholds}</strong> ou mais cartas da mesma cor entre as 2 últimas cartas das suas Linhas do Tempo, eles Derrotam o General daquela cor (1/2/3/4 Heróis precisam de 2/3/4/5 cartas).`),
        t("Colors: Imlerith red, Eredin green, Nithral blue, Caranthir yellow. A multicolor card has all of its colors.", "Cores: Imlerith vermelho, Eredin verde, Nithral azul, Caranthir amarelo. Uma carta multicolorida tem todas as suas cores."),
        t("Heroes may Defeat only 1 General per Wild Hunt Step; if they would Defeat more, they choose 1.", "Os Heróis só podem Derrotar 1 General por Etapa da Wild Hunt; se fossem derrotar mais, escolhem 1."),
        t("Defeating a General: move him back to the starting space of his Threat track (he stays if already there), and draw a Weakness card from his pile, placing it face up next to the playmat.", "Derrotar um General: mova-o de volta ao espaço inicial da trilha de Ameaça (ele fica se já estiver lá) e compre uma carta de Fraqueza da pilha dele, colocando-a virada para cima ao lado do tapete."),
        t("Later in the game, the Heroes may decide together to put a face-up Weakness card at the bottom of its General’s Weakness pile to use its once-per-game effect.", "Mais tarde, os Heróis podem decidir juntos colocar uma carta de Fraqueza virada para cima no fundo da pilha de Fraquezas do General dela para usar o efeito de uma vez por partida."),
        t(`Example: 3 Heroes have 4 red cards in total as the last 2 cards of their Timelines: Imlerith is Defeated.`, `Exemplo: 3 Heróis têm 4 cartas vermelhas no total entre as 2 últimas cartas das Linhas do Tempo: Imlerith é Derrotado.`),
        m.naglfar ? t("<strong>Naglfar:</strong> before Defeating a General, check whether Naglfar protects him (see Naglfar below).", "<strong>Naglfar:</strong> antes de Derrotar um General, confira se Naglfar o protege (veja Naglfar abaixo).") : ""
      ]), ref("wildhunt", 8))}
      ${block(t("Advancement", "Avanço"), list([
        t(`The Wild Hunt checks the color of the last 2 cards of its Timeline and moves the matching General 1 space up his Threat track for each matching card. Resolve each movement separately.`, `A Wild Hunt confere a cor das 2 últimas cartas da sua Linha do Tempo e move o General correspondente 1 espaço para cima na trilha de Ameaça para cada carta correspondente. Resolva cada movimento separadamente.`),
        t("If a multicolor card was played, the Wild Hunt chooses 1 General of only 1 of its colors to move.", "Se uma carta multicolorida foi jogada, a Wild Hunt escolhe 1 General de apenas 1 das cores dela para mover."),
        t(`Bonuses during the movement: a silver space gives the Wild Hunt 2 Experience ${icon("experience")}; a space with a red banner gives it 1 Victory Point ${icon("victory-point")}.`, `Bônus durante o movimento: um espaço prateado dá 2 de Experiência ${icon("experience")} à Wild Hunt; um espaço com estandarte vermelho dá 1 Ponto de Vitória ${icon("victory-point")}.`),
        t("Dire Threat spaces (dark): while the General remains on one, the passive ability of his Trait card is in effect.", "Espaços de Ameaça Grave (escuros): enquanto o General estiver num deles, a habilidade passiva da carta de Traço dele vale."),
        t("The Banner: if a General would move but is already on the highest space of his Threat track, he does not move and the Wild Hunt gains 1 Victory Point.", "O Estandarte: se um General fosse se mover mas já está no espaço mais alto da trilha, ele não se move e a Wild Hunt ganha 1 Ponto de Vitória."),
        t("Examples: Eredin moves onto a silver Dire Threat space — the Wild Hunt gains 2 Experience and Eredin’s Trait is now in effect. The Wild Hunt uses a multicolor card as yellow and moves Caranthir twice: it gains 1 Victory Point from the last space and 1 more from the Banner.", "Exemplos: Eredin vai para um espaço prateado de Ameaça Grave — a Wild Hunt ganha 2 de Experiência e o Traço de Eredin passa a valer. A Wild Hunt usa uma carta multicolorida como amarela e move Caranthir duas vezes: ganha 1 Ponto de Vitória pelo último espaço e mais 1 pelo Estandarte."),
        m.solo ? interpretation(t("the Wild Hunt rulebook does not say how the Automa chooses a color for a multicolor card; check the Wild Hunt Automa board, or decide it yourself.", "o manual da Wild Hunt não diz como o Automa escolhe a cor de uma carta multicolorida; confira o tabuleiro de Automa da Wild Hunt ou decida você mesmo.")) : ""
      ]), ref("wildhunt", 9))}
      ${block(t("Placing the Destiny token", "Colocar a ficha de Destino"), list(destinyLines(m)), ref("wildhunt", 9))}
      ${block(t("Dandelion in the Wild Hunt", "Dandelion na Wild Hunt"), para(t("When Dandelion activates his 3rd Ability, only the Wild Hunt is affected by its “each other Player” part.", "Quando Dandelion ativa a 3ª Habilidade, só a Wild Hunt é afetada pela parte “cada outro Jogador”.")), ref("wildhunt", 8))}
      ${m.naglfar ? naglfarWildHuntBlock() : ""}`;
  }

  function naglfarWildHuntBlock() {
    return block(t("Naglfar", "Naglfar"), list([
      t("Naglfar moves between the Threat tracks and sits on the banner above one of them. While Naglfar is on a Threat track, it protects that General: the Heroes cannot Defeat him (cannot move him down or draw his Weakness card), and the Wild Hunt cannot gain the Victory Point from that track’s Banner bonus.", "Naglfar se move entre as trilhas de Ameaça e fica no estandarte acima de uma delas. Enquanto estiver numa trilha, protege aquele General: os Heróis não podem Derrotá-lo (nem movê-lo para baixo nem comprar a Fraqueza dele), e a Wild Hunt não ganha o Ponto de Vitória do bônus do Estandarte daquela trilha."),
      t("Strategic Withdrawal: if the General the Heroes would Defeat is protected, he is not Defeated (stays on the same space). Instead, the Heroes draw the topmost Broken Sextant card and resolve one of its effects: discard it for its immediate effect, or keep it in play for its permanent effect.", "Retirada Estratégica: se o General que os Heróis derrotariam estiver protegido, ele não é Derrotado (fica no mesmo espaço). Em vez disso, os Heróis compram a carta Broken Sextant do topo e resolvem um dos efeitos: descartá-la pelo efeito imediato, ou mantê-la em jogo pelo efeito permanente."),
      t("After the last Broken Sextant card is drawn and resolved, remove the Naglfar miniature from the game and ignore any rules referring to it. Permanent Broken Sextant effects stay in play.", "Depois que a última carta Broken Sextant for comprada e resolvida, retire a miniatura de Naglfar do jogo e ignore as regras que falam dela. Os efeitos permanentes de Broken Sextant continuam valendo."),
      t("Advancement: after the General’s movement and all its effects, the Wild Hunt moves Naglfar. It checks the color of the last card in its Timeline and places Naglfar on the banner above the topmost space of that color’s Threat track. If that card is multicolor, the Wild Hunt chooses one of its colors (it may differ from the one chosen to move a General); choosing the track Naglfar is already on means it does not move.", "Avanço: depois do movimento do General e todos os efeitos, a Wild Hunt move Naglfar. Ela confere a cor da última carta da Linha do Tempo e coloca Naglfar no estandarte acima do espaço mais alto da trilha daquela cor. Se a carta for multicolorida, a Wild Hunt escolhe uma das cores (pode ser diferente da usada para mover um General); escolher a trilha onde Naglfar já está significa que ele não se move."),
      t("Example: Imlerith is protected and would give no Victory Point for advancing further. With a red/green multicolor card last, the Wild Hunt keeps Naglfar on red, moves Imlerith 1 space and uses the multicolor card as green to move Eredin 1 space, gaining 2 Experience from Threat track bonuses.", "Exemplo: Imlerith está protegido e não daria Ponto de Vitória ao avançar mais. Com uma carta multicolorida vermelha/verde por último, a Wild Hunt mantém Naglfar no vermelho, move Imlerith 1 espaço e usa a multicolorida como verde para mover Eredin 1 espaço, ganhando 2 de Experiência pelos bônus das trilhas."),
      t("Naglfar starts next to the Generals playmat; it first goes onto a Threat track in the first Advancement.", "Naglfar começa ao lado do tapete dos Generais; vai para uma trilha de Ameaça no primeiro Avanço."),
      interpretation(t("the start position is read from the setup (“next to the Generals playmat”) and the Advancement rule; the rulebook does not say it explicitly.", "a posição inicial vem da preparação (“ao lado do tapete dos Generais”) e da regra de Avanço; o manual não a diz explicitamente."))
    ]), refs("naglfar", 3, 4, 5));
  }

  function monsterSection(index) {
    const m = match();
    if (!m.isLM) {
      return "";
    }
    return `
      ${sectionHeading("monster", t("The Legendary Monster", "O Monstro Lendário"), index, refs("legendary", 9, 11, 12))}
      ${block(t("Monster card", "Carta do Monstro"), list([
        t("Each Monster card side is for a number of players and shows the Monster’s name, its Abilities (its own rules and passive ability) and 4 attacks — one for each card color — each with the number of cards of that color needed in the Attack pool and the attack effect.", "Cada lado da carta do Monstro é para um número de jogadores e mostra o nome, as Habilidades (regras próprias e habilidade passiva) e 4 ataques — um para cada cor de carta — cada um com o número de cartas daquela cor necessárias no grupo de Ataque e o efeito do ataque."),
        t("Its other card shows the art and, only for Katakan, the Power level track. Both Left and Right Path Symbols are Fight.", "A outra carta mostra a arte e, só no caso de Katakan, a trilha de nível de Poder. Os Símbolos do Caminho da Esquerda e da Direita são ambos Luta.")
      ]), ref("legendary", 9))}
      ${block(t("Monster activation (after each player drafts)", "Ativação do Monstro (depois de cada jogador escolher)"), list([
        t("Draw and reveal the top card of the Monster Movement deck.", "Compre e revele a carta do topo do baralho de Movimento do Monstro."),
        t("<strong>Move:</strong> place the card and the Monster miniature next to the spot shown, and resolve the Monster’s Ability. If no player occupied that spot, the Monster drafts the pair of cards next to it and adds them to its Attack pool. If a player occupied it, the Monster drafts no cards, but resolves its Ability described on its card.", "<strong>Mover:</strong> coloque a carta e a miniatura do Monstro ao lado do espaço indicado e resolva a Habilidade do Monstro. Se nenhum jogador ocupava o espaço, o Monstro pega o par de cartas dele e o coloca no grupo de Ataque. Se um jogador o ocupava, o Monstro não pega cartas, mas resolve a Habilidade descrita na carta dele."),
        t("<strong>Focus:</strong> place the card next to the Main deck and do not move the Monster. It draws 1 card from the Main deck and adds it to its Attack pool.", "<strong>Foco:</strong> coloque a carta ao lado do baralho principal e não mova o Monstro. Ele compra 1 carta do baralho principal e a coloca no grupo de Ataque."),
        t("Reshuffle the Monster Movement deck after its last card is drawn and resolved.", "Reembaralhe o baralho de Movimento do Monstro depois que a última carta for comprada e resolvida."),
        m.monster === "wildhunt" ? t("<strong>The Wild Hunt:</strong> when it activates and moves to an occupied spot, the player there puts the Naglfar miniature on their board — they are followed by the Phantom Riders. The Wild Hunt Monster card also makes that player suffer 1 Wound.", "<strong>A Wild Hunt:</strong> quando ela ativa e vai para um espaço ocupado, o jogador ali coloca a miniatura de Naglfar no tabuleiro — ele está sendo seguido pelos Cavaleiros Fantasmas. A carta de Monstro da Wild Hunt também faz esse jogador sofrer 1 Ferimento.") : ""
      ]), `${ref("legendary", 11)}${m.monster === "wildhunt" ? ` ${ref("naglfar", 6)}` : ""}`)}
      ${block(t("Monster attacks", "Ataques do Monstro"), list([
        t("Whenever the Attack pool holds as many cards of one color as the Monster card shows for that color, the Legendary Monster attacks.", "Sempre que o grupo de Ataque tiver tantas cartas de uma cor quanto a carta do Monstro mostra para aquela cor, o Monstro Lendário ataca."),
        t("Discard the shown number of cards of that color from the Monster board, discarding multicolor ones last, and apply the attack’s effect.", "Descarte o número indicado de cartas daquela cor do tabuleiro do Monstro, descartando as multicoloridas por último, e aplique o efeito do ataque."),
        t("If several attacks trigger at the same time, resolve them from top to bottom.", "Se vários ataques dispararem ao mesmo tempo, resolva-os de cima para baixo.")
      ]), ref("legendary", 12))}
      ${block(t("Wounds and the Monster die", "Ferimentos e o dado do Monstro"), list([
        t("Whenever you suffer a Wound, flip one of your Health Point tokens to its wounded side. When any player loses their last Health Point, the game is immediately lost.", "Sempre que você sofre um Ferimento, vire uma das suas fichas de Ponto de Saúde para o lado ferido. Quando qualquer jogador perde o último Ponto de Saúde, a partida está perdida na hora."),
        t("Monster die faces: lose a Fight Symbol; lose any 2 Symbols; suffer a Wound (3 faces); discard any card from your Timeline.", "Faces do dado do Monstro: perca um Símbolo de Luta; perca 2 Símbolos quaisquer; sofra um Ferimento (3 faces); descarte qualquer carta da sua Linha do Tempo."),
        t("If you cannot apply the result in full, you suffer a Wound instead.", "Se não puder aplicar o resultado por completo, você sofre um Ferimento no lugar.")
      ]), ref("legendary", 12))}
      ${block(t("Runestone cards", "Cartas Runestone"), list([
        t("Players may freely discuss whether and when to use each Runestone card. If most of the players agree, resolve the chosen card and discard it to the box.", "Os jogadores podem discutir livremente se e quando usar cada carta Runestone. Se a maioria concordar, resolva a carta escolhida e descarte-a na caixa."),
        t("Examples printed in the rulebook: at any moment, 2 players exchange 1 card from their hands; at any moment, 1 player loses up to 5 Symbols of one type and gains as many Fight Symbols; at any moment, rearrange the Characters on the Initiative track; immediately after a Monster Movement card is drawn, ignore it entirely (do not draw another).", "Exemplos impressos no manual: a qualquer momento, 2 jogadores trocam 1 carta da mão; a qualquer momento, 1 jogador perde até 5 Símbolos de um tipo e ganha o mesmo número de Símbolos de Luta; a qualquer momento, reorganize os Personagens na trilha de Iniciativa; logo depois de comprar uma carta de Movimento do Monstro, ignore-a por completo (não compre outra).")
      ]), ref("legendary", 12))}
      ${m.monster === "wildhunt" ? block(t("Naglfar against the Wild Hunt monster", "Naglfar contra o monstro Wild Hunt"), list([
        t("After the Playing cards Step, the player with Naglfar on their board checks the last 2 cards of their Timeline.", "Depois da Etapa de Jogar cartas, o jogador com Naglfar no tabuleiro confere as 2 últimas cartas da Linha do Tempo."),
        t("If their colors match the ones shown on the revealed Naglfar card, the player defends successfully and returns the miniature to the Legendary Monster card. If not, they resolve the effect of the Naglfar card.", "Se as cores corresponderem às mostradas na carta de Naglfar revelada, o jogador se defende e devolve a miniatura à carta do Monstro Lendário. Se não, ele resolve o efeito da carta de Naglfar."),
        t("At the end of each Chapter, discard the revealed Naglfar card to the box and reveal the next card from the pile.", "No fim de cada Capítulo, descarte na caixa a carta de Naglfar revelada e revele a próxima da pilha.")
      ]), refs("naglfar", 6, 7)) : ""}
      ${m.solo ? block(t("Solo", "Solo"), list([
        t("Unlike the base game, Legendary Monsters solo has no Automa: you face the Monster alone with the regular rules.", "Ao contrário do jogo base, o solo de Legendary Monsters não tem Automa: você enfrenta o Monstro sozinho com as regras normais."),
        m.characters.includes("Yarpen") ? t("Playing as Yarpen, his 1st and 3rd Abilities trigger as they would against opponents with no Symbols — but you still need at least 1 Symbol.", "Jogando com Yarpen, a 1ª e a 3ª Habilidades disparam como se os oponentes não tivessem Símbolos — mas você ainda precisa ter pelo menos 1 Símbolo.") : "",
        m.characters.includes("Letho") ? interpretation(t("Stretch Goals says Letho cannot be chosen “in Solo mode”, a rule written for the Automa solo. The Legendary Monsters rulebook does not repeat it. Leaving Letho out is the safe reading.", "Stretch Goals diz que Letho não pode ser escolhido “no modo Solo”, regra escrita para o solo com Automa. O manual de Legendary Monsters não a repete. Deixar Letho de fora é a leitura segura.")) : ""
      ]), ref("legendary", 14)) : ""}`;
  }

  // --- Tale special rules ---------------------------------------------------------------

  function taleRulesSection(index) {
    const m = match();
    if (!m.isTale) {
      return "";
    }
    const id = m.tale;
    let body = "";
    if (id === "edge") {
      body = m.firstPlay
        ? para(t("First play: no special Tale rules. Ignore the Extra Effort cards and Side Quests; just follow the Tale cards.", "Primeira partida: sem regras especiais do Conto. Ignore as cartas Extra Effort e as Missões Secundárias; apenas siga as cartas de Conto."))
        : block(t("Extra Effort cards", "Cartas Extra Effort"), list([
          t("After Playing cards, each player receives the bonus of the current Chapter’s Extra Effort card if the colors of the Action cards in their Timeline form the sequence it shows — but only if at least 1 of the cards played this Turn is part of the sequence.", "Depois de Jogar cartas, cada jogador recebe o bônus da carta Extra Effort do Capítulo atual se as cores das cartas de Ação na Linha do Tempo formarem a sequência mostrada — mas só se pelo menos 1 das cartas jogadas neste Turno fizer parte da sequência."),
          t("A multicolor card counts as one card of any one of its colors.", "Uma carta multicolorida conta como uma carta de qualquer uma das suas cores."),
          t("A card can complete one sequence and start another in the next Turn.", "Uma carta pode completar uma sequência e começar outra no Turno seguinte."),
          t("At the end of the Chapter, flip that Chapter’s Extra Effort card face down.", "No fim do Capítulo, vire para baixo a carta Extra Effort daquele Capítulo.")
        ]), ref("core", 23));
    }
    if (id === "striga") {
      body = `
        ${para(t("Note: the Striga story is called “The Witcher” in the book. Secret Objectives add end-game Victory Points; depending on the 3rd Chapter’s Dominating Symbol, 2 of the 4 will be revealed. During the game, players can peek at some of them.", "Nota: a história da Striga se chama “The Witcher” no livro. Os Objetivos Secretos dão Pontos de Vitória no fim; conforme o Símbolo Dominante do 3º Capítulo, 2 dos 4 são revelados. Durante a partida, os jogadores podem espiar alguns."))}
        ${block(t("After Playing cards: Requirement cards", "Depois de Jogar cartas: cartas de Requisito"), list([
          t("If you have anywhere in your Timeline 3 cards of the color a Requirement card asks for, you may peek at the Secret Objective next to it. If several players meet it, they all may look.", "Se você tiver em qualquer lugar da Linha do Tempo 3 cartas da cor pedida por uma carta de Requisito, pode espiar o Objetivo Secreto ao lado dela. Se vários jogadores cumprirem, todos podem olhar."),
          t("Gain 1 Experience Point and place your Player token on the left side of the Requirement card: from now on you may look at that Secret Objective at any time.", "Ganhe 1 Ponto de Experiência e coloque sua ficha de jogador no lado esquerdo da carta de Requisito: a partir de agora você pode olhar aquele Objetivo Secreto a qualquer momento."),
          t("Then the requirement becomes 4 cards of that color: any player who meets it places their token on the right side of the Requirement card and gains an additional 2 Experience Points.", "Depois o requisito passa a ser 4 cartas daquela cor: quem cumprir coloca a ficha no lado direito da carta de Requisito e ganha mais 2 Pontos de Experiência."),
          interpretation(t("the illustration shows 3 color boxes on the left side and 4 on the right side, each with token spaces; the text does not say whether you may take both rewards from the same card, but its wording (“additional reward”) suggests you can.", "a ilustração mostra 3 quadrados de cor no lado esquerdo e 4 no direito, cada um com espaços de ficha; o texto não diz se dá para pegar as duas recompensas da mesma carta, mas a redação (“recompensa adicional”) sugere que sim."))
        ]), refs("core", 24, 25))}
        ${block(t("End of the game: Secret Objectives", "Fim da partida: Objetivos Secretos"), list([
          t("Flip face up the 2 Secret Objective cards that match the final Dominating Symbol and score them. The other 2 stay face down and score nothing. Example: if Magic dominated, only the cards with Magic on the back (the Magic one and the Magic/Diplomacy/Exploration one) are resolved.", "Vire para cima os 2 Objetivos Secretos que correspondem ao Símbolo Dominante final e pontue-os. Os outros 2 ficam virados e não valem nada. Exemplo: se Magia dominou, só as cartas com Magia no verso (a de Magia e a de Magia/Diplomacia/Exploração) são resolvidas."),
          t("You do not need your token on a Requirement card to score its Secret Objective: tokens only let you peek during the game.", "Você não precisa ter ficha na carta de Requisito para pontuar o Objetivo Secreto: as fichas só servem para espiar durante a partida."),
          t("The top section of a Secret Objective describes the cards to collect in your Timeline or hand at the end of the 3rd Chapter. It either gives the same Victory Points to everyone who meets it, or ranks who has the most: the most scores 5, 1 Symbol or card fewer scores 3, 2 fewer scores 1. You need at least 1 shown Symbol or card to score.", "A parte de cima de um Objetivo Secreto descreve as cartas a juntar na Linha do Tempo ou na mão no fim do 3º Capítulo. Ou dá os mesmos Pontos de Vitória a todos que cumprirem, ou classifica quem tem mais: quem tem mais marca 5, 1 Símbolo ou carta a menos marca 3, 2 a menos marca 1. É preciso ter pelo menos 1 Símbolo ou carta indicados para pontuar."),
          m.solo ? t("Solo: the Solo Mode Secret Objectives replace the 6 cards with Fight and Magic backs (for example, 1 Victory Point per Left Path Symbol on cards in your hand, max. 3).", "Solo: os Objetivos Secretos do Modo Solo substituem as 6 cartas com verso de Luta e de Magia (por exemplo, 1 Ponto de Vitória por Símbolo do Caminho da Esquerda nas cartas da mão, máx. 3).") : ""
        ]), ref("core", 25))}`;
    }
    if (id === "lesser") {
      body = `
        ${para(t("In this Tale, the player with the most Dominating Symbols does not receive a reward: they suffer a penalty described on the Tale cards — their Character had the biggest influence on choosing the Evil. The player with the most Non-Dominating Symbols still receives the reward.", "Neste Conto, quem tem mais Símbolos Dominantes não recebe recompensa: sofre uma penalidade descrita nas cartas de Conto — seu Personagem foi quem mais influenciou a escolha do Mal. Quem tem mais Símbolos Não Dominantes ainda recebe a recompensa."))}
        ${block(t("Drafting: Alliance cards", "Escolha: cartas de Aliança"), list([
          t("When you pick a spot next to an Alliance token, you must also draw an Alliance card from the matching deck. The Renfri/Stregobor token lets you choose the deck.", "Ao escolher um espaço ao lado de uma ficha de Aliança, você também deve comprar uma carta de Aliança do baralho correspondente. A ficha Renfri/Stregobor deixa você escolher o baralho."),
          t("Keep your Alliance cards face down next to your Player board; you may look at them any time.", "Deixe suas cartas de Aliança viradas para baixo ao lado do tabuleiro; você pode olhá-las a qualquer momento."),
          t("You may have at most 3 Alliance cards of each side. If you ever draw a 4th, immediately discard down to 3.", "Você pode ter no máximo 3 cartas de Aliança de cada lado. Se comprar uma 4ª, descarte imediatamente até ficar com 3.")
        ]), ref("core", 26))}
        ${block(t("End of the Chapter", "Fim do Capítulo"), list([
          t("After the last Destiny token of the Chapter is placed, the Dominating Symbol also tells which side the players supported: Left Path dominating = Renfri, Right Path dominating = Stregobor.", "Depois de colocada a última ficha de Destino do Capítulo, o Símbolo Dominante também diz qual lado os jogadores apoiaram: Caminho da Esquerda dominante = Renfri, Caminho da Direita dominante = Stregobor."),
          t("All players reveal and apply the effects of all their Alliance cards of that side, then discard them. Cards of the other side stay face down for the next Chapters.", "Todos revelam e aplicam os efeitos de todas as suas cartas de Aliança daquele lado e depois as descartam. As cartas do outro lado ficam viradas para baixo para os próximos Capítulos."),
          t("Possible Alliance effects: gain 1 Experience Point; lose 1 Active Symbol to gain 2 Active Symbols of a different type; gain 1 shown Active Symbol; lose 1 Non-Active Symbol to gain 2 Experience Points.", "Efeitos possíveis de Aliança: ganhe 1 Ponto de Experiência; perca 1 Símbolo Ativo para ganhar 2 Símbolos Ativos de outro tipo; ganhe 1 Símbolo Ativo mostrado; perca 1 Símbolo Não Ativo para ganhar 2 Pontos de Experiência."),
          t("At the end of the game, discard all face-down Alliance cards without effect.", "No fim da partida, descarte todas as cartas de Aliança viradas para baixo sem efeito.")
        ]), refs("core", 26, 27))}
        ${block(t("Losing Experience Points", "Perder Pontos de Experiência"), list([
          t("Some effects in this Tale make you lose Experience: move your marker left on the track.", "Alguns efeitos deste Conto fazem você perder Experiência: mova o marcador para a esquerda na trilha."),
          t("Dropping below an Ability spot does not lose that Ability. Regaining Experience up to the spot of an Ability already used does not refresh it.", "Cair abaixo do espaço de uma Habilidade não a faz perder. Recuperar Experiência até o espaço de uma Habilidade já usada não a renova.")
        ]), ref("core", 27))}`;
    }
    if (id === "grain") {
      const det = { 1: 1, 2: 1, 3: 2, 4: 2 }[m.players];
      body = `
        ${para(t("Nivellen, a mischievous host, sits on the Initiative track and drafts like a Character; Mystery cards add challenges and scoring.", "Nivellen, um anfitrião travesso, fica na trilha de Iniciativa e escolhe cartas como um Personagem; as cartas de Mistério acrescentam desafios e pontuação."))}
        ${block(t("Drafting: Mystery cards and Nivellen", "Escolha: cartas de Mistério e Nivellen"), list([
          t("Before revealing new Action cards for the first Turn — and then at the end of each Chapter — draw 2 Mystery cards and place them face up next to the Tale cards, one on each side. Each corresponds to one Active Symbol.", "Antes de revelar as novas cartas de Ação do primeiro Turno — e depois no fim de cada Capítulo — compre 2 cartas de Mistério e coloque-as viradas para cima ao lado das cartas de Conto, uma de cada lado. Cada uma corresponde a um Símbolo Ativo."),
          t("On Nivellen’s initiative, place him on the lowest available spot whose pair of cards shows any Active Symbols; if there is none, on the bottom-most available spot.", "Na vez de Nivellen, coloque-o no espaço disponível mais baixo cujo par de cartas mostre algum Símbolo Ativo; se não houver, no espaço disponível mais baixo."),
          t("Nivellen drafts that pair but discards it instead of playing it. Count the Active Symbols on the discarded cards (ignoring effects) and place Nivellen’s Vote token on the Tale card of the Active Symbol there was more of. On a tie (including no Active Symbols at all), flip the Vote token and place it on the side shown.", "Nivellen pega esse par, mas o descarta em vez de jogar. Conte os Símbolos Ativos das cartas descartadas (ignorando efeitos) e coloque a ficha de Voto de Nivellen na carta de Conto do Símbolo Ativo que apareceu mais. Em empate (inclusive sem nenhum Símbolo Ativo), lance a ficha de Voto para o alto e coloque-a no lado sorteado."),
          t("After everyone (and Nivellen) has drafted, each Character on a spot below Nivellen gains 1 Experience Point.", "Depois que todos (e Nivellen) escolherem, cada Personagem num espaço abaixo de Nivellen ganha 1 Ponto de Experiência."),
          t("When moving standees back to the Initiative track, treat Nivellen like any other Character: he keeps his relative position.", "Ao voltar os marcadores para a trilha de Iniciativa, trate Nivellen como qualquer Personagem: ele mantém a posição relativa.")
        ]), grainRef(13, 6, 7))}
        ${block(t("Placing the Destiny token", "Colocar a ficha de Destino"), list([
          t("Nivellen’s Vote token counts as one player’s vote toward placing the Destiny token on its Path. Resolve ties with the regular rules.", "A ficha de Voto de Nivellen conta como o voto de um jogador para colocar a ficha de Destino no Caminho dela. Resolva empates pelas regras normais."),
          t("Then remove Nivellen’s Vote token from the Tale card and place it near the playmat.", "Depois tire a ficha de Voto de Nivellen da carta de Conto e deixe-a perto do tapete."),
          m.players === 2 ? interpretation(t("the rulebook does not say how Nivellen’s vote combines with the 2-player exception (the face-up cards voting as a 3rd player). The literal reading is that both count: 2 players + the cards + Nivellen.", "o manual não diz como o voto de Nivellen se combina com a exceção de 2 jogadores (as cartas viradas votando como 3º jogador). A leitura literal é que os dois contam: 2 jogadores + as cartas + Nivellen.")) : "",
          m.solo ? interpretation(t("in solo the Destiny token follows the Automa’s majority, so the rulebook does not say how Nivellen’s vote applies. Check the Tale’s Solo Rules card; if it is silent, one reading is to treat Nivellen’s vote as breaking an Automa tie.", "no solo a ficha de Destino segue a maioria do Automa, então o manual não diz como o voto de Nivellen se aplica. Confira a carta de Regras Solo do Conto; se ela não disser, uma leitura é usar o voto de Nivellen para desempatar o Automa.")) : ""
        ]), grainRef(14, 7))}
        ${block(t("End of the Chapter: Mystery cards", "Fim do Capítulo: cartas de Mistério"), list([
          t("After determining the Dominating Symbol but before scoring Victory and Experience Points, resolve the Mystery card of the Dominating Symbol; ignore the other one.", "Depois de definir o Símbolo Dominante, mas antes de marcar Pontos de Vitória e de Experiência, resolva a carta de Mistério do Símbolo Dominante; ignore a outra."),
          t("Check its condition against the cards in your Timeline, ignoring Lost Symbol tokens (read the cards as printed). The player with the most cards meeting it gains 2 Dominating Symbols (as Symbol tokens in their Token pool, like any gained Symbol); on a tie all tied players gain them.", "Confira a condição contra as cartas da sua Linha do Tempo, ignorando fichas de Símbolo Perdido (leia as cartas como impressas). Quem tiver mais cartas que a cumprem ganha 2 Símbolos Dominantes (como fichas de Símbolo na reserva de fichas, como qualquer Símbolo ganho); em empate, todos os empatados ganham."),
          t("Discard the face-up Mystery cards, draw the next 2 and place them one on each side, then score Victory and Experience Points.", "Descarte as cartas de Mistério viradas, compre as próximas 2 e coloque uma de cada lado, depois marque Pontos de Vitória e de Experiência."),
          t("Example: the condition says “Have the most cards without Symbols”. Player A has 1, player B has 2 (cards with Lost Symbols do not count). Player B gains 2 Dominating Symbols.", "Exemplo: a condição diz “Tenha mais cartas sem Símbolos”. O jogador A tem 1, o jogador B tem 2 (cartas com Símbolos Perdidos não contam). O jogador B ganha 2 Símbolos Dominantes.")
        ]), grainRef(14, 7, 8))}
        ${block(t("Determination and Authority tokens", "Fichas de Determinação e Autoridade"), list([
          t("After the 1st Chapter, as a reward from the Tale cards, the player with the most Dominating Symbols gains 1 of the 2 special tokens. The rulebook says they are used “at the end of future Turns”; each one is used at the moment it names (Determination when the Mystery card is resolved at the end of a Chapter, Authority when the Destiny token votes are counted). Each is discarded when used:", "Depois do 1º Capítulo, como recompensa das cartas de Conto, quem tem mais Símbolos Dominantes ganha 1 das 2 fichas especiais. O manual diz que elas são usadas “no fim de Turnos futuros”; cada uma é usada no momento que ela indica (Determinação ao resolver a carta de Mistério no fim de um Capítulo, Autoridade ao contar os votos da ficha de Destino). Cada uma é descartada ao ser usada:"),
          t(`Determination: when you gain Dominating Symbols from the Mystery card, discard it to gain ${det} additional Symbol${det > 1 ? "s" : ""} (with ${m.players} player${m.players > 1 ? "s" : ""}; the rulebook gives 1/1/2/2 for 1/2/3/4 players).`, `Determinação: ao ganhar Símbolos Dominantes pela carta de Mistério, descarte-a para ganhar ${det} Símbolo${det > 1 ? "s" : ""} adiciona${det > 1 ? "is" : "l"} (com ${m.players} jogador${m.players > 1 ? "es" : ""}; o manual dá 1/1/2/2 para 1/2/3/4 jogadores).`),
          t(`Authority: when the votes for the Destiny token are counted, discard it to add ${det} player vote${det > 1 ? "s" : ""} to your side (with ${m.players} player${m.players > 1 ? "s" : ""}; the rulebook gives 1/1/2/2 for 1/2/3/4 players).`, `Autoridade: ao contar os votos da ficha de Destino, descarte-a para acrescentar ${det} voto${det > 1 ? "s" : ""} de jogador ao seu lado (com ${m.players} jogador${m.players > 1 ? "es" : ""}; o manual dá 1/1/2/2 para 1/2/3/4 jogadores).`)
        ]), grainRef(14, 8))}`;
    }
    if (id === "skellige") {
      body = `
        ${para(t("A priestess has died. Gather information from Alibi cards and from each other, write down clues and deduce the Killer before the game ends. Each Alibi card is a unique combination of 1 of 4 Professions (Shieldmaiden, Guard, Skald, Boatman) and 1 of 4 Clans (Tordarroch, Dummond, Dimun, Heymaey).", "Uma sacerdotisa morreu. Junte informações das cartas de Álibi e dos outros jogadores, anote pistas e deduza o Assassino antes do fim. Cada carta de Álibi é uma combinação única de 1 de 4 Profissões (Shieldmaiden, Guard, Skald, Boatman) e 1 de 4 Clãs (Tordarroch, Dummond, Dimun, Heymaey)."))}
        ${block(t("Drafting: new Investigation card", "Escolha: nova carta de Investigação"), list([
          t("Before revealing new Action cards for the Turn (skip this in the first Turn of the game): discard the card below the Right Path Active Symbol (C) to the box; move the card below the Left Path Active Symbol (B) to C; move the top card of the face-up pile (A) to B. The conditions in B and C are active this Turn; the card now on top of A shows what comes next Turn.", "Antes de revelar as novas cartas de Ação do Turno (pule no primeiro Turno da partida): descarte na caixa a carta abaixo do Símbolo Ativo do Caminho da Direita (C); mova a carta abaixo do Símbolo Ativo do Caminho da Esquerda (B) para C; mova a carta do topo da pilha virada (A) para B. As condições em B e C valem neste Turno; a carta agora no topo de A mostra o que vem no próximo.")
        ]), ref("stretch", 17))}
        ${block(t("Investigation Step (after Playing cards)", "Etapa de Investigação (depois de Jogar cartas)"), list([
          t("In Initiative order, compare the last 2 cards of your Timeline with the conditions of the Investigation cards in B and C (order of the cards does not matter). If you meet both, choose only 1 to resolve.", "Na ordem de Iniciativa, compare as 2 últimas cartas da Linha do Tempo com as condições das cartas de Investigação em B e C (a ordem das cartas não importa). Se cumprir as duas, escolha só 1."),
          t("Possible conditions: cards in the specified color; a multicolor card; a card with 2 Symbols; a card without Symbols; a card with exactly 1 Active Symbol; a card with exactly 1 Non-Active Symbol; a card with the 1-3 multiply effect.", "Condições possíveis: cartas da cor indicada; uma carta multicolorida; uma carta com 2 Símbolos; uma carta sem Símbolos; uma carta com exatamente 1 Símbolo Ativo; uma carta com exatamente 1 Símbolo Não Ativo; uma carta com o efeito múltiplo 1-3."),
          t("Each player who meets a condition gains the Active Symbol shown above that Investigation card and performs one of three actions as the Investigator:", "Cada jogador que cumpre uma condição ganha o Símbolo Ativo mostrado acima daquela carta de Investigação e faz uma de três ações como Investigador:"),
          t("<strong>Investigate another Player:</strong> choose a player without the Investigation token and place it in front of them; name one Clan or Profession and ask whether any of their Alibi cards belongs to it; if so, they secretly show you one such card (their choice if several).", "<strong>Investigar outro Jogador:</strong> escolha um jogador sem a ficha de Investigação e coloque-a na frente dele; diga um Clã ou Profissão e pergunte se alguma das cartas de Álibi dele pertence a ele; se sim, ele mostra em segredo uma dessas cartas (escolha dele se houver várias)."),
          t("<strong>Investigate a Suspect</strong> (only if the Investigation token is not next to the Suspect pool): place the token next to the Suspect pool; secretly look at any Alibi card there; place a Clue token of its Clan or Profession next to it, visible to all (if it already has a Clue token, do not add another).", "<strong>Investigar um Suspeito</strong> (só se a ficha de Investigação não estiver ao lado do grupo de Suspeitos): coloque a ficha ao lado do grupo; olhe em segredo qualquer carta de Álibi ali; coloque ao lado dela uma ficha de Pista do Clã ou da Profissão dela, visível a todos (se já tiver ficha de Pista, não ponha outra)."),
          t("<strong>Try to Identify the Killer</strong> (once per game): mark the cell you think is the Killer with “!” and circle it and the current Turn number on your Deduction pad. From then on you may no longer Investigate, though you still gain the Active Symbol when you meet a condition.", "<strong>Tentar Identificar o Assassino</strong> (uma vez por partida): marque com “!” a célula que você acha que é o Assassino e circule-a junto com o número do Turno atual no bloco de Dedução. A partir daí você não pode mais Investigar, mas ainda ganha o Símbolo Ativo quando cumprir uma condição."),
          t("The Investigation token cannot target the player or the Suspect pool it is currently next to.", "A ficha de Investigação não pode mirar o jogador ou o grupo de Suspeitos ao lado do qual ela já está."),
          t("Everyone marks all the information they saw, heard or deduced on their Deduction pad: cross out with X your own Alibi cards and every card revealed during the game (not the Killer); write a player’s initials in a cell when you investigate their cards and cross it out, or mark possible cells when others investigate them; write a Suspect number when investigating the Suspect pool and cross it out, or mark possible cells when others do.", "Todos anotam tudo o que viram, ouviram ou deduziram no bloco de Dedução: risque com X suas cartas de Álibi e toda carta revelada na partida (não são o Assassino); escreva as iniciais de um jogador numa célula quando investigar as cartas dele e risque-a, ou marque células possíveis quando outros o investigarem; escreva o número do Suspeito ao investigar o grupo de Suspeitos e risque-a, ou marque células possíveis quando outros o fizerem.")
        ]), refs("stretch", 16, 17, 18))}
        ${block(t("End of the Chapter and of the game", "Fim do Capítulo e da partida"), list([
          t("After the Path tokens: at the end of Chapter 1 flip the first card of the Killer pool face up; at the end of Chapter 2 the second; after Chapter 3 the last card stays face down.", "Depois das fichas de Caminho: no fim do Capítulo 1 vire para cima a primeira carta do grupo do Assassino; no fim do Capítulo 2, a segunda; depois do Capítulo 3 a última continua virada para baixo."),
          t("End of the game: after scoring Side Quests and Experience Points, every player who has not yet tried to Identify the Killer does so now. Follow the Tale cards. Then everyone reveals their Deduction pad and the Killer card is turned face up.", "Fim da partida: depois de marcar Missões Secundárias e Pontos de Experiência, cada jogador que ainda não tentou Identificar o Assassino faz isso agora. Siga as cartas de Conto. Então todos revelam o bloco de Dedução e a carta do Assassino é virada para cima."),
          t("Each player who identified the Killer correctly scores: 7 Victory Points if during the 1st Turn of the 3rd Chapter or earlier; 5 during the 2nd Turn of the 3rd Chapter; 3 during the 3rd Turn of the 3rd Chapter; 2 at the end of the game.", "Cada jogador que identificou o Assassino corretamente marca: 7 Pontos de Vitória se foi no 1º Turno do 3º Capítulo ou antes; 5 no 2º Turno do 3º Capítulo; 3 no 3º Turno do 3º Capítulo; 2 no fim da partida."),
          t("If at least one player identified the Killer, read the Epilogue (the Killer is identified); otherwise read the “the Killer remains unidentified” Tale card.", "Se pelo menos um jogador identificou o Assassino, leia o Epílogo (o Assassino foi identificado); senão leia a carta de Conto “o Assassino continua não identificado”.")
        ]), ref("stretch", 18))}`;
    }
    if (id === "doppler") {
      body = `
        ${para(t("Players are on two teams with different scoring. One or two dopplers have taken someone’s place. The others share a common Goal: the color of cards whose Goal token must end furthest on the Goal track. They also score for identifying the doppler(s). With 2 dopplers, they do not know about each other and each plays for themselves.", "Os jogadores ficam em dois times com pontuações diferentes. Um ou dois dopplers tomaram o lugar de alguém. Os outros têm um Objetivo comum: a cor de cartas cuja ficha de Objetivo precisa terminar mais longe na trilha de Objetivo. Também pontuam por identificar o(s) doppler(s). Com 2 dopplers, eles não sabem um do outro e cada um joga por si."))}
        ${block(t("Playing cards: Hint cards", "Jogar cartas: cartas de Dica"), list([
          t("Once per Chapter, after Playing cards, if you have 3 or more Non-Active Symbols (counted as usual: on the cards in your Timeline and in your Token pool), you may look at the Hint card of the current Chapter and place your Player token next to it. You gain 1 Experience in Chapter 1, 2 in Chapter 2, 3 in Chapter 3.", "Uma vez por Capítulo, depois de Jogar cartas, se você tiver 3 ou mais Símbolos Não Ativos (contados como sempre: nas cartas da Linha do Tempo e na reserva de fichas), pode olhar a carta de Dica do Capítulo atual e colocar sua ficha de jogador ao lado dela. Você ganha 1 de Experiência no Capítulo 1, 2 no Capítulo 2, 3 no Capítulo 3."),
          t("You may look at the Hint cards next to your Player tokens at any time, but you may not share any information about them.", "Você pode olhar as cartas de Dica ao lado das suas fichas a qualquer momento, mas não pode compartilhar nada sobre elas.")
        ]), ref("stretch", 20))}
        ${block(t("End of the Chapter", "Fim do Capítulo"), list([
          t("Before discarding cards from Timelines, advance the Goal tokens: for each 3 cards of one color anywhere in one player’s Timeline, move that color’s Goal token 1 spot. One player can move several tokens or one token several times. A multicolor card may be used in several sets, but only once per color.", "Antes de descartar cartas das Linhas do Tempo, avance as fichas de Objetivo: para cada 3 cartas de uma cor em qualquer lugar da Linha do Tempo de um jogador, mova 1 espaço a ficha de Objetivo daquela cor. Um jogador pode mover várias fichas ou uma ficha várias vezes. Uma carta multicolorida pode entrar em vários conjuntos, mas só uma vez por cor."),
          t("Accusations and Mistrust: after advancing the Goal tokens, players may discuss their suspicions. When ready, each picks one of their Mistrust tokens (value 1 in Chapters 1 and 2, value 2 in Chapter 3) and simultaneously places it on another player’s board.", "Acusações e Desconfiança: depois de avançar as fichas de Objetivo, os jogadores podem discutir suas suspeitas. Quando prontos, cada um pega uma das suas fichas de Desconfiança (valor 1 nos Capítulos 1 e 2, valor 2 no Capítulo 3) e a coloca ao mesmo tempo no tabuleiro de outro jogador.")
        ]), refs("stretch", 20, 21))}
        ${block(t("End of the game", "Fim da partida"), list([
          t("Chapter 3 also ends with the Timeline Goal advance and an accusation, this time with the value-2 Mistrust token.", "O Capítulo 3 também termina com o avanço de Objetivo pela Linha do Tempo e uma acusação, desta vez com a ficha de Desconfiança de valor 2."),
          interpretation(t("the rulebook prints “Accusations and Mistrust” right after the end-of-game hand reveal, so the last accusation could also come after the hand cards advance the Goal tokens. This guide places it at the end of Chapter 3, as in the other Chapters; agree on the order before the game.", "o manual imprime “Acusações e Desconfiança” logo depois da revelação das mãos no fim da partida, então a última acusação também poderia vir depois de as cartas da mão avançarem as fichas de Objetivo. Este guia a coloca no fim do Capítulo 3, como nos outros Capítulos; combinem a ordem antes da partida.")),
          t("Reveal the cards in your hand and advance the Goal tokens with the same rule: for each 3 cards of one color in a player’s hand, move that Goal token 1 spot.", "Revele as cartas da mão e avance as fichas de Objetivo pela mesma regra: para cada 3 cartas de uma cor na mão de um jogador, mova aquela ficha de Objetivo 1 espaço."),
          t("Reveal your Identity cards. If the Goal token matching the Goal cards is further than all other tokens, every “not a doppler” player scores 3 Victory Points; otherwise no points for Goal cards.", "Revelem as cartas de Identidade. Se a ficha de Objetivo da cor das cartas de Objetivo estiver mais longe que todas as outras, cada jogador “não doppler” marca 3 Pontos de Vitória; senão ninguém marca pelas cartas de Objetivo."),
          t("Total the Mistrust on each board. Each doppler scores 7 Victory Points if any “not a doppler” player has the same or a higher total than they have.", "Some a Desconfiança em cada tabuleiro. Cada doppler marca 7 Pontos de Vitória se algum jogador “não doppler” tiver total igual ou maior que o dele."),
          t("Each player scores Victory Points equal to the value of their own Mistrust tokens placed on any doppler’s board. “Each player” includes the dopplers: with 2 dopplers, one also scores for the tokens they placed on the other doppler’s board.", "Cada jogador marca Pontos de Vitória iguais ao valor das próprias fichas de Desconfiança colocadas no tabuleiro de qualquer doppler. “Cada jogador” inclui os dopplers: com 2 dopplers, um também marca pelas fichas que pôs no tabuleiro do outro."),
          t("Read the epilogue: if at least one doppler stayed hidden (some “not a doppler” player had the same or more Mistrust), read “the doppler’s identity was not revealed”; otherwise “the doppler’s identity was revealed”.", "Leia o epílogo: se pelo menos um doppler ficou escondido (algum “não doppler” teve Desconfiança igual ou maior), leia “a identidade do doppler não foi revelada”; senão “a identidade do doppler foi revelada”."),
          t("Example: Dandelion is the doppler and the blue Goal token, matching the Goal cards, is furthest: Ciri and Dijkstra score 3. Ciri’s board holds 6 Mistrust, Dandelion’s 3, so the doppler stayed hidden and Dandelion scores 7. Ciri placed 3 Mistrust on Dandelion and scores 3.", "Exemplo: Dandelion é o doppler e a ficha azul, da cor das cartas de Objetivo, está mais longe: Ciri e Dijkstra marcam 3. O tabuleiro de Ciri tem 6 de Desconfiança e o de Dandelion 3, então o doppler ficou escondido e Dandelion marca 7. Ciri colocou 3 de Desconfiança em Dandelion e marca 3.")
        ]), ref("stretch", 21))}`;
    }
    if (id === "dragon") {
      const needed = m.players >= 4 ? 2 : 1;
      body = `
        ${block(t("Dragon Protection cards", "Cartas Dragon Protection"), list([
          t("They follow all the regular rules of Action cards, with four exceptions: their effect is resolved after all players have played their cards, in the additional Golden Dragon Step; they cannot meet any condition when resolving effects; they have no color (if one is drawn for an effect that checks card color, ignore it and draw another); and they cannot be kept in Timelines for the next Chapter.", "Elas seguem todas as regras normais das cartas de Ação, com quatro exceções: o efeito é resolvido depois que todos jogaram, na Etapa adicional do Dragão Dourado; não cumprem nenhuma condição ao resolver efeitos; não têm cor (se uma for comprada por um efeito que confere cor, ignore-a e compre outra); e não podem ser guardadas na Linha do Tempo para o Capítulo seguinte."),
          t("Card effect: move the Dragon clockwise 1 tile. Any number of times, lose 1 Non-Active Symbol to move it 1 more tile. Gain the effects of the tile where it ends.", "Efeito da carta: mova o Dragão 1 hexágono no sentido horário. Quantas vezes quiser, perca 1 Símbolo Não Ativo para movê-lo mais 1. Ganhe os efeitos do hexágono onde ele parar.")
        ]), ref("stretch", 23))}
        ${block(t("Golden Dragon Step (after Playing cards)", "Etapa do Dragão Dourado (depois de Jogar cartas)"), list([
          t(`Move the Dragon: in Initiative order, players who played Dragon Protection cards resolve all their effects (move and gain bonuses). Each tile gives one certain bonus (1 Left Path Symbol ${icon("left-path")}, 1 Right Path Symbol ${icon("right-path")} or 2 Experience ${icon("experience")}) and another that depends on a condition.`, `Mover o Dragão: na ordem de Iniciativa, quem jogou Dragon Protection resolve todos os efeitos (mover e ganhar bônus). Cada hexágono dá um bônus certo (1 Símbolo do Caminho da Esquerda ${icon("left-path")}, 1 do Caminho da Direita ${icon("right-path")} ou 2 de Experiência ${icon("experience")}) e outro que depende de uma condição.`),
          t("Tile conditions — anywhere in your Timeline you have exactly: 1 / 2 cards of the shown color (red, green, blue or yellow); 1 / 2 cards with exactly 1 Symbol; 1 / 2 cards with a Non-Active Symbol; 1 card with 2 Symbols; 1 card without Symbols; 1 multicolor card; 1 card with the 1-3 multiply effect; 3 cards of a chosen color; or cards of exactly 2 colors in your Timeline. Ignore Lost Symbol tokens when checking (read the cards as printed).", "Condições dos hexágonos — em qualquer lugar da Linha do Tempo você tem exatamente: 1 / 2 cartas da cor mostrada (vermelha, verde, azul ou amarela); 1 / 2 cartas com exatamente 1 Símbolo; 1 / 2 cartas com um Símbolo Não Ativo; 1 carta com 2 Símbolos; 1 carta sem Símbolos; 1 carta multicolorida; 1 carta com o efeito múltiplo 1-3; 3 cartas de uma cor escolhida; ou cartas de exatamente 2 cores na Linha do Tempo. Ignore fichas de Símbolo Perdido ao conferir (leia as cartas como impressas)."),
          t(`Protect the Dragon: count the Dragon Protection cards played this Turn. With at least ${needed} (1 for 1–3 players, 2 for 4–5) the Dragon is protected this Turn. If not, the Dragon loses 1 Life Point: remove 1 token from the Dragon board.`, `Proteger o Dragão: conte as Dragon Protection jogadas neste Turno. Com pelo menos ${needed} (1 com 1–3 jogadores, 2 com 4–5) o Dragão está protegido neste Turno. Se não, o Dragão perde 1 Ponto de Vida: retire 1 ficha do tabuleiro do Dragão.`)
        ]), refs("stretch", 23, 24))}
        ${block(t("Golden Dragon token", "Ficha do Dragão Dourado"), list([
          t("As a reward from the Tale cards, one player may gain the Golden Dragon token. Its effect depends on where the bonus places it: on your Player board — discard it when moving the Dragon to move it 1 or 2 more tiles; above your Timeline — discard it instead of playing 1 card in the Playing cards Step to apply all the effects of playing a Dragon Protection card (it counts as playing the card; the number of cards in your hand increases).", "Como recompensa das cartas de Conto, um jogador pode ganhar a ficha do Dragão Dourado. O efeito depende de onde o bônus a coloca: no seu tabuleiro — descarte-a ao mover o Dragão para movê-lo mais 1 ou 2 hexágonos; acima da Linha do Tempo — descarte-a em vez de jogar 1 carta na Etapa de Jogar cartas para aplicar todos os efeitos de jogar uma Dragon Protection (conta como jogar a carta; o número de cartas na sua mão aumenta)."),
          t("If the game ends because of the Dragon’s death, the Golden Dragon token scores no Victory Points.", "Se a partida terminar pela morte do Dragão, a ficha do Dragão Dourado não vale Pontos de Vitória.")
        ]), ref("stretch", 24))}
        ${block(t("End of the Chapter and of the game", "Fim do Capítulo e da partida"), list([
          t("Dragon Protection cards may not be kept for the next Chapter in the Timeline clean-up.", "Dragon Protection não podem ser guardadas para o próximo Capítulo na limpeza da Linha do Tempo."),
          t("If the Dragon survives the 3 Chapters, use the regular scoring.", "Se o Dragão sobreviver aos 3 Capítulos, use a pontuação normal."),
          t("<strong>Dragon’s death:</strong> the game ends after placing the Destiny token in the Turn in which the Dragon loses its last Life Point. Finish the current Turn, end the Chapter with the regular rules (Dominating Symbol, Victory and Experience Points, Left and Right Path tokens), then end the game and read the Tale page of the Dragon’s death. Each player additionally gains 2 Victory Points for each Dragon Protection card played in this Chapter and loses 1 for each Dragon Protection card still in their hand.", "<strong>Morte do Dragão:</strong> a partida acaba depois de colocar a ficha de Destino no Turno em que o Dragão perde o último Ponto de Vida. Termine o Turno atual, encerre o Capítulo pelas regras normais (Símbolo Dominante, Pontos de Vitória e de Experiência, fichas de Caminho), depois encerre a partida e leia a página do Conto da morte do Dragão. Cada jogador também ganha 2 Pontos de Vitória por Dragon Protection jogada neste Capítulo e perde 1 por Dragon Protection ainda na mão."),
          interpretation(t("the “each player additionally” scoring is printed right after the Dragon’s-death ending, so this guide applies it there. The rulebook does not say whether Side Quests and the Golden Experience bonus are also scored after the Dragon’s death; follow the Tale card you read.", "a pontuação “cada jogador também” está impressa logo depois do final da morte do Dragão, então este guia a aplica ali. O manual não diz se as Missões Secundárias e o bônus de Experiência Dourada também contam depois da morte do Dragão; siga a carta de Conto lida."))
        ]), ref("stretch", 24))}`;
    }
    if (id === "wish") {
      body = `
        ${block(t("Seal tokens and the Djinn board", "Fichas de Selo e o tabuleiro do Djinn"), list([
          t("Seal tokens are the power to bind the Djinn. There are 12, 3 of each of the 4 colors. Tokens in the Past Seal pool are used-up power: they never move anyone, but help you estimate what is left in the bag.", "As fichas de Selo são o poder de prender o Djinn. São 12, 3 de cada uma das 4 cores. As fichas no grupo de Selos Passados são poder gasto: nunca movem ninguém, mas ajudam a estimar o que resta no saco."),
          t("The Seal Binding spaces show which Seals bind the Djinn now: playing cards of the same color as the Seal there moves your Player token on the Djinn track by 1 or 2 spots clockwise.", "Os espaços de Prender o Selo mostram quais Selos prendem o Djinn agora: jogar cartas da mesma cor do Selo ali move sua ficha na trilha do Djinn 1 ou 2 espaços no sentido horário.")
        ]), ref("stretch", 26))}
        ${block(t("During each Turn", "Durante cada Turno"), list([
          t("Before the Drafting cards Step, draw 1 Seal token from the bag and place it on the Seal Binding +1 space.", "Antes da Etapa de Escolher cartas, compre 1 ficha de Selo do saco e coloque-a no espaço de Prender o Selo +1."),
          t("After the Playing cards Step, draw 1 Seal token and place it on the Seal Binding +2 space.", "Depois da Etapa de Jogar cartas, compre 1 ficha de Selo e coloque-a no espaço +2."),
          t("Then each player moves on the Djinn track, looking at the last 2 cards of their Timeline: 1 spot for each card whose color (multicolor included) matches the +1 Seal; 2 spots for each card whose color matches the +2 Seal; 1 spot back for each multicolor card played. If the total is negative, the token does not move back.", "Depois cada jogador anda na trilha do Djinn olhando as 2 últimas cartas da Linha do Tempo: 1 espaço por carta cuja cor (inclusive multicolorida) corresponde ao Selo +1; 2 espaços por carta cuja cor corresponde ao Selo +2; 1 espaço para trás por carta multicolorida jogada. Se o total for negativo, a ficha não volta."),
          t("You immediately gain the bonuses next to each spot you move onto. If you are already on the highest spot, gain 1 Victory Point for each spot you would move.", "Você ganha na hora os bônus ao lado de cada espaço por onde avança. Se já estiver no espaço mais alto, ganhe 1 Ponto de Vitória por espaço que andaria."),
          t("Then move the Seal tokens from the Seal Binding spaces to the Past Seal pool.", "Depois mova as fichas de Selo dos espaços de Prender o Selo para o grupo de Selos Passados."),
          t("Example: with a red Seal on +2, a player whose last 2 cards include a red card moves 2. A player with a blue card matching +1 and a multicolor card does not move (1 − 1). A player with no match and a multicolor card does not move back.", "Exemplo: com um Selo vermelho no +2, um jogador cujas 2 últimas cartas incluem uma vermelha anda 2. Um jogador com uma carta azul igual ao +1 e uma multicolorida não anda (1 − 1). Um jogador sem correspondência e com uma multicolorida não volta.")
        ]), refs("stretch", 26, 27))}
        ${block(t("End of the Chapter", "Fim do Capítulo"), list([
          t("The Djinn grants a wish to the player furthest along the Djinn track (ties by Initiative order): they take the Wish card of the current Chapter, reveal it and keep it next to their board until the end of the game.", "O Djinn concede um desejo a quem está mais à frente na trilha do Djinn (empate pela ordem de Iniciativa): ele pega a carta de Desejo do Capítulo atual, revela e a guarda ao lado do tabuleiro até o fim da partida."),
          t("Wish cards of Chapters 1 and 2 have effects that may trigger several times during the game, but only once per Turn. The Chapter 3 Wish card gives a one-time Victory Point gain.", "As cartas de Desejo dos Capítulos 1 e 2 têm efeitos que podem disparar várias vezes na partida, mas só uma vez por Turno. A do Capítulo 3 dá um ganho único de Pontos de Vitória."),
          t("Before choosing cards to keep in Timelines for the next Chapter, reset the Djinn board: put all Seal tokens from the board back in the bag, shuffle, and draw 4 into the Past Seal pool.", "Antes de escolher as cartas a guardar na Linha do Tempo para o próximo Capítulo, reinicie o tabuleiro do Djinn: devolva todas as fichas de Selo do tabuleiro ao saco, misture e compre 4 para o grupo de Selos Passados."),
          m.solo ? t("Solo: at the start of each Chapter, place the Automa’s token 2 spots further than yours on the Djinn track.", "Solo: no início de cada Capítulo, coloque a ficha do Automa 2 espaços à frente da sua na trilha do Djinn.") : ""
        ]), ref("stretch", 27))}`;
    }
    return `
      ${sectionHeading("tale-rules", t(`Tale rules: ${taleName(id)}`, `Regras do Conto: ${taleName(id)}`), index, taleRefs(id))}
      <p class="section-lead">${t("Some Tales modify the turn structure; follow these rules and the Tale’s Player Aid card together with the Tale cards.", "Alguns Contos mudam a estrutura do turno; siga estas regras e a carta de Ajuda do Conto junto com as cartas de Conto.")}</p>
      ${body}`;
  }

  // --- Modules -------------------------------------------------------------------------

  function modulesSection(index) {
    const m = match();
    const blocks = [];
    if (m.companion !== "none") {
      blocks.push(block(t(`Companion: ${COMPANIONS[m.companion]}`, `Companheiro: ${COMPANIONS[m.companion]}`), list([
        t(`At the start of each new Chapter (Chapter 1 included), draw a new ${COMPANIONS[m.companion]} card and place it face up next to the bottom-most available spot of the playmat (the ${m.spots === 4 ? "4th" : "5th"} spot), discarding any Companion card already there to the box. 3 Companion cards are used per game, 1 per Chapter.`, `No início de cada novo Capítulo (inclusive o Capítulo 1), compre uma nova carta de ${COMPANIONS[m.companion]} e coloque-a virada para cima ao lado do espaço disponível mais baixo do tapete (o ${m.spots === 4 ? "4º" : "5º"}), descartando na caixa a carta de Companheiro que estiver ali. São usadas 3 cartas de Companheiro por partida, 1 por Capítulo.`),
        t("When you choose the spot next to the Companion card, before drafting cards you may use its ability instead of the usual Tale effect of that spot (typically the extra Experience Point). The Companion’s abilities are available to all players.", "Ao escolher o espaço ao lado da carta de Companheiro, antes de pegar as cartas você pode usar a habilidade dele em vez do efeito normal do Conto naquele espaço (normalmente o Ponto de Experiência extra). As habilidades do Companheiro valem para todos."),
        m.tale === "lesser" ? t("The Lesser Evil: the bottom spot holds the Renfri/Stregobor Alliance token; using the Companion replaces that spot’s Tale effect (drawing an Alliance card).", "The Lesser Evil: o espaço de baixo tem a ficha de Aliança Renfri/Stregobor; usar o Companheiro substitui o efeito do Conto naquele espaço (comprar uma carta de Aliança).") : "",
        m.tale === "lesser" ? interpretation(t("this follows the literal wording “instead of following the usual Tale effect”; the rulebook has no example for this Tale.", "isto segue a redação literal “em vez de seguir o efeito normal do Conto”; o manual não tem exemplo para este Conto.")) : "",
        m.companion === "zoltan" ? t("Zoltan Chivay: when using his abilities, flip the core Solo Mode Destiny token to determine the outcome.", "Zoltan Chivay: ao usar as habilidades dele, lance para o alto a ficha de Destino do Modo Solo da caixa base para decidir o resultado.") : ""
      ]), ref("stretch", 5)));
    }
    if (m.villain === "odimm") {
      blocks.push(block(t("Villain: Gaunter O’Dimm", "Vilão: Gaunter O’Dimm"), list([
        t("When any player gains their 15th Experience Point, finish the current Step of the Turn, then perform a Pact offering Step. If nobody gains 15 Experience Points by the end of the game, O’Dimm ignores the players: no Pact is offered.", "Quando qualquer jogador ganhar o 15º Ponto de Experiência, termine a Etapa atual do Turno e então faça uma Etapa de Oferta de Pacto. Se ninguém chegar a 15 Pontos de Experiência até o fim, O’Dimm ignora os jogadores: nenhum Pacto é oferecido."),
        t("Pact offering: reveal the top O’Dimm card; it shows the Pact condition. Only one O’Dimm card is revealed in the whole game.", "Oferta de Pacto: revele a carta de O’Dimm do topo; ela mostra a condição do Pacto. Só uma carta de O’Dimm é revelada na partida inteira."),
        t("In Initiative order, each player decides whether to sign. If you do not sign, you immediately lose 1 Victory Point. If you sign, take any other O’Dimm card from the pile and tuck it face down under your Player board, ignoring its effect — it is just a reminder, a mark.", "Na ordem de Iniciativa, cada jogador decide se assina. Quem não assina perde imediatamente 1 Ponto de Vitória. Quem assina pega qualquer outra carta de O’Dimm da pilha e a coloca virada para baixo sob o tabuleiro, ignorando o efeito — é só um lembrete, uma marca."),
        t("End of the game: check the Pact condition at the moment its card says. Each signer who meets it gains 2 Victory Points; each signer who does not loses 3 Victory Points.", "Fim da partida: confira a condição do Pacto no momento que a carta indica. Cada signatário que cumprir ganha 2 Pontos de Vitória; quem não cumprir perde 3 Pontos de Vitória.")
      ]), ref("stretch", 6)));
    }
    if (m.villain === "vilgefortz" || m.villain === "bonhart") {
      const name = VILLAINS[m.villain];
      blocks.push(block(t(`Villain: ${name}`, `Vilão: ${name}`), list([
        t(`Whenever a ${name} card is drawn, set it aside face up next to the playmat and continue drawing. Its Ability becomes active in the next Playing cards Step. More than 1 Villain card may be active at a time.`, `Sempre que uma carta de ${name} for comprada, separe-a virada para cima ao lado do tapete e continue comprando. A Habilidade dela fica ativa na próxima Etapa de Jogar cartas. Mais de 1 carta de Vilão pode estar ativa ao mesmo tempo.`),
        m.villain === "vilgefortz"
          ? t("Vilgefortz: each card introduces a passive effect on the Action cards players play to their Timelines, ongoing for the rest of the game or until that Villain card is defeated.", "Vilgefortz: cada carta impõe um efeito passivo às cartas de Ação que os jogadores colocam na Linha do Tempo, contínuo pelo resto da partida ou até aquela carta de Vilão ser derrotada.")
          : t("Leo Bonhart: each card checks whether players have a specific effect on the last 2 cards of their Timelines, ongoing for the rest of the game or until that card is defeated. A player who did not play any card with that effect loses a Symbol of their choice.", "Leo Bonhart: cada carta confere se os jogadores têm um efeito específico nas 2 últimas cartas da Linha do Tempo, de forma contínua pelo resto da partida ou até ela ser derrotada. Quem não jogou nenhuma carta com aquele efeito perde um Símbolo à sua escolha."),
        t("Resolve the Villain Ability after resolving all other effects that happen after the Playing cards Step.", "Resolva a Habilidade do Vilão depois de todos os outros efeitos que acontecem após a Etapa de Jogar cartas."),
        t("Defeating a Villain: after all played cards’ effects (including the Villain Ability), check whether the last 2 cards of any Timeline match a Villain card’s condition. If so, discard that Villain card; each player who met the condition gains 2 Victory Points. One player may defeat only 1 Villain card per Turn, but 2 or more players may defeat different cards if more than 1 is active.", "Derrotar um Vilão: depois de todos os efeitos das cartas jogadas (inclusive a Habilidade do Vilão), confira se as 2 últimas cartas de alguma Linha do Tempo cumprem a condição de uma carta de Vilão. Se sim, descarte-a; cada jogador que cumpriu ganha 2 Pontos de Vitória. Um jogador só pode derrotar 1 carta de Vilão por Turno, mas 2 ou mais jogadores podem derrotar cartas diferentes se houver mais de 1 ativa.")
      ]), ref("stretch", 7)));
    }
    if (m.voice) {
      blocks.push(block(t("Voice of Reason envelopes", "Envelopes Voice of Reason"), list([
        t("When the game ends, check whether any achievement of this Tale’s envelope (and the 2 any-Tale achievements of the RONIN envelope) is met. If so, mark it off with a pen.", "Quando a partida acabar, confira se alguma conquista do envelope deste Conto (e as 2 conquistas de qualquer Conto do envelope RONIN) foi cumprida. Se sim, risque-a com caneta."),
        t("When all the achievements of an envelope are marked off, open it: it holds secret components inspired by the Tale. Some introduce new rules, with clarifications found inside the envelope.", "Quando todas as conquistas de um envelope estiverem riscadas, abra-o: ele traz componentes secretos inspirados no Conto. Alguns introduzem regras novas, com instruções dentro do envelope."),
        t("You may use unlocked content in future games, including replaying the Tale with its own envelope’s components. You can play with most unlocked content at once, but the rulebook advises 2–3 modules at most.", "Você pode usar o conteúdo liberado em partidas futuras, inclusive rejogando o Conto com os componentes do próprio envelope. Dá para jogar com quase todo o conteúdo liberado junto, mas o manual recomenda no máximo 2–3 módulos."),
        note(t("The sealed contents are not in the rulebook PDFs, so this guide cannot cover them.", "O conteúdo lacrado não está nos PDFs dos manuais, então este guia não o cobre."))
      ]), ref("stretch", 8)));
    }
    if (m.roach) {
      blocks.push(block(t("Geralt on Roach", "Geralt on Roach"), list([
        t("When a multicolor card is revealed by Geralt on Roach’s Ability, choose any of its colors to resolve the effect. If a colorless card is drawn, ignore it and reveal another one.", "Quando uma carta multicolorida for revelada pela Habilidade de Geralt on Roach, escolha qualquer uma das cores para resolver o efeito. Se sair uma carta sem cor, ignore-a e revele outra.")
      ]), ref("roach", 2)));
    }
    if (m.isLM && m.lmCompanion !== "none") {
      const name = m.lmCompanion === "lambert" ? "Lambert" : "Eskel";
      blocks.push(block(t(`Companion: ${name}`, `Companheiro: ${name}`), list([
        t(`At the start of the 1st Turn of each new Chapter (Chapter 1 included), draw a ${name} card and place it face up next to the bottom-most available spot of the playmat, covering any Companion card already there. 3 Companion cards are used per game, 1 per Chapter.`, `No início do 1º Turno de cada novo Capítulo (inclusive o Capítulo 1), compre uma carta de ${name} e coloque-a virada para cima ao lado do espaço disponível mais baixo do tapete, cobrindo a carta de Companheiro que estiver ali. São usadas 3 cartas de Companheiro por partida, 1 por Capítulo.`),
        t("When you choose the spot next to the Companion card, before drafting cards you may use its ability instead of gaining the Extra Experience Point.", "Ao escolher o espaço ao lado da carta de Companheiro, antes de pegar as cartas você pode usar a habilidade em vez de ganhar o Ponto de Experiência Extra.")
      ]), ref("legendary", 15)));
    }
    if (!blocks.length) {
      return "";
    }
    return `
      ${sectionHeading("modules", t("Optional modules in this match", "Módulos opcionais nesta partida"), index, m.isLM ? ref("legendary", 15) : refs("stretch", 5, 6, 7, 8))}
      ${blocks.join("")}`;
  }

  // --- End of Chapter / game -------------------------------------------------------------

  function cleanupLines() {
    return [
      t("Discard all tokens (Symbols and Lost Symbols) from your Token pool.", "Descarte todas as fichas (Símbolos e Símbolos Perdidos) da reserva de fichas."),
      t("Everyone does this simultaneously and reveals their choice at the same time: after the 1st Chapter, keep any 1 Action card from your Timeline and discard the rest; the kept card becomes the first card played in the next Chapter. After the 2nd Chapter, keep any 2 Action cards (not necessarily the one kept before) and discard the rest; place them in any order as the first cards of the next Chapter.", "Todos fazem isso ao mesmo tempo e revelam a escolha juntos: depois do 1º Capítulo, guarde 1 carta de Ação qualquer da Linha do Tempo e descarte o resto; a carta guardada vira a primeira carta jogada do próximo Capítulo. Depois do 2º Capítulo, guarde 2 cartas de Ação quaisquer (não precisa ser a guardada antes) e descarte o resto; coloque-as na ordem que quiser como primeiras cartas do próximo Capítulo."),
      t("If a kept card has an effect that can be applied, resolve it immediately.", "Se uma carta guardada tiver um efeito que possa ser aplicado, resolva-o na hora.")
    ];
  }

  function chapterEndSection(index) {
    const m = match();
    let body;
    if (m.isLM) {
      body = `
        ${block(t("Start of each Chapter: Trail cards", "Início de cada Capítulo: cartas de Trilha"), list([
          t(`Before the first Turn of each Chapter, draw and reveal ${m.players} Trail card${m.players > 1 ? "s" : ""} from the current Chapter’s deck (one per player) and add 1 more face down.`, `Antes do primeiro Turno de cada Capítulo, compre e revele ${m.players} carta${m.players > 1 ? "s" : ""} de Trilha do baralho do Capítulo atual (uma por jogador) e acrescente mais 1 virada para baixo.`),
          t("Players discuss their plans and each takes 1 of the revealed cards. One player may instead trust their destiny: draw and reveal the face-down card and take it. Discard the last card.", "Os jogadores discutem planos e cada um pega 1 das cartas reveladas. Um jogador pode confiar no destino: comprar e revelar a carta virada e ficar com ela. Descarte a última carta."),
          t("Each Trail card shows a condition (a number of required cards; “…” means “at least”) and which of the 3 Non-Active Symbols will give you Experience at the end of the Chapter. Condition types: cards in the specified color; cards in one chosen color; fewer cards in the specified color than in any other color; cards without Symbols; cards with 2 Symbols; cards with the 1-3 multiply effect; multicolor cards; cards with a Fight Symbol. Ignore Lost Symbol tokens when checking (read cards as printed).", "Cada carta de Trilha mostra uma condição (um número de cartas exigidas; “…” significa “pelo menos”) e qual dos 3 Símbolos Não Ativos dará Experiência no fim do Capítulo. Tipos de condição: cartas da cor indicada; cartas de uma cor escolhida; menos cartas da cor indicada do que de qualquer outra cor; cartas sem Símbolos; cartas com 2 Símbolos; cartas com o efeito múltiplo 1-3; cartas multicoloridas; cartas com Símbolo de Luta. Ignore fichas de Símbolo Perdido ao conferir (leia as cartas como impressas).")
        ]), refs("legendary", 10, 11))}
        ${block(t("End of the Chapter (after the 3rd Destiny token)", "Fim do Capítulo (depois da 3ª ficha de Destino)"), steps([
          t("<strong>Trail cards</strong> (instead of determining a Dominating Symbol): compare your Trail card’s condition with your Timeline. If you meet it, gain 3 Experience Points; if not, roll the Monster die and apply its result. Either way, gain 1 Experience Point for each Non-Active Symbol of the type shown on your Trail card in your Timeline and Token pool. Discard all of this Chapter’s Trail cards to the box.", "<strong>Cartas de Trilha</strong> (em vez de definir um Símbolo Dominante): compare a condição da sua carta de Trilha com sua Linha do Tempo. Se cumprir, ganhe 3 Pontos de Experiência; se não, role o dado do Monstro e aplique o resultado. De qualquer forma, ganhe 1 Ponto de Experiência por Símbolo Não Ativo do tipo mostrado na sua carta de Trilha na Linha do Tempo e na reserva de fichas. Descarte na caixa todas as cartas de Trilha do Capítulo."),
          t("<strong>Deal damage:</strong> each player counts their Fight Symbols; subtract the total from the Monster’s Life counter. At 0 or below, the Monster is defeated and you win.", "<strong>Causar dano:</strong> cada jogador conta seus Símbolos de Luta; subtraia o total do contador de Vida do Monstro. Em 0 ou menos, o Monstro é derrotado e vocês vencem."),
          t("<strong>Clean up Timelines</strong> with the regular rules (below).", "<strong>Limpar as Linhas do Tempo</strong> pelas regras normais (abaixo)."),
          m.monster === "wildhunt" ? t("<strong>Naglfar:</strong> discard the revealed Naglfar card to the box and reveal the next one.", "<strong>Naglfar:</strong> descarte na caixa a carta de Naglfar revelada e revele a próxima.") : ""
        ]) + para(t("Example: a player meets the condition “at least 3 blue cards” and gains 3 Experience without rolling the die. Their Trail card shows Exploration, so they also gain 1 Experience per Exploration Symbol they have.", "Exemplo: um jogador cumpre a condição “pelo menos 3 cartas azuis” e ganha 3 de Experiência sem rolar o dado. A carta de Trilha mostra Exploração, então ele também ganha 1 de Experiência por Símbolo de Exploração que tiver.")), refs("legendary", 13, 14))}
        ${block(t("Clean up Timelines", "Limpar as Linhas do Tempo"), list(cleanupLines()), `${ref("core", 18)} ${ref("legendary", 13)}`)}`;
    } else if (m.isWH) {
      const bonus = { 1: 0, 2: 3, 3: 2, 4: 1 }[m.heroes];
      body = `
        ${block(t("Victory and Experience Points", "Pontos de Vitória e de Experiência"), list([
          t("Determine the Dominating Symbol with the regular rules: the Symbol with more Destiny tokens; on equal numbers, the one with the higher-numbered token; if no token was placed, the topmost player on the Initiative track chooses.", "Defina o Símbolo Dominante pelas regras normais: o Símbolo com mais fichas de Destino; em número igual, o da ficha de número maior; se nenhuma ficha foi colocada, quem está no topo da trilha de Iniciativa escolhe."),
          t("Every player (Heroes and the Wild Hunt) gains 1 Experience Point individually for each of their Non-Dominating Symbols.", "Cada jogador (Heróis e Wild Hunt) ganha individualmente 1 Ponto de Experiência por Símbolo Não Dominante."),
          m.heroes === 1
            ? t("Heroes: with only 1 Hero, the Heroes score 1 Victory Point per Dominating Symbol of that Hero, once.", "Heróis: com só 1 Herói, os Heróis marcam 1 Ponto de Vitória por Símbolo Dominante desse Herói, uma vez.")
            : t("Heroes gain 1 Victory Point for each Dominating Symbol of the Hero with the most Dominating Symbols, plus 1 for each Dominating Symbol of the Hero with the fewest.", "Os Heróis ganham 1 Ponto de Vitória por Símbolo Dominante do Herói com mais Símbolos Dominantes, mais 1 por Símbolo Dominante do Herói com menos."),
          t(`The Wild Hunt gains 1 Victory Point for each of its Dominating Symbols, plus ${bonus} for each Hero who has fewer Dominating Symbols than it (1 / 2 / 3 / 4 Heroes: 0 / 3 / 2 / 1 per Hero).`, `A Wild Hunt ganha 1 Ponto de Vitória por Símbolo Dominante seu, mais ${bonus} por Herói que tiver menos Símbolos Dominantes que ela (1 / 2 / 3 / 4 Heróis: 0 / 3 / 2 / 1 por Herói).`),
          t("Path tokens are not used in this expansion.", "As fichas de Caminho não são usadas nesta expansão."),
          m.solo ? t("Solo: do not award any bonuses from the Tale cards’ effects at the end of the Chapter.", "Solo: não conceda nenhum bônus dos efeitos das cartas de Conto no fim do Capítulo.") : ""
        ]) + para(t("Example (Fight dominating): the Wild Hunt has 4, Geralt 6, Ciri 4 and Dandelion 2. The Wild Hunt scores 4, plus 2 for having more than Dandelion (3 Heroes). The Heroes score 6 for Geralt (the most) and 2 for Dandelion (the fewest). With only Dandelion as Hero (2): the Wild Hunt scores 4 and no bonus; the Heroes score 2.", "Exemplo (Luta dominante): a Wild Hunt tem 4, Geralt 6, Ciri 4 e Dandelion 2. A Wild Hunt marca 4, mais 2 por ter mais que Dandelion (3 Heróis). Os Heróis marcam 6 por Geralt (o que tem mais) e 2 por Dandelion (o que tem menos). Só com Dandelion como Herói (2): a Wild Hunt marca 4 e nenhum bônus; os Heróis marcam 2.")), refs("wildhunt", 9, 10))}
        ${block(t("Then", "Depois"), list([...cleanupLines(), t("Put all Destiny tokens aside (they are used again in the next Chapter, stacked as in setup: III at the bottom, I on top) and continue to the Tale card that the Dominating Symbol points to; read it and apply its effects.", "Deixe todas as fichas de Destino de lado (elas voltam a ser usadas no próximo Capítulo, empilhadas como na preparação: III embaixo, I em cima) e siga para a carta de Conto indicada pelo Símbolo Dominante; leia-a e aplique os efeitos.")]), refs("core", 18, 19))}`;
    } else {
      const extraLines = [];
      if (m.tale === "grain") {
        extraLines.push(t("A Grain of Truth: right after determining the Dominating Symbol — before scoring — resolve its Mystery card (see the Tale rules).", "A Grain of Truth: logo depois de definir o Símbolo Dominante — antes de pontuar — resolva a carta de Mistério dele (veja as regras do Conto)."));
      }
      if (m.tale === "lesser") {
        extraLines.push(t("The Lesser Evil: the Dominating Path also decides whose Alliance cards are revealed (Renfri left, Stregobor right), and the reward of the player with the most Dominating Symbols is a penalty.", "The Lesser Evil: o Caminho Dominante também decide quais cartas de Aliança são reveladas (Renfri à esquerda, Stregobor à direita), e a recompensa de quem tem mais Símbolos Dominantes é uma penalidade."));
      }
      if (m.tale === "skellige") {
        extraLines.push(t("Skellige: after the Path tokens, flip the next Killer pool card (Chapters 1 and 2).", "Skellige: depois das fichas de Caminho, vire a próxima carta do grupo do Assassino (Capítulos 1 e 2)."));
      }
      if (m.tale === "doppler") {
        extraLines.push(t("Doppler: before discarding Timeline cards, advance the Goal tokens, then make accusations with Mistrust tokens.", "Doppler: antes de descartar cartas da Linha do Tempo, avance as fichas de Objetivo e depois faça acusações com fichas de Desconfiança."));
      }
      if (m.tale === "wish") {
        extraLines.push(t("The Last Wish: the Djinn grants the Chapter’s wish, and the Djinn board is reset before the clean-up.", "The Last Wish: o Djinn concede o desejo do Capítulo, e o tabuleiro do Djinn é reiniciado antes da limpeza."));
      }
      if (m.tale === "edge" && !m.firstPlay) {
        extraLines.push(t("The Edge of the World: flip this Chapter’s Extra Effort card face down.", "The Edge of the World: vire para baixo a carta Extra Effort deste Capítulo."));
      }
      if (m.tale === "dragon") {
        extraLines.push(t("Golden Dragon: Dragon Protection cards cannot be kept in the clean-up.", "Golden Dragon: Dragon Protection não podem ser guardadas na limpeza."));
      }
      if (m.companion !== "none") {
        extraLines.push(t(`${COMPANIONS[m.companion]}: a new Companion card replaces the old one at the start of the next Chapter.`, `${COMPANIONS[m.companion]}: uma nova carta de Companheiro substitui a anterior no início do próximo Capítulo.`));
      }
      body = `
        ${block(t("After the 3rd Turn", "Depois do 3º Turno"), steps([
          t("<strong>Dominating Symbol:</strong> the Symbol with more Destiny tokens is Dominating, the other Non-Dominating. On equal numbers, the one with the higher-numbered Destiny token dominates. If no Destiny token was placed in the Chapter, the topmost player on the Initiative track chooses the Dominating Symbol (not necessarily the one they have most of).", "<strong>Símbolo Dominante:</strong> o Símbolo com mais fichas de Destino é o Dominante e o outro o Não Dominante. Em número igual, domina o da ficha de Destino de número maior. Se nenhuma ficha foi colocada no Capítulo, quem está no topo da trilha de Iniciativa escolhe o Símbolo Dominante (não precisa ser o que tem mais)."),
          t(`<strong>Score:</strong> each player gains 1 Victory Point ${icon("victory-point")} for each Dominating Symbol they have (visible on Timeline cards and in the Token pool) and 1 Experience Point ${icon("experience")} for each Non-Dominating Symbol.${m.solo ? " The Automa scores the same way." : ""}`, `<strong>Pontuar:</strong> cada jogador ganha 1 Ponto de Vitória ${icon("victory-point")} por Símbolo Dominante que tiver (visível nas cartas da Linha do Tempo e na reserva de fichas) e 1 Ponto de Experiência ${icon("experience")} por Símbolo Não Dominante.${m.solo ? " O Automa pontua do mesmo jeito." : ""}`),
          t(`<strong>Path tokens:</strong> the player with the most Symbols of the left Tale card receives the Left Path token; the same for the Right Path token. Ties go by the Initiative track. These tokens give the bonuses described on the Tale cards.${m.solo ? " The Automa never receives Path tokens." : ""}`, `<strong>Fichas de Caminho:</strong> quem tiver mais Símbolos da carta de Conto da esquerda recebe a ficha do Caminho da Esquerda; o mesmo para a da Direita. Empates pela trilha de Iniciativa. Essas fichas dão os bônus descritos nas cartas de Conto.${m.solo ? " O Automa nunca recebe fichas de Caminho." : ""}`),
          t("<strong>Clean up Timelines</strong> and keep cards for the next Chapter (below).", "<strong>Limpar as Linhas do Tempo</strong> e guardar cartas para o próximo Capítulo (abaixo)."),
          t("<strong>Continue the Tale:</strong> put all Destiny tokens aside (including any set aside on a tie); they are used again in the next Chapter, where each Turn again takes the token with its number — stack them as in setup, III at the bottom and I on top. The bottom of the Tale card with the Dominating Symbol points to the next Tale card; flip through the Tale to it. Read the Tale cards and apply all effects (discard the Path tokens after their bonuses are awarded). Stop reading when a card asks you to prepare the next Chapter, which shows the new Active Symbols; then start its first Turn.", "<strong>Continuar o Conto:</strong> deixe todas as fichas de Destino de lado (inclusive as separadas por empate); elas voltam a ser usadas no próximo Capítulo, em que cada Turno de novo usa a ficha com o seu número — empilhe-as como na preparação, III embaixo e I em cima. A parte de baixo da carta de Conto do Símbolo Dominante indica a próxima carta; folheie o Conto até ela. Leia as cartas e aplique todos os efeitos (descarte as fichas de Caminho depois de concedidos os bônus). Pare quando uma carta pedir para preparar o próximo Capítulo, que mostra os novos Símbolos Ativos; então comece o primeiro Turno dele.")
        ]) + para(t("Example: Diplomacy dominates and Fight is Non-Dominating. A player gathered 3 Fight and 4 Diplomacy: they gain 4 Victory Points and 3 Experience Points.", "Exemplo: Diplomacia domina e Luta é Não Dominante. Um jogador juntou 3 de Luta e 4 de Diplomacia: ganha 4 Pontos de Vitória e 3 Pontos de Experiência.")), refs("core", 18, 19))}
        ${extraLines.length ? block(t("This match adds", "Esta partida acrescenta"), list(extraLines)) : ""}
        ${block(t("Clean up Timelines", "Limpar as Linhas do Tempo"), list(cleanupLines()), ref("core", 18))}`;
    }
    return `
      ${sectionHeading("chapter-end", t("Each Chapter", "Cada Capítulo"), index, m.isLM ? refs("legendary", 10, 13, 14) : refs("core", 18, 19))}
      ${body}`;
  }

  function gameEndSection(index) {
    const m = match();
    let body;
    if (m.isLM) {
      body = list([
        t("At the end of the 3rd Chapter, after the Fight damage, you have a last chance: each player checks where their Golden Experience marker stands against the Victory Point marks of their Experience track and deals that value as damage to the Monster instead of gaining Victory Points.", "No fim do 3º Capítulo, depois do dano de Luta, vocês têm uma última chance: cada jogador confere onde está o marcador Dourado de Experiência em relação às marcas de Pontos de Vitória da trilha e causa esse valor como dano ao Monstro em vez de ganhar Pontos de Vitória."),
        t("Monster at 0 Life or below: you win. Otherwise, you lose.", "Monstro com Vida 0 ou menos: vocês vencem. Senão, vocês perdem."),
        t("At any moment, if any player loses their last Health Point, the game is immediately lost.", "A qualquer momento, se algum jogador perder o último Ponto de Saúde, a partida está perdida na hora.")
      ]);
    } else if (m.isWH) {
      body = list([
        t("After the 3rd Chapter, do not discard anything until you reach the epilogue. Score the 3rd Chapter normally.", "Depois do 3º Capítulo, não descarte nada até chegar ao epílogo. Pontue o 3º Capítulo normalmente."),
        t(`Experience bonus: only 1 Hero scores Victory Points for the Heroes from their Experience Points track — choose the Hero with the most Experience. The Wild Hunt scores from its own Experience track (gray marker as the Golden one). As in the core rules, a track scores only once its owner has gained at least 20 Experience Points.`, `Bônus de Experiência: só 1 Herói marca Pontos de Vitória para os Heróis pela trilha de Experiência — escolham o Herói com mais Experiência. A Wild Hunt marca pela própria trilha (marcador cinza como o Dourado). Como nas regras da caixa base, uma trilha só pontua depois que o dono ganhou pelo menos 20 Pontos de Experiência.`),
        m.solo
          ? t("Your Hero scores Victory Points for completing their Side Quest (show the cards in hand against the condition). The Automa has no hand and no Side Quest, so it scores none.", "Seu Herói marca Pontos de Vitória pela Missão Secundária cumprida (mostre as cartas da mão contra a condição). O Automa não tem mão nem Missão Secundária, então não marca nenhuma.")
          : t("The Wild Hunt and the Heroes score Victory Points for completing their Side Quests (show the cards in hand against the condition).", "A Wild Hunt e os Heróis marcam Pontos de Vitória pelas Missões Secundárias cumpridas (mostrem as cartas da mão contra a condição)."),
        m.solo ? interpretation(t("the Wild Hunt rulebook does not mention a Side Quest for the Automa; the core solo rules return the Automa Character’s other components to the box, and the Automa plays its drafted cards immediately.", "o manual da Wild Hunt não menciona Missão Secundária para o Automa; as regras solo da caixa base devolvem à caixa os outros componentes do Personagem do Automa, e o Automa joga as cartas escolhidas na hora.")) : "",
        t("The side with more Victory Points wins: the Heroes as a group, or the Wild Hunt. Read the Tale cards to the epilogue.", "O lado com mais Pontos de Vitória vence: os Heróis como grupo, ou a Wild Hunt. Leiam as cartas de Conto até o epílogo."),
        interpretation(t("the Wild Hunt rulebook does not say what happens on a tie; check the final Tale card. The core tiebreak (higher on the Initiative track) is a possible fallback.", "o manual da Wild Hunt não diz o que acontece em empate; confira a carta final do Conto. O desempate da caixa base (mais alto na trilha de Iniciativa) é uma alternativa possível."))
      ]);
    } else {
      const special = [];
      if (m.tale === "striga") {
        special.push(t("Striga: reveal and score the 2 Secret Objectives matching the Dominating Symbol.", "Striga: revele e pontue os 2 Objetivos Secretos do Símbolo Dominante."));
      }
      if (m.tale === "lesser") {
        special.push(t("The Lesser Evil: discard all face-down Alliance cards without effect.", "The Lesser Evil: descarte todas as cartas de Aliança viradas para baixo sem efeito."));
      }
      if (m.tale === "skellige") {
        special.push(t("Skellige: last chance to Identify the Killer, then reveal and score 7/5/3/2.", "Skellige: última chance de Identificar o Assassino, depois revelar e pontuar 7/5/3/2."));
      }
      if (m.tale === "doppler") {
        special.push(t("Doppler: hand cards advance the Goal tokens; reveal Identities and score the Goal and Mistrust.", "Doppler: as cartas da mão avançam as fichas de Objetivo; revelem as Identidades e pontuem Objetivo e Desconfiança."));
      }
      if (m.tale === "dragon") {
        special.push(t("Golden Dragon: if the Dragon survived, regular scoring; the Dragon’s death ends the game early (see the Tale rules).", "Golden Dragon: se o Dragão sobreviveu, pontuação normal; a morte do Dragão encerra a partida antes (veja as regras do Conto)."));
      }
      if (m.tale === "wish") {
        special.push(t("The Last Wish: the Chapter 3 Wish card gives its one-time Victory Points.", "The Last Wish: a carta de Desejo do Capítulo 3 dá seus Pontos de Vitória únicos."));
      }
      if (m.villain === "odimm") {
        special.push(t("Gaunter O’Dimm: each signer gains 2 or loses 3 Victory Points depending on the Pact.", "Gaunter O’Dimm: cada signatário ganha 2 ou perde 3 Pontos de Vitória conforme o Pacto."));
      }
      if (m.voice) {
        special.push(t("Voice of Reason: mark off any achievements met.", "Voice of Reason: risquem as conquistas cumpridas."));
      }
      body = `
        ${para(t("After the 3rd Chapter, players do not discard any cards from their hands and Timelines, or Symbols from their Token pool, until they reach the epilogue. Read the Tale card that describes the final scoring, how the winner is determined and the final act of the story.", "Depois do 3º Capítulo, ninguém descarta cartas da mão ou da Linha do Tempo, nem Símbolos da reserva de fichas, até chegar ao epílogo. Leiam a carta de Conto que descreve a pontuação final, como se define o vencedor e o ato final da história."))}
        ${steps([
          t("Score the 3rd Chapter normally: Victory Points, Experience Points and Left/Right Path tokens.", "Pontue o 3º Capítulo normalmente: Pontos de Vitória, de Experiência e fichas de Caminho."),
          m.sideQuests ? t("Score Side Quests: each player shows the cards in their hand and compares them with the condition of their Side Quest.", "Pontue as Missões Secundárias: cada jogador mostra as cartas da mão e compara com a condição da sua Missão Secundária.") : t("No Side Quests in this match.", "Sem Missões Secundárias nesta partida."),
          t("Score Victory Points for the last spot reached by your Golden Experience marker. A player who has not gained at least 20 Experience Points scores nothing here.", "Marque Pontos de Vitória pelo último espaço alcançado pelo marcador Dourado de Experiência. Quem não ganhou pelo menos 20 Pontos de Experiência não marca nada aqui."),
          special.length ? t(`Tale and module scoring: ${special.join(" ")}`, `Pontuação do Conto e dos módulos: ${special.join(" ")}`) : t("Some Tales have their own special scoring condition (none beyond the Tale cards here).", "Alguns Contos têm condição especial própria (aqui, nada além das cartas de Conto).")
        ])}
        ${para(t(`The player with the most Victory Points wins${m.solo ? " (you against the Automa)" : ""}; on a tie, the player higher on the Initiative track wins. Read the Tale cards to the Epilogue: the winner is remembered as the main hero of the story. Play again to change the path of destiny.`, `Vence quem tiver mais Pontos de Vitória${m.solo ? " (você contra o Automa)" : ""}; em empate, vence quem está mais alto na trilha de Iniciativa. Leiam as cartas até o Epílogo: o vencedor é lembrado como o herói principal da história. Joguem de novo para mudar o caminho do destino.`))}`;
    }
    return `
      ${sectionHeading("game-end", t("End of the game", "Fim da partida"), index, m.isLM ? ref("legendary", 13) : m.isWH ? refs("wildhunt", 10) + " " + ref("core", 19) : ref("core", 19))}
      ${body}`;
  }

  // --- Solo -------------------------------------------------------------------------------

  function soloSection(index) {
    const m = match();
    if (!m.solo || m.isLM) {
      return "";
    }
    return `
      ${sectionHeading("solo", t("Solo: the Automa", "Solo: o Automa"), index, refs("core", 20, 21))}
      ${m.isWH ? para(t("Against the Wild Hunt Automa, follow the core Solo Mode rules below with the Wild Hunt Automa board; the Wild Hunt Step and scoring work as for a Wild Hunt player.", "Contra o Automa da Wild Hunt, siga as regras do Modo Solo da caixa base abaixo com o tabuleiro de Automa da Wild Hunt; a Etapa da Wild Hunt e a pontuação funcionam como para um jogador da Wild Hunt.")) : ""}
      ${block(t("Start of each Chapter", "Início de cada Capítulo"), list([
        t("Flip the Solo Mode Destiny token in the air as many times as the Chapter’s number; the Automa gains the Symbols shown.", "Lance para o alto a ficha de Destino do Modo Solo tantas vezes quanto o número do Capítulo; o Automa ganha os Símbolos mostrados."),
        t("Each Automa board shows 2 Symbols (the Character’s areas of expertise). The Automa gains 1 Symbol token for each of them that matches an Active Symbol.", "Cada tabuleiro de Automa mostra 2 Símbolos (as especialidades do Personagem). O Automa ganha 1 ficha de Símbolo para cada um deles que corresponda a um Símbolo Ativo.")
      ]), ref("core", 20))}
      ${block(t("Automa’s Special Abilities", "Habilidades Especiais do Automa"), list([
        t("The Automa has 2 Special Abilities. They are not one-time: each activates whenever its condition is met.", "O Automa tem 2 Habilidades Especiais. Não são de uso único: cada uma ativa sempre que a condição for cumprida."),
        t("The first is active from the beginning and describes how the Automa gains Experience Points.", "A primeira vale desde o início e descreve como o Automa ganha Pontos de Experiência."),
        t("When the Automa reaches its 8th Experience Point, put its Regular Experience marker on the spot above its second Special Ability to make it available, and place its Golden Experience marker on the 0 spot. Exception: on Death March! the second ability is available from the start.", "Quando o Automa chega ao 8º Ponto de Experiência, coloque o marcador normal de Experiência no espaço acima da segunda Habilidade Especial para liberá-la, e coloque o marcador Dourado no espaço 0. Exceção: no Death March! a segunda habilidade vale desde o início.")
      ]), ref("core", 20))}
      ${block(t("Drafting and playing", "Escolher e jogar"), list([
        t("When the Automa drafts, it takes the pair of cards with the most Active Symbols (ignoring card effects). On a tie, it takes the pair higher in the pool.", "Quando o Automa escolhe, pega o par de cartas com mais Símbolos Ativos (ignorando efeitos). Em empate, pega o par mais alto."),
        t("If no pair shows at least 1 Active Symbol, the Automa draws 2 cards from the Main deck.", "Se nenhum par mostrar pelo menos 1 Símbolo Ativo, o Automa compra 2 cartas do baralho principal."),
        t("The Automa immediately plays the drafted cards to its Timeline and ignores all effects on Action cards.", "O Automa joga imediatamente as cartas escolhidas na Linha do Tempo e ignora todos os efeitos das cartas de Ação."),
        t("Examples: of the pairs, the one with 2 Active Symbols is taken; with two pairs showing 1 each, the topmost is taken.", "Exemplos: entre os pares, o que tem 2 Símbolos Ativos é escolhido; com dois pares com 1 cada, o mais alto é escolhido.")
      ]), refs("core", 20, 21))}
      ${block(t("Destiny and scoring", "Destino e pontuação"), list([
        ...destinyLines({ ...m, isWH: false }),
        t("At the end of each Chapter, Experience and Victory Points are awarded to both you and the Automa with the standard rules. The Automa does not receive Path tokens.", "No fim de cada Capítulo, Pontos de Experiência e de Vitória vão para você e para o Automa pelas regras normais. O Automa não recebe fichas de Caminho."),
        m.isWH ? interpretation(t("the Wild Hunt rulebook only says to follow the core Solo Mode rules. In the Wild Hunt, the Destiny token always follows the Wild Hunt’s Symbols, which here are the Automa’s, so the two rules agree. This guide flips the Solo Mode Destiny token right after you play your cards, as the core rule says, before the Wild Hunt Step; the Wild Hunt Step uses card colors, not Symbols, so the order does not change it.", "o manual da Wild Hunt só manda seguir as regras do Modo Solo da caixa base. Na Wild Hunt, a ficha de Destino sempre segue os Símbolos da Wild Hunt, que aqui são os do Automa, então as duas regras concordam. Este guia lança a ficha de Destino do Modo Solo logo depois de você jogar suas cartas, como diz a regra da caixa base, antes da Etapa da Wild Hunt; a Etapa da Wild Hunt usa as cores das cartas, não os Símbolos, então a ordem não a altera.")) : ""
      ]), ref("core", 21))}`;
  }

  // --- Characters ----------------------------------------------------------------------

  function charactersSection(index) {
    const m = match();
    const items = [];
    if (m.characters.includes("Triss")) {
      items.push(card("Triss", para(t("A powerful sorceress whose abilities can mix things up before the Playing cards Step. Her starting Action card: lose 2 Non-Active Symbols to gain 4 Experience Points.", "Uma feiticeira poderosa cujas habilidades bagunçam as coisas antes da Etapa de Jogar cartas. Sua carta de Ação inicial: perca 2 Símbolos Não Ativos para ganhar 4 Pontos de Experiência.")), m.ownStretch ? ref("stretch", 9) : ref("grain", 5)));
    }
    if (m.characters.includes("Letho")) {
      items.push(card("Letho", list([
        t("His first Ability is not available from the beginning of the game.", "A primeira Habilidade dele não está disponível no início da partida."),
        t("Use Letho’s Abilities after all other players, ignoring the Initiative order.", "Use as Habilidades de Letho depois de todos os outros jogadores, ignorando a ordem de Iniciativa."),
        t("If Letho uses an Ability and cannot draw any card, the Ability still counts as used.", "Se Letho usar uma Habilidade e não conseguir comprar nenhuma carta, a Habilidade conta como usada mesmo assim."),
        t("His 4-color card follows all the rules for multicolor cards.", "A carta de 4 cores dele segue todas as regras de cartas multicoloridas."),
        t("Letho cannot be chosen as the player’s Character in Solo mode.", "Letho não pode ser escolhido como Personagem do jogador no modo Solo.")
      ]), ref("stretch", 9)));
    }
    if (m.characters.includes("Yarpen")) {
      items.push(card("Yarpen", para(t("Use Yarpen’s Abilities before all other players, ignoring the Initiative order.", "Use as Habilidades de Yarpen antes de todos os outros jogadores, ignorando a ordem de Iniciativa.")), ref("stretch", 10)));
    }
    if (m.characters.includes("Dijkstra")) {
      items.push(card("Dijkstra", list([
        t("When using his 4th Ability, Dijkstra cannot use the extra effect if he is already last in the Initiative order.", "Ao usar a 4ª Habilidade, Dijkstra não pode usar o efeito extra se já for o último na ordem de Iniciativa."),
        t("His starting Action card: have at least 3 cards of the same color (red, yellow or green) in your Timeline to gain 1 Symbol of each type.", "Sua carta de Ação inicial: tenha pelo menos 3 cartas da mesma cor (vermelha, amarela ou verde) na Linha do Tempo para ganhar 1 Símbolo de cada tipo.")
      ]), ref("stretch", 10)));
    }
    if (m.characters.includes("Regis")) {
      items.push(card("Regis", para(t("His skills gain energy from Lost Symbols. One of his starting Action cards has no color of its own: once played to a Timeline, it takes the color of the preceding card. When that card is drawn for any effect that checks card color, ignore it and draw another.", "As habilidades dele se alimentam de Símbolos Perdidos. Uma das cartas de Ação iniciais não tem cor própria: depois de jogada na Linha do Tempo, ela assume a cor da carta anterior. Quando essa carta for comprada por um efeito que confere cor, ignore-a e compre outra.")), ref("stretch", 11)));
    }
    if (m.isWH && m.characters.includes("Dandelion")) {
      items.push(card("Dandelion", para(t("In the Wild Hunt, when Dandelion activates his 3rd Ability, only the Wild Hunt is affected by the “each other Player” part.", "Na Wild Hunt, quando Dandelion ativa a 3ª Habilidade, só a Wild Hunt é afetada pela parte “cada outro Jogador”.")), ref("wildhunt", 8)));
    }
    if (m.isLM && m.solo && m.characters.includes("Yarpen")) {
      items.push(card(t("Yarpen (Legendary Monsters solo)", "Yarpen (solo de Legendary Monsters)"), para(t("His 1st and 3rd Abilities trigger as they would against opponents with no Symbols — but you still need at least 1 Symbol.", "A 1ª e a 3ª Habilidades disparam como se os oponentes não tivessem Símbolos — mas você ainda precisa de pelo menos 1 Símbolo.")), ref("legendary", 14)));
    }
    if (m.roach) {
      items.push(card("Geralt on Roach", para(t("Counts as Geralt for the starting Initiative order. When his Ability reveals a multicolor card, choose any of its colors; a colorless card is ignored and another is revealed.", "Conta como Geralt na ordem inicial de Iniciativa. Quando a Habilidade dele revela uma carta multicolorida, escolha qualquer cor; uma carta sem cor é ignorada e outra é revelada.")), ref("roach", 2)));
    }
    if (!items.length) {
      return "";
    }
    return `
      ${sectionHeading("characters", t("Character notes", "Notas de Personagens"), index, m.ownStretch ? refs("stretch", 9, 10, 11) : ref("core", 13))}
      <p class="section-lead">${t("Abilities are printed on the Player boards; these are the rulebook clarifications for the Characters in your pool.", "As Habilidades estão impressas nos tabuleiros; estas são as explicações do manual para os Personagens disponíveis.")}</p>
      <div class="quick-grid">${items.join("")}</div>`;
  }

  // --- Action card effects ---------------------------------------------------------------

  function effectsSection(index) {
    return `
      ${sectionHeading("effects", t("Action card effects", "Efeitos das cartas de Ação"), index, ref("core", 28))}
      ${block(t("How effects work", "Como os efeitos funcionam"), list([
        t("An effect affects: the card itself, all previous cards in your Timeline, and all Symbols in your Token pool.", "Um efeito afeta: a própria carta, todas as cartas anteriores da Linha do Tempo e todos os Símbolos da reserva de fichas."),
        t("Its result applies only if its condition is met. A condition may require having a specific Symbol or card color, or losing a specific Symbol.", "O resultado só vale se a condição for cumprida. Uma condição pode exigir ter um Símbolo ou cor de carta específicos, ou perder um Símbolo específico."),
        t("You must always apply the effect of a played card to the maximum possible extent; you may not forfeit it.", "Você sempre deve aplicar o efeito de uma carta jogada o máximo possível; não pode abrir mão."),
        t("Unlike single effects, the result of a 1-3 multiple effect varies with the level the condition is met.", "Ao contrário dos efeitos simples, o resultado de um efeito múltiplo 1-3 varia com o nível em que a condição é cumprida."),
        t("If an effect removes a Symbol, you choose any matching one: discard a Symbol token or cover a Symbol on a card with a Lost Symbol token.", "Se um efeito remove um Símbolo, você escolhe qualquer um correspondente: descarte uma ficha de Símbolo ou cubra um Símbolo numa carta com ficha de Símbolo Perdido."),
        t("If a condition requires an exact number of Symbols or colors and you exceed it, you do not meet the condition.", "Se uma condição exige um número exato de Símbolos ou cores e você passa dele, não cumpre a condição.")
      ]), ref("core", 28))}
      <div class="quick-grid">
        ${card(t("Conditions", "Condições"), list([
          t("Lose a Symbol (e.g. Exploration).", "Perca um Símbolo (ex.: Exploração)."),
          t("Lose 1/2/3 Symbols (e.g. Exploration).", "Perca 1/2/3 Símbolos (ex.: Exploração)."),
          t("Lose 1/2/3 Non-Active Symbols.", "Perca 1/2/3 Símbolos Não Ativos."),
          t("Have 2 or more cards of a specific color (e.g. red) in your Timeline.", "Tenha 2 ou mais cartas de uma cor (ex.: vermelha) na Linha do Tempo."),
          t("Have 3 or more cards of a specific color in your Timeline.", "Tenha 3 ou mais cartas de uma cor na Linha do Tempo."),
          t("Have exactly 1 card of a specific color (e.g. green) in your Timeline.", "Tenha exatamente 1 carta de uma cor (ex.: verde) na Linha do Tempo."),
          t("Have exactly 2 cards of a specific color in your Timeline.", "Tenha exatamente 2 cartas de uma cor na Linha do Tempo."),
          t("Have 1/2/3 cards of a specific color in your Timeline.", "Tenha 1/2/3 cartas de uma cor na Linha do Tempo."),
          t("Have 1/2/3 Non-Active Symbols in your Timeline.", "Tenha 1/2/3 Símbolos Não Ativos na Linha do Tempo."),
          t("Have 2 or more Non-Active Symbols in your Timeline.", "Tenha 2 ou mais Símbolos Não Ativos na Linha do Tempo.")
        ]), ref("core", 28))}
        ${card(t("Results", "Resultados"), list([
          t("Gain 3 Experience Points.", "Ganhe 3 Pontos de Experiência."),
          t("Gain 1/2/3 Experience Points (by the level the condition is met).", "Ganhe 1/2/3 Pontos de Experiência (pelo nível da condição)."),
          t("Gain 1/2/3 Active Symbols of the Left Path, or of the Right Path.", "Ganhe 1/2/3 Símbolos Ativos do Caminho da Esquerda, ou do da Direita."),
          t("Gain 2 Active Symbols of the Left Path, or of the Right Path.", "Ganhe 2 Símbolos Ativos do Caminho da Esquerda, ou do da Direita."),
          t("Gain 1 of each Active Symbol.", "Ganhe 1 de cada Símbolo Ativo."),
          t("Gain 2 shown Symbols (e.g. 2 Fight).", "Ganhe 2 Símbolos mostrados (ex.: 2 de Luta)."),
          t("Gain 1/2/3 shown Symbols (by the level the condition is met).", "Ganhe 1/2/3 Símbolos mostrados (pelo nível da condição)."),
          t("Gain the shown Symbols: 1 Fight, 1 Exploration and 1 Magic.", "Ganhe os Símbolos mostrados: 1 de Luta, 1 de Exploração e 1 de Magia.")
        ]), ref("core", 28))}
      </div>`;
  }

  // --- Rulebook gaps ------------------------------------------------------------------------

  function gapsSection(index) {
    const m = match();
    const gaps = [];
    if (m.isTale && m.tale === "striga") {
      gaps.push(t("Striga lists 2 Special Symbol tokens in its contents but gives no rule for them in the rulebook; they are used as the Tale cards instruct.", "Striga lista 2 fichas de Símbolo Especial no conteúdo, mas o manual não dá regra para elas; são usadas como as cartas de Conto mandarem."));
    }
    if (m.isTale && m.tale === "grain" && (m.solo || m.players === 2)) {
      gaps.push(t("A Grain of Truth does not explain how Nivellen’s vote combines with the 2-player exception or the solo Automa (see the Tale rules).", "A Grain of Truth não explica como o voto de Nivellen se combina com a exceção de 2 jogadores ou com o Automa solo (veja as regras do Conto)."));
    }
    if (m.isTale && m.tale === "grain") {
      gaps.push(t("A Grain of Truth says the Determination and Authority tokens are used “at the end of future Turns”, while each one names its own moment (the Mystery card at the end of a Chapter, the Destiny vote). This guide uses each at the moment it names.", "A Grain of Truth diz que as fichas de Determinação e Autoridade são usadas “no fim de Turnos futuros”, enquanto cada uma indica o próprio momento (a carta de Mistério no fim de um Capítulo, a votação do Destino). Este guia usa cada uma no momento que ela indica."));
    }
    if (m.isTale && m.tale === "dragon") {
      gaps.push(t("Golden Dragon: whether Side Quests and the Golden Experience bonus are scored after the Dragon’s death is not stated.", "Golden Dragon: não está dito se as Missões Secundárias e o bônus de Experiência Dourada contam depois da morte do Dragão."));
    }
    if (m.companion === "zoltan") {
      gaps.push(t("Zoltan’s Field Marshal Windbag card has no rule in the rulebook; follow its card text.", "A carta Field Marshal Windbag de Zoltan não tem regra no manual; siga o texto da carta."));
    }
    if (m.isWH) {
      gaps.push(t("Wild Hunt: no tiebreak is given between the Heroes and the Wild Hunt.", "Wild Hunt: não há desempate entre os Heróis e a Wild Hunt."));
      if (m.solo && m.characters.includes("Letho")) {
        gaps.push(t("Wild Hunt solo says “choose any of the Characters as your Hero”, while Stretch Goals says Letho cannot be chosen in Solo mode. Leaving Letho out is the safe reading.", "O solo da Wild Hunt diz “escolha qualquer Personagem como seu Herói”, enquanto Stretch Goals diz que Letho não pode ser escolhido no modo Solo. Deixar Letho de fora é a leitura segura."));
      }
    }
    if (m.solo && !m.isLM) {
      gaps.push(t("Solo: the rulebook does not say whether the Automa gains the bottom spot’s Extra Experience Point (its first Special Ability describes how it gains Experience), nor which card(s) the Automa keeps when Timelines are cleaned up between Chapters. Agree on a reading before the game.", "Solo: o manual não diz se o Automa ganha o Ponto de Experiência Extra do espaço de baixo (a primeira Habilidade Especial dele descreve como ele ganha Experiência), nem que carta(s) o Automa guarda na limpeza das Linhas do Tempo entre Capítulos. Combinem uma leitura antes da partida."));
    }
    if (m.characters.includes("Letho") && !(m.solo && m.isTale)) {
      gaps.push(t("Letho: the rulebook says his first Ability is not available from the beginning of the game, but not when it becomes available; follow his Player board.", "Letho: o manual diz que a primeira Habilidade dele não está disponível no início, mas não diz quando passa a estar; siga o tabuleiro dele."));
    }
    if (m.isLM) {
      gaps.push(t("Legendary Monsters never mentions Path tokens (both Paths are Fight); this guide leaves them out.", "Legendary Monsters nunca menciona fichas de Caminho (os dois Caminhos são Luta); este guia as deixa de fora."));
      gaps.push(t("When the Monster drafts the pair next to an unoccupied spot, the rulebook does not say whether a player drafting later in that Turn may still choose the now-empty spot.", "Quando o Monstro pega o par ao lado de um espaço desocupado, o manual não diz se um jogador que escolhe depois naquele Turno ainda pode escolher o espaço agora vazio."));
      if (m.monster === "wildhunt") {
        gaps.push(t("Naglfar (Wild Hunt monster): the rulebook does not say what happens when the Wild Hunt moves to an occupied spot while Naglfar is already on another player’s board, nor whether Naglfar stays on a board into the next Chapter.", "Naglfar (monstro Wild Hunt): o manual não diz o que acontece quando a Wild Hunt vai para um espaço ocupado com Naglfar já no tabuleiro de outro jogador, nem se Naglfar continua num tabuleiro no Capítulo seguinte."));
      }
      if (m.monster === "fourth") {
        gaps.push(t("The fourth monster in the box is not named in the rulebook and has no monster-specific setup there; follow its cards.", "O quarto monstro da caixa não é nomeado no manual e não tem preparação específica ali; siga as cartas dele."));
      }
    }
    gaps.push(t("Card texts (Abilities, Tale cards, Side Quests, Companions, Villains, General Traits and Weaknesses, Monster cards, Runestones, Trail cards, Mystery and Wish cards) are printed on the components, not in the rulebooks; they take precedence over this guide.", "Os textos das cartas (Habilidades, cartas de Conto, Missões Secundárias, Companheiros, Vilões, Traços e Fraquezas dos Generais, cartas de Monstro, Runestones, cartas de Trilha, de Mistério e de Desejo) estão impressos nos componentes, não nos manuais; eles prevalecem sobre este guia."));
    return `
      ${sectionHeading("gaps", t("What the rulebooks leave open", "O que os manuais deixam em aberto"), index, "")}
      <p class="section-lead">${t("Points relevant to this match that the rulebooks do not settle. Where this guide takes a reading, it is marked as such where the rule appears.", "Pontos relevantes para esta partida que os manuais não resolvem. Onde este guia adota uma leitura, ela está marcada no lugar da regra.")}</p>
      ${list(gaps)}`;
  }

  // --- Iconography and glossary -----------------------------------------------------------

  function iconCard(name, title, description, book, page) {
    return `
      <article class="icon-card">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICON_DIR}${name}.webp" alt="${escapeHtml(title)}"></span>
        <div><strong>${title}</strong><p>${description} ${ref(book, page)}</p></div>
      </article>`;
  }

  function iconographySection(index) {
    const items = [
      ["magic", iconLabel("magic"), t("One of the four Symbols.", "Um dos quatro Símbolos."), 6],
      ["diplomacy", iconLabel("diplomacy"), t("One of the four Symbols.", "Um dos quatro Símbolos."), 6],
      ["exploration", iconLabel("exploration"), t("One of the four Symbols.", "Um dos quatro Símbolos."), 6],
      ["fight", iconLabel("fight"), t("One of the four Symbols; the only Active one in Legendary Monsters.", "Um dos quatro Símbolos; o único Ativo em Legendary Monsters."), 6],
      ["left-path", iconLabel("left-path"), t("The light arrow pointing left: the Active Symbol of the left Tale card.", "A seta clara para a esquerda: o Símbolo Ativo da carta de Conto da esquerda."), 16],
      ["right-path", iconLabel("right-path"), t("The dark arrow pointing right: the Active Symbol of the right Tale card.", "A seta escura para a direita: o Símbolo Ativo da carta de Conto da direita."), 16],
      ["victory-point", iconLabel("victory-point"), t("Move your token on the Victory Point track.", "Mova sua ficha na trilha de Pontos de Vitória."), 12],
      ["experience", iconLabel("experience"), t("Move your marker on your Experience Points track.", "Mova seu marcador na trilha de Pontos de Experiência."), 12],
      ["lost-symbol", iconLabel("lost-symbol"), t("Covers a Symbol on a card in your Timeline when you must lose it.", "Cobre um Símbolo numa carta da Linha do Tempo quando você precisa perdê-lo."), 6]
    ];
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), index, refs("core", 6, 12, 16))}
      <p class="section-lead">${t("Symbols cropped from the core rulebook, with their meaning and source page.", "Símbolos recortados do manual base, com o significado e a página de origem.")}</p>
      <div class="icon-grid wpd-icon-grid">${items.map(([name, title, text, page]) => iconCard(name, title, text, "core", page)).join("")}</div>`;
  }

  function glossarySection(index) {
    const m = match();
    const terms = [
      [t("Timeline", "Linha do Tempo (Timeline)"), t("Your tableau: the row of Action cards you played in the current Chapter.", "Seu tableau: a fileira de cartas de Ação que você jogou no Capítulo atual."), "core", 15],
      [t("Token pool", "Reserva de fichas (Token pool)"), t("The Symbol tokens you gained, placed on the left side of your Timeline. Discarded at the end of each Chapter.", "As fichas de Símbolo que você ganhou, à esquerda da Linha do Tempo. Descartadas no fim de cada Capítulo."), "core", 15],
      [t("Active / Non-Active Symbols", "Símbolos Ativos / Não Ativos"), t("The 2 Symbols shown on the Tale cards this Chapter (Left and Right Path) / the other 2.", "Os 2 Símbolos mostrados nas cartas de Conto neste Capítulo (Caminho da Esquerda e da Direita) / os outros 2."), "core", 11],
      [t("Dominating / Non-Dominating Symbol", "Símbolo Dominante / Não Dominante"), t("At the end of a Chapter, the Active Symbol with more Destiny tokens (Victory Points) / the other one (Experience Points).", "No fim de um Capítulo, o Símbolo Ativo com mais fichas de Destino (Pontos de Vitória) / o outro (Pontos de Experiência)."), "core", 18],
      [t("Destiny token", "Ficha de Destino"), t("Numbered I, II, III, one per Turn; placed on the Path chosen that Turn.", "Numeradas I, II, III, uma por Turno; colocada no Caminho escolhido naquele Turno."), "core", 16],
      [t("Path token", "Ficha de Caminho"), t("Left or Right; given at the end of a Chapter to the player with the most Symbols of that Path, for the bonuses on the Tale cards.", "Esquerda ou Direita; dada no fim de um Capítulo a quem tem mais Símbolos daquele Caminho, pelos bônus das cartas de Conto."), "core", 18],
      [t("Spot", "Espaço"), t("A row of the playmat holding a pair of face-up Action cards; the topmost spot draws from the Main deck.", "Uma fileira do tapete com um par de cartas de Ação viradas para cima; o espaço mais alto compra do baralho principal."), "core", 14],
      [t("Multicolor card", "Carta multicolorida"), t("Has all of its banner colors at the same time, unless stated otherwise.", "Tem todas as cores das faixas ao mesmo tempo, salvo indicação contrária."), "core", 7],
      [t("1-3 multiple effect", "Efeito múltiplo 1-3"), t("An effect whose result depends on the level its condition is met (up to 3 times).", "Um efeito cujo resultado depende do nível em que a condição é cumprida (até 3 vezes)."), "core", 15],
      [t("Side Quest", "Missão Secundária (Side Quest)"), t("Each Character’s end-game Victory Point condition, checked against the cards in hand.", "A condição de Pontos de Vitória de fim de jogo de cada Personagem, conferida com as cartas da mão."), "core", 19],
      [t("Golden Experience marker", "Marcador Dourado de Experiência"), t("Tracks Experience beyond 20 and scores Victory Points at the end.", "Registra a Experiência além de 20 e vale Pontos de Vitória no fim."), "core", 12],
      [t("Automa", "Automa"), t("The virtual opponent of the solo game.", "O oponente virtual da partida solo."), "core", 20]
    ];
    if (m.isWH) {
      terms.push([t("Threat track", "Trilha de Ameaça"), t("Each General’s track on the Generals playmat, with bonus spaces, Dire Threat spaces and the Banner at the top.", "A trilha de cada General no tapete dos Generais, com espaços de bônus, espaços de Ameaça Grave e o Estandarte no alto."), "wildhunt", 9]);
      terms.push([t("Defeat (a General)", "Derrotar (um General)"), t("Move him back to his starting space and draw his Weakness card.", "Voltá-lo ao espaço inicial e comprar a carta de Fraqueza dele."), "wildhunt", 8]);
    }
    if (m.isLM) {
      terms.push([t("Attack pool", "Grupo de Ataque"), t("The cards the Monster has drafted or drawn; enough of one color triggers its attack.", "As cartas que o Monstro pegou ou comprou; o suficiente de uma cor dispara o ataque dele."), "legendary", 11]);
      terms.push([t("Wound / Health Point", "Ferimento / Ponto de Saúde"), t("Suffering a Wound flips a Health Point token; losing the last one loses the game.", "Sofrer um Ferimento vira uma ficha de Ponto de Saúde; perder a última perde a partida."), "legendary", 12]);
    }
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), index, ref("core", 22))}
      <dl class="wpd-glossary">${terms.map(([term, definition, book, page]) => `<div><dt>${term}</dt><dd>${definition} ${ref(book, page)}</dd></div>`).join("")}</dl>`;
  }

  // --- Page ------------------------------------------------------------------------------

  function navigation() {
    const m = match();
    const items = [
      ["configure-title", t("Match", "Partida")],
      ["overview", t("Overview", "Visão geral")],
      ["quick", t("Quick ref", "Referência")],
      ["setup", t("Setup", "Preparação")],
      ["turn", t("Turn", "Turno")],
      m.isWH ? ["wh-step", "Wild Hunt"] : null,
      m.isLM ? ["monster", t("Monster", "Monstro")] : null,
      m.isTale ? ["tale-rules", t("Tale", "Conto")] : null,
      ["chapter-end", t("Chapter", "Capítulo")],
      ["game-end", t("Game end", "Fim")],
      m.solo && !m.isLM ? ["solo", "Solo"] : null,
      (m.companion !== "none" || m.villain !== "none" || m.voice || m.roach || m.lmCompanion !== "none") ? ["modules", t("Modules", "Módulos")] : null,
      ["characters", t("Characters", "Personagens")],
      ["effects", t("Effects", "Efeitos")],
      ["gaps", t("Open points", "Em aberto")],
      ["icons", t("Icons", "Ícones")],
      ["glossary", t("Glossary", "Glossário")]
    ].filter(Boolean);
    return `<nav class="wpd-jump" aria-label="${t("Sections", "Seções")}">${items.map(([id, label]) => jump(id, label)).join("")}</nav>`;
  }

  function renderInto(host) {
    root = host;
    const m = match();
    document.body.classList.remove("theme-nem", "theme-avalon", "theme-pagan", "theme-odins-ravens", "theme-western-legends", "theme-lotr");
    document.body.classList.add("theme-witcher");
    document.documentElement.lang = prefs.language;
    document.title = t("The Witcher: Path of Destiny — Field Manual", "The Witcher: Path of Destiny — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "A bilingual interactive rulebook for The Witcher: Path of Destiny and its expansions, with owned boxes, mode, Tale, modules, filtered setup and source references.",
        "Livro de regras interativo e bilíngue de The Witcher: Path of Destiny e expansões, com caixas, modo, Conto, módulos, preparação filtrada e referências."
      );
    }
    const sections = [
      overviewSection,
      quickReference,
      setupSection,
      turnSection,
      wildHuntStepSection,
      monsterSection,
      taleRulesSection,
      chapterEndSection,
      gameEndSection,
      soloSection,
      modulesSection,
      charactersSection,
      effectsSection,
      gapsSection,
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
    const thisMatch = m.isTale ? taleName(m.tale) : m.isWH ? "Wild Hunt" : monsterName(m.monster);
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
          <p class="eyebrow">${t("TABLEAU-BUILDING CARD GAME · CORE + 6 EXPANSIONS · 1–5 PLAYERS", "JOGO DE CARTAS DE TABLEAU · BASE + 6 EXPANSÕES · 1–5 JOGADORES")}</p>
          <h1>The Witcher:<br>Path of Destiny</h1>
          <p class="hero-intro">${t("Become a character from the most iconic Witcher tales and bend the story: the Symbols you play decide which way the Tale turns, and the player who shaped it most is remembered as its hero.", "Seja um personagem dos contos mais icônicos de The Witcher e mude a história: os Símbolos que você joga decidem para onde o Conto vai, e quem mais o moldou é lembrado como o herói.")}</p>
          <div class="hero-meta"><span>${modeName(m.mode)}</span><span>${playersLabel(m.players)}</span><span>${t(`This match: ${thisMatch}`, `Esta partida: ${thisMatch}`)}</span></div>
        </div>
        <figure class="hero-map wpd-cover">
          <img src="assets/covers/witcher-path-of-destiny.webp" alt="${t("Cover of The Witcher: Path of Destiny rulebook", "Capa do manual de The Witcher: Path of Destiny")}">
          <figcaption>${t("Core rulebook · p. 1", "Manual base · p. 1")}</figcaption>
        </figure>
      </div></section>
      <main class="page-wrap content-column wpd-page">
        ${navigation()}
        ${renderConfiguration()}
        ${body}
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal guide for The Witcher: Path of Destiny. It paraphrases the official rulebooks (core, Stretch Goals, A Grain of Truth, Wild Hunt, Legendary Monsters, Naglfar and Geralt on Roach), whose PDFs are included in this repository with permission (manuals/witcher-path-of-destiny_*.pdf). Game design by Łukasz Woźniak; Go On Board and CD PROJEKT RED.",
        "Guia pessoal de The Witcher: Path of Destiny. Parafraseia os manuais oficiais (base, Stretch Goals, A Grain of Truth, Wild Hunt, Legendary Monsters, Naglfar e Geralt on Roach), cujos PDFs estão incluídos neste repositório com autorização (manuals/witcher-path-of-destiny_*.pdf). Design de Łukasz Woźniak; Go On Board e CD PROJEKT RED."
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
    if (target.matches("[data-own]")) {
      const key = target.dataset.own;
      if (OWN_KEYS.includes(key)) {
        commit((draft) => {
          draft[key] = target.checked;
        });
      }
      return;
    }
    if (target.type === "radio" && target.checked && target.dataset.pref) {
      const key = target.dataset.pref;
      const value = target.value;
      commit((draft) => {
        if (key === "players") {
          draft.players = Number(value);
        } else if (["firstPlay", "voice", "roach", "naglfar"].includes(key)) {
          draft[key] = value === "yes";
        } else if (key in draft) {
          draft[key] = value;
        }
      });
    }
  }

  window.WitcherPathOfDestiny = { renderInto, onClick, onChange };
})();
