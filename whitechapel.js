(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.whitechapel.v1";
  const SETUP_KEY = "field-manual.whitechapel.setup.v1";
  const MANUAL_FILE = "whitechapel_core.pdf";
  const ICONS = "assets/whitechapel/icons/";
  // Source: Letters from Whitechapel, revised edition rulebook (Fantasy Flight Games / Sir Chester Cobblepot,
  // 2012), 24 pages; the printed page numbers equal the PDF pages (p. 1 is the cover). p. 3 goal and contents,
  // pp. 4–5 components, pp. 6–7 Preparing the Game (steps 1–10), p. 8 the four Nights and the phase list,
  // pp. 9–14 Hell phases 1–9, pp. 15–18 Hunting phases 1–3 and the End of the Hunting, pp. 19–20 Special
  // Movements, p. 21 the Third Night (double event), p. 22 End of the Game, Jack's Letters and tips, p. 23 False
  // Clues, the four police optional rules and the (not supplied) Hideout Generator app, p. 24 summary.
  // Hidden information: this guide never asks for, shows or stores Jack's Hideout, his route, which Woman tokens
  // are marked or which Police Patrol tokens are real.
  const PLAYERS = [2, 3, 4, 5, 6];
  const YES_NO = ["no", "yes"];
  const OPTIONS = ["letters", "falseClues", "rushing", "areaArrests", "catchMe", "knowAddress"];
  const defaults = {
    language: "pt-BR",
    players: 4,
    letters: "no",
    falseClues: "no",
    rushing: "no",
    areaArrests: "no",
    catchMe: "no",
    knowAddress: "no"
  };
  // Rules p. 9: [Coach, Alley] and [Woman tokens, of which marked] per Night.
  const NIGHTS = [
    { n: 1, dateEn: "August 31st, 1888", datePt: "31 de agosto de 1888", coach: 3, alley: 2, women: 8, marked: 5, kills: 1 },
    { n: 2, dateEn: "September 8th, 1888", datePt: "8 de setembro de 1888", coach: 2, alley: 2, women: 7, marked: 4, kills: 1 },
    { n: 3, dateEn: "September 30th, 1888 — the “double event”", datePt: "30 de setembro de 1888 — o “evento duplo”", coach: 2, alley: 1, women: 6, marked: 3, kills: 2 },
    { n: 4, dateEn: "November 9th, 1888", datePt: "9 de novembro de 1888", coach: 1, alley: 1, women: 4, marked: 1, kills: 1 }
  ];
  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------

  function normalizePreferences(saved) {
    const players = Number(saved?.players);
    const result = {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      players: PLAYERS.includes(players) ? players : defaults.players
    };
    for (const key of OPTIONS) {
      result[key] = YES_NO.includes(saved?.[key]) ? saved[key] : defaults[key];
    }
    return result;
  }

  // Only the choices that change the physical preparation are part of the setup signature.
  function signature(source = state) {
    return `p${source.players}-l${source.letters}-f${source.falseClues}-c${source.catchMe}`;
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Letters from Whitechapel preferences.", error);
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
      console.error("Could not read Letters from Whitechapel setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Letters from Whitechapel preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Letters from Whitechapel setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function on(key) {
    return state[key] === "yes";
  }

  function manualUrl(page) {
    const script = document.querySelector('script[src*="whitechapel.js"]');
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
          <p class="eyebrow">${t("LONDON, 1888", "LONDRES, 1888")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="wc-section-references">${pages.map(referenceLink).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
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
    return `<span class="wc-interpretation">${t("Guide's reading", "Leitura do guia")}</span> ${t(en, pt)}`;
  }

  function optionalTag(en, pt) {
    return `<span class="wc-optional-tag">${t(`Optional rule: ${en}`, `Regra opcional: ${pt}`)}</span>`;
  }

  function glyph(file, altEn, altPt) {
    return `<img class="wc-glyph" src="${ICONS}${file}.webp" alt="${t(altEn, altPt)}">`;
  }

  function jackTag() {
    return `${glyph("jack", "Jack the Ripper phase", "Fase de Jack, o Estripador")}<span class="wc-role wc-role-jack">Jack</span>`;
  }

  function policeTag() {
    return `${glyph("police", "Police phase", "Fase da Polícia")}<span class="wc-role wc-role-police">${t("Police", "Polícia")}</span>`;
  }

  function playersLabel(players = state.players) {
    return t(`${players} players`, `${players} jogadores`);
  }

  function detectives(players = state.players) {
    return players - 1;
  }

  function pawnSplit(players = state.players) {
    return {
      2: [5],
      3: [3, 2],
      4: [2, 2, 1],
      5: [2, 1, 1, 1],
      6: [1, 1, 1, 1, 1]
    }[players];
  }

  function splitText(players = state.players) {
    const split = pawnSplit(players);
    if (split.length === 1) {
      return t("the single detective controls all five Policeman pawns", "o único detetive controla os cinco peões de Policial");
    }
    return t(`for example ${split.join(" + ")} pawns`, `por exemplo ${split.join(" + ")} peões`);
  }

  function yesNo(value) {
    return value === "yes" ? t("Yes", "Sim") : t("No", "Não");
  }

  function activeOptionNames() {
    const names = {
      letters: t("Jack's Letters", "Cartas de Jack"),
      falseClues: t("False Clues", "Pistas Falsas"),
      rushing: t("Rushing", "Corrida (Rushing)"),
      areaArrests: t("Area Arrests", "Prisões em Área"),
      catchMe: t("Catch Me, If You Can", "Pegue-me Se Puder"),
      knowAddress: t("I Know Your Address", "Sei Onde Você Mora")
    };
    return OPTIONS.filter(on).map((key) => names[key]);
  }

  function optionSummary() {
    const names = activeOptionNames();
    return names.length ? names.join(" · ") : t("basic game, no optional rules", "jogo básico, sem regras opcionais");
  }

  // ---------- sections ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["board", t("Board & movement", "Tabuleiro e movimento")],
      ["winning", t("Goal & winning", "Objetivo e vitória")],
      ["nights", t("The four Nights", "As quatro Noites")],
      ["hell", t("Part 1: Hell", "Parte 1: Inferno")],
      ["hunting", t("Part 2: Hunting", "Parte 2: Caçada")],
      ["special", t("Special Movements", "Movimentos Especiais")],
      ["double-event", t("Third Night", "Terceira Noite")],
      ["end-night", t("End of the Night", "Fim da Noite")],
      ["optional", t("Optional rules", "Regras opcionais")],
      ["tips", t("Tips", "Dicas")],
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
          <span class="brand-mark" aria-hidden="true">LW</span>
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
      <label class="wc-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" ${dataAttr} ${checked ? "checked" : ""}>
        <span class="wc-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function playerChoiceText(players) {
    const det = detectives(players);
    return t(
      `1 Jack + ${det} detective${det === 1 ? "" : "s"}. The five Policeman pawns are split among the detectives as they agree — ${splitText(players)}. Each detective takes the Reference sheets of their colours.`,
      `1 Jack + ${det} detetive${det === 1 ? "" : "s"}. Os cinco peões de Policial são divididos entre os detetives como combinarem — ${splitText(players)}. Cada detetive pega as folhas de Referência das suas cores.`
    );
  }

  function yesNoGroup(key, titleEn, titlePt, introEn, introPt, page, yesEn, yesPt, noEn, noPt) {
    return `
      <fieldset class="wc-choice-group">
        <legend>${t(titleEn, titlePt)} · ${t("selected:", "selecionado:")} <span>${yesNo(state[key])}</span></legend>
        <p class="wc-choice-intro">${t(introEn, introPt)} ${referenceLink(page)}</p>
        <div class="wc-choice-grid">
          ${choiceCard(`wc-${key}`, "no", `data-option="${key}" data-value="no"`, state[key] === "no", t("No", "Não"), t(noEn, noPt))}
          ${choiceCard(`wc-${key}`, "yes", `data-option="${key}" data-value="yes"`, state[key] === "yes", t("Yes", "Sim"), t(yesEn, yesPt))}
        </div>
      </fieldset>`;
  }

  function matchConfiguration() {
    return `
      <section class="controls-panel wc-config" id="build-match" aria-labelledby="wc-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="wc-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "The supplied rulebook is the revised edition of the base game, with no expansions. Choose the number of players and which of its six optional rules (p. 22–23) you use. Each optional rule is independent: the rulebook lists two that help Jack and four that help the Police, and gives no advice on combining them. Changing the players, Jack's Letters, False Clues or Catch Me, If You Can clears the setup checklist (they change the preparation); the other options and the language do not. Nothing secret is asked or stored here.",
              "O livro fornecido é a edição revisada do jogo básico, sem expansões. Escolha o número de jogadores e quais das seis regras opcionais (p. 22–23) vocês vão usar. Cada regra opcional é independente: o livro lista duas que ajudam Jack e quatro que ajudam a Polícia, sem conselho sobre combiná-las. Mudar os jogadores, as Cartas de Jack, as Pistas Falsas ou Pegue-me Se Puder limpa a lista da preparação (mudam a preparação); as outras opções e o idioma não. Nada secreto é perguntado ou salvo aqui."
            )}</p>
            <p class="wc-config-summary"><strong>${t("This match:", "Esta partida:")}</strong> ${playersLabel()} · ${optionSummary()}</p>
          </div>
        </div>
        <fieldset class="wc-choice-group">
          <legend>${t("Players · selected:", "Jogadores · selecionado:")} <span>${playersLabel()}</span></legend>
          <p class="wc-choice-intro">${t("2 to 6 players: one is Jack the Ripper, the others are detectives who always work together. The count changes only how the five Policeman pawns are shared.", "2 a 6 jogadores: um é Jack, o Estripador, os outros são detetives que sempre trabalham juntos. O número muda só como os cinco peões de Policial são divididos.")} ${referenceLink(6)}</p>
          <div class="wc-choice-grid wc-choice-grid-players">
            ${PLAYERS.map((players) => choiceCard("wc-players", players, `data-players="${players}"`, state.players === players, playersLabel(players), playerChoiceText(players))).join("")}
          </div>
        </fieldset>
        <h3 class="wc-config-subhead">${glyph("jack", "Jack", "Jack")} ${t("Optional rules to help Jack the Ripper", "Regras opcionais para ajudar Jack, o Estripador")}</h3>
        ${yesNoGroup("letters", "Jack's Letters", "Cartas de Jack",
          "Four Letter sheets (Dear Boss, Saucy Jacky, From Hell, Goulston Street) let Jack move police once per Night.", "Quatro folhas de Carta (Dear Boss, Saucy Jacky, From Hell, Goulston Street) deixam Jack mexer na polícia uma vez por Noite.", 22,
          "Jack takes the 4 Letter sheets at setup. On each of Nights 2, 3 and 4 he may use one Letter (then it leaves the game): three of them move Police Patrol tokens right after they are placed; Goulston Street forces one Policeman pawn to the red-bordered Crossing during the Hunting. At most three Letters are used per game.",
          "Jack pega as 4 folhas de Carta na preparação. Em cada uma das Noites 2, 3 e 4 ele pode usar uma Carta (que sai do jogo): três delas movem fichas de Patrulha logo depois de colocadas; Goulston Street obriga um peão de Policial a ir ao Cruzamento de borda vermelha durante a Caçada. No máximo três Cartas são usadas por partida.",
          "The Letter sheets stay in the box. Police Patrol positions are decided by the Head of the Investigation alone.",
          "As folhas de Carta ficam na caixa. As posições das Patrulhas são decididas só pelo Chefe da Investigação.")}
        ${yesNoGroup("falseClues", "False Clues", "Pistas Falsas",
          "Three blue False Clue markers reward Jack when the police find many clues.", "Três marcadores azuis de Pista Falsa recompensam Jack quando a polícia acha muitas pistas.", 23,
          "Jack takes the 3 blue False Clue markers at setup. For every 5 yellow Clue markers he reveals in one Night he gains one; at the start of a Clues and Suspicion phase he may place one on any numbered circle, which then cannot be searched or arrested in for the rest of the Night. Unused ones are discarded at the end of each Night.",
          "Jack pega os 3 marcadores azuis de Pista Falsa na preparação. A cada 5 marcadores amarelos de Pista que revela numa Noite ele ganha um; no início de uma fase Pistas e Suspeitas pode colocar um em qualquer círculo numerado, que então não pode ser vasculhado nem ter prisão pelo resto da Noite. Os não usados são descartados ao fim de cada Noite.",
          "The blue markers stay in the box. Clue searches are never blocked.",
          "Os marcadores azuis ficam na caixa. As buscas de pistas nunca são bloqueadas.")}
        <h3 class="wc-config-subhead">${glyph("police", "Police", "Polícia")} ${t("Optional rules to help the Police", "Regras opcionais para ajudar a Polícia")}</h3>
        ${yesNoGroup("rushing", "Rushing", "Corrida (Rushing)",
          "A third choice for a Policeman's action in Clues and Suspicion.", "Uma terceira escolha para a ação de um Policial em Pistas e Suspeitas.", 23,
          "Instead of looking for clues or arresting, a Policeman pawn that can still act may move to an adjacent Crossing (ignoring numbered circles). No setup change.",
          "Em vez de procurar pistas ou prender, um peão de Policial que ainda pode agir pode ir a um Cruzamento adjacente (ignorando círculos numerados). Não muda a preparação.",
          "Each Policeman pawn either looks for clues or executes an arrest.",
          "Cada peão de Policial procura pistas ou executa uma prisão.")}
        ${yesNoGroup("areaArrests", "Area Arrests", "Prisões em Área",
          "Changes how an arrest is executed.", "Muda como uma prisão é executada.", 23,
          "An arresting detective names every numbered circle adjacent to that Policeman pawn at once; if Jack is on any of them he is arrested. Otherwise no information is given. No setup change.",
          "O detetive que prende nomeia de uma vez todos os círculos numerados adjacentes ao peão de Policial; se Jack estiver em qualquer um deles, é preso. Senão, nenhuma informação é dada. Não muda a preparação.",
          "An arrest names one, and only one, adjacent numbered circle.",
          "Uma prisão nomeia um, e só um, círculo numerado adjacente.")}
        ${yesNoGroup("catchMe", "Catch Me, If You Can", "Pegue-me Se Puder",
          "Restricts where Jack may hide.", "Restringe onde Jack pode se esconder.", 23,
          "In setup, Jack's secret Hideout may be neither a red numbered circle nor a numbered circle adjacent to a red one.",
          "Na preparação, o Esconderijo secreto de Jack não pode ser um círculo numerado vermelho nem um círculo numerado adjacente a um vermelho.",
          "Jack's Hideout may be any numbered circle except a red one.",
          "O Esconderijo de Jack pode ser qualquer círculo numerado, exceto um vermelho.")}
        ${yesNoGroup("knowAddress", "I Know Your Address", "Sei Onde Você Mora",
          "A one-shot guess at Jack's Hideout.", "Um palpite único sobre o Esconderijo de Jack.", 23,
          "When the revealed Head of the Investigation tile is Swanson (brown) or Abberline (red), that detective may at once name any numbered circle: if it is Jack's Hideout, the detectives win. Once per game. No setup change.",
          "Quando a peça de Chefe da Investigação revelada for Swanson (marrom) ou Abberline (vermelho), esse detetive pode na hora nomear qualquer círculo numerado: se for o Esconderijo de Jack, os detetives vencem. Uma vez por partida. Não muda a preparação.",
          "The Head of the Investigation tile only decides who places the Patrols.",
          "A peça de Chefe da Investigação só decide quem coloca as Patrulhas.")}
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function setupPhases() {
    const det = detectives();
    return [
      {
        id: "board-roles",
        title: t("Board, roles and Policeman pawns", "Tabuleiro, papéis e peões de Policial"),
        pages: [6, 7],
        items: [
          t("Place the game board (Whitechapel, 195 numbered circles linked by dotted lines) in the middle of the table.", "Coloque o tabuleiro (Whitechapel, 195 círculos numerados ligados por linhas pontilhadas) no centro da mesa."),
          t("Choose one player to be Jack the Ripper — the rulebook suggests the most experienced player. Everyone else is a police detective.", "Escolha um jogador para ser Jack, o Estripador — o livro sugere o mais experiente. Todos os outros são detetives da polícia."),
          det === 1
            ? t("The only detective takes all 5 Policeman pawns (blue, yellow, brown, red, green).", "O único detetive pega os 5 peões de Policial (azul, amarelo, marrom, vermelho, verde).")
            : t(`The ${det} detectives share the 5 Policeman pawns (blue, yellow, brown, red, green) any way they agree — ${splitText()}. Keep them off the board for now.`, `Os ${det} detetives dividem os 5 peões de Policial (azul, amarelo, marrom, vermelho, verde) como combinarem — ${splitText()}. Deixe-os fora do tabuleiro por enquanto.`),
          t("Hand out the 6 Reference sheets: each detective takes the sheet of each Policeman colour they control, and Jack takes one.", "Distribua as 6 folhas de Referência: cada detetive pega a folha de cada cor de Policial que controla, e Jack pega uma."),
          interpretation("the rulebook says the sheets go to the detectives “the same way the pawns were divided”; with fewer detectives a player may keep just one copy.", "o livro diz que as folhas vão aos detetives “do mesmo jeito que os peões foram divididos”; com menos detetives um jogador pode ficar com uma cópia só.")
        ]
      },
      {
        id: "screen-sheet",
        title: t("Jack's screen, move track sheet and Night track", "Tela de Jack, folha de movimento e trilha das Noites"),
        pages: [6, 7],
        items: [
          t("Jack takes a fresh move track sheet from the pad of 30 and slots it into the Jack the Ripper screen, facing him. He also needs a pencil (not included).", "Jack pega uma folha de movimento nova do bloco de 30 e a encaixa na tela de Jack, o Estripador, virada para ele. Ele também precisa de um lápis (não incluso)."),
          t("The sheet has four rows, one per Night, and a prominent oval at the top for the Hideout. The screen also shows a small map and the Coach/Alley chart.", "A folha tem quatro linhas, uma por Noite, e um oval destacado no topo para o Esconderijo. A tela também mostra um pequeno mapa e a tabela de Coach/Alley."),
          t("Jack puts one of the 2 black Jack pawns on the first Night space of the board's Night track. The second Jack pawn waits for the move track.", "Jack põe um dos 2 peões pretos de Jack no primeiro espaço de Noite da trilha das Noites do tabuleiro. O segundo peão de Jack espera pela trilha de movimento.")
        ]
      },
      {
        id: "hideout",
        title: t("Jack's secret Hideout", "O Esconderijo secreto de Jack"),
        pages: on("catchMe") ? [6, 23] : [6],
        items: [
          on("catchMe")
            ? t("Secret: Jack chooses any numbered circle as his Hideout except a red numbered circle or a numbered circle adjacent to a red one (Catch Me, If You Can).", "Segredo: Jack escolhe qualquer círculo numerado como Esconderijo, exceto um círculo numerado vermelho ou um círculo numerado adjacente a um vermelho (Pegue-me Se Puder).")
            : t("Secret: Jack chooses any numbered circle as his Hideout except a red numbered circle.", "Segredo: Jack escolhe qualquer círculo numerado como Esconderijo, exceto um círculo numerado vermelho."),
          t("He writes its number in the oval at the top of his sheet, behind the screen. Nobody else sees it; this guide never asks for it.", "Ele escreve o número no oval no topo da folha, atrás da tela. Ninguém mais vê; este guia nunca pergunta por ele."),
          t("Jack's goal each Night: kill, then return to this circle without being arrested.", "Objetivo de Jack em cada Noite: matar e voltar a este círculo sem ser preso."),
          on("catchMe") ? interpretation("“adjacent” is read as for Jack's own movement: the next numbered circle along a dotted line, passing only through Crossings.", "“adjacente” é lido como no movimento do próprio Jack: o próximo círculo numerado ao longo de uma linha pontilhada, passando só por Cruzamentos.") : ""
        ]
      },
      {
        id: "jack-supply",
        title: t("Jack's components", "Componentes de Jack"),
        pages: on("letters") || on("falseClues") ? [7, 22, 23] : [7],
        items: [
          t("Jack collects: the 5 red Crime Scene markers, the 19 yellow Clue markers, the 8 white Woman tokens (5 marked with red, 3 unmarked), the 5 Special Movement tokens (3 Coach + 2 Alley) and the red Time of the Crime token.", "Jack recolhe: os 5 marcadores vermelhos de Cena do Crime, os 19 marcadores amarelos de Pista, as 8 fichas brancas de Mulher (5 marcadas de vermelho, 3 sem marca), as 5 fichas de Movimento Especial (3 Coach + 2 Alley) e a ficha vermelha de Hora do Crime."),
          on("letters") ? t("Jack's Letters: Jack also takes the 4 Letter sheets — Dear Boss, Saucy Jacky, From Hell and Goulston Street. Their effects are printed on them.", "Cartas de Jack: Jack também pega as 4 folhas de Carta — Dear Boss, Saucy Jacky, From Hell e Goulston Street. Os efeitos estão impressos nelas.") : "",
          on("falseClues") ? t("False Clues: Jack also takes the 3 blue False Clue markers. He earns the right to use them during play.", "Pistas Falsas: Jack também pega os 3 marcadores azuis de Pista Falsa. Ele ganha o direito de usá-los durante o jogo.") : "",
          !on("letters") && !on("falseClues") ? t("Leave the 4 Letter sheets and the 3 blue False Clue markers in the box (optional rules not in use).", "Deixe as 4 folhas de Carta e os 3 marcadores azuis de Pista Falsa na caixa (regras opcionais fora de uso).") : "",
          on("letters") && !on("falseClues") ? t("Leave the 3 blue False Clue markers in the box.", "Deixe os 3 marcadores azuis de Pista Falsa na caixa.") : "",
          !on("letters") && on("falseClues") ? t("Leave the 4 Letter sheets in the box.", "Deixe as 4 folhas de Carta na caixa.") : ""
        ]
      },
      {
        id: "police-supply",
        title: t("Head of the Investigation tiles and police components", "Peças de Chefe da Investigação e componentes da polícia"),
        pages: [7],
        items: [
          t("A detective shuffles the 5 Head of the Investigation tiles and stacks them face down, in random order, on their space on the board.", "Um detetive embaralha as 5 peças de Chefe da Investigação e as empilha viradas para baixo, em ordem aleatória, no espaço delas no tabuleiro."),
          t("The detectives collect the 5 white Wretched pawns and the 7 black Police Patrol tokens (5 with a coloured face, 2 fake ones that are black on both sides).", "Os detetives recolhem os 5 peões brancos de Desgraçada (Wretched) e as 7 fichas pretas de Patrulha Policial (5 com uma face colorida, 2 falsas pretas dos dois lados)."),
          t("The game begins with Night 1, Hell phase 1.", "O jogo começa na Noite 1, fase 1 do Inferno.")
        ]
      }
    ];
  }

  function inventory() {
    const cards = [
      infoCard(t("BOARD & SHEETS", "TABULEIRO E FOLHAS"), t("Table", "Mesa"), [
        rl("Game board", "Whitechapel, 195 numbered circles; Night track, move track and Head of the Investigation space.", "Tabuleiro", "Whitechapel, 195 círculos numerados; trilha das Noites, trilha de movimento e espaço do Chefe da Investigação."),
        rl("Reference sheets", "6 — one per Policeman colour and one for Jack.", "Folhas de Referência", "6 — uma por cor de Policial e uma para Jack."),
        rl("Head of the Investigation tiles", "5, face down on the board.", "Peças de Chefe da Investigação", "5, viradas para baixo no tabuleiro.")
      ], [3, 7]),
      infoCard(t("JACK", "JACK"), t("Behind the screen", "Atrás da tela"), [
        rl("Screen + move track sheet + pencil", "one sheet per game (pad of 30); pencil not included.", "Tela + folha de movimento + lápis", "uma folha por partida (bloco de 30); lápis não incluso."),
        rl("Jack pawns", "2 black: Night track and move track.", "Peões de Jack", "2 pretos: trilha das Noites e trilha de movimento."),
        rl("Woman tokens", "8 (5 marked, 3 unmarked).", "Fichas de Mulher", "8 (5 marcadas, 3 sem marca)."),
        rl("Crime Scene markers", "5 red.", "Marcadores de Cena do Crime", "5 vermelhos."),
        rl("Clue markers", "19 yellow.", "Marcadores de Pista", "19 amarelos."),
        rl("Special Movement tokens", "3 Coach + 2 Alley.", "Fichas de Movimento Especial", "3 Coach + 2 Alley."),
        rl("Time of the Crime token", "1 red.", "Ficha de Hora do Crime", "1 vermelha."),
        on("letters") ? rl("Jack's Letters", "4 sheets.", "Cartas de Jack", "4 folhas.") : "",
        on("falseClues") ? rl("False Clue markers", "3 blue.", "Marcadores de Pista Falsa", "3 azuis.") : ""
      ], [3, 7]),
      infoCard(t("DETECTIVES", "DETETIVES"), t(`${detectives()} detective${detectives() === 1 ? "" : "s"}`, `${detectives()} detetive${detectives() === 1 ? "" : "s"}`), [
        rl("Policeman pawns", `5 (blue, yellow, brown, red, green) — ${splitText()}.`, "Peões de Policial", `5 (azul, amarelo, marrom, vermelho, verde) — ${splitText()}.`),
        rl("Police Patrol tokens", "7 black: 5 with a coloured face + 2 fake.", "Fichas de Patrulha Policial", "7 pretas: 5 com face colorida + 2 falsas."),
        rl("Wretched pawns", "5 white.", "Peões de Desgraçada", "5 brancos.")
      ], [3, 6, 7]),
      infoCard(t("LEFT IN THE BOX", "FICA NA CAIXA"), t("Not used in this match", "Não usado nesta partida"), [
        !on("letters") ? rl("Jack's Letters", "4 sheets.", "Cartas de Jack", "4 folhas.") : "",
        !on("falseClues") ? rl("False Clue markers", "3 blue.", "Marcadores de Pista Falsa", "3 azuis.") : "",
        on("letters") && on("falseClues") ? t("Nothing: every component is in use.", "Nada: todos os componentes estão em uso.") : ""
      ], [3])
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
        <label class="wc-setup-check" for="wc-setup-${phase.id}">
          <input id="wc-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="wc-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="wc-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), sectionIndex("setup"), [6, 7])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Preparing the Game", "Preparando o jogo")} · ${playersLabel()}</h3>
            <p>${t("One checkbox per coherent step, in the rulebook's order (its steps 1–10).", "Uma caixa por etapa coerente, na ordem do livro (os passos 1–10 dele).")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved on this device separately from the match options. Changing the players, Jack's Letters, False Clues or Catch Me, If You Can clears it; the other options and the language do not. “Uncheck all” clears only these setup boxes.",
          "O progresso é salvo neste aparelho separado das opções da partida. Mudar os jogadores, as Cartas de Jack, as Pistas Falsas ou Pegue-me Se Puder o limpa; as outras opções e o idioma não. “Desmarcar tudo” limpa somente estas caixas da preparação."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}`;
  }

  // ---------- quick reference ----------

  function nightTable() {
    return `
      <div class="wc-table-wrap">
        <table class="wc-night-table">
          <caption>${t("What changes from Night to Night (p. 9, 19–21)", "O que muda de Noite para Noite (p. 9, 19–21)")}</caption>
          <thead><tr>
            <th scope="col">${t("Night", "Noite")}</th>
            <th scope="col">${t("Woman tokens (marked)", "Fichas de Mulher (marcadas)")}</th>
            <th scope="col">${glyph("coach", "Coach", "Coach")} Coach</th>
            <th scope="col">${glyph("alley", "Alley", "Alley")} Alley</th>
            <th scope="col">${t("Victims", "Vítimas")}</th>
          </tr></thead>
          <tbody>${NIGHTS.map((night) => `
            <tr>
              <th scope="row">${t("Night", "Noite")} ${night.n}<small>${t(night.dateEn, night.datePt)}</small></th>
              <td>${night.women} (${night.marked})</td>
              <td>${night.coach}</td>
              <td>${night.alley}</td>
              <td>${night.kills}</td>
            </tr>`).join("")}</tbody>
        </table>
      </div>`;
  }

  function quickReference() {
    const cards = [
      infoCard(t("THE GAME", "A PARTIDA"), t("Four Nights, two parts each", "Quatro Noites, duas partes cada"), [
        rl("Hell", "Jack sets up targets, the police place Patrols, Jack kills (9 phases).", "Inferno", "Jack prepara os alvos, a polícia põe Patrulhas, Jack mata (9 fases)."),
        rl("Hunting", "Jack runs for his Hideout; the police chase (3 phases, repeated).", "Caçada", "Jack corre para o Esconderijo; a polícia persegue (3 fases, repetidas)."),
        rl("Jack wins", "5 victims and home safe after all four Nights.", "Jack vence", "5 vítimas e em casa a salvo depois das quatro Noites."),
        rl("Police win", "Jack arrested, or he fails to reach his Hideout by square 15, or he has no legal move.", "Polícia vence", "Jack preso, ou não chega ao Esconderijo até o quadrado 15, ou fica sem movimento legal."),
        on("knowAddress") ? rl("I Know Your Address", "or a correct one-shot guess of the Hideout.", "Sei Onde Você Mora", "ou um palpite único certo do Esconderijo.") : ""
      ], [8, 22]),
      infoCard(t("PART 1 · HELL", "PARTE 1 · INFERNO"), t("Phases 1–9", "Fases 1–9"), [
        `${jackTag()} ${rl("1 Preparing the Scene", "take this Night's Coach and Alley tokens.", "1 Preparando a Cena", "pegue as fichas de Coach e Alley desta Noite.")}`,
        `${jackTag()} ${rl("2 Targets", "place this Night's Woman tokens face down on red numbered circles (not on Crime Scenes).", "2 Alvos", "ponha as fichas de Mulher desta Noite viradas para baixo em círculos numerados vermelhos (não em Cenas do Crime).")}`,
        `${policeTag()} ${rl("3 Patrolling", "reveal the next Head of the Investigation tile; that player places the 7 Patrol tokens face down.", "3 Patrulhando", "revele a próxima peça de Chefe da Investigação; esse jogador põe as 7 fichas de Patrulha viradas para baixo.")}`,
        on("letters") ? `${optionalTag("Letters", "Cartas")} ${t("Nights 2–4: Jack may now play Dear Boss, Saucy Jacky or From Hell.", "Noites 2–4: Jack pode jogar agora Dear Boss, Saucy Jacky ou From Hell.")}` : "",
        on("knowAddress") ? `${optionalTag("I Know Your Address", "Sei Onde Você Mora")} ${t("Swanson or Abberline revealed: one guess at the Hideout, once per game.", "Swanson ou Abberline revelado: um palpite do Esconderijo, uma vez por partida.")}` : "",
        `${jackTag()} ${rl("4 Victims chosen", "flip the Women: marked → Wretched pawn, unmarked → removed. Time of the Crime on Roman I.", "4 Vítimas escolhidas", "vire as Mulheres: marcada → peão de Desgraçada, sem marca → removida. Hora do Crime no I romano.")}`,
        `${jackTag()} ${rl("5 Blood on the Streets", "kill (→ 8) or wait (→ 6). At Roman V you must kill.", "5 Sangue nas Ruas", "mate (→ 8) ou espere (→ 6). No V romano é obrigatório matar.")}`,
        `${policeTag()} ${rl("6 Suspense Grows", "Time of the Crime +1 numeral; the Head of the Investigation moves every Wretched one circle.", "6 O Suspense Cresce", "Hora do Crime +1 numeral; o Chefe da Investigação move cada Desgraçada um círculo.")}`,
        `${jackTag()} ${rl("7 Ready to Kill", "reveal one Patrol token (fake → removed); back to 5.", "7 Pronto para Matar", "revele uma ficha de Patrulha (falsa → removida); volte à 5.")}`,
        `${jackTag()} ${rl("8 A Corpse", "write the crime circle under the Time of the Crime numeral; second Jack pawn on that move-track space.", "8 Um Cadáver", "escreva o círculo do crime sob o numeral da Hora do Crime; segundo peão de Jack nesse espaço da trilha de movimento.")}`,
        `${policeTag()} ${rl("9 Alarm Whistles", "reveal the remaining Patrols; coloured → Policeman pawns, fakes and Wretched removed.", "9 Apitos de Alarme", "revele as Patrulhas restantes; coloridas → peões de Policial, falsas e Desgraçadas removidas.")}`
      ], [8, 24]),
      infoCard(t("PART 2 · HUNTING", "PARTE 2 · CAÇADA"), t("Repeat 1 → 2 → 3", "Repita 1 → 2 → 3"), [
        `${jackTag()} ${rl("1 Escape", "secretly write one adjacent numbered circle; Jack pawn +1 on the move track. Never through a Crossing with a Policeman pawn.", "1 Fuga", "escreva em segredo um círculo numerado adjacente; peão de Jack +1 na trilha de movimento. Nunca por um Cruzamento com peão de Policial.")}`,
        on("letters") ? `${optionalTag("Letters", "Cartas")} ${t("Goulston Street is played right after Jack's move.", "Goulston Street é jogada logo depois do movimento de Jack.")}` : "",
        `${policeTag()} ${rl("2 Hunting the Monster", "Head of the Investigation first, then clockwise: each Policeman pawn moves 0, 1 or 2 Crossings.", "2 Caçando o Monstro", "Chefe da Investigação primeiro, depois sentido horário: cada peão de Policial anda 0, 1 ou 2 Cruzamentos.")}`,
        on("falseClues") ? `${optionalTag("False Clues", "Pistas Falsas")} ${t("Start of phase 3: Jack may place an earned False Clue.", "Início da fase 3: Jack pode colocar uma Pista Falsa conquistada.")}` : "",
        `${policeTag()} ${rl("3 Clues and Suspicion", `same order: each pawn looks for clues ${on("areaArrests") ? "or makes an Area Arrest" : "or arrests"}${on("rushing") ? " or rushes" : ""}.`, "3 Pistas e Suspeitas", `mesma ordem: cada peão procura pistas ${on("areaArrests") ? "ou faz uma Prisão em Área" : "ou prende"}${on("rushing") ? " ou corre" : ""}.`)}`,
        rl("Escape", "Jack on his Hideout after a normal move may declare escape: the Night ends.", "Fuga", "Jack no Esconderijo depois de um movimento normal pode declarar a fuga: a Noite acaba."),
        rl("Night 3 only", "the Hunting starts with phase 2 (the second murder was Jack's first move).", "Só na Noite 3", "a Caçada começa pela fase 2 (o segundo crime foi o primeiro movimento de Jack).")
      ], [15, 16, 18, 21, 24]),
      infoCard(t("MOVEMENT", "MOVIMENTO"), t("Who moves where", "Quem anda onde"), [
        `${glyph("jack-pawn", "Jack pawn", "Peão de Jack")} ${rl("Jack", "one numbered circle to the next along dotted lines; may pass empty Crossings.", "Jack", "de um círculo numerado ao próximo pelas linhas pontilhadas; pode passar por Cruzamentos vazios.")}`,
        `${glyph("policeman-blue", "Policeman pawn", "Peão de Policial")} ${rl("Policemen", "up to 2 Crossings, ignoring numbered circles; may pass other pawns, never end on one.", "Policiais", "até 2 Cruzamentos, ignorando círculos numerados; podem passar por outros peões, nunca terminar sobre um.")}`,
        `${glyph("wretched", "Wretched pawn", "Peão de Desgraçada")} ${rl("Wretched", "one adjacent empty numbered circle; not next to or past a Patrol token, not onto a Crime Scene.", "Desgraçadas", "um círculo numerado adjacente vazio; não ao lado de nem passando por uma Patrulha, não sobre Cena do Crime.")}`
      ], [6, 13, 15, 16]),
      infoCard(t("POLICE ACTIONS", "AÇÕES DA POLÍCIA"), t("One per Policeman pawn", "Uma por peão de Policial"), [
        `${glyph("look-for-clues", "Look for clues", "Procurar pistas")} ${rl("Look for clues", "name adjacent circles one by one; the first that is in tonight's row gets a Clue marker and the action ends.", "Procurar pistas", "nomeie círculos adjacentes um a um; o primeiro que estiver na linha desta Noite recebe um marcador de Pista e a ação acaba.")}`,
        on("areaArrests")
          ? `${glyph("arrest", "Execute an arrest", "Executar prisão")} ${rl("Area Arrest", "name every adjacent circle; Jack's current circle among them → arrested.", "Prisão em Área", "nomeie todos os círculos adjacentes; o círculo atual de Jack entre eles → preso.")}`
          : `${glyph("arrest", "Execute an arrest", "Executar prisão")} ${rl("Arrest", "name ONE adjacent circle; Jack's current circle → arrested, otherwise no information.", "Prisão", "nomeie UM círculo adjacente; círculo atual de Jack → preso, senão nenhuma informação.")}`,
        on("rushing") ? rl("Rushing", "move the pawn to an adjacent Crossing instead.", "Corrida", "mova o peão a um Cruzamento adjacente em vez disso.") : "",
        rl("Adjacent", "linked to the pawn's Crossing by a dotted line with no other Crossing in between.", "Adjacente", "ligado ao Cruzamento do peão por uma linha pontilhada sem outro Cruzamento no meio."),
        on("falseClues") ? rl("False Clue circle", "cannot be searched or arrested in tonight.", "Círculo de Pista Falsa", "não pode ser vasculhado nem ter prisão nesta Noite.") : ""
      ], [16, 17, 18, 23]),
      infoCard(t("SPECIAL MOVEMENTS", "MOVIMENTOS ESPECIAIS"), t("Instead of a normal move", "No lugar de um movimento normal"), [
        `${glyph("coach", "Coach token", "Ficha de Coach")} ${rl("Coach", "two moves in one, both written; may pass Crossings with Policemen; three different circles; token covers 2 track spaces.", "Coach", "dois movimentos em um, ambos escritos; pode passar por Cruzamentos com Policiais; três círculos diferentes; a ficha cobre 2 espaços da trilha.")}`,
        `${glyph("alley", "Alley token", "Ficha de Alley")} ${rl("Alley", "cut through one block of houses to any other circle on its edge; 1 track space.", "Alley", "atravesse um quarteirão até qualquer outro círculo da borda dele; 1 espaço da trilha.")}`,
        rl("Never", "declare escape right after a Special Movement onto the Hideout.", "Nunca", "declare a fuga logo depois de um Movimento Especial até o Esconderijo.")
      ], [19, 20]),
      infoCard(t("NIGHT 3", "NOITE 3"), t("The double event", "O evento duplo"), [
        rl("Phase 5", "Jack kills two Wretched at once.", "Fase 5", "Jack mata duas Desgraçadas de uma vez."),
        rl("Sheet", "both circles in two consecutive cells, at the Time of the Crime and to its right, in either order.", "Folha", "os dois círculos em duas células seguidas, na Hora do Crime e à direita dela, em qualquer ordem."),
        rl("Start", "Jack is on the rightmost one; his pawn starts one space right of the Time of the Crime; the Hunting starts with phase 2.", "Início", "Jack está no da direita; o peão dele começa um espaço à direita da Hora do Crime; a Caçada começa pela fase 2.")
      ], [21]),
      infoCard(t("END OF A NIGHT", "FIM DE UMA NOITE"), t("After Jack declares his escape", "Depois que Jack declara a fuga"), [
        rl("Remove", `all Clue markers, the Special Movement tokens and the Jack pawn from the move track${on("falseClues") ? ", unused False Clues" : ""}.`, "Retire", `todos os marcadores de Pista, as fichas de Movimento Especial e o peão de Jack da trilha de movimento${on("falseClues") ? ", Pistas Falsas não usadas" : ""}.`),
        rl("Keep", "Policeman pawns and Crime Scene markers where they are.", "Mantenha", "peões de Policial e marcadores de Cena do Crime onde estão."),
        rl("Next", "Jack pawn to the next Night; start again at Hell phase 1.", "Depois", "peão de Jack para a próxima Noite; recomece na fase 1 do Inferno.")
      ], [18])
    ];
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), sectionIndex("quick-reference"), [8, 24])}
      ${nightTable()}
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- rules sections ----------

  function boardSection() {
    return `
      ${sectionHeading("board", t("The board and movement", "O tabuleiro e o movimento"), sectionIndex("board"), [6, 7, 15, 16, 17])}
      <p class="wc-lede">${t(
        "The board shows Whitechapel in 1888: 195 numbered circles linked by dotted lines (the streets). Small black squares on the dotted lines are Crossings. Jack and the Wretched live on the numbered circles; the Policemen live on the Crossings.",
        "O tabuleiro mostra Whitechapel em 1888: 195 círculos numerados ligados por linhas pontilhadas (as ruas). Os quadradinhos pretos sobre as linhas pontilhadas são Cruzamentos. Jack e as Desgraçadas vivem nos círculos numerados; os Policiais vivem nos Cruzamentos."
      )}</p>
      <div class="wc-board-legend">
        ${legendItem("numbered-circle", t("Numbered circle", "Círculo numerado"), t("Where Jack moves, hides and kills, and where the Wretched wander.", "Onde Jack anda, se esconde e mata, e onde as Desgraçadas vagam."), 6)}
        ${legendItem("red-numbered-circle", t("Red numbered circle", "Círculo numerado vermelho"), t("Where Jack places Woman tokens each Night. Never a Hideout.", "Onde Jack põe as fichas de Mulher a cada Noite. Nunca é Esconderijo."), 6)}
        ${legendItem("crossing", t("Crossing", "Cruzamento"), t("Where the Policeman pawns stand and move. Border colour does not matter for their movement.", "Onde os peões de Policial ficam e andam. A cor da borda não importa para o movimento deles."), 6)}
        ${legendItem("yellow-crossing", t("Yellow-bordered Crossing", "Cruzamento de borda amarela"), t("Where Police Patrol tokens may be placed on Night 1 (and the two “new” ones from Night 2).", "Onde as fichas de Patrulha podem ser postas na Noite 1 (e as duas “novas” a partir da Noite 2)."), 7)}
      </div>
      <div class="quick-grid">
        ${infoCard(t("JACK", "JACK"), t("Circle to circle", "De círculo em círculo"), [
          t("Each move goes from his numbered circle to an adjacent numbered circle, following the dotted lines.", "Cada movimento vai do círculo numerado dele a um círculo numerado adjacente, seguindo as linhas pontilhadas."),
          t("The line may run through Crossings, but never through a Crossing occupied by a Policeman pawn (only a Coach may).", "A linha pode passar por Cruzamentos, mas nunca por um Cruzamento ocupado por peão de Policial (só um Coach pode)."),
          interpretation("adjacent = the next numbered circle along a dotted line; the rulebook's Wretched example (circle 65 has seven neighbours, some beyond Crossings) confirms Crossings in between do not break adjacency for circle-to-circle movement.", "adjacente = o próximo círculo numerado ao longo de uma linha pontilhada; o exemplo das Desgraçadas no livro (o círculo 65 tem sete vizinhos, alguns depois de Cruzamentos) confirma que Cruzamentos no caminho não quebram a adjacência no movimento de círculo a círculo."),
          t("Jack's pawn on the board is only a counter on the move track: his real position is secret, on his sheet.", "O peão de Jack no tabuleiro é só um contador na trilha de movimento: a posição real é secreta, na folha dele.")
        ], [6, 15], "wc-jack-card")}
        ${infoCard(t("POLICEMEN", "POLICIAIS"), t("Crossing to Crossing", "De Cruzamento em Cruzamento"), [
          t("Each Policeman pawn moves 0, 1 or 2 Crossings along the dotted lines, ignoring the numbered circles it passes.", "Cada peão de Policial anda 0, 1 ou 2 Cruzamentos pelas linhas pontilhadas, ignorando os círculos numerados por onde passa."),
          t("It may pass over another Policeman pawn but may not end on the same Crossing.", "Pode passar por cima de outro peão de Policial, mas não pode terminar no mesmo Cruzamento."),
          t("Its adjacent circles (for clues and arrests) are those linked to its Crossing by a dotted line with no other Crossing in between.", "Os círculos adjacentes dele (para pistas e prisões) são os ligados ao seu Cruzamento por uma linha pontilhada sem outro Cruzamento no meio.")
        ], [6, 16, 17], "wc-police-card")}
        ${infoCard(t("WRETCHED", "DESGRAÇADAS"), t("Wander alone", "Vagam sozinhas"), [
          t("Moved by the Head of the Investigation in Hell phase 6, one adjacent unoccupied numbered circle each.", "Movidas pelo Chefe da Investigação na fase 6 do Inferno, um círculo numerado adjacente desocupado cada."),
          t("They may not end next to a Police Patrol token, pass through one, or end on a Crime Scene marker.", "Não podem terminar ao lado de uma ficha de Patrulha, passar por uma nem terminar sobre um marcador de Cena do Crime."),
          t("With no legal move, a Wretched stays put.", "Sem movimento legal, a Desgraçada fica onde está.")
        ], [6, 13])}
        ${infoCard(t("TRACKS ON THE BOARD", "TRILHAS DO TABULEIRO"), t("Night track and move track", "Trilha das Noites e trilha de movimento"), [
          rl("Night track", "four spaces; one Jack pawn shows the current Night.", "Trilha das Noites", "quatro espaços; um peão de Jack mostra a Noite atual."),
          rl("Move track", "yellow Roman numerals V–IV–III–II–I, then 1 to 15, left to right — the same layout as each row of Jack's sheet.", "Trilha de movimento", "numerais romanos amarelos V–IV–III–II–I, depois 1 a 15, da esquerda para a direita — o mesmo desenho de cada linha da folha de Jack."),
          rl("Time of the Crime", "starts on I and moves to the next higher numeral (leftwards) each time Jack waits.", "Hora do Crime", "começa no I e vai ao numeral seguinte (para a esquerda) a cada vez que Jack espera."),
          interpretation("so every wait gives Jack one more space before square 15: a murder at I leaves 15 moves, at II 16, … at V 19.", "assim cada espera dá a Jack mais um espaço antes do quadrado 15: um crime no I deixa 15 movimentos, no II 16, … no V 19.")
        ], [6, 11, 14, 15])}
        ${on("letters") ? infoCard(t("BOARD SECTIONS", "SEÇÕES DO TABULEIRO"), t("Used by Jack's Letters", "Usadas pelas Cartas de Jack"), [
          t("The Letters name board sections such as A/a, B/b or C/b, and Goulston Street is the red-bordered Crossing at A5/b8.", "As Cartas nomeiam seções do tabuleiro como A/a, B/b ou C/b, e Goulston Street é o Cruzamento de borda vermelha em A5/b8."),
          interpretation("the rulebook does not explain this grid; use the letters and numbers printed along the board's edges.", "o livro não explica essa grade; use as letras e números impressos nas bordas do tabuleiro.")
        ], [12, 22]) : ""}
      </div>`;
  }

  function legendItem(file, title, text, page) {
    return `
      <article class="icon-card wc-legend-card">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}.webp" alt="${title}"></span>
        <div><strong>${title}</strong><p>${text}</p>${referenceLink(page)}</div>
      </article>`;
  }

  function winningSection() {
    return `
      ${sectionHeading("winning", t("Goal of the game and winning", "Objetivo do jogo e vitória"), sectionIndex("winning"), [3, 22])}
      <p class="wc-lede">${t(
        "One player is Jack the Ripper; the others are police detectives who cooperate. Jack must take five victims over four Nights, returning to his Hideout each Night without being caught.",
        "Um jogador é Jack, o Estripador; os outros são detetives que cooperam. Jack precisa fazer cinco vítimas em quatro Noites, voltando ao Esconderijo a cada Noite sem ser pego."
      )}</p>
      <div class="quick-grid">
        ${infoCard(t("JACK THE RIPPER", "JACK, O ESTRIPADOR"), t("Wins if…", "Vence se…"), [
          t("he kills five victims (1 + 1 + 2 + 1 across the Nights) without being caught, and", "matar cinco vítimas (1 + 1 + 2 + 1 nas Noites) sem ser pego, e"),
          t("he gets back to his Hideout safely at the end of all four Nights.", "voltar a salvo ao Esconderijo ao fim das quatro Noites.")
        ], [3, 22], "victory-card wc-jack-card")}
        ${infoCard(t("POLICE DETECTIVES", "DETETIVES DA POLÍCIA"), t("Win if…", "Vencem se…"), [
          t("they arrest Jack (an arrest names his current circle), or", "prenderem Jack (uma prisão nomeia o círculo atual dele), ou"),
          t("Jack fails to reach his Hideout and declare his escape by square 15 of his sheet, or", "Jack não chegar ao Esconderijo e declarar a fuga até o quadrado 15 da folha, ou"),
          t("Jack cannot make a legal move in Hunting phase 1.", "Jack não puder fazer um movimento legal na fase 1 da Caçada."),
          on("knowAddress") ? t("I Know Your Address: Swanson or Abberline guesses the Hideout correctly.", "Sei Onde Você Mora: Swanson ou Abberline acerta o Esconderijo.") : ""
        ], on("knowAddress") ? [15, 18, 22, 23] : [15, 18, 22], "victory-card wc-police-card")}
        ${infoCard(t("SECRETS", "SEGREDOS"), t("Who knows what", "Quem sabe o quê"), [
          rl("Only Jack", "his Hideout, his route on the sheet, which Woman tokens are marked (until phase 4) and, on Night 3, which crime came first.", "Só Jack", "o Esconderijo, a rota na folha, quais fichas de Mulher são marcadas (até a fase 4) e, na Noite 3, qual crime veio primeiro."),
          rl("Only the Head of the Investigation", "which Patrol tokens are real and their colours (until revealed).", "Só o Chefe da Investigação", "quais fichas de Patrulha são reais e as cores delas (até serem reveladas)."),
          rl("Everyone", "the Crime Scenes, Clue markers, Policeman pawns, used Special Movement tokens and Jack's move count.", "Todos", "as Cenas do Crime, os marcadores de Pista, os peões de Policial, as fichas de Movimento Especial usadas e a contagem de movimentos de Jack."),
          t("Detectives talk tactics openly in front of Jack.", "Os detetives discutem táticas abertamente na frente de Jack.")
        ], [9, 10, 21, 22])}
      </div>`;
  }

  function nightsSection() {
    return `
      ${sectionHeading("nights", t("The four Nights", "As quatro Noites"), sectionIndex("nights"), [8, 9, 19, 20, 21])}
      <p class="wc-lede">${t(
        "Each Night is one historical murder date and has two parts: Hell (phases 1–9, the set-up and the murder) and Hunting (phases 1–3 repeated, the escape). Each phase is run by Jack or by the Police, marked here with the rulebook's red top hat or black police helmet.",
        "Cada Noite é uma data histórica de assassinato e tem duas partes: Inferno (fases 1–9, a preparação e o crime) e Caçada (fases 1–3 repetidas, a fuga). Cada fase é conduzida por Jack ou pela Polícia, marcada aqui com a cartola vermelha ou o capacete preto de policial do livro."
      )}</p>
      ${nightTable()}
      <div class="quick-grid">
        ${infoCard(t("WOMAN TOKENS", "FICHAS DE MULHER"), t("Why the numbers drop", "Por que os números caem"), [
          t("Each victim sends one marked Woman token back to the box, so the marked tokens run 5 → 4 → 3 → 1; the 3 unmarked fakes are used every Night.", "Cada vítima manda uma ficha de Mulher marcada de volta à caixa, então as marcadas vão 5 → 4 → 3 → 1; as 3 falsas sem marca são usadas toda Noite."),
          t("Night 4 has a single marked token: one Wretched, one victim.", "A Noite 4 tem uma única ficha marcada: uma Desgraçada, uma vítima.")
        ], [9, 12])}
        ${infoCard(t("HEAD OF THE INVESTIGATION", "CHEFE DA INVESTIGAÇÃO"), t("A new one each Night", "Um novo a cada Noite"), [
          t("At Hell phase 3 the detectives turn over the top tile of the pile; the player controlling the Policeman of that colour leads for the Night.", "Na fase 3 do Inferno os detetives viram a peça do topo da pilha; o jogador que controla o Policial dessa cor lidera na Noite."),
          t("They place the Patrols, move the Wretched, and act first in Hunting phases 2 and 3.", "Ele põe as Patrulhas, move as Desgraçadas e age primeiro nas fases 2 e 3 da Caçada."),
          interpretation("one of the five tiles is never revealed (four Nights).", "uma das cinco peças nunca é revelada (quatro Noites).")
        ], [10, 16])}
      </div>`;
  }

  function hellSection() {
    const cards = [
      infoCard(`${jackTag()} ${t("PHASE 1", "FASE 1")}`, t("Preparing the Scene", "Preparando a Cena"), [
        t("Jack takes this Night's Special Movement tokens (see the table): 3 Coach + 2 Alley on Night 1, 2 + 2 on Night 2, 2 + 1 on Night 3, 1 + 1 on Night 4.", "Jack pega as fichas de Movimento Especial desta Noite (veja a tabela): 3 Coach + 2 Alley na Noite 1, 2 + 2 na Noite 2, 2 + 1 na Noite 3, 1 + 1 na Noite 4.")
      ], [9]),
      infoCard(`${jackTag()} ${t("PHASE 2", "FASE 2")}`, t("The Targets are Identified", "Os Alvos são Identificados"), [
        t("Jack takes this Night's Woman tokens: 8 (5 marked), 7 (4), 6 (3), 4 (1).", "Jack pega as fichas de Mulher desta Noite: 8 (5 marcadas), 7 (4), 6 (3), 4 (1)."),
        t("He places them face down on red numbered circles, arranged as he wishes. Only he knows which are marked.", "Ele as põe viradas para baixo em círculos numerados vermelhos, como quiser. Só ele sabe quais são marcadas."),
        rl("Marked (red face)", "a possible victim. Unmarked: a decoy.", "Marcada (face vermelha)", "uma possível vítima. Sem marca: isca."),
        rl("Nights 2–4", "never on a red circle that holds a Crime Scene marker.", "Noites 2–4", "nunca num círculo vermelho com marcador de Cena do Crime.")
      ], [9, 10]),
      infoCard(`${policeTag()} ${t("PHASE 3", "FASE 3")}`, t("Patrolling the Streets", "Patrulhando as Ruas"), [
        t("Turn over the top Head of the Investigation tile; that player is Head of the Investigation for this Night.", "Vire a peça do topo de Chefe da Investigação; esse jogador é o Chefe da Investigação desta Noite."),
        t("They place the 7 Police Patrol tokens face down; only they know which are real (coloured face) and which 2 are fake (all black).", "Ele põe as 7 fichas de Patrulha viradas para baixo; só ele sabe quais são reais (face colorida) e quais 2 são falsas (toda preta)."),
        rl("Night 1", "on any yellow-bordered Crossings.", "Noite 1", "em quaisquer Cruzamentos de borda amarela."),
        rl("Nights 2–4 · five tokens", "on the Crossings where the Policeman pawns stood at the end of the previous Night — any token, real or fake, any colour.", "Noites 2–4 · cinco fichas", "nos Cruzamentos onde os peões de Policial estavam no fim da Noite anterior — qualquer ficha, real ou falsa, de qualquer cor."),
        rl("Nights 2–4 · two tokens", "on yellow-bordered Crossings not occupied by a Policeman pawn at the end of the previous Night.", "Noites 2–4 · duas fichas", "em Cruzamentos de borda amarela não ocupados por peão de Policial no fim da Noite anterior."),
        interpretation("lift each Policeman pawn off the board as a token takes its place; the pawns return in phase 9.", "tire cada peão de Policial do tabuleiro quando uma ficha ocupar o lugar dele; os peões voltam na fase 9."),
        on("knowAddress") ? `${optionalTag("I Know Your Address", "Sei Onde Você Mora")} ${t("If the tile revealed is Swanson (brown) or Abberline (red), that detective may immediately name any numbered circle. If it is Jack's Hideout, the detectives win. Usable once per game.", "Se a peça revelada for Swanson (marrom) ou Abberline (vermelho), esse detetive pode nomear na hora qualquer círculo numerado. Se for o Esconderijo de Jack, os detetives vencem. Uso único por partida.")}` : "",
        on("letters") ? `${optionalTag("Jack's Letters", "Cartas de Jack")} ${t("Nights 2–4, after the Patrols are placed: Jack may play Dear Boss, Saucy Jacky or From Hell (see Optional rules).", "Noites 2–4, depois de postas as Patrulhas: Jack pode jogar Dear Boss, Saucy Jacky ou From Hell (veja Regras opcionais).")}` : ""
      ], on("knowAddress") || on("letters") ? [10, 11, 22, 23] : [10, 11]),
      infoCard(`${jackTag()} ${t("PHASE 4", "FASE 4")}`, t("The Victims are Chosen", "As Vítimas são Escolhidas"), [
        t("Turn every Woman token face up.", "Vire todas as fichas de Mulher para cima."),
        rl("Marked", "replace it with a Wretched pawn.", "Marcada", "troque-a por um peão de Desgraçada."),
        rl("Unmarked", "simply remove it.", "Sem marca", "simplesmente retire-a."),
        t("Place the Time of the Crime token on the yellow Roman numeral I of the move track.", "Ponha a ficha de Hora do Crime no numeral romano amarelo I da trilha de movimento.")
      ], [11]),
      infoCard(`${jackTag()} ${t("PHASE 5", "FASE 5")}`, t("Blood on the Streets", "Sangue nas Ruas"), [
        rl("Kill", "choose a Wretched pawn and replace it with a Crime Scene marker; return that Wretched and one marked Woman token to the box; go to phase 8.", "Matar", "escolha um peão de Desgraçada e troque-o por um marcador de Cena do Crime; devolva essa Desgraçada e uma ficha de Mulher marcada à caixa; vá à fase 8."),
        rl("Wait", "go to phase 6. Waiting gives more moves to escape, but the Wretched move and a Patrol is revealed.", "Esperar", "vá à fase 6. Esperar dá mais movimentos para fugir, mas as Desgraçadas andam e uma Patrulha é revelada."),
        rl("Time of the Crime on V", "Jack can no longer wait: he must kill.", "Hora do Crime no V", "Jack não pode mais esperar: tem de matar."),
        rl("Night 3", "two victims at once (see Third Night).", "Noite 3", "duas vítimas de uma vez (veja Terceira Noite).")
      ], [12]),
      infoCard(`${policeTag()} ${t("PHASE 6", "FASE 6")}`, t("Suspense Grows", "O Suspense Cresce"), [
        t("Move the Time of the Crime token to the next yellow Roman numeral in ascending order (I → II → III → IV → V).", "Mova a ficha de Hora do Crime ao próximo numeral romano amarelo em ordem crescente (I → II → III → IV → V)."),
        t("The Head of the Investigation must move each Wretched pawn along dotted lines to an adjacent unoccupied numbered circle.", "O Chefe da Investigação tem de mover cada peão de Desgraçada pelas linhas pontilhadas até um círculo numerado adjacente desocupado."),
        rl("Not allowed", "ending adjacent to a Patrol token, crossing a Patrol token, ending on a Crime Scene.", "Proibido", "terminar adjacente a uma ficha de Patrulha, cruzar uma ficha de Patrulha, terminar sobre uma Cena do Crime."),
        rl("Stuck", "a Wretched with no legal move stays.", "Presa", "uma Desgraçada sem movimento legal fica."),
        interpretation("a Patrol token sits on a Crossing, so “adjacent to a Patrol” means a circle linked to that Crossing with no other Crossing in between, as for a Policeman pawn.", "uma ficha de Patrulha fica num Cruzamento, então “adjacente a uma Patrulha” é um círculo ligado a esse Cruzamento sem outro Cruzamento no meio, como para um peão de Policial.")
      ], [13]),
      infoCard(`${jackTag()} ${t("PHASE 7", "FASE 7")}`, t("Ready to Kill", "Pronto para Matar"), [
        t("Jack chooses one Police Patrol token and reveals it.", "Jack escolhe uma ficha de Patrulha e a revela."),
        rl("Fake (black face)", "removed from the board.", "Falsa (face preta)", "sai do tabuleiro."),
        rl("Coloured", "stays on the board face up.", "Colorida", "fica no tabuleiro virada para cima."),
        t("Then go back to phase 5.", "Depois volte à fase 5.")
      ], [13, 14]),
      infoCard(`${jackTag()} ${t("PHASE 8", "FASE 8")}`, t("A Corpse on the Sidewalk", "Um Cadáver na Calçada"), [
        t("In pencil, Jack writes the number of the circle with the new Crime Scene marker on his sheet: in the current Night's row, in the cell under the Roman numeral the Time of the Crime token marks.", "A lápis, Jack escreve o número do círculo com o novo marcador de Cena do Crime na folha: na linha da Noite atual, na célula sob o numeral romano que a ficha de Hora do Crime marca."),
        t("Jack is now on that circle (publicly known).", "Jack está agora nesse círculo (conhecido por todos)."),
        t("He puts the second Jack pawn on the move-track space marked by the Time of the Crime token.", "Ele põe o segundo peão de Jack no espaço da trilha de movimento marcado pela ficha de Hora do Crime.")
      ], [14]),
      infoCard(`${policeTag()} ${t("PHASE 9", "FASE 9")}`, t("Alarm Whistles", "Apitos de Alarme"), [
        t("Reveal every Patrol token not yet revealed.", "Revele todas as fichas de Patrulha ainda não reveladas."),
        rl("Coloured tokens", "replace each with the Policeman pawn of that colour.", "Fichas coloridas", "troque cada uma pelo peão de Policial dessa cor."),
        rl("Fake tokens", "remove them.", "Fichas falsas", "retire-as."),
        rl("Wretched", "remove any still on the board.", "Desgraçadas", "retire as que ainda estiverem no tabuleiro."),
        t("The Hunting begins.", "A Caçada começa.")
      ], [14, 15])
    ];
    return `
      ${sectionHeading("hell", t("First part: Hell", "Primeira parte: Inferno"), sectionIndex("hell"), [9, 10, 11, 12, 13, 14])}
      <p class="wc-lede">${t("Play phases 1 to 9 in order. Phases 5 → 6 → 7 loop while Jack waits; a kill jumps from 5 to 8.", "Jogue as fases 1 a 9 em ordem. As fases 5 → 6 → 7 se repetem enquanto Jack espera; um crime pula da 5 para a 8.")}</p>
      <div class="quick-grid wc-phase-grid">${cards.join("")}</div>`;
  }

  function huntingSection() {
    const cards = [
      infoCard(`${jackTag()} ${t("PHASE 1", "FASE 1")}`, t("Escape in the Night", "Fuga na Noite"), [
        t("Jack secretly picks an adjacent numbered circle and writes it in the next empty cell to the right in tonight's row.", "Jack escolhe em segredo um círculo numerado adjacente e o escreve na próxima célula vazia à direita na linha desta Noite."),
        t("Then he moves his Jack pawn one space right on the move track.", "Depois avança o peão de Jack um espaço à direita na trilha de movimento."),
        rl("Blocked", "he may not move over a Crossing with a Policeman pawn. With no legal move, Jack loses.", "Bloqueio", "ele não pode passar por um Cruzamento com peão de Policial. Sem movimento legal, Jack perde."),
        rl("Special Movement", "he may spend a Coach or Alley token instead (see Special Movements).", "Movimento Especial", "ele pode gastar uma ficha de Coach ou Alley em vez disso (veja Movimentos Especiais)."),
        rl("Hideout", "if this normal move ends on his Hideout he may declare his escape: the Hunting and the Night end.", "Esconderijo", "se este movimento normal terminar no Esconderijo ele pode declarar a fuga: a Caçada e a Noite acabam."),
        rl("Square 15", "if he fills square 15 without having reached his Hideout and declared, he loses.", "Quadrado 15", "se preencher o quadrado 15 sem ter chegado ao Esconderijo e declarado, ele perde."),
        on("letters") ? `${optionalTag("Goulston Street", "Goulston Street")} ${t("Played right after this move, before any Policeman moves.", "Jogada logo depois deste movimento, antes de qualquer Policial andar.")}` : ""
      ], [15, 16, 18]),
      infoCard(`${policeTag()} ${t("PHASE 2", "FASE 2")}`, t("Hunting the Monster", "Caçando o Monstro"), [
        t("The detectives consult, then move their Policeman pawns: the Head of the Investigation first, then clockwise. A player with several pawns chooses their order.", "Os detetives conversam e depois movem os peões de Policial: o Chefe da Investigação primeiro, depois sentido horário. Quem tem vários peões escolhe a ordem."),
        rl("Distance", "0, 1 or 2 Crossings along dotted lines, ignoring numbered circles.", "Distância", "0, 1 ou 2 Cruzamentos pelas linhas pontilhadas, ignorando os círculos numerados."),
        rl("Other pawns", "may be passed over; never share a Crossing at the end.", "Outros peões", "podem ser ultrapassados; nunca dividir um Cruzamento no fim.")
      ], [16]),
      infoCard(`${policeTag()} ${t("PHASE 3", "FASE 3")}`, t("Clues and Suspicion", "Pistas e Suspeitas"), [
        on("falseClues") ? `${optionalTag("False Clues", "Pistas Falsas")} ${t("At the start of this phase Jack may place one earned False Clue marker on any numbered circle.", "No início desta fase Jack pode colocar um marcador de Pista Falsa conquistado em qualquer círculo numerado.")}` : "",
        t(`Head of the Investigation first, then clockwise: for each Policeman pawn they control, the detective declares ${on("rushing") ? "looking for clues, executing an arrest or rushing" : "looking for clues or executing an arrest"}.`, `Chefe da Investigação primeiro, depois sentido horário: para cada peão de Policial que controla, o detetive declara ${on("rushing") ? "procurar pistas, executar uma prisão ou correr" : "procurar pistas ou executar uma prisão"}.`),
        rl("One action per pawn", "a player with several pawns may choose a different action for each.", "Uma ação por peão", "quem tem vários peões pode escolher uma ação diferente para cada."),
        rl("Where", "only in numbered circles adjacent to the pawn: directly linked to its Crossing, with no Crossing in between.", "Onde", "só em círculos numerados adjacentes ao peão: ligados diretamente ao Cruzamento dele, sem Cruzamento no meio."),
        rl("Then", "if Jack is neither caught nor home, go back to phase 1.", "Depois", "se Jack não foi pego nem chegou em casa, volte à fase 1.")
      ], [16, 17, 18])
    ];
    const actions = [
      actionCard("look-for-clues", t("Looking for clues", "Procurar pistas"), [
        t("Announce one adjacent numbered circle.", "Anuncie um círculo numerado adjacente."),
        t("Jack checks tonight's row on his sheet: if the number is anywhere in it, he puts a yellow Clue marker on that circle and the action ends.", "Jack confere a linha desta Noite na folha: se o número estiver em qualquer lugar dela, ele põe um marcador amarelo de Pista nesse círculo e a ação acaba."),
        t("If not, announce another adjacent circle. Repeat until a Clue is placed or no adjacent circle is left.", "Se não, anuncie outro círculo adjacente. Repita até uma Pista ser colocada ou não sobrar círculo adjacente."),
        t("A Clue says Jack was there tonight — not when.", "Uma Pista diz que Jack esteve ali nesta Noite — não quando."),
        on("falseClues") ? `${optionalTag("False Clues", "Pistas Falsas")} ${t("For every 5 Clue markers Jack reveals in the same Night, he gains a False Clue.", "A cada 5 marcadores de Pista que Jack revela na mesma Noite, ele ganha uma Pista Falsa.")}` : ""
      ], on("falseClues") ? [17, 18] : [17]),
      actionCard("arrest", on("areaArrests") ? t("Area Arrest", "Prisão em Área") : t("Executing an arrest", "Executar uma prisão"), on("areaArrests")
        ? [
          `${optionalTag("Area Arrests", "Prisões em Área")} ${t("Announce all the numbered circles adjacent to the pawn.", "Anuncie todos os círculos numerados adjacentes ao peão.")}`,
          t("If any of them is Jack's current location (the latest number on his sheet), Jack is arrested and loses.", "Se algum deles for a posição atual de Jack (o número mais recente na folha), Jack é preso e perde."),
          t("Otherwise no information is given and the action ends.", "Senão nenhuma informação é dada e a ação acaba.")
        ]
        : [
          t("Announce one — and only one — adjacent numbered circle.", "Anuncie um — e só um — círculo numerado adjacente."),
          t("If it is Jack's current location (the latest number on his sheet), Jack is arrested and loses.", "Se for a posição atual de Jack (o número mais recente na folha), Jack é preso e perde."),
          t("Otherwise no further information is given and the action ends.", "Senão nenhuma outra informação é dada e a ação acaba.")
        ], on("areaArrests") ? [18, 23] : [18]),
      on("rushing") ? actionCard("policeman-yellow", t("Rushing", "Corrida (Rushing)"), [
        `${optionalTag("Rushing", "Corrida")} ${t("Choose a Policeman pawn that can still act and move it to an adjacent Crossing, ignoring numbered circles.", "Escolha um peão de Policial que ainda pode agir e mova-o a um Cruzamento adjacente, ignorando círculos numerados.")}`,
        t("That is its action: no clue search or arrest.", "Essa é a ação dele: nada de busca de pista ou prisão."),
        interpretation("it still may not end on another Policeman pawn's Crossing.", "ele ainda não pode terminar no Cruzamento de outro peão de Policial.")
      ], [23]) : ""
    ];
    return `
      ${sectionHeading("hunting", t("Second part: Hunting", "Segunda parte: Caçada"), sectionIndex("hunting"), [15, 16, 17, 18])}
      <p class="wc-lede">${t("Repeat phases 1 → 2 → 3 until Jack declares his escape, is arrested or runs out of moves.", "Repita as fases 1 → 2 → 3 até Jack declarar a fuga, ser preso ou ficar sem movimentos.")}</p>
      <div class="quick-grid wc-phase-grid">${cards.join("")}</div>
      <div class="wc-action-grid">${actions.join("")}</div>`;
  }

  function actionCard(file, title, lines, pages) {
    return `
      <article class="icon-card wc-action-card">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}.webp" alt="${title}"></span>
        <div><strong>${title}</strong>${lineList(lines)}${pages.map(referenceLink).join(" ")}</div>
      </article>`;
  }

  function specialSection() {
    return `
      ${sectionHeading("special", t("Special Movements", "Movimentos Especiais"), sectionIndex("special"), [19, 20])}
      <div class="quick-grid">
        ${infoCard(t("GENERAL", "GERAL"), t("Coach and Alley tokens", "Fichas de Coach e Alley"), [
          t("Instead of a normal move, Jack may spend one Special Movement token in Hunting phase 1.", "Em vez de um movimento normal, Jack pode gastar uma ficha de Movimento Especial na fase 1 da Caçada."),
          t("The token is placed on the move-track space(s) of that move and cannot be used again this Night.", "A ficha é posta no(s) espaço(s) da trilha de movimento desse movimento e não pode ser usada de novo nesta Noite."),
          t("Once played, its effect must be applied — no switching back to a normal move.", "Uma vez jogada, o efeito tem de ser aplicado — nada de voltar a um movimento normal."),
          rl("Important", "Jack cannot declare his escape after a Special Movement onto his Hideout: the move that brings him home must be a normal one.", "Importante", "Jack não pode declarar a fuga depois de um Movimento Especial até o Esconderijo: o movimento que o leva para casa tem de ser normal.")
        ], [19])}
      </div>
      <div class="wc-action-grid">
        ${actionCard("coach", "Coach", [
          t("Move to two adjacent numbered circles in succession, like a double move.", "Ande até dois círculos numerados adjacentes em sequência, como um movimento duplo."),
          t("May pass through Crossings with Policeman pawns.", "Pode passar por Cruzamentos com peões de Policial."),
          t("Start, first and second circle must all be different.", "O círculo de partida, o primeiro e o segundo têm de ser todos diferentes."),
          t("Write both circles in order, in separate cells; the Jack pawn moves two spaces and the Coach token covers both.", "Escreva os dois círculos em ordem, em células separadas; o peão de Jack anda dois espaços e a ficha de Coach cobre os dois."),
          t("Per Night: 3, 2, 2, 1.", "Por Noite: 3, 2, 2, 1.")
        ], [19])}
        ${actionCard("alley", "Alley", [
          t("Cross one block of houses: from a numbered circle on the block's edge to any other numbered circle on that edge.", "Atravesse um quarteirão: de um círculo numerado na borda do quarteirão a qualquer outro círculo numerado dessa borda."),
          t("A block is an area completely bounded — and not crossed — by dotted lines.", "Um quarteirão é uma área totalmente cercada — e não atravessada — por linhas pontilhadas."),
          t("Write the circle in the next cell; the Alley token goes on that track space; the Jack pawn moves one space.", "Escreva o círculo na próxima célula; a ficha de Alley vai nesse espaço da trilha; o peão de Jack anda um espaço."),
          t("Per Night: 2, 2, 1, 1.", "Por Noite: 2, 2, 1, 1."),
          interpretation("an Alley does not follow streets, so Policeman pawns on the block's Crossings do not block it.", "um Alley não segue as ruas, então peões de Policial nos Cruzamentos do quarteirão não o bloqueiam.")
        ], [20])}
      </div>`;
  }

  function doubleEventSection() {
    return `
      ${sectionHeading("double-event", t("The Third Night: the double event", "A Terceira Noite: o evento duplo"), sectionIndex("double-event"), [21])}
      <div class="quick-grid">
        ${infoCard(t("SEPTEMBER 30TH", "30 DE SETEMBRO"), t("Two murders", "Dois assassinatos"), [
          t("Normal procedure, except that in phase 5 Jack kills two Wretched instead of one, replacing each with a Crime Scene marker.", "Procedimento normal, exceto que na fase 5 Jack mata duas Desgraçadas em vez de uma, trocando cada uma por um marcador de Cena do Crime."),
          t("He writes the two circle numbers in two consecutive cells: the one marked by the Time of the Crime token and the one to its right, in either order.", "Ele escreve os dois números em duas células seguidas: a marcada pela ficha de Hora do Crime e a seguinte à direita, em qualquer ordem."),
          t("Jack starts his escape from the rightmost number. The detectives know both Crime Scenes but not their order.", "Jack começa a fuga pelo número da direita. Os detetives conhecem as duas Cenas do Crime, mas não a ordem."),
          t("The Jack pawn goes on the move-track space right of the Time of the Crime token: going from the first crime to the second used up his first move.", "O peão de Jack vai no espaço da trilha à direita da ficha de Hora do Crime: ir do primeiro crime ao segundo gastou o primeiro movimento."),
          t("So the Hunting starts with phase 2 (police move), then continues normally.", "Por isso a Caçada começa pela fase 2 (a polícia anda) e depois segue normalmente."),
          interpretation("as in any Night, Jack must kill once the Time of the Crime reaches V; on Night 3 that means two victims.", "como em qualquer Noite, Jack tem de matar quando a Hora do Crime chega ao V; na Noite 3 isso significa duas vítimas.")
        ], [21])}
      </div>`;
  }

  function endNightSection() {
    return `
      ${sectionHeading("end-night", t("End of the Hunting, the Night and the game", "Fim da Caçada, da Noite e da partida"), sectionIndex("end-night"), [18, 22])}
      <div class="quick-grid">
        ${infoCard(t("ESCAPE DECLARED", "FUGA DECLARADA"), t("Clean up", "Limpeza"), [
          t("Jack on his Hideout may declare his escape: the Hunting and the Night end.", "Jack no Esconderijo pode declarar a fuga: a Caçada e a Noite acabam."),
          rl("Remove", "all Clue markers from the board; the Special Movement tokens and the Jack pawn from the move track.", "Retire", "todos os marcadores de Pista do tabuleiro; as fichas de Movimento Especial e o peão de Jack da trilha de movimento."),
          on("falseClues") ? rl("False Clues", "discard any unused ones.", "Pistas Falsas", "descarte as não usadas.") : "",
          rl("Leave", "the Policeman pawns and the Crime Scene markers in place.", "Deixe", "os peões de Policial e os marcadores de Cena do Crime no lugar."),
          interpretation("take the Time of the Crime token back too; Hell phase 4 puts it on I again.", "recolha também a ficha de Hora do Crime; a fase 4 do Inferno a põe de novo no I."),
          rl("Next Night", "Jack moves the Night-track pawn to the next Night; begin with Hell phase 1.", "Próxima Noite", "Jack move o peão da trilha das Noites para a próxima Noite; comece pela fase 1 do Inferno.")
        ], [18])}
        ${infoCard(t("END OF THE GAME", "FIM DA PARTIDA"), t("After Night 4 or a police win", "Depois da Noite 4 ou de uma vitória da polícia"), [
          t("Jack wins by escaping on Night 4 with five victims taken.", "Jack vence escapando na Noite 4 com as cinco vítimas feitas."),
          t("The game ends at once with a police win if Jack is arrested, cannot move, or fills square 15 without reaching home.", "A partida acaba na hora com vitória da polícia se Jack for preso, não puder se mover ou preencher o quadrado 15 sem chegar em casa."),
          interpretation("at the end, Jack may show his sheet so everyone can check the route — the rulebook does not require it.", "no fim, Jack pode mostrar a folha para todos conferirem a rota — o livro não exige.")
        ], [18, 22])}
      </div>`;
  }

  function optionalSection() {
    const cards = [];
    if (on("letters")) {
      cards.push(infoCard(t("JACK'S LETTERS · ACTIVE", "CARTAS DE JACK · ATIVA"), t("One Letter per Night, Nights 2–4", "Uma Carta por Noite, Noites 2–4"), [
        t("A Letter is used only after the Patrol tokens are placed; then it leaves the game. No second Letter until the next Night.", "Uma Carta só é usada depois de postas as fichas de Patrulha; depois sai do jogo. Nenhuma segunda Carta até a próxima Noite."),
        t("The effects are printed on each Letter sheet; they are repeated here.", "Os efeitos estão impressos em cada folha de Carta; são repetidos aqui."),
        `${glyph("dear-boss", "Dear Boss", "Dear Boss")} ${rl("Dear Boss (Hell phase 3)", "Jack moves one Patrol token, without looking at it, from section A/a or C/b to any unoccupied yellow-bordered Crossing.", "Dear Boss (fase 3 do Inferno)", "Jack move uma ficha de Patrulha, sem olhá-la, da seção A/a ou C/b para qualquer Cruzamento de borda amarela desocupado.")}`,
        `${glyph("saucy-jacky", "Saucy Jacky", "Saucy Jacky")} ${rl("Saucy Jacky (Hell phase 3)", "Jack chooses two Patrol tokens in sections B/a or B/b; the Head of the Investigation moves both to other unoccupied yellow-bordered Crossings.", "Saucy Jacky (fase 3 do Inferno)", "Jack escolhe duas fichas de Patrulha nas seções B/a ou B/b; o Chefe da Investigação move as duas para outros Cruzamentos de borda amarela desocupados.")}`,
        `${glyph("from-hell", "From Hell", "From Hell")} ${rl("From Hell (Hell phase 3)", "Jack moves one Patrol token, without looking at it, from section A/b or C/a to any unoccupied yellow-bordered Crossing.", "From Hell (fase 3 do Inferno)", "Jack move uma ficha de Patrulha, sem olhá-la, da seção A/b ou C/a para qualquer Cruzamento de borda amarela desocupado.")}`,
        `${glyph("goulston-street", "Goulston Street", "Goulston Street")} ${rl("Goulston Street (Hunting, after Jack's phase 1 move, before phase 2)", "Jack names the red, green or blue Policeman pawn. The Head of the Investigation chooses that pawn (Metropolitan Police) or the brown one (City of London Police) and must move it at once to Goulston Street, the red-bordered Crossing at A5/b8.", "Goulston Street (Caçada, depois do movimento de Jack na fase 1, antes da fase 2)", "Jack nomeia o peão de Policial vermelho, verde ou azul. O Chefe da Investigação escolhe esse peão (Polícia Metropolitana) ou o marrom (Polícia da City de Londres) e tem de movê-lo na hora para Goulston Street, o Cruzamento de borda vermelha em A5/b8.")}`,
        interpretation("the sections are read from the letters/numbers on the board's edges; the rulebook does not explain the grid.", "as seções são lidas pelas letras/números nas bordas do tabuleiro; o livro não explica a grade.")
      ], [12, 22], "wc-option-on"));
    }
    if (on("falseClues")) {
      cards.push(infoCard(t("FALSE CLUES · ACTIVE", "PISTAS FALSAS · ATIVA"), t("Earned by revealing clues", "Conquistadas revelando pistas"), [
        t("For every five yellow Clue markers Jack reveals to the police in one Night, he gains one blue False Clue marker (3 in the box).", "A cada cinco marcadores amarelos de Pista que Jack revela à polícia numa Noite, ele ganha um marcador azul de Pista Falsa (3 na caixa)."),
        t("At the beginning of Hunting phase 3 he may place one on any numbered circle.", "No início da fase 3 da Caçada ele pode colocar um em qualquer círculo numerado."),
        t("That circle is blocked for the rest of the Night: no Policeman may look for clues or arrest there.", "Esse círculo fica bloqueado pelo resto da Noite: nenhum Policial pode procurar pistas nem prender ali."),
        t("Unused False Clues are discarded at the end of the Night.", "Pistas Falsas não usadas são descartadas no fim da Noite."),
        interpretation("one placement per phase 3, as the rulebook says “one of these”; Jack may place it on his own current circle.", "uma colocação por fase 3, pois o livro diz “um deles”; Jack pode colocá-la no próprio círculo atual."),
        on("areaArrests") ? interpretation("with Area Arrests, the blocked circle is left out of the announcement; the other adjacent circles are still checked.", "com Prisões em Área, o círculo bloqueado fica fora do anúncio; os outros círculos adjacentes continuam sendo conferidos.") : ""
      ], [18, 23], "wc-option-on"));
    }
    if (on("rushing")) {
      cards.push(infoCard(t("RUSHING · ACTIVE", "CORRIDA · ATIVA"), t("Third action choice", "Terceira escolha de ação"), [
        t("In Hunting phase 3, each detective (Head of the Investigation first, then clockwise) may choose rushing for a pawn that can still act: move it to an adjacent Crossing, ignoring numbered circles.", "Na fase 3 da Caçada, cada detetive (Chefe da Investigação primeiro, depois sentido horário) pode escolher correr com um peão que ainda pode agir: movê-lo a um Cruzamento adjacente, ignorando círculos numerados.")
      ], [23], "wc-option-on"));
    }
    if (on("areaArrests")) {
      cards.push(infoCard(t("AREA ARRESTS · ACTIVE", "PRISÕES EM ÁREA · ATIVA"), t("Arrest every adjacent circle", "Prenda em todos os círculos adjacentes"), [
        t("An arresting detective announces all numbered circles adjacent to the pawn; if Jack's current location is among them he is arrested. Otherwise no information is given.", "O detetive que prende anuncia todos os círculos numerados adjacentes ao peão; se a posição atual de Jack estiver entre eles, ele é preso. Senão, nenhuma informação é dada.")
      ], [23], "wc-option-on"));
    }
    if (on("catchMe")) {
      cards.push(infoCard(t("CATCH ME, IF YOU CAN · ACTIVE", "PEGUE-ME SE PUDER · ATIVA"), t("Harder Hideout", "Esconderijo mais difícil"), [
        t("In setup, the Hideout may be neither a red numbered circle nor a circle adjacent to one.", "Na preparação, o Esconderijo não pode ser um círculo numerado vermelho nem um círculo adjacente a um."),
        t("The rulebook mentions an iOS “Whitechapel Hideout Generator” app that can pick a random Hideout and applies this rule. It is not supplied and this guide has not checked it.", "O livro menciona um aplicativo iOS “Whitechapel Hideout Generator” que sorteia um Esconderijo e aplica esta regra. Ele não foi fornecido e este guia não o conferiu.")
      ], [23], "wc-option-on"));
    }
    if (on("knowAddress")) {
      cards.push(infoCard(t("I KNOW YOUR ADDRESS · ACTIVE", "SEI ONDE VOCÊ MORA · ATIVA"), t("Swanson or Abberline", "Swanson ou Abberline"), [
        t("In Hell phase 3, if the revealed tile is Swanson (brown) or Abberline (red), that detective may immediately name any numbered circle.", "Na fase 3 do Inferno, se a peça revelada for Swanson (marrom) ou Abberline (vermelho), esse detetive pode nomear na hora qualquer círculo numerado."),
        t("If it is Jack's Hideout, the detectives win.", "Se for o Esconderijo de Jack, os detetives vencem."),
        t("Only once per game.", "Só uma vez por partida."),
        interpretation("on a wrong guess Jack just says no, as for a normal arrest; the one use is spent.", "num palpite errado Jack só diz não, como numa prisão normal; o uso único foi gasto.")
      ], [23], "wc-option-on"));
    }
    const off = activeOptionNames().length < OPTIONS.length
      ? `<p class="glossary-intro">${t(
        "Optional rules not selected are not used in this match; their full explanation is on each choice in “Build your match”.",
        "As regras opcionais não selecionadas não são usadas nesta partida; a explicação completa está em cada escolha de “Configure a partida”."
      )}</p>`
      : "";
    return `
      ${sectionHeading("optional", t("Optional rules in this match", "Regras opcionais nesta partida"), sectionIndex("optional"), [22, 23])}
      ${cards.length ? `<div class="quick-grid">${cards.join("")}</div>` : `<p class="wc-lede">${t("None: this match uses the basic rules only.", "Nenhuma: esta partida usa só as regras básicas.")}</p>`}
      ${off}`;
  }

  function tipsSection() {
    return `
      ${sectionHeading("tips", t("Suggestions and tips", "Sugestões e dicas"), sectionIndex("tips"), [22])}
      <div class="quick-grid">
        ${infoCard(t("JACK", "JACK"), t("From the rulebook", "Do livro"), [
          t("Give Jack to the most expert player.", "Dê Jack ao jogador mais experiente."),
          t("Use Coach and Alley tokens wisely, so they are there when you really need them.", "Use as fichas de Coach e Alley com sabedoria, para tê-las quando realmente precisar."),
          t("Do not overestimate the moves left: an unexpected police move can force a fatal detour.", "Não superestime os movimentos que restam: um movimento inesperado da polícia pode forçar um desvio fatal."),
          t("Do not give your position away by where you look on the board.", "Não entregue a posição pelo lugar do tabuleiro para onde olha.")
        ], [22], "wc-jack-card")}
        ${infoCard(t("DETECTIVES", "DETETIVES"), t("From the rulebook", "Do livro"), [
          t("Early on, narrowing down where the Hideout might be matters more than catching Jack on Night 1.", "No começo, estreitar onde pode estar o Esconderijo importa mais do que pegar Jack na Noite 1."),
          t("You must discuss tactics in front of Jack — wait until he has moved before you talk, to give away less.", "Vocês têm de discutir táticas na frente de Jack — esperem ele se mover antes de falar, para entregar menos.")
        ], [22], "wc-police-card")}
      </div>`;
  }

  function iconsSection() {
    const items = [
      ["jack", t("Jack the Ripper phase", "Fase de Jack, o Estripador"), t("Red top hat: the phase is carried out by Jack.", "Cartola vermelha: a fase é conduzida por Jack."), 8],
      ["police", t("Police phase", "Fase da Polícia"), t("Black police helmet: the phase is carried out by the detectives.", "Capacete preto de policial: a fase é conduzida pelos detetives."), 8],
      ["look-for-clues", t("Looking for clues", "Procurar pistas"), t("Magnifying glass: search adjacent circles one by one until a Clue appears.", "Lupa: vasculhe os círculos adjacentes um a um até aparecer uma Pista."), 17],
      ["arrest", t("Executing an arrest", "Executar uma prisão"), on("areaArrests") ? t("Handcuffs: with Area Arrests, name every adjacent circle at once.", "Algemas: com Prisões em Área, nomeie todos os círculos adjacentes de uma vez.") : t("Handcuffs: name one adjacent circle; right = Jack arrested.", "Algemas: nomeie um círculo adjacente; acertou = Jack preso."), on("areaArrests") ? 23 : 18],
      ["coach", t("Coach token", "Ficha de Coach"), t("Double move, may pass Policemen; covers two track spaces.", "Movimento duplo, pode passar por Policiais; cobre dois espaços da trilha."), 19],
      ["alley", t("Alley token", "Ficha de Alley"), t("Cut across one block of houses; one track space.", "Atravesse um quarteirão; um espaço da trilha."), 20],
      ["woman", t("Woman token (face down)", "Ficha de Mulher (virada para baixo)"), t("Plain white back: placed on red circles in Hell phase 2.", "Verso branco liso: posta em círculos vermelhos na fase 2 do Inferno."), 9],
      ["woman-marked", t("Woman token, marked face", "Ficha de Mulher, face marcada"), t("Red mark: a real target; becomes a Wretched pawn in phase 4.", "Marca vermelha: alvo real; vira peão de Desgraçada na fase 4."), 12],
      ["patrol", t("Police Patrol token (face down)", "Ficha de Patrulha (virada para baixo)"), t("Black back; 2 of the 7 are black on both sides (fake).", "Verso preto; 2 das 7 são pretas dos dois lados (falsas)."), 10],
      ["patrol-marked", t("Police Patrol token, coloured face", "Ficha de Patrulha, face colorida"), t("A real Patrol: becomes the Policeman pawn of that colour in phase 9.", "Uma Patrulha real: vira o peão de Policial dessa cor na fase 9."), 14],
      ["time-of-the-crime", t("Time of the Crime token", "Ficha de Hora do Crime"), t("Red disc on the move track's Roman numerals: starts on I, +1 per wait.", "Disco vermelho nos numerais romanos da trilha: começa no I, +1 por espera."), 11],
      ["crime-scene", t("Crime Scene marker", "Marcador de Cena do Crime"), t("Red disc: a murder site. Stays all game; no Woman token there later.", "Disco vermelho: local de um crime. Fica a partida toda; nenhuma ficha de Mulher ali depois."), 12],
      ["clue", t("Clue marker", "Marcador de Pista"), t("Yellow disc: Jack passed this circle tonight. Removed at the end of the Night.", "Disco amarelo: Jack passou por este círculo nesta Noite. Retirado no fim da Noite."), 17],
      on("falseClues") ? ["false-clue", t("False Clue marker", "Marcador de Pista Falsa"), t("Blue disc: blocks searches and arrests on that circle tonight.", "Disco azul: bloqueia buscas e prisões nesse círculo nesta Noite."), 23] : null,
      ["jack-pawn", t("Jack pawn", "Peão de Jack"), t("Two black top-hat pawns: one on the Night track, one on the move track.", "Dois peões pretos de cartola: um na trilha das Noites, um na trilha de movimento."), 6],
      ["wretched", t("Wretched pawn", "Peão de Desgraçada"), t("White pawn: a possible victim, moved by the Head of the Investigation.", "Peão branco: uma possível vítima, movida pelo Chefe da Investigação."), 11],
      ["move-sheet", t("Move track sheet", "Folha de movimento"), t("Four rows (one per Night) of V–I and 1–15; Hideout oval on top. Jack writes in pencil.", "Quatro linhas (uma por Noite) de V–I e 1–15; oval do Esconderijo no topo. Jack escreve a lápis."), 7],
      ["screen", t("Jack the Ripper screen", "Tela de Jack, o Estripador"), t("Hides Jack's sheet; shows a map and the Coach/Alley chart.", "Esconde a folha de Jack; mostra um mapa e a tabela de Coach/Alley."), 4]
    ].filter(Boolean);
    const policemen = ["blue", "yellow", "brown", "red", "green"];
    const hoi = [
      ["blue", "Warren", 12], ["yellow", "Lusk", 11], ["brown", "Swanson", 18], ["red", "Abberline", 10], ["green", "Reid", 9]
    ];
    const colourName = (c) => ({ blue: t("blue", "azul"), yellow: t("yellow", "amarelo"), brown: t("brown", "marrom"), red: t("red", "vermelho"), green: t("green", "verde") }[c]);
    const letters = on("letters") ? [
      ["dear-boss", "Dear Boss"], ["saucy-jacky", "Saucy Jacky"], ["from-hell", "From Hell"], ["goulston-street", "Goulston Street"]
    ] : [];
    return `
      ${sectionHeading("icons", t("Iconography and components", "Iconografia e componentes"), sectionIndex("icons"), [4, 5])}
      <p class="glossary-intro">${t("Each picture below is cut from the rulebook, one file per icon. The board features (circles and Crossings) come from the rulebook's board photos, which are low resolution.", "Cada imagem abaixo foi recortada do livro, um arquivo por ícone. Os elementos do tabuleiro (círculos e Cruzamentos) vêm das fotos do tabuleiro no livro, que têm baixa resolução.")}</p>
      <div class="icon-grid">
        ${items.map(([file, name, text, page]) => `
          <article class="icon-card">
            <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}.webp" alt="${name}"></span>
            <div><strong>${name}</strong><p>${text}</p>${referenceLink(page)}</div>
          </article>`).join("")}
        <article class="icon-card wc-icon-wide">
          <span class="wc-icon-row">${policemen.map((c) => `<img src="${ICONS}policeman-${c}.webp" alt="${t(`${colourName(c)} Policeman pawn`, `Peão de Policial ${colourName(c)}`)}">`).join("")}</span>
          <div><strong>${t("Policeman pawns", "Peões de Policial")}</strong><p>${t("Blue, yellow, brown, red and green; they move between Crossings.", "Azul, amarelo, marrom, vermelho e verde; andam entre Cruzamentos.")}</p>${referenceLink(5)}</div>
        </article>
        <article class="icon-card wc-icon-wide">
          <span class="wc-icon-row wc-icon-row-tiles"><img src="${ICONS}hoi-back.webp" alt="${t("Head of the Investigation tile, back", "Peça de Chefe da Investigação, verso")}">${hoi.map(([c, name]) => `<img src="${ICONS}hoi-${c}.webp" alt="${t(`Head of the Investigation: ${name} (${colourName(c)})`, `Chefe da Investigação: ${name} (${colourName(c)})`)}">`).join("")}</span>
          <div><strong>${t("Head of the Investigation tiles", "Peças de Chefe da Investigação")}</strong><p>${t("Back, then the five fronts. The historical notes name them: Warren (blue), Lusk (yellow), Swanson (brown), Abberline (red), Reid (green).", "Verso, depois as cinco frentes. As notas históricas os nomeiam: Warren (azul), Lusk (amarelo), Swanson (marrom), Abberline (vermelho), Reid (verde).")}</p>${referenceLink(4)} ${hoi.map(([, , p]) => p).filter((p, i, a) => a.indexOf(p) === i).sort((a, b) => a - b).map(referenceLink).join(" ")}</div>
        </article>
        ${letters.length ? `
        <article class="icon-card wc-icon-wide">
          <span class="wc-icon-row wc-icon-row-tiles">${letters.map(([file, name]) => `<img src="${ICONS}${file}.webp" alt="${name}">`).join("")}</span>
          <div><strong>${t("Jack's Letters", "Cartas de Jack")}</strong><p>${t("Dear Boss, Saucy Jacky, From Hell, Goulston Street (left to right). Effects in Optional rules.", "Dear Boss, Saucy Jacky, From Hell, Goulston Street (da esquerda para a direita). Efeitos em Regras opcionais.")}</p>${referenceLink(22)}</div>
        </article>` : ""}
      </div>`;
  }

  function examplesSection() {
    const cards = [
      infoCard(t("RULEBOOK EXAMPLE", "EXEMPLO DO LIVRO"), t("Choosing the Hideout", "Escolhendo o Esconderijo"), [
        t("Jack chooses numbered circle 90 and writes 90 in the oval at the top of his sheet.", "Jack escolhe o círculo numerado 90 e escreve 90 no oval no topo da folha.")
      ], [6, 7]),
      infoCard(t("RULEBOOK EXAMPLE", "EXEMPLO DO LIVRO"), t("Moving a Wretched", "Movendo uma Desgraçada"), [
        t("The Wretched on circle 65 must move. Its options are 63, 66, 51, 67, 84, 83 and 82.", "A Desgraçada no círculo 65 tem de andar. As opções são 63, 66, 51, 67, 84, 83 e 82."),
        t("The Head of the Investigation chooses 82.", "O Chefe da Investigação escolhe 82.")
      ], [13]),
      infoCard(t("RULEBOOK EXAMPLE", "EXEMPLO DO LIVRO"), t("A corpse at Time II", "Um cadáver na Hora II"), [
        t("Jack waited once, so the Time of the Crime token is on II. He kills the Wretched on circle 82.", "Jack esperou uma vez, então a ficha de Hora do Crime está no II. Ele mata a Desgraçada no círculo 82."),
        t("On Night 1 he writes “82” in the first row of his sheet, in the cell under II.", "Na Noite 1 ele escreve “82” na primeira linha da folha, na célula sob o II."),
        interpretation("he now has cells I and 1–15 left: 16 moves to get home.", "agora restam as células I e 1–15: 16 movimentos para chegar em casa.")
      ], [14]),
      infoCard(t("RULEBOOK EXAMPLE", "EXEMPLO DO LIVRO"), t("Escape in the Night", "Fuga na Noite"), [
        t("Jack is on 127. He secretly writes 103 in the next cell and moves the Jack pawn one space right on the move track.", "Jack está no 127. Ele escreve em segredo 103 na próxima célula e avança o peão de Jack um espaço na trilha de movimento.")
      ], [15]),
      infoCard(t("RULEBOOK EXAMPLE", "EXEMPLO DO LIVRO"), t("A Policeman moves", "Um Policial anda"), [
        t("The yellow Policeman pawn moves two Crossings along a street Jack may have used — if he did, a clue is waiting.", "O peão de Policial amarelo anda dois Cruzamentos por uma rua que Jack pode ter usado — se usou, há uma pista esperando.")
      ], [16]),
      infoCard(t("RULEBOOK EXAMPLE", "EXEMPLO DO LIVRO"), t("Which circles are adjacent?", "Quais círculos são adjacentes?"), [
        t("Circles 99, 100 and 120 are adjacent to the yellow Policeman.", "Os círculos 99, 100 e 120 são adjacentes ao Policial amarelo."),
        t("Circle 83 is not: a Crossing interrupts the line to it.", "O círculo 83 não é: um Cruzamento interrompe a linha até ele.")
      ], [17]),
      infoCard(t("RULEBOOK EXAMPLE", "EXEMPLO DO LIVRO"), t("Looking for clues", "Procurando pistas"), [
        t("The yellow Policeman calls “99!” — not in tonight's row; Jack says no.", "O Policial amarelo diz “99!” — não está na linha desta Noite; Jack diz não."),
        t("He calls “100!” — it is in tonight's row: Jack puts a Clue marker on 100.", "Ele diz “100!” — está na linha desta Noite: Jack põe um marcador de Pista no 100."),
        t("120 is adjacent too, but finding a clue ended the action.", "O 120 também é adjacente, mas achar uma pista encerrou a ação.")
      ], [17]),
      infoCard(t("RULEBOOK EXAMPLE", "EXEMPLO DO LIVRO"), t("An arrest", "Uma prisão"), [
        on("areaArrests")
          ? t("The rulebook's example is a single arrest on 99; with Area Arrests the yellow Policeman would announce 99, 100 and 120 together.", "O exemplo do livro é uma prisão simples no 99; com Prisões em Área o Policial amarelo anunciaria 99, 100 e 120 juntos.")
          : t("The yellow Policeman arrests on adjacent circle 99. Jack checks his current location and says no — and nothing more.", "O Policial amarelo prende no círculo adjacente 99. Jack confere a posição atual e diz não — e nada mais.")
      ], on("areaArrests") ? [18, 23] : [18]),
      infoCard(t("RULEBOOK EXAMPLE", "EXEMPLO DO LIVRO"), t("Coach", "Coach"), [
        t("Jack is on 103 and uses a Coach: he secretly writes 69, then 56, in two cells.", "Jack está no 103 e usa um Coach: escreve em segredo 69 e depois 56, em duas células."),
        t("He covers two move-track spaces with the Coach token and moves the Jack pawn two spaces. He is now on 56.", "Ele cobre dois espaços da trilha com a ficha de Coach e avança o peão de Jack dois espaços. Agora está no 56.")
      ], [19]),
      infoCard(t("RULEBOOK EXAMPLE", "EXEMPLO DO LIVRO"), t("Alley", "Alley"), [
        t("From 56, the block of houses to the south lets him reach 57, 73, 72, 71, 70 or 69.", "Do 56, o quarteirão ao sul permite chegar a 57, 73, 72, 71, 70 ou 69."),
        t("He writes 72, puts the Alley token on the track and moves the pawn one space.", "Ele escreve 72, põe a ficha de Alley na trilha e avança o peão um espaço.")
      ], [20]),
      infoCard(t("RULEBOOK EXAMPLE", "EXEMPLO DO LIVRO"), t("The double event", "O evento duplo"), [
        t("On Night 3 Jack places Crime Scenes on 3 and 27 and writes “27” then “3”.", "Na Noite 3 Jack põe Cenas do Crime no 3 e no 27 e escreve “27” e depois “3”."),
        t("He escapes from 3, the rightmost number. The detectives cannot tell which one he started from.", "Ele foge do 3, o número da direita. Os detetives não sabem de qual ele partiu.")
      ], [21])
    ];
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), sectionIndex("examples"), [13, 14, 15, 16, 17, 18, 19, 20, 21])}
      <p class="glossary-intro">${t("These are the rulebook's illustrated examples, paraphrased; the circle numbers are real board numbers.", "Estes são os exemplos ilustrados do livro, parafraseados; os números de círculo são números reais do tabuleiro.")}</p>
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  function faqSection() {
    const items = [
      [t("How many moves does Jack have?", "Quantos movimentos Jack tem?"), t("The rulebook says he loses if he fills square 15 without declaring. Each row runs V–IV–III–II–I then 1–15, and the murder is written under the Time of the Crime numeral, so a murder at I leaves 15 moves and each extra wait adds one (up to 19 at V).", "O livro diz que ele perde se preencher o quadrado 15 sem declarar. Cada linha vai V–IV–III–II–I e depois 1–15, e o crime é escrito sob o numeral da Hora do Crime, então um crime no I deixa 15 movimentos e cada espera a mais soma um (até 19 no V)."), 14],
      [t("Can a Coach be used with only one cell left?", "Dá para usar um Coach com só uma célula restante?"), t("No: a Coach writes two circles in two cells, so it needs two empty cells before square 15 is passed.", "Não: um Coach escreve dois círculos em duas células, então precisa de duas células vazias antes de passar do quadrado 15."), 19],
      [t("Must Jack declare as soon as he reaches the Hideout?", "Jack tem de declarar assim que chegar ao Esconderijo?"), t("No: the rulebook says he “may” declare. He may keep moving, but must declare by square 15 and only after a normal move.", "Não: o livro diz que ele “pode” declarar. Ele pode seguir andando, mas tem de declarar até o quadrado 15 e só depois de um movimento normal."), 18],
      [t("Does searching a Crime Scene find a clue?", "Vasculhar uma Cena do Crime acha pista?"), t("Yes for tonight's crime: its number is in tonight's row (written in phase 8), so Jack must place a Clue there.", "Sim para o crime desta Noite: o número dele está na linha desta Noite (escrito na fase 8), então Jack tem de pôr uma Pista ali."), 17],
      [t("What if a circle already has a Clue marker?", "E se um círculo já tiver marcador de Pista?"), t("Searching it again tells the police nothing new: the number is still in tonight's row, so it simply counts as the clue found and ends that Policeman's action.", "Vasculhá-lo de novo não diz nada novo à polícia: o número continua na linha desta Noite, então conta como a pista achada e encerra a ação desse Policial."), 17],
      [t("Do the intermediate circles of a Coach count?", "Os círculos intermediários de um Coach contam?"), t("For clues, yes — both numbers are written in tonight's row. For an arrest, only Jack's current location (the latest number) counts.", "Para pistas, sim — os dois números são escritos na linha desta Noite. Para prisão, só conta a posição atual de Jack (o número mais recente)."), 18],
      [t("What happens to the Policeman pawns at the start of Nights 2–4?", "O que acontece com os peões de Policial no início das Noites 2–4?"), t("The rulebook only says five Patrol tokens go where the pawns stood. The guide lifts each pawn off as its token is placed; the pawns come back in phase 9.", "O livro só diz que cinco fichas de Patrulha vão onde os peões estavam. O guia tira cada peão quando sua ficha é posta; os peões voltam na fase 9."), 11],
      [t("Are the Woman tokens reused?", "As fichas de Mulher são reutilizadas?"), t("Yes. Unmarked tokens return to Jack in phase 4; a marked token goes to the box only when its victim is killed. The counts per Night (8/7/6/4) match this.", "Sim. As fichas sem marca voltam a Jack na fase 4; uma ficha marcada vai para a caixa só quando sua vítima é morta. As contagens por Noite (8/7/6/4) batem com isso."), 9],
      [t("Where does the Head of the Investigation tile go after the Night?", "Para onde vai a peça de Chefe da Investigação depois da Noite?"), t("The rulebook does not say. The guide sets it aside face up and turns over the next tile of the pile on the next Night.", "O livro não diz. O guia a deixa de lado virada para cima e vira a próxima peça da pilha na Noite seguinte."), 10],
      ...(on("letters") ? [[t("What if Goulston Street is already occupied?", "E se Goulston Street já estiver ocupada?"), t("The rulebook does not cover it. Agree before playing; the guide suggests that a pawn already on Goulston Street may be the one chosen and simply stays.", "O livro não cobre isso. Combinem antes de jogar; o guia sugere que um peão já em Goulston Street pode ser o escolhido e simplesmente fica."), 22]] : []),
      [t("Who answers the police questions?", "Quem responde às perguntas da polícia?"), t("Jack, truthfully, by checking his sheet: the rulebook describes each answer as a check of the sheet, not as a choice, and gives Jack no way to bluff it.", "Jack, com verdade, conferindo a folha: o livro descreve cada resposta como uma conferência da folha, não como uma escolha, e não dá a Jack como blefar."), 17]
    ];
    return `
      ${sectionHeading("faq", t("Guide's readings", "Leituras do guia"), sectionIndex("faq"), [11, 14, 17, 18, 19])}
      <p class="glossary-intro">${t("Where the rulebook is silent or only implies an answer, this guide states its own reading, labelled as such.", "Onde o livro é omisso ou só sugere a resposta, este guia dá a sua própria leitura, identificada como tal.")}</p>
      <div class="quick-grid">${items.map(([q, a, page]) => `
        <article class="info-card">
          <span class="component-label">${t("GUIDE'S READING", "LEITURA DO GUIA")}</span>
          <h3>${q}</h3>
          <p>${a}</p>
          ${referenceLink(page)}
        </article>`).join("")}</div>`;
  }

  function glossarySection() {
    const visible = [
      { term: ["Numbered circle", "Círculo numerado"], text: ["One of the 195 board locations where Jack and the Wretched move.", "Um dos 195 locais do tabuleiro onde Jack e as Desgraçadas andam."], page: 6 },
      { term: ["Red numbered circle", "Círculo numerado vermelho"], text: ["Where Woman tokens are placed; can never be the Hideout.", "Onde as fichas de Mulher são postas; nunca pode ser o Esconderijo."], page: 6 },
      { term: ["Crossing", "Cruzamento"], text: ["Black square on a street; Policeman pawns stand on Crossings.", "Quadrado preto numa rua; os peões de Policial ficam nos Cruzamentos."], page: 6 },
      { term: ["Yellow-bordered Crossing", "Cruzamento de borda amarela"], text: ["Legal spot for Patrol tokens on Night 1 (and for the two extra ones later).", "Lugar permitido para fichas de Patrulha na Noite 1 (e para as duas extras depois)."], page: 7 },
      { term: ["Hideout", "Esconderijo"], text: ["Jack's secret home circle, written on his sheet.", "O círculo-casa secreto de Jack, escrito na folha."], page: 6 },
      { term: ["Head of the Investigation", "Chefe da Investigação"], text: ["The detective of the revealed colour; leads the police for one Night.", "O detetive da cor revelada; lidera a polícia por uma Noite."], page: 10 },
      { term: ["Police Patrol token", "Ficha de Patrulha Policial"], text: ["Face-down token for a possible Policeman position; 2 of 7 are fake.", "Ficha virada para baixo de uma possível posição de Policial; 2 de 7 são falsas."], page: 10 },
      { term: ["Woman token", "Ficha de Mulher"], text: ["Face-down target on a red circle; marked ones become Wretched.", "Alvo virado para baixo num círculo vermelho; as marcadas viram Desgraçadas."], page: 9 },
      { term: ["Wretched", "Desgraçada (Wretched)"], text: ["White pawn: a possible victim.", "Peão branco: uma possível vítima."], page: 11 },
      { term: ["Time of the Crime", "Hora do Crime"], text: ["Red token on the move track's Roman numerals; each wait moves it up one.", "Ficha vermelha nos numerais romanos da trilha; cada espera a sobe um."], page: 11 },
      { term: ["Move track", "Trilha de movimento"], text: ["Board track (V–I, 1–15) where a Jack pawn counts his moves publicly.", "Trilha do tabuleiro (V–I, 1–15) onde um peão de Jack conta os movimentos publicamente."], page: 14 },
      { term: ["Night track", "Trilha das Noites"], text: ["Board track showing which of the four Nights is being played.", "Trilha do tabuleiro que mostra qual das quatro Noites está em jogo."], page: 6 },
      { term: ["Current location", "Posição atual"], text: ["The most recent number on Jack's sheet; the only target of an arrest.", "O número mais recente na folha de Jack; o único alvo de uma prisão."], page: 18 },
      { term: ["Tonight's row", "Linha desta Noite"], text: ["The row of Jack's sheet for the current Night; any number in it yields a Clue.", "A linha da folha de Jack para a Noite atual; qualquer número nela gera uma Pista."], page: 17 },
      { term: ["Block of houses", "Quarteirão"], text: ["Area completely bounded, not crossed, by dotted lines; used by an Alley.", "Área totalmente cercada, não atravessada, por linhas pontilhadas; usada por um Alley."], page: 20 },
      { term: ["Double event", "Evento duplo"], text: ["Night 3: two murders in one phase 5.", "Noite 3: dois crimes numa só fase 5."], page: 21 },
      { term: ["Declare escape", "Declarar a fuga"], text: ["Jack, on his Hideout after a normal move, ends the Night.", "Jack, no Esconderijo depois de um movimento normal, encerra a Noite."], page: 18 },
      ...(on("falseClues") ? [{ term: ["False Clue", "Pista Falsa"], text: ["Blue marker earned per 5 Clues; blocks a circle for the Night.", "Marcador azul ganho a cada 5 Pistas; bloqueia um círculo pela Noite."], page: 23 }] : [])
    ];
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), sectionIndex("glossary"), [6, 9, 17, 18])}
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
    document.body.classList.add("theme-wc");
    document.documentElement.lang = state.language;
    document.title = t("Letters from Whitechapel — Field Manual", "Letters from Whitechapel — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Letters from Whitechapel: hidden movement for 2–6 players — setup checklist, the four Nights, Hell and Hunting phases, Special Movements, the double event and the six optional rules.",
        "Regras interativas bilíngues de Letters from Whitechapel: movimento oculto para 2–6 jogadores — lista de preparação, as quatro Noites, fases do Inferno e da Caçada, Movimentos Especiais, o evento duplo e as seis regras opcionais."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook", "Livro interativo")}</p>
          <h1>Letters from Whitechapel</h1>
          <p class="hero-intro">${t(
            "London, 1888. Jack the Ripper must claim five victims over four Nights and slip back to his secret Hideout each time; five detectives follow his clues through the alleys of Whitechapel to arrest him first.",
            "Londres, 1888. Jack, o Estripador, precisa fazer cinco vítimas em quatro Noites e voltar a cada vez ao seu Esconderijo secreto; cinco detetives seguem as pistas dele pelos becos de Whitechapel para prendê-lo antes."
          )}</p>
          <div class="hero-meta"><span>${t("2–6 players", "2–6 jogadores")}</span><span>${t("1 vs. all", "1 contra todos")}</span><span>${t("Hidden movement", "Movimento oculto")}</span><span>${t("Revised edition", "Edição revisada")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/whitechapel.webp" alt="${t("Cover of the Letters from Whitechapel rulebook", "Capa do livro de regras de Letters from Whitechapel")}" fetchpriority="high"><figcaption>${t("Rulebook cover", "Capa do livro de regras")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("Whitechapel", "Whitechapel")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column wc-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          <p class="wc-secret"><strong>${t("Secrets stay behind the screen.", "Os segredos ficam atrás da tela.")}</strong> ${t(
            "This guide never asks for, shows or stores Jack's Hideout, his route, which Woman tokens are marked or which Patrol tokens are real. It saves only the match options and the setup checkmarks on this device, so it can stay open where everyone can see it. Jack keeps his record on paper.",
            "Este guia nunca pergunta, mostra ou salva o Esconderijo de Jack, a rota dele, quais fichas de Mulher são marcadas ou quais fichas de Patrulha são reais. Ele salva só as opções da partida e as marcações da preparação neste aparelho, então pode ficar aberto à vista de todos. Jack mantém o registro no papel."
          )}</p>
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied English rulebook of the revised edition of Letters from Whitechapel (24 pages; printed page numbers equal PDF pages). The rulebook has no expansions; its six optional rules are selectable above. The full text of Jack's Letters is printed on the Letter sheets; the rulebook repeats it and so does this guide. Points marked “Guide's reading” are interpretations where the rulebook is silent. Component names follow the rulebook.",
            "Este guia cobre o livro de regras em inglês fornecido da edição revisada de Letters from Whitechapel (24 páginas; os números impressos são iguais às páginas do PDF). O livro não tem expansões; as seis regras opcionais podem ser escolhidas acima. O texto completo das Cartas de Jack está nas folhas de Carta; o livro o repete, e este guia também. Trechos marcados como “Leitura do guia” são interpretações onde o livro é omisso. Os nomes de componentes seguem o livro (Coach e Alley ficam em inglês, como impressos)."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${boardSection()}</section>
          <section class="rule-section">${winningSection()}</section>
          <section class="rule-section">${nightsSection()}</section>
          <section class="rule-section">${hellSection()}</section>
          <section class="rule-section">${huntingSection()}</section>
          <section class="rule-section">${specialSection()}</section>
          <section class="rule-section">${doubleEventSection()}</section>
          <section class="rule-section">${endNightSection()}</section>
          <section class="rule-section">${optionalSection()}</section>
          <section class="rule-section">${tipsSection()}</section>
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${faqSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal, non-commercial companion guide based on the Letters from Whitechapel rulebook (revised edition). Letters from Whitechapel is by Gabriele Mari and Gianluca Santopietro; © 2012 Tiopi srl, published in English by Fantasy Flight Games. This guide is not affiliated with them.",
        "Guia pessoal e não comercial de consulta baseado no livro de regras de Letters from Whitechapel (edição revisada). Letters from Whitechapel é de Gabriele Mari e Gianluca Santopietro; © 2012 Tiopi srl, publicado em inglês pela Fantasy Flight Games. Este guia não tem vínculo com eles."
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
      root.querySelector(".wc-page")?.prepend(notice);
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
    if (target.hasAttribute("data-players")) {
      const value = Number(target.getAttribute("data-players"));
      if (PLAYERS.includes(value) && value !== state.players) {
        applyMatchChange({ players: value });
      }
      return;
    }
    if (target.hasAttribute("data-option")) {
      const key = target.getAttribute("data-option");
      const value = target.getAttribute("data-value");
      if (OPTIONS.includes(key) && YES_NO.includes(value) && value !== state[key]) {
        applyMatchChange({ [key]: value });
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

  window.LettersFromWhitechapel = { renderInto, onClick, onChange };
})();
