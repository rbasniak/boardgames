(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.heat.v1";
  const SETUP_KEY = "field-manual.heat.setup.v1";
  const MANUALS = { c: "heat_core.pdf", a: "heat_advanced.pdf" };
  const ICONS = "assets/heat/icons/";
  const MAX_CARS = 6;

  const FORMATS = ["race", "championship"];
  const PLAYER_COUNTS = ["1", "2", "3", "4", "5", "6"];
  const LEGEND_COUNTS = ["0", "1", "2", "3", "4", "5"];
  const PRO_LEVELS = ["0", "1", "2"];
  const TRACKS = ["usa", "france", "great-britain", "italy"];
  const LENGTHS = ["board", "learning"];
  const GARAGE = ["off", "random", "regular", "all"];
  const SEASONS = ["1961", "1962", "1963", "custom", "goat"];
  const UPGRADE_DECKS = ["regular", "advanced", "all"];
  const YES_NO = ["no", "yes"];

  const defaults = {
    language: "pt-BR",
    format: "race",
    players: "3",
    legends: "0",
    pro: "0",
    track: "usa",
    length: "learning",
    garage: "off",
    weather: "no",
    season: "1961",
    upgradeDeck: "regular",
    tournament: "no"
  };
  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------

  function pick(list, value, fallback) {
    return list.includes(String(value)) ? String(value) : fallback;
  }

  function normalizePreferences(saved) {
    const players = pick(PLAYER_COUNTS, saved?.players, defaults.players);
    let legends = pick(LEGEND_COUNTS, saved?.legends, defaults.legends);
    if (Number(players) + Number(legends) > MAX_CARS) {
      legends = String(MAX_CARS - Number(players));
    }
    return {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      format: pick(FORMATS, saved?.format, defaults.format),
      players,
      legends,
      pro: legends === "0" ? "0" : pick(PRO_LEVELS, saved?.pro, defaults.pro),
      track: pick(TRACKS, saved?.track, defaults.track),
      length: pick(LENGTHS, saved?.length, defaults.length),
      garage: pick(GARAGE, saved?.garage, defaults.garage),
      weather: pick(YES_NO, saved?.weather, defaults.weather),
      season: pick(SEASONS, saved?.season, defaults.season),
      upgradeDeck: pick(UPGRADE_DECKS, saved?.upgradeDeck, defaults.upgradeDeck),
      tournament: pick(YES_NO, saved?.tournament, defaults.tournament)
    };
  }

  // Only choices that change the physical preparation reset the checklist.
  function signature(source = state) {
    const common = `${source.format}|${source.players}|${source.legends}`;
    return source.format === "championship"
      ? `${common}|${source.season}|${source.upgradeDeck}`
      : `${common}|${source.track}|${source.length}|${source.garage}|${source.weather}`;
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Heat preferences.", error);
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
      console.error("Could not read Heat setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Heat preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Heat setup progress.", error);
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

  function isChampionship() {
    return state.format === "championship";
  }

  function humans() {
    return Number(state.players);
  }

  function legendCount() {
    return Number(state.legends);
  }

  function hasLegends() {
    return legendCount() > 0;
  }

  function totalCars() {
    return humans() + legendCount();
  }

  function isSolo() {
    return humans() === 1;
  }

  function usesGarage() {
    return isChampionship() || state.garage !== "off";
  }

  function usesWeather() {
    return isChampionship() || state.weather === "yes";
  }

  function usesTournament() {
    return state.tournament === "yes";
  }

  function configComplete() {
    return !(isSolo() && !hasLegends());
  }

  function adrenalineCars() {
    return totalCars() >= 5 ? 2 : 1;
  }

  function trackName(id = state.track) {
    return {
      usa: "USA",
      france: t("France", "França"),
      "great-britain": t("Great Britain", "Grã-Bretanha"),
      italy: t("Italy", "Itália")
    }[id];
  }

  function seasonLabel(id = state.season) {
    return {
      1961: t("1961 season · 3 races", "Temporada 1961 · 3 corridas"),
      1962: t("1962 season · 3 races", "Temporada 1962 · 3 corridas"),
      1963: t("1963 season · 4 races", "Temporada 1963 · 4 corridas"),
      custom: t("Custom season · 4 races", "Temporada personalizada · 4 corridas"),
      goat: t("GOAT · 1961 + 1962 + 1963", "GOAT · 1961 + 1962 + 1963")
    }[id];
  }

  function deckLabel(id = state.upgradeDeck) {
    return {
      regular: t("Regular Upgrades only", "Só Upgrades Regulares"),
      advanced: t("Advanced Upgrades only", "Só Upgrades Avançados"),
      all: t("Regular + Advanced", "Regulares + Avançados")
    }[id];
  }

  function garageLabel(id = state.garage) {
    return {
      off: t("Starting Upgrades (core)", "Upgrades Iniciais (básico)"),
      random: t("Garage · quick start (3 random Regular)", "Garagem · início rápido (3 Regulares ao acaso)"),
      regular: t("Garage · draft Regular", "Garagem · draft de Regulares"),
      all: t("Garage · draft Regular + Advanced", "Garagem · draft de Regulares + Avançados")
    }[id];
  }

  function manualUrl(book, page) {
    const script = document.querySelector('script[src*="heat.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${MANUALS[book]}`, baseUrl).href}#page=${page}`;
  }

  // Reference spec: "c5" = core Rules booklet p. 5, "a12" = Advanced booklet p. 12.
  function ref(spec) {
    const book = spec[0] === "a" ? "a" : "c";
    const page = Number(spec.slice(1));
    const label = book === "a" ? t(`Advanced p. ${page} ↗`, `Avançado p. ${page} ↗`) : t(`Rules p. ${page} ↗`, `Regras p. ${page} ↗`);
    return `<a class="source-link" href="${manualUrl(book, page)}" target="_blank" rel="noreferrer">${label}</a>`;
  }

  function refs(specs) {
    return (Array.isArray(specs) ? specs : [specs]).map(ref).join(" ");
  }

  function sectionHeading(id, title, index, specs) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("PIT WALL", "MURETA DOS BOXES")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="heat-section-references">${(specs || []).map(ref).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
  }

  function icon(file, altEn, altPt) {
    return `<img class="heat-inline-icon" src="${ICONS}${file}.webp" alt="${t(altEn, altPt)}">`;
  }

  function iconCard(file, titleEn, bodyEn, titlePt, bodyPt, spec) {
    const title = t(titleEn, titlePt);
    return `
      <article class="icon-card">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}.webp" alt="${title}"></span>
        <div><strong>${title}</strong><p>${t(bodyEn, bodyPt)}</p>${refs(spec)}</div>
      </article>`;
  }

  function infoCard(label, title, lines, specs) {
    return `
      <article class="info-card">
        <span class="component-label">${label}</span>
        <h3>${title}</h3>
        ${lineList(lines)}
        ${refs(specs)}
      </article>`;
  }

  function interpretation(en, pt) {
    return `<span class="heat-interpretation">${t("Guide's reading", "Leitura do guia")}</span> ${t(en, pt)}`;
  }

  function sectionList() {
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["victory", t("How to win", "Como vencer")],
      ["round", t("Playing a round", "Jogando uma rodada")],
      ["cards", t("Heat, Stress & cards", "Calor, Estresse e cartas")],
      ...(usesGarage() ? [["garage", t("Garage: Upgrades", "Garagem: Upgrades")]] : []),
      ...(hasLegends() ? [["legends", t("Legends", "Lendas")]] : []),
      ...(usesWeather() ? [["weather", t("Weather & Road", "Clima e Pista")]] : []),
      ...(isChampionship() ? [["championship", t("Championship", "Campeonato")]] : []),
      ...(usesTournament() ? [["tournament", t("Tournament Mode", "Modo Torneio")]] : []),
      ["icons", t("Iconography", "Iconografia")],
      ["examples", t("Examples", "Exemplos")],
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
          <span class="brand-mark" aria-hidden="true">HT</span>
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
      `${readFailed ? "This browser could not read the saved Heat match or setup progress; defaults are shown. " : ""}${writeFailed ? "The latest change could not be saved and is visible on screen only." : ""}`,
      `${readFailed ? "Este navegador não conseguiu ler a partida ou o progresso de Heat salvos; as opções padrão estão sendo mostradas. " : ""}${writeFailed ? "A alteração mais recente não pôde ser salva e aparece somente na tela." : ""}`
    ).trim();
  }

  // ---------- configuration ----------

  function choiceCard(name, value, dataAttr, checked, title, description, disabled = false) {
    return `
      <label class="heat-choice-card ${checked ? "is-selected" : ""} ${disabled ? "is-disabled" : ""}">
        <input type="radio" name="${name}" value="${value}" ${dataAttr} ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}>
        <span class="heat-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function choiceGroup(legend, summary, intro, cards, gridClass = "") {
    return `
      <fieldset class="heat-choice-group">
        <legend>${legend} <span>${summary}</span></legend>
        ${intro ? `<p class="heat-choice-intro">${intro}</p>` : ""}
        <div class="heat-choice-grid ${gridClass}">${cards}</div>
      </fieldset>`;
  }

  function playersLabel() {
    const people = isSolo() ? t("solo", "solo") : t(`${state.players} players`, `${state.players} jogadores`);
    return hasLegends() ? t(`${people} + ${state.legends} Legend${state.legends === "1" ? "" : "s"}`, `${people} + ${state.legends} Lenda${state.legends === "1" ? "" : "s"}`) : people;
  }

  function matchConfiguration() {
    const formatCards = [
      ["race", t("Single race", "Corrida avulsa"), t(
        "One race on one track. Start here: the Rules booklet's core game, then add Advanced modules (Garage, Weather & Road Conditions, Legends) one by one below.",
        "Uma corrida numa pista. Comece aqui: o jogo básico do livreto de Regras; depois acrescente os módulos Avançados (Garagem, Clima e Condições da Pista, Lendas) um a um abaixo."
      )],
      ["championship", t("Championship season", "Temporada de campeonato"), t(
        "Several races in a row with all modules together: Event and Track cards, an Upgrade drafted before each race, Weather & Road Conditions, Sponsorship cards, Press Corners and Championship points. Uses the Championship mat and scorepad.",
        "Várias corridas seguidas com todos os módulos juntos: cartas de Evento e de Pista, um Upgrade escolhido antes de cada corrida, Clima e Condições da Pista, cartas de Patrocínio, Curvas da Imprensa e pontos de Campeonato. Usa o tabuleiro de Campeonato e o bloco de pontuação."
      )]
    ].map(([value, title, desc]) => choiceCard("heat-format", value, `data-format="${value}"`, state.format === value, title, desc)).join("");

    const playerCards = PLAYER_COUNTS.map((value) => {
      const n = Number(value);
      const desc = n === 1
        ? t("Solo: you race only against Legends (choose at least 1 below; the booklet suggests at least 2).", "Solo: você corre só contra Lendas (escolha pelo menos 1 abaixo; o livreto sugere pelo menos 2).")
        : t(`${n} human drivers, each with their own car, mat, Gear pawn and deck.`, `${n} pilotos humanos, cada um com carro, painel, peão de Marcha e baralho próprios.`);
      return choiceCard("heat-players", value, `data-players="${value}"`, state.players === value, value === "1" ? t("1 · solo", "1 · solo") : value, desc);
    }).join("");

    const legendCards = LEGEND_COUNTS.map((value) => {
      const n = Number(value);
      const disabled = humans() + n > MAX_CARS;
      const desc = n === 0
        ? t("No automated drivers.", "Sem pilotos automáticos.")
        : t(`${n} Legend car${n === 1 ? "" : "s"} in unused colors, driven by the shared Legends deck. Total cars: ${humans() + n}.`, `${n} carro${n === 1 ? "" : "s"} de Lenda em cores não usadas, guiado${n === 1 ? "" : "s"} pelo baralho de Lendas. Total de carros: ${humans() + n}.`);
      return choiceCard("heat-legends", value, `data-legends="${value}"`, state.legends === value, value === "0" ? t("None", "Nenhuma") : value, disabled ? t("Not available: the box has 6 cars.", "Indisponível: a caixa tem 6 carros.") : desc, disabled);
    }).join("");

    const proCards = [
      ["0", t("Standard Legends", "Lendas padrão"), t("Use the Top Speed printed on each Legends card.", "Use a Velocidade Máxima impressa em cada carta de Lendas.")],
      ["1", t("Pro Legends +1", "Lendas Pro +1"), t("Add 1 to every Top Speed on the revealed cards.", "Some 1 a toda Velocidade Máxima das cartas reveladas.")],
      ["2", t("Pro Legends +2", "Lendas Pro +2"), t("Add 2 to every Top Speed — how the designers usually race.", "Some 2 a toda Velocidade Máxima — como os autores costumam correr.")]
    ].map(([value, title, desc]) => choiceCard("heat-pro", value, `data-pro="${value}"`, state.pro === value, title, desc)).join("");

    const raceGroups = isChampionship() ? "" : `
      ${choiceGroup(t("Track · selected:", "Pista · selecionada:"), trackName(), t("Two double-sided boards = 4 tracks. Each board prints its laps per race, corners per lap, spaces per lap and the Heat/Stress each car starts with.", "Dois tabuleiros dupla face = 4 pistas. Cada tabuleiro imprime voltas por corrida, curvas por volta, espaços por volta e o Calor/Estresse com que cada carro começa.") + " " + ref("c3"),
        TRACKS.map((id) => choiceCard("heat-track", id, `data-track="${id}"`, state.track === id, trackName(id), id === "usa" ? t("Recommended for your first race.", "Recomendada para a primeira corrida.") : t("Use the board side that shows this track.", "Use o lado do tabuleiro que mostra esta pista."))).join(""), "heat-choice-grid-4")}
      ${choiceGroup(t("Race length · selected:", "Duração · selecionada:"), state.length === "learning" ? t("1 learning lap", "1 volta de aprendizado") : t("Laps printed on the board", "Voltas impressas no tabuleiro"), "",
        [
          ["learning", t("Learning race · 1 lap", "Corrida de aprendizado · 1 volta"), t("Suggested for your first game: race a single lap instead of the laps printed on the board.", "Sugerida para a primeira partida: corra uma única volta em vez das voltas impressas no tabuleiro.")],
          ["board", t("Full race · board laps", "Corrida completa · voltas do tabuleiro"), t("Race the number of laps printed on the board (usually 2).", "Corra o número de voltas impresso no tabuleiro (normalmente 2).")]
        ].map(([value, title, desc]) => choiceCard("heat-length", value, `data-length="${value}"`, state.length === value, title, desc)).join(""))}
      ${choiceGroup(t("Cars · selected:", "Carros · selecionado:"), garageLabel(), t("The Garage Module replaces the 3 Starting Upgrade cards with 3 Upgrade cards per player.", "O Módulo de Garagem troca as 3 cartas de Upgrade Inicial por 3 cartas de Upgrade por jogador.") + " " + ref("a3"),
        [
          ["off", garageLabel("off"), t("Everyone shuffles the same 3 Starting Upgrade cards (0, 5 and an extra Heat) into their deck. Use this for your first races.", "Todos embaralham as mesmas 3 cartas de Upgrade Inicial (0, 5 e um Calor extra) no baralho. Use nas primeiras corridas.")],
          ["random", garageLabel("random"), t("Garage quick start: shuffle the Regular Upgrade cards and deal 3 at random to each player. No draft.", "Início rápido da Garagem: embaralhe as cartas de Upgrade Regulares e dê 3 ao acaso a cada jogador. Sem draft.")],
          ["regular", garageLabel("regular"), t("Draft 3 Upgrades each from a market of Regular cards only (recommended for your first Garage games).", "Cada um escolhe 3 Upgrades num mercado só de cartas Regulares (recomendado nas primeiras partidas com Garagem).")],
          ["all", garageLabel("all"), t("Draft from Regular and Advanced Upgrades (Advanced cards carry the gear-and-wrench icon).", "Draft com Upgrades Regulares e Avançados (cartas Avançadas têm o ícone de engrenagem e chave).")]
        ].map(([value, title, desc]) => choiceCard("heat-garage", value, `data-garage="${value}"`, state.garage === value, title, desc)).join(""))}
      ${choiceGroup(t("Weather & Road Conditions · selected:", "Clima e Condições da Pista · selecionado:"), state.weather === "yes" ? t("In play", "Em jogo") : t("Not used", "Não usado"), "",
        [
          ["no", t("Not used", "Não usado"), t("Corners and straights work exactly as printed.", "Curvas e retas funcionam exatamente como impressas.")],
          ["yes", t("In play", "Em jogo"), t("1 random Weather token changes everyone's Heat/Stress before the race; 1 Road Conditions token per corner changes Speed Limits or a whole sector. Prepared before the cars are built.", "1 ficha de Clima sorteada muda o Calor/Estresse de todos antes da corrida; 1 ficha de Condições da Pista por curva muda Limites de Velocidade ou um setor inteiro. Preparado antes de montar os carros.")]
        ].map(([value, title, desc]) => choiceCard("heat-weather", value, `data-weather="${value}"`, state.weather === value, title, desc)).join(""))}`;

    const champGroups = !isChampionship() ? "" : `
      ${choiceGroup(t("Season · selected:", "Temporada · selecionada:"), seasonLabel(), t("Each historic season has its own Event cards (season and race number at the bottom of each card).", "Cada temporada histórica tem as próprias cartas de Evento (temporada e número da corrida no rodapé de cada carta).") + " " + ref("a8") + " " + ref("a10"),
        [
          ["1961", seasonLabel("1961"), t("Suggested first season.", "Temporada sugerida para começar.")],
          ["1962", seasonLabel("1962"), t("Use the 1962 Event cards.", "Use as cartas de Evento de 1962.")],
          ["1963", seasonLabel("1963"), t("Use the 1963 Event cards.", "Use as cartas de Evento de 1963.")],
          ["custom", seasonLabel("custom"), t("Shuffle the 4 Track cards to set the race order; before each race draw a random Event card for that track.", "Embaralhe as 4 cartas de Pista para definir a ordem; antes de cada corrida compre uma carta de Evento ao acaso para aquela pista.")],
          ["goat", seasonLabel("goat"), t("Play the three historic seasons in a row. At the end of each season every player keeps only 1 Upgrade card of their choice for the next season.", "Jogue as três temporadas históricas em sequência. No fim de cada temporada, cada jogador mantém só 1 carta de Upgrade à escolha para a próxima.")]
        ].map(([value, title, desc]) => choiceCard("heat-season", value, `data-season="${value}"`, state.season === value, title, desc)).join(""), "heat-choice-grid-3")}
      ${choiceGroup(t("Upgrade deck · selected:", "Baralho de Upgrades · selecionado:"), deckLabel(), t("Decided once for the whole season; unused Upgrade cards go back to the box.", "Definido uma vez para a temporada inteira; cartas de Upgrade não usadas voltam à caixa.") + " " + ref("a8"),
        UPGRADE_DECKS.map((id) => choiceCard("heat-deck", id, `data-deck="${id}"`, state.upgradeDeck === id, deckLabel(id), {
          regular: t("The 34 Regular Upgrade cards.", "As 34 cartas de Upgrade Regulares."),
          advanced: t("The 62 Advanced Upgrade cards (gear-and-wrench icon).", "As 62 cartas de Upgrade Avançadas (ícone de engrenagem e chave)."),
          all: t("All 96 Upgrade cards shuffled together.", "Todas as 96 cartas de Upgrade embaralhadas juntas.")
        }[id])).join(""), "heat-choice-grid-3")}`;

    return `
      <section class="controls-panel heat-config" id="build-match" aria-labelledby="heat-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="heat-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "Two booklets: the Rules booklet (core game) and the Advanced Play & Championship booklet, whose modules can be used individually or in any combination. Choices here filter the setup checklist and the rules shown below.",
              "Dois livretos: o de Regras (jogo básico) e o de Jogo Avançado e Campeonato, cujos módulos podem ser usados separadamente ou em qualquer combinação. As escolhas aqui filtram a lista de preparação e as regras mostradas abaixo."
            )}</p>
          </div>
        </div>
        ${choiceGroup(t("Format · selected:", "Formato · selecionado:"), isChampionship() ? t("Championship", "Campeonato") : t("Single race", "Corrida avulsa"), ref("a2") + " " + ref("a8"), formatCards)}
        ${choiceGroup(t("Human players · selected:", "Jogadores humanos · selecionado:"), playersLabel(), t("The box has 6 cars; players plus Legends cannot exceed 6.", "A caixa tem 6 carros; jogadores mais Lendas não podem passar de 6.") + " " + ref("c2"), playerCards, "heat-choice-grid-6")}
        ${choiceGroup(t("Legends (bots) · selected:", "Lendas (bots) · selecionado:"), hasLegends() ? state.legends : t("none", "nenhuma"), t("Suggested when fewer than 4 people play, and at least 2 Legends if you add any — but there is no wrong choice. Legends count as cars for Adrenaline and the 5+ cars rule.", "Sugeridas quando menos de 4 pessoas jogam, e pelo menos 2 Lendas se usar alguma — mas não há escolha errada. Lendas contam como carros para Adrenalina e para a regra de 5+ carros.") + " " + ref("a5"), legendCards, "heat-choice-grid-6")}
        ${configComplete() ? "" : `<p class="heat-config-warning" role="status">${t("Incomplete match: a solo race needs at least 1 Legend. Choose Legends before following the setup checklist.", "Partida incompleta: uma corrida solo precisa de pelo menos 1 Lenda. Escolha Lendas antes de seguir a lista de preparação.")}</p>`}
        ${hasLegends() ? choiceGroup(t("Legend difficulty · selected:", "Dificuldade das Lendas · selecionada:"), state.pro === "0" ? t("Standard", "Padrão") : `Pro +${state.pro}`, t("Pro Legends: raise Top Speed on all cards by 1 or more.", "Lendas Pro: aumente a Velocidade Máxima de todas as cartas em 1 ou mais.") + " " + ref("a5"), proCards, "heat-choice-grid-3") : ""}
        ${raceGroups}
        ${champGroups}
        ${choiceGroup(t("Tournament Mode · selected:", "Modo Torneio · selecionado:"), usesTournament() ? t("On", "Ligado") : t("Off", "Desligado"), ref("a11"),
          [
            ["no", t("Off · normal gear shifting", "Desligado · troca de marcha normal"), t("Everyone shifts gears in step 1, then plays that many cards.", "Todos trocam de marcha no passo 1 e depois jogam essa quantidade de cartas.")],
            ["yes", t("On · hidden gear choice", "Ligado · marcha oculta"), t("Nobody moves their Gear pawn in step 1. You play cards first; at Reveal & Move the number of cards you played sets your new gear (shifting 2 gears still costs 1 Heat).", "Ninguém move o peão de Marcha no passo 1. Você joga as cartas primeiro; em Revelar e Mover, o número de cartas jogadas define a nova marcha (trocar 2 marchas ainda custa 1 Calor).")]
          ].map(([value, title, desc]) => choiceCard("heat-tournament", value, `data-tournament="${value}"`, state.tournament === value, title, desc)).join(""))}
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function heatStressLine() {
    return usesWeather()
      ? t("Read on the board how many Heat and Stress cards each car uses (usually 6 Heat and 3 Stress), then apply the Weather token's car-setup effect (drawn in the next step). Everyone uses the same numbers.",
        "Leia no tabuleiro quantas cartas de Calor e de Estresse cada carro usa (normalmente 6 de Calor e 3 de Estresse) e aplique o efeito de preparação do carro da ficha de Clima (comprada na próxima etapa). Todos usam os mesmos números.")
      : t("Read on the board how many Heat and Stress cards each car uses — usually 6 Heat and 3 Stress. Everyone uses the same numbers.",
        "Leia no tabuleiro quantas cartas de Calor e de Estresse cada carro usa — normalmente 6 de Calor e 3 de Estresse. Todos usam os mesmos números.");
  }

  function weatherItems() {
    return [
      t("Shuffle the 6 Weather tokens face down, draw 1 for the whole race and place it face up on the board's Billboard space (Weather Billboard). The small card picture in its lower-left corner is the car-setup effect for every car; the symbol in its lower-right corner is the weather effect, used only in sectors with a Weather Road Conditions token.",
        "Embaralhe as 6 fichas de Clima viradas para baixo, compre 1 para a corrida inteira e coloque-a virada para cima no espaço do Outdoor do tabuleiro (Outdoor de Clima). A pequena figura de carta no canto inferior esquerdo é o efeito de preparação para todos os carros; o símbolo do canto inferior direito é o efeito de clima, usado só nos setores com uma ficha de Condição da Pista de Clima."),
      t("Car-setup effects (applied to everyone before the race): +1 Stress in the deck · −1 Stress · +1 Heat in the Engine · −1 Heat from the Engine · 3 of your Heat cards shuffled into the draw deck instead of the Engine · 3 of your Heat cards placed in your discard pile instead of the Engine.",
        "Efeitos de preparação (para todos, antes da corrida): +1 Estresse no baralho · −1 Estresse · +1 Calor no Motor · −1 Calor do Motor · 3 das suas cartas de Calor embaralhadas no baralho de compra em vez do Motor · 3 das suas cartas de Calor na pilha de descarte em vez do Motor."),
      t("Shuffle the 12 Road Conditions tokens face down and draw as many as the track has corners per lap (printed on the board); return the rest to the box unseen.",
        "Embaralhe as 12 fichas de Condições da Pista viradas para baixo e compre tantas quantas curvas por volta a pista tiver (impresso no tabuleiro); devolva as outras à caixa sem olhar."),
      t("Going around the track in racing order from the start, reveal one drawn token per corner. Token with the Sector symbol (two dots joined by an arrow): put it on the tent beside the straight that starts after this corner — it affects every space up to the next corner. Token without it: put it on the tent beside this corner — it affects that Corner Line.",
        "Percorrendo a pista na ordem da corrida a partir da largada, revele uma ficha comprada por curva. Ficha com o símbolo de Setor (dois pontos ligados por uma seta): coloque-a na tenda ao lado do trecho que começa depois desta curva — afeta todos os espaços até a próxima curva. Ficha sem esse símbolo: coloque-a na tenda ao lado desta curva — afeta aquela Linha de Curva.")
    ];
  }

  function legendsItems() {
    return [
      t("Shuffle the 10 Legends cards and place them face down on the Legends mat.", "Embaralhe as 10 cartas de Lendas e coloque-as viradas para baixo no tabuleiro de Lendas."),
      t(`Take ${state.legends} car${state.legends === "1" ? "" : "s"} in colors no player uses; these are the Legends. Legends have no mat, Gear pawn or deck.`, `Pegue ${state.legends} carro${state.legends === "1" ? "" : "s"} em cores que nenhum jogador usa; são as Lendas. Lendas não têm painel, peão de Marcha nem baralho.`),
      state.pro !== "0" ? t(`Pro Legends +${state.pro}: add ${state.pro} once to the Top Speed printed in the helmet (the Quick Reference and Legends section already show “+${state.pro}”).`, `Lendas Pro +${state.pro}: some ${state.pro} uma vez à Velocidade Máxima impressa no capacete (a Referência rápida e a seção Lendas já mostram “+${state.pro}”).`) : null
    ];
  }

  function racePhases() {
    const garage = state.garage;
    const players = humans();
    const phases = [
      {
        id: "board",
        title: t("Board and race length", "Tabuleiro e duração da corrida"),
        specs: ["c2", "c3"],
        items: [
          t(`Place the game board with the ${trackName()} track face up in the middle of the table.`, `Coloque o tabuleiro com a pista ${trackName()} para cima no centro da mesa.`),
          t("On the board's corner panel, find: laps per race, corners per lap, spaces per lap, the Hall of Fame (finishing order) and the Heat/Stress each car starts with.", "No painel do canto do tabuleiro, localize: voltas por corrida, curvas por volta, espaços por volta, o Hall da Fama (ordem de chegada) e o Calor/Estresse com que cada carro começa."),
          state.length === "learning"
            ? t("Learning race: you will race 1 lap, not the laps printed on the board.", "Corrida de aprendizado: vocês correrão 1 volta, não as voltas impressas no tabuleiro.")
            : t("Full race: race the number of laps printed on the board.", "Corrida completa: corram o número de voltas impresso no tabuleiro."),
          heatStressLine()
        ]
      }
    ];
    if (state.weather === "yes") {
      phases.push({ id: "weather", title: t("Weather and Road Conditions", "Clima e Condições da Pista"), specs: ["a6", "a7"], items: weatherItems() });
    }
    phases.push({
      id: "players",
      title: isSolo() ? t("Your car kit", "O kit do seu carro") : t("Each player's car kit", "O kit de cada jogador"),
      specs: ["c2", "c3"],
      items: [
        t(`${isSolo() ? "Choose" : "Each player chooses"} a color and takes that color's race car, player mat, Gear pawn and 12 Basic cards (values 1–4, three of each, with the speedometer symbol).`, `${isSolo() ? "Escolha" : "Cada jogador escolhe"} uma cor e pega o carro, o painel, o peão de Marcha e as 12 cartas Básicas dessa cor (valores 1–4, três de cada, com o símbolo de velocímetro).`),
        garage === "off"
          ? t("Also take the 3 Starting Upgrade cards of that color (chevron pattern): a 0, a 5 and an extra Heat card — this extra Heat is on top of the board's Heat count and goes in your deck, not the Engine.", "Pegue também as 3 cartas de Upgrade Inicial dessa cor (padrão de divisas): um 0, um 5 e uma carta de Calor extra — esse Calor extra é além da contagem do tabuleiro e vai no baralho, não no Motor.")
          : t("Leave the Starting Upgrade cards in the box — the Garage Module replaces them.", "Deixe as cartas de Upgrade Inicial na caixa — o Módulo de Garagem as substitui."),
        t("From the Heat and Stress piles, take the numbers found in step 1 (after Weather, if used). Put the remaining Stress cards face up near the board as the Stress reserve; keep the remaining Heat cards nearby as a reserve too.", "Das pilhas de Calor e Estresse, pegue os números vistos na etapa 1 (depois do Clima, se usado). Coloque o restante das cartas de Estresse viradas para cima perto do tabuleiro como reserva de Estresse; deixe o restante do Calor por perto como reserva também."),
        t("Place your player mat in front of you.", "Coloque seu painel à sua frente.")
      ]
    });
    if (hasLegends()) {
      phases.push({ id: "legends", title: t("Legends", "Lendas"), specs: ["a5"], items: legendsItems() });
    }
    phases.push({
      id: "grid",
      title: t("Starting grid", "Grid de largada"),
      specs: ["c3", "a5"],
      items: [
        t(`Mix all ${totalCars()} participating cars${hasLegends() ? " (players' and Legends')" : ""} and place them on the starting grid at random, one at a time, filling the grid spots in ascending order (1, 2, 3…).`, `Misture todos os ${totalCars()} carros participantes${hasLegends() ? " (dos jogadores e das Lendas)" : ""} e coloque-os no grid de largada ao acaso, um de cada vez, preenchendo os lugares em ordem crescente (1, 2, 3…).`),
        t("This grid sets the order for the first round: spot 1 moves first.", "Esse grid define a ordem da primeira rodada: o lugar 1 move primeiro.")
      ]
    });
    if (garage === "random") {
      phases.push({
        id: "garage",
        title: t("Garage quick start", "Início rápido da Garagem"),
        specs: ["a3", "a4"],
        items: [
          t("Shuffle all Regular Upgrade cards (those without the gear-and-wrench Advanced icon).", "Embaralhe todas as cartas de Upgrade Regulares (as sem o ícone Avançado de engrenagem e chave)."),
          t(`Deal 3 at random to each player (${players * 3} cards). Return the rest to the box.`, `Dê 3 ao acaso a cada jogador (${players * 3} cartas). Devolva o resto à caixa.`)
        ]
      });
    } else if (garage === "regular" || garage === "all") {
      const market = players + 3;
      phases.push({
        id: "garage",
        title: t("Garage draft: build your car", "Draft da Garagem: monte seu carro"),
        specs: ["a3", "a4"],
        items: [
          garage === "regular"
            ? t("Take only the Regular Upgrade cards (no gear-and-wrench icon) and shuffle them into the Upgrade deck.", "Pegue só as cartas de Upgrade Regulares (sem ícone de engrenagem e chave) e embaralhe-as como baralho de Upgrades.")
            : t("Shuffle all Regular and Advanced Upgrade cards together into the Upgrade deck.", "Embaralhe juntas todas as cartas de Upgrade Regulares e Avançadas como baralho de Upgrades."),
          t(`Round 1 · Deal a market of ${market} cards face up on the board (1 per player + 3). Pick one card each, from back to front of the grid: the last player's car picks first. Discard the leftovers.`, `Rodada 1 · Abra um mercado de ${market} cartas viradas para cima no tabuleiro (1 por jogador + 3). Cada um escolhe uma carta, de trás para a frente do grid: o carro do último jogador escolhe primeiro. Descarte as sobras.`),
          t(`Round 2 · New market of ${market} cards. Pick from front to back: the first player's car picks first. Discard the leftovers.`, `Rodada 2 · Novo mercado de ${market} cartas. Escolham da frente para trás: o carro do primeiro jogador escolhe primeiro. Descarte as sobras.`),
          t(`Round 3 · New market of ${market} cards. Pick back to front again. Discard the leftovers.`, `Rodada 3 · Novo mercado de ${market} cartas. Escolham de novo de trás para a frente. Descarte as sobras.`),
          hasLegends() ? interpretation("Legends do not draft; skip their cars when following the grid order (the Championship rules say the same for its draft).", "Lendas não participam do draft; pule os carros delas ao seguir a ordem do grid (as regras do Campeonato dizem o mesmo para o draft delas).") : null
        ]
      });
    }
    phases.push({
      id: "decks",
      title: t("Decks, Engine and gear", "Baralhos, Motor e marcha"),
      specs: ["c3", "a4"],
      items: [
        t(`Shuffle together your 12 Basic cards, your 3 ${garage === "off" ? "Starting Upgrade" : "Upgrade"} cards and your Stress cards. Place this draw deck face down on the left spot of your mat.`, `Embaralhe juntas suas 12 cartas Básicas, suas 3 cartas de ${garage === "off" ? "Upgrade Inicial" : "Upgrade"} e suas cartas de Estresse. Coloque esse baralho de compra virado para baixo no espaço esquerdo do painel.`),
        t("Place your Heat cards face up on the Engine spot in the middle of your mat.", "Coloque suas cartas de Calor viradas para cima no espaço do Motor, no meio do painel."),
        state.weather === "yes" ? t("If the Weather token moves 3 Heat cards to your deck or discard pile, do that now instead of putting those 3 in the Engine (shuffle them in with the deck, or start your discard pile — the right spot — with them).", "Se a ficha de Clima manda 3 cartas de Calor para o baralho ou para o descarte, faça isso agora em vez de colocar essas 3 no Motor (embaralhe-as com o baralho, ou comece a pilha de descarte — o espaço direito — com elas).") : null,
        t("Put your Gear pawn on 1st gear.", "Coloque o peão de Marcha na 1ª marcha.")
      ]
    });
    phases.push({
      id: "start",
      title: t("Starting hand", "Mão inicial"),
      specs: ["c3"],
      items: [
        t("Each player draws 7 cards from their draw deck. You are ready to race.", "Cada jogador compra 7 cartas do baralho de compra. Prontos para correr."),
        t("Optional handicap: an experienced driver racing rookies may remove 1 or 2 Heat from their own Engine.", "Desvantagem opcional: um piloto experiente correndo com novatos pode tirar 1 ou 2 Calor do próprio Motor.")
      ]
    });
    return phases;
  }

  function championshipPhases() {
    const season = state.season;
    const seasonItem = {
      1961: t("Take the 1961 Event cards (3 races) and their Track cards; sort them by race number (bottom of each Event card).", "Pegue as cartas de Evento de 1961 (3 corridas) e as cartas de Pista correspondentes; ordene-as pelo número da corrida (rodapé de cada carta de Evento)."),
      1962: t("Take the 1962 Event cards (3 races) and their Track cards; sort them by race number.", "Pegue as cartas de Evento de 1962 (3 corridas) e as cartas de Pista correspondentes; ordene-as pelo número da corrida."),
      1963: t("Take the 1963 Event cards (4 races) and their Track cards; sort them by race number.", "Pegue as cartas de Evento de 1963 (4 corridas) e as cartas de Pista correspondentes; ordene-as pelo número da corrida."),
      custom: t("Shuffle the 4 Track cards: their order is the order of your 4 races. Shuffle all 10 Event cards face down; before each race you will draw one at random for that track.", "Embaralhe as 4 cartas de Pista: a ordem delas é a ordem das 4 corridas. Embaralhe as 10 cartas de Evento viradas para baixo; antes de cada corrida, compre uma ao acaso para aquela pista."),
      goat: t("Take the 1961 Event cards first (then 1962, then 1963 for the next seasons) and the Track cards; sort them by race number.", "Pegue primeiro as cartas de Evento de 1961 (depois 1962 e 1963 nas próximas temporadas) e as cartas de Pista; ordene-as pelo número da corrida.")
    }[season];
    const phases = [
      {
        id: "season",
        title: t("Season: Event and Track cards", "Temporada: cartas de Evento e de Pista"),
        specs: ["a8", "a10"],
        items: [seasonItem, t("Take one Championship scoresheet from the scorepad for the whole season.", "Pegue uma folha do bloco de pontuação do Campeonato para a temporada inteira.")]
      },
      {
        id: "players",
        title: isSolo() ? t("Your car kit", "O kit do seu carro") : t("Each player's car kit", "O kit de cada jogador"),
        specs: ["a8"],
        items: [
          t(`${isSolo() ? "Choose" : "Each player chooses"} a color and takes that color's car, player mat, Gear pawn and 12 Basic cards.`, `${isSolo() ? "Escolha" : "Cada jogador escolhe"} uma cor e pega o carro, o painel, o peão de Marcha e as 12 cartas Básicas dessa cor.`),
          t("Put all Starting Upgrade cards back in the box: they are not used in championships.", "Devolva todas as cartas de Upgrade Inicial à caixa: elas não são usadas no campeonato.")
        ]
      },
      {
        id: "mat",
        title: t("Championship mat and reserves", "Tabuleiro de Campeonato e reservas"),
        specs: ["a8"],
        items: [
          t("Place the Championship mat at the side of the table (decks share the same back — keep each on its own spot).", "Coloque o tabuleiro de Campeonato ao lado da mesa (os baralhos têm o mesmo verso — mantenha cada um no seu espaço)."),
          t("Shuffle the 35 Sponsorship cards into a face-down Sponsorship deck on its spot.", "Embaralhe as 35 cartas de Patrocínio num baralho virado para baixo no espaço delas."),
          t(`Upgrade deck: ${deckLabel()}. Return the unused Upgrade cards to the box, shuffle the chosen ones and place them face down on their spot.`, `Baralho de Upgrades: ${deckLabel()}. Devolva à caixa as cartas de Upgrade não usadas, embaralhe as escolhidas e coloque-as viradas para baixo no espaço delas.`),
          t("Shuffle the 6 Weather tokens into a face-down pile on their spot; do the same with the 12 Road Conditions tokens.", "Embaralhe as 6 fichas de Clima numa pilha virada para baixo no espaço delas; faça o mesmo com as 12 fichas de Condições da Pista."),
          t("Put the Heat and Stress cards face up as a reserve near the Championship mat. Keep the 2 Press Corner standees nearby.", "Coloque as cartas de Calor e Estresse viradas para cima como reserva perto do tabuleiro de Campeonato. Deixe os 2 totens de Curva da Imprensa por perto.")
        ]
      }
    ];
    if (hasLegends()) {
      phases.push({ id: "legends", title: t("Legends", "Lendas"), specs: ["a5"], items: legendsItems() });
    }
    phases.push(
      {
        id: "race-event",
        race: true,
        title: t("Before each race · Event card and board", "Antes de cada corrida · carta de Evento e tabuleiro"),
        specs: ["a8"],
        items: [
          season === "custom"
            ? t("Draw a random Event card for this race's track and put it face up on its spot on the Championship mat.", "Compre uma carta de Evento ao acaso para a pista desta corrida e coloque-a virada para cima no espaço dela no tabuleiro de Campeonato.")
            : t("Find this race's Event card (season and race number at its bottom) and put it face up on its spot on the Championship mat.", "Ache a carta de Evento desta corrida (temporada e número da corrida no rodapé) e coloque-a virada para cima no espaço dela no tabuleiro de Campeonato."),
          t("The Event card names the track: place that board side in the middle of the table and take the matching Track card.", "A carta de Evento indica a pista: coloque esse lado do tabuleiro no centro da mesa e pegue a carta de Pista correspondente."),
          t("Race the laps printed on the board.", "Corram as voltas impressas no tabuleiro.")
        ]
      },
      {
        id: "race-grid",
        race: true,
        title: t("Before each race · Starting grid", "Antes de cada corrida · Grid de largada"),
        specs: ["a8"],
        items: [
          t(`First race: place all ${totalCars()} cars on the grid at random, filling spots in ascending order.`, `Primeira corrida: coloque os ${totalCars()} carros no grid ao acaso, preenchendo os lugares em ordem crescente.`),
          t("Later races: follow the Championship standing — most points takes pole position (spot 1), and so on. Tie: whoever was better positioned in the previous race.", "Corridas seguintes: sigam a classificação do Campeonato — quem tem mais pontos larga na pole position (lugar 1), e assim por diante. Empate: quem chegou em melhor posição na corrida anterior."),
          hasLegends() ? interpretation("The booklet does not say where Legends start in later races. If you record their points (see Championship), place them by the standing too; otherwise place them at random after the players.", "O livreto não diz onde as Lendas largam nas corridas seguintes. Se você anotar os pontos delas (veja Campeonato), posicione-as pela classificação também; senão, coloque-as ao acaso depois dos jogadores.") : null
        ]
      },
      {
        id: "race-steps",
        race: true,
        title: t("Before each race · Event card steps (top to bottom)", "Antes de cada corrida · passos da carta de Evento (de cima para baixo)"),
        specs: ["a8", "a9", "a10"],
        items: [
          t("Do only the steps whose icons are on the right side of the Event card, in this order:", "Faça só os passos cujos ícones aparecem no lado direito da carta de Evento, nesta ordem:"),
          `${icon("event-build-car", "Build your car", "Monte seu carro")} ${t(`Build your car (wrench): draw ${humans() + 3} Upgrade cards face up (1 per player + 3). Pick one each, starting with the player last on the grid and going up${hasLegends() ? " (ignore Legends)" : ""}; keep it face up in front of you. Then the last player on the grid may swap one Upgrade card they already own for one of the leftovers. Shuffle the leftovers back into the Upgrade deck.`, `Monte seu carro (chave): abra ${humans() + 3} cartas de Upgrade viradas para cima (1 por jogador + 3). Cada um escolhe uma, começando pelo jogador mais atrás no grid e subindo${hasLegends() ? " (ignore as Lendas)" : ""}; deixe-a virada para cima à sua frente. Depois, o último jogador do grid pode trocar uma carta de Upgrade que já tem por uma das sobras. Embaralhe as sobras de volta no baralho de Upgrades.`)}`,
          `${icon("event-sponsorship", "Sponsorship", "Patrocínio")} ${t("Sponsorship (handshake + number): every player draws that many Sponsorship cards and keeps them aside — they will be part of the 7-card starting hand.", "Patrocínio (aperto de mão + número): cada jogador compra esse número de cartas de Patrocínio e as separa — farão parte da mão inicial de 7 cartas.")}`,
          `${icon("event-press-corner", "Press corner", "Curva da Imprensa")} ${t("Press Corner (camera + letter): find that letter on the Track card to see which corner(s); put a Press Corner standee next to each.", "Curva da Imprensa (câmera + letra): procure a letra na carta de Pista para ver qual(is) curva(s); coloque um totem de Curva da Imprensa ao lado de cada uma.")}`,
          `${icon("event-weather", "Weather and Road Conditions", "Clima e Condições da Pista")} ${t("Weather & Road Conditions: draw the top Weather token, place it face up on the Weather Billboard. Each player takes the Heat and Stress cards shown on the Billboard, modified by the token. Draw 1 Road Conditions token per corner and place them as in the single-race module (Sector symbol → straight after the corner; otherwise → the corner).", "Clima e Condições da Pista: compre a ficha de Clima do topo e coloque-a virada para cima no Outdoor de Clima. Cada jogador pega as cartas de Calor e Estresse mostradas no Outdoor, modificadas pela ficha. Compre 1 ficha de Condições da Pista por curva e posicione-as como no módulo de corrida avulsa (símbolo de Setor → trecho depois da curva; senão → a curva).")}`,
          t("Event: read the special event aloud. It may change setup or rules, or set a challenge — its text is on the card.", "Evento: leia o evento especial em voz alta. Pode mudar a preparação ou as regras, ou propor um desafio — o texto está na carta."),
          interpretation("If the Event card shows no Weather icon, use the Heat and Stress printed on the board's Billboard without a token.", "Se a carta de Evento não mostrar o ícone de Clima, use o Calor e o Estresse impressos no Outdoor do tabuleiro, sem ficha.")
        ]
      },
      {
        id: "race-decks",
        race: true,
        title: t("Before each race · Decks, Engine and starting hand", "Antes de cada corrida · Baralhos, Motor e mão inicial"),
        specs: ["a9"],
        items: [
          t("Place your player mat in front of you. Shuffle your 12 Basic cards, all your Upgrade cards (including the one just drafted), Sponsorship cards kept from earlier races and your Stress cards into a face-down draw deck on the left spot.", "Coloque seu painel à sua frente. Embaralhe suas 12 cartas Básicas, todas as suas cartas de Upgrade (inclusive a que acabou de escolher), as cartas de Patrocínio guardadas de corridas anteriores e suas cartas de Estresse num baralho de compra virado para baixo no espaço esquerdo."),
          t("Place your Heat cards face up on the Engine spot (apply a Weather token that sends 3 Heat to the deck or discard pile). Gear pawn on 1st gear.", "Coloque suas cartas de Calor viradas para cima no espaço do Motor (aplique a ficha de Clima que manda 3 Calor ao baralho ou ao descarte). Peão de Marcha na 1ª marcha."),
          t("Take into your hand the Sponsorship cards drawn this race, then draw from your deck until you have your hand size (usually 7, unless the Event changes it).", "Pegue na mão as cartas de Patrocínio compradas para esta corrida e compre do baralho até ter o tamanho de mão (normalmente 7, salvo se o Evento mudar).")
        ]
      }
    );
    return phases;
  }

  function setupPhases() {
    return isChampionship() ? championshipPhases() : racePhases();
  }

  function inventory() {
    const players = humans();
    const cards = [
      infoCard(t(`PER PLAYER · ×${players}`, `POR JOGADOR · ×${players}`), t("One driver's kit", "O kit de um piloto"), [
        t("1 race car · 1 player mat · 1 Gear pawn (same color).", "1 carro · 1 painel · 1 peão de Marcha (mesma cor)."),
        t("12 Basic cards: three each of 1, 2, 3 and 4.", "12 cartas Básicas: três de cada valor 1, 2, 3 e 4."),
        !usesGarage()
          ? t("3 Starting Upgrade cards: 0, 5 and 1 extra Heat.", "3 cartas de Upgrade Inicial: 0, 5 e 1 Calor extra.")
          : isChampionship()
            ? t("Upgrade cards: 1 drafted before each race (they accumulate over the season).", "Cartas de Upgrade: 1 escolhida antes de cada corrida (acumulam na temporada).")
            : t("3 Upgrade cards from the Garage Module.", "3 cartas de Upgrade do Módulo de Garagem."),
        t("Heat and Stress cards as printed on the board (usually 6 Heat, 3 Stress).", "Cartas de Calor e Estresse conforme o tabuleiro (normalmente 6 de Calor e 3 de Estresse).")
      ], ["c2", "c3"]),
      infoCard(t("SHARED", "COMPARTILHADO"), t("Table", "Mesa"), [
        isChampionship() ? t("Board for each race's track (2 double-sided boards).", "Tabuleiro da pista de cada corrida (2 tabuleiros dupla face).") : t(`1 board, ${trackName()} side.`, `1 tabuleiro, lado ${trackName()}.`),
        t("Stress reserve (37 Stress cards in the box) and Heat reserve (48 Heat cards in the box).", "Reserva de Estresse (37 cartas de Estresse na caixa) e reserva de Calor (48 cartas de Calor na caixa)."),
        usesWeather() ? t("6 Weather tokens · 12 Road Conditions tokens.", "6 fichas de Clima · 12 fichas de Condições da Pista.") : null,
        hasLegends() ? t(`Legends: 1 Legends mat · 10 Legends cards · ${state.legends} car${state.legends === "1" ? "" : "s"}.`, `Lendas: 1 tabuleiro de Lendas · 10 cartas de Lendas · ${state.legends} carro${state.legends === "1" ? "" : "s"}.`) : null,
        !isChampionship() && (state.garage === "regular" || state.garage === "random") ? t("34 Regular Upgrade cards.", "34 cartas de Upgrade Regulares.") : null,
        !isChampionship() && state.garage === "all" ? t("96 Upgrade cards: 34 Regular + 62 Advanced.", "96 cartas de Upgrade: 34 Regulares + 62 Avançadas.") : null
      ], ["c2", "a2"])
    ];
    if (isChampionship()) {
      cards.push(infoCard(t("CHAMPIONSHIP", "CAMPEONATO"), t("Season components", "Componentes da temporada"), [
        t("1 Championship mat · 1 scorepad · 4 Track cards · 10 Event cards.", "1 tabuleiro de Campeonato · 1 bloco de pontuação · 4 cartas de Pista · 10 cartas de Evento."),
        t("35 Sponsorship cards · 2 Press Corner standees.", "35 cartas de Patrocínio · 2 totens de Curva da Imprensa."),
        t(`Upgrade deck: ${deckLabel()}.`, `Baralho de Upgrades: ${deckLabel()}.`)
      ], "a2"));
    }
    cards.push(infoCard(t("STAYS IN THE BOX", "FICA NA CAIXA"), t("Not used in this match", "Não usado nesta partida"), [
      usesGarage() ? t("Starting Upgrade cards.", "Cartas de Upgrade Inicial.") : t("All Upgrade cards (Regular and Advanced).", "Todas as cartas de Upgrade (Regulares e Avançadas)."),
      !usesWeather() ? t("Weather and Road Conditions tokens.", "Fichas de Clima e de Condições da Pista.") : null,
      !hasLegends() ? t("Legends mat and Legends cards.", "Tabuleiro e cartas de Lendas.") : null,
      !isChampionship() ? t("Championship mat, scorepad, Track, Event and Sponsorship cards, Press Corner standees.", "Tabuleiro de Campeonato, bloco, cartas de Pista, Evento e Patrocínio, totens de Curva da Imprensa.") : null,
      t(`Unused colors: ${MAX_CARS - totalCars()} car kit${MAX_CARS - totalCars() === 1 ? "" : "s"}.`, `Cores sem uso: ${MAX_CARS - totalCars()} kit${MAX_CARS - totalCars() === 1 ? "" : "s"} de carro.`)
    ], ["c2", "a2"]));
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
          <div class="setup-phase-references">${phase.specs.map(ref).join("")}</div>
        </header>
        <label class="heat-setup-check" for="heat-setup-${phase.id}">
          <input id="heat-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="heat-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="heat-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");
    const matchLabel = isChampionship() ? `${seasonLabel()} · ${playersLabel()}` : `${trackName()} · ${playersLabel()}`;

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), sectionIndex("setup"), isChampionship() ? ["a8", "a9"] : ["c2", "c3"])}
      ${configComplete() ? "" : `<p class="heat-config-warning" role="status">${t("The match is incomplete: a solo race needs Legends. Choose them in “Build your match” before using this checklist.", "A partida está incompleta: uma corrida solo precisa de Lendas. Escolha-as em “Configure a partida” antes de usar esta lista.")}</p>`}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Set up this match", "Prepare esta partida")} · ${matchLabel}</h3>
            <p>${t("One checkbox per coherent step. Progress is saved separately from the match configuration and language.", "Uma caixa por etapa coerente. O progresso é salvo separadamente da configuração da partida e do idioma.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
            ${isChampionship() ? `<button class="button-secondary" type="button" data-race-reset>${t("Next race: uncheck race steps", "Próxima corrida: desmarcar etapas da corrida")}</button>` : ""}
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Changing the format, player or Legend count, track, race length, car option, weather, season or Upgrade deck clears this checklist. Changing the language, Legend difficulty or Tournament Mode does not. “Uncheck all” clears only these setup boxes.",
          "Trocar o formato, o número de jogadores ou de Lendas, a pista, a duração, a opção de carro, o clima, a temporada ou o baralho de Upgrades limpa esta lista. Trocar o idioma, a dificuldade das Lendas ou o Modo Torneio não. “Desmarcar tudo” limpa somente as caixas da preparação."
        )}${isChampionship() ? t(" “Next race” clears only the steps marked “Before each race”.", " “Próxima corrida” limpa só as etapas marcadas “Antes de cada corrida”.") : ""}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}`;
  }

  // ---------- quick reference ----------

  function quickReference() {
    const legendsNote = hasLegends() ? t(" Legends move in their turn order too.", " As Lendas também movem na sua vez na ordem.") : "";
    const cards = [
      infoCard(t("EVERY ROUND", "TODA RODADA"), t("Order of play", "Ordem de jogo"), [
        rl("Steps 1–2", "everyone at the same time (in order, without waiting for each other).", "Passos 1–2", "todos ao mesmo tempo (em ordem, sem esperar os outros)."),
        rl("Steps 3–9", `one car at a time, starting with the car in front (closest to the Race Line when side by side), then backward through the field.${legendsNote}`, "Passos 3–9", `um carro de cada vez, começando pelo carro da frente (o mais próximo da Linha de Corrida se lado a lado), depois para trás.${legendsNote}`),
        rl("Always", "1 Shift Gears · 2 Play Cards · 3 Reveal & Move · 9 Replenish Hand.", "Sempre", "1 Trocar Marcha · 2 Jogar Cartas · 3 Revelar e Mover · 9 Repor a Mão."),
        rl("Sometimes", "4 Adrenaline · 5 React · 6 Slipstream · 7 Check Corner · 8 Discard.", "Às vezes", "4 Adrenalina · 5 Reagir · 6 Vácuo · 7 Checar Curva · 8 Descartar.")
      ], "c4"),
      infoCard(t("STEPS 1–3", "PASSOS 1–3"), t("Gear, cards, move", "Marcha, cartas, movimento"), [
        usesTournament()
          ? rl("1 · Shift Gears (Tournament)", "do not move your Gear pawn now.", "1 · Trocar Marcha (Torneio)", "não mova o peão de Marcha agora.")
          : rl("1 · Shift Gears", "stay, or shift 1 gear up/down for free; 2 gears = pay 1 Heat.", "1 · Trocar Marcha", "fique, ou suba/desça 1 marcha de graça; 2 marchas = pague 1 Calor."),
        rl("2 · Play Cards", `${usesTournament() ? "play 1–4 cards face down, at most 2 gears from your current one; that number becomes your gear at Reveal (2-gear jump: pay 1 Heat then)" : "play exactly as many cards as your gear (1st = 1 … 4th = 4)"}, face down. Never Heat cards.`, "2 · Jogar Cartas", `${usesTournament() ? "jogue 1–4 cartas viradas para baixo, a no máximo 2 marchas da atual; esse número vira sua marcha ao Revelar (salto de 2 marchas: pague 1 Calor nesse momento)" : "jogue exatamente tantas cartas quanto a marcha (1ª = 1 … 4ª = 4)"}, viradas para baixo. Nunca cartas de Calor.`),
        rl("3 · Reveal & Move", "Speed = sum of the card values; move exactly that many Spaces.", "3 · Revelar e Mover", "Velocidade = soma dos valores; ande exatamente esse número de Espaços."),
        rl("Stress / +", "flip from your deck until a Basic card shows; add it. Discard the rest.", "Estresse / +", "vire do baralho até sair uma carta Básica; some-a. Descarte o resto."),
        rl("Blocked", "all Spots of the final Space full → first free Spot behind.", "Bloqueado", "todos os Lugares do Espaço final ocupados → primeiro Lugar livre atrás.")
      ], ["c4", "c5"]),
      infoCard(t("STEPS 4–5", "PASSOS 4–5"), t("Adrenaline and React", "Adrenalina e Reagir"), [
        rl("Adrenaline", `the last ${adrenalineCars() === 2 ? "two cars" : "car"} this round (${totalCars()} cars started): +1 Speed and move 1 Space, and/or +1 Cooldown. Not saved.`, "Adrenalina", `${adrenalineCars() === 2 ? "os dois últimos carros" : "o último carro"} da rodada (${totalCars()} carros largaram): +1 Velocidade e ande 1 Espaço, e/ou +1 Resfriar. Não acumula.`),
        rl("React", "use your symbols in any order, one at a time.", "Reagir", "use seus símbolos em qualquer ordem, um de cada vez."),
        rl("Cooldown", "1st gear: 3 · 2nd gear: 1 · 3rd/4th gear: none. Move up to that many Heat from hand to Engine.", "Resfriar", "1ª marcha: 3 · 2ª marcha: 1 · 3ª/4ª marcha: nenhum. Leve até esse número de Calor da mão para o Motor."),
        rl("Boost", "any gear, once per turn: pay 1 Heat → one + (flip to a Basic card, move that far; counts as Speed).", "Turbo", "qualquer marcha, uma vez por turno: pague 1 Calor → um + (vire até uma carta Básica, ande isso; conta como Velocidade)."),
        usesGarage() ? rl("Upgrades", "apply their symbols here; mandatory (!) ones must be applied.", "Upgrades", "aplique os símbolos aqui; os obrigatórios (!) têm de ser aplicados.") : null
      ], ["c5", "c6"]),
      infoCard(t("STEPS 6–7", "PASSOS 6–7"), t("Slipstream and corners", "Vácuo e curvas"), [
        rl("Slipstream", "optional, once per turn, if beside another car or in the Space directly behind one: move 2 Spaces. Does NOT add Speed. Never to or past the finish.", "Vácuo", "opcional, uma vez por turno, se ao lado de outro carro ou no Espaço logo atrás de um: ande 2 Espaços. NÃO soma Velocidade. Nunca para cruzar a chegada ou depois dela."),
        rl("Check Corner", "for each Corner Line crossed this turn: Speed ≤ Speed Limit → fine; above → pay the difference in Heat.", "Checar Curva", "para cada Linha de Curva cruzada no turno: Velocidade ≤ Limite → nada; acima → pague a diferença em Calor."),
        rl("Spin out", "can't pay → pay all you have; back to the first free Space before that Corner Line; +1 Stress to hand (1st/2nd gear) or +2 (3rd/4th); gear to 1st.", "Rodar", "não pode pagar → pague tudo o que tem; volte ao primeiro Espaço livre antes daquela Linha de Curva; +1 Estresse na mão (1ª/2ª marcha) ou +2 (3ª/4ª); marcha para a 1ª."),
        rl("Several corners", "pay each separately, first corner first.", "Várias curvas", "pague cada uma separadamente, a primeira antes.")
      ], ["c6"]),
      infoCard(t("STEPS 8–9", "PASSOS 8–9"), t("Discard and replenish", "Descartar e repor"), [
        rl("8 · Discard", "any cards from hand, face up — never Stress or Heat cards.", "8 · Descartar", "quaisquer cartas da mão, viradas para cima — nunca cartas de Estresse ou Calor."),
        rl("9 · Replenish", "Play Area to discard pile, then draw back up to 7.", "9 · Repor", "Área de Jogo para o descarte e compre até ter 7."),
        rl("Deck empty", "shuffle your discard pile into a new deck at once (not your Play Area).", "Baralho vazio", "embaralhe o descarte como novo baralho na hora (não a Área de Jogo)."),
        rl("Discard piles", "only the top card is public; nobody looks through them.", "Pilhas de descarte", "só a carta do topo é pública; ninguém as folheia.")
      ], ["c6"]),
      infoCard(t("HEAT", "CALOR"), t("Paying Heat", "Pagando Calor"), [
        rl("Pay 1 Heat", "move 1 Heat card from your Engine to your discard pile.", "Pagar 1 Calor", "leve 1 carta de Calor do Motor para o descarte."),
        rl("No Heat in Engine", "you cannot Boost or shift 2 gears; in a corner you spin out.", "Sem Calor no Motor", "não pode usar Turbo nem trocar 2 marchas; na curva você roda."),
        rl("Heat in hand", "never played or discarded — only Cooldown sends it back to the Engine.", "Calor na mão", "nunca é jogado nem descartado — só Resfriar o devolve ao Motor."),
        rl("Cluttered hand", "can't fill your gear with playable cards → fill with Heat, don't move, gear to 1st, Play Area to discard, go to step 9.", "Mão entupida", "não consegue completar a marcha com cartas jogáveis → complete com Calor, não ande, marcha para a 1ª, Área de Jogo para o descarte, vá ao passo 9.")
      ], "c7"),
      infoCard(t("FINISH", "CHEGADA"), t("Winning the race", "Vencendo a corrida"), [
        rl("Winner", `first car across the finish line after ${state.length === "learning" && !isChampionship() ? "1 lap (learning race)" : "the laps on the board"}; same round → furthest ahead wins (Race Line side breaks ties).`, "Vencedor", `primeiro carro a cruzar a chegada depois de ${state.length === "learning" && !isChampionship() ? "1 volta (corrida de aprendizado)" : "as voltas do tabuleiro"}; mesma rodada → vence o mais à frente (o lado da Linha de Corrida desempata).`),
        rl("After the line", "ignore Speed Limits; move as far as you can; no Slipstream.", "Depois da linha", "ignore os Limites de Velocidade; ande o máximo; sem Vácuo."),
        rl("End of round", "finished cars go to the Hall of Fame in order; keep racing until all cars finish.", "Fim da rodada", "carros que chegaram vão ao Hall da Fama em ordem; continuem até todos chegarem.")
      ], "c7")
    ];
    if (hasLegends()) {
      cards.push(infoCard(t("LEGENDS", "LENDAS"), t("When a Legend moves", "Quando uma Lenda se move"), [
        rl("Card", "at the first Legend's move each round, reveal the top Legends card; all Legends use it this round.", "Carta", "no movimento da primeira Lenda de cada rodada, revele a carta de Lendas do topo; todas as Lendas a usam nesta rodada."),
        rl("A · Past the Legends Line", `move upcoming Speed Limit + the Diamond number in its color.`, "A · Depois da Linha de Lendas", "ande o Limite de Velocidade da próxima curva + o número do Losango da sua cor."),
        rl("B · Not past it", `move its Top Speed (helmet number${state.pro !== "0" ? ` +${state.pro}` : ""}) if that doesn't cross the next Corner Line; otherwise stop on the space numbered like its Diamond (0–3) just before the line.`, "B · Antes dela", `ande a Velocidade Máxima (número do capacete${state.pro !== "0" ? ` +${state.pro}` : ""}) se não cruzar a próxima Linha de Curva; senão pare no espaço com o número do Losango (0–3) logo antes da linha.`),
        rl("Never", "Slipstream, Heat, Cooldown — and never 2 Corner Lines in one move.", "Nunca", "Vácuo, Calor, Resfriar — e nunca 2 Linhas de Curva num movimento.")
      ], "a5"));
    }
    if (usesWeather()) {
      cards.push(infoCard(t("ROAD CONDITIONS", "CONDIÇÕES DA PISTA"), t("Tokens on the track", "Fichas na pista"), [
        rl("Corner token", "+1 / −1 Speed Limit, or Overheat (+1 Heat if you exceed the limit).", "Ficha de curva", "+1 / −1 no Limite de Velocidade, ou Superaquecer (+1 Calor se passar do limite)."),
        rl("Sector token", "Slipstream +1 Space · Boost without Heat · Weather effect — only while your car is in that sector.", "Ficha de setor", "Vácuo +1 Espaço · Turbo sem Calor · efeito de Clima — só com o carro naquele setor."),
        rl("Weather effect", "Slipstream +2 · no Slipstream from here · +1 Cooldown · no Cooldown.", "Efeito de Clima", "Vácuo +2 · sem Vácuo a partir daqui · +1 Resfriar · sem Resfriar.")
      ], ["a7"]));
    }
    if (isChampionship()) {
      cards.push(infoCard(t("SPONSORS & PRESS", "PATROCÍNIO E IMPRENSA"), t("Gaining Sponsorship cards", "Ganhando cartas de Patrocínio"), [
        rl("Press Corner", "cross its Corner Line thanks to your Slipstream, OR exceed its Speed Limit by 2 or more → 1 Sponsorship card (max 1 per pass).", "Curva da Imprensa", "cruze a Linha de Curva graças ao Vácuo, OU passe do Limite em 2 ou mais → 1 carta de Patrocínio (máx. 1 por passagem)."),
        rl("Spin out", "no Sponsorship gained that turn.", "Rodou", "nenhum Patrocínio no turno."),
        rl("Use", "one-time: removed from the game in step 9 if in your Play Area. Unused ones carry to the next race.", "Uso", "uso único: sai do jogo no passo 9 se estiver na Área de Jogo. Não usadas passam para a próxima corrida.")
      ], ["a10"]));
    }
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), sectionIndex("quick-reference"), ["c4", "a12"])}
      <div class="callout">${t(
        "Goal: be first across the finish line. Each round your gear sets how many cards you play; their total is your Speed. Spend Heat to go faster, cool down in low gears, and respect each corner's Speed Limit or pay Heat — run out and you spin out.",
        "Objetivo: cruzar a linha de chegada primeiro. A cada rodada a marcha define quantas cartas você joga; a soma é sua Velocidade. Gaste Calor para ir mais rápido, resfrie nas marchas baixas e respeite o Limite de Velocidade de cada curva ou pague Calor — se faltar, você roda."
      )} ${ref("c3")}</div>
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- victory ----------

  function victorySection() {
    return `
      ${sectionHeading("victory", t("How to win", "Como vencer"), sectionIndex("victory"), isChampionship() ? ["c7", "a9", "a10"] : ["c7"])}
      <div class="victory-grid">
        <article class="victory-card">
          <h3>${t("Winning the race", "Vencendo a corrida")}</h3>
          ${lineList([
            t(`The first car to cross the finish line after ${state.length === "learning" && !isChampionship() ? "1 lap (learning race)" : "the number of laps printed on the board"} wins the race${isChampionship() ? "" : " and the game"}.`, `O primeiro carro a cruzar a linha de chegada depois de ${state.length === "learning" && !isChampionship() ? "1 volta (corrida de aprendizado)" : "o número de voltas impresso no tabuleiro"} vence a corrida${isChampionship() ? "" : " e o jogo"}.`),
            t("If several cars finish in the same round, the one furthest ahead wins; side by side, the Spot closest to the Race Line is ahead.", "Se vários carros chegarem na mesma rodada, vence o que estiver mais à frente; lado a lado, o Lugar mais próximo da Linha de Corrida está à frente."),
            t("Slipstream can never be used to cross the finish line, nor after crossing it.", "O Vácuo nunca pode ser usado para cruzar a linha de chegada, nem depois de cruzá-la."),
            interpretation("The finish line is the line by the starting grid; one lap is one full circuit back to it. The number of laps is on the board's corner panel.", "A linha de chegada é a linha junto ao grid de largada; uma volta é um circuito completo até ela. O número de voltas está no painel do canto do tabuleiro."),
            t("Ignore Speed Limits of corners after the finish line: simply move as far as you can.", "Ignore os Limites de Velocidade das curvas depois da chegada: ande o máximo que puder."),
            hasLegends() ? interpretation("A Legend can win the race — it is a car like any other; beat it to win.", "Uma Lenda pode vencer a corrida — é um carro como os outros; chegue antes dela para vencer.") : null
          ])}
        </article>
        <article class="victory-card">
          <h3>${t("After the finish", "Depois da chegada")}</h3>
          ${lineList([
            t("At the end of the round, remove every car that crossed the finish line and place them, in finishing order, on the Hall of Fame space of the board.", "No fim da rodada, retire todos os carros que cruzaram a chegada e coloque-os, na ordem de chegada, no espaço do Hall da Fama do tabuleiro."),
            t("Keep playing rounds until all cars reach the finish.", "Continuem jogando rodadas até todos os carros chegarem."),
            t(`Adrenaline still goes to the last ${adrenalineCars() === 2 ? "two cars" : "car"}, based on the ${totalCars()} cars that started, not the cars left on track.`, `A Adrenalina continua indo para ${adrenalineCars() === 2 ? "os dois últimos carros" : "o último carro"}, com base nos ${totalCars()} carros que largaram, não nos que restam na pista.`)
          ])}
        </article>
        ${isChampionship() ? `
        <article class="victory-card">
          <h3>${t("Winning the championship", "Vencendo o campeonato")}</h3>
          ${lineList([
            t("After each race, record each player's Championship points on the scoresheet as printed on the board's Hall of Fame spaces.", "Depois de cada corrida, anote os pontos de Campeonato de cada jogador na folha, conforme impresso nos espaços do Hall da Fama do tabuleiro."),
            t("After the last race of the season, the highest total wins. Tie: whoever was better positioned in the final race.", "Depois da última corrida da temporada, vence o maior total. Empate: quem chegou em melhor posição na última corrida."),
            state.season === "goat" ? t("GOAT: play 1961, 1962 and 1963 in succession to determine the Greatest Of All Time; between seasons each player keeps only 1 Upgrade card.", "GOAT: jogue 1961, 1962 e 1963 em sequência para decidir o Maior de Todos os Tempos; entre temporadas cada jogador mantém só 1 carta de Upgrade.") : null,
            interpretation("The booklet's example scoresheet shows 9, 6, 4 and 3 points for the first four places; read the full scale on the Hall of Fame of your board. How a season of seasons (GOAT) is totalled is not spelled out: add the three seasons' points.", "A folha de exemplo do livreto mostra 9, 6, 4 e 3 pontos para os quatro primeiros; leia a escala completa no Hall da Fama do seu tabuleiro. O livreto não detalha como somar o GOAT: some os pontos das três temporadas.")
          ])}
        </article>` : ""}
      </div>`;
  }

  // ---------- round ----------

  function roundSection() {
    return `
      ${sectionHeading("round", t("Playing a round", "Jogando uma rodada"), sectionIndex("round"), ["c4", "c5", "c6"])}
      <div class="callout">${lineList([
        t("Every round, all players ALWAYS do steps 1 (Shift Gears), 2 (Play Cards), 3 (Reveal & Move) and 9 (Replenish Hand) — marked on the mat with the mandatory icon. Steps 4–8 only sometimes apply.", "Toda rodada, todos os jogadores SEMPRE fazem os passos 1 (Trocar Marcha), 2 (Jogar Cartas), 3 (Revelar e Mover) e 9 (Repor a Mão) — marcados no painel com o ícone de obrigatório. Os passos 4–8 só às vezes se aplicam."),
        t("Steps 1 and 2: everyone at once. Then, starting with the frontmost car, one car completes steps 3–9; then the next car back, and so on.", "Passos 1 e 2: todos juntos. Depois, a partir do carro mais à frente, um carro completa os passos 3–9; depois o próximo carro atrás, e assim por diante."),
        t("Turn order is re-read every round from the current positions on the track.", "A ordem dos turnos é relida toda rodada a partir das posições atuais na pista.")
      ])} ${ref("c4")}</div>
      <div class="icon-grid heat-step-grid">
        ${iconCard("step-shift-gears", "1 · Shift Gears (mandatory)", usesTournament()
          ? "Tournament Mode: skip this now — nobody adjusts their gear. You shift at Reveal & Move (see Tournament Mode)."
          : "Look at your gear; keep it, or shift one gear up or down. Shifting two gears (1↔3 or 2↔4) costs 1 Heat paid immediately: announce it, pay, move your pawn. Gears go from 1st to 4th.",
          "1 · Trocar Marcha (obrigatório)", usesTournament()
          ? "Modo Torneio: pule isto agora — ninguém ajusta a marcha. A troca acontece em Revelar e Mover (veja Modo Torneio)."
          : "Veja sua marcha; mantenha, ou suba ou desça uma. Trocar duas marchas (1↔3 ou 2↔4) custa 1 Calor pago na hora: anuncie, pague, mova o peão. As marchas vão da 1ª à 4ª.", ["c4", "c7"])}
        ${iconCard("step-play-cards", "2 · Play Cards (mandatory)", "Your gear sets exactly how many cards you play: 1st gear = 1 card … 4th gear = 4 cards. Any card except Heat cards. Keep the 1–4 cards face down in your Play Area (middle of your mat).", "2 · Jogar Cartas (obrigatório)", "A marcha define exatamente quantas cartas você joga: 1ª marcha = 1 carta … 4ª marcha = 4 cartas. Qualquer carta exceto Calor. Deixe as 1–4 cartas viradas para baixo na Área de Jogo (meio do painel).", "c4")}
        ${iconCard("step-reveal-move", "3 · Reveal & Move (mandatory)", `${usesTournament() ? "Tournament: first show how many cards you played and set your Gear pawn to that number (pay 1 Heat for a 2-gear jump). " : ""}Reveal your Play Area and add all values: that is your Speed (Upgrade and Stress cards count). Move your car forward exactly that many Spaces, onto the Spot closest to the Race Line if free.`, "3 · Revelar e Mover (obrigatório)", `${usesTournament() ? "Torneio: primeiro mostre quantas cartas jogou e ponha o peão de Marcha nesse número (pague 1 Calor num salto de 2 marchas). " : ""}Revele a Área de Jogo e some todos os valores: essa é sua Velocidade (cartas de Upgrade e Estresse contam). Avance o carro exatamente esse número de Espaços, no Lugar mais próximo da Linha de Corrida se estiver livre.`, "c5")}
        ${iconCard("step-adrenaline", "4 · Adrenaline", `Only for the last ${adrenalineCars() === 2 ? "two cars (5 or more cars started)" : "car to move this round (with 5+ cars it would be the last two)"}. It gives extra symbols for React: move 1 extra Space while adding 1 to your Speed, and/or 1 extra Cooldown. Cannot be saved.`, "4 · Adrenalina", `Só para ${adrenalineCars() === 2 ? "os dois últimos carros (5 ou mais carros largaram)" : "o último carro a se mover na rodada (com 5+ carros seriam os dois últimos)"}. Dá símbolos extras para Reagir: andar 1 Espaço extra somando 1 à Velocidade, e/ou 1 Resfriar extra. Não acumula.`, "c5")}
        ${iconCard("step-react", "5 · React", `Activate the symbols you have access to, in ANY order, each one completed before the next: Cooldown from your gear, Boost, Adrenaline${usesGarage() ? ", symbols on your revealed Upgrade cards" : ""}${usesWeather() ? ", Road Conditions in your sector" : ""}.`, "5 · Reagir", `Ative os símbolos a que tem acesso, em QUALQUER ordem, terminando cada um antes do próximo: Resfriar da marcha, Turbo, Adrenalina${usesGarage() ? ", símbolos das cartas de Upgrade reveladas" : ""}${usesWeather() ? ", Condições da Pista do seu setor" : ""}.`, ["c5", "c6"])}
        ${iconCard("step-slipstream", "6 · Slipstream", "Optional, once per turn, if your car is next to another car or in the Space directly behind one: move 2 Spaces forward. If all Spots there are full, take the first free Spot behind. Does NOT raise your Speed for corners.", "6 · Vácuo", "Opcional, uma vez por turno, se o carro está ao lado de outro ou no Espaço logo atrás de um: avance 2 Espaços. Se os Lugares ali estiverem cheios, pegue o primeiro Lugar livre atrás. NÃO aumenta a Velocidade para as curvas.", "c6")}
        ${iconCard("step-check-corner", "7 · Check Corner", "Only if you crossed a Corner Line this turn. Speed (all Play Area values, including cards added by + symbols such as Boost, +1 if you used Adrenaline's +1) ≤ Speed Limit: nothing. Above: pay the difference in Heat. Several corners: pay each, in order.", "7 · Checar Curva", "Só se cruzou uma Linha de Curva no turno. Velocidade (valores da Área de Jogo, inclusive cartas somadas por símbolos + como o Turbo, +1 se usou o +1 da Adrenalina) ≤ Limite: nada. Acima: pague a diferença em Calor. Várias curvas: pague cada uma, em ordem.", "c6")}
        ${iconCard("step-discard", "8 · Discard", "You may discard any cards from your hand you don't want to keep, face up onto your discard pile. Never Stress or Heat cards (including Upgrade ones).", "8 · Descartar", "Você pode descartar da mão as cartas que não quer guardar, viradas para cima na pilha de descarte. Nunca cartas de Estresse ou Calor (inclusive as de Upgrade).", "c6")}
        ${iconCard("step-replenish", "9 · Replenish Hand (mandatory)", "Put all cards from your Play Area on your discard pile, then draw back up to 7 cards. The next car then does steps 3–9.", "9 · Repor a Mão (obrigatório)", "Coloque todas as cartas da Área de Jogo no descarte e compre até ter 7 cartas. Então o próximo carro faz os passos 3–9.", "c6")}
      </div>
      <h3 class="subhead">${t("Moving on the track", "Movendo na pista")}</h3>
      <div class="quick-grid">
        ${infoCard(t("TRACK", "PISTA"), t("Spaces and Spots", "Espaços e Lugares"), [
          t("A Space is one slice of track; each Space has side-by-side Spots for cars.", "Um Espaço é uma fatia da pista; cada Espaço tem Lugares lado a lado para os carros."),
          t("Always put your car on the free Spot closest to the Race Line.", "Sempre coloque o carro no Lugar livre mais próximo da Linha de Corrida."),
          t("Cars never block you from passing through them.", "Carros nunca impedem você de passar por eles."),
          t("If every Spot in your final Space is taken, you are blocked: stop in the first Space behind with a free Spot (closest to the Race Line).", "Se todos os Lugares do Espaço final estiverem ocupados, você está bloqueado: pare no primeiro Espaço atrás com Lugar livre (o mais próximo da Linha de Corrida)."),
          t("Two cars side by side: the one closest to the Race Line is ahead for all purposes.", "Dois carros lado a lado: o mais próximo da Linha de Corrida está à frente para todos os efeitos.")
        ], "c5")}
        ${infoCard(t("CORNERS", "CURVAS"), t("Reading a corner", "Lendo uma curva"), [
          t("Speed Limit: the number in the circle at the corner.", "Limite de Velocidade: o número no círculo da curva."),
          t("Corner Line: the line across the track at the corner; crossing it triggers Check Corner.", "Linha de Curva: a linha atravessando a pista na curva; cruzá-la dispara Checar Curva."),
          t("Small numbers along the track count the Spaces to the next corner.", "Números pequenos ao longo da pista contam os Espaços até a próxima curva."),
          hasLegends() ? t("Legends Line: the dashed line before each corner, used only by Legends.", "Linha de Lendas: a linha antes de cada curva, usada só pelas Lendas.") : t("The Legends Line before each corner is only used with Legends.", "A Linha de Lendas antes de cada curva só é usada com Lendas.")
        ], "c4")}
        ${infoCard(t("SPEED", "VELOCIDADE"), t("What counts as Speed", "O que conta como Velocidade"), [
          t("The values of all cards in your Play Area, including cards added by + symbols (Stress, Boost).", "Os valores de todas as cartas na Área de Jogo, inclusive as somadas por símbolos + (Estresse, Turbo)."),
          t("+1 if you used Adrenaline's extra Space.", "+1 se usou o Espaço extra da Adrenalina."),
          usesGarage() ? t("Accelerate bonuses and chosen values of Upgrade cards.", "Bônus de Acelerar e valores escolhidos das cartas de Upgrade.") : null,
          t("Slipstream never counts as Speed.", "O Vácuo nunca conta como Velocidade.")
        ], ["c5", "c6"])}
        ${infoCard(t("SPIN OUT", "RODAR"), t("Not enough Heat for a corner", "Calor insuficiente na curva"), [
          t("Pay all the Heat you have, then immediately:", "Pague todo o Calor que tem e imediatamente:"),
          t("Move back to the first available Space before the Corner Line that caused it.", "Volte ao primeiro Espaço disponível antes da Linha de Curva que causou isso."),
          t("Take 1 Stress card into your hand if you are in 1st/2nd gear, or 2 if in 3rd/4th.", "Pegue 1 carta de Estresse na mão se estiver na 1ª/2ª marcha, ou 2 se na 3ª/4ª."),
          t("Move your Gear pawn to 1st gear.", "Mova o peão de Marcha para a 1ª marcha."),
          interpretation("The Stress cards come from the Stress reserve. Corners after the one that spun you out are not checked — you are behind them.", "As cartas de Estresse vêm da reserva de Estresse. Curvas depois da que fez você rodar não são checadas — você está atrás delas.")
        ], "c6")}
      </div>`;
  }

  // ---------- cards ----------

  function cardsSection() {
    return `
      ${sectionHeading("cards", t("Heat, Stress & cards", "Calor, Estresse e cartas"), sectionIndex("cards"), ["c5", "c6", "c7"])}
      <div class="quick-grid">
        ${infoCard(t("HEAT CARDS", "CARTAS DE CALOR"), t("The Heat cycle", "O ciclo do Calor"), [
          t("Heat starts in your Engine. Paying Heat (Boost, corners, double shift) moves it to your discard pile; later it is shuffled into your deck and reaches your hand.", "O Calor começa no Motor. Pagar Calor (Turbo, curvas, troca dupla) o leva ao descarte; depois ele é embaralhado no baralho e chega à mão."),
          t("Heat cards in hand can never be played or discarded: they just clog your hand.", "Cartas de Calor na mão nunca podem ser jogadas nem descartadas: só entopem a mão."),
          t("The only way back to the Engine is Cooldown — mostly from driving in 1st gear (Cooldown 3) or 2nd gear (Cooldown 1).", "O único caminho de volta ao Motor é Resfriar — principalmente dirigindo em 1ª marcha (Resfriar 3) ou 2ª (Resfriar 1)."),
          t("No Heat card left in the Engine: you cannot choose to Boost.", "Sem carta de Calor no Motor: você não pode escolher Turbo.")
        ], "c7")}
        ${infoCard(t("STRESS CARDS", "CARTAS DE ESTRESSE"), t("Lapses of concentration", "Lapsos de concentração"), [
          t("Shuffled into your deck at the start; you must play them to get them out of your hand.", "Embaralhadas no baralho no início; você precisa jogá-las para tirá-las da mão."),
          t("Each played Stress card is a + symbol: flip cards from the top of your deck, discarding each non-Basic card, until a Basic card shows; put that Basic card on top of the Stress card. It adds 1–4 Speed.", "Cada carta de Estresse jogada é um símbolo +: vire cartas do topo do baralho, descartando cada carta não Básica, até sair uma carta Básica; coloque essa carta Básica sobre a de Estresse. Ela soma 1–4 de Velocidade."),
          t("Stress cards can never be discarded from your hand in step 8.", "Cartas de Estresse nunca podem ser descartadas da mão no passo 8.")
        ], "c5")}
        ${!usesGarage() ? infoCard(t("STARTING UPGRADES", "UPGRADES INICIAIS"), t("Your 3 chevron cards", "Suas 3 cartas de divisas"), [
          t("0 and 5: played like Basic cards, but discarded (not kept) when flipped for a + symbol.", "0 e 5: jogadas como cartas Básicas, mas descartadas (não usadas) quando viradas por um símbolo +."),
          t("Extra Heat: works exactly like a regular Heat card, but starts shuffled in your deck instead of the Engine.", "Calor extra: funciona exatamente como uma carta de Calor normal, mas começa embaralhada no baralho em vez do Motor.")
        ], "c7") : ""}
        ${infoCard(t("SHIFTING 2 GEARS", "TROCAR 2 MARCHAS"), t("A double shift", "Troca dupla"), [
          t("In step 1 you may move the pawn 2 steps (1↔3 or 2↔4).", "No passo 1 você pode mover o peão 2 posições (1↔3 ou 2↔4)."),
          t("Announce it, pay 1 Heat at once (Engine → discard), then move the pawn.", "Anuncie, pague 1 Calor na hora (Motor → descarte) e mova o peão."),
          t("Never more than 2 steps.", "Nunca mais de 2 posições.")
        ], "c7")}
        ${infoCard(t("CLUTTERED HAND", "MÃO ENTUPIDA"), t("Too much Heat in hand", "Calor demais na mão"), [
          t("Not enough playable cards for your gear: play all the playable cards you can and make up the difference with Heat cards.", "Sem cartas jogáveis suficientes para a marcha: jogue todas as jogáveis que puder e complete com cartas de Calor."),
          t("Your car does not move this turn.", "Seu carro não se move neste turno."),
          t("On reveal: Gear pawn to 1st gear, Play Area cards to your discard pile, skip straight to step 9.", "Ao revelar: peão de Marcha para a 1ª, cartas da Área de Jogo para o descarte, vá direto ao passo 9.")
        ], "c7")}
        ${infoCard(t("DECK", "BARALHO"), t("Running out of cards", "Acabaram as cartas"), [
          t("Whenever you must draw, flip or discard and your deck is empty: shuffle your discard pile into a new face-down deck immediately, then continue.", "Sempre que precisar comprar, virar ou descartar com o baralho vazio: embaralhe o descarte como novo baralho virado para baixo na hora e continue."),
          t("During your turn, the cards in your Play Area are not shuffled in — they have not been discarded yet.", "Durante seu turno, as cartas da Área de Jogo não entram — ainda não foram descartadas.")
        ], "c6")}
      </div>`;
  }

  // ---------- garage ----------

  function garageSection() {
    const categories = [
      ["Extra Heat", "work exactly like Heat cards but start in your draw deck.", "Calor extra", "funcionam como cartas de Calor, mas começam no baralho."],
      ["4 Wheel Drive", "high Speed or Cooldown, but add + symbols (less control).", "Tração 4×4", "Velocidade ou Resfriar altos, mas somam símbolos + (menos controle)."],
      ["Brakes", "several Speed values to choose from.", "Freios", "vários valores de Velocidade para escolher."],
      ["Cooling system", "Cooldown cards.", "Arrefecimento", "cartas de Resfriar."],
      ["Body", "let you discard Stress cards.", "Carroceria", "permitem descartar cartas de Estresse."],
      ["R.P.M.", "help Slipstream and overtaking, best around corners.", "R.P.M.", "ajudam no Vácuo e em ultrapassagens, melhores perto das curvas."],
      ["Tires", "faster in corners, or trade grip for lots of Cooldown.", "Pneus", "mais rápido nas curvas, ou troque aderência por muito Resfriar."],
      ["Wings", "faster in corners but unreliable: require Heat.", "Aerofólios", "mais rápido nas curvas, mas instáveis: exigem Calor."],
      ["Turbocharger", "the highest values; you pay Heat.", "Turbocompressor", "os valores mais altos; você paga Calor."],
      ["Fuel", "super-fuel “illegal” cards.", "Combustível", "cartas de supercombustível “ilegal”."],
      ["Gas Pedal", "can be played on top of the planned cards, raising your Speed.", "Acelerador", "podem ser jogadas além das cartas planejadas, aumentando a Velocidade."],
      ["Suspension", "can be played round after round.", "Suspensão", "podem ser jogadas rodada após rodada."]
    ];
    return `
      ${sectionHeading("garage", t("Garage Module: Upgrade cards", "Módulo de Garagem: cartas de Upgrade"), sectionIndex("garage"), ["a3", "a4", "a12"])}
      <div class="quick-grid">
        ${infoCard(t("REVEAL & MOVE", "REVELAR E MOVER"), t("Upgrades in step 3", "Upgrades no passo 3"), [
          t("Most Upgrade cards give a fixed value: add it to your Speed like a Basic card.", "A maioria das cartas de Upgrade dá um valor fixo: some-o à Velocidade como uma carta Básica."),
          t("First resolve every + symbol on your revealed cards (flip until a Basic card, one + at a time).", "Primeiro resolva todo símbolo + das cartas reveladas (vire até uma carta Básica, um + de cada vez)."),
          t("Then choose the value of any card that offers several Speed values (e.g. Brakes) and add it.", "Depois escolha o valor de cada carta com vários valores de Velocidade (ex.: Freios) e some-o."),
          t("Then move.", "Então ande.")
        ], "a4")}
        ${infoCard(t("REACT", "REAGIR"), t("Upgrades in step 5", "Upgrades no passo 5"), [
          t("Apply the symbols of your Upgrade cards in any order you like within React.", "Aplique os símbolos das cartas de Upgrade na ordem que quiser dentro do Reagir."),
          t("Optional symbols may be skipped.", "Símbolos opcionais podem ser ignorados."),
          t("Symbols marked with the Mandatory icon (!) are the cost of the card: you must apply them.", "Símbolos com o ícone de Obrigatório (!) são o custo da carta: você tem de aplicá-los."),
          t("Can't pay a Heat cost of a played Upgrade: discard that card and play a random Basic card from your deck instead (flip as for a + symbol).", "Não consegue pagar o custo em Calor de um Upgrade jogado: descarte essa carta e jogue no lugar uma carta Básica aleatória do baralho (vire como num símbolo +).")
        ], "a4")}
        ${infoCard(t("CATEGORIES", "CATEGORIAS"), t("What each Upgrade family does", "O que cada família de Upgrade faz"), categories.map(([en, ben, pt, bpt]) => rl(en, ben, pt, bpt)).concat([
          t("No restriction on mixing categories in your deck. Each card's exact effect is printed on it.", "Não há restrição para misturar categorias no baralho. O efeito exato de cada carta está impresso nela.")
        ]), "a3")}
      </div>
      <h3 class="subhead">${t("Mandatory symbols (cost of the card)", "Símbolos obrigatórios (custo da carta)")}</h3>
      <div class="icon-grid">
        ${iconCard("heat-cost", "Heat #", "Take # Heat cards from your Engine and move them to your discard pile.", "Calor #", "Leve # cartas de Calor do Motor para o descarte.", "a12")}
        ${iconCard("scrap", "Scrap #", "Discard the top card of your draw deck # times.", "Sucata #", "Descarte a carta do topo do baralho # vezes.", "a12")}
        ${iconCard("adjust-speed-limit", "Adjust Speed Limit ±#", "If you cross Corner Lines this turn, their Speed Limit is changed by # for you: “+” you may go faster, “−” you must go slower.", "Ajustar Limite ±#", "Se cruzar Linhas de Curva neste turno, o Limite delas muda em # para você: “+” pode ir mais rápido, “−” precisa ir mais devagar.", "a12")}
        ${isChampionship() ? iconCard("one-time-use", "One-time use", "In step 9, if this card is in your Play Area, remove it from the game instead of discarding it.", "Uso único", "No passo 9, se esta carta estiver na Área de Jogo, retire-a do jogo em vez de descartá-la.", "a12") : ""}
      </div>
      <h3 class="subhead">${t("Optional symbols", "Símbolos opcionais")}</h3>
      <div class="icon-grid">
        ${iconCard("cooldown", "Cooldown #", "Take up to # Heat cards from your hand and return them to the Engine.", "Resfriar #", "Leve até # cartas de Calor da mão de volta ao Motor.", "a12")}
        ${iconCard("slipstream-boost", "Slipstream boost +#", "If you Slipstream in step 6, your usual 2 Spaces may be increased by #.", "Vácuo +#", "Se usar o Vácuo no passo 6, os 2 Espaços habituais podem aumentar em #.", "a12")}
        ${iconCard("reduce-stress", "Reduce Stress #", "Immediately discard up to # Stress cards from your hand to your discard pile.", "Reduzir Estresse #", "Descarte imediatamente até # cartas de Estresse da mão para o descarte.", "a12")}
        ${iconCard("refresh", "Refresh", "In step 9 you may put this card back on top of your draw deck instead of discarding it.", "Renovar", "No passo 9 você pode devolver esta carta ao topo do baralho em vez de descartá-la.", "a12")}
        ${iconCard("salvage", "Salvage #", "Look through your discard pile and choose up to # cards; shuffle them into your draw deck.", "Recuperar #", "Olhe a pilha de descarte e escolha até # cartas; embaralhe-as no baralho de compra.", "a12")}
        ${iconCard("direct-play", "Direct Play", "You may play this card from your hand during React (step 5). It then counts as if revealed in step 3: Speed value and all its symbols.", "Jogada Direta", "Você pode jogar esta carta da mão durante o Reagir (passo 5). Ela conta como se revelada no passo 3: valor de Velocidade e todos os símbolos.", "a12")}
        ${iconCard("accelerate", "Accelerate", "You may add +1 Speed for every + symbol you used this turn (Upgrades, Stress, Boost…). If you do, it applies to all of them, and it counts for Check Corner.", "Acelerar", "Você pode somar +1 de Velocidade para cada símbolo + usado neste turno (Upgrades, Estresse, Turbo…). Se fizer, vale para todos eles, e conta para Checar Curva.", "a12")}
      </div>
      <div class="callout">${lineList([
        interpretation("Like Adrenaline's +1, each +1 from Accelerate also moves your car 1 Space — Speed is the distance you move.", "Como o +1 da Adrenalina, cada +1 de Acelerar também move o carro 1 Espaço — Velocidade é a distância percorrida."),
        interpretation("Heat paid as an Upgrade cost comes from the Engine like any other Heat payment; with none left, use the “can't pay” rule above.", "O Calor pago como custo de Upgrade sai do Motor como qualquer pagamento de Calor; sem Calor, use a regra de “não consegue pagar” acima.")
      ])}</div>`;
  }

  // ---------- legends ----------

  function legendsSection() {
    const pro = state.pro !== "0" ? t(` (Pro Legends: +${state.pro} to every Top Speed)`, ` (Lendas Pro: +${state.pro} em toda Velocidade Máxima)`) : "";
    return `
      ${sectionHeading("legends", t("Legends Module", "Módulo de Lendas"), sectionIndex("legends"), ["a5", "a6"])}
      <div class="quick-grid">
        ${infoCard(t("WHEN", "QUANDO"), t("The Legends card", "A carta de Lendas"), [
          t("Legends take their turn in normal turn order, like any car (frontmost first).", "As Lendas jogam na ordem normal dos turnos, como qualquer carro (o da frente primeiro)."),
          t("When it is the first Legend's turn to move in Reveal & Move, reveal the top Legends card. All Legends use that card this round.", "Quando chega a vez da primeira Lenda mover em Revelar e Mover, revele a carta de Lendas do topo. Todas as Lendas usam essa carta nesta rodada."),
          t("Each Legend reads the numbers in its own color: the Diamond above the helmet and the Top Speed inside the helmet.", "Cada Lenda lê os números da sua cor: o Losango acima do capacete e a Velocidade Máxima dentro do capacete."),
          t("When the Legends deck is empty, shuffle all 10 cards into a new deck.", "Quando o baralho de Lendas acabar, embaralhe as 10 cartas num novo baralho.")
        ], "a5")}
        ${infoCard(t("MOVE A", "MOVIMENTO A"), t("Clearing corners (past the Legends Line)", "Fazendo a curva (depois da Linha de Lendas)"), [
          t("The Legend's car is between the Legends Line and the next Corner Line.", "O carro da Lenda está entre a Linha de Lendas e a próxima Linha de Curva."),
          t("Move it forward: Speed Limit of the upcoming corner + the Diamond number in its color. Normal blocking applies.", "Avance-o: Limite de Velocidade da próxima curva + o número do Losango da sua cor. O bloqueio normal vale."),
          t("Legends never cross 2 Corner Lines in one move: if that would happen, stop it on the first Space with a free Spot before the second Corner Line.", "Lendas nunca cruzam 2 Linhas de Curva num movimento: se isso fosse acontecer, pare-a no primeiro Espaço com Lugar livre antes da segunda Linha de Curva.")
        ], "a5")}
        ${infoCard(t("MOVE B", "MOVIMENTO B"), t("Approaching corners (not past the Legends Line)", "Aproximando-se (antes da Linha de Lendas)"), [
          t(`If moving its Top Speed${pro} does not cross the next Corner Line, move exactly that.`, `Se andar a Velocidade Máxima${pro} não cruzar a próxima Linha de Curva, ande exatamente isso.`),
          t("Otherwise, move it to the track space numbered 0–3 just before that Corner Line, matching the Diamond number in its color.", "Senão, leve-a ao espaço da pista numerado 0–3 logo antes daquela Linha de Curva, conforme o número do Losango da sua cor."),
          t("Normal blocking applies: full Space → first free Spot behind.", "O bloqueio normal vale: Espaço cheio → primeiro Lugar livre atrás."),
          usesWeather() ? interpretation("A Road Conditions ±1 corner token changes that corner's Speed Limit for everyone, so Legends use the modified limit in move A.", "Uma ficha de curva ±1 de Condições da Pista muda o Limite daquela curva para todos, então as Lendas usam o limite modificado no movimento A.") : null
        ], "a5")}
        ${infoCard(t("NOTES", "OBSERVAÇÕES"), t("What Legends never do", "O que as Lendas nunca fazem"), [
          t("Legends never Slipstream, use Heat or cool down. They never check corners or spin out.", "Lendas nunca usam Vácuo, Calor nem Resfriar. Nunca checam curva nem rodam."),
          t(`Legends count when deciding Adrenaline (and the 5+ cars rule: ${totalCars()} cars here), even though they get no benefit.`, `Lendas contam para decidir a Adrenalina (e a regra de 5+ carros: ${totalCars()} carros aqui), mesmo sem benefício.`),
          interpretation("Legend cars are cars: you may Slipstream behind them, they can block you, and they go to the Hall of Fame when they finish.", "Carros de Lenda são carros: você pode pegar Vácuo atrás deles, eles podem bloquear você e vão ao Hall da Fama ao chegar."),
          interpretation("The booklet does not say what a Legend does after its last lap; past the finish it ignores corners, so move it its Top Speed.", "O livreto não diz o que uma Lenda faz depois da última volta; após a chegada ela ignora curvas, então mova-a pela Velocidade Máxima.")
        ], ["a5", "c7"])}
      </div>`;
  }

  // ---------- weather ----------

  function weatherSection() {
    return `
      ${sectionHeading("weather", t("Weather & Road Conditions Module", "Módulo de Clima e Condições da Pista"), sectionIndex("weather"), ["a6", "a7", "a12"])}
      <div class="callout">${lineList([
        t("Road Conditions tokens are permanent for the race. Tokens with the Mandatory icon (!) always apply; the others are optional — use them when you choose, like Upgrade symbols (during React).", "As fichas de Condições da Pista valem a corrida inteira. Fichas com o ícone de Obrigatório (!) sempre se aplicam; as outras são opcionais — use quando quiser, como símbolos de Upgrade (no Reagir)."),
        t("Corner tokens affect that Corner Line. Sector tokens affect all Spaces from that corner to the next one; your car must be in the sector to use them.", "Fichas de curva afetam aquela Linha de Curva. Fichas de setor afetam todos os Espaços daquela curva até a próxima; o carro precisa estar no setor para usá-las."),
        t("The Weather token changes every car's setup before the race. Its weather effect (lower-right symbol) applies only in sectors that have a Weather Road Conditions token.", "A ficha de Clima muda a preparação de todos os carros antes da corrida. O efeito de clima (símbolo do canto inferior direito) só vale nos setores com uma ficha de Condição da Pista de Clima.")
      ])} ${ref("a7")}</div>
      <h3 class="subhead">${t("Road Conditions · corner effects", "Condições da Pista · efeitos de curva")}</h3>
      <div class="icon-grid">
        ${iconCard("road-corner-plus1", "Speed Limit +1", "This corner's Speed Limit is 1 higher.", "Limite +1", "O Limite de Velocidade desta curva é 1 maior.", "a7")}
        ${iconCard("road-corner-minus1", "Speed Limit −1", "This corner's Speed Limit is 1 lower.", "Limite −1", "O Limite de Velocidade desta curva é 1 menor.", "a7")}
        ${iconCard("road-overheat", "Overheat", "If your Speed is above the Speed Limit when you cross this Corner Line, the Heat you pay is increased by 1.", "Superaquecer", "Se sua Velocidade passar do Limite ao cruzar esta Linha de Curva, o Calor pago aumenta em 1.", "a7")}
      </div>
      <p class="glossary-intro">${t("All three corner tokens carry the Mandatory icon: they always apply.", "As três fichas de curva têm o ícone de Obrigatório: sempre se aplicam.")}</p>
      <h3 class="subhead">${t("Road Conditions · sector effects", "Condições da Pista · efeitos de setor")}</h3>
      <div class="icon-grid">
        ${iconCard("sector-symbol", "Sector symbol", "A token showing this symbol goes beside the straight after its corner and affects that whole sector.", "Símbolo de Setor", "Uma ficha com este símbolo vai ao lado do trecho depois da curva e afeta o setor inteiro.", "a6")}
        ${iconCard("road-sector-slipstream", "Slipstream boost", "If you Slipstream in step 6 from this sector, add 1 extra Space to the usual 2.", "Vácuo +1", "Se usar o Vácuo no passo 6 a partir deste setor, some 1 Espaço extra aos 2 habituais.", "a7")}
        ${iconCard("road-sector-heat-control", "Heat control", "Boosting in this sector costs no Heat (still at most one Boost per turn). Your car must be in the sector when you Boost.", "Controle de Calor", "Usar Turbo neste setor não custa Calor (ainda no máximo um Turbo por turno). O carro precisa estar no setor ao usar o Turbo.", "a7")}
        ${iconCard("road-sector-weather", "Weather", "The Weather token's weather effect applies in this sector.", "Clima", "O efeito de clima da ficha de Clima vale neste setor.", "a7")}
      </div>
      <h3 class="subhead">${t("Weather token · car setup (before the race)", "Ficha de Clima · preparação do carro (antes da corrida)")}</h3>
      <div class="icon-grid">
        ${iconCard("weather-token", "A Weather token", "Car-setup picture in the lower-left corner, weather-effect symbol in the lower-right corner. Only one token is used per race.", "Uma ficha de Clima", "Figura de preparação no canto inferior esquerdo, símbolo do efeito de clima no canto inferior direito. Só uma ficha por corrida.", "a7")}
        ${iconCard("weather-stress-plus1", "+1 Stress", "Shuffle 1 extra Stress card into your deck.", "+1 Estresse", "Embaralhe 1 carta de Estresse extra no baralho.", "a7")}
        ${iconCard("weather-stress-minus1", "−1 Stress", "Remove 1 Stress card from your deck.", "−1 Estresse", "Tire 1 carta de Estresse do baralho.", "a7")}
        ${iconCard("weather-heat-plus1", "+1 Heat", "Place 1 extra Heat card in your Engine.", "+1 Calor", "Coloque 1 carta de Calor extra no Motor.", "a7")}
        ${iconCard("weather-heat-minus1", "−1 Heat", "Remove 1 Heat card from your Engine.", "−1 Calor", "Tire 1 carta de Calor do Motor.", "a7")}
        ${iconCard("weather-heat-to-deck", "3 Heat to deck", "Shuffle 3 of your Heat cards into your draw deck.", "3 Calor no baralho", "Embaralhe 3 das suas cartas de Calor no baralho de compra.", "a7")}
        ${iconCard("weather-heat-to-discard", "3 Heat to discard", "Place 3 of your Heat cards into your discard pile.", "3 Calor no descarte", "Coloque 3 das suas cartas de Calor na pilha de descarte.", "a7")}
      </div>
      <h3 class="subhead">${t("Weather token · weather effects (sectors with a Weather token)", "Ficha de Clima · efeitos de clima (setores com ficha de Clima)")}</h3>
      <div class="icon-grid">
        ${iconCard("weather-slipstream-plus2", "Slipstream +2", "If you Slipstream from this sector in step 6, add 2 extra Spaces to the usual 2.", "Vácuo +2", "Se usar o Vácuo a partir deste setor no passo 6, some 2 Espaços extras aos 2 habituais.", "a7")}
        ${iconCard("weather-no-slipstream", "No slipstream", "You cannot start a Slipstream from this sector (you may Slipstream into it).", "Sem vácuo", "Você não pode começar um Vácuo neste setor (pode entrar nele pelo Vácuo).", "a7")}
        ${iconCard("weather-cooling-bonus", "Cooling bonus", "+1 Cooldown in this sector during React.", "Bônus de resfriamento", "+1 Resfriar neste setor durante o Reagir.", "a7")}
        ${iconCard("weather-no-cooling", "No cooling", "No Cooldown allowed in this sector during React.", "Sem resfriamento", "Nenhum Resfriar permitido neste setor durante o Reagir.", "a7")}
      </div>
      <div class="callout">${lineList([
        interpretation("Sector effects use where your car is when you use them (React or Slipstream), as the booklet says for Slipstream and Boost; apply Cooling bonus / No cooling the same way.", "Os efeitos de setor usam onde o carro está no momento do uso (Reagir ou Vácuo), como o livreto diz para Vácuo e Turbo; aplique Bônus de resfriamento / Sem resfriamento da mesma forma."),
        interpretation("“Remove” and “3 Heat to deck/discard” use the Heat cards you would otherwise place in the Engine; removed cards go back to the reserve.", "“Tirar” e “3 Calor no baralho/descarte” usam as cartas de Calor que iriam para o Motor; as tiradas voltam à reserva.")
      ])}</div>`;
  }

  // ---------- championship ----------

  function championshipSection() {
    return `
      ${sectionHeading("championship", t("Championship System", "Sistema de Campeonato"), sectionIndex("championship"), ["a8", "a9", "a10"])}
      <div class="quick-grid">
        ${infoCard(t("SPONSORSHIP", "PATROCÍNIO"), t("Sponsorship cards", "Cartas de Patrocínio"), [
          t("Special one-time Upgrades: remove from the game at the end of the turn you play them (step 9).", "Upgrades especiais de uso único: saem do jogo no fim do turno em que são jogadas (passo 9)."),
          t("Like any Upgrade card, you may discard them in step 8.", "Como qualquer carta de Upgrade, podem ser descartadas no passo 8."),
          t("Each time you gain one, draw it from the top of the Sponsorship deck straight into your hand.", "Cada vez que ganha uma, compre-a do topo do baralho de Patrocínio direto para a mão."),
          t("Deck empty: shuffle the Sponsorship cards played since the start of this race into a new deck; if there are none, you get nothing.", "Baralho vazio: embaralhe as cartas de Patrocínio jogadas desde o início desta corrida num novo baralho; se não houver, você não ganha nada."),
          t("No Sponsorship can be gained in a turn where you spin out.", "Nenhum Patrocínio pode ser ganho num turno em que você roda."),
          t("Unused ones carry over to the next race; they are worthless when the season ends.", "As não usadas passam para a próxima corrida; não valem nada no fim da temporada.")
        ], "a10")}
        ${infoCard(t("PRESS CORNER", "CURVA DA IMPRENSA"), t("Impress the press", "Impressione a imprensa"), [
          t("A permanent challenge for everyone at the corner(s) with a standee.", "Um desafio permanente para todos na(s) curva(s) com totem."),
          rl("Slipstream", "cross the Corner Line with your Slipstream move (Speed irrelevant)", "Vácuo", "cruze a Linha de Curva com o movimento de Vácuo (Velocidade irrelevante)"),
          rl("Or speed", "exceed its Speed Limit (including a Road Conditions change) by 2 or more", "Ou velocidade", "passe do Limite (inclusive com mudança de Condições da Pista) em 2 ou mais"),
          t("→ gain 1 Sponsorship card. Never more than 1 each time you go through a Press Corner.", "→ ganhe 1 carta de Patrocínio. Nunca mais de 1 por passagem numa Curva da Imprensa.")
        ], "a10")}
        ${infoCard(t("EVENTS", "EVENTOS"), t("Event cards", "Cartas de Evento"), [
          t("Each race's Event card names the track and lists, on its right side, the setup steps to do (Build your car, Sponsorship, Press Corner, Weather & Road Conditions).", "A carta de Evento de cada corrida indica a pista e lista, no lado direito, os passos de preparação (Monte seu carro, Patrocínio, Curva da Imprensa, Clima e Condições da Pista)."),
          t("Its special event — a setup change, rule change or challenge — is printed on the card; read it aloud before the race.", "O evento especial — mudança de preparação, de regra ou desafio — está impresso na carta; leia-o em voz alta antes da corrida."),
          t("Example from the booklet: “New Grandstand Inauguration” (1961, race 1, Great Britain) gives a Sponsorship card to the first three drivers across the finish line on the 1st lap.", "Exemplo do livreto: “New Grandstand Inauguration” (1961, corrida 1, Grã-Bretanha) dá uma carta de Patrocínio aos três primeiros pilotos a cruzar a linha de chegada na 1ª volta.")
        ], ["a8", "a9"])}
        ${infoCard(t("AFTER EACH RACE", "DEPOIS DE CADA CORRIDA"), t("Between races", "Entre corridas"), [
          t("Record each player's Championship points on the scorepad, as shown on the Hall of Fame.", "Anote os pontos de Campeonato de cada jogador no bloco, conforme o Hall da Fama."),
          t("Players keep their Upgrade cards and unused Sponsorship cards with their 12 Basic cards. Heat and Stress go back to the reserve.", "Os jogadores mantêm as cartas de Upgrade e as de Patrocínio não usadas junto com as 12 Básicas. Calor e Estresse voltam à reserva."),
          t("Shuffle the Sponsorship cards used this race back into the Sponsorship deck.", "Embaralhe as cartas de Patrocínio usadas nesta corrida de volta no baralho de Patrocínio."),
          t("Shuffle the Weather token and Road Conditions tokens back into their piles.", "Embaralhe a ficha de Clima e as fichas de Condições da Pista de volta nas pilhas."),
          t("Find the next Event and Track cards and set up again (use “Next race” in the checklist).", "Ache as próximas cartas de Evento e Pista e prepare de novo (use “Próxima corrida” na lista)."),
          t("Pausing the season? This is the moment; the box insert keeps everything sorted.", "Vai pausar a temporada? Este é o momento; o organizador da caixa mantém tudo separado."),
          hasLegends() ? interpretation("The booklet does not say whether Legends score Championship points. Their cars take Hall of Fame places, so players score the place they actually reach; recording the Legends' points too lets you race them in the standings.", "O livreto não diz se as Lendas marcam pontos de Campeonato. Os carros delas ocupam lugares no Hall da Fama, então os jogadores marcam o lugar que realmente alcançam; anotar também os pontos das Lendas permite disputar a classificação com elas.") : null
        ], "a9")}
      </div>
      <h3 class="subhead">${t("Event card setup icons", "Ícones de preparação da carta de Evento")}</h3>
      <div class="icon-grid">
        ${iconCard("event-build-car", "Build your car", "Draft 1 Upgrade card before the race (market: 1 per player + 3; last on the grid picks first; the last player may then swap one owned Upgrade for a leftover).", "Monte seu carro", "Escolha 1 carta de Upgrade antes da corrida (mercado: 1 por jogador + 3; o último do grid escolhe primeiro; depois o último jogador pode trocar um Upgrade que tem por uma sobra).", "a9")}
        ${iconCard("event-sponsorship", "Sponsorship", "Every player draws this many Sponsorship cards; they are part of the 7-card starting hand.", "Patrocínio", "Cada jogador compra este número de cartas de Patrocínio; fazem parte da mão inicial de 7 cartas.", "a9")}
        ${iconCard("event-press-corner", "Press Corner", "Place a Press Corner standee at the corner(s) the Track card lists for this letter.", "Curva da Imprensa", "Coloque um totem de Curva da Imprensa na(s) curva(s) que a carta de Pista indica para esta letra.", "a9")}
        ${iconCard("event-weather", "Weather & Road Conditions", "Draw a Weather token and the Road Conditions tokens for this race.", "Clima e Condições da Pista", "Compre uma ficha de Clima e as fichas de Condições da Pista desta corrida.", "a9")}
      </div>`;
  }

  // ---------- tournament ----------

  function tournamentSection() {
    return `
      ${sectionHeading("tournament", t("Tournament Mode", "Modo Torneio"), sectionIndex("tournament"), ["a11"])}
      <div class="quick-grid">
        ${infoCard(t("TOURNAMENT", "TORNEIO"), t("Hidden gear changes", "Trocas de marcha ocultas"), [
          rl("Step 1", "nobody adjusts their Gear pawn.", "Passo 1", "ninguém ajusta o peão de Marcha."),
          rl("Step 2", "everyone still plays cards face down — 1 to 4, within one or two gears of the current one.", "Passo 2", "todos ainda jogam cartas viradas para baixo — de 1 a 4, a até duas marchas da atual."),
          rl("Step 3", "show how many cards you played, then set your Gear pawn to that number.", "Passo 3", "mostre quantas cartas jogou e então ponha o peão de Marcha nesse número."),
          rl("Two gears", "if that is two steps up or down, pay 1 Heat immediately in your Reveal step.", "Duas marchas", "se for duas posições acima ou abaixo, pague 1 Calor na hora, no seu passo de Revelar.")
        ], "a11")}
        ${infoCard(t("MISTAKES", "ERROS"), t("Shifted two gears but can't pay", "Trocou duas marchas sem poder pagar"), [
          t("Adjust the number of cards to a legal one-gear shift:", "Ajuste o número de cartas para uma troca legal de uma marcha:"),
          rl("Shifting up", "discard one of your played cards at random.", "Subindo", "descarte uma das cartas jogadas ao acaso."),
          rl("Shifting down", "add a random Basic card from your deck to your Play Area (flip as for a + symbol).", "Descendo", "acrescente uma carta Básica aleatória do baralho à Área de Jogo (vire como num símbolo +)."),
          t("Then put your Gear pawn in the correct gear.", "Depois ponha o peão de Marcha na marcha correta.")
        ], "a11")}
      </div>`;
  }

  // ---------- iconography ----------

  function iconsSection() {
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), sectionIndex("icons"), ["c4", "c5", "c6", "c7", "a12"])}
      <p class="glossary-intro">${t("Each image is cropped individually from the rulebooks and shown as printed on the mats, cards and tokens.", "Cada imagem foi recortada individualmente dos manuais e aparece como impressa nos painéis, cartas e fichas.")}</p>
      <h3 class="subhead">${t("Core symbols", "Símbolos básicos")}</h3>
      <div class="icon-grid">
        ${iconCard("mandatory", "Mandatory", "Marks the steps every player always does (1, 2, 3, 9) and, on Upgrades and Road Conditions, symbols that must be applied.", "Obrigatório", "Marca os passos que todos sempre fazem (1, 2, 3, 9) e, em Upgrades e Condições da Pista, símbolos que precisam ser aplicados.", ["c4", "a4"])}
        ${iconCard("plus-symbol", "+ symbol", "Adds an unknown 1–4: flip the top card of your deck; a Basic card goes to your Play Area, anything else is discarded and you keep flipping.", "Símbolo +", "Soma um valor desconhecido de 1–4: vire a carta do topo do baralho; uma carta Básica vai para a Área de Jogo, qualquer outra é descartada e você continua virando.", "c5")}
        ${iconCard("basic-card", "Basic card", "The speedometer symbol identifies the 12 Basic cards of each player (values 1–4).", "Carta Básica", "O símbolo de velocímetro identifica as 12 cartas Básicas de cada jogador (valores 1–4).", ["c2", "c5"])}
        ${iconCard("cooldown-core", "Cooldown", "Move Heat cards from your hand back to your Engine; the number says how many (1st gear 3, 2nd gear 1).", "Resfriar", "Leve cartas de Calor da mão de volta ao Motor; o número diz quantas (1ª marcha 3, 2ª marcha 1).", "c6")}
        ${iconCard("pay-heat", "Pay Heat", "Move 1 Heat card from your Engine to your discard pile.", "Pagar Calor", "Leve 1 carta de Calor do Motor para o descarte.", "c7")}
        ${iconCard("cannot-discard", "Card cannot be discarded", "Printed on Stress and Heat cards: you can never choose to discard them from your hand.", "Carta não descartável", "Impresso nas cartas de Estresse e Calor: você nunca pode escolher descartá-las da mão.", "c6")}
        ${usesGarage() ? iconCard("advanced-upgrade", "Advanced Upgrade", "Identifies the 62 Advanced Upgrade cards; cards without it are the 34 Regular ones.", "Upgrade Avançado", "Identifica as 62 cartas de Upgrade Avançadas; as sem ele são as 34 Regulares.", ["a2", "a3"]) : ""}
      </div>
      <h3 class="subhead">${t("Player mat: the round", "Painel do jogador: a rodada")}</h3>
      <p class="glossary-intro">${t("The nine step dials along the top of your mat are explained, one by one, in “Playing a round”.", "Os nove mostradores de passos no alto do painel são explicados, um a um, em “Jogando uma rodada”.")}</p>
      ${usesGarage() ? `<p class="glossary-intro">${t("Upgrade symbols (Heat, Scrap, Adjust Speed Limit, Cooldown, Slipstream boost, Reduce Stress, Refresh, Salvage, Direct Play, Accelerate) are shown in the Garage section.", "Os símbolos de Upgrade (Calor, Sucata, Ajustar Limite, Resfriar, Vácuo, Reduzir Estresse, Renovar, Recuperar, Jogada Direta, Acelerar) aparecem na seção Garagem.")}</p>` : ""}
      ${usesWeather() ? `<p class="glossary-intro">${t("Weather and Road Conditions tokens are shown in their own section.", "As fichas de Clima e de Condições da Pista aparecem na seção própria.")}</p>` : ""}
      ${isChampionship() ? `<p class="glossary-intro">${t("Event card icons and One-time use are shown in the Championship and Garage sections.", "Os ícones da carta de Evento e o Uso único aparecem nas seções Campeonato e Garagem.")}</p>` : ""}`;
  }

  // ---------- examples ----------

  function examplesSection() {
    const examples = [
      [t("Stress cards on reveal", "Cartas de Estresse ao revelar"), [
        t("The active player reveals a 3 and two Stress cards in step 3.", "O jogador ativo revela um 3 e duas cartas de Estresse no passo 3."),
        t("For each Stress card they flip from their deck until a Basic card appears, discarding everything else: here 2 Heat cards, a Stress card and a Starting Upgrade card are discarded.", "Para cada carta de Estresse ele vira do baralho até aparecer uma carta Básica, descartando o resto: aqui são descartadas 2 cartas de Calor, uma de Estresse e uma de Upgrade Inicial."),
        t("Each Basic card found is placed on top of a Stress card. Total Speed: 8 — the car moves 8 Spaces at once.", "Cada carta Básica encontrada vai sobre uma carta de Estresse. Velocidade total: 8 — o carro anda 8 Espaços na hora.")
      ], "c5", false],
      [t("A corner check and a spin out", "Uma checagem de curva e uma rodada"), [
        t("In 3rd gear you play 4 + 3 + 2 = Speed 9 and cross a corner with Speed Limit 6.", "Em 3ª marcha você joga 4 + 3 + 2 = Velocidade 9 e cruza uma curva de Limite 6."),
        t("You owe 9 − 6 = 3 Heat but only 2 Heat cards are in your Engine: pay both and spin out.", "Você deve 9 − 6 = 3 Calor, mas só há 2 cartas de Calor no Motor: pague as duas e rode."),
        t("Move back to the first free Space before that Corner Line, take 2 Stress cards into your hand (3rd gear) and put your Gear pawn on 1st.", "Volte ao primeiro Espaço livre antes daquela Linha de Curva, pegue 2 cartas de Estresse na mão (3ª marcha) e ponha o peão de Marcha na 1ª.")
      ], "c6", true],
      [t("Shifting two gears", "Trocando duas marchas"), [
        t("You are in 2nd gear and want 4 cards this round.", "Você está na 2ª marcha e quer 4 cartas nesta rodada."),
        t("Announce the jump, pay 1 Heat from your Engine to your discard pile and move the pawn 2 → 4.", "Anuncie o salto, pague 1 Calor do Motor para o descarte e mova o peão 2 → 4.")
      ], "c7", false],
      [t("A cluttered hand", "Uma mão entupida"), [
        t("You are in 4th gear with 5 Heat cards among your 7 cards: only 2 are playable.", "Você está na 4ª marcha com 5 cartas de Calor entre as 7: só 2 são jogáveis."),
        t("Play those 2 and 2 Heat cards. On reveal your car does not move: Gear pawn to 1st, the 4 cards to your discard pile, go straight to step 9.", "Jogue essas 2 e 2 cartas de Calor. Ao revelar o carro não anda: peão para a 1ª, as 4 cartas para o descarte, vá direto ao passo 9.")
      ], "c7", true]
    ];
    if (hasLegends()) {
      examples.push([t("Four Legends, one card", "Quatro Lendas, uma carta"), [
        t("Green is past the Legends Line: 3 (corner Speed Limit) + 2 (its Diamond) = 5 Spaces; it clears the corner.", "Verde já passou da Linha de Lendas: 3 (Limite da curva) + 2 (seu Losango) = 5 Espaços; faz a curva."),
        t("Red is past the line too: 3 + 1 = 4 Spaces — not enough to clear the corner this round.", "Vermelho também passou: 3 + 1 = 4 Espaços — não basta para fazer a curva nesta rodada."),
        t("Blue is not past the line; its Top Speed 18 would cross the Corner Line, so it stops on the track space numbered 3 (its Diamond).", "Azul não passou da linha; a Velocidade Máxima 18 cruzaria a Linha de Curva, então ele para no espaço numerado 3 (seu Losango)."),
        t("Yellow is not past the line; Top Speed 11 does not reach the corner, so it moves 11 Spaces.", "Amarelo não passou da linha; Velocidade Máxima 11 não chega à curva, então anda 11 Espaços.")
      ], "a6", false]);
    }
    if (usesWeather()) {
      examples.push([t("Placing Road Conditions on USA", "Posicionando Condições da Pista nos EUA"), [
        t("The Weather token goes on the Billboard. USA has 3 corners, so 3 Road Conditions tokens are drawn.", "A ficha de Clima vai no Outdoor. EUA tem 3 curvas, então 3 fichas de Condições da Pista são compradas."),
        t("Tokens with the Sector symbol go on the tents beside the straight after their corner (the whole “A sector” up to the next corner).", "Fichas com o símbolo de Setor vão nas tendas ao lado do trecho depois da curva (o “setor A” inteiro até a próxima curva)."),
        t("A token without it goes on the tent beside its corner.", "Uma ficha sem ele vai na tenda ao lado da sua curva.")
      ], "a6", false]);
    }
    if (isChampionship()) {
      examples.push(
        [t("Press Corner", "Curva da Imprensa"), [
          t("Printed Speed Limit 3 + a Road Conditions +1 = 4.", "Limite impresso 3 + Condição da Pista +1 = 4."),
          t("Yellow crosses at Speed 6: pays 2 Heat and gains a Sponsorship card (2 over).", "Amarelo cruza com Velocidade 6: paga 2 Calor e ganha uma carta de Patrocínio (2 acima)."),
          t("Red crosses thanks to Slipstream: no Heat to pay, still gains a Sponsorship card.", "Vermelho cruza graças ao Vácuo: não paga Calor e ainda ganha Patrocínio."),
          t("Blue exceeds the Speed Limit by only 1: it pays 3 Heat in total for its cards and the corner, but gains no Sponsorship card.", "Azul passa do Limite só por 1: paga 3 Calor no total pelas cartas e pela curva, mas não ganha carta de Patrocínio.")
        ], "a10", false],
        [t("Season scoresheet", "Folha da temporada"), [
          t("Race 1 (Great Britain): yellow 6, blue 3, green 4, red 9 points.", "Corrida 1 (Grã-Bretanha): amarelo 6, azul 3, verde 4, vermelho 9 pontos."),
          t("Race 2 (USA): yellow 4, blue 3, green 9, red 6 — running totals 10, 6, 13, 15.", "Corrida 2 (EUA): amarelo 4, azul 3, verde 9, vermelho 6 — totais 10, 6, 13, 15."),
          t("For race 3 red starts on pole, then green, yellow, blue.", "Na corrida 3, vermelho larga na pole, depois verde, amarelo, azul.")
        ], "a9", false]
      );
    }
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), sectionIndex("examples"), [...new Set(examples.map((example) => example[2]))])}
      <div class="example-grid">${examples.map(([title, items, spec, own], index) => `
        <article class="example-card">
          <span class="card-number">${String(index + 1).padStart(2, "0")}</span>
          <h3>${title}</h3>
          ${lineList(items)}
          <div class="example-source"><span>${own ? t("Guide's example, applying", "Exemplo do guia, aplicando") : t("Paraphrased from the manual", "Paráfrase do manual")}</span>${ref(spec)}</div>
        </article>`).join("")}</div>`;
  }

  // ---------- glossary ----------

  const glossary = [
    { term: ["Speed", "Velocidade"], text: ["The total value of the cards in your Play Area (plus Adrenaline's +1 and similar bonuses). You move that many Spaces; corners compare it to their Speed Limit.", "O valor total das cartas na Área de Jogo (mais o +1 da Adrenalina e bônus parecidos). Você anda esse número de Espaços; as curvas o comparam ao Limite."], spec: "c5" },
    { term: ["Speed Limit", "Limite de Velocidade"], text: ["The number printed at each corner. Crossing its Corner Line with a higher Speed costs the difference in Heat.", "O número impresso em cada curva. Cruzar a Linha de Curva com Velocidade maior custa a diferença em Calor."], spec: "c4" },
    { term: ["Corner Line", "Linha de Curva"], text: ["The line across the track at a corner. Crossing it during your turn triggers Check Corner.", "A linha atravessando a pista numa curva. Cruzá-la no turno dispara Checar Curva."], spec: "c4" },
    { term: ["Space / Spot", "Espaço / Lugar"], text: ["A Space is one slice of track; its Spots are the side-by-side positions for cars in that slice.", "Um Espaço é uma fatia da pista; seus Lugares são as posições lado a lado para carros nessa fatia."], spec: "c4" },
    { term: ["Race Line", "Linha de Corrida"], text: ["The ideal line drawn on the track. Cars take the free Spot closest to it, and side by side the car closer to it is ahead.", "A linha ideal desenhada na pista. Os carros ocupam o Lugar livre mais próximo dela e, lado a lado, o carro mais próximo dela está à frente."], spec: "c4" },
    { term: ["Engine", "Motor"], text: ["The middle spot of your mat where your available Heat cards lie face up.", "O espaço do meio do painel onde ficam viradas para cima as cartas de Calor disponíveis."], spec: "c3" },
    { term: ["Play Area", "Área de Jogo"], text: ["Where you put the cards played this round (face down until Reveal).", "Onde você põe as cartas jogadas na rodada (viradas para baixo até Revelar)."], spec: "c4" },
    { term: ["Heat", "Calor"], text: ["Cards that measure engine strain. Paying Heat moves them from Engine to discard; they then clog your hand until cooled down.", "Cartas que medem o desgaste do motor. Pagar Calor as leva do Motor ao descarte; depois entopem a mão até serem resfriadas."], spec: "c7" },
    { term: ["Stress", "Estresse"], text: ["Cards that must be played to leave your hand; each one becomes a random Basic card value (+ symbol).", "Cartas que precisam ser jogadas para sair da mão; cada uma vira o valor de uma carta Básica aleatória (símbolo +)."], spec: "c5" },
    { term: ["Basic card", "Carta Básica"], text: ["Your 12 cards valued 1–4, marked with the speedometer symbol.", "Suas 12 cartas de valor 1–4, marcadas com o símbolo de velocímetro."], spec: "c2" },
    { term: ["Boost", "Turbo"], text: ["Once per turn, any gear: pay 1 Heat to gain a + symbol and move accordingly.", "Uma vez por turno, em qualquer marcha: pague 1 Calor para ganhar um símbolo + e andar de acordo."], spec: "c6" },
    { term: ["Cooldown", "Resfriar"], text: ["Return Heat cards from hand to Engine; 3 in 1st gear, 1 in 2nd gear.", "Devolver cartas de Calor da mão ao Motor; 3 na 1ª marcha, 1 na 2ª."], spec: "c6" },
    { term: ["Slipstream", "Vácuo"], text: ["Optional extra 2 Spaces when next to or right behind another car; not counted as Speed.", "2 Espaços extras opcionais ao lado ou logo atrás de outro carro; não contam como Velocidade."], spec: "c6" },
    { term: ["Adrenaline", "Adrenalina"], text: [`Bonus for the last car (last two with 5+ cars): +1 Speed and Space, and/or +1 Cooldown.`, "Bônus para o último carro (os dois últimos com 5+ carros): +1 Velocidade e Espaço, e/ou +1 Resfriar."], spec: "c5" },
    { term: ["Spin out", "Rodar"], text: ["What happens when you cannot pay a corner's Heat: back before the corner, Stress to hand, 1st gear.", "O que acontece quando você não pode pagar o Calor de uma curva: volta antes da curva, Estresse na mão, 1ª marcha."], spec: "c6" },
    { term: ["Hall of Fame", "Hall da Fama"], text: ["The board area where finished cars are lined up in order.", "A área do tabuleiro onde os carros que chegaram ficam alinhados em ordem."], spec: "c7" },
    { term: ["Starting grid", "Grid de largada"], text: ["The numbered starting spots; cars fill them in ascending order.", "Os lugares numerados de largada; os carros os ocupam em ordem crescente."], spec: "c3" }
  ];

  function glossarySection() {
    const visible = [...glossary];
    if (usesGarage()) {
      visible.push({ term: ["Upgrade card", "Carta de Upgrade"], text: ["Cards that customize your car: Regular or Advanced (gear-and-wrench icon), with values and symbols applied in Reveal and React.", "Cartas que personalizam o carro: Regulares ou Avançadas (ícone de engrenagem e chave), com valores e símbolos aplicados em Revelar e Reagir."], spec: "a3" });
    } else {
      visible.push({ term: ["Starting Upgrade card", "Carta de Upgrade Inicial"], text: ["The 3 chevron cards each player uses in the core game: 0, 5 and an extra Heat.", "As 3 cartas de divisas que cada jogador usa no jogo básico: 0, 5 e um Calor extra."], spec: "c7" });
    }
    if (hasLegends()) {
      visible.push(
        { term: ["Legend", "Lenda"], text: ["An automated car driven by the shared Legends deck.", "Um carro automático guiado pelo baralho de Lendas."], spec: "a5" },
        { term: ["Legends Line", "Linha de Lendas"], text: ["Line before each corner; a Legend past it attacks the corner (move A), otherwise it approaches (move B).", "Linha antes de cada curva; a Lenda depois dela ataca a curva (movimento A), senão se aproxima (movimento B)."], spec: "a5" },
        { term: ["Diamond / Top Speed", "Losango / Velocidade Máxima"], text: ["The numbers per color on a Legends card: the Diamond above the helmet and the Top Speed inside it.", "Os números por cor numa carta de Lendas: o Losango acima do capacete e a Velocidade Máxima dentro dele."], spec: "a5" }
      );
    }
    if (usesWeather()) {
      visible.push({ term: ["Sector", "Setor"], text: ["The stretch of track from one corner to the next; sector tokens affect all of it.", "O trecho da pista de uma curva até a próxima; fichas de setor afetam todo ele."], spec: "a6" });
    }
    if (isChampionship()) {
      visible.push(
        { term: ["Sponsorship card", "Carta de Patrocínio"], text: ["One-time-use Upgrade gained in Press Corners and events.", "Upgrade de uso único ganho em Curvas da Imprensa e eventos."], spec: "a10" },
        { term: ["Press Corner", "Curva da Imprensa"], text: ["A corner marked by a standee where a spectacular pass earns a Sponsorship card.", "Uma curva marcada por totem onde uma passagem espetacular rende uma carta de Patrocínio."], spec: "a10" },
        { term: ["Event / Track card", "Carta de Evento / Pista"], text: ["The Event card sets each race's track, setup steps and special event; the Track card shows which corners are Press Corners.", "A carta de Evento define pista, passos de preparação e evento especial de cada corrida; a carta de Pista mostra quais curvas são Curvas da Imprensa."], spec: "a8" }
      );
    }
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), sectionIndex("glossary"), [])}
      <div class="quick-grid glossary-grid">${visible.map((item) => `
        <article class="info-card glossary-card">
          <span class="component-label">${t("TERM", "TERMO")}</span>
          <h3>${t(item.term[0], item.term[1])}</h3>
          <p>${t(item.text[0], item.text[1])}</p>
          ${ref(item.spec)}
        </article>`).join("")}</div>`;
  }

  // ---------- render ----------

  function renderInto(host) {
    root = host;
    document.body.classList.add("theme-heat");
    document.documentElement.lang = state.language;
    document.title = t("Heat: Pedal to the Metal — Field Manual", "Heat: Pedal to the Metal — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Heat: Pedal to the Metal: core race, Garage, Legends, Weather & Road Conditions, Championship and Tournament Mode, with a match-filtered setup checklist and iconography.",
        "Regras interativas bilíngues de Heat: Pedal to the Metal: corrida básica, Garagem, Lendas, Clima e Condições da Pista, Campeonato e Modo Torneio, com lista de preparação filtrada e iconografia."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook · core + advanced", "Livro interativo · básico + avançado")}</p>
          <h1>Heat: Pedal to the Metal</h1>
          <p class="hero-intro">${t(
            "1960s Grand Prix racing. Shift gears to choose how many cards you play, add them up to set your Speed, burn Heat to push harder, and brake into every corner before your engine — and your car — gives out.",
            "Grande Prêmio dos anos 1960. Troque de marcha para escolher quantas cartas jogar, some-as para definir a Velocidade, queime Calor para acelerar e freie antes de cada curva antes que o motor — e o carro — ceda."
          )}</p>
          <div class="hero-meta"><span>${t("1–6 players", "1–6 jogadores")}</span><span>${t("60 min", "60 min")}</span><span>${t("Race · Championship", "Corrida · Campeonato")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/heat.webp" alt="${t("Cover of the Heat: Pedal to the Metal rulebook", "Capa do manual de Heat: Pedal to the Metal")}" fetchpriority="high"><figcaption>${t("Rules booklet cover · Vincent Dutrait", "Capa do livreto de regras · Vincent Dutrait")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("Pit wall", "Mureta dos boxes")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column heat-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the 8-page Rules booklet and the 12-page Advanced Play & Championship booklet supplied with the game. Effects printed on individual Upgrade, Sponsorship, Event, Legends and Track cards stay on those cards; points marked “Guide's reading” are interpretations where the booklets are silent.",
            "Este guia cobre o livreto de Regras de 8 páginas e o livreto de Jogo Avançado e Campeonato de 12 páginas que acompanham o jogo. Efeitos impressos em cada carta de Upgrade, Patrocínio, Evento, Lendas e Pista ficam nessas cartas; pontos marcados como “Leitura do guia” são interpretações onde os livretos são omissos."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${victorySection()}</section>
          <section class="rule-section">${roundSection()}</section>
          <section class="rule-section">${cardsSection()}</section>
          ${usesGarage() ? `<section class="rule-section">${garageSection()}</section>` : ""}
          ${hasLegends() ? `<section class="rule-section">${legendsSection()}</section>` : ""}
          ${usesWeather() ? `<section class="rule-section">${weatherSection()}</section>` : ""}
          ${isChampionship() ? `<section class="rule-section">${championshipSection()}</section>` : ""}
          ${usesTournament() ? `<section class="rule-section">${tournamentSection()}</section>` : ""}
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the Heat: Pedal to the Metal rulebooks. Game design: Asger Harding Granerud and Daniel Skjold Pedersen; illustrations: Vincent Dutrait. Published by Days of Wonder.",
        "Guia pessoal de consulta baseado nos manuais de Heat: Pedal to the Metal. Design do jogo: Asger Harding Granerud e Daniel Skjold Pedersen; ilustrações: Vincent Dutrait. Publicado pela Days of Wonder."
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
      const scrollY = window.scrollY;
      renderInto(root);
      window.scrollTo(0, scrollY);
      return;
    }
    if (button.hasAttribute("data-setup-reset")) {
      setupState = { signature: signature(), checks: [] };
      saveSetup();
      renderInto(root);
      return;
    }
    if (button.hasAttribute("data-race-reset")) {
      const raceIds = setupPhases().filter((phase) => phase.race).map((phase) => phase.id);
      setupState = { signature: signature(), checks: setupState.checks.filter((id) => !raceIds.includes(id)) };
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
      root.querySelector(".heat-page")?.prepend(notice);
    }
    notice.textContent = storageNoticeText();
  }

  function applyConfigChange(mutator) {
    const before = signature();
    const draft = { ...state };
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

  const CONFIG_INPUTS = [
    ["format", "format", FORMATS],
    ["players", "players", PLAYER_COUNTS],
    ["legends", "legends", LEGEND_COUNTS],
    ["pro", "pro", PRO_LEVELS],
    ["track", "track", TRACKS],
    ["length", "length", LENGTHS],
    ["garage", "garage", GARAGE],
    ["weather", "weather", YES_NO],
    ["season", "season", SEASONS],
    ["deck", "upgradeDeck", UPGRADE_DECKS],
    ["tournament", "tournament", YES_NO]
  ];

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !root || !root.contains(target)) {
      return;
    }
    for (const [attr, key, list] of CONFIG_INPUTS) {
      if (target.dataset[attr] !== undefined) {
        const value = target.dataset[attr];
        if (list.includes(value) && value !== state[key]) {
          applyConfigChange((draft) => {
            draft[key] = value;
          });
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

  window.Heat = { renderInto, onClick, onChange };
})();
