(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.galileo-galilei.v1";
  const SETUP_KEY = "field-manual.galileo-galilei.setup.v1";
  const MANUAL_FILE = "galileo-galilei_core.pdf";
  const ICONS = "assets/galileo-galilei/icons/";

  const ASTRONOMERS = ["galileo", "kepler", "copernicus", "bruno"];
  const PLAYER_COUNTS = ["1", "2", "3", "4"];
  const DECK = { 1: [9, 5, 4], 2: [9, 5, 4], 3: [10, 6, 5], 4: [12, 7, 6] };
  const defaults = {
    language: "pt-BR",
    players: "2",
    mode: "basic",
    astronomers: { galileo: false, kepler: false, copernicus: false, bruno: false }
  };
  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------

  function normalizePreferences(saved) {
    const players = PLAYER_COUNTS.includes(String(saved?.players)) ? String(saved.players) : defaults.players;
    const mode = players === "1" ? "advanced" : saved?.mode === "advanced" ? "advanced" : "basic";
    const astronomers = {};
    ASTRONOMERS.forEach((id) => {
      astronomers[id] = mode === "advanced" && saved?.astronomers?.[id] === true;
    });
    return {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      players,
      mode,
      astronomers
    };
  }

  function signature(source = state) {
    const astros = ASTRONOMERS.filter((id) => source.astronomers[id]).join("+");
    return `${source.players}|${source.mode}|${astros}`;
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Galileo Galilei preferences.", error);
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
      console.error("Could not read Galileo Galilei setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Galileo Galilei preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Galileo Galilei setup progress.", error);
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

  function isSolo() {
    return state.players === "1";
  }

  function isAdvanced() {
    return state.mode === "advanced";
  }

  function selectedAstronomers() {
    return ASTRONOMERS.filter((id) => state.astronomers[id]);
  }

  function neededAstronomers() {
    return Number(state.players);
  }

  function has(id) {
    return isAdvanced() && state.astronomers[id];
  }

  function configComplete() {
    return !isAdvanced() || selectedAstronomers().length === neededAstronomers();
  }

  function deckPlayers() {
    return isSolo() ? 2 : Number(state.players);
  }

  function astronomerName(id) {
    return {
      galileo: "Galileo Galilei",
      kepler: "Johannes Kepler",
      copernicus: t("Nicolaus Copernicus", "Nicolau Copérnico"),
      bruno: "Giordano Bruno"
    }[id];
  }

  function manualUrl(page) {
    const script = document.querySelector('script[src*="galileo-galilei.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${MANUAL_FILE}`, baseUrl).href}#page=${page}`;
  }

  function referenceLink(page) {
    return `<a class="source-link" href="${manualUrl(page)}" target="_blank" rel="noreferrer">${t(`Manual p. ${page} ↗`, `Manual p. ${page} ↗`)}</a>`;
  }

  function sectionHeading(id, title, index, pages) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("OBSERVATORY LOG", "DIÁRIO DO OBSERVATÓRIO")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="galileo-section-references">${pages.map(referenceLink).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
  }

  function icon(file, altEn, altPt) {
    return `<img class="galileo-inline-icon" src="${ICONS}${file}.webp" alt="${t(altEn, altPt)}">`;
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
    return `<span class="galileo-interpretation">${t("Guide's reading", "Leitura do guia")}</span> ${t(en, pt)}`;
  }

  function sectionList() {
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["victory", t("End & scoring", "Fim e pontuação")],
      ["turn", t("Turn & actions", "Turno e ações")],
      ["systems", t("Library, University, Inquisition", "Biblioteca, Universidade, Inquisição")],
      ...(isAdvanced() ? [["astronomers", t("Astronomers", "Astrônomos")]] : []),
      ...(isSolo() ? [["solo", t("Solo: Tycho Brahe", "Solo: Tycho Brahe")]] : []),
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
          <span class="brand-mark" aria-hidden="true">GG</span>
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
      `${readFailed ? "This browser could not read the saved Galileo Galilei match or setup progress; defaults are shown. " : ""}${writeFailed ? "The latest change could not be saved and is visible on screen only." : ""}`,
      `${readFailed ? "Este navegador não conseguiu ler a partida ou o progresso de Galileo Galilei salvos; as opções padrão estão sendo mostradas. " : ""}${writeFailed ? "A alteração mais recente não pôde ser salva e aparece somente na tela." : ""}`
    ).trim();
  }

  // ---------- configuration ----------

  function choiceCard(name, value, dataAttr, checked, title, description, disabled = false) {
    return `
      <label class="galileo-choice-card ${checked ? "is-selected" : ""} ${disabled ? "is-disabled" : ""}">
        <input type="radio" name="${name}" value="${value}" ${dataAttr} ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}>
        <span class="galileo-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function playersLabel(count = state.players) {
    return count === "1" ? t("Solo vs. Tycho Brahe", "Solo contra Tycho Brahe") : t(`${count} players`, `${count} jogadores`);
  }

  function matchConfiguration() {
    const playerChoices = [
      ["1", t("Solo · vs. Tycho Brahe", "Solo · contra Tycho Brahe"), t(
        "You against the automated rival Tycho Brahe, who uses his own Character Board, 5 Action tiles and 6 Movement tiles. The Discovery deck is built as for 2 players (9/5/4). Solo always uses the special-ability side of your Character Board.",
        "Você contra o rival automático Tycho Brahe, que usa seu próprio Tabuleiro de Personagem, 5 peças de Ação e 6 peças de Movimento. O baralho de Descobertas é montado como para 2 jogadores (9/5/4). O solo sempre usa o lado de habilidade especial do seu Tabuleiro de Personagem."
      )],
      ["2", t("2 players", "2 jogadores"), t(
        "Discovery deck: 9 Tier I + 5 Tier II + 4 Tier III cards (18). Only the first section of the Book of Comets is used.",
        "Baralho de Descobertas: 9 cartas Nível I + 5 Nível II + 4 Nível III (18). Só a primeira seção do Livro dos Cometas é usada."
      )],
      ["3", t("3 players", "3 jogadores"), t(
        "Discovery deck: 10 Tier I + 6 Tier II + 5 Tier III cards (21). The whole Book of Comets is used.",
        "Baralho de Descobertas: 10 cartas Nível I + 6 Nível II + 5 Nível III (21). O Livro dos Cometas inteiro é usado."
      )],
      ["4", t("4 players", "4 jogadores"), t(
        "Discovery deck: 12 Tier I + 7 Tier II + 6 Tier III cards (25). The whole Book of Comets is used.",
        "Baralho de Descobertas: 12 cartas Nível I + 7 Nível II + 6 Nível III (25). O Livro dos Cometas inteiro é usado."
      )]
    ];
    const modeChoices = [
      ["basic", t("Basic game · quadrant side", "Jogo básico · lado do quadrante"), t(
        "Character Boards face the side with the quadrant symbol: every astronomer is identical and only the four free actions are printed. Recommended for your first games. Not available in solo.",
        "Os Tabuleiros de Personagem ficam com o lado do símbolo de quadrante: todos os astrônomos são iguais e só as quatro ações livres aparecem. Recomendado para as primeiras partidas. Indisponível no solo."
      )],
      ["advanced", t("Advanced game · special abilities", "Jogo avançado · habilidades especiais"), t(
        "Flip the Character Boards to the ability side. Each astronomer adds a personal ability and may add components: Kepler's special Action tile, Copernicus's 4 Library tiles, Bruno's 5-space cellar tile, and personal Book of Comets pages. Choose below which astronomers are at the table.",
        "Vire os Tabuleiros de Personagem para o lado de habilidade. Cada astrônomo ganha uma habilidade pessoal e pode acrescentar componentes: a peça de Ação especial de Kepler, as 4 peças de Biblioteca de Copérnico, a peça de porão de 5 espaços de Bruno e páginas pessoais no Livro dos Cometas. Escolha abaixo quais astrônomos estão na mesa."
      )]
    ];
    const astroDescriptions = {
      galileo: t("Observes one extra constellation with each Observe action. Personal comet page: +2 Quadrants. No extra components.", "Observa uma constelação extra a cada ação Observar. Página pessoal de cometa: +2 Quadrantes. Sem componentes extras."),
      kepler: t("Starts with his special Action tile on the space before Upgrade; one basic tile waits on his Character Board. The special tile swaps Action tiles. No personal comet page.", "Começa com a peça de Ação especial no espaço antes de Aprimorar; uma peça básica fica no Tabuleiro de Personagem. A peça especial troca peças de Ação de lugar. Sem página pessoal de cometa."),
      copernicus: t("Takes the 4 double-sided Library tiles and may place one per turn in his Library for free. Personal comet page: Persuade two different inquisitors twice each.", "Recebe as 4 peças de Biblioteca dupla face e pode colocar uma por turno na Biblioteca, de graça. Página pessoal de cometa: Persuadir dois inquisidores diferentes duas vezes cada."),
      bruno: t("Covers his cellar with the 5-space cellar tile (harsher interrogations, but rewards on spaces 3 and 5). Two personal comet pages: Persuade 4 times; Upgrade a tile.", "Cobre o porão com a peça de porão de 5 espaços (interrogatórios mais duros, mas recompensas nos espaços 3 e 5). Duas páginas pessoais de cometa: Persuadir 4 vezes; Aprimorar uma peça.")
    };
    const astroSummary = isAdvanced()
      ? (selectedAstronomers().length ? selectedAstronomers().map(astronomerName).join(", ") : t("none yet", "nenhum ainda"))
      : "—";
    const needed = neededAstronomers();
    const chosen = selectedAstronomers().length;
    const astroGroups = isAdvanced() ? `
        <fieldset class="galileo-choice-group">
          <legend>${t("Astronomers at the table · selected:", "Astrônomos na mesa · selecionados:")} <span>${astroSummary} (${chosen}/${needed})</span></legend>
          <p class="galileo-choice-intro">${t(
            `Pick exactly ${needed} astronomer${needed === 1 ? "" : "s"} — ${isSolo() ? "your own" : "one per player"}. Who plays which astronomer is decided at the table “in any manner”; this only filters the special components and abilities shown below.`,
            `Escolha exatamente ${needed} astrônomo${needed === 1 ? "" : "s"} — ${isSolo() ? "o seu" : "um por jogador"}. Quem joga com qual astrônomo é decidido na mesa “de qualquer forma”; isto só filtra os componentes e habilidades especiais mostrados abaixo.`
          )}</p>
          <div class="galileo-astro-grid">${ASTRONOMERS.map((id) => `
            <div class="galileo-astro-group" role="radiogroup" aria-label="${astronomerName(id)}">
              <p class="galileo-astro-name"><strong>${astronomerName(id)}</strong><small>${astroDescriptions[id]}</small></p>
              <div class="galileo-yesno">
                ${choiceCard(`gg-astro-${id}`, "yes", `data-astro="${id}" data-astro-value="yes"`, state.astronomers[id], t("In play", "Em jogo"), t("Show his setup and ability.", "Mostrar preparação e habilidade."))}
                ${choiceCard(`gg-astro-${id}`, "no", `data-astro="${id}" data-astro-value="no"`, !state.astronomers[id], t("Not in play", "Fora da partida"), t("Leave his special components in the box.", "Deixar os componentes especiais na caixa."))}
              </div>
            </div>`).join("")}</div>
          ${configComplete() ? "" : `<p class="galileo-config-warning" role="status">${t(
            `Incomplete match: ${chosen} of ${needed} astronomers selected. Select exactly ${needed} before following the setup checklist.`,
            `Partida incompleta: ${chosen} de ${needed} astrônomos selecionados. Selecione exatamente ${needed} antes de seguir a lista de preparação.`
          )}</p>`}
        </fieldset>` : "";

    return `
      <section class="controls-panel galileo-config" id="build-match" aria-labelledby="galileo-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="galileo-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "The rulebook has one box and three ways to play: the basic game, the advanced game with special abilities, and the solo game against Tycho Brahe. Choices here filter the setup checklist, the Discovery deck size, and the rules shown below.",
              "O manual tem uma única caixa e três formas de jogar: o jogo básico, o jogo avançado com habilidades especiais e o solo contra Tycho Brahe. As escolhas aqui filtram a lista de preparação, o tamanho do baralho de Descobertas e as regras mostradas abaixo."
            )}</p>
          </div>
        </div>
        <fieldset class="galileo-choice-group">
          <legend>${t("Players · selected:", "Jogadores · selecionado:")} <span>${playersLabel()}</span></legend>
          <p class="galileo-choice-intro">${t("The table on the Game Board (marked ✱) sets the Discovery deck per player count.", "A tabela do Tabuleiro (marcada com ✱) define o baralho de Descobertas por número de jogadores.")} ${referenceLink(3)}</p>
          <div class="galileo-choice-grid galileo-choice-grid-4">${playerChoices.map(([value, title, desc]) => choiceCard("gg-players", value, `data-players="${value}"`, state.players === value, title, desc)).join("")}</div>
        </fieldset>
        <fieldset class="galileo-choice-group">
          <legend>${t("Character Boards · selected:", "Tabuleiros de Personagem · selecionado:")} <span>${isAdvanced() ? t("Advanced (special abilities)", "Avançado (habilidades especiais)") : t("Basic (quadrant side)", "Básico (lado do quadrante)")}</span></legend>
          <p class="galileo-choice-intro">${isSolo()
            ? t("Solo forces the special-ability side (p. 16), so the basic option is locked.", "O solo exige o lado de habilidade especial (p. 16), por isso a opção básica está bloqueada.")
            : t("Everyone uses the same side.", "Todos usam o mesmo lado.")} ${referenceLink(4)} ${referenceLink(13)}</p>
          <div class="galileo-choice-grid">${modeChoices.map(([value, title, desc]) => choiceCard("gg-mode", value, `data-mode="${value}"`, state.mode === value, title, desc, isSolo() && value === "basic")).join("")}</div>
        </fieldset>
        ${astroGroups}
      </section>`;
  }

  // ---------- setup ----------

  function deckLine() {
    const [one, two, three] = DECK[deckPlayers()];
    return t(
      `Randomly pick ${one} Tier I, ${two} Tier II and ${three} Tier III Discovery cards (${one + two + three} total; the tier is on each card back). Return the rest to the box unseen — they are not used.`,
      `Sorteie ${one} cartas de Descoberta Nível I, ${two} Nível II e ${three} Nível III (${one + two + three} no total; o nível aparece no verso de cada carta). Devolva o resto à caixa sem olhar — não serão usadas.`
    );
  }

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function setupPhases() {
    const solo = isSolo();
    const playerWord = solo ? t("you", "você") : t("each player", "cada jogador");
    const phases = [
      {
        id: "board",
        title: t("Game Board, tracks and supply", "Tabuleiro, trilhas e suprimento"),
        pages: [2],
        items: [
          t("Place the Game Board in the middle of the table.", "Coloque o Tabuleiro no centro da mesa."),
          t(`Put ${solo ? "your and Tycho's" : "each player's"} Score token on the 0 space of the score track around the board.`, `Coloque o marcador de Pontuação ${solo ? "seu e o de Tycho" : "de cada jogador"} no espaço 0 da trilha de pontos em volta do tabuleiro.`),
          t(`Put ${solo ? "your and Tycho's" : "each player's"} Tribunal token on the Reputation track (the row of arches under the university) on the −3 space — the 4th arch from the left (−10, −7, −5, −3).`, `Coloque o marcador de Tribunal ${solo ? "seu e o de Tycho" : "de cada jogador"} na trilha de Reputação (fileira de arcos abaixo da universidade), no espaço −3 — o 4º arco da esquerda (−10, −7, −5, −3).`),
          t("Make a supply next to the board: all Quadrant tokens (small = 1, big = 3), all 30 observation dice (10 red, 10 yellow, 10 blue) and all 32 Inquisitor figures. Dice are limited to what is in the supply; Quadrants and Inquisitors are unlimited.", "Monte um suprimento ao lado do tabuleiro: todos os Quadrantes (pequeno = 1, grande = 3), os 30 dados de observação (10 vermelhos, 10 amarelos, 10 azuis) e as 32 figuras de Inquisidor. Os dados são limitados ao que há no suprimento; Quadrantes e Inquisidores são ilimitados.")
        ]
      },
      {
        id: "deck",
        title: t("Discovery deck and the six visible cards", "Baralho de Descobertas e as seis cartas visíveis"),
        pages: [2, 3],
        items: [
          deckLine() + (solo ? t(" (Solo builds the 2-player deck.)", " (O solo monta o baralho de 2 jogadores.)") : ""),
          t("Build one face-down deck with the light side of the cards up: Tier III at the bottom, Tier II on top of them, Tier I on top. Place it next to the board.", "Monte um único baralho virado para baixo, com o lado claro das cartas para cima: Nível III embaixo, Nível II por cima e Nível I no topo. Deixe-o ao lado do tabuleiro."),
          t("Flip the top six cards (all Tier I) face-up into the six card spaces of the Game Board.", "Revele as seis cartas do topo (todas Nível I) nos seis espaços de carta do Tabuleiro.")
        ]
      },
      {
        id: "university",
        title: t("University: Scale tiles, Subjects and objectives", "Universidade: Escalas, Matérias e objetivos"),
        pages: [2, 3, 11],
        items: [
          t("Place 4 of the 6 double-sided University Scale tiles at random in the four Scale slots under the university arches. Return the other 2 to the box.", "Coloque 4 das 6 peças de Escala dupla face, ao acaso, nos quatro encaixes de Escala sob os arcos da universidade. Devolva as outras 2 à caixa."),
          t("Shuffle the 6 Subject tiles. Place 4 of them at random above the Scale tiles, arch side up — they name what each Scale scores at the end.", "Embaralhe as 6 peças de Matéria. Coloque 4 delas, ao acaso, acima das Escalas com o lado do arco para cima — elas indicam o que cada Escala pontua no fim."),
          t("Place the remaining 2 Subject tiles niche side up on the two (?) spaces at the top of the university. Together with the 2 printed objectives they are the 4 objectives of this game.", "Coloque as 2 peças de Matéria restantes com o lado do nicho para cima nos dois espaços (?) do topo da universidade. Junto com os 2 objetivos impressos, são os 4 objetivos desta partida."),
          t(`Put ${solo ? "your 4 University tokens and Tycho's 4" : "each player's 4 University tokens"} on the stairs under the Scale tiles — one token under each of the 4 Scales.`, `Coloque ${solo ? "seus 4 marcadores de Universidade e os 4 de Tycho" : "os 4 marcadores de Universidade de cada jogador"} nos degraus abaixo das Escalas — um marcador sob cada uma das 4 Escalas.`)
        ]
      },
      {
        id: "players",
        title: solo ? t("Your player area", "Sua área de jogador") : t("Each player's area", "A área de cada jogador"),
        pages: [4, 5],
        items: [
          t(`A · ${solo ? "Take" : "Each player takes"} one Player Board with its telescope. Turn the telescope to point at the upper of the two crossed-out (✕) spaces at the bottom of the starry sky.`, `A · ${solo ? "Pegue" : "Cada jogador pega"} um Tabuleiro de Jogador com seu telescópio. Aponte o telescópio para o mais alto dos dois espaços riscados (✕) na base do céu estrelado.`),
          isAdvanced()
            ? t(`B · Place the chosen astronomer's Character Board to the left of the Player Board, special-ability side up.`, `B · Coloque o Tabuleiro de Personagem do astrônomo escolhido à esquerda do Tabuleiro de Jogador, com o lado de habilidade especial para cima.`)
            : t("B · Choose an astronomer and place his Character Board to the left of the Player Board, quadrant-symbol side up (basic game).", "B · Escolha um astrônomo e coloque o Tabuleiro de Personagem à esquerda do Tabuleiro de Jogador, com o lado do símbolo de quadrante para cima (jogo básico)."),
          t("C · Take 1 red, 1 yellow and 1 blue die from the supply, set each to 1, and place them in the dice row at the top-left of the Player Board. Nobody starts with Quadrant tokens.", "C · Pegue 1 dado vermelho, 1 amarelo e 1 azul do suprimento, ajuste cada um para 1 e coloque-os na fileira de dados no canto superior esquerdo do Tabuleiro de Jogador. Ninguém começa com Quadrantes."),
          has("kepler")
            ? t("D · Take a set of 6 Action tiles, light side up, and place them on the 6 light spaces of the starry sky (the two ✕ spaces and the four spaces below Upgrade; the Upgrade space never holds a tile). Kepler: see his step below — his special tile takes the space just before Upgrade. Random order is suggested for the first game; later you may choose the order.", "D · Pegue um conjunto de 6 peças de Ação, lado claro para cima, e coloque-as nos 6 espaços claros do céu estrelado (os dois espaços ✕ e os quatro espaços abaixo de Aprimorar; o espaço de Aprimorar nunca recebe peça). Kepler: veja a etapa dele abaixo — a peça especial ocupa o espaço logo antes de Aprimorar. Ordem aleatória é sugerida na primeira partida; depois, pode-se escolher a ordem.")
            : t("D · Take a set of 6 Action tiles and place them light side up on the 6 light spaces of the starry sky: the two ✕ spaces and the four spaces below Upgrade (the Upgrade space never holds a tile). Random order is suggested for the first game; later you may choose the order.", "D · Pegue um conjunto de 6 peças de Ação e coloque-as com o lado claro para cima nos 6 espaços claros do céu estrelado: os dois espaços ✕ e os quatro abaixo de Aprimorar (o espaço de Aprimorar nunca recebe peça). Ordem aleatória é sugerida na primeira partida; depois, pode-se escolher a ordem."),
          t("E · Place the 4 Book tokens on the starting spaces to the left of the Library row, one per row.", "E · Coloque os 4 marcadores de Livro nos espaços iniciais à esquerda das fileiras da Biblioteca, um por fileira."),
          t("F · Place the 7 Comet tokens on the 7 comet spaces, “1” side up.", "F · Coloque os 7 marcadores de Cometa nos 7 espaços de cometa, com o lado “1” para cima."),
          t("G · Place the 7 Constellation tokens on the 7 constellation spaces (the printed reward under each one is gained when you remove it).", "G · Coloque os 7 marcadores de Constelação nos 7 espaços de constelação (a recompensa impressa sob cada um é ganha quando você o retira)."),
          t("H · Place the 4 Achievement tokens (called Objective tokens in the component list) next to the Character Board.", "H · Coloque os 4 marcadores de Conquista (chamados de marcadores de Objetivo na lista de componentes) ao lado do Tabuleiro de Personagem.")
        ]
      }
    ];

    if (isAdvanced()) {
      const items = [];
      if (has("galileo")) {
        items.push(t("Galileo · No extra components. His personal Book of Comets page is printed at the bottom of his Character Board.", "Galileo · Sem componentes extras. A página pessoal do Livro dos Cometas está impressa na parte de baixo do Tabuleiro de Personagem."));
      }
      if (has("kepler")) {
        items.push(t("Kepler · Put his special Action tile (swap arrows) light side up on the last tile space of the starry sky, the one to the left of (just before) Upgrade. Place any one of his 6 basic tiles in the slot on his Character Board and the other 5 on the remaining 5 light spaces (random order suggested in early games, chosen order later).", "Kepler · Coloque a peça de Ação especial (setas de troca), lado claro para cima, no último espaço de peça do céu estrelado, à esquerda de (logo antes de) Aprimorar. Coloque qualquer uma das 6 peças básicas no encaixe do Tabuleiro de Personagem e as outras 5 nos 5 espaços claros restantes (ordem aleatória sugerida nas primeiras partidas, escolhida depois)."));
      }
      if (has("copernicus")) {
        items.push(t("Copernicus · Place his 4 double-sided Nicolaus Copernicus Library tiles next to his Character Board.", "Copérnico · Coloque as 4 peças de Biblioteca de Nicolau Copérnico (dupla face) ao lado do Tabuleiro de Personagem."));
      }
      if (has("bruno")) {
        items.push(t("Bruno · Cover the cellar of his Player Board with the Giordano Bruno Cellar tile (5 spaces).", "Bruno · Cubra o porão do Tabuleiro de Jogador dele com a peça de Porão de Giordano Bruno (5 espaços)."));
      }
      if (items.length) {
        phases.push({ id: "abilities", title: t("Special-ability components", "Componentes das habilidades especiais"), pages: [13, 14, 15], items });
      }
    }

    if (solo) {
      phases.push({
        id: "tycho",
        title: t("Tycho Brahe, the solo rival", "Tycho Brahe, o rival do solo"),
        pages: [16],
        items: [
          t("1 · Place Tycho's Character Board (the Tycho Brahe opponent tile) on the table.", "1 · Coloque o Tabuleiro de Personagem de Tycho (peça de oponente Tycho Brahe) na mesa."),
          t("2 · Next to it place a second Player Board folded in half so its telescope faces down.", "2 · Ao lado, coloque um segundo Tabuleiro de Jogador dobrado ao meio, com o telescópio virado para baixo."),
          t("3 · Place Tycho's special Book token on that board so it covers all four Library starting spaces.", "3 · Coloque o marcador de Livro especial de Tycho nesse tabuleiro, cobrindo os quatro espaços iniciais da Biblioteca."),
          t("4 · Put the 7 Comet tokens and 7 Constellation tokens of a color other than yours on Tycho's Player Board. Use that same color for Tycho's University, Tribunal and Score tokens (already placed in the earlier steps).", "4 · Coloque os 7 marcadores de Cometa e os 7 de Constelação de uma cor diferente da sua no Tabuleiro de Jogador de Tycho. Use essa mesma cor para os marcadores de Universidade, Tribunal e Pontuação de Tycho (já colocados nas etapas anteriores)."),
          t("5 · Give Tycho 3 observation dice of random colors. Tycho never cares about die values.", "5 · Dê a Tycho 3 dados de observação de cores aleatórias. Tycho nunca se importa com o valor dos dados."),
          t("6 · Lay Tycho's 5 solo Action tiles in a row near his board, in any order, blue side up. Put Tycho's telescope token under the leftmost tile (the rulebook pictures the telescope figure; the first player token is not otherwise needed in solo).", "6 · Disponha as 5 peças de Ação solo de Tycho em fila perto do tabuleiro dele, em qualquer ordem, lado azul para cima. Coloque o marcador de telescópio de Tycho sob a peça mais à esquerda (o manual mostra a figura de telescópio; o marcador de primeiro jogador não é usado de outra forma no solo)."),
          t("7 · Shuffle Tycho's 6 Movement tiles into a face-down deck.", "7 · Embaralhe as 6 peças de Movimento de Tycho num monte virado para baixo.")
        ]
      });
    }

    phases.push({
      id: "start",
      title: t("First player", "Primeiro jogador"),
      pages: solo ? [2, 16] : [2, 4],
      items: solo
        ? [t("You always take the first turn; Tycho plays after each of your turns.", "Você sempre faz o primeiro turno; Tycho joga depois de cada turno seu.")]
        : [
          t("The player who most recently observed the starry sky takes the First player token and goes first.", "Quem observou o céu estrelado mais recentemente pega o marcador de primeiro jogador e começa."),
          t("Play continues clockwise.", "O jogo segue em sentido horário.")
        ]
    });
    return phases;
  }

  function inventory() {
    const players = isSolo() ? 2 : Number(state.players);
    const cards = [
      infoCard(t("SHARED", "COMPARTILHADO"), t("Board, deck and supply", "Tabuleiro, baralho e suprimento"), [
        t("1 Game Board · 6 double-sided Scale tiles (4 used) · 6 Subject tiles (4 arch up, 2 niche up).", "1 Tabuleiro · 6 Escalas dupla face (4 usadas) · 6 peças de Matéria (4 com arco, 2 com nicho)."),
        deckLine(),
        t("30 dice (10 per color, limited) · Quadrants: 26 small (1) and 8 big (3) · 32 Inquisitors.", "30 dados (10 por cor, limitados) · Quadrantes: 26 pequenos (1) e 8 grandes (3) · 32 Inquisidores."),
        isSolo() ? null : t("1 First player token (telescope figure) · 2 Help cards.", "1 marcador de primeiro jogador (figura de telescópio) · 2 cartas de Ajuda.")
      ], [2, 3]),
      infoCard(isSolo() ? t("YOU", "VOCÊ") : t(`PER PLAYER · ×${players}`, `POR JOGADOR · ×${players}`), t("One astronomer's kit", "O kit de um astrônomo"), [
        t("1 Player Board with telescope · 1 Character Board.", "1 Tabuleiro de Jogador com telescópio · 1 Tabuleiro de Personagem."),
        t("6 Action tiles · 4 Book tokens · 7 Comet tokens · 7 Constellation tokens.", "6 peças de Ação · 4 marcadores de Livro · 7 de Cometa · 7 de Constelação."),
        t("4 University tokens · 4 Achievement (Objective) tokens · 1 Tribunal token · 1 Score token.", "4 marcadores de Universidade · 4 de Conquista (Objetivo) · 1 de Tribunal · 1 de Pontuação."),
        t("Starting dice from the supply: 1 red, 1 yellow, 1 blue, all at 1.", "Dados iniciais do suprimento: 1 vermelho, 1 amarelo, 1 azul, todos em 1.")
      ], [2, 3, 4])
    ];
    if (isAdvanced() && selectedAstronomers().length) {
      cards.push(infoCard(t("ADVANCED", "AVANÇADO"), t("Ability components in play", "Componentes de habilidade em jogo"), [
        has("kepler") ? t("Kepler: 1 special Action tile.", "Kepler: 1 peça de Ação especial.") : null,
        has("copernicus") ? t("Copernicus: 4 Library tiles.", "Copérnico: 4 peças de Biblioteca.") : null,
        has("bruno") ? t("Bruno: 1 Cellar tile.", "Bruno: 1 peça de Porão.") : null,
        has("galileo") ? t("Galileo: no extra component.", "Galileo: nenhum componente extra.") : null,
        t("Components of astronomers not in play stay in the box.", "Componentes de astrônomos fora da partida ficam na caixa.")
      ], 3));
    }
    if (isSolo()) {
      cards.push(infoCard(t("SOLO · TYCHO", "SOLO · TYCHO"), t("Tycho Brahe's kit", "O kit de Tycho Brahe"), [
        t("1 Tycho Brahe opponent tile (Character Board) · 1 Tycho Brahe Book token.", "1 peça de oponente Tycho Brahe (Tabuleiro de Personagem) · 1 marcador de Livro de Tycho."),
        t("5 solo Action tiles · 6 solo Movement tiles.", "5 peças de Ação solo · 6 peças de Movimento solo."),
        t("A second folded Player Board, plus the tokens of a second color and 3 random dice.", "Um segundo Tabuleiro de Jogador dobrado, mais os marcadores de uma segunda cor e 3 dados aleatórios.")
      ], [3, 16]));
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
        <label class="galileo-setup-check" for="gg-setup-${phase.id}">
          <input id="gg-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="galileo-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="galileo-setup-substeps">${phase.items.map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), sectionIndex("setup"), [2, 3, 4])}
      <div class="callout">${t(
        "Before the very first game only: stick the four stickers on the white circles of each Player Board, fold it and press it so it holds together, and attach each telescope with its rivet so it turns smoothly.",
        "Somente antes da primeiríssima partida: cole os quatro adesivos nos círculos brancos de cada Tabuleiro de Jogador, dobre-o e pressione para que fique firme, e prenda cada telescópio com o rebite para que gire com suavidade."
      )} ${referenceLink(2)} ${referenceLink(3)}</div>
      ${configComplete() ? "" : `<p class="galileo-config-warning" role="status">${t("The match is incomplete: choose the astronomers in “Build your match” before using this checklist.", "A partida está incompleta: escolha os astrônomos em “Configure a partida” antes de usar esta lista.")}</p>`}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Set up this match", "Prepare esta partida")} · ${playersLabel()}${isAdvanced() ? t(" · advanced", " · avançado") : t(" · basic", " · básico")}</h3>
            <p>${t("One checkbox per coherent step. Progress is saved separately from the match configuration and language.", "Uma caixa por etapa coerente. O progresso é salvo separadamente da configuração da partida e do idioma.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Changing the player count, the board side or the astronomers in play clears this checklist. Changing the language does not. “Uncheck all” clears only these setup boxes.",
          "Trocar o número de jogadores, o lado dos tabuleiros ou os astrônomos em jogo limpa esta lista. Trocar o idioma não. “Desmarcar tudo” limpa somente as caixas da preparação."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}`;
  }

  // ---------- quick reference ----------

  function quickReference() {
    const cards = [
      infoCard(t("YOUR TURN", "SEU TURNO"), t("Three phases, in order", "Três fases, em ordem"), [
        rl("1 · Movement", "move your telescope 1–3 spaces forward (up the starry sky). Past Upgrade, continue from Observe, the first space that is not crossed out. Never backward; never onto ✕.", "1 · Movimento", "avance o telescópio 1–3 espaços (subindo o céu estrelado). Depois de Aprimorar, continue a partir de Observar, o primeiro espaço não riscado. Nunca para trás; nunca num ✕."),
        rl("2 · Actions", "take the fixed action (dark) and the moving action (light Action tile) of that space, in either order, plus any free actions you can pay for.", "2 · Ações", "faça a ação fixa (escura) e a ação móvel (peça de Ação clara) desse espaço, na ordem que quiser, mais as ações livres que puder pagar."),
        rl("3 · Cleanup", "rotate Action tiles → Book of Comets → Interrogation (if you Persuaded) → check objectives.", "3 · Manutenção", "girar peças de Ação → Livro dos Cometas → Interrogatório (se Persuadiu) → conferir objetivos."),
        rl("Resolve fully", "finish an action and all its rewards (including reward actions) before starting another one, free actions included.", "Resolva por completo", "termine uma ação e todas as recompensas (inclusive ações de recompensa) antes de começar outra, inclusive ações livres.")
      ], [4, 5]),
      infoCard(t("FIXED ACTIONS", "AÇÕES FIXAS"), t("The five dark spaces", "Os cinco espaços escuros"), [
        rl("Observe", `a Major Object, or up to 2 constellations.${has("galileo") ? " Galileo: +1 constellation." : ""}`, "Observar", `um Objeto Principal ou até 2 constelações.${has("galileo") ? " Galileo: +1 constelação." : ""}`),
        rl("Gain a Die / Lecture", "pick one.", "Ganhar Dado / Lecionar", "escolha um."),
        rl("Spot a Comet", "leftmost Comet token to the board, “1” side up.", "Avistar Cometa", "o Cometa mais à esquerda vai para o tabuleiro, lado “1”."),
        rl("Observe / Gain a Die", "pick one.", "Observar / Ganhar Dado", "escolha um."),
        rl("Upgrade", "flip one Action tile to its golden side. No tile here: gain 1 Quadrant instead of a moving action.", "Aprimorar", "vire uma peça de Ação para o lado dourado. Sem peça aqui: ganhe 1 Quadrante em vez da ação móvel.")
      ], [5, 8]),
      infoCard(t("OBSERVE", "OBSERVAR"), t("Paying with dice", "Pagando com dados"), [
        rl("Constellation", "dice of one single color (red, yellow or blue) whose total reaches the cost.", "Constelação", "dados de uma só cor (vermelho, amarelo ou azul) cuja soma alcance o custo."),
        rl("Major Object", "dice of the two colors that form the icon: orange = red + yellow, green = yellow + blue, purple = red + blue; at least one die of each.", "Objeto Principal", "dados das duas cores que formam o ícone: laranja = vermelho + amarelo, verde = amarelo + azul, roxo = vermelho + azul; pelo menos um dado de cada."),
        rl("Spent dice", "return to the supply; extra pips are lost.", "Dados gastos", "voltam ao suprimento; pontos excedentes se perdem."),
        rl("Dice limit", "max 4 dice on your board, max 3 of one color.", "Limite de dados", "no máximo 4 dados no tabuleiro, no máximo 3 da mesma cor."),
        rl("Comets", "each of your Comet tokens on the board lowers one cost by its value (1 or 2), once per turn, only if needed; you still pay at least one die of each required color.", "Cometas", "cada Cometa seu no tabuleiro reduz um custo pelo seu valor (1 ou 2), uma vez por turno, só se necessário; você ainda paga pelo menos um dado de cada cor exigida.")
      ], [6, 7, 8]),
      infoCard(t("REWARDS", "RECOMPENSAS"), t("What an observation gives", "O que uma observação rende"), [
        rl("Major Object", "its VP (+ an Inquisitor if shown) → card face-up into your Library → Constellation tokens on it go back to the box → refill the board from the deck.", "Objeto Principal", "seus PV (+ um Inquisidor se mostrado) → carta virada para cima na Biblioteca → marcadores de Constelação nela voltam à caixa → reponha o tabuleiro com o baralho."),
        rl("Constellation", "put your leftmost Constellation token on it → its listed rewards → then the reward printed under the space the token left.", "Constelação", "coloque seu marcador de Constelação mais à esquerda sobre ela → recompensas listadas → depois a recompensa impressa sob o espaço de onde o marcador saiu."),
        rl("Gain a card", "top Discovery card, face-down (light side up), into your Library.", "Ganhar carta", "carta do topo do baralho, virada para baixo (lado claro), na sua Biblioteca."),
        rl("7th token", "after your 7th Constellation token you cannot observe constellations anymore.", "7º marcador", "depois do 7º marcador de Constelação você não pode mais observar constelações.")
      ], [6, 7]),
      infoCard(t("FREE ACTIONS", "AÇÕES LIVRES"), t("Pay Quadrants, any number of times", "Pague Quadrantes, quantas vezes quiser"), [
        rl("1 Quadrant", "change one die's color (value stays) OR raise one die by 1.", "1 Quadrante", "mude a cor de um dado (valor mantido) OU aumente um dado em 1."),
        rl("2 Quadrants", "gain a new die OR Write 3.", "2 Quadrantes", "ganhe um dado novo OU Escreva 3."),
        rl("3 Quadrants", "Persuade twice (same or different inquisitors).", "3 Quadrantes", "Persuadir duas vezes (mesmo inquisidor ou diferentes)."),
        rl("4 Quadrants", "Spot a Comet.", "4 Quadrantes", "Avistar Cometa."),
        rl("Timing", "only during your turn, never in the middle of another action.", "Momento", "só no seu turno, nunca no meio de outra ação."),
        has("copernicus") ? rl("Copernicus", "once per turn, place a Library tile for 0 Quadrants.", "Copérnico", "uma vez por turno, coloque uma peça de Biblioteca por 0 Quadrantes.") : null
      ], 9),
      infoCard(t("INQUISITION", "INQUISIÇÃO"), t("Cellar and Reputation", "Porão e Reputação"), [
        rl("Gain an Inquisitor", "always onto the leftmost cellar space (mandatory).", "Ganhar Inquisidor", "sempre no espaço mais à esquerda do porão (obrigatório)."),
        rl("Persuade", "move one Inquisitor one space right.", "Persuadir", "mova um Inquisidor um espaço para a direita."),
        rl("Interrogation", `in Cleanup, only if an Inquisitor actually moved this turn: add the values on top of the occupied arches (${has("bruno") ? "Bruno: −5 −3 −2 −1 +1; others: " : ""}−4 −2 −1 +1) and move your Tribunal token that many spaces.`, "Interrogatório", `na Manutenção, só se um Inquisidor realmente se moveu neste turno: some os valores no topo dos arcos ocupados (${has("bruno") ? "Bruno: −5 −3 −2 −1 +1; demais: " : ""}−4 −2 −1 +1) e mova o marcador de Tribunal esse número de espaços.`),
        rl("Track end", "already at the end and pushed further: lose/gain 2 VP once instead.", "Fim da trilha", "já no fim e empurrado além: perca/ganhe 2 PV uma única vez."),
        rl("Inquisitor's Farewell", "optional: remove one Inquisitor from the rightmost space → Gain a Die + 1 Quadrant.", "Despedida do Inquisidor", "opcional: retire um Inquisidor do espaço mais à direita → Ganhe um Dado + 1 Quadrante.")
      ], 12),
      infoCard(t("CLEANUP", "MANUTENÇÃO"), t("End of every turn", "Fim de todo turno"), [
        rl("Rotate", "take the Action tile you played out of the sky, push the others forward (up) to fill the queue, put the removed tile at the start (bottom) of the queue.", "Girar", "tire do céu a peça de Ação que você jogou, empurre as outras para a frente (para cima) até preencher a fila e coloque a peça retirada no início (base) da fila."),
        rl("Book of Comets", `each Comet token on the book goes to an empty page and gives that page's reward; one token per page; excess goes to the Appendix.${isAdvanced() ? " You may use your personal page instead." : ""}`, "Livro dos Cometas", `cada Cometa sobre o livro vai para uma página vazia e dá a recompensa dela; um por página; o excesso vai para o Apêndice.${isAdvanced() ? " Você pode usar sua página pessoal em vez disso." : ""}`),
        rl("Interrogation", "only if you moved at least one Inquisitor this turn — once, however many moved.", "Interrogatório", "só se você moveu pelo menos um Inquisidor neste turno — uma vez, não importa quantos."),
        rl("Objectives", "first to meet one: 7 VP, token on top; later: 3 VP, token below. Either may take an Inquisitor's Farewell.", "Objetivos", "o primeiro a cumprir: 7 PV, marcador no topo; depois: 3 PV, marcador embaixo. Ambos podem fazer uma Despedida do Inquisidor.")
      ], [10, 11]),
      infoCard(t("END OF GAME", "FIM DE JOGO"), t("Trigger and final round", "Gatilho e rodada final"), [
        rl("Trigger", "the last Discovery card is placed on the Game Board.", "Gatilho", "a última carta de Descoberta é colocada no Tabuleiro."),
        rl("Then", "finish the round so everyone has had the same number of turns, then play one more full round starting with the first player.", "Depois", "termine a rodada para todos terem o mesmo número de turnos e jogue mais uma rodada completa, começando pelo primeiro jogador."),
        rl("Empty space", "during the final round, fill an empty card space with a random Tier III card from the box.", "Espaço vazio", "durante a rodada final, preencha um espaço de carta vazio com uma carta Nível III aleatória da caixa."),
        rl("Final scoring", "University (multiplier × achievements per subject) → Inquisitors in cellar → Reputation.", "Pontuação final", "Universidade (multiplicador × ocorrências da matéria) → Inquisidores no porão → Reputação.")
      ], 13)
    ];
    if (isSolo()) {
      cards.push(infoCard(t("SOLO · TYCHO'S TURN", "SOLO · TURNO DE TYCHO"), t("After each of your turns", "Depois de cada turno seu"), [
        rl("Move", "flip the top Movement tile; move his telescope that many Action tiles to the right, wrapping to the left end.", "Mover", "revele a peça de Movimento do topo; mova o telescópio dele esse número de peças para a direita, voltando ao início."),
        rl("Stop tiles", "tiles with the orange stop icon halt early on an upgraded tile. The gear “0” tile upgrades his current tile (or the nearest one to the right).", "Peças de parada", "peças com o ícone laranja de parada param antes numa peça aprimorada. A peça “0” de engrenagem aprimora a peça atual (ou a mais próxima à direita)."),
        rl("Act", "read his tile top to bottom; do the first row whose condition he meets — only one row. The bottom row is always possible.", "Agir", "leia a peça de cima para baixo; faça a primeira fileira cuja condição ele cumpre — só uma fileira. A última fileira sempre é possível."),
        rl("Afterward", "interrogate him if he moved an Inquisitor; check objectives (VP, but no Farewell).", "Depois", "interrogue-o se ele moveu um Inquisidor; confira objetivos (PV, mas sem Despedida).")
      ], [16, 17, 18]));
    }
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), sectionIndex("quick-reference"), [5, 20])}
      <div class="callout">${t(
        "Goal: be the most famous astronomer — most victory points (VP) after the final round. VP come from observing, the Library, objectives, the University, the Inquisition and Reputation.",
        "Objetivo: ser o astrônomo mais famoso — mais pontos de vitória (PV) após a rodada final. Os PV vêm de observações, da Biblioteca, de objetivos, da Universidade, da Inquisição e da Reputação."
      )} ${referenceLink(4)}</div>
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- victory ----------

  function victorySection() {
    return `
      ${sectionHeading("victory", t("End of game & final scoring", "Fim de jogo e pontuação final"), sectionIndex("victory"), [4, 13, 18])}
      <div class="victory-grid">
        <article class="victory-card">
          <h3>${t("When the game ends", "Quando o jogo termina")}</h3>
          ${lineList([
            t("The end is triggered when the last Discovery card is placed on the Game Board (the deck is now empty).", "O fim é disparado quando a última carta de Descoberta é colocada no Tabuleiro (o baralho fica vazio)."),
            t("Finish the current round so that everyone has had the same number of turns.", "Termine a rodada atual para que todos tenham feito o mesmo número de turnos."),
            t("Then play one final round, starting with the first player.", "Depois jogue uma rodada final, começando pelo primeiro jogador."),
            t("If a card space on the Game Board is empty during the final round, fill it with a random Tier III card from the box.", "Se um espaço de carta do Tabuleiro estiver vazio durante a rodada final, preencha-o com uma carta Nível III aleatória da caixa."),
            interpretation("If the last deck card is taken by a “gain a card” reward instead of being placed on the board, the deck is empty and the end is triggered at that moment (the solo rules phrase the trigger as “when the last Discovery card is drawn”).", "Se a última carta do baralho for pega por uma recompensa “ganhar carta” em vez de ir para o tabuleiro, o baralho acabou e o fim é disparado nesse momento (as regras do solo descrevem o gatilho como “quando a última carta de Descoberta é comprada”)."),
            isSolo() ? t("Solo: same rule — finish the round, then you and Tycho each take one final turn.", "Solo: mesma regra — termine a rodada e depois você e Tycho fazem um turno final cada.") : null
          ])}
        </article>
        <article class="victory-card">
          <h3>${t("Final scoring, in this order", "Pontuação final, nesta ordem")}</h3>
          ${lineList([
            rl("1 · University", "for each of the 4 Scales: the multiplier in the star of your token's row × how many times you meet that Subject. A token still on the stairs scores 0.", "1 · Universidade", "para cada uma das 4 Escalas: o multiplicador na estrela da fileira do seu marcador × quantas vezes você cumpre aquela Matéria. Marcador ainda nos degraus marca 0."),
            rl("2 · Inquisitors", `each Inquisitor still in your cellar scores the number under its arch: ${has("bruno") ? "Bruno −10, −6, −4, −2, +1; others " : ""}−8, −4, −2, +1 (black values subtract; the fully persuaded rightmost space gives +1 each).`, "2 · Inquisidores", `cada Inquisidor ainda no porão marca o número sob o arco: ${has("bruno") ? "Bruno −10, −6, −4, −2, +1; demais " : ""}−8, −4, −2, +1 (valores pretos subtraem; o espaço da direita, totalmente persuadido, dá +1 cada).`),
            rl("3 · Reputation", "gain or lose the VP printed above your Tribunal token: −10, −7, −5, −3, −2, −1, 0, 1, 2, 3, 4, 6, 8, 10.", "3 · Reputação", "ganhe ou perca os PV impressos acima do seu marcador de Tribunal: −10, −7, −5, −3, −2, −1, 0, 1, 2, 3, 4, 6, 8, 10."),
            rl("100+", "flip your Score token and keep counting.", "100+", "vire o marcador de Pontuação e continue contando.")
          ])}
        </article>
        <article class="victory-card">
          <h3>${t("Winner and ties", "Vencedor e empates")}</h3>
          ${lineList([
            t("Most VP wins.", "Vence quem tiver mais PV."),
            t("Tie: highest total of remaining observation dice values.", "Empate: maior soma dos valores dos dados de observação restantes."),
            t("Still tied: most remaining Quadrant tokens.", "Ainda empatado: mais Quadrantes restantes."),
            t("Still tied: shared victory.", "Ainda empatado: vitória compartilhada."),
            isSolo() ? t("Solo: beat Tycho's score; Tycho is scored for University and Inquisition like any player.", "Solo: supere a pontuação de Tycho; Tycho pontua Universidade e Inquisição como qualquer jogador.") : null
          ])}
        </article>
      </div>`;
  }

  // ---------- turn ----------

  function turnSection() {
    const galileoNote = has("galileo") ? t(" Galileo: may observe one extra constellation (Major Object + 1 constellation, or 3 constellations).", " Galileo: pode observar uma constelação extra (Objeto Principal + 1 constelação, ou 3 constelações).") : "";
    return `
      ${sectionHeading("turn", t("Turn & actions", "Turno e ações"), sectionIndex("turn"), [5, 6, 7, 8, 9, 10])}
      <h3 class="subhead">${t("1 · Movement", "1 · Movimento")}</h3>
      <div class="quick-grid">
        ${infoCard(t("MOVEMENT", "MOVIMENTO"), t("Moving the telescope", "Movendo o telescópio"), [
          t("At the start of your turn, move the telescope forward 1, 2 or 3 spaces — toward the top of the starry sky, never backward.", "No início do turno, avance o telescópio 1, 2 ou 3 espaços — em direção ao topo do céu estrelado, nunca para trás."),
          t("After setup, the telescope never points at the two lowest (✕) spaces again.", "Depois da preparação, o telescópio nunca mais aponta para os dois espaços mais baixos (✕)."),
          t("If movement remains after the last space (Upgrade), continue from the lowest space that is not crossed out (Observe).", "Se sobrar movimento depois do último espaço (Aprimorar), continue a partir do espaço mais baixo não riscado (Observar)."),
          t("The sky from bottom to top: ✕, ✕, Observe, Gain a Die / Lecture, Spot a Comet, Observe / Gain a Die, Upgrade.", "O céu, de baixo para cima: ✕, ✕, Observar, Ganhar Dado / Lecionar, Avistar Cometa, Observar / Ganhar Dado, Aprimorar.")
        ], 5)}
        ${infoCard(t("ACTIONS", "AÇÕES"), t("What the space gives you", "O que o espaço oferece"), [
          t("Each space has a fixed action (dark, printed) and a moving action (the light Action tile next to it).", "Cada espaço tem uma ação fixa (escura, impressa) e uma ação móvel (a peça de Ação clara ao lado)."),
          t("Take them in the order you prefer; spaces split by a slash let you pick one of the two options.", "Faça-as na ordem que preferir; espaços divididos por barra permitem escolher uma das duas opções."),
          t("Action tiles always offer two options separated by a slash: pick one.", "Peças de Ação sempre oferecem duas opções separadas por barra: escolha uma."),
          t("Tip: slide the tile you use slightly out of the queue to remember to rotate it in Cleanup.", "Dica: puxe um pouco para fora a peça que usar, para lembrar de girá-la na Manutenção.")
        ], [5, 9])}
      </div>
      <h3 class="subhead">${t("2 · Fixed actions", "2 · Ações fixas")}</h3>
      <div class="icon-grid">
        ${iconCard("fixed-observe", "Observe", "Observe a Major Object or up to two constellations, paying with observation dice." + galileoNote, "Observar", "Observe um Objeto Principal ou até duas constelações, pagando com dados de observação." + galileoNote, 6)}
        ${iconCard("fixed-die-lecture", "Gain a Die / Lecture", "Gain a Die: take a die of any color from the supply at value 1 (with 4 dice already, you may replace one). Lecture: move one University token up one space and gain the reward to the right of its new space.", "Ganhar Dado / Lecionar", "Ganhar Dado: pegue do suprimento um dado de qualquer cor com valor 1 (já tendo 4 dados, pode substituir um). Lecionar: suba um marcador de Universidade um espaço e ganhe a recompensa à direita do novo espaço.", 7)}
        ${iconCard("fixed-comet", "Spot a Comet", "Move your leftmost Comet token from your Player Board to the Game Board, above the Discovery cards, “1” side up.", "Avistar Cometa", "Leve o Cometa mais à esquerda do seu Tabuleiro de Jogador para o Tabuleiro, acima das cartas de Descoberta, com o lado “1” para cima.", 8)}
        ${iconCard("fixed-observe-die", "Observe / Gain a Die", "Choose either Observe or Gain a Die, as above.", "Observar / Ganhar Dado", "Escolha Observar ou Ganhar Dado, como acima.", 8)}
        ${iconCard("fixed-upgrade", "Upgrade", "Flip one of your Action tiles (anywhere in the queue) to its golden upgraded side; it does not move. This space has no Action tile: instead of a moving action you gain 1 Quadrant.", "Aprimorar", "Vire uma das suas peças de Ação (em qualquer lugar da fila) para o lado dourado; ela não se move. Este espaço não tem peça de Ação: em vez da ação móvel, ganhe 1 Quadrante.", 8)}
      </div>
      <h3 class="subhead">${t("Observing in detail", "Observação em detalhe")}</h3>
      <div class="quick-grid">
        ${infoCard(t("DICE", "DADOS"), t("Observation dice", "Dados de observação"), [
          t("Color = light spectrum, value = observation time. You raise values through actions.", "Cor = espectro de luz, valor = tempo de observação. Você aumenta os valores com ações."),
          t("Up to 4 dice on your Player Board; at most 3 of the same color.", "Até 4 dados no Tabuleiro de Jogador; no máximo 3 da mesma cor."),
          t("Each object's cost is the number in its colored icon on the left side of the card; the icon color says which dice pay it.", "O custo de cada objeto é o número no ícone colorido à esquerda da carta; a cor do ícone diz quais dados pagam."),
          t("Spend any number of dice whose total reaches the cost; return them to the supply. Excess is lost.", "Gaste quantos dados quiser cuja soma alcance o custo; devolva-os ao suprimento. O excesso se perde."),
          t("Colorblind aid: the dot on a die face (red left, yellow right, blue under the number) matches the blank corners of the cost icons.", "Ajuda para daltônicos: o ponto na face do dado (vermelho à esquerda, amarelo à direita, azul sob o número) corresponde aos cantos em branco dos ícones de custo.")
        ], [6, 18])}
        ${infoCard(t("MAJOR OBJECT", "OBJETO PRINCIPAL"), t("Observing a Major Object", "Observando um Objeto Principal"), [
          t("Pay with two colors: orange = red + yellow, green = yellow + blue, purple = red + blue. Any ratio, at least one die of each color.", "Pague com duas cores: laranja = vermelho + amarelo, verde = amarelo + azul, roxo = vermelho + azul. Qualquer proporção, pelo menos um dado de cada cor."),
          t("Gain its VP; if it shows an Inquisitor icon, gain an Inquisitor (leftmost cellar space).", "Ganhe os PV dele; se mostrar o ícone de Inquisidor, ganhe um Inquisidor (espaço mais à esquerda do porão)."),
          t("Put the card face-up in your Library, overlapping so every card's reward row stays visible.", "Coloque a carta virada para cima na Biblioteca, sobrepondo de modo que a fileira de recompensas de cada carta continue visível."),
          t("Constellation tokens on that card go back to the box for the rest of the game.", "Marcadores de Constelação nessa carta voltam à caixa pelo resto do jogo."),
          t("Fill the empty board space with the top card of the Discovery deck.", "Preencha o espaço vazio do tabuleiro com a carta do topo do baralho de Descobertas.")
        ], 6)}
        ${infoCard(t("CONSTELLATIONS", "CONSTELAÇÕES"), t("Observing constellations", "Observando constelações"), [
          t(`Observe up to ${has("galileo") ? "two (Galileo: three)" : "two"} constellations in one action; resolve the first completely before the second.`, `Observe até ${has("galileo") ? "duas (Galileo: três)" : "duas"} constelações numa ação; resolva a primeira por completo antes da segunda.`),
          t("Pay with dice of a single color.", "Pague com dados de uma única cor."),
          t("Place your leftmost Constellation token on the constellation. Gain the rewards listed for it (VP and any icons), then the reward printed under the space your token left.", "Coloque seu marcador de Constelação mais à esquerda sobre a constelação. Ganhe as recompensas listadas nela (PV e ícones) e depois a recompensa impressa sob o espaço de onde o marcador saiu."),
          t("Three of those printed rewards are “gain a card”: take the top Discovery card face-down (light side up) into your Library.", "Três dessas recompensas impressas são “ganhar carta”: pegue a carta do topo do baralho virada para baixo (lado claro) para a Biblioteca."),
          t("The card stays on the Game Board; a constellation covered by a token is no longer available.", "A carta continua no Tabuleiro; uma constelação coberta por um marcador deixa de estar disponível."),
          t("After using your 7th Constellation token you cannot observe constellations anymore.", "Depois de usar o 7º marcador de Constelação você não pode mais observar constelações.")
        ], [7, 17])}
        ${infoCard(t("COMETS", "COMETAS"), t("Using Comet tokens", "Usando Cometas"), [
          t("When you Observe, each of your Comet tokens on the Game Board can reduce the cost by its value.", "Ao Observar, cada Cometa seu no Tabuleiro pode reduzir o custo pelo seu valor."),
          t("Each token once per turn, and only if it actually reduces the cost — you cannot use comets you don't need.", "Cada marcador uma vez por turno, e só se realmente reduzir o custo — não é permitido usar cometas desnecessários."),
          t("You must still spend at least one die of each required color; with no die of a required color you cannot use a comet.", "Você ainda precisa gastar pelo menos um dado de cada cor exigida; sem dado de uma cor exigida, não pode usar cometa."),
          t("First use: move the token below the Discovery cards and flip it to “2”.", "Primeiro uso: mova o marcador para baixo das cartas de Descoberta e vire para o “2”."),
          t("Second use: put it on the Book of Comets (it is placed on a page during Cleanup). Excess reduction is lost.", "Segundo uso: coloque-o sobre o Livro dos Cometas (vai para uma página na Manutenção). Redução em excesso se perde."),
          interpretation("Once all 7 of your Comet tokens have left your Player Board, Spot a Comet has nothing to move and gives nothing.", "Depois que seus 7 Cometas saírem do Tabuleiro de Jogador, Avistar Cometa não tem o que mover e não rende nada.")
        ], 8)}
      </div>
      <h3 class="subhead">${t("2 · Moving actions (Action tiles)", "2 · Ações móveis (peças de Ação)")}</h3>
      <div class="quick-grid">
        ${infoCard(t("BASIC TILES", "PEÇAS BÁSICAS"), t("Each set of 6 (light side)", "Cada conjunto de 6 (lado claro)"), [
          t("Red +1 / Write (flag).", "Vermelho +1 / Escrever (bandeira)."),
          t("Red +1 / Gain a Die.", "Vermelho +1 / Ganhar Dado."),
          t("Yellow +1 / 2 Quadrants.", "Amarelo +1 / 2 Quadrantes."),
          t("Yellow +1 / Write (flag).", "Amarelo +1 / Escrever (bandeira)."),
          t("Blue +1 / one die +2.", "Azul +1 / um dado +2."),
          t("Blue +1 / 1 Quadrant + Persuade.", "Azul +1 / 1 Quadrante + Persuadir.")
        ], 20)}
        ${infoCard(t("UPGRADED TILES", "PEÇAS APRIMORADAS"), t("The same tiles, golden side", "As mesmas peças, lado dourado"), [
          t("Red +2 / Lecture + Write (flag).", "Vermelho +2 / Lecionar + Escrever (bandeira)."),
          t("Red +2 / 1 Quadrant + Gain a Die + 1 VP.", "Vermelho +2 / 1 Quadrante + Ganhar Dado + 1 PV."),
          t("Yellow +2 / 3 Quadrants + 1 VP.", "Amarelo +2 / 3 Quadrantes + 1 PV."),
          t("Yellow +2 / Write (flag) + 1 VP + 1 Quadrant.", "Amarelo +2 / Escrever (bandeira) + 1 PV + 1 Quadrante."),
          t("Blue +2 / 1 Quadrant + one die +3.", "Azul +2 / 1 Quadrante + um dado +3."),
          t("Blue +2 / 1 Quadrant + Persuade twice.", "Azul +2 / 1 Quadrante + Persuadir duas vezes.")
        ], [8, 20])}
        ${infoCard(t("ICONS", "ÍCONES"), t("Reading an Action tile", "Lendo uma peça de Ação"), [
          rl("Color +1 / +2", "raise every die of that color by 1 or 2.", "Cor +1 / +2", "aumente todos os dados daquela cor em 1 ou 2."),
          rl("Tricolor die with 1", "raise one single die by 2 (or 3).", "Dado tricolor com 1", "aumente um único dado em 2 (ou 3)."),
          rl("Die with +", "gain a die of any color at value 1.", "Dado com +", "ganhe um dado de qualquer cor com valor 1."),
          rl("Quadrant", "gain 1 Quadrant token.", "Quadrante", "ganhe 1 Quadrante."),
          rl("Hooded figure with arrow", "Persuade. With nothing to move, it is lost.", "Figura encapuzada com seta", "Persuadir. Sem nada para mover, é perdida."),
          rl("University / Book", "Lecture / Write.", "Universidade / Livro", "Lecionar / Escrever.")
        ], 9)}
        ${infoCard(t("FREE ACTIONS", "AÇÕES LIVRES"), t("Printed above your portrait", "Impressas acima do retrato"), [
          rl("1 Quadrant", "change one die to another color (same value) OR raise one die by 1.", "1 Quadrante", "mude um dado para outra cor (mesmo valor) OU aumente um dado em 1."),
          rl("2 Quadrants", "gain a new die OR Write 3.", "2 Quadrantes", "ganhe um dado novo OU Escreva 3."),
          rl("3 Quadrants", "Persuade twice — same Inquisitor twice or two different ones.", "3 Quadrantes", "Persuadir duas vezes — o mesmo Inquisidor duas vezes ou dois diferentes."),
          rl("4 Quadrants", "Spot a Comet.", "4 Quadrantes", "Avistar Cometa."),
          t("As many as you can pay for, during your turn, but never while another action is being resolved.", "Quantas puder pagar, durante seu turno, mas nunca enquanto outra ação está sendo resolvida."),
          t("Tip: keep Quadrants to Persuade before a dangerous interrogation.", "Dica: guarde Quadrantes para Persuadir antes de um interrogatório perigoso.")
        ], 9)}
      </div>
      <h3 class="subhead">${t("3 · Cleanup", "3 · Manutenção")}</h3>
      <div class="icon-grid">
        ${iconCard("cleanup-rotate", "Rotate Action tiles", "Remove the Action tile you played this turn from the starry sky, push the remaining tiles forward so they fill the whole queue, and put the removed tile at the beginning (bottom) of the queue.", "Girar peças de Ação", "Tire do céu estrelado a peça de Ação que jogou neste turno, empurre as restantes para a frente até preencher toda a fila e coloque a peça retirada no início (base) da fila.", 10)}
        ${iconCard("cleanup-book-of-comets", "Book of Comets", `Place each Comet token sitting on the book on an empty page and gain that page's reward. One token per page; extra tokens go to the Appendix.${isAdvanced() ? " A personal page on your Character Board may be used instead of a book page." : ""}`, "Livro dos Cometas", `Coloque cada Cometa que está sobre o livro numa página vazia e ganhe a recompensa dela. Um marcador por página; o excesso vai para o Apêndice.${isAdvanced() ? " Uma página pessoal no Tabuleiro de Personagem pode ser usada no lugar de uma página do livro." : ""}`, 10)}
        ${iconCard("cleanup-interrogation", "Interrogation", "If you successfully moved at least one Inquisitor this turn (even as a reward), you are interrogated — once. A Persuade that could not move anything does not count.", "Interrogatório", "Se você moveu com sucesso pelo menos um Inquisidor neste turno (mesmo como recompensa), é interrogado — uma vez. Um Persuadir que não moveu nada não conta.", 12)}
        ${iconCard("cleanup-objectives", "Check objectives", "Look at the 4 objectives at the top of the university and claim any you completed (see University).", "Conferir objetivos", "Veja os 4 objetivos no topo da universidade e reivindique os que cumpriu (veja Universidade).", 11)}
      </div>
      <div class="callout">${lineList([
        rl("Book of Comets pages", `the board shows 4 purple pages (Write 3, Persuade, Quadrant, 3 VP), a “3/4 players” marker, then 7 blue pages (Lecture, Write 3, Gain a Die, Persuade, Persuade, Quadrant, 3 VP), then the Appendix with a 1 VP icon.`, "Páginas do Livro dos Cometas", `o tabuleiro mostra 4 páginas roxas (Escrever 3, Persuadir, Quadrante, 3 PV), um marcador “3/4 jogadores”, depois 7 páginas azuis (Lecionar, Escrever 3, Ganhar Dado, Persuadir, Persuadir, Quadrante, 3 PV) e por fim o Apêndice com o ícone de 1 PV.`),
        interpretation(
          `${deckPlayers() === 2 ? "With 2 players (and in solo) use only the 4 pages before the “3/4” marker; the blue pages are for 3–4 players. The solo rules confirm a separate “section for two players”." : "With 3–4 players all 11 pages are used; with 2 players only the 4 pages before the “3/4” marker."} The rulebook text gives no reward rule for the Appendix; the board prints 1 VP there, so a comet placed in the Appendix gains 1 VP.`,
          `${deckPlayers() === 2 ? "Com 2 jogadores (e no solo) use só as 4 páginas antes do marcador “3/4”; as páginas azuis são para 3–4 jogadores. As regras do solo confirmam uma “seção para dois jogadores” separada." : "Com 3–4 jogadores as 11 páginas são usadas; com 2 jogadores, só as 4 páginas antes do marcador “3/4”."} O texto do manual não descreve recompensa para o Apêndice; o tabuleiro imprime 1 PV ali, então um cometa colocado no Apêndice ganha 1 PV.`
        ),
        interpretation(
          "On a turn your telescope stops on Upgrade there is no Action tile to play, so the rotation step has nothing to move.",
          "Num turno em que o telescópio para em Aprimorar, não há peça de Ação para jogar, então a etapa de girar não move nada."
        )
      ])} ${referenceLink(2)} ${referenceLink(10)} ${referenceLink(17)}</div>`;
  }

  // ---------- library / university / inquisition ----------

  function systemsSection() {
    const brunoCellar = has("bruno")
      ? infoCard(t("BRUNO ONLY", "SÓ BRUNO"), t("Bruno's 5-space cellar", "O porão de 5 espaços de Bruno"), [
        t("Interrogation values (top): −5, −3, −2, −1, +1.", "Valores de interrogatório (topo): −5, −3, −2, −1, +1."),
        t("End-of-game values (bottom): −10, −6, −4, −2, +1.", "Valores de fim de jogo (base): −10, −6, −4, −2, +1."),
        t("Each time an Inquisitor moves onto space 3: gain 1 Quadrant.", "Cada vez que um Inquisidor entra no espaço 3: ganhe 1 Quadrante."),
        t("Each time an Inquisitor moves onto space 5: Gain a Die OR 3 VP.", "Cada vez que um Inquisidor entra no espaço 5: Ganhe um Dado OU 3 PV.")
      ], 15)
      : "";
    return `
      ${sectionHeading("systems", t("Library, University & Inquisition", "Biblioteca, Universidade e Inquisição"), sectionIndex("systems"), [10, 11, 12])}
      <h3 class="subhead">${t("Library and the Write action", "Biblioteca e a ação Escrever")}</h3>
      <div class="quick-grid">
        ${infoCard(t("LIBRARY", "BIBLIOTECA"), t("Building your Library", "Montando sua Biblioteca"), [
          t("Every Discovery card you gain (observed Major Object face-up, or a “gain a card” face-down) goes horizontally beside your Library, overlapping so each card's four reward rows remain visible.", "Toda carta de Descoberta que você ganha (Objeto Principal observado, virado para cima, ou “ganhar carta”, virado para baixo) vai na horizontal ao lado da Biblioteca, sobreposta de forma que as quatro fileiras de recompensa de cada carta fiquem visíveis."),
          t("Each of your 4 Book tokens travels along one row: the printed column on your board, then one space per card.", "Cada um dos 4 marcadores de Livro percorre uma fileira: a coluna impressa no tabuleiro e depois um espaço por carta."),
          t("Both faces of a Discovery card carry a reward row, so a card gained face-down (light side up) extends your Library exactly like a face-up one.", "As duas faces da carta de Descoberta têm uma fileira de recompensas, então uma carta ganha virada para baixo (lado claro) prolonga a Biblioteca exatamente como uma virada para cima."),
          t("Major Object rows have a dark background (this matters for the Major Object Subject).", "As fileiras de Objetos Principais têm fundo escuro (isso importa para a Matéria de Objeto Principal)."),
          t("Book tokens only move right.", "Marcadores de Livro só se movem para a direita.")
        ], [6, 10, 11])}
        ${infoCard(t("WRITE", "ESCREVER"), t("Complete and partial writing", "Escrita completa e parcial"), [
          rl("Flag book (complete)", "move one Book token to the rightmost space of its row.", "Livro com bandeira (completa)", "mova um marcador de Livro até o último espaço da fileira."),
          rl("Numbered book (partial)", "move Book tokens a total of that many spaces, split among any tokens.", "Livro numerado (parcial)", "mova marcadores de Livro um total desse número de espaços, divididos entre quaisquer marcadores."),
          rl("Rewards", "gain the reward of every space you pass through or stop on, strictly left to right, each resolved fully.", "Recompensas", "ganhe a recompensa de cada espaço por onde passar ou parar, estritamente da esquerda para a direita, cada uma resolvida por completo."),
          rl("Mandatory", "take all rewards if possible — a Gain an Inquisitor icon must be taken; a die increase with no die of that color is simply lost.", "Obrigatório", "pegue todas as recompensas se possível — o ícone Ganhar Inquisidor deve ser pego; aumentar dados sem ter dado daquela cor simplesmente se perde."),
          rl("Optional", "Inquisitor's Farewell icons may be skipped.", "Opcional", "ícones de Despedida do Inquisidor podem ser ignorados.")
        ], [10, 12])}
        ${has("copernicus") ? infoCard(t("COPERNICUS ONLY", "SÓ COPÉRNICO"), t("Library tiles", "Peças de Biblioteca"), [
          t("Free action, once per turn, costing 0 Quadrants: place one Library tile into your Library, replacing the rewards it covers.", "Ação livre, uma vez por turno, custando 0 Quadrantes: coloque uma peça de Biblioteca na Biblioteca, substituindo as recompensas que ela cobrir."),
          t("It cannot cover a Book token and must fit inside the rows of your Discovery cards (no sticking out).", "Não pode cobrir um marcador de Livro e deve caber nas fileiras das suas cartas de Descoberta (sem sobrar para fora)."),
          t("Either side may be used, but not upside down.", "Qualquer lado pode ser usado, mas não de cabeça para baixo.")
        ], 15) : ""}
      </div>
      <h3 class="subhead">${t("University", "Universidade")}</h3>
      <div class="quick-grid">
        ${infoCard(t("LECTURE", "LECIONAR"), t("Climbing the Scales", "Subindo as Escalas"), [
          t("Lecture: move one of your University tokens up one space on any Scale tile and gain the reward printed to the right of the new space.", "Lecionar: suba um dos seus marcadores de Universidade um espaço em qualquer Escala e ganhe a recompensa impressa à direita do novo espaço."),
          t("A token at the top of its Scale cannot move further.", "Um marcador no topo da Escala não sobe mais."),
          t("The star in each row (1× to 4×) is that Scale's end-game multiplier for you.", "A estrela em cada fileira (1× a 4×) é o multiplicador de fim de jogo daquela Escala para você."),
          t("The Scale rewards are printed on the tiles (random, double-sided).", "As recompensas das Escalas estão impressas nas peças (aleatórias, dupla face).")
        ], [7, 11])}
        ${infoCard(t("SUBJECTS · ARCH SIDE", "MATÉRIAS · LADO DO ARCO"), t("What each Scale scores", "O que cada Escala pontua"), [
          rl("Major Object", "each Major Object in your Library (dark reward rows).", "Objeto Principal", "cada Objeto Principal na Biblioteca (fileiras escuras)."),
          rl("Library", "the number of spaces moved by your leftmost (least advanced) Book token.", "Biblioteca", "o número de espaços percorridos pelo seu marcador de Livro mais à esquerda (menos avançado)."),
          rl("Inquisitors", "each Inquisitor in your cellar at the end (those removed by Farewell don't count).", "Inquisidores", "cada Inquisidor no porão no fim (os retirados por Despedida não contam)."),
          rl("Upgrades", "each upgraded Action tile.", "Aprimoramentos", "cada peça de Ação aprimorada."),
          rl("Comets", "each Comet token removed from your Player Board.", "Cometas", "cada Cometa retirado do Tabuleiro de Jogador."),
          rl("Constellations", "each Constellation token removed from your Player Board (tokens later returned to the box with an observed card still count).", "Constelações", "cada marcador de Constelação retirado do Tabuleiro de Jogador (marcadores devolvidos à caixa junto com uma carta observada continuam contando).")
        ], 11)}
        ${infoCard(t("OBJECTIVES", "OBJETIVOS"), t("The 4 objectives of this game", "Os 4 objetivos desta partida"), [
          rl("Printed (always)", "observe 2 Major Objects, observe 2 constellations and spot 2 comets.", "Impresso (sempre)", "observar 2 Objetos Principais, observar 2 constelações e avistar 2 cometas."),
          rl("Printed (always)", "reach the top of a Scale with 2 of your University tokens.", "Impresso (sempre)", "chegar ao topo de uma Escala com 2 marcadores de Universidade."),
          rl("Niche tiles (2 of 6)", "observe 4 Major Objects · all Book tokens on at least the 3rd Library space · at least 6 Inquisitors in your cellar at once · at least 5 upgraded Action tiles · at least 5 Comet tokens removed from your board · at least 6 Constellation tokens removed.", "Peças de nicho (2 de 6)", "observar 4 Objetos Principais · todos os Livros pelo menos no 3º espaço da Biblioteca · pelo menos 6 Inquisidores no porão ao mesmo tempo · pelo menos 5 peças de Ação aprimoradas · pelo menos 5 Cometas retirados do tabuleiro · pelo menos 6 marcadores de Constelação retirados."),
          rl("Claiming", "checked in Cleanup. First player to meet it: 7 VP and an Achievement token on the top space. Later players: 3 VP, token in the shared space below.", "Reivindicar", "verificado na Manutenção. Primeiro a cumprir: 7 PV e um marcador de Conquista no espaço do topo. Os demais: 3 PV, marcador no espaço compartilhado abaixo."),
          rl("Bonus", "anyone who claims an objective may take an Inquisitor's Farewell.", "Bônus", "quem reivindica um objetivo pode fazer uma Despedida do Inquisidor.")
        ], 11)}
      </div>
      <div class="callout">${t(
        "The rulebook's Subject-tile caption on p. 11 swaps “arch” and “niche”. The setup steps (p. 2), the tile pictures and the University text agree: arch side up = Subject scored at the end; niche side up (with a “4×”, “5×” or “6×” count) = objective.",
        "A legenda das peças de Matéria na p. 11 do manual troca “arco” e “nicho”. Os passos da preparação (p. 2), as imagens das peças e o texto da Universidade concordam: lado do arco para cima = Matéria pontuada no fim; lado do nicho para cima (com contagem “4×”, “5×” ou “6×”) = objetivo."
      )} ${referenceLink(2)} ${referenceLink(11)}</div>
      <h3 class="subhead">${t("The Inquisition", "A Inquisição")}</h3>
      <div class="quick-grid">
        ${infoCard(t("CELLAR", "PORÃO"), t("Inquisitor tokens", "Marcadores de Inquisidor"), [
          t("Your cellar (below the Constellation tokens) has 4 arches. Top numbers are interrogation values: −4, −2, −1, +1. Bottom numbers count only at the end: −8, −4, −2, +1.", "Seu porão (abaixo dos marcadores de Constelação) tem 4 arcos. Números de cima são valores de interrogatório: −4, −2, −1, +1. Números de baixo só contam no fim: −8, −4, −2, +1."),
          rl("Gain an Inquisitor", "take one from the supply and put it on the leftmost space — you usually get them by observing or lecturing.", "Ganhar Inquisidor", "pegue um do suprimento e coloque-o no espaço mais à esquerda — normalmente vêm de observações ou aulas."),
          rl("Persuade", "move any Inquisitor in your cellar one space right. If none can move, it is forfeited.", "Persuadir", "mova qualquer Inquisidor do porão um espaço para a direita. Se nenhum puder se mover, a ação é perdida."),
          rl("Inquisitor's Farewell", "remove one Inquisitor from the rightmost space, return it to the supply, then Gain a Die and 1 Quadrant. Always optional; forfeited if the rightmost space is empty.", "Despedida do Inquisidor", "retire um Inquisidor do espaço mais à direita, devolva-o ao suprimento e então Ganhe um Dado e 1 Quadrante. Sempre opcional; perdida se o espaço da direita estiver vazio.")
        ], [12, 20])}
        ${infoCard(t("INTERROGATION", "INTERROGATÓRIO"), t("During Cleanup", "Durante a Manutenção"), [
          t("Happens only if you successfully moved at least one Inquisitor this turn — and only once.", "Só acontece se você moveu com sucesso pelo menos um Inquisidor neste turno — e só uma vez."),
          t("Add the interrogation value of every Inquisitor in your cellar.", "Some o valor de interrogatório de cada Inquisidor no porão."),
          t("Move your Tribunal token that many spaces: negative = left (worse Reputation), positive = right (better).", "Mova o marcador de Tribunal esse número de espaços: negativo = esquerda (pior Reputação), positivo = direita (melhor)."),
          t("If the token already stands at the far left or far right and would move further, instead lose or gain 2 VP once, regardless of the result's size.", "Se o marcador já está no extremo esquerdo ou direito e se moveria além, em vez disso perca ou ganhe 2 PV uma vez, não importa o tamanho do resultado."),
          interpretation("If a result would carry the token past the end from elsewhere on the track, it stops at the end; the ±2 VP rule as written applies when it already stands there.", "Se um resultado levaria o marcador além do fim a partir de outro ponto da trilha, ele para no fim; a regra de ±2 PV, como escrita, vale quando ele já está lá."),
          t("Memory trick: lay new Inquisitors down flat; stand one up whenever you Persuade it. Upright figures in Cleanup = interrogation; then lay them down.", "Truque de memória: deite os Inquisidores novos; levante um sempre que o Persuadir. Figuras em pé na Manutenção = interrogatório; depois deite-as.")
        ], [12, 18])}
        ${infoCard(t("TRIBUNAL", "TRIBUNAL"), t("Reputation track", "Trilha de Reputação"), [
          t("Below the university; everyone starts at −3.", "Abaixo da universidade; todos começam em −3."),
          t("Spaces from left to right: −10, −7, −5, −3, −2, −1, 0, 1, 2, 3, 4, 6, 8, 10 — the VP gained or lost at the end.", "Espaços da esquerda para a direita: −10, −7, −5, −3, −2, −1, 0, 1, 2, 3, 4, 6, 8, 10 — os PV ganhos ou perdidos no fim."),
          t("The −2 and +2 markers at the ends remind you of the over-the-edge penalty and bonus.", "Os marcadores −2 e +2 nas pontas lembram a penalidade e o bônus por passar do limite.")
        ], [2, 12, 13])}
        ${brunoCellar}
      </div>`;
  }

  // ---------- astronomers ----------

  function astronomersSection() {
    if (!isAdvanced()) {
      return "";
    }
    const cards = {
      galileo: infoCard("GALILEO GALILEI", t("Telescope master", "Mestre do telescópio"), [
        rl("Observe", "whenever he takes the Observe action he may observe one additional constellation: a Major Object plus one constellation, or three constellations.", "Observar", "sempre que faz a ação Observar, pode observar uma constelação adicional: um Objeto Principal mais uma constelação, ou três constelações."),
        rl("Personal comet page", "when it is covered, he gains 2 Quadrants.", "Página pessoal de cometa", "quando é coberta, ele ganha 2 Quadrantes.")
      ], 14),
      kepler: infoCard("JOHANNES KEPLER", t("Lenses and optics", "Lentes e óptica"), [
        rl("Setup", "special tile on the space just before Upgrade; one basic tile on his Character Board.", "Preparação", "peça especial no espaço logo antes de Aprimorar; uma peça básica no Tabuleiro de Personagem."),
        rl("Special tile", "each option starts with a swap: swap two Action tiles on his Player Board, or swap one of them with the tile on his Character Board.", "Peça especial", "cada opção começa com uma troca: trocar duas peças de Ação de lugar no Tabuleiro de Jogador, ou trocar uma delas pela peça do Tabuleiro de Personagem."),
        rl("Light side", "swap + raise one die by 2, OR swap + 3 Quadrants.", "Lado claro", "troca + aumentar um dado em 2, OU troca + 3 Quadrantes."),
        rl("Golden side", "swap + raise one die by 3, OR swap + 4 Quadrants.", "Lado dourado", "troca + aumentar um dado em 3, OU troca + 4 Quadrantes."),
        rl("Comet pages", "no personal page.", "Páginas de cometa", "sem página pessoal.")
      ], 14),
      copernicus: infoCard(t("NICOLAUS COPERNICUS", "NICOLAU COPÉRNICO"), t("Master of the library", "Mestre da biblioteca"), [
        rl("Library tiles", "free action, once per turn, 0 Quadrants: place one of his 4 double-sided tiles in his Library, replacing the covered rewards.", "Peças de Biblioteca", "ação livre, uma vez por turno, 0 Quadrantes: coloque uma das 4 peças dupla face na Biblioteca, substituindo as recompensas cobertas."),
        rl("Placement", "never over a Book token; must fit within the rows of his Discovery cards; any side, not upside down.", "Colocação", "nunca sobre um marcador de Livro; deve caber nas fileiras das cartas de Descoberta; qualquer lado, sem inverter."),
        rl("Personal comet page", "when covered, he may Persuade two different Inquisitors twice each (each moves up to two spaces).", "Página pessoal de cometa", "quando coberta, ele pode Persuadir dois Inquisidores diferentes duas vezes cada (cada um anda até dois espaços).")
      ], 15),
      bruno: infoCard("GIORDANO BRUNO", t("The heretic", "O herege"), [
        rl("Cellar tile", "5 spaces: interrogation −5, −3, −2, −1, +1; end values −10, −6, −4, −2, +1.", "Peça de porão", "5 espaços: interrogatório −5, −3, −2, −1, +1; valores finais −10, −6, −4, −2, +1."),
        rl("Cellar rewards", "each time an Inquisitor moves onto space 3: 1 Quadrant; onto space 5: Gain a Die OR 3 VP.", "Recompensas do porão", "cada vez que um Inquisidor entra no espaço 3: 1 Quadrante; no espaço 5: Ganhar Dado OU 3 PV."),
        rl("Personal comet page 1", "Persuade 4 times, divided as he likes.", "Página pessoal 1", "Persuadir 4 vezes, divididas como quiser."),
        rl("Personal comet page 2", "Upgrade one of his Action tiles.", "Página pessoal 2", "Aprimorar uma de suas peças de Ação.")
      ], 15)
    };
    const chosen = selectedAstronomers();
    return `
      ${sectionHeading("astronomers", t("Advanced mode · special abilities", "Modo avançado · habilidades especiais"), sectionIndex("astronomers"), [13, 14, 15])}
      <p class="glossary-intro">${t(
        "Only the astronomers selected in “Build your match” are shown. A personal Book of Comets page works like a book page: during Cleanup you may place a Comet token from the book there instead, and gain its reward.",
        "Só os astrônomos selecionados em “Configure a partida” aparecem. Uma página pessoal do Livro dos Cometas funciona como uma página do livro: na Manutenção, você pode colocar ali um Cometa do livro e ganhar a recompensa."
      )} ${referenceLink(10)}</p>
      ${chosen.length ? `<div class="quick-grid">${chosen.map((id) => cards[id]).join("")}</div>` : `<p class="galileo-config-warning" role="status">${t("No astronomer selected yet.", "Nenhum astrônomo selecionado ainda.")}</p>`}`;
  }

  // ---------- solo ----------

  function soloSection() {
    if (!isSolo()) {
      return "";
    }
    return `
      ${sectionHeading("solo", t("Solo game · Tycho Brahe", "Jogo solo · Tycho Brahe"), sectionIndex("solo"), [16, 17, 18])}
      <div class="quick-grid">
        ${infoCard(t("TYCHO · MOVE", "TYCHO · MOVER"), t("Movement tiles", "Peças de Movimento"), [
          t("After your turn, flip the top Movement tile.", "Depois do seu turno, revele a peça de Movimento do topo."),
          rl("Plain number", "move Tycho's telescope that many Action tiles to the right.", "Número simples", "mova o telescópio de Tycho esse número de peças de Ação para a direita."),
          rl("Number + orange stop icon", "move that many, but stop early on reaching an upgraded Action tile.", "Número + ícone laranja de parada", "mova esse número, mas pare antes ao chegar numa peça de Ação aprimorada."),
          rl("“0” with gear", "Tycho does not move; upgrade the tile under his telescope (if already upgraded, the nearest tile to its right). Then he evaluates his tile as usual.", "“0” com engrenagem", "Tycho não se move; aprimore a peça sob o telescópio (se já aprimorada, a mais próxima à direita). Depois ele avalia a peça normalmente."),
          t("Past the rightmost tile, the telescope returns to the leftmost tile and keeps moving.", "Passando da peça mais à direita, o telescópio volta à mais à esquerda e continua."),
          interpretation("The rulebook does not say what happens when the 6 Movement tiles run out; reshuffle them into a new deck.", "O manual não diz o que acontece quando as 6 peças de Movimento acabam; reembaralhe-as num novo monte.")
        ], 16)}
        ${infoCard(t("TYCHO · ACT", "TYCHO · AGIR"), t("Evaluating his Action tile", "Avaliando a peça de Ação"), [
          t("Read the tile row by row from the top; rows are separated by light lines.", "Leia a peça fileira por fileira, de cima para baixo; as fileiras são separadas por linhas claras."),
          t("If Tycho meets the condition in the light frame on the left, he takes that row's actions and stops — only one row per turn.", "Se Tycho cumpre a condição na moldura clara à esquerda, faz as ações daquela fileira e para — só uma fileira por turno."),
          t("Otherwise skip to the next row. The bottom row has no full condition and can always be taken.", "Caso contrário, passe para a próxima. A última fileira não tem condição completa e sempre pode ser feita."),
          t("A rounded condition bar on the bottom row is a partial condition: if met, Tycho also gains the bonus to its right.", "Uma barra de condição arredondada na última fileira é uma condição parcial: se cumprida, Tycho também ganha o bônus à direita dela."),
          t("Starting tiles are blue side up; upgraded tiles are flipped.", "As peças começam com o lado azul para cima; as aprimoradas são viradas.")
        ], [16, 17])}
        ${infoCard(t("TYCHO · RULES", "TYCHO · REGRAS"), t("What Tycho does and doesn't do", "O que Tycho faz ou não faz"), [
          t("You always use your special-ability Character Board side and always go first.", "Você sempre usa o lado de habilidade especial do Tabuleiro de Personagem e sempre começa."),
          t("Tycho gains VP only from his Action tiles, from observing constellations and Major Objects, from objectives, and from end-game scoring.", "Tycho só ganha PV com as peças de Ação, observando constelações e Objetos Principais, com objetivos e na pontuação final."),
          t("He never gets rewards from the Book of Comets, his Library (not even VP) or the University Scales.", "Ele nunca recebe recompensas do Livro dos Cometas, da Biblioteca (nem PV) ou das Escalas da Universidade."),
          t("If he moved an Inquisitor, he is interrogated at the end of his turn and moves his Tribunal token as usual.", "Se ele moveu um Inquisidor, é interrogado no fim do turno e move o marcador de Tribunal normalmente."),
          t("He can achieve objectives (Achievement token and VP as usual) but never takes the Inquisitor's Farewell reward.", "Ele pode cumprir objetivos (marcador de Conquista e PV como sempre), mas nunca faz a Despedida do Inquisidor como recompensa."),
          t("End: when the last Discovery card is drawn, finish the round, then each of you takes one final turn; score Tycho's University and Inquisition like a player.", "Fim: quando a última carta de Descoberta é comprada, termine a rodada e depois cada um faz um turno final; pontue Universidade e Inquisição de Tycho como de um jogador.")
        ], [16, 18])}
      </div>
      <h3 class="subhead">${t("Conditions on Tycho's Action tiles", "Condições nas peças de Ação de Tycho")}</h3>
      <div class="icon-grid">
        ${iconCard("tycho-cond-two-unpersuaded", "Two unpersuaded Inquisitors", "Tycho's cellar has two or more unpersuaded Inquisitor tokens.", "Dois Inquisidores não persuadidos", "O porão de Tycho tem dois ou mais Inquisidores não persuadidos.", 17)}
        ${iconCard("tycho-cond-three-persuaded", "Three fully persuaded Inquisitors", "Tycho has three or more fully persuaded Inquisitor tokens (rounded bar: partial bonus condition).", "Três Inquisidores totalmente persuadidos", "Tycho tem três ou mais Inquisidores totalmente persuadidos (barra arredondada: condição parcial de bônus).", 17)}
        ${iconCard("tycho-cond-two-dice", "Spend dice", "Tycho must spend two observation dice of any color (some tiles require three); spent dice return to the supply.", "Gastar dados", "Tycho precisa gastar dois dados de observação de qualquer cor (algumas peças exigem três); dados gastos voltam ao suprimento.", 17)}
        ${iconCard("tycho-cond-dice-constellations", "Dice and two open constellations", "Tycho must spend two dice of any color, and at least two constellation spots on the Game Board must still be discoverable.", "Dados e duas constelações livres", "Tycho precisa gastar dois dados de qualquer cor, e pelo menos dois espaços de constelação no Tabuleiro ainda precisam estar disponíveis.", 17)}
        ${iconCard("tycho-cond-comet", "Comet on his board", "Tycho must have at least one Comet token on his Player Board.", "Cometa no tabuleiro dele", "Tycho precisa ter pelo menos um Cometa no Tabuleiro de Jogador.", 17)}
      </div>
      <h3 class="subhead">${t("Effects on Tycho's Action tiles", "Efeitos nas peças de Ação de Tycho")}</h3>
      <div class="icon-grid">
        ${iconCard("tycho-place-comet", "Place a comet", "Place one of Tycho's Comet tokens on the Game Board.", "Colocar cometa", "Coloque um Cometa de Tycho no Tabuleiro.", 17)}
        ${iconCard("tycho-move-comet", "Move a comet down", "Move one of Tycho's Comet tokens down (1 → 2, or 2 → Book of Comets), preferring tokens showing 2. On the book, use the leftmost free page of the two-player section; Tycho gets no reward, not even VP.", "Descer um cometa", "Desça um Cometa de Tycho (1 → 2, ou 2 → Livro dos Cometas), dando preferência aos que mostram 2. No livro, use a página livre mais à esquerda da seção de dois jogadores; Tycho não ganha recompensa, nem PV.", 17)}
        ${iconCard("tycho-gain-die", "Gain a die", "Tycho gains one observation die of any color.", "Ganhar dado", "Tycho ganha um dado de observação de qualquer cor.", 17)}
        ${iconCard("tycho-book", "Move his Book", "Move Tycho's Book token right by the number shown. He never gains Library rewards.", "Mover o Livro", "Mova o marcador de Livro de Tycho para a direita pelo número mostrado. Ele nunca ganha recompensas da Biblioteca.", 17)}
        ${iconCard("tycho-lecture", "Lecture", "Move one University token up one space, preferring the Scale whose Subject Tycho fulfils most times; ties go to the leftmost Scale. No University rewards.", "Lecionar", "Suba um marcador de Universidade um espaço, preferindo a Escala cuja Matéria Tycho mais cumpre; empate vai para a Escala mais à esquerda. Sem recompensas da Universidade.", 17)}
        ${iconCard("tycho-persuade", "Persuade", "Move an Inquisitor in Tycho's cellar right, choosing the move that most improves his next interrogation.", "Persuadir", "Mova um Inquisidor do porão de Tycho para a direita, escolhendo o movimento que mais melhora o próximo interrogatório.", 17)}
        ${iconCard("tycho-remove-persuaded", "Remove a persuaded Inquisitor", "Remove one fully persuaded Inquisitor token.", "Retirar Inquisidor persuadido", "Retire um Inquisidor totalmente persuadido.", 17)}
        ${iconCard("tycho-vp", "Victory points", "Tycho gains the VP shown in the icon.", "Pontos de vitória", "Tycho ganha os PV mostrados no ícone.", 17)}
        ${iconCard("tycho-constellation", "Observe a constellation", "Put Tycho's leftmost Constellation token on the available constellation worth the most VP (tie: leftmost). He gains its VP only — no other card rewards, no reward for the emptied space.", "Observar constelação", "Coloque o marcador de Constelação mais à esquerda de Tycho na constelação disponível que vale mais PV (empate: a mais à esquerda). Ele ganha só os PV — sem outras recompensas da carta nem do espaço esvaziado.", 17)}
        ${iconCard("tycho-major-object", "Observe a Major Object", "Put the Discovery card whose Major Object scores most into Tycho's Library; he gains that VP and ignores every other reward on the card (including an Inquisitor icon). Refill the board as usual.", "Observar Objeto Principal", "Coloque na Biblioteca de Tycho a carta de Descoberta cujo Objeto Principal vale mais; ele ganha esses PV e ignora todas as outras recompensas da carta (inclusive o ícone de Inquisidor). Reponha o tabuleiro normalmente.", 17)}
        ${iconCard("tycho-top-card", "Take the top card", "Put the top card of the Discovery deck into Tycho's Library, light side up.", "Pegar carta do topo", "Coloque a carta do topo do baralho de Descobertas na Biblioteca de Tycho, lado claro para cima.", 17)}
      </div>`;
  }

  // ---------- iconography ----------

  function iconsSection() {
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), sectionIndex("icons"), [9, 11, 12, 20])}
      <p class="glossary-intro">${t("Each image is cropped individually from the rulebook. Icons are shown as printed on cards, tiles and boards.", "Cada imagem foi recortada individualmente do manual. Os ícones aparecem como impressos em cartas, peças e tabuleiros.")}</p>
      <h3 class="subhead">${t("Dice and observation", "Dados e observação")}</h3>
      <div class="icon-grid">
        ${iconCard("gain-die", "Gain a Die", "Take one observation die of any color from the supply and set it to 1.", "Ganhar Dado", "Pegue do suprimento um dado de observação de qualquer cor e ajuste-o para 1.", 20)}
        ${iconCard("increase-all-red-1", "Red +1", "Increase all your red observation dice by 1.", "Vermelho +1", "Aumente todos os seus dados vermelhos em 1.", 9)}
        ${iconCard("increase-all-yellow-1", "Yellow +1", "Increase all your yellow observation dice by 1.", "Amarelo +1", "Aumente todos os seus dados amarelos em 1.", 9)}
        ${iconCard("increase-all-blue-1", "Blue +1", "Increase all your blue observation dice by 1.", "Azul +1", "Aumente todos os seus dados azuis em 1.", 9)}
        ${iconCard("increase-all-red-2", "Red +2", "Increase all your red observation dice by 2.", "Vermelho +2", "Aumente todos os seus dados vermelhos em 2.", 9)}
        ${iconCard("increase-all-yellow-2", "Yellow +2", "Increase all your yellow observation dice by 2.", "Amarelo +2", "Aumente todos os seus dados amarelos em 2.", 9)}
        ${iconCard("increase-all-blue-2", "Blue +2", "Increase all your blue observation dice by 2.", "Azul +2", "Aumente todos os seus dados azuis em 2.", 9)}
        ${iconCard("increase-single-2", "One die +2", "Increase any single one of your dice by 2.", "Um dado +2", "Aumente qualquer um dos seus dados em 2.", 9)}
        ${iconCard("increase-single-3", "One die +3", "Increase any single one of your dice by 3.", "Um dado +3", "Aumente qualquer um dos seus dados em 3.", 9)}
        ${iconCard("major-object-cost", "Major Object cost", "A two-color cost (here purple 9 = red + blue): spend at least one die of each of the two colors.", "Custo de Objeto Principal", "Um custo de duas cores (aqui roxo 9 = vermelho + azul): gaste pelo menos um dado de cada uma das duas cores.", 20)}
        ${iconCard("major-object", "Major Object", "Marks the Major Object option (also on your Player Board's Observe reminder).", "Objeto Principal", "Marca a opção de Objeto Principal (também no lembrete de Observar do Tabuleiro de Jogador).", 20)}
        ${iconCard("constellations", "Constellations", "Observe up to two constellations (as printed on your Player Board).", "Constelações", "Observe até duas constelações (como impresso no Tabuleiro de Jogador).", 6)}
        ${iconCard("observe", "Observe", "Observe either a Major Object or up to two constellations, spending dice from your Player Board.", "Observar", "Observe um Objeto Principal ou até duas constelações, gastando dados do Tabuleiro de Jogador.", 20)}
      </div>
      <h3 class="subhead">${t("Library, University and resources", "Biblioteca, Universidade e recursos")}</h3>
      <div class="icon-grid">
        ${iconCard("write-complete", "Write (complete)", "Move one of your Book tokens to the end of its Library row.", "Escrever (completa)", "Mova um dos seus marcadores de Livro até o fim da fileira da Biblioteca.", 20)}
        ${iconCard("write-3", "Write 3 (partial)", "Move any of your Book tokens a total number of spaces equal to the number.", "Escrever 3 (parcial)", "Mova quaisquer marcadores de Livro um total de espaços igual ao número.", 20)}
        ${iconCard("gain-card", "Gain a card", "Take the top Discovery card and add it to your Library, light side up.", "Ganhar carta", "Pegue a carta de Descoberta do topo e adicione-a à Biblioteca, lado claro para cima.", 20)}
        ${iconCard("lecture", "Lecture", "Move one University token up one space on its Scale and gain the reward to the right.", "Lecionar", "Suba um marcador de Universidade um espaço na Escala e ganhe a recompensa à direita.", 20)}
        ${iconCard("quadrant", "Quadrant", "Gain one Quadrant token from the supply.", "Quadrante", "Ganhe um Quadrante do suprimento.", 20)}
        ${iconCard("gain-vp", "Gain VP", "Gain victory points equal to the number.", "Ganhar PV", "Ganhe pontos de vitória iguais ao número.", 20)}
        ${iconCard("lose-vp", "Lose VP", "Lose victory points equal to the number (black icon).", "Perder PV", "Perca pontos de vitória iguais ao número (ícone preto).", 20)}
        ${iconCard("upgrade", "Upgrade", "Flip one of your Action tiles to the golden upgraded side.", "Aprimorar", "Vire uma das suas peças de Ação para o lado dourado.", 20)}
      </div>
      <h3 class="subhead">${t("Inquisition", "Inquisição")}</h3>
      <div class="icon-grid">
        ${iconCard("gain-inquisitor", "Gain an Inquisitor", "Take an Inquisitor from the supply and put it on the leftmost space of your cellar (mandatory).", "Ganhar Inquisidor", "Pegue um Inquisidor do suprimento e coloque-o no espaço mais à esquerda do porão (obrigatório).", 12)}
        ${iconCard("persuade", "Persuade", "Move any Inquisitor in your cellar one space right.", "Persuadir", "Mova qualquer Inquisidor do porão um espaço para a direita.", 12)}
        ${iconCard("inquisitors-farewell", "Inquisitor's Farewell", "Optional: remove one Inquisitor from the rightmost cellar space; Gain a Die and 1 Quadrant.", "Despedida do Inquisidor", "Opcional: retire um Inquisidor do espaço mais à direita do porão; Ganhe um Dado e 1 Quadrante.", 12)}
        ${iconCard("interrogation-value", "Interrogation value", "The number on top of each cellar arch; Inquisitors there add it during an interrogation.", "Valor de interrogatório", "O número no topo de cada arco do porão; Inquisidores ali somam esse valor no interrogatório.", 20)}
      </div>
      <h3 class="subhead">${t("Free actions (Character Board)", "Ações livres (Tabuleiro de Personagem)")}</h3>
      <div class="icon-grid">
        ${iconCard("free-1", "1 Quadrant", "Change one die's color (same value) OR increase one die by 1.", "1 Quadrante", "Mude a cor de um dado (mesmo valor) OU aumente um dado em 1.", 9)}
        ${iconCard("free-2", "2 Quadrants", "Gain a new observation die OR Write 3.", "2 Quadrantes", "Ganhe um dado de observação novo OU Escreva 3.", 9)}
        ${iconCard("free-3", "3 Quadrants", "Persuade twice: the same Inquisitor twice or two different ones.", "3 Quadrantes", "Persuadir duas vezes: o mesmo Inquisidor duas vezes ou dois diferentes.", 9)}
        ${iconCard("free-4", "4 Quadrants", "Spot a Comet.", "4 Quadrantes", "Avistar Cometa.", 9)}
      </div>
      <h3 class="subhead">${t("Subject tiles · arch side (end-game scoring)", "Peças de Matéria · lado do arco (pontuação final)")}</h3>
      <div class="icon-grid">
        ${iconCard("subject-major-object", "Major Objects", "Score for each Major Object in your Library (dark reward rows).", "Objetos Principais", "Pontue cada Objeto Principal na Biblioteca (fileiras escuras).", 11)}
        ${iconCard("subject-library", "Library", "Score the spaces moved by your leftmost Book token.", "Biblioteca", "Pontue os espaços percorridos pelo marcador de Livro mais à esquerda.", 11)}
        ${iconCard("subject-inquisitors", "Inquisitors", "Score for each Inquisitor in your cellar at the end (Farewell-removed ones don't count).", "Inquisidores", "Pontue cada Inquisidor no porão no fim (os retirados por Despedida não contam).", 11)}
        ${iconCard("subject-upgrades", "Upgrades", "Score for each upgraded Action tile.", "Aprimoramentos", "Pontue cada peça de Ação aprimorada.", 11)}
        ${iconCard("subject-comets", "Comets", "Score for each Comet token removed from your Player Board.", "Cometas", "Pontue cada Cometa retirado do Tabuleiro de Jogador.", 11)}
        ${iconCard("subject-constellations", "Constellations", "Score for each Constellation token removed from your Player Board.", "Constelações", "Pontue cada marcador de Constelação retirado do Tabuleiro de Jogador.", 11)}
      </div>
      <h3 class="subhead">${t("Objectives · niche side and printed", "Objetivos · lado do nicho e impressos")}</h3>
      <div class="icon-grid">
        ${iconCard("objective-board-observe", "Printed: 2× observe + comets", "Observe two Major Objects, observe two constellations and spot two comets.", "Impresso: 2× observar + cometas", "Observe dois Objetos Principais, observe duas constelações e aviste dois cometas.", 11)}
        ${iconCard("objective-board-university", "Printed: 2× top of a Scale", "Reach the top of a Scale tile with two of your University tokens.", "Impresso: 2× topo de Escala", "Chegue ao topo de uma Escala com dois marcadores de Universidade.", 11)}
        ${iconCard("objective-major-4", "4× Major Objects", "Observe four Major Objects.", "4× Objetos Principais", "Observe quatro Objetos Principais.", 11)}
        ${iconCard("objective-library-3", "3× Library", "Have all your Book tokens on at least the third space of your Library.", "3× Biblioteca", "Tenha todos os marcadores de Livro pelo menos no terceiro espaço da Biblioteca.", 11)}
        ${iconCard("objective-inquisitors-6", "6× Inquisitors", "Have at least six Inquisitor tokens in your cellar at one time.", "6× Inquisidores", "Tenha pelo menos seis Inquisidores no porão ao mesmo tempo.", 11)}
        ${iconCard("objective-upgrades-5", "5× Upgrades", "Have at least five upgraded Action tiles.", "5× Aprimoramentos", "Tenha pelo menos cinco peças de Ação aprimoradas.", 11)}
        ${iconCard("objective-comets-5", "5× Comets", "Have at least five Comet tokens removed from your Player Board.", "5× Cometas", "Tenha pelo menos cinco Cometas retirados do Tabuleiro de Jogador.", 11)}
        ${iconCard("objective-constellations-6", "6× Constellations", "Have at least six Constellation tokens removed from your Player Board.", "6× Constelações", "Tenha pelo menos seis marcadores de Constelação retirados do Tabuleiro de Jogador.", 11)}
      </div>`;
  }

  // ---------- examples ----------

  function examplesSection() {
    const examples = [
      [t("Observing Luna (Major Object)", "Observando Luna (Objeto Principal)"), [
        t("Luna costs orange 8 = red + yellow dice. Galileo spends red 5, red 2 and yellow 1 (total 8) and returns them to the supply.", "Luna custa laranja 8 = dados vermelhos + amarelos. Galileo gasta vermelho 5, vermelho 2 e amarelo 1 (total 8) e os devolve ao suprimento."),
        t("He scores 7 VP and, because Luna shows an Inquisitor icon, puts an Inquisitor on the leftmost cellar space.", "Ele marca 7 PV e, como Luna mostra o ícone de Inquisidor, coloca um Inquisidor no espaço mais à esquerda do porão."),
        t("The card goes face-up into his Library; a new card from the deck fills the board.", "A carta vai virada para cima para a Biblioteca; uma nova carta do baralho preenche o tabuleiro.")
      ], 6],
      [t("Observing Ursa Minor (constellation)", "Observando Ursa Minor (constelação)"), [
        t("Ursa Minor costs red 5; Galileo pays three red dice: 3, 1 and 1.", "Ursa Minor custa vermelho 5; Galileo paga três dados vermelhos: 3, 1 e 1."),
        t("He covers it with his leftmost Constellation token, gains 3 VP and a Quadrant listed on the card.", "Ele a cobre com o marcador de Constelação mais à esquerda e ganha 3 PV e um Quadrante listados na carta."),
        t("Then he gains the reward printed under the space the token left: a Lecture action, resolved at once.", "Depois ganha a recompensa impressa sob o espaço de onde o marcador saiu: uma ação de Lecionar, resolvida na hora.")
      ], 7],
      [t("Spotting and using a comet", "Avistando e usando um cometa"), [
        t("Galileo Spots a Comet: his leftmost Comet token goes above the Discovery cards, “1” side up.", "Galileo Avista um Cometa: o Cometa mais à esquerda vai para cima das cartas de Descoberta, lado “1”."),
        t("Next turn he Observes and uses it to cut the cost by 1 — exactly enough. The token moves below the cards and flips to “2”.", "No turno seguinte, ele Observa e o usa para reduzir o custo em 1 — exatamente o suficiente. O marcador desce para baixo das cartas e vira para “2”."),
        t("Used again, it would reduce a cost by 2 and then go onto the Book of Comets.", "Usado de novo, reduziria um custo em 2 e então iria para o Livro dos Cometas.")
      ], 8],
      [t("A moving action choice", "Escolhendo uma ação móvel"), [
        t("Tile: blue +1 / one die +2. Galileo has blue 2, 1, 1 and red 3.", "Peça: azul +1 / um dado +2. Galileo tem azul 2, 1, 1 e vermelho 3."),
        t("Option A: blues become 3, 2, 2. Option B: red becomes 5 — or one blue +2, to avoid overspending later.", "Opção A: os azuis viram 3, 2, 2. Opção B: o vermelho vira 5 — ou um azul +2, para não gastar demais depois.")
      ], 9],
      [t("Book of Comets in Cleanup", "Livro dos Cometas na Manutenção"), [
        t("Galileo ends his turn with two Comet tokens on the book.", "Galileo termina o turno com dois Cometas sobre o livro."),
        t("He places one on a Quadrant page (gains 1 Quadrant) and one on a Gain a Die page (takes a red die at 1).", "Coloca um numa página de Quadrante (ganha 1 Quadrante) e outro numa página de Ganhar Dado (pega um dado vermelho em 1).")
      ], 10],
      [t("Complete writing", "Escrita completa"), [
        t("A flag Write moves the outermost Book token to the end of its row.", "Um Escrever com bandeira leva o marcador de Livro mais externo até o fim da fileira."),
        t("Left to right it gains: Persuade, 2 VP, yellow dice +1, Persuade again, Lecture.", "Da esquerda para a direita ganha: Persuadir, 2 PV, dados amarelos +1, Persuadir de novo, Lecionar."),
        t("It ends on a blank sixth space, which gives nothing.", "Termina num sexto espaço em branco, que não dá nada.")
      ], 10],
      [t("Claiming an objective", "Reivindicando um objetivo"), [
        t("Galileo is first to observe two Major Objects, two constellations and spot two comets: 7 VP and his token on top.", "Galileo é o primeiro a observar dois Objetos Principais, duas constelações e avistar dois cometas: 7 PV e o marcador no topo."),
        t("Copernicus and Bruno do it later: 3 VP each, tokens in the shared space.", "Copérnico e Bruno cumprem depois: 3 PV cada, marcadores no espaço compartilhado."),
        t("All three may take an Inquisitor's Farewell.", "Os três podem fazer uma Despedida do Inquisidor.")
      ], 11],
      [t("Subject scoring", "Pontuando uma Matéria"), [
        t("Copernicus observed 4 Major Objects and his token is on the 4× row: 4 × 4 = 16 VP.", "Copérnico observou 4 Objetos Principais e o marcador dele está na fileira 4×: 4 × 4 = 16 PV."),
        t("Bruno observed 6 but sits on the 2× row: 12 VP.", "Bruno observou 6, mas está na fileira 2×: 12 PV.")
      ], 11],
      [t("An interrogation", "Um interrogatório"), [
        t("Galileo gained an Inquisitor and used an upgraded tile to Persuade twice, moving that new Inquisitor two spaces right.", "Galileo ganhou um Inquisidor e usou uma peça aprimorada para Persuadir duas vezes, movendo esse Inquisidor novo dois espaços para a direita."),
        t("Cellar: −2 (one token), −1 (the moved one), +1 +1 (two persuaded earlier) = −1.", "Porão: −2 (um marcador), −1 (o movido), +1 +1 (dois persuadidos antes) = −1."),
        t("His Tribunal token moves one space left.", "O marcador de Tribunal anda um espaço para a esquerda.")
      ], 12],
      [t("Final scoring", "Pontuação final"), [
        t("University: Major Objects 3× × 5 = 15; Comets 1× × 4 = 4; Constellations 0 (never lectured there); Library 2× × 4 = 8.", "Universidade: Objetos Principais 3× × 5 = 15; Cometas 1× × 4 = 4; Constelações 0 (nunca lecionou ali); Biblioteca 2× × 4 = 8."),
        t("Inquisitors: three fully persuaded +3, others −2 and −4: net −3.", "Inquisidores: três totalmente persuadidos +3, outros −2 e −4: saldo −3."),
        t("Reputation: +3 VP from his Tribunal position.", "Reputação: +3 PV pela posição no Tribunal.")
      ], 13],
      [t("Orbis Lacteus (colorblind aid)", "Orbis Lacteus (ajuda para daltônicos)"), [
        t("Its purple icon has dots matching the red and blue dice: pay with red and blue, e.g. red 1 + blue 2 toward the cost.", "O ícone roxo tem pontos que correspondem aos dados vermelho e azul: pague com vermelho e azul, por exemplo vermelho 1 + azul 2 rumo ao custo.")
      ], 18]
    ];
    if (isSolo()) {
      examples.push(
        [t("Tycho moves", "Tycho se move"), [
          t("A “2” tile is flipped; Tycho's telescope moves two tiles right. None is upgraded, so it does not stop early.", "Uma peça “2” é revelada; o telescópio de Tycho anda duas peças para a direita. Nenhuma é aprimorada, então ele não para antes.")
        ], 16],
        [t("Tycho falls to the bottom row", "Tycho cai na última fileira"), [
          t("Tycho has no Comet tokens left, so the top row's condition fails.", "Tycho não tem mais Cometas, então a condição da fileira de cima falha."),
          t("He takes the bottom row: Book +1 and moves both Inquisitors once (best for his interrogation); with all comets placed, he Lectures on the Comets Scale.", "Ele faz a última fileira: Livro +1 e move os dois Inquisidores uma vez (melhor para o interrogatório); com todos os cometas colocados, ele Leciona na Escala de Cometas."),
          t("Without three fully persuaded Inquisitors he skips the partial bonus (remove one and score 10 VP).", "Sem três Inquisidores totalmente persuadidos, ele não ganha o bônus parcial (retirar um e marcar 10 PV).")
        ], 17]
      );
    }
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), sectionIndex("examples"), [...new Set(examples.map((example) => example[2]))])}
      <div class="example-grid">${examples.map(([title, items, page], index) => `
        <article class="example-card">
          <span class="card-number">${String(index + 1).padStart(2, "0")}</span>
          <h3>${title}</h3>
          ${lineList(items)}
          <div class="example-source"><span>${t("Paraphrased from the manual", "Paráfrase do manual")}</span>${referenceLink(page)}</div>
        </article>`).join("")}</div>`;
  }

  // ---------- glossary ----------

  const glossary = [
    { term: ["Discovery card", "Carta de Descoberta"], text: ["A card with one Major Object and one or more constellations, plus a reward row for your Library. Tier I/II/III is on its back.", "Carta com um Objeto Principal e uma ou mais constelações, mais uma fileira de recompensas para a Biblioteca. O nível I/II/III está no verso."], page: 6 },
    { term: ["Major Object", "Objeto Principal"], text: ["The big object on a Discovery card (planet, moon, nebula…). Paid with two dice colors; taking it moves the whole card to your Library.", "O objeto grande da carta de Descoberta (planeta, lua, nebulosa…). Pago com duas cores de dados; observá-lo leva a carta inteira para a Biblioteca."], page: 6 },
    { term: ["Constellation", "Constelação"], text: ["A smaller target on a Discovery card, paid with one dice color and claimed by covering it with a Constellation token.", "Um alvo menor na carta de Descoberta, pago com uma cor de dado e reivindicado ao cobri-lo com um marcador de Constelação."], page: 7 },
    { term: ["Starry sky", "Céu estrelado"], text: ["The arc on your Player Board your telescope moves along: two crossed-out spaces and five action spaces.", "O arco no Tabuleiro de Jogador por onde o telescópio se move: dois espaços riscados e cinco espaços de ação."], page: 5 },
    { term: ["Fixed / moving action", "Ação fixa / móvel"], text: ["Fixed actions are printed on the dark part of each space; moving actions are the Action tiles on the light part, which rotate every turn.", "Ações fixas estão impressas na parte escura de cada espaço; ações móveis são as peças de Ação na parte clara, que giram a cada turno."], page: 5 },
    { term: ["Queue", "Fila"], text: ["The line of 6 Action tiles on the starry sky; the used tile returns to its beginning in Cleanup.", "A fila de 6 peças de Ação no céu estrelado; a peça usada volta ao começo dela na Manutenção."], page: 10 },
    { term: ["Quadrant", "Quadrante"], text: ["Knowledge tokens (1 or 3) spent on free actions. Also a tie-breaker.", "Marcadores de conhecimento (1 ou 3) gastos em ações livres. Também desempatam."], page: 9 },
    { term: ["Library", "Biblioteca"], text: ["Your collected Discovery cards, overlapped so their 4 reward rows extend the 4 Book token tracks.", "Suas cartas de Descoberta coletadas, sobrepostas para que as 4 fileiras de recompensa prolonguem as 4 trilhas de Livro."], page: 10 },
    { term: ["Write", "Escrever"], text: ["Move Book tokens right along the Library rows, gaining each reward passed.", "Mover marcadores de Livro para a direita nas fileiras da Biblioteca, ganhando cada recompensa por onde passam."], page: 10 },
    { term: ["Lecture", "Lecionar"], text: ["Move one University token up a Scale tile and take the reward beside it.", "Subir um marcador de Universidade numa Escala e pegar a recompensa ao lado."], page: 7 },
    { term: ["Scale tile / Subject tile", "Escala / Matéria"], text: ["Scale tiles are the University ladders; the Subject tile above each (arch side) names what that Scale multiplies at the end. Niche-side Subject tiles are objectives.", "Escalas são as escadas da Universidade; a peça de Matéria acima de cada uma (lado do arco) indica o que aquela Escala multiplica no fim. Matérias com o lado do nicho são objetivos."], page: 11 },
    { term: ["Objective / Achievement token", "Objetivo / marcador de Conquista"], text: ["One of 4 goals atop the university. Your Achievement tokens mark which ones you met (7 VP first, 3 VP later).", "Uma das 4 metas no topo da universidade. Seus marcadores de Conquista marcam as que cumpriu (7 PV o primeiro, 3 PV os demais)."], page: 11 },
    { term: ["Cellar", "Porão"], text: ["The row of arches on your Player Board where Inquisitors sit; further right means more persuaded.", "A fileira de arcos no Tabuleiro de Jogador onde ficam os Inquisidores; mais à direita significa mais persuadido."], page: 12 },
    { term: ["Fully persuaded", "Totalmente persuadido"], text: ["An Inquisitor on the rightmost cellar space (+1 in interrogations and at the end).", "Um Inquisidor no espaço mais à direita do porão (+1 nos interrogatórios e no fim)."], page: 13 },
    { term: ["Interrogation", "Interrogatório"], text: ["Cleanup check after you moved an Inquisitor: the cellar's top values move your Tribunal token.", "Verificação na Manutenção depois de mover um Inquisidor: os valores de cima do porão movem o marcador de Tribunal."], page: 12 },
    { term: ["Tribunal / Reputation", "Tribunal / Reputação"], text: ["The track below the university; your Tribunal token's final space gives or takes VP.", "A trilha abaixo da universidade; o espaço final do seu marcador de Tribunal dá ou tira PV."], page: 12 },
    { term: ["Book of Comets", "Livro dos Cometas"], text: ["Board pages that reward Comet tokens used twice; one token per page, overflow to the Appendix.", "Páginas do tabuleiro que recompensam Cometas usados duas vezes; um marcador por página, excesso no Apêndice."], page: 10 },
    { term: ["Round", "Rodada"], text: ["Every player taking one turn, starting with the first player.", "Cada jogador fazendo um turno, começando pelo primeiro jogador."], page: 13 }
  ];

  function glossarySection() {
    const visible = [...glossary];
    if (isSolo()) {
      visible.push({ term: ["Tycho Brahe", "Tycho Brahe"], text: ["The solo rival. He moves with Movement tiles and acts with 5 Action tiles, row by row.", "O rival do solo. Move-se com peças de Movimento e age com 5 peças de Ação, fileira por fileira."], page: 16 });
    }
    if (isAdvanced()) {
      visible.push({ term: ["Personal comet page", "Página pessoal de cometa"], text: ["A Book of Comets page printed on some Character Boards; you may place a comet there instead of on the book.", "Uma página do Livro dos Cometas impressa em alguns Tabuleiros de Personagem; você pode colocar um cometa ali em vez de no livro."], page: 10 });
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
    document.body.classList.add("theme-galileo");
    document.documentElement.lang = state.language;
    document.title = t("Galileo Galilei — Field Manual", "Galileo Galilei — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Galileo Galilei: basic, advanced and solo games, with a match-filtered setup checklist, quick reference and iconography.",
        "Regras interativas bilíngues de Galileo Galilei: jogo básico, avançado e solo, com lista de preparação filtrada, referência rápida e iconografia."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook · core game", "Livro interativo · jogo base")}</p>
          <h1>Galileo Galilei</h1>
          <p class="hero-intro">${t(
            "Turn of the 16th and 17th centuries: astronomers trade the naked eye for the first telescopes. Move your telescope to pick actions, raise your observation dice, catalogue planets and constellations, write, lecture — and keep the Inquisition persuaded.",
            "Virada dos séculos XVI e XVII: astrônomos trocam o olho nu pelos primeiros telescópios. Mova o telescópio para escolher ações, aumente os dados de observação, catalogue planetas e constelações, escreva, lecione — e mantenha a Inquisição persuadida."
          )}</p>
          <div class="hero-meta"><span>${t("1–4 players", "1–4 jogadores")}</span><span>${t("90–120 min", "90–120 min")}</span><span>${t("Basic · advanced · solo", "Básico · avançado · solo")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/galileo-galilei.webp" alt="${t("Cover of the Galileo Galilei rulebook", "Capa do manual de Galileo Galilei")}" fetchpriority="high"><figcaption>${t("Rulebook cover · Tomáš Holek and Michal Peichl", "Capa do manual · Tomáš Holek e Michal Peichl")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("Observatory log", "Diário do observatório")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column galileo-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied 20-page Galileo Galilei rulebook (Pink Troubadour): basic game, advanced special abilities and the Tycho Brahe solo mode. Rewards printed on individual Discovery cards, Scale tiles and Tycho's Action tiles stay on those components; points marked “Guide's reading” are interpretations where the rulebook is silent.",
            "Este guia cobre o manual de 20 páginas fornecido de Galileo Galilei (Pink Troubadour): jogo básico, habilidades especiais avançadas e o modo solo com Tycho Brahe. As recompensas impressas em cada carta de Descoberta, Escala e peça de Ação de Tycho ficam nesses componentes; pontos marcados como “Leitura do guia” são interpretações onde o manual é omisso."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${victorySection()}</section>
          <section class="rule-section">${turnSection()}</section>
          <section class="rule-section">${systemsSection()}</section>
          ${isAdvanced() ? `<section class="rule-section">${astronomersSection()}</section>` : ""}
          ${isSolo() ? `<section class="rule-section">${soloSection()}</section>` : ""}
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the Galileo Galilei rulebook. Game design: Tomáš Holek; illustration and graphic design: Michal Peichl. Published by Pink Troubadour.",
        "Guia pessoal de consulta baseado no manual de Galileo Galilei. Design do jogo: Tomáš Holek; ilustração e design gráfico: Michal Peichl. Publicado pela Pink Troubadour."
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
      root.querySelector(".galileo-page")?.prepend(notice);
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
      const players = target.dataset.players;
      if (PLAYER_COUNTS.includes(players) && players !== state.players) {
        applyConfigChange((draft) => {
          draft.players = players;
          if (players === "1") {
            draft.mode = "advanced";
          }
        });
      }
      return;
    }
    if (target.matches("[data-mode]")) {
      const mode = target.dataset.mode === "advanced" ? "advanced" : "basic";
      if (mode !== state.mode) {
        applyConfigChange((draft) => {
          draft.mode = mode;
        });
      }
      return;
    }
    if (target.matches("[data-astro]")) {
      const id = target.dataset.astro;
      if (ASTRONOMERS.includes(id)) {
        applyConfigChange((draft) => {
          draft.astronomers[id] = target.dataset.astroValue === "yes";
        });
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

  window.GalileoGalilei = { renderInto, onClick, onChange };
})();
