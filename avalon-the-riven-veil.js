(() => {
  "use strict";

  const STORAGE_KEY = "field-manual.avalon-the-riven-veil.v1";
  const MANUAL_FILE = "avalon_core.pdf";
  const factions = [
    { id: "undead", en: "The Undead", pt: "Os Mortos-Vivos" },
    { id: "knights", en: "Knights of the Round", pt: "Cavaleiros da Távola Redonda" },
    { id: "druids", en: "The Druids", pt: "Os Druidas" },
    { id: "fomorians", en: "The Fomorians", pt: "Os Fomorianos" }
  ];
  const modes = {
    length: ["normal", "long"],
    battle: ["standard", "deterministic"],
    factions: ["symmetric", "asymmetric"]
  };
  const recoveryModes = {
    "catch-up": { favorSide: "A", greenKnight: true },
    "favor-b": { favorSide: "B", greenKnight: true },
    "no-green-knight": { favorSide: "A", greenKnight: false },
    "no-catch-up": { favorSide: "B", greenKnight: false }
  };

  let storageNotice = "";
  let root = null;

  function defaultState() {
    return {
      language: "pt-BR",
      playerCount: 4,
      gameLength: "normal",
      battleMode: "standard",
      factionMode: "symmetric",
      recoveryMode: "catch-up",
      favorSide: "A",
      greenKnight: true,
      turnOrderMarkers: false,
      simultaneousCombatDraw: false,
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
    const playerCount = Number(saved.playerCount);
    if ([2, 3, 4].includes(playerCount)) {
      next.playerCount = playerCount;
    }
    if (modes.length.includes(saved.gameLength)) {
      next.gameLength = saved.gameLength;
    }
    if (modes.battle.includes(saved.battleMode)) {
      next.battleMode = saved.battleMode;
    }
    if (modes.factions.includes(saved.factionMode)) {
      next.factionMode = saved.factionMode;
    }
    const legacyRecoveryMode = saved.favorSide === "B"
      ? saved.greenKnight === false ? "no-catch-up" : "favor-b"
      : saved.greenKnight === false ? "no-green-knight" : "catch-up";
    next.recoveryMode = Object.prototype.hasOwnProperty.call(recoveryModes, saved.recoveryMode)
      ? saved.recoveryMode
      : legacyRecoveryMode;
    next.favorSide = recoveryModes[next.recoveryMode].favorSide;
    next.greenKnight = recoveryModes[next.recoveryMode].greenKnight;
    next.turnOrderMarkers = saved.turnOrderMarkers === true;
    next.simultaneousCombatDraw = next.battleMode === "standard" && saved.simultaneousCombatDraw === true;
    next.setupChecks = Array.isArray(saved.setupChecks) && !Array.isArray(saved.factions)
      ? [...new Set(saved.setupChecks.filter((id) => typeof id === "string"))]
      : [];
    return next;
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? normalizeState(JSON.parse(raw)) : defaultState();
    } catch (error) {
      storageNotice = "read";
      console.error("Could not read Avalon: The Riven Veil match settings.", error);
      return defaultState();
    }
  }

  let state = loadState();

  function saveState() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (storageNotice === "write") {
        storageNotice = "";
      }
    } catch (error) {
      storageNotice = "write";
      console.error("Could not save Avalon: The Riven Veil match settings.", error);
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
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function configurationKey() {
    return JSON.stringify({
      playerCount: state.playerCount,
      gameLength: state.gameLength,
      battleMode: state.battleMode,
      factionMode: state.factionMode,
      recoveryMode: state.recoveryMode,
      turnOrderMarkers: state.turnOrderMarkers,
      simultaneousCombatDraw: state.simultaneousCombatDraw
    });
  }

  function commit(mutator) {
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
  }

  function referenceLink(page) {
    const label = t(`Manual p. ${page} ↗`, `Manual (EN) p. ${page} ↗`);
    return `<a class="source-link" href="manuals/${MANUAL_FILE}#page=${page}" target="_blank" rel="noreferrer">${label}</a>`;
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

  function seasonPhaseHeading(id, index, title, description, page) {
    return `
      <header class="avalon-phase-heading">
        <span class="avalon-phase-number">${index}</span>
        <div>
          <p class="eyebrow">${t("PHASE", "FASE")} ${index}</p>
          <h3 id="${id}">${title}</h3>
          <p>${description}</p>
        </div>
        ${referenceLink(page)}
      </header>`;
  }

  function jump(id, label) {
    return `<button type="button" data-scroll="${id}">${label}</button>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function storageNoticeText() {
    if (storageNotice === "read") {
      return t(
        "This browser could not read saved Avalon settings. A new match is shown; your previous settings may not be available.",
        "Este navegador não conseguiu ler a partida salva de Avalon. Uma nova partida está na tela; suas preferências anteriores podem não estar disponíveis."
      );
    }
    return t(
      "This browser refused to save Avalon settings. The latest change is visible on screen only.",
      "Este navegador recusou salvar as preferências de Avalon. A alteração mais recente aparece apenas na tela."
    );
  }

  function radioOption(name, key, value, selected, title, description) {
    const id = `avalon-${name}-${value}`;
    const dataAttribute = key === "playerCount" ? "data-player-count" : `data-mode="${key}"`;
    const checked = selected === value;
    return `
      <label class="avalon-choice-card ${checked ? "is-selected" : ""}" for="${id}">
        <input id="${id}" type="radio" name="avalon-${name}" value="${escapeHtml(value)}" ${dataAttribute} ${checked ? "checked" : ""}>
        <span class="avalon-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function radioGroup(key, title, summary, selected, options, pages = []) {
    const name = key === "playerCount" ? "players" : key;
    return `
      <fieldset class="avalon-choice-group">
        <legend>${title}</legend>
        <p class="avalon-choice-summary">${summary}</p>
        <div class="avalon-choice-grid">${options.map((item) => radioOption(name, key, item.value, selected, item.title, item.description)).join("")}</div>
        ${pages.length ? `<p class="avalon-choice-references">${pages.map(referenceLink).join("")}</p>` : ""}
      </fieldset>`;
  }

  function renderConfiguration() {
    const recoverySummary = {
      "catch-up": t(
        "Use Favor Track side A. The last-place player may gain the Green Knight when the printed VP gap is met.",
        "Use o lado A da Trilha de Favor. O último colocado pode ganhar o Cavaleiro Verde quando a diferença de VP impressa for atingida."
      ),
      "favor-b": t(
        "Use Favor Track side B without catch-up stars, while keeping the conditional Green Knight.",
        "Use o lado B da Trilha de Favor, sem estrelas de recuperação, mas mantenha o Cavaleiro Verde condicional."
      ),
      "no-green-knight": t(
        "Keep Favor Track side A and its VP stars, but do not use the Green Knight.",
        "Mantenha o lado A da Trilha de Favor e suas estrelas de VP, mas não use o Cavaleiro Verde."
      ),
      "no-catch-up": t(
        "Use competitive Favor Track side B and do not use the Green Knight.",
        "Use o lado B competitivo da Trilha de Favor e não use o Cavaleiro Verde."
      )
    }[state.recoveryMode];
    const battleSummary = state.battleMode === "standard"
      ? t("Draw Combat Cards up to the Battle Plan limit; drawing too much can make the Plan fail.", "Compre Cartas de Combate até o limite do Plano de Batalha; comprar demais pode fazê-lo falhar.")
      : t("Gain the full Battle Plan limit instead of drawing Combat Cards.", "Receba todo o limite do Plano de Batalha em vez de comprar Cartas de Combate.");
    const factionSummary = state.factionMode === "symmetric"
      ? t("Use side A of both boards. All factions share the same powers, and faction objectives are not used.", "Use o lado A dos dois tabuleiros. Todas as facções compartilham os mesmos poderes e não há objetivos de facção.")
      : t("Use Lord board side A and Faction board side B. Completing a faction objective upgrades the Lord board to side B.", "Use o lado A do tabuleiro de Lorde e o lado B do tabuleiro de Facção. Cumprir o objetivo de facção melhora o tabuleiro de Lorde para o lado B.");
    const complete = [2, 3, 4].includes(state.playerCount);
    return `
      <section class="controls-panel avalon-config" aria-labelledby="configure-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="configure-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t("Choose the player count and game options first. Players choose their factions at the table during setup. Changes here clear only the setup checklist.", "Defina primeiro o número de jogadores e as opções da partida. As facções são escolhidas à mesa durante a preparação. Alterações aqui limpam apenas a checklist.")}</p>
          </div>
          <span class="saved-label">${t("Saved per game", "Salvo por jogo")}</span>
        </div>
        ${radioGroup("playerCount", t("Players", "Jogadores"), t("The manual supports 2–4 players. Player count changes Deep Mist spaces and the Mist Deck size.", "O manual aceita 2–4 jogadores. A quantidade muda os espaços de Névoa Profunda e o tamanho do Baralho de Névoa."), String(state.playerCount), [
          { value: "2", title: "2", description: t("Four Deep Mist regions; use 2 Artifacts, 2 Mythical Beasts, and the Grail in each Mist Deck.", "Quatro regiões de Névoa Profunda; use 2 Artefatos, 2 Criaturas Míticas e o Graal em cada Baralho de Névoa.") },
          { value: "3", title: "3", description: t("Two Deep Mist regions; use 3 Artifacts, 3 Mythical Beasts, and the Grail in each Mist Deck.", "Duas regiões de Névoa Profunda; use 3 Artefatos, 3 Criaturas Míticas e o Graal em cada Baralho de Névoa.") },
          { value: "4", title: "4", description: t("No Deep Mist regions; use 4 Artifacts, 4 Mythical Beasts, and the Grail in each Mist Deck.", "Nenhuma região de Névoa Profunda; use 4 Artefatos, 4 Criaturas Míticas e o Graal em cada Baralho de Névoa.") }
        ], [4, 7, 9])}
        ${radioGroup("gameLength", t("Game length", "Duração"), state.gameLength === "normal"
          ? t("The match ends after Season 2.", "A partida termina após a Temporada 2.")
          : t("The match ends after Season 3.", "A partida termina após a Temporada 3."), state.gameLength, [
          { value: "normal", title: t("Normal game", "Partida normal"), description: t("Play 2 seasons. The game ends after season 2.", "Jogue 2 temporadas. A partida termina após a Temporada 2.") },
          { value: "long", title: t("Long game", "Partida longa"), description: t("Play 3 seasons for a longer campaign (about 20 extra minutes per player); the game ends after season 3.", "Jogue 3 temporadas para uma campanha mais longa (cerca de 20 minutos extras por jogador); a partida termina após a Temporada 3.") }
        ], [5])}
        ${radioGroup("battleMode", t("Battle system", "Sistema de batalha"), battleSummary, state.battleMode, [
          { value: "standard", title: t("Standard battles", "Batalhas padrão"), description: t("Draw Combat Cards up to the Battle Plan limit. The push-your-luck draw can fail if its total exceeds that limit.", "Compre Cartas de Combate até o limite do Plano de Batalha. A compra arriscada pode falhar se o total ultrapassar esse limite.") },
          { value: "deterministic", title: t("Deterministic battles", "Batalhas determinísticas"), description: t("Do not draw Combat Cards. Gain the full Battle Plan limit, including the bonus for each Bonus Card.", "Não compre Cartas de Combate. Receba o limite total do Plano de Batalha, incluindo o bônus de cada Carta Bônus.") }
        ], [5, 20, 21])}
        ${radioGroup("factionMode", t("Faction mode", "Modo de facções"), factionSummary, state.factionMode, [
          { value: "symmetric", title: t("Symmetric factions", "Facções simétricas"), description: t("Use side A of both the Faction and Lord boards. Factions share the same powers; faction objectives are not used.", "Use o lado A dos tabuleiros de Facção e de Lorde. As facções compartilham os mesmos poderes; objetivos de facção não são usados.") },
          { value: "asymmetric", title: t("Asymmetric factions", "Facções assimétricas"), description: t("Start with Lord board side A and Faction board side B. Completing a faction objective upgrades the Lord board to side B.", "Comece com o lado A do tabuleiro de Lorde e o lado B do tabuleiro de Facção. Cumprir o objetivo de facção melhora o tabuleiro de Lorde para o lado B.") }
        ], [5, 17])}
        ${radioGroup("recoveryMode", t("Catch-up rules", "Recuperação"), recoverySummary, state.recoveryMode, [
          { value: "catch-up", title: t("Catch-up mechanisms", "Mecanismos de recuperação"), description: t("Favor Track side A and allow the eligible last-place player to gain the Green Knight when the printed VP gap is met.", "Trilha de Favor no lado A e Cavaleiro Verde disponível ao último colocado elegível quando atingir a diferença de VP impressa.") },
          { value: "favor-b", title: t("Competitive Favor Track only", "Somente Trilha de Favor competitiva"), description: t("Use side B without its catch-up VP stars, but keep the conditional Green Knight. This applies only the track-side change.", "Use o lado B sem as estrelas de recuperação, mas mantenha o Cavaleiro Verde condicional. Esta opção altera somente o lado da trilha.") },
          { value: "no-green-knight", title: t("No Green Knight only", "Sem Cavaleiro Verde"), description: t("Keep Favor Track side A and its VP stars, but no player gains the Green Knight. This applies only the Green Knight change.", "Mantenha o lado A da Trilha de Favor e suas estrelas de VP, mas ninguém recebe o Cavaleiro Verde. Esta opção desativa somente o Cavaleiro.") },
          { value: "no-catch-up", title: t("Little or no catch-up", "Pouca ou nenhuma recuperação"), description: t("Use Favor Track side B and do not use the Green Knight. This applies both no-catch-up changes.", "Use o lado B da Trilha de Favor e não use o Cavaleiro Verde. Esta opção aplica as duas mudanças sem recuperação.") }
        ], [5, 16, 18])}
        <div class="avalon-optional-groups">
          ${radioGroup("turnOrderMarkers", t("Optional initiative aid", "Auxílio opcional de iniciativa"), state.turnOrderMarkers
            ? t("Faction Cubes will mark the turn order on the Favor board each Preparation round.", "Cubos de Facção marcarão a ordem dos turnos no tabuleiro de Favor em cada rodada de Preparação.")
            : t("No extra markers will be used to show the turn order.", "Nenhum marcador extra será usado para mostrar a ordem dos turnos."), String(state.turnOrderMarkers), [
            { value: "true", title: t("Use turn-order markers", "Usar marcadores de ordem"), description: t("Place Faction Cubes on the Favor board's Strength Track each Preparation round and remove them at round end.", "Coloque Cubos de Facção na Trilha de Força do tabuleiro de Favor a cada rodada de Preparação e retire-os ao fim da rodada.") },
            { value: "false", title: t("Do not use extra markers", "Não usar marcadores extras"), description: t("Track initiative from the revealed cards and leave the Strength Track clear.", "Acompanhe a iniciativa pelas cartas reveladas e deixe a Trilha de Força livre.") }
          ], [10])}
          ${state.battleMode === "standard" ? radioGroup("simultaneousCombatDraw", t("Optional Combat Card draw", "Compra opcional de Cartas de Combate"), state.simultaneousCombatDraw
            ? t("Draw Combat Cards simultaneously only when every player agrees.", "Compre Cartas de Combate simultaneamente somente se todos concordarem.")
            : t("Draw Combat Cards in starting-strength order.", "Compre Cartas de Combate em ordem de força inicial."), String(state.simultaneousCombatDraw), [
            { value: "false", title: t("Draw in strength order", "Comprar em ordem de força"), description: t("Resolve each player's draw before the next player draws.", "Resolva a compra de cada jogador antes que o próximo compre.") },
            { value: "true", title: t("Draw simultaneously", "Comprar simultaneamente"), description: t("Only if all players agree; nobody may wait to see how many cards another player draws.", "Somente se todos concordarem; ninguém pode esperar para ver quantas cartas outro jogador compra.") }
          ], [21]) : `<p class="avalon-option-note">${t("Simultaneous draws are unavailable in Deterministic battles because no Combat Cards are drawn.", "Compras simultâneas não estão disponíveis em batalhas determinísticas porque não há compra de Cartas de Combate.")} ${referenceLink(5)} ${referenceLink(21)}</p>`}
        </div>
        <p class="avalon-config-status" role="status">${complete
          ? t("Configuration complete — the setup below matches these choices.", "Configuração completa — a preparação abaixo corresponde a estas escolhas.")
          : t("Choose a supported player count before using the setup checklist.", "Escolha um número válido de jogadores antes de usar a checklist.")}</p>
      </section>`;
  }

  function iconographySection() {
    const page24Icons = [
      {
        id: "unexplored-region",
        name: ["Unexplored region", "Região inexplorada"],
        description: [
          "A face-down Mist Card makes the region unexplored whether its Region Tile is face up or down. It has no terrain type; Units there add no strength and do not count toward Prophecies.",
          "Uma carta de Névoa virada para baixo torna a região inexplorada, esteja a peça aberta ou virada. Ela não tem tipo de terreno; Unidades ali não somam força nem contam para Profecias."
        ]
      },
      {
        id: "explored-region",
        name: ["Explored region", "Região explorada"],
        description: [
          "The Region Tile is face up and has no face-down Mist Card on it.",
          "A peça de Região está aberta e não tem uma carta de Névoa virada para baixo."
        ]
      },
      {
        id: "forest-region",
        name: ["Forest region", "Região de floresta"],
        description: [
          "A region whose terrain is Forest.",
          "Região cujo terreno é Floresta."
        ]
      },
      {
        id: "mountain-region",
        name: ["Mountain region", "Região de montanha"],
        description: [
          "A region whose terrain is Mountain.",
          "Região cujo terreno é Montanha."
        ]
      },
      {
        id: "river-region",
        name: ["River region", "Região de rio"],
        description: [
          "A region whose terrain is River.",
          "Região cujo terreno é Rio."
        ]
      },
      {
        id: "coastal-regions",
        name: ["Coastal regions", "Regiões costeiras"],
        description: [
          "The four regions in Avalon's outer ring.",
          "As quatro regiões do anel externo de Avalon."
        ]
      },
      {
        id: "inner-regions",
        name: ["Inner regions", "Regiões internas"],
        description: [
          "The four regions in Avalon's inner ring.",
          "As quatro regiões do anel interno de Avalon."
        ]
      },
      {
        id: "center-region",
        name: ["Center region", "Região central"],
        description: [
          "The central region of Avalon.",
          "A região no centro de Avalon."
        ]
      },
      {
        id: "quadrant",
        name: ["Quadrant", "Quadrante"],
        description: [
          "A set of 3 regions. Use the board's N/E/S/W orientation: north is up, east right, south down, west left.",
          "Conjunto de 3 regiões. Use a orientação N/E/S/W impressa no tabuleiro: norte para cima, leste à direita, sul para baixo e oeste à esquerda."
        ]
      },
      {
        id: "to-icon",
        name: ["“To” arrow", "Seta “para”"],
        description: [
          "The effect before the arrow must go to the target after it; for example, Settle to an Inner region.",
          "O efeito antes da seta deve ir ao destino depois dela; por exemplo, Assentar numa região Interna."
        ]
      },
      {
        id: "ability",
        name: ["Ability", "Habilidade"],
        description: [
          "An additional effect that can be activated once per season during its owner's Preparation turn.",
          "Efeito adicional que pode ser ativado uma vez por estação no turno de Preparação de seu dono."
        ]
      },
      {
        id: "reaction-ability",
        name: ["Reaction ability", "Habilidade de reação"],
        description: [
          "An ability used when its condition occurs, even outside its owner's turn.",
          "Habilidade usada quando sua condição ocorre, mesmo fora do turno de seu dono."
        ]
      },
      {
        id: "passive",
        name: ["Passive", "Passivo"],
        description: [
          "An effect that remains active; an Artifact passive requires that Artifact to be equipped.",
          "Efeito que permanece ativo; um passivo de Artefato exige que ele esteja equipado."
        ]
      },
      {
        id: "victory-points",
        name: ["VPs (Victory Points)", "VPs (Pontos de Vitória)"],
        description: [
          "The player with the most VPs at game's end wins. Move the VP marker and use a VP token when crossing 100.",
          "Vence quem tiver mais VPs ao fim da partida. Mova o marcador de VP e use uma ficha de VP ao passar de 100."
        ]
      },
      {
        id: "unit",
        name: ["Unit", "Unidade"],
        description: [
          "A Warrior, Champion, Lord, or Mythical Beast you control. Settlements are not Units.",
          "Guerreiro, Campeão, Lorde ou Criatura Mítica sob seu controle. Assentamentos não são Unidades."
        ]
      },
      {
        id: "warrior",
        name: ["Warrior", "Guerreiro"],
        description: [
          "A standard troop Unit, not a Champion, Lord, or Mythical Beast.",
          "Unidade de tropa comum, não é Campeão, Lorde nem Criatura Mítica."
        ]
      },
      {
        id: "lord",
        name: ["Lord", "Lorde"],
        description: [
          "Your faction's commander and a Hero. A Lord explores, can enter from supply as a deployment to a Coastal or settled region, equips Artifacts, and lets you play a Battle Plan in its region.",
          "Comandante da facção e um Herói. O Lorde explora, pode entrar da reserva como desdobramento numa região Costeira ou com Assentamento, equipa Artefatos e permite jogar Plano de Batalha em sua região."
        ]
      },
      {
        id: "champion",
        name: ["Champion", "Campeão"],
        description: [
          "One of your 3 numbered special Units. Champions equip Artifacts and let you play Battle Plans in their region.",
          "Uma de suas 3 Unidades especiais numeradas. Campeões equipam Artefatos e permitem jogar Planos de Batalha em sua região."
        ]
      },
      {
        id: "hero",
        name: ["Hero", "Herói"],
        description: [
          "Specifically a Lord or Champion you control; not a Warrior or Mythical Beast.",
          "Especificamente um Lorde ou Campeão sob seu controle; não é Guerreiro nem Criatura Mítica."
        ]
      },
      {
        id: "mythical-beast",
        name: ["Mythical Beast", "Criatura Mítica"],
        description: [
          "A creature of Avalon you control after bonding it.",
          "Criatura de Avalon sob seu controle após vinculá-la."
        ]
      },
      {
        id: "enemy",
        name: ["Enemy", "Inimigo"],
        description: [
          "A standard icon surrounded by spikes refers to a component controlled by another player.",
          "Um ícone comum cercado por pontas refere-se a um componente controlado por outro jogador."
        ]
      }
    ];
    const page25Icons = [
      {
        id: "strength",
        name: ["Strength", "Força"],
        description: [
          "Each strength icon is 1 strength. Every basic Unit and Settlement adds 1 strength to its region.",
          "Cada ícone de força vale 1. Cada Unidade básica e Assentamento soma 1 de força à região."
        ]
      },
      {
        id: "strength-token",
        name: ["+1 Strength token", "Ficha de Força +1"],
        description: [
          "A permanent token attached to a component; it adds 1 strength. The token supply is unlimited.",
          "Ficha permanente anexada a um componente; soma 1 de força. O suprimento dessas fichas é ilimitado."
        ]
      },
      {
        id: "initiative-1-card",
        name: ["Initiative 1 card", "Carta de iniciativa 1"],
        description: [
          "A Main Deck card with initiative 1 in its top-left corner. The same card marker also appears with 2 and 3.",
          "Carta de baralho principal com iniciativa 1 no canto superior esquerdo. O marcador também aparece com 2 e 3."
        ]
      },
      {
        id: "move-card",
        name: ["Move Card", "Carta de Movimento"],
        description: [
          "A yellow card from the Move deck, guaranteed to have movement icons.",
          "Carta amarela do baralho de Movimento, que sempre tem ícones de movimento."
        ]
      },
      {
        id: "deploy-card",
        name: ["Deploy Card", "Carta de Desdobramento"],
        description: [
          "A green card from the Deploy deck, guaranteed to have a deploy icon.",
          "Carta verde do baralho de Desdobramento, que sempre tem um ícone de desdobrar."
        ]
      },
      {
        id: "settle-card",
        name: ["Settle Card", "Carta de Assentamento"],
        description: [
          "A blue card from the Settle deck, guaranteed to have a Settle icon.",
          "Carta azul do baralho de Assentamento, que sempre tem um ícone de Assentar."
        ]
      },
      {
        id: "battle-plan-card",
        name: ["Battle Plan Card", "Carta de Plano de Batalha"],
        description: [
          "A red Battle Plan deck card. Use it with Bonus Cards to set a Combat Card strength limit and gain its effect.",
          "Carta vermelha do baralho de Planos de Batalha. Use-a com Cartas Bônus para definir o limite de força das Cartas de Combate e receber seu efeito."
        ]
      },
      {
        id: "move-1-unit",
        name: ["Move 1 Unit", "Mover 1 Unidade"],
        description: [
          "Move one Unit from a region to one adjacent region.",
          "Mova uma Unidade de uma região para uma região adjacente."
        ]
      },
      {
        id: "move-army",
        name: ["Move an Army", "Mover um exército"],
        description: [
          "Move any number of Units from one region to one adjacent region.",
          "Mova qualquer quantidade de Unidades de uma região para uma adjacente."
        ]
      },
      {
        id: "move-in",
        name: ["Move In", "Mover para dentro"],
        description: [
          "Move any number of Units from any number of adjacent regions into one target region.",
          "Mova qualquer quantidade de Unidades de várias regiões adjacentes para uma região-alvo."
        ]
      },
      {
        id: "move-in-here",
        name: ["Move In Here", "Mover para cá"],
        description: [
          "Move any number of Units from adjacent regions into the region where this reward was gained.",
          "Mova qualquer quantidade de Unidades de regiões adjacentes para a região onde recebeu esta recompensa."
        ]
      },
      {
        id: "move-out",
        name: ["Move Out", "Mover para fora"],
        description: [
          "Move any number of Units from one region to any number of adjacent regions.",
          "Mova qualquer quantidade de Unidades de uma região para várias regiões adjacentes."
        ]
      },
      {
        id: "deploy",
        name: ["Deploy", "Desdobrar"],
        description: [
          "Deploy the number of Units shown after the plus from supply to the same Coastal or settled region.",
          "Desdobre a quantidade de Unidades após o sinal de mais da reserva para a mesma região Costeira ou com Assentamento."
        ]
      },
      {
        id: "deploy-2-warriors-here",
        name: ["Deploy 2 Warriors Here", "Desdobrar 2 Guerreiros aqui"],
        description: [
          "Deploy 2 Warriors into the reward region. If gained through a Settlement, deploy them to that settled region.",
          "Desdobre 2 Guerreiros na região da recompensa. Se recebeu o efeito por um Assentamento, coloque-os naquela região."
        ]
      },
      {
        id: "deploy-champion-here",
        name: ["Deploy a Champion Here", "Desdobrar um Campeão aqui"],
        description: [
          "Deploy one Champion into the region where this reward was gained.",
          "Desdobre um Campeão na região onde recebeu esta recompensa."
        ]
      },
      {
        id: "settlement",
        name: ["Settlement", "Assentamento"],
        description: [
          "A structure that provides a deployment position and grants printed bonuses.",
          "Estrutura que oferece um ponto de desdobramento e concede os bônus impressos."
        ]
      },
      {
        id: "settle",
        name: ["Settle", "Assentar"],
        description: [
          "Place your Settlement in an explored region where you have strength.",
          "Coloque seu Assentamento numa região explorada onde você tenha força."
        ]
      },
      {
        id: "favor",
        name: ["Favor", "Favor"],
        description: [
          "Move your marker up one space on the Favor Track and gain any reward shown there.",
          "Avance seu marcador uma casa na Trilha de Favor e receba a recompensa mostrada nela."
        ]
      },
      {
        id: "star",
        name: ["Star", "Estrela"],
        description: [
          "A catch-up VP opportunity provided by spaces on the Favor Track.",
          "Oportunidade de receber VPs de recuperação nas casas da Trilha de Favor."
        ]
      },
      {
        id: "draw-card",
        name: ["Draw a Card", "Comprar uma carta"],
        description: [
          "Draw from the top of any Main Deck. If it is empty, shuffle its discard pile into a new deck.",
          "Compre do topo de qualquer baralho principal. Se estiver vazio, embaralhe o descarte para formar um novo."
        ]
      },
      {
        id: "discard-card",
        name: ["Discard a Card", "Descartar uma carta"],
        description: [
          "Discard one card from your hand to its matching discard pile.",
          "Descarte uma carta da mão na pilha de descarte correspondente."
        ]
      },
      {
        id: "cost-reduction",
        name: ["Cost Reduction", "Redução de custo"],
        description: [
          "Pay one fewer card for a card cost when the printed discount condition is met; costs cannot go below 0.",
          "Pague uma carta a menos quando cumprir a condição impressa; custos não ficam abaixo de 0."
        ]
      },
      {
        id: "faction-power",
        name: ["Faction Power", "Poder de Facção"],
        description: [
          "A resource tracked on your Faction board and spent to activate some abilities.",
          "Recurso marcado no tabuleiro de Facção e gasto para ativar algumas habilidades."
        ]
      },
      {
        id: "artifact",
        name: ["Artifact", "Artefato"],
        description: [
          "An item that can be equipped to a Lord or Champion. The Grail and Excalibur are also Artifacts.",
          "Item que pode ser equipado num Lorde ou Campeão. O Graal e Excalibur também são Artefatos."
        ]
      },
      {
        id: "excalibur",
        name: ["Excalibur", "Excalibur"],
        description: [
          "Claimed by the first player to reach the end of Favor, or by the unique highest-Favor player at the start of War.",
          "Reivindicada por quem primeiro chega ao fim da trilha de Favor, ou por quem tiver mais Favor no início da Guerra, sem empate."
        ]
      }
    ];
    const renderIconCards = (items, page) => items.map((item) => `
      <article class="icon-card avalon-manual-icon">
        <span class="manual-icon-frame"><img class="manual-icon" src="assets/avalon/icons/${item.id}.webp?v=3" alt=""></span>
        <div><strong>${t(...item.name)}</strong><p>${t(...item.description)} ${referenceLink(page)}</p></div>
      </article>`).join("");
    return `
      ${sectionHeading("iconography", t("Iconography", "Iconografia"), "01", 24)}
      <p class="glossary-intro">${t(
        "Every symbol below is an individual crop from the manual, followed by its corresponding definition. Icons without a symbol on these pages (such as Battle or Bonus Cards) are not invented here; component text takes precedence.",
        "Cada símbolo abaixo é um recorte individual do manual, seguido de sua definição correspondente. Termos sem ícone nestas páginas (como Batalha ou Cartas Bônus) não recebem símbolos inventados; o texto dos componentes prevalece."
      )}</p>
      <h3 class="avalon-appendix-title">${t("Regions, abilities, and units · page 24", "Regiões, habilidades e unidades · página 24")}</h3>
      <div class="icon-grid avalon-icon-grid">${renderIconCards(page24Icons, 24)}</div>
      <h3 class="avalon-appendix-title">${t("Strength, cards, actions, and resources · page 25", "Força, cartas, ações e recursos · página 25")}</h3>
      <div class="icon-grid avalon-icon-grid">${renderIconCards(page25Icons, 25)}</div>`;
  }

  function quickReference() {
    const seasons = state.gameLength === "normal" ? 2 : 3;
    const battleSetting = state.battleMode === "standard"
      ? [
        t("Use Battle Plans, then draw Combat Cards up to the limit.", "Use Planos de Batalha e compre Cartas de Combate até o limite."),
        t("Exceeding the limit causes failure.", "Ultrapassar o limite causa falha.")
      ]
      : [
        t("Do not draw Combat Cards.", "Não compre Cartas de Combate."),
        t("Each Battle Plan receives its full strength limit, including +1 per Bonus Card.", "Cada Plano de Batalha recebe seu limite total de força, incluindo +1 por Carta Bônus.")
      ];
    return `
      ${sectionHeading("quick-reference", t("Quick reference", "Referência rápida"), "02", 8)}
      <div class="quick-grid">
        <article class="info-card">
          <span class="card-number">01</span><h3>${t("Game and victory", "Partida e vitória")}</h3>
          ${lineList([
            t(`Play ${seasons} seasons.`, `Jogue ${seasons} estações.`),
            t("The player with the most VPs after the final season wins.", "Vence quem tiver mais VPs ao fim da última."),
            t("If tied, the Holy Grail bearer wins; if nobody tied bears it, all tied players win.", "No empate, vence quem carrega o Santo Graal; se nenhum empatado o carregar, todos os empatados vencem.")
          ])}
          <p>${jump("victory", t("Scoring details", "Detalhes da pontuação"))}</p>
        </article>
        <article class="info-card">
          <span class="card-number">02</span><h3>${t("Season order", "Ordem da estação")}</h3>
          ${lineList([
            t("<strong>Mist Phase</strong> → 3 Preparation rounds → <strong>War Phase</strong>.", "<strong>Fase de Névoa</strong> → 3 rodadas de Preparação → <strong>Fase de Guerra</strong>."),
            t("In each round, all players choose a card simultaneously.", "Em cada rodada, todos escolhem uma carta simultaneamente."),
            t("Turns resolve from highest initiative to lowest.", "Os turnos resolvem da maior para a menor iniciativa.")
          ])}
          <p>${jump("turns", t("Phase and turn rules", "Regras de fase e turno"))}</p>
        </article>
        <article class="info-card">
          <span class="card-number">03</span><h3>${t("Preparation turn", "Turno de Preparação")}</h3>
          ${lineList([
            t("Resolve your card or take one standard action, then use eligible abilities.", "Resolva sua carta ou faça uma ação padrão, depois use habilidades elegíveis."),
            t("Discard the played card and its costs.", "Descarte a carta e seus custos."),
            t("Draw 2 cards from any Main Decks.", "Compre 2 cartas de quaisquer baralhos principais."),
            t("Enforce the 5-Unit region limit.", "Respeite o limite de 5 Unidades por região.")
          ])}
          <p>${jump("turns", t("Actions and movement", "Ações e movimento"))}</p>
        </article>
        <article class="info-card">
          <span class="card-number">04</span><h3>${t("Battle setting", "Modo de batalha")}</h3>
          ${lineList(battleSetting)}
          <p>${jump("war", t("War Phase sequence", "Sequência da Fase de Guerra"))}</p>
        </article>
        <article class="info-card">
          <span class="card-number">05</span><h3>${t("Information and precedence", "Informação e precedência")}</h3>
          ${lineList([
            t("Hands are unlimited and their card counts are public.", "A mão não tem limite e sua quantidade de cartas é pública."),
            t("Cards and Mist Cards remain face down until their rules reveal them.", "Cartas e cartas de Névoa ficam viradas para baixo até que as regras mandem revelá-las."),
            t("When the rulebook conflicts with a card or faction board, follow the component.", "Se o manual divergir de uma carta ou tabuleiro de facção, siga o componente.")
          ])}
          <p>${referenceLink(8)} ${referenceLink(24)}</p>
        </article>
      </div>`;
  }

  function setupPhases() {
    const mistArtifactCount = state.playerCount;
    const mistBeastCount = state.playerCount;
    const deepMistCount = state.playerCount === 2 ? 4 : state.playerCount === 3 ? 2 : 0;
    const inaccessible = 9 - deepMistCount;
    const playerAreaLines = [
      t(`Repeat for all ${state.playerCount} players: choose a faction at the table and assemble its unique boards. Use Lord A / Faction ${state.factionMode === "symmetric" ? "A" : "B"} (${state.factionMode === "symmetric" ? "Symmetric" : "Asymmetric"} mode).`, `Repita para os ${state.playerCount} jogadores: escolha uma facção à mesa e monte seus tabuleiros exclusivos. Use Lorde A / Facção ${state.factionMode === "symmetric" ? "A" : "B"} (modo ${state.factionMode === "symmetric" ? "Simétrico" : "Assimétrico"}).`),
      t("Give each player the matching 13 Cubes, 2 Discs, Lord(s), 3 Champions, Warriors, 4 Mythical Beast bases, Settlement tokens, and 1 Card Separator. Keep each set in its owner's supply.", "Entregue a cada jogador 13 Cubos, 2 Discos, Lorde(s), 3 Campeões, Guerreiros, 4 bases de Criatura Mítica, fichas de Assentamento e 1 Separador de Cartas da facção escolhida. Mantenha cada conjunto na reserva de seu dono."),
      t("On each Faction board, place a Settlement on every printed Settlement slot and a Faction Disc at 0 on each track. In Asymmetric mode, also set the faction-objective tracker at its start.", "Em cada tabuleiro de Facção, coloque um Assentamento em cada espaço impresso e um Disco de Facção no 0 de cada trilha. No modo Assimétrico, posicione também o marcador de objetivo no início da trilha."),
      t("For each player, place a Faction Cube at 0 on the Favor Track and another on the VP Track at the starting VP value printed beside the faction on its Lord board.", "Para cada jogador, coloque um Cubo de Facção no 0 da Trilha de Favor e outro na Trilha de VP, no valor inicial impresso ao lado da facção no tabuleiro de Lorde."),
      ...(state.factionMode === "asymmetric" ? [
        t("If a player chose the Druids, place 8 of their 9 Ley Line Discs on the 8 printed spaces and keep the remaining Disc in their supply; otherwise skip this substep.", "Se algum jogador escolheu os Druidas, coloque 8 dos 9 Discos de Linhas Ley nos 8 espaços impressos e mantenha o Disco restante na reserva; caso contrário, pule esta subetapa."),
        t("If a player chose the Knights, give them all 4 Knight Flag tokens; otherwise skip this substep.", "Se algum jogador escolheu os Cavaleiros, entregue as 4 fichas de Bandeira; caso contrário, pule esta subetapa.")
      ] : [])
    ];
    const mistArrangement = state.playerCount === 2
      ? t("Place 4 Deep Mist tokens on the south, north-west, north-east, and north regions; those regions are ignored and cannot receive or move Units.", "Coloque 4 fichas de Névoa Profunda nas regiões sul, noroeste, nordeste e norte; elas são ignoradas e não podem receber nem mover Unidades.")
      : state.playerCount === 3
        ? t("Place 2 Deep Mist tokens on the north-east and north regions; those regions are ignored and cannot receive or move Units.", "Coloque 2 fichas de Névoa Profunda nas regiões nordeste e norte; elas são ignoradas e não podem receber nem mover Unidades.")
        : t("Do not place Deep Mist tokens; all 9 regions are in play.", "Não coloque fichas de Névoa Profunda; as 9 regiões ficam em jogo.");
    const phases = [
      {
        title: t("Table and island", "Mesa e ilha"),
        refs: [4, 6, 7],
        items: [
          { id: "board-frame", title: t("Assemble the Game Board Frame", "Monte a moldura do tabuleiro"), text: t("Join the 4 frame pieces and place the board in the middle of the play area.", "Una as 4 peças da moldura e coloque o tabuleiro no centro da mesa.") },
          { id: "shuffle-region-tiles", title: t("Shuffle the Region Tiles", "Embaralhe as peças de Região"), text: t("Shuffle all Region Tiles without revealing their faces.", "Embaralhe todas as peças de Região sem revelar suas faces.") },
          { id: "place-region-tiles", title: t("Place the 9 starting Region Tiles", "Posicione as 9 peças iniciais de Região"), text: t("Place 4 Coastal, 4 Inner, and 1 Central Region Tile face down in their matching ring spaces. Keep the other tiles face down and out of play.", "Coloque viradas para baixo 4 peças Costeiras, 4 Internas e 1 Central nos espaços do anel correspondente. Deixe as demais peças viradas para baixo e fora de jogo.") },
          { id: "favor-board", title: t("Place the Favor Track board", "Coloque o tabuleiro da Trilha de Favor"), text: t(`Use side ${state.favorSide}, as selected above, near the Game Board Frame.`, `Use o lado ${state.favorSide}, conforme selecionado acima, perto da moldura do tabuleiro.`) },
          ...(deepMistCount > 0 ? [{ id: "deep-mist", title: t("Mark the Deep Mist regions", "Marque as regiões de Névoa Profunda"), text: mistArrangement }] : [])
        ]
      },
      {
        title: t("Player areas", "Áreas dos jogadores"),
        refs: [4, 6],
        items: [
          {
            id: "player-areas",
            title: t("Prepare all player areas", "Prepare todas as áreas dos jogadores"),
            lines: playerAreaLines
          }
        ]
      },
      {
        title: t("Main decks and shared supplies", "Baralhos principais e reservas comuns"),
        refs: [4, 5, 6, 7],
        items: [
          {
            id: "prepare-main-decks",
            title: t("Prepare the four Main Decks", "Prepare os quatro baralhos principais"),
            lines: [
              t("Deploy: sort 40 cards by type, shuffle this deck separately, place it face down, and put its matching Deck Indicator below it.", "Desdobramento: separe 40 cartas pelo tipo, embaralhe este baralho separadamente, coloque-o virado para baixo e ponha seu Indicador abaixo."),
              t("Move: sort 40 cards, shuffle this deck separately, place it face down, and put its matching Deck Indicator below it.", "Movimento: separe 40 cartas, embaralhe este baralho separadamente, coloque-o virado para baixo e ponha seu Indicador abaixo."),
              t("Settle: sort 40 cards, shuffle this deck separately, place it face down, and put its matching Deck Indicator below it.", "Assentamento: separe 40 cartas, embaralhe este baralho separadamente, coloque-o virado para baixo e ponha seu Indicador abaixo."),
              t("Battle Plan: sort 40 cards, shuffle this deck separately, place it face down, and put its matching Deck Indicator below it.", "Plano de Batalha: separe 40 cartas, embaralhe este baralho separadamente, coloque-o virado para baixo e ponha seu Indicador abaixo.")
            ]
          },
          {
            id: "prepare-exploration-decks",
            title: t("Prepare the three discovery decks", "Prepare os três baralhos de descoberta"),
            lines: [
              t("Shuffle the 12 Mythical Beast cards and place that deck face down in its Favor Track space.", "Embaralhe as 12 cartas de Criatura Mítica e coloque o baralho virado para baixo no espaço da Trilha de Favor."),
              t("Shuffle the 24 Artifact cards and place that deck face down in its Favor Track space.", "Embaralhe as 24 cartas de Artefato e coloque o baralho virado para baixo no espaço da Trilha de Favor."),
              t("Shuffle the 12 Prophecy cards and place that deck face down in its Favor Track space.", "Embaralhe as 12 cartas de Profecia e coloque o baralho virado para baixo no espaço da Trilha de Favor.")
            ]
          },
          {
            id: "shared-special-components",
            title: t("Set out special cards and shared components", "Separe as cartas especiais e componentes comuns"),
            lines: [
              t("Put the Green Knight and Excalibur cards in their printed Favor Track spaces; place the Excalibur token at the end of that track.", "Coloque as cartas do Cavaleiro Verde e de Excalibur nos espaços impressos da Trilha de Favor; ponha a ficha de Excalibur no fim da trilha."),
              t("Keep the Holy Grail card/token and Green Knight standee nearby. Put Mythical Beast standees, Strength tokens, VP tokens, and the Tide marker within reach.", "Deixe por perto a carta/ficha do Santo Graal e a miniatura do Cavaleiro Verde. Deixe ao alcance as miniaturas de Criaturas Míticas, fichas de Força e VP e o marcador de Maré.")
            ]
          }
        ]
      },
      {
        title: t("Starting markers and artifacts", "Marcadores iniciais e artefatos"),
        refs: [7, 22, 24],
        items: [
          {
            id: "starting-trackers",
            title: t("Place the starting player and round markers", "Posicione os marcadores iniciais"),
            lines: [
              t(`For each of the ${state.playerCount} players, place one Faction Cube at 0 on the Favor Track and one on the VP Track at the starting VP value printed beside their faction on the Lord board.`, `Para cada um dos ${state.playerCount} jogadores, coloque um Cubo de Facção no 0 da Trilha de Favor e outro na Trilha de VP, no valor inicial impresso ao lado da facção no tabuleiro de Lorde.`),
              t("Place the Season Tracker on season 1 and the Round Tracker on the season-setup space of the Game Board Frame.", "Coloque o Marcador de Estação na estação 1 e o Marcador de Rodada no espaço de preparação da estação na moldura do tabuleiro.")
            ]
          },
          {
            id: "starting-artifact-draft",
            title: t("Complete the starting Artifact choice for all players", "Complete a escolha do Artefato inicial de todos os jogadores"),
            lines: [
              t("For each player, draw 3 cards from the Artifact deck and choose 1 to keep.", "Para cada jogador, compre 3 cartas do baralho de Artefatos e escolha 1 para ficar."),
              t("Return and shuffle the other 2 cards into the Artifact deck; repeat the choice for every player.", "Devolva e embaralhe as outras 2 cartas no baralho; repita a escolha para cada jogador."),
              t("Each player gains the printed VPs from the kept Artifact.", "Cada jogador recebe os VPs impressos no Artefato escolhido."),
              t("Equip the kept Artifact in an available slot on a Lord or Champion; its benefits start immediately.", "Equipe o Artefato escolhido num espaço disponível de um Lorde ou Campeão; seus benefícios começam imediatamente.")
            ]
          }
        ]
      },
      {
        title: t("Season 1: Mist Phase and first hands", "Estação 1: Fase de Névoa e mãos iniciais"),
        refs: [8, 9, 10],
        items: [
          {
            id: "season1-mist-setup",
            title: t("Prepare the Season 1 Mist Deck and regions", "Prepare o Baralho de Névoa e as regiões da Temporada 1"),
            lines: [
              t(`Draw ${mistArtifactCount} Artifacts and ${mistBeastCount} Mythical Beasts from their respective decks.`, `Compre ${mistArtifactCount} Artefatos e ${mistBeastCount} Criaturas Míticas de seus baralhos correspondentes.`),
              t(`Add the Holy Grail card and shuffle all ${inaccessible} cards together to make the face-down Mist Deck.`, `Adicione a carta do Santo Graal e embaralhe as ${inaccessible} cartas juntas para formar o Baralho de Névoa virado para baixo.`),
              t(`Place 1 Mist Card face down on each of the ${inaccessible} regions without a Deep Mist token. Do not reveal them.`, `Coloque 1 carta de Névoa virada para baixo em cada uma das ${inaccessible} regiões sem ficha de Névoa Profunda. Não as revele.`)
            ]
          },
          {
            id: "season1-prophecy",
            title: t("Reveal the Season 1 Prophecy", "Revele a Profecia da Temporada 1"),
            lines: [
              t("Draw 1 card from the Prophecy deck.", "Compre 1 carta do baralho de Profecias."),
              t("Place it face up beneath the Favor Track; it is active for season 1.", "Coloque-a aberta abaixo da Trilha de Favor; ela vale durante a Temporada 1.")
            ]
          },
          {
            id: "starting-hands",
            title: t("Deal the starting hands", "Distribua as mãos iniciais"),
            lines: [
              t(`For each of the ${state.playerCount} players, draw 2 cards face down from each Main Deck: Deploy, Move, Settle, and Battle Plan (8 cards total per player).`, `Para cada um dos ${state.playerCount} jogadores, compre 2 cartas viradas para baixo de cada baralho principal: Desdobramento, Movimento, Assentamento e Plano de Batalha (8 cartas por jogador).`),
              t("Keep all 8 cards face down until the four deck draws are complete, then add them to that player's hand. Hand size is public; card identities remain hidden.", "Mantenha as 8 cartas viradas para baixo até terminar as compras dos quatro baralhos, depois coloque-as na mão do jogador. A quantidade de cartas é pública; as identidades permanecem ocultas.")
            ]
          }
        ]
      }
    ];
    return phases;
  }

  function setupSection() {
    const phases = setupPhases();
    const allItems = phases.flatMap((phase) => phase.items);
    const requiredItems = allItems;
    const validIds = new Set(allItems.map((item) => item.id));
    const normalizedChecks = state.setupChecks.filter((id) => validIds.has(id));
    if (normalizedChecks.length !== state.setupChecks.length) {
      state.setupChecks = normalizedChecks;
      saveState();
    }
    const checkedCount = requiredItems.filter((item) => state.setupChecks.includes(item.id)).length;
    const phaseMarkup = phases.map((phase, index) => `
      <section class="setup-phase">
        <div class="setup-phase-header">
          <span class="setup-phase-number">${String(index + 1).padStart(2, "0")}</span>
          <h3>${phase.title}</h3>
          <div class="setup-phase-references">${phase.refs.map(referenceLink).join("")}</div>
        </div>
        <div class="setup-check-list">
          ${phase.items.map((item) => `
            <label class="setup-check">
              <input type="checkbox" data-setup-check="${escapeHtml(item.id)}" ${state.setupChecks.includes(item.id) ? "checked" : ""}>
              <span>
                <strong>${item.title}</strong>
                ${item.lines
                  ? `<small class="setup-substeps" role="list">${item.lines.map((line) => `<span role="listitem">${line}</span>`).join("")}</small>`
                  : `<small>${item.text}</small>`}
              </span>
            </label>`).join("")}
        </div>
      </section>`).join("");
    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), "03", 6)}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div><h3>${t("Build the table in order", "Prepare a mesa em ordem")}</h3><p>${t("Each checkbox groups one coherent setup stage. Complete every listed substep before checking it; repeated player tasks say when to repeat the same sequence.", "Cada caixa agrupa uma etapa coerente da preparação. Complete todas as subetapas listadas antes de marcá-la; as tarefas repetidas indicam quando repetir a mesma sequência.")}</p></div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${checkedCount} of ${requiredItems.length} setup groups checked`, `${checkedCount} de ${requiredItems.length} grupos de preparação concluídos`)}</span>
            <progress id="setup-progress" max="${Math.max(requiredItems.length, 1)}" value="${checkedCount}" aria-label="${t("Setup checklist progress", "Progresso da checklist")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t("Changing a setup-affecting choice clears this checklist. Changing language does not clear progress. “Uncheck all” clears only the checkboxes. Mist cards, Region Tiles, and player hands remain hidden as directed by the manual; this guide never shares private setup information.", "Alterar uma escolha que afeta a preparação limpa esta checklist. Trocar o idioma não limpa o progresso. “Desmarcar tudo” limpa somente as caixas. Cartas de Névoa, peças de Região e mãos ficam ocultas conforme o manual; este guia nunca compartilha informações privadas da preparação.")}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <div class="avalon-inventory">
        <h3>${t("This match's component inventory", "Inventário de componentes desta partida")}</h3>
        <p>${t("Counts below are for the retail core game; use the selected player count to prepare the variable components.", "As quantidades abaixo são do jogo base Retail; use o número de jogadores selecionado para separar os componentes variáveis.")}</p>
        <div class="avalon-inventory-grid">
          <div><strong>${t("Board", "Tabuleiro")}</strong><span>${t("1 frame; 18 Region Tiles (9 used: 4 Coastal, 4 Inner, 1 Central); 0 / 2 / 4 Deep Mist tokens for 4 / 3 / 2 players; 15 Settlement tokens total.", "1 moldura; 18 peças de Região (9 usadas: 4 Costeiras, 4 Internas, 1 Central); 0 / 2 / 4 fichas de Névoa Profunda para 4 / 3 / 2 jogadores; 15 fichas de Assentamento no total.")}</span></div>
          <div><strong>${t("Per player", "Por jogador")}</strong><span>${t("1 unique faction board and Lord board; 13 Cubes, 2 Discs, Lord(s), 3 Champions, 11 Warriors, 4 Beast bases, faction Settlements, and 1 Card Separator.", "1 tabuleiro de Facção e 1 de Lorde exclusivos; 13 Cubos, 2 Discos, Lorde(s), 3 Campeões, 11 Guerreiros, 4 bases de Criatura, Assentamentos da facção e 1 Separador de Cartas.")}</span></div>
          <div><strong>${t("Main decks", "Baralhos principais")}</strong><span>${t("4 × 40 cards: Deploy, Move, Settle, Battle Plan; 4 matching Deck Indicators.", "4 × 40 cartas: Desdobramento, Movimento, Assentamento e Plano de Batalha; 4 Indicadores correspondentes.")}</span></div>
          <div><strong>${t("Exploration decks", "Baralhos de descoberta")}</strong><span>${t("12 Mythical Beasts, 24 Artifacts, and 12 Prophecies; each is shuffled separately.", "12 Criaturas Míticas, 24 Artefatos e 12 Profecias; cada baralho é embaralhado separadamente.")}</span></div>
          <div><strong>${t("Special cards and tokens", "Cartas e fichas especiais")}</strong><span>${t("Holy Grail card/token; Green Knight card/standee; Excalibur card/token; season and round trackers; Tide marker; Strength and VP tokens.", "Carta/ficha do Santo Graal; carta/miniatura do Cavaleiro Verde; carta/ficha de Excalibur; marcadores de estação e rodada; marcador de Maré; fichas de Força e VP.")}</span></div>
          <div><strong>${t("Initial draw", "Compra inicial")}</strong><span>${t("Each player draws 3 Artifacts and keeps 1; at season start, each draws 2 cards from each of the 4 Main Decks.", "Cada jogador compra 3 Artefatos e fica com 1; no início da estação, compra 2 cartas de cada um dos 4 baralhos principais.")}</span></div>
        </div>
        <p class="source-note">${t("Faction-specific powers and printed starting VP values are on the faction/Lord boards. Follow their exact text; components override this guide if wording differs.", "Poderes de facção e valores iniciais de VP estão nos tabuleiros de facção/Lorde. Siga o texto exato; os componentes prevalecem se houver divergência.")} ${referenceLink(4)} ${referenceLink(5)} ${referenceLink(8)}</p>
      </div>`;
  }

  function victorySection() {
    const seasons = state.gameLength === "normal" ? 2 : 3;
    return `
      ${sectionHeading("victory", t("Victory and scoring", "Vitória e pontuação"), "04", 22)}
      <div class="content-grid">
        <article class="info-card"><h3>${t("Winning the game", "Vencer a partida")}</h3><p>${t(`The game ends after season ${seasons}. At the end of the final War, score all visible Settlement slots one last time. The player with the most VPs wins; if tied, the Holy Grail bearer wins, or all tied players win if none of them bears it. The season-by-season scoring procedure is part of the War Phase in Chapter 5.`, `A partida termina após a estação ${seasons}. Ao fim da Guerra final, pontue mais uma vez todos os espaços visíveis de Assentamento. Vence quem tiver mais VPs; no empate, vence quem carrega o Santo Graal ou, se nenhum empatado o carregar, todos vencem. O procedimento de pontuação de cada estação está na Fase de Guerra do Capítulo 5.`)} ${referenceLink(23)}</p></article>
      </div>`;
  }

  function turnsSection() {
    const seasons = state.gameLength === "normal" ? 2 : 3;
    const mistSteps = [
      t("From season 2 onward (skip in season 1), return all Units to their owners' supplies but leave Settlements, Strength tokens, and Ley Line markers in place. Reveal remaining Mist Cards; return an unclaimed Holy Grail card to the common supply and put the other revealed cards on the bottoms of their matching decks. Remove regions without Settlements, return their tiles to the correct piles, and place replacement tiles face down. If Strength or Ley Line markers must move, return them to the same region.", "A partir da estação 2 (pule na estação 1), devolva todas as Unidades às reservas, mas deixe Assentamentos, fichas de Força e marcadores de Linhas Ley no lugar. Revele as cartas de Névoa restantes; devolva ao suprimento comum a carta do Santo Graal não reivindicada e coloque as demais no fundo dos baralhos correspondentes. Remova regiões sem Assentamentos, devolva suas peças às pilhas corretas e coloque peças novas viradas para baixo. Se fichas de Força ou Linhas Ley precisarem ser movidas, devolva-as à mesma região."),
      t(`Draw ${state.playerCount} Artifacts and ${state.playerCount} Mythical Beasts from their decks, add the Holy Grail card, and shuffle them together. Deal 1 Mist Card face down to every region without Deep Mist.`, `Compre ${state.playerCount} Artefatos e ${state.playerCount} Criaturas Míticas de seus baralhos, adicione a carta do Santo Graal e embaralhe tudo junto. Distribua 1 carta de Névoa virada para baixo em cada região sem Névoa Profunda.`),
      t("Discard the previous Prophecies and return their Faction Cubes to their owners. Season 1's single Prophecy is revealed in Setup; in season 2 reveal 2, and in season 3 reveal 3, face up beneath the Favor Track.", "Descarte as Profecias anteriores e devolva os Cubos de Facção aos donos. A única Profecia da estação 1 é revelada no Setup; na estação 2, revele 2 e, na estação 3, revele 3, abertas abaixo da Trilha de Favor."),
      t("From season 2 onward, return Faction Cubes on used abilities to their supplies. Leave Faction Power and objective trackers where they are.", "A partir da estação 2, devolva às reservas os Cubos de Facção das habilidades usadas. Deixe os marcadores de Poder de Facção e de objetivo onde estão."),
      t("From season 2 onward, gain the VPs from visible Settlement slots and deploy the listed Warriors to each settled region. Include Druid Ley Line bonuses; Warriors from Ley Lines must go to that faction's Settlement.", "A partir da estação 2, receba os VPs dos espaços visíveis de Assentamento e desdobre os Guerreiros indicados em cada região assentada. Inclua os bônus das Linhas Ley dos Druidas; Guerreiros concedidos por Linhas Ley devem ir ao Assentamento daquela facção."),
      t("From season 2 onward, players may simultaneously reassign Artifacts to Heroes with open slots. An Artifact without a bearer can only be equipped during this step.", "A partir da estação 2, os jogadores podem redistribuir Artefatos simultaneamente entre Heróis com espaços livres. Um Artefato sem portador só pode ser equipado nesta etapa."),
      t("Draw 2 cards face down from each of the 4 Main Decks. Keep all cards face down until all draws are complete, then add them to your hand. Hand size is public.", "Compre 2 cartas viradas para baixo de cada um dos 4 baralhos principais. Mantenha todas viradas para baixo até terminar as compras; depois, coloque-as na mão. A quantidade de cartas na mão é pública.")
    ];
    return `
      ${sectionHeading("turns", t("Play a season", "Jogue uma estação"), "05", 8)}
      <div class="avalon-season-flow">
        <div class="callout avalon-season-overview">
          <p>${t(`The game lasts ${seasons} seasons. Season 1's Mist setup and starting hand were completed in Setup, so begin with Preparation. After a War Phase, continue to the next season's Mist Phase unless this was the final season.`, `A partida dura ${seasons} estações. A preparação da Névoa e a mão inicial da estação 1 foram concluídas no Setup; comece pela Preparação. Após a Fase de Guerra, passe à Fase de Névoa da próxima estação, a menos que esta tenha sido a última.`)} ${jump("setup", t("Review the Season 1 setup", "Revise a preparação da estação 1"))}</p>
        </div>
        <section class="avalon-season-phase" aria-labelledby="mist-phase">
          ${seasonPhaseHeading("mist-phase", "01", t("Mist Phase", "Fase de Névoa"), t("At the beginning of seasons 2 and 3, perform the season setup steps in order. The first season's setup is in Chapter 3.", "No início das estações 2 e 3, faça as etapas de preparação da estação em ordem. A preparação da primeira estação está no Capítulo 3."), 9)}
          <ol class="avalon-phase-steps">${mistSteps.map((step) => `<li>${step}</li>`).join("")}</ol>
        </section>
        <section class="avalon-season-phase" aria-labelledby="preparation-phase">
          ${seasonPhaseHeading("preparation-phase", "02", t("Preparation Phase", "Fase de Preparação"), t("Play 3 rounds. Each round has two parts: choose a card, then reveal it and resolve each player's turn in initiative order.", "Jogue 3 rodadas. Cada rodada tem duas partes: escolher uma carta; depois revelá-la e resolver o turno de cada jogador pela ordem de iniciativa."), 10)}
          <div class="avalon-phase-sequence">
            <h4>${t("Repeat this round sequence three times", "Repita esta sequência de rodada três vezes")}</h4>
            <ol>
              <li>${t("Choose one card and any cards required to pay its cost; place the Card Separator behind the cards being played or spent.", "Escolha uma carta e as cartas necessárias para pagar seu custo; coloque o Separador depois das cartas jogadas ou gastas.")}</li>
              <li>${t("Reveal the chosen card, announce its initiative, and determine turn order from highest to lowest.", "Revele a carta escolhida, anuncie sua iniciativa e determine a ordem dos turnos da maior para a menor.")}</li>
              <li>${t("Resolve each player's turn in that order, including any exploration or triggered effects.", "Resolva o turno de cada jogador nessa ordem, incluindo explorações e efeitos desencadeados.")}</li>
              <li>${t("Finish the turn by discarding its played and paid cards, drawing 2 cards, and checking the region Unit limit.", "Encerre o turno descartando as cartas jogadas e pagas, comprando 2 cartas e conferindo o limite de Unidades por região.")}</li>
            </ol>
          </div>
          <h4 class="avalon-phase-subheading">${t("Part 1 · Choose a card and set the turn order", "Parte 1 · Escolha uma carta e determine a ordem")}</h4>
          <div class="content-grid">
        <article class="info-card"><h3>${t("Choose and prepare a card", "Escolha e prepare uma carta")}</h3><p>${t("Simultaneously choose 1 card and place it at the front of your hand. If it has a card cost, put the required payment cards behind it. Apply any cost reduction now, then place your Card Separator behind all cards being played or spent. If you later break the discount condition and cannot pay the extra card, none of the chosen card resolves; take a standard action instead.", "Escolha 1 carta simultaneamente e coloque-a à frente da mão. Se houver custo em cartas, coloque atrás dela as cartas necessárias para pagá-lo. Aplique agora qualquer redução e coloque o Separador depois de todas as cartas jogadas ou gastas. Se depois deixar de cumprir a condição de desconto e não puder pagar a carta adicional, a carta escolhida não resolve; faça uma ação padrão.")} ${referenceLink(10)}</p></article>
        <article class="info-card"><h3>${t("Initiative and ties", "Iniciativa e desempates")}</h3><p>${t("Reveal the chosen card and announce its initiative (1–3); resolve from highest to lowest. For a tie, the Holy Grail bearer may break it once per season, then the lowest VP player, then the player with the lowest starting VP printed on their Lord board. Each tie-breaker chooses an open position in the tied order.", "Revele a carta escolhida e anuncie a iniciativa (1–3); resolva da maior para a menor. No empate, quem carrega o Santo Graal pode desempatar uma vez por estação; depois, o jogador com menos VPs; por fim, o menor VP inicial impresso no tabuleiro de Lorde. Cada desempate escolhe uma posição ainda livre na ordem empatada.")} ${referenceLink(10)}</p></article>
        <article class="info-card"><h3>${t("Optional initiative aid", "Auxílio opcional de iniciativa")}</h3><p>${state.turnOrderMarkers
          ? t("Selected: after initiative is determined, place one Faction Cube per player on the Favor board's Strength Track to display the round's turn order; remove them at the end of the round.", "Selecionado: depois de definir a iniciativa, coloque um Cubo de Facção por jogador na Trilha de Força do tabuleiro de Favor para exibir a ordem dos turnos; retire-os ao fim da rodada.")
          : t("Not selected: follow the revealed initiative order without placing extra markers.", "Não selecionado: siga a ordem de iniciativa revelada sem colocar marcadores extras.")} ${referenceLink(10)}</p></article>
          </div>
          <h4 class="avalon-phase-subheading">${t("Part 2 · Resolve each player's turn", "Parte 2 · Resolva o turno de cada jogador")}</h4>
          <div class="content-grid">
        <h4 class="avalon-phase-subheading">${t("Choose how to use your turn", "Escolha como usar seu turno")}</h4>
        <article class="info-card"><h3>${t("Resolve a turn", "Resolver o turno")}</h3><p>${t("On your turn, resolve the chosen card or take one standard action, and use any number of eligible abilities. Players may choose the order of the card and abilities, but finish each card or ability before starting another. Resolve the chosen card's effects from left to right and top to bottom; “if” and “when” effects happen immediately when their conditions are met.", "No seu turno, resolva a carta escolhida ou faça uma ação padrão, e use qualquer quantidade de habilidades elegíveis. Os jogadores podem escolher a ordem entre a carta e as habilidades, mas terminam cada carta ou habilidade antes de iniciar outra. Resolva os efeitos da carta da esquerda para a direita e de cima para baixo; efeitos “se” e “quando” ocorrem assim que suas condições são cumpridas.")} ${referenceLink(11)}</p></article>
        <article class="info-card"><h3>${t("Card effects and requirements", "Efeitos e requisitos das cartas")}</h3><p>${t("A requirement means at least the stated amount, not exactly that amount. Gain a card reward as soon as its requirement is met, before checking Prophecies; each reward on a card is gained at most once. Taking a reward is optional, but take it whole or not at all. Text that applies to the whole card affects all related icons on it.", "Um requisito pede pelo menos a quantidade indicada, não exatamente. Receba a recompensa de uma carta assim que cumprir o requisito, antes de verificar Profecias; cada recompensa numa carta só é recebida uma vez. Receber uma recompensa é opcional, mas aceite-a inteira ou não aceite. Texto que se aplica à carta toda vale para todos os ícones relacionados.")} ${referenceLink(12)}</p></article>
        <article class="info-card"><h3>${t("Ability timing and markers", "Momento e marcadores de habilidade")}</h3><p>${t("Players may choose the order of their chosen card and eligible abilities, but finish resolving each card or ability before starting another. A normal ability is used once per season during Preparation; place a Faction Cube on it. A Once Per Turn ability may be used on each of the 3 Preparation turns; remove its Cube at turn end. Reactions trigger when their condition is met, even outside a turn or the Preparation Phase. Passives stay active without a Cube; a conditional passive is gained only once. Artifact abilities/passives require the Artifact to be equipped, but its Hero may be in supply.", "Os jogadores escolhem a ordem entre a carta escolhida e as habilidades elegíveis, mas terminam de resolver cada carta ou habilidade antes de iniciar outra. Uma habilidade normal é usada uma vez por estação durante a Preparação; coloque nela um Cubo de Facção. Uma habilidade Uma Vez por Turno pode ser usada em cada um dos 3 turnos de Preparação; retire o Cubo ao fim do turno. Reações ocorrem quando sua condição é cumprida, mesmo fora de um turno ou da Fase de Preparação. Passivos ficam ativos sem Cubo; um passivo condicional é recebido apenas uma vez. Habilidades/passivos de Artefato exigem que ele esteja equipado, mas seu Herói pode estar na reserva.")} ${referenceLink(11)} ${referenceLink(24)}</p></article>
        <h4 class="avalon-phase-subheading">${t("If you do not resolve the chosen card", "Se não resolver a carta escolhida")}</h4>
        <article class="info-card"><h3>${t("Standard actions", "Ações padrão")}</h3><p>${t("Instead of resolving the chosen card, return it and all cards set aside for its cost to your hand, then choose exactly one: discard 1 card to deploy 2 Units to one region; discard 3 cards to build a Settlement; discard 1 card to move any number of Units from one region to any number of adjacent regions; or draw 1 card from a Main Deck at no cost.", "Em vez de resolver a carta escolhida, devolva-a e todas as cartas separadas para o custo à sua mão e escolha exatamente uma: descarte 1 carta para desdobrar 2 Unidades numa região; descarte 3 para construir um Assentamento; descarte 1 para mover qualquer quantidade de Unidades de uma região para várias regiões adjacentes; ou compre 1 carta de um baralho principal sem custo.")} ${referenceLink(11)}</p></article>
        <h4 class="avalon-phase-subheading">${t("If you resolve the chosen card: actions and exploration", "Se resolver a carta escolhida: ações e exploração")}</h4>
        <article class="info-card"><h3>${t("Deploy, settle, and move", "Desdobrar, assentar e mover")}</h3><p>${t("A Deploy effect sends the stated Units from supply to one coastal region or one region where you have a Settlement; unless separated by + symbols or otherwise stated, they all go to the same region. Settle places your leftmost Settlement in an explored region where you have strength and an open slot; gain its placement and revealed-slot bonuses. Movement icons specify one Unit, an army to one adjacent region, moving out to any adjacent regions, or moving in from adjacent regions.", "Um efeito de Desdobramento envia as Unidades indicadas da reserva a uma região costeira ou a uma região onde você tenha Assentamento; salvo símbolos + ou texto diferente, todas vão à mesma região. Assentar coloca seu Assentamento mais à esquerda numa região explorada onde você tenha força e haja espaço; ganhe os bônus do local e do espaço revelado. Ícones de movimento determinam mover uma Unidade, um exército para uma região adjacente, sair para regiões adjacentes ou entrar a partir de regiões adjacentes.")} ${referenceLink(12)} ${referenceLink(13)}</p></article>
        <article class="info-card"><h3>${t("Settlement and deployment limits", "Limites de Assentamento e desdobramento")}</h3><p>${t("Every region except the Center has 2 Settlement slots. A faction may have only 1 Settlement per region; you may share a region with an enemy Settlement. Deploying is allowed into unexplored regions. A Settlement must go in an explored region where you have at least 1 strength and an open slot; gain a region's placement bonus and the revealed Settlement-slot bonuses. Each + separates distinct deploys; card wording can override the normal Coastal-or-Settlement destination.", "Toda região exceto o Centro tem 2 espaços de Assentamento. Cada facção pode ter apenas 1 Assentamento por região; pode dividir a região com um Assentamento inimigo. É permitido desdobrar em regiões inexploradas. Um Assentamento deve ir numa região explorada onde você tenha pelo menos 1 de força e haja espaço; receba o bônus de colocação da região e os bônus revelados do espaço. Cada + separa desdobramentos distintos; o texto da carta pode substituir o destino normal Costeiro ou com Assentamento.")} ${referenceLink(12)} ${referenceLink(24)} ${referenceLink(26)}</p></article>
        <article class="info-card"><h3>${t("Movement and Lords", "Movimento e Lordes")}</h3><p>${t("A Unit may move more than once in a turn if you have enough movement icons. When an effect moves multiple Units, choose all destinations first and move them simultaneously. Units cannot move out of unexplored regions. A Lord may move from supply onto a Coastal or settled region as if it were a one-Unit deployment; this counts as both a move and a deploy for other effects.", "Uma Unidade pode se mover mais de uma vez no turno se houver ícones de movimento suficientes. Quando um efeito move várias Unidades, escolha todos os destinos primeiro e mova-as simultaneamente. Unidades não podem sair de regiões inexploradas. Um Lorde pode sair da reserva e entrar numa região Costeira ou com Assentamento como se fosse um desdobramento de uma Unidade; isso conta como movimento e desdobramento para outros efeitos.")} ${referenceLink(13)}</p></article>
        <article class="info-card"><h3>${t("Explore the Mist", "Explorar a Névoa")}</h3><p>${t("Only a Lord explores. You may explore when deploying or moving a Lord into an unexplored region, or at the start of your turn if your Lord is already there. Explore at most once per turn: flip the Region Tile if needed; take one printed exploration reward; reveal the Mist Card; resolve a revealed Mythical Beast bid immediately; then resume the interrupted effect.", "Só um Lorde explora. Você pode explorar ao desdobrar ou mover um Lorde para uma região inexplorada, ou no início do seu turno se ele já estiver lá. Explore no máximo uma vez por turno: vire a peça de Região se necessário; receba uma recompensa impressa; revele a carta de Névoa; resolva imediatamente uma disputa por Criatura Mítica revelada; então retome o efeito interrompido.")} ${referenceLink(13)} ${referenceLink(14)}</p></article>
        <article class="info-card"><h3>${t("Choose one exploration reward", "Escolha uma recompensa de exploração")}</h3><p>${t("The Region Tile may offer: draw 1 Main Deck card; gain 1 Faction Power; gain 1 Favor; deploy 2 Warriors into the explored region; deploy 1 Champion there; move 1 Unit from any region to an adjacent region; or move any number of Units from adjacent regions into the explored region. Take only one reward printed on that tile.", "A peça de Região pode oferecer: comprar 1 carta de baralho principal; ganhar 1 Poder de Facção; ganhar 1 Favor; desdobrar 2 Guerreiros na região explorada; desdobrar 1 Campeão ali; mover 1 Unidade de qualquer região para uma adjacente; ou mover qualquer quantidade de Unidades das regiões adjacentes para a região explorada. Receba apenas uma recompensa impressa naquela peça.")} ${referenceLink(14)}</p></article>
        <article class="info-card"><h3>${t("Bond a Mythical Beast", "Vincular uma Criatura Mítica")}</h3><p>${t("All players simultaneously bid any number of hand cards by their initiative total; the explorer gets +1. Highest bid wins, with the usual tie-break order. The winner gains the card's VPs and the Beast, then places its standee and matching base in the reveal region. The limit is 1 Beast in season 1, 2 in season 2, and 3 in season 3; faction-specific Beasts and the Green Knight do not count. At capacity, replace a Beast or take only the new card's VPs.", "Todos oferecem simultaneamente qualquer número de cartas da mão, somando suas iniciativas; quem explorou recebe +1. A maior oferta vence, com os desempates usuais. O vencedor recebe os VPs da carta e a Criatura, colocando miniatura e base correspondente na região revelada. O limite é 1 Criatura na estação 1, 2 na estação 2 e 3 na estação 3; Criaturas específicas de facção e o Cavaleiro Verde não contam. No limite, substitua uma Criatura ou receba apenas os VPs da nova carta.")} ${referenceLink(15)}</p></article>
        <article class="info-card"><h3>${t("Resolve a Beast bid", "Resolva a oferta pela Criatura")}</h3><p>${t("Everyone places the bid cards at the front of their hand and the Card Separator behind them; a zero bid places the separator first. Reveal cards and bid totals together. The Grail bearer may break a tie once per season, then use lowest VP and lowest starting VP on the Lord board. The winner takes back the Separator and discards their revealed bid cards; other players return bid cards and Separator to hand.", "Todos colocam as cartas de oferta à frente da mão e o Separador atrás delas; uma oferta zero coloca o separador primeiro. Revelem cartas e totais ao mesmo tempo. Quem carrega o Graal pode desempatar uma vez por estação; depois use menor VP e menor VP inicial no tabuleiro de Lorde. O vencedor recupera o Separador e descarta as cartas reveladas da oferta; os demais devolvem cartas e Separador à mão.")} ${referenceLink(15)}</p></article>
        <h4 class="avalon-phase-subheading">${t("During Preparation: Prophecies and faction objectives", "Durante a Preparação: Profecias e objetivos de facção")}</h4>
        <article class="info-card"><h3>${t("Prophecies and Favor", "Profecias e Favor")}</h3><p>${t("Prophecies resolve left to right and only in the Preparation Phase. A player who meets a requirement places a Cube and gains the printed seasonal VPs, then 3 Favor if first or 2 otherwise. Requirements mean at least the stated amount; Units in unexplored regions do not count. Favor moves one space and grants its printed reward; excess Favor at the end of the track grants 2 VPs per point.", "Profecias resolvem da esquerda para a direita e somente na Fase de Preparação. Quem cumpre um requisito coloca um Cubo e recebe os VPs sazonais impressos, depois 3 de Favor se for o primeiro ou 2 caso contrário. Requisitos pedem pelo menos a quantidade indicada; Unidades em regiões inexploradas não contam. Favor avança uma casa e concede a recompensa impressa; Favor excedente no fim da trilha concede 2 VPs por ponto.")} ${referenceLink(16)} ${referenceLink(18)}</p></article>
        <article class="info-card"><h3>${t("Prophecy timing and ties", "Momento e empate nas Profecias")}</h3><p>${t("Each Prophecy can be completed once per player, only during Preparation. If several players meet one at the same time, all count as first; award their VP/Favor rewards from lowest to highest VP. If several Prophecies are completed at once, resolve them from left to right. Ignore requirements that are impossible because of player-count restrictions; if every requirement on a Prophecy is impossible for that reason, all players complete it. Units in unexplored regions do not count toward Prophecy requirements.", "Cada Profecia só pode ser concluída uma vez por jogador, durante a Preparação. Se vários jogadores a cumprirem ao mesmo tempo, todos contam como primeiros; conceda VPs/Favor da menor para a maior pontuação. Se várias Profecias forem concluídas juntas, resolva da esquerda para a direita. Ignore requisitos impossíveis por restrição do número de jogadores; se todos os requisitos de uma Profecia forem impossíveis por esse motivo, todos os jogadores a concluem. Unidades em regiões inexploradas não contam para Profecias.")} ${referenceLink(16)} ${referenceLink(26)}</p></article>
        <article class="info-card"><h3>${t("Faction objectives", "Objetivos de facção")}</h3><p>${state.factionMode === "symmetric"
          ? t("Not used with the selected Symmetric mode.", "Não são usados no modo Simétrico selecionado.")
          : t("In Asymmetric mode, advance your faction objective track. When its final space is reached, flip your Lord board to side B and transfer any Cubes and tokens to the matching spaces; the objective track is then retired.", "No modo Assimétrico, avance a trilha de objetivo de facção. Ao alcançar a última casa, vire o tabuleiro de Lorde para o lado B e transfira Cubos e fichas aos espaços correspondentes; a trilha de objetivo deixa de ser usada.")} ${referenceLink(17)}</p></article>
      </div>
          <h4 class="avalon-phase-subheading">${t("At the end of each player's turn", "Ao fim do turno de cada jogador")}</h4>
          <div class="content-grid">
            <article class="info-card"><h3>${t("End of turn and region Unit limit", "Fim do turno e limite de Unidades por região")}</h3><p>${t("Discard the resolved card and its paid cards face up to the correct discard pile; other players may not inspect the discard pile. Then draw 2 cards face down from any Main Decks. If a deck is empty, shuffle its discard pile to make a new deck. Hand size is unlimited and the number of cards in each hand is public. At turn end and throughout War, return Units to supply until you have at most 5 Units in each region; Settlements do not count. After the third round, begin the War Phase.", "Descarte abertas a carta resolvida e as cartas pagas na pilha de descarte correta; os demais jogadores não podem consultar o descarte. Depois, compre 2 cartas viradas para baixo de quaisquer baralhos principais. Se um baralho acabar, embaralhe seu descarte para formar um novo. A mão não tem limite e a quantidade de cartas de cada jogador é pública. No fim do turno e durante toda a Guerra, devolva Unidades à reserva até ter no máximo 5 por região; Assentamentos não contam. Após a terceira rodada, comece a Fase de Guerra.")} ${referenceLink(11)} ${referenceLink(17)} ${referenceLink(24)}</p></article>
          </div>
        </section>
        ${warSection()}
      </div>`;
  }

  function appendixSection() {
    const factionRules = {
      druids: [
        t("Each Ley Line grants its printed Settlement bonus when placed and again in each Mist Phase. The main Settlement need not be on Avalon to gain these bonuses; if the bonus deploys Warriors, they must be deployed at that Settlement when it is on Avalon.", "Cada Linha Ley concede seu bônus de Assentamento impresso ao ser colocada e novamente em cada Fase de Névoa. O Assentamento principal não precisa estar em Avalon para receber esses bônus; se o bônus desdobrar Guerreiros, eles precisam ser colocados naquele Assentamento quando ele estiver em Avalon."),
        t("The Ancient One counts as both a Mythical Beast and a Settlement. It stays in its region between seasons, cannot be destroyed as a normal Unit, counts toward the 5-Unit regional limit, and does not count toward the Beast limit.", "O Ancião conta como Criatura Mítica e Assentamento. Permanece na região entre estações, não pode ser destruído como Unidade normal, conta para o limite regional de 5 Unidades e não conta no limite de Criaturas.")
      ],
      knights: [
        t("Chivalry: selecting a Champion is a free action and may be done any number of times during a turn.", "Cavalaria: escolher um Campeão é uma ação gratuita e pode ser feito quantas vezes no turno."),
        t("To Arms: gain strength up to, but not above, the highest enemy strength. A single +1 may bring the Knights to equal strength when the gap is 1; do not spend multiple Faction Power in one use.", "Às Armas: ganhe força até, mas não acima, da maior força inimiga. Um único +1 pode igualar os Cavaleiros quando a diferença é 1; não gaste vários Poderes de Facção num único uso."),
        t("If the Knights gain the Holy Grail or Excalibur, assign it to Arthur or Guinevere. If both enter the same unexplored region, they explore together but still take only one reward, and the Knights still explore at most once per turn.", "Se os Cavaleiros ganharem o Santo Graal ou Excalibur, atribua-o a Arthur ou Guinevere. Se ambos entrarem na mesma região inexplorada, exploram juntos, mas recebem apenas uma recompensa; os Cavaleiros continuam limitados a uma exploração por turno."),
        t("If Sir Percival moves/deploys because a Mythical Beast is moved/deployed by an On Bonding effect, Sir Percival goes to the region where that Beast was revealed, not its destination.", "Se Sir Percival se mover/desdobrar porque uma Criatura Mítica foi movida/desdobrada por um efeito Ao Vincular, Sir Percival vai para a região onde a Criatura foi revelada, não para seu destino.")
      ],
      fomorians: [
        t("Fomorian Settlements count as Coastal regions only for the Fomorians.", "Assentamentos Fomorianos contam como regiões Costeiras somente para os Fomorianos."),
        t("After using Turning the Tide, the Tide marker continues in the chosen direction at the end of that turn.", "Após usar Virar a Maré, o marcador de Maré continua na direção escolhida ao fim daquele turno.")
      ],
      undead: [
        t("Altar of Bones: place an Undead Settlement gained from a battle after all other steps. Use an open Settlement slot if available; otherwise place it anywhere in that region. Resolve its placement and Settlement bonuses as usual; the Undead still have only one Settlement per region.", "Altar dos Ossos: coloque o Assentamento Morto-Vivo obtido numa batalha após todas as outras etapas. Use um espaço livre se houver; caso contrário, coloque-o em qualquer lugar da região. Resolva normalmente os bônus de colocação e de Assentamento; os Mortos-Vivos continuam limitados a um Assentamento por região."),
        t("Corrupt Land: when settling, you may pay the cost to settle one additional time using the normal rules, in a different region and not in a bonus Settlement slot. Gain all other rewards normally.", "Terra Corrompida: ao assentar, você pode pagar o custo para assentar mais uma vez pelas regras normais, em outra região e fora de um espaço de bônus. Receba as demais recompensas normalmente."),
        t("Mordred Ascended does not let the Undead explore an unexplored region during the War Phase.", "Mordred Ascendido não permite que os Mortos-Vivos explorem uma região inexplorada durante a Fase de Guerra.")
      ]
    };
    const selectedFactionCards = state.factionMode === "asymmetric"
      ? factions.map((faction) => {
        return `<article class="info-card"><h3>${t(faction.en, faction.pt)}</h3><p>${t("Apply these clarifications only if a player chose this faction.", "Aplique estes esclarecimentos somente se um jogador escolheu esta facção.")}</p><ul>${factionRules[faction.id].map((rule) => `<li>${rule}</li>`).join("")}</ul></article>`;
      }).join("")
      : `<p class="callout">${t("These faction-specific rules are filtered out in Symmetric mode. All factions use the same simple faction powers there.", "Estas regras específicas de facção ficam ocultas no modo Simétrico. Nesse modo, todas as facções usam os mesmos poderes simples.")} ${referenceLink(5)}</p>`;
    const beastRules = [
      [t("Telios", "Telios"), t("Resolve Telios's ability before any Battle Plan effects.", "Resolva a habilidade de Telios antes de quaisquer efeitos de Plano de Batalha.")],
      [t("The Green Man", "O Homem Verde"), t("Its ability may deploy it into an unexplored region. Its −1 VP applies once per 2 Units, rounded down.", "Sua habilidade pode desdobrá-lo numa região inexplorada. O −1 VP se aplica a cada 2 Unidades, arredondado para baixo.")],
      [t("The Green Knight", "O Cavaleiro Verde"), t("It cannot carry Artifacts; otherwise treat it as a Champion Mythical Beast.", "Não pode carregar Artefatos; nos demais aspectos, trate-o como Criatura Mítica Campeã.")],
      [t("Kelpie and Leviathan", "Kelpie e Leviatã"), t("They deploy to the Sea area, not a region, but are considered on Avalon. Kelpie adds no regional strength until it joins a battle; Leviathan passively adds its strength to regions in its quadrant during Preparation and War.", "Desdobram-se na área do Mar, não numa região, mas são considerados em Avalon. Kelpie não soma força regional até entrar numa batalha; Leviatã soma passivamente sua força às regiões do quadrante durante Preparação e Guerra.")],
      [t("The Questing Beast", "A Besta da Busca"), t("Resolve its bonus VPs for winning after all other Battle Plans and Quests. A Hero moved away by those effects is not counted for the bonus.", "Resolva seus VPs bônus por vencer depois dos demais Planos de Batalha e Missões. Um Herói removido por esses efeitos não conta para o bônus.")],
      [t("Trobsar", "Trobsar"), t("Its Artifact may immediately be equipped to any Hero with an open slot; otherwise keep it by the Faction board to equip in the next Mist Phase.", "Seu Artefato pode ser equipado imediatamente por qualquer Herói com espaço livre; caso contrário, guarde-o junto ao tabuleiro de Facção para a próxima Fase de Névoa.")],
      [t("The White Hart", "O Cervo Branco"), t("Its ability overrides a Battle Plan effect that would negate the White Hart's ability.", "Sua habilidade prevalece sobre um efeito de Plano de Batalha que a anularia.")]
    ];
    const faq = [
      [t("When does a “when” effect happen?", "Quando ocorre um efeito “quando”?"), t("Finish resolving the effect that caused the condition, then resolve the “when you do X, gain Y” reward.", "Termine de resolver o efeito que causou a condição e então resolva a recompensa “quando fizer X, ganhe Y”.")],
      [t("Do requirements mean exactly or at least?", "Requisitos significam exatamente ou pelo menos?"), t("At least. For example, 3 Units satisfy a requirement for 1 Unit.", "Pelo menos. Por exemplo, 3 Unidades satisfazem um requisito de 1 Unidade.")],
      [t("What does one strength icon require?", "O que exige um ícone de força?"), t("At least 1 strength in the region.", "Pelo menos 1 de força na região.")],
      [t("Can an earlier effect trigger an “if” printed on the chosen card?", "Um efeito anterior pode disparar um “se” da carta escolhida?"), t("No. Card “if” conditions are not triggered by effects that happened earlier outside that card.", "Não. Condições “se” da carta não são disparadas por efeitos anteriores fora dela.")],
      [t("What does “Deploy to any explored region” mean?", "O que significa “Desdobrar em qualquer região explorada”?"), t("Ignore the normal Coastal-or-Settlement restriction.", "Ignore a restrição normal de região Costeira ou com Assentamento.")],
      [t("Can a successful Battle Plan draw zero Combat Cards?", "Um Plano de Batalha pode ser bem-sucedido sem comprar Cartas de Combate?"), t("Yes. Drawing zero does not exceed the limit, so the Plan succeeds and resolves.", "Sim. Comprar zero não excede o limite, então o Plano tem sucesso e resolve.")],
      [t("Do Units in unexplored regions count as on Avalon?", "Unidades em regiões inexploradas contam como estando em Avalon?"), t("They count as on Avalon for general card conditions, but give no strength, do not satisfy region-specific Prophecies, and cannot move out until the region is explored.", "Contam como estando em Avalon para condições gerais de cartas, mas não dão força, não satisfazem Profecias específicas de região e não podem sair até a região ser explorada.")],
      [t("Which card does an initiative-triggered passive refer to?", "A qual carta se refere um passivo ativado por iniciativa?"), t("Only the Main Deck card chosen for that Preparation turn, not a Battle Plan, bid card, or Quest card.", "Somente à carta do baralho principal escolhida para aquele turno de Preparação, não a Plano de Batalha, oferta ou Missão.")],
      [t("How do Give No Ground and Carefully Laid Plans combine?", "Como Give No Ground e Carefully Laid Plans se combinam?"), t("If both Plans succeed, their −1 and +1 limit effects cancel each other.", "Se ambos os Planos tiverem sucesso, seus efeitos de −1 e +1 ao limite se anulam.")],
      [t("What does “2 Units in 2 regions” mean?", "O que significa “2 Unidades em 2 regiões”?"), t("At least 2 Units in each of two different qualifying regions.", "Pelo menos 2 Unidades em cada uma de duas regiões elegíveis distintas.")],
      [t("Do unequipped Artifacts work?", "Artefatos não equipados funcionam?"), t("No. An Artifact ability/passive is active only while equipped to a Lord or Champion.", "Não. Habilidade/passivo de Artefato só funciona enquanto equipado num Lorde ou Campeão.")],
      [t("Can VP fall below zero?", "VP pode ficar abaixo de zero?"), t("No. You can lose VPs only if you have enough to pay; your VP cannot go below 0.", "Não. Só se perdem VPs se houver o bastante para pagar; o total não fica abaixo de 0.")],
      [t("Can two card discounts both apply?", "Duas reduções de custo podem se combinar?"), t("Yes, if you show that each discount's requirement is satisfied.", "Sim, se você demonstrar que cada requisito de redução foi cumprido.")]
    ];
    return `
      ${sectionHeading("appendix", t("FAQs and clarifications", "FAQ e esclarecimentos"), "06", 26)}
      <h3 class="avalon-appendix-title">${t("Frequently asked rules", "Dúvidas frequentes de regras")}</h3>
      <div class="avalon-faq">${faq.map(([question, answer]) => `<details><summary>${question}</summary><p>${answer}</p></details>`).join("")}</div>
      <h3 class="avalon-appendix-title">${t("Asymmetric faction clarifications", "Esclarecimentos das facções assimétricas")}</h3>
      <div class="content-grid">${selectedFactionCards}</div>
      <h3 class="avalon-appendix-title">${t("Mythical Beast rulings", "Esclarecimentos sobre Criaturas Míticas")}</h3>
      <div class="content-grid">${beastRules.map(([name, rule]) => `<article class="info-card"><h3>${name}</h3><p>${rule}</p></article>`).join("")}</div>
      <p class="source-note">${t("Faction abilities and card-specific effects not listed in this appendix remain on their physical components; follow that printed wording.", "Habilidades de facção e efeitos de cartas não listados neste apêndice permanecem nos componentes físicos; siga o texto impresso.")} ${referenceLink(26)} ${referenceLink(27)}</p>`;
  }

  function warSection() {
    const battleModeText = state.battleMode === "standard"
      ? t("In Standard mode, draw Combat Cards up to the Battle Plan limit; exceeding it causes failure.", "No modo Padrão, compre Cartas de Combate até o limite do Plano; ultrapassá-lo causa falha.")
      : t("In Deterministic mode, do not draw Combat Cards; gain the full Battle Plan limit, including +1 per Bonus Card.", "No modo Determinístico, não compre Cartas de Combate; ganhe o limite total do Plano, incluindo +1 por Carta Bônus.");
    const combatDrawText = state.battleMode !== "standard"
      ? t("There is no Combat Card draw order in this match.", "Não há ordem de compra de Cartas de Combate nesta partida.")
      : state.simultaneousCombatDraw
        ? t("Optional simultaneous draw selected: use it only if all players agree, and nobody waits to observe another player's draw count.", "Compra simultânea selecionada: use-a somente se todos concordarem, sem esperar para observar quantas cartas outro jogador compra.")
        : t("Draw one player at a time, from highest to lowest starting strength. Ties draw in lowest-current-VP order, then by the lowest starting VP printed on the Lord board.", "Compre um jogador por vez, da maior para a menor força inicial. Empates compram em ordem de menor VP atual e depois pelo menor VP inicial impresso no tabuleiro de Lorde.");
    const failureText = state.battleMode === "standard"
      ? t("Reveal Combat Cards together. A total above the Plan limit fails: those cards add no strength, the player gains half the printed limit rounded up, and none of the Plan's effects resolve, including “when revealed” effects. A successful Plan adds the total and resolves its effects.", "Revelem as Cartas de Combate juntas. Total acima do limite faz o Plano falhar: as cartas não somam força, o jogador ganha metade do limite impresso arredondada para cima e nenhum efeito do Plano resolve, inclusive efeitos “ao revelar”. Um Plano bem-sucedido soma o total e resolve seus efeitos.")
      : t("No Plan can fail from drawing too many cards in this mode. The full limit is automatic and the Plan's other effects resolve at their printed timing.", "Neste modo, nenhum Plano falha por comprar cartas demais. O limite total é automático e os demais efeitos do Plano resolvem no momento impresso.");
    const battleSteps = [
      t("Calculate and record each player's starting strength.", "Calcule e registre a força inicial de cada jogador."),
      t("Players with a Hero choose up to 1 Battle Plan and up to 3 Bonus Cards, then place the Card Separator behind them.", "Jogadores com Herói escolhem até 1 Plano de Batalha e até 3 Cartas Bônus e colocam o Separador atrás delas."),
      t("Reveal Battle Plans and Bonus Cards together and state each Plan limit (+1 per Bonus Card). Apply Plan effects only at their printed timing; a failed Plan has no effects.", "Revelem Planos de Batalha e Cartas Bônus juntos e declarem cada limite (+1 por Bônus). Apliquem os efeitos do Plano somente no momento impresso; um Plano falho não tem efeitos."),
      state.battleMode === "standard"
        ? t("Draw Combat Cards as configured (in starting-strength order, or simultaneously only if everyone agreed). Each card's initiative is its strength; stop at any time.", "Compre Cartas de Combate conforme configurado (pela força inicial ou simultaneamente somente se todos concordaram). A iniciativa de cada carta é sua força; pare quando quiser.")
        : t("Deterministic mode: do not draw Combat Cards; each Plan gets its full limit.", "Modo Determinístico: não compre Cartas de Combate; cada Plano recebe seu limite total."),
      state.battleMode === "standard"
        ? t("Reveal all drawn Combat Cards simultaneously.", "Revelem simultaneamente todas as Cartas de Combate compradas.")
        : t("Skip the Combat Card reveal step.", "Pule a etapa de revelar Cartas de Combate."),
      state.battleMode === "standard"
        ? t("Check success: total at or below the limit succeeds; above the limit fails.", "Verifique o resultado: total igual ou abaixo do limite tem sucesso; acima falha.")
        : t("Skip failure checks; the full limit is automatic.", "Pule o teste de falha; o limite total é automático."),
      state.battleMode === "standard"
        ? t("A successful Plan adds its Combat Card total and resolves normal effects. A failed Plan adds half its printed limit, rounded up, and no Plan effects.", "Um Plano bem-sucedido soma o total das Cartas de Combate e resolve efeitos normais. Um Plano falho soma metade do limite impresso, arredondada para cima, e não resolve efeitos.")
        : t("Add the full Plan limit as strength and resolve its other effects at their printed timing.", "Some o limite total do Plano como força e resolva os demais efeitos no momento impresso."),
      t("Resolve “if you win / don't win” effects, compare total strength, and score first/second place.", "Resolva efeitos “se vencer / se não vencer”, compare a força total e pontue primeiro/segundo lugar."),
      t("Award the Artifact or Holy Grail in the region, if any.", "Entregue o Artefato ou Santo Graal da região, se houver."),
      t("Resolve “after the battle” effects; discard or recover Battle Plans/Bonus Cards as directed and discard all Combat Cards.", "Resolva efeitos “após a batalha”; descarte ou recupere Planos/Bônus conforme indicado e descarte todas as Cartas de Combate.")
    ];
    const greenKnightText = state.greenKnight
      ? t("Selected: at the start of War, if at least two VP-star spaces lie between the last-place player's marker and the next-lowest VP player (not counting either occupied space), and last place is not tied, that player controls the Green Knight for this War. Place its standee using one of their Beast bases in a region containing an enemy Hero. It is a Unit, but not part of the Beast limit; control ends after War.", "Selecionado: no início da Guerra, se houver pelo menos dois espaços de estrela de VP entre o marcador do último colocado e o próximo jogador (sem contar as casas ocupadas) e não houver empate no último lugar, esse jogador controla o Cavaleiro Verde nesta Guerra. Coloque a miniatura usando uma base de Criatura numa região com um Herói inimigo. É uma Unidade, mas não conta no limite de Criaturas; o controle termina após a Guerra.")
      : t("Not used in this match. No player gains the Green Knight.", "Não é usado nesta partida. Nenhum jogador recebe o Cavaleiro Verde.");
    return `
      <section class="avalon-season-phase" aria-labelledby="war">
        ${seasonPhaseHeading("war", "03", t("War Phase", "Fase de Guerra"), t("After all 3 Preparation rounds, resolve explored regions with strength in the order below. Fight only where multiple factions are present; then finish the season.", "Após as 3 rodadas de Preparação, resolva na ordem abaixo as regiões exploradas com força. Lute apenas onde houver várias facções; depois, encerre a estação."), 18)}
        <h4 class="avalon-phase-subheading">${t("At the start of War", "No início da Guerra")}</h4>
        <div class="content-grid">
          <article class="info-card"><h3>${t("Excalibur and the Favor Track", "Excalibur e a Trilha de Favor")}</h3><p>${t("A player who reaches the end of the Favor Track alone during Preparation claims Excalibur immediately. If it remains unclaimed at the start of War, the player with uniquely highest Favor takes it; a tie means no one does. The bearer assigns it to a Lord: +2 strength and a once-per-season ability to add +1 in a battle where they tie for first. Reset every Favor marker to 0 after the claim check.", "Quem alcançar sozinho o fim da Trilha de Favor durante a Preparação reivindica Excalibur imediatamente. Se ela ainda não tiver sido reivindicada no início da Guerra, quem tiver mais Favor sem empate a recebe; em caso de empate, ninguém recebe. O portador a atribui a um Lorde: +2 de força e uma habilidade por estação para somar +1 numa batalha em que empate em primeiro. Após verificar a posse, zere todos os marcadores de Favor.")} ${referenceLink(16)} ${referenceLink(18)}</p></article>
          <article class="info-card"><h3>${t("Green Knight", "Cavaleiro Verde")}</h3><p>${greenKnightText} ${referenceLink(18)}</p></article>
        </div>
        <h4 class="avalon-phase-subheading">${t("Resolve every region in this order", "Resolva todas as regiões nesta ordem")}</h4>
        <div class="content-grid">
          <article class="info-card"><h3>${t("Resolve regions in order", "Resolva as regiões na ordem")}</h3><p>${t("Score explored regions with strength, beginning at the north-east Coastal region, clockwise around the Coastal ring, then the northern Inner region clockwise around the Inner ring, and finally the Center. Units in unexplored regions provide no strength and are not scored.", "Pontue regiões exploradas com força, começando pela região Costeira nordeste e seguindo no sentido horário; depois comece pela região Interna norte e siga no sentido horário; por fim, pontue o Centro. Unidades em regiões inexploradas não dão força nem pontuam.")} ${referenceLink(18)} ${referenceLink(19)}</p></article>
          <article class="info-card"><h3>${t("Calculate strength", "Calcule a força")}</h3><p>${t("Each basic Unit and Settlement is 1 strength. Lords and Champions use the value printed on their component; equipped Artifacts add their stated strength; each Strength token adds 1. Mythical Beast strength comes from its card ability/passive. A Unit with two designations does not receive two base-strength bonuses. Record the total on the Strength Track with a Faction Cube.", "Cada Unidade básica e Assentamento vale 1 de força. Lordes e Campeões usam o valor impresso no componente; Artefatos equipados somam a força indicada; cada ficha de Força soma 1. A força de Criaturas Míticas vem da habilidade/passivo da carta. Uma Unidade com duas designações não recebe dois bônus de força base. Registre o total na Trilha de Força com um Cubo de Facção.")} ${referenceLink(19)} ${referenceLink(20)}</p></article>
          <article class="info-card"><h3>${t("One faction present", "Uma facção presente")}</h3><p>${t("If only one faction has strength in an explored region, there is no battle and no Battle Plan. That faction immediately scores first place and claims any Artifact or Holy Grail in the region.", "Se apenas uma facção tiver força numa região explorada, não há batalha nem Plano de Batalha. Essa facção pontua imediatamente em primeiro lugar e reivindica qualquer Artefato ou Santo Graal da região.")} ${referenceLink(19)} ${referenceLink(22)}</p></article>
          <article class="info-card"><h3>${t("Non-Hero battle", "Batalha sem Herói")}</h3><p>${t("If two or more factions have strength but no involved faction has a Lord or Champion in the region, total each faction's strength and proceed directly to region scoring. No Battle Plans are played.", "Se duas ou mais facções tiverem força, mas nenhuma tiver Lorde ou Campeão na região, some a força de cada uma e passe diretamente à pontuação. Não se jogam Planos de Batalha.")} ${referenceLink(20)}</p></article>
          <article class="info-card"><h3>${t("Hero battle sequence", "Sequência de batalha com Herói")}</h3><ol>${battleSteps.map((step) => `<li>${step}</li>`).join("")}</ol><p>${t("If a Hero is present, follow these steps; the next cards explain each decision and result.", "Se houver um Herói, siga estas etapas; os cartões seguintes explicam cada decisão e resultado.")} ${referenceLink(20)} ${referenceLink(21)} ${referenceLink(22)} ${referenceLink(23)}</p></article>
          <article class="info-card"><h3>${t("Hero battle: Plans and limits", "Batalha com Herói: Planos e limites")}</h3><p>${t("If any faction has a Hero present, each player with a Hero may secretly choose up to 1 Battle Plan and up to 3 Bonus Cards from any Main Deck. Each Bonus Card adds 1 to the Plan's strength limit. A free Main Deck card may be used face down as a Plan with limit 3 and no effect. Reveal choices simultaneously and state their limits. Resolve effects at their printed timing; if a Plan fails, none of its effects apply.", "Se houver um Herói de qualquer facção, cada jogador com Herói pode escolher em segredo até 1 Plano de Batalha e até 3 Cartas Bônus de qualquer baralho principal. Cada Bônus soma 1 ao limite de força do Plano. Uma carta principal pode ser usada gratuitamente, virada para baixo, como Plano de limite 3 sem efeito. Revelem as escolhas simultaneamente e declarem os limites. Resolva os efeitos no momento impresso; se um Plano falhar, nenhum de seus efeitos se aplica.")} ${referenceLink(20)}</p></article>
          <article class="info-card"><h3>${t("Combat and failed Plans", "Combate e Planos falhos")}</h3><p>${battleModeText} ${combatDrawText}</p><p>${failureText} ${referenceLink(21)}</p></article>
        </div>
        <h4 class="avalon-phase-subheading">${t("Score the region, award rewards, and clear the battle", "Pontue a região, entregue recompensas e encerre a batalha")}</h4>
        <div class="content-grid">
          <article class="info-card"><h3>${t("Scoring a region", "Pontuar uma região")}</h3><p>${t("Only explored regions are scored. First place gains the full seasonal VP reward; second place gains half rounded up only when first place is not tied. A tie for first gives every tied player the full reward and no one else scores. A tie for second gives each tied player half rounded up.", "Só regiões exploradas pontuam. O primeiro lugar ganha a recompensa total de VP da estação; o segundo ganha metade, arredondada para cima, apenas quando o primeiro não está empatado. Empate em primeiro concede a recompensa total a todos os empatados e ninguém mais pontua. Empate em segundo concede metade arredondada para cima a cada empatado.")} ${referenceLink(22)}</p></article>
          <article class="info-card"><h3>${t("Artifacts and the Holy Grail", "Artefatos e Santo Graal")}</h3><p>${t("The first-place player in an Artifact region takes that card and its VPs. Equip it immediately if a Hero has an open slot; otherwise keep it by the Faction board to equip next Mist Phase. For a tied first-place battle, reveal one extra Artifact per additional winner; tied winners choose in lowest-to-highest VP order. A first-place winner in the Grail region gains the Grail instead of an Artifact; tied winners use the lowest-VP tie-break.", "Quem ficar em primeiro numa região com Artefato recebe a carta e seus VPs. Equipe imediatamente se um Herói tiver espaço; caso contrário, guarde-a ao lado do tabuleiro de Facção para equipar na próxima Fase de Névoa. Em empate no primeiro lugar, revele um Artefato extra por vencedor adicional; os empatados escolhem da menor para a maior quantidade de VPs. O primeiro na região do Graal recebe o Graal em vez de um Artefato; no empate, usa-se o desempate de menor VP.")} ${referenceLink(17)} ${referenceLink(22)}</p></article>
          <article class="info-card"><h3>${t("The Grail bearer", "Quem carrega o Graal")}</h3><p>${t("When a player gains the Holy Grail, they gain 10 VPs and assign its token to one Lord; it does not use an Artifact slot. That Lord gains +1 strength and may break one initiative tie per season. Revealing the Grail Mist Card does not change the current bearer's control; control changes only when another player claims the token. If tied winners claim it, the lowest-VP winner takes it; if tied on VPs, compare the starting VP value on their Lord boards.", "Ao receber o Santo Graal, o jogador ganha 10 VPs e atribui a ficha a um Lorde; ela não ocupa espaço de Artefato. Esse Lorde ganha +1 de força e pode desempatar uma iniciativa por estação. Revelar a carta de Névoa do Graal não altera o controle do portador atual; ele só muda quando outro jogador reivindica a ficha. Se houver empate entre vencedores, o de menor VP recebe o Graal; empatados em VP comparam o VP inicial dos tabuleiros de Lorde.")} ${referenceLink(10)} ${referenceLink(17)}</p></article>
          <article class="info-card"><h3>${t("After each battle", "Após cada batalha")}</h3><p>${t("Resolve “if you win / don't win” effects, award any Artifact or Grail, then apply “after the battle” effects. Discard all Combat Cards. First place discards its Battle Plan and Bonus Cards; other players discard a failed Plan but recover Bonuses, or recover a successful Plan and all Bonuses.", "Resolva efeitos “se vencer / se não vencer”, entregue Artefato ou Graal e aplique efeitos “após a batalha”. Descarte todas as Cartas de Combate. O primeiro descarta Plano e Bônus; os demais descartam Plano falho, mas recuperam Bônus, ou recuperam Plano bem-sucedido e todos os Bônus.")} ${referenceLink(22)} ${referenceLink(23)}</p></article>
        </div>
        <h4 class="avalon-phase-subheading">${t("After the final region", "Após a última região")}</h4>
        <div class="content-grid">
          <article class="info-card"><h3>${t("Finish the season", "Encerre a estação")}</h3><p>${t("After War, the Green Knight's control ends: remove its standee, return its card to the Favor Track board, and return the Beast base to supply. Each player discards all remaining hand cards and gains 1 VP per card. If another season remains, begin its Mist Phase. After the final season, score the revealed Settlement slots one last time; the player with most VPs wins. If tied, the Holy Grail bearer wins, or all tied players win if none of them bears it.", "Após a Guerra, termina o controle do Cavaleiro Verde: retire a miniatura, devolva a carta ao tabuleiro da Trilha de Favor e a base à reserva. Cada jogador descarta todas as cartas restantes na mão e ganha 1 VP por carta. Se houver outra estação, comece sua Fase de Névoa. Após a última estação, pontue mais uma vez os espaços revelados de Assentamento; vence quem tiver mais VPs. No empate, vence quem carrega o Santo Graal; se nenhum empatado o carregar, todos vencem.")} ${referenceLink(18)} ${referenceLink(23)}</p></article>
        </div>
        <div class="callout"><strong>${t("Component precedence:", "Precedência dos componentes:")}</strong> ${t("Battle Plans, faction boards, Mythical Beast cards, and Artifact cards have their own exact effects. If their text conflicts with a summary here, follow the component.", "Planos de Batalha, tabuleiros de facção, cartas de Criatura Mítica e de Artefato têm efeitos próprios. Se o texto divergir deste resumo, siga o componente.")} ${referenceLink(8)}</div>
      </section>`;
  }

  function examplesSection() {
    const examples = [
      {
        title: t("Cost reduction can be lost", "A redução de custo pode ser perdida"),
        text: t("A card normally costs 2 cards but offers a 1-card discount if only Warriors are deployed. The player pays 1, then changes course to deploy a Lord: they must pay one more card. If unable, the card does nothing and they take a standard action.", "Uma carta custa normalmente 2 cartas, mas reduz 1 se somente Guerreiros forem desdobrados. O jogador paga 1 e muda o plano para desdobrar um Lorde: deve pagar mais 1 carta. Se não puder, a carta não resolve e ele faz uma ação padrão."),
        page: 10
      },
      {
        title: t("Three-way initiative tie", "Empate de iniciativa entre três"),
        text: t("Jon, Hazel, and Luke tie. The Grail bearer Jon chooses first place. Hazel has the fewest VPs and chooses third; Luke must take the remaining second place. No two tie-breakers choose the same position.", "Jon, Hazel e Luke empatam. Jon, que carrega o Graal, escolhe primeiro lugar. Hazel tem menos VPs e escolhe terceiro; Luke fica com o segundo. Dois desempates não podem escolher a mesma posição."),
        page: 10
      },
      {
        title: t("Explore, resolve, continue", "Explore, resolva, continue"),
        text: t("When the Lord enters an unexplored region, pause the current action, flip the tile if needed, take one printed exploration reward, then reveal the Mist Card. If it is a Mythical Beast, resolve the bid immediately before resuming the interrupted action.", "Quando o Lorde entra numa região inexplorada, pause a ação, vire a peça se necessário, receba uma recompensa impressa e revele a carta de Névoa. Se for uma Criatura Mítica, resolva a disputa imediatamente antes de retomar a ação interrompida."),
        page: 14
      },
      {
        title: t("Battle Plan limit", "Limite do Plano de Batalha"),
        text: t("A Plan with limit 3 and two Bonus Cards has a limit of 5. The player may draw up to five Combat Cards; their initiative values add strength, but a total above 5 causes the Plan to fail.", "Um Plano com limite 3 e duas Cartas Bônus passa a ter limite 5. O jogador pode comprar até cinco Cartas de Combate; os valores de iniciativa somam força, mas um total acima de 5 faz o Plano falhar."),
        page: 20
      },
      {
        title: t("Resolve Sally Forth from left to right", "Resolva Sally Forth da esquerda para a direita"),
        text: t("Hazel deploys her Lord and 2 Warriors together to a region with her Settlement, gains the printed Faction Power and 2 VPs, then uses a group move and leaves one Unit behind. She discards the played card and its two cost cards, then draws 1 Settle and 1 Deploy card.", "Hazel desdobra seu Lorde e 2 Guerreiros juntos numa região com seu Assentamento, recebe o Poder de Facção impresso e 2 VPs, depois faz um movimento em grupo e deixa uma Unidade para trás. Ela descarta a carta jogada e as duas cartas de custo, então compra 1 carta de Assentamento e 1 de Desdobramento."),
        page: 11
      },
      {
        title: t("Compare a region's strength", "Compare a força numa região"),
        text: t("The manual's example totals the Druid side at 3 strength, the Undead side at 3, and the Knights at 4. The Knight total includes its Champion, a +1 Artifact, and a Mythical Beast worth 2; it has the highest strength.", "No exemplo do manual, os Druidas somam força 3, os Mortos-Vivos 3 e os Cavaleiros 4. O total dos Cavaleiros inclui o Campeão, um Artefato +1 e uma Criatura Mítica de força 2; é a maior força."),
        page: 19
      },
      {
        title: t("Single strength check", "Requisito de força"),
        text: t("A condition asking for one strength in a region means at least 1, not exactly 1. A player with 3 strength still satisfies it; Units in an unexplored region do not count for Prophecies.", "Uma condição que pede uma força numa região significa pelo menos 1, não exatamente 1. Um jogador com 3 ainda cumpre; Unidades em região inexplorada não contam para Profecias."),
        page: 26
      },
      {
        title: t("Region scoring tie", "Empate na pontuação da região"),
        text: t("A tie for first place awards the full first-place VP reward to every tied player; all other players receive no VP for that region. A tied second place only scores when first place is not tied.", "Empate em primeiro concede a recompensa total de VP a cada empatado; os demais não recebem VP daquela região. Empate em segundo só pontua quando o primeiro não está empatado."),
        page: 22
      }
    ];
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), "07", 10)}
      <div class="example-grid">${examples.map((example, index) => `
        <article class="example-card">
          <span class="card-number">${String(index + 1).padStart(2, "0")}</span>
          <h3>${example.title}</h3>
          <p>${example.text}</p>
          <div class="example-source"><span>${t("Paraphrased from the manual", "Paráfrase do manual")}</span>${referenceLink(example.page)}</div>
        </article>`).join("")}</div>`;
  }

  function glossarySection() {
    const terms = [
      [t("Season / Phase / Round", "Estação / Fase / Rodada"), t("A game has 2 or 3 seasons. Every season has Mist, Preparation, and War phases; Preparation has 3 rounds.", "A partida tem 2 ou 3 estações. Cada uma tem Névoa, Preparação e Guerra; a Preparação tem 3 rodadas.")],
      [t("Unit / Hero", "Unidade / Herói"), t("A Unit is a Warrior, Champion, Lord, or Mythical Beast. A Hero is specifically a Lord or Champion. Settlements are not Units.", "Unidade é Guerreiro, Campeão, Lorde ou Criatura Mítica. Herói é especificamente Lorde ou Campeão. Assentamentos não são Unidades.")],
      [t("Explored / unexplored", "Explorada / inexplorada"), t("A face-down Mist Card makes a region unexplored even if its Region Tile is face up. Units there have no strength and cannot move out; only a Lord can explore.", "Carta de Névoa virada para baixo torna a região inexplorada mesmo que a peça esteja aberta. Unidades ali não têm força e não podem sair; só um Lorde explora.")],
      [t("Coastal / Inner / Center", "Costeira / Interna / Central"), t("Avalon has 4 Coastal regions, 4 Inner regions, and 1 Center region. Coastal regions are on the outer ring; Center is the island's middle.", "Avalon tem 4 regiões Costeiras, 4 Internas e 1 Central. Costeiras ficam no anel externo; a Central fica no meio da ilha.")],
      [t("Settlement", "Assentamento"), t("A structure that provides strength and bonuses, reveals a forward deployment point, and persists between seasons. Each faction may have only 1 Settlement in a region.", "Estrutura que concede força e bônus, revela um ponto avançado de desdobramento e permanece entre estações. Cada facção só pode ter 1 Assentamento por região.")],
      [t("Faction Power / Favor", "Poder de Facção / Favor"), t("Faction Power is tracked on the Faction board and spent to activate some abilities. Favor advances on the shared track and grants printed space rewards.", "Poder de Facção é marcado no tabuleiro de Facção e gasto em algumas habilidades. Favor avança na trilha comum e concede recompensas impressas nas casas.")],
      [t("Battle Plan / Bonus / Combat Card", "Plano / Bônus / Carta de Combate"), t("A Battle Plan sets the limit and has an effect; each Bonus Card raises its limit by 1; Combat Cards are drawn from Main Decks in Standard battles to add initiative-value strength.", "Um Plano de Batalha define o limite e tem um efeito; cada Bônus aumenta o limite em 1; Cartas de Combate são compradas dos baralhos principais em batalhas Padrão para somar força pelo valor de iniciativa.")],
      [t("First / most / least", "Primeiro / mais / menos"), t("A tie for first or for most/least counts all tied players as qualifying. “Most/highest” requires a positive amount; “least/lowest” can include zero.", "Empate em primeiro ou em mais/menos conta todos os empatados como elegíveis. “Mais/maior” exige quantidade positiva; “menos/menor” pode incluir zero.")],
      [t("The Sea / Quadrant", "O Mar / Quadrante"), t("The Sea surrounds the Coastal ring and is adjacent to all Coastal regions, but is not a region. A Quadrant is a set of 3 regions; use the board's N/E/S/W orientation.", "O Mar circunda o anel Costeiro e é adjacente a todas as regiões Costeiras, mas não é uma região. Um Quadrante é um conjunto de 3 regiões; use a orientação N/L/S/O do tabuleiro.")],
      [t("Strength token", "Ficha de Força"), t("A permanent token attached to a Unit or Settlement that adds +1 strength. The supply is unlimited.", "Ficha permanente anexada a uma Unidade ou Assentamento que soma +1 de força. O suprimento é ilimitado.")],
      [t("Card cost reduction", "Redução de custo em cartas"), t("Each reduction icon lowers the number of cards paid by 1, never below 0, if its printed condition is met. Multiple discounts stack when each condition is met.", "Cada ícone de redução diminui em 1 a quantidade de cartas pagas, nunca abaixo de 0, se sua condição impressa for cumprida. Reduções se acumulam se todas as condições forem satisfeitas.")],
      [t("Card precedence", "Precedência das cartas"), t("The manual states that cards and faction boards override conflicting rulebook wording. Individual effects printed only on those components are not reproduced here.", "O manual determina que cartas e tabuleiros de facção prevalecem sobre texto conflitante do livro. Efeitos individuais impressos somente nesses componentes não são reproduzidos aqui.")],
      [t("Hidden information", "Informação oculta"), t("Region Tiles, Mist Cards, hands, selected costs, artifact selections, bids, and Battle Plans stay hidden until the relevant phase instructs players to reveal them. The guide does not store or share them.", "Peças de Região, cartas de Névoa, mãos, custos escolhidos, seleção de Artefato, ofertas e Planos de Batalha ficam ocultos até a fase correspondente mandar revelá-los. O guia não os armazena nem compartilha.")],
      [t("Starting artifact slots", "Espaços de Artefato iniciais"), t("A Champion has 1 Artifact slot and a Lord has 2. An Artifact must be equipped to affect play; an unequipped Artifact's ability/passive is inactive.", "Um Campeão tem 1 espaço de Artefato e um Lorde tem 2. O Artefato precisa estar equipado para afetar a partida; habilidade/passivo de Artefato não equipado fica inativo.")],
      [t("Icon sources", "Fontes dos ícones"), t("Region and terrain symbols are on page 24; strength, card types, movement, deployment, settlement, Favor, and other terms are on pages 24–25.", "Símbolos de região e terreno estão na página 24; força, tipos de carta, movimento, desdobramento, assentamento, Favor e outros termos estão nas páginas 24–25.")],
    ];
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), "08", 24)}
      <dl class="avalon-glossary">${terms.map(([term, definition]) => `<div><dt>${term}</dt><dd>${definition}</dd></div>`).join("")}</dl>
      <p class="source-note">${referenceLink(24)} ${referenceLink(25)} ${referenceLink(26)} ${referenceLink(27)}</p>`;
  }

  function renderInto(host) {
    root = host;
    document.body.classList.remove("theme-nem");
    document.body.classList.add("theme-avalon");
    document.documentElement.lang = state.language;
    document.title = t("Avalon: The Riven Veil — Field Manual", "Avalon: The Riven Veil — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "A bilingual interactive rulebook for Avalon: The Riven Veil, with match modes, setup, turns, battles, scoring, and source references.",
        "Livro de regras interativo e bilíngue de Avalon: The Riven Veil, com modos, preparação, turnos, batalhas, pontuação e referências."
      );
    }
    root.innerHTML = `
      <header class="site-header">
        <a class="brand" href="#/" aria-label="${t("Field Manual home", "Página inicial do Manual de Campo")}">
          <span class="brand-mark" aria-hidden="true">AV</span>
          <span class="brand-copy"><strong>Field Manual</strong><small>${t("Board-game rulebooks", "Livros de regras")}</small></span>
        </a>
        <div class="header-right">
          <nav class="primary-nav" aria-label="${t("Main navigation", "Navegação principal")}">
            <a href="#/">${t("Game index", "Índice de jogos")}</a>
          </nav>
          <div class="language-switch" role="group" aria-label="${t("Language", "Idioma")}">
            <button type="button" data-language="en-US" aria-pressed="${state.language === "en-US"}">EN-US</button>
            <button type="button" data-language="pt-BR" aria-pressed="${state.language === "pt-BR"}">PT-BR</button>
          </div>
        </div>
      </header>
      ${storageNotice ? `<p class="storage-notice" role="status">${storageNoticeText()}</p>` : ""}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("THE RIVEN VEIL · RETAIL EDITION", "O VÉU RASGADO · EDIÇÃO RETAIL")}</p>
          <h1>Avalon:<br>${t("The Riven Veil", "The Riven Veil")}</h1>
          <p class="hero-intro">${t("Explore a shifting island, bond mythical beasts, gather Favor, and prepare your faction for war. This guide covers the 2–4 player core retail rulebook.", "Explore uma ilha mutável, vincule criaturas míticas, ganhe Favor e prepare sua facção para a guerra. Este guia cobre o manual Retail base para 2–4 jogadores.")}</p>
          <div class="hero-meta"><span>${t("2–4 players", "2–4 jogadores")}</span><span>${t("2–3 seasons", "2–3 estações")}</span><span>${t("Four factions", "Quatro facções")}</span></div>
        </div>
        <figure class="hero-map avalon-cover">
          <img src="assets/covers/avalon-the-riven-veil.webp" alt="${t("Cover of the Avalon: The Riven Veil Retail Edition rulebook", "Capa do manual Retail de Avalon: The Riven Veil")}">
          <figcaption>${t("Core retail rulebook · manual p. 1", "Manual Retail base · manual p. 1")}</figcaption>
        </figure>
      </div></section>
      <main class="page-wrap content-column avalon-page">
        ${renderConfiguration()}
        <section class="rule-section">${iconographySection()}</section>
        <section class="rule-section">${quickReference()}</section>
        <section class="rule-section">${setupSection()}</section>
        <section class="rule-section">${victorySection()}</section>
        <section class="rule-section">${turnsSection()}</section>
        <section class="rule-section">${appendixSection()}</section>
        <section class="rule-section">${examplesSection()}</section>
        <section class="rule-section">${glossarySection()}</section>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "This guide paraphrases Avalon: The Riven Veil Retail Edition. The authorized source PDF is manuals/avalon_core.pdf; page links use that same relative path locally and on GitHub Pages. Card and faction-board text overrides summaries where it differs.",
        "Este guia parafraseia Avalon: The Riven Veil Retail Edition. O PDF-fonte autorizado está em manuals/avalon_core.pdf; os links de página usam o mesmo caminho relativo localmente e no GitHub Pages. O texto de cartas e tabuleiros de facção prevalece sobre os resumos quando divergir."
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
      const allItems = setupPhases().flatMap((phase) => phase.items);
      const requiredItems = allItems;
      const done = requiredItems.filter((item) => state.setupChecks.includes(item.id)).length;
      const progress = root.querySelector("#setup-progress");
      const label = root.querySelector("#setup-progress-label");
      if (progress) {
        progress.value = done;
      }
      if (label) {
        label.textContent = t(`${done} of ${requiredItems.length} setup groups checked`, `${done} de ${requiredItems.length} grupos de preparação concluídos`);
      }
      return;
    }
    if (target instanceof HTMLInputElement && target.type === "radio" && target.checked && target.matches("[data-player-count]")) {
      commit(() => {
        const count = Number(target.value);
        state.playerCount = [2, 3, 4].includes(count) ? count : 4;
      });
      return;
    }
    if (target instanceof HTMLInputElement && target.type === "radio" && target.checked && target.matches("[data-mode]")) {
      const mode = target.dataset.mode;
      const value = target.value;
      commit(() => {
        if (mode === "gameLength" && modes.length.includes(value)) {
          state.gameLength = value;
        } else if (mode === "battleMode" && modes.battle.includes(value)) {
          state.battleMode = value;
        } else if (mode === "factionMode" && modes.factions.includes(value)) {
          state.factionMode = value;
        } else if (mode === "recoveryMode" && Object.prototype.hasOwnProperty.call(recoveryModes, value)) {
          state.recoveryMode = value;
        } else if (mode === "turnOrderMarkers") {
          state.turnOrderMarkers = value === "true";
        } else if (mode === "simultaneousCombatDraw") {
          state.simultaneousCombatDraw = value === "true";
        }
      });
    }
  }

  window.AvalonTheRivenVeil = { renderInto, onClick, onChange };
})();
