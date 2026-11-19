(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.exploding-kittens.v1";
  const SETUP_KEY = "field-manual.exploding-kittens.setup.v1";
  const MANUALS = {
    c: "exploding-kittens_core.pdf",
    s: "exploding-kittens_streaking-kittens.pdf"
  };
  const ASSETS = "assets/exploding-kittens/";
  const ICONS = `${ASSETS}icons/`;
  const ART = `${ASSETS}art/`;
  // Sources:
  //  "c" = Exploding Kittens Party Pack rules sheet (2 pp.: p. 1 rules, p. 2 "Field Guide"), 2–10 players, 122 cards.
  //  "s" = Streaking Kittens expansion rules sheet (2 pp.: p. 1 setup, p. 2 "Field Guide"), 15 cards.
  // The Imploding Kittens expansion is mentioned by the Streaking sheet but NOT supplied.
  const PLAYER_COUNTS = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  const defaults = {
    language: "pt-BR",
    players: 4,
    streaking: false,
    faster: false
  };
  // Counts printed in the Field Guide (p. 2): [with paw, without paw].
  const CORE_COUNTS = {
    defuse: [3, 7],
    attack: [4, 7],
    skip: [4, 6],
    "see-the-future": [3, 3],
    "alter-the-future": [2, 4],
    shuffle: [2, 4],
    "draw-from-the-bottom": [3, 4],
    favor: [2, 4],
    nope: [4, 6],
    "feral-cat": [2, 4],
    cat: [3, 4]
  };

  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------

  function normalizePreferences(saved) {
    const players = Number(saved?.players);
    return {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      players: PLAYER_COUNTS.includes(players) ? players : defaults.players,
      streaking: saved?.streaking === true,
      faster: saved?.faster === true
    };
  }

  // Every match option changes the physical setup, so all of them form the checklist signature.
  function signature(source = state) {
    return `p${source.players}-s${source.streaking ? 1 : 0}-f${source.faster ? 1 : 0}`;
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Exploding Kittens preferences.", error);
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
      console.error("Could not read Exploding Kittens setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Exploding Kittens preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Exploding Kittens setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function manualUrl(code) {
    const script = document.querySelector('script[src*="exploding-kittens.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${MANUALS[code[0]]}`, baseUrl).href}#page=${Number(code.slice(1))}`;
  }

  // Page codes: c<n> = Party Pack rules sheet page n; s<n> = Streaking Kittens sheet page n.
  function referenceLink(code) {
    const page = code.slice(1);
    const label = code[0] === "s"
      ? t(`Streaking p. ${page} ↗`, `Streaking p. ${page} ↗`)
      : t(`Rules p. ${page} ↗`, `Regras p. ${page} ↗`);
    return `<a class="source-link" href="${manualUrl(code)}" target="_blank" rel="noreferrer">${label}</a>`;
  }

  function refs(codes) {
    return codes.map(referenceLink).join("");
  }

  function sectionHeading(id, title, codes) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("FIELD GUIDE", "GUIA DE CAMPO")} / ${sectionIndex(id)}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="ek-section-references">${refs(codes)}</div>
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
    return `<span class="ek-interpretation">${t("Guide's reading", "Leitura do guia")}:</span> ${t(en, pt)}`;
  }

  function glyph(file, alt) {
    return `<img class="ek-glyph" src="${ICONS}${file}.webp" alt="${alt}">`;
  }

  function figure(file, altEn, altPt, captionEn, captionPt, extraClass = "") {
    return `<figure class="ek-art ${extraClass}"><img src="${ART}${file}.webp" alt="${t(altEn, altPt)}" loading="lazy"><figcaption>${t(captionEn, captionPt)}</figcaption></figure>`;
  }

  function playersLabel(players = state.players) {
    return t(`${players} players`, `${players} jogadores`);
  }

  // ---------- deck maths (Party Pack, rules p. 1–2) ----------

  // 2–3 players: cards WITH a paw print; 4–7: cards WITHOUT; 8–10: all cards.
  function deckClass(n = state.players) {
    if (n <= 3) {
      return "paw";
    }
    return n <= 7 ? "nopaw" : "all";
  }

  function count(id, cls = deckClass()) {
    const [paw, nopaw] = CORE_COUNTS[id];
    return cls === "paw" ? paw : cls === "nopaw" ? nopaw : paw + nopaw;
  }

  function defuseTotal() {
    return count("defuse");
  }

  // Core cards in the chosen deck other than Defuses and Exploding Kittens.
  function otherCoreCards() {
    return Object.keys(CORE_COUNTS)
      .filter((id) => id !== "defuse")
      .reduce((sum, id) => sum + count(id) * (id === "cat" ? 5 : 1), 0);
  }

  function extraDefuses() {
    return defuseTotal() - state.players;
  }

  // Streaking sheet: with 2–3 players only 2 extra Defuses go back (the Party Pack paw deck never has more than 1).
  function extraDefusesBack() {
    return state.streaking && state.players <= 3 ? Math.min(2, extraDefuses()) : extraDefuses();
  }

  function kittensInserted() {
    return state.streaking ? state.players : state.players - 1;
  }

  function kittensAvailable() {
    return state.streaking ? 10 : 9;
  }

  function cardsBeforeKittens() {
    // Base order (rules p. 1): extra Defuses go back BEFORE dealing 7 cards each.
    // Streaking order (sheet p. 1): the 14 expansion cards are mixed in, 7 dealt, Kittens and then extra Defuses inserted.
    return state.streaking
      ? otherCoreCards() + 14 - 7 * state.players
      : otherCoreCards() + extraDefuses() - 7 * state.players;
  }

  function removedThird() {
    return Math.round(cardsBeforeKittens() / 3);
  }

  function drawPileSize() {
    const remaining = cardsBeforeKittens() - (state.faster ? removedThird() : 0);
    return remaining + kittensInserted() + (state.streaking ? extraDefusesBack() : 0);
  }

  function deckDescription(n = state.players) {
    const cls = deckClass(n);
    if (cls === "paw") {
      return t("cards WITH a paw print in the corner", "cartas COM pegada de gato no canto");
    }
    return cls === "nopaw"
      ? t("cards WITHOUT a paw print", "cartas SEM pegada de gato")
      : t("all the cards (with and without paw prints)", "todas as cartas (com e sem pegada)");
  }

  function names(id) {
    return {
      "exploding-kitten": ["Exploding Kitten", "Gatinho Explosivo (Exploding Kitten)"],
      defuse: ["Defuse", "Desarmar (Defuse)"],
      attack: ["Attack", "Ataque (Attack)"],
      skip: ["Skip", "Pular (Skip)"],
      "see-the-future": ["See the Future", "Ver o Futuro (See the Future)"],
      "alter-the-future": ["Alter the Future", "Alterar o Futuro (Alter the Future)"],
      shuffle: ["Shuffle", "Embaralhar (Shuffle)"],
      "draw-from-the-bottom": ["Draw from the Bottom", "Comprar do Fundo (Draw from the Bottom)"],
      favor: ["Favor", "Favor"],
      nope: ["Nope", "Nope"],
      "feral-cat": ["Feral Cat", "Gato Selvagem (Feral Cat)"],
      cat: ["Cat Cards", "Cartas de Gato (Cat Cards)"],
      "streaking-kitten": ["Streaking Kitten", "Gatinho Pelado (Streaking Kitten)"],
      "catomic-bomb": ["Catomic Bomb", "Bomba Gatômica (Catomic Bomb)"],
      mark: ["Mark", "Marcar (Mark)"],
      "curse-of-the-cat-butt": ["Curse of the Cat Butt", "Maldição do Bumbum de Gato (Curse of the Cat Butt)"],
      "super-skip": ["Super Skip", "Super Pular (Super Skip)"],
      "see-the-future-5": ["See the Future (5x)", "Ver o Futuro 5x (See the Future 5x)"],
      "alter-the-future-5": ["Alter the Future (5x)", "Alterar o Futuro 5x (Alter the Future 5x)"],
      "swap-top-and-bottom": ["Swap Top and Bottom", "Trocar Topo e Fundo (Swap Top and Bottom)"],
      "garbage-collection": ["Garbage Collection", "Coleta de Lixo (Garbage Collection)"]
    }[id];
  }

  function cn(id) {
    const [en, pt] = names(id);
    return t(en, pt);
  }

  // ---------- sections ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["how-it-works", t("How it works & winning", "Como funciona e vitória")],
      ["turn", t("Your turn", "Seu turno")],
      ["cards", t("Cards & icons", "Cartas e ícones")],
      ["combos", t("Special combos", "Combos especiais")],
      state.streaking ? ["streaking", t("Streaking Kittens rules", "Regras de Streaking Kittens")] : null,
      ["examples", t("Examples", "Exemplos")],
      ["tips", t("Tips", "Dicas")],
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
          <span class="brand-mark" aria-hidden="true">EK</span>
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
      <label class="ek-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" data-${dataAttr}="${value}" ${checked ? "checked" : ""}>
        <span class="ek-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function playerChoiceText(n) {
    const cls = deckClass(n);
    const kittens = state.streaking ? n : n - 1;
    const defuses = count("defuse", cls);
    return t(
      `Deck: ${deckDescription(n)}. ${defuses} Defuses (1 each, ${defuses - n} extra). ${kittens} Exploding Kitten${kittens > 1 ? "s" : ""} shuffled in.`,
      `Baralho: ${deckDescription(n)}. ${defuses} Desarmar (1 cada, ${defuses - n} sobrando). ${kittens} Gatinho${kittens > 1 ? "s" : ""} Explosivo${kittens > 1 ? "s" : ""} no baralho.`
    );
  }

  function matchConfiguration() {
    const yesNo = (group, attr, current, noTitle, noText, yesTitle, yesText) => `
      <div class="ek-choice-grid">
        ${choiceCard(group, attr, "no", !current, noTitle, noText)}
        ${choiceCard(group, attr, "yes", current, yesTitle, yesText)}
      </div>`;
    return `
      <section class="controls-panel ek-config" id="build-match" aria-labelledby="ek-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="ek-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "Three choices change the deck: the number of players (which cards you use), the Streaking Kittens expansion and the faster-game variant. Changing any of them clears the setup checklist; switching the language clears nothing.",
              "Três escolhas mudam o baralho: o número de jogadores (quais cartas usar), a expansão Streaking Kittens e a variante de jogo mais rápido. Mudar qualquer uma limpa a lista da preparação; trocar o idioma não limpa nada."
            )}</p>
          </div>
        </div>
        <fieldset class="ek-choice-group">
          <legend>${t("Players · selected:", "Jogadores · selecionado:")} <span>${playersLabel()}</span></legend>
          <p class="ek-choice-intro">${t("This Party Pack box plays 2–10. The player count decides which cards you use (paw print or not) and how many Exploding Kittens go into the deck.", "Esta caixa Party Pack joga de 2 a 10. O número de jogadores decide quais cartas usar (com pegada ou não) e quantos Gatinhos Explosivos entram no baralho.")} ${refs(["c1"])}</p>
          <div class="ek-choice-grid ek-choice-grid-players">
            ${PLAYER_COUNTS.map((n) => choiceCard("ek-players", "players", n, state.players === n, playersLabel(n), playerChoiceText(n))).join("")}
          </div>
        </fieldset>
        <fieldset class="ek-choice-group">
          <legend>${t("Streaking Kittens expansion · selected:", "Expansão Streaking Kittens · selecionado:")} <span>${state.streaking ? t("Yes", "Sim") : t("No", "Não")}</span></legend>
          <p class="ek-choice-intro">${t("A separate 15-card deck (the second expansion). Its cards are shuffled into the deck from the start; its rules sheet changes the setup order and adds 1 Exploding Kitten.", "Um baralho separado de 15 cartas (a segunda expansão). As cartas dela entram no baralho desde o início; a folha de regras muda a ordem da preparação e acrescenta 1 Gatinho Explosivo.")} ${refs(["s1", "s2"])}</p>
          ${yesNo("ek-streaking", "streaking", state.streaking,
            t("No — base game only", "Não — só o jogo base"),
            t(`Party Pack cards only. ${state.players - 1} Exploding Kitten${state.players > 2 ? "s" : ""} (players − 1): the last player standing wins.`, `Só as cartas do Party Pack. ${state.players - 1} Gatinho${state.players > 2 ? "s" : ""} Explosivo${state.players > 2 ? "s" : ""} (jogadores − 1): vence o último que sobrar.`),
            t("Yes — add Streaking Kittens", "Sim — acrescentar Streaking Kittens"),
            t(`Adds 14 action cards (Streaking Kitten, Catomic Bomb, Mark ×3, Curse of the Cat Butt ×2, Super Skip, See/Alter the Future 5x, Swap Top and Bottom ×3, Garbage Collection) plus 1 extra Exploding Kitten: ${state.players} Kittens (= players), because the Streaking Kitten lets someone hold a Kitten safely. Introduces “blind” players and marked cards.`, `Acrescenta 14 cartas de ação (Gatinho Pelado, Bomba Gatômica, Marcar ×3, Maldição do Bumbum de Gato ×2, Super Pular, Ver/Alterar o Futuro 5x, Trocar Topo e Fundo ×3, Coleta de Lixo) e 1 Gatinho Explosivo extra: ${state.players} Gatinhos (= jogadores), porque o Gatinho Pelado deixa alguém segurar um Gatinho com segurança. Introduz jogadores “cegos” e cartas marcadas.`)
          )}
        </fieldset>
        <fieldset class="ek-choice-group">
          <legend>${t("Faster game variant · selected:", "Variante de jogo mais rápido · selecionado:")} <span>${state.faster ? t("Yes", "Sim") : t("No", "Não")}</span></legend>
          <p class="ek-choice-intro">${t("Printed on the Streaking Kittens sheet; it only removes cards, so it also works without the expansion cards.", "Impressa na folha de Streaking Kittens; ela só remove cartas, então também funciona sem as cartas da expansão.")} ${refs(["s1"])}</p>
          ${yesNo("ek-faster", "faster", state.faster,
            t("No — full deck", "Não — baralho completo"),
            t("Play with every card of your deck selection.", "Jogue com todas as cartas da seleção do baralho."),
            t("Yes — remove about a third", "Sim — remover cerca de um terço"),
            t(`Just before the Exploding Kittens go in, remove about one third of the remaining deck at random, unseen (about ${removedThird()} cards here). Nobody knows which cards are gone; the Kittens all stay, so explosions come sooner.`, `Logo antes de os Gatinhos Explosivos entrarem, remova ao acaso, sem olhar, cerca de um terço do baralho restante (cerca de ${removedThird()} cartas aqui). Ninguém sabe quais cartas saíram; todos os Gatinhos ficam, então as explosões chegam mais cedo.`)
          )}
        </fieldset>
        <p class="ek-config-summary"><strong>${t("This match:", "Esta partida:")}</strong> ${playersLabel()} · ${deckDescription()} · ${t(`${kittensInserted()} Exploding Kittens`, `${kittensInserted()} Gatinhos Explosivos`)} · ${state.streaking ? "Streaking Kittens" : t("base game", "jogo base")}${state.faster ? ` · ${t("faster game", "jogo mais rápido")}` : ""} · ${t(`Draw Pile at the start: about ${drawPileSize()} cards`, `Pilha de Compra no início: cerca de ${drawPileSize()} cartas`)}</p>
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function selectStep() {
    const n = state.players;
    const cls = deckClass();
    const lines = [
      cls === "paw"
        ? t(`${n} players: keep only the cards WITH a paw print in the corner (top right of the card). Put every card without a paw print back in the box.`, `${n} jogadores: fique só com as cartas COM pegada de gato no canto (alto, à direita da carta). Devolva à caixa todas as cartas sem pegada.`)
        : cls === "nopaw"
          ? t(`${n} players: keep only the cards WITHOUT a paw print. Put every card with a paw print back in the box.`, `${n} jogadores: fique só com as cartas SEM pegada de gato. Devolva à caixa todas as cartas com pegada.`)
          : t(`${n} players: use all the cards, with and without paw prints.`, `${n} jogadores: use todas as cartas, com e sem pegada.`),
      t(`You now hold ${defuseTotal()} Defuses and ${otherCoreCards()} other cards (see “Components for this match” below for each card).`, `Você fica com ${defuseTotal()} Desarmar e ${otherCoreCards()} outras cartas (veja cada carta em “Componentes desta partida” abaixo).`),
      cls === "paw" ? t("The Exploding Kittens have no paw print, but you already set them aside: they still go in later.", "Os Gatinhos Explosivos não têm pegada, mas você já os separou: eles entram depois mesmo assim.") : ""
    ];
    return {
      id: "select",
      title: t("Pick the cards for this player count", "Escolha as cartas para este número de jogadores"),
      codes: ["c1"],
      items: lines
    };
  }

  function setupPhases() {
    const n = state.players;
    const extra = extraDefuses();
    const kittensOut = kittensAvailable() - kittensInserted();
    const fasterStep = state.faster ? {
      id: "faster",
      title: t("Faster game: remove about a third", "Jogo mais rápido: remova cerca de um terço"),
      codes: ["s1"],
      items: [
        t(`Take the deck that is left after dealing (about ${cardsBeforeKittens()} cards) and, without looking, remove about one third of it at random (about ${removedThird()} cards).`, `Pegue o baralho que sobrou depois de dar as cartas (cerca de ${cardsBeforeKittens()} cartas) e, sem olhar, remova ao acaso cerca de um terço dele (cerca de ${removedThird()} cartas).`),
        t("Put the removed cards in the box face down. Nobody may look at them.", "Ponha as cartas removidas na caixa viradas para baixo. Ninguém pode olhá-las."),
        state.streaking || extraDefuses() <= 0 ? "" : interpretation("in the base order the extra Defuses are already in this deck, so the removed third may include Defuses.", "na ordem do jogo base os Desarmar sobrando já estão neste baralho, então o terço removido pode incluir Desarmar.")
      ]
    } : null;

    if (!state.streaking) {
      return [
        {
          id: "kittens-out",
          title: t("Set the Exploding Kittens aside", "Separe os Gatinhos Explosivos"),
          codes: ["c1"],
          items: [
            t("Take all 9 Exploding Kittens (black cards with the bomb-kitten picture) out of the box's deck and put them aside face down.", "Tire do baralho da caixa os 9 Gatinhos Explosivos (cartas pretas com o gatinho-bomba) e deixe-os de lado virados para baixo.")
          ]
        },
        selectStep(),
        {
          id: "defuse",
          title: t("Deal 1 Defuse to each player", "Dê 1 Desarmar a cada jogador"),
          codes: ["c1"],
          items: [
            t(`Take the ${defuseTotal()} Defuses out of the deck. Deal 1 face down to each of the ${n} players.`, `Tire do baralho os ${defuseTotal()} Desarmar. Dê 1, virado para baixo, a cada um dos ${n} jogadores.`),
            extra > 0
              ? t(`Put the ${extra} extra Defuse${extra > 1 ? "s" : ""} back into the deck.`, `Devolva ao baralho ${extra > 1 ? `os ${extra} Desarmar sobrando` : "o Desarmar sobrando"}.`)
              : t("No Defuse is left over at this player count.", "Com este número de jogadores não sobra nenhum Desarmar."),
            t("The Defuse is the only card that saves you from an Exploding Kitten: keep your hand secret.", "O Desarmar é a única carta que salva você de um Gatinho Explosivo: mantenha a mão em segredo.")
          ]
        },
        {
          id: "deal",
          title: t("Shuffle and deal 7 cards each", "Embaralhe e dê 7 cartas a cada um"),
          codes: ["c1"],
          items: [
            t("Shuffle the deck (it has no Exploding Kittens yet).", "Embaralhe o baralho (ainda sem Gatinhos Explosivos)."),
            t(`Deal 7 cards face down to each player (${7 * n} cards). Everyone now holds 8 cards, including their Defuse.`, `Dê 7 cartas viradas para baixo a cada jogador (${7 * n} cartas). Todos ficam com 8 cartas, contando o Desarmar.`)
          ]
        },
        fasterStep,
        {
          id: "kittens-in",
          title: t(`Insert ${kittensInserted()} Exploding Kitten${kittensInserted() > 1 ? "s" : ""}`, `Ponha ${kittensInserted()} Gatinho${kittensInserted() > 1 ? "s" : ""} Explosivo${kittensInserted() > 1 ? "s" : ""}`),
          codes: ["c1"],
          items: [
            t(`Put ${kittensInserted()} Exploding Kitten${kittensInserted() > 1 ? "s" : ""} into the deck: 1 fewer than the ${n} players, so everyone but 1 person eventually explodes.`, `Ponha ${kittensInserted()} Gatinho${kittensInserted() > 1 ? "s" : ""} Explosivo${kittensInserted() > 1 ? "s" : ""} no baralho: 1 a menos que os ${n} jogadores, para que todos explodam menos 1 pessoa.`),
            kittensOut > 0 ? t(`Return the other ${kittensOut} to the box: they are out of this game.`, `Devolva os outros ${kittensOut} à caixa: eles ficam fora desta partida.`) : ""
          ]
        },
        {
          id: "pile",
          title: t("Make the Draw Pile", "Monte a Pilha de Compra"),
          codes: ["c1"],
          items: [
            t(`Shuffle the deck and put it face down in the middle of the table: this is the Draw Pile (about ${drawPileSize()} cards).`, `Embaralhe o baralho e ponha-o virado para baixo no meio da mesa: esta é a Pilha de Compra (cerca de ${drawPileSize()} cartas).`),
            t("Leave space next to it for a face-up Discard Pile.", "Deixe espaço ao lado para uma Pilha de Descarte virada para cima.")
          ]
        },
        {
          id: "first",
          title: t("Pick the first player", "Escolha o primeiro jogador"),
          codes: ["c1"],
          items: [
            t("Pick any player to go first (the rules suggest silly criteria, such as the most impressive beard). Play then goes clockwise.", "Escolha quem começa como quiserem (as regras sugerem critérios bobos, como a barba mais impressionante). Depois o jogo segue em sentido horário.")
          ]
        }
      ].filter(Boolean);
    }

    // Streaking Kittens order (sheet p. 1, steps 1–10), applied to the Party Pack deck selection.
    const back = extraDefusesBack();
    return [
      {
        id: "kittens-out",
        title: t("Set aside the Exploding Kittens and Defuses", "Separe os Gatinhos Explosivos e os Desarmar"),
        codes: ["s1", "c1"],
        items: [
          t("Take all 9 Exploding Kittens out of the Party Pack deck and put them aside face down.", "Tire do baralho do Party Pack os 9 Gatinhos Explosivos e deixe-os de lado virados para baixo."),
          t("Also take the Exploding Kitten (1) out of the Streaking Kittens deck and add it to them: 10 Kittens aside.", "Tire também o Gatinho Explosivo (1) do baralho de Streaking Kittens e junte aos outros: 10 Gatinhos separados."),
          interpretation("the Streaking sheet says “Exploding Kittens (4) and Defuse Cards (6)”: those are the counts of the original 56-card Exploding Kittens deck. With this Party Pack you set aside all its Kittens and, in the next step, the Defuses of your card selection.", "a folha de Streaking diz “Exploding Kittens (4) e Defuse Cards (6)”: essas são as quantidades do baralho original de 56 cartas. Com este Party Pack você separa todos os Gatinhos e, no passo seguinte, os Desarmar da sua seleção de cartas.")
        ]
      },
      selectStep(),
      {
        id: "defuse-aside",
        title: t("Set the Defuses aside", "Separe os Desarmar"),
        codes: ["s1"],
        items: [
          t(`Take the ${defuseTotal()} Defuses out of your selected cards and keep them aside for now.`, `Tire os ${defuseTotal()} Desarmar das cartas selecionadas e deixe-os de lado por enquanto.`)
        ]
      },
      {
        id: "combine",
        title: t("Mix in the Streaking Kittens cards and deal 7", "Misture as cartas de Streaking Kittens e dê 7"),
        codes: ["s1"],
        items: [
          t(`Combine the 14 remaining Streaking Kittens cards with your ${otherCoreCards()} Party Pack cards and shuffle.`, `Junte as 14 cartas restantes de Streaking Kittens às suas ${otherCoreCards()} cartas do Party Pack e embaralhe.`),
          state.players <= 3 ? interpretation("the expansion cards have no paw-print rule: all 14 go in at every player count.", "as cartas da expansão não têm regra de pegada: as 14 entram com qualquer número de jogadores.") : "",
          t(`Deal 7 cards face down to each of the ${n} players.`, `Dê 7 cartas viradas para baixo a cada um dos ${n} jogadores.`),
          t("Then deal 1 Defuse to each player: everyone holds 8 cards. Keep your hand secret.", "Depois dê 1 Desarmar a cada jogador: todos ficam com 8 cartas. Mantenha a mão em segredo.")
        ]
      },
      fasterStep,
      {
        id: "kittens-in",
        title: t(`Insert ${kittensInserted()} Exploding Kittens (= players)`, `Ponha ${kittensInserted()} Gatinhos Explosivos (= jogadores)`),
        codes: ["s1"],
        items: [
          t(`Insert ${kittensInserted()} Exploding Kittens into the deck: as many as there are players, 1 more than usual, because a Streaking Kitten lets a player hold a Kitten without exploding.`, `Ponha ${kittensInserted()} Gatinhos Explosivos no baralho: tantos quanto jogadores, 1 a mais que o normal, porque o Gatinho Pelado deixa um jogador segurar um Gatinho sem explodir.`),
          kittensOut > 0 ? t(`Remove the other ${kittensOut} Kitten${kittensOut > 1 ? "s" : ""} from the game (back to the box).`, `Tire ${kittensOut > 1 ? `os outros ${kittensOut} Gatinhos` : "o outro Gatinho"} do jogo (de volta à caixa).`) : ""
        ]
      },
      {
        id: "defuse-back",
        title: t("Put the extra Defuses back", "Devolva os Desarmar sobrando"),
        codes: ["s1"],
        items: [
          back > 0
            ? t(`Insert the ${back} extra Defuse${back > 1 ? "s" : ""} into the deck.`, `Ponha no baralho ${back > 1 ? `os ${back} Desarmar sobrando` : "o Desarmar sobrando"}.`)
            : t("No Defuse is left over at this player count.", "Com este número de jogadores não sobra nenhum Desarmar."),
          state.players <= 3 ? t("With 2 or 3 players the sheet allows at most 2 extra Defuses back (remove the rest from the game); your paw-print deck has at most 1 extra, so this is already met.", "Com 2 ou 3 jogadores a folha permite devolver no máximo 2 Desarmar sobrando (o resto sai do jogo); o seu baralho com pegada tem no máximo 1 sobrando, então isso já está cumprido.") : ""
        ]
      },
      {
        id: "pile",
        title: t("Make the Draw Pile", "Monte a Pilha de Compra"),
        codes: ["s1"],
        items: [
          t(`Shuffle the deck and put it face down in the centre of the table: the Draw Pile (about ${drawPileSize()} cards).`, `Embaralhe o baralho e ponha-o virado para baixo no centro da mesa: a Pilha de Compra (cerca de ${drawPileSize()} cartas).`),
          t("Leave space for a face-up Discard Pile.", "Deixe espaço para uma Pilha de Descarte virada para cima.")
        ]
      },
      {
        id: "first",
        title: t("Pick the first player", "Escolha o primeiro jogador"),
        codes: ["s1", "c1"],
        items: [
          t("Pick a player to go first and start playing as usual; play goes clockwise.", "Escolham quem começa e joguem normalmente; o jogo segue em sentido horário.")
        ]
      }
    ].filter(Boolean);
  }

  function inventory() {
    const n = state.players;
    const cls = deckClass();
    const coreLines = [
      rl("Defuse", `${count("defuse")}.`, "Desarmar", `${count("defuse")}.`),
      rl("Attack", `${count("attack")}.`, "Ataque", `${count("attack")}.`),
      rl("Skip", `${count("skip")}.`, "Pular", `${count("skip")}.`),
      rl("See the Future", `${count("see-the-future")}.`, "Ver o Futuro", `${count("see-the-future")}.`),
      rl("Alter the Future", `${count("alter-the-future")}.`, "Alterar o Futuro", `${count("alter-the-future")}.`),
      rl("Shuffle", `${count("shuffle")}.`, "Embaralhar", `${count("shuffle")}.`),
      rl("Draw from the Bottom", `${count("draw-from-the-bottom")}.`, "Comprar do Fundo", `${count("draw-from-the-bottom")}.`),
      rl("Favor", `${count("favor")}.`, "Favor", `${count("favor")}.`),
      rl("Nope", `${count("nope")}.`, "Nope", `${count("nope")}.`),
      rl("Feral Cat", `${count("feral-cat")}.`, "Gato Selvagem", `${count("feral-cat")}.`),
      rl("Cat Cards", `${count("cat")} of each of the 5 kinds (${count("cat") * 5}).`, "Cartas de Gato", `${count("cat")} de cada um dos 5 tipos (${count("cat") * 5}).`)
    ];
    const cards = [
      infoCard(t("PARTY PACK", "PARTY PACK"), t(`Selected cards: ${deckDescription()}`, `Cartas selecionadas: ${deckDescription()}`), coreLines, ["c1", "c2"]),
      infoCard(t("KITTENS & HANDS", "GATINHOS E MÃOS"), t(`${n} players`, `${n} jogadores`), [
        rl("Exploding Kittens", `${kittensInserted()} in the Draw Pile (of ${kittensAvailable()}); ${kittensAvailable() - kittensInserted()} back to the box.`, "Gatinhos Explosivos", `${kittensInserted()} na Pilha de Compra (de ${kittensAvailable()}); ${kittensAvailable() - kittensInserted()} de volta à caixa.`),
        rl("Each hand", "1 Defuse + 7 cards = 8 cards, secret.", "Cada mão", "1 Desarmar + 7 cartas = 8 cartas, em segredo."),
        rl("Extra Defuses", `${state.streaking ? extraDefusesBack() : extraDefuses()} into the deck.`, "Desarmar sobrando", `${state.streaking ? extraDefusesBack() : extraDefuses()} no baralho.`),
        state.faster ? rl("Faster game", `about ${removedThird()} cards removed unseen.`, "Jogo mais rápido", `cerca de ${removedThird()} cartas removidas sem olhar.`) : "",
        rl("Draw Pile", `about ${drawPileSize()} cards at the start; a Discard Pile next to it.`, "Pilha de Compra", `cerca de ${drawPileSize()} cartas no início; uma Pilha de Descarte ao lado.`)
      ], ["c1", "s1"]),
      state.streaking ? infoCard("STREAKING KITTENS", t("15 cards", "15 cartas"), [
        rl("Into the deck", "Streaking Kitten 1, Catomic Bomb 1, Mark 3, Curse of the Cat Butt 2, Super Skip 1, See the Future (5x) 1, Alter the Future (5x) 1, Swap Top and Bottom 3, Garbage Collection 1 (14).", "No baralho", "Gatinho Pelado 1, Bomba Gatômica 1, Marcar 3, Maldição do Bumbum de Gato 2, Super Pular 1, Ver o Futuro (5x) 1, Alterar o Futuro (5x) 1, Trocar Topo e Fundo 3, Coleta de Lixo 1 (14)."),
        rl("Exploding Kitten", "1, joins the other Kittens.", "Gatinho Explosivo", "1, junta-se aos outros Gatinhos.")
      ], ["s1", "s2"]) : "",
      infoCard(t("NOT USED", "NÃO USADO"), t("Left in the box", "Fica na caixa"), [
        cls === "all" ? "" : rl("Cards", cls === "paw" ? "every card without a paw print." : "every card with a paw print.", "Cartas", cls === "paw" ? "todas as cartas sem pegada." : "todas as cartas com pegada."),
        rl("Exploding Kittens", `${kittensAvailable() - kittensInserted()}.`, "Gatinhos Explosivos", `${kittensAvailable() - kittensInserted()}.`),
        state.faster ? rl("Faster game", "the removed third, face down.", "Jogo mais rápido", "o terço removido, virado para baixo.") : "",
        state.streaking ? "" : rl("Streaking Kittens", "not used in this match.", "Streaking Kittens", "não usado nesta partida.")
      ], ["c1"])
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
        <label class="ek-setup-check" for="ek-setup-${phase.id}">
          <input id="ek-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="ek-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="ek-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");
    const pawFigure = deckClass() === "all" ? "" : deckClass() === "paw"
      ? figure("paw-cards-with", "Three cards, each with a small paw print in the top-right corner", "Três cartas, cada uma com uma pequena pegada no canto superior direito", `Cards WITH a paw print (p. 1): use these with 2–3 players. ${glyph("paw", t("Paw print", "Pegada"))}`, `Cartas COM pegada (p. 1): use estas com 2–3 jogadores. ${glyph("paw", t("Paw print", "Pegada"))}`)
      : figure("paw-cards-without", "Three cards with an empty top-right corner", "Três cartas com o canto superior direito vazio", "Cards WITHOUT a paw print (p. 1): use these with 4–7 players.", "Cartas SEM pegada (p. 1): use estas com 4–7 jogadores.");
    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), state.streaking ? ["s1", "c1"] : ["c1"])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${playersLabel()} · ${state.streaking ? "Streaking Kittens" : t("base game", "jogo base")}${state.faster ? ` · ${t("faster game", "jogo mais rápido")}` : ""}</h3>
            <p>${state.streaking
              ? t("One checkbox per coherent step, in the order of the Streaking Kittens sheet (steps 1–10): hands are dealt before the Kittens and the extra Defuses go in.", "Uma caixa por etapa coerente, na ordem da folha de Streaking Kittens (passos 1–10): as mãos são dadas antes de os Gatinhos e os Desarmar sobrando entrarem.")
              : t("One checkbox per coherent step, in the order of the rules sheet (steps 1–7). The Kittens go in only after the hands are dealt, so nobody starts with one.", "Uma caixa por etapa coerente, na ordem da folha de regras (passos 1–7). Os Gatinhos só entram depois de as mãos serem dadas, então ninguém começa com um.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved on this device separately from the match options. Changing the players, the expansion or the variant clears it; the language does not. “Uncheck all” clears only these setup boxes — use it before the next game.",
          "O progresso é salvo neste aparelho separado das opções da partida. Mudar os jogadores, a expansão ou a variante o limpa; o idioma não. “Desmarcar tudo” limpa somente estas caixas da preparação — use antes da próxima partida."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <div class="ek-art-row">${pawFigure}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}`;
  }

  // ---------- quick reference ----------

  function quickReference() {
    const cards = [
      infoCard(t("YOUR TURN", "SEU TURNO"), t("Play (or pass), then draw", "Jogue (ou passe), depois compre"), [
        rl("1 · Play or pass", "play as many cards as you like, one at a time, face up on the Discard Pile, following each card's text — or play none.", "1 · Jogar ou passar", "jogue quantas cartas quiser, uma de cada vez, viradas para cima na Pilha de Descarte, seguindo o texto de cada uma — ou não jogue nenhuma."),
        rl("2 · Draw", "end your turn by drawing the top card of the Draw Pile into your hand.", "2 · Comprar", "termine o turno comprando a carta do topo da Pilha de Compra para a mão."),
        rl("No draw", `${cn("skip")}, ${cn("attack")}${state.streaking ? `, ${cn("super-skip")}, ${cn("catomic-bomb")}` : ""} end your turn without that draw; ${cn("draw-from-the-bottom")} draws the bottom card instead.`, "Sem compra", `${cn("skip")}, ${cn("attack")}${state.streaking ? `, ${cn("super-skip")}, ${cn("catomic-bomb")}` : ""} terminam o turno sem essa compra; ${cn("draw-from-the-bottom")} compra a carta do fundo.`),
        rl("Next", "play goes clockwise.", "Próximo", "o jogo segue em sentido horário."),
        rl("Hand size", "no maximum or minimum; an empty hand is fine.", "Tamanho da mão", "sem máximo nem mínimo; mão vazia não tem problema.")
      ], ["c1"]),
      infoCard(t("YOU DREW A KITTEN", "VOCÊ COMPROU UM GATINHO"), `${glyph("exploding-kitten", cn("exploding-kitten"))} ${t("Show it immediately", "Mostre-o imediatamente")}`, [
        rl("Defuse it", "play a Defuse; then secretly put the Kitten back anywhere in the Draw Pile (no looking, no reordering). Your turn is over.", "Desarme", "jogue um Desarmar; depois devolva o Gatinho em segredo a qualquer ponto da Pilha de Compra (sem olhar, sem reordenar). O seu turno acabou."),
        rl("No Defuse", "you explode: discard all your cards, including the Kitten. You are out.", "Sem Desarmar", "você explode: descarte todas as suas cartas, inclusive o Gatinho. Você está fora."),
        rl("Nope?", "no card can Nope an Exploding Kitten or a Defuse.", "Nope?", "nenhuma carta anula um Gatinho Explosivo ou um Desarmar."),
        state.streaking ? rl("Streaking Kitten in hand", "you may instead keep 1 Kitten hidden in your hand without exploding.", "Gatinho Pelado na mão", "você pode, em vez disso, manter 1 Gatinho escondido na mão sem explodir.") : ""
      ], ["c2", ...(state.streaking ? ["s2"] : [])]),
      infoCard(t("NOPE", "NOPE"), `${glyph("nope", cn("nope"))} ${t("Any time, any player", "A qualquer hora, qualquer jogador")}`, [
        rl("Stops", "any action except an Exploding Kitten or a Defuse, even a special combo.", "Anula", "qualquer ação exceto um Gatinho Explosivo ou um Desarmar, até um combo especial."),
        rl("When", "before the action has begun, even when it is not your turn.", "Quando", "antes de a ação começar, mesmo fora do seu turno."),
        rl("Nope a Nope", "cancels it (“Yup”), and so on.", "Nope num Nope", "o cancela (“Yup”), e assim por diante."),
        rl("Noped cards", "are lost: they stay in the Discard Pile.", "Cartas anuladas", "estão perdidas: ficam na Pilha de Descarte.")
      ], ["c2"]),
      infoCard(t("ATTACKS & SKIPS", "ATAQUES E PULOS"), `${glyph("attack", cn("attack"))} ${t("Turn counting", "Contagem de turnos")}`, [
        rl("Attack", "end your turn(s) without drawing; the next player takes 2 turns in a row.", "Ataque", "termine seu(s) turno(s) sem comprar; o próximo jogador faz 2 turnos seguidos."),
        rl("Attacked, then Attack", "your turns end; the next player takes your remaining turns + 2 (4, then 6…).", "Se você foi atacado e ataca", "seus turnos acabam; o próximo faz os turnos que faltavam + 2 (4, depois 6…)."),
        interpretation("the turn being played counts as remaining: Attack on your 1st of 2 turns → next player takes 4; on your 2nd → 3.", "o turno em andamento conta como restante: Ataque no 1º de 2 turnos → o próximo faz 4; no 2º → 3."),
        rl("Skip", "ends only 1 turn (2 Skips end both turns of an Attack).", "Pular", "termina só 1 turno (2 Pular terminam os 2 turnos de um Ataque)."),
        state.streaking ? rl("Super Skip", "ends all the turns you must take.", "Super Pular", "termina todos os turnos que você precisa fazer.") : ""
      ], ["c2", ...(state.streaking ? ["s2"] : [])]),
      infoCard(t("CATS & COMBOS", "GATOS E COMBOS"), `${glyph("cat-1", t("Cat Card", "Carta de Gato"))} ${t("Ignore card text when comboing", "Ignore o texto das cartas no combo")}`, [
        rl("Pair (2 matching)", "steal a random card from another player. Any 2 cards with the same title count, not only cats.", "Par (2 iguais)", "roube uma carta ao acaso de outro jogador. Quaisquer 2 cartas de mesmo título valem, não só gatos."),
        rl("Three of a kind", "name a card; if that player has it, they must give it to you; if not, you get nothing.", "Trinca", "diga o nome de uma carta; se o jogador a tiver, deve entregá-la; se não, você não ganha nada."),
        rl("5 different titles", "take any 1 card from the Discard Pile.", "5 títulos diferentes", "pegue 1 carta qualquer da Pilha de Descarte."),
        rl("Feral Cat", "counts as any Cat Card, never as a non-cat card.", "Gato Selvagem", "vale como qualquer Carta de Gato, nunca como carta que não seja de gato."),
        state.streaking ? rl("Never in a 5-card combo", "Streaking Kittens and Exploding Kittens (not played, not taken from the discards).", "Nunca no combo de 5", "Gatinho Pelado e Gatinhos Explosivos (nem jogados, nem pegos do descarte).") : ""
      ], ["c2", ...(state.streaking ? ["s2"] : [])]),
      infoCard(t("WINNING", "VITÓRIA"), t("Last player standing", "O último que sobrar"), [
        rl("Explode", "you lose and are out of the game.", "Explodiu", "você perde e sai do jogo."),
        rl("Win", "the last player who hasn't exploded wins.", "Vitória", "vence o último jogador que não explodiu."),
        rl("The deck never runs out", state.streaking ? "there is one Kitten per player." : "there are enough Kittens to eliminate all but 1 player.", "O baralho nunca acaba", state.streaking ? "há um Gatinho por jogador." : "há Gatinhos suficientes para eliminar todos menos 1 jogador.")
      ], ["c1"]),
      state.streaking ? infoCard(t("BLIND & MARKED", "CEGO E MARCADO"), `${glyph("curse-of-the-cat-butt", cn("curse-of-the-cat-butt"))} ${t("Streaking Kittens", "Streaking Kittens")}`, [
        rl("Blind", "your cards lie face down and shuffled; you can't look at them until you draw a card from the Draw Pile without exploding.", "Cego", "as suas cartas ficam viradas para baixo e embaralhadas; você não pode olhá-las até comprar uma carta da Pilha de Compra sem explodir."),
        rl("Playing blind", "pick cards at random and play them face up; if unplayable (e.g. a lone Cat Card) it is lost.", "Jogando cego", "escolha cartas ao acaso e jogue-as viradas para cima; se não forem jogáveis (ex.: Carta de Gato sozinha), estão perdidas."),
        rl("Blind Kitten", "drawing a Kitten is not a success: play random cards until a Defuse comes up; every other card is lost without effect. No Defuse left: you lose.", "Gatinho cego", "comprar um Gatinho não é sucesso: jogue cartas ao acaso até sair um Desarmar; as demais cartas são perdidas sem efeito. Sem Desarmar: você perde."),
        rl("Marked card", "one card turned to face the others; it stays marked until played or stolen.", "Carta marcada", "uma carta virada para os outros; fica marcada até ser jogada ou roubada.")
      ], ["s2"]) : ""
    ].filter(Boolean);
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), ["c1", "c2", ...(state.streaking ? ["s2"] : [])])}
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- rule sections ----------

  function howItWorksSection() {
    return `
      ${sectionHeading("how-it-works", t("How it works & winning", "Como funciona e vitória"), ["c1"])}
      <div class="quick-grid">
        ${infoCard(t("THE IDEA", "A IDEIA"), t("Russian roulette with cards", "Roleta-russa com cartas"), [
          t("The Draw Pile hides some Exploding Kittens. Players take turns drawing cards until someone draws one.", "A Pilha de Compra esconde alguns Gatinhos Explosivos. Os jogadores se revezam comprando cartas até alguém comprar um."),
          t("Whoever draws one explodes (unless they Defuse it): they are dead and out of the game.", "Quem compra um explode (a menos que o desarme): está morto e fora do jogo."),
          t("This continues until only 1 player is left, who wins.", "Isso continua até sobrar só 1 jogador, que vence."),
          t("The more cards you draw, the greater your chance of drawing a Kitten: every other card helps you draw less, look ahead, or push the danger onto someone else.", "Quanto mais cartas você compra, maior a chance de pegar um Gatinho: todas as outras cartas ajudam você a comprar menos, olhar adiante ou empurrar o perigo para outra pessoa.")
        ], ["c1"])}
        ${infoCard(t("BASICALLY", "BASICAMENTE"), t("The rules on one line each", "As regras em uma linha cada"), [
          rl("If you explode", "you lose.", "Se você explodir", "você perde."),
          rl("If you don't explode", "you win.", "Se você não explodir", "você vence."),
          rl("All the other cards", "lessen your chances of getting exploded.", "Todas as outras cartas", "diminuem suas chances de explodir.")
        ], ["c1"])}
        ${infoCard(t("ENDING THE GAME", "FIM DO JOGO"), t("Last player who hasn't exploded wins", "Vence o último que não explodiu"), [
          state.streaking
            ? t(`With Streaking Kittens there are ${state.players} Kittens for ${state.players} players: one extra, because a player holding a Streaking Kitten can keep a Kitten in hand.`, `Com Streaking Kittens há ${state.players} Gatinhos para ${state.players} jogadores: um a mais, porque quem tem um Gatinho Pelado pode guardar um Gatinho na mão.`)
            : t(`There are ${state.players - 1} Kittens for ${state.players} players, so you never run out of cards: everyone explodes except 1 person.`, `Há ${state.players - 1} Gatinhos para ${state.players} jogadores, então as cartas nunca acabam: todos explodem menos 1 pessoa.`),
          t("An exploded player discards their whole hand (Kitten included) and takes no more turns.", "Quem explode descarta a mão inteira (com o Gatinho) e não joga mais.")
        ], ["c1", "c2"])}
      </div>`;
  }

  function turnSection() {
    return `
      ${sectionHeading("turn", t("Your turn", "Seu turno"), ["c1", "c2"])}
      <div class="quick-grid">
        ${infoCard(t("STEP 1", "PASSO 1"), t("Pass or play", "Passar ou jogar"), [
          t("Look at your hand and do one of the following:", "Olhe a sua mão e faça uma das opções:"),
          rl("Pass", "play no cards.", "Passar", "não jogue nenhuma carta."),
          rl("Play", "put a card FACE UP on top of the Discard Pile and do what it says. Afterwards you may play another card, as many as you like.", "Jogar", "ponha uma carta VIRADA PARA CIMA no topo da Pilha de Descarte e faça o que ela diz. Depois pode jogar outra, quantas quiser."),
          rl("Pairs and combos", "count as one play (see Special combos).", "Pares e combos", "contam como uma jogada (veja Combos especiais)."),
          rl("Wait for Nopes", "give the others a moment to Nope each card before it takes effect.", "Espere os Nopes", "dê aos outros um instante para anular cada carta antes de ela fazer efeito.")
        ], ["c1", "c2"])}
        ${infoCard(t("STEP 2", "PASSO 2"), t("Draw to end your turn", "Compre para terminar o turno"), [
          t("Draw the top card of the Draw Pile into your hand and hope it's not an Exploding Kitten.", "Compre a carta do topo da Pilha de Compra para a mão e torça para não ser um Gatinho Explosivo."),
          t("Unlike most games, drawing ENDS your turn.", "Ao contrário da maioria dos jogos, comprar TERMINA o seu turno."),
          t("Then the next player clockwise takes a turn.", "Depois o próximo jogador em sentido horário faz o turno."),
          rl("Exceptions", `cards that end your turn without drawing (${cn("skip")}, ${cn("attack")}${state.streaking ? `, ${cn("super-skip")}, ${cn("catomic-bomb")}` : ""}) and ${cn("draw-from-the-bottom")}.`, "Exceções", `cartas que terminam o turno sem comprar (${cn("skip")}, ${cn("attack")}${state.streaking ? `, ${cn("super-skip")}, ${cn("catomic-bomb")}` : ""}) e ${cn("draw-from-the-bottom")}.`)
        ], ["c1"])}
        ${infoCard(t("REMEMBER", "LEMBRE"), t("“Pass-or-play then draw”", "“Passe-ou-jogue e depois compre”"), [
          t("There is no maximum or minimum hand size.", "Não há tamanho máximo nem mínimo de mão."),
          t("If you run out of cards, nothing special happens: keep playing. You draw at least 1 card on your next turn.", "Se as suas cartas acabarem, nada especial acontece: continue jogando. Você compra pelo menos 1 carta no próximo turno."),
          t("You can always count the cards left in the Draw Pile to work out the odds of exploding.", "Você sempre pode contar as cartas da Pilha de Compra para calcular a chance de explodir.")
        ], ["c1"])}
      </div>`;
  }

  function cardEntries() {
    const core = [
      ["exploding-kitten", state.streaking
        ? t(`9 cards + 1 from Streaking (this deck uses ${kittensInserted()})`, `9 cartas + 1 do Streaking (este baralho usa ${kittensInserted()})`)
        : t(`9 cards (this deck uses players − 1 = ${kittensInserted()})`, `9 cartas (este baralho usa jogadores − 1 = ${kittensInserted()})`), [
        t("Show it immediately when you draw it.", "Mostre-o imediatamente ao comprá-lo."),
        t("Unless you play a Defuse, you are dead: discard all your cards, including the Exploding Kitten.", "A menos que jogue um Desarmar, você está morto: descarte todas as suas cartas, inclusive o Gatinho Explosivo."),
        t("No paw print on any of them.", "Nenhum deles tem pegada.")
      ], "c2"],
      ["defuse", `${count("defuse")} ${t("in this deck", "neste baralho")} (3 ${t("with", "com")} / 7 ${t("without paw", "sem pegada")})`, [
        t("If you drew an Exploding Kitten, play this instead of dying; put the Defuse in the Discard Pile.", "Se comprou um Gatinho Explosivo, jogue isto em vez de morrer; ponha o Desarmar na Pilha de Descarte."),
        t("Then take the Kitten and, without viewing or reordering the other cards, secretly put it back anywhere in the Draw Pile.", "Depois pegue o Gatinho e, sem ver nem reordenar as outras cartas, devolva-o em segredo a qualquer ponto da Pilha de Compra."),
        t("Want to hurt the next player? Put it right on top. You may hold the deck under the table so no one sees where it goes.", "Quer prejudicar o próximo? Ponha-o bem no topo. Pode segurar o baralho embaixo da mesa para ninguém ver onde ele vai."),
        t("Your turn is over after playing this card.", "O seu turno acaba depois de jogar esta carta.")
      ], "c2"],
      ["attack", `${count("attack")} (4 / 7) · 2x`, [
        t("Immediately end your turn(s) without drawing; the next player must take 2 turns in a row.", "Termine imediatamente o(s) seu(s) turno(s) sem comprar; o próximo jogador deve fazer 2 turnos seguidos."),
        t("The victim plays a normal turn (play-or-pass, then draw); after their first turn it is their turn again.", "A vítima faz um turno normal (jogar-ou-passar, depois comprar); depois do primeiro turno, é a vez dela de novo."),
        t("If the victim plays an Attack, their turns end at once and the next player takes the remaining turns plus 2 more (4 turns, then 6, and so on).", "Se a vítima jogar um Ataque, os turnos dela acabam na hora e o próximo faz os turnos que faltavam mais 2 (4 turnos, depois 6, e assim por diante).")
      ], "c2"],
      ["skip", `${count("skip")} (4 / 6)`, [
        t("Immediately end your turn without drawing a card.", "Termine imediatamente o turno sem comprar carta."),
        t("Against an Attack it ends only 1 of the 2 turns; 2 Skips end both.", "Contra um Ataque termina só 1 dos 2 turnos; 2 Pular terminam ambos.")
      ], "c2"],
      ["see-the-future", `${count("see-the-future")} (3 / 3) · 3x`, [
        t("Privately view the top 3 cards of the Draw Pile and put them back in the same order.", "Veja em segredo as 3 cartas do topo da Pilha de Compra e devolva-as na mesma ordem."),
        t("Don't show them to the other players.", "Não as mostre aos outros jogadores.")
      ], "c2"],
      ["alter-the-future", `${count("alter-the-future")} (2 / 4) · 3x`, [
        t("Privately view the top 3 cards of the Draw Pile and rearrange them in any order.", "Veja em segredo as 3 cartas do topo da Pilha de Compra e reordene-as como quiser."),
        t("Return them face down on top, then continue your turn.", "Devolva-as viradas para baixo no topo e continue o turno.")
      ], "c2"],
      ["shuffle", `${count("shuffle")} (2 / 4)`, [
        t("Shuffle the Draw Pile thoroughly — useful when you know a Kitten is coming.", "Embaralhe bem a Pilha de Compra — útil quando você sabe que vem um Gatinho.")
      ], "c2"],
      ["draw-from-the-bottom", `${count("draw-from-the-bottom")} (3 / 4)`, [
        t("End your turn by drawing the bottom card of the Draw Pile (instead of the top).", "Termine o turno comprando a carta do fundo da Pilha de Compra (em vez da do topo).")
      ], "c2"],
      ["favor", `${count("favor")} (2 / 4)`, [
        t("Force any other player to give you 1 card from their hand.", "Obrigue qualquer outro jogador a lhe dar 1 carta da mão."),
        t("They choose which card.", "Ele escolhe qual carta.")
      ], "c2"],
      ["nope", `${count("nope")} (4 / 6)`, [
        t("Stop any action except an Exploding Kitten or a Defuse. Imagine that any card beneath a Nope never existed.", "Pare qualquer ação exceto um Gatinho Explosivo ou um Desarmar. Imagine que a carta sob o Nope nunca existiu."),
        t("Play it any time before an action has begun, even when it's not your turn.", "Jogue-o a qualquer momento antes de a ação começar, mesmo fora do seu turno."),
        t("A Nope on a Nope cancels it and makes a “Yup”, and so on.", "Um Nope sobre um Nope o cancela e vira um “Yup”, e assim por diante."),
        t("Noped cards are lost: leave them in the Discard Pile. You can Nope a special combo too.", "Cartas anuladas estão perdidas: deixe-as na Pilha de Descarte. Também dá para anular um combo especial.")
      ], "c2"],
      ["feral-cat", `${count("feral-cat")} (2 / 4)`, [
        t("Use it as any Cat Card (any card that is powerless on its own).", "Use-a como qualquer Carta de Gato (qualquer carta sem poder sozinha)."),
        t("It cannot be used as a non-cat card (Shuffle, Attack, etc.).", "Não pode ser usada como carta que não seja de gato (Embaralhar, Ataque etc.).")
      ], "c2"],
      ["cat", `${count("cat")} ${t("of each of 5 kinds", "de cada um dos 5 tipos")} (3 / 4 ${t("each", "cada")})`, [
        t("Powerless on their own.", "Sem poder sozinhas."),
        t("Play 2 matching Cat Cards as a Pair to steal a random card from another player.", "Jogue 2 Cartas de Gato iguais como Par para roubar uma carta ao acaso de outro jogador."),
        t("They can also be used in Special Combos — where any 2 cards with the same title (not only cats) also make a pair.", "Também servem para os Combos Especiais — onde quaisquer 2 cartas de mesmo título (não só gatos) também formam par.")
      ], "c2"]
    ];
    const streaking = [
      ["streaking-kitten", t("1 card", "1 carta"), [
        t("While it is in your hand you may also secretly hold 1 Exploding Kitten without exploding.", "Enquanto estiver na sua mão, você pode também segurar em segredo 1 Gatinho Explosivo sem explodir."),
        t("If the Streaking Kitten leaves your hand for any reason, the Kitten in your hand explodes: Defuse it or lose.", "Se o Gatinho Pelado sair da sua mão por qualquer motivo, o Gatinho na sua mão explode: desarme-o ou perca."),
        t("If another player steals or receives the Kitten from your hand, they explode (Defuse or lose).", "Se outro jogador roubar ou receber o Gatinho da sua mão, ele explode (desarma ou perde)."),
        t("If any action makes you play the Kitten from your hand onto the Discard Pile, you explode (Defuse or lose).", "Se alguma ação fizer você jogar o Gatinho da mão na Pilha de Descarte, você explode (desarma ou perde)."),
        t("Streaking Kittens and Exploding Kittens can never be part of the 5-card combo, nor taken from the Discard Pile with it.", "Gatinho Pelado e Gatinhos Explosivos nunca entram no combo de 5 cartas, nem podem ser pegos do descarte com ele.")
      ], "s2"],
      ["catomic-bomb", t("1 card", "1 carta"), [
        t("Take every Exploding Kitten out of the Draw Pile so everyone can see them.", "Tire todos os Gatinhos Explosivos da Pilha de Compra, à vista de todos."),
        t("Shuffle the Draw Pile, then put the Kittens face down on top.", "Embaralhe a Pilha de Compra e ponha os Gatinhos virados para baixo no topo."),
        t("End your turn without drawing.", "Termine o turno sem comprar.")
      ], "s2"],
      ["mark", t("3 cards", "3 cartas"), [
        t("Pick a target player and randomly pick 1 of their cards.", "Escolha um jogador e pegue ao acaso 1 carta dele."),
        t("“Mark” it: return it to their hand facing out, so the others see it. They can still look at it and use it.", "“Marque-a”: devolva-a à mão dele virada para fora, para os outros a verem. Ele ainda pode olhá-la e usá-la."),
        t("It stays marked until it is played or stolen; a stolen marked card is no longer marked.", "Fica marcada até ser jogada ou roubada; carta marcada roubada deixa de ser marcada.")
      ], "s2"],
      ["curse-of-the-cat-butt", t("2 cards", "2 cartas"), [
        t("Pick a target player: they immediately go BLIND — cards face down on the table, shuffled.", "Escolha um jogador: ele fica CEGO na hora — cartas viradas para baixo na mesa, embaralhadas."),
        t("A blind player may not look at their cards until they successfully draw a card from the Draw Pile without exploding.", "Um jogador cego não pode olhar suas cartas até comprar com sucesso uma carta da Pilha de Compra sem explodir."),
        t("On their turn, any card they play is picked at random and played face up; if it is playable it works as normal, if not (a single Cat Card, etc.) it is lost.", "No turno dele, cada carta jogada é escolhida ao acaso e jogada virada para cima; se for jogável funciona normalmente, se não (uma Carta de Gato sozinha etc.) está perdida."),
        t("See “Streaking Kittens rules” for blind Kittens, Favor, Mark, Three of a Kind and Garbage Collection.", "Veja “Regras de Streaking Kittens” para Gatinho, Favor, Marcar, Trinca e Coleta de Lixo com jogador cego.")
      ], "s2"],
      ["super-skip", t("1 card", "1 carta"), [
        t("End your turn without drawing. If you must take several turns, end them all (useful against an Attack).", "Termine o turno sem comprar. Se tiver de fazer vários turnos, termine todos (útil contra um Ataque).")
      ], "s2"],
      ["sk-see-the-future", `${t("1 card", "1 carta")} · 5x`, [
        t("Privately view the top 5 cards of the Draw Pile and put them back in the same order. Don't show them.", "Veja em segredo as 5 cartas do topo da Pilha de Compra e devolva-as na mesma ordem. Não as mostre.")
      ], "s2"],
      ["sk-alter-the-future", `${t("1 card", "1 carta")} · 5x`, [
        t("Privately view the top 5 cards of the Draw Pile and rearrange them in any order.", "Veja em segredo as 5 cartas do topo da Pilha de Compra e reordene-as como quiser.")
      ], "s2"],
      ["swap-top-and-bottom", t("3 cards", "3 cartas"), [
        t("Swap the top and bottom cards of the Draw Pile without looking at them.", "Troque de lugar as cartas do topo e do fundo da Pilha de Compra sem olhá-las.")
      ], "s2"],
      ["garbage-collection", t("1 card", "1 carta"), [
        t("Every player who has cards (you included) chooses 1 card from their hand and secretly inserts it into the Draw Pile.", "Cada jogador que tiver cartas (você inclusive) escolhe 1 carta da mão e a insere em segredo na Pilha de Compra."),
        t("Then shuffle the entire Draw Pile.", "Depois embaralhe a Pilha de Compra inteira.")
      ], "s2"],
      ["exploding-kitten", t("1 extra card", "1 carta extra"), [
        t("An extra Exploding Kitten to make room for the Streaking Kitten; it works like the others.", "Um Gatinho Explosivo extra para compensar o Gatinho Pelado; funciona como os outros.")
      ], "s2"]
    ];
    return { core, streaking };
  }

  function cardGrid(entries, isStreaking) {
    return `<div class="icon-grid ek-card-grid">${entries.map(([id, countText, lines, code]) => {
      const nameId = isStreaking && id === "sk-see-the-future" ? "see-the-future-5"
        : isStreaking && id === "sk-alter-the-future" ? "alter-the-future-5" : id;
      const icon = id === "cat"
        ? `<span class="ek-cat-icons">${[1, 2, 3, 4, 5].map((i) => `<img class="manual-icon" src="${ICONS}cat-${i}.webp" alt="${t(`Cat Card kind ${i}`, `Carta de Gato tipo ${i}`)}" loading="lazy">`).join("")}</span>`
        : `<span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${id}.webp" alt="${cn(nameId)}" loading="lazy"></span>`;
      return `
        <article class="icon-card ${id === "cat" ? "ek-icon-wide" : ""}">
          ${icon}
          <div><strong>${cn(nameId)}</strong> <span class="ek-count">${countText}</span>${lineList(lines)}${referenceLink(code)}</div>
        </article>`;
    }).join("")}</div>`;
  }

  function cardsSection() {
    const { core, streaking } = cardEntries();
    return `
      ${sectionHeading("cards", t("Cards & icons", "Cartas e ícones"), ["c2", ...(state.streaking ? ["s2"] : [])])}
      <p class="glossary-intro">${t(
        `Each icon is cut from the Field Guide side of the rules sheet and shown with that card's explanation. Counts read “in this deck” first, then “with paw / without paw” as printed; “2x” and “3x” are part of the card titles. You can also read the text printed on each card.`,
        `Cada ícone foi recortado do lado “Field Guide” da folha de regras e aparece com a explicação da carta. As quantidades mostram primeiro “neste baralho”, depois “com pegada / sem pegada” como impresso; “2x” e “3x” fazem parte dos títulos. Você também pode ler o texto impresso em cada carta.`
      )}</p>
      <article class="icon-card ek-paw-card">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}paw.webp" alt="${t("Paw print", "Pegada de gato")}" loading="lazy"></span>
        <div><strong>${t("Paw print", "Pegada de gato")}</strong>${lineList([
          t("Printed in the top-right corner of some cards; decides which cards you use (2–3 players: with; 4–7: without; 8–10: all).", "Impressa no canto superior direito de algumas cartas; decide quais cartas usar (2–3 jogadores: com; 4–7: sem; 8–10: todas)."),
        ])}${referenceLink("c1")}</div>
      </article>
      <h3 class="subhead">${t("Party Pack cards", "Cartas do Party Pack")}</h3>
      ${cardGrid(core, false)}
      ${state.streaking ? `<h3 class="subhead">${t("Streaking Kittens cards", "Cartas de Streaking Kittens")}</h3>${cardGrid(streaking, true)}` : ""}`;
  }

  function combosSection() {
    return `
      ${sectionHeading("combos", t("Special combos", "Combos especiais"), ["c2"])}
      <p class="glossary-intro">${t("The rules suggest reading this after your first game. When you play a special combo, ignore the instructions on the cards. Any combo can be Noped.", "As regras sugerem ler isto depois da primeira partida. Ao jogar um combo especial, ignore as instruções das cartas. Qualquer combo pode ser anulado com Nope.")}</p>
      <div class="quick-grid">
        ${infoCard(t("COMBO", "COMBO"), t("Two of a kind", "Par"), [
          t("Play 2 cards with the same title (2 matching Cat Cards, 2 Shuffles, 2 Skips…).", "Jogue 2 cartas de mesmo título (2 Cartas de Gato iguais, 2 Embaralhar, 2 Pular…)."),
          t("Steal a random card from another player.", "Roube uma carta ao acaso de outro jogador."),
          t("A Feral Cat can complete a pair of Cat Cards, not of other cards.", "O Gato Selvagem completa um par de Cartas de Gato, não de outras cartas.")
        ], ["c2"])}
        ${infoCard(t("COMBO", "COMBO"), t("Three of a kind", "Trinca"), [
          t("Play 3 cards with the same title.", "Jogue 3 cartas de mesmo título."),
          t("Name the card you want from another player (“I'd like your Defuse, please”).", "Diga a carta que quer de outro jogador (“Quero o seu Desarmar, por favor”)."),
          t("If they have it, they give it to you; if not, you get nothing.", "Se ele a tiver, entrega a você; se não, você não ganha nada.")
        ], ["c2"])}
        ${infoCard(t("COMBO", "COMBO"), t("5 different cards", "5 cartas diferentes"), [
          t("Play 5 cards with 5 different titles.", "Jogue 5 cartas de 5 títulos diferentes."),
          t("Go through the Discard Pile and take any single card.", "Procure na Pilha de Descarte e pegue uma carta qualquer."),
          t("Pick up the Discard Pile quickly, search it, take your card and put the rest back — the rules say to be quick so you don't get Noped.", "Pegue a Pilha de Descarte rápido, procure, fique com a sua carta e devolva o resto — as regras pedem rapidez para você não levar um Nope."),
          state.streaking ? t("Streaking Kittens and Exploding Kittens can't be among the 5 cards and can't be taken from the Discard Pile.", "Gatinho Pelado e Gatinhos Explosivos não podem estar entre as 5 cartas nem ser pegos do descarte.") : ""
        ], ["c2", ...(state.streaking ? ["s2"] : [])])}
      </div>`;
  }

  function streakingSection() {
    if (!state.streaking) {
      return "";
    }
    return `
      ${sectionHeading("streaking", t("Streaking Kittens rules", "Regras de Streaking Kittens"), ["s1", "s2"])}
      <div class="quick-grid">
        ${infoCard(t("STREAKING KITTEN", "GATINHO PELADO"), `${glyph("streaking-kitten", cn("streaking-kitten"))} ${t("Holding a Kitten safely", "Segurando um Gatinho com segurança")}`, [
          t("When you draw an Exploding Kitten while holding the Streaking Kitten, you may keep it in your hand instead of exploding — only 1 Kitten at a time.", "Ao comprar um Gatinho Explosivo segurando o Gatinho Pelado, você pode mantê-lo na mão em vez de explodir — só 1 Gatinho de cada vez."),
          t("The moment the Streaking Kitten leaves your hand (played, stolen, given), the held Kitten explodes: Defuse it or lose.", "No momento em que o Gatinho Pelado sair da sua mão (jogado, roubado, dado), o Gatinho guardado explode: desarme-o ou perca."),
          t("Whoever steals or receives the held Kitten explodes (Defuse or lose).", "Quem roubar ou receber o Gatinho guardado explode (desarma ou perde)."),
          t("Playing the held Kitten onto the Discard Pile (e.g. a random blind play) makes you explode.", "Jogar o Gatinho guardado na Pilha de Descarte (ex.: jogada cega ao acaso) faz você explodir."),
          interpretation("the card says you hold the Kitten “secretly”, so you don't show it; you may still Defuse it normally if you prefer.", "a carta diz que você segura o Gatinho “em segredo”, então não o mostra; mesmo assim pode desarmá-lo normalmente se preferir.")
        ], ["s2"])}
        ${infoCard(t("BLIND", "CEGO"), `${glyph("curse-of-the-cat-butt", cn("curse-of-the-cat-butt"))} ${t("Blind exceptions", "Exceções do jogador cego")}`, [
          rl("Blind Exploding Kitten", "drawing a Kitten (without a Streaking Kitten) is not a successful draw. Play cards blindly until you play a Defuse; every non-Defuse card played is lost without effect. After defusing you can see again.", "Gatinho Explosivo cego", "comprar um Gatinho (sem Gatinho Pelado) não é compra com sucesso. Jogue cartas às cegas até jogar um Desarmar; cada carta que não seja Desarmar é perdida sem efeito. Depois de desarmar você volta a ver."),
          rl("Playing a Kitten blind", "if you play an Exploding Kitten while blind, you explode immediately and must blindly Defuse it or lose. Two Kittens at once: Defuse each before continuing.", "Jogando um Gatinho às cegas", "se você jogar um Gatinho Explosivo estando cego, explode na hora e precisa desarmá-lo às cegas ou perde. Dois Gatinhos de uma vez: desarme cada um antes de continuar."),
          rl("Blind Favor", "you may look at the card you receive, then turn it face down and shuffle it into your cards on the table.", "Favor cego", "você pode olhar a carta que recebe, depois virá-la para baixo e embaralhá-la com as suas cartas na mesa."),
          rl("Blind Mark", "a marked card stays facing the opposite way from the rest of your cards until it is played or stolen.", "Marcar cego", "a carta marcada fica virada ao contrário das outras até ser jogada ou roubada."),
          rl("Blind Three of a Kind", "find the requested card (if you have it), give it, then put your cards back face down and shuffle them.", "Trinca contra cego", "procure a carta pedida (se tiver), entregue-a, depois devolva as cartas viradas para baixo e embaralhe-as."),
          rl("Blind Garbage Collection", "pick a card to contribute without looking; afterwards you may secretly view it (so if you gave away your Streaking Kitten and kept a Kitten, you can try to Defuse it).", "Coleta de Lixo cega", "escolha uma carta para contribuir sem olhar; depois pode vê-la em segredo (se entregou o Gatinho Pelado e ficou com um Gatinho, pode tentar desarmá-lo).")
        ], ["s2"])}
        ${infoCard(t("NOT SUPPLIED", "NÃO FORNECIDO"), t("Imploding Kittens", "Imploding Kittens"), [
          t("The Streaking sheet has notes for the Imploding Kittens expansion (Imploding Kitten not affected by the Streaking Kitten, not removed by the Catomic Bomb, counted with the Kittens). That expansion is not among the supplied manuals, so this guide does not cover it.", "A folha de Streaking traz notas para a expansão Imploding Kittens (o Imploding Kitten não é afetado pelo Gatinho Pelado, não é removido pela Bomba Gatômica, conta junto com os Gatinhos). Essa expansão não está entre os manuais fornecidos, então este guia não a cobre.")
        ], ["s1", "s2"])}
      </div>`;
  }

  function examplesSection() {
    const ex = (page, title, lines, codes) => infoCard(t(`EXAMPLE · ${page}`, `EXEMPLO · ${page}`), title, lines, codes);
    const cards = [
      ex(t("Rules p. 2", "Regras p. 2"), t("Example turn", "Turno de exemplo"), [
        t("You suspect the top card is an Exploding Kitten, so you play See the Future and privately peek at the top 3 cards.", "Você desconfia que a carta do topo é um Gatinho Explosivo, então joga Ver o Futuro e espia em segredo as 3 do topo."),
        t("You were right: the top card — the one you would draw — is a Kitten.", "Acertou: a carta do topo — a que você compraria — é um Gatinho."),
        t("You play an Attack to end your turn and force the next player to take 2 turns…", "Você joga um Ataque para terminar o turno e obrigar o próximo a fazer 2 turnos…"),
        t("…but another player plays a Nope that cancels your Attack, so it's still your turn.", "…mas outro jogador joga um Nope que cancela o seu Ataque, então ainda é o seu turno."),
        t("You don't want to draw that top card, so you play a Shuffle and randomly shuffle the Draw Pile.", "Você não quer comprar aquela carta, então joga Embaralhar e embaralha a Pilha de Compra."),
        t("With the deck freshly shuffled, you draw the top card to end your turn and hope it's not a Kitten.", "Com o baralho recém-embaralhado, você compra a carta do topo para terminar o turno e torce para não ser um Gatinho.")
      ], ["c2"]),
      ex(t("Rules p. 1", "Regras p. 1"), t("See the Future, then Skip", "Ver o Futuro, depois Pular"), [
        t("Peek at the top cards with See the Future.", "Espie as cartas do topo com Ver o Futuro."),
        t("If it reveals an Exploding Kitten on top, play a Skip to end your turn without drawing it.", "Se aparecer um Gatinho Explosivo no topo, jogue Pular para terminar o turno sem comprá-lo.")
      ], ["c1"]),
      ex(t("Rules p. 2", "Regras p. 2"), t("Nope, Nope, Yup", "Nope, Nope, Yup"), [
        t("“I'm gonna play See the Future.” — “NOPE!”", "“Vou jogar Ver o Futuro.” — “NOPE!”"),
        t("The first player plays another Nope on that Nope: “YUP!” — the See the Future happens after all. — “Dang.”", "O primeiro jogador joga outro Nope sobre o Nope: “YUP!” — o Ver o Futuro acontece afinal. — “Droga.”")
      ], ["c2"]),
      ex(t("Rules p. 2", "Regras p. 2"), t("Stacked Attacks", "Ataques empilhados"), [
        t("Ana plays an Attack: Bruno must take 2 turns.", "Ana joga um Ataque: Bruno deve fazer 2 turnos."),
        t("On his first turn Bruno plays an Attack: his turns end, and Carla must take his 2 turns + 2 = 4 turns.", "No primeiro turno Bruno joga um Ataque: os turnos dele acabam e Carla deve fazer os 2 turnos dele + 2 = 4 turnos."),
        t("If Carla answers with another Attack at once, Davi takes 6 turns.", "Se Carla responder na hora com outro Ataque, Davi faz 6 turnos."),
        t("A Skip would have ended only 1 of Bruno's 2 turns.", "Um Pular teria terminado só 1 dos 2 turnos de Bruno.")
      ], ["c2"]),
      ex(t("Rules p. 2", "Regras p. 2"), t("Defusing nastily", "Desarmando com maldade"), [
        t("You draw a Kitten, show it, play your Defuse.", "Você compra um Gatinho, mostra, joga o Desarmar."),
        t("Holding the Draw Pile under the table, you slide the Kitten onto the very top: the next player draws it unless they act.", "Segurando a Pilha de Compra embaixo da mesa, você põe o Gatinho bem no topo: o próximo o compra se não fizer nada.")
      ], ["c2"]),
      state.streaking ? ex(t("Streaking p. 2", "Streaking p. 2"), t("Catomic Bomb", "Bomba Gatômica"), [
        t("You play Catomic Bomb: every Kitten in the Draw Pile is pulled out in view of everyone.", "Você joga a Bomba Gatômica: todos os Gatinhos da Pilha de Compra saem à vista de todos."),
        t("The rest of the pile is shuffled and the Kittens go face down on top — then your turn ends without drawing.", "O resto da pilha é embaralhado e os Gatinhos vão virados para baixo no topo — e o seu turno acaba sem compra."),
        t("The next players must draw them unless they Skip, Shuffle, Attack…", "Os próximos jogadores terão de comprá-los, a menos que Pulem, Embaralhem, Ataquem…")
      ], ["s2"]) : ""
    ].filter(Boolean);
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), ["c1", "c2", ...(state.streaking ? ["s2"] : [])])}
      <div class="ek-examples-layout">
        ${figure("example-turn", "The rules sheet's illustrated example turn: See the Future, Attack, Nope, Shuffle, draw", "O turno de exemplo ilustrado da folha de regras: Ver o Futuro, Ataque, Nope, Embaralhar, comprar", "The illustrated example turn (rules p. 2).", "O turno de exemplo ilustrado (regras p. 2).", "ek-art-tall")}
        <div class="quick-grid">${cards.join("")}</div>
      </div>`;
  }

  function tipsSection() {
    return `
      ${sectionHeading("tips", t("Tips", "Dicas"), ["c1"])}
      <div class="quick-grid">
        ${infoCard(t("THREE MORE THINGS", "MAIS TRÊS COISAS"), t("From the rules sheet", "Da folha de regras"), [
          t("Save your cards early in the game, while your chance of exploding is low.", "Guarde as cartas no começo do jogo, quando a chance de explodir é baixa."),
          t("Count the cards left in the Draw Pile to figure out the odds of exploding.", "Conte as cartas da Pilha de Compra para saber a chance de explodir."),
          t("Try to get as many Defuse cards as possible (Favor, pairs and Three of a Kind can take them).", "Tente juntar o máximo de Desarmar possível (Favor, pares e trincas podem pegá-los)."),
          t("Running out of cards is fine: keep playing.", "Ficar sem cartas não tem problema: continue jogando.")
        ], ["c1"])}
      </div>`;
  }

  function faqSection() {
    const items = [
      [t("How many turns after a stacked Attack?", "Quantos turnos depois de Ataques empilhados?"), t("The rules say “remaining turns plus 2” with the example 4, then 6. The guide counts the turn being played as remaining: attacked on your first of 2 turns → the next player takes 4; on your second → 3.", "As regras dizem “turnos restantes mais 2”, com o exemplo 4, depois 6. O guia conta o turno em andamento como restante: atacado no primeiro de 2 turnos → o próximo faz 4; no segundo → 3."), "c2"],
      [t("Two Feral Cats as a pair?", "Dois Gatos Selvagens como par?"), t("Each Feral Cat stands in for any Cat Card, so the guide allows 2 Feral Cats as a pair (or a Feral Cat with any Cat Card). It never completes a pair of non-cat cards.", "Cada Gato Selvagem vale como qualquer Carta de Gato, então o guia aceita 2 Gatos Selvagens como par (ou um Gato Selvagem com qualquer Carta de Gato). Ele nunca completa par de cartas que não sejam de gato."), "c2"],
      [t("Does drawing count while you take several turns?", "A compra conta quando você tem vários turnos?"), t("Yes: each turn you are forced to take is a full turn (play-or-pass, then draw), and each draw can be a Kitten.", "Sim: cada turno obrigatório é um turno completo (jogar-ou-passar, depois comprar), e cada compra pode ser um Gatinho."), "c2"],
      state.streaking ? [t("Streaking with the Party Pack", "Streaking com o Party Pack"), t("The Streaking sheet's “4 Kittens, 6 Defuses” and its 2–3-player Defuse cap were written for the original 56-card deck. The guide picks the Party Pack cards by player count first, then follows the Streaking steps; all 14 expansion cards go in at any player count.", "As quantidades “4 Gatinhos, 6 Desarmar” da folha de Streaking e o limite de Desarmar para 2–3 jogadores foram escritos para o baralho original de 56 cartas. O guia escolhe primeiro as cartas do Party Pack pelo número de jogadores e depois segue os passos de Streaking; as 14 cartas da expansão entram com qualquer número de jogadores."), "s1"] : null,
      state.streaking ? [t("Holding a Kitten: show it?", "Segurando um Gatinho: mostra?"), t("Normally a drawn Kitten must be shown. The Streaking Kitten lets you hold one “secretly”, so the guide keeps it hidden; you may still Defuse it instead. A second Kitten drawn must be dealt with normally.", "Normalmente o Gatinho comprado precisa ser mostrado. O Gatinho Pelado deixa segurar um “em segredo”, então o guia o mantém escondido; você ainda pode desarmá-lo. Um segundo Gatinho comprado é tratado normalmente."), "s2"] : null,
      state.streaking ? [t("Can a blind player play a Nope?", "Jogador cego pode jogar Nope?"), t("The sheet only describes random plays on the blind player's own turn. The guide's reading: a blind player cannot look for a Nope to play out of turn.", "A folha só descreve jogadas ao acaso no turno do próprio jogador cego. Leitura do guia: o jogador cego não pode procurar um Nope para jogar fora do turno."), "s2"] : null,
      state.streaking ? [t("Blind: do I hold a Streaking Kitten?", "Cego: eu tenho um Gatinho Pelado?"), t("The sheet does not say how a blind player knows whether a Streaking Kitten is among their face-down cards. The guide's reading: when a blind player draws a Kitten, they may secretly check their cards for a Streaking Kitten, then shuffle them face down again.", "A folha não diz como um jogador cego sabe se tem um Gatinho Pelado entre as cartas viradas para baixo. Leitura do guia: quando um jogador cego compra um Gatinho, pode conferir em segredo se tem um Gatinho Pelado e depois embaralhar as cartas viradas para baixo de novo."), "s2"] : null,
      state.faster ? [t("Faster game: which deck?", "Jogo mais rápido: qual baralho?"), t("“Before inserting any Kittens, remove about a third of the deck”: the guide applies it to the cards left after the hands are dealt.", "“Antes de pôr os Gatinhos, remova cerca de um terço do baralho”: o guia aplica isso às cartas que sobram depois de dar as mãos."), "s1"] : null,
      state.language === "en-US" ? null : [t("Card names in Portuguese", "Nomes das cartas em português"), t("The cards are printed in English; the Portuguese names in this guide are translations, with the printed title in brackets.", "As cartas são impressas em inglês; os nomes em português deste guia são traduções, com o título impresso entre parênteses."), "c2"]
    ].filter(Boolean);
    return `
      ${sectionHeading("faq", t("Guide's readings", "Leituras do guia"), ["c2", ...(state.streaking ? ["s1", "s2"] : [])])}
      <p class="glossary-intro">${t("Where the rules sheets are silent or were written for another edition, this guide states its own reading, labelled as such.", "Onde as folhas de regras são omissas ou foram escritas para outra edição, este guia dá a sua própria leitura, identificada como tal.")}</p>
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
      { term: ["Draw Pile", "Pilha de Compra"], text: ["The face-down deck in the middle of the table; drawing its top card ends your turn.", "O baralho virado para baixo no meio da mesa; comprar a carta do topo termina o turno."], code: "c1" },
      { term: ["Discard Pile", "Pilha de Descarte"], text: ["Face-up pile next to the Draw Pile; every played card goes here.", "Pilha virada para cima ao lado da Pilha de Compra; toda carta jogada vai para cá."], code: "c1" },
      { term: ["Explode", "Explodir"], text: ["Drawing an Exploding Kitten without a Defuse: you lose and discard your hand.", "Comprar um Gatinho Explosivo sem Desarmar: você perde e descarta a mão."], code: "c2" },
      { term: ["Paw print", "Pegada"], text: ["Symbol in a card's corner that sorts the deck by player count.", "Símbolo no canto da carta que separa o baralho pelo número de jogadores."], code: "c1" },
      { term: ["Cat Card", "Carta de Gato"], text: ["A powerless card (5 kinds); used in pairs and combos.", "Carta sem poder (5 tipos); usada em pares e combos."], code: "c2" },
      { term: ["Pair", "Par"], text: ["2 cards with the same title played together to steal a random card.", "2 cartas de mesmo título jogadas juntas para roubar uma carta ao acaso."], code: "c2" },
      { term: ["Noped", "Anulada (Noped)"], text: ["A card cancelled by a Nope; it stays in the Discard Pile with no effect.", "Carta cancelada por um Nope; fica na Pilha de Descarte sem efeito."], code: "c2" },
      { term: ["Yup", "Yup"], text: ["A Nope played on a Nope: the original action happens after all.", "Um Nope jogado sobre outro Nope: a ação original acontece afinal."], code: "c2" },
      { term: ["Title", "Título"], text: ["The card's name; combos need matching or different titles.", "O nome da carta; combos pedem títulos iguais ou diferentes."], code: "c2" },
      state.streaking ? { term: ["Blind", "Cego"], text: ["Your cards lie face down; you play them at random until you draw safely.", "Suas cartas ficam viradas para baixo; você as joga ao acaso até comprar com segurança."], code: "s2" } : null,
      state.streaking ? { term: ["Marked card", "Carta marcada"], text: ["A card in a hand turned to face the other players.", "Carta numa mão virada para os outros jogadores."], code: "s2" } : null
    ].filter(Boolean);
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), ["c1", "c2"])}
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
    document.body.classList.add("theme-exploding-kittens");
    document.documentElement.lang = state.language;
    document.title = t("Exploding Kittens — Field Manual", "Exploding Kittens — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Exploding Kittens (Party Pack, 2–10 players) and the Streaking Kittens expansion: deck setup by player count, turns, every card, Nope, combos and blind play.",
        "Regras interativas bilíngues de Exploding Kittens (Party Pack, 2–10 jogadores) e da expansão Streaking Kittens: preparação do baralho por número de jogadores, turnos, todas as cartas, Nope, combos e jogo às cegas."
      );
    }
    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook", "Livro interativo")}</p>
          <h1>Exploding Kittens</h1>
          <p class="hero-intro">${t(
            "A kitty-powered version of Russian roulette. Draw cards until someone draws an Exploding Kitten — then they explode, unless they can play a Defuse. Everything else in the deck helps you dodge, peek or push the danger onto your friends.",
            "Uma roleta-russa movida a gatinhos. Comprem cartas até alguém pegar um Gatinho Explosivo — e explodir, a menos que consiga desarmá-lo. Todo o resto do baralho ajuda a desviar, espiar o futuro ou empurrar o perigo para os amigos."
          )}</p>
          <div class="hero-meta"><span>${t("2–10 players (Party Pack)", "2–10 jogadores (Party Pack)")}</span><span>15 min</span><span>${t("Push-your-luck card game", "Jogo de cartas de risco")}</span>${state.streaking ? "<span>+ Streaking Kittens</span>" : ""}</div>
        </div>
        <figure class="hero-map"><img src="assets/covers/exploding-kittens.webp" alt="${t("First page of the Exploding Kittens Party Pack rules sheet", "Primeira página da folha de regras do Exploding Kittens Party Pack")}" fetchpriority="high"><figcaption>${t("Rules sheet, page 1", "Folha de regras, página 1")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("Field guide", "Guia de campo")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column ek-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied Exploding Kittens Party Pack rules sheet (122 cards, 2–10 players) and the Streaking Kittens expansion sheet (15 cards). Not supplied: the Imploding Kittens expansion (mentioned on the Streaking sheet) and the original 56-card edition's rules. Each card also prints its own text. Points marked “Guide's reading” are interpretations where the sheets are silent.",
            "Este guia cobre a folha de regras do Exploding Kittens Party Pack fornecida (122 cartas, 2–10 jogadores) e a folha da expansão Streaking Kittens (15 cartas). Não fornecido: a expansão Imploding Kittens (citada na folha de Streaking) e as regras da edição original de 56 cartas. Cada carta também traz o próprio texto impresso. Trechos marcados como “Leitura do guia” são interpretações onde as folhas são omissas."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${howItWorksSection()}</section>
          <section class="rule-section">${turnSection()}</section>
          <section class="rule-section">${cardsSection()}</section>
          <section class="rule-section">${combosSection()}</section>
          ${state.streaking ? `<section class="rule-section">${streakingSection()}</section>` : ""}
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${tipsSection()}</section>
          <section class="rule-section">${faqSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal, non-commercial companion guide based on the Exploding Kittens Party Pack and Streaking Kittens rules sheets (Exploding Kittens, 2018), by Elan Lee, Matthew Inman and Shane Small. Rules are paraphrased; pictures are cut from the supplied sheets for reference.",
        "Guia pessoal e não comercial de consulta baseado nas folhas de regras do Exploding Kittens Party Pack e de Streaking Kittens (Exploding Kittens, 2018), de Elan Lee, Matthew Inman e Shane Small. As regras são parafraseadas; as imagens foram recortadas das folhas fornecidas para referência."
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
      root.querySelector(".ek-page")?.prepend(notice);
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
      if (PLAYER_COUNTS.includes(value) && value !== state.players) {
        applyMatchChange({ players: value });
      }
      return;
    }
    if (target.hasAttribute("data-streaking")) {
      applyMatchChange({ streaking: target.getAttribute("data-streaking") === "yes" });
      return;
    }
    if (target.hasAttribute("data-faster")) {
      applyMatchChange({ faster: target.getAttribute("data-faster") === "yes" });
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

  window.ExplodingKittens = { renderInto, onClick, onChange };
})();
