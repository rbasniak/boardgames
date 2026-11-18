(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.marvel-dice-throne.v1";
  const SETUP_KEY = "field-manual.marvel-dice-throne.setup.v1";
  const MANUALS = { c: "marvel-dice-throne_core.pdf", m: "marvel-dice-throne_missions.pdf" };
  const ASSETS = "assets/marvel-dice-throne/";
  const ICONS = `${ASSETS}icons/`;
  const ART = `${ASSETS}art/`;
  // Sources. "c" = Marvel Dice Throne "Rules of Play" v1.0 (16 printed pages; the PDF stores the cover
  // and the back cover as single pages and pages 2–15 as two-page spreads, so printed page p is PDF page
  // floor(p / 2) + 1). "m" = Marvel Dice Throne Missions rulebook v1.0 (12 pages, printed = PDF page).
  // The core booklet prints full rules for 1v1 (2 players), King of the Hill (3) and 2v2 (4); for 5–6
  // players and other variants it only points to variants.dicethrone.com, so those are not offered here.
  // Hero abilities, hero cards, hero Status Effects, Mission Boards, Ally cards, Momentum Cards, Mythic
  // cards and Perk Sheets are physical components: the guide sends players there and never invents them.
  const MODES = ["duel", "koth", "teams", "missions"];
  const HEROES = [1, 2, 3, 4];
  const DIFFICULTIES = ["standard", "harder", "easier"];
  const LEVELS = [1, 2, 3, 4];
  const YES_NO = ["no", "yes"];
  const PERKS = ["first", "campaign"];
  const MISSION_HEALTH = { 1: 45, 2: 30, 3: 25, 4: 20 };
  const defaults = {
    language: "pt-BR", mode: "duel", heroes: 2, difficulty: "standard", level: 1,
    easyPoints: "no", easyHealth: "no", easyMomentum: "no", perks: "first"
  };
  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------

  function pick(list, value, fallback) {
    return list.includes(value) ? value : fallback;
  }

  function normalizePreferences(saved) {
    const heroes = Number(saved?.heroes);
    const level = Number(saved?.level);
    return {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      mode: pick(MODES, saved?.mode, defaults.mode),
      heroes: HEROES.includes(heroes) ? heroes : defaults.heroes,
      difficulty: pick(DIFFICULTIES, saved?.difficulty, defaults.difficulty),
      level: LEVELS.includes(level) ? level : defaults.level,
      easyPoints: pick(YES_NO, saved?.easyPoints, defaults.easyPoints),
      easyHealth: pick(YES_NO, saved?.easyHealth, defaults.easyHealth),
      easyMomentum: pick(YES_NO, saved?.easyMomentum, defaults.easyMomentum),
      perks: pick(PERKS, saved?.perks, defaults.perks)
    };
  }

  // Only the choices that change the physical setup are part of the signature.
  function signature(source = state) {
    if (source.mode !== "missions") {
      return source.mode;
    }
    const tweak = source.difficulty === "harder"
      ? `harder${source.level}`
      : source.difficulty === "easier" ? `easier-${source.easyHealth}-${source.easyMomentum}` : "standard";
    return `missions-h${source.heroes}-${tweak}-${source.perks}`;
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Marvel Dice Throne preferences.", error);
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
      console.error("Could not read Marvel Dice Throne setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Marvel Dice Throne preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Marvel Dice Throne setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function missions() { return state.mode === "missions"; }
  function duel() { return state.mode === "duel"; }
  function koth() { return state.mode === "koth"; }
  function teams() { return state.mode === "teams"; }
  function solo() { return missions() && state.heroes === 1; }
  function harder() { return missions() && state.difficulty === "harder"; }
  function easier() { return missions() && state.difficulty === "easier"; }
  function campaign() { return missions() && state.perks === "campaign"; }
  function extraLevel() { return harder() ? state.level : 0; }

  function playerCount() {
    return missions() ? state.heroes : { duel: 2, koth: 3, teams: 4 }[state.mode];
  }

  function startHealth() {
    if (missions()) {
      return MISSION_HEALTH[state.heroes] + (easier() && state.easyHealth === "yes" ? 10 : 0);
    }
    return koth() ? 35 : 50;
  }

  function startMomentum() {
    return easier() && state.easyMomentum === "yes" ? 5 : 0;
  }

  function blackDice(heroes = state.heroes, level = extraLevel()) {
    return 1 + heroes + level;
  }

  function clockSteps(heroes = state.heroes, level = extraLevel()) {
    return heroes + (level > 0 ? 1 : 0);
  }

  function easierIncomplete() {
    return easier() && state.easyPoints === "no" && state.easyHealth === "no" && state.easyMomentum === "no";
  }

  function manualUrl(code) {
    const book = code[0];
    const printed = Number(code.slice(1));
    const page = book === "c" ? (printed <= 1 ? 1 : Math.floor(printed / 2) + 1) : printed;
    const script = document.querySelector('script[src*="marvel-dice-throne.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${MANUALS[book]}`, baseUrl).href}#page=${page}`;
  }

  // Page codes: "c12" = core Rules of Play printed page 12; "m7" = Missions rulebook page 7.
  function referenceLink(code) {
    const printed = code.slice(1);
    const label = code[0] === "c"
      ? t(`Core p. ${printed} ↗`, `Básico p. ${printed} ↗`)
      : t(`Missions p. ${printed} ↗`, `Missões p. ${printed} ↗`);
    return `<a class="source-link" href="${manualUrl(code)}" target="_blank" rel="noreferrer">${label}</a>`;
  }

  function refs(pages) {
    return (Array.isArray(pages) ? pages : [pages]).filter(Boolean).map(referenceLink).join(" ");
  }

  function sectionHeading(id, title, pages) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${missions() ? t("MISSION BRIEFING", "INSTRUÇÕES DA MISSÃO") : t("BATTLE BRIEFING", "INSTRUÇÕES DE COMBATE")} / ${sectionIndex(id)}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="mdt-section-references">${refs(pages)}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
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

  function grid(cards, extraClass = "") {
    return `<div class="quick-grid ${extraClass}">${cards.filter(Boolean).join("")}</div>`;
  }

  function figure(file, alt, wide = false) {
    return `<figure class="mdt-art${wide ? " mdt-art-wide" : ""}"><img src="${ART}${file}.webp" alt="${alt}" loading="lazy"><figcaption>${alt}</figcaption></figure>`;
  }

  function artRow(...figures) {
    return `<div class="mdt-art-row">${figures.join("")}</div>`;
  }

  function g(file, altEn, altPt) {
    return `<img class="mdt-glyph" src="${ICONS}${file}.webp" alt="${t(altEn, altPt)}">`;
  }

  function interpretation(en, pt) {
    return `<span class="mdt-interpretation">${t("Guide's reading:", "Leitura do guia:")}</span> ${t(en, pt)}`;
  }

  function onBoard(en, pt) {
    return `<span class="mdt-tag">${t("On the component:", "No componente:")}</span> ${t(en, pt)}`;
  }

  function modeName(mode = state.mode) {
    return {
      duel: t("1v1 duel", "Duelo 1v1"),
      koth: t("King of the Hill", "Rei da Colina (King of the Hill)"),
      teams: t("2v2 team game", "Jogo em times 2v2"),
      missions: t("Missions (cooperative)", "Missões (cooperativo)")
    }[mode];
  }

  function heroesLabel(heroes = state.heroes) {
    return heroes === 1 ? t("1 Hero (solo)", "1 Herói (solo)") : t(`${heroes} Heroes`, `${heroes} Heróis`);
  }

  function difficultyName(value = state.difficulty) {
    return {
      standard: t("As printed on the Mission", "Como impressa na Missão"),
      harder: t("Increased difficulty", "Dificuldade aumentada"),
      easier: t("Decreased difficulty", "Dificuldade reduzida")
    }[value];
  }

  function perksName(value = state.perks) {
    return value === "first"
      ? t("First Mission: no Perk Sheets yet", "Primeira Missão: ainda sem Fichas de Vantagens")
      : t("Players bring their Perk Sheets", "Jogadores trazem as Fichas de Vantagens");
  }

  function matchSummary() {
    if (!missions()) {
      return `${modeName()} · ${t(`${playerCount()} players`, `${playerCount()} jogadores`)}`;
    }
    const tweak = harder()
      ? t(`difficulty +${state.level}`, `dificuldade +${state.level}`)
      : easier() ? t("decreased difficulty", "dificuldade reduzida") : t("printed difficulty", "dificuldade impressa");
    return `${modeName()} · ${heroesLabel()} · ${tweak}`;
  }

  // ---------- sections ----------

  function sectionList() {
    if (missions()) {
      return [
        ["quick-reference", t("Quick Ref", "Referência rápida")],
        ["setup", t("Setup", "Preparação")],
        ["victory", t("Winning & losing", "Vitória e derrota")],
        ["rounds", t("Round phases", "Fases da rodada")],
        ["movement", t("Movement, Melee & Range", "Movimento, Melee e Range")],
        ["turn", t("Your hero turn", "Seu turno de herói")],
        ["enemies", t("Henchmen & enemy attacks", "Capangas e ataques inimigos")],
        ["boss", t("Boss Fights", "Lutas contra o Chefe")],
        ["crisis", t("Crisis Clock", "Relógio de Crise")],
        ["momentum", t("Momentum, Boost Tiles & Allies", "Momentum, Boosts e Aliados")],
        ["board", t("Hero Board & Leaflet", "Tabuleiro e Folheto do Herói")],
        ["cards", t("Hero cards", "Cartas do herói")],
        ["status", t("Status Effects", "Efeitos de Status")],
        ["damage", t("Damage types", "Tipos de dano")],
        ["text", t("Reading abilities", "Lendo habilidades")],
        ["perks", t("Perks & difficulty", "Vantagens e dificuldade")],
        ["advanced", t("Damage math & timing", "Cálculo de dano e prioridade")],
        ["icons", t("Iconography", "Iconografia")],
        ["examples", t("Examples", "Exemplos")],
        ["faq", t("Guide's readings", "Leituras do guia")],
        ["glossary", t("Glossary", "Glossário")]
      ];
    }
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["victory", t("Winning, Health & CP", "Vitória, Vida e CP")],
      ["turn", t("Turn phases", "Fases do turno")],
      duel() ? null : ["mode", koth() ? t("King of the Hill rules", "Regras do Rei da Colina") : t("2v2 team rules", "Regras do 2v2")],
      ["board", t("Hero Board & Leaflet", "Tabuleiro e Folheto do Herói")],
      ["cards", t("Hero cards", "Cartas do herói")],
      ["status", t("Status Effects", "Efeitos de Status")],
      ["damage", t("Damage types", "Tipos de dano")],
      ["text", t("Reading abilities", "Lendo habilidades")],
      ["advanced", t("Damage math & timing", "Cálculo de dano e prioridade")],
      ["icons", t("Iconography", "Iconografia")],
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
          <span class="brand-mark" aria-hidden="true">DT</span>
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

  function choiceCard(name, value, dataAttr, checked, title, description) {
    return `
      <label class="mdt-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" ${dataAttr} ${checked ? "checked" : ""}>
        <span class="mdt-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function choiceGroup(key, attr, title, selectedName, intro, options, gridClass = "") {
    return `
      <fieldset class="mdt-choice-group">
        <legend>${title} · ${t("selected:", "selecionado:")} <span>${selectedName}</span></legend>
        <p class="mdt-choice-intro">${intro}</p>
        <div class="mdt-choice-grid ${gridClass}">
          ${options.map(([value, name, text]) => choiceCard(`mdt-${key}`, value, `data-${attr}="${value}"`, state[key] === value, name, text)).join("")}
        </div>
      </fieldset>`;
  }

  function yesNoName(value) {
    return value === "yes" ? t("Yes", "Sim") : t("No", "Não");
  }

  function heroChoiceText(heroes) {
    const black = blackDice(heroes);
    const bonus = easier() && state.easyHealth === "yes" ? 10 : 0;
    const base = MISSION_HEALTH[heroes] + bonus;
    const steps = clockSteps(heroes);
    const noteEn = extraLevel() ? ` (with the +${extraLevel()} difficulty selected below)` : "";
    const notePt = extraLevel() ? ` (com a dificuldade +${extraLevel()} selecionada abaixo)` : "";
    return t(
      `${base} Health each${bonus ? " with the +10 modification" : ""} (maximum ${base + 10}). Enemy Dice: 2 red + ${black} black. The Crisis Clock Hand advances ${steps} segment${steps > 1 ? "s" : ""} per round${noteEn}.${heroes === 1 ? " You always hold the Start Player Token." : ""}`,
      `${base} de Vida cada${bonus ? " com a modificação de +10" : ""} (máximo ${base + 10}). Dados Inimigos: 2 vermelhos + ${black} pretos. O ponteiro do Relógio de Crise avança ${steps} segmento${steps > 1 ? "s" : ""} por rodada${notePt}.${heroes === 1 ? " Você sempre fica com o marcador de Jogador Inicial." : ""}`
    );
  }

  function levelChoiceText(level) {
    return t(
      `+${level} Black Enemy ${level > 1 ? "Dice" : "Die"} (2 red + ${blackDice(state.heroes, level)} black). Each Hero takes one Oppression token showing ${level}. Henchmen start with +${level * 2} Health. The “+1” Crisis Clock Hand moves ${clockSteps(state.heroes, level)} segments per round. Perk Points count for the column of the Mission's level + ${level}.`,
      `+${level} Dado${level > 1 ? "s" : ""} Inimigo${level > 1 ? "s" : ""} preto${level > 1 ? "s" : ""} (2 vermelhos + ${blackDice(state.heroes, level)} pretos). Cada Herói recebe um marcador Oppression mostrando ${level}. Capangas começam com +${level * 2} de Vida. O ponteiro “+1” do Relógio de Crise anda ${clockSteps(state.heroes, level)} segmentos por rodada. Os Pontos de Vantagem valem para a coluna do nível da Missão + ${level}.`
    );
  }

  function missionOptions() {
    return `
      ${choiceGroup("heroes", "heroes", t("Heroes", "Heróis"), heroesLabel(),
        `${t("Setup steps 1 and 5. One hero per player; Missions is solo or cooperative for 1–4.", "Passos 1 e 5 da preparação. Um herói por jogador; Missões é solo ou cooperativo para 1–4.")} ${refs(["m4"])}`,
        HEROES.map((heroes) => [heroes, heroesLabel(heroes), heroChoiceText(heroes)]), "mdt-choice-grid-wide")}
      ${choiceGroup("perks", "perks", t("Perk Sheets", "Fichas de Vantagens (Perk Sheets)"), perksName(),
        `${t("Setup steps 1, 2 and 12. Perk Sheets record permanent rewards from earlier Missions.", "Passos 1, 2 e 12 da preparação. As Fichas de Vantagens registram recompensas permanentes de Missões anteriores.")} ${refs(["m4", "m5", "m11"])}`, [
          ["first", perksName("first"), t("Nobody has unlocked anything: everyone uses the Level 1 Momentum Card, there is no Perk setup and no Mythic card. The booklet recommends the Ock Knocks Knox Mission for a first game. After the game each player tears a Perk Sheet off the pad and writes their name on it.", "Ninguém desbloqueou nada: todos usam a carta de Momentum Nível 1, não há preparação de Vantagens nem carta Mítica. O livro recomenda a Missão Ock Knocks Knox para a primeira partida. Depois do jogo, cada jogador destaca uma Ficha de Vantagens do bloco e escreve o nome nela.")],
          ["campaign", perksName("campaign"), t("Each player uses the Momentum Card level unlocked on their own sheet, applies their unlocked setup Perks in step 12 and tucks the sheet under the Hero Board with the Feats row showing. A player with all 5 New Game+ circles filled (or a “+” beside their name) may start with one Mythic card.", "Cada jogador usa o nível da carta de Momentum desbloqueado na própria ficha, aplica no passo 12 as Vantagens de preparação desbloqueadas e encaixa a ficha sob o Tabuleiro do Herói com a linha Feats (Proezas) à mostra. Quem tem os 5 círculos New Game+ preenchidos (ou um “+” ao lado do nome) pode começar com uma carta Mítica.")]
        ])}
      ${choiceGroup("difficulty", "difficulty", t("Difficulty", "Dificuldade"), difficultyName(),
        `${t("Optional rules on the back of the Missions rulebook. Each Mission prints its own difficulty die (level 1–5) in the top-left corner of the board; this choice is a change on top of that.", "Regras opcionais do verso do livro de Missões. Cada Missão traz o próprio dado de dificuldade (nível 1–5) no canto superior esquerdo do tabuleiro; esta escolha é uma mudança por cima disso.")} ${refs(["m4", "m12"])}`, [
          ["standard", difficultyName("standard"), t("No change: play the Mission exactly as printed. Do not use the “+1” side of the Crisis Clock Hand.", "Sem mudança: jogue a Missão exatamente como impressa. Não use o lado “+1” do ponteiro do Relógio de Crise.")],
          ["harder", difficultyName("harder"), t("For a low-level Mission that has become too easy. Adds Black Enemy Dice, Oppression on every Hero, tougher Henchmen and the “+1” Crisis Clock Hand, and lets you spend the Perk Points in a higher column. Choose how many levels below.", "Para uma Missão de nível baixo que ficou fácil demais. Adiciona Dados Inimigos pretos, Oppression em cada Herói, Capangas mais resistentes e o ponteiro “+1” do Relógio de Crise, e permite gastar os Pontos de Vantagem numa coluna mais alta. Escolha abaixo quantos níveis.")],
          ["easier", difficultyName("easier"), t("For a more approachable game. Turn on one or more of three modifications below: double Perk Points, +10 starting Health, +5 starting Momentum.", "Para uma partida mais acessível. Ligue abaixo uma ou mais de três modificações: Pontos de Vantagem em dobro, +10 de Vida inicial, +5 de Momentum inicial.")]
        ], "mdt-choice-grid-wide")}
      ${harder() ? choiceGroup("level", "level", t("Levels of increased difficulty", "Níveis de dificuldade aumentada"), `+${state.level}`,
        `${t("Every level applies all five extra setup steps. The booklet caps Oppression at 4 and the Henchman Health bonus at +8, so this guide offers up to +4.", "Cada nível aplica os cinco passos extras de preparação. O livro limita Oppression a 4 e o bônus de Vida dos Capangas a +8, por isso este guia oferece até +4.")} ${refs(["m12"])}`,
        LEVELS.map((level) => [level, t(`+${level} level${level > 1 ? "s" : ""}`, `+${level} nível${level > 1 ? "is" : ""}`), levelChoiceText(level)])) : ""}
      ${easier() ? `
        ${choiceGroup("easyPoints", "easypoints", t("Easier · Double Perk Points", "Mais fácil · Pontos de Vantagem em dobro"), yesNoName(state.easyPoints),
          `${t("Modification 1. Does not change the setup; it changes what you record after the Mission.", "Modificação 1. Não muda a preparação; muda o que você anota depois da Missão.")} ${refs(["m12"])}`, [
            ["no", t("No", "Não"), t("Earn the normal 0–3 Perk Points.", "Ganhe os 0–3 Pontos de Vantagem normais.")],
            ["yes", t("Yes", "Sim"), t("Double all Perk Points earned from this Mission (0, 2, 4 or 6).", "Dobre todos os Pontos de Vantagem ganhos nesta Missão (0, 2, 4 ou 6).")]
          ])}
        ${choiceGroup("easyHealth", "easyhealth", t("Easier · Extra Health", "Mais fácil · Vida extra"), yesNoName(state.easyHealth),
          `${t("Modification 2. Changes setup step 1.", "Modificação 2. Muda o passo 1 da preparação.")} ${refs(["m12"])}`, [
            ["no", t("No", "Não"), t(`Heroes start at ${MISSION_HEALTH[state.heroes]} Health.`, `Os Heróis começam com ${MISSION_HEALTH[state.heroes]} de Vida.`)],
            ["yes", t("Yes", "Sim"), t(`All Heroes start with an additional 10 Health: ${MISSION_HEALTH[state.heroes] + 10} each.`, `Todos os Heróis começam com 10 de Vida a mais: ${MISSION_HEALTH[state.heroes] + 10} cada.`)]
          ])}
        ${choiceGroup("easyMomentum", "easymomentum", t("Easier · Bonus Momentum", "Mais fácil · Momentum bônus"), yesNoName(state.easyMomentum),
          `${t("Modification 3. Changes setup step 2.", "Modificação 3. Muda o passo 2 da preparação.")} ${refs(["m12"])}`, [
            ["no", t("No", "Não"), t("Momentum Dials start at 0.", "Os mostradores de Momentum começam em 0.")],
            ["yes", t("Yes", "Sim"), t("All Heroes start with 5 bonus Momentum: set each Momentum Dial to 5.", "Todos os Heróis começam com 5 de Momentum bônus: ajuste cada mostrador de Momentum em 5.")]
          ])}
        ${easierIncomplete() ? `<p class="mdt-warning" role="alert"><strong>${t("Incomplete configuration.", "Configuração incompleta.")}</strong> ${t("Decreased difficulty needs at least one of the three modifications set to Yes. Until then the setup below is the same as the printed difficulty.", "A dificuldade reduzida precisa de pelo menos uma das três modificações em Sim. Até lá, a preparação abaixo é igual à da dificuldade impressa.")}</p>` : ""}` : ""}`;
  }

  function matchConfiguration() {
    return `
      <section class="controls-panel mdt-config" id="build-match" aria-labelledby="mdt-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="mdt-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "Two booklets are covered: the core Rules of Play (head-to-head modes) and the Missions rulebook (solo / cooperative, needs the Missions box). Choose the mode first; it filters the setup, the rules, the icons and the examples below. Which hero each person plays is decided at the table and is not asked here: hero abilities, cards and tokens are read on the Hero Board, the Hero Leaflet and the cards. Changing the mode or any option that alters the physical setup clears the setup checklist; the language does not.",
              "Dois livros são cobertos: o Rules of Play básico (modos de confronto) e o livro de Missões (solo / cooperativo, exige a caixa Missions). Escolha primeiro o modo; ele filtra a preparação, as regras, os ícones e os exemplos abaixo. O herói de cada pessoa é decidido na mesa e não é perguntado aqui: habilidades, cartas e marcadores do herói são lidos no Tabuleiro do Herói, no Folheto do Herói e nas cartas. Mudar o modo ou qualquer opção que altere a preparação física limpa a lista da preparação; o idioma não."
            )}</p>
          </div>
        </div>
        ${choiceGroup("mode", "mode", t("Mode", "Modo"), modeName(),
          `${t("The core booklet ties each head-to-head mode to a player count.", "O livro básico liga cada modo de confronto a um número de jogadores.")} ${refs(["c3", "c11", "m4"])}`, [
            ["duel", `${modeName("duel")} · ${t("2 players", "2 jogadores")}`, t("The standard game and the one to learn first. Each player starts at 50 Health. With a single opponent the Targeting Roll Phase is skipped. Reduce your opponent to 0 Health.", "O jogo padrão e o primeiro a aprender. Cada jogador começa com 50 de Vida. Com um único oponente, a Fase de Rolagem de Alvo é pulada. Reduza o oponente a 0 de Vida.")],
            ["koth", `${modeName("koth")} · ${t("3 players", "3 jogadores")}`, t("Everyone for themselves. Each player starts at 35 Health and turns go clockwise. You choose whom to Attack, and you draw 1 bonus card whenever you target a Leader (a player with the most Health).", "Cada um por si. Cada jogador começa com 35 de Vida e os turnos seguem em sentido horário. Você escolhe quem Atacar e compra 1 carta bônus sempre que mira um Líder (um jogador com mais Vida).")],
            ["teams", `${modeName("teams")} · ${t("4 players", "4 jogadores")}`, t("Two teams of two. Teammates sit side by side, share one Health Dial starting at 50 and may see each other's hands; CP stays individual. Turns zigzag between the teams and a Targeting roll decides which opponent defends.", "Dois times de dois. Parceiros sentam lado a lado, dividem um mostrador de Vida começando em 50 e podem ver a mão um do outro; os CP continuam individuais. Os turnos alternam em zigue-zague entre os times e uma rolagem de Alvo decide qual oponente se defende.")],
            ["missions", `${modeName("missions")} · ${t("1–4 Heroes", "1–4 Heróis")}`, t("Needs the Marvel Dice Throne Missions box plus one Dice Throne hero per player. Heroes move on a Mission Board, fight Henchmen and then a Boss, recruit Allies, and lose together if any Hero is defeated. The booklet asks that everyone has played at least one standard game first (3 recommended).", "Exige a caixa Marvel Dice Throne Missions e um herói de Dice Throne por jogador. Os Heróis se movem num Tabuleiro de Missão, enfrentam Capangas e depois um Chefe, recrutam Aliados e perdem juntos se qualquer Herói for derrotado. O livro pede que todos tenham jogado ao menos uma partida padrão antes (3 recomendadas).")]
          ])}
        <p class="mdt-choice-intro">${t(
          "5–6 players and other variants (for example 3v3 or larger free-for-alls): the core booklet only says that Dice Throne can be played with up to 6 and sends you to variants.dicethrone.com for those rules. They are not printed in the supplied booklets, so this guide does not offer them.",
          "5–6 jogadores e outras variantes (por exemplo 3v3 ou todos contra todos maiores): o livro básico só diz que Dice Throne pode ser jogado com até 6 e manda consultar variants.dicethrone.com para essas regras. Elas não estão impressas nos livros fornecidos, então este guia não as oferece."
        )} ${refs(["c11"])}</p>
        ${missions() ? missionOptions() : ""}
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function heroKitItems() {
    return [
      t("Each player chooses one hero and takes all of that hero's components. The list is printed on the back of the Hero Leaflet (“Components”): Hero Board, Hero Leaflet, 5 dice, Health Dial, Combat Point (CP) Dial, the hero's deck of Hero Cards, a Turn Order Card and the hero's Status Effect / Companion tokens.", "Cada jogador escolhe um herói e pega todos os componentes dele. A lista está impressa no verso do Folheto do Herói (“Components”): Tabuleiro do Herói, Folheto do Herói, 5 dados, mostrador de Vida, mostrador de Pontos de Combate (CP), o baralho de Cartas do Herói, uma carta de Ordem do Turno e os marcadores de Efeito de Status / Companheiro do herói."),
      t("Place the Hero Board in front of you and the Hero Leaflet beside it, front side up (the side with the Status Effect rules and the dice key).", "Coloque o Tabuleiro do Herói à sua frente e o Folheto do Herói ao lado, com a frente para cima (o lado com as regras dos Efeitos de Status e a legenda dos dados)."),
      t("Stack your Status Effect and Companion tokens on the Hero Leaflet, each on its own pictured place.", "Empilhe os seus marcadores de Efeito de Status e de Companheiro no Folheto do Herói, cada um no lugar ilustrado.")
    ];
  }

  function competitiveSetup() {
    const health = startHealth();
    return [
      {
        id: "seats",
        title: teams() ? t("Form teams and choose heroes", "Formem os times e escolham os heróis") : t("Choose heroes", "Escolham os heróis"),
        pages: teams() ? ["c3", "c11"] : koth() ? ["c3", "c11"] : ["c3"],
        items: [
          teams() ? t("Form two teams of two. Teammates sit next to each other, facing the other team; teammates may look at each other's hands and plan together.", "Formem dois times de dois. Os parceiros sentam lado a lado, de frente para o outro time; parceiros podem olhar a mão um do outro e planejar juntos.") : "",
          koth() ? t("Sit around the table: turns will go clockwise.", "Sentem-se em volta da mesa: os turnos seguirão em sentido horário.") : "",
          duel() ? t("Sit facing your opponent.", "Sente-se de frente para o oponente.") : "",
          ...heroKitItems()
        ],
        art: ["setup", t("Core p. 2–3: one hero's play area — Hero Board (1), Hero Leaflet (2), tokens (3), Health Dial (4), CP Dial (5), deck (6), dice (7) and the face-up Discard Pile", "Básico p. 2–3: a área de um herói — Tabuleiro do Herói (1), Folheto do Herói (2), marcadores (3), mostrador de Vida (4), mostrador de CP (5), baralho (6), dados (7) e a pilha de Descarte virada para cima")]
      },
      {
        id: "dials",
        title: teams() ? t(`Dials: one shared Health Dial at ${health} per team, CP at 2`, `Mostradores: uma Vida compartilhada em ${health} por time, CP em 2`) : t(`Dials: Health ${health}, CP 2`, `Mostradores: Vida ${health}, CP 2`),
        pages: teams() || koth() ? ["c3", "c11"] : ["c3"],
        items: [
          teams()
            ? t(`Each team uses ONE Health Dial, set to ${health}. Both teammates share it for the whole game.`, `Cada time usa UM mostrador de Vida, ajustado em ${health}. Os dois parceiros o dividem pela partida inteira.`)
            : t(`Each player sets their own Health Dial to ${health}.`, `Cada jogador ajusta o próprio mostrador de Vida em ${health}.`),
          teams() ? interpretation("the booklet does not say whose dial to use; keep one teammate's Health Dial on the table between the two of you and leave the other in the box.", "o livro não diz de quem é o mostrador usado; deixem o mostrador de Vida de um dos parceiros na mesa entre os dois e o outro na caixa.") : "",
          t("Each player sets their own CP Dial to 2.", "Cada jogador ajusta o próprio mostrador de CP em 2."),
          teams() ? t("CP is never shared: you may only spend your own CP on your own cards and abilities.", "CP nunca é compartilhado: você só gasta os seus CP nas suas cartas e habilidades.") : ""
        ]
      },
      {
        id: "deck",
        title: t("Shuffle your deck and draw 4 cards", "Embaralhe o seu baralho e compre 4 cartas"),
        pages: ["c3"],
        items: [
          t("Shuffle your hero's cards into a face-down deck.", "Embaralhe as cartas do seu herói num baralho virado para baixo."),
          t("Draw the top 4 cards: this is your starting hand.", "Compre as 4 cartas do topo: esta é a sua mão inicial."),
          t("Leave room next to the deck for your Discard Pile (face up).", "Deixe espaço ao lado do baralho para a sua pilha de Descarte (virada para cima)."),
          teams() ? t("Hands are hidden from the other team; your teammate may see yours.", "As mãos ficam escondidas do outro time; o seu parceiro pode ver a sua.") : interpretation("the booklet does not say it, but hands are kept hidden from opponents (it singles out 2v2 teammates as allowed to view each other's hands).", "o livro não diz, mas as mãos ficam escondidas dos oponentes (ele destaca que parceiros no 2v2 podem ver a mão um do outro).")
        ]
      },
      {
        id: "start",
        title: t("Roll for the Start Player", "Role para definir o Jogador Inicial"),
        pages: teams() || koth() ? ["c3", "c11"] : ["c3"],
        items: [
          t("Every player rolls 1 die. The highest number is the Start Player and takes the first turn.", "Cada jogador rola 1 dado. O maior número é o Jogador Inicial e faz o primeiro turno."),
          interpretation("tied for highest? Those players roll again.", "empate no maior valor? Esses jogadores rolam de novo."),
          t("Remember: the Start Player skips the Income Phase of their first turn (no CP, no card).", "Lembre: o Jogador Inicial pula a Fase de Renda do primeiro turno (sem CP, sem carta)."),
          koth() ? t("Turn order: clockwise from the Start Player.", "Ordem dos turnos: sentido horário a partir do Jogador Inicial.") : "",
          teams() ? t("Turn order zigzags between the teams (diagram): 1 Start Player → 2 an opponent → 3 the Start Player's teammate → 4 the other opponent, then back to 1.", "A ordem dos turnos faz zigue-zague entre os times (diagrama): 1 Jogador Inicial → 2 um oponente → 3 o parceiro do Jogador Inicial → 4 o outro oponente, e volta ao 1.") : "",
          teams() ? interpretation("in the diagram player 2 is the opponent sitting directly across from the Start Player; use that seat as the second player.", "no diagrama o jogador 2 é o oponente sentado bem em frente ao Jogador Inicial; use esse assento como segundo jogador.") : "",
          duel() ? t("Players then alternate turns.", "Depois os jogadores alternam turnos.") : ""
        ],
        art: teams() ? ["team-order", t("Core p. 11: 2v2 seating and turn order — teammates 1 and 3 side by side, facing teammates 2 and 4", "Básico p. 11: lugares e ordem dos turnos no 2v2 — parceiros 1 e 3 lado a lado, de frente para os parceiros 2 e 4")] : null
      },
      {
        id: "extra",
        title: t("Hero-specific setup", "Preparação específica do herói"),
        pages: ["c3"],
        items: [
          t("Some heroes require unique setup steps. If yours does, they are printed on your Hero Leaflet: carry them out now.", "Alguns heróis exigem passos próprios de preparação. Se for o caso do seu, eles estão impressos no Folheto do Herói: execute-os agora."),
          t("Read your Hero Leaflet (Status Effects, Companions, dice key) aloud to the table so everyone knows what your tokens do.", "Leia o seu Folheto do Herói (Efeitos de Status, Companheiros, legenda dos dados) em voz alta para todos saberem o que os seus marcadores fazem.")
        ]
      }
    ];
  }

  function missionSetup() {
    const health = startHealth();
    const black = blackDice();
    const level = extraLevel();
    const phases = [
      {
        id: "heroes",
        title: t(`Step 1 · Heroes: Health ${health}, CP 2, 4 cards`, `Passo 1 · Heróis: Vida ${health}, CP 2, 4 cartas`),
        pages: ["m4", "c3"],
        items: [
          ...heroKitItems(),
          t(`Set each Hero's Health Dial to ${health} (${heroesLabel()}). A Hero's maximum Health is 10 more than the starting Health: ${health + 10}.`, `Ajuste o mostrador de Vida de cada Herói em ${health} (${heroesLabel()}). A Vida máxima de um Herói é 10 a mais que a inicial: ${health + 10}.`),
          campaign() ? interpretation("if a Perk raises a player's starting Health in step 12, that player's maximum is 10 above their own raised value.", "se uma Vantagem aumenta a Vida inicial de um jogador no passo 12, o máximo desse jogador é 10 acima do próprio valor aumentado.") : "",
          easier() && state.easyHealth === "yes" ? t(`That is the table value ${MISSION_HEALTH[state.heroes]} plus the 10 additional Health of the decreased difficulty.`, `Esse é o valor da tabela, ${MISSION_HEALTH[state.heroes]}, mais os 10 de Vida adicionais da dificuldade reduzida.`) : "",
          t("Set each CP Dial to 2, shuffle each hero deck and draw 4 cards.", "Ajuste cada mostrador de CP em 2, embaralhe o baralho de cada herói e compre 4 cartas."),
          t("Carry out any unique setup steps printed on your Hero Leaflet.", "Execute os passos próprios de preparação impressos no seu Folheto do Herói, se houver."),
          campaign()
            ? t("Mythic cards: only a player whose Perk Sheet has all 5 New Game+ circles filled, or a “+” beside their name, may start with one of the 4 Mythic Ability cards. Everyone else may NOT start with a Mythic Ability.", "Cartas Míticas: só um jogador cuja Ficha de Vantagens tem os 5 círculos New Game+ preenchidos, ou um “+” ao lado do nome, pode começar com uma das 4 cartas de Habilidade Mítica. Os demais NÃO podem começar com uma Habilidade Mítica.")
            : t("You may NOT start with a Mythic Ability: leave the 4 Mythic Cards in the box.", "Vocês NÃO podem começar com uma Habilidade Mítica: deixem as 4 cartas Míticas na caixa.")
        ]
      },
      {
        id: "momentum",
        title: t(`Step 2 · Momentum Dial at ${startMomentum()}, Player Aid, Momentum Card`, `Passo 2 · Momentum em ${startMomentum()}, carta de Ajuda, carta de Momentum`),
        pages: easier() && state.easyMomentum === "yes" ? ["m4", "m12"] : ["m4"],
        items: [
          t(`Give each Hero a Momentum Dial set to ${startMomentum()}${startMomentum() ? " (5 bonus Momentum from the decreased difficulty)" : ""}.`, `Dê a cada Herói um mostrador de Momentum ajustado em ${startMomentum()}${startMomentum() ? " (5 de Momentum bônus da dificuldade reduzida)" : ""}.`),
          t("Give each Hero a Player Aid Card (it lists the 8 round phases).", "Dê a cada Herói uma carta de Ajuda (Player Aid; ela lista as 8 fases da rodada)."),
          campaign()
            ? t("Give each Hero the Momentum Card of the level unlocked on that player's Perk Sheet (Level 1 until a higher Momentum Perk is unlocked). Unused Momentum Level Cards go back in the box.", "Dê a cada Herói a carta de Momentum do nível desbloqueado na Ficha de Vantagens daquele jogador (Nível 1 até desbloquear uma Vantagem de Momentum maior). As cartas de Momentum não usadas voltam à caixa.")
            : t("Give each Hero a Level 1 Momentum Card. The Level 2–5 cards stay in the box.", "Dê a cada Herói uma carta de Momentum Nível 1. As cartas de Nível 2–5 ficam na caixa.")
        ]
      },
      {
        id: "mission",
        title: t("Step 3 · Choose a Mission, Side 1 up", "Passo 3 · Escolham uma Missão, Lado 1 para cima"),
        pages: ["m4"],
        items: [
          t("Choose one of the 20 double-sided Mission Boards and place it with the side marked “Side 1” face up.", "Escolham um dos 20 Tabuleiros de Missão dupla face e coloquem-no com o lado marcado “Side 1” para cima."),
          t("The coloured die in the top-left corner is the Mission's difficulty level: 1 Intro, 2 Moderate, 3 Hard, 4 Brutal, 5 Ruthless.", "O dado colorido no canto superior esquerdo é o nível de dificuldade da Missão: 1 Intro, 2 Moderate (Moderada), 3 Hard (Difícil), 4 Brutal, 5 Ruthless (Implacável)."),
          campaign() ? "" : t("For your first game the booklet says to use the Ock Knocks Knox Mission.", "Para a primeira partida o livro manda usar a Missão Ock Knocks Knox."),
          t("Place the token tray (Health tokens, Plot tokens, status tokens) within reach of all players.", "Coloquem a bandeja de marcadores (Vida, Enredo, status) ao alcance de todos.")
        ]
      },
      {
        id: "allies",
        title: t("Step 4 · Ally Headquarters", "Passo 4 · Quartel-General dos Aliados"),
        pages: ["m4"],
        items: [
          t("Shuffle the 25 Ally Cards into a face-down deck.", "Embaralhem as 25 cartas de Aliado num baralho virado para baixo."),
          t("Draw the top 3 and place them face up in a row: this is the Ally HQ.", "Comprem as 3 do topo e coloquem-nas viradas para cima em fila: este é o QG dos Aliados (Ally HQ).")
        ]
      },
      {
        id: "dice",
        title: t(`Step 5 · Enemy Dice pool: 2 red + ${black} black`, `Passo 5 · Dados Inimigos: 2 vermelhos + ${black} pretos`),
        pages: level ? ["m4", "m12"] : ["m4"],
        items: [
          t(`Gather the 2 Red Enemy Dice and 1 Black Enemy Die, plus 1 more Black Enemy Die per Hero (${state.heroes}).`, `Separem os 2 Dados Inimigos vermelhos e 1 Dado Inimigo preto, mais 1 Dado Inimigo preto por Herói (${state.heroes}).`),
          level ? t(`Increased difficulty: add ${level} more Black Enemy ${level > 1 ? "Dice" : "Die"}.`, `Dificuldade aumentada: adicionem mais ${level} Dado${level > 1 ? "s" : ""} Inimigo${level > 1 ? "s" : ""} preto${level > 1 ? "s" : ""}.`) : "",
          t(`Total: 2 red + ${black} black. The other ${9 - black} black dice stay in the box. This same pool is rolled once in every Enemy Roll Phase, on both sides of the Mission.`, `Total: 2 vermelhos + ${black} pretos. Os outros ${9 - black} dados pretos ficam na caixa. Este mesmo conjunto é rolado uma vez em cada Fase de Rolagem Inimiga, nos dois lados da Missão.`)
        ],
        art: ["dice-pool", t("Missions p. 4: the Enemy Dice pool — 2 red and 2 black for 1 Hero, plus one black die for each further Hero", "Missões p. 4: o conjunto de Dados Inimigos — 2 vermelhos e 2 pretos para 1 Herói, mais um dado preto para cada Herói adicional")]
      },
      {
        id: "start",
        title: t("Steps 6–7 · Start Player and pawns", "Passos 6–7 · Jogador Inicial e peões"),
        pages: ["m5"],
        items: [
          solo()
            ? t("Solo: take the Start Player Token.", "Solo: pegue o marcador de Jogador Inicial (Start Player Token).")
            : t("Each player rolls a die; the highest roll takes the Start Player Token.", "Cada jogador rola um dado; o maior resultado fica com o marcador de Jogador Inicial (Start Player Token)."),
          solo() ? "" : interpretation("tied for highest? Those players roll again.", "empate no maior valor? Esses jogadores rolam de novo."),
          t("Each player puts their Hero Pawn in a Hero Pawn Base and places it NEAR the map, not on it: pawns enter during the first Movement Phase.", "Cada jogador encaixa o seu Peão de Herói numa Base e o coloca PERTO do mapa, não em cima: os peões entram na primeira Fase de Movimento.")
        ]
      },
      {
        id: "clock",
        title: t("Step 8 · Crisis Clock", "Passo 8 · Relógio de Crise"),
        pages: level ? ["m5", "m12"] : ["m5"],
        items: [
          t("Attach the Crisis Clock Hand to the Crisis Clock printed on the board (with the Crisis Clock Back), pointing straight up.", "Prendam o ponteiro (Crisis Clock Hand) ao Relógio de Crise impresso no tabuleiro (com a peça Crisis Clock Back), apontando reto para cima."),
          level
            ? t("Increased difficulty: use the side of the hand marked “+1”.", "Dificuldade aumentada: usem o lado do ponteiro marcado “+1”.")
            : t("Do NOT use the “+1” side of the hand: it is only for increased difficulty.", "NÃO usem o lado “+1” do ponteiro: ele é só para a dificuldade aumentada."),
          t("Roll 1 die (any six-sided die, such as a hero die — read its number) and advance the hand clockwise that many segments. This only randomises the starting position: nothing activates.", "Rolem 1 dado (qualquer dado de seis faces, como um dado de herói — leiam o número) e avancem o ponteiro em sentido horário esse número de segmentos. Isso só sorteia a posição inicial: nada é ativado.")
        ]
      },
      {
        id: "enemies",
        title: t("Step 9 · Henchmen tokens or Boss Setup", "Passo 9 · Marcadores dos Capangas ou Preparação do Chefe"),
        pages: level ? ["m5", "m9", "m12"] : ["m5", "m9"],
        items: [
          rl("If this side is a Mission Run", "place Health tokens and Shield tokens on every Henchman drawn on the map, matching the amounts on that Henchman type's info panel along the map's bottom edge.", "Se este lado é uma Incursão (Mission Run)", "coloquem marcadores de Vida e de Shield (Escudo) em cada Capanga desenhado no mapa, conforme as quantidades do painel daquele tipo de Capanga na borda inferior do mapa."),
          level ? t(`Increased difficulty: every Henchman starts with ${level * 2} more Health than printed.`, `Dificuldade aumentada: cada Capanga começa com ${level * 2} de Vida a mais que o impresso.`) : "",
          t("Health Tokens are double-sided: a low odd number on one side and the next even number on the other (1/2, 3/4, … 9/10). Combine tokens to show the total.", "Os marcadores de Vida são dupla face: um número ímpar baixo de um lado e o par seguinte do outro (1/2, 3/4, … 9/10). Combinem marcadores para mostrar o total."),
          t("Unstoppable Threats get no tokens: they cannot be damaged.", "Ameaças Imparáveis não recebem marcadores: não podem sofrer dano."),
          rl("If this side is a Boss Fight", "perform the map's Boss Setup steps, if any, and set the Boss Health Dial. The rulebook does not print the Boss's starting Health: read it on the Mission Board.", "Se este lado é uma Luta contra o Chefe (Boss Fight)", "executem os passos de Boss Setup do mapa, se houver, e ajustem o mostrador Boss Health. O livro não traz a Vida inicial do Chefe: leiam no Tabuleiro de Missão."),
          level ? t("Increased difficulty: Boss Setup instructions apply a special effect for each Oppression on the Heroes — read it on the board.", "Dificuldade aumentada: as instruções de Boss Setup aplicam um efeito especial para cada Oppression nos Heróis — leia no tabuleiro.") : ""
        ]
      },
      {
        id: "boosts",
        title: t("Step 10 · Boost Tiles", "Passo 10 · Fichas de Boost"),
        pages: ["m5", "m8"],
        items: [
          t("Shuffle all 30 Boost Tiles face down and stack them beside the board; leave room for a discard stack.", "Embaralhem as 30 Fichas de Boost viradas para baixo e empilhem-nas ao lado do tabuleiro; deixem espaço para uma pilha de descarte."),
          t("Draw tiles and place one at random on each space of the map that shows the Boost symbol.", "Comprem fichas e coloquem uma ao acaso em cada espaço do mapa que mostra o símbolo de Boost."),
          t("Then flip all placed Boost Tiles face up.", "Depois virem para cima todas as Fichas de Boost colocadas.")
        ]
      },
      {
        id: "additional",
        title: t("Step 11 · The Mission's “Additional Setup”", "Passo 11 · “Additional Setup” da Missão"),
        pages: ["m5"],
        items: [
          t("If the board has an “Additional Setup” section, carry it out now. It may ask for specific tokens or markers (Plot Tokens, Mystery Tiles, Clear Tiles…).", "Se o tabuleiro tem uma seção “Additional Setup”, executem-na agora. Ela pode pedir marcadores específicos (Plot Tokens, Mystery Tiles, Clear Tiles…)."),
          t("Ock Knocks Knox has no additional setup.", "Ock Knocks Knox não tem preparação adicional.")
        ]
      }
    ];
    if (level) {
      phases.push({
        id: "oppression",
        title: t(`Increased difficulty · Oppression ${level} on every Hero`, `Dificuldade aumentada · Oppression ${level} em cada Herói`),
        pages: ["m12"],
        items: [
          t(`Give each Hero ONE Oppression token turned to the value ${level}: a single token shows how many Oppression that Hero has.`, `Dê a cada Herói UM marcador Oppression virado no valor ${level}: um único marcador mostra quantas Oppression o Herói tem.`),
          t(`While it is there, every Attack against that Hero deals ${level} more damage. It can never be removed or transferred.`, `Enquanto estiver lá, todo Ataque contra esse Herói causa ${level} de dano a mais. Ele nunca pode ser removido nem transferido.`),
          t("Check the other four extra steps are done: extra black dice (step 5), “+1” clock hand (step 8), Henchman Health (step 9), Boss Setup effect (step 9).", "Confiram os outros quatro passos extras: dados pretos extras (passo 5), ponteiro “+1” (passo 8), Vida dos Capangas (passo 9), efeito do Boss Setup (passo 9).")
        ]
      });
    }
    phases.push({
      id: "perks",
      title: campaign() ? t("Step 12 · Apply your Perks", "Passo 12 · Apliquem as Vantagens") : t("Step 12 · No Perks yet", "Passo 12 · Ainda sem Vantagens"),
      pages: ["m5", "m11"],
      items: campaign()
        ? [
          t("Each player performs the additional setup items unlocked on their own Perk Sheet (for example extra starting Health, CP, cards, Momentum or status tokens — read them on the sheet).", "Cada jogador executa os itens extras de preparação desbloqueados na própria Ficha de Vantagens (por exemplo Vida, CP, cartas, Momentum ou marcadores de status iniciais extras — leia na ficha)."),
          t("Feats row: place a Plot Token on each Feat you have unlocked; you remove the token to use that Feat once.", "Linha Feats (Proezas): coloque um Plot Token em cada Proeza desbloqueada; você remove o marcador para usar a Proeza uma vez."),
          t("Tuck the Perk Sheet beneath your Hero Board, leaving the bottom “Feats” row exposed.", "Encaixe a Ficha de Vantagens sob o seu Tabuleiro do Herói, deixando a linha “Feats” de baixo à mostra.")
        ]
        : [
          t("Nobody has a Perk Sheet yet, so there is nothing to apply. Keep the Perk Pad nearby: after the Mission each player tears off a sheet.", "Ninguém tem Ficha de Vantagens ainda, então não há nada a aplicar. Deixem o bloco de Vantagens por perto: depois da Missão cada jogador destaca uma ficha."),
          t("You are ready: the first round skips the Pass Phase and begins with the Movement Phase.", "Tudo pronto: a primeira rodada pula a Fase de Passagem e começa pela Fase de Movimento.")
        ]
    });
    return phases;
  }

  function setupPhases() {
    return missions() ? missionSetup() : competitiveSetup();
  }

  function inventory() {
    const health = startHealth();
    const heroCard = infoCard(t("PER PLAYER", "POR JOGADOR"), t("One hero kit", "Um kit de herói"), [
      rl("Hero Board", "your abilities.", "Tabuleiro do Herói", "as suas habilidades."),
      rl("Hero Leaflet", "Status Effects, Companions, dice key, clarifications.", "Folheto do Herói", "Efeitos de Status, Companheiros, legenda dos dados, esclarecimentos."),
      rl("5 dice", "your hero's own dice.", "5 dados", "os dados do seu herói."),
      rl("Deck", "your hero's cards (the leaflet lists the count; 32 on the leaflet shown in the rulebook); 4 in hand.", "Baralho", "as cartas do seu herói (o folheto lista a quantidade; 32 no folheto mostrado no livro); 4 na mão."),
      rl("CP Dial", "set to 2.", "Mostrador de CP", "em 2."),
      teams() ? rl("Health Dial", `one per team, set to ${health}.`, "Mostrador de Vida", `um por time, em ${health}.`) : rl("Health Dial", `set to ${health}.`, "Mostrador de Vida", `em ${health}.`),
      rl("Tokens", "Status Effect / Companion tokens on the leaflet.", "Marcadores", "de Efeito de Status / Companheiro no folheto."),
      rl("Turn Order Card, Bonus Hero Token", "listed as components; the booklet gives them no rule (keep the card as a phase reminder).", "Carta de Ordem do Turno, Bonus Hero Token", "listados como componentes; o livro não dá regra para eles (use a carta como lembrete das fases).")
    ], ["c3", "c6"]);
    if (!missions()) {
      return grid([
        heroCard,
        infoCard(t("TABLE", "MESA"), t(`${playerCount()} players`, `${playerCount()} jogadores`), [
          t(`${playerCount()} hero kits, one per player.`, `${playerCount()} kits de herói, um por jogador.`),
          teams() ? t("2 Health Dials in use (one per team); the other 2 stay in the box.", "2 mostradores de Vida em uso (um por time); os outros 2 ficam na caixa.") : "",
          t("A face-up Discard Pile beside each deck.", "Uma pilha de Descarte virada para cima ao lado de cada baralho."),
          t("Spare tokens: if you need more of a Status Effect than provided, use any substitute.", "Marcadores extras: se precisar de mais de um Efeito de Status do que há, use qualquer substituto.")
        ], ["c3", "c6"])
      ]);
    }
    return grid([
      heroCard,
      infoCard(t("PER HERO · MISSIONS", "POR HERÓI · MISSÕES"), heroesLabel(), [
        rl("Momentum Dial", `1 of the 4 dials, set to ${startMomentum()}.`, "Mostrador de Momentum", `1 dos 4 mostradores, em ${startMomentum()}.`),
        rl("Momentum Card", campaign() ? "the level unlocked on your Perk Sheet (12 cards, levels 1–5)." : "Level 1 (12 cards, levels 1–5, in the box).", "Carta de Momentum", campaign() ? "o nível desbloqueado na sua Ficha de Vantagens (12 cartas, níveis 1–5)." : "Nível 1 (12 cartas, níveis 1–5, na caixa)."),
        rl("Player Aid Card", "1 of 4.", "Carta de Ajuda", "1 de 4."),
        rl("Hero Pawn + Base", "1 of 4, near the map.", "Peão de Herói + Base", "1 de 4, perto do mapa."),
        campaign() ? rl("Perk Sheet", "your own, tucked under the Hero Board.", "Ficha de Vantagens", "a sua, sob o Tabuleiro do Herói.") : ""
      ], ["m3", "m4"]),
      infoCard(t("MISSION", "MISSÃO"), t("Board and enemies", "Tabuleiro e inimigos"), [
        rl("Mission Board", "1 of 20, Side 1 up.", "Tabuleiro de Missão", "1 de 20, Lado 1 para cima."),
        rl("Enemy Dice", `the 2 red dice + ${blackDice()} of the 9 black dice.`, "Dados Inimigos", `os 2 dados vermelhos + ${blackDice()} dos 9 dados pretos.`),
        rl("Crisis Clock Hand & Back", harder() ? "“+1” side up." : "normal side up.", "Ponteiro e fundo do Relógio de Crise", harder() ? "lado “+1” para cima." : "lado normal para cima."),
        rl("50 Health Tokens, 40 Shield", "on the Henchmen as their panels say.", "50 marcadores de Vida, 40 Shield", "nos Capangas conforme os painéis."),
        rl("Boss Health Dial", "for the Boss Fight side.", "Mostrador Boss Health", "para o lado de Luta contra o Chefe."),
        rl("14 Defeat/Clear Tiles", "beside the board.", "14 fichas Defeat/Clear", "ao lado do tabuleiro."),
        rl("22 Plot Tokens, 7 Mystery Tiles", "only when the Mission or a Feat asks.", "22 Plot Tokens, 7 Mystery Tiles", "só quando a Missão ou uma Proeza pedir.")
      ], ["m3", "m5"]),
      infoCard(t("SHARED", "COMPARTILHADO"), t("Within reach of everyone", "Ao alcance de todos"), [
        rl("Ally deck", "25 cards; 3 face up as the Ally HQ.", "Baralho de Aliados", "25 cartas; 3 viradas para cima como QG."),
        rl("Boost Tiles", "30, shuffled; one face up on each Boost space.", "Fichas de Boost", "30, embaralhadas; uma virada para cima em cada espaço de Boost."),
        rl("Start Player Token", solo() ? "yours." : "with the highest roller.", "Marcador de Jogador Inicial", solo() ? "com você." : "com quem rolou mais alto."),
        rl("Status tokens", "21 kinds in the tray (see Status Effects).", "Marcadores de status", "21 tipos na bandeja (veja Efeitos de Status)."),
        campaign() ? rl("Mythic Cards", "4; only for players who unlocked them.", "Cartas Míticas", "4; só para quem as desbloqueou.") : rl("Mythic Cards", "4, left in the box.", "Cartas Míticas", "4, deixadas na caixa."),
        rl("Player Perk Pad", "to record Perk Points afterwards.", "Bloco de Vantagens", "para anotar os Pontos de Vantagem depois.")
      ], ["m3", "m4", "m5"])
    ]);
  }

  function setupSection() {
    const phases = setupPhases();
    const done = phases.filter((phase) => setupState.checks.includes(phase.id)).length;
    const phaseMarkup = phases.map((phase, index) => `
      <article class="setup-phase">
        <header class="setup-phase-header">
          <span class="setup-phase-number">${String(index + 1).padStart(2, "0")}</span>
          <h3>${phase.title}</h3>
          <div class="setup-phase-references">${refs(phase.pages)}</div>
        </header>
        <label class="mdt-setup-check" for="mdt-setup-${phase.id}">
          <input id="mdt-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="mdt-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="mdt-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
        ${phase.art ? artRow(figure(phase.art[0], phase.art[1], phase.art[0] === "setup")) : ""}
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), missions() ? ["m4", "m5", "c3"] : ["c3", teams() || koth() ? "c11" : ""])}
      ${easierIncomplete() ? `<p class="mdt-warning" role="alert"><strong>${t("Incomplete configuration.", "Configuração incompleta.")}</strong> ${t("“Decreased difficulty” is selected but none of its three modifications is on. Go back to Build your match and choose at least one, or select the printed difficulty.", "“Dificuldade reduzida” está selecionada, mas nenhuma das três modificações está ligada. Volte a Configure a partida e escolha ao menos uma, ou selecione a dificuldade impressa.")}</p>` : ""}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Suit up", "Preparem-se")} · ${matchSummary()}</h3>
            <p>${missions()
              ? t("One checkbox per step, in the order of the Missions rulebook (it numbers them 1–12; some are grouped here).", "Uma caixa de seleção por etapa, na ordem do livro de Missões (ele as numera de 1 a 12; algumas estão agrupadas aqui).")
              : t("One checkbox per step, in the rulebook's order (its eight numbered setup items are grouped into these steps).", "Uma caixa de seleção por etapa, na ordem do livro (os oito itens numerados da preparação dele estão agrupados nestas etapas).")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${missions() ? t(
          "Progress is saved on this device separately from the match options. Changing the mode, the number of Heroes, the difficulty options that alter the setup or the Perk Sheets choice clears it; changing the language or “double Perk Points” does not. “Uncheck all” clears only these setup boxes.",
          "O progresso é salvo neste aparelho separado das opções da partida. Mudar o modo, o número de Heróis, as opções de dificuldade que alteram a preparação ou a escolha das Fichas de Vantagens o limpa; trocar o idioma ou “Pontos de Vantagem em dobro” não. “Desmarcar tudo” limpa somente estas caixas da preparação."
        ) : t(
          "Progress is saved on this device separately from the match options. Changing the mode clears it; changing the language does not. “Uncheck all” clears only these setup boxes.",
          "O progresso é salvo neste aparelho separado das opções da partida. Mudar o modo o limpa; trocar o idioma não. “Desmarcar tudo” limpa somente estas caixas da preparação."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}`;
  }

  // ---------- quick reference ----------

  function turnPhaseLines(short = false) {
    const n = (number, en, pt) => (missions() ? [en, pt] : [`${number} · ${en}`, `${number} · ${pt}`]);
    const label = (number, en, pt, bodyEn, bodyPt) => { const [a, b] = n(number, en, pt); return rl(a, bodyEn, b, bodyPt); };
    const lines = [
      label(1, "Upkeep", "Manutenção (Upkeep)", "resolve Status Effects and abilities that act in your Upkeep Phase, in the order you choose.", "resolva Efeitos de Status e habilidades que agem na sua Fase de Manutenção, na ordem que quiser."),
      label(2, "Income", "Renda (Income)", missions() ? "gain 1 CP and draw 1 card. All Heroes skip it in the first round of the Mission." : "gain 1 CP and draw 1 card. The Start Player skips it on their first turn.", missions() ? "ganhe 1 CP e compre 1 carta. Todos os Heróis pulam na primeira rodada da Missão." : "ganhe 1 CP e compre 1 carta. O Jogador Inicial pula no primeiro turno."),
      label(3, "Main Phase (1)", "Fase Principal (1)", "sell cards for 1 CP each; play Main Phase Action cards and Hero Upgrades.", "venda cartas por 1 CP cada; jogue cartas de Ação de Fase Principal e Melhorias de Herói."),
      missions()
        ? label(4, "Offensive Roll", "Rolagem Ofensiva", "up to 3 Roll Attempts with your 5 dice, then say “Ready to attack!”. (Round phase 3 ends here.)", "até 3 Tentativas de Rolagem com os seus 5 dados; depois diga “Pronto para atacar!”. (A fase 3 da rodada termina aqui.)")
        : label(4, "Offensive Roll", "Rolagem Ofensiva", "up to 3 Roll Attempts with your 5 dice, then activate ONE Offensive Ability (or none).", "até 3 Tentativas de Rolagem com os seus 5 dados; depois ative UMA Habilidade Ofensiva (ou nenhuma).")
    ];
    if (missions()) {
      lines.push(rl("Target & Resolve (round phase 4)", "in turn order, choose an enemy (adjacent unless you gain Range), activate ONE Offensive Ability and resolve all of it.", "Alvo e Resolução (fase 4 da rodada)", "em ordem de turno, escolha um inimigo (adjacente, a menos que ganhe Range), ative UMA Habilidade Ofensiva e resolva-a por inteiro."));
    } else if (duel()) {
      lines.push(rl("5 · Targeting Roll", "skipped — you have only one opponent.", "5 · Rolagem de Alvo", "pulada — você só tem um oponente."));
    } else if (koth()) {
      lines.push(rl("5 · Targeting", "choose any opponent; draw 1 card if you target a Leader.", "5 · Alvo", "escolha qualquer oponente; compre 1 carta se mirar um Líder."));
    } else {
      lines.push(rl("5 · Targeting Roll", "roll 1 die: 1–2 opponent on your left, 3–4 on your right, 5 they choose, 6 you choose.", "5 · Rolagem de Alvo", "role 1 dado: 1–2 oponente à sua esquerda, 3–4 à direita, 5 eles escolhem, 6 você escolhe."));
    }
    if (!missions()) {
      lines.push(rl("6 · Defensive Roll", "your ability's targeted effects land; if it is a defendable Attack, the Defender may roll their Defensive Ability once. Then all damage is applied together.", "6 · Rolagem Defensiva", "os efeitos com alvo da sua habilidade acontecem; se for um Ataque defensável, o Defensor pode rolar a Habilidade Defensiva uma vez. Depois todo o dano é aplicado junto."));
    }
    lines.push(
      rl(missions() ? "Main Phase (2) (round phase 5)" : "7 · Main Phase (2)", "same as Main Phase (1).", missions() ? "Fase Principal (2) (fase 5 da rodada)" : "7 · Fase Principal (2)", "igual à Fase Principal (1)."),
      rl(missions() ? "Discard (round phase 5)" : "8 · Discard", "sell cards for 1 CP each until you hold 6 or fewer.", missions() ? "Descarte (fase 5 da rodada)" : "8 · Descarte", "venda cartas por 1 CP cada até ficar com 6 ou menos.")
    );
    return short ? lines : lines;
  }

  function quickReference() {
    const rollCard = infoCard(t("OFFENSIVE ROLL", "ROLAGEM OFENSIVA"), t("Up to 3 Roll Attempts", "Até 3 Tentativas de Rolagem"), [
      rl("Attempt 1", "roll all 5 dice.", "Tentativa 1", "role os 5 dados."),
      rl("Attempts 2 and 3", "optionally re-roll any number of dice.", "Tentativas 2 e 3", "opcionalmente role de novo quantos dados quiser."),
      rl("Announce", "one Offensive Ability whose Activation Requirement your Final Dice Result meets — or none.", "Anuncie", "uma Habilidade Ofensiva cujo Requisito de Ativação o seu Resultado Final dos Dados atende — ou nenhuma."),
      rl("If your dice are altered", "announce a different ability, or go back and use your unused re-rolls.", "Se alterarem os seus dados", "anuncie outra habilidade, ou volte e use as rolagens que sobraram."),
      rl("Straights", "Small = any 4 numbers in sequence; Large = any 5.", "Sequências", "Pequena = 4 números em sequência; Grande = 5."),
      rl("Roll Phase Action cards", "any player may play them after any step.", "Cartas de Ação de Fase de Rolagem", "qualquer jogador pode jogá-las depois de qualquer passo.")
    ], ["c12", "c5"]);
    const cardsCard = infoCard(t("CARDS & CP", "CARTAS E CP"), t("Costs and limits", "Custos e limites"), [
      rl("Cost", "the CP number on the left of the card; 0 CP is free.", "Custo", "o número de CP à esquerda da carta; 0 CP é grátis."),
      rl("Sell", "discard any card from hand in a Main Phase for 1 CP.", "Vender", "descarte qualquer carta da mão numa Fase Principal por 1 CP."),
      rl("CP maximum", "15; gains beyond it are lost.", "Máximo de CP", "15; ganhos além disso se perdem."),
      rl("Hand limit", "6 at the end of your Discard Phase.", "Limite de mão", "6 ao fim da sua Fase de Descarte."),
      rl("Main Phase card (blue)", "your own Main Phases only.", "Carta de Fase Principal (azul)", "só nas suas Fases Principais."),
      missions()
        ? rl("Roll Phase card (orange)", "during any roll: a Hero's Offensive Roll, a Defense Roll or the Enemy Roll Phase.", "Carta de Fase de Rolagem (laranja)", "durante qualquer rolagem: a Rolagem Ofensiva de um Herói, uma Rolagem de Defesa ou a Fase de Rolagem Inimiga.")
        : rl("Roll Phase card (orange)", "any player's Offensive, Targeting or Defensive Roll Phase.", "Carta de Fase de Rolagem (laranja)", "na Rolagem Ofensiva, de Alvo ou Defensiva de qualquer jogador."),
      rl("Instant card (red)", "any time, any turn; cannot be interrupted.", "Carta Instantânea (vermelha)", "a qualquer momento, em qualquer turno; não pode ser interrompida."),
      rl("Hero Upgrade", "your Main Phases; II → III pays only the difference.", "Melhoria de Herói", "nas suas Fases Principais; II → III paga só a diferença.")
    ], ["c7", "c8", "c9"]);
    const damageCard = infoCard(t("DAMAGE", "DANO"), t("Five types", "Cinco tipos"), [
      rl("Normal (“dmg”, black circle)", "defendable, avoidable, modifiable.", "Normal (“dmg”, círculo preto)", "defensável, evitável, modificável."),
      rl("Undefendable (red circle)", "no Defensive Ability; avoidable and modifiable.", "Indefensável (círculo vermelho)", "sem Habilidade Defensiva; evitável e modificável."),
      rl("Pure", "no defense, no Attack Modifiers; avoidable.", "Puro", "sem defesa, sem Modificadores de Ataque; evitável."),
      rl("Collateral", "like pure, hits whoever the text says; not an Attack.", "Colateral", "como o puro, atinge quem o texto disser; não é um Ataque."),
      rl("Ultimate", "nothing stops it; it can only be increased.", "Supremo (Ultimate)", "nada o impede; só pode ser aumentado."),
      missions()
        ? rl("When", "all damage, prevention and healing of one Attack are applied together when that Attack has finished resolving (guide's reading for Missions).", "Quando", "todo dano, prevenção e cura de um Ataque são aplicados juntos quando esse Ataque termina de resolver (leitura do guia para Missões).")
        : rl("When", "all damage, prevention and healing of a Roll Phase are applied together at its end.", "Quando", "todo dano, prevenção e cura de uma Fase de Rolagem são aplicados juntos no fim dela.")
    ], ["c10", "c13"]);
    const wordsCard = infoCard(t("KEY WORDS", "PALAVRAS-CHAVE"), t("On boards and cards", "Nos tabuleiros e cartas"), [
      rl("Roll [#]", "roll that many dice once, fresh, then apply what follows.", "Roll [#]", "role esse número de dados uma vez, do zero, e aplique o que segue."),
      rl("On [symbol]", "benefit once, however many dice show it.", "On [símbolo]", "benefício uma vez, não importa quantos dados o mostrem."),
      rl("N × [symbol]", "multiply by the number of your dice showing it.", "N × [símbolo]", "multiplique pelo número de dados seus que o mostram."),
      rl("Then", "a pause: cards and Status Effects may be used; what follows happens after.", "Then (então)", "uma pausa: cartas e Efeitos de Status podem ser usados; o que segue acontece depois."),
      rl("Or", "resolve only one option.", "Or (ou)", "resolva só uma opção."),
      rl("Steal", "take the stated amount from the opponent (all they have, if they have less).", "Steal (roubar)", "tire do oponente a quantidade indicada (tudo o que ele tiver, se tiver menos).")
    ], ["c9", "c16"]);

    if (missions()) {
      const cards = [
        infoCard(t("ROUND", "RODADA"), t("8 round phases", "8 fases da rodada"), [
          rl("1 · Pass", solo() ? "solo: you keep the Start Player Token." : "pass the Start Player Token clockwise (not in the very first round of Side 1).", "1 · Passagem", solo() ? "solo: o marcador de Jogador Inicial fica com você." : "passe o marcador de Jogador Inicial em sentido horário (não na primeiríssima rodada do Lado 1)."),
          rl("2 · Movement", "all Heroes move any number of spaces and collect Boost Tiles where they stop.", "2 · Movimento", "todos os Heróis se movem quantos espaços quiserem e pegam as Fichas de Boost onde param."),
          rl("3 · Hero Phase Part 1", "everyone at once: Upkeep, Income, Main Phase (1), Roll Attempts. Say “Ready to attack!”.", "3 · Fase dos Heróis, Parte 1", "todos ao mesmo tempo: Manutenção, Renda, Fase Principal (1), Tentativas de Rolagem. Diga “Pronto para atacar!”."),
          rl("4 · Target & Resolve", "in turn order each Hero resolves their Offensive Ability on a chosen enemy.", "4 · Alvo e Resolução", "em ordem de turno cada Herói resolve a sua Habilidade Ofensiva num inimigo escolhido."),
          rl("5 · Hero Phase Part 2", "everyone at once: Main Phase (2), then Discard.", "5 · Fase dos Heróis, Parte 2", "todos ao mesmo tempo: Fase Principal (2), depois Descarte."),
          rl("6 · Enemy Upkeep", "resolve Upkeep status effects on enemies.", "6 · Manutenção Inimiga", "resolva efeitos de status de Manutenção nos inimigos."),
          rl("7 · Enemy Roll", "roll the Enemy Dice ONCE; matching enemies Attack; Heroes may defend.", "7 · Rolagem Inimiga", "role os Dados Inimigos UMA vez; inimigos que casarem Atacam; Heróis podem se defender."),
          rl("8 · Crisis Clock", `advance the hand ${clockSteps()} segment${clockSteps() > 1 ? "s" : ""} and activate each Crisis Ability passed or landed on.`, "8 · Relógio de Crise", `avance o ponteiro ${clockSteps()} segmento${clockSteps() > 1 ? "s" : ""} e ative cada Habilidade de Crise por onde passar ou parar.`)
        ], ["m6"]),
        infoCard(t("YOUR HERO TURN", "SEU TURNO DE HERÓI"), t("Your phases, in order", "As suas fases, em ordem"), turnPhaseLines(), ["m6", "c4"]),
        rollCard,
        infoCard(t("MELEE & RANGE", "MELEE E RANGE"), t("Who can you hit?", "Quem você pode atingir?"), [
          rl("Melee (default)", "Attacks and Defensive Abilities only work against an enemy in a space sharing a border with yours.", "Melee (padrão)", "Ataques e Habilidades Defensivas só funcionam contra um inimigo num espaço que faz fronteira com o seu."),
          rl("No adjacent enemy", "you cannot resolve any part of a Melee Attack.", "Sem inimigo adjacente", "você não resolve parte alguma de um Ataque Melee."),
          rl("Range", "gained by spending Momentum (see your Momentum Card) or from Allies, BEFORE resolving the Attack: target any enemy on the map.", "Range", "obtido gastando Momentum (veja a sua carta de Momentum) ou por Aliados, ANTES de resolver o Ataque: mire qualquer inimigo do mapa."),
          rl("No Range needed", "Ultimate Attacks, and abilities dealing only collateral or no damage.", "Sem precisar de Range", "Ataques Supremos e habilidades que só causam dano colateral ou nenhum dano."),
          rl("Defending", "you need Range to make a Defense Roll against a non-adjacent attacker.", "Defesa", "você precisa de Range para fazer uma Rolagem de Defesa contra um atacante não adjacente.")
        ], ["m4", "m6", "m7"]),
        infoCard(t("ENEMY ROLL", "ROLAGEM INIMIGA"), t(`2 red + ${blackDice()} black dice, once`, `2 vermelhos + ${blackDice()} pretos, uma vez`), [
          rl("Faces", "1–3 Strike, 4–5 Vortex, 6 Hedron.", "Faces", "1–3 Strike, 4–5 Vortex, 6 Hedron."),
          rl("Henchmen", "panels left to right; each type whose required symbols appear in the roll attacks, its Henchmen going left to right, top to bottom.", "Capangas", "painéis da esquerda para a direita; cada tipo cujos símbolos pedidos aparecem na rolagem ataca, com os seus Capangas da esquerda para a direita, de cima para baixo."),
          rl("Multi-Strike", "hits every adjacent Hero (Melee) or every Hero on the map (Range).", "Multi-Strike", "atinge cada Herói adjacente (Melee) ou cada Herói no mapa (Range)."),
          rl("Unstoppable Threat", "activates last, if its required symbols appear in the roll.", "Ameaça Imparável", "ativa por último, se os símbolos que ela pede aparecem na rolagem."),
          rl("Boss · red dice", "each drops a face-down Boost Tile on the map space with its number.", "Chefe · dados vermelhos", "cada um põe uma Ficha de Boost virada para baixo no espaço do mapa com o seu número."),
          rl("Boss · Attack", "only the FIRST Attack (left to right) whose roll objective is matched activates.", "Chefe · Ataque", "só ativa o PRIMEIRO Ataque (da esquerda para a direita) cujo objetivo de rolagem foi atingido."),
          rl("Boss · CRIT", "extra effect on Attacked Heroes standing on, or holding, face-down Boost Tiles.", "Chefe · CRIT", "efeito extra nos Heróis Atacados que estão sobre, ou têm, Fichas de Boost viradas para baixo.")
        ], ["m7", "m10", "m12"]),
        infoCard(t("ENEMY DEFENSE", "DEFESA INIMIGA"), t("Shields and Boss Defense", "Escudos e Defesa do Chefe"), [
          rl("Henchmen", "never roll defense. Against a defendable Attack they spend as many Shield tokens as needed: each prevents up to 3 dmg.", "Capangas", "nunca rolam defesa. Contra um Ataque defensável gastam quantos Shield forem precisos: cada um previne até 3 de dano."),
          rl("Not defendable", "undefendable, pure, collateral and Ultimate damage ignore Shield.", "Não defensável", "dano indefensável, puro, colateral e Supremo ignoram Shield."),
          rl("Boss", "automatically uses its Boss Defense (no roll) against each defendable Attack, then Shield.", "Chefe", "usa automaticamente a Boss Defense (sem rolagem) contra cada Ataque defensável, depois Shield."),
          rl("Defeated Henchman", solo() ? "cover its spaces with a Defeat Tile; you gain 2 Momentum." : "cover its spaces with a Defeat Tile; the Start Player hands out 2 Momentum among the Heroes.", "Capanga derrotado", solo() ? "cubra os espaços dele com uma ficha Defeat; você ganha 2 de Momentum." : "cubra os espaços dele com uma ficha Defeat; o Jogador Inicial distribui 2 de Momentum entre os Heróis."),
          rl("Unstoppable Threat", "cannot be targeted, damaged or given status effects.", "Ameaça Imparável", "não pode ser alvo, sofrer dano nem receber efeitos de status.")
        ], ["m7", "m9", "m10"]),
        infoCard(t("MOMENTUM, BOOSTS, ALLIES", "MOMENTUM, BOOSTS, ALIADOS"), t("New resources", "Novos recursos"), [
          rl("Momentum", "your own dial, maximum 15; spend it on the actions of your Momentum Card, as often as you can pay.", "Momentum", "o seu mostrador, máximo 15; gaste nas ações da sua carta de Momentum, quantas vezes puder pagar."),
          rl("Instead of a status", "when you would place a status effect on a targeted enemy you may gain 1 Momentum instead.", "Em vez de um status", "quando fosse colocar um efeito de status num inimigo alvo, você pode ganhar 1 de Momentum."),
          rl("Boost Tiles", "collect all tiles on the space where you end your move; face-up ones resolve at once.", "Fichas de Boost", "pegue todas as fichas do espaço onde termina o movimento; as viradas para cima resolvem na hora."),
          rl("Allies", "recruit from the Ally HQ in a Main Phase by paying the Momentum cost; 1 Ally each by default; each power once per round.", "Aliados", "recrute do QG numa Fase Principal pagando o custo em Momentum; 1 Aliado cada por padrão; cada poder uma vez por rodada.")
        ], ["m7", "m8"]),
        infoCard(t("WIN / LOSE", "VITÓRIA / DERROTA"), t("Together", "Juntos"), [
          rl("Win", "complete the Main Objective on Side 1, flip the board, then complete the Main Objective on Side 2.", "Vitória", "cumpram o Objetivo Principal do Lado 1, virem o tabuleiro e cumpram o Objetivo Principal do Lado 2."),
          rl("Lose", "a Hero is reduced to 0 Health (the team loses when the current round phase ends), or an objective says you lose.", "Derrota", "um Herói é reduzido a 0 de Vida (o time perde quando a fase da rodada atual termina), ou um objetivo diz que vocês perdem."),
          rl("Photo finish", "if the Side 2 Main Objective is completed in that same round phase, you win instead.", "No limite", "se o Objetivo Principal do Lado 2 for cumprido nessa mesma fase da rodada, vocês vencem."),
          rl("Between sides", "keep Health, cards, CP and Momentum; redo the Crisis Clock, Henchmen / Boss, Boost Tile and Additional Setup steps (rulebook steps 8–11).", "Entre os lados", "mantenham Vida, cartas, CP e Momentum; refaçam as etapas do Relógio de Crise, Capangas / Chefe, Fichas de Boost e Additional Setup (passos 8–11 do livro)."),
          rl("Health cap", `${startHealth() + 10} (10 above starting Health).`, "Limite de Vida", `${startHealth() + 10} (10 acima da Vida inicial).`)
        ], ["m8", "m4"], "victory-card"),
        cardsCard,
        damageCard,
        wordsCard
      ];
      return `
        ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), ["m6", "m7", "m8", "c4"])}
        ${grid(cards)}`;
    }

    const modeCard = koth()
      ? infoCard(t("KING OF THE HILL", "REI DA COLINA"), t("3 players", "3 jogadores"), [
        rl("Health", "35 each (maximum 45).", "Vida", "35 cada (máximo 45)."),
        rl("Order", "clockwise.", "Ordem", "sentido horário."),
        rl("Target", "any opponent you like — no targeting die.", "Alvo", "qualquer oponente — sem dado de alvo."),
        rl("Leader", "whoever has the most Health; ties make several Leaders.", "Líder", "quem tem mais Vida; empates fazem vários Líderes."),
        rl("Bonus", "target a Leader with an Attack → draw 1 card at once, before anything else.", "Bônus", "mire um Líder com um Ataque → compre 1 carta na hora, antes de qualquer outra coisa."),
        rl("If you are the only Leader", "you cannot earn the bonus.", "Se você é o único Líder", "você não pode ganhar o bônus.")
      ], ["c11", "c13"])
      : teams()
        ? infoCard(t("2v2 TEAM GAME", "JOGO EM TIMES 2v2"), t("4 players", "4 jogadores"), [
          rl("Health", "one shared dial per team at 50 (maximum 60); any damage to either teammate lowers it.", "Vida", "um mostrador por time em 50 (máximo 60); qualquer dano a um dos parceiros o reduz."),
          rl("CP", "individual; never spent for your teammate.", "CP", "individual; nunca gasto pelo parceiro."),
          rl("Order", "zigzag between the teams.", "Ordem", "zigue-zague entre os times."),
          rl("Target", "roll 1 die — 1–2 left, 3–4 right, 5 opponents choose, 6 you choose.", "Alvo", "role 1 dado — 1–2 esquerda, 3–4 direita, 5 os oponentes escolhem, 6 você escolhe."),
          rl("Helping", "you may alter dice for your teammate; you may reduce their incoming damage only with a card or Status Effect that allows it (for example one that says “a chosen player”).", "Ajuda", "você pode alterar dados pelo parceiro; só reduz o dano dele com uma carta ou Efeito de Status que permita (por exemplo um que diga “a chosen player”)."),
          rl("Hands", "teammates may view each other's hands.", "Mãos", "parceiros podem ver a mão um do outro.")
        ], ["c11", "c13"])
        : "";
    const cards = [
      infoCard(t("YOUR TURN", "SEU TURNO"), t("8 phases, in order", "8 fases, em ordem"), turnPhaseLines(), ["c4", "c12", "c13"]),
      rollCard,
      infoCard(t("DEFENSIVE ROLL", "ROLAGEM DEFENSIVA"), t("After your ability hits a target", "Depois que a sua habilidade atinge um alvo"), [
        rl("First", "the attacker resolves the non-damage effects that need a target (such as inflicting a Status Effect).", "Primeiro", "o atacante resolve os efeitos sem dano que precisam de alvo (como infligir um Efeito de Status)."),
        rl("Defender", "if the Attack is defendable, may roll the dice shown on “DEFENSE ROLL #” exactly once.", "Defensor", "se o Ataque é defensável, pode rolar os dados indicados em “DEFENSE ROLL #” exatamente uma vez."),
        rl("No defense roll", "against undefendable, pure, collateral or Ultimate damage — the other steps still happen.", "Sem rolagem de defesa", "contra dano indefensável, puro, colateral ou Supremo — os outros passos ainda acontecem."),
        rl("Last chance", "any player may still spend Status Effects or play cards (opponents may not against an Ultimate).", "Última chance", "qualquer jogador ainda pode gastar Efeitos de Status ou jogar cartas (os oponentes não, contra uma Suprema)."),
        rl("Then", "all damage, prevention and healing are applied at the same time.", "Depois", "todo dano, prevenção e cura são aplicados ao mesmo tempo.")
      ], ["c5", "c13"]),
      modeCard,
      cardsCard,
      damageCard,
      infoCard(t("WIN / LOSE", "VITÓRIA / DERROTA"), t("Health and CP", "Vida e CP"), [
        rl("Defeated", teams() ? "the moment your team's shared Health reaches 0." : "the moment your Health reaches 0.", "Derrotado", teams() ? "no momento em que a Vida compartilhada do time chega a 0." : "no momento em que a sua Vida chega a 0."),
        rl("Win", koth() ? "be the last player standing." : teams() ? "reduce the other team to 0." : "reduce your opponent to 0.", "Vitória", koth() ? "seja o último jogador de pé." : teams() ? "reduza o outro time a 0." : "reduza o oponente a 0."),
        rl("Draw", "all remaining players reach 0 at the same time.", "Empate", "todos os jogadores restantes chegam a 0 ao mesmo tempo."),
        rl("Healing cap", `${startHealth() + 10} (10 above your starting Health).`, "Limite de cura", `${startHealth() + 10} (10 acima da Vida inicial).`),
        rl("CP cap", "15.", "Limite de CP", "15.")
      ], ["c2", "c4"], "victory-card"),
      wordsCard
    ];
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), ["c4", "c12", "c13", "c16"])}
      ${grid(cards)}`;
  }

  // ---------- winning ----------

  function victorySection() {
    if (missions()) {
      return `
        ${sectionHeading("victory", t("Winning & losing", "Vitória e derrota"), ["m4", "m6", "m8", "m10"])}
        ${grid([
          infoCard(t("GOAL", "OBJETIVO"), t("Clear both sides of the Mission Board", "Limpem os dois lados do Tabuleiro de Missão"), [
            t("Each side of a Mission prints a Main Objective. Play continues in rounds until the team has won or lost.", "Cada lado de uma Missão traz um Objetivo Principal (Main Objective). O jogo segue em rodadas até o time vencer ou perder."),
            rl("Mission Run (usually Side 1)", "move around the map, deal with its special rules and fight Henchmen.", "Incursão / Mission Run (em geral Lado 1)", "movam-se pelo mapa, lidem com as regras especiais dele e enfrentem Capangas."),
            rl("Boss Fight (usually Side 2)", "defeat a villain, usually by reducing their Health to 0.", "Luta contra o Chefe / Boss Fight (em geral Lado 2)", "derrotem um vilão, em geral reduzindo a Vida dele a 0."),
            rl("You win", "by completing the Main Objective on BOTH sides.", "Vocês vencem", "cumprindo o Objetivo Principal dos DOIS lados."),
            onBoard("the exact wording of every objective is on the Mission Board.", "o texto exato de cada objetivo está no Tabuleiro de Missão.")
          ], ["m4", "m6", "m8"], "victory-card"),
          infoCard(t("DEFEAT", "DERROTA"), t("One Hero down and everyone loses", "Um Herói cai e todos perdem"), [
            rl("You lose", "if any Hero's Health is reduced to 0, or if an objective specifically says you lose.", "Vocês perdem", "se a Vida de qualquer Herói for reduzida a 0, ou se um objetivo disser especificamente que perdem."),
            rl("Defeated is defeated", "a Hero is defeated the moment their Health reaches 0; healing afterwards does not undo it.", "Derrotado é derrotado", "um Herói é derrotado no momento em que a Vida chega a 0; curar depois não desfaz isso."),
            rl("When", "the loss takes effect at the conclusion of the current round phase.", "Quando", "a derrota vale ao fim da fase da rodada atual."),
            rl("Saved by the bell", "if the team completes the Side 2 Main Objective before that round phase ends, it counts as a win instead.", "Salvos no fim", "se o time cumprir o Objetivo Principal do Lado 2 antes de essa fase da rodada acabar, conta como vitória."),
            rl("Either way", "check afterwards whether you earned Perk Points (see Perks & difficulty).", "De todo modo", "confiram depois se ganharam Pontos de Vantagem (veja Vantagens e dificuldade).")
          ], ["m8"], "victory-card"),
          infoCard(t("OBJECTIVES", "OBJETIVOS"), t("Main, Bonus and Perfect", "Principal, Bônus e Perfeito"), [
            rl("Main Objective", "required; completing it ends that side after the current round phase resolves.", "Objetivo Principal", "obrigatório; cumpri-lo encerra aquele lado depois que a fase da rodada atual se resolve."),
            rl("Bonus Objectives", "optional; completing one can reward the team, failing one may bring a penalty. If completed at the same time as the Main Objective, resolve the Bonus Objective first.", "Objetivos Bônus", "opcionais; cumprir um pode recompensar o time, falhar pode trazer penalidade. Se cumprido junto com o Objetivo Principal, resolva o Bônus primeiro."),
            rl("Perfect Reward", "an optional, harder requirement listed under the Main Objective on Side 1; it gives in-game rewards and an extra Perk Point.", "Recompensa Perfeita (Perfect Reward)", "uma exigência opcional e mais difícil listada sob o Objetivo Principal do Lado 1; dá recompensas na partida e um Ponto de Vantagem extra.")
          ], ["m8", "m11"]),
          infoCard(t("SIDE 1 DONE", "LADO 1 CONCLUÍDO"), t("Completing map sides", "Passando de lado"), [
            t("The round ends after the current round phase resolves. Then:", "A rodada termina depois que a fase atual se resolve. Então:"),
            t("Do NOT reset Health, cards, CP or Momentum: this is not a new game.", "NÃO reiniciem Vida, cartas, CP ou Momentum: não é um jogo novo."),
            t("Keep any face-down Boost Tiles you hold; put every other Boost Tile in the discard stack.", "Fiquem com as Fichas de Boost viradas para baixo que tiverem; ponham todas as outras na pilha de descarte."),
            t("Check whether the Mission has effects that carry over to Side 2.", "Vejam se a Missão tem efeitos que passam para o Lado 2."),
            t("Flip the map to Side 2 and repeat setup steps 8–11: Crisis Clock, Henchmen tokens or Boss Setup, Boost Tiles, Additional Setup.", "Virem o mapa para o Lado 2 e repitam os passos 8–11 da preparação: Relógio de Crise, marcadores dos Capangas ou Boss Setup, Fichas de Boost, Additional Setup."),
            interpretation("pawns leave the map and re-enter in the next Movement Phase, and the next round starts with the Pass Phase as usual.", "os peões saem do mapa e entram de novo na próxima Fase de Movimento, e a próxima rodada começa pela Fase de Passagem, como de costume.")
          ], ["m8", "m6"]),
          infoCard(t("EXITS", "SAÍDAS"), t("Leaving the map", "Saindo do mapa"), [
            t("Some Main Objectives require Heroes to EXIT the map. To EXIT during the Movement Phase:", "Alguns Objetivos Principais exigem que os Heróis saiam pelo EXIT. Para sair na Fase de Movimento:"),
            t("all other Main Objective requirements must already be satisfied;", "todas as outras exigências do Objetivo Principal já devem estar cumpridas;"),
            t("you must be able to move to the EXIT space along a connected path;", "você precisa conseguir chegar ao espaço EXIT por um caminho conectado;"),
            t("on reaching it, remove your pawn at once: you take no more turns, receive no damage and suffer no Offensive or Crisis Abilities.", "ao chegar, remova o peão na hora: você não faz mais turnos, não recebe dano e não sofre Habilidades Ofensivas nem de Crise."),
            t("The number of Heroes counted as playing stays the same for every calculation (Crisis Clock steps, “per hero” effects).", "O número de Heróis considerados em jogo continua o mesmo para todos os cálculos (passos do Relógio de Crise, efeitos “por herói”)."),
            solo() ? "" : t("Heroes who have not left keep playing rounds until they also choose to EXIT.", "Heróis que não saíram continuam jogando rodadas até também escolherem sair.")
          ], ["m8"]),
          infoCard(t("HEALTH & CP", "VIDA E CP"), t("Limits", "Limites"), [
            rl("Maximum Health", `${startHealth() + 10} for each Hero: 10 above the starting ${startHealth()}${campaign() ? " (higher for a player whose Perk raised their starting Health)" : ""}.`, "Vida máxima", `${startHealth() + 10} para cada Herói: 10 acima da inicial, ${startHealth()}${campaign() ? " (maior para um jogador cuja Vantagem aumentou a Vida inicial)" : ""}.`),
            rl("Enemies", "are players too: their maximum Health is 10 above their starting Health.", "Inimigos", "também são jogadores: a Vida máxima deles é 10 acima da inicial."),
            rl("CP", "maximum 15; extra gains are lost.", "CP", "máximo 15; ganhos extras se perdem."),
            rl("Momentum", "maximum 15.", "Momentum", "máximo 15.")
          ], ["m4", "m7", "m8", "c4"])
        ])}
        ${artRow(figure("exit", t("Missions p. 8: an EXIT space (F) at the edge of a map", "Missões p. 8: um espaço EXIT (F) na borda de um mapa")))}`;
    }
    const health = startHealth();
    return `
      ${sectionHeading("victory", t("Winning, Health & Combat Points", "Vitória, Vida e Pontos de Combate"), ["c2", "c4", teams() || koth() ? "c11" : ""])}
      ${grid([
        infoCard(t("GOAL", "OBJETIVO"), koth() ? t("Be the last hero standing", "Seja o último herói de pé") : teams() ? t("Bring the other team to 0 Health", "Leve o outro time a 0 de Vida") : t("Bring your opponent to 0 Health", "Leve o oponente a 0 de Vida"), [
          t("Defeat your opponents by reducing their Health to 0.", "Derrote os oponentes reduzindo a Vida deles a 0."),
          teams() ? t("A team is defeated the moment its shared Health Dial reaches 0: both teammates lose together.", "Um time é derrotado no momento em que o mostrador de Vida compartilhado chega a 0: os dois parceiros perdem juntos.") : t("The moment your Health is reduced to 0, you have been defeated.", "No momento em que a sua Vida é reduzida a 0, você foi derrotado."),
          koth() ? interpretation("a defeated player is out and their turns are skipped; the other two keep playing until one remains. Status Effects the defeated player inflicted stay in play.", "um jogador derrotado sai e os turnos dele são pulados; os outros dois continuam até restar um. Efeitos de Status que o derrotado infligiu continuam em jogo.") : "",
          rl("Draw", "if all remaining players are reduced to 0 Health simultaneously, the game is a draw — nobody can be “more defeated”.", "Empate", "se todos os jogadores restantes forem reduzidos a 0 de Vida ao mesmo tempo, o jogo empata — ninguém fica “mais derrotado”.")
        ], ["c2", "c4", "c13"], "victory-card"),
        infoCard(t("HEALTH", "VIDA"), t(`Start ${health} · maximum ${health + 10}`, `Início ${health} · máximo ${health + 10}`), [
          teams() ? t("Tracked on the team's single Health Dial.", "Marcada no único mostrador de Vida do time.") : t("Tracked on your Health Dial.", "Marcada no seu mostrador de Vida."),
          rl("Heal", `you may heal at most 10 points above your starting Health: ${health + 10}.`, "Cura", `você pode curar no máximo 10 pontos acima da Vida inicial: ${health + 10}.`),
          rl("Damage timing", "damage of an Upkeep Phase is applied at the end of that phase; damage of the Roll Phases is applied together just before Main Phase (2).", "Momento do dano", "o dano de uma Fase de Manutenção é aplicado ao fim dela; o dano das Fases de Rolagem é aplicado junto logo antes da Fase Principal (2)."),
          rl("Isolated damage", "when an ability, card or token says its damage is “isolated”, it is dealt immediately, as a separate instance.", "Dano isolado", "quando uma habilidade, carta ou marcador diz que o dano é “isolated” (isolado), ele é causado na hora, como uma instância separada.")
        ], ["c4", "c12", "c13", "c16"]),
        infoCard(t("COMBAT POINTS (CP)", "PONTOS DE COMBATE (CP)"), t("Start 2 · maximum 15", "Início 2 · máximo 15"), [
          t("CP is spent mainly to pay for cards.", "CP é gasto principalmente para pagar cartas."),
          rl("Income", "at the start of your Income Phase, increase your CP Dial by 1.", "Renda", "no início da sua Fase de Renda, aumente o mostrador de CP em 1."),
          rl("Selling", "+1 CP per card sold.", "Venda", "+1 CP por carta vendida."),
          rl("Maximum", "15. If you gain CP while at 15, the dial does not move.", "Máximo", "15. Se ganhar CP estando em 15, o mostrador não muda."),
          rl("Important", "the Start Player must skip their first Income Phase.", "Importante", "o Jogador Inicial pula a primeira Fase de Renda.")
        ], ["c4", "c16"])
      ])}`;
  }

  // ---------- turn phases (core p. 4, 12–13) ----------

  function upkeepCard() {
    return infoCard(missions() ? t("HERO PHASE PART 1", "FASE DOS HERÓIS · PARTE 1") : t("PHASE 1", "FASE 1"), t("Upkeep Phase", "Fase de Manutenção (Upkeep)"), [
      t("Check whether any of your Status Effects or abilities act during your Upkeep Phase, and resolve them. Early in the game most heroes have nothing to do here.", "Veja se algum dos seus Efeitos de Status ou habilidades age na Fase de Manutenção e resolva. No começo da partida a maioria dos heróis não tem nada a fazer aqui."),
      missions() ? t("If there are several effects, you choose the order.", "Se houver vários efeitos, você escolhe a ordem.") : t("If there are several effects, the Active Player chooses the order.", "Se houver vários efeitos, o Jogador Ativo escolhe a ordem."),
      t("All damage and healing from this phase is added up and applied simultaneously when the phase ends.", "Todo o dano e a cura desta fase são somados e aplicados ao mesmo tempo quando a fase termina.")
    ], ["c4", "c12"]);
  }

  function incomeCard() {
    return infoCard(missions() ? t("HERO PHASE PART 1", "FASE DOS HERÓIS · PARTE 1") : t("PHASE 2", "FASE 2"), t("Income Phase", "Fase de Renda (Income)"), [
      missions()
        ? rl("First round", "all Heroes skip the Income Phase in the first round of the Mission. Flipping to Side 2 is not a new game, so nobody skips it again.", "Primeira rodada", "todos os Heróis pulam a Fase de Renda na primeira rodada da Missão. Virar para o Lado 2 não é um jogo novo, então ninguém pula de novo.")
        : rl("Important", "the Start Player skips the Income Phase of their first turn.", "Importante", "o Jogador Inicial pula a Fase de Renda do primeiro turno."),
      rl("1 · CP", "increase your CP Dial by 1 (skip if you are already at the maximum of 15).", "1 · CP", "aumente o mostrador de CP em 1 (pule se já está no máximo de 15)."),
      rl("2 · Card", "draw 1 card from the top of your deck. If the deck is empty, first shuffle your Discard Pile to make a new deck.", "2 · Carta", "compre 1 carta do topo do baralho. Se o baralho acabou, antes embaralhe a sua pilha de Descarte para formar um novo.")
    ], missions() ? ["c12", "m6"] : ["c4", "c12"]);
  }

  function mainCard() {
    return infoCard(missions() ? t("HERO PHASE PART 1", "FASE DOS HERÓIS · PARTE 1") : t("PHASE 3", "FASE 3"), t("Main Phase (1)", "Fase Principal (1)"), [
      t("Do any of these, in any order, as many times as you like:", "Faça qualquer uma destas coisas, em qualquer ordem, quantas vezes quiser:"),
      rl("A · Sell any card", "put 1 card from your hand on your Discard Pile and gain 1 CP. Every card is worth 1 CP, whatever it costs to play.", "A · Vender uma carta", "ponha 1 carta da mão na pilha de Descarte e ganhe 1 CP. Toda carta vale 1 CP, não importa quanto custa jogar."),
      rl("B · Play Main Phase Action cards", "pay the CP cost on the left of the card, do what it says, then discard it.", "B · Jogar cartas de Ação de Fase Principal", "pague o custo em CP à esquerda da carta, faça o que ela diz e descarte-a."),
      rl("C · Play Hero Upgrade cards", "pay the CP cost and place the card on the space of your Hero Board with the same name. Upgrading from level II to level III costs only the difference.", "C · Jogar Melhorias de Herói", "pague o custo em CP e coloque a carta no espaço do Tabuleiro do Herói com o mesmo nome. Melhorar do nível II para o III custa só a diferença."),
      missions() ? rl("Missions", `also recruit Allies and use Momentum Actions limited to the Main Phase.${solo() ? "" : " You may only play a Main Phase card on a teammate who is in their Main Phase too."}`, "Missões", `também recrute Aliados e use Ações de Momentum limitadas à Fase Principal.${solo() ? "" : " Você só joga uma carta de Fase Principal num parceiro que também esteja na Fase Principal."}`) : ""
    ], missions() ? ["c12", "m6", "m8"] : ["c4", "c12"]);
  }

  function offensiveCard() {
    return infoCard(missions() ? t("PART 1, THEN TARGET & RESOLVE", "PARTE 1, DEPOIS ALVO E RESOLUÇÃO") : t("PHASE 4", "FASE 4"), t("Offensive Roll Phase", "Fase de Rolagem Ofensiva"), [
      rl("1 · Roll", "perform up to 3 Roll Attempts: roll all 5 of your dice; optionally re-roll any number of them; optionally re-roll any number a second time.", "1 · Role", "faça até 3 Tentativas de Rolagem: role os seus 5 dados; opcionalmente role de novo quantos quiser; opcionalmente role de novo quantos quiser uma segunda vez."),
      rl("2 · Announce", missions() ? "when satisfied, stop and say “Ready to attack!”. You choose the Offensive Ability when your turn comes in the Target & Resolve Phase: any one whose Activation Requirement your Final Dice Result meets, or none (guide's reading: saying “Ready” does not bind you to one ability)." : `when satisfied, either name the Offensive Ability you intend to activate — your Final Dice Result must meet its Activation Requirement — and ask ${koth() || teams() ? "your opponents" : "your opponent"} whether they want to alter your dice or let it activate; or announce that you activate no Offensive Ability.`, "2 · Anuncie", missions() ? "quando estiver satisfeito, pare e diga “Pronto para atacar!”. Você escolhe a Habilidade Ofensiva quando chegar a sua vez na Fase de Alvo e Resolução: qualquer uma cujo Requisito de Ativação o seu Resultado Final dos Dados atenda, ou nenhuma (leitura do guia: dizer “Pronto” não te prende a uma habilidade)." : `quando estiver satisfeito, ou nomeie a Habilidade Ofensiva que pretende ativar — o seu Resultado Final dos Dados precisa atender ao Requisito de Ativação — e pergunte ${koth() || teams() ? "aos oponentes se querem" : "ao oponente se ele quer"} alterar os dados que você rolou ou deixar a habilidade ativar; ou anuncie que não ativa nenhuma Habilidade Ofensiva.`),
      rl("3 · Dice altered?", `if you${teams() || missions() ? ", a teammate" : ""} or an opponent altered any of your dice at this point (for example with a card), you may announce a different Offensive Ability for the new result, or return to step 1 and use any re-rolls you have not used.`, "3 · Dados alterados?", `se você${teams() || missions() ? ", um parceiro" : ""} ou um oponente alterou algum dos seus dados neste ponto (por exemplo com uma carta), você pode anunciar outra Habilidade Ofensiva para o novo resultado, ou voltar ao passo 1 e usar as rolagens que ainda não usou.`),
      missions()
        ? rl("4 · Activate — in the Target & Resolve Phase", "you do NOT resolve anything yet. In round phase 4, in turn order, choose your target, then work out the ability's variable effects (some need extra rolls) and resolve ALL its effects — including those that need no target, such as gaining a Status Effect yourself or healing. A Melee Attack with no adjacent enemy resolves nothing at all.", "4 · Ative — na Fase de Alvo e Resolução", "você NÃO resolve nada ainda. Na fase 4 da rodada, em ordem de turno, escolha o alvo, depois determine os efeitos variáveis da habilidade (algumas pedem rolagens extras) e resolva TODOS os efeitos — inclusive os que não precisam de alvo, como você mesmo ganhar um Efeito de Status ou curar. Um Ataque Melee sem inimigo adjacente não resolve nada.")
        : rl("4 · Activate", "work out the ability's variable effects (some need extra rolls), then resolve the effects that need no target, such as gaining a Status Effect yourself or healing.", "4 · Ative", "determine os efeitos variáveis da habilidade (algumas pedem rolagens extras) e resolva os efeitos que não precisam de alvo, como você mesmo ganhar um Efeito de Status ou curar."),
      rl("One ability", "you activate at most one Offensive Ability per Offensive Roll Phase.", "Uma habilidade", "você ativa no máximo uma Habilidade Ofensiva por Fase de Rolagem Ofensiva."),
      rl("Cards", "any player may play Roll Phase Action cards after any of these steps.", "Cartas", "qualquer jogador pode jogar cartas de Ação de Fase de Rolagem depois de qualquer um destes passos."),
      rl("Tip", "a weak Attack against a powerful Defensive Ability is not always worth making.", "Dica", "um Ataque fraco contra uma Habilidade Defensiva poderosa nem sempre vale a pena.")
    ], ["c4", "c12"]);
  }

  function targetingCard() {
    if (duel()) {
      return infoCard(t("PHASE 5", "FASE 5"), t("Targeting Roll Phase — skipped", "Fase de Rolagem de Alvo — pulada"), [
        t("In a 1v1 game you have a single opponent, so skip this phase: your opponent is the target and the Defender.", "Num jogo 1v1 você tem um único oponente, então pule esta fase: o oponente é o alvo e o Defensor.")
      ], ["c4", "c13"]);
    }
    if (koth()) {
      return infoCard(t("PHASE 5", "FASE 5"), t("Targeting Phase — choose", "Fase de Alvo — escolha"), [
        t("With more than one opponent you must determine your target. In King of the Hill you simply choose an opponent to Attack; no die is rolled.", "Com mais de um oponente você precisa determinar o alvo. No Rei da Colina você simplesmente escolhe um oponente para Atacar; nenhum dado é rolado."),
        interpretation("skip this phase if you activated no Offensive Ability, or one whose effects need no target.", "pule esta fase se você não ativou nenhuma Habilidade Ofensiva, ou ativou uma cujos efeitos não precisam de alvo."),
        rl("Leader bonus", "if your Attack targets a Leader, draw 1 card immediately after choosing, before any other effect (see King of the Hill rules).", "Bônus do Líder", "se o seu Ataque mira um Líder, compre 1 carta logo depois de escolher, antes de qualquer outro efeito (veja Regras do Rei da Colina)."),
        rl("No damage", "you still choose a target when the ability deals no damage but has effects that must land on someone (for example inflicting a Status Effect).", "Sem dano", "você ainda escolhe um alvo quando a habilidade não causa dano mas tem efeitos que precisam cair em alguém (por exemplo infligir um Efeito de Status)."),
        rl("Cards", "any player may play Roll Phase Action cards.", "Cartas", "qualquer jogador pode jogar cartas de Ação de Fase de Rolagem.")
      ], ["c11", "c13"]);
    }
    return infoCard(t("PHASE 5", "FASE 5"), t("Targeting Roll Phase", "Fase de Rolagem de Alvo"), [
      interpretation("skip this phase if you activated no Offensive Ability, or one whose effects need no target.", "pule esta fase se você não ativou nenhuma Habilidade Ofensiva, ou ativou uma cujos efeitos não precisam de alvo."),
      rl("1 · Roll 1 die", "this die may be manipulated with cards — unless the Attack is an Ultimate Ability (it has already activated and only needs a target).", "1 · Role 1 dado", "este dado pode ser manipulado com cartas — a menos que o Ataque seja uma Habilidade Suprema (ela já ativou e só precisa de um alvo)."),
      rl("1 or 2", "target the opponent on your left.", "1 ou 2", "mire o oponente à sua esquerda."),
      rl("3 or 4", "target the opponent on your right.", "3 ou 4", "mire o oponente à sua direita."),
      rl("5", "your opponents choose which of them you target.", "5", "os seus oponentes escolhem qual deles você mira."),
      interpretation("on a 5 the opponents still name the target even when the Attack is an Ultimate: that is the die's result, not an action against the ability.", "com um 5 os oponentes ainda dizem quem é o alvo mesmo quando o Ataque é uma Suprema: é o resultado do dado, não uma ação contra a habilidade."),
      rl("6", "you choose either opponent.", "6", "você escolhe qualquer um dos dois oponentes."),
      rl("No damage", "you still roll for a target when the ability deals no damage but has effects that must land on someone (for example inflicting a Status Effect).", "Sem dano", "você ainda rola o alvo quando a habilidade não causa dano mas tem efeitos que precisam cair em alguém (por exemplo infligir um Efeito de Status)."),
      rl("Special targeting", "collateral damage names who receives it; it needs no targeting roll.", "Alvo especial", "o dano colateral diz quem o recebe; não precisa de rolagem de alvo."),
      rl("Cards", "any player may play Roll Phase Action cards.", "Cartas", "qualquer jogador pode jogar cartas de Ação de Fase de Rolagem.")
    ], ["c10", "c13"]);
  }

  function defensiveCard() {
    return infoCard(missions() ? t("WHEN ATTACKED", "QUANDO ATACADO") : t("PHASE 6", "FASE 6"), t("Defensive Roll Phase", "Fase de Rolagem Defensiva"), [
      missions()
        ? t("Heroes defend during the Enemy Roll Phase, against each defendable enemy Attack (adjacent, or with Range). The steps are the same as in a standard game:", "Os Heróis se defendem na Fase de Rolagem Inimiga, contra cada Ataque inimigo defensável (adjacente, ou com Range). Os passos são os de um jogo padrão:")
        : t("Happens when the Active Player's Offensive Roll Phase resulted in an Attack. The targeted player is the Defender.", "Acontece quando a Fase de Rolagem Ofensiva do Jogador Ativo resultou num Ataque. O jogador alvo é o Defensor."),
      missions() ? "" : interpretation("an ability that deals no damage but still affects a target (it only inflicts a Status Effect, say) is not an Attack: resolve step 1 on the target, skip the defense roll (steps 2–4), then do steps 5–6.", "uma habilidade que não causa dano mas ainda afeta um alvo (só inflige um Efeito de Status, por exemplo) não é um Ataque: resolva o passo 1 no alvo, pule a rolagem de defesa (passos 2–4) e faça os passos 5–6."),
      rl("1 · Targeted effects", "resolve the Offensive Ability's effects that need a target and are not damage — inflicting a Status Effect on the target, or anything else that depends on who the target is.", "1 · Efeitos com alvo", "resolva os efeitos da Habilidade Ofensiva que precisam de alvo e não são dano — infligir um Efeito de Status no alvo, ou qualquer outra coisa que dependa de quem é o alvo."),
      rl("2 · May defend?", "if the Attack's damage type is defendable, the Defender may activate their Defensive Ability (it is optional). A hero with two Defensive Abilities chooses one now, before rolling. If the damage is not defendable, skip to step 5.", "2 · Pode defender?", "se o tipo de dano do Ataque é defensável, o Defensor pode ativar a Habilidade Defensiva (é opcional). Um herói com duas Habilidades Defensivas escolhe uma agora, antes de rolar. Se o dano não é defensável, vá para o passo 5."),
      rl("3 · Roll once", "the Defender performs ONE Roll Attempt with the number of dice shown (“DEFENSE ROLL 3” = 3 dice). No re-rolls.", "3 · Role uma vez", "o Defensor faz UMA Tentativa de Rolagem com o número de dados indicado (“DEFENSE ROLL 3” = 3 dados). Sem rolar de novo."),
      rl("4 · Non-damage effects", "from that roll, the Defender resolves all non-damage effects (gain or inflict Status Effects, draw cards…).", "4 · Efeitos sem dano", "com essa rolagem, o Defensor resolve todos os efeitos que não são dano (ganhar ou infligir Efeitos de Status, comprar cartas…)."),
      rl("5 · Last chance", "any player may spend Status Effects or play cards one last time — except that, against an activated Ultimate Ability, opponents may do nothing at all.", "5 · Última chance", "qualquer jogador pode gastar Efeitos de Status ou jogar cartas pela última vez — exceto que, contra uma Habilidade Suprema ativada, os oponentes não podem fazer nada."),
      rl("6 · Apply", "all damage, prevention and healing are added up and applied simultaneously at the conclusion of the Roll Phase — including damage the Defensive Ability deals back to the attacker.", "6 · Aplique", "todo dano, prevenção e cura são somados e aplicados ao mesmo tempo ao fim da Fase de Rolagem — inclusive o dano que a Habilidade Defensiva devolve ao atacante."),
      rl("No Defensive Ability", "against undefendable, pure, collateral or Ultimate damage.", "Sem Habilidade Defensiva", "contra dano indefensável, puro, colateral ou Supremo."),
      missions() ? "" : rl("Draw", "if all remaining players drop to 0 Health in this simultaneous step, the game is a draw.", "Empate", "se todos os jogadores restantes caírem a 0 de Vida neste passo simultâneo, o jogo empata.")
    ], missions() ? ["c13", "m7"] : ["c5", "c13"]);
  }

  function endCards() {
    return [
      infoCard(missions() ? t("HERO PHASE PART 2", "FASE DOS HERÓIS · PARTE 2") : t("PHASE 7", "FASE 7"), t("Main Phase (2)", "Fase Principal (2)"), [
        t("Identical to Main Phase (1): sell cards, play Main Phase Action cards, play Hero Upgrades.", "Idêntica à Fase Principal (1): venda cartas, jogue cartas de Ação de Fase Principal, jogue Melhorias de Herói."),
        t("When an ability refers to “the conclusion of the Roll Phase”, that moment is just before Main Phase (2) begins.", "Quando uma habilidade fala no “fim da Fase de Rolagem”, esse momento é logo antes de a Fase Principal (2) começar."),
        missions() ? interpretation("in Missions, for a Hero that moment is when their own Offensive Ability has finished resolving in the Target & Resolve Phase (or when they declare that they activate none). An effect checked when you “conclude your Offensive Roll Phase” (such as Blind) is rolled when your turn comes in that phase, just before you would activate your ability.", "em Missões, para um Herói esse momento é quando a própria Habilidade Ofensiva termina de resolver na Fase de Alvo e Resolução (ou quando ele declara que não ativa nenhuma). Um efeito verificado quando você “conclui a Fase de Rolagem Ofensiva” (como Blind) é rolado quando chega a sua vez nessa fase, logo antes de você ativar a habilidade.") : ""
      ], ["c13", "c16"]),
      infoCard(missions() ? t("HERO PHASE PART 2", "FASE DOS HERÓIS · PARTE 2") : t("PHASE 8", "FASE 8"), t("Discard Phase", "Fase de Descarte"), [
        rl("1", "sell cards from your hand until you have 6 or fewer.", "1", "venda cartas da mão até ter 6 ou menos."),
        rl("2", "gain 1 CP for each card sold (expensive cards are not worth more).", "2", "ganhe 1 CP por carta vendida (cartas caras não valem mais)."),
        rl("3", "place the sold cards on your Discard Pile.", "3", "ponha as cartas vendidas na pilha de Descarte."),
        missions() ? interpretation("in Missions a Hero's turn ends when their Discard Phase is done: effects that last “until the conclusion of your turn” (Hex, Silence) are removed then.", "em Missões o turno de um Herói termina quando a Fase de Descarte dele acaba: efeitos que duram “até o fim do seu turno” (Hex, Silence) são removidos nesse momento.") : t("Then the next player's turn begins with their Upkeep Phase.", "Depois começa o turno do próximo jogador, pela Fase de Manutenção dele.")
      ], ["c4", "c7", "c13"])
    ];
  }

  function turnSection() {
    if (missions()) {
      return `
        ${sectionHeading("turn", t("Your hero turn inside a round", "Seu turno de herói dentro da rodada"), ["m6", "c4", "c12", "c13"])}
        <p class="glossary-intro">${t(
          "In Missions every Hero still plays a normal Dice Throne turn each round, but it is split in two and played at the same time as the other Heroes. There is no Targeting Roll Phase: targets are chosen in the Target & Resolve Phase.",
          "Em Missões cada Herói ainda joga um turno normal de Dice Throne por rodada, mas ele é dividido em dois e jogado ao mesmo tempo que os outros Heróis. Não há Fase de Rolagem de Alvo: os alvos são escolhidos na Fase de Alvo e Resolução."
        )}</p>
        <h3 class="subhead">${t("Hero Phase Part 1 (round phase 3)", "Fase dos Heróis, Parte 1 (fase 3 da rodada)")}</h3>
        ${grid([upkeepCard(), incomeCard(), mainCard(), offensiveCard()])}
        <h3 class="subhead">${t("Hero Phase Part 2 (round phase 5) and defending", "Fase dos Heróis, Parte 2 (fase 5 da rodada) e defesa")}</h3>
        ${grid([...endCards(), defensiveCard()])}`;
    }
    return `
      ${sectionHeading("turn", t("Turn phases", "Fases do turno"), ["c4", "c12", "c13"])}
      <p class="glossary-intro">${t(
        `Beginning with the Start Player, players take turns as the Active Player${koth() ? ", clockwise" : teams() ? ", zigzagging between the teams" : ""}. Each turn goes through these phases in order.`,
        `Começando pelo Jogador Inicial, os jogadores se revezam como Jogador Ativo${koth() ? ", em sentido horário" : teams() ? ", em zigue-zague entre os times" : ""}. Cada turno passa por estas fases, em ordem.`
      )}</p>
      ${grid([upkeepCard(), incomeCard(), mainCard(), offensiveCard(), targetingCard(), defensiveCard(), ...endCards()])}`;
  }

  // ---------- mode rules (core p. 11) ----------

  function modeSection() {
    if (koth()) {
      return `
        ${sectionHeading("mode", t("King of the Hill rules", "Regras do Rei da Colina"), ["c11", "c13"])}
        ${grid([
          infoCard(t("3 PLAYERS", "3 JOGADORES"), t("What changes", "O que muda"), [
            t("Each player begins the game with 35 Health.", "Cada jogador começa com 35 de Vida."),
            t("Roll to determine the Start Player; players take turns in clockwise order.", "Rolem para definir o Jogador Inicial; os turnos seguem em sentido horário."),
            t("When Attacking, you may target any player you want.", "Ao Atacar, você pode mirar o jogador que quiser."),
            t("Everything else follows the standard rules.", "Todo o resto segue as regras padrão.")
          ], ["c11"]),
          infoCard(t("THE LEADER", "O LÍDER"), t("Bonus card for attacking the top", "Carta bônus por atacar quem está na frente"), [
            rl("Leader(s)", "the player or players with the most Health remaining.", "Líder(es)", "o jogador ou os jogadores com mais Vida restante."),
            rl("Bonus", "if you target a Leader with an Attack, draw 1 card from your deck. The draw happens immediately after choosing your target, before any other effects.", "Bônus", "se você mira um Líder com um Ataque, compre 1 carta do seu baralho. A compra acontece logo depois de escolher o alvo, antes de qualquer outro efeito."),
            rl("Tied with you", "if you Attack an opponent tied with you for the lead (both at 30 Health, say), you still draw the bonus card.", "Empatado com você", "se você Ataca um oponente empatado com você na liderança (os dois com 30 de Vida, por exemplo), ainda compra a carta bônus."),
            rl("Sole Leader", "if you alone have the most Health, you cannot earn a bonus card.", "Líder único", "se só você tem mais Vida, não pode ganhar a carta bônus."),
            rl("Attack only", "the bonus needs an Attack: an Offensive Ability that deals at least 1 dmg to a targeted opponent (not collateral).", "Só com Ataque", "o bônus exige um Ataque: uma Habilidade Ofensiva que cause ao menos 1 de dano a um oponente alvo (não colateral).")
          ], ["c11", "c16"]),
          infoCard(t("TIMING", "PRIORIDADE"), t("More than two players", "Mais de dois jogadores"), [
            t("When several players want to act at once, the player whose turn it is has first priority, followed by the other players in turn order.", "Quando vários jogadores querem agir ao mesmo tempo, o jogador da vez tem a primeira prioridade, seguido pelos outros em ordem de turno."),
            t("After all interruptions are complete, the previous order of play continues normally.", "Depois de todas as interrupções, a ordem normal de jogo continua.")
          ], ["c15"])
        ])}`;
    }
    return `
      ${sectionHeading("mode", t("2v2 team rules", "Regras do jogo em times 2v2"), ["c11", "c13"])}
      ${grid([
        infoCard(t("4 PLAYERS", "4 JOGADORES"), t("Teams of two", "Times de dois"), [
          t("The game is played in teams of two. Teammates sit next to each other and are encouraged to view each other's hands and strategize.", "O jogo é em times de dois. Parceiros sentam lado a lado e são incentivados a ver a mão um do outro e combinar estratégias."),
          t("Roll to determine the Start Player; the Start Player skips the Income Phase of their first turn.", "Rolem para definir o Jogador Inicial; ele pula a Fase de Renda do primeiro turno."),
          t("Turn order alternates between the teams in a zigzag pattern: 1 → 2 (other team) → 3 (teammate of 1) → 4 (teammate of 2).", "A ordem dos turnos alterna entre os times em zigue-zague: 1 → 2 (outro time) → 3 (parceiro do 1) → 4 (parceiro do 2).")
        ], ["c11"]),
        infoCard(t("SHARED HEALTH", "VIDA COMPARTILHADA"), t("One dial per team", "Um mostrador por time"), [
          t("Teammates share one Health Dial beginning at 50 Health.", "Parceiros dividem um mostrador de Vida começando em 50."),
          t("When one teammate receives damage, reduce the shared dial by that amount.", "Quando um parceiro recebe dano, reduza o mostrador compartilhado nesse valor."),
          t("If both teammates take damage at the same time, reduce it by the combined total — this includes collateral damage dealt to both.", "Se os dois parceiros recebem dano ao mesmo tempo, reduza pelo total combinado — isso inclui dano colateral causado aos dois."),
          interpretation("healing by either teammate raises the shared dial, up to 60.", "a cura de qualquer um dos parceiros aumenta o mostrador compartilhado, até 60.")
        ], ["c10", "c11"]),
        infoCard(t("OWN CP", "CP PRÓPRIO"), t("What you may do for a teammate", "O que você pode fazer pelo parceiro"), [
          t("Each teammate keeps an individual CP Dial; your CP may only be spent on your own cards and abilities.", "Cada parceiro mantém um mostrador de CP individual; os seus CP só podem ser gastos nas suas cartas e habilidades."),
          t("You cannot intervene to reduce your teammate's incoming damage unless a card or Status Effect says so — for example a card that refers to “a chosen player” can be played on a teammate.", "Você não pode intervir para reduzir o dano que o parceiro vai receber, a menos que uma carta ou Efeito de Status diga — por exemplo, uma carta que fala em “a chosen player” (um jogador escolhido) pode ser jogada num parceiro."),
          t("You may alter dice to stop a teammate from taking damage in the first place, or to improve their dice outcome.", "Você pode alterar dados para impedir que o parceiro leve dano ou para melhorar o resultado dos dados dele.")
        ], ["c11"]),
        infoCard(t("WHO DEFENDS", "QUEM DEFENDE"), t("Targeting roll", "Rolagem de alvo"), [
          t("After activating an Offensive Ability, roll 1 die to find the Defender: 1–2 the opponent on your left, 3–4 the opponent on your right, 5 your opponents choose, 6 you choose.", "Depois de ativar uma Habilidade Ofensiva, role 1 dado para achar o Defensor: 1–2 o oponente à sua esquerda, 3–4 o oponente à sua direita, 5 os oponentes escolhem, 6 você escolhe."),
          t("Only the Defender rolls a Defensive Ability, but the damage lowers their team's shared dial. Damage that the Defensive Ability deals back to the attacker lowers the attacker's team dial.", "Só o Defensor rola a Habilidade Defensiva, mas o dano reduz o mostrador compartilhado do time dele. O dano que a Habilidade Defensiva devolve ao atacante reduz o mostrador do time do atacante."),
          t("Priority when several players act at once: the player whose turn it is first, then the others in turn order.", "Prioridade quando vários agem ao mesmo tempo: primeiro o jogador da vez, depois os outros em ordem de turno.")
        ], ["c13", "c15"])
      ])}
      ${artRow(figure("team-order", t("Core p. 11: 2v2 seating and the zigzag turn order", "Básico p. 11: lugares e a ordem de turnos em zigue-zague do 2v2")))}`;
  }

  // ---------- hero board & leaflet (core p. 5–6) ----------

  function boardSection() {
    return `
      ${sectionHeading("board", t("Your Hero Board & Hero Leaflet", "Seu Tabuleiro e Folheto do Herói"), ["c5", "c6"])}
      <p class="glossary-intro">${t(
        "Every hero is different: the abilities, their dice requirements and their effects are printed on the Hero Board; the hero's Status Effects, Companions and special clarifications are on the Hero Leaflet. This guide explains how to read them, not what each hero does.",
        "Cada herói é diferente: as habilidades, os requisitos de dados e os efeitos estão impressos no Tabuleiro do Herói; os Efeitos de Status, Companheiros e esclarecimentos especiais do herói estão no Folheto do Herói. Este guia explica como lê-los, não o que cada herói faz."
      )}</p>
      ${artRow(figure("hero-board", t("Core p. 5: a Hero Board (Black Panther) with callouts — A Offensive Ability, B Activation Requirement, C Small Straight, D Large Straight, E Passive, F Ultimate, G description, H Defensive Ability, I defensive dice", "Básico p. 5: um Tabuleiro do Herói (Pantera Negra) com marcações — A Habilidade Ofensiva, B Requisito de Ativação, C Sequência Pequena, D Sequência Grande, E Passiva, F Suprema, G descrição, H Habilidade Defensiva, I dados defensivos"), true))}
      ${grid([
        infoCard(t("ON THE BOARD", "NO TABULEIRO"), t("Offensive Ability", "Habilidade Ofensiva"), [
          missions() ? t("May be activated once your Roll Attempts are done — in Missions, when your turn comes in the Target & Resolve Phase.", "Pode ser ativada depois das suas Tentativas de Rolagem — em Missões, quando chega a sua vez na Fase de Alvo e Resolução.") : t("May be activated at the end of your Offensive Roll Phase.", "Pode ser ativada ao fim da sua Fase de Rolagem Ofensiva."),
          t("You may only activate a single ability as the result of your Offensive Roll Phase.", "Você só ativa uma única habilidade como resultado da Fase de Rolagem Ofensiva."),
          rl("Activation Requirement", "the Final Dice Result needed, usually a specific set of dice symbols pictured above the text.", "Requisito de Ativação", "o Resultado Final dos Dados necessário, em geral um conjunto específico de símbolos de dados ilustrado acima do texto."),
          rl("Ability description", "the effects resolved when it activates. When the description has you roll dice, that one roll may be used by several of its effects.", "Descrição da habilidade", "os efeitos resolvidos quando ela ativa. Quando a descrição manda rolar dados, essa única rolagem pode servir a vários dos efeitos dela.")
        ], ["c5"]),
        infoCard(t("ON THE BOARD", "NO TABULEIRO"), t("Straights", "Sequências"), [
          rl("Small Straight", "any 4 sequential numbers among your dice (1-2-3-4, 2-3-4-5 or 3-4-5-6); pictured as 4 escalating dice.", "Sequência Pequena (Small Straight)", "4 números em sequência entre os seus dados (1-2-3-4, 2-3-4-5 ou 3-4-5-6); ilustrada como 4 dados em escada."),
          rl("Large Straight", "any 5 sequential numbers (1-2-3-4-5 or 2-3-4-5-6); pictured as 5 escalating dice.", "Sequência Grande (Large Straight)", "5 números em sequência (1-2-3-4-5 ou 2-3-4-5-6); ilustrada como 5 dados em escada."),
          rl("N-of-a-kind", "the same NUMBER (not symbol) showing on 2, 3, 4 or 5 dice.", "N iguais (N-of-a-kind)", "o mesmo NÚMERO (não o símbolo) em 2, 3, 4 ou 5 dados."),
          t("Straights and N-of-a-kind use the numbers in the corner of each die face; other requirements use the symbols.", "Sequências e N iguais usam os números no canto de cada face; os outros requisitos usam os símbolos.")
        ], ["c5", "c16"]),
        infoCard(t("ON THE BOARD", "NO TABULEIRO"), t("Defensive Ability and defensive dice", "Habilidade Defensiva e dados defensivos"), [
          t("Activated when you are Attacked by an opponent.", "Ativada quando você é Atacado por um oponente."),
          t("If you have more than one Defensive Ability, choose one before rolling.", "Se tiver mais de uma Habilidade Defensiva, escolha uma antes de rolar."),
          t("“DEFENSE ROLL #” is the number of dice you roll; they are rolled a single time.", "“DEFENSE ROLL #” é o número de dados que você rola; eles são rolados uma única vez."),
          t("Not activated when the incoming damage is undefendable, pure, collateral or comes from an opponent's Ultimate Ability.", "Não é ativada quando o dano é indefensável, puro, colateral ou vem da Habilidade Suprema de um oponente.")
        ], ["c5"]),
        infoCard(t("ON THE BOARD", "NO TABULEIRO"), t("Passive and Ultimate", "Passiva e Suprema"), [
          rl("Passive Ability", "always active and / or available for use.", "Habilidade Passiva", "sempre ativa e / ou disponível para uso."),
          rl("Ultimate Ability", "your hero's most powerful attack. Once activated, its damage and effects can be enhanced but cannot be reduced, prevented, avoided, responded to or interrupted by anything — cards, Status Effects, Companions.", "Habilidade Suprema (Ultimate)", "o ataque mais poderoso do herói. Uma vez ativada, o dano e os efeitos podem ser aumentados, mas não reduzidos, prevenidos, evitados, respondidos ou interrompidos por nada — cartas, Efeitos de Status, Companheiros."),
          t("Opponents may take no action of any kind from the moment it activates until the conclusion of the Roll Phase.", "Os oponentes não podem fazer ação alguma desde a ativação até o fim da Fase de Rolagem."),
          t("The only way to stop an Ultimate is to alter a die roll BEFORE it activates.", "A única forma de impedir uma Suprema é alterar uma rolagem ANTES de ela ativar.")
        ], ["c5", "c16"]),
        infoCard(t("ON THE LEAFLET", "NO FOLHETO"), t("Hero Leaflet", "Folheto do Herói"), [
          rl("Front", "the rules of your hero's Status Effects and Companions, each with its type and Stack Limit, and the dice key (which symbol is on each numbered face).", "Frente", "as regras dos Efeitos de Status e Companheiros do herói, cada um com tipo e Limite de Pilha, e a legenda dos dados (qual símbolo está em cada face numerada)."),
          rl("Back", "rules clarifications for this hero, the complexity rating (1 to 6: how hard the hero is to play well) and the list of components.", "Verso", "esclarecimentos de regras do herói, a classificação de complexidade (1 a 6: o quanto o herói é difícil de jogar bem) e a lista de componentes."),
          rl("Unique setup", "if the hero needs it, the steps are on the leaflet.", "Preparação própria", "se o herói precisar, os passos estão no folheto.")
        ], ["c6", "c3"])
      ])}
      ${artRow(figure("leaflet", t("Core p. 6: the front of a Hero Leaflet (Black Widow) — Status Effects with their Stack Limits and, at the lower right, the dice key", "Básico p. 6: a frente de um Folheto do Herói (Viúva Negra) — Efeitos de Status com os Limites de Pilha e, embaixo à direita, a legenda dos dados")))}`;
  }

  // ---------- cards (core p. 7–9) ----------

  function cardsSection() {
    return `
      ${sectionHeading("cards", t("Hero cards", "Cartas do herói"), ["c7", "c8", "c9"])}
      ${grid([
        infoCard(t("BASICS", "BÁSICO"), t("Two types of cards", "Dois tipos de cartas"), [
          t("Hero Upgrade cards and Action cards. The symbol on the left side of a card shows when it may be played, and the number beside it is its CP cost.", "Cartas de Melhoria de Herói e cartas de Ação. O símbolo no lado esquerdo da carta mostra quando ela pode ser jogada, e o número ao lado é o custo em CP."),
          rl("Cost", "playing a card costs Combat Points; cards costing 0 CP are free.", "Custo", "jogar uma carta custa Pontos de Combate; cartas de 0 CP são grátis."),
          rl("Drawing", "you draw 1 card in your Income Phase. If you must draw and your deck is empty, shuffle your Discard Pile into a new deck first.", "Compra", "você compra 1 carta na Fase de Renda. Se precisar comprar e o baralho acabou, antes embaralhe a pilha de Descarte num novo baralho."),
          rl("Hand limit", "you must end your Discard Phase with no more than 6 cards; sell down to 6.", "Limite de mão", "você precisa terminar a Fase de Descarte com no máximo 6 cartas; venda até ficar com 6."),
          rl("Selling", "discard a card and gain 1 CP — always 1, whatever its cost. In your Main Phases you may sell as many cards as you like; in the Discard Phase you sell the cards above the 6-card limit.", "Venda", "descarte uma carta e ganhe 1 CP — sempre 1, qualquer que seja o custo. Nas Fases Principais você pode vender quantas cartas quiser; na Fase de Descarte você vende as cartas acima do limite de 6.")
        ], ["c7", "c16"]),
        infoCard(t("ARROW ICON", "ÍCONE DE SETA"), t("Hero Upgrade cards", "Cartas de Melhoria de Herói"), [
          t("They permanently upgrade the space with the same name on your Hero Board.", "Melhoram permanentemente o espaço com o mesmo nome no Tabuleiro do Herói."),
          rl("Borders", "white = Offensive Ability upgrade, green = Defensive Ability upgrade, purple = Passive Ability upgrade.", "Bordas", "branca = melhoria de Habilidade Ofensiva, verde = de Habilidade Defensiva, roxa = de Habilidade Passiva."),
          rl("When", "only during your Main Phase (1) or Main Phase (2).", "Quando", "só na sua Fase Principal (1) ou (2)."),
          rl("To play", "spend the CP on the left of the card and place the card onto the board space with the same name.", "Para jogar", "gaste os CP à esquerda da carta e coloque-a no espaço do tabuleiro com o mesmo nome."),
          rl("No resale", "an upgrade may not be sold after it has been played.", "Sem revenda", "uma melhoria não pode ser vendida depois de jogada."),
          rl("Levels", "the ability printed on the board is the base level; upgrade cards are marked II or III and cover it. You may go straight to level III. If the ability already has level II, play III on top of it and pay only the difference in CP cost.", "Níveis", "a habilidade impressa no tabuleiro é o nível básico; as cartas de melhoria são marcadas II ou III e a cobrem. Você pode ir direto ao nível III. Se a habilidade já tem o nível II, jogue o III por cima e pague só a diferença de custo em CP.")
        ], ["c8"]),
        infoCard(t("STAR ICON", "ÍCONE DE ESTRELA"), t("Action cards", "Cartas de Ação"), [
          t("Single-use cards that give a benefit. When they may be played depends on their colour.", "Cartas de uso único que dão um benefício. Quando podem ser jogadas depende da cor."),
          rl("To play", "1) spend the CP shown on the left; 2) perform the action; then place the card on your Discard Pile.", "Para jogar", "1) gaste os CP indicados à esquerda; 2) execute a ação; depois ponha a carta na pilha de Descarte."),
          rl("Main Phase Action (blue border, M icon)", "only on your own turn, during Main Phase (1) or (2).", "Ação de Fase Principal (borda azul, ícone M)", "só no seu turno, na Fase Principal (1) ou (2)."),
          missions()
            ? rl("Roll Phase Action (orange border, die icon)", "only during a roll, but any player's: a Hero's Offensive Roll, a Hero's Defense Roll or the Enemy Roll Phase (this is how Heroes alter the Enemy Dice). The Targeting Roll Phase printed on the cards is not used in Missions.", "Ação de Fase de Rolagem (borda laranja, ícone de dado)", "só durante uma rolagem, mas de qualquer jogador: a Rolagem Ofensiva de um Herói, a Rolagem de Defesa de um Herói ou a Fase de Rolagem Inimiga (é assim que os Heróis alteram os Dados Inimigos). A Fase de Rolagem de Alvo citada nas cartas não é usada em Missões.")
            : rl("Roll Phase Action (orange border, die icon)", "only during an Offensive, Defensive or Targeting Roll Phase — but on any player's turn.", "Ação de Fase de Rolagem (borda laranja, ícone de dado)", "só numa Fase de Rolagem Ofensiva, Defensiva ou de Alvo — mas no turno de qualquer jogador."),
          rl("Instant Action (red border, ! icon)", "at any time, during any player's turn.", "Ação Instantânea (borda vermelha, ícone !)", "a qualquer momento, no turno de qualquer jogador.")
        ], ["c8", "c9"]),
        infoCard(t("INTERRUPTS", "INTERRUPÇÕES"), t("What can interrupt what", "O que interrompe o quê"), [
          t("Instant Action cards may interrupt actions or abilities and resolve immediately; the interrupted action or ability completes afterwards.", "Cartas de Ação Instantânea podem interromper ações ou habilidades e resolvem na hora; a ação ou habilidade interrompida termina depois."),
          t("Instant Action cards cannot themselves be interrupted.", "Cartas de Ação Instantânea não podem ser interrompidas."),
          t("Instant and Roll Phase Action cards can interrupt normal play, but not a spent Status Effect and not another Instant / Roll Phase Action card.", "Cartas Instantâneas e de Fase de Rolagem podem interromper o jogo normal, mas não um Efeito de Status gasto nem outra carta Instantânea / de Fase de Rolagem."),
          t("Nothing interrupts an Ultimate Ability once it has activated.", "Nada interrompe uma Habilidade Suprema depois de ativada."),
          t("Who goes first when two players act at once: see Damage math & timing.", "Quem age primeiro quando dois jogadores agem ao mesmo tempo: veja Cálculo de dano e prioridade.")
        ], ["c8", "c15", "c16"]),
        infoCard(t("CARD TEXT", "TEXTO DAS CARTAS"), t("Read the card", "Leia a carta"), [
          onBoard("each card prints its own name, cost and effect. Hero decks differ, and this guide does not list card texts.", "cada carta traz o próprio nome, custo e efeito. Os baralhos dos heróis são diferentes, e este guia não lista os textos das cartas."),
          t("A card that affects “a chosen player” may be played on yourself, an opponent or a teammate.", "Uma carta que afeta “a chosen player” (um jogador escolhido) pode ser jogada em você, num oponente ou num parceiro."),
          t("“Attack Modifier” printed on a card: see Damage types.", "“Attack Modifier” impresso numa carta: veja Tipos de dano.")
        ], ["c7", "c10", "c11"])
      ])}
      ${artRow(
        figure("card-types", t("Core p. 7: the four card kinds — Hero Upgrade (arrow), Main Phase Action (blue, M), Roll Phase Action (orange, die) and Instant Action (red, !); J marks the phase symbol", "Básico p. 7: os quatro tipos de carta — Melhoria de Herói (seta), Ação de Fase Principal (azul, M), Ação de Fase de Rolagem (laranja, dado) e Ação Instantânea (vermelha, !); J marca o símbolo de fase")),
        figure("upgrade-cards", t("Core p. 8: Hero Upgrade borders — A white (Offensive), B green (Defensive), C purple (Passive)", "Básico p. 8: bordas das Melhorias de Herói — A branca (Ofensiva), B verde (Defensiva), C roxa (Passiva)"))
      )}`;
  }

  // ---------- status effects (core p. 6–7, missions p. 7, 9, 12) ----------

  const MISSION_STATUS = [
    { id: "barbed-vine", name: "Barbed Vine", type: "neg", stack: 1, en: ["Receive 1 dmg for each Roll Attempt beyond the first during your Offensive Roll Phase, up to 2 dmg per turn.", "The token is removed, then this dmg is applied at the conclusion of the Roll Phase."], pt: ["Receba 1 de dano por Tentativa de Rolagem além da primeira na sua Fase de Rolagem Ofensiva, até 2 de dano por turno.", "O marcador é removido e então esse dano é aplicado ao fim da Fase de Rolagem."] },
    { id: "bleed", name: "Bleed", type: "neg", stack: 2, en: ["Roll 1 die during your Upkeep Phase.", "On 1–4 you are dealt 1 dmg; on 5–6 remove this token."], pt: ["Role 1 dado na sua Fase de Manutenção.", "Com 1–4 você recebe 1 de dano; com 5–6 remova este marcador."] },
    { id: "blind", name: "Blind", type: "neg", stack: 1, en: ["The next time you conclude your Offensive Roll Phase, remove it and roll 1 die.", "On 1–2 your Offensive Roll Phase fails and has no effect of any kind."], pt: ["Na próxima vez que concluir a sua Fase de Rolagem Ofensiva, remova-o e role 1 dado.", "Com 1–2 a sua Fase de Rolagem Ofensiva falha e não tem efeito algum."] },
    { id: "bonus-damage", name: "Bonus Damage", type: "pos", stack: 2, en: ["Spend during your Offensive Roll Phase: each token adds the damage printed on it (+1 or +2) to your Attack. Attack Modifier.", "Gaining one at Stack Limit: replace a previous token or discard the new one."], pt: ["Gaste na sua Fase de Rolagem Ofensiva: cada marcador soma ao seu Ataque o dano impresso nele (+1 ou +2). Modificador de Ataque.", "Ganhar um no Limite de Pilha: substitua um marcador anterior ou descarte o novo."], enemy: ["Unless stated otherwise, Henchmen and Bosses spend all their Bonus Damage tokens when their Attack activates; the bonus only applies to the FIRST Hero targeted by a Multi-Strike Attack.", "Salvo indicação contrária, Capangas e Chefes gastam todos os marcadores Bonus Damage quando o Ataque ativa; o bônus só vale para o PRIMEIRO Herói alvo de um Ataque Multi-Strike."] },
    { id: "burn", name: "Burn", type: "neg", stack: 1, persistent: true, en: ["You are dealt 2 dmg during your Upkeep Phase."], pt: ["Você recebe 2 de dano na sua Fase de Manutenção."] },
    { id: "chaos", name: "Chaos", type: "pos", stack: 6, en: ["Gained by various Henchmen and Bosses; the enemy's abilities say how the tokens are used.", "No effect on Heroes."], pt: ["Ganho por vários Capangas e Chefes; as habilidades do inimigo dizem como os marcadores são usados.", "Sem efeito nos Heróis."] },
    { id: "concussion", name: "Concussion", type: "neg", stack: 1, en: ["Skip your Income Phase, then remove this token."], pt: ["Pule a sua Fase de Renda e remova este marcador."] },
    { id: "disruption", name: "Disruption", type: "neg", stack: 1, en: ["During your Upkeep Phase you may choose to lose 1 CP.", "If you do not (or cannot), you receive 2 dmg instead. Then remove this token."], pt: ["Na sua Fase de Manutenção você pode escolher perder 1 CP.", "Se não o fizer (ou não puder), recebe 2 de dano. Depois remova este marcador."], enemy: ["Henchmen and Bosses are immune: they are considered to have infinite CP.", "Capangas e Chefes são imunes: considera-se que têm CP infinitos."] },
    { id: "dominance", name: "Dominance", type: "unique", stack: 1, en: ["When you Attack, roll 1 die.", "On 1: you must choose a teammate to target instead; if you cannot, discard 1 card at random. Then remove this token.", "On 2–5: nothing. On 6: remove this token.", "May not be transferred by any means (but can be removed)."], pt: ["Quando você Ataca, role 1 dado.", "Com 1: você deve escolher um parceiro como alvo; se não puder, descarte 1 carta ao acaso. Depois remova este marcador.", "Com 2–5: nada. Com 6: remova este marcador.", "Não pode ser transferido de forma alguma (mas pode ser removido)."] },
    { id: "entangle", name: "Entangle", type: "neg", stack: 1, en: ["You get 1 fewer Roll Attempt during your next Offensive Roll Phase.", "At the conclusion of the Roll Phase, remove this token."], pt: ["Você tem 1 Tentativa de Rolagem a menos na sua próxima Fase de Rolagem Ofensiva.", "Ao fim da Fase de Rolagem, remova este marcador."], enemy: ["No effect on enemies: their number of Roll Attempts cannot be changed.", "Sem efeito em inimigos: o número de Tentativas de Rolagem deles não pode ser mudado."] },
    { id: "evasive", name: "Evasive", type: "pos", stack: 3, en: ["When you receive damage you may spend it and roll 1 die.", "On 1–2 no dmg is received (other associated effects may still apply).", "Several tokens may be spent to try to prevent the same source of damage."], pt: ["Quando você recebe dano, pode gastá-lo e rolar 1 dado.", "Com 1–2 nenhum dano é recebido (outros efeitos associados ainda podem valer).", "Vários marcadores podem ser gastos para tentar prevenir a mesma fonte de dano."], enemy: ["Henchmen and Bosses spend all the Evasive tokens needed to prevent a source dealing 4 or more dmg, or lethal dmg.", "Capangas e Chefes gastam todos os Evasive necessários para prevenir uma fonte que cause 4 ou mais de dano, ou dano letal."] },
    { id: "flight", name: "Flight", type: "pos", stack: 3, en: ["Spend at any time during the Roll Phase, then roll 2 dice: if a 6 was rolled, the token activates.", "Activated in your Offensive Roll Phase: your Attack becomes undefendable.", "Activated in your Defensive Roll Phase: ignore all incoming damage."], pt: ["Gaste a qualquer momento da Fase de Rolagem e role 2 dados: se saiu um 6, o marcador ativa.", "Ativado na sua Fase de Rolagem Ofensiva: o seu Ataque se torna indefensável.", "Ativado na sua Fase de Rolagem Defensiva: ignore todo o dano recebido."], enemy: ["Henchmen and Bosses spend 1 Flight when they successfully activate a defendable Attack (only affecting the first Attacked Hero), and spend all the Flight needed in their Defensive Roll Phase to prevent a source dealing 4 or more dmg, or lethal dmg.", "Capangas e Chefes gastam 1 Flight quando ativam com sucesso um Ataque defensável (afetando só o primeiro Herói Atacado) e gastam todos os Flight necessários na Fase de Rolagem Defensiva deles para prevenir uma fonte que cause 4 ou mais de dano, ou dano letal."] },
    { id: "focus-fire", name: "Focus Fire", type: "neg", stack: 2, persistent: true, en: ["When you are Attacked by an opponent, the Attacker increases their damage by 1. Attack Modifier."], pt: ["Quando você é Atacado por um oponente, o Atacante aumenta o dano em 1. Modificador de Ataque."] },
    { id: "hex", name: "Hex", type: "unique", stack: 1, en: ["Whenever you roll a 6, treat that die as a blank face with no value.", "At the conclusion of your turn, remove this token.", "May not be transferred by any means (but can be removed)."], pt: ["Sempre que você rolar um 6, trate esse dado como uma face em branco, sem valor.", "Ao fim do seu turno, remova este marcador.", "Não pode ser transferido de forma alguma (mas pode ser removido)."] },
    { id: "knockdown", name: "Knockdown", type: "neg", stack: 1, en: ["To remove it, spend 2 CP before the start of your Offensive Roll Phase.", "If you do not, skip your Offensive Roll Phase and then remove this token."], pt: ["Para removê-lo, gaste 2 CP antes do início da sua Fase de Rolagem Ofensiva.", "Se não gastar, pule a sua Fase de Rolagem Ofensiva e então remova este marcador."], enemy: ["Henchmen and Bosses are immune: they are considered to have infinite CP.", "Capangas e Chefes são imunes: considera-se que têm CP infinitos."] },
    { id: "oppression", name: "Oppression", type: "unique", stack: 4, persistent: true, en: ["When you are Attacked by an opponent, the Attacker increases their damage by 1 per Oppression on you. Attack Modifier.", "Cannot be removed or transferred by any means.", "A single token shows the quantity: its value is how many Oppression you have."], pt: ["Quando você é Atacado por um oponente, o Atacante aumenta o dano em 1 por Oppression em você. Modificador de Ataque.", "Não pode ser removido nem transferido de forma alguma.", "Um único marcador mostra a quantidade: o valor dele é quantas Oppression você tem."] },
    { id: "paralyze", name: "Paralyze", type: "neg", stack: 1, en: ["You cannot gain or inflict any status effects associated with any of your Offensive Abilities (nor choose Momentum instead of inflicting one). All other effects of the ability still apply.", "When you conclude your Roll Phase, remove it."], pt: ["Você não pode ganhar nem infligir efeitos de status associados a nenhuma das suas Habilidades Ofensivas (nem escolher Momentum em vez de infligir um). Todos os outros efeitos da habilidade ainda valem.", "Quando concluir a sua Fase de Rolagem, remova-o."] },
    { id: "poison", name: "Poison", type: "neg", stack: 3, persistent: true, en: ["You are dealt 1 dmg per Poison token during your Upkeep Phase."], pt: ["Você recebe 1 de dano por marcador Poison na sua Fase de Manutenção."] },
    { id: "shield", name: "Shield", type: "pos", stack: 5, en: ["During the Defensive Roll Phase, spend 1 or more to prevent 3 dmg per token spent.", "Only against defendable damage — but not restricted by Range rules, unlike Defense Rolls."], pt: ["Na Fase de Rolagem Defensiva, gaste 1 ou mais para prevenir 3 de dano por marcador gasto.", "Só contra dano defensável — mas sem a restrição de Range das Rolagens de Defesa."], enemy: ["Every enemy with Shield — a Boss only after its Boss Defense has been used — spends the tokens needed to prevent as much as possible of the damage of a defendable Attack. If it has other Positive Status Effect tokens that could fully prevent the dmg, it uses those before Shield.", "Todo inimigo com Shield — um Chefe só depois de usar a Boss Defense — gasta os marcadores necessários para prevenir o máximo possível do dano de um Ataque defensável. Se tiver outros marcadores de Efeito de Status Positivo capazes de prevenir todo o dano, usa esses antes do Shield."] },
    { id: "silence", name: "Silence", type: "unique", stack: 1, en: ["You may not activate any of your Small Straight or Large Straight abilities (other “Straights” are not affected).", "At the conclusion of your turn, remove this token."], pt: ["Você não pode ativar nenhuma das suas habilidades de Sequência Pequena ou Grande (outras “Sequências” não são afetadas).", "Ao fim do seu turno, remova este marcador."] },
    { id: "targeted", name: "Targeted", type: "neg", stack: 1, persistent: true, en: ["When you are Attacked by an opponent, the Attacker increases their damage by 2. Attack Modifier."], pt: ["Quando você é Atacado por um oponente, o Atacante aumenta o dano em 2. Modificador de Ataque."] },
    { id: "wither", name: "Wither", type: "neg", stack: 2, persistent: true, en: ["If you would deal damage as a result of your Attack, reduce that dmg by 1 per Wither token. Attack Modifier."], pt: ["Se você fosse causar dano como resultado do seu Ataque, reduza esse dano em 1 por marcador Wither. Modificador de Ataque."] }
  ];

  function statusTypeName(type) {
    return {
      pos: t("Positive Status Effect", "Efeito de Status Positivo"),
      neg: t("Negative Status Effect", "Efeito de Status Negativo"),
      unique: t("Unique Status Effect", "Efeito de Status Único")
    }[type];
  }

  function missionStatusCards() {
    return `<div class="mdt-token-grid">${MISSION_STATUS.map((status) => `
      <article class="mdt-token">
        <img src="${ICONS}status-${status.id}.webp" alt="${t(`${status.name} token`, `Marcador ${status.name}`)}" loading="lazy">
        <div>
          <h3>${status.name}</h3>
          <p class="mdt-token-meta">${statusTypeName(status.type)} · ${t("Stack Limit", "Limite de Pilha")}: ${status.stack}${status.persistent ? ` · ${t("Persistent", "Persistente")}` : ""}</p>
          ${lineList(state.language === "pt-BR" ? status.pt : status.en)}
          ${status.enemy ? `<p class="mdt-token-enemy"><strong>${t("Enemies:", "Inimigos:")}</strong> ${t(status.enemy[0], status.enemy[1])}</p>` : ""}
          ${refs(["m12"])}
        </div>
      </article>`).join("")}</div>`;
  }

  function statusSection() {
    return `
      ${sectionHeading("status", t("Status Effects & Companions", "Efeitos de Status e Companheiros"), missions() ? ["c6", "c7", "m7", "m9", "m12"] : ["c6", "c7"])}
      ${grid([
        infoCard(t("TOKENS", "MARCADORES"), t("Gaining and inflicting", "Ganhar e infligir"), [
          t("Each hero has a set of Status Effects, represented by tokens and explained on the Hero Leaflet. If you need more tokens than provided, use any substitute.", "Cada herói tem um conjunto de Efeitos de Status, representados por marcadores e explicados no Folheto do Herói. Se precisar de mais marcadores do que há, use qualquer substituto."),
          t("Positive or Negative Status Effects can be gained (on yourself) or inflicted (on others), usually through cards or abilities.", "Efeitos de Status Positivos ou Negativos podem ser ganhos (em você) ou infligidos (em outros), em geral por cartas ou habilidades."),
          t("When you gain or inflict one, take the token from YOUR Hero Leaflet and place it in the middle of the receiving player's Hero Board: it is now “in play”.", "Quando você ganha ou inflige um, pegue o marcador do SEU Folheto do Herói e coloque-o no meio do Tabuleiro do Herói de quem o recebe: ele agora está “em jogo”."),
          koth() ? t("If a player is defeated, Status Effects they inflicted on other players remain in play.", "Se um jogador é derrotado, os Efeitos de Status que ele infligiu em outros continuam em jogo.") : "",
          rl("Removing", "return the token to its place on its hero's leaflet. An effect that removes a specific number removes that many tokens.", "Remoção", "devolva o marcador ao lugar no folheto do herói dele. Um efeito que remove um número específico remove essa quantidade de marcadores.")
        ], ["c6", "c16"]),
        infoCard(t("KINDS", "TIPOS"), t("Spendable, Persistent, Unique", "Gastáveis, Persistentes, Únicos"), [
          rl("Spendable", "removed when you spend them. Unless stated otherwise you may spend them at any time, in any phase of any player's turn; the effect is immediate and costs no CP. You may gain the token again later.", "Gastáveis (Spendable)", "são removidos quando você os gasta. Salvo indicação contrária você pode gastá-los a qualquer momento, em qualquer fase do turno de qualquer jogador; o efeito é imediato e não custa CP. Você pode ganhar o marcador de novo depois."),
          rl("No interrupting", "once a Status Effect is spent, its effect cannot be interrupted. Spending a token counts as an Instant Action for timing.", "Sem interromper", "depois que um Efeito de Status é gasto, o efeito não pode ser interrompido. Gastar um marcador conta como Ação Instantânea para a prioridade."),
          rl("Persistent", "stays in play until the end of the game, or until a card or ability removes it.", "Persistentes (Persistent)", "ficam em jogo até o fim da partida, ou até uma carta ou habilidade removê-los."),
          rl("Unique", "break the standard Status Effect rules as their description explains; usually a custom shape or size.", "Únicos (Unique)", "quebram as regras padrão dos Efeitos de Status, como a descrição explica; em geral têm forma ou tamanho próprios.")
        ], ["c6", "c7", "c15", "c16"]),
        infoCard(t("LIMITS", "LIMITES"), t("Stack Limit", "Limite de Pilha (Stack Limit)"), [
          t("Many Status Effects can be applied several times to the same hero, forming a stack.", "Muitos Efeitos de Status podem ser aplicados várias vezes ao mesmo herói, formando uma pilha."),
          t("The Stack Limit is the maximum number of tokens of that Status Effect on a single Hero Board at a time (limit 2 = at most 2 on each player).", "O Limite de Pilha é o máximo de marcadores daquele Efeito de Status num único Tabuleiro do Herói ao mesmo tempo (limite 2 = no máximo 2 em cada jogador)."),
          t("If a player increases a Stack Limit, the increase applies only to that player and lasts for the rest of the game.", "Se um jogador aumenta um Limite de Pilha, o aumento vale só para ele e dura o resto da partida.")
        ], ["c7", "c16"]),
        infoCard(t("COMPANIONS", "COMPANHEIROS"), t("Not Status Effects", "Não são Efeitos de Status"), [
          t("Some heroes have Companions: tokens, dials or other custom components with their own rules on the Hero Leaflet.", "Alguns heróis têm Companheiros: marcadores, mostradores ou outros componentes com regras próprias no Folheto do Herói."),
          t("Companions are not Status Effects, so cards and abilities that alter Status Effects do not affect them.", "Companheiros não são Efeitos de Status, então cartas e habilidades que alteram Efeitos de Status não os afetam."),
          t("They cannot be removed, transferred or destroyed unless the Companion's own rules say so.", "Não podem ser removidos, transferidos ou destruídos, a menos que as regras do próprio Companheiro digam.")
        ], ["c7"]),
        missions() ? infoCard(t("MISSIONS", "MISSÕES"), t("Status effects and enemies", "Efeitos de status e inimigos"), [
          t("Enemies count as players for all cards, effects and abilities, so you can inflict your hero's Status Effects on them.", "Inimigos contam como jogadores para todas as cartas, efeitos e habilidades, então você pode infligir neles os Efeitos de Status do seu herói."),
          rl("On a Henchman", "place the token directly on that Henchman's space on the map, not on its info panel.", "Num Capanga", "ponha o marcador diretamente no espaço daquele Capanga no mapa, não no painel de informações."),
          interpretation("on a Boss, keep the tokens beside the Boss Health Dial (the rulebook only covers Henchmen).", "num Chefe, deixe os marcadores ao lado do mostrador Boss Health (o livro só fala dos Capangas)."),
          rl("Momentum instead", "whenever you would place a status effect on a targeted enemy you may choose not to and gain 1 Momentum — useful if the enemy is immune, at its Stack Limit, or the status is not useful.", "Momentum em troca", "sempre que fosse colocar um efeito de status num inimigo alvo, você pode não colocar e ganhar 1 de Momentum — útil se o inimigo é imune, está no Limite de Pilha ou o status não ajuda."),
          rl("Unchangeable", "you cannot change an enemy's number of dice, type of dice or number of Roll Attempts, and enemies have no cards and infinite CP: effects that touch those do nothing.", "Imutável", "você não pode mudar o número de dados, o tipo de dados nem o número de Tentativas de Rolagem de um inimigo, e inimigos não têm cartas e têm CP infinitos: efeitos que mexem nisso não fazem nada."),
          rl("Removed “at end of turn / Roll Phase”", "on an enemy, such a status (Blind, Paralyze…) is removed after the enemy's Attack against the FIRST targeted Hero and does not affect the Attack against later Heroes.", "Removidos “ao fim do turno / Fase de Rolagem”", "num inimigo, um status assim (Blind, Paralyze…) é removido depois do Ataque do inimigo contra o PRIMEIRO Herói alvo e não afeta o Ataque contra os Heróis seguintes."),
          rl("Limiting which Attack", "if a status limits which Attack an enemy may activate (Hex…), removing it after the first Hero does not change the Attack already chosen.", "Limitando qual Ataque", "se um status limita qual Ataque um inimigo pode ativar (Hex…), removê-lo depois do primeiro Herói não muda o Ataque já escolhido.")
        ], ["m7", "m9"]) : ""
      ])}
      ${missions() ? `
        <h3 class="subhead">${t("Missions status tokens — reference chart", "Marcadores de status de Missões — tabela de referência")}</h3>
        <p class="glossary-intro">${t(
          "These 21 tokens come in the Missions box and are used by Mission Boards, enemies, Allies, Boost Tiles and Perks. “You” is whoever holds the token — a Hero or an enemy. Tokens marked Persistent stay until removed.",
          "Estes 21 marcadores vêm na caixa de Missões e são usados por Tabuleiros de Missão, inimigos, Aliados, Fichas de Boost e Vantagens. “Você” é quem tem o marcador — um Herói ou um inimigo. Marcadores Persistentes ficam até serem removidos."
        )}</p>
        ${missionStatusCards()}` : `
        <p class="callout">${onBoard("what each of your hero's Status Effects does, its type and its Stack Limit are printed on the front of the Hero Leaflet.", "o que cada Efeito de Status do seu herói faz, o tipo e o Limite de Pilha estão impressos na frente do Folheto do Herói.")}</p>`}`;
  }

  // ---------- damage (core p. 10) ----------

  function damageSection() {
    const yes = `<span class="mdt-yes">✓</span>`;
    const no = `<span class="mdt-no">✗</span>`;
    const rows = [
      [t("Normal (“dmg”)", "Normal (“dmg”)"), yes, yes, yes, no],
      [t("Undefendable", "Indefensável (undefendable)"), no, yes, yes, no],
      [t("Pure", "Puro (pure)"), no, yes, no, no],
      [t("Collateral", "Colateral (collateral)"), no, yes, no, yes],
      [t("Ultimate", "Supremo (Ultimate)"), no, no, t("increase only", "só aumentar"), no]
    ];
    return `
      ${sectionHeading("damage", t("Damage types & Attack Modifiers", "Tipos de dano e Modificadores de Ataque"), ["c10", "c16"])}
      <table class="mdt-score-table">
        <caption>${t("Damage type chart (✓ yes, ✗ no)", "Tabela de tipos de dano (✓ sim, ✗ não)")}</caption>
        <thead><tr><th>${t("Type", "Tipo")}</th><th>${t("Defendable", "Defensável")}</th><th>${t("Avoidable", "Evitável")}</th><th>${t("Modifiable", "Modificável")}</th><th>${t("Special targeting", "Alvo especial")}</th></tr></thead>
        <tbody>${rows.map((row) => `<tr>${row.map((cell, index) => (index ? `<td>${cell}</td>` : `<th scope="row">${cell}</th>`)).join("")}</tr>`).join("")}</tbody>
      </table>
      ${grid([
        infoCard(t("ATTRIBUTES", "ATRIBUTOS"), t("What the columns mean", "O que as colunas significam"), [
          rl("Incoming damage", "the amount of damage currently waiting to be dealt to a player.", "Dano recebido (incoming damage)", "a quantidade de dano esperando para ser causada a um jogador."),
          rl("Defendable", "if it comes from an opponent's Offensive Ability, you may perform your Defensive Ability.", "Defensável", "se vem da Habilidade Ofensiva de um oponente, você pode usar a sua Habilidade Defensiva."),
          rl("Avoidable", "can be reduced, prevented, avoided or interrupted by cards and / or Status Effects.", "Evitável", "pode ser reduzido, prevenido, evitado ou interrompido por cartas e / ou Efeitos de Status."),
          rl("Modifiable", "can be changed with Attack Modifiers.", "Modificável", "pode ser alterado com Modificadores de Ataque."),
          rl("Special targeting", "the description says who receives it; no targeting step is needed.", "Alvo especial", "a descrição diz quem o recebe; não precisa de etapa de alvo.")
        ], ["c10"]),
        infoCard(t("FIVE TYPES", "CINCO TIPOS"), t("How to recognise them", "Como reconhecê-los"), [
          rl("Normal", `${g("dmg", "normal damage", "dano normal")} a black circle with a number, followed by “dmg”. The most common type.`, "Normal", `${g("dmg", "normal damage", "dano normal")} um círculo preto com um número, seguido de “dmg”. O tipo mais comum.`),
          rl("Undefendable", `${g("dmg-undefendable", "undefendable damage", "dano indefensável")} a red circle with a number, followed by “undefendable dmg”.`, "Indefensável", `${g("dmg-undefendable", "undefendable damage", "dano indefensável")} um círculo vermelho com um número, seguido de “undefendable dmg”.`),
          rl("Pure", "a red circle followed by “pure dmg”: undefendable damage that cannot be modified.", "Puro", "um círculo vermelho seguido de “pure dmg”: dano indefensável que não pode ser modificado."),
          rl("Collateral", `a red circle followed by “collateral dmg”: it is not aimed through targeting — its text says who receives it — so it is not an Attack.${teams() ? " Dealt to both teammates at once, it lowers their shared Health Dial by the combined total." : ""}`, "Colateral", `um círculo vermelho seguido de “collateral dmg”: não passa pela escolha de alvo — o texto diz quem o recebe — então não é um Ataque.${teams() ? " Causado aos dois parceiros de uma vez, reduz o mostrador de Vida compartilhado pelo total combinado." : ""}`),
          rl("Ultimate", "the red-circle damage dealt by an Ultimate Ability: not defendable, not avoidable, and Modifiers may only increase it.", "Supremo", "o dano de círculo vermelho causado por uma Habilidade Suprema: não defensável, não evitável, e Modificadores só podem aumentá-lo.")
        ], ["c10"]),
        infoCard(t("ATTACKS", "ATAQUES"), t("Attack and Attack Modifiers", "Ataque e Modificadores de Ataque"), [
          rl("Attack", "an Offensive Ability that deals at least 1 dmg to a targeted opponent (collateral damage does not count).", "Ataque", "uma Habilidade Ofensiva que causa ao menos 1 de dano a um oponente alvo (dano colateral não conta)."),
          rl("Attack Modifier", "any card or Status Effect that modifies an Attack; it says “Attack Modifier”.", "Modificador de Ataque", "qualquer carta ou Efeito de Status que modifica um Ataque; traz escrito “Attack Modifier”."),
          t("Modifiers can be played before or after the Defensive Ability is activated.", "Modificadores podem ser jogados antes ou depois de a Habilidade Defensiva ser ativada."),
          t("Damage added by a Modifier is of the same type as the original damage.", "O dano somado por um Modificador é do mesmo tipo do dano original."),
          t("Modifiers can only be used on Attacks.", "Modificadores só podem ser usados em Ataques."),
          rl("Isolated damage", "damage whose text calls it “isolated” is dealt immediately instead of waiting for the end of the phase; it may only be prevented or avoided as a separate instance of damage.", "Dano isolado (isolated)", "o dano cujo texto o chama de “isolated” é causado na hora, sem esperar o fim da fase; só pode ser prevenido ou evitado como uma instância separada de dano.")
        ], ["c10", "c16"])
      ])}`;
  }

  // ---------- resolving text (core p. 9, 16) ----------

  function textSection() {
    return `
      ${sectionHeading("text", t("Reading ability and card text", "Lendo o texto de habilidades e cartas"), ["c9", "c16"])}
      ${grid([
        infoCard(t("WORDING", "REDAÇÃO"), t("Rolls and symbols", "Rolagens e símbolos"), [
          rl("“Roll [#]”", "roll the indicated number of dice a single time, then resolve the effects that follow. Dice rolled earlier cannot be used for these effects.", "“Roll [#]”", "role o número indicado de dados uma única vez e resolva os efeitos que seguem. Dados rolados antes não servem para esses efeitos."),
          rl("“On [symbol]”", "if your roll contains the symbol shown, you get the listed benefit — only once, even if the symbol appears several times.", "“On [símbolo]”", "se a rolagem contém o símbolo mostrado, você recebe o benefício — só uma vez, mesmo que o símbolo apareça várias vezes."),
          rl("Multiplication (“1 × [symbol]”)", "multiply the number by how many of your dice show that symbol.", "Multiplicação (“1 × [símbolo]”)", "multiplique o número por quantos dados seus mostram aquele símbolo."),
          rl("Dice key", "which symbol sits on which numbered face is on your Hero Leaflet.", "Legenda dos dados", "qual símbolo fica em qual face numerada está no Folheto do Herói.")
        ], ["c9", "c6"]),
        infoCard(t("WORDING", "REDAÇÃO"), t("Then, Or, Additionally", "Then, Or, Additionally"), [
          rl("“Then”", "creates a break: players may spend Status Effects and play Instant Action or Roll Phase Action cards at that point. What follows “Then” is always performed after what came before it.", "“Then” (então)", "cria uma pausa: os jogadores podem gastar Efeitos de Status e jogar cartas Instantâneas ou de Fase de Rolagem nesse ponto. O que vem depois de “Then” é sempre feito depois do que veio antes."),
          rl("“Or”", "when statements are separated by “or”, you may resolve only one of them.", "“Or” (ou)", "quando as frases são separadas por “or”, você resolve só uma delas."),
          rl("“Additionally”", "statements after it resolve after the other listed effects.", "“Additionally” (além disso)", "as frases depois dele resolvem depois dos outros efeitos listados.")
        ], ["c9", "c16"]),
        infoCard(t("WORDING", "REDAÇÃO"), t("Gain, Inflict, Heal, Steal", "Gain, Inflict, Heal, Steal"), [
          rl("Gain", "a Status Effect: take the token and place it on the middle of your Hero Board. Health or CP: raise the dial by that amount.", "Gain (ganhar)", "um Efeito de Status: pegue o marcador e ponha no meio do seu Tabuleiro do Herói. Vida ou CP: aumente o mostrador nesse valor."),
          rl("Inflict", "take the Status Effect token and place it in the middle of the receiving player's Hero Board.", "Inflict (infligir)", "pegue o marcador de Efeito de Status e ponha no meio do Tabuleiro do Herói de quem recebe."),
          rl("Heal", "raise your Health Dial, up to 10 above your starting Health.", "Heal (curar)", "aumente o mostrador de Vida, até 10 acima da Vida inicial."),
          rl("Steal", "take the resource from your opponent and give it to yourself: raise your Health / CP dial and lower theirs. If they have less than the amount, steal as much as they have.", "Steal (roubar)", "tire o recurso do oponente e dê a você: aumente o seu mostrador de Vida / CP e reduza o dele. Se ele tem menos que o valor, roube o quanto tiver.")
        ], ["c9", "c16"]),
        infoCard(t("SYMBOLS IN TEXT", "SÍMBOLOS NO TEXTO"), t("Numbers inside icons", "Números dentro de ícones"), [
          `${g("cp-gain", "CP icon", "ícone de CP")} ${t("a number on the CP icon: that many Combat Points.", "um número no ícone de CP: essa quantidade de Pontos de Combate.")}`,
          `${g("card", "card icon", "ícone de carta")} ${t("a number on a card: draw (or discard) that many cards.", "um número numa carta: compre (ou descarte) essa quantidade de cartas.")}`,
          `${g("heal", "heal icon", "ícone de cura")} ${t("a number on a green heart: heal that much.", "um número num coração verde: cure esse valor.")}`,
          `${g("prevent", "prevent icon", "ícone de prevenção")} ${t("a number on a blue shield: prevent that much incoming damage (½ = half, rounded up).", "um número num escudo azul: previna esse valor do dano recebido (½ = metade, arredondada para cima).")}`,
          `${g("die", "die icon", "ícone de dado")} ${t("the small die: “roll this many dice”.", "o dadinho: “role esta quantidade de dados”.")}`
        ], ["c2", "c9", "c14"])
      ])}`;
  }

  // ---------- advanced (core p. 14–15) ----------

  function advancedSection() {
    return `
      ${sectionHeading("advanced", t("Damage math & timing conflicts", "Cálculo de dano e conflitos de prioridade"), ["c14", "c15"])}
      <p class="glossary-intro">${t(
        "The rulebook marks these two pages as intended for advanced players and tournament play: you do not need them for a casual game, but they settle arguments.",
        "O livro marca estas duas páginas como destinadas a jogadores avançados e torneios: você não precisa delas num jogo casual, mas elas resolvem discussões."
      )}</p>
      ${grid([
        infoCard(t("FINAL DMG TOTAL", "DANO FINAL"), t("Three steps, after everyone has finished acting", "Três passos, depois que todos terminaram de agir"), [
          rl("1 · Incoming damage", "the damage waiting to be dealt to you — usually from Offensive and Defensive Abilities, sometimes from Status Effects.", "1 · Dano recebido", "o dano esperando para ser causado a você — em geral de Habilidades Ofensivas e Defensivas, às vezes de Efeitos de Status."),
          rl("2 · Add & subtract → subtotal", "apply everything that adds or prevents a SPECIFIC amount: Defensive Abilities, Status Effects, cards.", "2 · Some e subtraia → subtotal", "aplique tudo que soma ou previne uma quantidade ESPECÍFICA: Habilidades Defensivas, Efeitos de Status, cartas."),
          rl("3 · Multiply & divide → final total", "apply everything that multiplies or divides, always last, whatever the order in which things were played.", "3 · Multiplique e divida → total final", "aplique tudo que multiplica ou divide, sempre por último, não importa a ordem em que as coisas foram jogadas."),
          rl("Several multipliers", "each one is calculated independently from the step-2 subtotal, then all are applied.", "Vários multiplicadores", "cada um é calculado de forma independente a partir do subtotal do passo 2, e então todos são aplicados."),
          rl("Rounding", "all division in Dice Throne is rounded up.", "Arredondamento", "toda divisão em Dice Throne é arredondada para cima.")
        ], ["c14"]),
        infoCard(t("TIMING CONFLICTS", "CONFLITOS DE PRIORIDADE"), t("Whose instant resolves first", "Qual ação instantânea resolve primeiro"), [
          t("When several players perform Instant Actions and it is unclear which resolves first, the player whose turn it is has priority — regardless of who started first.", "Quando vários jogadores fazem Ações Instantâneas e não está claro qual resolve primeiro, o jogador da vez tem prioridade — não importa quem começou."),
          t("Spending a Status Effect token is considered an Instant Action.", "Gastar um marcador de Efeito de Status é considerado uma Ação Instantânea."),
          t("The player whose turn it is takes precedence however many instants are used in the exchange.", "O jogador da vez tem precedência não importa quantas instantâneas sejam usadas na troca."),
          t("Cards and abilities that are not “instant” ARE interruptible: an opponent may still spend valid Status Effects before a Main Phase Action card finishes resolving.", "Cartas e habilidades que não são “instantâneas” SÃO interrompíveis: um oponente ainda pode gastar Efeitos de Status válidos antes de uma carta de Ação de Fase Principal terminar de resolver."),
          playerCount() > 2 || missions() ? t("With more than two players: the player whose turn it is first, then the following players in turn order; afterwards the previous order of play continues.", "Com mais de dois jogadores: primeiro o jogador da vez, depois os seguintes em ordem de turno; depois a ordem normal de jogo continua.") : "",
          missions() ? interpretation("in the simultaneous Hero phases nobody is “the player whose turn it is”: settle conflicts between Heroes in turn order, Start Player first. In the Target & Resolve Phase it is the turn of the Hero who is resolving.", "nas fases simultâneas dos Heróis ninguém é “o jogador da vez”: resolvam conflitos entre Heróis em ordem de turno, Jogador Inicial primeiro. Na Fase de Alvo e Resolução, a vez é do Herói que está resolvendo.") : ""
        ], ["c15"])
      ])}`;
  }

  // ---------- missions: round phases (missions p. 6–7) ----------

  function roundsSection() {
    return `
      ${sectionHeading("rounds", t("Round phases", "Fases da rodada"), ["m6", "m7"])}
      <p class="glossary-intro">${t(
        `Play takes place over rounds of 8 phases (also listed on your Player Aid Card). ${solo() ? "Playing solo, “simultaneously” and “in turn order” simply mean you." : "Several phases are played by all Heroes simultaneously: decide together, and if you do not agree, decide in turn order — starting with the Start Player and continuing clockwise."}`,
        `O jogo acontece em rodadas de 8 fases (também listadas na sua carta de Ajuda). ${solo() ? "No solo, “ao mesmo tempo” e “em ordem de turno” significam simplesmente você." : "Várias fases são jogadas por todos os Heróis ao mesmo tempo: decidam juntos e, se não concordarem, decidam em ordem de turno — começando pelo Jogador Inicial e seguindo em sentido horário."}`
      )}</p>
      ${grid([
        infoCard(t("ROUND PHASE 1", "FASE 1 DA RODADA"), t("Pass Phase", "Fase de Passagem"), [
          solo()
            ? t("Solo: you are always the Start Player; nothing to pass.", "Solo: você é sempre o Jogador Inicial; não há o que passar.")
            : t("Pass the Start Player Token clockwise at the start of every round — except the very first round of Side 1. That player is the Start Player until the end of the round.", "Passem o marcador de Jogador Inicial em sentido horário no começo de cada rodada — exceto na primeiríssima rodada do Lado 1. Esse jogador é o Jogador Inicial até o fim da rodada."),
          rl("Turn order", "whenever something is resolved “in turn order”, begin with the Start Player and continue clockwise.", "Ordem de turno", "sempre que algo é resolvido “em ordem de turno”, comece pelo Jogador Inicial e siga em sentido horário.")
        ], ["m6"]),
        infoCard(t("ROUND PHASE 2", "FASE 2 DA RODADA"), t("Movement Phase", "Fase de Movimento"), [
          t("All Hero pawns move at the same time, any number of spaces (including zero), and collect the Boost Tiles on the space where they stop.", "Todos os peões de Herói se movem ao mesmo tempo, quantos espaços quiserem (inclusive zero), e pegam as Fichas de Boost do espaço onde param."),
          t("Details: see Movement, Melee & Range.", "Detalhes: veja Movimento, Melee e Range.")
        ], ["m6"]),
        infoCard(t("ROUND PHASE 3", "FASE 3 DA RODADA"), t("Hero Phase Part 1", "Fase dos Heróis, Parte 1"), [
          t("All Heroes simultaneously play the first part of their Dice Throne turn: Upkeep Phase, Income Phase (skipped by everyone in the first round), Main Phase (1) and all their Roll Attempts of the Offensive Roll Phase.", "Todos os Heróis jogam ao mesmo tempo a primeira parte do turno de Dice Throne: Fase de Manutenção, Fase de Renda (pulada por todos na primeira rodada), Fase Principal (1) e todas as Tentativas de Rolagem da Fase de Rolagem Ofensiva."),
          t("Nothing of the Offensive Ability is resolved yet — not even effects that need no target. That happens in the Target & Resolve Phase.", "Nada da Habilidade Ofensiva é resolvido ainda — nem os efeitos que não precisam de alvo. Isso acontece na Fase de Alvo e Resolução."),
          t("When you have finished rolling and are ready to activate an ability, stop and say “Ready to attack!”.", "Quando terminar de rolar e estiver pronto para ativar uma habilidade, pare e diga “Pronto para atacar!”."),
          solo() ? "" : t("Each Hero may go through these phases at their own pace, but Heroes can only interact with teammates who are in the same phase: you cannot play a Main Phase card on a teammate who has already entered their Offensive Roll Phase, or the reverse.", "Cada Herói pode passar por essas fases no próprio ritmo, mas só interage com parceiros que estejam na mesma fase: você não pode jogar uma carta de Fase Principal num parceiro que já entrou na Fase de Rolagem Ofensiva, nem o contrário.")
        ], ["m6"]),
        infoCard(t("ROUND PHASE 4", "FASE 4 DA RODADA"), t("Target & Resolve Phase", "Fase de Alvo e Resolução"), [
          t("In turn order, each Hero selects a target, activates the Offensive Ability their dice allow and resolves all of its effects.", "Em ordem de turno, cada Herói escolhe um alvo, ativa a Habilidade Ofensiva que os dados permitem e resolve todos os efeitos dela."),
          t("If the target is a Boss, also resolve the Boss's Defensive Ability for each Attack. Henchmen have no Defensive Ability, only Shield tokens.", "Se o alvo é um Chefe, resolva também a Habilidade Defensiva do Chefe para cada Ataque. Capangas não têm Habilidade Defensiva, só marcadores Shield."),
          t("Melee by default: the target must be adjacent unless you gained Range first.", "Melee por padrão: o alvo precisa estar adjacente, a menos que você tenha ganho Range antes."),
          interpretation("each Hero's Attack is resolved completely — including the Boss Defense and applying the damage — before the next Hero's (the rulebook's example has one Hero defeated by the Boss's defense and a later Hero then defeating the Boss in the same phase).", "o Ataque de cada Herói é resolvido por completo — incluindo a Boss Defense e a aplicação do dano — antes do Ataque do próximo (no exemplo do livro um Herói é derrotado pela defesa do Chefe e outro, depois, derrota o Chefe na mesma fase).")
        ], ["m6", "m9", "m10"]),
        infoCard(t("ROUND PHASE 5", "FASE 5 DA RODADA"), t("Hero Phase Part 2", "Fase dos Heróis, Parte 2"), [
          t("All Heroes simultaneously complete Main Phase (2) and then their Discard Phase (sell down to 6 cards).", "Todos os Heróis fazem ao mesmo tempo a Fase Principal (2) e depois a Fase de Descarte (vendam até ficar com 6 cartas).")
        ], ["m6"]),
        infoCard(t("ROUND PHASE 6", "FASE 6 DA RODADA"), t("Enemy Upkeep Phase", "Fase de Manutenção Inimiga"), [
          t("Resolve the Upkeep Phase status effects that are on enemies (Poison, Burn, Bleed and so on), in any order the players choose.", "Resolvam os efeitos de status de Fase de Manutenção que estão nos inimigos (Poison, Burn, Bleed etc.), na ordem que os jogadores quiserem.")
        ], ["m7"]),
        infoCard(t("ROUND PHASE 7", "FASE 7 DA RODADA"), t("Enemy Roll Phase", "Fase de Rolagem Inimiga"), [
          t(`Roll the Enemy Dice pool (2 red + ${blackDice()} black) exactly once, however many enemies there are.`, `Rolem o conjunto de Dados Inimigos (2 vermelhos + ${blackDice()} pretos) exatamente uma vez, não importa quantos inimigos haja.`),
          t("Activate the Offensive Abilities whose roll objectives are matched; Heroes may defend against defendable Attacks.", "Ativem as Habilidades Ofensivas cujos objetivos de rolagem foram atingidos; Heróis podem se defender de Ataques defensáveis."),
          t("Details: Henchmen & enemy attacks (Mission Run) or Boss Fights.", "Detalhes: Capangas e ataques inimigos (Incursão) ou Lutas contra o Chefe.")
        ], ["m6", "m7", "m10"]),
        infoCard(t("ROUND PHASE 8", "FASE 8 DA RODADA"), t("Crisis Clock Phase", "Fase do Relógio de Crise"), [
          t(`Advance the Crisis Clock Hand ${clockSteps()} segment${clockSteps() > 1 ? "s" : ""} clockwise and activate every Crisis Ability it moves through and ends on, but not the one it started on.`, `Avancem o ponteiro do Relógio de Crise ${clockSteps()} segmento${clockSteps() > 1 ? "s" : ""} em sentido horário e ativem cada Habilidade de Crise por onde ele passa e onde para, mas não a de onde saiu.`),
          t("Details: Crisis Clock. Then a new round begins with the Pass Phase.", "Detalhes: Relógio de Crise. Depois começa uma nova rodada, pela Fase de Passagem.")
        ], ["m6", "m7"])
      ])}`;
  }

  // ---------- missions: movement, melee & range (missions p. 4, 6) ----------

  function movementSection() {
    return `
      ${sectionHeading("movement", t("Movement, Melee & Range", "Movimento, Melee e Range"), ["m4", "m6"])}
      ${grid([
        infoCard(t("MOVEMENT PHASE", "FASE DE MOVIMENTO"), t("Moving your pawn", "Movendo o seu peão"), [
          t("Move any number of spaces, including zero, and end on a hexagonal space.", "Mova quantos espaços quiser, inclusive zero, e termine num espaço hexagonal."),
          rl("Entering", "a pawn not yet on the map (new Mission Run or Boss Fight) must move onto the map from the Entry Space. If there is no Entry Space, its first move is to land on any valid space.", "Entrada", "um peão que ainda não está no mapa (nova Incursão ou Luta contra o Chefe) precisa entrar pelo Entry Space (espaço de Entrada). Se não houver, o primeiro movimento é pousar em qualquer espaço válido."),
          rl("Blocked", "you cannot move onto or through a space with a dark, shaded background (the spaces Henchmen stand on) UNLESS it is covered by a Defeat Tile. Clear Tiles can sometimes be moved onto, as the Mission says.", "Bloqueio", "você não pode entrar nem passar por um espaço de fundo escuro, sombreado (os espaços onde ficam os Capangas), A MENOS que esteja coberto por uma ficha Defeat. Fichas Clear às vezes permitem entrar, conforme a Missão disser."),
          solo() ? "" : rl("Other Heroes", "you may move through other Heroes or swap spaces, but two Heroes cannot share a space at the end of the phase. If several want the same space, the Hero earlier in turn order decides who takes it.", "Outros Heróis", "você pode atravessar outros Heróis ou trocar de espaço, mas dois Heróis não podem dividir um espaço ao fim da fase. Se vários querem o mesmo espaço, o Herói mais cedo na ordem de turno decide quem fica."),
          rl("Boost Tiles", "you may move through or land on them; you collect only those on the space where you END your move.", "Fichas de Boost", "você pode passar por elas ou parar nelas; só pega as do espaço onde TERMINA o movimento."),
          rl("Tip", "you will usually want to end next to an enemy, because Attacks and Defensive Abilities are Melee by default.", "Dica", "em geral você vai querer terminar ao lado de um inimigo, porque Ataques e Habilidades Defensivas são Melee por padrão.")
        ], ["m6", "m8"]),
        infoCard(t("MELEE", "MELEE (CORPO A CORPO)"), `${g("melee", "Melee icon", "ícone Melee")} ${t("Adjacent only", "Só adjacente")}`, [
          t("If your Offensive Ability is an Attack — it deals at least 1 non-collateral dmg to an opponent — it is Melee: it can target only ONE adjacent enemy, in a space that shares a border with yours.", "Se a sua Habilidade Ofensiva é um Ataque — causa ao menos 1 de dano não colateral a um oponente — ela é Melee: só pode mirar UM inimigo adjacente, num espaço que faz fronteira com o seu."),
          t("You cannot resolve ANY part of a Melee Attack unless there is an adjacent enemy to target first — not even its “gain” effects.", "Você não resolve NENHUMA parte de um Ataque Melee sem antes haver um inimigo adjacente para mirar — nem os efeitos de “ganhar”."),
          t("Your Defensive Ability is Melee too: without Range it only works against an adjacent attacker.", "A sua Habilidade Defensiva também é Melee: sem Range ela só funciona contra um atacante adjacente.")
        ], ["m4", "m6", "m7"]),
        infoCard(t("RANGE", "RANGE (ALCANCE)"), `${g("range", "Range icon", "ícone Range")} ${t("Anywhere on the map", "Qualquer lugar do mapa")}`, [
          t("To target a non-adjacent enemy with an Attack you must gain Range.", "Para mirar um inimigo não adjacente com um Ataque você precisa ganhar Range."),
          rl("How", "by spending Momentum on the “Gain Range” action of your Momentum Card (it costs 1 Momentum on the Level 1 card pictured in the rulebook — read your own card), or through an Ally power.", "Como", "gastando Momentum na ação “Gain Range” da sua carta de Momentum (custa 1 de Momentum na carta de Nível 1 ilustrada no livro — leia a sua carta), ou por um poder de Aliado."),
          rl("When", "Range must be gained BEFORE resolving any of the Attack's effects.", "Quando", "o Range deve ser obtido ANTES de resolver qualquer efeito do Ataque."),
          rl("No target", "unlike a Melee Attack, a Range Attack may be resolved without choosing a target (to collect its other effects).", "Sem alvo", "ao contrário de um Ataque Melee, um Ataque com Range pode ser resolvido sem escolher alvo (para aproveitar os outros efeitos)."),
          rl("Not needed", "for an Ultimate Attack, or for an ability that deals only collateral damage or no damage (so is not an Attack): these may be used on any enemy on the map, or on none, as their text allows.", "Dispensado", "para um Ataque Supremo, ou para uma habilidade que só causa dano colateral ou nenhum dano (logo, não é um Ataque): elas podem ser usadas em qualquer inimigo do mapa, ou em nenhum, conforme o texto permitir."),
          rl("Defending at Range", "gain Range the same way to make a Defense Roll against a non-adjacent attacker.", "Defender à distância", "ganhe Range do mesmo jeito para fazer uma Rolagem de Defesa contra um atacante não adjacente.")
        ], ["m4", "m6", "m7", "m8"])
      ])}
      ${artRow(
        figure("movement", t("Missions p. 6: Storm enters at the Entry Space (A) and stops on B, collecting its Boost Tile; Wolverine enters and stops on the empty space C", "Missões p. 6: Storm entra pelo Entry Space (A) e para em B, pegando a Ficha de Boost; Wolverine entra e para no espaço vazio C")),
        figure("targeting", t("Missions p. 6: Storm is adjacent to Strike Team (D) and Cult Thug (E); Wolverine is adjacent only to Cult Thug (E)", "Missões p. 6: Storm está adjacente à Strike Team (D) e ao Cult Thug (E); Wolverine só está adjacente ao Cult Thug (E)"))
      )}`;
  }

  // ---------- missions: enemies (missions p. 7, 9) ----------

  function enemiesSection() {
    return `
      ${sectionHeading("enemies", t("Henchmen & enemy attacks", "Capangas e ataques inimigos"), ["m7", "m9", "m12"])}
      ${grid([
        infoCard(t("ENEMIES", "INIMIGOS"), t("Who you fight", "Contra quem vocês lutam"), [
          t("On most maps Side 1 has up to 3 Henchman types (green, blue and magenta hexagon icons) and 1 Unstoppable Threat (orange); Side 2 typically has a Boss. All of them are “enemies”.", "Na maioria dos mapas o Lado 1 tem até 3 tipos de Capanga (ícones hexagonais verde, azul e magenta) e 1 Ameaça Imparável (laranja); o Lado 2 em geral tem um Chefe. Todos são “inimigos”."),
          t("Enemies are considered players for all cards, effects and abilities; Heroes' opponents are the enemies, and enemy abilities are written from the enemy's point of view (“opponent” = a Hero).", "Inimigos são considerados jogadores para todas as cartas, efeitos e habilidades; os oponentes dos Heróis são os inimigos, e as habilidades inimigas são escritas do ponto de vista do inimigo (“opponent” = um Herói)."),
          t("Their maximum Health is 10 above their starting Health.", "A Vida máxima deles é 10 acima da inicial."),
          t("You cannot change the quantity or type of dice they roll, nor their number of Roll Attempts.", "Você não pode mudar a quantidade ou o tipo de dados que eles rolam, nem o número de Tentativas de Rolagem."),
          t("Enemies have zero cards and are considered to have infinite CP.", "Inimigos têm zero cartas e considera-se que têm CP infinitos.")
        ], ["m7", "m9"]),
        infoCard(t("HENCHMEN", "CAPANGAS"), t("Info panels and Health", "Painéis e Vida"), [
          t("Each Henchman is drawn on the map; its type's info panel along the bottom edge gives the stats. A Henchman marked with a panel's coloured hexagon icon uses that panel.", "Cada Capanga está desenhado no mapa; o painel do tipo dele, na borda inferior, dá os dados. Um Capanga marcado com o ícone hexagonal colorido de um painel usa aquele painel."),
          rl("Health", "shown with Health Tokens on the Henchman; when it suffers dmg, swap tokens to show the new total.", "Vida", "mostrada com marcadores de Vida sobre o Capanga; quando ele sofre dano, troque os marcadores para mostrar o novo total."),
          rl("One Offensive Ability", "activated only if its roll objective is met in the Enemy Roll Phase.", "Uma Habilidade Ofensiva", "ativada só se o objetivo de rolagem for atingido na Fase de Rolagem Inimiga."),
          rl("No defense", "Henchmen have no Defensive Ability and never make Defense Rolls.", "Sem defesa", "Capangas não têm Habilidade Defensiva e nunca fazem Rolagens de Defesa."),
          onBoard("each panel prints the roll objective, the Attack and the Crisis Ability of that Henchman type.", "cada painel traz o objetivo de rolagem, o Ataque e a Habilidade de Crise daquele tipo de Capanga.")
        ], ["m7", "m9"]),
        infoCard(t("SHIELD", "SHIELD (ESCUDO)"), `${g("status-shield", "Shield token", "marcador Shield")} ${t("A Henchman's main defense", "A principal defesa de um Capanga")}`, [
          t("During setup Henchmen gain the Shield tokens shown on their panel; they may gain more through their Offensive or Crisis Ability.", "Na preparação os Capangas ganham os Shield indicados no painel; podem ganhar mais pela Habilidade Ofensiva ou de Crise."),
          t("A Henchman with Shield spends as many tokens as it needs to prevent damage from a defendable Attack — even an Attack made with Range.", "Um Capanga com Shield gasta quantos marcadores precisar para prevenir o dano de um Ataque defensável — mesmo um Ataque feito com Range."),
          t("Each spent Shield prevents up to 3 dmg and is then discarded, even if it only prevented 1.", "Cada Shield gasto previne até 3 de dano e é descartado, mesmo que só tenha prevenido 1."),
          t("Shield does not prevent undefendable, collateral, pure or Ultimate damage, and is not removed by those.", "Shield não previne dano indefensável, colateral, puro ou Supremo, e não é removido por eles.")
        ], ["m9", "m12"]),
        infoCard(t("DEFEATING", "DERROTANDO"), t("Defeat Tiles and Momentum", "Fichas Defeat e Momentum"), [
          t("A Henchman reduced to 0 Health is defeated: cover every shaded space it stands on with a Defeat Tile (most cover one space, large enemies two or more).", "Um Capanga reduzido a 0 de Vida é derrotado: cubra com uma ficha Defeat cada espaço sombreado que ele ocupa (a maioria ocupa um, inimigos grandes dois ou mais)."),
          t("Covered spaces are now empty spaces that Heroes may move through or onto.", "Os espaços cobertos passam a ser espaços vazios, por onde os Heróis podem passar ou parar."),
          solo()
            ? t("When the Defeat Tile is placed, you gain 2 Momentum.", "Quando a ficha Defeat é colocada, você ganha 2 de Momentum.")
            : t("When the Defeat Tile is placed, the Start Player — even if someone else made the kill — distributes 2 Momentum among the Heroes however they like.", "Quando a ficha Defeat é colocada, o Jogador Inicial — mesmo que outro tenha derrotado — distribui 2 de Momentum entre os Heróis como quiser."),
          interpretation("2 Momentum per defeated Henchman, even a large one that covers several spaces.", "2 de Momentum por Capanga derrotado, mesmo um grande que cubra vários espaços.")
        ], ["m9"]),
        infoCard(t("UNSTOPPABLE THREATS", "AMEAÇAS IMPARÁVEIS"), `${g("unstoppable", "Unstoppable Threat icon", "ícone de Ameaça Imparável")} ${t("Cannot be fought", "Não podem ser enfrentadas")}`, [
          t("Enemies tagged “Unstoppable Threat” are not Henchmen: they cannot be targeted by Offensive Abilities, never receive damage and never have status effects placed on them.", "Inimigos com a marca “Unstoppable Threat” não são Capangas: não podem ser alvo de Habilidades Ofensivas, nunca recebem dano e nunca recebem efeitos de status."),
          t("Their info panel on the map explains what they do during the Enemy Roll Phase.", "O painel deles no mapa explica o que fazem na Fase de Rolagem Inimiga."),
          t("An objective that asks you to defeat all enemies does not include Unstoppable Threats.", "Um objetivo que pede derrotar todos os inimigos não inclui as Ameaças Imparáveis.")
        ], ["m7", "m9"])
      ])}
      ${artRow(figure("henchman-panel", t("Missions p. 7: a Henchman info panel (Cult Thugs) — type icon, 10 Health, roll objective of three Strikes, a Multi-Strike Melee Attack and the Crisis Ability", "Missões p. 7: um painel de Capanga (Cult Thugs) — ícone do tipo, 10 de Vida, objetivo de rolagem de três Strikes, um Ataque Multi-Strike Melee e a Habilidade de Crise")))}
      <h3 class="subhead">${t("Enemy Roll Phase on a Mission Run", "Fase de Rolagem Inimiga numa Incursão")}</h3>
      ${grid([
        infoCard(t("STEP BY STEP", "PASSO A PASSO"), t("Henchmen attack", "Os Capangas atacam"), [
          rl("Roll", `the Start Player rolls the whole pool (2 red + ${blackDice()} black) exactly once. On a Mission Run red and black dice are read alike (the rulebook's examples use both for the roll objectives).`, "Role", `o Jogador Inicial rola o conjunto inteiro (2 vermelhos + ${blackDice()} pretos) exatamente uma vez. Numa Incursão dados vermelhos e pretos são lidos do mesmo jeito (os exemplos do livro usam ambos para os objetivos de rolagem).`),
          rl("Adjust", "Heroes may use cards and effects to alter the dice.", "Ajuste", "os Heróis podem usar cartas e efeitos para alterar os dados."),
          rl("1 · Compare", "for each Henchman info panel, check the rolled dice against its roll objective. If the roll contains the required symbols, Henchmen of that type activate their Offensive Ability.", "1 · Compare", "para cada painel de Capanga, compare os dados rolados com o objetivo de rolagem. Se a rolagem contém os símbolos pedidos, os Capangas daquele tipo ativam a Habilidade Ofensiva."),
          rl("2 · Resolve", "take the activated panels from left to right. For each, every undefeated Henchman of that type attacks, in order across the map from left to right, then top to bottom (like reading a book).", "2 · Resolva", "pegue os painéis ativados da esquerda para a direita. Para cada um, cada Capanga não derrotado daquele tipo ataca, na ordem pelo mapa da esquerda para a direita e depois de cima para baixo (como ler um livro)."),
          rl("Every effect", "each time a Henchman's ability resolves, perform all of its listed effects, including status effects it inflicts or gains.", "Todos os efeitos", "cada vez que a habilidade de um Capanga resolve, execute todos os efeitos listados, inclusive efeitos de status infligidos ou ganhos."),
          rl("3 · Unstoppable Threat", "finally, if the roll contains its roll objective, it activates its Offensive Ability.", "3 · Ameaça Imparável", "por fim, se a rolagem contém o objetivo dela, ela ativa a Habilidade Ofensiva."),
          interpretation("the one roll is compared separately with every panel, so the same die can help several panels; within one objective each pictured symbol needs its own die.", "a única rolagem é comparada separadamente com cada painel, então o mesmo dado pode servir a vários painéis; dentro de um objetivo, cada símbolo ilustrado precisa do próprio dado.")
        ], ["m7", "m9"]),
        infoCard(t("ENEMY DICE", "DADOS INIMIGOS"), t("Faces", "Faces"), [
          `${g("die-strike", "Strike face", "face Strike")} ${rl("1, 2, 3", "Strike.", "1, 2, 3", "Strike.")}`,
          `${g("die-vortex", "Vortex face", "face Vortex")} ${rl("4, 5", "Vortex.", "4, 5", "Vortex.")}`,
          `${g("die-hedron", "Hedron face", "face Hedron")} ${rl("6", "Hedron.", "6", "Hedron.")}`,
          t("The numbers matter for effects that change a die's value and, in Boss Fights, for where the red dice drop Boost Tiles.", "Os números importam para efeitos que mudam o valor de um dado e, nas Lutas contra o Chefe, para onde os dados vermelhos soltam Fichas de Boost.")
        ], ["m12", "m10"]),
        infoCard(t("MULTI-STRIKE", "MULTI-STRIKE"), `${g("multi-strike", "Multi-Strike icon", "ícone Multi-Strike")} ${t("One Attack per Hero in reach", "Um Ataque por Herói ao alcance")}`, [
          t("Most Henchman abilities are Multi-Strike Attacks: the Henchman resolves the Attack against every adjacent Hero (Melee Attack) or against every Hero on the map (Range Attack).", "A maioria das habilidades de Capanga são Ataques Multi-Strike: o Capanga resolve o Ataque contra cada Herói adjacente (Ataque Melee) ou contra cada Herói no mapa (Ataque Range)."),
          t("If a Multi-Strike Attack cannot target any Hero, it is not resolved at all — none of its effects happen.", "Se um Ataque Multi-Strike não pode mirar nenhum Herói, ele não é resolvido — nenhum dos efeitos acontece."),
          t("Against several Heroes, resolve them in turn order.", "Contra vários Heróis, resolva em ordem de turno."),
          onBoard("an enemy ability that is not Multi-Strike says on its panel whom it affects.", "uma habilidade inimiga que não é Multi-Strike diz no painel quem ela afeta.")
        ], ["m7", "m9"]),
        infoCard(t("DEFENDING", "DEFESA"), t("Hero Defense Rolls", "Rolagens de Defesa dos Heróis"), [
          t("A Hero may make a Defense Roll against each defendable enemy Attack that targets them — one roll per Attack.", "Um Herói pode fazer uma Rolagem de Defesa contra cada Ataque inimigo defensável que o mira — uma rolagem por Ataque."),
          t("Always allowed against an adjacent attacker; against a non-adjacent attacker you must gain Range first.", "Sempre permitido contra um atacante adjacente; contra um atacante não adjacente você precisa ganhar Range antes."),
          t("If an Attack targets several Heroes, make the Defense Rolls in turn order.", "Se um Ataque mira vários Heróis, façam as Rolagens de Defesa em ordem de turno."),
          t("If an enemy is defeated during a Defense Roll (by damage the defense deals back), its Attack still finishes against all Heroes originally targeted.", "Se um inimigo é derrotado durante uma Rolagem de Defesa (pelo dano que a defesa devolve), o Ataque dele ainda termina contra todos os Heróis originalmente mirados."),
          t("Shield tokens held by a Hero work against defendable damage whatever the distance.", "Marcadores Shield de um Herói funcionam contra dano defensável a qualquer distância."),
          interpretation("each enemy Attack against a Hero is resolved on its own — effects, Defense Roll, last chance to react, then its damage is applied — before the next Attack.", "cada Ataque inimigo contra um Herói é resolvido separadamente — efeitos, Rolagem de Defesa, última chance de reagir, e então o dano é aplicado — antes do Ataque seguinte.")
        ], ["m7", "m12"])
      ])}
      ${artRow(figure("enemy-roll", t("Missions p. 7: one roll (Vortex 5, Hedron 6, Strike 1, Strike 3, Strike 1) activates Cult Thugs (1), Hellfire Club (2) and the Sniper (3); Strike Team needs Strike + 2 Vortex and does nothing", "Missões p. 7: uma rolagem (Vortex 5, Hedron 6, Strike 1, Strike 3, Strike 1) ativa Cult Thugs (1), Hellfire Club (2) e o Sniper (3); a Strike Team precisa de Strike + 2 Vortex e não faz nada")))}`;
  }

  // ---------- missions: boss fights (missions p. 10) ----------

  function bossSection() {
    return `
      ${sectionHeading("boss", t("Boss Fights", "Lutas contra o Chefe"), ["m10", "m8"])}
      ${grid([
        infoCard(t("OVERVIEW", "VISÃO GERAL"), t("Fighting the villain", "Enfrentando o vilão"), [
          t("In a Boss Fight you try to defeat a powerful villain, usually by reducing their Health (tracked on the Boss Health Dial) to 0. It typically begins on Side 2, after the Side 1 Mission Run — but not always.", "Numa Luta contra o Chefe vocês tentam derrotar um vilão poderoso, em geral reduzindo a Vida dele (marcada no mostrador Boss Health) a 0. Em geral começa no Lado 2, depois da Incursão do Lado 1 — mas nem sempre."),
          t("The round phases are the same as in a Mission Run.", "As fases da rodada são as mesmas de uma Incursão."),
          onBoard("the Boss's starting Health, its Attacks with their roll objectives and CRIT effects, the Boss Defense, Boss Setup and Boss Crisis Abilities are read on the Mission Board; the rulebook does not list them.", "a Vida inicial do Chefe, os Ataques com os objetivos de rolagem e efeitos CRIT, a Boss Defense, o Boss Setup e as Habilidades de Crise do Chefe são lidos no Tabuleiro de Missão; o livro não os lista.")
        ], ["m10"]),
        infoCard(t("BOSS DEFENSE", "DEFESA DO CHEFE"), t("Automatic, no roll", "Automática, sem rolagem"), [
          t("Unlike Henchmen, Bosses have a Defensive Ability.", "Ao contrário dos Capangas, os Chefes têm uma Habilidade Defensiva."),
          t("When hit with a defendable Attack, the Boss automatically activates its “Boss Defense” ability — no roll is required — once for each Attack.", "Quando atingido por um Ataque defensável, o Chefe ativa automaticamente a habilidade “Boss Defense” — sem rolagem — uma vez para cada Ataque."),
          t("Resolve the defense first, then apply any other effects such as Shield.", "Resolva primeiro a defesa e depois aplique outros efeitos, como Shield."),
          t("Some Bosses have a “Unique Defense” with special activation rules; it is resolved last instead of first. Read it carefully on the board.", "Alguns Chefes têm uma “Unique Defense” com regras especiais de ativação; ela é resolvida por último, não primeiro. Leia com atenção no tabuleiro."),
          t("A Boss Defense may be Melee or Range: read its text to see which Heroes it can affect.", "Uma Boss Defense pode ser Melee ou Range: leia o texto para saber quais Heróis ela pode afetar.")
        ], ["m10", "m12"]),
        infoCard(t("BOOST TILES", "FICHAS DE BOOST"), t("Face up and face down", "Viradas para cima e para baixo"), [
          t("During a Boss Fight there are both face-up and face-down Boost Tiles on the map.", "Numa Luta contra o Chefe há Fichas de Boost viradas para cima e para baixo no mapa."),
          t("Pick up ALL Boost Tiles on the space where you end your move.", "Pegue TODAS as Fichas de Boost do espaço onde termina o movimento."),
          rl("Face-up tiles", "resolve immediately, then discard.", "Viradas para cima", "resolva na hora e descarte."),
          rl("Face-down tiles", "place them face down on your Health Dial; you only get them after the Boss's next Attack attempt — and until then they expose you to the CRIT.", "Viradas para baixo", "ponha-as viradas para baixo no seu mostrador de Vida; você só as recebe depois da próxima tentativa de Ataque do Chefe — e até lá elas te expõem ao CRIT.")
        ], ["m8", "m10"]),
        infoCard(t("ENEMY ROLL PHASE", "FASE DE ROLAGEM INIMIGA"), t("When a Boss attacks", "Quando um Chefe ataca"), [
          rl("Roll", `the same Enemy Dice pool (2 red + ${blackDice()} black), once.`, "Role", `o mesmo conjunto de Dados Inimigos (2 vermelhos + ${blackDice()} pretos), uma vez.`),
          rl("Alter", "Heroes may alter the dice using cards or other effects.", "Altere", "os Heróis podem alterar os dados com cartas ou outros efeitos."),
          rl("Red dice", "for each Red Die, place a face-down Boost Tile from the draw pile on the numbered map space matching that die's value (both may land on the same space). If tiles are already there, add the new ones beneath them.", "Dados vermelhos", "para cada Dado Vermelho, ponha uma Ficha de Boost virada para baixo, da pilha de compra, no espaço numerado do mapa igual ao valor do dado (as duas podem cair no mesmo espaço). Se já há fichas ali, ponha as novas por baixo."),
          rl("Important", "a Boost Tile placed beneath a Hero is NOT collected.", "Importante", "uma Ficha de Boost colocada sob um Herói NÃO é pega."),
          interpretation("that Hero collects it at the end of a later Movement Phase if they are on that space then — staying put counts, since tiles are collected on the space where you end the phase.", "esse Herói a pega ao fim de uma Fase de Movimento posterior se estiver naquele espaço — ficar parado conta, pois as fichas são pegas no espaço onde você termina a fase."),
          rl("Compare", "check the whole roll — red and black dice alike, as in the rulebook's example — against the Boss's Attacks from left to right and activate ONLY the first one whose roll objective is matched. No match = no Attack.", "Compare", "confira a rolagem inteira — dados vermelhos e pretos igualmente, como no exemplo do livro — com os Ataques do Chefe da esquerda para a direita e ative SÓ o primeiro cujo objetivo de rolagem foi atingido. Sem correspondência = sem Ataque."),
          rl("CRIT", "the activated Attack adds its CRIT effect against each Attacked Hero who is standing on a face-down Boost Tile or has one or more face-down tiles on their Health Dial — once, however many tiles.", "CRIT", "o Ataque ativado soma o efeito CRIT contra cada Herói Atacado que está sobre uma Ficha de Boost virada para baixo ou tem uma ou mais no mostrador de Vida — uma vez, não importa quantas fichas."),
          rl("Defend", "each Attacked Hero makes their Defense Roll if able, in turn order.", "Defenda", "cada Herói Atacado faz a Rolagem de Defesa, se puder, em ordem de turno."),
          rl("Reveal", "then all Heroes reveal the face-down Boost Tiles on their Health Dial, resolve them and discard them — even if the Boss activated no Attack (it is “after the Boss attempts to Attack”).", "Revele", "depois todos os Heróis revelam as Fichas de Boost viradas para baixo no mostrador de Vida, resolvem e descartam — mesmo que o Chefe não tenha ativado Ataque (é “depois que o Chefe tenta Atacar”).")
        ], ["m10", "m8"]),
        infoCard(t("ENDING", "FIM"), t("Ending a Boss Fight", "Encerrando uma Luta contra o Chefe"), [
          t("Each Boss Fight has a Main Objective — typically reduce the Boss to 0 Health, though some have other requirements.", "Cada Luta contra o Chefe tem um Objetivo Principal — em geral reduzir o Chefe a 0 de Vida, embora algumas tenham outras exigências."),
          t("Fulfilling it completes that side of the Mission, ending it as the current round phase concludes.", "Cumpri-lo conclui aquele lado da Missão, encerrando-o quando a fase da rodada atual termina."),
          rl("On Side 1", "follow “Completing map sides” (see Winning & losing).", "No Lado 1", "siga “Passando de lado” (veja Vitória e derrota)."),
          rl("On Side 2", "you win!", "No Lado 2", "vocês vencem!")
        ], ["m10", "m8"], "victory-card")
      ])}`;
  }

  // ---------- missions: crisis clock (missions p. 5, 7) ----------

  function crisisSection() {
    const steps = clockSteps();
    return `
      ${sectionHeading("crisis", t("Crisis Clock", "Relógio de Crise"), ["m5", "m7", "m12"])}
      ${grid([
        infoCard(t("ROUND PHASE 8", "FASE 8 DA RODADA"), t("Advancing the hand", "Avançando o ponteiro"), [
          t(`After the enemy turn, rotate the Crisis Clock Hand clockwise a number of segments equal to the number of Heroes${harder() ? ", plus one for the “+1” hand" : ""}: ${steps} here.`, `Depois do turno inimigo, gire o ponteiro do Relógio de Crise em sentido horário um número de segmentos igual ao número de Heróis${harder() ? ", mais um pelo ponteiro “+1”" : ""}: ${steps} aqui.`),
          t("Count Heroes who have left through an EXIT too: the number of Heroes considered playing never changes.", "Conte também os Heróis que já saíram por um EXIT: o número de Heróis considerados em jogo nunca muda."),
          t("Each segment the hand advances THROUGH or ENDS on activates its Crisis Ability. The segment it started on does not.", "Cada segmento que o ponteiro ATRAVESSA ou em que PARA ativa a Habilidade de Crise dele. O segmento de onde saiu não."),
          t("An empty segment has no effect.", "Um segmento vazio não tem efeito.")
        ], ["m7", "m8", "m12"]),
        infoCard(t("CRISIS ABILITIES", "HABILIDADES DE CRISE"), t("What a segment does", "O que um segmento faz"), [
          rl("A printed effect", "such as LOSE 1 CP or DISCARD 1 card: it activates for ALL Heroes.", "Um efeito impresso", "como LOSE 1 CP (perca 1 CP) ou DISCARD 1 (descarte 1 carta): ativa para TODOS os Heróis."),
          rl("An enemy-type icon", "each undefeated enemy of that type activates its Crisis Ability (so two Henchmen = twice). Crisis Abilities can usually target anyone, but some say they only affect Heroes within Melee.", "Um ícone de tipo de inimigo", "cada inimigo não derrotado daquele tipo ativa a Habilidade de Crise (logo, dois Capangas = duas vezes). Habilidades de Crise em geral podem mirar qualquer um, mas algumas dizem que só afetam Heróis em Melee."),
          rl("Other icons", "some are defined above the Crisis Clock on the board (for example Boss Crisis Abilities).", "Outros ícones", "alguns são definidos acima do Relógio de Crise no tabuleiro (por exemplo Habilidades de Crise do Chefe)."),
          rl("Damage", "all damage effects of the phase accumulate against each target and are resolved together at the end of the phase.", "Dano", "todos os efeitos de dano da fase se acumulam contra cada alvo e são resolvidos juntos ao fim da fase."),
          rl("Everything else", "is resolved in clockwise order, segment by segment.", "Todo o resto", "é resolvido em sentido horário, segmento a segmento."),
          t("When a Crisis Ability deals collateral damage (as in the rulebook's examples), there is no Defensive Ability and no Shield against it.", "Quando uma Habilidade de Crise causa dano colateral (como nos exemplos do livro), não há Habilidade Defensiva nem Shield contra ele.")
        ], ["m7", "m10"])
      ])}
      ${artRow(figure("crisis-clock", t("Missions p. 7: with 3 Heroes the hand advances 3 segments — F (discard 1 card each), G (empty) and H (the Cult Thugs icon, so their Crisis Ability i activates)", "Missões p. 7: com 3 Heróis o ponteiro avança 3 segmentos — F (cada um descarta 1 carta), G (vazio) e H (o ícone dos Cult Thugs, então a Habilidade de Crise i deles ativa)")))}`;
  }

  // ---------- missions: momentum, boost tiles, allies (missions p. 8) ----------

  function momentumSection() {
    return `
      ${sectionHeading("momentum", t("Momentum, Boost Tiles & Allies", "Momentum, Fichas de Boost e Aliados"), ["m8", "m7", "m9"])}
      ${grid([
        infoCard(t("MOMENTUM", "MOMENTUM"), `${g("momentum", "Momentum icon", "ícone de Momentum")} ${t("A new currency", "Uma nova moeda")}`, [
          t("Tracked on your own Momentum Dial; you can have at most 15.", "Marcado no seu mostrador de Momentum; você pode ter no máximo 15."),
          rl("Gain it", solo() ? "by defeating Henchmen (2 each), collecting Boost Tiles, completing objectives, giving up a status effect on a targeted enemy (1), and more." : "by defeating Henchmen (2 each, shared out by the Start Player), collecting Boost Tiles, completing objectives, giving up a status effect on a targeted enemy (1), and more.", "Ganhe", solo() ? "derrotando Capangas (2 cada), pegando Fichas de Boost, cumprindo objetivos, abrindo mão de um efeito de status num inimigo alvo (1) e mais." : "derrotando Capangas (2 cada, repartidos pelo Jogador Inicial), pegando Fichas de Boost, cumprindo objetivos, abrindo mão de um efeito de status num inimigo alvo (1) e mais."),
          rl("Momentum Actions", "listed on your Momentum Card; pay the Momentum shown to the left of an action to perform it. There is no limit to how many times per round you may pay, unless the action itself has a limit or is tied to a turn phase (“Recruit an Ally” only in a Main Phase).", "Ações de Momentum", "listadas na sua carta de Momentum; pague o Momentum indicado à esquerda de uma ação para executá-la. Não há limite de vezes por rodada, a menos que a própria ação tenha limite ou esteja ligada a uma fase do turno (“Recruit an Ally” só numa Fase Principal)."),
          rl("Ally powers", "often cost Momentum too.", "Poderes de Aliado", "muitas vezes também custam Momentum."),
          campaign()
            ? rl("Card level", "you use the Momentum Card unlocked on your Perk Sheet; Momentum Perks must be gained in their listed order.", "Nível da carta", "você usa a carta de Momentum desbloqueada na sua Ficha de Vantagens; as Vantagens de Momentum devem ser obtidas na ordem listada.")
            : rl("Card level", "everyone starts with the Level 1 Momentum Card; higher levels are unlocked with Momentum Perks.", "Nível da carta", "todos começam com a carta de Momentum Nível 1; níveis maiores são desbloqueados com Vantagens de Momentum."),
          onBoard("the actions and their costs are printed on your Momentum Card. The Level 1 card pictured in the rulebook lists “Recruit an Ally” (pay the Ally's cost; maximum of 1 Ally) and “Gain Range” for 1 Momentum.", "as ações e os custos estão impressos na sua carta de Momentum. A carta de Nível 1 ilustrada no livro lista “Recruit an Ally” (pague o custo do Aliado; máximo de 1 Aliado) e “Gain Range” por 1 de Momentum.")
        ], ["m7", "m8", "m9"]),
        infoCard(t("BOOST TILES", "FICHAS DE BOOST"), `${g("boost-facedown", "Boost Tile back", "verso de Ficha de Boost")} ${t("Pick-ups on the map", "Bônus no mapa")}`, [
          t("Placed face up around the map during the setup of either side. A tile gives the Hero who picks it up the effect shown on its face-up side.", "Colocadas viradas para cima pelo mapa na preparação de cada lado. Uma ficha dá ao Herói que a pega o efeito mostrado no lado virado para cima."),
          t("Collect all Boost Tiles on the space you are in at the end of your Movement Phase.", "Pegue todas as Fichas de Boost do espaço em que está ao fim da sua Fase de Movimento."),
          rl("Face up", "resolve at once, then discard it face up to the discard stack beside the board.", "Virada para cima", "resolva na hora e descarte-a virada para cima na pilha de descarte ao lado do tabuleiro."),
          rl("Face down", "only in Boss Fights: keep it face down on your Health Dial until after the Boss's next Attack attempt.", "Virada para baixo", "só em Lutas contra o Chefe: deixe-a virada para baixo no mostrador de Vida até depois da próxima tentativa de Ataque do Chefe."),
          rl("Draw pile empty", "flip the discard stack face down and reshuffle it into a new draw pile.", "Pilha de compra vazia", "vire a pilha de descarte para baixo e reembaralhe-a numa nova pilha de compra."),
          rl("Seven kinds", "gain CP, heal, gain Momentum, draw cards, gain a status effect, remove 1 status token from yourself OR gain 1 Momentum, transfer 1 status token between any two players OR gain 2 Momentum (pictured in Iconography).", "Sete tipos", "ganhar CP, curar, ganhar Momentum, comprar cartas, ganhar um efeito de status, remover 1 marcador de status de você OU ganhar 1 de Momentum, transferir 1 marcador de status entre dois jogadores quaisquer OU ganhar 2 de Momentum (ilustradas na Iconografia).")
        ], ["m8", "m10"]),
        infoCard(t("ALLIES", "ALIADOS"), t("Recruiting", "Recrutando"), [
          t("During either of your Main Phases:", "Em qualquer uma das suas Fases Principais:"),
          rl("1", "spend the Momentum cost of the Ally you want (top right of the card) and move it from the Ally HQ to your play area.", "1", "gaste o custo em Momentum do Aliado desejado (canto superior direito da carta) e mova-o do QG para a sua área."),
          rl("2", "replenish the Ally HQ immediately with the top card of the Ally Deck.", "2", "reponha o QG imediatamente com a carta do topo do Baralho de Aliados."),
          rl("3", "each Hero may have only ONE Ally in play by default (Perks can raise this). If you are already at your maximum, you may discard an Ally you have to the bottom of the Ally Deck to make room.", "3", "cada Herói só pode ter UM Aliado em jogo por padrão (Vantagens podem aumentar). Se já estiver no máximo, você pode descartar um Aliado seu para o fundo do Baralho de Aliados para abrir espaço.")
        ], ["m8"]),
        infoCard(t("ALLIES", "ALIADOS"), t("Using Ally powers", "Usando poderes de Aliado"), [
          t("Each power may be activated only once per round, and most only during a specific turn phase unless marked as an Instant Action. A Momentum cost, if any, is in the power text (“Spend 2”, “Exhaust 2”).", "Cada poder só pode ser ativado uma vez por rodada, e a maioria só numa fase específica do turno, a menos que marcado como Ação Instantânea. O custo em Momentum, se houver, está no texto do poder (“Spend 2”, “Exhaust 2”)."),
          rl("Recruit", "a one-time benefit gained immediately when the Ally is recruited.", "Recruit", "um benefício único recebido assim que o Aliado é recrutado."),
          rl("Kicker (Offense / Defense)", "during your Offensive or Defensive Roll Phase, once per round: if you meet its requirements (if any), it adds a bonus to your normal ability.", "Kicker (Offense / Defense)", "na sua Fase de Rolagem Ofensiva ou Defensiva, uma vez por rodada: se você cumpre os requisitos (se houver), soma um bônus à sua habilidade normal."),
          rl("Offensive ability", "a new Offensive Ability that counts as one on your Hero Board. It says if it is Range; otherwise Melee. You still activate only one Offensive Ability per Roll Phase.", "Offensive ability", "uma nova Habilidade Ofensiva que conta como uma do seu Tabuleiro do Herói. Ela diz se é Range; senão, é Melee. Você continua ativando só uma Habilidade Ofensiva por Fase de Rolagem."),
          rl("Circle / diamond dice", "in an Ally's roll objective these stand for matching symbols of any type on your hero's dice (for example “2 of one symbol, 3 of another”).", "Dados com círculo / losango", "no objetivo de rolagem de um Aliado representam símbolos iguais de qualquer tipo nos dados do seu herói (por exemplo “2 de um símbolo, 3 de outro”)."),
          rl("Exhaust", "activated by discarding the Ally to the bottom of the Ally Deck.", "Exhaust", "ativado descartando o Aliado para o fundo do Baralho de Aliados."),
          rl("+Exhaust", "also discards the Ally, but may only be activated at the same time as the power listed directly above it.", "+Exhaust", "também descarta o Aliado, mas só pode ser ativado junto com o poder listado logo acima dele."),
          onBoard("each Ally card prints its own cost and powers.", "cada carta de Aliado traz o próprio custo e poderes.")
        ], ["m8"])
      ])}
      ${artRow(
        figure("ally-cards", t("Missions p. 8: Ally cards (Cloak, cost 3; Archangel, cost 2) — A Recruit, B Kicker, C Offensive ability, D Exhaust, E +Exhaust", "Missões p. 8: cartas de Aliado (Cloak, custo 3; Archangel, custo 2) — A Recruit, B Kicker, C Offensive ability, D Exhaust, E +Exhaust")),
        figure("momentum-cards", t("Missions p. 8: Momentum Cards, levels 1–3, with their action lists", "Missões p. 8: cartas de Momentum, níveis 1–3, com as listas de ações"))
      )}`;
  }

  // ---------- missions: perks & difficulty (missions p. 4, 11, 12) ----------

  function perksSection() {
    const double = easier() && state.easyPoints === "yes";
    return `
      ${sectionHeading("perks", t("Perk Points, Perk Sheets & difficulty", "Pontos de Vantagem, Fichas de Vantagens e dificuldade"), ["m4", "m11", "m12"])}
      ${grid([
        infoCard(t("AFTER THE MISSION", "DEPOIS DA MISSÃO"), t("Earning Perk Points (PP)", "Ganhando Pontos de Vantagem (PP)"), [
          t("Win or lose, every player earns one of these rewards:", "Ganhando ou perdendo, cada jogador recebe uma destas recompensas:"),
          rl(double ? "0 PP" : "0 PP", "you did not complete any side.", "0 PP", "vocês não completaram nenhum lado."),
          rl(double ? "1 PP (doubled: 2)" : "1 PP", "you completed only Side 1.", double ? "1 PP (em dobro: 2)" : "1 PP", "vocês completaram só o Lado 1."),
          rl(double ? "2 PP (doubled: 4)" : "2 PP", "you completed Side 1 and Side 2.", double ? "2 PP (em dobro: 4)" : "2 PP", "vocês completaram o Lado 1 e o Lado 2."),
          rl(double ? "3 PP (doubled: 6)" : "3 PP", "you completed both sides AND earned the Perfect Reward listed on Side 1.", double ? "3 PP (em dobro: 6)" : "3 PP", "vocês completaram os dois lados E ganharam a Recompensa Perfeita listada no Lado 1."),
          double ? t("Decreased difficulty: all Perk Points earned are doubled, as shown.", "Dificuldade reduzida: todos os Pontos de Vantagem ganhos são dobrados, como mostrado.") : "",
          rl("Perfecting", "the first time you earn the 3 PP reward on a Mission, tick that Mission's box on the back of your Perk Sheet. You cannot earn the 3 PP for the same Mission again, but the 2 PP for winning and any in-game Perfect rewards still apply.", "Missão Perfeita", "na primeira vez que ganhar a recompensa de 3 PP numa Missão, marque a caixa daquela Missão no verso da Ficha de Vantagens. Você não pode ganhar os 3 PP pela mesma Missão de novo, mas os 2 PP da vitória e as recompensas Perfeitas dentro da partida continuam valendo.")
        ], double ? ["m11", "m12"] : ["m11"]),
        infoCard(t("PERK SHEETS", "FICHAS DE VANTAGENS"), t("Spending Perk Points", "Gastando Pontos de Vantagem"), [
          campaign() ? "" : t("After your first Mission, every player tears a Perk Sheet off the pad and writes their name at the top. The sheet belongs to the player, whatever hero they play and whoever they play with.", "Depois da primeira Missão, cada jogador destaca uma Ficha de Vantagens do bloco e escreve o nome no topo. A ficha é do jogador, não importa o herói nem com quem jogue."),
          t("After each Mission ALL earned PP must be spent, with a pen or dark pencil: each PP fills one circle.", "Depois de cada Missão TODOS os PP ganhos devem ser gastos, a caneta ou lápis escuro: cada PP preenche um círculo."),
          t(`You may fill circles in any column whose difficulty matches the Mission you just played or is lower${harder() ? ` — with increased difficulty that is the Mission's level + ${state.level}` : ""}.`, `Você pode preencher círculos em qualquer coluna cuja dificuldade seja igual à da Missão que acabou de jogar ou menor${harder() ? ` — com a dificuldade aumentada, é o nível da Missão + ${state.level}` : ""}.`),
          t("When all circles of a Perk are filled, you permanently gain that Perk for all your future Missions. All Perks are cumulative.", "Quando todos os círculos de uma Vantagem estão preenchidos, você a ganha permanentemente para todas as Missões futuras. Todas as Vantagens são cumulativas."),
          t("You may unlock any Perk without the earlier ones in its row — except the top row: each Momentum Card Perk replaces the previous level, so they must be gained in order.", "Você pode desbloquear qualquer Vantagem sem as anteriores da linha — exceto a linha de cima: cada Vantagem de carta de Momentum substitui o nível anterior, então devem ser obtidas em ordem."),
          onBoard("the Perks themselves (rows Momentum, Grit, Leadership, Heroism, Feats; columns by difficulty) are printed on the Perk Sheet.", "as Vantagens em si (linhas Momentum, Grit, Leadership, Heroism, Feats; colunas por dificuldade) estão impressas na Ficha de Vantagens.")
        ], ["m11"]),
        infoCard(t("NEW GAME+", "NEW GAME+"), t("Mythic cards", "Cartas Míticas"), [
          t("New Game+ is the sixth column of the Perk Sheet.", "New Game+ é a sexta coluna da Ficha de Vantagens."),
          t("The first time you Perfect a Mission on Side 1 and also complete Side 2, you may fill the New Game+ circle matching that Mission's difficulty level. This does not cost PP.", "Na primeira vez que você ganha a Recompensa Perfeita de uma Missão no Lado 1 e também completa o Lado 2, pode preencher o círculo New Game+ do nível de dificuldade daquela Missão. Isso não custa PP."),
          t("Once all 5 circles are filled you unlock a Mythic Ability: in all future Missions you may start with one of the 4 Mythic cards in the box (or your hero's own, with the promo pack).", "Com os 5 círculos preenchidos você desbloqueia uma Habilidade Mítica: em todas as Missões futuras pode começar com uma das 4 cartas Míticas da caixa (ou a do seu herói, com o pacote promocional)."),
          t("Then, if you wish, start a new sheet: discard the old one (its Perks and Perfected record are no longer used), take a new sheet and add a “+” next to your name — a “+” also gives access to a Mythic Ability.", "Depois, se quiser, comece uma ficha nova: descarte a antiga (as Vantagens e o registro de Missões Perfeitas dela não valem mais), pegue uma nova e ponha um “+” ao lado do nome — um “+” também dá acesso a uma Habilidade Mítica."),
          onBoard("what a Mythic card does is printed on the card.", "o que uma carta Mítica faz está impresso na carta.")
        ], ["m11", "m4"]),
        infoCard(t("DIFFICULTY", "DIFICULDADE"), t("Choosing a Mission", "Escolhendo uma Missão"), [
          t("The coloured die in the top-left corner of each map is the Mission's level:", "O dado colorido no canto superior esquerdo de cada mapa é o nível da Missão:"),
          rl("1 · Intro", "easy for anyone, including new players.", "1 · Intro", "fácil para qualquer um, inclusive iniciantes."),
          rl("2 · Moderate", "a moderate challenge for veterans without Perks; quite hard for new players without Perks.", "2 · Moderate", "um desafio moderado para veteranos sem Vantagens; bem difícil para iniciantes sem Vantagens."),
          rl("3 · Hard", "very challenging without Perks; some Perks are likely required.", "3 · Hard", "muito desafiadora sem Vantagens; algumas Vantagens provavelmente são necessárias."),
          rl("4 · Brutal", "nearly unbeatable without Perks; earn many first.", "4 · Brutal", "quase imbatível sem Vantagens; ganhe muitas antes."),
          rl("5 · Ruthless", "incredibly challenging even for veterans with many Perks.", "5 · Ruthless", "incrivelmente desafiadora mesmo para veteranos com muitas Vantagens."),
          rl("6 · Insane", "no Mission was made at this level.", "6 · Insane", "nenhuma Missão foi feita neste nível.")
        ], ["m4"]),
        harder() ? infoCard(t("THIS MATCH", "ESTA PARTIDA"), t(`Increased difficulty: +${state.level}`, `Dificuldade aumentada: +${state.level}`), [
          rl("1", `${state.level} extra Black Enemy ${state.level > 1 ? "Dice" : "Die"} in the pool (2 red + ${blackDice()} black).`, "1", `${state.level} Dado${state.level > 1 ? "s" : ""} Inimigo${state.level > 1 ? "s" : ""} preto${state.level > 1 ? "s" : ""} extra${state.level > 1 ? "s" : ""} no conjunto (2 vermelhos + ${blackDice()} pretos).`),
          rl("2", `Oppression ${state.level} on each Hero (maximum 4): Attacks against them deal +${state.level} damage.`, "2", `Oppression ${state.level} em cada Herói (máximo 4): Ataques contra eles causam +${state.level} de dano.`),
          rl("3", `Henchmen start with +${state.level * 2} Health (2 per level, maximum +8).`, "3", `Capangas começam com +${state.level * 2} de Vida (2 por nível, máximo +8).`),
          rl("4", `the “+1” Crisis Clock Hand: the clock moves ${clockSteps()} segments each Crisis Clock Phase. The same hand is used for every level.`, "4", `o ponteiro “+1” do Relógio de Crise: o relógio anda ${clockSteps()} segmentos em cada Fase do Relógio de Crise. O mesmo ponteiro vale para todos os níveis.`),
          rl("5", "Boss Setup instructions apply a special effect for each Oppression on the Heroes.", "5", "as instruções de Boss Setup aplicam um efeito especial para cada Oppression nos Heróis."),
          rl("Reward", `Total Difficulty = Mission level + ${state.level}; you may spend all PP from this Mission in that column.`, "Recompensa", `Dificuldade Total = nível da Missão + ${state.level}; você pode gastar todos os PP desta Missão nessa coluna.`)
        ], ["m12"]) : "",
        easier() ? infoCard(t("THIS MATCH", "ESTA PARTIDA"), t("Decreased difficulty", "Dificuldade reduzida"), [
          rl("Double Perk Points", state.easyPoints === "yes" ? "on." : "off.", "Pontos de Vantagem em dobro", state.easyPoints === "yes" ? "ligado." : "desligado."),
          rl("+10 starting Health", state.easyHealth === "yes" ? `on: ${startHealth()} each.` : "off.", "+10 de Vida inicial", state.easyHealth === "yes" ? `ligado: ${startHealth()} cada.` : "desligado."),
          rl("+5 starting Momentum", state.easyMomentum === "yes" ? "on." : "off.", "+5 de Momentum inicial", state.easyMomentum === "yes" ? "ligado." : "desligado."),
          t("The booklet lets you choose one or more of the three.", "O livro permite escolher uma ou mais das três.")
        ], ["m12"]) : ""
      ])}
      ${artRow(figure("perk-sheet", t("Missions p. 11: a Perk Sheet with the rulebook's examples G, H and J marked", "Missões p. 11: uma Ficha de Vantagens com os exemplos G, H e J do livro marcados"), true))}`;
  }

  // ---------- iconography ----------

  function iconCard(file, nameEn, namePt, bodyEn, bodyPt, pages, wide = false) {
    const title = t(nameEn, namePt);
    return `
      <article class="icon-card${wide ? " mdt-icon-wide" : ""}">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}.webp" alt="${title}" loading="lazy"></span>
        <div><strong>${title}</strong><p>${t(bodyEn, bodyPt)}</p>${refs(pages)}</div>
      </article>`;
  }

  function iconsSection() {
    const core = `
      <h3 class="subhead">${t("Resources", "Recursos")}</h3>
      <div class="icon-grid">
        ${iconCard("cp", "Combat Points (CP)", "Pontos de Combate (CP)", "Spent mainly to pay for cards. A number on this icon is an amount of CP. Maximum 15.", "Gastos principalmente para pagar cartas. Um número neste ícone é uma quantidade de CP. Máximo 15.", ["c4", "c16"])}
        ${iconCard("cp-gain", "1 CP", "1 CP", "The CP icon with a number: gain, pay or lose that many CP (here 1, as in the Income Phase and when selling a card).", "O ícone de CP com um número: ganhe, pague ou perca essa quantidade de CP (aqui 1, como na Fase de Renda e ao vender uma carta).", ["c4", "c7"])}
        ${iconCard("health", "Health", "Vida (Health)", "A heart with a number is an amount of Health (the picture shows 50).", "Um coração com um número é uma quantidade de Vida (a figura mostra 50).", ["c3", "c11"])}
        ${iconCard("defeated", "0 Health", "0 de Vida", "A player reduced to this is defeated.", "Um jogador reduzido a isto está derrotado.", ["c2", "c4"])}
        ${iconCard("heal", "Heal", "Curar (Heal)", "A green heart with a number: raise your Health Dial by that much, up to 10 above your starting Health.", "Um coração verde com um número: aumente o mostrador de Vida nesse valor, até 10 acima da Vida inicial.", ["c12", "c16"])}
        ${iconCard("card", "Card", "Carta", "A card with a number: draw (or, where the text says, discard) that many cards. With a 6 it marks the hand limit.", "Uma carta com um número: compre (ou, onde o texto disser, descarte) essa quantidade de cartas. Com um 6, marca o limite de mão.", ["c4", "c7"])}
      </div>
      <h3 class="subhead">${t("Cards and phases", "Cartas e fases")}</h3>
      <div class="icon-grid">
        ${iconCard("upgrade", "Hero Upgrade", "Melhoria de Herói", "On the left of a card: a Hero Upgrade, played in your Main Phases onto the board space with the same name.", "À esquerda de uma carta: uma Melhoria de Herói, jogada nas suas Fases Principais sobre o espaço do tabuleiro com o mesmo nome.", ["c8"])}
        ${iconCard("action", "Action card", "Carta de Ação", "The star marks a single-use Action card; its colour (blue, orange, red) tells when it can be played.", "A estrela marca uma carta de Ação de uso único; a cor (azul, laranja, vermelha) diz quando pode ser jogada.", ["c8"])}
        ${iconCard("phase-main", "Main Phase", "Fase Principal", "Marks Main Phase (1) and (2), and cards playable only then, on your own turn.", "Marca as Fases Principais (1) e (2) e as cartas jogáveis só nelas, no seu turno.", ["c4", "c9"])}
        ${iconCard("phase-roll", "Roll Phase", "Fase de Rolagem", "Marks the Roll Phases and the cards playable during a roll, on any player's turn.", "Marca as Fases de Rolagem e as cartas jogáveis durante uma rolagem, no turno de qualquer jogador.", ["c4", "c9"])}
        ${iconCard("instant", "Instant", "Instantânea", "On the left of a red card: playable at any time during any player's turn; cannot be interrupted.", "À esquerda de uma carta vermelha: jogável a qualquer momento no turno de qualquer jogador; não pode ser interrompida.", ["c8"])}
        ${iconCard("defensive-upgrade", "Defensive Ability", "Habilidade Defensiva", "The green shield marks the Defensive Ability and its upgrades (green border).", "O escudo verde marca a Habilidade Defensiva e as melhorias dela (borda verde).", ["c5", "c8"])}
        ${iconCard("passive-upgrade", "Passive Ability", "Habilidade Passiva", "The purple pawn marks the Passive Ability and its upgrades (purple border).", "O peão roxo marca a Habilidade Passiva e as melhorias dela (borda roxa).", ["c5", "c8"])}
      </div>
      <h3 class="subhead">${t("Dice and damage", "Dados e dano")}</h3>
      <div class="icon-grid">
        ${iconCard("die", "Roll dice", "Rolar dados", "After a number (“Roll 3 [die]”): roll that many dice once and apply what follows.", "Depois de um número (“Roll 3 [dado]”): role essa quantidade de dados uma vez e aplique o que segue.", ["c9", "c16"])}
        ${iconCard("dmg", "Normal damage", "Dano normal", "A black circle with a number, followed by “dmg”: defendable, avoidable and modifiable.", "Um círculo preto com um número, seguido de “dmg”: defensável, evitável e modificável.", ["c10"])}
        ${iconCard("dmg-undefendable", "Red-circle damage", "Dano de círculo vermelho", "A red circle with a number: undefendable, pure, collateral or Ultimate damage — the word after it says which.", "Um círculo vermelho com um número: dano indefensável, puro, colateral ou Supremo — a palavra depois dele diz qual.", ["c10"])}
        ${iconCard("prevent", "Prevent damage", "Prevenir dano", "A blue shield with a number: prevent that much incoming damage.", "Um escudo azul com um número: previna esse valor do dano recebido.", ["c2", "c14"])}
        ${iconCard("prevent-half", "Prevent half", "Prevenir metade", "Prevent half of the incoming damage, rounded up; calculated last (see Damage math).", "Previna metade do dano recebido, arredondada para cima; calculado por último (veja Cálculo de dano).", ["c6", "c14"])}
        ${iconCard("small-straight", "Small Straight", "Sequência Pequena", "4 escalating dice: any 4 numbers in sequence.", "4 dados em escada: quaisquer 4 números em sequência.", ["c5", "c16"], true)}
        ${iconCard("large-straight", "Large Straight", "Sequência Grande", "5 escalating dice: any 5 numbers in sequence.", "5 dados em escada: quaisquer 5 números em sequência.", ["c5", "c16"], true)}
        ${iconCard("defense-roll", "Defense Roll", "Rolagem de Defesa", "On a Defensive Ability: how many dice the Defender rolls, a single time.", "Numa Habilidade Defensiva: quantos dados o Defensor rola, uma única vez.", ["c5", "c13"], true)}
      </div>`;
    const mission = `
      <h3 class="subhead">${t("Missions: map and tokens", "Missões: mapa e marcadores")}</h3>
      <div class="icon-grid">
        ${iconCard("melee", "Melee", "Melee (corpo a corpo)", "Only against an adjacent enemy or Hero. The default for Attacks and Defensive Abilities.", "Só contra um inimigo ou Herói adjacente. O padrão de Ataques e Habilidades Defensivas.", ["m4", "m6"])}
        ${iconCard("range", "Range", "Range (alcance)", "Any target on the map. Heroes gain it with Momentum or Allies.", "Qualquer alvo do mapa. Heróis o obtêm com Momentum ou Aliados.", ["m4", "m6"])}
        ${iconCard("multi-strike", "Multi-Strike", "Multi-Strike", "An enemy Attack resolved against every Hero in reach.", "Um Ataque inimigo resolvido contra cada Herói ao alcance.", ["m7"])}
        ${iconCard("momentum", "Momentum", "Momentum", "The Missions currency; a number on it is an amount. Maximum 15.", "A moeda de Missões; um número nele é uma quantidade. Máximo 15.", ["m8"])}
        ${iconCard("start-player", "Start Player Token", "Marcador de Jogador Inicial", solo() ? "With several Heroes it passes clockwise each round; solo, it stays with you." : "Passed clockwise each round; “turn order” starts from its holder.", solo() ? "Com vários Heróis ele passa em sentido horário a cada rodada; no solo, fica com você." : "Passado em sentido horário a cada rodada; a “ordem de turno” começa por quem o tem.", ["m5", "m6"])}
        ${iconCard("boost-space", "Boost space", "Espaço de Boost", "Printed on the map: put one Boost Tile here during setup.", "Impresso no mapa: ponha uma Ficha de Boost aqui na preparação.", ["m5"])}
        ${iconCard("boost-facedown", "Boost Tile (back)", "Ficha de Boost (verso)", "The face-down side; also the symbol used for Boost Tiles in the rules.", "O lado virado para baixo; também o símbolo usado para as Fichas de Boost nas regras.", ["m8", "m10"])}
        ${iconCard("defeat-tile", "Defeat Tile", "Ficha Defeat", "Covers the spaces of a defeated Henchman: they become empty spaces.", "Cobre os espaços de um Capanga derrotado: viram espaços vazios.", ["m6", "m9"])}
        ${iconCard("clear-tile", "Clear Tile", "Ficha Clear", "Used by some Missions; whether you may move onto it depends on the Mission's rules.", "Usada por algumas Missões; se você pode entrar nela depende das regras da Missão.", ["m6"])}
        ${iconCard("health-token", "Health Token", "Marcador de Vida", "Double-sided numbers (1/2 … 9/10) showing a Henchman's Health.", "Números dupla face (1/2 … 9/10) mostrando a Vida de um Capanga.", ["m5", "m9"])}
        ${iconCard("perk-circle", "Perk circle", "Círculo de Vantagem", "One circle on a Perk Sheet = one Perk Point to fill in.", "Um círculo na Ficha de Vantagens = um Ponto de Vantagem a preencher.", ["m11"])}
      </div>
      <h3 class="subhead">${t("Missions: enemies and Enemy Dice", "Missões: inimigos e Dados Inimigos")}</h3>
      <div class="icon-grid">
        ${iconCard("henchman-green", "Henchman type (green)", "Tipo de Capanga (verde)", "A Henchman on the map with a green hexagon uses the green info panel. Each Mission prints its own emblem inside the hexagon.", "Um Capanga no mapa com hexágono verde usa o painel verde. Cada Missão traz o próprio emblema dentro do hexágono.", ["m7", "m9"])}
        ${iconCard("henchman-blue", "Henchman type (blue)", "Tipo de Capanga (azul)", "Uses the blue info panel.", "Usa o painel azul.", ["m7", "m9"])}
        ${iconCard("henchman-magenta", "Henchman type (magenta)", "Tipo de Capanga (magenta)", "Uses the magenta info panel.", "Usa o painel magenta.", ["m7", "m9"])}
        ${iconCard("unstoppable", "Unstoppable Threat", "Ameaça Imparável", "Orange hexagon: cannot be targeted, damaged or given status effects.", "Hexágono laranja: não pode ser alvo, sofrer dano nem receber efeitos de status.", ["m7"])}
        ${iconCard("die-strike", "Strike", "Strike", "Enemy Die faces 1, 2 and 3.", "Faces 1, 2 e 3 do Dado Inimigo.", ["m12"])}
        ${iconCard("die-vortex", "Vortex", "Vortex", "Enemy Die faces 4 and 5.", "Faces 4 e 5 do Dado Inimigo.", ["m12"])}
        ${iconCard("die-hedron", "Hedron", "Hedron", "Enemy Die face 6.", "Face 6 do Dado Inimigo.", ["m12"])}
        ${iconCard("red-die", "Red Enemy Die", "Dado Inimigo vermelho", "2 in every pool. In a Boss Fight each drops a face-down Boost Tile on the space of its number.", "2 em todo conjunto. Numa Luta contra o Chefe cada um solta uma Ficha de Boost virada para baixo no espaço do seu número.", ["m4", "m10"])}
        ${iconCard("black-die", "Black Enemy Die", "Dado Inimigo preto", "1 plus 1 per Hero, plus 1 per level of increased difficulty.", "1 mais 1 por Herói, mais 1 por nível de dificuldade aumentada.", ["m4", "m12"])}
        ${iconCard("symbol-circle", "Any symbol (circle)", "Qualquer símbolo (círculo)", "On an Ally's roll objective: dice showing one matching symbol of any type on your hero's dice.", "No objetivo de rolagem de um Aliado: dados mostrando um mesmo símbolo de qualquer tipo dos dados do seu herói.", ["m8"])}
        ${iconCard("symbol-diamond", "Another symbol (diamond)", "Outro símbolo (losango)", "On an Ally's roll objective: dice showing a second matching symbol.", "No objetivo de rolagem de um Aliado: dados mostrando um segundo símbolo igual entre si.", ["m8"])}
      </div>
      <h3 class="subhead">${t("Missions: Boost Tiles", "Missões: Fichas de Boost")}</h3>
      <div class="icon-grid">
        ${iconCard("boost-cp", "Gain CP", "Ganhar CP", "Gain the value of CP shown.", "Ganhe o valor de CP mostrado.", ["m8"])}
        ${iconCard("boost-heal", "Heal", "Curar", "Heal the value shown.", "Cure o valor mostrado.", ["m8"])}
        ${iconCard("boost-momentum", "Gain Momentum", "Ganhar Momentum", "Gain the value of Momentum shown.", "Ganhe o valor de Momentum mostrado.", ["m8"])}
        ${iconCard("boost-draw", "Draw cards", "Comprar cartas", "Draw the number of cards shown.", "Compre o número de cartas mostrado.", ["m8"])}
        ${iconCard("boost-status", "Gain a status effect", "Ganhar um efeito de status", "Gain the status effect token shown on the tile.", "Ganhe o marcador de efeito de status mostrado na ficha.", ["m8"])}
        ${iconCard("boost-remove", "Remove a status", "Remover um status", "Remove 1 status effect token from yourself, OR gain 1 Momentum.", "Remova 1 marcador de efeito de status de você, OU ganhe 1 de Momentum.", ["m8"])}
        ${iconCard("boost-transfer", "Transfer a status", "Transferir um status", "Transfer 1 status effect token between any two players, OR gain 2 Momentum.", "Transfira 1 marcador de efeito de status entre dois jogadores quaisquer, OU ganhe 2 de Momentum.", ["m8"])}
      </div>
      <h3 class="subhead">${t("Missions: difficulty dice", "Missões: dados de dificuldade")}</h3>
      <div class="icon-grid">
        ${iconCard("difficulty-1", "Level 1 · Intro", "Nível 1 · Intro", "Easy for anyone, including new players.", "Fácil para qualquer um, inclusive iniciantes.", ["m4"])}
        ${iconCard("difficulty-2", "Level 2 · Moderate", "Nível 2 · Moderate", "Moderate for veterans without Perks.", "Moderada para veteranos sem Vantagens.", ["m4"])}
        ${iconCard("difficulty-3", "Level 3 · Hard", "Nível 3 · Hard", "Very challenging without Perks.", "Muito desafiadora sem Vantagens.", ["m4"])}
        ${iconCard("difficulty-4", "Level 4 · Brutal", "Nível 4 · Brutal", "Nearly unbeatable without Perks.", "Quase imbatível sem Vantagens.", ["m4"])}
        ${iconCard("difficulty-5", "Level 5 · Ruthless", "Nível 5 · Ruthless", "Incredibly challenging even with many Perks.", "Incrivelmente desafiadora mesmo com muitas Vantagens.", ["m4"])}
        ${iconCard("difficulty-6", "Level 6 · Insane", "Nível 6 · Insane", "No Mission exists at this level; it is only reached by increasing the difficulty of a lower-level Mission.", "Não existe Missão neste nível; ele só é alcançado aumentando a dificuldade de uma Missão de nível menor.", ["m4", "m12"])}
      </div>
      <p class="glossary-intro">${t("The 21 Missions status tokens are pictured with their rules in Status Effects.", "Os 21 marcadores de status de Missões estão ilustrados com as regras em Efeitos de Status.")}</p>`;
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), missions() ? ["c4", "c8", "c10", "m8", "m12"] : ["c4", "c8", "c9", "c10"])}
      <p class="glossary-intro">${t(
        "Each picture is cut from the rulebooks, one symbol per image. The symbols on your hero's dice and your hero's own tokens are explained on the Hero Leaflet.",
        "Cada imagem foi recortada dos livros de regras, um símbolo por imagem. Os símbolos dos dados do seu herói e os marcadores próprios do herói são explicados no Folheto do Herói."
      )}</p>
      ${core}
      ${missions() ? mission : ""}`;
  }

  // ---------- examples ----------

  function example(title, lines, pages, art) {
    return infoCard(t("RULEBOOK EXAMPLE", "EXEMPLO DO LIVRO"), title, [art ? figure(art[0], art[1]) : "", ...lines], pages);
  }

  function coreExamples() {
    return [
      example(t("“DEFENSE ROLL 3”", "“DEFENSE ROLL 3”"), [
        t("Black Panther's Defensive Ability shows “DEFENSE ROLL 3”: he rolls 3 dice during the Defensive Roll Phase.", "A Habilidade Defensiva do Pantera Negra mostra “DEFENSE ROLL 3”: ele rola 3 dados na Fase de Rolagem Defensiva."),
        t("These dice are rolled a single time — no re-rolls.", "Esses dados são rolados uma única vez — sem rolar de novo.")
      ], ["c5"]),
      example(t("Reading an ability: Roll, ×, On", "Lendo uma habilidade: Roll, ×, On"), [
        t("A Black Panther upgrade reads: “Deal 6 dmg & roll 3 dice: Add 1 × [claw] dmg. On [vibranium], gain 2 Kinetic Energy. On [panther], draw 1.”", "Uma melhoria do Pantera Negra diz: “Deal 6 dmg & roll 3 dice: Add 1 × [garra] dmg. On [vibranium], gain 2 Kinetic Energy. On [pantera], draw 1.”"),
        t("Roll 3 fresh dice once. Add 1 dmg for each of them showing the claw symbol.", "Role 3 dados novos uma vez. Some 1 de dano para cada um deles mostrando o símbolo de garra."),
        t("If at least one shows vibranium, gain 2 Kinetic Energy — once, even if two dice show it. If at least one shows the panther, draw 1 card.", "Se ao menos um mostrar vibranium, ganhe 2 Kinetic Energy — uma vez, mesmo que dois dados mostrem. Se ao menos um mostrar a pantera, compre 1 carta.")
      ], ["c9"]),
      example(t("“Then” and “Or”", "“Then” e “Or”"), [
        t("“Gain 2 Kinetic Energy. Then deal 8 dmg.” — the gain happens first; at the “Then”, players may spend Status Effects or play Instant / Roll Phase Action cards; the damage comes after.", "“Gain 2 Kinetic Energy. Then deal 8 dmg.” — o ganho acontece primeiro; no “Then”, os jogadores podem gastar Efeitos de Status ou jogar cartas Instantâneas / de Fase de Rolagem; o dano vem depois."),
        t("“Steal 1 CP – or – opponent discards 1 of their choice.” — resolve only one of the two.", "“Steal 1 CP – or – opponent discards 1 of their choice.” — resolva só uma das duas.")
      ], ["c9"]),
      example(t("Someone alters your dice", "Alguém altera os seus dados"), [
        t("You announce an Offensive Ability; before it activates, a player plays a card that changes one of your dice.", "Você anuncia uma Habilidade Ofensiva; antes de ela ativar, um jogador joga uma carta que muda um dos seus dados."),
        t("You may now announce a different Offensive Ability that fits the new Final Dice Result, or go back to rolling and use any re-rolls you had not used.", "Agora você pode anunciar outra Habilidade Ofensiva que caiba no novo Resultado Final dos Dados, ou voltar a rolar e usar as rolagens que não tinha usado.")
      ], ["c12"]),
      example(t("Timing: Agility against “Buh, Bye!”", "Prioridade: Agility contra “Buh, Bye!”"), [
        t("On your turn your opponent says they want to spend an Agility token to avoid part of your Attack, and at the same moment you play “Buh, Bye!” (an Instant Action card that removes a Status Effect token from a chosen player) on that Agility. Both are instants, so the player whose turn it is goes first: your card resolves and the token is removed before it can be spent.", "No seu turno o oponente diz que quer gastar um marcador Agility para evitar parte do seu Ataque, e no mesmo momento você joga “Buh, Bye!” (uma carta Instantânea que remove um marcador de Efeito de Status de um jogador escolhido) nesse Agility. As duas são instantâneas, então quem está na vez age primeiro: a sua carta resolve e o marcador é removido antes de poder ser gasto."),
        t("The other way round: your opponent Attacks you with a Crackle token and you try to remove it with “Buh, Bye!”. They may still spend the Crackle successfully — it is their turn — and your card may not be played to remove that token.", "Ao contrário: o oponente te Ataca tendo um marcador Crackle e você tenta removê-lo com “Buh, Bye!”. Ele ainda pode gastar o Crackle com sucesso — é o turno dele — e a sua carta não pode ser jogada para remover esse marcador.")
      ], ["c15"]),
      example(t("Final damage: Doctor Strange vs Black Widow", "Dano final: Doutor Estranho contra Viúva Negra"), [
        rl("Events", "1) Mystic Bolts: 9 dmg and a Spell. 2) Spell: +3 dmg. 3) Black Widow spends Agility and rolls a 1: prevent ½. 4) Her Sabotage II defense: prevent 2, deal 2. 5) Icy Tendrils (Attack Modifier): +1 dmg and another Spell. 6) Spell: +4 dmg. 7) Second Agility, another 1: prevent ½.", "Eventos", "1) Mystic Bolts: 9 de dano e um Feitiço. 2) Feitiço: +3. 3) A Viúva Negra gasta Agility e rola 1: previne ½. 4) A defesa Sabotage II dela: previne 2, causa 2. 5) Icy Tendrils (Modificador de Ataque): +1 e outro Feitiço. 6) Feitiço: +4. 7) Segundo Agility, outro 1: previne ½."),
        rl("Step 1", "incoming damage 9.", "Passo 1", "dano recebido 9."),
        rl("Step 2", "9 + 3 − 2 + 1 + 4 = 15 (subtotal).", "Passo 2", "9 + 3 − 2 + 1 + 4 = 15 (subtotal)."),
        rl("Step 3", "each Agility is worked out independently from the subtotal: 15 ÷ 2 = 8 (rounded up), twice. 15 − 8 − 8 = −1.", "Passo 3", "cada Agility é calculado de forma independente a partir do subtotal: 15 ÷ 2 = 8 (arredondado para cima), duas vezes. 15 − 8 − 8 = −1."),
        rl("Result", "Black Widow receives 0 damage; Doctor Strange receives 2 dmg from her Defensive Ability.", "Resultado", "a Viúva Negra recebe 0 de dano; o Doutor Estranho recebe 2 de dano da Habilidade Defensiva dela.")
      ], ["c14"])
    ];
  }

  function examplesSection() {
    const cards = [];
    if (missions()) {
      cards.push(
        example(t("Entering the map", "Entrando no mapa"), [
          t("Storm enters through the Entry Space (A) and ends her move on space B, picking up the Boost Tile there.", "Storm entra pelo Entry Space (A) e termina o movimento no espaço B, pegando a Ficha de Boost dali."),
          t("Wolverine enters the same way and ends on the empty space C.", "Wolverine entra do mesmo jeito e termina no espaço vazio C.")
        ], ["m6"], ["movement", t("Missions p. 6: movement example", "Missões p. 6: exemplo de movimento")]),
        example(t("Target & Resolve", "Alvo e Resolução"), [
          t("Storm and Wolverine each activated an Offensive Ability that deals non-collateral damage, so both are Attacks.", "Storm e Wolverine ativaram cada um uma Habilidade Ofensiva que causa dano não colateral, então ambas são Ataques."),
          t("Storm resolves first because she is the Start Player. Attacks are Melee, so she must choose an adjacent enemy: Cult Thug (E) or Strike Team (D). With Range she could target any enemy on the map.", "Storm resolve primeiro porque é a Jogadora Inicial. Ataques são Melee, então ela precisa escolher um inimigo adjacente: Cult Thug (E) ou Strike Team (D). Com Range poderia mirar qualquer inimigo do mapa."),
          t("Wolverine is adjacent only to Cult Thug (E), so without Range he must target it.", "Wolverine só está adjacente ao Cult Thug (E), então sem Range precisa mirá-lo.")
        ], ["m6"], ["targeting", t("Missions p. 6: targeting example", "Missões p. 6: exemplo de alvo")]),
        example(t("How many Enemy Dice", "Quantos Dados Inimigos"), [
          t("In a 2-player game the pool is 2 red dice and 3 black dice.", "Num jogo de 2 jogadores o conjunto é de 2 dados vermelhos e 3 pretos."),
          t("In a 3-player game it is 2 red dice and 4 black dice.", "Num jogo de 3 jogadores são 2 dados vermelhos e 4 pretos."),
          t(`This match (${heroesLabel()}${harder() ? `, +${state.level}` : ""}): 2 red and ${blackDice()} black.`, `Esta partida (${heroesLabel()}${harder() ? `, +${state.level}` : ""}): 2 vermelhos e ${blackDice()} pretos.`)
        ], ["m9", "m10"]),
        example(t("One roll, several Henchmen", "Uma rolagem, vários Capangas"), [
          t("The roll shows Vortex (5), Hedron (6), Strike (1), Strike (3), Strike (1).", "A rolagem mostra Vortex (5), Hedron (6), Strike (1), Strike (3), Strike (1)."),
          t("Going left to right: Cult Thugs need three Strikes — they attack (1). Strike Team need a Strike and two Vortexes — only one Vortex was rolled, so they do nothing. Hellfire Club need two Strikes and a Hedron — they attack (2). The Sniper (Unstoppable Threat) needs a Hedron — it attacks last (3).", "Da esquerda para a direita: os Cult Thugs precisam de três Strikes — atacam (1). A Strike Team precisa de um Strike e dois Vortex — só saiu um Vortex, então não faz nada. O Hellfire Club precisa de dois Strikes e um Hedron — ataca (2). O Sniper (Ameaça Imparável) precisa de um Hedron — ataca por último (3).")
        ], ["m7"], ["enemy-roll", t("Missions p. 7: enemy roll example", "Missões p. 7: exemplo de rolagem inimiga")]),
        example(t("Henchmen combat: Savants and Vanguards", "Combate com Capangas: Savants e Vanguards"), [
          t("The rulebook's example has 2 Heroes at the printed difficulty: the Start Player rolls 2 red and 3 black dice once. The Savants' and the Vanguards' abilities activate; nobody alters the dice.", "O exemplo do livro tem 2 Heróis na dificuldade impressa: o Jogador Inicial rola 2 dados vermelhos e 3 pretos uma vez. As habilidades dos Savants e dos Vanguards ativam; ninguém altera os dados."),
          t("Savants first (left-most panel). Their Multi-Strike Attack has Range, so each of the two undefeated Savants attacks both Heroes: each Hero is targeted twice, top-most Savant first.", "Primeiro os Savants (painel mais à esquerda). O Ataque Multi-Strike deles tem Range, então cada um dos dois Savants não derrotados ataca os dois Heróis: cada Herói é alvo duas vezes, começando pelo Savant mais acima."),
          t("The Savants are not adjacent. Neither Hero spends Momentum to gain Range, so they may not use their Defensive Abilities even though the Attack is defendable.", "Os Savants não estão adjacentes. Nenhum Herói gasta Momentum para ganhar Range, então não podem usar as Habilidades Defensivas, embora o Ataque seja defensável."),
          t("Vanguards next: their Multi-Strike Attack is Melee. The left-most Vanguard (F) has Blind: it rolls 1 die, gets a 2 and its Attack fails; the first targeted Hero does not defend and the Blind is removed.", "Depois os Vanguards: o Ataque Multi-Strike deles é Melee. O Vanguard mais à esquerda (F) tem Blind: rola 1 dado, tira 2 e o Ataque falha; o primeiro Herói alvo não se defende e o Blind é removido."),
          t("No longer Blind, that Vanguard still performs its second Attack against the other adjacent Hero, who may use their Defensive Ability without needing Range.", "Sem o Blind, esse Vanguard ainda faz o segundo Ataque contra o outro Herói adjacente, que pode usar a Habilidade Defensiva sem precisar de Range."),
          t("The second Vanguard (C) has no adjacent Hero: it does not attack and none of its effects trigger.", "O segundo Vanguard (C) não tem Herói adjacente: não ataca e nenhum efeito dele acontece.")
        ], ["m9"], ["combat-example", t("Missions p. 9: combat example on Onslaught's Citadel", "Missões p. 9: exemplo de combate em Onslaught's Citadel")]),
        example(t("Crisis Clock with 3 Heroes", "Relógio de Crise com 3 Heróis"), [
          t("The hand advances 3 segments. F: each Hero discards 1 card. G: empty, no effect. H: the Cult Thugs symbol, so the Cult Thugs activate their Crisis Ability.", "O ponteiro avança 3 segmentos. F: cada Herói descarta 1 carta. G: vazio, sem efeito. H: o símbolo dos Cult Thugs, então eles ativam a Habilidade de Crise."),
          t("That ability deals 2 collateral dmg to all Heroes once per undefeated Cult Thug. Two are undefeated, so every Hero receives 4 collateral dmg.", "Essa habilidade causa 2 de dano colateral a todos os Heróis, uma vez por Cult Thug não derrotado. Há dois, então cada Herói recebe 4 de dano colateral."),
          t("Lastly 2 dice are rolled for the last part of that Crisis Ability (one per Cult Thug).", "Por fim, 2 dados são rolados para a última parte dessa Habilidade de Crise (um por Cult Thug)."),
          t(`This match (${heroesLabel()}${harder() ? ", “+1” hand" : ""}): the hand advances ${clockSteps()} segment${clockSteps() > 1 ? "s" : ""}.`, `Esta partida (${heroesLabel()}${harder() ? ", ponteiro “+1”" : ""}): o ponteiro avança ${clockSteps()} segmento${clockSteps() > 1 ? "s" : ""}.`)
        ], ["m7"], ["crisis-clock", t("Missions p. 7: Crisis Clock example", "Missões p. 7: exemplo do Relógio de Crise")]),
        example(t("Boss Fight: Onslaught", "Luta contra o Chefe: Onslaught"), [
          t("3 Heroes: 2 red and 4 black dice. The roll would activate Onslaught's strongest Attack, Magneton; Storm plays a card to change a 6 into a 1, so his second Attack, Mind Drain, activates instead.", "3 Heróis: 2 dados vermelhos e 4 pretos. A rolagem ativaria o Ataque mais forte de Onslaught, Magneton; Storm joga uma carta para mudar um 6 em 1, então ativa o segundo Ataque, Mind Drain."),
          t("Both red dice show 3: two face-down Boost Tiles go on the map's “3” space (D). Wolverine stands there but does not pick them up.", "Os dois dados vermelhos mostram 3: duas Fichas de Boost viradas para baixo vão para o espaço “3” do mapa (D). Wolverine está ali, mas não as pega."),
          t("Mind Drain is Multi-Strike: it inflicts Wither on all targets. Jean Grey (E) is adjacent, so she takes the Melee effect, which is defendable — she uses her Defensive Ability. Storm and Wolverine are not adjacent and take the Range effect, undefendable dmg.", "Mind Drain é Multi-Strike: inflige Wither em todos os alvos. Jean Grey (E) está adjacente, então sofre o efeito Melee, que é defensável — ela usa a Habilidade Defensiva. Storm e Wolverine não estão adjacentes e sofrem o efeito Range, dano indefensável."),
          t("CRIT (inflict Paralyze): Wolverine suffers it once for standing on face-down Boost Tiles; Storm suffers it once because she has face-down tiles on her Health Dial from moving into space F.", "CRIT (infligir Paralyze): Wolverine o sofre uma vez por estar sobre Fichas de Boost viradas para baixo; Storm o sofre uma vez porque tem fichas viradas para baixo no mostrador de Vida, de quando entrou no espaço F."),
          t("After the Attack, Storm reveals her 3 face-down Boost Tiles, gains their benefits and discards them.", "Depois do Ataque, Storm revela as 3 Fichas de Boost viradas para baixo, recebe os benefícios e as descarta."),
          t(`The example is played at the printed difficulty. This match (${heroesLabel()}${harder() ? `, +${state.level}` : ""}) rolls 2 red and ${blackDice()} black dice.`, `O exemplo é jogado na dificuldade impressa. Esta partida (${heroesLabel()}${harder() ? `, +${state.level}` : ""}) rola 2 dados vermelhos e ${blackDice()} pretos.`)
        ], ["m10"], ["boss-example", t("Missions p. 10: Boss Fight example — Onslaught's Attacks from left to right and his Boss Defense", "Missões p. 10: exemplo de Luta contra o Chefe — os Ataques de Onslaught da esquerda para a direita e a Boss Defense")]),
        example(t("Winning in the same round phase", "Vitória na mesma fase da rodada"), [
          t("Wolverine Attacks the Boss and is defeated by the Boss's defense. In the same round phase Captain Marvel defeats the Boss with her Attack.", "Wolverine Ataca o Chefe e é derrotado pela defesa do Chefe. Na mesma fase da rodada a Capitã Marvel derrota o Chefe com o Ataque dela."),
          t("The Heroes win: they completed the Side 2 Main Objective before the current round phase concluded.", "Os Heróis vencem: cumpriram o Objetivo Principal do Lado 2 antes de a fase da rodada atual terminar.")
        ], ["m8"]),
        example(t("Spending Perk Points", "Gastando Pontos de Vantagem"), [
          rl("G", "Alex beat Side 1 and 2 of a level 1 Mission: 2 PP, both spent in the first column on the first Heroism Perk, which is now unlocked.", "G", "Alex venceu os Lados 1 e 2 de uma Missão de nível 1: 2 PP, ambos gastos na primeira coluna, na primeira Vantagem de Heroism, agora desbloqueada."),
          rl("H", "Alex Perfected Side 1 and beat Side 2 of a level 4 Mission: 3 PP, plus the level 4 New Game+ circle, and the Mission is marked Perfected. 1 PP completes a second-column Grit Perk and 2 PP go into the fourth column of Leadership.", "H", "Alex ganhou a Recompensa Perfeita no Lado 1 e venceu o Lado 2 de uma Missão de nível 4: 3 PP, mais o círculo New Game+ de nível 4, e a Missão é marcada como Perfeita. 1 PP completa uma Vantagem de Grit da segunda coluna e 2 PP vão para a quarta coluna de Leadership."),
          rl("J", "Alex beat Side 1 of a level 3 Mission but lost Side 2: 1 PP. Lacking the Level 2 Momentum Card, they cannot work on Level 3 and put the PP into the Level 2 Momentum Perk.", "J", "Alex venceu o Lado 1 de uma Missão de nível 3 mas perdeu o Lado 2: 1 PP. Sem a carta de Momentum Nível 2, não pode avançar no Nível 3 e põe o PP na Vantagem de Momentum Nível 2.")
        ], ["m11"]),
        harder() ? example(t("Total Difficulty", "Dificuldade Total"), [
          t("Playing Nuclear Assault (level 2) with the difficulty increased by 3 gives a Total Difficulty of 5: all PP earned may be spent in the level 5 column.", "Jogar Nuclear Assault (nível 2) com a dificuldade aumentada em 3 dá Dificuldade Total 5: todos os PP ganhos podem ser gastos na coluna de nível 5."),
          t(`In this match: Mission level + ${state.level}.`, `Nesta partida: nível da Missão + ${state.level}.`)
        ], ["m12"]) : ""
      );
    }
    if (koth()) {
      cards.push(example(t("Attacking a tied Leader", "Atacando um Líder empatado"), [
        t("You and another player both have 30 Health, the highest at the table. You Attack that player: you still draw 1 bonus card, immediately after choosing the target.", "Você e outro jogador têm 30 de Vida, o maior valor da mesa. Você Ataca esse jogador: ainda compra 1 carta bônus, logo depois de escolher o alvo."),
        t("If you alone had the most Health, no target could give you the bonus.", "Se só você tivesse mais Vida, nenhum alvo te daria o bônus.")
      ], ["c11"]));
    }
    if (teams()) {
      cards.push(
        example(t("Helping a teammate", "Ajudando o parceiro"), [
          t("Your teammate is about to take damage. You cannot simply step in — but the card “Not This Time!” says “A chosen player prevents … incoming dmg”, so you may play it on your teammate.", "O seu parceiro está prestes a levar dano. Você não pode simplesmente intervir — mas a carta “Not This Time!” diz “A chosen player prevents … incoming dmg”, então você pode jogá-la no parceiro."),
          t("You may also alter dice so the attack never activates, or to improve your teammate's own roll.", "Você também pode alterar dados para o ataque nem ativar, ou para melhorar a rolagem do próprio parceiro.")
        ], ["c11"]),
        example(t("Targeting with an Ultimate", "Alvo com uma Suprema"), [
          t("You activated your Ultimate Ability and roll the targeting die. Nobody may manipulate that die: dice could be altered before the Ultimate activated, but in the Targeting Roll Phase it has already activated and only needs a target.", "Você ativou a Habilidade Suprema e rola o dado de alvo. Ninguém pode manipular esse dado: os dados podiam ser alterados antes de a Suprema ativar, mas na Fase de Rolagem de Alvo ela já ativou e só precisa de um alvo.")
        ], ["c13"])
      );
    }
    if (koth() || teams()) {
      cards.push(example(t("A target without damage", "Um alvo sem dano"), [
        t("Spider-Man's “Web Shot” deals no damage but inflicts Webbed. Targeting still applies: someone has to receive the Status Effect.", "O “Web Shot” do Homem-Aranha não causa dano, mas inflige Webbed. O alvo ainda se aplica: alguém precisa receber o Efeito de Status.")
      ], ["c13"]));
    }
    cards.push(...coreExamples());
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), missions() ? ["m6", "m7", "m9", "m10", "c14"] : ["c9", "c12", "c14", "c15"])}
      <p class="glossary-intro">${t("The examples use the heroes pictured in the rulebooks; their ability names are only illustrations.", "Os exemplos usam os heróis ilustrados nos livros; os nomes das habilidades são só ilustrações.")}</p>
      ${grid(cards, "mdt-example-grid")}`;
  }

  // ---------- guide's readings ----------

  function faqSection() {
    const items = [
      solo() ? null : [t("Who goes first if the start roll is tied?", "Quem começa se a rolagem inicial empatar?"), t("The booklets do not say. The guide has the tied players roll again.", "Os livros não dizem. O guia manda os empatados rolarem de novo."), missions() ? "m5" : "c3"],
      solo() ? null : [t("Are hands hidden?", "As mãos são secretas?"), t("Not stated. The guide keeps hands hidden from opponents; the 2v2 rules single out teammates as allowed to view each other's hands, and in Missions the Heroes are told to decide collaboratively, so nothing stops them sharing.", "Não é dito. O guia mantém as mãos escondidas dos oponentes; as regras do 2v2 destacam que parceiros podem ver a mão um do outro, e em Missões os Heróis decidem em conjunto, então nada impede que compartilhem."), "c11"],
      [t("What are the Turn Order Card and the Bonus Hero Token for?", "Para que servem a carta de Ordem do Turno e o Bonus Hero Token?"), t("Both are listed among a hero's components, but neither booklet gives them a rule. The guide treats the card as a reminder of the phases and leaves the token unused.", "Os dois estão listados entre os componentes de um herói, mas nenhum dos livros dá regra para eles. O guia trata a carta como lembrete das fases e deixa o marcador sem uso."), "c6"],
      missions() ? null : [t("5 or 6 players? 3v3?", "5 ou 6 jogadores? 3v3?"), t("The core booklet says Dice Throne supports up to 6 but prints no rules for it, pointing to variants.dicethrone.com. This guide covers only what the two supplied booklets print.", "O livro básico diz que Dice Throne comporta até 6, mas não imprime regras para isso, apontando para variants.dicethrone.com. Este guia cobre só o que os dois livros fornecidos imprimem."), "c11"]
    ].filter(Boolean);
    if (teams()) {
      items.push(
        [t("Which Health Dial does a team use?", "Qual mostrador de Vida um time usa?"), t("The booklet says teammates share one Health Dial but not whose. The guide uses either teammate's dial and puts the other away.", "O livro diz que os parceiros dividem um mostrador de Vida, mas não de quem. O guia usa o de qualquer um dos parceiros e guarda o outro."), "c11"],
        [t("Who is second in the zigzag?", "Quem é o segundo no zigue-zague?"), t("The diagram shows player 2 directly across from player 1. The guide uses the opponent seated opposite the Start Player.", "O diagrama mostra o jogador 2 bem em frente ao jogador 1. O guia usa o oponente sentado em frente ao Jogador Inicial."), "c11"],
        [t("“Left” and “right” on the targeting die?", "“Esquerda” e “direita” no dado de alvo?"), t("As you sit facing the other team: the opponent on your left-hand side and the one on your right-hand side.", "Sentado de frente para o outro time: o oponente do seu lado esquerdo e o do seu lado direito."), "c13"]
      );
    }
    if (koth()) {
      items.push([t("What happens when one of the three is defeated?", "O que acontece quando um dos três é derrotado?"), t("The booklet only says a player at 0 Health is defeated and that Status Effects they inflicted stay in play. The guide removes that player from the turn order and the other two fight on; the Leader rule keeps applying between them.", "O livro só diz que um jogador com 0 de Vida está derrotado e que os Efeitos de Status que ele infligiu continuam em jogo. O guia tira esse jogador da ordem de turnos e os outros dois continuam; a regra do Líder continua valendo entre eles."), "c11"]);
    }
    if (missions()) {
      items.push(...[
        harder() || easier() ? [t("Can increased and decreased difficulty be combined?", "Dá para combinar dificuldade aumentada e reduzida?"), t("The booklet presents them as two separate remedies (a Mission too easy / a more approachable game). The guide offers one or the other.", "O livro as apresenta como dois remédios separados (Missão fácil demais / partida mais acessível). O guia oferece uma ou outra."), "m12"] : null,
        harder() ? [t("Why does the guide stop at +4 levels?", "Por que o guia para em +4 níveis?"), t("The booklet caps Oppression at 4 and the Henchman Health bonus at +8 (2 per level), so the fifth level would add only a die. The guide offers +1 to +4.", "O livro limita Oppression a 4 e o bônus de Vida dos Capangas a +8 (2 por nível), então o quinto nível só acrescentaria um dado. O guia oferece de +1 a +4."), "m12"] : null,
        easier() || campaign() ? [t("Maximum Health when the starting Health is raised?", "Vida máxima quando a Vida inicial é aumentada?"), t("Maximum Health is 10 above starting Health; the guide counts a starting Health raised by the +10 modification or by a Perk as the starting Health.", "A Vida máxima é 10 acima da inicial; o guia conta como Vida inicial a que foi aumentada pela modificação de +10 ou por uma Vantagem."), "m4"] : null,
        [t("Does one die serve several roll objectives?", "Um dado serve a vários objetivos de rolagem?"), t("Yes, by the rulebook's example: the single roll is compared with each panel separately (three Strikes activate the Cult Thugs and two of them also help the Hellfire Club). Inside one objective, each pictured symbol needs its own die.", "Sim, pelo exemplo do livro: a única rolagem é comparada com cada painel separadamente (três Strikes ativam os Cult Thugs e dois deles também servem ao Hellfire Club). Dentro de um objetivo, cada símbolo ilustrado precisa do próprio dado."), "m7"],
        [t("When is combat damage applied in Missions?", "Quando o dano de combate é aplicado em Missões?"), t("The standard rule applies all damage of a Roll Phase together. In Missions the guide resolves each Attack completely — a Hero's in the Target & Resolve Phase, an enemy's in the Enemy Roll Phase — and applies its damage before the next Attack, consistent with the example where a later Hero's Attack defeats the Boss in the same phase.", "A regra padrão aplica junto todo o dano de uma Fase de Rolagem. Em Missões o guia resolve cada Ataque por completo — o de um Herói na Fase de Alvo e Resolução, o de um inimigo na Fase de Rolagem Inimiga — e aplica o dano antes do Ataque seguinte, coerente com o exemplo em que o Ataque de um Herói posterior derrota o Chefe na mesma fase."), "m8"],
        [t("How much Momentum for a large Henchman?", "Quanto Momentum por um Capanga grande?"), t("The rule gives 2 Momentum “when placing a Defeat Tile”, and the Momentum Card says “when a Defeat Tile is placed on a Henchman”. The guide gives 2 per defeated Henchman, however many spaces it covered.", "A regra dá 2 de Momentum “ao colocar uma ficha Defeat”, e a carta de Momentum diz “quando uma ficha Defeat é colocada num Capanga”. O guia dá 2 por Capanga derrotado, não importa quantos espaços ele cobria."), "m9"],
        [t("Do pawns stay on the map when the board is flipped?", "Os peões ficam no mapa quando o tabuleiro é virado?"), t("The Movement rules say a pawn beginning a new Mission Run or Boss Fight is not yet on a space and enters by the Entry Space, so the guide takes pawns off the map when flipping to Side 2.", "As regras de Movimento dizem que um peão que começa uma nova Incursão ou Luta contra o Chefe ainda não está num espaço e entra pelo Entry Space, então o guia tira os peões do mapa ao virar para o Lado 2."), "m6"]
      ].filter(Boolean));
      if (campaign()) {
        items.push([t("Who gets which Mythic card?", "Quem fica com qual carta Mítica?"), t("The booklet only says an eligible player may start with one of the 4 Mythic Abilities. The guide lets eligible players choose in turn order, one different card each.", "O livro só diz que um jogador com direito pode começar com uma das 4 Habilidades Míticas. O guia deixa os jogadores com direito escolherem em ordem de turno, uma carta diferente para cada um."), "m11"]);
      }
      if (solo()) {
        items.push([t("Solo: what do “teammate” effects do?", "Solo: o que fazem os efeitos de “parceiro”?"), t("A teammate is another Hero, not you. Playing solo there is none, so an effect that needs a teammate cannot choose one (Dominance on a 1: discard 1 card at random instead).", "Um parceiro é outro Herói, não você. No solo não há nenhum, então um efeito que precisa de um parceiro não tem quem escolher (Dominance com 1: descarte 1 carta ao acaso)."), "m12"]);
      }
    }
    return `
      ${sectionHeading("faq", t("Guide's readings", "Leituras do guia"), missions() ? ["m5", "m7", "m12"] : ["c3", "c11"])}
      <p class="glossary-intro">${t("Where the booklets are silent, this guide states its own reading, labelled as such. They also say they are living documents: the publisher keeps the latest versions online.", "Onde os livros são omissos, este guia dá a própria leitura, identificada como tal. Eles também dizem ser documentos vivos: a editora mantém as versões mais recentes online.")}</p>
      <div class="quick-grid">${items.map(([q, a, page]) => `
        <article class="info-card">
          <span class="component-label">${t("GUIDE'S READING", "LEITURA DO GUIA")}</span>
          <h3>${q}</h3>
          <p>${a}</p>
          ${referenceLink(page)}
        </article>`).join("")}</div>`;
  }

  // ---------- glossary ----------

  function glossarySection() {
    const entries = [
      { term: ["Active Player", "Jogador Ativo (Active Player)"], text: ["The player whose turn it is.", "O jogador da vez."], page: "c4" },
      { term: ["Activation Requirement", "Requisito de Ativação"], text: ["The Final Dice Result needed to activate an Offensive Ability.", "O Resultado Final dos Dados necessário para ativar uma Habilidade Ofensiva."], page: "c5" },
      { term: ["Attack", "Ataque (Attack)"], text: ["An Offensive Ability that deals at least 1 dmg to a targeted opponent (not collateral dmg).", "Uma Habilidade Ofensiva que causa ao menos 1 de dano a um oponente alvo (não dano colateral)."], page: "c16" },
      { term: ["Attack Modifier", "Modificador de Ataque (Attack Modifier)"], text: ["A Status Effect or card that adds an effect to an Attack and / or modifies its damage.", "Um Efeito de Status ou carta que acrescenta um efeito a um Ataque e / ou modifica o dano."], page: "c16" },
      { term: ["Collateral damage", "Dano colateral (collateral)"], text: ["Damage that is not aimed through targeting — its text says who receives it — so it is not an Attack. It cannot be defended or modified, but it can be avoided.", "Dano que não passa pela escolha de alvo — o texto diz quem o recebe — logo não é um Ataque. Não pode ser defendido nem modificado, mas pode ser evitado."], page: "c16" },
      { term: ["Combat Points (CP)", "Pontos de Combate (CP)"], text: ["Spent mainly to play cards; a few abilities or effects also ask for CP, as their own text says. Maximum 15.", "Gastos principalmente para jogar cartas; algumas habilidades ou efeitos também pedem CP, como o próprio texto diz. Máximo 15."], page: "c16" },
      { term: ["Companion", "Companheiro (Companion)"], text: ["A hero-specific component defined on the Hero Leaflet; not a Status Effect.", "Um componente específico do herói definido no Folheto do Herói; não é um Efeito de Status."], page: "c7" },
      { term: ["Defender", "Defensor (Defender)"], text: ["The player being targeted by an Attack.", "O jogador mirado por um Ataque."], page: "c16" },
      { term: ["Final Dice Result", "Resultado Final dos Dados"], text: ["Your five dice after all re-rolls and dice modification are finished.", "Os seus cinco dados depois de todas as rolagens e modificações."], page: "c16" },
      { term: ["Incoming damage", "Dano recebido (incoming damage)"], text: ["The amount of damage currently waiting to be dealt to a player.", "A quantidade de dano esperando para ser causada a um jogador."], page: "c16" },
      { term: ["Isolated damage", "Dano isolado (isolated)"], text: ["Dealt immediately; prevented or avoided only as a separate instance.", "Causado na hora; prevenido ou evitado só como uma instância separada."], page: "c16" },
      { term: ["Pure damage", "Dano puro (pure)"], text: ["Undefendable damage that cannot be modified, but can be avoided.", "Dano indefensável que não pode ser modificado, mas pode ser evitado."], page: "c16" },
      { term: ["Roll Attempt", "Tentativa de Rolagem (Roll Attempt)"], text: ["A dice roll made to activate an Offensive or Defensive Ability.", "Uma rolagem de dados feita para ativar uma Habilidade Ofensiva ou Defensiva."], page: "c16" },
      { term: ["Roll Phase (conclusion of)", "Fase de Rolagem (fim da)"], text: ["Just before Main Phase (2) begins.", "Logo antes de a Fase Principal (2) começar."], page: "c16" },
      { term: ["Sell", "Vender (Sell)"], text: ["Discard a card from your hand and gain 1 CP.", "Descartar uma carta da mão e ganhar 1 CP."], page: "c16" },
      { term: ["Spend", "Gastar (Spend)"], text: ["Discard a Status Effect token to receive its benefit; no CP cost.", "Descartar um marcador de Efeito de Status para receber o benefício; sem custo em CP."], page: "c16" },
      { term: ["Stack Limit", "Limite de Pilha (Stack Limit)"], text: ["How many tokens of the same type can be on one hero at a time.", "Quantos marcadores do mesmo tipo podem estar num herói ao mesmo tempo."], page: "c16" },
      { term: ["Start Player", "Jogador Inicial (Start Player)"], text: missions() ? ["The holder of the Start Player Token for the round; turn order begins with them.", "Quem tem o marcador de Jogador Inicial na rodada; a ordem de turno começa por ele."] : ["The player who rolled highest in setup; takes the first turn and skips their first Income Phase.", "Quem rolou mais alto na preparação; faz o primeiro turno e pula a primeira Fase de Renda."], page: missions() ? "m6" : "c3" },
      { term: ["Ultimate Ability", "Habilidade Suprema (Ultimate)"], text: ["Once activated, opponents cannot do anything until it completes; it can be enhanced but not reduced.", "Depois de ativada, os oponentes não podem fazer nada até ela terminar; pode ser aumentada, mas não reduzida."], page: "c16" },
      { term: ["Undefendable damage", "Dano indefensável (undefendable)"], text: ["Damage against which no Defensive Ability can be activated; it may still be avoided, reduced or enhanced.", "Dano contra o qual nenhuma Habilidade Defensiva pode ser ativada; ainda pode ser evitado, reduzido ou aumentado."], page: "c16" },
      koth() ? { term: ["Leader", "Líder (Leader)"], text: ["A player with the most Health remaining.", "Um jogador com mais Vida restante."], page: "c11" } : null,
      teams() || missions() ? { term: ["Teammate", "Parceiro (Teammate)"], text: missions() ? ["Another Hero (not you).", "Outro Herói (não você)."] : ["The other player on your team.", "O outro jogador do seu time."], page: missions() ? "m9" : "c11" } : null
    ];
    if (missions()) {
      entries.push(
        { term: ["Hero", "Herói (Hero)"], text: ["A person and the Dice Throne champion they are playing.", "Uma pessoa e o campeão de Dice Throne que ela joga."], page: "m9" },
        { term: ["Enemies", "Inimigos (Enemies)"], text: ["Who the Heroes fight: Henchmen, Unstoppable Threats and Bosses.", "Contra quem os Heróis lutam: Capangas, Ameaças Imparáveis e Chefes."], page: "m9" },
        { term: ["Player", "Jogador (Player)"], text: ["A Hero or an enemy.", "Um Herói ou um inimigo."], page: "m9" },
        { term: ["Opponent", "Oponente (Opponent)"], text: ["For Heroes, the enemies; for enemies, the Heroes. Enemy abilities are written from the enemy's point of view.", "Para os Heróis, os inimigos; para os inimigos, os Heróis. As habilidades inimigas são escritas do ponto de vista do inimigo."], page: "m9" },
        { term: ["Henchman", "Capanga (Henchman)"], text: ["An enemy on a Mission Run with Health Tokens, one Offensive Ability and no defense but Shield.", "Um inimigo de uma Incursão com marcadores de Vida, uma Habilidade Ofensiva e nenhuma defesa além de Shield."], page: "m9" },
        { term: ["Unstoppable Threat", "Ameaça Imparável (Unstoppable Threat)"], text: ["An enemy that cannot be targeted, damaged or given status effects.", "Um inimigo que não pode ser alvo, sofrer dano nem receber efeitos de status."], page: "m7" },
        { term: ["Boss", "Chefe (Boss)"], text: ["The villain of a Boss Fight, with a Boss Health Dial, several Attacks and a Boss Defense.", "O vilão de uma Luta contra o Chefe, com mostrador Boss Health, vários Ataques e uma Boss Defense."], page: "m10" },
        { term: ["Mission Run", "Incursão (Mission Run)"], text: ["A map side (usually Side 1) fought against Henchmen.", "Um lado do mapa (em geral o Lado 1) enfrentado contra Capangas."], page: "m6" },
        { term: ["Boss Fight", "Luta contra o Chefe (Boss Fight)"], text: ["A map side (usually Side 2) fought against a Boss.", "Um lado do mapa (em geral o Lado 2) enfrentado contra um Chefe."], page: "m10" },
        { term: ["Main Objective", "Objetivo Principal (Main Objective)"], text: ["What must be done to complete a side of a Mission.", "O que precisa ser feito para concluir um lado de uma Missão."], page: "m8" },
        { term: ["Melee", "Melee (corpo a corpo)"], text: ["Affecting only an adjacent space — one sharing a border with yours.", "Que afeta só um espaço adjacente — que faz fronteira com o seu."], page: "m4" },
        { term: ["Range", "Range (alcance)"], text: ["Affecting any space on the map.", "Que afeta qualquer espaço do mapa."], page: "m4" },
        { term: ["Multi-Strike", "Multi-Strike"], text: ["An enemy Attack resolved against every Hero in reach.", "Um Ataque inimigo resolvido contra cada Herói ao alcance."], page: "m7" },
        { term: ["Roll objective", "Objetivo de rolagem (roll objective)"], text: ["The dice symbols an enemy (or an Ally ability) needs in the roll to activate.", "Os símbolos de dados que um inimigo (ou uma habilidade de Aliado) precisa na rolagem para ativar."], page: "m7" },
        { term: ["Crisis Ability", "Habilidade de Crise (Crisis Ability)"], text: ["An effect triggered by the Crisis Clock Hand passing or landing on a segment.", "Um efeito disparado quando o ponteiro do Relógio de Crise passa ou para num segmento."], page: "m7" },
        { term: ["CRIT", "CRIT"], text: ["An extra effect of a Boss Attack against Heroes on, or holding, face-down Boost Tiles.", "Um efeito extra de um Ataque do Chefe contra Heróis sobre, ou com, Fichas de Boost viradas para baixo."], page: "m10" },
        { term: ["Momentum", "Momentum"], text: ["The Missions currency on your Momentum Dial, spent on Momentum Actions and Allies. Maximum 15.", "A moeda de Missões no seu mostrador de Momentum, gasta em Ações de Momentum e Aliados. Máximo 15."], page: "m8" },
        { term: ["Ally HQ", "QG dos Aliados (Ally HQ)"], text: ["The row of 3 face-up Ally cards available to recruit.", "A fila de 3 cartas de Aliado viradas para cima disponíveis para recrutar."], page: "m4" },
        { term: ["Exhaust", "Exhaust"], text: ["An Ally power paid for by discarding the Ally to the bottom of the Ally Deck.", "Um poder de Aliado pago descartando o Aliado para o fundo do Baralho de Aliados."], page: "m8" },
        { term: ["Boost Tile", "Ficha de Boost (Boost Tile)"], text: ["A pick-up on the map collected where you end your move.", "Um bônus no mapa pego onde você termina o movimento."], page: "m8" },
        { term: ["Turn order", "Ordem de turno (turn order)"], text: ["Starting with the Start Player and continuing clockwise.", "Começando pelo Jogador Inicial e seguindo em sentido horário."], page: "m6" },
        { term: ["Perk Point (PP)", "Ponto de Vantagem (PP)"], text: ["Earned after a Mission; each fills one circle on your Perk Sheet.", "Ganho depois de uma Missão; cada um preenche um círculo na Ficha de Vantagens."], page: "m11" },
        { term: ["Perfect Reward", "Recompensa Perfeita (Perfect Reward)"], text: ["An optional harder requirement on Side 1 worth in-game rewards and a third Perk Point.", "Uma exigência opcional mais difícil no Lado 1 que vale recompensas na partida e um terceiro Ponto de Vantagem."], page: "m11" },
        { term: ["Mythic Ability", "Habilidade Mítica (Mythic Ability)"], text: ["A powerful card a player may start with once New Game+ is complete.", "Uma carta poderosa com que um jogador pode começar depois de completar o New Game+."], page: "m11" },
        { term: ["Level (of a Mission)", "Nível (de uma Missão)"], text: ["Its difficulty number, 1–5, shown by the coloured die on the board.", "O número de dificuldade, 1–5, mostrado pelo dado colorido no tabuleiro."], page: "m4" }
      );
      if (harder()) {
        entries.push({ term: ["Total Difficulty", "Dificuldade Total (Total Difficulty)"], text: ["Mission level + levels of increased difficulty; the Perk Sheet column you may spend PP in.", "Nível da Missão + níveis de dificuldade aumentada; a coluna da Ficha de Vantagens em que você pode gastar PP."], page: "m12" });
      }
    }
    const visible = entries.filter(Boolean);
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), missions() ? ["c16", "m9"] : ["c16"])}
      <p class="glossary-intro">${t("Keywords such as Then, Or, Gain, Inflict, Heal and Steal are explained in Reading abilities; damage types in Damage types.", "Palavras-chave como Then, Or, Gain, Inflict, Heal e Steal são explicadas em Lendo habilidades; os tipos de dano em Tipos de dano.")}</p>
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
    document.body.classList.add("theme-mdt");
    document.documentElement.lang = state.language;
    document.title = t("Marvel Dice Throne — Field Manual", "Marvel Dice Throne — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Marvel Dice Throne: 1v1, King of the Hill, 2v2 and the cooperative Missions mode — setup checklist, turn phases, cards, Status Effects, damage types, enemies, Boss Fights, Crisis Clock, Momentum, Allies and Perks.",
        "Regras interativas bilíngues de Marvel Dice Throne: 1v1, Rei da Colina, 2v2 e o modo cooperativo Missões — lista de preparação, fases do turno, cartas, Efeitos de Status, tipos de dano, inimigos, Lutas contra o Chefe, Relógio de Crise, Momentum, Aliados e Vantagens."
      );
    }
    const sections = missions()
      ? [quickReference, setupSection, victorySection, roundsSection, movementSection, turnSection, enemiesSection, bossSection, crisisSection, momentumSection, boardSection, cardsSection, statusSection, damageSection, textSection, perksSection, advancedSection, iconsSection, examplesSection, faqSection, glossarySection]
      : [quickReference, setupSection, victorySection, turnSection, duel() ? null : modeSection, boardSection, cardsSection, statusSection, damageSection, textSection, advancedSection, iconsSection, examplesSection, faqSection, glossarySection].filter(Boolean);

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook", "Livro interativo")}</p>
          <h1>Marvel Dice Throne</h1>
          <p class="hero-intro">${t(
            "A fast game of dice and card play: roll your hero's five dice up to three times, match the symbols to an ability on your Hero Board and bring your opponents to 0 Health — or team up in Missions against Henchmen and a Marvel villain.",
            "Um jogo rápido de dados e cartas: role os cinco dados do seu herói até três vezes, combine os símbolos com uma habilidade do Tabuleiro do Herói e leve os oponentes a 0 de Vida — ou unam-se em Missões contra Capangas e um vilão da Marvel."
          )}</p>
          <div class="hero-meta"><span>${t("2–4 players head-to-head", "2–4 jogadores em confronto")}</span><span>${t("1–4 Heroes in Missions", "1–4 Heróis em Missões")}</span><span>${t("30–75 minutes", "30–75 minutos")}</span><span>Roxley · The Op</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/marvel-dice-throne.webp" alt="${t("Cover of the Marvel Dice Throne Rules of Play", "Capa do Rules of Play de Marvel Dice Throne")}" fetchpriority="high"><figcaption>${t("Rules of Play cover · Roxley / The Op", "Capa do Rules of Play · Roxley / The Op")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${missions() ? t("Mission file", "Arquivo da missão") : t("Battle file", "Arquivo de combate")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column mdt-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the two supplied booklets: Marvel Dice Throne “Rules of Play” v1.0 (links marked Core, with the printed page number) and the Marvel Dice Throne Missions rulebook v1.0 (links marked Missions). Hero abilities, card texts, hero Status Effects, Mission Boards, Ally cards, Momentum Cards, Mythic cards and Perk Sheets are read on the components — marked “On the component”. Points marked “Guide's reading” are interpretations where the booklets are silent.",
            "Este guia cobre os dois livros fornecidos: Marvel Dice Throne “Rules of Play” v1.0 (links marcados Básico, com o número da página impressa) e o livro de Marvel Dice Throne Missions v1.0 (links marcados Missões). Habilidades dos heróis, textos das cartas, Efeitos de Status dos heróis, Tabuleiros de Missão, cartas de Aliado, cartas de Momentum, cartas Míticas e Fichas de Vantagens são lidos nos componentes — marcados “No componente”. Trechos marcados “Leitura do guia” são interpretações onde os livros são omissos. Os componentes são em inglês, por isso os nomes impressos aparecem no original."
          )}</div>
          ${sections.map((section) => `<section class="rule-section">${section()}</section>`).join("")}
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the Marvel Dice Throne rulebooks. Dice Throne is a game by Nate Chatellier, Manny Trembley and Gavan Brown, published by Roxley and The Op; © MARVEL.",
        "Guia pessoal de consulta baseado nos livros de regras de Marvel Dice Throne. Dice Throne é um jogo de Nate Chatellier, Manny Trembley e Gavan Brown, publicado pela Roxley e The Op; © MARVEL."
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
      root.querySelector(".mdt-page")?.prepend(notice);
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
    ["mode", "mode", (value) => value, MODES],
    ["heroes", "heroes", (value) => Number(value), HEROES],
    ["difficulty", "difficulty", (value) => value, DIFFICULTIES],
    ["level", "level", (value) => Number(value), LEVELS],
    ["easypoints", "easyPoints", (value) => value, YES_NO],
    ["easyhealth", "easyHealth", (value) => value, YES_NO],
    ["easymomentum", "easyMomentum", (value) => value, YES_NO],
    ["perks", "perks", (value) => value, PERKS]
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
          applyMatchChange({ [key]: value });
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

  window.MarvelDiceThrone = { renderInto, onClick, onChange };
})();
