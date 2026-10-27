(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.kelp.v1";
  const SETUP_KEY = "field-manual.kelp.setup.v1";
  const MANUAL_FILE = "kelp_core.pdf";
  const ICONS = "assets/kelp/icons/";

  const defaults = { language: "pt-BR", side: "octopus", board: "day" };
  const phaseIds = ["board", "shark", "octopus-cards", "octopus-blocks", "start"];
  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  function normalizePreferences(saved) {
    return {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      side: saved?.side === "shark" ? "shark" : "octopus",
      board: saved?.board === "night" ? "night" : "day"
    };
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : { ...defaults };
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Kelp preferences.", error);
      return { ...defaults };
    }
  }

  function loadSetup() {
    try {
      const raw = localStorage.getItem(SETUP_KEY);
      if (!raw) {
        return { board: state.board, checks: [] };
      }
      const saved = JSON.parse(raw);
      return {
        board: state.board,
        checks: saved?.board === state.board && Array.isArray(saved.checks)
          ? [...new Set(saved.checks.filter((id) => phaseIds.includes(id)))]
          : []
      };
    } catch (error) {
      storageIssues.add("setup-read");
      console.error("Could not read Kelp setup progress.", error);
      return { board: state.board, checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Kelp preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Kelp setup progress.", error);
    }
  }

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function sideName(side = state.side) {
    return side === "shark" ? t("Shark", "Tubarão") : t("Octopus", "Polvo");
  }

  function manualUrl(page) {
    const script = document.querySelector('script[src*="kelp.js"]');
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
          <p class="eyebrow">${t("FIELD GUIDE", "GUIA DE CAMPO")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="kelp-section-references">${pages.map(referenceLink).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function ruleLine(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
  }

  function iconCard(file, titleEn, bodyEn, titlePt, bodyPt, page) {
    const title = t(titleEn, titlePt);
    return `
      <article class="icon-card">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}" alt="${title}"></span>
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

  function sectionNav() {
    const links = [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["victory", t("Victory", "Vitória")],
      ["turn", t("Turn", "Turnos")],
      ["board", t("Board", "Tabuleiro")],
      ["blocks-cards", t("Blocks & cards", "Blocos e cartas")],
      ["examples", t("Examples", "Exemplos")],
      ["glossary", t("Glossary", "Glossário")]
    ];
    return links.map(([id, label], index) => `
      <button type="button" data-scroll="${id}"><span class="toc-index">${String(index + 1).padStart(2, "0")}</span>${label}</button>`).join("");
  }

  function renderHeader() {
    return `
      <header class="site-header">
        <a class="brand" href="#/" aria-label="${t("Field Manual home", "Página inicial do Manual de Campo")}">
          <span class="brand-mark" aria-hidden="true">K</span>
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

  function sideSwitch() {
    return `
      <div class="kelp-side-picker">
        <span>${t("Read the guide as", "Ver o guia como")}</span>
        <div class="team-switch" role="group" aria-label="${t("Choose a side to read", "Escolha o lado para consultar")}">
          <button type="button" data-side="shark" aria-pressed="${state.side === "shark"}">${t("Shark", "Tubarão")}</button>
          <button type="button" data-side="octopus" aria-pressed="${state.side === "octopus"}">${t("Octopus", "Polvo")}</button>
        </div>
      </div>`;
  }

  function storageNoticeText() {
    const readFailed = storageIssues.has("preferences-read") || storageIssues.has("setup-read");
    const writeFailed = storageIssues.has("preferences-write") || storageIssues.has("setup-write");
    return t(
      `${readFailed ? "This browser could not read saved Kelp preferences or setup progress; defaults are shown. " : ""}${writeFailed ? "The latest change could not be saved and is visible on screen only." : ""}`,
      `${readFailed ? "Este navegador não conseguiu ler as preferências ou o progresso de Kelp salvos; as opções padrão estão sendo mostradas. " : ""}${writeFailed ? "A alteração mais recente não pôde ser salva e aparece somente na tela." : ""}`
    ).trim();
  }

  function matchConfiguration() {
    const boardTitle = state.board === "night" ? t("Night board", "Tabuleiro noturno") : t("Day board", "Tabuleiro diurno");
    const choices = [
      {
        id: "day",
        title: t("Day board · standard", "Tabuleiro diurno · padrão"),
        description: t(
          "Use the front of the double-sided board. Its center is exposed, the cardinal zones are Kelp Zones, and the corner zones are rocky. Recommended for a first game.",
          "Use a frente do tabuleiro dupla face. O centro é exposto, as zonas cardeais são Zonas de Kelp e os cantos são rochosos. Recomendado para a primeira partida."
        ),
        checked: state.board === "day"
      },
      {
        id: "night",
        title: t("Night board · alternate", "Tabuleiro noturno · alternativo"),
        description: t(
          "Use the reverse side: it rearranges zone types and Shark Dens, including Narrow Rocky Zones. The same turn and action rules apply; the zone values are printed on that side. Recommended once you know the game.",
          "Use o verso: ele reorganiza os tipos de zona e as Tocas do Tubarão, incluindo Zonas Rochosas Estreitas. As mesmas regras de turno e ação continuam valendo; os valores das zonas estão impressos nesse lado. Recomendado depois de conhecer o jogo."
        ),
        checked: state.board === "night"
      }
    ];
    return `
      <section class="controls-panel kelp-config" id="build-match" aria-labelledby="kelp-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="kelp-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t("Kelp is always a two-player core game. Choose the board side; the Shark/Octopus buttons only filter the guide and do not assign players.", "Kelp é sempre um jogo base para duas pessoas. Escolha o lado do tabuleiro; os botões Tubarão/Polvo só filtram o guia e não atribuem jogadores.")}</p>
          </div>
          ${sideSwitch()}
        </div>
        <fieldset class="kelp-choice-group">
          <legend>${t("Board side · selected:", "Lado do tabuleiro · selecionado:")} <span>${boardTitle}</span></legend>
          <p class="kelp-choice-intro">${t("This is the only pre-game variant in the supplied core rulebook. Both choices use the same components.", "Esta é a única variante pré-jogo do manual base fornecido. As duas opções usam os mesmos componentes.")}</p>
          <div class="kelp-choice-grid">${choices.map((choice) => `
            <label class="kelp-choice-card ${choice.checked ? "is-selected" : ""}">
              <input type="radio" name="kelp-board" value="${choice.id}" data-board="${choice.id}" ${choice.checked ? "checked" : ""}>
              <span class="kelp-choice-copy"><strong>${choice.title}</strong><small>${choice.description}</small></span>
            </label>`).join("")}</div>
        </fieldset>
      </section>`;
  }

  function boardSummary() {
    const selected = state.board === "night";
    return `
      ${sectionHeading("board", t("Board zones & tracks", "Zonas e trilhas do tabuleiro"), "05", selected ? [4, 19] : [4])}
      <div class="map-notes-grid">
        <article class="map-note">
          <span class="map-label">${t("Selected board", "Tabuleiro escolhido")}</span>
          <h3>${selected ? t("Night board", "Tabuleiro noturno") : t("Day board", "Tabuleiro diurno")}</h3>
          ${lineList(selected
            ? [
              ruleLine("Night-side legend", "1 Exposed Zone; 2 Center Zone; 3 Kelp Zone; 4 Rocky Zone; 5 Narrow Rocky Zone; 6 Shark Den.", "Legenda do lado noturno", "1 Zona Exposta; 2 Zona Central; 3 Zona de Kelp; 4 Zona Rochosa; 5 Zona Rochosa Estreita; 6 Toca do Tubarão."),
              ruleLine("Zone values", "Use the number printed in each zone as the minimum die value for Search or Strike.", "Valores das zonas", "Use o número impresso em cada zona como valor mínimo do dado para Busca ou Ataque."),
              ruleLine("Dens", "The dens lie along the inner Shark paths. At setup or when returned to a den, the Shark is on its Current space facing the center and chooses a direction when leaving.", "Tocas", "As tocas ficam nos caminhos internos do Tubarão. Na preparação ou ao voltar para uma toca, o Tubarão fica no espaço de Corrente em frente a ela, voltado para o centro, e escolhe a direção ao sair.")
            ]
            : [
              ruleLine("Center Zone", "It is exposed, so the Shark has an easier time searching there.", "Zona Central", "É exposta, então o Tubarão tem mais facilidade para buscar nela."),
              ruleLine("Kelp Zones", "The four cardinal zones are Kelp Zones.", "Zonas de Kelp", "As quatro zonas cardeais são Zonas de Kelp."),
              ruleLine("Rocky Zones", "The corner zones are rocky and contain the four Shark Dens.", "Zonas Rochosas", "As zonas de canto são rochosas e contêm as quatro Tocas do Tubarão.")
            ])}
          <p>${t(
            "Zone values and Current spaces are printed on the chosen board. The lines show the Shark's legal movement paths; each zone has a block space for the Octopus.",
            "Os valores das zonas e os espaços de Corrente estão impressos no tabuleiro escolhido. As linhas mostram os caminhos de movimento legais do Tubarão; cada zona tem um espaço de bloco para o Polvo."
          )}</p>
          ${referenceLink(selected ? 19 : 4)}
        </article>
        <article class="map-note">
          <span class="map-label">${t("Shared tracks", "Trilhas compartilhadas")}</span>
          <h3>${t("Read the board", "Leia o tabuleiro")}</h3>
          ${lineList([
            ruleLine("Food Track", "The Octopus moves eaten Food blocks here; filling all four spaces wins the game.", "Trilha de Comida", "O Polvo move para cá os blocos de Comida consumidos; preencher os quatro espaços vence a partida."),
            ruleLine("Hunger Track", "The Shark moves Strike dice and one spent Energy die here; the seventh die exhausts it.", "Trilha de Fome", "O Tubarão move para cá dados de Ataque e um dado de Energia gasto; o sétimo dado o esgota."),
            ruleLine("Growth Track", "The Shark places used Search dice and the first Current used in a move here.", "Trilha de Crescimento", "O Tubarão coloca aqui dados de Busca usados e a primeira Corrente usada em um movimento."),
            ruleLine("Energy area", "The Shark can store up to three dice here to buy Shark cards.", "Área de Energia", "O Tubarão pode guardar até três dados aqui para comprar cartas de Tubarão.")
          ])}
          ${referenceLink(4)}
        </article>
      </div>`;
  }

  function inventory() {
    const cards = [
      {
        label: t("SHARK · PLAYER", "TUBARÃO · JOGADOR"),
        title: t("35 dice · 1 bag · 23 cards", "35 dados · 1 saco · 23 cartas"),
        lines: [
          t("15 blue Current dice, 10 yellow Search dice, and 10 red Strike dice.", "15 dados azuis de Corrente, 10 dados amarelos de Busca e 10 dados vermelhos de Ataque."),
          t("The Shark receives the bag, the Shark deck/market, and 4 Growth tiles. Unused dice form the nearby supply.", "O Tubarão recebe o saco, o baralho/mercado de Tubarão e 4 peças de Crescimento. Os dados não utilizados formam o suprimento ao alcance.")
        ],
        page: 3
      },
      {
        label: t("OCTOPUS · PLAYER", "POLVO · JOGADOR"),
        title: t("24 cards · 18 blocks · 1 bag", "24 cartas · 18 blocos · 1 saco"),
        lines: [
          t("Blocks: 1 Octopus, 4 Food, 4 Traps, 1 Double Shell, and 8 Shells.", "Blocos: 1 Polvo, 4 Comidas, 4 Armadilhas, 1 Concha Dupla e 8 Conchas."),
          t("The Octopus receives the cards, blocks and bag; keep its player aid nearby.", "O Polvo recebe as cartas, os blocos e o saco; mantenha sua ajuda de jogador por perto.")
        ],
        page: 3
      },
      {
        label: t("SHARED", "COMPARTILHADO"),
        title: t("1 double-sided board · 1 Shark miniature", "1 tabuleiro dupla face · 1 miniatura de Tubarão"),
        lines: [
          t("Place the board between the players, with each player seated at their side.", "Coloque o tabuleiro entre os jogadores, cada um sentado do seu lado."),
          t("The Shark miniature moves on the Shark paths and is placed by the Octopus during setup.", "A miniatura do Tubarão percorre os caminhos do Tubarão e é posicionada pelo Polvo durante a preparação.")
        ],
        page: 3
      },
      {
        label: t("CONFRONTATION · BOTH PLAYERS", "CONFRONTO · AMBOS OS JOGADORES"),
        title: t("3 Shark + 3 Octopus cards", "3 cartas de Tubarão + 3 de Polvo"),
        lines: [
          t("Each player takes their own three cards; keep the two sets separate and face-down beside the board.", "Cada jogador pega suas próprias três cartas; mantenham os dois conjuntos separados e virados para baixo ao lado do tabuleiro.")
        ],
        page: 3
      },
      {
        label: t("REFERENCE · BOTH PLAYERS", "CONSULTA · AMBOS OS JOGADORES"),
        title: t("2 player aids", "2 ajudas de jogador"),
        lines: [
          t("One aid per player. Use the Shark aid for the starting dice mix; the rulebook back is also a turn summary.", "Uma ajuda por jogador. Use a ajuda do Tubarão para a composição inicial dos dados; o verso do manual também resume os turnos.")
        ],
        page: 3
      }
    ];
    return `<div class="quick-grid">${cards.map((card) => infoCard(card.label, card.title, card.lines, card.page)).join("")}</div>`;
  }

  function setupPhases() {
    return [
      {
        id: "board",
        title: t("1 · Choose the board and seat the players", "1 · Escolha o tabuleiro e sente os jogadores"),
        pages: [4, 5, ...(state.board === "night" ? [19] : [])],
        items: [
          t(`Place the ${state.board === "night" ? "night" : "day"} side of the double-sided board in the middle of the table.`, `Coloque o lado ${state.board === "night" ? "noturno" : "diurno"} do tabuleiro dupla face no meio da mesa.`),
          t("The Octopus player sits on the Octopus side; the Shark player sits on the Shark side.", "O jogador do Polvo senta do lado do Polvo; o jogador do Tubarão senta do lado do Tubarão.")
        ]
      },
      {
        id: "shark",
        title: t("2 · Prepare the Shark area", "2 · Prepare a área do Tubarão"),
        pages: [3, 5, 12, 15],
        items: [
          t("Put 7 blue Current dice, 3 yellow Search dice, and 1 red Strike die in the Shark's bag. Put the remaining dice within the Shark's reach as the supply: 8 blue, 7 yellow, and 9 red.", "Coloque 7 dados azuis de Corrente, 3 amarelos de Busca e 1 vermelho de Ataque no saco do Tubarão. Deixe os dados restantes ao alcance do Tubarão como suprimento não utilizado: 8 azuis, 7 amarelos e 9 vermelhos."),
          t("Shuffle the 23 Shark cards. Deal 4 face-up cards into the row shown on the board; leave the rest face-down in the deck space beside it.", "Embaralhe as 23 cartas de Tubarão. Revele 4 na fileira indicada no tabuleiro; deixe as demais viradas para baixo no espaço do baralho ao lado."),
          t("Place all 4 Growth tiles in their numbered board slots with their three-dice spaces showing.", "Coloque as 4 peças de Crescimento nos espaços numerados do tabuleiro, com os espaços para três dados visíveis."),
          t("Place the 3 Shark and 3 Octopus Confrontation cards face-down beside the board, keeping each player's set separate.", "Coloque as 3 cartas de Confronto do Tubarão e as 3 do Polvo viradas para baixo ao lado do tabuleiro, mantendo separado o conjunto de cada jogador."),
          t("Put the Shark player aid by the Shark and the Octopus player aid by the Octopus.", "Coloque a ajuda de jogador do Tubarão ao lado do Tubarão e a ajuda do Polvo ao lado do Polvo.")
        ]
      },
      {
        id: "octopus-cards",
        title: t("3 · Sort the Octopus cards and build the opening hand", "3 · Separe as cartas do Polvo e monte a mão inicial"),
        pages: [5, 7, 9],
        items: [
          `${t("Set aside every starter card bearing either the single-wave or double-wave symbol shown here; keep them separate from the four colored piles.", "Separe toda carta inicial com o símbolo de uma ou duas ondas curvas mostrado aqui; mantenha-as fora das quatro pilhas coloridas.")} <span class="kelp-inline-icons"><img src="${ICONS}starter-symbol-one.webp" alt="${t("Single-wave starter symbol", "Símbolo inicial de uma onda")}"><img src="${ICONS}starter-symbol-two.webp" alt="${t("Double-wave starter symbol", "Símbolo inicial de duas ondas")}"></span>`,
          t("Sort the remaining cards into Move (yellow), Hide (purple), Learn (blue), and Eat (orange) piles. Shuffle each pile separately.", "Separe as cartas restantes em pilhas de Move (amarela), Hide (roxa), Learn (azul) e Eat (laranja). Embaralhe cada pilha separadamente."),
          t("Shuffle the 4 Eat cards face-down and turn the top card face-up. Keep the other three piles face-up on the Octopus side of the table.", "Embaralhe as 4 cartas Eat viradas para baixo e revele a carta do topo. Mantenha as outras três pilhas viradas para cima do lado do Polvo."),
          t("Set the Fast Learning card aside. Shuffle the other starter cards face-down as the Octopus draw pile.", "Separe a carta Fast Learning. Embaralhe as demais cartas iniciais viradas para baixo para formar o baralho de compra do Polvo."),
          t("The Octopus takes Fast Learning and draws 3 cards from that starter draw pile for a 4-card opening hand. Set the hand-size token to 4 above the draw pile.", "O Polvo pega Fast Learning e compra 3 cartas desse baralho inicial para formar uma mão de 4 cartas. Coloque o marcador de tamanho de mão no 4, acima do baralho.")
        ]
      },
      {
        id: "octopus-blocks",
        title: t("4 · Set out the Food and Trap blocks, then hide the others", "4 · Separe Comidas e Armadilhas e esconda os demais blocos"),
        pages: [5, 6, 11],
        items: [
          t("Put the Food block matching the face-up top Eat card on that card. Beside the four card piles, place the other 3 Food blocks, 1 Shell, 1 Double Shell, and 3 Trap blocks.", "Coloque no topo da carta Eat revelada o bloco de Comida correspondente. Ao lado das quatro pilhas, separe as outras 3 Comidas, 1 Concha, 1 Concha Dupla e 3 Armadilhas."),
          t("Put the remaining 9 blocks (1 Octopus, 1 Trap, and 7 Shells) into the Octopus bag and mix them.", "Coloque os 9 blocos restantes (1 Polvo, 1 Armadilha e 7 Conchas) no saco do Polvo e misture."),
          t("The Octopus draws one block at a time and stands it upright in the board's block spaces, starting at the top of a column and filling downward before continuing with the next column to the right. Only the Octopus may see the symbols; the Shark must not see them.", "O Polvo compra um bloco por vez e o coloca em pé nos espaços do tabuleiro, começando no topo de uma coluna e preenchendo-a de cima para baixo antes de continuar na coluna seguinte à direita. Só o Polvo pode ver os símbolos; o Tubarão não deve vê-los."),
          t("After all 9 blocks are on the board, put the Octopus bag aside. Upright blocks are hidden; keep every symbol facing the Octopus.", "Depois que os 9 blocos estiverem no tabuleiro, deixe o saco do Polvo de lado. Blocos em pé estão escondidos; mantenha todos os símbolos voltados para o Polvo.")
        ]
      },
      {
        id: "start",
        title: t("5 · Place the Shark and start", "5 · Posicione o Tubarão e comece"),
        pages: [5, 18, ...(state.board === "night" ? [19] : [])],
        items: [
          t("The Octopus places the Shark miniature on the Current space in front of any one of the 4 Shark Dens, pointing toward the center. Whenever the Shark leaves a den, including at the start of the game, it chooses which direction to take.", "O Polvo coloca a miniatura do Tubarão no espaço de Corrente em frente a qualquer uma das 4 Tocas do Tubarão, apontada para o centro. Sempre que sair de uma toca, inclusive no início da partida, o Tubarão escolhe em qual direção seguir."),
          ...(state.board === "night" ? [t("On the night board, use a den along an inner Shark path.", "No tabuleiro noturno, use uma toca ao longo de um caminho interno do Tubarão.")] : []),
          t("The Octopus takes the first turn.", "O Polvo faz o primeiro turno.")
        ]
      }
    ];
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
        <label class="kelp-setup-check" for="setup-check-${phase.id}">
          <input id="setup-check-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="kelp-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="kelp-setup-substeps">${phase.items.map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), "02", [3, 5])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Set up this match", "Prepare esta partida")}</h3>
            <p>${t("The checklist covers both players' components and the hidden Octopus blocks. Setup progress is saved separately from the language and reading-side preferences.", "A lista cobre os componentes dos dois jogadores e os blocos escondidos do Polvo. O progresso é salvo separadamente do idioma e do lado escolhido para leitura.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Changing the board side clears this checklist. Changing language or switching between Shark and Octopus does not. “Uncheck all” clears only these setup boxes.",
          "Trocar o lado do tabuleiro limpa esta lista. Trocar o idioma ou alternar entre Tubarão e Polvo não. “Desmarcar tudo” limpa somente as caixas da preparação."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components in this core game", "Componentes deste jogo base")}</h3>
      ${inventory()}`;
  }

  function sharkOpponentQuickCards() {
    return [
      infoCard(t("OPPONENT · SHARK", "ADVERSÁRIO · TUBARÃO"), t("Shark turn & confrontation", "Turno e confronto do Tubarão"), [
        ruleLine("Draw & Roll", "Draw and roll 2 dice; this step is mandatory. Growth and Shark cards may add dice or rerolls.", "Comprar e Rolar", "Compre e role 2 dados; esta etapa é obrigatória. Crescimento e cartas do Tubarão podem acrescentar dados ou novas rolagens."),
        ruleLine("Place Currents", "Optional: place blue dice on any empty Current spaces.", "Colocar Correntes", "Opcional: coloque dados azuis em quaisquer espaços vazios de Corrente."),
        ruleLine("Move", "Movement is mandatory. Follow the printed path in the direction the Shark faces and end on an empty Current space; normally move 1 space.", "Mover", "Mover é obrigatório. Siga o caminho impresso na direção em que o Tubarão está voltado e termine em um espaço vazio de Corrente; normalmente, avance 1 espaço."),
        ruleLine("Cross Currents", "Skip occupied Current spaces. Chains are legal only when pips decrease strictly; remove only the first Current crossed and put it on Growth.", "Atravessar Correntes", "Pule espaços de Corrente ocupados. Cadeias só são legais quando os valores diminuem estritamente; remova apenas a primeira Corrente cruzada e coloque-a em Crescimento."),
        ruleLine("Search/Strike zones", "Use yellow Search and/or red Strike dice in 1 or 2 orthogonally adjacent zones. Each placed die must meet the printed zone value.", "Zonas de Busca/Ataque", "Use dados amarelos de Busca e/ou vermelhos de Ataque em 1 ou 2 zonas adjacentes ortogonalmente. Cada dado colocado deve atingir o valor impresso na zona."),
        ruleLine("Search", "A yellow Search die reveals only a hidden block; if it finds the Octopus, it reveals its location but does not start a confrontation.", "Busca", "Um dado amarelo de Busca revela somente um bloco escondido; se encontrar o Polvo, revela sua posição mas não inicia um confronto."),
        ruleLine("Strike", "A red Strike die reveals and attacks a block. Striking the Octopus starts a confrontation.", "Ataque", "Um dado vermelho de Ataque revela e ataca um bloco. Atacar o Polvo inicia um confronto."),
        ruleLine("Confrontation", "Both players secretly choose a remaining card and reveal together. The same-color Shark counter wins immediately; on a mismatch, the Octopus escapes and resolves its card.", "Confronto", "Os dois jogadores escolhem em segredo uma carta restante e revelam juntos. A resposta do Tubarão da mesma cor vence imediatamente; se as cores forem diferentes, o Polvo escapa e resolve sua carta."),
        ruleLine("After an escape", "Remove the Octopus card played and the Shark card of that same color; keep the mismatched Shark card.", "Depois de uma fuga", "Remova a carta do Polvo jogada e a carta de Tubarão daquela mesma cor; mantenha a carta de Tubarão que não correspondeu."),
        ruleLine("Remaining pairs", "Hostile can remove another pair. Without extra removals, one escape leaves 2 color pairs; the Shark necessarily wins on the third confrontation.", "Pares restantes", "Hostile pode remover outro par. Sem remoções extras, uma fuga deixa 2 pares de cores; no terceiro confronto, o Tubarão vence necessariamente.")
      ], [12, 13, 14, 17]),
      infoCard(t("OPPONENT · GROWTH", "ADVERSÁRIO · CRESCIMENTO"), t("Growth and its abilities", "Crescimento e habilidades"), [
        ruleLine("Used dice", "Used Search dice go to Growth; used Strike dice go to Hunger. The first Current crossed can also go to Growth; red dice never go there.", "Dados usados", "Dados de Busca usados vão para Crescimento; dados de Ataque usados vão para Fome. A primeira Corrente cruzada também pode ir para Crescimento; dados vermelhos nunca vão para lá."),
        ruleLine("Growth placement", "After Move and Search, place the first Current crossed and all used Search dice on the next spaces from left to right.", "Colocar em Crescimento", "Depois de Mover e Buscar, coloque a primeira Corrente cruzada e cada dado de Busca usado nos próximos espaços, da esquerda para a direita."),
        ruleLine("Complete a tile", "Each tile takes 3 dice. Return those dice to the bag, flip the tile, and gain its ability permanently; read that ability on the tile.", "Completar uma peça", "Cada peça recebe 3 dados. Devolva-os ao saco, vire a peça e ganhe sua habilidade permanentemente; leia a habilidade impressa nela."),
        ruleLine("Growth track full", "After all 4 tiles are flipped, return used Currents and Search dice directly to the bag.", "Trilha completa", "Depois que as 4 peças forem viradas, devolva Correntes e dados de Busca usados diretamente ao saco."),
        ruleLine("Tile 1", "During Draw & Roll, reroll 1 die.", "Peça 1", "Durante Comprar e Rolar, role novamente 1 dado."),
        ruleLine("Tile 2", "If the Shark has at least 1 stored Energy die and spends a total of 1–5 pips, gain 5 more Energy.", "Peça 2", "Se o Tubarão tiver ao menos 1 dado de Energia guardado e gastar um total de 1–5 pontos, ganhe mais 5 de Energia."),
        ruleLine("Tile 3", "Reroll 1 additional time each turn.", "Peça 3", "Role novamente 1 vez adicional por turno."),
        ruleLine("Tile 4", "Draw 1 additional die each turn.", "Peça 4", "Compre 1 dado adicional por turno."),
        ruleLine("Reroll choice", "Growth rerolls may target the same die twice or two different dice.", "Escolha da rolagem", "As rolagens de Crescimento podem mirar o mesmo dado duas vezes ou dois dados diferentes.")
      ], [15, 18]),
      infoCard(t("OPPONENT · ENERGY", "ADVERSÁRIO · ENERGIA"), t("Energy, market & bag", "Energia, mercado e saco"), [
        ruleLine("Store Energy", "At the end of the Shark turn, put the dice left in its current dice pool into the Energy row, up to the open spaces.", "Guardar Energia", "No fim do turno do Tubarão, coloque na fileira de Energia os dados restantes no conjunto do turno, até preencher os espaços livres."),
        ruleLine("Energy capacity", "The Energy row holds up to 3 dice. If more dice remain than free spaces, choose which to store and return the others to the bag.", "Capacidade de Energia", "A fileira de Energia comporta até 3 dados. Se sobrarem mais dados do que espaços livres, escolha quais guardar e devolva os outros ao saco."),
        ruleLine("When to buy", "With 1–2 stored dice, the Shark may buy; with 3, it must buy at least 1 card.", "Quando comprar", "Com 1–2 dados guardados, o Tubarão pode comprar; com 3, deve comprar pelo menos 1 carta."),
        ruleLine("Energy budget", "The total pips on all stored dice, regardless of color, is the purchase budget.", "Orçamento de Energia", "A soma dos pontos de todos os dados guardados, de qualquer cor, é o orçamento de compra."),
        ruleLine("Buy cards", "Buy any number of face-up Shark cards whose total cost fits that budget.", "Comprar cartas", "Compre quantas cartas de Tubarão visíveis couberem nesse orçamento."),
        ruleLine("Refill market", "Immediately replace each bought card with the deck's top card.", "Repor o mercado", "Reponha imediatamente cada carta comprada com a carta do topo do baralho."),
        ruleLine("New dice", "Add the dice shown on a bought card to the Shark's bag immediately.", "Dados novos", "Acrescente imediatamente ao saco do Tubarão os dados mostrados na carta comprada."),
        ruleLine("Unspent pips", "Energy pips not spent on cards are lost at the end of the step.", "Pontos não gastos", "Pontos de Energia não gastos em cartas são perdidos no fim da etapa."),
        ruleLine("Spend Energy", "When buying with stored Energy, move 1 stored die to Hunger and return the others to the bag.", "Gastar Energia", "Ao comprar com Energia guardada, mova 1 dado guardado para Fome e devolva os outros ao saco."),
        ruleLine("Replace a card", "While buying, reduce one stored die by 1 to replace a face-up card. Do not reduce below 1 or replace the only affordable card; after replacing, buy at least 1 card.", "Trocar uma carta", "Durante a compra, reduza um dado guardado em 1 para repor uma carta visível. Não reduza abaixo de 1 nem troque a única carta acessível; depois de trocar, compre pelo menos 1 carta."),
        ruleLine("No affordable card", "If all Energy spaces are full but no available card is affordable, return all stored dice to the bag without moving one to Hunger.", "Nenhuma carta acessível", "Se todos os espaços de Energia estiverem cheios, mas nenhuma carta disponível puder ser comprada, devolva todos os dados guardados ao saco sem mover nenhum para Fome."),
        ruleLine("Empty Shark bag", "If the bag has fewer than 2 dice to draw, remove Currents from the board until it has 2.", "Saco do Tubarão vazio", "Se o saco tiver menos de 2 dados para comprar, retire Correntes do tabuleiro até ter 2."),
        ruleLine("Bag privacy", "Only the Shark may inspect the bag; shake it before drawing.", "Privacidade do saco", "Só o Tubarão pode olhar no saco; sacuda-o antes de comprar.")
      ], [16, 18])
    ];
  }

  function octopusQuickCards() {
    return [
      infoCard(t("OPPONENT · OCTOPUS", "ADVERSÁRIO · POLVO"), t("Turn and actions", "Turno e ações"), [
        ruleLine("Turn", "The Octopus takes 2 actions and may repeat one. Played cards go to discard at turn end; there is no automatic draw.", "Turno", "O Polvo faz 2 ações e pode repetir uma. Cartas jogadas vão para o descarte no fim do turno; não há compra automática."),
        ruleLine("Play a card", "Pay its full reveal cost (0–3 hidden blocks; a Double Shell counts as 2) and complete the full effect.", "Jogar uma carta", "Pague todo o custo de revelação (0–3 blocos escondidos; Concha Dupla vale 2) e conclua o efeito completo."),
        ruleLine("Swap", "Swap 2 orthogonally adjacent blocks and preserve whether each is hidden or revealed.", "Trocar", "Troque 2 blocos adjacentes ortogonalmente e preserve se cada um está escondido ou revelado."),
        ruleLine("Shuffle", "Shuffle the number of hidden blocks printed on the card, then return them hidden. The Shark chooses empty spaces without seeing the blocks.", "Embaralhar", "Embaralhe a quantidade de blocos escondidos indicada na carta e reponha-os escondidos. O Tubarão escolhe os espaços vazios sem vê-los."),
        ruleLine("Hide card", "A Hide card stands revealed blocks upright and costs no blocks.", "Carta Hide", "Uma carta Hide coloca blocos revelados em pé e não custa blocos."),
        ruleLine("Draw", "Draw up to the current hand size. If the hand is empty, this action is mandatory; if the draw pile is empty, shuffle the discard pile first.", "Comprar", "Compre até o tamanho atual da mão. Se a mão estiver vazia, esta ação é obrigatória; se o baralho acabar, embaralhe primeiro o descarte."),
        ruleLine("Discard", "Discard 1 hand card without paying its cost or resolving its effect; then hide 1 revealed block if possible.", "Descartar", "Descarte 1 carta da mão sem pagar seu custo nem resolver seu efeito; depois, esconda 1 bloco revelado se possível.")
      ], [6, 7, 8]),
      infoCard(t("OPPONENT · OCTOPUS", "ADVERSÁRIO · POLVO"), t("Learn and Eat", "Learn e Eat"), [
        ruleLine("Learn", "Gain cards and/or blocks up to the number on the card, in any combination. Take only pile tops; never inspect a pile.", "Learn", "Obtenha cartas e/ou blocos até a quantidade indicada na carta, em qualquer combinação. Pegue somente o topo das pilhas; não olhe dentro delas."),
        ruleLine("Cards gained", "Put gained cards face-up on the discard pile unless their effect says otherwise.", "Cartas obtidas", "Coloque cartas obtidas viradas para cima no descarte, a menos que o efeito diga o contrário."),
        ruleLine("Blocks gained", "Exchange each gained block with a revealed board block; the new block enters revealed. The Octopus and Food blocks cannot be removed this way.", "Blocos obtidos", "Troque cada bloco obtido por um bloco revelado no tabuleiro; o novo bloco entra revelado. O Polvo e as Comidas não podem ser removidos assim."),
        ruleLine("Learn an Eat card", "The matching Food block comes with the Eat card and together they count as 1 Learn. Gain at most 1 Eat card per turn; at turn end, reveal the next Eat card.", "Aprender uma Eat", "O bloco de Comida correspondente vem com a carta Eat e os dois contam como 1 Learn. Obtenha no máximo 1 Eat por turno; no fim do turno, revele a próxima Eat."),
        ruleLine("Eat", "The matching Food must be on the board and orthogonally adjacent. Play its Eat card; reveal the Octopus and Food if hidden, replace the Food with an extra Shell, move it to the lowest empty Food Track space, and trash the Eat card.", "Comer", "A Comida correspondente deve estar no tabuleiro e adjacente ortogonalmente. Jogue sua carta Eat; revele o Polvo e a Comida se estiverem escondidos, troque a Comida por uma Concha extra, mova-a ao espaço vazio mais baixo da Trilha de Comida e remova a carta Eat do jogo."),
        ruleLine("Food effects", "These are free, one-time effects usable before, after, or between the two actions. Flip a Food block face-down when its effect is used.", "Efeitos de Comida", "São efeitos gratuitos e de uso único, que podem ser usados antes, depois ou entre as duas ações. Vire o bloco de Comida para baixo ao usar o efeito."),
        ruleLine("Visibility", "Hidden blocks stand upright with symbols facing the Octopus; revealed blocks lie flat and are visible to both players. After eating, the Octopus stays revealed until hidden by an action or card.", "Visibilidade", "Blocos escondidos ficam em pé, com símbolos voltados para o Polvo; blocos revelados ficam deitados e visíveis aos dois jogadores. Depois de comer, o Polvo continua revelado até ser escondido por uma ação ou carta.")
      ], [6, 7, 9, 10])
    ];
  }

  function quickReference() {
    const cards = state.side === "octopus"
      ? [
        infoCard(t("OCTOPUS · TURN", "POLVO · TURNO"), t("Take exactly 2 actions", "Faça exatamente 2 ações"), [
          ruleLine("Play a card", "Reveal the full number of hidden blocks shown as its cost, then resolve the complete effect.", "Jogar uma carta", "Revele a quantidade completa de blocos escondidos indicada como custo e resolva todo o efeito."),
          ruleLine("Draw", "Use an action to draw until your hand reaches its current size. If your hand is empty, this action is mandatory.", "Comprar", "Use uma ação para comprar até sua mão atingir o tamanho atual. Se sua mão estiver vazia, esta ação é obrigatória."),
          ruleLine("Discard + hide", "Discard 1 card, ignore its cost/effect, then hide 1 revealed block if possible.", "Descartar + esconder", "Descarte 1 carta, ignore o custo/efeito e esconda 1 bloco revelado, se possível."),
          ruleLine("After the turn", "Move every card played this turn to the discard pile. There is no automatic draw.", "Depois do turno", "Mova para o descarte todas as cartas jogadas neste turno. Não há compra automática.")
        ], 7),
        infoCard(t("EAT · FREE EFFECTS", "COMER · EFEITOS GRATUITOS"), t("Eat and use Food", "Coma e use Comida"), [
          ruleLine("Eat", "The matching Food must be on the board. Be orthogonally adjacent to it, play its Eat card, and reveal both the Octopus and Food if hidden.", "Comer", "A Comida correspondente deve estar no tabuleiro. Fique ortogonalmente adjacente a ela, jogue a carta Eat correspondente e revele o Polvo e a Comida se estiverem escondidos."),
          ruleLine("Replace + track", "Replace the Food with a spare revealed Shell; move the Food to the lowest empty Food Track space and trash the Eat card.", "Troca + trilha", "Troque a Comida por uma Concha extra revelada; mova a Comida ao espaço vazio mais baixo da Trilha de Comida e remova a carta Eat do jogo."),
          ruleLine("Food effect", "Use a Food block's one-time effect before, after, or between your two actions; flip it face-down when used. The Octopus block remains revealed until hidden again.", "Efeito da Comida", "Use o efeito único de um bloco de Comida antes, depois ou entre suas duas ações; vire-o para baixo quando usar. O bloco do Polvo permanece revelado até ser escondido novamente.")
        ], 9),
        ...sharkOpponentQuickCards()
      ]
      : [
        infoCard(t("SHARK · TURN", "TUBARÃO · TURNO"), t("Follow the six steps in order", "Siga as seis etapas na ordem"), [
          ruleLine("Draw & Roll", "Draw 2 dice from your bag and roll them once. Growth or card abilities can change this.", "Comprar e Rolar", "Compre 2 dados do saco e role-os uma vez. Habilidades de Crescimento ou cartas podem mudar isso."),
          ruleLine("Place Currents", "You may place blue dice on any empty Current spaces, or keep them in your dice pool for Energy.", "Colocar Correntes", "Você pode colocar dados azuis em quaisquer espaços vazios de Corrente ou mantê-los no conjunto de dados do turno para Energia."),
          ruleLine("Move", "You must move along the path in the direction you face and end on an empty Current space.", "Mover", "Você deve se mover pelo caminho na direção para a qual está voltado e terminar em um espaço vazio de Corrente."),
          ruleLine("Search/Strike", "Use yellow/red dice in adjacent zones, or keep any of them in your dice pool for Energy; each placed die must meet that zone's value.", "Buscar/Atacar", "Use dados amarelos/vermelhos em zonas adjacentes ou mantenha quaisquer deles no conjunto de dados do turno para Energia; cada dado colocado deve atingir o valor da zona."),
          ruleLine("Growth", "Put the first Current used and each used Search die on the next Growth spaces.", "Crescimento", "Coloque a primeira Corrente usada e cada dado de Busca usado nos próximos espaços de Crescimento."),
          ruleLine("Energy", "Put all remaining dice in your dice pool into stored Energy. With 3 stored dice you must buy at least 1 card; with 1–2 you may buy.", "Energia", "Ponha na Energia guardada todos os dados restantes no conjunto de dados do turno. Com 3 dados guardados, você deve comprar pelo menos 1 carta; com 1–2, pode comprar.")
        ], 12),
        infoCard(t("SHARK · TRACKS", "TUBARÃO · TRILHAS"), t("Search, strike, grow, and avoid exhaustion", "Busque, ataque, cresça e evite se esgotar"), [
          ruleLine("Search", "A yellow die reveals a hidden block; it goes to Growth. Finding the Octopus reveals its location but does not start a confrontation.", "Busca", "Um dado amarelo revela um bloco escondido e vai para Crescimento. Encontrar o Polvo revela sua posição, mas não inicia um confronto."),
          ruleLine("Strike", "A red die reveals and attacks a block. Striking the Octopus starts a confrontation; every used Strike die goes to Hunger.", "Ataque", "Um dado vermelho revela e ataca um bloco. Atacar o Polvo inicia um confronto; todo dado de Ataque usado vai para Fome."),
          ruleLine("Growth", "Three dice fill a tile; return those dice to the bag and flip the tile for a permanent ability. Red dice never go here.", "Crescimento", "Três dados preenchem uma peça; devolva-os ao saco e vire a peça para ativar uma habilidade permanente. Dados vermelhos nunca vão para cá."),
          ruleLine("Hunger", "The 7th die on this track exhausts the Shark immediately; the Octopus wins. Spending stored Energy to buy a card also moves 1 stored die here.", "Fome", "O 7º dado nesta trilha esgota o Tubarão imediatamente; o Polvo vence. Gastar Energia guardada para comprar uma carta também move 1 dado guardado para cá.")
        ], 14),
        ...octopusQuickCards()
      ];

    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), "01", [20])}
      <p class="kelp-reference-side">${t("Reading side:", "Lado em consulta:")} <strong>${sideName()}</strong></p>
      <div class="callout">${t(
        "Turn order: the Octopus takes the first turn, then the players alternate turns until someone wins.",
        "Ordem dos turnos: o Polvo faz o primeiro turno e, depois, os jogadores alternam até alguém vencer."
      )} ${referenceLink(6)}</div>
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  function victorySection() {
    const octopusWins = [
      t("Eat all 4 Food blocks. The game ends immediately when the fourth Food is placed on the Food Track.", "Coma os 4 blocos de Comida. A partida termina imediatamente quando a quarta Comida é colocada na Trilha de Comida."),
      t("Survive until the Shark is exhausted: the 7th die on the Hunger Track ends the game immediately.", "Sobreviva até o Tubarão se esgotar: o 7º dado na Trilha de Fome encerra a partida imediatamente.")
    ];
    const sharkWins = [
      t("Strike the Octopus block with a red die. In the simultaneous Confrontation reveal, the Shark wins if its card is the same color as the Octopus card.", "Ataque o bloco do Polvo com um dado vermelho. Na revelação simultânea do Confronto, o Tubarão vence se sua carta tiver a mesma cor que a carta do Polvo.")
    ];
    return `
      ${sectionHeading("victory", t("Victory", "Vitória"), "03", [3, 6, 17])}
      <p class="glossary-intro">${t("The two sides have different objectives. Keep both end conditions in view even when consulting only one side's turn rules.", "Os dois lados têm objetivos diferentes. Mantenha à vista as duas condições de fim mesmo ao consultar as regras de turno de apenas um lado.")}</p>
      <div class="victory-grid">
        <article class="victory-card octopus ${state.side === "octopus" ? "is-current-side" : ""}">
          <h3>${t("Octopus wins by", "O Polvo vence ao")}</h3>${lineList(octopusWins)}
        </article>
        <article class="victory-card shark ${state.side === "shark" ? "is-current-side" : ""}">
          <h3>${t("Shark wins by", "O Tubarão vence ao")}</h3>${lineList(sharkWins)}
        </article>
      </div>
      <div class="callout">${t(
        "A Shark strike against any other block does not win by itself. A Search that finds the Octopus also does not begin a confrontation; only a Strike does.",
        "Um ataque do Tubarão a qualquer outro bloco não vence por si só. Uma Busca que encontra o Polvo também não inicia um confronto; somente um Ataque faz isso."
      )}</div>`;
  }

  function octopusTurn() {
    const actions = [
      [
        t("Play a card", "Jogar uma carta"),
        [
          ruleLine("Pay the cost", "Card costs range from 0 to 3 hidden blocks and must be paid in full; each revealed block counts as 1, and revealing the Double Shell counts as 2.", "Pague o custo", "O custo das cartas varia de 0 a 3 blocos escondidos e deve ser pago por inteiro; cada bloco revelado vale 1, e revelar a Concha Dupla vale 2."),
          ruleLine("Resolve", "You may reveal any of your blocks. You may play the card only if you can complete its entire effect.", "Resolva", "Você pode revelar qualquer um dos seus blocos. Só pode jogar a carta se conseguir concluir todo o efeito."),
          ruleLine("Place", "Put the resolved card in the matching action slot on the board; at turn end, played cards go to the discard pile.", "Coloque", "Ponha a carta resolvida no espaço de ação correspondente do tabuleiro; no fim do turno, cartas jogadas vão para o descarte.")
        ]
      ],
      [
        t("Draw up to your hand size", "Compre até o tamanho da mão"),
        [
          ruleLine("Draw", "Take cards until you reach your current hand size. At game start it is 4; the Red Rock Crab can raise it to 5.", "Compre", "Compre até atingir o tamanho atual da mão. No início é 4; o Caranguejo-das-Rochas pode aumentá-lo para 5."),
          ruleLine("Empty draw pile", "Shuffle your discard pile to form a new draw pile whenever you need to draw and the pile is empty.", "Baralho vazio", "Quando precisar comprar e o baralho estiver vazio, embaralhe o descarte para formar um novo baralho."),
          ruleLine("Mandatory draw", "If your hand is empty, you must use this action.", "Compra obrigatória", "Se sua mão estiver vazia, você deve usar esta ação.")
        ]
      ],
      [
        t("Discard 1 card, then hide 1 block", "Descarte 1 carta e esconda 1 bloco"),
        [
          ruleLine("Discard", "Put 1 card from your hand in the discard pile without paying its cost or resolving its effect.", "Descarte", "Ponha 1 carta da mão no descarte sem pagar o custo nem resolver o efeito."),
          ruleLine("Hide", "Then stand 1 revealed block upright, if possible. Hidden blocks have their symbols facing only the Octopus.", "Esconda", "Depois, coloque em pé 1 bloco revelado, se possível. Os blocos escondidos ficam com os símbolos voltados apenas para o Polvo.")
        ]
      ]
    ];
    return `
      <div class="turn-block">
        <h3>${t("Octopus turn · exactly 2 actions", "Turno do Polvo · exatamente 2 ações")}</h3>
        ${lineList([
          ruleLine("Choose", "Take two actions in any combination; the same action may be chosen twice.", "Escolha", "Faça duas ações em qualquer combinação; você pode repetir a mesma ação."),
          ruleLine("Food effects", "A Food effect is free and may be used before, after, or between the two actions.", "Efeitos de Comida", "Um efeito de Comida é gratuito e pode ser usado antes, depois ou entre as duas ações."),
          ruleLine("End", "Move all cards played this turn to the discard pile. You do not draw automatically.", "Fim", "Mova para o descarte todas as cartas jogadas neste turno. Você não compra automaticamente.")
        ])}
      </div>
      <div class="action-grid">${actions.map(([title, lines]) => `
        <article class="action-card"><strong>${title}</strong>${lineList(lines)}</article>`).join("")}</div>
      <div class="turn-block">
        <h3>${t("Card families", "Famílias de cartas")}</h3>
        ${lineList([
          ruleLine("Swapping", "Move cards swap two orthogonally adjacent blocks while preserving each block's hidden/revealed state.", "Troca", "Cartas Move trocam dois blocos adjacentes ortogonalmente, preservando o estado escondido/revelado de cada um."),
          ruleLine("Shuffling", "Shuffle the number of hidden blocks stated on the card in the Octopus bag. The Shark selects an empty space for each blind replacement.", "Embaralhar", "Embaralhe no saco do Polvo a quantidade de blocos escondidos indicada na carta. O Tubarão escolhe um espaço vazio para cada reposição sem olhar."),
          ruleLine("Hide", "Stand blocks upright to hide their symbols. Hide cards cost no blocks.", "Hide", "Coloque blocos em pé para esconder os símbolos. Cartas Hide não custam blocos."),
          ruleLine("Learn", "Gain cards and/or blocks in any combination allowed by the card, up to its number. Take only pile tops; never inspect a pile.", "Learn", "Obtenha cartas e/ou blocos em qualquer combinação permitida pela carta, até a quantidade indicada. Pegue somente o topo das pilhas; não olhe dentro delas."),
          ruleLine("Eat", "The Octopus must be orthogonally adjacent to the matching Food and have its Eat card in hand. Follow the food procedure in Quick Reference.", "Eat", "O Polvo deve estar adjacente ortogonalmente à Comida correspondente e ter sua carta Eat na mão. Siga o procedimento de Comida da Referência rápida.")
        ])}
        ${referenceLink(8)}
      </div>
      <div class="turn-block">
        <h3>${t("Learning and eating details", "Detalhes de Learn e Eat")}</h3>
        ${lineList([
          ruleLine("New cards", "Unless the played card says otherwise, put each gained card face-up on your discard pile.", "Cartas novas", "A menos que a carta jogada diga o contrário, ponha cada carta obtida virada para cima no descarte."),
          ruleLine("Exchange blocks", "To gain a block, exchange it with a revealed board block. The new block enters revealed.", "Trocar blocos", "Para obter um bloco, troque-o por um bloco revelado no tabuleiro. O novo bloco entra revelado."),
          ruleLine("Replaced blocks", "Set replaced blocks beside the board; later Learn effects can bring them back.", "Blocos trocados", "Deixe os blocos trocados ao lado do tabuleiro; efeitos Learn posteriores podem trazê-los de volta."),
          ruleLine("Protected blocks", "The Octopus and Food blocks cannot be removed from the board by learning a block.", "Blocos protegidos", "Os blocos do Polvo e de Comida não podem ser removidos do tabuleiro ao ganhar um bloco."),
          ruleLine("Eat learned", "An Eat card and its matching Food block count together as one Learn.", "Eat obtida", "Uma carta Eat e sua Comida correspondente contam juntas como um Learn."),
          ruleLine("Eat limit", "You may gain at most 1 Eat card per turn.", "Limite de Eat", "Você pode obter no máximo 1 Eat por turno."),
          ruleLine("Next Eat card", "At turn end, if you learned an Eat card, reveal the next card in the Eat pile.", "Próxima Eat", "No fim do turno, se você aprendeu uma Eat, revele a próxima carta da pilha Eat.")
        ])}
        ${referenceLink(9)}
      </div>`;
  }

  function sharkTurn() {
    const phases = [
      [t("Draw & Roll", "Comprar e Rolar"), t("Draw 2 dice from the bag and roll them once. Apply any extra-die or reroll abilities.", "Compre 2 dados do saco e role-os uma vez. Aplique habilidades de dado extra ou nova rolagem.")],
      [t("Place Currents", "Colocar Correntes"), t("You may put blue dice on any empty Current spaces, regardless of distance from the Shark. You may instead keep them in your dice pool for Energy.", "Você pode pôr dados azuis em quaisquer espaços vazios de Corrente, independentemente da distância do Tubarão. Em vez disso, pode mantê-los no conjunto de dados do turno para Energia.")],
      [t("Move", "Mover"), t("Movement is mandatory. Move along the lines in the direction the miniature faces; finish on an empty Current space.", "Mover é obrigatório. Siga as linhas na direção para a qual a miniatura está voltada; termine em um espaço vazio de Corrente.")],
      [t("Search/Strike", "Buscar/Atacar"), t("Use yellow Search and/or red Strike dice in 1 or 2 orthogonally adjacent zones, or keep any of those dice in your dice pool for Energy.", "Use dados amarelos de Busca e/ou vermelhos de Ataque em 1 ou 2 zonas adjacentes ortogonalmente, ou mantenha quaisquer desses dados no conjunto de dados do turno para Energia.")],
      [t("Growth", "Crescimento"), t("Place the first Current die used during movement and all used Search dice on the Growth Track.", "Coloque na Trilha de Crescimento o primeiro dado de Corrente usado no movimento e todos os dados de Busca usados.")],
      [t("Energy", "Energia"), t("Put every die still in your dice pool into the stored Energy area; apply the purchase rules below.", "Ponha na área de Energia guardada todos os dados restantes no conjunto de dados do turno; aplique as regras de compra abaixo.")]
    ];
    return `
      <div class="turn-block">
        <h3>${t("Shark turn · six ordered steps", "Turno do Tubarão · seis etapas na ordem")}</h3>
        <p>${t("Draw & Roll and Move are the only steps that are always mandatory. Place Currents and Search/Strike dice only if you choose; after Growth, the Energy step stores any dice left in the pool and applies the buy rules.", "Comprar e Rolar e Mover são as únicas etapas sempre obrigatórias. Coloque dados de Corrente e de Busca/Ataque somente se quiser; depois de Crescimento, a etapa Energia guarda os dados restantes no conjunto e aplica as regras de compra.")}</p>
        ${lineList(phases.map(([title, body]) => `<strong>${title}:</strong> ${body}`))}
        ${referenceLink(12)}
      </div>
      <div class="action-grid">
        <article class="action-card"><strong>${t("Move with Currents", "Mover com Correntes")}</strong>
          ${lineList([
            t("Normally move 1 space. Do not stay still, move backward, or turn 180° before moving.", "Normalmente, mova 1 espaço. Não fique parado, não recue nem vire 180° antes de mover."),
            t("At setup or whenever returned to a den, the Shark starts on its Current facing the center and chooses either direction when leaving the den.", "Na preparação ou sempre que voltar a uma toca, o Tubarão começa na Corrente voltado para o centro e escolhe qualquer direção ao sair da toca."),
            t("Skip spaces occupied by Currents. A chain is legal only when each die you cross is lower than the previous one; values need not be consecutive.", "Pule espaços ocupados por Correntes. Uma cadeia só é legal quando cada dado cruzado é menor que o anterior; os valores não precisam ser consecutivos."),
            t("Remove only the first Current crossed and put it on the next Growth space; if no Growth space is open, return it to the bag.", "Remova somente a primeira Corrente cruzada e ponha-a no próximo espaço de Crescimento; se não houver espaço livre, devolva-a ao saco."),
            t("If no legal move is possible, return the nearest Current die to the bag and move into its space; choose which one if two are equally near.", "Se nenhum movimento legal for possível, devolva ao saco o dado de Corrente mais próximo e mova-se para o espaço dele; escolha qual retirar se dois estiverem à mesma distância.")
          ])}
        </article>
        <article class="action-card"><strong>${t("Search and Strike", "Buscar e Atacar")}</strong>
          ${lineList([
            t("A placed die must equal or exceed the printed zone value. One die may occupy each empty zone-value space; you may keep any Search/Strike die in your dice pool for Energy instead.", "O dado colocado deve ser igual ou maior que o valor impresso na zona. Cada espaço de valor vazio recebe no máximo um dado; você pode manter qualquer dado de Busca/Ataque no conjunto de dados do turno para Energia."),
            t("If using more than one die, place all chosen dice before the Octopus reveals any block; then choose which block is revealed first.", "Se usar mais de um dado, coloque todos antes de o Polvo revelar qualquer bloco; depois escolha qual bloco é revelado primeiro."),
            t("Search (yellow) reveals only hidden blocks. Strike (red) reveals a hidden block and attacks it; Strike can target an already revealed Octopus.", "Busca (amarelo) revela apenas blocos escondidos. Ataque (vermelho) revela um bloco escondido e o ataca; Ataque pode mirar um Polvo já revelado."),
            t("Used Search dice go to Growth. Used Strike dice go to Hunger, even after a failed confrontation or a strike against another block.", "Dados de Busca usados vão para Crescimento. Dados de Ataque usados vão para Fome, mesmo após um confronto perdido ou um ataque a outro bloco."),
            t("Finding Shell or Food has no effect. A Search that finds the Octopus only reveals its location. A Trap triggers when revealed by Search or Strike.", "Encontrar Concha ou Comida não tem efeito. Uma Busca que encontra o Polvo apenas revela sua posição. Uma Armadilha é ativada ao ser revelada por Busca ou Ataque."),
            t("If a Trap effect makes you no longer adjacent to a second zone after the first reveal, return the die for that second zone to the bag without an effect.", "Se um efeito de Armadilha fizer você deixar de estar adjacente à segunda zona depois da primeira revelação, devolva ao saco o dado dessa segunda zona sem efeito.")
          ])}
          ${referenceLink(14)}
        </article>
      </div>
      <div class="turn-block">
        <h3>${t("Growth, Energy, and Shark cards", "Crescimento, Energia e cartas do Tubarão")}</h3>
        ${lineList([
          ruleLine("Growth placement", "After Move and Search, place the first Current crossed and every used Search die on the next spaces from left to right.", "Colocar em Crescimento", "Depois de Mover e Buscar, coloque a primeira Corrente cruzada e cada dado de Busca usado nos próximos espaços, da esquerda para a direita."),
          ruleLine("Complete a tile", "Each tile takes 3 dice. Return those dice to the bag, flip the tile, and gain its ability for the rest of the game.", "Completar uma peça", "Cada peça recebe 3 dados. Devolva-os ao saco, vire a peça e use sua habilidade pelo resto da partida."),
          ruleLine("Growth track full", "After all 4 tiles are flipped, return used Currents and Search dice directly to the bag. Red Strike dice never go on Growth.", "Trilha completa", "Depois que as 4 peças forem viradas, devolva Correntes e dados de Busca usados diretamente ao saco. Dados vermelhos de Ataque nunca vão para Crescimento."),
          ruleLine("Tile 1", "During Draw & Roll, reroll 1 die.", "Peça 1", "Durante Comprar e Rolar, role novamente 1 dado."),
          ruleLine("Tile 2", "If you have at least 1 stored Energy die and spend a total of 1–5 pips, gain 5 more Energy.", "Peça 2", "Se tiver ao menos 1 dado de Energia guardado e gastar um total de 1–5 pontos, ganhe mais 5 de Energia."),
          ruleLine("Tile 3", "Reroll 1 additional time each turn.", "Peça 3", "Role novamente 1 vez adicional por turno."),
          ruleLine("Tile 4", "Draw 1 additional die each turn.", "Peça 4", "Compre 1 dado adicional por turno."),
          ruleLine("Reroll choice", "Growth rerolls may target the same die twice or two different dice.", "Escolha da rolagem", "As rolagens de Crescimento podem mirar o mesmo dado duas vezes ou dois dados diferentes."),
          ruleLine("Store dice", "Store any dice left in the pool, up to 3 spaces. If more would be stored than fit, choose which dice to keep; return the rest to the bag.", "Guardar dados", "Guarde os dados restantes, até 3 espaços. Se houver mais dados do que espaços, escolha quais guardar; devolva os outros ao saco."),
          ruleLine("When to buy", "With 1–2 stored dice, you may buy; with 3, you must buy at least 1 card.", "Quando comprar", "Com 1–2 dados guardados, você pode comprar; com 3, deve comprar pelo menos 1 carta."),
          ruleLine("Energy budget", "The total pips on all stored dice, regardless of color, is the purchase budget.", "Orçamento de Energia", "A soma dos pontos de todos os dados guardados, de qualquer cor, é o orçamento de compra."),
          ruleLine("Buy cards", "Buy any number of face-up Shark cards whose total cost fits the Energy budget.", "Comprar cartas", "Compre quantas cartas de Tubarão visíveis couberem no orçamento de Energia."),
          ruleLine("Refill market", "Immediately replace each bought card with the deck's top card.", "Repor o mercado", "Reponha imediatamente cada carta comprada com a carta do topo do baralho."),
          ruleLine("Unspent pips", "Energy pips not spent on cards are lost at the end of the step.", "Pontos não gastos", "Pontos de Energia não gastos em cartas são perdidos no fim da etapa."),
          ruleLine("New dice", "Immediately add the dice shown on a bought card to the Shark's bag.", "Dados novos", "Acrescente imediatamente ao saco do Tubarão os dados mostrados na carta comprada."),
          ruleLine("Card effect", "Use a bought card's one-time effect only in its indicated step; then flip it face-down and remove it from the game.", "Efeito da carta", "Use o efeito único da carta comprada somente na etapa indicada; depois, vire-a para baixo e remova-a do jogo."),
          ruleLine("Red dice", "Buying Shark cards is the only way to gain additional red Strike dice.", "Dados vermelhos", "Comprar cartas de Tubarão é a única forma de obter dados vermelhos de Ataque adicionais."),
          ruleLine("Spend Energy", "If you buy using stored Energy, move 1 stored die to the next Hunger space and return the others to the bag.", "Gastar Energia", "Se comprar usando Energia guardada, mova 1 dado guardado para o próximo espaço de Fome e devolva os demais ao saco."),
          ruleLine("Replace a card", "While buying, reduce one stored die by 1 to discard and replace one face-up card. Do not reduce a die below 1 or replace the only card you can afford; after replacing, you must buy at least one card.", "Trocar uma carta", "Durante a compra, reduza um dado guardado em 1 para descartar e repor uma carta visível. Não reduza o dado abaixo de 1 nem troque a única carta que pode pagar; após trocar, você deve comprar pelo menos uma carta."),
          ruleLine("No affordable card", "If all Energy spaces are full but none of the available cards is affordable, return all stored dice to the bag without moving one to Hunger.", "Nenhuma carta acessível", "Se todos os espaços de Energia estiverem cheios, mas nenhuma carta disponível puder ser comprada, devolva todos os dados guardados ao saco sem mover nenhum para Fome.")
        ])}
        ${referenceLink(15)} ${referenceLink(16)}
      </div>
      <div class="callout">
        ${lineList([
          ruleLine("Empty bag", "When the Shark must draw and the bag has fewer than 2 dice, remove Current dice from the board until it has 2.", "Saco vazio", "Quando precisar comprar e o saco tiver menos de 2 dados, retire Correntes do tabuleiro até haver 2."),
          ruleLine("Bag privacy", "Only the Shark may inspect the bag; shake it before drawing.", "Privacidade do saco", "Só o Tubarão pode olhar no saco; sacuda-o antes de comprar.")
        ])}
        ${referenceLink(18)}
      </div>`;
  }

  function confrontationSection() {
    return `
      <div class="turn-block">
        <h3>${t("Confrontation", "Confronto")}</h3>
        ${lineList([
          ruleLine("Trigger", "A red Strike against the Octopus block begins a confrontation. Search alone never does.", "Início", "Um Ataque vermelho contra o bloco do Polvo inicia um confronto. Busca sozinha nunca inicia."),
          ruleLine("Choose secretly", "Each player secretly chooses one of their remaining Confrontation cards and places it face-down. Reveal both at the same time.", "Escolha secreta", "Cada jogador escolhe em segredo uma de suas cartas de Confronto restantes e a coloca virada para baixo. Revelem as duas ao mesmo tempo."),
          ruleLine("Shark matches", "The Shark card with the same color as the Octopus card is its counter. If the revealed colors match, the Shark wins immediately.", "Tubarão acerta", "A carta do Tubarão da mesma cor que a carta do Polvo é a resposta. Se as cores reveladas forem iguais, o Tubarão vence imediatamente."),
          ruleLine("Octopus escapes", "If the Shark did not match, the Octopus escapes and resolves the survival effect printed on its card. Remove the Octopus's played card and the Shark counter card of that color; keep the Shark card it played that did not match.", "Polvo escapa", "Se o Tubarão não acertou, o Polvo escapa e resolve o efeito de sobrevivência impresso na carta. Remova do jogo a carta jogada pelo Polvo e a carta de Tubarão que responde àquela cor; mantenha a carta de Tubarão jogada que não correspondeu."),
          ruleLine("Later confrontations", "Hostile can remove another pair, so this count assumes it has not done so: after one escape, 2 pairs remain (a 50–50 chance); the Shark wins on the third confrontation.", "Confrontos seguintes", "Hostile pode remover outro par, então esta contagem pressupõe que isso não ocorreu: após uma fuga, restam 2 pares (chance de 50–50); o Tubarão vence no terceiro confronto.")
        ])}
        <p>${t("The three survival effects and color counter relationships are printed on the physical Confrontation cards; keep the two sets separate.", "Os três efeitos de sobrevivência e as relações de cores para contra-atacar estão impressos nas cartas físicas de Confronto; mantenha os dois conjuntos separados.")}</p>
        ${referenceLink(17)}
      </div>`;
  }

  function sharkCardClarifications() {
    const cards = [
      ["Aggressive", "No effect other than giving you red dice.", "Não tem efeito além de fornecer dados vermelhos."],
      ["Agile", "Before moving, make a 180° turn.", "Antes de mover, faça uma virada de 180°."],
      ["Daring", "Before moving, move another die in your pool to Hunger; turn a red Strike die also in your pool to 6.", "Antes de mover, transfira outro dado do conjunto de dados rolados neste turno para Fome; gire para 6 um dado vermelho de Ataque que também esteja nesse conjunto."],
      ["Hostile", "Shuffle the remaining Octopus Confrontation cards face-down, reveal one at random and remove it; remove the Shark card of its matching color too.", "Embaralhe viradas para baixo as cartas de Confronto restantes do Polvo, revele uma aleatoriamente e remova-a; remova também a carta de Tubarão da cor correspondente."],
      ["Hungry", "During Draw & Roll, draw and roll one additional die. This can happen after the usual dice are rolled.", "Durante Comprar e Rolar, compre e role 1 dado adicional. Isso pode ocorrer depois de rolar os dados normais."],
      ["Observant", "Ignore a Trap effect after revealing the Trap during Search/Strike.", "Ignore o efeito de uma Armadilha depois de revelá-la durante Busca/Ataque."],
      ["Reactive", "After drawing but before rolling, return 2 dice to the bag and choose a replacement die by looking inside.", "Depois de comprar, mas antes de rolar, devolva 2 dados ao saco e escolha um dado substituto olhando dentro dele."],
      ["Relentless", "During Draw & Roll, reroll 1 or 2 dice once each. Growth rerolls can add more rerolls.", "Durante Comprar e Rolar, role novamente 1 ou 2 dados uma vez cada. As rolagens de Crescimento podem acrescentar outras."],
      ["Ruthless", "Before moving, increase a die's value in your pool as directed by the card and rotate it to show the new number.", "Antes de mover, aumente o valor de um dado do conjunto de dados rolados conforme indicado pela carta e gire-o para mostrar o novo número."],
      ["Swift", "During Move, move one additional space; use this movement before or after entering a Current.", "Durante Mover, avance 1 espaço adicional; use esse movimento antes ou depois de entrar em uma Corrente."],
      ["Vigilant", "After rolling, save a die on the face-down card. On a later turn retrieve it as an extra die, unchanged and not part of the current pool.", "Depois de rolar, guarde um dado na carta virada para baixo. Em um turno posterior, recupere-o como dado extra, sem alterar seu valor e sem que faça parte do conjunto de dados rolados neste turno."]
    ];
    return cards.map(([name, en, pt]) => `
      <li><strong>${name}:</strong> ${t(en, pt)}</li>`).join("");
  }

  function octopusCardClarifications() {
    return lineList([
      ruleLine("Trash", "A trashed card is out of the game. A card cannot use its own Trash effect to trash itself.", "Remover do jogo", "Uma carta removida do jogo não volta. Uma carta não pode usar seu próprio efeito Trash para remover a si mesma."),
      ruleLine("Taking Chances", "The Center Zone block may be hidden or revealed before the shuffle; all three blocks return hidden.", "Taking Chances", "O bloco da Zona Central pode ser escondido ou revelado antes de embaralhar; os três blocos voltam escondidos."),
      ruleLine("Cloud Of Ink", "The Octopus may be revealed as part of paying the card's reveal cost.", "Cloud Of Ink", "O Polvo pode ser revelado como parte do pagamento do custo de revelação da carta."),
      ruleLine("Sudden Evasion", "The same block may be included in both swaps.", "Sudden Evasion", "O mesmo bloco pode participar das duas trocas."),
      ruleLine("Sharp Senses", "Its Learn 2 may gain 1 Eat card, but that Eat card goes to the discard pile, not the hand.", "Sharp Senses", "Seu Learn 2 pode obter 1 carta Eat, mas essa carta Eat vai para o descarte, não para a mão.")
    ]);
  }

  function blocksAndCards() {
    const food = [
      iconCard("food-red-rock-crab.webp", "Red Rock Crab", "Raise the hand-size limit to 5 for the rest of the game, then draw up to 5 immediately.", "Red Rock Crab", "Aumente o limite de mão para 5 pelo resto da partida e compre imediatamente até 5 cartas.", 11),
      iconCard("food-sea-snail.webp", "Sea Snail", "Search your draw and/or discard pile for one specific card and add it to your hand, ignoring the hand limit for that turn. Shuffle the draw pile after searching it.", "Sea Snail", "Procure uma carta específica no baralho e/ou descarte e adicione-a à mão, ignorando o limite de mão neste turno. Embaralhe o baralho depois de procurá-lo.", 11),
      iconCard("food-cape-rock-lobster.webp", "Cape Rock Lobster", "Immediately hide all your revealed blocks.", "Cape Rock Lobster", "Esconda imediatamente todos os seus blocos revelados.", 11),
      iconCard("food-south-african-abalone.webp", "South African Abalone", "Learn up to 3 for free. Cards go to the discard pile; blocks must exchange with revealed blocks already on the board.", "South African Abalone", "Faça Learn de até 3 gratuitamente. Cartas vão para o descarte; blocos devem ser trocados por blocos já revelados no tabuleiro.", 11)
    ];
    const foodEffects = [
      iconCard("food-effect-hand-five.webp", "Hand size 5", "The Red Rock Crab raises your maximum hand size to 5 and lets you immediately draw up to it.", "Mão de tamanho 5", "Red Rock Crab aumenta o limite de mão para 5 e permite comprar imediatamente até esse tamanho.", 11),
      iconCard("food-effect-search-card.webp", "Find a card", "Sea Snail finds one named card in the draw and/or discard pile; shuffle the draw pile after searching it.", "Encontrar uma carta", "Sea Snail encontra uma carta específica no baralho e/ou descarte; embaralhe o baralho depois de procurá-lo.", 11),
      iconCard("food-effect-hide-all.webp", "Hide all revealed blocks", "Cape Rock Lobster immediately hides all your revealed blocks.", "Esconder todos os blocos revelados", "Cape Rock Lobster esconde imediatamente todos os seus blocos revelados.", 11),
      iconCard("food-effect-learn-three.webp", "Learn up to 3", "South African Abalone lets you Learn up to 3 for free, exchanging gained blocks with revealed board blocks.", "Learn até 3", "South African Abalone permite fazer Learn de até 3 gratuitamente, trocando blocos obtidos por blocos revelados no tabuleiro.", 11)
    ];
    const traps = [
      iconCard("trap-hide-two.webp", "Hide 2 blocks", "Hide up to 2 blocks immediately. This Trap itself cannot be hidden by this effect.", "Esconder 2 blocos", "Esconda até 2 blocos imediatamente. Esta Armadilha não pode ser escondida por este efeito.", 11),
      iconCard("trap-discard-current.webp", "Discard 1 Current", "Remove 1 Current from the board and return that die to the Shark's bag.", "Descartar 1 Corrente", "Retire 1 Corrente do tabuleiro e devolva esse dado ao saco do Tubarão.", 11),
      iconCard("trap-discard-two-currents.webp", "Discard 2 Currents", "Remove up to 2 Currents from the board and return them to the Shark's bag.", "Descartar 2 Correntes", "Retire até 2 Correntes do tabuleiro e devolva-as ao saco do Tubarão.", 11),
      iconCard("trap-move-shark-to-den.webp", "Move the Shark to a den", "Move the Shark to any free den. If all dens are covered by Currents, return one such die to the bag and use that den. Place the Shark at 90° to the path so it can choose its direction.", "Mover o Tubarão para uma toca", "Mova o Tubarão para qualquer toca livre. Se todas estiverem cobertas por Correntes, devolva um desses dados ao saco e use essa toca. Coloque o Tubarão a 90° do caminho para que possa escolher a direção.", 11)
    ];
    const icons = [
      iconCard("die-current.webp", "Current die", "Blue dice place Currents, which let the Shark swim farther.", "Dado de Corrente", "Dados azuis colocam Correntes, que permitem ao Tubarão nadar mais longe.", 12),
      iconCard("die-search.webp", "Search die", "Yellow dice reveal hidden blocks in eligible adjacent zones.", "Dado de Busca", "Dados amarelos revelam blocos escondidos em zonas adjacentes válidas.", 12),
      iconCard("die-strike.webp", "Strike die", "Red dice attack a block where the Octopus might be.", "Dado de Ataque", "Dados vermelhos atacam um bloco onde o Polvo pode estar.", 12),
      iconCard("block-shell.webp", "Shell", "A Shell has no special effect.", "Concha", "Uma Concha não tem efeito especial.", 11),
      iconCard("block-double-shell.webp", "Double Shell", "When revealed to pay a card cost, it counts as revealing 2 blocks.", "Concha Dupla", "Quando revelada para pagar custo de carta, conta como revelar 2 blocos.", 11),
      iconCard("block-octopus.webp", "Octopus block", "Represents the Octopus and can never be removed from the game.", "Bloco do Polvo", "Representa o Polvo e nunca pode ser removido do jogo.", 11)
    ];
    return `
      ${sectionHeading("blocks-cards", t("Blocks, cards & iconography", "Blocos, cartas e iconografia"), "06", [5, 11, 12, 19])}
      <p class="glossary-intro">${t(
        "Each image below is an individual crop of one printed icon or component symbol. Trap effects occur only when the Shark reveals that Trap by Search or Strike. Food effects belong to the Octopus and are one-time, free actions.",
        "Cada imagem abaixo é um recorte individual de um ícone ou símbolo de componente impresso. Efeitos de Armadilha só ocorrem quando o Tubarão revela a Armadilha com Busca ou Ataque. Efeitos de Comida pertencem ao Polvo e são ações gratuitas de uso único."
      )}</p>
      <h3 class="subhead">${t("Food blocks · Octopus", "Blocos de Comida · Polvo")}</h3>
      <div class="icon-grid">${food.join("")}</div>
      <h3 class="subhead">${t("Printed Food-effect symbols", "Símbolos impressos dos efeitos de Comida")}</h3>
      <div class="icon-grid">${foodEffects.join("")}</div>
      <h3 class="subhead">${t("Trap blocks · triggered by Shark", "Blocos de Armadilha · ativados pelo Tubarão")}</h3>
      <div class="icon-grid">${traps.join("")}</div>
      <h3 class="subhead">${t("Dice and other blocks", "Dados e outros blocos")}</h3>
      <div class="icon-grid">${icons.join("")}</div>
      <div class="turn-block">
        <h3>${t("Octopus starter symbols", "Símbolos das cartas iniciais do Polvo")}</h3>
        <div class="icon-grid">
          ${iconCard("starter-symbol-one.webp", "Single-wave starter symbol", "Set aside starter cards bearing this single curved mark during card sorting.", "Símbolo inicial de uma onda", "Separe durante a organização as cartas iniciais que tenham esta marca curva única.", 5)}
          ${iconCard("starter-symbol-two.webp", "Double-wave starter symbol", "Set aside starter cards bearing this double curved mark during card sorting.", "Símbolo inicial de duas ondas", "Separe durante a organização as cartas iniciais que tenham esta marca curva dupla.", 5)}
        </div>
      </div>
      <div class="turn-block">
        <h3>${t("Shark card clarifications", "Esclarecimentos das cartas do Tubarão")}</h3>
        <p>${t("Shark cards have one-time effects. When used in their indicated step, flip them face-down; they are out of the game. Costs, dice gained, and any unlisted card text are printed on the physical cards.", "As cartas do Tubarão têm efeitos de uso único. Ao usá-las na etapa indicada, vire-as para baixo; elas saem do jogo. Custos, dados recebidos e qualquer texto de carta não detalhado estão impressos nas cartas físicas.")}</p>
        <ul class="card-lines">${sharkCardClarifications()}</ul>
        ${referenceLink(16)} ${referenceLink(19)}
      </div>
      <div class="turn-block">
        <h3>${t("Octopus card clarifications", "Esclarecimentos das cartas do Polvo")}</h3>
        ${octopusCardClarifications()}
        ${referenceLink(19)}
      </div>
      <div class="callout">${t(
        "The Octopus discard pile and both players' trash piles are public. If you inspect the Octopus discard pile, leave its order unchanged.",
        "O descarte do Polvo e as pilhas de cartas removidas dos dois jogadores são públicos. Se consultar o descarte do Polvo, mantenha a ordem das cartas."
      )} ${referenceLink(18)}</div>
      <div class="source-note">${t(
        "Individual Octopus card costs and effects, and the survival effects printed on the Confrontation cards, remain on the physical cards. This guide covers the general rules and the manual's printed clarifications without inventing card text.",
        "Custos e efeitos individuais das cartas do Polvo, assim como os efeitos de sobrevivência impressos nas cartas de Confronto, permanecem nas cartas físicas. Este guia cobre as regras gerais e os esclarecimentos impressos no manual sem inventar textos de cartas."
      )}</div>`;
  }

  function examplesSection() {
    const examples = state.side === "octopus"
      ? [
        [t("Eat a Food block", "Comer um bloco de Comida"), [
          ruleLine("Nimble Dodge", "Pay its reveal cost with the Food block, then swap the hidden Octopus with an adjacent Shell so they become orthogonally adjacent.", "Nimble Dodge", "Pague o custo de revelação com o bloco de Comida e troque o Polvo escondido por uma Concha adjacente para ficarem ortogonalmente adjacentes."),
          ruleLine("Eat", "Play the matching Eat card, reveal the Octopus, replace the Food with a spare Shell, and move the Food to the next Food Track space.", "Eat", "Jogue a carta Eat correspondente, revele o Polvo, troque a Comida por uma Concha extra e mova a Comida para o próximo espaço da Trilha de Comida."),
          ruleLine("Food effect", "Use the Food effect immediately or save it for later. If it was the fourth Food, the Octopus wins at once.", "Efeito da Comida", "Use o efeito da Comida imediatamente ou guarde-o. Se era a quarta Comida, o Polvo vence na hora.")
        ], 10],
        [t("Hide and bluff", "Esconder e blefar"), [
          ruleLine("Swapping", "Preserve whether each block is hidden or revealed.", "Trocar", "Preserve se cada bloco está escondido ou revelado."),
          ruleLine("Shuffling", "Randomize the selected hidden blocks; the Shark chooses empty spaces without seeing which block goes where.", "Embaralhar", "Randomize os blocos escondidos escolhidos; o Tubarão seleciona os espaços vazios sem ver onde cada bloco fica.")
        ], 8]
      ]
      : [
        [t("Crossing Currents", "Atravessar Correntes"), [
          ruleLine("One Current", "Skip one Current space with a single Current die.", "Uma Corrente", "Pule um espaço de Corrente com um único dado de Corrente."),
          ruleLine("Chain", "Cross multiple Currents only when their pips strictly decrease in the direction of movement.", "Cadeia", "Atravesse várias Correntes somente quando seus valores diminuírem estritamente na direção do movimento."),
          ruleLine("After crossing", "Remove only the first Current die crossed and put it on Growth; other crossed dice stay on the board.", "Depois de cruzar", "Remova somente o primeiro dado de Corrente cruzado e coloque-o em Crescimento; os outros permanecem no tabuleiro.")
        ], 13],
        [t("Search before Strike", "Buscar antes de Atacar"), [
          ruleLine("Choose zones", "The Shark is adjacent to a Kelp Zone valued 4 and the Center Zone valued 2. A yellow 3 can Search only the Center Zone; a red die can Strike either zone if it meets the value.", "Escolha as zonas", "O Tubarão está adjacente a uma Zona de Kelp com valor 4 e à Zona Central com valor 2. Um 3 amarelo só pode Buscar na Zona Central; um dado vermelho pode Atacar qualquer uma se atingir o valor."),
          ruleLine("Reveal order", "Place both dice before the Octopus reveals anything. Search reveals a Shell first; Strike then reveals the Octopus and starts a confrontation.", "Ordem de revelação", "Coloque os dois dados antes de o Polvo revelar qualquer coisa. Busca revela primeiro uma Concha; Ataque então revela o Polvo e inicia um confronto.")
        ], 14],
        [t("Spend Energy", "Gastar Energia"), [
          ruleLine("Buy", "With 10 pips stored, buy one or more face-up cards whose total cost is at most 10.", "Comprar", "Com 10 pontos guardados, compre uma ou mais cartas visíveis cujo custo total seja no máximo 10."),
          ruleLine("Pay the Hunger cost", "Move one stored die to Hunger and return the others to the bag.", "Pague o custo de Fome", "Mova um dado guardado para Fome e devolva os outros ao saco.")
        ], 16],
        [t("Survive a confrontation", "Sobreviver a um confronto"), [
          ruleLine("Secret choice", "Both players choose secretly. If the Shark does not play the counter to the Octopus's chosen color, the Octopus escapes and resolves its card's effect.", "Escolha secreta", "Os dois jogadores escolhem em segredo. Se o Tubarão não jogar a resposta à cor escolhida pelo Polvo, o Polvo escapa e resolve o efeito da carta."),
          ruleLine("Remove cards", "Remove the Octopus's used card and the matching-color Shark card from the game.", "Remova cartas", "Remova do jogo a carta usada pelo Polvo e a carta de Tubarão da cor correspondente.")
        ], 17]
      ];
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), "07", [...new Set(examples.map((example) => example[2]))])}
      <p class="kelp-reference-side">${t("Examples for:", "Exemplos de:")} <strong>${sideName()}</strong></p>
      <div class="example-grid">${examples.map(([title, items, page], index) => `
        <article class="example-card">
          <span class="card-number">${String(index + 1).padStart(2, "0")}</span>
          <h3>${title}</h3>
          ${lineList(items)}
          <div class="example-source"><span>${t("Paraphrased from the manual", "Paráfrase do manual")}</span>${referenceLink(page)}</div>
        </article>`).join("")}</div>`;
  }

  const glossary = [
    { term: ["Hidden / revealed", "Escondido / revelado"], text: ["Hidden blocks stand upright with their symbols facing only the Octopus. Revealed blocks lie horizontally with the symbol facing up, visible to both players.", "Blocos escondidos ficam em pé, com símbolos voltados apenas para o Polvo. Blocos revelados ficam deitados, com o símbolo para cima, visível aos dois jogadores."], side: null, page: 6 },
    { term: ["Adjacency", "Adjacência"], text: ["Blocks are adjacent only when they are orthogonally next to each other, not diagonally.", "Blocos são adjacentes somente quando estão lado a lado ortogonalmente, não na diagonal."], side: null, page: 6 },
    { term: ["Block space", "Espaço de bloco"], text: ["The printed space in a zone where an Octopus block is placed.", "O espaço impresso em uma zona onde se coloca um bloco do Polvo."], side: null, page: 4 },
    { term: ["Zone value", "Valor da zona"], text: ["The printed number that represents visibility in that area and sets the minimum Search/Strike die value.", "O número impresso que representa a visibilidade naquela área e define o valor mínimo do dado de Busca/Ataque."], side: "shark", page: 4 },
    { term: ["Dice supply", "Suprimento de dados"], text: ["Unused dice kept within the Shark's reach; they are not in the bag or the dice pool.", "Dados não utilizados deixados ao alcance do Tubarão; não estão no saco nem no conjunto de dados do turno."], side: "shark", page: 3 },
    { term: ["Dice pool", "Conjunto de dados do turno"], text: ["Dice drawn and rolled for the current Shark turn, available to place or store. This is separate from the unused supply and stored Energy.", "Dados comprados e rolados neste turno do Tubarão, disponíveis para colocar ou guardar. São diferentes do suprimento não utilizado e da Energia guardada."], side: "shark", page: 12 },
    { term: ["Current", "Corrente"], text: ["A blue die placed on a Current space. It lets the Shark skip that space while moving; a sequence can be crossed only in strictly decreasing order.", "Um dado azul colocado em um espaço de Corrente. Ele permite que o Tubarão pule esse espaço ao mover; uma sequência só pode ser atravessada em ordem estritamente decrescente."], side: "shark", page: 13 },
    { term: ["Growth Track", "Trilha de Crescimento"], text: ["The Shark places used Search dice and the first Current crossed here. Completing a three-die tile unlocks its permanent ability.", "O Tubarão coloca aqui dados de Busca usados e a primeira Corrente cruzada. Completar uma peça com três dados libera sua habilidade permanente."], side: "shark", page: 15 },
    { term: ["Energy", "Energia"], text: ["Dice stored by the Shark; their total pips can buy face-up Shark cards. Spending any stored Energy also advances Hunger.", "Dados guardados pelo Tubarão; a soma dos pontos pode comprar cartas de Tubarão visíveis. Gastar Energia também avança a trilha de Fome."], side: "shark", page: 16 },
    { term: ["Hunger Track", "Trilha de Fome"], text: ["The Shark places used Strike dice here and must place one stored die here when it spends Energy. Its seventh space causes exhaustion.", "O Tubarão coloca aqui dados de Ataque usados e deve colocar um dado guardado ao gastar Energia. A sétima casa causa esgotamento."], side: "shark", page: 12 },
    { term: ["Food Track", "Trilha de Comida"], text: ["The Octopus moves each eaten Food block to the next open space. Filling the four spaces wins immediately.", "O Polvo move cada bloco de Comida consumido para o próximo espaço livre. Preencher os quatro espaços vence imediatamente."], side: "octopus", page: 10 },
    { term: ["Trap", "Armadilha"], text: ["A block with the red toothed marker. It is triggered when the Shark reveals it through Search or Strike.", "Um bloco com o marcador vermelho serrilhado. É ativado quando o Tubarão o revela com Busca ou Ataque."], side: null, page: 11 },
    { term: ["Learn", "Learn"], text: ["An Octopus card effect that gains cards or blocks from the tops of the four piles, following the card's number and the exchange rules.", "Um efeito de carta do Polvo que obtém cartas ou blocos do topo das quatro pilhas, respeitando o número da carta e as regras de troca."], side: "octopus", page: 9 },
    { term: ["Confrontation", "Confronto"], text: ["The hidden simultaneous card choice after the Shark strikes the Octopus. A matching counter wins for the Shark; a mismatch lets the Octopus escape.", "A escolha simultânea e secreta de cartas depois que o Tubarão ataca o Polvo. Uma resposta correspondente dá a vitória ao Tubarão; uma falha permite a fuga do Polvo."], side: null, page: 17 }
  ];

  function glossarySection() {
    const visible = glossary.filter((item) => item.side === null || item.side === state.side);
    visible.sort((a, b) => a.term[state.language === "pt-BR" ? 1 : 0].localeCompare(b.term[state.language === "pt-BR" ? 1 : 0], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), "08", [...new Set(visible.map((item) => item.page))])}
      <p class="glossary-intro">${t("Short explanations for terms used in the selected side's rules.", "Explicações breves dos termos usados nas regras do lado selecionado.")}</p>
      <div class="quick-grid glossary-grid">${visible.map((item) => `
        <article class="info-card glossary-card">
          <span class="component-label">${t("TERM", "TERMO")}</span>
          <h3>${t(item.term[0], item.term[1])}</h3>
          <p>${t(item.text[0], item.text[1])}</p>
          ${referenceLink(item.page)}
        </article>`).join("")}</div>`;
  }

  function renderInto(host) {
    root = host;
    document.body.classList.add("theme-kelp");
    document.documentElement.lang = state.language;
    document.title = t("Kelp — Field Manual", "Kelp — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Kelp: Shark vs. Octopus. Choose the day or night board and switch the guide between both asymmetric sides.",
        "Regras interativas bilíngues de Kelp: Tubarão vs. Polvo. Escolha o tabuleiro diurno ou noturno e alterne o guia entre os dois lados assimétricos."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook · core game", "Livro interativo · jogo base")}</p>
          <h1>Kelp</h1>
          <p class="hero-intro">${t(
            "An asymmetric two-player hunt in the kelp forests of False Bay. The Shark rolls dice to search, strike, and grow stronger; the Octopus moves hidden blocks, builds a deck, and chooses when to feed or escape.",
            "Uma caçada assimétrica para duas pessoas nas florestas de kelp de False Bay. O Tubarão rola dados para buscar, atacar e crescer; o Polvo move blocos escondidos, melhora seu baralho e escolhe quando comer ou escapar."
          )}</p>
          <div class="hero-meta"><span>${t("2 players", "2 jogadores")}</span><span>${t("Asymmetric strategy", "Estratégia assimétrica")}</span><span>${t("Core rules · v1.3", "Regras base · v1.3")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/kelp.webp" alt="${t("Cover of the Kelp: Shark vs. Octopus rulebook", "Capa do manual de Kelp: Shark vs. Octopus")}" fetchpriority="high"><figcaption>${t("Rulebook cover · Carl Robinson and Weberson Santiago", "Capa do manual · Carl Robinson e Weberson Santiago")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("Field guide", "Guia de campo")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column kelp-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied Kelp core rulebook v1.3. It includes the standard day board and the alternate night board, but no expansions. Card-specific costs and text remain on the physical cards.",
            "Este guia cobre o manual base fornecido de Kelp v1.3. Inclui o tabuleiro diurno padrão e o tabuleiro noturno alternativo, sem expansões. Custos e textos específicos permanecem nas cartas físicas."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${victorySection()}</section>
          <section class="rule-section">
            ${sectionHeading("turn", t("Turns & actions", "Turnos e ações"), "04", state.side === "shark" ? [12, 13, 14, 15, 16, 18] : [6, 7, 8, 9, 10, 19])}
            <p class="kelp-reference-side">${t("Reading side:", "Lado em consulta:")} <strong>${sideName()}</strong></p>
            ${state.side === "shark" ? sharkTurn() + confrontationSection() : octopusTurn()}
          </section>
          <section class="rule-section">${boardSummary()}</section>
          <section class="rule-section">${blocksAndCards()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the authorized Kelp: Shark vs. Octopus rulebook v1.3. Game design: Carl Robinson; illustrations: Weberson Santiago. © 2024 Wonderbow.",
        "Guia pessoal de consulta baseado no manual autorizado de Kelp: Shark vs. Octopus v1.3. Design do jogo: Carl Robinson; ilustrações: Weberson Santiago. © 2024 Wonderbow."
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
    if (button.dataset.side) {
      state.side = button.dataset.side === "shark" ? "shark" : "octopus";
      savePreferences();
      renderInto(root);
      return;
    }
    if (button.hasAttribute("data-setup-reset")) {
      setupState.checks = [];
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
      root.querySelector(".kelp-page")?.prepend(notice);
    }
    if (notice) {
      notice.textContent = storageNoticeText();
    }
  }

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !root || !root.contains(target)) {
      return;
    }
    if (target.matches("[data-board]")) {
      const board = target.dataset.board === "night" ? "night" : "day";
      if (state.board !== board) {
        state.board = board;
        setupState = { board, checks: [] };
        savePreferences();
        saveSetup();
        renderInto(root);
      }
      return;
    }
    if (target.matches("[data-setup-check]")) {
      const id = target.dataset.setupCheck;
      if (!phaseIds.includes(id)) {
        return;
      }
      const checks = new Set(setupState.checks);
      if (target.checked) {
        checks.add(id);
      } else {
        checks.delete(id);
      }
      setupState = { board: state.board, checks: [...checks] };
      saveSetup();
      updateProgress();
    }
  }

  window.Kelp = { renderInto, onClick, onChange };
})();
