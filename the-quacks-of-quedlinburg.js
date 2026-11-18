(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.the-quacks-of-quedlinburg.v1";
  const SETUP_KEY = "field-manual.the-quacks-of-quedlinburg.setup.v1";
  const MANUALS = { c: "the-quacks-of-quedlinburg_core.pdf", h: "the-quacks-of-quedlinburg_herb-witches.pdf" };
  const ASSETS = "assets/the-quacks-of-quedlinburg/";
  const ICONS = `${ASSETS}icons/`;
  const ART = `${ASSETS}art/`;
  // Sources. "c" = The Quacks of Quedlinburg English rulebook (Schmidt Spiele, 8 pages; p. 1 is the cover with
  // the contents, pp. 2–8 carry printed numbers equal to the PDF pages). "h" = The Herb Witches expansion
  // booklet (4 pages, printed = PDF page). The base rulebook does not print the ingredient-book effects: the
  // books (and the Almanac of Ingredients, in the box but not supplied) do. The guide uses only what the
  // supplied PDFs show: the Set 1 books legible in the p. 1 contents picture and the pp. 2, 5–7 close-ups,
  // the Almanac excerpt embedded on p. 1 (pumpkin and crow skull Sets 1–4), and the full Set 5/6 pages of
  // the Herb Witches booklet. Everything else stays "read your book". Fortune Teller texts are on the cards.
  const PLAYERS = [2, 3, 4, 5];
  const SETS = ["1", "2", "3", "4", "5", "6", "mix"];
  const POTS = ["front", "tubes"];
  const YESNO = ["no", "yes"];
  const defaults = { language: "pt-BR", hw: "no", players: 4, set: "1", pot: "front", stir: "no" };
  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------

  function normalizePreferences(saved) {
    const hw = YESNO.includes(saved?.hw) ? saved.hw : defaults.hw;
    let players = Number(saved?.players);
    if (!PLAYERS.includes(players)) {
      players = defaults.players;
    }
    if (hw === "no" && players === 5) {
      players = 4;
    }
    let set = SETS.includes(String(saved?.set)) ? String(saved.set) : defaults.set;
    if (hw === "no" && (set === "5" || set === "6")) {
      set = defaults.set;
    }
    return {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      hw,
      players,
      set,
      pot: POTS.includes(saved?.pot) ? saved.pot : defaults.pot,
      stir: YESNO.includes(saved?.stir) ? saved.stir : defaults.stir
    };
  }

  function signature(source = state) {
    return `hw${source.hw}-p${source.players}-s${source.set}-${source.pot}`;
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Quacks of Quedlinburg preferences.", error);
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
      console.error("Could not read Quacks of Quedlinburg setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Quacks of Quedlinburg preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Quacks of Quedlinburg setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function hw() {
    return state.hw === "yes";
  }

  function tubes() {
    return state.pot === "tubes";
  }

  function hwSet() {
    return state.set === "5" || state.set === "6";
  }

  function mix() {
    return state.set === "mix";
  }

  function manualUrl(code) {
    const script = document.querySelector('script[src*="the-quacks-of-quedlinburg.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${MANUALS[code[0]]}`, baseUrl).href}#page=${Number(code.slice(1))}`;
  }

  // Page codes: "c5" = base rulebook page 5; "h2" = Herb Witches booklet page 2.
  function referenceLink(code) {
    const page = code.slice(1);
    const label = code[0] === "c"
      ? t(`Rules p. ${page} ↗`, `Regras p. ${page} ↗`)
      : t(`Herb Witches p. ${page} ↗`, `Herb Witches p. ${page} ↗`);
    return `<a class="source-link" href="${manualUrl(code)}" target="_blank" rel="noreferrer">${label}</a>`;
  }

  function refs(codes) {
    return codes.filter((code) => hw() || code[0] === "c").map(referenceLink).join("");
  }

  function sectionHeading(id, title, codes) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("QUEDLINBURG BAZAAR", "FEIRA DE QUEDLINBURG")} / ${sectionIndex(id)}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="qk-section-references">${refs(codes)}</div>
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
    return `<span class="qk-interpretation">${t("Guide's reading", "Leitura do guia")}</span> ${t(en, pt)}`;
  }

  function glyph(file, alt) {
    return `<img class="qk-glyph" src="${ICONS}${file}.webp" alt="${alt}">`;
  }

  function playersLabel(players = state.players) {
    return t(`${players} players`, `${players} jogadores`);
  }

  function setName(value = state.set) {
    if (value === "mix") {
      return t("Own mix", "Mistura própria");
    }
    return t(`Set ${value}`, `Conjunto ${value}`);
  }

  function potName(value = state.pot) {
    return value === "tubes" ? t("Test-tube side", "Lado dos tubos de ensaio") : t("Standard side", "Lado padrão");
  }

  function bookmarks(value = state.set) {
    return value === "1"
      ? t("1 bookmark", "1 marcador")
      : t(`${value} bookmarks`, `${value} marcadores`);
  }

  // ---------- sections ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["round", t("The 9 turns", "Os 9 turnos")],
      ["fortune", t("Fortune Teller & rats", "Vidente e ratos")],
      ["potion", t("Potions Phase", "Fase das Poções")],
      ["evaluation", t("Evaluation A–F", "Avaliação A–F")],
      ["ingredients", t("Ingredient books", "Livros de ingredientes")],
      ...(hw() ? [["witches", t("Herb Witches", "Bruxas das Ervas")]] : []),
      ...(tubes() ? [["tubes", t("Test-tube side", "Lado dos tubos")]] : []),
      ["end", t("End of game", "Fim de jogo")],
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
          <span class="brand-mark" aria-hidden="true">QQ</span>
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

  function choiceCard(name, dataAttr, value, checked, title, description) {
    return `
      <label class="qk-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" data-${dataAttr}="${value}" ${checked ? "checked" : ""}>
        <span class="qk-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function setChoiceText(value) {
    const texts = {
      1: t("Books with 1 bookmark. Recommended for the first game; every Set 1 effect is pictured in the rulebook and printed in this guide.", "Livros com 1 marcador. Recomendado para a primeira partida; todo efeito do Conjunto 1 aparece no livro de regras e está neste guia."),
      2: t("Books with 2 bookmarks; suggested second. The rulebook does not print these effects except the crow skull (Almanac excerpt): read each book.", "Livros com 2 marcadores; sugerido em segundo. O livro de regras não imprime esses efeitos, exceto a caveira de corvo (trecho do Almanaque): leia cada livro."),
      3: t("Books with 3 bookmarks. Only the crow skull effect is in the supplied sources; read the other books.", "Livros com 3 marcadores. Só o efeito da caveira de corvo está nas fontes fornecidas; leia os outros livros."),
      4: t("Books with 4 bookmarks; suggested last of the base game. Only the crow skull effect is in the supplied sources.", "Livros com 4 marcadores; sugerido por último no jogo base. Só o efeito da caveira de corvo está nas fontes fornecidas."),
      5: t("Herb Witches books with 5 bookmarks: adds the locoweed (turquoise) and a new black page. All Set 5/6 effects are described in the booklet.", "Livros das Herb Witches com 5 marcadores: acrescenta a erva-louca (locoweed, turquesa) e uma página preta nova. Todos os efeitos dos Conjuntos 5/6 estão no livreto."),
      6: t("Herb Witches books with 6 bookmarks: also with locoweed and a new black page.", "Livros das Herb Witches com 6 marcadores: também com erva-louca e uma página preta nova."),
      mix: t("Experienced players: pick one book page per colour from any set (rules p. 8). The guide lists every effect it knows for each colour.", "Jogadores experientes: escolham uma página de livro por cor de qualquer conjunto (regras p. 8). O guia lista todo efeito que conhece para cada cor.")
    };
    return texts[value];
  }

  function matchConfiguration() {
    const playerOptions = PLAYERS.filter((players) => hw() || players < 5);
    const setOptions = SETS.filter((value) => hw() || (value !== "5" && value !== "6"));
    const playerText = (players) => ({
      2: t("Uses the 2-player page of the black book. 2 pots, bags, flasks, rat stones and markers in play.", "Usa a página de 2 jogadores do livro preto. 2 caldeirões, bolsas, frascos, pedras de rato e marcadores em jogo."),
      3: t("Uses the 3–4-player page of the black book (compare with both neighbours).", "Usa a página de 3–4 jogadores do livro preto (compara com os dois vizinhos)."),
      4: t("Uses the 3–4-player page of the black book. The base box holds exactly 4 sets of player pieces.", "Usa a página de 3–4 jogadores do livro preto. A caixa base tem exatamente 4 conjuntos de peças de jogador."),
      5: t("Only with Herb Witches, which adds the fifth pot, bag, flask, 2 droplets, marker, rat stone and seal. Black book: see the Guide's reading in Setup.", "Só com Herb Witches, que traz o quinto caldeirão, bolsa, frasco, 2 gotas, marcador, pedra de rato e selo. Livro preto: veja a leitura do guia na Preparação.")
    }[players]);
    return `
      <section class="controls-panel qk-config" id="build-match" aria-labelledby="qk-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="qk-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "Choose the expansion, the number of players, the ingredient set and the pot side: they change the setup and the rules shown below, and changing any of them clears the setup checklist. The simultaneous-drawing option only changes how chips are drawn. Changing the language clears nothing.",
              "Escolha a expansão, o número de jogadores, o conjunto de ingredientes e o lado do caldeirão: eles mudam a preparação e as regras mostradas abaixo, e mudar qualquer um limpa a lista da preparação. A opção de compra simultânea só muda como as fichas são compradas. Trocar o idioma não limpa nada."
            )}</p>
          </div>
        </div>
        <fieldset class="qk-choice-group">
          <legend>${t("Expansion: The Herb Witches · selected:", "Expansão: The Herb Witches · selecionado:")} <span>${hw() ? t("Yes", "Sim") : t("No", "Não")}</span></legend>
          <p class="qk-choice-intro">${t("Needs the base game. Its components are used from the first turn.", "Precisa do jogo base. Os componentes entram desde o primeiro turno.")} ${referenceLink("h1")}</p>
          <div class="qk-choice-grid">
            ${choiceCard("qk-hw", "hw", "no", !hw(), t("No — base game only", "Não — só o jogo base"), t("2–4 players, ingredient Sets 1–4, no witches, no overflow bowl (a chip past space 33 stays on the 33).", "2–4 jogadores, Conjuntos de ingredientes 1–4, sem bruxas, sem tigela de transbordo (uma ficha além do espaço 33 fica no 33)."))}
            ${choiceCard("qk-hw", "hw", "yes", hw(), t("Yes — add The Herb Witches", "Sim — acrescentar The Herb Witches"), t("Each player gets 3 witch pennies (one use per face-up witch type) and an overflow bowl; one random witch of each type is turned face up; the pumpkin book is replaced; Sets 5–6 and a 5th player become available. Unused pennies score 2 points each.", "Cada jogador recebe 3 moedas de bruxa (um uso por tipo de bruxa revelada) e uma tigela de transbordo; uma bruxa de cada tipo é revelada ao acaso; o livro da abóbora é trocado; os Conjuntos 5–6 e um 5º jogador ficam disponíveis. Moedas não usadas valem 2 pontos cada."))}
          </div>
        </fieldset>
        <fieldset class="qk-choice-group">
          <legend>${t("Players · selected:", "Jogadores · selecionado:")} <span>${playersLabel()}</span></legend>
          <p class="qk-choice-intro">${hw() ? t("2–5 players with The Herb Witches.", "2–5 jogadores com The Herb Witches.") : t("The base game is for 2–4 players; the 5th player needs The Herb Witches.", "O jogo base é para 2–4 jogadores; o 5º jogador precisa de The Herb Witches.")} ${referenceLink("c2")}</p>
          <div class="qk-choice-grid qk-choice-grid-4">
            ${playerOptions.map((players) => choiceCard("qk-players", "players", players, state.players === players, playersLabel(players), playerText(players))).join("")}
          </div>
        </fieldset>
        <fieldset class="qk-choice-group">
          <legend>${t("Ingredient set · selected:", "Conjunto de ingredientes · selecionado:")} <span>${setName()}</span></legend>
          <p class="qk-choice-intro">${t("Decides which green, blue, red, yellow and purple books are laid out (the set is the number of bookmarks on the lower edge of the book — check both sides). Orange and black books are used every game.", "Decide quais livros verde, azul, vermelho, amarelo e roxo são postos na mesa (o conjunto é o número de marcadores na borda inferior do livro — confira os dois lados). Os livros laranja e preto são usados em toda partida.")} ${referenceLink("c2")} ${referenceLink("c8")}</p>
          <div class="qk-choice-grid qk-choice-grid-4">
            ${setOptions.map((value) => choiceCard("qk-set", "set", value, state.set === value, setName(value), setChoiceText(value))).join("")}
          </div>
        </fieldset>
        <fieldset class="qk-choice-group">
          <legend>${t("Pot side · selected:", "Lado do caldeirão · selecionado:")} <span>${potName()}</span></legend>
          <p class="qk-choice-intro">${t("The rulebook's Game Variation, for after a few games.", "A Variação do livro de regras, para depois de algumas partidas.")} ${referenceLink("c8")}</p>
          <div class="qk-choice-grid">
            ${choiceCard("qk-pot", "pot", "front", !tubes(), potName("front"), t("The side without test tubes; the starting bag is printed bottom left. One droplet per player.", "O lado sem tubos de ensaio; a bolsa inicial está impressa embaixo à esquerda. Uma gota por jogador."))}
            ${choiceCard("qk-pot", "pot", "tubes", tubes(), potName("tubes"), t("Back side with a row of test tubes and a second droplet. Every time you may move your droplet, you can move the test-tube droplet one glass instead and take its bonus at once (ruby, 1–4 points or chips).", "Verso com uma fileira de tubos de ensaio e uma segunda gota. Toda vez que puder mover a sua gota, você pode mover a gota dos tubos um vidro e pegar o bônus na hora (rubi, 1–4 pontos ou fichas)."))}
          </div>
        </fieldset>
        <fieldset class="qk-choice-group">
          <legend>${t("Simultaneous drawing in turns 1–8 · selected:", "Compra simultânea nos turnos 1–8 · selecionado:")} <span>${state.stir === "yes" ? t("Yes", "Sim") : t("No", "Não")}</span></legend>
          <p class="qk-choice-intro">${t("Turn 9 is always drawn together on “Stir!”. Does not change the setup.", "O turno 9 é sempre comprado junto ao comando “Mexam!”. Não muda a preparação.")} ${referenceLink("c8")}</p>
          <div class="qk-choice-grid">
            ${choiceCard("qk-stir", "stir", "no", state.stir !== "yes", t("No — everyone draws at their own pace", "Não — cada um compra no seu ritmo"), t("Players fill their pots at the same time but need not draw in sync, and may see what others did.", "Os jogadores enchem os caldeirões ao mesmo tempo, mas não precisam comprar em sincronia, e podem ver o que os outros fizeram."))}
            ${choiceCard("qk-stir", "stir", "yes", state.stir === "yes", t("Yes — “Stir!” in every turn", "Sim — “Mexam!” em todo turno"), t("The start player calls “Stir!” for each draw in every turn, so nobody gains by watching others first.", "O primeiro jogador diz “Mexam!” a cada compra em todo turno, para ninguém ganhar vantagem olhando os outros antes."))}
          </div>
        </fieldset>
      </section>`;
  }

  // ---------- ingredient books ----------

  // Each entry: id, colour, picture, costs, when ("draw" | "B" | "none"), effect lines, source, label.
  function bookPages() {
    const pages = [];
    const add = (entry) => pages.push(entry);
    const set = state.set;
    const all = mix();
    // Orange (pumpkin): every game.
    if (hw()) {
      add({ colour: "orange", img: "hw-book-pumpkin", costs: t("1-chip 3 · 6-chip 22", "ficha 1: 3 · ficha 6: 22"), when: "none", src: "h3",
        title: t("Pumpkin — Herb Witches book (replaces the base one)", "Abóbora — livro das Herb Witches (substitui o da base)"),
        lines: [
          t("No function: a pumpkin only fills the pot by 1 or 6 spaces.", "Sem função: a abóbora só enche o caldeirão em 1 ou 6 espaços."),
          t("No upgrade of any kind (book, witch or Fortune Teller card) applies to pumpkins: a 1-pumpkin never becomes a 6-pumpkin.", "Nenhuma melhoria (livro, bruxa ou carta da Vidente) vale para abóboras: uma abóbora 1 nunca vira abóbora 6.")
        ] });
    } else {
      add({ colour: "orange", img: "base-book-orange", costs: t("1-chip 3 coins", "ficha 1: 3 moedas"), when: "none", src: "c1",
        title: t("Pumpkin — orange book", "Abóbora — livro laranja"),
        lines: [t("No function other than filling the pot by 1 space; the cheapest chip in the game (Almanac excerpt).", "Nenhuma função além de encher o caldeirão em 1 espaço; a ficha mais barata do jogo (trecho do Almanaque).")] });
    }
    // Black (hawkmoth).
    const blackTwo = { colour: "black", img: "base-book-black-two", costs: t("1-chip 10", "ficha 1: 10"), when: "B", src: "c2",
      title: t("Hawkmoth — black book, 2-player page", "Mariposa — livro preto, página de 2 jogadores"),
      lines: [
        rl("As many black chips as the other player", "move your droplet 1 space forward.", "Tantas fichas pretas quanto o outro jogador", "avance a sua gota 1 espaço."),
        rl("More black chips than the other player", "1 ruby and move your droplet 1 space forward.", "Mais fichas pretas que o outro jogador", "1 rubi e avance a sua gota 1 espaço."),
        interpretation("“draw” on the book means black chips placed in your pot this turn; with none on either side, nothing happens.", "“comprar” no livro significa fichas pretas postas no seu caldeirão neste turno; sem nenhuma dos dois lados, nada acontece.")
      ] };
    const blackMany = { colour: "black", img: "base-book-black-neighbours", costs: t("1-chip 10", "ficha 1: 10"), when: "B", src: "c1",
      title: t("Hawkmoth — black book, 3–4-player page", "Mariposa — livro preto, página de 3–4 jogadores"),
      lines: [
        rl("More black chips than one of your two neighbours", "move your droplet 1 space forward.", "Mais fichas pretas que um dos seus dois vizinhos", "avance a sua gota 1 espaço."),
        rl("More black chips than both neighbours", "1 ruby and move your droplet 1 space forward.", "Mais fichas pretas que os dois vizinhos", "1 rubi e avance a sua gota 1 espaço."),
        interpretation("“more than” means strictly more: a tie with a neighbour does not count, and “more than one” means at least one of the two.", "“mais que” é estritamente mais: empatar com um vizinho não conta, e “mais que um” significa pelo menos um dos dois.")
      ] };
    const blackLeft = { colour: "black", img: "hw-book-black-left", costs: t("1-chip 10", "ficha 1: 10"), when: "B", src: "h4",
      title: t("Hawkmoth — Herb Witches page (cost 10)", "Mariposa — página das Herb Witches (custo 10)"),
      lines: [
        rl("When you buy a black chip (phase E) or get one from a Fortune Teller card", "throw it into the bag of the player on your left and move your droplet 1 space forward.", "Ao comprar uma ficha preta (fase E) ou ganhar uma por carta da Vidente", "jogue-a na bolsa do jogador à sua esquerda e avance a sua gota 1 espaço."),
        rl("Phase B", "1 ruby for every black chip in your left neighbour's pot.", "Fase B", "1 rubi para cada ficha preta no caldeirão do vizinho da esquerda."),
        rl("Also in phase B", "the left neighbour gets 1 ruby if a black chip in their pot is on the last or next-to-last space.", "Também na fase B", "o vizinho da esquerda ganha 1 rubi se uma ficha preta no caldeirão dele estiver no último ou penúltimo espaço.")
      ] };
    const blackFar = { colour: "black", img: "hw-book-black-furthest", costs: t("1-chip 9", "ficha 1: 9"), when: "B", src: "h4",
      title: t("Hawkmoth — Herb Witches page (cost 9)", "Mariposa — página das Herb Witches (custo 9)"),
      lines: [
        rl("Black chip furthest in its pot", "that player moves their droplet (or one of their droplets) 1 space forward.", "Ficha preta mais adiantada no caldeirão", "esse jogador avança a gota (ou uma das gotas) 1 espaço."),
        rl("Second furthest", "that player gets 1 ruby.", "Segunda mais adiantada", "esse jogador ganha 1 rubi."),
        t("One player can win both (with 2+ black chips). Ties: everyone involved gets the bonus.", "Um jogador pode ganhar os dois (com 2+ fichas pretas). Empate: todos os envolvidos ganham o bônus.")
      ] };
    if (hwSet()) {
      add(blackLeft);
      add(blackFar);
    } else if (all && hw()) {
      add(state.players === 2 ? blackTwo : blackMany);
      add(blackLeft);
      add(blackFar);
    } else {
      add(state.players === 2 ? blackTwo : blackMany);
    }
    // Blue (crow skull).
    const blue = {
      1: { img: "base-book-blue-draw", costs: "5 · 10 · 19", src: "c5", title: t("Crow skull — Set 1", "Caveira de corvo — Conjunto 1"), lines: [
        t("When drawn and placed: take 1, 2 or 4 more chips out of your bag (the blue chip's value).", "Ao ser comprada e posta: tire mais 1, 2 ou 4 fichas da bolsa (o valor da ficha azul)."),
        t("You may lay down 1 of them as your next chip; put the others back in the bag. You may also put all of them back.", "Você pode colocar 1 delas como a próxima ficha; devolva as outras à bolsa. Também pode devolver todas."),
        t("If the chip you lay down has a bonus, use it at once.", "Se a ficha colocada tiver bônus, use-o na hora.")
      ] },
      2: { img: null, costs: "5 · 10 · 19", src: "c1", title: t("Crow skull — Set 2 (Almanac excerpt)", "Caveira de corvo — Conjunto 2 (trecho do Almanaque)"), lines: [
        t("Placing a blue 1-chip: if your pot explodes with the next drawn chip, you still get both victory points and coins for shopping (but still no Bonus Die).", "Ao colocar uma ficha azul 1: se o caldeirão explodir com a próxima ficha comprada, você ainda recebe pontos E moedas para comprar (mas continua sem o Dado de Bônus)."),
        t("A blue 2-chip covers the next 2 drawn chips; a blue 4-chip the next 4.", "Uma ficha azul 2 cobre as próximas 2 fichas compradas; uma azul 4, as próximas 4."),
        t("They do not add up: after another blue chip whose bonus is still running, take the better one only (a 4 after a 2 covers 4 chips, not 5; a 2 placed third after a 4 covers only the next 2).", "Elas não se somam: depois de outra ficha azul ainda ativa, vale só a melhor (um 4 depois de um 2 cobre 4 fichas, não 5; um 2 posto em terceiro depois de um 4 cobre só as 2 seguintes).")
      ] },
      3: { img: "base-book-blue-ruby-space", costs: "4 · 8 · 14", src: "c1", title: t("Crow skull — Set 3", "Caveira de corvo — Conjunto 3"), lines: [
        t("If you place a blue chip on a ruby space, you immediately receive 1 ruby. Its value does not matter.", "Se você colocar uma ficha azul num espaço com rubi, recebe 1 rubi na hora. O valor dela não importa.")
      ] },
      4: { img: null, costs: "5 · 10 · 20", src: "c1", title: t("Crow skull — Set 4 (Almanac excerpt)", "Caveira de corvo — Conjunto 4 (trecho do Almanaque)"), lines: [
        t("If a blue chip you draw has to be placed on a ruby space: 1 victory point for a 1-chip, 2 for a 2-chip, 4 for a 4-chip, immediately.", "Se uma ficha azul comprada tiver de ser posta num espaço com rubi: 1 ponto pela ficha 1, 2 pela ficha 2, 4 pela ficha 4, na hora.")
      ] }
    };
    const hwBlue = [
      { img: "hw-book-blue-orange", costs: "8 · 15 · 19", src: "h3", title: t("Crow skull — Herb Witches page (costs 8/15/19)", "Caveira de corvo — página das Herb Witches (custos 8/15/19)"), lines: [
        t("When drawn: if at least as many orange chips (any value) are already in your pot as the blue chip's value, score that many victory points immediately. Otherwise nothing.", "Ao ser comprada: se já houver no caldeirão pelo menos tantas fichas laranja (qualquer valor) quanto o valor da ficha azul, marque esse número de pontos na hora. Senão, nada.")
      ] },
      { img: "hw-book-blue-white", costs: "5 · 10 · 18", src: "h3", title: t("Crow skull — Herb Witches page (costs 5/10/18)", "Caveira de corvo — página das Herb Witches (custos 5/10/18)"), lines: [
        t("When drawn: look at the 1, 2 or 4 chips placed right before it (its value; no gaps). 1 ruby for each white 1-chip among them.", "Ao ser comprada: olhe as 1, 2 ou 4 fichas postas logo antes dela (o valor; sem lacunas). 1 rubi para cada ficha branca 1 entre elas.")
      ] }
    ];
    pushColour("blue", blue, hwBlue, add, "draw");
    // Red (toadstool).
    const red = {
      1: { img: "base-book-red-orange", costs: "6 · 10 · 16", src: "c2", title: t("Toadstool — Set 1", "Cogumelo — Conjunto 1"), lines: [
        t("When drawn: if orange chips are already in your pot, move the red chip forward per the book's chart.", "Ao ser comprada: se já houver fichas laranja no caldeirão, avance a ficha vermelha conforme a tabela do livro."),
        rl("1 or 2 orange chips", "1 extra space.", "1 ou 2 fichas laranja", "1 espaço a mais."),
        rl("3 or more orange chips", "2 extra spaces.", "3 ou mais fichas laranja", "2 espaços a mais.")
      ] }
    };
    const hwRed = [
      { img: "hw-book-red-highest", costs: "6 · 11 · 18", src: "h3", title: t("Toadstool — Herb Witches page (costs 6/11/18)", "Cogumelo — página das Herb Witches (custos 6/11/18)"), lines: [
        t("When drawn: move it forward by its value — or by the value of the highest red chip already in your pot, if that is higher.", "Ao ser comprada: avance-a pelo seu valor — ou pelo valor da ficha vermelha mais alta já no caldeirão, se for maior."),
        t("Example: with a red 4-chip already in the pot, every red 1- or 2-chip drawn afterwards moves 4.", "Exemplo: com uma ficha vermelha 4 já no caldeirão, toda ficha vermelha 1 ou 2 comprada depois avança 4.")
      ] },
      { img: "hw-book-red-aside", costs: "7 · 11 · 17", src: "h3", title: t("Toadstool — Herb Witches page (costs 7/11/17)", "Cogumelo — página das Herb Witches (custos 7/11/17)"), lines: [
        t("When drawn: place it, then draw 1 more chip and set it aside. You must still place it this turn — whenever you like, before or after you stop.", "Ao ser comprada: coloque-a, depois compre mais 1 ficha e deixe-a de lado. Você tem de colocá-la ainda neste turno — quando quiser, antes ou depois de parar."),
        t("You may place the set-aside chip only after placing the chip you just drew; it can even be placed after an explosion.", "Você só pode colocar a ficha separada depois de colocar a ficha que acabou de comprar; ela pode ser posta até depois de uma explosão."),
        t("A white chip set aside already counts towards the explosion.", "Uma ficha branca separada já conta para a explosão.")
      ] }
    ];
    pushColour("red", red, hwRed, add, "draw");
    // Yellow (mandrake) — from turn 2.
    const yellow = {
      1: { img: "base-book-yellow-white", costs: "8 · 12 · 18", src: "c1", title: t("Mandrake — Set 1", "Mandrágora — Conjunto 1"), lines: [
        t("When drawn: if the chip placed just before it was white, you may put that white chip back into your bag.", "Ao ser comprada: se a ficha posta logo antes dela era branca, você pode devolver essa ficha branca à bolsa.")
      ] }
    };
    const hwYellow = [
      { img: "hw-book-yellow-draw", costs: "10 · 14 · 20", src: "h3", title: t("Mandrake — Herb Witches page (costs 10/14/20)", "Mandrágora — página das Herb Witches (custos 10/14/20)"), lines: [
        t("When drawn: you must draw 1 more chip; move the yellow chip forward by that chip's value (a locoweed counts as 1), then return the extra chip to the bag.", "Ao ser comprada: você tem de comprar mais 1 ficha; avance a amarela pelo valor dessa ficha (erva-louca conta 1) e devolva a ficha extra à bolsa.")
      ] },
      { img: "hw-book-yellow-ruby", costs: "8 · 12 · 18", src: "h3", title: t("Mandrake — Herb Witches page (costs 8/12/18)", "Mandrágora — página das Herb Witches (custos 8/12/18)"), lines: [
        t("When drawn: you may give up exactly 1 ruby to move the yellow chip 3 extra spaces. Never more than 1 ruby per chip.", "Ao ser comprada: você pode entregar exatamente 1 rubi para avançar a ficha amarela 3 espaços a mais. Nunca mais de 1 rubi por ficha.")
      ] }
    ];
    pushColour("yellow", yellow, hwYellow, add, "draw");
    // Locoweed (Herb Witches).
    if (hw() && (hwSet() || all)) {
      [
        { img: "hw-book-locoweed-rats", costs: t("1-chip 8", "ficha 1: 8"), src: "h3", title: t("Locoweed — Herb Witches page (cost 8)", "Erva-louca — página das Herb Witches (custo 8)"), lines: [
          t("When drawn: move it forward by the number of spaces your rat stone moved this turn, plus 1 — at most 4 spaces.", "Ao ser comprada: avance-a pelo número de espaços que a sua pedra de rato avançou neste turno, mais 1 — no máximo 4 espaços."),
          t("Only the rat stone's position in the pot counts (after the Fortune Teller card), not the current rat-tails on the Scoring Track.", "Só conta a posição da pedra de rato no caldeirão (depois da carta da Vidente), não os rabos de rato atuais na Trilha de Pontos.")
        ] },
        { img: "hw-book-locoweed-copy", costs: t("1-chip 10", "ficha 1: 10"), src: "h3", title: t("Locoweed — Herb Witches page (cost 10)", "Erva-louca — página das Herb Witches (custo 10)"), lines: [
          t("When drawn: it takes the function and value of the last coloured (non-white) chip in your pot.", "Ao ser comprada: ela ganha a função e o valor da última ficha colorida (não branca) do caldeirão."),
          t("If no coloured chip has been placed yet: value 1, no action.", "Se nenhuma ficha colorida foi posta ainda: valor 1, sem ação."),
          interpretation("copying a green, purple or black chip, the locoweed acts with that colour in phase B.", "ao copiar uma ficha verde, roxa ou preta, a erva-louca age como essa cor na fase B.")
        ] }
      ].forEach((entry) => add({ colour: "locoweed", when: "draw", ...entry }));
    }
    // Green (garden spider).
    const green = {
      1: { img: "base-book-green-ruby", costs: "4 · 8 · 14", src: "c6", title: t("Garden spider — Set 1", "Aranha de jardim — Conjunto 1"), lines: [
        t("Phase B: 1 ruby for each green chip on the last or next-to-last space of your pot — that is, among the last two chips you placed this turn, not the pot's final spaces.", "Fase B: 1 rubi para cada ficha verde no último ou no penúltimo espaço do caldeirão — ou seja, entre as duas últimas fichas que você pôs neste turno, não os espaços finais do caldeirão.")
      ] }
    };
    const hwGreen = [
      { img: "hw-book-green-start", costs: "5 · 9 · 16", src: "h4", title: t("Garden spider — Herb Witches page (costs 5/9/16)", "Aranha de jardim — página das Herb Witches (custos 5/9/16)"), lines: [
        t("Phase B: if a green chip is last or next-to-last, choose 1 chip now in your pot as the start chip for next turn. Its value can be at most the green chip's value (1, 2 or 4).", "Fase B: se uma ficha verde estiver em último ou penúltimo, escolha 1 ficha que está no caldeirão como ficha inicial do próximo turno. O valor dela pode ser no máximo o da ficha verde (1, 2 ou 4)."),
        t("Next turn it is placed first, moved forward by its value, and its function is used at the very start. A green chip may choose itself.", "No próximo turno ela é posta primeiro, avançando pelo seu valor, e a função é usada logo no início. A ficha verde pode escolher a si mesma."),
        interpretation("keep the chosen chip next to your pot (not in the bag) when the other chips go back in phase E, and place it after your droplet (or rat stone) before your first draw.", "guarde a ficha escolhida ao lado do caldeirão (não na bolsa) quando as outras voltarem na fase E, e coloque-a depois da gota (ou pedra de rato) antes da primeira compra.")
      ] },
      { img: "hw-book-green-die", costs: "4 · 8 · 14", src: "h4", title: t("Garden spider — Herb Witches page (bonus die)", "Aranha de jardim — página das Herb Witches (dado de bônus)"), lines: [
        t("Phase B: roll the Bonus Die once for every green chip on the last or next-to-last space and take the bonus. Value irrelevant.", "Fase B: role o Dado de Bônus uma vez para cada ficha verde no último ou penúltimo espaço e pegue o bônus. O valor não importa."),
        t("With the Fortune Teller card “The pot is full” turned over, roll twice for each such green chip.", "Com a carta da Vidente “The pot is full” revelada, role duas vezes para cada ficha verde assim.")
      ] }
    ];
    pushColour("green", green, hwGreen, add, "B");
    // Purple (ghost's breath) — from turn 3.
    const purple = {
      1: { img: "base-book-purple-bonus", costs: t("1-chip 9", "ficha 1: 9"), src: "c1", title: t("Ghost's breath — Set 1", "Hálito de fantasma — Conjunto 1"), lines: [
        t("Phase B: for 1, 2 or 3 purple chips in your pot, take the bonus shown:", "Fase B: por 1, 2 ou 3 fichas roxas no caldeirão, pegue o bônus mostrado:"),
        rl("1 purple", "1 victory point.", "1 roxa", "1 ponto."),
        rl("2 purple", "1 victory point and 1 ruby.", "2 roxas", "1 ponto e 1 rubi."),
        rl("3 purple", "2 victory points and move your droplet 1 space forward.", "3 roxas", "2 pontos e avance a gota 1 espaço."),
        interpretation("the third row shows three chips followed by dots, so 4 or more purple chips still give the 3-chip bonus.", "a terceira linha mostra três fichas seguidas de reticências, então 4 ou mais fichas roxas ainda dão o bônus de 3.")
      ] }
    };
    const hwPurple = [
      { img: "hw-book-purple-buy", costs: t("1-chip 9", "ficha 1: 9"), src: "h4", title: t("Ghost's breath — Herb Witches page (cost 9)", "Hálito de fantasma — página das Herb Witches (custo 9)"), lines: [
        t("Phase B: add up the victory points printed on every space covered by a purple chip. That sum is a purchase value to buy up to 2 chips of different colours.", "Fase B: some os pontos impressos em todos os espaços cobertos por fichas roxas. A soma é um valor de compra para até 2 fichas de cores diferentes."),
        t("It works even if your pot exploded (phase B is unaffected). This purchase is separate from phase E: if your pot did not explode and you shop, you may buy again in phase E.", "Vale mesmo se o caldeirão explodiu (a fase B não é afetada). Essa compra é separada da fase E: se o caldeirão não explodiu e você compra, pode comprar de novo na fase E."),
        t("In turn 9 the sum buys victory points (5 : 1).", "No turno 9 a soma compra pontos (5 : 1).")
      ] },
      { img: "hw-book-purple-next", costs: t("1-chip 16", "ficha 1: 16"), src: "h4", title: t("Ghost's breath — Herb Witches page (cost 16)", "Hálito de fantasma — página das Herb Witches (custo 16)"), lines: [
        t("Phase B: look at the value printed on the chip placed after the purple chip and move forward that many spaces on the Scoring Track.", "Fase B: olhe o valor impresso na ficha posta depois da ficha roxa e avance esse número de casas na Trilha de Pontos."),
        t("If that chip moved further than its value because of an action, you still score only its printed value.", "Se essa ficha avançou mais que o seu valor por causa de uma ação, você marca só o valor impresso.")
      ] }
    ];
    pushColour("purple", purple, hwPurple, add, "B");
    return pages;

    function pushColour(colour, base, hwPagesList, adder, when) {
      if (hwSet()) {
        hwPagesList.forEach((entry) => adder({ colour, when, ...entry }));
        return;
      }
      if (all) {
        Object.entries(base).forEach(([key, entry]) => adder({ colour, when, setLabel: key, ...entry }));
        if (hw()) {
          hwPagesList.forEach((entry) => adder({ colour, when, ...entry }));
        }
        adder({ colour, when, unknown: true });
        return;
      }
      if (base[set]) {
        adder({ colour, when, ...base[set] });
      } else {
        adder({ colour, when, unknown: true });
      }
    }
  }

  function colourName(colour) {
    return {
      orange: t("Orange · pumpkin", "Laranja · abóbora"),
      black: t("Black · African death's head hawkmoth", "Preto · mariposa-caveira africana"),
      blue: t("Blue · crow skull", "Azul · caveira de corvo"),
      red: t("Red · toadstool", "Vermelho · cogumelo"),
      yellow: t("Yellow · mandrake", "Amarelo · mandrágora"),
      green: t("Green · garden spider", "Verde · aranha de jardim"),
      purple: t("Purple · ghost's breath", "Roxo · hálito de fantasma"),
      locoweed: t("Turquoise · locoweed", "Turquesa · erva-louca (locoweed)")
    }[colour];
  }

  function whenLabel(when) {
    return {
      draw: t("Acts as soon as it is drawn", "Age assim que é comprada"),
      B: t("Acts in Evaluation phase B", "Age na fase B da Avaliação"),
      none: t("No action", "Sem ação")
    }[when];
  }

  // Pictures of other base-game pages from the p. 1 contents photo, set not stated.
  function contentsHints(colour) {
    return {
      yellow: ["base-book-yellow-threshold", "8 · 12 · 18", t("“The total value of white chips needed to blow up your pot increases according to the number of yellow chips placed” (the chart's numbers are too small to read).", "“O valor total de fichas brancas necessário para explodir o caldeirão aumenta conforme o número de fichas amarelas postas” (os números da tabela são pequenos demais para ler).")],
      green: ["base-book-green-seven", "6 · 11 · 21", t("“If your white chips have an exact value of 7, double the value of each green chip for the rest of the turn.”", "“Se as suas fichas brancas somarem exatamente 7, dobre o valor de cada ficha verde pelo resto do turno.”")],
      red: ["base-book-red-white", "5 · 9 · 15", t("“If the previously placed chip was white, add its value to the red chip. Move the red chip that many spaces” (white 1 → +1, white 2 → +2, white 3 → +3).", "“Se a ficha posta antes era branca, some o valor dela à ficha vermelha. Avance a vermelha esse número de espaços” (branca 1 → +1, branca 2 → +2, branca 3 → +3).")],
      purple: ["base-book-purple-space", t("1-chip 10", "ficha 1: 10"), t("“For each purple chip, depending on its space in the pot, you receive the following victory points” — 0 to 3 by space; the thresholds are too small to read.", "“Para cada ficha roxa, conforme o espaço dela no caldeirão, você recebe os seguintes pontos” — 0 a 3 por espaço; os limites são pequenos demais para ler.")]
    }[colour];
  }

  function bookCard(entry) {
    if (entry.unknown) {
      const hint = contentsHints(entry.colour);
      return `
        <article class="qk-book-card qk-book-unknown">
          <header><span class="qk-swatch qk-swatch-${entry.colour}" aria-hidden="true"></span><div><strong>${colourName(entry.colour)}</strong><small>${whenLabel(entry.when)}</small></div></header>
          <h4>${mix() ? t("Any other page you lay out", "Qualquer outra página que vocês puserem") : `${setName()} — ${t("read the book", "leia o livro")}`}</h4>
          ${lineList([
            t("This page's effect and costs are printed on the book itself (and in the Almanac of Ingredients that comes in the box). The supplied rulebook does not reproduce them, so the guide does not invent them.", "O efeito e os custos desta página estão impressos no próprio livro (e no Almanaque de Ingredientes que vem na caixa). O livro de regras fornecido não os reproduz, então o guia não os inventa."),
            t(`Costs on the book: left = 1-chip, middle = 2-chip, right = 4-chip.`, `Custos no livro: esquerda = ficha 1, meio = ficha 2, direita = ficha 4.`),
            entry.when === "draw"
              ? t("Timing from the rulebook: this colour acts as soon as it is drawn and placed; you may pass on it.", "Momento pelo livro de regras: esta cor age assim que é comprada e posta; você pode abrir mão.")
              : t("Timing from the rulebook: this colour acts in Evaluation phase B, start player first, clockwise.", "Momento pelo livro de regras: esta cor age na fase B da Avaliação, a partir do primeiro jogador, em sentido horário."),
            hint ? `${t("Also pictured in the rulebook's contents (set not stated) — if your book shows costs", "Também aparece no conteúdo do livro de regras (conjunto não indicado) — se o seu livro mostrar custos")} <strong>${hint[1]}</strong>: ${hint[2]}` : ""
          ])}
          ${hint ? `<img class="qk-book-img" src="${ART}${hint[0]}.webp" alt="${t("Ingredient book page pictured on p. 1", "Página de livro de ingrediente mostrada na p. 1")}" loading="lazy">` : ""}
          ${refs(["c1", "c5"])}
        </article>`;
    }
    return `
      <article class="qk-book-card">
        <header><span class="qk-swatch qk-swatch-${entry.colour}" aria-hidden="true"></span><div><strong>${colourName(entry.colour)}</strong><small>${whenLabel(entry.when)}</small></div></header>
        <h4>${entry.title}</h4>
        ${entry.img ? `<img class="qk-book-img" src="${ART}${entry.img}.webp" alt="${entry.title}" loading="lazy">` : ""}
        <p class="qk-costs"><strong>${t("Costs (coins)", "Custos (moedas)")}:</strong> ${entry.costs}</p>
        ${lineList(entry.lines)}
        ${refs([entry.src])}
      </article>`;
  }

  function ingredientsSection() {
    const pages = bookPages();
    const order = ["orange", "black", "blue", "red", "yellow", "locoweed", "green", "purple"];
    const groups = order.filter((colour) => pages.some((page) => page.colour === colour));
    return `
      ${sectionHeading("ingredients", t("Ingredient books", "Livros de ingredientes"), ["c2", "c5", "c6", "c7", "h3", "h4"])}
      <p class="qk-lede">${t(
        `Every colour has a book on the table: its costs (left = 1-chip, middle = 2-chip, right = 4-chip; one number = only 1-chips) and its effect. White chips (cherry bombs) and orange pumpkins have no action. Blue, red and yellow${hw() && (hwSet() || mix()) ? " and turquoise" : ""} act as soon as they are drawn; green, purple and black only in Evaluation phase B. You may always pass on an action.`,
        `Cada cor tem um livro na mesa: custos (esquerda = ficha 1, meio = ficha 2, direita = ficha 4; um só número = só fichas 1) e efeito. Fichas brancas (bombas-cereja) e abóboras laranja não têm ação. Azul, vermelha e amarela${hw() && (hwSet() || mix()) ? " e turquesa" : ""} agem assim que são compradas; verde, roxa e preta só na fase B da Avaliação. Você sempre pode abrir mão de uma ação.`
      )}</p>
      ${hwSet() ? `<p class="callout">${t(
        "The Herb Witches booklet describes two pages for every colour without saying which belongs to Set 5 and which to Set 6. Lay out the books whose lower edge shows the chosen number of bookmarks, then find your page below by its costs.",
        "O livreto das Herb Witches descreve duas páginas por cor sem dizer qual é do Conjunto 5 e qual é do 6. Ponha na mesa os livros cuja borda inferior mostra o número de marcadores escolhido e ache a sua página abaixo pelos custos."
      )}</p>` : ""}
      ${mix() ? `<p class="callout">${t(
        "Own mix: pick one page per colour from any set. Below are all pages the supplied sources describe, plus a card per colour for pages they do not.",
        "Mistura própria: escolha uma página por cor de qualquer conjunto. Abaixo estão todas as páginas que as fontes fornecidas descrevem, mais um cartão por cor para as que elas não descrevem."
      )}</p>` : ""}
      ${groups.map((colour) => `
        <div class="qk-book-grid">${pages.filter((page) => page.colour === colour).map(bookCard).join("")}</div>`).join("")}
      <div class="qk-chip-strip" aria-label="${t("Chips of the base game", "Fichas do jogo base")}">
        ${["white-1", "white-2", "white-3", "orange-1", "green-1", "blue-1", "red-1", "yellow-1", "purple-1", "black-1"].map((chip) => `<img src="${ICONS}chip-${chip}.webp" alt="${chip}" loading="lazy">`).join("")}
      </div>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function booksToLayOut() {
    const set = state.set;
    if (mix()) {
      return t("one green, one blue and one red book page of your choice (any sets)", "uma página de livro verde, uma azul e uma vermelha à escolha (de quaisquer conjuntos)");
    }
    return t(`the green, blue and red books of ${setName()} (${bookmarks(set)})`, `os livros verde, azul e vermelho do ${setName()} (${bookmarks(set)})`);
  }

  function blackBookLine() {
    if (hwSet()) {
      return interpretation(
        `black: the booklet lists two new hawkmoth pages among the Set 5/6 books and does not say they are tied to a player count. The guide uses the black page with ${bookmarks()} in place of the base black book (see Ingredient books).`,
        `preto: o livreto lista duas páginas novas da mariposa entre os livros dos Conjuntos 5/6 e não diz que dependem do número de jogadores. O guia usa a página preta com ${bookmarks()} no lugar do livro preto da base (veja Livros de ingredientes).`
      );
    }
    if (mix() && hw()) {
      return t(`Black: the base black book page for ${state.players === 2 ? "2 players" : "3–4 players"}, or — your choice in an own mix — one of the two Herb Witches hawkmoth pages (see Ingredient books).`, `Preto: a página do livro preto da base para ${state.players === 2 ? "2 jogadores" : "3–4 jogadores"}, ou — escolha de vocês na mistura própria — uma das duas páginas da mariposa das Herb Witches (veja Livros de ingredientes).`);
    }
    if (state.players === 2) {
      return t("Black book: the page for 2 players (2 pots pictured at the bottom).", "Livro preto: a página de 2 jogadores (2 caldeirões desenhados embaixo).");
    }
    if (state.players === 5) {
      return interpretation("black book with 5 players: the base book only has pages for 2 and for 3–4 players; use the 3–4-player page (it compares you with your two neighbours, which works at any table size).", "livro preto com 5 jogadores: o livro base só tem páginas para 2 e para 3–4 jogadores; use a de 3–4 (ela compara você com os dois vizinhos, o que funciona com qualquer número).");
    }
    return t("Black book: the page for 3 and 4 players (3–4 pots pictured at the bottom).", "Livro preto: a página de 3 e 4 jogadores (3–4 caldeirões desenhados embaixo).");
  }

  function setupPhases() {
    const n = state.players;
    const phases = [
      {
        id: "start",
        title: t("Start player and Fortune Teller deck", "Primeiro jogador e baralho da Vidente"),
        codes: ["c2"],
        items: [
          t("The last person to cook something is the start player.", "A última pessoa que cozinhou algo é o primeiro jogador."),
          t("The start player shuffles the 24 Fortune Teller cards and puts them face down as a draw pile in front of themselves.", "O primeiro jogador embaralha as 24 cartas da Vidente e as deixa viradas para baixo como pilha de compra à sua frente.")
        ]
      },
      {
        id: "track",
        title: t("Scoring Track, Flame and seals", "Trilha de Pontos, Chama e selos"),
        codes: ["c2"],
        items: [
          t("Put the Scoring Track (with the Turn Indicator) in the middle of the table.", "Ponha a Trilha de Pontos (com o Indicador de Turno) no meio da mesa."),
          t("Put the Flame (turn marker) on space 1 of the Turn Indicator.", "Ponha a Chama (marcador de turno) no espaço 1 do Indicador de Turno."),
          hw() && n === 5
            ? t("Put the 5 seal tiles (4 base + 1 Herb Witches) on the seal spaces with the “0” side up.", "Ponha os 5 selos (4 da base + 1 das Herb Witches) nos espaços de selo com o lado “0” para cima.")
            : t("Put the 4 seal tiles on the 4 seal spaces with the “0” side up.", "Ponha os 4 selos nos 4 espaços de selo com o lado “0” para cima."),
          t(`Put the rubies (${hw() ? "20 + 20 from Herb Witches" : "20"}) and the Bonus Die next to the track as a general supply. Nobody starts with rubies.`, `Ponha os rubis (${hw() ? "20 + 20 das Herb Witches" : "20"}) e o Dado de Bônus ao lado da trilha como reserva geral. Ninguém começa com rubis.`)
        ]
      },
      {
        id: "books",
        title: t("Ingredient books and chips", "Livros de ingredientes e fichas"),
        codes: hw() ? ["c2", "h1"] : ["c2"],
        items: [
          hw()
            ? t("Orange: the new Herb Witches pumpkin book (it replaces the base pumpkin book, which stays in the box).", "Laranja: o novo livro da abóbora das Herb Witches (substitui o da base, que fica na caixa).")
            : t("Orange: the orange (pumpkin) book.", "Laranja: o livro laranja (abóbora)."),
          blackBookLine(),
          t(`Lay out ${booksToLayOut()}. Look at both the front and the back of each book.`, `Ponha na mesa ${booksToLayOut()}. Olhe a frente e o verso de cada livro.`),
          hw() && (hwSet() || mix())
            ? interpretation(`turquoise locoweed: lay out its book${mix() ? " (if you use locoweed)" : ` with ${bookmarks()}`} now with green, blue and red — only yellow and purple are delayed by the Turn Indicator.`, `erva-louca turquesa: ponha o livro dela${mix() ? " (se usarem erva-louca)" : ` com ${bookmarks()}`} agora com verde, azul e vermelho — só amarelo e roxo são adiados pelo Indicador de Turno.`)
            : "",
          t(`Put the yellow and purple books of ${mix() ? "your choice" : setName()} aside: yellow comes out before turn 2, purple before turn 3.`, `Deixe de lado os livros amarelo e roxo ${mix() ? "escolhidos" : `do ${setName()}`}: o amarelo entra antes do turno 2, o roxo antes do turno 3.`),
          t("Sort all ingredient chips by colour and put each pile next to its book (yellow and purple piles too). Unused books go back in the box.", "Separe todas as fichas de ingrediente por cor e ponha cada pilha ao lado do seu livro (pilhas amarela e roxa também). Livros não usados voltam à caixa.")
        ]
      },
      {
        id: "players",
        title: t(`Player areas (×${n})`, `Áreas dos jogadores (×${n})`),
        codes: tubes() ? ["c3", "c8"] : ["c3"],
        items: [
          t("Each player takes a pot (player board), a bag and the scoring marker of their colour; put the marker on the seal tile of the same colour.", "Cada jogador pega um caldeirão (tabuleiro), uma bolsa e o marcador de pontos da sua cor; ponha o marcador no selo da mesma cor."),
          tubes()
            ? t("Pot with the test-tube side up. Put one droplet on the “0” space in the middle of the pot and a second droplet on the far-left test tube.", "Caldeirão com o lado dos tubos de ensaio para cima. Ponha uma gota no espaço “0” no meio do caldeirão e uma segunda gota no tubo mais à esquerda.")
            : t("Pot with the side without test tubes up. Put your droplet on the “0” space in the middle of the pot.", "Caldeirão com o lado sem tubos de ensaio para cima. Ponha a sua gota no espaço “0” no meio do caldeirão."),
          t("Your flask, full side up, on the large trivet next to the pot (bottom right).", "O seu frasco, lado cheio para cima, no suporte grande ao lado do caldeirão (embaixo à direita)."),
          t("Your rat stone on the small trivet to the left of the flask.", "A sua pedra de rato no suporte pequeno à esquerda do frasco."),
          hw() ? t("Herb Witches: 1 witch penny of each of the 3 colours (gold, silver, copper) per player.", "Herb Witches: 1 moeda de bruxa de cada uma das 3 cores (ouro, prata, cobre) por jogador.") : "",
          hw() ? t("Herb Witches: the overflow bowl of your pot's colour, under the spoon next to the pot.", "Herb Witches: a tigela de transbordo da cor do seu caldeirão, sob a colher ao lado do caldeirão.") : ""
        ]
      },
      {
        id: "bags",
        title: t("Fill the starting bags", "Encha as bolsas iniciais"),
        codes: ["c3"],
        items: [
          t("Each player puts into their bag: 4 white 1-chips, 2 white 2-chips, 1 white 3-chip, 1 orange 1-chip and 1 green 1-chip (9 chips).", "Cada jogador põe na bolsa: 4 fichas brancas 1, 2 brancas 2, 1 branca 3, 1 laranja 1 e 1 verde 1 (9 fichas)."),
          tubes()
            ? interpretation("the test-tube side does not print the starting bag, but nothing in the variation changes it: use the same 9 chips.", "o lado dos tubos não imprime a bolsa inicial, mas nada na variação a muda: use as mesmas 9 fichas.")
            : t("The same chips are pictured bottom left on the pot.", "As mesmas fichas aparecem embaixo à esquerda no caldeirão."),
          t("Never look into your bag.", "Nunca olhe dentro da sua bolsa.")
        ]
      }
    ];
    if (hw()) {
      phases.push({
        id: "witches",
        title: t("Reveal the herb witches", "Revele as bruxas das ervas"),
        codes: ["h1"],
        items: [
          t("Sort the 12 herb witches by type (the penny on each: gold, silver, copper — 4 of each).", "Separe as 12 bruxas das ervas por tipo (a moeda em cada uma: ouro, prata, cobre — 4 de cada)."),
          t("Turn one of each type face up at random and place the 3 below the round (turn) indicator.", "Revele ao acaso uma de cada tipo e ponha as 3 abaixo do indicador de rodada (turno)."),
          t("Return the other 9 witches to the box. Find the 3 face-up witches in the Herb Witches section of this guide.", "Devolva as outras 9 bruxas à caixa. Procure as 3 bruxas reveladas na seção Herb Witches deste guia.")
        ]
      });
    }
    return phases;
  }

  function inventory() {
    const n = state.players;
    const cards = [
      infoCard(t("SHARED", "COMPARTILHADO"), t("Table pieces", "Peças da mesa"), [
        rl("Scoring Track", "with Turn Indicator, Flame, Bonus Die.", "Trilha de Pontos", "com Indicador de Turno, Chama, Dado de Bônus."),
        rl("Fortune Teller cards", "24, start player's draw pile.", "Cartas da Vidente", "24, pilha de compra do primeiro jogador."),
        rl("Rubies", hw() ? "40 (20 + 20)." : "20.", "Rubis", hw() ? "40 (20 + 20)." : "20."),
        rl("Seal tiles", `${hw() && n === 5 ? 5 : 4}, “0” side up.`, "Selos", `${hw() && n === 5 ? 5 : 4}, lado “0” para cima.`)
      ], ["c1", "c2"]),
      infoCard(t("PER PLAYER", "POR JOGADOR"), t(`${n} sets`, `${n} conjuntos`), [
        rl("Pot, bag, flask, rat stone, scoring marker", "1 each.", "Caldeirão, bolsa, frasco, pedra de rato, marcador", "1 de cada."),
        rl("Droplets", tubes() ? "2 (pot + test tubes; the box has 4 spare for the variation)." : "1.", "Gotas", tubes() ? "2 (caldeirão + tubos; a caixa tem 4 extras para a variação)." : "1."),
        hw() ? rl("Herb Witches", "3 witch pennies (gold, silver, copper) and 1 overflow bowl.", "Herb Witches", "3 moedas de bruxa (ouro, prata, cobre) e 1 tigela de transbordo.") : "",
        rl("Starting bag", "4 white 1, 2 white 2, 1 white 3, 1 orange 1, 1 green 1.", "Bolsa inicial", "4 brancas 1, 2 brancas 2, 1 branca 3, 1 laranja 1, 1 verde 1.")
      ], hw() ? ["c3", "h1"] : ["c3"]),
      infoCard(t("BOOKS", "LIVROS"), mix() ? setName() : `${setName()} · ${bookmarks()}`, [
        rl("Every game", hw() ? "orange (Herb Witches pumpkin) and black." : "orange and black.", "Toda partida", hw() ? "laranja (abóbora das Herb Witches) e preto." : "laranja e preto."),
        rl("From turn 1", `green, blue, red${hw() && (hwSet() || mix()) ? ", turquoise (guide's reading)" : ""}.`, "Desde o turno 1", `verde, azul, vermelho${hw() && (hwSet() || mix()) ? ", turquesa (leitura do guia)" : ""}.`),
        rl("Before turn 2", "yellow.", "Antes do turno 2", "amarelo."),
        rl("Before turn 3", "purple.", "Antes do turno 3", "roxo.")
      ], ["c2", "c7"]),
      infoCard(t("CHIP SUPPLY", "RESERVA DE FICHAS"), t("Limited — base box counts", "Limitada — contagem da caixa base"), [
        rl("White", "20 × 1, 8 × 2, 4 × 3.", "Branca", "20 × 1, 8 × 2, 4 × 3."),
        rl("Orange", "20 × 1.", "Laranja", "20 × 1."),
        rl("Green", "15 × 1, 10 × 2, 13 × 4.", "Verde", "15 × 1, 10 × 2, 13 × 4."),
        rl("Blue", "14 × 1, 10 × 2, 10 × 4.", "Azul", "14 × 1, 10 × 2, 10 × 4."),
        rl("Red", "12 × 1, 8 × 2, 10 × 4.", "Vermelha", "12 × 1, 8 × 2, 10 × 4."),
        rl("Yellow", "13 × 1, 6 × 2, 10 × 4.", "Amarela", "13 × 1, 6 × 2, 10 × 4."),
        rl("Purple / black", "15 × 1 / 18 × 1.", "Roxa / preta", "15 × 1 / 18 × 1."),
        hw() ? rl("Herb Witches", "153 more chips (locoweed, 6-pumpkins and others); the booklet gives no per-colour breakdown.", "Herb Witches", "mais 153 fichas (erva-louca, abóboras 6 e outras); o livreto não dá a divisão por cor.") : ""
      ], hw() ? ["c1", "h1"] : ["c1"])
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
          <div class="setup-phase-references">${refs(phase.codes)}</div>
        </header>
        <label class="qk-setup-check" for="qk-setup-${phase.id}">
          <input id="qk-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="qk-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="qk-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), ["c2", "c3", "h1"])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${playersLabel()} · ${setName()} · ${potName()}${hw() ? " · Herb Witches" : ""}</h3>
            <p>${t("One checkbox per coherent step, in the rulebook's order.", "Uma caixa por etapa coerente, na ordem do livro.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved on this device separately from the match options. Changing the expansion, players, set or pot side clears it; changing the language or the drawing option does not. “Uncheck all” clears only these setup boxes.",
          "O progresso é salvo neste aparelho separado das opções da partida. Mudar a expansão, os jogadores, o conjunto ou o lado do caldeirão o limpa; trocar o idioma ou a opção de compra não. “Desmarcar tudo” limpa somente estas caixas da preparação."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <figure class="qk-art"><img src="${ART}starting-bag.webp" alt="${t("Starting bag: 1 green 1-chip, 1 orange 1-chip, 1 white 3-chip, 2 white 2-chips, 4 white 1-chips", "Bolsa inicial: 1 verde 1, 1 laranja 1, 1 branca 3, 2 brancas 2, 4 brancas 1")}" loading="lazy"><figcaption>${t("The starting bag, as pictured on p. 3.", "A bolsa inicial, como na p. 3.")}</figcaption></figure>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}`;
  }

  // ---------- quick reference ----------

  function quickReference() {
    const cards = [
      infoCard(t("EACH TURN (×9)", "CADA TURNO (×9)"), t("In this order", "Nesta ordem"), [
        rl("0 · Turn Indicator", "before turn 2 yellow book; before 3 purple book; before 6 everyone adds a white 1-chip to their bag.", "0 · Indicador de Turno", "antes do turno 2 livro amarelo; antes do 3 livro roxo; antes do 6 todos põem uma ficha branca 1 na bolsa."),
        rl("1 · Fortune Teller", "start player reads the top card aloud; it applies to everyone.", "1 · Vidente", "o primeiro jogador lê a carta do topo em voz alta; vale para todos."),
        rl("2 · Rats (from turn 2)", "everyone but the leader moves their rat stone ahead of their droplet by the rat-tails between them and the leader.", "2 · Ratos (do turno 2)", "todos menos o líder põem a pedra de rato à frente da gota conforme os rabos de rato entre eles e o líder."),
        rl("3 · Potions Phase", "everyone draws chips at once until they stop or explode.", "3 · Fase das Poções", "todos compram fichas ao mesmo tempo até parar ou explodir."),
        rl("4 · Evaluation A–F", "bonus die, chip actions, rubies, points, buying, end of turn.", "4 · Avaliação A–F", "dado de bônus, ações das fichas, rubis, pontos, compra, fim do turno.")
      ], ["c3", "c7"]),
      infoCard(t("DRAWING", "COMPRANDO"), t("Potions Phase", "Fase das Poções"), [
        rl("Place", "each chip as many spaces after the previous chip as its value (the first after your droplet, or your rat stone if it is in the pot). Gaps stay empty.", "Coloque", "cada ficha tantos espaços depois da anterior quanto o seu valor (a primeira depois da gota, ou da pedra de rato se estiver no caldeirão). Espaços pulados ficam vazios."),
        rl("After each chip", "stop or draw again. Empty bag: stop. Lay your bag down when you stop.", "Depois de cada ficha", "pare ou compre de novo. Bolsa vazia: pare. Deite a bolsa na mesa ao parar."),
        rl("Explosion", "white chips in the pot total more than 7: stop at once; the last chip still goes in.", "Explosão", "fichas brancas no caldeirão somam mais de 7: pare na hora; a última ficha ainda entra."),
        rl("Flask (full)", "if the last chip drawn is white and did not explode the pot, you may put it back in the bag; flip the flask to empty.", "Frasco (cheio)", "se a última ficha comprada é branca e não explodiu o caldeirão, você pode devolvê-la à bolsa; vire o frasco para vazio."),
        rl("Never", "look into your bag.", "Nunca", "olhe dentro da bolsa."),
        state.stir === "yes"
          ? rl("Stir! (every turn)", "draw together on the start player's command; stop by pulling your hand out empty.", "Mexam! (todo turno)", "comprem juntos ao comando do primeiro jogador; pare tirando a mão vazia.")
          : rl("Stir! (turn 9)", "in the last turn everyone draws together on the start player's command.", "Mexam! (turno 9)", "no último turno todos compram juntos ao comando do primeiro jogador.")
      ], ["c4", "c5", "c8"]),
      infoCard(t("EVALUATION", "AVALIAÇÃO"), t("Scoring space = the space right after your last chip", "Espaço de pontuação = o espaço logo depois da última ficha"), [
        `${glyph("phase-a", "A")} ${rl("A · Bonus Die", "furthest scoring space among pots that did not explode rolls. Same printed value: the space further from 0 wins; exact same space: all roll.", "A · Dado de Bônus", "o espaço de pontuação mais adiantado entre os caldeirões que não explodiram rola. Mesmo valor impresso: vence o espaço mais distante do 0; mesmo espaço exato: todos rolam.")}`,
        `${glyph("phase-b", "B")} ${rl("B · Chip actions", "start player first, clockwise: black, green, purple chips.", "B · Ações das fichas", "do primeiro jogador em sentido horário: fichas preta, verde, roxa.")}`,
        `${glyph("phase-c", "C")} ${rl("C · Rubies", "ruby printed on your scoring space → 1 ruby, exploded or not.", "C · Rubis", "rubi impresso no espaço de pontuação → 1 rubi, explodido ou não.")}`,
        `${glyph("exploded-choice", t("D or E", "D ou E"))} ${rl("Exploded?", "choose only D or only E.", "Explodiu?", "escolha só D ou só E.")}`,
        `${glyph("phase-d", "D")} ${rl("D · Victory points", "the number in the small square of your scoring space.", "D · Pontos", "o número no quadradinho do espaço de pontuação.")}`,
        `${glyph("phase-e", "E")} ${rl("E · Buy", "coins = your scoring space's number; 1 or 2 chips, never 2 of the same colour; leftovers are lost. Then put the new chips and every chip from your pot back into your bag. Turn 9: coins buy points instead (5 : 1).", "E · Compra", "moedas = número do espaço de pontuação; 1 ou 2 fichas, nunca 2 da mesma cor; sobras se perdem. Depois ponha as fichas novas e todas as fichas do caldeirão de volta na bolsa. Turno 9: as moedas compram pontos (5 : 1).")}`,
        `${glyph("phase-f", "F")} ${rl("F · End of turn", "2 rubies per droplet step (as many steps as you pay for) and/or 2 rubies to refill an empty flask. Rat stone back, pass the Fortune Teller deck clockwise (to the left), advance the Flame.", "F · Fim do turno", "2 rubis por passo da gota (quantos passos pagar) e/ou 2 rubis para reencher um frasco vazio. Pedra de rato volta, passe o baralho da Vidente em sentido horário (à esquerda), avance a Chama.")}`
      ], ["c5", "c6", "c7"]),
      infoCard(t("TURN 9 AND WINNING", "TURNO 9 E VITÓRIA"), t("Last turn", "Último turno"), [
        rl("Stir!", "everyone draws simultaneously.", "Mexam!", "todos compram simultaneamente."),
        `${glyph("buy-vp", t("5 coins or 2 rubies = 1 point", "5 moedas ou 2 rubis = 1 ponto"))} ${rl("Buy points", "at the end: 1 victory point per 5 coins or per 2 rubies, as often as you like.", "Compre pontos", "no fim: 1 ponto por 5 moedas ou por 2 rubis, quantas vezes quiser.")}`,
        hw() ? rl("Witch pennies", "each unused penny is worth 2 victory points.", "Moedas de bruxa", "cada moeda não usada vale 2 pontos.") : "",
        rl("Winner", "furthest on the Scoring Track. Tie: who filled their pot furthest in the last turn; still tied, shared win.", "Vencedor", "o mais adiantado na Trilha de Pontos. Empate: quem encheu mais o caldeirão no último turno; persistindo, vitória compartilhada.")
      ], hw() ? ["c8", "h2"] : ["c8"]),
      infoCard(t("SPOON (SPACE 33)", "COLHER (ESPAÇO 33)"), t("Reaching the end of the pot", "Chegando ao fim do caldeirão"), [
        t("A chip that reaches or passes space 33 is placed on 33: take the spoon's 15 victory points and shop with 35 coins (if your pot exploded, only one of the two: D or E).", "Uma ficha que chega ao espaço 33 ou passa dele fica no 33: pegue os 15 pontos da colher e compre com 35 moedas (se o caldeirão explodiu, só um dos dois: D ou E)."),
        t("Everyone who reaches it and did not explode rolls the Bonus Die.", "Todos que chegam lá sem explodir rolam o Dado de Bônus."),
        hw()
          ? t("Herb Witches: further chips go into your overflow bowl; half their total value (rounded down) adds victory points; whites there still count for explosions.", "Herb Witches: fichas seguintes vão para a tigela de transbordo; metade do valor total (para baixo) vira pontos; brancas ali ainda contam para explosão.")
          : ""
      ], hw() ? ["c6", "h2"] : ["c6"])
    ];
    if (hw()) {
      cards.push(infoCard(t("HERB WITCHES", "BRUXAS DAS ERVAS"), t("3 pennies, once each", "3 moedas, uma vez cada"), [
        t("Hand over the penny of a face-up witch's colour, in the phase printed on her, to use her power.", "Entregue a moeda da cor de uma bruxa revelada, na fase impressa nela, para usar o poder."),
        t("Each penny once per game; 1, 2 or all 3 may be used in the same turn.", "Cada moeda uma vez por partida; 1, 2 ou as 3 podem ser usadas no mesmo turno."),
        t("Unused pennies: 2 victory points each at the end.", "Moedas não usadas: 2 pontos cada no fim.")
      ], ["h1", "h2"]));
    }
    if (tubes()) {
      cards.push(infoCard(t("TEST-TUBE SIDE", "LADO DOS TUBOS"), t("Two droplets", "Duas gotas"), [
        t("Whenever you may move your droplet, move either the pot droplet or the test-tube droplet (1 glass right).", "Sempre que puder mover a gota, mova a do caldeirão ou a dos tubos (1 vidro à direita)."),
        t("Test tube reached: take its bonus at once — ruby, 1–4 victory points, or the chips shown into your bag.", "Tubo alcançado: pegue o bônus na hora — rubi, 1–4 pontos, ou as fichas mostradas para a bolsa."),
        t("Explosions work as usual.", "Explosões funcionam normalmente.")
      ], ["c8"]));
    }
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), ["c3", "c4", "c5", "c6", "c7", "c8"])}
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- rule sections ----------

  function roundSection() {
    return `
      ${sectionHeading("round", t("The 9 turns", "Os 9 turnos"), ["c3", "c7", "c8"])}
      <p class="qk-lede">${t(
        "Quacks brew for 9 turns of the Quedlinburg bazaar. Each turn everyone draws ingredient chips from their own bag into their pot at the same time: the further the potion gets, the more points and coins it pays — but too many white cherry bombs blow the pot up. Coins buy better chips that go into the bag for later turns.",
        "Os charlatães cozinham por 9 turnos da feira de Quedlinburg. A cada turno todos compram fichas de ingrediente da própria bolsa para o caldeirão ao mesmo tempo: quanto mais longe a poção vai, mais pontos e moedas rende — mas bombas-cereja brancas demais explodem o caldeirão. As moedas compram fichas melhores que vão para a bolsa nos turnos seguintes."
      )}</p>
      <div class="quick-grid">
        ${infoCard(t("TURN INDICATOR", "INDICADOR DE TURNO"), t("What happens before some turns", "O que acontece antes de alguns turnos"), [
          `${glyph("book-yellow", t("Yellow book", "Livro amarelo"))} ${rl("Before turn 2", "lay out the yellow ingredient book; yellow chips can be bought from now on.", "Antes do turno 2", "ponha o livro amarelo na mesa; fichas amarelas podem ser compradas a partir de agora.")}`,
          `${glyph("book-purple", t("Purple book", "Livro roxo"))} ${rl("Before turn 3", "lay out the purple ingredient book.", "Antes do turno 3", "ponha o livro roxo na mesa.")}`,
          `${glyph("white-chip", t("White 1-chip", "Ficha branca 1"))} ${rl("Before turn 6", "each player puts 1 more white 1-chip into their bag.", "Antes do turno 6", "cada jogador põe mais 1 ficha branca 1 na bolsa.")}`,
          `${glyph("stir", "Stir!")} ${rl("Turn 9", "simultaneous drawing on “Stir!” and the points purchase at the end.", "Turno 9", "compra simultânea com “Mexam!” e a compra de pontos no fim.")}`,
          t("The Flame moves one space at the end of every turn.", "A Chama anda um espaço no fim de cada turno.")
        ], ["c7", "c8"])}
        ${infoCard(t("START PLAYER", "PRIMEIRO JOGADOR"), t("Rotates with the Fortune Teller deck", "Gira com o baralho da Vidente"), [
          t("Whoever has the Fortune Teller deck in front of them is the start player.", "Quem tem o baralho da Vidente à sua frente é o primeiro jogador."),
          t("At the end of each turn the deck passes clockwise to the next player.", "No fim de cada turno o baralho passa em sentido horário ao próximo jogador."),
          t("The start player begins phases B, D and E; the others follow clockwise.", "O primeiro jogador começa as fases B, D e E; os outros seguem em sentido horário.")
        ], ["c3", "c6", "c7"])}
        ${infoCard(t("YOUR POT", "O SEU CALDEIRÃO"), t("Reading a space", "Lendo um espaço"), [
          `${glyph("scoring-space", t("Scoring space", "Espaço de pontuação"))} ${rl("Big number", "the space's value: the coins you get to shop.", "Número grande", "o valor do espaço: as moedas para comprar.")}`,
          rl("Small square", "the victory points.", "Quadradinho", "os pontos."),
          rl("Ruby", "some spaces show a ruby: 1 ruby in phase C.", "Rubi", "alguns espaços mostram um rubi: 1 rubi na fase C."),
          rl("Droplet", "your starting point; moving it forward (2 rubies, die, cards, books) makes every later potion start further on.", "Gota", "o seu ponto de partida; avançá-la (2 rubis, dado, cartas, livros) faz toda poção seguinte começar mais à frente.")
        ], ["c3", "c5", "c7"])}
      </div>`;
  }

  function fortuneSection() {
    return `
      ${sectionHeading("fortune", t("Fortune Teller & rats", "Vidente e ratos"), ["c3"])}
      <div class="quick-grid">
        ${infoCard(t("FORTUNE TELLER CARD", "CARTA DA VIDENTE"), t("Start of every turn", "Início de todo turno"), [
          t("The start player reads the top card aloud and lays it face up next to the Scoring Track (discard pile). It applies to all players.", "O primeiro jogador lê a carta do topo em voz alta e a põe virada para cima ao lado da Trilha de Pontos (descarte). Ela vale para todos."),
          rl("Purple card", "carried out right away, before the turn starts.", "Carta roxa", "cumprida na hora, antes de o turno começar."),
          rl("Blue card", "applies for the whole turn or at its end.", "Carta azul", "vale o turno todo ou no fim dele."),
          t("A card offering a yellow or purple chip works only if that book is already out.", "Uma carta que oferece ficha amarela ou roxa só funciona se esse livro já estiver na mesa."),
          t("The exact text is on each card.", "O texto exato está em cada carta."),
          hw() ? t("Herb Witches clarification: chips a card tells you to draw (e.g. “Overpowering ingredient”, “A second chance”) cannot make the pot explode, even past the limit. The chip placed with “Overpowering ingredient” does not use its action.", "Esclarecimento das Herb Witches: fichas que uma carta manda comprar (ex.: “Overpowering ingredient”, “A second chance”) não podem explodir o caldeirão, mesmo acima do limite. A ficha posta com “Overpowering ingredient” não usa a ação.") : "",
          hw() ? t("Upgrades from cards (e.g. “An opportunistic moment”) never apply to pumpkins.", "Melhorias de cartas (ex.: “An opportunistic moment”) nunca valem para abóboras.") : ""
        ], hw() ? ["c3", "h4"] : ["c3"])}
        ${infoCard(t("RATS (FROM TURN 2)", "RATOS (DO TURNO 2)"), t("Catch-up before brewing", "Ajuda para quem está atrás"), [
          `${glyph("rat-stone", t("Rat stone", "Pedra de rato"))} ${t("After the card, everyone except the leader on the Scoring Track counts the rat-tails printed on the track between their marker and the leader's.", "Depois da carta, todos menos o líder na Trilha de Pontos contam os rabos de rato impressos na trilha entre o seu marcador e o do líder.")}`,
          t("Put your rat stone that many spaces past your droplet. Your first chip goes after the rat stone.", "Ponha a pedra de rato esse número de espaços depois da gota. A primeira ficha vai depois da pedra de rato."),
          t("No rat-tail between you and the leader: the rat stone stays on its trivet.", "Nenhum rabo de rato entre você e o líder: a pedra fica no suporte."),
          interpretation("players tied for the lead are all leaders and get no rats.", "jogadores empatados na liderança são todos líderes e não ganham ratos."),
          t("At the end of the turn the rat stone goes back to the trivet.", "No fim do turno a pedra de rato volta ao suporte.")
        ], ["c3", "c7"])}
      </div>`;
  }

  function potionSection() {
    return `
      ${sectionHeading("potion", t("Potions Phase", "Fase das Poções"), ["c4", "c5", "c8"])}
      <div class="quick-grid">
        ${infoCard(t("DRAW AND PLACE", "COMPRE E COLOQUE"), t("Everyone at the same time", "Todos ao mesmo tempo"), [
          t("There are no individual turns: all players draw from their own bag and fill their own pot at once.", "Não há vez individual: todos compram da própria bolsa e enchem o próprio caldeirão ao mesmo tempo."),
          state.stir === "yes"
            ? t("Option chosen: draw simultaneously in every turn — on the start player's “Stir!”, everyone reaches in and takes one chip; to stop, pull your hand out empty.", "Opção escolhida: compra simultânea em todo turno — ao “Mexam!” do primeiro jogador, todos põem a mão na bolsa e tiram uma ficha; para parar, tire a mão vazia.")
            : t("You need not draw in sync with the others (except in turn 9).", "Você não precisa comprar em sincronia com os outros (exceto no turno 9)."),
          rl("First chip", "on the space as many spaces after your droplet — or after your rat stone, if it is in the pot — as its value (1, 2, 3 or 4).", "Primeira ficha", "no espaço tantos espaços depois da gota — ou depois da pedra de rato, se ela estiver no caldeirão — quanto o seu valor (1, 2, 3 ou 4)."),
          rl("Each next chip", "that many spaces after the previous chip. Skipped spaces stay empty.", "Cada ficha seguinte", "esse número de espaços depois da ficha anterior. Espaços pulados ficam vazios."),
          rl("Then decide", "stop, or draw another chip.", "Então decida", "pare ou compre outra ficha."),
          rl("Must stop", "when your bag is empty, or when your pot explodes.", "Tem de parar", "quando a bolsa esvaziar, ou quando o caldeirão explodir."),
          t("Lay your bag on the table when you stop, so everyone sees who is still drawing. Never look into your bag.", "Deite a bolsa na mesa ao parar, para todos verem quem ainda compra. Nunca olhe dentro da bolsa.")
        ], ["c4"])}
        ${infoCard(t("EXPLOSION", "EXPLOSÃO"), t("More than 7 in white chips", "Mais de 7 em fichas brancas"), [
          `${glyph("exploded-pot", t("Exploded pot", "Caldeirão explodido"))} ${t("If the white chips in your pot add up to more than 7, the pot explodes.", "Se as fichas brancas no caldeirão somarem mais de 7, o caldeirão explode.")}`,
          t("Only the numbers on white chips count; coloured chips never do.", "Só contam os números das fichas brancas; fichas coloridas nunca."),
          t("You must stop at once and may not draw again, but the chip that exploded the pot is still placed.", "Você tem de parar na hora e não pode comprar mais, mas a ficha que explodiu o caldeirão ainda é posta."),
          t("Fortune Teller and chip actions still work after an explosion.", "Ações da Vidente e das fichas ainda funcionam depois de uma explosão."),
          `${glyph("no-die", t("No Bonus Die", "Sem Dado de Bônus"))} ${t("In Evaluation you skip A (no die) and choose D or E.", "Na Avaliação você pula A (sem dado) e escolhe D ou E.")}`
        ], ["c4", "c5", "c6"])}
        ${infoCard(t("CHIP ACTIONS", "AÇÕES DAS FICHAS"), t("When each colour acts", "Quando cada cor age"), [
          rl("White and orange", "no action.", "Branca e laranja", "sem ação."),
          rl(`Blue, red, yellow${hw() && (hwSet() || mix()) ? ", turquoise" : ""}`, "act as soon as drawn and placed.", `Azul, vermelha, amarela${hw() && (hwSet() || mix()) ? ", turquesa" : ""}`, "agem assim que compradas e postas."),
          rl("Green, purple, black", "act only in Evaluation phase B.", "Verde, roxa, preta", "agem só na fase B da Avaliação."),
          t("You may pass on any action.", "Você pode abrir mão de qualquer ação."),
          t("The effect of each colour is on its book; see Ingredient books.", "O efeito de cada cor está no seu livro; veja Livros de ingredientes.")
        ], ["c5"])}
        ${infoCard(t("FLASK", "FRASCO"), t("Once per turn, while full", "Uma vez por turno, se cheio"), [
          `${glyph("ruby-flask", t("Refill flask", "Reencher frasco"))} ${t("If the last chip you drew is white, you may put it back into your bag using your flask.", "Se a última ficha comprada é branca, você pode devolvê-la à bolsa usando o frasco.")}`,
          t("Not if that chip made the pot explode.", "Não se essa ficha explodiu o caldeirão."),
          t("Flip the flask to its empty side. You may keep drawing afterwards.", "Vire o frasco para o lado vazio. Você pode continuar comprando depois."),
          t("It works again only after you refill it (2 rubies in phase F).", "Ele só volta a funcionar depois de reenchido (2 rubis na fase F).")
        ], ["c5", "c7"])}
        ${infoCard(t("TURN 9", "TURNO 9"), t("“Stir!”", "“Mexam!”"), [
          `${glyph("stir", "Stir!")} ${t("The start player calls “Stir!”: everyone reaches into their bag and takes out a chip at the same time.", "O primeiro jogador diz “Mexam!”: todos põem a mão na bolsa e tiram uma ficha ao mesmo tempo.")}`,
          t("To stop, pull your hand out of the bag with no chip.", "Para parar, tire a mão da bolsa sem ficha."),
          t("Repeat until everyone has stopped or exploded.", "Repita até todos pararem ou explodirem."),
          hw() ? t("If someone uses the silver witch “draw 6 chips”, the simultaneous drawing pauses until they finish.", "Se alguém usar a bruxa de prata “compre 6 fichas”, a compra simultânea pausa até ele terminar.") : ""
        ], hw() ? ["c8", "h1"] : ["c8"])}
      </div>`;
  }

  function evaluationSection() {
    const dieFaces = [
      ["die-1vp", t("1 victory point.", "1 ponto.")],
      ["die-2vp", t("2 victory points.", "2 pontos.")],
      ["die-ruby", t("1 ruby.", "1 rubi.")],
      ["die-droplet", t("Move your droplet 1 space forward (if a chip is on that space, set it aside to fit the droplet).", "Avance a gota 1 espaço (se houver uma ficha nesse espaço, afaste-a para caber a gota).")],
      ["die-pumpkin", t("1 orange chip into your bag.", "1 ficha laranja para a bolsa.")]
    ];
    return `
      ${sectionHeading("evaluation", t("Evaluation A–F", "Avaliação A–F"), ["c5", "c6", "c7", "c8"])}
      <p class="qk-lede">${t(
        "When everyone has stopped, find your scoring space: the space directly after the last chip in your pot — whether or not that chip exploded the pot. Then work through the six steps printed in the middle of the scoring banner.",
        "Quando todos pararem, ache o seu espaço de pontuação: o espaço logo depois da última ficha do caldeirão — tenha ela explodido o caldeirão ou não. Depois sigam os seis passos impressos no meio da faixa de pontuação."
      )}</p>
      <div class="quick-grid">
        ${infoCard("A", t("Bonus Die", "Dado de Bônus"), [
          `${glyph("phase-a", "A")} ${t("Among players whose pot did not explode, the one with the furthest scoring space rolls the Bonus Die and takes the bonus.", "Entre os jogadores cujo caldeirão não explodiu, quem tem o espaço de pontuação mais adiantado rola o Dado de Bônus e pega o bônus.")}`,
          t("Same printed value? The space further from 0 wins.", "Mesmo valor impresso? Vence o espaço mais distante do 0."),
          t("Exact tie: all of them roll.", "Empate exato: todos rolam."),
          t("Exploded players never roll in A.", "Quem explodiu nunca rola em A."),
          t("The rulebook lists these five results; read the face you roll:", "O livro lista estes cinco resultados; leia a face que sair:"),
          ...dieFaces.map(([file, text]) => `${glyph(file, text)} ${text}`)
        ], ["c5", "c6"])}
        ${infoCard("B", t("Chip actions", "Ações das fichas"), [
          `${glyph("phase-b", "B")} ${t("Start player first, then clockwise: each player carries out their black, green and purple chips' actions (see Ingredient books).", "Primeiro jogador, depois em sentido horário: cada um cumpre as ações das suas fichas pretas, verdes e roxas (veja Livros de ingredientes).")}`,
          t("Exploded pots take part too.", "Caldeirões explodidos também participam.")
        ], hw() ? ["c6", "h4"] : ["c6"])}
        ${infoCard("C", t("Rubies", "Rubis"), [
          `${glyph("phase-c", "C")} ${t("If your scoring space shows a ruby, take 1 ruby — exploded or not.", "Se o espaço de pontuação mostra um rubi, pegue 1 rubi — explodido ou não.")}`
        ], ["c6"])}
        ${infoCard(t("EXPLODED?", "EXPLODIU?"), t("D or E, not both", "D ou E, não os dois"), [
          `${glyph("exploded-choice", t("Choose D or E", "Escolha D ou E"))} ${t("A player whose pot exploded now chooses: either the victory points (D) or the shopping (E).", "Quem explodiu escolhe agora: ou os pontos (D) ou a compra (E).")}`,
          t("Players who did not explode do both.", "Quem não explodiu faz os dois.")
        ], ["c6"])}
        ${infoCard("D", t("Victory points", "Pontos"), [
          `${glyph("phase-d", "D")} ${t("Start player first: move your scoring marker forward by the victory points in the small square of your scoring space.", "Primeiro jogador primeiro: avance o marcador de pontos pelos pontos do quadradinho do espaço de pontuação.")}`,
          t("Space 33 or beyond: the chip stays on 33; take the spoon's 15 points (and 35 coins in E). If your pot did not explode, roll the Bonus Die too.", "Espaço 33 ou além: a ficha fica no 33; pegue os 15 pontos da colher (e 35 moedas em E). Se não explodiu, role também o Dado de Bônus."),
          hw() ? t("Herb Witches overflow bowl: then add half the total value of the chips in your bowl (rounded down) as victory points.", "Tigela de transbordo das Herb Witches: depois some metade do valor total das fichas da tigela (para baixo) em pontos.") : "",
          interpretation("the seal tile shows “0” and “50”: flip it to 50 when your marker passes the end of the track and starts a new lap.", "o selo mostra “0” e “50”: vire-o para 50 quando o seu marcador passar do fim da trilha e começar uma nova volta.")
        ], hw() ? ["c6", "h2"] : ["c6"])}
        ${infoCard("E", t("Buy chips", "Compre fichas"), [
          `${glyph("phase-e", "E")} ${t("Start player first, in turn order.", "Primeiro jogador primeiro, em ordem.")}`,
          rl("Coins", "the number of your scoring space (35 on the spoon).", "Moedas", "o número do espaço de pontuação (35 na colher)."),
          rl("Buy", "1 or 2 chips; 2 chips must be different colours.", "Compre", "1 ou 2 fichas; 2 fichas têm de ser de cores diferentes."),
          rl("Price", "on the book: left = 1-chip, middle = 2-chip, right = 4-chip. One number = only 1-chips exist.", "Preço", "no livro: esquerda = ficha 1, meio = ficha 2, direita = ficha 4. Um só número = só existem fichas 1."),
          rl("Only books already out", "yellow from turn 2, purple from turn 3.", "Só livros já na mesa", "amarelo do turno 2, roxo do turno 3."),
          rl("Limited", "a colour with no chips left cannot be bought.", "Limitado", "uma cor sem fichas não pode ser comprada."),
          rl("Leftover coins", "are lost.", "Moedas que sobram", "se perdem."),
          t(`Then everyone puts the new chips and all chips from their pot${hw() ? " and overflow bowl" : ""} back into their bag.`, `Depois todos põem as fichas novas e todas as fichas do caldeirão${hw() ? " e da tigela de transbordo" : ""} de volta na bolsa.`),
          rl("Turn 9", "coins buy victory points instead (5 coins = 1 point).", "Turno 9", "as moedas compram pontos (5 moedas = 1 ponto).")
        ], ["c6", "c7", "c8"])}
        ${infoCard("F", t("End of turn", "Fim do turno"), [
          `${glyph("phase-f", "F")} ${t("Spend rubies, as often as you can pay:", "Gaste rubis, quantas vezes puder pagar:")}`,
          `${glyph("ruby-droplet", t("2 rubies: droplet", "2 rubis: gota"))} ${rl("2 rubies", "move your droplet 1 space forward (permanently: later potions start further on).", "2 rubis", "avance a gota 1 espaço (permanente: as próximas poções começam mais à frente).")}`,
          `${glyph("ruby-flask", t("2 rubies: flask", "2 rubis: frasco"))} ${rl("2 rubies", "refill your flask (flip it to full) for the next turn.", "2 rubis", "reencha o frasco (vire para cheio) para o próximo turno.")}`,
          t("Rat stones back on their trivets.", "Pedras de rato de volta aos suportes."),
          t("Pass the Fortune Teller deck clockwise: that player is the new start player.", "Passe o baralho da Vidente em sentido horário: esse jogador é o novo primeiro jogador."),
          t("Move the Flame to the next space and start the next turn.", "Avance a Chama e comece o próximo turno."),
          rl("End of turn 9", "also buy victory points: 5 coins or 2 rubies each, as often as you like.", "Fim do turno 9", "compre também pontos: 5 moedas ou 2 rubis cada, quantas vezes quiser.")
        ], ["c7", "c8"])}
      </div>`;
  }

  function witchesSection() {
    const witch = (file, phase, en, pt) => `
      <article class="qk-witch-card">
        <img src="${ART}witch-${file}.webp" alt="${t("Herb witch card", "Carta de bruxa das ervas")}" loading="lazy">
        <div><span class="component-label">${phase}</span>${lineList(state.language === "pt-BR" ? pt : en)}</div>
      </article>`;
    const silver = [
      witch("silver-flask", t("POTIONS PHASE", "FASE DAS POÇÕES"), ["Even though your pot exploded, use your flask to return the last white chip (the one that exploded the pot) to the bag.", "Then draw more chips or end your turn.", "Your flask must be full."], ["Mesmo com o caldeirão explodido, use o frasco para devolver à bolsa a última ficha branca (a que explodiu).", "Depois compre mais fichas ou encerre o turno.", "O frasco tem de estar cheio."]),
      witch("silver-draw-six", t("POTIONS PHASE", "FASE DAS POÇÕES"), ["Any time before you end your turn (and while the pot has not exploded), draw 6 chips.", "Choose which and how many to put in your pot, and in which order; carry out their actions as usual.", "Return the rest to the bag. In turn 9 (or whenever you draw simultaneously) the simultaneous drawing pauses until you finish."], ["A qualquer momento antes de encerrar o turno (e com o caldeirão sem explodir), compre 6 fichas.", "Escolha quais e quantas pôr no caldeirão, e em que ordem; cumpra as ações normalmente.", "Devolva o resto à bolsa. No turno 9 (ou sempre que comprarem simultaneamente) a compra simultânea pausa até você terminar."]),
      witch("silver-return-whites", t("POTIONS PHASE", "FASE DAS POÇÕES"), ["If your pot has not exploded: return the last 2 white chips you added to the bag (or only 1 of them).", "They need not be next to each other or on the last spaces. Gaps are not filled."], ["Se o caldeirão não explodiu: devolva à bolsa as 2 últimas fichas brancas que você pôs (ou só 1 delas).", "Elas não precisam estar juntas nem nos últimos espaços. As lacunas não são preenchidas."]),
      witch("silver-full-bonus", t("EVALUATION", "AVALIAÇÃO"), ["Even though your pot exploded, get all bonuses: victory points and shopping.", "If you went the furthest, you may also roll the Bonus Die."], ["Mesmo com o caldeirão explodido, receba todos os bônus: pontos e compra.", "Se você foi o mais longe, também pode rolar o Dado de Bônus."])
    ];
    const copper = [
      witch("copper-upgrade", t("PHASE E · BUYING", "FASE E · COMPRA"), ["Upgrade the last 2 chips placed in your pot by 1 level each — or 1 chip anywhere in the pot.", "Only 1 → 2 or 2 → 4; never pumpkins; not on chips just bought.", "Also usable if your pot exploded and you chose victory points."], ["Melhore em 1 nível as 2 últimas fichas do caldeirão — ou 1 ficha em qualquer posição.", "Só 1 → 2 ou 2 → 4; nunca abóboras; não em fichas recém-compradas.", "Também pode ser usada se você explodiu e escolheu pontos."]),
      witch("copper-double", t("PHASE E · BUYING", "FASE E · COMPRA"), ["Double your purchase value. Still at most 2 chips of different colours.", "In turn 9: buy victory points with twice the value (5 : 1)."], ["Dobre o seu valor de compra. Ainda no máximo 2 fichas de cores diferentes.", "No turno 9: compre pontos com o dobro do valor (5 : 1)."]),
      witch("copper-free-chip", t("PHASE E · BUYING", "FASE E · COMPRA"), ["Take one more of a chip you just bought, for free: 3 chips in total, 2 of them the same colour."], ["Pegue grátis mais uma de uma ficha que acabou de comprar: 3 fichas no total, 2 da mesma cor."]),
      witch("copper-ruby-value", t("PHASE E · BUYING", "FASE E · COMPRA"), ["Your purchase value rises by 2 for every ruby you own. You keep the rubies."], ["O seu valor de compra sobe 2 por rubi que você tem. Você fica com os rubis."])
    ];
    const gold = [
      witch("gold-colours", t("PHASE D · VICTORY POINTS", "FASE D · PONTOS"), ["Score by the number of different chip colours in your pot (white not counted): 1–4 colours → 3 points; 5 → 4; 6 → 7; 7 → 10; 8 → 14 (table printed on the witch)."], ["Pontue pelo número de cores de ficha diferentes no caldeirão (branca não conta): 1–4 cores → 3 pontos; 5 → 4; 6 → 7; 7 → 10; 8 → 14 (tabela impressa na bruxa)."]),
      witch("gold-bag", t("PHASE D · VICTORY POINTS", "FASE D · PONTOS"), ["Empty out your bag next to the pot: 2 points for every coloured 2-, 4- or 6-chip and every purple or locoweed chip left in it. White chips do not count.", "Also usable if you exploded and chose to buy."], ["Esvazie a bolsa ao lado do caldeirão: 2 pontos para cada ficha colorida 2, 4 ou 6 e cada ficha roxa ou erva-louca que restou nela. Brancas não contam.", "Também pode ser usada se você explodiu e escolheu comprar."]),
      witch("gold-rubies", t("PHASE C · RUBIES", "FASE C · RUBIS"), ["When your scoring space gives you a ruby, take as many rubies as the victory points on that space instead. You still score the points (even if exploded).", "Also usable if you exploded and chose to buy.", "With the card “It's shining extra bright” out, choose: its 2 rubies or this witch."], ["Quando o espaço de pontuação lhe der um rubi, pegue em vez disso tantos rubis quanto os pontos desse espaço. Você ainda marca os pontos (mesmo explodido).", "Também pode ser usada se você explodiu e escolheu comprar.", "Com a carta “It's shining extra bright” revelada, escolha: os 2 rubis dela ou esta bruxa."]),
      witch("gold-cheap-rubies", t("PHASE F · END OF TURN", "FASE F · FIM DO TURNO"), ["This turn, moving the droplet or refilling the flask costs only 1 ruby each, as many times as you pay."], ["Neste turno, avançar a gota ou reencher o frasco custa só 1 rubi cada, quantas vezes pagar."])
    ];
    return `
      ${sectionHeading("witches", t("The Herb Witches", "As Bruxas das Ervas"), ["h1", "h2", "h4"])}
      <div class="quick-grid">
        ${infoCard(t("WITCH PENNIES", "MOEDAS DE BRUXA"), t("Three chances per game", "Três chances por partida"), [
          `${glyph("penny-gold", t("Gold penny", "Moeda de ouro"))} ${glyph("penny-silver", t("Silver penny", "Moeda de prata"))} ${glyph("penny-copper", t("Copper penny", "Moeda de cobre"))} ${t("Each player has one penny of each colour.", "Cada jogador tem uma moeda de cada cor.")}`,
          t("To use a face-up witch, hand over the penny of her colour during the phase printed on her.", "Para usar uma bruxa revelada, entregue a moeda da cor dela durante a fase impressa nela."),
          interpretation("a handed-over penny leaves the game (put it in the box); each player can therefore use each witch once.", "uma moeda entregue sai do jogo (ponha-a na caixa); cada jogador usa cada bruxa uma vez."),
          t("You may use 1, 2 or all 3 pennies in the same turn.", "Você pode usar 1, 2 ou as 3 moedas no mesmo turno."),
          t("Every unused penny is worth 2 victory points at the end of the game.", "Cada moeda não usada vale 2 pontos no fim da partida."),
          t("Only the 3 face-up witches count. Below are all 12, grouped by penny colour: find yours.", "Só contam as 3 bruxas reveladas. Abaixo estão as 12, agrupadas pela cor da moeda: ache as suas.")
        ], ["h1", "h2"])}
        ${infoCard(t("OVERFLOW BOWL", "TIGELA DE TRANSBORDO"), t("Past space 33", "Além do espaço 33"), [
          `${glyph("overflow-no-book", t("No book actions", "Sem ações de livro"))} ${t("A chip that reaches or passes 33 is placed on 33. If it would affect the next chip drawn, that action is lost.", "A ficha que chega ao 33 ou passa dele fica no 33. Se ela afetaria a próxima ficha comprada, essa ação se perde.")}`,
          t("Further chips you draw go into your overflow bowl. Coloured chips there trigger no book actions, but white chips still count towards the explosion.", "As fichas seguintes vão para a tigela de transbordo. Fichas coloridas ali não ativam ações de livro, mas as brancas ainda contam para a explosão."),
          t("Phase D: first the spoon (15 points, 35 coins), then half the total value of the bowl's chips, rounded down, as victory points.", "Fase D: primeiro a colher (15 pontos, 35 moedas), depois metade do valor total das fichas da tigela, para baixo, em pontos."),
          t("Everyone who reached the last space without exploding rolls the Bonus Die, whatever is in their bowl.", "Todos que chegaram ao último espaço sem explodir rolam o Dado de Bônus, seja o que for que há na tigela.")
        ], ["h2"])}
        ${infoCard(t("PUMPKINS", "ABÓBORAS"), t("Never upgraded", "Nunca melhoradas"), [
          t("No upgrade — by a book, a witch or a Fortune Teller card — applies to pumpkins. A 1-pumpkin never becomes a 6-pumpkin.", "Nenhuma melhoria — de livro, bruxa ou carta da Vidente — vale para abóboras. Uma abóbora 1 nunca vira abóbora 6.")
        ], ["h3", "h4"])}
      </div>
      <h3 class="subhead">${t("Silver witches", "Bruxas de prata")}</h3>
      <div class="qk-witch-grid">${silver.join("")}</div>
      <h3 class="subhead">${t("Copper witches", "Bruxas de cobre")}</h3>
      <div class="qk-witch-grid">${copper.join("")}</div>
      <h3 class="subhead">${t("Gold witches", "Bruxas de ouro")}</h3>
      <div class="qk-witch-grid">${gold.join("")}</div>
      <p class="qk-source-row">${referenceLink("h1")} ${referenceLink("h2")}</p>`;
  }

  function tubesSection() {
    return `
      ${sectionHeading("tubes", t("Test-tube side (Game Variation)", "Lado dos tubos (Variação)"), ["c8"])}
      <div class="quick-grid">
        ${infoCard(t("TWO DROPLETS", "DUAS GOTAS"), t("Pot or test tubes", "Caldeirão ou tubos"), [
          t("Play on the back of the pots. Besides the pot droplet, a second droplet starts on the far-left test tube.", "Joga-se no verso dos caldeirões. Além da gota do caldeirão, uma segunda gota começa no tubo mais à esquerda."),
          t("Whenever you can move your droplet forward — Fortune Teller card, chip action, Bonus Die or paying 2 rubies — choose which droplet moves.", "Sempre que puder avançar a gota — carta da Vidente, ação de ficha, Dado de Bônus ou pagando 2 rubis — escolha qual gota anda."),
          t("The test-tube droplet moves 1 glass to the right and you immediately take the bonus shown there.", "A gota dos tubos anda 1 vidro à direita e você pega na hora o bônus mostrado ali."),
          t("The explosion rule still applies, even though the back side does not show it.", "A regra de explosão continua valendo, mesmo que o verso não a mostre."),
          interpretation("once the test-tube droplet is on the last glass it cannot move further; later moves go to the pot droplet.", "quando a gota dos tubos estiver no último vidro, ela não anda mais; os próximos avanços vão para a gota do caldeirão.")
        ], ["c8"])}
        ${infoCard(t("TEST-TUBE BONUSES", "BÔNUS DOS TUBOS"), t("Printed on the glasses", "Impressos nos vidros"), [
          `${glyph("tube-ruby", t("Ruby", "Rubi"))} ${t("1 ruby.", "1 rubi.")}`,
          `${glyph("tube-vp", t("1–4 victory points", "1–4 pontos"))} ${t("1, 2, 3 or 4 victory points, as shown.", "1, 2, 3 ou 4 pontos, como mostrado.")}`,
          `${glyph("tube-chips", t("Chips", "Fichas"))} ${t("The chips shown, straight into your bag.", "As fichas mostradas, direto para a bolsa.")}`,
          interpretation("test-tube chips come from the limited general supply; a chip that has run out is not received.", "as fichas dos tubos vêm da reserva geral limitada; uma ficha esgotada não é recebida.")
        ], ["c8"])}
      </div>`;
  }

  function endSection() {
    return `
      ${sectionHeading("end", t("End of game", "Fim de jogo"), ["c8", "h2"])}
      <div class="quick-grid">
        ${infoCard(t("AFTER TURN 9", "DEPOIS DO TURNO 9"), t("Final purchases", "Compras finais"), [
          `${glyph("buy-vp", t("5 coins or 2 rubies = 1 point", "5 moedas ou 2 rubis = 1 ponto"))} ${t("At the end of the last turn, buy victory points: 1 point for 5 coins or for 2 rubies, as often as you like.", "No fim do último turno, compre pontos: 1 ponto por 5 moedas ou por 2 rubis, quantas vezes quiser.")}`,
          hw() ? t("Herb Witches: each unused witch penny adds 2 victory points.", "Herb Witches: cada moeda de bruxa não usada soma 2 pontos.") : ""
        ], hw() ? ["c8", "h2"] : ["c8"])}
        ${infoCard(t("WINNER", "VENCEDOR"), t("Furthest on the Scoring Track", "Mais adiantado na Trilha de Pontos"), [
          t("The player whose scoring marker is furthest along the Scoring Track wins.", "Vence quem tem o marcador mais adiantado na Trilha de Pontos."),
          rl("Tie", "the tied player who filled their pot the most in the last turn wins.", "Empate", "vence, entre os empatados, quem encheu mais o caldeirão no último turno."),
          interpretation("“filled the most” = the furthest scoring space in turn 9.", "“encheu mais” = o espaço de pontuação mais adiantado no turno 9."),
          rl("Still tied", "all of them are the biggest quack of Quedlinburg.", "Ainda empatados", "todos são o maior charlatão de Quedlinburg.")
        ], ["c8"])}
      </div>`;
  }

  function iconsSection() {
    const items = [
      ["scoring-space", t("Scoring space", "Espaço de pontuação"), t("Big number = value (coins); small square = victory points; red gem = 1 ruby in phase C.", "Número grande = valor (moedas); quadradinho = pontos; gema vermelha = 1 rubi na fase C."), "c5"],
      ["phase-a", t("Banner A · Bonus Die", "Faixa A · Dado de Bônus"), t("Furthest scoring space without explosion rolls the die.", "O espaço de pontuação mais adiantado sem explosão rola o dado."), "c5"],
      ["phase-b", t("Banner B · Chip actions", "Faixa B · Ações das fichas"), t("Hawkmoth, spider and ghost: black, green and purple chips act now.", "Mariposa, aranha e fantasma: fichas preta, verde e roxa agem agora."), "c5"],
      ["phase-c", t("Banner C · Rubies", "Faixa C · Rubis"), t("Ruby on your scoring space: take 1 ruby.", "Rubi no espaço de pontuação: pegue 1 rubi."), "c5"],
      ["phase-d", t("Banner D · Victory points", "Faixa D · Pontos"), t("Score the points of your scoring space.", "Marque os pontos do espaço de pontuação."), "c5"],
      ["phase-e", t("Banner E · Buy chips", "Faixa E · Comprar fichas"), t("Shop with the value of your scoring space.", "Compre com o valor do espaço de pontuação."), "c5"],
      ["phase-f", t("Banner F · End of turn", "Faixa F · Fim do turno"), t("2 rubies: move the droplet or refill the flask.", "2 rubis: avance a gota ou reencha o frasco."), "c5"],
      ["exploded-pot", t("Exploded pot", "Caldeirão explodido"), t("White chips over 7.", "Fichas brancas acima de 7."), "c5"],
      ["no-die", t("No die", "Sem dado"), t("An exploded pot does not roll in phase A.", "Caldeirão explodido não rola na fase A."), "c5"],
      ["exploded-choice", t("D or E", "D ou E"), t("Exploded: points (crossed coins) or coins (crossed points), not both.", "Explodido: pontos (moedas riscadas) ou moedas (pontos riscados), não os dois."), "c6"],
      ["die-1vp", t("Die · 1", "Dado · 1"), t("1 victory point.", "1 ponto."), "c6"],
      ["die-2vp", t("Die · 2", "Dado · 2"), t("2 victory points.", "2 pontos."), "c6"],
      ["die-ruby", t("Die · ruby", "Dado · rubi"), t("1 ruby.", "1 rubi."), "c6"],
      ["die-droplet", t("Die · droplet", "Dado · gota"), t("Move your droplet 1 space forward.", "Avance a gota 1 espaço."), "c6"],
      ["die-pumpkin", t("Die · pumpkin", "Dado · abóbora"), t("1 orange chip into your bag.", "1 ficha laranja para a bolsa."), "c6"],
      ["rat-stone", t("Rat stone", "Pedra de rato"), t("Placed ahead of your droplet by the rat-tails between you and the leader.", "Posta à frente da gota conforme os rabos de rato entre você e o líder."), "c3"],
      ["ruby-droplet", t("2 rubies : droplet", "2 rubis : gota"), t("Phase F: move the droplet 1 space.", "Fase F: avance a gota 1 espaço."), "c7"],
      ["ruby-flask", t("2 rubies : flask", "2 rubis : frasco"), t("Phase F: refill the flask.", "Fase F: reencha o frasco."), "c7"],
      ["book-yellow", t("Yellow book", "Livro amarelo"), t("Turn Indicator: lay it out before turn 2.", "Indicador de Turno: ponha antes do turno 2."), "c7"],
      ["book-purple", t("Purple book", "Livro roxo"), t("Turn Indicator: lay it out before turn 3.", "Indicador de Turno: ponha antes do turno 3."), "c7"],
      ["white-chip", t("White 1-chip", "Ficha branca 1"), t("Turn Indicator: add one to your bag before turn 6.", "Indicador de Turno: ponha uma na bolsa antes do turno 6."), "c7"],
      ["stir", "Stir!", t("Turn 9: draw simultaneously.", "Turno 9: compra simultânea."), "c8"],
      ["buy-vp", t("5 coins / 2 rubies : 1", "5 moedas / 2 rubis : 1"), t("End of turn 9: buy 1 victory point.", "Fim do turno 9: compre 1 ponto."), "c8"],
      ...(tubes() ? [
        ["tube-ruby", t("Test tube · ruby", "Tubo · rubi"), t("Take 1 ruby.", "Pegue 1 rubi."), "c8"],
        ["tube-vp", t("Test tube · 1–4", "Tubo · 1–4"), t("Take that many victory points.", "Pegue esse número de pontos."), "c8"],
        ["tube-chips", t("Test tube · chips", "Tubo · fichas"), t("Put the chips shown into your bag.", "Ponha as fichas mostradas na bolsa."), "c8"]
      ] : []),
      ...(hw() ? [
        ["penny-gold", t("Gold witch penny", "Moeda de bruxa de ouro"), t("Pays for the face-up gold witch.", "Paga a bruxa de ouro revelada."), "h2"],
        ["penny-silver", t("Silver witch penny", "Moeda de bruxa de prata"), t("Pays for the face-up silver witch.", "Paga a bruxa de prata revelada."), "h2"],
        ["penny-copper", t("Copper witch penny", "Moeda de bruxa de cobre"), t("Pays for the face-up copper witch.", "Paga a bruxa de cobre revelada."), "h2"],
        ["overflow-no-book", t("Crossed book", "Livro riscado"), t("Chips in the overflow bowl trigger no book actions.", "Fichas na tigela de transbordo não ativam ações de livro."), "h2"]
      ] : [])
    ];
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), ["c5", "c6", "c7", "c8"])}
      <p class="glossary-intro">${t("Each picture is cut from the supplied manuals and shown with the rulebook's explanation. Book effects use their own pictures in Ingredient books.", "Cada imagem foi recortada dos manuais fornecidos e aparece com a explicação do livro. Os efeitos dos livros usam as próprias imagens em Livros de ingredientes.")}</p>
      <div class="icon-grid">
        ${items.map(([file, name, text, code]) => `
          <article class="icon-card">
            <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}.webp" alt="${name}" loading="lazy"></span>
            <div><strong>${name}</strong><p>${text}</p>${referenceLink(code)}</div>
          </article>`).join("")}
      </div>`;
  }

  function examplesSection() {
    const set1 = state.set === "1" || mix();
    const cards = [
      infoCard(t("EXAMPLE · p. 4", "EXEMPLO · p. 4"), t("Placing chips", "Colocando fichas"), [
        t("Lucas's first chip is an orange 1-chip: space 1 after the droplet.", "A primeira ficha de Lucas é uma laranja 1: espaço 1 depois da gota."),
        t("Next a yellow 2-chip: 2 spaces after the orange chip, on space 3.", "Depois uma amarela 2: 2 espaços depois da laranja, no espaço 3."),
        t("A 1-chip drawn next would go on space 4.", "Uma ficha 1 comprada em seguida iria para o espaço 4.")
      ], ["c4"]),
      infoCard(t("EXAMPLE · pp. 4–5", "EXEMPLO · pp. 4–5"), t("Nina explodes", "Nina explode"), [
        t("Nina's white chips total 6 (2 + 3 + 1); her orange chip does not count.", "As fichas brancas de Nina somam 6 (2 + 3 + 1); a laranja não conta."),
        t("She draws again: a white 2-chip. Total 8 — the pot explodes.", "Ela compra de novo: uma branca 2. Total 8 — o caldeirão explode."),
        t("She still places the white 2-chip and must stop. Her scoring space is the space right after it: space 10.", "Ela ainda põe a branca 2 e tem de parar. O espaço de pontuação é o seguinte: espaço 10.")
      ], ["c4", "c5"]),
      infoCard(t("EXAMPLE · p. 3", "EXEMPLO · p. 3"), t("Rats", "Ratos"), [
        t("Green leads. Blue is second with no rat-tail between them: no rats for blue.", "Verde lidera. Azul é segundo sem rabo de rato entre eles: azul não ganha ratos."),
        t("1 rat-tail between green and yellow: yellow's rat stone goes 1 space past the droplet.", "1 rabo de rato entre verde e amarelo: a pedra de amarelo vai 1 espaço depois da gota."),
        t("2 rat-tails between green and red: red's rat stone goes 2 spaces past the droplet.", "2 rabos de rato entre verde e vermelho: a pedra de vermelho vai 2 espaços depois da gota.")
      ], ["c3"]),
      infoCard(t("EXAMPLE · p. 6", "EXEMPLO · p. 6"), t("Who rolls the die?", "Quem rola o dado?"), [
        t("Mary and Lucas both stopped safely on a space worth 23.", "Mary e Lucas pararam sem explodir num espaço de valor 23."),
        t("Mary's space is further from 0, so only Mary rolls the Bonus Die.", "O espaço de Mary está mais longe do 0, então só Mary rola o Dado de Bônus.")
      ], ["c6"]),
      infoCard(t("EXAMPLE · p. 6", "EXEMPLO · p. 6"), t("Victory points", "Pontos"), [
        t("Lucas's scoring space is 23 with 7 victory points: he moves his scoring marker 7 spaces.", "O espaço de pontuação de Lucas é 23 com 7 pontos: ele avança o marcador 7 casas.")
      ], ["c6"])
    ];
    if (set1) {
      cards.push(
        infoCard(t("EXAMPLE · p. 5 · Set 1", "EXEMPLO · p. 5 · Conjunto 1"), t("Blue crow skull", "Caveira de corvo azul"), [
          t("Lucas draws a blue 2-chip and places it; he may draw 2 more chips and place 1.", "Lucas compra uma azul 2 e a coloca; pode comprar mais 2 fichas e colocar 1."),
          t("He draws a white 3 and a red 1, places the red 1 and puts the white back.", "Ele tira uma branca 3 e uma vermelha 1, põe a vermelha 1 e devolve a branca."),
          t("He could also have placed neither.", "Ele também poderia não colocar nenhuma.")
        ], ["c5"]),
        infoCard(t("EXAMPLE · p. 6 · Set 1", "EXEMPLO · p. 6 · Conjunto 1"), t("Green garden spider", "Aranha verde"), [
          t("With the Set 1 green book, each player gets 1 ruby for each green chip on the last or next-to-last space of their pot.", "Com o livro verde do Conjunto 1, cada jogador ganha 1 rubi para cada ficha verde no último ou penúltimo espaço do caldeirão.")
        ], ["c6"]),
        infoCard(t("EXAMPLE · p. 7 · Set 1", "EXEMPLO · p. 7 · Conjunto 1"), t("Nina and Lucas evaluate", "Nina e Lucas pontuam"), [
          t("Nina exploded with a white 3-chip; her scoring space is 19. Lucas stopped in time on 15.", "Nina explodiu com uma branca 3; o espaço dela é 19. Lucas parou a tempo no 15."),
          t("Lucas rolls the Bonus Die, gets a ruby (space 15 shows one), 3 points and 15 coins.", "Lucas rola o Dado de Bônus, ganha um rubi (o espaço 15 tem um), 3 pontos e 15 moedas."),
          t("Nina chooses 19 coins instead of 5 points: green 2-chip (8) + blue 2-chip (10).", "Nina escolhe 19 moedas em vez de 5 pontos: verde 2 (8) + azul 2 (10)."),
          t("Lucas buys a green 4-chip (14). Both lose their 1 unspent coin.", "Lucas compra uma verde 4 (14). Os dois perdem a 1 moeda que sobrou.")
        ], ["c7"])
      );
    } else {
      cards.push(infoCard(t("EXAMPLE · p. 7", "EXEMPLO · p. 7"), t("Exploded: points or coins", "Explodido: pontos ou moedas"), [
        t("Nina exploded on scoring space 19 (5 points). Lucas stopped in time on 15.", "Nina explodiu no espaço 19 (5 pontos). Lucas parou a tempo no 15."),
        t("Lucas rolls the Bonus Die and takes the ruby, 3 points and 15 coins.", "Lucas rola o Dado de Bônus e pega o rubi, 3 pontos e 15 moedas."),
        t("Nina must choose 5 points or 19 coins; she shops. Unspent coins are lost. (The rulebook's prices are Set 1's; use your books.)", "Nina tem de escolher 5 pontos ou 19 moedas; ela compra. Moedas não gastas se perdem. (Os preços do livro são do Conjunto 1; use os seus livros.)")
      ], ["c7"]));
    }
    if (hw() && (hwSet() || mix())) {
      cards.push(
        infoCard(t("EXAMPLE · Herb Witches p. 3", "EXEMPLO · Herb Witches p. 3"), t("Crow skull and orange chips", "Caveira de corvo e fichas laranja"), [
          t("Blue 4-chip drawn with only 3 orange chips in the pot: no points.", "Azul 4 comprada com só 3 fichas laranja no caldeirão: sem pontos."),
          t("Blue 2-chip drawn with 3 orange chips already in the pot: 2 points.", "Azul 2 comprada com 3 fichas laranja já no caldeirão: 2 pontos.")
        ], ["h3"]),
        infoCard(t("EXAMPLE · Herb Witches p. 4", "EXEMPLO · Herb Witches p. 4"), t("Garden spider start chip", "Ficha inicial da aranha"), [
          t("One of your last 2 chips is a green 4-chip: choose a 4-chip from your pot as next turn's start chip — or a 2- or 1-chip if you prefer.", "Uma das 2 últimas fichas é uma verde 4: escolha uma ficha 4 do caldeirão como ficha inicial do próximo turno — ou uma 2 ou 1 se preferir."),
          t("Next turn it is placed 4 spaces forward and its function is used at the very start.", "No próximo turno ela é posta 4 espaços à frente e a função é usada logo no início.")
        ], ["h4"])
      );
    }
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), ["c3", "c4", "c5", "c6", "c7"])}
      <p class="glossary-intro">${t("The rulebook's illustrated examples, filtered to this match's books.", "Os exemplos ilustrados do livro de regras, filtrados para os livros desta partida.")}</p>
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  function faqSection() {
    const items = [
      [t("Where are the effects of my ingredient books?", "Onde estão os efeitos dos meus livros?"), t("On the books themselves and in the Almanac of Ingredients (both in the box). The supplied rulebook pictures only Set 1 and quotes the crow skull from the Almanac, so for other pages this guide sends you to the book.", "Nos próprios livros e no Almanaque de Ingredientes (ambos na caixa). O livro de regras fornecido mostra só o Conjunto 1 e cita a caveira de corvo do Almanaque, então para as outras páginas o guia manda você ao livro."), "c1"],
      [t("Does anyone start with rubies?", "Alguém começa com rubis?"), t("No. Setup gives no rubies; they come from ruby spaces, the Bonus Die, books and cards.", "Não. A preparação não dá rubis; eles vêm de espaços com rubi, do Dado de Bônus, de livros e de cartas."), "c3"],
      [t("Two players tie for the lead: who gets rats?", "Dois jogadores empatam na liderança: quem ganha ratos?"), t("Neither: both are the leading player, so there are no rat-tails between them and the lead.", "Nenhum: os dois são o líder, então não há rabos de rato entre eles e a liderança."), "c3"],
      [t("Does the droplet move from the Bonus Die change this turn's score?", "A gota movida pelo Dado de Bônus muda a pontuação deste turno?"), t("No: the scoring space is already fixed. The die is rolled in phase A, and the droplet's new position helps from the next turn.", "Não: o espaço de pontuação já está definido. O dado é rolado na fase A, e a nova posição da gota ajuda a partir do próximo turno."), "c6"],
      [t("Can I use the flask on a chip that was not the last drawn?", "Posso usar o frasco numa ficha que não foi a última comprada?"), t("No. Only the last chip drawn, only if white, and never if it exploded the pot.", "Não. Só a última ficha comprada, só se for branca, e nunca se ela explodiu o caldeirão."), "c5"],
      [t("Do I buy chips in turn 9?", "Compro fichas no turno 9?"), t("No: they would never be drawn. In turn 9 your coins buy victory points (5 coins = 1 point) and, separately, any rubies can be traded at 2 for 1 point. An exploded player who chooses E (coins) turns those coins into points; one who chooses D takes the points and has no coins — but can still trade rubies, which needs no phase E.", "Não: elas nunca seriam compradas da bolsa. No turno 9 as moedas compram pontos (5 moedas = 1 ponto) e, à parte, rubis podem ser trocados a 2 por 1 ponto. Quem explodiu e escolhe E (moedas) troca essas moedas por pontos; quem escolhe D fica com os pontos e não tem moedas — mas ainda pode trocar rubis, o que não depende da fase E."), "c8"],
      [t("Can I keep drawing after a chip lands on space 33?", "Posso continuar comprando depois que uma ficha cai no espaço 33?"), hw() ? t("Yes, with The Herb Witches: further chips go into your overflow bowl (and whites there can still explode the pot). An exploded player who chooses D still gets the spoon's 15 points plus half the bowl's value.", "Sim, com The Herb Witches: as fichas seguintes vão para a tigela de transbordo (e brancas ali ainda podem explodir o caldeirão). Quem explodiu e escolhe D ainda ganha os 15 pontos da colher mais metade do valor da tigela.") : t("The base rulebook does not say. There is no space after 33, so the guide stops you there; your scoring reward is the spoon.", "O livro base não diz. Não há espaço depois do 33, então o guia para você ali; a recompensa é a colher."), hw() ? "h2" : "c6"],
      [t("Do all players score D before anyone buys in E?", "Todos pontuam D antes de alguém comprar em E?"), t("Yes: the phases run in order A to F, and each of B, D and E starts with the start player and goes clockwise before the next phase begins.", "Sim: as fases correm em ordem de A a F, e cada uma de B, D e E começa pelo primeiro jogador e segue em sentido horário antes da fase seguinte."), "c6"],
      [t("What is the seal tile for?", "Para que serve o selo?"), t("It starts under your marker with “0” up; its other side reads 50, so flip it when you pass the end of the Scoring Track (the rulebook does not explain it).", "Ele começa sob o marcador com “0” para cima; o outro lado diz 50, então vire-o ao passar do fim da Trilha de Pontos (o livro não explica)."), "c2"],
      ...(state.players === 5 ? [[t("Which black page with 5 players?", "Qual página preta com 5 jogadores?"), hwSet() ? t("With Sets 5–6 the guide uses that set's Herb Witches black page, which works at any count.", "Com os Conjuntos 5–6 o guia usa a página preta das Herb Witches desse conjunto, que funciona com qualquer número.") : t("The base book has only 2- and 3–4-player pages; the guide uses the 3–4-player page (neighbours).", "O livro base só tem páginas de 2 e de 3–4 jogadores; o guia usa a de 3–4 (vizinhos)."), "c2"]] : []),
      ...(hw() && (hwSet() || mix()) ? [[t("When does the locoweed book come out?", "Quando entra o livro da erva-louca?"), t("The booklet does not say. The Turn Indicator only delays yellow and purple, so the guide lays it out at setup with green, blue and red.", "O livreto não diz. O Indicador de Turno só adia amarelo e roxo, então o guia o põe na preparação com verde, azul e vermelho."), "h1"]] : []),
      ...(hw() ? [[t("Where does a used witch penny go?", "Para onde vai uma moeda de bruxa usada?"), t("The booklet says you hand it over; the guide puts it in the box. Each penny, and so each witch, is used at most once per player.", "O livreto diz que você a entrega; o guia a põe na caixa. Cada moeda, e portanto cada bruxa, é usada no máximo uma vez por jogador."), "h1"]] : [])
    ];
    return `
      ${sectionHeading("faq", t("Guide's readings", "Leituras do guia"), ["c2", "c3", "c6", "c8"])}
      <p class="glossary-intro">${t("Where the manuals are silent, this guide states its own reading, labelled as such.", "Onde os manuais são omissos, este guia dá a sua própria leitura, identificada como tal.")}</p>
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
      { term: ["Pot", "Caldeirão (pot)"], text: ["Your player board: a spiral of numbered spaces from 0 to 33.", "O seu tabuleiro: uma espiral de espaços numerados de 0 a 33."], code: "c3" },
      { term: ["Bag", "Bolsa"], text: ["Your ingredient chips; you draw blind and never look in.", "As suas fichas de ingrediente; você compra às cegas e nunca olha dentro."], code: "c4" },
      { term: ["Chip value", "Valor da ficha"], text: ["The number on a chip (1, 2, 3, 4; 6 for Herb Witches pumpkins): how many spaces it advances.", "O número na ficha (1, 2, 3, 4; 6 nas abóboras das Herb Witches): quantos espaços ela avança."], code: "c4" },
      { term: ["Cherry bombs", "Bombas-cereja"], text: ["The white chips: more than 7 in total explodes the pot.", "As fichas brancas: mais de 7 no total explode o caldeirão."], code: "c4" },
      { term: ["Droplet", "Gota"], text: ["Marks where your potion starts; moved forward permanently.", "Marca onde a poção começa; avança de forma permanente."], code: "c3" },
      { term: ["Rat stone / rat-tails", "Pedra de rato / rabos de rato"], text: ["Catch-up: the rat-tails printed on the Scoring Track between you and the leader move your rat stone ahead of the droplet.", "Ajuda: os rabos de rato impressos na Trilha de Pontos entre você e o líder põem a pedra de rato à frente da gota."], code: "c3" },
      { term: ["Flask", "Frasco"], text: ["Once per filling, puts the last drawn white chip back in the bag.", "Uma vez por enchimento, devolve à bolsa a última ficha branca comprada."], code: "c5" },
      { term: ["Scoring space", "Espaço de pontuação"], text: ["The space right after your last chip; its value is your coins, its square your points.", "O espaço logo depois da última ficha; o valor são as suas moedas, o quadradinho os seus pontos."], code: "c5" },
      { term: ["Explosion", "Explosão"], text: ["Too many cherry bombs: you stop, skip the die and choose points or coins.", "Bombas-cereja demais: você para, perde o dado e escolhe pontos ou moedas."], code: "c4" },
      { term: ["Ingredient book", "Livro de ingrediente"], text: ["One per colour: costs and effect. Sets are marked by bookmarks.", "Um por cor: custos e efeito. Os conjuntos são marcados por marcadores."], code: "c2" },
      { term: ["Set", "Conjunto"], text: ["A matching group of green, blue, red, yellow and purple books (1–4 base, 5–6 Herb Witches).", "Um grupo de livros verde, azul, vermelho, amarelo e roxo que combinam (1–4 base, 5–6 Herb Witches)."], code: "c2" },
      { term: ["Fortune Teller card", "Carta da Vidente"], text: ["Read at the start of each turn; purple = now, blue = this turn or its end.", "Lida no início de cada turno; roxa = agora, azul = neste turno ou no fim."], code: "c3" },
      { term: ["Bonus Die", "Dado de Bônus"], text: ["Rolled by the best non-exploded potion; points, ruby, droplet or pumpkin.", "Rolado pela melhor poção sem explosão; pontos, rubi, gota ou abóbora."], code: "c6" },
      { term: ["Start player", "Primeiro jogador"], text: ["Holder of the Fortune Teller deck; begins phases B, D and E.", "Quem tem o baralho da Vidente; começa as fases B, D e E."], code: "c3" },
      { term: ["Spoon", "Colher"], text: ["Space 33's reward: 15 points and 35 coins.", "A recompensa do espaço 33: 15 pontos e 35 moedas."], code: "c6" },
      { term: ["Seal tile", "Selo"], text: ["0/50 tile where your scoring marker starts.", "Peça 0/50 onde o marcador de pontos começa."], code: "c2" },
      ...(hw() ? [
        { term: ["Witch penny", "Moeda de bruxa"], text: ["Gold, silver or copper; spent to use the face-up witch of that colour. 2 points if unused.", "Ouro, prata ou cobre; gasta para usar a bruxa revelada dessa cor. 2 pontos se não usada."], code: "h1" },
        { term: ["Overflow bowl", "Tigela de transbordo"], text: ["Holds chips drawn after space 33; half their value scores.", "Guarda fichas compradas depois do espaço 33; metade do valor pontua."], code: "h2" },
        { term: ["Locoweed", "Erva-louca (locoweed)"], text: ["Turquoise Herb Witches ingredient with no set value.", "Ingrediente turquesa das Herb Witches sem valor fixo."], code: "h3" }
      ] : []),
      ...(tubes() ? [{ term: ["Test tubes", "Tubos de ensaio"], text: ["Back-side track for the second droplet; each glass gives a bonus.", "Trilha do verso para a segunda gota; cada vidro dá um bônus."], code: "c8" }] : [])
    ];
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), ["c2", "c3", "c4", "c5", "c6"])}
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
    document.body.classList.add("theme-quacks");
    document.documentElement.lang = state.language;
    document.title = t("The Quacks of Quedlinburg — Field Manual", "The Quacks of Quedlinburg — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for The Quacks of Quedlinburg and The Herb Witches: setup by players and ingredient set, Potions Phase, explosions, Evaluation A–F, ingredient books, witches and the test-tube variation.",
        "Regras interativas bilíngues de The Quacks of Quedlinburg e The Herb Witches: preparação por jogadores e conjunto de ingredientes, Fase das Poções, explosões, Avaliação A–F, livros de ingredientes, bruxas e a variação dos tubos."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook", "Livro interativo")}</p>
          <h1>The Quacks of Quedlinburg</h1>
          <p class="hero-intro">${t(
            "Nine days of bazaar, one bag of ingredients each. Draw chip after chip into your pot to brew the best potion — but one cherry bomb too many and the whole pot blows up. Spend what you earn on stronger ingredients and push your luck again.",
            "Nove dias de feira, uma bolsa de ingredientes para cada um. Puxe ficha após ficha para o caldeirão e prepare a melhor poção — mas uma bomba-cereja a mais e o caldeirão inteiro explode. Gaste o que ganhar em ingredientes mais fortes e arrisque de novo."
          )}</p>
          <div class="hero-meta"><span>${hw() ? t("2–5 players", "2–5 jogadores") : t("2–4 players", "2–4 jogadores")}</span><span>${t("45 min", "45 min")}</span><span>${t("Bag building", "Construção de bolsa")}</span><span>${t("Push your luck", "Arriscar a sorte")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/the-quacks-of-quedlinburg.webp" alt="${t("Cover and contents page of The Quacks of Quedlinburg rulebook", "Capa e página de conteúdo do livro de regras de The Quacks of Quedlinburg")}" fetchpriority="high"><figcaption>${t("Rulebook cover", "Capa do livro de regras")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("The bazaar", "A feira")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column qk-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            `This guide covers the supplied English rulebook of The Quacks of Quedlinburg (8 pages)${hw() ? " and The Herb Witches booklet (4 pages)" : ""}. Ingredient-book effects are printed on the books and in the Almanac of Ingredients, which is in the box but not supplied: the guide prints only the effects the supplied PDFs show and otherwise tells you to read your book. Fortune Teller texts are on the cards. Points marked “Guide's reading” are interpretations where the manuals are silent.`,
            `Este guia cobre o livro de regras em inglês fornecido de The Quacks of Quedlinburg (8 páginas)${hw() ? " e o livreto The Herb Witches (4 páginas)" : ""}. Os efeitos dos livros de ingredientes estão impressos nos livros e no Almanaque de Ingredientes, que vem na caixa mas não foi fornecido: o guia mostra só os efeitos que os PDFs fornecidos trazem e, nos demais casos, manda você ler o seu livro. Os textos da Vidente estão nas cartas. Trechos marcados como “Leitura do guia” são interpretações onde os manuais são omissos.`
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${roundSection()}</section>
          <section class="rule-section">${fortuneSection()}</section>
          <section class="rule-section">${potionSection()}</section>
          <section class="rule-section">${evaluationSection()}</section>
          <section class="rule-section">${ingredientsSection()}</section>
          ${hw() ? `<section class="rule-section">${witchesSection()}</section>` : ""}
          ${tubes() ? `<section class="rule-section">${tubesSection()}</section>` : ""}
          <section class="rule-section">${endSection()}</section>
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${faqSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal, non-commercial companion guide based on the rulebooks of The Quacks of Quedlinburg and The Herb Witches by Wolfgang Warsch (Schmidt Spiele). Rules are paraphrased; pictures are cut from the supplied manuals for reference.",
        "Guia pessoal e não comercial de consulta baseado nos livros de regras de The Quacks of Quedlinburg e The Herb Witches, de Wolfgang Warsch (Schmidt Spiele). As regras são parafraseadas; as imagens foram recortadas dos manuais fornecidos para referência."
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
      root.querySelector(".qk-page")?.prepend(notice);
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
    ["hw", "hw", (value) => value, YESNO],
    ["players", "players", (value) => Number(value), PLAYERS],
    ["set", "set", (value) => value, SETS],
    ["pot", "pot", (value) => value, POTS],
    ["stir", "stir", (value) => value, YESNO]
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

  window.QuacksOfQuedlinburg = { renderInto, onClick, onChange };
})();
