(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.art-society.v1";
  const SETUP_KEY = "field-manual.art-society.setup.v1";
  const MANUAL = "art-society_core.pdf";
  const ICONS = "assets/art-society/icons/";

  const PLAYER_COUNTS = ["2", "3", "4"];
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

  // Only the player count changes the preparation; the language never clears the checklist.
  function signature(source = state) {
    return source.players;
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Art Society preferences.", error);
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
      console.error("Could not read Art Society setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Art Society preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Art Society setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function players() {
    return Number(state.players);
  }

  // Lots per round: the number of players + 1 (rulebook p. 4).
  function lots(count = players()) {
    return Number(count) + 1;
  }

  function unused() {
    return 4 - players();
  }

  function scriptBase() {
    const script = document.querySelector('script[src*="art-society.js"]');
    return script?.src || document.baseURI;
  }

  function manualUrl(page) {
    return `${new URL(`manuals/${MANUAL}`, scriptBase()).href}#page=${page}`;
  }

  // The printed page numbers of the French booklet equal its PDF pages (the cover is p. 1, the components p. 2).
  function referenceLink(page) {
    return `<a class="source-link" href="${manualUrl(page)}" target="_blank" rel="noreferrer">${t(`Rulebook p. ${page} ↗`, `Manual p. ${page} ↗`)}</a>`;
  }

  function refs(pages) {
    return (Array.isArray(pages) ? pages : [pages]).map(referenceLink).join(" ");
  }

  function sectionHeading(id, title, index, pages) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("GALLERY", "GALERIA")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="as-section-references">${(Array.isArray(pages) ? pages : [pages]).map(referenceLink).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
  }

  function interpretation(en, pt) {
    return `<span class="as-interpretation">${t("Guide's reading", "Leitura do guia")}</span> ${t(en, pt)}`;
  }

  // The supplied booklet is the French edition: show the printed French term so it can be matched.
  function fr(term) {
    return `<span class="as-fr" lang="fr">${term}</span>`;
  }

  function icon(file, alt) {
    return `<img class="as-inline-icon" src="${ICONS}${file}.webp" alt="${alt}">`;
  }

  function iconCard(file, titleEn, bodyEn, titlePt, bodyPt, page) {
    const title = t(titleEn, titlePt);
    return `
      <article class="icon-card">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}.webp" alt="${title}"></span>
        <div><strong>${title}</strong><p>${t(bodyEn, bodyPt)}</p>${referenceLink(page)}</div>
      </article>`;
  }

  function infoCard(label, title, lines, pages, extraClass = "") {
    return `
      <article class="info-card ${extraClass}">
        <span class="component-label">${label}</span>
        <h3>${title}</h3>
        ${lineList(lines)}
        ${refs(pages)}
      </article>`;
  }

  function playersLabel(count = state.players) {
    return t(`${count} players`, `${count} jogadores`);
  }

  // ---------- genres ----------

  const GENRES = {
    urban: { en: "Urban scene", pt: "Cena urbana", fr: "Scène urbaine", colorEn: "blue", colorPt: "azul", markEn: "a building", markPt: "um prédio" },
    portrait: { en: "Portrait", pt: "Retrato", fr: "Portrait", colorEn: "red", colorPt: "vermelho", markEn: "a woman's silhouette", markPt: "a silhueta de uma mulher" },
    "still-life": { en: "Still life", pt: "Natureza-morta", fr: "Nature morte", colorEn: "yellow", colorPt: "amarelo", markEn: "a jug", markPt: "uma jarra" },
    landscape: { en: "Landscape", pt: "Paisagem", fr: "Paysage", colorEn: "green", colorPt: "verde", markEn: "hills and a sun", markPt: "colinas e um sol" }
  };

  function genreName(id) {
    return t(GENRES[id].en, GENRES[id].pt);
  }

  function genre(id) {
    return `${icon(`genre-${id}`, genreName(id))}<strong>${genreName(id)}</strong>`;
  }

  // ---------- sections ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Reference", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["round", t("A round, step by step", "Uma rodada, passo a passo")],
      ["hanging", t("Hanging tiles", "Pendurar peças")],
      ["prestige", t("Museum & prestige", "Museu e prestígio")],
      ["scoring", t("End of game & scoring", "Fim e pontuação")],
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
          <span class="brand-mark" aria-hidden="true">AS</span>
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
      `${readFailed ? "This browser could not read the saved Art Society match or setup progress; defaults are shown. " : ""}${writeFailed ? "The latest change could not be saved and is visible on screen only." : ""}`,
      `${readFailed ? "Este navegador não conseguiu ler a partida ou o progresso de Art Society salvos; as opções padrão estão sendo mostradas. " : ""}${writeFailed ? "A alteração mais recente não pôde ser salva e aparece somente na tela." : ""}`
    ).trim();
  }

  // ---------- configuration ----------

  function choiceCard(name, value, dataAttr, checked, title, description) {
    return `
      <label class="as-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" ${dataAttr} ${checked ? "checked" : ""}>
        <span class="as-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function group(legend, selected, intro, cards, columns = "") {
    return `
      <fieldset class="as-choice-group">
        <legend>${legend} <span>${selected}</span></legend>
        <p class="as-choice-intro">${intro}</p>
        <div class="as-choice-grid ${columns}">${cards}</div>
      </fieldset>`;
  }

  function playerChoiceText(count) {
    const n = Number(count);
    const left = 4 - n;
    return t(
      `${n + 1} paintings are auctioned each round (players + 1). ${n} Gallery boards, ${n} sets of 20 Bid cards and ${n} of the 4 starting Bid cards are used${left ? `; ${left === 1 ? "the 4th player set stays" : `the other ${left} player sets stay`} in the box` : " — every component is in play"}.`,
      `${n + 1} quadros vão a leilão a cada rodada (jogadores + 1). São usados ${n} tabuleiros de Galeria, ${n} conjuntos de 20 cartas de Lance e ${n} das 4 cartas de Lance iniciais${left ? `; ${left === 1 ? "o outro conjunto de jogador fica" : `os outros ${left} conjuntos de jogador ficam`} na caixa` : " — todos os componentes estão em jogo"}.`
    );
  }

  function matchConfiguration() {
    return `
      <section class="controls-panel as-config" id="build-match" aria-labelledby="as-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="as-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "Art Society has no expansions, variants or solo mode in this rulebook: the only choice is how many people play. It changes how many paintings go up for auction each round and how many player sets and starting cards are dealt. Everything below is filtered to this match and saved on this device only.",
              "Art Society não tem expansões, variantes nem modo solo neste manual: a única escolha é quantas pessoas jogam. Ela muda quantos quadros vão a leilão em cada rodada e quantos conjuntos de jogador e cartas iniciais são distribuídos. Tudo abaixo é filtrado para esta partida e salvo só neste aparelho."
            )}</p>
          </div>
        </div>
        ${group(t("Players · selected:", "Jogadores · selecionado:"), `${playersLabel()} · ${t(`${lots()} lots per round`, `${lots()} lotes por rodada`)}`,
          `${t("The box plays 2 to 4. The rules are the same at every count; only the number of lots and the components dealt change.", "A caixa comporta de 2 a 4 jogadores. As regras são as mesmas em qualquer número; só mudam o número de lotes e os componentes distribuídos.")} ${referenceLink(1)} ${referenceLink(4)}`,
          PLAYER_COUNTS.map((count) => choiceCard("as-players", count, `data-players="${count}"`, state.players === count, playersLabel(count), playerChoiceText(count))).join(""), "as-three")}
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function setupPhases() {
    const n = players();
    const left = unused();
    return [
      {
        id: "museum",
        title: t("Museum board and Prestige markers", "Tabuleiro do Museu e marcadores de Prestígio"),
        pages: [3],
        items: [
          t(`Place the Museum board ${fr("plateau Musée")} in the middle of the table. Leave room on both sides of it: unsold paintings will be laid there during the game.`, `Coloque o tabuleiro do Museu ${fr("plateau Musée")} no meio da mesa. Deixe espaço dos dois lados dele: os quadros não vendidos serão colocados ali durante a partida.`),
          t(`Put the 4 Prestige markers ${fr("marqueurs Prestige")} — one per genre: blue Urban scene, red Portrait, yellow Still life, green Landscape — next to the board, not on its track yet.`, `Ponha os 4 marcadores de Prestígio ${fr("marqueurs Prestige")} — um por gênero: Cena urbana azul, Retrato vermelho, Natureza-morta amarela, Paisagem verde — ao lado do tabuleiro, ainda fora da trilha.`),
          interpretation("the rulebook's prestige example starts a marker just before space 1, so a genre's first unsold painting moves its marker from 0.", "o exemplo de prestígio do manual começa um marcador logo antes da casa 1, então o primeiro quadro não vendido de um gênero move o marcador a partir do 0.")
        ]
      },
      {
        id: "paintings",
        title: t("Sort the Painting tiles", "Separe as peças de Quadro"),
        pages: [3],
        items: [
          t(`First take out the starting paintings: the 2×3 tiles with a <strong>gold back</strong> marked ${icon("start-star", t("star", "estrela"))}. Keep them aside for step 6.`, `Primeiro tire os quadros iniciais: as peças 2×3 de <strong>verso dourado</strong> marcadas com ${icon("start-star", t("star", "estrela"))}. Deixe-os à parte para a etapa 6.`),
          t(`Sort all the other Painting tiles ${fr("tuiles Tableau")} by size and lay them in face-down stacks, on the table or in the box.`, `Separe todas as outras peças de Quadro ${fr("tuiles Tableau")} por tamanho e forme pilhas viradas para baixo, na mesa ou na caixa.`),
          t("Each back shows the tile's value (3 to 9). That value only measures prestige for the museum — it is not what the painting scores for you.", "Cada verso mostra o valor da peça (de 3 a 9). Esse valor só mede o prestígio para o museu — não é o que o quadro pontua para você."),
          interpretation("the rulebook sorts “all the paintings” in this step and shuffles the starting paintings in step 6, so the gold-backed ones are kept apart here.", "o manual separa “todos os quadros” nesta etapa e embaralha os quadros iniciais na etapa 6, por isso os de verso dourado ficam à parte aqui.")
        ]
      },
      {
        id: "decor",
        title: t("Décor tiles", "Peças de Decoração"),
        pages: [3, 5],
        items: [
          t(`Stack the 108 Décor tiles ${fr("tuiles Décor")} within everyone's reach. This is the shared Décor supply.`, `Empilhe as 108 peças de Decoração ${fr("tuiles Décor")} ao alcance de todos. Esta é a reserva comum de Decoração.`),
          t(`A Décor tile's value is the number of ${icon("shield", t("shield", "escudo"))} shields printed on it. In the rulebook's pictures this equals the squares it covers: 1×1 tiles show 1 shield, two-square tiles 2, three-square tiles 3.`, `O valor de uma peça de Decoração é o número de ${icon("shield", t("shield", "escudo"))} escudos impressos nela. Nas imagens do manual isso é igual às casas que ela ocupa: peças 1×1 mostram 1 escudo, peças de duas casas 2, peças de três casas 3.`),
          t("Like paintings, Décor tiles are never rotated, so horizontal and vertical shapes are different tiles: the rulebook's pictures show 2×1 plates and a 3×1 bookshelf as well as a 1×2 bust and a 1×3 clock.", "Como os quadros, as peças de Decoração nunca são giradas, então formatos horizontais e verticais são peças diferentes: as imagens do manual mostram pratos 2×1 e uma estante 3×1, além de um busto 1×2 e um relógio 1×3."),
          interpretation("grouping them by size and shape makes the right one quick to find; the rulebook only says to stack them.", "agrupá-las por tamanho e formato ajuda a achar a certa; o manual só diz para empilhá-las.")
        ]
      },
      {
        id: "players",
        title: t(`Player material · ×${n}`, `Material dos jogadores · ×${n}`),
        pages: [2, 3],
        items: [
          t(`Each player chooses a Gallery board ${fr("plateau Galerie")}. The icon on its back — horn, sextant, cupcake or stopwatch — is that player's icon.`, `Cada jogador escolhe um tabuleiro de Galeria ${fr("plateau Galerie")}. O ícone no verso — corneta, sextante, cupcake ou cronômetro — é o ícone desse jogador.`),
          t(`Take the 20 Bid cards ${fr("cartes Enchère")} and the 2 score markers showing your icon. Your 20 Bid cards are your hand — all of them, from the start.`, `Pegue as 20 cartas de Lance ${fr("cartes Enchère")} e os 2 marcadores de pontuação com o seu ícone. Suas 20 cartas de Lance são a sua mão — todas, desde o início.`),
          t("Place your score markers next to the Museum board: they are only used at the end of the game.", "Ponha seus marcadores de pontuação ao lado do tabuleiro do Museu: eles só são usados no fim da partida."),
          `${t("Keep the Full Gallery bonus token in your color with them.", "Deixe junto a ficha de Bônus de galeria completa da sua cor.")} ${interpretation("the setup does not mention these 4 tokens (1 per player); they match the +5 Full Gallery bonus of the final scoring, so take yours as a reminder if your gallery fills up.", "a preparação não menciona estas 4 fichas (1 por jogador); elas correspondem ao bônus de +5 por galeria completa da pontuação final, então pegue a sua como lembrete se sua galeria ficar cheia.")}`,
          t("Each player may take one of the 4 player aids (rules summary).", "Cada jogador pode pegar um dos 4 resumos de regras."),
          left ? t(`Return the ${left === 1 ? "" : `${left} `}unused Gallery board${left === 1 ? "" : "s"}, with ${left === 1 ? "its" : "their"} Bid cards, score markers and bonus token${left === 1 ? "" : "s"}, to the box.`, `Devolva à caixa ${left === 1 ? "o tabuleiro de Galeria não usado" : `os ${left} tabuleiros de Galeria não usados`}, com as cartas de Lance, os marcadores de pontuação e ${left === 1 ? "a ficha de bônus" : "as fichas de bônus"} correspondentes.`) : null
        ]
      },
      {
        id: "auction-room",
        title: t("Auction room: Estimate tokens", "Sala de leilões: fichas de Estimativa"),
        pages: [3, 4],
        items: [
          t(`Lay the 7 Estimate tokens ${fr("jetons Estimation")}, valued 3 to 9, in the “Auction room” ${fr("Salle des ventes")}: the space just below the Museum board.`, `Coloque as 7 fichas de Estimativa ${fr("jetons Estimation")}, de valor 3 a 9, na “Sala de leilões” ${fr("Salle des ventes")}: o espaço logo abaixo do tabuleiro do Museu.`),
          t("Each round, the paintings up for auction are laid under the token showing their value.", "A cada rodada, os quadros em leilão são colocados sob a ficha que mostra o valor deles.")
        ]
      },
      {
        id: "start-paintings",
        title: t("Starting paintings", "Quadros iniciais"),
        pages: [3],
        items: [
          t(`Shuffle the gold-backed starting paintings and deal 1 to each player (${n} in all).`, `Embaralhe os quadros iniciais de verso dourado e dê 1 a cada jogador (${n} no total).`),
          t(`Each player places theirs face up in their gallery so that it covers 1 or 2 of the ${icon("start-star", t("star", "estrela"))} squares in the centre of the wall, with its label (the small plaque with the genre icon) at the bottom.`, `Cada jogador coloca o seu virado para cima na galeria, cobrindo 1 ou 2 das casas ${icon("start-star", t("estrela", "estrela"))} no centro da parede, com a etiqueta (a plaquinha com o ícone do gênero) para baixo.`),
          t("Every starting painting left over is removed from the game (back in the box).", "Todo quadro inicial que sobrar sai da partida (volta para a caixa).")
        ]
      },
      {
        id: "start-bids",
        title: t("Starting Bid cards and first Auctioneer", "Cartas de Lance iniciais e primeiro Leiloeiro"),
        pages: [3],
        items: [
          t(`Shuffle the 4 starting Bid cards (the white cards marked ${icon("start-star", t("star", "estrela"))}) and deal 1 face up in front of each player.`, `Embaralhe as 4 cartas de Lance iniciais (as cartas brancas marcadas com ${icon("start-star", t("star", "estrela"))}) e dê 1 virada para cima à frente de cada jogador.`),
          n < 4 ? `${t(4 - n === 1 ? "Return the last one to the box." : `Return the other ${4 - n} to the box.`, `Devolva ${4 - n === 1 ? "a outra" : `as outras ${4 - n}`} à caixa.`)} ${interpretation("the rulebook only says to deal one to each player.", "o manual só diz para dar uma a cada jogador.")}` : null,
          t(`The player whose starting card shows the <strong>lowest</strong> value takes the gavel ${icon("gavel", t("gavel", "martelo"))}: they are the first Auctioneer ${fr("Commissaire-priseur")}.`, `Quem tiver a carta inicial de valor <strong>mais baixo</strong> pega o martelo ${icon("gavel", t("martelo", "martelo"))}: é o primeiro Leiloeiro ${fr("Commissaire-priseur")}.`),
          t("Leave your starting card face up where it is: it begins your bid pile. Each card you bid will go on top of it.", "Deixe sua carta inicial virada para cima onde está: ela começa sua pilha de lances. Cada carta que você der de lance vai por cima dela."),
          t("The first round begins: the Auctioneer prepares the lots.", "A primeira rodada começa: o Leiloeiro prepara os lotes.")
        ]
      }
    ];
  }

  function inventory() {
    const n = players();
    const left = unused();
    const cards = [
      infoCard(t("SHARED", "COMPARTILHADO"), t("Middle of the table", "Meio da mesa"), [
        rl("Museum board", "with its 1–50 track and the podium (×2 to ×5) at the top.", "Tabuleiro do Museu", "com a trilha de 1–50 e o pódio (×2 a ×5) no alto."),
        rl("4 Prestige markers", "one per genre, beside the board.", "4 marcadores de Prestígio", "um por gênero, ao lado do tabuleiro."),
        rl("Painting tiles", "116 in the box, sorted by size, face down (the gold-backed starting ones apart).", "Peças de Quadro", "116 na caixa, separadas por tamanho, viradas para baixo (as iniciais de verso dourado à parte)."),
        rl("108 Décor tiles", "the shared supply.", "108 peças de Decoração", "a reserva comum."),
        rl("7 Estimate tokens", "3 to 9, in the Auction room under the Museum board.", "7 fichas de Estimativa", "3 a 9, na Sala de leilões sob o tabuleiro do Museu."),
        rl("Auctioneer's gavel", "with the first Auctioneer.", "Martelo do Leiloeiro", "com o primeiro Leiloeiro.")
      ], [2, 3]),
      infoCard(t(`PER PLAYER · ×${n}`, `POR JOGADOR · ×${n}`), t("Each player", "Cada jogador"), [
        t("1 Gallery board, with the starting painting hung on its centre stars.", "1 tabuleiro de Galeria, com o quadro inicial pendurado nas estrelas do centro."),
        t("20 Bid cards in hand, with their icon.", "20 cartas de Lance na mão, com o seu ícone."),
        t("1 starting Bid card face up in front of them (the base of their bid pile).", "1 carta de Lance inicial virada para cima à sua frente (a base da pilha de lances)."),
        t("2 score markers and 1 Full Gallery bonus token, next to the Museum board.", "2 marcadores de pontuação e 1 ficha de Bônus de galeria completa, ao lado do tabuleiro do Museu."),
        t("1 player aid.", "1 resumo de regras.")
      ], [2, 3]),
      infoCard(t("BACK IN THE BOX", "DE VOLTA À CAIXA"), t("Not used in this match", "Fora desta partida"), [
        t("The starting paintings not dealt.", "Os quadros iniciais não distribuídos."),
        n < 4 ? t(`${4 - n} starting Bid card${4 - n === 1 ? "" : "s"}.`, `${4 - n} carta${4 - n === 1 ? "" : "s"} de Lance inicia${4 - n === 1 ? "l" : "is"}.`) : t("No starting Bid card: all 4 are dealt.", "Nenhuma carta de Lance inicial: as 4 são distribuídas."),
        left ? t(`${left} player set${left === 1 ? "" : "s"}: Gallery board, 20 Bid cards, 2 score markers, bonus token${left === 1 ? "" : " (each)"}.`, `${left} conjunto${left === 1 ? "" : "s"} de jogador: tabuleiro de Galeria, 20 cartas de Lance, 2 marcadores de pontuação, ficha de bônus${left === 1 ? "" : " (cada)"}.`) : t("No player set: all 4 are in play.", "Nenhum conjunto de jogador: os 4 estão em jogo.")
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
        <label class="as-setup-check" for="as-setup-${phase.id}">
          <input id="as-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="as-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="as-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), sectionIndex("setup"), [2, 3])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Set up this match", "Prepare esta partida")} · ${playersLabel()}</h3>
            <p>${t("One checkbox per coherent step; tick it when all its substeps are done.", "Uma caixa por etapa coerente; marque quando todos os subpassos estiverem feitos.")}</p>
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

  function quickReference() {
    const n = players();
    const cards = [
      infoCard(t("EACH ROUND", "CADA RODADA"), t("Five steps", "Cinco passos"), [
        rl("1 · Lots", `the Auctioneer takes ${lots()} Painting tiles (players + 1) from the stacks by their backs, lays each under its value's Estimate token, then flips them face up.`, "1 · Lotes", `o Leiloeiro pega ${lots()} peças de Quadro (jogadores + 1) das pilhas pelo verso, põe cada uma sob a ficha de Estimativa do seu valor e depois as vira para cima.`),
        rl("2 · Bid", "everyone, Auctioneer included, puts 1 Bid card face down on their bid pile; all reveal together.", "2 · Lance", "todos, o Leiloeiro incluído, põem 1 carta de Lance virada para baixo na sua pilha; todos revelam juntos."),
        rl("2 · Pick", "highest bid to lowest: take 1 painting and hang it before the next player picks.", "2 · Escolher", "do lance mais alto ao mais baixo: pegue 1 quadro e pendure-o antes de o próximo escolher."),
        rl("2 · Tied bids", "reveal the cards under them in each bid pile, one by one, until they differ; the higher card picks first (guide's reading). The starting card counts as the first card played.", "2 · Lances empatados", "revelem as cartas de baixo de cada pilha de lances, uma a uma, até diferirem; a carta mais alta escolhe primeiro (leitura do guia). A carta inicial conta como a primeira jogada."),
        rl("3 · Hang", "place your tile (or give it to your assistant).", "3 · Pendurar", "coloque sua peça (ou entregue-a ao seu assistente)."),
        rl("4 · Prestige", "the 1 unsold painting goes to the museum; its genre's marker moves forward by its value.", "4 · Prestígio", "o 1 quadro não vendido vai para o museu; o marcador do gênero dele avança tantas casas quanto o valor do quadro."),
        rl("5 · End of round", "the gavel passes to the left; check the end of the game.", "5 · Fim da rodada", "o martelo passa para a esquerda; verifique o fim da partida.")
      ], [4, 7]),
      infoCard(t("HANGING RULES", "REGRAS PARA PENDURAR"), t("Every tile on your wall", "Toda peça na sua parede"), [
        rl("Inside", "never over the edge of the grid.", "Dentro", "nunca para fora da grade."),
        rl("Touching", "shares an edge with at least 1 tile already hung — corners don't count.", "Encostada", "divide uma borda com pelo menos 1 peça já pendurada — cantos não contam."),
        rl("Upright", "label (cartel) at the bottom; never turn a tile sideways.", "Em pé", "etiqueta (cartel) para baixo; nunca gire uma peça de lado."),
        rl("Adjust", "you may move your new tile until the next lots are revealed; then it is fixed.", "Ajuste", "você pode mover a peça nova até os próximos lotes serem revelados; depois ela fica fixa."),
        rl("Assistant", "holds 1 tile (painting or Décor) for later; hang it before or after a new tile.", "Assistente", "guarda 1 peça (quadro ou Decoração) para depois; pendure-a antes ou depois de uma peça nova.")
      ], [5, 6]),
      infoCard(t("FRAMES → DÉCOR", "MOLDURAS → DECORAÇÃO"), t("Matching frames", "Molduras iguais"), [
        rl("Count", "adjacent paintings whose frame matches the new painting's frame.", "Conte", "quadros adjacentes cuja moldura é igual à do quadro novo."),
        rl("1–3", `take 1 Décor tile worth ≤ that number of ${icon("shield", t("shields", "escudos"))}.`, "1–3", `pegue 1 peça de Decoração que valha ≤ esse número de ${icon("shield", t("escudos", "escudos"))}.`),
        rl("4 or more", "take any Décor tiles adding up to that number.", "4 ou mais", "pegue quaisquer peças de Decoração que somem esse número."),
        rl("At once", "hang it right away (hanging rules) or give it to your assistant.", "Na hora", "pendure-a imediatamente (regras para pendurar) ou entregue-a ao assistente."),
        rl("You complete your own gallery this round", "you get no Décor tile (no tile, no points).", "Você completa a sua galeria nesta rodada", "você não recebe peça de Decoração (nem peça, nem pontos).")
      ], [5]),
      infoCard(t("FAUX PAS", "GAFE"), t("Same genre side by side", "Mesmo gênero lado a lado"), [
        `${genre("urban")} · ${genre("portrait")} · ${genre("still-life")} · ${genre("landscape")}`,
        rl("Faux pas", "a new painting hung next to one or more of the same genre.", "Gafe", "um quadro novo pendurado ao lado de um ou mais do mesmo gênero."),
        rl("Effect", "all those paintings score 0 prestige points.", "Efeito", "todos esses quadros fazem 0 pontos de prestígio."),
        rl("But", "they still count for the line-of-sight bonus.", "Mas", "eles ainda contam no bônus de linha de visão.")
      ], [6]),
      infoCard(t("IT DOESN'T FIT", "NÃO CABE"), t("No free space of that size", "Nenhum espaço livre desse tamanho"), [
        rl("1 · Assistant", "give it to your assistant (if they hold a tile, hang that one first if it fits).", "1 · Assistente", "entregue-o ao seu assistente (se ele guarda uma peça, pendure-a antes, se couber)."),
        rl("2 · Museum swap", "or exchange it for a museum painting of the same genre and hang that one. Prestige does not move.", "2 · Troca no museu", "ou troque-o por um quadro do museu do mesmo gênero e pendure esse. O prestígio não se mexe."),
        rl("3 · Superfluous", "or keep it beside your board (−2 at the end) and hang a 1×1 Décor tile.", "3 · Supérfluo", "ou deixe-o ao lado do tabuleiro (−2 no fim) e pendure uma peça de Decoração 1×1."),
        rl("Second superfluous", "triggers the end of the game.", "Segundo supérfluo", "dispara o fim da partida."),
        rl("Assistant's painting", "may only go on your wall — never swapped with the museum.", "Quadro do assistente", "só pode ir para a sua parede — nunca é trocado com o museu.")
      ], [6]),
      infoCard(t("PRESTIGE TRACK", "TRILHA DE PRESTÍGIO"), t("Museum board", "Tabuleiro do Museu"), [
        rl("Unsold painting", "next to the Museum board on its genre's colour side.", "Quadro não vendido", "ao lado do tabuleiro do Museu, no lado da cor do gênero."),
        rl("Move", "its genre's marker forward by the painting's value (back of the tile / Estimate token).", "Mova", "o marcador do gênero avança tantas casas quanto o valor do quadro (verso da peça / ficha de Estimativa)."),
        rl("No ties", "landing on another marker? Step back to the first free space.", "Sem empates", "caiu sobre outro marcador? Volte até a primeira casa livre."),
        rl("Past 50", "flip it to its black side and continue from 1: black = +50.", "Depois de 50", "vire-o para o lado preto e continue a partir do 1: preto = +50.")
      ], [7], "victory-card"),
      infoCard(t("END OF THE GAME", "FIM DA PARTIDA"), t("Finish the current round if…", "Termine a rodada atual se…"), [
        t("a player's gallery has no free space left; or", "a galeria de um jogador não tem mais espaço livre; ou"),
        t("a player takes their 2nd superfluous painting; or", "um jogador fica com o 2º quadro supérfluo; ou"),
        t(`the players have no Bid cards left (after round 20).`, `os jogadores não têm mais cartas de Lance (depois da rodada 20).`)
      ], [7], "victory-card"),
      infoCard(t("FINAL SCORING", "PONTUAÇÃO FINAL"), t("Rank the genres, then score", "Classifique os gêneros e pontue"), [
        rl("Podium", "most advanced genre ×5, then ×4, ×3, ×2. A genre never sent to the museum: ×2.", "Pódio", "gênero mais avançado ×5, depois ×4, ×3, ×2. Gênero que nunca foi ao museu: ×2."),
        rl("Check", "your left neighbor's gallery for faux pas.", "Confira", "a galeria do vizinho da esquerda em busca de gafes."),
        rl("1 Prestige", "paintings per genre × its level (faux pas paintings excluded).", "1 Prestígio", "quadros por gênero × o nível dele (quadros em gafe excluídos)."),
        rl("2 Décor", "+1 per shield on your hung Décor tiles.", "2 Decoração", "+1 por escudo nas suas peças de Decoração penduradas."),
        rl("3 Line of sight", "+3 per ×5-genre painting touching the band between the eyes.", "3 Linha de visão", "+3 por quadro do gênero ×5 que toque a faixa entre os olhos."),
        rl("4 Full gallery", "+5 if no free space.", "4 Galeria completa", "+5 se não houver espaço livre."),
        rl("5 Bare corners", "−2 per empty wall corner.", "5 Cantos vazios", "−2 por canto da parede vazio."),
        rl("6 Superfluous", "−2 per superfluous painting (not the assistant's tile).", "6 Supérfluos", "−2 por quadro supérfluo (não a peça do assistente)."),
        rl("Tie", "highest total of Bid cards left in hand; still tied: shared win.", "Empate", "maior soma das cartas de Lance restantes na mão; empate de novo: vitória compartilhada.")
      ], [7, 8], "victory-card")
    ];
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), sectionIndex("quick-reference"), [2, 4, 8])}
      <div class="callout">${t(
        `Each round ${lots()} paintings go up for auction among ${n} collectors. You bid with a hand of 20 cards that never comes back, hang what you win on your gallery wall, and the one painting nobody takes goes to the museum — raising the prestige of its genre. At the end, paintings score by how prestigious their genre is.`,
        `A cada rodada ${lots()} quadros vão a leilão entre ${n} colecionadores. Você dá lances com uma mão de 20 cartas que nunca voltam, pendura o que ganha na parede da sua galeria, e o único quadro que ninguém leva vai para o museu — aumentando o prestígio do seu gênero. No fim, os quadros pontuam conforme o prestígio do seu gênero.`
      )} ${referenceLink(4)}</div>
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- a round ----------

  function roundSection() {
    const n = players();
    return `
      ${sectionHeading("round", t("A round, step by step", "Uma rodada, passo a passo"), sectionIndex("round"), [4, 7])}
      <p class="glossary-intro">${t(
        "The game is a series of rounds, each in the same five steps. There are no individual turns: the bidding is simultaneous, then players pick in bid order. The Auctioneer — whoever holds the gavel — also bids and takes a painting like everyone else.",
        "A partida é uma série de rodadas, todas com os mesmos cinco passos. Não há turnos individuais: o lance é simultâneo e depois os jogadores escolhem na ordem dos lances. O Leiloeiro — quem está com o martelo — também dá lance e leva um quadro como todos."
      )}</p>
      <div class="quick-grid">
        ${infoCard(t("STEP 1", "PASSO 1"), t("Prepare the lots", "Prepare os lotes"), [
          t(`The Auctioneer takes <strong>${lots()} Painting tiles</strong> (${n} players + 1) from the face-down stacks, without looking at their faces. They choose by the backs — size and value — and may take several of the same value.`, `O Leiloeiro pega <strong>${lots()} peças de Quadro</strong> (${n} jogadores + 1) das pilhas viradas para baixo, sem olhar a frente. Ele escolhe pelo verso — tamanho e valor — e pode pegar várias de mesmo valor.`),
          t("They take the Estimate tokens matching the values printed on those backs, line them up in the Auction room and lay each tile under the token of its value (tiles of the same value share one token).", "Ele pega as fichas de Estimativa dos valores impressos nesses versos, alinha-as na Sala de leilões e põe cada peça sob a ficha do seu valor (peças de mesmo valor dividem uma ficha)."),
          t("Then they turn the paintings face up: these are the lots of this auction. The token keeps showing each painting's value.", "Depois ele vira os quadros para cima: são os lotes deste leilão. A ficha continua mostrando o valor de cada quadro."),
          t("The Auctioneer reveals new lots only once everyone's paintings from the previous round are in their final place.", "O Leiloeiro só revela novos lotes quando os quadros de todos da rodada anterior estiverem no lugar definitivo.")
        ], [4, 5])}
        ${infoCard(t("STEP 2", "PASSO 2"), t("Bid and acquire paintings", "Dê lances e adquira quadros"), [
          t("Everyone (the Auctioneer too) chooses 1 Bid card from their hand at the same time and places it <strong>face down on top of their bid pile</strong> (in round 1, on the starting Bid card).", "Todos (o Leiloeiro também) escolhem ao mesmo tempo 1 carta de Lance da mão e a põem <strong>virada para baixo em cima da sua pilha de lances</strong> (na rodada 1, sobre a carta de Lance inicial)."),
          t("When all are ready, everyone turns their card face up.", "Quando todos estiverem prontos, todos viram a carta para cima."),
          t("From the highest bid to the lowest, each player takes 1 painting from the Auction room and hangs it in their gallery (hanging rules below).", "Do lance mais alto ao mais baixo, cada jogador pega 1 quadro da Sala de leilões e o pendura na sua galeria (regras para pendurar abaixo)."),
          t("Take as long as you like and “try” paintings on your wall first; the next player cannot take a painting until you confirm your choice.", "Leve o tempo que quiser e “experimente” quadros na parede antes; o próximo jogador não pode pegar um quadro até você confirmar sua escolha."),
          t("Bid cards are spent: they stay in your pile for the rest of the game.", "Cartas de Lance são gastas: ficam na sua pilha pelo resto da partida.")
        ], [4])}
        ${infoCard(t("TIES", "EMPATES"), t("Two or more equal bids", "Dois ou mais lances iguais"), [
          t("The tied players reveal the card <strong>just under</strong> their current bid in their own bid pile.", "Os jogadores empatados revelam a carta <strong>logo abaixo</strong> do lance atual na própria pilha de lances."),
          `${t("Still tied? The next card down, and so on. The starting Bid card counts as the first card played.", "Ainda empatados? A carta seguinte para baixo, e assim por diante. A carta de Lance inicial conta como a primeira carta jogada.")} ${interpretation("the higher revealed card picks first, as with bids; the 4 different starting cards always settle it.", "a carta revelada mais alta escolhe primeiro, como nos lances; as 4 cartas iniciais diferentes sempre desempatam.")}`,
          t("Apart from ties, you may not look through your opponents' bid piles.", "Fora dos empates, você não pode olhar as pilhas de lances dos adversários.")
        ], [4])}
        ${infoCard(t("STEP 3", "PASSO 3"), t("Hang tiles", "Pendure peças"), [
          t("As soon as you acquire a Painting or Décor tile, either hang it on your wall following the hanging rules or give it to your assistant for later.", "Assim que você adquire uma peça de Quadro ou de Decoração, pendure-a na parede seguindo as regras para pendurar ou entregue-a ao seu assistente para depois."),
          t("Details in “Hanging tiles”: frames and Décor, faux pas, the assistant and what to do when a painting does not fit.", "Detalhes em “Pendurar peças”: molduras e Decoração, gafes, o assistente e o que fazer quando um quadro não cabe.")
        ], [5, 6])}
        ${infoCard(t("STEP 4", "PASSO 4"), t("Raise prestige", "Aumente o prestígio"), [
          t(`${lots()} lots, ${n} buyers: after the auction exactly 1 painting is left unsold.`, `${lots()} lotes, ${n} compradores: depois do leilão sobra exatamente 1 quadro não vendido.`),
          t("It joins the museum: lay it beside the Museum board on the side of its genre's colour, and move that genre's Prestige marker forward by its value. See “Museum & prestige”.", "Ele entra no museu: coloque-o ao lado do tabuleiro do Museu, no lado da cor do gênero, e avance o marcador de Prestígio desse gênero tantas casas quanto o valor dele. Veja “Museu e prestígio”.")
        ], [7])}
        ${infoCard(t("STEP 5", "PASSO 5"), t("End of the round", "Fim da rodada"), [
          t("The Auctioneer hands the gavel to the player on their left (clockwise), who becomes the Auctioneer and starts the next round by preparing new lots.", "O Leiloeiro passa o martelo ao jogador da esquerda (sentido horário), que se torna o Leiloeiro e começa a próxima rodada preparando novos lotes."),
          t("If an end condition was met during this round, the game ends now instead: go to scoring.", "Se uma condição de fim aconteceu nesta rodada, a partida termina agora: vá para a pontuação.")
        ], [4, 7])}
      </div>`;
  }

  // ---------- hanging ----------

  function hangingSection() {
    return `
      ${sectionHeading("hanging", t("Hanging tiles", "Pendurar peças"), sectionIndex("hanging"), [5, 6])}
      <div class="quick-grid">
        ${infoCard(t("YOUR GALLERY BOARD", "SEU TABULEIRO DE GALERIA"), t("Reading the wall", "Lendo a parede"), [
          rl("Grid", "the striped wall is a grid of squares; every tile covers whole squares.", "Grade", "a parede listrada é uma grade de casas; toda peça cobre casas inteiras."),
          rl("Centre", `${icon("start-star", t("star", "estrela"))} squares where the starting painting goes.`, "Centro", `casas ${icon("start-star", t("estrela", "estrela"))} onde vai o quadro inicial.`),
          rl("Corners", `the four corner squares show ${icon("bare-corner", "−2")}: −2 each if still empty at the end.`, "Cantos", `as quatro casas de canto mostram ${icon("bare-corner", "−2")}: −2 cada se ainda vazias no fim.`),
          rl("Line of sight", `the light band across the wall, between the ${icon("line-of-sight", t("eye", "olho"))} eye icons on the edges.`, "Linha de visão", `a faixa clara que atravessa a parede, entre os ícones de ${icon("line-of-sight", t("olho", "olho"))} olho nas bordas.`),
          `${rl("Assistant", "the butler printed at the right of the board.", "Assistente", "o mordomo impresso à direita do tabuleiro.")} ${interpretation("the rulebook's pictures show the held tile on the outlined spot in his hands.", "as imagens do manual mostram a peça guardada no espaço contornado nas mãos dele.")}`
        ], [3, 5, 8])}
        ${infoCard(t("HANGING RULES", "REGRAS PARA PENDURAR"), t("Every Painting or Décor tile you hang must…", "Toda peça de Quadro ou Decoração que você pendura deve…"), [
          rl("Stay inside", "not stick out of the grid.", "Ficar dentro", "não sair da grade."),
          rl("Touch", "be orthogonally adjacent to at least 1 other tile: edges in contact, corners don't count.", "Encostar", "ser ortogonalmente adjacente a pelo menos 1 outra peça: bordas em contato, cantos não contam."),
          rl("Be upright", "correctly oriented, with its label (cartel) at the bottom. Tiles are never rotated.", "Ficar em pé", "na orientação certa, com a etiqueta (cartel) para baixo. As peças nunca são giradas."),
          rl("Adjust freely", "you may move your new tile around your gallery until the end of the round. Once the Auctioneer reveals the next lots, nothing moves any more.", "Ajuste à vontade", "você pode mover a peça nova pela galeria até o fim da rodada. Quando o Leiloeiro revela os próximos lotes, nada mais se mexe."),
          t("Example: of 5 placements pictured in the rulebook, only the one touching an edge is allowed; touching only by a corner, touching nothing, or a tile turned sideways are all forbidden.", "Exemplo: de 5 posições mostradas no manual, só a que encosta por uma borda é permitida; encostar só pelo canto, não encostar em nada ou peça girada de lado são proibidas.")
        ], [5])}
        ${infoCard(t("MATCHING FRAMES", "MOLDURAS IGUAIS"), t("Earning Décor tiles", "Ganhar peças de Decoração"), [
          t("When a newly hung painting's frame matches the frame of one or more adjacent paintings, you receive Décor.", "Quando a moldura de um quadro recém-pendurado é igual à de um ou mais quadros adjacentes, você recebe Decoração."),
          rl("Value", `count the adjacent matching frames (not the new painting). Take 1 Décor tile worth at most that many ${icon("shield", t("shields", "escudos"))}.`, "Valor", `conte as molduras iguais adjacentes (sem contar o quadro novo). Pegue 1 peça de Decoração que valha no máximo esse número de ${icon("shield", t("escudos", "escudos"))}.`),
          rl("4 or more", "choose any combination of Décor tiles whose total value equals that number.", "4 ou mais", "escolha qualquer combinação de peças de Decoração cujo valor total seja esse número."),
          rl("Immediately", "choose it and hang it in your gallery (normal hanging rules) or give it to your assistant.", "Imediatamente", "escolha-a e pendure-a na galeria (regras normais) ou entregue-a ao assistente."),
          rl("Completing your gallery", "if you would earn a Décor tile in the round you complete your own gallery, you get neither the tile nor its points. That missed tile does not count as a superfluous painting either.", "Completar a galeria", "se você ganharia uma peça de Decoração na rodada em que completa a sua própria galeria, não recebe nem a peça nem os pontos. Essa peça perdida também não conta como quadro supérfluo."),
          `${t("You choose the tile, so pick one you can hang or give to your assistant (any value up to the limit is allowed).", "Você escolhe a peça, então pegue uma que possa pendurar ou entregar ao assistente (qualquer valor até o limite é permitido).")} ${interpretation("the rulebook does not cover a Décor tile that can be neither hung nor held. Take only tiles you can place — with 4 or more matching frames you may receive several, but the assistant still holds just one — and if even the smallest has no place and your assistant cannot take it (hang their tile first if it fits), take no Décor tile.", "o manual não trata de uma peça de Decoração que não pode ser pendurada nem guardada. Pegue só peças que você consegue colocar — com 4 ou mais molduras iguais você pode receber várias, mas o assistente continua guardando só uma — e, se nem a menor couber e o assistente não puder recebê-la (pendure antes a peça dele, se couber), não pegue peça de Decoração.")}`,
          `${t("Matching frames share the same frame design and colour.", "Molduras iguais têm o mesmo desenho e cor.")} ${interpretation("“adjacent” here means sharing an edge, as in the hanging rules; any painting you hang — from the auction, your assistant or a museum swap — can earn Décor. Settle the painting's spot before taking the Décor, since it is taken at once.", "“adjacente” aqui é dividir uma borda, como nas regras para pendurar; qualquer quadro que você pendura — do leilão, do assistente ou de uma troca no museu — pode render Decoração. Defina o lugar do quadro antes de pegar a Decoração, já que ela é pega na hora.")}`
        ], [5])}
        ${infoCard(t("DÉCOR TILES", "PEÇAS DE DECORAÇÃO"), t("Filling the gaps", "Preenchendo os vãos"), [
          t("Décor tiles score their shields at the end and fill spaces no painting fits: there is no 1×1, 2×1 or 3×1 painting in the game.", "Peças de Decoração pontuam os escudos no fim e preenchem espaços onde nenhum quadro cabe: não existe quadro 1×1, 2×1 ou 3×1 no jogo."),
          rl("Supply runs out", "in the rare case every Décor tile of some value is gone, players must, if possible, trade adjacent Décor tiles of their own for tiles from the supply.", "A reserva acaba", "no caso raro de acabarem todas as peças de Decoração de um valor, os jogadores devem, se possível, trocar peças de Decoração adjacentes deles por peças da reserva."),
          t("Example: no 1×1 left, and a player has 3 adjacent 1×1 tiles: they return them to the supply and replace them with a single 3×1 tile.", "Exemplo: não há mais 1×1, e um jogador tem 3 peças 1×1 adjacentes: ele as devolve à reserva e as substitui por uma única peça 3×1.")
        ], [5])}
        ${infoCard(t("FAUX PAS", "GAFE"), t(`Avoid a lapse of taste ${fr("faute de goût")}`, `Evite uma gafe de gosto ${fr("faute de goût")}`), [
          t(`Paintings belong to 4 genres: ${genre("urban")}, ${genre("portrait")}, ${genre("still-life")} and ${genre("landscape")}. The genre icon is on each painting's label.`, `Os quadros pertencem a 4 gêneros: ${genre("urban")}, ${genre("portrait")}, ${genre("still-life")} e ${genre("landscape")}. O ícone do gênero fica na etiqueta de cada quadro.`),
          t("Hanging a new painting adjacent to one or more paintings of the same genre is a faux pas.", "Pendurar um quadro novo adjacente a um ou mais quadros do mesmo gênero é uma gafe."),
          rl("Penalty", "those paintings score no prestige points at the end.", "Penalidade", "esses quadros não fazem pontos de prestígio no fim."),
          rl("Still useful", "they can still count for the line-of-sight bonus.", "Ainda úteis", "eles ainda podem contar no bônus de linha de visão."),
          t("It is allowed — just costly. At the end, each player checks their left neighbor's gallery for faux pas.", "É permitido — só sai caro. No fim, cada jogador confere a galeria do vizinho da esquerda em busca de gafes.")
        ], [6, 8])}
        ${infoCard(t("YOUR ASSISTANT", "SEU ASSISTENTE"), t("One tile on hold", "Uma peça guardada"), [
          t("If you cannot or do not want to hang a tile, give it to your assistant. They hold <strong>1 tile at a time</strong> (Painting or Décor).", "Se você não pode ou não quer pendurar uma peça, entregue-a ao assistente. Ele guarda <strong>1 peça por vez</strong> (Quadro ou Decoração)."),
          t("Whenever you hang a new tile you may also hang the assistant's tile, before or after it. For example: hang the assistant's tile first, then give them the new one.", "Sempre que pendurar uma peça nova você também pode pendurar a peça do assistente, antes ou depois dela. Por exemplo: pendure primeiro a do assistente e depois entregue a nova a ele."),
          t("A painting given to the assistant can only go onto your wall: it can never be exchanged with the museum.", "Um quadro entregue ao assistente só pode ir para a sua parede: nunca pode ser trocado com o museu."),
          rl("End of game", "a tile still held scores nothing, but it is not a superfluous painting.", "Fim da partida", "uma peça ainda guardada não pontua, mas não é um quadro supérfluo.")
        ], [6])}
        ${infoCard(t("RUNNING OUT OF SPACE", "FALTA DE ESPAÇO"), t("A painting that fits no free space", "Um quadro que não cabe em nenhum espaço livre"), [
          t("If the painting you took matches no free space in your gallery, resolve these steps immediately, in order:", "Se o quadro que você pegou não cabe em nenhum espaço livre da galeria, resolva estes passos na hora, em ordem:"),
          rl("1 · Assistant", "you may give it to your assistant. If the assistant already holds a tile that fits your wall (a Décor tile or a painting), you may hang that tile first and then give them the new painting.", "1 · Assistente", "você pode entregá-lo ao assistente. Se o assistente já guarda uma peça que cabe na parede (Decoração ou quadro), você pode pendurá-la antes e depois entregar a ele o quadro novo."),
          rl("2 · Swap with the museum", "if you don't (or your assistant already holds a painting that does not fit either), you may exchange it for a museum painting of the same genre (Landscape for Landscape…) and hang that one normally. The swap does not change that genre's prestige.", "2 · Troca com o museu", "se não fizer isso (ou se o assistente já guarda um quadro que também não cabe), você pode trocá-lo por um quadro do museu do mesmo gênero (Paisagem por Paisagem…) e pendurar esse normalmente. A troca não muda o prestígio do gênero."),
          rl("3 · Superfluous painting", "if you don't swap (for example the museum has no painting of that genre in the right size), keep this superfluous painting beside your board. Then take a 1×1 Décor tile and hang it normally.", "3 · Quadro supérfluo", "se não trocar (por exemplo, o museu não tem quadro desse gênero no tamanho certo), deixe esse quadro supérfluo ao lado do seu tabuleiro. Depois pegue uma peça de Decoração 1×1 e pendure-a normalmente."),
          rl("Cost", "each superfluous painting loses 2 points at the end; your 2nd one triggers the end of the game.", "Custo", "cada quadro supérfluo perde 2 pontos no fim; o 2º dispara o fim da partida."),
          interpretation("the painting you hand over goes into the museum's collection of that genre in place of the one you take.", "o quadro que você entrega entra na coleção do museu desse gênero no lugar do que você pega.")
        ], [6])}
      </div>`;
  }

  // ---------- prestige ----------

  function prestigeSection() {
    return `
      ${sectionHeading("prestige", t("Museum & prestige", "Museu e prestígio"), sectionIndex("prestige"), [7])}
      <p class="glossary-intro">${t(
        "The Prestige markers show how much the art world esteems each genre. At the end, the genres are ranked by their markers: the more prestigious a genre, the more each of its paintings scores. The value on a painting's back and its size are not what it scores — every painting of a genre scores the same, whatever its size.",
        "Os marcadores de Prestígio mostram quanto o mundo da arte estima cada gênero. No fim, os gêneros são classificados pelos marcadores: quanto mais prestigiado o gênero, mais vale cada quadro dele. O valor no verso de um quadro e o seu tamanho não são o que ele pontua — todo quadro de um gênero pontua o mesmo, qualquer que seja o tamanho."
      )} ${referenceLink(4)}</p>
      <div class="quick-grid">
        ${infoCard(t("AFTER EACH AUCTION", "DEPOIS DE CADA LEILÃO"), t("The unsold painting", "O quadro não vendido"), [
          t("The painting nobody took is acquired by the museum, raising the prestige of its genre.", "O quadro que ninguém levou é adquirido pelo museu, aumentando o prestígio do seu gênero."),
          t("Lay it near the Museum board, on the side showing its genre's colour. The unsold paintings in these 4 areas form the museum's collections (used for swaps when a painting doesn't fit).", "Coloque-o perto do tabuleiro do Museu, no lado que mostra a cor do seu gênero. Os quadros não vendidos dessas 4 áreas formam as coleções do museu (usadas nas trocas quando um quadro não cabe)."),
          t("Read its value (on the back of the tile and on its Estimate token) and move that genre's Prestige marker forward that many spaces on the Museum board's track.", "Leia o valor dele (no verso da peça e na ficha de Estimativa) e avance o marcador de Prestígio desse gênero esse número de casas na trilha do tabuleiro do Museu.")
        ], [7])}
        ${infoCard(t("MARKER RULES", "REGRAS DOS MARCADORES"), t("Never tied", "Nunca empatados"), [
          rl("No ties", "two Prestige markers can never share a space. A marker that would land on another one steps back to the first free space.", "Sem empates", "dois marcadores de Prestígio nunca dividem uma casa. Um marcador que cairia sobre outro volta até a primeira casa livre."),
          rl("Swaps", "exchanging paintings with the museum never changes prestige.", "Trocas", "trocar quadros com o museu nunca muda o prestígio."),
          rl("Past 50", "flip the marker to its black side and keep moving from space 1. A black marker's score is +50.", "Depois de 50", "vire o marcador para o lado preto e continue a partir da casa 1. Um marcador preto vale +50."),
          interpretation("“never tied” compares totals: a black marker (its space + 50) and a normal marker may stand on the same printed space, since their totals differ; two black markers, or two normal ones, may not.", "“nunca empatados” compara totais: um marcador preto (sua casa + 50) e um normal podem ficar na mesma casa impressa, pois os totais diferem; dois pretos, ou dois normais, não.")
        ], [7])}
        ${infoCard(t("PRESTIGE LEVELS", "NÍVEIS DE PRESTÍGIO"), t("The podium, before scoring", "O pódio, antes da pontuação"), [
          t("Before the individual scores, rank the 4 genres by how far their markers went and set the markers on the podium at the top of the Museum board:", "Antes da pontuação individual, classifique os 4 gêneros pelo avanço dos marcadores e coloque os marcadores no pódio no alto do tabuleiro do Museu:"),
          rl(`${icon("podium-x5", "×5")} 1st`, `<em>Acclaimed</em> ${fr("Encensé")} — 5 points per painting.`, `${icon("podium-x5", "×5")} 1º`, `<em>Aclamado</em> ${fr("Encensé")} — 5 pontos por quadro.`),
          rl(`${icon("podium-x4", "×4")} 2nd`, `<em>Adored</em> ${fr("Adulé")} — 4 points per painting.`, `${icon("podium-x4", "×4")} 2º`, `<em>Adorado</em> ${fr("Adulé")} — 4 pontos por quadro.`),
          rl(`${icon("podium-x3", "×3")} 3rd`, `<em>Admired</em> ${fr("Admiré")} — 3 points per painting.`, `${icon("podium-x3", "×3")} 3º`, `<em>Admirado</em> ${fr("Admiré")} — 3 pontos por quadro.`),
          rl(`${icon("podium-x2", "×2")} 4th`, `<em>Recognized</em> ${fr("Reconnu")} — 2 points per painting.`, `${icon("podium-x2", "×2")} 4º`, `<em>Reconhecido</em> ${fr("Reconnu")} — 2 pontos por quadro.`),
          `${t("In the rare case one or more genres never entered the museum, each of them is worth ×2.", "No caso raro de um ou mais gêneros nunca terem entrado no museu, cada um deles vale ×2.")} ${interpretation("the genres that did enter still take ×5, ×4… from the most advanced down.", "os gêneros que entraram continuam levando ×5, ×4… do mais avançado para baixo.")}`
        ], [7, 8], "victory-card")}
      </div>`;
  }

  // ---------- end & scoring ----------

  function scoringSection() {
    return `
      ${sectionHeading("scoring", t("End of game & scoring", "Fim e pontuação"), sectionIndex("scoring"), [7, 8])}
      <div class="quick-grid">
        ${infoCard(t("END OF THE GAME", "FIM DA PARTIDA"), t("Triggered when at least one is true", "Disparado quando pelo menos uma ocorre"), [
          t("a player has no free space left in their gallery; or", "um jogador não tem mais espaço livre na galeria; ou"),
          t("a player takes a second superfluous painting; or", "um jogador fica com um segundo quadro supérfluo; ou"),
          t("the players have no Bid cards left in hand (each round uses 1 of your 20 cards, so at most 20 rounds).", "os jogadores não têm mais cartas de Lance na mão (cada rodada usa 1 das suas 20 cartas, então são no máximo 20 rodadas)."),
          rl("Then", "finish the current round and count the scores. The highest score wins.", "Então", "termine a rodada atual e conte os pontos. Vence a maior pontuação.")
        ], [4, 7], "victory-card")}
        ${infoCard(t("FINAL SCORING", "PONTUAÇÃO FINAL"), t("Rank the genres, check for faux pas, then score in six steps", "Classifique os gêneros, confira as gafes e pontue em seis passos"), [
          rl("Podium", "rank the genres first (×5 to ×2; see “Prestige levels”).", "Pódio", "classifique primeiro os gêneros (×5 a ×2; veja “Níveis de prestígio”)."),
          rl("Faux pas check", "each player checks that their left neighbor has not missed a faux pas in their gallery.", "Conferência de gafes", "cada jogador confere se o vizinho da esquerda não deixou passar uma gafe na galeria."),
          rl("1 · Prestige points", "for each genre, count your paintings and multiply by its level on the podium. Paintings in a faux pas (adjacent to the same genre) are not counted.", "1 · Pontos de prestígio", "para cada gênero, conte seus quadros e multiplique pelo nível dele no pódio. Quadros em gafe (adjacentes ao mesmo gênero) não contam."),
          rl("2 · Décor bonus", `add the value (${icon("shield", t("shields", "escudos"))} shields) of every Décor tile hung on your wall.`, "2 · Bônus de Decoração", `some o valor (${icon("shield", t("escudos", "escudos"))} escudos) de toda peça de Decoração pendurada na parede.`),
          rl("3 · Line-of-sight bonus", `+3 for each painting of the most prestigious genre (×5) lying wholly or partly in the band between the two ${icon("line-of-sight", t("eye", "olho"))} eye icons — faux pas paintings included.`, "3 · Bônus de linha de visão", `+3 por quadro do gênero mais prestigiado (×5) que esteja total ou parcialmente na faixa entre os dois ícones de ${icon("line-of-sight", t("olho", "olho"))} olho — quadros em gafe incluídos.`),
          rl("4 · Full Gallery bonus", "+5 if your gallery has no free space left.", "4 · Bônus de galeria completa", "+5 se sua galeria não tiver mais espaço livre."),
          rl("5 · Bare corners", "−2 for each empty corner of your wall.", "5 · Cantos vazios", "−2 por canto da parede vazio."),
          rl("6 · Superfluous paintings", "−2 for each superfluous painting (the tile your assistant holds, if any, does not count).", "6 · Quadros supérfluos", "−2 por quadro supérfluo (a peça que o assistente guarda, se houver, não conta).")
        ], [8], "victory-card")}
        ${infoCard(t("SCORE MARKERS", "MARCADORES DE PONTUAÇÃO"), t("Counting on the Museum track", "Contando na trilha do Museu"), [
          t("Each player counts their points step by step, moving their score marker along the track of the Museum board.", "Cada jogador conta os pontos passo a passo, movendo seu marcador de pontuação pela trilha do tabuleiro do Museu."),
          interpretation("the rulebook does not explain the second marker or its “100” side, and scores often pass 50 (its example scores 64). Count past 50 as the Prestige markers do — restart from space 1 and remember the +50 (the second marker can mark it) — or simply note the scores on paper.", "o manual não explica o segundo marcador nem o lado “100”, e as pontuações muitas vezes passam de 50 (o exemplo dele faz 64). Conte além de 50 como os marcadores de Prestígio — recomece da casa 1 e lembre os +50 (o segundo marcador pode marcá-los) — ou simplesmente anote os pontos no papel.")
        ], [8])}
        ${infoCard(t("TIE", "EMPATE"), t("Breaking a tie", "Desempate"), [
          t("Among tied players, the one whose remaining hand of Bid cards has the highest total value wins.", "Entre os empatados, vence quem tiver a maior soma de valores nas cartas de Lance que restam na mão."),
          t("Still tied: the victory is shared.", "Empate de novo: a vitória é compartilhada.")
        ], [8])}
      </div>`;
  }

  // ---------- iconography ----------

  function iconsSection() {
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), sectionIndex("icons"), [2, 3, 5, 6, 7, 8])}
      <p class="glossary-intro">${t("The symbols printed on the tiles, boards and markers, each cropped individually from the rulebook.", "Os símbolos impressos nas peças, tabuleiros e marcadores, cada um recortado individualmente do manual.")}</p>
      <h3 class="subhead">${t("Painting genres", "Gêneros dos quadros")}</h3>
      <div class="icon-grid">
        ${Object.keys(GENRES).map((id) => iconCard(`genre-${id}`,
          `${GENRES[id].en} (${GENRES[id].colorEn})`,
          `Shown on the label of every ${GENRES[id].en.toLowerCase()} painting and on its Prestige marker: ${GENRES[id].markEn} on ${GENRES[id].colorEn}. French: ${GENRES[id].fr}.`,
          `${GENRES[id].pt} (${GENRES[id].colorPt})`,
          `Na etiqueta de todo quadro de ${GENRES[id].pt.toLowerCase()} e no seu marcador de Prestígio: ${GENRES[id].markPt} em ${GENRES[id].colorPt}. Em francês: ${GENRES[id].fr}.`, 6)).join("")}
      </div>
      <h3 class="subhead">${t("Gallery board and tiles", "Tabuleiro de Galeria e peças")}</h3>
      <div class="icon-grid">
        ${iconCard("start-star", "Star — starting material", "Marks the gold-backed 2×3 starting paintings, the white starting Bid cards, and the centre squares of your wall where the starting painting must cover 1 or 2 stars.", "Estrela — material inicial", "Marca os quadros iniciais 2×3 de verso dourado, as cartas de Lance iniciais brancas e as casas do centro da parede, das quais o quadro inicial deve cobrir 1 ou 2.", 3)}
        ${iconCard("line-of-sight", "Line of sight (eye)", "On both edges of your wall. The light band between the eyes is the line of sight: +3 per painting of the ×5 genre in it at the end.", "Linha de visão (olho)", "Nas duas bordas da parede. A faixa clara entre os olhos é a linha de visão: +3 por quadro do gênero ×5 nela no fim.", 8)}
        ${iconCard("bare-corner", "Bare corner −2", "Printed in the four corner squares of the wall: each corner still empty at the end costs 2 points.", "Canto vazio −2", "Impresso nas quatro casas de canto da parede: cada canto ainda vazio no fim custa 2 pontos.", 5)}
        ${iconCard("shield", "Shield (Décor value)", "Each shield on a Décor tile is worth 1 point at the end and sets which Décor tile you may take for matching frames.", "Escudo (valor da Decoração)", "Cada escudo numa peça de Decoração vale 1 ponto no fim e define qual peça de Decoração você pode pegar com molduras iguais.", 5)}
        ${iconCard("decor-tile", "Décor tile", "Fills gaps no painting fits (1×1, 2×1, 3×1…). This clock covers 3 squares and shows 3 shields.", "Peça de Decoração", "Preenche vãos onde nenhum quadro cabe (1×1, 2×1, 3×1…). Este relógio ocupa 3 casas e mostra 3 escudos.", 2)}
      </div>
      <h3 class="subhead">${t("Museum board podium", "Pódio do tabuleiro do Museu")}</h3>
      <div class="icon-grid">
        ${iconCard("podium-x5", "×5 — most prestigious", "Acclaimed (Encensé): 5 points per painting. The small eye “+3” beneath recalls the line-of-sight bonus for this genre.", "×5 — mais prestigiado", "Aclamado (Encensé): 5 pontos por quadro. O pequeno olho “+3” embaixo lembra o bônus de linha de visão deste gênero.", 7)}
        ${iconCard("podium-x4", "×4", "Adored (Adulé): 4 points per painting — the 2nd genre.", "×4", "Adorado (Adulé): 4 pontos por quadro — o 2º gênero.", 7)}
        ${iconCard("podium-x3", "×3", "Admired (Admiré): 3 points per painting — the 3rd genre.", "×3", "Admirado (Admiré): 3 pontos por quadro — o 3º gênero.", 7)}
        ${iconCard("podium-x2", "×2", "Recognized (Reconnu): 2 points per painting — the last genre, and every genre that never entered the museum.", "×2", "Reconhecido (Reconnu): 2 pontos por quadro — o último gênero e todo gênero que nunca entrou no museu.", 7)}
      </div>
      <h3 class="subhead">${t("Markers and tokens", "Marcadores e fichas")}</h3>
      <div class="icon-grid">
        ${iconCard("gavel", "Auctioneer's gavel", "Its holder is the Auctioneer: prepares the lots, then passes it to the left at the end of the round.", "Martelo do Leiloeiro", "Quem o tem é o Leiloeiro: prepara os lotes e depois o passa para a esquerda no fim da rodada.", 4)}
        ${iconCard("estimation-token", "Estimate token (3–9)", "In the Auction room, each lot lies under the token of the value printed on its back; the unsold painting's token gives its prestige.", "Ficha de Estimativa (3–9)", "Na Sala de leilões, cada lote fica sob a ficha do valor impresso no verso; a ficha do quadro não vendido dá o prestígio dele.", 4)}
        ${iconCard("full-gallery-bonus", "Full Gallery bonus token (5)", "One per player, in the player colours: the +5 for a gallery with no free space left.", "Ficha de Bônus de galeria completa (5)", "Uma por jogador, nas cores dos jogadores: os +5 de uma galeria sem espaço livre.", 2)}
        ${iconCard("player-horn", "Player icon: horn", "Identifies one player's Gallery board (on its back), Bid cards and score markers (brown).", "Ícone de jogador: corneta", "Identifica o tabuleiro de Galeria (no verso), as cartas de Lance e os marcadores de pontuação de um jogador (marrom).", 2)}
        ${iconCard("player-sextant", "Player icon: sextant", "Another player's set (black).", "Ícone de jogador: sextante", "O conjunto de outro jogador (preto).", 2)}
        ${iconCard("player-cupcake", "Player icon: cupcake", "Another player's set (purple).", "Ícone de jogador: cupcake", "O conjunto de outro jogador (roxo).", 2)}
        ${iconCard("player-stopwatch", "Player icon: stopwatch", "Another player's set (grey).", "Ícone de jogador: cronômetro", "O conjunto de outro jogador (cinza).", 2)}
      </div>`;
  }

  // ---------- examples ----------

  function examplesSection() {
    const examples = [
      [t("Preparing the lots (3 players)", "Preparar os lotes (3 jogadores)"), [
        t("With 3 players the Auctioneer selects 4 paintings: one valued 6 and three valued 4.", "Com 3 jogadores o Leiloeiro escolhe 4 quadros: um de valor 6 e três de valor 4."),
        t("They take the Estimate tokens 6 and 4, lay the 6 under the 6 token and the three 4s under the 4 token, then turn the paintings face up.", "Ele pega as fichas de Estimativa 6 e 4, põe o 6 sob a ficha 6 e os três 4 sob a ficha 4, e depois vira os quadros para cima.")
      ], 4],
      [t("Where may it hang?", "Onde pode ser pendurado?"), [
        t("Five placements around a starting painting: only the one sharing an edge with it is legal.", "Cinco posições em volta de um quadro inicial: só a que divide uma borda com ele é legal."),
        t("Touching only at a corner, touching no tile, or turning the tile so its label is not at the bottom are all forbidden.", "Encostar só pelo canto, não encostar em peça nenhuma ou girar a peça com a etiqueta fora de baixo são proibidos.")
      ], 5],
      [t("Matching frames", "Molduras iguais"), [
        t("The new painting is adjacent to 2 paintings with the same frame as its own.", "O quadro novo é adjacente a 2 quadros com a mesma moldura que a dele."),
        t("Its owner may take and hang one Décor tile worth up to 2: a 2-shield bust, a 2-shield pair of plates, or a 1-shield horseshoe.", "O dono pode pegar e pendurar uma peça de Decoração de até 2: um busto de 2 escudos, um par de pratos de 2 escudos ou uma ferradura de 1 escudo.")
      ], 5],
      [t("Décor supply runs out", "A reserva de Decoração acaba"), [
        t("No 1×1 Décor tiles are left in the supply.", "Não há mais peças de Decoração 1×1 na reserva."),
        t("A player with 3 adjacent 1×1 tiles returns them and takes one 3×1 tile instead.", "Um jogador com 3 peças 1×1 adjacentes as devolve e pega uma peça 3×1 no lugar.")
      ], 5],
      [t("A faux pas", "Uma gafe"), [
        t("Two Urban scenes hang side by side.", "Duas Cenas urbanas estão penduradas lado a lado."),
        t("Neither of them will score prestige points.", "Nenhuma delas fará pontos de prestígio.")
      ], 6],
      [t("Using the assistant", "Usar o assistente"), [
        t("To avoid a faux pas, a player gives an Urban scene to their assistant.", "Para evitar uma gafe, um jogador entrega uma Cena urbana ao assistente."),
        t("Next round they hang 1) the painting won at auction, then 2) the one their assistant held.", "Na rodada seguinte ele pendura 1) o quadro ganho no leilão e depois 2) o que o assistente guardava.")
      ], 6],
      [t("Too big: swap with the museum", "Grande demais: troca com o museu"), [
        t("A player was forced to take a Landscape too large for any free space.", "Um jogador foi forçado a pegar uma Paisagem grande demais para qualquer espaço livre."),
        t("They exchange it for a smaller Landscape from the museum's collection and hang that one — no superfluous painting.", "Ele a troca por uma Paisagem menor da coleção do museu e pendura essa — nenhum quadro supérfluo.")
      ], 6],
      [t("Prestige never ties", "O prestígio nunca empata"), [
        t("A Portrait worth 4 is left unsold: the red Portrait marker moves 4 spaces.", "Um Retrato de valor 4 fica sem vender: o marcador vermelho de Retrato anda 4 casas."),
        t("It lands on the blue Urban scene marker, so it steps back 1 and stops on space 3.", "Ele cai sobre o marcador azul de Cena urbana, então volta 1 e para na casa 3."),
        t("If Urban scenes are still ahead at the end, they will score more than Portraits.", "Se as Cenas urbanas ainda estiverem à frente no fim, valerão mais que os Retratos.")
      ], 7],
      [t("The podium", "O pódio"), [
        t("At the end the markers stand: Landscape furthest, then Urban scene, then Portrait, then Still life.", "No fim os marcadores estão: Paisagem mais à frente, depois Cena urbana, depois Retrato, depois Natureza-morta."),
        t("Podium: Landscape ×5, Urban scene ×4, Portrait ×3, Still life ×2.", "Pódio: Paisagem ×5, Cena urbana ×4, Retrato ×3, Natureza-morta ×2.")
      ], 7],
      [t("A full score (64 points)", "Uma pontuação completa (64 pontos)"), [
        t("Still life: 4 paintings × 2 = 8. Portrait: 3 × 3 = 9. Urban scene: 4 × 4 = 16.", "Natureza-morta: 4 quadros × 2 = 8. Retrato: 3 × 3 = 9. Cena urbana: 4 × 4 = 16."),
        t("Landscape: 3 × 5 = 15 — two more Landscapes hang side by side (faux pas) and score nothing here.", "Paisagem: 3 × 5 = 15 — mais duas Paisagens estão lado a lado (gafe) e não pontuam aqui."),
        t("Décor: 11 shields = 11.", "Decoração: 11 escudos = 11."),
        t("Line of sight: Landscapes are ×5; 3 of them touch the band = 9 — the two faux pas Landscapes still count here.", "Linha de visão: as Paisagens são ×5; 3 delas tocam a faixa = 9 — as duas Paisagens em gafe ainda contam aqui."),
        t("Full gallery 0; bare corners 1 × −2 = −2; superfluous paintings 1 × −2 = −2.", "Galeria completa 0; cantos vazios 1 × −2 = −2; quadros supérfluos 1 × −2 = −2."),
        t("Total: 8 + 9 + 16 + 15 + 11 + 9 − 2 − 2 = 64 points.", "Total: 8 + 9 + 16 + 15 + 11 + 9 − 2 − 2 = 64 pontos.")
      ], 8]
    ];
    const pages = [...new Set(examples.map((example) => example[2]))];
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), sectionIndex("examples"), pages)}
      <div class="example-grid">${examples.map(([title, items, page], index) => `
        <article class="example-card">
          <span class="card-number">${String(index + 1).padStart(2, "0")}</span>
          <h3>${title}</h3>
          ${lineList(items)}
          <div class="example-source"><span>${t("From the rulebook's examples", "Dos exemplos do manual")}</span>${referenceLink(page)}</div>
        </article>`).join("")}</div>`;
  }

  // ---------- glossary ----------

  function glossarySection() {
    const visible = [
      { term: ["Adjacent", "Adjacente"], fr: "adjacent", text: ["Sharing an edge with another tile; touching only at a corner does not count.", "Que divide uma borda com outra peça; encostar só pelo canto não conta."], page: 5 },
      { term: ["Assistant", "Assistente"], fr: "assistant", text: ["The butler of your gallery: holds 1 Painting or Décor tile for later. A held tile scores nothing at the end but is not superfluous.", "O mordomo da sua galeria: guarda 1 peça de Quadro ou Decoração para depois. Uma peça guardada não pontua no fim, mas não é supérflua."], page: 6 },
      { term: ["Auction room", "Sala de leilões"], fr: "Salle des ventes", text: ["The area below the Museum board where the Estimate tokens lie and each round's lots are displayed.", "A área abaixo do tabuleiro do Museu onde ficam as fichas de Estimativa e os lotes de cada rodada."], page: 3 },
      { term: ["Auctioneer", "Leiloeiro"], fr: "Commissaire-priseur", text: ["The holder of the gavel. Prepares the lots, bids like everyone, passes the gavel to the left at the end of the round.", "Quem tem o martelo. Prepara os lotes, dá lance como todos e passa o martelo para a esquerda no fim da rodada."], page: 4 },
      { term: ["Bare corner", "Canto vazio"], fr: "coin nu", text: ["One of the four corner squares of your wall left empty: −2 each at the end.", "Uma das quatro casas de canto da parede deixada vazia: −2 cada no fim."], page: 8 },
      { term: ["Bid card", "Carta de Lance"], fr: "carte Enchère", text: ["Each player's 20 cards in their colour. One is played face down each round and stays in the bid pile.", "As 20 cartas de cada jogador na sua cor. Uma é jogada virada para baixo por rodada e fica na pilha de lances."], page: 4 },
      { term: ["Bid pile", "Pilha de lances"], fr: "pile d'enchères", text: ["Your played Bid cards, stacked on your starting Bid card. Used only to break tied bids.", "Suas cartas de Lance jogadas, empilhadas sobre a carta de Lance inicial. Só é usada para desempatar lances."], page: 4 },
      { term: ["Décor tile", "Peça de Decoração"], fr: "tuile Décor", text: ["Earned with matching frames (or as a 1×1 with a superfluous painting). Fills gaps and scores 1 point per shield.", "Ganha com molduras iguais (ou uma 1×1 com um quadro supérfluo). Preenche vãos e pontua 1 por escudo."], page: 5 },
      { term: ["Estimate token", "Ficha de Estimativa"], fr: "jeton Estimation", text: ["Seven tokens valued 3–9. Each lot lies under the token of the value on its back.", "Sete fichas de valor 3–9. Cada lote fica sob a ficha do valor do seu verso."], page: 4 },
      { term: ["Faux pas", "Gafe"], fr: "faute de goût", text: ["Hanging a painting adjacent to one of the same genre. All the paintings involved score no prestige points.", "Pendurar um quadro adjacente a outro do mesmo gênero. Todos os quadros envolvidos ficam sem pontos de prestígio."], page: 6 },
      { term: ["Frame", "Moldura"], fr: "cadre", text: ["The border of a painting. A new painting next to paintings with the same frame earns Décor.", "A borda de um quadro. Um quadro novo ao lado de quadros com a mesma moldura rende Decoração."], page: 5 },
      { term: ["Full Gallery bonus", "Bônus de galeria completa"], fr: "bonus de galerie complète", text: ["+5 at the end if your gallery has no free space.", "+5 no fim se sua galeria não tiver espaço livre."], page: 8 },
      { term: ["Genre", "Gênero"], fr: "genre pictural", text: ["Urban scene, Portrait, Still life or Landscape — shown by the icon on a painting's label.", "Cena urbana, Retrato, Natureza-morta ou Paisagem — indicado pelo ícone na etiqueta do quadro."], page: 6 },
      { term: ["Label", "Etiqueta"], fr: "cartel", text: ["The small plaque on a painting with its genre icon. It must face the bottom when hung.", "A plaquinha no quadro com o ícone do gênero. Deve ficar para baixo quando pendurado."], page: 5 },
      { term: ["Line of sight", "Linha de visão"], fr: "ligne de vue", text: ["The light band across your wall between the eye icons. +3 per painting of the ×5 genre in it at the end.", "A faixa clara na parede entre os ícones de olho. +3 por quadro do gênero ×5 nela no fim."], page: 8 },
      { term: ["Lots", "Lotes"], fr: "lots", text: [`The players + 1 paintings put up for auction each round (${lots()} in this match).`, `Os quadros (jogadores + 1) postos em leilão a cada rodada (${lots()} nesta partida).`], page: 4 },
      { term: ["Museum collections", "Coleções do museu"], fr: "collections du musée", text: ["The unsold paintings laid by the Museum board, grouped by genre. You may swap with them only when a painting doesn't fit.", "Os quadros não vendidos ao lado do tabuleiro do Museu, agrupados por gênero. Só dá para trocar com eles quando um quadro não cabe."], page: 7 },
      { term: ["Prestige level", "Nível de prestígio"], fr: "niveau de prestige", text: ["The genre's place on the podium at the end: ×5, ×4, ×3 or ×2 points per painting.", "O lugar do gênero no pódio no fim: ×5, ×4, ×3 ou ×2 pontos por quadro."], page: 7 },
      { term: ["Prestige marker", "Marcador de Prestígio"], fr: "marqueur Prestige", text: ["One per genre on the Museum track; advances by the value of each unsold painting of its genre.", "Um por gênero na trilha do Museu; avança o valor de cada quadro não vendido do seu gênero."], page: 7 },
      { term: ["Starting painting", "Quadro inicial"], fr: "tableau de départ", text: ["A gold-backed 2×3 tile marked with a star, hung on the centre stars during setup.", "Uma peça 2×3 de verso dourado marcada com estrela, pendurada nas estrelas do centro na preparação."], page: 3 },
      { term: ["Superfluous painting", "Quadro supérfluo"], fr: "tableau superflu", text: ["A painting that fit nowhere and was not swapped: kept beside your board, −2 at the end. A second one ends the game.", "Um quadro que não coube em lugar nenhum e não foi trocado: fica ao lado do tabuleiro, −2 no fim. Um segundo encerra a partida."], page: 6 },
      { term: ["Value", "Valor"], fr: "valeur", text: ["The number on a painting's back (3–9): how much prestige it gives if it goes to the museum. Not its score.", "O número no verso de um quadro (3–9): quanto prestígio ele dá se for ao museu. Não é a pontuação dele."], page: 4 }
    ];
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    const pages = [...new Set(visible.map((item) => item.page))].sort((a, b) => a - b);
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), sectionIndex("glossary"), pages)}
      <p class="glossary-intro">${t("The supplied rulebook is the French edition; each term shows the French word printed there.", "O manual fornecido é a edição francesa; cada termo mostra a palavra francesa impressa nele.")}</p>
      <div class="quick-grid glossary-grid">${visible.map((item) => `
        <article class="info-card glossary-card">
          <span class="component-label">${t("TERM", "TERMO")}</span>
          <h3>${t(item.term[0], item.term[1])} ${fr(item.fr)}</h3>
          <p>${t(item.text[0], item.text[1])}</p>
          ${referenceLink(item.page)}
        </article>`).join("")}</div>`;
  }

  // ---------- render ----------

  function renderInto(host) {
    root = host;
    document.body.classList.add("theme-art-society");
    document.documentElement.lang = state.language;
    document.title = t("Art Society — Field Manual", "Art Society — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Art Society: 2–4 players, a match-filtered setup checklist, quick reference, auctions, hanging rules, museum prestige, scoring, iconography and the rulebook's examples.",
        "Regras interativas bilíngues de Art Society: 2–4 jogadores, lista de preparação filtrada, referência rápida, leilões, regras para pendurar, prestígio do museu, pontuação, iconografia e os exemplos do manual."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook · core game", "Livro interativo · jogo base")}</p>
          <h1>Art Society</h1>
          <p class="hero-intro">${t(
            "You are a refined art connoisseur out to impress your peers with the most fashionable collection. Win the most sought-after works at auction and turn your salon into a gallery as learned as it is elegant. But fashion is fickle: the paintings collectors pass over find a place in the museum — and shift the prestige of your acquisitions.",
            "Você é um fino conhecedor de arte decidido a impressionar os colegas com a coleção mais em voga. Arremate em leilão as obras mais cobiçadas e faça do seu salão uma galeria tão erudita quanto elegante. Mas a moda é volúvel: os quadros que os colecionadores desprezam ganham lugar no museu — e alteram o prestígio das suas aquisições."
          )}</p>
          <div class="hero-meta"><span>${t("2–4 players", "2–4 jogadores")}</span><span>${t("30–60 min · ages 10+", "30–60 min · 10+ anos")}</span><span>${t("Auction · tile laying", "Leilão · colocação de peças")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/art-society.webp" alt="${t("Cover of the French Art Society rulebook: four framed paintings — a still life, an urban scene, a portrait and a landscape — on a teal wallpaper under the gold title", "Capa do manual francês de Art Society: quatro quadros emoldurados — uma natureza-morta, uma cena urbana, um retrato e uma paisagem — sobre papel de parede azul-petróleo sob o título dourado")}" fetchpriority="high"><figcaption>${t("Rulebook cover · game by Mitch Wallace, Mighty Boards", "Capa do manual · jogo de Mitch Wallace, Mighty Boards")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("The gallery", "A galeria")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column as-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied Art Society rulebook — the French edition (Lucky Duck Games, © 2023 Mighty Boards), 8 pages, translated here; French terms appear in italics so you can match your components. The game has no variants or solo mode in this booklet. Points marked “Guide's reading” are interpretations where the rulebook is silent. Page links open the PDF at the cited page (its printed page numbers match the PDF pages).",
            "Este guia cobre o manual fornecido de Art Society — a edição francesa (Lucky Duck Games, © 2023 Mighty Boards), 8 páginas, traduzida aqui; os termos em francês aparecem em itálico para você relacioná-los aos componentes. O jogo não tem variantes nem modo solo neste livreto. Pontos marcados como “Leitura do guia” são interpretações onde o manual é omisso. Os links abrem o PDF na página citada (a numeração impressa coincide com as páginas do PDF)."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${roundSection()}</section>
          <section class="rule-section">${hangingSection()}</section>
          <section class="rule-section">${prestigeSection()}</section>
          <section class="rule-section">${scoringSection()}</section>
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the French Art Society rulebook. Designer: Mitch Wallace; art direction and design: Mark Casha; illustrations: Giacomo Vichi, Sofia Rossi, Veronica Grassi, Angelica Regni, Doris Shermadhi, Max Kosek. © 2023 Mighty Boards Ltd.; French edition by Lucky Duck Games.",
        "Guia pessoal de consulta baseado no manual francês de Art Society. Autor: Mitch Wallace; direção de arte e design: Mark Casha; ilustrações: Giacomo Vichi, Sofia Rossi, Veronica Grassi, Angelica Regni, Doris Shermadhi, Max Kosek. © 2023 Mighty Boards Ltd.; edição francesa da Lucky Duck Games."
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
      root.querySelector(".as-page")?.prepend(notice);
    }
    notice.textContent = storageNoticeText();
  }

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !root || !root.contains(target)) {
      return;
    }
    if (target.type === "radio" && target.dataset.players !== undefined) {
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

  window.ArtSociety = { renderInto, onClick, onChange };
})();
