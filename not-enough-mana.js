(() => {
  "use strict";

  const STORAGE_KEY = "field-manual.not-enough-mana.v1";
  const MANUAL_FILE = "not-enough-mana_core.pdf";

  let storageAvailable = true;
  let storageNotice = "";
  let root = null;

  function defaultState() {
    return {
      language: "pt-BR",
      players: 4,
      teamGame: false,
      teamCount: 2,
      astral: false,
      manaField: "3",
      manaPerPotion: 3,
      substitute: false,
      substituteName: "",
      setupChecks: []
    };
  }

  function parseMana(field) {
    if (typeof field !== "string") {
      return null;
    }
    const trimmed = field.trim();
    if (!/^\d+$/.test(trimmed)) {
      return null;
    }
    const value = Number(trimmed);
    if (!Number.isSafeInteger(value) || value < 1) {
      return null;
    }
    return value;
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
    if (players === 3 || players === 4 || players === 5 || players === 6) {
      next.players = players;
    }
    next.teamGame = saved.teamGame === true && (next.players === 4 || next.players === 6);
    const teamCount = Number(saved.teamCount);
    if (next.teamGame && next.players === 6 && (teamCount === 2 || teamCount === 3)) {
      next.teamCount = teamCount;
    } else {
      next.teamCount = 2;
    }
    next.astral = saved.astral === true;
    if (typeof saved.manaField === "string") {
      next.manaField = saved.manaField;
    } else if (Number.isSafeInteger(saved.manaPerPotion) && saved.manaPerPotion >= 1) {
      next.manaField = String(saved.manaPerPotion);
    }
    next.manaPerPotion = parseMana(next.manaField);
    next.substitute = saved.substitute === true;
    if (typeof saved.substituteName === "string") {
      next.substituteName = saved.substituteName;
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
      console.error("Could not read Not Enough Mana match settings.", error);
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
      console.error("Could not save Not Enough Mana match settings.", error);
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
      teamGame: state.teamGame,
      teamCount: state.teamGame ? state.teamCount : 0,
      astral: state.astral,
      manaPerPotion: state.manaPerPotion,
      substitute: state.substitute,
      substituteName: state.substitute ? state.substituteName.trim() : ""
    });
  }

  function manaReady() {
    return state.manaPerPotion !== null;
  }

  function commit(mutator, restore) {
    const previous = configurationKey();
    mutator();
    state = normalizeState(state);
    if (configurationKey() !== previous) {
      state.setupChecks = [];
    }
    saveState();
    const restoreId = restore && restore.id ? restore.id : "";
    const selectionStart = restore && typeof restore.selectionStart === "number" ? restore.selectionStart : null;
    const selectionEnd = restore && typeof restore.selectionEnd === "number" ? restore.selectionEnd : null;
    if (root) {
      renderInto(root);
    }
    if (!restoreId) {
      return;
    }
    const next = document.getElementById(restoreId);
    if (!next) {
      return;
    }
    next.focus();
    if (selectionStart !== null && typeof next.setSelectionRange === "function") {
      next.setSelectionRange(selectionStart, selectionEnd);
    }
  }

  function manualUrl(page) {
    const script = document.querySelector('script[src*="not-enough-mana.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${MANUAL_FILE}`, baseUrl).href}#page=${page}`;
  }

  function referenceLink(page) {
    const label = t(`Manual p. ${page} ↗`, `Manual p. ${page} (EN) ↗`);
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

  function manaGainPhrase() {
    if (!manaReady()) {
      return t("an unset amount of mana", "uma quantidade de mana ainda não definida");
    }
    const amount = state.manaPerPotion;
    if (state.language === "pt-BR") {
      return amount === 1 ? "1 ponto de mana" : `${amount} pontos de mana`;
    }
    return amount === 1 ? "1 mana point" : `${amount} mana points`;
  }

  function drinkName() {
    if (!state.substitute) {
      return t("mana potion", "poção de mana");
    }
    const name = state.substituteName.trim();
    if (!name) {
      return t("agreed substitute", "desafio combinado");
    }
    return escapeHtml(name);
  }

  function storageNoticeText() {
    if (storageNotice === "read") {
      return t(
        "This browser could not read the saved Not Enough Mana match. The guide is showing a new default match, and it may not be possible to save changes.",
        "Este navegador não conseguiu ler a partida salva de Not Enough Mana. O guia está mostrando uma partida nova, e pode não ser possível salvar alterações."
      );
    }
    return t(
      "This browser refused to save the Not Enough Mana match. Your latest change is on screen only.",
      "Este navegador recusou salvar a partida de Not Enough Mana. A última alteração está só na tela."
    );
  }

  function renderIcons() {
    const items = [
      ["assets/not-enough-mana/health.webp", t("Health crystal", "Cristal de vida"), t("Red crystal. Each wizard draws 10 health points at setup, and 10 is the maximum. Page 8 shows these crystals beside that rule.", "Cristal vermelho. Cada mago compra 10 pontos de vida na preparação, e 10 é o máximo. A página 8 mostra estes cristais ao lado dessa regra.")],
      ["assets/not-enough-mana/mana.webp", t("Mana crystal", "Cristal de mana"), t("Blue crystal. Mana costs and mana gains use these crystals. There is no printed cap on how many a wizard may hold.", "Cristal azul. Custos e ganhos de mana usam estes cristais. O livreto não impõe um teto de mana.")],
      ["assets/not-enough-mana/card-back.webp", t("Card back", "Verso da carta"), t("The draw pile is face-down. The booklet's equipment page shows this back on the deck.", "O monte de compra fica virado para baixo. A página de equipamento mostra este verso no baralho.")],
      ["assets/not-enough-mana/fire.webp", t("Fire spell", "Feitiço de fogo"), t("Offensive spells come in fire, ice, and electric variants. A cost can ask you to discard a fire spell from your hand.", "Feitiços ofensivos vêm em fogo, gelo e elétrico. Um custo pode pedir que você descarte um feitiço de fogo da mão.")],
      ["assets/not-enough-mana/ice.webp", t("Ice spell", "Feitiço de gelo"), t("The blue triangle marks an ice spell in the booklet's type spread. The effect is printed on each card.", "O triângulo azul marca um feitiço de gelo na página de tipos. O efeito está impresso em cada carta.")],
      ["assets/not-enough-mana/electric.webp", t("Electric spell", "Feitiço elétrico"), t("The annotated sample on page 11 is an electric spell. Its callout says all other wizards lose 2 health points.", "O exemplo anotado da página 11 é um feitiço elétrico. A legenda diz que todos os outros magos perdem 2 pontos de vida.")],
      ["assets/not-enough-mana/cost-mana.webp", t("Mana cost", "Custo de mana"), t("A blue drop shows mana crystals spent to play a card. The sample cost discards 2 mana crystals.", "A gota azul mostra cristais de mana gastos para jogar uma carta. O custo do exemplo descarta 2 cristais de mana.")],
      ["assets/not-enough-mana/cost-spell.webp", t("Spell cost", "Custo em feitiço"), t("A triangle in a circle shows a spell discarded from hand as part of the cost. The sample asks for 1 fire spell.", "Um triângulo no círculo mostra um feitiço descartado da mão como parte do custo. O exemplo pede 1 feitiço de fogo.")],
      ["assets/not-enough-mana/defensive.webp", t("Defensive spell", "Feitiço defensivo"), t("Defensive spells protect against attacks. You may cast one outside your turn, in response to an opponent's spell.", "Feitiços defensivos protegem contra ataques. Você pode lançar um fora do seu turno, em resposta a um feitiço de um oponente.")],
      ["assets/not-enough-mana/supporting.webp", t("Supporting spell", "Feitiço de suporte"), t("Supporting spells replenish health, strengthen mana potions, switch hands, and do more. The exact effect is on the card.", "Feitiços de suporte recuperam vida, fortalecem poções de mana, trocam mãos e fazem mais. O efeito exato está na carta.")],
      ["assets/not-enough-mana/curse.webp", t("Curse", "Maldição"), t("Curses deplete another wizard's mana. Some curses stay on the board while they remain in power.", "Maldições drenam a mana de outro mago. Algumas permanecem na mesa enquanto estiverem em vigor.")],
      ["assets/not-enough-mana/artifact.webp", t("Artifact", "Artefato"), t("After you equip an artifact, it stays on the board in front of its owner and gives a lasting benefit.", "Depois de equipado, o artefato fica na mesa à frente do dono e concede um benefício contínuo.")]
    ];
    return `
      ${sectionHeading("iconography", t("Iconography", "Iconografia"), "01", 11)}
      <p class="glossary-intro">${t(
        "These marks are cropped from the official booklet. Events have no separate symbol there: the card itself says Event. Spell, curse, artifact, and event effects that are not spelled out below are printed on those cards; this booklet does not list them.",
        "Estas marcas foram recortadas do livreto oficial. Eventos não têm um símbolo separado: a própria carta diz Event. Efeitos de feitiço, maldição, artefato e evento que não estão escritos abaixo estão impressos nas cartas; este livreto não os lista."
      )}</p>
      <div class="icon-grid">${items.map((item) => iconCard(...item)).join("")}</div>
      <div class="source-note">${referenceLink(7)} ${referenceLink(11)} ${referenceLink(12)} ${referenceLink(13)}</div>`;
  }

  function jump(id, label) {
    return `<button type="button" data-scroll="${id}">${label}</button>`;
  }

  function quickReference() {
    const cards = [
      [t("Win", "Vitória"), state.teamGame
        ? t("The last team still in the fight wins. A wizard is eliminated at 0 health, or with Too Much Mana when they cannot continue.", "A última equipe ainda na luta vence. Um mago é eliminado com 0 de vida, ou com Mana demais quando não consegue continuar.")
        : t("The last wizard on the battlefield wins. A wizard is eliminated at 0 health, or with Too Much Mana when they cannot continue.", "O último mago no campo vence. Um mago é eliminado com 0 de vida, ou com Mana demais quando não consegue continuar."), "victory"],
      [t("Start", "Início"), state.teamGame
        ? t(`The eldest wizard starts. Opposing teams then take turns interchangeably. This match has ${state.players} wizards in ${state.teamCount} teams.`, `O mago mais velho começa. Em seguida, equipes opostas jogam de forma intercalada. Esta partida tem ${state.players} magos em ${state.teamCount} equipes.`)
        : t("The eldest wizard starts. Then play passes clockwise.", "O mago mais velho começa. Depois, a vez segue no sentido horário."), "turns"],
      [t("Your turn", "Seu turno"), t("Draw up to your hand limit, usually 5. Then play, discard, and/or exchange any number of cards, in any order. Announce the end of the turn.", "Compre até o limite da mão, em geral 5. Depois jogue, descarte e/ou troque qualquer quantidade de cartas, em qualquer ordem. Anuncie o fim do turno."), "turns"],
      [t("Drink", "Beber"), t(`A ${drinkName()} may be used at any time, even outside your turn. It grants ${manaGainPhrase()}, unless the common pool has no mana crystals.`, `Uma ${drinkName()} pode ser usada a qualquer momento, mesmo fora do seu turno. Ela concede ${manaGainPhrase()}, salvo se a reserva comum não tiver cristais de mana.`), "turns"],
      [t("Play a card", "Jogar uma carta"), t("Put it on the table, pay its cost, speak the incantation, indicate a target if it needs one, then apply the text on the card.", "Coloque-a na mesa, pague o custo, fale o encantamento, indique um alvo se ela exigir, e aplique o texto da carta."), "turns"],
      [t("Defense", "Defesa"), t("A defensive spell may be cast outside your turn, in response to a spell cast by an opponent. It still uses the normal play steps.", "Um feitiço defensivo pode ser lançado fora do seu turno, em resposta a um feitiço de um oponente. Ele ainda segue os passos normais de jogo."), "turns"],
      [t("Exchange", "Troca"), t("Discard the card, pay mana, and draw one card. The first exchange of a turn costs 1 mana. Each later exchange that turn costs 1 more than the previous one.", "Descarte a carta, pague mana e compre uma carta. A primeira troca do turno custa 1 de mana. Cada troca seguinte naquele turno custa 1 a mais que a anterior."), "turns"],
      [t("Empty hand", "Mão vazia"), t("If a card tells you to discard a card and your hand is empty, you lose 1 mana point instead.", "Se uma carta manda descartar uma carta e sua mão está vazia, você perde 1 ponto de mana no lugar."), "turns"]
    ];
    if (state.astral) {
      cards.push([t("Astral", "Astral"), t("A defeated wizard becomes an astral being and may drink to drain mana from the living wizards. One drink drains 1 mana point from all wizards.", "Um mago derrotado vira um ser astral e pode beber para drenar mana dos magos vivos. Uma dose drena 1 ponto de mana de todos os magos."), "victory"]);
    }
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), "02", 10)}
      <div class="quick-grid">${cards.map(([title, body, target]) => `
        <article class="info-card"><h3>${title}</h3><p>${body}</p><p>${jump(target, t("Open the full rule", "Abrir a regra completa"))}</p></article>`).join("")}</div>
      <div class="callout">${t(
        "The six quick-reference cards in the box are not transcribed in the booklet. Use the card in front of you for any reminder printed only there. There is no separate quick reference per team: every wizard uses the same turn, and the team rule only changes who plays next and who wins.",
        "As seis cartas de referência da caixa não estão transcritas no livreto. Use a carta à sua frente para qualquer lembrete impresso só nela. Não há uma referência separada por equipe: todos usam o mesmo turno, e a regra de equipes só muda quem joga em seguida e quem vence."
      )}</div>`;
  }

  function task(id, text, optional) {
    return { id, text, optional: Boolean(optional) };
  }

  function setupPhases() {
    const healthOut = state.players * 10;
    const healthLeft = 70 - healthOut;
    const drink = drinkName();
    const phases = [
      {
        title: t("The deck", "O baralho"),
        refs: [8],
        items: [
          task("set-aside", t(
            "Set aside the 6 quick-reference cards, the 4 blank cards, and the Anti-Joker. Preparation does not tell you to shuffle those 11 cards into the deck.",
            "Separe as 6 cartas de referência, as 4 cartas em branco e o Anti-Joker. A preparação não manda embaralhar essas 11 cartas no baralho."
          )),
          task("shuffle", t(
            "Shuffle the other 154 cards (121 spells, 22 artifacts, and 11 events) and place them face-down in the middle of the table. That is the draw pile.",
            "Embaralhe as outras 154 cartas (121 feitiços, 22 artefatos e 11 eventos) e coloque-as viradas para baixo no meio da mesa. Esse é o monte de compra."
          )),
          task("discard-space", t(
            "Leave the space beside the draw pile empty. Discarded cards go there face-up. That space is the discard pile.",
            "Deixe vazio o espaço ao lado do monte de compra. Cartas descartadas vão para lá, viradas para cima. Esse espaço é o monte de descarte."
          ))
        ]
      },
      {
        title: t("Shared supplies", "Reserva comum"),
        refs: [7, 8],
        items: [
          task("health-pool", t(
            "Put all 70 red health crystals where every wizard can reach them.",
            "Coloque os 70 cristais vermelhos de vida onde todos os magos possam alcançá-los."
          )),
          task("mana-pool", t(
            "Put all 70 blue mana crystals where every wizard can reach them. Wizards do not take mana during setup.",
            "Coloque os 70 cristais azuis de mana onde todos os magos possam alcançá-los. Magos não recebem mana na preparação."
          )),
          task("potions", state.substitute
            ? t(
              `Put the agreed substitute (${drink}) where the mana potions would go. Potions are not in the box. Each use still grants ${manaGainPhrase()}.`,
              `Coloque o desafio combinado (${drink}) onde ficariam as poções de mana. As poções não vêm na caixa. Cada uso ainda concede ${manaGainPhrase()}.`
            )
            : t(
              `Put the mana potions where every wizard can reach them. They are not in the box. The Institute suggests 40% mana essence potency. Each potion grants ${manaGainPhrase()}.`,
              `Coloque as poções de mana onde todos os magos possam alcançá-las. Elas não vêm na caixa. O Instituto sugere 40% de essência de mana. Cada poção concede ${manaGainPhrase()}.`
            ))
        ]
      },
      {
        title: t("Each wizard", "Cada mago"),
        refs: [8],
        items: [
          task("deal-health", t(
            `Each of the ${state.players} wizards takes 10 red health crystals. That is ${healthOut} crystals in all, and ${healthLeft} stay in the common pool. Ten is the maximum health.`,
            `Cada um dos ${state.players} magos pega 10 cristais vermelhos de vida. São ${healthOut} cristais no total, e ${healthLeft} ficam na reserva. Dez é o máximo de vida.`
          )),
          task("deal-hands", t(
            `Each of the ${state.players} wizards draws 5 cards from the draw pile.`,
            `Cada um dos ${state.players} magos compra 5 cartas do monte de compra.`
          )),
          task("replace-events", t(
            "If an event card appears in a starting hand, put that event face-up on the discard pile and draw a replacement. Repeat until that hand has no event. Do not read or apply the event.",
            "Se uma carta de evento aparecer numa mão inicial, coloque esse evento virado para cima no descarte e compre outra carta. Repita até essa mão não ter evento. Não leia nem aplique o evento."
          ), true)
        ]
      },
      {
        title: t("Who starts", "Quem começa"),
        refs: state.teamGame ? [9, 14] : [9],
        items: [
          task("eldest", t(
            "Identify the eldest wizard. That wizard takes the first turn.",
            "Identifique o mago mais velho. Esse mago faz o primeiro turno."
          ))
        ]
      }
    ];
    if (state.teamGame) {
      phases[3].items.push(task("teams", t(
        `Agree which wizards form each of the ${state.teamCount} teams. The booklet does not assign the groups or the seats. Opposing teams will take turns interchangeably, and any spell may target any wizard.`,
        `Combine quais magos formam cada uma das ${state.teamCount} equipes. O livreto não define os grupos nem os lugares. Equipes opostas jogam de forma intercalada, e qualquer feitiço pode mirar qualquer mago.`
      )));
    }
    return phases;
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
            <label for="setup-check-${item.id}">${item.text}${item.optional ? `<span class="setup-optional-label">${t("Conditional", "Condicional")}</span>` : ""}</label>
          </li>`).join("")}</ul>
      </article>`).join("");
    const warning = manaReady() ? "" : `<p class="configuration-warning" role="status">${t(
      "Set how much mana each potion grants before treating this as a ready match. The booklet's default is 3.",
      "Defina quanto de mana cada poção concede antes de tratar isto como uma partida pronta. O padrão do livreto é 3."
    )}</p>`;
    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), "03", 8)}
      ${warning}
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
          "Changing the wizard count, team variant, astral variant, mana per potion, or potion substitute clears this checklist. “Uncheck all” clears only these boxes. Changing language does not. The event replacement is conditional and does not count toward required progress.",
          "Mudar a quantidade de magos, a variante de equipes, a conjunção astral, a mana por poção ou o substituto da poção limpa esta lista. “Desmarcar tudo” limpa só estas caixas. Trocar o idioma não limpa. A troca de evento é condicional e não entra no progresso obrigatório."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}`;
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
    const healthOut = state.players * 10;
    const cards = [
      inventoryCard(t("DRAW", "COMPRA"), t("Draw pile · 154 cards", "Monte de compra · 154 cartas"), t(
        "121 spells, 22 artifacts, and 11 events, shuffled face-down. The 6 quick-reference cards, 4 blank cards, and 1 Anti-Joker stay out of this pile because the booklet never tells you to draw them during preparation.",
        "121 feitiços, 22 artefatos e 11 eventos, embaralhados e virados para baixo. As 6 cartas de referência, as 4 cartas em branco e o Anti-Joker ficam fora deste monte porque o livreto nunca manda comprá-los na preparação."
      ), [7, 8]),
      inventoryCard(t("HEALTH", "VIDA"), t(`${healthOut} red crystals dealt`, `${healthOut} cristais vermelhos distribuídos`), t(
        `Each wizard holds 10. The other ${70 - healthOut} red crystals stay in the shared pool. Health cannot rise above 10 under the printed maximum.`,
        `Cada mago fica com 10. Os outros ${70 - healthOut} cristais vermelhos permanecem na reserva. Pela regra impressa, a vida não passa de 10.`
      ), [7, 8]),
      inventoryCard(t("MANA", "MANA"), t("70 blue crystals in the pool", "70 cristais azuis na reserva"), t(
        "None are dealt at setup. Potions and card effects move them. If this pool is empty, a potion grants no mana points.",
        "Nenhum é distribuído na preparação. Poções e efeitos de carta os movem. Se esta reserva esvaziar, uma poção não concede pontos de mana."
      ), [7, 9]),
      inventoryCard(t("DRINK", "BEBIDA"), state.substitute ? t("Agreed substitute", "Desafio combinado") : t("Mana potions", "Poções de mana"), state.substitute
        ? t(`Use ${drinkName()} in place of potions. The booklet does not set how many servings to bring. Each use grants ${manaGainPhrase()}.`, `Use ${drinkName()} no lugar das poções. O livreto não define quantas doses trazer. Cada uso concede ${manaGainPhrase()}.`)
        : t(`Bring potions of the wizards' choice. They are not components in the box. The suggested potency is 40%. Each potion grants ${manaGainPhrase()}.`, `Traga poções à escolha dos magos. Elas não são componentes da caixa. A potência sugerida é 40%. Cada poção concede ${manaGainPhrase()}.`), [7, 9]),
      inventoryCard(t("ASIDE", "À PARTE"), t("11 cards kept out", "11 cartas separadas"), t(
        "6 quick-reference cards, 4 blank cards for forging your own spells, and 1 Anti-Joker. The booklet does not give a forging procedure, and the Anti-Joker's effect is only on that card.",
        "6 cartas de referência, 4 cartas em branco para forjar seus próprios feitiços e 1 Anti-Joker. O livreto não traz um procedimento de forja, e o efeito do Anti-Joker está só nessa carta."
      ), [7])
    ];
    return `<div class="quick-grid">${cards.join("")}</div>`;
  }

  function victorySection() {
    const standard = state.teamGame
      ? t(
        `With the team variant on, the last of the ${state.teamCount} teams still fighting wins. Spells may target any wizard, including someone on the caster's team. Damage still follows the ordinary rules.`,
        `Com a variante de equipes ligada, a última das ${state.teamCount} equipes ainda lutando vence. Feitiços podem mirar qualquer mago, inclusive alguém da equipe de quem lança. O dano continua seguindo as regras normais.`
      )
      : t(
        "The battle ends when the last wizard remains on the battlefield. That wizard wins.",
        "A batalha termina quando o último mago permanece no campo. Esse mago vence."
      );
    const astral = state.astral
      ? t(
        "Astral conjunction is on. A defeated wizard becomes an astral being and may drink in order to drain mana from the living players. One drink drains 1 mana point from all wizards. The booklet says both “living players” and “all wizards,” and it does not say whether an astral being can win or whether other astral beings lose that mana. Do not add that missing rule at the table without agreeing it yourselves; it is the booklet's third variant, not a printed answer.",
        "A conjunção astral está ligada. Um mago derrotado vira um ser astral e pode beber para drenar mana dos jogadores vivos. Uma dose drena 1 ponto de mana de todos os magos. O livreto diz tanto “jogadores vivos” quanto “todos os magos”, e não diz se um ser astral pode vencer nem se outros seres astrais perdem essa mana. Não completem essa lacuna como se fosse regra impressa; a terceira variante do livreto é inventar a própria regra."
      )
      : t(
        "Astral conjunction is off. Defeated wizards leave the fight and do not keep drinking to drain mana.",
        "A conjunção astral está desligada. Magos derrotados saem da luta e não continuam bebendo para drenar mana."
      );
    return `
      ${sectionHeading("victory", t("Victory", "Vitória"), "04", state.teamGame ? 14 : 9)}
      <div class="victory-grid">
        <article class="info-card"><h3>${t("Who wins", "Quem vence")}</h3><p>${standard}</p></article>
        <article class="info-card"><h3>${t("Eliminated", "Eliminação")}</h3><p>${t(
          "You are eliminated when you lose all health points, or when you have Too Much Mana and cannot continue the fight. Too Much Mana is also called K.O. The booklet gives no crystal total for it: it is the wizard being unable to continue.",
          "Você é eliminado ao perder todos os pontos de vida, ou ao ter Mana demais e não conseguir continuar a luta. Mana demais também se chama K.O. O livreto não dá um total de cristais para isso: é o mago não conseguir continuar."
        )}</p></article>
        <article class="info-card"><h3>${t("Astral beings", "Seres astrais")}</h3><p>${astral}</p></article>
      </div>
      <div class="source-note">${referenceLink(6)} ${referenceLink(9)} ${referenceLink(14)}</div>`;
  }

  function turnsSection() {
    const order = state.teamGame
      ? t(
        `The eldest wizard takes the first turn. After that, wizards from opposing teams play interchangeably. This match uses ${state.teamCount} teams. The booklet does not give a seating chart or say whether the eldest wizard's team must play first beyond that wizard's own first turn.`,
        `O mago mais velho faz o primeiro turno. Depois, magos de equipes opostas jogam de forma intercalada. Esta partida usa ${state.teamCount} equipes. O livreto não traz um mapa de assentos nem diz se a equipe do mago mais velho precisa jogar primeiro além do próprio primeiro turno dele.`
      )
      : t(
        "The eldest wizard takes the first turn. Play then passes clockwise.",
        "O mago mais velho faz o primeiro turno. A vez segue no sentido horário."
      );
    return `
      ${sectionHeading("turns", t("Turns", "Turnos"), "05", 10)}
      <div class="turn-block"><h3>${t("Who plays", "Quem joga")}</h3><p>${order}</p>${referenceLink(state.teamGame ? 14 : 9)}</div>
      <div class="turn-block"><h3>${t("1. Draw", "1. Comprar")}</h3>
        <p>${t("At the start of your turn, draw cards until your hand reaches its limit. The usual limit is 5. An event or artifact card may raise it; the new number is printed on that card, not in this booklet.", "No início do seu turno, compre cartas até a mão atingir o limite. O limite usual é 5. Uma carta de evento ou artefato pode aumentá-lo; o novo número está impresso nessa carta, não neste livreto.")}</p>
        <p>${t("If the draw is an event, read it aloud, put it in the middle of the table, apply its effect, and draw a replacement. This is not the starting-hand rule. During setup, an event is discarded without being resolved.", "Se a compra for um evento, leia-o em voz alta, coloque-o no meio da mesa, aplique o efeito e compre outra carta. Esta não é a regra da mão inicial. Na preparação, um evento é descartado sem ser resolvido.")}</p>
        <p>${t("If the draw pile is empty when a draw is needed, shuffle the discard pile and it becomes the new draw pile. Cards still on the board are not in that pile.", "Se o monte de compra acabar quando uma compra for necessária, embaralhe o monte de descarte e ele vira o novo monte de compra. Cartas que ainda estão na mesa não entram nesse monte.")}</p>
        ${referenceLink(10)}
      </div>
      <div class="turn-block"><h3>${t("2. Play, discard, exchange", "2. Jogar, descartar, trocar")}</h3>
        <p>${t("You may play, discard, and/or exchange any number of cards, in any order.", "Você pode jogar, descartar e/ou trocar qualquer quantidade de cartas, em qualquer ordem.")}</p>
        <div class="action-grid">
          <article class="action-card"><strong>${t("Play", "Jogar")}</strong><p>${t("Put the card on the table, pay its cost, speak the incantation, and indicate the target if the card needs one. Then apply the effect printed on the card. Any spell that needs a target may target you. When the effect is finished, put that card and the cards spent to pay it face-up on top of the discard pile. The sample cost discards mana crystals as well as a card; the booklet says the spent cards go to the discard pile, and it does not say whether spent crystals return to the common pool or leave play.", "Coloque a carta na mesa, pague o custo, fale o encantamento e indique o alvo se a carta exigir. Depois aplique o efeito impresso na carta. Qualquer feitiço que precise de alvo pode mirar você. Quando o efeito terminar, coloque essa carta e as cartas gastas para pagá-la viradas para cima no topo do descarte. O custo do exemplo também descarta cristais de mana; o livreto manda as cartas gastas para o descarte, e não diz se os cristais gastos voltam à reserva ou saem do jogo.")}</p></article>
          <article class="action-card"><strong>${t("Stay in play", "Permanecem em jogo")}</strong><p>${t("Cards with a lasting, continuous, or delayed effect stay on the board while they remain in power. The booklet names artifacts and some curses and events as examples.", "Cartas com efeito duradouro, contínuo ou atrasado ficam na mesa enquanto permanecerem em vigor. O livreto cita artefatos e algumas maldições e eventos como exemplos.")}</p></article>
          <article class="action-card"><strong>${t("Discard", "Descartar")}</strong><p>${t("Place the card face-up on the discard pile. No mana cost is printed for a plain discard.", "Coloque a carta virada para cima no descarte. Não há custo de mana impresso para um descarte simples.")}</p></article>
          <article class="action-card"><strong>${t("Exchange", "Trocar")}</strong><p>${t("Discard the chosen card, pay the exchange cost, and draw one card from the deck. The first exchange in a turn costs 1 mana point. Each following exchange in that same turn costs 1 mana point more than the one before it.", "Descarte a carta escolhida, pague o custo da troca e compre uma carta do baralho. A primeira troca de um turno custa 1 ponto de mana. Cada troca seguinte no mesmo turno custa 1 ponto de mana a mais que a anterior.")}</p></article>
          <article class="action-card"><strong>${t("Defensive timing", "Momento da defesa")}</strong><p>${t("You may cast a defensive spell even outside your turn, in response to a spell an opponent casts. Pay its cost and follow its text. The booklet does not define a stack, priority, or whether the response happens before the attack's effect.", "Você pode lançar um feitiço defensivo mesmo fora do seu turno, em resposta a um feitiço lançado por um oponente. Pague o custo e siga o texto. O livreto não define uma pilha, prioridade, nem se a resposta acontece antes do efeito do ataque.")}</p></article>
          <article class="action-card"><strong>${t("End", "Fim")}</strong><p>${t("When you have done the actions you want, announce the end of your turn.", "Quando tiver feito as ações que queria, anuncie o fim do seu turno.")}</p></article>
        </div>
        ${referenceLink(10)} ${referenceLink(11)} ${referenceLink(12)}
      </div>
      <div class="turn-block"><h3>${t("Potions and mana debt", "Poções e dívida de mana")}</h3>
        <p>${t(`You may use a ${drinkName()} at any moment, including outside your turn. Each use grants ${manaGainPhrase()}. The booklet's printed default is 3, and it allows the table to change that value and the potion's potency. There is no limit to how much mana a wizard can hold. If the common pool has no mana crystals, the drink grants no points.`, `Você pode usar uma ${drinkName()} a qualquer momento, inclusive fora do seu turno. Cada uso concede ${manaGainPhrase()}. O padrão impresso do livreto é 3, e ele permite à mesa mudar esse valor e a potência da poção. Não há limite de mana que um mago pode acumular. Se a reserva comum não tiver cristais de mana, a bebida não concede pontos.`)}</p>
        <p>${t("If you must lose more mana than you currently have, immediately replenish your mana by drinking a potion, or lose health points equal to the missing mana. The booklet does not say to keep drinking until the whole gap is covered, and it does not say what remains unpaid if one drink restores less mana than you owed.", "Se você precisar perder mais mana do que tem, recupere mana imediatamente bebendo uma poção, ou perca pontos de vida iguais à mana que falta. O livreto não manda continuar bebendo até cobrir toda a diferença, e não diz o que fica sem pagar se uma dose devolver menos mana do que a dívida.")}</p>
        <p>${t("If an effect forces you to discard a card and your hand is empty, lose 1 mana point instead. The debt rule above is the general rule for losing mana you do not have.", "Se um efeito obrigar você a descartar uma carta e sua mão estiver vazia, perca 1 ponto de mana no lugar. A regra de dívida acima é a regra geral para perder mana que você não tem.")}</p>
        ${referenceLink(9)} ${referenceLink(11)}
      </div>
      <div class="turn-block"><h3>${t("Card types in this match", "Tipos de carta nesta partida")}</h3>
        <div class="action-grid">
          <article class="action-card"><strong>${t("Offensive", "Ofensivos")}</strong><p>${t("Fire, ice, and electric spells. Make your foes suffer. The numbers and extra conditions are on each card.", "Feitiços de fogo, gelo e elétrico. Faça seus inimigos sofrerem. Os números e as condições extras estão em cada carta.")}</p></article>
          <article class="action-card"><strong>${t("Defensive", "Defensivos")}</strong><p>${t("Protection against attacks, including the out-of-turn response above.", "Proteção contra ataques, incluindo a resposta fora do turno descrita acima.")}</p></article>
          <article class="action-card"><strong>${t("Supporting", "Suporte")}</strong><p>${t("Replenish health, strengthen mana potions, switch hands with other wizards, and more.", "Recuperar vida, fortalecer poções de mana, trocar de mão com outros magos e mais.")}</p></article>
          <article class="action-card"><strong>${t("Curses", "Maldições")}</strong><p>${t("Deplete a foe's mana. Some stay on the board while in power.", "Drenam a mana de um inimigo. Algumas ficam na mesa enquanto estiverem em vigor.")}</p></article>
          <article class="action-card"><strong>${t("Artifacts", "Artefatos")}</strong><p>${t("Once equipped, an artifact stays in front of its owner and provides a lasting benefit.", "Depois de equipado, o artefato fica à frente do dono e concede um benefício contínuo.")}</p></article>
          <article class="action-card"><strong>${t("Events", "Eventos")}</strong><p>${t("Modify the rules and affect every wizard. Resolve a newly drawn event immediately, as described in the draw step. Their individual texts are on the 11 event cards.", "Modificam as regras e afetam todos os magos. Resolva um evento recém-comprado imediatamente, como descrito na compra. Os textos individuais estão nas 11 cartas de evento.")}</p></article>
        </div>
        ${referenceLink(12)} ${referenceLink(13)}
      </div>`;
  }

  function examplesSection() {
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), "06", 11)}
      <div class="example-grid">
        <article class="example-card"><span class="card-number">01</span><h3>${t("Read the annotated spell", "Ler o feitiço anotado")}</h3>
          <p>${t("Page 11 annotates one electric spell instead of listing every card. The type callout says it is an electric spell. The cost callout says to discard 2 mana crystals and 1 fire spell from your hand. The effect callout says all other wizards lose 2 health points. The card also has a name and an incantation; speak the incantation printed on it. No separate target is required by that effect, because it already names every wizard except the caster.", "A página 11 anota um feitiço elétrico em vez de listar todas as cartas. A legenda de tipo diz que é um feitiço elétrico. A legenda de custo manda descartar 2 cristais de mana e 1 feitiço de fogo da mão. A legenda de efeito diz que todos os outros magos perdem 2 pontos de vida. A carta também tem um nome e um encantamento; fale o encantamento impresso nela. Esse efeito não pede um alvo separado, porque já nomeia todos os magos exceto quem lançou.")}</p>
          <div class="example-source"><span>${t("Worked example from the booklet", "Exemplo do livreto")}</span>${referenceLink(11)}</div>
        </article>
        <article class="example-card"><span class="card-number">02</span><h3>${t("Resolve it, then clean up", "Resolva e depois recolha")}</h3>
          <p>${t("Put the spell on the table, discard the 2 mana crystals and the fire spell, speak the incantation, and each other wizard loses 2 health. A wizard who reaches 0 health is eliminated. After the effect, the played spell and the fire spell paid as cost go face-up on top of the discard pile. The booklet does not say where the 2 mana crystals go after they are discarded.", "Coloque o feitiço na mesa, descarte os 2 cristais de mana e o feitiço de fogo, fale o encantamento, e cada outro mago perde 2 de vida. Um mago que chegar a 0 de vida é eliminado. Depois do efeito, o feitiço jogado e o feitiço de fogo pago como custo vão virados para cima para o topo do descarte. O livreto não diz para onde vão os 2 cristais de mana depois de descartados.")}</p>
          <div class="example-source"><span>${t("Same annotated card", "A mesma carta anotada")}</span>${referenceLink(11)}</div>
        </article>
        <article class="example-card"><span class="card-number">03</span><h3>${t("Opening hand with an event", "Mão inicial com evento")}</h3>
          <p>${t("While dealing the five starting cards, an event is not played. Put it on the discard pile and draw another card. Later, when a wizard draws an event at the start of a turn, they read it aloud, leave it in the middle, apply it, and draw a replacement. Those are two different instructions.", "Enquanto se distribuem as cinco cartas iniciais, um evento não é jogado. Coloque-o no descarte e compre outra carta. Mais tarde, quando um mago compra um evento no início do turno, ele o lê em voz alta, deixa-o no meio, aplica-o e compra outra carta. São duas instruções diferentes.")}</p>
          <div class="example-source"><span>${t("Setup and the turn draw", "Preparação e a compra do turno")}</span>${referenceLink(8)} ${referenceLink(10)}</div>
        </article>
      </div>
      <div class="source-note">${t(
        "The opening story, the other card pictures, and the invitation to invent a variant are not extra rules. Effects printed only on a card stay on that card. This guide does not fill those gaps.",
        "A história de abertura, as outras ilustrações de cartas e o convite para inventar uma variante não são regras extras. Efeitos impressos só numa carta permanecem nessa carta. Este guia não preenche essas lacunas."
      )}</div>`;
  }

  function glossarySection() {
    const terms = [
      ["Anti-Joker", "Anti-Joker", "One extra card in the box. Its effect is printed on the card. The booklet does not explain it and does not tell you to shuffle it into the draw pile.", "Uma carta extra da caixa. O efeito está impresso nela. O livreto não o explica e não manda embaralhá-la no monte de compra.", [7]],
      ["Artifact", "Artefato", "A card that, once equipped, stays in front of its owner and gives a lasting benefit. There are 22.", "Carta que, depois de equipada, fica à frente do dono e concede um benefício contínuo. Há 22.", [7, 13]],
      ["Curse", "Maldição", "A card that depletes a foe's mana. Some curses stay on the board while they remain in power.", "Carta que drena a mana de um inimigo. Algumas maldições ficam na mesa enquanto estiverem em vigor.", [11, 13]],
      ["Discard pile", "Monte de descarte", "The face-up pile beside the draw pile. Played cards and cards spent as costs go on top of it after the effect, unless the card stays in play.", "O monte virado para cima ao lado do monte de compra. Cartas jogadas e cartas gastas como custo vão para o topo depois do efeito, salvo se a carta permanecer em jogo.", [8, 11]],
      ["Draw pile", "Monte de compra", "The face-down deck in the middle of the table. When it is empty, shuffle the discard pile to replace it.", "O baralho virado para baixo no meio da mesa. Quando acaba, embaralhe o descarte para substituí-lo.", [8, 10]],
      ["Event", "Evento", "A card that changes the rules for every wizard. In a starting hand it is discarded and replaced. On a turn it is read aloud, placed in the center, resolved, and replaced. There are 11.", "Carta que muda as regras para todos os magos. Na mão inicial ela é descartada e substituída. No turno ela é lida em voz alta, colocada no centro, resolvida e substituída. Há 11.", [7, 8, 10, 13]],
      ["Exchange", "Troca", "Discard one card, pay mana, and draw one card. The first exchange of your turn costs 1 mana, and each later exchange that turn costs 1 more.", "Descarte uma carta, pague mana e compre uma carta. A primeira troca do seu turno custa 1 de mana, e cada troca seguinte naquele turno custa 1 a mais.", [12]],
      ["Hand limit", "Limite de mão", "You draw up to this number at the start of your turn. It is usually 5. A card can increase it; that card states the new number.", "Você compra até esse número no início do seu turno. Em geral é 5. Uma carta pode aumentá-lo; essa carta informa o novo número.", [10]],
      ["Health point", "Ponto de vida", "Tracked with red crystals. Each wizard starts with 10, which is also the maximum. Losing the last one eliminates that wizard.", "Marcado com cristais vermelhos. Cada mago começa com 10, que também é o máximo. Perder o último elimina esse mago.", [8, 9]],
      ["Incantation", "Encantamento", "The words on a spell card. Speak them when you play the spell.", "As palavras numa carta de feitiço. Fale-as ao jogar o feitiço.", [10, 11]],
      ["Mana point", "Ponto de mana", "Tracked with blue crystals. Potions add the amount chosen for this match. There is no maximum. If you must lose more than you have, drink or lose that much health.", "Marcado com cristais azuis. Poções somam a quantidade escolhida para esta partida. Não há máximo. Se você precisar perder mais do que tem, beba ou perca essa quantidade de vida.", [9, 11]],
      ["Mana potion", "Poção de mana", "Not included in the box. Usable at any time, even outside your turn. The printed gain is 3 mana, and the table may change it. Suggested potency is 40%. A substitute challenge uses the same timing and the same gain.", "Não vem na caixa. Pode ser usada a qualquer momento, mesmo fora do seu turno. O ganho impresso é 3 de mana, e a mesa pode mudá-lo. A potência sugerida é 40%. Um desafio substituto usa o mesmo momento e o mesmo ganho.", [7, 9]],
      ["Target", "Alvo", "Name the target when the card requires one. A spell that needs a target may target its caster.", "Nomeie o alvo quando a carta exigir um. Um feitiço que precise de alvo pode mirar quem o lança.", [10, 11]],
      ["Too Much Mana", "Mana demais", "Also called K.O. You are eliminated if you have Too Much Mana and cannot continue the fight. No mana-crystal threshold is printed.", "Também chamado de K.O. Você é eliminado se tiver Mana demais e não conseguir continuar a luta. Nenhum limite de cristais de mana está impresso.", [6, 9]]
    ];
    if (state.teamGame) {
      terms.push(["Team game", "Jogo em equipes", `The selected variant for ${state.players} wizards in ${state.teamCount} teams. Opposing teams play interchangeably. Any wizard may be targeted. The last team standing wins.`, `A variante selecionada para ${state.players} magos em ${state.teamCount} equipes. Equipes opostas jogam de forma intercalada. Qualquer mago pode ser alvo. A última equipe de pé vence.`, [14]]);
    }
    if (state.astral) {
      terms.push(["Astral being", "Ser astral", "A defeated wizard under the selected astral variant. They may drink to drain 1 mana point from all wizards. The booklet does not say they can win.", "Um mago derrotado na variante astral selecionada. Pode beber para drenar 1 ponto de mana de todos os magos. O livreto não diz que eles podem vencer.", [14]]);
    }
    terms.sort((a, b) => a[state.language === "pt-BR" ? 1 : 0].localeCompare(b[state.language === "pt-BR" ? 1 : 0], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), "07", 9)}
      <p class="glossary-intro">${t(
        "Short meanings for the words used above. Team and astral entries appear only when those variants are selected. The booklet leaves these points open: where discarded mana crystals go; whether one potion must cover an entire mana debt; how “all wizards” and “living players” differ in Astral conjunction; how to seat a team game; the Anti-Joker text; and any spell you forge on a blank card.",
        "Significados curtos das palavras usadas acima. As entradas de equipe e astral aparecem só quando essas variantes estão selecionadas. O livreto deixa em aberto: para onde vão os cristais de mana descartados; se uma poção precisa cobrir toda a dívida de mana; como “todos os magos” e “jogadores vivos” diferem na conjunção astral; como sentar um jogo em equipes; o texto do Anti-Joker; e qualquer feitiço forjado numa carta em branco."
      )}</p>
      <div class="quick-grid glossary-grid">${terms.map((item) => `
        <article class="info-card glossary-card"><span class="component-label">${t("TERM", "TERMO")}</span><h3>${t(item[0], item[1])}</h3><p>${t(item[2], item[3])}</p>
          <div class="glossary-references">${item[4].map((page) => referenceLink(page)).join(" ")}</div>
        </article>`).join("")}</div>`;
  }

  function playerChoices() {
    return [3, 4, 5, 6].map((count) => `
      <label class="sniper-choice-card${state.players === count ? " selected" : ""}">
        <input type="radio" name="nem-players" value="${count}" data-players ${state.players === count ? "checked" : ""}>
        <span><strong>${t(`${count} wizards`, `${count} magos`)}</strong><small>${count === 4 || count === 6
          ? t("Team variant can be used.", "A variante de equipes pode ser usada.")
          : t("Standard battle only. The team variant is printed for 4 or 6.", "Só a batalha normal. A variante de equipes está impressa para 4 ou 6.")
        }</small></span>
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

  function matchPanel() {
    const teamControl = state.players === 4 || state.players === 6
      ? `<label class="optional-mode-toggle"><input type="checkbox" data-team-game ${state.teamGame ? "checked" : ""}><span>${t("Play in teams", "Jogar em equipes")}</span></label>
        ${state.teamGame ? (state.players === 6
          ? `<label class="rank-control">${t("Teams", "Equipes")}<select id="nem-team-count" data-team-count>
              <option value="2" ${state.teamCount === 2 ? "selected" : ""}>${t("2 teams", "2 equipes")}</option>
              <option value="3" ${state.teamCount === 3 ? "selected" : ""}>${t("3 teams", "3 equipes")}</option>
            </select></label>`
          : `<p class="optional-mode-note">${t("Four wizards use the printed 2-team battle. The booklet does not offer 3 teams at this count.", "Quatro magos usam a batalha impressa de 2 equipes. O livreto não oferece 3 equipes nessa quantidade.")}</p>`) : `<p class="optional-mode-note">${t("Team play is off. The last wizard standing wins.", "O jogo em equipes está desligado. Vence o último mago de pé.")}</p>`}`
      : `<p class="optional-mode-note">${t("The booklet prints the team game for 4 or 6 wizards only. Change the wizard count to use it.", "O livreto imprime o jogo em equipes só para 4 ou 6 magos. Mude a quantidade de magos para usá-lo.")}</p>`;
    const manaWarning = manaReady() ? "" : `<p class="configuration-warning" role="status">${t(
      "Enter a whole number of mana points, at least 1. The booklet does not print a maximum. This match is not ready while the field is empty or invalid.",
      "Informe um número inteiro de pontos de mana, no mínimo 1. O livreto não imprime um máximo. Esta partida não está pronta enquanto o campo estiver vazio ou inválido."
    )}</p>`;
    return `
      <section class="controls-panel" aria-labelledby="nem-match-title">
        <div class="panel-topline"><div><p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p><h2 id="nem-match-title">${t("Build your match", "Configure a partida")}</h2><p>${t("These choices are the ones the booklet asks the table to settle first. The sections below follow them, and they are saved for this game only.", "Estas escolhas são as que o livreto pede que a mesa resolva primeiro. As seções abaixo seguem essas escolhas, e ficam salvas só neste jogo.")}</p></div><span class="saved-label">${storageAvailable ? t("Saved locally", "Salvo localmente") : t("Not saved", "Não salvo")}</span></div>
        ${optionBlock(
          t("Wizards", "Magos"),
          t("Not Enough Mana is for 3 to 6 wizards. The count decides how many people take 10 health and 5 cards, and whether the team variant exists.", "Not Enough Mana é para 3 a 6 magos. A quantidade decide quantas pessoas recebem 10 de vida e 5 cartas, e se a variante de equipes existe."),
          `<div class="sniper-choice-grid">${playerChoices()}</div>`,
          [6]
        )}
        ${optionBlock(
          t("Mana from each drink", "Mana de cada dose"),
          t("Each potion replenishes 3 mana points. The booklet says this number, and the potion's potency, may be adjusted to the wizards' might. The suggested potency of 40% is serving advice; it does not change the mana gained unless you change this number. No maximum is printed.", "Cada poção recupera 3 pontos de mana. O livreto diz que este número, e a potência da poção, podem ser ajustados ao poder dos magos. A potência sugerida de 40% é um conselho de dose; ela não muda a mana ganha, a menos que você mude este número. Nenhum máximo está impresso."),
          `<label class="rank-control">${t("Mana points gained", "Pontos de mana ganhos")}<input class="nem-field" id="nem-mana" inputmode="numeric" data-mana value="${escapeHtml(state.manaField)}"></label>${manaWarning}`,
          [9]
        )}
        ${optionBlock(
          t("What you drink", "O que se bebe"),
          t("Mana potions are not in the box. The booklet allows another challenge instead, and its examples are sausages, press-ups, or whatever the wizards agree. The substitute keeps the same timing and the same mana gain. Turning this on does not invent a new rule.", "Poções de mana não vêm na caixa. O livreto permite outro desafio no lugar, e os exemplos são salsichas, flexões, ou o que os magos combinarem. O substituto mantém o mesmo momento e o mesmo ganho de mana. Ligar isto não inventa uma regra nova."),
          `<label class="optional-mode-toggle"><input type="checkbox" data-substitute ${state.substitute ? "checked" : ""}><span>${t("Use an agreed substitute", "Usar um desafio combinado")}</span></label>
          ${state.substitute ? `<label class="rank-control">${t("Name used in the checklist", "Nome usado na lista")}<input class="nem-field" id="nem-substitute-name" data-substitute-name value="${escapeHtml(state.substituteName)}" maxlength="80"></label><p class="optional-mode-note">${t("Leave this blank to say only “agreed substitute” during setup.", "Deixe em branco para dizer apenas “desafio combinado” na preparação.")}</p>` : `<p class="optional-mode-note">${t("Potions stay in the rules. Bring them yourselves.", "As poções continuam nas regras. Tragam-nas vocês.")}</p>`}`,
          [7]
        )}
        ${optionBlock(
          t("Team game", "Jogo em equipes"),
          t("Optional variant for 4 wizards in 2 teams, or 6 wizards in 2 or 3 teams. Opposing teams take turns interchangeably. Every spell may target any wizard. Damage is resolved with the normal rules. The last team standing wins. The booklet does not say how to split or seat the teams, so agree that here before setup.", "Variante opcional para 4 magos em 2 equipes, ou 6 magos em 2 ou 3 equipes. Equipes opostas jogam de forma intercalada. Todo feitiço pode mirar qualquer mago. O dano é resolvido com as regras normais. A última equipe de pé vence. O livreto não diz como dividir ou sentar as equipes, então combinem isso aqui antes da preparação."),
          teamControl,
          [14]
        )}
        ${optionBlock(
          t("Astral conjunction", "Conjunção astral"),
          t("Optional variant. Defeated wizards become astral beings and may drink to drain mana from the living players. One drink drains 1 mana point from all wizards. It can be combined with the team game because the booklet does not say they exclude each other. It does not say that astral beings win, or whether “all wizards” includes other astral beings.", "Variante opcional. Magos derrotados viram seres astrais e podem beber para drenar mana dos jogadores vivos. Uma dose drena 1 ponto de mana de todos os magos. Pode ser combinada com o jogo em equipes porque o livreto não diz que elas se excluem. Ele não diz que seres astrais vencem, nem se “todos os magos” inclui outros seres astrais."),
          `<label class="optional-mode-toggle"><input type="checkbox" data-astral ${state.astral ? "checked" : ""}><span>${t("Defeated wizards become astral", "Magos derrotados viram astrais")}</span></label>
          <p class="optional-mode-note">${state.astral
            ? t("Astral conjunction is part of this match. Victory is still the last wizard, or the last team if that variant is also on.", "A conjunção astral faz parte desta partida. A vitória continua sendo o último mago, ou a última equipe se essa variante também estiver ligada.")
            : t("Astral conjunction is off. Eliminated wizards are out.", "A conjunção astral está desligada. Magos eliminados estão fora.")
          }</p>`,
          [14]
        )}
        <p class="optional-mode-note">${t("The booklet's last variant is to invent your own. This guide does not add a house rule to the match.", "A última variante do livreto é inventar a sua. Este guia não acrescenta uma regra da casa à partida.")}</p>
      </section>`;
  }

  function renderHeader() {
    return `
      <header class="site-header">
        <a class="brand" href="#/" aria-label="${t("Field Manual home", "Página inicial do Manual de Campo")}">
          <span class="brand-mark" aria-hidden="true">NM</span>
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
    document.body.classList.add("theme-nem");
    document.documentElement.lang = state.language;
    document.title = t("Not Enough Mana — Field Manual", "Not Enough Mana — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Interactive rules for Not Enough Mana, from the official Maleficus Praecepta booklet.",
        "Regras interativas de Not Enough Mana, a partir do livreto oficial Maleficus Praecepta."
      );
    }
    const nav = [
      ["iconography", t("Iconography", "Iconografia")],
      ["quick-reference", t("Quick Ref", "Referência")],
      ["setup", t("Setup", "Preparação")],
      ["victory", t("Victory", "Vitória")],
      ["turns", t("Turns", "Turnos")],
      ["examples", t("Examples", "Exemplos")],
      ["glossary", t("Glossary", "Glossário")]
    ];
    app.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook · base game", "Livro interativo · jogo base")}</p>
          <h1>Not Enough Mana</h1>
          <p class="hero-intro">${t(
            "A potion-drinking card duel for wizards who can run out of health, or out of the fight. This guide follows the official booklet and leaves card text on the cards.",
            "Um duelo de cartas em que magos bebem poções e podem ficar sem vida, ou sem condições de lutar. Este guia segue o livreto oficial e deixa o texto das cartas nas cartas."
          )}</p>
          <div class="hero-meta"><span>${t("3–6 wizards", "3–6 magos")}</span><span>${t("Card game", "Jogo de cartas")}</span><span>${t("Potions · spells", "Poções · feitiços")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/not-enough-mana/card-back.webp" alt="${t("Card back from the Not Enough Mana booklet", "Verso de carta do livreto de Not Enough Mana")}" fetchpriority="high"><figcaption>${t("Booklet card back", "Verso do livreto")} · Maleficus Praecepta</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("Field guide", "Guia de campo")}</h2>
          ${nav.map(([id, label], index) => `<button type="button" data-scroll="${id}"><span class="toc-index">${String(index + 1).padStart(2, "0")}</span>${label}</button>`).join("")}
        </aside>
        <div class="content-column">
          ${storageNotice ? `<p class="storage-notice" role="status">${storageNoticeText()}</p>` : ""}
          ${matchPanel()}
          <section class="rule-section">${renderIcons()}</section>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${victorySection()}</section>
          <section class="rule-section">${turnsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal guide for Not Enough Mana. Summaries follow the Maleficus Praecepta booklet. That PDF is not in this repository; page links use manuals/not-enough-mana_core.pdf, the same path locally and on GitHub Pages. Card effects that the booklet does not spell out remain on the cards.",
        "Guia pessoal de Not Enough Mana. Os resumos seguem o livreto Maleficus Praecepta. Esse PDF não está neste repositório; os links de página usam manuals/not-enough-mana_core.pdf, o mesmo caminho localmente e no GitHub Pages. Efeitos que o livreto não explica continuam nas cartas."
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
      return;
    }
    if (target instanceof HTMLInputElement && target.matches("[data-players]")) {
      commit(() => {
        state.players = Number(target.value);
      });
      return;
    }
    if (target instanceof HTMLInputElement && target.matches("[data-team-game]")) {
      commit(() => {
        state.teamGame = target.checked;
      });
      return;
    }
    if (target instanceof HTMLSelectElement && target.matches("[data-team-count]")) {
      commit(() => {
        state.teamCount = Number(target.value);
      });
      return;
    }
    if (target instanceof HTMLInputElement && target.matches("[data-astral]")) {
      commit(() => {
        state.astral = target.checked;
      });
      return;
    }
    if (target instanceof HTMLInputElement && target.matches("[data-substitute]")) {
      commit(() => {
        state.substitute = target.checked;
      });
      return;
    }
    if (target instanceof HTMLInputElement && target.matches("[data-mana]")) {
      const trimmed = target.value.trim();
      const parsed = parseMana(trimmed);
      if (trimmed === state.manaField && parsed === state.manaPerPotion) {
        return;
      }
      commit(() => {
        state.manaField = trimmed;
        state.manaPerPotion = parsed;
      });
      return;
    }
    if (target instanceof HTMLInputElement && target.matches("[data-substitute-name]")) {
      if (target.value === state.substituteName) {
        return;
      }
      commit(() => {
        state.substituteName = target.value;
      });
    }
  }

  function onInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !root || !root.contains(target)) {
      return;
    }
    if (target.matches("[data-mana]")) {
      commit(() => {
        state.manaField = target.value;
        state.manaPerPotion = parseMana(target.value);
      }, target);
      return;
    }
    if (target.matches("[data-substitute-name]")) {
      commit(() => {
        state.substituteName = target.value;
      }, target);
    }
  }

  window.NotEnoughMana = { renderInto, onClick, onChange, onInput };
})();
