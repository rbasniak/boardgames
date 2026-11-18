(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.patchwork.v1";
  const SETUP_KEY = "field-manual.patchwork.setup.v1";
  const MANUAL_FILE = "patchwork_core.pdf";
  const ASSETS = "assets/patchwork/";
  const ICONS = `${ASSETS}icons/`;
  const ART = `${ASSETS}art/`;
  // The supplied rulebook is the Patchwork Valentine Edition rules sheet. The PDF has two very wide pages:
  // PDF 1 = Setup, Playing the Game, Action A and Action B steps 1–4;
  // PDF 2 = Action B step 5, The Time Board, The Special Tile, End of the Game, Scoring, credits,
  //         the title panel with the introduction and the Components list.
  // Every link and "p." reference in this guide uses the PDF page number.
  // The rulebook has no expansions, variants or player-count options: the match is always the same
  // 2-player game, so the setup signature is constant and only "Uncheck all" clears the checklist.
  const MATCH_SIGNATURE = "valentine-2p";
  const defaults = { language: "pt-BR" };
  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------

  function normalizePreferences(saved) {
    return { language: saved?.language === "en-US" ? "en-US" : "pt-BR" };
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Patchwork preferences.", error);
      return normalizePreferences(defaults);
    }
  }

  function loadSetup() {
    try {
      const raw = localStorage.getItem(SETUP_KEY);
      if (!raw) {
        return { signature: MATCH_SIGNATURE, checks: [] };
      }
      const saved = JSON.parse(raw);
      const valid = phaseIds();
      return {
        signature: MATCH_SIGNATURE,
        checks: saved?.signature === MATCH_SIGNATURE && Array.isArray(saved.checks)
          ? [...new Set(saved.checks.filter((id) => valid.includes(id)))]
          : []
      };
    } catch (error) {
      storageIssues.add("setup-read");
      console.error("Could not read Patchwork setup progress.", error);
      return { signature: MATCH_SIGNATURE, checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Patchwork preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Patchwork setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function manualUrl(page) {
    const script = document.querySelector('script[src*="patchwork.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${MANUAL_FILE}`, baseUrl).href}#page=${page}`;
  }

  function referenceLink(page) {
    return `<a class="source-link" href="${manualUrl(page)}" target="_blank" rel="noreferrer">${t(`Rules PDF p. ${page} ↗`, `Regras PDF p. ${page} ↗`)}</a>`;
  }

  function sectionHeading(id, title, index, pages) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("BOX OF CHOCOLATES", "CAIXA DE BOMBONS")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="pw-section-references">${pages.map(referenceLink).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
  }

  function glyphLabel(name) {
    return {
      cost: t("Praline cost symbol on a banderole", "Símbolo de custo em pralinês na faixa"),
      time: t("Hourglass time symbol on a banderole", "Símbolo de tempo (ampulheta) na faixa"),
      praline: t("Praline symbol on the time board", "Símbolo de pralinê no tabuleiro de tempo"),
      "piece-praline": t("Praline symbol on a chocolate piece", "Símbolo de pralinê numa peça de chocolate"),
      "petit-four": t("Petit four space on the time board", "Espaço de petit four no tabuleiro de tempo"),
      "petit-four-tile": t("Petit four tile", "Peça de petit four"),
      "heart-white": t("White heart token", "Marcador de coração branco"),
      "heart-red": t("Red heart token", "Marcador de coração vermelho"),
      "neutral-token": t("Neutral token", "Marcador neutro"),
      "special-tile": t("Special tile (7×7)", "Peça especial (7×7)"),
      "chit-1": t("1 Praline chit", "Ficha de 1 pralinê"),
      "chit-5": t("5 Pralines chit", "Ficha de 5 pralinês"),
      "chit-10": t("10 Pralines chit", "Ficha de 10 pralinês"),
      "chit-20": t("20 Pralines chit", "Ficha de 20 pralinês"),
      "time-board": t("Time board", "Tabuleiro de tempo"),
      "box-board": t("Box board", "Tabuleiro da caixa")
    }[name] || name;
  }

  function glyph(name) {
    const label = glyphLabel(name);
    return `<img class="pw-glyph" src="${ICONS}${name}.webp" alt="${label}" title="${label}">`;
  }

  function iconCard(file, bodyEn, bodyPt, pages) {
    const title = glyphLabel(file);
    const list = Array.isArray(pages) ? pages : [pages];
    return `
      <article class="icon-card">
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
    return `<figure class="pw-art"><img src="${ART}${file}.webp" alt="${alt}" loading="lazy"><figcaption>${alt}</figcaption></figure>`;
  }

  function interpretation(en, pt) {
    return `<span class="pw-interpretation">${t("Guide's reading", "Leitura do guia")}</span> ${t(en, pt)}`;
  }

  // ---------- header ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["victory", t("End & scoring", "Fim e pontuação")],
      ["turns", t("Turns & actions", "Turnos e ações")],
      ["time-board", t("Time board & bonuses", "Tabuleiro de tempo e bônus")],
      ["icons", t("Iconography", "Iconografia")],
      ["examples", t("Examples", "Exemplos")],
      ["faq", t("Guide's readings", "Leituras do guia")],
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
          <span class="brand-mark" aria-hidden="true">PW</span>
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
      `${readFailed ? "This browser could not read the saved language or setup progress for this game; defaults are shown. " : ""}${writeFailed ? "The latest change could not be saved and is visible on screen only." : ""}`,
      `${readFailed ? "Este navegador não conseguiu ler o idioma ou o progresso da preparação salvos deste jogo; as opções padrão estão sendo mostradas. " : ""}${writeFailed ? "A alteração mais recente não pôde ser salva e aparece somente na tela." : ""}`
    ).trim();
  }

  // ---------- configuration ----------

  function matchConfiguration() {
    return `
      <section class="controls-panel pw-config" id="build-match" aria-labelledby="pw-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="pw-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "Nothing to choose: the supplied Patchwork Valentine Edition rulebook describes a single game for exactly 2 players, with no expansions, variants, optional rules or modes. Every match uses the same setup and rules, so this guide shows all of them.",
              "Nada a escolher: o livro de regras fornecido, Patchwork Valentine Edition, descreve um único jogo para exatamente 2 jogadores, sem expansões, variantes, regras opcionais nem modos. Toda partida usa a mesma preparação e as mesmas regras, por isso este guia mostra tudo."
            )}</p>
          </div>
        </div>
        <div class="pw-fixed-match" role="status">
          <span class="pw-fixed-label">${t("This match", "Esta partida")}</span>
          <ul class="card-lines">
            <li>${rl("Players", "2 (one red heart, one white heart).", "Jogadores", "2 (um coração vermelho, um coração branco).")}</li>
            <li>${rl("Expansions / variants", "none in the rulebook.", "Expansões / variantes", "nenhuma no livro de regras.")}</li>
            <li>${rl("Colours", "who takes the red or white heart is decided at the table; it changes nothing, so it is not stored here.", "Cores", "quem fica com o coração vermelho ou branco é decidido à mesa; não muda nada, por isso não fica salvo aqui.")}</li>
          </ul>
          ${referenceLink(1)} ${referenceLink(2)}
        </div>
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function setupPhases() {
    return [
      {
        id: "table",
        title: t("Time board and the circle of chocolate pieces", "Tabuleiro de tempo e o círculo de peças de chocolate"),
        pages: [1],
        items: [
          t(`Place the time board ${glyph("time-board")} in the centre of the table.`, `Coloque o tabuleiro de tempo ${glyph("time-board")} no centro da mesa.`),
          t("Place all 33 chocolate pieces in a circle around the time board.", "Coloque as 33 peças de chocolate em círculo em volta do tabuleiro de tempo."),
          interpretation("the rulebook does not say in which order; mix the pieces so the circle is in random order.", "o livro não diz em que ordem; misture as peças para que o círculo fique em ordem aleatória."),
          t(`Find the smallest piece (the 1×2 piece, two squares). Place the neutral token ${glyph("neutral-token")} in the circle between this piece and the next piece clockwise.`, `Encontre a menor peça (a peça 1×2, de dois quadrados). Coloque o marcador neutro ${glyph("neutral-token")} no círculo entre essa peça e a peça seguinte em sentido horário.`)
        ],
        art: ["setup", t("Rules PDF p. 1: the setup picture — time board in the centre, pieces in a circle, neutral token after the 1×2 piece, special tile aside, petits fours on the marked spaces", "Regras PDF p. 1: a figura da preparação — tabuleiro de tempo no centro, peças em círculo, marcador neutro depois da peça 1×2, peça especial ao lado, petits fours nos espaços marcados")]
      },
      {
        id: "bonuses",
        title: t("Petits fours and the special tile", "Petits fours e a peça especial"),
        pages: [1, 2],
        items: [
          t(`Place the 5 petits fours ${glyph("petit-four-tile")} on the 5 marked spaces of the time board — the spaces showing the petit four symbol ${glyph("petit-four")}.`, `Coloque os 5 petits fours ${glyph("petit-four-tile")} nos 5 espaços marcados do tabuleiro de tempo — os espaços que mostram o símbolo de petit four ${glyph("petit-four")}.`),
          t(`Set the special tile ${glyph("special-tile")} (marked 7×7 and 7) aside, next to the time board. The first player to fill a 7×7 square on their box board will take it.`, `Deixe a peça especial ${glyph("special-tile")} (marcada 7×7 e 7) de lado, junto ao tabuleiro de tempo. O primeiro jogador a preencher um quadrado 7×7 no seu tabuleiro da caixa vai pegá-la.`)
        ]
      },
      {
        id: "players",
        title: t("Each player's box and pralines", "A caixa e os pralinês de cada jogador"),
        pages: [1, 2],
        items: [
          t(`Each player takes 1 box board ${glyph("box-board")} (empty grid side up) and 1 heart token: one player red ${glyph("heart-red")}, the other white ${glyph("heart-white")}.`, `Cada jogador pega 1 tabuleiro da caixa ${glyph("box-board")} (lado da grade vazia para cima) e 1 marcador de coração: um jogador o vermelho ${glyph("heart-red")}, o outro o branco ${glyph("heart-white")}.`),
          t(`Each player takes 5 pralines as money: five “1 praline” chits ${glyph("chit-1")}.`, `Cada jogador pega 5 pralinês como dinheiro: cinco fichas de “1 pralinê” ${glyph("chit-1")}.`),
          t(`Keep all remaining praline chits on the table within reach as the supply: the rest of the 32 “1” chits plus 12 “5” ${glyph("chit-5")}, 5 “10” ${glyph("chit-10")} and 1 “20” ${glyph("chit-20")}.`, `Deixe todas as outras fichas de pralinê na mesa, ao alcance, como reserva: o resto das 32 fichas de “1” mais 12 de “5” ${glyph("chit-5")}, 5 de “10” ${glyph("chit-10")} e 1 de “20” ${glyph("chit-20")}.`),
          interpretation("the 5, 10 and 20 chits are only change; swap chits with the supply whenever you need to pay or count.", "as fichas de 5, 10 e 20 servem só de troco; troque fichas com a reserva sempre que precisar pagar ou contar.")
        ]
      },
      {
        id: "start",
        title: t("Starting space and first player", "Espaço inicial e primeiro jogador"),
        pages: [1],
        items: [
          t("The player who most recently ate a chocolate goes first.", "O jogador que comeu um chocolate mais recentemente começa."),
          t("Both players place their heart tokens on the starting space of the time board.", "Os dois jogadores colocam seus marcadores de coração no espaço inicial do tabuleiro de tempo."),
          interpretation("in the setup picture the starting space is the bottom-left corner of the outer ring, next to the PATCHWORK logo; the track then spirals inward to the large red heart-covered centre, the last space.", "na figura da preparação o espaço inicial é o canto inferior esquerdo do anel externo, junto ao logotipo PATCHWORK; a trilha então faz uma espiral para dentro até o grande centro vermelho coberto de corações, o último espaço."),
          interpretation("stack the first player's heart on top: on a shared space the heart on top always plays first.", "empilhe o coração do primeiro jogador por cima: num espaço compartilhado, o coração de cima sempre joga primeiro."),
          t("You are now ready to play.", "Agora vocês estão prontos para jogar.")
        ]
      }
    ];
  }

  function inventory() {
    const cards = [
      infoCard(t("SHARED", "COMPARTILHADO"), t("Centre of the table", "Centro da mesa"), [
        rl("Time board", "1, in the centre; both hearts on the starting space.", "Tabuleiro de tempo", "1, no centro; os dois corações no espaço inicial."),
        rl("Chocolate pieces", "33, in a circle around the time board.", "Peças de chocolate", "33, em círculo em volta do tabuleiro de tempo."),
        rl("Neutral token", "1, in the circle just after the 1×2 piece (clockwise).", "Marcador neutro", "1, no círculo logo depois da peça 1×2 (sentido horário)."),
        rl("Petits fours", "5, on the 5 marked time-board spaces.", "Petits fours", "5, nos 5 espaços marcados do tabuleiro de tempo."),
        rl("Special tile", "1, aside (7 points).", "Peça especial", "1, de lado (7 pontos).")
      ], [1, 2]),
      infoCard(t("PER PLAYER · ×2", "POR JOGADOR · ×2"), t("Your area", "Sua área"), [
        rl("Box board", "1, empty.", "Tabuleiro da caixa", "1, vazio."),
        rl("Heart token", "1 (red or white), on the starting space.", "Marcador de coração", "1 (vermelho ou branco), no espaço inicial."),
        rl("Pralines", "5 (five 1-praline chits).", "Pralinês", "5 (cinco fichas de 1 pralinê).")
      ], [1]),
      infoCard(t("SUPPLY", "RESERVA"), t("Praline chits", "Fichas de pralinê"), [
        `${glyph("chit-1")} ${t("32 × “1 Praline” (10 of them start with the players)", "32 × “1 pralinê” (10 delas começam com os jogadores)")}`,
        `${glyph("chit-5")} ${t("12 × “5 Pralines”", "12 × “5 pralinês”")}`,
        `${glyph("chit-10")} ${t("5 × “10 Pralines”", "5 × “10 pralinês”")}`,
        `${glyph("chit-20")} ${t("1 × “20 Pralines”", "1 × “20 pralinês”")}`
      ], [2])
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
        <label class="pw-setup-check" for="pw-setup-${phase.id}">
          <input id="pw-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="pw-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="pw-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
        ${phase.art ? `<div class="pw-art-row">${figure(phase.art[0], phase.art[1])}</div>` : ""}
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), sectionIndex("setup"), [1, 2])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Prepare the box of chocolates", "Prepare a caixa de bombons")} · ${t("2 players", "2 jogadores")}</h3>
            <p>${t("One checkbox per coherent step. The rulebook numbers 8 setup bubbles; they are grouped here into 4 steps.", "Uma caixa por etapa coerente. O livro numera 8 balões de preparação; aqui eles estão agrupados em 4 etapas.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved separately from the language. Changing the language does not clear it; “Uncheck all” clears only these setup boxes. This game has no match options, so nothing else resets the list.",
          "O progresso é salvo separadamente do idioma. Trocar o idioma não o limpa; “Desmarcar tudo” limpa somente estas caixas da preparação. Este jogo não tem opções de partida, então nada mais reinicia a lista."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}
      <div class="pw-art-row">${figure("components", t("Rules PDF p. 2: the component list — time board, 2 box boards, neutral token, 2 heart tokens, 5 petits fours, special tile, 33 chocolate pieces and the praline chits", "Regras PDF p. 2: a lista de componentes — tabuleiro de tempo, 2 tabuleiros da caixa, marcador neutro, 2 marcadores de coração, 5 petits fours, peça especial, 33 peças de chocolate e as fichas de pralinê"))}</div>`;
  }

  // ---------- quick reference ----------

  function quickReference() {
    const cards = [
      infoCard(t("WHO PLAYS", "QUEM JOGA"), t("The heart furthest behind", "O coração mais atrás"), [
        rl("Next turn", "whoever's heart is furthest behind on the time board plays — not strictly alternating.", "Próximo turno", "joga quem tem o coração mais atrás no tabuleiro de tempo — sem alternar à risca."),
        rl("Several turns", "you keep playing while you are still behind.", "Vários turnos", "você continua jogando enquanto ainda estiver atrás."),
        rl("Same space", "the heart on top plays first — so if you land on top of your opponent, you play again.", "Mesmo espaço", "o coração de cima joga primeiro — então, se você parar por cima do adversário, joga de novo."),
        rl("Each turn", "do exactly one action: A or B.", "Cada turno", "faça exatamente uma ação: A ou B.")
      ], [1]),
      infoCard(t("ACTION A", "AÇÃO A"), t("Advance and collect pralines", "Avançar e pegar pralinês"), [
        rl("Move", "your heart to the space directly in front of your opponent's heart (one space beyond it).", "Mover", "o seu coração para o espaço logo à frente do coração do adversário (um espaço além dele)."),
        rl("Collect", `1 praline ${glyph("chit-1")} per space you actually moved.`, "Pegar", `1 pralinê ${glyph("chit-1")} por espaço que você realmente andou.`),
        rl("Then", "time-board bonuses you cross are triggered as usual (pralines, petits fours).", "Depois", "os bônus do tabuleiro de tempo que você cruzar também são disparados (pralinês, petits fours).")
      ], [1, 2]),
      infoCard(t("ACTION B", "AÇÃO B"), t("Take and place a piece — 5 steps in order", "Pegar e colocar uma peça — 5 passos em ordem"), [
        rl("1 · Choose", `one of the 3 pieces just after the neutral token ${glyph("neutral-token")}, clockwise.`, "1 · Escolher", `uma das 3 peças logo depois do marcador neutro ${glyph("neutral-token")}, em sentido horário.`),
        rl("2 · Neutral token", "move it to where the chosen piece was.", "2 · Marcador neutro", "mova-o para onde estava a peça escolhida."),
        rl("3 · Pay", `the pralines shown next to ${glyph("cost")} on the piece's banderole, to the supply.`, "3 · Pagar", `os pralinês mostrados junto a ${glyph("cost")} na faixa da peça, para a reserva.`),
        rl("4 · Place", "on your box board, turned any way you like; no overlapping.", "4 · Colocar", "no seu tabuleiro da caixa, virada como quiser; sem sobrepor."),
        rl("5 · Move heart", `forward the number shown next to ${glyph("time")}. Ending on your opponent's space → your heart goes on top.`, "5 · Mover coração", `para a frente o número mostrado junto a ${glyph("time")}. Parou no espaço do adversário → o seu coração fica por cima.`)
      ], [1, 2]),
      infoCard(t("TIME BOARD", "TABULEIRO DE TEMPO"), t("Triggered by your own move", "Disparado pelo seu próprio movimento"), [
        rl("Praline", `${glyph("praline")} each one your heart moves past (guide's reading: or stops on) → collect 1 praline per ${glyph("piece-praline")} on the pieces in your box.`, "Pralinê", `${glyph("praline")} cada um pelo qual o seu coração passa (leitura do guia: ou no qual para) → pegue 1 pralinê por ${glyph("piece-praline")} nas peças da sua caixa.`),
        rl("Petit four", `${glyph("petit-four")} moving onto or past one → take it at once: place it on your box board, or remove it from play.`, "Petit four", `${glyph("petit-four")} parar nele ou passar por ele → pegue-o na hora: coloque-o no seu tabuleiro da caixa, ou retire-o do jogo.`),
        rl("Only you", "only the active player collects.", "Só você", "só o jogador da vez recebe.")
      ], [2]),
      infoCard(t("SPECIAL TILE", "PEÇA ESPECIAL"), t("7 points", "7 pontos"), [
        rl("Claim", `the first player to completely fill a 7×7 square on their box board takes the special tile ${glyph("special-tile")}.`, "Conquistar", `o primeiro jogador a preencher totalmente um quadrado 7×7 no seu tabuleiro da caixa pega a peça especial ${glyph("special-tile")}.`),
        rl("Worth", "7 points at the end.", "Vale", "7 pontos no fim.")
      ], [2]),
      infoCard(t("END & SCORING", "FIM E PONTUAÇÃO"), t("Both hearts on the last space", "Os dois corações no último espaço"), [
        rl("Last space", "a heart that would go further stops there; Action A pays only for spaces actually moved.", "Último espaço", "um coração que iria além para nele; a Ação A paga só os espaços realmente andados."),
        rl("Score", "your pralines + 7 for the special tile − 2 per empty space on your box board.", "Pontos", "seus pralinês + 7 pela peça especial − 2 por espaço vazio no seu tabuleiro da caixa."),
        rl("Tie", "whoever reached the final space first wins.", "Empate", "vence quem chegou primeiro ao último espaço.")
      ], [2])
    ];
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), sectionIndex("quick-reference"), [1, 2])}
      <div class="callout">${t(
        "Fill your box board with oddly shaped chocolate pieces bought with pralines. Each piece also costs time: your heart moves forward on the time board. Whoever is behind on the time board plays next. When both hearts reach the end, score your remaining pralines, +7 for the special tile, −2 for every empty space.",
        "Encha o seu tabuleiro da caixa com peças de chocolate de formatos estranhos, compradas com pralinês. Cada peça também custa tempo: o seu coração anda no tabuleiro de tempo. Quem está atrás no tabuleiro de tempo joga em seguida. Quando os dois corações chegam ao fim, conte os pralinês que restam, +7 pela peça especial, −2 por espaço vazio."
      )} ${referenceLink(1)}</div>
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- victory ----------

  function victorySection() {
    return `
      ${sectionHeading("victory", t("End of the game & scoring", "Fim do jogo e pontuação"), sectionIndex("victory"), [2])}
      <div class="quick-grid">
        <article class="info-card victory-card">
          <span class="component-label">${t("GAME END", "FIM DE JOGO")}</span>
          <h3>${t("Both hearts on the last space", "Os dois corações no último espaço")}</h3>
          ${lineList([
            t("The game ends after both heart tokens reach the last space of the time board.", "A partida termina depois que os dois marcadores de coração chegam ao último espaço do tabuleiro de tempo."),
            t("A heart that would move past the last space simply stops on it.", "Um coração que andaria além do último espaço simplesmente para nele."),
            t("With Action A you collect pralines only for the spaces you actually moved.", "Com a Ação A você só pega pralinês pelos espaços que realmente andou."),
            interpretation("once one heart is on the last space, it is always ahead, so the other player keeps taking turns until their heart arrives too.", "quando um coração está no último espaço, ele está sempre à frente, então o outro jogador continua jogando até o seu coração chegar também.")
          ])}
          ${referenceLink(2)}
        </article>
        <article class="info-card victory-card">
          <span class="component-label">${t("SCORING", "PONTUAÇÃO")}</span>
          <h3>${t("Pralines + 7 − 2 per empty space", "Pralinês + 7 − 2 por espaço vazio")}</h3>
          ${lineList([
            rl("Pralines", "count the pralines you have left: 1 point each.", "Pralinês", "conte os pralinês que restaram: 1 ponto cada."),
            rl("Special tile", "+7 if you have it.", "Peça especial", "+7 se estiver com você."),
            rl("Empty spaces", "−2 for each empty space on your box board.", "Espaços vazios", "−2 por espaço vazio no seu tabuleiro da caixa.")
          ])}
          ${referenceLink(2)}
        </article>
        <article class="info-card victory-card">
          <span class="component-label">${t("WINNER", "VENCEDOR")}</span>
          <h3>${t("Highest score", "Maior pontuação")}</h3>
          ${lineList([
            t("The player with the highest score wins.", "Vence o jogador com a maior pontuação."),
            rl("Tie", "the player who reached the final space of the time board first wins.", "Empate", "vence o jogador que chegou primeiro ao último espaço do tabuleiro de tempo.")
          ])}
          ${referenceLink(2)}
        </article>
      </div>
      <div class="callout pw-example-callout">
        <strong>${t("Rulebook example", "Exemplo do livro")}</strong>
        ${lineList([
          t("Romeo ends with 14 pralines and the special tile, and 5 empty spaces: 14 + 7 − 10 (5 × 2) = 11 points.", "Romeu termina com 14 pralinês e a peça especial, e 5 espaços vazios: 14 + 7 − 10 (5 × 2) = 11 pontos."),
          t("Juliet ends with 18 pralines and only 2 empty spaces: 18 − 4 = 14 points. Juliet wins.", "Julieta termina com 18 pralinês e só 2 espaços vazios: 18 − 4 = 14 pontos. Julieta vence.")
        ])}
        ${referenceLink(2)}
      </div>`;
  }

  // ---------- turns ----------

  function turnsSection() {
    return `
      ${sectionHeading("turns", t("Turns & actions", "Turnos e ações"), sectionIndex("turns"), [1, 2])}
      <div class="quick-grid">
        ${infoCard(t("TURN ORDER", "ORDEM DOS TURNOS"), t("Not strictly alternating", "Sem alternar à risca"), [
          t("The player whose heart token is furthest behind on the time board takes the turn.", "Joga o turno o jogador cujo marcador de coração está mais atrás no tabuleiro de tempo."),
          t("So one player may take several turns in a row before the opponent plays.", "Assim, um jogador pode fazer vários turnos seguidos antes de o adversário jogar."),
          t("If both hearts are on the same space, the player whose heart is on top goes first.", "Se os dois corações estiverem no mesmo espaço, joga primeiro o jogador cujo coração está por cima."),
          t("On your turn, perform exactly one action: A (Advance and collect pralines) or B (Take and place a piece).", "No seu turno, faça exatamente uma ação: A (Avançar e pegar pralinês) ou B (Pegar e colocar uma peça)."),
          t("Whichever action you take, your heart always advances on the time board.", "Qualquer que seja a ação, o seu coração sempre avança no tabuleiro de tempo.")
        ], [1, 2])}
        ${infoCard(t("ACTION A", "AÇÃO A"), t("Advance and collect pralines", "Avançar e pegar pralinês"), [
          t("Move your heart so that it occupies the space directly in front of your opponent's heart (one space beyond it).", "Mova o seu coração para que ele ocupe o espaço logo à frente do coração do adversário (um espaço além dele)."),
          t(`Collect 1 praline (one “1 praline” chit ${glyph("chit-1")}) from the supply for each space you advanced.`, `Pegue da reserva 1 pralinê (uma ficha de “1 pralinê” ${glyph("chit-1")}) por espaço que você avançou.`),
          t("Because you end up in front, it is then your opponent's turn.", "Como você fica à frente, em seguida é a vez do adversário."),
          t("Pralines and petits fours you pass on the way are triggered as usual (see Time board).", "Pralinês e petits fours pelos quais você passa no caminho são disparados normalmente (veja Tabuleiro de tempo)."),
          t("Near the end: if your opponent is on the last space, you stop on the last space too and are paid only for the spaces you actually moved.", "Perto do fim: se o adversário está no último espaço, você também para no último espaço e recebe só pelos espaços que realmente andou.")
        ], [1, 2])}
      </div>
      <h3 class="subhead">${t("Action B: Take and place a piece — 5 steps, in this order", "Ação B: Pegar e colocar uma peça — 5 passos, nesta ordem")}</h3>
      <div class="quick-grid">
        ${infoCard(t("STEP 1", "PASSO 1"), t("Choose a piece", "Escolha uma peça"), [
          t(`You may choose only from the 3 pieces directly in front of the neutral token ${glyph("neutral-token")}, counting clockwise.`, `Você só pode escolher entre as 3 peças logo depois do marcador neutro ${glyph("neutral-token")}, contando em sentido horário.`),
          t("No other piece can be taken at the moment.", "Nenhuma outra peça pode ser pega no momento."),
          interpretation("you can choose only a piece you can pay for and fit on your box board; if none of the 3 qualifies, take Action A instead.", "você só pode escolher uma peça que consiga pagar e encaixar no seu tabuleiro da caixa; se nenhuma das 3 servir, faça a Ação A.")
        ], [1])}
        ${infoCard(t("STEP 2", "PASSO 2"), t("Move the neutral token", "Mova o marcador neutro"), [
          t("Place the neutral token next to the chosen piece — in the gap it leaves in the circle.", "Coloque o marcador neutro junto à peça escolhida — no espaço que ela deixa no círculo."),
          t("The next player's 3 choices are counted from this new position.", "As 3 opções do próximo jogador contam a partir dessa nova posição.")
        ], [1])}
        ${infoCard(t("STEP 3", "PASSO 3"), t("Pay for the piece", "Pague pela peça"), [
          t(`Each piece has a banderole (a pink ribbon). The number next to the praline symbol ${glyph("cost")} is its price.`, `Cada peça tem uma faixa (fita rosa). O número junto ao símbolo de pralinê ${glyph("cost")} é o preço.`),
          t("Return that many pralines to the supply.", "Devolva essa quantidade de pralinês à reserva.")
        ], [1])}
        ${infoCard(t("STEP 4", "PASSO 4"), t("Place the piece on your box board", "Coloque a peça no seu tabuleiro da caixa"), [
          t("Pieces on your box board cannot overlap.", "As peças no seu tabuleiro da caixa não podem se sobrepor."),
          t("You may turn the piece any way you like before placing it.", "Você pode virar a peça como quiser antes de colocá-la."),
          interpretation("“any way you like” includes rotating it and flipping it over; keep it inside the grid.", "“como quiser” inclui girá-la e virá-la do avesso; mantenha-a dentro da grade.")
        ], [1])}
        ${infoCard(t("STEP 5", "PASSO 5"), t("Move your heart token", "Mova o seu marcador de coração"), [
          t(`Advance your heart on the time board by the number next to the hourglass ${glyph("time")} on the banderole.`, `Avance o seu coração no tabuleiro de tempo pelo número junto à ampulheta ${glyph("time")} na faixa.`),
          t("If your heart ends on the same space as your opponent's, place yours on top of it.", "Se o seu coração parar no mesmo espaço que o do adversário, coloque o seu por cima."),
          t("Pralines and petits fours you pass are triggered as usual.", "Pralinês e petits fours pelos quais você passa são disparados normalmente."),
          t("If you are still behind (or on top on a shared space), you play again.", "Se você ainda estiver atrás (ou por cima num espaço compartilhado), joga de novo.")
        ], [2])}
      </div>
      <div class="pw-art-row">
        ${figure("choose-piece", t("Rules PDF p. 1: only the 3 highlighted pieces after the neutral token can be chosen", "Regras PDF p. 1: só as 3 peças destacadas depois do marcador neutro podem ser escolhidas"))}
        ${figure("move-neutral", t("Rules PDF p. 1: the neutral token moves to the chosen piece's place", "Regras PDF p. 1: o marcador neutro vai para o lugar da peça escolhida"))}
        ${figure("banderole", t("Rules PDF p. 1: a banderole — cost 1 praline, time 2 spaces", "Regras PDF p. 1: uma faixa — custo 1 pralinê, tempo 2 espaços"))}
        ${figure("place-piece", t("Rules PDF p. 1: placing a piece on the box board without overlapping", "Regras PDF p. 1: colocando uma peça no tabuleiro da caixa sem sobrepor"))}
      </div>`;
  }

  // ---------- time board ----------

  function timeBoardSection() {
    return `
      ${sectionHeading("time-board", t("Time board & bonuses", "Tabuleiro de tempo e bônus"), sectionIndex("time-board"), [2])}
      <div class="callout">${t(
        "Regardless of the action you take, you must advance your heart on the time board. The track spirals inward from the starting space to the last space. Some spaces are marked; crossing them gives a bonus to the player who is moving — only the active player.",
        "Qualquer que seja a ação, você precisa avançar o seu coração no tabuleiro de tempo. A trilha faz uma espiral para dentro, do espaço inicial ao último espaço. Alguns espaços são marcados; cruzá-los dá um bônus ao jogador que está se movendo — só o jogador da vez."
      )} ${referenceLink(2)}</div>
      <div class="quick-grid">
        ${infoCard(t("MARKED SPACE", "ESPAÇO MARCADO"), t("Petit four", "Petit four"), [
          t(`Each time your heart moves onto or past a space holding a petit four ${glyph("petit-four")}, you must immediately take that petit four ${glyph("petit-four-tile")}.`, `Cada vez que o seu coração para num espaço com um petit four ${glyph("petit-four")} ou passa por ele, você precisa pegar esse petit four ${glyph("petit-four-tile")} imediatamente.`),
          t("Either place it on your box board, or remove it from play.", "Ou coloque-o no seu tabuleiro da caixa, ou retire-o do jogo."),
          t("Petits fours are the only way to fill single spaces of your box board.", "Os petits fours são o único jeito de preencher espaços isolados do seu tabuleiro da caixa."),
          interpretation("each petit four is taken once; after the first heart passes, that space is empty and gives nothing more.", "cada petit four é pego uma vez; depois que o primeiro coração passa, o espaço fica vazio e não dá mais nada.")
        ], [2])}
        ${infoCard(t("MARKED SPACE", "ESPAÇO MARCADO"), t("Praline (income)", "Pralinê (renda)"), [
          t(`Each time your heart moves past a praline symbol ${glyph("praline")} on the time board, you immediately collect pralines.`, `Cada vez que o seu coração passa por um símbolo de pralinê ${glyph("praline")} no tabuleiro de tempo, você pega pralinês imediatamente.`),
          t(`You collect 1 praline for each praline symbol ${glyph("piece-praline")} printed on the pieces already on your box board.`, `Você pega 1 pralinê por símbolo de pralinê ${glyph("piece-praline")} impresso nas peças que já estão no seu tabuleiro da caixa.`),
          t("Only the active player collects; the other player collects only when their own heart passes the symbol.", "Só o jogador da vez recebe; o outro jogador só recebe quando o próprio coração passar pelo símbolo."),
          t("A move that passes two praline symbols pays twice.", "Um movimento que passa por dois símbolos de pralinê paga duas vezes."),
          interpretation("the sheet says “past” for pralines (and “onto or past” for petits fours) without saying whether stopping exactly on a praline's space counts. This guide counts it: the heart has reached the praline.", "a folha diz “passar” para pralinês (e “parar ou passar” para petits fours) sem dizer se parar exatamente no espaço de um pralinê conta. Este guia conta: o coração chegou ao pralinê."),
          interpretation("with Action B, the piece you just placed already counts, because you move your heart (step 5) after placing it (step 4).", "com a Ação B, a peça que você acabou de colocar já conta, pois você move o coração (passo 5) depois de colocá-la (passo 4).")
        ], [2])}
        ${infoCard(t("BONUS", "BÔNUS"), t("The special tile", "A peça especial"), [
          t(`The first player to completely fill a 7×7 square of spaces on their box board receives the special tile ${glyph("special-tile")}.`, `O primeiro jogador a preencher totalmente um quadrado de 7×7 espaços no seu tabuleiro da caixa recebe a peça especial ${glyph("special-tile")}.`),
          t("It is worth 7 points at the end of the game.", "Ela vale 7 pontos no fim da partida."),
          interpretation("the 7×7 square may sit anywhere on your board; once taken, the tile is never lost.", "o quadrado 7×7 pode ficar em qualquer lugar do tabuleiro; uma vez pega, a peça nunca é perdida.")
        ], [2])}
      </div>
      <div class="pw-art-row">
        ${figure("petit-four-space", t("Rules PDF p. 2: a time-board space with a petit four", "Regras PDF p. 2: um espaço do tabuleiro de tempo com um petit four"))}
        ${figure("praline-space", t("Rules PDF p. 2: a praline symbol on the time board", "Regras PDF p. 2: um símbolo de pralinê no tabuleiro de tempo"))}
        ${figure("praline-income", t("Rules PDF p. 2: these pieces show 3 praline symbols, so they pay 3 pralines each time your heart passes a praline symbol", "Regras PDF p. 2: estas peças mostram 3 símbolos de pralinê, então pagam 3 pralinês cada vez que o seu coração passa por um símbolo de pralinê"))}
      </div>`;
  }

  // ---------- iconography ----------

  function iconsSection() {
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), sectionIndex("icons"), [1, 2])}
      <p class="glossary-intro">${t("Each picture is cut from the rulebook. Symbols are printed on the pieces and on the time board; the components are shown so you can identify them.", "Cada imagem foi recortada do livro de regras. Os símbolos estão impressos nas peças e no tabuleiro de tempo; os componentes aparecem para você identificá-los.")}</p>
      <h3 class="subhead">${t("Symbols", "Símbolos")}</h3>
      <div class="icon-grid">
        ${iconCard("cost", "On a piece's banderole: the number next to this praline coin is how many pralines you pay to take the piece.", "Na faixa de uma peça: o número junto a esta moeda de pralinê é quantos pralinês você paga para pegar a peça.", 1)}
        ${iconCard("time", "On a piece's banderole: the number next to this hourglass is how many spaces your heart advances after placing the piece.", "Na faixa de uma peça: o número junto a esta ampulheta é quantos espaços o seu coração avança depois de colocar a peça.", [1, 2])}
        ${iconCard("piece-praline", "Printed on some chocolate pieces. Each one on your box board pays you 1 praline whenever your heart passes a praline symbol on the time board.", "Impresso em algumas peças de chocolate. Cada um no seu tabuleiro da caixa paga 1 pralinê sempre que o seu coração passa por um símbolo de pralinê no tabuleiro de tempo.", 2)}
        ${iconCard("praline", "Printed on the time board. Moving past it pays you your income: 1 praline per praline symbol on your box board.", "Impresso no tabuleiro de tempo. Passar por ele paga a sua renda: 1 pralinê por símbolo de pralinê no seu tabuleiro da caixa.", 2)}
        ${iconCard("petit-four", "A marked time-board space. A petit four tile starts on it; the first heart to move onto or past it takes the tile.", "Um espaço marcado do tabuleiro de tempo. Uma peça de petit four começa nele; o primeiro coração a parar nele ou passar por ele pega a peça.", [1, 2])}
      </div>
      <h3 class="subhead">${t("Components", "Componentes")}</h3>
      <div class="icon-grid">
        ${iconCard("petit-four-tile", "A 1×1 piece (5 in the game). Place it on your box board or remove it from play when you take it.", "Uma peça 1×1 (5 no jogo). Coloque-a no seu tabuleiro da caixa ou retire-a do jogo quando a pegar.", 2)}
        ${iconCard("neutral-token", "Marks where the circle of pieces is read from: you choose among the 3 pieces after it, clockwise.", "Marca de onde o círculo de peças é lido: você escolhe entre as 3 peças depois dele, em sentido horário.", 1)}
        ${iconCard("heart-red", "One player's time marker on the time board.", "O marcador de tempo de um jogador no tabuleiro de tempo.", [1, 2])}
        ${iconCard("heart-white", "The other player's time marker on the time board.", "O marcador de tempo do outro jogador no tabuleiro de tempo.", [1, 2])}
        ${iconCard("special-tile", "Goes to the first player who fills a 7×7 square on their box board: 7 points.", "Vai para o primeiro jogador que preencher um quadrado 7×7 no seu tabuleiro da caixa: 7 pontos.", 2)}
        ${iconCard("chit-1", "Money and points: 1 praline (32 in the game).", "Dinheiro e pontos: 1 pralinê (32 no jogo).", 2)}
        ${iconCard("chit-5", "5 pralines (12 in the game).", "5 pralinês (12 no jogo).", 2)}
        ${iconCard("chit-10", "10 pralines (5 in the game).", "10 pralinês (5 no jogo).", 2)}
        ${iconCard("chit-20", "20 pralines (1 in the game).", "20 pralinês (1 no jogo).", 2)}
        ${iconCard("time-board", "The shared spiral track of time, with the petit four spaces and praline symbols.", "A trilha compartilhada de tempo, em espiral, com os espaços de petit four e os símbolos de pralinê.", [1, 2])}
        ${iconCard("box-board", "Your personal grid (1 per player). Fill it with pieces; every empty space costs 2 points at the end.", "A sua grade pessoal (1 por jogador). Encha-a de peças; cada espaço vazio custa 2 pontos no fim.", [1, 2])}
      </div>`;
  }

  // ---------- examples ----------

  function examplesSection() {
    const examples = [
      {
        art: "turn-order",
        title: t("Who plays next", "Quem joga em seguida"),
        lines: [
          t("The white heart is behind the red heart, so it is White's turn.", "O coração branco está atrás do vermelho, então é a vez do Branco."),
          t("Unless White advances more than 3 spaces (passing the red heart), White may immediately take another turn.", "A menos que o Branco avance mais de 3 espaços (passando o coração vermelho), ele pode jogar de novo imediatamente.")
        ],
        page: 1
      },
      {
        art: "action-a",
        title: t("Action A", "Ação A"),
        lines: [
          t("White advances 4 spaces, to the space directly in front of the red heart.", "O Branco avança 4 espaços, até o espaço logo à frente do coração vermelho."),
          t("White receives 4 pralines for that.", "O Branco recebe 4 pralinês por isso.")
        ],
        page: 1
      },
      {
        art: "move-heart",
        title: t("Action B, step 5", "Ação B, passo 5"),
        lines: [
          t("The banderole shows 2 next to the hourglass: the heart advances 2 spaces.", "A faixa mostra 2 junto à ampulheta: o coração avança 2 espaços.")
        ],
        page: 2
      },
      {
        art: "praline-income",
        title: t("Praline income", "Renda de pralinês"),
        lines: [
          t("These pieces show 3 praline symbols in total.", "Estas peças mostram 3 símbolos de pralinê no total."),
          t("Each time this player's heart passes a praline symbol on the time board, they get 3 pralines.", "Cada vez que o coração deste jogador passa por um símbolo de pralinê no tabuleiro de tempo, ele recebe 3 pralinês.")
        ],
        page: 2
      }
    ];
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), sectionIndex("examples"), [1, 2])}
      <div class="quick-grid pw-example-grid">${examples.map((example) => `
        <article class="info-card">
          <span class="component-label">${t("RULEBOOK EXAMPLE", "EXEMPLO DO LIVRO")}</span>
          <h3>${example.title}</h3>
          ${figure(example.art, example.title)}
          ${lineList(example.lines)}
          ${referenceLink(example.page)}
        </article>`).join("")}
        <article class="info-card">
          <span class="component-label">${t("RULEBOOK EXAMPLE", "EXEMPLO DO LIVRO")}</span>
          <h3>${t("Final scoring", "Pontuação final")}</h3>
          ${lineList([
            t("Romeo: 14 pralines + 7 (special tile) − 10 (5 empty spaces × 2) = 11.", "Romeu: 14 pralinês + 7 (peça especial) − 10 (5 espaços vazios × 2) = 11."),
            t("Juliet: 18 pralines − 4 (2 empty spaces × 2) = 14. Juliet wins.", "Julieta: 18 pralinês − 4 (2 espaços vazios × 2) = 14. Julieta vence.")
          ])}
          ${referenceLink(2)}
        </article>
      </div>`;
  }

  // ---------- guide's readings ----------

  function faqSection() {
    const items = [
      [t("Whose heart goes on top at the start?", "De quem é o coração por cima no início?"), t("The rulebook only names the first player. Since the heart on top plays first on a shared space, put the first player's heart on top.", "O livro só indica o primeiro jogador. Como o coração de cima joga primeiro num espaço compartilhado, coloque o coração do primeiro jogador por cima."), 1],
      [t("Can I take a piece I cannot afford or cannot fit?", "Posso pegar uma peça que não consigo pagar ou encaixar?"), t("The rulebook does not cover it. This guide reads it as no: you must pay the full price (step 3) and place it without overlap (step 4). If none of the 3 pieces works, take Action A.", "O livro não trata disso. Este guia entende que não: você precisa pagar o preço inteiro (passo 3) e colocá-la sem sobrepor (passo 4). Se nenhuma das 3 peças servir, faça a Ação A."), 1],
      [t("Can I flip a piece over?", "Posso virar a peça do avesso?"), t("The rulebook says you may turn the piece any way you like. This guide reads that as rotating and flipping.", "O livro diz que você pode virar a peça como quiser. Este guia entende isso como girar e virar do avesso."), 1],
      [t("Can I move pieces already on my box board?", "Posso mexer em peças que já estão no tabuleiro da caixa?"), t("The rulebook gives no way to do so. This guide reads placed pieces as fixed.", "O livro não dá nenhum meio de fazer isso. Este guia considera as peças colocadas como fixas."), 1],
      [t("Does the praline income count the piece I just placed?", "A renda de pralinês conta a peça que acabei de colocar?"), t("Yes, by the order of the 5 steps: you place the piece (step 4) before your heart moves (step 5), and income is collected when your heart passes a praline symbol.", "Sim, pela ordem dos 5 passos: você coloca a peça (passo 4) antes de o coração andar (passo 5), e a renda é recebida quando o coração passa por um símbolo de pralinê."), 2],
      [t("What if the pieces run low?", "E se as peças estiverem acabando?"), t("The rulebook does not say. This guide reads it as: if fewer than 3 pieces remain, choose among those left after the neutral token.", "O livro não diz. Este guia entende que: se restarem menos de 3 peças, escolha entre as que sobraram depois do marcador neutro."), 1]
    ];
    return `
      ${sectionHeading("faq", t("Guide's readings", "Leituras do guia"), sectionIndex("faq"), [1, 2])}
      <p class="glossary-intro">${t("The rulebook is a short two-page sheet. Where it is silent, this guide states its own reading, labelled as such.", "O livro de regras é uma folha curta de duas páginas. Onde ele é omisso, este guia dá a sua própria leitura, identificada como tal.")}</p>
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
    const visible = [
      { term: ["Banderole", "Faixa"], text: ["The pink ribbon printed on each chocolate piece: its praline cost and its time cost.", "A fita rosa impressa em cada peça de chocolate: o custo em pralinês e o custo em tempo."], page: 1 },
      { term: ["Box board", "Tabuleiro da caixa"], text: ["Your personal grid: the box you fill with chocolate pieces. Empty spaces cost 2 points each at the end.", "A sua grade pessoal: a caixa que você enche com peças de chocolate. Cada espaço vazio custa 2 pontos no fim."], page: 1 },
      { term: ["Chocolate piece", "Peça de chocolate"], text: ["One of the 33 polyomino pieces in the circle; bought with Action B.", "Uma das 33 peças em forma de poliominó no círculo; compradas com a Ação B."], page: 2 },
      { term: ["Heart token", "Marcador de coração"], text: ["Your marker on the time board (red or white). The one furthest behind plays.", "O seu marcador no tabuleiro de tempo (vermelho ou branco). Joga o que está mais atrás."], page: 1 },
      { term: ["Neutral token", "Marcador neutro"], text: ["The pink token in the circle; you may choose among the 3 pieces after it, clockwise.", "O marcador rosa no círculo; você pode escolher entre as 3 peças depois dele, em sentido horário."], page: 1 },
      { term: ["Petit four", "Petit four"], text: ["A 1×1 tile on a marked time-board space; the only way to fill single spaces.", "Uma peça 1×1 num espaço marcado do tabuleiro de tempo; o único jeito de preencher espaços isolados."], page: 2 },
      { term: ["Praline", "Pralinê"], text: ["The money of the game and, at the end, your points. Also a symbol on pieces and on the time board (income).", "O dinheiro do jogo e, no fim, os seus pontos. Também um símbolo nas peças e no tabuleiro de tempo (renda)."], page: 1 },
      { term: ["Special tile", "Peça especial"], text: ["7-point bonus for the first player to fill a 7×7 square.", "Bônus de 7 pontos para o primeiro jogador a preencher um quadrado 7×7."], page: 2 },
      { term: ["Supply", "Reserva"], text: ["The praline chits kept on the table within reach.", "As fichas de pralinê deixadas na mesa, ao alcance."], page: 1 },
      { term: ["Time board", "Tabuleiro de tempo"], text: ["The shared spiral track from the starting space to the last space.", "A trilha compartilhada em espiral, do espaço inicial ao último espaço."], page: 2 },
      { term: ["Active player", "Jogador da vez"], text: ["The player taking the turn; only they collect pralines from the time board.", "O jogador que está fazendo o turno; só ele recebe pralinês do tabuleiro de tempo."], page: 2 }
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
    document.body.classList.add("theme-patchwork");
    document.documentElement.lang = state.language;
    document.title = t("Patchwork Valentine — Field Manual", "Patchwork Valentine — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Patchwork Valentine Edition: fill your box with chocolate pieces bought with pralines and time — setup checklist, turn order, Actions A and B, the time board, petits fours, the special tile, scoring and the rulebook examples.",
        "Regras interativas bilíngues de Patchwork Valentine Edition: encha a sua caixa com peças de chocolate compradas com pralinês e tempo — lista de preparação, ordem dos turnos, Ações A e B, tabuleiro de tempo, petits fours, peça especial, pontuação e os exemplos do manual."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook", "Livro interativo")}</p>
          <h1>Patchwork <span class="pw-hero-sub">Valentine Edition</span></h1>
          <p class="hero-intro">${t(
            "A box of chocolates for your darling — if only the sweets were not so oddly shaped. Buy pieces with pralines, pay for them with time, and fill your box to the brim before your rival does.",
            "Uma caixa de bombons para o seu amor — se ao menos os doces não tivessem formatos tão estranhos. Compre peças com pralinês, pague com tempo e encha a sua caixa até a borda antes do rival."
          )}</p>
          <div class="hero-meta"><span>${t("2 players", "2 jogadores")}</span><span>${t("Uwe Rosenberg", "Uwe Rosenberg")}</span><span>${t("Lookout Games", "Lookout Games")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/patchwork.webp" alt="${t("Title panel of the Patchwork Valentine Edition rulebook", "Painel de título do livro de regras de Patchwork Valentine Edition")}" fetchpriority="high"><figcaption>${t("Rulebook title panel · Lookout Games", "Painel de título do livro de regras · Lookout Games")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("The box", "A caixa")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column pw-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied English rulebook of Patchwork Valentine Edition (Lookout Games, 2021) — a Valentine's version of classic Patchwork with chocolates instead of patches and pralines instead of buttons. The PDF has two wide pages: PDF 1 = Setup, Playing the Game, Actions A and B (steps 1–4); PDF 2 = step 5, the time board, the special tile, end of the game, scoring and components. Points marked “Guide's reading” are interpretations where the rulebook is silent.",
            "Este guia cobre o livro de regras em inglês fornecido de Patchwork Valentine Edition (Lookout Games, 2021) — uma versão de Dia dos Namorados do Patchwork clássico, com chocolates no lugar de retalhos e pralinês no lugar de botões. O PDF tem duas páginas largas: PDF 1 = Preparação, Como jogar, Ações A e B (passos 1–4); PDF 2 = passo 5, tabuleiro de tempo, peça especial, fim do jogo, pontuação e componentes. Trechos marcados como “Leitura do guia” são interpretações onde o livro é omisso."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${victorySection()}</section>
          <section class="rule-section">${turnsSection()}</section>
          <section class="rule-section">${timeBoardSection()}</section>
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${faqSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the Patchwork Valentine Edition rulebook. Patchwork is a game by Uwe Rosenberg, published by Lookout Games; graphic design by atelier198.",
        "Guia pessoal de consulta baseado no livro de regras de Patchwork Valentine Edition. Patchwork é um jogo de Uwe Rosenberg, publicado pela Lookout Games; design gráfico de atelier198."
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
      setupState = { signature: MATCH_SIGNATURE, checks: [] };
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
      root.querySelector(".pw-page")?.prepend(notice);
    }
    notice.textContent = storageNoticeText();
  }

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !root || !root.contains(target)) {
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
      setupState = { signature: MATCH_SIGNATURE, checks: [...checks] };
      saveSetup();
      updateProgress();
    }
  }

  window.Patchwork = { renderInto, onClick, onChange };
})();
