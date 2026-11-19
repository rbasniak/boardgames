(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.wyrmspan.v1";
  const SETUP_KEY = "field-manual.wyrmspan.setup.v1";
  const MANUAL = "wyrmspan_core.pdf";
  const ASSETS = "assets/wyrmspan/";
  const ICONS = `${ASSETS}icons/`;
  const ART = `${ASSETS}art/`;
  // Source: "c" = Wyrmspan rulebook (Stonemaier Games, 2023, 16 pp.; printed page = PDF page).
  // The solo Automa rulebook is a separate booklet and is NOT supplied, so 1-player games are not covered.
  // The 10 "quick start guides" listed on p. 1 are not described by the rulebook.
  const PLAYER_COUNTS = [2, 3, 4, 5];
  const defaults = {
    language: "pt-BR",
    players: 3
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
      players: PLAYER_COUNTS.includes(players) ? players : defaults.players
    };
  }

  // Only the choices that change the physical setup are part of the checklist signature.
  function signature(source = state) {
    return `p${source.players}`;
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Wyrmspan preferences.", error);
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
      console.error("Could not read Wyrmspan setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Wyrmspan preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Wyrmspan setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function manualUrl(code) {
    const script = document.querySelector('script[src*="wyrmspan.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${MANUAL}`, baseUrl).href}#page=${Number(code.slice(1))}`;
  }

  // Page codes: c<n> = Wyrmspan rulebook page n.
  function referenceLink(code) {
    const page = code.slice(1);
    return `<a class="source-link" href="${manualUrl(code)}" target="_blank" rel="noreferrer">${t(`Rulebook p. ${page} ↗`, `Livro p. ${page} ↗`)}</a>`;
  }

  function refs(codes) {
    return codes.map(referenceLink).join("");
  }

  function sectionHeading(id, title, codes) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("DRACOLOGIST'S NOTEBOOK", "CADERNO DO DRACÓLOGO")} / ${sectionIndex(id)}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="wy-section-references">${refs(codes)}</div>
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
    return `<span class="wy-interpretation">${t("Guide's reading", "Leitura do guia")}:</span> ${t(en, pt)}`;
  }

  function glyph(file, alt) {
    return `<img class="wy-glyph" src="${ICONS}${file}.webp" alt="${alt}">`;
  }

  function figure(file, altEn, altPt, captionEn, captionPt) {
    return `<figure class="wy-art"><img src="${ART}${file}.webp" alt="${t(altEn, altPt)}" loading="lazy"><figcaption>${t(captionEn, captionPt)}</figcaption></figure>`;
  }

  function playersLabel(players = state.players) {
    return t(`${players} players`, `${players} jogadores`);
  }

  function bigGame() {
    return state.players >= 4;
  }

  function guildSide() {
    return bigGame()
      ? t("the side marked “4-5 player”", "o lado marcado “4-5 player”")
      : t("the side NOT marked “4-5 player”", "o lado SEM a marca “4-5 player”");
  }

  // Cave names: English as printed on the mat, Portuguese with the printed name in brackets.
  function cave(key) {
    return {
      crimson: t("Crimson Cavern", "Caverna Carmesim (Crimson Cavern)"),
      golden: t("Golden Grotto", "Gruta Dourada (Golden Grotto)"),
      amethyst: t("Amethyst Abyss", "Abismo de Ametista (Amethyst Abyss)")
    }[key];
  }

  // ---------- sections ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["overview", t("Rounds & turns", "Rodadas e turnos")],
      ["actions", t("Excavate · Entice · Explore", "Escavar · Atrair · Explorar")],
      ["dragons", t("Dragons & hatchlings", "Dragões e filhotes")],
      ["guild", t("Dragon Guild", "Guilda dos Dragões")],
      ["additional", t("Additional rules", "Regras adicionais")],
      ["round-end", t("Round end & objectives", "Fim da rodada e objetivos")],
      ["game-end", t("Game end & scoring", "Fim de jogo e pontuação")],
      ["wingspan", t("If you know Wingspan", "Se você conhece Wingspan")],
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
          <span class="brand-mark" aria-hidden="true">WY</span>
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

  function choiceCard(name, dataAttr, value, checked, title, description, disabled = false) {
    return `
      <label class="wy-choice-card ${checked ? "is-selected" : ""} ${disabled ? "is-disabled" : ""}">
        <input type="radio" name="${name}" value="${value}" data-${dataAttr}="${value}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}>
        <span class="wy-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function matchConfiguration() {
    const playerText = (n) => ({
      2: t("2 mats and 2 colours. Dragon Guild tile on the side not marked “4-5 player”. Each objective has a 1st and a 2nd place (a player with zero of the item goes to “all others”, 0 VP).", "2 tabuleiros e 2 cores. Peça da Guilda dos Dragões no lado sem a marca “4-5 player”. Cada objetivo tem 1º e 2º lugar (quem tiver zero do item vai para “todos os outros”, 0 PV)."),
      3: t("3 mats and 3 colours. Dragon Guild tile on the side not marked “4-5 player”.", "3 tabuleiros e 3 cores. Peça da Guilda dos Dragões no lado sem a marca “4-5 player”."),
      4: t("4 mats and 4 colours. Dragon Guild tile on its “4-5 player” side. The 4th-placed player on an objective scores 0 (“all others”).", "4 tabuleiros e 4 cores. Peça da Guilda dos Dragões no lado “4-5 player”. Quem fica em 4º num objetivo marca 0 (“todos os outros”)."),
      5: t("All 5 mats and colours. Dragon Guild tile on its “4-5 player” side. 4th and 5th place on an objective score 0 (“all others”).", "Os 5 tabuleiros e cores. Peça da Guilda dos Dragões no lado “4-5 player”. 4º e 5º lugar num objetivo marcam 0 (“todos os outros”).")
    }[n]);
    return `
      <section class="controls-panel wy-config" id="build-match" aria-labelledby="wy-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="wy-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "Wyrmspan has no expansions or optional rules in the supplied rulebook: the only choice that changes the setup is the number of players. Changing it clears the setup checklist; switching the language clears nothing.",
              "Wyrmspan não tem expansões nem regras opcionais no livro fornecido: a única escolha que muda a preparação é o número de jogadores. Mudá-lo limpa a lista da preparação; trocar o idioma não limpa nada."
            )}</p>
          </div>
        </div>
        <fieldset class="wy-choice-group">
          <legend>${t("Players · selected:", "Jogadores · selecionado:")} <span>${playersLabel()}</span></legend>
          <p class="wy-choice-intro">${t("The box says 1–5 players. The player count decides how many colours are used and which side of the Dragon Guild tile is face up.", "A caixa diz 1–5 jogadores. O número de jogadores decide quantas cores são usadas e qual lado da peça da Guilda dos Dragões fica para cima.")} ${refs(["c1", "c2"])}</p>
          <div class="wy-choice-grid wy-choice-grid-5">
            ${choiceCard("wy-players", "players", 1, false, t("1 player (solo)", "1 jogador (solo)"), `${t("Solo play uses an artificial opponent (the Automa) whose rules are in a separate booklet. That booklet is not among the supplied manuals, so this guide cannot cover it.", "O solo usa um oponente artificial (a Automa) cujas regras estão num livreto separado. Esse livreto não está entre os manuais fornecidos, então este guia não pode cobri-lo.")} <em>${t("Not covered.", "Não coberto.")}</em>`, true)}
            ${PLAYER_COUNTS.map((n) => choiceCard("wy-players", "players", n, state.players === n, playersLabel(n), playerText(n))).join("")}
          </div>
        </fieldset>
        <p class="wy-config-summary"><strong>${t("This match:", "Esta partida:")}</strong> ${playersLabel()} · ${t("competitive, 4 rounds", "competitiva, 4 rodadas")} · ${t("Dragon Guild tile", "peça da Guilda")}: ${guildSide()}</p>
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function setupPhases() {
    const n = state.players;
    return [
      {
        id: "guild",
        title: t("Dragon Guild board and tile", "Tabuleiro e peça da Guilda dos Dragões"),
        codes: ["c2", "c12"],
        items: [
          t("Put the Dragon Guild board in the centre of the table.", "Ponha o tabuleiro da Guilda dos Dragões no centro da mesa."),
          t("Take 1 of the 4 double-sided Dragon Guild tiles at random (Guild of Seafarers, Guild of Highlands, Plains Guild, Rainforest Guild).", "Pegue ao acaso 1 das 4 peças dupla face da Guilda dos Dragões (Guild of Seafarers, Guild of Highlands, Plains Guild, Rainforest Guild)."),
          t(`Place it in the middle of the board (the space reads “Place Dragon Guild tile here”) with ${guildSide()} face up — the right side for ${n} players.`, `Ponha-a no meio do tabuleiro (o espaço diz “Place Dragon Guild tile here”) com ${guildSide()} para cima — o lado certo para ${n} jogadores.`),
          bigGame() ? "" : interpretation("the rulebook only says “the appropriate side (based on player count)”; one side of each tile is printed “4-5 player”, so with 2–3 players the guide uses the other side.", "o livro diz só “o lado apropriado (conforme o número de jogadores)”; um lado de cada peça traz “4-5 player”, então com 2–3 jogadores o guia usa o outro lado."),
          t("Return the other 3 tiles to the box.", "Devolva as outras 3 peças à caixa.")
        ]
      },
      {
        id: "display",
        title: t("Card display: dragons and cave cards", "Mostruário de cartas: dragões e cartas de caverna"),
        codes: ["c2", "c11"],
        items: [
          t("Put the card display board next to the Dragon Guild board.", "Ponha o tabuleiro mostruário de cartas ao lado do tabuleiro da Guilda."),
          t("Dragons: shuffle all 183 dragon cards (tall rectangular cards). Deal 3 face up onto the 3 dragon spaces (top row, “DRAGON CARDS”). Put the deck face down beside the board.", "Dragões: embaralhe as 183 cartas de dragão (cartas retangulares altas). Ponha 3 viradas para cima nos 3 espaços de dragão (fileira de cima, “DRAGON CARDS”). Deixe o baralho virado para baixo ao lado do tabuleiro."),
          t("Cave cards: shuffle all 75 cave cards (square cards). Deal 3 face up onto the 3 cave spaces (bottom row, “CAVE CARDS”). Put this deck face down beside the board too.", "Cartas de caverna: embaralhe as 75 cartas de caverna (cartas quadradas). Ponha 3 viradas para cima nos 3 espaços de caverna (fileira de baixo, “CAVE CARDS”). Deixe também este baralho virado para baixo ao lado do tabuleiro."),
          t("Leave room for two face-up discard piles, one for dragons and one for cave cards (cards are always discarded face up).", "Deixe espaço para duas pilhas de descarte viradas para cima, uma de dragões e outra de cartas de caverna (cartas são sempre descartadas viradas para cima).")
        ]
      },
      {
        id: "tracker",
        title: t("Round tracker and objectives", "Marcador de rodadas e objetivos"),
        codes: ["c2", "c14"],
        items: [
          t("Put the round tracker board where everyone can see it and the round marker (pink cylinder) on the Round 1 space.", "Ponha o tabuleiro marcador de rodadas onde todos vejam e o marcador de rodada (cilindro rosa) no espaço da Rodada 1."),
          t("Shuffle the 10 double-sided objective tiles. Place 4 at random on the 4 objective spaces (one under each round), each with a random side up.", "Embaralhe as 10 peças de objetivo dupla face. Ponha 4 ao acaso nos 4 espaços de objetivo (uma abaixo de cada rodada), cada uma com um lado ao acaso para cima."),
          t("Return the other 6 tiles to the box.", "Devolva as outras 6 peças à caixa."),
          t("Each tile also shows the Automa (solo) icon with numbers such as 0/1/2/3: ignore them in your game.", "Cada peça também mostra o ícone da Automa (solo) com números como 0/1/2/3: ignore-os na sua partida.")
        ]
      },
      {
        id: "supply",
        title: t("General supply", "Reserva geral"),
        codes: ["c1", "c2"],
        items: [
          t("Within reach of all players: 45 coins (silver), 55 eggs, 25 meat (red), 25 gold (yellow), 25 crystal (purple) and 25 milk (white).", "Ao alcance de todos: 45 moedas (prateadas), 55 ovos, 25 carnes (vermelhas), 25 ouros (amarelos), 25 cristais (roxos) e 25 leites (brancos)."),
          t("Egg colours are only decoration: all eggs work the same.", "As cores dos ovos são só decoração: todos os ovos funcionam igual."),
          t("Keep the 20 multiplier tokens (×2, ×5) nearby: put one on a pile of resources or eggs if the supply runs low. Only player markers are limited; replace any other piece that runs out.", "Deixe perto os 20 marcadores multiplicadores (×2, ×5): ponha um sobre uma pilha de recursos ou ovos se a reserva acabar. Só os marcadores de jogador são limitados; substitua qualquer outra peça que acabar.")
        ]
      },
      {
        id: "mats",
        title: t(`Player mats and pieces (${n} players)`, `Tabuleiros e peças dos jogadores (${n} jogadores)`),
        codes: ["c2", "c3"],
        items: [
          t(`Each of the ${n} players picks a colour and takes 1 player mat plus all pieces of that colour: 1 adventurer (meeple), 8 player markers (cubes) and 1 guild token (shield). ${5 - n ? `The other ${5 - n} colour${5 - n > 1 ? "s" : ""} and mat${5 - n > 1 ? "s" : ""} stay in the box.` : ""}`, `Cada um dos ${n} jogadores escolhe uma cor e pega 1 tabuleiro de jogador e todas as peças dessa cor: 1 aventureiro (meeple), 8 marcadores de jogador (cubos) e 1 ficha de guilda (escudo). ${5 - n ? `${5 - n > 1 ? `As outras ${5 - n} cores e tabuleiros ficam` : "A outra cor e tabuleiro ficam"} na caixa.` : ""}`),
          t("A · Put your mat in front of you: actions on the left, then the 3 caves from top to bottom — Crimson Cavern, Golden Grotto, Amethyst Abyss. The first (leftmost) space of each cave is already excavated.", "A · Ponha o tabuleiro à sua frente: ações à esquerda, depois as 3 cavernas de cima para baixo — Caverna Carmesim, Gruta Dourada, Abismo de Ametista. O primeiro espaço (mais à esquerda) de cada caverna já está escavado."),
          t("E · Put your adventurer on Base Camp, the space on the left of your mat that reads “Return your adventurer here at the end of your turn”.", "E · Ponha o aventureiro no Acampamento Base (Base Camp), o espaço à esquerda do tabuleiro que diz “Return your adventurer here at the end of your turn”."),
          t("F · Put your guild token on the Dragon Guild track space labelled “START” (top of the board).", "F · Ponha a ficha de guilda no espaço “START” da trilha da Guilda dos Dragões (no alto do tabuleiro)."),
          t("G · Keep your 8 player markers next to your mat: 4 will mark your place on the 4 objectives, up to 4 can go onto the Dragon Guild tile.", "G · Deixe os 8 marcadores de jogador ao lado do tabuleiro: 4 marcarão a sua posição nos 4 objetivos e até 4 podem ir para a peça da Guilda dos Dragões.")
        ]
      },
      {
        id: "cards",
        title: t("Starting hand", "Mão inicial"),
        codes: ["c2"],
        items: [
          t("Each player draws 3 dragon cards and 3 cave cards from the top of the decks (not from the display).", "Cada jogador compra 3 cartas de dragão e 3 cartas de caverna do topo dos baralhos (não do mostruário)."),
          t("Keep 4 of those 6 cards in any combination of dragons and caves as your starting hand.", "Fique com 4 dessas 6 cartas, em qualquer combinação de dragões e cavernas, como mão inicial."),
          t("Discard the other 2 face up: they start the dragon and cave discard piles.", "Descarte as outras 2 viradas para cima: elas começam as pilhas de descarte de dragões e de cavernas."),
          t("The rulebook allows hands to be kept face up or face down: agree on one as a table.", "O livro permite manter as mãos viradas para cima ou para baixo: combinem uma das formas na mesa.")
        ]
      },
      {
        id: "items",
        title: t("Starting coins, egg and resources", "Moedas, ovo e recursos iniciais"),
        codes: ["c2"],
        items: [
          t("D · Take 6 coins from the supply; put them to the left of your mat.", "D · Pegue 6 moedas da reserva; ponha-as à esquerda do tabuleiro."),
          t("C · Take 1 egg and put it on 1 of the 2 nest icons at the bottom left of your mat (“STORE 2 EGGS HERE”). There are 2 nests, but you start with only 1 egg.", "C · Pegue 1 ovo e ponha-o em 1 dos 2 ícones de ninho no canto inferior esquerdo do tabuleiro (“STORE 2 EGGS HERE”). Há 2 ninhos, mas você começa com só 1 ovo."),
          t("B · Choose 3 resource tokens in any combination of gold, crystal, meat and milk; put them to the left of your mat (your personal supply).", "B · Escolha 3 fichas de recurso em qualquer combinação de ouro, cristal, carne e leite; ponha-as à esquerda do tabuleiro (a sua reserva pessoal)."),
          t("Tip: look at your starting dragons first and pick resources that match their costs (upper-left of each dragon).", "Dica: olhe primeiro os seus dragões iniciais e escolha recursos que combinem com o custo deles (canto superior esquerdo de cada dragão).")
        ]
      },
      {
        id: "start",
        title: t("Start player", "Primeiro jogador"),
        codes: ["c2", "c4"],
        items: [
          t("Give the start player marker (dragon disc) to a random player.", "Dê o marcador de primeiro jogador (disco com dragão) a um jogador sorteado."),
          t("Round 1 begins: that player takes the first turn, then play goes clockwise.", "A Rodada 1 começa: esse jogador faz o primeiro turno e o jogo segue em sentido horário.")
        ]
      }
    ];
  }

  function inventory() {
    const n = state.players;
    const cards = [
      infoCard(t("SHARED", "COMPARTILHADO"), t("Centre of the table", "Centro da mesa"), [
        rl("Dragon Guild", `board + 1 of 4 tiles (${state.players >= 4 ? "“4-5 player” side" : "side not marked “4-5 player”"}).`, "Guilda dos Dragões", `tabuleiro + 1 de 4 peças (${state.players >= 4 ? "lado “4-5 player”" : "lado sem “4-5 player”"}).`),
        rl("Card display", "board, 3 dragons + 3 cave cards face up.", "Mostruário", "tabuleiro, 3 dragões + 3 cavernas virados para cima."),
        rl("Decks", "183 dragon cards, 75 cave cards (face down).", "Baralhos", "183 cartas de dragão, 75 cartas de caverna (viradas para baixo)."),
        rl("Round tracker", "board, round marker, 4 of the 10 objective tiles.", "Marcador de rodadas", "tabuleiro, marcador de rodada, 4 das 10 peças de objetivo."),
        rl("Supply", "45 coins, 55 eggs, 25 each of meat, gold, crystal, milk; 20 multiplier tokens.", "Reserva", "45 moedas, 55 ovos, 25 de cada: carne, ouro, cristal, leite; 20 multiplicadores."),
        rl("Also", "start player marker, score pad.", "Também", "marcador de primeiro jogador, bloco de pontos.")
      ], ["c1", "c2"]),
      infoCard(t("PER PLAYER", "POR JOGADOR"), t(`${n} sets`, `${n} conjuntos`), [
        rl("Player mat", "1.", "Tabuleiro de jogador", "1."),
        rl("Pieces of one colour", "1 adventurer, 8 player markers, 1 guild token.", "Peças de uma cor", "1 aventureiro, 8 marcadores de jogador, 1 ficha de guilda."),
        rl("Coins", "6.", "Moedas", "6."),
        rl("Egg", "1, on a mat nest.", "Ovo", "1, num ninho do tabuleiro."),
        rl("Resources", "3 of your choice.", "Recursos", "3 à sua escolha."),
        rl("Cards", "draw 3 dragons + 3 caves, keep 4.", "Cartas", "compre 3 dragões + 3 cavernas, fique com 4.")
      ], ["c2"]),
      infoCard(t("NOT USED", "NÃO USADO"), t("Left in the box", "Fica na caixa"), [
        rl("Guild tiles", "the 3 not drawn.", "Peças da Guilda", "as 3 não sorteadas."),
        rl("Objective tiles", "the 6 not drawn.", "Peças de objetivo", "as 6 não sorteadas."),
        5 - n ? rl("Colours", `${5 - n} mat${5 - n > 1 ? "s" : ""} and colour set${5 - n > 1 ? "s" : ""}.`, "Cores", `${5 - n} tabuleiro${5 - n > 1 ? "s" : ""} e conjunto${5 - n > 1 ? "s" : ""} de cor.`) : "",
        rl("Quick start guides", "10 double-sided sheets listed in the box contents; the rulebook does not use or describe them.", "Guias de início rápido", "10 folhas dupla face listadas no conteúdo da caixa; o livro não as usa nem descreve.")
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
        <label class="wy-setup-check" for="wy-setup-${phase.id}">
          <input id="wy-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="wy-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="wy-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");
    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), ["c2", "c3"])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${playersLabel()}</h3>
            <p>${t("One checkbox per coherent step, in the rulebook's order (the starting hand comes before the resources so you can pick resources that fit your dragons). Letters A–G match the rulebook's picture on p. 3.", "Uma caixa por etapa coerente, na ordem do livro (a mão inicial vem antes dos recursos para você escolher recursos que sirvam aos seus dragões). As letras A–G correspondem à imagem do livro na p. 3.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved on this device separately from the match options. Changing the player count clears it; the language does not. “Uncheck all” clears only these setup boxes.",
          "O progresso é salvo neste aparelho separado das opções da partida. Mudar o número de jogadores o limpa; o idioma não. “Desmarcar tudo” limpa somente estas caixas da preparação."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <div class="wy-art-row">
        ${figure("dragon-guild", "The Dragon Guild board with a guild tile in the middle and the track around it", "O tabuleiro da Guilda dos Dragões com uma peça no meio e a trilha em volta", "Dragon Guild board (p. 3): START at the top, the two brown spaces at top and bottom, tile in the middle.", "Tabuleiro da Guilda (p. 3): START no alto, os dois espaços marrons em cima e embaixo, peça no meio.")}
        ${figure("round-tracker", "The round tracker with 4 objective tiles and the 1st/2nd/3rd/other rows", "O marcador de rodadas com 4 peças de objetivo e as fileiras 1º/2º/3º/outros", "Round tracker (p. 3): objectives under rounds 1–4, VP rows for 1st, 2nd, 3rd and other places.", "Marcador de rodadas (p. 3): objetivos sob as rodadas 1–4, fileiras de PV para 1º, 2º, 3º e outros lugares.")}
        ${figure("card-display", "The card display with 3 dragons on top and 3 cave cards below", "O mostruário com 3 dragões em cima e 3 cartas de caverna embaixo", "Card display (p. 3): 3 dragons (top), 3 cave cards (bottom).", "Mostruário (p. 3): 3 dragões (em cima), 3 cartas de caverna (embaixo).")}
      </div>
      ${figure("player-mat", "A player mat: action column on the left, then the Crimson Cavern, Golden Grotto and Amethyst Abyss rows", "Um tabuleiro de jogador: coluna de ações à esquerda, depois as fileiras da Caverna Carmesim, Gruta Dourada e Abismo de Ametista", "Player mat (p. 3). Left: the Excavate, Entice and Explore actions, Base Camp (E) and the 2 nests (C). Each cave: entrance costs, then 4 spaces with “if activated” icons along the path below them.", "Tabuleiro de jogador (p. 3). À esquerda: as ações Escavar, Atrair e Explorar, o Acampamento Base (E) e os 2 ninhos (C). Cada caverna: custos da entrada, depois 4 espaços com ícones “se ativado” no caminho abaixo deles.")}
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}`;
  }

  // ---------- quick reference ----------

  function roundEndLines() {
    return [
      rl("1 · Clean mats", "discard the coins and eggs you paid as costs onto your mat this round.", "1 · Limpar tabuleiros", "descarte as moedas e ovos pagos como custo no seu tabuleiro nesta rodada."),
      `${glyph("once-per-round", t("Once per round", "Uma vez por rodada"))} ${rl("2 · Once-per-round dragons", "in turn order from this round's start player; your own in any order; “all players” choices go clockwise from the owner.", "2 · Dragões “uma vez por rodada”", "na ordem dos turnos a partir do primeiro jogador desta rodada; os seus em qualquer ordem; escolhas de “todos os jogadores” seguem em sentido horário a partir do dono.")}`,
      rl("3 · Score the objective", "each player puts 1 player marker in the row of their place under this round's objective (friendly ties; zero of the item = “all others”).", "3 · Pontuar o objetivo", "cada jogador põe 1 marcador de jogador na fileira da sua posição sob o objetivo desta rodada (empates amigáveis; zero do item = “todos os outros”)."),
      rl("After round 4", "the game ends here: final scoring.", "Depois da rodada 4", "o jogo acaba aqui: contagem final."),
      rl("Next round · a", "round marker 1 space right.", "Próxima rodada · a", "marcador de rodada 1 espaço à direita."),
      rl("Next round · b", "refresh the display: discard the 3 + 3 face-up cards, deal 3 + 3 new.", "Próxima rodada · b", "renove o mostruário: descarte as 3 + 3 cartas viradas, ponha 3 + 3 novas."),
      rl("Next round · c", "everyone gains 6 coins and 1 egg (egg only if you have an empty nest).", "Próxima rodada · c", "todos ganham 6 moedas e 1 ovo (o ovo só se tiver ninho vazio)."),
      rl("Next round · d", "start player marker 1 player clockwise (it sets who starts the next round and the once-per-round order).", "Próxima rodada · d", "marcador de primeiro jogador passa 1 jogador em sentido horário (define quem começa a próxima rodada e a ordem do “uma vez por rodada”).")
    ];
  }

  function quickReference() {
    const cards = [
      infoCard(t("YOUR TURN", "SEU TURNO"), t("Take exactly 1 action — or pass", "Faça exatamente 1 ação — ou passe"), [
        `${glyph("cave-card", t("Cave card", "Carta de caverna"))} ${rl("Excavate", "pay 1 coin (+1 egg in column 3, +2 eggs in column 4); play a cave card from your hand into the leftmost empty space of a cave; take its “when played” benefit; covering a column-4 space also lets you once trade 3 items (resources/cards) for 1 coin.", "Escavar", "pague 1 moeda (+1 ovo na coluna 3, +2 ovos na coluna 4); jogue uma carta de caverna da mão no espaço vazio mais à esquerda de uma caverna; pegue o benefício “ao jogar” dela; cobrir um espaço da coluna 4 também permite trocar uma vez 3 itens (recursos/cartas) por 1 moeda.")}`,
        `${glyph("dragon-card", t("Dragon card", "Carta de dragão"))} ${rl("Entice", "pay 1 coin + the dragon's printed cost; play it into the leftmost excavated, dragon-free space of a cave it can live in.", "Atrair", "pague 1 moeda + o custo impresso do dragão; jogue-o no espaço escavado e sem dragão mais à esquerda de uma caverna onde ele possa viver.")}`,
        `${glyph("activated", t("If activated", "Se ativado"))} ${rl("Explore a cave", "Crimson, Golden or Amethyst. 1st time this round 1 coin; 2nd 1 coin + 1 egg; 3rd (max) 1 coin + 2 eggs. Walk left to right; you may use each “if activated” ability you pass (optional); stop at the first space without a dragon.", "Explorar uma caverna", "Carmesim, Dourada ou Ametista. 1ª vez na rodada 1 moeda; 2ª 1 moeda + 1 ovo; 3ª (máx.) 1 moeda + 2 ovos. Ande da esquerda para a direita; pode usar cada habilidade “se ativado” pela qual passar (opcional); pare no primeiro espaço sem dragão.")}`,
        rl("Paying", "put the coin and eggs on that action's cost space of your mat (they stay until round end). Eggs come from any of your dragons or mat nests.", "Pagar", "ponha a moeda e os ovos no espaço de custo da ação no tabuleiro (ficam até o fim da rodada). Ovos saem de qualquer dragão seu ou dos ninhos do tabuleiro."),
        rl("Pass", "whenever you want (usually when out of coins or playable dragons). No more turns this round, but you still take benefits other players' turns give you.", "Passar", "quando quiser (em geral sem moedas ou sem dragões jogáveis). Sem mais turnos nesta rodada, mas você ainda recebe benefícios que os turnos dos outros dão."),
        rl("Round ends", "when everyone has passed. Coins, resources, cards and eggs carry over.", "A rodada acaba", "quando todos tiverem passado. Moedas, recursos, cartas e ovos continuam com você.")
      ], ["c4", "c5", "c6", "c10"]),
      infoCard(t("END OF YOUR TURN", "FIM DO SEU TURNO"), t("Every time, in this order", "Sempre, nesta ordem"), [
        rl("Adventurer", "back to Base Camp.", "Aventureiro", "de volta ao Acampamento Base."),
        rl("Limits", "discard down to 9 coins, 9 cards (dragons + cave cards together) and 9 resource tokens.", "Limites", "descarte até ficar com 9 moedas, 9 cartas (dragões + cavernas juntos) e 9 fichas de recurso."),
        rl("Refill", "top the card display back up to 3 dragons and 3 cave cards, empty spaces only (only now, never mid-turn; not the same as the round's refresh).", "Repor", "complete o mostruário até 3 dragões e 3 cartas de caverna, só os espaços vazios (só agora, nunca no meio do turno; não é a renovação da rodada)."),
        rl("Next", "the next player clockwise who has not passed.", "Próximo", "o próximo jogador em sentido horário que não passou.")
      ], ["c10", "c11", "c14"]),
      infoCard(t("ANY TIME", "A QUALQUER MOMENTO"), t("Always-on rules", "Regras sempre válidas"), [
        `${glyph("any-resource", t("Any resource", "Qualquer recurso"))} ${rl("Exchange", "2 resources (any mix of gold, crystal, meat, milk) → 1 resource of another type. Coins and eggs are not resources.", "Troca", "2 recursos (qualquer mistura de ouro, cristal, carne, leite) → 1 recurso de outro tipo. Moedas e ovos não são recursos.")}`,
        rl("Abilities are optional", "but if one gives opponents something, they may take it even if you decline yours.", "Habilidades são opcionais", "mas se uma der algo aos oponentes, eles podem pegar mesmo que você recuse a sua parte."),
        rl("“All players”", "the active player first, then the others clockwise.", "“Todos os jogadores”", "primeiro o jogador ativo, depois os outros em sentido horário."),
        rl("Hands off", "never put items on or take items from another player's mat.", "Não mexa no tabuleiro dos outros", "nunca ponha nem tire itens do tabuleiro de outro jogador."),
        rl("Itself", "a dragon counting a category (cave, trait, size…) counts itself.", "Ele mesmo", "um dragão que conta uma categoria (caverna, traço, tamanho…) conta a si próprio.")
      ], ["c4", "c6", "c7", "c11"]),
      infoCard(t("EXPLORE PATHS", "CAMINHOS DE EXPLORAÇÃO"), t("Printed on every mat, left to right", "Impressos em todo tabuleiro, da esquerda para a direita"), [
        rl(cave("crimson"), "gain 1 any resource → space 1 → Dragon Guild advance → space 2 → gain 1 any resource → space 3 → lay 1 egg → space 4 → cache up to 2 resources from your supply onto any dragon(s).", cave("crimson"), "ganhe 1 recurso qualquer → espaço 1 → avanço na Guilda → espaço 2 → ganhe 1 recurso qualquer → espaço 3 → ponha 1 ovo → espaço 4 → guarde até 2 recursos da sua reserva em quaisquer dragões."),
        rl(cave("golden"), "gain 1 dragon card → space 1 → guild advance → space 2 → gain 1 dragon card → space 3 → lay 1 egg → space 4 → tuck up to 2 dragon cards from your hand under any dragon(s).", cave("golden"), "ganhe 1 carta de dragão → espaço 1 → avanço na Guilda → espaço 2 → ganhe 1 carta de dragão → espaço 3 → ponha 1 ovo → espaço 4 → enfie até 2 cartas de dragão da mão sob quaisquer dragões."),
        rl(cave("amethyst"), "gain 1 cave card → space 1 → guild advance → space 2 → gain 1 cave card → space 3 → lay 1 egg → space 4 → discard up to 2 cave cards from your hand and lay 2 eggs for each.", cave("amethyst"), "ganhe 1 carta de caverna → espaço 1 → avanço na Guilda → espaço 2 → ganhe 1 carta de caverna → espaço 3 → ponha 1 ovo → espaço 4 → descarte até 2 cartas de caverna da mão e ponha 2 ovos por carta."),
        `${glyph("stop", t("Stop", "Pare"))} ${rl("Stop", "a space without a dragon ends the walk (even if excavated).", "Pare", "um espaço sem dragão encerra a caminhada (mesmo escavado).")}`,
        rl("On a dragon", `use its ${glyph("activated", t("if activated", "se ativado"))} ability if it has one; other dragons do nothing here.`, "Num dragão", `use a habilidade ${glyph("activated", t("if activated", "se ativado"))} dele, se tiver; os outros dragões não fazem nada aqui.`)
      ], ["c3", "c10"]),
      infoCard(t("DRAGON GUILD", "GUILDA DOS DRAGÕES"), `${glyph("guild", t("Dragon Guild", "Guilda dos Dragões"))} ${t("Each advancement", "Cada avanço")}`, [
        rl("Move", "your guild token 1 space clockwise and gain what that space shows (several advancements: gain every space passed and the one you land on).", "Mover", "a sua ficha 1 espaço em sentido horário e ganhe o que o espaço mostra (vários avanços: ganhe cada espaço pelo qual passar e o de chegada)."),
        rl("Brown space (top or bottom)", "immediately place an unused player marker on an empty square of the Dragon Guild tile and take that benefit.", "Espaço marrom (em cima ou embaixo)", "ponha imediatamente um marcador de jogador não usado num quadrado vazio da peça da Guilda e pegue esse benefício."),
        rl("Limits", "1 marker per square (the long end-game box takes any number); at most 4 of your markers on the tile.", "Limites", "1 marcador por quadrado (a caixa longa de fim de jogo aceita quantos quiser); no máximo 4 marcadores seus na peça."),
        rl("Same turn", "several players reaching brown spaces choose clockwise from the active player.", "Mesmo turno", "vários jogadores chegando a espaços marrons escolhem em sentido horário a partir do jogador ativo.")
      ], ["c12", "c13"]),
      infoCard(t("ROUND END", "FIM DA RODADA"), t("After everyone has passed", "Depois que todos passaram"), roundEndLines(), ["c14"]),
      infoCard(t("OBJECTIVE VP", "PV DOS OBJETIVOS"), t("Printed on the round tracker", "Impressos no marcador de rodadas"), [
        rl("Round 1", "1st 4 · 2nd 1 · 3rd 0 · others 0.", "Rodada 1", "1º 4 · 2º 1 · 3º 0 · outros 0."),
        rl("Round 2", "1st 5 · 2nd 2 · 3rd 1 · others 0.", "Rodada 2", "1º 5 · 2º 2 · 3º 1 · outros 0."),
        rl("Round 3", "1st 6 · 2nd 3 · 3rd 2 · others 0.", "Rodada 3", "1º 6 · 2º 3 · 3º 2 · outros 0."),
        rl("Round 4", "1st 7 · 2nd 4 · 3rd 3 · others 0.", "Rodada 4", "1º 7 · 2º 4 · 3º 3 · outros 0."),
        rl("Ties", "all tied players take the full VP of that place; the next player takes the next place.", "Empates", "todos os empatados levam os PV cheios da posição; o jogador seguinte fica com a posição seguinte."),
        rl("Round 1 3rd place = 0", "as printed: it is not a typo.", "3º lugar da rodada 1 = 0", "como impresso: não é erro.")
      ], ["c3", "c14", "c15"]),
      infoCard(t("FINAL SCORE", "PONTUAÇÃO FINAL"), t("Score pad", "Bloco de pontos"), [
        rl("Dragon Guild", "your markers in the tile's bottom “END GAME: Gain printed VP” row (6 / 3 / 1 each, as printed on the square) plus any tile row marked “END GAME” you hold a marker on.", "Guilda dos Dragões", "os seus marcadores na fileira de baixo “END GAME: Gain printed VP” da peça (6 / 3 / 1 cada, como impresso no quadrado) mais qualquer fileira “END GAME” da peça em que tenha marcador."),
        rl("Dragons", "printed VP of visible dragons on your mat.", "Dragões", "PV impressos dos dragões visíveis no tabuleiro."),
        `${glyph("end-game", t("End game", "Fim de jogo"))} ${rl("End-game abilities", "on visible dragons.", "Habilidades de fim de jogo", "dos dragões visíveis.")}`,
        rl("1 VP each", "egg (on dragons and mat nests), cached resource, tucked card — unless a card says otherwise.", "1 PV cada", "ovo (em dragões e ninhos do tabuleiro), recurso guardado, carta enfiada — salvo se a carta disser outra coisa."),
        rl("Objectives", "VP of the rows holding your markers.", "Objetivos", "PV das fileiras com os seus marcadores."),
        rl("Leftovers", "1 VP per coin; 1 VP per 4 other items (resources, dragon and cave cards in hand), rounded down.", "Sobras", "1 PV por moeda; 1 PV a cada 4 outros itens (recursos, cartas de dragão e de caverna na mão), arredondando para baixo."),
        rl("Tie", "most visible dragons on the mat; still tied, shared victory.", "Empate", "mais dragões visíveis no tabuleiro; persistindo, vitória compartilhada.")
      ], ["c1", "c15"])
    ];
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), ["c4", "c5", "c10", "c14", "c15"])}
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- rule sections ----------

  function overviewSection() {
    return `
      ${sectionHeading("overview", t("Rounds and turns", "Rodadas e turnos"), ["c4", "c14"])}
      <div class="quick-grid">
        ${infoCard(t("GOAL", "OBJETIVO"), t("Most victory points (VP) wins", "Vence quem tiver mais pontos de vitória (PV)"), [
          t("You are dracologists building a sanctuary: 3 caves on your mat, each built left to right — first excavate a space with a cave card, then entice a dragon into it.", "Vocês são dracólogos construindo um santuário: 3 cavernas no tabuleiro, cada uma construída da esquerda para a direita — primeiro escave um espaço com uma carta de caverna, depois atraia um dragão para ele."),
          t("Your sanctuary starts with 3 excavated spaces: the leftmost space of each cave.", "O santuário começa com 3 espaços escavados: o espaço mais à esquerda de cada caverna."),
          t("VP come from dragons, eggs, cached resources, tucked cards, public objectives, the Dragon Guild and leftover coins/items.", "PV vêm de dragões, ovos, recursos guardados, cartas enfiadas, objetivos públicos, a Guilda dos Dragões e moedas/itens que sobrarem.")
        ], ["c1", "c4"])}
        ${infoCard(t("ROUNDS", "RODADAS"), t("4 rounds, as many turns as your coins allow", "4 rodadas, quantos turnos as moedas permitirem"), [
          t("In each round, players take turns clockwise starting with the start player, until they choose to pass.", "Em cada rodada os jogadores fazem turnos em sentido horário, começando pelo primeiro jogador, até decidirem passar."),
          t("Every action costs at least 1 coin, so you usually pass when your coins run out or no dragon in hand is worth (or affordable) playing. Use most or all coins before passing.", "Toda ação custa pelo menos 1 moeda, então em geral você passa quando as moedas acabam ou nenhum dragão da mão vale a pena (ou dá para pagar). Use a maior parte ou todas as moedas antes de passar."),
          t("Once you pass you take no more turns this round, but you still gain benefits from other players' turns. Others keep playing until they also pass.", "Depois de passar você não faz mais turnos nesta rodada, mas ainda ganha benefícios dos turnos dos outros. Os demais continuam até também passarem."),
          t("Coins, resources, cave cards, dragons and nested eggs carry over to the next round. Each new round gives 6 coins and 1 egg.", "Moedas, recursos, cartas de caverna, dragões e ovos nos ninhos passam para a rodada seguinte. Cada nova rodada dá 6 moedas e 1 ovo.")
        ], ["c4", "c14"])}
        ${infoCard(t("YOUR TURN", "SEU TURNO"), t("One of 5 actions", "Uma de 5 ações"), [
          rl("1", "Excavate a space.", "1", "Escavar um espaço."),
          rl("2", "Entice a dragon to an excavated space.", "2", "Atrair um dragão para um espaço escavado."),
          rl("3–5", "Explore your Crimson Cavern, your Golden Grotto or your Amethyst Abyss.", "3–5", "Explorar a sua Caverna Carmesim, a sua Gruta Dourada ou o seu Abismo de Ametista."),
          t("Move your adventurer to the action on your mat, pay its cost by placing the coin/eggs on the action, then do it. You may repeat the same action on later turns.", "Mova o aventureiro para a ação no tabuleiro, pague o custo pondo a moeda/ovos sobre a ação e então execute-a. Você pode repetir a mesma ação em turnos seguintes."),
          t("If the public supply of coins or eggs runs low, you may return paid items from your mat early — but keep track of how many times you explored each cave this round.", "Se a reserva de moedas ou ovos ficar baixa, pode devolver antes os itens pagos no tabuleiro — mas anote quantas vezes explorou cada caverna nesta rodada.")
        ], ["c4", "c5"])}
        ${infoCard(t("TERMS", "TERMOS"), t("Words the rulebook uses", "Palavras que o livro usa"), [
          rl("Player mat", "your board holding cave cards, dragons and eggs.", "Tabuleiro de jogador", "o seu tabuleiro com cartas de caverna, dragões e ovos."),
          rl("Cave", "a row of the mat: Crimson Cavern, Golden Grotto, Amethyst Abyss (4 spaces each).", "Caverna", "uma fileira do tabuleiro: Caverna Carmesim, Gruta Dourada, Abismo de Ametista (4 espaços cada)."),
          rl("Cave card", "square card that covers 1 of the 9 empty spaces and makes it excavated.", "Carta de caverna", "carta quadrada que cobre 1 dos 9 espaços vazios e o torna escavado."),
          rl("Dragon", "rectangular card placed onto an excavated space.", "Dragão", "carta retangular posta num espaço escavado."),
          rl("Resources", "meat, gold, crystal, milk. Coins and eggs are NOT resources.", "Recursos", "carne, ouro, cristal, leite. Moedas e ovos NÃO são recursos."),
          rl("Discard / pay", "put the cards, coins, eggs or resources into the public supply (cards face up on the discard piles).", "Descartar / pagar", "devolva cartas, moedas, ovos ou recursos à reserva pública (cartas viradas para cima nas pilhas de descarte).")
        ], ["c4"])}
      </div>`;
  }

  function actionsSection() {
    return `
      ${sectionHeading("actions", t("The actions", "As ações"), ["c5", "c6", "c10"])}
      <div class="quick-grid">
        ${infoCard(t("ACTION · EXCAVATE", "AÇÃO · ESCAVAR"), `${glyph("cave-card", t("Cave card", "Carta de caverna"))} ${t("Play a cave card into 1 of your caves", "Jogue uma carta de caverna numa das suas cavernas")}`, [
          rl("1 · Space", "choose the leftmost empty space in 1 of your 3 caves (columns 2, 3, 4 — column 1 is already excavated). Caves are built left to right.", "1 · Espaço", "escolha o espaço vazio mais à esquerda de 1 das 3 cavernas (colunas 2, 3, 4 — a coluna 1 já vem escavada). As cavernas são construídas da esquerda para a direita."),
          rl("2 · Pay", "1 coin on the Excavate action; plus 1 egg for column 3 or 2 eggs for column 4 (printed above those columns). Eggs from any dragon(s) or your mat nests.", "2 · Pagar", "1 moeda na ação Escavar; mais 1 ovo para a coluna 3 ou 2 ovos para a coluna 4 (impresso acima dessas colunas). Ovos de qualquer dragão ou dos ninhos do tabuleiro."),
          rl("3 · Place", "put a cave card from your hand on that space, aligned with the square, leaving the stop sign below it visible. Any cave card fits any cave (colours are decoration).", "3 · Colocar", "ponha uma carta de caverna da mão nesse espaço, alinhada ao quadrado, deixando visível o sinal de pare abaixo. Qualquer carta de caverna serve em qualquer caverna (as cores são decoração)."),
          `${glyph("when-played", t("When played", "Ao jogar"))} ${rl("4a · Card benefit", "use the cave card's “when played” benefit (optional; if it gives opponents something, they may take it even if you decline).", "4a · Benefício da carta", "use o benefício “ao jogar” da carta de caverna (opcional; se der algo aos oponentes, eles podem pegar mesmo que você recuse).")}`,
          rl("4b · Covered space", "use the “when covered” benefit of the mat space you covered. Only column 4 has one: once, you may spend 3 items (resources, dragon cards, cave cards in any mix) to gain 1 coin. Optional. 4a and 4b in either order.", "4b · Espaço coberto", "use o benefício “ao cobrir” do espaço do tabuleiro que cobriu. Só a coluna 4 tem: uma vez, pode gastar 3 itens (recursos, cartas de dragão, cartas de caverna em qualquer mistura) para ganhar 1 moeda. Opcional. 4a e 4b em qualquer ordem."),
          rl("One space per action", "unless the cave card says otherwise.", "Um espaço por ação", "salvo se a carta de caverna disser outra coisa."),
          rl("Free excavation", "a benefit that lets you excavate for free skips both the coin and the egg cost of that column.", "Escavação grátis", "um benefício de escavar de graça dispensa a moeda e o custo em ovos daquela coluna.")
        ], ["c5"])}
        ${infoCard(t("ACTION · ENTICE", "AÇÃO · ATRAIR"), `${glyph("dragon-card", t("Dragon card", "Carta de dragão"))} ${t("Add a dragon to your mat", "Acrescente um dragão ao tabuleiro")}`, [
          rl("1 · Choose", "a dragon from your hand.", "1 · Escolher", "um dragão da mão."),
          rl("2 · Pay", "1 coin on the Entice action, then the cost printed at the dragon's upper left, back to the supply. Usually gold, crystal and meat; some add a coin, an egg and/or milk. Every hatchling costs an egg and 1–3 milk.", "2 · Pagar", "1 moeda na ação Atrair, depois o custo impresso no canto superior esquerdo do dragão, de volta à reserva. Em geral ouro, cristal e carne; alguns somam uma moeda, um ovo e/ou leite. Todo filhote custa um ovo e 1–3 leites."),
          `${glyph("any-resource", t("Any resource", "Qualquer recurso"))} ${glyph("no-cost", t("No resource cost", "Sem custo em recurso"))} ${rl("Cost icons", "the four-colour circle = any 1 resource; the crossed circle = no resource cost.", "Ícones de custo", "o círculo de quatro cores = 1 recurso qualquer; o círculo riscado = sem custo em recurso.")}`,
          rl("3 · Cave", "only a cave shown by the coloured bars on the dragon's left side (red = Crimson Cavern, yellow = Golden Grotto, purple = Amethyst Abyss).", "3 · Caverna", "só uma caverna indicada pelas barras coloridas à esquerda do dragão (vermelho = Caverna Carmesim, amarelo = Gruta Dourada, roxo = Abismo de Ametista)."),
          rl("3 · Space", "the leftmost excavated space of that cave that has no dragon. Never on top of another dragon (unless an ability says so). Dragons fill each cave left to right.", "3 · Espaço", "o espaço escavado mais à esquerda daquela caverna que não tem dragão. Nunca sobre outro dragão (salvo se uma habilidade mandar). Os dragões preenchem cada caverna da esquerda para a direita."),
          `${glyph("when-played", t("When played", "Ao jogar"))} ${rl("4 · Benefit", "gain the dragon's “when played” benefit, if it has one.", "4 · Benefício", "ganhe o benefício “ao jogar” do dragão, se houver.")}`,
          rl("Limits", "one dragon per Entice action (unless the dragon says otherwise); a full mat holds at most 12 dragons.", "Limites", "um dragão por ação Atrair (salvo se o dragão disser outra coisa); um tabuleiro cheio comporta no máximo 12 dragões.")
        ], ["c6"])}
        ${infoCard(t("ACTION · EXPLORE", "AÇÃO · EXPLORAR"), `${glyph("activated", t("If activated", "Se ativado"))} ${t("Walk through 1 cave", "Percorra 1 caverna")}`, [
          rl("1 · Pay at the entrance", "1st time in that cave this round: 1 coin. 2nd time: 1 coin + 1 egg. 3rd time (maximum): 1 coin + 2 eggs. Leave them on the cave's entrance cost space to track the count.", "1 · Pagar na entrada", "1ª vez naquela caverna nesta rodada: 1 moeda. 2ª vez: 1 moeda + 1 ovo. 3ª vez (máximo): 1 moeda + 2 ovos. Deixe-os no espaço de custo da entrada para marcar a contagem."),
          rl("2 · Walk", "move your adventurer left to right along the path at the bottom of the cave.", "2 · Andar", "mova o aventureiro da esquerda para a direita pelo caminho na parte de baixo da caverna."),
          rl("Mat icons", "each “if activated” icon printed on the path that you walk past: you may use it.", "Ícones do tabuleiro", "cada ícone “se ativado” impresso no caminho por que você passa: pode usá-lo."),
          rl("Dragons", "each dragon you walk onto with an “if activated” icon: you may use its ability. Dragons with other ability types do nothing now.", "Dragões", "cada dragão em que você pisa com ícone “se ativado”: pode usar a habilidade. Dragões com outros tipos de habilidade não fazem nada agora."),
          `${glyph("stop", t("Stop sign", "Sinal de pare"))} ${rl("3 · Stop", "when you walk onto a space without a dragon (excavated or not), your turn ends: adventurer back to Base Camp.", "3 · Parar", "quando pisa num espaço sem dragão (escavado ou não), o seu turno acaba: aventureiro de volta ao Acampamento Base.")}`,
          rl("Reaching the end", "only with dragons on all 4 spaces do you reach the cave's last ability (Crimson: cache up to 2; Golden: tuck up to 2; Amethyst: discard up to 2 cave cards, lay 2 eggs each).", "Chegar ao fim", "só com dragões nos 4 espaços você alcança a última habilidade da caverna (Carmesim: guardar até 2; Dourada: enfiar até 2; Ametista: descartar até 2 cartas de caverna, 2 ovos por carta)."),
          rl("Never on a new dragon", "“if activated” abilities do not activate on the turn you play that dragon.", "Nunca no dragão novo", "habilidades “se ativado” não ativam no turno em que você joga esse dragão.")
        ], ["c3", "c7", "c10"])}
      </div>
      ${figure("explore-example", "Rulebook explore example: Tess walks through her Crimson Cavern", "Exemplo de exploração do livro: Tess percorre a Caverna Carmesim", "Explore example (p. 10) — see Examples for the walk-through.", "Exemplo de exploração (p. 10) — veja Exemplos para o passo a passo.")}`;
  }

  function dragonsSection() {
    return `
      ${sectionHeading("dragons", t("Dragons, abilities and hatchlings", "Dragões, habilidades e filhotes"), ["c7", "c8", "c9"])}
      <div class="wy-art-row">
        ${figure("dragon-card", "Example dragon card: Bellicose Firevern", "Carta de dragão de exemplo: Bellicose Firevern", "Bellicose Firevern (p. 7): cost meat + gold, 5 VP, small, 1 nest, aggressive, lives in Crimson Cavern or Golden Grotto, once-per-round ability.", "Bellicose Firevern (p. 7): custo carne + ouro, 5 PV, pequeno, 1 ninho, agressivo, vive na Caverna Carmesim ou na Gruta Dourada, habilidade uma vez por rodada.")}
        ${figure("hatchling-card", "Example hatchling card: Miniature Rex", "Carta de filhote de exemplo: Miniature Rex", "Miniature Rex (p. 9): a hatchling with its 3-part ability.", "Miniature Rex (p. 9): um filhote com a habilidade em 3 partes.")}
      </div>
      <div class="quick-grid">
        ${infoCard(t("READING A DRAGON", "LENDO UM DRAGÃO"), t("Card anatomy", "Anatomia da carta"), [
          rl("Upper left", "the cost (you also pay 1 coin when you use the Entice action).", "Canto superior esquerdo", "o custo (você também paga 1 moeda ao usar a ação Atrair)."),
          `${glyph("vp", t("Victory points", "Pontos de vitória"))} ${rl("Upper right", "VP for having the dragon on your mat, and below it the size: Large, Medium, Small or Hatchling.", "Canto superior direito", "PV por ter o dragão no tabuleiro e, abaixo, o tamanho: Grande (Large), Médio (Medium), Pequeno (Small) ou Filhote (Hatchling).")}`,
          `${glyph("nest", t("Nest icon", "Ícone de ninho"))} ${rl("Nest icons", "egg capacity: 1 egg per nest icon.", "Ícones de ninho", "capacidade de ovos: 1 ovo por ícone de ninho.")}`,
          rl("Trait banner", "1 of 4 traits: shy, aggressive, playful or helpful.", "Faixa do traço", "1 de 4 traços: tímido (shy), agressivo (aggressive), brincalhão (playful) ou prestativo (helpful)."),
          rl("Left edge", "coloured bars = caves it can live in.", "Borda esquerda", "barras coloridas = cavernas onde pode viver."),
          rl("Bottom", "the ability; its icon tells when it works (below).", "Embaixo", "a habilidade; o ícone diz quando ela funciona (abaixo).")
        ], ["c7"])}
        ${infoCard(t("4 ABILITY TYPES", "4 TIPOS DE HABILIDADE"), t("All optional", "Todas opcionais"), [
          `${glyph("when-played", t("When played", "Ao jogar"))} ${rl("When played", "once, right when you play the dragon (unless a special ability says otherwise).", "Ao jogar", "uma vez, logo que você joga o dragão (salvo habilidade especial).")}`,
          `${glyph("activated", t("If activated", "Se ativado"))} ${rl("If activated", "each time your adventurer walks onto this dragon while exploring — never on the turn you play it.", "Se ativado", "toda vez que o aventureiro pisa neste dragão ao explorar — nunca no turno em que você o joga.")}`,
          `${glyph("once-per-round", t("Once per round", "Uma vez por rodada"))} ${rl("Once per round", "at the end of every round (round end step 2).", "Uma vez por rodada", "no fim de cada rodada (passo 2 do fim da rodada).")}`,
          `${glyph("end-game", t("End game", "Fim de jogo"))} ${rl("End game", "VP at game end if you meet the condition.", "Fim de jogo", "PV no fim do jogo se você cumprir a condição.")}`,
          rl("Opponents' share", "for any type, if the ability gives opponents a benefit they may collect it even if you decline yours.", "Parte dos oponentes", "em qualquer tipo, se a habilidade der benefício aos oponentes, eles podem pegá-lo mesmo que você recuse o seu."),
          rl("Self-inclusion", "a dragon looking for a category (in this cave, a trait, a size…) includes itself.", "Inclui a si mesmo", "um dragão que procura uma categoria (nesta caverna, um traço, um tamanho…) inclui a si mesmo.")
        ], ["c7"])}
        ${infoCard(t("CACHE · TUCK · EGGS", "GUARDAR · ENFIAR · OVOS"), t("What the verbs mean", "O que os verbos significam"), [
          rl("Cache a resource", "place it on a dragon, from your own supply unless stated. It stays there and is worth 1 VP. It goes on the dragon giving the ability (“here”) unless the card says otherwise.", "Guardar (cache) um recurso", "pô-lo sobre um dragão, da sua reserva salvo indicação. Fica ali e vale 1 PV. Vai no dragão que dá a habilidade (“here”) salvo se a carta disser outra coisa."),
          rl("Tuck a card", "slide a dragon card face down under an already played dragon, from your hand unless stated. It stays and is worth 1 VP. Same “here” rule.", "Enfiar (tuck) uma carta", "pôr uma carta de dragão virada para baixo sob um dragão já jogado, da mão salvo indicação. Fica ali e vale 1 PV. Mesma regra do “here”."),
          rl("Tucked cards are not dragons", "they never count for abilities, objectives or anything that counts dragons on your mat or in a cave.", "Cartas enfiadas não são dragões", "nunca contam para habilidades, objetivos ou qualquer coisa que conte dragões no tabuleiro ou numa caverna."),
          `${glyph("egg", t("Egg", "Ovo"))} ${rl("Lay an egg", "on any dragon with an empty nest icon or on 1 of the 2 mat nests; each nest holds 1 egg; no empty nest = no egg. “Here” = only on that dragon; some say a certain cave or column.", "Pôr um ovo", "em qualquer dragão com ninho vazio ou em 1 dos 2 ninhos do tabuleiro; cada ninho comporta 1 ovo; sem ninho vazio = sem ovo. “Here” = só nesse dragão; alguns indicam uma caverna ou coluna.")}`,
          rl("Pay an egg", "discard an egg from any of your dragons or mat nests (unless a location is specified, e.g. “from anywhere in this cave”).", "Pagar um ovo", "descartar um ovo de qualquer dragão seu ou ninho do tabuleiro (salvo local indicado, ex.: “de qualquer lugar nesta caverna”)."),
          rl("Scoring", "eggs, cached resources and tucked cards on your mat are worth 1 VP each at game end unless stated.", "Pontuação", "ovos, recursos guardados e cartas enfiadas no tabuleiro valem 1 PV cada no fim, salvo indicação.")
        ], ["c8"])}
        ${infoCard(t("HATCHLINGS", "FILHOTES"), t("A special kind of dragon", "Um tipo especial de dragão"), [
          rl("Cost", "always 1 egg and 1, 2 or 3 milk.", "Custo", "sempre 1 ovo e 1, 2 ou 3 leites."),
          `${glyph("activated", t("If activated", "Se ativado"))} ${rl("Part 1", "if activated: each time your adventurer walks onto it you may cache 1 resource (milk or meat) on it or tuck 1 card under it, as printed.", "Parte 1", "se ativado: toda vez que o aventureiro pisa nele você pode guardar 1 recurso (leite ou carne) nele ou enfiar 1 carta sob ele, como impresso.")}`,
          rl("Part 2", "“Any time you cache/tuck here, gain …”: works every time, whatever ability caused the cache or tuck (not only your adventurer).", "Parte 2", "“Sempre que guardar/enfiar aqui, ganhe …”: vale toda vez, seja qual for a habilidade que causou o guardar ou enfiar (não só o aventureiro)."),
          rl("Part 3", "the 3rd time you cache/tuck there you get the Part 2 benefit plus a one-time bonus (it grows up). Parts 1–2 keep working afterwards.", "Parte 3", "na 3ª vez que guarda/enfia ali você recebe o benefício da Parte 2 mais um bônus único (ele cresce). As Partes 1–2 continuam valendo depois."),
          rl("Where", "most hatchlings live in the Amethyst Abyss.", "Onde", "a maioria dos filhotes vive no Abismo de Ametista."),
          rl("They are dragons", "hatchlings count as dragons on your mat.", "São dragões", "filhotes contam como dragões no tabuleiro.")
        ], ["c9", "c11"])}
      </div>`;
  }

  function guildSection() {
    return `
      ${sectionHeading("guild", t("The Dragon Guild", "A Guilda dos Dragões"), ["c12", "c13"])}
      <div class="quick-grid">
        ${infoCard(t("ADVANCING", "AVANÇAR"), `${glyph("guild", t("Dragon Guild", "Guilda dos Dragões"))} ${t("Guild advancements", "Avanços na Guilda")}`, [
          rl("Where they come from", "the guild icon between spaces 1 and 2 of every cave path, and some dragons and cave cards.", "De onde vêm", "o ícone da Guilda entre os espaços 1 e 2 do caminho de cada caverna, e alguns dragões e cartas de caverna."),
          rl("Each advancement", "move your guild token 1 space clockwise; immediately gain what the space you land on shows.", "Cada avanço", "mova a ficha de guilda 1 espaço em sentido horário; ganhe na hora o que mostra o espaço de chegada."),
          rl("Several in one turn", "you gain every space you pass as well as the one you land on.", "Vários num turno", "você ganha cada espaço pelo qual passa além do de chegada."),
          rl("Shared spaces", "any number of guild tokens may share a space.", "Espaços compartilhados", "qualquer número de fichas pode dividir um espaço."),
          rl("Track (clockwise from START)", "egg · meat · dragon card · cave card · crystal · BROWN · egg · gold · dragon card · coin · milk · BROWN (START).", "Trilha (sentido horário desde START)", "ovo · carne · carta de dragão · carta de caverna · cristal · MARROM · ovo · ouro · carta de dragão · moeda · leite · MARROM (START)."),
          interpretation("an egg space means lay 1 egg on an empty nest (as with the round's egg: no empty nest, no egg).", "um espaço de ovo significa pôr 1 ovo num ninho vazio (como o ovo da rodada: sem ninho vazio, sem ovo).")
        ], ["c3", "c10", "c12"])}
        ${infoCard(t("BROWN SPACES", "ESPAÇOS MARRONS"), t("Place a marker on the tile", "Ponha um marcador na peça"), [
          rl("Trigger", "each time your token reaches the top (START) or the bottom brown space.", "Gatilho", "toda vez que a sua ficha chega ao espaço marrom de cima (START) ou de baixo."),
          rl("Do", "immediately put an unused player marker on an empty square of the Dragon Guild tile and collect that row's benefit.", "Faça", "ponha imediatamente um marcador de jogador não usado num quadrado vazio da peça da Guilda e pegue o benefício daquela fileira."),
          rl("Squares", "1 marker each. The long box at the bottom right (end game, “1 (unlimited)”) holds any number.", "Quadrados", "1 marcador cada. A caixa longa embaixo à direita (fim de jogo, “1 (unlimited)”) aceita quantos quiser."),
          rl("Same bonus twice", "allowed if a square is free.", "Mesmo bônus duas vezes", "permitido se houver quadrado livre."),
          rl("4 markers max", "after your 4th marker on the tile you keep advancing and collecting track spaces, but place no more markers.", "Máx. 4 marcadores", "depois do 4º marcador na peça você continua avançando e ganhando os espaços da trilha, mas não põe mais marcadores."),
          rl("Simultaneous", "if several players reach a brown space on the same turn, they choose in clockwise order starting with the active player.", "Simultâneo", "se vários jogadores chegam a um espaço marrom no mesmo turno, escolhem em sentido horário começando pelo jogador ativo."),
          interpretation("passing a brown space during a multi-step advancement counts as reaching it (you gain everything you pass).", "passar por um espaço marrom num avanço de vários passos conta como chegar a ele (você ganha tudo aquilo por onde passa).")
        ], ["c12"])}
        ${infoCard(t("THE TILE", "A PEÇA"), t("Read the rows on your tile", "Leia as fileiras da sua peça"), [
          t("Each tile has rows of squares, each row with an ability printed beside it: immediate benefits (for example free excavations, free dragons, gaining items) and an “END GAME” row with a condition worth VP at the end.", "Cada peça tem fileiras de quadrados, cada uma com uma habilidade impressa ao lado: benefícios imediatos (por exemplo escavações grátis, dragões grátis, ganhar itens) e uma fileira “END GAME” com uma condição que vale PV no fim."),
          rl("Bottom row “END GAME: Gain printed VP”", "6 VP, 3 VP, then 1 VP (unlimited) — whoever places a marker there scores the printed value of that square at game end.", "Fileira de baixo “END GAME: Gain printed VP”", "6 PV, 3 PV, depois 1 PV (ilimitado) — quem põe um marcador ali marca o valor impresso daquele quadrado no fim."),
          rl("Number of squares", "differs between the two sides of a tile; use the side for your player count.", "Número de quadrados", "muda entre os dois lados da peça; use o lado do seu número de jogadores."),
          t("Tile texts are printed on the tiles. The rulebook explains three of them in more detail (next card).", "Os textos das peças estão impressos nelas. O livro explica três delas em mais detalhe (próximo cartão).")
        ], ["c12"])}
        ${infoCard(t("TILE POWERS EXPLAINED", "PODERES DAS PEÇAS EXPLICADOS"), t("From the rulebook's table", "Da tabela do livro"), [
          rl("Guild of Highlands · pay a coin, excavate up to 2 spaces free", "discard 1 coin, then excavate up to 2 spaces (same or different caves) with cave cards from your hand, paying no coin or egg costs. You may stop after 1.", "Guild of Highlands · pague uma moeda, escave até 2 espaços grátis", "descarte 1 moeda e escave até 2 espaços (na mesma caverna ou em cavernas diferentes) com cartas de caverna da mão, sem pagar moedas ou ovos. Pode parar depois de 1."),
          rl("Guild of Highlands · pay a cave card, play a dragon on top of a dragon free", "discard a cave card from hand, then play a dragon from hand onto a dragon already on your mat, paying nothing; it must still be one of its caves. The old dragon becomes tucked; its tucked cards, cached resources and eggs move to the new dragon; eggs above the new dragon's nest capacity are discarded.", "Guild of Highlands · pague uma carta de caverna, jogue um dragão sobre outro grátis", "descarte uma carta de caverna da mão e jogue um dragão da mão sobre um dragão já no tabuleiro, sem pagar nada; ainda precisa ser uma das cavernas dele. O dragão antigo vira carta enfiada; as cartas enfiadas, recursos guardados e ovos dele passam ao novo dragão; ovos acima da capacidade do novo são descartados."),
          rl("Rainforest Guild · end game", "choose 1 cave; count the resource icons (gold, meat, crystal, milk) in the costs of all dragons in it (not tucked cards): 1 VP each.", "Rainforest Guild · fim de jogo", "escolha 1 caverna; conte os ícones de recurso (ouro, carne, cristal, leite) nos custos de todos os dragões dela (não cartas enfiadas): 1 PV cada.")
        ], ["c13"])}
      </div>`;
  }

  function additionalSection() {
    return `
      ${sectionHeading("additional", t("Additional rules", "Regras adicionais"), ["c11"])}
      <div class="quick-grid">
        ${infoCard(t("ORDER & TIMING", "ORDEM E MOMENTO"), t("Who goes first, when cards refill", "Quem vai primeiro, quando as cartas repõem"), [
          rl("All-player abilities", "the active player first, then the others clockwise.", "Habilidades para todos", "primeiro o jogador ativo, depois os outros em sentido horário."),
          rl("Card refill", "the display is refilled only at the end of each player's turn — after everyone has used an “all players gain a card” ability. Later players may find no face-up card left (they may still draw from the deck).", "Reposição de cartas", "o mostruário só é reposto no fim do turno de cada jogador — depois que todos usaram uma habilidade “todos ganham uma carta”. Quem vem depois pode não achar carta virada (ainda pode comprar do baralho)."),
          rl("Multiple times", "“up to N times” exchanges are resolved one at a time; a benefit from the first may pay for the second.", "Várias vezes", "trocas “até N vezes” são resolvidas uma por vez; o benefício da primeira pode pagar a segunda.")
        ], ["c11"])}
        ${infoCard(t("ITEMS", "ITENS"), t("Gaining, paying, limits", "Ganhar, pagar, limites"), [
          rl("Acquiring", "a gained dragon or cave card goes to your hand, a resource to your supply. If an ability lets you then cache/tuck it and you decline, it simply stays there.", "Adquirir", "dragão ou carta de caverna ganhos vão para a mão, recurso vai para a reserva. Se uma habilidade deixar guardar/enfiar e você recusar, ele simplesmente fica ali."),
          rl("Paying an item", "discard a card from hand, resources or coins from your supply, an egg from any nest on your mat (on a dragon or one of the 2 printed nests) — unless stated otherwise.", "Pagar um item", "descarte carta da mão, recursos ou moedas da reserva, ovo de qualquer ninho do tabuleiro (num dragão ou num dos 2 ninhos impressos) — salvo indicação."),
          rl("Capacity", "at the end of each of your turns: max 9 resource tokens, 9 cards (dragons + caves combined), 9 coins. Excess gained during another player's turn is discarded only at the end of your next turn.", "Capacidade", "no fim de cada turno seu: máx. 9 fichas de recurso, 9 cartas (dragões + cavernas juntos), 9 moedas. O excesso ganho no turno de outro jogador só é descartado no fim do seu próximo turno."),
          `${glyph("any-resource", t("Any resource", "Qualquer recurso"))} ${rl("Resource exchange", "at any point: 2 resources in any combination → 1 resource of another type.", "Troca de recursos", "a qualquer momento: 2 recursos em qualquer combinação → 1 recurso de outro tipo.")}`,
          rl("Counting dragons", "“on your player mat” or “in a cave” never counts tucked cards; hatchlings are dragons.", "Contar dragões", "“no tabuleiro” ou “numa caverna” nunca conta cartas enfiadas; filhotes são dragões.")
        ], ["c8", "c11"])}
        ${infoCard(t("CARD VERBS", "VERBOS DE CARTA"), t("Gain · from the display · draw · reveal", "Ganhar · do mostruário · comprar · revelar"), [
          rl("Gain a dragon / cave card", "take a face-up card from the display or the top of the deck. Empty display: you may still take from the deck.", "Ganhar um dragão / carta de caverna", "pegue uma carta virada do mostruário ou do topo do baralho. Mostruário vazio: ainda pode pegar do baralho."),
          rl("… from the display", "must be a face-up card; none left = no benefit.", "… do mostruário", "precisa ser carta virada para cima; sem nenhuma = sem benefício."),
          rl("Draw", "only from the top of the deck.", "Comprar (draw)", "só do topo do baralho."),
          rl("Reveal a dragon", "show the top card of the deck to all; if the ability says nothing else, put it back on top.", "Revelar um dragão", "mostre a carta do topo a todos; se a habilidade não disser mais nada, devolva-a ao topo.")
        ], ["c11"])}
      </div>`;
  }

  function roundEndSection() {
    return `
      ${sectionHeading("round-end", t("Round end, upkeep and objectives", "Fim da rodada, manutenção e objetivos"), ["c14", "c15"])}
      <div class="quick-grid">
        ${infoCard(t("TURN END", "FIM DO TURNO"), t("After your 1 action", "Depois da sua 1 ação"), [
          rl("1 · Adventurer", "back to Base Camp.", "1 · Aventureiro", "de volta ao Acampamento Base."),
          rl("2 · Limits", "discard down to 9 coins, 9 cards (dragons + caves together) and 9 resource tokens.", "2 · Limites", "descarte até ficar com 9 moedas, 9 cartas (dragões + cavernas juntos) e 9 fichas de recurso."),
          rl("3 · Refill", "top the card display back up to 3 dragons and 3 cave cards (empty spaces only — this is not the round's refresh, which replaces all 6).", "3 · Repor", "complete o mostruário até 3 dragões e 3 cartas de caverna (só os espaços vazios — não é a renovação da rodada, que troca as 6)."),
          rl("4 · Next", "play goes clockwise to the next player who has not passed this round.", "4 · Próximo", "o jogo passa em sentido horário para o próximo jogador que ainda não passou nesta rodada.")
        ], ["c10", "c11", "c14"])}
        ${infoCard(t("ROUND END", "FIM DA RODADA"), t("Once all players have passed", "Quando todos passaram"), roundEndLines(), ["c14"])}
        ${infoCard(t("SCORING AN OBJECTIVE", "PONTUAR UM OBJETIVO"), t("Each player places 1 marker", "Cada jogador põe 1 marcador"), [
          rl("Compare", "count what this round's objective tile asks (e.g. medium dragons on your mat, aggressive dragons, dragons and cave cards in a given cave).", "Compare", "conte o que a peça de objetivo desta rodada pede (ex.: dragões médios no tabuleiro, dragões agressivos, dragões e cartas de caverna numa caverna)."),
          rl("Place", "your player marker in the row of your rank under that objective: 1st, 2nd, 3rd or “other place”.", "Coloque", "o seu marcador de jogador na fileira da sua posição sob aquele objetivo: 1º, 2º, 3º ou “outro lugar”."),
          rl("Ties", "all players tied for 1st go to 1st; the next player goes to 2nd (and so on).", "Empates", "todos os empatados em 1º vão para 1º; o jogador seguinte vai para 2º (e assim por diante)."),
          rl("Zero", "a player with none of the item goes to “all others” (0 VP) whatever their rank.", "Zero", "quem não tem nenhum item vai para “todos os outros” (0 PV), seja qual for a posição."),
          state.players === 2 ? rl("With 2 players", "only the 1st and 2nd rows (or “all others” for a zero) are used; the 3rd-place row stays empty.", "Com 2 jogadores", "só as fileiras de 1º e 2º (ou “todos os outros” para quem tem zero) são usadas; a fileira de 3º fica vazia.") : "",
          rl("When paid", "the VP of your markers are scored at game end.", "Quando conta", "os PV dos seus marcadores são somados no fim do jogo."),
          rl("Automa numbers", "the solo icon and numbers on the tile are ignored.", "Números da Automa", "o ícone solo e os números na peça são ignorados.")
        ], ["c14", "c15"])}
        ${infoCard(t("START OF NEXT ROUND", "INÍCIO DA PRÓXIMA RODADA"), t("Rounds 2, 3 and 4", "Rodadas 2, 3 e 4"), [
          rl("1 · Round marker", "moves 1 space right.", "1 · Marcador de rodada", "anda 1 espaço para a direita."),
          `${glyph("refresh", t("Refresh", "Renovar"))} ${rl("2 · Refresh", "discard the 3 face-up dragons and 3 face-up cave cards; deal 3 new of each.", "2 · Renovar", "descarte os 3 dragões e as 3 cartas de caverna virados; ponha 3 novos de cada.")}`,
          rl("3 · Income", "everyone gains 6 coins (added to any carried over) and 1 egg on any empty nest (dragon or mat); no empty nest = no egg.", "3 · Renda", "todos ganham 6 moedas (somadas às que sobraram) e 1 ovo num ninho vazio (dragão ou tabuleiro); sem ninho vazio = sem ovo."),
          rl("4 · Start player", "the start player marker moves 1 player clockwise.", "4 · Primeiro jogador", "o marcador de primeiro jogador passa 1 jogador em sentido horário.")
        ], ["c3", "c14"])}
      </div>`;
  }

  function gameEndSection() {
    return `
      ${sectionHeading("game-end", t("Game end and scoring", "Fim de jogo e pontuação"), ["c15"])}
      <div class="quick-grid">
        ${infoCard(t("WHEN", "QUANDO"), t("After round 4's round end", "Depois do fim da rodada 4"), [
          t("Round 4 ends like the others (clean mats, once-per-round dragons, score objective 4); then the game is over — no income, no refresh.", "A rodada 4 termina como as outras (limpar tabuleiros, dragões uma vez por rodada, pontuar o objetivo 4); então o jogo acaba — sem renda, sem renovar."),
          t("Add up each player's VP on the score pad.", "Some os PV de cada jogador no bloco de pontos.")
        ], ["c3", "c14", "c15"])}
        ${infoCard(t("SCORE CATEGORIES", "CATEGORIAS DE PONTUAÇÃO"), t("In score-pad order", "Na ordem do bloco"), [
          rl("Markers on the Dragon Guild", "the printed VP of your markers in the end-game box, plus any END GAME row of the tile you hold a marker on.", "Marcadores na Guilda", "os PV impressos dos seus marcadores na caixa de fim de jogo, mais qualquer fileira END GAME da peça em que tenha marcador."),
          rl("Printed VP", "of visible dragons on your mat (not in hand, not tucked).", "PV impressos", "dos dragões visíveis no tabuleiro (não na mão, não enfiados)."),
          `${glyph("end-game", t("End game", "Fim de jogo"))} ${rl("End-game abilities", "of visible dragons on your mat.", "Habilidades de fim de jogo", "dos dragões visíveis no tabuleiro.")}`,
          rl("Eggs", "1 each, on dragons and on your mat nests (unless specified).", "Ovos", "1 cada, nos dragões e nos ninhos do tabuleiro (salvo indicação)."),
          rl("Cached resources", "1 each (unless specified).", "Recursos guardados", "1 cada (salvo indicação)."),
          rl("Tucked cards", "1 each (unless specified).", "Cartas enfiadas", "1 cada (salvo indicação)."),
          rl("Public objectives", "the VP printed in the rows where your 4 markers stand (friendly ties).", "Objetivos públicos", "os PV impressos nas fileiras onde estão os seus 4 marcadores (empates amigáveis)."),
          rl("Remaining coins & items", "1 VP per coin; 1 VP per 4 other items in any mix (resources, dragon cards, cave cards), rounded down.", "Moedas e itens restantes", "1 PV por moeda; 1 PV a cada 4 outros itens em qualquer mistura (recursos, cartas de dragão, cartas de caverna), arredondando para baixo.")
        ], ["c1", "c15"])}
        ${infoCard(t("WINNER", "VENCEDOR"), t("Most VP", "Mais PV"), [
          t("The player with the most VP wins.", "Vence o jogador com mais PV."),
          rl("Tie", "the tied player with the most visible dragons on the mat (tucked cards don't count) wins.", "Empate", "vence o empatado com mais dragões visíveis no tabuleiro (cartas enfiadas não contam)."),
          rl("Still tied", "the victory is shared.", "Persistindo", "a vitória é compartilhada.")
        ], ["c15"])}
      </div>`;
  }

  function wingspanSection() {
    return `
      ${sectionHeading("wingspan", t("If you already know Wingspan", "Se você já conhece Wingspan"), ["c6"])}
      <p class="wy-lede">${t("The rulebook lists the key differences for Wingspan players. Skip this if you never played it.", "O livro lista as principais diferenças para quem joga Wingspan. Pule se nunca jogou.")}</p>
      <div class="quick-grid">
        ${infoCard(t("DIFFERENCES", "DIFERENÇAS"), t("Watch out for these", "Atenção a estas"), [
          rl("Actions", "paid with coins and often eggs, not action cubes.", "Ações", "pagas com moedas e muitas vezes ovos, não com cubos de ação."),
          rl("Direction", "explore caves left to right (not right to left).", "Direção", "explore as cavernas da esquerda para a direita (não da direita para a esquerda)."),
          rl("Nests", "your mat has 2 nests even before you play any dragon.", "Ninhos", "o tabuleiro tem 2 ninhos antes mesmo de jogar qualquer dragão."),
          rl("Start", "4 cards of your choice from 3 dragons + 3 caves, and any 3 resources.", "Início", "4 cartas à escolha entre 3 dragões + 3 cavernas, e 3 recursos quaisquer."),
          rl("Income", "6 coins and 1 egg at the start of each round (4 rounds).", "Renda", "6 moedas e 1 ovo no início de cada rodada (4 rodadas)."),
          rl("2-for-1", "the resource exchange works any time, not only when playing a card.", "2 por 1", "a troca de recursos vale a qualquer momento, não só ao jogar uma carta."),
          rl("Excavate first", "a space must be excavated before a dragon can go there; 3 spaces start excavated.", "Escavar antes", "um espaço precisa ser escavado antes de receber um dragão; 3 espaços começam escavados."),
          rl("Optional abilities", "opponents may take their share even if you decline.", "Habilidades opcionais", "os oponentes podem pegar a parte deles mesmo que você recuse."),
          rl("Hand and supply limits", "9 cards, 9 coins, 9 resources at the end of each of your turns.", "Limites", "9 cartas, 9 moedas, 9 recursos no fim de cada turno seu."),
          rl("Friendly ties", "on end-round objectives: both tied for 1st get full 1st-place VP; the next takes 2nd.", "Empates amigáveis", "nos objetivos de rodada: os empatados em 1º levam os PV cheios; o seguinte fica em 2º.")
        ], ["c6"])}
      </div>`;
  }

  function iconsSection() {
    const items = [
      ["vp", t("Victory points (VP)", "Pontos de vitória (PV)"), t("A dragon's printed VP (upper right) and VP amounts in abilities.", "PV impressos do dragão (canto superior direito) e quantidades de PV nas habilidades."), "c16"],
      ["activated", t("If activated by adventurer", "Se ativado pelo aventureiro"), t("Used each time your adventurer walks onto/past it while exploring; never on the turn the dragon is played.", "Usado toda vez que o aventureiro pisa/passa nele ao explorar; nunca no turno em que o dragão é jogado."), "c7"],
      ["when-played", t("When played", "Ao jogar"), t("Once, when the dragon or cave card is played.", "Uma vez, quando o dragão ou a carta de caverna é jogado."), "c7"],
      ["once-per-round", t("Once per round", "Uma vez por rodada"), t("At the end of every round, in turn order from the start player.", "No fim de cada rodada, na ordem dos turnos a partir do primeiro jogador."), "c7"],
      ["end-game", t("End game", "Fim de jogo"), t("VP at the end of the game if the condition is met.", "PV no fim do jogo se a condição for cumprida."), "c7"],
      ["coin", t("Coin", "Moeda"), t("Pays every action (1 per action); 6 per round; 1 VP each at the end; max 9 at the end of your turn.", "Paga toda ação (1 por ação); 6 por rodada; 1 PV cada no fim; máx. 9 no fim do seu turno."), "c4"],
      ["gold", t("Gold", "Ouro"), t("Resource (yellow token).", "Recurso (ficha amarela)."), "c11"],
      ["meat", t("Meat", "Carne"), t("Resource (red token).", "Recurso (ficha vermelha)."), "c11"],
      ["milk", t("Milk", "Leite"), t("Resource (white token); every hatchling needs 1–3.", "Recurso (ficha branca); todo filhote precisa de 1–3."), "c9"],
      ["crystal", t("Crystal", "Cristal"), t("Resource (purple token).", "Recurso (ficha roxa)."), "c11"],
      ["any-resource", t("Any resource", "Qualquer recurso"), t("Gold, meat, crystal or milk — your choice.", "Ouro, carne, cristal ou leite — à sua escolha."), "c16"],
      ["no-cost", t("No resource cost", "Sem custo em recurso"), t("The dragon costs no resources (you still pay the Entice coin).", "O dragão não custa recursos (você ainda paga a moeda de Atrair)."), "c16"],
      ["cave-card", t("Cave card", "Carta de caverna"), t("Square card; excavates a space.", "Carta quadrada; escava um espaço."), "c5"],
      ["dragon-card", t("Dragon card", "Carta de dragão"), t("Rectangular card; also what you tuck.", "Carta retangular; também é o que se enfia."), "c6"],
      ["egg", t("Egg", "Ovo"), t("Lay = put on an empty nest; pay = discard from a nest; 1 VP each at the end.", "Pôr = num ninho vazio; pagar = descartar de um ninho; 1 PV cada no fim."), "c8"],
      ["nest", t("Nest icon (egg capacity)", "Ícone de ninho (capacidade)"), t("Each holds 1 egg: on dragons and the 2 on your mat.", "Cada um comporta 1 ovo: nos dragões e os 2 do tabuleiro."), "c8"],
      ["guild", t("Dragon Guild", "Guilda dos Dragões"), t("Advance your guild token 1 space clockwise.", "Avance a ficha de guilda 1 espaço em sentido horário."), "c12"],
      ["refresh", t("Refresh", "Renovar"), t("Discard the face-up cards of the display and deal new ones.", "Descarte as cartas viradas do mostruário e ponha novas."), "c14"],
      ["stop", t("Stop sign", "Sinal de pare"), t("Below every mat space: walking onto a space without a dragon ends your explore turn.", "Abaixo de cada espaço do tabuleiro: pisar num espaço sem dragão encerra o turno de exploração."), "c10"]
    ];
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), ["c7", "c10", "c16"])}
      <p class="glossary-intro">${t("Each picture is cut from the rulebook's icon page (p. 16) or, for the stop sign, from p. 10, and shown with the rulebook's explanation.", "Cada imagem foi recortada da página de ícones do livro (p. 16) ou, no caso do sinal de pare, da p. 10, e aparece com a explicação do livro.")}</p>
      <div class="icon-grid">
        ${items.map(([file, name, text, code]) => `
          <article class="icon-card">
            <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}.webp" alt="${name}" loading="lazy"></span>
            <div><strong>${name}</strong><p>${text}</p>${referenceLink(code)}</div>
          </article>`).join("")}
      </div>`;
  }

  function examplesSection() {
    const ex = (page, title, lines, codes) => infoCard(t(`EXAMPLE · p. ${page}`, `EXEMPLO · p. ${page}`), title, lines, codes);
    const cards = [
      ex(10, t("Tess explores her Crimson Cavern", "Tess explora a Caverna Carmesim"), [
        t("First time this round: she pays 1 coin on the cavern's entrance.", "Primeira vez na rodada: ela paga 1 moeda na entrada da caverna."),
        t("She walks past the first “Gain any resource” icon and takes a meat.", "Passa pelo primeiro ícone “Ganhe qualquer recurso” e pega uma carne."),
        t("She walks onto the Chameleon Coatl: nothing happens — it has an end-game ability, not “if activated”.", "Pisa no Chameleon Coatl: nada acontece — ele tem habilidade de fim de jogo, não “se ativado”."),
        t("She walks past the guild icon: her guild token advances 1 space and she gains the benefit it lands on.", "Passa pelo ícone da Guilda: a ficha dela avança 1 espaço e ela ganha o benefício de chegada."),
        t("She walks onto the Hoarding Flyer (“if activated”) and gains a gold.", "Pisa no Hoarding Flyer (“se ativado”) e ganha um ouro."),
        t("She walks past the second “Gain any resource” icon and takes a crystal.", "Passa pelo segundo ícone “Ganhe qualquer recurso” e pega um cristal."),
        t("The 3rd space is excavated but has no dragon: stop sign, her turn ends, adventurer back to Base Camp.", "O 3º espaço está escavado mas sem dragão: sinal de pare, o turno acaba, aventureiro de volta ao Acampamento Base.")
      ], ["c10"]),
      ex(5, t("Excavating column 3", "Escavando a coluna 3"), [
        t("Choose the leftmost empty space of a cave — here the 3rd column.", "Escolha o espaço vazio mais à esquerda de uma caverna — aqui a 3ª coluna."),
        t("Pay 1 coin onto Excavate and 1 egg (column 3) from any dragon or mat nest.", "Pague 1 moeda em Escavar e 1 ovo (coluna 3) de qualquer dragão ou ninho do tabuleiro."),
        t("Place the cave card, stop sign still visible, then take its “when played” benefit (the pictured card caches resources from the general supply onto any dragons).", "Ponha a carta de caverna, com o sinal de pare visível, e pegue o benefício “ao jogar” (a carta da imagem guarda recursos da reserva geral em quaisquer dragões).")
      ], ["c5"]),
      ex(7, t("Bellicose Firevern", "Bellicose Firevern"), [
        t("Cost: 1 meat + 1 gold (+1 coin if played with the Entice action).", "Custo: 1 carne + 1 ouro (+1 moeda se jogado com a ação Atrair)."),
        t("5 VP, small, 1 nest, aggressive; lives in the Crimson Cavern or Golden Grotto.", "5 PV, pequeno, 1 ninho, agressivo; vive na Caverna Carmesim ou na Gruta Dourada."),
        t("Once per round: pay any resource to draw 3 dragons from the deck; keep 1, discard 1, tuck 1 under it.", "Uma vez por rodada: pague qualquer recurso para comprar 3 dragões do baralho; fique com 1, descarte 1, enfie 1 sob ele.")
      ], ["c7"]),
      ex(7, t("Smirking Ridgeback counts itself", "Smirking Ridgeback conta a si mesmo"), [
        t("It tucks a card under each playful dragon. It is playful itself, so a card is tucked under it too.", "Ele enfia uma carta sob cada dragão brincalhão. Ele mesmo é brincalhão, então também recebe uma carta.")
      ], ["c7"]),
      ex(8, t("Tucked medium dragons", "Dragões médios enfiados"), [
        t("A dragon giving VP per medium dragon on your mat ignores medium dragons tucked as cards: tucked cards are not dragons.", "Um dragão que dá PV por dragão médio no tabuleiro ignora dragões médios enfiados como cartas: cartas enfiadas não são dragões.")
      ], ["c8"]),
      ex(8, t("Subterranean Basilisk", "Subterranean Basilisk"), [
        t("“Lay an egg. Each opponent lays an egg.” Even if you decline, every opponent may still lay theirs.", "“Ponha um ovo. Cada oponente põe um ovo.” Mesmo que você recuse, cada oponente ainda pode pôr o dele.")
      ], ["c7", "c8"]),
      ex(9, t("Miniature Rex (hatchling)", "Miniature Rex (filhote)"), [
        t("Cost: 1 egg + 1 milk. 3 VP.", "Custo: 1 ovo + 1 leite. 3 PV."),
        t("If activated: cache a meat from your supply here.", "Se ativado: guarde uma carne da sua reserva aqui."),
        t("Any time you cache a meat here (by any ability), gain a gold.", "Sempre que guardar uma carne aqui (por qualquer habilidade), ganhe um ouro."),
        t("When the 3rd meat is cached, also gain 2 dragon cards — once; caching meat for gold continues afterwards.", "Quando a 3ª carne for guardada, ganhe também 2 cartas de dragão — uma vez; guardar carne por ouro continua depois.")
      ], ["c9"]),
      ex(11, t("Beckoning Cricketcatcher", "Beckoning Cricketcatcher"), [
        t("At the end of each round you gain 1 dragon card (display or deck).", "No fim de cada rodada você ganha 1 carta de dragão (mostruário ou baralho)."),
        t("After looking at it, keep it in hand or tuck it under any dragon.", "Depois de vê-la, fique com ela na mão ou enfie-a sob qualquer dragão."),
        t("Tucking it under a hatchling with a tuck ability also gives that hatchling's benefit.", "Enfiá-la sob um filhote com habilidade de enfiar também dá o benefício desse filhote.")
      ], ["c11"]),
      ex(15, t("Friendly objective tie", "Empate amigável no objetivo"), [
        t("Several players tie for 1st on objective 3: each scores 6 VP.", "Vários jogadores empatam em 1º no objetivo 3: cada um marca 6 PV."),
        t("The next-best player is 2nd and scores 3 VP.", "O seguinte fica em 2º e marca 3 PV.")
      ], ["c15"])
    ];
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), ["c5", "c7", "c9", "c10", "c11", "c15"])}
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  function faqSection() {
    const items = [
      [t("Which Dragon Guild tile side with 2 or 3 players?", "Qual lado da peça da Guilda com 2 ou 3 jogadores?"), t("The rulebook says only “the appropriate side (based on player count)”, and every tile shows “4-5 player” on one side. The guide uses that side with 4–5 players and the other side with 2–3.", "O livro diz só “o lado apropriado (conforme o número de jogadores)”, e toda peça mostra “4-5 player” num lado. O guia usa esse lado com 4–5 jogadores e o outro com 2–3."), "c2"],
      [t("What does an egg space on the guild track give?", "O que dá um espaço de ovo na trilha da Guilda?"), t("The guide treats it like the egg gained each round: lay it on an empty nest of a dragon or your mat; with no empty nest you cannot take it.", "O guia o trata como o ovo ganho a cada rodada: ponha-o num ninho vazio de um dragão ou do tabuleiro; sem ninho vazio você não pode pegá-lo."), "c14"],
      [t("Does passing a brown space count?", "Passar por um espaço marrom conta?"), t("The rulebook says you gain every benefit you pass when you advance several spaces in a turn. The guide therefore also places a marker when you pass (not only land on) a brown space.", "O livro diz que você ganha cada benefício pelo qual passa ao avançar vários espaços num turno. Por isso o guia também põe um marcador quando você passa (não só para) num espaço marrom."), "c12"],
      [t("Can I act with no coins?", "Posso agir sem moedas?"), t("Every action has a base cost of 1 coin, so a player with no coins has to pass (a card that lets you do something for free does not give you an extra turn).", "Toda ação tem custo base de 1 moeda, então quem está sem moedas precisa passar (uma carta que deixe fazer algo de graça não dá turno extra)."), "c5"],
      [t("Items gained after I passed?", "Itens ganhos depois de eu passar?"), t("Excess from other players' turns is discarded at the end of your next turn; if you have passed, the guide applies the limit at the end of your first turn of the next round.", "O excesso ganho nos turnos dos outros é descartado no fim do seu próximo turno; se você passou, o guia aplica o limite no fim do seu primeiro turno da rodada seguinte."), "c11"],
      [t("What if a deck runs out?", "E se um baralho acabar?"), t("The rulebook does not say. It only tells you to replace any non-marker piece that runs out, so the guide shuffles that deck's face-up discard pile into a new face-down deck.", "O livro não diz. Ele só manda substituir qualquer peça (que não seja marcador) que acabar, então o guia embaralha a pilha de descarte daquele baralho para formar um novo baralho virado para baixo."), "c1"],
      [t("Solo play?", "Jogo solo?"), t("The box is for 1–5 players and the objective tiles carry Automa numbers, but the Automa rules are a separate booklet that was not supplied. This guide covers only 2–5 players.", "A caixa é para 1–5 jogadores e as peças de objetivo têm números da Automa, mas as regras da Automa são um livreto separado que não foi fornecido. Este guia cobre só 2–5 jogadores."), "c14"],
      [t("Card and tile texts?", "Textos das cartas e peças?"), t("Dragon and cave card abilities, objective conditions and guild tile rows are printed on the components; the guide explains the icons and the general rules for them and never invents card texts.", "As habilidades dos dragões e cartas de caverna, as condições dos objetivos e as fileiras das peças da Guilda estão impressas nos componentes; o guia explica os ícones e as regras gerais e nunca inventa textos de carta."), "c13"]
    ];
    return `
      ${sectionHeading("faq", t("Guide's readings", "Leituras do guia"), ["c2", "c12", "c14"])}
      <p class="glossary-intro">${t("Where the rulebook is silent, this guide states its own reading, labelled as such.", "Onde o livro é omisso, este guia dá a sua própria leitura, identificada como tal.")}</p>
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
      { term: ["Adventurer", "Aventureiro"], text: ["Your meeple: marks the action you take and walks through a cave when you explore; returns to Base Camp each turn.", "O seu meeple: marca a ação que você faz e percorre a caverna quando você explora; volta ao Acampamento Base a cada turno."], code: "c10" },
      { term: ["Base Camp", "Acampamento Base"], text: ["The space on the left of your mat where your adventurer waits between turns.", "O espaço à esquerda do tabuleiro onde o aventureiro espera entre turnos."], code: "c2" },
      { term: ["Cache", "Guardar (cache)"], text: ["Put a resource from your supply on a dragon: 1 VP, stays until the end.", "Pôr um recurso da sua reserva num dragão: 1 PV, fica até o fim."], code: "c8" },
      { term: ["Tuck", "Enfiar (tuck)"], text: ["Slide a dragon card face down under a dragon: 1 VP; not a dragon.", "Pôr uma carta de dragão virada para baixo sob um dragão: 1 PV; não é dragão."], code: "c8" },
      { term: ["Excavated space", "Espaço escavado"], text: ["A mat space covered by a cave card (or the first space of each cave): a dragon may go there.", "Um espaço do tabuleiro coberto por carta de caverna (ou o primeiro espaço de cada caverna): pode receber dragão."], code: "c4" },
      { term: ["Card display", "Mostruário"], text: ["3 face-up dragons and 3 face-up cave cards; refilled at the end of each turn, refreshed each round.", "3 dragões e 3 cartas de caverna virados para cima; repostos no fim de cada turno, renovados a cada rodada."], code: "c11" },
      { term: ["Guild token", "Ficha de guilda"], text: ["Your shield on the Dragon Guild track.", "O seu escudo na trilha da Guilda dos Dragões."], code: "c12" },
      { term: ["Player marker", "Marcador de jogador"], text: ["8 cubes: 4 for objective scoring, up to 4 on the Dragon Guild tile. Limited.", "8 cubos: 4 para os objetivos, até 4 na peça da Guilda. Limitados."], code: "c1" },
      { term: ["Hatchling", "Filhote (hatchling)"], text: ["A dragon size: costs an egg and milk; 3-part cache/tuck ability.", "Um tamanho de dragão: custa ovo e leite; habilidade de guardar/enfiar em 3 partes."], code: "c9" },
      { term: ["Trait", "Traço"], text: ["Shy, aggressive, playful or helpful — on the dragon's banner.", "Tímido, agressivo, brincalhão ou prestativo — na faixa do dragão."], code: "c7" },
      { term: ["Pass", "Passar"], text: ["Stop taking turns this round; you still gain from others' abilities.", "Parar de fazer turnos nesta rodada; você ainda ganha com habilidades dos outros."], code: "c4" },
      { term: ["Personal supply", "Reserva pessoal"], text: ["Your coins and resources, to the left of your mat.", "As suas moedas e recursos, à esquerda do tabuleiro."], code: "c2" },
      { term: ["Visible dragon", "Dragão visível"], text: ["A dragon on your mat that is not tucked; only these score printed VP and abilities.", "Dragão no tabuleiro que não está enfiado; só esses pontuam PV impressos e habilidades."], code: "c15" },
      { term: ["Multiplier token", "Marcador multiplicador"], text: ["×2 / ×5 tokens to stand in for resources or eggs if the supply runs out.", "Fichas ×2 / ×5 que substituem recursos ou ovos se a reserva acabar."], code: "c1" }
    ];
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), ["c4", "c8", "c11"])}
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
    document.body.classList.add("theme-wyrmspan");
    document.documentElement.lang = state.language;
    document.title = t("Wyrmspan — Field Manual", "Wyrmspan — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Wyrmspan: setup by player count, excavate, entice and explore, dragon abilities and hatchlings, the Dragon Guild, objectives and scoring.",
        "Regras interativas bilíngues de Wyrmspan: preparação por número de jogadores, escavar, atrair e explorar, habilidades dos dragões e filhotes, a Guilda dos Dragões, objetivos e pontuação."
      );
    }
    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook", "Livro interativo")}</p>
          <h1>Wyrmspan</h1>
          <p class="hero-intro">${t(
            "Excavate a hidden labyrinth and entice dragons to roost in your three caves. Each dragon you add makes your explorations richer — walk your caves left to right, chain abilities, climb the Dragon Guild and race for four round objectives.",
            "Escave um labirinto escondido e atraia dragões para as suas três cavernas. Cada dragão acrescentado deixa as explorações mais ricas — percorra as cavernas da esquerda para a direita, encadeie habilidades, suba na Guilda dos Dragões e dispute quatro objetivos de rodada."
          )}</p>
          <div class="hero-meta"><span>${t("2–5 players (solo not covered)", "2–5 jogadores (solo não coberto)")}</span><span>90 min</span><span>${t("Engine building", "Construção de motor")}</span><span>${t("Ages 14+", "14+ anos")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/wyrmspan.webp" alt="${t("First page of the Wyrmspan rulebook with the components", "Primeira página do livro de regras de Wyrmspan com os componentes")}" fetchpriority="high"><figcaption>${t("Rulebook, page 1", "Livro de regras, página 1")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("Dracologist's notebook", "Caderno do dracólogo")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column wy-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied Wyrmspan rulebook (16 pages) for 2–5 players. Not supplied: the solo Automa booklet (so solo play is not covered). Dragon and cave card abilities, objective tiles and guild tile rows are printed on the components; the guide explains their icons and rules. Points marked “Guide's reading” are interpretations where the rulebook is silent.",
            "Este guia cobre o livro de regras de Wyrmspan fornecido (16 páginas) para 2–5 jogadores. Não fornecido: o livreto da Automa (por isso o solo não é coberto). As habilidades das cartas de dragão e de caverna, as peças de objetivo e as fileiras das peças da Guilda estão impressas nos componentes; o guia explica os ícones e as regras. Trechos marcados como “Leitura do guia” são interpretações onde o livro é omisso."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${overviewSection()}</section>
          <section class="rule-section">${actionsSection()}</section>
          <section class="rule-section">${dragonsSection()}</section>
          <section class="rule-section">${guildSection()}</section>
          <section class="rule-section">${additionalSection()}</section>
          <section class="rule-section">${roundEndSection()}</section>
          <section class="rule-section">${gameEndSection()}</section>
          <section class="rule-section">${wingspanSection()}</section>
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${faqSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal, non-commercial companion guide based on the Wyrmspan rulebook by Connie Vogelmann, art by Clementine Campardou (Stonemaier Games). Rules are paraphrased; pictures are cut from the supplied rulebook for reference.",
        "Guia pessoal e não comercial de consulta baseado no livro de regras de Wyrmspan, de Connie Vogelmann, arte de Clementine Campardou (Stonemaier Games). As regras são parafraseadas; as imagens foram recortadas do livro fornecido para referência."
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
      root.querySelector(".wy-page")?.prepend(notice);
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

  window.Wyrmspan = { renderInto, onClick, onChange };
})();
