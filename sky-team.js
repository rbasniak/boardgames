(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.sky-team.v1";
  const SETUP_KEY = "field-manual.sky-team.setup.v1";
  const MANUAL_FILE = "sky-team_core.pdf";
  const ICONS = "assets/sky-team/icons/";
  // Printed page numbers match the PDF page numbers (the cover is page 1).
  const PDF_OFFSET = 0;

  const BOX_CHOICES = ["first", "ready"];
  // The supplied rulebook only describes the basic game at YUL Montréal-Trudeau.
  // Other airports and the advanced modules live in the Flight Log booklet, which is not supplied.
  const APPROACH_CHOICES = ["yul"];
  const defaults = { language: "pt-BR", box: "ready", approach: "yul" };
  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------

  function normalizePreferences(saved) {
    return {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      box: BOX_CHOICES.includes(saved?.box) ? saved.box : defaults.box,
      approach: APPROACH_CHOICES.includes(saved?.approach) ? saved.approach : defaults.approach
    };
  }

  function signature(source = state) {
    return `${source.box}|${source.approach}`;
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Sky Team preferences.", error);
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
      console.error("Could not read Sky Team setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Sky Team preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Sky Team setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function firstGame() {
    return state.box === "first";
  }

  function manualUrl(page) {
    const script = document.querySelector('script[src*="sky-team.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${MANUAL_FILE}`, baseUrl).href}#page=${page + PDF_OFFSET}`;
  }

  function referenceLink(page) {
    return `<a class="source-link" href="${manualUrl(page)}" target="_blank" rel="noreferrer">${t(`Rulebook p. ${page} ↗`, `Manual p. ${page} ↗`)}</a>`;
  }

  function uniquePages(pages) {
    return [...new Set(pages)].sort((a, b) => a - b);
  }

  function sectionHeading(id, title, index, pages) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("FLIGHT DECK", "CABINE")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="st-section-references">${uniquePages(pages).map(referenceLink).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
  }

  function icon(file, alt) {
    return `<img class="st-inline-icon" src="${ICONS}${file}.webp" alt="${alt}">`;
  }

  function iconCard(file, titleEn, bodyEn, titlePt, bodyPt, page) {
    const title = t(titleEn, titlePt);
    return `
      <article class="icon-card">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}.webp" alt="${title}"></span>
        <div><strong>${title}</strong><p>${t(bodyEn, bodyPt)}</p>${referenceLink(page)}</div>
      </article>`;
  }

  function infoCard(label, title, lines, page, extraClass = "") {
    const pages = Array.isArray(page) ? page : [page];
    return `
      <article class="info-card ${extraClass}">
        <span class="component-label">${label}</span>
        <h3>${title}</h3>
        ${lineList(lines)}
        ${pages.map(referenceLink).join(" ")}
      </article>`;
  }

  function interpretation(en, pt) {
    return `<span class="st-interpretation">${t("Guide's reading", "Leitura do guia")}</span> ${t(en, pt)}`;
  }

  function pilot() {
    return `<span class="st-role st-role-pilot">${t("Pilot", "Piloto")}</span>`;
  }

  function copilot() {
    return `<span class="st-role st-role-copilot">${t("Co-Pilot", "Copiloto")}</span>`;
  }

  function boxLabel(value = state.box) {
    return value === "first"
      ? t("First game: box not assembled yet", "Primeira partida: caixa ainda não montada")
      : t("Control Panel already assembled", "Painel de Controle já montado");
  }

  // ---------- header ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["victory", t("Landing & losing", "Pouso e derrota")],
      ["round", t("The round", "A rodada")],
      ["actions", t("Cockpit actions", "Ações da cabine")],
      ["icons", t("Iconography", "Iconografia")],
      ["examples", t("Examples", "Exemplos")],
      ["advice", t("Strategic advice", "Conselhos estratégicos")],
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
          <span class="brand-mark" aria-hidden="true">ST</span>
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
      `${readFailed ? "This browser could not read the saved Sky Team match or setup progress; defaults are shown. " : ""}${writeFailed ? "The latest change could not be saved and is visible on screen only." : ""}`,
      `${readFailed ? "Este navegador não conseguiu ler a partida ou o progresso de Sky Team salvos; as opções padrão estão sendo mostradas. " : ""}${writeFailed ? "A alteração mais recente não pôde ser salva e aparece somente na tela." : ""}`
    ).trim();
  }

  // ---------- configuration ----------

  function choiceCard(name, value, dataAttr, checked, title, description) {
    return `
      <label class="st-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" ${dataAttr} ${checked ? "checked" : ""}>
        <span class="st-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function matchConfiguration() {
    return `
      <section class="controls-panel st-config" id="build-match" aria-labelledby="st-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="st-config-title">${t("Build your flight", "Configure o voo")}</h2>
            <p>${t(
              "Sky Team is always 2 players, cooperating: one Pilot (blue) and one Co-Pilot (orange). The supplied Landing Procedure rulebook teaches the basic game at YUL Montréal-Trudeau and the one-time assembly of the box. Your choices filter the setup checklist below.",
              "Sky Team é sempre para 2 jogadores, em cooperação: um Piloto (azul) e um Copiloto (laranja). O manual fornecido, Landing Procedure, ensina o jogo básico em YUL Montréal-Trudeau e a montagem única da caixa. Suas escolhas filtram a lista de preparação abaixo."
            )}</p>
          </div>
        </div>
        <fieldset class="st-choice-group">
          <legend>${t("Box · selected:", "Caixa · selecionado:")} <span>${boxLabel()}</span></legend>
          <p class="st-choice-intro">${t("The first time you open the box, the Control Panel must be assembled once before the normal setup.", "Na primeira vez que a caixa é aberta, o Painel de Controle precisa ser montado uma vez antes da preparação normal.")} ${referenceLink(2)}</p>
          <div class="st-choice-grid">
            ${choiceCard("st-box", "first", 'data-box="first"', state.box === "first", boxLabel("first"), t(
              "Adds a first setup step: throw away the punched-out bits marked with a trash can, stick the 9 double-sided stickers and the airplane sticker, insert the Axis disc and place the 10 Switches. Done once; never again.",
              "Acrescenta uma primeira etapa: jogue fora as sobras marcadas com uma lixeira, cole os 9 adesivos dupla-face e o adesivo do avião, encaixe o disco do Eixo e coloque os 10 Interruptores. Feito uma vez; nunca mais."
            ))}
            ${choiceCard("st-box", "ready", 'data-box="ready"', state.box === "ready", boxLabel("ready"), t(
              "The stickers, Axis disc and Switches are already in place. The checklist starts with the normal “Before each game” setup.",
              "Os adesivos, o disco do Eixo e os Interruptores já estão no lugar. A lista começa na preparação normal “Antes de cada partida”."
            ))}
          </div>
        </fieldset>
        <fieldset class="st-choice-group">
          <legend>${t("Airport · selected:", "Aeroporto · selecionado:")} <span>YUL Montréal-Trudeau · ${t("basic game", "jogo básico")}</span></legend>
          <p class="st-choice-intro">${t("The only approach the supplied rulebook describes.", "A única aproximação que o manual fornecido descreve.")} ${referenceLink(3)} ${referenceLink(11)}</p>
          <div class="st-choice-grid">
            ${choiceCard("st-approach", "yul", 'data-approach="yul"', true, "YUL Montréal-Trudeau", t(
              "Basic game: Altitude Track on its green/yellow side, 7 rounds from 6,000 ft, 2 Reroll tokens, 9 traffic Airplanes on the approach, 3 Coffee tokens. No advanced modules: everything in the box's closed compartment stays there.",
              "Jogo básico: Trilha de Altitude no lado verde/amarelo, 7 rodadas a partir de 6.000 pés, 2 fichas de Rerrolagem, 9 Aviões de tráfego na aproximação, 3 fichas de Café. Sem módulos avançados: tudo o que está no compartimento fechado da caixa fica lá."
            ))}
          </div>
          <p class="st-choice-note">${t(
            "Other airports, the other side of the Altitude Track and the advanced modules (the components in the closed compartment) are explained in the separate Flight Log booklet, which is not in this repository. This guide does not invent them; after mastering Montréal, the rulebook sends you to the Flight Log.",
            "Outros aeroportos, o outro lado da Trilha de Altitude e os módulos avançados (os componentes do compartimento fechado) são explicados no livreto separado Flight Log, que não está neste repositório. Este guia não os inventa; depois de dominar Montréal, o manual manda vocês para o Flight Log."
          )}</p>
        </fieldset>
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function setupPhases() {
    const phases = [];
    if (firstGame()) {
      phases.push({
        id: "assembly",
        title: t("Assemble the box (first game only)", "Monte a caixa (só na primeira partida)"),
        pages: [2],
        items: [
          t(`Remove and throw away every part of the Control Panel punch-board marked with the trash-can symbol ${icon("trash", "trash can")}.`, `Retire e jogue fora todas as partes da cartela do Painel de Controle marcadas com o símbolo de lixeira ${icon("trash", "lixeira")}.`),
          t("Stick the 9 double-sided stickers on the indicated spaces on the inside and on the back of the Control Panel (the rulebook's diagram 2 shows where).", "Cole os 9 adesivos dupla-face nos espaços indicados no interior e no verso do Painel de Controle (o diagrama 2 do manual mostra onde)."),
          t("Stick the airplane sticker on the Airplane Axis disc, then place the disc into its round space in the middle of the panel.", "Cole o adesivo do avião no disco do Eixo do Avião e encaixe o disco no espaço redondo no meio do painel."),
          t("Place the 10 Switches on the green lights: 3 beside the Pilot's Landing Gear, 4 beside the Co-Pilot's Flaps and 3 under the Brakes.", "Coloque os 10 Interruptores sobre as luzes verdes: 3 ao lado do Trem de Pouso do Piloto, 4 ao lado dos Flaps do Copiloto e 3 sob os Freios.")
        ]
      });
    }
    phases.push(
      {
        id: "panel",
        title: t("Control Panel and seats", "Painel de Controle e lugares"),
        pages: [3],
        items: [
          t("Place the Control Panel between the 2 players, ideally sitting next to each other on the same side of the table.", "Coloque o Painel de Controle entre os 2 jogadores, de preferência sentados lado a lado no mesmo lado da mesa."),
          t(`Choose roles: whoever sits on the side with the blue spaces is the ${pilot()}; whoever sits on the side with the orange spaces is the ${copilot()}.`, `Escolham os papéis: quem senta do lado dos espaços azuis é o ${pilot()}; quem senta do lado dos espaços laranja é o ${copilot()}.`),
          t("Turn the Airplane Axis disc so its arrow points at the black triangle at the top (perfectly horizontal).", "Gire o disco do Eixo do Avião para que a seta aponte para o triângulo preto no topo (perfeitamente horizontal)."),
          t("Check that all 10 Switches cover their green lights.", "Confira se os 10 Interruptores cobrem as luzes verdes.")
        ]
      },
      {
        id: "markers",
        title: t("Speed Gauge and Brake markers", "Marcadores do Velocímetro e dos Freios"),
        pages: [3],
        items: [
          t(`Blue Aerodynamics marker ${icon("aero-blue", "blue Aerodynamics marker")}: on the Speed Gauge, between the 4 and the 5.`, `Marcador de Aerodinâmica azul ${icon("aero-blue", "marcador de Aerodinâmica azul")}: no Velocímetro, entre o 4 e o 5.`),
          t(`Orange Aerodynamics marker ${icon("aero-orange", "orange Aerodynamics marker")}: on the Speed Gauge, between the 8 and the 9.`, `Marcador de Aerodinâmica laranja ${icon("aero-orange", "marcador de Aerodinâmica laranja")}: no Velocímetro, entre o 8 e o 9.`),
          t(`Red Brake marker ${icon("brake-marker", "red Brake marker")}: on the Brake track, to the left of the 2.`, `Marcador de Freio vermelho ${icon("brake-marker", "marcador de Freio vermelho")}: na trilha de Freio, à esquerda do 2.`)
        ]
      },
      {
        id: "crew",
        title: t("Dice and screens", "Dados e telas"),
        pages: [3],
        items: [
          t(`Give the ${pilot()} the 4 blue dice and the ${copilot()} the 4 orange dice.`, `Dê ao ${pilot()} os 4 dados azuis e ao ${copilot()} os 4 dados laranja.`),
          t("Give each player a screen. Both read the reminders printed inside their screen.", "Dê uma tela a cada jogador. Os dois leem os lembretes impressos dentro da tela."),
          t("Dice are always rolled and kept behind your own screen: your partner must not see your values.", "Os dados são sempre rolados e mantidos atrás da sua própria tela: o parceiro não pode ver seus valores.")
        ]
      },
      {
        id: "tracks",
        title: t("Altitude and Approach Tracks", "Trilhas de Altitude e de Aproximação"),
        pages: [3],
        items: [
          t("Altitude Track, green/yellow side up: slide it into the slot at the top right of the Control Panel until 6000 is visible in the screen. That number is your Current Altitude, in feet.", "Trilha de Altitude, lado verde/amarelo para cima: deslize-a na fenda no alto à direita do Painel de Controle até o 6000 aparecer na tela. Esse número é a sua Altitude Atual, em pés."),
          t(`YUL Montréal-Trudeau Approach Track: slide it into the slot at the top left until the cloud icon ${icon("cloud", "cloud")} is visible in the screen. That screen shows your Current Position.`, `Trilha de Aproximação YUL Montréal-Trudeau: deslize-a na fenda no alto à esquerda até o ícone de nuvem ${icon("cloud", "nuvem")} aparecer na tela. Essa tela mostra a sua Posição Atual.`)
        ]
      },
      {
        id: "tokens",
        title: t("Reroll, traffic and Coffee tokens", "Fichas de Rerrolagem, tráfego e Café"),
        pages: [3],
        items: [
          t(`Place 1 Reroll token on each Reroll icon ${icon("reroll", "Reroll icon")} of the Altitude Track (2 tokens: on the 6000 and 2000 spaces in the rulebook's picture).`, `Coloque 1 ficha de Rerrolagem em cada ícone de Rerrolagem ${icon("reroll", "ícone de Rerrolagem")} da Trilha de Altitude (2 fichas: nos espaços 6000 e 2000 na imagem do manual).`),
          t(`On each space of the Approach Track, place as many Airplane tokens as there are small Traffic icons ${icon("traffic", "Traffic icon")} printed on that space.`, `Em cada espaço da Trilha de Aproximação, coloque tantas fichas de Avião quantos forem os pequenos ícones de Tráfego ${icon("traffic", "ícone de Tráfego")} impressos naquele espaço.`),
          interpretation("counted from the rulebook's picture of YUL, starting at the cloud: 0, 0, 1, 2, 1, 3, then 2 on the airport space — 9 of the 12 Airplane tokens. Trust the icons on your track if they differ.", "contando pela imagem de YUL no manual, a partir da nuvem: 0, 0, 1, 2, 1, 3 e 2 no espaço do aeroporto — 9 das 12 fichas de Avião. Confie nos ícones da sua trilha se forem diferentes."),
          t(`Make a reserve of the 3 Coffee tokens ${icon("coffee", "Coffee token")} next to the board, not on it.`, `Faça uma reserva com as 3 fichas de Café ${icon("coffee", "ficha de Café")} ao lado do tabuleiro, não sobre ele.`),
          t("Every other component (the closed compartment) stays in the box: it belongs to the advanced modules.", "Todos os outros componentes (o compartimento fechado) ficam na caixa: são dos módulos avançados.")
        ]
      }
    );
    return phases;
  }

  function inventory() {
    return `<div class="quick-grid">
      ${infoCard(t("SHARED", "COMPARTILHADO"), t("Cockpit", "Cabine"), [
        t("1 Control Panel with the Airplane Axis disc in its centre.", "1 Painel de Controle com o disco do Eixo do Avião no centro."),
        t("10 Switches (3 Landing Gear, 4 Flaps, 3 Brakes).", "10 Interruptores (3 Trem de Pouso, 4 Flaps, 3 Freios)."),
        t("2 Aerodynamics markers (blue, orange) and 1 red Brake marker.", "2 marcadores de Aerodinâmica (azul, laranja) e 1 marcador de Freio vermelho."),
        t("1 Altitude Track (green/yellow side) and the YUL Montréal-Trudeau Approach Track.", "1 Trilha de Altitude (lado verde/amarelo) e a Trilha de Aproximação YUL Montréal-Trudeau.")
      ], [2, 3])}
      ${infoCard(t("TOKENS", "FICHAS"), t("On and beside the panel", "No painel e ao lado"), [
        t("2 Reroll tokens, on the Altitude Track.", "2 fichas de Rerrolagem, na Trilha de Altitude."),
        t("12 Airplane tokens: 9 placed on the YUL approach (guide's count), 3 left over.", "12 fichas de Avião: 9 colocadas na aproximação de YUL (contagem do guia), 3 sobram."),
        t("3 Coffee tokens, in a reserve beside the board.", "3 fichas de Café, numa reserva ao lado do tabuleiro.")
      ], 3)}
      ${infoCard(t("PILOT · BLUE", "PILOTO · AZUL"), t("Pilot's kit", "Material do Piloto"), [
        t("4 blue dice.", "4 dados azuis."),
        t("1 screen.", "1 tela."),
        t("Sits on the side of the blue spaces.", "Senta do lado dos espaços azuis.")
      ], 3, "st-pilot-card")}
      ${infoCard(t("CO-PILOT · ORANGE", "COPILOTO · LARANJA"), t("Co-Pilot's kit", "Material do Copiloto"), [
        t("4 orange dice.", "4 dados laranja."),
        t("1 screen.", "1 tela."),
        t("Sits on the side of the orange spaces.", "Senta do lado dos espaços laranja.")
      ], 3, "st-copilot-card")}
    </div>`;
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
        <label class="st-setup-check" for="st-setup-${phase.id}">
          <input id="st-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="st-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="st-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), sectionIndex("setup"), firstGame() ? [2, 3] : [3])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("PRE-FLIGHT CHECKLIST", "CHECKLIST PRÉ-VOO")}</p>
            <h3>${t("Set up this flight", "Prepare este voo")} · YUL · ${boxLabel()}</h3>
            <p>${t("One checkbox per coherent step. Every substep must be done before you check it.", "Uma caixa por etapa coerente. Todos os subpassos devem estar feitos antes de marcá-la.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved separately from the flight configuration and language. Changing the box choice clears this checklist; changing the language does not. “Uncheck all” clears only these setup boxes.",
          "O progresso é salvo separadamente da configuração do voo e do idioma. Trocar a escolha da caixa limpa esta lista; trocar o idioma não. “Desmarcar tudo” limpa somente as caixas da preparação."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this flight", "Componentes deste voo")}</h3>
      ${inventory()}`;
  }

  // ---------- quick reference ----------

  function quickReference() {
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), sectionIndex("quick-reference"), [4, 5, 6, 9, 11])}
      <div class="callout">${t(
        "Goal: together, land the airliner at YUL Montréal-Trudeau in 7 rounds — approach cleared of traffic, all Landing Gear and Flaps deployed, wings level, and Brakes stronger than your final speed. One mistake and you both lose.",
        "Objetivo: juntos, pousar o avião em YUL Montréal-Trudeau em 7 rodadas — aproximação livre de tráfego, todo o Trem de Pouso e os Flaps baixados, asas niveladas e Freios mais fortes que a velocidade final. Um erro e os dois perdem."
      )} ${referenceLink(1)} ${referenceLink(11)}</div>
      <div class="quick-grid">
        ${infoCard(t("EACH ROUND · 7 ROUNDS", "CADA RODADA · 7 RODADAS"), t("Three phases", "Três fases"), [
          rl("Start · Reroll pickup", "if a Reroll token sits on the Current Altitude, move it to the supply at the top left of the panel.", "Início · Pegar Rerrolagem", "se houver ficha de Rerrolagem na Altitude Atual, mova-a para a reserva no alto à esquerda do painel."),
          rl("1 · Briefing", "talk strategy freely — but never about dice values. Then each rolls 4 dice behind their screen. Silence from now on.", "1 · Briefing", "conversem à vontade sobre estratégia — mas nunca sobre valores de dados. Depois cada um rola 4 dados atrás da tela. Silêncio a partir daí."),
          rl("2 · Dice placement", "take turns, starting with the player the arrow on the Current Altitude points to. Place exactly one die per turn until all 8 are placed.", "2 · Colocação de dados", "alternem os turnos, começando por quem a seta da Altitude Atual indica. Coloque exatamente um dado por turno até os 8 estarem colocados."),
          rl("3 · End of round", "talk again. Advance the Altitude Track 1 space (−1,000 ft), take your dice back, check for the final round.", "3 · Fim da rodada", "voltem a conversar. Avance a Trilha de Altitude 1 espaço (−1.000 pés), peguem os dados de volta e verifiquem se é a rodada final.")
        ], [4, 9])}
        ${infoCard(t("PILOT · BLUE SPACES", "PILOTO · ESPAÇOS AZUIS"), t("Pilot's cockpit", "Cabine do Piloto"), [
          rl("Axis", "1 die every round (mandatory).", "Eixo", "1 dado em toda rodada (obrigatório)."),
          rl("Engines", "1 die every round (mandatory).", "Motores", "1 dado em toda rodada (obrigatório)."),
          rl("Radio", "1 space, any value.", "Rádio", "1 espaço, qualquer valor."),
          rl("Landing Gear", "3 spaces: 1/2, 3/4, 5/6, in any order. Each new one: blue marker +1.", "Trem de Pouso", "3 espaços: 1/2, 3/4, 5/6, em qualquer ordem. Cada novo: marcador azul +1."),
          rl("Brakes", "exactly 2, then 4, then 6, in that order. Each new one: red marker +1.", "Freios", "exatamente 2, depois 4, depois 6, nessa ordem. Cada novo: marcador vermelho +1."),
          rl("Concentration", "shared spaces, any die → 1 Coffee.", "Concentração", "espaços compartilhados, qualquer dado → 1 Café.")
        ], [4, 7, 9], "st-pilot-card")}
        ${infoCard(t("CO-PILOT · ORANGE SPACES", "COPILOTO · ESPAÇOS LARANJA"), t("Co-Pilot's cockpit", "Cabine do Copiloto"), [
          rl("Axis", "1 die every round (mandatory).", "Eixo", "1 dado em toda rodada (obrigatório)."),
          rl("Engines", "1 die every round (mandatory).", "Motores", "1 dado em toda rodada (obrigatório)."),
          rl("Radio", "2 spaces, any value.", "Rádio", "2 espaços, qualquer valor."),
          rl("Flaps", "4 spaces: 1/2, 2/3, 4/5, 5/6, strictly from top to bottom. Each new one: orange marker +1.", "Flaps", "4 espaços: 1/2, 2/3, 4/5, 5/6, estritamente de cima para baixo. Cada novo: marcador laranja +1."),
          rl("Concentration", "shared spaces, any die → 1 Coffee.", "Concentração", "espaços compartilhados, qualquer dado → 1 Café.")
        ], [4, 7, 8], "st-copilot-card")}
        ${infoCard(t("SPEED", "VELOCIDADE"), t("When the 2nd Engine die lands", "Quando o 2º dado dos Motores entra"), [
          rl("Speed", "add the 2 Engine dice.", "Velocidade", "some os 2 dados dos Motores."),
          rl("Below blue marker", "Approach Track does not move.", "Abaixo do marcador azul", "a Trilha de Aproximação não se move."),
          rl("Between the markers", "advance the Approach Track 1 space.", "Entre os marcadores", "avance a Trilha de Aproximação 1 espaço."),
          rl("Above orange marker", "advance 2 spaces.", "Acima do marcador laranja", "avance 2 espaços."),
          rl("Final round", "compare with the red Brake marker instead: speed must be lower.", "Rodada final", "compare com o marcador de Freio vermelho: a velocidade deve ser menor.")
        ], [6, 10])}
        ${infoCard(t("AXIS", "EIXO"), t("When the 2nd Axis die lands", "Quando o 2º dado do Eixo entra"), [
          rl("Same values", "nothing moves.", "Valores iguais", "nada se move."),
          rl("Different", "turn the plane as many marks as the difference, toward the player of the higher die.", "Diferentes", "gire o avião tantas marcas quanto a diferença, para o lado de quem jogou o dado maior."),
          rl("Keep it", "the tilt stays from round to round.", "Mantém", "a inclinação continua de uma rodada para a outra."),
          rl("Spin", "reaching or passing a red X loses at once.", "Parafuso", "alcançar ou passar um X vermelho é derrota imediata.")
        ], 5)}
        ${infoCard(t("ANY TIME", "A QUALQUER MOMENTO"), t("Coffee and Rerolls", "Café e Rerrolagens"), [
          rl("Coffee", "when placing any die, spend Coffee tokens: each one is +1 or −1 to that die (stays within 1–6, no wrap-around).", "Café", "ao colocar qualquer dado, gaste fichas de Café: cada uma dá +1 ou −1 a esse dado (fica entre 1 e 6, sem dar a volta)."),
          rl("Shared", "either player may spend any Coffee; maximum 3 on the panel; unspent ones stay.", "Compartilhado", "qualquer jogador pode gastar qualquer Café; máximo de 3 no painel; os não usados ficam."),
          rl("Reroll", "either player spends a Reroll token: BOTH players may reroll any of their unplaced dice once.", "Rerrolagem", "qualquer jogador gasta uma ficha de Rerrolagem: os DOIS jogadores podem rolar de novo quaisquer dados não colocados, uma vez.")
        ], [4, 8])}
        ${infoCard(t("YOU LOSE AT ONCE IF", "VOCÊS PERDEM NA HORA SE"), t("Crash conditions", "Condições de queda"), [
          rl("Spin", "the Axis arrow reaches or passes an X.", "Parafuso", "a seta do Eixo alcança ou passa um X."),
          rl("Collision", "you must advance while Airplanes are in the Current Position.", "Colisão", "vocês precisam avançar com Aviões na Posição Atual."),
          rl("Overshoot", "you must advance while the airport is in the Current Position.", "Passar do aeroporto", "vocês precisam avançar com o aeroporto na Posição Atual."),
          rl("Missing mandatory die", "at end of round, Axis or Engines lack a blue and an orange die.", "Dado obrigatório faltando", "no fim da rodada, o Eixo ou os Motores não têm um dado azul e um laranja."),
          rl("Too late", "the plane reaches the ground (Airplane image in Altitude) before the airport.", "Tarde demais", "o avião chega ao solo (imagem do Avião na Altitude) antes do aeroporto.")
        ], [5, 6, 10], "st-danger-card")}
        ${infoCard(t("FINAL ROUND · YOU WIN IF", "RODADA FINAL · VOCÊS VENCEM SE"), t("Landing checklist A–D", "Checklist de pouso A–D"), [
          rl("A", "no Airplane tokens left on the Approach Track.", "A", "nenhuma ficha de Avião na Trilha de Aproximação."),
          rl("B", "all 3 Landing Gear and all 4 Flaps Switches show green.", "B", "os 3 Interruptores do Trem de Pouso e os 4 dos Flaps mostram verde."),
          rl("C", "the Axis is perfectly horizontal.", "C", "o Eixo está perfeitamente horizontal."),
          rl("D", "your final speed is lower than the red Brake marker.", "D", "a velocidade final é menor que o marcador de Freio vermelho.")
        ], 11, "victory-card")}
      </div>`;
  }

  // ---------- victory ----------

  function victorySection() {
    return `
      ${sectionHeading("victory", t("Landing & losing", "Pouso e derrota"), sectionIndex("victory"), [5, 6, 9, 10, 11])}
      <div class="quick-grid">
        ${infoCard(t("FINAL ROUND", "RODADA FINAL"), t("When it starts", "Quando começa"), [
          t("At the end of each round, after lowering the Altitude Track, look at both screens.", "No fim de cada rodada, depois de baixar a Trilha de Altitude, olhem as duas telas."),
          rl("Airport + Airplane", "the airport image is in the Current Position screen and the Airplane image is in the Current Altitude screen: the next round is the final round. Great timing!", "Aeroporto + Avião", "a imagem do aeroporto está na tela de Posição Atual e a imagem do Avião na tela de Altitude Atual: a próxima rodada é a final. Ótimo timing!"),
          rl("Airport only (too soon)", "you are in a holding pattern: keep playing rounds without advancing the Approach Track — keep your speed below the blue marker, or you overshoot.", "Só o aeroporto (cedo demais)", "vocês estão em espera: continuem jogando rodadas sem avançar a Trilha de Aproximação — mantenham a velocidade abaixo do marcador azul, senão passam do aeroporto."),
          rl("Airplane only (too late)", "you crash-landed before the airport: you lose.", "Só o Avião (tarde demais)", "vocês pousaram antes do aeroporto, um desastre: derrota."),
          rl("Neither", "play the next round normally.", "Nenhum dos dois", "joguem a próxima rodada normalmente.")
        ], [9, 10])}
        ${infoCard(t("FINAL ROUND", "RODADA FINAL"), t("How the landing round differs", "O que muda na rodada de pouso"), [
          t("Play the round normally: briefing, roll, place all 8 dice, Axis and Engines still mandatory.", "Joguem a rodada normalmente: briefing, rolagem, colocação dos 8 dados, Eixo e Motores continuam obrigatórios."),
          t("When the second Engine die is placed, do NOT compare the speed with the Aerodynamics markers: compare it with the red Brake marker. The Approach Track does not move.", "Quando o segundo dado dos Motores for colocado, NÃO compare a velocidade com os marcadores de Aerodinâmica: compare com o marcador de Freio vermelho. A Trilha de Aproximação não se move."),
          t("The Brakes only matter in this round. You do not need all 3 Brakes, but with none deployed (marker still left of the 2) the plane cannot stop: even the minimum speed of 2 is too fast.", "Os Freios só importam nesta rodada. Não é preciso ter os 3 Freios, mas sem nenhum (marcador ainda à esquerda do 2) o avião não para: até a velocidade mínima de 2 é rápida demais."),
          t("Radio, Landing Gear, Flaps, Brakes, Concentration and Coffee all still work during this round.", "Rádio, Trem de Pouso, Flaps, Freios, Concentração e Café continuam funcionando nesta rodada.")
        ], [9, 10])}
        <article class="info-card victory-card">
          <span class="component-label">${t("END OF THE FINAL ROUND", "FIM DA RODADA FINAL")}</span>
          <h3>${t("You win if all four are true", "Vocês vencem se as quatro forem verdadeiras")}</h3>
          <div class="st-win-list">
            <div><img src="${ICONS}traffic.webp" alt="${t("Airplane token", "ficha de Avião")}"><span>${rl("A · Traffic cleared", "there are no Airplane tokens on the Approach Track.", "A · Tráfego liberado", "não há fichas de Avião na Trilha de Aproximação.")}</span></div>
            <div><img src="${ICONS}switch.webp" alt="${t("Switch showing green", "Interruptor mostrando verde")}"><span>${rl("B · Configured", "all Flaps and Landing Gear Switches show the green light.", "B · Configurado", "todos os Interruptores dos Flaps e do Trem de Pouso mostram a luz verde.")}</span></div>
            <div><img src="${ICONS}horizontal.webp" alt="${t("Horizontal Axis", "Eixo horizontal")}"><span>${rl("C · Level", "the Airplane's Axis is completely horizontal.", "C · Nivelado", "o Eixo do Avião está completamente horizontal.")}</span></div>
            <div><img src="${ICONS}brakes-victory.webp" alt="${t("Brake marker on the Brake track", "Marcador de Freio na trilha de Freio")}"><span>${rl("D · Stopped", "your speed (the 2 Engine dice) was lower than the red Brake marker.", "D · Parado", "a sua velocidade (os 2 dados dos Motores) foi menor que o marcador de Freio vermelho.")}</span></div>
          </div>
          ${lineList([
            t("The passengers applaud: you have landed smoothly and you both win.", "Os passageiros aplaudem: vocês pousaram suavemente e os dois vencem."),
            interpretation("the rulebook only lists the winning conditions. If any of A–D is not met at the end of the final round, the landing failed and you both lose.", "o manual só lista as condições de vitória. Se qualquer uma de A–D não for cumprida no fim da rodada final, o pouso falhou e os dois perdem.")
          ])}
          ${referenceLink(11)}
        </article>
        ${infoCard(t("BRAKE STRENGTH", "FORÇA DOS FREIOS"), t("Highest speed that still stops", "Maior velocidade que ainda para"), [
          rl("No Brakes", "marker left of the 2 — no speed can stop (crash).", "Nenhum Freio", "marcador à esquerda do 2 — nenhuma velocidade para (queda)."),
          `${rl("Brake 2 deployed", "", "Freio 2 baixado", "")}${interpretation("the marker moves just past the 2: only a speed of exactly 2 stops.", "o marcador passa logo depois do 2: só uma velocidade de exatamente 2 para.")}`,
          rl("Brakes 2 and 4", "marker between the 4 and the 5 — speed 4 or less stops (rulebook example: speed 3 lands).", "Freios 2 e 4", "marcador entre o 4 e o 5 — velocidade 4 ou menos para (exemplo do manual: velocidade 3 pousa)."),
          `${rl("Brakes 2, 4 and 6", "", "Freios 2, 4 e 6", "")}${interpretation("the marker ends past the 6: speed 6 or less stops.", "o marcador termina depois do 6: velocidade 6 ou menos para.")}`
        ], [9, 10])}
        ${infoCard(t("LOSING", "DERROTA"), t("Any one of these ends the game", "Qualquer uma destas encerra a partida"), [
          rl("Spin", "as soon as the Axis arrow reaches or passes an X mark.", "Parafuso", "assim que a seta do Eixo alcança ou passa uma marca X."),
          rl("Collision", "the Approach Track must advance while Airplane tokens are in the Current Position. (Airplanes moving into your Current Position is fine.)", "Colisão", "a Trilha de Aproximação precisa avançar com fichas de Avião na Posição Atual. (Aviões entrando na sua Posição Atual não são problema.)"),
          rl("Overshoot", "the Approach Track must advance while the airport is in the Current Position.", "Passar do aeroporto", "a Trilha de Aproximação precisa avançar com o aeroporto na Posição Atual."),
          rl("Mandatory dice", "at the end of any round, the Axis or the Engines do not hold 1 blue and 1 orange die.", "Dados obrigatórios", "no fim de qualquer rodada, o Eixo ou os Motores não têm 1 dado azul e 1 laranja."),
          rl("Crash landing", "the Airplane image reaches the Current Altitude screen while the airport is not in the Current Position.", "Pouso forçado", "a imagem do Avião chega à tela de Altitude Atual sem o aeroporto na Posição Atual."),
          rl("Failed landing", "any of A–D is unmet at the end of the final round.", "Pouso falho", "qualquer uma de A–D não é cumprida no fim da rodada final.")
        ], [5, 6, 10, 11], "st-danger-card")}
      </div>`;
  }

  // ---------- round ----------

  function roundSection() {
    return `
      ${sectionHeading("round", t("The round", "A rodada"), sectionIndex("round"), [4, 9])}
      <p class="glossary-intro">${t("The game lasts at most 7 rounds — one per space of the Altitude Track, from 6,000 ft down to the Airplane image; the final round is played with the Airplane image showing. A holding pattern does not add rounds: you simply stay over the airport while the altitude keeps dropping. Each round has 3 phases.", "A partida dura no máximo 7 rodadas — uma por espaço da Trilha de Altitude, de 6.000 pés até a imagem do Avião; a rodada final é jogada com a imagem do Avião visível. Uma espera não acrescenta rodadas: vocês só ficam sobre o aeroporto enquanto a altitude continua caindo. Cada rodada tem 3 fases.")}</p>
      <div class="quick-grid">
        ${infoCard(t("PHASE 1", "FASE 1"), t("Strategy discussion and dice rolls", "Discussão de estratégia e rolagem"), [
          rl("Reroll token first", "at the start of the round, if a Reroll token is on the Current Altitude space (6,000 ft in round 1), move it to the Reroll supply at the top left of the panel.", "Primeiro a Rerrolagem", "no início da rodada, se houver ficha de Rerrolagem no espaço da Altitude Atual (6.000 pés na rodada 1), mova-a para a reserva de Rerrolagem no alto à esquerda do painel."),
          rl("Talk", "discuss your plan for the round, e.g. “We really need to get rid of that plane” or “Let's make sure we advance 2 spaces.”", "Conversem", "discutam o plano da rodada, por exemplo “Precisamos tirar aquele avião” ou “Vamos garantir que avançamos 2 espaços.”"),
          rl("Never the dice", "no talking about dice: “If you get a 6, put it here” or “Use your weakest die for this” is forbidden.", "Nunca os dados", "nada de falar de dados: “Se tirar um 6, ponha aqui” ou “Use seu dado mais fraco nisso” é proibido."),
          rl("Roll", "each player rolls all 4 of their dice behind their screen.", "Rolem", "cada jogador rola os seus 4 dados atrás da tela."),
          rl("Silence", "from the roll until the end of the round, both players stay completely silent, except to correct a rules mistake.", "Silêncio", "da rolagem até o fim da rodada, os dois ficam em silêncio total, exceto para corrigir um erro de regra.")
        ], 4)}
        ${infoCard(t("PHASE 2", "FASE 2"), t("Dice placement", "Colocação dos dados"), [
          rl("Who starts", "the arrow in the Current Altitude screen shows who places first; the Pilot (blue) starts round 1.", "Quem começa", "a seta na tela de Altitude Atual mostra quem coloca primeiro; o Piloto (azul) começa a rodada 1."),
          interpretation("in the rulebook's picture the Altitude spaces alternate blue and orange (6000 blue, 5000 orange, 4000 blue…), so the first player alternates each round. Follow the arrow on your track.", "na imagem do manual os espaços de Altitude alternam azul e laranja (6000 azul, 5000 laranja, 4000 azul…), então o primeiro jogador alterna a cada rodada. Sigam a seta da sua trilha."),
          rl("One die", "on your turn, place exactly ONE of your remaining dice on a free space (no die on it). Then your partner takes a turn.", "Um dado", "no seu turno, coloque exatamente UM dos seus dados restantes num espaço livre (sem dado). Depois é a vez do parceiro."),
          rl("Colour", `the ${pilot()} uses blue spaces, the ${copilot()} orange spaces; blue-and-orange spaces take either.`, "Cor", `o ${pilot()} usa espaços azuis, o ${copilot()} espaços laranja; espaços azul-e-laranja aceitam os dois.`),
          rl("Number", "a number printed on a space is the only value allowed there (e.g. the 1/2 Flaps space takes a 1 or a 2). Radio has colour only; Concentration has no constraint at all.", "Número", "um número impresso no espaço é o único valor permitido ali (ex.: o espaço 1/2 dos Flaps aceita 1 ou 2). O Rádio só tem cor; a Concentração não tem restrição nenhuma."),
          rl("Effect", "the action of a space happens as soon as the die is placed (Axis and Engines when their second die arrives).", "Efeito", "a ação do espaço acontece assim que o dado é colocado (Eixo e Motores quando chega o segundo dado)."),
          rl("Until all 8", "keep alternating until both players have placed all 4 dice.", "Até os 8", "continuem alternando até os dois terem colocado os 4 dados.")
        ], [4, 5])}
        ${infoCard(t("PHASE 3", "FASE 3"), t("End of round", "Fim da rodada"), [
          rl("Talk again", "once all 8 dice are placed you may speak.", "Voltem a falar", "com os 8 dados colocados, vocês podem falar."),
          rl("Check", "Axis and Engines must each hold 1 blue and 1 orange die — otherwise you lose.", "Verificar", "o Eixo e os Motores devem ter 1 dado azul e 1 laranja cada — senão vocês perdem."),
          rl("1 · Descend", "advance the Altitude Track one space (1,000 ft), whatever happened this round.", "1 · Descer", "avance a Trilha de Altitude um espaço (1.000 pés), aconteça o que acontecer na rodada."),
          rl("2 · Dice back", "each player takes back their dice. Switches, markers, Coffee and the Axis tilt stay as they are.", "2 · Dados de volta", "cada jogador pega seus dados de volta. Interruptores, marcadores, Café e a inclinação do Eixo ficam como estão."),
          rl("Final round?", "airport in Current Position and Airplane in Current Altitude → final round. Otherwise start a new round (see Landing & losing for the special cases).", "Rodada final?", "aeroporto na Posição Atual e Avião na Altitude Atual → rodada final. Senão comecem nova rodada (veja Pouso e derrota para os casos especiais).")
        ], [5, 9])}
      </div>`;
  }

  // ---------- actions ----------

  function actionCard(file, label, title, lines, pages, extraClass = "") {
    return `
      <article class="info-card st-action-card ${extraClass}">
        <div class="st-action-head"><img src="${ICONS}${file}.webp" alt=""><div><span class="component-label">${label}</span><h3>${title}</h3></div></div>
        ${lineList(lines)}
        ${(Array.isArray(pages) ? pages : [pages]).map(referenceLink).join(" ")}
      </article>`;
  }

  function actionsSection() {
    return `
      ${sectionHeading("actions", t("Cockpit actions", "Ações da cabine"), sectionIndex("actions"), [5, 6, 7, 8, 9])}
      <p class="glossary-intro">${t(
        `Each space's effect depends on where the die goes and its value. Spaces marked ${icon("mandatory", "mandatory")} (Axis and Engines) are mandatory every round, but need not be your first placements. Spaces fill up during a round and are all free again when the dice come back.`,
        `O efeito de cada espaço depende de onde o dado vai e do valor dele. Espaços marcados com ${icon("mandatory", "obrigatório")} (Eixo e Motores) são obrigatórios em toda rodada, mas não precisam ser os primeiros. Os espaços se ocupam durante a rodada e ficam todos livres de novo quando os dados voltam.`
      )}</p>
      <div class="st-action-grid">
        ${actionCard("axis", t("BOTH · MANDATORY", "AMBOS · OBRIGATÓRIO"), t("Axis", "Eixo"), [
          t(`Every round, the ${pilot()} places 1 die on the blue Axis space and the ${copilot()} 1 die on the orange Axis space. Any value.`, `Em toda rodada, o ${pilot()} coloca 1 dado no espaço azul do Eixo e o ${copilot()} 1 dado no espaço laranja do Eixo. Qualquer valor.`),
          rl("When the 2nd die lands", "compare the two values.", "Quando o 2º dado entra", "comparem os dois valores."),
          rl("Equal", "do not move anything.", "Iguais", "não movam nada."),
          rl("Different", "turn the Airplane Axis as many marks as the difference, toward the player who played the higher die (Pilot's side or Co-Pilot's side).", "Diferentes", "girem o Eixo do Avião tantas marcas quanto a diferença, para o lado de quem jogou o dado maior (lado do Piloto ou do Copiloto)."),
          rl("No reset", "the tilt stays at the end of the round; later rounds can correct it.", "Sem reinício", "a inclinação fica no fim da rodada; rodadas seguintes podem corrigi-la."),
          rl("Spin", `if the arrow reaches or passes an X ${icon("spin", "X mark")}, the plane spins and you lose immediately.`, "Parafuso", `se a seta alcançar ou passar um X ${icon("spin", "marca X")}, o avião entra em parafuso e vocês perdem na hora.`),
          interpretation("in the rulebook's dial the X sits on the 3rd mark on each side, so being tilted 1 or 2 marks is safe and a tilt of 3 or more loses.", "no mostrador do manual o X fica na 3ª marca de cada lado, então estar inclinado 1 ou 2 marcas é seguro e uma inclinação de 3 ou mais é derrota."),
          rl("Landing", "it must be exactly horizontal at the end of the final round.", "Pouso", "ele deve estar exatamente horizontal no fim da rodada final.")
        ], 5)}
        ${actionCard("engines", t("BOTH · MANDATORY", "AMBOS · OBRIGATÓRIO"), t("Engines", "Motores"), [
          t(`Every round, the ${pilot()} and the ${copilot()} each place 1 die on their Engine space. Any value.`, `Em toda rodada, o ${pilot()} e o ${copilot()} colocam 1 dado cada no seu espaço dos Motores. Qualquer valor.`),
          rl("When the 2nd die lands", "add the 2 dice: that is your speed.", "Quando o 2º dado entra", "somem os 2 dados: essa é a velocidade."),
          rl("Speed below the blue marker", "the Approach Track stays put.", "Velocidade abaixo do marcador azul", "a Trilha de Aproximação fica parada."),
          rl("Speed between the 2 markers", "advance the Approach Track 1 space.", "Velocidade entre os 2 marcadores", "avance a Trilha de Aproximação 1 espaço."),
          rl("Speed above the orange marker", "advance the Approach Track 2 spaces.", "Velocidade acima do marcador laranja", "avance a Trilha de Aproximação 2 espaços."),
          rl("At the start", "blue between 4|5, orange between 8|9: speed 2–4 → 0 spaces, 5–8 → 1 space, 9–12 → 2 spaces.", "No início", "azul entre 4|5, laranja entre 8|9: velocidade 2–4 → 0 espaços, 5–8 → 1 espaço, 9–12 → 2 espaços."),
          rl("Collision", "if Airplane tokens are in the Current Position when you must advance, you collide and lose.", "Colisão", "se houver fichas de Avião na Posição Atual quando vocês precisam avançar, há colisão e derrota."),
          interpretation("when advancing 2 spaces, advance one space at a time: the Current Position must be clear of Airplanes before each step, so both the current and the next space must be clear.", "ao avançar 2 espaços, avance um de cada vez: a Posição Atual deve estar livre de Aviões antes de cada passo, então o espaço atual e o seguinte precisam estar livres."),
          rl("Overshoot", "if the airport is in the Current Position when you must advance, you lose.", "Passar do aeroporto", "se o aeroporto estiver na Posição Atual quando vocês precisam avançar, derrota."),
          rl("Final round", "compare the speed with the red Brake marker instead (see Landing & losing).", "Rodada final", "comparem a velocidade com o marcador de Freio vermelho (veja Pouso e derrota).")
        ], [6, 10])}
        ${actionCard("radio", t("BOTH · PILOT 1 SPACE · CO-PILOT 2", "AMBOS · PILOTO 1 ESPAÇO · COPILOTO 2"), t("Radio", "Rádio"), [
          t(`Talk to the Control Tower to clear traffic. The ${pilot()} has 1 Radio space, the ${copilot()} has 2. Colour constraint only: any value.`, `Falem com a Torre de Controle para liberar o tráfego. O ${pilot()} tem 1 espaço de Rádio, o ${copilot()} tem 2. Só restrição de cor: qualquer valor.`),
          rl("Effect", "count that many spaces on the Approach Track, counting the Current Position as 1, and immediately remove 1 Airplane token from that space.", "Efeito", "contem esse número de espaços na Trilha de Aproximação, com a Posição Atual valendo 1, e removam na hora 1 ficha de Avião desse espaço."),
          rl("Value 1", "removes an Airplane from the Current Position.", "Valor 1", "remove um Avião da Posição Atual."),
          rl("Nothing there", "no Airplane in that space: no effect.", "Nada ali", "nenhum Avião nesse espaço: sem efeito."),
          rl("Landing", "all Airplanes must be gone at the end of the final round.", "Pouso", "todos os Aviões devem ter saído no fim da rodada final.")
        ], 7)}
        ${actionCard("landing-gear", t("PILOT ONLY · BLUE", "SÓ PILOTO · AZUL"), t("Landing Gear", "Trem de Pouso"), [
          t(`3 spaces for the ${pilot()}: 1/2, 3/4 and 5/6. The die must show one of the printed numbers. Deploy them in any order.`, `3 espaços para o ${pilot()}: 1/2, 3/4 e 5/6. O dado deve mostrar um dos números impressos. Baixe-os em qualquer ordem.`),
          rl("Switch", "slide the Switch below the die to show the green light.", "Interruptor", "deslize o Interruptor sob o dado para mostrar a luz verde."),
          rl("Drag", `immediately advance the blue Aerodynamics marker 1 space ${icon("advance-blue", "advance blue marker")}. With all 3 deployed it sits between the 7 and the 8.`, "Arrasto", `avance na hora o marcador de Aerodinâmica azul 1 espaço ${icon("advance-blue", "avançar marcador azul")}. Com os 3 baixados ele fica entre o 7 e o 8.`),
          rl("Already green", "a die on a space whose Switch already shows green has no effect.", "Já verde", "um dado num espaço cujo Interruptor já mostra verde não tem efeito."),
          rl("Effect on speed", "a higher blue marker means more speed is needed to move: e.g. after one gear, a speed of 5 moves 0 spaces instead of 1.", "Efeito na velocidade", "marcador azul mais alto exige mais velocidade para andar: ex.: depois de um trem, velocidade 5 anda 0 espaços em vez de 1."),
          rl("Landing", "all 3 Switches must be green at the end of the game.", "Pouso", "os 3 Interruptores devem estar verdes no fim da partida.")
        ], 7, "st-pilot-card")}
        ${actionCard("flaps", t("CO-PILOT ONLY · ORANGE", "SÓ COPILOTO · LARANJA"), t("Flaps", "Flaps"), [
          t(`4 spaces for the ${copilot()}: 1/2, 2/3, 4/5 and 5/6. The die must show one of the printed numbers.`, `4 espaços para o ${copilot()}: 1/2, 2/3, 4/5 e 5/6. O dado deve mostrar um dos números impressos.`),
          rl("In order", "deploy from top to bottom: 1/2 first, then 2/3, then 4/5, then 5/6 (over one or several rounds).", "Em ordem", "baixe de cima para baixo: 1/2 primeiro, depois 2/3, depois 4/5, depois 5/6 (em uma ou várias rodadas)."),
          rl("Switch", "slide the Switch below the die to show the green light.", "Interruptor", "deslize o Interruptor sob o dado para mostrar a luz verde."),
          rl("Lift", `immediately advance the orange Aerodynamics marker 1 space ${icon("advance-orange", "advance orange marker")}. With all 4 deployed it sits just past the 12.`, "Sustentação", `avance na hora o marcador de Aerodinâmica laranja 1 espaço ${icon("advance-orange", "avançar marcador laranja")}. Com os 4 baixados ele fica logo depois do 12.`),
          rl("Effect on speed", "a higher orange marker makes the 2-space advance harder to reach.", "Efeito na velocidade", "marcador laranja mais alto torna o avanço de 2 espaços mais difícil."),
          interpretation("as with the Landing Gear, a die on a Flaps space already showing green has no effect.", "como no Trem de Pouso, um dado num espaço de Flaps que já mostra verde não tem efeito."),
          rl("Landing", "all 4 Switches must be green at the end of the game.", "Pouso", "os 4 Interruptores devem estar verdes no fim da partida.")
        ], 8, "st-copilot-card")}
        ${actionCard("brakes", t("PILOT ONLY · BLUE", "SÓ PILOTO · AZUL"), t("Brakes", "Freios"), [
          t(`3 spaces for the ${pilot()}, showing 2, 4 and 6: the die must show exactly that number.`, `3 espaços para o ${pilot()}, com 2, 4 e 6: o dado deve mostrar exatamente esse número.`),
          rl("In order", "the 2 first, then the 4, then the 6.", "Em ordem", "primeiro o 2, depois o 4, depois o 6."),
          rl("Marker", `immediately advance the red Brake marker 1 space ${icon("advance-red", "advance red marker")}. Example: the 2nd Brake moves it to between the 4 and the 5.`, "Marcador", `avance na hora o marcador de Freio vermelho 1 espaço ${icon("advance-red", "avançar marcador vermelho")}. Exemplo: o 2º Freio o leva para entre o 4 e o 5.`),
          interpretation("the rulebook's pictures show a Switch under each Brake turned to green once deployed; slide it as a reminder. As with the Landing Gear, a die on a Brake already showing green has no effect.", "as imagens do manual mostram um Interruptor sob cada Freio virado para o verde depois de baixado; deslize-o como lembrete. Como no Trem de Pouso, um dado num Freio que já mostra verde não tem efeito."),
          rl("Only at the end", "Brakes matter only in the final round; you do not have to deploy all of them, but deploying more makes landing easier.", "Só no fim", "os Freios só importam na rodada final; não é preciso baixar todos, mas quanto mais, mais fácil o pouso.")
        ], [9, 10], "st-pilot-card")}
        ${actionCard("concentration", t("BOTH · NO CONSTRAINT", "AMBOS · SEM RESTRIÇÃO"), t("Concentration", "Concentração"), [
          t(`Either player may place any die on any free Concentration space ${icon("concentration-space", "Concentration space")} (3 spaces, shared).`, `Qualquer jogador pode colocar qualquer dado em qualquer espaço livre de Concentração ${icon("concentration-space", "espaço de Concentração")} (3 espaços, compartilhados).`),
          rl("Coffee", "immediately take a Coffee token from the reserve and put it on one of the 3 Coffee spaces of the panel. Never more than 3.", "Café", "pegue na hora uma ficha de Café da reserva e ponha num dos 3 espaços de Café do painel. Nunca mais de 3."),
          interpretation("with 3 Coffee tokens already on the panel, a die on Concentration produces nothing (but is still a legal placement).", "com 3 fichas de Café já no painel, um dado na Concentração não produz nada (mas continua sendo uma colocação válida)."),
          rl("Spending Coffee", "whenever you place a die anywhere, spend any number of Coffee tokens: each changes that die by +1 or −1. Spent tokens go back to the reserve.", "Gastar Café", "sempre que colocar um dado em qualquer lugar, gaste quantas fichas de Café quiser: cada uma muda o dado em +1 ou −1. As gastas voltam para a reserva."),
          rl("Limits", "the result must stay between 1 and 6: a 1 cannot become a 6, nor a 6 a 1.", "Limites", "o resultado fica entre 1 e 6: um 1 não vira 6, nem um 6 vira 1."),
          rl("Shared and kept", "either player may use any Coffee, no matter who made it; unspent tokens stay for later rounds.", "Compartilhado e guardado", "qualquer jogador pode usar qualquer Café, não importa quem o gerou; os não gastos ficam para as rodadas seguintes.")
        ], 8)}
        ${actionCard("reroll", t("BOTH · TOKEN", "AMBOS · FICHA"), t("Reroll", "Rerrolagem"), [
          rl("Getting one", "at the start of a round, a Reroll token on the Current Altitude space (6,000 ft and 2,000 ft) goes to the supply at the top left of the panel.", "Como ganhar", "no início de uma rodada, uma ficha de Rerrolagem no espaço da Altitude Atual (6.000 e 2.000 pés) vai para a reserva no alto à esquerda do painel."),
          rl("Spending", "at any time during the round, either player may spend a Reroll token from the supply.", "Gastar", "a qualquer momento da rodada, qualquer jogador pode gastar uma ficha de Rerrolagem da reserva."),
          rl("Effect", "BOTH players may reroll one or more of the dice still behind their screen, once. Example: the Pilot rerolls 2 of their 3 dice, the Co-Pilot all 4.", "Efeito", "os DOIS jogadores podem rolar de novo um ou mais dados ainda atrás da tela, uma vez. Exemplo: o Piloto rola 2 dos seus 3 dados, o Copiloto os 4."),
          interpretation("an unspent Reroll token stays in the supply for later rounds; still no talking about dice.", "uma ficha de Rerrolagem não gasta fica na reserva para rodadas seguintes; continua proibido falar de dados.")
        ], [4, 9])}
      </div>`;
  }

  // ---------- iconography ----------

  function iconsSection() {
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), sectionIndex("icons"), [2, 3, 5, 6, 7, 8, 9, 11])}
      <p class="glossary-intro">${t("Each symbol is cropped individually from the rulebook. On the Control Panel, blue means Pilot, orange means Co-Pilot.", "Cada símbolo foi recortado individualmente do manual. No Painel de Controle, azul é o Piloto e laranja o Copiloto.")}</p>
      <h3 class="subhead">${t("Control Panel sections", "Seções do Painel de Controle")}</h3>
      <div class="icon-grid">
        ${iconCard("axis", "Axis", "Both players, 1 die each, mandatory. The difference between the two dice tilts the plane toward the higher die.", "Eixo", "Os dois jogadores, 1 dado cada, obrigatório. A diferença entre os dados inclina o avião para o dado maior.", 5)}
        ${iconCard("engines", "Engines", "Both players, 1 die each, mandatory. The sum is your speed, compared with the Aerodynamics markers.", "Motores", "Os dois jogadores, 1 dado cada, obrigatório. A soma é a velocidade, comparada com os marcadores de Aerodinâmica.", 6)}
        ${iconCard("radio", "Radio", "Pilot 1 space, Co-Pilot 2. Removes 1 Airplane token the die's value in spaces ahead (1 = Current Position).", "Rádio", "Piloto 1 espaço, Copiloto 2. Remove 1 ficha de Avião a tantos espaços quanto o valor do dado (1 = Posição Atual).", 7)}
        ${iconCard("landing-gear", "Landing Gear", "Pilot only: 1/2, 3/4, 5/6 in any order. Green Switch, blue marker +1.", "Trem de Pouso", "Só Piloto: 1/2, 3/4, 5/6 em qualquer ordem. Interruptor verde, marcador azul +1.", 7)}
        ${iconCard("flaps", "Flaps", "Co-Pilot only: 1/2, 2/3, 4/5, 5/6 from top to bottom. Green Switch, orange marker +1.", "Flaps", "Só Copiloto: 1/2, 2/3, 4/5, 5/6 de cima para baixo. Interruptor verde, marcador laranja +1.", 8)}
        ${iconCard("brakes", "Brakes", "Pilot only: exactly 2, then 4, then 6. Red Brake marker +1; matters in the final round.", "Freios", "Só Piloto: exatamente 2, depois 4, depois 6. Marcador de Freio vermelho +1; importa na rodada final.", 9)}
        ${iconCard("concentration", "Concentration", "Either player, any die: take 1 Coffee token (max. 3 on the panel).", "Concentração", "Qualquer jogador, qualquer dado: pegue 1 ficha de Café (máx. 3 no painel).", 8)}
        ${iconCard("concentration-space", "Concentration space", "The cup printed on the 3 shared Concentration spaces: any die of either colour can go there.", "Espaço de Concentração", "A xícara impressa nos 3 espaços compartilhados de Concentração: qualquer dado de qualquer cor pode ir ali.", 8)}
      </div>
      <h3 class="subhead">${t("Warnings and effects", "Avisos e efeitos")}</h3>
      <div class="icon-grid">
        ${iconCard("mandatory", "Mandatory", "Marks the Axis and Engine spaces: each needs 1 die of each colour by the end of every round, or you lose.", "Obrigatório", "Marca os espaços do Eixo e dos Motores: cada um precisa de 1 dado de cada cor até o fim de toda rodada, senão derrota.", 5)}
        ${iconCard("spin", "Spin mark (X)", "On the Axis dial. If the arrow reaches or passes it, the plane spins and you lose immediately.", "Marca de parafuso (X)", "No mostrador do Eixo. Se a seta a alcançar ou passar, o avião entra em parafuso e vocês perdem na hora.", 5)}
        ${iconCard("advance-blue", "Advance the blue marker", "Shown by the Landing Gear: move the blue Aerodynamics marker 1 space forward.", "Avançar o marcador azul", "Aparece no Trem de Pouso: mova o marcador de Aerodinâmica azul 1 espaço para a frente.", 7)}
        ${iconCard("advance-orange", "Advance the orange marker", "Shown by the Flaps: move the orange Aerodynamics marker 1 space forward.", "Avançar o marcador laranja", "Aparece nos Flaps: mova o marcador de Aerodinâmica laranja 1 espaço para a frente.", 8)}
        ${iconCard("advance-red", "Advance the Brake marker", "Shown by the Brakes: move the red Brake marker 1 space forward.", "Avançar o marcador de Freio", "Aparece nos Freios: mova o marcador de Freio vermelho 1 espaço para a frente.", 9)}
        ${iconCard("switch", "Switch on green", "A deployed Landing Gear, Flap or Brake. Victory needs all Landing Gear and Flaps Switches green.", "Interruptor no verde", "Um Trem de Pouso, Flap ou Freio baixado. A vitória exige todos os Interruptores do Trem de Pouso e dos Flaps no verde.", 11)}
        ${iconCard("horizontal", "Level Axis", "Victory condition C: the Axis arrow back on the black triangle at the top.", "Eixo nivelado", "Condição de vitória C: a seta do Eixo de volta no triângulo preto do topo.", 11)}
        ${iconCard("brakes-victory", "Brake marker on the track", "Victory condition D: your final speed must be lower than where this marker stands.", "Marcador de Freio na trilha", "Condição de vitória D: a velocidade final deve ser menor que a posição deste marcador.", 11)}
      </div>
      <h3 class="subhead">${t("Tracks, tokens and markers", "Trilhas, fichas e marcadores")}</h3>
      <div class="icon-grid">
        ${iconCard("cloud", "Cloud (start)", "First space of the YUL Approach Track; show it in the Current Position screen at setup.", "Nuvem (início)", "Primeiro espaço da Trilha de Aproximação YUL; deixe-a na tela de Posição Atual na preparação.", 3)}
        ${iconCard("traffic", "Traffic icon / Airplane token", "Each small Traffic icon on an Approach space gets 1 Airplane token at setup. Radio removes them.", "Ícone de Tráfego / ficha de Avião", "Cada pequeno ícone de Tráfego num espaço de Aproximação recebe 1 ficha de Avião na preparação. O Rádio as remove.", 3)}
        ${iconCard("reroll", "Reroll", "On the Altitude Track: place a Reroll token there; you collect it when that altitude is reached.", "Rerrolagem", "Na Trilha de Altitude: ponha uma ficha de Rerrolagem ali; vocês a pegam quando chegam a essa altitude.", 3)}
        ${iconCard("coffee", "Coffee token", "Made by Concentration; spend it for +1/−1 on a die being placed.", "Ficha de Café", "Gerada pela Concentração; gaste-a para +1/−1 num dado sendo colocado.", 3)}
        ${iconCard("aero-blue", "Blue Aerodynamics marker", "Lower speed threshold on the Speed Gauge; starts between 4 and 5.", "Marcador de Aerodinâmica azul", "Limite inferior de velocidade no Velocímetro; começa entre 4 e 5.", 3)}
        ${iconCard("aero-orange", "Orange Aerodynamics marker", "Upper speed threshold on the Speed Gauge; starts between 8 and 9.", "Marcador de Aerodinâmica laranja", "Limite superior de velocidade no Velocímetro; começa entre 8 e 9.", 3)}
        ${iconCard("brake-marker", "Red Brake marker", "On the Brake track; starts left of the 2.", "Marcador de Freio vermelho", "Na trilha de Freio; começa à esquerda do 2.", 3)}
        ${firstGame() ? iconCard("trash", "Trash can", "Punch-board parts with this symbol are thrown away before the first game.", "Lixeira", "Partes da cartela com este símbolo são jogadas fora antes da primeira partida.", 2) : ""}
      </div>`;
  }

  // ---------- examples ----------

  function examplesSection() {
    const examples = [
      [t("Axis tilt", "Inclinação do Eixo"), [
        t("Isabelle (Pilot) plays a 5 on the Axis; Oliver (Co-Pilot) plays a 3.", "Isabelle (Piloto) joga um 5 no Eixo; Oliver (Copiloto) joga um 3."),
        t("Difference: 2. The Axis turns two marks toward Isabelle and stays there.", "Diferença: 2. O Eixo gira duas marcas para o lado de Isabelle e fica assim.")
      ], 5],
      [t("Speed 4: stay put", "Velocidade 4: parados"), [
        t("Engines 1 + 3 = 4, below the blue marker (between 4 and 5).", "Motores 1 + 3 = 4, abaixo do marcador azul (entre 4 e 5)."),
        t("The Approach Track does not move.", "A Trilha de Aproximação não se move.")
      ], 6],
      [t("Speed 7: one space", "Velocidade 7: um espaço"), [
        t("Engines 3 + 4 = 7, between the two markers.", "Motores 3 + 4 = 7, entre os dois marcadores."),
        t("Advance the Approach Track 1 space.", "Avance a Trilha de Aproximação 1 espaço.")
      ], 6],
      [t("Speed 10: two spaces", "Velocidade 10: dois espaços"), [
        t("Engines 6 + 4 = 10, above the orange marker (between 8 and 9).", "Motores 6 + 4 = 10, acima do marcador laranja (entre 8 e 9)."),
        t("Advance the Approach Track 2 spaces.", "Avance a Trilha de Aproximação 2 espaços.")
      ], 6],
      [t("Radio 2", "Rádio 2"), [
        t("Isabelle plays a 2 on her only Radio space.", "Isabelle joga um 2 no seu único espaço de Rádio."),
        t("She removes an Airplane from the second space, one space after the Current Position.", "Ela remove um Avião do segundo espaço, um depois da Posição Atual.")
      ], 7],
      [t("First Landing Gear", "Primeiro Trem de Pouso"), [
        t("Isabelle places a 4 on the 3/4 Landing Gear space.", "Isabelle coloca um 4 no espaço 3/4 do Trem de Pouso."),
        t("She slides its Switch to green.", "Ela desliza o Interruptor para o verde."),
        t("She moves the blue marker to between the 5 and the 6.", "Ela move o marcador azul para entre o 5 e o 6.")
      ], 7],
      [t("Second Flap", "Segundo Flap"), [
        t("Oliver places a 2 on the second Flaps space (2/3).", "Oliver coloca um 2 no segundo espaço dos Flaps (2/3)."),
        t("He slides its Switch to green.", "Ele desliza o Interruptor para o verde."),
        t("He moves the orange marker to between the 10 and the 11.", "Ele move o marcador laranja para entre o 10 e o 11.")
      ], 8],
      [t("Coffee for the Radio", "Café para o Rádio"), [
        t("Isabelle has a 3 but wants to clear the Airplane in the Current Position.", "Isabelle tem um 3 mas quer liberar o Avião na Posição Atual."),
        t("She spends 2 Coffee tokens and turns her 3 into a 1.", "Ela gasta 2 fichas de Café e transforma o 3 em 1."),
        t("She places it on her Radio space and removes the Airplane from the Current Position.", "Ela o coloca no espaço de Rádio e remove o Avião da Posição Atual.")
      ], 8],
      [t("Second Brake", "Segundo Freio"), [
        t("Isabelle places a 4 on the 4 Brake space (the 2 is already deployed).", "Isabelle coloca um 4 no espaço 4 dos Freios (o 2 já está baixado)."),
        t("She moves the red marker one space, to between the 4 and the 5.", "Ela move o marcador vermelho um espaço, para entre o 4 e o 5.")
      ], 9],
      [t("A good landing", "Um bom pouso"), [
        t("Final round: Engines 1 + 2 = speed 3.", "Rodada final: Motores 1 + 2 = velocidade 3."),
        t("Brakes 2 and 4 are deployed, so the marker is between the 4 and the 5.", "Os Freios 2 e 4 estão baixados, então o marcador está entre o 4 e o 5."),
        t("3 is well left of the marker: condition D is met.", "3 fica bem à esquerda do marcador: a condição D está cumprida.")
      ], 10]
    ];
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), sectionIndex("examples"), examples.map((example) => example[2]))}
      <div class="example-grid">${examples.map(([title, items, page], index) => `
        <article class="example-card">
          <span class="card-number">${String(index + 1).padStart(2, "0")}</span>
          <h3>${title}</h3>
          ${lineList(items)}
          <div class="example-source"><span>${t("Rulebook example", "Exemplo do manual")}</span>${referenceLink(page)}</div>
        </article>`).join("")}</div>`;
  }

  // ---------- advice ----------

  function adviceSection() {
    const items = [
      rl("Briefing", "study the Approach Track: is it better to advance 0, 1 or 2 spaces? What could make you lose? What is urgent, what can wait?", "Briefing", "estudem a Trilha de Aproximação: é melhor avançar 0, 1 ou 2 espaços? O que pode fazer vocês perderem? O que é urgente, o que pode esperar?"),
      rl("Communication", "you talk before rolling; afterwards every die you place is also information for your partner.", "Comunicação", "vocês falam antes de rolar; depois, cada dado colocado também é informação para o parceiro."),
      rl("Placing dice", "think about what your partner needs: if they must open the first Flaps, put your higher dice on the Axis or Engines.", "Colocar dados", "pensem no que o parceiro precisa: se ele tem de abrir os primeiros Flaps, ponham seus dados mais altos no Eixo ou nos Motores."),
      rl("Axis", "it is dangerous if both wait for their last die to play there, but flexible: it only has to be level in the final round.", "Eixo", "é perigoso se os dois esperarem o último dado para jogar ali, mas é flexível: só precisa estar nivelado na rodada final."),
      rl("Concentration", "a discarded die is one action less; make Coffee early enough for your partner to use it.", "Concentração", "um dado descartado é uma ação a menos; façam Café cedo o bastante para o parceiro usar."),
      rl("Delaying", "letting your partner place the first die on the Axis or Engines can help them.", "Adiar", "deixar o parceiro colocar o primeiro dado no Eixo ou nos Motores pode ajudá-lo."),
      rl("Speed", "show your engine strength early when 0/1/2 spaces matters; if the track ahead is clear, play elsewhere first.", "Velocidade", "mostrem cedo a força do motor quando 0/1/2 espaços importa; se a trilha à frente está livre, joguem em outro lugar primeiro."),
      rl("Flaps & Landing Gear", "timing matters: need 2 spaces? don't open Flaps too soon. Crowded airport and want 0? Lower the Landing Gear.", "Flaps e Trem de Pouso", "o momento importa: precisam de 2 espaços? não abram os Flaps cedo demais. Aeroporto lotado e querem 0? Baixem o Trem de Pouso."),
      rl("Radio", "clearing space 1 or 2 is urgent information; space 5 less so. Clearing far ahead is useful, but not with your first die.", "Rádio", "liberar o espaço 1 ou 2 é informação urgente; o 5 nem tanto. Liberar longe é útil, mas não com o primeiro dado.")
    ];
    return `
      ${sectionHeading("advice", t("Strategic advice", "Conselhos estratégicos"), sectionIndex("advice"), [12])}
      <details class="st-advice">
        <summary>${t("The rulebook advises reading this only if you are having trouble landing. Open anyway", "O manual aconselha ler isto só se vocês estiverem tendo dificuldade para pousar. Abrir mesmo assim")}</summary>
        ${lineList(items)}
        ${referenceLink(12)}
      </details>`;
  }

  // ---------- glossary ----------

  function glossarySection() {
    const visible = [
      { term: ["Approach Track", "Trilha de Aproximação"], text: ["The airport's track in the top-left slot (YUL Montréal-Trudeau). It slides forward as you fly; Airplane tokens sit on its spaces.", "A trilha do aeroporto na fenda do alto à esquerda (YUL Montréal-Trudeau). Ela desliza para a frente conforme vocês voam; as fichas de Avião ficam nos espaços dela."], page: 3 },
      { term: ["Altitude Track", "Trilha de Altitude"], text: ["Track in the top-right slot, from 6000 down to the Airplane image: 7 spaces, 7 rounds. Its arrow shows who places first.", "Trilha na fenda do alto à direita, de 6000 até a imagem do Avião: 7 espaços, 7 rodadas. A seta mostra quem coloca primeiro."], page: 3 },
      { term: ["Current Position", "Posição Atual"], text: ["The Approach Track space visible in the top-left screen: where your plane is.", "O espaço da Trilha de Aproximação visível na tela do alto à esquerda: onde o seu avião está."], page: 3 },
      { term: ["Current Altitude", "Altitude Atual"], text: ["The Altitude Track space visible in the top-right screen.", "O espaço da Trilha de Altitude visível na tela do alto à direita."], page: 3 },
      { term: ["Speed", "Velocidade"], text: ["Sum of the 2 Engine dice in a round.", "Soma dos 2 dados dos Motores numa rodada."], page: 6 },
      { term: ["Aerodynamics markers", "Marcadores de Aerodinâmica"], text: ["Blue and orange markers on the Speed Gauge that turn your speed into 0, 1 or 2 spaces. Landing Gear moves blue; Flaps move orange.", "Marcadores azul e laranja no Velocímetro que transformam a velocidade em 0, 1 ou 2 espaços. O Trem de Pouso move o azul; os Flaps, o laranja."], page: 3 },
      { term: ["Holding pattern", "Espera (holding)"], text: ["Airport already in the Current Position but the Airplane image not yet in the Altitude screen: keep playing rounds without advancing the Approach Track (the Altitude Track still drops each round).", "Aeroporto já na Posição Atual mas a imagem do Avião ainda não está na tela de Altitude: continuem jogando rodadas sem avançar a Trilha de Aproximação (a Trilha de Altitude continua descendo a cada rodada)."], page: 10 },
      { term: ["Switch", "Interruptor"], text: ["Slider beside each Landing Gear, Flap and Brake space; slid to show green once deployed.", "Peça deslizante ao lado de cada espaço de Trem de Pouso, Flap e Freio; deslizada para mostrar verde quando baixada."], page: 2 },
      { term: ["Free space", "Espaço livre"], text: ["A space without a die this round.", "Um espaço sem dado nesta rodada."], page: 4 },
      { term: ["Screen", "Tela"], text: ["Each player's cardboard screen: dice are rolled and kept behind it; reminders are printed inside.", "A tela de papelão de cada jogador: os dados são rolados e mantidos atrás dela; há lembretes impressos dentro."], page: 3 }
    ];
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), sectionIndex("glossary"), visible.map((item) => item.page))}
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
    document.body.classList.add("theme-sky-team");
    document.documentElement.lang = state.language;
    document.title = t("Sky Team — Field Manual", "Sky Team — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Sky Team: Pilot and Co-Pilot quick reference, pre-flight setup checklist for YUL Montréal-Trudeau, every cockpit action, landing and losing conditions.",
        "Regras interativas bilíngues de Sky Team: referência rápida de Piloto e Copiloto, checklist de preparação para YUL Montréal-Trudeau, todas as ações da cabine, condições de pouso e de derrota."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook · Landing Procedure", "Livro interativo · Landing Procedure")}</p>
          <h1>Sky Team</h1>
          <p class="hero-intro">${t(
            "Take the controls of an airliner with your crewmate. Clear the traffic with the Control Tower, manage your speed, keep the wings level, lower the Landing Gear and Flaps, then brake on the runway — while silently sharing dice.",
            "Assumam os controles de um avião comercial com seu colega de cabine. Liberem o tráfego com a Torre de Controle, controlem a velocidade, mantenham as asas niveladas, baixem o Trem de Pouso e os Flaps e freiem na pista — dividindo os dados em silêncio."
          )}</p>
          <div class="hero-meta"><span>${t("2 players · cooperative", "2 jogadores · cooperativo")}</span><span>${t("About 20 min", "Cerca de 20 min")}</span><span>${t("Ages 14+", "14+ anos")}</span><span>${t("Dice placement", "Colocação de dados")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/sky-team.webp" alt="${t("First page of the Sky Team Landing Procedure rulebook", "Primeira página do manual Landing Procedure de Sky Team")}" fetchpriority="high"><figcaption>${t("Rulebook first page · illustrations by Eric Hibbeler and Adrien Rives", "Primeira página do manual · ilustrações de Eric Hibbeler e Adrien Rives")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("Flight deck", "Cabine")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column st-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied Sky Team “Landing Procedure” rulebook (Le Scorpion Masqué, 2023): the basic game at YUL Montréal-Trudeau. Points marked “Guide's reading” are interpretations where the rulebook is silent or only shows a picture. Page links use the rulebook's printed page numbers.",
            "Este guia cobre o manual fornecido de Sky Team, “Landing Procedure” (Le Scorpion Masqué, 2023): o jogo básico em YUL Montréal-Trudeau. Pontos marcados como “Leitura do guia” são interpretações onde o manual é omisso ou só mostra uma imagem. Os links de página usam a numeração impressa do manual."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${victorySection()}</section>
          <section class="rule-section">${roundSection()}</section>
          <section class="rule-section">${actionsSection()}</section>
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${adviceSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the Sky Team “Landing Procedure” rulebook. Design: Luc Rémond; illustrations: Eric Hibbeler and Adrien Rives. Published by Le Scorpion Masqué.",
        "Guia pessoal de consulta baseado no manual “Landing Procedure” de Sky Team. Design: Luc Rémond; ilustrações: Eric Hibbeler e Adrien Rives. Publicado pela Le Scorpion Masqué."
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
      root.querySelector(".st-page")?.prepend(notice);
    }
    notice.textContent = storageNoticeText();
  }

  function changePreference(patch) {
    const before = signature();
    state = normalizePreferences({ ...state, ...patch });
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
    if (target.matches("[data-box]")) {
      if (BOX_CHOICES.includes(target.dataset.box) && target.dataset.box !== state.box) {
        changePreference({ box: target.dataset.box });
      }
      return;
    }
    if (target.matches("[data-approach]")) {
      if (APPROACH_CHOICES.includes(target.dataset.approach) && target.dataset.approach !== state.approach) {
        changePreference({ approach: target.dataset.approach });
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

  window.SkyTeam = { renderInto, onClick, onChange };
})();
