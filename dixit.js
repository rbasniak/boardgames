(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.dixit.v1";
  const SETUP_KEY = "field-manual.dixit.setup.v1";
  const MANUAL_FILE = "dixit_core.pdf";
  const ICONS = "assets/dixit/icons/";
  const ART = "assets/dixit/art/";
  // The rules sheet has no printed page numbers: page 1 is the front (title, contents, setup, steps 1–3),
  // page 2 is the back (steps 4–8, end of the game, changes for 3 players).
  const PLAYER_COUNTS = ["3", "4", "5", "6"];
  const DECK = 84;
  const WIN_SCORE = 30;
  const defaults = { language: "pt-BR", players: "4" };
  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------

  function normalizePreferences(saved) {
    return {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      players: PLAYER_COUNTS.includes(String(saved?.players)) ? String(saved.players) : defaults.players
    };
  }

  function signature(source = state) {
    return String(source.players);
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Dixit preferences.", error);
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
      console.error("Could not read Dixit setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Dixit preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Dixit setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function players(source = state) {
    return Number(source.players);
  }

  function isThree(count = players()) {
    return Number(count) === 3;
  }

  // Cards in hand — p. 1 (6) and p. 2 “Changes for 3 Players” (7).
  function handSize(count = players()) {
    return isThree(count) ? 7 : 6;
  }

  // Voting tokens per player, numbered 1..N — p. 1 (4–6 players) and p. 2 (3 players: 5).
  function tokensEach(count = players()) {
    return isThree(count) ? 5 : Number(count);
  }

  // Cards each other player hands in — p. 1 step 2 (1) and p. 2 (3 players: 2).
  function cardsHandedIn(count = players()) {
    return isThree(count) ? 2 : 1;
  }

  // Cards revealed on the numbered spaces each turn.
  function revealed(count = players()) {
    return isThree(count) ? 5 : Number(count);
  }

  function drawPile(count = players()) {
    return DECK - Number(count) * handSize(count);
  }

  // Each turn uses (and refills) exactly the revealed cards; the game ends on the turn whose refill
  // takes the last card of the draw pile.
  function maxTurns(count = players()) {
    return Math.ceil(drawPile(count) / revealed(count));
  }

  function others(count = players()) {
    return Number(count) - 1;
  }

  function manualUrl(page) {
    const script = document.querySelector('script[src*="dixit.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${MANUAL_FILE}`, baseUrl).href}#page=${page}`;
  }

  function referenceLink(page) {
    return `<a class="source-link" href="${manualUrl(page)}" target="_blank" rel="noreferrer">${t(`Rules p. ${page} ↗`, `Regras p. ${page} ↗`)}</a>`;
  }

  function sectionHeading(id, title, index, pages) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("STORYTELLER'S TABLE", "MESA DO NARRADOR")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="dx-section-references">${pages.map(referenceLink).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
  }

  function iconCard(file, titleEn, bodyEn, titlePt, bodyPt, page, wide = false) {
    const title = t(titleEn, titlePt);
    return `
      <article class="icon-card${wide ? " dx-icon-wide" : ""}">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}.webp" alt="${title}"></span>
        <div><strong>${title}</strong><p>${t(bodyEn, bodyPt)}</p>${referenceLink(page)}</div>
      </article>`;
  }

  function infoCard(label, title, lines, page, extraClass = "") {
    const pages = Array.isArray(page) ? page : [page];
    return `
      <article class="info-card ${extraClass}">
        <span class="component-label">${label}</span>
        <h3>${title}</h3>
        ${lineList(lines)}
        ${pages.map(referenceLink).join(" ")}
      </article>`;
  }

  function interpretation(en, pt) {
    return `<span class="dx-interpretation">${t("Guide's reading", "Leitura do guia")}</span> ${t(en, pt)}`;
  }

  function playersLabel(count = state.players) {
    return t(`${count} players`, `${count} jogadores`);
  }

  function spacesText(count = players()) {
    return t(`spaces 1–${revealed(count)}`, `espaços 1–${revealed(count)}`);
  }

  // ---------- header ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["victory", t("Winning", "Vitória")],
      ["turn", t("A turn, step by step", "Um turno, passo a passo")],
      ["scoring", t("Scoring", "Pontuação")],
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
          <span class="brand-mark" aria-hidden="true">DX</span>
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
      `${readFailed ? "This browser could not read the saved Dixit match or setup progress; defaults are shown. " : ""}${writeFailed ? "The latest change could not be saved and is visible on screen only." : ""}`,
      `${readFailed ? "Este navegador não conseguiu ler a partida ou o progresso de Dixit salvos; as opções padrão estão sendo mostradas. " : ""}${writeFailed ? "A alteração mais recente não pôde ser salva e aparece somente na tela." : ""}`
    ).trim();
  }

  // ---------- configuration ----------

  function choiceCard(name, value, dataAttr, checked, title, description) {
    return `
      <label class="dx-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" ${dataAttr} ${checked ? "checked" : ""}>
        <span class="dx-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function playerChoiceText(count) {
    if (isThree(count)) {
      return t(
        "Special 3-player rules: 7 cards in hand, voting tokens 1–5, and each of the 2 other players hands in 2 cards, so 5 cards are revealed. Voting and scoring do not change.",
        "Regras especiais para 3: 7 cartas na mão, fichas de votação 1–5 e cada um dos 2 outros jogadores entrega 2 cartas, então 5 cartas são reveladas. Votação e pontuação não mudam."
      );
    }
    return t(
      `6 cards in hand, voting tokens 1–${count}. Each of the ${others(count)} other players hands in 1 card, so ${count} cards are revealed. ${drawPile(count)}-card draw pile.`,
      `6 cartas na mão, fichas de votação 1–${count}. Cada um dos ${others(count)} outros jogadores entrega 1 carta, então ${count} cartas são reveladas. Pilha de compra de ${drawPile(count)} cartas.`
    );
  }

  function matchConfiguration() {
    return `
      <section class="controls-panel dx-config" id="build-match" aria-labelledby="dx-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="dx-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "The player count is the only choice the rules sheet asks for. It decides how many cards each player holds, which voting tokens are used and how many cards are revealed each turn; 3 players follow special rules. The rules have no optional variants or expansions. Your choice filters the setup checklist and the rules below.",
              "O número de jogadores é a única escolha que a folha de regras pede. Ele define quantas cartas cada um tem na mão, quais fichas de votação são usadas e quantas cartas são reveladas a cada turno; com 3 jogadores há regras especiais. As regras não têm variantes opcionais nem expansões. Sua escolha filtra a lista de preparação e as regras abaixo."
            )}</p>
          </div>
        </div>
        <fieldset class="dx-choice-group">
          <legend>${t("Players · selected:", "Jogadores · selecionado:")} <span>${playersLabel()} · ${t(`${handSize()} cards in hand · ${revealed()} cards revealed per turn`, `${handSize()} cartas na mão · ${revealed()} cartas reveladas por turno`)}</span></legend>
          <p class="dx-choice-intro">${t("Dixit is played by 3 to 6 players (6 game pieces and 6 colours of voting tokens).", "Dixit é jogado por 3 a 6 jogadores (6 peões e fichas de votação em 6 cores).")} ${referenceLink(1)} ${referenceLink(2)}</p>
          <div class="dx-choice-grid">${PLAYER_COUNTS.map((count) => choiceCard("dx-players", count, `data-players="${count}"`, state.players === count, playersLabel(count), playerChoiceText(count))).join("")}</div>
        </fieldset>
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function setupPhases() {
    const n = players();
    const k = tokensEach();
    return [
      {
        id: "board",
        title: t("Scoreboard and game pieces", "Tabuleiro de pontuação e peões"),
        pages: [1],
        items: [
          t("Put the scoreboard in the middle of the table, where everyone can see and reach the numbered spaces along its edge (the revealed cards go there) and the score track.", "Coloque o tabuleiro de pontuação no meio da mesa, onde todos vejam e alcancem os espaços numerados da borda (onde as cartas são reveladas) e a trilha de pontos."),
          t(`Each of the ${n} players chooses one of the 6 coloured game pieces and places it on the starting space of the score track.`, `Cada um dos ${n} jogadores escolhe um dos 6 peões coloridos e o coloca no espaço inicial da trilha de pontos.`),
          n < 6 ? t(`Return the ${6 - n} unused game piece${6 - n === 1 ? "" : "s"} to the box.`, `Devolva à caixa ${6 - n === 1 ? "o peão não usado" : `os ${6 - n} peões não usados`}.`) : null,
          interpretation("the score track is the numbered track around the scoreboard (the rules picture spaces 15 to 30); its first space is the starting space and counts as 0 points, so your first point moves you to space 1.", "a trilha de pontos é a trilha numerada do tabuleiro (as regras mostram os espaços 15 a 30); o primeiro espaço dela é o espaço inicial e vale 0 pontos, então seu primeiro ponto leva você ao espaço 1.")
        ]
      },
      {
        id: "tokens",
        title: t("Voting tokens", "Fichas de votação"),
        pages: isThree() ? [1, 2] : [1],
        items: [
          t(`Each player takes ${k} voting tokens, numbered 1 to ${k}${isThree() ? " (3-player rule)" : ""}.`, `Cada jogador pega ${k} fichas de votação, numeradas de 1 a ${k}${isThree() ? " (regra para 3 jogadores)" : ""}.`),
          interpretation("take the tokens of the same colour as your game piece, so everyone can see whose vote is whose when the tokens are placed on the cards.", "pegue as fichas da mesma cor do seu peão, para todos verem de quem é cada voto quando as fichas forem colocadas nas cartas."),
          k < 6 || n < 6
            ? t(`Return the other voting tokens to the box${k < 6 ? ` (every token numbered ${k + 1}${k + 1 < 6 ? "–6" : ""}` : ""}${n < 6 ? `${k < 6 ? " and " : " ("}the sets of the unused colours` : ""}).`, `Devolva as outras fichas de votação à caixa${k < 6 ? ` (todas as fichas de número ${k + 1}${k + 1 < 6 ? "–6" : ""}` : ""}${n < 6 ? `${k < 6 ? " e " : " ("}os conjuntos das cores não usadas` : ""}).`)
            : null,
          t(`Check: ${n} players × ${k} tokens = ${n * k} tokens in play.`, `Confira: ${n} jogadores × ${k} fichas = ${n * k} fichas em jogo.`)
        ]
      },
      {
        id: "cards",
        title: t("Shuffle and deal the cards", "Embaralhe e distribua as cartas"),
        pages: isThree() ? [1, 2] : [1],
        items: [
          t(`Shuffle the full deck of ${DECK} cards.`, `Embaralhe o baralho completo de ${DECK} cartas.`),
          t(`Deal ${handSize()} cards to each player${isThree() ? " (7 instead of 6 with 3 players)" : ""}. Look only at your own cards: the cards dealt must not be seen by the other players.`, `Dê ${handSize()} cartas a cada jogador${isThree() ? " (7 em vez de 6 com 3 jogadores)" : ""}. Olhe só as suas cartas: as cartas distribuídas não podem ser vistas pelos outros jogadores.`),
          t(`Place the remaining ${drawPile()} cards face down as the draw pile, within everyone's reach.`, `Coloque as ${drawPile()} cartas restantes viradas para baixo como pilha de compra, ao alcance de todos.`),
          interpretation("leave room next to it for a face-up discard pile: the cards used each turn are discarded and never shuffled back.", "deixe espaço ao lado para uma pilha de descarte virada para cima: as cartas usadas a cada turno são descartadas e nunca voltam ao baralho.")
        ]
      },
      {
        id: "first",
        title: t("First active player", "Primeiro jogador ativo"),
        pages: [1, 2],
        items: [
          t("There is no fixed first player: the first person to think up a clue for one of the cards in their hand announces that they will be the first active player.", "Não há primeiro jogador fixo: a primeira pessoa que pensar numa dica para uma das cartas da sua mão anuncia que será o primeiro jogador ativo."),
          t("After each turn, the role passes to the player on the left of the last active player.", "Depois de cada turno, o papel passa ao jogador à esquerda do último jogador ativo.")
        ]
      }
    ];
  }

  function inventory() {
    const n = players();
    const k = tokensEach();
    const cards = [
      infoCard(t("SHARED", "COMPARTILHADO"), t("Table components", "Componentes da mesa"), [
        rl("Scoreboard", "1, in the middle: numbered card spaces, score track and the three scoring summaries.", "Tabuleiro de pontuação", "1, no meio: espaços numerados das cartas, trilha de pontos e os três resumos de pontuação."),
        rl("Cards", `${DECK} picture cards: ${n * handSize()} dealt, ${drawPile()} in the draw pile.`, "Cartas", `${DECK} cartas ilustradas: ${n * handSize()} distribuídas, ${drawPile()} na pilha de compra.`)
      ], [1]),
      infoCard(t(`PER PLAYER · ×${n}`, `POR JOGADOR · ×${n}`), t("Your pieces", "Suas peças"), [
        rl("Game piece", "1, on the starting space.", "Peão", "1, no espaço inicial."),
        rl("Voting tokens", `${k}, numbered 1–${k}.`, "Fichas de votação", `${k}, numeradas de 1 a ${k}.`),
        rl("Hand", `${handSize()} secret cards.`, "Mão", `${handSize()} cartas secretas.`)
      ], isThree() ? [1, 2] : [1]),
      infoCard(t("IN THE BOX", "NA CAIXA"), t("Not used this match", "Não usado nesta partida"), [
        n < 6 ? t(`${6 - n} game piece${6 - n === 1 ? "" : "s"} and ${6 - n} colour set${6 - n === 1 ? "" : "s"} of voting tokens.`, `${6 - n} ${6 - n === 1 ? "peão" : "peões"} e ${6 - n} ${6 - n === 1 ? "conjunto" : "conjuntos"} de fichas de votação de outras cores.`) : t("All 6 game pieces are in use.", "Os 6 peões estão em uso."),
        k < 6 ? t(`Every voting token numbered ${k + 1}${k + 1 < 6 ? "–6" : ""}, in all colours.`, `Todas as fichas de votação de número ${k + 1}${k + 1 < 6 ? "–6" : ""}, em todas as cores.`) : t("All 36 voting tokens are in use.", "As 36 fichas de votação estão em uso."),
        t(`Box total: 6 pieces and 36 voting tokens (6 colours × numbers 1–6); this match uses ${n * k}.`, `Total da caixa: 6 peões e 36 fichas de votação (6 cores × números 1–6); esta partida usa ${n * k}.`)
      ], [1])
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
        <label class="dx-setup-check" for="dx-setup-${phase.id}">
          <input id="dx-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="dx-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="dx-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), sectionIndex("setup"), isThree() ? [1, 2] : [1])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Set up this match", "Prepare esta partida")} · ${playersLabel()}</h3>
            <p>${t("One checkbox per coherent step; setup is done once per game.", "Uma caixa por etapa coerente; a preparação é feita uma vez por partida.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved separately from the match configuration and language. Changing the player count clears this checklist; changing the language does not. “Uncheck all” clears only these setup boxes.",
          "O progresso é salvo separadamente da configuração da partida e do idioma. Trocar o número de jogadores limpa esta lista; trocar o idioma não. “Desmarcar tudo” limpa somente as caixas da preparação."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}`;
  }

  // ---------- quick reference ----------

  function scoringCases() {
    return [
      {
        n: 1,
        title: ["Everyone found it", "Todos acharam"],
        lines: [
          ["Every other player voted for the active player's card.", "Todos os outros jogadores votaram na carta do jogador ativo."],
          ["Active player: 0 points.", "Jogador ativo: 0 pontos."],
          ["Other players: 2 points each (no bonus: every vote is on the active player's card).", "Outros jogadores: 2 pontos cada (sem bônus: todos os votos estão na carta do jogador ativo)."]
        ]
      },
      {
        n: 2,
        title: ["Nobody found it", "Ninguém achou"],
        lines: [
          ["No other player voted for the active player's card.", "Nenhum outro jogador votou na carta do jogador ativo."],
          ["Active player: 0 points.", "Jogador ativo: 0 pontos."],
          ["Other players: 2 points each, +1 bonus point per vote on their card.", "Outros jogadores: 2 pontos cada, +1 ponto de bônus por voto na sua carta."]
        ]
      },
      {
        n: 3,
        title: ["Some, but not all, found it", "Alguns, mas não todos, acharam"],
        lines: [
          ["At least one other player, but not all of them, voted for the active player's card.", "Pelo menos um outro jogador, mas não todos, votou na carta do jogador ativo."],
          ["Active player: 3 points.", "Jogador ativo: 3 pontos."],
          ["Each player who found it: 3 points.", "Cada jogador que achou: 3 pontos."],
          ["Every player except the active player (found it or not): +1 bonus point per vote on their card.", "Todo jogador exceto o ativo (achou ou não): +1 ponto de bônus por voto na sua carta."]
        ]
      }
    ];
  }

  function quickReference() {
    const cards = [
      infoCard(t("ONE TURN", "UM TURNO"), t("Eight steps", "Oito passos"), [
        rl("1 · Clue", "the active player picks one of their cards and says a clue for it out loud, without showing it.", "1 · Dica", "o jogador ativo escolhe uma das suas cartas e diz uma dica em voz alta, sem mostrá-la."),
        rl("2 · Hand in", `each other player secretly gives the active player ${cardsHandedIn() === 1 ? "1 card" : "2 cards"} that best fit${cardsHandedIn() === 1 ? "s" : ""} the clue, face down.`, "2 · Entregar", `cada outro jogador entrega em segredo ao jogador ativo ${cardsHandedIn() === 1 ? "1 carta" : "2 cartas"} que combine${cardsHandedIn() === 1 ? "" : "m"} com a dica, virada${cardsHandedIn() === 1 ? "" : "s"} para baixo.`),
        rl("3 · Reveal", `the active player shuffles them with their own card and lays all ${revealed()} face up on the numbered ${spacesText()}.`, "3 · Revelar", `o jogador ativo embaralha essas cartas com a sua e põe as ${revealed()} viradas para cima nos espaços numerados 1–${revealed()}.`),
        rl("4 · Vote", "everyone except the active player secretly puts one voting token face down: the number of the card they think is the active player's.", "4 · Votar", "todos exceto o jogador ativo põem em segredo uma ficha de votação virada para baixo: o número da carta que acham ser a do jogador ativo."),
        rl("5 · Show votes", "flip the tokens, place each on the card it names; the active player reveals their card (and the others say whose card each other picture is).", "5 · Mostrar votos", "virem as fichas, ponham cada uma na carta indicada; o jogador ativo revela a sua carta (e os outros dizem de quem é cada outra imagem)."),
        rl("6 · Score", "use case 1, 2 or 3 below.", "6 · Pontuar", "use o caso 1, 2 ou 3 abaixo."),
        rl("7 · Move", "move your game piece one space per point.", "7 · Mover", "avance seu peão um espaço por ponto."),
        rl("8 · Refill", `discard the used cards, refill your hand to ${handSize()}; the player on the left becomes the active player.`, "8 · Repor", `descarte as cartas usadas, complete a mão até ${handSize()}; o jogador à esquerda passa a ser o jogador ativo.`)
      ], [1, 2]),
      infoCard(t("VOTING", "VOTAÇÃO"), t("Who votes, and how", "Quem vota e como"), [
        rl("Secret", "choose and lay your token face down in front of you; nobody sees it until everyone has voted.", "Secreto", "escolha e ponha sua ficha virada para baixo à sua frente; ninguém a vê até todos votarem."),
        rl("One token", "each voter places exactly one token — the number of one card.", "Uma ficha", "cada votante põe exatamente uma ficha — o número de uma carta."),
        rl("Active player", "does not vote.", "Jogador ativo", "não vota."),
        rl("Never your own", `under no circumstances can you vote for your own card${isThree() ? " (with 3 players, for either of your 2 cards)" : ""}.`, "Nunca a sua", `em nenhuma hipótese você pode votar na sua própria carta${isThree() ? " (com 3 jogadores, em nenhuma das suas 2 cartas)" : ""}.`)
      ], [2]),
      ...scoringCases().map((item) => infoCard(t(`SCORING · CASE ${item.n}`, `PONTUAÇÃO · CASO ${item.n}`), t(item.title[0], item.title[1]), item.lines.map(([en, pt]) => t(en, pt)), 2, "dx-score-card")),
      infoCard(t("GAME END", "FIM DA PARTIDA"), t(`${WIN_SCORE} points or an empty draw pile`, `${WIN_SCORE} pontos ou pilha de compra vazia`), [
        rl("Trigger", `a player reaches ${WIN_SCORE} points, or a player draws the last card of the draw pile.`, "Gatilho", `um jogador chega a ${WIN_SCORE} pontos, ou um jogador compra a última carta da pilha de compra.`),
        rl("Winner", "the player with the most points.", "Vencedor", "o jogador com mais pontos."),
        rl("Length", `with ${players()} players the draw pile lasts at most ${maxTurns()} turns.`, "Duração", `com ${players()} jogadores a pilha de compra dura no máximo ${maxTurns()} turnos.`)
      ], 2)
    ];
    if (isThree()) {
      cards.splice(1, 0, infoCard(t("3 PLAYERS", "3 JOGADORES"), t("What changes", "O que muda"), [
        rl("Hand", "7 cards instead of 6.", "Mão", "7 cartas em vez de 6."),
        rl("Tokens", "5 voting tokens, numbered 1–5.", "Fichas", "5 fichas de votação, numeradas 1–5."),
        rl("Hand in 2", "each of the 2 other players hands in 2 cards, so 5 cards are revealed.", "Entregue 2", "cada um dos 2 outros jogadores entrega 2 cartas, então 5 cartas são reveladas."),
        rl("Unchanged", "voting and scoring rules stay the same.", "Sem mudança", "as regras de votação e pontuação continuam iguais.")
      ], 2));
    }
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), sectionIndex("quick-reference"), [1, 2])}
      <div class="callout">${t(
        "Goal: score points by finding the active player's card among the revealed pictures, by getting others to vote for your card — and, as the active player, by giving a clue that some players find but not all.",
        "Objetivo: marcar pontos achando a carta do jogador ativo entre as imagens reveladas, fazendo os outros votarem na sua carta — e, como jogador ativo, dando uma dica que alguns jogadores acertem, mas não todos."
      )} ${referenceLink(2)}</div>
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- victory ----------

  function victorySection() {
    return `
      ${sectionHeading("victory", t("Winning", "Vitória"), sectionIndex("victory"), [2])}
      <div class="quick-grid">
        <article class="info-card victory-card">
          <span class="component-label">${t("END OF THE GAME", "FIM DA PARTIDA")}</span>
          <h3>${t("Two ways the game ends", "Duas formas de a partida acabar")}</h3>
          ${lineList([
            rl("30 points", `the game ends when one of the players reaches ${WIN_SCORE} points on the score track.`, "30 pontos", `a partida acaba quando um dos jogadores chega a ${WIN_SCORE} pontos na trilha.`),
            rl("Last card", "the game also ends when a player draws the last card of the draw pile.", "Última carta", "a partida também acaba quando um jogador compra a última carta da pilha de compra."),
            rl("Winner", "the player with the most points at the end of the game wins.", "Vencedor", "vence o jogador com mais pontos no fim da partida."),
            interpretation(`points are scored only in step 6 and cards are drawn only in step 8, so finish the current turn (everyone moves their piece) and then stop. If the draw pile runs out during the refill, the game ends there even if some hands are not full. With ${players()} players: ${drawPile()} cards ÷ ${revealed()} per turn = at most ${maxTurns()} turns.`, `pontos só são marcados no passo 6 e cartas só são compradas no passo 8, então terminem o turno atual (todos movem o peão) e parem. Se a pilha de compra acabar durante a reposição, a partida acaba ali mesmo que algumas mãos não estejam completas. Com ${players()} jogadores: ${drawPile()} cartas ÷ ${revealed()} por turno = no máximo ${maxTurns()} turnos.`)
          ])}
          ${referenceLink(2)}
        </article>
        <article class="info-card victory-card">
          <span class="component-label">${t("NOT IN THE RULES", "FORA DAS REGRAS")}</span>
          <h3>${t("Past 30 and ties", "Além de 30 e empates")}</h3>
          ${lineList([
            interpretation("the score track ends at 30. Several players can pass 30 in the same turn, and “most points” decides, so keep counting: stop the piece on 30 and remember (or note) the extra points.", "a trilha de pontos acaba em 30. Vários jogadores podem passar de 30 no mesmo turno, e quem tiver “mais pontos” vence, então continuem contando: parem o peão no 30 e guardem de cabeça (ou anotem) os pontos extras."),
            interpretation("the rules give no tie-breaker: players tied for the most points share the victory.", "as regras não têm critério de desempate: jogadores empatados com mais pontos dividem a vitória.")
          ])}
          ${referenceLink(2)}
        </article>
      </div>`;
  }

  // ---------- turn ----------

  function turnSection() {
    const handedIn = cardsHandedIn();
    return `
      ${sectionHeading("turn", t("A turn, step by step", "Um turno, passo a passo"), sectionIndex("turn"), [1, 2])}
      <p class="glossary-intro">${t(
        `Each turn one player is the active player. The other ${others()} players play the same steps in a different role. ${isThree() ? "Steps 2 and 3 use the 3-player rules (2 cards each, 5 cards revealed)." : ""}`,
        `A cada turno um jogador é o jogador ativo. Os outros ${others()} jogadores fazem os mesmos passos num papel diferente. ${isThree() ? "Os passos 2 e 3 usam as regras para 3 jogadores (2 cartas cada, 5 cartas reveladas)." : ""}`
      )}</p>
      <div class="quick-grid">
        ${infoCard(t("STEP 1 · ACTIVE PLAYER", "PASSO 1 · JOGADOR ATIVO"), t("Give a clue", "Dê uma dica"), [
          t(`Look at the ${handSize()} cards in your hand and choose one.`, `Olhe as ${handSize()} cartas da sua mão e escolha uma.`),
          t("Think up a clue based on it and say it out loud. Do not show the card.", "Pense numa dica a partir dela e diga-a em voz alta. Não mostre a carta."),
          rl("Words", "one word or several words.", "Palavras", "uma ou várias palavras."),
          rl("Sounds", "a sound or a group of sounds.", "Sons", "um som ou um grupo de sons."),
          rl("Existing works", "part of a poem or song, a movie title, a proverb, etc.", "Obras existentes", "trecho de um poema ou música, título de filme, provérbio etc."),
          t("The clue can also be invented on the spot.", "A dica também pode ser inventada na hora."),
          interpretation("the scoring is the guide: a clue everyone gets, or that nobody gets, gives the active player 0 points. Aim for a clue that some players find, but not all.", "a pontuação é o guia: uma dica que todos acertam, ou que ninguém acerta, dá 0 pontos ao jogador ativo. Busque uma dica que alguns jogadores acertem, mas não todos.")
        ], 1)}
        ${infoCard(t("STEP 2 · OTHER PLAYERS", "PASSO 2 · OUTROS JOGADORES"), t(`Hand in ${handedIn === 1 ? "a card" : "2 cards"}`, `Entregue ${handedIn === 1 ? "uma carta" : "2 cartas"}`), [
          t(`From your own ${handSize()} cards, choose the ${handedIn === 1 ? "one that seems" : "2 that seem"} to best illustrate the clue.`, `Entre as suas ${handSize()} cartas, escolha ${handedIn === 1 ? "a que parece ilustrar" : "as 2 que parecem ilustrar"} melhor a dica.`),
          t(`Hand ${handedIn === 1 ? "it" : "them"} to the active player face down, without showing ${handedIn === 1 ? "it" : "them"} to anyone.`, `Entregue-${handedIn === 1 ? "a" : "as"} ao jogador ativo virada${handedIn === 1 ? "" : "s"} para baixo, sem mostrar a ninguém.`),
          t(`The active player now holds ${revealed()} cards for the reveal: their own and ${revealed() - 1} handed in.`, `O jogador ativo agora tem ${revealed()} cartas para revelar: a sua e ${revealed() - 1} entregues.`)
        ], isThree() ? [1, 2] : 1)}
        ${infoCard(t("STEP 3 · ACTIVE PLAYER", "PASSO 3 · JOGADOR ATIVO"), t("Reveal the cards", "Revele as cartas"), [
          t(`Shuffle the ${revealed() - 1} cards handed in together with your own card.`, `Embaralhe as ${revealed() - 1} cartas entregues junto com a sua.`),
          t(`Lay them out face up in random order, one per numbered space on the scoreboard: ${spacesText()}.`, `Disponha-as viradas para cima em ordem aleatória, uma por espaço numerado do tabuleiro: ${spacesText()}.`),
          t("Say nothing about which one is yours.", "Não diga nada sobre qual é a sua.")
        ], 1)}
        ${infoCard(t("STEP 4 · OTHER PLAYERS", "PASSO 4 · OUTROS JOGADORES"), t("Vote in secret", "Votem em segredo"), [
          t("Your goal: find the active player's card among those revealed.", "Seu objetivo: achar a carta do jogador ativo entre as reveladas."),
          t("Choose the voting token showing the number of the space you believe holds that card.", "Escolha a ficha de votação com o número do espaço que você acha ter essa carta."),
          t("Place it face down in front of you.", "Coloque-a virada para baixo à sua frente."),
          t("The active player does not vote.", "O jogador ativo não vota."),
          rl("Never your own", `under no circumstances can you vote for your own card${isThree() ? " — with 3 players, neither of your 2 cards" : ""}.`, "Nunca a sua", `em nenhuma hipótese você pode votar na sua própria carta${isThree() ? " — com 3 jogadores, em nenhuma das suas 2 cartas" : ""}.`)
        ], 2)}
        ${infoCard(t("STEP 5 · EVERYONE", "PASSO 5 · TODOS"), t("Reveal the votes", "Revelem os votos"), [
          t("Once everyone has voted, turn all voting tokens face up.", "Quando todos tiverem votado, virem todas as fichas de votação para cima."),
          t("Place each token on the card it designates.", "Coloquem cada ficha na carta que ela indica."),
          t("The active player then reveals which card was theirs.", "Então o jogador ativo revela qual carta era a sua."),
          interpretation("the other players then say whose card each of the rest is, so the bonus points can be counted in step 6.", "depois os outros jogadores dizem de quem é cada uma das demais cartas, para contar os pontos de bônus no passo 6.")
        ], 2)}
        ${infoCard(t("STEP 6 · EVERYONE", "PASSO 6 · TODOS"), t("Score the turn", "Pontuem o turno"), [
          t("Count how many of the other players voted for the active player's card: all of them, none of them, or some.", "Contem quantos dos outros jogadores votaram na carta do jogador ativo: todos, nenhum ou alguns."),
          t("Award points with case 1, 2 or 3 (see Scoring). The scoreboard prints the same three cases.", "Distribuam os pontos pelo caso 1, 2 ou 3 (veja Pontuação). O tabuleiro traz impressos os mesmos três casos."),
          rl("Bonus", "each player other than the active player earns 1 extra point per vote on their card (in cases 2 and 3).", "Bônus", "cada jogador que não é o ativo ganha 1 ponto extra por voto na sua carta (nos casos 2 e 3).")
        ], 2)}
        ${infoCard(t("STEP 7 · EVERYONE", "PASSO 7 · TODOS"), t("Advance on the scoreboard", "Avancem no tabuleiro"), [
          t("Each player moves their game piece forward as many spaces as the points they earned this turn.", "Cada jogador avança seu peão tantos espaços quantos pontos ganhou neste turno."),
          t(`If someone reaches ${WIN_SCORE}, everyone still moves for this turn and then the game ends (see Winning).`, `Se alguém chegar a ${WIN_SCORE}, todos ainda movem neste turno e então a partida acaba (veja Vitória).`)
        ], 2)}
        ${infoCard(t("STEP 8 · EVERYONE", "PASSO 8 · TODOS"), t("End of the turn", "Fim do turno"), [
          t(`Discard the ${revealed()} cards used this turn.`, `Descartem as ${revealed()} cartas usadas neste turno.`),
          t(`Each player draws from the draw pile to refill their hand up to ${handSize()} cards (the active player draws 1; ${isThree() ? "the others draw 2 each" : "each other player draws 1"}).`, `Cada jogador compra da pilha de compra para completar a mão até ${handSize()} cartas (o jogador ativo compra 1; ${isThree() ? "os outros compram 2 cada" : "cada outro jogador compra 1"}).`),
          interpretation("everyone takes back their voting tokens for the next vote.", "todos pegam de volta suas fichas de votação para a próxima votação."),
          t("The player on the left of the last active player becomes the new active player, and a new turn starts.", "O jogador à esquerda do último jogador ativo passa a ser o novo jogador ativo, e um novo turno começa."),
          t("If the last card of the draw pile was drawn, the game ends instead.", "Se a última carta da pilha de compra foi comprada, a partida acaba.")
        ], isThree() ? [2] : 2)}
      </div>`;
  }

  // ---------- scoring ----------

  function scoringSection() {
    return `
      ${sectionHeading("scoring", t("Scoring", "Pontuação"), sectionIndex("scoring"), [2])}
      <p class="glossary-intro">${t(
        "Look at the votes on the active player's card. Exactly one of these three cases applies; the numbers match the three scoring summaries printed on the scoreboard.",
        "Olhe os votos na carta do jogador ativo. Exatamente um destes três casos se aplica; os números correspondem aos três resumos de pontuação impressos no tabuleiro."
      )}</p>
      <div class="dx-score-grid">${scoringCases().map((item) => `
        <article class="info-card dx-score-card">
          <div class="dx-score-head"><span class="dx-case" aria-hidden="true">${item.n}</span><div><span class="component-label">${t(`CASE ${item.n}`, `CASO ${item.n}`)}</span><h3>${t(item.title[0], item.title[1])}</h3></div></div>
          ${lineList(item.lines.map(([en, pt]) => t(en, pt)))}
          ${referenceLink(2)}
        </article>`).join("")}</div>
      <div class="quick-grid">
        ${infoCard(t("BONUS POINTS", "PONTOS DE BÔNUS"), t("Votes on your card", "Votos na sua carta"), [
          t("Each player other than the active player wins as many extra points as there are votes on their card.", "Cada jogador que não é o ativo ganha tantos pontos extras quantos votos houver na sua carta."),
          t("The active player never gets bonus points.", "O jogador ativo nunca ganha pontos de bônus."),
          t("Case 1 has no bonus: every vote went to the active player's card.", "O caso 1 não tem bônus: todos os votos foram para a carta do jogador ativo."),
          isThree() ? interpretation("with 3 players, a vote on either of your 2 cards gives you +1.", "com 3 jogadores, um voto em qualquer uma das suas 2 cartas lhe dá +1.") : null
        ], 2)}
        ${infoCard(t("AT A GLANCE", "RESUMO"), t("Points per case", "Pontos por caso"), [
          rl("Active player", "case 1: 0 · case 2: 0 · case 3: 3.", "Jogador ativo", "caso 1: 0 · caso 2: 0 · caso 3: 3."),
          rl("Found the card", "case 1: 2 · case 3: 3 (+ bonus).", "Achou a carta", "caso 1: 2 · caso 3: 3 (+ bônus)."),
          rl("Did not find it", "case 2: 2 + bonus · case 3: bonus only.", "Não achou", "caso 2: 2 + bônus · caso 3: só o bônus.")
        ], 2)}
      </div>`;
  }

  // ---------- iconography ----------

  function iconsSection() {
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), sectionIndex("icons"), [1, 2])}
      <p class="glossary-intro">${t("Dixit has almost no symbols: the cards have no text. Each image below is cropped individually from the rules sheet's pictures.", "Dixit quase não tem símbolos: as cartas não têm texto. Cada imagem abaixo foi recortada individualmente das figuras da folha de regras.")}</p>
      <div class="icon-grid">
        ${iconCard("card-back", "Card back", "All 84 cards share this back. Keep cards face down (back up) whenever they must stay secret: in hand, when handed in, in the draw pile.", "Verso da carta", "As 84 cartas têm este verso. Mantenha as cartas viradas para baixo (verso para cima) sempre que precisarem ficar secretas: na mão, ao entregar, na pilha de compra.", 2)}
        ${iconCard("voting-token", "Voting token", `A coloured square with a number. Each player uses tokens 1–${tokensEach()} this match; the number is the space of the card you vote for.`, "Ficha de votação", `Um quadrado colorido com um número. Cada jogador usa as fichas 1–${tokensEach()} nesta partida; o número é o espaço da carta em que você vota.`, 2)}
        ${iconCard("numbered-space", "Numbered space", `The numbers along the edge of the scoreboard. In step 3 one revealed card goes above each number (${spacesText()}).`, "Espaço numerado", `Os números ao longo da borda do tabuleiro. No passo 3 uma carta revelada vai acima de cada número (${spacesText()}).`, 1, true)}
        ${iconCard("score-track", "Score track", "The numbered spaces where the game pieces advance, one space per point. The track ends at 30, the score that ends the game.", "Trilha de pontos", "Os espaços numerados onde os peões avançam, um espaço por ponto. A trilha acaba em 30, a pontuação que encerra a partida.", 1, true)}
        ${iconCard("scoring-summary", "Scoring summary (case 3)", "The scoreboard prints the three scoring cases, numbered 1–3, in French and English. Pictured: case 3 — at least one player, but not all, found the active player's card.", "Resumo de pontuação (caso 3)", "O tabuleiro traz impressos os três casos de pontuação, numerados de 1 a 3, em francês e inglês. Na imagem: caso 3 — pelo menos um jogador, mas não todos, achou a carta do jogador ativo.", 2, true)}
      </div>`;
  }

  // ---------- examples ----------

  function examplesSection() {
    const manualExamples = [
      {
        title: t("The clue", "A dica"),
        art: ["clue-card", t("Dan's card: two people falling upside down", "A carta de Dan: duas pessoas caindo de cabeça para baixo")],
        lines: [
          t("Dan, Ruby, Chris, Kevin and Eva play (5 players). Dan is the active player.", "Dan, Ruby, Chris, Kevin e Eva jogam (5 jogadores). Dan é o jogador ativo."),
          t("From his six cards he picks this one and says “Alice in Wonderland”.", "Das suas seis cartas ele escolhe esta e diz “Alice no País das Maravilhas”."),
          t("The card reminds him of Alice falling down the rabbit hole.", "A carta o lembra de Alice caindo na toca do coelho.")
        ],
        page: 1
      },
      {
        title: t("Choosing a card", "Escolher uma carta"),
        art: ["eva-hand", t("Eva's six cards; the rabbit card is raised", "As seis cartas de Eva; a carta do coelho está destacada")],
        lines: [
          t("Eva picks the card with the rabbit: it makes her think of the White Rabbit from Alice in Wonderland.", "Eva escolhe a carta com o coelho: ela a faz pensar no Coelho Branco de Alice no País das Maravilhas."),
          t("She hands it face down to Dan. Ruby, Chris and Kevin do the same.", "Ela a entrega virada para baixo a Dan. Ruby, Chris e Kevin fazem o mesmo.")
        ],
        page: 1
      },
      {
        title: t("Revealing the cards", "Revelar as cartas"),
        art: ["revealed-cards", t("Five cards revealed above spaces 1 to 5", "Cinco cartas reveladas sobre os espaços 1 a 5")],
        lines: [
          t("Dan shuffles his card with the 4 cards handed to him.", "Dan embaralha a sua carta com as 4 cartas entregues."),
          t("He places them on the first 5 numbered spaces of the scoreboard.", "Ele as coloca nos 5 primeiros espaços numerados do tabuleiro.")
        ],
        page: 1
      },
      {
        title: t("Voting", "Votar"),
        lines: [
          t("Eva knows card 4 (the rabbit) is not Dan's: it came from her hand — and she may not vote for it anyway.", "Eva sabe que a carta 4 (o coelho) não é de Dan: veio da mão dela — e ela nem pode votar nela."),
          t("She hesitates between cards 1, 2, 3 and 5.", "Ela hesita entre as cartas 1, 2, 3 e 5."),
          t("Card 1 reminds her most of Alice in Wonderland, so she places her token 1 face down in front of her.", "A carta 1 é a que mais a lembra de Alice no País das Maravilhas, então ela põe a ficha 1 virada para baixo à sua frente.")
        ],
        page: 2
      },
      {
        title: t("Revealing the votes", "Revelar os votos"),
        art: ["votes-revealed", t("Voting tokens on cards 1, 3 (two tokens) and 4", "Fichas de votação nas cartas 1, 3 (duas fichas) e 4")],
        lines: [
          t("Eva's token goes on card 1. Chris and Ruby voted for card 3; Kevin voted for card 4.", "A ficha de Eva vai na carta 1. Chris e Ruby votaram na carta 3; Kevin votou na carta 4."),
          t("Dan reveals that card 3 was his and explains why.", "Dan revela que a carta 3 era a dele e explica por quê."),
          t("Only Chris and Ruby found his card.", "Só Chris e Ruby acharam a carta dele.")
        ],
        page: 2
      },
      {
        title: t("Scoring the turn (case 3)", "Pontuar o turno (caso 3)"),
        lines: [
          t("2 players found the active player's card, but not all of them: case 3.", "2 jogadores acharam a carta do jogador ativo, mas não todos: caso 3."),
          rl("Dan", "3 points (active player).", "Dan", "3 pontos (jogador ativo)."),
          rl("Chris", "3 points for finding it, +1 bonus: his card 1 received Eva's vote — 4 points.", "Chris", "3 pontos por achar, +1 de bônus: a carta 1 dele recebeu o voto de Eva — 4 pontos."),
          rl("Ruby", "3 points for finding it.", "Ruby", "3 pontos por achar."),
          rl("Eva", "1 point: the bonus from Kevin's vote on her White Rabbit card.", "Eva", "1 ponto: o bônus do voto de Kevin na carta do Coelho Branco dela."),
          rl("Kevin", "0 points.", "Kevin", "0 pontos.")
        ],
        page: 2
      }
    ];
    const guideExamples = [
      {
        title: t("Case 1 and case 2 at a glance", "Casos 1 e 2 num relance"),
        lines: [
          t(`Guide's own example, ${players()} players: Ana is the active player.`, `Exemplo do próprio guia, ${players()} jogadores: Ana é a jogadora ativa.`),
          rl("Case 1", "every other player votes for Ana's card: Ana scores 0, everyone else 2.", "Caso 1", "todos os outros votam na carta de Ana: Ana marca 0, os demais 2 cada."),
          rl("Case 2", `nobody votes for Ana's card. Ana scores 0; everyone else scores 2, plus 1 per vote their card received — a player whose card drew ${others() >= 3 ? "2 votes scores 4" : "1 vote scores 3"}.`, "Caso 2", `ninguém vota na carta de Ana. Ana marca 0; os demais marcam 2, mais 1 por voto que a sua carta recebeu — quem teve ${others() >= 3 ? "2 votos marca 4" : "1 voto marca 3"}.`)
        ],
        page: 2
      }
    ];
    if (isThree()) {
      guideExamples.push({
        title: t("A 3-player turn", "Um turno com 3 jogadores"),
        lines: [
          t("Guide's own example: Ana gives the clue; Bia and Caio each hand in 2 cards; 5 cards are revealed on spaces 1–5.", "Exemplo do próprio guia: Ana dá a dica; Bia e Caio entregam 2 cartas cada; 5 cartas são reveladas nos espaços 1–5."),
          t("Bia votes for Ana's card. Caio votes for one of Bia's two cards.", "Bia vota na carta de Ana. Caio vota numa das duas cartas de Bia."),
          t("One player, but not both, found it: case 3.", "Um jogador, mas não os dois, achou: caso 3."),
          rl("Ana", "3 points.", "Ana", "3 pontos."),
          rl("Bia", "3 points + 1 bonus (Caio's vote on one of her cards) = 4.", "Bia", "3 pontos + 1 de bônus (voto de Caio numa das cartas dela) = 4."),
          rl("Caio", "0 points.", "Caio", "0 pontos.")
        ],
        page: 2
      });
    }
    const card = (example, index, sourceEn, sourcePt) => `
      <article class="example-card">
        <span class="card-number">${String(index + 1).padStart(2, "0")}</span>
        <h3>${example.title}</h3>
        ${example.art ? `<figure class="dx-example-art"><img src="${ART}${example.art[0]}.webp" alt="${example.art[1]}" loading="lazy"><figcaption>${example.art[1]}</figcaption></figure>` : ""}
        ${lineList(example.lines)}
        <div class="example-source"><span>${t(sourceEn, sourcePt)}</span>${referenceLink(example.page)}</div>
      </article>`;
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), sectionIndex("examples"), [1, 2])}
      <p class="glossary-intro">${t(
        `The rules sheet follows one 5-player turn from start to finish.${players() !== 5 ? ` Your match has ${players()} players, so ${isThree() ? "each other player hands in 2 cards and 5 cards are revealed" : `${revealed()} cards are revealed`}; everything else works the same.` : ""}`,
        `A folha de regras acompanha um turno com 5 jogadores do começo ao fim.${players() !== 5 ? ` Sua partida tem ${players()} jogadores, então ${isThree() ? "cada outro jogador entrega 2 cartas e 5 cartas são reveladas" : `${revealed()} cartas são reveladas`}; o resto funciona igual.` : ""}`
      )}</p>
      <div class="example-grid dx-example-grid">${manualExamples.map((example, index) => card(example, index, "Rulebook example", "Exemplo do manual")).join("")}${guideExamples.map((example, index) => card(example, manualExamples.length + index, "Guide's example, built from the rules", "Exemplo do guia, construído a partir das regras")).join("")}</div>`;
  }

  // ---------- glossary ----------

  function glossarySection() {
    const visible = [
      { term: ["Active player", "Jogador ativo"], text: ["The player who gives the clue this turn. Does not vote; scores 3 only in case 3.", "O jogador que dá a dica neste turno. Não vota; marca 3 só no caso 3."], page: 1 },
      { term: ["Bonus point", "Ponto de bônus"], text: ["+1 per vote on your card, for players other than the active player (cases 2 and 3).", "+1 por voto na sua carta, para os jogadores que não são o ativo (casos 2 e 3)."], page: 2 },
      { term: ["Clue", "Dica"], text: ["Words, sounds or a quotation the active player says about one of their cards.", "Palavras, sons ou uma citação que o jogador ativo diz sobre uma das suas cartas."], page: 1 },
      { term: ["Discard pile", "Pilha de descarte"], text: ["Where the cards used in a turn go at the end of it. They do not come back.", "Para onde vão as cartas usadas num turno, no fim dele. Elas não voltam."], page: 2 },
      { term: ["Draw pile", "Pilha de compra"], text: [`The face-down cards left after dealing (${drawPile()} this match). Drawing its last card ends the game.`, `As cartas viradas para baixo que sobram após a distribuição (${drawPile()} nesta partida). Comprar a última carta dela encerra a partida.`], page: 1 },
      { term: ["Found the card", "Achou a carta"], text: ["You voted for the active player's card.", "Você votou na carta do jogador ativo."], page: 2 },
      { term: ["Game piece", "Peão"], text: ["Your coloured marker on the score track.", "Seu marcador colorido na trilha de pontos."], page: 1 },
      { term: ["Hand", "Mão"], text: [`Your ${handSize()} secret cards, refilled at the end of every turn.`, `Suas ${handSize()} cartas secretas, completadas no fim de todo turno.`], page: isThree() ? 2 : 1 },
      { term: ["Numbered spaces", "Espaços numerados"], text: [`The scoreboard spaces where the cards are revealed (${spacesText()}).`, `Os espaços do tabuleiro onde as cartas são reveladas (${spacesText()}).`], page: 1 },
      { term: ["Scoreboard", "Tabuleiro de pontuação"], text: ["The board with the numbered spaces, the score track and the scoring summaries.", "O tabuleiro com os espaços numerados, a trilha de pontos e os resumos de pontuação."], page: 1 },
      { term: ["Starting space", "Espaço inicial"], text: ["Where every game piece begins.", "Onde todo peão começa."], page: 1 },
      { term: ["Voting token", "Ficha de votação"], text: [`Numbered token (1–${tokensEach()} this match) placed face down to vote in secret.`, `Ficha numerada (1–${tokensEach()} nesta partida) posta virada para baixo para votar em segredo.`], page: 1 }
    ];
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), sectionIndex("glossary"), [1, 2])}
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
    document.body.classList.add("theme-dixit");
    document.documentElement.lang = state.language;
    document.title = t("Dixit — Field Manual", "Dixit — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Dixit: 3–6 players, a match-filtered setup checklist, the eight steps of a turn, the three scoring cases and the rulebook's worked example.",
        "Regras interativas bilíngues de Dixit: 3–6 jogadores, lista de preparação filtrada pela partida, os oito passos do turno, os três casos de pontuação e o exemplo do manual."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook", "Livro interativo")}</p>
          <h1>Dixit</h1>
          <p class="hero-intro">${t(
            "One picture, one clue. Describe your card so that some players find it among the others — but not everyone — and guess which picture the storyteller had in mind.",
            "Uma imagem, uma dica. Descreva a sua carta para que alguns jogadores a encontrem entre as outras — mas não todos — e adivinhe qual imagem o narrador tinha em mente."
          )}</p>
          <div class="hero-meta"><span>${t("3–6 players", "3–6 jogadores")}</span><span>${t("About 30 min", "Cerca de 30 min")}</span><span>${t("Storytelling · guessing", "Narrativa · adivinhação")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/dixit.webp" alt="${t("Front page of the Dixit rules sheet", "Frente da folha de regras de Dixit")}" fetchpriority="high"><figcaption>${t("Rules sheet, front · art by Marie Cardouat", "Folha de regras, frente · arte de Marie Cardouat")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("Storyteller's table", "Mesa do narrador")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column dx-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied two-page English Dixit rules sheet (Libellud): page 1 is the front (contents, setup, turn steps 1–3), page 2 the back (steps 4–8, end of the game, changes for 3 players). Points marked “Guide's reading” are interpretations where the rules are silent.",
            "Este guia cobre a folha de regras de Dixit em inglês fornecida (Libellud), com duas páginas: a página 1 é a frente (conteúdo, preparação, passos 1–3 do turno) e a página 2 o verso (passos 4–8, fim da partida, mudanças para 3 jogadores). Trechos marcados como “Leitura do guia” são interpretações onde as regras são omissas."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${victorySection()}</section>
          <section class="rule-section">${turnSection()}</section>
          <section class="rule-section">${scoringSection()}</section>
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the Dixit rules sheet. Author: Jean-Louis Roubira; artwork: Marie Cardouat; design: Régis Bonnessée. Published by Libellud.",
        "Guia pessoal de consulta baseado na folha de regras de Dixit. Autor: Jean-Louis Roubira; arte: Marie Cardouat; design: Régis Bonnessée. Publicado pela Libellud."
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
      root.querySelector(".dx-page")?.prepend(notice);
    }
    notice.textContent = storageNoticeText();
  }

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !root || !root.contains(target)) {
      return;
    }
    if (target.matches("[data-players]")) {
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

  window.Dixit = { renderInto, onClick, onChange };
})();
