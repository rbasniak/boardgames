(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.7-wonders.v1";
  const SETUP_KEY = "field-manual.7-wonders.setup.v1";
  const MANUALS = { core: "7-wonders_core.pdf", leaders: "7-wonders_leaders.pdf" };
  const ICONS = "assets/7-wonders/icons/";
  const ART = "assets/7-wonders/art/";

  const PLAYER_COUNTS = ["2", "3", "4", "5", "6", "7"];
  const WONDER_MODES = ["card", "side-a", "chosen"];
  const REVEAL_MODES = ["together", "one-by-one"];
  const LEADER_MODES = ["no", "yes"];
  const defaults = { language: "pt-BR", players: "4", wonders: "card", reveal: "together", leaders: "no" };
  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;
  // The science calculator is a table-side helper only: it lives in memory and is never saved.
  let science = { compass: 0, gear: 0, tablet: 0, wild: 0, aganice: 0, enheduanna: 0 };

  // ---------- state & storage ----------

  function normalizePreferences(saved) {
    return {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      players: PLAYER_COUNTS.includes(String(saved?.players)) ? String(saved.players) : defaults.players,
      wonders: WONDER_MODES.includes(saved?.wonders) ? saved.wonders : defaults.wonders,
      reveal: REVEAL_MODES.includes(saved?.reveal) ? saved.reveal : defaults.reveal,
      leaders: LEADER_MODES.includes(saved?.leaders) ? saved.leaders : defaults.leaders
    };
  }

  // The action-reveal habit does not change the preparation, so it is not part of the setup signature.
  function signature(source = state) {
    return [source.players, source.wonders, source.leaders].join("|");
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read 7 Wonders preferences.", error);
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
      console.error("Could not read 7 Wonders setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save 7 Wonders preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save 7 Wonders setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function players() {
    return Number(state.players);
  }

  function twoPlayer() {
    return state.players === "2";
  }

  // The 2-player variant uses the 3-player configuration of every deck (rulebook p. 7).
  function deckCount() {
    return twoPlayer() ? 3 : players();
  }

  function guildCount() {
    return deckCount() + 2;
  }

  function leaders() {
    return state.leaders === "yes";
  }

  function sideAOnly() {
    return state.wonders === "side-a";
  }

  function oneByOne() {
    return state.reveal === "one-by-one";
  }

  function scriptBase() {
    const script = document.querySelector('script[src*="7-wonders.js"]');
    return script?.src || document.baseURI;
  }

  function manualUrl(book, page) {
    return `${new URL(`manuals/${MANUALS[book]}`, scriptBase()).href}#page=${page}`;
  }

  // A page reference is a number (core rulebook, printed page = PDF page) or "L<n>" (Leaders leaflet, PDF page n).
  function referenceLink(ref) {
    const leaflet = typeof ref === "string" && ref.startsWith("L");
    const page = leaflet ? Number(ref.slice(1)) : Number(ref);
    const label = leaflet ? t(`Leaders leaflet p. ${page} ↗`, `Folheto Leaders p. ${page} ↗`) : t(`Rulebook p. ${page} ↗`, `Manual p. ${page} ↗`);
    return `<a class="source-link" href="${manualUrl(leaflet ? "leaders" : "core", page)}" target="_blank" rel="noreferrer">${label}</a>`;
  }

  function refs(pages) {
    return (Array.isArray(pages) ? pages : [pages]).map(referenceLink).join(" ");
  }

  function sectionHeading(id, title, index, pages) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("CHRONICLE", "CRÔNICA")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="sw-section-references">${(Array.isArray(pages) ? pages : [pages]).map(referenceLink).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
  }

  function interpretation(en, pt) {
    return `<span class="sw-interpretation">${t("Guide's reading", "Leitura do guia")}</span> ${t(en, pt)}`;
  }

  function icon(file, alt) {
    return `<img class="sw-inline-icon" src="${ICONS}${file}.webp" alt="${alt}">`;
  }

  function iconCard(file, titleEn, bodyEn, titlePt, bodyPt, page) {
    const title = t(titleEn, titlePt);
    return `
      <article class="icon-card">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}.webp" alt="${title}"></span>
        <div><strong>${title}</strong><p>${t(bodyEn, bodyPt)}</p>${referenceLink(page)}</div>
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

  function playersLabel(count = state.players) {
    return t(`${count} players`, `${count} jogadores`);
  }

  // ---------- resources, symbols and colors ----------

  const RESOURCES = {
    wood: ["Wood", "Madeira"],
    stone: ["Stone", "Pedra"],
    clay: ["Clay", "Argila"],
    ore: ["Ore", "Minério"],
    glass: ["Glass", "Vidro"],
    loom: ["Textile", "Tecido"],
    papyrus: ["Papyrus", "Papiro"]
  };

  function resName(id) {
    return t(RESOURCES[id][0], RESOURCES[id][1]);
  }

  function res(id) {
    return `${icon(id, resName(id))}<strong>${resName(id)}</strong>`;
  }

  const SYMBOLS = {
    compass: ["Compass", "Compasso"],
    gear: ["Gear", "Engrenagem"],
    tablet: ["Tablet", "Tábua"]
  };

  function symName(id) {
    return t(SYMBOLS[id][0], SYMBOLS[id][1]);
  }

  function sym(id) {
    return `${icon(id, symName(id))}<strong>${symName(id)}</strong>`;
  }

  const COLORS = {
    brown: ["Raw materials", "Matérias-primas", "brown", "marrom"],
    gray: ["Manufactured goods", "Produtos manufaturados", "gray", "cinza"],
    blue: ["Civilian structures", "Estruturas civis", "blue", "azul"],
    yellow: ["Commercial structures", "Estruturas comerciais", "yellow", "amarela"],
    red: ["Military structures", "Estruturas militares", "red", "vermelha"],
    green: ["Scientific structures", "Estruturas científicas", "green", "verde"],
    purple: ["Guilds", "Guildas", "purple", "roxa"]
  };

  function colorBadge(color) {
    return `<span class="sw-color sw-color-${color}">${t(COLORS[color][2], COLORS[color][3])}</span>`;
  }

  function vp(n) {
    return `${icon("victory-points", t("victory points", "pontos de vitória"))}<strong>${n} ${t("VP", "PV")}</strong>`;
  }

  function shields(n) {
    const file = n === 3 ? "three-shields" : n === 2 ? "two-shields" : "shield";
    return `${icon(file, t(`${n} Shield${n > 1 ? "s" : ""}`, `${n} Escudo${n > 1 ? "s" : ""}`))}<strong>${t(`${n} Shield${n > 1 ? "s" : ""}`, `${n} Escudo${n > 1 ? "s" : ""}`)}</strong>`;
  }

  // ---------- card list (rulebook pp. 10–12) ----------
  // n = the player-count marks of the copies in the box (one copy per mark). Chains from the diagram on p. 11.

  function cardData() {
    const either = (a, b) => t(`Produces 1 ${res(a)} <em>or</em> 1 ${res(b)} each turn (not both). Costs 1 coin.`, `Produz 1 ${res(a)} <em>ou</em> 1 ${res(b)} por turno (não os dois). Custa 1 moeda.`);
    const one = (a) => t(`Produces 1 ${res(a)}.`, `Produz 1 ${res(a)}.`);
    const two = (a) => t(`Produces 2 ${res(a)}. Costs 1 coin.`, `Produz 2 ${res(a)}. Custa 1 moeda.`);
    const civ = (n) => `${vp(n)}.`;
    const mil = (n) => `${shields(n)}.`;
    const sci = (s) => `${sym(s)} ${t("symbol.", "(símbolo).")}`;
    return [
      // Age I
      { id: "lumber-yard", age: 1, color: "brown", en: "Lumber Yard", pt: "Madeireira", n: [3, 4], fx: one("wood") },
      { id: "stone-pit", age: 1, color: "brown", en: "Stone Pit", pt: "Jazida de pedra", n: [3, 5], fx: one("stone") },
      { id: "clay-pool", age: 1, color: "brown", en: "Clay Pool", pt: "Barreiro", n: [3, 5], fx: one("clay") },
      { id: "ore-vein", age: 1, color: "brown", en: "Ore Vein", pt: "Veio de minério", n: [3, 4], fx: one("ore") },
      { id: "tree-farm", age: 1, color: "brown", en: "Tree Farm", pt: "Viveiro de árvores", n: [6], fx: either("wood", "clay") },
      { id: "excavation", age: 1, color: "brown", en: "Excavation", pt: "Escavação", n: [4], fx: either("stone", "clay") },
      { id: "clay-pit", age: 1, color: "brown", en: "Clay Pit", pt: "Poço de argila", n: [3], fx: either("clay", "ore") },
      { id: "timber-yard", age: 1, color: "brown", en: "Timber Yard", pt: "Depósito de madeira", n: [3], fx: either("stone", "wood") },
      { id: "forest-cave", age: 1, color: "brown", en: "Forest Cave", pt: "Caverna da floresta", n: [5], fx: either("wood", "ore") },
      { id: "mine", age: 1, color: "brown", en: "Mine", pt: "Mina", n: [6], fx: either("stone", "ore") },
      { id: "loom-1", age: 1, color: "gray", en: "Loom", pt: "Tear", n: [3, 6], fx: one("loom") },
      { id: "glassworks-1", age: 1, color: "gray", en: "Glassworks", pt: "Vidraria", n: [3, 6], fx: one("glass") },
      { id: "press-1", age: 1, color: "gray", en: "Press", pt: "Prensa", n: [3, 6], fx: one("papyrus") },
      { id: "pawnshop", age: 1, color: "blue", en: "Pawnshop", pt: "Casa de penhores", n: [4, 7], fx: civ(3) },
      { id: "baths", age: 1, color: "blue", en: "Baths", pt: "Termas", n: [3, 7], fx: civ(3) },
      { id: "altar", age: 1, color: "blue", en: "Altar", pt: "Altar", n: [3, 5], fx: civ(2) },
      { id: "theater", age: 1, color: "blue", en: "Theater", pt: "Teatro", n: [3, 6], fx: civ(2) },
      { id: "tavern", age: 1, color: "yellow", en: "Tavern", pt: "Taverna", n: [4, 5, 7], fx: t("Take 5 coins from the bank, once, when built.", "Pegue 5 moedas do banco, uma vez, ao construir.") },
      { id: "east-trading-post", age: 1, color: "yellow", en: "East Trading Post", pt: "Entreposto Leste", n: [3, 7], fx: t("From the next turn on, you pay 1 coin instead of 2 for each raw material bought from your <strong>right-hand</strong> neighbor.", "A partir do turno seguinte, você paga 1 moeda em vez de 2 por matéria-prima comprada do vizinho da <strong>direita</strong>.") },
      { id: "west-trading-post", age: 1, color: "yellow", en: "West Trading Post", pt: "Entreposto Oeste", n: [3, 7], fx: t("From the next turn on, you pay 1 coin instead of 2 for each raw material bought from your <strong>left-hand</strong> neighbor.", "A partir do turno seguinte, você paga 1 moeda em vez de 2 por matéria-prima comprada do vizinho da <strong>esquerda</strong>.") },
      { id: "marketplace", age: 1, color: "yellow", en: "Marketplace", pt: "Mercado", n: [3, 6], fx: t("From the next turn on, you pay 1 coin instead of 2 for each manufactured good bought from <strong>either</strong> neighbor.", "A partir do turno seguinte, você paga 1 moeda em vez de 2 por produto manufaturado comprado de <strong>qualquer</strong> vizinho.") },
      { id: "stockade", age: 1, color: "red", en: "Stockade", pt: "Paliçada", n: [3, 7], fx: mil(1) },
      { id: "barracks", age: 1, color: "red", en: "Barracks", pt: "Quartel", n: [3, 5], fx: mil(1) },
      { id: "guard-tower", age: 1, color: "red", en: "Guard Tower", pt: "Torre de vigia", n: [3, 4], fx: mil(1) },
      { id: "apothecary", age: 1, color: "green", en: "Apothecary", pt: "Boticário", n: [3, 5], fx: sci("compass") },
      { id: "workshop", age: 1, color: "green", en: "Workshop", pt: "Oficina", n: [3, 7], fx: sci("gear") },
      { id: "scriptorium", age: 1, color: "green", en: "Scriptorium", pt: "Scriptorium", n: [3, 4], fx: sci("tablet") },
      // Age II
      { id: "sawmill", age: 2, color: "brown", en: "Sawmill", pt: "Serraria", n: [3, 4], fx: two("wood") },
      { id: "quarry", age: 2, color: "brown", en: "Quarry", pt: "Pedreira", n: [3, 4], fx: two("stone") },
      { id: "brickyard", age: 2, color: "brown", en: "Brickyard", pt: "Olaria", n: [3, 4], fx: two("clay") },
      { id: "foundry", age: 2, color: "brown", en: "Foundry", pt: "Fundição", n: [3, 4], fx: two("ore") },
      { id: "loom-2", age: 2, color: "gray", en: "Loom", pt: "Tear", n: [3, 5], fx: one("loom") },
      { id: "glassworks-2", age: 2, color: "gray", en: "Glassworks", pt: "Vidraria", n: [3, 5], fx: one("glass") },
      { id: "press-2", age: 2, color: "gray", en: "Press", pt: "Prensa", n: [3, 5], fx: one("papyrus") },
      { id: "aqueduct", age: 2, color: "blue", en: "Aqueduct", pt: "Aqueduto", n: [3, 7], fx: civ(5), from: ["baths"] },
      { id: "temple", age: 2, color: "blue", en: "Temple", pt: "Templo", n: [3, 6], fx: civ(3), from: ["altar"] },
      { id: "statue", age: 2, color: "blue", en: "Statue", pt: "Estátua", n: [3, 7], fx: civ(4), from: ["theater"] },
      { id: "courthouse", age: 2, color: "blue", en: "Courthouse", pt: "Tribunal", n: [3, 5], fx: civ(4), from: ["scriptorium"] },
      { id: "forum", age: 2, color: "yellow", en: "Forum", pt: "Fórum", n: [3, 6, 7], fx: t(`Each turn produces 1 ${res("glass")}, ${res("loom")} <em>or</em> ${res("papyrus")} of your choice. Neighbors cannot buy it.`, `Por turno produz 1 ${res("glass")}, ${res("loom")} <em>ou</em> ${res("papyrus")}, à sua escolha. Os vizinhos não podem comprá-lo.`), from: ["east-trading-post", "west-trading-post"] },
      { id: "caravansery", age: 2, color: "yellow", en: "Caravansery", pt: "Caravançará", n: [3, 5, 6], fx: t("Each turn produces 1 raw material of your choice (Wood, Stone, Clay or Ore). Neighbors cannot buy it.", "Por turno produz 1 matéria-prima à sua escolha (Madeira, Pedra, Argila ou Minério). Os vizinhos não podem comprá-la."), from: ["marketplace"] },
      { id: "vineyard", age: 2, color: "yellow", en: "Vineyard", pt: "Vinhedo", n: [3, 6], fx: t("Once, when built: 1 coin per brown card in your city <strong>and</strong> in both neighboring cities. Brown cards they build that same turn count.", "Uma vez, ao construir: 1 moeda por carta marrom na sua cidade <strong>e</strong> nas duas cidades vizinhas. Cartas marrons que eles construírem no mesmo turno contam.") },
      { id: "bazar", age: 2, color: "yellow", en: "Bazar", pt: "Bazar", n: [4, 7], fx: t("Once, when built: 2 coins per gray card in your city <strong>and</strong> in both neighboring cities. Gray cards they build that same turn count.", "Uma vez, ao construir: 2 moedas por carta cinza na sua cidade <strong>e</strong> nas duas cidades vizinhas. Cartas cinza que eles construírem no mesmo turno contam.") },
      { id: "walls", age: 2, color: "red", en: "Walls", pt: "Muralhas", n: [3, 7], fx: mil(2) },
      { id: "training-ground", age: 2, color: "red", en: "Training Ground", pt: "Campo de treino", n: [4, 6, 7], fx: mil(2) },
      { id: "stables", age: 2, color: "red", en: "Stables", pt: "Estábulos", n: [3, 5], fx: mil(2), from: ["apothecary"] },
      { id: "archery-range", age: 2, color: "red", en: "Archery Range", pt: "Campo de tiro com arco", n: [3, 6], fx: mil(2), from: ["workshop"] },
      { id: "dispensary", age: 2, color: "green", en: "Dispensary", pt: "Dispensário", n: [3, 4], fx: sci("compass"), from: ["apothecary"] },
      { id: "laboratory", age: 2, color: "green", en: "Laboratory", pt: "Laboratório", n: [3, 5], fx: sci("gear"), from: ["workshop"] },
      { id: "library", age: 2, color: "green", en: "Library", pt: "Biblioteca", n: [3, 6], fx: sci("tablet"), from: ["scriptorium"] },
      { id: "school", age: 2, color: "green", en: "School", pt: "Escola", n: [3, 7], fx: sci("tablet") },
      // Age III
      { id: "pantheon", age: 3, color: "blue", en: "Pantheon", pt: "Panteão", n: [3, 6], fx: civ(7), from: ["temple"] },
      { id: "gardens", age: 3, color: "blue", en: "Gardens", pt: "Jardins", n: [3, 4], fx: civ(5), from: ["statue"] },
      { id: "town-hall", age: 3, color: "blue", en: "Town Hall", pt: "Prefeitura", n: [3, 5, 6], fx: civ(6) },
      { id: "palace", age: 3, color: "blue", en: "Palace", pt: "Palácio", n: [3, 7], fx: civ(8) },
      { id: "senate", age: 3, color: "blue", en: "Senate", pt: "Senado", n: [3, 5], fx: civ(6), from: ["library"] },
      { id: "haven", age: 3, color: "yellow", en: "Haven", pt: "Porto", n: [3, 4], fx: t("When built: 1 coin per brown card in your city. End of game: 1 VP per brown card in your city.", "Ao construir: 1 moeda por carta marrom na sua cidade. Fim da partida: 1 PV por carta marrom na sua cidade."), from: ["forum"] },
      { id: "lighthouse", age: 3, color: "yellow", en: "Lighthouse", pt: "Farol", n: [3, 6], fx: `${t("When built: 1 coin per yellow card you had already built (not the Lighthouse itself). End of game: 1 VP per yellow card in your city (the Lighthouse included).", "Ao construir: 1 moeda por carta amarela que você já tinha construído (sem contar o próprio Farol). Fim da partida: 1 PV por carta amarela na sua cidade (o Farol incluído).")} ${interpretation("from the wording “previously played” for coins and “present in the city” for points.", "pelas palavras “jogadas antes” para as moedas e “presentes na cidade” para os pontos.")}`, from: ["caravansery"] },
      { id: "chamber-of-commerce", age: 3, color: "yellow", en: "Chamber of Commerce", pt: "Câmara de Comércio", n: [4, 6], fx: t("When built: 2 coins per gray card in your city. End of game: 2 VP per gray card in your city.", "Ao construir: 2 moedas por carta cinza na sua cidade. Fim da partida: 2 PV por carta cinza na sua cidade.") },
      { id: "arena", age: 3, color: "yellow", en: "Arena", pt: "Arena", n: [3, 5, 7], fx: t("When built: 3 coins per Wonder stage you have built (3, 6, 9 or 12). End of game: 1 VP per Wonder stage built (1–4).", "Ao construir: 3 moedas por estágio de Maravilha que você construiu (3, 6, 9 ou 12). Fim da partida: 1 PV por estágio construído (1–4)."), from: ["dispensary"] },
      { id: "fortifications", age: 3, color: "red", en: "Fortifications", pt: "Fortificações", n: [3, 7], fx: mil(3), from: ["walls"] },
      { id: "circus", age: 3, color: "red", en: "Circus", pt: "Circo", n: [4, 5, 6], fx: mil(3), from: ["training-ground"] },
      { id: "arsenal", age: 3, color: "red", en: "Arsenal", pt: "Arsenal", n: [3, 4, 7], fx: mil(3) },
      { id: "siege-workshop", age: 3, color: "red", en: "Siege Workshop", pt: "Oficina de cerco", n: [3, 5], fx: mil(3), from: ["laboratory"] },
      { id: "lodge", age: 3, color: "green", en: "Lodge", pt: "Loja", n: [3, 6], fx: sci("compass"), from: ["dispensary"] },
      { id: "observatory", age: 3, color: "green", en: "Observatory", pt: "Observatório", n: [3, 7], fx: sci("gear"), from: ["laboratory"] },
      { id: "university", age: 3, color: "green", en: "University", pt: "Universidade", n: [3, 4], fx: sci("tablet"), from: ["library"] },
      { id: "academy", age: 3, color: "green", en: "Academy", pt: "Academia", n: [3, 7], fx: sci("compass"), from: ["school"] },
      { id: "study", age: 3, color: "green", en: "Study", pt: "Gabinete de estudos", n: [3, 5], fx: sci("gear"), from: ["school"] },
      // Guilds: n + 2 of these 10 are drawn at random (p. 3); effects p. 12.
      { id: "workers-guild", age: 3, color: "purple", en: "Workers Guild", pt: "Guilda dos Trabalhadores", guild: true, fx: t("1 VP per brown card in the two neighboring cities.", "1 PV por carta marrom nas duas cidades vizinhas.") },
      { id: "craftsmens-guild", age: 3, color: "purple", en: "Craftsmens Guild", pt: "Guilda dos Artesãos", guild: true, fx: t("2 VP per gray card in the two neighboring cities.", "2 PV por carta cinza nas duas cidades vizinhas.") },
      { id: "traders-guild", age: 3, color: "purple", en: "Traders Guild", pt: "Guilda dos Comerciantes", guild: true, fx: t("1 VP per yellow card in the two neighboring cities.", "1 PV por carta amarela nas duas cidades vizinhas.") },
      { id: "philosophers-guild", age: 3, color: "purple", en: "Philosophers Guild", pt: "Guilda dos Filósofos", guild: true, fx: t("1 VP per green card in the two neighboring cities.", "1 PV por carta verde nas duas cidades vizinhas.") },
      { id: "spies-guild", age: 3, color: "purple", en: "Spies Guild", pt: "Guilda dos Espiões", guild: true, fx: t("1 VP per red card in the two neighboring cities.", "1 PV por carta vermelha nas duas cidades vizinhas.") },
      { id: "magistrates-guild", age: 3, color: "purple", en: "Magistrates Guild", pt: "Guilda dos Magistrados", guild: true, fx: t("1 VP per blue card in the two neighboring cities.", "1 PV por carta azul nas duas cidades vizinhas.") },
      { id: "strategists-guild", age: 3, color: "purple", en: "Strategists Guild", pt: "Guilda dos Estrategistas", guild: true, fx: t("1 VP per Defeat token in the two neighboring cities.", "1 PV por ficha de Derrota nas duas cidades vizinhas.") },
      { id: "shipowners-guild", age: 3, color: "purple", en: "Shipowners Guild", pt: "Guilda dos Armadores", guild: true, fx: t("1 VP per brown, gray and purple card in <strong>your own</strong> city (this Guild included).", "1 PV por carta marrom, cinza e roxa na <strong>sua</strong> cidade (esta Guilda incluída).") },
      { id: "builders-guild", age: 3, color: "purple", en: "Builders Guild", pt: "Guilda dos Construtores", guild: true, fx: t("1 VP per Wonder stage built in the two neighboring cities <strong>and</strong> in your own.", "1 PV por estágio de Maravilha construído nas duas cidades vizinhas <strong>e</strong> na sua.") },
      { id: "scientists-guild", age: 3, color: "purple", en: "Scientists Guild", pt: "Guilda dos Cientistas", guild: true, fx: t("One extra scientific symbol of your choice, chosen at the end of the game.", "Um símbolo científico extra à sua escolha, escolhido no fim da partida.") }
    ];
  }

  function cardName(card) {
    return state.language === "pt-BR" && card.pt !== card.en ? `${card.en} <span class="sw-gloss">(${card.pt})</span>` : card.en;
  }

  function copiesIn(card, count = deckCount()) {
    return (card.n || []).filter((mark) => mark <= count).length;
  }

  function inGame(card) {
    return card.guild || copiesIn(card) > 0;
  }

  // ---------- Wonders (rulebook pp. 8–9) ----------

  function wonderData() {
    return [
      {
        id: "rhodes", name: ["The Colossus of Rhodes", "O Colosso de Rodes"], start: "ore",
        a: t("Stage 2: add 2 Shields to your total in every conflict resolution.", "Estágio 2: some 2 Escudos ao seu total em toda resolução de conflito."),
        b: [
          t("2 stages only.", "Só 2 estágios."),
          t("Stage 1: 1 Shield, 3 coins and 3 VP.", "Estágio 1: 1 Escudo, 3 moedas e 3 PV."),
          t("Stage 2: 1 Shield, 4 coins and 4 VP.", "Estágio 2: 1 Escudo, 4 moedas e 4 PV."),
          interpretation("the coins are taken once, when the stage is built, as for every coin bonus.", "as moedas são pegas uma vez, ao construir o estágio, como todo bônus de moedas.")
        ]
      },
      {
        id: "alexandria", name: ["The Lighthouse of Alexandria", "O Farol de Alexandria"], start: "glass",
        a: t("Stage 2: every turn, 1 raw material of your choice (Stone, Clay, Wood or Ore). It cannot be sold to neighbors.", "Estágio 2: a cada turno, 1 matéria-prima à sua escolha (Pedra, Argila, Madeira ou Minério). Não pode ser vendida aos vizinhos."),
        b: [
          t("Stage 1: every turn, 1 raw material of your choice (Stone, Clay, Wood or Ore).", "Estágio 1: a cada turno, 1 matéria-prima à sua escolha (Pedra, Argila, Madeira ou Minério)."),
          t("Stage 2: every turn, 1 manufactured good of your choice (Glass, Textile or Papyrus).", "Estágio 2: a cada turno, 1 produto manufaturado à sua escolha (Vidro, Tecido ou Papiro)."),
          t("Stage 3: 7 VP.", "Estágio 3: 7 PV."),
          t("Neighbors cannot buy these chosen resources.", "Os vizinhos não podem comprar esses recursos escolhidos.")
        ]
      },
      {
        id: "ephesus", name: ["The Temple of Artemis in Ephesus", "O Templo de Ártemis em Éfeso"], start: "papyrus",
        a: t("Stage 2: take 9 coins from the bank, once, right after building it.", "Estágio 2: pegue 9 moedas do banco, uma vez, logo após construí-lo."),
        b: [
          t("Stage 1: 4 coins and 2 VP.", "Estágio 1: 4 moedas e 2 PV."),
          t("Stage 2: 4 coins and 3 VP.", "Estágio 2: 4 moedas e 3 PV."),
          t("Stage 3: 4 coins and 5 VP.", "Estágio 3: 4 moedas e 5 PV."),
          t("Each stage's coins are taken once, right after it is built.", "As moedas de cada estágio são pegas uma vez, logo após construí-lo.")
        ]
      },
      {
        id: "babylon", name: ["The Hanging Gardens of Babylon", "Os Jardins Suspensos da Babilônia"], start: "clay",
        a: t("Stage 2: one extra scientific symbol of your choice, chosen when scoring at the end of the game (not when built).", "Estágio 2: um símbolo científico extra à sua escolha, escolhido na contagem do fim da partida (não ao construir)."),
        b: [
          t("Stage 1: 3 VP.", "Estágio 1: 3 PV."),
          t("Stage 2: on the 6th turn of each Age you may play your 7th card instead of discarding it — build it (paying its cost), use it for a Wonder stage, or discard it for 3 coins. If you build this stage on a 6th turn, you can already play that turn's 7th card.", "Estágio 2: no 6º turno de cada Era você pode jogar sua 7ª carta em vez de descartá-la — construí-la (pagando o custo), usá-la num estágio da Maravilha ou descartá-la por 3 moedas. Se construir este estágio num 6º turno, já pode jogar a 7ª carta desse turno."),
          t("Stage 3: one extra scientific symbol of your choice, chosen at the end of the game.", "Estágio 3: um símbolo científico extra à sua escolha, escolhido no fim da partida.")
        ]
      },
      {
        id: "olympia", name: ["The Statue of Zeus in Olympia", "A Estátua de Zeus em Olímpia"], start: "wood",
        a: `${t("Stage 2: once per Age, build one structure of your choice for free. Tip: slide that stage's marker card above the board and tuck it back under once you have used the ability this Age.", "Estágio 2: uma vez por Era, construa de graça uma estrutura à sua escolha. Dica: puxe a carta-marcador desse estágio para cima do tabuleiro e devolva-a para baixo quando usar a habilidade nesta Era.")} ${interpretation("the free structure is the card you chose from your hand that turn, built ignoring its cost.", "a estrutura grátis é a carta que você escolheu da mão naquele turno, construída ignorando o custo.")}`,
        b: [
          t("Stage 1: buy raw materials (Stone, Clay, Wood, Ore) from both neighbors for 1 coin instead of 2. Same as both Trading Posts — not cumulative with them, but you may still build them.", "Estágio 1: compre matérias-primas (Pedra, Argila, Madeira, Minério) dos dois vizinhos por 1 moeda em vez de 2. Igual aos dois Entrepostos — não acumula com eles, mas você ainda pode construí-los."),
          t("Stage 2: 5 VP.", "Estágio 2: 5 PV."),
          t("Stage 3: at the end of the game, “copy” one Guild built by one of your neighbors: score it as if you had built it. The owner keeps their points.", "Estágio 3: no fim da partida, “copie” uma Guilda construída por um dos seus vizinhos: pontue como se a tivesse construído. O dono mantém os pontos dele.")
        ]
      },
      {
        id: "halicarnassus", name: ["The Mausoleum of Halicarnassus", "O Mausoléu de Halicarnasso"], start: "loom",
        a: t("Stage 2: at the end of the turn you build it, look through every card discarded since the start of the game (for coins and at the end of each Age, plus cards discarded this very turn), pick one and build it for free.", "Estágio 2: no fim do turno em que o construir, olhe todas as cartas descartadas desde o início da partida (por moedas e no fim de cada Era, mais as descartadas neste mesmo turno), escolha uma e construa-a de graça."),
        b: [
          t("Stage 1: 2 VP + build one discarded card for free.", "Estágio 1: 2 PV + construa de graça uma carta descartada."),
          t("Stage 2: 1 VP + build one discarded card for free.", "Estágio 2: 1 PV + construa de graça uma carta descartada."),
          t("Stage 3: build one discarded card for free.", "Estágio 3: construa de graça uma carta descartada."),
          t("Each time at the end of the turn the stage is built; cards discarded that same turn may be chosen.", "Sempre no fim do turno em que o estágio é construído; cartas descartadas nesse mesmo turno podem ser escolhidas.")
        ]
      },
      {
        id: "giza", name: ["The Pyramids of Giza", "As Pirâmides de Gizé"], start: "stone",
        a: t("No special ability: stage 2 is worth 5 VP.", "Sem habilidade especial: o estágio 2 vale 5 PV."),
        b: [
          t("4 stages worth 3, 5, 5 and 7 VP — 20 VP in all.", "4 estágios que valem 3, 5, 5 e 7 PV — 20 PV no total.")
        ]
      }
    ];
  }

  // ---------- Leaders Anniversary Pack (leaflet pp. 1–4) ----------

  function leaderData() {
    return [
      { id: "aganice", name: "Aganice", page: "L2", when: "end", text: t("At the end of the game, change one of your scientific symbols into another scientific symbol of your choice. The changed symbol may come from a green, black or white card, or from a Wonder.", "No fim da partida, troque um dos seus símbolos científicos por outro símbolo científico à sua escolha. O símbolo trocado pode vir de uma carta verde, preta ou branca, ou de uma Maravilha.") },
      { id: "enheduanna", name: "Enheduanna", page: "L2", when: "end", text: t("At the end of the game, gain one extra scientific symbol identical to the symbol you have the most of.", "No fim da partida, ganhe um símbolo científico extra igual ao símbolo que você tem em maior quantidade.") },
      { id: "arsinoe", name: "Arsinoe", page: "L2", when: "now", text: t("When she enters play: you take 4 coins, and each other player loses coins equal to the current Age (1, 2 or 3).", "Ao entrar em jogo: você pega 4 moedas, e cada outro jogador perde moedas iguais à Era atual (1, 2 ou 3).") },
      { id: "octavia", name: "Octavia", page: "L2", when: "ongoing", text: t("Once in play, each time you build a Wonder stage you take 2 coins and each other player loses 1 coin.", "Uma vez em jogo, cada vez que você constrói um estágio de Maravilha, pega 2 moedas e cada outro jogador perde 1 moeda.") },
      { id: "roxana", name: "Roxana", page: "L3", when: "ongoing", text: t("Once in play, you take 2 coins each time one of your two neighboring cities builds a Wonder stage.", "Uma vez em jogo, você pega 2 moedas cada vez que uma das duas cidades vizinhas constrói um estágio de Maravilha.") },
      { id: "cynisca", name: "Cynisca", page: "L3", when: "end", text: t("At the end of the game: 6 VP if you have no Military Defeat tokens.", "No fim da partida: 6 PV se você não tiver nenhuma ficha de Derrota militar.") },
      { id: "nitocris", name: "Nitocris", page: "L3", when: "now", text: t("When she enters play: take a Military Victory token of the current Age (+1 in Age I, +3 in Age II, +5 in Age III).", "Ao entrar em jogo: pegue uma ficha de Vitória militar da Era atual (+1 na Era I, +3 na Era II, +5 na Era III).") },
      { id: "gorgo", name: "Gorgo", page: "L3", when: "end", text: t("At the end of the game: for each pair of identical Military Victory tokens you own, VP equal to the value of one token of that pair.", "No fim da partida: para cada par de fichas de Vitória militar idênticas que você tem, PV iguais ao valor de uma ficha desse par.") },
      { id: "telesilla", name: "Telesilla", page: "L3", when: "now", text: t("When she enters play: discard all your Military Defeat tokens, and each other player discards one Military Victory token of their choice. If a card gives you a Victory token on the same turn, take it before others discard.", "Ao entrar em jogo: descarte todas as suas fichas de Derrota militar, e cada outro jogador descarta uma ficha de Vitória militar à escolha dele. Se uma carta lhe der uma ficha de Vitória no mesmo turno, pegue-a antes de os outros descartarem.") },
      { id: "agrippina", name: "Agrippina", page: "L4", when: "end", text: t("At the end of the game: 7 VP if she is your only face-up Leader.", "No fim da partida: 7 PV se ela for o seu único Líder virado para cima.") },
      { id: "makeda", name: "Makeda", page: "L4", when: "end", text: t("At the end of the game: 5 VP if your treasury has more coins than each of your two neighbors (compared separately).", "No fim da partida: 5 PV se o seu tesouro tiver mais moedas que cada um dos dois vizinhos (comparados separadamente).") },
      { id: "phryne", name: "Phryne", page: "L4", when: "end", color: "blue", text: t("At the end of the game: 5 VP if you have more blue cards than each of your two neighbors (compared separately).", "No fim da partida: 5 PV se você tiver mais cartas azuis que cada um dos dois vizinhos (comparados separadamente).") },
      { id: "eurypyle", name: "Eurypyle", page: "L4", when: "end", color: "red", text: t("At the end of the game: 5 VP if you have more red cards than each of your two neighbors (compared separately).", "No fim da partida: 5 PV se você tiver mais cartas vermelhas que cada um dos dois vizinhos (comparados separadamente).") },
      { id: "cornelia", name: "Cornelia", page: "L4", when: "end", color: "yellow", text: t("At the end of the game: 5 VP if you have more yellow cards than each of your two neighbors (compared separately).", "No fim da partida: 5 PV se você tiver mais cartas amarelas que cada um dos dois vizinhos (comparados separadamente).") },
      { id: "theano", name: "Theano", page: "L4", when: "end", color: "green", text: t("At the end of the game: 5 VP if you have more green cards than each of your two neighbors (compared separately).", "No fim da partida: 5 PV se você tiver mais cartas verdes que cada um dos dois vizinhos (comparados separadamente).") }
    ];
  }

  // ---------- header ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["turn", t("An Age, turn by turn", "Uma Era, turno a turno")],
      ["building", t("Building & commerce", "Construção e comércio")],
      ["military", t("Military & end of an Age", "Militar e fim de Era")],
      ["scoring", t("End of game & scoring", "Fim e pontuação")],
      ["wonders", t("The seven Wonders", "As sete Maravilhas")],
      twoPlayer() ? ["two-player", t("2 players: the Free City", "2 jogadores: a Cidade Livre")] : null,
      leaders() ? ["leaders", t("Leaders Anniversary Pack", "Leaders Anniversary Pack")] : null,
      ["cards", t("Card list & chains", "Lista de cartas e encadeamentos")],
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
          <span class="brand-mark" aria-hidden="true">7W</span>
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
      `${readFailed ? "This browser could not read the saved 7 Wonders match or setup progress; defaults are shown. " : ""}${writeFailed ? "The latest change could not be saved and is visible on screen only." : ""}`,
      `${readFailed ? "Este navegador não conseguiu ler a partida ou o progresso de 7 Wonders salvos; as opções padrão estão sendo mostradas. " : ""}${writeFailed ? "A alteração mais recente não pôde ser salva e aparece somente na tela." : ""}`
    ).trim();
  }

  // ---------- configuration ----------

  function choiceCard(name, value, dataAttr, checked, title, description) {
    return `
      <label class="sw-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" ${dataAttr} ${checked ? "checked" : ""}>
        <span class="sw-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function group(legend, selected, intro, cards, columns = "") {
    return `
      <fieldset class="sw-choice-group">
        <legend>${legend} <span>${selected}</span></legend>
        <p class="sw-choice-intro">${intro}</p>
        <div class="sw-choice-grid ${columns}">${cards}</div>
      </fieldset>`;
  }

  function playerChoiceText(count) {
    const n = Number(count);
    if (n === 2) {
      return t(
        "“Expert” variant: the two of you also take turns playing for a neutral third city, the Free City. Uses the 3-player cards (21 per Age), 5 Guilds, 3 Wonder boards and the 2 special cards (Border card and Free City card). Recommended only after a few games with 3–7.",
        "Variante “Expert”: vocês dois também se revezam jogando por uma terceira cidade neutra, a Cidade Livre. Usa as cartas de 3 jogadores (21 por Era), 5 Guildas, 3 tabuleiros de Maravilha e as 2 cartas especiais (carta de Fronteira e carta da Cidade Livre). Recomendada só depois de algumas partidas com 3–7."
      );
    }
    return t(
      `${n === 3 ? "Only cards marked 3+ are used" : `Cards marked 3+ up to ${n}+ are used`}: ${7 * n} cards per Age (7 per player), ${n + 2} of the 10 Guilds, ${n} Wonder boards.`,
      `${n === 3 ? "Só são usadas as cartas marcadas 3+" : `São usadas as cartas marcadas de 3+ até ${n}+`}: ${7 * n} cartas por Era (7 por jogador), ${n + 2} das 10 Guildas, ${n} tabuleiros de Maravilha.`
    );
  }

  function wonderSelected() {
    return {
      card: t("random board, side from the card", "tabuleiro sorteado, lado pela carta"),
      "side-a": t("random board, side A", "tabuleiro sorteado, lado A"),
      chosen: t("chosen by agreement", "escolhidos em comum acordo")
    }[state.wonders];
  }

  function matchConfiguration() {
    const leaderWarning = leaders()
      ? `<p class="sw-choice-note" role="note">${t(
        "Incomplete without your Leaders rulebook: the supplied Leaders PDF is only the Anniversary Pack leaflet. It adds 15 Leaders and the age-based cost, but how Leaders are dealt, chosen and recruited — and any other Leaders setup — comes from the Leaders expansion's own rulebook, which this guide does not have. Keep it at hand.",
        "Incompleta sem o seu manual de Leaders: o PDF de Leaders fornecido é só o folheto do Anniversary Pack. Ele acrescenta 15 Líderes e o custo por Era, mas como os Líderes são distribuídos, escolhidos e recrutados — e qualquer outra preparação de Leaders — vem do manual próprio da expansão Leaders, que este guia não tem. Deixe-o à mão."
      )}${twoPlayer() ? ` ${t("The leaflet says nothing about Leaders with 2 players and the Free City either.", "O folheto também não diz nada sobre Líderes com 2 jogadores e a Cidade Livre.")}` : ""}</p>`
      : "";
    return `
      <section class="controls-panel sw-config" id="build-match" aria-labelledby="sw-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="sw-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "The player count decides which cards and how many Guilds go into the three Age decks — and 2 players switch to the Free City variant. The Wonder choice and the optional Leaders Anniversary Pack change the preparation too. Everything below is filtered to this match and saved on this device only.",
              "O número de jogadores define quais cartas e quantas Guildas entram nos três baralhos de Era — e 2 jogadores passam para a variante da Cidade Livre. A escolha das Maravilhas e o Leaders Anniversary Pack opcional também mudam a preparação. Tudo abaixo é filtrado para esta partida e salvo só neste aparelho."
            )}</p>
          </div>
        </div>
        ${group(t("Players · selected:", "Jogadores · selecionado:"), `${playersLabel()}${twoPlayer() ? t(" · Free City variant", " · variante da Cidade Livre") : ""}`,
          `${t("3–7 players use the standard rules; 2 players use the “Expert” variant.", "3–7 jogadores usam as regras padrão; 2 jogadores usam a variante “Expert”.")} ${referenceLink(3)} ${referenceLink(7)}`,
          PLAYER_COUNTS.map((count) => choiceCard("sw-players", count, `data-players="${count}"`, state.players === count, playersLabel(count), playerChoiceText(count))).join(""), "sw-three")}
        ${group(t("Wonders · selected:", "Maravilhas · selecionado:"), wonderSelected(),
          `${t("Each Wonder board is double-sided (A and B). Both sides are balanced and can be mixed in the same game.", "Cada tabuleiro de Maravilha tem dois lados (A e B). Os dois lados são equilibrados e podem se misturar na mesma partida.")} ${referenceLink(3)} ${referenceLink(9)}`,
          [
            choiceCard("sw-wonders", "card", 'data-wonders="card"', state.wonders === "card", t("Random — the Wonder card decides board and side (standard)", "Sorteio — a carta de Maravilha decide tabuleiro e lado (padrão)"), t("Shuffle the 7 Wonder cards face down and deal one to each player: the card and the way it faces give your board and whether you play side A or side B.", "Embaralhe as 7 cartas de Maravilha viradas para baixo e dê uma a cada jogador: a carta e a posição em que ela vem dizem seu tabuleiro e se você joga o lado A ou o lado B.")),
            choiceCard("sw-wonders", "side-a", 'data-wonders="side-a"', sideAOnly(), t("Random board, everyone on side A (first games)", "Tabuleiro sorteado, todos no lado A (primeiras partidas)"), t("Deal the Wonder cards for the boards only and play side A, which the rulebook recommends for your first few games because it is simpler. The guide then shows only side A.", "Distribua as cartas de Maravilha só para os tabuleiros e jogue o lado A, que o manual recomenda nas primeiras partidas por ser mais simples. O guia então mostra só o lado A.")),
            choiceCard("sw-wonders", "chosen", 'data-wonders="chosen"', state.wonders === "chosen", t("Chosen by agreement", "Escolhidos em comum acordo"), t("If all players agree, choose the Wonder boards instead of dealing them at random. Agree on the sides too.", "Se todos concordarem, escolham os tabuleiros de Maravilha em vez de sorteá-los. Combinem também os lados."))
          ].join(""), "sw-three")}
        ${group(t("Revealing actions · selected:", "Revelar ações · selecionado:"), oneByOne() ? t("one player at a time (first game)", "um jogador por vez (primeira partida)") : t("everyone at once (standard)", "todos ao mesmo tempo (padrão)"),
          `${t("A rulebook tip for your first game. It changes no preparation, so switching it keeps your setup checklist.", "Uma dica do manual para a primeira partida. Não muda a preparação, então trocá-la mantém a lista de preparação.")} ${referenceLink(5)}`,
          [
            choiceCard("sw-reveal", "together", 'data-reveal="together"', !oneByOne(), t("Everyone at once — standard", "Todos ao mesmo tempo — padrão"), t("Once everyone has picked a card, all players perform their actions simultaneously.", "Quando todos escolheram uma carta, todos executam a ação ao mesmo tempo.")),
            choiceCard("sw-reveal", "one-by-one", 'data-reveal="one-by-one"', oneByOne(), t("One player after another — learning game", "Um jogador depois do outro — partida de aprendizado"), t("Everyone still picks a card in secret first; then the players resolve their actions one after the other so the table can follow each one. The rules do not change.", "Todos ainda escolhem uma carta em segredo antes; depois os jogadores resolvem as ações um após o outro para a mesa acompanhar cada uma. As regras não mudam."))
          ].join(""), "sw-two")}
        ${group(t("Leaders Anniversary Pack · selected:", "Leaders Anniversary Pack · selecionado:"), leaders() ? t("added (needs your Leaders rulebook)", "incluído (precisa do seu manual de Leaders)") : t("not used", "não usado"),
          `${t("Optional. The Anniversary Pack is an add-on for the Leaders expansion: it is not playable with the base game alone.", "Opcional. O Anniversary Pack é um complemento da expansão Leaders: não dá para jogá-lo só com o jogo base.")} ${referenceLink("L1")}`,
          [
            choiceCard("sw-leaders", "no", 'data-leaders="no"', !leaders(), t("Base game only", "Só o jogo base"), t("No Leaders. Every rule in this guide comes from the base rulebook.", "Sem Líderes. Toda regra deste guia vem do manual base.")),
            choiceCard("sw-leaders", "yes", 'data-leaders="yes"', leaders(), t("With Leaders + the Anniversary Pack", "Com Leaders + o Anniversary Pack"), t("You own the Leaders expansion and play it with its rulebook. The guide adds the leaflet's 15 new Leaders (marked with a candle-topped 7), the age-based coin cost, a setup step and their scoring interactions. The Leaders rulebook itself is not supplied, so its own rules are not repeated here.", "Você tem a expansão Leaders e a joga com o manual dela. O guia acrescenta os 15 novos Líderes do folheto (marcados com um 7 com vela), o custo em moedas por Era, uma etapa de preparação e as interações de pontuação. O manual de Leaders não foi fornecido, então as regras próprias dele não estão aqui."))
          ].join(""), "sw-two")}
        ${leaderWarning}
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function wonderSetupItems(boards) {
    const items = [];
    if (state.wonders === "chosen") {
      items.push(t(`By agreement, choose ${boards} Wonder boards and the side (A or B) each will use.`, `Em comum acordo, escolham ${boards} tabuleiros de Maravilha e o lado (A ou B) que cada um vai usar.`));
      items.push(interpretation("the rulebook only says the boards may be chosen; agree on the sides as well (side A is the simpler one).", "o manual só diz que os tabuleiros podem ser escolhidos; combinem também os lados (o lado A é o mais simples)."));
    } else {
      items.push(t("Shuffle the 7 Wonder cards face down.", "Embaralhe as 7 cartas de Maravilha viradas para baixo."));
      items.push(twoPlayer()
        ? `${t("Deal one to each player and a third one for the Free City.", "Dê uma a cada jogador e uma terceira para a Cidade Livre.")} ${interpretation("the rulebook only says a third board is placed beside you; assigning it with a third Wonder card keeps it random.", "o manual só diz que um terceiro tabuleiro é colocado ao lado de vocês; sorteá-lo com uma terceira carta de Maravilha o mantém aleatório.")}`
        : t("Deal one to each player.", "Dê uma a cada jogador."));
      if (sideAOnly()) {
        items.push(t("Each card names the Wonder board you take. Everyone plays side A.", "Cada carta indica o tabuleiro de Maravilha que você pega. Todos jogam o lado A."));
      } else {
        items.push(t("Each card names your Wonder board, and the way it faces tells your side.", "Cada carta indica seu tabuleiro de Maravilha, e a posição em que ela vem diz o seu lado."));
        items.push(interpretation("the Wonder card pictured on p. 3 shows a large “B” in one corner and an upside-down “A” in the other: turn your card face up without rotating it and play the side whose letter reads the right way up.", "a carta de Maravilha da p. 3 mostra um “B” grande num canto e um “A” de cabeça para baixo no outro: vire sua carta para cima sem girá-la e jogue o lado cuja letra está na posição correta de leitura."));
      }
    }
    items.push(t(`Place your board in front of you on that side. ${boards < 7 ? `Return the other ${7 - boards} board${7 - boards === 1 ? "" : "s"} and the Wonder cards to the box.` : "Return the Wonder cards to the box (all 7 boards are in use)."}`, `Coloque seu tabuleiro à sua frente nesse lado. ${boards < 7 ? `Devolva à caixa ${7 - boards === 1 ? "o outro tabuleiro" : `os outros ${7 - boards} tabuleiros`} e as cartas de Maravilha.` : "Devolva à caixa as cartas de Maravilha (os 7 tabuleiros estão em uso)."}`));
    items.push(t("Your board's upper-left corner shows the resource your city produces from the start of the game.", "O canto superior esquerdo do tabuleiro mostra o recurso que sua cidade produz desde o início da partida."));
    return items;
  }

  function setupPhases() {
    const n = players();
    const d = deckCount();
    const perAge = 7 * d;
    const nonGuild = perAge - guildCount();
    const phases = [
      {
        id: "decks",
        title: t("Sort the three Age decks", "Separe os três baralhos de Era"),
        pages: twoPlayer() ? [3, 7] : [3],
        items: [
          t("Sort the cards into the Age I, Age II and Age III decks (the Age is printed on the back).", "Separe as cartas nos baralhos da Era I, Era II e Era III (a Era está impressa no verso)."),
          twoPlayer()
            ? t("2 players use the 3-player configuration: in each deck keep only the cards marked 3+ (lower centre of the card) and return every 4+, 5+, 6+ and 7+ card to the box.", "2 jogadores usam a configuração de 3 jogadores: em cada baralho mantenha só as cartas marcadas 3+ (centro inferior da carta) e devolva à caixa toda carta 4+, 5+, 6+ e 7+.")
            : t(`Each card shows a player count at the lower centre. Keep ${n === 3 ? "only the cards marked 3+" : `the cards marked 3+ up to ${n}+`} and return the others${n < 7 ? ` (${Array.from({ length: 7 - n }, (_, i) => `${n + i + 1}+`).join(", ")})` : ""} to the box.`, `Cada carta mostra um número de jogadores no centro inferior. Mantenha ${n === 3 ? "só as cartas marcadas 3+" : `as cartas marcadas de 3+ até ${n}+`} e devolva as outras${n < 7 ? ` (${Array.from({ length: 7 - n }, (_, i) => `${n + i + 1}+`).join(", ")})` : ""} à caixa.`),
          t(`Age III: first take out the 10 purple Guilds and keep them apart. Of the other Age III cards keep the same player counts (${nonGuild} cards).`, `Era III: primeiro tire as 10 Guildas roxas e deixe-as à parte. Das outras cartas da Era III mantenha as mesmas marcas de jogadores (${nonGuild} cartas).`),
          t(`Check: Age I and Age II now have ${perAge} cards each.`, `Confira: a Era I e a Era II agora têm ${perAge} cartas cada.`)
        ]
      },
      {
        id: "guilds",
        title: t(`Add ${guildCount()} random Guilds to Age III`, `Acrescente ${guildCount()} Guildas sorteadas à Era III`),
        pages: twoPlayer() ? [3, 7] : [3],
        items: [
          t("Shuffle the 10 Guilds face down.", "Embaralhe as 10 Guildas viradas para baixo."),
          twoPlayer()
            ? `${t("Keep 5 of them at random, without looking, as in the 3-player configuration.", "Mantenha 5 delas ao acaso, sem olhar, como na configuração de 3 jogadores.")} ${interpretation("the rulebook's “players + 2” would give 4, but the 2-player variant uses the 3-player cards and needs 21 cards per Age (7 + 7 + 7).", "a regra “jogadores + 2” daria 4, mas a variante de 2 jogadores usa as cartas de 3 e precisa de 21 cartas por Era (7 + 7 + 7).")}`
            : t(`Keep ${n + 2} of them at random and secretly (players + 2), without looking.`, `Mantenha ${n + 2} delas ao acaso e em segredo (jogadores + 2), sem olhar.`),
          10 - guildCount() === 1
            ? t("Return the last Guild to the box unseen.", "Devolva a Guilda que sobrou à caixa sem olhar.")
            : t(`Return the other ${10 - guildCount()} Guilds to the box unseen.`, `Devolva as outras ${10 - guildCount()} Guildas à caixa sem olhar.`),
          t(`Shuffle the kept Guilds into the Age III deck: it now has ${perAge} cards, like the other two.`, `Embaralhe as Guildas mantidas no baralho da Era III: ele agora tem ${perAge} cartas, como os outros dois.`)
        ]
      },
      {
        id: "wonders",
        title: twoPlayer() ? t("Wonder boards: yours and the Free City's", "Tabuleiros de Maravilha: os seus e o da Cidade Livre") : t("Wonder boards", "Tabuleiros de Maravilha"),
        pages: twoPlayer() ? [3, 7] : [3],
        items: [
          ...wonderSetupItems(twoPlayer() ? 3 : n),
          twoPlayer() ? t("Place the third board beside you: it is the Free City. Sit so the three cities form a circle — each city's two neighbors are the other two.", "Ponha o terceiro tabuleiro ao lado de vocês: é a Cidade Livre. Sentem-se de modo que as três cidades formem um círculo — os dois vizinhos de cada cidade são as outras duas.") : null
        ]
      },
      {
        id: "money",
        title: t("Coins and Conflict tokens", "Moedas e fichas de Conflito"),
        pages: twoPlayer() ? [3, 7] : [3],
        items: [
          twoPlayer()
            ? t("Each player and the Free City take 3 value-1 coins and place them on their board (the treasury).", "Cada jogador e a Cidade Livre pegam 3 moedas de valor 1 e as colocam no tabuleiro (o tesouro).")
            : t("Each player takes 3 value-1 coins and places them on their board (the treasury).", "Cada jogador pega 3 moedas de valor 1 e as coloca no tabuleiro (o tesouro)."),
          t("The other coins (30 value-1 and 20 value-3 in the box) form the bank. Make change between 3s and 1s whenever needed.", "As outras moedas (30 de valor 1 e 20 de valor 3 na caixa) formam o banco. Troque 3s por 1s sempre que precisar."),
          t("Put the 42 Conflict tokens next to the bank as a reserve: −1 Defeat tokens, and Victory tokens worth +1 (Age I), +3 (Age II) and +5 (Age III).", "Ponha as 42 fichas de Conflito ao lado do banco como reserva: fichas de Derrota −1 e fichas de Vitória de +1 (Era I), +3 (Era II) e +5 (Era III)."),
          t("Keep the score booklet and a pen nearby for the final count.", "Deixe o bloco de pontuação e uma caneta por perto para a contagem final.")
        ]
      }
    ];
    if (leaders()) {
      phases.push({
        id: "leaders",
        title: t("Leaders and the Anniversary Pack", "Leaders e o Anniversary Pack"),
        pages: ["L1"],
        items: [
          t("Add the Anniversary Pack's new Leader cards to the Leader cards you already have. Every card of the pack has a 7 topped by a candle at the bottom centre, so you can sort them out again after the game.", "Acrescente as novas cartas de Líder do Anniversary Pack às cartas de Líder que você já tem. Toda carta do pack tem um 7 com uma vela no centro inferior, para separá-las de novo depois da partida."),
          `${t("The leaflet warns that some of its cards can only be used with the Cities expansion, without naming them.", "O folheto avisa que algumas cartas só podem ser usadas com a expansão Cities, sem dizer quais.")} ${interpretation("none of the 15 Leaders it describes needs Cities components; if your pack holds a card not listed in this guide, check it before mixing it in.", "nenhum dos 15 Líderes descritos precisa de componentes de Cities; se o seu pack tiver uma carta que não está neste guia, confira-a antes de misturá-la.")}`,
          t("Then prepare the Leaders as your Leaders expansion rulebook says (it is not supplied, so this checklist cannot list those steps). Do that before dealing Age I.", "Depois prepare os Líderes como diz o manual da expansão Leaders (ele não foi fornecido, então esta lista não pode trazer esses passos). Faça isso antes de distribuir a Era I."),
          t("If your Leaders rulebook changes an earlier step of this checklist (for example the starting coins), its rule wins: adjust that step now.", "Se o seu manual de Leaders mudar uma etapa anterior desta lista (por exemplo as moedas iniciais), vale a regra dele: ajuste essa etapa agora.")
        ]
      });
    }
    phases.push(twoPlayer()
      ? {
        id: "start",
        title: t("Deal Age I and place the Free City cards", "Distribua a Era I e posicione as cartas da Cidade Livre"),
        pages: [5, 7],
        items: [
          t("Put the Border card on the table between the two players.", "Coloque a carta de Fronteira na mesa entre os dois jogadores."),
          t("Shuffle the Age I deck and deal 7 cards face down to each player. Keep the Age II and III decks aside face down.", "Embaralhe o baralho da Era I e dê 7 cartas viradas para baixo a cada jogador. Deixe os baralhos das Eras II e III de lado, virados para baixo."),
          t("The remaining 7 cards form the Free City's draw pile: face down, to the right of the Border card.", "As 7 cartas restantes formam a pilha de compra da Cidade Livre: viradas para baixo, à direita da carta de Fronteira."),
          t("The player seated to the Free City's left — the one who has the Free City on their right-hand side — adds the Free City card to their hand.", "O jogador sentado à esquerda da Cidade Livre — aquele que tem a Cidade Livre do seu lado direito — põe a carta da Cidade Livre na mão."),
          t("Age I begins: read “2 players: the Free City” below for how each turn works.", "A Era I começa: leia “2 jogadores: a Cidade Livre” abaixo para ver como cada turno funciona.")
        ]
      }
      : {
        id: "start",
        title: t("Deal Age I", "Distribua a Era I"),
        pages: [5],
        items: [
          t(`Shuffle the Age I deck and deal 7 cards face down to each player — the whole deck (${7 * n} cards).`, `Embaralhe o baralho da Era I e dê 7 cartas viradas para baixo a cada jogador — o baralho inteiro (${7 * n} cartas).`),
          t("Keep the Age II and Age III decks aside, face down.", "Deixe os baralhos das Eras II e III de lado, virados para baixo."),
          t("Hands are secret. Age I begins: everyone chooses a card at the same time — there is no first player.", "As mãos são secretas. A Era I começa: todos escolhem uma carta ao mesmo tempo — não há primeiro jogador.")
        ]
      });
    return phases;
  }

  function inventory() {
    const d = deckCount();
    const boards = twoPlayer() ? 3 : players();
    const cards = [
      infoCard(t(`AGE DECKS · ${7 * d} CARDS EACH`, `BARALHOS DE ERA · ${7 * d} CARTAS CADA`), t("Cards in this match", "Cartas nesta partida"), [
        rl("Age I", `${7 * d} cards (${d === 3 ? "3+ only" : `3+ to ${d}+`}). Box: 49.`, "Era I", `${7 * d} cartas (${d === 3 ? "só 3+" : `3+ a ${d}+`}). Caixa: 49.`),
        rl("Age II", `${7 * d} cards. Box: 49.`, "Era II", `${7 * d} cartas. Caixa: 49.`),
        rl("Age III", `${7 * d - guildCount()} cards + ${guildCount()} random Guilds. Box: 40 + 10 Guilds.`, "Era III", `${7 * d - guildCount()} cartas + ${guildCount()} Guildas sorteadas. Caixa: 40 + 10 Guildas.`),
        t(`Back in the box: ${49 - 7 * d} Age I, ${49 - 7 * d} Age II and ${50 - 7 * d} Age III cards (Guilds included).`, `Na caixa: ${49 - 7 * d} cartas da Era I, ${49 - 7 * d} da Era II e ${50 - 7 * d} da Era III (Guildas incluídas).`)
      ], [2, 3]),
      infoCard(twoPlayer() ? t("PER CITY · ×3", "POR CIDADE · ×3") : t(`PER PLAYER · ×${players()}`, `POR JOGADOR · ×${players()}`), twoPlayer() ? t("Each player and the Free City", "Cada jogador e a Cidade Livre") : t("In front of each player", "À frente de cada jogador"), [
        sideAOnly() ? t("1 Wonder board, side A.", "1 tabuleiro de Maravilha, lado A.") : t("1 Wonder board (side A or B).", "1 tabuleiro de Maravilha (lado A ou B)."),
        t("3 coins (value 1) on the board.", "3 moedas (valor 1) no tabuleiro."),
        twoPlayer() ? t("Players: a hand of 7 cards. The Free City: its 7-card draw pile instead.", "Jogadores: uma mão de 7 cartas. A Cidade Livre: sua pilha de compra de 7 cartas.") : t("A hand of 7 Age I cards.", "Uma mão de 7 cartas da Era I."),
        boards < 7 ? t(`Back in the box: ${7 - boards} board${7 - boards === 1 ? "" : "s"} and the 7 Wonder cards.`, `Na caixa: ${7 - boards} tabuleiro${7 - boards === 1 ? "" : "s"} e as 7 cartas de Maravilha.`) : t("Back in the box: the 7 Wonder cards (all boards in use).", "Na caixa: as 7 cartas de Maravilha (todos os tabuleiros em uso).")
      ], [2, 3]),
      infoCard(t("SHARED", "COMPARTILHADO"), t("Middle of the table", "Meio da mesa"), [
        t("Bank: every coin not in a treasury (value 1 and value 3).", "Banco: toda moeda fora de um tesouro (valor 1 e valor 3)."),
        t("Conflict token reserve (42 tokens).", "Reserva de fichas de Conflito (42 fichas)."),
        t("Discard pile: starts empty; discarded cards go here face down.", "Pilha de descarte: começa vazia; cartas descartadas vão para cá viradas para baixo."),
        twoPlayer() ? t("Border card between the players, the Free City's draw pile to its right, and the Free City card in one player's hand.", "Carta de Fronteira entre os jogadores, a pilha de compra da Cidade Livre à direita dela e a carta da Cidade Livre na mão de um jogador.") : t("The 2 “2 player” cards stay in the box.", "As 2 cartas “2 jogadores” ficam na caixa."),
        t("Score booklet.", "Bloco de pontuação.")
      ], twoPlayer() ? [2, 7] : [2, 3]),
      leaders() ? infoCard(t("LEADERS", "LEADERS"), t("From your expansions", "Das suas expansões"), [
        t("Your Leaders expansion components, as its rulebook says.", "Os componentes da sua expansão Leaders, como diz o manual dela."),
        t("The Anniversary Pack's 15 new Leaders, shuffled into the Leader cards.", "Os 15 novos Líderes do Anniversary Pack, embaralhados nas cartas de Líder.")
      ], ["L1"]) : ""
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
        <label class="sw-setup-check" for="sw-setup-${phase.id}">
          <input id="sw-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="sw-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="sw-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), sectionIndex("setup"), twoPlayer() ? [3, 7] : [3])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Set up this match", "Prepare esta partida")} · ${playersLabel()}</h3>
            <p>${t("One checkbox per coherent step; tick it when all its substeps are done.", "Uma caixa por etapa coerente; marque quando todos os subpassos estiverem feitos.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved separately from the match configuration and language. Changing the player count, the Wonder choice or the Leaders option clears this checklist; changing the language or the action-reveal habit does not. “Uncheck all” clears only these setup boxes.",
          "O progresso é salvo separadamente da configuração da partida e do idioma. Trocar o número de jogadores, a escolha das Maravilhas ou a opção de Leaders limpa esta lista; trocar o idioma ou o modo de revelar ações não. “Desmarcar tudo” limpa somente as caixas da preparação."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}
      <h3 class="subhead">${t("Where your cards go", "Onde ficam as suas cartas")}</h3>
      <div class="quick-grid">
        ${infoCard(t("CARD PLACEMENT", "POSIÇÃO DAS CARTAS"), t("Your city", "Sua cidade"), [
          rl("Brown and gray cards", "stack them one below the other from the upper-left corner of your board, so everyone sees what you produce.", "Cartas marrons e cinza", "empilhe-as uma abaixo da outra a partir do canto superior esquerdo do tabuleiro, para todos verem o que você produz."),
          rl("Other cards", "face up in front of your board, stacked by colour with each name visible. All of this is your city.", "Outras cartas", "viradas para cima à frente do tabuleiro, empilhadas por cor com cada nome visível. Tudo isso é a sua cidade."),
          rl("Wonder stages", "the card used is tucked face down, half under the board, at that stage.", "Estágios da Maravilha", "a carta usada fica virada para baixo, meio escondida sob o tabuleiro, naquele estágio."),
          rl("Conflict tokens", "on your board — the rulebook's example puts the token won or lost against each neighbor on that neighbor's side.", "Fichas de Conflito", "no seu tabuleiro — o exemplo do manual coloca a ficha ganha ou perdida contra cada vizinho do lado desse vizinho.")
        ], [5])}
      </div>`;
  }

  // ---------- quick reference ----------

  function quickReference() {
    const cards = [
      infoCard(t("EACH TURN", "CADA TURNO"), t("Choose · Act · Pass", "Escolher · Agir · Passar"), [
        rl("1 · Choose", "pick 1 card from your hand and put it face down in front of you.", "1 · Escolher", "pegue 1 carta da mão e ponha-a virada para baixo à sua frente."),
        oneByOne()
          ? rl("2 · Act (learning game)", "players reveal and resolve one after another: build the structure, build a Wonder stage with it, or discard it for 3 coins.", "2 · Agir (partida de aprendizado)", "os jogadores revelam e resolvem um após o outro: construir a estrutura, construir um estágio da Maravilha com ela ou descartá-la por 3 moedas.")
          : rl("2 · Act", "everyone at once: build the structure, build a Wonder stage with it, or discard it for 3 coins.", "2 · Agir", "todos ao mesmo tempo: construir a estrutura, construir um estágio da Maravilha com ela ou descartá-la por 3 moedas."),
        rl("Can't build either?", "you must discard it for 3 coins.", "Não pode construir nenhum?", "você deve descartá-la por 3 moedas."),
        twoPlayer()
          ? rl("3 · Pass", "put your remaining cards on your side of the Border card, then take the stack on the other side.", "3 · Passar", "ponha suas cartas restantes do seu lado da carta de Fronteira e pegue a pilha do outro lado.")
          : rl("3 · Pass", `${icon("pass-left", t("pass left", "passe à esquerda"))} Age I left · ${icon("pass-right", t("pass right", "passe à direita"))} Age II right · Age III left.`, "3 · Passar", `${icon("pass-left", t("pass left", "passe à esquerda"))} Era I à esquerda · ${icon("pass-right", t("pass right", "passe à direita"))} Era II à direita · Era III à esquerda.`),
        rl("6th turn", "you get 2 cards: play 1, discard the other face down for no coins.", "6º turno", "você recebe 2 cartas: jogue 1 e descarte a outra virada para baixo, sem moedas."),
        twoPlayer() ? rl("6th turn, Free City holder", "draw the top card of the Free City pile (3 in hand), play 2 — one per city — and discard the third; the pile's last card is discarded too.", "6º turno, quem tem a Cidade Livre", "compre a carta do topo da pilha da Cidade Livre (3 na mão), jogue 2 — uma por cidade — e descarte a terceira; a última carta da pilha também é descartada.") : null
      ], [5]),
      infoCard(t("BUILDING", "CONSTRUIR"), t("Paying a card's cost", "Pagar o custo de uma carta"), [
        rl("Empty cost", "free.", "Custo vazio", "grátis."),
        rl("Coin", "pay it to the bank.", "Moeda", "pague ao banco."),
        rl("Resources", "your city must produce them. They are never spent — reuse them every turn.", "Recursos", "sua cidade precisa produzi-los. Nunca são gastos — reuse-os todo turno."),
        rl("Chain", "own the earlier structure named next to the cost → build it free.", "Encadeamento", "tenha a estrutura anterior indicada ao lado do custo → construa grátis."),
        rl("Never", "two structures with the same name in your city.", "Nunca", "duas estruturas de mesmo nome na sua cidade.")
      ], [3, 4, 5]),
      infoCard(t("COMMERCE", "COMÉRCIO"), t("Buying from your two neighbors", "Comprar dos seus dois vizinhos"), [
        rl("Price", "2 coins per resource, paid to its owner.", "Preço", "2 moedas por recurso, pagas ao dono."),
        rl("Discounts", "1 coin instead: East / West Trading Post = raw materials from the right / left neighbor; Marketplace = manufactured goods from both. From the turn after you build them.", "Descontos", "1 moeda em vez de 2: Entreposto Leste / Oeste = matérias-primas do vizinho da direita / esquerda; Mercado = produtos manufaturados dos dois. A partir do turno seguinte ao da construção."),
        rl("For sale", "resources of their board, brown and gray cards only — not yellow cards or Wonder choices.", "À venda", "só recursos do tabuleiro e das cartas marrons e cinza — não de cartas amarelas nem escolhas da Maravilha."),
        rl("Sellers", "can't refuse, and still use what they sell.", "Vendedores", "não podem recusar e ainda usam o que vendem."),
        rl("Coins", "only those you had at the start of the turn. Coins earned this turn wait for the next.", "Moedas", "só as que você tinha no início do turno. Moedas ganhas neste turno esperam o próximo."),
        rl("Bought resources", "this turn only.", "Recursos comprados", "só neste turno.")
      ], [4]),
      infoCard(t("WONDER STAGE", "ESTÁGIO DA MARAVILHA"), t("Using a card as a marker", "Usar uma carta como marcador"), [
        rl("Pay", "the cost printed on the board under the stage, not the card's cost — with your production and/or resources bought from neighbors.", "Pague", "o custo impresso no tabuleiro sob o estágio, não o custo da carta — com sua produção e/ou recursos comprados dos vizinhos."),
        rl("Tuck", "the card face down under the board. It is not a structure and stays hidden.", "Encaixe", "a carta virada para baixo sob o tabuleiro. Não é uma estrutura e fica escondida."),
        rl("Order", "left to right, each stage once. Any Age, several per Age, or none at all.", "Ordem", "da esquerda para a direita, cada estágio uma vez. Qualquer Era, vários por Era ou nenhum.")
      ], [5]),
      infoCard(t("END OF EACH AGE", "FIM DE CADA ERA"), t("Military conflicts", "Conflitos militares"), [
        rl("Compare", "your Shields with each neighbor's, separately.", "Compare", "seus Escudos com os de cada vizinho, separadamente."),
        rl("More", `Victory token: +1 (Age I), +3 (Age II), +5 (Age III).`, "Mais", "ficha de Vitória: +1 (Era I), +3 (Era II), +5 (Era III)."),
        rl("Fewer", "Defeat token −1.", "Menos", "ficha de Derrota −1."),
        rl("Tie", "no token.", "Empate", "nenhuma ficha."),
        twoPlayer() ? t("The Free City fights its two neighbors too.", "A Cidade Livre também luta contra seus dois vizinhos.") : null
      ], [5], "victory-card"),
      infoCard(t("END OF AGE III", "FIM DA ERA III"), t("Scoring order", "Ordem da contagem"), [
        rl("1 Military", "sum of Conflict tokens (can be negative).", "1 Militar", "soma das fichas de Conflito (pode ser negativa)."),
        rl("2 Treasury", "1 VP per 3 coins.", "2 Tesouro", "1 PV a cada 3 moedas."),
        rl("3 Wonder", "VP of the built stages.", "3 Maravilha", "PV dos estágios construídos."),
        rl("4 Civilian", "VP on blue cards.", "4 Civis", "PV das cartas azuis."),
        rl("5 Science", "squares + 7 per set of 3 different.", "5 Ciência", "quadrados + 7 por trio diferente."),
        rl("6 Commercial", "Age III yellow cards.", "6 Comerciais", "cartas amarelas da Era III."),
        rl("7 Guilds", "as printed.", "7 Guildas", "como impresso."),
        leaders() ? rl("Leaders", "add your Leaders' end-of-game VP.", "Líderes", "some os PV de fim de partida dos seus Líderes.") : null,
        rl("Tie", "most coins wins; still tied: shared.", "Empate", "vence quem tem mais moedas; empate de novo: compartilhado.")
      ], leaders() ? [6, "L2"] : [6], "victory-card"),
      infoCard(t("SCIENCE", "CIÊNCIA"), t("Green symbols", "Símbolos verdes"), [
        `${icon("compass", symName("compass"))}${icon("gear", symName("gear"))}${icon("tablet", symName("tablet"))} ${t("Count each symbol type.", "Conte cada tipo de símbolo.")}`,
        rl("Identical", "1 → 1, 2 → 4, 3 → 9, 4 → 16 VP (count × count).", "Idênticos", "1 → 1, 2 → 4, 3 → 9, 4 → 16 PV (quantidade × quantidade)."),
        rl("Sets", "+7 VP for each set of 3 different symbols.", "Trios", "+7 PV por trio de 3 símbolos diferentes."),
        rl("Both count", "add the two results.", "Os dois contam", "some os dois resultados.")
      ], [6]),
      twoPlayer() ? infoCard(t("2 PLAYERS", "2 JOGADORES"), t("The Free City", "A Cidade Livre"), [
        rl("Holder", "whoever holds the Free City card draws 1 card from the Free City pile and picks 2 cards: one for each city.", "Quem a tem", "quem tem a carta da Cidade Livre compra 1 carta da pilha da Cidade Livre e escolhe 2 cartas: uma para cada cidade."),
        rl("Order", "the holder plays the Free City's card, then their own.", "Ordem", "quem a tem joga a carta da Cidade Livre e depois a sua."),
        rl("Must build", "the Free City discards only if it can build nothing; free chains are mandatory.", "Deve construir", "a Cidade Livre só descarta se não puder construir nada; encadeamentos grátis são obrigatórios."),
        rl("Swap", "the hands — and the Free City card — cross the Border card every turn.", "Troca", "as mãos — e a carta da Cidade Livre — cruzam a carta de Fronteira todo turno."),
        rl("New Age", "Age I and III: the Free City's left neighbor starts with it; Age II: its right neighbor.", "Nova Era", "Eras I e III: o vizinho da esquerda da Cidade Livre começa com ela; Era II: o vizinho da direita.")
      ], [7]) : "",
      leaders() ? infoCard(t("LEADERS PACK", "PACK LEADERS"), t("Anniversary Pack additions", "Acréscimos do Anniversary Pack"), [
        rl("A coin", `${icon("age-cost", t("age-based cost", "custo por Era"))} cost = current Age: 1 / 2 / 3 coins.`, "Moeda A", `${icon("age-cost", t("age-based cost", "custo por Era"))} custo = Era atual: 1 / 2 / 3 moedas.`),
        rl("Base Leaders rules", "dealing, choosing and recruiting are in your Leaders rulebook (not in this guide).", "Regras base de Leaders", "distribuir, escolher e recrutar estão no seu manual de Leaders (não neste guia)."),
        t("Effects of the 15 new Leaders: see the Leaders section.", "Efeitos dos 15 novos Líderes: veja a seção Leaders.")
      ], ["L1"]) : ""
    ];
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), sectionIndex("quick-reference"), [4, 5, 6])}
      <div class="callout">${t(
        `Three Ages, 6 turns each. Every turn you keep one card from a hand that travels around the table and use it to grow your city or your Wonder. After each Age, compare armies with your neighbors. After Age III, the most victory points wins.`,
        `Três Eras, 6 turnos cada. Em cada turno você fica com uma carta de uma mão que circula pela mesa e a usa para fazer crescer sua cidade ou sua Maravilha. Depois de cada Era, compare exércitos com os vizinhos. Depois da Era III, vence quem tiver mais pontos de vitória.`
      )} ${referenceLink(2)}</div>
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- turn ----------

  function turnSection() {
    return `
      ${sectionHeading("turn", t("An Age, turn by turn", "Uma Era, turno a turno"), sectionIndex("turn"), [2, 5])}
      <p class="glossary-intro">${t(
        "A game is three Ages played the same way: Age I, then Age II, then Age III. Points are only counted at the end of Age III. At the start of each Age every player gets 7 cards from that Age's deck; the Age then lasts 6 turns. There is no turn order: everyone plays at the same time.",
        "Uma partida tem três Eras jogadas do mesmo jeito: Era I, depois Era II, depois Era III. Os pontos só são contados no fim da Era III. No início de cada Era cada jogador recebe 7 cartas do baralho daquela Era; a Era dura 6 turnos. Não há ordem de turno: todos jogam ao mesmo tempo."
      )}${twoPlayer() ? ` <strong>${t("With 2 players, also read “2 players: the Free City”: the steps below change slightly.", "Com 2 jogadores, leia também “2 jogadores: a Cidade Livre”: os passos abaixo mudam um pouco.")}</strong>` : ""}</p>
      <div class="quick-grid">
        ${infoCard(t("STEP 1", "PASSO 1"), t("Choose a card", "Escolha uma carta"), [
          t("Look at your hand without showing it and choose one card.", "Olhe sua mão sem mostrá-la e escolha uma carta."),
          t("Place it face down in front of you.", "Coloque-a virada para baixo à sua frente."),
          twoPlayer()
            ? t("Put the rest of your hand on your side of the Border card.", "Ponha o resto da mão do seu lado da carta de Fronteira.")
            : `${t("Put the rest of your hand face down beside you, ready to pass.", "Ponha o resto da mão virado para baixo ao seu lado, pronto para passar.")} ${interpretation("the rulebook says between you and your left-hand neighbor; in Age II, when hands go right, put them toward your right-hand neighbor.", "o manual diz entre você e o vizinho da esquerda; na Era II, quando as mãos vão para a direita, ponha-as do lado do vizinho da direita.")}`
        ], [5])}
        ${infoCard(t("STEP 2", "PASSO 2"), t("Action — one of three", "Ação — uma de três"), [
          oneByOne()
            ? `${t("When everyone has chosen, reveal and resolve the actions one player after another, so everyone can follow (learning game).", "Quando todos escolheram, revelem e resolvam as ações um jogador após o outro, para todos acompanharem (partida de aprendizado).")} ${interpretation("go around the table in any agreed order; the result must be the same as playing simultaneously: coins earned from a neighbor this turn still cannot be spent until next turn, and effects that count cards built the same turn (Vineyard, Bazar) or the turn's discards (Halicarnassus) are settled after everyone has acted.", "sigam a mesa na ordem que combinarem; o resultado deve ser o mesmo do jogo simultâneo: moedas ganhas de um vizinho neste turno ainda não podem ser gastas antes do próximo, e efeitos que contam cartas construídas no mesmo turno (Vinhedo, Bazar) ou os descartes do turno (Halicarnasso) são resolvidos depois que todos agiram.")}`
            : t("When everyone has chosen, all players perform their action simultaneously.", "Quando todos escolheram, todos executam a ação ao mesmo tempo."),
          rl("a · Build the structure", "pay the card's cost and add it to your city (see Building).", "a · Construir a estrutura", "pague o custo da carta e acrescente-a à sua cidade (veja Construção)."),
          rl("b · Build a Wonder stage", "pay the stage's cost on your board and tuck the card under it face down.", "b · Construir um estágio da Maravilha", "pague o custo do estágio no tabuleiro e encaixe a carta virada para baixo sob ele."),
          rl("c · Discard for 3 coins", "put the card face down on the discard pile in the middle and take 3 coins from the bank.", "c · Descartar por 3 moedas", "ponha a carta virada para baixo na pilha de descarte do meio e pegue 3 moedas do banco."),
          t("If you can build neither the structure nor a Wonder stage, you must discard for 3 coins.", "Se não puder construir nem a estrutura nem um estágio da Maravilha, você deve descartar por 3 moedas."),
          t("Tip: discarding a card you can't use but a neighbor wants denies it to them.", "Dica: descartar uma carta que você não usa mas o vizinho quer a tira dele.")
        ], [5])}
        ${infoCard(t("STEP 3", "PASSO 3"), t("Pass the hands", "Passe as mãos"), twoPlayer()
          ? [
            t("Take the stack of cards on the other side of the Border card. The player who now holds the Free City card plays for the Free City next turn.", "Pegue a pilha de cartas do outro lado da carta de Fronteira. Quem agora tem a carta da Cidade Livre joga pela Cidade Livre no próximo turno."),
            t("Hand direction does not matter with 2 players: the hands simply swap.", "A direção das mãos não importa com 2 jogadores: as mãos simplesmente trocam.")
          ]
          : [
            t("Give your remaining cards to a neighbor and take the hand passed to you.", "Entregue as cartas restantes a um vizinho e pegue a mão passada a você."),
            rl("Age I", `to the left (clockwise) ${icon("pass-left", t("clockwise", "sentido horário"))}`, "Era I", `para a esquerda (sentido horário) ${icon("pass-left", t("sentido horário", "sentido horário"))}`),
            rl("Age II", `to the right (counter-clockwise) ${icon("pass-right", t("counter-clockwise", "sentido anti-horário"))}`, "Era II", `para a direita (sentido anti-horário) ${icon("pass-right", t("sentido anti-horário", "sentido anti-horário"))}`),
            rl("Age III", "to the left (clockwise) again.", "Era III", "para a esquerda (sentido horário) de novo.")
          ], [5])}
        ${infoCard(t("TURN 6", "TURNO 6"), t("The last turn of an Age", "O último turno de uma Era"), [
          twoPlayer()
            ? t("Each player starts turn 6 with 2 cards (the Free City holder draws a 3rd from the Free City pile). Choose as usual; the card left in each hand is discarded face down without coins.", "Cada jogador começa o turno 6 com 2 cartas (quem tem a Cidade Livre compra uma 3ª da pilha dela). Escolham como sempre; a carta que sobra em cada mão é descartada virada para baixo, sem moedas.")
            : t("You receive a 2-card hand. Choose one as usual; discard the other face down — you get no coins for it.", "Você recebe uma mão de 2 cartas. Escolha uma como sempre; descarte a outra virada para baixo — ela não dá moedas."),
          twoPlayer() ? t("The single card still in the Free City's pile is discarded at the same time.", "A única carta que ainda está na pilha da Cidade Livre é descartada ao mesmo tempo.") : null,
          t("Play the chosen card normally. Then the Age ends: resolve military conflicts.", "Jogue a carta escolhida normalmente. Então a Era acaba: resolvam os conflitos militares."),
          t("Babylon (side B, 2nd stage built) may play this 7th card instead of discarding it.", "Babilônia (lado B, 2º estágio construído) pode jogar essa 7ª carta em vez de descartá-la.")
        ], [5, 9])}
        ${infoCard(t("BETWEEN AGES", "ENTRE ERAS"), t("Starting the next Age", "Começar a próxima Era"), [
          t("After the conflicts, deal the next Age's deck: 7 cards to each player.", "Depois dos conflitos, distribua o baralho da próxima Era: 7 cartas a cada jogador."),
          twoPlayer() ? t("The remaining 7 cards form a new Free City pile; the starting holder of the Free City card changes (see the Free City).", "As 7 cartas restantes formam uma nova pilha da Cidade Livre; quem começa com a carta da Cidade Livre muda (veja a Cidade Livre).") : null,
          t("Everything you built stays: resources, coins, tokens, Wonder stages.", "Tudo o que você construiu fica: recursos, moedas, fichas, estágios da Maravilha."),
          t("After Age III and its conflicts, the game ends: count the points.", "Depois da Era III e seus conflitos, a partida acaba: contem os pontos.")
        ], [2, 5, 6])}
      </div>`;
  }

  // ---------- building & commerce ----------

  function buildingSection() {
    return `
      ${sectionHeading("building", t("Building & commerce", "Construção e comércio"), sectionIndex("building"), [3, 4, 12])}
      <div class="quick-grid">
        ${infoCard(t("READING A CARD", "LER UMA CARTA"), t("Where everything is", "Onde está cada coisa"), [
          rl("Border colour", "the structure type: brown, gray, blue, green, yellow, red or purple.", "Cor da borda", "o tipo de estrutura: marrom, cinza, azul, verde, amarela, vermelha ou roxa."),
          rl("Upper left", "construction cost. Empty = free.", "Canto superior esquerdo", "custo de construção. Vazio = grátis."),
          rl("Next to the cost (Age II/III)", "the name of an earlier structure that makes this one free.", "Ao lado do custo (Era II/III)", "o nome de uma estrutura anterior que torna esta grátis."),
          rl("Top", "the effect.", "Topo", "o efeito."),
          rl("Lower right", "the later structures this card makes free.", "Canto inferior direito", "as estruturas posteriores que esta carta torna grátis."),
          rl("Lower centre", "the player count it is used from (3+, 4+…).", "Centro inferior", "a partir de quantos jogadores ela é usada (3+, 4+…).")
        ], [3])}
        ${infoCard(t("COSTS", "CUSTOS"), t("Three kinds", "Três tipos"), [
          rl("Free", "no cost printed (e.g. Marketplace, East Trading Post).", "Grátis", "nenhum custo impresso (ex.: Mercado, Entreposto Leste)."),
          rl("Coins", "some brown cards cost 1 coin, paid to the bank that turn (e.g. Mine, Timber Yard).", "Moedas", "algumas cartas marrons custam 1 moeda, paga ao banco nesse turno (ex.: Mina, Depósito de madeira)."),
          rl("Resources", "your city must produce what is shown, or buy the missing ones from neighbors (e.g. Baths: 1 Stone; Arena: 2 Stone + 1 Ore).", "Recursos", "sua cidade precisa produzir o que aparece ou comprar dos vizinhos o que faltar (ex.: Termas: 1 Pedra; Arena: 2 Pedras + 1 Minério)."),
          rl("Wonder stages", "always cost resources, printed on the board.", "Estágios da Maravilha", "sempre custam recursos, impressos no tabuleiro."),
          interpretation("the rulebook explains production and commerce for structures; Wonder stages are paid the same way, with your own production and/or resources bought from your neighbors.", "o manual explica produção e comércio para as estruturas; os estágios da Maravilha são pagos do mesmo jeito, com sua produção e/ou recursos comprados dos vizinhos.")
        ], [3, 4])}
        ${infoCard(t("PRODUCTION", "PRODUÇÃO"), t("What your city makes", "O que sua cidade produz"), [
          t("Your board's starting resource, your brown and gray cards and some yellow cards (and some Wonder stages) produce resources.", "O recurso inicial do tabuleiro, suas cartas marrons e cinza, algumas cartas amarelas (e alguns estágios da Maravilha) produzem recursos."),
          rl("Never spent", "each resource can be used every turn for the whole game. Production never goes down.", "Nunca gastos", "cada recurso pode ser usado todo turno pela partida inteira. A produção nunca diminui."),
          rl("Per turn", "each produced unit counts once for one construction that turn: to build something needing 3 Stone you need 3 Stone of production.", "Por turno", "cada unidade produzida conta uma vez numa construção daquele turno: para algo que pede 3 Pedras você precisa de 3 Pedras de produção."),
          rl("“A / B” cards", "produce one of the two each turn, not both. Neighbors may buy either one, whatever you use.", "Cartas “A / B”", "produzem uma das duas por turno, não ambas. Os vizinhos podem comprar qualquer uma, seja qual for a que você usa.")
        ], [4, 12])}
        ${infoCard(t("COMMERCE", "COMÉRCIO"), t("Buying a missing resource", "Comprar um recurso que falta"), [
          t("You may buy resources only from your two neighboring cities (the players directly left and right of you).", "Você só pode comprar recursos das duas cidades vizinhas (os jogadores imediatamente à esquerda e à direita)."),
          players() === 3 ? t("With 3 players, your two neighbors are simply the other two players.", "Com 3 jogadores, seus dois vizinhos são simplesmente os outros dois jogadores.") : null,
          twoPlayer() ? t("With 2 players, your neighbors are your opponent and the Free City.", "Com 2 jogadores, seus vizinhos são o adversário e a Cidade Livre.") : null,
          rl("For sale", "the resource printed on their board, and those of their brown and gray cards.", "À venda", "o recurso impresso no tabuleiro dele e os das cartas marrons e cinza."),
          rl("Not for sale", "resources from yellow cards (Forum, Caravansery) and Wonder choices (Alexandria) — reserved to their owner.", "Não estão à venda", "recursos de cartas amarelas (Fórum, Caravançará) e escolhas de Maravilha (Alexandria) — reservados ao dono."),
          rl("Price", "2 coins per resource, paid to the owner — 1 coin with an East/West Trading Post (raw materials, that side) or Marketplace (manufactured goods, both sides), from the turn after you build it.", "Preço", "2 moedas por recurso, pagas ao dono — 1 moeda com Entreposto Leste/Oeste (matérias-primas, daquele lado) ou Mercado (produtos manufaturados, dos dois lados), a partir do turno seguinte ao da construção.")
        ], [4, 12])}
        ${infoCard(t("COMMERCE RULES", "REGRAS DO COMÉRCIO"), t("Clarifications", "Esclarecimentos"), [
          t("Selling a resource does not stop you using it for your own building that same turn.", "Vender um recurso não impede você de usá-lo na sua construção no mesmo turno."),
          t("You may buy from both neighbors in the same turn, one or more resources each.", "Você pode comprar dos dois vizinhos no mesmo turno, um ou mais recursos de cada."),
          t("If both neighbors produce what you want, choose who you buy from.", "Se os dois vizinhos produzem o que você quer, escolha de quem comprar."),
          t("Bought resources only count for this turn's construction.", "Recursos comprados só valem para a construção deste turno."),
          t("Players can never refuse to sell.", "Os jogadores nunca podem recusar a venda."),
          t("You pay with coins you had at the start of the turn. Coins earned through commerce this turn can only be spent next turn.", "Você paga com moedas que tinha no início do turno. Moedas ganhas no comércio neste turno só podem ser gastas no próximo.")
        ], [4])}
        ${infoCard(t("CHAINS", "ENCADEAMENTOS"), t("Free construction", "Construção gratuita"), [
          t("Some Age II and III structures show, next to their cost, the name of a structure from an earlier Age.", "Algumas estruturas das Eras II e III mostram, ao lado do custo, o nome de uma estrutura de uma Era anterior."),
          t("If you built that structure in an earlier Age, you may build this one for free — no resources needed.", "Se você construiu essa estrutura numa Era anterior, pode construir esta de graça — sem precisar de recursos."),
          t("Chains can continue: Theater (Age I) → Statue (Age II) → Gardens (Age III).", "Encadeamentos podem continuar: Teatro (Era I) → Estátua (Era II) → Jardins (Era III)."),
          t("Every chain is listed in “Card list & chains”.", "Todo encadeamento está em “Lista de cartas e encadeamentos”.")
        ], [3, 4, 11])}
        ${infoCard(t("ALWAYS", "SEMPRE"), t("Limits", "Limites"), [
          t("You can never build two identical structures (same name, same picture).", "Você nunca pode construir duas estruturas idênticas (mesmo nome, mesma imagem)."),
          t("Your coins have no limit. Built cards are never discarded.", "Suas moedas não têm limite. Cartas construídas nunca são descartadas."),
          t("Yellow-card coins (Tavern, Vineyard, Bazar, Haven, Lighthouse, Chamber of Commerce, Arena) are taken from the bank only once, when the card is built.", "As moedas das cartas amarelas (Taverna, Vinhedo, Bazar, Porto, Farol, Câmara de Comércio, Arena) são pegas do banco só uma vez, quando a carta é construída."),
          t("Resources produced by boards are not cards: they do not count for Vineyard, Bazar, the Guilds and similar effects.", "Recursos produzidos pelos tabuleiros não são cartas: não contam para Vinhedo, Bazar, as Guildas e efeitos parecidos.")
        ], [3, 5, 12])}
      </div>`;
  }

  // ---------- military ----------

  function militarySection() {
    return `
      ${sectionHeading("military", t("Military & end of an Age", "Militar e fim de Era"), sectionIndex("military"), [3, 5])}
      <div class="quick-grid">
        ${infoCard(t("AFTER TURN 6", "DEPOIS DO TURNO 6"), t("Military conflicts", "Conflitos militares"), [
          t("Each player adds up the Shields on their red cards (plus Shields from their Wonder) and compares the total with each of their two neighboring cities, one at a time.", "Cada jogador soma os Escudos das cartas vermelhas (mais os Escudos da Maravilha) e compara o total com cada uma das duas cidades vizinhas, uma de cada vez."),
          `${icon("victory-token", t("Victory token", "ficha de Vitória"))} ${rl("More than that neighbor", "take a Victory token of the Age just played: +1 (Age I), +3 (Age II), +5 (Age III).", "Mais que esse vizinho", "pegue uma ficha de Vitória da Era que acabou: +1 (Era I), +3 (Era II), +5 (Era III).")}`,
          `${icon("defeat-token", t("Defeat token", "ficha de Derrota"))} ${rl("Fewer", "take a Defeat token (−1 VP) — in every Age.", "Menos", "pegue uma ficha de Derrota (−1 PV) — em toda Era.")}`,
          rl("Equal", "no token.", "Igual", "nenhuma ficha."),
          t("So each player gets 0, 1 or 2 tokens per Age, placed on their Wonder board.", "Assim cada jogador recebe 0, 1 ou 2 fichas por Era, colocadas no tabuleiro da Maravilha."),
          twoPlayer() ? t("With 2 players the Free City is a city like the others: it fights both players, and both players fight it. Conflict rules do not change.", "Com 2 jogadores a Cidade Livre é uma cidade como as outras: ela luta contra os dois jogadores, e os dois lutam contra ela. As regras de conflito não mudam.") : null
        ], [5], "victory-card")}
        ${infoCard(t("SHIELDS", "ESCUDOS"), t("Where they come from", "De onde vêm"), [
          `${icon("shield", t("1 Shield", "1 Escudo"))} ${t("Age I red cards: 1 Shield each.", "Cartas vermelhas da Era I: 1 Escudo cada.")}`,
          `${icon("two-shields", t("2 Shields", "2 Escudos"))} ${t("Age II red cards: 2 Shields each.", "Cartas vermelhas da Era II: 2 Escudos cada.")}`,
          `${icon("three-shields", t("3 Shields", "3 Escudos"))} ${t("Age III red cards: 3 Shields each.", "Cartas vermelhas da Era III: 3 Escudos cada.")}`,
          t("Rhodes: +2 Shields (side A, stage 2) or +1 Shield per stage (side B).", "Rodes: +2 Escudos (lado A, estágio 2) ou +1 Escudo por estágio (lado B)."),
          t("Shields are never lost: each Age compares your running total.", "Escudos nunca se perdem: cada Era compara o seu total acumulado.")
        ], [3, 8, 9, 12])}
        ${infoCard(t("EXAMPLE", "EXEMPLO"), t("End of Age II", "Fim da Era II"), [
          t("Alexandria has 3 Shields. Rhodes, to its left, has 5; Ephesus, to its right, has 2.", "Alexandria tem 3 Escudos. Rodes, à esquerda, tem 5; Éfeso, à direita, tem 2."),
          t("Against Rhodes: fewer → Defeat token (−1), placed on the left of Alexandria's board.", "Contra Rodes: menos → ficha de Derrota (−1), posta à esquerda do tabuleiro de Alexandria."),
          t("Against Ephesus: more → Victory token +3 (Age II), placed on the right.", "Contra Éfeso: mais → ficha de Vitória +3 (Era II), posta à direita.")
        ], [5])}
      </div>`;
  }

  // ---------- scoring ----------

  function sciencePoints(counts) {
    return counts[0] * counts[0] + counts[1] * counts[1] + counts[2] * counts[2] + 7 * Math.min(...counts);
  }

  function withAganice(base) {
    const out = [base];
    for (let from = 0; from < 3; from += 1) {
      if (base[from] === 0) {
        continue;
      }
      for (let to = 0; to < 3; to += 1) {
        if (to !== from) {
          const next = base.slice();
          next[from] -= 1;
          next[to] += 1;
          out.push(next);
        }
      }
    }
    return out;
  }

  function withEnheduanna(base) {
    const max = Math.max(...base);
    if (max === 0) {
      return [base];
    }
    return [0, 1, 2].filter((i) => base[i] === max).map((i) => {
      const next = base.slice();
      next[i] += 1;
      return next;
    });
  }

  function bestScience() {
    const wild = science.wild;
    const aganice = leaders() && science.aganice;
    const enheduanna = leaders() && science.enheduanna;
    let best = { points: -1, counts: [0, 0, 0] };
    for (let a = 0; a <= wild; a += 1) {
      for (let b = 0; b <= wild - a; b += 1) {
        const base = [science.compass + a, science.gear + b, science.tablet + (wild - a - b)];
        let candidates = [base];
        if (aganice && enheduanna) {
          candidates = [
            ...withAganice(base).flatMap(withEnheduanna),
            ...withEnheduanna(base).flatMap(withAganice)
          ];
        } else if (aganice) {
          candidates = withAganice(base);
        } else if (enheduanna) {
          candidates = withEnheduanna(base);
        }
        candidates.forEach((counts) => {
          const points = sciencePoints(counts);
          if (points > best.points) {
            best = { points, counts };
          }
        });
      }
    }
    return best;
  }

  function calcRow(key, file, label, max) {
    return `
      <div class="sw-calc-row">
        <span class="sw-calc-label">${file ? `<img class="sw-inline-icon" src="${ICONS}${file}.webp" alt="">` : ""}${label}</span>
        <span class="sw-calc-controls">
          <button type="button" class="sw-calc-button" data-sci="${key}" data-delta="-1" aria-label="${t(`Remove one: ${label}`, `Tirar um: ${label}`)}" ${science[key] <= 0 ? "disabled" : ""}>−</button>
          <output class="sw-calc-value" aria-live="polite">${science[key]}</output>
          <button type="button" class="sw-calc-button" data-sci="${key}" data-delta="1" aria-label="${t(`Add one: ${label}`, `Somar um: ${label}`)}" ${science[key] >= max ? "disabled" : ""}>+</button>
        </span>
      </div>`;
  }

  function scienceCalcInner() {
    const best = bestScience();
    const [c, g, tb] = best.counts;
    const sets = Math.min(c, g, tb);
    return `
      ${calcRow("compass", "compass", symName("compass"), 9)}
      ${calcRow("gear", "gear", symName("gear"), 9)}
      ${calcRow("tablet", "tablet", symName("tablet"), 9)}
      ${calcRow("wild", null, t("Symbols of your choice (Babylon, Scientists Guild, Olympia B copying it)", "Símbolos à sua escolha (Babilônia, Guilda dos Cientistas, Olímpia B copiando-a)"), 3)}
      ${leaders() ? calcRow("aganice", null, "Aganice", 1) : ""}
      ${leaders() ? calcRow("enheduanna", null, "Enheduanna", 1) : ""}
      <p class="sw-calc-total"><strong>${t(`Science: ${best.points} VP`, `Ciência: ${best.points} PV`)}</strong> — ${t(
        `best split: ${symName("compass")} ×${c}, ${symName("gear")} ×${g}, ${symName("tablet")} ×${tb} → ${c * c} + ${g * g} + ${tb * tb} for identical symbols, plus ${sets} set${sets === 1 ? "" : "s"} × 7 = ${sets * 7}.`,
        `melhor divisão: ${symName("compass")} ×${c}, ${symName("gear")} ×${g}, ${symName("tablet")} ×${tb} → ${c * c} + ${g * g} + ${tb * tb} por símbolos idênticos, mais ${sets} trio${sets === 1 ? "" : "s"} × 7 = ${sets * 7}.`
      )}</p>
      <button type="button" class="button-secondary" data-sci-reset>${t("Clear calculator", "Limpar calculadora")}</button>`;
  }

  function scoringSection() {
    return `
      ${sectionHeading("scoring", t("End of game & scoring", "Fim e pontuação"), sectionIndex("scoring"), leaders() ? [6, 12, "L2"] : [6, 12])}
      <p class="glossary-intro">${t(
        `The game ends at the end of Age III, after the Conflict tokens are handed out. Count each category in order with the score booklet; the highest total wins. Tie: the tied player with the most coins wins; a tie on coins is not broken further.${twoPlayer() ? " With 2 players only the two players compete for the win." : ""}`,
        `A partida acaba no fim da Era III, depois da entrega das fichas de Conflito. Conte cada categoria na ordem, com o bloco de pontuação; o maior total vence. Empate: entre os empatados vence quem tem mais moedas; empate em moedas não é desfeito.${twoPlayer() ? " Com 2 jogadores, só os dois jogadores disputam a vitória." : ""}`
      )}</p>
      <div class="quick-grid">
        ${infoCard("1–4", t("Military, treasury, Wonder, civilian", "Militar, tesouro, Maravilha, civis"), [
          rl("1 · Military", "add your Victory and Defeat tokens. The total can be negative.", "1 · Militar", "some suas fichas de Vitória e Derrota. O total pode ser negativo."),
          rl("2 · Treasury", "1 VP for every 3 coins. Leftover coins score nothing.", "2 · Tesouro", "1 PV a cada 3 moedas. Moedas que sobram não pontuam."),
          rl("3 · Wonder", "the VP shown on your built stages.", "3 · Maravilha", "os PV mostrados nos estágios construídos."),
          rl("4 · Civilian", "the VP printed on each blue card.", "4 · Civis", "os PV impressos em cada carta azul.")
        ], [6])}
        ${infoCard(t("5 · SCIENCE", "5 · CIÊNCIA"), t("Two ways, both counted", "Duas formas, ambas contam"), [
          rl("Identical symbols", "for each of the 3 symbols: 1 → 1 VP, 2 → 4, 3 → 9, 4 → 16 (the count squared).", "Símbolos idênticos", "para cada um dos 3 símbolos: 1 → 1 PV, 2 → 4, 3 → 9, 4 → 16 (a quantidade ao quadrado)."),
          t("There are 4 green cards per symbol. Babylon and the Scientists Guild can push a symbol to 5 (25 VP) or 6 (36 VP).", "Há 4 cartas verdes por símbolo. Babilônia e a Guilda dos Cientistas podem levar um símbolo a 5 (25 PV) ou 6 (36 PV)."),
          rl("Sets of 3 different", "+7 VP for each group of one Compass, one Gear and one Tablet.", "Trios de 3 diferentes", "+7 PV para cada grupo de um Compasso, uma Engrenagem e uma Tábua."),
          t("Symbols “of your choice” are chosen now, at scoring.", "Símbolos “à sua escolha” são escolhidos agora, na contagem."),
          t("The rulebook gives the symbols no names; this guide calls them Compass, Gear and Tablet.", "O manual não dá nomes aos símbolos; este guia os chama de Compasso, Engrenagem e Tábua.")
        ], [6, 12])}
        ${infoCard("6–7", t("Commercial, Guilds", "Comerciais, Guildas"), [
          rl("6 · Commercial", "Age III yellow cards: Haven, Lighthouse, Chamber of Commerce, Arena — count what you have at the end.", "6 · Comerciais", "cartas amarelas da Era III: Porto, Farol, Câmara de Comércio, Arena — conte o que você tem no fim."),
          rl("7 · Guilds", "each Guild by its own rule, usually counting your neighbors' cities (arrows on both sides = neighbors only, not you).", "7 · Guildas", "cada Guilda pela própria regra, geralmente contando as cidades vizinhas (setas dos dois lados = só os vizinhos, não você)."),
          state.wonders !== "side-a" ? t("Olympia side B (stage 3) also scores one neighbor's Guild as if it were its own.", "Olímpia lado B (estágio 3) também pontua uma Guilda de um vizinho como se fosse sua.") : null
        ], [6, 9, 12])}
        ${leaders() ? infoCard(t("LEADERS", "LÍDERES"), t("End-of-game Leader effects", "Efeitos de Líderes no fim"), [
          t("Score the end-of-game effects of your face-up Leaders (Leaders section). Aganice and Enheduanna change science; Cynisca, Gorgo, Agrippina, Makeda, Phryne, Eurypyle, Cornelia and Theano give VP.", "Pontue os efeitos de fim de partida dos seus Líderes virados para cima (seção Leaders). Aganice e Enheduanna mudam a ciência; Cynisca, Gorgo, Agrippina, Makeda, Phryne, Eurypyle, Cornelia e Theano dão PV."),
          interpretation("the leaflet does not say where Leaders fit in the scoring order; use your Leaders rulebook or score sheet, or add them last.", "o folheto não diz onde os Líderes entram na ordem da contagem; use o manual ou a folha de pontuação de Leaders, ou some-os por último.")
        ], ["L2", "L3", "L4"]) : ""}
      </div>
      <h3 class="subhead">${t("Science calculator", "Calculadora de ciência")}</h3>
      <article class="info-card sw-calc">
        <span class="component-label">${t("TABLE HELPER · NOT SAVED", "AJUDA DE MESA · NÃO É SALVA")}</span>
        <p>${t(
          `Enter one player's green symbols. The calculator places symbols “of your choice”${leaders() ? " and Aganice/Enheduanna" : ""} where they score the most.`,
          `Informe os símbolos verdes de um jogador. A calculadora coloca os símbolos “à sua escolha”${leaders() ? " e Aganice/Enheduanna" : ""} onde pontuam mais.`
        )}${leaders() ? ` ${interpretation("Aganice and Enheduanna are tried in both orders and the better result is shown; with a tie for most symbols, Enheduanna's symbol is your choice among the tied ones.", "Aganice e Enheduanna são testadas nas duas ordens e o melhor resultado aparece; com empate no símbolo mais numeroso, o símbolo de Enheduanna é escolhido entre os empatados.")}` : ""}</p>
        <div id="sw-science-calc">${scienceCalcInner()}</div>
      </article>`;
  }

  // ---------- wonders ----------

  function wondersSection() {
    const list = wonderData();
    return `
      ${sectionHeading("wonders", t("The seven Wonders", "As sete Maravilhas"), sectionIndex("wonders"), sideAOnly() ? [8] : [8, 9])}
      <p class="glossary-intro">${t(
        "Each board shows its city's starting resource (upper left) and the Wonder stages along the bottom, each with its construction cost (printed on the board) and its reward. Side A always gives 3 VP for stage 1 and 7 VP for stage 3; only stage 2 differs.",
        "Cada tabuleiro mostra o recurso inicial da cidade (canto superior esquerdo) e os estágios da Maravilha embaixo, cada um com o custo de construção (impresso no tabuleiro) e a recompensa. O lado A sempre dá 3 PV no estágio 1 e 7 PV no estágio 3; só o estágio 2 muda."
      )}${sideAOnly() ? ` <strong>${t("This match uses side A only.", "Esta partida usa só o lado A.")}</strong>` : ` ${t("Side B is a little more complex; both sides are balanced and can be mixed in the same game.", "O lado B é um pouco mais complexo; os dois lados são equilibrados e podem se misturar na mesma partida.")}`}</p>
      <div class="sw-wonder-grid">${list.map((w) => `
        <article class="info-card sw-wonder" id="wonder-${w.id}">
          <div class="sw-wonder-head">
            <h3>${t(w.name[0], w.name[1])}</h3>
            <span class="sw-wonder-start">${icon(w.start, resName(w.start))}${t("starts with", "começa com")} ${resName(w.start)}</span>
          </div>
          <p class="sw-side-label">${t("Side A", "Lado A")}</p>
          ${lineList([t("Stage 1: 3 VP.", "Estágio 1: 3 PV."), w.a, t("Stage 3: 7 VP.", "Estágio 3: 7 PV.")])}
          ${sideAOnly() ? "" : `<p class="sw-side-label">${t("Side B", "Lado B")}</p>${lineList(w.b)}`}
          ${refs(sideAOnly() ? [8] : [8, 9])}
        </article>`).join("")}</div>`;
  }

  // ---------- two players ----------

  function twoPlayerSection() {
    return `
      ${sectionHeading("two-player", t("2 players: the Free City", "2 jogadores: a Cidade Livre"), sectionIndex("two-player"), [7])}
      <div class="callout">${t(
        "“Expert” variant. Besides your own city, the two of you take turns playing a card for a neutral third city, the Free City. Everything else follows the normal rules. The rulebook suggests a few games with 3–7 players first.",
        "Variante “Expert”. Além da própria cidade, vocês dois se revezam jogando uma carta por uma terceira cidade neutra, a Cidade Livre. Todo o resto segue as regras normais. O manual sugere algumas partidas com 3–7 jogadores antes."
      )}</div>
      <figure class="sw-figure">
        <img src="${ART}two-player.webp" alt="${t("Rulebook diagram: Ludovic's city on the left holding the Free City card, Piero's city on the right, the Border card between them with each player's passed stack on either side, the Free City's draw pile below it and the Free City board at the bottom.", "Diagrama do manual: a cidade de Ludovic à esquerda com a carta da Cidade Livre, a cidade de Piero à direita, a carta de Fronteira entre eles com a pilha passada de cada jogador de cada lado, a pilha de compra da Cidade Livre abaixo dela e o tabuleiro da Cidade Livre embaixo.")}" loading="lazy">
        <figcaption>${t("Rulebook p. 7: Ludovic holds the Free City card on this turn and plays one card for his city and one for the Free City.", "Manual p. 7: Ludovic tem a carta da Cidade Livre neste turno e joga uma carta para sua cidade e uma para a Cidade Livre.")}</figcaption>
      </figure>
      <div class="quick-grid">
        ${infoCard(t("EACH TURN", "CADA TURNO"), t("1 · Choose", "1 · Escolher"), [
          rl("Free City card holder", "take the top card of the Free City draw pile into your hand, then choose 2 cards: one for your city and one for the Free City.", "Quem tem a carta da Cidade Livre", "pegue a carta do topo da pilha de compra da Cidade Livre para a mão e escolha 2 cartas: uma para sua cidade e uma para a Cidade Livre."),
          rl("Other player", "choose 1 card normally.", "Outro jogador", "escolha 1 carta normalmente."),
          t("Each player puts the remaining cards on their own side of the Border card. The Free City card stays with the remaining cards.", "Cada jogador põe as cartas restantes do seu lado da carta de Fronteira. A carta da Cidade Livre fica junto com as cartas restantes."),
          interpretation("the Free City card is only a marker: it is never played or built.", "a carta da Cidade Livre é só um marcador: nunca é jogada nem construída.")
        ], [7])}
        ${infoCard(t("EACH TURN", "CADA TURNO"), t("2 · Action", "2 · Ação"), [
          t("The holder plays the Free City's card first, then their own. The other player performs their action at the same time.", "Quem tem a carta joga primeiro a carta da Cidade Livre e depois a sua. O outro jogador faz sua ação ao mesmo tempo."),
          rl("Commerce", "the Free City buys from both its neighbors with its own coins under the normal rules. When both sell the resource, the controller picks the seller, even if it costs more.", "Comércio", "a Cidade Livre compra dos dois vizinhos com as próprias moedas pelas regras normais. Quando os dois vendem o recurso, quem a controla escolhe o vendedor, mesmo que custe mais."),
          rl("Must build", "the Free City may discard for 3 coins only if it can build neither the structure nor a Wonder stage.", "Deve construir", "a Cidade Livre só pode descartar por 3 moedas se não puder construir nem a estrutura nem um estágio da Maravilha."),
          interpretation("it counts as able to build when it can pay with its own production plus resources it can afford to buy from its neighbors with the coins in its treasury.", "ela conta como capaz de construir quando pode pagar com a própria produção mais recursos que consegue comprar dos vizinhos com as moedas do seu tesouro."),
          rl("Chains", "if the Free City's card can be built for free through a chain, it must be.", "Encadeamentos", "se a carta da Cidade Livre puder ser construída de graça por encadeamento, deve ser."),
          interpretation("whoever is playing for the Free City this turn makes all its other choices (which stage, which resource, which seller, its Wonder abilities).", "quem está jogando pela Cidade Livre neste turno faz todas as outras escolhas dela (qual estágio, qual recurso, qual vendedor, habilidades da Maravilha).")
        ], [7])}
        ${infoCard(t("EACH TURN", "CADA TURNO"), t("3 · Swap", "3 · Trocar"), [
          t("Once all three cards are played, each player takes the stack on the other side of the Border card.", "Quando as três cartas foram jogadas, cada jogador pega a pilha do outro lado da carta de Fronteira."),
          t("So the Free City card changes hands every turn: next turn the other player plays for the Free City, and so on.", "Assim a carta da Cidade Livre troca de mão a cada turno: no próximo turno o outro jogador joga pela Cidade Livre, e assim por diante."),
          t("Turn 6: only 1 card remains in the Free City's pile; it is discarded with the players' 7th cards.", "Turno 6: só resta 1 carta na pilha da Cidade Livre; ela é descartada junto com as 7ª cartas dos jogadores.")
        ], [7])}
        ${infoCard(t("EACH AGE", "CADA ERA"), t("Who starts with the Free City card", "Quem começa com a carta da Cidade Livre"), [
          rl("Age I", "the player to the left of the Free City (the Free City is on their right).", "Era I", "o jogador à esquerda da Cidade Livre (a Cidade Livre está à direita dele)."),
          rl("Age II", "the player to the right of the Free City.", "Era II", "o jogador à direita da Cidade Livre."),
          rl("Age III", "the player to the left of the Free City again.", "Era III", "o jogador à esquerda da Cidade Livre de novo."),
          t("Deal 7 cards to each player; the 7 left over form the Free City's new draw pile, to the right of the Border card.", "Dê 7 cartas a cada jogador; as 7 que sobram formam a nova pilha de compra da Cidade Livre, à direita da carta de Fronteira.")
        ], [7])}
        ${infoCard(t("END OF AGE · END OF GAME", "FIM DA ERA · FIM DA PARTIDA"), t("Conflicts and winning", "Conflitos e vitória"), [
          t("Conflict resolution is unchanged: the Free City compares Shields with both players and takes tokens like everyone else.", "A resolução de conflitos não muda: a Cidade Livre compara Escudos com os dois jogadores e recebe fichas como todos."),
          t("The player with the most VP wins; tie: most coins.", "Vence o jogador com mais PV; empate: mais moedas."),
          interpretation("the Free City is not a player and cannot win, so it need not be scored. Its cards and tokens still count for your Guilds and other neighbor effects.", "a Cidade Livre não é um jogador e não pode vencer, então não precisa ser pontuada. As cartas e fichas dela ainda contam para suas Guildas e outros efeitos de vizinhos.")
        ], [7, 12], "victory-card")}
      </div>`;
  }

  // ---------- leaders ----------

  function leadersSection() {
    const timing = {
      now: t("When recruited", "Ao recrutar"),
      ongoing: t("While in play", "Enquanto em jogo"),
      end: t("End of game", "Fim da partida")
    };
    return `
      ${sectionHeading("leaders", t("Leaders Anniversary Pack", "Leaders Anniversary Pack"), sectionIndex("leaders"), ["L1", "L2", "L3", "L4"])}
      <div class="callout">${t(
        "What the supplied leaflet covers: 15 new Leader cards for the Leaders expansion, the age-based coin cost and the clarifications below. Leaders are the white cards; they use the Leaders expansion's own rules (dealing, choosing and recruiting Leaders, their coin costs, and anything else that expansion adds), which are in the Leaders rulebook — not supplied, so not summarised here. Effect wording below is paraphrased from the leaflet; the full text is on each card.",
        "O que o folheto fornecido cobre: 15 novas cartas de Líder para a expansão Leaders, o custo em moedas por Era e os esclarecimentos abaixo. Os Líderes são as cartas brancas; usam as regras próprias da expansão Leaders (distribuir, escolher e recrutar Líderes, seus custos em moedas e o que mais essa expansão acrescentar), que estão no manual de Leaders — não fornecido, então não resumido aqui. Os efeitos abaixo são parafraseados do folheto; o texto completo está em cada carta."
      )} ${referenceLink("L1")}</div>
      <div class="quick-grid">
        ${infoCard(t("COST", "CUSTO"), t("Age-based costs", "Custos por Era"), [
          `${icon("age-cost", t("A coin", "moeda A"))} ${t("A Leader whose cost shows a coin with an “A” costs as many coins as the current Age when recruited:", "Um Líder cujo custo mostra uma moeda com “A” custa tantas moedas quanto a Era atual ao ser recrutado:")}`,
          rl("Age I", "1 coin.", "Era I", "1 moeda."),
          rl("Age II", "2 coins.", "Era II", "2 moedas."),
          rl("Age III", "3 coins.", "Era III", "3 moedas.")
        ], ["L1"])}
        ${infoCard(t("SORTING", "SEPARAR"), t("The pack's cards", "As cartas do pack"), [
          `${icon("anniversary", t("candle 7 icon", "ícone 7 com vela"))} ${t("Every card of the pack has a 7 with a candle at the bottom centre.", "Toda carta do pack tem um 7 com vela no centro inferior.")}`,
          t("Some of the pack's cards can only be used with the Cities expansion; the leaflet does not say which.", "Algumas cartas do pack só podem ser usadas com a expansão Cities; o folheto não diz quais."),
          t("“Black cards” in Aganice's clarification are Cities cards: without Cities, ignore them.", "“Cartas pretas” no esclarecimento de Aganice são cartas de Cities: sem Cities, ignore-as.")
        ], ["L1", "L2"])}
        ${infoCard(t("COINS LOST", "MOEDAS PERDIDAS"), t("When a Leader takes coins", "Quando um Líder tira moedas"), [
          t("Arsinoe and Octavia make other players lose coins.", "Arsinoe e Octavia fazem outros jogadores perderem moedas."),
          interpretation("the leaflet does not say what happens to a player with too few coins; they lose what they have (with Cities, follow its rules for losing coins).", "o folheto não diz o que acontece com quem tem poucas moedas; ele perde o que tem (com Cities, siga as regras dela para perda de moedas)."),
          interpretation("the leaflet does not time the loss within a simultaneous turn; take the coins after everyone has finished acting, like coins earned through commerce, so a payment already made that turn is never undone.", "o folheto não diz em que momento do turno simultâneo a perda acontece; tire as moedas depois que todos terminaram de agir, como as moedas ganhas no comércio, para que um pagamento já feito no turno nunca seja desfeito.")
        ], ["L2"])}
      </div>
      <div class="sw-leader-grid">${leaderData().map((leader) => `
        <article class="info-card sw-leader ${leader.color ? `sw-leader-${leader.color}` : ""}" id="leader-${leader.id}">
          <div class="sw-leader-head"><h3>${leader.name}</h3><span class="component-label">${timing[leader.when]}</span></div>
          <p>${leader.text}</p>
          ${leader.id === "gorgo" ? `<p class="sw-note">${t("Example: two +3 tokens → 3 VP; four +1 tokens → two pairs → 2 VP.", "Exemplo: duas fichas +3 → 3 PV; quatro fichas +1 → dois pares → 2 PV.")} ${interpretation("each token belongs to one pair only.", "cada ficha só entra em um par.")}</p>` : ""}
          ${leader.id === "telesilla" ? `<p class="sw-note">${interpretation("a player with no Victory token discards nothing.", "um jogador sem ficha de Vitória não descarta nada.")}</p>` : ""}
          ${leader.id === "enheduanna" ? `<p class="sw-note">${t("Example: Giza has two Compasses, one Tablet and one Gear: Enheduanna gives a Compass.", "Exemplo: Gizé tem dois Compassos, uma Tábua e uma Engrenagem: Enheduanna dá um Compasso.")}</p>` : ""}
          ${referenceLink(leader.page)}
        </article>`).join("")}</div>`;
  }

  // ---------- card list ----------

  function cardsSection() {
    const all = cardData();
    const byId = Object.fromEntries(all.map((card) => [card.id, card]));
    const colorOrder = ["brown", "gray", "blue", "yellow", "red", "green", "purple"];
    const ageBlock = (age) => {
      const cards = all.filter((card) => card.age === age && inGame(card));
      const out = all.filter((card) => card.age === age && !inGame(card));
      const groups = colorOrder.map((color) => {
        const list = cards.filter((card) => card.color === color);
        if (!list.length) {
          return "";
        }
        const lines = list.map((card) => {
          const copies = card.guild
            ? t("×1 if drawn", "×1 se sorteada")
            : `×${copiesIn(card)}`;
          const marks = card.guild ? "" : ` <span class="sw-marks">${card.n.filter((m) => m <= deckCount()).map((m) => `${m}+`).join(" ")}</span>`;
          const from = (card.from || []).filter((id) => inGame(byId[id])).map((id) => byId[id].en);
          const to = all.filter((other) => (other.from || []).includes(card.id) && inGame(other)).map((other) => other.en);
          const chainText = [
            from.length ? t(`Free if you built ${from.join(" or ")}.`, `Grátis se você construiu ${from.join(" ou ")}.`) : "",
            to.length ? t(`Makes free: ${to.join(", ")}.`, `Torna grátis: ${to.join(", ")}.`) : ""
          ].filter(Boolean).join(" ");
          return `<strong>${cardName(card)}</strong> <span class="sw-copies">${copies}</span>${marks} — ${card.fx}${chainText ? ` <span class="sw-chain">${chainText}</span>` : ""}`;
        });
        return `
          <article class="info-card sw-cardgroup sw-group-${color}">
            <span class="component-label">${colorBadge(color)} ${t(COLORS[color][0], COLORS[color][1])}</span>
            ${color === "purple" ? `<p class="sw-note">${t(`${guildCount()} of these 10 Guilds are drawn at random for this match.`, `${guildCount()} destas 10 Guildas são sorteadas para esta partida.`)}</p>` : ""}
            ${lineList(lines)}
          </article>`;
      }).join("");
      const outNote = out.length
        ? `<p class="sw-note">${t(`Not used with ${twoPlayer() ? "2 (3-player cards)" : players()} players: ${out.map((card) => card.en).join(", ")}.`, `Não usadas com ${twoPlayer() ? "2 (cartas de 3)" : players()} jogadores: ${out.map((card) => card.en).join(", ")}.`)}</p>`
        : "";
      return `
        <h3 class="subhead">${t(`Age ${["I", "II", "III"][age - 1]}`, `Era ${["I", "II", "III"][age - 1]}`)} · ${t(`${7 * deckCount()} cards`, `${7 * deckCount()} cartas`)}</h3>
        ${outNote}
        <div class="sw-cardgroup-grid">${groups}</div>`;
    };
    return `
      ${sectionHeading("cards", t("Card list & chains", "Lista de cartas e encadeamentos"), sectionIndex("cards"), [10, 11, 12])}
      <p class="glossary-intro">${t(
        `Every structure in this match, from the rulebook's card list. ×N is the number of copies in this game's deck (the marks after it are the player counts printed on those copies). Costs are printed on the cards. The Age III deck has no brown or gray cards, but holds the Guilds.${twoPlayer() ? " With 2 players only the 3+ copies are used." : ""}`,
        `Toda estrutura desta partida, da lista de cartas do manual. ×N é o número de cópias no baralho desta partida (as marcas depois dele são os números de jogadores impressos nessas cópias). Os custos estão impressos nas cartas. O baralho da Era III não tem cartas marrons nem cinza, mas tem as Guildas.${twoPlayer() ? " Com 2 jogadores só as cópias 3+ são usadas." : ""}`
      )}</p>
      ${ageBlock(1)}
      ${ageBlock(2)}
      ${ageBlock(3)}`;
  }

  // ---------- iconography ----------

  function iconsSection() {
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), sectionIndex("icons"), leaders() ? [5, 12, "L1"] : [5, 12])}
      <p class="glossary-intro">${t("The symbols printed on the cards, each cropped individually from the rulebook's symbol page.", "Os símbolos impressos nas cartas, cada um recortado individualmente da página de símbolos do manual.")} ${referenceLink(12)}</p>
      <h3 class="subhead">${t("Resources", "Recursos")}</h3>
      <div class="icon-grid">
        ${iconCard("clay", "Clay", "Raw material produced by brown cards (and Babylon's board).", "Argila", "Matéria-prima produzida por cartas marrons (e pelo tabuleiro da Babilônia).", 12)}
        ${iconCard("ore", "Ore", "Raw material.", "Minério", "Matéria-prima.", 12)}
        ${iconCard("stone", "Stone", "Raw material.", "Pedra", "Matéria-prima.", 12)}
        ${iconCard("wood", "Wood", "Raw material.", "Madeira", "Matéria-prima.", 12)}
        ${iconCard("raw-either", "One or the other", "The card produces one of the two pictured raw materials each turn — you use one OR the other, never both. Neighbors may buy either one.", "Um ou outro", "A carta produz uma das duas matérias-primas mostradas por turno — você usa uma OU outra, nunca as duas. Os vizinhos podem comprar qualquer uma.", 12)}
        ${iconCard("two-raw", "Two of a resource", "Age II brown cards produce two units of the pictured raw material.", "Dois de um recurso", "Cartas marrons da Era II produzem duas unidades da matéria-prima mostrada.", 12)}
        ${iconCard("glass", "Glass", "Manufactured good produced by gray cards.", "Vidro", "Produto manufaturado produzido por cartas cinza.", 12)}
        ${iconCard("loom", "Textile (Loom)", "Manufactured good. The symbol page calls it Loom; elsewhere the rulebook says Textile.", "Tecido (Tear)", "Produto manufaturado. A página de símbolos o chama de Loom (tear); no resto o manual diz Textile (tecido).", 12)}
        ${iconCard("papyrus", "Papyrus", "Manufactured good.", "Papiro", "Produto manufaturado.", 12)}
      </div>
      <h3 class="subhead">${t("Points, Shields, coins and science", "Pontos, Escudos, moedas e ciência")}</h3>
      <div class="icon-grid">
        ${iconCard("victory-points", "Victory points", "The card is worth the number of VP shown inside the laurel.", "Pontos de vitória", "A carta vale o número de PV mostrado dentro dos louros.", 12)}
        ${iconCard("shield", "1 Shield", "Military strength used in conflict resolution.", "1 Escudo", "Força militar usada na resolução de conflitos.", 12)}
        ${iconCard("two-shields", "2 Shields", "Age II red cards.", "2 Escudos", "Cartas vermelhas da Era II.", 12)}
        ${iconCard("three-shields", "3 Shields", "Age III red cards.", "3 Escudos", "Cartas vermelhas da Era III.", 12)}
        ${iconCard("coin", "Coins", "Take the coins shown from the bank, only once, when the card is played. On a cost: pay that many coins.", "Moedas", "Pegue do banco as moedas mostradas, só uma vez, quando a carta é jogada. Num custo: pague essa quantidade.", 12)}
        ${iconCard("compass", "Compass (scientific symbol)", "Counts when scoring science.", "Compasso (símbolo científico)", "Conta na pontuação de ciência.", 12)}
        ${iconCard("gear", "Gear (scientific symbol)", "Counts when scoring science.", "Engrenagem (símbolo científico)", "Conta na pontuação de ciência.", 12)}
        ${iconCard("tablet", "Tablet (scientific symbol)", "Counts when scoring science.", "Tábua (símbolo científico)", "Conta na pontuação de ciência.", 12)}
      </div>
      <h3 class="subhead">${t("Commerce and yellow cards", "Comércio e cartas amarelas")}</h3>
      <div class="icon-grid">
        ${iconCard("east-trading-post", "East Trading Post", "From the turn after it is built: raw materials from your right-hand neighbor cost 1 coin instead of 2. The arrow shows the neighbor.", "Entreposto Leste", "A partir do turno seguinte ao da construção: matérias-primas do vizinho da direita custam 1 moeda em vez de 2. A seta indica o vizinho.", 12)}
        ${iconCard("west-trading-post", "West Trading Post", "From the turn after it is built: raw materials from your left-hand neighbor cost 1 coin instead of 2.", "Entreposto Oeste", "A partir do turno seguinte ao da construção: matérias-primas do vizinho da esquerda custam 1 moeda em vez de 2.", 12)}
        ${iconCard("marketplace", "Marketplace", "From the turn after it is built: manufactured goods from both neighbors cost 1 coin instead of 2.", "Mercado", "A partir do turno seguinte ao da construção: produtos manufaturados dos dois vizinhos custam 1 moeda em vez de 2.", 12)}
        ${iconCard("caravansery", "Any raw material (Caravansery)", "Each turn, one unit of one of the four raw materials, your choice. Neighbors cannot buy it.", "Qualquer matéria-prima (Caravançará)", "Por turno, uma unidade de uma das quatro matérias-primas, à sua escolha. Os vizinhos não podem comprá-la.", 12)}
        ${iconCard("forum", "Any manufactured good (Forum)", "Each turn, one unit of one of the three manufactured goods, your choice. Neighbors cannot buy it.", "Qualquer produto manufaturado (Fórum)", "Por turno, uma unidade de um dos três produtos manufaturados, à sua escolha. Os vizinhos não podem comprá-la.", 12)}
        ${iconCard("vineyard", "Vineyard", "1 coin per brown card in your city and both neighboring cities (cards they build the same turn count).", "Vinhedo", "1 moeda por carta marrom na sua cidade e nas duas vizinhas (cartas que eles constroem no mesmo turno contam).", 12)}
        ${iconCard("bazar", "Bazar", "2 coins per gray card in your city and both neighboring cities (same-turn ones count).", "Bazar", "2 moedas por carta cinza na sua cidade e nas duas vizinhas (as do mesmo turno contam).", 12)}
        ${iconCard("haven", "Haven", "1 coin per brown card in your city when built; 1 VP per brown card at the end.", "Porto", "1 moeda por carta marrom na sua cidade ao construir; 1 PV por carta marrom no fim.", 12)}
        ${iconCard("lighthouse", "Lighthouse", "1 coin per yellow card you had already played when built; 1 VP per yellow card at the end.", "Farol", "1 moeda por carta amarela que você já tinha jogado ao construir; 1 PV por carta amarela no fim.", 12)}
        ${iconCard("chamber-of-commerce", "Chamber of Commerce", "2 coins per gray card in your city when built; 2 VP per gray card at the end.", "Câmara de Comércio", "2 moedas por carta cinza na sua cidade ao construir; 2 PV por carta cinza no fim.", 12)}
        ${iconCard("arena", "Arena", "3 coins per Wonder stage built when it comes into play; 1 VP per Wonder stage at the end.", "Arena", "3 moedas por estágio de Maravilha construído quando entra em jogo; 1 PV por estágio no fim.", 12)}
      </div>
      <h3 class="subhead">${t("Guilds", "Guildas")}</h3>
      <p class="glossary-intro">${t("Arrows on both sides of the pictured card: the neighboring cities' cards count, not yours. An arrow below too (Builders Guild): your own city counts as well.", "Setas dos dois lados da carta ilustrada: contam as cartas das cidades vizinhas, não as suas. Com seta embaixo também (Guilda dos Construtores): sua cidade também conta.")}</p>
      <div class="icon-grid">
        ${iconCard("workers-guild", "Workers Guild", "1 VP per brown card in the neighboring cities.", "Guilda dos Trabalhadores", "1 PV por carta marrom nas cidades vizinhas.", 12)}
        ${iconCard("craftsmens-guild", "Craftsmens Guild", "2 VP per gray card in the neighboring cities.", "Guilda dos Artesãos", "2 PV por carta cinza nas cidades vizinhas.", 12)}
        ${iconCard("traders-guild", "Traders Guild", "1 VP per yellow card in the neighboring cities.", "Guilda dos Comerciantes", "1 PV por carta amarela nas cidades vizinhas.", 12)}
        ${iconCard("philosophers-guild", "Philosophers Guild", "1 VP per green card in the neighboring cities.", "Guilda dos Filósofos", "1 PV por carta verde nas cidades vizinhas.", 12)}
        ${iconCard("spies-guild", "Spies Guild", "1 VP per red card in the neighboring cities.", "Guilda dos Espiões", "1 PV por carta vermelha nas cidades vizinhas.", 12)}
        ${iconCard("magistrates-guild", "Magistrates Guild", "1 VP per blue card in the neighboring cities.", "Guilda dos Magistrados", "1 PV por carta azul nas cidades vizinhas.", 12)}
        ${iconCard("strategists-guild", "Strategists Guild", "1 VP per Defeat token in the neighboring cities.", "Guilda dos Estrategistas", "1 PV por ficha de Derrota nas cidades vizinhas.", 12)}
        ${iconCard("shipowners-guild", "Shipowners Guild", "1 VP per brown, gray and purple card in your own city, this Guild included.", "Guilda dos Armadores", "1 PV por carta marrom, cinza e roxa na sua cidade, esta Guilda incluída.", 12)}
        ${iconCard("builders-guild", "Builders Guild", "1 VP per Wonder stage built in the neighboring cities and in your own.", "Guilda dos Construtores", "1 PV por estágio de Maravilha construído nas cidades vizinhas e na sua.", 12)}
        ${iconCard("scientists-guild", "Scientists Guild", "One scientific symbol of your choice, chosen at the end of the game.", "Guilda dos Cientistas", "Um símbolo científico à sua escolha, escolhido no fim da partida.", 12)}
      </div>
      <h3 class="subhead">${t("Conflict tokens and passing", "Fichas de Conflito e passagem")}</h3>
      <div class="icon-grid">
        ${iconCard("victory-token", "Victory token", "Won against a neighbor with fewer Shields at the end of an Age: +1 (Age I), +3 (Age II), +5 (Age III; this one is pictured).", "Ficha de Vitória", "Ganha contra um vizinho com menos Escudos no fim de uma Era: +1 (Era I), +3 (Era II), +5 (Era III; esta é a mostrada).", 5)}
        ${iconCard("defeat-token", "Defeat token", "−1 VP, taken against a neighbor with more Shields, in every Age.", "Ficha de Derrota", "−1 PV, recebida contra um vizinho com mais Escudos, em toda Era.", 5)}
        ${twoPlayer() ? "" : iconCard("pass-left", "Pass left (clockwise)", "Ages I and III: hands go to the player on your left.", "Passe à esquerda (sentido horário)", "Eras I e III: as mãos vão para o jogador à sua esquerda.", 5)}
        ${twoPlayer() ? "" : iconCard("pass-right", "Pass right (counter-clockwise)", "Age II: hands go to the player on your right.", "Passe à direita (sentido anti-horário)", "Era II: as mãos vão para o jogador à sua direita.", 5)}
      </div>
      ${leaders() ? `
      <h3 class="subhead">${t("Leaders Anniversary Pack", "Leaders Anniversary Pack")}</h3>
      <div class="icon-grid">
        ${iconCard("age-cost", "Age-based cost", "In a Leader's cost: pay coins equal to the current Age when you recruit it (1, 2 or 3).", "Custo por Era", "No custo de um Líder: pague moedas iguais à Era atual ao recrutá-lo (1, 2 ou 3).", "L1")}
        ${iconCard("anniversary", "Anniversary Pack mark", "Printed at the bottom centre of every card of the pack, to sort them after playing.", "Marca do Anniversary Pack", "Impressa no centro inferior de toda carta do pack, para separá-las depois de jogar.", "L1")}
      </div>` : ""}`;
  }

  // ---------- examples ----------

  function examplesSection() {
    const examples = [
      [t("Reading costs", "Ler custos"), [
        t("Marketplace: free. Mine: 1 coin. Baths: 1 Stone. Arena: 2 Stone + 1 Ore.", "Mercado: grátis. Mina: 1 moeda. Termas: 1 Pedra. Arena: 2 Pedras + 1 Minério."),
        t("Stables: 1 Clay + 1 Wood + 1 Ore — or free if you own the Apothecary.", "Estábulos: 1 Argila + 1 Madeira + 1 Minério — ou grátis se você tem o Boticário.")
      ], 3],
      [t("Production is not spent", "A produção não é gasta"), [
        t("Giza produces 2 Stone, 1 Clay, 1 Ore, 1 Papyrus and 1 Textile.", "Gizé produz 2 Pedras, 1 Argila, 1 Minério, 1 Papiro e 1 Tecido."),
        t("It can build the Barracks (1 Ore) or the Scriptorium (1 Papyrus).", "Pode construir o Quartel (1 Minério) ou o Scriptorium (1 Papiro)."),
        t("It cannot build the Aqueduct (3 Stone): it produces only 2.", "Não pode construir o Aqueduto (3 Pedras): só produz 2.")
      ], 4],
      [t("Buying from both sides", "Comprar dos dois lados"), [
        t("She wants the University (2 Wood + 1 Glass + 1 Papyrus) and makes 1 Wood and 1 Glass.", "Ela quer a Universidade (2 Madeiras + 1 Vidro + 1 Papiro) e produz 1 Madeira e 1 Vidro."),
        t("One neighbor produces Wood, the other Papyrus: she pays 2 coins to each and builds.", "Um vizinho produz Madeira, o outro Papiro: ela paga 2 moedas a cada um e constrói.")
      ], 4],
      [t("Selling doesn't block you", "Vender não bloqueia você"), [
        t("Both neighbors buy 2 Stone from her this turn: 8 coins in all.", "Os dois vizinhos compram 2 Pedras dela neste turno: 8 moedas no total."),
        t("Same turn, she still builds the Library (2 Stone + 1 Textile) with those Stones.", "No mesmo turno ela ainda constrói a Biblioteca (2 Pedras + 1 Tecido) com essas Pedras.")
      ], 4],
      [t("New coins wait a turn", "Moedas novas esperam um turno"), [
        t("She wants the Forum (2 Clay), makes 1 Clay, and a neighbor sells Clay — but she starts the turn without enough coins.", "Ela quer o Fórum (2 Argilas), produz 1 Argila e um vizinho vende Argila — mas começa o turno sem moedas suficientes."),
        t("Coins a neighbor pays her this turn can't be used now: no Forum this turn.", "Moedas que um vizinho lhe paga neste turno não podem ser usadas agora: nada de Fórum neste turno.")
      ], 4],
      [t("Chains", "Encadeamentos"), [
        t("Scriptorium in Age I → Library and Courthouse free in Age II.", "Scriptorium na Era I → Biblioteca e Tribunal grátis na Era II."),
        t("Theater (Age I) → Statue free (Age II) → Gardens free (Age III).", "Teatro (Era I) → Estátua grátis (Era II) → Jardins grátis (Era III).")
      ], 4],
      [t("Building a Wonder stage", "Construir um estágio da Maravilha"), [
        t("Alexandria's player wants stage 2 and chooses any card from his hand.", "O jogador de Alexandria quer o estágio 2 e escolhe qualquer carta da mão."),
        t("His city produces the 2 Ore that stage costs, so he tucks the card under that stage.", "Sua cidade produz os 2 Minérios que o estágio custa, então ele encaixa a carta sob esse estágio.")
      ], 5],
      twoPlayer() ? null : [t("Passing hands", "Passar as mãos"), [
        t("Sophie gets 7 cards in Age I and plays one on turn 1.", "Sophie recebe 7 cartas na Era I e joga uma no turno 1."),
        t("She hands the other 6 to the player on her left and takes 6 from the player on her right.", "Ela entrega as outras 6 ao jogador à esquerda e pega 6 do jogador à direita."),
        t("On turn 6 she gets 2 cards from her right, plays one and discards the other.", "No turno 6 ela recebe 2 cartas da direita, joga uma e descarta a outra.")
      ], 5],
      [t("Scoring military and coins", "Pontuar militar e moedas"), [
        t("Tokens +1, +3, +5, −1, −1, −1 = 6 VP.", "Fichas +1, +3, +5, −1, −1, −1 = 6 PV."),
        t("14 coins = 4 VP (4 sets of 3; the 2 left over score nothing).", "14 moedas = 4 PV (4 grupos de 3; as 2 que sobram não pontuam).")
      ], 6],
      [t("Scoring Wonder and civilian", "Pontuar Maravilha e civis"), [
        t("Alexandria built all 3 stages of side A: 3 + 7 = 10 VP (stage 2 is an ability).", "Alexandria construiu os 3 estágios do lado A: 3 + 7 = 10 PV (o estágio 2 é uma habilidade)."),
        t("Altar (2) + Aqueduct (5) + Town Hall (6) = 13 VP.", "Altar (2) + Aqueduto (5) + Prefeitura (6) = 13 PV.")
      ], 6],
      [t("Scoring science", "Pontuar ciência"), [
        t("3 Tablets, 2 Compasses, 1 Gear: 9 + 4 + 1 = 14, plus one set of 3 different = 7 → 21 VP.", "3 Tábuas, 2 Compassos, 1 Engrenagem: 9 + 4 + 1 = 14, mais um trio diferente = 7 → 21 PV."),
        t("One more Gear: (9 + 4 + 4) + (7 + 7) = 31 VP.", "Uma Engrenagem a mais: (9 + 4 + 4) + (7 + 7) = 31 PV.")
      ], 6],
      [t("Scoring a commercial card", "Pontuar uma carta comercial"), [
        t("Chamber of Commerce: 2 VP per gray card. With 2 gray cards: 4 VP.", "Câmara de Comércio: 2 PV por carta cinza. Com 2 cartas cinza: 4 PV.")
      ], 6]
    ];
    if (twoPlayer()) {
      examples.push([t("A 2-player turn", "Um turno a 2 jogadores"), [
        t("Ludwig and Peter each get 7 cards; the other 7 form the Free City pile right of the Border card.", "Ludwig e Peter recebem 7 cartas cada; as outras 7 formam a pilha da Cidade Livre à direita da carta de Fronteira."),
        t("Ludwig has the Free City on his right, so he takes the Free City card.", "Ludwig tem a Cidade Livre à sua direita, então pega a carta da Cidade Livre."),
        t("Turn 1: Peter picks a card. Ludwig draws the Free City pile's top card and picks one card for the Free City and one for himself.", "Turno 1: Peter escolhe uma carta. Ludwig compra a carta do topo da pilha da Cidade Livre e escolhe uma carta para a Cidade Livre e uma para si."),
        t("Cards are revealed and played, the Free City's first. Then they swap stacks across the Border: Peter now has the Free City card and plays for it on turn 2.", "As cartas são reveladas e jogadas, a da Cidade Livre primeiro. Depois trocam as pilhas pela Fronteira: Peter agora tem a carta da Cidade Livre e joga por ela no turno 2.")
      ], 7]);
    }
    if (leaders()) {
      examples.push([t("Enheduanna", "Enheduanna"), [
        t("Giza has two Compasses, one Tablet and one Gear.", "Gizé tem dois Compassos, uma Tábua e uma Engrenagem."),
        t("Enheduanna adds a Compass: 3 Compasses → 9 + 1 + 1 + 7 = 18 VP of science.", "Enheduanna acrescenta um Compasso: 3 Compassos → 9 + 1 + 1 + 7 = 18 PV de ciência.")
      ], "L2"]);
      examples.push([t("Telesilla on a Victory turn", "Telesilla num turno de Vitória"), [
        t("A card you play the same turn as Telesilla grants you a Military Victory token.", "Uma carta que você joga no mesmo turno de Telesilla lhe dá uma ficha de Vitória militar."),
        t("Take that token first; then the other players each discard one Victory token, and you discard all your Defeat tokens.", "Pegue essa ficha primeiro; depois cada outro jogador descarta uma ficha de Vitória, e você descarta todas as suas fichas de Derrota.")
      ], "L3"]);
    }
    const shown = examples.filter(Boolean);
    const pages = [...new Set(shown.map((example) => example[2]))];
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), sectionIndex("examples"), pages)}
      <div class="example-grid">${shown.map(([title, items, page], index) => `
        <article class="example-card">
          <span class="card-number">${String(index + 1).padStart(2, "0")}</span>
          <h3>${title}</h3>
          ${lineList(items)}
          <div class="example-source"><span>${String(page).startsWith("L") ? t("From the Leaders leaflet", "Do folheto de Leaders") : t("From the rulebook's examples", "Dos exemplos do manual")}</span>${referenceLink(page)}</div>
        </article>`).join("")}</div>`;
  }

  // ---------- glossary ----------

  function glossarySection() {
    const visible = [
      { term: ["Age", "Era"], text: ["One of the three parts of the game (I, II, III), each with its own deck, 6 turns and a military conflict at the end.", "Uma das três partes da partida (I, II, III), cada uma com seu baralho, 6 turnos e um conflito militar no fim."], page: 2 },
      { term: ["Bank", "Banco"], text: ["The coins not in any treasury. Coins paid for costs go here; coins gained come from here.", "As moedas fora de qualquer tesouro. Moedas pagas em custos vão para cá; moedas ganhas vêm daqui."], page: 3 },
      { term: ["Chain (free construction)", "Encadeamento (construção gratuita)"], text: ["Building an Age II or III structure for free because you built the earlier structure named next to its cost.", "Construir uma estrutura da Era II ou III de graça porque você construiu a estrutura anterior indicada ao lado do custo."], page: 4 },
      { term: ["City", "Cidade"], text: ["Your Wonder board plus every structure you built in front of it.", "Seu tabuleiro de Maravilha mais toda estrutura construída à frente dele."], page: 5 },
      { term: ["Commerce", "Comércio"], text: ["Buying a resource you lack from a neighboring city, normally for 2 coins paid to its owner.", "Comprar de uma cidade vizinha um recurso que falta, normalmente por 2 moedas pagas ao dono."], page: 4 },
      { term: ["Conflict tokens", "Fichas de Conflito"], text: ["Victory (+1/+3/+5) and Defeat (−1) tokens taken at the end of each Age against each neighbor.", "Fichas de Vitória (+1/+3/+5) e Derrota (−1) recebidas no fim de cada Era contra cada vizinho."], page: 3 },
      { term: ["Discard pile", "Pilha de descarte"], text: ["Face-down cards discarded for coins or at the end of an Age. Halicarnassus may build from it.", "Cartas viradas para baixo descartadas por moedas ou no fim de uma Era. Halicarnasso pode construir a partir dela."], page: 5 },
      { term: ["Guild", "Guilda"], text: twoPlayer() ? ["Purple Age III card scoring by its own rule, usually from neighbors' cities. With 2 players, 5 of the 10 are used (the 3-player configuration).", "Carta roxa da Era III que pontua pela própria regra, geralmente pelas cidades vizinhas. Com 2 jogadores, 5 das 10 são usadas (a configuração de 3 jogadores)."] : ["Purple Age III card scoring by its own rule, usually from neighbors' cities. Only players + 2 of the 10 are used.", "Carta roxa da Era III que pontua pela própria regra, geralmente pelas cidades vizinhas. Só jogadores + 2 das 10 são usadas."], page: 3 },
      { term: ["Manufactured goods", "Produtos manufaturados"], text: ["Glass, Textile and Papyrus, produced by gray cards.", "Vidro, Tecido e Papiro, produzidos por cartas cinza."], page: 3 },
      { term: ["Neighbor", "Vizinho"], text: ["The players sitting directly to your left and right. You trade with and fight only them.", "Os jogadores sentados imediatamente à sua esquerda e direita. Você só comercia e luta com eles."], page: 4 },
      { term: ["Raw materials", "Matérias-primas"], text: ["Wood, Stone, Clay and Ore, produced by brown cards.", "Madeira, Pedra, Argila e Minério, produzidos por cartas marrons."], page: 3 },
      { term: ["Shield", "Escudo"], text: ["Military strength on red cards (and Rhodes). Compared with each neighbor at the end of each Age.", "Força militar nas cartas vermelhas (e em Rodes). Comparada com cada vizinho no fim de cada Era."], page: 5 },
      { term: ["Structure", "Estrutura"], text: ["Any Age card built into your city. A card tucked under a Wonder stage is not a structure.", "Qualquer carta de Era construída na sua cidade. Uma carta encaixada sob um estágio da Maravilha não é estrutura."], page: 5 },
      { term: ["Treasury", "Tesouro"], text: ["The coins on your board. No limit; 1 VP per 3 coins at the end.", "As moedas no seu tabuleiro. Sem limite; 1 PV a cada 3 moedas no fim."], page: 3 },
      { term: ["Wonder stage", "Estágio da Maravilha"], text: ["One of the 2–4 sections of your board, built in order from left to right by paying its cost with any card as a marker.", "Uma das 2–4 seções do seu tabuleiro, construída em ordem da esquerda para a direita pagando seu custo com qualquer carta como marcador."], page: 5 }
    ];
    if (twoPlayer()) {
      visible.push({ term: ["Border card", "Carta de Fronteira"], text: ["Special 2-player card between the players; each puts their leftover hand on their side of it, and the stacks swap every turn.", "Carta especial de 2 jogadores entre os jogadores; cada um põe as cartas que sobram do seu lado dela, e as pilhas trocam todo turno."], page: 7 });
      visible.push({ term: ["Free City", "Cidade Livre"], text: ["The neutral third city of the 2-player variant, played in turn by both players.", "A terceira cidade neutra da variante de 2 jogadores, jogada em turnos pelos dois jogadores."], page: 7 });
    }
    if (leaders()) {
      visible.push({ term: ["Leader", "Líder"], text: ["White card from the Leaders expansion. Recruiting it follows the Leaders rulebook; the Anniversary Pack adds 15 of them.", "Carta branca da expansão Leaders. Recrutá-la segue o manual de Leaders; o Anniversary Pack acrescenta 15 delas."], page: "L1" });
    }
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    const pages = [...new Set(visible.map((item) => item.page))];
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), sectionIndex("glossary"), pages)}
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
    document.body.classList.add("theme-seven-wonders");
    document.documentElement.lang = state.language;
    document.title = t("7 Wonders — Field Manual", "7 Wonders — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for 7 Wonders: 2–7 players (with the 2-player Free City variant), a match-filtered setup checklist, quick reference, every card, chain and Wonder, scoring with a science calculator, and the Leaders Anniversary Pack.",
        "Regras interativas bilíngues de 7 Wonders: 2–7 jogadores (com a variante da Cidade Livre para 2), lista de preparação filtrada, referência rápida, todas as cartas, encadeamentos e Maravilhas, pontuação com calculadora de ciência e o Leaders Anniversary Pack."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook · base game + Leaders Anniversary Pack", "Livro interativo · jogo base + Leaders Anniversary Pack")}</p>
          <h1>7 Wonders</h1>
          <p class="hero-intro">${t(
            "Lead one of the seven great cities of the Ancient world. Over three Ages, keep one card at a time from hands passed around the table: exploit your lands, trade with your neighbors, build your army and science — and raise a Wonder that will outlast the ages.",
            "Lidere uma das sete grandes cidades do mundo antigo. Ao longo de três Eras, fique com uma carta por vez de mãos que circulam pela mesa: explore suas terras, comercie com os vizinhos, desenvolva exército e ciência — e erga uma Maravilha que atravessará as eras."
          )}</p>
          <div class="hero-meta"><span>${t("2–7 players", "2–7 jogadores")}</span><span>${t("3 Ages · 6 turns each", "3 Eras · 6 turnos cada")}</span><span>${t("Card drafting · simultaneous play", "Draft de cartas · jogo simultâneo")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/7-wonders.webp" alt="${t("Cover of the 7 Wonders rulebook: the Colossus of Rhodes over a harbour, with the Pyramids, the Lighthouse, the Mausoleum and the Statue of Zeus behind", "Capa do manual de 7 Wonders: o Colosso de Rodes sobre um porto, com as Pirâmides, o Farol, o Mausoléu e a Estátua de Zeus ao fundo")}" fetchpriority="high"><figcaption>${t("Rulebook cover · game by Antoine Bauza, art by Miguel Coimbra", "Capa do manual · jogo de Antoine Bauza, arte de Miguel Coimbra")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("The seven cities", "As sete cidades")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column sw-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied 7 Wonders rulebook (Repos Production, 2010 English edition): the game for 3–7 players, the “Expert” 2-player variant, both Wonder sides and the full card list; and the supplied 7 Wonders Leaders Anniversary Pack leaflet (2017). The Leaders expansion's own rulebook, Cities and other expansions are not supplied and not covered. Points marked “Guide's reading” are interpretations where the sources are silent. Page links open the PDFs at the cited page (rulebook pages match its printed numbers).",
            "Este guia cobre o manual fornecido de 7 Wonders (Repos Production, edição inglesa de 2010): o jogo para 3–7 jogadores, a variante “Expert” para 2, os dois lados das Maravilhas e a lista completa de cartas; e o folheto fornecido do 7 Wonders Leaders Anniversary Pack (2017). O manual próprio da expansão Leaders, Cities e outras expansões não foram fornecidos e não são cobertos. Pontos marcados como “Leitura do guia” são interpretações onde as fontes são omissas. Os links abrem os PDFs na página citada (as páginas do manual seguem a numeração impressa)."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${turnSection()}</section>
          <section class="rule-section">${buildingSection()}</section>
          <section class="rule-section">${militarySection()}</section>
          <section class="rule-section">${scoringSection()}</section>
          <section class="rule-section">${wondersSection()}</section>
          ${twoPlayer() ? `<section class="rule-section">${twoPlayerSection()}</section>` : ""}
          ${leaders() ? `<section class="rule-section">${leadersSection()}</section>` : ""}
          <section class="rule-section">${cardsSection()}</section>
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the 7 Wonders rulebook and the 7 Wonders Leaders Anniversary Pack leaflet. Author: Antoine Bauza; development: Cédrick Caumont & Thomas Provoost; art: Miguel Coimbra (Anniversary Pack: Étienne Hebinger, Dimitri Chappuis & Miguel Coimbra). © Repos Production 2010, 2017.",
        "Guia pessoal de consulta baseado no manual de 7 Wonders e no folheto do 7 Wonders Leaders Anniversary Pack. Autor: Antoine Bauza; desenvolvimento: Cédrick Caumont & Thomas Provoost; arte: Miguel Coimbra (Anniversary Pack: Étienne Hebinger, Dimitri Chappuis & Miguel Coimbra). © Repos Production 2010, 2017."
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
    if (button.dataset.sci) {
      const key = button.dataset.sci;
      const max = { compass: 9, gear: 9, tablet: 9, wild: 3, aganice: 1, enheduanna: 1 }[key];
      if (max !== undefined) {
        science[key] = Math.max(0, Math.min(max, science[key] + Number(button.dataset.delta || 0)));
        refreshCalc(key, Number(button.dataset.delta) > 0 ? 1 : -1);
      }
      return;
    }
    if (button.hasAttribute("data-sci-reset")) {
      science = { compass: 0, gear: 0, tablet: 0, wild: 0, aganice: 0, enheduanna: 0 };
      refreshCalc();
      return;
    }
    if (button.dataset.scroll) {
      document.getElementById(button.dataset.scroll)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function refreshCalc(key, direction) {
    const host = root?.querySelector("#sw-science-calc");
    if (!host) {
      return;
    }
    host.innerHTML = scienceCalcInner();
    if (key) {
      const same = host.querySelector(`[data-sci="${key}"][data-delta="${direction}"]`);
      const other = host.querySelector(`[data-sci="${key}"][data-delta="${-direction}"]`);
      (same && !same.disabled ? same : other)?.focus();
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
      root.querySelector(".sw-page")?.prepend(notice);
    }
    notice.textContent = storageNoticeText();
  }

  const OPTION_INPUTS = {
    players: PLAYER_COUNTS,
    wonders: WONDER_MODES,
    reveal: REVEAL_MODES,
    leaders: LEADER_MODES
  };

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !root || !root.contains(target)) {
      return;
    }
    const option = Object.keys(OPTION_INPUTS).find((key) => target.dataset[key] !== undefined);
    if (option && target.type === "radio") {
      const value = target.dataset[option];
      if (OPTION_INPUTS[option].includes(value) && value !== state[option]) {
        const before = signature();
        state = normalizePreferences({ ...state, [option]: value });
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

  window.SevenWonders = { renderInto, onClick, onChange };
})();
