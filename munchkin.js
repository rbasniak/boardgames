(() => {
  "use strict";

  const STORAGE_KEY = "field-manual.munchkin.v1";
  const MANUAL_FILE = "munchkin_core.pdf";
  const COVER = "assets/covers/munchkin.webp";

  let storageAvailable = true;
  let storageNotice = "";
  let root = null;

  function defaultState() {
    return {
      language: "pt-BR",
      players: 4,
      listenAtDoor: false,
      sharedVictories: false,
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
    if (players === 3 || players === 4 || players === 5 || players === 6) {
      next.players = players;
    }
    next.listenAtDoor = saved.listenAtDoor === true;
    next.sharedVictories = saved.sharedVictories === true;
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
      console.error("Could not read the Munchkin match settings.", error);
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
      console.error("Could not save the Munchkin match settings.", error);
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
      listenAtDoor: state.listenAtDoor,
      sharedVictories: state.sharedVictories
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
    return {
      players: state.players,
      tokensPerPlayer: 10,
      listenAtDoor: state.listenAtDoor,
      sharedVictories: state.sharedVictories
    };
  }

  function manualUrl(page) {
    const script = document.querySelector('script[src*="munchkin.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${MANUAL_FILE}`, baseUrl).href}#page=${page}`;
  }

  function referenceLink(page) {
    const label = t(`Rulebook p. ${page} ↗`, `Manual p. ${page} ↗`);
    return `<a class="source-link" href="${escapeHtml(manualUrl(page))}" target="_blank" rel="noreferrer">${label}</a>`;
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

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function jump(id, label) {
    return `<button type="button" data-scroll="${id}">${label}</button>`;
  }

  function storageNoticeText() {
    if (storageNotice === "read") {
      return t(
        "This browser could not read the saved Munchkin match. The guide is showing a new default match, and it may not be possible to save changes.",
        "Este navegador não conseguiu ler a partida salva de Munchkin. O guia está mostrando uma partida nova, e pode não ser possível salvar alterações."
      );
    }
    return t(
      "This browser refused to save the Munchkin match. Your latest change is on screen only.",
      "Este navegador recusou salvar a partida de Munchkin. A última alteração está só na tela."
    );
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

  function yesNoGroup(name, dataAttr, currentYes, yesDetailEn, yesDetailPt, noDetailEn, noDetailPt, pages) {
    const options = [
      {
        value: "no",
        selected: !currentYes,
        en: "No",
        pt: "Não",
        detailEn: noDetailEn,
        detailPt: noDetailPt
      },
      {
        value: "yes",
        selected: currentYes,
        en: "Yes",
        pt: "Sim",
        detailEn: yesDetailEn,
        detailPt: yesDetailPt
      }
    ];
    const cards = options.map((option) => `
      <label class="sniper-choice-card${option.selected ? " selected" : ""}">
        <input id="munchkin-${name}-${option.value}" type="radio" name="munchkin-${name}" value="${option.value}" ${dataAttr} ${option.selected ? "checked" : ""}>
        <span><strong>${t(option.en, option.pt)}</strong><small>${t(option.detailEn, option.detailPt)}</small></span>
      </label>`).join("");
    return optionBlock(
      name === "listen" ? t("Listen At The Door", "Escutar na porta") : t("Shared victories", "Vitórias compartilhadas"),
      name === "listen"
        ? t(
          "Optional faster-play rule from the back of the rulesheet. When on, each turn starts with an extra draw before Kick Open The Door, and Loot The Room takes a face-down Treasure instead of a Door card.",
          "Regra opcional de jogo mais rápido no verso da folha de regras. Ligada, cada turno começa com uma compra extra antes de Arrombar a porta, e Saquear o quarto pega um Tesouro virado para baixo em vez de uma carta de Porta."
        )
        : t(
          "Optional faster-play rule. When on, if you help someone kill a monster and that kill would take them to Level 10, you also win, no matter what Level you are.",
          "Regra opcional de jogo mais rápido. Ligada, se você ajuda alguém a matar um monstro e essa morte levaria essa pessoa ao Nível 10, você também vence, não importa em que Nível você está."
        ),
      `<div class="sniper-choice-grid">${cards}</div>`,
      pages
    );
  }

  function playerDetail(count) {
    return t(
      `The rulesheet is written for 3–6 players. Each player needs 10 tokens (or anything that counts to 10) to track Level. This match uses ${count} players, so prepare ${count * 10} level markers in all.`,
      `A folha de regras é para 3–6 jogadores. Cada jogador precisa de 10 fichas (ou qualquer coisa que conte até 10) para marcar o Nível. Esta partida usa ${count} jogadores, então prepare ${count * 10} marcadores de nível no total.`
    );
  }

  function playerChoices() {
    return [3, 4, 5, 6].map((count) => `
      <label class="sniper-choice-card${state.players === count ? " selected" : ""}">
        <input id="munchkin-players-${count}" type="radio" name="munchkin-players" value="${count}" data-players ${state.players === count ? "checked" : ""}>
        <span><strong>${t(`${count} players`, `${count} jogadores`)}</strong><small>${playerDetail(count)}</small></span>
      </label>`).join("");
  }

  function matchSummary() {
    const facts = matchFacts();
    const listen = facts.listenAtDoor
      ? t("Listen At The Door on", "Escutar na porta ligado")
      : t("Listen At The Door off", "Escutar na porta desligado");
    const shared = facts.sharedVictories
      ? t("shared victories on", "vitórias compartilhadas ligadas")
      : t("shared victories off", "vitórias compartilhadas desligadas");
    return t(
      `Current match: ${facts.players} players, ${listen}, ${shared}.`,
      `Partida atual: ${facts.players} jogadores, ${listen}, ${shared}.`
    );
  }

  function matchPanel() {
    return `
      <section class="controls-panel" aria-labelledby="munchkin-match-title">
        <div class="panel-topline"><div><p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p><h2 id="munchkin-match-title">${t("Build your match", "Configure a partida")}</h2><p>${t(
          "This guide covers the core Munchkin box only: 168 cards, one six-sided die, and the 6-page rulesheet (v1.8). Combining sets, expansions, and other products advertised on p. 6 are not covered here.",
          "Este guia cobre só a caixa base de Munchkin: 168 cartas, um dado de seis faces e a folha de 6 páginas (v1.8). Combinar sets, expansões e outros produtos anunciados na p. 6 não está coberto aqui."
        )}</p></div><span class="saved-label">${storageAvailable ? t("Saved locally", "Salvo localmente") : t("Not saved", "Não salvo")}</span></div>
        ${optionBlock(
          t("Number of players", "Número de jogadores"),
          t(
            "Choose the exact count allowed by the rulesheet (3–6). It scales how many level tokens you lay out and how many hands receive the opening deal.",
            "Escolha a contagem exata permitida pela folha (3–6). Ela define quantas fichas de nível você prepara e quantas mãos recebem a distribuição inicial."
          ),
          `<div class="sniper-choice-grid">${playerChoices()}</div>`,
          [1]
        )}
        ${yesNoGroup(
          "listen",
          "data-listen",
          state.listenAtDoor,
          "At the start of your turn, before anything else, draw one face-down Door card. You may play it or not. Then arrange cards and Kick Open The Door normally. If you Loot The Room, draw a face-down Treasure, not a Door.",
          "No começo do seu turno, antes de qualquer coisa, compre uma carta de Porta virada para baixo. Você pode jogá-la ou não. Depois organize as cartas e Arrombe a porta normalmente. Se Saquear o quarto, compre um Tesouro virado para baixo, não uma Porta.",
          "Standard turn order only: Kick Open The Door, then Look For Trouble or Loot The Room, then Charity.",
          "Ordem de turno padrão: Arrombar a porta, depois Procurar briga ou Saquear o quarto, depois Caridade.",
          [6]
        )}
        ${yesNoGroup(
          "shared",
          "data-shared",
          state.sharedVictories,
          "If you are the helper in a fight where the active player would reach Level 10 by killing the monster, you win too, regardless of your Level.",
          "Se você é o ajudante numa luta em que o jogador ativo chegaria ao Nível 10 matando o monstro, você também vence, independentemente do seu Nível.",
          "Only the player who gains the killing level can win at Level 10 (unless a card says otherwise). Helpers do not win just by helping that kill.",
          "Só o jogador que ganha o nível da morte pode vencer no Nível 10 (a menos que uma carta diga o contrário). Ajudantes não vencem só por ajudar nessa morte.",
          [6]
        )}
        <p class="optional-mode-note">${matchSummary()}</p>
      </section>`;
  }

  function turnPhaseLines() {
    const facts = matchFacts();
    const lines = [];
    if (facts.listenAtDoor) {
      lines.push(t(
        "<strong>Listen At The Door (optional):</strong> before anything else on your turn, draw one face-down Door card; you may play it or not. Then arrange your cards.",
        "<strong>Escutar na porta (opcional):</strong> antes de qualquer coisa no seu turno, compre uma carta de Porta virada para baixo; você pode jogá-la ou não. Depois organize suas cartas."
      ));
    }
    lines.push(t(
      "<strong>Kick Open The Door:</strong> draw one Door card face up. Monster → fight. Curse → applies immediately if it can, then discard (or keep as a reminder). Anything else → hand or play now.",
      "<strong>Arrombar a porta:</strong> compre uma carta de Porta virada para cima. Monstro → lute. Maldição → aplica na hora se puder, depois descarte (ou guarde como lembrete). Qualquer outra → mão ou jogue agora."
    ));
    lines.push(t(
      "<strong>Look For Trouble / Loot The Room:</strong> skip if you fought in phase 1. Otherwise play a monster from your hand to fight, or Loot The Room by drawing a second Door card face down into your hand.",
      "<strong>Procurar briga / Saquear o quarto:</strong> pule se lutou na fase 1. Caso contrário jogue um monstro da mão para lutar, ou Saqueie o quarto comprando uma segunda carta de Porta virada para baixo para a mão."
    ));
    if (facts.listenAtDoor) {
      lines[lines.length - 1] = t(
        "<strong>Look For Trouble / Loot The Room:</strong> skip if you fought in phase 1. Otherwise play a monster from your hand to fight, or Loot The Room by drawing a face-down Treasure (not a Door).",
        "<strong>Procurar briga / Saquear o quarto:</strong> pule se lutou na fase 1. Caso contrário jogue um monstro da mão para lutar, ou Saqueie o quarto comprando um Tesouro virado para baixo (não uma Porta)."
      );
    }
    lines.push(t(
      "<strong>Charity:</strong> if you have more than five cards in hand, play cards to reach five or below, or give excess to the lowest-Level player (or discard if you are lowest).",
      "<strong>Caridade:</strong> se tiver mais de cinco cartas na mão, jogue cartas até cinco ou menos, ou dê o excesso ao jogador de menor Nível (ou descarte se você for o menor)."
    ));
    return lines;
  }

  function quickReference() {
    const facts = matchFacts();
    const sharedWin = facts.sharedVictories
      ? t("With shared victories on, a helper also wins if that kill would take the active player to Level 10.", "Com vitórias compartilhadas ligadas, um ajudante também vence se essa morte levaria o jogador ativo ao Nível 10.")
      : "";
    const cards = [
      [t("Winning", "Vitória"), [
        t("<strong>Reach Level 10</strong> by killing a monster, unless a card allows another way.", "<strong>Chegue ao Nível 10</strong> matando um monstro, a menos que uma carta permita outro jeito."),
        t("You cannot force another player to help you reach Level 10.", "Você não pode forçar outro jogador a ajudá-lo a chegar ao Nível 10."),
        sharedWin
      ], "combat"],
      [t("Golden rules", "Regras de ouro"), [
        t("Nothing reduces a player below Level 1 (combat strength can go below 1).", "Nada reduz um jogador abaixo do Nível 1 (força de combate pode ir abaixo de 1)."),
        t("Levels from combat only when you kill a monster.", "Níveis de combate só quando você mata um monstro."),
        t("No rewards mid-combat; finish the fight first.", "Sem recompensas no meio do combate; termine a luta primeiro."),
        t("Card text beats this sheet unless the card explicitly overrides a listed golden rule.", "Texto da carta vence esta folha, a menos que a carta diga explicitamente que substitui uma regra de ouro listada.")
      ], "golden"],
      [t("Your turn", "Seu turno"), turnPhaseLines(), "turns"],
      [t("Combat snapshot", "Combate resumido"), [
        t("<strong>Combat strength</strong> = your Level plus every modifier from Items and cards in this fight.", "<strong>Força de combate</strong> = seu Nível mais cada modificador de Itens e cartas nesta luta."),
        t("<strong>Compare</strong> your combat strength to the monster’s. Monsters win ties.", "<strong>Compare</strong> sua força de combate com a do monstro. Monstros vencem empates."),
        t("<strong>Win:</strong> kill it, go up a level (unless the card says otherwise), take Treasures.", "<strong>Vencer:</strong> mate-o, suba um nível (a menos que a carta diga o contrário), pegue Tesouros."),
        t("<strong>Lose or stuck:</strong> Run Away — roll 5+ on the die unless modified; no level, Treasure, or Loot The Room.", "<strong>Perder ou preso:</strong> Fugir — role 5+ no dado, salvo modificadores; sem nível, Tesouro nem Saquear o quarto."),
        t("Wait ~2.6 seconds after you think you won before rewards are final.", "Espere ~2,6 segundos depois de acha que venceu antes das recompensas serem finais.")
      ], "combat"],
      [t("Hand limit", "Limite de mão"), [
        t("End of turn: maximum <strong>five cards</strong> in hand (Charity).", "Fim do turno: máximo de <strong>cinco cartas</strong> na mão (Caridade)."),
        t("Cards in play are public; hand cards are not in play.", "Cartas em jogo são públicas; cartas na mão não estão em jogo.")
      ], "turns"]
    ];
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), "01", [1, 2, 3, 5])}
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

  const SETUP_IDS = ["components", "decks", "deal", "tokens", "first-player", "character-creation"];

  function setupSection() {
    const facts = matchFacts();
    const rows = [
      checkRow("components", t("Lay out the box contents", "Separe o conteúdo da caixa"), [
        t("168 cards, one six-sided die, and these rules.", "168 cartas, um dado de seis faces e estas regras."),
        t(`${facts.players} players at this table — each needs 10 level tokens (coins, chips, or anything that counts to 10).`, `${facts.players} jogadores nesta mesa — cada um precisa de 10 fichas de nível (moedas, fichas ou qualquer coisa que conte até 10).`)
      ]),
      checkRow("decks", t("Build the Door and Treasure decks", "Monte os baralhos de Porta e Tesouro"), [
        t("Divide the cards into a Door deck and a Treasure deck.", "Divida as cartas em um baralho de Porta e um de Tesouro."),
        t("Shuffle both decks. Keep separate face-up discard piles; do not look through discards unless a card allows it.", "Embaralhe os dois baralhos. Mantenha descartes virados para cima separados; não olhe os descartes a menos que uma carta permita."),
        t("When a deck runs out, reshuffle its discards into a new deck.", "Quando um baralho acabar, reembaralhe seus descartes em um baralho novo.")
      ]),
      checkRow("deal", t("Deal opening hands", "Distribua as mãos iniciais"), [
        t(`Deal four cards from the Door deck and four from the Treasure deck to each of the ${facts.players} players (eight cards each).`, `Distribua quatro cartas do baralho de Porta e quatro do Tesouro a cada um dos ${facts.players} jogadores (oito cartas cada).`),
        t("Hands are private unless a card or rule says otherwise.", "As mãos são privadas, salvo quando uma carta ou regra diga o contrário.")
      ]),
      checkRow("tokens", t("Set everyone's Level to 1", "Coloque todos no Nível 1"), [
        t(`Give each player a pile of 10 tokens. Everyone starts at Level 1.`, `Dê a cada jogador uma pilha de 10 fichas. Todos começam no Nível 1.`),
        t("Use the tokens to track Level as it changes.", "Use as fichas para marcar o Nível conforme ele mudar.")
      ]),
      checkRow("first-player", t("Pick the first player", "Escolha o primeiro jogador"), [
        t("Decide who goes first by rolling the die and arguing about the results (rulesheet joke). Then play proceeds clockwise.", "Decida quem começa rolando o dado e discutindo o resultado (piada da folha). Depois o jogo segue em sentido horário."),
        t("When a player finishes a turn, the player to the left takes the next turn.", "Quando um jogador termina o turno, o jogador à esquerda joga o próximo.")
      ]),
      checkRow("character-creation", t("Opening character choices", "Escolhas iniciais de personagem"), [
        t("Everyone is a Level 1 human with no class until you play Race or Class cards.", "Todos são humanos de Nível 1 sem classe até jogar cartas de Raça ou Classe."),
        t("Character sex matches yours at the start unless you declare otherwise.", "O sexo do personagem é o seu no início, a menos que declare o contrário."),
        t("From your eight cards you may play one Race and one Class (if you have them) and any usable Items to the table.", "Das suas oito cartas você pode jogar uma Raça e uma Classe (se tiver) e quaisquer Itens utilizáveis na mesa."),
        t("Do not record private hands in this guide.", "Não registre mãos privadas neste guia.")
      ])
    ];
    const kept = state.setupChecks.filter((id) => SETUP_IDS.includes(id));
    if (kept.length !== state.setupChecks.length) {
      state.setupChecks = kept;
      saveState();
    }
    const done = SETUP_IDS.filter((id) => state.setupChecks.includes(id)).length;
    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), "02", [1])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Set up this match", "Prepare esta partida")}</h3>
            <p>${t("Check each physical step as it is done. Progress is saved for this game only.", "Marque cada passo físico conforme for feito. O progresso fica salvo só neste jogo.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${SETUP_IDS.length} steps checked`, `${done} de ${SETUP_IDS.length} etapas concluídas`)}</span>
            <progress id="setup-progress" max="${SETUP_IDS.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Changing player count or either faster-play option clears this checklist. “Uncheck all” clears only these boxes. Changing language does not.",
          "Mudar o número de jogadores ou qualquer opção de jogo mais rápido limpa esta lista. “Desmarcar tudo” limpa só estas caixas. Trocar o idioma não limpa."
        )}</p>
      </div>
      <div class="setup-phases">
        <article class="setup-phase">
          <header class="setup-phase-header">
            <span class="setup-phase-number">01</span>
            <h3>${t("Table", "Mesa")}</h3>
            <div class="setup-phase-references">${referenceLink(1)}</div>
          </header>
          <ul class="setup-check-list">${rows.join("")}</ul>
        </article>
      </div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      <div class="quick-grid">
        <article class="info-card"><span class="component-label">${t("CARDS", "CARTAS")}</span><h3>${t("168 cards", "168 cartas")}</h3><p>${t("Split into Door and Treasure decks. Opening deal: 4 + 4 per player.", "Divididas em baralhos de Porta e Tesouro. Distribuição inicial: 4 + 4 por jogador.")}</p></article>
        <article class="info-card"><span class="component-label">${t("DIE", "DADO")}</span><h3>${t("One d6", "Um d6")}</h3><p>${t("Used to start the game, Run Away (5+), and resolve ties when looting a body.", "Usado para começar o jogo, Fugir (5+), e desempatar na pilhagem do corpo.")}</p></article>
        <article class="info-card"><span class="component-label">${t("TOKENS", "FICHAS")}</span><h3>${t(`${facts.players * 10} level markers`, `${facts.players * 10} marcadores de nível`)}</h3><p>${t(`${facts.players} players × 10 tokens each, tracking Level 1–10.`, `${facts.players} jogadores × 10 fichas cada, marcando Nível 1–10.`)}</p></article>
      </div>`;
  }

  function cardManagementSection() {
    return `
      ${sectionHeading("cards", t("Card management", "Gerenciamento de cartas"), "03", [1])}
      <div class="turn-block">
        ${lineList([
          t("<strong>In play:</strong> Race, Class, equipped and carried Items, and some Curses — public and visible.", "<strong>Em jogo:</strong> Raça, Classe, Itens equipados e carregados, e algumas Maldições — públicos e visíveis."),
          t("<strong>Hand:</strong> not in play; safe from most theft; five-card limit at end of turn.", "<strong>Mão:</strong> fora de jogo; protegida da maioria dos roubos; limite de cinco cartas no fim do turno."),
          t("You cannot return in-play cards to your hand — discard or trade them.", "Você não pode devolver cartas em jogo à mão — descarte ou troque."),
          t("When a deck is empty, reshuffle its discard pile.", "Quando um baralho acaba, reembaralhe sua pilha de descarte.")
        ])}
      </div>`;
  }

  function actionsTimingSection() {
    return `
      ${sectionHeading("actions", t("When you may act", "Quando você pode agir"), "04", [2])}
      <div class="turn-block"><h3>${t("Any time", "A qualquer momento")}</h3>
        ${lineList([
          t("Discard a Class or Race.", "Descartar uma Classe ou Raça."),
          t("Play Go Up a Level or Hireling.", "Jogar Subir de nível ou Serviçal."),
          t("Play a Curse.", "Jogar uma Maldição.")
        ])}
      </div>
      <div class="turn-block"><h3>${t("Any time, not in combat", "A qualquer momento, fora de combate")}</h3>
        ${lineList([
          t("Trade Items with another player (neither trader in combat).", "Trocar Itens com outro jogador (nenhum dos dois em combate)."),
          t("Change which Items are equipped.", "Mudar quais Itens estão equipados."),
          t("Play a card you just received (some cards work in combat — read the card).", "Jogar uma carta que acabou de receber (algumas funcionam em combate — leia a carta).")
        ])}
      </div>
      <div class="turn-block"><h3>${t("On your turn", "No seu turno")}</h3>
        ${lineList([
          t("Play a new Class or Race.", "Jogar uma nova Classe ou Raça."),
          t("Sell Items for levels (not during combat).", "Vender Itens por níveis (não durante combate)."),
          t("Play an Item (most Items not during combat unless the card says otherwise).", "Jogar um Item (a maioria não durante combate, salvo o que a carta diga).")
        ])}
      </div>`;
  }

  function characterSection() {
    return `
      ${sectionHeading("character", t("Character stats", "Atributos do personagem"), "05", [1, 2, 3])}
      <div class="turn-block">
        <p>${t("Your character is Level, Race, and Class plus the Items you carry. Humans have no special ability when you have no Race card.", "Seu personagem é Nível, Raça e Classe mais os Itens que carrega. Humanos não têm habilidade especial quando não há carta de Raça.")}</p>
        ${lineList([
          t("<strong>Level:</strong> never below 1; gain from killing monsters, cards, or selling Items; lose only when a card says so.", "<strong>Nível:</strong> nunca abaixo de 1; ganhe matando monstros, cartas ou vendendo Itens; perca só quando uma carta mandar."),
          t("<strong>Class:</strong> Warrior, Wizard, Thief, or Cleric — one at a time unless Super Munchkin is in play. Abilities are on the Class cards; discard any card to power a discard ability.", "<strong>Classe:</strong> Guerreiro, Mago, Ladrão ou Clérigo — uma por vez, salvo Super Munchkin em jogo. Habilidades estão nas cartas de Classe; descarte qualquer carta para pagar uma habilidade que exige descarte."),
          t("<strong>Race:</strong> Elf, Dwarf, Halfling, or Human (no card) — one race at a time unless Half-Breed is in play.", "<strong>Raça:</strong> Elfo, Anão, Halfling ou Humano (sem carta) — uma raça por vez, salvo Meio-raça em jogo.")
        ])}
      </div>
      <div class="callout munchkin-note">
        <p>${t(
          "<strong>On the physical cards.</strong> This rulesheet names the four Classes and four Races but prints most special powers on those cards only. At the table, read your Class and Race cards for the full text. This guide repeats only what the rulesheet itself explains (examples below).",
          "<strong>Nas cartas físicas.</strong> Esta folha nomeia as quatro Classes e quatro Raças, mas imprime a maior parte dos poderes só nessas cartas. Na mesa, leia suas cartas de Classe e Raça para o texto completo. Este guia repete só o que a própria folha explica (exemplos abaixo)."
        )}</p>
      </div>
      <div class="turn-block"><h3>${t("Rulesheet examples on Classes", "Exemplos da folha sobre Classes")}</h3>
        ${lineList([
          t("<strong>Thief:</strong> cannot steal while you or the target are fighting; backstab in combat.", "<strong>Ladrão:</strong> não pode roubar enquanto você ou o alvo estão lutando; apunhalar nas costas em combate."),
          t("<strong>Warrior:</strong> wins ties; may Berserk by discarding cards for +1 each (once per combat, not once per monster).", "<strong>Guerreiro:</strong> vence empates; pode Enfurecer descartando cartas por +1 cada (uma vez por combate, não por monstro)."),
          t("Discard a Class at any time, even in combat, to become classless until you play another.", "Descarte uma Classe a qualquer momento, inclusive em combate, para ficar sem classe até jogar outra.")
        ])}
      </div>
      <div class="turn-block"><h3>${t("Super Munchkin and Half-Breed", "Super Munchkin e Meio-raça")}</h3>
        ${lineList([
          t("Play when legal to play a Class (Super Munchkin) or Race (Half-Breed), attached to an appropriate card. No duplicate Class/Race card in play.", "Jogue quando for legal jogar Classe (Super Munchkin) ou Raça (Meio-raça), ligada a uma carta apropriada. Sem duplicar a mesma carta de Classe/Raça em jogo."),
          t("One Class + Super Munchkin: all advantages, none of the disadvantages (paid costs still apply). Two Classes + Super: normal advantages and disadvantages for both.", "Uma Classe + Super Munchkin: todas as vantagens, nenhuma desvantagem (custos pagos ainda valem). Duas Classes + Super: vantagens e desvantagens normais das duas."),
          t("Half-Breed works the same way for Races.", "Meio-raça funciona igual para Raças.")
        ])}
      </div>`;
  }

  function treasuresSection() {
    return `
      ${sectionHeading("treasures", t("Treasures and Items", "Tesouros e Itens"), "06", [3])}
      <div class="turn-block">
        ${lineList([
          t("Play Treasures to the table when you get them or on your turn except during combat (unless the card or rules below allow).", "Jogue Tesouros na mesa ao recebê-los ou no seu turno, exceto em combate (salvo se a carta ou as regras abaixo permitirem)."),
          t("<strong>Equipped vs carried:</strong> turn sideways Items that are carried but not giving a bonus. Do not change equip status during combat or while Running Away.", "<strong>Equipado vs carregado:</strong> deite de lado Itens carregados sem bônus. Não mude o status de equipamento durante combate ou ao Fugir."),
          t("<strong>Slots:</strong> one Headgear, one Armor, one Footgear, two one-Hand Items or one two-Hands Item (Hireling, Cheat!, or card text can break limits).", "<strong>Slots:</strong> um Chapéu, uma Armadura, um Calçado, dois Itens de uma mão ou um de duas mãos (Serviçal, Trapacear! ou texto da carta podem quebrar limites)."),
          t("<strong>Big items:</strong> any number of Small; only one Big unless Dwarf (or similar) lets you keep more — fix excess immediately or give to lowest Level who can carry.", "<strong>Itens grandes:</strong> quantos Pequenos quiser; só um Grande, salvo Anão (ou similar) — corrija o excesso na hora ou dê ao menor Nível que possa carregar."),
          t("<strong>Selling:</strong> on your turn (not in combat or Running Away), discard Items worth ≥1000 GP for one level; no change; cannot sell to reach Level 10.", "<strong>Vender:</strong> no seu turno (não em combate nem Fugindo), descarte Itens valendo ≥1000 PO por um nível; sem troco; não venda para chegar ao Nível 10."),
          t("<strong>Trading:</strong> Items on the table only, not in combat; received Items stay in play. Gifts allowed to bribe.", "<strong>Trocar:</strong> só Itens na mesa, fora de combate; Itens recebidos ficam em jogo. Presentes permitidos para subornar."),
          t("<strong>One-shots:</strong> usually combat Treasures; discard after combat or when resolved.", "<strong>Usos únicos:</strong> em geral Tesouros de combate; descarte após o combate ou ao resolver."),
          t("<strong>Go Up a Level:</strong> any time, even in combat; not to give the winning level.", "<strong>Subir de nível:</strong> a qualquer momento, inclusive em combate; não para dar o nível da vitória."),
          t("<strong>Hireling:</strong> any time on your turn; cannot give it an Item to carry during combat.", "<strong>Serviçal:</strong> a qualquer momento no seu turno; não pode dar Item para carregar durante combate.")
        ])}
      </div>`;
  }

  function combatSection() {
    const facts = matchFacts();
    const helperWin = facts.sharedVictories
      ? t("With shared victories on, if that kill would take the active player to Level 10, the helper wins too.", "Com vitórias compartilhadas ligadas, se essa morte levaria o jogador ativo ao Nível 10, o ajudante também vence.")
      : t("The helper does not gain levels from the kill except an Elf (one level per monster slain).", "O ajudante não ganha níveis da morte, exceto um Elfo (um nível por monstro morto).");
    return `
      ${sectionHeading("combat", t("Combat", "Combate"), "07", [2, 3, 4, 5])}
      <div class="turn-block"><h3>${t("Turn structure", "Estrutura do turno")}</h3>
        ${lineList(turnPhaseLines())}
      </div>
      <div class="turn-block"><h3>${t("Fighting", "Lutando")}</h3>
        ${lineList([
          t("Compare combat strengths. If yours is higher, you kill the monster and gain levels and Treasures per the card. Ties go to the monster.", "Compare forças de combate. Se a sua for maior, mata o monstro e ganha níveis e Tesouros conforme a carta. Empates vão para o monstro."),
          t("Removing the last monster ends the combat instantly.", "Remover o último monstro encerra o combate na hora."),
          t("Nonlethal wins may skip levels and/or Treasures — read the ability.", "Vitórias não letais podem pular níveis e/ou Tesouros — leia a habilidade."),
          t("Anyone may play one-shots, Class/Race abilities, Door cards (e.g. enhancers) into the fight.", "Qualquer um pode jogar usos únicos, habilidades de Classe/Raça, cartas de Porta (ex.: reforços) na luta."),
          t("After you think you won, wait ~2.6 seconds for others to speak before rewards are final.", "Depois de acha que venceu, espere ~2,6 segundos para os outros falarem antes das recompensas serem finais.")
        ])}
      </div>
      <div class="turn-block"><h3>${t("Monsters and enhancers", "Monstros e reforços")}</h3>
        ${lineList([
          t("Door monster in phase 1 attacks the drawer immediately.", "Monstro de Porta na fase 1 ataca quem abriu na hora."),
          t("Monsters from elsewhere go to hand; play on your turn for Look For Trouble or join with Wandering Monster / Undead rule.", "Monstros de outro jeito vão para a mão; jogue no seu turno em Procurar briga ou entre com Monstro errante / regra Morto-vivo."),
          t("Each card is one monster even if the name is plural.", "Cada carta é um monstro mesmo se o nome estiver no plural."),
          t("Enhancers on one monster add; choose which monster when several fight. Mate copies enhancers on its partner.", "Reforços num monstro somam; escolha o monstro quando vários lutam. Companheiro copia reforços do parceiro."),
          t("<strong>Undead:</strong> play Undead from hand into another Undead’s fight without Wandering Monster; cards can make non-Undead count as Undead.", "<strong>Morto-vivo:</strong> jogue Morto-vivo da mão na luta de outro Morto-vivo sem Monstro errante; cartas podem fazer não-Morto-vivo contar como Morto-vivo."),
          t("Multiple monsters: beat combined strength; special ‘Level only’ effects apply to the whole fight; cannot fight one and Run from others.", "Vários monstros: vença a força combinada; efeitos de ‘só Nível’ valem para a luta inteira; não pode lutar com um e Fugir dos outros.")
        ])}
      </div>
      <div class="turn-block"><h3>${t("Asking for help", "Pedir ajuda")}</h3>
        ${lineList([
          t("If you cannot win alone, ask one player at a time until someone helps or all refuse. Only one helper adds strength.", "Se não pode vencer sozinho, pergunte a um jogador por vez até alguém ajudar ou todos recusarem. Só um ajudante soma força."),
          t("Bribe with Items you carry, Treasures from the monster, or legal plays on the helper.", "Suborne com Itens que carrega, Tesouros do monstro ou jogadas legais no ajudante."),
          t("Monster specials apply to both sides; helper and active player share the fight.", "Especiais do monstro valem para os dois lados; ajudante e jogador ativo compartilham a luta."),
          t("Active player draws Treasures even if the helper’s ability delivered the kill; agree who picks first if sharing loot.", "Jogador ativo compra Tesouros mesmo se a habilidade do ajudante matou; combinem quem escolhe primeiro se dividir loot."),
          helperWin,
          t("Cards that force help do not work for a win-at-Level-10 fight; forced helpers may back out if it becomes a winning fight. Voluntary helpers cannot back out just because the active player is about to win.", "Cartas que forçam ajuda não funcionam numa luta pela vitória no Nível 10; ajudantes forçados podem sair se virar luta pela vitória. Ajudantes voluntários não podem sair só porque o ativo vai vencer.")
        ])}
      </div>
      <div class="turn-block"><h3>${t("Rewards", "Recompensas")}</h3>
        ${lineList([
          t("One level per monster killed unless the card says otherwise.", "Um nível por monstro morto, salvo o que a carta diga."),
          t("Draw Treasures equal to the monster’s number, modified by enhancers. Alone: face-down. With help: face-up for the table.", "Compre Tesouros iguais ao número do monstro, modificado por reforços. Sozinho: virado para baixo. Com ajuda: virado para cima na mesa."),
          t("Helpers may play Treasures as soon as they receive them.", "Ajudantes podem jogar Tesouros assim que recebem.")
        ])}
      </div>
      <div class="turn-block"><h3>${t("Interfering in someone else’s fight", "Atrapalhar a luta de outro")}</h3>
        ${lineList([
          t("One-shots (help or ‘accidentally’ hurt).", "Usos únicos (ajudar ou ‘sem querer’ prejudicar)."),
          t("Monster enhancers (usually stronger monster, more Treasure).", "Reforços de monstro (em geral monstro mais forte, mais Tesouro)."),
          t("Wandering Monster or Undead rule to add monsters.", "Monstro errante ou regra Morto-vivo para acrescentar monstros."),
          t("Thief backstab.", "Apunhalar do Ladrão."),
          t("Curses.", "Maldições.")
        ])}
      </div>`;
  }

  function runningDeathCursesSection() {
    return `
      ${sectionHeading("aftermath", t("Running away, death, and curses", "Fugir, morte e maldições"), "08", [5, 6])}
      <div class="turn-block"><h3>${t("Running Away", "Fugir")}</h3>
        ${lineList([
          t("If you must Run Away: no level, no Treasure, no Loot The Room.", "Se precisa Fugir: sem nível, sem Tesouro, sem Saquear o quarto."),
          t("Roll the die: escape on 5+ unless Class, Race, Treasures, or the monster modify it.", "Role o dado: fuja com 5+, salvo modificadores de Classe, Raça, Tesouros ou do monstro."),
          t("Multiple monsters: roll separately in any order; Bad Stuff from each that catches you.", "Vários monstros: role separadamente em qualquer ordem; Coisa feia de cada um que pegar você."),
          t("Cooperating players who still lose both Run Away separately.", "Jogadores cooperando que ainda perdem Fugem separadamente.")
        ])}
      </div>
      <div class="turn-block"><h3>${t("Death", "Morte")}</h3>
        ${lineList([
          t("Die: lose all stuff; keep Class(es), Race(s), Level, Curses affecting you, and Super Munchkin / Half-Breed.", "Morrer: perde tudo; mantém Classe(s), Raça(s), Nível, Maldições que afetam você, e Super Munchkin / Meio-raça."),
          t("No Run Away from remaining monsters once dead.", "Sem Fugir dos monstros restantes depois de morto."),
          t("<strong>Looting the body:</strong> highest Level chooses one card each (die breaks ties); discard leftovers; Hireling/Cheat! items separated.", "<strong>Pilhagem do corpo:</strong> maior Nível escolhe uma carta cada (dado desempata); descarte o resto; itens de Serviçal/Trapacear! separados."),
          t("Dead players cannot receive cards (even Charity) or win. Revive when the next player starts their turn; on your next turn draw 4+4 and play legal cards, then take a normal turn.", "Mortos não recebem cartas (nem Caridade) nem vencem. Revive quando o próximo jogador começar o turno; no seu próximo turno compre 4+4, jogue o que for legal, depois turno normal.")
        ])}
      </div>
      <div class="turn-block"><h3>${t("Curses", "Maldições")}</h3>
        ${lineList([
          t("Face-up Curse when kicking the door applies to the drawer.", "Maldição virada ao arrombar aplica em quem abriu."),
          t("Other Curses go to hand and may be played on any player any time.", "Outras Maldições vão para a mão e podem ser jogadas em qualquer jogador a qualquer momento."),
          t("Most apply immediately and discard; some linger — kept reminders cannot be discarded to power abilities.", "A maioria aplica na hora e descarta; algumas persistem — lembretes guardados não podem ser descartados para pagar habilidades."),
          t("‘Next combat’ or ‘next turn’ Curses count if played during that combat or turn.", "Maldições de ‘próximo combate’ ou ‘próximo turno’ contam se jogadas nesse combate ou turno."),
          t("If a Curse needs something you lack, ignore it (some cards list alternates — read the card).", "Se uma Maldição precisa de algo que você não tem, ignore (algumas cartas têm alternativa — leia a carta)."),
          t("Specific curse wording and monster Bad Stuff are printed on those cards.", "Texto de cada maldição e Coisa feia de monstro estão nas cartas.")
        ])}
      </div>`;
  }

  function exampleSection() {
    return `
      ${sectionHeading("example", t("Worked example", "Exemplo jogado"), "09", [5])}
      <p class="glossary-intro">${t(
        "The rulesheet walks through Aric (Warrior 4 with Chainsaw +3) fighting a Level 10 Net Troll, Suzan interfering with Enraged, and Aric Berserking to win the tie.",
        "A folha acompanha Aric (Guerreiro 4 com Motosserra +3) lutando contra um Troll da Rede de Nível 10, Suzan interferindo com Enfurecido, e Aric Enfurecendo para vencer o empate."
      )}</p>
      <article class="example-card">
        <h3>${t("Net Troll fight (abbreviated)", "Luta do Troll da Rede (resumo)")}</h3>
        ${lineList([
          t("Aric 7 vs Troll 10 — losing. Magic Missile +5 → 12 vs 10.", "Aric 7 vs Troll 10 — perdendo. Míssil mágico +5 → 12 vs 10."),
          t("Suzan plays Enraged +5 on the Troll → 15 vs 12.", "Suzan joga Enfurecido +5 no Troll → 15 vs 12."),
          t("Suzan offers help (Elf 2 + Boots → strength 4); Aric refuses a shared level.", "Suzan oferece ajuda (Elfa 2 + Botas → força 4); Aric recusa nível compartilhado."),
          t("Aric Berserks: discards Thief, Wandering Monster, and Yuppie Water for +3 → 15 vs 15; Warrior wins ties.", "Aric Enfurece: descarta Ladrão, Monstro errante e Água yuppie por +3 → 15 vs 15; Guerreiro vence empates."),
          t("Silence → Aric levels, takes three Treasures from the Troll plus one for Enraged.", "Silêncio → Aric sobe de nível, pega três Tesouros do Troll mais um por Enfurecido.")
        ])}
      </article>`;
  }

  function goldenRulesSection() {
    return `
      ${sectionHeading("golden", t("Conflicts and disputes", "Conflitos e disputas"), "10", [1])}
      <div class="turn-block">
        <p>${t("Follow the card when this sheet disagrees, except ignore effects that contradict the four golden rules unless the card explicitly overrides that rule.", "Siga a carta quando esta folha discordar, exceto ignore efeitos que contradigam as quatro regras de ouro, a menos que a carta diga explicitamente que substitui essa regra.")}</p>
        ${lineList([
          t("Nothing reduces a player below Level 1.", "Nada reduz um jogador abaixo do Nível 1."),
          t("You level from combat only by killing a monster.", "Você sobe de nível em combate só matando um monstro."),
          t("No rewards mid-combat.", "Sem recompensas no meio do combate."),
          t("Level 10 requires you to kill a monster; you cannot force someone to help you do it.", "Nível 10 exige matar um monstro; você não pode forçar alguém a ajudar.")
        ])}
        <p>${t("Other disputes: argue loudly; game owner has final say, or use official FAQ/forums linked on p. 6.", "Outras disputas: discuta alto; dono do jogo decide, ou use FAQ/fóruns oficiais linkados na p. 6.")}</p>
      </div>
      <div class="callout munchkin-note">
        <p>${t(
          "<strong>Not in this guide:</strong> mixing Munchkin sets, expansion boxes, and warehouse products described on p. 6. Use only the core 168-card set for this match.",
          "<strong>Fora deste guia:</strong> misturar sets de Munchkin, caixas de expansão e produtos do depósito descritos na p. 6. Use só o set base de 168 cartas nesta partida."
        )}</p>
      </div>`;
  }

  function glossarySection() {
    const terms = [
      ["Combat strength", "Força de combate", "Your Level plus all modifiers from Items and cards for this fight.", "Seu Nível mais todos os modificadores de Itens e cartas nesta luta.", [3]],
      ["Equipped / carried", "Equipado / carregado", "Items in play; equipped ones give bonuses, carried ones are sideways.", "Itens em jogo; equipados dão bônus, carregados ficam de lado.", [3]],
      ["Monster enhancer", "Reforço de monstro", "Door card that raises or lowers one monster’s strength and Treasure count.", "Carta de Porta que aumenta ou diminui a força e o Tesouro de um monstro.", [4]],
      ["Bad Stuff", "Coisa feia", "Penalty when you fail to Run Away — text on the monster card.", "Penalidade ao falhar em Fugir — texto na carta do monstro.", [5]],
      ["Charity", "Caridade", "End-of-turn hand limit of five cards.", "Limite de cinco cartas na mão no fim do turno.", [2]],
      ["One-shot", "Uso único", "Treasure usable once, often in combat.", "Tesouro usável uma vez, muitas vezes em combate.", [3]]
    ];
    const rows = terms.map(([en, pt, enBody, ptBody, pages]) => `
      <article class="info-card"><h3>${t(en, pt)}</h3><p>${t(enBody, ptBody)}</p><div class="glossary-references">${pages.map((page) => referenceLink(page)).join(" ")}</div></article>`).join("");
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), "11", [1, 2, 3])}
      <div class="quick-grid">${rows}</div>`;
  }

  function renderHeader() {
    return `
      <header class="site-header">
        <a class="brand" href="#/" aria-label="${t("Field Manual home", "Página inicial do Manual de Campo")}">
          <span class="brand-mark" aria-hidden="true">MU</span>
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
    document.body.classList.add("theme-munchkin");
    document.documentElement.lang = state.language;
    document.title = t("Munchkin — Field Manual", "Munchkin — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Interactive rules for Munchkin core (3–6 players). Choose player count and optional faster-play rules before setup.",
        "Regras interativas de Munchkin base (3–6 jogadores). Escolha o número de jogadores e regras opcionais de jogo mais rápido antes da preparação."
      );
    }
    const nav = [
      ["quick-reference", t("Quick Ref", "Referência")],
      ["setup", t("Setup", "Preparação")],
      ["cards", t("Cards", "Cartas")],
      ["actions", t("Timing", "Momento")],
      ["character", t("Character", "Personagem")],
      ["treasures", t("Items", "Itens")],
      ["combat", t("Combat", "Combate")],
      ["aftermath", t("Escape & death", "Fuga e morte")],
      ["example", t("Example", "Exemplo")],
      ["golden", t("Disputes", "Disputas")],
      ["glossary", t("Glossary", "Glossário")]
    ];
    app.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook · core box", "Livro interativo · caixa base")}</p>
          <h1>Munchkin</h1>
          <p class="hero-intro">${t(
            "Kill monsters, steal loot, backstab friends, and race to Level 10. This guide follows the 6-page core rulesheet (July 2019). Monster powers, curse text, and full Class/Race abilities stay on the cards.",
            "Mate monstros, roube tesouros, apunhale amigos e corra para o Nível 10. Este guia segue a folha base de 6 páginas (julho de 2019). Poderes de monstro, texto de maldições e habilidades completas de Classe/Raça ficam nas cartas."
          )}</p>
          <div class="hero-meta"><span>${t("3–6 players", "3–6 jogadores")}</span><span>${t("Dungeon parody", "Paródia de masmorra")}</span><span>${t("Level 10", "Nível 10")}</span></div>
        </div>
        <figure class="hero-map"><img src="${COVER}" alt="${t("Munchkin core rulesheet", "Folha de regras base de Munchkin")}" fetchpriority="high"><figcaption>${t("Rulesheet p. 1", "Folha p. 1")} · Steve Jackson Games</figcaption></figure>
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
          <section class="rule-section">${cardManagementSection()}</section>
          <section class="rule-section">${actionsTimingSection()}</section>
          <section class="rule-section">${characterSection()}</section>
          <section class="rule-section">${treasuresSection()}</section>
          <section class="rule-section">${combatSection()}</section>
          <section class="rule-section">${runningDeathCursesSection()}</section>
          <section class="rule-section">${exampleSection()}</section>
          <section class="rule-section">${goldenRulesSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal guide for Munchkin. Summaries follow the core rulesheet included in this repository with permission. Munchkin is © Steve Jackson Games; art by John Kovalic.",
        "Guia pessoal de Munchkin. Os resumos seguem a folha base incluída neste repositório com autorização. Munchkin é © Steve Jackson Games; arte de John Kovalic."
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
      const done = SETUP_IDS.filter((item) => state.setupChecks.includes(item)).length;
      const progress = root.querySelector("#setup-progress");
      const label = root.querySelector("#setup-progress-label");
      if (progress) {
        progress.value = done;
      }
      if (label) {
        label.textContent = t(`${done} of ${SETUP_IDS.length} steps checked`, `${done} de ${SETUP_IDS.length} etapas concluídas`);
      }
      return;
    }
    if (target instanceof HTMLInputElement && target.matches("[data-players]")) {
      const value = Number.parseInt(target.value, 10);
      commit(() => {
        if (value === 3 || value === 4 || value === 5 || value === 6) {
          state.players = value;
        }
      }, target.id);
      return;
    }
    if (target instanceof HTMLInputElement && target.matches("[data-listen]")) {
      commit(() => {
        state.listenAtDoor = target.value === "yes";
      }, target.id);
      return;
    }
    if (target instanceof HTMLInputElement && target.matches("[data-shared]")) {
      commit(() => {
        state.sharedVictories = target.value === "yes";
      }, target.id);
    }
  }

  function language() {
    return state.language;
  }

  function translate(en, pt) {
    return t(en, pt);
  }

  function setLanguage(code) {
    state.language = code === "en-US" ? "en-US" : "pt-BR";
    saveState();
  }

  window.Munchkin = { renderInto, onClick, onChange, language, translate, setLanguage };
})();
