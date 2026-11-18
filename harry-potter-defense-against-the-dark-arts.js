(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.harry-potter-dada.v1";
  const SETUP_KEY = "field-manual.harry-potter-dada.setup.v1";
  const MANUAL_FILE = "harry-potter-defense-against-the-dark-arts_core.pdf";
  const ASSETS = "assets/harry-potter-defense-against-the-dark-arts/";
  const ICONS = `${ASSETS}icons/`;
  const ART = `${ASSETS}art/`;
  // The PDF page number equals the printed page number (cover = page 1, contents panel = page 12).
  const TRACKING = ["tokens", "immediate"];
  const STUNS_TO_WIN = 3;
  const SPACES_TO_STUN = 7; // START + 6 spaces, then the STUN space (pictured on pp. 2–3).
  const defaults = { language: "pt-BR", tracking: "tokens" };
  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------

  function normalizePreferences(saved) {
    return {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      tracking: TRACKING.includes(saved?.tracking) ? saved.tracking : defaults.tracking
    };
  }

  function signature(source = state) {
    return String(source.tracking);
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Defence Against the Dark Arts preferences.", error);
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
      console.error("Could not read Defence Against the Dark Arts setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Defence Against the Dark Arts preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Defence Against the Dark Arts setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function usesTokens() {
    return state.tracking === "tokens";
  }

  function manualUrl(page) {
    const script = document.querySelector('script[src*="harry-potter-defense-against-the-dark-arts.js"]');
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
          <p class="eyebrow">${t("PRACTICE MAT", "TAPETE DE TREINO")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="hpd-section-references">${pages.map(referenceLink).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
  }

  function glyph(name) {
    const labels = {
      attack: t("Attack", "Ataque"),
      influence: t("Influence", "Influência"),
      health: t("Health", "Vida")
    };
    return `<img class="hpd-glyph" src="${ICONS}${name}.webp" alt="${labels[name]}" title="${labels[name]}">`;
  }

  function iconCard(file, titleEn, bodyEn, titlePt, bodyPt, pages, wide = false) {
    const title = t(titleEn, titlePt);
    const list = Array.isArray(pages) ? pages : [pages];
    return `
      <article class="icon-card${wide ? " hpd-icon-wide" : ""}">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}.webp" alt="${title}"></span>
        <div><strong>${title}</strong><p>${t(bodyEn, bodyPt)}</p>${list.map(referenceLink).join(" ")}</div>
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

  function figure(file, alt) {
    return `<figure class="hpd-art"><img src="${ART}${file}.webp" alt="${alt}" loading="lazy"><figcaption>${alt}</figcaption></figure>`;
  }

  function interpretation(en, pt) {
    return `<span class="hpd-interpretation">${t("Guide's reading", "Leitura do guia")}</span> ${t(en, pt)}`;
  }

  function trackingLabel(value = state.tracking) {
    return value === "tokens"
      ? t("Attack and Health tokens", "Fichas de Ataque e Vida")
      : t("Move immediately, no tokens", "Mover na hora, sem fichas");
  }

  // ---------- header ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["victory", t("Winning", "Vitória")],
      ["turn", t("Your turn", "Seu turno")],
      ["cards", t("Cards & Houses", "Cartas e Casas")],
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
          <span class="brand-mark" aria-hidden="true">DA</span>
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
      `${readFailed ? "This browser could not read the saved match or setup progress for this game; defaults are shown. " : ""}${writeFailed ? "The latest change could not be saved and is visible on screen only." : ""}`,
      `${readFailed ? "Este navegador não conseguiu ler a partida ou o progresso da preparação salvos deste jogo; as opções padrão estão sendo mostradas. " : ""}${writeFailed ? "A alteração mais recente não pôde ser salva e aparece somente na tela." : ""}`
    ).trim();
  }

  // ---------- configuration ----------

  function choiceCard(name, value, dataAttr, checked, title, description) {
    return `
      <label class="hpd-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" ${dataAttr} ${checked ? "checked" : ""}>
        <span class="hpd-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function matchConfiguration() {
    return `
      <section class="controls-panel hpd-config" id="build-match" aria-labelledby="hpd-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="hpd-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "This game is always a duel for exactly 2 players, with no expansions, modes or variants in the rulebook. Each player's House and Starting Ally are picked at the table during setup (step 2 and step 6), so they are not stored here. The one choice the rulebook offers is how to keep track of Attack and Health: it filters the components and the rules below.",
              "Este jogo é sempre um duelo para exatamente 2 jogadores, sem expansões, modos ou variantes no livro de regras. A Casa e o Aliado Inicial de cada jogador são escolhidos à mesa durante a preparação (etapas 2 e 6), por isso não ficam salvos aqui. A única escolha que o livro oferece é como acompanhar Ataque e Vida: ela filtra os componentes e as regras abaixo."
            )}</p>
          </div>
        </div>
        <fieldset class="hpd-choice-group">
          <legend>${t("Attack & Health tracking · selected:", "Controle de Ataque e Vida · selecionado:")} <span>${trackingLabel()}</span></legend>
          <p class="hpd-choice-intro">${t(
            "The rulebook says the Attack and Health tokens are included to help keep track of these effects, but are not required, because the effects can be resolved immediately. Influence tokens are always used.",
            "O livro diz que as fichas de Ataque e Vida vêm no jogo para ajudar a controlar esses efeitos, mas não são obrigatórias, porque os efeitos podem ser resolvidos na hora. As fichas de Influência são sempre usadas."
          )} ${referenceLink(8)}</p>
          <div class="hpd-choice-grid">
            ${choiceCard("hpd-tracking", "tokens", 'data-tracking="tokens"', state.tracking === "tokens", trackingLabel("tokens"), t(
              "Take 1 Attack token or 1 Health token for each Attack or Health you gain, then spend them during your turn to slide the movers, discarding them as you do. The 8 Attack and 8 Health tokens go next to the mat; unused tokens are discarded at the end of your turn.",
              "Pegue 1 ficha de Ataque ou 1 ficha de Vida para cada Ataque ou Vida que ganhar e gaste-as durante o seu turno para deslizar os peões, descartando-as ao usar. As 8 fichas de Ataque e 8 de Vida ficam ao lado do tapete; fichas não usadas são descartadas no fim do seu turno."
            ))}
            ${choiceCard("hpd-tracking", "immediate", 'data-tracking="immediate"', state.tracking === "immediate", trackingLabel("immediate"), t(
              "Slide the movers at once, one space per Attack or Health, as soon as a card gives it. The 8 Attack and 8 Health tokens stay in the box. Same rules, fewer pieces.",
              "Deslize os peões na hora, um espaço por Ataque ou Vida, assim que uma carta o der. As 8 fichas de Ataque e 8 de Vida ficam na caixa. Mesmas regras, menos peças."
            ))}
          </div>
        </fieldset>
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function setupPhases() {
    return [
      {
        id: "mat",
        title: t("Practice Mat and token pool", "Tapete de Treino e reserva de fichas"),
        pages: [2, 3],
        items: [
          t("Place the Practice Mat lengthwise between both players. Each player owns one half: the START space next to the circle in the middle, then 6 more spaces, then the STUN space (a white star) at the edge.", "Coloque o Tapete de Treino no sentido do comprimento entre os dois jogadores. Cada jogador fica com uma metade: o espaço START (início) ao lado do círculo do meio, depois mais 6 espaços e então o espaço STUN (atordoar, uma estrela branca) na ponta."),
          t("The mat's border is labelled: CLASSROOM and LIBRARY along one long edge, HEXES and BANISHED along the other. The decks of steps 3–5 go next to these labels.", "A borda do tapete tem rótulos: CLASSROOM (Sala de Aula) e LIBRARY (Biblioteca) num lado comprido, HEXES (Azarações) e BANISHED (Banidas) no outro. Os baralhos das etapas 3–5 ficam junto a esses rótulos."),
          usesTokens()
            ? t("Put the tokens nearby as a shared pool: 14 Influence, 8 Attack, 8 Health and 5 Stun tokens.", "Ponha as fichas por perto como reserva comum: 14 de Influência, 8 de Ataque, 8 de Vida e 5 de Atordoamento (Stun).")
            : t("Put the tokens nearby as a shared pool: 14 Influence and 5 Stun tokens. Leave the 8 Attack and 8 Health tokens in the box (you chose to move immediately).", "Ponha as fichas por perto como reserva comum: 14 de Influência e 5 de Atordoamento (Stun). Deixe as 8 fichas de Ataque e 8 de Vida na caixa (vocês escolheram mover na hora).")
        ]
      },
      {
        id: "houses",
        title: t("Choose Houses", "Escolham as Casas"),
        pages: [3, 10],
        items: [
          t("Each player chooses a House: Gryffindor, Hufflepuff, Ravenclaw or Slytherin. Both players may choose the same House (there are 2 movers per House).", "Cada jogador escolhe uma Casa: Grifinória (Gryffindor), Lufa-Lufa (Hufflepuff), Corvinal (Ravenclaw) ou Sonserina (Slytherin). Os dois podem escolher a mesma Casa (há 2 peões por Casa)."),
          t("Place the oversized House card of your House in front of you. Its 3 skull spaces at the top will hold the Stun tokens you receive; its left side prints the turn summary.", "Coloque à sua frente a carta grande de Casa da sua Casa. Os 3 espaços de caveira no alto vão receber as fichas de Atordoamento que você levar; o lado esquerdo traz o resumo do turno."),
          interpretation("there is only one House card per House. If you both chose the same House, the second player takes any unused House card just to hold Stun tokens and show the turn summary; their House is still the one they chose.", "há só uma carta de Casa por Casa. Se os dois escolheram a mesma Casa, o segundo jogador pega qualquer carta de Casa não usada só para guardar as fichas de Atordoamento e mostrar o resumo do turno; a Casa dele continua sendo a escolhida."),
          t("Take a House mover of your House and place it on the START space on your side of the mat.", "Pegue um peão (House mover) da sua Casa e coloque-o no espaço START do seu lado do tapete."),
          interpretation("the box contains 2 bases: slot your mover into one so it stands, as pictured. Return the unused House cards and movers to the box.", "a caixa tem 2 bases: encaixe o seu peão numa delas para ele ficar de pé, como na figura. Devolvam à caixa as cartas de Casa e os peões não usados.")
        ]
      },
      {
        id: "sort",
        title: t("Sort the cards into four decks", "Separe as cartas em quatro baralhos"),
        pages: [4, 5, 12],
        items: [
          t("All cards have the same back, so sort them face up by what is printed on the front, pulling them out in this order:", "Todas as cartas têm o mesmo verso, então separe-as com a face para cima pelo que está impresso na frente, tirando-as nesta ordem:"),
          rl("Starting cards (24)", "marked with a STARTER ribbon: Alohomora!, Wand, Cauldron, and the Cat, Toad and Owl Allies.", "Cartas iniciais (24)", "marcadas com a faixa STARTER: Alohomora!, Wand (Varinha), Cauldron (Caldeirão) e os Aliados Cat (Gato), Toad (Sapo) e Owl (Coruja)."),
          rl("Book cards (8)", "Items named BOOKS.", "Cartas Book (8)", "Itens chamados BOOKS (Livros)."),
          rl("Hex cards (31)", "grey cards with a HEX banner.", "Cartas Hex (31)", "cartas cinzentas com a faixa HEX (Azaração)."),
          rl("Hogwarts cards (121)", "everything left after removing the three groups above: Items, Spells and Allies with a value coin.", "Cartas de Hogwarts (121)", "tudo o que sobra depois de tirar os três grupos acima: Itens, Feitiços e Aliados com moeda de valor.")
        ]
      },
      {
        id: "classroom",
        title: t("Hogwarts deck and Classroom", "Baralho de Hogwarts e Sala de Aula"),
        pages: [4],
        items: [
          t("Shuffle the 121 Hogwarts cards and place them face down as the Hogwarts deck beside the mat.", "Embaralhe as 121 cartas de Hogwarts e coloque-as viradas para baixo como baralho de Hogwarts ao lado do tapete."),
          t("Reveal the top 4 cards and place them face up in a row along the CLASSROOM side of the mat. These 4 cards are the Classroom.", "Revele as 4 cartas do topo e coloque-as viradas para cima em fila ao longo do lado CLASSROOM do tapete. Essas 4 cartas são a Sala de Aula.")
        ]
      },
      {
        id: "hex-library",
        title: t("Hex deck and Library", "Baralho de Azarações e Biblioteca"),
        pages: [4, 5],
        items: [
          t("Shuffle the 31 Hex cards and place them face down. Nobody starts with a Hex: when a card tells a player to put a Hex in their hand or discard pile, they take it from the top of this stack.", "Embaralhe as 31 cartas Hex e coloque-as viradas para baixo. Ninguém começa com Azaração: quando uma carta mandar um jogador pôr uma Hex na mão ou no descarte, ele a pega do topo desta pilha."),
          interpretation("put the Hex deck by the HEXES label, and keep the space by the BANISHED label free for banished cards.", "ponha o baralho de Azarações junto ao rótulo HEXES e deixe livre o espaço junto ao rótulo BANISHED para as cartas banidas."),
          t("Stack the 8 Book cards face up next to the mat (by the LIBRARY label) to form the Library.", "Empilhe as 8 cartas Book viradas para cima ao lado do tapete (junto ao rótulo LIBRARY) para formar a Biblioteca.")
        ]
      },
      {
        id: "decks",
        title: t("Starting decks and first hands", "Baralhos iniciais e primeiras mãos"),
        pages: [5],
        items: [
          t("Each player takes 7 Alohomora! cards, 1 Wand card and 1 Cauldron card.", "Cada jogador pega 7 cartas Alohomora!, 1 carta Wand e 1 carta Cauldron."),
          t("Each player chooses one of the three Starting Ally cards: a Cat, a Toad or an Owl. Return the other Starting Ally cards to the box.", "Cada jogador escolhe uma das três cartas de Aliado Inicial: Cat, Toad ou Owl. Devolvam à caixa as outras cartas de Aliado Inicial."),
          interpretation("the box lists 6 Starting Allies for the 3 animals, read here as 2 of each, so both players may choose the same animal.", "a caixa lista 6 Aliados Iniciais para os 3 animais, lidos aqui como 2 de cada, então os dois jogadores podem escolher o mesmo animal."),
          t("Shuffle your 10-card deck and stack it face down in front of you.", "Embaralhe o seu baralho de 10 cartas e empilhe-o virado para baixo à sua frente."),
          t("Draw 5 cards into your hand. Keep your hand to yourself.", "Compre 5 cartas para a mão. Não mostre a sua mão.")
        ]
      },
      {
        id: "first",
        title: t("First player", "Primeiro jogador"),
        pages: [11],
        items: [
          interpretation("the rulebook does not say who starts the first round: decide at random (for example, a coin toss).", "o livro não diz quem começa a primeira rodada: decidam por sorteio (por exemplo, cara ou coroa)."),
          t("From the second round on, the player who was just stunned chooses who goes first.", "Da segunda rodada em diante, o jogador que acabou de ser atordoado escolhe quem começa.")
        ]
      }
    ];
  }

  function inventory() {
    const cards = [
      infoCard(t("SHARED", "COMPARTILHADO"), t("Middle of the table", "Meio da mesa"), [
        rl("Practice Mat", "1, lengthwise between the players.", "Tapete de Treino", "1, no comprimento entre os jogadores."),
        rl("Hogwarts deck", "121 cards: 4 face up in the Classroom, 117 face down.", "Baralho de Hogwarts", "121 cartas: 4 viradas para cima na Sala de Aula, 117 viradas para baixo."),
        rl("Library", "8 Book cards, face up.", "Biblioteca", "8 cartas Book, viradas para cima."),
        rl("Hex deck", "31 Hex cards, face down.", "Baralho de Azarações", "31 cartas Hex, viradas para baixo."),
        rl("Token pool", usesTokens() ? "14 Influence, 8 Attack, 8 Health, 5 Stun." : "14 Influence, 5 Stun.", "Reserva de fichas", usesTokens() ? "14 de Influência, 8 de Ataque, 8 de Vida, 5 de Atordoamento." : "14 de Influência, 5 de Atordoamento.")
      ], [2, 3, 4, 5]),
      infoCard(t("PER PLAYER · ×2", "POR JOGADOR · ×2"), t("Your side", "Seu lado"), [
        rl("House card", "1, in front of you.", "Carta de Casa", "1, à sua frente."),
        rl("House mover", "1, in a base, on your START space.", "Peão da Casa", "1, numa base, no seu espaço START."),
        rl("Deck", "10 cards: 7 Alohomora!, 1 Wand, 1 Cauldron, 1 Starting Ally of your choice (Cat, Toad or Owl).", "Baralho", "10 cartas: 7 Alohomora!, 1 Wand, 1 Cauldron, 1 Aliado Inicial à sua escolha (Cat, Toad ou Owl)."),
        rl("Hand", "5 cards drawn from your deck.", "Mão", "5 cartas compradas do seu baralho.")
      ], [3, 5]),
      infoCard(t("IN THE BOX", "NA CAIXA"), t("Not used this match", "Não usado nesta partida"), [
        t("2 House cards and 6 House movers.", "2 cartas de Casa e 6 peões."),
        t("The 4 Starting Ally cards nobody chose.", "As 4 cartas de Aliado Inicial que ninguém escolheu."),
        usesTokens() ? null : t("8 Attack and 8 Health tokens.", "8 fichas de Ataque e 8 de Vida."),
        t("Box total: 24 Starting cards (14 Spells, 4 Items, 6 Allies), 31 Hexes, 129 Hogwarts cards counting the 8 Books.", "Total da caixa: 24 cartas iniciais (14 Feitiços, 4 Itens, 6 Aliados), 31 Azarações, 129 cartas de Hogwarts contando os 8 Books.")
      ], [12])
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
        <label class="hpd-setup-check" for="hpd-setup-${phase.id}">
          <input id="hpd-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="hpd-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="hpd-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), sectionIndex("setup"), [2, 3, 4, 5])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Set up this duel", "Prepare este duelo")} · ${trackingLabel()}</h3>
            <p>${t("One checkbox per coherent step; setup is done once per game (later rounds use the quick reset in Winning).", "Uma caixa por etapa coerente; a preparação é feita uma vez por partida (as rodadas seguintes usam o recomeço rápido em Vitória).")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved separately from the match configuration and language. Changing the Attack & Health tracking clears this checklist; changing the language does not. “Uncheck all” clears only these setup boxes.",
          "O progresso é salvo separadamente da configuração da partida e do idioma. Trocar o controle de Ataque e Vida limpa esta lista; trocar o idioma não. “Desmarcar tudo” limpa somente as caixas da preparação."
        )}</p>
      </div>
      <div class="hpd-art-row">
        ${figure("classroom-setup", t("Rulebook p. 4: the Hogwarts deck, the 4 Classroom cards and the movers on their START spaces", "Livro p. 4: o baralho de Hogwarts, as 4 cartas da Sala de Aula e os peões nos espaços START"))}
        ${figure("starting-deck", t("Rulebook p. 5: a starting deck — Alohomora!, Cauldron, Alohomora!, the Cat and another Alohomora! drawn as a first hand", "Livro p. 5: um baralho inicial — Alohomora!, Cauldron, Alohomora!, o Cat e outro Alohomora! comprados como primeira mão"))}
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}`;
  }

  // ---------- quick reference ----------

  function moveLines() {
    return [
      rl("Attack", `slide your opponent's mover 1 space back toward the edge (the STUN space) per ${glyph("attack")}.`, "Ataque", `deslize o peão do adversário 1 espaço para trás, rumo à ponta (o espaço STUN), por ${glyph("attack")}.`),
      rl("Health", `slide your own mover 1 space forward toward the centre per ${glyph("health")}. Never past your START space.`, "Vida", `deslize o seu peão 1 espaço para a frente, rumo ao centro, por ${glyph("health")}. Nunca além do seu espaço START.`),
      usesTokens()
        ? rl("Tokens", "take a token for each Attack or Health gained; discard tokens as you spend them.", "Fichas", "pegue uma ficha por Ataque ou Vida ganho; descarte as fichas ao gastá-las.")
        : rl("No tokens", "move at once, as soon as a card gives Attack or Health.", "Sem fichas", "mova na hora, assim que uma carta der Ataque ou Vida.")
    ];
  }

  function quickReference() {
    const cards = [
      infoCard(t("YOUR TURN", "SEU TURNO"), t("Three steps (printed on your House card)", "Três passos (impressos na sua carta de Casa)"), [
        rl("1 · Hexes", "resolve every Hex in your hand first.", "1 · Azarações", "resolva primeiro toda Hex que estiver na sua mão."),
        rl("2 · Play", `play cards in any order to gain and use ${glyph("influence")} ${glyph("attack")} ${glyph("health")} and draw cards; use your Allies in play (each ability as printed, usually once per turn).`, "2 · Jogar", `jogue cartas em qualquer ordem para ganhar e usar ${glyph("influence")} ${glyph("attack")} ${glyph("health")} e comprar cartas; use os seus Aliados em jogo (cada habilidade como impressa, em geral uma vez por turno).`),
        rl("3 · End", "played Items, Spells and Hexes to your discard pile; Allies stay; discard unused tokens; draw 5.", "3 · Encerrar", "Itens, Feitiços e Azarações jogados para o seu descarte; Aliados ficam; descarte fichas não usadas; compre 5.")
      ], [2, 7, 11]),
      infoCard(t("ATTACK & HEALTH", "ATAQUE E VIDA"), t("Moving on the mat", "Movendo no tapete"), [
        ...moveLines(),
        rl("Stun", `land your opponent on their STUN space (${SPACES_TO_STUN} Attack from START) and you win the round.`, "Atordoar", `leve o adversário até o espaço STUN dele (${SPACES_TO_STUN} Ataques a partir do START) e você vence a rodada.`)
      ], [8, 11]),
      infoCard(t("INFLUENCE", "INFLUÊNCIA"), t("Acquiring cards", "Adquirindo cartas"), [
        rl("Gain", `take 1 Influence token from the pool per ${glyph("influence")} a card gives you.`, "Ganhar", `pegue 1 ficha de Influência da reserva por ${glyph("influence")} que uma carta lhe der.`),
        rl("Cost", `pay the card's value in ${glyph("influence")}, returning those tokens to the pool.`, "Custo", `pague o valor da carta em ${glyph("influence")}, devolvendo essas fichas à reserva.`),
        rl("Where from", "the 4 Classroom cards or the Library (Books).", "De onde", "as 4 cartas da Sala de Aula ou a Biblioteca (Books)."),
        rl("Goes to", "your discard pile, unless the card says otherwise.", "Vai para", "o seu descarte, salvo se a carta disser outra coisa."),
        rl("Refill", "replace a Classroom card at once from the Hogwarts deck; you may keep buying with what is left.", "Repor", "reponha a carta da Sala de Aula na hora com o baralho de Hogwarts; você pode continuar comprando com o que sobrar."),
        rl("Books", "the Library is finite (8); Books are never banished.", "Books", "a Biblioteca é finita (8); Books nunca são banidos.")
      ], [5, 9]),
      infoCard(t("HEXES", "AZARAÇÕES"), t("Bad cards from your opponent", "Cartas ruins do adversário"), [
        rl("Gaining", "a card tells you to take the top Hex into your hand or discard pile.", "Ganhar", "uma carta manda você pegar a Hex do topo para a mão ou para o descarte."),
        rl("First", "resolve Hexes in hand before anything else on your turn.", "Primeiro", "resolva as Azarações da mão antes de tudo no seu turno."),
        rl("Drawn later", "a Hex drawn during your turn is resolved immediately.", "Compradas depois", "uma Hex comprada durante o turno é resolvida na hora."),
        rl("Discarding", "a Hex cannot be discarded unless the effect says “at random”.", "Descartar", "uma Hex não pode ser descartada, salvo se o efeito disser “ao acaso” (at random)."),
        rl("Banishing", "not on the turn it is resolved (it is set aside, not in hand nor discard).", "Banir", "não no turno em que é resolvida (ela fica separada, nem na mão nem no descarte).")
      ], [4, 7]),
      infoCard(t("HOUSE EFFECTS", "EFEITOS DE CASA"), t("The bottom line of a crested card", "A linha de baixo de uma carta com brasão"), [
        rl("Always", "you get the main effect of every card you play.", "Sempre", "você recebe o efeito principal de toda carta que joga."),
        rl("Bonus", "also get the House effect if the card's crest is your House, or you have an Ally in play with that crest.", "Bônus", "receba também o efeito de Casa se o brasão da carta for a sua Casa, ou se você tiver em jogo um Aliado com esse brasão.")
      ], [6, 10]),
      infoCard(t("BANISHING", "BANIR"), t("Removing cards from the game", "Remover cartas do jogo"), [
        rl("What", "take the card from where the effect says (hand, discard pile or Classroom) and place it face up by BANISHED.", "O quê", "pegue a carta do lugar indicado pelo efeito (mão, descarte ou Sala de Aula) e ponha-a virada para cima junto a BANISHED."),
        rl("Usually optional", "most banish effects are “may”.", "Geralmente opcional", "a maioria dos efeitos de banir é “pode”."),
        rl("Classroom", "refill the gap at once from the Hogwarts deck.", "Sala de Aula", "preencha a vaga na hora com o baralho de Hogwarts.")
      ], [10]),
      infoCard(t("ROUND & GAME", "RODADA E PARTIDA"), t(`Stun your opponent ${STUNS_TO_WIN} times`, `Atordoe o adversário ${STUNS_TO_WIN} vezes`), [
        rl("Stunned", "the stunned player puts a Stun token on an open skull space of their House card.", "Atordoado", "o jogador atordoado põe uma ficha de Atordoamento num espaço de caveira livre da sua carta de Casa."),
        rl("Finish", "the attacker may still play and acquire cards to finish the turn.", "Terminar", "quem atacou ainda pode jogar e adquirir cartas para terminar o turno."),
        rl("Reset", "each player shuffles all their cards into a new deck; movers to START; draw 5.", "Recomeço", "cada jogador embaralha todas as suas cartas num baralho novo; peões ao START; comprem 5."),
        rl("Next start", "the stunned player chooses who goes first.", "Quem começa", "o jogador atordoado escolhe quem começa."),
        rl("Win", `the first player to stun their opponent ${STUNS_TO_WIN} times.`, "Vitória", `o primeiro a atordoar o adversário ${STUNS_TO_WIN} vezes.`)
      ], [11])
    ];
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), sectionIndex("quick-reference"), [1, 11])}
      <div class="callout">${t(
        `Goal: a competitive deck-builder for 2. Play the cards in your hand to Attack your opponent and push their House mover onto their STUN space; buy better cards with Influence. The first player to stun the other ${STUNS_TO_WIN} times wins.`,
        `Objetivo: um construtor de baralho competitivo para 2. Jogue as cartas da mão para Atacar o adversário e empurrar o peão dele até o espaço STUN; compre cartas melhores com Influência. O primeiro a atordoar o outro ${STUNS_TO_WIN} vezes vence.`
      )} ${referenceLink(1)}</div>
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- victory ----------

  function victorySection() {
    return `
      ${sectionHeading("victory", t("Winning", "Vitória"), sectionIndex("victory"), [1, 11])}
      <div class="quick-grid">
        <article class="info-card victory-card">
          <span class="component-label">${t("A ROUND", "UMA RODADA")}</span>
          <h3>${t("Stunning a player", "Atordoar um jogador")}</h3>
          ${lineList([
            t("If you slide your opponent's mover onto their STUN space, you win this round.", "Se você deslizar o peão do adversário até o espaço STUN dele, você vence esta rodada."),
            t("Your opponent takes a Stun token and places it on an open space of their House card.", "O adversário pega uma ficha de Atordoamento e a coloca num espaço livre da sua carta de Casa."),
            t("You may still continue to play and acquire cards to finish your turn.", "Você ainda pode continuar jogando e adquirindo cartas para terminar o seu turno."),
            interpretation("the STUN space is the last space: Attack beyond it is lost. A player who is already on START gains nothing from Health.", "o espaço STUN é o último: Ataque além dele é perdido. Quem já está no START não ganha nada com Vida.")
          ])}
          ${referenceLink(8)} ${referenceLink(11)}
        </article>
        <article class="info-card victory-card">
          <span class="component-label">${t("BETWEEN ROUNDS", "ENTRE RODADAS")}</span>
          <h3>${t("Reset for the next round", "Recomeço para a próxima rodada")}</h3>
          ${lineList([
            t("Each player shuffles all their cards together — Allies in play, hand, deck and discard pile — into a fresh deck that includes every card acquired in previous rounds.", "Cada jogador embaralha todas as suas cartas juntas — Aliados em jogo, mão, baralho e descarte — num baralho novo que inclui todas as cartas adquiridas nas rodadas anteriores."),
            t("Both players return their movers to the START space on their side.", "Os dois jogadores devolvem os peões ao espaço START do seu lado."),
            t("Each player draws a hand of 5 cards.", "Cada jogador compra uma mão de 5 cartas."),
            t("The player who was stunned chooses who goes first in the next round.", "O jogador que foi atordoado escolhe quem começa a próxima rodada."),
            interpretation("finish the stunning turn (except the final draw, which the reshuffle replaces), then reset. Stun tokens stay on the House cards. The Classroom, the Library, the Hex deck and the banished cards stay as they are; Hexes in a player's cards are shuffled in like any other card, and unused tokens return to the pool (including Influence saved on an Owl).", "terminem o turno do atordoamento (menos a compra final, que o reembaralhamento substitui) e então recomecem. As fichas de Atordoamento ficam nas cartas de Casa. A Sala de Aula, a Biblioteca, o baralho de Azarações e as cartas banidas continuam como estão; Azarações entre as cartas de um jogador são embaralhadas como qualquer outra carta, e fichas não usadas voltam à reserva (inclusive Influência guardada numa Owl).")
          ])}
          ${referenceLink(11)}
        </article>
        <article class="info-card victory-card">
          <span class="component-label">${t("END OF GAME", "FIM DA PARTIDA")}</span>
          <h3>${t(`First to ${STUNS_TO_WIN} stuns`, `Primeiro a ${STUNS_TO_WIN} atordoamentos`)}</h3>
          ${lineList([
            t("Play continues until a player has received their third Stun token.", "O jogo continua até um jogador receber a sua terceira ficha de Atordoamento."),
            t(`The player who stunned their opponent ${STUNS_TO_WIN} times wins. There are no points and no ties.`, `Vence o jogador que atordoou o adversário ${STUNS_TO_WIN} vezes. Não há pontos nem empates.`),
            t("A game lasts 3 to 5 rounds (the box has 5 Stun tokens: at most 2 + 3).", "Uma partida dura de 3 a 5 rodadas (a caixa tem 5 fichas de Atordoamento: no máximo 2 + 3).")
          ])}
          ${referenceLink(1)} ${referenceLink(11)}
        </article>
      </div>
      <div class="hpd-art-row">${figure("stunned", t("Rulebook p. 11: the Gryffindor mover reached its STUN space, so its player puts a Stun token on the House card", "Livro p. 11: o peão da Grifinória chegou ao espaço STUN, então o seu jogador põe uma ficha de Atordoamento na carta de Casa"))}</div>`;
  }

  // ---------- turn ----------

  function turnSection() {
    return `
      ${sectionHeading("turn", t("Your turn", "Seu turno"), sectionIndex("turn"), [7, 8, 9, 11])}
      <p class="glossary-intro">${t(
        "Players alternate turns. On your turn you play the cards in your hand to generate effects. The three steps below are also printed on your House card.",
        "Os jogadores alternam turnos. No seu turno você joga as cartas da mão para gerar efeitos. Os três passos abaixo também estão impressos na sua carta de Casa."
      )}</p>
      <div class="quick-grid">
        ${infoCard(t("STEP 1", "PASSO 1"), t("Resolve Hex cards", "Resolva as cartas Hex"), [
          t("Neither player starts with Hexes; they arrive through the effects of some Hogwarts cards, which tell a player to take the top card of the Hex deck into their hand or discard pile.", "Nenhum jogador começa com Azarações; elas chegam pelos efeitos de algumas cartas de Hogwarts, que mandam um jogador pegar a carta do topo do baralho de Azarações para a mão ou o descarte."),
          t("If you have one or more Hexes in hand, resolve them first, before playing any other card. Each Hex's effect is printed on it (for example Confundus!: “You cannot gain more than 1 Attack this turn”).", "Se você tiver uma ou mais Azarações na mão, resolva-as primeiro, antes de jogar qualquer outra carta. O efeito de cada Hex está impresso nela (por exemplo Confundus!: “Você não pode ganhar mais de 1 Ataque neste turno”)."),
          t("If you draw a Hex later in the turn, resolve it immediately.", "Se comprar uma Hex mais tarde no turno, resolva-a na hora."),
          t("Resolved Hexes are set aside with your other played cards and go to your discard pile at the end of the turn.", "As Azarações resolvidas ficam separadas junto com as outras cartas jogadas e vão para o seu descarte no fim do turno."),
          rl("Note", "a Hex cannot be discarded when you are told to discard a card, unless the effect says to discard at random. A Hex cannot be banished on the turn it is resolved: it is no longer in your hand and not yet in your discard pile.", "Nota", "uma Hex não pode ser descartada quando mandam você descartar uma carta, salvo se o efeito disser para descartar ao acaso. Uma Hex não pode ser banida no turno em que é resolvida: ela já não está na mão e ainda não está no descarte.")
        ], [4, 7])}
        ${infoCard(t("STEP 2", "PASSO 2"), t("Play cards to generate effects", "Jogue cartas para gerar efeitos"), [
          rl("Spells and Items", `generate their effect immediately — usually gaining ${glyph("attack")} ${glyph("influence")} ${glyph("health")} or drawing cards. Set each one aside to show it was played.`, "Feitiços e Itens", `geram o efeito na hora — em geral ganhar ${glyph("attack")} ${glyph("influence")} ${glyph("health")} ou comprar cartas. Separe cada um para mostrar que foi jogado.`),
          rl("Allies", "place the card in front of you. Its ability can be used on each of your turns, including this one, and it is not discarded at the end of the turn.", "Aliados", "coloque a carta à sua frente. A habilidade pode ser usada em cada um dos seus turnos, inclusive neste, e ela não é descartada no fim do turno."),
          rl("Choose one", "when a card says “Choose one”, pick one of its options.", "Escolha um", "quando a carta diz “Choose one” (escolha um), escolha uma das opções."),
          rl("House effects", "a crested Item or Spell adds its bottom effect when it matches your House or one of your Allies in play (see Cards & Houses).", "Efeitos de Casa", "um Item ou Feitiço com brasão soma o efeito de baixo quando combina com a sua Casa ou com um Aliado seu em jogo (veja Cartas e Casas)."),
          interpretation("play your cards one at a time, in any order you like; spend Attack, Health and Influence whenever you want during this step (the rulebook's example interleaves them).", "jogue as cartas uma de cada vez, na ordem que quiser; gaste Ataque, Vida e Influência quando quiser durante este passo (o exemplo do livro intercala tudo).")
        ], [7, 8])}
        ${infoCard(t("STEP 2 · ATTACK & HEALTH", "PASSO 2 · ATAQUE E VIDA"), t("Slide the movers", "Deslize os peões"), [
          ...moveLines(),
          t(`From START, ${SPACES_TO_STUN} Attack put a player on their STUN space; landing there stuns them (see Winning).`, `A partir do START, ${SPACES_TO_STUN} Ataques levam um jogador ao espaço STUN; parar lá o atordoa (veja Vitória).`),
          usesTokens() ? interpretation("there are 8 Attack and 8 Health tokens; if you gain more, slide the extra spaces at once.", "há 8 fichas de Ataque e 8 de Vida; se ganhar mais, deslize os espaços extras na hora.") : null
        ], [8])}
        ${infoCard(t("STEP 2 · INFLUENCE", "PASSO 2 · INFLUÊNCIA"), t("Acquire new cards", "Adquira cartas novas"), [
          t(`Take 1 Influence token from the pool for each ${glyph("influence")} you gain.`, `Pegue 1 ficha de Influência da reserva para cada ${glyph("influence")} que ganhar.`),
          t(`Spend ${glyph("influence")} equal to a card's value (return the tokens to the pool) to acquire one of the face-up cards of the Classroom or the Library.`, `Gaste ${glyph("influence")} igual ao valor de uma carta (devolva as fichas à reserva) para adquirir uma das cartas viradas para cima da Sala de Aula ou da Biblioteca.`),
          t("Place acquired cards in your discard pile, unless the card directs otherwise.", "Coloque as cartas adquiridas no seu descarte, salvo se a carta disser outra coisa."),
          t("Immediately replace a card taken from the Classroom with the top card of the Hogwarts deck. You can spend part of your Influence, see the new card, and keep acquiring.", "Reponha na hora a carta tirada da Sala de Aula com a carta do topo do baralho de Hogwarts. Você pode gastar parte da Influência, ver a carta nova e continuar adquirindo."),
          t("The Library has a finite stack of Book cards (8). Books can be acquired whenever you could acquire from the Classroom.", "A Biblioteca tem uma pilha finita de cartas Book (8). Books podem ser adquiridos sempre que você puder adquirir da Sala de Aula."),
          interpretation("if the Hogwarts deck ever runs out, the empty Classroom spaces stay empty; if the Hex deck runs out, no Hex is taken; when the Library is empty, no Book can be acquired; if a token pool runs out, keep counting the rest in your head. The rulebook does not cover these cases.", "se o baralho de Hogwarts acabar, as vagas da Sala de Aula ficam vazias; se o baralho de Azarações acabar, nenhuma Hex é pega; com a Biblioteca vazia, nenhum Book pode ser adquirido; se as fichas de uma reserva acabarem, contem o resto de cabeça. O livro não cobre esses casos.")
        ], [9])}
        ${infoCard(t("STEP 3", "PASSO 3"), t("End your turn", "Encerre o turno"), [
          rl("1 · Discard", "place all Item, Spell and Hex cards in your discard pile. You cannot save these cards for your next turn.", "1 · Descartar", "coloque todas as cartas de Item, Feitiço e Hex no seu descarte. Você não pode guardar essas cartas para o próximo turno."),
          rl("2 · Allies stay", "leave all Ally cards in play on your side; use them on each of your following turns.", "2 · Aliados ficam", "deixe todas as cartas de Aliado em jogo do seu lado; use-as em cada um dos seus turnos seguintes."),
          rl("3 · Tokens", "discard any unused tokens to the pool.", "3 · Fichas", "descarte para a reserva as fichas não usadas."),
          rl("4 · Draw 5", "draw five new cards. Shuffle your discard pile into a new deck only when you need to draw and your deck is empty.", "4 · Comprar 5", "compre cinco cartas novas. Embaralhe o descarte num novo baralho só quando precisar comprar e o baralho estiver vazio."),
          interpretation("cards still in your hand also go to the discard pile (you cannot save cards); an Ally you did not play is discarded too, since only Allies in play stay.", "cartas que ficaram na mão também vão para o descarte (não dá para guardar cartas); um Aliado que você não jogou também é descartado, pois só Aliados em jogo ficam.")
        ], [11])}
      </div>
      <div class="hpd-art-row">${figure("house-card", t("The House card's turn summary: 1. Resolve any Hexes · 2. Play cards to generate effects · 3. End your turn", "O resumo do turno na carta de Casa: 1. Resolva as Azarações · 2. Jogue cartas para gerar efeitos · 3. Encerre o turno"))}</div>`;
  }

  // ---------- cards & houses ----------

  function cardsSection() {
    return `
      ${sectionHeading("cards", t("Cards & Houses", "Cartas e Casas"), sectionIndex("cards"), [5, 6, 10])}
      <div class="quick-grid">
        ${infoCard(t("ALLY CARDS", "CARTAS DE ALIADO"), t("Reading an Ally", "Lendo um Aliado"), [
          rl("1 · House identifier", "crest in the top-left corner, only on some Allies (for game balance not all are tagged).", "1 · Identificador de Casa", "brasão no canto superior esquerdo, só em alguns Aliados (por equilíbrio, nem todos têm)."),
          rl("2 · Name", "the Ally's name.", "2 · Nome", "o nome do Aliado."),
          rl("3 · Ability", "a recurring effect gained on each of your turns while the Ally is in play on your side (often “Once per turn”).", "3 · Habilidade", "um efeito recorrente ganho em cada um dos seus turnos enquanto o Aliado está em jogo do seu lado (muitas vezes “Once per turn”, uma vez por turno)."),
          rl("4 · Value", `the ${glyph("influence")} you must spend to acquire it.`, "4 · Valor", `a ${glyph("influence")} que você precisa gastar para adquiri-lo.`)
        ], [6])}
        ${infoCard(t("ITEM & SPELL CARDS", "CARTAS DE ITEM E FEITIÇO"), t("Reading an Item or Spell", "Lendo um Item ou Feitiço"), [
          rl("1 · Card type", "ITEM or SPELL; some effects refer to these types (the Cat counts Spells).", "1 · Tipo", "ITEM ou SPELL (Feitiço); alguns efeitos citam esses tipos (o Cat conta Feitiços)."),
          rl("2 · Name", "the card's name.", "2 · Nome", "o nome da carta."),
          rl("3 · Card effect", "gained when you play the card.", "3 · Efeito", "ganho quando você joga a carta."),
          rl("4 · House effect", "the extra bottom line, gained if the crest matches your chosen House or one of your Allies in play.", "4 · Efeito de Casa", "a linha extra de baixo, ganha se o brasão combinar com a Casa escolhida ou com um Aliado seu em jogo."),
          rl("5 · Value", `the ${glyph("influence")} you must spend to acquire it.`, "5 · Valor", `a ${glyph("influence")} que você precisa gastar para adquiri-lo.`)
        ], [6])}
        ${infoCard(t("HOUSE EFFECTS", "EFEITOS DE CASA"), t("Which crests count for you", "Quais brasões valem para você"), [
          t("Allies, Items and Spells can be colour-coded with a House crest in the top-left corner.", "Aliados, Itens e Feitiços podem ter a cor e o brasão de uma Casa no canto superior esquerdo."),
          t("The House you chose at the start lets you gain the additional effects of Items and Spells of your House.", "A Casa escolhida no início permite ganhar os efeitos adicionais dos Itens e Feitiços da sua Casa."),
          t("To gain the additional effects of another House's cards, you need an Ally in play with that House identifier.", "Para ganhar os efeitos adicionais das cartas de outra Casa, você precisa de um Aliado em jogo com o identificador dessa Casa."),
          t("You ALWAYS get the first effect of a crested Item or Spell; the bottom effect is the bonus.", "Você SEMPRE recebe o primeiro efeito de um Item ou Feitiço com brasão; o efeito de baixo é o bônus."),
          interpretation("if that Ally leaves play (for example an opponent's Sleeping Draught makes you discard it), its House no longer counts for you.", "se esse Aliado sair de jogo (por exemplo, o Sleeping Draught do adversário faz você descartá-lo), a Casa dele deixa de valer para você.")
        ], [10])}
        ${infoCard(t("STARTING CARDS", "CARTAS INICIAIS"), t("What your first deck does", "O que o seu primeiro baralho faz"), [
          rl("Alohomora! ×7", `Spell: gain 1 ${glyph("influence")}.`, "Alohomora! ×7", `Feitiço: ganhe 1 ${glyph("influence")}.`),
          rl("Wand", `Item: gain 1 ${glyph("attack")}.`, "Wand", `Item: ganhe 1 ${glyph("attack")}.`),
          rl("Cauldron", `Item: choose one — gain 1 ${glyph("influence")} or gain 1 ${glyph("health")}.`, "Cauldron", `Item: escolha um — ganhe 1 ${glyph("influence")} ou ganhe 1 ${glyph("health")}.`),
          rl("Cat", `Ally: once per turn, if you played at least three Spells, gain 1 ${glyph("attack")}.`, "Cat", `Aliado: uma vez por turno, se você jogou pelo menos três Feitiços, ganhe 1 ${glyph("attack")}.`),
          rl("Owl", `Ally: once per turn, choose one — save 1 ${glyph("influence")} on this Ally, or remove all saved ${glyph("influence")} to use this turn.`, "Owl", `Aliado: uma vez por turno, escolha um — guarde 1 ${glyph("influence")} neste Aliado, ou retire toda a ${glyph("influence")} guardada para usar neste turno.`),
          rl("Toad", "Ally: its text is not shown in the rulebook — read the card.", "Toad", "Aliado: o texto não aparece no livro — leia a carta.")
        ], [5])}
        ${infoCard(t("BOOKS", "BOOKS (LIVROS)"), t("The Library", "A Biblioteca"), [
          t(`8 identical Items, value 3: choose one — gain 2 ${glyph("influence")}, or draw a card and return this card to the Library.`, `8 Itens iguais, valor 3: escolha um — ganhe 2 ${glyph("influence")}, ou compre uma carta e devolva esta carta à Biblioteca.`),
          t("Book cards cannot be banished; they are always returned to the Library.", "Cartas Book não podem ser banidas; elas sempre voltam à Biblioteca."),
          interpretation("if you choose “draw a card and return this card to the Library”, put the Book back on the Library stack right away instead of setting it aside; it does not go to your discard pile.", "se você escolher “compre uma carta e devolva esta carta à Biblioteca”, ponha o Book de volta na pilha da Biblioteca na hora, em vez de separá-lo; ele não vai para o seu descarte.")
        ], [5, 9])}
        ${infoCard(t("BANISHING", "BANIR"), t("Thinning decks and the Classroom", "Enxugando baralhos e a Sala de Aula"), [
          t("Banishing removes cards from the game. In most cases it is optional.", "Banir remove cartas do jogo. Na maioria dos casos é opcional."),
          t("Take the card from the location the effect names (a player's hand, discard pile, or the Classroom) and place it face up next to the BANISHED section of the mat.", "Pegue a carta do lugar que o efeito indica (mão ou descarte de um jogador, ou a Sala de Aula) e ponha-a virada para cima junto à seção BANISHED do tapete."),
          t("Use it to get rid of Hexes and weaker Starting cards.", "Use isso para se livrar de Azarações e de cartas iniciais mais fracas."),
          t("A card banished from the Classroom is immediately replaced with the top card of the Hogwarts deck.", "Uma carta banida da Sala de Aula é reposta na hora com a carta do topo do baralho de Hogwarts.")
        ], [10])}
      </div>
      <div class="hpd-art-row">
        ${figure("ally-anatomy", t("Rulebook p. 6: Ally card — 1 House identifier, 2 name, 3 ability, 4 value", "Livro p. 6: carta de Aliado — 1 identificador de Casa, 2 nome, 3 habilidade, 4 valor"))}
        ${figure("item-anatomy", t("Rulebook p. 6: Item card — 1 type, 2 name, 3 effect, 4 House effect, 5 value", "Livro p. 6: carta de Item — 1 tipo, 2 nome, 3 efeito, 4 efeito de Casa, 5 valor"))}
      </div>`;
  }

  // ---------- iconography ----------

  function iconsSection() {
    const icons = [
      iconCard("attack", "Attack", "On cards: each one slides your opponent's mover 1 space back toward their STUN space.", "Ataque", "Nas cartas: cada um desliza o peão do adversário 1 espaço para trás, rumo ao espaço STUN dele.", [7, 8]),
      iconCard("health", "Health", "On cards: each one slides your mover 1 space forward toward the centre, never past START.", "Vida", "Nas cartas: cada uma desliza o seu peão 1 espaço para a frente, rumo ao centro, nunca além do START.", [7, 8]),
      iconCard("influence", "Influence", "On cards: spend it to acquire cards from the Classroom or Library. Also shown on the value coin.", "Influência", "Nas cartas: gaste-a para adquirir cartas da Sala de Aula ou da Biblioteca. Também aparece na moeda de valor.", [7, 9]),
      usesTokens() ? iconCard("attack-token", "Attack token (8)", "Optional tracker: take one per Attack gained, discard it when you slide the opponent's mover.", "Ficha de Ataque (8)", "Marcador opcional: pegue uma por Ataque ganho, descarte-a ao deslizar o peão do adversário.", [2, 8]) : null,
      usesTokens() ? iconCard("health-token", "Health token (8)", "Optional tracker: take one per Health gained, discard it when you slide your mover.", "Ficha de Vida (8)", "Marcador opcional: pegue uma por Vida ganha, descarte-a ao deslizar o seu peão.", [3, 8]) : null,
      iconCard("influence-token", "Influence token (14)", "Tracks Influence gained this turn; unused tokens are discarded at the end of your turn (the Owl can save them).", "Ficha de Influência (14)", "Marca a Influência ganha no turno; fichas não usadas são descartadas no fim do turno (a Owl pode guardá-las).", [3, 11]),
      iconCard("stun-token", "Stun token (5)", "Taken by a player who is stunned and placed on their House card. The third one ends the game.", "Ficha de Atordoamento (5)", "Pega pelo jogador atordoado e posta na carta de Casa dele. A terceira encerra a partida.", [3, 11]),
      iconCard("stun-slots", "Stun spaces on the House card", "The 3 skull spaces at the top of each House card hold that player's Stun tokens.", "Espaços de Atordoamento na carta de Casa", "Os 3 espaços de caveira no alto de cada carta de Casa recebem as fichas de Atordoamento daquele jogador.", [2, 11], true),
      iconCard("stun-space", "STUN space", "The star at each end of the Practice Mat. A mover slid onto it is stunned.", "Espaço STUN", "A estrela em cada ponta do Tapete de Treino. Um peão empurrado até ela fica atordoado.", [2, 11]),
      iconCard("value", "Value", "The coin in the bottom-right corner: the Influence needed to acquire the card.", "Valor", "A moeda no canto inferior direito: a Influência necessária para adquirir a carta.", [6]),
      iconCard("house-effect", "House effect", "The coloured bottom line of a crested Item or Spell: the bonus you gain when the House matches.", "Efeito de Casa", "A linha colorida de baixo de um Item ou Feitiço com brasão: o bônus ganho quando a Casa combina.", [6, 10], true),
      iconCard("gryffindor", "Gryffindor crest", "House identifier (red). Matches a Gryffindor player or an Ally with this crest.", "Brasão da Grifinória", "Identificador de Casa (vermelho). Combina com um jogador da Grifinória ou um Aliado com este brasão.", [3, 6]),
      iconCard("hufflepuff", "Hufflepuff crest", "House identifier (yellow). Matches a Hufflepuff player or an Ally with this crest.", "Brasão da Lufa-Lufa", "Identificador de Casa (amarelo). Combina com um jogador da Lufa-Lufa ou um Aliado com este brasão.", [10]),
      iconCard("ravenclaw", "Ravenclaw crest", "House identifier (blue). Matches a Ravenclaw player or an Ally with this crest.", "Brasão da Corvinal", "Identificador de Casa (azul). Combina com um jogador da Corvinal ou um Aliado com este brasão.", [2, 10]),
      iconCard("slytherin", "Slytherin crest", "House identifier (green), as on Severus Snape. Matches a Slytherin player or an Ally with this crest.", "Brasão da Sonserina", "Identificador de Casa (verde), como em Severus Snape. Combina com um jogador da Sonserina ou um Aliado com este brasão.", [8, 9])
    ];
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), sectionIndex("icons"), [2, 3, 6, 7])}
      <p class="glossary-intro">${t("Each image is cropped individually from the rulebook's pictures.", "Cada imagem foi recortada individualmente das figuras do livro de regras.")}</p>
      <div class="icon-grid">${icons.filter(Boolean).join("")}</div>`;
  }

  // ---------- examples ----------

  function examplesSection() {
    const manualExamples = [
      {
        title: t("A full turn (Gryffindor player)", "Um turno completo (jogador da Grifinória)"),
        art: ["attack-example", t("Rulebook p. 8: 3 Attack slide the Ravenclaw mover back three spaces; the Sleeping Draught is banished and the Chocolate Frog acquired", "Livro p. 8: 3 Ataques empurram o peão da Corvinal três espaços para trás; o Sleeping Draught é banido e o Chocolate Frog adquirido")],
        lines: [
          t("Your hand: Cauldron, Severus Snape, Bombarda! and two Alohomora!. You are Gryffindor and on your START space.", "Sua mão: Cauldron, Severus Snape, Bombarda! e dois Alohomora!. Você é da Grifinória e está no seu espaço START."),
          rl("1", "place the Severus Snape Ally in front of you. It stays for the rest of this round and lets you use Slytherin House effects as well as Gryffindor ones.", "1", "coloque o Aliado Severus Snape à sua frente. Ele fica pelo resto desta rodada e permite usar os efeitos de Casa da Sonserina além dos da Grifinória."),
          rl("2", "gain 2 Attack from Snape and 1 from Bombarda!; use all 3 to slide your opponent back three spaces.", "2", "ganhe 2 Ataques de Snape e 1 de Bombarda!; use os 3 para empurrar o adversário três espaços para trás."),
          rl("3", "Bombarda! also lets you banish a Classroom card: banish the Sleeping Draught (and refill the Classroom).", "3", "Bombarda! também permite banir uma carta da Sala de Aula: use-o para banir o Sleeping Draught (e reponha a Sala de Aula)."),
          rl("4", "gain 2 Influence from the Alohomora! cards. You are on START, so Health would do nothing: the Cauldron gives 1 more Influence. Spend the 3 to acquire the Chocolate Frog into your discard pile.", "4", "ganhe 2 de Influência dos Alohomora!. Você está no START, então Vida não serviria: o Cauldron dá mais 1 de Influência. Gaste as 3 para adquirir o Chocolate Frog para o seu descarte.")
        ],
        pages: [8, 9],
        extraArt: ["example-hand", t("Rulebook p. 9: the hand of this example, the 2 Attack tokens from Snape and the 3 Influence tokens", "Livro p. 9: a mão deste exemplo, as 2 fichas de Ataque de Snape e as 3 fichas de Influência")]
      },
      {
        title: t("House effect through an Ally", "Efeito de Casa por meio de um Aliado"),
        art: ["house-effect-example", t("Rulebook p. 10: Hufflepuff House card, Cho Chang (Ravenclaw Ally) and the Crystal Ball (Ravenclaw Item)", "Livro p. 10: carta de Casa da Lufa-Lufa, Cho Chang (Aliada da Corvinal) e a Crystal Ball (Item da Corvinal)")],
        lines: [
          t("A Hufflepuff player has the Ravenclaw Ally Cho Chang in play and plays the Ravenclaw Crystal Ball.", "Um jogador da Lufa-Lufa tem a Aliada Cho Chang, da Corvinal, em jogo e joga a Crystal Ball, da Corvinal."),
          t("Main effect: draw a card, then discard any one card.", "Efeito principal: compre uma carta e depois descarte uma carta qualquer."),
          t("Because Cho Chang is a Ravenclaw Ally, they also gain the Ravenclaw effect: 2 Influence.", "Como Cho Chang é Aliada da Corvinal, ele também ganha o efeito da Corvinal: 2 de Influência.")
        ],
        pages: [10]
      },
      {
        title: t("Resolving a Hex", "Resolver uma Azaração"),
        art: ["hex-card", t("Rulebook p. 7: the Confundus! Hex — “You cannot gain more than 1 Attack this turn”", "Livro p. 7: a Hex Confundus! — “Você não pode ganhar mais de 1 Ataque neste turno”")],
        lines: [
          t("You start your turn with Confundus! in hand. Resolve it before anything else: this turn you cannot gain more than 1 Attack.", "Você começa o turno com Confundus! na mão. Resolva-a antes de tudo: neste turno você não pode ganhar mais de 1 Ataque."),
          t("Set it aside with your played cards; it goes to your discard pile at the end of the turn.", "Separe-a com as cartas jogadas; ela vai para o seu descarte no fim do turno."),
          t("You cannot banish it this turn. On a later turn, a banish effect that reaches your discard pile can remove it.", "Você não pode bani-la neste turno. Num turno posterior, um efeito de banir que alcance o seu descarte pode removê-la.")
        ],
        pages: [7, 10]
      }
    ];
    const guideExamples = [
      {
        title: t("Health, START and a stun", "Vida, START e um atordoamento"),
        lines: [
          t("Guide's own example. Bia's mover is 2 spaces away from her START, toward her STUN space. She gains 3 Health: she slides 2 spaces forward onto START and the third Health is lost.", "Exemplo do próprio guia. O peão de Bia está a 2 espaços do START dela, rumo ao espaço STUN. Ela ganha 3 de Vida: desliza 2 espaços para a frente até o START e a terceira Vida é perdida."),
          t("On his next turn Caio gains 4 Attack, then 3 more from an Ally: Bia's mover slides 7 spaces from START, so it lands on her STUN space.", "No turno seguinte Caio ganha 4 Ataques e depois mais 3 de um Aliado: o peão de Bia desliza 7 espaços a partir do START e para no espaço STUN dela."),
          t("Bia puts a Stun token on her House card. Caio may still buy cards with his Influence, then both reset and Bia chooses who starts the next round.", "Bia põe uma ficha de Atordoamento na carta de Casa. Caio ainda pode comprar cartas com a Influência dele; depois os dois recomeçam e Bia escolhe quem inicia a próxima rodada.")
        ],
        pages: [8, 11]
      }
    ];
    const card = (example, index, sourceEn, sourcePt) => `
      <article class="example-card">
        <span class="card-number">${String(index + 1).padStart(2, "0")}</span>
        <h3>${example.title}</h3>
        ${example.art ? figure(example.art[0], example.art[1]) : ""}
        ${lineList(example.lines)}
        ${example.extraArt ? figure(example.extraArt[0], example.extraArt[1]) : ""}
        <div class="example-source"><span>${t(sourceEn, sourcePt)}</span>${example.pages.map(referenceLink).join(" ")}</div>
      </article>`;
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), sectionIndex("examples"), [7, 8, 10])}
      <p class="glossary-intro">${t(
        usesTokens() ? "The rulebook's examples use the Attack and Influence tokens, as in your match." : "The rulebook's examples show Attack tokens; in your match you simply slide the mover at once.",
        usesTokens() ? "Os exemplos do livro usam as fichas de Ataque e Influência, como na sua partida." : "Os exemplos do livro mostram fichas de Ataque; na sua partida você apenas desliza o peão na hora."
      )}</p>
      <div class="example-grid hpd-example-grid">${manualExamples.map((example, index) => card(example, index, "Rulebook example", "Exemplo do manual")).join("")}${guideExamples.map((example, index) => card(example, manualExamples.length + index, "Guide's example, built from the rules", "Exemplo do guia, construído a partir das regras")).join("")}</div>`;
  }

  // ---------- glossary ----------

  function glossarySection() {
    const visible = [
      { term: ["Acquire", "Adquirir"], text: ["Spend Influence equal to a card's value to take it from the Classroom or Library into your discard pile.", "Gastar Influência igual ao valor de uma carta para levá-la da Sala de Aula ou Biblioteca ao seu descarte."], page: 9 },
      { term: ["Ally", "Aliado"], text: ["Card placed in front of you; its ability works on each of your turns and it is not discarded at the end of the turn.", "Carta posta à sua frente; a habilidade funciona em cada um dos seus turnos e ela não é descartada no fim do turno."], page: 7 },
      { term: ["Attack", "Ataque"], text: ["Slides the opponent's mover 1 space toward their STUN space.", "Desliza o peão do adversário 1 espaço rumo ao espaço STUN dele."], page: 8 },
      { term: ["Banish", "Banir"], text: ["Remove a card from the game, face up by the BANISHED label. Books cannot be banished.", "Remover uma carta do jogo, virada para cima junto ao rótulo BANISHED. Books não podem ser banidos."], page: 10 },
      { term: ["Book", "Book (Livro)"], text: ["One of the 8 Library Items, always available to acquire; returns to the Library instead of being banished.", "Um dos 8 Itens da Biblioteca, sempre disponível para adquirir; volta à Biblioteca em vez de ser banido."], page: 5 },
      { term: ["Classroom", "Sala de Aula"], text: ["The 4 face-up Hogwarts cards you can acquire; refilled at once from the Hogwarts deck.", "As 4 cartas de Hogwarts viradas para cima que podem ser adquiridas; repostas na hora com o baralho de Hogwarts."], page: 4 },
      { term: ["Discard pile", "Descarte"], text: ["Your face-up pile of played and acquired cards; shuffled into a new deck only when you must draw from an empty deck.", "Sua pilha de cartas jogadas e adquiridas; embaralhada num baralho novo só quando você precisa comprar de um baralho vazio."], page: 11 },
      { term: ["Health", "Vida"], text: ["Slides your mover 1 space toward the centre, never past START.", "Desliza o seu peão 1 espaço rumo ao centro, nunca além do START."], page: 8 },
      { term: ["Hex", "Hex (Azaração)"], text: ["A harmful card from the Hex deck that an opponent's card makes you take; resolved first on your turn.", "Uma carta ruim do baralho de Azarações que uma carta do adversário faz você pegar; resolvida primeiro no seu turno."], page: 7 },
      { term: ["Hogwarts cards", "Cartas de Hogwarts"], text: ["The 121 Items, Spells and Allies of the main deck that feed the Classroom.", "Os 121 Itens, Feitiços e Aliados do baralho principal, que abastecem a Sala de Aula."], page: 4 },
      { term: ["House", "Casa"], text: ["Gryffindor, Hufflepuff, Ravenclaw or Slytherin, chosen at setup; it unlocks the House effects of matching Items and Spells.", "Grifinória, Lufa-Lufa, Corvinal ou Sonserina, escolhida na preparação; libera os efeitos de Casa de Itens e Feitiços correspondentes."], page: 10 },
      { term: ["House identifier", "Identificador de Casa"], text: ["The crest in a card's top-left corner. On an Ally in play, it unlocks that House's effects for you.", "O brasão no canto superior esquerdo de uma carta. Num Aliado em jogo, libera para você os efeitos daquela Casa."], page: 6 },
      { term: ["House mover", "Peão da Casa"], text: ["Your piece on the Practice Mat; starts each round on START.", "Sua peça no Tapete de Treino; começa cada rodada no START."], page: 3 },
      { term: ["Influence", "Influência"], text: ["Currency for acquiring cards; unused Influence is lost at the end of the turn (except Influence saved on an Owl).", "Moeda para adquirir cartas; Influência não usada se perde no fim do turno (exceto a guardada numa Owl)."], page: 9 },
      { term: ["Item", "Item"], text: ["A card type: generates its effect when played, then is discarded at the end of the turn.", "Um tipo de carta: gera o efeito quando jogada e é descartada no fim do turno."], page: 6 },
      { term: ["Library", "Biblioteca"], text: ["The face-up stack of 8 Book cards.", "A pilha de 8 cartas Book virada para cima."], page: 5 },
      { term: ["Practice Mat", "Tapete de Treino"], text: ["The board with both players' tracks of spaces, from START to STUN.", "O tabuleiro com as trilhas de espaços dos dois jogadores, do START ao STUN."], page: 2 },
      { term: ["Round", "Rodada"], text: ["Play until one player is stunned; then everyone reshuffles and starts again from START.", "Joguem até um jogador ser atordoado; então todos reembaralham e recomeçam do START."], page: 11 },
      { term: ["Spell", "Feitiço (Spell)"], text: ["A card type, like Item; the Cat Ally counts Spells played.", "Um tipo de carta, como Item; o Aliado Cat conta os Feitiços jogados."], page: 6 },
      { term: ["START space", "Espaço START"], text: ["Your space next to the middle of the mat; Health cannot move you past it.", "Seu espaço junto ao meio do tapete; a Vida não leva você além dele."], page: 8 },
      { term: ["Starting cards", "Cartas iniciais"], text: ["The 10-card deck each player begins with: 7 Alohomora!, Wand, Cauldron and one Starting Ally.", "O baralho de 10 cartas com que cada jogador começa: 7 Alohomora!, Wand, Cauldron e um Aliado Inicial."], page: 5 },
      { term: ["Stun", "Atordoar"], text: [`Push the opponent's mover onto their STUN space: they take a Stun token. ${STUNS_TO_WIN} stuns win.`, `Empurrar o peão do adversário até o espaço STUN dele: ele pega uma ficha de Atordoamento. ${STUNS_TO_WIN} atordoamentos vencem.`], page: 11 }
    ];
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), sectionIndex("glossary"), [6, 10])}
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
    document.body.classList.add("theme-hp-dada");
    document.documentElement.lang = state.language;
    document.title = t("Harry Potter: Defence Against the Dark Arts — Field Manual", "Harry Potter: Defesa Contra as Artes das Trevas — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Harry Potter: Hogwarts Battle – Defence Against the Dark Arts: a 2-player duel deck-builder with a filtered setup checklist, turn steps, House effects, Hexes and the rulebook examples.",
        "Regras interativas bilíngues de Harry Potter: Hogwarts Battle – Defence Against the Dark Arts: duelo de construção de baralho para 2 jogadores com lista de preparação filtrada, passos do turno, efeitos de Casa, Azarações e os exemplos do manual."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook", "Livro interativo")}</p>
          <h1>Harry Potter: Hogwarts Battle – Defence Against the Dark Arts</h1>
          <p class="hero-intro">${t(
            "Practical lessons under the teachers' eyes: cast Spells and Hexes, use Items and gain Allies to stun your opponent — three times — while protecting yourself.",
            "Aulas práticas sob o olhar dos professores: lance Feitiços e Azarações, use Itens e conquiste Aliados para atordoar o adversário — três vezes — enquanto se protege."
          )}</p>
          <div class="hero-meta"><span>${t("2 players", "2 jogadores")}</span><span>${t("Ages 11+", "11+ anos")}</span><span>${t("Duel · deck-building", "Duelo · construção de baralho")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/harry-potter-defense-against-the-dark-arts.webp" alt="${t("Cover of the Defence Against the Dark Arts rulebook", "Capa do livro de regras de Defence Against the Dark Arts")}" fetchpriority="high"><figcaption>${t("Rulebook cover · USAopoly", "Capa do livro de regras · USAopoly")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("Practice Mat", "Tapete de Treino")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column hpd-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied 12-page English rulebook (USAopoly, 2019). PDF page numbers match the printed ones. Card names stay in English, as printed on the cards. Most Hogwarts, Ally and Hex effects are printed only on the cards: read them there. Points marked “Guide's reading” are interpretations where the rulebook is silent.",
            "Este guia cobre o livro de regras em inglês fornecido, de 12 páginas (USAopoly, 2019). Os números de página do PDF correspondem aos impressos. Os nomes das cartas ficam em inglês, como impressos nelas. A maioria dos efeitos de cartas de Hogwarts, Aliados e Azarações está impressa só nas cartas: leia-os lá. Trechos marcados como “Leitura do guia” são interpretações onde o livro é omisso."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${victorySection()}</section>
          <section class="rule-section">${turnSection()}</section>
          <section class="rule-section">${cardsSection()}</section>
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the Harry Potter: Hogwarts Battle – Defence Against the Dark Arts rulebook. Game design by Kami Mandell; designed, developed and published by USAopoly. Harry Potter characters, names and related indicia are © & ™ Warner Bros. Entertainment Inc.",
        "Guia pessoal de consulta baseado no livro de regras de Harry Potter: Hogwarts Battle – Defence Against the Dark Arts. Design do jogo de Kami Mandell; criado, desenvolvido e publicado pela USAopoly. Personagens, nomes e marcas relacionadas de Harry Potter são © & ™ Warner Bros. Entertainment Inc."
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
      root.querySelector(".hpd-page")?.prepend(notice);
    }
    notice.textContent = storageNoticeText();
  }

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !root || !root.contains(target)) {
      return;
    }
    if (target.matches("[data-tracking]")) {
      const value = target.dataset.tracking;
      if (TRACKING.includes(value) && value !== state.tracking) {
        const before = signature();
        state = normalizePreferences({ ...state, tracking: value });
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

  window.HarryPotterDada = { renderInto, onClick, onChange };
})();
