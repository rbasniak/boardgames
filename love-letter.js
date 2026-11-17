(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.love-letter.v1";
  const SETUP_KEY = "field-manual.love-letter.setup.v1";
  // The supplied PDF keeps its original file name (with an "s"); the guide slug is love-letter.
  const MANUAL_FILE = "love-letters_core.pdf";
  const ICONS = "assets/love-letter/icons/";
  const ART = "assets/love-letter/art/";
  // Printed page numbers match the PDF page numbers (the cover is page 1).
  const PDF_OFFSET = 0;

  const PLAYER_COUNTS = ["2", "3", "4", "5", "6", "7", "8"];
  // Tokens of Affection needed to win — rulebook p. 6 (2–4) and p. 7 (5–8).
  const TARGET = { 2: 7, 3: 5, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4 };
  // Setup steps that are repeated every round; "Next round" clears only these.
  const ROUND_STEPS = ["shuffle", "deal", "first"];
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

  function signature(source = state) {
    return String(source.players);
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Love Letter preferences.", error);
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
      console.error("Could not read Love Letter setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Love Letter preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Love Letter setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function players() {
    return Number(state.players);
  }

  function isLarge() {
    return players() >= 5;
  }

  function isTwo() {
    return players() === 2;
  }

  function target() {
    return TARGET[players()];
  }

  function deckSize() {
    return isLarge() ? 32 : 16;
  }

  function manualUrl(page) {
    const script = document.querySelector('script[src*="love-letter.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${MANUAL_FILE}`, baseUrl).href}#page=${page + PDF_OFFSET}`;
  }

  function referenceLink(page) {
    return `<a class="source-link" href="${manualUrl(page)}" target="_blank" rel="noreferrer">${t(`Rulebook p. ${page} ↗`, `Manual p. ${page} ↗`)}</a>`;
  }

  function sectionHeading(id, title, index, pages) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("ROYAL COURT", "CORTE REAL")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="ll-section-references">${pages.map(referenceLink).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
  }

  function iconCard(file, titleEn, bodyEn, titlePt, bodyPt, page) {
    const title = t(titleEn, titlePt);
    return `
      <article class="icon-card">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}.webp" alt="${title}"></span>
        <div><strong>${title}</strong><p>${t(bodyEn, bodyPt)}</p>${referenceLink(page)}</div>
      </article>`;
  }

  function infoCard(label, title, lines, page) {
    const pages = Array.isArray(page) ? page : [page];
    return `
      <article class="info-card">
        <span class="component-label">${label}</span>
        <h3>${title}</h3>
        ${lineList(lines)}
        ${pages.map(referenceLink).join(" ")}
      </article>`;
  }

  function interpretation(en, pt) {
    return `<span class="ll-interpretation">${t("Guide's reading", "Leitura do guia")}</span> ${t(en, pt)}`;
  }

  function playersLabel(count = state.players) {
    return t(`${count} players`, `${count} jogadores`);
  }

  // ---------- card data ----------
  // copies: number printed in the rulebook, or null when only the reference card states it.

  const CARDS = [
    {
      id: "bishop", value: 9, premium: true, copies: null, page: 11,
      name: ["Bishop (Vinizio)", "Bishop (Bispo Vinizio)"],
      short: ["Name a number and a player; if right, you gain a Token.", "Diga um número e um jogador; se acertar, você ganha um Marcador."],
      lines: [
        ["Name a number and choose a player. If that player has that number in hand, you gain a Token of Affection.", "Diga um número e escolha um jogador. Se ele tiver esse número na mão, você ganha um Marcador de Afeição."],
        ["If that Token gives you enough to win the game, you win immediately and the game ends.", "Se esse Marcador lhe der o suficiente para vencer, você vence na hora e a partida acaba."],
        ["If you gained the Token, the player you guessed may discard their card (without its effect — unless it is the Princess, which knocks them out) and draw a new one.", "Se você ganhou o Marcador, o jogador adivinhado pode descartar a carta dele (sem efeito — a menos que seja a Princesa, que o elimina) e comprar uma nova."],
        ["End of round: the Princess (8) still beats the Bishop when hands are compared. For every other effect the Bishop is a 9.", "Fim da rodada: a Princesa (8) ainda vence o Bispo na comparação das mãos. Para todos os outros efeitos o Bispo vale 9."]
      ],
      reading: [
        "the rulebook does not limit the number or say “another player”: like the Guard, choose another player still in the round who is not protected; any number (including 1 and 0) may be named. The guessed player says only whether you were right.",
        "o manual não limita o número nem diz “outro jogador”: como no Guarda, escolha outro jogador ainda na rodada e não protegido; qualquer número (inclusive 1 e 0) pode ser dito. O jogador adivinhado só diz se você acertou."
      ]
    },
    {
      id: "princess", value: 8, premium: false, copies: 1, page: 8,
      name: ["Princess (Annette)", "Princess (Princesa Annette)"],
      short: ["If you discard her for any reason, you are out of the round.", "Se você a descartar por qualquer motivo, está fora da rodada."],
      lines: [
        ["If you discard the Princess — no matter how or why — you are immediately knocked out of the round.", "Se você descartar a Princesa — não importa como nem por quê — está eliminado da rodada na hora."],
        ["If a card effect made you discard her (for example a Prince), the rest of that effect does not happen: you do not draw a new card.", "Se um efeito de carta fez você descartá-la (por exemplo um Prince), o resto do efeito não acontece: você não compra carta nova."],
        ["Effects tied to being knocked out still apply (for example the Constable, or a Jester's guess).", "Efeitos ligados a ser eliminado ainda valem (por exemplo o Constable ou o palpite de um Jester).", "large"]
      ]
    },
    {
      id: "countess", value: 7, premium: false, copies: 1, page: 8,
      name: ["Countess (Wilhelmina)", "Countess (Condessa Wilhelmina)"],
      short: ["Must be discarded if your other card is the King or a Prince.", "Deve ser descartada se sua outra carta for o King ou um Prince."],
      lines: [
        ["Her text works while she is in your hand, not when discarded. Discarding her does nothing.", "O texto dela vale enquanto ela está na sua mão, não ao ser descartada. Descartá-la não faz nada."],
        ["If you ever hold the Countess together with the King or a Prince, you must discard the Countess. You do not reveal the other card.", "Se você tiver a Condessa junto com o King ou um Prince, deve descartar a Condessa. Você não revela a outra carta."],
        ["You may also discard her when you hold no royal: a bluff.", "Você também pode descartá-la sem ter um membro da realeza: um blefe."]
      ]
    },
    {
      id: "dowager", value: 7, premium: true, copies: null, page: 11,
      name: ["Dowager Queen (Tummia)", "Dowager Queen (Rainha-Mãe Tummia)"],
      short: ["Secretly compare hands with another player; the HIGHER number is out. Tie: nothing happens.", "Compare mãos em segredo com outro jogador; o número MAIOR sai. Empate: nada acontece."],
      lines: [
        ["Choose another player still in the round. You and that player secretly compare hands.", "Escolha outro jogador ainda na rodada. Vocês dois comparam as mãos em segredo."],
        ["The player with the higher number is knocked out of the round. Tie: nothing happens.", "Quem tiver o número maior é eliminado da rodada. Empate: nada acontece."]
      ]
    },
    {
      id: "king", value: 6, premium: false, copies: 1, page: 9,
      name: ["King (Arnaud IV)", "King (Rei Arnaud IV)"],
      short: ["Trade the card in your hand with another player's.", "Troque a carta da sua mão com a de outro jogador."],
      lines: [
        ["Trade the card in your hand with the card held by another player of your choice.", "Troque a carta da sua mão com a carta de outro jogador à sua escolha."],
        ["You cannot trade with a player who is out of the round (or protected by a Handmaid).", "Você não pode trocar com um jogador fora da rodada (nem protegido pela Handmaid)."]
      ]
    },
    {
      id: "constable", value: 6, premium: true, copies: null, page: 11,
      name: ["Constable (Viktor)", "Constable (Condestável Viktor)"],
      short: ["If you are knocked out with him in your discard pile, gain a Token.", "Se você for eliminado com ele na sua pilha de descarte, ganha um Marcador."],
      lines: [
        ["Discarding him does nothing at that moment.", "Descartá-lo não faz nada naquele momento."],
        ["If you are later knocked out of the round while the Constable is in your discard pile, show it and claim a Token of Affection.", "Se depois você for eliminado da rodada com o Constable na sua pilha de descarte, mostre-o e pegue um Marcador de Afeição."],
        ["If that Token gives you enough to win, you win immediately and the game ends.", "Se esse Marcador lhe der o suficiente para vencer, você vence na hora e a partida acaba."]
      ],
      reading: [
        "the rulebook does not say whether a Constable you were still holding — discarded only because you were knocked out — counts. This guide counts only a Constable that was already in your discard pile before the knock-out; agree on this before playing if your group reads it differently.",
        "o manual não diz se conta um Constable que você ainda tinha na mão — descartado só porque você foi eliminado. Este guia conta apenas um Constable que já estava na pilha de descarte antes da eliminação; combinem antes de jogar se o grupo entender diferente."
      ]
    },
    {
      id: "prince", value: 5, premium: false, copies: 2, page: 9,
      name: ["Prince (Arnaud)", "Prince (Príncipe Arnaud)"],
      short: ["Choose a player (you may choose yourself): they discard their hand and draw a new card.", "Escolha um jogador (pode ser você): ele descarta a mão e compra uma carta nova."],
      lines: [
        ["Choose one player still in the round, including yourself — but not another player protected by a Handmaid.", "Escolha um jogador ainda na rodada, inclusive você — mas não outro jogador protegido pela Handmaid."],
        ["That player discards their hand without applying its effect — except the Princess, which knocks them out — and draws a new card.", "Esse jogador descarta a mão sem aplicar o efeito — exceto a Princesa, que o elimina — e compra uma carta nova."],
        ["If the deck is empty, they take the card removed face down at the start of the round.", "Se o baralho estiver vazio, ele pega a carta retirada virada para baixo no início da rodada."],
        ["If every other player is protected by a Handmaid, you must choose yourself.", "Se todos os outros jogadores estiverem protegidos pela Handmaid, você deve escolher a si mesmo."]
      ]
    },
    {
      id: "count", value: 5, premium: true, copies: 2, page: 12,
      name: ["Count (Guntram)", "Count (Conde Guntram)"],
      short: ["At round end, +1 to your hand's number for each Count in your discard pile.", "No fim da rodada, +1 no número da sua mão por Count na sua pilha de descarte."],
      lines: [
        ["Discarding him does nothing at that moment.", "Descartá-lo não faz nada naquele momento."],
        ["When the round ends and hands must be compared, each Count in your discard pile adds 1 to the number in your hand. Both Counts stack (+2).", "Quando a rodada acaba e as mãos precisam ser comparadas, cada Count na sua pilha de descarte soma 1 ao número da sua mão. Os dois Counts se somam (+2)."],
        ["With +2 a 7 (Countess or Dowager Queen) beats the Princess.", "Com +2 um 7 (Countess ou Dowager Queen) vence a Princesa."],
        ["If the bonus creates a tie for highest, break it normally by the totals of the discard piles.", "Se o bônus criar empate no maior número, desempate normalmente pela soma das pilhas de descarte."]
      ],
      reading: [
        "the bonus is used only for the end-of-round comparison, not for Baron or Dowager Queen comparisons during the round. Apply the Princess-beats-Bishop rule first: a Princess still beats a Bishop whatever the Counts; any other hand raised to 9 ties with a Bishop.",
        "o bônus só vale na comparação do fim da rodada, não nas comparações do Baron ou da Dowager Queen durante a rodada. Aplique primeiro a regra de que a Princesa vence o Bispo: uma Princesa sempre vence um Bispo, com ou sem Counts; qualquer outra mão elevada a 9 empata com um Bispo."
      ]
    },
    {
      id: "handmaid", value: 4, premium: false, copies: 2, page: 9,
      name: ["Handmaid (Susannah)", "Handmaid (Aia Susannah)"],
      short: ["You are immune to other players' cards until the start of your next turn.", "Você fica imune às cartas dos outros jogadores até o início do seu próximo turno."],
      lines: [
        ["Until the start of your next turn you are immune to the effects of other players' cards: nobody can choose you.", "Até o início do seu próximo turno você fica imune aos efeitos das cartas dos outros jogadores: ninguém pode escolher você."],
        ["If every player except the one whose turn it is is protected, that player must choose themself for a card's effect if possible — otherwise the card is discarded without effect.", "Se todos, exceto quem está jogando, estiverem protegidos, esse jogador deve escolher a si mesmo para o efeito se possível — senão a carta é descartada sem efeito."]
      ]
    },
    {
      id: "sycophant", value: 4, premium: true, copies: null, page: 12,
      name: ["Sycophant (Morris)", "Sycophant (Bajulador Morris)"],
      short: ["Choose a player: the next card played that chooses players must include them.", "Escolha um jogador: a próxima carta jogada que escolha jogadores deve incluí-lo."],
      lines: [
        ["Choose a player, including yourself if you wish.", "Escolha um jogador, você mesmo inclusive se quiser."],
        ["As long as the next card played has an effect that chooses one or more players, it must choose at least that player.", "Se a próxima carta jogada tiver um efeito que escolhe um ou mais jogadores, ela deve escolher pelo menos esse jogador."],
        ["If that card cannot choose that player (for example a Guard played by the very player the Sycophant chose), it is discarded without effect.", "Se essa carta não puder escolher esse jogador (por exemplo um Guarda jogado pelo próprio jogador escolhido pelo Sycophant), ela é descartada sem efeito."]
      ],
      reading: [
        "“the next card played” is the next card discarded for its effect by anyone (normally the next player's); a card discarded without effect (Prince, Assassin, knock-outs) does not use it up. A player protected by a Handmaid cannot be chosen by the Sycophant.",
        "“a próxima carta jogada” é a próxima carta descartada para usar o efeito, por qualquer jogador (normalmente o próximo); uma carta descartada sem efeito (Prince, Assassin, eliminações) não o consome. Um jogador protegido pela Handmaid não pode ser escolhido pelo Sycophant."
      ]
    },
    {
      id: "baron", value: 3, premium: false, copies: 2, page: 10,
      name: ["Baron (Talus)", "Baron (Barão Talus)"],
      short: ["Secretly compare hands with another player; the LOWER number is out. Tie: nothing happens.", "Compare mãos em segredo com outro jogador; o número MENOR sai. Empate: nada acontece."],
      lines: [
        ["Choose another player still in the round. You and that player secretly compare hands.", "Escolha outro jogador ainda na rodada. Vocês dois comparam as mãos em segredo."],
        ["The player with the lower number is knocked out of the round. Tie: nothing happens.", "Quem tiver o número menor é eliminado da rodada. Empate: nada acontece."]
      ]
    },
    {
      id: "baroness", value: 3, premium: true, copies: null, page: 12,
      name: ["Baroness (Fiona)", "Baroness (Baronesa Fiona)"],
      short: ["Look at the hands of 1 or 2 other players.", "Olhe as mãos de 1 ou 2 outros jogadores."],
      lines: [
        ["Look at the hands of either 1 or 2 other players.", "Olhe as mãos de 1 ou 2 outros jogadores."],
        ["Do not reveal them to anyone else.", "Não as revele a mais ninguém."]
      ]
    },
    {
      id: "priest", value: 2, premium: false, copies: 2, page: 10,
      name: ["Priest (Tomas)", "Priest (Padre Tomas)"],
      short: ["Look at another player's hand.", "Olhe a mão de outro jogador."],
      lines: [
        ["Look at another player's hand.", "Olhe a mão de outro jogador."],
        ["Do not reveal it to any other player.", "Não a revele a nenhum outro jogador."]
      ]
    },
    {
      id: "cardinal", value: 2, premium: true, copies: null, page: 13,
      name: ["Cardinal (Vesper)", "Cardinal (Cardeal Vesper)"],
      short: ["Two players of your choice (you may be one) switch hands; then look at one of them.", "Dois jogadores à sua escolha (você pode ser um) trocam de mão; depois olhe uma delas."],
      lines: [
        ["Choose exactly 2 players (you may include yourself). They switch hands.", "Escolha exatamente 2 jogadores (pode incluir você). Eles trocam de mão."],
        ["Then you may look at one of those two hands without revealing it.", "Depois você pode olhar uma dessas duas mãos sem revelá-la."],
        ["If fewer than 2 players in the round can be chosen (Handmaid, Sycophant), the card is discarded without effect.", "Se menos de 2 jogadores na rodada puderem ser escolhidos (Handmaid, Sycophant), a carta é descartada sem efeito."]
      ]
    },
    {
      id: "guard", value: 1, premium: false, copies: 5, page: 10,
      name: ["Guard (Odette)", "Guard (Guarda Odette)"],
      short: ["Choose another player and name a number other than 1; if they hold it, they are out.", "Escolha outro jogador e diga um número diferente de 1; se ele o tiver, sai."],
      lines: [
        ["Choose another player and name a number other than 1.", "Escolha outro jogador e diga um número diferente de 1."],
        ["If that player has that number in hand, they are knocked out of the round.", "Se esse jogador tiver esse número na mão, está eliminado da rodada."],
        ["If no other player still in the round can be chosen (Handmaid, Sycophant), the Guard is discarded without effect.", "Se nenhum outro jogador ainda na rodada puder ser escolhido (Handmaid, Sycophant), o Guarda é descartado sem efeito.", "large"],
        ["If no other player still in the round can be chosen (all protected by a Handmaid), the Guard is discarded without effect.", "Se nenhum outro jogador ainda na rodada puder ser escolhido (todos protegidos pela Handmaid), o Guarda é descartado sem efeito.", "base"]
      ]
    },
    {
      id: "guard-dougaul", value: 1, premium: true, copies: null, page: 13,
      name: ["Guard (Dougaul)", "Guard (Guarda Dougaul)"],
      short: ["Same effect as every Guard.", "Mesmo efeito de todo Guarda."],
      lines: [
        ["Exactly the same effect as Guard Odette: choose another player, name a number other than 1; if they hold it, they are out.", "Exatamente o mesmo efeito da Guarda Odette: escolha outro jogador, diga um número diferente de 1; se ele o tiver, sai."]
      ]
    },
    {
      id: "jester", value: 0, premium: true, copies: null, page: 14,
      name: ["Jester (Darius)", "Jester (Bobo da Corte Darius)"],
      short: ["Choose another player; if they win this round, you gain a Token.", "Escolha outro jogador; se ele vencer esta rodada, você ganha um Marcador."],
      lines: [
        ["Choose another player — ideally the one you think will win the round. Put the Jester token next to them as a reminder.", "Escolha outro jogador — de preferência quem você acha que vai vencer a rodada. Ponha o marcador do Jester ao lado dele como lembrete."],
        ["If that player wins the round, you gain a Token of Affection.", "Se esse jogador vencer a rodada, você ganha um Marcador de Afeição."],
        ["If that Token gives you enough to win, you win immediately and the game ends.", "Se esse Marcador lhe der o suficiente para vencer, você vence na hora e a partida acaba."]
      ],
      reading: [
        "if the round ends in a tie with several winners, the Jester pays off when the chosen player is one of them. It also pays off if you, the Jester's player, were knocked out meanwhile — the Princess text says effects like the Jester still apply after a knock-out.",
        "se a rodada terminar empatada com vários vencedores, o Jester paga se o jogador escolhido for um deles. Ele também paga se você, que jogou o Jester, tiver sido eliminado nesse meio-tempo — o texto da Princesa diz que efeitos como o do Jester ainda valem após uma eliminação."
      ]
    },
    {
      id: "assassin", value: 0, premium: true, copies: null, page: 14,
      name: ["Assassin", "Assassin (Assassino)"],
      short: ["In your hand: a Guard that chooses you knocks out its own player instead.", "Na sua mão: um Guarda que escolhe você elimina o próprio jogador dele."],
      lines: [
        ["His effect works only while he is in your hand. Discarding him does nothing.", "O efeito dele só vale enquanto ele está na sua mão. Descartá-lo não faz nada."],
        ["If another player chooses you with a Guard, whatever number they named (even 0), reveal the Assassin: the Guard's player is knocked out and you are not.", "Se outro jogador escolher você com um Guarda, qualquer que seja o número dito (até 0), revele o Assassino: quem jogou o Guarda é eliminado e você não."],
        ["Then discard the Assassin and draw a new card. If the deck is empty, take the card removed at the start of the round.", "Depois descarte o Assassino e compre uma carta nova. Se o baralho estiver vazio, pegue a carta retirada no início da rodada."]
      ]
    }
  ];

  function cardsInPlay() {
    return CARDS.filter((card) => isLarge() || !card.premium);
  }

  function cardName(card) {
    return t(card.name[0], card.name[1]);
  }

  function copiesText(card) {
    if (card.copies) {
      return `×${card.copies}`;
    }
    return t("×? (see reference card)", "×? (veja a carta de referência)");
  }

  // ---------- header ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["victory", t("Winning", "Vitória")],
      ["turn", t("Turn & round", "Turno e rodada")],
      ["cards", t("The cards", "As cartas")],
      ["icons", t("Iconography", "Iconografia")],
      ["examples", t("Examples & clarifications", "Exemplos e esclarecimentos")],
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
          <span class="brand-mark" aria-hidden="true">LL</span>
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
      `${readFailed ? "This browser could not read the saved Love Letter match or setup progress; defaults are shown. " : ""}${writeFailed ? "The latest change could not be saved and is visible on screen only." : ""}`,
      `${readFailed ? "Este navegador não conseguiu ler a partida ou o progresso de Love Letter salvos; as opções padrão estão sendo mostradas. " : ""}${writeFailed ? "A alteração mais recente não pôde ser salva e aparece somente na tela." : ""}`
    ).trim();
  }

  // ---------- configuration ----------

  function choiceCard(name, value, dataAttr, checked, title, description) {
    return `
      <label class="ll-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" ${dataAttr} ${checked ? "checked" : ""}>
        <span class="ll-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function playerChoiceText(count) {
    const n = Number(count);
    const goal = TARGET[n];
    if (n === 2) {
      return t(`16-card deck. 1 card removed face down and 3 more set aside face up each round. First to ${goal} Tokens of Affection wins.`, `Baralho de 16 cartas. A cada rodada, 1 carta é retirada virada para baixo e mais 3 ficam de lado viradas para cima. Vence quem chegar a ${goal} Marcadores de Afeição.`);
    }
    if (n <= 4) {
      return t(`16-card deck. 1 card removed face down each round. First to ${goal} Tokens of Affection wins.`, `Baralho de 16 cartas. A cada rodada, 1 carta é retirada virada para baixo. Vence quem chegar a ${goal} Marcadores de Afeição.`);
    }
    return t(`All 32 cards, adding the 10 extra characters for 5–8 players (Bishop, Jester, Assassin…). “Name a number” hits every card of that number. First to ${goal} Tokens wins; Tokens can also come from card effects.`, `Todas as 32 cartas, acrescentando os 10 personagens extras para 5–8 jogadores (Bishop, Jester, Assassin…). “Diga um número” atinge toda carta desse número. Vence quem chegar a ${goal} Marcadores; eles também podem vir de efeitos de cartas.`);
  }

  function matchConfiguration() {
    return `
      <section class="controls-panel ll-config" id="build-match" aria-labelledby="ll-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="ll-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "The player count is the only choice the rulebook asks for: it decides the deck (16 cards for 2–4 players, all 32 for 5–8), the 2-player face-up cards and how many Tokens of Affection win the game. The rulebook has no optional rules. Your choice filters the setup checklist, the card list and the rules below.",
              "O número de jogadores é a única escolha que o manual pede: ele define o baralho (16 cartas para 2–4 jogadores, todas as 32 para 5–8), as cartas viradas para cima do jogo a 2 e quantos Marcadores de Afeição vencem a partida. O manual não tem regras opcionais. Sua escolha filtra a lista de preparação, a lista de cartas e as regras abaixo."
            )}</p>
          </div>
        </div>
        <fieldset class="ll-choice-group">
          <legend>${t("Players · selected:", "Jogadores · selecionado:")} <span>${playersLabel()} · ${t(`${deckSize()} cards · ${target()} Tokens to win`, `${deckSize()} cartas · ${target()} Marcadores para vencer`)}</span></legend>
          <p class="ll-choice-intro">${t("2–4 players use the base deck; 5–8 players use the full Premium deck.", "2–4 jogadores usam o baralho básico; 5–8 jogadores usam o baralho Premium completo.")} ${referenceLink(4)} ${referenceLink(6)} ${referenceLink(7)}</p>
          <div class="ll-choice-grid">${PLAYER_COUNTS.map((count) => choiceCard("ll-players", count, `data-players="${count}"`, state.players === count, playersLabel(count), playerChoiceText(count))).join("")}</div>
        </fieldset>
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function setupPhases() {
    const n = players();
    return [
      {
        id: "deck",
        title: t("Build the deck (once per game)", "Monte o baralho (uma vez por partida)"),
        pages: isLarge() ? [3, 4, 7] : [3, 4],
        items: isLarge()
          ? [
            t("Use all 32 game cards: the 16 cards of the 2–4 player game plus the 16 cards used only with 5–8 players.", "Use todas as 32 cartas de jogo: as 16 cartas do jogo de 2–4 jogadores mais as 16 cartas usadas só com 5–8 jogadores."),
            t("Count them: you must have 32. Each card shows its number (0–9) in the upper-left corner and its effect in the text box at the bottom.", "Conte-as: devem ser 32. Cada carta mostra seu número (0–9) no canto superior esquerdo e o efeito na caixa de texto embaixo.")
          ]
          : [
            t("From the 32 game cards, keep exactly these 16: Princess (8) ×1, Countess (7) ×1, King (6) ×1, Prince (5) ×2, Handmaid (4) ×2, Baron (3) ×2, Priest (2) ×2, Guard (1) ×5.", "Das 32 cartas de jogo, separe exatamente estas 16: Princess (8) ×1, Countess (7) ×1, King (6) ×1, Prince (5) ×2, Handmaid (4) ×2, Baron (3) ×2, Priest (2) ×2, Guard (1) ×5."),
            interpretation("the box has more than 5 Guards (Guard Odette and Guard Dougaul). Their effect and number are identical, so any 5 Guards work.", "a caixa tem mais de 5 Guardas (Guarda Odette e Guarda Dougaul). O efeito e o número são idênticos, então quaisquer 5 Guardas servem."),
            t("Put the other 16 cards back in the box; they are not used: Bishop, Dowager Queen, Constable, Count, Sycophant, Baroness, Cardinal, the extra Guards, Jester and Assassin.", "Devolva as outras 16 cartas à caixa; elas não são usadas: Bishop, Dowager Queen, Constable, Count, Sycophant, Baroness, Cardinal, os Guardas extras, Jester e Assassin.")
          ]
      },
      {
        id: "table",
        title: t("Tokens and reference cards (once per game)", "Marcadores e cartas de referência (uma vez por partida)"),
        pages: isLarge() ? [3, 7, 14] : [3, 6],
        items: [
          t("Put the 25 red Tokens of Affection in a pool everyone can reach. Players start with none.", "Coloque os 25 Marcadores de Afeição vermelhos numa reserva ao alcance de todos. Ninguém começa com marcadores."),
          t(`Give each of the ${n} players a reference card, ${isLarge() ? "5–8 player side up (the cards added for 5–8)" : "2–4 player side up"}. It is only a memory aid.`, `Dê a cada um dos ${n} jogadores uma carta de referência, com o lado ${isLarge() ? "de 5–8 jogadores para cima (as cartas acrescentadas para 5–8)" : "de 2–4 jogadores para cima"}. Ela é só um lembrete.`),
          isLarge()
            ? t("Keep the Jester token (the one token that is not red) next to the pool; it marks the player chosen with a Jester.", "Deixe o marcador do Jester (o único que não é vermelho) ao lado da reserva; ele marca o jogador escolhido com um Jester.")
            : t("The Jester token is not used with 2–4 players.", "O marcador do Jester não é usado com 2–4 jogadores."),
          t(`Goal for this game: ${target()} Tokens of Affection.`, `Meta desta partida: ${target()} Marcadores de Afeição.`)
        ]
      },
      {
        id: "shuffle",
        title: t("Shuffle and set cards aside (every round)", "Embaralhe e separe cartas (toda rodada)"),
        pages: isTwo() ? [4] : isLarge() ? [4, 7] : [4],
        items: [
          t(`Shuffle all ${deckSize()} cards together and place them face down as the draw deck.`, `Embaralhe as ${deckSize()} cartas juntas e coloque-as viradas para baixo como baralho de compra.`),
          t(`Remove the top card of the deck without looking at it and place it aside face down. Nobody may look at it. It is used only if a Prince${isLarge() ? " (or an Assassin)" : ""} needs a card when the deck is empty.`, `Retire a carta do topo do baralho sem olhá-la e deixe-a de lado virada para baixo. Ninguém pode olhá-la. Ela só é usada se um Prince${isLarge() ? " (ou um Assassin)" : ""} precisar de uma carta com o baralho vazio.`),
          isTwo()
            ? t("2 players: take 3 more cards from the top of the deck and place them to the side face up. They are not used this round, but both players may look at them at any time.", "2 jogadores: pegue mais 3 cartas do topo do baralho e deixe-as de lado viradas para cima. Elas não são usadas nesta rodada, mas os dois jogadores podem olhá-las a qualquer momento.")
            : null
        ]
      },
      {
        id: "deal",
        title: t("Deal one card each (every round)", "Uma carta para cada (toda rodada)"),
        pages: [4],
        items: [
          t("Each player draws 1 card from the deck. This is your hand: keep it secret from the other players.", "Cada jogador compra 1 carta do baralho. Esta é a sua mão: mantenha-a em segredo dos outros jogadores."),
          t(`The deck now holds ${deckSize() - 1 - (isTwo() ? 3 : 0) - n} cards.`, `O baralho agora tem ${deckSize() - 1 - (isTwo() ? 3 : 0) - n} cartas.`)
        ]
      },
      {
        id: "first",
        title: t("Who goes first (every round)", "Quem começa (toda rodada)"),
        pages: [4, 6],
        items: [
          t("First round: whoever was most recently on a date goes first (if tied, the youngest of them).", "Primeira rodada: começa quem saiu num encontro mais recentemente (se empatar, o mais jovem entre eles)."),
          t("Later rounds: the winner of the previous round goes first. If several players won it through a tie, the one among them most recently on a date goes first.", "Rodadas seguintes: começa quem venceu a rodada anterior. Se vários venceram por empate, começa entre eles quem saiu num encontro mais recentemente."),
          t("Turns then pass to the left.", "Depois os turnos passam para a esquerda.")
        ]
      }
    ];
  }

  function inventory() {
    const cards = [
      infoCard(t(`DECK · ${deckSize()} CARDS`, `BARALHO · ${deckSize()} CARTAS`), t("Game cards in this match", "Cartas de jogo nesta partida"),
        cardsInPlay().map((card) => `<strong>${card.value} · ${cardName(card)}</strong> ${copiesText(card)}`), isLarge() ? [4, 11, 12, 13, 14] : [4]),
      infoCard(t("SHARED", "COMPARTILHADO"), t("Tokens", "Marcadores"), [
        t("25 Tokens of Affection (red hearts) in a common pool.", "25 Marcadores de Afeição (corações vermelhos) numa reserva comum."),
        isLarge() ? t("1 Jester token (not red), used by the Jester card.", "1 marcador do Jester (não vermelho), usado pela carta Jester.") : t("Jester token: stays in the box.", "Marcador do Jester: fica na caixa.")
      ], [3]),
      infoCard(t(`PER PLAYER · ×${players()}`, `POR JOGADOR · ×${players()}`), t("Reference card", "Carta de referência"), [
        t(`1 reference card each, ${isLarge() ? "5–8" : "2–4"} side up.`, `1 carta de referência para cada, lado ${isLarge() ? "5–8" : "2–4"} para cima.`),
        t("Not part of play — just a list of the cards, their effects and copies.", "Não faz parte do jogo — só uma lista das cartas, efeitos e cópias."),
        interpretation("the 40 sleeves in the box only protect the cards; sleeve all of them or none so the backs look identical.", "as 40 capas da caixa só protegem as cartas; encape todas ou nenhuma para que os versos fiquem idênticos.")
      ], [3])
    ];
    if (isLarge()) {
      cards[0] = cards[0].replace("</ul>", `<li>${t("The rulebook states copies only for the 2–4 cards and the Count (2). The 5–8 side of the reference card lists the rest; the whole deck is 32 cards.", "O manual informa as cópias só das cartas de 2–4 e do Count (2). O lado 5–8 da carta de referência lista o resto; o baralho inteiro tem 32 cartas.")}</li></ul>`);
    }
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
        <label class="ll-setup-check" for="ll-setup-${phase.id}">
          <input id="ll-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="ll-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="ll-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), sectionIndex("setup"), isLarge() ? [3, 4, 7] : [3, 4])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Set up this match", "Prepare esta partida")} · ${playersLabel()}</h3>
            <p>${t("One checkbox per coherent step. Steps 1–2 are done once per game; steps 3–5 are repeated before every round — “Next round” unchecks only those.", "Uma caixa por etapa coerente. As etapas 1–2 são feitas uma vez por partida; as etapas 3–5 se repetem antes de cada rodada — “Próxima rodada” desmarca só essas.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-next-round>${t("Next round", "Próxima rodada")}</button>
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
    const cards = [
      infoCard(t("YOUR TURN", "SEU TURNO"), t("Draw one, discard one", "Compre uma, descarte uma"), [
        rl("1 · Draw", "take the top card of the deck. You now hold 2 cards.", "1 · Comprar", "pegue a carta do topo do baralho. Agora você tem 2 cartas."),
        rl("2 · Discard", "choose one of your 2 cards and discard it face up in front of you.", "2 · Descartar", "escolha uma das suas 2 cartas e descarte-a virada para cima à sua frente."),
        rl("3 · Apply", "carry out the discarded card's effect — it is mandatory, even if it hurts you.", "3 · Aplicar", "execute o efeito da carta descartada — é obrigatório, mesmo que prejudique você."),
        rl("4 · Pass", "the turn passes to the player on your left.", "4 · Passar", "o turno passa para o jogador à sua esquerda."),
        rl("Discard pile", "overlap your discards in order so everyone can see what you played and when.", "Pilha de descarte", "sobreponha seus descartes em ordem para todos verem o que você jogou e quando.")
      ], [5]),
      infoCard(t("ALWAYS TRUE", "SEMPRE VALE"), t("Rules that override a choice", "Regras que se impõem"), [
        rl("Princess", "discarding her for any reason knocks you out.", "Princess", "descartá-la por qualquer motivo elimina você."),
        rl("Countess", "holding her with the King or a Prince forces you to discard her.", "Countess", "tê-la junto com o King ou um Prince obriga você a descartá-la."),
        rl("Handmaid", "a protected player cannot be chosen until their next turn starts.", "Handmaid", "um jogador protegido não pode ser escolhido até o início do próximo turno dele."),
        rl("No legal target", "a card that must choose a player who cannot be chosen is discarded without effect.", "Sem alvo válido", "uma carta que precisa escolher um jogador que não pode ser escolhido é descartada sem efeito."),
        rl("Knocked out", "discard your hand face up without its effect; no more turns this round.", "Eliminado", "descarte sua mão virada para cima sem efeito; sem mais turnos nesta rodada."),
        rl("Honesty", "answer Guards truthfully and never hide a forced Countess.", "Honestidade", "responda aos Guardas com a verdade e nunca esconda uma Countess obrigatória.")
      ], [5, 8, 9]),
      infoCard(t("END OF ROUND", "FIM DA RODADA"), t("Who wins the round", "Quem vence a rodada"), [
        rl("Last one in", "if everyone else is out, the remaining player wins.", "Último na rodada", "se todos os outros saíram, quem sobrou vence."),
        rl("Deck empty", "if the deck is empty at the end of a turn, everyone still in reveals.", "Baralho vazio", "se o baralho estiver vazio no fim de um turno, quem ainda está na rodada revela a mão."),
        rl("Highest", isLarge() ? "highest number wins (Count bonus included; the Princess beats the Bishop)." : "highest number in hand wins.", "Maior", isLarge() ? "vence o maior número (com o bônus do Count; a Princesa vence o Bispo)." : "vence o maior número na mão."),
        rl("Tie", "highest total of the discard pile wins; still tied, all tied players win.", "Empate", "vence a maior soma da pilha de descarte; persistindo, todos os empatados vencem."),
        rl("Reward", "each round winner takes 1 Token of Affection.", "Prêmio", "cada vencedor da rodada pega 1 Marcador de Afeição."),
        rl("Next round", "reshuffle every card and set up again; the round winner goes first.", "Próxima rodada", "reembaralhe todas as cartas e prepare de novo; o vencedor da rodada começa.")
      ], [6]),
      infoCard(t("GAME END", "FIM DA PARTIDA"), t(`${target()} Tokens wins`, `${target()} Marcadores vencem`), [
        rl("Goal", `first player with ${target()} Tokens of Affection wins (${playersLabel()}).`, "Meta", `vence o primeiro jogador com ${target()} Marcadores de Afeição (${playersLabel()}).`),
        isLarge()
          ? rl("Other Tokens", "Bishop, Constable and Jester also give Tokens — reaching the goal that way wins at once.", "Outros Marcadores", "Bishop, Constable e Jester também dão Marcadores — chegar à meta assim vence na hora.")
          : rl("Table", "2 players: 7 · 3 players: 5 · 4 players: 4.", "Tabela", "2 jogadores: 7 · 3 jogadores: 5 · 4 jogadores: 4."),
        (isLarge() ? rl("Tied for the win", "the tied players play another round to decide.", "Empate na vitória", "os empatados jogam outra rodada para decidir.") : `${rl("Tied for the win", "", "Empate na vitória", "")}${interpretation("the tied players play another round to decide (borrowed from the 5–8 rules; see Winning).", "os empatados jogam outra rodada para decidir (emprestado das regras de 5–8; veja Vitória).")}`)
      ], isLarge() ? [7] : [6, 7])
    ];
    if (isLarge()) {
      cards.push(infoCard(t("5–8 PLAYERS", "5–8 JOGADORES"), t("What changes", "O que muda"), [
        rl("Name a number", "the effect applies to all cards with that number (naming 4 hits the Handmaid and the Sycophant).", "Diga um número", "o efeito vale para todas as cartas com esse número (dizer 4 atinge a Handmaid e o Sycophant)."),
        rl("Guard vs Assassin", "a Guard that chooses the Assassin's holder knocks out the Guard's player.", "Guarda x Assassino", "um Guarda que escolhe quem tem o Assassino elimina quem jogou o Guarda."),
        rl("Number 0", "Jester and Assassin are 0s, so a Guard may name 0.", "Número 0", "Jester e Assassin valem 0, então um Guarda pode dizer 0."),
        rl("Sycophant", "the next card that chooses players must include the chosen player.", "Sycophant", "a próxima carta que escolhe jogadores deve incluir o jogador escolhido.")
      ], [7, 12, 14]));
    }
    if (isTwo()) {
      cards.push(infoCard(t("2 PLAYERS", "2 JOGADORES"), t("What changes", "O que muda"), [
        rl("Face-up cards", "3 extra cards are set aside face up each round; both players may study them.", "Cartas abertas", "3 cartas extras ficam de lado viradas para cima a cada rodada; os dois jogadores podem estudá-las."),
        rl("Not drawn", "those 3 cards never enter play that round — not even for a Prince on an empty deck.", "Não compradas", "essas 3 cartas nunca entram em jogo naquela rodada — nem para um Prince com o baralho vazio."),
        rl("Goal", "7 Tokens of Affection.", "Meta", "7 Marcadores de Afeição.")
      ], [4, 6, 9]));
    }
    const cardList = cardsInPlay().map((card) => `<strong>${card.value} · ${cardName(card)}</strong> <span class="ll-copies">${copiesText(card)}</span> — ${t(card.short[0], card.short[1])}`);
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), sectionIndex("quick-reference"), [2, 5, 6])}
      <div class="callout">${t(
        "Goal: hold the highest card when the deck runs out — or be the last suitor left in the round — to win a Token of Affection. You always hold just one secret card between turns.",
        "Objetivo: ter a carta mais alta quando o baralho acabar — ou ser o último pretendente na rodada — para ganhar um Marcador de Afeição. Entre os turnos você sempre tem uma única carta secreta."
      )} ${referenceLink(2)}</div>
      <div class="quick-grid">${cards.join("")}</div>
      <h3 class="subhead">${t(`Card list · ${deckSize()} cards`, `Lista de cartas · ${deckSize()} cartas`)}</h3>
      <article class="info-card ll-card-list">
        <span class="component-label">${t("HIGHEST TO LOWEST", "DO MAIOR PARA O MENOR")}</span>
        ${lineList(cardList)}
        ${t("Full text and special cases:", "Texto completo e casos especiais:")} <button type="button" class="ll-inline-link" data-scroll="cards">${t("The cards", "As cartas")}</button>
      </article>`;
  }

  // ---------- victory ----------

  function victorySection() {
    return `
      ${sectionHeading("victory", t("Winning", "Vitória"), sectionIndex("victory"), isLarge() ? [4, 6, 7] : [4, 6])}
      <div class="quick-grid">
        <article class="info-card victory-card">
          <span class="component-label">${t("ROUNDS", "RODADAS")}</span>
          <h3>${t("A game is a series of rounds", "Uma partida é uma série de rodadas")}</h3>
          ${lineList([
            t("Each round is one day at court. At its end one letter (or several, on a tie) reaches Princess Annette.", "Cada rodada é um dia na corte. No fim dela uma carta (ou várias, num empate) chega à Princesa Annette."),
            t("Each round winner receives 1 Token of Affection from the pool.", "Cada vencedor da rodada recebe 1 Marcador de Afeição da reserva."),
            t("After each round, shuffle all the cards together and set up again (setup steps 3–5).", "Depois de cada rodada, embaralhe todas as cartas juntas e prepare de novo (etapas 3–5 da preparação).")
          ])}
          ${referenceLink(4)} ${referenceLink(6)}
        </article>
        <article class="info-card victory-card">
          <span class="component-label">${t("GAME", "PARTIDA")}</span>
          <h3>${t(`First to ${target()} Tokens of Affection`, `Primeiro a ${target()} Marcadores de Afeição`)}</h3>
          ${lineList([
            isLarge()
              ? t("With 5–8 players, 4 Tokens win.", "Com 5–8 jogadores, 4 Marcadores vencem.")
              : t("2 players: 7 Tokens · 3 players: 5 Tokens · 4 players: 4 Tokens.", "2 jogadores: 7 Marcadores · 3 jogadores: 5 · 4 jogadores: 4."),
            isLarge()
              ? t("Bishop, Constable and Jester can give Tokens outside the round's end. Reaching the goal with such a Token wins immediately — you can win without ever winning a round.", "Bishop, Constable e Jester podem dar Marcadores fora do fim da rodada. Chegar à meta com um desses Marcadores vence na hora — dá para vencer sem nunca ter vencido uma rodada.")
              : null,
            isLarge()
              ? t("If two or more players reach the goal at the same moment, they tie: only those players play another round to break the tie, and its winner wins the game.", "Se dois ou mais jogadores chegarem à meta no mesmo momento, empatam: só esses jogadores jogam outra rodada para desempatar, e quem a vencer vence a partida.")
              : interpretation("a tied round can give several players their winning Token at once. The 2–4 rules do not cover it; use the rulebook's 5–8 rule — only the tied players play one more round, and its winner wins.", "uma rodada empatada pode dar a vários jogadores o Marcador da vitória ao mesmo tempo. As regras de 2–4 não tratam disso; use a regra de 5–8 do manual — só os empatados jogam mais uma rodada, e quem vencê-la vence."),
            interpretation(`set up that tie-break round exactly like this match (${deckSize()} cards${isTwo() ? ", 3 face-up cards" : ""}, same rules) with only the tied players; the one most recently on a date goes first.${isLarge() ? " If only 2–4 players are tied, keep the 32-card deck and the 5–8 rules anyway." : ""}`, `prepare essa rodada de desempate exatamente como esta partida (${deckSize()} cartas${isTwo() ? ", 3 cartas viradas para cima" : ""}, mesmas regras) só com os empatados; começa quem saiu num encontro mais recentemente.${isLarge() ? " Se só 2–4 jogadores empatarem, mantenha mesmo assim o baralho de 32 cartas e as regras de 5–8." : ""}`)
          ])}
          ${isLarge() ? referenceLink(7) : `${referenceLink(6)} ${referenceLink(7)}`}
        </article>
      </div>`;
  }

  // ---------- turn ----------

  function turnSection() {
    return `
      ${sectionHeading("turn", t("Turn & round", "Turno e rodada"), sectionIndex("turn"), [5, 6])}
      <div class="quick-grid">
        ${infoCard(t("TAKING A TURN", "FAZER UM TURNO"), t("Draw, discard, apply", "Comprar, descartar, aplicar"), [
          t("Draw the top card of the deck and add it to your hand.", "Compre a carta do topo do baralho e junte-a à sua mão."),
          t("Choose one of your two cards and discard it face up in front of you. Keep the other secret.", "Escolha uma das suas duas cartas e descarte-a virada para cima à sua frente. Mantenha a outra em segredo."),
          t("Apply the discarded card's effect. You must apply it, even when it is bad for you.", "Aplique o efeito da carta descartada. É obrigatório, mesmo quando é ruim para você."),
          t("Discards stay in front of the player who discarded them, overlapped in order. This tells everyone what may still be in other hands.", "Os descartes ficam diante de quem os descartou, sobrepostos em ordem. Isso mostra a todos o que ainda pode estar nas outras mãos."),
          t("When the effect is done, the player on your left takes the next turn.", "Terminado o efeito, o jogador à sua esquerda faz o próximo turno.")
        ], 5)}
        ${infoCard(t("CHOOSING A PLAYER", "ESCOLHER UM JOGADOR"), t("Who a card can target", "Quem uma carta pode escolher"), [
          t("Players who are out of the round can never be chosen.", "Jogadores fora da rodada nunca podem ser escolhidos."),
          t("A player protected by a Handmaid cannot be chosen by other players' cards.", "Um jogador protegido pela Handmaid não pode ser escolhido pelas cartas dos outros."),
          isLarge() ? t("A Sycophant can force the next card to choose a specific player.", "Um Sycophant pode obrigar a próxima carta a escolher um jogador específico.") : null,
          t("If your card must choose a player but nobody it may choose can be chosen, it is discarded without effect.", "Se sua carta precisa escolher um jogador mas ninguém que ela pode escolher está disponível, ela é descartada sem efeito."),
          t("If everyone else is protected, you must choose yourself if the card allows it (Prince); otherwise the card has no effect.", "Se todos os outros estiverem protegidos, você deve escolher a si mesmo se a carta permitir (Prince); senão a carta fica sem efeito.")
        ], [5, 9])}
        ${infoCard(t("OUT OF THE ROUND", "FORA DA RODADA"), t("When you are knocked out", "Quando você é eliminado"), [
          t("Discard the card in your hand face up, without applying its effect.", "Descarte a carta da sua mão virada para cima, sem aplicar o efeito."),
          t("Take no more turns until the next round. You start the next round normally.", "Não faça mais turnos até a próxima rodada. Você começa a próxima rodada normalmente."),
          isLarge() ? t("Effects tied to being knocked out still happen (Constable; a Jester's guess on someone else).", "Efeitos ligados a ser eliminado ainda acontecem (Constable; o palpite de um Jester em outra pessoa).") : null
        ], [5, 8])}
        ${infoCard(t("END OF A ROUND", "FIM DE UMA RODADA"), t("Two ways it ends", "Duas formas de acabar"), [
          rl("Deck empty", "the round ends if the deck is empty at the end of a player's turn. The set-aside card does not count as the deck.", "Baralho vazio", "a rodada acaba se o baralho estiver vazio no fim do turno de um jogador. A carta deixada de lado não conta como baralho."),
          rl("Showdown", "everyone still in the round reveals their hand; the highest number wins the round.", "Revelação", "todos ainda na rodada revelam a mão; o maior número vence a rodada."),
          isLarge() ? rl("Adjustments", "add +1 per Count in your discard pile; the Princess beats the Bishop.", "Ajustes", "some +1 por Count na sua pilha de descarte; a Princesa vence o Bispo.") : null,
          rl("Tie", "the tied players add up the numbers in their discard piles; the highest total wins. Still tied: all of them win the round.", "Empate", "os empatados somam os números das suas pilhas de descarte; a maior soma vence. Persistindo: todos vencem a rodada."),
          rl("Last suitor", "the round also ends as soon as only one player is still in it; that player wins.", "Último pretendente", "a rodada também acaba assim que só um jogador continua nela; esse jogador vence.")
        ], [6, ...(isLarge() ? [11, 12] : [])])}
        ${infoCard(t("AFTER THE ROUND", "DEPOIS DA RODADA"), t("Tokens and the next round", "Marcadores e a próxima rodada"), [
          t("Each round winner takes 1 Token of Affection.", "Cada vencedor da rodada pega 1 Marcador de Afeição."),
          t(`If nobody has ${target()} Tokens yet, shuffle all ${deckSize()} cards and follow setup steps 3–5 again.`, `Se ninguém tiver ${target()} Marcadores ainda, embaralhe as ${deckSize()} cartas e siga de novo as etapas 3–5 da preparação.`),
          t("The previous round's winner goes first. With several tied winners, the one among them most recently on a date goes first.", "O vencedor da rodada anterior começa. Com vários vencedores empatados, começa entre eles quem saiu num encontro mais recentemente.")
        ], 6)}
        ${infoCard(t("HONESTY", "HONESTIDADE"), t("Play it straight", "Jogue limpo"), [
          t("When a Guard names your number, say so.", "Quando um Guarda disser o seu número, admita."),
          t("When you hold the Countess with the King or a Prince, you must discard the Countess.", "Quando tiver a Countess com o King ou um Prince, você deve descartar a Countess."),
          t("Cheating is possible but ruins a light, fun game.", "Trapacear é possível, mas estraga um jogo leve e divertido.")
        ], 5)}
      </div>`;
  }

  // ---------- cards ----------

  function cardsSection() {
    const visible = cardsInPlay();
    const art = isLarge()
      ? [["jester", t("The Jester, as shown on his card (rulebook p. 2–3)", "O Jester, como aparece na carta dele (manual p. 2–3)")], ["figure-p13", t("Illustration beside the Cardinal and Guard Dougaul profiles (p. 13)", "Ilustração ao lado dos perfis do Cardinal e do Guarda Dougaul (p. 13)")], ["figure-p14", t("Illustration beside the Jester and Assassin profiles (p. 14)", "Ilustração ao lado dos perfis do Jester e do Assassin (p. 14)")]]
      : [["figure-p10", t("Illustration beside the Baron, Priest and Guard profiles (p. 10)", "Ilustração ao lado dos perfis do Baron, Priest e Guarda (p. 10)")]];
    return `
      ${sectionHeading("cards", t("The cards", "As cartas"), sectionIndex("cards"), isLarge() ? [8, 9, 10, 11, 12, 13, 14] : [8, 9, 10])}
      <p class="glossary-intro">${t(
        `${isLarge() ? "All 32 cards are in play" : "These 16 cards are in play"}. The number in the upper-left corner is how close that person is to the Princess. Most effects happen when the card is discarded; the Countess${isLarge() ? ", Count, Constable and Assassin work" : " works"} differently, as noted.${isLarge() ? " With 5–8 players, when an effect says “name a number”, it applies to every card with that number." : ""}`,
        `${isLarge() ? "As 32 cartas estão em jogo" : "Estas 16 cartas estão em jogo"}. O número no canto superior esquerdo indica quão perto essa pessoa está da Princesa. A maioria dos efeitos acontece quando a carta é descartada; a Countess${isLarge() ? ", o Count, o Constable e o Assassin funcionam" : " funciona"} de outro jeito, como indicado.${isLarge() ? " Com 5–8 jogadores, quando um efeito diz “diga um número”, ele vale para toda carta com esse número." : ""}`
      )}</p>
      <div class="ll-art-strip">${art.map(([file, caption]) => `<figure><img src="${ART}${file}.webp" alt="${caption}" loading="lazy"><figcaption>${caption}</figcaption></figure>`).join("")}</div>
      <div class="ll-card-grid">${visible.map((card) => `
        <article class="info-card ll-person" id="card-${card.id}">
          <div class="ll-person-head"><span class="ll-value" aria-label="${t("Number", "Número")} ${card.value}">${card.value}</span>
            <div><h3>${cardName(card)}</h3><span class="component-label">${card.copies ? t(`${card.copies} ${card.copies === 1 ? "copy" : "copies"}`, `${card.copies} ${card.copies === 1 ? "cópia" : "cópias"}`) : t("copies: see the reference card", "cópias: veja a carta de referência")}${card.premium ? t(" · 5–8 players only", " · só 5–8 jogadores") : ""}</span></div>
          </div>
          ${lineList([
            ...card.lines.filter(([, , only]) => !only || (only === "large") === isLarge()).map(([en, pt]) => t(en, pt)),
            card.id === "guard" && isLarge() ? t("5–8 players: you may name 0 (Jester, Assassin) or 9 (Bishop). Choosing the Assassin's holder knocks you out instead.", "5–8 jogadores: você pode dizer 0 (Jester, Assassin) ou 9 (Bishop). Escolher quem tem o Assassino elimina você.") : null,
            card.reading ? interpretation(card.reading[0], card.reading[1]) : null
          ])}
          ${referenceLink(card.page)}
        </article>`).join("")}</div>`;
  }

  // ---------- iconography ----------

  function iconsSection() {
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), sectionIndex("icons"), [3])}
      <p class="glossary-intro">${t("Love Letter has almost no symbols. Each image below is cropped individually from the rulebook's components page.", "Love Letter quase não tem símbolos. Cada imagem abaixo foi recortada individualmente da página de componentes do manual.")}</p>
      <div class="icon-grid">
        ${iconCard("card-number", "Card number", "Upper-left corner of every card. The higher the number, the closer that person is to the Princess — and the better it is to hold at the end of a round.", "Número da carta", "Canto superior esquerdo de toda carta. Quanto maior o número, mais perto essa pessoa está da Princesa — e melhor é tê-la no fim da rodada.", 3)}
        ${iconCard("token-of-affection", "Token of Affection", "Red heart. Each round winner takes one; collect enough to win the game.", "Marcador de Afeição", "Coração vermelho. Cada vencedor de rodada pega um; junte o suficiente para vencer a partida.", 3)}
        ${iconCard("reference-card", "Reference card", "Lists each card, its copies and a summary of its effect: 2–4 player cards on one side, the cards added for 5–8 on the other. A memory aid only.", "Carta de referência", "Lista cada carta, suas cópias e um resumo do efeito: as cartas de 2–4 jogadores de um lado e as acrescentadas para 5–8 do outro. Só um lembrete.", 3)}
      </div>
      ${isLarge() ? `<p class="glossary-intro">${t("The Jester token (the one token that is not red) is not pictured in the rulebook; it marks the player chosen with a Jester.", "O marcador do Jester (o único que não é vermelho) não aparece em imagem no manual; ele marca o jogador escolhido com um Jester.")} ${referenceLink(3)}</p>` : ""}`;
  }

  // ---------- examples ----------

  function examplesSection() {
    const examples = [
      [t("A forced Countess", "Uma Countess obrigatória"), [
        t("You hold the Countess and draw a Prince.", "Você tem a Countess e compra um Prince."),
        t("You must discard the Countess. Nothing happens, and you keep the Prince secret.", "Você deve descartar a Countess. Nada acontece, e você mantém o Prince em segredo."),
        t("Others cannot tell whether you were forced or bluffing.", "Os outros não sabem se você foi obrigado ou blefou.")
      ], 8],
      [t("A Prince on the Princess", "Um Prince na Princesa"), [
        t("You discard a Prince and choose a player who holds the Princess.", "Você descarta um Prince e escolhe um jogador que tem a Princesa."),
        t("They discard the Princess and are knocked out at once.", "Ele descarta a Princesa e é eliminado na hora."),
        t("They do not draw a new card.", "Ele não compra carta nova.")
      ], 8],
      [t("A Prince on an empty deck", "Um Prince com o baralho vazio"), [
        t("The last card has been drawn and you discard a Prince on yourself.", "A última carta foi comprada e você descarta um Prince em si mesmo."),
        t("You discard your hand and take the card removed face down at the start of the round.", "Você descarta sua mão e pega a carta retirada virada para baixo no início da rodada."),
        isTwo() ? t("The 3 face-up cards are never taken.", "As 3 cartas viradas para cima nunca são pegas.") : null,
        t("The deck is empty at the end of your turn, so the round ends.", "O baralho está vazio no fim do seu turno, então a rodada acaba.")
      ], 9],
      [t("Everyone else protected", "Todos os outros protegidos"), [
        t("Every other player still in the round discarded a Handmaid on their last turn.", "Todos os outros jogadores ainda na rodada descartaram uma Handmaid no último turno."),
        t("You discard a Guard: there is no one to choose, so it is discarded without effect.", "Você descarta um Guarda: não há ninguém para escolher, então ele é descartado sem efeito."),
        t("With a Prince instead, you would have to choose yourself.", "Com um Prince, você teria de escolher a si mesmo.")
      ], 9],
      [t("A tie at the end of a round", "Empate no fim da rodada"), [
        t("The deck runs out. Two players reveal a King (6).", "O baralho acaba. Dois jogadores revelam um King (6)."),
        t("They total their discard piles: 9 against 7 — the 9 wins the round.", "Eles somam as pilhas de descarte: 9 contra 7 — o 9 vence a rodada."),
        t("Had both been 9, both would win a Token.", "Se ambas fossem 9, os dois ganhariam um Marcador.")
      ], 6]
    ];
    if (isLarge()) {
      examples.push(
        [t("Naming 4 with 5–8 players", "Dizer 4 com 5–8 jogadores"), [
          t("You discard a Guard and name 4 against a player.", "Você descarta um Guarda e diz 4 contra um jogador."),
          t("Both the Handmaid and the Sycophant are 4s.", "A Handmaid e o Sycophant valem 4."),
          t("If that player holds either one, they are knocked out.", "Se esse jogador tiver qualquer uma delas, está eliminado.")
        ], 7],
        [t("Constable decides a tie", "O Constable decide um empate"), [
          t("Bob and Susan each have 3 Tokens. Bob has a Constable in his discard pile.", "Bob e Susan têm 3 Marcadores cada. Bob tem um Constable na pilha de descarte."),
          t("Susan knocks Bob out: she is the last one in and wins the round (4 Tokens).", "Susan elimina Bob: ela é a última na rodada e vence (4 Marcadores)."),
          t("Bob shows the Constable and also gains a Token (4).", "Bob mostra o Constable e também ganha um Marcador (4)."),
          t("They tie for the win, so the two of them play one more round.", "Empatam na vitória, então os dois jogam mais uma rodada.")
        ], 7],
        [t("Two Counts", "Dois Counts"), [
          t("The deck runs out. You hold the Countess (7) and both Counts are in your discard pile.", "O baralho acaba. Você tem a Countess (7) e os dois Counts estão na sua pilha de descarte."),
          t("Your 7 counts as 9 and beats an opponent's Princess (8).", "Seu 7 vale 9 e vence a Princesa (8) de um adversário."),
          t("Against a Bishop (9) it would be a tie, broken by the discard-pile totals.", "Contra um Bispo (9) seria empate, decidido pela soma das pilhas de descarte.")
        ], 12],
        [t("A Guard meets the Assassin", "Um Guarda encontra o Assassino"), [
          t("You discard a Guard, choose Ana and name 5.", "Você descarta um Guarda, escolhe Ana e diz 5."),
          t("Ana reveals the Assassin: you are knocked out, whatever you named.", "Ana revela o Assassino: você é eliminado, seja qual for o número dito."),
          t("Ana discards the Assassin and draws a new card.", "Ana descarta o Assassino e compra uma carta nova.")
        ], 14]
      );
    }
    return `
      ${sectionHeading("examples", t("Examples & clarifications", "Exemplos e esclarecimentos"), sectionIndex("examples"), [...new Set(examples.map((example) => example[2]))].sort((a, b) => a - b))}
      <div class="example-grid">${examples.map(([title, items, page], index) => `
        <article class="example-card">
          <span class="card-number">${String(index + 1).padStart(2, "0")}</span>
          <h3>${title}</h3>
          ${lineList(items)}
          <div class="example-source"><span>${t("Based on the rulebook's rules and clarifications", "Com base nas regras e esclarecimentos do manual")}</span>${referenceLink(page)}</div>
        </article>`).join("")}</div>`;
  }

  // ---------- glossary ----------

  function glossarySection() {
    const visible = [
      { term: ["Discard pile", "Pilha de descarte"], text: ["Your discarded cards, face up in front of you and overlapped in order. Its total breaks ties at the end of a round.", "Suas cartas descartadas, viradas para cima à sua frente e sobrepostas em ordem. A soma dela desempata no fim da rodada."], page: 5 },
      { term: ["Hand", "Mão"], text: ["Your secret card: one between turns, two while taking your turn.", "Sua carta secreta: uma entre os turnos, duas durante o seu turno."], page: 4 },
      { term: ["Knocked out / out of the round", "Eliminado / fora da rodada"], text: ["You discard your hand face up without its effect and take no more turns until the next round.", "Você descarta a mão virada para cima sem efeito e não joga mais até a próxima rodada."], page: 5 },
      { term: ["Protected", "Protegido"], text: ["After discarding a Handmaid, immune to other players' cards until the start of your next turn.", "Depois de descartar uma Handmaid, imune às cartas dos outros até o início do seu próximo turno."], page: 9 },
      { term: ["Round", "Rodada"], text: ["One day at court, from the deal until the deck runs out or one player is left.", "Um dia na corte, da distribuição até o baralho acabar ou sobrar um jogador."], page: 4 },
      { term: ["Set-aside card", "Carta deixada de lado"], text: [`The top card removed face down at the start of each round. Only a Prince${isLarge() ? " or Assassin" : ""} on an empty deck takes it.`, `A carta do topo retirada virada para baixo no início de cada rodada. Só um Prince${isLarge() ? " ou Assassin" : ""} com o baralho vazio a pega.`], page: 4 },
      { term: ["Token of Affection", "Marcador de Afeição"], text: [`Red heart token won by a round winner. ${target()} win this game.`, `Marcador de coração vermelho ganho pelo vencedor da rodada. ${target()} vencem esta partida.`], page: 3 },
      { term: ["Without effect", "Sem efeito"], text: ["The card is discarded but nothing happens — for example when nobody can be chosen.", "A carta é descartada mas nada acontece — por exemplo quando ninguém pode ser escolhido."], page: 5 }
    ];
    if (isTwo()) {
      visible.push({ term: ["Face-up cards", "Cartas abertas"], text: ["In a 2-player game, 3 cards set aside face up each round. Out of play for that round, visible to both players.", "No jogo a 2, 3 cartas deixadas de lado viradas para cima a cada rodada. Fora de jogo naquela rodada, visíveis aos dois."], page: 4 });
    }
    if (isLarge()) {
      visible.push({ term: ["Name a number", "Diga um número"], text: ["With 5–8 players, the effect covers every card with the named number.", "Com 5–8 jogadores, o efeito cobre toda carta com o número dito."], page: 7 });
      visible.push({ term: ["Jester token", "Marcador do Jester"], text: ["The one non-red token, placed next to the player chosen with a Jester.", "O único marcador não vermelho, posto ao lado do jogador escolhido com um Jester."], page: 14 });
    }
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), sectionIndex("glossary"), [...new Set(visible.map((item) => item.page))].sort((a, b) => a - b))}
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
    document.body.classList.add("theme-love-letter");
    document.documentElement.lang = state.language;
    document.title = t("Love Letter — Field Manual", "Love Letter — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Love Letter Premium Edition: 2–8 players, a match-filtered setup checklist with a next-round reset, quick reference and every card explained.",
        "Regras interativas bilíngues de Love Letter Premium Edition: 2–8 jogadores, lista de preparação filtrada com reinício por rodada, referência rápida e todas as cartas explicadas."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook · Premium Edition", "Livro interativo · Premium Edition")}</p>
          <h1>Love Letter</h1>
          <p class="hero-intro">${t(
            "Princess Annette has locked herself in the palace. Get your love letter to her through the courtiers: hold one secret card, draw one, play one, and be the person closest to the Princess when the day ends.",
            "A Princesa Annette se trancou no palácio. Faça sua carta de amor chegar até ela pelos membros da corte: tenha uma carta secreta, compre uma, jogue uma e seja quem está mais perto da Princesa quando o dia acabar."
          )}</p>
          <div class="hero-meta"><span>${t("2–8 players", "2–8 jogadores")}</span><span>${t("About 20 min", "Cerca de 20 min")}</span><span>${t("Ages 14+", "14+ anos")}</span><span>${t("Deduction · elimination", "Dedução · eliminação")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/love-letter.webp" alt="${t("First page of the Love Letter Premium Edition rulebook", "Primeira página do manual de Love Letter Premium Edition")}" fetchpriority="high"><figcaption>${t("Rulebook first page · art by Andrew Hepworth and Jeffrey Himmelman", "Primeira página do manual · arte de Andrew Hepworth e Jeffrey Himmelman")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("Royal court", "Corte real")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column ll-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied Love Letter Premium Edition rulebook (AEG, 2016): the 16-card game for 2–4 players and the 32-card game for 5–8 players. Points marked “Guide's reading” are interpretations where the rulebook is silent. Page links use the rulebook's printed page numbers.",
            "Este guia cobre o manual fornecido de Love Letter Premium Edition (AEG, 2016): o jogo de 16 cartas para 2–4 jogadores e o de 32 cartas para 5–8 jogadores. Pontos marcados como “Leitura do guia” são interpretações onde o manual é omisso. Os links de página usam a numeração impressa do manual."
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
        "Personal companion guide based on the Love Letter Premium Edition rulebook. Design: Seiji Kanai (original game), John Zinser (5–8 player cards); art: Andrew Hepworth, Jeffrey Himmelman. Published by Alderac Entertainment Group.",
        "Guia pessoal de consulta baseado no manual de Love Letter Premium Edition. Design: Seiji Kanai (jogo original), John Zinser (cartas de 5–8 jogadores); arte: Andrew Hepworth, Jeffrey Himmelman. Publicado pela Alderac Entertainment Group."
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
    if (button.hasAttribute("data-next-round")) {
      setupState = { signature: signature(), checks: setupState.checks.filter((id) => !ROUND_STEPS.includes(id)) };
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
      root.querySelector(".ll-page")?.prepend(notice);
    }
    notice.textContent = storageNoticeText();
  }

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !root || !root.contains(target)) {
      return;
    }
    if (target.matches("[data-players]")) {
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

  window.LoveLetter = { renderInto, onClick, onChange };
})();
