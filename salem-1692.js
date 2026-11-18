(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.salem-1692.v1";
  const SETUP_KEY = "field-manual.salem-1692.setup.v1";
  const MANUAL_FILE = "salem-1692_core.pdf";
  const ASSETS = "assets/salem-1692/";
  const ICONS = `${ASSETS}icons/`;
  const ART = `${ASSETS}art/`;
  const PORTRAITS = `${ASSETS}portraits/`;
  // The supplied rulebook (Facade Games, Kickstarter edition 2015) has 20 pages with a text layer;
  // printed page numbers match the PDF pages. p. 2 overview & contents, p. 3–5 set up (Tryal table on
  // p. 3, Dawn on p. 4–5), p. 5–6 turn, card colours, dying, game end, p. 7 Conspiracy, p. 8–9 Night,
  // p. 9–10 the 5 Laws, p. 10–11 Moderator script, p. 11–13 Nitty Gritties, p. 14 advanced rules & tips,
  // p. 15–17 history of the 15 characters (portraits), p. 18–20 credits and back cover.
  // No expansions. The rulebook does NOT print the text of the playing cards or the Town Hall abilities;
  // the guide says to read them on the cards and only repeats the rulebook's clarifications.
  // Hidden roles: this guide never asks for, shows or stores who holds a Witch or Constable card.
  const PLAYERS = [4, 5, 6, 7, 8, 9, 10, 11, 12];
  const FACILITATORS = ["crier", "moderator"];
  const TOWN_HALL = ["one", "choose"];
  const WITCHES = ["standard", "extra"];
  const CONSPIRACY = ["standard", "shuffle"];
  const DEATHS = ["reveal", "silent"];
  const SHORT_GAMES = ["off", "on"];
  // Rules p. 3: [Not a Witch, Witch] per player count; always 1 Constable.
  const TRYAL = {
    4: [18, 1], 5: [23, 1], 6: [27, 2], 7: [32, 2], 8: [29, 2], 9: [33, 2], 10: [27, 2], 11: [30, 2], 12: [33, 2]
  };
  const TRYAL_EACH = Object.fromEntries(Object.entries(TRYAL).map(([p, [n, w]]) => [p, (n + w + 1) / Number(p)]));
  const defaults = {
    language: "pt-BR", players: 6, facilitator: "crier", townHall: "one",
    witches: "standard", conspiracy: "standard", deaths: "reveal", shortGames: "off"
  };
  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------

  function pick(list, value, fallback) {
    return list.includes(value) ? value : fallback;
  }

  function normalizePreferences(saved) {
    const players = Number(saved?.players);
    const next = {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      players: PLAYERS.includes(players) ? players : defaults.players,
      facilitator: pick(FACILITATORS, saved?.facilitator, defaults.facilitator),
      townHall: pick(TOWN_HALL, saved?.townHall, defaults.townHall),
      witches: pick(WITCHES, saved?.witches, defaults.witches),
      conspiracy: pick(CONSPIRACY, saved?.conspiracy, defaults.conspiracy),
      deaths: pick(DEATHS, saved?.deaths, defaults.deaths),
      shortGames: pick(SHORT_GAMES, saved?.shortGames, defaults.shortGames)
    };
    // Choosing 1 of 2 Town Hall cards is only allowed with 7 or fewer players (rules p. 4).
    if (next.players > 7) {
      next.townHall = "one";
    }
    // "Avoid extra-short games" needs 4 or 5 Tryal cards; with 10–12 players everyone holds 3.
    if (TRYAL_EACH[next.players] < 4) {
      next.shortGames = "off";
    }
    return next;
  }

  function signature(source = state) {
    return `p${source.players}-${source.facilitator}-${source.townHall}-${source.witches}`;
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Salem 1692 preferences.", error);
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
      console.error("Could not read Salem 1692 setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Salem 1692 preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Salem 1692 setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function manualUrl(page) {
    const script = document.querySelector('script[src*="salem-1692.js"]');
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
          <p class="eyebrow">${t("SALEM, MASSACHUSETTS", "SALEM, MASSACHUSETTS")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="sl-section-references">${pages.map(referenceLink).join("")}</div>
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

  function figure(file, alt) {
    return `<figure class="sl-art"><img src="${ART}${file}.webp" alt="${alt}" loading="lazy"><figcaption>${alt}</figcaption></figure>`;
  }

  function interpretation(en, pt) {
    return `<span class="sl-interpretation">${t("Guide's reading", "Leitura do guia")}</span> ${t(en, pt)}`;
  }

  function crier() {
    return state.facilitator === "crier";
  }

  function tryal(players = state.players, witches = state.witches) {
    const [notWitch, baseWitch] = TRYAL[players];
    const total = notWitch + baseWitch + 1;
    const witch = witches === "extra" ? (players <= 5 ? 2 : 3) : baseWitch;
    return { notWitch: notWitch - (witch - baseWitch), witch, constable: 1, total, each: total / players, swapped: witch - baseWitch };
  }

  function playersLabel(players = state.players) {
    return t(`${players} players`, `${players} jogadores`);
  }

  function facilitatorName(value = state.facilitator) {
    return value === "crier" ? t("Town Crier (a player)", "Pregoeiro (Town Crier, um jogador)") : t("Moderator (not a player)", "Moderador (não joga)");
  }

  function townHallName(value = state.townHall) {
    return value === "one" ? t("Deal 1 Town Hall card each", "1 carta de Prefeitura para cada um") : t("Deal 2, keep 1", "Receba 2, fique com 1");
  }

  function witchesName(value = state.witches) {
    return value === "standard" ? t("Standard Witch count", "Número padrão de Bruxas") : t("Extra Witches (harder)", "Bruxas extras (mais difícil)");
  }

  // ---------- characters (rules p. 15–17; clarifications p. 12–13) ----------

  const CHARACTERS = [
    { id: "abigail-williams", name: "Abigail Williams", role: ["Child", "Criança"], age: 11, page: 15,
      history: ["Niece of Samuel Parris and one of the first girls to accuse others; she first accused Sarah Good and Tituba.", "Sobrinha de Samuel Parris e uma das primeiras meninas a acusar outros; acusou primeiro Sarah Good e Tituba."] },
    { id: "ann-putnam", name: "Ann Putnam", role: ["School Girl", "Estudante"], age: 13, page: 15,
      history: ["From the powerful Putnam family, one of the first accusers; she publicly apologized in 1706.", "Da poderosa família Putnam, uma das primeiras acusadoras; pediu desculpas publicamente em 1706."] },
    { id: "cotton-mather", name: "Cotton Mather", role: ["Minister", "Ministro"], age: 29, page: 15,
      history: ["A prominent New England minister blamed for allowing “spectral evidence”.", "Ministro proeminente da Nova Inglaterra, culpado por permitir a “prova espectral”."],
      notes: [["Evidence cards are tied to his ability: if Martha Corey has been using Cotton Mather's ability and Cotton Mather dies, Evidence cards immediately count as three against Martha, even those already in front of her.", "As cartas Evidence (Prova) estão ligadas à habilidade dele: se Martha Corey estava usando a habilidade de Cotton Mather e Cotton Mather morre, as cartas Evidence passam a contar imediatamente como três contra Martha, mesmo as que já estão na frente dela."]] },
    { id: "giles-corey", name: "Giles Corey", role: ["Landowner", "Proprietário de terras"], age: 71, page: 15,
      history: ["Accused with his wife Martha; he refused to confess or deny and was pressed to death.", "Acusado junto com a esposa Martha; recusou-se a confessar ou negar e morreu esmagado por pedras."] },
    { id: "george-burroughs", name: "George Burroughs", role: ["Strongman", "Homem forte"], age: 40, page: 16,
      history: ["A clergyman whose feats of strength seemed devilish; he recited the Lord's Prayer while being hanged.", "Um clérigo cujas proezas de força pareciam diabólicas; recitou o Pai-Nosso enquanto era enforcado."],
      notes: [["If Thomas Danforth plays accusations on George Burroughs, Thomas needs 7 accusations to reveal one of George's Tryal cards.", "Se Thomas Danforth joga acusações em George Burroughs, Thomas precisa de 7 acusações para revelar uma das cartas Tryal de George."]] },
    { id: "john-proctor", name: "John Proctor", role: ["Farmer", "Fazendeiro"], age: 60, page: 16,
      history: ["A respected man who defended his accused wife Elizabeth; he was hanged in August 1692.", "Um homem respeitado que defendeu a esposa Elizabeth, acusada; foi enforcado em agosto de 1692."],
      notes: [["His ability gives him cards from a dead player. If Martha Corey has inherited John's ability, Martha and John look at the cards they will receive from the dead player and take turns picking cards, starting with John.", "A habilidade dele lhe dá cartas de um jogador morto. Se Martha Corey herdou a habilidade de John, Martha e John olham as cartas que vão receber do jogador morto e se revezam escolhendo cartas, começando por John."]] },
    { id: "martha-corey", name: "Martha Corey", role: ["Seamstress", "Costureira"], age: 72, page: 16,
      history: ["A pious critic of the trials, married to Giles; hanged in September 1692.", "Fiel devota e crítica dos julgamentos, casada com Giles; enforcada em setembro de 1692."],
      notes: [
        ["Her ability lets her inherit / use another character's special ability — read on her card exactly when.", "A habilidade dela permite herdar / usar a habilidade especial de outro personagem — leia na carta exatamente quando."],
        ["With John Proctor's ability: John and Martha look at the dead player's cards and take turns picking, John first.", "Com a habilidade de John Proctor: John e Martha olham as cartas do jogador morto e se revezam escolhendo, John primeiro."],
        ["With Cotton Mather's ability: if Cotton Mather dies, Evidence cards immediately count as three against Martha, even those already in front of her.", "Com a habilidade de Cotton Mather: se Cotton Mather morre, as cartas Evidence passam a contar imediatamente como três contra Martha, mesmo as que já estão na frente dela."]
      ] },
    { id: "mary-warren", name: "Mary Warren", role: ["Servant", "Criada"], age: 17, page: 16,
      history: ["Servant of the Proctors who claimed to see Giles Corey's ghost; she confessed but was never hanged.", "Criada dos Proctor, dizia ver o fantasma de Giles Corey; confessou, mas nunca foi enforcada."],
      notes: [["Mary is unaffected by Matchmaker — but a player matched with Mary still dies when she dies.", "Mary não é afetada pela Matchmaker (Casamenteira) — mas um jogador ligado a Mary ainda morre quando ela morre."]] },
    { id: "rebecca-nurse", name: "Rebecca Nurse", role: ["Housewife", "Dona de casa"], age: 71, page: 16,
      history: ["One of the oldest and most respected accused; 39 neighbours petitioned for her release.", "Uma das acusadas mais velhas e respeitadas; 39 vizinhos assinaram um pedido pela sua soltura."] },
    { id: "samuel-parris", name: "Samuel Parris", role: ["Pastor", "Pastor"], age: 39, page: 17,
      history: ["Salem's main pastor, whose hunt for “iniquitous behavior” fed the tense atmosphere.", "O pastor principal de Salem, cuja caça ao “comportamento iníquo” alimentou o clima tenso."] },
    { id: "sarah-good", name: "Sarah Good", role: ["Beggar", "Mendiga"], age: 39, page: 17,
      history: ["A homeless beggar, perhaps accused for her poor reputation; hanged in July 1692.", "Uma mendiga sem teto, talvez acusada pela má reputação; enforcada em julho de 1692."] },
    { id: "thomas-danforth", name: "Thomas Danforth", role: ["Judge", "Juiz"], age: 69, page: 17,
      history: ["A judge at many of the trials who disapproved of them and may have helped end them.", "Juiz de muitos julgamentos, que os desaprovava e talvez tenha ajudado a encerrá-los."],
      notes: [["Playing accusations on George Burroughs, Thomas needs 7 accusations to reveal one of George's Tryal cards.", "Jogando acusações em George Burroughs, Thomas precisa de 7 acusações para revelar uma das cartas Tryal de George."]] },
    { id: "tituba", name: "Tituba", role: ["Storyteller", "Contadora de histórias"], age: 35, page: 17,
      history: ["Enslaved by Samuel Parris and the first person accused; she confessed and was eventually released.", "Escravizada por Samuel Parris e a primeira pessoa acusada; confessou e acabou sendo libertada."],
      notes: [
        ["Tituba's ability rearranges the deck. She may rearrange the deck and draw cards in the same turn.", "A habilidade de Tituba reorganiza o baralho. Ela pode reorganizar o baralho e comprar cartas no mesmo turno."],
        ["She is allowed to move the Night card. If she does, Night happens when it is drawn; when the deck runs out of cards, reshuffle it, placing Night at the bottom.", "Ela pode mover a carta Night (Noite). Se fizer isso, a Noite acontece quando ela for comprada; quando o baralho acabar, reembaralhe-o, pondo a Noite no fundo."]
      ] },
    { id: "will-griggs", name: "Will Griggs", role: ["Physician", "Médico"], age: 47, page: 17,
      history: ["Diagnosed witches and how “big” a witch someone was before sending them to trial.", "Diagnosticava bruxas e o “tamanho” da bruxa antes de mandar a pessoa a julgamento."],
      notes: [["Will Griggs can use an Alibi as a Witness card — even against the player with Piety.", "Will Griggs pode usar um Alibi (Álibi) como carta Witness (Testemunha) — até contra o jogador com Piety (Piedade)."]] },
    { id: "william-phips", name: "William Phips", role: ["Governor", "Governador"], age: 42, page: 17,
      history: ["A shipbuilder turned first royal Governor of Massachusetts Bay; he set up and later disbanded the witch court.", "Construtor de navios que virou o primeiro Governador real da Baía de Massachusetts; criou e depois dissolveu o tribunal das bruxas."] }
  ];

  // ---------- sections ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["victory", t("Teams, death & winning", "Times, morte e vitória")],
      ["turn", t("Your turn", "Seu turno")],
      ["cards", t("Cards & accusations", "Cartas e acusações")],
      ["conspiracy", t("Conspiracy", "Conspiração")],
      ["night", t("Night", "Noite")],
      ["laws", t("The 5 Laws", "As 5 Leis")],
      ["characters", t("Town Hall characters", "Personagens da Prefeitura")],
      ["rulings", t("Nitty Gritties", "Detalhes")],
      ["advanced", t("Advanced rules & tips", "Regras avançadas e dicas")],
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
          <span class="brand-mark" aria-hidden="true">SL</span>
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
      <label class="sl-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" ${dataAttr} ${checked ? "checked" : ""}>
        <span class="sl-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function playerChoiceText(players) {
    const info = tryal(players, "standard");
    return t(
      `Tryal cards: ${info.notWitch} Not a Witch + ${info.witch} Witch + 1 Constable = ${info.total}, so ${info.each} per player.${players > 7 ? " Town Hall: 1 card each only." : ""}`,
      `Cartas Tryal: ${info.notWitch} Not a Witch + ${info.witch} Witch + 1 Constable = ${info.total}, ou seja, ${info.each} por jogador.${players > 7 ? " Prefeitura: só 1 carta cada." : ""}`
    );
  }

  function yesNoGroup(key, attr, title, selectedName, intro, options) {
    return `
      <fieldset class="sl-choice-group">
        <legend>${title} · ${t("selected:", "selecionado:")} <span>${selectedName}</span></legend>
        <p class="sl-choice-intro">${intro}</p>
        <div class="sl-choice-grid">
          ${options.map(([value, name, text]) => choiceCard(`sl-${key}`, value, `data-${attr}="${value}"`, state[key] === value, name, text)).join("")}
        </div>
      </fieldset>`;
  }

  function matchConfiguration() {
    return `
      <section class="controls-panel sl-config" id="build-match" aria-labelledby="sl-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="sl-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "The supplied rulebook has no expansions. Choose the number of players, who runs the Dawn and the Nights, how Town Hall cards are dealt and which of the rulebook's advanced rules you use. Changing the players, the Night facilitator, the Town Hall deal or the Witch count clears the setup checklist; the other advanced rules and the language do not. Nothing secret is asked or stored here.",
              "O livro de regras fornecido não tem expansões. Escolha o número de jogadores, quem conduz a Alvorada e as Noites, como as cartas da Prefeitura são distribuídas e quais regras avançadas do livro você usa. Mudar os jogadores, quem conduz a Noite, a distribuição da Prefeitura ou o número de Bruxas limpa a lista da preparação; as outras regras avançadas e o idioma não. Nada secreto é perguntado ou salvo aqui."
            )}</p>
          </div>
        </div>
        <fieldset class="sl-choice-group">
          <legend>${t("Players · selected:", "Jogadores · selecionado:")} <span>${playersLabel()}</span></legend>
          <p class="sl-choice-intro">${t("Count only the people who hold Tryal cards. A Moderator is not a player.", "Conte só quem recebe cartas Tryal. Um Moderador não é jogador.")} ${referenceLink(3)}</p>
          <div class="sl-choice-grid sl-choice-grid-players">
            ${PLAYERS.map((players) => choiceCard("sl-players", players, `data-players="${players}"`, state.players === players, playersLabel(players), playerChoiceText(players))).join("")}
          </div>
        </fieldset>
        ${yesNoGroup("facilitator", "facilitator", t("Dawn & Night", "Alvorada e Noite"), facilitatorName(),
          `${t("Setup step 1. Changes the Kill cards and how the Dawn and every Night are run.", "Passo 1 da preparação. Muda as cartas Kill e como a Alvorada e cada Noite são conduzidas.")} ${referenceLink(3)} ${referenceLink(8)}`, [
            ["crier", facilitatorName("crier"), t("The most experienced Salem player plays normally and also calls out the Dawn and Night steps with eyes closed. The Kill cards matching the Town Hall characters in play are used: the Witches pick one silently at Night.", "O jogador mais experiente de Salem joga normalmente e também anuncia os passos da Alvorada e da Noite de olhos fechados. Usam-se as cartas Kill (Morte) dos personagens da Prefeitura em jogo: as Bruxas escolhem uma em silêncio à Noite.")],
            ["moderator", facilitatorName("moderator"), t("Recommended for a new group, a large group or when someone wants to sit out: a non-player reads the Moderator script with eyes open and sees who the Witches and the Constable point to. All Kill cards stay in the box.", "Recomendado para um grupo novo, um grupo grande ou quando alguém quer ficar de fora: alguém que não joga lê o roteiro do Moderador de olhos abertos e vê para quem as Bruxas e o Delegado apontam. Todas as cartas Kill ficam na caixa.")]
          ])}
        ${state.players <= 7 ? yesNoGroup("townHall", "townhall", t("Town Hall cards", "Cartas da Prefeitura"), townHallName(),
          `${t("Setup step 3. Only with 7 or fewer players may you deal two.", "Passo 3 da preparação. Só com 7 jogadores ou menos é possível distribuir duas.")} ${referenceLink(4)}`, [
            ["one", townHallName("one"), t("Shuffle the 15 Town Hall cards and deal 1 face up to each player: that is your character.", "Embaralhe as 15 cartas da Prefeitura e dê 1 virada para cima a cada jogador: esse é o seu personagem.")],
            ["choose", townHallName("choose"), t(`Deal 2 to each player (${state.players * 2} cards); each keeps 1 character and puts the other back in the box.`, `Dê 2 a cada jogador (${state.players * 2} cartas); cada um fica com 1 personagem e devolve a outra à caixa.`)]
          ]) : `<p class="sl-choice-intro">${t("Town Hall cards: with 8 or more players each player gets exactly 1 (choosing 1 of 2 is only for 7 or fewer).", "Cartas da Prefeitura: com 8 ou mais jogadores cada um recebe exatamente 1 (escolher 1 de 2 é só para 7 ou menos).")} ${referenceLink(4)}</p>`}
        ${yesNoGroup("witches", "witches", t("Advanced · Witch cards", "Avançado · cartas Witch"), witchesName(),
          `${t("Advanced rule “to make the game more difficult”. Changes the Tryal cards you deal.", "Regra avançada “para deixar o jogo mais difícil”. Muda as cartas Tryal distribuídas.")} ${referenceLink(14)}`, [
            ["standard", witchesName("standard"), t(`The table on p. 3: ${tryal(state.players, "standard").witch} Witch card(s) with ${playersLabel()}.`, `A tabela da p. 3: ${tryal(state.players, "standard").witch} carta(s) Witch com ${playersLabel()}.`)],
            ["extra", witchesName("extra"), t(`Use 2 Witch cards with 4–5 players or 3 with 6–12 players: here ${tryal(state.players, "extra").witch}. The guide swaps out ${tryal(state.players, "extra").swapped} Not a Witch card so everyone still gets ${tryal().each} Tryal cards.`, `Use 2 cartas Witch com 4–5 jogadores ou 3 com 6–12 jogadores: aqui ${tryal(state.players, "extra").witch}. O guia tira ${tryal(state.players, "extra").swapped} carta Not a Witch para que todos continuem recebendo ${tryal().each} cartas Tryal.`)]
          ])}
        ${yesNoGroup("conspiracy", "conspiracy", t("Advanced · Conspiracy", "Avançado · Conspiração"), state.conspiracy === "standard" ? t("Take from your left", "Pegue da esquerda") : t("Shuffle and redeal", "Embaralhe e redistribua"),
          `${t("Advanced rule “to make the game more difficult”. Does not change the setup.", "Regra avançada “para deixar o jogo mais difícil”. Não muda a preparação.")} ${referenceLink(14)}`, [
            ["standard", t("Take from your left", "Pegue da esquerda"), t("When Conspiracy is drawn, everyone simultaneously takes 1 unrevealed Tryal card from the player on their left.", "Quando a Conspiração é comprada, todos pegam ao mesmo tempo 1 carta Tryal não revelada do jogador à esquerda.")],
            ["shuffle", t("Shuffle and redeal", "Embaralhe e redistribua"), t(`Everyone takes 1 unrevealed Tryal card from the player on their left and puts it in the middle; the ${crier() ? "Town Crier" : "Moderator"} shuffles them and deals 1 back to each player. Harder to track where the Witch cards went.`, `Todos pegam 1 carta Tryal não revelada do jogador à esquerda e a põem no meio; o ${crier() ? "Pregoeiro" : "Moderador"} as embaralha e devolve 1 a cada jogador. Fica mais difícil rastrear para onde foram as cartas Witch.`)]
          ])}
        ${yesNoGroup("deaths", "deaths", t("Advanced · Dying", "Avançado · Morte"), state.deaths === "reveal" ? t("Dead players tell", "Mortos contam") : t("Silent deaths", "Mortes silenciosas"),
          `${t("Advanced rule “to make the game more difficult”. Does not change the setup.", "Regra avançada “para deixar o jogo mais difícil”. Não muda a preparação.")} ${referenceLink(6)} ${referenceLink(14)}`, [
            ["reveal", t("Dead players tell", "Mortos contam"), t("Standard: a dying player reveals all their Tryal cards and truthfully says whether they ever had a Witch card.", "Padrão: quem morre revela todas as suas cartas Tryal e diz a verdade sobre já ter tido uma carta Witch.")],
            ["silent", t("Silent deaths", "Mortes silenciosas"), t("A dying player still reveals their Tryal cards but does not say whether they ever had a Witch card.", "Quem morre ainda revela as cartas Tryal, mas não diz se já teve uma carta Witch.")]
          ])}
        ${TRYAL_EACH[state.players] < 4 ? `<p class="sl-choice-intro">${t("Advanced · Avoid extra-short games: not available — with 10–12 players everyone starts with 3 Tryal cards, and the rule only applies to players with 4 or 5.", "Avançado · Evitar partidas muito curtas: indisponível — com 10–12 jogadores todos começam com 3 cartas Tryal, e a regra só vale para quem tem 4 ou 5.")} ${referenceLink(14)}</p>` : yesNoGroup("shortGames", "short", t("Advanced · Avoid extra-short games", "Avançado · Evitar partidas muito curtas"), state.shortGames === "on" ? t("Point to two", "Aponte para duas") : t("Off", "Desligada"),
          `${t("Advanced rule. Does not change the setup.", "Regra avançada. Não muda a preparação.")} ${referenceLink(14)}`, [
            ["off", t("Off", "Desligada"), t("Whoever reveals one of your Tryal cards chooses which one.", "Quem revela uma das suas cartas Tryal escolhe qual.")],
            ["on", t("Point to two", "Aponte para duas"), t("While a player has 4 or 5 Tryal cards left, the revealer points to two of them and the accused player chooses which of the two to flip.", "Enquanto um jogador tiver 4 ou 5 cartas Tryal restantes, quem revela aponta para duas delas e o acusado escolhe qual das duas virar.")]
          ])}
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function dawnItems() {
    if (crier()) {
      return [
        t("Dawn happens only once, at the very beginning of the game: the Witches secretly give the Black Cat card to any player — even to themselves.", "A Alvorada acontece só uma vez, bem no começo da partida: as Bruxas dão em segredo a carta Black Cat (Gato Preto) a qualquer jogador — até a si mesmas."),
        t("The Town Crier places the Black Cat face up and sideways on top of the playing deck (so it is easy to grab) and tells all players to close their eyes.", "O Pregoeiro põe o Black Cat virado para cima e atravessado sobre o baralho de jogo (para ser fácil de pegar) e manda todos fecharem os olhos."),
        t("The Town Crier tells anyone with a Witch card to open their eyes and place the Black Cat next to any player. The Town Crier keeps their own eyes closed unless they are a Witch. The Witches now know each other.", "O Pregoeiro manda quem tem carta Witch abrir os olhos e colocar o Black Cat ao lado de qualquer jogador. O Pregoeiro fica de olhos fechados, a menos que seja Bruxa. As Bruxas agora se conhecem."),
        t("The Town Crier counts down slowly from 10, tells the Witches to close their eyes, then tells everyone to open their eyes.", "O Pregoeiro conta devagar de 10 até 0, manda as Bruxas fecharem os olhos e depois manda todos abrirem."),
        t("The player given the Black Cat puts it face up in front of their Tryal cards. That player takes the first turn.", "O jogador que recebeu o Black Cat o coloca virado para cima na frente das suas cartas Tryal. Esse jogador faz o primeiro turno."),
        t("Tip: make noise (stomp, pat the table, hum, music) while eyes are closed to mask movement.", "Dica: façam barulho (batam os pés, batam na mesa, cantarolem, música) enquanto os olhos estão fechados, para disfarçar movimentos.")
      ];
    }
    return [
      t("Dawn happens only once, at the very beginning of the game: the Witches secretly give the Black Cat card to any player — even to themselves.", "A Alvorada acontece só uma vez, bem no começo da partida: as Bruxas dão em segredo a carta Black Cat (Gato Preto) a qualquer jogador — até a si mesmas."),
      t("The Moderator reads the Dawn section of the Moderator script (see Night → Moderator script): everyone closes their eyes; the Witches open theirs and point to any player (they may point to themselves); the Moderator notes who; Witches close their eyes; everyone opens.", "O Moderador lê a parte da Alvorada do roteiro do Moderador (veja Noite → Roteiro do Moderador): todos fecham os olhos; as Bruxas abrem e apontam para qualquer jogador (podem apontar para si); o Moderador anota quem; as Bruxas fecham os olhos; todos abrem."),
      t("The Moderator places the Black Cat face up in front of the chosen player's Tryal cards. That player takes the first turn.", "O Moderador coloca o Black Cat virado para cima na frente das cartas Tryal do jogador escolhido. Esse jogador faz o primeiro turno."),
      t("Tip: make noise (stomp, pat the table, hum, music) while eyes are closed to mask movement.", "Dica: façam barulho (batam os pés, batam na mesa, cantarolem, música) enquanto os olhos estão fechados, para disfarçar movimentos.")
    ];
  }

  function setupPhases() {
    const info = tryal();
    return [
      {
        id: "facilitator",
        title: crier() ? t("Choose the Town Crier", "Escolha o Pregoeiro") : t("Choose the Moderator", "Escolha o Moderador"),
        pages: [3],
        items: crier()
          ? [
            t("Choose the most experienced Salem player as Town Crier. They play normally and also direct the closing and opening of eyes at Dawn and during every Night.", "Escolham o jogador mais experiente de Salem como Pregoeiro. Ele joga normalmente e também conduz o fechar e abrir de olhos na Alvorada e em cada Noite."),
            t("Seat everyone in a circle; play goes clockwise.", "Sentem-se em círculo; o jogo segue em sentido horário.")
          ]
          : [
            t(`Choose a Moderator who will not play: they get no cards and are not one of the ${state.players} players.`, `Escolham um Moderador que não vai jogar: ele não recebe cartas e não é um dos ${state.players} jogadores.`),
            t("Seat the players in a circle; play goes clockwise. The Moderator needs to see every player.", "Sentem os jogadores em círculo; o jogo segue em sentido horário. O Moderador precisa ver todos os jogadores.")
          ]
      },
      {
        id: "tryal",
        title: t(`Deal the Tryal cards: ${info.each} each`, `Distribua as cartas Tryal: ${info.each} para cada`),
        pages: state.witches === "extra" ? [3, 14] : [3],
        items: [
          t(`Before dealing, sort the 39 Tryal cards face up (nothing is secret yet) and take ${info.notWitch} Not a Witch, ${info.witch} Witch and 1 Constable (${info.total} cards). Return the other ${39 - info.total} to the box.`, `Antes de distribuir, separe as 39 cartas Tryal viradas para cima (nada é segredo ainda) e pegue ${info.notWitch} Not a Witch (Não é Bruxa), ${info.witch} Witch (Bruxa) e 1 Constable (Delegado) (${info.total} cartas). Devolva as outras ${39 - info.total} à caixa.`),
          state.witches === "extra" ? interpretation(`the rulebook only says to use ${info.witch} Witch cards; to keep ${info.each} cards each, ${info.swapped} Not a Witch card is left out in exchange.`, `o livro só diz para usar ${info.witch} cartas Witch; para manter ${info.each} cartas por jogador, ${info.swapped} carta Not a Witch fica de fora em troca.`) : "",
          t(`Shuffle them and deal ${info.each} face down to each player.`, `Embaralhe-as e dê ${info.each} viradas para baixo a cada jogador.`),
          t("Secret: look at your own Tryal cards discreetly, then place them face down in a row in front of you. Never show them.", "Segredo: olhe as suas cartas Tryal discretamente e coloque-as viradas para baixo em fila à sua frente. Nunca as mostre."),
          t("A Witch card makes you a Witch for the rest of the game. The Constable card makes you the Constable, who tries to save someone at Night. You can be both.", "Uma carta Witch faz de você Bruxa pelo resto da partida. A carta Constable faz de você o Delegado, que tenta salvar alguém à Noite. Você pode ser os dois.")
        ].filter(Boolean),
        art: ["tryal-row", t("Rules p. 6: a row of Tryal cards — the red Tryal of Witchcraft backs and revealed Not a Witch and Witch faces", "Regras p. 6: uma fila de cartas Tryal — os versos vermelhos “Tryal of Witchcraft” e as faces reveladas Not a Witch e Witch")]
      },
      {
        id: "town-hall",
        title: t("Deal the Town Hall characters", "Distribua os personagens da Prefeitura"),
        pages: [4],
        items: state.townHall === "choose"
          ? [
            t(`Shuffle the 15 Town Hall cards and deal 2 to each player (${state.players * 2}). Each player keeps 1 and puts the other back in the box; return the undealt ones too.`, `Embaralhe as 15 cartas da Prefeitura e dê 2 a cada jogador (${state.players * 2}). Cada jogador fica com 1 e devolve a outra à caixa; devolva também as não distribuídas.`),
            t("Place your character face up in front of you and read its ability aloud to the group.", "Coloque o seu personagem virado para cima à sua frente e leia a habilidade em voz alta para o grupo.")
          ]
          : [
            t(`Shuffle the 15 Town Hall cards and deal 1 to each player (${state.players}). Return the other ${15 - state.players} to the box.`, `Embaralhe as 15 cartas da Prefeitura e dê 1 a cada jogador (${state.players}). Devolva as outras ${15 - state.players} à caixa.`),
            t("Place your character face up in front of you and read its ability aloud to the group.", "Coloque o seu personagem virado para cima à sua frente e leia a habilidade em voz alta para o grupo.")
          ],
        art: ["town-hall-cards", t("Rules p. 4: a Town Hall card (Abigail Williams) and the Town Hall back", "Regras p. 4: uma carta da Prefeitura (Abigail Williams) e o verso da Prefeitura")]
      },
      {
        id: "deck",
        title: t("Prepare the playing deck and deal 3 cards", "Prepare o baralho de jogo e dê 3 cartas"),
        pages: [4],
        items: [
          t("From the 59 Salem playing cards, take out Black Cat, Night and Conspiracy.", "Das 59 cartas de jogo de Salem, retire Black Cat (Gato Preto), Night (Noite) e Conspiracy (Conspiração)."),
          t(`Shuffle the other 56 and deal 3 to each player (${state.players * 3} cards) as their hand.`, `Embaralhe as outras 56 e dê 3 a cada jogador (${state.players * 3} cartas) como mão.`),
          t("Shuffle Conspiracy back into the rest of the deck.", "Embaralhe a Conspiracy de volta no resto do baralho."),
          t("Place Night at the bottom of the deck. Put the deck face down in the middle of the table.", "Coloque a Night no fundo do baralho. Ponha o baralho virado para baixo no meio da mesa."),
          t("Set the Black Cat card aside for the Dawn.", "Deixe a carta Black Cat de lado para a Alvorada.")
        ]
      },
      {
        id: "tokens",
        title: crier() ? t("Gavel, Kill cards and timer", "Martelo, cartas Kill e ampulheta") : t("Gavel and timer", "Martelo e ampulheta"),
        pages: [4, 9],
        items: [
          t("Place the Gavel token in the middle of the table.", "Coloque o marcador Gavel (Martelo) no meio da mesa."),
          crier()
            ? t(`Take the black Kill cards that match the ${state.players} Town Hall characters in play and stack them on the table. Return the other Kill cards to the box.`, `Pegue as cartas pretas Kill (Morte) que correspondem aos ${state.players} personagens da Prefeitura em jogo e empilhe-as na mesa. Devolva as outras cartas Kill à caixa.`)
            : t("Return all 15 Kill cards to the box: the Moderator does not use them.", "Devolva as 15 cartas Kill à caixa: o Moderador não as usa."),
          t("Keep the 30-second timer (hourglass) within reach: it limits delays and the Confess window at Night.", "Deixe a ampulheta de 30 segundos ao alcance: ela limita demoras e o tempo para Confessar à Noite.")
        ]
      },
      {
        id: "dawn",
        title: t("Carry out the Dawn", "Realize a Alvorada"),
        pages: crier() ? [4, 5] : [4, 10],
        items: dawnItems()
      }
    ];
  }

  function inventory() {
    const info = tryal();
    const cards = [
      infoCard(t("TRYAL CARDS", "CARTAS TRYAL"), t(`${info.total} of 39 · ${info.each} per player`, `${info.total} de 39 · ${info.each} por jogador`), [
        rl("Not a Witch", `${info.notWitch}.`, "Not a Witch (Não é Bruxa)", `${info.notWitch}.`),
        rl("Witch", `${info.witch}.`, "Witch (Bruxa)", `${info.witch}.`),
        rl("Constable", "1.", "Constable (Delegado)", "1."),
        t("Face down in a row in front of each player; secret.", "Viradas para baixo em fila na frente de cada jogador; secretas.")
      ], [2, 3]),
      infoCard(t("TOWN HALL CARDS", "CARTAS DA PREFEITURA"), state.townHall === "choose" ? t("15 in the box · 2 dealt, keep 1", "15 na caixa · 2 distribuídas, fique com 1") : t("15 in the box · 1 per player", "15 na caixa · 1 por jogador"), [
        state.townHall === "choose" ? t(`2 dealt to each player (${state.players * 2}); each keeps 1.`, `2 para cada jogador (${state.players * 2}); cada um fica com 1.`) : t(`${state.players} dealt, 1 each.`, `${state.players} distribuídas, 1 para cada.`),
        t("Face up: your character and its ability.", "Viradas para cima: o seu personagem e a habilidade.")
      ], [2, 4]),
      infoCard(t("SALEM PLAYING CARDS", "CARTAS DE JOGO DE SALEM"), t("59 cards", "59 cartas"), [
        t(`${state.players * 3} dealt (3 per player); the rest form the deck with Conspiracy shuffled in and Night at the bottom.`, `${state.players * 3} distribuídas (3 por jogador); o resto forma o baralho com a Conspiracy embaralhada e a Night no fundo.`),
        t("Black Cat set aside for the Dawn.", "Black Cat separada para a Alvorada.")
      ], [2, 4]),
      crier()
        ? infoCard(t("KILL CARDS", "CARTAS KILL"), t(`${state.players} of 15`, `${state.players} de 15`), [
          t("One per Town Hall character in play, stacked on the table.", "Uma por personagem da Prefeitura em jogo, empilhadas na mesa.")
        ], [2, 4])
        : infoCard(t("KILL CARDS", "CARTAS KILL"), t("Not used", "Não usadas"), [
          t("All 15 stay in the box with a Moderator.", "As 15 ficam na caixa com um Moderador.")
        ], [2, 4]),
      infoCard(t("TOKEN & TIMER", "MARCADOR E AMPULHETA"), t("Gavel token · 30-second timer", "Martelo · ampulheta de 30 segundos"), [
        t("Gavel in the middle; the Constable places it at Night.", "Martelo no meio; o Delegado o coloca à Noite."),
        t("Timer: delays (Law 3) and the Confess window.", "Ampulheta: demoras (Lei 3) e o tempo para Confessar.")
      ], [2, 4])
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
        <label class="sl-setup-check" for="sl-setup-${phase.id}">
          <input id="sl-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="sl-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="sl-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
        ${phase.art ? `<div class="sl-art-row">${figure(phase.art[0], phase.art[1])}</div>` : ""}
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), sectionIndex("setup"), [3, 4, 5])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Gather the town", "Reúna a cidade")} · ${playersLabel()} · ${facilitatorName()}</h3>
            <p>${t("One checkbox per coherent step, in the rulebook's order (set up steps 1–6).", "Uma caixa por etapa coerente, na ordem do livro (passos 1–6 da preparação).")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved on this device separately from the match options. Changing the players, the Night facilitator, the Town Hall deal or the Witch count clears it; changing the language or the other advanced rules does not. “Uncheck all” clears only these setup boxes.",
          "O progresso é salvo neste aparelho separado das opções da partida. Mudar os jogadores, quem conduz a Noite, a distribuição da Prefeitura ou o número de Bruxas o limpa; trocar o idioma ou as outras regras avançadas não. “Desmarcar tudo” limpa somente estas caixas da preparação."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}
      <div class="sl-art-row">${figure("components", t("Rules p. 2: the contents — 15 Town Hall cards, 59 Salem playing cards, the 30-second timer, 15 Kill cards, 39 Tryal cards and the Gavel token", "Regras p. 2: o conteúdo — 15 cartas da Prefeitura, 59 cartas de jogo de Salem, a ampulheta de 30 segundos, 15 cartas Kill, 39 cartas Tryal e o marcador Martelo"))}</div>`;
  }

  // ---------- quick reference ----------

  function deathLine() {
    return state.deaths === "reveal"
      ? rl("Then", "discard your hand and your blue cards, reveal all your Tryal cards and truthfully say whether you ever had a Witch card.", "Depois", "descarte a mão e as suas cartas azuis, revele todas as cartas Tryal e diga a verdade sobre já ter tido uma carta Witch.")
      : rl("Then", "discard your hand and your blue cards and reveal all your Tryal cards; do not say whether you ever had a Witch card (silent deaths).", "Depois", "descarte a mão e as suas cartas azuis e revele todas as cartas Tryal; não diga se já teve uma carta Witch (mortes silenciosas).");
  }

  function revealLine() {
    return state.shortGames === "on"
      ? rl("Reveal", "whoever placed the 7th accusation picks a Tryal card of the accused and flips it. If the accused has 4 or 5 Tryal cards left, they point to two and the accused chooses which one flips.", "Revele", "quem pôs a 7ª acusação escolhe uma carta Tryal do acusado e a vira. Se o acusado tiver 4 ou 5 cartas Tryal restantes, aponta para duas e o acusado escolhe qual vira.")
      : rl("Reveal", "whoever placed the 7th accusation picks one Tryal card of the accused and flips it face up.", "Revele", "quem pôs a 7ª acusação escolhe uma carta Tryal do acusado e a vira para cima.");
  }

  function deadNeighbourReading() {
    return interpretation("dead players are skipped: take from the nearest living player on your left (a dead player has no face-down Tryal cards).", "jogadores mortos são pulados: pegue do jogador vivo mais próximo à sua esquerda (um morto não tem cartas Tryal viradas para baixo).");
  }

  function conspiracyStepTwo() {
    return state.conspiracy === "shuffle"
      ? rl("2 · Swap", `everyone simultaneously takes 1 face-down (unrevealed) Tryal card from the player on their left and puts it in the middle; the ${crier() ? "Town Crier" : "Moderator"} shuffles them and deals 1 face down to each living player.`, "2 · Troca", `todos pegam ao mesmo tempo 1 carta Tryal virada para baixo (não revelada) do jogador à esquerda e a põem no meio; o ${crier() ? "Pregoeiro" : "Moderador"} as embaralha e dá 1 virada para baixo a cada jogador vivo.`)
      : rl("2 · Swap", "everyone simultaneously chooses and takes 1 face-down (unrevealed) Tryal card from the player on their left and adds it to their row.", "2 · Troca", "todos escolhem e pegam ao mesmo tempo 1 carta Tryal virada para baixo (não revelada) do jogador à esquerda e a juntam à sua fila.");
  }

  function quickReference() {
    const cards = [
      infoCard(t("YOUR TURN", "SEU TURNO"), t("Do only ONE of two things", "Faça só UMA de duas coisas"), [
        rl("Draw", "take 2 cards from the deck and end your turn. A black card is revealed and resolved at once (it counts as one of the 2).", "Compre", "pegue 2 cartas do baralho e encerre o turno. Uma carta preta é revelada e resolvida na hora (conta como uma das 2)."),
        `<em>${t("— or —", "— ou —")}</em>`,
        rl("Play", "play at least 1 card — as many as you like — on other players, then end your turn.", "Jogue", "jogue pelo menos 1 carta — quantas quiser — em outros jogadores e encerre o turno."),
        rl("Never on yourself", "no card or Gavel on yourself, nor in a way that directly helps you (Law 1).", "Nunca em você", "nenhuma carta nem o Martelo em você, nem de um jeito que te ajude diretamente (Lei 1)."),
        rl("Delay", "anyone may flip the 30-second timer; when it runs out you draw 2 (if you have not played) and end your turn.", "Demora", "qualquer um pode virar a ampulheta de 30 segundos; quando acabar, você compra 2 (se não jogou) e encerra o turno.")
      ], [5, 9, 10]),
      infoCard(t("CARD COLOURS", "CORES DAS CARTAS"), t("What happens after you play it", "O que acontece depois de jogar"), [
        rl("Green", "resolve, then discard.", "Verde", "resolva e descarte."),
        rl("Blue", "stays in front of the player until they die or another card moves/discards it.", "Azul", "fica na frente do jogador até ele morrer ou outra carta movê-la/descartá-la."),
        rl("Red", "accusations: stay in front of the player until they reach 7.", "Vermelha", "acusações: ficam na frente do jogador até ele chegar a 7."),
        rl("Black", "Conspiracy and Night: revealed and resolved the moment they are drawn.", "Preta", "Conspiracy e Night: reveladas e resolvidas no momento em que são compradas."),
        rl("Card text", "every playing card prints its own effect — read it aloud when you play it.", "Texto", "cada carta de jogo traz o próprio efeito — leia-o em voz alta ao jogá-la."),
        rl("Two players left", "discard all blue cards; a drawn blue card, Scapegoat or Robbery is set aside and replaced by a new draw.", "Restam dois", "descarte todas as cartas azuis; carta azul, Scapegoat ou Robbery comprada é deixada de lado e trocada por outra compra.")
      ], [5, 7]),
      infoCard(t("7 ACCUSATIONS", "7 ACUSAÇÕES"), t("Red cards reveal a Tryal card", "Cartas vermelhas revelam uma Tryal"), [
        rl("Count", "add up the accusations of all red cards in front of a player.", "Conte", "some as acusações de todas as cartas vermelhas na frente de um jogador."),
        revealLine(),
        rl("Reset", "then discard all red cards in front of the accused. Extra accusations beyond 7 are lost.", "Zere", "depois descarte todas as cartas vermelhas na frente do acusado. Acusações além de 7 se perdem."),
        rl("Two reveals", "if you hold enough for two reveals, play the cards so you reveal one Tryal card at a time.", "Duas revelações", "se tiver o bastante para duas revelações, jogue as cartas de modo a revelar uma carta Tryal de cada vez.")
      ], [5, 6, 13]),
      infoCard(t("A PLAYER DIES", "UM JOGADOR MORRE"), t("Any of three ways", "De três maneiras"), [
        rl("All revealed", "all of their Tryal cards are face up.", "Tudo revelado", "todas as suas cartas Tryal estão viradas para cima."),
        rl("Witch revealed", "one of their revealed Tryal cards says Witch.", "Witch revelada", "uma das suas cartas Tryal reveladas diz Witch."),
        rl("Killed", "the Witches kill them at Night (unless saved).", "Morto", "as Bruxas o matam à Noite (a menos que salvo)."),
        deathLine(),
        rl("Last words", "you get three last words, then stay silent for the rest of the game.", "Últimas palavras", "você tem três últimas palavras e depois fica em silêncio até o fim.")
      ], [6, 10]),
      infoCard(t("WINNING", "VITÓRIA"), t("Checked at once", "Verificada na hora"), [
        rl("Townspeople", "(never had a Witch card) win the moment the last Witch Tryal card in the game is revealed.", "Cidadãos", "(nunca tiveram carta Witch) vencem no momento em que a última carta Tryal Witch da partida é revelada."),
        rl("Witches", "(have or ever had a Witch card) win as soon as everyone still alive is a Witch.", "Bruxas", "(têm ou já tiveram carta Witch) vencem assim que todos os vivos forem Bruxas.")
      ], [6]),
      infoCard(t("CONSPIRACY", "CONSPIRAÇÃO"), t("When it is drawn", "Quando é comprada"), [
        rl("1 · Black Cat", "the drawer reveals one Tryal card of the player with the Black Cat (skip if nobody has it; the Black Cat owner who draws it chooses their own card).", "1 · Gato Preto", "quem comprou revela uma carta Tryal do jogador com o Black Cat (pule se ninguém o tiver; se o dono do Black Cat comprou, ele escolhe a própria carta)."),
        conspiracyStepTwo(),
        rl("Dead neighbour", "skip dead players; take from the nearest living player on your left (guide's reading).", "Vizinho morto", "pule os mortos; pegue do jogador vivo mais próximo à sua esquerda (leitura do guia)."),
        rl("3 · Look", "everyone views their new Tryal cards. Gain a Witch → you are a Witch now. Lose one → you stay a Witch.", "3 · Olhe", "todos veem as novas cartas Tryal. Ganhou uma Witch → agora é Bruxa. Perdeu uma → continua Bruxa.")
      ], [7, 11, 12]),
      infoCard(t("NIGHT", "NOITE"), t("When Night is drawn", "Quando a Night é comprada"), crier()
        ? [
          rl("Set", "Kill cards of the living characters face up and sideways on the deck.", "Prepare", "cartas Kill dos personagens vivos viradas para cima, atravessadas sobre o baralho."),
          rl("Witches", "eyes open, set one Kill card face down apart, stack the rest face down; count 20.", "Bruxas", "olhos abertos, separam uma carta Kill virada para baixo e empilham o resto virado para baixo; contagem de 20."),
          rl("Constable", "eyes open, places the Gavel by any other player; count 10.", "Delegado", "olhos abertos, põe o Martelo ao lado de outro jogador; contagem de 10."),
          rl("Confess", "eyes open; flip the timer — before it runs out, anyone may reveal one of their own Tryal cards for immunity.", "Confessar", "olhos abertos; virem a ampulheta — antes de acabar, qualquer um pode revelar uma das próprias cartas Tryal para ficar imune."),
          rl("Reveal", "flip the set-apart Kill card: that character dies — unless Gavel, Confess or Asylum.", "Revele", "vire a carta Kill separada: esse personagem morre — a menos que tenha Martelo, Confissão ou Asylum."),
          rl("After", "shuffle the discard pile into a new deck, Night at the bottom; continue where you left off.", "Depois", "embaralhe o descarte num novo baralho, Night no fundo; continuem de onde pararam.")
        ]
        : [
          rl("Moderator", "reads the Night script: all eyes closed.", "Moderador", "lê o roteiro da Noite: todos de olhos fechados."),
          rl("Witches", "(have or ever had a Witch card) open eyes and point to any player to kill — even one of themselves.", "Bruxas", "(têm ou já tiveram carta Witch) abrem os olhos e apontam para qualquer jogador para matar — até uma delas."),
          rl("Constable", "opens eyes and points to any other player; the Moderator gives them the Gavel.", "Delegado", "abre os olhos e aponta para outro jogador; o Moderador lhe dá o Martelo."),
          rl("Confess", "eyes open; flip the timer — before it runs out, anyone may reveal one of their own Tryal cards for immunity.", "Confessar", "olhos abertos; virem a ampulheta — antes de acabar, qualquer um pode revelar uma das próprias cartas Tryal para ficar imune."),
          rl("Reveal", "the Moderator names the victim: they die — unless Gavel, Confess or Asylum.", "Revele", "o Moderador diz a vítima: ela morre — a menos que tenha Martelo, Confissão ou Asylum."),
          rl("After", "shuffle the discard pile into a new deck, Night at the bottom; continue where you left off.", "Depois", "embaralhe o descarte num novo baralho, Night no fundo; continuem de onde pararam.")
        ], [8, 9, 10, 11]),
      infoCard(t("THE 5 LAWS", "AS 5 LEIS"), t("Always in force", "Sempre valem"), [
        rl("1", "never play a card or the Gavel on yourself or to benefit yourself directly.", "1", "nunca jogue uma carta ou o Martelo em você ou para se beneficiar diretamente."),
        rl("2", "a card let go of cannot be taken back; forgotten abilities are lost.", "2", "carta solta não volta atrás; habilidade esquecida está perdida."),
        rl("3", "delay → timer → draw 2 and end turn.", "3", "demora → ampulheta → compre 2 e encerre o turno."),
        rl("4", "you may secretly reorder your Tryal cards, always in plain sight.", "4", "você pode reordenar as suas cartas Tryal em segredo, sempre à vista."),
        rl("5", "the dead get three last words, then silence.", "5", "os mortos têm três últimas palavras e depois silêncio.")
      ], [9, 10])
    ];
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), sectionIndex("quick-reference"), [5, 6, 7, 8])}
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- teams, death & victory ----------

  function victorySection() {
    return `
      ${sectionHeading("victory", t("Teams, death & winning", "Times, morte e vitória"), sectionIndex("victory"), [2, 6])}
      <div class="quick-grid">
        ${infoCard(t("TEAMS", "TIMES"), t("Witch once, Witch forever", "Bruxa uma vez, Bruxa para sempre"), [
          rl("Witches", "everyone who has owned a Witch Tryal card at any point in the game — even if a Conspiracy later took it away.", "Bruxas", "todos que tiveram uma carta Tryal Witch em qualquer momento da partida — mesmo que uma Conspiração a tenha tirado depois."),
          rl("Townspeople", "everyone who has never had a Witch card.", "Cidadãos", "todos que nunca tiveram uma carta Witch."),
          rl("Changing sides", "a Conspiracy can hand you a Witch card mid-game: from then on you are a Witch. You never change back.", "Mudando de lado", "uma Conspiração pode te passar uma carta Witch no meio da partida: daí em diante você é Bruxa. Nunca volta atrás."),
          rl("Constable", "a separate role: whoever currently holds the Constable card. It may be a Witch (an “evil” Constable).", "Delegado", "um papel à parte: quem tem a carta Constable no momento. Pode ser uma Bruxa (um Delegado “maligno”).")
        ], [2, 6, 7, 12], "victory-card")}
        ${infoCard(t("DEATH", "MORTE"), t("A player dies when…", "Um jogador morre quando…"), [
          t("all of their Tryal cards have been revealed; or", "todas as suas cartas Tryal foram reveladas; ou"),
          t("one of their revealed Tryal cards says Witch (a player with two Witch cards then reveals the other one too); or", "uma das suas cartas Tryal reveladas diz Witch (quem tem duas cartas Witch revela a outra também); ou"),
          t("the Witches kill them during the Night.", "as Bruxas o matam durante a Noite."),
          deathLine(),
          rl("Silence", "after three last words, the dead may not speak or signal; those who do are shunned.", "Silêncio", "depois de três últimas palavras, os mortos não podem falar nem fazer sinais; quem fizer é rechaçado.")
        ], [6, 10, 13], "victory-card")}
        ${infoCard(t("GAME END", "FIM DE JOGO"), t("Two ways to win", "Duas formas de vencer"), [
          rl("Townspeople win", "when the final Witch Tryal card in the game is revealed. They do not need to kill every Witch — only reveal every Witch card.", "Cidadãos vencem", "quando a última carta Tryal Witch da partida é revelada. Não precisam matar todas as Bruxas — só revelar todas as cartas Witch."),
          rl("Witches win", "as soon as everyone still alive is a Witch (current or former).", "Bruxas vencem", "assim que todos os vivos forem Bruxas (atuais ou antigas)."),
          rl("The dead", "win or lose with their team.", "Os mortos", "vencem ou perdem com o seu time."),
          rl("Same instant", "if Matchmaker kills the final non-Witch and removes the final Witch card in the same turn, the matched player dies a split-second after the other, which decides the winner.", "Mesmo instante", "se a Matchmaker mata o último não-Bruxo e elimina a última carta Witch no mesmo turno, o jogador ligado morre uma fração de segundo depois do outro, o que decide o vencedor.")
        ], [6, 12], "victory-card")}
      </div>
      <div class="sl-art-row">${figure("tryal-row", t("Rules p. 6: Townspeople win once all Witch cards are revealed", "Regras p. 6: os Cidadãos vencem quando todas as cartas Witch são reveladas"))}</div>`;
  }

  // ---------- turn ----------

  function turnSection() {
    return `
      ${sectionHeading("turn", t("Playing the game: your turn", "Jogando: seu turno"), sectionIndex("turn"), [5, 11])}
      <div class="quick-grid">
        ${infoCard(t("ORDER", "ORDEM"), t("Who plays", "Quem joga"), [
          t("The player who was given the Black Cat at Dawn goes first; play proceeds clockwise.", "Quem recebeu o Black Cat na Alvorada começa; o jogo segue em sentido horário."),
          t("Dead players are skipped.", "Jogadores mortos são pulados."),
          t("There are no rounds: turns continue until one team wins. Night comes whenever the Night card is drawn.", "Não há rodadas: os turnos continuam até um time vencer. A Noite chega sempre que a carta Night é comprada.")
        ], [5])}
        ${infoCard(t("OPTION 1", "OPÇÃO 1"), t("Draw 2 cards and end your turn", "Compre 2 cartas e encerre o turno"), [
          t("Take the top 2 cards of the deck into your hand, one at a time.", "Pegue as 2 cartas do topo do baralho para a mão, uma de cada vez."),
          rl("Black card", "if you draw Conspiracy or Night, reveal it and resolve it immediately. It counts as one of your 2 cards.", "Carta preta", "se comprar Conspiracy ou Night, revele-a e resolva-a imediatamente. Ela conta como uma das 2 cartas."),
          rl("Night as your first card", "Night is the last card of the deck; if you draw it as your first card, resolve the Night and draw your second card after it.", "Night como primeira carta", "a Night é a última carta do baralho; se for a sua primeira carta, resolva a Noite e compre a segunda depois dela."),
          rl("Out of turn", "a black card drawn outside your turn (by a character ability) is resolved immediately; then play continues where it left off.", "Fora do turno", "uma carta preta comprada fora do turno (por habilidade de personagem) é resolvida na hora; depois o jogo continua de onde parou.")
        ], [5, 11])}
        ${infoCard(t("OPTION 2", "OPÇÃO 2"), t("Play cards", "Jogue cartas"), [
          t("Play at least 1 card from your hand — as many as you want — on any other players.", "Jogue pelo menos 1 carta da mão — quantas quiser — em quaisquer outros jogadores."),
          t("You may not also draw this turn.", "Você não pode também comprar neste turno."),
          t("Read the card's text aloud and apply it. Its colour tells you where it goes afterwards (see Cards & accusations).", "Leia o texto da carta em voz alta e aplique-o. A cor diz para onde ela vai depois (veja Cartas e acusações)."),
          t("Once you let go of a card it cannot be taken back (Law 2).", "Depois de soltar uma carta, ela não volta atrás (Lei 2).")
        ], [5, 9])}
        ${infoCard(t("TIMING", "TEMPO"), t("The 30-second timer", "A ampulheta de 30 segundos"), [
          t("If a player delays, flip the timer.", "Se um jogador demora, virem a ampulheta."),
          t("When the sand runs out, that player must draw two cards (unless they have already played cards) and end their turn.", "Quando a areia acabar, esse jogador precisa comprar duas cartas (a menos que já tenha jogado cartas) e encerrar o turno."),
          t("If you forget to use your character's ability on the turn it applies… too bad!", "Se você esquecer de usar a habilidade do seu personagem no turno em que ela vale… azar!")
        ], [9, 10])}
      </div>`;
  }

  // ---------- cards & accusations ----------

  function cardsSection() {
    const named = [
      [t("Accusation", "Accusation (Acusação)"), t("red; one of the accusation cards (pictured p. 5).", "vermelha; uma das cartas de acusação (figura p. 5)."), 5],
      [t("Evidence", "Evidence (Prova)"), t("a red accusation card worth more than 1 accusation (the rulebook's example plays it on someone with 6); Cotton Mather's ability changes how much it counts.", "carta vermelha de acusação que vale mais de 1 acusação (o exemplo do livro a joga em alguém com 6); a habilidade de Cotton Mather muda quanto ela conta."), 12],
      [t("Witness", "Witness (Testemunha)"), t("an accusation card; Will Griggs may use an Alibi as one.", "carta de acusação; Will Griggs pode usar um Alibi como uma."), 12],
      [t("Alibi", "Alibi (Álibi)"), t("you may never give yourself Alibi (Law 1).", "você nunca pode dar Alibi a si mesmo (Lei 1)."), 9],
      [t("Piety", "Piety (Piedade)"), t("you may never give yourself Piety. Scapegoat can still move red cards onto the player with Piety.", "você nunca pode dar Piety a si mesmo. Scapegoat ainda pode mover cartas vermelhas para o jogador com Piety."), 12],
      [t("Scapegoat", "Scapegoat (Bode Expiatório)"), t("moves cards from one player to another — never to or from you; it also moves Stocks.", "move cartas de um jogador para outro — nunca para você nem de você; também move Stocks."), 13],
      [t("Robbery", "Robbery (Roubo)"), t("green; takes cards from one player and gives them to another — never to you.", "verde; tira cartas de um jogador e as dá a outro — nunca a você."), 13],
      [t("Curse", "Curse (Maldição)"), t("can discard a blue card (e.g. the Black Cat).", "pode descartar uma carta azul (ex.: o Black Cat)."), 5],
      [t("Asylum", "Asylum (Asilo)"), t("blue; a player with Asylum in front of them is not killed at Night.", "azul; um jogador com Asylum à sua frente não morre à Noite."), 9],
      [t("Stocks", "Stocks (Tronco)"), t("stays in front of a player until they have been skipped, then is discarded; two Stocks = skipped twice in a row.", "fica na frente de um jogador até ele ser pulado e então é descartada; dois Stocks = pulado duas vezes seguidas."), 13],
      [t("Matchmaker", "Matchmaker (Casamenteira)"), t("two cards; links two players' fates — see Nitty Gritties.", "duas cartas; liga o destino de dois jogadores — veja Detalhes."), 12],
      [t("Black Cat", "Black Cat (Gato Preto)"), t("placed at Dawn, then a normal blue card; matters when Conspiracy is drawn.", "colocada na Alvorada, depois uma carta azul normal; importa quando a Conspiração é comprada."), 11]
    ];
    return `
      ${sectionHeading("cards", t("Card colours & accusations", "Cores das cartas e acusações"), sectionIndex("cards"), [5, 6, 13])}
      <div class="quick-grid">
        ${infoCard(t("GREEN", "VERDE"), t("One-shot", "Uso único"), [
          t("Apply the card's effect, then discard it.", "Aplique o efeito da carta e descarte-a."),
          t("Example pictured: Robbery.", "Exemplo da figura: Robbery.")
        ], [5])}
        ${infoCard(t("BLUE", "AZUL"), t("Stays in play", "Fica em jogo"), [
          t("Place it in front of the target player. It stays there until that player is dead, or another card moves it (Scapegoat) or discards it (Curse).", "Coloque-a na frente do jogador-alvo. Fica ali até esse jogador morrer, ou outra carta movê-la (Scapegoat) ou descartá-la (Curse)."),
          t("Example pictured: Asylum. The Black Cat is also blue once placed.", "Exemplo da figura: Asylum. O Black Cat também é azul depois de colocado."),
          rl("Two players left", "all blue cards are discarded from the game; if you draw a blue card, set it aside and draw another.", "Restam dois", "todas as cartas azuis saem do jogo; se comprar uma carta azul, deixe-a de lado e compre outra.")
        ], [5, 12])}
        ${infoCard(t("RED", "VERMELHA"), t("Accusations", "Acusações"), [
          t("Place it on the target player (not on a particular Tryal card). Each red card counts a number of accusations.", "Coloque-a no jogador-alvo (não numa carta Tryal específica). Cada carta vermelha conta um número de acusações."),
          t("Red cards stay until that player has 7 total accusations.", "As cartas vermelhas ficam até esse jogador ter 7 acusações no total."),
          revealLine(),
          t("Then all red cards in front of the accused are discarded. Accusations above 7 do not carry over to the next Tryal card.", "Depois todas as cartas vermelhas na frente do acusado são descartadas. Acusações acima de 7 não passam para a próxima carta Tryal."),
          t("With enough for two reveals on one player, play the cards to reveal one Tryal card at a time.", "Com o bastante para duas revelações no mesmo jogador, jogue as cartas de modo a revelar uma carta Tryal de cada vez.")
        ], [5, 6, 13])}
        ${infoCard(t("BLACK", "PRETA"), t("Conspiracy and Night", "Conspiracy e Night"), [
          t("Never kept in hand: when drawn it is revealed and enacted immediately.", "Nunca fica na mão: quando comprada, é revelada e executada imediatamente."),
          t("Conspiracy is shuffled into the deck; Night is always the bottom card.", "A Conspiracy é embaralhada no baralho; a Night é sempre a carta do fundo."),
          t("Not to be confused with the black Kill cards used by the Town Crier.", "Não confunda com as cartas pretas Kill usadas pelo Pregoeiro.")
        ], [7, 8])}
        ${infoCard(t("WHAT A REVEAL DOES", "O QUE UMA REVELAÇÃO FAZ"), t("Depends on the face", "Depende da face"), [
          rl("Not a Witch", "nothing more; the card stays face up. If it was the player's last face-down card, they die.", "Not a Witch", "nada mais; a carta fica virada para cima. Se era a última carta virada para baixo do jogador, ele morre."),
          rl("Witch", "the player dies (and reveals any other Witch card). If it was the last unrevealed Witch card, the Townspeople win.", "Witch", "o jogador morre (e revela qualquer outra carta Witch). Se era a última carta Witch não revelada, os Cidadãos vencem."),
          rl("Constable", "the player does not necessarily die, but the Constable role is no longer used in this game.", "Constable", "o jogador não morre necessariamente, mas o papel de Delegado deixa de ser usado nesta partida.")
        ], [6, 12, 13])}
      </div>
      <h3 class="subhead">${t("Cards the rulebook names", "Cartas citadas no livro")}</h3>
      <p class="glossary-intro">${t("The rulebook does not print the text of the 59 playing cards; each card's own text is the rule. These are only the cards it mentions and what it says about them.", "O livro não traz o texto das 59 cartas de jogo; o texto de cada carta é a regra. Estas são só as cartas que ele cita e o que diz sobre elas.")}</p>
      <div class="quick-grid">${named.map(([name, text, page]) => `
        <article class="info-card">
          <span class="component-label">${t("PLAYING CARD", "CARTA DE JOGO")}</span>
          <h3>${name}</h3>
          <p>${text}</p>
          ${referenceLink(page)}
        </article>`).join("")}</div>`;
  }

  // ---------- conspiracy ----------

  function conspiracySection() {
    return `
      ${sectionHeading("conspiracy", t("Conspiracy", "Conspiração"), sectionIndex("conspiracy"), [7, 11, 12])}
      <div class="quick-grid">
        ${infoCard(t("BLACK CARD", "CARTA PRETA"), t("When Conspiracy is drawn", "Quando a Conspiracy é comprada"), [
          rl("1 · Black Cat", "the person who drew Conspiracy reveals one Tryal card belonging to the player with the Black Cat in front of them. If nobody has the Black Cat in front of them, skip this step.", "1 · Gato Preto", "quem comprou a Conspiracy revela uma carta Tryal do jogador que tem o Black Cat à sua frente. Se ninguém tiver o Black Cat à frente, pule este passo."),
          rl("Own cat", "if the owner of the Black Cat drew Conspiracy, they choose which of their own Tryal cards is revealed.", "O próprio gato", "se o dono do Black Cat comprou a Conspiracy, ele escolhe qual das próprias cartas Tryal é revelada."),
          state.shortGames === "on" ? rl("Point to two", "if that player has 4 or 5 Tryal cards left, the drawer points to two and the player chooses which one flips.", "Aponte para duas", "se esse jogador tiver 4 ou 5 cartas Tryal restantes, quem comprou aponta para duas e o jogador escolhe qual vira.") : "",
          conspiracyStepTwo(),
          deadNeighbourReading(),
          rl("3 · Look", "each player carefully views their new set of Tryal cards.", "3 · Olhe", "cada jogador olha com cuidado o seu novo conjunto de cartas Tryal.")
        ], [7, 11, 12, 14])}
        ${infoCard(t("AFTER THE SWAP", "DEPOIS DA TROCA"), t("Roles can change", "Papéis podem mudar"), [
          rl("Gained a Witch", "you are now a Witch, aligned with the Witches.", "Ganhou uma Witch", "agora você é Bruxa, do time das Bruxas."),
          rl("Lost a Witch", "you remain a Witch: you still open your eyes with the Witches at Night and stay on their team.", "Perdeu uma Witch", "você continua Bruxa: ainda abre os olhos com as Bruxas à Noite e continua no time delas."),
          rl("Gained the Constable", "you are now the Constable and place the Gavel at Night.", "Ganhou o Constable", "agora você é o Delegado e coloca o Martelo à Noite."),
          rl("Lost the Constable", "you are no longer the Constable; do not open your eyes as Constable at Night.", "Perdeu o Constable", "você não é mais o Delegado; não abra os olhos como Delegado à Noite."),
          rl("Secret", "nobody announces what they received.", "Segredo", "ninguém anuncia o que recebeu.")
        ], [2, 7])}
      </div>
      <div class="sl-art-row"><figure class="sl-art"><img src="${ICONS}conspiracy.webp" alt="${t("Rules p. 7: the Conspiracy card", "Regras p. 7: a carta Conspiracy")}" loading="lazy"><figcaption>${t("Rules p. 7: the Conspiracy card — “Play immediately”", "Regras p. 7: a carta Conspiracy — “Play immediately” (jogue imediatamente)")}</figcaption></figure></div>`;
  }

  // ---------- night ----------

  function moderatorScript() {
    const say = `<span class="sl-say">${t("Say", "Diga")}</span>`;
    const dawn = [
      `${say}<q>${t("All players close your eyes.", "Todos os jogadores, fechem os olhos.")}</q> ${t("Make sure everyone's eyes are closed.", "Confira se todos estão de olhos fechados.")}`,
      `${say}<q>${t("Witches, please open your eyes and point to any player to give the Black Cat. You may point to yourself.", "Bruxas, abram os olhos e apontem para qualquer jogador para dar o Gato Preto. Podem apontar para si mesmas.")}</q> ${t("Make sure you see who they point to.", "Confira para quem elas apontam.")}`,
      `${say}<q>${t("Witches, please close your eyes.", "Bruxas, fechem os olhos.")}</q> ${t("Make sure they are closed.", "Confira que fecharam.")}`,
      `${say}<q>${t("Everyone, please open your eyes.", "Todos, abram os olhos.")}</q> ${t("Place the Black Cat in front of the player the Witches pointed to.", "Coloque o Black Cat na frente do jogador para quem as Bruxas apontaram.")}`
    ];
    const night = [
      `${say}<q>${t("All players close your eyes.", "Todos os jogadores, fechem os olhos.")}</q> ${t("Make sure everyone's eyes are closed.", "Confira se todos estão de olhos fechados.")}`,
      `${say}<q>${t("If you have a Witch card, or ever had a Witch card, please open your eyes and point to any player to kill. You may select yourself.", "Se você tem uma carta Witch, ou já teve uma, abra os olhos e aponte para qualquer jogador para matar. Pode escolher a si mesmo.")}</q> ${t("See and remember who they point to.", "Veja e lembre para quem apontam.")}`,
      `${say}<q>${t("Witches, please close your eyes.", "Bruxas, fechem os olhos.")}</q> ${t("Make sure they are closed.", "Confira que fecharam.")}`,
      `${say}<q>${t("Constable, please open your eyes and point to any player to give the Gavel token. You may not select yourself.", "Delegado, abra os olhos e aponte para qualquer jogador para dar o Martelo. Não pode escolher a si mesmo.")}</q> ${t("Put the Gavel in front of the player the Constable points to.", "Ponha o Martelo na frente do jogador para quem o Delegado aponta.")}`,
      `${say}<q>${t("Constable, please close your eyes.", "Delegado, feche os olhos.")}</q> ${t("Make sure they are closed.", "Confira que fechou.")}`,
      `${say}<q>${t("Everyone, open your eyes. Before I reveal who has been killed, any player may choose to Confess: flip one of your own Tryal cards in exchange for immunity from death for this Night. Your decision ends with the sands of the hourglass.", "Todos, abram os olhos. Antes de eu revelar quem foi morto, qualquer jogador pode Confessar: virar uma das próprias cartas Tryal em troca de imunidade à morte nesta Noite. A decisão acaba com a areia da ampulheta.")}</q>`,
      t("Flip the timer. When it runs out, announce who the Witches killed. That player dies unless they were given the Gavel, chose to Confess, or have the Asylum card in front of them.", "Vire a ampulheta. Quando acabar, anuncie quem as Bruxas mataram. Esse jogador morre, a menos que tenha recebido o Martelo, tenha Confessado ou tenha a carta Asylum à sua frente."),
      t("Shuffle the discard pile to re-form the deck, again with Night at the bottom. Continue playing where you left off.", "Embaralhe o descarte para formar o baralho de novo, outra vez com a Night no fundo. Continuem de onde pararam.")
    ];
    return `
      <div class="quick-grid">
        <article class="info-card">
          <span class="component-label">${t("MODERATOR SCRIPT", "ROTEIRO DO MODERADOR")}</span>
          <h3>${t("Dawn (once, at setup)", "Alvorada (uma vez, na preparação)")}</h3>
          <ol class="sl-script">${dawn.map((line) => `<li>${line}</li>`).join("")}</ol>
          ${referenceLink(10)}
        </article>
        <article class="info-card">
          <span class="component-label">${t("MODERATOR SCRIPT", "ROTEIRO DO MODERADOR")}</span>
          <h3>${t("Night (each time Night is drawn)", "Noite (cada vez que a Night é comprada)")}</h3>
          <ol class="sl-script">${night.map((line) => `<li>${line}</li>`).join("")}</ol>
          ${referenceLink(10)} ${referenceLink(11)}
        </article>
      </div>`;
  }

  function nightSection() {
    const crierSteps = infoCard(t("TOWN CRIER", "PREGOEIRO"), t("Night step by step", "A Noite passo a passo"), [
      rl("1 · Kill cards", "place the Kill cards of the Town Hall characters still in the game face up in a stack, sideways on top of the playing deck, so the Witches can pick them up quietly.", "1 · Cartas Kill", "ponha as cartas Kill dos personagens da Prefeitura ainda em jogo viradas para cima numa pilha, atravessada sobre o baralho, para as Bruxas pegarem em silêncio."),
      interpretation("Night is usually the last card, so the deck spot may be empty: lay the Kill stack sideways where the deck sits.", "a Night costuma ser a última carta, então o lugar do baralho pode estar vazio: deite a pilha Kill atravessada onde fica o baralho."),
      rl("2 · Eyes closed", "the Town Crier tells all players to close their eyes.", "2 · Olhos fechados", "o Pregoeiro manda todos fecharem os olhos."),
      rl("3 · Witches", "everyone who has or ever had a Witch card opens their eyes, places any one Kill card face down away from the others (the player they want to eliminate — even one of their own) and puts the rest in a face-down stack. The Town Crier counts down from 20, then tells the Witches to close their eyes.", "3 · Bruxas", "todos que têm ou já tiveram carta Witch abrem os olhos, colocam uma carta Kill qualquer virada para baixo longe das outras (o jogador que querem eliminar — até um deles) e põem o resto numa pilha virada para baixo. O Pregoeiro conta de 20 até 0 e manda as Bruxas fecharem os olhos."),
      rl("4 · Constable", "the Constable opens their eyes and places the Gavel token next to any player except themselves (the player they want to save). The Town Crier counts down from 10, then tells the Constable to close their eyes. Skip this step once the Constable card has been revealed.", "4 · Delegado", "o Delegado abre os olhos e coloca o Martelo ao lado de qualquer jogador menos ele mesmo (o jogador que quer salvar). O Pregoeiro conta de 10 até 0 e manda o Delegado fechar os olhos. Pule este passo depois que a carta Constable tiver sido revelada."),
      rl("Crier's eyes", "the Town Crier keeps their eyes closed throughout, except as a Witch or as the Constable.", "Olhos do Pregoeiro", "o Pregoeiro fica de olhos fechados o tempo todo, exceto como Bruxa ou como Delegado."),
      rl("5 · Confess", "everyone opens their eyes. Flip the timer: before it runs out, any player may Confess — reveal one of their own chosen Tryal cards — for immunity from the Kill card.", "5 · Confessar", "todos abrem os olhos. Virem a ampulheta: antes de acabar, qualquer jogador pode Confessar — revelar uma das próprias cartas Tryal, à escolha — para ficar imune à carta Kill."),
      rl("6 · Kill", "the Town Crier (guide's reading: any player may do it) reveals the Kill card set apart. The player with the matching Town Hall card dies and flips all their remaining Tryal cards — unless they have the Gavel, Confessed, or have Asylum in front of them.", "6 · Morte", "o Pregoeiro (leitura do guia: qualquer jogador pode fazê-lo) revela a carta Kill separada. O jogador com a carta da Prefeitura correspondente morre e vira todas as cartas Tryal restantes — a menos que tenha o Martelo, tenha Confessado ou tenha Asylum à sua frente."),
      rl("After", "shuffle the discard pile to re-form the deck, again placing Night at the bottom. Continue where you left off.", "Depois", "embaralhe o descarte para formar o baralho de novo, outra vez com a Night no fundo. Continuem de onde pararam."),
      interpretation("then put the Kill cards back into one face-up stack, leaving out the Kill cards of dead players.", "depois junte as cartas Kill de novo numa pilha virada para cima, deixando de fora as cartas Kill dos mortos."),
      interpretation("if the Town Crier dies, they become the Moderator and run the following Nights (and any Conspiracy redeal) with the Moderator script below.", "se o Pregoeiro morrer, ele vira o Moderador e conduz as Noites seguintes (e qualquer redistribuição da Conspiração) com o roteiro do Moderador abaixo.")
    ], [8, 9]);
    return `
      ${sectionHeading("night", t("Night", "Noite"), sectionIndex("night"), [8, 9, 10, 11])}
      <div class="quick-grid">
        ${infoCard(t("BLACK CARD", "CARTA PRETA"), t("What the Night is", "O que é a Noite"), [
          t("Night is the bottom card of the deck: it comes when the deck runs out. It is also revealed and resolved at once.", "A Night é a carta do fundo do baralho: ela chega quando o baralho acaba. Também é revelada e resolvida na hora."),
          t("The Witches try to kill a player — or may stage the killing of one of their own.", "As Bruxas tentam matar um jogador — ou podem encenar a morte de uma delas."),
          t("The Constable tries to save another player. An evil (Witch) Constable may save the wrong player on purpose.", "O Delegado tenta salvar outro jogador. Um Delegado maligno (Bruxa) pode salvar o jogador errado de propósito."),
          t("Unlike the Dawn, the Black Cat is not involved in the Night.", "Ao contrário da Alvorada, o Black Cat não participa da Noite."),
          rl("Saved by", "the Gavel; Confessing before the Kill is revealed; the Asylum card in front of you.", "Salvo por", "o Martelo; Confessar antes da morte ser revelada; a carta Asylum à sua frente."),
          rl("Confessing", "your revealed card follows the normal rules: a revealed Witch still kills you, and revealing your last face-down card does too.", "Confessar", "a carta revelada segue as regras normais: uma Witch revelada ainda te mata, e revelar a sua última carta virada para baixo também."),
          interpretation("several Witches choose one single victim together, silently (by gestures); the Kill is only made once they agree.", "várias Bruxas escolhem juntas uma única vítima, em silêncio (por gestos); a morte só é marcada quando elas concordam."),
          interpretation("after the Night the Gavel goes back to the middle of the table.", "depois da Noite o Martelo volta ao meio da mesa.")
        ], [6, 8, 9])}
        ${crier() ? crierSteps : ""}
      </div>
      ${crier()
        ? `<div class="callout">${t(
          "Recommended: once a player has died (or if someone nearby is not playing), make them the Moderator instead of using the Town Crier. From then on they read the Moderator script below with eyes open, and the Kill cards are no longer needed. This hides movement better and keeps the dead player involved.",
          "Recomendado: assim que um jogador morrer (ou se alguém por perto não estiver jogando), faça dele o Moderador no lugar do Pregoeiro. A partir daí ele lê o roteiro do Moderador abaixo de olhos abertos, e as cartas Kill deixam de ser necessárias. Isso disfarça melhor os movimentos e mantém o jogador morto envolvido."
        )} ${referenceLink(8)} ${referenceLink(14)}</div>`
        : ""}
      <h3 class="subhead">${t("Moderator script", "Roteiro do Moderador")}</h3>
      ${moderatorScript()}
      <div class="sl-art-row"><figure class="sl-art"><img src="${ICONS}night.webp" alt="${t("Rules p. 8: the Night card", "Regras p. 8: a carta Night")}" loading="lazy"><figcaption>${t("Rules p. 8: the Night card — “Play immediately”", "Regras p. 8: a carta Night — “Play immediately” (jogue imediatamente)")}</figcaption></figure></div>`;
  }

  // ---------- laws ----------

  function lawsSection() {
    return `
      ${sectionHeading("laws", t("The 5 Laws of Salem", "As 5 Leis de Salem"), sectionIndex("laws"), [9, 10])}
      <div class="quick-grid">
        ${infoCard(t("LAW 1", "LEI 1"), t("Never on yourself", "Nunca em você"), [
          t("You may never play a card, or the Gavel token, on yourself.", "Você nunca pode jogar uma carta, ou o Martelo, em você mesmo."),
          t("Nor in a way that directly affects you: no giving yourself Piety or Alibi, no forcing someone to give you cards with Robbery, no moving cards to you with Scapegoat.", "Nem de um jeito que te afete diretamente: nada de dar Piety ou Alibi a si mesmo, forçar alguém a te dar cartas com Robbery ou mover cartas para você com Scapegoat."),
          t("Exception: at Dawn the Witches may give themselves the Black Cat.", "Exceção: na Alvorada as Bruxas podem dar o Black Cat a si mesmas.")
        ], [9, 11])}
        ${infoCard(t("LAW 2", "LEI 2"), t("No take-backs", "Sem voltar atrás"), [
          t("Once a played card has been let go of, it cannot be taken back.", "Depois de soltar uma carta jogada, ela não volta atrás."),
          t("Forgot your character's special ability on the turn it applied? Too bad!", "Esqueceu a habilidade especial do personagem no turno em que valia? Azar!")
        ], [9, 10])}
        ${infoCard(t("LAW 3", "LEI 3"), t("The hourglass", "A ampulheta"), [
          t("If a player delays, flip the hourglass.", "Se um jogador demora, virem a ampulheta."),
          t("When the sand runs out, the player must draw two cards (unless they have already played cards) and end their turn.", "Quando a areia acabar, o jogador precisa comprar duas cartas (a menos que já tenha jogado cartas) e encerrar o turno.")
        ], [10])}
        ${infoCard(t("LAW 4", "LEI 4"), t("Rearranging Tryal cards", "Reorganizar cartas Tryal"), [
          t("You may secretly rearrange the order of your Tryal cards.", "Você pode reorganizar em segredo a ordem das suas cartas Tryal."),
          t("They must always remain in plain sight of all players.", "Elas precisam ficar sempre à vista de todos.")
        ], [10])}
        ${infoCard(t("LAW 5", "LEI 5"), t("The dead are silent", "Os mortos ficam em silêncio"), [
          t("When you die you may have three “last words”.", "Ao morrer você pode dizer três “últimas palavras”."),
          t("After that, dead players who speak by word or action shall be shunned.", "Depois disso, mortos que se comunicarem por palavra ou gesto serão rechaçados.")
        ], [10])}
      </div>`;
  }

  // ---------- characters ----------

  function charactersSection() {
    return `
      ${sectionHeading("characters", t("Town Hall characters", "Personagens da Prefeitura"), sectionIndex("characters"), [4, 12, 13, 15, 16, 17])}
      <p class="glossary-intro">${t(
        "Each player is one of these 15 historical characters. The special ability is printed on the Town Hall card itself — the rulebook does not repeat it — so read it aloud at setup and keep the cards face up. Shown here: the portrait, the role and age from the rulebook's History pages, a one-line history and every rulebook clarification about that character.",
        "Cada jogador é um destes 15 personagens históricos. A habilidade especial está impressa na própria carta da Prefeitura — o livro não a repete —, então leia-a em voz alta na preparação e mantenha as cartas viradas para cima. Aqui aparecem: o retrato, o papel e a idade das páginas de História do livro, uma linha de história e todos os esclarecimentos do livro sobre o personagem."
      )}</p>
      <div class="sl-card-grid">${CHARACTERS.map((c) => `
        <article class="sl-card">
          <img src="${PORTRAITS}${c.id}.webp" alt="${t(`Portrait of ${c.name}`, `Retrato de ${c.name}`)}" loading="lazy">
          <div>
            <h3>${c.name}</h3>
            <span class="sl-tag">${t(c.role[0], c.role[1])} · ${c.age}</span>
            ${lineList([
              rl("Ability", "read it on the Town Hall card.", "Habilidade", "leia na carta da Prefeitura."),
              ...(c.notes || []).map(([en, pt]) => rl("Rulebook", en, "Livro", pt)),
              `<em>${t(c.history[0], c.history[1])}</em>`
            ])}
            ${[...new Set([c.page, ...(c.notes ? [c.id === "tituba" || c.id === "thomas-danforth" || c.id === "george-burroughs" ? 13 : 12] : [])])].map(referenceLink).join(" ")}
          </div>
        </article>`).join("")}</div>`;
  }

  // ---------- nitty gritties ----------

  function rulingsSection() {
    return `
      ${sectionHeading("rulings", t("Nitty Gritties", "Detalhes"), sectionIndex("rulings"), [11, 12, 13])}
      <p class="glossary-intro">${t("The rulebook's clarifications, to look up as needed. Character clarifications are on each character in Town Hall characters.", "Os esclarecimentos do livro, para consultar quando precisar. Os esclarecimentos de personagens estão em cada personagem, em Personagens da Prefeitura.")}</p>
      <div class="quick-grid">
        ${infoCard(t("BLACK CARDS", "CARTAS PRETAS"), t("Drawing them", "Comprando-as"), [
          t("A black card counts as one of the two cards you draw on your turn.", "Uma carta preta conta como uma das duas cartas que você compra no turno."),
          t("Drawn out of turn (by a character's ability): resolve it immediately, then continue where you left off.", "Comprada fora do turno (por habilidade de personagem): resolva-a na hora e continue de onde parou."),
          t("If you draw when the deck has only one card left (Night), you may draw your second card after Night is over.", "Se você comprar quando o baralho só tem uma carta (a Night), pode comprar a segunda depois que a Noite acabar.")
        ], [11])}
        ${infoCard(t("BLACK CAT", "GATO PRETO"), t("After Dawn", "Depois da Alvorada"), [
          t("Contrary to Law 1, the Witches may give themselves the Black Cat at Dawn.", "Contrariando a Lei 1, as Bruxas podem dar o Black Cat a si mesmas na Alvorada."),
          t("After Dawn it is just like any other blue card: Curse can discard it, Scapegoat can move it.", "Depois da Alvorada é igual a qualquer outra carta azul: Curse pode descartá-la, Scapegoat pode movê-la."),
          t("If discarded, it can be drawn and played like any other blue card.", "Se descartada, pode ser comprada e jogada como qualquer outra carta azul."),
          t("If the owner of the Black Cat draws Conspiracy, they choose which of their Tryal cards is revealed.", "Se o dono do Black Cat comprar a Conspiracy, ele escolhe qual das suas cartas Tryal é revelada.")
        ], [5, 11, 12])}
        ${infoCard(t("BLUE CARDS", "CARTAS AZUIS"), t("Only two players left", "Só dois jogadores vivos"), [
          t("All blue cards are discarded from the game.", "Todas as cartas azuis saem do jogo."),
          t("If you are one of the last two and draw a blue card, place it aside and draw a new card instead.", "Se você é um dos dois últimos e compra uma carta azul, deixe-a de lado e compre outra no lugar.")
        ], [12])}
        ${infoCard(t("CONSTABLE", "DELEGADO"), t("The Gavel", "O Martelo"), [
          t("The Constable may never give themselves the Gavel token.", "O Delegado nunca pode dar o Martelo a si mesmo."),
          t("A Constable who is also a Witch is an “evil” Constable and may use the power to help the Witches.", "Um Delegado que também é Bruxa é um Delegado “maligno” e pode usar o poder para ajudar as Bruxas."),
          t("If the Constable card is revealed, that player does not necessarily die, but the Constable role is no longer used in the game.", "Se a carta Constable é revelada, esse jogador não morre necessariamente, mas o papel de Delegado deixa de ser usado na partida.")
        ], [12])}
        ${infoCard(t("MATCHMAKER", "CASAMENTEIRA"), t("Two linked players", "Dois jogadores ligados"), [
          t("If both Matchmaker cards are placed on the same player, they are discarded.", "Se as duas cartas Matchmaker forem colocadas no mesmo jogador, elas são descartadas."),
          t("If one Matchmaker owner is killed during the Night, both die — even if the other confessed or was saved.", "Se um dos donos de Matchmaker morre durante a Noite, os dois morrem — mesmo que o outro tenha confessado ou sido salvo."),
          t("A player matched with Mary Warren still dies when she dies, although Mary is unaffected by Matchmaker.", "Um jogador ligado a Mary Warren ainda morre quando ela morre, embora Mary não seja afetada pela Matchmaker."),
          t("If Matchmaker kills the final non-Witch and eliminates the final Witch card in the same turn, the matched player dies a split-second after the other.", "Se a Matchmaker mata o último não-Bruxo e elimina a última carta Witch no mesmo turno, o jogador ligado morre uma fração de segundo depois do outro.")
        ], [12])}
        ${infoCard(t("PIETY", "PIEDADE"), t("Ways around it", "Como contorná-la"), [
          t("Scapegoat can move red cards from a player onto the player with Piety.", "Scapegoat pode mover cartas vermelhas de um jogador para o jogador com Piety."),
          t("Will Griggs can use an Alibi as a Witness card against the player with Piety.", "Will Griggs pode usar um Alibi como carta Witness contra o jogador com Piety.")
        ], [12])}
        ${infoCard(t("RED CARDS", "CARTAS VERMELHAS"), t("Counting accusations", "Contando acusações"), [
          t("Red cards are placed on a player, not in front of a particular Tryal card.", "As cartas vermelhas são colocadas num jogador, não na frente de uma carta Tryal específica."),
          t("Accusations beyond the amount needed do not carry over to the next Tryal card.", "Acusações além do necessário não passam para a próxima carta Tryal."),
          t("With enough to reveal two Tryal cards on the same player, play the cards to reveal one at a time.", "Com o bastante para revelar duas cartas Tryal do mesmo jogador, jogue as cartas para revelar uma de cada vez.")
        ], [13])}
        ${infoCard(t("SCAPEGOAT & ROBBERY", "SCAPEGOAT E ROBBERY"), t("Only between two other players", "Só entre dois outros jogadores"), [
          t("You may never use them to move your own cards or to receive extra cards.", "Você nunca pode usá-las para mover as próprias cartas ou receber cartas extras."),
          t("They always take cards from one other player and give them to another.", "Elas sempre tiram cartas de um outro jogador e as dão a outro."),
          t("With only two players left they cannot be played: treat them like blue cards (set aside, draw another).", "Com só dois jogadores vivos elas não podem ser jogadas: trate-as como cartas azuis (deixe de lado, compre outra).")
        ], [13])}
        ${infoCard(t("STOCKS", "TRONCO"), t("Skipped turns", "Turnos pulados"), [
          t("Stocks stays in front of the player until they have been skipped, then it is discarded.", "O Stocks fica na frente do jogador até ele ser pulado e então é descartado."),
          t("Scapegoat played on a player with Stocks moves the Stocks too.", "Scapegoat jogado num jogador com Stocks move o Stocks também."),
          t("Two Stocks on one player: skipped twice in a row.", "Dois Stocks no mesmo jogador: pulado duas vezes seguidas.")
        ], [13])}
        ${infoCard(t("WITCH CARDS", "CARTAS WITCH"), t("More than one", "Mais de uma"), [
          t("A player may have more than one Witch card.", "Um jogador pode ter mais de uma carta Witch."),
          t("If one is revealed, the player is dead and must reveal the other Witch card as well.", "Se uma for revelada, o jogador está morto e precisa revelar a outra carta Witch também.")
        ], [13])}
      </div>`;
  }

  // ---------- advanced ----------

  function advancedSection() {
    const active = [
      state.witches === "extra" ? rl("Extra Witches", `${tryal().witch} Witch cards in this match (2 with 4–5 players, 3 with 6–12).`, "Bruxas extras", `${tryal().witch} cartas Witch nesta partida (2 com 4–5 jogadores, 3 com 6–12).`) : "",
      state.conspiracy === "shuffle" ? rl("Conspiracy shuffle", "taken Tryal cards go to the middle, are shuffled and dealt back 1 each.", "Conspiração embaralhada", "as cartas Tryal tiradas vão ao meio, são embaralhadas e devolvidas, 1 para cada.") : "",
      state.deaths === "silent" ? rl("Silent deaths", "the dead do not say whether they ever had a Witch card.", "Mortes silenciosas", "os mortos não dizem se já tiveram carta Witch.") : "",
      state.shortGames === "on" ? rl("Point to two", "against a player with 4–5 Tryal cards left, point to two; they choose which flips. Their reaction may give something away!", "Aponte para duas", "contra um jogador com 4–5 cartas Tryal restantes, aponte para duas; ele escolhe qual vira. A reação dele pode entregar algo!") : ""
    ].filter(Boolean);
    return `
      ${sectionHeading("advanced", t("Advanced rules & tips", "Regras avançadas e dicas"), sectionIndex("advanced"), [14])}
      <div class="quick-grid">
        ${infoCard(t("THIS MATCH", "ESTA PARTIDA"), t("Advanced rules in use", "Regras avançadas em uso"), active.length ? active : [t("None — standard rules. Turn them on in Build your match.", "Nenhuma — regras padrão. Ative-as em Configure a partida.")], [14])}
        ${infoCard(t("TIPS", "DICAS"), t("Masking movement at Dawn and Night", "Disfarçando movimentos na Alvorada e à Noite"), [
          t("Make noise while the Witches work: stomp your feet, pat the table with one hand, play creepy music, hum…", "Façam barulho enquanto as Bruxas agem: batam os pés, batam na mesa com uma mão, ponham música sinistra, cantarolem…"),
          crier() ? t("Everyone stands up before the Night begins, so everyone has easy access to the Kill cards.", "Todos ficam de pé antes da Noite começar, para que todos alcancem as cartas Kill com facilidade.") : "",
          crier() ? t("After the first player dies, let them become the Moderator, taking over the Town Crier's duties.", "Depois que o primeiro jogador morrer, deixe-o virar o Moderador, assumindo as funções do Pregoeiro.") : ""
        ], [14])}
      </div>`;
  }

  // ---------- iconography ----------

  function iconLabel(name) {
    return {
      "tryal-back": t("Tryal card back", "Verso da carta Tryal"),
      "not-a-witch": "Not a Witch",
      witch: "Witch",
      "town-hall-back": t("Town Hall card back", "Verso da carta da Prefeitura"),
      "town-hall-front": t("Town Hall card (character)", "Carta da Prefeitura (personagem)"),
      "playing-back": t("Salem playing card back", "Verso da carta de jogo de Salem"),
      "green-card": t("Green card (Robbery)", "Carta verde (Robbery)"),
      "blue-card": t("Blue card (Asylum)", "Carta azul (Asylum)"),
      "red-card": t("Red card (Accusation)", "Carta vermelha (Accusation)"),
      conspiracy: t("Conspiracy (black card)", "Conspiracy (carta preta)"),
      night: t("Night (black card)", "Night (carta preta)"),
      "black-cat": t("Black Cat", "Black Cat (Gato Preto)"),
      "kill-back": t("Kill card", "Carta Kill"),
      gavel: t("Gavel token", "Marcador Martelo (Gavel)"),
      timer: t("30-second timer", "Ampulheta de 30 segundos")
    }[name] || name;
  }

  function iconCard(file, bodyEn, bodyPt, pages) {
    const title = iconLabel(file);
    const list = Array.isArray(pages) ? pages : [pages];
    return `
      <article class="icon-card">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}.webp" alt="${title}"></span>
        <div><strong>${title}</strong><p>${t(bodyEn, bodyPt)}</p>${list.map(referenceLink).join(" ")}</div>
      </article>`;
  }

  function iconsSection() {
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), sectionIndex("icons"), [2, 5, 6, 7, 8])}
      <p class="glossary-intro">${t("Salem 1692 has no symbol icons: what you need to recognise are the card faces, backs and colours. Each picture below is cut from the rulebook.", "Salem 1692 não tem ícones de símbolos: o que você precisa reconhecer são as faces, os versos e as cores das cartas. Cada imagem abaixo foi recortada do livro de regras.")}</p>
      <h3 class="subhead">${t("Tryal cards", "Cartas Tryal")}</h3>
      <div class="icon-grid">
        ${iconCard("tryal-back", "The face-down side every player shows: “Tryal of Witchcraft”. Keep yours in a row in plain sight.", "O lado virado para baixo que todos mostram: “Tryal of Witchcraft”. Mantenha as suas em fila, à vista.", [2, 6])}
        ${iconCard("not-a-witch", "Revealed: nothing happens (unless it was your last face-down card).", "Revelada: nada acontece (a menos que fosse a sua última carta virada para baixo).", [3, 6])}
        ${iconCard("witch", "Owning one makes you a Witch for good; revealed, it kills its owner.", "Ter uma faz de você Bruxa para sempre; revelada, mata quem a tem.", [3, 6])}
      </div>
      <h3 class="subhead">${t("Characters and playing cards", "Personagens e cartas de jogo")}</h3>
      <div class="icon-grid">
        ${iconCard("town-hall-back", "Back of the 15 Town Hall cards.", "Verso das 15 cartas da Prefeitura.", [2, 4])}
        ${iconCard("town-hall-front", "Face of a Town Hall card: portrait, name and special ability. Kept face up.", "Face de uma carta da Prefeitura: retrato, nome e habilidade especial. Fica virada para cima.", [4])}
        ${iconCard("playing-back", "Back of the 59 Salem playing cards (the deck).", "Verso das 59 cartas de jogo de Salem (o baralho).", [2])}
        ${iconCard("green-card", "Green border: discarded after use.", "Borda verde: descartada depois do uso.", [5])}
        ${iconCard("blue-card", "Blue border: stays in front of a player until they die or it is moved/discarded.", "Borda azul: fica na frente de um jogador até ele morrer ou ela ser movida/descartada.", [5])}
        ${iconCard("red-card", "Red border: accusations, stay until the player reaches 7.", "Borda vermelha: acusações, ficam até o jogador chegar a 7.", [5])}
        ${iconCard("conspiracy", "Black: revealed and resolved immediately; players swap Tryal cards.", "Preta: revelada e resolvida na hora; os jogadores trocam cartas Tryal.", [7])}
        ${iconCard("night", "Black, always the bottom card: the Witches kill, the Constable saves.", "Preta, sempre a carta do fundo: as Bruxas matam, o Delegado salva.", [8])}
        ${iconCard("black-cat", "The Black Cat card's picture: given by the Witches at Dawn; its owner goes first and is targeted by Conspiracy.", "A figura da carta Black Cat: dada pelas Bruxas na Alvorada; o dono começa e é o alvo da Conspiração.", [2, 4, 7])}
      </div>
      <h3 class="subhead">${t("Other components", "Outros componentes")}</h3>
      <div class="icon-grid">
        ${crier() ? iconCard("kill-back", "Black Kill card, one per character: the Witches set one apart at Night to choose their victim.", "Carta preta Kill, uma por personagem: as Bruxas separam uma à Noite para escolher a vítima.", [2, 8]) : ""}
        ${iconCard("gavel", "Placed by the Constable next to another player at Night: that player cannot be killed this Night.", "Colocado pelo Delegado ao lado de outro jogador à Noite: esse jogador não pode morrer nesta Noite.", [2, 8, 9])}
        ${iconCard("timer", "30 seconds: delays (Law 3) and the Confess window at Night.", "30 segundos: demoras (Lei 3) e o tempo para Confessar à Noite.", [2, 9, 10])}
      </div>`;
  }

  // ---------- examples ----------

  function examplesSection() {
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), sectionIndex("examples"), [6, 11, 12, 13])}
      <div class="quick-grid sl-example-grid">
        ${infoCard(t("RULEBOOK EXAMPLE", "EXEMPLO DO LIVRO"), t("Townspeople win", "Os Cidadãos vencem"), [
          figure("tryal-row", t("Rules p. 6: the last Witch card is revealed", "Regras p. 6: a última carta Witch é revelada")),
          t("A player's row shows red Tryal backs and a revealed Not a Witch. The next card flipped says Witch.", "A fila de um jogador mostra versos Tryal vermelhos e um Not a Witch revelado. A próxima carta virada diz Witch."),
          t("That player dies. If it was the last unrevealed Witch card in the game, the Townspeople win at once — even if former Witches are still alive.", "Esse jogador morre. Se era a última carta Witch não revelada da partida, os Cidadãos vencem na hora — mesmo que ex-Bruxas ainda estejam vivas.")
        ], [6])}
        ${infoCard(t("RULEBOOK EXAMPLE", "EXEMPLO DO LIVRO"), t("Evidence on 6 accusations", "Evidence sobre 6 acusações"), [
          t("A player already has 6 accusations in front of them; you play an Evidence card on them.", "Um jogador já tem 6 acusações à sua frente; você joga uma carta Evidence nele."),
          t("That passes 7: you choose one of their Tryal cards and reveal it.", "Isso passa de 7: você escolhe uma das cartas Tryal dele e a revela."),
          t("All red cards in front of them are discarded; the extra accusations do not carry over to the next Tryal card.", "Todas as cartas vermelhas na frente dele são descartadas; as acusações extras não passam para a próxima carta Tryal.")
        ], [13])}
        ${infoCard(t("RULEBOOK EXAMPLE", "EXEMPLO DO LIVRO"), t("Drawing the last card", "Comprando a última carta"), [
          t("You choose to draw 2 cards, but the deck has only one card left: Night.", "Você escolhe comprar 2 cartas, mas o baralho só tem uma carta: a Night."),
          t("Resolve the whole Night. Then the discard pile is shuffled into a new deck (Night at the bottom) and you draw your second card.", "Resolva a Noite inteira. Depois o descarte é embaralhado num novo baralho (Night no fundo) e você compra a segunda carta.")
        ], [9, 11])}
        ${infoCard(t("RULEBOOK EXAMPLE", "EXEMPLO DO LIVRO"), t("Matchmaker at Night", "Matchmaker à Noite"), [
          t("Two players are matched. At Night the Witches kill one of them; the other had the Gavel.", "Dois jogadores estão ligados. À Noite as Bruxas matam um deles; o outro tinha o Martelo."),
          t("Both die: the Gavel, a Confession or being saved does not protect the matched partner.", "Os dois morrem: o Martelo, uma Confissão ou ser salvo não protegem o parceiro ligado.")
        ], [12])}
        ${infoCard(t("RULEBOOK EXAMPLE", "EXEMPLO DO LIVRO"), t("Thomas Danforth vs George Burroughs", "Thomas Danforth contra George Burroughs"), [
          t("Thomas plays accusations on George: he needs 7 accusations to reveal one of George's Tryal cards.", "Thomas joga acusações em George: ele precisa de 7 acusações para revelar uma das cartas Tryal de George.")
        ], [13])}
      </div>`;
  }

  // ---------- guide's readings ----------

  function faqSection() {
    const items = [
      [t("Is my hand secret? Is there a hand limit?", "A minha mão é secreta? Há limite de cartas?"), t("The rulebook states neither. The guide keeps hands hidden (Robbery and death move hand cards without revealing them) and applies no limit.", "O livro não diz nenhum dos dois. O guia mantém as mãos escondidas (Robbery e a morte movem cartas da mão sem revelá-las) e não aplica limite."), 5],
      [t("Where does a resolved black card go?", "Para onde vai uma carta preta resolvida?"), t("Not stated for Conspiracy. The guide discards it, so it returns to the deck when the discard pile is reshuffled after a Night. Night itself goes back to the bottom of the new deck.", "Não é dito para a Conspiracy. O guia a descarta, então ela volta ao baralho quando o descarte é reembaralhado depois de uma Noite. A Night volta ao fundo do novo baralho."), 9],
      [t("What happens to a dead player's red cards?", "O que acontece com as cartas vermelhas de um morto?"), t("The rulebook names only the hand and blue cards. The guide discards red cards in front of the dead player too, since they can no longer reveal anything.", "O livro só cita a mão e as cartas azuis. O guia descarta também as cartas vermelhas na frente do morto, pois elas não podem mais revelar nada."), 6],
      [t("Can a player confess with a Witch card?", "Dá para confessar com uma carta Witch?"), t("Confessing reveals one of your own Tryal cards, and the normal rule applies: a revealed Witch card means death. Choose a card you know is safe.", "Confessar revela uma das suas cartas Tryal, e a regra normal vale: carta Witch revelada significa morte. Escolha uma carta que você sabe que é segura."), 6],
      ...(crier() ? [
        [t("What if the Town Crier dies?", "E se o Pregoeiro morrer?"), t("The rulebook recommends turning the first dead player into the Moderator; the guide does the same when the Town Crier dies — they keep running the Nights, now with eyes open, using the Moderator script.", "O livro recomenda transformar o primeiro morto em Moderador; o guia faz o mesmo quando o Pregoeiro morre — ele continua conduzindo as Noites, agora de olhos abertos, com o roteiro do Moderador."), 14],
        [t("What happens to the Gavel and Kill cards after a Night?", "O que acontece com o Martelo e as cartas Kill depois de uma Noite?"), t("Not stated. The guide returns the Gavel to the middle and rebuilds the face-up Kill stack for the next Night with only the living characters.", "Não é dito. O guia devolve o Martelo ao meio e refaz a pilha de cartas Kill virada para cima para a próxima Noite só com os personagens vivos."), 8]
      ] : []),
      ...(state.witches === "extra" ? [[t("Where do the extra Witch cards come from?", "De onde vêm as cartas Witch extras?"), t("The rulebook only gives the number of Witches. To keep the same number of Tryal cards per player, the guide leaves out one Not a Witch card for each extra Witch card. If your box does not have enough Witch cards, play with the standard count.", "O livro só dá o número de Bruxas. Para manter o mesmo número de cartas Tryal por jogador, o guia deixa de fora uma carta Not a Witch para cada carta Witch extra. Se a sua caixa não tiver cartas Witch suficientes, jogue com o número padrão."), 14]] : []),
      ...(state.shortGames === "on" ? [[t("When does “point to two” apply?", "Quando vale o “aponte para duas”?"), t("Whenever another player would choose one of your Tryal cards to reveal (7th accusation, Conspiracy's Black Cat step) while you have 4 or 5 Tryal cards left. It does not apply to Confessing, where you already choose.", "Sempre que outro jogador fosse escolher uma das suas cartas Tryal para revelar (7ª acusação, passo do Gato Preto da Conspiração) enquanto você tiver 4 ou 5 cartas Tryal restantes. Não vale para Confessar, quando você já escolhe."), 14]] : []),
      [t("Conspiracy: what if the player on my left is dead?", "Conspiração: e se o jogador à minha esquerda estiver morto?"), t("Not stated. The guide skips dead players: take from the nearest living player on your left.", "Não é dito. O guia pula os mortos: pegue do jogador vivo mais próximo à sua esquerda."), 7],
      [t("What if the Witches point to different victims?", "E se as Bruxas apontarem para vítimas diferentes?"), t("Not stated. The guide has them agree silently on one victim before the Kill card is set apart (or before the Moderator accepts it).", "Não é dito. O guia faz com que elas combinem em silêncio uma única vítima antes de separar a carta Kill (ou antes de o Moderador aceitá-la)."), 8],
      [t("Where does the Gavel go after a Night?", "Para onde vai o Martelo depois de uma Noite?"), t("Not stated. The guide returns it to the middle of the table for the next Night.", "Não é dito. O guia o devolve ao meio da mesa para a próxima Noite."), 9],
      [t("Who opens their eyes when nobody holds the Constable card any more?", "Quem abre os olhos quando ninguém mais tem a carta Constable?"), t("Once the Constable card is revealed the role is no longer used, so the Constable step of the Night is skipped.", "Depois que a carta Constable é revelada o papel deixa de ser usado, então o passo do Delegado na Noite é pulado."), 12]
    ];
    return `
      ${sectionHeading("faq", t("Guide's readings", "Leituras do guia"), sectionIndex("faq"), [5, 6, 9])}
      <p class="glossary-intro">${t("Where the rulebook is silent, this guide states its own reading, labelled as such.", "Onde o livro é omisso, este guia dá a sua própria leitura, identificada como tal.")}</p>
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
      { term: ["Tryal card", "Carta Tryal (Julgamento)"], text: ["Your secret identity cards, face down in a row: Not a Witch, Witch or Constable.", "As suas cartas secretas de identidade, viradas para baixo em fila: Not a Witch, Witch ou Constable."], page: 3 },
      { term: ["Witch", "Bruxa (Witch)"], text: ["Anyone who has owned a Witch Tryal card at any point in the game.", "Qualquer um que tenha tido uma carta Tryal Witch em algum momento da partida."], page: 6 },
      { term: ["Townspeople", "Cidadãos (Townspeople)"], text: ["Players who have never had a Witch card.", "Jogadores que nunca tiveram uma carta Witch."], page: 6 },
      { term: ["Constable", "Delegado (Constable)"], text: ["Whoever currently holds the Constable Tryal card; places the Gavel at Night to save another player.", "Quem tem a carta Tryal Constable no momento; põe o Martelo à Noite para salvar outro jogador."], page: 3 },
      { term: ["Gavel token", "Martelo (Gavel)"], text: ["The Constable's protection: the player next to it cannot be killed this Night.", "A proteção do Delegado: o jogador ao lado dele não pode morrer nesta Noite."], page: 9 },
      crier()
        ? { term: ["Town Crier", "Pregoeiro (Town Crier)"], text: ["A player who also directs the closing and opening of eyes at Dawn and Night.", "Um jogador que também conduz o fechar e abrir de olhos na Alvorada e à Noite."], page: 3 }
        : { term: ["Moderator", "Moderador"], text: ["A non-player who runs Dawn and Night with eyes open, using the Moderator script.", "Alguém que não joga e conduz a Alvorada e a Noite de olhos abertos, com o roteiro do Moderador."], page: 3 },
      { term: ["Dawn", "Alvorada (Dawn)"], text: ["Once, at the start: the Witches meet and give the Black Cat.", "Uma vez, no início: as Bruxas se conhecem e dão o Black Cat."], page: 4 },
      { term: ["Night", "Noite (Night)"], text: ["The bottom card of the deck; the Witches kill, the Constable saves.", "A carta do fundo do baralho; as Bruxas matam, o Delegado salva."], page: 8 },
      { term: ["Conspiracy", "Conspiração (Conspiracy)"], text: state.conspiracy === "shuffle" ? ["Black card: reveal one of the Black Cat owner's Tryal cards, then everyone takes a Tryal card from the left into the middle; they are shuffled and dealt back 1 each.", "Carta preta: revele uma carta Tryal do dono do Black Cat; depois todos pegam uma carta Tryal da esquerda e a põem no meio; elas são embaralhadas e devolvidas, 1 para cada."] : ["Black card: reveal one of the Black Cat owner's Tryal cards, then everyone takes a Tryal card from the left.", "Carta preta: revele uma carta Tryal do dono do Black Cat; depois todos pegam uma carta Tryal da esquerda."], page: 7 },
      { term: ["Confess", "Confessar"], text: ["At Night, reveal one of your own Tryal cards before the timer runs out to be immune to the Kill.", "À Noite, revelar uma das próprias cartas Tryal antes da ampulheta acabar para ficar imune à morte."], page: 9 },
      { term: ["Accusation", "Acusação"], text: ["The count on red cards; 7 in front of a player reveal one of their Tryal cards.", "A contagem das cartas vermelhas; 7 na frente de um jogador revelam uma das suas cartas Tryal."], page: 5 },
      { term: ["Black Cat", "Gato Preto (Black Cat)"], text: ["Given at Dawn by the Witches; its owner goes first and loses a Tryal card when Conspiracy is drawn. Afterwards a normal blue card.", "Dado na Alvorada pelas Bruxas; o dono começa e perde uma carta Tryal quando a Conspiração é comprada. Depois é uma carta azul normal."], page: 5 },
      crier() ? { term: ["Kill card", "Carta Kill (Morte)"], text: ["Black card matching a Town Hall character; the Witches set one apart at Night to mark their victim.", "Carta preta correspondente a um personagem da Prefeitura; as Bruxas separam uma à Noite para marcar a vítima."], page: 8 } : null,
      { term: ["Town Hall card", "Carta da Prefeitura (Town Hall)"], text: ["Your public character and special ability.", "O seu personagem público e a habilidade especial."], page: 4 },
      { term: ["Last words", "Últimas palavras"], text: ["Three words a dying player may say before falling silent.", "Três palavras que quem morre pode dizer antes de se calar."], page: 10 },
      { term: ["Shunned", "Rechaçado"], text: ["What happens to dead players who keep communicating.", "O que acontece com mortos que continuam se comunicando."], page: 10 }
    ].filter(Boolean);
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), sectionIndex("glossary"), [3, 5, 9])}
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
    document.body.classList.add("theme-salem");
    document.documentElement.lang = state.language;
    document.title = t("Salem 1692 — Field Manual", "Salem 1692 — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Salem 1692: hidden Witches for 4–12 players — setup checklist by player count, Town Crier or Moderator, turns, accusations, Conspiracy, Night, the 5 Laws, the 15 characters and the advanced rules.",
        "Regras interativas bilíngues de Salem 1692: Bruxas ocultas para 4–12 jogadores — lista de preparação por número de jogadores, Pregoeiro ou Moderador, turnos, acusações, Conspiração, Noite, as 5 Leis, os 15 personagens e as regras avançadas."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook", "Livro interativo")}</p>
          <h1>Salem 1692</h1>
          <p class="hero-intro">${t(
            "The year is 1692 in Salem, Massachusetts, and some of your neighbours are Witches. Draw and play cards to accuse the players you do not trust and help those you think are on your side. Reveal every Witch card before the Witches kill the innocent — and beware the Conspiracy, which may turn a friend into a Witch.",
            "É 1692 em Salem, Massachusetts, e alguns dos seus vizinhos são Bruxas. Compre e jogue cartas para acusar quem você não confia e ajudar quem parece estar do seu lado. Revele todas as cartas Witch antes que as Bruxas matem os inocentes — e cuidado com a Conspiração, que pode transformar um amigo em Bruxa."
          )}</p>
          <div class="hero-meta"><span>${t("4–12 players", "4–12 jogadores")}</span><span>${t("20–40 minutes", "20–40 minutos")}</span><span>${t("Hidden roles", "Papéis ocultos")}</span><span>Facade Games</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/salem-1692.webp" alt="${t("Cover of the Salem 1692 rulebook", "Capa do livro de regras de Salem 1692")}" fetchpriority="high"><figcaption>${t("Rulebook cover · Facade Games", "Capa do livro de regras · Facade Games")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("The town", "A cidade")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column sl-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          <p class="sl-secret"><strong>${t("Secrets stay at the table.", "Os segredos ficam na mesa.")}</strong> ${t(
            "This guide never asks for, shows or stores who holds a Witch or Constable card. It saves only the match options and the setup checkmarks on this device, so you can leave it open where everyone can see it.",
            "Este guia nunca pergunta, mostra ou salva quem tem uma carta Witch ou Constable. Ele salva só as opções da partida e as marcações da preparação neste aparelho, então pode ficar aberto à vista de todos."
          )}</p>
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied English rulebook of Salem 1692 (Facade Games, Dark Cities series). Its page numbers match the PDF pages. The rulebook does not print the playing-card texts or the Town Hall abilities: those are read on the cards. Points marked “Guide's reading” are interpretations where the rulebook is silent.",
            "Este guia cobre o livro de regras em inglês fornecido de Salem 1692 (Facade Games, série Dark Cities). As páginas do livro coincidem com as do PDF. O livro não traz o texto das cartas de jogo nem as habilidades da Prefeitura: elas são lidas nas cartas. Trechos marcados como “Leitura do guia” são interpretações onde o livro é omisso. Os componentes são em inglês, por isso os nomes impressos aparecem entre parênteses."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${victorySection()}</section>
          <section class="rule-section">${turnSection()}</section>
          <section class="rule-section">${cardsSection()}</section>
          <section class="rule-section">${conspiracySection()}</section>
          <section class="rule-section">${nightSection()}</section>
          <section class="rule-section">${lawsSection()}</section>
          <section class="rule-section">${charactersSection()}</section>
          <section class="rule-section">${rulingsSection()}</section>
          <section class="rule-section">${advancedSection()}</section>
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${faqSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the Salem 1692 rulebook. Salem 1692 is a game by Travis Hancock, with graphic design by Holly Hancock and illustrations by Sarah Keele, published by Facade Games.",
        "Guia pessoal de consulta baseado no livro de regras de Salem 1692. Salem 1692 é um jogo de Travis Hancock, com design gráfico de Holly Hancock e ilustrações de Sarah Keele, publicado pela Facade Games."
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
      root.querySelector(".sl-page")?.prepend(notice);
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
    ["players", "players", (value) => Number(value), PLAYERS],
    ["facilitator", "facilitator", (value) => value, FACILITATORS],
    ["townhall", "townHall", (value) => value, TOWN_HALL],
    ["witches", "witches", (value) => value, WITCHES],
    ["conspiracy", "conspiracy", (value) => value, CONSPIRACY],
    ["deaths", "deaths", (value) => value, DEATHS],
    ["short", "shortGames", (value) => value, SHORT_GAMES]
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

  window.Salem1692 = { renderInto, onClick, onChange };
})();
