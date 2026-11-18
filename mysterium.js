(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.mysterium.v1";
  const SETUP_KEY = "field-manual.mysterium.setup.v1";
  const MANUAL_FILE = "mysterium_core.pdf";
  const ASSETS = "assets/mysterium/";
  const ICONS = `${ASSETS}icons/`;
  const ART = `${ASSETS}art/`;
  // The PDF page number equals the printed page number (cover = page 1, rules start on page 5).
  const PLAYERS = [2, 3, 4, 5, 6, 7];
  const DIFFICULTIES = ["easy", "medium", "hard"];
  // Rulebook p. 8: character/location/object cards laid on the table, by difficulty and player count 2–7.
  const CARD_TABLE = {
    easy: [4, 5, 5, 6, 6, 7],
    medium: [5, 6, 6, 7, 8, 8],
    hard: [6, 7, 7, 8, 9, 9]
  };
  const defaults = { language: "pt-BR", players: 5, difficulty: "easy" };
  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------

  function normalizePreferences(saved) {
    const players = Number(saved?.players);
    return {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      players: PLAYERS.includes(players) ? players : defaults.players,
      difficulty: DIFFICULTIES.includes(saved?.difficulty) ? saved.difficulty : defaults.difficulty
    };
  }

  function signature(source = state) {
    return `${source.players}|${source.difficulty}`;
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Mysterium preferences.", error);
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
      console.error("Could not read Mysterium setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Mysterium preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Mysterium setup progress.", error);
    }
  }

  // ---------- derived match values ----------

  function psychicCount(players = state.players) {
    if (players === 2) {
      return 2;
    }
    if (players === 3) {
      return 4;
    }
    return players - 1;
  }

  function usesTrack(players = state.players) {
    return players >= 4;
  }

  function smallGame(players = state.players) {
    return players <= 3;
  }

  function tokensPerPsychic(players = state.players) {
    if (players <= 3) {
      return 0;
    }
    return players <= 5 ? 4 : 6;
  }

  function cardCount(players = state.players, difficulty = state.difficulty) {
    return CARD_TABLE[difficulty][players - 2];
  }

  function crowCount(difficulty = state.difficulty) {
    return difficulty === "medium" ? 3 : 1;
  }

  function groupCount(players = state.players) {
    return players === 2 ? 4 : psychicCount(players);
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function manualUrl(page) {
    const script = document.querySelector('script[src*="mysterium.js"]');
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
          <p class="eyebrow">${t("SÉANCE", "SESSÃO ESPÍRITA")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="mys-section-references">${pages.map(referenceLink).join("")}</div>
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
      check: t("✓ token", "ficha ✓"),
      cross: t("✗ token", "ficha ✗"),
      crow: t("Crow marker", "Marcador de Corvo"),
      "level-low": t("Low level (1 card)", "Nível baixo (1 carta)"),
      "level-intermediate": t("Intermediate level (2 cards)", "Nível intermediário (2 cartas)"),
      "level-high": t("High level (3 cards)", "Nível alto (3 cartas)")
    };
    return `<img class="mys-glyph" src="${ICONS}${name}.webp" alt="${labels[name]}" title="${labels[name]}">`;
  }

  function iconCard(file, titleEn, bodyEn, titlePt, bodyPt, pages, wide = false) {
    const title = t(titleEn, titlePt);
    const list = Array.isArray(pages) ? pages : [pages];
    return `
      <article class="icon-card${wide ? " mys-icon-wide" : ""}">
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
    return `<figure class="mys-art"><img src="${ART}${file}.webp" alt="${alt}" loading="lazy"><figcaption>${alt}</figcaption></figure>`;
  }

  function interpretation(en, pt) {
    return `<span class="mys-interpretation">${t("Guide's reading", "Leitura do guia")}</span> ${t(en, pt)}`;
  }

  function difficultyName(value = state.difficulty) {
    return {
      easy: t("Easy", "Fácil"),
      medium: t("Medium", "Médio"),
      hard: t("Hard", "Difícil")
    }[value];
  }

  function crowRule(value = state.difficulty) {
    return {
      easy: t("once per turn (1 crow, removed at the end of the turn)", "uma vez por turno (1 corvo, retirado no fim do turno)"),
      medium: t("up to 3 times per game (3 crows)", "até 3 vezes por partida (3 corvos)"),
      hard: t("once per game (1 crow)", "uma vez por partida (1 corvo)")
    }[value];
  }

  function playersLabel(players = state.players) {
    return t(`${players} players`, `${players} jogadores`);
  }

  function psychicPlayersText(players = state.players) {
    if (players === 2) {
      return t("1 ghost + 1 player who runs 2 psychics", "1 fantasma + 1 jogador que conduz 2 médiuns");
    }
    if (players === 3) {
      return t("1 ghost + 2 players who run 2 psychics each (4 psychics)", "1 fantasma + 2 jogadores que conduzem 2 médiuns cada (4 médiuns)");
    }
    return t(`1 ghost + ${players - 1} psychics`, `1 fantasma + ${players - 1} médiuns`);
  }

  function matchSummary() {
    return `${playersLabel()} · ${difficultyName()}`;
  }

  // ---------- header ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["victory", t("Winning & losing", "Vitória e derrota")],
      ["phase-1", t("Phase 1 · Hours", "Fase 1 · Horas")],
      ["phase-2", t("Phase 2 · Culprit", "Fase 2 · Culpado")],
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
          <span class="brand-mark" aria-hidden="true">MY</span>
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
      <label class="mys-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" ${dataAttr} ${checked ? "checked" : ""}>
        <span class="mys-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function playerChoiceText(players) {
    const psychics = psychicCount(players);
    if (players === 2) {
      return t(
        "1 ghost and 1 player who runs 2 psychics (2 colours). The clairvoyancy track, level markers and clairvoyancy tokens stay in the box. At the end, 2 random groups are added (4 groups), the 3 shared-vision cards are face up and the psychic player picks a group with one intuition token.",
        "1 fantasma e 1 jogador que conduz 2 médiuns (2 cores). A trilha de clarividência, os marcadores de nível e as fichas de clarividência ficam na caixa. No final, 2 grupos aleatórios são somados (4 grupos), as 3 cartas da visão compartilhada ficam viradas para cima e o jogador escolhe um grupo com uma ficha de intuição."
      );
    }
    if (players === 3) {
      return t(
        "1 ghost and 2 players who run 2 psychics each (4 colours). No clairvoyancy track, level markers or clairvoyancy tokens. At the end the 3 shared-vision cards are face up and the two psychic players vote openly, agreeing on one group.",
        "1 fantasma e 2 jogadores que conduzem 2 médiuns cada (4 cores). Sem trilha de clarividência, marcadores de nível nem fichas de clarividência. No final as 3 cartas da visão compartilhada ficam viradas para cima e os dois jogadores votam abertamente, combinando um grupo."
      );
    }
    const tokens = tokensPerPsychic(players);
    return t(
      `1 ghost and ${psychics} psychics, one colour each. Each psychic gets ${tokens} clairvoyancy tokens (numbered 1–${tokens}) and a level marker on the clairvoyancy track, set up for ${players <= 5 ? "4–5" : "6–7"} players. The final vote is secret, staggered by clairvoyancy level.`,
      `1 fantasma e ${psychics} médiuns, uma cor cada. Cada médium recebe ${tokens} fichas de clarividência (numeradas de 1 a ${tokens}) e um marcador de nível na trilha de clarividência, montada para ${players <= 5 ? "4–5" : "6–7"} jogadores. A votação final é secreta e escalonada pelo nível de clarividência.`
    );
  }

  function difficultyChoiceText(value) {
    const cards = cardCount(state.players, value);
    const crows = crowCount(value);
    return t(
      `${cards} character, ${cards} location and ${cards} object cards on the table at ${state.players} players. The ghost may discard and redraw vision cards ${crowRule(value)}. Uses ${crows} crow marker${crows > 1 ? "s" : ""}.${value === "easy" ? " Recommended for your first game, with a ghost who already knows the game." : ""}`,
      `${cards} cartas de personagem, ${cards} de local e ${cards} de objeto na mesa com ${state.players} jogadores. O fantasma pode descartar e recomprar cartas de visão ${crowRule(value)}. Usa ${crows} marcador${crows > 1 ? "es" : ""} de Corvo.${value === "easy" ? " Recomendado para a primeira partida, com um fantasma que já conheça o jogo." : ""}`
    );
  }

  function matchConfiguration() {
    return `
      <section class="controls-panel mys-config" id="build-match" aria-labelledby="mys-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="mys-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "Mysterium has no expansions or variants in the supplied rulebook. Two choices change the setup and rules: the number of players (2–3 players use special rules) and the difficulty level. Who plays the ghost and which psychic colour each player takes are decided at the table (setup step 1), so they are not stored. This page never asks for or stores the ghost's secret cards.",
              "Mysterium não tem expansões nem variantes no livro de regras fornecido. Duas escolhas mudam a preparação e as regras: o número de jogadores (2–3 jogadores usam regras especiais) e o nível de dificuldade. Quem será o fantasma e qual cor de médium cada jogador pega são decididos à mesa (etapa 1 da preparação), por isso não ficam salvos. Esta página nunca pede nem guarda as cartas secretas do fantasma."
            )}</p>
          </div>
        </div>
        <fieldset class="mys-choice-group">
          <legend>${t("Players · selected:", "Jogadores · selecionado:")} <span>${playersLabel()} — ${psychicPlayersText()}</span></legend>
          <p class="mys-choice-intro">${t(
            "Count everyone at the table, including the ghost. Box: 2 to 7 players.",
            "Conte todos à mesa, inclusive o fantasma. Caixa: de 2 a 7 jogadores."
          )} ${referenceLink(6)} ${referenceLink(12)}</p>
          <div class="mys-choice-grid">
            ${PLAYERS.map((players) => choiceCard("mys-players", players, `data-players="${players}"`, state.players === players, playersLabel(players), playerChoiceText(players))).join("")}
          </div>
        </fieldset>
        <fieldset class="mys-choice-group">
          <legend>${t("Difficulty · selected:", "Dificuldade · selecionado:")} <span>${difficultyName()} — ${t(`${cardCount()} cards of each type`, `${cardCount()} cartas de cada tipo`)}</span></legend>
          <p class="mys-choice-intro">${t(
            "The difficulty sets how many suspects, locations and objects are laid out (more cards = harder to tell apart) and how often the ghost may discard vision cards to draw new ones.",
            "A dificuldade define quantos suspeitos, locais e objetos são dispostos (mais cartas = mais difícil distinguir) e com que frequência o fantasma pode descartar cartas de visão para comprar novas."
          )} ${referenceLink(8)} ${referenceLink(9)}</p>
          <div class="mys-choice-grid mys-choice-grid-3">
            ${DIFFICULTIES.map((value) => choiceCard("mys-difficulty", value, `data-difficulty="${value}"`, state.difficulty === value, `<img class="mys-badge" src="${ICONS}${value}.webp" alt=""> ${difficultyName(value)}`, difficultyChoiceText(value))).join("")}
          </div>
        </fieldset>
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function setupPhases() {
    const psychics = psychicCount();
    const cards = cardCount();
    const tokens = tokensPerPsychic();
    const phases = [
      {
        id: "roles",
        title: t("Roles and psychic colours", "Papéis e cores dos médiuns"),
        pages: [5, 6, 12],
        items: [
          t("Decide together who plays the ghost. Everyone else plays psychics.", "Decidam juntos quem será o fantasma. Todos os demais jogam como médiuns."),
          state.players === 2
            ? t("The other player runs 2 psychics: they choose 2 of the 6 colours (purple, yellow, blue, black, red, white).", "O outro jogador conduz 2 médiuns: ele escolhe 2 das 6 cores (roxo, amarelo, azul, preto, vermelho, branco).")
            : state.players === 3
              ? t("Each of the 2 other players runs 2 psychics: each chooses 2 of the 6 colours (purple, yellow, blue, black, red, white), 4 colours in all.", "Cada um dos 2 outros jogadores conduz 2 médiuns: cada um escolhe 2 das 6 cores (roxo, amarelo, azul, preto, vermelho, branco), 4 cores no total.")
              : t(`Each of the ${psychics} psychics chooses one of the 6 colours (purple, yellow, blue, black, red, white). Each colour matches a psychic shown on the sleeves.`, `Cada um dos ${psychics} médiuns escolhe uma das 6 cores (roxo, amarelo, azul, preto, vermelho, branco). Cada cor corresponde a um médium retratado nas capas (sleeves).`),
          t("The ghost sits behind the game screen; the psychics sit around the cards in the middle of the table.", "O fantasma senta-se atrás do biombo (game screen); os médiuns sentam-se em volta das cartas no meio da mesa.")
        ]
      },
      {
        id: "kits",
        title: t(`Psychic kits (${psychics} colours)`, `Kits dos médiuns (${psychics} cores)`),
        pages: [6],
        items: [
          t(`For each colour in play, take 1 intuition token (the coloured figure) and 1 sleeve. ${smallGame() ? "A player who runs 2 psychics keeps both sets in front of them." : "Each psychic keeps them in front of them."}`, `Para cada cor em jogo, pegue 1 ficha de intuição (a figura colorida) e 1 sleeve (capa). ${smallGame() ? "Quem conduz 2 médiuns mantém os dois conjuntos à sua frente." : "Cada médium os mantém à sua frente."}`),
          usesTrack()
            ? t(`For each colour, also take 1 clairvoyancy level marker and the ${tokens} clairvoyancy tokens of that colour numbered 1 to ${tokens} on the back (the front shows ✓ or ✗).${psychics < 6 || tokens < 6 ? " Return the other clairvoyancy tokens to the box." : ""}`, `Para cada cor, pegue também 1 marcador de nível de clarividência e as ${tokens} fichas de clarividência dessa cor numeradas de 1 a ${tokens} no verso (a frente mostra ✓ ou ✗).${psychics < 6 || tokens < 6 ? " Devolva à caixa as outras fichas de clarividência." : ""}`)
            : t("Do not take clairvoyancy level markers or clairvoyancy tokens: with 2–3 players they are not used.", "Não pegue marcadores de nível nem fichas de clarividência: com 2–3 jogadores eles não são usados."),
          psychics < 6 ? t("Return the intuition tokens, sleeves and level markers of unused colours to the box.", "Devolva à caixa as fichas de intuição, sleeves e marcadores de nível das cores não usadas.") : t("All 6 colours are in play.", "As 6 cores estão em jogo.")
        ]
      },
      {
        id: "table",
        title: t("Clock, sand timer and progress boards", "Relógio, ampulheta e tabuleiros de progresso"),
        pages: [6, 7, 9],
        items: [
          t("Place the clock board and set the hour hand to I (1h).", "Coloque o tabuleiro do relógio e acerte o ponteiro das horas no I (1h)."),
          usesTrack() ? t("The space below the clock is the discard area for used clairvoyancy tokens.", "O espaço abaixo do relógio é a área de descarte das fichas de clarividência usadas.") : null,
          t("Put the 2-minute sand timer next to the ghost.", "Ponha a ampulheta de 2 minutos ao lado do fantasma."),
          t("Lay the 4 progress boards in a row in the middle of the table, leaving room below each for a column of cards: character, location, object, then the epilogue progress board (with its culprit space and mission accomplished space).", "Disponha os 4 tabuleiros de progresso em fila no meio da mesa, deixando espaço abaixo de cada um para uma coluna de cartas: personagem, local, objeto e por fim o tabuleiro de epílogo (com o espaço do culpado e o espaço de missão cumprida)."),
          t("Place every intuition token in play on the character progress board.", "Coloque todas as fichas de intuição em jogo no tabuleiro de progresso de personagem.")
        ]
      }
    ];
    if (usesTrack()) {
      phases.push({
        id: "track",
        title: t(`Clairvoyancy track (${state.players <= 5 ? "4–5" : "6–7"} players)`, `Trilha de clarividência (${state.players <= 5 ? "4–5" : "6–7"} jogadores)`),
        pages: [6, 7, 11],
        items: [
          t("Place the clairvoyancy track near the progress boards.", "Coloque a trilha de clarividência perto dos tabuleiros de progresso."),
          t(`Assemble its pieces as pictured on p. 7 for ${state.players <= 5 ? "4–5" : "6–7"} players (the rulebook shows it only as a photo, reproduced in this step below).`, `Monte as peças como na foto da p. 7 para ${state.players <= 5 ? "4–5" : "6–7"} jogadores (o livro mostra isso só como foto, reproduzida abaixo nesta etapa).`),
          state.players <= 5
            ? t("On the 4–5 player setup, the track shows a 1-card symbol on space 0, a 2-card symbol on space 5 and a 3-card symbol on space 7: Low = spaces 0–4, Intermediate = 5–6, High = 7 and beyond.", "Na montagem para 4–5 jogadores, a trilha mostra um símbolo de 1 carta no espaço 0, de 2 cartas no espaço 5 e de 3 cartas no espaço 7: Baixo = espaços 0–4, Intermediário = 5–6, Alto = 7 em diante.")
            : t("With 6–7 players the level limits change (p. 11): the 2-card and 3-card symbols printed on the assembled track show where Intermediate and High begin.", "Com 6–7 jogadores os limites dos níveis mudam (p. 11): os símbolos de 2 e de 3 cartas impressos na trilha montada mostram onde começam o Intermediário e o Alto."),
          t("Put each psychic's clairvoyancy level marker on the “0” space of the track.", "Coloque o marcador de nível de clarividência de cada médium no espaço “0” da trilha.")
        ],
        art: ["track-setup", t("Rulebook p. 7: how to place the clairvoyancy track for 4–5 players (left) and 6–7 players (right)", "Livro p. 7: como montar a trilha de clarividência para 4–5 jogadores (esquerda) e 6–7 jogadores (direita)")]
      });
    }
    phases.push(
      {
        id: "ghost",
        title: t("The ghost's side of the screen", "O lado do fantasma no biombo"),
        pages: [7, 9, 11],
        items: [
          t("Stand the game screen in front of the ghost. Inside it, each coloured column is one psychic; its three rows hold that psychic's character, location and object ghost cards.", "Ponha o biombo em pé diante do fantasma. Por dentro, cada coluna colorida é um médium; as três linhas recebem as cartas do fantasma de personagem, local e objeto desse médium."),
          t(`Take the ghost tokens of the ${psychics} colours in play and place each one coloured side up at the bottom of its column, behind the screen.`, `Pegue as fichas do fantasma das ${psychics} cores em jogo e coloque cada uma com o lado colorido para cima no pé da sua coluna, atrás do biombo.`),
          interpretation(`${psychics < 6 ? "keep the other ghost tokens beside the screen: " : ""}in Phase 2 the tokens numbered 1 to ${groupCount()} on the back are used to number the card groups, whatever their colour.`, `${psychics < 6 ? "deixe as outras fichas do fantasma ao lado do biombo: " : ""}na Fase 2 as fichas numeradas de 1 a ${groupCount()} no verso servem para numerar os grupos de cartas, seja qual for a cor.`),
          t("Shuffle the 84 vision cards and place the pile behind the screen. The ghost draws a hand of 7 cards from the top.", "Embaralhe as 84 cartas de visão e coloque a pilha atrás do biombo. O fantasma compra uma mão de 7 cartas do topo."),
          t(`Give the ghost ${crowCount()} crow marker${crowCount() > 1 ? "s" : ""} — ${difficultyName()}: discard ${crowRule().replace(" (", ", ").replace(")", "")}.${crowCount() < 3 ? " Return the others to the box." : ""}`, `Dê ao fantasma ${crowCount()} marcador${crowCount() > 1 ? "es" : ""} de Corvo — ${difficultyName()}: descartar ${crowRule().replace(" (", ", ").replace(")", "")}.${crowCount() < 3 ? " Devolva os outros à caixa." : ""}`),
          t("Keep the 6 culprit tokens near the ghost; they are used in Phase 2.", "Deixe as 6 fichas de culpado perto do fantasma; elas são usadas na Fase 2.")
        ]
      },
      {
        id: "characters",
        title: t(`Character cards (${cards} on the table, ${psychics} behind the screen)`, `Cartas de personagem (${cards} na mesa, ${psychics} atrás do biombo)`),
        pages: [6, 8],
        items: [
          t(`A psychic shuffles the 18 character psychic cards (large cards, backs numbered 1–18) and draws ${cards} face down (${difficultyName()}, ${playersLabel()}).`, `Um médium embaralha as 18 cartas de médium de personagem (cartas grandes, versos numerados de 1 a 18) e compra ${cards} viradas para baixo (${difficultyName()}, ${playersLabel()}).`),
          t("From the 18 character ghost cards (small blue cards, same numbers), pick out the ones whose numbers match the drawn psychic cards and pass them, face down, to the ghost.", "Das 18 cartas do fantasma de personagem (cartas pequenas azuis, mesmos números), separe as que têm os mesmos números das cartas de médium compradas e passe-as, viradas para baixo, ao fantasma."),
          t(`Lay the ${cards} character psychic cards face up below the character progress board. Return the undrawn psychic cards and the unmatched ghost cards to the box.`, `Disponha as ${cards} cartas de médium de personagem viradas para cima abaixo do tabuleiro de progresso de personagem. Devolva à caixa as cartas de médium não compradas e as cartas do fantasma sem par.`),
          t(`The ghost secretly shuffles the ${cards} ghost cards received, draws ${psychics} (one per psychic) and places one face up in the character row of each psychic's column inside the screen. The remaining ghost cards go back to the box without anyone looking at them.`, `O fantasma embaralha em segredo as ${cards} cartas do fantasma recebidas, compra ${psychics} (uma por médium) e põe uma com a face para cima na linha de personagem da coluna de cada médium, por dentro do biombo. As cartas do fantasma restantes voltam para a caixa sem que ninguém as veja.`),
          interpretation("the rulebook only says what happens to the leftover ghost cards; the undrawn psychic cards and their ghost twins are not used in the game either.", "o livro só diz o que fazer com as cartas do fantasma que sobram; as cartas de médium não compradas e as cartas do fantasma correspondentes também não são usadas na partida.")
        ],
        art: ["card-setup-psychic", t("Rulebook p. 8: the character psychic cards drawn (left) and the matching character ghost cards passed to the ghost (right)", "Livro p. 8: as cartas de médium de personagem compradas (esquerda) e as cartas do fantasma correspondentes passadas ao fantasma (direita)")]
      },
      {
        id: "locations-objects",
        title: t("Location and object cards", "Cartas de local e de objeto"),
        pages: [6, 8],
        items: [
          t(`Repeat the previous step for the location cards (backs 19–36): ${cards} location psychic cards face up below the location progress board; the ghost places ${psychics} location ghost cards in the location row of the screen.`, `Repita a etapa anterior para as cartas de local (versos 19–36): ${cards} cartas de médium de local viradas para cima abaixo do tabuleiro de progresso de local; o fantasma põe ${psychics} cartas do fantasma de local na linha de local do biombo.`),
          t(`Repeat it again for the object cards (backs 37–54): ${cards} object psychic cards below the object progress board; ${psychics} object ghost cards in the object row.`, `Repita mais uma vez para as cartas de objeto (versos 37–54): ${cards} cartas de médium de objeto abaixo do tabuleiro de progresso de objeto; ${psychics} cartas do fantasma de objeto na linha de objeto.`),
          t("Each psychic now has a secret combination of one character, one location and one object behind the screen. No two psychics share a card.", "Cada médium tem agora uma combinação secreta de um personagem, um local e um objeto atrás do biombo. Nenhum médium compartilha carta com outro."),
          t("Start the game: Phase 1, hour I. The ghost begins by projecting visions (Phase 1, Step 1).", "Comece a partida: Fase 1, hora I. O fantasma começa projetando visões (Fase 1, Passo 1).")
        ],
        art: ["card-setup-ghost", t("Rulebook p. 8: the ghost draws a card and slides it into a psychic's column in the screen, then repeats for each psychic", "Livro p. 8: o fantasma compra uma carta e a encaixa na coluna de um médium no biombo, depois repete para cada médium")]
      }
    );
    return phases;
  }

  function inventory() {
    const psychics = psychicCount();
    const cards = cardCount();
    const tokens = tokensPerPsychic();
    const boxLines = [
      psychics < 6 ? t(`${6 - psychics} unused colour${6 - psychics === 1 ? "" : "s"}: intuition token${6 - psychics === 1 ? "" : "s"}, sleeve${6 - psychics === 1 ? "" : "s"} and level marker${6 - psychics === 1 ? "" : "s"}.`, `${6 - psychics} cor${6 - psychics === 1 ? "" : "es"} não usada${6 - psychics === 1 ? "" : "s"}: ficha${6 - psychics === 1 ? "" : "s"} de intuição, sleeve${6 - psychics === 1 ? "" : "s"} e marcador${6 - psychics === 1 ? "" : "es"} de nível.`) : null,
      t(`${18 - cards} psychic cards of each type and their ghost cards; ${cards - psychics} more ghost cards of each type after the ghost's draw.`, `${18 - cards} cartas de médium de cada tipo e suas cartas do fantasma; mais ${cards - psychics} cartas do fantasma de cada tipo depois da compra do fantasma.`),
      crowCount() < 3 ? t(`${3 - crowCount()} crow markers.`, `${3 - crowCount()} marcadores de Corvo.`) : null,
      usesTrack()
        ? (tokens < 6 ? t(`Clairvoyancy tokens numbered ${tokens + 1}–6 (${(6 - tokens) * 6} tokens) and the tokens of unused colours.`, `Fichas de clarividência numeradas de ${tokens + 1} a 6 (${(6 - tokens) * 6} fichas) e as fichas das cores não usadas.`) : (psychics < 6 ? t("The clairvoyancy tokens of unused colours.", "As fichas de clarividência das cores não usadas.") : null))
        : t("The clairvoyancy track, the 6 level markers and the 36 clairvoyancy tokens.", "A trilha de clarividência, os 6 marcadores de nível e as 36 fichas de clarividência.")
    ];
    const cardsHtml = [
      infoCard(t("SHARED", "COMPARTILHADO"), t("Middle of the table", "Meio da mesa"), [
        rl("Clock board", "1, hour hand on I.", "Relógio", "1, ponteiro no I."),
        rl("Progress boards", "4 in a row: character, location, object, epilogue.", "Tabuleiros de progresso", "4 em fila: personagem, local, objeto, epílogo."),
        rl("Psychic cards", `${cards} characters, ${cards} locations, ${cards} objects, face up below their boards (${cards * 3} cards).`, "Cartas de médium", `${cards} personagens, ${cards} locais, ${cards} objetos, viradas para cima abaixo dos tabuleiros (${cards * 3} cartas).`),
        usesTrack() ? rl("Clairvoyancy track", `1, assembled for ${state.players <= 5 ? "4–5" : "6–7"} players.`, "Trilha de clarividência", `1, montada para ${state.players <= 5 ? "4–5" : "6–7"} jogadores.`) : null,
        rl("Sand timer", "1 (2 minutes), next to the ghost.", "Ampulheta", "1 (2 minutos), ao lado do fantasma.")
      ], [6, 7, 8]),
      infoCard(t(`PER PSYCHIC · ×${psychics}`, `POR MÉDIUM · ×${psychics}`), t("One colour each", "Uma cor cada"), [
        rl("Intuition token", "1, on the character progress board.", "Ficha de intuição", "1, no tabuleiro de progresso de personagem."),
        rl("Sleeve", "1, in front of the psychic.", "Sleeve (capa)", "1, à frente do médium."),
        usesTrack() ? rl("Level marker", "1, on space 0 of the clairvoyancy track.", "Marcador de nível", "1, no espaço 0 da trilha de clarividência.") : null,
        usesTrack() ? rl("Clairvoyancy tokens", `${tokens}, numbered 1–${tokens} on the back.`, "Fichas de clarividência", `${tokens}, numeradas de 1 a ${tokens} no verso.`) : null,
        smallGame() ? t("Each psychic player runs 2 colours.", "Cada jogador médium conduz 2 cores.") : null
      ], [6, 12]),
      infoCard(t("GHOST", "FANTASMA"), t("Behind the screen", "Atrás do biombo"), [
        rl("Game screen", `1; ${psychics} × 3 ghost cards in the columns of the colours in play.`, "Biombo", `1; ${psychics} × 3 cartas do fantasma nas colunas das cores em jogo.`),
        rl("Ghost tokens", `${psychics} coloured side up at the bottom of the columns${psychics < 6 ? "; the others beside the screen" : ""}.`, "Fichas do fantasma", `${psychics} com o lado colorido para cima no pé das colunas${psychics < 6 ? "; as outras ao lado do biombo" : ""}.`),
        rl("Vision cards", "84: a hand of 7, the rest as a face-down pile.", "Cartas de visão", "84: mão de 7, o resto numa pilha virada para baixo."),
        rl("Crow markers", `${crowCount()} (${difficultyName()}).`, "Marcadores de Corvo", `${crowCount()} (${difficultyName()}).`),
        rl("Culprit tokens", "6, used in Phase 2.", "Fichas de culpado", "6, usadas na Fase 2.")
      ], [7, 8, 9]),
      infoCard(t("IN THE BOX", "NA CAIXA"), t("Not used this match", "Não usado nesta partida"), boxLines, [6, 8, 12])
    ];
    return `<div class="quick-grid">${cardsHtml.join("")}</div>`;
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
        <label class="mys-setup-check" for="mys-setup-${phase.id}">
          <input id="mys-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="mys-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="mys-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
        ${phase.art ? `<div class="mys-art-row">${figure(phase.art[0], phase.art[1])}</div>` : ""}
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), sectionIndex("setup"), [6, 7, 8])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Prepare this séance", "Prepare esta sessão")} · ${matchSummary()}</h3>
            <p>${t("One checkbox per coherent step. The checklist never records which cards the ghost placed behind the screen.", "Uma caixa por etapa coerente. A lista nunca registra quais cartas o fantasma colocou atrás do biombo.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved separately from the match configuration and language. Changing the player count or difficulty clears this checklist; changing the language does not. “Uncheck all” clears only these setup boxes.",
          "O progresso é salvo separadamente da configuração da partida e do idioma. Trocar o número de jogadores ou a dificuldade limpa esta lista; trocar o idioma não. “Desmarcar tudo” limpa somente as caixas da preparação."
        )}</p>
      </div>
      <div class="mys-art-row">
        ${figure("setup-psychics", t("Rulebook p. 6: the psychics' components and the table layout — clock, 4 progress boards with their columns of psychic cards", "Livro p. 6: os componentes dos médiuns e a disposição da mesa — relógio, 4 tabuleiros de progresso com suas colunas de cartas de médium"))}
        ${figure("setup-ghost", t("Rulebook p. 7: the ghost's components — game screen, ghost tokens, vision cards, culprit tokens, crows — and the clairvoyancy track", "Livro p. 7: os componentes do fantasma — biombo, fichas do fantasma, cartas de visão, fichas de culpado, corvos — e a trilha de clarividência"))}
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}`;
  }

  // ---------- quick reference ----------

  function quickReference() {
    const psychics = psychicCount();
    const cards = [
      infoCard(t("EACH HOUR · GHOST", "CADA HORA · FANTASMA"), t("Step 1 · Project visions", "Passo 1 · Projetar visões"), [
        rl("1 · Give", "choose a psychic still investigating and place 1 or more vision cards from your hand face up in front of them.", "1 · Dar", "escolha um médium que ainda investiga e coloque 1 ou mais cartas de visão da mão, viradas para cima, à frente dele."),
        rl("2 · Mark", "push that psychic's ghost token against the screen: no more cards for them this hour.", "2 · Marcar", "empurre a ficha do fantasma desse médium contra o biombo: nada mais de cartas para ele nesta hora."),
        rl("3 · Refill", "draw back up to 7 vision cards (reshuffle the vision discard pile if the draw pile is empty).", "3 · Repor", "compre até voltar a 7 cartas de visão (embaralhe o descarte de visões se a pilha acabar)."),
        rl("4 · Next", "repeat until every psychic still investigating has received at least one new vision card this hour (also those who keep cards from a wrong guess), then start the sand timer.", "4 · Próximo", "repita até todo médium que ainda investiga ter recebido pelo menos uma carta de visão nova nesta hora (inclusive quem mantém cartas de um palpite errado); então vire a ampulheta."),
        rl("Silence", "never comment or gesture while the psychics discuss.", "Silêncio", "nunca comente nem faça gestos enquanto os médiuns discutem.")
      ], [9]),
      infoCard(t("EACH HOUR · PSYCHICS", "CADA HORA · MÉDIUNS"), t("Step 1 · Interpret (2 minutes)", "Passo 1 · Interpretar (2 minutos)"), [
        rl("Target", "your intuition token sits on the progress board you are working on: character, then location, then object.", "Alvo", "a sua ficha de intuição fica no tabuleiro de progresso em que você trabalha: personagem, depois local, depois objeto."),
        rl("Guess", "before the timer runs out, place your intuition token on the psychic card of that type you think your vision points to.", "Palpite", "antes de a ampulheta acabar, coloque a sua ficha de intuição na carta de médium desse tipo para a qual acha que a visão aponta."),
        rl("Discuss", "everyone may examine cards, discuss and move tokens until the timer ends.", "Discutir", "todos podem examinar cartas, discutir e mover fichas até a ampulheta acabar."),
        rl("Same card", "several psychics may stand on the same card, but combinations are unique, so at least one is wrong.", "Mesma carta", "vários médiuns podem ficar na mesma carta, mas as combinações são únicas, então ao menos um está errado."),
        usesTrack() ? rl("Clairvoyancy", `bet ${glyph("check")} (agree) or ${glyph("cross")} (disagree) on other psychics' intuition tokens; max 1 of yours per intuition token, never on your own.`, "Clarividência", `aposte ${glyph("check")} (concordo) ou ${glyph("cross")} (discordo) nas fichas de intuição dos outros; no máximo 1 sua por ficha de intuição, nunca na sua.`) : null
      ], [9, 10]),
      infoCard(t("EACH HOUR · GHOST", "CADA HORA · FANTASMA"), t("Step 2 · Spectral manifestation", "Passo 2 · Manifestação espectral"), [
        rl("Reveal", "tell each psychic, in any order, whether their intuition token is on the right card; then pull their ghost token away from the screen.", "Revelar", "diga a cada médium, na ordem que quiser, se a ficha de intuição dele está na carta certa; depois afaste a ficha do fantasma dele do biombo."),
        rl("Correct", "flip that ghost card in the screen; the psychic slides the psychic card into their sleeve, discards their vision cards and moves to the next progress board.", "Certo", "vire essa carta do fantasma no biombo; o médium põe a carta de médium no sleeve, descarta as cartas de visão e avança para o próximo tabuleiro de progresso."),
        rl("Wrong", "the psychic stays on the same board and keeps their vision cards; next hour the ghost adds at least one more.", "Errado", "o médium fica no mesmo tabuleiro e mantém as cartas de visão; na hora seguinte o fantasma acrescenta pelo menos mais uma."),
        usesTrack() ? rl("Track", `+1 space for each ${glyph("check")} on a correct token and each ${glyph("cross")} on a wrong one. Used clairvoyancy tokens go to the clock's discard area.`, "Trilha", `+1 espaço por ${glyph("check")} numa ficha certa e por ${glyph("cross")} numa errada. Fichas de clarividência usadas vão para a área de descarte do relógio.`) : null,
        rl("Done", `third card found: intuition token to the mission accomplished space${usesTrack() ? "; +1 track space per hour left after the current one (done in hour IV = +3)" : ""}. Keep helping the others.`, "Concluído", `terceira carta encontrada: ficha de intuição no espaço de missão cumprida${usesTrack() ? "; +1 espaço na trilha por hora restante depois da atual (terminou na hora IV = +3)" : ""}. Continue ajudando os outros.`)
      ], [10]),
      infoCard(t("END OF THE HOUR", "FIM DA HORA"), t("Advance the clock", "Avance o relógio"), [
        rl("Clock", "at the end of Step 2, move the hour hand forward one hour, then check:", "Relógio", "no fim do Passo 2, avance o ponteiro uma hora e então verifique:"),
        rl("1 · All found?", `all ${psychics} psychics on the mission accomplished space: go to Phase 2.`, "1 · Todos acharam?", `os ${psychics} médiuns no espaço de missão cumprida: passem à Fase 2.`),
        rl("2 · Time's up?", "otherwise, if the hour just played was VII, everyone loses.", "2 · Tempo esgotado?", "senão, se a hora que acabou de ser jogada foi a VII, todos perdem."),
        rl("3 · Next hour", "otherwise, the hand (already moved forward) shows the new hour: play it.", "3 · Próxima hora", "senão, o ponteiro (já avançado) mostra a nova hora: joguem-na."),
        usesTrack() ? rl("Hour IV", "at the start of the 4th hour, psychics take back their discarded clairvoyancy tokens.", "Hora IV", "no início da 4ª hora, os médiuns pegam de volta as fichas de clarividência descartadas.") : null
      ], [10]),
      infoCard(t("ANY TIME · GHOST", "A QUALQUER MOMENTO · FANTASMA"), t(`Crow discard · ${difficultyName()}`, `Descarte com Corvo · ${difficultyName()}`), [
        rl("Effect", "discard any or all vision cards from your hand and draw back to 7.", "Efeito", "descarte quaisquer ou todas as cartas de visão da mão e compre até voltar a 7."),
        rl("When", "at any point, including Phase 2.", "Quando", "a qualquer momento, inclusive na Fase 2."),
        state.difficulty === "medium"
          ? rl("Limit", `${crowRule()}; place one crow on the screen each time (they stay).`, "Limite", `${crowRule()}; ponha um corvo no biombo a cada vez (eles ficam).`)
          : state.difficulty === "easy"
            ? rl("Limit", `${crowRule()}; place the crow on the screen when you do it.`, "Limite", `${crowRule()}; ponha o corvo no biombo ao fazê-lo.`)
            : rl("Limit", `${crowRule()}; place the crow on the screen when you do it. No more discards after that, Phase 2 included.`, "Limite", `${crowRule()}; ponha o corvo no biombo ao fazê-lo. Depois disso, nenhum descarte, inclusive na Fase 2.`)
      ], [8, 9]),
      infoCard(t("PHASE 2", "FASE 2"), t("Revealing the culprit", "Revelando o culpado"), [
        rl("Line-up", `each psychic's 3 cards form a numbered group (ghost tokens 1–${groupCount()})${state.players === 2 ? "; add 2 random groups" : ""}.`, "Fila de suspeitos", `as 3 cartas de cada médium formam um grupo numerado (fichas do fantasma 1–${groupCount()})${state.players === 2 ? "; acrescentem 2 grupos aleatórios" : ""}.`),
        rl("Shared vision", `the ghost picks 3 vision cards for one group (character, location, object), shuffles them and lays them ${smallGame() ? "face up" : "face down"}; the matching culprit token goes “?” side up on the culprit space.`, "Visão compartilhada", `o fantasma escolhe 3 cartas de visão para um grupo (personagem, local, objeto), embaralha-as e as dispõe ${smallGame() ? "viradas para cima" : "viradas para baixo"}; a ficha de culpado correspondente vai com o lado “?” para cima no espaço do culpado.`),
        state.players === 2
          ? rl("Vote", "the psychic player places one intuition token on the suspected group.", "Voto", "o jogador médium coloca uma ficha de intuição no grupo suspeito.")
          : state.players === 3
            ? rl("Vote", "the two psychic players discuss openly, agree, and both place an intuition token on one group.", "Voto", "os dois jogadores médiuns discutem abertamente, combinam e ambos colocam uma ficha de intuição num grupo.")
            : rl("Vote", `secret and silent: reveal card 1 → ${glyph("level-low")} Low vote; card 2 → ${glyph("level-intermediate")} Intermediate vote; card 3 → ${glyph("level-high")} High vote. Vote by sliding a numbered clairvoyancy token into your sleeve.`, "Voto", `secreto e em silêncio: revele a carta 1 → ${glyph("level-low")} Baixo vota; carta 2 → ${glyph("level-intermediate")} Intermediário vota; carta 3 → ${glyph("level-high")} Alto vota. Vote pondo uma ficha de clarividência numerada no seu sleeve.`),
        smallGame() ? null : rl("Count", "majority wins; tie → the group of the psychic furthest on the track; still tied → the eldest player's group.", "Contagem", "a maioria vence; empate → o grupo do médium mais avançado na trilha; ainda empatado → o grupo do jogador mais velho."),
        rl("Result", "flip the culprit token: if it matches the chosen group, everyone wins.", "Resultado", "vire a ficha de culpado: se corresponder ao grupo escolhido, todos vencem.")
      ], [11, 12])
    ];
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), sectionIndex("quick-reference"), [5, 8, 9, 10, 11, 12])}
      <div class="callout">${t(
        `Cooperative: everyone wins or loses together. The silent ghost hands out dream-like vision cards so each psychic can find their own suspect, then location, then object within 7 hours (turns). If all ${psychics} psychics succeed, the ghost sends one last shared vision and the psychics vote for the true culprit's group.`,
        `Cooperativo: todos ganham ou perdem juntos. O fantasma, em silêncio, entrega cartas de visão oníricas para que cada médium descubra o seu suspeito, depois o local, depois o objeto, em até 7 horas (turnos). Se os ${psychics} médiuns conseguirem, o fantasma envia uma última visão compartilhada e os médiuns votam no grupo do verdadeiro culpado.`
      )} ${referenceLink(5)}</div>
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- victory ----------

  function victorySection() {
    return `
      ${sectionHeading("victory", t("Winning & losing", "Vitória e derrota"), sectionIndex("victory"), [5, 10, 12])}
      <div class="quick-grid">
        <article class="info-card victory-card">
          <span class="component-label">${t("EVERYONE WINS", "TODOS VENCEM")}</span>
          <h3>${t("The right group", "O grupo certo")}</h3>
          ${lineList([
            t("All psychics identify their character, location and object before the end of the 7th hour (before the clock strikes 8).", "Todos os médiuns identificam o seu personagem, local e objeto antes do fim da 7ª hora (antes de o relógio bater 8)."),
            t("Then, in Phase 2, the group the psychics choose contains the true culprit: the culprit token on the epilogue board shows that group's number.", "Depois, na Fase 2, o grupo escolhido pelos médiuns contém o verdadeiro culpado: a ficha de culpado no tabuleiro de epílogo mostra o número desse grupo."),
            t("The ghost wins with them: the soul is laid to rest.", "O fantasma vence com eles: a alma descansa em paz.")
          ])}
          ${referenceLink(10)} ${referenceLink(12)}
        </article>
        <article class="info-card victory-card">
          <span class="component-label">${t("EVERYONE LOSES", "TODOS PERDEM")}</span>
          <h3>${t("Out of time or wrong group", "Sem tempo ou grupo errado")}</h3>
          ${lineList([
            t("At the end of an hour, if one or more psychics still lack their combination and the clock was already showing VII, the game ends immediately and all players lose.", "No fim de uma hora, se um ou mais médiuns ainda não têm a combinação e o relógio já marcava VII, a partida acaba na hora e todos perdem."),
            t("Or, in Phase 2, the psychics choose a group that does not contain the culprit.", "Ou, na Fase 2, os médiuns escolhem um grupo que não contém o culpado."),
            t("The spirit roams for another year, until the next Samhain.", "O espírito vaga por mais um ano, até o próximo Samhain.")
          ])}
          ${referenceLink(10)} ${referenceLink(12)}
        </article>
        <article class="info-card victory-card">
          <span class="component-label">${t("TIPS", "DICAS")}</span>
          <h3>${t("For a strong spirit bond", "Para um laço espiritual forte")}</h3>
          ${lineList([
            t("First game: play at Easy, with a player who already knows the game as the ghost.", "Primeira partida: jogue no Fácil, com um jogador que já conheça o jogo como fantasma."),
            t("The ghost may play without a word, for example confirming intuitions by knocking on the table: one knock for “yes”, two for “no”.", "O fantasma pode jogar sem dizer uma palavra, por exemplo confirmando intuições com batidas na mesa: uma batida para “sim”, duas para “não”."),
            t("An atmospheric soundtrack is offered on the publisher's website (Libellud, Mysterium product page); it is not part of this guide.", "Há uma trilha sonora ambiente no site da editora (Libellud, página do Mysterium); ela não faz parte deste guia.")
          ])}
          ${referenceLink(5)}
        </article>
      </div>`;
  }

  // ---------- phase 1 ----------

  function phaseOneSection() {
    const psychics = psychicCount();
    return `
      ${sectionHeading("phase-1", t("Phase 1 · Reconstruction of events", "Fase 1 · Reconstituição dos fatos"), sectionIndex("phase-1"), [8, 9, 10])}
      <p class="glossary-intro">${t(
        `Phase 1 lasts at most 7 game turns, one per hour on the clock (I to VII). Each psychic must find, in this order, their character (the suspect), then their location, then their object. Each hour has two steps: vision interpretation, then spectral manifestation.${smallGame() ? " A player who runs 2 psychics plays each of them separately: two intuition tokens, two sets of vision cards." : ""}`,
        `A Fase 1 dura no máximo 7 turnos, um por hora no relógio (I a VII). Cada médium deve descobrir, nesta ordem, o seu personagem (o suspeito), depois o local, depois o objeto. Cada hora tem dois passos: interpretação das visões e manifestação espectral.${smallGame() ? " Quem conduz 2 médiuns joga cada um separadamente: duas fichas de intuição, dois conjuntos de cartas de visão." : ""}`
      )}</p>
      <div class="quick-grid">
        ${infoCard(t("STEP 1 · GHOST", "PASSO 1 · FANTASMA"), t("Projecting a vision", "Projetar uma visão"), [
          rl("1", "choose a psychic and place one or more vision cards from your hand face up in front of them.", "1", "escolha um médium e coloque uma ou mais cartas de visão da mão, viradas para cima, à frente dele."),
          rl("2", "push the ghost token of that psychic's colour against the game screen. It reminds you that this psychic already got their cards and cannot receive more this turn.", "2", "empurre a ficha do fantasma da cor desse médium contra o biombo. Ela lembra que esse médium já recebeu as cartas e não pode receber mais neste turno."),
          rl("3", "draw vision cards to bring your hand back to 7. If the draw pile is empty, shuffle the vision discard pile into a new draw pile.", "3", "compre cartas de visão até a mão voltar a 7. Se a pilha de compra acabar, embaralhe o descarte de visões numa nova pilha."),
          rl("4", "pick another psychic and repeat until every psychic has received at least one vision card this hour.", "4", "escolha outro médium e repita até todos os médiuns terem recebido pelo menos uma carta de visão nesta hora."),
          rl("Timer", "when every psychic has their vision, start the 2-minute sand timer.", "Ampulheta", "quando todos os médiuns tiverem a sua visão, vire a ampulheta de 2 minutos."),
          rl("Never", "make comments or gestures that could serve as clues, even while listening to the psychics.", "Nunca", "faça comentários ou gestos que possam servir de pista, mesmo ouvindo os médiuns."),
          interpretation("a psychic whose intuition token is already on the mission accomplished space has nothing left to find, so the ghost skips them.", "um médium cuja ficha de intuição já está no espaço de missão cumprida não tem mais nada a descobrir, então o fantasma o pula.")
        ], [9])}
        ${infoCard(t("STEP 1 · PSYCHICS", "PASSO 1 · MÉDIUNS"), t("Interpreting the vision", "Interpretar a visão"), [
          t("Your vision points to the card of the type of the progress board your intuition token is on (character, location or object).", "A sua visão aponta para a carta do tipo do tabuleiro de progresso em que está a sua ficha de intuição (personagem, local ou objeto)."),
          t("Freely examine your vision cards and the psychic cards, and discuss hypotheses with the other psychics.", "Examine à vontade as suas cartas de visão e as cartas de médium e discuta hipóteses com os outros médiuns."),
          t("Before the sand timer runs out, place your intuition token on the psychic card you believe the ghost is guiding you to. You may move it at any time until the timer expires.", "Antes de a ampulheta acabar, coloque a sua ficha de intuição na carta de médium para a qual acredita que o fantasma o está guiando. Você pode movê-la a qualquer momento até a ampulheta acabar."),
          t("Several psychics may place their intuition token on the same psychic card. But each psychic has a unique combination, so at least one of them must be wrong.", "Vários médiuns podem colocar a ficha de intuição na mesma carta de médium. Mas cada médium tem uma combinação única, então pelo menos um deles está errado."),
          t("When the sand timer runs out, Step 1 ends and the ghost manifests.", "Quando a ampulheta acabar, o Passo 1 termina e o fantasma se manifesta."),
          interpretation("the rulebook gives no penalty for a token not placed in time; treat a psychic whose token is not on a card as wrong this hour.", "o livro não dá penalidade para uma ficha não colocada a tempo; trate o médium cuja ficha não está numa carta como errado nesta hora.")
        ], [9])}
        ${usesTrack() ? infoCard(t("STEP 1 · PSYCHICS", "PASSO 1 · MÉDIUNS"), t("Using clairvoyancy tokens", "Usar fichas de clarividência"), [
          t(`Until the sand timer expires you may add clairvoyancy tokens to the intuition tokens played by other psychics: ${glyph("check")} means you agree with that psychic's intuition, ${glyph("cross")} that you disagree.`, `Até a ampulheta acabar você pode acrescentar fichas de clarividência às fichas de intuição dos outros médiuns: ${glyph("check")} significa que concorda com a intuição desse médium, ${glyph("cross")} que discorda.`),
          rl("Limit", "at most one of your clairvoyancy tokens per intuition token, and never on your own intuition token.", "Limite", "no máximo uma ficha de clarividência sua por ficha de intuição, e nunca na sua própria ficha de intuição."),
          rl("Optional", "play as many as you like during a turn, or none.", "Opcional", "jogue quantas quiser num turno, ou nenhuma."),
          rl("Point clearly", "when several intuition tokens share a card, each clairvoyancy token must clearly point to the intuition token it is about.", "Aponte com clareza", "quando várias fichas de intuição dividem uma carta, cada ficha de clarividência deve apontar claramente para a ficha de intuição a que se refere."),
          rl("Change", "move or remove clairvoyancy tokens at any time until the timer expires.", "Mudar", "mova ou retire fichas de clarividência a qualquer momento até a ampulheta acabar."),
          rl("After use", "all played clairvoyancy tokens (✓ and ✗) go to the discard area on the clock board. They come back to their owners at the start of the 4th hour.", "Depois de usar", "todas as fichas de clarividência jogadas (✓ e ✗) vão para a área de descarte do relógio. Elas voltam aos donos no início da 4ª hora."),
          t("Each successful bet moves you one space up the clairvoyancy track, which lets you see more of the final shared vision.", "Cada aposta certa avança você um espaço na trilha de clarividência, o que permite ver mais da visão compartilhada final.")
        ], [10]) : ""}
        ${infoCard(t("STEP 2 · GHOST", "PASSO 2 · FANTASMA"), t("Spectral manifestation", "Manifestação espectral"), [
          t("Reveal to each psychic, in any order you like, whether their intuition was correct (token on the right card) or incorrect.", "Revele a cada médium, na ordem que quiser, se a intuição dele estava certa (ficha na carta certa) ou errada."),
          t("After manifesting to a psychic, move the ghost token of that colour away from the game screen.", "Depois de se manifestar a um médium, afaste do biombo a ficha do fantasma daquela cor.")
        ], [10])}
        ${infoCard(t("STEP 2 · CORRECT", "PASSO 2 · CERTO"), t("The psychic picked the right card", "O médium escolheu a carta certa"), [
          t("The ghost flips the corresponding ghost card in the game screen.", "O fantasma vira a carta do fantasma correspondente no biombo."),
          interpretation("turn it face down in its slot: it marks that card as found.", "deixe-a virada para baixo no encaixe: isso marca a carta como encontrada."),
          usesTrack() ? t(`Every psychic who played a ${glyph("check")} token on this intuition token moves their level marker forward one space on the clairvoyancy track.`, `Todo médium que jogou uma ficha ${glyph("check")} nesta ficha de intuição avança o seu marcador de nível um espaço na trilha de clarividência.`) : null,
          t("The psychic takes the correct psychic card and slides it into their sleeve.", "O médium pega a carta de médium certa e a coloca no seu sleeve."),
          t("The psychic discards all their vision cards (to the vision discard pile).", "O médium descarta todas as suas cartas de visão (no descarte de visões)."),
          t("The psychic moves their intuition token to the next progress board (character → location → object).", "O médium leva a ficha de intuição ao próximo tabuleiro de progresso (personagem → local → objeto).")
        ], [10])}
        ${infoCard(t("STEP 2 · WRONG", "PASSO 2 · ERRADO"), t("The psychic picked the wrong card", "O médium escolheu a carta errada"), [
          usesTrack() ? t(`Every psychic who played a ${glyph("cross")} token on this intuition token moves their level marker forward one space.`, `Todo médium que jogou uma ficha ${glyph("cross")} nesta ficha de intuição avança o seu marcador de nível um espaço.`) : null,
          t("The psychic returns their intuition token to the same progress board it was taken from.", "O médium devolve a ficha de intuição ao mesmo tabuleiro de progresso de onde a tirou."),
          t("The psychic keeps their vision cards in front of them. In each following hour the ghost adds one or more cards to enhance the vision, until the right card is found or the game ends.", "O médium mantém as cartas de visão à sua frente. A cada hora seguinte o fantasma acrescenta uma ou mais cartas para reforçar a visão, até a carta certa ser encontrada ou a partida acabar.")
        ], [10])}
        ${infoCard(t("STEP 2 · ALL THREE", "PASSO 2 · AS TRÊS"), t("A psychic completes their combination", "Um médium completa a combinação"), [
          t("When a psychic finds their third card (the object), they place their intuition token on the mission accomplished space of the epilogue progress board.", "Quando um médium encontra a terceira carta (o objeto), ele coloca a ficha de intuição no espaço de missão cumprida do tabuleiro de epílogo."),
          usesTrack() ? t("They move their level marker forward one space on the clairvoyancy track for each hour remaining on the clock (hours left after the current one: finishing in hour IV gives 3 spaces).", "Ele avança o marcador de nível um espaço na trilha de clarividência por hora restante no relógio (horas que faltam depois da atual: terminar na hora IV dá 3 espaços).") : null,
          t(`From then on they keep taking part by helping the other psychics interpret their visions${usesTrack() ? ", and may still play their remaining clairvoyancy tokens" : ""}.`, `A partir daí ele continua participando, ajudando os outros médiuns a interpretar as visões${usesTrack() ? ", e ainda pode jogar as fichas de clarividência que lhe restam" : ""}.`)
        ], [10])}
        ${infoCard(t("END OF THE HOUR", "FIM DA HORA"), t("Move the clock", "Avance o relógio"), [
          t("At the end of Step 2, move the hour hand forward one hour. Then check, in this order:", "No fim do Passo 2, avance o ponteiro das horas uma hora. Depois verifiquem, nesta ordem:"),
          rl("1", `if all ${psychics} psychics have found their combinations, go to Phase 2: Revealing the culprit.`, "1", `se os ${psychics} médiuns encontraram as suas combinações, passem à Fase 2: Revelando o culpado.`),
          rl("2", "otherwise, if the clock was already showing the 7th hour (VII) before you moved it, the game ends and all players lose.", "2", "senão, se o relógio já marcava a 7ª hora (VII) antes de avançar, a partida acaba e todos perdem."),
          rl("3", "otherwise, a new hour begins (back to Step 1) for the psychics who have not yet identified their character, location and object.", "3", "senão, começa uma nova hora (de volta ao Passo 1) para os médiuns que ainda não identificaram personagem, local e objeto."),
          t("At this point the psychics' intuition tokens may be on different progress boards.", "Neste momento as fichas de intuição dos médiuns podem estar em tabuleiros de progresso diferentes.")
        ], [10])}
        ${infoCard(t("GHOST · ANY TIME", "FANTASMA · A QUALQUER MOMENTO"), t(`Discarding vision cards · ${difficultyName()}`, `Descartar cartas de visão · ${difficultyName()}`), [
          t("At any point in the game, including the Revealing the culprit phase, the ghost may discard any or all of the vision cards in hand and draw new cards back up to 7.", "A qualquer momento da partida, inclusive na fase Revelando o culpado, o fantasma pode descartar quaisquer ou todas as cartas de visão da mão e comprar cartas novas até voltar a 7."),
          state.difficulty === "easy"
            ? t(`Easy: once per turn. Place the ${glyph("crow")} crow on the game screen when you do it and remove it at the end of the turn.`, `Fácil: uma vez por turno. Ponha o ${glyph("crow")} corvo no biombo ao fazê-lo e retire-o no fim do turno.`)
            : state.difficulty === "medium"
              ? t(`Medium: up to three times during the game; place one ${glyph("crow")} crow on the game screen each time (they stay).`, `Médio: até três vezes durante a partida; ponha um ${glyph("crow")} corvo no biombo a cada vez (eles ficam).`)
              : t(`Hard: once during the game; place the ${glyph("crow")} crow on the game screen.`, `Difícil: uma vez durante a partida; ponha o ${glyph("crow")} corvo no biombo.`),
          state.difficulty === "easy" ? interpretation("“turn” here is one hour of Phase 1; during Phase 2 the Easy ghost may use the crow once more.", "“turno” aqui é uma hora da Fase 1; durante a Fase 2 o fantasma do Fácil pode usar o corvo mais uma vez.") : null
        ], [8, 9])}
      </div>
      <div class="mys-art-row">
        ${figure("game-screen", t("Rulebook p. 7: inside the game screen — one column per psychic colour; rows 1 character, 2 location, 3 object", "Livro p. 7: o interior do biombo — uma coluna por cor de médium; linhas 1 personagem, 2 local, 3 objeto"))}
        ${figure("epilogue-board", t("Rulebook p. 6: the epilogue progress board — 1 culprit space, 2 mission accomplished space", "Livro p. 6: o tabuleiro de epílogo — 1 espaço do culpado, 2 espaço de missão cumprida"))}
        ${usesTrack() ? figure("clairvoyancy-example", t("Rulebook p. 10: Carl was right, so Stephanie and Alex, who put ✓ tokens on his intuition token, each move up one space; Paul's ✗ does not move him", "Livro p. 10: Carl acertou, então Stephanie e Alex, que puseram fichas ✓ na ficha de intuição dele, avançam um espaço cada; o ✗ de Paul não o move")) : ""}
      </div>`;
  }

  // ---------- phase 2 ----------

  function phaseTwoSection() {
    const psychics = psychicCount();
    const groups = groupCount();
    let voteCards;
    if (state.players === 2) {
      voteCards = [
        infoCard(t("STEP 3 · 2 PLAYERS", "PASSO 3 · 2 JOGADORES"), t("Straw poll", "Votação"), [
          t("The shared-vision cards are face up: the psychic player sees all three.", "As cartas da visão compartilhada estão viradas para cima: o jogador médium vê as três."),
          t("The player who runs the two psychics uses only one of their intuition tokens to designate the suspected culprit's group.", "O jogador que conduz os dois médiuns usa só uma das suas fichas de intuição para apontar o grupo do suspeito."),
          t("The ghost must not indicate which shared-vision card relates to which element of the combination.", "O fantasma não pode indicar qual carta da visão compartilhada se refere a qual elemento da combinação.")
        ], [12])
      ];
    } else if (state.players === 3) {
      voteCards = [
        infoCard(t("STEP 3 · 3 PLAYERS", "PASSO 3 · 3 JOGADORES"), t("Straw poll (open)", "Votação (aberta)"), [
          t("The shared-vision cards are face up: both psychic players see all three.", "As cartas da visão compartilhada estão viradas para cima: os dois jogadores médiuns veem as três."),
          t("Psychics vote openly rather than in secret: the two psychic players must agree which group is the suspected culprit's group and place their two intuition tokens on it.", "Os médiuns votam abertamente em vez de em segredo: os dois jogadores médiuns precisam concordar qual é o grupo do suspeito e colocar as suas duas fichas de intuição nele."),
          t("The ghost must not indicate which shared-vision card relates to which element of the combination.", "O fantasma não pode indicar qual carta da visão compartilhada se refere a qual elemento da combinação."),
          interpretation("each of the two players places one of their intuition tokens; the rulebook gives no rule if they cannot agree, so keep discussing until they do.", "cada um dos dois jogadores coloca uma das suas fichas de intuição; o livro não dá regra se eles não concordarem, então continuem discutindo até concordar.")
        ], [12])
      ];
    } else {
      voteCards = [
        infoCard(t("STEP 3", "PASSO 3"), t("Straw poll: who sees what", "Votação: quem vê o quê"), [
          t("The psychics hold a majority vote to designate the culprit's group. They vote in secret and must not communicate during the voting.", "Os médiuns fazem uma votação por maioria para apontar o grupo do culpado. Eles votam em segredo e não podem se comunicar durante a votação."),
          t("The ghost must not indicate which shared-vision card relates to which element of the combination.", "O fantasma não pode indicar qual carta da visão compartilhada se refere a qual elemento da combinação."),
          rl(`${glyph("level-low")} Low level`, "you see only the first shared-vision card, then vote.", `${glyph("level-low")} Nível baixo`, "você vê só a primeira carta da visão compartilhada e então vota."),
          rl(`${glyph("level-intermediate")} Intermediate`, "you see two cards, then vote.", `${glyph("level-intermediate")} Intermediário`, "você vê duas cartas e então vota."),
          rl(`${glyph("level-high")} High`, "you see all three cards, then vote.", `${glyph("level-high")} Alto`, "você vê as três cartas e então vota."),
          state.players <= 5
            ? t("Levels with 4–5 players: Low = spaces 0–4, Intermediate = 5–6, High = 7+ (the level symbols are printed on the track).", "Níveis com 4–5 jogadores: Baixo = espaços 0–4, Intermediário = 5–6, Alto = 7+ (os símbolos dos níveis estão impressos na trilha).")
            : t("With 6–7 players the level limits differ (the rulebook gives no numbers; do not use the 4–5 player spaces): read them from the 2-card and 3-card symbols on the track as assembled in setup.", "Com 6–7 jogadores os limites dos níveis são outros (o livro não dá números; não usem os espaços de 4–5 jogadores): leia-os nos símbolos de 2 e de 3 cartas na trilha montada na preparação.")
        ], [11, 12]),
        infoCard(t("STEP 3", "PASSO 3"), t("Voting order", "Ordem da votação"), [
          rl("1", "reveal the first shared-vision card; Low-level psychics vote now.", "1", "revele a primeira carta da visão compartilhada; os médiuns de nível baixo votam agora."),
          rl("2", "reveal the second card; Intermediate-level psychics vote now.", "2", "revele a segunda carta; os médiuns de nível intermediário votam agora."),
          rl("3", "reveal the third card; High-level psychics vote now.", "3", "revele a terceira carta; os médiuns de nível alto votam agora."),
          rl("How", `take the clairvoyancy token whose number (back) matches the group you suspect and slide it into your sleeve. Groups go up to ${groups}.`, "Como", `pegue a ficha de clarividência cujo número (verso) corresponde ao grupo suspeito e coloque-a no seu sleeve. Os grupos vão até ${groups}.`),
          interpretation("the rulebook's example shows the cards being revealed one after another; any player may flip them. Psychics who have voted keep silent.", "o exemplo do livro mostra as cartas sendo reveladas uma após a outra; qualquer jogador pode virá-las. Quem já votou fica em silêncio.")
        ], [12]),
        infoCard(t("STEP 3", "PASSO 3"), t("Revealing the votes", "Revelando os votos"), [
          t("Pass all the sleeves to the psychic with the highest position on the clairvoyancy track (if tied, the eldest of the tied players).", "Passem todos os sleeves ao médium mais avançado na trilha de clarividência (em caso de empate, o mais velho dos empatados)."),
          t("This player reveals each clairvoyancy token in turn, placing it on the card group matching the number on the ghost token.", "Esse jogador revela cada ficha de clarividência por vez, colocando-a no grupo de cartas com o número da ficha do fantasma correspondente."),
          rl("Majority", "if one group received more votes than the others, it is chosen.", "Maioria", "se um grupo recebeu mais votos que os outros, ele é o escolhido."),
          rl("Tie", "the group chosen by the psychic who progressed furthest along the clairvoyancy track wins.", "Empate", "vence o grupo escolhido pelo médium que mais avançou na trilha de clarividência."),
          rl("Still tied", "the group the eldest player voted for wins.", "Ainda empatado", "vence o grupo em que votou o jogador mais velho."),
          interpretation("“still tied” covers both cases where the track does not decide: several psychics share the furthest position, or the furthest psychic voted for a group that is not among the tied ones.", "“ainda empatado” cobre os dois casos em que a trilha não decide: vários médiuns dividem a posição mais avançada, ou o médium mais avançado votou num grupo que não está entre os empatados.")
        ], [12])
      ];
    }
    return `
      ${sectionHeading("phase-2", t("Phase 2 · Revealing the culprit", "Fase 2 · Revelando o culpado"), sectionIndex("phase-2"), [10, 11, 12])}
      <p class="glossary-intro">${t(
        "This phase only happens if all psychics found their character, location and object before the clock strikes 8. It has three steps: suspect line-up, shared vision, straw poll.",
        "Esta fase só acontece se todos os médiuns encontraram personagem, local e objeto antes de o relógio bater 8. Ela tem três passos: fila de suspeitos, visão compartilhada e votação."
      )}</p>
      <div class="quick-grid">
        ${infoCard(t("STEP 1", "PASSO 1"), t("Suspect line-up", "Fila de suspeitos"), [
          state.players === 2
            ? t("Collect the psychic cards that were not placed in sleeves. First randomly create two additional groups (one character, one location and one object each) from those leftover psychic cards (not in sleeves), for 4 groups in all; then put the rest back in the box, together with the character, location and object progress boards (keep the epilogue board).", "Recolham as cartas de médium que não foram colocadas em sleeves. Primeiro montem ao acaso dois grupos extras (um personagem, um local e um objeto cada) com essas cartas de médium que sobraram (fora dos sleeves), totalizando 4 grupos; depois devolvam o resto à caixa, junto com os tabuleiros de progresso de personagem, local e objeto (mantenham o tabuleiro de epílogo).")
            : t("Collect the psychic cards that were not placed in sleeves and put them back in the box, together with the character, location and object progress boards (keep the epilogue board).", "Recolham as cartas de médium que não foram colocadas em sleeves e devolvam-nas à caixa, junto com os tabuleiros de progresso de personagem, local e objeto (mantenham o tabuleiro de epílogo)."),
          state.players === 2 ? interpretation("shuffle the leftover cards of each type face down and take one of each per extra group.", "embaralhem viradas para baixo as cartas restantes de cada tipo e peguem uma de cada por grupo extra.") : null,
          t(`Place ghost tokens numbered 1 to ${groups} (one per group) in the centre of the table, numbered side up. Return the unused ghost tokens to the box.`, `Coloquem no centro da mesa as fichas do fantasma numeradas de 1 a ${groups} (uma por grupo), com o número para cima. Devolvam à caixa as fichas do fantasma não usadas.`),
          t(`The psychics take their three cards out of their sleeves and put each combination next to a numbered token${state.players === 2 ? "; the two random groups take the remaining numbers" : ""}. Each group contains one suspect.`, `Os médiuns tiram as três cartas dos sleeves e põem cada combinação ao lado de uma ficha numerada${state.players === 2 ? "; os dois grupos aleatórios ficam com os números restantes" : ""}. Cada grupo contém um suspeito.`),
          t("The ghost collects the 6 culprit tokens and keeps them behind the game screen.", "O fantasma recolhe as 6 fichas de culpado e as mantém atrás do biombo."),
          usesTrack() ? t("The psychics take back all of their clairvoyancy tokens (they vote with the numbered side).", "Os médiuns pegam de volta todas as suas fichas de clarividência (eles votam com o lado numerado).") : null,
          interpretation(`the psychics keep their sleeves${smallGame() ? "" : " (empty) to vote with"}; the ghost still knows each psychic's combination from the screen.`, `os médiuns guardam os sleeves${smallGame() ? "" : " (vazios) para votar"}; o fantasma ainda sabe a combinação de cada médium pelo biombo.`)
        ], [11, 12])}
        ${infoCard(t("STEP 2", "PASSO 2"), t("Shared vision", "Visão compartilhada"), [
          t("The ghost secretly chooses one of the groups as the culprit's group.", "O fantasma escolhe em segredo um dos grupos como o grupo do culpado."),
          t("The ghost picks three vision cards from their hand, all pointing to that same group: one to its character, one to its location and one to its object.", "O fantasma escolhe três cartas de visão da mão, todas apontando para esse mesmo grupo: uma para o personagem, uma para o local e uma para o objeto."),
          smallGame()
            ? t("The ghost shuffles the three cards and places them face up in the middle of the table (2–3 player rule).", "O fantasma embaralha as três cartas e as coloca viradas para cima no meio da mesa (regra de 2–3 jogadores).")
            : t("The ghost shuffles the three shared-vision cards and places them face down in the middle of the table.", "O fantasma embaralha as três cartas da visão compartilhada e as coloca viradas para baixo no meio da mesa."),
          t("The ghost secretly takes the culprit token with the number matching that group and places it “?” side up (number hidden) on the culprit space of the epilogue progress board.", "O fantasma pega em segredo a ficha de culpado com o número desse grupo e a coloca com o lado “?” para cima (número escondido) no espaço do culpado do tabuleiro de epílogo."),
          interpretation("the rulebook does not say how the ghost picks the culprit's group; it is the ghost's free choice (for example the group easiest to point to with the hand).", "o livro não diz como o fantasma escolhe o grupo do culpado; é escolha livre do fantasma (por exemplo, o grupo mais fácil de indicar com a mão que tem).")
        ], [11, 12])}
        ${voteCards.join("")}
        ${infoCard(t("FINALE", "DESFECHO"), t("Reveal the culprit", "Revelem o culpado"), [
          t("Now reveal the culprit token placed on the culprit space.", "Agora revelem a ficha de culpado colocada no espaço do culpado."),
          t("If the chosen group bears the same number, all players win together. Otherwise, the game is lost.", "Se o grupo escolhido tiver o mesmo número, todos vencem juntos. Caso contrário, a partida está perdida.")
        ], [12])}
      </div>
      <div class="mys-art-row">
        ${figure("card-groups", t(`Rulebook p. 11 example (3 of its groups shown): each psychic's cards next to a numbered ghost token; each group contains one suspect. Your match has ${groups} groups.`, `Exemplo do livro p. 11 (3 dos grupos mostrados): as cartas de cada médium ao lado de uma ficha do fantasma numerada; cada grupo contém um suspeito. A sua partida tem ${groups} grupos.`))}
        ${figure("shared-vision", smallGame() ? t("Rulebook p. 11: the three shared-vision cards shown face down (standard game); with 2–3 players lay them face up", "Livro p. 11: as três cartas da visão compartilhada mostradas viradas para baixo (jogo padrão); com 2–3 jogadores disponha-as viradas para cima") : t("Rulebook p. 11: the three shared-vision cards, face down", "Livro p. 11: as três cartas da visão compartilhada, viradas para baixo"))}
        ${usesTrack() ? figure("track-levels", t("Rulebook p. 11: clairvoyancy levels on the track (4–5 players) — Low, Intermediate (from the 2-card symbol on space 5), High (from the 3-card symbol on space 7)", "Livro p. 11: níveis de clarividência na trilha (4–5 jogadores) — Baixo, Intermediário (a partir do símbolo de 2 cartas no espaço 5), Alto (a partir do símbolo de 3 cartas no espaço 7)")) : ""}
      </div>`;
  }

  // ---------- iconography ----------

  function iconsSection() {
    const icons = [
      iconCard(state.difficulty, `${difficultyName()} difficulty`, `Label of your difficulty row in the setup table: ${cardCount()} cards of each type at ${state.players} players; vision-card discards ${crowRule()}.`, `Dificuldade ${difficultyName()}`, `Rótulo da sua linha de dificuldade na tabela de preparação: ${cardCount()} cartas de cada tipo com ${state.players} jogadores; descartes de cartas de visão ${crowRule()}.`, [5, 8, 9], true),
      iconCard("crow", "Crow marker", "Each time the ghost discards vision cards to draw new ones, a crow goes on the game screen. One crow per turn at Easy, one per game at Hard.", "Marcador de Corvo", "Cada vez que o fantasma descarta cartas de visão para comprar novas, um corvo vai para o biombo. Um corvo por turno no Fácil, um por partida no Difícil.", [8, 9]),
      state.difficulty === "medium" ? iconCard("crows-3", "Three crows (Medium)", "Medium allows three discards per game: three crow markers, one placed on the screen per discard.", "Três corvos (Médio)", "O Médio permite três descartes por partida: três marcadores de Corvo, um posto no biombo por descarte.", [8, 9], true) : null,
      usesTrack() ? iconCard("clairvoyancy-tokens", "Clairvoyancy tokens", "Front ✓ or ✗ (6 of each colour, numbered 1–6 on the back). Played on other psychics' intuition tokens; discarded on the clock after use.", "Fichas de clarividência", "Frente ✓ ou ✗ (6 por cor, numeradas de 1 a 6 no verso). Jogadas nas fichas de intuição dos outros médiuns; descartadas no relógio após o uso.", [6, 10]) : null,
      usesTrack() ? iconCard("check", "✓ — agree", "You believe this psychic's intuition is correct. If it is, move up one space on the clairvoyancy track.", "✓ — concordo", "Você acredita que a intuição desse médium está certa. Se estiver, avance um espaço na trilha de clarividência.", [6, 10]) : null,
      usesTrack() ? iconCard("cross", "✗ — disagree", "You believe this psychic's intuition is wrong. If it is, move up one space on the clairvoyancy track.", "✗ — discordo", "Você acredita que a intuição desse médium está errada. Se estiver, avance um espaço na trilha de clarividência.", [6, 10]) : null,
      usesTrack() ? iconCard("vote-tokens", "Numbered side (voting)", "In the straw poll, slide the clairvoyancy token whose number matches the suspected group into your sleeve.", "Lado numerado (votação)", "Na votação, ponha no seu sleeve a ficha de clarividência cujo número corresponde ao grupo suspeito.", [12], true) : null,
      usesTrack() ? iconCard("level-low", "Low clairvoyancy level", "Printed on the track (space 0). In the straw poll you see only the first shared-vision card.", "Nível de clarividência baixo", "Impresso na trilha (espaço 0). Na votação você vê só a primeira carta da visão compartilhada.", [11]) : null,
      usesTrack() ? iconCard("level-intermediate", "Intermediate level", `Printed on the track where Intermediate begins${state.players <= 5 ? " (space 5 at 4–5 players)" : ""}. You see two shared-vision cards.`, "Nível intermediário", `Impresso na trilha onde começa o Intermediário${state.players <= 5 ? " (espaço 5 com 4–5 jogadores)" : ""}. Você vê duas cartas da visão compartilhada.`, [11]) : null,
      usesTrack() ? iconCard("level-high", "High level", `Printed on the track where High begins${state.players <= 5 ? " (space 7 at 4–5 players)" : ""}. You see all three shared-vision cards.`, "Nível alto", `Impresso na trilha onde começa o Alto${state.players <= 5 ? " (espaço 7 com 4–5 jogadores)" : ""}. Você vê as três cartas da visão compartilhada.`, [11]) : null,
      iconCard("culprit-front", "Culprit token — front", "The “?” side. The ghost places the token of the culprit's group with this side up on the culprit space of the epilogue board, hiding its number.", "Ficha de culpado — frente", "O lado “?”. O fantasma coloca a ficha do grupo do culpado com este lado para cima no espaço do culpado do tabuleiro de epílogo, escondendo o número.", [7, 11]),
      iconCard("culprit-back", "Culprit token — back", "Numbered 1 to 6: the number of the culprit's group, revealed at the end.", "Ficha de culpado — verso", "Numerada de 1 a 6: o número do grupo do culpado, revelado no final.", [7, 12])
    ];
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), sectionIndex("icons"), [6, 7, 8, 11])}
      <p class="glossary-intro">${t(
        `Each image is cropped individually from the rulebook (a low-resolution scan). Only the symbols used in this match are shown.${usesTrack() ? "" : " With 2–3 players the clairvoyancy symbols are not used."}`,
        `Cada imagem foi recortada individualmente do livro de regras (um escaneamento de baixa resolução). Só aparecem os símbolos usados nesta partida.${usesTrack() ? "" : " Com 2–3 jogadores os símbolos de clarividência não são usados."}`
      )}</p>
      <div class="icon-grid">${icons.filter(Boolean).join("")}</div>`;
  }

  // ---------- examples ----------

  function examplesSection() {
    const manualExamples = [
      {
        title: t("Choosing roles (5 players)", "Escolhendo papéis (5 jogadores)"),
        lines: [
          t("Laura, Stephanie, Paul, Carl and Alex start a five-player game. Laura plays the ghost; the other four are psychics.", "Laura, Stephanie, Paul, Carl e Alex começam uma partida de cinco jogadores. Laura é o fantasma; os outros quatro são médiuns."),
          t("Stephanie chooses Alphonse de Belcour (blue), Paul Ardhashir (white), Carl Madam Wang (red) and Alex Alma Salvador (yellow).", "Stephanie escolhe Alphonse de Belcour (azul), Paul Ardhashir (branco), Carl Madam Wang (vermelho) e Alex Alma Salvador (amarelo).")
        ],
        pages: [5]
      },
      {
        title: t("Card setup (5 players, Medium)", "Preparação das cartas (5 jogadores, Médio)"),
        art: ["difficulty-table", t("Rulebook p. 8: cards laid on the table by difficulty and player count, and the ghost's permitted discards", "Livro p. 8: cartas dispostas na mesa por dificuldade e número de jogadores, e os descartes permitidos ao fantasma")],
        lines: [
          t("With 1 ghost and 4 psychics at Medium, the players draw 7 character psychic cards.", "Com 1 fantasma e 4 médiuns no Médio, os jogadores compram 7 cartas de médium de personagem."),
          t("Carl draws cards numbered 1, 3, 4, 5, 6, 10 and 17, sorts the character ghost cards and passes ghost cards 1, 3, 4, 5, 6, 10 and 17 to the ghost.", "Carl compra as cartas 1, 3, 4, 5, 6, 10 e 17, separa as cartas do fantasma de personagem e passa ao fantasma as cartas 1, 3, 4, 5, 6, 10 e 17."),
          t("Laura (the ghost) shuffles those 7 cards, draws the first one (number 10) and places it in Alex's column of the screen, then repeats for the other psychics.", "Laura (o fantasma) embaralha essas 7 cartas, compra a primeira (número 10) e a põe na coluna de Alex no biombo, depois repete para os outros médiuns.")
        ],
        pages: [8]
      },
      {
        title: t("Sample visions", "Exemplos de visões"),
        art: ["sample-visions", t("Rulebook p. 9: vision cards A, B and C point Alex to the governess (red wool, cords, a woman with a hat); A and D point Stephanie to the cook (plates, cakes)", "Livro p. 9: as cartas de visão A, B e C levam Alex à governanta (lã vermelha, cordas, uma mulher de chapéu); A e D levam Stephanie à cozinheira (pratos, bolos)")],
        lines: [
          t("Laura wants Alex to guess the governess, whose card shows a ball of red wool. She picks card A (a ball and a strand of red wool), and adds B (other cords and ropes) and C (a woman with a hat) to enhance the vision.", "Laura quer que Alex adivinhe a governanta, cuja carta mostra um novelo de lã vermelha. Ela escolhe a carta A (um novelo e um fio de lã vermelha) e acrescenta B (outras cordas e cordões) e C (uma mulher de chapéu) para reforçar a visão."),
          t("She must also steer Stephanie toward the cook. Card A also shows plates, so it could have gone to Stephanie instead, enhanced with card D (cakes).", "Ela também precisa levar Stephanie à cozinheira. A carta A mostra pratos, então poderia ter ido para Stephanie, reforçada pela carta D (bolos).")
        ],
        pages: [9]
      },
      {
        title: t("Several tokens on one card", "Várias fichas numa carta"),
        art: ["same-card", t("Rulebook p. 9: the red and yellow intuition tokens on the same psychic card", "Livro p. 9: as fichas de intuição vermelha e amarela na mesma carta de médium")],
        lines: [
          t("Two psychics may put their intuition tokens on the same psychic card.", "Dois médiuns podem pôr as fichas de intuição na mesma carta de médium."),
          t("Because every psychic has a unique combination, at least one of them is wrong.", "Como cada médium tem uma combinação única, pelo menos um deles está errado.")
        ],
        pages: [9]
      },
      usesTrack() ? {
        title: t("Using clairvoyancy tokens", "Usando fichas de clarividência"),
        lines: [
          t("The ghost says Carl's intuition was correct. Stephanie and Alex had both put a ✓ token on Carl's intuition token, so each moves their level marker forward one space.", "O fantasma diz que a intuição de Carl estava certa. Stephanie e Alex tinham posto uma ficha ✓ na ficha de intuição de Carl, então cada um avança o marcador de nível um espaço."),
          t("Paul had played a ✗ token, so he does not move.", "Paul tinha jogado uma ficha ✗, então não avança.")
        ],
        pages: [10]
      } : null,
      {
        title: t("Moving to the next board", "Passando ao próximo tabuleiro"),
        lines: [
          t("Stephanie correctly identified her character. During the next hour, Laura will help her guess a location, so Stephanie places her intuition token on the location progress board.", "Stephanie identificou corretamente o seu personagem. Na hora seguinte, Laura vai ajudá-la a adivinhar um local, então Stephanie coloca a ficha de intuição no tabuleiro de progresso de local."),
          usesTrack() ? t("Paul finds his whole combination during the 4th hour, so he moves his level marker forward 3 spaces on the clairvoyancy track (hours V, VI and VII remain).", "Paul encontra a combinação inteira na 4ª hora, então avança o marcador de nível 3 espaços na trilha de clarividência (restam as horas V, VI e VII).") : null
        ],
        pages: [10]
      },
      {
        title: t("Suspect line-up (4 psychics)", "Fila de suspeitos (4 médiuns)"),
        art: ["card-groups", t("Rulebook p. 11: Stephanie's, Alex's and Carl's combinations as numbered groups", "Livro p. 11: as combinações de Stephanie, Alex e Carl como grupos numerados")],
        lines: [
          t("In the five-player game (4 psychics), 4 groups of cards are needed, so the psychics lay out ghost tokens numbered 1 to 4.", "Na partida de cinco jogadores (4 médiuns), são necessários 4 grupos de cartas, então os médiuns dispõem as fichas do fantasma numeradas de 1 a 4."),
          t("Each psychic takes their three cards out of their sleeve and puts them next to a number. Each group contains one suspect.", "Cada médium tira as três cartas do sleeve e as põe ao lado de um número. Cada grupo contém um suspeito.")
        ],
        pages: [11]
      },
      usesTrack() ? {
        title: t("Voting by the psychics", "Votação dos médiuns"),
        art: ["voting-example", t("Rulebook p. 12: the shared-vision cards revealed one by one; Stephanie votes after the first, Alex and Carl after the second, Paul after the third", "Livro p. 12: as cartas da visão compartilhada reveladas uma a uma; Stephanie vota após a primeira, Alex e Carl após a segunda, Paul após a terceira")],
        lines: [
          t("The first shared-vision card is revealed. Stephanie, on space 4 (Low level), votes now.", "A primeira carta da visão compartilhada é revelada. Stephanie, no espaço 4 (nível baixo), vota agora."),
          t("The second card is revealed. Alex and Carl, on spaces 5 and 6 (Intermediate level), vote now.", "A segunda carta é revelada. Alex e Carl, nos espaços 5 e 6 (nível intermediário), votam agora."),
          t("The final card is revealed. Paul, on space 11 (High level), votes now.", "A última carta é revelada. Paul, no espaço 11 (nível alto), vota agora."),
          t("Then all votes are revealed by the psychic highest on the track (Paul).", "Então todos os votos são revelados pelo médium mais avançado na trilha (Paul).")
        ],
        pages: [12]
      } : null
    ].filter(Boolean);
    const guideExamples = [];
    if (smallGame()) {
      guideExamples.push({
        title: state.players === 2 ? t("Final vote with 2 players", "Votação final com 2 jogadores") : t("Final vote with 3 players", "Votação final com 3 jogadores"),
        lines: state.players === 2
          ? [
            t("Guide's own example. Rita (ghost) and Leo, who runs the blue and red psychics, reach Phase 2 in hour VI.", "Exemplo do próprio guia. Rita (fantasma) e Leo, que conduz os médiuns azul e vermelho, chegam à Fase 2 na hora VI."),
            t("Leo's two combinations become groups 1 and 2; two random groups built from the leftover psychic cards become groups 3 and 4.", "As duas combinações de Leo viram os grupos 1 e 2; dois grupos aleatórios montados com as cartas de médium restantes viram os grupos 3 e 4."),
            t("Rita lays three vision cards face up and secretly puts culprit token 3 on the culprit space. Leo puts one intuition token on group 3: the token is revealed and both win.", "Rita dispõe três cartas de visão viradas para cima e põe em segredo a ficha de culpado 3 no espaço do culpado. Leo põe uma ficha de intuição no grupo 3: a ficha é revelada e os dois vencem.")
          ]
          : [
            t("Guide's own example. Rita is the ghost; Leo runs blue and red, Ana runs yellow and white: 4 groups, numbered 1 to 4.", "Exemplo do próprio guia. Rita é o fantasma; Leo conduz azul e vermelho, Ana conduz amarelo e branco: 4 grupos, numerados de 1 a 4."),
            t("Rita lays the three shared-vision cards face up. Leo and Ana talk it over openly, agree on group 2 and each place an intuition token on it.", "Rita dispõe as três cartas da visão compartilhada viradas para cima. Leo e Ana discutem abertamente, concordam com o grupo 2 e cada um põe uma ficha de intuição nele."),
            t("The culprit token shows 4: everyone loses.", "A ficha de culpado mostra 4: todos perdem.")
          ],
        pages: [12]
      });
    }
    guideExamples.push({
      title: t("Running out of time", "Quando o tempo acaba"),
      lines: [
        t("Guide's own example. At the end of hour VII, one psychic is still on the object progress board after a wrong guess.", "Exemplo do próprio guia. No fim da hora VII, um médium ainda está no tabuleiro de progresso de objeto depois de um palpite errado."),
        t("The clock already showed VII, so the game ends at once: there is no Phase 2 and all players lose.", "O relógio já marcava VII, então a partida acaba na hora: não há Fase 2 e todos perdem.")
      ],
      pages: [10]
    });
    const card = (example, index, sourceEn, sourcePt) => `
      <article class="example-card">
        <span class="card-number">${String(index + 1).padStart(2, "0")}</span>
        <h3>${example.title}</h3>
        ${example.art ? figure(example.art[0], example.art[1]) : ""}
        ${lineList(example.lines)}
        <div class="example-source"><span>${t(sourceEn, sourcePt)}</span>${example.pages.map(referenceLink).join(" ")}</div>
      </article>`;
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), sectionIndex("examples"), [5, 8, 9, 10, 11, 12])}
      <p class="glossary-intro">${t(
        `The rulebook's examples follow a five-player game (Laura as the ghost; Stephanie, Paul, Carl and Alex as psychics) at Medium.${state.players === 5 ? "" : ` Your match has ${state.players} players and ${psychicCount()} psychics; the procedure is the same unless the sections above say otherwise.`}${state.players === 5 && state.difficulty === "medium" ? "" : ` Card counts in the examples are for 5 players at Medium; use ${cardCount()} cards of each type for your match.`}`,
        `Os exemplos do livro acompanham uma partida de cinco jogadores (Laura como fantasma; Stephanie, Paul, Carl e Alex como médiuns) no Médio.${state.players === 5 ? "" : ` A sua partida tem ${state.players} jogadores e ${psychicCount()} médiuns; o procedimento é o mesmo, salvo quando as seções acima dizem o contrário.`}${state.players === 5 && state.difficulty === "medium" ? "" : ` As quantidades de cartas dos exemplos são de 5 jogadores no Médio; use ${cardCount()} cartas de cada tipo na sua partida.`}`
      )}</p>
      <div class="example-grid mys-example-grid">${manualExamples.map((example, index) => card(example, index, "Rulebook example", "Exemplo do manual")).join("")}${guideExamples.map((example, index) => card(example, manualExamples.length + index, "Guide's example, built from the rules", "Exemplo do guia, construído a partir das regras")).join("")}</div>`;
  }

  // ---------- glossary ----------

  function glossarySection() {
    const visible = [
      { term: ["Ghost", "Fantasma"], text: ["The player behind the screen who knows every psychic's combination and communicates only through vision cards.", "O jogador atrás do biombo que conhece a combinação de cada médium e se comunica só por cartas de visão."], page: 5 },
      { term: ["Psychic", "Médium"], text: [smallGame() ? "An investigator with one colour. With 2–3 players, each psychic player runs two of them." : "A player investigating with one colour, trying to find their character, location and object.", smallGame() ? "Um investigador com uma cor. Com 2–3 jogadores, cada jogador médium conduz dois." : "Um jogador que investiga com uma cor, tentando descobrir o seu personagem, local e objeto."], page: 5 },
      { term: ["Vision cards", "Cartas de visão"], text: ["The 84 illustrated cards the ghost gives as clues; the ghost always refills a hand of 7.", "As 84 cartas ilustradas que o fantasma dá como pistas; o fantasma sempre repõe a mão até 7."], page: 9 },
      { term: ["Psychic cards", "Cartas de médium"], text: ["The large character, location and object cards laid face up on the table; psychics place intuition tokens on them.", "As cartas grandes de personagem, local e objeto dispostas viradas para cima na mesa; os médiuns põem as fichas de intuição nelas."], page: 6 },
      { term: ["Ghost cards", "Cartas do fantasma"], text: ["Small blue twins of the psychic cards (same numbers); the ghost slides each psychic's three into the game screen.", "Gêmeas pequenas e azuis das cartas de médium (mesmos números); o fantasma encaixa as três de cada médium no biombo."], page: 7 },
      { term: ["Combination", "Combinação"], text: ["A psychic's secret character + location + object. All combinations are different.", "O personagem + local + objeto secretos de um médium. Todas as combinações são diferentes."], page: 8 },
      { term: ["Game screen", "Biombo"], text: ["The ghost's screen; inside, one coloured column per psychic and one row per card type.", "A tela do fantasma; por dentro, uma coluna colorida por médium e uma linha por tipo de carta."], page: 7 },
      { term: ["Ghost token", "Ficha do fantasma"], text: ["One per colour, behind the screen; pushed against it when that psychic has had their vision. Numbered 1–6 on the back to label the groups in Phase 2.", "Uma por cor, atrás do biombo; empurrada contra ele quando o médium recebe a visão. Numerada de 1 a 6 no verso para identificar os grupos na Fase 2."], page: 9 },
      { term: ["Intuition token", "Ficha de intuição"], text: ["A psychic's coloured figure: shows which progress board they are on and which psychic card they guess.", "A figura colorida do médium: mostra em que tabuleiro de progresso ele está e em qual carta de médium ele aposta."], page: 9 },
      { term: ["Progress boards", "Tabuleiros de progresso"], text: ["Character, location, object and epilogue boards in a row; intuition tokens advance from one to the next.", "Tabuleiros de personagem, local, objeto e epílogo em fila; as fichas de intuição avançam de um para o outro."], page: 6 },
      { term: ["Epilogue progress board", "Tabuleiro de epílogo"], text: ["The last progress board: its mission accomplished space holds finished psychics; its culprit space holds the culprit token.", "O último tabuleiro de progresso: o espaço de missão cumprida recebe os médiuns que terminaram; o espaço do culpado recebe a ficha de culpado."], page: 6 },
      { term: ["Sleeve", "Sleeve (capa)"], text: [`Each psychic's card holder: correct psychic cards go in it${usesTrack() ? "; in the straw poll it hides your vote" : ""}.`, `O porta-cartas de cada médium: as cartas de médium certas vão nele${usesTrack() ? "; na votação ele esconde o seu voto" : ""}.`], page: 10 },
      { term: ["Hour", "Hora"], text: ["One game turn of Phase 1. The clock runs from I to VII.", "Um turno da Fase 1. O relógio vai de I a VII."], page: 8 },
      { term: ["Sand timer", "Ampulheta"], text: ["2 minutes for the psychics to place their intuition tokens each hour.", "2 minutos para os médiuns colocarem as fichas de intuição a cada hora."], page: 9 },
      { term: ["Crow marker", "Marcador de Corvo"], text: ["Marks each time the ghost discards vision cards to draw new ones; the number allowed depends on difficulty.", "Marca cada vez que o fantasma descarta cartas de visão para comprar novas; o número permitido depende da dificuldade."], page: 9 },
      { term: ["Culprit token", "Ficha de culpado"], text: ["Numbered 1–6; the ghost hides the culprit group's number on the epilogue board.", "Numeradas de 1 a 6; o fantasma esconde o número do grupo do culpado no tabuleiro de epílogo."], page: 11 },
      { term: ["Shared vision", "Visão compartilhada"], text: ["The three vision cards the ghost picks in Phase 2, pointing to the culprit's character, location and object.", "As três cartas de visão que o fantasma escolhe na Fase 2, apontando para o personagem, o local e o objeto do culpado."], page: 11 },
      { term: ["Straw poll", "Votação"], text: [usesTrack() ? "The secret majority vote for the culprit's group, staggered by clairvoyancy level." : (state.players === 2 ? "The psychic player's choice of the culprit's group with one intuition token." : "The open vote: both psychic players agree on one group."), usesTrack() ? "O voto secreto por maioria no grupo do culpado, escalonado pelo nível de clarividência." : (state.players === 2 ? "A escolha do grupo do culpado pelo jogador médium com uma ficha de intuição." : "O voto aberto: os dois jogadores médiuns concordam com um grupo.")], page: 12 },
      usesTrack() ? { term: ["Clairvoyancy track", "Trilha de clarividência"], text: ["The track where level markers advance for good ✓/✗ bets and early finishes; your level sets how many shared-vision cards you see.", "A trilha onde os marcadores de nível avançam por apostas ✓/✗ certas e por terminar cedo; o seu nível define quantas cartas da visão compartilhada você vê."], page: 11 } : null,
      usesTrack() ? { term: ["Clairvoyancy tokens", "Fichas de clarividência"], text: ["✓/✗ bets on other psychics' intuitions; their numbered backs are the ballots of the straw poll.", "Apostas ✓/✗ nas intuições dos outros médiuns; os versos numerados são as cédulas da votação."], page: 10 } : null,
      { term: ["Samhain", "Samhain"], text: ["Halloween night, when the séance takes place; the story's deadline.", "A noite de Halloween, quando acontece a sessão; o prazo da história."], page: 5 }
    ].filter(Boolean);
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), sectionIndex("glossary"), [6, 7])}
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
    document.body.classList.add("theme-mysterium");
    document.documentElement.lang = state.language;
    document.title = t("Mysterium — Field Manual", "Mysterium — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Mysterium: a cooperative deduction game where a silent ghost guides psychics with vision cards — filtered setup checklist by player count and difficulty, hour-by-hour turn, clairvoyancy, the final vote and the rulebook examples.",
        "Regras interativas bilíngues de Mysterium: um jogo cooperativo de dedução em que um fantasma silencioso guia médiuns com cartas de visão — lista de preparação filtrada por número de jogadores e dificuldade, turno hora a hora, clarividência, a votação final e os exemplos do manual."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook", "Livro interativo")}</p>
          <h1>Mysterium</h1>
          <p class="hero-intro">${t(
            "Samhain night, 1920s Scotland. A ghost too weak to speak sends dream-like visions; the psychics must reconstruct the night of his death — who, where, with what — before the seventh hour, then name the culprit.",
            "Noite de Samhain, Escócia dos anos 1920. Um fantasma fraco demais para falar envia visões oníricas; os médiuns precisam reconstituir a noite da sua morte — quem, onde, com quê — antes da sétima hora, e então apontar o culpado."
          )}</p>
          <div class="hero-meta"><span>${t("2–7 players", "2–7 jogadores")}</span><span>${t("Cooperative", "Cooperativo")}</span><span>${t("1 ghost vs. time", "1 fantasma contra o tempo")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/mysterium.webp" alt="${t("Cover of the Mysterium rulebook", "Capa do livro de regras de Mysterium")}" fetchpriority="high"><figcaption>${t("Rulebook cover · Libellud", "Capa do livro de regras · Libellud")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("The séance", "A sessão")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column mys-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied 12-page English rulebook (Libellud). PDF page numbers match the printed ones; pages 2–4 are the background story and character profiles. The rulebook is a low-resolution scan, so pictures are reproduced as they are. Points marked “Guide's reading” are interpretations where the rulebook is silent. The ghost's cards are secret: never look behind the screen, and this page never records them.",
            "Este guia cobre o livro de regras em inglês fornecido, de 12 páginas (Libellud). Os números de página do PDF correspondem aos impressos; as páginas 2–4 são a história de fundo e os perfis dos personagens. O livro é um escaneamento de baixa resolução, então as figuras são reproduzidas como estão. Trechos marcados como “Leitura do guia” são interpretações onde o livro é omisso. As cartas do fantasma são secretas: nunca olhem atrás do biombo, e esta página nunca as registra."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${victorySection()}</section>
          <section class="rule-section">${phaseOneSection()}</section>
          <section class="rule-section">${phaseTwoSection()}</section>
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the Mysterium rulebook. Mysterium is a game by Oleksandr Nevskiy and Oleg Sidorenko, published by Libellud.",
        "Guia pessoal de consulta baseado no livro de regras de Mysterium. Mysterium é um jogo de Oleksandr Nevskiy e Oleg Sidorenko, publicado pela Libellud."
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
      root.querySelector(".mys-page")?.prepend(notice);
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
    if (target.matches("[data-players]")) {
      const value = Number(target.dataset.players);
      if (PLAYERS.includes(value) && value !== state.players) {
        applyMatchChange({ players: value });
      }
      return;
    }
    if (target.matches("[data-difficulty]")) {
      const value = target.dataset.difficulty;
      if (DIFFICULTIES.includes(value) && value !== state.difficulty) {
        applyMatchChange({ difficulty: value });
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

  window.Mysterium = { renderInto, onClick, onChange };
})();
