(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.little-soldiers.v1";
  const SETUP_KEY = "field-manual.little-soldiers.setup.v1";
  const MANUALS = {
    c: "little-soldiers_core.pdf",
    m: "little-soldiers_missions.pdf",
    o: "little-soldiers_modules.pdf"
  };
  const ASSETS = "assets/little-soldiers/";
  const ICONS = `${ASSETS}icons/`;
  const ART = `${ASSETS}art/`;
  // Sources (printed page = PDF page in all three books):
  //  "c" = Bootcamp Book (core rules, 12 pp.), 1 vs 1.
  //  "m" = Mission Book (16 pp.): King of the Hill p. 2–4, Battle Royale p. 5–7, A New Threat p. 8–13,
  //        Another New Threat p. 14, mission report p. 15, icon key p. 16.
  //  "o" = Module Book (16 pp.): Super Soldier p. 3, 2 Against 2 p. 4–5, Levels p. 6–7, Objects p. 8–10,
  //        Reinforcements p. 11, Advanced Tactics p. 12–15, Ultimate Battlefield p. 16.
  const MODES = ["bootcamp", "king", "royale", "threat", "octo"];
  const MODE_RULES = {
    bootcamp: { players: [2, 3, 4], superSoldier: "optional", levels: "optional", objects: "optional", reinforcements: "optional", tactics: "optional" },
    king: { players: [2, 3, 4], superSoldier: "optional", levels: "required", objects: "optional", reinforcements: "none", tactics: "optional" },
    royale: { players: [2, 3, 4, 5, 6], superSoldier: "required", levels: "optional", objects: "optional", reinforcements: "none", tactics: "none" },
    threat: { players: [1, 2, 3, 4], superSoldier: "optional", levels: "none", objects: "none", reinforcements: "solo", tactics: "none" },
    octo: { players: [1, 2, 3, 4], superSoldier: "optional", levels: "none", objects: "none", reinforcements: "solo", tactics: "none" }
  };
  const REINFORCEMENT_COUNTS = [0, 1, 2, 3];
  const defaults = {
    language: "pt-BR",
    mode: "bootcamp",
    players: 2,
    superSoldier: false,
    levels: false,
    objects: false,
    reinforcements: 0,
    tactics: false
  };

  const ICON_NAMES = {
    flag: ["Flag counter", "Marcador de Bandeira"],
    "attack-die": ["Attack die", "Dado de Ataque"],
    "sniper-die": ["Sniper die", "Dado do Sniper"],
    "grenade-die": ["Grenade die", "Dado de Granada"],
    mortar: ["Mortar token", "Ficha de Morteiro"],
    "numbered-block": ["Numbered Block token", "Ficha de Bloco numerada"],
    deployment: ["Deployment token", "Ficha de Posicionamento"],
    "move-token": ["Move token", "Ficha de Movimento"],
    order: ["Order token", "Ficha de Ordem"],
    star: ["Star token", "Ficha de Estrela"],
    heart: ["Heart token", "Ficha de Coração"],
    shield: ["Shield token", "Ficha de Escudo"],
    "green-move": ["Green Move", "Movimento verde"],
    "yellow-move": ["Yellow Move", "Movimento amarelo"],
    "red-move": ["Red Move", "Movimento vermelho"],
    "general-card": ["General card", "Carta de General"],
    "soldier-card": ["Little Soldier card", "Carta de Little Soldier"],
    "new-recruit": ["New Recruit rank", "Patente Recruta"],
    "super-soldier": ["“Super Soldiers” rank", "Patente “Super Soldiers”"],
    defense: ["Defense", "Defesa"],
    toughness: ["Toughness", "Resistência"],
    hit: ["Hit", "Acerto"],
    lightning: ["Lightning", "Raio"],
    boom: ["Boom!", "Bum!"],
    "level-1": ["Level 1 token", "Ficha de Nível 1"],
    "level-2": ["Level 2 token", "Ficha de Nível 2"],
    teleporter: ["Teleporter Object token", "Ficha de Objeto Teletransportador"],
    radar: ["Radar Object token", "Ficha de Objeto Radar"],
    transmogrifier: ["Transmogrifier Object token", "Ficha de Objeto Transmogrificador"],
    marshmallow: ["Marshmallow Object token", "Ficha de Objeto Marshmallow"],
    switch: ["Switch Object token", "Ficha de Objeto Interruptor"],
    "switch-off": ["Switch, red (lights-out) side", "Interruptor, lado vermelho (luz apagada)"],
    candy: ["Candy token", "Ficha de Doce"],
    crate: ["Crate token", "Ficha de Caixote"],
    "bonus-order": ["Bonus Order token", "Ficha de Ordem Bônus"],
    supplies: ["Supplies token", "Ficha de Suprimentos"],
    "tactics-card": ["Tactics card", "Carta de Tática"],
    reaction: ["Reaction", "Reação"],
    ouch: ["Ouch token", "Ficha de Ai! (Ouch)"],
    target: ["Target", "Alvo"],
    "sniper-face-a": ["Sniper die: two-Shield face", "Dado do Sniper: face de dois Escudos"],
    "sniper-face-b": ["Sniper die: Heart face", "Dado do Sniper: face de Coração"]
  };

  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------

  function normalizePreferences(saved) {
    const mode = MODES.includes(saved?.mode) ? saved.mode : defaults.mode;
    const rules = MODE_RULES[mode];
    const players = rules.players.includes(Number(saved?.players)) ? Number(saved.players) : rules.players[0] === 1 ? 2 : rules.players[0];
    const pick = (status, value) => status === "required" ? true : status === "optional" ? value === true : false;
    const superSoldier = pick(rules.superSoldier, saved?.superSoldier);
    let reinforcements = 0;
    if (rules.reinforcements === "optional" && players === 2) {
      const value = Number(saved?.reinforcements);
      reinforcements = REINFORCEMENT_COUNTS.includes(value) ? value : 0;
    } else if (rules.reinforcements === "solo" && players === 1) {
      reinforcements = 2;
    }
    return {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      mode,
      players,
      superSoldier,
      levels: pick(rules.levels, saved?.levels),
      objects: pick(rules.objects, saved?.objects),
      reinforcements,
      // Advanced Tactics must be played with Super Soldier (Module Book p. 12).
      tactics: superSoldier && pick(rules.tactics, saved?.tactics)
    };
  }

  // Every match option changes the physical setup, so all of them form the checklist signature.
  function signature(source = state) {
    return [source.mode, source.players, source.superSoldier ? 1 : 0, source.levels ? 1 : 0, source.objects ? 1 : 0, source.reinforcements, source.tactics ? 1 : 0].join("-");
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Little Soldiers preferences.", error);
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
      console.error("Could not read Little Soldiers setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Little Soldiers preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Little Soldiers setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function manualUrl(code) {
    const script = document.querySelector('script[src*="little-soldiers.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${MANUALS[code[0]]}`, baseUrl).href}#page=${Number(code.slice(1))}`;
  }

  // Page codes: c<n> = Bootcamp Book; m<n> = Mission Book; o<n> = Module Book.
  function referenceLink(code) {
    const page = code.slice(1);
    const label = code[0] === "m"
      ? t(`Missions p. ${page} ↗`, `Missões p. ${page} ↗`)
      : code[0] === "o"
        ? t(`Modules p. ${page} ↗`, `Módulos p. ${page} ↗`)
        : t(`Bootcamp p. ${page} ↗`, `Bootcamp p. ${page} ↗`);
    return `<a class="source-link" href="${manualUrl(code)}" target="_blank" rel="noreferrer">${label}</a>`;
  }

  function refs(codes) {
    return codes.map(referenceLink).join("");
  }

  function sectionHeading(id, title, codes) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("FIELD GUIDE", "GUIA DE CAMPO")} / ${sectionIndex(id)}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="ls-section-references">${refs(codes)}</div>
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
    return `<span class="ls-interpretation">${t("Guide's reading", "Leitura do guia")}:</span> ${t(en, pt)}`;
  }

  function g(file) {
    const alt = ICON_NAMES[file] ? t(ICON_NAMES[file][0], ICON_NAMES[file][1]) : file;
    return `<img class="ls-glyph" src="${ICONS}${file}.webp" alt="${alt}">`;
  }

  function figure(file, altEn, altPt, captionEn, captionPt, extraClass = "") {
    return `<figure class="ls-art ${extraClass}"><img src="${ART}${file}.webp" alt="${t(altEn, altPt)}" loading="lazy"><figcaption>${t(captionEn, captionPt)}</figcaption></figure>`;
  }

  function playersLabel(players = state.players) {
    return players === 1 ? t("1 player (solo)", "1 jogador (solo)") : t(`${players} players`, `${players} jogadores`);
  }

  function isMission() {
    return state.mode !== "bootcamp";
  }

  function isThreat() {
    return state.mode === "threat" || state.mode === "octo";
  }

  function isTeam() {
    return state.mode === "bootcamp" && state.players >= 3;
  }

  function usesBattleTrack() {
    return state.mode === "bootcamp";
  }

  function usesGenerals() {
    return state.mode !== "royale";
  }

  function modeName(mode = state.mode) {
    return {
      bootcamp: t("Bootcamp battle (core rules)", "Batalha do Bootcamp (regras básicas)"),
      king: t("Mission “King of the Hill”", "Missão “King of the Hill” (Rei da Colina)"),
      royale: t("Mission “Battle Royale”", "Missão “Battle Royale”"),
      threat: t("Mission “A New Threat”", "Missão “A New Threat” (Uma Nova Ameaça)"),
      octo: t("Mission “Another New Threat”", "Missão “Another New Threat” (Outra Nova Ameaça)")
    }[mode];
  }

  function moduleName(id) {
    return {
      superSoldier: t("“Super Soldier”", "“Super Soldier” (Super Soldado)"),
      team: t("“2 Against 2”", "“2 Against 2” (2 contra 2)"),
      levels: t("“Levels”", "“Levels” (Níveis)"),
      objects: t("“Objects”", "“Objects” (Objetos)"),
      reinforcements: t("“Reinforcements”", "“Reinforcements” (Reforços)"),
      tactics: t("“Advanced Tactics”", "“Advanced Tactics” (Táticas Avançadas)")
    }[id];
  }

  function activeModules() {
    return [
      state.superSoldier ? "superSoldier" : null,
      isTeam() ? "team" : null,
      state.levels ? "levels" : null,
      state.objects ? "objects" : null,
      state.reinforcements > 0 ? "reinforcements" : null,
      state.tactics ? "tactics" : null
    ].filter(Boolean);
  }

  // Little Soldiers each player has at the start.
  function soldiersPerPlayer() {
    if (state.mode === "royale") {
      return 1;
    }
    return 2 + state.reinforcements;
  }


  // ---------- sections ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["aim", t("Aim & winning", "Objetivo e vitória")],
      ["round", t("The round", "A rodada")],
      ["turn", t("Your turn", "Seu turno")],
      ["attack", t("Attacking & damage", "Ataque e dano")],
      ["soldiers", t("Little Soldiers", "Little Soldiers")],
      isMission() ? ["mission", t("Mission rules", "Regras da missão")] : null,
      activeModules().length ? ["modules", t("Modules in play", "Módulos em jogo")] : null,
      ["icons", t("Icons", "Ícones")],
      ["examples", t("Examples", "Exemplos")],
      ["faq", t("Guide's readings", "Leituras do guia")],
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
          <span class="brand-mark" aria-hidden="true">LS</span>
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
      <label class="ls-choice-card ${checked ? "is-selected" : ""} ${disabled ? "is-disabled" : ""}">
        <input type="radio" name="${name}" value="${value}" data-${dataAttr}="${value}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}>
        <span class="ls-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function modeDescription(mode) {
    return {
      bootcamp: t("The Bootcamp Book's battle: 2 squads (green vs yellow) fight over 3 rounds; break enemy Little Soldiers to push the Flag to your Victory zone. 2 players, or 3–4 players with the “2 Against 2” module (added automatically). All modules may be added.", "A batalha do Bootcamp: 2 esquadrões (verde contra amarelo) lutam por 3 rodadas; quebre Little Soldiers inimigos para empurrar a Bandeira à sua zona de Vitória. 2 jogadores, ou 3–4 jogadores com o módulo “2 Against 2” (incluído automaticamente). Todos os módulos podem ser acrescentados."),
      king: t("Every player for themselves (2–4). Climb a 2-storey hill in the middle and stay there: at each round's end, soldiers on Level 1 or 2 earn Candy. No Battle Track. Requires “Levels”; optional “Super Soldier”, “Objects”, “Advanced Tactics”. Extra: Candy and Level tokens.", "Cada um por si (2–4). Suba numa colina de 2 andares no centro e fique lá: no fim de cada rodada, soldados no Nível 1 ou 2 ganham Doces. Sem Trilha de Batalha. Exige “Levels”; opcionais “Super Soldier”, “Objects”, “Advanced Tactics”. Extras: fichas de Doce e de Nível."),
      royale: t("2–6 players, 1 Little Soldier each, no Generals: parachute in by catapult, grab Supplies to become a Super Soldier, and be the last one standing. Broken players keep firing Mortars. Requires “Super Soldier”; optional “Levels”, “Objects”. Extra: Supplies tokens.", "2–6 jogadores, 1 Little Soldier cada, sem Generais: aterrisse de paraquedas pela catapulta, pegue Suprimentos para virar Super Soldado e seja o último de pé. Quem é quebrado continua disparando Morteiros. Exige “Super Soldier”; opcionais “Levels”, “Objects”. Extra: fichas de Suprimentos."),
      threat: t("Co-operative, 1–4 players: break 3 Threat toys printed on the box bottom (Pinky, Howdy, Bob) before the end of round 3. Switch off each Threat's Force Field first; after every player turn, the Threats remove cover and attack. Solo needs “Reinforcements”; optional “Super Soldier”. Extra: box bottom, Ouch tokens.", "Cooperativo, 1–4 jogadores: quebrem 3 brinquedos Ameaça impressos no fundo da caixa (Pinky, Howdy, Bob) antes do fim da rodada 3. Desliguem antes o Campo de Força de cada Ameaça; depois de cada turno de jogador, as Ameaças tiram cobertura e atacam. Solo exige “Reinforcements”; opcional “Super Soldier”. Extras: fundo da caixa, fichas Ouch."),
      octo: t("Same as “A New Threat” but against OCTOCUTIE, an octopus in 3 parts (Head + 2 Tentacles) with 4 Force Field Switches; the Head's field drops only when Switches 2 and 4 are both off. 1–4 players.", "Igual a “A New Threat”, mas contra OCTOCUTIE, um polvo em 3 partes (Cabeça + 2 Tentáculos) com 4 Interruptores de Campo de Força; o campo da Cabeça só cai com os Interruptores 2 e 4 desligados ao mesmo tempo. 1–4 jogadores.")
    }[mode];
  }

  function playerChoiceText(n) {
    const mode = state.mode;
    if (mode === "bootcamp") {
      return n === 2
        ? t("1 vs 1, as in the Bootcamp Book: each player has a General and 2 Little Soldiers.", "1 contra 1, como no Bootcamp: cada jogador tem um General e 2 Little Soldiers.")
        : n === 3
          ? t("“2 Against 2” module: two teams of 2 Generals; one player commands both Generals of their team.", "Módulo “2 Against 2”: duas equipes de 2 Generais; um jogador comanda os dois Generais da sua equipe.")
          : t("“2 Against 2” module: two teams of 2 players, each with their own General and 2 Little Soldiers.", "Módulo “2 Against 2”: duas equipes de 2 jogadores, cada um com seu General e 2 Little Soldiers.");
    }
    if (mode === "king") {
      return t(`${n === 2 ? 7 : 11} Candy tokens in the Reserve. Each player: General, Infantry + 1 other Little Soldier.`, `${n === 2 ? 7 : 11} fichas de Doce na Reserva. Cada jogador: General, Infantry + 1 outro Little Soldier.`);
    }
    if (mode === "royale") {
      return t(`${n} Little Soldiers on the battlefield, one each; ${n} Numbered Block tokens (1–${n}) decide turn order every round.`, `${n} Little Soldiers no campo, um por jogador; ${n} fichas de Bloco (1–${n}) decidem a ordem dos turnos a cada rodada.`);
    }
    return n === 1
      ? t("Solo: you command 4 Little Soldiers of your choice (“Reinforcements” rules: 2 extra Order tokens on your General). Flag starts on the 1–2 space.", "Solo: você comanda 4 Little Soldiers à sua escolha (regras de “Reinforcements”: 2 fichas de Ordem extras no seu General). A Bandeira começa no espaço 1–2.")
      : n === 2
        ? t("Each player: General, Infantry + 1 other Little Soldier. Flag starts on the 1–2 space.", "Cada jogador: General, Infantry + 1 outro Little Soldier. A Bandeira começa no espaço 1–2.")
        : t(`Each player: General, 1 Infantry + 1 other, different Little Soldier type. Flag starts on the ${n} space.`, `Cada jogador: General, 1 Infantry + 1 outro Little Soldier de tipo diferente. A Bandeira começa no espaço ${n}.`);
  }

  function statusText(status) {
    return status === "required"
      ? t("Required by this mission.", "Obrigatório nesta missão.")
      : t("Not used in this mode.", "Não usado neste modo.");
  }

  function yesNoGroup(group, attr, current, status, noTitle, noText, yesTitle, yesText) {
    const locked = status === "required" || status === "none";
    return `
      <div class="ls-choice-grid">
        ${choiceCard(group, attr, "no", !current, noTitle, locked && status === "required" ? `${noText} <em>${statusText(status)}</em>` : noText, status === "required")}
        ${choiceCard(group, attr, "yes", current, yesTitle, locked && status === "none" ? `${yesText} <em>${statusText(status)}</em>` : yesText, status === "none")}
      </div>`;
  }

  function moduleStatus(id) {
    const rules = MODE_RULES[state.mode];
    if (id === "tactics") {
      if (rules.tactics === "none") {
        return "none";
      }
      return state.superSoldier ? "optional" : "blocked";
    }
    return rules[id];
  }

  function matchConfiguration() {
    const rules = MODE_RULES[state.mode];
    const yes = (flag) => flag ? t("Yes", "Sim") : t("No", "Não");
    const tacticsStatus = moduleStatus("tactics");
    const reinforcementGroup = () => {
      if (rules.reinforcements === "solo") {
        return `<p class="ls-choice-note">${state.players === 1
          ? t("Solo play: “Reinforcements” is required and fixed at 2 extra Little Soldiers (4 in total).", "Jogo solo: “Reinforcements” é obrigatório e fixo em 2 Little Soldiers extras (4 no total).")
          : t("Only used in solo play (choose 1 player above).", "Só é usado no jogo solo (escolha 1 jogador acima).")}</p>`;
      }
      if (rules.reinforcements === "none" || state.players !== 2) {
        return `<p class="ls-choice-note">${rules.reinforcements === "none"
          ? t("Not used in this mission.", "Não usado nesta missão.")
          : t("Cannot be combined with “2 Against 2” (3–4 players).", "Não pode ser combinado com “2 Against 2” (3–4 jogadores).")}</p>`;
      }
      return `<div class="ls-choice-grid ls-choice-grid-4">${REINFORCEMENT_COUNTS.map((n) => choiceCard("ls-reinforcements", "reinforcements", n, state.reinforcements === n,
        n === 0 ? t("No — 2 Little Soldiers each", "Não — 2 Little Soldiers cada") : t(`+${n} each (${2 + n} Little Soldiers)`, `+${n} cada (${2 + n} Little Soldiers)`),
        n === 0
          ? t("The standard squad: Infantry + 1 other.", "O esquadrão padrão: Infantry + 1 outro.")
          : t(`Each side adds ${n} more card${n > 1 ? "s" : ""} and figurine${n > 1 ? "s" : ""} to its HQ and puts ${n} Order token${n > 1 ? "s" : ""} of its colour directly on its General (the 3 on the Chest lid stay). Round 1 then has ${1 + n} Orders.`, `Cada lado põe mais ${n} carta${n > 1 ? "s" : ""} e miniatura${n > 1 ? "s" : ""} no QG e ${n} ficha${n > 1 ? "s" : ""} de Ordem da sua cor direto no General (as 3 da tampa do Baú continuam). A rodada 1 tem então ${1 + n} Ordens.`))).join("")}</div>`;
    };
    return `
      <section class="controls-panel ls-config" id="build-match" aria-labelledby="ls-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="ls-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "Pick the way to play (the Bootcamp battle or one of the Mission Book's missions), the number of players and the Module Book's modules. Only choices compatible with the mode can be selected. Changing any of them clears the setup checklist; switching the language clears nothing.",
              "Escolha o modo de jogo (a batalha do Bootcamp ou uma das missões do livro de Missões), o número de jogadores e os módulos do livro de Módulos. Só escolhas compatíveis com o modo podem ser marcadas. Mudar qualquer uma limpa a lista da preparação; trocar o idioma não limpa nada."
            )}</p>
          </div>
        </div>
        <fieldset class="ls-choice-group">
          <legend>${t("Mode · selected:", "Modo · selecionado:")} <span>${modeName()}</span></legend>
          <p class="ls-choice-intro">${t("Learn with the Bootcamp battle first: the Module and Mission books only list what they add or change.", "Aprenda primeiro com a batalha do Bootcamp: os livros de Módulos e Missões só listam o que acrescentam ou mudam.")} ${refs(["c1", "m1", "o2"])}</p>
          <div class="ls-choice-grid ls-choice-grid-modes">
            ${MODES.map((mode) => choiceCard("ls-mode", "mode", mode, state.mode === mode, modeName(mode), modeDescription(mode))).join("")}
          </div>
        </fieldset>
        <fieldset class="ls-choice-group">
          <legend>${t("Players · selected:", "Jogadores · selecionado:")} <span>${playersLabel()}</span></legend>
          <p class="ls-choice-intro">${t("Player counts allowed by the selected mode.", "Números de jogadores permitidos pelo modo escolhido.")} ${refs(state.mode === "bootcamp" ? ["c1", "o4"] : state.mode === "king" ? ["m2"] : state.mode === "royale" ? ["m5"] : ["m8"])}</p>
          <div class="ls-choice-grid ls-choice-grid-players">
            ${rules.players.map((n) => choiceCard("ls-players", "players", n, state.players === n, playersLabel(n), playerChoiceText(n))).join("")}
          </div>
        </fieldset>
        <fieldset class="ls-choice-group">
          <legend>${t("Module “Super Soldier” · selected:", "Módulo “Super Soldier” · selecionado:")} <span>${yes(state.superSoldier)}</span></legend>
          <p class="ls-choice-intro">${t("Little Soldier cards have a New Recruit side (one chevron) and a “Super Soldiers” side (two chevrons) with extra abilities.", "As cartas de Little Soldier têm um lado Recruta (uma divisa) e um lado “Super Soldiers” (duas divisas) com habilidades extras.")} ${refs(["o3"])}</p>
          ${yesNoGroup("ls-super", "super", state.superSoldier, rules.superSoldier,
            t("No — New Recruits", "Não — Recrutas"),
            t("Cards stay on the New Recruit side; any Lightning rolled counts as a blank.", "As cartas ficam no lado Recruta; todo Raio rolado conta como face vazia."),
            t("Yes — Super Soldiers", "Sim — Super Soldados"),
            state.mode === "royale"
              ? t("Cards start on the New Recruit side and flip to the Super Soldiers side when your soldier grabs Supplies. Lightning results trigger the card's special ability; each Move can remove 1 Heart.", "As cartas começam no lado Recruta e viram para o lado Super Soldiers quando seu soldado pega Suprimentos. Raios ativam a habilidade especial da carta; cada Movimento pode tirar 1 Coração.")
              : t("Flip every Little Soldier card to its Super Soldiers side. Each Lightning rolled in an Attack triggers that soldier's special ability once; each Move can remove 1 Heart from the moving soldier.", "Vire todas as cartas de Little Soldier para o lado Super Soldiers. Cada Raio rolado num Ataque ativa uma vez a habilidade especial do soldado; cada Movimento pode tirar 1 Coração do soldado que se move."))}
        </fieldset>
        <fieldset class="ls-choice-group">
          <legend>${t("Module “Levels” · selected:", "Módulo “Levels” · selecionado:")} <span>${yes(state.levels)}</span></legend>
          <p class="ls-choice-intro">${t("Climb onto flat-topped scenery marked with Level tokens; attacking from higher up gives 1 extra reroll.", "Suba em cenários de topo plano marcados com fichas de Nível; atacar de cima dá 1 rolagem extra.")} ${refs(["o6", "o7"])}</p>
          ${yesNoGroup("ls-levels", "levels", state.levels, rules.levels,
            t("No — ground level only", "Não — só no chão"),
            t("Scenery is just an obstacle; nobody climbs.", "O cenário é só obstáculo; ninguém sobe."),
            t("Yes — climbable scenery", "Sim — cenário escalável"),
            state.mode === "king"
              ? t("The central hill is Level 1 (big block) with Level 2 on top; only soldiers carrying a Level token may climb.", "A colina central é Nível 1 (bloco grande) com o Nível 2 em cima; só soldados com uma ficha de Nível podem subir.")
              : t("2 Level 1 tokens go on flat-topped scenery (free mode: as many as you like, Level 2 on taller pieces). A Move whose cord touches that scenery climbs up and ends.", "2 fichas de Nível 1 vão em cenários de topo plano (modo livre: quantas quiserem, Nível 2 nas peças mais altas). Um Movimento cujo cordão toca esse cenário sobe e termina."))}
        </fieldset>
        <fieldset class="ls-choice-group">
          <legend>${t("Module “Objects” · selected:", "Módulo “Objects” · selecionado:")} <span>${yes(state.objects)}</span></legend>
          <p class="ls-choice-intro">${t("Object tokens on the table or on scenery; end a Move touching one to use its power.", "Fichas de Objeto na mesa ou no cenário; termine um Movimento encostado em uma para usar seu poder.")} ${refs(["o8", "o9", "o10"])}</p>
          ${yesNoGroup("ls-objects", "objects", state.objects, rules.objects,
            t("No — plain scenery", "Não — cenário comum"),
            t("No Object tokens.", "Sem fichas de Objeto."),
            t("Yes — add Objects", "Sim — acrescentar Objetos"),
            t("First game: the 3 Teleporters only. Free mode: add any Radar, Transmogrifier, Marshmallow or Switch tokens you like (all explained in this guide).", "Primeira partida: só os 3 Teletransportadores. Modo livre: acrescente quaisquer fichas de Radar, Transmogrificador, Marshmallow ou Interruptor (todas explicadas neste guia)."))}
        </fieldset>
        <fieldset class="ls-choice-group">
          <legend>${t("Module “Reinforcements” · selected:", "Módulo “Reinforcements” · selecionado:")} <span>${state.reinforcements ? t(`+${state.reinforcements} Little Soldiers each`, `+${state.reinforcements} Little Soldiers cada`) : t("No", "Não")}</span></legend>
          <p class="ls-choice-intro">${t("Bigger squads: each side adds the same number of Little Soldiers (each colour has 5 figurines, so at most +3) and 1 Order token per added soldier.", "Esquadrões maiores: cada lado acrescenta o mesmo número de Little Soldiers (cada cor tem 5 miniaturas, então no máximo +3) e 1 ficha de Ordem por soldado acrescentado.")} ${refs(["o11"])}</p>
          ${reinforcementGroup()}
        </fieldset>
        <fieldset class="ls-choice-group">
          <legend>${t("Module “Advanced Tactics” · selected:", "Módulo “Advanced Tactics” · selecionado:")} <span>${yes(state.tactics)}</span></legend>
          <p class="ls-choice-intro">${t("Tactics cards (hand of starting cards per General, more from Crates), Bonus Order tokens and a new chain deployment. Must be played with “Super Soldier”.", "Cartas de Tática (mão inicial por General, mais cartas pelos Caixotes), fichas de Ordem Bônus e um novo posicionamento em corrente. Precisa ser jogado com “Super Soldier”.")} ${refs(["o12", "o13", "o14", "o15"])}</p>
          ${tacticsStatus === "blocked"
            ? `<p class="ls-choice-note">${t("Select “Super Soldier: Yes” first.", "Marque antes “Super Soldier: Sim”.")}</p>`
            : yesNoGroup("ls-tactics", "tactics", state.tactics, tacticsStatus,
              t("No — no Tactics cards", "Não — sem cartas de Tática"),
              t("Standard deployment with the Numbered Block tokens.", "Posicionamento padrão com as fichas de Bloco."),
              t("Yes — Tactics cards", "Sim — cartas de Tática"),
              t("Each General starts with the 3 Tactics cards shown on its back; up to 3 cards per turn; Crates of your colour give 2 cards. Deploy next to your colour's Deployment tokens or in chains.", "Cada General começa com as 3 cartas de Tática mostradas no verso; até 3 cartas por turno; Caixotes da sua cor dão 2 cartas. Posicione perto das fichas de Posicionamento da sua cor ou em corrente."))}
        </fieldset>
        <p class="ls-config-summary"><strong>${t("This match:", "Esta partida:")}</strong> ${modeName()} · ${playersLabel()}${isTeam() ? ` · ${moduleName("team")}` : ""} · ${t(`${soldiersPerPlayer()} Little Soldier${soldiersPerPlayer() > 1 ? "s" : ""} per player`, `${soldiersPerPlayer()} Little Soldier${soldiersPerPlayer() > 1 ? "s" : ""} por jogador`)}${activeModules().filter((id) => id !== "team" && id !== "reinforcements").map((id) => ` · ${moduleName(id)}`).join("")}${state.reinforcements ? ` · ${moduleName("reinforcements")} +${state.reinforcements}` : ""}</p>
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function hqLines() {
    const n = state.players;
    const side = state.superSoldier && state.mode !== "royale"
      ? t(`on their Super Soldiers side ${g("super-soldier")} (“Super Soldier” module).`, `no lado Super Soldiers ${g("super-soldier")} (módulo “Super Soldier”).`)
      : t(`on their New Recruit side ${g("new-recruit")}.`, `no lado Recruta ${g("new-recruit")}.`);
    if (state.mode === "royale") {
      return [
        t(`Each player takes 1 large Little Soldier card of any type and either colour (green or yellow) and places it in front of them on its New Recruit side ${g("new-recruit")}.`, `Cada jogador pega 1 carta grande de Little Soldier de qualquer tipo e qualquer cor (verde ou amarela) e a põe à sua frente no lado Recruta ${g("new-recruit")}.`),
        t(`Place the matching figurine and 1 Order token ${g("order")} of that card's colour just above the card. This is your HQ. Generals, Chests and the Battle Track are not used.`, `Ponha a miniatura correspondente e 1 ficha de Ordem ${g("order")} da cor da carta logo acima da carta. Esse é o seu QG. Generais, Baús e a Trilha de Batalha não são usados.`),
        t("Each figurine must match its card: two players cannot pick the same card.", "Cada miniatura tem de corresponder à sua carta: dois jogadores não podem pegar a mesma carta.")
      ];
    }
    const lines = [];
    if (isTeam()) {
      lines.push(t("Split into 2 teams (green and yellow) at random.", "Dividam-se em 2 equipes (verde e amarela) por sorteio."));
      lines.push(n === 3
        ? t("Each team uses 2 Generals of its colour: the player alone on a team commands both, sitting in front of the HQ of the General they are currently playing (the other HQ stays where it is).", "Cada equipe usa 2 Generais da sua cor: o jogador sozinho numa equipe comanda os dois, sentando-se diante do QG do General que estiver jogando (o outro QG fica onde está).")
        : t("Each player takes 1 large General card of their team's colour.", "Cada jogador pega 1 carta grande de General da cor da sua equipe."));
      lines.push(t("Place the 4 HQs around the Play Zone, alternating team colours (green, yellow, green, yellow).", "Posicione os 4 QGs ao redor da Zona de Jogo, alternando as cores das equipes (verde, amarelo, verde, amarelo)."));
    } else if (state.mode === "king" && n > 2) {
      lines.push(t(`Each player takes 1 large General card ${g("general-card")} (there are 4: 2 green, 2 yellow) and uses that colour's Chest, Order tokens, cards and figurines. Place the HQs around the Play Zone.`, `Cada jogador pega 1 carta grande de General ${g("general-card")} (há 4: 2 verdes, 2 amarelas) e usa o Baú, as fichas de Ordem, as cartas e as miniaturas dessa cor. Posicione os QGs ao redor da Zona de Jogo.`));
    } else if (isThreat() && n > 2) {
      lines.push(t(`Each player takes 1 large General card ${g("general-card")} (2 green, 2 yellow available) and uses that colour's Chest, Order tokens, cards and figurines.`, `Cada jogador pega 1 carta grande de General ${g("general-card")} (há 2 verdes e 2 amarelas) e usa o Baú, as fichas de Ordem, as cartas e as miniaturas dessa cor.`));
    } else if (n === 1) {
      lines.push(t(`Choose a colour and take 1 large General card ${g("general-card")} of that colour.`, `Escolha uma cor e pegue 1 carta grande de General ${g("general-card")} dessa cor.`));
    } else {
      lines.push(t(`Each player chooses a squad colour (green or yellow) and takes 1 large General card ${g("general-card")} of that colour. Place it in front of you, front side up.`, `Cada jogador escolhe a cor do esquadrão (verde ou amarelo) e pega 1 carta grande de General ${g("general-card")} dessa cor. Ponha-a à sua frente, com a frente para cima.`));
    }
    lines.push(state.mode === "king"
      ? t(`Place your Chest card left of your General and put all 3 of your Order tokens ${g("order")} directly on your General card (not on the Chest lid).`, `Ponha a carta de Baú à esquerda do General e coloque as 3 fichas de Ordem ${g("order")} direto na carta de General (não na tampa do Baú).`)
      : t(`Place 1 Chest card of your colour to the left of your General and put 3 Order tokens ${g("order")} of your colour on its lid (the upper half). The Chest's bottom half starts empty.`, `Ponha 1 carta de Baú da sua cor à esquerda do General e coloque 3 fichas de Ordem ${g("order")} da sua cor na tampa (metade de cima). O fundo do Baú (metade de baixo) começa vazio.`));
    if (n === 1) {
      lines.push(t(`To the right of your General, place any 4 large Little Soldier cards ${g("soldier-card")} of your choice (“Reinforcements” module), ${side}`, `À direita do General, ponha 4 cartas grandes de Little Soldier ${g("soldier-card")} à sua escolha (módulo “Reinforcements”), ${side}`));
      lines.push(t("Put 2 Order tokens of your colour directly on your General (1 per Little Soldier beyond the standard 2); the 3 on the Chest lid stay.", "Ponha 2 fichas de Ordem da sua cor direto no General (1 por Little Soldier além dos 2 padrão); as 3 da tampa do Baú continuam."));
    } else {
      const differ = isTeam() || (isThreat() && n > 2);
      lines.push(t(`To the right of your General, place 1 large Infantry card ${g("soldier-card")} and 1 large card of a second Little Soldier${differ ? " of a different type (never 2 Infantry)" : " of your choice"}, ${side}`, `À direita do General, ponha 1 carta grande de Infantry ${g("soldier-card")} e 1 carta grande de um segundo Little Soldier${differ ? " de tipo diferente (nunca 2 Infantry)" : " à sua escolha"}, ${side}`));
      if (state.reinforcements) {
        lines.push(t(`“Reinforcements”: each player adds ${state.reinforcements} more Little Soldier card${state.reinforcements > 1 ? "s" : ""} of their colour (same side up) and puts ${state.reinforcements} Order token${state.reinforcements > 1 ? "s" : ""} of their colour directly on their General.`, `“Reinforcements”: cada jogador acrescenta mais ${state.reinforcements} carta${state.reinforcements > 1 ? "s" : ""} de Little Soldier da sua cor (mesmo lado para cima) e põe ${state.reinforcements} ficha${state.reinforcements > 1 ? "s" : ""} de Ordem da sua cor direto no General.`));
      }
    }
    lines.push(t("Take the figurines of your colour that match your Little Soldier cards and stand each one on its card. Your HQ is now ready; the soldiers enter the Play Zone in Round preparation.", "Pegue as miniaturas da sua cor que correspondem às suas cartas de Little Soldier e ponha cada uma em pé sobre a carta. Seu QG está pronto; os soldados entram na Zona de Jogo na preparação da rodada."));
    if (state.mode === "king") {
      lines.push(t(`Place 1 Level token ${g("level-1")} on your Infantry's card: only soldiers carrying one may climb the hill.`, `Ponha 1 ficha de Nível ${g("level-1")} na carta da sua Infantry: só soldados com uma delas podem subir a colina.`));
    }
    return lines;
  }

  function sceneryLines() {
    const lines = [
      state.mode === "royale" || isThreat() ? "" : t("Divide the Play Zone fairly between the sides. The setup diagram marks 4 hatched zones: put one or several pieces of scenery in each (a mug, a cereal box, the two halves of the game box…). Each must be taller than the figurines.", "Divida a Zona de Jogo de forma justa entre os lados. O diagrama da preparação marca 4 zonas hachuradas: ponha uma ou mais peças de cenário em cada (uma caneca, uma caixa de cereal, as duas metades da caixa do jogo…). Cada uma deve ser mais alta que as miniaturas."),
      state.mode === "royale" || isThreat() ? "" : t("Outside the hatched zones you may add smaller items (car keys, a roll of tape…).", "Fora das zonas hachuradas você pode acrescentar itens menores (chaves, um rolo de fita…)."),
      t("All scenery is an obstacle: figurines must go around it, and it can block line of sight.", "Todo o cenário é obstáculo: as miniaturas precisam contorná-lo, e ele pode bloquear a linha de visão.")
    ];
    if (state.mode === "king") {
      lines.push(t("King of the Hill: in the central hatched zone stack 2 flat scenery pieces wide enough for several Little Soldiers, the smaller one on top of the larger (the hill).", "King of the Hill: na zona hachurada central empilhe 2 peças de cenário planas e largas o bastante para vários Little Soldiers, a menor sobre a maior (a colina)."));
      lines.push(t(`Place 1 Level 1 token ${g("level-1")} on the lower piece and 1 Level 2 token ${g("level-2")} on the higher piece. Put the Flag counter ${g("flag")} in the centre of the Level 2 piece (it only marks the hilltop).`, `Ponha 1 ficha de Nível 1 ${g("level-1")} na peça de baixo e 1 ficha de Nível 2 ${g("level-2")} na de cima. Ponha o marcador de Bandeira ${g("flag")} no centro da peça de Nível 2 (ele só marca o topo).`));
    } else if (state.levels) {
      lines.push(t(`“Levels”: the scenery in the hatched zones should have flat tops large enough for several figurines. Place 1 Level 1 token ${g("level-1")} on a scenery piece in each of the 2 marked zones of the diagram (one on each side).`, `“Levels”: o cenário das zonas hachuradas deve ter topo plano grande o bastante para várias miniaturas. Ponha 1 ficha de Nível 1 ${g("level-1")} numa peça de cenário em cada uma das 2 zonas marcadas no diagrama (uma de cada lado).`));
      lines.push(t(`Free mode: use as many Level tokens as you like; Level 2 ${g("level-2")} goes on scenery higher than Level 1 pieces, or on top of a Level 1 piece (two storeys).`, `Modo livre: use quantas fichas de Nível quiserem; o Nível 2 ${g("level-2")} vai em cenários mais altos que as peças de Nível 1, ou em cima de uma peça de Nível 1 (dois andares).`));
    }
    if (state.mode === "royale") {
      lines.push(t(`Battle Royale: there are no sides. Following the mission's example, spread 5 scenery pieces taller than the figurines across the whole Play Zone (one near the centre, the others around it), and place the 3 Supplies tokens ${g("supplies")} in open spaces between them, away from the edges.`, `Battle Royale: não há lados. Seguindo o exemplo da missão, espalhe 5 peças de cenário mais altas que as miniaturas por toda a Zona de Jogo (uma perto do centro, as outras em volta) e ponha as 3 fichas de Suprimentos ${g("supplies")} em espaços livres entre elas, longe das bordas.`));
    }
    if (isThreat()) {
      lines.push(state.mode === "octo"
        ? t("Following the mission's example: all players sit along one edge. Leave the far edge free for the box bottom. Place 4 scenery pieces taller than the figurines, each big enough to hide a Little Soldier: 2 near your edge (left and right), 1 in the middle and 1 nearer the box.", "Seguindo o exemplo da missão: todos os jogadores ficam ao longo de uma borda. Deixe a borda oposta livre para o fundo da caixa. Ponha 4 peças de cenário mais altas que as miniaturas, cada uma grande o bastante para esconder um Little Soldier: 2 perto da sua borda (esquerda e direita), 1 no meio e 1 mais perto da caixa.")
        : t("Following the mission's example: all players sit along one edge. Leave the far edge free for the box bottom. Place 3 scenery pieces taller than the figurines, each big enough to hide a Little Soldier: 2 near your edge (left and right) and 1 in the middle.", "Seguindo o exemplo da missão: todos os jogadores ficam ao longo de uma borda. Deixe a borda oposta livre para o fundo da caixa. Ponha 3 peças de cenário mais altas que as miniaturas, cada uma grande o bastante para esconder um Little Soldier: 2 perto da sua borda (esquerda e direita) e 1 no meio."));
    }
    if (state.objects) {
      lines.push(t(`“Objects”: place the Object tokens of your choice in the Play Zone, on the table or on scenery. First time: only the 3 Teleporters ${g("teleporter")}.`, `“Objects”: ponha as fichas de Objeto que quiserem na Zona de Jogo, na mesa ou sobre o cenário. Primeira vez: só os 3 Teletransportadores ${g("teleporter")}.`));
      lines.push(t("A token placed on a scenery piece (a soda can, an eraser, a phone…) gives that whole object the token's power.", "Uma ficha colocada numa peça de cenário (uma lata, uma borracha, um celular…) dá a esse objeto inteiro o poder da ficha."));
      lines.push(t(`Switch tokens ${g("switch")} start on their red (lights-out) side ${g("switch-off")}.`, `As fichas de Interruptor ${g("switch")} começam no lado vermelho (luz apagada) ${g("switch-off")}.`));
    }
    return lines;
  }

  function setupPhases() {
    const n = state.players;
    const phases = [];
    phases.push({
      id: "zone",
      title: t("Mark out the Play Zone", "Delimite a Zona de Jogo"),
      codes: ["c2"],
      items: [
        t("Choose a surface where figurines stand up easily and that everyone can reach from all sides (a table or the floor).", "Escolha uma superfície onde as miniaturas fiquem em pé com facilidade e que todos alcancem por todos os lados (uma mesa ou o chão)."),
        t("Mark the Play Zone's edges clearly (a line of books, the table edge, a carpet section…).", "Marque bem as bordas da Zona de Jogo (uma fileira de livros, a borda da mesa, um pedaço de tapete…)."),
        t("Leave room around it for the HQs and the Reserve.", "Deixe espaço em volta para os QGs e a Reserva.")
      ]
    });
    phases.push({
      id: "scenery",
      title: t("Place the scenery", "Monte o cenário"),
      codes: ["c3", ...(state.mode === "king" ? ["m2"] : []), ...(state.levels && state.mode !== "king" ? ["o6", "o7"] : []), ...(state.mode === "royale" ? ["m5"] : []), ...(isThreat() ? ["m8"] : []), ...(state.objects ? ["o8", "o10"] : [])],
      items: sceneryLines()
    });
    if (isThreat()) {
      phases.push({
        id: "threats",
        title: state.mode === "octo" ? t("Set up OCTOCUTIE and the Force Field Switches", "Monte OCTOCUTIE e os Interruptores de Campo de Força") : t("Set up the Threats and the Force Field Switches", "Monte as Ameaças e os Interruptores de Campo de Força"),
        codes: state.mode === "octo" ? ["m8", "m9", "m14"] : ["m8", "m9"],
        items: [
          t("Place 2 Deployment tokens near your edge of the Play Zone, one on the left and one on the right, as in the example (the other 2 stay in the box).", "Ponha 2 fichas de Posicionamento perto da sua borda da Zona de Jogo, uma à esquerda e outra à direita, como no exemplo (as outras 2 ficam na caixa)."),
          state.mode === "octo"
            ? t("Place the box bottom on the far edge with the side showing OCTOCUTIE facing the Play Zone; the outer side, printed with its profile (Defense, Toughness, Target symbols, abilities), faces outwards next to the Threat Track: walk round to read it whenever you need it.", "Ponha o fundo da caixa na borda oposta com o lado que mostra OCTOCUTIE virado para a Zona de Jogo; o lado de fora, com o perfil (Defesa, Resistência, símbolos de Alvo, habilidades), fica para fora, junto da Trilha de Ameaça: vá até lá ler sempre que precisar.")
            : t("Place the box bottom on the far edge with the side showing the 3 toys (Pinky, Howdy, Bob: the Threats) facing the Play Zone; the outer side, printed with their profiles, faces outwards next to the Threat Track: walk round to read it whenever you need it.", "Ponha o fundo da caixa na borda oposta com o lado que mostra os 3 brinquedos (Pinky, Howdy, Bob: as Ameaças) virado para a Zona de Jogo; o lado de fora, com os perfis, fica para fora, junto da Trilha de Ameaça: vá até lá ler sempre que precisar."),
          state.mode === "octo"
            ? t(`Force Field Switches: place 4 Numbered Block tokens ${g("numbered-block")} (one each of 1–4) face up in the Play Zone, each next to a scenery piece big enough for a Little Soldier to hide behind.`, `Interruptores de Campo de Força: ponha 4 fichas de Bloco ${g("numbered-block")} (uma de cada, 1–4) viradas para cima na Zona de Jogo, cada uma ao lado de uma peça de cenário grande o bastante para um Little Soldier se esconder atrás.`)
            : t(`Force Field Switches: place 3 Numbered Block tokens ${g("numbered-block")} (one each of 1–3) face up in the Play Zone, each next to a scenery piece big enough for a Little Soldier to hide behind.`, `Interruptores de Campo de Força: ponha 3 fichas de Bloco ${g("numbered-block")} (uma de cada, 1–3) viradas para cima na Zona de Jogo, cada uma ao lado de uma peça de cenário grande o bastante para um Little Soldier se esconder atrás.`),
          t("Threat Actions: shuffle the other 4 Numbered Block tokens (1–4) and lay them face down side by side outside the Play Zone.", "Ações de Ameaça: embaralhe as outras 4 fichas de Bloco (1–4) e deixe-as viradas para baixo, lado a lado, fora da Zona de Jogo."),
          t(`Keep the 3 Ouch tokens ${g("ouch")} by the box: they mark broken Threats.`, `Deixe as 3 fichas Ouch ${g("ouch")} junto da caixa: elas marcam Ameaças quebradas.`)
        ]
      });
    } else if (state.mode !== "royale") {
      phases.push({
        id: "deployment",
        title: t("Place the Deployment tokens", "Ponha as fichas de Posicionamento"),
        codes: state.tactics ? ["c3", "o12"] : ["c3"],
        items: state.tactics ? [
          t(`“Advanced Tactics”: place the 4 Deployment tokens ${g("deployment")} in the Play Zone with their team-colour side up: 2 green near the green side, 2 yellow near the yellow side (see the module's example).`, `“Advanced Tactics”: ponha as 4 fichas de Posicionamento ${g("deployment")} na Zona de Jogo com o lado da cor da equipe para cima: 2 verdes perto do lado verde, 2 amarelas perto do lado amarelo (veja o exemplo do módulo).`),
          t(`Place the 4 Crate tokens ${g("crate")} in the Play Zone as in the example (each has a different colour on each face). Crates of your colour let you draw Tactics cards.`, `Ponha as 4 fichas de Caixote ${g("crate")} na Zona de Jogo como no exemplo (cada uma tem uma cor diferente em cada face). Os Caixotes da sua cor permitem comprar cartas de Tática.`)
        ] : [
          t(`Place the 4 Deployment tokens ${g("deployment")} numbered side up (1, 2, 3, 4) as in the setup diagram: spread around the Play Zone, two on each half (in the diagram 1 and 4 are nearer Player 1, 2 and 3 nearer Player 2).`, `Ponha as 4 fichas de Posicionamento ${g("deployment")} com o número para cima (1, 2, 3, 4) como no diagrama: espalhadas pela Zona de Jogo, duas em cada metade (no diagrama, 1 e 4 ficam mais perto do Jogador 1, 2 e 3 mais perto do Jogador 2).`),
          state.mode === "king" ? t("King of the Hill's example puts them near the 4 corners.", "O exemplo de King of the Hill as põe perto dos 4 cantos.") : ""
        ]
      });
    }
    if (usesBattleTrack()) {
      phases.push({
        id: "track",
        title: t("Build the Battle Track", "Monte a Trilha de Batalha"),
        codes: ["c3"],
        items: [
          t("Place the 2 Battle Track cards on their green and yellow sides end to end alongside the Play Zone: each colour's Victory zone is at its own end.", "Ponha as 2 cartas da Trilha de Batalha pelos lados verde e amarelo, ponta com ponta, ao lado da Zona de Jogo: a zona de Vitória de cada cor fica na sua ponta."),
          t(`Place the Flag counter ${g("flag")} on the middle (starting) space. Each enemy Little Soldier you break moves it 1 space towards your Victory zone.`, `Ponha o marcador de Bandeira ${g("flag")} no espaço do meio (inicial). Cada Little Soldier inimigo que você quebra o move 1 espaço em direção à sua zona de Vitória.`)
        ]
      });
    } else if (isThreat()) {
      phases.push({
        id: "track",
        title: t("Build the Threat Track", "Monte a Trilha de Ameaça"),
        codes: ["m8"],
        items: [
          t("Place the 2 Battle Track cards on their Threat Track side, end to end, beside the box bottom. The track is a row of spaces: 3 of them near one end are marked as starting spaces (1–2, 3 and 4 players) and the last space at the other end is the Threat Victory space.", "Ponha as 2 cartas da Trilha de Batalha pelo lado Trilha de Ameaça, ponta com ponta, junto do fundo da caixa. A trilha é uma fileira de espaços: 3 deles, perto de uma ponta, são marcados como espaços iniciais (1–2, 3 e 4 jogadores) e o último espaço da outra ponta é o espaço de Vitória da Ameaça."),
          t(`Place the Flag counter ${g("flag")} on the starting space marked for ${n <= 2 ? "1–2" : n} player${n > 1 ? "s" : ""}. Each broken Little Soldier moves it 1 space towards the Threat Victory space at the end.`, `Ponha o marcador de Bandeira ${g("flag")} no espaço inicial marcado para ${n <= 2 ? "1–2" : n} jogador${n > 1 ? "es" : ""}. Cada Little Soldier quebrado o move 1 espaço em direção ao espaço de Vitória da Ameaça, no fim da trilha.`)
        ]
      });
    }
    const reserve = [
      t(`The 5 Attack dice ${g("attack-die")}, the yellow Grenade die ${g("grenade-die")} and the red Sniper die ${g("sniper-die")}.`, `Os 5 dados de Ataque ${g("attack-die")}, o dado de Granada amarelo ${g("grenade-die")} e o dado do Sniper vermelho ${g("sniper-die")}.`),
      t(`The yellow ${g("yellow-move")} and red ${g("red-move")} cords, and the 2 green Move tokens ${g("move-token")} (green distance ${g("green-move")} = the length of 1 Move token).`, `Os cordões amarelo ${g("yellow-move")} e vermelho ${g("red-move")} e as 2 fichas de Movimento verdes ${g("move-token")} (distância verde ${g("green-move")} = o comprimento de 1 ficha de Movimento).`),
      t(`All Shield ${g("shield")} and Heart ${g("heart")} tokens.`, `Todas as fichas de Escudo ${g("shield")} e de Coração ${g("heart")}.`),
      state.mode === "royale"
        ? t(`Numbered Block tokens ${g("numbered-block")}: exactly ${n}, numbered 1 to ${n} (the rest go back in the box).`, `Fichas de Bloco ${g("numbered-block")}: exatamente ${n}, numeradas de 1 a ${n} (o resto volta para a caixa).`)
        : isThreat() || state.tactics ? "" : t(`The 8 Numbered Block tokens ${g("numbered-block")} (two each of 1–4).`, `As 8 fichas de Bloco numeradas ${g("numbered-block")} (duas de cada, 1–4).`),
      t(`The Catapult spoon and the Mortar token ${g("mortar")}.`, `A colher-catapulta e a ficha de Morteiro ${g("mortar")}.`),
      state.mode === "king" ? t(`Candy tokens ${g("candy")}: ${n === 2 ? 7 : 11} (7 with 2 players, 11 with 3–4).`, `Fichas de Doce ${g("candy")}: ${n === 2 ? 7 : 11} (7 com 2 jogadores, 11 com 3–4).`) : "",
      state.tactics ? t(`“Advanced Tactics”: the 3 Bonus Order tokens ${g("bonus-order")} and the Tactics cards ${g("tactics-card")}. Each player takes the 3 starting Tactics cards shown on the back of their General card (their bottom-right icon matches the General); shuffle the rest face down as the deck.`, `“Advanced Tactics”: as 3 fichas de Ordem Bônus ${g("bonus-order")} e as cartas de Tática ${g("tactics-card")}. Cada jogador pega as 3 cartas de Tática iniciais mostradas no verso da carta do seu General (o ícone no canto inferior direito combina com o General); embaralhe o resto virado para baixo como baralho.`) : ""
    ];
    phases.push({
      id: "reserve",
      title: t("Set out the Reserve", "Monte a Reserva"),
      codes: ["c3", ...(state.mode === "king" ? ["m2"] : []), ...(state.mode === "royale" ? ["m5"] : []), ...(state.tactics ? ["o13"] : [])],
      items: [t("Put the shared components around the edge of the Play Zone:", "Ponha os componentes compartilhados em volta da Zona de Jogo:"), ...reserve]
    });
    phases.push({
      id: "hq",
      title: state.mode === "royale" ? t("Each player sets up their HQ (1 Little Soldier)", "Cada jogador monta o QG (1 Little Soldier)") : t("Each player sets up their HQ", "Cada jogador monta o QG"),
      codes: state.mode === "royale" ? ["m5"] : ["c4", ...(isTeam() ? ["o4"] : []), ...(state.mode === "king" ? ["m3"] : []), ...(isThreat() ? ["m9"] : []), ...(state.reinforcements ? ["o11"] : []), ...(state.superSoldier ? ["o3"] : [])],
      items: hqLines()
    });
    if (state.mode === "royale") {
      phases.push({
        id: "first",
        title: t("Check the turn-order tokens", "Confira as fichas de ordem de turno"),
        codes: ["m6"],
        items: [
          t("There is no first player or Star token in this mission: the Numbered Block tokens, drawn at random every round, decide the order.", "Não há primeiro jogador nem ficha de Estrela nesta missão: as fichas de Bloco, sorteadas a cada rodada, decidem a ordem."),
          t("Put any unused components back in the box.", "Devolva à caixa os componentes não usados.")
        ]
      });
    } else if (isThreat()) {
      phases.push({
        id: "first",
        title: t("Choose the first player together", "Escolham juntos o primeiro jogador"),
        codes: ["m10"],
        items: [
          t("The Star token is not used. Decide together who goes first; play then goes clockwise.", "A ficha de Estrela não é usada. Decidam juntos quem começa; depois o jogo segue em sentido horário."),
          t("Put any unused components back in the box.", "Devolva à caixa os componentes não usados.")
        ]
      });
    } else {
      phases.push({
        id: "first",
        title: t("Determine the first player", "Defina o primeiro jogador"),
        codes: ["c4", ...(isTeam() ? ["o5"] : [])],
        items: [
          t(`Flip the sheriff's Star token ${g("star")} like a coin to decide who goes first. The first player places the Star on their General.`, `Jogue a ficha de Estrela de xerife ${g("star")} como uma moeda para decidir quem começa. O primeiro jogador põe a Estrela no seu General.`),
          isTeam() || (state.mode === "king" && n > 2) ? t("With 3 or more players, turns then go clockwise from the first player.", "Com 3 ou mais jogadores, os turnos seguem depois em sentido horário a partir do primeiro jogador.") : "",
          t("Put any unused components back in the box.", "Devolva à caixa os componentes não usados.")
        ]
      });
    }
    phases.push({
      id: "start",
      title: t("Start round 1", "Comece a rodada 1"),
      codes: state.mode === "royale" ? ["m6"] : isThreat() ? ["m10"] : ["c5"],
      items: [
        state.mode === "royale"
          ? t("Go to “The round”: the soldiers parachute into the Play Zone by catapult during Round preparation.", "Vá para “A rodada”: os soldados aterrissam de paraquedas na Zona de Jogo pela catapulta durante a preparação da rodada.")
          : isThreat()
            ? t("Go to “The round”: everyone deploys all their Little Soldiers near a Deployment token of their choice.", "Vá para “A rodada”: todos posicionam seus Little Soldiers perto de uma ficha de Posicionamento à escolha.")
            : state.tactics
              ? t("Go to “The round”: soldiers deploy one at a time next to a Deployment token of their colour or another soldier of theirs.", "Vá para “A rodada”: os soldados entram um de cada vez perto de uma ficha de Posicionamento da sua cor ou de outro soldado seu.")
              : t("Go to “The round”: the soldiers enter the Play Zone in Round preparation, next to the Deployment token whose number you draw.", "Vá para “A rodada”: os soldados entram na Zona de Jogo na preparação da rodada, perto da ficha de Posicionamento cujo número você tirar.")
      ]
    });
    return phases;
  }

  function inventory() {
    const n = state.players;
    const per = soldiersPerPlayer();
    const generals = usesGenerals() ? n === 3 && isTeam() ? 4 : n : 0;
    const orderTokens = state.mode === "royale" ? n : generals * 3 + (state.mode === "bootcamp" ? state.reinforcements * 2 : n === 1 ? 2 : 0);
    const needsExtraOrders = orderTokens > 6;
    const cards = [
      infoCard(t("SQUADS", "ESQUADRÕES"), t(`${playersLabel()} · ${modeName()}`, `${playersLabel()} · ${modeName()}`), [
        usesGenerals() ? rl("Generals", `${generals} (1 per ${isTeam() && n === 3 ? "General played; one player commands 2" : "player"}), each with its Chest card.`, "Generais", `${generals} (1 por ${isTeam() && n === 3 ? "General jogado; um jogador comanda 2" : "jogador"}), cada um com sua carta de Baú.`) : rl("Generals and Chests", "not used.", "Generais e Baús", "não usados."),
        rl("Little Soldiers", `${state.mode === "royale" ? n : n === 3 && isTeam() ? 8 : n * per} cards and matching figurines (${per} per ${usesGenerals() ? "General" : "player"}).`, "Little Soldiers", `${state.mode === "royale" ? n : n === 3 && isTeam() ? 8 : n * per} cartas e as miniaturas correspondentes (${per} por ${usesGenerals() ? "General" : "jogador"}).`),
        rl("Order tokens", `${n === 3 && isTeam() ? 12 : orderTokens} in all, each player using the colour of their General${state.mode === "royale" ? "/card" : ""}.${needsExtraOrders || (n === 3 && isTeam()) ? " The base set has only 6 (3 green, 3 yellow): take the missing ones from the extra Order tokens in the box (the “2 Against 2” and “Reinforcements” modules each list 6 more, 3 per colour). Using these tokens does not switch those modules on." : ""}`, "Fichas de Ordem", `${n === 3 && isTeam() ? 12 : orderTokens} no total, cada jogador usando a cor do seu General${state.mode === "royale" ? "/carta" : ""}.${needsExtraOrders || (n === 3 && isTeam()) ? " O conjunto básico só tem 6 (3 verdes, 3 amarelas): pegue as que faltam entre as fichas de Ordem extras da caixa (os módulos “2 Against 2” e “Reinforcements” listam mais 6 cada, 3 por cor). Usar essas fichas não ativa esses módulos." : ""}`),
        rl("Card side", state.superSoldier && state.mode !== "royale" ? "Super Soldiers (two chevrons)." : "New Recruit (one chevron).", "Lado das cartas", state.superSoldier && state.mode !== "royale" ? "Super Soldiers (duas divisas)." : "Recruta (uma divisa).")
      ], state.mode === "royale" ? ["m5"] : ["c4", "c12"]),
      infoCard(t("SHARED", "COMPARTILHADO"), t("Reserve and table", "Reserva e mesa"), [
        rl("Dice", "5 Attack, 1 Sniper (red), 1 Grenade (yellow).", "Dados", "5 de Ataque, 1 do Sniper (vermelho), 1 de Granada (amarelo)."),
        rl("Measuring", "yellow and red cords (3 in the box), 2 green Move tokens.", "Medição", "cordões amarelo e vermelho (3 na caixa), 2 fichas de Movimento verdes."),
        rl("Tokens", "20 Heart, 11 Shield, 1 Mortar + the Catapult spoon (Numbered Block, Deployment and Star tokens: see the setup steps for how many this match uses).", "Fichas", "20 de Coração, 11 de Escudo, 1 Morteiro + a colher-catapulta (fichas de Bloco, de Posicionamento e Estrela: veja nos passos da preparação quantas esta partida usa)."),
        state.tactics ? rl("Not used", "the Numbered Block tokens (Advanced Tactics replaces the Block-token deployment).", "Não usadas", "as fichas de Bloco (Advanced Tactics substitui o posicionamento por fichas de Bloco).") : "",
        usesBattleTrack() ? rl("Battle Track", "2 cards + the Flag counter.", "Trilha de Batalha", "2 cartas + o marcador de Bandeira.") : isThreat() ? rl("Threat Track", "the 2 Battle Track cards turned over + the Flag counter.", "Trilha de Ameaça", "as 2 cartas da Trilha de Batalha viradas + o marcador de Bandeira.") : rl("Battle Track", "left in the box.", "Trilha de Batalha", "fica na caixa."),
        rl("Gaming aids", "4 reference cards: one per player is handy.", "Cartas de ajuda", "4 cartas de referência: uma por jogador ajuda.")
      ], ["c3", "c12"]),
      state.mode === "king" ? infoCard(t("MISSION EXTRAS", "EXTRAS DA MISSÃO"), "King of the Hill", [
        rl("Candy tokens", `${n === 2 ? 7 : 11} in the Reserve (of 11).`, "Fichas de Doce", `${n === 2 ? 7 : 11} na Reserva (de 11).`),
        rl("Level tokens", `1 Level 1 + 1 Level 2 on the hill, 1 on each Infantry card (${2 + n} of the 6 supplied).`, "Fichas de Nível", `1 de Nível 1 + 1 de Nível 2 na colina, 1 em cada carta de Infantry (${2 + n} das 6 fornecidas).`)
      ], ["m2", "m3"]) : "",
      state.mode === "royale" ? infoCard(t("MISSION EXTRAS", "EXTRAS DA MISSÃO"), "Battle Royale", [
        rl("Supplies tokens", "3, in the Play Zone.", "Fichas de Suprimentos", "3, na Zona de Jogo."),
        rl("Numbered Block tokens", `${n} (1–${n}).`, "Fichas de Bloco", `${n} (1–${n}).`),
        rl("Not used", "Generals, Chests, Battle Track, Star token, Deployment tokens.", "Não usados", "Generais, Baús, Trilha de Batalha, ficha de Estrela, fichas de Posicionamento.")
      ], ["m5"]) : "",
      isThreat() ? infoCard(t("MISSION EXTRAS", "EXTRAS DA MISSÃO"), modeName(), [
        rl("Box bottom", state.mode === "octo" ? "OCTOCUTIE side facing the Play Zone." : "the 3 Threats' side facing the Play Zone.", "Fundo da caixa", state.mode === "octo" ? "lado de OCTOCUTIE virado para a Zona de Jogo." : "lado das 3 Ameaças virado para a Zona de Jogo."),
        rl("Ouch tokens", "3, to mark broken Threats.", "Fichas Ouch", "3, para marcar Ameaças quebradas."),
        rl("Numbered Block tokens", state.mode === "octo" ? "4 face up as Force Field Switches (1–4) + 4 face down as Threat Actions (1–4)." : "3 face up as Force Field Switches (1–3) + 4 face down as Threat Actions (1–4).", "Fichas de Bloco", state.mode === "octo" ? "4 viradas para cima como Interruptores (1–4) + 4 viradas para baixo como Ações de Ameaça (1–4)." : "3 viradas para cima como Interruptores (1–3) + 4 viradas para baixo como Ações de Ameaça (1–4)."),
        rl("Deployment tokens", "2.", "Fichas de Posicionamento", "2."),
        rl("Not used", "the Star token.", "Não usado", "a ficha de Estrela.")
      ], ["m8", "m9"]) : "",
      activeModules().filter((id) => id !== "superSoldier" && id !== "team").length ? infoCard(t("MODULE EXTRAS", "EXTRAS DOS MÓDULOS"), t("From the Module Book", "Do livro de Módulos"), [
        state.levels && state.mode !== "king" ? rl("Levels", "2 Level 1 tokens (more in free mode).", "Levels", "2 fichas de Nível 1 (mais no modo livre).") : "",
        state.objects ? rl("Objects", "3 Teleporters (first game), or any Object tokens.", "Objects", "3 Teletransportadores (primeira partida), ou quaisquer fichas de Objeto.") : "",
        state.reinforcements ? rl("Reinforcements", `${state.reinforcements} extra Little Soldier${state.reinforcements > 1 ? "s" : ""} and Order token${state.reinforcements > 1 ? "s" : ""} per side; the module also adds more Heart tokens to the Reserve (4 regular and 6 printed “−2”).`, "Reinforcements", `${state.reinforcements} Little Soldier${state.reinforcements > 1 ? "s" : ""} e ficha${state.reinforcements > 1 ? "s" : ""} de Ordem extras por lado; o módulo também acrescenta fichas de Coração à Reserva (4 comuns e 6 impressas “−2”).`) : "",
        state.reinforcements ? interpretation("the module only lists the “−2” Heart tokens; the guide uses each as 2 Hearts, to save tokens when damage piles up.", "o módulo só lista as fichas de Coração “−2”; o guia usa cada uma como 2 Corações, para economizar fichas quando o dano se acumula.") : "",
        state.tactics ? rl("Advanced Tactics", "50 Tactics cards, 4 Crate tokens, 3 Bonus Order tokens.", "Advanced Tactics", "50 cartas de Tática, 4 fichas de Caixote, 3 fichas de Ordem Bônus.") : ""
      ], ["o6", "o8", "o11", "o12"]) : ""
    ].filter(Boolean);
    return `<div class="quick-grid">${cards.join("")}</div>`;
  }

  function setupFigures() {
    const figs = [];
    if (state.mode === "king") {
      figs.push(figure("king-of-the-hill-setup", "King of the Hill setup diagram for 2 players", "Diagrama da preparação de King of the Hill para 2 jogadores", "King of the Hill setup, 2 players (Missions p. 2): the stacked hill in the middle.", "Preparação de King of the Hill, 2 jogadores (Missões p. 2): a colina empilhada no centro."));
    } else if (state.mode === "royale") {
      figs.push(figure("battle-royale-setup", "Battle Royale setup diagram for 5 players", "Diagrama da preparação de Battle Royale para 5 jogadores", "Battle Royale setup, 5 players (Missions p. 5): Supplies tokens among the scenery.", "Preparação de Battle Royale, 5 jogadores (Missões p. 5): fichas de Suprimentos entre o cenário."));
    } else if (state.mode === "threat") {
      figs.push(figure("threat-setup", "A New Threat setup diagram", "Diagrama da preparação de A New Threat", "A New Threat setup (Missions p. 8): Switches 1–3 by the scenery, box bottom on the right.", "Preparação de A New Threat (Missões p. 8): Interruptores 1–3 junto do cenário, fundo da caixa à direita."));
      figs.push(figure("threat-track", "Threat Track with starting spaces", "Trilha de Ameaça com os espaços iniciais", "Threat Track: starting spaces for 1–2, 3 and 4 players; Threat Victory space at the end.", "Trilha de Ameaça: espaços iniciais para 1–2, 3 e 4 jogadores; espaço de Vitória da Ameaça no fim."));
    } else if (state.mode === "octo") {
      figs.push(figure("octocutie-setup", "Another New Threat setup diagram", "Diagrama da preparação de Another New Threat", "Another New Threat setup (Missions p. 14): 4 Switches.", "Preparação de Another New Threat (Missões p. 14): 4 Interruptores."));
      figs.push(figure("threat-track", "Threat Track with starting spaces", "Trilha de Ameaça com os espaços iniciais", "Threat Track: starting spaces for 1–2, 3 and 4 players.", "Trilha de Ameaça: espaços iniciais para 1–2, 3 e 4 jogadores."));
    } else if (state.tactics) {
      figs.push(figure("tactics-setup", "Advanced Tactics setup diagram", "Diagrama da preparação de Advanced Tactics", "“Advanced Tactics” setup (Modules p. 12): coloured Deployment tokens and Crates.", "Preparação de “Advanced Tactics” (Módulos p. 12): fichas de Posicionamento coloridas e Caixotes."));
    } else if (state.levels) {
      figs.push(figure("levels-setup", "Levels setup diagram", "Diagrama da preparação de Levels", "“Levels” setup (Modules p. 6): a Level 1 token in each marked zone.", "Preparação de “Levels” (Módulos p. 6): uma ficha de Nível 1 em cada zona marcada."));
    } else {
      figs.push(figure("setup-layout", "Bootcamp setup: Play Zone, hatched zones, HQs and Reserve", "Preparação do Bootcamp: Zona de Jogo, zonas hachuradas, QGs e Reserva", "Bootcamp setup (p. 2): A scenery zones, B Deployment tokens, C Battle Track, D Reserve.", "Preparação do Bootcamp (p. 2): A zonas de cenário, B fichas de Posicionamento, C Trilha de Batalha, D Reserva."));
    }
    if (state.mode !== "royale") {
      figs.push(figure("hq-example", "Example of the yellow player's HQ", "Exemplo do QG do jogador amarelo", "HQ example (p. 4): Chest, General, Infantry, second Little Soldier.", "Exemplo de QG (p. 4): Baú, General, Infantry, segundo Little Soldier."));
    }
    return `<div class="ls-art-row">${figs.join("")}</div>`;
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
        <label class="ls-setup-check" for="ls-setup-${phase.id}">
          <input id="ls-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="ls-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="ls-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");
    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), ["c2", "c3", "c4"])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${modeName()} · ${playersLabel()}</h3>
            <p>${t("One checkbox per coherent step, filtered for this match. Little Soldiers do not start on the table: they enter during Round preparation.", "Uma caixa por etapa coerente, filtrada para esta partida. Os Little Soldiers não começam na mesa: eles entram durante a preparação da rodada.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved on this device separately from the match options. Changing the mode, players or modules clears it; the language does not. “Uncheck all” clears only these setup boxes — use it before the next game.",
          "O progresso é salvo neste aparelho separado das opções da partida. Mudar o modo, os jogadores ou os módulos o limpa; o idioma não. “Desmarcar tudo” limpa somente estas caixas da preparação — use antes da próxima partida."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      ${setupFigures()}
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}
      ${figure("components", "Bootcamp Book back page listing the base components", "Contracapa do Bootcamp com os componentes básicos", "Base components (Bootcamp p. 12). Other components stay in the box until a module or mission asks for them.", "Componentes básicos (Bootcamp p. 12). Os demais componentes ficam na caixa até um módulo ou missão pedi-los.", "ls-art-wide")}`;
  }

  // ---------- shared rule text ----------

  function rerollLines() {
    return [
      rl("Roll", "roll the 5 Attack dice.", "Rolar", "role os 5 dados de Ataque."),
      rl("1 reroll", "reroll any or all dice once.", "1 rolagem extra", "role de novo qualquer parte dos dados (ou todos) uma vez."),
      rl("+1 at red range", `if your figurine is within red range ${g("red-move")} of the target, 1 more reroll of any dice (including ones you kept): 3 rolls in all instead of 2.`, "+1 no alcance vermelho", `se a sua miniatura estiver no alcance vermelho ${g("red-move")} do alvo, mais 1 rolagem de quaisquer dados (inclusive os que você guardou): 3 rolagens no total em vez de 2.`),
      state.levels ? rl("+1 from higher up", "attacking from a Level higher than the target's gives 1 more reroll (the table is Level 0).", "+1 do alto", "atacar de um Nível mais alto que o do alvo dá mais 1 rolagem (a mesa é Nível 0).") : "",
      state.objects ? rl("Switches", `−1 reroll for every red-side Switch ${g("switch-off")} visible in the Play Zone.`, "Interruptores", `−1 rolagem para cada Interruptor do lado vermelho ${g("switch-off")} visível na Zona de Jogo.`) : ""
    ];
  }

  function damageLines() {
    return [
      rl("Defense", `the shield number ${g("defense")} on the card, −1 per Shield token ${g("shield")} on that card (never below 0, no limit on Shields).`, "Defesa", `o número do escudo ${g("defense")} na carta, −1 por ficha de Escudo ${g("shield")} nessa carta (nunca abaixo de 0, sem limite de Escudos).`),
      rl("Hits ≤ Defense", `count the Hits ${g("hit")}: nothing happens, the attack misses.`, "Acertos ≤ Defesa", `conte os Acertos ${g("hit")}: nada acontece, o ataque erra.`),
      rl("Hits > Defense", `place 1 Heart token ${g("heart")} on the target's card for each Hit above its Defense.`, "Acertos > Defesa", `ponha 1 ficha de Coração ${g("heart")} na carta do alvo para cada Acerto acima da Defesa.`),
      rl("Lightning", state.superSoldier ? `each Lightning ${g("lightning")} triggers the attacker's special ability once (“Super Soldier”).` : `${g("lightning")} counts as a blank in this match.`, "Raio", state.superSoldier ? `cada Raio ${g("lightning")} ativa uma vez a habilidade especial do atacante (“Super Soldier”).` : `${g("lightning")} conta como face vazia nesta partida.`),
      rl("Broken", `when Hearts on a card ≥ its Toughness ${g("toughness")}.`, "Quebrado", `quando os Corações numa carta forem ≥ à sua Resistência ${g("toughness")}.`)
    ];
  }

  function brokenLines() {
    if (state.mode === "royale") {
      return [
        rl("Out for good", "remove the figurine and its Order token from the Play Zone and put them on your card in your HQ.", "Fora de vez", "tire a miniatura e sua ficha de Ordem da Zona de Jogo e ponha-as na sua carta no QG."),
        rl("Other tokens", "Hearts and Shields on the card go back to the Reserve.", "Outras fichas", "Corações e Escudos da carta voltam à Reserva."),
        rl("Still playing", "on each of your later turns, instead of Move/Order/End of turn, fire 1 Mortar Shot from your HQ, then your turn ends.", "Ainda jogando", "em cada turno seu depois disso, em vez de Movimento/Ordem/Fim do turno, dispare 1 Tiro de Morteiro do seu QG; depois o turno acaba.")
      ];
    }
    return [
      rl("Back to HQ", "remove the figurine from the Play Zone and stand it on its card in your HQ (it is out of play and cannot be targeted).", "De volta ao QG", "tire a miniatura da Zona de Jogo e ponha-a sobre a carta no seu QG (está fora de jogo e não pode ser alvo)."),
      rl("Its Order tokens", `all the Order tokens ${g("order")} next to that figurine go to the Bottom of your Chest.`, "Suas fichas de Ordem", `todas as fichas de Ordem ${g("order")} junto daquela miniatura vão para o Fundo do seu Baú.`),
      rl("Other tokens", "Hearts, Shields and any others on its card go back to the Reserve.", "Outras fichas", "Corações, Escudos e outras fichas da carta voltam à Reserva."),
      usesBattleTrack()
        ? rl("Flag", "move the Flag 1 space towards your opponent's Victory zone — even if you broke your own soldier.", "Bandeira", "mova a Bandeira 1 espaço em direção à zona de Vitória do adversário — mesmo que você tenha quebrado o próprio soldado.")
        : isThreat()
          ? rl("Flag", "move the Flag 1 space towards the Threat Victory space.", "Bandeira", "mova a Bandeira 1 espaço em direção ao espaço de Vitória da Ameaça.")
          : rl("Hill pass", "if it carried a Level token, you may give that token to another of your Little Soldiers in play (the only time it can move).", "Passe da colina", "se ele tinha uma ficha de Nível, você pode passá-la a outro Little Soldier seu em jogo (a única vez em que ela muda de dono)."),
      usesBattleTrack() ? rl("Wipeout", "if it was your last soldier in the Play Zone, move the Flag 1 extra space and the round ends immediately.", "Aniquilação (Wipeout)", "se era o seu último soldado na Zona de Jogo, mova a Bandeira 1 espaço a mais e a rodada termina imediatamente.") : "",
      rl("Coming back", "broken soldiers return in the next Round preparation's deployment.", "Retorno", "soldados quebrados voltam no posicionamento da próxima preparação de rodada.")
    ];
  }

  function deployLines() {
    if (state.mode === "royale") {
      return [
        rl("Round 1 only", "shuffle the Numbered Block tokens face down; everyone draws 1.", "Só na rodada 1", "embaralhe as fichas de Bloco viradas para baixo; cada um compra 1."),
        rl("Order", "starting with the player who drew 1, then ascending, reveal your token and parachute in.", "Ordem", "começando por quem tirou o 1, depois em ordem crescente, revele a ficha e aterrisse de paraquedas."),
        rl("Parachute", "put the Catapult on any edge of the Play Zone, facing any direction; place a green Move token on it and launch it; stand your figurine touching the Move token where it landed. Take the Move token back for the next player.", "Paraquedas", "ponha a Catapulta em qualquer borda da Zona de Jogo, virada para qualquer direção; ponha uma ficha de Movimento verde nela e lance; ponha a miniatura encostada na ficha onde ela caiu. Recolha a ficha para o próximo jogador.")
      ];
    }
    if (isThreat()) {
      return [
        rl("Choose first player", "decide together who goes first this round (the Star is not used).", "Escolha o primeiro jogador", "decidam juntos quem começa nesta rodada (a Estrela não é usada)."),
        rl("Deploy", `place every Little Soldier from your HQ within green distance ${g("green-move")} (1 Move token) of a Deployment token of your choice; you may split them between the 2 tokens.`, "Posicionar", `ponha cada Little Soldier do seu QG a até a distância verde ${g("green-move")} (1 ficha de Movimento) de uma ficha de Posicionamento à escolha; pode dividi-los entre as 2 fichas.`)
      ];
    }
    if (state.tactics) {
      return [
        rl("Only if needed", "deploy only when a player has at least one figurine in their HQ (always at the start).", "Só se preciso", "posicione só se algum jogador tiver ao menos uma miniatura no QG (sempre no início)."),
        rl("One at a time", "starting with the first player and in turn order, each player places 1 figurine from their HQ within green distance (1 Move token) of a Deployment token of their colour or of one of their Little Soldiers already in play.", "Um de cada vez", "começando pelo primeiro jogador e na ordem dos turnos, cada um põe 1 miniatura do QG a até a distância verde (1 ficha de Movimento) de uma ficha de Posicionamento da sua cor ou de um Little Soldier seu já em jogo."),
        rl("Chains", "soldiers placed next to soldiers let you gain ground.", "Correntes", "soldados postos ao lado de soldados permitem avançar no campo."),
        state.levels ? rl("Levels", "nobody may be deployed above Level 0.", "Níveis", "ninguém pode ser posicionado acima do Nível 0.") : "",
        rl("Repeat", "until every HQ is empty.", "Repita", "até todos os QGs ficarem vazios.")
      ];
    }
    return [
      rl("Only if needed", "deploy only when a player has at least one figurine in their HQ (always at the start of round 1).", "Só se preciso", "posicione só se algum jogador tiver ao menos uma miniatura no QG (sempre no início da rodada 1)."),
      rl("Shuffle", "shuffle the 8 Numbered Block tokens face down into a pile.", "Embaralhar", "embaralhe as 8 fichas de Bloco viradas para baixo numa pilha."),
      rl("Flip and place", `starting with the first player, flip 1 token and place 1 figurine from your HQ within green distance ${g("green-move")} of the Deployment token with that number: anywhere, as long as it stays in contact with a Move token laid against that Deployment token.`, "Virar e posicionar", `começando pelo primeiro jogador, vire 1 ficha e ponha 1 miniatura do seu QG a até a distância verde ${g("green-move")} da ficha de Posicionamento com aquele número: em qualquer ponto, desde que encostada numa ficha de Movimento apoiada naquela ficha de Posicionamento.`),
      rl("Alternate", isTeam() || state.players > 2 ? "players alternate in turn order until every HQ is empty." : "players alternate until both HQs are empty.", "Alternar", isTeam() || state.players > 2 ? "os jogadores se alternam na ordem dos turnos até todos os QGs ficarem vazios." : "os jogadores se alternam até os dois QGs ficarem vazios."),
      rl("Reset", "shuffle the Block tokens back into a face-down pile for the next round.", "Reiniciar", "embaralhe as fichas de Bloco de volta numa pilha virada para baixo para a próxima rodada."),
      rl("Watch out", "you may start face to face with an enemy.", "Atenção", "você pode começar cara a cara com um inimigo.")
    ];
  }

  function takeOrderLines() {
    if (state.mode === "royale") {
      return [
        rl("From round 2", `each player whose soldier is not broken takes the Order token ${g("order")} from beside their figurine and puts it back on their card: 1 Order per turn.`, "A partir da rodada 2", `cada jogador cujo soldado não está quebrado pega a ficha de Ordem ${g("order")} ao lado da miniatura e a devolve à carta: 1 Ordem por turno.`),
        rl("Deal Block tokens", "shuffle the Numbered Block tokens face down; every player, broken ones included, takes 1 without showing it.", "Distribuir fichas de Bloco", "embaralhe as fichas de Bloco viradas para baixo; cada jogador, inclusive os quebrados, pega 1 sem mostrar.")
      ];
    }
    return [
      state.mode === "king"
        ? rl("A · Chest lid", "nothing: your 3 Orders started on your General.", "A · Tampa do Baú", "nada: suas 3 Ordens começaram no General.")
        : rl("A · Chest lid", `take 1 Order token ${g("order")} from your Chest lid. Round 1: no Orders sit beside your soldiers yet and your Chest bottom is empty, so B and C give nothing: this is your only token${state.reinforcements || state.players === 1 ? " besides the ones already on your General (Reinforcements)" : ""}. Taking the 3rd and last one means round 3, the last round, begins.`, "A · Tampa do Baú", `pegue 1 ficha de Ordem ${g("order")} da tampa do Baú. Rodada 1: ainda não há Ordens junto dos seus soldados e o fundo do Baú está vazio, então B e C não dão nada: é a sua única ficha${state.reinforcements || state.players === 1 ? " além das que já estão no General (Reinforcements)" : ""}. Pegar a 3ª e última significa que começa a rodada 3, a última.`),
      rl("B · Soldiers in play", "take 1 Order token from beside each of your Little Soldiers in play (only 1 each, even if one has several).", "B · Soldados em jogo", "pegue 1 ficha de Ordem de junto de cada Little Soldier seu em jogo (só 1 de cada, mesmo que um tenha várias)."),
      rl("C · Chest bottom", "take all the Order tokens from your Chest bottom (they come from broken soldiers).", "C · Fundo do Baú", "pegue todas as fichas de Ordem do fundo do Baú (elas vêm de soldados quebrados)."),
      rl("Where", "put them all on your General card.", "Onde", "ponha todas na carta do General."),
      state.tactics ? rl("Bonus Orders", "Bonus Order tokens beside Little Soldiers are removed at the end of each round and go back to the Reserve.", "Ordens Bônus", "fichas de Ordem Bônus junto de Little Soldiers saem no fim de cada rodada e voltam à Reserva.") : ""
    ];
  }

  // ---------- quick reference ----------

  function turnSteps() {
    if (state.mode === "royale") {
      return [
        rl("Turn order", "reveal your Block token on your turn: 1 first, then ascending.", "Ordem", "revele a sua ficha de Bloco no seu turno: o 1 primeiro, depois em ordem crescente."),
        rl("1 · Move", `make 1 yellow Move ${g("yellow-move")} with your soldier (optional).`, "1 · Movimento", `faça 1 Movimento amarelo ${g("yellow-move")} com o seu soldado (opcional).`),
        rl("2 · Order", "put your Order token beside your figurine and choose Attack, Move or Special action.", "2 · Ordem", "ponha a sua ficha de Ordem ao lado da miniatura e escolha Ataque, Movimento ou Ação especial."),
        rl("3 · End of turn", "check victory; otherwise next player.", "3 · Fim do turno", "verifique a vitória; senão, próximo jogador."),
        rl("Broken?", "your turn is just 1 Mortar Shot from your HQ.", "Quebrado?", "o seu turno é só 1 Tiro de Morteiro do seu QG.")
      ];
    }
    return [
      rl("1 · Move", `choose one of your Little Soldiers in play and make 1 yellow Move ${g("yellow-move")} (you may stay put). This free Move needs no Order token.`, "1 · Movimento", `escolha um Little Soldier seu em jogo e faça 1 Movimento amarelo ${g("yellow-move")} (pode ficar parado). Este Movimento livre não gasta ficha de Ordem.`),
      rl("2 · Order (mandatory)", `play exactly 1 Order token ${g("order")} from your General beside one of your figurines, then do 1 action on its card: Attack, Move or Special action. Skip only if your General has no Orders left.`, "2 · Ordem (obrigatória)", `jogue exatamente 1 ficha de Ordem ${g("order")} do General ao lado de uma miniatura sua e faça 1 ação da carta dela: Ataque, Movimento ou Ação especial. Só pule se o General não tiver mais Ordens.`),
      rl("3 · End of turn", "run the end-of-turn checks (Quick Ref card “Round end”).", "3 · Fim do turno", "faça as verificações de fim de turno (cartão “Fim da rodada”)."),
      isThreat() ? rl("Threats' turn", "after every player's turn, before End of turn: Scenery removal, then Threat Attack.", "Turno das Ameaças", "depois do turno de cada jogador, antes do Fim do turno: Remoção de cenário, depois Ataque das Ameaças.") : "",
      rl("Out of Orders?", "if others still have Orders, keep taking turns with only Move and End of turn.", "Sem Ordens?", "se outros ainda têm Ordens, continue jogando turnos só com Movimento e Fim do turno."),
      state.tactics ? rl("Tactics cards", "up to 3 per turn, any time in your turn (Reactions in opponents' turns).", "Cartas de Tática", "até 3 por turno, a qualquer momento do seu turno (Reações nos turnos dos adversários).") : ""
    ];
  }

  function roundEndLines() {
    if (state.mode === "royale") {
      return [
        rl("1 soldier left", "that player wins.", "Sobrou 1 soldado", "esse jogador vence."),
        rl("No soldier left", "the player who just played wins.", "Nenhum soldado", "vence quem acabou de jogar."),
        rl("Otherwise", "next player; when everyone has played, start a new round.", "Senão", "próximo jogador; quando todos jogaram, comece nova rodada.")
      ];
    }
    if (state.mode === "king") {
      return [
        rl("Someone still has Orders on their General", "next player's turn.", "Alguém ainda tem Ordens no General", "turno do próximo jogador."),
        rl("Nobody has Orders", `the round ends: Candy distribution ${g("candy")}.`, "Ninguém tem Ordens", `a rodada termina: distribuição de Doces ${g("candy")}.`),
        rl("Candy", "each soldier on Level 2 earns 2 Candy, on Level 1 earns 1, for its General.", "Doces", "cada soldado no Nível 2 ganha 2 Doces, no Nível 1 ganha 1, para o seu General."),
        rl("Reserve empty", "game over: most Candy wins. Otherwise start a new round.", "Reserva vazia", "fim de jogo: vence quem tiver mais Doces. Senão, comece nova rodada.")
      ];
    }
    if (isThreat()) {
      return [
        rl("Put scenery back", "return any scenery removed by the Threats.", "Devolva o cenário", "recoloque o cenário tirado pelas Ameaças."),
        rl("Flag on Threat Victory", "you lose.", "Bandeira na Vitória da Ameaça", "vocês perdem."),
        rl("No Orders on Generals or Chest lids", "round 3 is over: end of game.", "Sem Ordens nos Generais e tampas", "a rodada 3 acabou: fim de jogo."),
        rl("No Orders on Generals, some on lids", "new round.", "Sem Ordens nos Generais, ainda nas tampas", "nova rodada."),
        rl("Orders left on a General", "next player's turn.", "Ainda há Ordens num General", "turno do próximo jogador.")
      ];
    }
    return [
      rl("Flag in a Victory zone", `that ${isTeam() ? "team" : "player"} wins.`, "Bandeira numa zona de Vitória", `${isTeam() ? "essa equipe vence" : "esse jogador vence"}.`),
      rl("No Orders on Generals or Chest lids", "round 3 is over: end of game.", "Sem Ordens nos Generais e tampas", "a rodada 3 acabou: fim de jogo."),
      rl("No Orders on Generals, some on lids", "the round ends: Round preparation.", "Sem Ordens nos Generais, ainda nas tampas", "a rodada termina: preparação da rodada."),
      rl("Orders left on a General", `${isTeam() ? "next player clockwise" : "your opponent's turn"}.`, "Ainda há Ordens num General", `${isTeam() ? "próximo jogador em sentido horário" : "turno do adversário"}.`),
      rl("Star", `the first player to spend all their Orders this round takes the Star ${g("star")} and goes first next round.`, "Estrela", `o primeiro a gastar todas as Ordens nesta rodada pega a Estrela ${g("star")} e começa a próxima rodada.`)
    ];
  }

  function quickReference() {
    const cards = [
      infoCard(t("THE ROUND", "A RODADA"), t("Preparation, then turns", "Preparação, depois turnos"), state.mode === "royale" ? [
        rl("Deploy", "round 1 only: parachute in by Block-token order.", "Posicionar", "só na rodada 1: aterrissar de paraquedas na ordem das fichas de Bloco."),
        rl("Take your Order", "from round 2: your Order token goes back on your card.", "Pegar a Ordem", "a partir da rodada 2: sua ficha de Ordem volta à carta."),
        rl("Deal Block tokens", "everyone (broken included) draws 1 in secret.", "Distribuir fichas de Bloco", "todos (inclusive quebrados) compram 1 em segredo."),
        rl("Turns", "in ascending Block order.", "Turnos", "em ordem crescente das fichas de Bloco.")
      ] : [
        rl("1 · Deploy", "soldiers in an HQ enter the Play Zone.", "1 · Posicionar", "os soldados nos QGs entram na Zona de Jogo."),
        rl("2 · Take Orders", state.mode === "king" ? "1 from each soldier in play + all from Chest bottom (none from the lid)." : "1 from Chest lid + 1 from each soldier in play + all from Chest bottom.", "2 · Pegar Ordens", state.mode === "king" ? "1 de cada soldado em jogo + todas do fundo do Baú (nenhuma da tampa)." : "1 da tampa do Baú + 1 de cada soldado em jogo + todas do fundo do Baú."),
        isThreat() ? rl("3 · First player", "chosen together; clockwise.", "3 · Primeiro jogador", "escolhido em conjunto; sentido horário.") : rl("3 · Return the Star", "the first player returns the Star and starts.", "3 · Devolver a Estrela", "o primeiro jogador devolve a Estrela e começa."),
        rl("Turns", "until nobody has Orders on their General.", "Turnos", "até ninguém ter Ordens no General."),
        state.mode === "king" ? "" : rl("3 rounds", "one per Chest-lid token.", "3 rodadas", "uma por ficha da tampa do Baú.")
      ], state.mode === "royale" ? ["m6"] : ["c5", "c6"]),
      infoCard(t("YOUR TURN", "SEU TURNO"), t("Move, Order, End of turn", "Movimento, Ordem, Fim do turno"), turnSteps(), state.mode === "royale" ? ["m7"] : ["c6", "c7", "c11"]),
      infoCard(t("MOVE", "MOVIMENTO"), `${g("yellow-move")} ${t("Yellow cord", "Cordão amarelo")}`, [
        rl("Start", "one end of the yellow cord touching the figurine's base.", "Início", "uma ponta do cordão amarelo encostada na base da miniatura."),
        rl("Shape", "bend the cord any way you like around scenery; cord and figurine never leave the Play Zone.", "Forma", "dobre o cordão como quiser em volta do cenário; cordão e miniatura nunca saem da Zona de Jogo."),
        rl("End", "place the figurine anywhere along the cord (or don't move).", "Fim", "ponha a miniatura em qualquer ponto ao longo do cordão (ou não se mova)."),
        rl("Scenery", "can't be crossed: go around it.", "Cenário", "não pode ser atravessado: contorne-o."),
        state.superSoldier ? rl("Super Soldier", "after each Move, you may remove 1 Heart from that soldier.", "Super Soldado", "depois de cada Movimento, você pode tirar 1 Coração desse soldado.") : "",
        state.levels ? rl("Levels", "cord touches Level scenery → climb on, Move ends; on top, cord touches its edge → climb down, Move ends.", "Níveis", "cordão toca cenário com Nível → sobe, Movimento termina; em cima, cordão toca a borda → desce, Movimento termina.") : "",
        state.objects ? rl("Objects", "touching an Object at the end of a Move: you may use it (not if an enemy touches it).", "Objetos", "encostado num Objeto no fim do Movimento: pode usá-lo (não se um inimigo encostar nele).") : ""
      ], ["c6", "c7", ...(state.levels ? ["o7"] : []), ...(state.objects ? ["o9"] : [])]),
      infoCard(t("ATTACK", "ATAQUE"), `${g("attack-die")} ${t("Declare, roll, resolve", "Declare, role, resolva")}`, [
        rl("Valid target", "you can trace a line from your figurine's head to the target's whole head without scenery in the way. No maximum distance.", "Alvo válido", "dá para traçar uma linha da cabeça da sua miniatura até a cabeça inteira do alvo sem cenário no caminho. Sem distância máxima."),
        ...rerollLines(),
        ...damageLines(),
        rl("Grenades & Mortars", "need no valid target and hit allies too.", "Granadas e Morteiros", "não precisam de alvo válido e atingem aliados também.")
      ], ["c7", "c8", "c9", "c10"]),
      infoCard(t("ROUND END", "FIM DA RODADA"), t("End-of-turn checks, in order", "Verificações de fim de turno, em ordem"), roundEndLines(), state.mode === "royale" ? ["m7"] : state.mode === "king" ? ["m3", "m4"] : isThreat() ? ["m13"] : ["c11"]),
      infoCard(t("BROKEN", "QUEBRADO"), `${g("heart")} ${t("Hearts ≥ Toughness", "Corações ≥ Resistência")}`, brokenLines(), state.mode === "royale" ? ["m7"] : isThreat() ? ["c9", "m13"] : ["c9"]),
      infoCard(t("WINNING", "VITÓRIA"), t("How this match ends", "Como esta partida termina"), winLines(), winCodes())
    ];
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), ["c12"])}
      <p class="ls-lede">${t("The Bootcamp Book's back page and the 4 gaming-aid cards summarise the same flow.", "A contracapa do Bootcamp e as 4 cartas de ajuda resumem o mesmo fluxo.")}</p>
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  function winLines() {
    if (state.mode === "royale") {
      return [
        rl("Last one standing", "win if yours is the only Little Soldier still in play at a turn's end.", "Último de pé", "vence se o seu for o único Little Soldier em jogo no fim de um turno."),
        rl("Break the last one", "if nobody is left in play, the player who just played wins (even with a Mortar from the HQ).", "Quebrar o último", "se não sobrar ninguém em jogo, vence quem acabou de jogar (até com um Morteiro do QG).")
      ];
    }
    if (state.mode === "king") {
      return [
        rl("Most Candy", "when the Reserve runs out of Candy, the player (or players, if tied) with the most Candy wins.", "Mais Doces", "quando os Doces da Reserva acabam, vence o jogador (ou os jogadores, se empatados) com mais Doces."),
        rl("No Battle Track", "breaking soldiers moves nothing; it just clears the hill.", "Sem Trilha de Batalha", "quebrar soldados não move nada; só limpa a colina.")
      ];
    }
    if (isThreat()) {
      return [
        rl("You all win", state.mode === "octo" ? "if all 3 parts of OCTOCUTIE (Head and 2 Tentacles) are broken." : "if all 3 Threats are broken.", "Todos vencem", state.mode === "octo" ? "se as 3 partes de OCTOCUTIE (Cabeça e 2 Tentáculos) estiverem quebradas." : "se as 3 Ameaças estiverem quebradas."),
        rl("You lose", "if the Flag reaches the Threat Victory space, or at least one Threat is unbroken at the end of round 3.", "Vocês perdem", "se a Bandeira chegar ao espaço de Vitória da Ameaça, ou se ao menos uma Ameaça não estiver quebrada no fim da rodada 3.")
      ];
    }
    return [
      rl("Victory zone", `the Flag ${g("flag")} reaches your Victory zone before the end of round 3: instant win.`, "Zona de Vitória", `a Bandeira ${g("flag")} chega à sua zona de Vitória antes do fim da rodada 3: vitória imediata.`),
      rl("Advantage", "at the end of round 3, the Flag is on your side of the track.", "Vantagem", "no fim da rodada 3, a Bandeira está do seu lado da trilha."),
      rl("Middle space", "the side with the FEWEST Little Soldiers still in play wins; tie → fewest Hearts on its soldiers' cards; still tied → shared win.", "Espaço do meio", "vence o lado com MENOS Little Soldiers ainda em jogo; empate → menos Corações nas cartas dos soldados; ainda empatado → vitória compartilhada."),
      isTeam() ? rl("Teams", "the Flag counts for the whole team: teammates win or lose together.", "Equipes", "a Bandeira conta para a equipe inteira: parceiros vencem ou perdem juntos.") : ""
    ];
  }

  function winCodes() {
    return state.mode === "royale" ? ["m5", "m7"] : state.mode === "king" ? ["m2", "m4"] : isThreat() ? ["m8", "m13"] : ["c5", "c11"];
  }

  // ---------- rule sections ----------

  function aimSection() {
    const idea = {
      bootcamp: t("Each player commands a squad of plastic toys fighting for control of the playroom. Break enemy Little Soldiers: each one moves the Flag on the Battle Track towards your Victory zone. The game lasts at most 3 rounds.", "Cada jogador comanda um esquadrão de brinquedos de plástico lutando pelo controle do quarto de brinquedos. Quebre Little Soldiers inimigos: cada um move a Bandeira na Trilha de Batalha em direção à sua zona de Vitória. O jogo dura no máximo 3 rodadas."),
      king: t("Every player for themselves: climb the hill in the middle of the table and hold it. At the end of each round, soldiers on the hill earn Candy for their General.", "Cada um por si: suba a colina no centro da mesa e segure-a. No fim de cada rodada, soldados na colina ganham Doces para o seu General."),
      royale: t("There are no sides: every other Little Soldier on the battlefield is your opponent. Be the last Little Soldier standing.", "Não há lados: todo outro Little Soldier no campo é seu adversário. Seja o último Little Soldier de pé."),
      threat: t("Strange new toys showed up in the playroom. Work together to break each Threat before the end of round 3.", "Brinquedos estranhos apareceram no quarto. Trabalhem juntos para quebrar cada Ameaça antes do fim da rodada 3."),
      octo: t("OCTOCUTIE wants to come out of the toy box and play. Work together to break its Head and both Tentacles before the end of round 3.", "OCTOCUTIE quer sair da caixa de brinquedos para brincar. Trabalhem juntos para quebrar a Cabeça e os dois Tentáculos antes do fim da rodada 3.")
    }[state.mode];
    return `
      ${sectionHeading("aim", t("Aim & winning", "Objetivo e vitória"), winCodes())}
      <div class="quick-grid">
        ${infoCard(t("THE IDEA", "A IDEIA"), modeName(), [idea, t("You give orders with Order tokens: each one lets a Little Soldier Attack, Move or use its Special action.", "Você dá ordens com fichas de Ordem: cada uma permite que um Little Soldier Ataque, se Mova ou use sua Ação especial.")], state.mode === "bootcamp" ? ["c1"] : winCodes())}
        ${infoCard(t("WINNING", "VITÓRIA"), t("End of the game", "Fim do jogo"), winLines(), winCodes(), "victory-card")}
        ${infoCard(t("TABLE MANNERS", "BOAS MANEIRAS"), t("Same plastic, same toy box", "Mesmo plástico, mesma caixa"), [
          t("Don't argue over a tiny bit of base past the end of a cord, or a piece of scenery bumped by accident.", "Não discutam por um pedacinho de base passando da ponta do cordão, ou por um cenário esbarrado sem querer."),
          isTeam() ? t("“2 Against 2”: anything said aloud must be heard by everyone — no whispering among teammates.", "“2 Against 2”: o que for dito em voz alta precisa ser ouvido por todos — nada de cochichos entre parceiros.") : "",
          t("Each player may make 1 practice shot per game with a Grenade or Mortar: declare it's practice, then ignore the result.", "Cada jogador pode fazer 1 tiro de treino por jogo com Granada ou Morteiro: declare que é treino e ignore o resultado.")
        ], ["c5", "c10", ...(isTeam() ? ["o5"] : [])])}
      </div>`;
  }

  function roundSection() {
    const cards = [
      infoCard(t("STEP 1", "PASSO 1"), t("Deploy your Little Soldiers", "Posicione seus Little Soldiers"), deployLines(), state.mode === "royale" ? ["m6"] : isThreat() ? ["m10"] : state.tactics ? ["o13"] : ["c5"]),
      infoCard(t("STEP 2", "PASSO 2"), state.mode === "royale" ? t("Take your Order token, deal Block tokens", "Pegue a ficha de Ordem, distribua as fichas de Bloco") : t("Take your Order tokens", "Pegue as fichas de Ordem"), takeOrderLines(), state.mode === "royale" ? ["m6"] : state.mode === "king" ? ["c6", "m4"] : ["c6"]),
      state.mode === "royale" ? "" : infoCard(t("STEP 3", "PASSO 3"), isThreat() ? t("First player", "Primeiro jogador") : t("Return the Star", "Devolva a Estrela"), isThreat() ? [
        t("No Star in this mission: at the start of each round you may decide together who will be the new first player. Turns go clockwise.", "Sem Estrela nesta missão: no início de cada rodada vocês podem decidir juntos quem será o novo primeiro jogador. Os turnos seguem em sentido horário.")
      ] : [
        t(`The first player returns the Star ${g("star")} to the Reserve and takes the first turn.`, `O primeiro jogador devolve a Estrela ${g("star")} à Reserva e faz o primeiro turno.`),
        isTeam() || state.players > 2 ? t("Then turns go clockwise around the table.", "Depois os turnos seguem em sentido horário.") : t("Then players alternate turns.", "Depois os jogadores alternam turnos."),
        t("Round 1 is quick: usually just 1 Order each.", "A rodada 1 é rápida: normalmente só 1 Ordem cada.")
      ], isThreat() ? ["m10"] : ["c6"])
    ].filter(Boolean);
    return `
      ${sectionHeading("round", t("The round", "A rodada"), state.mode === "royale" ? ["m6"] : ["c5", "c6"])}
      <p class="ls-lede">${state.mode === "royale"
        ? t("Each round has two phases: Preparing the round, then the players' turns. There is no Return the Star step.", "Cada rodada tem duas fases: preparação da rodada e depois os turnos dos jogadores. Não há o passo de devolver a Estrela.")
        : t("Each round has two phases: Round preparation (3 steps), then the players' turns until nobody has Orders left on their General.", "Cada rodada tem duas fases: preparação da rodada (3 passos) e depois os turnos dos jogadores até ninguém ter Ordens no General.")}</p>
      <div class="quick-grid">${cards.join("")}</div>
      ${state.mode === "bootcamp" && !state.tactics ? `<div class="ls-art-row">${figure("deploy-example", "Deployment example: soldiers placed next to Deployment tokens 1 to 4", "Exemplo de posicionamento: soldados ao lado das fichas 1 a 4", "Deployment example (p. 5): Green drew 2 and 4, Yellow drew 3 and 4.", "Exemplo de posicionamento (p. 5): o Verde tirou 2 e 4, o Amarelo tirou 3 e 4.")}</div>` : ""}`;
  }

  function turnSection() {
    return `
      ${sectionHeading("turn", t("Your turn", "Seu turno"), state.mode === "royale" ? ["m7"] : ["c6", "c7", "c9", "c11"])}
      <div class="quick-grid">
        ${infoCard(t("PHASE 1", "FASE 1"), t("Move", "Movimento"), [
          state.mode === "royale" ? t("Make 1 yellow Move with your Little Soldier.", "Faça 1 Movimento amarelo com o seu Little Soldier.") : t("Choose one of your Little Soldiers in play and make 1 yellow Move.", "Escolha um Little Soldier seu em jogo e faça 1 Movimento amarelo."),
          rl("1", "put one end of the yellow cord against the figurine's base.", "1", "encoste uma ponta do cordão amarelo na base da miniatura."),
          rl("2", "move the other end where you want, bending the cord freely; one end stays on the base. Neither cord nor figurine may leave the Play Zone.", "2", "leve a outra ponta para onde quiser, dobrando o cordão à vontade; uma ponta fica na base. Nem o cordão nem a miniatura podem sair da Zona de Jogo."),
          rl("3", "place the figurine anywhere along the cord. You need not use the whole cord, or move at all.", "3", "ponha a miniatura em qualquer ponto ao longo do cordão. Não é preciso usar o cordão inteiro, nem se mover."),
          t("You must go around scenery.", "É preciso contornar o cenário.")
        ], ["c6", "c7"])}
        ${infoCard(t("PHASE 2", "FASE 2"), t("Order", "Ordem"), [
          state.mode === "royale"
            ? t("Place your 1 Order token next to your figurine, then choose 1 action on your card.", "Ponha a sua única ficha de Ordem ao lado da miniatura e escolha 1 ação da carta.")
            : t("Choose one of your Little Soldiers in play and place 1 Order token from your General next to its figurine. Then choose 1 action on its card:", "Escolha um Little Soldier seu em jogo e ponha 1 ficha de Ordem do General ao lado da miniatura. Depois escolha 1 ação da carta dele:"),
          rl("Attack", "see “Attacking & damage”.", "Ataque", "veja “Ataque e dano”."),
          rl("Move", "another yellow Move: the same soldier as in phase 1, or a different one.", "Movimento", "outro Movimento amarelo: o mesmo soldado da fase 1 ou outro."),
          rl("Special action", "do the action printed on the card (see “Little Soldiers”), in full if possible.", "Ação especial", "faça a ação impressa na carta (veja “Little Soldiers”), por inteiro se possível."),
          state.mode === "royale" ? "" : t("Only 1 token per turn, even if your General holds several. Mandatory while your General has tokens.", "Só 1 ficha por turno, mesmo que o General tenha várias. Obrigatória enquanto o General tiver fichas."),
          state.mode === "royale" ? "" : t("Orders pile up beside a figurine; next round you take back only 1 per soldier, so spreading Orders around pays off.", "As Ordens se acumulam junto da miniatura; na próxima rodada você recupera só 1 por soldado, então espalhar as Ordens compensa.")
        ], state.mode === "royale" ? ["m7"] : ["c7", "c9"])}
        ${infoCard(t("PHASE 3", "FASE 3"), t("End of turn", "Fim do turno"), [
          isThreat() ? t("First the Threats take their turn (see “Mission rules”). Then:", "Primeiro as Ameaças fazem o turno delas (veja “Regras da missão”). Depois:") : t("Check, in this order:", "Verifique, nesta ordem:"),
          ...roundEndLines(),
          state.mode === "royale" ? "" : t("If you have no Orders left but someone else does, you still take turns: only Move and End of turn. Use them to hide — reinforcements arrive next round.", "Se você não tem mais Ordens mas outro jogador tem, você continua jogando turnos: só Movimento e Fim do turno. Use-os para se esconder — reforços chegam na próxima rodada.")
        ], state.mode === "royale" ? ["m7"] : state.mode === "king" ? ["m3", "m4"] : isThreat() ? ["m13"] : ["c11"])}
      </div>`;
  }

  function attackSection() {
    return `
      ${sectionHeading("attack", t("Attacking & damage", "Ataque e dano"), ["c7", "c8", "c9"])}
      <div class="quick-grid">
        ${infoCard(t("STEP 1", "PASSO 1"), t("Declare a valid target", "Declare um alvo válido"), [
          t("Point the target out to your opponent.", "Mostre o alvo ao adversário."),
          rl("Valid", "the target's entire head is visible from your figurine's head: an imaginary line between the two heads touches no scenery.", "Válido", "a cabeça inteira do alvo é visível da cabeça da sua miniatura: uma linha imaginária entre as duas cabeças não toca o cenário."),
          rl("Range", "no maximum: you can Attack from anywhere in the Play Zone.", "Distância", "sem máximo: dá para Atacar de qualquer ponto da Zona de Jogo."),
          t("A broken (out of play) Little Soldier cannot be targeted.", "Um Little Soldier quebrado (fora de jogo) não pode ser alvo.")
        ], ["c7", "c9"])}
        ${infoCard(t("STEP 2", "PASSO 2"), t("Roll the 5 Attack dice", "Role os 5 dados de Ataque"), rerollLines(), ["c8", ...(state.levels ? ["o7"] : []), ...(state.objects ? ["o10"] : [])])}
        ${infoCard(t("STEP 3", "PASSO 3"), t("Resolve the Attack", "Resolva o Ataque"), damageLines(), ["c8", "c9", ...(state.superSoldier ? ["o3"] : [])])}
        ${infoCard(t("RANGE", "ALCANCE"), `${g("yellow-move")} ${g("red-move")} ${t("Checking range", "Medindo o alcance")}`, [
          t("Stretch the yellow or red cord in a straight line from the figurine's base, ignoring scenery (as the crow flies).", "Estique o cordão amarelo ou vermelho em linha reta a partir da base da miniatura, ignorando o cenário (em linha reta)."),
          t("A Little Soldier is within range if any part of its figurine is inside the cord's radius.", "Um Little Soldier está no alcance se qualquer parte da miniatura estiver dentro do raio do cordão."),
          rl("Green distance", "the length of 1 green Move token (used for deployment).", "Distância verde", "o comprimento de 1 ficha de Movimento verde (usada no posicionamento).")
        ], ["c5", "c8"])}
        ${infoCard(t("BROKEN", "QUEBRADO"), t("Hearts ≥ Toughness", "Corações ≥ Resistência"), brokenLines(), state.mode === "royale" ? ["m7"] : state.mode === "king" ? ["c9", "m3"] : isThreat() ? ["c9", "m13"] : ["c9"])}
      </div>
      <div class="ls-art-row">${figure("range-example", "Range example: the red cord reaches the yellow Sniper", "Exemplo de alcance: o cordão vermelho alcança o Sniper amarelo", "Range example (p. 8): the Sniper is within red range of the Grenadier (3 rolls); the Infantry is too far (2 rolls).", "Exemplo de alcance (p. 8): o Sniper está no alcance vermelho do Granadeiro (3 rolagens); a Infantry está longe demais (2 rolagens).")}</div>`;
  }

  function soldierEntries() {
    const sup = state.superSoldier;
    return [
      {
        name: "Infantry",
        lines: [
          rl("Special · Scout", `take 2 Shield tokens ${g("shield")} from the Reserve and place them on the cards of one or more opposing Little Soldiers${isThreat() ? " (or Threats)" : ""}. They need not be valid targets. Shields lower Defense.`, "Especial · Reconhecimento (Scout)", `pegue 2 fichas de Escudo ${g("shield")} da Reserva e ponha-as nas cartas de um ou mais Little Soldiers adversários${isThreat() ? " (ou Ameaças)" : ""}. Não precisam ser alvos válidos. Escudos reduzem a Defesa.`),
          sup ? rl("Super Soldier attack", `for each Lightning ${g("lightning")}, make 1 yellow Move after the Attack.`, "Ataque de Super Soldado", `para cada Raio ${g("lightning")}, faça 1 Movimento amarelo depois do Ataque.`) : ""
        ]
      },
      {
        name: "Sniper",
        lines: [
          rl("Special · Risky shot", `make an Attack on a valid target with the Sniper die ${g("sniper-die")} added to the 5 Attack dice. It rerolls like the others but no other effect may change it.`, "Especial · Tiro arriscado (Risky shot)", `faça um Ataque contra um alvo válido acrescentando o dado do Sniper ${g("sniper-die")} aos 5 dados de Ataque. Ele é rolado de novo como os outros, mas nenhum outro efeito pode alterá-lo.`),
          rl("Sniper die faces", `${g("sniper-face-a")} the Sniper puts 2 Shield tokens on ITS OWN card; ${g("sniper-face-b")} the Sniper puts 1 Heart on its own card. Its Hit faces count normally.`, "Faces do dado do Sniper", `${g("sniper-face-a")} o Sniper põe 2 fichas de Escudo na PRÓPRIA carta; ${g("sniper-face-b")} o Sniper põe 1 Coração na própria carta. As faces de Acerto contam normalmente.`),
          sup ? rl("Super Soldier attack", "for each Lightning, place 1 Shield token from the Reserve on the target's card after the Attack.", "Ataque de Super Soldado", "para cada Raio, ponha 1 ficha de Escudo da Reserva na carta do alvo depois do Ataque.") : ""
        ]
      },
      {
        name: "Grenadier",
        lines: [
          rl("Special · Throw a Grenade", `lay a green Move token touching the Grenadier, put the Grenade die ${g("grenade-die")} on it and flick it towards your targets — the die must roll.`, "Especial · Lançar Granada", `ponha uma ficha de Movimento verde encostada no Granadeiro, o dado de Granada ${g("grenade-die")} em cima e dê um peteleco em direção aos alvos — o dado precisa rolar.`),
          rl("Result 3, 5 or 7", "every figurine, ally or enemy, within yellow range of the die suffers an attack of that many Hits (compare with each one's Defense).", "Resultado 3, 5 ou 7", "toda miniatura, aliada ou inimiga, no alcance amarelo do dado sofre um ataque com esse número de Acertos (compare com a Defesa de cada uma)."),
          rl("Boom!", `${g("boom")} only the Grenadier suffers an attack of 7, wherever it is.`, "Bum!", `${g("boom")} só o Granadeiro sofre um ataque de 7, onde quer que esteja.`),
          sup ? rl("Super Soldier attack", "for each Lightning, choose 1 more valid target and apply the Attack's Hits to it as well.", "Ataque de Super Soldado", "para cada Raio, escolha mais 1 alvo válido e aplique a ele também os Acertos do Ataque.") : ""
        ]
      },
      {
        name: "Operator",
        lines: [
          rl("Special · Mortar shot", `put the Catapult on the Play Zone edge closest to the Operator, aimed any way; put the Mortar token ${g("mortar")} on it and launch it.`, "Especial · Tiro de Morteiro", `ponha a Catapulta na borda da Zona de Jogo mais próxima do Operador, apontada para qualquer lado; ponha a ficha de Morteiro ${g("mortar")} nela e lance.`),
          rl("Damage", "every figurine within range of the landed token, ally or enemy, takes as many Hearts as the face it landed on shows.", "Dano", "toda miniatura no alcance da ficha caída, aliada ou inimiga, recebe tantos Corações quanto mostra a face em que ela caiu."),
          interpretation("the Bootcamp Book does not name the cord for the Mortar's range; use the yellow cord from the token, as for the Grenade, and agree on it before playing.", "o Bootcamp não diz qual cordão mede o alcance do Morteiro; use o cordão amarelo a partir da ficha, como na Granada, e combinem isso antes de jogar."),
          sup ? rl("Super Soldier attack", "for each Lightning, move 1 Heart token from one of your Little Soldiers' cards to any other Little Soldier's card (an opponent's too).", "Ataque de Super Soldado", "para cada Raio, mova 1 ficha de Coração da carta de um Little Soldier seu para a carta de qualquer outro Little Soldier (inclusive de adversário).") : ""
        ]
      }
    ];
  }

  function soldiersSection() {
    return `
      ${sectionHeading("soldiers", t("Little Soldiers", "Little Soldiers"), ["c10", ...(state.superSoldier ? ["o3"] : [])])}
      <p class="ls-lede">${t(`Each card shows Defense ${g("defense")} and Toughness ${g("toughness")} top left, the rank top right, and the actions at the bottom: Attack, Move and its Special action. Grenades and Mortars need no valid target, which makes them very powerful.`, `Cada carta mostra a Defesa ${g("defense")} e a Resistência ${g("toughness")} no alto à esquerda, a patente no alto à direita e as ações embaixo: Ataque, Movimento e a Ação especial. Granadas e Morteiros não precisam de alvo válido, o que os torna muito poderosos.`)}</p>
      <div class="quick-grid">${soldierEntries().map((entry) => infoCard(t("LITTLE SOLDIER", "LITTLE SOLDIER"), entry.name, entry.lines, ["c10", ...(state.superSoldier ? ["o3"] : [])])).join("")}</div>
      ${state.superSoldier ? `<div class="quick-grid">${infoCard(t("SUPER SOLDIER", "SUPER SOLDADO"), `${g("super-soldier")} ${t("Lightning and Moves", "Raios e Movimentos")}`, [
        rl("Lightning", "apply Lightning results in step 3: activate the attacking soldier's special ability once per Lightning rolled (several times if you rolled several).", "Raio", "aplique os Raios no passo 3: ative a habilidade especial do soldado atacante uma vez por Raio rolado (várias vezes se rolou vários)."),
        rl("Move", "for each yellow Move a Little Soldier makes, you may remove 1 Heart from its card.", "Movimento", "para cada Movimento amarelo de um Little Soldier, você pode tirar 1 Coração da carta dele."),
        state.mode === "royale" ? rl("Battle Royale", "these powers are printed on the Super Soldiers side only: a New Recruit's Lightning stays blank until it grabs Supplies.", "Battle Royale", "esses poderes só estão impressos no lado Super Soldiers: o Raio de um Recruta fica vazio até ele pegar Suprimentos.") : ""
      ], ["o3"])}</div>` : ""}
      <div class="ls-art-row">${figure("card-anatomy", "General card and Little Soldier card anatomy", "Anatomia da carta de General e da carta de Little Soldier", "Card anatomy (p. 4): Name, Defense, Toughness, Rank, Special action, Actions.", "Anatomia das cartas (p. 4): Nome, Defesa, Resistência, Patente, Ação especial, Ações.")}</div>`;
  }

  function missionSection() {
    let cards = [];
    let codes = [];
    if (state.mode === "king") {
      codes = ["m2", "m3", "m4"];
      cards = [
        infoCard(t("MISSION RULES", "REGRAS DA MISSÃO"), `${g("level-1")} ${t("The hill pass", "O passe da colina")}`, [
          t("Only Little Soldiers with a Level token on their card can climb to Levels 1 and 2.", "Só Little Soldiers com uma ficha de Nível na carta podem subir aos Níveis 1 e 2."),
          t("When one of them is broken, you may move its token to another of your Little Soldiers still in play — the only time the token can change soldier.", "Quando um deles é quebrado, você pode passar a ficha a outro Little Soldier seu ainda em jogo — a única vez em que a ficha pode mudar de soldado."),
          t("The Battle Track is not used.", "A Trilha de Batalha não é usada.")
        ], ["m3"]),
        infoCard(t("MODIFIED", "MODIFICADO"), t("End of turn", "Fim do turno"), [
          rl("Someone has Orders on their General", "the turn ends; next player's turn.", "Alguém tem Ordens no General", "o turno acaba; turno do próximo jogador."),
          rl("Nobody has Orders on their General", "the round ends: Candy distribution.", "Ninguém tem Ordens no General", "a rodada acaba: distribuição de Doces."),
          rl("Take your Order tokens", "never from the Chest lid (it is empty).", "Pegar as fichas de Ordem", "nunca da tampa do Baú (ela está vazia).")
        ], ["m3", "m4"]),
        infoCard(t("ROUND END", "FIM DA RODADA"), `${g("candy")} ${t("Candy distribution", "Distribuição de Doces")}`, [
          rl("Level 2", "each Little Soldier there earns 2 Candy for its General.", "Nível 2", "cada Little Soldier lá ganha 2 Doces para o seu General."),
          rl("Level 1", "each Little Soldier there earns 1 Candy.", "Nível 1", "cada Little Soldier lá ganha 1 Doce."),
          rl("Not enough Candy", "Level 2 first; within a Level, the toughest soldiers (most Toughness left) first. If a tie means equal soldiers can't all get theirs, nobody gets any Candy, even on lower Levels.", "Doces insuficientes", "o Nível 2 primeiro; dentro de um Nível, os mais resistentes (mais Resistência restante) primeiro. Se um empate impedir que soldados iguais recebam todos, ninguém recebe Doce, nem nos Níveis mais baixos."),
          rl("Nobody got Candy", "discard 1 Candy from the Reserve to the box.", "Ninguém ganhou Doce", "descarte 1 Doce da Reserva para a caixa."),
          rl("Then", "Reserve empty → end of game; otherwise a new Round preparation.", "Depois", "Reserva vazia → fim de jogo; senão, nova preparação de rodada.")
        ], ["m3", "m4"])
      ];
    } else if (state.mode === "royale") {
      codes = ["m5", "m6", "m7"];
      cards = [
        infoCard(t("MISSION RULES", "REGRAS DA MISSÃO"), t("Everyone against everyone", "Todos contra todos"), [
          t("Play with all the Bootcamp rules and chosen modules, plus the changes here. Every other Little Soldier is your opponent.", "Jogue com todas as regras do Bootcamp e os módulos escolhidos, mais as mudanças daqui. Todo outro Little Soldier é seu adversário."),
          t("You only have 1 Order token per turn: make it count.", "Você só tem 1 ficha de Ordem por turno: aproveite."),
          t("The Return the Star step does not exist.", "O passo de devolver a Estrela não existe.")
        ], ["m6"]),
        infoCard(t("SUPPLIES", "SUPRIMENTOS"), `${g("supplies")} ${t("Activating Supplies", "Ativando Suprimentos")}`, [
          rl("Trigger", "the cord or your figurine's base touches one or more Supplies tokens during a yellow Move.", "Gatilho", "o cordão ou a base da miniatura toca uma ou mais fichas de Suprimentos durante um Movimento amarelo."),
          rl("1", "finish moving your figurine.", "1", "termine de mover a miniatura."),
          rl("2", "if not done yet, flip your card to its Super Soldiers side; Hearts and Shields on it go back to the Reserve.", "2", "se ainda não fez, vire a carta para o lado Super Soldiers; Corações e Escudos nela voltam à Reserva."),
          rl("Blocked", "not if an opponent's figurine touches that Supplies token.", "Bloqueado", "não se a miniatura de um adversário estiver encostada nessa ficha."),
          t("A full heal and an upgrade, but only once per game.", "Uma cura completa e uma promoção, mas só uma vez por jogo."),
          interpretation("the Supplies token stays where it is after use; other soldiers who have not flipped yet can still use it.", "a ficha de Suprimentos fica onde está depois de usada; outros soldados que ainda não viraram a carta ainda podem usá-la.")
        ], ["m7"]),
        infoCard(t("BROKEN", "QUEBRADO"), t("Out — but still shooting", "Fora — mas ainda atirando"), [
          ...brokenLines(),
          t("You can still win: breaking the last soldier in play with your Mortar wins the game.", "Você ainda pode vencer: quebrar o último soldado em jogo com o seu Morteiro vence o jogo.")
        ], ["m7"])
      ];
    } else {
      const octo = state.mode === "octo";
      codes = octo ? ["m14", "m10", "m11", "m12", "m13"] : ["m9", "m10", "m11", "m12", "m13"];
      cards = [
        infoCard(t("THREATS", "AMEAÇAS"), octo ? "OCTOCUTIE" : "Pinky · Howdy · Bob", octo ? [
          t("The Head and the two Tentacles are 3 separate Threats.", "A Cabeça e os dois Tentáculos são 3 Ameaças separadas."),
          rl("Tentacles", "Switch 1 and Switch 3 each control one Tentacle's Force Field.", "Tentáculos", "o Interruptor 1 e o Interruptor 3 controlam cada um o Campo de Força de um Tentáculo."),
          rl("Head", "its Force Field is off only while Switches 2 and 4 are both switched off at the same time.", "Cabeça", "seu Campo de Força só fica desligado enquanto os Interruptores 2 e 4 estiverem desligados ao mesmo tempo."),
          t("Defense, Toughness, Target symbols and abilities of each part are printed on the box bottom's profile side: read them there.", "Defesa, Resistência, símbolos de Alvo e habilidades de cada parte estão impressos no lado de perfil do fundo da caixa: leia-os lá.")
        ] : [
          rl("Pinky (Threat 1)", "Defense 2, Toughness 4, Force Field Switch 1.", "Pinky (Ameaça 1)", "Defesa 2, Resistência 4, Interruptor 1."),
          rl("Howdy (Threat 2)", "Defense 2, Toughness 5, Force Field Switch 2.", "Howdy (Ameaça 2)", "Defesa 2, Resistência 5, Interruptor 2."),
          rl("Bob (Threat 3)", "Defense 2, Toughness 4, Force Field Switch 3.", "Bob (Ameaça 3)", "Defesa 2, Resistência 4, Interruptor 3."),
          rl("Special ability", "place 1 Shield on every valid target — this is what each Lightning does in a Threat Attack (only with “Super Soldier”).", "Habilidade especial", "ponha 1 Escudo em cada alvo válido — é o que cada Raio faz num Ataque das Ameaças (só com “Super Soldier”)."),
          rl("Super Special ability", "place 2 Shields on every Little Soldier, valid target or not.", "Habilidade super especial", "ponha 2 Escudos em cada Little Soldier, alvo válido ou não.")
        ], octo ? ["m14"] : ["m9"]),
        infoCard(t("FORCE FIELD", "CAMPO DE FORÇA"), `${g("numbered-block")} ${t("Switch it off first", "Desligue antes")}`, [
          t("Each Threat is protected by a Force Field with a number matching a Switch; no Hearts can be inflicted while it is on.", "Cada Ameaça é protegida por um Campo de Força com um número igual ao de um Interruptor; nenhum Coração pode ser causado enquanto ele estiver ligado."),
          rl("Switch off", "if the cord or your figurine's base touches or crosses a face-up Switch token during a yellow Move: finish moving, then flip the Switch face down. That Force Field is off.", "Desligar", "se o cordão ou a base da miniatura tocar ou cruzar uma ficha de Interruptor virada para cima durante um Movimento amarelo: termine de mover e vire o Interruptor para baixo. Esse Campo de Força está desligado."),
          rl("Grenades and Mortars", "an active Force Field also protects its Threat from them.", "Granadas e Morteiros", "um Campo de Força ativo também protege a Ameaça deles.")
        ], ["m10", "m11"]),
        infoCard(t("ATTACKING A THREAT", "ATACANDO UMA AMEAÇA"), `${g("target")} ${t("Target symbol", "Símbolo de Alvo")}`, [
          rl("Valid target", "only a Threat whose Force Field is off (Switch face down) and whose Target symbol on the box is fully visible from your figurine.", "Alvo válido", "só uma Ameaça com o Campo de Força desligado (Interruptor virado para baixo) e cujo símbolo de Alvo na caixa esteja totalmente visível da sua miniatura."),
          rl("Tokens", "put Hearts and Shields for a Threat in front of its profile, clearly by the right Threat.", "Fichas", "ponha Corações e Escudos de uma Ameaça diante do seu perfil, deixando claro de qual Ameaça são."),
          rl("Grenades and Mortars", "measure distance from the Threat's Target symbol on the box.", "Granadas e Morteiros", "meça a distância a partir do símbolo de Alvo da Ameaça na caixa."),
          rl("Broken", `Hearts ≥ Toughness: put 1 Ouch token ${g("ouch")} by its profile. It is out for the rest of the game: it can't be targeted and doesn't attack.`, "Quebrada", `Corações ≥ Resistência: ponha 1 ficha Ouch ${g("ouch")} junto do perfil. Ela fica fora pelo resto do jogo: não pode ser alvo e não ataca.`)
        ], ["m10", "m11"]),
        infoCard(t("THREATS' TURN · 1", "TURNO DAS AMEAÇAS · 1"), t("Scenery removal", "Remoção de cenário"), [
          t("After each player's turn, before End of turn. Flip 1 face-down Threat Action token at random.", "Depois do turno de cada jogador, antes do Fim do turno. Vire ao acaso 1 ficha de Ação de Ameaça virada para baixo."),
          rl("1, 2 or 3", "temporarily remove the scenery next to the Force Field Switch with that number (mark its spot with Move tokens). Soldiers hiding behind it may become valid targets.", "1, 2 ou 3", "tire temporariamente o cenário ao lado do Interruptor com esse número (marque o lugar com fichas de Movimento). Soldados escondidos atrás dele podem virar alvos válidos."),
          rl("4", octo ? "flip every Force Field Switch face up; shuffle all Threat Action tokens face down again. OCTOCUTIE still attacks." : "flip every Force Field Switch face up; shuffle all Threat Action tokens face down again; skip the Threat Attack.", "4", octo ? "vire todos os Interruptores para cima; embaralhe de novo todas as fichas de Ação de Ameaça viradas para baixo. OCTOCUTIE ataca mesmo assim." : "vire todos os Interruptores para cima; embaralhe de novo todas as fichas de Ação viradas para baixo; pule o Ataque das Ameaças."),
          state.superSoldier ? rl("Super Soldier", "when the 4 is revealed, also remove all Shields from every Threat.", "Super Soldier", "quando sair o 4, tire também todos os Escudos de cada Ameaça.") : ""
        ], octo ? ["m12", "m14"] : ["m12"]),
        infoCard(t("THREATS' TURN · 2", "TURNO DAS AMEAÇAS · 2"), t("Threat Attack", "Ataque das Ameaças"), [
          rl("Targets", "every Little Soldier that is a valid target for at least one unbroken Threat's Target symbol.", "Alvos", "todo Little Soldier que seja alvo válido para o símbolo de Alvo de ao menos uma Ameaça não quebrada."),
          rl("Roll", `roll the 5 Attack dice, then reroll every die without a Hit once${state.superSoldier ? " (keep Lightning results, don't reroll them)" : ""}.`, "Rolar", `role os 5 dados de Ataque e depois role de novo uma vez todos os dados sem Acerto${state.superSoldier ? " (guarde os Raios, não os role de novo)" : ""}.`),
          rl("Hits", "apply all the Hits to each valid target (against each one's Defense).", "Acertos", "aplique todos os Acertos a cada alvo válido (contra a Defesa de cada um)."),
          state.superSoldier ? rl("Lightning", "then, for each Lightning, every valid target takes 1 Shield on its card. With 3 or more Lightning, use the Threat's Super Special ability instead.", "Raios", "depois, para cada Raio, cada alvo válido recebe 1 Escudo na carta. Com 3 ou mais Raios, use em vez disso a habilidade super especial da Ameaça.") : "",
          rl("End of turn", "then put removed scenery back and run the End of turn checks.", "Fim do turno", "depois recoloque o cenário tirado e faça as verificações de Fim do turno.")
        ], ["m12", "m13"]),
        infoCard(t("MODIFIED", "MODIFICADO"), t("Broken soldiers and the report", "Soldados quebrados e o relatório"), [
          t("Each broken Little Soldier moves the Flag 1 space towards the Threat Victory space.", "Cada Little Soldier quebrado move a Bandeira 1 espaço em direção ao espaço de Vitória da Ameaça."),
          t("Mission Report (Missions p. 15): tick each Threat beaten in Easy mode and in “Super Soldiers” mode. Fill both tables to become High General of the Toys.", "Relatório de Missão (Missões p. 15): marque cada Ameaça vencida no modo Fácil e no modo “Super Soldiers”. Preencha as duas tabelas para virar Alto General dos Brinquedos.")
        ], ["m13", "m15"])
      ];
    }
    const art = state.mode === "threat" ? `<div class="ls-art-row">${figure("threat-profile", "Threat profile on the box: names, Defense, Toughness, abilities", "Perfil das Ameaças na caixa: nomes, Defesa, Resistência, habilidades", "Threat profiles (Missions p. 9).", "Perfis das Ameaças (Missões p. 9).")}</div>` : "";
    return `
      ${sectionHeading("mission", `${t("Mission rules", "Regras da missão")}: ${modeName()}`, codes)}
      <p class="ls-lede">${t("The Mission Book only lists what is added or changed: everything else follows the Bootcamp rules above.", "O livro de Missões só lista o que é acrescentado ou mudado: o resto segue as regras do Bootcamp acima.")}</p>
      <div class="quick-grid">${cards.join("")}</div>${art}`;
  }

  function modulesSection() {
    const cards = [];
    if (isTeam()) {
      cards.push(infoCard(moduleName("team"), t("Teams of two", "Equipes de dois"), [
        rl("Turns", "starting with the first player, clockwise around the table.", "Turnos", "começando pelo primeiro jogador, em sentido horário."),
        rl("Squads", "each General: 1 Infantry + 1 different Little Soldier.", "Esquadrões", "cada General: 1 Infantry + 1 Little Soldier diferente."),
        rl("Talking", "everything said aloud must be heard by all: no whispering.", "Conversa", "tudo o que for dito em voz alta tem de ser ouvido por todos: sem cochichos."),
        state.players === 3 ? rl("3 players", "the solo player sits in front of the HQ of the General they are playing at the moment.", "3 jogadores", "o jogador solo senta-se diante do QG do General que estiver jogando no momento.") : "",
        rl("Not with", "“Reinforcements”.", "Não combina com", "“Reinforcements”.")
      ], ["o4", "o5"]));
    }
    if (state.levels) {
      cards.push(infoCard(moduleName("levels"), `${g("level-1")} ${g("level-2")} ${t("High ground", "Terreno alto")}`, [
        rl("Climb up", "during a Move, if the cord touches scenery with a Level token, the soldier may climb: put it on top, as close as possible to where the cord touched. The Move ends.", "Subir", "durante um Movimento, se o cordão tocar um cenário com ficha de Nível, o soldado pode subir: ponha-o em cima, o mais perto possível do ponto tocado. O Movimento termina."),
        rl("Climb down", "during a Move on such scenery, if the cord touches its edge, put the figurine at its base as close as possible to that spot. The Move ends.", "Descer", "durante um Movimento sobre esse cenário, se o cordão tocar a borda, ponha a miniatura na base dele o mais perto possível daquele ponto. O Movimento termina."),
        rl("Room", "any number of soldiers may share scenery if they fit.", "Espaço", "qualquer número de soldados pode dividir o cenário se couberem."),
        rl("Height advantage", "attacking from a higher Level than the target's: +1 reroll. The table is Level 0.", "Vantagem de altura", "atacar de um Nível mais alto que o do alvo: +1 rolagem. A mesa é Nível 0."),
        state.mode === "king" ? rl("King of the Hill", "only soldiers with a Level token on their card may climb.", "King of the Hill", "só soldados com ficha de Nível na carta podem subir.") : ""
      ], ["o6", "o7"]));
    }
    if (state.objects) {
      cards.push(infoCard(moduleName("objects"), `${g("teleporter")} ${t("Activating an Object", "Ativando um Objeto")}`, [
        rl("When", "your Little Soldier touches an Object at the end of a yellow Move: you may use its power.", "Quando", "seu Little Soldier está encostado num Objeto no fim de um Movimento amarelo: você pode usar o poder dele."),
        rl("Blocked", "not if an opponent's Little Soldier also touches that Object.", "Bloqueado", "não se um Little Soldier adversário também estiver encostado nesse Objeto."),
        rl("Teleporter", "place your soldier touching any other Teleporter in play (even one an enemy touches). The Move ends. A Grenade die or Mortar token touching a Teleporter may also be teleported just before it explodes.", "Teletransportador", "ponha o soldado encostado em qualquer outro Teletransportador em jogo (mesmo um que um inimigo toque). O Movimento termina. Um dado de Granada ou ficha de Morteiro encostado num Teletransportador também pode ser teletransportado logo antes de explodir.")
      ], ["o8", "o9"]));
      cards.push(infoCard(t("FREE MODE OBJECTS", "OBJETOS DO MODO LIVRE"), t("After your first Objects game", "Depois da primeira partida com Objetos"), [
        rl("Radar", `${g("radar")} place up to 2 Shields on opposing Little Soldiers anywhere in the Play Zone (like the Infantry's Scout).`, "Radar", `${g("radar")} ponha até 2 Escudos em Little Soldiers adversários em qualquer ponto da Zona de Jogo (como o Reconhecimento da Infantry).`),
        rl("Transmogrifier", `${g("transmogrifier")} swap the positions of any 2 Little Soldiers in play (with their Order tokens), whoever owns them. Mark the spots with the Move tokens first.`, "Transmogrificador", `${g("transmogrifier")} troque de lugar 2 Little Soldiers quaisquer em jogo (com suas fichas de Ordem), de quem forem. Marque os lugares antes com as fichas de Movimento.`),
        rl("Marshmallow", `${g("marshmallow")} make a red Move in a straight line as far as the fully stretched cord allows (you must go the full length), over any objects or scenery; you may end higher than you started (Levels).`, "Marshmallow", `${g("marshmallow")} faça um Movimento vermelho em linha reta até onde o cordão totalmente esticado alcançar (é obrigatório ir até o fim), por cima de objetos ou cenário; pode terminar mais alto do que começou (Níveis).`),
        rl("Switch", `${g("switch")} flip the token. Each red-side Switch ${g("switch-off")} visible in the Play Zone gives every player 1 fewer reroll when Attacking.`, "Interruptor", `${g("switch")} vire a ficha. Cada Interruptor do lado vermelho ${g("switch-off")} visível na Zona de Jogo dá a todos 1 rolagem a menos ao Atacar.`),
        t("You may mix several Object types in one game.", "Dá para misturar vários tipos de Objeto numa partida.")
      ], ["o9", "o10"]));
    }
    if (state.reinforcements) {
      cards.push(infoCard(moduleName("reinforcements"), t("Bigger squads", "Esquadrões maiores"), [
        rl("Per extra soldier", "its card and figurine go in your HQ, and 1 Order token of your colour goes directly on your General.", "Por soldado extra", "a carta e a miniatura vão para o seu QG, e 1 ficha de Ordem da sua cor vai direto para o General."),
        rl("Example", "with 5 Little Soldiers you have 6 Orders, 3 already on the General; after taking 1 from the Chest you have 4 for round 1.", "Exemplo", "com 5 Little Soldiers você tem 6 Ordens, 3 já no General; depois de pegar 1 do Baú, tem 4 para a rodada 1."),
        rl("Fairness", "both sides add the same number.", "Equilíbrio", "os dois lados acrescentam o mesmo número.")
      ], ["o11"]));
    }
    if (state.tactics) {
      cards.push(infoCard(moduleName("tactics"), `${g("tactics-card")} ${t("Playing Tactics cards", "Jogando cartas de Tática")}`, [
        rl("When", `any time during your turn: General Tactics ${g("general-card")} or Soldier Tactics ${g("soldier-card")} cards. Reaction cards ${g("reaction")} only in an opponent's turn, at the moment their text says.`, "Quando", `a qualquer momento do seu turno: cartas de Tática de General ${g("general-card")} ou de Soldado ${g("soldier-card")}. Cartas de Reação ${g("reaction")} só no turno de um adversário, no momento indicado no texto.`),
        rl("Limit", "3 cards per turn; no more than 3 played cards in your HQ at once; no hand limit.", "Limite", "3 cartas por turno; no máximo 3 cartas jogadas no seu QG ao mesmo tempo; sem limite de mão."),
        rl("1 · Character", "General card: your General must hold at least as many Orders as the number top left. Soldier card: one of your soldiers in play must have at least that many Orders beside it. Orders are not spent.", "1 · Personagem", "carta de General: o seu General precisa ter ao menos tantas Ordens quanto o número no alto à esquerda. Carta de Soldado: um soldado seu em jogo precisa ter ao menos esse número de Ordens ao lado. As Ordens não são gastas."),
        rl("2 · Effect", "read it aloud and apply it as fully as possible; the card beats the rules.", "2 · Efeito", "leia em voz alta e aplique o máximo possível; a carta vence as regras."),
        rl("3 · HQ", "put the played card face up in your HQ.", "3 · QG", "ponha a carta jogada virada para cima no seu QG."),
        rl("4 · End of turn", "discard your played cards — only then.", "4 · Fim do turno", "descarte as cartas jogadas — só nesse momento."),
        rl("Reactions", "count towards your next turn's 3-card limit and stay in your HQ until the end of your next turn.", "Reações", "contam no limite de 3 cartas do seu próximo turno e ficam no QG até o fim do seu próximo turno."),
        rl("Fighting Fit", "has no Order icon: play it on any Little Soldier, even with no Orders.", "Fighting Fit", "não tem ícone de Ordem: jogue em qualquer Little Soldier, mesmo sem Ordens."),
        rl("Bonus Orders", `${g("bonus-order")} gained from General's Orders work like Order tokens but return to the Reserve at the end of the round.`, "Ordens Bônus", `${g("bonus-order")} ganhas com General's Orders funcionam como fichas de Ordem, mas voltam à Reserva no fim da rodada.`)
      ], ["o14", "o15"]));
      cards.push(infoCard(t("CRATES", "CAIXOTES"), `${g("crate")} ${t("Draw more cards", "Compre mais cartas")}`, [
        rl("Trigger", "during a Move, your figurine's base or the cord touches or crosses a Crate showing your colour.", "Gatilho", "durante um Movimento, a base da miniatura ou o cordão toca ou cruza um Caixote com a sua cor."),
        rl("Then", "finish the Move, flip the Crate (now your opponent's colour) and draw 2 Tactics cards. Empty deck: shuffle the discards.", "Depois", "termine o Movimento, vire o Caixote (agora na cor do adversário) e compre 2 cartas de Tática. Baralho vazio: embaralhe o descarte."),
        rl("Blocked", "you can't if an opponent's figurine touches that Crate — staying on enemy Crates denies them cards.", "Bloqueado", "não pode se uma miniatura adversária estiver encostada no Caixote — ficar sobre Caixotes inimigos nega cartas a eles."),
        isTeam() ? rl("2 Against 2", "play cards only on your own General and soldiers; each General has its own hand; no giving cards. Reactions may answer either opponent, even when they target your teammate.", "2 Against 2", "jogue cartas só no seu General e nos seus soldados; cada General tem a própria mão; não se dá cartas. Reações podem responder a qualquer adversário, mesmo quando miram o seu parceiro.") : ""
      ], ["o15"]));
    }
    return `
      ${sectionHeading("modules", t("Modules in play", "Módulos em jogo"), ["o2"])}
      <p class="ls-lede">${t("Only the modules selected for this match are shown. Each one only changes what it says; everything else stays as in the Bootcamp Book.", "Só os módulos escolhidos para esta partida aparecem. Cada um só muda o que diz; o resto fica como no Bootcamp.")}${state.superSoldier ? ` ${t("“Super Soldier” is explained under “Little Soldiers”.", "“Super Soldier” está explicado em “Little Soldiers”.")}` : ""}</p>
      <div class="quick-grid">${cards.join("")}</div>
      ${state.levels && state.objects && state.tactics ? `<div class="ls-art-row">${figure("ultimate-battlefield", "The Ultimate Battlefield combining all modules", "O Campo de Batalha Supremo combinando todos os módulos", "“The Ultimate Battlefield” (Modules p. 16): an example with every module.", "“The Ultimate Battlefield” (Módulos p. 16): um exemplo com todos os módulos.")}</div>` : ""}`;
  }

  // ---------- icons ----------

  function iconEntries() {
    const all = [
      ["flag", "c3", "Shows who is winning on the Battle Track (or the Threat Track).", "Mostra quem está vencendo na Trilha de Batalha (ou de Ameaça).", () => state.mode !== "royale"],
      ["attack-die", "c8", "Rolled 5 at a time for every Attack.", "Rolados 5 de cada vez em todo Ataque.", () => true],
      ["hit", "c8", "Hit face: each Hit above the target's Defense = 1 Heart.", "Face de Acerto: cada Acerto acima da Defesa do alvo = 1 Coração.", () => true],
      ["lightning", "c9", state.superSoldier ? "Triggers the attacker's special ability once." : "Blank in this match (used by “Super Soldier”).", state.superSoldier ? "Ativa uma vez a habilidade especial do atacante." : "Vazio nesta partida (usado por “Super Soldier”).", () => true],
      ["sniper-die", "c10", "Added by the Sniper's Risky shot.", "Acrescentado pelo Tiro arriscado do Sniper.", () => true],
      ["sniper-face-a", "c10", "Sniper die: the Sniper puts 2 Shields on its own card.", "Dado do Sniper: o Sniper põe 2 Escudos na própria carta.", () => true],
      ["sniper-face-b", "c10", "Sniper die: the Sniper puts 1 Heart on its own card.", "Dado do Sniper: o Sniper põe 1 Coração na própria carta.", () => true],
      ["grenade-die", "c10", "Flicked by the Grenadier: 3, 5 or 7 Hits in yellow range.", "Lançado com peteleco pelo Granadeiro: 3, 5 ou 7 Acertos no alcance amarelo.", () => true],
      ["boom", "c10", "Grenade die: only the Grenadier suffers an attack of 7.", "Dado de Granada: só o Granadeiro sofre um ataque de 7.", () => true],
      ["mortar", "c10", "Launched by the Catapult; its face shows the Hearts dealt.", "Lançada pela Catapulta; a face mostra os Corações causados.", () => true],
      ["numbered-block", "c5", isThreat() ? "Force Field Switches (face up) and Threat Actions (face down)." : state.mode === "royale" ? "Turn order each round." : state.tactics ? "Not used in this match (Advanced Tactics deployment)." : "Drawn to pick the Deployment token for each soldier.", isThreat() ? "Interruptores de Campo de Força (para cima) e Ações de Ameaça (para baixo)." : state.mode === "royale" ? "Ordem dos turnos a cada rodada." : state.tactics ? "Não usadas nesta partida (posicionamento de Advanced Tactics)." : "Sorteadas para escolher a ficha de Posicionamento de cada soldado.", () => true],
      ["deployment", "c3", "Soldiers enter the Play Zone next to it.", "Os soldados entram na Zona de Jogo ao lado dela.", () => state.mode !== "royale"],
      ["move-token", "c5", "Its length is the green distance; also marks positions.", "Seu comprimento é a distância verde; também marca posições.", () => true],
      ["green-move", "c5", "Green distance: 1 Move token.", "Distância verde: 1 ficha de Movimento.", () => true],
      ["yellow-move", "c6", "Yellow cord: every Move, Grenade range.", "Cordão amarelo: todo Movimento, alcance da Granada.", () => true],
      ["red-move", "c8", "Red cord: range for the extra reroll" + (state.objects ? "; Marshmallow jump" : "") + ".", "Cordão vermelho: alcance para a rolagem extra" + (state.objects ? "; salto do Marshmallow" : "") + ".", () => true],
      ["order", "c6", "Spent to give an Order; returns via HQ, soldiers and Chest.", "Gasta para dar uma Ordem; volta pelo QG, soldados e Baú.", () => true],
      ["star", "c4", "First player marker.", "Marcador de primeiro jogador.", () => state.mode === "bootcamp" || state.mode === "king"],
      ["heart", "c8", "Damage: 1 per Hit above Defense.", "Dano: 1 por Acerto acima da Defesa.", () => true],
      ["shield", "c8", "Each one lowers Defense by 1 (minimum 0).", "Cada uma reduz a Defesa em 1 (mínimo 0).", () => true],
      ["general-card", "c4", state.tactics ? "General card; also marks General Tactics cards." : "General card: holds your Orders for the round.", state.tactics ? "Carta de General; também marca cartas de Tática de General." : "Carta de General: guarda as Ordens da rodada.", () => usesGenerals()],
      ["soldier-card", "c4", state.tactics ? "Little Soldier card; also marks Soldier Tactics cards." : "Little Soldier card.", state.tactics ? "Carta de Little Soldier; também marca cartas de Tática de Soldado." : "Carta de Little Soldier.", () => true],
      ["new-recruit", "c4", "New Recruit side of a Little Soldier card.", "Lado Recruta da carta de Little Soldier.", () => true],
      ["super-soldier", "o3", "Super Soldiers side: extra abilities.", "Lado Super Soldiers: habilidades extras.", () => state.superSoldier],
      ["defense", "c8", "Base Defense, top left of the card.", "Defesa base, no alto à esquerda da carta.", () => true],
      ["toughness", "c9", "Hearts needed to break the soldier.", "Corações necessários para quebrar o soldado.", () => true],
      ["level-1", "o6", state.mode === "king" ? "Level 1; on an Infantry card it is the hill pass." : "Level 1 scenery: climbable.", state.mode === "king" ? "Nível 1; na carta da Infantry é o passe da colina." : "Cenário de Nível 1: escalável.", () => state.levels],
      ["level-2", "o7", "Level 2 scenery: higher still.", "Cenário de Nível 2: ainda mais alto.", () => state.levels],
      ["teleporter", "o9", "Jump to another Teleporter.", "Salte para outro Teletransportador.", () => state.objects],
      ["radar", "o10", "Up to 2 Shields on opponents anywhere.", "Até 2 Escudos em adversários em qualquer lugar.", () => state.objects],
      ["transmogrifier", "o10", "Swap any 2 Little Soldiers.", "Troque 2 Little Soldiers quaisquer.", () => state.objects],
      ["marshmallow", "o10", "Full-length straight red Move.", "Movimento vermelho reto com o cordão inteiro.", () => state.objects],
      ["switch", "o10", "Flip to change the lights.", "Vire para mudar as luzes.", () => state.objects],
      ["switch-off", "o10", "Red side: −1 reroll for everyone per visible token.", "Lado vermelho: −1 rolagem para todos por ficha visível.", () => state.objects],
      ["candy", "m3", "Victory points of King of the Hill.", "Pontos de vitória de King of the Hill.", () => state.mode === "king"],
      ["supplies", "m7", "Upgrade to Super Soldier and heal, once.", "Promoção a Super Soldado e cura, uma vez.", () => state.mode === "royale"],
      ["target", "m10", "A Threat's aiming point on the box.", "O ponto de mira de uma Ameaça na caixa.", () => isThreat()],
      ["ouch", "m11", "Marks a broken Threat.", "Marca uma Ameaça quebrada.", () => isThreat()],
      ["tactics-card", "o13", "Tactics card.", "Carta de Tática.", () => state.tactics],
      ["reaction", "o15", "Reaction card: play in an opponent's turn.", "Carta de Reação: jogue no turno de um adversário.", () => state.tactics],
      ["crate", "o15", "Touch one of your colour to draw 2 Tactics cards.", "Toque um da sua cor para comprar 2 cartas de Tática.", () => state.tactics],
      ["bonus-order", "o14", "Temporary Order token for one round.", "Ficha de Ordem temporária por uma rodada.", () => state.tactics]
    ];
    return all.filter((entry) => entry[4]());
  }

  function iconsSection() {
    return `
      ${sectionHeading("icons", t("Icons", "Ícones"), ["m16", "c8", "c10"])}
      <p class="ls-lede">${t("The Mission Book's last page is the icon key; the dice faces come from the Bootcamp Book. Only icons used in this match are shown.", "A última página do livro de Missões é a legenda de ícones; as faces dos dados vêm do Bootcamp. Só aparecem os ícones usados nesta partida.")}</p>
      <div class="icon-grid ls-icon-grid">${iconEntries().map(([file, code, en, pt]) => `
        <article class="icon-card">
          <div class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}.webp" alt="${t(ICON_NAMES[file][0], ICON_NAMES[file][1])}" loading="lazy"></div>
          <div>
            <h3>${t(ICON_NAMES[file][0], ICON_NAMES[file][1])}</h3>
            <p>${t(en, pt)}</p>
            ${referenceLink(code)}
          </div>
        </article>`).join("")}</div>`;
  }

  // ---------- examples, readings, glossary ----------

  function examplesSection() {
    const items = [
      [t("Deployment", "Posicionamento"), t("Green draws 2 and 4, Yellow draws 3 and 4: each places a soldier in contact with a Move token touching the matching Deployment token — you may start right next to an enemy.", "O Verde tira 2 e 4, o Amarelo tira 3 e 4: cada um põe um soldado encostado numa ficha de Movimento apoiada na ficha de Posicionamento correspondente — dá para começar ao lado de um inimigo."), "c5", state.mode === "bootcamp" && !state.tactics],
      [t("Partial Move", "Movimento parcial"), t("Green moves its Infantry behind scenery using only half of the yellow cord.", "O Verde move a Infantry para trás do cenário usando só metade do cordão amarelo."), "c7", true],
      [t("Red range", "Alcance vermelho"), t("The Yellow Sniper is within red range of the Green Grenadier: 3 rolls against it. The Yellow Infantry is too far: only 2 rolls.", "O Sniper amarelo está no alcance vermelho do Granadeiro verde: 3 rolagens contra ele. A Infantry amarela está longe demais: só 2 rolagens."), "c8", true],
      [t("Damage", "Dano"), t("Green rolls 4 Hits against the Yellow Sniper (Defense 3): 1 Heart goes on the Sniper's card.", "O Verde rola 4 Acertos contra o Sniper amarelo (Defesa 3): 1 Coração vai para a carta do Sniper."), "c8", true],
      [t("Reinforcements", "Reforços"), t("With 5 Little Soldiers you have 6 Orders, 3 already on your General; after taking 1 from the Chest you have 4 for round 1.", "Com 5 Little Soldiers você tem 6 Ordens, 3 já no General; depois de pegar 1 do Baú, tem 4 para a rodada 1."), "o11", state.reinforcements > 0 || state.players === 1],
      [t("Climbing", "Escalada"), t("The yellow Operator's cord touches Level scenery: it climbs on, placed nearest the touch point, and its Move ends. Later the cord touches the edge: it climbs down beside the scenery.", "O cordão do Operador amarelo toca um cenário com Nível: ele sobe, posto no ponto mais próximo do toque, e o Movimento termina. Depois o cordão toca a borda: ele desce ao lado do cenário."), "o7", state.levels],
      [t("Teleporter", "Teletransportador"), t("Green's Infantry ends a Move touching a Teleporter on the table and jumps to a phone with another Teleporter.", "A Infantry verde termina um Movimento encostada num Teletransportador na mesa e salta para um celular com outro Teletransportador."), "o9", state.objects],
      [t("Transmogrifier and Marshmallow", "Transmogrificador e Marshmallow"), t("Green's Infantry touches a Transmogrifier: its Grenadier swaps places with the yellow Sniper. Touching a Marshmallow, it makes a straight red Move that jumps over scenery.", "A Infantry verde toca um Transmogrificador: o Granadeiro dela troca de lugar com o Sniper amarelo. Tocando um Marshmallow, faz um Movimento vermelho reto que pula o cenário."), "o10", state.objects],
      [t("Tactics requirements", "Requisitos de Tática"), t("Green holds Marathon Man (2), Trigger Happy (2) and Warmonger (3). Its Infantry has 2 Orders: it can play Marathon Man and Trigger Happy one after the other, but not Warmonger.", "O Verde tem Marathon Man (2), Trigger Happy (2) e Warmonger (3). A Infantry dele tem 2 Ordens: pode jogar Marathon Man e Trigger Happy uma depois da outra, mas não Warmonger."), "o14", state.tactics],
      [t("Chain deployment", "Posicionamento em corrente"), t("Green spreads its soldiers over different zones; Yellow makes a chain to gain ground.", "O Verde espalha os soldados por zonas diferentes; o Amarelo faz uma corrente para avançar."), "o13", state.tactics],
      [t("Hill pass", "Passe da colina"), t("The yellow Operator carries the Level token, so it can climb the hill and earn Candy at round end. When the green Infantry breaks, its token passes to the Grenadier.", "O Operador amarelo leva a ficha de Nível, então pode subir a colina e ganhar Doce no fim da rodada. Quando a Infantry verde é quebrada, a ficha passa para o Granadeiro."), "m3", state.mode === "king"],
      [t("Losing cover", "Perdendo cobertura"), t("Yellow flips Threat Action 3: the scenery next to Switch 3 is lifted, and the Infantry hiding behind it becomes a valid target.", "O Amarelo vira a Ação de Ameaça 3: o cenário ao lado do Interruptor 3 é tirado, e a Infantry escondida atrás dele vira alvo válido."), "m12", isThreat()],
      [t("Scouting Threats", "Reconhecendo Ameaças"), t("Green's Infantry uses Scout to put 1 Shield on Pinky and 1 on Bob.", "A Infantry verde usa o Reconhecimento para pôr 1 Escudo em Pinky e 1 em Bob."), "m11", state.mode === "threat"]
    ].filter((item) => item[3]);
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), ["c5", "c7", "c8"])}
      <div class="quick-grid">${items.map(([title, text, code]) => `
        <article class="info-card">
          <span class="component-label">${t("EXAMPLE", "EXEMPLO")}</span>
          <h3>${title}</h3>
          <p>${text}</p>
          ${referenceLink(code)}
        </article>`).join("")}</div>`;
  }

  function faqSection() {
    const items = [
      [t("Mortar range", "Alcance do Morteiro"), t("“All figurines within range” — the Bootcamp Book names no cord. The guide uses the yellow cord from the landed token, as for the Grenade; agree on it before the game.", "“Todas as miniaturas no alcance” — o Bootcamp não diz qual cordão. O guia usa o cordão amarelo a partir da ficha caída, como na Granada; combinem antes do jogo."), "c10", true],
      [t("Orders left after a Wipeout", "Ordens que sobram depois de uma Aniquilação"), t("A Wipeout ends the round immediately. The rules don't say to discard Orders still on the Generals, so the guide keeps them there for the next round.", "Uma Aniquilação termina a rodada imediatamente. As regras não mandam descartar as Ordens que ainda estão nos Generais, então o guia as mantém lá para a próxima rodada."), "c9", usesBattleTrack()],
      [t("Two figurines that look the same", "Duas miniaturas iguais"), t("With 3–4 players two people may use the same colour (and both may have an Infantry). The guide's reading: keep track of whose is whose, e.g. by deploying each player's soldiers on their own side or marking bases; Orders always return to the owner's General.", "Com 3–4 jogadores duas pessoas podem usar a mesma cor (e ambas podem ter uma Infantry). Leitura do guia: controlem de quem é cada uma, por exemplo posicionando os soldados de cada jogador do próprio lado ou marcando as bases; as Ordens sempre voltam ao General do dono."), "o4", state.players >= 3 && state.mode !== "royale"],
      [t("Turn order with 3–4 players", "Ordem dos turnos com 3–4 jogadores"), t("King of the Hill does not say; the guide uses the “2 Against 2” rule: clockwise from the first player, and deployment also alternates clockwise.", "King of the Hill não diz; o guia usa a regra de “2 Against 2”: sentido horário a partir do primeiro jogador, e o posicionamento também alterna em sentido horário."), "o5", state.mode === "king" && state.players > 2],
      [t("Wipeout on the hill", "Aniquilação na colina"), t("The Battle Track is not used in King of the Hill and the mission redefines when a round ends (nobody has Orders), so the guide ignores the Wipeout's Flag move and round end.", "A Trilha de Batalha não é usada em King of the Hill e a missão redefine quando a rodada acaba (ninguém tem Ordens), então o guia ignora o movimento da Bandeira e o fim de rodada da Aniquilação."), "m3", state.mode === "king"],
      [t("Mortar “from your HQ”", "Morteiro “do seu QG”"), t("A broken Battle Royale player fires from their HQ: the guide puts the Catapult on the Play Zone edge closest to that player's seat.", "Um jogador quebrado no Battle Royale dispara do QG: o guia põe a Catapulta na borda da Zona de Jogo mais próxima do lugar desse jogador."), "m7", state.mode === "royale"],
      [t("Revealed Threat Actions", "Ações de Ameaça reveladas"), t("A 1–3 token stays face up after use; the next Threats' turn flips one of the remaining face-down tokens. The 4 reshuffles all of them.", "Uma ficha 1–3 fica virada para cima depois de usada; o próximo turno das Ameaças vira uma das fichas ainda viradas para baixo. O 4 embaralha todas de novo."), "m12", isThreat()],
      [t("All Threats broken early", "Todas as Ameaças quebradas cedo"), t("Victory is checked at the end of the game. Once every Threat is broken nothing can attack you, so the guide lets you declare victory at once.", "A vitória é verificada no fim do jogo. Quando todas as Ameaças estão quebradas nada pode atacar vocês, então o guia permite declarar vitória na hora."), "m13", isThreat()],
      [t("Wipeout against Threats", "Aniquilação contra as Ameaças"), t("The mission replaces the Flag rule with “1 space per broken Little Soldier”; the guide applies no extra Wipeout space.", "A missão troca a regra da Bandeira por “1 espaço por Little Soldier quebrado”; o guia não aplica o espaço extra da Aniquilação."), "m13", isThreat()],
      [t("Who is “your colour” in Threats?", "Qual é a “sua cor” nas Ameaças?"), t("Players are allies; colours only separate your tokens and figurines from your partners'.", "Os jogadores são aliados; as cores só separam as suas fichas e miniaturas das dos parceiros."), "m9", isThreat() && state.players > 1],
      [t("Card names in Portuguese", "Nomes em português"), t("The components are printed in English; this guide keeps the printed names (Infantry, Sniper, Grenadier, Operator, card titles) and translates the rules.", "Os componentes são impressos em inglês; este guia mantém os nomes impressos (Infantry, Sniper, Grenadier, Operator, títulos de cartas) e traduz as regras."), "c10", state.language === "pt-BR"]
    ].filter((item) => item[3]);
    return `
      ${sectionHeading("faq", t("Guide's readings", "Leituras do guia"), ["c10", "m13"])}
      <p class="glossary-intro">${t("Where the books are silent, this guide states its own reading, labelled as such. Agree on them before playing.", "Onde os livros são omissos, este guia dá a sua própria leitura, identificada como tal. Combinem antes de jogar.")}</p>
      <div class="quick-grid">${items.map(([q, a, code]) => `
        <article class="info-card">
          <span class="component-label">${t("GUIDE'S READING", "LEITURA DO GUIA")}</span>
          <h3>${q}</h3>
          <p>${a}</p>
          ${referenceLink(code)}
        </article>`).join("")}</div>`;
  }

  function glossarySection() {
    const visible = [
      { term: ["Play Zone", "Zona de Jogo"], text: ["The marked-out battlefield; cords and figurines never leave it during a Move.", "O campo de batalha delimitado; cordões e miniaturas nunca saem dele durante um Movimento."], code: "c2" },
      { term: ["Reserve", "Reserva"], text: ["Shared components around the Play Zone.", "Componentes compartilhados em volta da Zona de Jogo."], code: "c3" },
      { term: ["HQ", "QG"], text: ["Your General, Chest and Little Soldier cards; broken soldiers wait here.", "Seu General, Baú e cartas de Little Soldier; soldados quebrados esperam aqui."], code: "c4" },
      { term: ["Chest lid / bottom", "Tampa / fundo do Baú"], text: ["Lid: your 3 round tokens. Bottom: Orders recovered from broken soldiers.", "Tampa: suas 3 fichas de rodada. Fundo: Ordens recuperadas de soldados quebrados."], code: "c6" },
      { term: ["Order", "Ordem"], text: ["A token placed beside a figurine to let it Attack, Move or use its Special action.", "Ficha posta ao lado de uma miniatura para que ela Ataque, se Mova ou use a Ação especial."], code: "c7" },
      { term: ["Valid target", "Alvo válido"], text: ["A figurine whose whole head is visible from the attacker's head.", "Miniatura cuja cabeça inteira é visível da cabeça do atacante."], code: "c7" },
      { term: ["Range", "Alcance"], text: ["Measured with a cord in a straight line, ignoring scenery.", "Medido com um cordão em linha reta, ignorando o cenário."], code: "c8" },
      { term: ["Green distance", "Distância verde"], text: ["The length of 1 green Move token.", "O comprimento de 1 ficha de Movimento verde."], code: "c5" },
      { term: ["Defense", "Defesa"], text: ["Hits needed before damage; −1 per Shield token.", "Acertos necessários antes do dano; −1 por ficha de Escudo."], code: "c8" },
      { term: ["Toughness", "Resistência"], text: ["Hearts that break a Little Soldier.", "Corações que quebram um Little Soldier."], code: "c9" },
      { term: ["Broken", "Quebrado"], text: ["A Little Soldier with Hearts ≥ Toughness; out of play until redeployed.", "Little Soldier com Corações ≥ Resistência; fora de jogo até ser reposicionado."], code: "c9" },
      { term: ["Wipeout", "Aniquilação (Wipeout)"], text: ["Your last soldier in play breaks: Flag +1 extra space, round ends.", "Seu último soldado em jogo é quebrado: Bandeira +1 espaço extra, a rodada acaba."], code: "c9", show: usesBattleTrack() },
      { term: ["Battle Track", "Trilha de Batalha"], text: ["Two cards with the Flag; each end is a Victory zone.", "Duas cartas com a Bandeira; cada ponta é uma zona de Vitória."], code: "c3", show: usesBattleTrack() },
      { term: ["Advantage", "Vantagem"], text: ["The Flag is on your side of the Battle Track.", "A Bandeira está do seu lado da Trilha de Batalha."], code: "c11", show: usesBattleTrack() },
      { term: ["Practice shot", "Tiro de treino"], text: ["Once per game, a Grenade or Mortar throw whose result is ignored.", "Uma vez por jogo, um lançamento de Granada ou Morteiro cujo resultado é ignorado."], code: "c10" },
      { term: ["Level", "Nível"], text: ["Height of scenery with a Level token; the table is Level 0.", "Altura de um cenário com ficha de Nível; a mesa é Nível 0."], code: "o7", show: state.levels },
      { term: ["Free mode", "Modo livre"], text: ["Module variant: use the tokens however you like.", "Variante de módulo: use as fichas como quiserem."], code: "o7", show: state.levels || state.objects },
      { term: ["Force Field", "Campo de Força"], text: ["Protects a Threat until its numbered Switch is flipped face down.", "Protege uma Ameaça até o Interruptor numerado ser virado para baixo."], code: "m10", show: isThreat() },
      { term: ["Threat Action", "Ação de Ameaça"], text: ["Face-down Block token flipped in the Threats' turn.", "Ficha de Bloco virada para baixo revelada no turno das Ameaças."], code: "m12", show: isThreat() },
      { term: ["Parachute deployment", "Posicionamento de paraquedas"], text: ["Launching a Move token by Catapult and placing your figurine where it lands.", "Lançar uma ficha de Movimento pela Catapulta e pôr a miniatura onde ela cair."], code: "m6", show: state.mode === "royale" },
      { term: ["Reaction", "Reação"], text: ["Tactics card played in an opponent's turn.", "Carta de Tática jogada no turno de um adversário."], code: "o15", show: state.tactics }
    ].filter((item) => item.show !== false);
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), ["c3", "c9"])}
      <div class="quick-grid glossary-grid">${visible.map((item) => `
        <article class="info-card glossary-card">
          <span class="component-label">${t("TERM", "TERMO")}</span>
          <h3>${t(item.term[0], item.term[1])}</h3>
          <p>${t(item.text[0], item.text[1])}</p>
          ${referenceLink(item.code)}
        </article>`).join("")}</div>`;
  }

  // ---------- render ----------

  function renderInto(host) {
    root = host;
    document.body.classList.add("theme-little-soldiers");
    document.documentElement.lang = state.language;
    document.title = t("Little Soldiers — Field Manual", "Little Soldiers — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Little Soldiers: the Bootcamp battle, the four missions and the six modules, with a filtered setup checklist, turns, attacks, every Little Soldier and the icon key.",
        "Regras interativas bilíngues de Little Soldiers: a batalha do Bootcamp, as quatro missões e os seis módulos, com lista de preparação filtrada, turnos, ataques, cada Little Soldier e a legenda de ícones."
      );
    }
    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook", "Livro interativo")}</p>
          <h1>Little Soldiers</h1>
          <p class="hero-intro">${t(
            "Plastic toy soldiers fight for control of the playroom. Build a battlefield from mugs and cereal boxes, measure Moves with cords, roll dice to break enemy soldiers, flick grenades and launch mortars with a catapult.",
            "Soldadinhos de plástico lutam pelo controle do quarto de brinquedos. Monte um campo de batalha com canecas e caixas de cereal, meça Movimentos com cordões, role dados para quebrar soldados inimigos, lance granadas com peteleco e dispare morteiros com uma catapulta."
          )}</p>
          <div class="hero-meta"><span>${t("1–6 players (by mode)", "1–6 jogadores (conforme o modo)")}</span><span>15–30 min</span><span>${t("Dexterity skirmish", "Escaramuça de destreza")}</span><span>${modeName()}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/little-soldiers.webp" alt="${t("Cover of the Little Soldiers Bootcamp Book", "Capa do Bootcamp Book de Little Soldiers")}" fetchpriority="high"><figcaption>${t("Bootcamp Book, page 1", "Bootcamp Book, página 1")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("Field guide", "Guia de campo")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column ls-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the three supplied books: the Bootcamp Book (core rules), the Module Book (6 modules) and the Mission Book (4 missions). Tactics card effects and OCTOCUTIE's profile are printed on the components themselves. Points marked “Guide's reading” are interpretations where the books are silent.",
            "Este guia cobre os três livros fornecidos: o Bootcamp Book (regras básicas), o Module Book (6 módulos) e o Mission Book (4 missões). Os efeitos das cartas de Tática e o perfil de OCTOCUTIE estão impressos nos próprios componentes. Trechos marcados como “Leitura do guia” são interpretações onde os livros são omissos."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${aimSection()}</section>
          <section class="rule-section">${roundSection()}</section>
          <section class="rule-section">${turnSection()}</section>
          <section class="rule-section">${attackSection()}</section>
          <section class="rule-section">${soldiersSection()}</section>
          ${isMission() ? `<section class="rule-section">${missionSection()}</section>` : ""}
          ${activeModules().length ? `<section class="rule-section">${modulesSection()}</section>` : ""}
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${faqSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal, non-commercial companion guide based on the Little Soldiers Bootcamp, Module and Mission books (IELLO), by Adrien Fenouillet and Florent Baudry, illustrated by Paul Mafayon. Rules are paraphrased; pictures are cut from the supplied books for reference.",
        "Guia pessoal e não comercial de consulta baseado nos livros Bootcamp, Module e Mission de Little Soldiers (IELLO), de Adrien Fenouillet e Florent Baudry, ilustrados por Paul Mafayon. As regras são parafraseadas; as imagens foram recortadas dos livros fornecidos para referência."
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
      root.querySelector(".ls-page")?.prepend(notice);
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

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !root || !root.contains(target)) {
      return;
    }
    if (target.hasAttribute("data-mode")) {
      const mode = target.getAttribute("data-mode");
      if (MODES.includes(mode) && mode !== state.mode) {
        applyMatchChange({ mode });
      }
      return;
    }
    if (target.hasAttribute("data-players")) {
      applyMatchChange({ players: Number(target.getAttribute("data-players")) });
      return;
    }
    if (target.hasAttribute("data-reinforcements")) {
      applyMatchChange({ reinforcements: Number(target.getAttribute("data-reinforcements")) });
      return;
    }
    const flags = { super: "superSoldier", levels: "levels", objects: "objects", tactics: "tactics" };
    for (const [attr, key] of Object.entries(flags)) {
      if (target.hasAttribute(`data-${attr}`)) {
        applyMatchChange({ [key]: target.getAttribute(`data-${attr}`) === "yes" });
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

  window.LittleSoldiers = { renderInto, onClick, onChange };
})();
