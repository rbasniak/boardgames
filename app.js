(() => {
  "use strict";

  const STORAGE_KEY = "field-manual.sniper-elite.v1";
  const expansions = [
    {
      id: "eagle",
      title: ["Eagle's Nest", "Eagle's Nest"],
      subtitle: ["2 mapas, 4 snipers aliados e equipamentos", "2 maps, 4 allied snipers and gear"],
      short: ["Heavy Water + Eagle's Nest", "Heavy Water + Eagle's Nest"],
      reference: ["eagle", 2]
    },
    {
      id: "kraken",
      title: ["Operation Kraken", "Operation Kraken"],
      subtitle: ["Norman Village, Super Carrier e portas", "Norman Village, Super Carrier and doors"],
      short: ["Norman Village + Super Carrier", "Norman Village + Super Carrier"],
      reference: ["kraken", 3]
    },
    {
      id: "escalation",
      title: ["Escalation", "Escalation"],
      subtitle: ["Special Ops, missões, cartas e vantagens", "Special Ops, missions, cards and advantages"],
      short: ["Regras opcionais Special Ops", "Optional Special Ops rules"],
      reference: ["escalation", 6]
    }
  ];

  const maps = [
    {
      id: "launch-facility",
      expansion: null,
      image: "assets/maps/launch-facility.webp",
      name: ["Launch Facility", "Launch Facility"],
      type: ["Jogo base", "Core game"],
      description: [
        "Mapa aberto e recomendado para a primeira partida. Edifícios são espaços fechados; água impede movimento, mas não bloqueia visão.",
        "An open map recommended for a first game. Buildings are enclosed spaces; water blocks movement but not line of sight."
      ],
      reference: ["core", 14]
    },
    {
      id: "submarine-pens",
      expansion: null,
      image: "assets/maps/submarine-pens.webp",
      name: ["Submarine Pens", "Submarine Pens"],
      type: ["Jogo base", "Core game"],
      description: [
        "Passarelas elevadas, espaços fechados, água e obstruções. Os túneis vermelhos sob a passarela são espaços distintos.",
        "Elevated walkways, enclosed spaces, water and obstructions. The red tunnels beneath the walkway are distinct spaces."
      ],
      reference: ["core", 14]
    },
    {
      id: "heavy-water",
      expansion: "eagle",
      image: "assets/maps/heavy-water.webp",
      name: ["Heavy Water", "Heavy Water"],
      type: ["Eagle's Nest", "Eagle's Nest"],
      description: [
        "Penhascos e topo da barragem são elevados. O terreno difícil limita o movimento e só permite entrar em um desses espaços por turno.",
        "Clifftops and the dam top are elevated. Difficult terrain reduces movement, and only one difficult space may be entered per turn."
      ],
      reference: ["eagle", 4]
    },
    {
      id: "eagles-nest",
      expansion: "eagle",
      image: "assets/maps/eagles-nest.webp",
      name: ["Eagle's Nest", "Eagle's Nest"],
      type: ["Eagle's Nest", "Eagle's Nest"],
      description: [
        "Salas fechadas distintas e paredes reforçadas: não se pode atirar nem usar Spot através delas; ruídos ainda são ouvidos.",
        "Distinct enclosed rooms and reinforced walls: shooting and Spot cannot pass through them, but noise can still be heard."
      ],
      reference: ["eagle", 6]
    },
    {
      id: "super-carrier",
      expansion: "kraken",
      image: "assets/maps/super-carrier.webp",
      name: ["Super Carrier", "Super Carrier"],
      type: ["Operation Kraken", "Operation Kraken"],
      description: [
        "Navio com três níveis, portas trancáveis, escadas, dutos de ar e paredes reforçadas. Objetivos podem usar cartas de figura.",
        "A three-level ship with lockable doors, ladders, air ducts and reinforced walls. Objectives may use face cards."
      ],
      reference: ["kraken", 6]
    },
    {
      id: "norman-village",
      expansion: "kraken",
      image: "assets/maps/norman-village.webp",
      name: ["Norman Village", "Norman Village"],
      type: ["Operation Kraken", "Operation Kraken"],
      description: [
        "Aldeia com dois veículos blindados e múltiplas entradas em três setores. Veículos e passageiros têm regras próprias.",
        "A village with two armoured vehicles and multiple entrances into three sectors. Vehicles and passengers have special rules."
      ],
      reference: ["kraken", 4]
    }
  ];

  const localManuals = {
    core: "file:///C:/Users/rodrigo.basniak/OneDrive%20-%20AVEVA%20Solutions%20Limited/Documents/%21rbasniak/Personal/Rulebooks/SE%20Core%20_Rulebook1_webquality3.pdf",
    eagle: "file:///C:/Users/rodrigo.basniak/OneDrive%20-%20AVEVA%20Solutions%20Limited/Documents/%21rbasniak/Personal/Rulebooks/SE%20Expansion%20_Rulebook_webquality2.pdf",
    kraken: "file:///C:/Users/rodrigo.basniak/OneDrive%20-%20AVEVA%20Solutions%20Limited/Documents/%21rbasniak/Personal/Rulebooks/Sniper_Elite_Operation_Kraken_Rulebook.pdf",
    escalation: "file:///C:/Users/rodrigo.basniak/OneDrive%20-%20AVEVA%20Solutions%20Limited/Documents/%21rbasniak/Personal/Rulebooks/Sniper_Elite_Escalation_Rulebook.pdf"
  };

  const defaults = {
    expansions: [],
    map: "launch-facility",
    language: "pt-BR",
    team: "sniper",
    setupChecks: []
  };

  let storageAvailable = true;
  let storageNotice = "";
  let state = loadState();
  const app = document.getElementById("app");

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function pair(values) {
    return state.language === "pt-BR" ? values[0] : values[1];
  }

  function setupConfigurationKey(mapId, selectedExpansions) {
    return `${mapId}|${[...selectedExpansions].sort().join(",")}`;
  }

  function loadState() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        return {
          ...defaults,
          expansions: [],
          setupConfig: setupConfigurationKey(defaults.map, [])
        };
      }

      const parsed = JSON.parse(saved);
      const validExpansions = expansions.map((item) => item.id);
      const selected = Array.isArray(parsed.expansions)
        ? parsed.expansions.filter((id) => validExpansions.includes(id))
        : [];
      const chosenMap = maps.some((item) => item.id === parsed.map) ? parsed.map : defaults.map;
      const language = parsed.language === "en-US" || parsed.language === "pt-BR"
        ? parsed.language
        : defaults.language;
      const team = parsed.team === "defenders" ? "defenders" : "sniper";
      const isMapAvailable = maps.find((item) => item.id === chosenMap);
      const map = isMapAvailable && (!isMapAvailable.expansion || selected.includes(isMapAvailable.expansion))
        ? chosenMap
        : defaults.map;
      const setupConfig = setupConfigurationKey(map, selected);
      const setupChecks = parsed.setupConfig === setupConfig && Array.isArray(parsed.setupChecks)
        ? [...new Set(parsed.setupChecks.filter((id) => typeof id === "string"))]
        : [];

      return { expansions: selected, map, language, team, setupChecks, setupConfig };
    } catch (error) {
      storageAvailable = false;
      storageNotice = "load-error";
      console.warn("Could not load saved rulebook preferences.", error);
      return {
        ...defaults,
        expansions: [],
        setupConfig: setupConfigurationKey(defaults.map, [])
      };
    }
  }

  function saveState() {
    try {
      state.setupConfig = setupConfigurationKey(state.map, state.expansions);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      storageAvailable = true;
      storageNotice = "";
    } catch (error) {
      storageAvailable = false;
      storageNotice = "save-error";
      console.error("Could not save rulebook preferences.", error);
    }
  }

  function storageNoticeText() {
    if (storageNotice === "load-error") {
      return t("Saved preferences could not be read; using the default setup.", "Não foi possível ler as preferências salvas; usando a configuração padrão.");
    }
    if (storageNotice === "save-error") {
      return t(
        "Preferences cannot be saved in this browser session. Enable local storage or open the app from a local web server.",
        "As preferências não puderam ser salvas nesta sessão do navegador. Ative o armazenamento local ou abra o app por um servidor local."
      );
    }
    return "";
  }

  function resetSetupChecksWhenConfigurationChanges(previousKey) {
    const nextKey = setupConfigurationKey(state.map, state.expansions);
    if (nextKey !== previousKey) state.setupChecks = [];
    state.setupConfig = nextKey;
  }

  function updateSetupProgress() {
    const boxes = [...app.querySelectorAll("[data-setup-check]")];
    const requiredBoxes = boxes.filter((box) => !box.closest(".setup-check-row")?.classList.contains("optional"));
    const checked = requiredBoxes.filter((box) => box.checked).length;
    const progress = app.querySelector("#setup-progress");
    const label = app.querySelector("#setup-progress-label");
    if (progress) {
      progress.max = Math.max(requiredBoxes.length, 1);
      progress.value = checked;
    }
    if (label) {
      label.textContent = t(
        `${checked} of ${requiredBoxes.length} required steps checked`,
        `${checked} de ${requiredBoxes.length} etapas obrigatórias concluídas`
      );
    }
    const resetButton = app.querySelector("[data-setup-reset]");
    if (resetButton) resetButton.disabled = !boxes.some((box) => box.checked);
  }

  function currentMap() {
    return maps.find((item) => item.id === state.map) || maps[0];
  }

  function isSelected(id) {
    return state.expansions.includes(id);
  }

  function availableMaps() {
    return maps.filter((item) => !item.expansion || isSelected(item.expansion));
  }

  function manualUrl(book, page) {
    const path = window.location.protocol === "file:"
      ? localManuals[book]
      : new URL(`manuals/${book}.pdf`, document.baseURI).href;
    return `${path}#page=${page}`;
  }

  function referenceLink(book, page, label) {
    const title = label || t(`Manual p. ${page} ↗`, `Manual p. ${page} (EN) ↗`);
    return `<a class="source-link" href="${manualUrl(book, page)}" target="_blank" rel="noreferrer">${title}</a>`;
  }

  function sectionHeading(id, title, index, book, page) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("FIELD GUIDE", "GUIA DE CAMPO")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        ${referenceLink(book, page)}
      </div>`;
  }

  const manualIcons = {
    aim: "assets/icons/aim.webp",
    recoil: "assets/icons/recoil.webp",
    noise: "assets/icons/noise.webp",
    suppression: "assets/icons/suppression.webp",
    objective: "assets/icons/objective.webp",
    open: "assets/icons/space-open.webp",
    enclosed: "assets/icons/space-enclosed.webp",
    elevated: "assets/icons/elevated.webp",
    terrain: "assets/icons/difficult-terrain.webp",
    water: "assets/icons/water.webp",
    obstruction: "assets/icons/obstruction.webp",
    doorway: "assets/icons/doorway.webp",
    ladder: "assets/icons/ladders.webp",
    duct: "assets/icons/air-ducts.webp",
    locked: ["assets/icons/door-open.webp", "assets/icons/door-locked.webp"],
    vehicle: ["assets/icons/vehicle-start.webp", "assets/icons/vehicle-access.webp"],
    entrance: "assets/icons/sniper-entrance.webp"
  };

  function iconCard(kind, title, description) {
    const asset = manualIcons[kind];
    const iconMarkup = Array.isArray(asset)
      ? `<span class="manual-icon-pair">${asset.map((src) => `<img src="${src}" alt="">`).join("")}</span>`
      : `<img class="manual-icon" src="${asset}" alt="">`;
    return `
      <article class="icon-card">
        <span class="manual-icon-frame" aria-hidden="true">${iconMarkup}</span>
        <div><strong>${title}</strong><p>${description}</p></div>
      </article>`;
  }

  function renderIcons() {
    const items = [
      ["aim", t("Aim token", "Mira"), t("Grey. Each space to the target requires one aim; the target space counts too.", "Cinza. Exige-se uma mira por espaço até o alvo; o espaço do alvo também conta.")],
      ["recoil", t("Recoil token", "Recuo"), t("Yellow. Adds to recoil/noise for the five-token misfire threshold.", "Amarelo. Soma-se ao ruído para o limite de cinco fichas que causa falha.")],
      ["noise", t("Noise token", "Ruído"), t("Red. Two reveal the sniper; each suppression drawn cancels one noise for revealing.", "Vermelho. Duas revelam o sniper; cada supressão comprada cancela um ruído para revelar.")],
      ["suppression", t("Suppression token", "Supressão"), t("Blue. Raises the noise threshold by one per token drawn; when an officer is killed, their token may enter the bag.", "Azul. Aumenta em um o limite de ruído por ficha comprada; ao eliminar um oficial, sua ficha pode ir para o saco.")],
      ["objective", t("Numbered objective", "Objetivo numerado"), t("One of the sniper's possible destinations. Objective cards identify the matching number and sector.", "Um dos possíveis destinos do sniper. As cartas indicam o número e o setor correspondentes.")],
      ["open", t("Open space", "Espaço aberto"), t("Outdoor areas and wide-open areas; white boundaries.", "Áreas externas e espaços amplos; limites brancos.")],
      ["enclosed", t("Enclosed space", "Espaço fechado"), t("Rooms and buildings. Enter or exit only through a doorway.", "Salas e edifícios. Só se entra ou sai por uma porta.")],
      ["elevated", t("Elevated space", "Espaço elevado"), t("Walkways and high ground. Use marked ladders or access paths.", "Passarelas e terrenos altos. Use escadas ou acessos indicados.")],
      ["terrain", t("Difficult terrain", "Terreno difícil"), t("Entering it reduces movement by one space for that turn.", "Entrar nele reduz o movimento em um espaço naquele turno.")],
      ["water", t("Water", "Água"), t("Cannot be entered; does not block line of sight or sound.", "Não pode ser ocupada; não bloqueia visão nem ruído.")],
      ["obstruction", t("Obstruction", "Obstrução"), t("Cannot be entered and always blocks line of sight.", "Não pode ser ocupada e sempre bloqueia a linha de visão.")],
      ["doorway", t("Door / access point", "Porta / acesso"), t("Connects spaces that would otherwise be separated by a wall or elevation.", "Conecta espaços separados por uma parede ou diferença de altura.")],
      ["entrance", t("Sniper entrance", "Entrada do sniper"), currentMap().id === "super-carrier"
        ? t("This map has one printed entrance; the sniper always uses it.", "Este mapa tem uma única entrada indicada; o sniper sempre a utiliza.")
        : t("Choose an entrance outside the sector containing either objective.", "Escolha uma entrada fora do setor que contém qualquer um dos objetivos.")]
    ];

    const mapId = currentMap().id;
    const hasMechanisationVehicles = mapId === "heavy-water"
      && isSelected("eagle")
      && isSelected("kraken")
      && isSelected("escalation");
    if (mapId === "super-carrier") {
      items.push(
        ["ladder", t("Matching ladders", "Escadas correspondentes"), t("On the Super Carrier, paired ladders connect levels for movement, noise and spotting.", "No Super Carrier, pares de escadas conectam níveis para movimento, ruído e Spot.")],
        ["duct", t("Air ducts", "Dutos de ar"), t("Sniper-only connection for movement and line of sight; not for noise.", "Conexão exclusiva do sniper para movimento e visão; não transmite ruído.")],
        ["locked", t("Door token", "Ficha de porta"), t("The unlocked side behaves like a doorway; the locked side blocks movement and line of sight.", "O lado destrancado funciona como porta; o lado trancado bloqueia movimento e visão.")]
      );
    }
    if (mapId === "norman-village" && isSelected("escalation")) {
      items.push(["locked", t("Door token · Under Curfew", "Ficha de porta · Under Curfew"), t("If Under Curfew is selected, the unlocked side behaves like a doorway and the locked side blocks movement and line of sight.", "Se Under Curfew for escolhida, o lado destrancado funciona como porta e o lado trancado bloqueia movimento e visão.")]);
    }
    if (mapId === "norman-village" || hasMechanisationVehicles) {
      items.push([
        "vehicle",
        t("Vehicle start / road access", "Início / acesso de veículo"),
        hasMechanisationVehicles
          ? t("On Heavy Water, use these markers only if the Mechanisation advantage is selected.", "Em Heavy Water, use estes marcadores somente se a vantagem Mechanisation for escolhida.")
          : t("The black and grey wheel marks identify vehicle start and road-access spaces.", "Os símbolos de roda preto e cinza indicam início do veículo e acesso de estrada.")
      ]);
    }

    if (isSelected("eagle") && currentMap().id === "heavy-water") {
      items.push(["terrain", t("Heavy Water terrain", "Terreno de Heavy Water"), t("Only one difficult space may be entered each turn on this map.", "Neste mapa, só se pode entrar em um espaço difícil por turno.")]);
    }

    return `
      ${sectionHeading("iconography", t("Iconography", "Iconografia"), "01", "core", 10)}
      <div class="icon-grid">${items.map((item) => iconCard(...item)).join("")}</div>
      <div class="callout">${t(
        "<strong>Reading the map:</strong> line of sight passes through open spaces, but not through an enclosed/elevated space or obstruction. Water blocks movement, not sight. Noise depends on adjacency—not line of sight.",
        "<strong>Leitura do mapa:</strong> a visão atravessa espaços abertos, mas não passa por espaços fechados/elevados nem por obstruções. Água bloqueia movimento, não visão. Ruído depende de adjacência, não de linha de visão."
      )}</div>
      <div class="source-note">${t("Original symbols extracted from:", "Símbolos originais extraídos de:")}
        ${referenceLink("core", 11, t("Map symbols · p. 11 ↗", "Símbolos do mapa · p. 11 (EN) ↗"))}
        ${referenceLink("core", 13, t("Shot-bag tokens · p. 13 ↗", "Fichas do saco · p. 13 (EN) ↗"))}
        ${mapId === "norman-village" ? referenceLink("kraken", 4, t("Vehicle markers · p. 4 ↗", "Veículos · p. 4 (EN) ↗")) : ""}
        ${mapId === "norman-village" && isSelected("escalation") ? `${referenceLink("kraken", 6, t("Door token · p. 6 ↗", "Ficha de porta · p. 6 (EN) ↗"))} ${referenceLink("escalation", 17, t("Under Curfew · p. 17 ↗", "Under Curfew · p. 17 (EN) ↗"))}` : ""}
        ${hasMechanisationVehicles ? referenceLink("escalation", 19, t("Mechanisation symbols · p. 19 ↗", "Símbolos de Mechanisation · p. 19 (EN) ↗")) : ""}
        ${mapId === "super-carrier" ? referenceLink("kraken", 6, t("Ship symbols · p. 6 ↗", "Símbolos do navio · p. 6 (EN) ↗")) : ""}
      </div>`;
  }

  function teamSwitch() {
    return `
      <div class="team-switch" role="group" aria-label="${t("Choose a team", "Escolha um time")}">
        <button type="button" data-team="sniper" aria-pressed="${state.team === "sniper"}">${t("Sniper", "Sniper")}</button>
        <button type="button" data-team="defenders" aria-pressed="${state.team === "defenders"}">${t("Defenders", "Alemães")}</button>
      </div>`;
  }

  function quickReference() {
    const sniper = state.team === "sniper";
    const defenderIntel = t(
      "The officer must be in their own sector. Declare one sector; the sniper answers only whether they are there.",
      "O oficial precisa estar no próprio setor. Declare um setor; o sniper responde apenas se está lá."
    ) + (currentMap().id === "super-carrier"
      ? t(
          " On Super Carrier, you may instead check a level: the officer may be in any sector on that level. In one turn, check multiple sectors or multiple levels, but not both types.",
          " No Super Carrier, você pode consultar um nível: o oficial pode estar em qualquer setor dele. Num turno, consulte vários setores ou vários níveis, mas não os dois tipos."
        )
      : "");
    const cards = sniper
      ? [
          [t("Win condition", "Condição de vitória"), t("Complete both secret objectives before taking a second wound or timing out.", "Complete os dois objetivos secretos antes de receber a segunda ferida ou esgotar o tempo.")],
          [t("On your turn", "No seu turno"), isSelected("escalation")
            ? t("Take at most one move and one extra action (Shoot, Loot, or Complete an Objective). Normally use one loadout card; if the upgraded Bayonet was selected, it allows one additional card after Bayonet. Choose any order; skipping never lets you repeat an option.", "Faça no máximo um movimento e uma ação extra (Atirar, Saquear ou Completar Objetivo). Normalmente use uma carta de equipamento; se a melhoria Bayonet foi escolhida, ela permite mais uma carta depois dela. Escolha qualquer ordem; pular não permite repetir uma opção.")
            : t("Take at most one move, one loadout card, and one extra action (Shoot, Loot, or Complete an Objective), in any order. You may skip an option, but skipping never lets you repeat another one.", "Faça no máximo um movimento, use uma carta de equipamento e execute uma ação extra (Atirar, Saquear ou Completar Objetivo), em qualquer ordem. Pode pular uma opção, mas isso não permite repetir outra.")],
          [t("Move quietly", "Movimento silencioso"), t("Move 0–1 spaces to stay hidden. Moving 2–3 alerts defenders adjacent to any space along your route, including start and end.", "Mova 0–1 espaços para permanecer oculto. Mover 2–3 alerta defensores adjacentes ao trajeto, incluindo início e fim.")],
          [t("Make a shot", "Faça um disparo"), t("Need one aim per space on the shortest line (including the target); even a target in your own space needs one aim. Announce how many tokens you will draw, then show every token.", "Precisa de uma mira por espaço na menor linha (incluindo o alvo); mesmo no seu próprio espaço, precisa de uma mira. Anuncie quantas fichas vai comprar e depois mostre todas.")],
          [t("Noise & misfire", "Ruído e falha"), t("Two net noise tokens reveal your space. Each suppression token drawn raises that reveal threshold by one. Five combined recoil + noise tokens misfire; suppression does not prevent a misfire.", "Duas fichas líquidas de ruído revelam sua posição. Cada supressão comprada aumenta esse limite em um. Cinco fichas de recuo + ruído causam falha; supressão não evita falha.")],
          [t("Objectives & timer", "Objetivos e relógio"), t("Reveal an objective only while on its numbered space. It adds noise and resets all defender countdown cubes (including the Hunter's, if present) to 10 (or 7 with Accelerated Schedule) for the next objective.", "Revele um objetivo apenas no espaço numerado correspondente. Isso adiciona ruído e reinicia todos os cubos de contagem dos alemães (inclusive o do Hunter, se estiver em jogo) em 10 (ou 7 com Accelerated Schedule) para o próximo objetivo.")]
        ]
      : [
          [t("Win condition", "Condição de vitória"), t("Wound the sniper twice, or have every defender countdown cube on the final space at the start of the defenders' turn; include the Hunter's white cube if he is in play.", "Fira o sniper duas vezes ou mantenha todos os cubos de contagem dos alemães no espaço final no início do turno deles; inclua o cubo branco do Hunter se estiver em jogo.")],
          [t("Three squads", "Três esquadrões"), t("Black, red and yellow squads each have one officer and two soldiers. Each squad gathers intel or takes two unit actions.", "Os esquadrões preto, vermelho e amarelo têm um oficial e dois soldados. Cada esquadrão reúne informação ou faz duas ações de unidade.")],
          [t("Attack", "Atacar"), t("Move a unit into a suspected space and attack that space. If the sniper is there, they take a wound.", "Mova uma unidade até um espaço suspeito e ataque esse espaço. Se o sniper estiver ali, recebe uma ferida.")],
          [t("Spot or sweep", "Spot ou Sweep"), t("Spot checks one adjacent space. Sweep checks the unit's space plus two matching-adjacent spaces; the sniper only confirms if present.", "Spot verifica um espaço adjacente. Sweep verifica o espaço da unidade e dois adjacentes do mesmo tipo; o sniper só confirma se está ali.")],
          [t("Gather intel", "Reunir informação"), defenderIntel],
          [t("Unit action limit", "Limite por unidade"), t("A squad may repeat an action with different units, but an individual unit cannot take the same action twice in one turn.", "Um esquadrão pode repetir a ação com unidades diferentes, mas uma unidade não pode fazer a mesma ação duas vezes no turno.")],
          [t("Track actions", "Marque as ações"), t("Advance one squad cube for each unit action; intel advances both cubes together. Passing also uses and marks an action.", "Avance um cubo do esquadrão por ação de unidade; reunir informação avança os dois juntos. Passar também consome e marca uma ação.")]
        ];

    const addonCards = [];
    if (isSelected("kraken") && currentMap().id === "norman-village") {
      addonCards.push([
        t("Vehicles", "Veículos"),
        t("A vehicle needs 3 aim tokens at minimum (armour 2). It can be destroyed; it never returns. Passengers count as occupying its space for noisy movement.", "Um veículo exige no mínimo 3 miras (blindagem 2). Pode ser destruído e não retorna. Passageiros contam no espaço do veículo para movimento ruidoso.")
      ]);
    }
    if (isSelected("escalation") && isSelected("kraken") && currentMap().id === "heavy-water") {
      addonCards.push([
        t("Mechanisation", "Mechanisation"),
        t("The Heavy Water map gains the Norman Village vehicles when this advantage is selected; armour 2 means at least three aim tokens to hit.", "O mapa Heavy Water recebe os veículos de Norman Village quando essa vantagem é escolhida; blindagem 2 exige no mínimo três miras para acertar.")
      ]);
    }
    if (isSelected("kraken") && currentMap().id === "super-carrier") {
      addonCards.push([
        t("Super Carrier", "Super Carrier"),
        t("Doors can be locked by defenders or shot open by the sniper. Ladders connect all teams; air ducts connect only the sniper.", "Defensores podem trancar portas; o sniper pode atirar nelas para abri-las. Escadas conectam todos; dutos conectam apenas o sniper.")
      ]);
    }
    if (isSelected("escalation")) {
      addonCards.push([
        t("Special Ops", "Special Ops"),
        t("Rank gives each side 1, 2 or 3 edges. Use each selected mission, advantage, specialist and upgraded loadout as printed.", "A patente dá a cada lado 1, 2 ou 3 escolhas. Use as missões, vantagens, especialistas e equipamentos melhorados escolhidos conforme a carta.")
      ]);
    }
    if (isSelected("eagle")) {
      addonCards.push([
        t("Allied sniper", "Sniper aliado"),
        t("If playing an allied sniper, replace the base bag composition with the values on that sniper card; their special ability is mandatory unless stated otherwise.", "Se jogar com um sniper aliado, substitua a composição do saco pelos valores da carta; a habilidade especial é obrigatória, salvo indicação contrária.")
      ]);
    }
    if (!sniper) {
      addonCards.push([
        t("Split the defender squads", "Divisão dos esquadrões"),
        t("There are always three squads: one defender player controls all three; with two defenders, each controls one and they decide the third together; with three defenders, each controls one.", "Sempre há três esquadrões: um jogador defensor controla os três; com dois, cada um controla um e decidem juntos o terceiro; com três defensores, cada um controla um.")
      ]);
      addonCards.push([
        t("Tracking cubes", "Cubos de rastreamento"),
        t("The ten transparent cubes are a shared aid: use them however the team prefers to mark possible sniper locations; they do not represent units or actions.", "Os dez cubos transparentes são uma ajuda compartilhada: usem-nos como preferirem para marcar possíveis posições do sniper; não representam unidades nem ações.")
      ]);
    }

    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), "02", "core", sniper ? 5 : 8)}
      <div class="panel-topline"><div><p class="eyebrow">${t("PLAYER AID", "AJUDA DE JOGO")}</p><p>${t("A compact checklist for the side you are playing.", "Resumo rápido para o lado que você está jogando.")}</p></div>${teamSwitch()}</div>
      <div class="quick-grid">${cards.map(([title, body], index) => `
        <article class="info-card"><span class="card-number">${String(index + 1).padStart(2, "0")}</span><h3>${title}</h3><p>${body}</p></article>`).join("")}
        ${addonCards.map(([title, body]) => `<article class="info-card"><span class="card-number">+</span><h3>${title}</h3><p>${body}</p></article>`).join("")}
      </div>
      <div class="callout">${sniper
        ? t("<strong>Keep the secret:</strong> do not announce your position, objective, target, or the order of your actions unless a rule or card requires it.", "<strong>Mantenha o segredo:</strong> não revele posição, objetivo, alvo ou ordem das ações, exceto quando uma regra ou carta exigir.")
        : t("<strong>Last known position is not current position.</strong> A sniper miniature stays on the board as a clue even after the sniper moves away.", "<strong>Última posição conhecida não é posição atual.</strong> A miniatura do sniper permanece no tabuleiro como pista, mesmo depois que ele se move.")
      }</div>
      <div class="source-note">${sniper
        ? `${referenceLink("core", 6, t("Shooting & shot bag · manual p. 6 ↗", "Disparo e saco · manual p. 6 (EN) ↗"))} ${referenceLink("core", 7, t("Loot & objectives · manual p. 7 ↗", "Saque e objetivos · manual p. 7 (EN) ↗"))}`
        : `${referenceLink("core", 9, t("Spot, Sweep & specialists · manual p. 9 ↗", "Spot, Sweep e especialistas · manual p. 9 (EN) ↗"))}`}
      </div>`;
  }

  function mapSetupNotes() {
    const id = currentMap().id;
    if (id === "submarine-pens") {
      return [
        [t("Elevated and enclosed spaces", "Espaços elevados e fechados"), t("The light-coloured walkways are elevated and can only be entered/exited via ladders. The rooms in the yellow, black, and red sectors are enclosed and accessed through marked doorways.", "As passarelas claras são elevadas e só podem ser acessadas por escadas. As salas nos setores amarelo, preto e vermelho são fechadas e acessadas pelas portas indicadas.")],
        [t("Tunnels beneath the walkway", "Túneis sob a passarela"), t("The two red spaces beneath the central walkway are enclosed tunnels. They are separate spaces: the tunnel and walkway directly above are not adjacent and have no line of sight. Place a unit in the red area to show it is in a tunnel.", "Os dois espaços vermelhos sob a passarela central são túneis fechados. São espaços distintos: o túnel e a passarela logo acima não são adjacentes nem têm linha de visão. Coloque a unidade na área vermelha para indicar que está no túnel.")],
        [t("Rooms beside walkways", "Salas ao lado das passarelas"), t("The enclosed rooms beside the walkways do not have line of sight to the elevated walkway. To see between enclosed and elevated spaces, trace through at least one open space or a ladder.", "As salas fechadas ao lado das passarelas não têm linha de visão para a passarela elevada. Para ter visão entre espaços fechados e elevados, a linha deve passar por um espaço aberto ou por uma escada.")],
        [t("Water & obstructions", "Água e obstruções"), t("Water cannot be entered but does not block sight. Obstructions cannot be entered and block line of sight.", "Não é possível entrar na água, mas ela não bloqueia visão. Obstruções não podem ser ocupadas e bloqueiam a linha de visão.")]
      ];
    }
    if (id === "heavy-water") {
      return [
        [t("Elevated and enclosed areas", "Áreas elevadas e fechadas"), t("Clifftops and the top of the dam are elevated and accessible only by marked paths. Each building is one enclosed space entered/exited through its marked doorway. Water blocks movement, not sight.", "Os penhascos e o topo da barragem são elevados e só podem ser acessados pelos caminhos marcados. Cada edifício é um espaço fechado, acessado pela porta indicada. Água bloqueia movimento, não visão.")],
        [t("Difficult terrain", "Terreno difícil"), t("Entering difficult terrain reduces maximum movement by one (sniper: 2 spaces; defenders: 1). A defender must start adjacent; the sniper must start within two spaces. Only one difficult space may be entered per turn, and the terrain does not make movement noisier.", "Entrar em terreno difícil reduz o movimento máximo em um (sniper: 2 espaços; alemães: 1). O defensor deve começar adjacente; o sniper deve começar a até dois espaços. Só se pode entrar em um terreno difícil por turno, e ele não torna o movimento mais ruidoso.")],
        ...(isSelected("escalation") && isSelected("kraken")
          ? [[t("Mechanisation (if selected)", "Mechanisation (se escolhida)"), t("This Special Ops advantage adds the Norman Village vehicles using the Heavy Water road/start diagram.", "Esta vantagem Special Ops adiciona os veículos de Norman Village conforme o diagrama de estradas e início de Heavy Water.")]]
          : [])
      ];
    }
    if (id === "eagles-nest") {
      return [
        [t("Reinforced walls", "Paredes reforçadas"), t("Shooting and Spot cannot pass through reinforced walls. Noise can still be heard through them.", "Tiros e Spot não atravessam paredes reforçadas. O ruído ainda pode ser ouvido através delas.")],
        [t("Enclosed and open areas", "Áreas fechadas e abertas"), t("Each internal room is a distinct enclosed area. The marble corridors, left balcony, and servants' corridor along the top/right edge are open spaces.", "Cada sala interna é uma área fechada distinta. Os corredores de mármore, a sacada à esquerda e o corredor de serviço no alto/lado direito são espaços abertos.")],
        [t("Doorway line of sight", "Linha de visão através de portas"), t("A doorway lets you target only the space immediately beyond it. From a space with a doorway, trace as if standing on the other side; you may pass a second doorway only to its first space.", "Uma porta permite mirar apenas no espaço logo depois dela. Se estiver em um espaço com porta, trace como se estivesse do outro lado; só é possível atravessar uma segunda porta até o primeiro espaço após ela.")]
      ];
    }
    if (id === "norman-village") {
      return [
        [t("Multiple entrances", "Entradas múltiplas"), t("Three sectors have two entrance arrows. The sniper may use either entrance, but cannot enter through a sector containing either objective.", "Três setores têm duas setas de entrada. O sniper pode usar qualquer uma, mas não pode entrar por um setor que contenha um dos objetivos.")],
        [t("Vehicle patrols", "Patrulhas de veículos"), t("Two armoured vehicles start empty on the printed icons and move only along roads. Each can carry one defender. An empty vehicle is not alerted by sniper movement; an embarked defender counts as occupying the vehicle's space for noise.", "Dois veículos blindados começam vazios nos ícones impressos e só percorrem estradas. Cada um pode transportar um defensor. Um veículo vazio não é alertado pelo movimento do sniper; um defensor embarcado conta no espaço do veículo para ruído.")],
        [t("Embark & disembark", "Embarcar e desembarcar"), t("A defender who ends a move action in an empty vehicle's space must embark: place the unit miniature on that vehicle's face-up card. A unit cannot end movement in a vehicle space that already has a passenger. To disembark, use a move action, place the miniature in the vehicle's space, move up to two spaces as normal, and end in a different space. The sniper may enter an empty vehicle space, but not an occupied one.", "Um defensor que termina uma ação de movimento no espaço de um veículo vazio deve embarcar: coloque a miniatura naquela carta de veículo visível. Uma unidade não pode terminar o movimento no espaço de um veículo que já tenha passageiro. Para desembarcar, use uma ação de movimento, coloque a miniatura no espaço do veículo, mova até dois espaços normalmente e termine em outro espaço. O sniper pode entrar no espaço de um veículo vazio, mas não no de um ocupado.")],
        ...(isSelected("escalation")
          ? [[t("Under Curfew (optional)", "Under Curfew (opcional)"), t("If selected, vehicle units cannot lock or unlock doors. The setup checklist covers placing all 11 door tokens and adding Bolt Cutters to the loadout pool.", "Se escolhida, unidades em veículos não podem trancar nem destrancar portas. A checklist de preparação indica como posicionar as 11 fichas e adicionar Bolt Cutters à reserva.")]]
          : [])
      ];
    }
    if (id === "super-carrier") {
      return [
        [t("Sniper entrance", "Entrada do sniper"), t("There is only one entrance on this map; the sniper always uses it.", "Este mapa tem uma única entrada; o sniper sempre a utiliza.")],
        [t("Three decks and movement links", "Três conveses e conexões"), t("The three decks are separate: no one may move outside the ship, and you cannot move or see between levels except through matching links. Matching ladders connect for movement, sound, Spot, and line of sight, but are not matching-adjacent for Sweep. Matching air ducts connect only for sniper movement/line of sight, not sound or defender movement; links do not grant line of sight to other spaces on another level.", "Os três conveses são separados: ninguém pode sair do navio, nem mover/ver entre níveis fora das conexões correspondentes. Escadas com letras iguais conectam movimento, ruído, Spot e visão, mas não contam para Sweep. Dutos com letras iguais conectam apenas movimento/visão do sniper, não ruído nem movimento dos defensores; as conexões não dão visão a outros espaços de outro nível.")],
        [t("Doors and reinforced walls", "Portas e paredes reforçadas"), t("Locked doors block movement and line of sight. A successful sniper shot removes a door token permanently and adds no bag token. Reinforced walls block actions/effects, but not noise.", "Portas trancadas bloqueiam movimento e visão. Um tiro bem-sucedido do sniper remove a ficha permanentemente sem adicionar token ao saco. Paredes reforçadas bloqueiam ações/efeitos, mas não ruído.")],
        [t("Open and enclosed spaces", "Espaços abertos e fechados"), t("The bridge, officer area, and two engine rooms are distinct enclosed areas. All other ship areas count as open, even when separated by a door.", "A ponte, a área dos oficiais e as duas salas de máquinas são áreas fechadas distintas. As demais áreas do navio contam como abertas, mesmo quando separadas por uma porta.")],
        [t("Face-card objectives", "Objetivos de cartas de figura"), t("If both drawn objectives have the same face-card value, return one to the bottom and draw again. The suit identifies the matching board icon.", "Se os dois objetivos comprados tiverem o mesmo valor de figura, devolva um ao fundo e compre outro. O naipe identifica o ícone correspondente no tabuleiro.")],
        ...(isSelected("escalation")
          ? [[t("Tipped Off (optional)", "Tipped Off (opcional)"), t("If selected, after specialists are chosen, lock any two doors.", "Se escolhida, depois de selecionar especialistas, tranque duas portas quaisquer.")]]
          : [])
      ];
    }
    return [
      [t("Enclosed areas", "Áreas fechadas"), t("Launch Facility has no elevated spaces or obstructions. All buildings, the submarine, and the three rail cars in the black sector are enclosed and can only be entered/exited through marked doorways.", "Launch Facility não tem espaços elevados nem obstruções. Todos os edifícios, o submarino e os três vagões do setor preto são fechados e só podem ser acessados pelas portas indicadas.")],
      [t("Water & difficult terrain", "Água e terreno difícil"), t("Water cannot be entered but does not block line of sight. Entering difficult terrain reduces maximum movement by one (sniper: 2; defenders: 1); defenders must start adjacent and the sniper within two spaces. These spaces still count as open/matching-adjacent.", "Não é possível entrar na água, mas ela não bloqueia visão. Entrar em terreno difícil reduz o movimento máximo em um (sniper: 2; alemães: 1); os alemães precisam começar adjacentes e o sniper a até dois espaços. Esses espaços continuam sendo abertos/adjacentes do mesmo tipo.")]
    ];
  }

  function setupTask(id, en, pt, optional = false) {
    return { id, text: t(en, pt), optional };
  }

  function setupChecklistPhases() {
    const mapId = currentMap().id;
    const phases = [];

    if (isSelected("escalation")) {
      phases.push({
        title: t("Before setup · choose a Special Ops rank", "Antes da preparação · escolha a patente Special Ops"),
        refs: [["escalation", 6]],
        items: [
          setupTask("specialops-rank", "Choose Private (1 edge per side), Corporal (2), or Sergeant (3) before starting setup.", "Antes de começar, escolha Soldado (1 opção por lado), Cabo (2) ou Sargento (3).")
        ]
      });
    }

    phases.push({
      title: t("Select the mission and prepare the table", "Escolha a missão e prepare a mesa"),
      refs: [["core", 4]],
      items: [
        setupTask("confirm-configuration", `Confirm that everyone is using ${pair(currentMap().name)} and the expansions selected in Mission Control.`, `Confirme com todos que a partida usará ${pair(currentMap().name)} e as expansões selecionadas no Controle da Missão.`),
        setupTask("place-main-board", `Place the main board with the ${pair(currentMap().name)} side face up.`, `Deixe o tabuleiro principal com o lado de ${pair(currentMap().name)} para cima.`),
        setupTask("select-map-hidden-board", "Take the hidden board that matches this map.", "Separe o tabuleiro oculto correspondente a este mapa."),
        setupTask("select-map-objectives", "Take only the nine objective cards for this map; do not mix them with another map's cards.", "Separe somente as nove cartas de objetivo deste mapa; não as misture com as de outro mapa."),
        setupTask("separate-unused-maps", "Return unused map sides, hidden boards, and objective sets to the box.", "Devolva à caixa os lados, tabuleiros ocultos e conjuntos de objetivos que não serão usados."),
        setupTask("use-countdown-side", "Turn the double-sided solo/countdown board to its countdown side.", "Vire o tabuleiro dupla face solo/contagem para o lado da contagem."),
        setupTask("remove-solo-components", "Keep the solo deck and solo die out of this multiplayer game.", "Deixe o baralho e o dado solo fora desta partida multijogador.")
      ]
    });

    if (isSelected("escalation")) {
      const sniperFirst = ["launch-facility", "submarine-pens", "heavy-water"].includes(mapId);
      phases.push({
        title: t("Draft Special Ops edges", "Escolha as opções Special Ops"),
        refs: [["escalation", 7]],
        items: [
          setupTask(
            "specialops-first-picker",
            sniperFirst
              ? "The sniper chooses first on Launch Facility, Submarine Pens, and Heavy Water."
              : "The defenders choose first on Eagle's Nest, Super Carrier, and Norman Village.",
            sniperFirst
              ? "O sniper escolhe primeiro em Launch Facility, Submarine Pens e Heavy Water."
              : "Os alemães escolhem primeiro em Eagle's Nest, Super Carrier e Norman Village."
          ),
          setupTask("specialops-sniper-edge-choice", "The sniper chooses exactly the number of edges granted by their rank from: Sniper missions (Killshot or Good Boy), Upgraded Loadout, and Extra Loadout. Edge types may be repeated; each Extra Loadout edge adds one card to the sniper's starting hand.", "O sniper escolhe exatamente o número de edges concedido pela patente entre: missões do Sniper (Killshot ou Good Boy), Upgraded Loadout e Extra Loadout. Tipos de edge podem ser repetidos; cada Extra Loadout acrescenta uma carta à mão inicial."),
          setupTask("specialops-defender-edge-choice", "The defenders choose exactly the number of edges granted by their rank from: Defender missions (Flares or Call the Hunter), Elite Specialist, and Advantage. Edge types may be repeated; each Advantage is limited to its printed map except Accelerated Schedule.", "Os alemães escolhem exatamente o número de edges concedido pela patente entre: missões dos Defensores (Flares ou Call the Hunter), Elite Specialist e Advantage. Tipos de edge podem ser repetidos; cada Advantage se limita ao mapa indicado, exceto Accelerated Schedule."),
          setupTask("specialops-announce-missions", "If any mission is selected, announce each one as soon as it is chosen.", "Se escolher missões, anuncie cada uma assim que for escolhida.", true),
          setupTask("specialops-announce-advantages", "If any advantage is selected, announce each one as soon as it is chosen.", "Se escolher vantagens, anuncie cada uma assim que for escolhida.", true),
          setupTask("specialops-display-cards", "Place each selected mission and advantage card face up beside the board.", "Deixe visível ao lado do tabuleiro cada carta de missão e vantagem escolhida.", true),
          setupTask("specialops-announce-upgraded-count", "If any Upgraded Loadout edge is chosen, announce its count without naming the cards.", "Se escolher Upgraded Loadout, anuncie a quantidade sem revelar as cartas.", true),
          setupTask("specialops-announce-extra-count", "If any Extra Loadout edge is chosen, announce its count without revealing the starting cards.", "Se escolher Extra Loadout, anuncie a quantidade sem revelar as cartas iniciais.", true),
          setupTask("specialops-announce-elite-count", "If any Elite Specialist edge is chosen, announce its count without naming the specialists.", "Se escolher Elite Specialist, anuncie a quantidade sem revelar os especialistas.", true),
          setupTask("specialops-choice-timing", "If any upgraded or extra loadouts were chosen, the sniper selects those cards after both edge lists and before the defenders select specialists.", "Se escolher equipamentos melhorados ou extras, o sniper seleciona essas cartas depois das duas listas de opções e antes de os alemães escolherem especialistas.", true),
          setupTask("specialops-elite-timing", "If Elite Specialist was chosen, select each elite card during the defenders' normal specialist selection, instead of its matching basic card.", "Se escolher Elite Specialist, selecione cada carta elite durante a seleção normal de especialistas dos alemães, no lugar da carta base correspondente.", true)
        ]
      });
    }

    phases.push({
      title: t("Give the components to the sniper", "Entregue os componentes ao sniper"),
      refs: [["core", 3], ["core", 4]],
      items: [
        setupTask("give-map-hidden-board", "Give the sniper the hidden board for the selected map.", "Entregue ao sniper o tabuleiro oculto do mapa escolhido."),
        setupTask("give-map-objectives", "Give the sniper the nine objective cards for the selected map.", "Entregue ao sniper as nove cartas de objetivo do mapa escolhido."),
        setupTask("give-sniper-miniature", "Set the base Sniper miniature aside until the Sniper character is chosen.", "Separe a miniatura base do Sniper até escolher o personagem."),
        setupTask("give-sniper-marker", "Give the dry-erase marker to the sniper.", "Entregue o marcador apagável ao sniper."),
        setupTask("give-sniper-bag", "Give the shot bag to the sniper.", "Entregue o saco de disparo ao sniper."),
        setupTask("give-sniper-aid", "Give the Sniper player aid to the sniper.", "Entregue a ajuda de jogador do Sniper ao sniper."),
        setupTask("give-shot-token-supply", "Give the sniper all 30 core shot tokens: 11 aim, 7 recoil, 9 noise, and 3 suppression. Keep the unused supply hidden if playing Ghost Sniper.", "Entregue ao sniper as 30 fichas de disparo base: 11 de mira, 7 de recuo, 9 de ruído e 3 de supressão. Se usar Ghost Sniper, mantenha escondidas as fichas não usadas."),
        setupTask("give-loadout-pool", "Give the sniper the 10 core loadout cards. Add expansion cards only as directed in the loadout-preparation steps below.", "Entregue ao sniper as 10 cartas de equipamento do jogo base. Acrescente cartas de expansão somente conforme as etapas de preparação dos equipamentos abaixo.")
      ]
    });
    phases.push({
      title: t("Give the components to the defenders", "Entregue os componentes aos alemães"),
      refs: [["core", 3], ["core", 4]],
      items: [
        setupTask("give-defender-units", "Give the defenders 6 soldier miniatures and 3 officer miniatures.", "Entregue aos alemães 6 miniaturas de soldado e 3 miniaturas de oficial."),
        setupTask("give-defender-bases", "Give the defenders all 9 bases: 3 in each squad color; officers use the Iron Cross bases.", "Entregue aos alemães as 9 bases: 3 de cada cor; oficiais usam as bases com Cruz de Ferro."),
        setupTask("give-defender-cubes", "Give the defenders 12 action cubes (4 per squad color).", "Entregue aos alemães 12 cubos de ação (4 de cada cor de esquadrão)."),
        setupTask("give-defender-trackers", "Give the defenders 10 transparent tracking cubes. Use them however the team prefers to mark possible sniper locations.", "Entregue aos alemães 10 cubos transparentes de rastreamento. O grupo pode usá-los como preferir para marcar possíveis posições do sniper."),
        setupTask("give-defender-specialist-cards", "Give the defenders all 6 specialist cards; they will choose 3 during defender setup.", "Entregue aos alemães as 6 cartas de especialista; eles escolherão 3 na preparação dos defensores."),
        setupTask("give-defender-suppression", "Give the defenders all 3 suppression tokens; one is placed on each chosen specialist card.", "Entregue aos alemães as 3 fichas de supressão; uma será colocada em cada especialista escolhido."),
        setupTask("give-defender-aid", "Give the Defender player aid to the defenders.", "Entregue aos alemães a ajuda de jogador dos Defensores."),
        setupTask("give-countdown-kit", "Give the countdown board and wound marker to the defenders.", "Entregue aos alemães o tabuleiro de contagem e o marcador de ferida.")
      ]
    });
    phases.push({
      title: t("Return unused components", "Guarde os componentes não utilizados"),
      refs: [["core", 3]],
      items: [
        setupTask("return-unused-components", "Return unused multiplayer components to the box; keep every component required by the selected map and expansion rules.", "Devolva à caixa os componentes multijogador não utilizados; mantenha todos os componentes exigidos pelo mapa e expansões selecionados.")
      ]
    });

    const mapPrep = [];
    if (mapId === "super-carrier") {
      mapPrep.push(setupTask("map-super-carrier-doors", "Place one door token on each printed Super Carrier doorway, with its unlocked side face up. Each token occupies both spaces it overlaps.", "Coloque uma ficha de porta em cada porta impressa do Super Carrier, com o lado destrancado para cima. Cada ficha ocupa os dois espaços que ela sobrepõe."));
    }
    if (mapId === "norman-village") {
      mapPrep.push(setupTask("map-norman-vehicles", "Place one vehicle miniature on each of the two Norman Village vehicle-start icons.", "Coloque uma miniatura de veículo em cada um dos dois ícones de início de veículo de Norman Village."));
      mapPrep.push(setupTask("map-norman-vehicle-cards", "Place both vehicle cards face up where all defenders can see them.", "Deixe as duas cartas de veículo visíveis para todos os alemães."));
    }
    if (mapId === "heavy-water" && isSelected("escalation") && isSelected("kraken")) {
      mapPrep.push(setupTask("map-mechanisation-vehicles", "If Mechanisation was selected, place the two vehicles on the Heavy Water start icons shown in Escalation p. 19.", "Se Mechanisation foi escolhida, coloque os dois veículos nos ícones de início de Heavy Water mostrados na p. 19 de Escalation.", true));
      mapPrep.push(setupTask("map-mechanisation-cards", "If Mechanisation was selected, place both vehicle cards face up where all defenders can see them.", "Se Mechanisation foi escolhida, deixe visíveis as duas cartas de veículo para todos os alemães.", true));
    }
    if (mapId === "launch-facility" && isSelected("escalation")) {
      mapPrep.push(setupTask("map-roadblocks-entrances", "If Roadblocks was selected, place difficult-terrain tokens on the four entrances.", "Se Roadblocks foi escolhida, coloque fichas de terreno difícil nas quatro entradas.", true));
      mapPrep.push(setupTask("map-roadblocks-fifth", "If Roadblocks was selected, place its fifth token on an open space not adjacent to any other difficult terrain, including printed spaces.", "Se Roadblocks foi escolhida, coloque a quinta ficha em um espaço aberto que não seja adjacente a outro terreno difícil, inclusive impresso.", true));
    }
    if (isSelected("escalation")) {
      mapPrep.push(setupTask("mission-good-boy", "If Good Boy was selected, place the dog miniature near the board.", "Se Good Boy foi escolhido, coloque a miniatura do cão perto do tabuleiro.", true));
      mapPrep.push(setupTask("mission-hunter-miniature", "If Call the Hunter was selected, place the Hunter miniature at the location shown for this map in Escalation p. 18.", "Se Call the Hunter foi escolhido, coloque a miniatura do Hunter no local indicado para este mapa na p. 18 de Escalation.", true));
      mapPrep.push(setupTask("mission-hunter-zone", "If Call the Hunter was selected, place the deployment-zone token on the marked space shown for this map in Escalation p. 18.", "Se Call the Hunter foi escolhido, coloque o marcador de zona de implantação no espaço indicado para este mapa na p. 18 de Escalation.", true));
      mapPrep.push(setupTask("advantage-accelerated-schedule", "If Accelerated Schedule was selected, start the countdown cubes at 7 and reset them to 7 after each objective instead of 10.", "Se Accelerated Schedule foi escolhida, coloque os cubos de contagem no 7 e reinicie para 7 após cada objetivo, em vez de 10.", true));
    }
    if (mapPrep.length) {
      phases.push({
        title: t("Prepare this map and selected missions", "Prepare este mapa e as missões escolhidas"),
        refs: [
          ...(mapId === "super-carrier" ? [["kraken", 6]] : mapId === "norman-village" ? [["kraken", 4]] : []),
          ...(isSelected("escalation")
            ? [["escalation", mapId === "heavy-water" ? 19 : mapId === "submarine-pens" ? 16 : 17], ["escalation", 18]]
            : [])
        ],
        items: mapPrep
      });
    }

    const sniperTasks = [
      setupTask(
        "sniper-character-choice",
        isSelected("eagle")
          ? "Choose the base Sniper, a revealed allied sniper, or the Ghost Sniper variant."
          : "Use the base Sniper for this game.",
        isSelected("eagle")
          ? "Escolha o Sniper base, um sniper aliado revelado ou a variante Ghost Sniper."
          : "Use o Sniper base nesta partida."
      ),
      setupTask("sniper-base-miniature", "If using the base Sniper, give the base miniature to the player.", "Se usar o Sniper base, entregue a miniatura base ao jogador.", true)
    ];
    phases.push({
      title: t("Choose the sniper", "Escolha o sniper"),
      refs: [["core", 4]],
      items: sniperTasks.splice(0)
    });
    if (isSelected("eagle")) {
      const alliedSniperTasks = [
        setupTask("sniper-allied-choice", "If using a revealed allied sniper (not Ghost Sniper), choose one of the four cards.", "Se usar um sniper aliado revelado (não Ghost Sniper), escolha uma das quatro cartas.", true),
        setupTask("sniper-allied-miniature", "Take the miniature that matches the chosen allied sniper.", "Pegue a miniatura correspondente ao sniper aliado escolhido.", true),
        setupTask("sniper-allied-reveal", "Place the chosen allied sniper card face up; it replaces the base sniper.", "Deixe visível a carta do sniper aliado escolhido; ela substitui o sniper base.", true),
        setupTask("sniper-ghost-shuffle", "For Ghost Sniper, shuffle the four allied sniper cards.", "Para Ghost Sniper, embaralhe as quatro cartas de sniper aliado.", true),
        setupTask("sniper-ghost-draw", "Draw one allied sniper card secretly.", "Compre uma carta de sniper aliado em segredo.", true),
        setupTask("sniper-ghost-hide-card", "Keep the drawn allied sniper card hidden until one of the reveal conditions described in the Allied Sniper rules.", "Mantenha oculta a carta comprada até uma das condições de revelação descritas nas regras de Sniper aliado.", true),
        setupTask("sniper-ghost-miniature", "Leave the matching allied sniper miniature in the box until the card is revealed.", "Deixe na caixa a miniatura correspondente até revelar a carta.", true)
      ];
      phases.push({
        title: t("Prepare allied sniper cards", "Prepare as cartas de sniper aliado"),
        refs: [["eagle", 3], ["eagle", 8]],
        items: alliedSniperTasks
      });
    }
    sniperTasks.push(
      setupTask("sniper-objectives-shuffle", "Shuffle only the nine objective cards for the selected map.", "Embaralhe somente as nove cartas de objetivo do mapa escolhido."),
      setupTask("sniper-objectives-draw", "Draw exactly two objective cards.", "Compre exatamente duas cartas de objetivo."),
      setupTask("sniper-objectives-match-return", "If the two cards have the same suit, return one of your choice to the bottom of the deck.", "Se as duas cartas tiverem o mesmo naipe, devolva uma delas ao fundo do baralho.", true),
      setupTask("sniper-objectives-match-redraw", "When the suits match, draw a replacement; repeat the return/draw process until the two suits differ.", "Quando os naipes forem iguais, compre uma carta substituta; repita devolução e compra até os dois naipes serem diferentes.", true),
      setupTask("sniper-objectives-secret", mapId === "super-carrier" ? "Keep the two different-suit, different-face-value objective cards hidden from the defenders." : "Keep the two different-suit objective cards hidden from the defenders.", mapId === "super-carrier" ? "Mantenha ocultos dos alemães os dois objetivos com naipes e valores de figura diferentes." : "Mantenha as duas cartas de objetivo de naipes diferentes ocultas dos alemães."),
      setupTask("sniper-objectives-return", "Return the other seven objective cards for this map to the box.", "Devolva à caixa as outras sete cartas de objetivo deste mapa.")
    );
    if (mapId === "super-carrier") {
      sniperTasks.push(
        setupTask("sniper-objectives-face-return", "If both drawn Super Carrier objective cards have the same face-card value, return one of your choice to the bottom of the deck.", "Se os dois objetivos do Super Carrier tiverem o mesmo valor de figura, devolva um deles ao fundo do baralho.", true),
        setupTask("sniper-objectives-face-redraw", "Draw a replacement and repeat until the two face-card values differ; the suit on each card identifies its matching board icon.", "Compre uma substituta e repita até os valores das figuras serem diferentes; o naipe identifica o ícone correspondente no tabuleiro.", true)
      );
    }
    phases.push({
      title: t("Prepare sniper objectives", "Prepare os objetivos do sniper"),
      refs: [["core", 4], ["core", 7], currentMap().reference],
      items: sniperTasks.splice(0)
    });

    sniperTasks.push(
      setupTask("sniper-bag-fill", "Put the starting aim, noise, and recoil tokens in the shot bag: base sniper uses 6 aim, 2 noise, and 3 recoil; an ally uses the counts printed on its card. Load it out of sight for Ghost Sniper.", "Coloque no saco as fichas iniciais de mira, ruído e recuo: o sniper base usa 6 miras, 2 ruídos e 3 recuos; um aliado usa as quantidades impressas na própria carta. Em Ghost Sniper, carregue o saco fora de vista."),
      setupTask("sniper-bag-mix", "Mix the shot bag after loading it.", "Misture o saco de disparo depois de colocar as fichas."),
      setupTask("sniper-bag-reserve-aim", "Set aside unused aim tokens as reserve; the base sniper leaves 5 aim tokens. With an ally, use the counts on its card. Keep the reserve hidden in Ghost Sniper.", "Deixe as miras não usadas como reserva; o sniper base deixa 5 miras. Com um aliado, siga a quantidade da carta. Oculte a reserva em Ghost Sniper."),
      setupTask("sniper-bag-reserve-noise", "Set aside unused noise tokens as reserve; the base sniper leaves 7 noise tokens. With an ally, use the counts on its card. Keep the reserve hidden in Ghost Sniper.", "Deixe os ruídos não usados como reserva; o sniper base deixa 7 ruídos. Com um aliado, siga a quantidade da carta. Oculte a reserva em Ghost Sniper."),
      setupTask("sniper-bag-return-recoil", "Return unused recoil tokens to the box; the base sniper returns 4. With an ally, return every recoil token not required by its card.", "Devolva os recuos não usados à caixa; o sniper base devolve 4. Com um aliado, devolva todos os recuos que a carta não exigir.")
    );
    phases.push({
      title: t("Prepare the shot bag", "Prepare o saco de disparo"),
      refs: [["core", 6], ["core", 13], ...(isSelected("eagle") ? [["eagle", 3]] : [])],
      items: sniperTasks.splice(0)
    });
    sniperTasks.push(setupTask("sniper-loadout-core-pool", "Build the pool from the 10 core loadout cards: two copies each of Sound Masking, S-Mine, Silenced Ammo, and Distraction; one copy each of Tommy Gun and Trench Gun.", "Monte a reserva com as 10 cartas de equipamento base: duas cópias de Sound Masking, S-Mine, Silenced Ammo e Distraction; uma cópia de Tommy Gun e Trench Gun."));
    if (isSelected("eagle")) {
      const hasElevatedSpaces = ["submarine-pens", "heavy-water"].includes(mapId);
      const hasWaterSpaces = ["launch-facility", "submarine-pens", "heavy-water"].includes(mapId);
      sniperTasks.push(setupTask("sniper-loadout-eagle-pool", "Add the six Eagle's Nest loadout cards: two copies each of Knife, Diving Gear, and Climbing Gear.", "Acrescente as seis cartas de equipamento de Eagle's Nest: duas cópias de Knife, Diving Gear e Climbing Gear."));
      sniperTasks.push(setupTask("sniper-climbing-gear-filter", hasElevatedSpaces ? "Keep Climbing Gear; this map has elevated spaces." : "Remove Climbing Gear; this map has no elevated spaces.", hasElevatedSpaces ? "Mantenha Climbing Gear; este mapa tem espaços elevados." : "Retire Climbing Gear; este mapa não tem espaços elevados."));
      sniperTasks.push(setupTask("sniper-diving-gear-filter", hasWaterSpaces ? "Keep Diving Gear; this map has water spaces." : "Remove Diving Gear; this map has no water spaces.", hasWaterSpaces ? "Mantenha Diving Gear; este mapa tem água." : "Retire Diving Gear; este mapa não tem espaços de água."));
    }
    if (isSelected("kraken") && mapId === "super-carrier") {
      sniperTasks.push(setupTask("sniper-loadout-kraken-pool", "Add Explosive Entrance and Bolt Cutters to the loadout pool; these two cards are for the Super Carrier.", "Acrescente Explosive Entrance e Bolt Cutters à reserva; essas duas cartas são para o Super Carrier."));
    }
    if (isSelected("escalation")) {
      sniperTasks.push(setupTask("sniper-loadout-under-curfew", "If Under Curfew was selected for Norman Village, add Bolt Cutters to the pool before choosing starting loadouts.", "Se Under Curfew foi escolhida para Norman Village, adicione Bolt Cutters à reserva antes de escolher os equipamentos iniciais.", true));
      sniperTasks.push(setupTask("sniper-select-upgrade-cards", "For each Upgraded Loadout edge, choose its specific upgraded card. Bayonet is only available if Eagle's Nest is in the game.", "Para cada opção Upgraded Loadout, escolha a carta melhorada específica. Bayonet só está disponível se Eagle's Nest estiver em jogo.", true));
      sniperTasks.push(setupTask("sniper-remove-basic-upgrade", "For each chosen upgrade, remove one matching non-upgraded card from the game; if the base card has two copies, remove only one.", "Para cada melhoria escolhida, retire do jogo uma carta base correspondente; se houver duas cópias, retire apenas uma.", true));
      sniperTasks.push(setupTask("sniper-add-upgraded-cards", "Add each chosen upgraded loadout card to the loadout pool.", "Acrescente cada equipamento melhorado escolhido à reserva.", true));
      sniperTasks.push(setupTask("sniper-hide-upgraded-identities", "Keep the identities of the selected upgraded cards hidden; only the number of upgrades chosen is announced.", "Mantenha em segredo a identidade das cartas melhoradas; somente a quantidade escolhida é anunciada.", true));
    }
    phases.push({
      title: t("Prepare loadout cards", "Prepare as cartas de equipamento"),
      refs: [["core", 4], ["core", 7], ["core", 15], ...(isSelected("eagle") ? [["eagle", 8]] : []), ...(isSelected("kraken") ? [["kraken", 3]] : []), ...(isSelected("escalation") ? [["escalation", 12], ["escalation", 13]] : [])],
      items: sniperTasks.splice(0)
    });
    sniperTasks.push(
      setupTask("sniper-choose-starting-loadouts", "Choose exactly three starting loadout cards.", "Escolha exatamente três cartas de equipamento iniciais."),
      setupTask("sniper-loadout-extra-edges", "If Extra Loadout edges were chosen, increase the starting-card limit by one per edge: three plus the selected extras.", "Se escolheu Extra Loadout, aumente o limite de cartas iniciais em uma por opção: três mais as extras escolhidas.", true),
      setupTask("sniper-choose-extra-loadouts", "Choose the additional starting card for each Extra Loadout edge.", "Escolha a carta inicial adicional de cada opção Extra Loadout.", true),
      setupTask("sniper-loadout-duplicates", "You may select both copies when a loadout has two; never choose more copies than the pool contains.", "Você pode escolher as duas cópias quando houver; nunca escolha mais cópias do que existem na reserva."),
      setupTask("sniper-hide-loadouts", "Keep the identities of all selected starting loadouts, including extra cards, hidden from the defenders.", "Mantenha em segredo dos alemães a identidade de todos os equipamentos iniciais escolhidos, inclusive os extras."),
      setupTask("sniper-form-loot-deck", "Shuffle every unused loadout card face down to make the loot deck.", "Embaralhe todas as cartas de equipamento não escolhidas, viradas para baixo, para formar a pilha de saque.")
    );
    phases.push({
      title: t("Choose starting loadouts", "Escolha os equipamentos iniciais"),
      refs: [["core", 4], ["core", 7], ["core", 15], ...(isSelected("escalation") ? [["escalation", 13]] : [])],
      items: sniperTasks.splice(0)
    });

    const defenderTasks = [
      setupTask("defender-sort-squads", "Sort the 3 officers and 6 soldiers into the black, red, and yellow squads by their base colors.", "Separe os 3 oficiais e 6 soldados nos esquadrões preto, vermelho e amarelo pelas cores das bases."),
      setupTask("defender-place-officers", "Place each officer on the Iron Cross starting space matching its squad color.", "Coloque cada oficial no espaço inicial da Cruz de Ferro da cor do seu esquadrão."),
      setupTask("defender-place-soldiers", "Place each soldier on a starting circle matching its squad color that does not have an Iron Cross.", "Coloque cada soldado em um círculo inicial da cor do seu esquadrão que não tenha Cruz de Ferro."),
      setupTask("defender-choose-specialists", "Choose three specialist cards, one per squad. If you selected an Elite Specialist edge, choose that elite card instead of its matching basic card.", "Escolha três cartas de especialista, uma por esquadrão. Se escolheu Elite Specialist, escolha a carta elite no lugar da carta base correspondente."),
      ...(isSelected("escalation")
        ? [setupTask("defender-remove-basic-elite", "If an elite specialist was chosen, remove its non-elite card from the game.", "Se um especialista elite foi escolhido, retire do jogo sua carta não elite.", true)]
        : []),
      setupTask("defender-assign-specialists", "Assign one selected specialist card to each squad.", "Atribua uma carta de especialista escolhida a cada esquadrão."),
      setupTask("defender-reveal-specialists", "Place all three assigned specialist cards face up where the sniper can see them.", "Deixe as três cartas de especialista atribuídas visíveis ao sniper."),
      setupTask("defender-specialist-suppression", "Put one suppression token on each of the three chosen specialist cards.", "Coloque uma ficha de supressão em cada uma das três cartas de especialista escolhidas."),
      setupTask("defender-specialist-cubes", "Put two action cubes matching each specialist's squad color on that specialist card.", "Coloque dois cubos de ação da cor de cada esquadrão na carta de especialista correspondente."),
      setupTask("defender-dog-tokens", "Take the two dog tokens only if Kennel Master (including Elite Koyote) is in play; otherwise return them to the box.", "Pegue as duas fichas de cão somente se Kennel Master (incluindo Koyote elite) estiver em jogo; caso contrário, devolva-as à caixa.")
    ];
    phases.push({
      title: t("Set up the defenders", "Prepare os alemães"),
      refs: [["core", 4], ["core", 8], ["core", 9], ...(isSelected("escalation") ? [["escalation", 14], ["escalation", 15]] : [])],
      items: defenderTasks
    });

    const afterSpecialists = [];
    if (isSelected("escalation")) {
      afterSpecialists.push(setupTask("mission-flares", "If Flares was selected, place one flare token on each specialist card after assigning specialists.", "Se Flares foi escolhida, coloque um sinalizador em cada carta de especialista depois de atribuí-los.", true));
      afterSpecialists.push(setupTask("advantage-tipped-off", "If Tipped Off was selected for the Super Carrier, lock any two doors after choosing specialists.", "Se Tipped Off foi escolhida para o Super Carrier, tranque duas portas quaisquer depois de escolher os especialistas.", true));
      if (mapId === "norman-village") {
        afterSpecialists.push(setupTask("advantage-under-curfew-doors", "If Under Curfew was selected, place all 11 door tokens open-side up on doorways of your choice.", "Se Under Curfew foi escolhida, coloque as 11 fichas de porta com o lado aberto em portas à sua escolha.", true));
      }
    }
    if (afterSpecialists.length) {
      phases.push({
        title: t("Finish setup for selected defender missions", "Termine a preparação das missões dos alemães"),
        refs: [["escalation", 10], ["escalation", 16], ["escalation", 17]],
        items: afterSpecialists
      });
    }

    const finalTasks = [
      setupTask("countdown-place-cubes", "Put the six remaining squad action cubes on space 10 of the countdown track; if Accelerated Schedule was selected, use space 7 instead.", "Coloque os seis cubos de ação restantes dos esquadrões no espaço 10 da trilha; se Accelerated Schedule foi escolhida, use o espaço 7."),
      setupTask("countdown-wound-marker", "Place the wound marker on its full side in the circular space on the countdown board.", "Coloque o marcador de ferida com o lado íntegro para cima no círculo do tabuleiro de contagem."),
      setupTask("countdown-hunter-cube", "If Call the Hunter is in play, put its white action cube on space 10 too, or space 7 if Accelerated Schedule was selected.", "Se Call the Hunter estiver em jogo, coloque também o cubo branco no espaço 10, ou no espaço 7 se Accelerated Schedule foi escolhida.", true),
      setupTask("start-legal-entrance", mapId === "super-carrier" ? "Enter through the Super Carrier's single printed entrance." : "Choose a printed entrance in a sector that contains neither objective.", mapId === "super-carrier" ? "Entre pela única entrada indicada no Super Carrier." : "Escolha uma entrada indicada em um setor que não contenha nenhum dos objetivos."),
      setupTask("start-record-position", "Secretly mark the chosen starting space on the hidden board.", "Marque em segredo a posição inicial escolhida no tabuleiro oculto."),
      setupTask("start-sniper-turn", "The sniper takes the first turn. Their first action must be movement onto the board through the chosen entrance.", "O sniper começa. Sua primeira ação deve ser mover-se para o tabuleiro pela entrada escolhida.")
    ];
    phases.push({
      title: t("Set the timer and start play", "Ajuste a contagem e comece"),
      refs: [["core", 4], ["core", 5], ...(isSelected("escalation") ? [["escalation", 11]] : [])],
      items: finalTasks
    });
    return phases;
  }

  function setupComponentInventory() {
    const cards = [
      {
        label: t("CORE · SHARED", "BASE · COMPARTILHADO"),
        title: t("Board, map decks & countdown", "Tabuleiro, cartas de mapa e contagem"),
        items: [
          t("1 double-sided main board; use only the side for the selected map.", "1 tabuleiro principal dupla face; use somente o lado do mapa escolhido."),
          t("2 hidden boards and 18 objective cards for the two core maps; use only the matching hidden board and that map's set of 9 objective cards.", "2 tabuleiros ocultos e 18 objetivos para os dois mapas base; use apenas o tabuleiro oculto correspondente e o conjunto de 9 cartas do mapa escolhido."),
          t("1 countdown/solo board and 1 wound marker; use the countdown side.", "1 tabuleiro de contagem/solo e 1 marcador de ferida; use o lado da contagem.")
        ],
        ref: ["core", 3]
      },
      {
        label: t("CORE · SNIPER", "BASE · SNIPER"),
        title: t("Private player kit", "Material do jogador Sniper"),
        items: [
          t("1 Sniper miniature, 1 shot bag, 1 dry-erase marker, and 1 Sniper player aid.", "1 miniatura do Sniper, 1 saco de disparo, 1 marcador apagável e 1 ajuda de jogador do Sniper."),
          t("30 shot tokens total: 11 aim, 7 recoil, 9 noise, and 3 suppression.", "30 fichas de disparo no total: 11 de mira, 7 de recuo, 9 de ruído e 3 de supressão."),
          t("10 core loadout cards: two copies each of Sound Masking, S-Mine, Silenced Ammo and Distraction; one copy each of Tommy Gun and Trench Gun.", "10 cartas de equipamento base: duas cópias de Sound Masking, S-Mine, Silenced Ammo e Distraction; uma cópia de Tommy Gun e Trench Gun.")
        ],
        ref: ["core", 3]
      },
      {
        label: t("CORE · DEFENDERS", "BASE · ALEMÃES"),
        title: t("Three squads", "Três esquadrões"),
        items: [
          t("9 miniatures: 6 soldiers and 3 officers; 9 bases, with 3 in each squad color.", "9 miniaturas: 6 soldados e 3 oficiais; 9 bases, sendo 3 de cada cor de esquadrão."),
          t("12 action cubes (4 per squad), 10 tracking cubes, and 1 Defender player aid.", "12 cubos de ação (4 por esquadrão), 10 cubos de rastreamento e 1 ajuda de jogador dos Defensores."),
          t("6 specialist cards; choose 3 for a game. Use 3 suppression tokens, one per selected specialist.", "6 cartas de especialista; escolha 3 para a partida. Use 3 fichas de supressão, uma por especialista escolhido."),
          t("2 dog tokens, only when the Kennel Master specialist is used.", "2 fichas de cão, somente quando Kennel Master for usado.")
        ],
        ref: ["core", 3]
      }
    ];
    if (isSelected("eagle")) {
      cards.push({
        label: "EAGLE'S NEST",
        title: t("Allied operations kit", "Material das operações aliadas"),
        items: [
          t("1 double-sided map, 2 hidden boards, and 18 objective cards covering Heavy Water and Eagle's Nest; use the matching side and its 9-card set.", "1 tabuleiro dupla face, 2 tabuleiros ocultos e 18 objetivos para Heavy Water e Eagle's Nest; use o lado correspondente e seu conjunto de 9 cartas."),
          t("4 allied sniper cards and miniatures; an allied sniper replaces the base miniature.", "4 cartas e miniaturas de snipers aliados; o aliado substitui a miniatura base."),
          t("6 new loadout cards: two copies each of Knife, Diving Gear, and Climbing Gear. The 12 solo cards are not used in multiplayer.", "6 cartas de equipamento novas: duas cópias de Knife, Diving Gear e Climbing Gear. As 12 cartas solo não são usadas no multijogador.")
        ],
        ref: ["eagle", 2]
      });
    }
    if (isSelected("kraken")) {
      cards.push({
        label: "OPERATION KRAKEN",
        title: t("Carrier and vehicle kit", "Material do porta-aviões e veículos"),
        items: [
          t("1 double-sided map, 2 hidden boards, and 18 objective cards for Norman Village and Super Carrier; use the selected map's side and 9-card set.", "1 tabuleiro dupla face, 2 tabuleiros ocultos e 18 objetivos para Norman Village e Super Carrier; use o lado escolhido e seu conjunto de 9 cartas."),
          t("11 door tokens for Super Carrier; 2 vehicle miniatures and 2 vehicle cards for Norman Village.", "11 fichas de porta para Super Carrier; 2 miniaturas e 2 cartas de veículo para Norman Village."),
          t("2 new loadout cards for Super Carrier. The 21 solo cards are not used in multiplayer.", "2 equipamentos novos para Super Carrier. As 21 cartas solo não são usadas no multijogador.")
        ],
        ref: ["kraken", 3]
      });
    }
    if (isSelected("escalation")) {
      cards.push({
        label: "ESCALATION · SPECIAL OPS",
        title: t("Optional mission components", "Componentes opcionais de missão"),
        items: [
          t("1 Good Boy miniature; 1 Hunter miniature with white base; 1 deployment-zone marker; 1 white action cube.", "1 miniatura Good Boy; 1 miniatura Hunter com base branca; 1 marcador de zona de implantação; 1 cubo branco de ação."),
          t("5 difficult-terrain tokens and 3 flare tokens.", "5 fichas de terreno difícil e 3 sinalizadores."),
          t("7 advantages; 7 upgraded loadouts (Advanced Sound Masking, Major Distraction, Modified Tommy Gun, Armour-piercing Rounds, Trip Mines, Bayonet, Panzerfaust); 6 elite specialists; and 2 missions for each side.", "7 vantagens; 7 equipamentos melhorados (Advanced Sound Masking, Major Distraction, Modified Tommy Gun, Armour-piercing Rounds, Trip Mines, Bayonet, Panzerfaust); 6 especialistas elite; e 2 missões para cada lado.")
        ],
        ref: ["escalation", 4],
        refExtra: ["escalation", 5]
      });
    }
    return `<div class="component-stack">${cards.map((card) => `
      <article class="info-card">
        <span class="component-label">${card.label}</span>
        <h3>${card.title}</h3>
        <ul class="component-list">${card.items.map((item) => `<li>${item}</li>`).join("")}</ul>
        ${referenceLink(card.ref[0], card.ref[1])}${card.refExtra ? ` ${referenceLink(card.refExtra[0], card.refExtra[1])}` : ""}
      </article>`).join("")}</div>`;
  }

  function setupSection() {
    const phases = setupChecklistPhases();
    const allTasks = phases.flatMap((phase) => phase.items);
    const validIds = new Set(allTasks.map((item) => item.id));
    const validChecks = state.setupChecks.filter((id) => validIds.has(id));
    if (validChecks.length !== state.setupChecks.length) {
      state.setupChecks = validChecks;
      saveState();
    }
    const requiredCount = allTasks.filter((item) => !item.optional).length;
    const checkedRequired = allTasks.filter((item) => !item.optional && state.setupChecks.includes(item.id)).length;
    const phaseMarkup = phases.map((phase, index) => `
      <article class="setup-phase">
        <header class="setup-phase-header">
          <span class="setup-phase-number">${String(index + 1).padStart(2, "0")}</span>
          <h3>${phase.title}</h3>
          <div class="setup-phase-references">${phase.refs.map(([book, page]) => referenceLink(book, page)).join("")}</div>
        </header>
        <ul class="setup-check-list">${phase.items.map((item) => `
          <li class="setup-check-row${item.optional ? " optional" : ""}">
            <input id="setup-check-${item.id}" type="checkbox" data-setup-check="${item.id}" ${state.setupChecks.includes(item.id) ? "checked" : ""}>
            <label for="setup-check-${item.id}">${item.text}${item.optional ? `<span class="setup-optional-label">${t("If selected", "Se escolhida")}</span>` : ""}</label>
          </li>`).join("")}</ul>
      </article>`).join("");
    const mapNotes = mapSetupNotes();

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), "03", "core", 4)}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Set up this game", "Prepare esta partida")}</h3>
            <p>${t("Check each physical step as it is completed. Checklist progress is saved in this browser.", "Marque cada etapa física conforme for concluída. O progresso fica salvo neste navegador.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${checkedRequired} of ${requiredCount} required steps checked`, `${checkedRequired} de ${requiredCount} etapas obrigatórias concluídas`)}</span>
            <progress id="setup-progress" max="${Math.max(requiredCount, 1)}" value="${checkedRequired}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t("Changing the selected map or expansion clears this checklist. “Uncheck all” clears only these boxes, not your map, expansions, language, or team. Optional card-specific tasks do not count toward required progress.", "Trocar o mapa ou as expansões limpa esta checklist. “Desmarcar tudo” limpa apenas estas caixas, sem alterar mapa, expansões, idioma ou lado. Etapas opcionais de cartas específicas não entram no progresso obrigatório.")}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this configuration", "Componentes desta configuração")}</h3>
      ${setupComponentInventory()}
      <h3 class="subhead">${t("Map rules to confirm before play", "Regras do mapa para conferir antes de jogar")}</h3>
      <div class="map-notes-grid">${mapNotes.map(([title, body]) => `<article class="map-note"><span class="map-label">${t("MAP RULE", "REGRA DO MAPA")}</span><h3>${title}</h3><p>${body}</p></article>`).join("")}</div>
      <div class="source-note">${t("This is a multiplayer setup. Solo-only decks, die, and solo rules are not used.", "Esta é uma preparação para multijogador. Baralhos, dado e regras exclusivos do solo não são usados.")}</div>`;
  }

  function victorySection() {
    const timer = isSelected("escalation")
      ? `<li>${t("If the Accelerated Schedule advantage is selected, the sniper has only seven turns to complete each objective.", "Se Accelerated Schedule estiver selecionada, o sniper tem apenas sete turnos para completar cada objetivo.")}</li>`
      : "";
    const hunter = isSelected("escalation")
      ? `<li>${t("Calling the Hunter changes a squad's turn, not the core win condition; the Hunter can also attack and wound the sniper.", "Chamar o Hunter altera o turno de um esquadrão, não a condição de vitória base; o Hunter também pode atacar e ferir o sniper.")}</li>`
      : "";
    return `
      ${sectionHeading("victory", t("Victory", "Vitória"), "04", "core", 9)}
      <div class="victory-grid">
        <article class="victory-card sniper"><h3>${t("Sniper · win", "Sniper · vence")}</h3><ul>
          <li>${t("Immediately complete the second objective by revealing its card while on the matching numbered space.", "Complete imediatamente o segundo objetivo revelando a carta no espaço numerado correspondente.")}</li>
          <li>${t("Lose immediately after receiving a second wound.", "Perde imediatamente ao receber a segunda ferida.")}</li>
          <li>${t("Lose if, at the end of your turn, every defender countdown cube is on the final space; include the Hunter's white cube if he is in play. They win if all are still there at the start of their next turn.", "Perde se, ao fim do seu turno, todos os cubos de contagem dos alemães estiverem no espaço final; inclua o cubo branco do Hunter se estiver em jogo. Eles vencem se todos ainda estiverem ali no início do próximo turno deles.")}</li>
          ${timer}
        </ul></article>
        <article class="victory-card defenders"><h3>${t("Defenders · win", "Alemães · vencem")}</h3><ul>
          <li>${t("Wound the sniper twice with successful attacks; the second wound ends the game immediately.", "Firam o sniper duas vezes com ataques bem-sucedidos; a segunda ferida encerra a partida imediatamente.")}</li>
          <li>${t("Or keep the sniper from completing an objective until the countdown condition is met.", "Ou impeçam o sniper de completar um objetivo até cumprir a condição da contagem.")}</li>
          ${hunter}
        </ul></article>
      </div>
      ${isSelected("escalation") ? `<div class="source-note">${referenceLink("escalation", 16)} ${referenceLink("escalation", 11)}</div>` : ""}`;
  }

  const baseLoadouts = [
    ["Sound Masking", "Mascaramento de som", "Ignore negative effects from moving two or three spaces this turn; reveal this card at game end.", "Ignore os efeitos negativos de mover dois ou três espaços neste turno; revele esta carta ao fim da partida."],
    ["S-Mine", "Mina S", "Secretly mark your current space on the hidden board. If an enemy unit ends its movement there, kill it, reveal this card, and remove the mark.", "Marque em segredo seu espaço atual no tabuleiro oculto. Se uma unidade inimiga terminar o movimento ali, elimine-a, revele esta carta e remova a marca."],
    ["Silenced Ammo", "Munição silenciosa", "Reveal before shooting. For this shot, noise tokens count as recoil; five or more recoil tokens still cause a misfire.", "Revele antes de atirar. Neste disparo, ruídos contam como recuo; cinco ou mais recuos ainda causam falha."],
    ["Distraction", "Distração", "Reveal before using. Move one enemy unit up to two spaces; it must have line of sight when it ends its movement.", "Revele antes de usar. Mova uma unidade inimiga até dois espaços; ela precisa estar na linha de visão ao terminar o movimento."],
    ["Tommy Gun", "Tommy Gun", "Reveal before shooting. Shoot one extra time this turn. Announce both draw amounts before the first shot; keep the first draw out of the bag until the second shot, then resolve all noise.", "Revele antes de atirar. Faça um disparo extra neste turno. Anuncie as duas quantidades antes do primeiro disparo; não devolva a primeira compra ao saco antes do segundo, e só então resolva todos os ruídos."],
    ["Trench Gun", "Trench Gun", "Reveal before shooting. Do not draw from the bag: reveal your position, then kill all units in your space and matching-adjacent spaces. Do not add tokens to the bag.", "Revele antes de atirar. Não compre fichas: revele sua posição e elimine todas as unidades no seu espaço e nos adjacentes do mesmo tipo. Não adicione fichas ao saco."]
  ];

  const defenderActions = [
    ["Move 2", "Mova até 2 espaços. Pode atravessar defensores, mas não terminar no espaço deles. Ao entrar em terreno difícil, o máximo cai para 1 espaço e o movimento deve começar adjacente."],
    ["Attack", "Ataque o espaço atual da unidade. Se o sniper estiver ali, ele coloca a miniatura no espaço, recebe uma ferida e o marcador de ferida é atualizado."],
    ["Spot", "Verifique um espaço adjacente, inclusive para dentro/fora de áreas fechadas ou elevadas. Se encontrar o sniper, ele coloca a miniatura ali e adiciona um ruído ao saco."],
    ["Sweep", "Verifique o espaço da unidade e dois espaços adjacentes do mesmo tipo (aberto/fechado/elevado). O sniper só confirma se está em um deles, sem dizer qual."],
    ["Deploy officer", "Retorne o oficial removido ao espaço inicial com a Cruz de Ferro da cor dele; não coloque dois defensores no mesmo espaço."],
    ["Deploy soldier", "Se o oficial estiver no próprio setor, coloque um soldado removido em um espaço livre adjacente do mesmo tipo ao oficial. Pode ser em outro setor; o soldado pode agir depois se restarem ações."],
    ["Dismiss", "Retire uma unidade de qualquer espaço do tabuleiro; ela não pode ser reimplantada neste turno."]
  ];

  function defenderActionTitle(name) {
    const titles = {
      "Move 2": t("Move up to 2", "Mover até 2"),
      Attack: t("Attack", "Atacar"),
      Spot: "Spot",
      Sweep: "Sweep",
      "Deploy officer": t("Deploy officer", "Implantar oficial"),
      "Deploy soldier": t("Deploy soldier", "Implantar soldado"),
      Dismiss: t("Dismiss", "Retirar")
    };
    return titles[name];
  }

  function alliedSnipers() {
    if (!isSelected("eagle")) return "";
    const allies = [
      ["Roza", "Roza", "4 mira · 3 ruído · 2 recuo. No máximo cinco fichas por disparo; portanto, alcance de até cinco espaços."],
      ["Jun", "Jun", "6 mira · 2 ruído · 2 recuo. Um disparo bem-sucedido também elimina unidades adjacentes do mesmo tipo que o espaço do alvo, sem exigir linha de visão até elas; cada unidade extra adiciona ruído em vez de mira/supressão."],
      ["Karl", "Karl", "7 mira · 2 ruído · 1 recuo. Pode atirar duas vezes em vez de mover; se o alvo estiver a até dois espaços, adiciona ruído após cada disparo."],
      ["Major Eazy", "Major Eazy", "3 mira · 3 ruído · 3 recuo. Ruído também conta como mira; cinco ou mais ruídos + recuos ainda causam falha."]
    ];
    return `
      <div class="turn-block"><h3>${t("Allied sniper cards", "Cartas de snipers aliados")}</h3>
        <div class="action-grid">${allies.map(([en, pt, desc]) => `<article class="action-card"><strong>${state.language === "pt-BR" ? pt : en}</strong><p>${state.language === "pt-BR" ? desc : translateAlly(en)}</p></article>`).join("")}</div>
        <div class="callout">${t(
          "<strong>Karl with Tommy Gun or Trench Gun:</strong> using either card replaces one of his shots that turn; he is still limited to one loadout card per turn.",
          "<strong>Karl com Tommy Gun ou Trench Gun:</strong> usar uma dessas cartas substitui um dos disparos dele naquele turno; ele continua limitado a uma carta de equipamento por turno."
        )}</div>
        <div class="callout">${t(
          "<strong>Optional variant · Ghost Sniper:</strong> secretly draw one allied card and load the bag out of sight; keep the unused token supply hidden. Reveal the card when the special ability is used, the sniper's position is revealed for any reason, an objective is completed, or defenders find the sniper with Spot/Attack. Take the matching miniature from the box; place it on the board if the position was revealed, otherwise beside the revealed card.",
          "<strong>Variante opcional · Ghost Sniper:</strong> compre uma carta de aliado em segredo e carregue o saco fora de vista; mantenha escondidas as fichas não usadas. Revele a carta quando usar a habilidade especial, quando a posição do sniper for revelada por qualquer motivo, ao completar um objetivo ou quando os alemães o encontrarem com Spot/Ataque. Pegue a miniatura correspondente; coloque-a no tabuleiro se a posição foi revelada, caso contrário ao lado da carta."
        )}</div>${referenceLink("eagle", 8)}
      </div>`;
  }

  function translateAlly(name) {
    const en = {
      Roza: "4 aim · 3 noise · 2 recoil. Draw no more than five tokens per shot, so her maximum range is five spaces.",
      Jun: "6 aim · 2 noise · 2 recoil. A successful shot also removes matching-adjacent units without requiring line of sight to them; each extra unit adds noise instead of aim/suppression.",
      Karl: "7 aim · 2 noise · 1 recoil. May shoot twice instead of moving; if a target is within two spaces, add noise after each shot.",
      "Major Eazy": "3 aim · 3 noise · 3 recoil. Noise also counts as aim; five or more noise + recoil still causes a misfire."
    };
    return en[name];
  }

  function escalationTurns(forTeam) {
    if (!isSelected("escalation")) return "";
    const missions = [
      ["Sniper · Killshot", "sniper", "Choose a non-armoured defender crossed by line of sight as the secondary target. With a successful shot and 0–1 recoil, remove both targets; with 2+ recoil, you may remove only the secondary target instead. Apply normal shot-bag changes for each target removed."],
      ["Sniper · Good Boy", "sniper", "Once per game, immediately before or after moving, mark a matching-adjacent space with G on the hidden board. On each later turn, the dog may move one space; whenever it does, defenders hear noise as if the sniper had made a noisy move, but are not told who moved. If Spot/Sweep finds the dog, reveal and place its miniature; add no bag token. It cannot be attacked and cannot move on the turn after it is revealed."],
      ["Defenders · Flares", "defenders", "Once per defenders' turn, the team may fire one flare without spending an action (including on a squad turn that gathers intel). Choose an officer whose specialist card still has a flare token; place it in an open space within two spaces and line of sight of that officer. At the start of the sniper's turn, if they are in an open space within two spaces of a flare, they announce this and add one recoil, but do not identify the space. Remove that flare from the game whether or not it affected the sniper."],
      ["Defenders · Call the Hunter", "defenders", "Adds a fourth squad consisting of one armoured Hunter, controlled jointly by the defenders. Each defenders' turn, he may take one action: Move 2 (up to two spaces); Move 1 & Spot (optionally move one, then Spot an adjacent space); Move 1 & Attack (optionally move one, then attack his current space); Deploy (if off the board, return him to the deployment-zone token); or Dismiss (remove him from anywhere). He cannot gather intel. Another squad may call him instead of taking actions or intel by advancing both of its cubes one space; the Hunter can immediately take an action he has not used that turn. Armour 2 requires at least three aim to hit him."]
    ];
    const cards = missions.filter(([, side]) => side === forTeam);
    return `
      <div class="turn-block"><h3>${t("Escalation mission cards (if selected)", "Cartas de missão Escalation (se escolhidas)")}</h3>
        <div class="mission-list">${cards.map(([name, side, body]) => `<article class="mission-card"><div><span class="mission-side">${t("Mission card · if selected", "Carta de missão · se escolhida")}</span><h3>${state.language === "pt-BR" ? name.replace("Defenders", "Alemães") : name}</h3></div><p>${state.language === "pt-BR" ? translateMissionPt(name) : body}</p></article>`).join("")}</div>
        ${forTeam === "defenders" ? `<div class="callout">${t(
          "If Call the Hunter is selected, move its white countdown cube one space when the Hunter takes or passes his one action, just like the other action cubes. Reset it with the others when an objective is completed.",
          "Se Call the Hunter foi escolhida, avance o cubo branco de contagem uma casa quando o Hunter agir ou passar, como os demais cubos. Reinicie-o junto com os outros ao completar um objetivo."
        )}</div>` : ""}
        ${forTeam === "sniper"
          ? `${referenceLink("escalation", 8)} ${referenceLink("escalation", 9)}`
          : `${referenceLink("escalation", 10)} ${referenceLink("escalation", 11)}`}
        <div class="callout">${t(
          "<strong>Other Special Ops choices:</strong> upgraded loadouts replace their base card; Extra Loadout grants one more starting card each; elite specialists replace their non-elite version; advantages are map-limited.",
          "<strong>Outras escolhas Special Ops:</strong> equipamentos melhorados substituem a carta base; Extra Loadout concede mais uma carta inicial; especialistas elite substituem a versão normal; vantagens dependem do mapa."
        )}</div>
      </div>`;
  }

  function translateMissionPt(name) {
    const pt = {
      "Sniper · Killshot": "Escolha como alvo secundário um defensor sem blindagem atravessado pela linha de visão. Com acerto e 0–1 recuo, elimine os dois alvos; com 2+ recuos, você pode eliminar apenas o secundário. Aplique ao saco as mudanças normais de cada alvo eliminado.",
      "Sniper · Good Boy": "Uma vez por partida, imediatamente antes ou depois de mover, marque com G no tabuleiro oculto um espaço adjacente do mesmo tipo. Em cada turno futuro, o cão pode mover um espaço; sempre que mover, os alemães ouvem ruído como se o sniper tivesse feito movimento ruidoso, sem saber quem se moveu. Se Spot/Sweep encontrar o cão, revele e coloque sua miniatura; não adicione ficha ao saco. Ele não pode ser atacado nem mover no turno depois de ser revelado.",
      "Defenders · Flares": "Uma vez por turno dos alemães, o grupo pode disparar um sinalizador sem gastar ação (inclusive num turno de esquadrão que reúna informação). Escolha um oficial cuja carta ainda tenha uma ficha de sinalizador; coloque-a em espaço aberto a até dois espaços e em linha de visão desse oficial. No início do turno do sniper, se ele estiver em espaço aberto a até dois do sinalizador, deve declarar isso e adicionar um recuo, sem revelar o espaço. Remova o sinalizador mesmo se não afetar o sniper.",
      "Defenders · Call the Hunter": "Adiciona um quarto esquadrão com um Hunter blindado, controlado em conjunto pelos alemães. A cada turno, ele pode fazer uma ação: Mover 2 (até dois espaços); Mover 1 + Spot (mova até um e use Spot adjacente); Mover 1 + Atacar (mova até um e ataque seu espaço atual); Implantar (se estiver fora do tabuleiro, retorne à ficha de zona de implantação); ou Retirar (remova-o de qualquer espaço). Ele não pode reunir informação. Outro esquadrão pode chamá-lo em vez de agir/reunir informação, avançando os dois cubos uma casa; então o Hunter pode fazer imediatamente uma ação ainda não usada no turno. Blindagem 2 exige no mínimo três miras para acertá-lo."
    };
    return pt[name];
  }

  function expansionLoadouts() {
    let html = "";
    if (isSelected("eagle")) {
      const mapId = currentMap().id;
      const hasElevatedSpaces = ["submarine-pens", "heavy-water"].includes(mapId);
      const hasWaterSpaces = ["launch-facility", "submarine-pens", "heavy-water"].includes(mapId);
      const list = [
        ["Knife", "Reveal this card and your position before using it. Immediately kill a defender in your space and add one aim token to the bag; you may still move and take an extra action this turn.", "Revele esta carta e sua posição antes de usá-la. Elimine imediatamente um defensor no seu espaço e adicione uma mira ao saco; ainda pode mover e realizar uma ação extra neste turno."],
        ...(hasWaterSpaces ? [["Diving Gear", "Move through water spaces this turn. You forfeit every non-movement action and cannot end your turn in water. Reveal this card at game end.", "Mova-se através de espaços de água neste turno. Abra mão de todas as ações que não sejam movimento e não termine o turno na água. Revele esta carta ao fim da partida."]] : []),
        ...(hasElevatedSpaces ? [["Climbing Gear", "If you move exactly one space, you may cross between an elevated and an open space without an access point. You cannot use it when moving two or three spaces. Reveal this card at game end.", "Se mover exatamente um espaço, pode cruzar entre um espaço elevado e um aberto sem acesso indicado. Não pode usar se mover dois ou três espaços. Revele esta carta ao fim da partida."]] : [])
      ];
      html += `<div class="turn-block"><h3>${t("Eagle's Nest loadouts", "Equipamentos de Eagle's Nest")}</h3><div class="action-grid">${list.map(([name, en, pt]) => `<article class="action-card"><strong>${name}</strong><p>${state.language === "pt-BR" ? pt : en}</p></article>`).join("")}</div>${referenceLink("eagle", 8)}</div>`;
    }
    if (isSelected("kraken") && currentMap().id === "super-carrier") {
      const list = [
        ["Explosive Entrance", "Reveal this card and your position before using it. Use your action to place the explosive entrance on a wall bordering your current space; it becomes a doorway for the rest of the game. Super Carrier only.", "Revele esta carta e sua posição antes de usá-la. Use sua ação para colocar a entrada explosiva numa parede adjacente; ela vira uma porta pelo resto da partida. Exclusiva do Super Carrier."],
        ["Bolt Cutters", "Secretly mark a locked door in your space. You may cross it while locked. If a defender unlocks it, reveal this card and cross the door; defenders may lock it again normally.", "Marque em segredo uma porta trancada no seu espaço. Você pode atravessá-la enquanto estiver trancada. Se um defensor a destrancar, revele esta carta e atravesse a porta; os defensores podem trancá-la novamente normalmente."]
      ];
      html += `<div class="turn-block"><h3>${t("Operation Kraken loadouts", "Equipamentos de Operation Kraken")}</h3><div class="action-grid">${list.map(([name, en, pt]) => `<article class="action-card"><strong>${name}</strong><p>${state.language === "pt-BR" ? pt : en}</p></article>`).join("")}</div>${referenceLink("kraken", 3)}</div>`;
    }
    if (isSelected("kraken") && isSelected("escalation") && currentMap().id === "norman-village") {
      html += `<div class="turn-block"><h3>${t("Under Curfew · extra loadout if selected", "Under Curfew · equipamento extra se escolhida")}</h3><div class="action-grid">
        <article class="action-card"><strong>Bolt Cutters</strong><p>${t("Under Curfew adds this card to the loadout deck before the sniper chooses starting cards. It lets the sniper secretly mark a locked door and cross it while locked; if a defender unlocks that door, reveal the card and cross through.", "Under Curfew adiciona esta carta à pilha antes de o sniper escolher os equipamentos iniciais. Ela permite marcar em segredo uma porta trancada e atravessá-la; se um defensor destrancar essa porta, revele a carta e atravesse.")}</p></article>
      </div>${referenceLink("escalation", 17)}</div>`;
    }
    if (isSelected("escalation")) {
      const list = [
        ["Advanced Sound Masking", "Move up to four and alert normally, or move up to three without alerting.", "Mova até quatro espaços e alerte normalmente, ou até três sem alertar."],
        ["Major Distraction", "Move up to two spaces total, split between two different enemy units if desired; no line of sight is required.", "Mova até dois espaços no total, divididos entre duas unidades inimigas diferentes se desejar; não exige linha de visão."],
        ["Modified Tommy Gun", "Temporarily add two aim tokens before shooting twice, then return those tokens before resolving bag changes.", "Adicione temporariamente duas miras antes dos dois disparos; depois devolva-as antes de resolver mudanças no saco."],
        ["Armour-piercing Rounds", "Shoot into/through buildings and improve hit chance; noise does not become recoil. Draw a random loadout after use.", "Atire para dentro/através de edifícios e facilite o acerto; ruído não vira recuo. Compre um equipamento aleatório após usar."],
        ["Trip Mines", "Replaces S-Mine: use its placement and trigger rules. When triggered, it kills any soldiers in matching-adjacent spaces to where it was placed.", "Substitui S-Mine: use as regras de colocação e ativação dela. Quando ativada, elimina soldados em espaços adjacentes do mesmo tipo ao local onde foi colocada."],
        ...(isSelected("eagle")
          ? [["Bayonet", "Requires Eagle's Nest because it replaces Knife. Use the Knife effect: reveal your position, kill a defender in your space, and add one aim. After using Bayonet, you may play one more loadout card this turn; Bayonet cannot be used twice in the same turn.", "Exige Eagle's Nest porque substitui Knife. Use o efeito de Knife: revele sua posição, elimine um defensor no seu espaço e adicione uma mira. Depois de usar Bayonet, pode jogar mais uma carta de equipamento neste turno; não pode usar Bayonet duas vezes no mesmo turno."]]
          : []),
        ["Panzerfaust", "Replaces Trench Gun: reveal your position and, without drawing from the bag, kill all units in one adjacent space and its matching-adjacent spaces. Add no tokens to the bag.", "Substitui Trench Gun: revele sua posição e, sem comprar fichas, elimine todas as unidades em um espaço adjacente e nos espaços adjacentes do mesmo tipo. Não adicione fichas ao saco."]
      ];
      html += `<div class="turn-block"><h3>${t("Escalation loadout upgrades", "Melhorias de equipamento Escalation")}</h3><div class="callout">${t("Each listed effect applies only if that specific upgraded card was selected during setup.", "Cada efeito abaixo só vale se aquela carta melhorada específica foi escolhida na preparação.")}${!isSelected("eagle") ? t(" Bayonet is unavailable without Eagle's Nest because it replaces Knife.", " Bayonet não está disponível sem Eagle's Nest, pois substitui Knife.") : ""}</div><div class="action-grid">${list.map(([name, en, pt]) => `<article class="action-card"><strong>${name}</strong><p>${state.language === "pt-BR" ? pt : en}</p></article>`).join("")}</div>${referenceLink("escalation", 12)} ${referenceLink("escalation", 13)}</div>`;
    }
    return html;
  }

  function mapActionRules() {
    const id = currentMap().id;
    if (id === "super-carrier") {
      return `<div class="turn-block"><h3>${t("Super Carrier · defender actions", "Super Carrier · ações dos defensores")}</h3><div class="action-grid">
        <article class="action-card"><strong>${t("Lock / unlock", "Trancar / destrancar")}</strong><p>${t("During a move action, a unit may lock or unlock a door in its space. Each change costs one of that action's two movement steps and may happen before or after moving.", "Durante a ação de movimento, uma unidade pode trancar/destrancar uma porta no próprio espaço. Cada mudança custa um dos dois passos e pode ocorrer antes ou depois de mover.")}</p></article>
        <article class="action-card"><strong>${t("Intel by level", "Informação por nível")}</strong><p>${t("The officer must be on the level being checked. The sniper declares whether they are on that level. In a turn, choose sectors or levels—not both.", "O oficial deve estar no nível verificado. O sniper declara se está nesse nível. No turno, escolha setores ou níveis, nunca ambos.")}</p></article>
        <article class="action-card"><strong>${t("Cross-level links", "Conexões entre níveis")}</strong><p>${t("Matching ladders connect only their paired spaces for movement, noise, Spot and line of sight; they are not matching-adjacent for Sweep. Air ducts connect only paired spaces for sniper movement/line of sight, not noise; defenders are not adjacent through them. No other cross-level movement or sight is allowed.", "Escadas correspondentes conectam apenas os pares para movimento, ruído, Spot e visão; não contam para Sweep. Dutos conectam apenas os pares para movimento/visão do sniper, não ruído; defensores não são adjacentes através deles. Não há outros movimentos nem linhas de visão entre níveis.")}</p></article>
        <article class="action-card"><strong>${t("Doorway line of sight", "Visão através de portas")}</strong><p>${t("From a space containing a doorway, trace as if standing on its far side. If line of sight reaches an unlocked doorway, you may target only the space immediately beyond it. You can trace through two doorways only when starting at the first doorway and targeting the space immediately beyond the second; locked doors block the line.", "De um espaço com porta, trace como se estivesse do outro lado. Se a linha alcançar uma porta destrancada, mire apenas no espaço logo depois dela. Só é possível atravessar duas portas quando a linha começa na primeira e o alvo está imediatamente após a segunda; portas trancadas bloqueiam a linha.")}</p></article>
        <article class="action-card"><strong>${t("Face-card objectives", "Objetivos de figuras")}</strong><p>${t("If both drawn objective cards have the same face value, return one to the bottom and draw again. The suit identifies the matching icon on the board.", "Se os dois objetivos comprados tiverem o mesmo valor de figura, devolva um ao fundo e compre outro. O naipe identifica o ícone correspondente no tabuleiro.")}</p></article>
      </div></div>`;
    }
    const mechanisedHeavyWater = id === "heavy-water" && isSelected("escalation") && isSelected("kraken");
    if (id === "norman-village" || mechanisedHeavyWater) {
      return `<div class="turn-block"><h3>${mechanisedHeavyWater ? t("Mechanisation · vehicle actions (if selected)", "Mechanisation · ações de veículo (se escolhida)") : t("Norman Village · vehicle actions", "Norman Village · ações de veículo")}</h3><div class="action-grid">
        <article class="action-card"><strong>${t("Drive 3", "Dirigir 3")}</strong><p>${t("Move up to three road spaces; may pass through units/vehicles but cannot end on one.", "Mova até três espaços de estrada; pode passar por unidades/veículos, mas não terminar neles.")}</p></article>
        <article class="action-card"><strong>${t("Drive 1 + Sweep / Spot", "Dirigir 1 + Sweep / Spot")}</strong><p>${t("Optionally move one road space, then Sweep the vehicle space plus two matching-adjacent spaces, or Spot one adjacent space.", "Opcionalmente mova um espaço de estrada e depois faça Sweep no espaço do veículo e dois espaços adjacentes do mesmo tipo, ou use Spot em um espaço adjacente.")}</p></article>
        <article class="action-card"><strong>${t("Attack adjacent", "Atacar adjacente")}</strong><p>${t("Attack one adjacent space and wound the sniper if present.", "Ataque um espaço adjacente e fira o sniper se ele estiver ali.")}</p></article>
        <article class="action-card"><strong>${t("Armour 2", "Blindagem 2")}</strong><p>${t("The sniper needs two extra aim tokens over the normal requirement, minimum three. A successful shot removes the vehicle and any passenger; apply the usual bag change for a killed soldier/officer, but none for the vehicle itself. It never returns.", "O sniper precisa de duas miras além do necessário, no mínimo três. Um disparo bem-sucedido remove o veículo e o passageiro; aplique a mudança normal no saco por soldado/oficial eliminado, mas nenhuma pelo veículo. Ele não retorna.")}</p></article>
      </div><div class="callout">${t(
        "Only units embarked in a vehicle may take vehicle actions. They may also take normal unit actions. The same unit cannot repeat an action, but it may combine different vehicle actions. Immediate-kill loadouts do not affect vehicles or passengers; empty vehicles are not alerted by sniper movement.",
        "Somente unidades embarcadas podem fazer ações de veículo. Elas também podem fazer ações normais. A mesma unidade não pode repetir uma ação, mas pode combinar ações de veículo diferentes. Equipamentos de eliminação imediata não afetam veículos nem passageiros; veículos vazios não são alertados pelo movimento do sniper."
      )} ${mechanisedHeavyWater
        ? t("Use the Mechanisation advantage and the Heavy Water road/start diagram.", "Use a vantagem Mechanisation e o diagrama de estradas/início de Heavy Water.")
        : ""}</div>${mechanisedHeavyWater ? referenceLink("escalation", 19) : referenceLink("kraken", 4)}</div>`;
    }
    return "";
  }

  function sniperVehicleRules() {
    const mapId = currentMap().id;
    const mechanisedHeavyWater = mapId === "heavy-water" && isSelected("escalation") && isSelected("kraken");
    if (mapId !== "norman-village" && !mechanisedHeavyWater) return "";
    return `<div class="turn-block"><h3>${mechanisedHeavyWater ? t("Mechanisation · sniper rules (if selected)", "Mechanisation · regras do sniper (se escolhida)") : t("Norman Village · sniper rules", "Norman Village · regras do sniper")}</h3>
      ${mechanisedHeavyWater ? `<div class="callout">${t("These rules apply only if the Mechanisation advantage was selected.", "Estas regras só se aplicam se a vantagem Mechanisation foi escolhida.")}</div>` : ""}
      <div class="action-grid">
        <article class="action-card"><strong>${t("Armour 2", "Blindagem 2")}</strong><p>${t("Shoot at a vehicle using normal shot rules, but need two extra aim tokens over the normal requirement, minimum three. A hit removes the vehicle and any passenger. Add the usual bag token for a killed soldier/officer, none for the vehicle; it never returns.", "Atire no veículo pelas regras normais, mas precisa de duas miras além do requisito normal, no mínimo três. Um acerto remove o veículo e o passageiro. Adicione a ficha normal por soldado/oficial eliminado, nenhuma pelo veículo; ele não retorna.")}</p></article>
        <article class="action-card"><strong>${t("Vehicles and movement", "Veículos e movimento")}</strong><p>${t("You may enter a space with an unoccupied vehicle, but not an occupied one. An embarked defender counts as being in the vehicle's space for noisy movement; an empty vehicle is not alerted.", "Você pode entrar no espaço de um veículo vazio, mas não no de um ocupado. Um defensor embarcado conta no espaço do veículo para movimento ruidoso; veículos vazios não são alertados.")}</p></article>
        <article class="action-card"><strong>${t("Loadout limits", "Limites dos equipamentos")}</strong><p>${t("Immediate-kill loadouts have no effect on vehicles or embarked units. Movement effects such as Distraction may force a defender to disembark as part of that movement, but cannot move a vehicle.", "Equipamentos de eliminação imediata não afetam veículos nem unidades embarcadas. Efeitos de movimento como Distraction podem forçar um defensor a desembarcar durante o movimento, mas não movem veículos.")}</p></article>
      </div>${mechanisedHeavyWater ? referenceLink("escalation", 19) : referenceLink("kraken", 4)}</div>`;
  }

  function specialistNotes() {
    const elites = isSelected("escalation")
      ? `<div class="callout">${t(
          "<strong>Elite specialists:</strong> Their elite card replaces the basic version. A gold-band passive ability can be used every turn, even after both normal uses are spent, but never while its officer is off the board. Sennenhund protects soldiers (not officers) from other squads in matching-adjacent spaces and has armour 2; Spürhund lets a soldier he moved take non-attack actions that turn and moves a squadmate when gathering intel; Kobra attacks up to two spaces away in line of sight; Schakal may move before his ability (the deployed soldier cannot attack) and can dismiss any squad's unit without an action (but not redeploy it that turn); Adler spots up to three spaces away in line of sight; Koyote places dogs in matching-adjacent spaces, alerts them on sniper movement into/through/adjacent to them, and lets them move/spot/sweep using squad actions.",
          "<strong>Especialistas elite:</strong> A carta elite substitui a versão base. A habilidade passiva na faixa dourada pode ser usada todo turno, mesmo depois de esgotadas as duas utilizações normais, mas nunca se o oficial estiver fora do tabuleiro. Sennenhund protege soldados (não oficiais) de outros esquadrões em espaços adjacentes do mesmo tipo e tem blindagem 2; Spürhund permite ao soldado movido fazer ações que não sejam ataque nesse turno e move um companheiro ao reunir informação; Kobra ataca a até dois espaços em linha de visão; Schakal pode mover antes da habilidade (o soldado implantado não pode atacar) e pode retirar sem ação uma unidade de qualquer esquadrão (sem reimplantá-la no mesmo turno); Adler usa Spot a até três espaços em linha de visão; Koyote coloca cães em espaços adjacentes do mesmo tipo, alerta-os se o sniper entrar, atravessar ou ficar adjacente a eles, e permite que movam/usem Spot/Sweep gastando ações do esquadrão."
        )}</div>`
      : "";
    return `<div class="turn-block"><h3>${t("Specialist abilities", "Habilidades de especialista")}</h3><div class="callout">${t(
      "The six base specialist cards are Medic, Scout, Jager, Radio Operator, Sniper, and Kennel Master; each card contains its own ability text. Each officer's ability can be used twice per game, at most once per turn, and only while that officer is on the board; the officer does not need to be in their own sector. Different officers may use their abilities in the same turn. To use an ability, return one action cube from that specialist card to the box. Use it before or after an action/intel; if it modifies an action, declare it first. It does not grant an extra action. An effect that stops a specific unit from taking an action does not stop that squad from gathering intel; “soldier” effects do not apply to officers.",
      "As seis cartas de especialista base são Medic, Scout, Jager, Radio Operator, Sniper e Kennel Master; o texto da habilidade está impresso em cada carta. A habilidade de cada oficial pode ser usada duas vezes por partida, no máximo uma vez por turno, e só enquanto esse oficial estiver no tabuleiro; ele não precisa estar no próprio setor. Oficiais diferentes podem usar suas habilidades no mesmo turno. Para usar uma habilidade, devolva um cubo de ação daquela carta à caixa. Use antes ou depois de uma ação/informação; se modificar uma ação, declare primeiro. Ela não concede ação extra. Um efeito que impeça uma unidade específica de agir não impede o esquadrão de reunir informação; efeitos que citam soldados não se aplicam a oficiais."
    )}</div>${elites}${referenceLink("core", 9)}${isSelected("escalation") ? ` ${referenceLink("escalation", 14)} ${referenceLink("escalation", 15, t("Elite specialists · p. 15 ↗", "Especialistas elite · p. 15 (EN) ↗"))}` : ""}</div>`;
  }

  function escalationAdvantages() {
    if (!isSelected("escalation")) return "";
    const map = currentMap().id;
    const cards = [
      ["Accelerated Schedule", "Any map", "The sniper has only seven turns to complete each objective.", "Qualquer mapa", "O sniper tem apenas sete turnos para completar cada objetivo."],
      ...(map === "submarine-pens"
        ? [["Rapid Response", "Submarine Pens", "After the first objective, further worsen the shot bag by the amount shown on the card and replenish one use of each specialist (not those with both cubes still on their card).", "Submarine Pens", "Após o primeiro objetivo, piore ainda mais o saco conforme indicado na carta e recupere um uso de cada especialista (exceto os que ainda têm os dois cubos na carta)."]]
        : []),
      ...(map === "super-carrier"
        ? [["Tipped Off", "Super Carrier", "After choosing specialists, lock any two doors on the map.", "Super Carrier", "Após escolher especialistas, tranque duas portas quaisquer no mapa."]]
        : []),
      ...(map === "launch-facility"
        ? [["Roadblocks", "Launch Facility", "Turn four entrances and one additional space into difficult terrain. The fifth space must be open and not adjacent to other difficult spaces.", "Launch Facility", "Transforme quatro entradas e mais um espaço em terreno difícil. O quinto espaço deve ser aberto e não pode ser adjacente a outro terreno difícil."]]
        : []),
      ...(map === "norman-village"
        ? [["Under Curfew", "Norman Village", "Place all 11 door tokens open-side up on doorways. Units in vehicles cannot open/close doors; add Bolt Cutters to the loadout deck before selecting cards.", "Norman Village", "Coloque as 11 fichas de porta com o lado aberto em portas. Unidades em veículos não podem abrir/fechar portas; adicione Bolt Cutters à pilha antes de escolher equipamentos."]]
        : []),
      ...(map === "eagles-nest"
        ? [["Sentries", "Eagle's Nest", "The sniper must disclose their chosen entrance on the defenders' second turn.", "Eagle's Nest", "O sniper deve revelar a entrada escolhida no segundo turno dos alemães."]]
        : []),
      ...(map === "heavy-water"
        ? [[
            "Mechanisation",
            "Heavy Water",
            isSelected("kraken")
              ? "If selected, add the Norman Village vehicles and use the Heavy Water road/start-space diagram."
              : "Requires Operation Kraken. Enable that expansion to add the Norman Village vehicles to Heavy Water.",
            "Heavy Water",
            isSelected("kraken")
              ? "Se escolhida, adicione os veículos de Norman Village conforme o diagrama de estradas e início de Heavy Water."
              : "Exige Operation Kraken. Ative essa expansão para adicionar os veículos de Norman Village a Heavy Water."
          ]]
        : [])
    ];
    const page = map === "heavy-water" ? 19
      : (map === "launch-facility" || map === "norman-village" || map === "eagles-nest" ? 17 : 16);
    return `
      <div class="turn-block"><h3>${t("Map-specific advantages", "Vantagens específicas do mapa")}</h3>
        <div class="callout">${t("These are the available options for this map; only advantages selected during setup are in play.", "Estas são as opções disponíveis para este mapa; somente as vantagens escolhidas na preparação estão em jogo.")}</div>
        <div class="mission-list">${cards.map(([name, mapName, en, mapPt, pt]) => `<article class="mission-card"><div><span class="mission-side">${mapName}</span><h3>${name}</h3></div><p>${state.language === "pt-BR" ? pt : en}</p></article>`).join("")}</div>
        ${referenceLink("escalation", page)}
      </div>`;
  }

  function turnsSection() {
    const sniper = state.team === "sniper";
    const sniperMovementRule = isSelected("eagle") && ["submarine-pens", "heavy-water"].includes(currentMap().id)
      ? t(
          "Move once; do not split movement, enter a defender's space, or revisit a space this turn. Enter or leave enclosed/elevated spaces only through marked access points unless using Climbing Gear.",
          "Mova uma vez; não divida o movimento, entre no espaço de um defensor nem repita um espaço neste turno. Entre ou saia de espaços fechados/elevados apenas por acessos indicados, exceto ao usar Climbing Gear."
        )
      : t(
          "Move once; do not split movement, enter a defender's space, or revisit a space this turn. Enter or leave enclosed/elevated spaces only through marked access points.",
          "Mova uma vez; não divida o movimento, entre no espaço de um defensor nem repita um espaço neste turno. Entre ou saia de espaços fechados/elevados apenas por acessos indicados."
        );
    const sniperTurnSummary = isSelected("escalation")
      ? t(
          "Take at most one move and one extra action in any order; normally use no more than one loadout card. If Bayonet is the chosen upgrade, it permits one additional loadout after Bayonet. You may skip any option, but cannot repeat one. Your first action in the first turn must be a move onto the board.",
          "Faça no máximo um movimento e uma ação extra, em qualquer ordem; normalmente use no máximo uma carta de equipamento. Se Bayonet for a melhoria escolhida, ela permite mais uma carta depois de Bayonet. Pode pular opções, mas não repetir. A primeira ação do primeiro turno deve ser mover-se para o tabuleiro."
        )
      : t(
          "Take at most one move, one loadout card, and one extra action in any order; you may skip any of them, but cannot repeat another option. Your first action in the first turn must be a move onto the board.",
          "Faça no máximo um movimento, use uma carta de equipamento e realize uma ação extra, em qualquer ordem; pode pular qualquer uma, mas não repetir outra opção. A primeira ação do primeiro turno deve ser mover-se para o tabuleiro."
        );
    const sniperContent = `
      <div class="turn-block"><h3>${t("Sniper · turn options (any order)", "Sniper · opções do turno (qualquer ordem)")}</h3><div class="callout">${sniperTurnSummary}</div><div class="action-grid">
        <article class="action-card"><strong>${t("Move (0–3 spaces)", "Mover (0–3 espaços)")}</strong><p>${sniperMovementRule}</p><small>${t("0–1 spaces are silent. For 2–3, point out every defender adjacent to any space on the route, including start and end; they hear noise. Do not reveal route, distance, or alert order. Walls, enclosed/elevated spaces and terrain do not block sound; use map-specific links (for example, Super Carrier air ducts do not carry noise). Tracking cubes may mark alerted units.", "Mover 0–1 espaço é silencioso. Para 2–3, aponte cada defensor adjacente a qualquer espaço do trajeto, incluindo início e fim; eles ouvem o ruído. Não revele trajeto, distância nem ordem. Paredes, espaços fechados/elevados e terrenos não bloqueiam o som; siga as conexões específicas do mapa (por exemplo, dutos do Super Carrier não transmitem ruído). Cubos de rastreamento podem marcar unidades alertadas.")}</small><small>${t("If you enter difficult terrain, reduce your maximum movement by one (so you may move up to 2); start within two spaces. On Heavy Water, you may enter only one difficult space per turn.", "Ao entrar em terreno difícil, reduza seu movimento máximo em um (podendo mover até 2); comece a até dois espaços. Em Heavy Water, só se pode entrar em um terreno difícil por turno.")}</small></article>
        <article class="action-card"><strong>${t("One loadout card (optional)", "Uma carta de equipamento (opcional)")}</strong><p>${t("Each loadout grants a one-time ability unless its text says it returns to your hand. Play it before an affected move/action and reveal it at the card's stated timing. Cards cannot interrupt movement or an action. If a card replaces or modifies an action, it does not grant another action unless the card says so.", "Cada equipamento concede uma habilidade de uso único, salvo se o texto disser que retorna à mão. Jogue-o antes do movimento/ação afetado e revele no momento indicado. Cartas não interrompem movimento ou ação. Se uma carta modifica ou substitui uma ação, não concede outra salvo indicação explícita.")}</p></article>
        <article class="action-card"><strong>${t("One extra action (optional)", "Uma ação extra (opcional)")}</strong><p>${t("Choose one: Shoot a target in line of sight; Loot from a numbered space that is not one of your objectives; or complete the matching objective.", "Escolha uma: atirar em alvo na linha de visão; saquear em espaço numerado que não seja objetivo; ou completar o objetivo correspondente.")}</p></article>
        <article class="action-card"><strong>${t("Start and end of turn", "Início e fim do turno")}</strong><p>${t("At the start of your first turn, secretly mark your legal starting space on the hidden board. When your position is revealed, place the miniature on your current space and leave it there for the rest of the turn even if you move; it marks your last known position. At the start of your next turn, remove it if still on the board. At turn end, write the current countdown number in your current hidden-board space.", "No início do primeiro turno, marque em segredo sua posição inicial válida no tabuleiro oculto. Quando sua posição for revelada, coloque a miniatura no espaço atual e deixe-a ali pelo resto do turno, mesmo se você se mover; ela marca sua última posição conhecida. No início do próximo turno, retire-a se ainda estiver no tabuleiro. Ao fim do turno, anote o número atual da contagem no espaço atual do tabuleiro oculto.")}</p></article>
      </div></div>
      <div class="turn-block"><h3>${t("Shoot, loot & objective", "Atirar, saquear e objetivo")}</h3><div class="action-grid">
        <article class="action-card"><strong>${t("Shoot", "Atirar")}</strong><p>${t("Choose a target secretly; reveal the target only if hit. Count the shortest straight line in spaces (include target, not your own space), announce how many tokens you risk, then draw and show every token. Hit needs one aim per counted space; same-space targets need at least one. If noise drawn reaches 2 plus the number of suppression tokens drawn, reveal your position and place the miniature, even on a misfire. Return all drawn tokens after resolving the shot.", "Escolha o alvo em segredo; revele-o apenas se acertar. Conte a menor linha reta em espaços (inclua o alvo, não sua posição), anuncie quantas fichas arrisca, depois compre e mostre todas. Precisa de uma mira por espaço contado; no mesmo espaço, precisa de pelo menos uma. Se o ruído comprado atingir 2 mais a quantidade de supressões compradas, revele sua posição e coloque a miniatura, mesmo em caso de falha. Devolva ao saco todas as fichas depois de resolver o disparo.")}</p></article>
        <article class="action-card"><strong>${t("Loot", "Saquear")}</strong><p>${t("On a numbered space that is not one of your objectives, draw three loadouts and keep one. Return the other two and shuffle the deck. Mark that space on your hidden board; it cannot be looted again. Looting reveals that you are at a numbered space, but not which one.", "Em um espaço numerado que não seja um dos seus objetivos, compre três equipamentos e fique com um. Devolva os outros dois e embaralhe o baralho. Marque o espaço no tabuleiro oculto; não pode saquear ali novamente. Saquear revela que você está em um espaço numerado, mas não em qual.")}</p></article>
        <article class="action-card"><strong>${t("Complete objective", "Completar objetivo")}</strong><p>${t("Reveal the matching objective card, place the sniper miniature on the space, add one noise token and reset all defender countdown cubes (including the Hunter's, if in play) to 10 or 7 with Accelerated Schedule.", "Revele a carta correspondente, coloque a miniatura no espaço, adicione uma ficha de ruído e reinicie todos os cubos de contagem dos alemães (inclusive o do Hunter, se estiver em jogo) em 10 ou 7 com Accelerated Schedule.")}</p></article>
        <article class="action-card"><strong>${t("Bag changes", "Mudanças no saco")}</strong><p>${t("Kill soldier: add aim. Kill officer: add their specialist's suppression token, or aim if that token was already added. Completing an objective or being found by Spot adds noise. Maximums: 11 aim, 3 suppression, 9 noise; if that supply is exhausted, skip the addition.", "Eliminar soldado: adicione mira. Eliminar oficial: adicione a supressão do especialista ou mira se essa ficha já tiver sido adicionada. Completar objetivo ou ser encontrado por Spot adiciona ruído. Limites: 11 miras, 3 supressões e 9 ruídos; se acabar, não adicione ficha.")}</p></article>
      </div></div>
      <div class="turn-block"><h3>${t("Core loadout cards", "Equipamentos do jogo base")}</h3><div class="action-grid">${baseLoadouts.map(([en, pt, bodyEn, bodyPt]) => `<article class="action-card"><strong>${state.language === "pt-BR" ? pt : en}</strong><p>${state.language === "pt-BR" ? bodyPt : bodyEn}</p></article>`).join("")}</div></div>
      ${alliedSnipers()}${expansionLoadouts()}${escalationTurns("sniper")}${sniperVehicleRules()}`;

    const defendersContent = `
      <div class="turn-block"><h3>${t("Defenders · each squad", "Alemães · cada esquadrão")}</h3><div class="callout">${t(
        "Each of the three squads chooses either one intel action or two unit actions. Allocate actions in any order among squads. Advance that squad's cube for each action; unused actions are still marked as passes.",
        "Cada um dos três esquadrões escolhe reunir informação uma vez ou fazer duas ações de unidade. Distribua ações entre esquadrões em qualquer ordem. Avance o cubo a cada ação; ações não usadas também são marcadas como passe."
      )}</div><div class="action-grid">${defenderActions.map(([en, pt]) => `<article class="action-card"><strong>${defenderActionTitle(en)}</strong><p>${state.language === "pt-BR" ? pt : translateDefenderAction(en)}</p></article>`).join("")}</div></div>
      <div class="turn-block"><h3>${t("Intel & action limits", "Informação e limites de ação")}</h3><div class="action-grid">
        <article class="action-card"><strong>${t("Gather intel", "Reunir informação")}</strong><p>${t("For sector intel, the officer must be in their own sector; declare it and the sniper answers yes/no. On Super Carrier, the officer may be in any sector on the level being checked; the sniper answers whether they share that level. Gathering intel uses both squad actions, so advance both cubes; in one turn you may check multiple levels or multiple sectors, but not both types.", "Para consultar um setor, o oficial deve estar no próprio setor; declare-o e o sniper responde sim/não. No Super Carrier, o oficial pode estar em qualquer setor do nível consultado; o sniper responde se está no mesmo nível. Reunir informação usa as duas ações do esquadrão, então avance os dois cubos; num turno, consulte vários níveis ou vários setores, mas não os dois tipos.")}</p></article>
        <article class="action-card"><strong>${t("Same unit rule", "Regra por unidade")}</strong><p>${t("A squad may repeat an action using different units; one unit cannot take the same action twice in a turn. A deployed soldier may act later that turn if actions remain.", "O esquadrão pode repetir uma ação com unidades diferentes; a mesma unidade não pode repetir ação no turno. Um soldado implantado pode agir depois se restarem ações.")}</p></article>
        <article class="action-card"><strong>${t("Spot / Sweep result", "Resultado de Spot / Sweep")}</strong><p>${t("Spot reveals the exact space and adds noise if found. Sweep checks the unit's space plus two same-type adjacent spaces; the sniper answers only whether they are in that group.", "Spot revela o espaço exato e adiciona ruído se encontrar o sniper. Sweep verifica o espaço da unidade e dois adjacentes do mesmo tipo; o sniper responde apenas se está nesse grupo.")}</p></article>
        <article class="action-card"><strong>${t("Noise & hidden movement", "Ruído e movimento oculto")}</strong><p>${t("Hearing noise needs adjacency only; enclosed spaces and walls do not stop sound. If a defender moves into the sniper's space, the sniper does not have to reveal it and may move away on their turn normally.", "Ouvir ruído exige apenas adjacência; espaços fechados e paredes não bloqueiam som. Se um defensor entrar no espaço do sniper, ele não precisa revelar isso e pode sair normalmente no próprio turno.")}</p></article>
        <article class="action-card"><strong>${t("Defender player count", "Quantidade de jogadores defensores")}</strong><p>${t("One defender controls all squads; with two defenders, each controls one and they decide the third together; with three defenders, each controls one squad.", "Um defensor controla os três esquadrões; com dois, cada um controla um e decidem juntos o terceiro; com três, cada um controla um esquadrão.")}</p></article>
      </div></div>
      ${specialistNotes()}${mapActionRules()}${escalationTurns("defenders")}`;

    return `
      ${sectionHeading("turns", t("Turns", "Turnos"), "05", sniper ? "core" : "core", sniper ? 5 : 8)}
      <div class="panel-topline"><div><p class="eyebrow">${t("TURN SEQUENCE", "SEQUÊNCIA DE TURNO")}</p><p>${t("Switch sides to see the actions, limits and expansion rules that apply.", "Alterne o lado para ver ações, limites e regras das expansões.")}</p></div>${teamSwitch()}</div>
      ${sniper ? sniperContent : defendersContent}
      ${escalationAdvantages()}
      <div class="turn-block"><h3>${t("Line of sight at a glance", "Linha de visão em resumo")}</h3>
        <div class="callout">${t(
          "Trace a straight line from any edge of your space to any edge of the target. You may shoot into/out of an enclosed or elevated space, but not through it. From an enclosed space, see within that same enclosed area; from an elevated space, see other elevated spaces unless obstructed. Water does not block sight.",
          "Trace uma linha reta entre qualquer borda do seu espaço e qualquer borda do alvo. É possível atirar para dentro/fora de espaços fechados ou elevados, mas não atravessá-los. De um espaço fechado, vê-se a mesma área fechada; de um elevado, outros elevados salvo obstrução. Água não bloqueia visão."
        )}${isSelected("escalation") ? `<p>${t("Armour-piercing Rounds, if chosen, permits its stated exception for shooting into/through buildings; it does not override map rules that block actions through a wall.", "Armour-piercing Rounds, se escolhida, permite a exceção descrita para atirar para dentro/através de edifícios; não substitui regras do mapa que bloqueiem ações através de paredes.")}</p>` : ""}</div>
      </div>`;
  }

  function translateDefenderAction(name) {
    const en = {
      "Move 2": "Move up to two spaces. You may pass other defenders but may not end on their space. Entering difficult terrain reduces this action's maximum to one space, and you must start adjacent to enter it.",
      Attack: "Attack the unit's current space. If the sniper is there, reveal/place the miniature, deal one wound, and update the wound marker.",
      Spot: "Check one adjacent space, including into/out of enclosed or elevated spaces. If you find the sniper, they place the miniature there and add one noise token to the bag.",
      Sweep: "Check the unit's space and two adjacent spaces of the same type (open/enclosed/elevated). The sniper confirms presence but not which space.",
      "Deploy officer": "Return a removed officer to their matching Iron Cross starting space; no space may contain two defenders.",
      "Deploy soldier": "If the officer is in their own sector, place a removed soldier in a free same-type adjacent space. It may be in another sector and may act later if actions remain.",
      Dismiss: "Remove one of this squad's units from anywhere on the board; it cannot be redeployed this turn."
    };
    return en[name];
  }

  function examplesSection() {
    const examples = [
      {
        title: t("A noisy move narrows the search", "Um movimento ruidoso reduz a busca"),
        body: t("In the manual's illustrated example, two defenders adjacent to the route hear a two-space move, while a third does not. The pattern narrows possible sectors/entrances, but the defenders still learn neither direction nor distance.", "No exemplo ilustrado do manual, dois defensores adjacentes ao trajeto ouvem um movimento de dois espaços, enquanto um terceiro não. O padrão reduz os setores/entradas possíveis, mas os alemães não descobrem direção nem distância."),
        source: ["core", 5, t("Manual p. 5 ↗", "Manual p. 5 (EN) ↗")]
      },
      {
        title: t("A shot at range", "Um disparo à distância"),
        body: t("A target two spaces away needs two aim tokens. Drawing one aim, one noise and one recoil misses; one noise alone does not reveal the sniper, but tells defenders the target was more than one and no more than three spaces away. They still do not know who the target was. On a later shot, two aim can hit while two noise reveal the position; five or more noise + recoil would misfire regardless of aim.", "Um alvo a dois espaços exige duas miras. Comprar uma mira, um ruído e um recuo erra; um ruído sozinho não revela o sniper, mas informa que o alvo estava a mais de um e no máximo três espaços de distância. Os alemães ainda não sabem quem era o alvo. Depois, duas miras acertam, mas dois ruídos revelam; cinco ou mais ruídos + recuos causariam falha apesar das miras."),
        source: ["core", 7, t("Manual p. 7 ↗", "Manual p. 7 (EN) ↗")]
      },
      {
        title: t("An open shot stops at an enclosed space", "Um disparo de espaço aberto para no espaço fechado"),
        body: t("From an open space, the sniper can shoot through other open spaces and past a building, but cannot trace through an enclosed space to a target beyond it.", "De um espaço aberto, o sniper pode mirar através de outros espaços abertos e passar ao lado de um edifício, mas não pode atravessar um espaço fechado para atingir um alvo além dele."),
        source: ["core", 12, t("Manual p. 12 ↗", "Manual p. 12 (EN) ↗")]
      },
      {
        title: t("Inside a building, sight depends on enclosed spaces", "Dentro de um edifício, a visão depende dos espaços fechados"),
        body: t("A sniper in an enclosed space can see through the other spaces in the same enclosed area. They cannot trace through an enclosed space to an open target on the other side; a wall alone does not block a line that does not pass through an enclosed space.", "Um sniper em espaço fechado pode ver os demais espaços da mesma área fechada. Não pode atravessar um espaço fechado para atingir um alvo aberto do outro lado; a parede sozinha não bloqueia uma linha que não atravesse outro espaço fechado."),
        source: ["core", 12, t("Manual p. 12 ↗", "Manual p. 12 (EN) ↗")]
      },
      {
        title: t("An elevated position sees other elevated spaces", "De uma posição elevada, vê-se outros espaços elevados"),
        body: t("From an open space, a sniper can target defenders on the near edge of an elevated walkway, but not shoot through the elevated area. From elevated ground, they can target any elevated space unless an obstruction blocks the line; they cannot target open/enclosed spaces below.", "De um espaço aberto, o sniper pode mirar defensores na borda próxima de uma passarela elevada, mas não atirar através dela. De uma área elevada, pode mirar qualquer espaço elevado salvo obstrução; não pode mirar espaços abertos/fechados abaixo."),
        source: ["core", 13, t("Manual p. 13 ↗", "Manual p. 13 (EN) ↗")]
      },
      {
        title: t("Water is transparent; an obstruction is not", "Água é transparente; obstrução não"),
        body: t("In the manual's example, the sniper on a boat shoots across a water space at a defender on the walkway, needing two aim tokens. In a second example, a grey-X obstruction blocks the shot at the defender on the far side.", "No exemplo do manual, o sniper no barco atira através da água contra um defensor na passarela e precisa de duas miras. Em outro exemplo, uma obstrução X cinza bloqueia o disparo contra o defensor do outro lado."),
        source: ["core", 11, t("Manual p. 11 ↗", "Manual p. 11 (EN) ↗")]
      },
      {
        title: t("Sweep reports a group, not a precise space", "Sweep revela o grupo, não o espaço exato"),
        body: t("Sweep checks the defender's space and two same-type adjacent spaces. If the sniper is in that three-space group, they confirm presence but do not say which space.", "Sweep verifica o espaço do defensor e dois adjacentes do mesmo tipo. Se o sniper estiver nesse grupo de três espaços, confirma a presença, mas não diz qual espaço."),
        source: ["core", 9, t("Manual p. 9 ↗", "Manual p. 9 (EN) ↗")]
      }
    ];
    if (isSelected("eagle")) {
      examples.push({
        title: t("A hidden allied sniper is revealed", "Um sniper aliado oculto é revelado"),
        body: t("In Ghost Sniper, the identity stays secret until the ability is used, the sniper is revealed, an objective is completed, or a successful defender Spot/Attack finds them.", "Em Ghost Sniper, a identidade fica secreta até usar a habilidade, ser revelado, completar objetivo ou ser encontrado por Spot/Ataque dos defensores."),
        source: ["eagle", 8, t("Manual p. 8 ↗", "Manual p. 8 (EN) ↗")]
      });
    }
    if (isSelected("eagle") && currentMap().id === "eagles-nest") {
      examples.push({
        title: t("A reinforced wall stops a spot or shot", "Uma parede reforçada bloqueia Spot e disparos"),
        body: t("In Eagle's Nest, a defender or sniper cannot shoot or Spot through a reinforced wall. Noise can still be heard across it.", "Em Eagle's Nest, defensor e sniper não podem atirar nem usar Spot através de parede reforçada. O ruído ainda pode ser ouvido do outro lado."),
        source: ["eagle", 6, t("Manual p. 6 ↗", "Manual p. 6 (EN) ↗")]
      });
    }
    if (isSelected("kraken") && currentMap().id === "norman-village") {
      examples.push({
        title: t("Armour changes the shot", "A blindagem muda o disparo"),
        body: t("If a defender in a vehicle is targeted, add two aim tokens to the normal requirement, with a minimum of three. Destroying the vehicle also removes its passenger; the vehicle itself adds no bag token.", "Se o alvo estiver em veículo, some duas miras ao requisito normal, no mínimo três. Destruir o veículo também elimina o passageiro; o veículo não adiciona ficha ao saco."),
        source: ["kraken", 4, t("Manual p. 4 ↗", "Manual p. 4 (EN) ↗")]
      });
    }
    if (isSelected("kraken") && currentMap().id === "super-carrier") {
      examples.push({
        title: t("A door changes a sight line", "Uma porta altera a linha de visão"),
        body: t("A locked door blocks movement and line of sight. A successful normal shot removes its token permanently without adding a bag token. From a space containing a doorway, trace as if standing across it; you can pass a second unlocked doorway only to the space immediately beyond that second door.", "Uma porta trancada bloqueia movimento e visão. Um disparo normal bem-sucedido remove a ficha permanentemente sem adicionar ficha ao saco. De um espaço com porta, trace como se estivesse do outro lado; só se pode atravessar uma segunda porta destrancada até o espaço logo após ela."),
        source: ["kraken", 7, t("Manual p. 7 ↗", "Manual p. 7 (EN) ↗")]
      });
      examples.push({
        title: t("A face-card objective rules out a matching value", "Um objetivo de figura elimina outro de mesmo valor"),
        body: t("If the sniper completes the Queen of Spades objective in the yellow sector, the defenders know the red-sector Q cannot be the other objective.", "Se o sniper completar o objetivo de Dama de Espadas no setor amarelo, os alemães sabem que o Q do setor vermelho não pode ser o outro objetivo."),
        source: ["kraken", 6, t("Manual p. 6 ↗", "Manual p. 6 (EN) ↗")]
      });
    }
    if (isSelected("escalation")) {
      examples.push({
        title: t("Killshot secondary target", "Alvo secundário de Killshot"),
        body: t("A non-armoured defender crossed by the line can be selected as a secondary target. A successful hit with 0–1 recoil removes both and adds the normal bag token for each; with 2+ recoil, the sniper may remove only the secondary and add only that target's token.", "Um defensor sem blindagem atravessado pela linha pode ser escolhido como alvo secundário. Com acerto e 0–1 recuo, elimine ambos e adicione ao saco a ficha normal de cada um; com 2+ recuos, o sniper pode eliminar apenas o secundário e adicionar somente a ficha dele."),
        source: ["escalation", 8, t("Manual p. 8 ↗", "Manual p. 8 (EN) ↗")]
      });
      examples.push({
        title: t("Calling the Hunter uses the squad's turn", "Chamar o Hunter consome o turno do esquadrão"),
        body: t("The squad that calls the Hunter gives up its actions and intel, advances both action cubes, and lets the Hunter take one unused action immediately. The Hunter cannot gather intel.", "O esquadrão que chama o Hunter abre mão das ações e da informação, avança os dois cubos e permite que o Hunter faça imediatamente uma ação ainda não usada. O Hunter não pode reunir informação."),
        source: ["escalation", 11, t("Manual p. 11 ↗", "Manual p. 11 (EN) ↗")]
      });
    }
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), "06", "core", 5)}
      <div class="example-grid">${examples.map((example, index) => `
        <article class="example-card"><span class="card-number">${String(index + 1).padStart(2, "0")}</span><h3>${example.title}</h3><p>${example.body}</p>
          <div class="example-source"><span>${t("Worked example based on the manual", "Exemplo baseado no manual")}</span>${referenceLink(...example.source)}</div>
        </article>`).join("")}</div>
      <div class="source-note">${t(
        "Examples are paraphrased and consolidated here; use each page link to see the original diagrams and exact rule wording.",
        "Os exemplos foram resumidos e reunidos aqui; use os links para consultar os diagramas originais e o texto exato."
      )}</div>`;
  }

  function glossarySection() {
    const terms = [];
    const addTerm = (nameEn, namePt, definitionEn, definitionPt, references) => {
      terms.push({
        name: t(nameEn, namePt),
        definition: t(definitionEn, definitionPt),
        references
      });
    };
    const mapId = currentMap().id;

    addTerm(
      "Action cube",
      "Cubo de ação",
      "Colored defender marker. Each squad has two cubes on the countdown track and two on its specialist card; the latter track the officer's ability uses.",
      "Marcador colorido dos alemães. Cada esquadrão tem dois cubos na trilha de contagem e dois na carta de especialista; estes registram os usos da habilidade do oficial.",
      [["core", 4], ["core", 9]]
    );
    addTerm(
      "Countdown track",
      "Trilha de contagem",
      isSelected("escalation")
        ? "Tracks the defenders' time to stop each objective: normally 10 turns, or 7 if Accelerated Schedule is selected. Completing an objective resets the countdown for the next one."
        : "Tracks the defenders' time to stop each objective: 10 turns per objective. Completing an objective resets the countdown for the next one.",
      isSelected("escalation")
        ? "Registra o tempo dos alemães para impedir cada objetivo: normalmente 10 turnos, ou 7 se Accelerated Schedule for escolhida. Completar um objetivo reinicia a contagem para o próximo."
        : "Registra o tempo dos alemães para impedir cada objetivo: 10 turnos por objetivo. Completar um objetivo reinicia a contagem para o próximo.",
      [["core", 4], ["core", 7], ...(isSelected("escalation") ? [["escalation", 16]] : [])]
    );
    addTerm(
      "Hidden board",
      "Tabuleiro oculto",
      "A map-matched duplicate used by the sniper to secretly record their starting space, movement, and looted locations.",
      "Cópia correspondente do mapa usada pelo sniper para registrar em segredo a posição inicial, os movimentos e os locais saqueados.",
      [["core", 3], ["core", 5]]
    );
    addTerm(
      "Line of sight",
      "Linha de visão",
      "A straight line from any edge of your space to any edge of the target space. Enclosed/elevated spaces and obstructions block tracing through them; map rules and loadouts may add exceptions.",
      "Linha reta entre qualquer borda do seu espaço e qualquer borda do alvo. Espaços fechados/elevados e obstruções impedem traçar através deles; regras de mapa e equipamentos podem criar exceções.",
      [["core", 12]]
    );
    addTerm(
      "Loadout",
      "Equipamento",
      "A one-use special ability card for the sniper. They start with three cards and gain one by looting; normally, play no more than one per turn.",
      "Carta de habilidade de uso único do sniper. Ele começa com três cartas e ganha uma ao saquear; normalmente, joga no máximo uma por turno.",
      [["core", 7], ["core", 15]]
    );
    addTerm(
      "Matching-adjacent",
      "Adjacente do mesmo tipo",
      "Adjacent spaces of the same type as the unit's space: open, enclosed, or elevated. This is narrower than ordinary adjacency and is used by Sweep and some effects.",
      "Espaços adjacentes do mesmo tipo que o da unidade: aberto, fechado ou elevado. É mais restrito que adjacência comum e usado por Sweep e alguns efeitos.",
      [["core", 9], ["core", 10]]
    );
    addTerm(
      "Objective card",
      "Carta de objetivo",
      mapId === "super-carrier"
        ? "One of the nine cards for the selected map. Its number/value identifies an objective and its suit identifies the matching board icon; the sniper secretly keeps two cards with different suits and face values."
        : "One of the nine cards for the selected map. Its number identifies an objective space and its suit identifies the matching board icon; the sniper secretly keeps two cards with different suits.",
      mapId === "super-carrier"
        ? "Uma das nove cartas do mapa. O número/valor identifica um objetivo e o naipe identifica o ícone correspondente; o sniper mantém em segredo duas cartas com naipes e valores de figura diferentes."
        : "Uma das nove cartas do mapa. O número identifica um espaço de objetivo e o naipe identifica o ícone correspondente no tabuleiro; o sniper mantém duas cartas de naipes diferentes em segredo.",
      [["core", 7], ["core", 13], currentMap().reference]
    );
    addTerm(
      "Sector",
      "Setor",
      "A colored region of the map corresponding to a defender squad. Sectors matter for defender intel and for choosing a legal sniper entrance.",
      "Região colorida do mapa correspondente a um esquadrão defensor. Setores são usados para reunir informação e escolher uma entrada válida para o sniper.",
      [["core", 8], ["core", 11]]
    );
    addTerm(
      "Shot bag",
      "Saco de disparo",
      "The sniper's draw bag for shooting: aim tokens help hit, noise can reveal the sniper, recoil contributes to misfires, and suppression cancels noise for revealing.",
      "Saco de compra do sniper ao atirar: fichas de mira ajudam a acertar, ruído pode revelar o sniper, recuo contribui para falhas e supressão cancela ruído para efeito de revelação.",
      [["core", 6], ["core", 13]]
    );
    addTerm(
      "Specialist",
      "Especialista",
      "A card assigned face up to one defender squad and its officer. The ability text is on the card; a base ability has two uses and requires that officer to be on the board.",
      "Carta atribuída, visível, a um esquadrão defensor e seu oficial. O efeito está escrito na carta; a habilidade base tem dois usos e exige que o oficial esteja no tabuleiro.",
      [["core", 9], ["core", 13]]
    );
    addTerm(
      "Tracking cube",
      "Cubo de rastreamento",
      "One of the ten transparent shared markers defenders may use however they prefer to record possible sniper locations. It is not an action cube.",
      "Um dos dez marcadores transparentes compartilhados que os alemães podem usar como preferirem para registrar possíveis posições do sniper. Não é cubo de ação.",
      [["core", 8]]
    );
    addTerm(
      "Unit action",
      "Ação de unidade",
      "An action taken by one defender unit, such as Move, Attack, Spot, Sweep, Deploy, or Dismiss. A unit cannot repeat the same action in one turn.",
      "Ação feita por uma unidade defensora, como Mover, Atacar, Spot, Sweep, Implantar ou Retirar. Uma unidade não pode repetir a mesma ação no turno.",
      [["core", 8], ["core", 9]]
    );
    if (["launch-facility", "heavy-water"].includes(mapId)) {
      addTerm(
        "Difficult terrain",
        "Terreno difícil",
        "Entering one reduces maximum movement by one (sniper: up to 2 spaces; defenders: up to 1). On Heavy Water, only one difficult space may be entered per turn.",
        "Entrar nele reduz o movimento máximo em um (sniper: até 2 espaços; alemães: até 1). Em Heavy Water, só se pode entrar em um terreno difícil por turno.",
        mapId === "heavy-water" ? [["eagle", 4], ["core", 11]] : [["core", 11], ["core", 14]]
      );
    }

    if (isSelected("escalation")) {
      addTerm(
        "Advantage",
        "Vantagem",
        "An Escalation card chosen by the defenders. Accelerated Schedule works on any map; each other advantage is limited to its printed map and only selected advantages are in play.",
        "Carta Escalation escolhida pelos alemães. Accelerated Schedule vale em qualquer mapa; as demais vantagens se limitam ao mapa indicado e só as escolhidas estão em jogo.",
        [["escalation", 16], ["escalation", 17]]
      );
      addTerm(
        "Edge",
        "Opção (edge)",
        "A Special Ops choice from one side's list. Rank sets how many edges each side gets; an edge is a selection, not a token, and the same edge can be chosen more than once.",
        "Escolha Special Ops da lista de um dos lados. A patente define quantas opções cada lado recebe; edge é uma escolha, não uma ficha, e pode ser repetida.",
        [["escalation", 6], ["escalation", 7]]
      );
      addTerm(
        "Elite Specialist edge",
        "Edge de Elite Specialist",
        "Lets the defenders choose an elite specialist instead of its matching base specialist. Remove the non-elite card from the game.",
        "Permite aos alemães escolher um especialista elite no lugar do especialista base correspondente. Retire do jogo a carta não elite.",
        [["escalation", 7], ["escalation", 14]]
      );
      addTerm(
        "Extra Loadout edge",
        "Edge de Extra Loadout",
        "For each Extra Loadout edge selected, the sniper starts with one additional loadout card beyond the normal three. Choose the extra card during setup; it does not grant an extra turn action.",
        "Para cada edge de Extra Loadout escolhida, o sniper começa com uma carta de equipamento a mais que as três normais. Escolha a carta extra na preparação; ela não concede uma ação extra no turno.",
        [["escalation", 7], ["escalation", 13]]
      );
      addTerm(
        "Mission",
        "Missão",
        "An Escalation card that adds a special rule for one side. Announce it when selected, follow its setup instructions, and leave it face up for reference.",
        "Carta Escalation que acrescenta uma regra especial para um dos lados. Anuncie ao escolhê-la, siga sua preparação e deixe-a visível para consulta.",
        [["escalation", 7], ["escalation", 8], ["escalation", 10]]
      );
      addTerm(
        "Rank",
        "Patente",
        "The Special Ops difficulty setting: Private grants 1 edge per side, Corporal 2, and Sergeant 3.",
        "Nível de dificuldade de Special Ops: Soldado concede 1 edge por lado, Cabo 2 e Sargento 3.",
        [["escalation", 6]]
      );
      addTerm(
        "Special Ops",
        "Special Ops",
        "The optional Escalation mode that customizes a game with ranks, edges, missions, advantages, upgraded loadouts, and elite specialists.",
        "Modo opcional de Escalation que personaliza a partida com patentes, edges, missões, vantagens, equipamentos melhorados e especialistas elite.",
        [["escalation", 3], ["escalation", 6]]
      );
      addTerm(
        "Upgraded Loadout edge",
        "Edge de Upgraded Loadout",
        "Adds a selected upgraded card to the loadout pool and replaces one matching base card. Remove one base copy; if there were two, only one is removed. Bayonet requires Eagle's Nest because it replaces Knife.",
        "Acrescenta uma carta melhorada escolhida à reserva e substitui uma carta base correspondente. Retire uma cópia base; se houver duas, retire apenas uma. Bayonet exige Eagle's Nest porque substitui Knife.",
        [["escalation", 7], ["escalation", 12], ["escalation", 13]]
      );
    }
    if (isSelected("eagle")) {
      addTerm(
        "Allied Sniper",
        "Sniper aliado",
        "An Eagle's Nest character that replaces the base Sniper miniature and card. Use the aim/noise/recoil counts printed on the chosen card; its ability is mandatory unless the card says otherwise.",
        "Personagem de Eagle's Nest que substitui a miniatura e a carta do Sniper base. Use as quantidades de mira/ruído/recuo impressas na carta; a habilidade é obrigatória salvo indicação contrária.",
        [["eagle", 3]]
      );
      addTerm(
        "Ghost Sniper",
        "Ghost Sniper",
        "An optional Allied Sniper variant: the sniper identity, bag, and unused token supply stay hidden until one of the listed reveal conditions occurs.",
        "Variante opcional de Sniper aliado: identidade, saco e fichas não usadas ficam ocultos até ocorrer uma das condições de revelação indicadas.",
        [["eagle", 8]]
      );
    }
    if (mapId === "super-carrier" || (mapId === "norman-village" && isSelected("escalation"))) {
      addTerm(
        "Door token",
        "Ficha de porta",
        mapId === "super-carrier"
          ? "On Super Carrier, the unlocked side acts as a doorway; the locked side blocks movement and line of sight. A successful sniper shot removes the token permanently."
          : "If Under Curfew is selected, place the tokens unlocked-side up on Norman Village doorways; defenders can lock/unlock them during movement, except from vehicles.",
        mapId === "super-carrier"
          ? "No Super Carrier, o lado destrancado funciona como porta; o lado trancado bloqueia movimento e visão. Um disparo bem-sucedido do sniper remove a ficha permanentemente."
          : "Se Under Curfew for escolhida, coloque as fichas com o lado destrancado nas portas de Norman Village; os alemães podem trancá-las/destrancá-las ao mover, exceto de veículos.",
        mapId === "super-carrier" ? [["kraken", 6]] : [["escalation", 17], ["kraken", 6]]
      );
    }
    if (mapId === "norman-village" || isSelected("escalation")) {
      addTerm(
        "Armour 2",
        "Blindagem 2",
        "Adds two aim tokens to the normal hit requirement, with a minimum of three. It applies to vehicles and to the Hunter if Call the Hunter is in play.",
        "Adiciona duas miras ao requisito normal para acertar, no mínimo três. Vale para veículos e para o Hunter se Call the Hunter estiver em jogo.",
        [
          ...(mapId === "norman-village" || (mapId === "heavy-water" && isSelected("kraken")) ? [["kraken", 4]] : []),
          ...(mapId === "heavy-water" && isSelected("kraken") ? [["escalation", 19]] : []),
          ...(isSelected("escalation") ? [["escalation", 11]] : [])
        ]
      );
    }
    if (mapId === "norman-village" || (mapId === "heavy-water" && isSelected("escalation") && isSelected("kraken"))) {
      addTerm(
        "Embarked",
        "Embarcado",
        "A defender passenger is represented on the vehicle card instead of the map. They count as occupying the vehicle's space for noisy movement and may take vehicle actions.",
        "O passageiro defensor fica representado na carta do veículo, não no mapa. Conta como ocupante do espaço do veículo para movimento ruidoso e pode realizar ações de veículo.",
        [["kraken", 4]]
      );
      addTerm(
        "Vehicle",
        "Veículo",
        "Armoured defender unit in Norman Village, or in Heavy Water only if Mechanisation is selected. Vehicles move on roads, can carry one defender, and are permanently removed when destroyed.",
        "Unidade blindada dos alemães em Norman Village, ou em Heavy Water somente se Mechanisation for escolhida. Veículos movem-se nas estradas, transportam um defensor e são removidos permanentemente quando destruídos.",
        mapId === "norman-village" ? [["kraken", 4]] : [["kraken", 4], ["escalation", 19]]
      );
    }
    if (mapId === "heavy-water" && isSelected("escalation") && isSelected("kraken")) {
      addTerm(
        "Mechanisation",
        "Mechanisation",
        "A map-specific advantage that adds the Norman Village vehicles to Heavy Water; it requires both Eagle's Nest and Operation Kraken.",
        "Vantagem de mapa que acrescenta os veículos de Norman Village a Heavy Water; exige Eagle's Nest e Operation Kraken.",
        [["escalation", 17], ["escalation", 19]]
      );
    }
    if (mapId === "eagles-nest" || mapId === "super-carrier") {
      addTerm(
        "Reinforced wall",
        "Parede reforçada",
        mapId === "eagles-nest"
          ? "On Eagle's Nest, blocks shooting and Spot, but not noise."
          : "On Super Carrier, blocks actions and effects through it, but not noise.",
        mapId === "eagles-nest"
          ? "Em Eagle's Nest, bloqueia tiros e Spot, mas não o ruído."
          : "No Super Carrier, bloqueia ações e efeitos através dela, mas não o ruído.",
        mapId === "eagles-nest" ? [["eagle", 6]] : [["kraken", 7]]
      );
    }

    terms.sort((a, b) => a.name.localeCompare(b.name, state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), "07", "core", 13)}
      <p class="glossary-intro">${t("Short definitions for recurring rules terms. Expansion and map terms appear only when relevant to the current setup.", "Definições curtas de termos recorrentes. Termos de expansão e mapa aparecem somente quando são relevantes para a configuração atual.")}</p>
      <div class="quick-grid glossary-grid">${terms.map((item) => `
        <article class="info-card glossary-card"><span class="component-label">${t("TERM", "TERMO")}</span><h3>${item.name}</h3><p>${item.definition}</p>
          <div class="glossary-references">${item.references.map(([book, page]) => referenceLink(book, page)).join(" ")}</div>
        </article>`).join("")}</div>`;
  }

  function renderLanding() {
    return `
      ${renderHeader(false)}
      <section class="landing-hero"><div class="hero-inner">
        <p class="eyebrow">${t("A living library of board-game rules", "Biblioteca viva de regras de jogos")}</p>
        <h1>${t("Field Manual", "Manual de Campo")}</h1>
        <p class="hero-intro">${t(
          "Choose a game to open its interactive rulebook. Your campaign settings, maps and language stay ready for the next session.",
          "Escolha um jogo para abrir seu livro de regras interativo. Suas expansões, mapas e idioma ficam salvos para a próxima partida."
        )}</p>
        <a class="button-primary" href="#/sniper-elite">${t("Open Sniper Elite", "Abrir Sniper Elite")} <span aria-hidden="true">→</span></a>
      </div></section>
      <main class="page-wrap library-section">
        <div class="section-intro"><div><p class="eyebrow">${t("Game index", "Índice de jogos")}</p><h2>${t("Choose your battlefield", "Escolha seu campo de batalha")}</h2></div>
          <p>${t("This index is ready to grow. More games can be added as separate rulebooks without changing the Sniper Elite setup.", "Este índice está pronto para crescer. Outros jogos poderão entrar como livros separados, sem alterar a configuração de Sniper Elite.")}</p>
        </div>
        <div class="game-grid">
          <article class="game-card available"><span class="card-kicker">${t("Interactive rulebook · available", "Livro interativo · disponível")}</span><h3>Sniper Elite</h3><p>${t("Core game plus Eagle's Nest, Operation Kraken and Escalation. Choose your modules, map and playing side.", "Jogo base e expansões Eagle's Nest, Operation Kraken e Escalation. Escolha módulos, mapa e lado.")}</p><a class="button-primary" href="#/sniper-elite">${t("Open index", "Abrir índice")} <span aria-hidden="true">→</span></a></article>
          <article class="game-card coming-soon"><span class="card-kicker">${t("Future volume", "Próximo volume")}</span><h3>${t("Next rulebook", "Próximo livro")}</h3><p>${t("A place for the next game in the collection.", "Espaço reservado para o próximo jogo da coleção.")}</p></article>
          <article class="game-card coming-soon"><span class="card-kicker">${t("Future volume", "Próximo volume")}</span><h3>${t("More campaigns", "Mais campanhas")}</h3><p>${t("The general index can hold additional games and expansions.", "O índice geral pode receber outros jogos e expansões.")}</p></article>
        </div>
      </main>
      ${renderFooter()}`;
  }

  function renderHeader(gamePage) {
    return `
      <header class="site-header">
        <a class="brand" href="#/" aria-label="${t("Field Manual home", "Página inicial do Manual de Campo")}">
          <span class="brand-mark" aria-hidden="true">SE</span>
          <span class="brand-copy"><strong>Field Manual</strong><small>${t("Board-game rulebooks", "Livros de regras")}</small></span>
        </a>
        <div class="header-right">
          <nav class="primary-nav" aria-label="${t("Main navigation", "Navegação principal")}">
            <a href="#/" ${gamePage ? "" : 'aria-current="page"'}>${t("Game index", "Jogos")}</a>
            <a href="#/sniper-elite" ${gamePage ? 'aria-current="page"' : ""}>Sniper Elite</a>
          </nav>
          <div class="language-switch" role="group" aria-label="${t("Language", "Idioma")}">
            <button type="button" data-language="en-US" aria-pressed="${state.language === "en-US"}">EN-US</button>
            <button type="button" data-language="pt-BR" aria-pressed="${state.language === "pt-BR"}">PT-BR</button>
          </div>
        </div>
      </header>`;
  }

  function renderGame() {
    const chosen = currentMap();
    const filteredMaps = availableMaps();
    const expansionControls = expansions.map((item) => `
      <button class="expansion-toggle" type="button" role="switch" data-expansion="${item.id}" aria-checked="${isSelected(item.id)}">
        <span class="toggle-mark" aria-hidden="true">✓</span>
        <span class="expansion-copy"><strong>${pair(item.title)}</strong><small>${pair(item.subtitle)}</small></span>
      </button>`).join("");
    const mapCards = filteredMaps.map((item) => `
      <button class="map-card" type="button" data-map="${item.id}" aria-pressed="${state.map === item.id}">
        <img src="${item.image}" alt="${t(`Map artwork: ${pair(item.name)}`, `Arte do mapa: ${pair(item.name)}`)}" loading="lazy">
        <span class="map-name"><small>${pair(item.type)}</small>${pair(item.name)}</span>
      </button>`).join("");
    const nav = [
      ["iconography", t("Iconography", "Iconografia")],
      ["quick-reference", t("Quick Ref", "Referência")],
      ["setup", t("Setup", "Preparação")],
      ["victory", t("Victory", "Vitória")],
      ["turns", t("Turns", "Turnos")],
      ["examples", t("Examples", "Exemplos")],
      ["glossary", t("Glossary", "Glossário")]
    ];

    return `
      ${renderHeader(true)}
      <section class="game-hero"><div class="game-hero-inner">
        <div><p class="eyebrow">${t("Interactive rulebook · main game", "Livro interativo · jogo base")}</p>
          <h1>Sniper Elite</h1>
          <p class="hero-intro">${t(
            "One bullet can change history. A modular field guide for the sniper, the defenders and every map in your collection.",
            "Uma bala pode mudar a história. Um guia modular para o sniper, os alemães e todos os mapas da coleção."
          )}</p>
          <div class="hero-meta"><span>${t("2–4 players", "2–4 jogadores")}</span><span>${t("Hidden movement", "Movimento oculto")}</span><span>${t("WWII · tactical", "2ª Guerra · tático")}</span></div>
        </div>
        <figure class="hero-map"><img src="${chosen.image}" alt="${pair(chosen.name)}" fetchpriority="high"><figcaption>${t("Current operation", "Operação selecionada")} · ${pair(chosen.name)}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("Field guide", "Guia de campo")}</h2>
          ${nav.map(([id, label], index) => `<button type="button" data-scroll="${id}"><span class="toc-index">${String(index + 1).padStart(2, "0")}</span>${label}</button>`).join("")}
        </aside>
        <div class="content-column">
          ${storageNotice ? `<p class="storage-notice" role="status">${storageNoticeText()}</p>` : ""}
          <section class="controls-panel" aria-labelledby="mission-control-title">
            <div class="panel-topline"><div><p class="eyebrow">${t("MISSION CONTROL", "CONTROLE DA MISSÃO")}</p><h2 id="mission-control-title">${t("Build your match", "Configure a partida")}</h2><p>${t("Selections update every section below and are saved in this browser.", "As escolhas atualizam todas as seções e ficam salvas neste navegador.")}</p></div><span class="saved-label">${storageAvailable ? t("Saved locally", "Salvo localmente") : t("Not saved", "Não salvo")}</span></div>
            <h3 class="subhead">${t("Expansions in this game", "Expansões em jogo")}</h3>
            <div class="expansion-grid">${expansionControls}</div>
            <h3 class="subhead">${t("Choose a map", "Escolha o mapa")}</h3>
            <div class="map-grid">${mapCards}</div>
            <div class="map-summary"><div><strong>${pair(chosen.name)}</strong><p>${pair(chosen.description)}</p></div>${referenceLink(chosen.reference[0], chosen.reference[1])}</div>
          </section>
          <section class="rule-section">${renderIcons()}</section>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${victorySection()}</section>
          <section class="rule-section">${turnsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      ${renderFooter()}`;
  }

  function renderFooter() {
    return `<footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
      "Personal companion guide. Rule summaries are based on the supplied Sniper Elite manuals; the linked source PDFs open from their original local folder.",
      "Guia pessoal de consulta. Os resumos usam os manuais fornecidos de Sniper Elite; os links dos PDFs abrem os arquivos na pasta local original."
    )}</p></footer>`;
  }

  function render() {
    document.documentElement.lang = state.language;
    document.title = t("Field Manual — Boardgame Rulebooks", "Manual de Campo — Livros de Regras");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Interactive multiplayer rules for Sniper Elite, its expansions, and maps.",
        "Regras multijogador interativas de Sniper Elite, suas expansões e mapas."
      );
    }
    const gamePage = window.location.hash.startsWith("#/sniper-elite");
    app.innerHTML = gamePage ? renderGame() : renderLanding();
    updateSetupProgress();
  }

  function onAppClick(event) {
    const button = event.target.closest("button");
    if (!button || !app.contains(button)) return;

    if (button.dataset.language) {
      state.language = button.dataset.language;
      saveState();
      render();
      return;
    }
    if (button.dataset.expansion) {
      const previousSetupConfig = setupConfigurationKey(state.map, state.expansions);
      const id = button.dataset.expansion;
      state.expansions = isSelected(id)
        ? state.expansions.filter((item) => item !== id)
        : [...state.expansions, id];
      if (!availableMaps().some((item) => item.id === state.map)) state.map = "launch-facility";
      resetSetupChecksWhenConfigurationChanges(previousSetupConfig);
      saveState();
      render();
      return;
    }
    if (button.dataset.map) {
      const previousSetupConfig = setupConfigurationKey(state.map, state.expansions);
      state.map = button.dataset.map;
      resetSetupChecksWhenConfigurationChanges(previousSetupConfig);
      saveState();
      render();
      return;
    }
    if (button.dataset.team) {
      state.team = button.dataset.team;
      saveState();
      render();
      return;
    }
    if (button.hasAttribute("data-setup-reset")) {
      state.setupChecks = [];
      saveState();
      app.querySelectorAll("[data-setup-check]").forEach((box) => {
        box.checked = false;
      });
      updateSetupProgress();
      return;
    }
    if (button.dataset.scroll) {
      document.getElementById(button.dataset.scroll)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function onAppChange(event) {
    const checkbox = event.target;
    if (!(checkbox instanceof HTMLInputElement) || !checkbox.matches("[data-setup-check]")) return;
    const id = checkbox.dataset.setupCheck;
    const checked = new Set(state.setupChecks);
    if (checkbox.checked) checked.add(id);
    else checked.delete(id);
    state.setupChecks = [...checked];
    saveState();
    updateSetupProgress();
  }

  app.addEventListener("click", onAppClick);
  app.addEventListener("change", onAppChange);
  window.addEventListener("hashchange", () => {
    window.scrollTo(0, 0);
    render();
  });
  render();
})();
