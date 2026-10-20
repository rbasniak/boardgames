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
    factions: ["symmetric", "asymmetric"],
    favor: ["A", "B"]
  };

  let storageNotice = "";
  let root = null;

  function defaultState() {
    return {
      language: "pt-BR",
      playerCount: 4,
      factions: factions.map((item) => item.id),
      gameLength: "normal",
      battleMode: "standard",
      factionMode: "symmetric",
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
    if (Array.isArray(saved.factions)) {
      const chosen = [];
      for (const id of saved.factions) {
        if (factions.some((faction) => faction.id === id) && !chosen.includes(id) && chosen.length < next.playerCount) {
          chosen.push(id);
        }
      }
      for (const faction of factions) {
        if (chosen.length >= next.playerCount) {
          break;
        }
        if (!chosen.includes(faction.id)) {
          chosen.push(faction.id);
        }
      }
      next.factions = chosen;
    } else {
      next.factions = factions.slice(0, next.playerCount).map((item) => item.id);
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
    if (modes.favor.includes(saved.favorSide)) {
      next.favorSide = saved.favorSide;
    }
    next.greenKnight = saved.greenKnight !== false;
    next.turnOrderMarkers = saved.turnOrderMarkers === true;
    next.simultaneousCombatDraw = next.battleMode === "standard" && saved.simultaneousCombatDraw === true;
    next.setupChecks = Array.isArray(saved.setupChecks)
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

  function factionName(id) {
    const faction = factions.find((item) => item.id === id);
    return faction ? t(faction.en, faction.pt) : "";
  }

  function configurationKey() {
    return JSON.stringify({
      playerCount: state.playerCount,
      factions: state.factions,
      gameLength: state.gameLength,
      battleMode: state.battleMode,
      factionMode: state.factionMode,
      favorSide: state.favorSide,
      greenKnight: state.greenKnight,
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

  function jump(id, label) {
    return `<button type="button" data-scroll="${id}">${label}</button>`;
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

  function option(value, selected, label) {
    return `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`;
  }

  function renderFactionSelects() {
    return state.factions.map((selectedId, index) => {
      const takenByOthers = new Set(state.factions.filter((_, otherIndex) => otherIndex !== index));
      const options = factions.map((item) => {
        const disabled = takenByOthers.has(item.id) ? "disabled" : "";
        return `<option value="${item.id}" ${selectedId === item.id ? "selected" : ""} ${disabled}>${t(item.en, item.pt)}</option>`;
      }).join("");
      return `
        <label class="avalon-field">
          <span>${t(`Player ${index + 1} faction`, `Facção do jogador ${index + 1}`)}</span>
          <select data-faction-index="${index}" aria-label="${t(`Faction for player ${index + 1}`, `Facção do jogador ${index + 1}`)}">${options}</select>
        </label>`;
    }).join("");
  }

  function renderConfiguration() {
    const complete = state.factions.length === state.playerCount
      && new Set(state.factions).size === state.playerCount;
    return `
      <section class="controls-panel avalon-config" aria-labelledby="configure-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="configure-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t("Choose the player count, factions, and all four rule modes first. Changes here clear only the setup checklist.", "Defina primeiro o número de jogadores, as facções e os quatro modos. Alterações aqui limpam apenas a checklist de preparação.")}</p>
          </div>
          <span class="saved-label">${t("Saved per game", "Salvo por jogo")}</span>
        </div>
        <div class="avalon-config-grid">
          <label class="avalon-field">
            <span>${t("Players", "Jogadores")}</span>
            <select data-player-count aria-label="${t("Number of players", "Número de jogadores")}">
              ${[2, 3, 4].map((count) => option(String(count), String(state.playerCount), `${count} ${t("players", "jogadores")}`)).join("")}
            </select>
            <small>${t("Avalon supports 2–4 players. The player count determines Deep Mist spaces and the number of Mist Cards placed each season.", "Avalon aceita 2–4 jogadores. A quantidade determina os espaços de Névoa Profunda e o número de cartas de Névoa por estação.")} ${referenceLink(4)} ${referenceLink(7)} ${referenceLink(9)}</small>
          </label>
          <label class="avalon-field">
            <span>${t("Game length", "Duração")}</span>
            <select data-mode="gameLength" aria-label="${t("Game length", "Duração")}">
              ${option("normal", state.gameLength, t("Normal — 2 seasons", "Normal — 2 estações"))}
              ${option("long", state.gameLength, t("Long — 3 seasons", "Longa — 3 estações"))}
            </select>
            <small>${t("Normal ends after season 2. Long adds season 3 (about 20 extra minutes per player).", "Normal termina após a estação 2. Longa inclui a estação 3 (cerca de 20 minutos extras por jogador).")} ${referenceLink(5)}</small>
          </label>
          <label class="avalon-field">
            <span>${t("Battles", "Batalhas")}</span>
            <select data-mode="battleMode" aria-label="${t("Battle mode", "Modo de batalha")}">
              ${option("standard", state.battleMode, t("Standard — push your luck", "Padrão — arrisque e pare"))}
              ${option("deterministic", state.battleMode, t("Deterministic — no Combat Card draws", "Determinístico — sem comprar cartas de Combate"))}
            </select>
            <small>${t("Standard draws Combat Cards up to the Battle Plan limit and may fail. Deterministic battles grant the full limit without drawing; all other battle rules still apply.", "No padrão, compre Cartas de Combate até o limite do Plano de Batalha, com risco de falha. No determinístico, receba o limite completo sem compras; as demais regras de batalha continuam valendo.")} ${referenceLink(5)} ${referenceLink(20)} ${referenceLink(21)}</small>
          </label>
          <label class="avalon-field">
            <span>${t("Faction boards", "Tabuleiros de facção")}</span>
            <select data-mode="factionMode" aria-label="${t("Faction mode", "Modo de facção")}">
              ${option("symmetric", state.factionMode, t("Symmetric — simple sides A", "Simétrico — lados simples A"))}
              ${option("asymmetric", state.factionMode, t("Asymmetric — faction side B", "Assimétrico — lado B da facção"))}
            </select>
            <small>${state.factionMode === "symmetric"
              ? t("Everyone uses side A of both boards; faction objectives are not used.", "Todos usam o lado A dos dois tabuleiros; objetivos de facção não são usados.")
              : t("Start with side A of each Lord board and side B of each Faction board. Completing a faction objective upgrades that Lord board to side B.", "Comece com o lado A de cada tabuleiro de Lorde e o lado B de cada tabuleiro de Facção. Cumprir o objetivo de facção vira o tabuleiro de Lorde para o lado B.")} ${referenceLink(5)} ${referenceLink(17)}</small>
          </label>
          <label class="avalon-field">
            <span>${t("Favor Track side", "Lado da Trilha de Favor")}</span>
            <select data-mode="favorSide" aria-label="${t("Favor Track side", "Lado da Trilha de Favor")}">
              ${option("A", state.favorSide, t("Side A — catch-up VP stars", "Lado A — estrelas de recuperação"))}
              ${option("B", state.favorSide, t("Side B — little or no catch-up", "Lado B — pouca ou nenhuma recuperação"))}
            </select>
            <small>${t("The printed no-catch-up mode recommends side B; the manual allows this and the Green Knight option to be adjusted independently.", "O modo impresso sem recuperação recomenda o lado B; o manual permite ajustar esta trilha e a opção do Cavaleiro Verde separadamente.")} ${referenceLink(5)} ${referenceLink(16)}</small>
          </label>
          <label class="avalon-field">
            <span>${t("Green Knight catch-up", "Recuperação do Cavaleiro Verde")}</span>
            <select data-mode="greenKnight" aria-label="${t("Green Knight rule", "Regra do Cavaleiro Verde")}">
              ${option("true", String(state.greenKnight), t("Allow the eligible last-place player to use it", "Permitir o uso pelo último colocado elegível"))}
              ${option("false", String(state.greenKnight), t("Do not use the Green Knight", "Não usar o Cavaleiro Verde"))}
            </select>
            <small>${t("If enabled, it is available only when the printed VP-gap condition is met at the start of the War Phase; tied last place gets none.", "Se habilitado, só fica disponível quando a diferença de VPs indicada no manual é atingida no início da Fase de Guerra; empate no último lugar não recebe o Cavaleiro.")} ${referenceLink(5)} ${referenceLink(18)}</small>
          </label>
        </div>
        <fieldset class="avalon-faction-picker">
          <legend>${t("Assign one available faction to each player", "Atribua uma facção disponível a cada jogador")}</legend>
          <p>${t("Each player takes the matching faction and Lord boards and its unique pieces. A faction board cannot be assigned twice.", "Cada jogador recebe os tabuleiros de facção e de Lorde correspondentes e as peças daquela facção. Um tabuleiro de facção não pode ser atribuído duas vezes.")} ${referenceLink(4)} ${referenceLink(6)}</p>
          <div class="avalon-faction-grid">${renderFactionSelects()}</div>
        </fieldset>
        <fieldset class="avalon-table-options">
          <legend>${t("Optional table rules", "Regras opcionais de mesa")}</legend>
          <label class="avalon-option">
            <input type="checkbox" data-mode="turnOrderMarkers" ${state.turnOrderMarkers ? "checked" : ""}>
            <span><strong>${t("Use Faction Cubes to mark initiative order", "Use Cubos de Facção para marcar a ordem de iniciativa")}</strong><small>${t("At the start of each Preparation round, place faction Cubes on the Favor board's Strength Track to show turn order; remove them at round end. This is a visual aid only.", "No início de cada rodada de Preparação, coloque Cubos de Facção na Trilha de Força do tabuleiro de Favor para mostrar a ordem; retire-os ao fim da rodada. É apenas um auxílio visual.")} ${referenceLink(10)}</small></span>
          </label>
          ${state.battleMode === "standard" ? `
            <label class="avalon-option">
              <input type="checkbox" data-mode="simultaneousCombatDraw" ${state.simultaneousCombatDraw ? "checked" : ""}>
              <span><strong>${t("Draw Combat Cards simultaneously", "Compre Cartas de Combate simultaneamente")}</strong><small>${t("Available only in Standard battles. If every player agrees, draw at the same time instead of in starting-strength order; players must not wait to see how many cards others draw.", "Disponível somente em batalhas Padrão. Se todos concordarem, comprem ao mesmo tempo em vez de seguir a ordem de força inicial; ninguém deve esperar para ver quantas cartas os outros compram.")} ${referenceLink(21)}</small></span>
            </label>` : `<p class="avalon-option-note">${t("Simultaneous Combat Card draws are unavailable because Deterministic battles do not draw Combat Cards.", "A compra simultânea de Cartas de Combate não está disponível porque batalhas Determinísticas não compram Cartas de Combate.")} ${referenceLink(5)} ${referenceLink(21)}</p>`}
        </fieldset>
        <p class="avalon-config-status" role="status">${complete
          ? t("Configuration complete — the setup below matches these choices.", "Configuração completa — a preparação abaixo corresponde a estas escolhas.")
          : t("Assign one distinct faction to every player before using the setup checklist.", "Atribua uma facção diferente a cada jogador antes de usar a checklist.")}</p>
      </section>`;
  }

  function iconographySection() {
    return `
      ${sectionHeading("iconography", t("Iconography", "Iconografia"), "01", 24)}
      <p class="glossary-intro">${t(
        "These are original symbols cropped from the manual. Terrain and region markers are shown in source order; card symbols identify the strength, initiative, and main card types. Card text and board text always take precedence over this summary.",
        "Estes símbolos originais foram recortados do manual. Os marcadores de terreno e região aparecem na ordem da fonte; os símbolos de carta identificam força, iniciativa e os principais tipos de carta. O texto das cartas e dos tabuleiros sempre prevalece sobre este resumo."
      )}</p>
      <div class="avalon-iconography-grid">
        <figure class="avalon-symbol-figure">
          <img src="assets/avalon/region-icons.webp" alt="${t("Manual page 24 symbols in order: unexplored region, explored region, forest, mountain, river, coastal region, inner region.", "Símbolos da página 24 do manual, na ordem: região inexplorada, região explorada, floresta, montanha, rio, região costeira e região interna.")}">
          <figcaption><strong>${t("Regions and terrain · p. 24", "Regiões e terrenos · p. 24")}</strong><span>${t("Question mark / eye = unexplored / explored; then forest, mountain, river, coastal ring, inner ring.", "Interrogação / olho = inexplorada / explorada; depois floresta, montanha, rio, anel costeiro e anel interno.")}</span></figcaption>
        </figure>
        <figure class="avalon-symbol-figure">
          <img src="assets/avalon/card-action-icons.webp" alt="${t("Manual page 25 symbols in order: strength, initiative-one card, Move card, Deploy card, Settle card, Battle Plan card.", "Símbolos da página 25 do manual, na ordem: força, carta de iniciativa 1, carta de Movimento, carta de Desdobramento, carta de Assentamento e Plano de Batalha.")}">
          <figcaption><strong>${t("Strength and card types · p. 25", "Força e tipos de carta · p. 25")}</strong><span>${t("Top to bottom: strength, initiative, Move, Deploy, Settle, Battle Plan. Initiative values 2 and 3 use the same card symbol.", "De cima para baixo: força, iniciativa, Movimento, Desdobramento, Assentamento e Plano de Batalha. Iniciativas 2 e 3 usam o mesmo símbolo de carta.")}</span></figcaption>
        </figure>
        <figure class="avalon-symbol-figure">
          <img src="assets/avalon/movement-icons.webp" alt="${t("Manual page 25 movement symbols in order: move one Unit, move an army, move in, move in here, and move out.", "Símbolos de movimento da página 25, na ordem: mover uma Unidade, mover um exército, mover para dentro, mover para cá e mover para fora.")}">
          <figcaption><strong>${t("Movement actions · p. 25", "Ações de movimento · p. 25")}</strong><span>${t("The five icons distinguish a single Unit, an army, moving in from adjacent regions, moving into the explored region, and moving out to several adjacent regions.", "Os cinco ícones distinguem uma Unidade, um exército, entrar a partir de regiões adjacentes, mover para a região explorada e sair para várias regiões adjacentes.")}</span></figcaption>
        </figure>
        <figure class="avalon-symbol-figure">
          <img src="assets/avalon/deployment-reward-icons.webp" alt="${t("Manual page 25 symbols for deployment, two Warriors here, Champion here, Settlement, Settle, and Favor.", "Símbolos da página 25 para desdobrar, dois Guerreiros aqui, Campeão aqui, Assentamento, Assentar e Favor.")}">
          <figcaption><strong>${t("Deployment and rewards · p. 25", "Desdobramento e recompensas · p. 25")}</strong><span>${t("These icons place Units or a Settlement in the specified region or advance the Favor marker; read the printed quantity and conditions.", "Esses ícones colocam Unidades ou Assentamentos na região indicada ou avançam o marcador de Favor; leia a quantidade e as condições impressas.")}</span></figcaption>
        </figure>
      </div>
      <div class="content-grid">
        <article class="info-card"><h3>${t("Explored and unexplored", "Explorada e inexplorada")}</h3><p>${t("A face-down Mist Card marks an unexplored region. It has no terrain type or battle; its Units add no strength and cannot move out. Only a Lord explores it.", "Uma carta de Névoa virada para baixo marca uma região inexplorada. Ela não tem terreno nem batalha; suas Unidades não somam força nem podem sair. Só um Lorde explora.")} ${referenceLink(13)} ${referenceLink(24)}</p></article>
        <article class="info-card"><h3>${t("Strength and card types", "Força e tipos de carta")}</h3><p>${t("Strength symbols count one each. Main Deck cards are identified by type: Move, Deploy, Settle, or Battle Plan. Initiative is the 1–3 value on a card, not a separate deck.", "Cada símbolo de força conta 1. As cartas principais são identificadas pelo tipo: Movimento, Desdobramento, Assentamento ou Plano de Batalha. Iniciativa é o valor de 1–3 na carta, não um baralho separado.")} ${referenceLink(12)} ${referenceLink(25)}</p></article>
      </div>
      ${referenceLink(25)}`;
  }

  function quickReference() {
    const seasons = state.gameLength === "normal" ? 2 : 3;
    const battleSetting = state.battleMode === "standard"
      ? t("Use Battle Plans, then draw Combat Cards up to the limit; exceeding it causes failure.", "Use Planos de Batalha e compre Cartas de Combate até o limite; ultrapassá-lo causa falha.")
      : t("Do not draw Combat Cards: each Battle Plan receives its full strength limit, including +1 per Bonus Card.", "Não compre Cartas de Combate: cada Plano de Batalha recebe seu limite total de força, incluindo +1 por Carta Bônus.");
    return `
      ${sectionHeading("quick-reference", t("Quick reference", "Referência rápida"), "02", 8)}
      <div class="quick-grid">
        <article class="info-card">
          <span class="card-number">01</span><h3>${t("Game and victory", "Partida e vitória")}</h3>
          <p>${t(`Play ${seasons} seasons. The player with the most VPs after the final season wins. If tied, the Holy Grail bearer wins; if nobody tied bears it, all tied players win.`, `Jogue ${seasons} estações. Vence quem tiver mais VPs ao fim da última. No empate, vence quem carrega o Santo Graal; se nenhum empatado o carregar, todos os empatados vencem.`)}</p>
          <p>${jump("victory", t("Scoring details", "Detalhes da pontuação"))}</p>
        </article>
        <article class="info-card">
          <span class="card-number">02</span><h3>${t("Season order", "Ordem da estação")}</h3>
          <p>${t("Mist Phase → 3 Preparation rounds → War Phase. In each round, all players choose a card simultaneously; turns resolve from highest initiative to lowest.", "Fase de Névoa → 3 rodadas de Preparação → Fase de Guerra. Em cada rodada, todos escolhem uma carta simultaneamente; os turnos resolvem da maior para a menor iniciativa.")}</p>
          <p>${jump("turns", t("Phase and turn rules", "Regras de fase e turno"))}</p>
        </article>
        <article class="info-card">
          <span class="card-number">03</span><h3>${t("Preparation turn", "Turno de Preparação")}</h3>
          <p>${t("Resolve your card or take one standard action, then use eligible abilities. Discard the played card and its costs, draw 2 cards from any Main Decks, and enforce the 5-Unit region limit.", "Resolva sua carta ou faça uma ação padrão, depois use habilidades elegíveis. Descarte a carta e seus custos, compre 2 cartas de quaisquer baralhos principais e respeite o limite de 5 Unidades por região.")}</p>
          <p>${jump("turns", t("Actions and movement", "Ações e movimento"))}</p>
        </article>
        <article class="info-card">
          <span class="card-number">04</span><h3>${t("Battle setting", "Modo de batalha")}</h3>
          <p>${battleSetting}</p>
          <p>${jump("war", t("Battle sequence", "Sequência de batalha"))}</p>
        </article>
        <article class="info-card">
          <span class="card-number">05</span><h3>${t("Information and precedence", "Informação e precedência")}</h3>
          <p>${t("Hands are unlimited and their card counts are public; cards and Mist Cards remain face down until their rules reveal them. When the rulebook conflicts with a card or faction board, follow the component.", "A mão não tem limite e sua quantidade de cartas é pública; cartas e cartas de Névoa ficam viradas para baixo até que as regras mandem revelá-las. Se o manual divergir de uma carta ou tabuleiro de facção, siga o componente.")}</p>
          <p>${referenceLink(8)} ${referenceLink(24)}</p>
        </article>
      </div>`;
  }

  function setupPhases() {
    const mistArtifactCount = state.playerCount;
    const mistBeastCount = state.playerCount;
    const deepMistCount = state.playerCount === 2 ? 4 : state.playerCount === 3 ? 2 : 0;
    const inaccessible = 9 - deepMistCount;
    const firstPlayerTasks = state.factions.map((id, index) => {
      const name = factionName(id);
      const player = index + 1;
      return [
        {
          id: `faction-${player}-boards`,
          title: t(`Assemble Player ${player}'s faction boards`, `Monte os tabuleiros da facção do jogador ${player}`),
          text: t(`Use the ${name} Lord and Faction boards. Set their sides for ${state.factionMode === "symmetric" ? "Symmetric" : "Asymmetric"} play (Lord A / Faction A in Symmetric; Lord A / Faction B in Asymmetric).`, `Use os tabuleiros de Lorde e Facção de ${name}. Ajuste os lados para o modo ${state.factionMode === "symmetric" ? "Simétrico" : "Assimétrico"} (Lorde A / Facção A no Simétrico; Lorde A / Facção B no Assimétrico).`)
        },
        {
          id: `faction-${player}-pieces`,
          title: t(`Take Player ${player}'s faction pieces`, `Separe as peças do jogador ${player}`),
          text: t("Take that faction's 13 Cubes and 2 Discs, Lord(s), 3 Champions, Warriors, 4 Mythical Beast bases, Settlement tokens, Card Separator, and any faction-specific pieces. Keep the faction pieces in that player's supply.", "Separe 13 Cubos e 2 Discos da facção, Lorde(s), 3 Campeões, Guerreiros, 4 bases de Criatura Mítica, fichas de Assentamento, Separador de Cartas e peças específicas. Mantenha as peças da facção na reserva daquele jogador.")
        },
        {
          id: `faction-${player}-settlements`,
          title: t(`Place Player ${player}'s starting Settlements`, `Coloque os Assentamentos iniciais do jogador ${player}`),
          text: t("Place one Settlement token on every Settlement slot printed on that Faction board.", "Coloque uma ficha de Assentamento em cada espaço de Assentamento impresso naquele tabuleiro de Facção.")
        },
        {
          id: `faction-${player}-tracks`,
          title: t(`Set Player ${player}'s faction tracks`, `Ajuste as trilhas do jogador ${player}`),
          text: t("Place a Faction Disc on 0 of each Faction-board track. Place the faction's objective tracker only in Asymmetric mode; there is no faction objective in Symmetric mode.", "Coloque um Disco de Facção no 0 de cada trilha do tabuleiro de Facção. Posicione o marcador de objetivo somente no modo Assimétrico; no Simétrico não há objetivo de facção.")
        }
      ];
    });
    const factionItems = firstPlayerTasks.flat();
    if (state.factionMode === "asymmetric" && state.factions.includes("druids")) {
      factionItems.push({
        id: "druid-ley-lines",
        title: t("Place the Druid Ley Line markers", "Posicione os marcadores de Linhas Ley dos Druidas"),
        text: t("Place 8 Discs on the 8 Ley Line spaces of the asymmetric Druid Faction board; keep any other Druid Disc in that faction's supply.", "Coloque 8 Discos nos 8 espaços de Linhas Ley do tabuleiro assimétrico dos Druidas; deixe qualquer outro Disco da facção na reserva.")
      });
    }
    if (state.factionMode === "asymmetric" && state.factions.includes("knights")) {
      factionItems.push({
        id: "knight-flags",
        title: t("Place the Knights' flags in their play area", "Separe as bandeiras dos Cavaleiros"),
        text: t("Give the Knights all 4 Knight Flag tokens.", "Entregue aos Cavaleiros as 4 fichas de Bandeira de Cavaleiro.")
      });
    }
    const mistArrangement = state.playerCount === 2
      ? t("Place 4 Deep Mist tokens on the south, north-west, north-east, and north regions; those regions are ignored and cannot receive or move Units.", "Coloque 4 fichas de Névoa Profunda nas regiões sul, noroeste, nordeste e norte; elas são ignoradas e não podem receber nem mover Unidades.")
      : state.playerCount === 3
        ? t("Place 2 Deep Mist tokens on the north-east and north regions; those regions are ignored and cannot receive or move Units.", "Coloque 2 fichas de Névoa Profunda nas regiões nordeste e norte; elas são ignoradas e não podem receber nem mover Unidades.")
        : t("Do not place Deep Mist tokens; all 9 regions are in play.", "Não coloque fichas de Névoa Profunda; as 9 regiões ficam em jogo.");
    const mainDecks = [
      { id: "deploy", en: "Deploy", pt: "Desdobramento" },
      { id: "move", en: "Move", pt: "Movimento" },
      { id: "settle", en: "Settle", pt: "Assentamento" },
      { id: "battle-plan", en: "Battle Plan", pt: "Plano de Batalha" }
    ];
    const explorationDecks = [
      { id: "beasts", en: "Mythical Beast", pt: "Criatura Mítica", count: 12 },
      { id: "artifacts", en: "Artifact", pt: "Artefato", count: 24 },
      { id: "prophecies", en: "Prophecy", pt: "Profecia", count: 12 }
    ];
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
        title: t("Players and faction areas", "Jogadores e áreas das facções"),
        refs: [4, 6],
        items: factionItems
      },
      {
        title: t("Main decks and shared supplies", "Baralhos principais e reservas comuns"),
        refs: [4, 5, 6, 7],
        items: [
          { id: "sort-main-decks", title: t("Sort the Main Deck cards", "Separe as cartas dos baralhos principais"), text: t("Sort all 160 cards by their top-left type symbol/color into four named decks: 40 Deploy, 40 Move, 40 Settle, and 40 Battle Plan cards.", "Separe as 160 cartas pelo símbolo/cor do canto superior esquerdo em quatro baralhos: 40 de Desdobramento, 40 de Movimento, 40 de Assentamento e 40 de Plano de Batalha.") },
          ...mainDecks.map((deck) => ({
            id: `shuffle-${deck.id}`,
            title: t(`Shuffle the ${deck.en} deck`, `Embaralhe o baralho de ${deck.pt}`),
            text: t("Shuffle this 40-card deck separately.", "Embaralhe este baralho de 40 cartas separadamente.")
          })),
          ...mainDecks.map((deck) => ({
            id: `place-${deck.id}`,
            title: t(`Place the ${deck.en} deck and its indicator`, `Posicione o baralho de ${deck.pt} e seu indicador`),
            text: t("Place the deck face down and put its matching Deck Indicator below it.", "Coloque o baralho virado para baixo e posicione o Indicador correspondente abaixo dele.")
          })),
          ...explorationDecks.map((deck) => ({
            id: `shuffle-${deck.id}`,
            title: t(`Shuffle the ${deck.en} deck`, `Embaralhe o baralho de ${deck.pt}`),
            text: t(`Shuffle all ${deck.count} cards of this type separately.`, `Embaralhe separadamente as ${deck.count} cartas deste tipo.`)
          })),
          ...explorationDecks.map((deck) => ({
            id: `place-${deck.id}`,
            title: t(`Place the ${deck.en} deck`, `Posicione o baralho de ${deck.pt}`),
            text: t("Place this deck face down in its designated space on the Favor Track board.", "Coloque este baralho virado para baixo no espaço correspondente do tabuleiro de Favor.")
          })),
          { id: "green-knight-card", title: t("Place the Green Knight card", "Coloque a carta do Cavaleiro Verde"), text: t("Put it in its printed space on the Favor Track board.", "Coloque-a no espaço impresso do tabuleiro de Favor.") },
          { id: "excalibur-card", title: t("Place the Excalibur card", "Coloque a carta de Excalibur"), text: t("Put it in its printed space on the Favor Track board.", "Coloque-a no espaço impresso do tabuleiro de Favor.") },
          { id: "excalibur-token", title: t("Place the Excalibur token", "Coloque a ficha de Excalibur"), text: t("Set it at the end of the Favor Track.", "Posicione-a no fim da Trilha de Favor.") },
          { id: "grail-components", title: t("Set aside the Holy Grail and Green Knight pieces", "Separe as peças do Santo Graal e do Cavaleiro Verde"), text: t("Keep the Holy Grail card/token and Green Knight standee nearby.", "Deixe por perto a carta/ficha do Santo Graal e a miniatura do Cavaleiro Verde.") },
          { id: "common-supply", title: t("Set out shared battle and score tokens", "Separe fichas comuns de batalha e pontuação"), text: t("Place all Mythical Beast standees, Strength tokens, VP tokens, Season and Round trackers, and the Tide marker within reach.", "Deixe ao alcance miniaturas de Criaturas Míticas, fichas de Força e VP, marcadores de Estação e Rodada e marcador de Maré.") }
        ]
      },
      {
        title: t("Player markers and starting artifacts", "Marcadores dos jogadores e artefatos iniciais"),
        refs: [7, 22, 24],
        items: [
          ...state.factions.flatMap((id, index) => [
            {
              id: `favor-marker-${index + 1}`,
              title: t(`Place Player ${index + 1}'s Favor marker`, `Coloque o marcador de Favor do jogador ${index + 1}`),
              text: t("Use one matching Faction Cube on space 0 of the selected Favor Track.", "Use um Cubo de Facção correspondente na casa 0 da Trilha de Favor selecionada.")
            },
            {
              id: `vp-marker-${index + 1}`,
              title: t(`Place Player ${index + 1}'s VP marker`, `Coloque o marcador de VP do jogador ${index + 1}`),
              text: t("Use a Faction Cube on the VP Track at the starting VP value printed beside this faction on its Lord board.", "Use um Cubo de Facção na Trilha de VP, no valor inicial impresso ao lado desta facção no tabuleiro de Lorde.")
            }
          ]),
          { id: "season-marker", title: t("Set the Season Tracker", "Ajuste o Marcador de Estação"), text: t("Place it on season 1.", "Coloque-o na estação 1.") },
          { id: "round-marker", title: t("Set the Round Tracker", "Ajuste o Marcador de Rodada"), text: t("Place it on the season-setup space of the Game Board Frame.", "Coloque-o no espaço de preparação da estação na moldura do tabuleiro.") },
          ...state.factions.flatMap((id, index) => [
            {
              id: `starting-artifact-draw-${index + 1}`,
              title: t(`Player ${index + 1}: draw 3 starting Artifacts`, `Jogador ${index + 1}: compre 3 Artefatos iniciais`),
              text: t("Draw 3 cards from the Artifact deck.", "Compre 3 cartas do baralho de Artefatos.")
            },
            {
              id: `starting-artifact-choose-${index + 1}`,
              title: t(`Player ${index + 1}: keep 1 Artifact`, `Jogador ${index + 1}: fique com 1 Artefato`),
              text: t("Choose 1 of the 3 drawn cards to keep.", "Escolha 1 das 3 cartas compradas para ficar.")
            },
            {
              id: `starting-artifact-return-${index + 1}`,
              title: t(`Player ${index + 1}: return the other 2 Artifacts`, `Jogador ${index + 1}: devolva os outros 2 Artefatos`),
              text: t("Shuffle the 2 unchosen cards back into the Artifact deck before the next player draws.", "Embaralhe as 2 cartas não escolhidas de volta no baralho antes da compra do próximo jogador.")
            },
            {
              id: `starting-artifact-vp-${index + 1}`,
              title: t(`Player ${index + 1}: gain the Artifact's VP`, `Jogador ${index + 1}: receba os VPs do Artefato`),
              text: t("Gain the printed VPs from the chosen Artifact.", "Receba os VPs impressos no Artefato escolhido.")
            },
            {
              id: `starting-artifact-equip-${index + 1}`,
              title: t(`Player ${index + 1}: equip the Artifact`, `Jogador ${index + 1}: equipe o Artefato`),
              text: t("Put it in an available Artifact slot for a Lord or Champion; its benefits begin immediately.", "Coloque-o num espaço de Artefato disponível de um Lorde ou Campeão; seus benefícios começam imediatamente.")
            }
          ])
        ]
      },
      {
        title: t("Season 1: Mist Phase and first hands", "Estação 1: Fase de Névoa e mãos iniciais"),
        refs: [8, 9, 10],
        items: [
          { id: "mist-artifact-draw", title: t(`Draw ${mistArtifactCount} Mist Artifacts`, `Compre ${mistArtifactCount} Artefatos para a Névoa`), text: t(`Take ${mistArtifactCount} cards from the Artifact deck.`, `Retire ${mistArtifactCount} cartas do baralho de Artefatos.`) },
          { id: "mist-beast-draw", title: t(`Draw ${mistBeastCount} Mist Mythical Beasts`, `Compre ${mistBeastCount} Criaturas Míticas para a Névoa`), text: t(`Take ${mistBeastCount} cards from the Mythical Beast deck.`, `Retire ${mistBeastCount} cartas do baralho de Criaturas Míticas.`) },
          { id: "mist-deck-shuffle", title: t("Shuffle the Season 1 Mist Deck", "Embaralhe o baralho de Névoa da estação 1"), text: t(`Add the Holy Grail card, then shuffle it with the ${mistArtifactCount} Artifacts and ${mistBeastCount} Mythical Beasts to make a ${inaccessible}-card face-down Mist Deck.`, `Adicione a carta do Santo Graal e embaralhe com os ${mistArtifactCount} Artefatos e ${mistBeastCount} Criaturas Míticas para formar um baralho de Névoa de ${inaccessible} cartas, virado para baixo.`) },
          ...Array.from({ length: inaccessible }, (_, index) => ({
            id: `mist-region-${index + 1}`,
            title: t(`Place Mist Card ${index + 1}`, `Coloque a carta de Névoa ${index + 1}`),
            text: t(`Place one card face down on a different region without a Deep Mist token. Do not reveal it.`, `Coloque uma carta virada para baixo numa região diferente, sem ficha de Névoa Profunda. Não a revele.`)
          })),
          { id: "first-prophecy-draw", title: t("Draw the first Prophecy", "Compre a primeira Profecia"), text: t("Draw 1 Prophecy card from the Prophecy deck.", "Compre 1 carta do baralho de Profecias.") },
          { id: "first-prophecy-place", title: t("Place the first Prophecy face up", "Coloque a primeira Profecia aberta"), text: t("Place it beneath the Favor Track; it is active for season 1.", "Coloque-a abaixo da Trilha de Favor; ela vale durante a estação 1.") },
          ...state.factions.flatMap((id, index) => [
            ...mainDecks.map((deck) => ({
              id: `starting-hand-${index + 1}-${deck.id}`,
              title: t(`Player ${index + 1}: draw 2 ${deck.en} cards`, `Jogador ${index + 1}: compre 2 cartas de ${deck.pt}`),
              text: t("Draw 2 cards face down from this Main Deck. Keep them face down with the other starting draws.", "Compre 2 cartas viradas para baixo deste baralho principal. Mantenha-as viradas para baixo com as demais compras iniciais.")
            })),
            {
              id: `starting-hand-add-${index + 1}`,
              title: t(`Player ${index + 1}: add the starting draws to hand`, `Jogador ${index + 1}: coloque as compras na mão`),
              text: t("After drawing 2 cards from each of the 4 Main Decks, add all 8 face-down cards to the hand. Hand size is public; card identities remain hidden.", "Depois de comprar 2 cartas de cada um dos 4 baralhos principais, coloque as 8 cartas viradas para baixo na mão. A quantidade é pública; as identidades permanecem ocultas.")
            }
          ])
        ]
      }
    ];
    return phases;
  }

  function setupSection() {
    const phases = setupPhases();
    const allItems = phases.flatMap((phase) => phase.items);
    const validIds = new Set(allItems.map((item) => item.id));
    const normalizedChecks = state.setupChecks.filter((id) => validIds.has(id));
    if (normalizedChecks.length !== state.setupChecks.length) {
      state.setupChecks = normalizedChecks;
      saveState();
    }
    const checkedCount = allItems.filter((item) => state.setupChecks.includes(item.id)).length;
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
              <span><strong>${item.title}</strong><small>${item.text}</small></span>
            </label>`).join("")}
        </div>
      </section>`).join("");
    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), "03", 6)}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div><h3>${t("Build the table in order", "Prepare a mesa em ordem")}</h3><p>${t("Each checkbox is one physical operation. The first-season setup below is filtered to your player count, factions, and selected modes.", "Cada caixa representa uma operação física. A preparação da primeira estação abaixo corresponde ao número de jogadores, facções e modos selecionados.")}</p></div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${checkedCount} of ${allItems.length} setup steps checked`, `${checkedCount} de ${allItems.length} etapas concluídas`)}</span>
            <progress id="setup-progress" max="${Math.max(allItems.length, 1)}" value="${checkedCount}" aria-label="${t("Setup checklist progress", "Progresso da checklist")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t("Changing a setup-affecting choice clears this checklist. Changing language does not. “Uncheck all” clears only the checkboxes. Mist cards, region tiles, and player hands remain hidden as directed by the manual; this guide never shares private setup information.", "Alterar uma escolha que afeta a preparação limpa esta checklist. Trocar o idioma não. “Desmarcar tudo” limpa somente as caixas. Cartas de Névoa, peças de Região e mãos ficam ocultas conforme o manual; este guia nunca compartilha informações privadas da preparação.")}</p>
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
        <article class="info-card"><h3>${t("End of the game", "Fim da partida")}</h3><p>${t(`The game ends after season ${seasons}. Each player gains the VP bonuses from all revealed Settlement slots on their Faction board one final time. The player with the most VPs wins.`, `A partida termina após a estação ${seasons}. Cada jogador ganha mais uma vez os VPs dos espaços de Assentamento revelados no tabuleiro de Facção. Vence quem tiver mais VPs.`)}</p><p>${t("If tied, the Holy Grail bearer wins. If no tied player bears the Grail, every tied player wins.", "No empate, vence quem carrega o Santo Graal. Se nenhum jogador empatado o carregar, todos os empatados vencem.")} ${referenceLink(23)}</p></article>
        <article class="info-card"><h3>${t("Scoring a region", "Pontuar uma região")}</h3><p>${t("Only explored regions are scored. First place gains the full seasonal VP reward; second place gains half rounded up only when first place is not tied. A tie for first gives every tied player the full reward and no one else scores. A tie for second gives each tied player half rounded up.", "Só regiões exploradas pontuam. O primeiro lugar ganha a recompensa total da estação; o segundo ganha metade, arredondada para cima, apenas se o primeiro não estiver empatado. Empate em primeiro dá a recompensa total a todos os empatados e ninguém mais pontua. Empate em segundo dá metade arredondada para cima a cada empatado.")} ${referenceLink(22)}</p></article>
        <article class="info-card"><h3>${t("Lone faction and hand cards", "Facção sozinha e cartas na mão")}</h3><p>${t("If only one faction has strength in a region, there is no battle: it scores first place and any Artifact there. At the end of each season, discard every card left in your hand and gain 1 VP per card.", "Se apenas uma facção tiver força numa região, não há batalha: ela pontua em primeiro e recebe o Artefato presente. Ao fim de cada estação, descarte todas as cartas restantes na mão e ganhe 1 VP por carta.")} ${referenceLink(19)} ${referenceLink(23)}</p></article>
        <article class="info-card"><h3>${t("Settlement income", "Renda dos Assentamentos")}</h3><p>${t("A Settlement gives 1 strength. Its revealed Faction-board slot provides its printed VP and Warrior bonuses when placed, again at later Mist Phases, and once more at final scoring. A placement bonus printed on a region is additional.", "Um Assentamento dá 1 de força. O espaço revelado no tabuleiro de Facção concede seus bônus impressos de VP e Guerreiros ao ser colocado, novamente nas Fases de Névoa seguintes e mais uma vez na pontuação final. Um bônus impresso na região é adicional.")} ${referenceLink(9)} ${referenceLink(12)}</p></article>
      </div>`;
  }

  function turnsSection() {
    const seasons = state.gameLength === "normal" ? 2 : 3;
    const battleModeText = state.battleMode === "standard"
      ? t("In the Standard mode, draw 0 or more Combat Cards one at a time. Their initiative values add strength; stop when you choose, but never reject a drawn card. A total above the Plan limit fails the Plan.", "No modo Padrão, compre 0 ou mais Cartas de Combate, uma por vez. Seus valores de iniciativa somam força; pare quando quiser, mas não devolva cartas compradas. Total acima do limite do Plano faz o Plano falhar.")
      : t("In Deterministic mode, do not draw Combat Cards. Gain the full Battle Plan limit, including one extra limit for each Bonus Card, while resolving the Battle Plan's other effects normally.", "No modo Determinístico, não compre Cartas de Combate. Ganhe o limite total do Plano de Batalha, incluindo um ponto por Carta Bônus, e resolva os demais efeitos do Plano normalmente.");
    return `
      ${sectionHeading("turns", t("Seasons, turns, and actions", "Estações, turnos e ações"), "05", 8)}
      <div class="content-grid">
        <article class="info-card"><h3>${t("Card effects and requirements", "Efeitos e requisitos das cartas")}</h3><p>${t("A requirement means at least the stated amount, not exactly that amount. Gain its card reward as soon as the requirement is met, before checking Prophecies; each reward on a card is gained at most once. Taking a reward is optional, but take it whole or not at all. Whole-card text applies to all related icons on that card.", "Um requisito pede pelo menos a quantidade indicada, não exatamente. Receba a recompensa da carta assim que cumprir o requisito, antes de verificar Profecias; cada recompensa numa carta só é recebida uma vez. Receber uma recompensa é opcional, mas aceite-a inteira ou não aceite. Texto que afeta a carta toda vale para todos os ícones relacionados.")} ${referenceLink(12)}</p></article>
        <article class="info-card"><h3>${t("Ability timing and markers", "Momento e marcadores de habilidade")}</h3><p>${t("A normal ability is used once per season during your Preparation turn; place a Faction Cube on it when used. A Once Per Turn ability can be used once on each of the 3 Preparation turns; remove its Cube at turn end. A Reaction may be used whenever its condition is met, even outside your turn or the Preparation Phase. Passives stay active without a Cube, but a conditional passive is gained only once when its condition is met. Artifact abilities/passives require the Artifact to be equipped, but its Hero may be in supply.", "Uma habilidade normal é usada uma vez por estação no seu turno de Preparação; coloque um Cubo de Facção nela ao usar. Uma habilidade Uma Vez por Turno pode ser usada em cada um dos 3 turnos de Preparação; retire seu Cubo ao fim do turno. Uma Reação pode ser usada sempre que sua condição ocorrer, mesmo fora do seu turno ou da Fase de Preparação. Passivos permanecem ativos sem Cubo, mas um passivo condicional é recebido apenas uma vez quando sua condição ocorre. Habilidades/passivos de Artefato exigem que ele esteja equipado, mas seu Herói pode estar na reserva.")} ${referenceLink(11)} ${referenceLink(24)}</p></article>
        <article class="info-card"><h3>${t("Season sequence", "Sequência da estação")}</h3><p>${t(`Play ${seasons} seasons. Every season has: (1) Mist Phase, (2) three Preparation rounds, and (3) War Phase. Move the round tracker through the printed spaces; after War, advance to the next season.`, `Jogue ${seasons} estações. Cada uma tem: (1) Fase de Névoa, (2) três rodadas de Preparação e (3) Fase de Guerra. Avance o marcador pelas casas impressas; após a Guerra, passe à próxima estação.`)} ${referenceLink(8)}</p></article>
        <article class="info-card"><h3>${t("Optional initiative aid", "Auxílio opcional de iniciativa")}</h3><p>${state.turnOrderMarkers
          ? t("Selected: place one Faction Cube per player on the Favor board's Strength Track to display the current round's order; remove them when the round ends.", "Selecionado: coloque um Cubo de Facção por jogador na Trilha de Força do tabuleiro de Favor para mostrar a ordem da rodada; retire-os ao fim dela.")
          : t("Not selected. Players may still use the printed initiative order without placing extra markers.", "Não selecionado. Os jogadores seguem a ordem de iniciativa impressa sem colocar marcadores extras.")} ${referenceLink(10)}</p></article>
        <article class="info-card"><h3>${t("Mist Phase", "Fase de Névoa")}</h3><p>${t("From season 2 onward: return all Units to supply but leave Settlements, Strength tokens, and Ley Lines in place. Reveal remaining Mist Cards; return an unclaimed Grail card to the common supply and put other revealed cards on the bottom of their matching decks. Remove unsettled regions and refill those spaces face down. Then form the new Mist Deck; reveal 1/2/3 Prophecies in seasons 1/2/3; reset used abilities; gain Settlement bonuses; rearrange Artifacts; and draw 2 cards from each Main Deck. Skip the return/reset/bonus/rearrangement steps in season 1 as printed.", "A partir da estação 2: devolva todas as Unidades à reserva, mas deixe Assentamentos, fichas de Força e Linhas Ley no lugar. Revele cartas de Névoa restantes; devolva ao suprimento a carta do Graal não reivindicada e coloque as demais cartas reveladas no fundo dos baralhos correspondentes. Remova regiões sem Assentamento e reponha esses espaços virados para baixo. Então forme o novo baralho de Névoa; revele 1/2/3 Profecias nas estações 1/2/3; reinicie habilidades usadas; ganhe bônus de Assentamento; redistribua Artefatos; e compre 2 cartas de cada baralho principal. Na estação 1, pule as etapas de retorno/reinício/bônus/redistribuição indicadas no manual.")} ${referenceLink(9)}</p></article>
        <article class="info-card"><h3>${t("Mist Deck by player count", "Baralho de Névoa por número de jogadores")}</h3><p>${t("For 2 players, shuffle 2 Artifacts + 2 Mythical Beasts + the Holy Grail (5 cards). For 3, use 3 + 3 + the Grail (7 cards). For 4, use 4 + 4 + the Grail (9 cards). Deal one face down to each region without Deep Mist.", "Para 2 jogadores, embaralhe 2 Artefatos + 2 Criaturas Míticas + o Santo Graal (5 cartas). Para 3, use 3 + 3 + o Graal (7 cartas). Para 4, use 4 + 4 + o Graal (9 cartas). Distribua uma carta virada para baixo em cada região sem Névoa Profunda.")} ${referenceLink(9)}</p></article>
        <article class="info-card"><h3>${t("Choose and reveal a card", "Escolher e revelar uma carta")}</h3><p>${t("Simultaneously choose 1 card. If it has a card cost, put that many cards behind it, then place the Card Separator behind all cards being spent. Apply any cost reduction now; if you later break its condition and cannot pay the extra card, the played card does nothing and you take a standard action instead.", "Escolha 1 carta simultaneamente. Se tiver custo em cartas, coloque atrás dela a quantidade exigida e, depois, o Separador atrás de todas as cartas que serão gastas. Aplique reduções agora; se depois deixar de cumprir a condição e não puder pagar a carta extra, a carta não resolve e você faz uma ação padrão.")} ${referenceLink(10)}</p></article>
        <article class="info-card"><h3>${t("Initiative and ties", "Iniciativa e desempates")}</h3><p>${t("Reveal the chosen card and announce its initiative (1–3); resolve from highest to lowest. For a tie, the Holy Grail bearer may break it once per season, then the lowest VP player, then the player with the lowest starting VP printed on their Lord board. Each tie-breaker chooses an open position in the tied order.", "Revele a carta escolhida e anuncie a iniciativa (1–3); resolva da maior para a menor. No empate, quem carrega o Santo Graal pode desempatar uma vez por estação; depois, o jogador com menos VPs; por fim, o menor VP inicial impresso no tabuleiro de Lorde. Cada desempate escolhe uma posição ainda livre na ordem empatada.")} ${referenceLink(10)}</p></article>
        <article class="info-card"><h3>${t("Resolve a turn", "Resolver o turno")}</h3><p>${t("Resolve card effects from left to right, top to bottom, finishing each effect before starting another. You may use any number of eligible abilities; a normal ability is once per season in the Preparation Phase. Reactions can trigger outside your turn when their condition is met; passive effects remain active.", "Resolva os efeitos da carta da esquerda para a direita e de cima para baixo, terminando cada efeito antes do próximo. Você pode usar qualquer número de habilidades elegíveis; uma habilidade normal é usada uma vez por estação na Preparação. Reações podem ocorrer fora do seu turno quando a condição acontece; passivos permanecem ativos.")} ${referenceLink(11)}</p></article>
        <article class="info-card"><h3>${t("Standard actions", "Ações padrão")}</h3><p>${t("Instead of resolving the chosen card, return it and all cards set aside for its cost to your hand, then choose exactly one: discard 1 card to deploy 2 Units to one region; discard 3 cards to build a Settlement; discard 1 card to move any number of Units from one region to any number of adjacent regions; or draw 1 card from a Main Deck at no cost.", "Em vez de resolver a carta escolhida, devolva-a e todas as cartas separadas para o custo à sua mão e escolha exatamente uma: descarte 1 carta para desdobrar 2 Unidades numa região; descarte 3 para construir um Assentamento; descarte 1 para mover qualquer quantidade de Unidades de uma região para várias regiões adjacentes; ou compre 1 carta de um baralho principal sem custo.")} ${referenceLink(11)}</p></article>
        <article class="info-card"><h3>${t("End of turn and region cap", "Fim do turno e limite da região")}</h3><p>${t("Discard the resolved card and its paid cards face up to the correct discard pile, then draw 2 cards from any Main Decks. If a deck is empty, shuffle its discard pile to form a new deck. At turn end and throughout War, return Units to supply until you have at most 5 Units in each region; Settlements do not count. Hand size has no limit; the number of cards in each hand is public.", "Descarte a carta resolvida e as cartas pagas abertas no descarte correto; depois compre 2 cartas de quaisquer baralhos principais. Se um monte acabar, embaralhe seu descarte para formar um novo. No fim do turno e durante toda a Guerra, devolva Unidades à reserva até ter no máximo 5 por região; Assentamentos não contam. A mão não tem limite; a quantidade de cartas de cada jogador é pública.")} ${referenceLink(11)} ${referenceLink(17)} ${referenceLink(24)}</p></article>
        <article class="info-card"><h3>${t("Deploy, settle, and move", "Desdobrar, assentar e mover")}</h3><p>${t("A Deploy effect sends the stated Units from supply to one coastal region or one region where you have a Settlement; unless separated by + symbols or otherwise stated, they all go to the same region. Settle places your leftmost Settlement in an explored region where you have strength and an open slot; gain its placement and revealed-slot bonuses. Movement icons specify one Unit, an army to one adjacent region, moving out to any adjacent regions, or moving in from adjacent regions.", "Um efeito de Desdobramento envia as Unidades indicadas da reserva a uma região costeira ou a uma região onde você tenha Assentamento; salvo símbolos + ou texto diferente, todas vão à mesma região. Assentar coloca seu Assentamento mais à esquerda numa região explorada onde você tenha força e haja espaço; ganhe os bônus do local e do espaço revelado. Ícones de movimento determinam mover uma Unidade, um exército para uma região adjacente, sair para regiões adjacentes ou entrar a partir de regiões adjacentes.")} ${referenceLink(12)} ${referenceLink(13)}</p></article>
        <article class="info-card"><h3>${t("Settlement and deployment limits", "Limites de Assentamento e desdobramento")}</h3><p>${t("Every region except the Center has 2 Settlement slots. A faction may have only 1 Settlement per region; you may share a region with an enemy Settlement. Deploying is allowed into unexplored regions. A Settlement must go in an explored region where you have at least 1 strength and an open slot; gain a region's placement bonus and the revealed Settlement-slot bonuses. Each + separates distinct deploys; card wording can override the normal Coastal-or-Settlement destination.", "Toda região exceto o Centro tem 2 espaços de Assentamento. Cada facção pode ter apenas 1 Assentamento por região; pode dividir a região com um Assentamento inimigo. É permitido desdobrar em regiões inexploradas. Um Assentamento deve ir numa região explorada onde você tenha pelo menos 1 de força e haja espaço; receba o bônus de colocação da região e os bônus revelados do espaço. Cada + separa desdobramentos distintos; o texto da carta pode substituir o destino normal Costeiro ou com Assentamento.")} ${referenceLink(12)} ${referenceLink(24)} ${referenceLink(26)}</p></article>
        <article class="info-card"><h3>${t("Movement and Lords", "Movimento e Lordes")}</h3><p>${t("A Unit may move more than once in a turn if you have enough movement icons. When an effect moves multiple Units, choose all destinations first and move them simultaneously. Units cannot move out of unexplored regions. A Lord may move from supply onto a Coastal or settled region as if it were a one-Unit deployment; this counts as both a move and a deploy for other effects.", "Uma Unidade pode se mover mais de uma vez no turno se houver ícones de movimento suficientes. Quando um efeito move várias Unidades, escolha todos os destinos primeiro e mova-as simultaneamente. Unidades não podem sair de regiões inexploradas. Um Lorde pode sair da reserva e entrar numa região Costeira ou com Assentamento como se fosse um desdobramento de uma Unidade; isso conta como movimento e desdobramento para outros efeitos.")} ${referenceLink(13)}</p></article>
        <article class="info-card"><h3>${t("Explore the Mist", "Explorar a Névoa")}</h3><p>${t("Only a Lord explores. You may explore when deploying or moving a Lord into an unexplored region, or at the start of your turn if your Lord is already there. Explore at most once per turn: flip the Region Tile if needed; take one printed exploration reward; reveal the Mist Card; resolve a revealed Mythical Beast bid immediately; then resume the interrupted effect.", "Só um Lorde explora. Você pode explorar ao desdobrar ou mover um Lorde para uma região inexplorada, ou no início do seu turno se ele já estiver lá. Explore no máximo uma vez por turno: vire a peça de Região se necessário; receba uma recompensa impressa; revele a carta de Névoa; resolva imediatamente uma disputa por Criatura Mítica revelada; então retome o efeito interrompido.")} ${referenceLink(13)} ${referenceLink(14)}</p></article>
        <article class="info-card"><h3>${t("Choose one exploration reward", "Escolha uma recompensa de exploração")}</h3><p>${t("The Region Tile may offer: draw 1 Main Deck card; gain 1 Faction Power; gain 1 Favor; deploy 2 Warriors into the explored region; deploy 1 Champion there; move 1 Unit from any region to an adjacent region; or move any number of Units from adjacent regions into the explored region. Take only one reward printed on that tile.", "A peça de Região pode oferecer: comprar 1 carta de baralho principal; ganhar 1 Poder de Facção; ganhar 1 Favor; desdobrar 2 Guerreiros na região explorada; desdobrar 1 Campeão ali; mover 1 Unidade de qualquer região para uma adjacente; ou mover qualquer quantidade de Unidades das regiões adjacentes para a região explorada. Receba apenas uma recompensa impressa naquela peça.")} ${referenceLink(14)}</p></article>
        <article class="info-card"><h3>${t("Bond a Mythical Beast", "Vincular uma Criatura Mítica")}</h3><p>${t("All players simultaneously bid any number of hand cards by their initiative total; the explorer gets +1. Highest bid wins, with the usual tie-break order. The winner gains the card's VPs and the Beast, then places its standee and matching base in the reveal region. The limit is 1 Beast in season 1, 2 in season 2, and 3 in season 3; faction-specific Beasts and the Green Knight do not count. At capacity, replace a Beast or take only the new card's VPs.", "Todos oferecem simultaneamente qualquer número de cartas da mão, somando suas iniciativas; quem explorou recebe +1. A maior oferta vence, com os desempates usuais. O vencedor recebe os VPs da carta e a Criatura, colocando miniatura e base correspondente na região revelada. O limite é 1 Criatura na estação 1, 2 na estação 2 e 3 na estação 3; Criaturas específicas de facção e o Cavaleiro Verde não contam. No limite, substitua uma Criatura ou receba apenas os VPs da nova carta.")} ${referenceLink(15)}</p></article>
        <article class="info-card"><h3>${t("Resolve a Beast bid", "Resolva a oferta pela Criatura")}</h3><p>${t("Everyone places the bid cards at the front of their hand and the Card Separator behind them; a zero bid places the separator first. Reveal cards and bid totals together. The Grail bearer may break a tie once per season, then use lowest VP and lowest starting VP on the Lord board. The winner takes back the Separator and discards their revealed bid cards; other players return bid cards and Separator to hand.", "Todos colocam as cartas de oferta à frente da mão e o Separador atrás delas; uma oferta zero coloca o separador primeiro. Revelem cartas e totais ao mesmo tempo. Quem carrega o Graal pode desempatar uma vez por estação; depois use menor VP e menor VP inicial no tabuleiro de Lorde. O vencedor recupera o Separador e descarta as cartas reveladas da oferta; os demais devolvem cartas e Separador à mão.")} ${referenceLink(15)}</p></article>
        <article class="info-card"><h3>${t("Prophecies, Favor, and Excalibur", "Profecias, Favor e Excalibur")}</h3><p>${t("Prophecies resolve left to right and only in the Preparation Phase. A player who meets the requirement places a Cube and gains the printed seasonal VPs, then 3 Favor if first or 2 otherwise. Requirements mean at least the stated amount; Units in unexplored regions do not count. Favor moves one space and grants any space reward; excess Favor at the end grants 2 VPs per point. The first player to reach the end of the track alone gains Excalibur; otherwise, before War, the unique highest-Favor player gains it if it has not already been claimed that season.", "Profecias resolvem da esquerda para a direita e somente na Preparação. Quem cumpre o requisito coloca um Cubo e recebe os VPs sazonais impressos, depois 3 de Favor se for o primeiro ou 2 caso contrário. Requisitos pedem pelo menos a quantidade indicada; Unidades em regiões inexploradas não contam. Favor avança uma casa e concede qualquer recompensa nela; Favor excedente no fim da trilha concede 2 VPs por ponto. Quem alcançar sozinho o fim da trilha primeiro recebe Excalibur; caso contrário, antes da Guerra, quem tiver mais Favor sem empate a recebe se ainda não tiver sido reivindicada naquela estação.")} ${referenceLink(16)} ${referenceLink(18)}</p></article>
        <article class="info-card"><h3>${t("Prophecy timing and ties", "Momento e empate nas Profecias")}</h3><p>${t("Each Prophecy can be completed once per player, only during Preparation. If several players meet one at the same time, all count as first; award their VP/Favor rewards from lowest to highest VP. If several Prophecies are completed at once, resolve them from left to right. Ignore requirements that are impossible because of player-count restrictions; if every requirement on a Prophecy is impossible for that reason, all players complete it. Units in unexplored regions do not count toward Prophecy requirements.", "Cada Profecia só pode ser concluída uma vez por jogador, durante a Preparação. Se vários jogadores a cumprirem ao mesmo tempo, todos contam como primeiros; conceda VPs/Favor da menor para a maior pontuação. Se várias Profecias forem concluídas juntas, resolva da esquerda para a direita. Ignore requisitos impossíveis por restrição do número de jogadores; se todos os requisitos de uma Profecia forem impossíveis por esse motivo, todos os jogadores a concluem. Unidades em regiões inexploradas não contam para Profecias.")} ${referenceLink(16)} ${referenceLink(26)}</p></article>
        <article class="info-card"><h3>${t("Faction objectives", "Objetivos de facção")}</h3><p>${state.factionMode === "symmetric"
          ? t("Not used with the selected Symmetric mode.", "Não são usados no modo Simétrico selecionado.")
          : t("In Asymmetric mode, advance your faction objective track. When its final space is reached, flip your Lord board to side B and transfer any Cubes and tokens to the matching spaces; the objective track is then retired.", "No modo Assimétrico, avance a trilha de objetivo de facção. Ao alcançar a última casa, vire o tabuleiro de Lorde para o lado B e transfira Cubos e fichas aos espaços correspondentes; a trilha de objetivo deixa de ser usada.")} ${referenceLink(17)}</p></article>
      </div>
      <div class="callout">${battleModeText} ${referenceLink(5)} ${referenceLink(20)} ${referenceLink(21)}</div>`;
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
      ? state.factions.map((id) => {
        const faction = factions.find((item) => item.id === id);
        return `<article class="info-card"><h3>${factionName(id)}</h3><ul>${factionRules[id].map((rule) => `<li>${rule}</li>`).join("")}</ul></article>`;
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
      ${sectionHeading("appendix", t("Faction and creature appendix", "Apêndice de facções e criaturas"), "06", 26)}
      <h3 class="avalon-appendix-title">${t("Selected asymmetric faction clarifications", "Esclarecimentos das facções assimétricas selecionadas")}</h3>
      <div class="content-grid">${selectedFactionCards}</div>
      <h3 class="avalon-appendix-title">${t("Mythical Beast rulings", "Regras específicas de Criaturas Míticas")}</h3>
      <div class="content-grid">${beastRules.map(([name, rule]) => `<article class="info-card"><h3>${name}</h3><p>${rule}</p></article>`).join("")}</div>
      <h3 class="avalon-appendix-title">${t("Frequently asked rules", "Dúvidas frequentes de regras")}</h3>
      <div class="avalon-faq">${faq.map(([question, answer]) => `<details><summary>${question}</summary><p>${answer}</p></details>`).join("")}</div>
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
      t("Reveal Battle Plans and Bonus Cards together; resolve “when revealed” effects and state each Plan limit (+1 per Bonus Card).", "Revelem Planos e Cartas Bônus juntos; resolvam efeitos “ao revelar” e declarem cada limite (+1 por Bônus)."),
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
      ${sectionHeading("war", t("War phase and battles", "Fase de Guerra e batalhas"), "07", 18)}
      <div class="content-grid">
        <article class="info-card"><h3>${t("Hero battle sequence", "Sequência de batalha com Herói")}</h3><ol>${battleSteps.map((step) => `<li>${step}</li>`).join("")}</ol><p>${t("If no involved faction has a Hero, skip Battle Plans and proceed directly to region scoring.", "Se nenhuma facção envolvida tiver um Herói, pule Planos de Batalha e vá direto à pontuação da região.")} ${referenceLink(20)} ${referenceLink(21)} ${referenceLink(22)} ${referenceLink(23)}</p></article>
        <article class="info-card"><h3>${t("Resolve regions in order", "Resolva as regiões na ordem")}</h3><p>${t("Score explored regions with strength, beginning at the north-east Coastal region, clockwise around the Coastal ring, then the northern Inner region clockwise around the Inner ring, and finally the Center. Units in unexplored regions provide no strength and are not scored.", "Pontue regiões exploradas com força, começando pela região Costeira nordeste e seguindo no sentido horário; depois comece pela região Interna norte e siga no sentido horário; por fim, pontue o Centro. Unidades em regiões inexploradas não dão força nem pontuam.")} ${referenceLink(18)} ${referenceLink(19)}</p></article>
        <article class="info-card"><h3>${t("Calculate strength", "Calcule a força")}</h3><p>${t("Each basic Unit and Settlement is 1 strength. Lords and Champions use the value printed on their component; Artifacts add their stated strength only while equipped; Strength tokens add 1 each. Mythical Beast strength comes from its card ability/passive. A Unit with two designations does not receive two base-strength bonuses.", "Cada Unidade básica e Assentamento vale 1 de força. Lordes e Campeões usam o valor impresso no componente; Artefatos só somam a força indicada quando equipados; cada ficha de Força soma 1. A força de Criaturas Míticas vem da habilidade/passivo da carta. Uma Unidade com duas designações não recebe dois bônus de força base.")} ${referenceLink(19)}</p></article>
        <article class="info-card"><h3>${t("Non-Hero battle", "Batalha sem Herói")}</h3><p>${t("If no involved faction has a Lord or Champion in the region, total each faction's strength and proceed directly to scoring. No Battle Plans are played.", "Se nenhuma facção envolvida tiver Lorde ou Campeão na região, some a força de cada uma e vá direto à pontuação. Não se jogam Planos de Batalha.")} ${referenceLink(20)}</p></article>
        <article class="info-card"><h3>${t("Hero battle: Plans and limits", "Batalha com Herói: Planos e limites")}</h3><p>${t("If any faction has a Hero present, each player with a Hero may secretly choose up to 1 Battle Plan and up to 3 Bonus Cards from any Main Deck. Each Bonus Card adds 1 to the Plan's strength limit. A free Main Deck card may be used face down as a Plan with limit 3 and no effect. Reveal choices simultaneously; resolve “when revealed” effects now.", "Se houver um Herói de qualquer facção, cada jogador com Herói pode escolher em segredo até 1 Plano de Batalha e até 3 Cartas Bônus de qualquer baralho principal. Cada Bônus soma 1 ao limite de força do Plano. Uma carta principal pode ser usada gratuitamente, virada para baixo, como Plano de limite 3 sem efeito. Revelem simultaneamente; resolva agora efeitos “ao revelar”.")} ${referenceLink(20)}</p></article>
        <article class="info-card"><h3>${t("Combat and failed Plans", "Combate e Planos falhos")}</h3><p>${battleModeText} ${combatDrawText}</p><p>${failureText} ${referenceLink(21)}</p></article>
        <article class="info-card"><h3>${t("Artifacts and the Holy Grail", "Artefatos e Santo Graal")}</h3><p>${t("The first-place player in an Artifact region takes that card and its VPs. Equip it immediately if a Hero has an open slot; otherwise keep it by the Faction board to equip next Mist Phase. For a tied first-place battle, reveal one extra Artifact per additional winner; tied winners choose in lowest-to-highest VP order. A first-place winner in the Grail region gains the Grail instead of an Artifact; tied winners use the lowest-VP tie-break.", "Quem ficar em primeiro numa região com Artefato recebe a carta e seus VPs. Equipe imediatamente se um Herói tiver espaço; caso contrário, guarde-a ao lado do tabuleiro de Facção para equipar na próxima Fase de Névoa. Em empate no primeiro lugar, revele um Artefato extra por vencedor adicional; os empatados escolhem da menor para a maior quantidade de VPs. O primeiro na região do Graal recebe o Graal em vez de um Artefato; no empate, usa-se o desempate de menor VP.")} ${referenceLink(17)} ${referenceLink(22)}</p></article>
        <article class="info-card"><h3>${t("The Grail bearer", "Quem carrega o Graal")}</h3><p>${t("When a player gains the Holy Grail, they gain 10 VPs and assign its token to one Lord; it does not use an Artifact slot. That Lord gains +1 strength and may break one initiative tie per season. Revealing the Grail Mist Card does not change the current bearer's control; it changes only when another player claims the token. If tied winners claim it, the lowest-VP winner takes it; if tied on VPs, compare the starting VP value on their Lord boards.", "Ao receber o Santo Graal, o jogador ganha 10 VPs e atribui a ficha a um Lorde; ela não ocupa espaço de Artefato. Esse Lorde ganha +1 de força e pode desempatar uma iniciativa por estação. Revelar a carta de Névoa do Graal não altera o controle do portador atual; ele só muda quando outro jogador reivindica a ficha. Se houver empate entre vencedores, o de menor VP recebe o Graal; empatados em VP comparam o VP inicial dos tabuleiros de Lorde.")} ${referenceLink(10)} ${referenceLink(17)}</p></article>
        <article class="info-card"><h3>${t("Excalibur and the Favor Track", "Excalibur e a Trilha de Favor")}</h3><p>${t("At the start of War, if Excalibur has not already been claimed that season, the player with uniquely highest Favor takes it; a tie means no one does. The bearer assigns it to a Lord: +2 strength and a once-per-season ability to add +1 in a battle where they tie for first. Reset every Favor marker to 0 after the claim check.", "No início da Guerra, se Excalibur ainda não foi reivindicada nesta estação, quem tiver mais Favor sem empate a recebe; empate significa que ninguém recebe. O portador a atribui a um Lorde: +2 de força e uma habilidade por estação para somar +1 numa batalha em que empate em primeiro. Após verificar a posse, zere todos os marcadores de Favor.")} ${referenceLink(18)}</p></article>
        <article class="info-card"><h3>${t("Green Knight", "Cavaleiro Verde")}</h3><p>${greenKnightText} ${referenceLink(18)}</p></article>
        <article class="info-card"><h3>${t("After each battle", "Após cada batalha")}</h3><p>${t("Resolve scoring and “if you win / don't win” effects, award any Artifact or Grail, then apply “after the battle” effects. Discard all Combat Cards. First place discards its Battle Plan and Bonus Cards; other players discard a failed Plan but recover Bonuses, or recover a successful Plan and all Bonuses.", "Resolva a pontuação e efeitos “se vencer / se não vencer”, entregue Artefato ou Graal e aplique efeitos “após a batalha”. Descarte todas as Cartas de Combate. O primeiro descarta Plano e Bônus; os demais descartam um Plano falho, mas recuperam Bônus, ou recuperam Plano bem-sucedido e todos os Bônus.")} ${referenceLink(22)} ${referenceLink(23)}</p></article>
      </div>
      <div class="callout"><strong>${t("Component precedence:", "Precedência dos componentes:")}</strong> ${t("Battle Plans, faction boards, Mythical Beast cards, and Artifact cards have their own exact effects. If their text conflicts with a summary here, follow the component.", "Planos de Batalha, tabuleiros de facção, cartas de Criatura Mítica e de Artefato têm efeitos próprios. Se o texto divergir deste resumo, siga o componente.")} ${referenceLink(8)}</div>`;
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
      ${sectionHeading("examples", t("Examples", "Exemplos"), "08", 10)}
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
      ${sectionHeading("glossary", t("Glossary", "Glossário"), "09", 24)}
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
        <section class="rule-section">${warSection()}</section>
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
      const done = allItems.filter((item) => state.setupChecks.includes(item.id)).length;
      const progress = root.querySelector("#setup-progress");
      const label = root.querySelector("#setup-progress-label");
      if (progress) {
        progress.value = done;
      }
      if (label) {
        label.textContent = t(`${done} of ${allItems.length} setup steps checked`, `${done} de ${allItems.length} etapas concluídas`);
      }
      return;
    }
    if (target instanceof HTMLSelectElement && target.matches("[data-player-count]")) {
      commit(() => {
        const count = Number(target.value);
        state.playerCount = [2, 3, 4].includes(count) ? count : 4;
        state.factions = state.factions.slice(0, state.playerCount);
        for (const faction of factions) {
          if (state.factions.length >= state.playerCount) {
            break;
          }
          if (!state.factions.includes(faction.id)) {
            state.factions.push(faction.id);
          }
        }
      });
      return;
    }
    if (target instanceof HTMLSelectElement && target.matches("[data-faction-index]")) {
      const index = Number(target.dataset.factionIndex);
      const faction = factions.find((item) => item.id === target.value);
      if (!faction || index < 0 || index >= state.factions.length || state.factions.some((id, i) => id === faction.id && i !== index)) {
        renderInto(root);
        return;
      }
      commit(() => {
        state.factions[index] = faction.id;
      });
      return;
    }
    if (target instanceof HTMLInputElement && target.matches("[data-mode]")) {
      const mode = target.dataset.mode;
      if (mode === "turnOrderMarkers" || mode === "simultaneousCombatDraw") {
        commit(() => {
          if (mode === "turnOrderMarkers") {
            state.turnOrderMarkers = target.checked;
          } else {
            state.simultaneousCombatDraw = target.checked;
          }
        });
      }
      return;
    }
    if (target instanceof HTMLSelectElement && target.matches("[data-mode]")) {
      const mode = target.dataset.mode;
      const value = target.value;
      commit(() => {
        if (mode === "gameLength" && modes.length.includes(value)) {
          state.gameLength = value;
        } else if (mode === "battleMode" && modes.battle.includes(value)) {
          state.battleMode = value;
        } else if (mode === "factionMode" && modes.factions.includes(value)) {
          state.factionMode = value;
        } else if (mode === "favorSide" && modes.favor.includes(value)) {
          state.favorSide = value;
        } else if (mode === "greenKnight") {
          state.greenKnight = value === "true";
        }
      });
    }
  }

  window.AvalonTheRivenVeil = { renderInto, onClick, onChange };
})();
