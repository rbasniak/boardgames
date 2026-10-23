(() => {
  "use strict";

  const STORAGE_KEY = "field-manual.odins-ravens.v1";
  const MANUAL_FILE = "odins-ravens_core.pdf";

  let storageAvailable = true;
  let storageNotice = "";
  let root = null;

  function defaultState() {
    return {
      language: "pt-BR",
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
      console.error("Could not read Odin's Ravens match settings.", error);
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
      console.error("Could not save Odin's Ravens match settings.", error);
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

  function manualUrl(page) {
    const script = document.querySelector('script[src*="odins-ravens.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${MANUAL_FILE}`, baseUrl).href}#page=${page}`;
  }

  function referenceLink(page) {
    const label = t(`Manual p. ${page} ↗`, `Manual p. ${page} ↗`);
    return `<a class="source-link" href="${escapeHtml(manualUrl(page))}" target="_blank" rel="noreferrer">${label}</a>`;
  }

  function sectionHeading(id, title, index, page) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("FIELD GUIDE", "GUIA DE CAMPO")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        ${referenceLink(page)}
      </div>`;
  }

  function iconCard(src, title, description) {
    return `
      <article class="icon-card">
        <span class="manual-icon-frame" aria-hidden="true"><img class="manual-icon" src="${src}" alt=""></span>
        <div><strong>${title}</strong><p>${description}</p></div>
      </article>`;
  }

  function storageNoticeText() {
    if (storageNotice === "read") {
      return t(
        "This browser could not read the saved Odin's Ravens match. The guide is showing a new default match, and it may not be possible to save changes.",
        "Este navegador não conseguiu ler a partida salva de Odin's Ravens. O guia está mostrando uma partida nova, e pode não ser possível salvar alterações."
      );
    }
    return t(
      "This browser refused to save the Odin's Ravens match. Your latest change is on screen only.",
      "Este navegador recusou salvar a partida de Odin's Ravens. A última alteração está só na tela."
    );
  }

  // --- Reference data -------------------------------------------------

  const LOKI_CARDS = [
    {
      titleEn: "Move a raven", titlePt: "Mover um corvo",
      options: [
        { icon: "assets/odins-ravens/icons/raven-forward.webp",
          en: "Move your raven", pt: "Mover seu corvo",
          en_d: "Move your raven 1 space forward on the path, regardless of the land type of that space.",
          pt_d: "Mova seu corvo 1 espaço para frente na rota, não importa o tipo de terreno desse espaço." },
        { icon: "assets/odins-ravens/icons/raven-backward.webp",
          en: "Move the other raven", pt: "Mover o corvo adversário",
          en_d: "Move the other player's raven 1 space backwards on the path.",
          pt_d: "Mova o corvo do outro jogador 1 espaço para trás na rota." }
      ]
    },
    {
      titleEn: "Change a land card", titlePt: "Mudar uma carta de terreno",
      options: [
        { icon: "assets/odins-ravens/icons/rotate-land.webp",
          en: "Rotate a land card", pt: "Rotacionar uma carta de terreno",
          en_d: "Rotate any land card 180°, changing which land type faces each route.",
          pt_d: "Rotacione qualquer carta de terreno 180°, trocando qual tipo de terreno fica voltado para cada rota." },
        { icon: "assets/odins-ravens/icons/remove-land.webp",
          en: "Remove a land card", pt: "Remover uma carta de terreno",
          en_d: "Remove a land card from the line entirely. Both flight paths are reduced by one space.",
          pt_d: "Remova uma carta de terreno da linha por completo. As duas rotas de voo ficam com um espaço a menos." }
      ]
    },
    {
      titleEn: "Rearrange land cards", titlePt: "Reorganizar cartas de terreno",
      options: [
        { icon: "assets/odins-ravens/icons/swap-land.webp",
          en: "Swap two land cards", pt: "Trocar duas cartas de terreno",
          en_d: "Swap the position of any two land cards in the line, without rotating them.",
          pt_d: "Troque a posição de quaisquer duas cartas de terreno na linha, sem rotacioná-las." },
        { icon: "assets/odins-ravens/icons/slide-land.webp",
          en: "Slide a land card", pt: "Deslizar uma carta de terreno",
          en_d: "Slide one land card by one space. One flight path changes shape while the other gets shorter; the section that ends up outside both flight paths is ignored.",
          pt_d: "Deslize uma carta de terreno em um espaço. Uma rota de voo muda de forma enquanto a outra fica mais curta; o trecho que sobra fora das duas rotas é ignorado." }
      ]
    },
    {
      titleEn: "Draw cards", titlePt: "Comprar cartas",
      options: [
        { icon: "assets/odins-ravens/icons/draw-two.webp",
          en: "Draw two extra cards", pt: "Comprar duas cartas extras",
          en_d: "Draw two extra cards in whichever combination you prefer, from either of your own draw piles.",
          pt_d: "Compre duas cartas extras na combinação que preferir, de qualquer um dos seus dois baralhos de compra." },
        { icon: "assets/odins-ravens/icons/loop-land.webp",
          en: "Add a loop", pt: "Adicionar um loop",
          en_d: "Draw an extra land card and put it alongside one of the flight paths. It adds a loop that makes that flight path longer; ravens now have to fly all the way around the loop, following the dotted line.",
          pt_d: "Compre uma carta de terreno extra e coloque-a ao lado de uma das rotas de voo. Ela adiciona um loop que alonga essa rota; os corvos agora precisam contornar o loop por completo, seguindo a linha pontilhada." }
      ]
    }
  ];

  const GLOSSARY_TERMS = [
    ["Land space", "Espaço de terreno", "One of the two stacked spaces printed on a land card; each belongs to one of the two flight paths.", "Um dos dois espaços empilhados impressos numa carta de terreno; cada um pertence a uma das duas rotas de voo."],
    ["Flight path / route", "Rota de voo", "The row of 16 land spaces (one per land card) that a raven flies along in one direction before switching to the other route at the far end.", "A fileira de 16 espaços de terreno (um por carta) que um corvo percorre numa direção, antes de trocar para a outra rota na outra ponta."],
    ["Loop", "Loop", "An extra land card added beside a flight path by the \"Add a loop\" Trickery action. Ravens must fly all the way around it via the dotted path instead of skipping it.", "Uma carta de terreno extra adicionada ao lado de uma rota de voo pela ação de Trapaça \"Adicionar um loop\". Os corvos precisam contorná-la por completo pela linha pontilhada, em vez de pulá-la."],
    ["Draw pile", "Baralho de compra", "Each player has two separate draw piles: one of their 25 flight cards, one of their 8 Loki cards. Cards drawn to end a turn, or to fill the starting hand, may come from either pile in any combination.", "Cada jogador tem dois baralhos de compra separados: um com as 25 cartas de voo, outro com as 8 cartas Loki. Cartas compradas ao fim do turno, ou para a mão inicial, podem vir de qualquer um dos dois, em qualquer combinação."],
    ["Trickery", "Trapaça", "Playing a Loki card to use one of its two printed actions. The card is removed from the game afterwards.", "Jogar uma carta Loki para usar uma de suas duas ações impressas. A carta é removida do jogo depois disso."]
  ];

  // --- Hero / about this guide ------------------------------------------

  function aboutGuide() {
    return `
      <div class="callout">${t(
        "This guide covers the full core box: there are no expansions, maps, or optional rules printed in the booklet, so there is nothing to configure before Setup. The sections below follow the two-page rulebook in order.",
        "Este guia cobre a caixa base por completo: o livreto não traz expansões, mapas ou regras opcionais, então não há nada para configurar antes da Preparação. As seções abaixo seguem o manual de 2 páginas, na ordem."
      )}</div>`;
  }

  // --- Quick reference ---------------------------------------------------

  function jump(id, label) {
    return `<button type="button" data-scroll="${id}">${label}</button>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function quickReference() {
    const cards = [
      [t("Your turn", "Seu turno"), [
        t("Play any number of Flight and/or Trickery cards, in any order, as long as you have the cards.", "Jogue quantas cartas de Voo e/ou Trapaça quiser, em qualquer ordem, enquanto tiver cartas."),
        t("Then draw 3 cards (any combination of your two piles) to end your turn.", "Depois compre 3 cartas (qualquer combinação dos seus dois baralhos) para encerrar o turno.")
      ], "flight"],
      [t("Flight action", "Ação de Voo"), [
        t("Play a flight card matching the land type of the next space(s) in front of your raven to move it there.", "Jogue uma carta de voo do mesmo tipo de terreno do(s) próximo(s) espaço(s) à frente do seu corvo para movê-lo até lá."),
        t("No matching card? Any 2 flight cards of the same type as each other substitute for the type you need.", "Sem a carta certa? Quaisquer 2 cartas de voo iguais entre si substituem o tipo que você precisa.")
      ], "flight"],
      [t("Trickery action", "Ação de Trapaça"), [
        t("Play a Loki card and choose one of its two printed actions.", "Jogue uma carta Loki e escolha uma de suas duas ações impressas."),
        t("The card is removed from the game after use — at most 8 Trickery actions all game.", "A carta é removida do jogo depois de usada — no máximo 8 ações de Trapaça no jogo todo.")
      ], "trickery"],
      [t("Hand limit", "Limite de mão"), [
        t("If you have more than 7 cards after drawing, discard down to 7 before taking any more actions.", "Se tiver mais de 7 cartas depois de comprar, descarte até ficar com 7 antes de agir de novo."),
        t("Flight cards go to your discard pile; Loki cards are removed from the game.", "Cartas de voo vão para o descarte; cartas Loki são removidas do jogo.")
      ], "ending"],
      [t("Winning", "Vitória"), [
        t("First raven to reach the final space on the opponent's side wins.", "O primeiro corvo a chegar ao espaço final do lado do oponente vence."),
        t("If that player went first, the opponent gets one last turn to tie the finish.", "Se esse jogador foi o primeiro a jogar, o oponente tem mais um turno para empatar a chegada.")
      ], "ending"],
      [t("No matching Loki target", "Sem alvo para a Trapaça"), [
        t("Any action that moves or rotates a land card cannot target a card that currently has a raven on it.", "Qualquer ação que mova ou rotacione uma carta de terreno não pode mirar uma carta que tenha um corvo em cima dela no momento.")
      ], "trickery"]
    ];
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), "01", 1)}
      <div class="quick-grid">${cards.map(([title, lines, target]) => `
        <article class="info-card"><h3>${title}</h3>${lineList(lines)}<p>${jump(target, t("Open the full rule", "Abrir a regra completa"))}</p></article>`).join("")}</div>`;
  }

  // --- Setup --------------------------------------------------------------

  function task(id, textEn, textPt, optional) {
    return { id, en: textEn, pt: textPt, optional: Boolean(optional) };
  }

  function setupPhases() {
    return [
      {
        title: t("The flight path", "A rota de voo"),
        refs: [2],
        items: [
          task("land-line", "Shuffle the 40 land cards and lay a line of 16 of them between the two players. Each card shows two stacked land spaces, forming two parallel flight paths. Check both rows: if two spaces next to each other in the same row show the same land type, rotate the newest card 180°; if they still match, replace it with a new card from the bottom of the remaining land deck instead.", "Embaralhe as 40 cartas de terreno e monte uma linha de 16 delas entre os dois jogadores. Cada carta mostra dois espaços de terreno empilhados, formando duas rotas de voo paralelas. Confira as duas fileiras: se dois espaços vizinhos na mesma fileira mostrarem o mesmo tipo de terreno, rotacione a carta mais nova 180°; se ainda assim coincidirem, substitua-a por uma nova carta do fundo do baralho restante."),
          task("ravens", "Place the 2 wooden ravens at the same end of the land-card line, each one in front of a different route. When a raven reaches the last land card of its route, it switches to the other route and flies back the opposite way.", "Coloque os 2 corvos de madeira na mesma ponta da linha de cartas de terreno, cada um na frente de uma rota diferente. Quando um corvo chega à última carta da sua rota, ele troca para a outra rota e voa de volta no sentido contrário.")
        ]
      },
      {
        title: t("Player decks", "Baralhos dos jogadores"),
        refs: [2],
        items: [
          task("decks", "Each player takes their own 25 flight cards and 8 Loki cards (one color per player), shuffles the flight cards and the Loki cards separately, and places them face down as two personal draw piles, with an empty space beside each for a discard pile.", "Cada jogador pega suas próprias 25 cartas de voo e 8 cartas Loki (uma cor por jogador), embaralha as cartas de voo e as cartas Loki separadamente, e as coloca viradas para baixo como dois baralhos de compra pessoais, com um espaço vazio ao lado de cada um para formar o descarte."),
          task("hands", "Each player draws a starting hand of 5 cards, in whichever combination of flight and Loki cards they like, from their own two draw piles.", "Cada jogador compra uma mão inicial de 5 cartas, na combinação de cartas de voo e Loki que preferir, dos seus próprios dois baralhos de compra.")
        ]
      },
      {
        title: t("Who goes first", "Quem começa"),
        refs: [2],
        items: [
          task("first-player", "Whoever lost the previous race goes first. For a group's very first game, decide any way you like (for example, at random).", "Quem perdeu a corrida anterior começa. Na primeira partida do grupo, decidam da forma que preferirem (por exemplo, por sorteio).", true)
        ]
      }
    ];
  }

  function inventoryCard(label, title, body, pages) {
    return `
      <article class="info-card">
        <span class="component-label">${label}</span>
        <h3>${title}</h3>
        <p>${body}</p>
        <div class="glossary-references">${pages.map((page) => referenceLink(page)).join(" ")}</div>
      </article>`;
  }

  function inventory() {
    const cards = [
      inventoryCard(t("RAVENS", "CORVOS"), t("2 wooden ravens", "2 corvos de madeira"), t(
        "One per player (Huginn and Muninn in the theme). Each races along the flight path in front of its owner.",
        "Um por jogador (Huginn e Muninn, no tema do jogo). Cada um corre pela rota de voo à frente do seu dono."
      ), [2]),
      inventoryCard(t("FLIGHT CARDS", "CARTAS DE VOO"), t("50 cards · 25 per player", "50 cartas · 25 por jogador"), t(
        "Each shows a land type matching one printed on the land cards. Play one matching your raven's next space to move it there.",
        "Cada uma mostra um tipo de terreno igual a algum impresso nas cartas de terreno. Jogue uma que combine com o próximo espaço do seu corvo para movê-lo até lá."
      ), [2]),
      inventoryCard(t("LOKI CARDS", "CARTAS LOKI"), t("16 cards · 8 per player", "16 cartas · 8 por jogador"), t(
        "Each offers 2 possible Trickery actions; pick one when you play the card. Removed from the game after use.",
        "Cada uma oferece 2 ações de Trapaça possíveis; escolha uma ao jogar a carta. É removida do jogo depois de usada."
      ), [1]),
      inventoryCard(t("LAND CARDS", "CARTAS DE TERRENO"), t("40 cards", "40 cartas"), t(
        "Shared by both players. 16 of them form the line between the players; the rest stay in a face-down deck to replace repeats during Setup, or to be drawn by the \"Add a loop\" Trickery action.",
        "Compartilhadas pelos dois jogadores. 16 delas formam a linha entre os jogadores; o restante fica num baralho virado para baixo, para substituir repetições na Preparação ou ser comprado pela ação de Trapaça \"Adicionar um loop\"."
      ), [2])
    ];
    return `<div class="quick-grid">${cards.join("")}</div>`;
  }

  function setupSection() {
    const phases = setupPhases();
    const tasks = phases.flatMap((phase) => phase.items);
    const valid = new Set(tasks.map((item) => item.id));
    const kept = state.setupChecks.filter((id) => valid.has(id));
    if (kept.length !== state.setupChecks.length) {
      state.setupChecks = kept;
      saveState();
    }
    const required = tasks.filter((item) => !item.optional);
    const done = required.filter((item) => state.setupChecks.includes(item.id)).length;
    const phaseMarkup = phases.map((phase, index) => `
      <article class="setup-phase">
        <header class="setup-phase-header">
          <span class="setup-phase-number">${String(index + 1).padStart(2, "0")}</span>
          <h3>${phase.title}</h3>
          <div class="setup-phase-references">${phase.refs.map((page) => referenceLink(page)).join("")}</div>
        </header>
        <ul class="setup-check-list">${phase.items.map((item) => `
          <li class="setup-check-row${item.optional ? " optional" : ""}">
            <input id="setup-check-${item.id}" type="checkbox" data-setup-check="${item.id}" ${state.setupChecks.includes(item.id) ? "checked" : ""}>
            <label for="setup-check-${item.id}">${t(item.en, item.pt)}${item.optional ? `<span class="setup-optional-label">${t("Conditional", "Condicional")}</span>` : ""}</label>
          </li>`).join("")}</ul>
      </article>`).join("");
    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), "02", 2)}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Set up this match", "Prepare esta partida")}</h3>
            <p>${t("Check each physical step as it is done. Progress is saved for this game only.", "Marque cada passo físico conforme for feito. O progresso fica salvo só neste jogo.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${required.length} required steps checked`, `${done} de ${required.length} etapas obrigatórias concluídas`)}</span>
            <progress id="setup-progress" max="${Math.max(required.length, 1)}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "“Uncheck all” clears only these boxes. Changing language does not. Who goes first is conditional and does not count toward required progress.",
          "“Desmarcar tudo” limpa só estas caixas. Trocar o idioma não limpa. Quem começa é condicional e não entra no progresso obrigatório."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}`;
  }

  // --- Flight ---------------------------------------------------------------

  function flightSection() {
    return `
      ${sectionHeading("flight", t("Goal & Flight", "Objetivo e Voo"), "03", 2)}
      <div class="turn-block"><h3>${t("Goal", "Objetivo")}</h3>
        <p>${t("The first player to use the flight paths to fly to the end of the world and back is the winner.", "O primeiro jogador a usar as rotas de voo para chegar ao fim do mundo e voltar é o vencedor.")}</p>
      </div>
      <div class="turn-block"><h3>${t("Playing the game", "Jogando a partida")}</h3>
        <p>${t("On their turn, a player can choose how many cards from their hand they want to play. Each type of card allows a different action, and players can take as many or as few actions as they like, as long as they have the right cards.", "No seu turno, o jogador escolhe quantas cartas da mão quer jogar. Cada tipo de carta permite uma ação diferente, e os jogadores podem fazer quantas ações quiserem, desde que tenham as cartas certas.")}</p>
      </div>
      <div class="turn-block"><h3>${t("Flight action", "Ação de Voo")}</h3>
        <p>${t("To move their raven, a player must play a flight card that shows the same land type as the next path space in front of their raven. If there is a row of land spaces of the same type in front of a raven, the player can use the matching flight card to move the raven over all of these spaces at once, placing it at the end of the row.", "Para mover seu corvo, o jogador precisa jogar uma carta de voo que mostre o mesmo tipo de terreno do próximo espaço da rota à frente do corvo. Se houver uma fileira de espaços do mesmo tipo à frente de um corvo, o jogador pode usar a carta correspondente para mover o corvo sobre todos esses espaços de uma vez, colocando-o no fim da fileira.")}</p>
        <p>${t("If a player has no flight cards that match the land space in front of their raven, they can use any two flight cards of the same type as though it was whichever type they need instead.", "Se um jogador não tiver cartas de voo que combinem com o espaço de terreno à frente do seu corvo, ele pode usar quaisquer duas cartas de voo iguais entre si como se fossem o tipo de que precisa.")}</p>
        ${referenceLink(2)}
      </div>
      <div class="turn-block"><h3>${t("Discards and reshuffling", "Descarte e reembaralhar")}</h3>
        <p>${t("Used flight cards are placed face up as a discard pile. If the flight-card draw pile ever runs out, shuffle its discard pile to form a new draw pile.", "As cartas de voo usadas são colocadas viradas para cima, formando um descarte. Se o baralho de compra de cartas de voo acabar, embaralhe o descarte para formar um novo baralho de compra.")}</p>
      </div>
      <div class="example-grid">
        <article class="example-card"><span class="card-number">01</span><h3>${t("Flying over several spaces", "Voando sobre vários espaços")}</h3>
          <p>${t(
            "The next three land spaces in front of a raven are all mountain. Playing a single mountain flight card lets the player move their raven across all three spaces at once, landing at the far end of that mountain row.",
            "Os três próximos espaços de terreno à frente de um corvo são todos de montanha. Jogar uma única carta de voo de montanha permite mover o corvo pelos três espaços de uma vez, pousando no fim dessa fileira de montanha."
          )}</p>
          <div class="example-source"><span>${t("Worked example from the manual", "Exemplo do manual")}</span>${referenceLink(2)}</div>
        </article>
        <article class="example-card"><span class="card-number">02</span><h3>${t("Substituting with two matching cards", "Substituindo com duas cartas iguais")}</h3>
          <p>${t(
            "A raven's next space is forest, but the player holds no forest flight cards. They play 2 flight cards of the same type as each other (for example, 2 mountain cards) instead, using them as though they were a forest card to make the move.",
            "O próximo espaço do corvo é de floresta, mas o jogador não tem cartas de voo de floresta na mão. Ele joga então 2 cartas de voo iguais entre si (por exemplo, 2 de montanha), usando-as como se fossem uma carta de floresta para fazer o movimento."
          )}</p>
          <div class="example-source"><span>${t("Worked example from the manual", "Exemplo do manual")}</span>${referenceLink(2)}</div>
        </article>
      </div>`;
  }

  // --- Trickery ---------------------------------------------------------------

  function trickerySection() {
    const groups = LOKI_CARDS.map((card) => `
      <h3 class="subhead">${t(card.titleEn, card.titlePt)}</h3>
      <div class="icon-grid">${card.options.map((option) => iconCard(option.icon, t(option.en, option.pt), t(option.en_d, option.pt_d))).join("")}</div>`).join("");
    return `
      ${sectionHeading("trickery", t("Trickery", "Trapaça"), "04", 1)}
      <p class="glossary-intro">${t(
        "Each Loki card has two different actions as options for the players. When playing a Loki card, a player must choose which of those actions they want to use. Once a Loki card is used, it is removed from the game, meaning players can never use Trickery more than 8 times in a game.",
        "Cada carta Loki tem duas ações diferentes como opções para os jogadores. Ao jogar uma carta Loki, o jogador deve escolher qual das ações quer usar. Depois de usada, a carta Loki é removida do jogo, o que significa que os jogadores nunca podem usar Trapaça mais de 8 vezes numa partida."
      )}</p>
      <p class="glossary-intro">${t(
        "Any action which moves or rotates land cards cannot be used on a card which currently has a raven on it.",
        "Qualquer ação que mova ou rotacione cartas de terreno não pode ser usada numa carta que tenha um corvo em cima dela no momento."
      )}</p>
      ${groups}
      <div class="turn-block"><h3>${t("Loops and overlapping cards", "Loops e cartas sobrepostas")}</h3>
        <p>${t("After a loop card has been played, players can use more loop cards to add to that first loop, or can rotate the loop cards as though they are land cards.", "Depois que uma carta de loop é jogada, os jogadores podem usar mais cartas de loop para somar a esse primeiro loop, ou rotacionar as cartas do loop como se fossem cartas de terreno comuns.")}</p>
        <p>${t("The loop action and the slide action will sometimes cause land cards to overlap. Always place the card being moved this turn on top of the other card. If sliding a land card onto a loop card, the additional section is now part of the loop, and the section which was covered is ignored. The land card which is partially covered can no longer be moved by any card actions — treat it as though there is a raven on it.", "A ação de loop e a ação de deslizar às vezes farão cartas de terreno se sobreporem. Sempre coloque a carta movida nesse turno por cima da outra. Se deslizar uma carta de terreno sobre uma carta de loop, a seção adicional passa a fazer parte do loop, e a seção que ficou coberta é ignorada. A carta de terreno parcialmente coberta não pode mais ser alvo de ações de carta — trate-a como se tivesse um corvo em cima.")}</p>
        ${referenceLink(1)}
      </div>`;
  }

  // --- Ending the turn / game -------------------------------------------------

  function endingSection() {
    return `
      ${sectionHeading("ending", t("Ending Your Turn & Ending the Game", "Fim do Turno e Fim da Partida"), "05", 1)}
      <div class="turn-block"><h3>${t("Ending your turn", "Encerrando seu turno")}</h3>
        <p>${t("After a player has finished playing cards, they draw 3 cards to end their turn. These cards can be taken in any order from either draw pile.", "Depois que um jogador termina de jogar cartas, ele compra 3 cartas para encerrar o turno. Essas cartas podem vir, em qualquer ordem, de qualquer um dos dois baralhos de compra.")}</p>
        <p>${t("If a player now has more than 7 cards, they must immediately choose cards to discard, without taking actions, until they have 7 cards left. As usual, flight cards would be put in the discard pile, while Loki cards would be removed from the game.", "Se o jogador ficar com mais de 7 cartas, ele deve escolher imediatamente cartas para descartar, sem realizar ações, até ficar com 7. Como de costume, cartas de voo vão para o descarte, enquanto cartas Loki são removidas do jogo.")}</p>
        ${referenceLink(1)}
      </div>
      <div class="turn-block"><h3>${t("Ending the game", "Encerrando a partida")}</h3>
        <p>${t("The game ends when a player moves their raven into the final space on their opponent's side. That player is the winner!", "A partida termina quando um jogador move seu corvo para o espaço final do lado do oponente. Esse jogador é o vencedor!")}</p>
        <p>${t("However, if that player went first, the other player has one more turn to get their raven to the finish point. If they manage it, whichever player has the most cards left in their hand wins. If it's still a tie, then the ravens must race again to determine a winner!", "Porém, se esse jogador foi o primeiro a jogar na partida, o outro jogador tem mais um turno para levar seu corvo até o ponto final. Se conseguir, vence quem tiver mais cartas na mão. Se ainda empatar, os corvos precisam correr de novo para decidir um vencedor!")}</p>
        ${referenceLink(1)}
      </div>`;
  }

  // --- Glossary ------------------------------------------------------------------

  function glossarySection() {
    const terms = GLOSSARY_TERMS.slice().sort((a, b) => a[state.language === "pt-BR" ? 1 : 0].localeCompare(b[state.language === "pt-BR" ? 1 : 0], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), "06", 2)}
      <p class="glossary-intro">${t(
        "Short meanings for the words used above.",
        "Significados curtos das palavras usadas acima."
      )}</p>
      <div class="quick-grid glossary-grid">${terms.map((item) => `
        <article class="info-card glossary-card"><span class="component-label">${t("TERM", "TERMO")}</span><h3>${t(item[0], item[1])}</h3><p>${t(item[2], item[3])}</p>
          <div class="glossary-references">${referenceLink(1)} ${referenceLink(2)}</div>
        </article>`).join("")}</div>`;
  }

  // --- Shell --------------------------------------------------------------------

  function renderHeader() {
    return `
      <header class="site-header">
        <a class="brand" href="#/" aria-label="${t("Field Manual home", "Página inicial do Manual de Campo")}">
          <span class="brand-mark" aria-hidden="true">OR</span>
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
    document.body.classList.add("theme-odins-ravens");
    document.documentElement.lang = state.language;
    document.title = t("Odin's Ravens — Field Manual", "Odin's Ravens — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Interactive rules for Odin's Ravens, the 2-player mythical race game by Thorsten Gimmler.",
        "Regras interativas de Odin's Ravens, o jogo de corrida mítica para 2 jogadores de Thorsten Gimmler."
      );
    }
    const nav = [
      ["quick-reference", t("Quick Ref", "Referência")],
      ["setup", t("Setup", "Preparação")],
      ["flight", t("Goal & Flight", "Objetivo e Voo")],
      ["trickery", t("Trickery", "Trapaça")],
      ["ending", t("Ending", "Fim de jogo")],
      ["glossary", t("Glossary", "Glossário")]
    ];
    app.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook · core game", "Livro interativo · jogo base")}</p>
          <h1>Odin's Ravens</h1>
          <p class="hero-intro">${t(
            "Every morning, Odin's two ravens, Huginn and Muninn, fly out into Midgard in opposite directions, racing to be first back to the starting point. Use flight cards to speed your raven along the path, and Loki's Trickery cards to help yourself or hinder your opponent.",
            "Toda manhã, os dois corvos de Odin, Huginn e Muninn, voam para Midgard em direções opostas, competindo para ver quem volta primeiro ao ponto de partida. Use cartas de voo para acelerar seu corvo pela rota, e as cartas de Trapaça de Loki para se ajudar ou atrapalhar o oponente."
          )}</p>
          <div class="hero-meta"><span>${t("2 players", "2 jogadores")}</span><span>${t("Mythical race game", "Jogo de corrida mítica")}</span><span>${t("~20 minutes", "~20 minutos")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/odins-ravens.webp" alt="${t("Cover of the Odin's Ravens rulebook", "Capa do manual de Odin's Ravens")}" fetchpriority="high"><figcaption>${t("Box cover", "Capa da caixa")} · Johan Egerkrans</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("Field guide", "Guia de campo")}</h2>
          ${nav.map(([id, label], index) => `<button type="button" data-scroll="${id}"><span class="toc-index">${String(index + 1).padStart(2, "0")}</span>${label}</button>`).join("")}
        </aside>
        <div class="content-column">
          ${storageNotice ? `<p class="storage-notice" role="status">${storageNoticeText()}</p>` : ""}
          ${aboutGuide()}
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${flightSection()}</section>
          <section class="rule-section">${trickerySection()}</section>
          <section class="rule-section">${endingSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal guide for Odin's Ravens. Summaries follow the official rulebook, whose PDF is included in this repository with permission. Game design by Thorsten Gimmler; cover and card art by Johan Egerkrans; Osprey Publishing, part of Bloomsbury Publishing Plc.",
        "Guia pessoal de Odin's Ravens. Os resumos seguem o manual oficial, cujo PDF está incluído neste repositório com autorização. Design do jogo por Thorsten Gimmler; arte de capa e cartas por Johan Egerkrans; Osprey Publishing, parte da Bloomsbury Publishing Plc."
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
      const phases = setupPhases();
      const tasks = phases.flatMap((phase) => phase.items);
      const required = tasks.filter((item) => !item.optional);
      const done = required.filter((item) => state.setupChecks.includes(item.id)).length;
      const progress = root.querySelector("#setup-progress");
      const label = root.querySelector("#setup-progress-label");
      if (progress) {
        progress.value = done;
      }
      if (label) {
        label.textContent = t(`${done} of ${required.length} required steps checked`, `${done} de ${required.length} etapas obrigatórias concluídas`);
      }
    }
  }

  function onInput() {
    // Odin's Ravens has no freeform text fields; nothing to do here.
  }

  window.OdinsRavens = { renderInto, onClick, onChange, onInput };
})();
