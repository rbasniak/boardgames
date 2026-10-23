(() => {
  "use strict";

  const STORAGE_KEY = "field-manual.coup.v1";
  const MANUAL_FILE = "coup_core.pdf";
  const ASSETS = "assets/coup";

  const CHARACTERS = [
    {
      file: "duke",
      en: "Duke",
      pt: "Duque",
      actionEn: "Tax. Take 3 coins from the Treasury. A character action: claim the Duke, truthfully or as a bluff.",
      actionPt: "Taxar. Pegue 3 moedas do Tesouro. Ação de personagem: declare o Duque, dizendo a verdade ou blefando.",
      blockEn: "Blocks Foreign Aid. Another player who claims the Duke stops the player collecting Foreign Aid, who receives no coins.",
      blockPt: "Bloqueia Ajuda externa. Outro jogador que declare o Duque impede quem está recebendo Ajuda externa, que não ganha moeda nenhuma."
    },
    {
      file: "assassin",
      en: "Assassin",
      pt: "Assassino",
      actionEn: "Assassinate. Pay 3 coins to the Treasury and choose another player who still has influence. If the assassination succeeds, that player immediately loses an influence. The Contessa can block it.",
      actionPt: "Assassinar. Pague 3 moedas ao Tesouro e escolha outro jogador que ainda tenha influência. Se o assassinato tiver sucesso, esse jogador perde uma influência imediatamente. A Condessa pode bloqueá-lo.",
      blockEn: "The Assassin has no block.",
      blockPt: "O Assassino não bloqueia nada."
    },
    {
      file: "captain",
      en: "Captain",
      pt: "Capitão",
      actionEn: "Steal. Take 2 coins from another player who still has influence. If that player has only 1 coin, take that 1. The Ambassador or the Captain can block it.",
      actionPt: "Roubar. Pegue 2 moedas de outro jogador que ainda tenha influência. Se esse jogador tiver só 1 moeda, pegue essa 1. O Embaixador ou o Capitão podem bloquear.",
      blockEn: "Blocks Stealing, and so does the Ambassador. The player being stolen from claims either character. The steal takes no coins.",
      blockPt: "Bloqueia Roubar, assim como o Embaixador. Quem está sendo roubado declara um dos dois. O roubo não leva moeda nenhuma."
    },
    {
      file: "ambassador",
      en: "Ambassador",
      pt: "Embaixador",
      actionEn: "Exchange. Draw 2 random cards from the Court deck. Exchange any number of them, including none, with your face-down cards, then return exactly 2 cards to the Court deck. The booklet does not say to shuffle after an exchange.",
      actionPt: "Trocar. Compre 2 cartas aleatórias do baralho da Corte. Troque qualquer quantidade delas, inclusive nenhuma, com as suas cartas viradas para baixo, e depois devolva exatamente 2 cartas ao baralho da Corte. O livreto não manda embaralhar depois de uma troca.",
      blockEn: "Blocks Stealing, and so does the Captain. The player being stolen from claims either character. The steal takes no coins.",
      blockPt: "Bloqueia Roubar, assim como o Capitão. Quem está sendo roubado declara um dos dois. O roubo não leva moeda nenhuma."
    },
    {
      file: "contessa",
      en: "Contessa",
      pt: "Condessa",
      actionEn: "The Contessa has no action of her own.",
      actionPt: "A Condessa não tem uma ação própria.",
      blockEn: "Blocks Assassination. Only the player being assassinated may claim the Contessa. The assassination fails, and the 3 coins the Assassin paid stay spent.",
      blockPt: "Bloqueia Assassinato. Só quem está sendo assassinado pode declarar a Condessa. O assassinato falha, e as 3 moedas pagas pelo Assassino continuam gastas."
    }
  ];

  let storageAvailable = true;
  let storageNotice = "";
  let root = null;

  function defaultState() {
    return {
      language: "pt-BR",
      players: 4,
      twoPlayerVariant: false,
      setupChecks: []
    };
  }

  function normalizeState(saved) {
    const next = defaultState();
    if (!saved || typeof saved !== "object") {
      return next;
    }
    if (saved.language === "en-US" || saved.language === "pt-BR") {
      next.language = saved.language;
    }
    const players = Number(saved.players);
    if (players === 2 || players === 3 || players === 4 || players === 5 || players === 6) {
      next.players = players;
    }
    next.twoPlayerVariant = saved.twoPlayerVariant === true && next.players === 2;
    next.setupChecks = Array.isArray(saved.setupChecks)
      ? saved.setupChecks.filter((id) => typeof id === "string")
      : [];
    return next;
  }

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return defaultState();
      }
      return normalizeState(JSON.parse(raw));
    } catch (error) {
      storageAvailable = false;
      storageNotice = "read";
      console.error("Could not read the Coup match settings.", error);
      return defaultState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      storageAvailable = true;
      if (storageNotice === "write") {
        storageNotice = "";
      }
    } catch (error) {
      storageAvailable = false;
      storageNotice = "write";
      console.error("Could not save the Coup match settings.", error);
    }
  }

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function configurationKey() {
    return JSON.stringify({
      players: state.players,
      twoPlayerVariant: state.players === 2 && state.twoPlayerVariant
    });
  }

  function commit(mutator, restoreId) {
    const previous = configurationKey();
    mutator();
    state = normalizeState(state);
    if (configurationKey() !== previous) {
      state.setupChecks = [];
    }
    saveState();
    if (root) {
      renderInto(root);
    }
    if (!restoreId) {
      return;
    }
    const next = document.getElementById(restoreId);
    if (next) {
      next.focus();
    }
  }

  function matchFacts() {
    const players = state.players;
    const variant = players === 2 && state.twoPlayerVariant;
    const coinsOut = players === 2 ? 3 : players * 2;
    return {
      players,
      variant,
      court: variant ? 3 : 15 - players * 2,
      coinsOut,
      treasury: 50 - coinsOut,
      summariesLeft: 6 - players
    };
  }

  function manualUrl(printedPage) {
    const script = document.querySelector('script[src*="coup.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${MANUAL_FILE}`, baseUrl).href}#page=${printedPage}`;
  }

  function referenceLink(printedPage) {
    const label = t(`Rulebook p. ${printedPage} ↗`, `Manual p. ${printedPage} ↗`);
    return `<a class="source-link" href="${escapeHtml(manualUrl(printedPage))}" target="_blank" rel="noreferrer">${label}</a>`;
  }

  function sectionHeading(id, title, index, pages) {
    const links = pages.map((page) => referenceLink(page)).join("");
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("FIELD GUIDE", "GUIA DE CAMPO")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="section-links">${links}</div>
      </div>`;
  }

  function icon(file) {
    return `${ASSETS}/${file}.webp`;
  }

  function storageNoticeText() {
    if (storageNotice === "read") {
      return t(
        "This browser could not read the saved Coup match. The guide is showing a new default match, and it may not be possible to save changes.",
        "Este navegador não conseguiu ler a partida salva de Coup. O guia está mostrando uma partida nova, e pode não ser possível salvar alterações."
      );
    }
    return t(
      "This browser refused to save the Coup match. Your latest change is on screen only.",
      "Este navegador recusou salvar a partida de Coup. A última alteração está só na tela."
    );
  }

  function playerDetail(count) {
    const court = 15 - count * 2;
    const left = 6 - count;
    if (count === 2) {
      return t(
        "The starting player receives 1 coin and the other player receives 2, so 47 coins stay in the Treasury. The normal deal leaves an 11-card Court. The variant below can replace that deal. This 1-coin rule is always on with 2 players; it is not part of the variant.",
        "O jogador inicial recebe 1 moeda e o outro recebe 2, então 47 moedas ficam no Tesouro. O embaralhamento normal deixa a Corte com 11 cartas. A variante abaixo pode substituir esse embaralhamento. Essa regra da 1 moeda vale sempre com 2 jogadores; ela não faz parte da variante."
      );
    }
    const coinsOut = count * 2;
    const treasury = 50 - coinsOut;
    let unused = t("Every summary card is used.", "Todas as cartas-resumo são usadas.");
    if (left === 1) {
      unused = t("1 summary card stays in the box.", "1 carta-resumo fica na caixa.");
    } else if (left > 1) {
      unused = t(`${left} summary cards stay in the box.`, `${left} cartas-resumo ficam na caixa.`);
    }
    return t(
      `Each of the ${count} players receives 2 coins (${coinsOut} dealt, ${treasury} stay in the Treasury). The Court has ${court} cards. ${unused}`,
      `Cada um dos ${count} jogadores recebe 2 moedas (${coinsOut} distribuídas, ${treasury} ficam no Tesouro). A Corte fica com ${court} cartas. ${unused}`
    );
  }

  function playerChoices() {
    return [2, 3, 4, 5, 6].map((count) => `
      <label class="sniper-choice-card${state.players === count ? " selected" : ""}">
        <input id="coup-players-${count}" type="radio" name="coup-players" value="${count}" data-players ${state.players === count ? "checked" : ""}>
        <span><strong>${t(`${count} players`, `${count} jogadores`)}</strong><small>${playerDetail(count)}</small></span>
      </label>`).join("");
  }

  function variantChoices() {
    const options = [
      {
        value: "no",
        selected: !state.twoPlayerVariant,
        en: "Normal deal",
        pt: "Embaralhamento normal",
        detailEn: "Shuffle all 15 character cards, deal 2 face down to each player, and the remaining 11 cards are the Court deck. The starting player still receives only 1 coin.",
        detailPt: "Embaralhe as 15 cartas de personagem, dê 2 viradas para baixo a cada jogador, e as 11 cartas restantes são o baralho da Corte. O jogador inicial continua recebendo só 1 moeda."
      },
      {
        value: "yes",
        selected: state.twoPlayerVariant,
        en: "Two-player variant",
        pt: "Variante para dois jogadores",
        detailEn: "Replaces the deal only. Divide the 15 cards into 3 sets of 5, each set one of every character. Each player secretly keeps 1 card from their set and discards the other 4 without showing them. Shuffle the third set, deal 1 card to each player, and the remaining 3 cards are the face-down Court. The starting player still receives only 1 coin.",
        detailPt: "Substitui só o embaralhamento. Divida as 15 cartas em 3 conjuntos de 5, cada um com um de cada personagem. Cada jogador fica em segredo com 1 carta do seu conjunto e descarta as outras 4 sem mostrá-las. Embaralhe o terceiro conjunto, dê 1 carta a cada jogador, e as 3 cartas restantes são a Corte virada para baixo. O jogador inicial continua recebendo só 1 moeda."
      }
    ];
    return options.map((option) => `
      <label class="sniper-choice-card${option.selected ? " selected" : ""}">
        <input id="coup-variant-${option.value}" type="radio" name="coup-variant" value="${option.value}" data-variant ${option.selected ? "checked" : ""}>
        <span><strong>${t(option.en, option.pt)}</strong><small>${t(option.detailEn, option.detailPt)}</small></span>
      </label>`).join("");
  }

  function optionBlock(title, intro, control, pages) {
    return `
      <div class="optional-rule-group">
        <h4>${title}</h4>
        <p class="optional-rule-intro">${intro}</p>
        ${control}
        <div class="source-note">${pages.map((page) => referenceLink(page)).join(" ")}</div>
      </div>`;
  }

  function matchSummary() {
    const facts = matchFacts();
    if (facts.variant) {
      return t(
        `Current match: 2 players, two-player variant. Each player secretly keeps 1 card and is dealt 1 more; the Court has 3 cards; 8 cards are discarded unseen. The starting player gets 1 coin, the other gets 2, and the Treasury starts at 47.`,
        `Partida atual: 2 jogadores, variante para dois. Cada jogador fica em segredo com 1 carta e recebe mais 1; a Corte tem 3 cartas; 8 cartas são descartadas sem serem mostradas. O jogador inicial recebe 1 moeda, o outro recebe 2, e o Tesouro começa com 47.`
      );
    }
    if (facts.players === 2) {
      return t(
        "Current match: 2 players, normal deal. Deal 2 cards each; the Court has 11 cards. The starting player gets 1 coin, the other gets 2, and the Treasury starts at 47.",
        "Partida atual: 2 jogadores, embaralhamento normal. Dê 2 cartas a cada um; a Corte tem 11 cartas. O jogador inicial recebe 1 moeda, o outro recebe 2, e o Tesouro começa com 47."
      );
    }
    return t(
      `Current match: ${facts.players} players, normal deal. Deal 2 cards each; the Court has ${facts.court} cards. Each player gets 2 coins (${facts.coinsOut} dealt) and the Treasury starts at ${facts.treasury}.`,
      `Partida atual: ${facts.players} jogadores, embaralhamento normal. Dê 2 cartas a cada um; a Corte tem ${facts.court} cartas. Cada jogador recebe 2 moedas (${facts.coinsOut} distribuídas) e o Tesouro começa com ${facts.treasury}.`
    );
  }

  function matchPanel() {
    const variantBlock = state.players === 2
      ? optionBlock(
        t("Two-player variant", "Variante para dois jogadores"),
        t(
          "With 2 players the booklet offers this optional deal. It changes which cards enter the Court. It does not change the 1-coin rule for the starting player. Leave it off for the normal shuffle-and-deal.",
          "Com 2 jogadores o livreto oferece este embaralhamento opcional. Ele muda quais cartas entram na Corte. Não muda a regra da 1 moeda para o jogador inicial. Deixe desligado para o embaralhamento normal."
        ),
        `<div class="sniper-choice-grid">${variantChoices()}</div>`,
        [7]
      )
      : "";
    return `
      <section class="controls-panel" aria-labelledby="coup-match-title">
        <div class="panel-topline"><div><p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p><h2 id="coup-match-title">${t("Build your match", "Configure a partida")}</h2><p>${t(
          "This guide covers the core booklet only. The back page advertises the Reformation expansion and does not give its rules, so those roles are not here. The booklet never prints a player-count range. It includes 6 summary cards, one for each player, and a separate two-player section, so this guide offers 2 to 6 players.",
          "Este guia cobre só o livreto base. A última página anuncia a expansão Reformation e não traz as regras dela, então esses papéis não estão aqui. O livreto não imprime uma faixa de jogadores. Ele traz 6 cartas-resumo, uma para cada jogador, e uma seção só para dois jogadores, então este guia oferece de 2 a 6 jogadores."
        )}</p></div><span class="saved-label">${storageAvailable ? t("Saved locally", "Salvo localmente") : t("Not saved", "Não salvo")}</span></div>
        ${optionBlock(
          t("Number of players", "Número de jogadores"),
          t(
            "Choose the exact count. It decides how many cards are dealt, how large the Court deck is, how the coins are split, and how many summary cards stay in the box. At 2 players it also decides who receives 1 coin.",
            "Escolha a contagem exata. Ela define quantas cartas são distribuídas, qual o tamanho da Corte, como as moedas são divididas e quantas cartas-resumo ficam na caixa. Com 2 jogadores, ela também define quem recebe 1 moeda."
          ),
          `<div class="sniper-choice-grid">${playerChoices()}</div>`,
          [1, 7]
        )}
        ${variantBlock}
        <p class="optional-mode-note">${matchSummary()}</p>
      </section>`;
  }

  function jump(id, label) {
    return `<button type="button" data-scroll="${id}">${label}</button>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function quickReference() {
    const cards = [
      [t("Your turn", "Seu turno"), [
        t("Play proceeds clockwise. Take exactly one action you can afford. You may not pass.", "O jogo segue em sentido horário. Faça exatamente uma ação que você possa pagar. Você não pode passar."),
        t("If you start the turn with 10 or more coins, that action must be a Coup.", "Se você começa o turno com 10 ou mais moedas, essa ação tem de ser um Golpe.")
      ], "actions"],
      [t("General actions", "Ações gerais"), [
        t("<strong>Income:</strong> take 1 coin. Nobody can block it.", "<strong>Renda:</strong> pegue 1 moeda. Ninguém pode bloquear."),
        t("<strong>Foreign Aid:</strong> take 2 coins, unless a Duke blocks it.", "<strong>Ajuda externa:</strong> pegue 2 moedas, a menos que um Duque bloqueie."),
        t("<strong>Coup:</strong> pay 7 and a player loses an influence. A Coup always works; it cannot be blocked or challenged.", "<strong>Golpe:</strong> pague 7 e um jogador perde uma influência. Um Golpe sempre funciona; não pode ser bloqueado nem desafiado.")
      ], "actions"],
      [t("Character actions", "Ações de personagem"), [
        t("<strong>Duke:</strong> take 3 coins.", "<strong>Duque:</strong> pegue 3 moedas."),
        t("<strong>Assassin:</strong> pay 3 to make a player lose an influence.", "<strong>Assassino:</strong> pague 3 para um jogador perder uma influência."),
        t("<strong>Captain:</strong> take 2 coins from a player, or 1 if that is all they have.", "<strong>Capitão:</strong> pegue 2 moedas de um jogador, ou 1 se for só o que ele tem."),
        t("<strong>Ambassador:</strong> draw 2 Court cards and return 2.", "<strong>Embaixador:</strong> compre 2 cartas da Corte e devolva 2."),
        t("Claim the character. You may be bluffing; you show a card only if challenged.", "Declare o personagem. Você pode estar blefando; só mostra uma carta se for desafiado.")
      ], "actions"],
      [t("Blocks and challenges", "Bloqueios e desafios"), [
        t("After you announce, other players may challenge a claim or block the action.", "Depois que você anuncia, os outros podem desafiar uma declaração ou bloquear a ação."),
        t("Resolve a challenge before the action or the block takes effect.", "Resolva um desafio antes que a ação ou o bloqueio tenha efeito."),
        t("A failed claim cancels the action and returns coins you paid.", "Uma declaração falsa cancela a ação e devolve as moedas que você pagou."),
        t("A successful block also cancels the action, but coins you paid stay spent.", "Um bloqueio bem-sucedido também cancela a ação, mas as moedas que você pagou continuam gastas.")
      ], "challenges"],
      [t("Influence and exile", "Influência e exílio"), [
        t("Your two face-down cards are your influence.", "Suas duas cartas viradas para baixo são a sua influência."),
        t("Losing an influence: choose one card and turn it face up. It stays in front of you and no longer counts.", "Perder uma influência: escolha uma carta e vire-a para cima. Ela fica à sua frente e deixa de contar."),
        t("When both are face up you are exiled: leave them there and return your coins to the Treasury.", "Quando as duas estão viradas para cima, você é exilado: deixe-as ali e devolva suas moedas ao Tesouro.")
      ], "ending"],
      [t("Winning", "Vitória"), [
        t("The last player who still has influence wins. There is no second place.", "Vence o último jogador que ainda tem influência. Não há segundo lugar.")
      ], "ending"]
    ];
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), "01", [2, 3])}
      <div class="quick-grid">${cards.map(([title, lines, target]) => `
        <article class="info-card"><h3>${title}</h3>${lineList(lines)}<p>${jump(target, t("Open the full rule", "Abrir a regra completa"))}</p></article>`).join("")}</div>`;
  }

  function substeps(lines) {
    return `<span class="setup-substeps" role="list">${lines.map((line) => `<span role="listitem">${line}</span>`).join("")}</span>`;
  }

  function checkRow(id, title, lines) {
    const checked = state.setupChecks.includes(id) ? "checked" : "";
    return `
      <li class="setup-check-row">
        <input id="setup-check-${id}" type="checkbox" data-setup-check="${id}" ${checked}>
        <label for="setup-check-${id}"><span><strong>${title}</strong>${substeps(lines)}</span></label>
      </li>`;
  }

  function cardLines() {
    const facts = matchFacts();
    if (facts.variant) {
      return [
        t("Divide the 15 character cards into 3 sets of 5. Each set has one Duke, one Assassin, one Captain, one Ambassador and one Contessa.", "Divida as 15 cartas de personagem em 3 conjuntos de 5. Cada conjunto tem um Duque, um Assassino, um Capitão, um Embaixador e uma Condessa."),
        t("Each player takes one set, looks at it in secret, keeps 1 card and discards the other 4 face down. Those 8 discarded cards are out of the game and are not shown to the other player.", "Cada jogador pega um conjunto, olha em segredo, fica com 1 carta e descarta as outras 4 viradas para baixo. Essas 8 cartas descartadas saem do jogo e não são mostradas ao outro jogador."),
        t("Shuffle the third set. Deal 1 card face down to each player. The remaining 3 cards are the Court deck, face down in the middle of the table.", "Embaralhe o terceiro conjunto. Dê 1 carta virada para baixo a cada jogador. As 3 cartas restantes são o baralho da Corte, virado para baixo no meio da mesa."),
        t("Each player may look at their own 2 cards at any time and must keep them face down. Do not record those cards in this guide.", "Cada jogador pode olhar as próprias 2 cartas a qualquer momento e deve mantê-las viradas para baixo. Não registre essas cartas neste guia.")
      ];
    }
    return [
      t("Shuffle all 15 character cards. There are 3 copies of each character: Duke, Assassin, Captain, Ambassador and Contessa.", "Embaralhe as 15 cartas de personagem. Há 3 cópias de cada personagem: Duque, Assassino, Capitão, Embaixador e Condessa."),
      t(`Deal 2 cards face down to each of the ${facts.players} players. That is ${facts.players * 2} cards dealt. Each player may look at their own cards and must keep them face down.`, `Dê 2 cartas viradas para baixo a cada um dos ${facts.players} jogadores. São ${facts.players * 2} cartas distribuídas. Cada jogador pode olhar as próprias cartas e deve mantê-las viradas para baixo.`),
      t(`Place the remaining ${facts.court} cards face down in the middle as the Court deck.`, `Coloque as ${facts.court} cartas restantes viradas para baixo no meio, como o baralho da Corte.`),
      t("Do not record anyone's cards in this guide. A face-down card is private until a challenge forces its owner to show it.", "Não registre a carta de ninguém neste guia. Uma carta virada para baixo é particular até um desafio obrigar o dono a mostrá-la.")
    ];
  }

  function coinLines() {
    const facts = matchFacts();
    if (facts.players === 2) {
      return [
        t("Give the starting player 1 coin. Give the other player 2 coins. Both piles stay visible.", "Dê 1 moeda ao jogador inicial. Dê 2 moedas ao outro jogador. As duas pilhas ficam visíveis."),
        t("Put the remaining 47 coins in the middle as the Treasury.", "Coloque as 47 moedas restantes no meio, como o Tesouro.")
      ];
    }
    return [
      t(`Give each of the ${facts.players} players 2 coins. Each pile stays visible. That deals ${facts.coinsOut} coins.`, `Dê 2 moedas a cada um dos ${facts.players} jogadores. Cada pilha fica visível. Isso distribui ${facts.coinsOut} moedas.`),
      t(`Put the remaining ${facts.treasury} coins in the middle as the Treasury.`, `Coloque as ${facts.treasury} moedas restantes no meio, como o Tesouro.`)
    ];
  }

  function summaryLines() {
    const facts = matchFacts();
    const unused = facts.summariesLeft === 0
      ? t("Every summary card is in use.", "Todas as cartas-resumo estão em uso.")
      : t(`Put the other ${facts.summariesLeft} summary cards back in the box.`, `Devolva as outras ${facts.summariesLeft} cartas-resumo à caixa.`);
    return [
      t(`Give 1 summary card to each of the ${facts.players} players. It is a reference copy of the actions in this guide, not a secret.`, `Dê 1 carta-resumo a cada um dos ${facts.players} jogadores. Ela é uma cópia de consulta das ações deste guia, não um segredo.`),
      unused,
      t("Read the actions and the characters before the first turn.", "Leia as ações e os personagens antes do primeiro turno.")
    ];
  }

  function setupSection() {
    const facts = matchFacts();
    const cardTitle = facts.variant
      ? t("Deal the two-player variant", "Distribua a variante para dois")
      : t("Deal the Court", "Distribua a Corte");
    const rows = [
      checkRow("first-player", t("Name the starting player", "Nomeie o jogador inicial"), [
        t("The person who won the last game is the starting player, and play will go clockwise from them.", "Quem venceu a última partida é o jogador inicial, e o jogo segue em sentido horário a partir dessa pessoa."),
        t("The booklet does not say who starts a table's first game. Agree on that person before giving out coins: with 2 players, that person is the one who receives 1 coin.", "O livreto não diz quem começa a primeira partida de uma mesa. Combinem essa pessoa antes de distribuir as moedas: com 2 jogadores, é ela quem recebe 1 moeda.")
      ]),
      checkRow("cards", cardTitle, cardLines()),
      checkRow("coins", t("Split the coins", "Divida as moedas"), coinLines()),
      checkRow("summaries", t("Hand out the summary cards", "Entregue as cartas-resumo"), summaryLines())
    ];
    const ids = ["first-player", "cards", "coins", "summaries"];
    const kept = state.setupChecks.filter((id) => ids.includes(id));
    if (kept.length !== state.setupChecks.length) {
      state.setupChecks = kept;
      saveState();
    }
    const done = ids.filter((id) => state.setupChecks.includes(id)).length;
    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), "02", [1, 7])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Set up this match", "Prepare esta partida")}</h3>
            <p>${t("Check each physical step as it is done. A step is done only when every line under it is done. Progress is saved for this game only.", "Marque cada passo físico conforme for feito. Um passo só está feito quando todas as linhas abaixo dele estiverem feitas. O progresso fica salvo só neste jogo.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${ids.length} steps checked`, `${done} de ${ids.length} etapas concluídas`)}</span>
            <progress id="setup-progress" max="${ids.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Changing the number of players, or the two-player variant, clears this checklist. “Uncheck all” clears only these boxes. Changing language does not.",
          "Mudar o número de jogadores, ou a variante para dois, limpa esta lista. “Desmarcar tudo” limpa só estas caixas. Trocar o idioma não limpa."
        )}</p>
      </div>
      <div class="setup-phases">
        <article class="setup-phase">
          <header class="setup-phase-header">
            <span class="setup-phase-number">01</span>
            <h3>${t("Table", "Mesa")}</h3>
            <div class="setup-phase-references">${referenceLink(1)}${facts.players === 2 ? referenceLink(7) : ""}</div>
          </header>
          <ul class="setup-check-list">${rows.join("")}</ul>
        </article>
      </div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      <div class="quick-grid">
        <article class="info-card"><span class="component-label">${t("CARDS", "CARTAS")}</span><h3>${t("15 character cards", "15 cartas de personagem")}</h3><p>${facts.variant
          ? t("3 of each character. This match discards 8 unseen and leaves a Court of 3. Each player holds 2 face-down cards.", "3 de cada personagem. Esta partida descarta 8 sem mostrá-las e deixa uma Corte de 3. Cada jogador tem 2 cartas viradas para baixo.")
          : t(`3 of each character. This match deals ${facts.players * 2} and leaves a Court of ${facts.court}. Each player holds 2 face-down cards.`, `3 de cada personagem. Esta partida distribui ${facts.players * 2} e deixa uma Corte de ${facts.court}. Cada jogador tem 2 cartas viradas para baixo.`)}</p></article>
        <article class="info-card"><span class="component-label">${t("COINS", "MOEDAS")}</span><h3>${t("50 coins", "50 moedas")}</h3><p>${t(`Visible piles in front of the players, ${facts.coinsOut} coins in all, and a Treasury of ${facts.treasury}. Coins are never given or lent from one player to another except by Steal.`, `Pilhas visíveis na frente dos jogadores, ${facts.coinsOut} moedas no total, e um Tesouro de ${facts.treasury}. Moedas nunca são dadas nem emprestadas de um jogador a outro, exceto por Roubar.`)}</p></article>
        <article class="info-card"><span class="component-label">${t("REFERENCE", "CONSULTA")}</span><h3>${t("6 summary cards", "6 cartas-resumo")}</h3><p>${facts.summariesLeft === 0
          ? t(`All ${facts.players} are handed out, one to each player. The actions printed on them are the actions in the next section.`, `Todas as ${facts.players} são entregues, uma a cada jogador. As ações impressas nelas são as ações da próxima seção.`)
          : t(`${facts.players} are handed out, one to each player. ${facts.summariesLeft} stay in the box. The actions printed on them are the actions in the next section.`, `${facts.players} são entregues, uma a cada jogador. ${facts.summariesLeft} ficam na caixa. As ações impressas nelas são as ações da próxima seção.`)}</p></article>
      </div>`;
  }

  function characterCards() {
    return CHARACTERS.map((character) => `
      <article class="icon-card">
        <span class="manual-icon-frame" aria-hidden="true"><img class="manual-icon" src="${icon(character.file)}" alt=""></span>
        <div>
          <strong>${t(character.en, character.pt)}</strong>
          <p>${t(character.actionEn, character.actionPt)}</p>
          <p>${t(character.blockEn, character.blockPt)}</p>
        </div>
      </article>`).join("");
  }

  function actionsSection() {
    return `
      ${sectionHeading("actions", t("Actions", "Ações"), "03", [3, 4])}
      <div class="turn-block"><h3>${t("One action, then a pause", "Uma ação, depois uma pausa")}</h3>
        ${lineList([
          t("Players take turns clockwise, starting with the player named during Setup.", "Os jogadores jogam em sentido horário, começando por quem foi nomeado na Preparação."),
          t("On your turn choose exactly one action you can afford. You may not pass.", "No seu turno escolha exatamente uma ação que consiga pagar. Você não pode passar."),
          t("If you start your turn with 10 or more coins, you must launch a Coup as your only action.", "Se você começa o turno com 10 ou mais moedas, tem de lançar um Golpe como única ação."),
          t("Announce the action. For a character action, claim the required character (truth or bluff). Show a card only if challenged. Pay coin costs as you announce.", "Anuncie a ação. Em ação de personagem, declare o personagem exigido (verdade ou blefe). Mostre carta só se for desafiado. Pague custos em moedas ao anunciar."),
          t("Then stop. Others may challenge or block before the action or block resolves. Challenges cannot be added retroactively.", "Depois pare. Outros podem desafiar ou bloquear antes da ação ou do bloqueio resolver. Desafios não podem ser acrescentados depois.")
        ])}
      </div>
      <div class="turn-block"><h3>${t("General actions", "Ações gerais")}</h3>
        <p>${t("These three actions are always available. They do not ask you to claim a character, so they cannot be challenged.", "Estas três ações estão sempre disponíveis. Elas não pedem que você declare um personagem, então não podem ser desafiadas.")}</p>
        <div class="content-grid">
          <article class="action-card"><strong>${t("Income", "Renda")}</strong><p>${t("Take 1 coin from the Treasury. Nobody can block Income.", "Pegue 1 moeda do Tesouro. Ninguém pode bloquear a Renda.")}</p></article>
          <article class="action-card"><strong>${t("Foreign Aid", "Ajuda externa")}</strong><p>${t("Take 2 coins from the Treasury, unless another player claims the Duke and blocks it. If the block succeeds, you receive no coins.", "Pegue 2 moedas do Tesouro, a menos que outro jogador declare o Duque e bloqueie. Se o bloqueio tiver sucesso, você não recebe moeda nenhuma.")}</p></article>
          <article class="action-card"><strong>${t("Coup", "Golpe")}</strong>${lineList([
            t("Pay 7 coins to the Treasury and choose another player who still has influence; that player immediately loses one influence.", "Pague 7 moedas ao Tesouro e escolha outro jogador que ainda tenha influência; esse jogador perde uma influência imediatamente."),
            t("A Coup always succeeds. It cannot be blocked or challenged.", "Um Golpe sempre tem sucesso. Não pode ser bloqueado nem desafiado."),
            t("You need 7 coins to choose it, and must choose it when you start the turn with 10 or more.", "Você precisa de 7 moedas para escolhê-lo, e é obrigado quando começa o turno com 10 ou mais.")
          ])}</article>
        </div>
      </div>
      <div class="turn-block"><h3>${t("Character actions and blocks", "Ações de personagem e bloqueios")}</h3>
        ${lineList([
          t("A character action requires you to claim that character. A block works the same way.", "Uma ação de personagem exige que você declare esse personagem. Um bloqueio funciona do mesmo jeito."),
          t("Whoever blocks may be bluffing and shows a card only if challenged. An unchallenged claim succeeds.", "Quem bloqueia pode estar blefando e só mostra carta se for desafiado. Uma declaração não desafiada tem sucesso."),
          t("There are 3 copies of each character, so two face-down cards can match.", "Há 3 cópias de cada personagem, então duas cartas viradas para baixo podem coincidir."),
          t("A face-up card no longer gives influence and cannot prove a claim.", "Uma carta virada para cima não dá mais influência e não prova uma declaração.")
        ])}
        <div class="icon-grid">${characterCards()}</div>
        <p class="coup-note">${t("<strong>Steal against an empty purse.</strong> The booklet only says that a player with 1 coin loses that 1 coin. This guide reads a player with 0 coins as losing nothing: the Steal still resolves, and it can still be challenged or blocked. That empty-purse case is an interpretation.", "<strong>Roubar de quem não tem moedas.</strong> O livreto só diz que um jogador com 1 moeda perde essa 1 moeda. Este guia lê um jogador com 0 moedas como alguém que não perde nada: o Roubar ainda se resolve, e ainda pode ser desafiado ou bloqueado. Esse caso da bolsa vazia é uma interpretação.")}</p>
        <p class="coup-note">${t("<strong>Ambassador with one face-down card.</strong> The booklet says to draw 2 cards and then return 2 cards. With 2 face-down cards you briefly hold 4 and put 2 back. This guide uses the same “return 2” sentence when you have only 1 face-down card: you briefly hold 3 and put 2 back, so you finish with the same one face-down card. The booklet does not walk through that case. It is an interpretation. Look at the drawn cards yourself. The booklet does not say to show them, and this guide keeps the whole exchange private, including the cards you put back.", "<strong>Embaixador com uma carta virada para baixo.</strong> O livreto manda comprar 2 cartas e depois devolver 2 cartas. Com 2 cartas viradas para baixo você segura 4 por um momento e devolve 2. Este guia usa a mesma frase “devolva 2” quando você tem só 1 carta virada para baixo: você segura 3 por um momento e devolve 2, então termina com a mesma carta virada para baixo. O livreto não percorre esse caso. É uma interpretação. Olhe as cartas compradas você mesmo. O livreto não manda mostrá-las, e este guia mantém a troca inteira em segredo, inclusive as cartas que você devolve.")}</p>
        <p class="coup-note">${t("<strong>A short Treasury.</strong> The booklet always tells you to take the printed number of coins and never describes a Treasury that cannot pay. If the Treasury has fewer coins than the action asks, this guide gives you what is left and the action still resolves. That is an interpretation.", "<strong>Um Tesouro curto.</strong> O livreto sempre manda pegar o número impresso de moedas e nunca descreve um Tesouro que não possa pagar. Se o Tesouro tiver menos moedas do que a ação pede, este guia entrega o que restar e a ação ainda se resolve. Isso é uma interpretação.")}</p>
      </div>`;
  }

  function challengesSection() {
    return `
      ${sectionHeading("challenges", t("Challenges", "Desafios"), "04", [2, 4, 5])}
      <div class="turn-block"><h3>${t("Who may challenge", "Quem pode desafiar")}</h3>
        <p>${t("Any action or block that uses a character claim can be challenged. Any other player may issue that challenge, even a player who is not the target. The player who was blocked may challenge the block, as the worked example does. Give everyone the chance before play continues. A challenge cannot be added once the action has gone ahead.", "Qualquer ação ou bloqueio que use uma declaração de personagem pode ser desafiado. Qualquer outro jogador pode fazer esse desafio, mesmo quem não é o alvo. Quem foi bloqueado pode desafiar o bloqueio, como no exemplo jogado. Dê a chance a todos antes de o jogo continuar. Um desafio não pode ser acrescentado depois que a ação já seguiu.")}</p>
        <p class="coup-note">${t("<strong>Two players challenge the same claim.</strong> The booklet says any other player may challenge, and it does not say what happens when two of them speak at once. This guide resolves the first challenge that was declared and does not queue a second one against that same claim. That is an interpretation.", "<strong>Dois jogadores desafiam a mesma declaração.</strong> O livreto diz que qualquer outro jogador pode desafiar, e não diz o que acontece quando dois falam ao mesmo tempo. Este guia resolve o primeiro desafio que foi declarado e não enfileira um segundo contra a mesma declaração. Isso é uma interpretação.")}</p>
      </div>
      <div class="turn-block"><h3>${t("How a challenge ends", "Como um desafio termina")}</h3>
        <p>${t("The challenged player must prove the claim by showing that the required character is one of their face-down cards. If they cannot, or if they do not want to, they lose the challenge. If they can, the challenger loses.", "O jogador desafiado tem de provar a declaração mostrando que o personagem exigido é uma das suas cartas viradas para baixo. Se não puder, ou se não quiser, perde o desafio. Se puder, quem desafiou perde.")}</p>
        <p>${t("Whoever loses the challenge immediately loses one influence. That player chooses which of their own face-down cards to turn face up. The revealed card stays in front of them, visible, and no longer gives influence.", "Quem perde o desafio perde uma influência imediatamente. Esse jogador escolhe qual das próprias cartas viradas para baixo vira para cima. A carta revelada fica à sua frente, visível, e não dá mais influência.")}</p>
        <p>${t("A player who wins by showing the card does not lose an influence. First return that shown card to the Court deck, shuffle the Court deck, and draw one random replacement, face down. The other players do not learn the new card. Only then is the action or the block carried out.", "Quem vence ao mostrar a carta não perde influência. Primeiro devolva essa carta mostrada ao baralho da Corte, embaralhe o baralho da Corte e compre uma carta substituta aleatória, virada para baixo. Os outros jogadores não ficam sabendo qual é a carta nova. Só então a ação ou o bloqueio é executado.")}</p>
      </div>
      <div class="turn-block"><h3>${t("What happens to the action", "O que acontece com a ação")}</h3>
        <ol class="coup-steps">
          <li>${t("Resolve a challenge against the action before any block. If the action's claim fails, the entire action fails, coins the actor paid come back from the Treasury, and the block is ignored.", "Resolva um desafio contra a ação antes de qualquer bloqueio. Se a declaração da ação falha, a ação inteira falha, as moedas que o jogador pagou voltam do Tesouro, e o bloqueio é ignorado.")}</li>
          <li>${t("If the action has no claim, or its claim was proven or left unchallenged, resolve the block next. An unchallenged block succeeds. A block whose claim is proven also succeeds, after that player swaps the shown card. A successful block cancels the action. Coins the actor already paid stay spent: an Assassin's 3 coins do not come back.", "Se a ação não tem declaração, ou a declaração foi provada ou ninguém a desafiou, resolva o bloqueio em seguida. Um bloqueio não desafiado tem sucesso. Um bloqueio cuja declaração é provada também tem sucesso, depois que esse jogador troca a carta mostrada. Um bloqueio bem-sucedido cancela a ação. As moedas que o jogador já pagou continuam gastas: as 3 moedas de um Assassino não voltam.")}</li>
          <li>${t("If the block's claim fails its challenge, the block does not happen and the action is carried out. The player who lost that challenge has already lost one influence.", "Se a declaração do bloqueio falha no desafio, o bloqueio não acontece e a ação é executada. Quem perdeu esse desafio já perdeu uma influência.")}</li>
          <li>${t("If nobody challenges and nobody blocks, the action succeeds.", "Se ninguém desafia e ninguém bloqueia, a ação tem sucesso.")}</li>
        </ol>
        <p class="coup-note">${t("<strong>One block is resolved.</strong> The booklet does not describe a second player blocking after the first block loses its challenge. This guide treats the action as successful in that case. If two players declare a block together, resolve the first block declared and do not queue the other. Both sentences are interpretations.", "<strong>Um bloqueio é resolvido.</strong> O livreto não descreve um segundo jogador bloqueando depois que o primeiro bloqueio perde o desafio. Este guia trata a ação como bem-sucedida nesse caso. Se dois jogadores declaram um bloqueio juntos, resolva o primeiro bloqueio declarado e não enfileire o outro. As duas frases são interpretações.")}</p>
        <div class="callout">${lineList([
          t("<strong>Double danger of an assassination.</strong> You can lose 2 influence in one turn if you fail to stop an Assassin.", "<strong>Perigo duplo de um assassinato.</strong> Você pode perder 2 influências num turno se não conseguir parar um Assassino."),
          t("Losing a challenge to the Assassin costs 1 influence, then the assassination costs another.", "Perder o desafio ao Assassino custa 1 influência; depois o assassinato custa outra."),
          t("Losing a challenged Contessa block costs 1 influence, then the assassination costs another.", "Perder um bloqueio da Condessa desafiado custa 1 influência; depois o assassinato custa outra."),
          t("You may challenge the Assassin, claim the Contessa, or both: resolve the challenge to the action first; the Contessa block only applies if the Assassin's claim still stands.", "Você pode desafiar o Assassino, declarar a Condessa, ou os dois: resolva primeiro o desafio à ação; o bloqueio da Condessa só vale se a declaração do Assassino continuar de pé.")
        ])}</div>
      </div>`;
  }

  function exampleCard(number, titleEn, titlePt, bodyEn, bodyPt) {
    return `
      <article class="example-card">
        <span class="card-number">${number}</span>
        <h3>${t(titleEn, titlePt)}</h3>
        <p>${t(bodyEn, bodyPt)}</p>
        <div class="example-source"><span>${t("Worked example from the booklet", "Exemplo do livreto")}</span>${referenceLink(5)} ${referenceLink(6)}</div>
      </article>`;
  }

  function exampleSection() {
    return `
      ${sectionHeading("example", t("Worked example", "Exemplo jogado"), "05", [5, 6])}
      <p class="glossary-intro">${t(
        "Three players. Each starts with 2 influence cards and 2 coins. The other 9 character cards are the Court deck. The booklet follows Natasha, Sacha and Haig through their opening turns.",
        "Três jogadores. Cada um começa com 2 cartas de influência e 2 moedas. As outras 9 cartas de personagem são o baralho da Corte. O livreto acompanha Natasha, Sacha e Haig nos turnos de abertura."
      )}</p>
      <div class="example-grid">
        ${exampleCard("01", "An unchallenged Duke, then a bluffed Ambassador", "Um Duque sem desafio, depois um Embaixador blefado",
          "Natasha was dealt the Contessa and the Duke. She claims the Duke and takes 3 coins. Nobody challenges. She has 5 coins. Sacha has the Captain and the Contessa, but he claims the Ambassador. Nobody challenges, so he draws two Court cards: an Assassin and a Duke. He keeps the Assassin and his original Captain, and returns the Duke and the Contessa to the Court. He still has 2 coins.",
          "Natasha recebeu a Condessa e o Duque. Ela declara o Duque e pega 3 moedas. Ninguém desafia. Ela tem 5 moedas. Sacha tem o Capitão e a Condessa, mas declara o Embaixador. Ninguém desafia, então ele compra duas cartas da Corte: um Assassino e um Duque. Ele fica com o Assassino e o seu Capitão original, e devolve o Duque e a Condessa à Corte. Ele continua com 2 moedas.")}
        ${exampleCard("02", "A challenge the Duke survives", "Um desafio de que o Duque escapa",
          "Haig was dealt an Assassin and a Duke. He claims the Duke and takes 3 coins. Sacha challenges. Haig shows a Duke and wins. He keeps the 3 coins, returns that Duke to the Court, shuffles, and draws a Contessa. Sacha lost the challenge and must lose an influence. He chooses his Assassin, turns it face up, and leaves it in front of him. Haig now has the Assassin and the new Contessa, both face down, and 5 coins.",
          "Haig recebeu um Assassino e um Duque. Ele declara o Duque e pega 3 moedas. Sacha desafia. Haig mostra um Duque e vence. Ele fica com as 3 moedas, devolve esse Duque à Corte, embaralha e compra uma Condessa. Sacha perdeu o desafio e tem de perder uma influência. Ele escolhe o seu Assassino, vira a carta para cima e a deixa à sua frente. Haig agora tem o Assassino e a nova Condessa, ambas viradas para baixo, e 5 moedas.")}
        ${exampleCard("03", "Income, then a Contessa block", "Renda, depois um bloqueio da Condessa",
          "Natasha claims the Duke again, takes 3 coins and is not challenged. She has 8. Sacha takes Income for 1 coin. Income needs no character, and nobody can block it. He has 3. Haig claims the Assassin, pays 3 coins and aims at Natasha. Nobody challenges the Assassin. Natasha claims the Contessa. Nobody challenges her, so the assassination fails. The 3 coins stay spent, and Haig has 2.",
          "Natasha declara o Duque de novo, pega 3 moedas e não é desafiada. Ela tem 8. Sacha pega a Renda de 1 moeda. A Renda não precisa de personagem, e ninguém pode bloqueá-la. Ele tem 3. Haig declara o Assassino, paga 3 moedas e mira Natasha. Ninguém desafia o Assassino. Natasha declara a Condessa. Ninguém a desafia, então o assassinato falha. As 3 moedas continuam gastas, e Haig tem 2.")}
        ${exampleCard("04", "A Coup, then a block that fails", "Um Golpe, depois um bloqueio que falha",
          "Natasha pays 7 coins and Coups Haig. A Coup cannot be blocked. Haig loses an influence and chooses to turn over his Contessa. Natasha has 1 coin left. Sacha claims the Captain and steals from Haig. Nobody challenges the Captain. Haig claims the Ambassador to block. Sacha challenges that block. Haig cannot show an Ambassador, so he loses his last influence and turns over his Assassin. The steal still succeeds: Sacha takes 2 coins from Haig and now has 5. Haig is out. Two Assassins and one Contessa are face up on the table. Natasha still has the Contessa and the Duke, and 1 coin. Sacha still has the Captain.",
          "Natasha paga 7 moedas e dá um Golpe em Haig. Um Golpe não pode ser bloqueado. Haig perde uma influência e escolhe virar a sua Condessa. Natasha fica com 1 moeda. Sacha declara o Capitão e rouba Haig. Ninguém desafia o Capitão. Haig declara o Embaixador para bloquear. Sacha desafia esse bloqueio. Haig não consegue mostrar um Embaixador, então perde a última influência e vira o seu Assassino. O roubo ainda tem sucesso: Sacha pega 2 moedas de Haig e agora tem 5. Haig está fora. Dois Assassinos e uma Condessa estão virados para cima na mesa. Natasha ainda tem a Condessa e o Duque, e 1 moeda. Sacha ainda tem o Capitão.")}
      </div>
      <p class="coup-note">${t(
        "<strong>Coins of a player eliminated by the challenge.</strong> In this example the failed Ambassador block exiles Haig, and the Captain still receives Haig's 2 coins. This guide follows that result: take the stolen coins first, then return any coins the exiled player still holds to the Treasury. Here nothing is left to return. The booklet shows the outcome and does not spell this order out. It is an interpretation.",
        "<strong>Moedas de um jogador eliminado pelo desafio.</strong> Neste exemplo o bloqueio fracassado do Embaixador exila Haig, e o Capitão ainda recebe as 2 moedas de Haig. Este guia segue esse resultado: pegue as moedas roubadas primeiro, e depois devolva ao Tesouro qualquer moeda que o jogador exilado ainda tenha. Aqui não sobra nada para devolver. O livreto mostra o desfecho e não detalha essa ordem. É uma interpretação."
      )}</p>`;
  }

  function endingSection() {
    return `
      ${sectionHeading("ending", t("Exile and winning", "Exílio e vitória"), "06", [2, 7])}
      <div class="turn-block"><h3>${t("Losing influence", "Perdendo influência")}</h3>
        <p>${t("Face-down cards are the characters you influence, and they are what let you claim those characters. Each time you lose an influence, you choose which of your own face-down cards to turn over. You always make that choice yourself. The revealed card stays face up in front of you, where everyone can see it, and it no longer provides influence.", "As cartas viradas para baixo são os personagens que você influencia, e são elas que permitem declarar esses personagens. Cada vez que você perde uma influência, escolhe qual das suas próprias cartas viradas para baixo virar. Essa escolha é sempre sua. A carta revelada fica virada para cima à sua frente, onde todos a veem, e não fornece mais influência.")}</p>
        <p>${t("When both of your cards are face up, you are exiled at once and out of the game. Leave the cards face up. Return every coin you still have to the Treasury. You take no more turns, and you are not a legal target. Play continues clockwise among the players who still have a face-down card.", "Quando as suas duas cartas estão viradas para cima, você é exilado na hora e sai do jogo. Deixe as cartas viradas para cima. Devolva ao Tesouro cada moeda que você ainda tenha. Você não joga mais turnos, e não é um alvo válido. O jogo continua em sentido horário entre os jogadores que ainda têm uma carta virada para baixo.")}</p>
      </div>
      <div class="turn-block"><h3>${t("Trust", "Confiança")}</h3>
        <p>${t("Any negotiation is allowed, and none of it is binding. You are not allowed to reveal your cards to the other players, except for the card a challenge forces you to show and the card you turn up when you lose an influence. No coins can be given or lent. Steal is the only way a coin moves from one player to another.", "Qualquer negociação é permitida, e nenhuma delas é obrigatória. Você não pode revelar suas cartas aos outros jogadores, exceto a carta que um desafio obriga você a mostrar e a carta que você vira quando perde uma influência. Nenhuma moeda pode ser dada ou emprestada. Roubar é o único jeito de uma moeda passar de um jogador para outro.")}</p>
      </div>
      <div class="turn-block"><h3>${t("The last player", "O último jogador")}</h3>
        <p>${t("The game ends as soon as only one player still has influence. That player wins. There is no second place. The goal is to eliminate every other player's influence and be the last one left.", "A partida termina assim que só um jogador ainda tem influência. Esse jogador vence. Não há segundo lugar. O objetivo é eliminar a influência de todos os outros jogadores e ser o último que resta.")}</p>
      </div>`;
  }

  function glossarySection() {
    const terms = [
      ["Influence", "Influência", "A face-down character card in front of you. You start with 2. A face-up card is no longer influence.", "Uma carta de personagem virada para baixo à sua frente. Você começa com 2. Uma carta virada para cima não é mais influência.", [2]],
      ["Court deck", "Baralho da Corte", "The face-down pile of character cards in the middle. Proven challenges are shuffled back into it. An Ambassador exchange returns 2 cards to it without a shuffle.", "A pilha de cartas de personagem virada para baixo no meio. Desafios provados são embaralhados de volta nela. Uma troca do Embaixador devolve 2 cartas a ela sem embaralhar.", [1, 4, 5]],
      ["Treasury", "Tesouro", "The coins in the middle that were not dealt. Income, Foreign Aid and Tax take coins from it. Coup and Assassinate pay coins to it. An exiled player returns their remaining coins to it.", "As moedas do meio que não foram distribuídas. Renda, Ajuda externa e Taxar pegam moedas dele. Golpe e Assassinar pagam moedas a ele. Um jogador exilado devolve a ele as moedas que ainda tem.", [1, 2]],
      ["Claim", "Declaração", "Saying that a required character is one of your face-down cards. It may be true or a bluff. It stands unless challenged.", "Dizer que um personagem exigido é uma das suas cartas viradas para baixo. Pode ser verdade ou blefe. Ela vale a menos que seja desafiada.", [3, 5]],
      ["Challenge", "Desafio", "A demand that a player show the claimed character. The loser turns over one of their own face-down cards. A proven card is shuffled back into the Court and replaced.", "Uma exigência de que um jogador mostre o personagem declarado. Quem perde vira uma das próprias cartas viradas para baixo. Uma carta provada volta embaralhada à Corte e é substituída.", [5]],
      ["Counteraction", "Contramedida", "A block. Duke blocks Foreign Aid, Contessa blocks Assassination, and Ambassador or Captain blocks Steal. A successful block spends the actor's coins for nothing.", "Um bloqueio. O Duque bloqueia Ajuda externa, a Condessa bloqueia Assassinato, e o Embaixador ou o Capitão bloqueiam Roubar. Um bloqueio bem-sucedido gasta as moedas do jogador à toa.", [4]],
      ["Exile", "Exílio", "Both of your cards are face up. You are out of the game immediately, your cards stay on the table, and your remaining coins return to the Treasury.", "As suas duas cartas estão viradas para cima. Você sai do jogo imediatamente, suas cartas ficam na mesa, e as moedas que ainda tem voltam ao Tesouro.", [2]]
    ];
    const rows = terms.map(([en, pt, enBody, ptBody, pages]) => `
      <article class="info-card"><h3>${t(en, pt)}</h3><p>${t(enBody, ptBody)}</p><div class="glossary-references">${pages.map((page) => referenceLink(page)).join(" ")}</div></article>`).join("");
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), "07", [2])}
      <p class="glossary-intro">${t(
        "Short meanings for the words used above. Passages marked as an interpretation are this guide's reading where the booklet is silent: the empty Steal, the Ambassador with one card, a short Treasury, the first of two challenges, a second block, and the coins of a player a Steal eliminates.",
        "Significados curtos das palavras usadas acima. Os trechos marcados como interpretação são a leitura deste guia onde o livreto se cala: o Roubar sem moedas, o Embaixador com uma carta, um Tesouro curto, o primeiro de dois desafios, um segundo bloqueio, e as moedas de um jogador que um Roubar elimina."
      )}</p>
      <div class="quick-grid">${rows}</div>`;
  }

  function renderHeader() {
    return `
      <header class="site-header">
        <a class="brand" href="#/" aria-label="${t("Field Manual home", "Página inicial do Manual de Campo")}">
          <span class="brand-mark" aria-hidden="true">CP</span>
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

  function renderInto(app) {
    root = app;
    document.body.classList.add("theme-coup");
    document.documentElement.lang = state.language;
    document.title = t("Coup — Field Manual", "Coup — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Interactive rules for Coup, the bluffing game of influence for 2–6 players. Choose the table size and, for two players, the printed variant before setup.",
        "Regras interativas de Coup, o jogo de blefe e influência para 2 a 6 jogadores. Escolha o tamanho da mesa e, para dois jogadores, a variante impressa antes da preparação."
      );
    }
    const nav = [
      ["quick-reference", t("Quick Ref", "Referência")],
      ["setup", t("Setup", "Preparação")],
      ["actions", t("Actions", "Ações")],
      ["challenges", t("Challenges", "Desafios")],
      ["example", t("Example", "Exemplo")],
      ["ending", t("Exile & winning", "Exílio e vitória")],
      ["glossary", t("Glossary", "Glossário")]
    ];
    app.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook · core booklet", "Livro interativo · livreto base")}</p>
          <h1>Coup</h1>
          <p class="hero-intro">${t(
            "You are a government official in a court run by multinational CEOs. Bluff, bribe and eliminate the influence of every rival until only one player is left. This guide follows the 8-page core booklet. It does not add the Reformation expansion advertised on the back page.",
            "Você é uma autoridade num governo comandado por CEOs multinacionais. Blefe, suborne e elimine a influência de cada rival até sobrar um jogador. Este guia segue o livreto base de 8 páginas. Ele não acrescenta a expansão Reformation anunciada na última página."
          )}</p>
          <div class="hero-meta"><span>${t("2–6 players", "2 a 6 jogadores")}</span><span>${t("Bluffing", "Blefe")}</span><span>${t("Last player standing", "Último jogador de pé")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/coup.webp" alt="${t("First page of the Coup rulebook", "Primeira página do manual de Coup")}" fetchpriority="high"><figcaption>${t("Rulebook, first page", "Manual, primeira página")} · Rikki Tahta, La Mame Games</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("Field guide", "Guia de campo")}</h2>
          ${nav.map(([id, label], index) => `<button type="button" data-scroll="${id}"><span class="toc-index">${String(index + 1).padStart(2, "0")}</span>${label}</button>`).join("")}
        </aside>
        <div class="content-column">
          ${storageNotice ? `<p class="storage-notice" role="status">${storageNoticeText()}</p>` : ""}
          ${matchPanel()}
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${actionsSection()}</section>
          <section class="rule-section">${challengesSection()}</section>
          <section class="rule-section">${exampleSection()}</section>
          <section class="rule-section">${endingSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal guide for Coup. Summaries follow the core booklet, whose PDF is included in this repository with permission. Illustration by Jarek Nocoń, graphic design by Luis Francisco.",
        "Guia pessoal de Coup. Os resumos seguem o livreto base, cujo PDF está incluído neste repositório com autorização. Ilustração de Jarek Nocoń, design gráfico de Luis Francisco."
      )}</p></footer>`;
  }

  function onClick(event) {
    const button = event.target.closest("button");
    if (!button || !root || !root.contains(button)) {
      return;
    }
    if (button.dataset.language) {
      state.language = button.dataset.language === "en-US" ? "en-US" : "pt-BR";
      saveState();
      renderInto(root);
      return;
    }
    if (button.hasAttribute("data-setup-reset")) {
      state.setupChecks = [];
      saveState();
      renderInto(root);
      return;
    }
    if (button.dataset.scroll) {
      document.getElementById(button.dataset.scroll)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !root || !root.contains(target)) {
      return;
    }
    if (target instanceof HTMLInputElement && target.matches("[data-setup-check]")) {
      const id = target.dataset.setupCheck;
      const checked = new Set(state.setupChecks);
      if (target.checked) {
        checked.add(id);
      } else {
        checked.delete(id);
      }
      state.setupChecks = [...checked];
      saveState();
      const ids = ["first-player", "cards", "coins", "summaries"];
      const done = ids.filter((item) => state.setupChecks.includes(item)).length;
      const progress = root.querySelector("#setup-progress");
      const label = root.querySelector("#setup-progress-label");
      if (progress) {
        progress.value = done;
      }
      if (label) {
        label.textContent = t(`${done} of ${ids.length} steps checked`, `${done} de ${ids.length} etapas concluídas`);
      }
      return;
    }
    if (target instanceof HTMLInputElement && target.matches("[data-players]")) {
      const value = Number.parseInt(target.value, 10);
      commit(() => {
        if (value === 2 || value === 3 || value === 4 || value === 5 || value === 6) {
          state.players = value;
        }
      }, target.id);
      return;
    }
    if (target instanceof HTMLInputElement && target.matches("[data-variant]")) {
      commit(() => {
        state.twoPlayerVariant = target.value === "yes";
      }, target.id);
    }
  }

  window.Coup = { renderInto, onClick, onChange };
})();
