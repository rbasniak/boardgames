(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.deadwood-1876.v1";
  const SETUP_KEY = "field-manual.deadwood-1876.setup.v1";
  const MANUAL_FILE = "deadwood-1876_core.pdf";
  const ICONS = "assets/deadwood-1876/icons/";

  const PLAYER_CHOICES = [2, 3, 4, 5, 6, 7, 8, 9];
  const MYSTERY_CHOICES = [0, 1, 2, 3, 4, 5];
  const YES_NO = ["yes", "no"];
  const defaults = { language: "pt-BR", players: 4, mystery: 0, horseThief: "no", peace: "no", fairShare: "no" };
  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------

  function normalizePreferences(saved) {
    const players = PLAYER_CHOICES.includes(Number(saved?.players)) ? Number(saved.players) : defaults.players;
    const mystery = MYSTERY_CHOICES.includes(Number(saved?.mystery)) ? Number(saved.mystery) : defaults.mystery;
    const yesNo = (value) => (YES_NO.includes(value) ? value : "no");
    return {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      players,
      mystery,
      // Horse Thief does not apply in 2-3 player games; Fair Share is only for 6-9 players (p. 13).
      horseThief: players >= 4 ? yesNo(saved?.horseThief) : "no",
      peace: yesNo(saved?.peace),
      fairShare: players >= 6 ? yesNo(saved?.fairShare) : "no"
    };
  }

  function signature(source = state) {
    return `${source.players}|${source.mystery}`;
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Deadwood 1876 preferences.", error);
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
      console.error("Could not read Deadwood 1876 setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Deadwood 1876 preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Deadwood 1876 setup progress.", error);
    }
  }

  // ---------- derived match values ----------

  function rules(source = state) {
    const p = source.players;
    const small = p <= 3;
    const heists = p >= 8 ? 2 : 3;
    return {
      players: p,
      small,
      stranger: p === 2,
      establishments: small ? 2 : 3,
      capacity: p <= 5 ? 2 : p <= 8 ? 3 : 4,
      hand: p >= 8 ? 3 : 4,
      heists,
      circlesPerHeist: small ? 2 : 1,
      turns: small ? 8 : heists + 1,
      stetson: small ? 1 : 2,
      holsterAttach: small,
      horseThiefAllowed: p >= 4,
      fairShareAllowed: p >= 6,
      safePool: 20 + source.mystery,
      safesDealt: heists + 2 * p,
      mystery: source.mystery
    };
  }

  function starPlacement(p) {
    // Stars are placed one at a time clockwise from the Gem Theatre (p. 3).
    // 2-3 players: no Grand Central Hotel. 4 players: no stars placed in the Grand Central Hotel.
    const order = p <= 4 ? ["gem", "saloon"] : ["gem", "saloon", "grand"];
    const counts = { gem: 0, saloon: 0, grand: 0 };
    for (let i = 0; i < p; i += 1) {
      counts[order[i % order.length]] += 1;
    }
    return counts;
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  // The PDF is a cover, then two-page spreads (printed 2-3, 4-5 … 18-19), then the back page.
  function pdfPage(page) {
    return page <= 1 ? 1 : Math.floor(page / 2) + 1;
  }

  function manualUrl(page) {
    const script = document.querySelector('script[src*="deadwood-1876.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${MANUAL_FILE}`, baseUrl).href}#page=${pdfPage(page)}`;
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
          <p class="eyebrow">${t("DEADWOOD", "DEADWOOD")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="dw-section-references">${uniquePages(pages).map(referenceLink).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
  }

  function icon(file, alt) {
    return `<img class="dw-inline-icon" src="${ICONS}${file}.webp" alt="${alt}">`;
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

  function actionCard(file, label, title, lines, pages, extraClass = "") {
    return `
      <article class="info-card dw-action-card ${extraClass}">
        <div class="dw-action-head"><img src="${ICONS}${file}.webp" alt=""><div><span class="component-label">${label}</span><h3>${title}</h3></div></div>
        ${lineList(lines)}
        ${(Array.isArray(pages) ? pages : [pages]).map(referenceLink).join(" ")}
      </article>`;
  }

  function interpretation(en, pt) {
    return `<span class="dw-interpretation">${t("Guide's reading", "Leitura do guia")}</span> ${t(en, pt)}`;
  }

  function gunName(key) {
    return {
      messenger: "Messenger",
      winchester: "Winchester",
      colt: "Colt",
      deringer: "Deringer",
      pepperbox: "Pepperbox"
    }[key];
  }

  function playersLabel(p = state.players) {
    return t(`${p} players`, `${p} jogadores`);
  }

  function mysteryLabel(m = state.mystery) {
    return m === 0
      ? t("No Mystery Safes", "Sem Cofres Misteriosos")
      : t(`${m} Mystery Safe${m === 1 ? "" : "s"}`, `${m} Cofre${m === 1 ? "" : "s"} Misterioso${m === 1 ? "" : "s"}`);
  }

  function yesNoLabel(value) {
    return value === "yes" ? t("On", "Ligada") : t("Off", "Desligada");
  }

  function establishmentList(r = rules()) {
    return r.establishments === 2
      ? t("the Gem Theatre and the Saloon", "o Gem Theatre e o Saloon")
      : t("the Gem Theatre, the Saloon and the Grand Central Hotel", "o Gem Theatre, o Saloon e o Grand Central Hotel");
  }

  function handText(r = rules()) {
    return t(`${r.hand} cards`, `${r.hand} cartas`);
  }

  // ---------- header ----------

  function sectionList() {
    const list = [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["game-flow", t("Game flow", "Fluxo da partida")],
      ["turn", t("Your turn", "O seu turno")],
      ["laws", t("Laws of Deadwood", "Leis de Deadwood")],
      ["heist", t("Heist", "Assalto")],
      ["badge-round", t("Badge Round", "Rodada dos Distintivos")],
      ["showdown", t("Final Showdown", "Confronto Final")]
    ];
    if (rules().small) {
      list.push(["small-game", rules().stranger ? t("2-player rules", "Regras para 2") : t("3-player rules", "Regras para 3")]);
    }
    list.push(
      ["cards", t("Card details", "Detalhes das cartas")],
      ["icons", t("Iconography", "Iconografia")],
      ["stats", t("Odds & counts", "Chances e contagens")],
      ["examples", t("Examples", "Exemplos")],
      ["advice", t("Strategy tips", "Dicas de estratégia")],
      ["glossary", t("Glossary", "Glossário")]
    );
    return list;
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
          <span class="brand-mark" aria-hidden="true">DW</span>
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
      `${readFailed ? "This browser could not read the saved Deadwood 1876 match or setup progress; defaults are shown. " : ""}${writeFailed ? "The latest change could not be saved and is visible on screen only." : ""}`,
      `${readFailed ? "Este navegador não conseguiu ler a partida ou o progresso de Deadwood 1876 salvos; as opções padrão estão sendo mostradas. " : ""}${writeFailed ? "A alteração mais recente não pôde ser salva e aparece somente na tela." : ""}`
    ).trim();
  }

  // ---------- configuration ----------

  function choiceCard(name, value, attrs, checked, title, description) {
    return `
      <label class="dw-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" ${attrs} ${checked ? "checked" : ""}>
        <span class="dw-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function playerChoiceText(p) {
    const r = rules({ ...state, players: p });
    const parts = [
      t(`${r.establishments} establishments, up to ${r.capacity} per establishment`, `${r.establishments} estabelecimentos, até ${r.capacity} por estabelecimento`),
      t(`hand of ${r.hand}`, `mão de ${r.hand}`),
      t(`${r.heists} Heists, ${r.turns} turns each`, `${r.heists} Assaltos, ${r.turns} turnos cada`)
    ];
    if (r.small) {
      parts.push(t("2-3 player adjustments (Stetson views 1 Safe, Holsters attached on your turn)", "ajustes para 2-3 (Stetson vê 1 Cofre, Coldres presos no seu turno)"));
    }
    if (r.stranger) {
      parts.push(t("plus “the Stranger”, a non-acting third character your opponent plays for", "mais “o Forasteiro”, um terceiro personagem sem turnos que o oponente controla"));
    }
    if (p === 4) {
      parts.push(t("no stars start in the Grand Central Hotel", "nenhuma estrela começa no Grand Central Hotel"));
    }
    return `${parts.join(" · ")}.`;
  }

  function dataAttr(key) {
    return `data-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
  }

  function yesNoGroup(key, title, summary, intro, yesText, noText, pages) {
    return `
      <fieldset class="dw-choice-group">
        <legend>${title} · ${t("selected:", "selecionado:")} <span>${summary}</span></legend>
        <p class="dw-choice-intro">${intro} ${pages.map(referenceLink).join(" ")}</p>
        <div class="dw-choice-grid">
          ${choiceCard(`dw-${key}`, "yes", `${dataAttr(key)}="yes"`, state[key] === "yes", t("Yes", "Sim"), yesText)}
          ${choiceCard(`dw-${key}`, "no", `${dataAttr(key)}="no"`, state[key] === "no", t("No", "Não"), noText)}
        </div>
      </fieldset>`;
  }

  function matchConfiguration() {
    const r = rules();
    return `
      <section class="controls-panel dw-config" id="build-match" aria-labelledby="dw-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="dw-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "Deadwood 1876 plays 2 to 9. The player count changes the establishments, hand size, number of Heists and turns; 2-3 player games add special adjustments. The rulebook's optional advanced rules are meant for experienced groups. The player count and Mystery Safes filter the setup checklist; the other options change the rules shown below.",
              "Deadwood 1876 é para 2 a 9 jogadores. O número de jogadores muda os estabelecimentos, o tamanho da mão, o número de Assaltos e de turnos; partidas com 2-3 têm ajustes especiais. As regras avançadas opcionais do manual são para grupos experientes. O número de jogadores e os Cofres Misteriosos filtram a checklist de preparação; as outras opções mudam as regras mostradas abaixo."
            )}</p>
          </div>
        </div>
        <fieldset class="dw-choice-group">
          <legend>${t("Players · selected:", "Jogadores · selecionado:")} <span>${playersLabel()}</span></legend>
          <p class="dw-choice-intro">${t("Establishment capacity, hand size and the number of Safes in the Heist stack all depend on this.", "A capacidade dos estabelecimentos, o tamanho da mão e o número de Cofres na pilha de Assalto dependem disto.")} ${referenceLink(3)} ${referenceLink(5)} ${referenceLink(14)}</p>
          <div class="dw-choice-grid dw-choice-grid-players">
            ${PLAYER_CHOICES.map((p) => choiceCard("dw-players", p, `data-players="${p}"`, state.players === p, playersLabel(p), playerChoiceText(p))).join("")}
          </div>
        </fieldset>
        <fieldset class="dw-choice-group">
          <legend>${t("Mystery Safes (advanced) · selected:", "Cofres Misteriosos (avançado) · selecionado:")} <span>${mysteryLabel()}</span></legend>
          <p class="dw-choice-intro">${t(
            "The 5 silver-bordered Safes. Normally they all go back in the box. An experienced group “may shuffle in any number” of them in setup step 4. Their effects are secret until the end: three of them carry a star and are revealed right after the Badge Round.",
            "Os 5 Cofres de borda prateada. Normalmente todos voltam para a caixa. Um grupo experiente “pode embaralhar qualquer número” deles na etapa 4 da preparação. Os efeitos ficam secretos até o fim: três deles têm uma estrela e são revelados logo depois da Rodada dos Distintivos."
          )} ${referenceLink(3)} ${referenceLink(12)}</p>
          <div class="dw-choice-grid dw-choice-grid-players">
            ${MYSTERY_CHOICES.map((m) => choiceCard("dw-mystery", m, `data-mystery="${m}"`, state.mystery === m, mysteryLabel(m), m === 0
              ? t("Basic game: all 5 silver-bordered Safes stay in the box. Only Badges, Gold and Showdown Guns are in the Safe deck.", "Jogo básico: os 5 Cofres de borda prateada ficam na caixa. Só Distintivos, Ouro e Armas do Confronto estão no baralho de Cofres.")
              : m === 5
                ? t("All 5 (Bad Sarsaparilla, Cash, Dagger, Explosives, Poker Deck) are shuffled into the Safes. Some may still end up in the unused pile.", "Os 5 (Bad Sarsaparilla, Cash, Dagger, Explosives, Poker Deck) entram no embaralhamento dos Cofres. Alguns ainda podem acabar na pilha não usada.")
                : t(`Shuffle ${m} silver-bordered Safe${m === 1 ? "" : "s"}, drawn face down at random, into the Safes. Nobody knows which.`, `Embaralhe ${m} Cofre${m === 1 ? "" : "s"} de borda prateada, tirado${m === 1 ? "" : "s"} virado${m === 1 ? "" : "s"} para baixo ao acaso, nos Cofres. Ninguém sabe qual.`))).join("")}
          </div>
          ${state.mystery > 0 && state.mystery < 5 ? `<p class="dw-choice-note">${interpretation("the rulebook only says “any number”. Picking them face down at random keeps the effects secret; a group may instead agree on which ones to use.", "o manual só diz “qualquer número”. Escolhê-los virados para baixo ao acaso mantém os efeitos secretos; o grupo pode, em vez disso, combinar quais usar.")}</p>` : ""}
        </fieldset>
        ${r.horseThiefAllowed ? yesNoGroup("horseThief", t("Horse Thief (advanced)", "Ladrão de Cavalos (avançado)"), yesNoLabel(state.horseThief),
          t("Changes how white Horse cards can be used. Does not change the setup.", "Muda o uso das cartas de Cavalo brancas. Não muda a preparação."),
          t("Out of turn, right after attacker and defender lay down guns for a Robbery, anyone else may play a white Horse to join and try to take the Safe themselves.", "Fora do turno, logo depois de atacante e defensor baixarem as armas num Roubo, qualquer outro jogador pode jogar um Cavalo branco para entrar e tentar levar o Cofre."),
          t("Horse colour does not matter; Horses only move your star on your turn.", "A cor do Cavalo não importa; Cavalos só movem a sua estrela no seu turno."), [10, 13]) : `<p class="dw-choice-note">${t("Horse Thief (advanced) is not available: the rulebook says it does not apply in 2-3 player games.", "Ladrão de Cavalos (avançado) não está disponível: o manual diz que não se aplica a partidas com 2-3 jogadores.")} ${referenceLink(13)}</p>`}
        ${yesNoGroup("peace", t("“Peace-Lovin'” Team Victory (advanced)", "Vitória em equipe “Peace-Lovin'” (avançado)"), yesNoLabel(state.peace),
          t("Changes only the Final Showdown.", "Muda só o Confronto Final."),
          t("If nobody who advances to the Final Showdown owns a Showdown Gun, all advancing players win together. Otherwise they fight to the death as normal.", "Se ninguém que avança para o Confronto Final tiver Arma do Confronto, todos os que avançaram vencem juntos. Senão, lutam até a morte normalmente."),
          t("Advancing players always fight to the death (unless only one advances).", "Os que avançam sempre lutam até a morte (a menos que só um avance)."), [13])}
        ${r.fairShareAllowed ? yesNoGroup("fairShare", t("“Fair Share” Team Victory (advanced)", "Vitória em equipe “Fair Share” (avançado)"), yesNoLabel(state.fairShare),
          t("Only for 6-9 players. Changes only the Final Showdown.", "Só para 6-9 jogadores. Muda só o Confronto Final."),
          t("If everyone in the Final Showdown has at least 1 Gold in their own Safes, all advancing players win together. If any of them has zero or negative Gold, they fight to the death as normal.", "Se todos no Confronto Final tiverem pelo menos 1 de Ouro nos próprios Cofres, todos os que avançaram vencem juntos. Se algum tiver Ouro zero ou negativo, lutam até a morte normalmente."),
          t("Gold only decides which establishment advances.", "O Ouro só decide qual estabelecimento avança."), [13]) : `<p class="dw-choice-note">${t("“Fair Share” Team Victory (advanced) is only for 6-9 player games, so it is not offered here.", "A vitória em equipe “Fair Share” (avançado) é só para 6-9 jogadores, então não aparece aqui.")} ${referenceLink(13)}</p>`}
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function placementText(r) {
    const counts = starPlacement(r.players);
    const parts = [
      t(`Gem Theatre ${counts.gem}`, `Gem Theatre ${counts.gem}`),
      t(`Saloon ${counts.saloon}`, `Saloon ${counts.saloon}`)
    ];
    if (r.establishments === 3) {
      parts.push(t(`Grand Central Hotel ${counts.grand}`, `Grand Central Hotel ${counts.grand}`));
    }
    return parts.join(" · ");
  }

  function setupPhases() {
    const r = rules();
    const phases = [];
    phases.push({
      id: "establishments",
      title: t("Establishments", "Estabelecimentos"),
      pages: [3, 5],
      items: [
        r.establishments === 3
          ? t(`Place the 3 wooden establishment platforms ${icon("gem-theatre", "Gem Theatre")}${icon("saloon", "Saloon")}${icon("grand-central", "Grand Central Hotel")} in the middle of the table.`, `Coloque as 3 plataformas de madeira dos estabelecimentos ${icon("gem-theatre", "Gem Theatre")}${icon("saloon", "Saloon")}${icon("grand-central", "Grand Central Hotel")} no meio da mesa.`)
          : t(`Place only the Gem Theatre ${icon("gem-theatre", "Gem Theatre")} and the Saloon ${icon("saloon", "Saloon")} platforms in the middle of the table. The Grand Central Hotel goes back in the box: 2-3 player games use only 2 establishments.`, `Coloque só as plataformas do Gem Theatre ${icon("gem-theatre", "Gem Theatre")} e do Saloon ${icon("saloon", "Saloon")} no meio da mesa. O Grand Central Hotel volta para a caixa: partidas com 2-3 usam só 2 estabelecimentos.`),
        r.establishments === 3
          ? interpretation("arrange them so that, going clockwise, the Gem Theatre comes first and the Grand Central Hotel last — star placement and the 4-player rule assume that order.", "arrume-as de modo que, no sentido horário, o Gem Theatre venha primeiro e o Grand Central Hotel por último — a colocação das estrelas e a regra de 4 jogadores pressupõem essa ordem.")
          : "",
        t(`Capacity for ${r.players} players: at most ${r.capacity} stars in each establishment at any time. Horses and Duels can only send someone where there is a vacancy.`, `Capacidade com ${r.players} jogadores: no máximo ${r.capacity} estrelas em cada estabelecimento a qualquer momento. Cavalos e Duelos só mandam alguém para onde houver vaga.`)
      ]
    });
    phases.push({
      id: "characters",
      title: t("Characters and stars", "Personagens e estrelas"),
      pages: [3],
      items: [
        t(`Each player chooses 1 of the 9 character cards and places it in front of them, colour side up${r.stranger ? " (the Stranger's character is chosen later)" : ""}.`, `Cada jogador escolhe 1 das 9 cartas de personagem e a coloca à sua frente, com o lado colorido para cima${r.stranger ? " (o personagem do Forasteiro é escolhido depois)" : ""}.`),
        t(`Put the ${r.players} wooden stars matching the chosen characters' colours into the linen bag. The other stars go back in the box${r.stranger ? " — except one more star of a colour nobody chose, with its character card, set aside for the Stranger" : ""}.`, `Ponha no saco de linho as ${r.players} estrelas de madeira das cores dos personagens escolhidos. As outras estrelas voltam para a caixa${r.stranger ? " — exceto mais uma estrela de uma cor que ninguém escolheu, com a carta de personagem dela, separada para o Forasteiro" : ""}.`),
        r.stranger ? interpretation("the rulebook only says the Stranger gets a star and its matching character card; take them from the unused ones now.", "o manual só diz que o Forasteiro recebe uma estrela e a carta de personagem correspondente; separe-as agora entre as não usadas.") : "",
        t(`Draw the stars out of the bag one at a time, placing them in establishments in turn, starting with the Gem Theatre and going clockwise${r.players === 4 ? " — but with 4 players skip the Grand Central Hotel: no star starts there (players may still move there later)" : ""}. Your star is you.`, `Tire as estrelas do saco uma a uma, colocando-as nos estabelecimentos em sequência, começando pelo Gem Theatre e seguindo no sentido horário${r.players === 4 ? " — mas com 4 jogadores pule o Grand Central Hotel: nenhuma estrela começa lá (os jogadores ainda podem se mudar para lá depois)" : ""}. A sua estrela representa você.`),
        t(`Result for ${r.players} players: ${placementText(r)}. Players whose stars share an establishment are teammates — for now.`, `Resultado com ${r.players} jogadores: ${placementText(r)}. Quem tem estrela no mesmo estabelecimento é da mesma equipe — por enquanto.`)
      ]
    });
    phases.push({
      id: "deadwood-deck",
      title: t("Deadwood cards", "Cartas Deadwood"),
      pages: [3],
      items: [
        t("Shuffle all 50 Deadwood cards (each has a gun on top and a special item on the bottom).", "Embaralhe as 50 cartas Deadwood (cada uma tem uma arma em cima e um item especial embaixo)."),
        t(`Deal ${r.hand} face down to each player: this is your secret hand. Never show it to anyone.`, `Dê ${r.hand} viradas para baixo a cada jogador: esta é a sua mão secreta. Nunca a mostre a ninguém.`),
        t("Put the rest face down in the middle as the draw deck; leave room beside it for a discard pile.", "Ponha o resto virado para baixo no meio como baralho de compra; deixe espaço ao lado para a pilha de descarte."),
        t("Put the 10 dice in reach of everyone: each colour is one gun (see Iconography).", "Deixe os 10 dados ao alcance de todos: cada cor é uma arma (veja Iconografia).")
      ]
    });
    const remaining = r.safePool - r.safesDealt;
    phases.push({
      id: "safes",
      title: t("Safes", "Cofres"),
      pages: r.mystery ? [3, 12] : [3],
      items: [
        t("Find the 5 Safes with a silver border on the front (the Mystery Safes) and put them back in the box.", "Encontre os 5 Cofres com borda prateada na frente (os Cofres Misteriosos) e devolva-os à caixa."),
        r.mystery
          ? t(`Mystery Safes option: without looking at their fronts, take ${r.mystery === 5 ? "all 5" : `${r.mystery} of them at random`} back out and add ${r.mystery === 1 ? "it" : "them"} to the other Safes.`, `Opção de Cofres Misteriosos: sem olhar a frente, tire ${r.mystery === 5 ? "os 5" : `${r.mystery} deles ao acaso`} de volta e junte-os aos outros Cofres.`)
          : "",
        t(`Shuffle the ${r.safePool} Safes.`, `Embaralhe os ${r.safePool} Cofres.`),
        t(`Place ${r.heists} of them face down in a stack in the middle: the Heist stack (one Safe per Heist).`, `Coloque ${r.heists} deles virados para baixo numa pilha no meio: a pilha de Assalto (um Cofre por Assalto).`),
        t(`Deal 2 Safes face down to each player (${2 * r.players} in total).`, `Dê 2 Cofres virados para baixo a cada jogador (${2 * r.players} no total).`),
        r.stranger
          ? t(`Set the remaining ${remaining} Safes aside face down without looking at them; 2 of them go to the Stranger in the last step, the rest are not in play.`, `Separe os ${remaining} Cofres restantes virados para baixo sem olhá-los; 2 deles vão para o Forasteiro na última etapa, o resto fica fora do jogo.`)
          : t(`Put the remaining ${remaining} Safes back in the box without looking at them. They are not in play.`, `Devolva os ${remaining} Cofres restantes à caixa sem olhá-los. Eles ficam fora do jogo.`)
      ]
    });
    phases.push({
      id: "pass-safes",
      title: t("Pass one Safe and lay out your row", "Passe um Cofre e monte a sua fileira"),
      pages: [4, 8],
      items: [
        t("Everyone secretly looks at their 2 Safes.", "Todos olham em segredo os seus 2 Cofres."),
        t("Each player chooses 1 of them and passes it face down to the player on their left.", "Cada jogador escolhe 1 deles e o passa virado para baixo ao jogador da esquerda."),
        t("Look at your new set of 2, shuffle them, and place them face down in a row in front of you. From now on they keep their positions (1st Law).", "Olhe o seu novo par, embaralhe e coloque os dois virados para baixo numa fileira à sua frente. A partir de agora eles mantêm a posição (1ª Lei)."),
        t("You may look at your own Safes at any time, but never show them to anyone.", "Você pode olhar os próprios Cofres a qualquer momento, mas nunca os mostre a ninguém.")
      ]
    });
    if (r.stranger) {
      phases.push({
        id: "stranger",
        title: t("The Stranger", "O Forasteiro"),
        pages: [14],
        items: [
          t("Both players roll a black (Messenger) die. The higher roller places the Stranger's star in their own establishment and puts the Stranger's character card on the table.", "Os dois jogadores rolam um dado preto (Messenger). Quem tirar mais coloca a estrela do Forasteiro no próprio estabelecimento e põe a carta de personagem do Forasteiro na mesa."),
          interpretation("on a tie, roll again.", "em caso de empate, rolem de novo."),
          t("Give the Stranger 2 face-down Safes from the unused pile (the rulebook says “from the box”); nobody looks at them. Lay them in a row in front of the Stranger's character card.", "Dê ao Forasteiro 2 Cofres virados para baixo da pilha não usada (o manual diz “da caixa”); ninguém olha. Coloque-os em fileira na frente da carta de personagem do Forasteiro."),
          interpretation("take them from the Safes you set aside without looking in the Safes step; the silver-bordered ones that were not shuffled in stay out.", "pegue-os entre os Cofres separados sem olhar na etapa dos Cofres; os de borda prateada que não foram embaralhados ficam de fora.")
        ]
      });
    }
    phases.push({
      id: "first-player",
      title: t("First player", "Primeiro jogador"),
      pages: [4],
      items: [
        t("Everyone rolls a black (Messenger) die. The highest roller goes first; play proceeds clockwise.", "Todos rolam um dado preto (Messenger). Quem tirar mais começa; o jogo segue no sentido horário."),
        interpretation("players tied for highest roll again.", "quem empatar no maior valor rola de novo."),
        t("Hint from the rulebook: put the game box between the first and the last player so you remember when a circle is complete.", "Dica do manual: ponha a caixa do jogo entre o primeiro e o último jogador para lembrar quando uma volta se completa.")
      ]
    });
    return phases;
  }

  function inventory() {
    const r = rules();
    return `<div class="quick-grid">
      ${infoCard(t("TABLE", "MESA"), t("Shared components", "Componentes compartilhados"), [
        t(`${r.establishments} establishment platforms (${establishmentList(r)}).`, `${r.establishments} plataformas de estabelecimento (${establishmentList(r)}).`),
        t(`${r.players + (r.stranger ? 1 : 0)} wooden stars in the characters' colours${r.stranger ? " (one is the Stranger)" : ""}; the linen bag to draw them.`, `${r.players + (r.stranger ? 1 : 0)} estrelas de madeira nas cores dos personagens${r.stranger ? " (uma é o Forasteiro)" : ""}; o saco de linho para sorteá-las.`),
        t("10 wooden dice in the five gun colours.", "10 dados de madeira nas cinco cores das armas."),
        interpretation("the contents photo shows 2 dice of each colour.", "a foto do conteúdo mostra 2 dados de cada cor."),
        t("2 reference cards (odds table and card summary) for the table.", "2 cartas de referência (tabela de chances e resumo das cartas) para a mesa.")
      ], [2])}
      ${infoCard(t("DEADWOOD DECK", "BARALHO DEADWOOD"), t("50 Deadwood cards", "50 cartas Deadwood"), [
        t("Top: a gun — 10 cards each of Messenger, Winchester, Colt, Deringer, Pepperbox.", "Em cima: uma arma — 10 cartas de cada: Messenger, Winchester, Colt, Deringer, Pepperbox."),
        t("Bottom: an item — 10 Horse, 12 Duster, 13 Stetson, 15 Holster.", "Embaixo: um item — 10 Cavalo, 12 Sobretudo (Duster), 13 Stetson, 15 Coldre (Holster)."),
        t(`${r.hand * r.players} dealt to hands (${r.hand} each), ${50 - r.hand * r.players} in the draw deck.`, `${r.hand * r.players} distribuídas nas mãos (${r.hand} cada), ${50 - r.hand * r.players} no baralho de compra.`)
      ], [2, 11])}
      ${infoCard(t("SAFE DECK", "BARALHO DE COFRES"), t("25 Safe cards", "25 cartas de Cofre"), [
        t("5 Badges, 7 Showdown Guns, 8 Gold values — 20 normal Safes.", "5 Distintivos, 7 Armas do Confronto, 8 valores de Ouro — 20 Cofres normais."),
        t("5 silver-bordered Mystery Safes.", "5 Cofres Misteriosos de borda prateada."),
        t(`This match: ${r.safePool} shuffled (${mysteryLabel()}), ${r.heists} in the Heist stack, ${2 * r.players} dealt${r.stranger ? ", 2 to the Stranger" : ""}, ${r.safePool - r.safesDealt - (r.stranger ? 2 : 0)} unused.`, `Nesta partida: ${r.safePool} embaralhados (${mysteryLabel()}), ${r.heists} na pilha de Assalto, ${2 * r.players} distribuídos${r.stranger ? ", 2 para o Forasteiro" : ""}, ${r.safePool - r.safesDealt - (r.stranger ? 2 : 0)} sem uso.`)
      ], [2, 3, 11])}
      ${infoCard(t("EACH PLAYER", "CADA JOGADOR"), t("In front of you", "À sua frente"), [
        t("1 character card, colour side up (black-and-white side is your wounded side in the Final Showdown).", "1 carta de personagem, lado colorido para cima (o lado preto e branco é o lado ferido no Confronto Final)."),
        t(`${r.hand} Deadwood cards in your secret hand.`, `${r.hand} cartas Deadwood na mão secreta.`),
        t("2 Safes face down in a row.", "2 Cofres virados para baixo em fileira."),
        t("Your star on an establishment platform.", "A sua estrela numa plataforma de estabelecimento.")
      ], [3, 4])}
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
        <label class="dw-setup-check" for="dw-setup-${phase.id}">
          <input id="dw-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="dw-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="dw-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), sectionIndex("setup"), state.mystery ? [2, 3, 4, 12] : [2, 3, 4])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("SET UP THE TOWN", "PREPARE A CIDADE")}</p>
            <h3>${t("Set up this match", "Prepare esta partida")} · ${playersLabel()} · ${mysteryLabel()}</h3>
            <p>${t("One checkbox per coherent step. Every substep must be done before you check it.", "Uma caixa por etapa coerente. Todos os subpassos devem estar feitos antes de marcá-la.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved separately from the match configuration and language. Changing the player count or the Mystery Safes clears this checklist; changing the language or the Horse Thief / team-victory options does not. “Uncheck all” clears only these setup boxes.",
          "O progresso é salvo separadamente da configuração da partida e do idioma. Trocar o número de jogadores ou os Cofres Misteriosos limpa esta lista; trocar o idioma ou as opções de Ladrão de Cavalos / vitória em equipe não. “Desmarcar tudo” limpa somente as caixas da preparação."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}`;
  }

  // ---------- quick reference ----------

  function quickReference() {
    const r = rules();
    const turnLines = [
      rl("Play 1 card", "from your hand, used EITHER as its item (bottom) OR as its gun (top).", "Jogue 1 carta", "da mão, usada OU como item (embaixo) OU como arma (em cima)."),
      rl("Item", `Horse (move), Stetson (peek at ${r.stetson === 1 ? "1 Safe" : "2 Safes"}), Duster (draw 4, discard 3)${r.holsterAttach ? ", Holster (attach to a Safe or character card)" : ""}.`, "Item", `Cavalo (mudar), Stetson (espiar ${r.stetson === 1 ? "1 Cofre" : "2 Cofres"}), Sobretudo (comprar 4, descartar 3)${r.holsterAttach ? ", Coldre (prender num Cofre ou carta de personagem)" : ""}.`),
      rl("Gun → Robbery", "put the gun in front of another player's Safe; they must defend with a gun; both roll; higher steals or keeps the Safe.", "Arma → Roubo", "ponha a arma diante de um Cofre de outro jogador; ele precisa defender com uma arma; os dois rolam; o maior rouba ou mantém o Cofre."),
      rl("Gun → Duel", "put the gun in front of another player's character card; they must defend; if you roll higher, swap stars — or, if the defender is in your own establishment, send the defender to an establishment of your choice with a vacancy.", "Arma → Duelo", "ponha a arma diante da carta de personagem de outro jogador; ele precisa defender; se você tirar mais, troquem as estrelas — ou, se o defensor estiver no seu próprio estabelecimento, mande o defensor para um estabelecimento à sua escolha com vaga."),
      rl("Ties", "reroll the same dice.", "Empates", "rolem de novo os mesmos dados."),
      r.holsterAttach
        ? rl("Holster (2-3 players)", "never out of turn: attaching one is your whole turn.", "Coldre (2-3 jogadores)", "nunca fora do turno: prender um é o seu turno inteiro.")
        : rl("Holster (out of turn)", "anyone not fighting may give a Holster to the attacker or defender before the roll; they add its gun's die. Max 1 per fighter.", "Coldre (fora do turno)", "quem não está lutando pode dar um Coldre ao atacante ou ao defensor antes da rolagem; ele soma o dado da arma do Coldre. Máx. 1 por lutador."),
      r.horseThiefAllowed && state.horseThief === "yes"
        ? rl("Horse Thief", "after a Robbery's guns are down, others may play a white Horse to roll for the Safe too.", "Ladrão de Cavalos", "depois que as armas de um Roubo estão na mesa, outros podem jogar um Cavalo branco para também rolar pelo Cofre.")
        : "",
      rl("End of turn", `discard every card used; everyone who used one (you, the defender${r.holsterAttach ? "" : ", Holster givers"}${state.horseThief === "yes" && r.horseThiefAllowed ? ", Horse Thieves" : ""}) draws back to ${r.hand}.`, "Fim do turno", `descarte todas as cartas usadas; todos que usaram uma (você, o defensor${r.holsterAttach ? "" : ", quem deu Coldre"}${state.horseThief === "yes" && r.horseThiefAllowed ? ", Ladrões de Cavalos" : ""}) compram até ter ${r.hand}.`)
    ];
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), sectionIndex("quick-reference"), [3, 4, 5, 6, 7, 8, 14])}
      <div class="callout">${t(
        `Goal: steal Safes so your establishment has the most Gold at the end — then be the last one alive when the richest establishment's players turn their guns on each other in the Final Showdown. Hidden information: hand cards and Safes are never shown.`,
        `Objetivo: roubar Cofres para que o seu estabelecimento tenha mais Ouro no fim — e depois ser o último vivo quando os jogadores do estabelecimento mais rico apontarem as armas uns para os outros no Confronto Final. Informação oculta: cartas da mão e Cofres nunca são mostrados.`
      )} ${referenceLink(3)}</div>
      <div class="quick-grid">
        ${infoCard(t("THIS MATCH", "ESTA PARTIDA"), playersLabel(), [
          rl("Establishments", `${r.establishments}, up to ${r.capacity} stars each.`, "Estabelecimentos", `${r.establishments}, até ${r.capacity} estrelas cada.`),
          rl("Hand", `${r.hand} cards, refilled after each turn.`, "Mão", `${r.hand} cartas, completadas após cada turno.`),
          rl("Heists", `${r.heists}: one after every ${r.circlesPerHeist === 2 ? "2 full circles" : "full circle"} of turns.`, "Assaltos", `${r.heists}: um a cada ${r.circlesPerHeist === 2 ? "2 voltas completas" : "volta completa"} de turnos.`),
          rl("Turns", `${r.turns} each before the Badge Round${r.small ? " (2 circles after the last Heist)" : " (1 after the last Heist)"}.`, "Turnos", `${r.turns} para cada um antes da Rodada dos Distintivos${r.small ? " (2 voltas depois do último Assalto)" : " (1 depois do último Assalto)"}.`),
          rl("Safe limit", "3 per player until the Badge Round.", "Limite de Cofres", "3 por jogador até a Rodada dos Distintivos."),
          r.stranger ? rl("The Stranger", "a third character with 2 Safes and no turns; your opponent rolls for it.", "O Forasteiro", "um terceiro personagem com 2 Cofres e sem turnos; o oponente rola por ele.") : ""
        ], [3, 5, 6, 14])}
        ${infoCard(t("YOUR TURN", "O SEU TURNO"), t("One card, one action", "Uma carta, uma ação"), turnLines, [4, 5, 6])}
        ${infoCard(t("SEQUENCE", "SEQUÊNCIA"), t("How the game unfolds", "Como a partida se desenrola"), [
          rl("Turns + Heists", `${r.circlesPerHeist === 2 ? "2 circles" : "1 circle"} of turns, then a Heist; repeat until the ${r.heists} Heist Safes are gone.`, "Turnos + Assaltos", `${r.circlesPerHeist === 2 ? "2 voltas" : "1 volta"} de turnos, depois um Assalto; repitam até acabarem os ${r.heists} Cofres de Assalto.`),
          rl("Heist", "reveal the top Heist Safe; everyone plays a gun at once; highest roll takes it. No Holsters.", "Assalto", "revele o Cofre de Assalto do topo; todos jogam uma arma ao mesmo tempo; o maior resultado leva. Sem Coldres."),
          rl("Final turns", r.small ? "2 more circles." : "1 more turn each.", "Turnos finais", r.small ? "mais 2 voltas." : "mais 1 turno cada."),
          rl("Badge Round", "Tin, Iron, Copper, Silver, Gold: each Badge owner reveals it and takes an extra turn.", "Rodada dos Distintivos", "Lata, Ferro, Cobre, Prata, Ouro: cada dono de Distintivo o revela e joga um turno extra."),
          state.mystery ? rl("Starred Mystery Safes", "Dagger, Explosives, Poker Deck are revealed and resolved in that order.", "Cofres Misteriosos com estrela", "Dagger, Explosives, Poker Deck são revelados e resolvidos nessa ordem.") : "",
          rl("Gold count", "reveal all Safes; the establishment with the most Gold advances; everyone else is out.", "Contagem de Ouro", "revelem todos os Cofres; o estabelecimento com mais Ouro avança; os outros estão fora."),
          rl("Final Showdown", "advancing players fight to the death with hand guns + Showdown Guns. Last alive wins.", "Confronto Final", "os que avançaram lutam até a morte com armas da mão + Armas do Confronto. O último vivo vence.")
        ], [4, 6, 7, 12])}
        ${infoCard(t("LAWS", "LEIS"), t("The 3 Laws of Deadwood", "As 3 Leis de Deadwood"), [
          rl("1 · Order", "shuffle your Safes only right after gaining one from a Robbery or Heist; otherwise keep their positions. Look at your own whenever you like.", "1 · Ordem", "embaralhe os seus Cofres só logo depois de ganhar um num Roubo ou Assalto; fora isso, mantenha as posições. Olhe os seus quando quiser."),
          rl("2 · Secrets", "never show Safes or hand cards; say anything you like — lying is fine.", "2 · Segredos", "nunca mostre Cofres nem cartas da mão; diga o que quiser — mentir vale."),
          rl("3 · Three Safes", "winning a 4th Safe means giving one of yours to the player with the fewest Safes; ends when the Badge Round begins.", "3 · Três Cofres", "ganhar um 4º Cofre obriga a dar um dos seus ao jogador com menos Cofres; deixa de valer quando começa a Rodada dos Distintivos.")
        ], 8)}
      </div>`;
  }

  // ---------- game flow ----------

  function flowSection() {
    const r = rules();
    const steps = [];
    for (let h = 1; h <= r.heists; h += 1) {
      steps.push(r.circlesPerHeist === 2
        ? t(`Two full circles of turns, then <strong>Heist ${h}</strong>.`, `Duas voltas completas de turnos, depois o <strong>Assalto ${h}</strong>.`)
        : t(`One full circle of turns, then <strong>Heist ${h}</strong>.`, `Uma volta completa de turnos, depois o <strong>Assalto ${h}</strong>.`));
    }
    steps.push(r.small
      ? t("Two more full circles of turns (final turns).", "Mais duas voltas completas de turnos (turnos finais).")
      : t("One more turn each (final turn).", "Mais um turno para cada um (turno final)."));
    steps.push(t("<strong>Badge Round</strong>: extra turns for Badge owners.", "<strong>Rodada dos Distintivos</strong>: turnos extras para os donos de Distintivos."));
    if (state.mystery) {
      steps.push(t("Starred Mystery Safes (Dagger, Explosives, Poker Deck) are revealed and resolved.", "Os Cofres Misteriosos com estrela (Dagger, Explosives, Poker Deck) são revelados e resolvidos."));
    }
    steps.push(t("All Safes are revealed; the establishment with the most Gold advances.", "Todos os Cofres são revelados; o estabelecimento com mais Ouro avança."));
    steps.push(t("<strong>Final Showdown</strong>: the advancing players fight to the death.", "<strong>Confronto Final</strong>: os que avançaram lutam até a morte."));
    return `
      ${sectionHeading("game-flow", t("Game flow", "Fluxo da partida"), sectionIndex("game-flow"), r.small ? [4, 6, 7, 14] : [4, 6, 7])}
      <p class="glossary-intro">${t(
        `With ${r.players} players each person gets ${r.turns} normal turns. A “circle” is one turn for every player, clockwise from the first player.`,
        `Com ${r.players} jogadores cada pessoa joga ${r.turns} turnos normais. Uma “volta” é um turno para cada jogador, em sentido horário a partir do primeiro jogador.`
      )}</p>
      <ol class="dw-flow">${steps.map((step) => `<li>${step}</li>`).join("")}</ol>`;
  }

  // ---------- turn ----------

  function turnSection() {
    const r = rules();
    const thief = r.horseThiefAllowed && state.horseThief === "yes";
    return `
      ${sectionHeading("turn", t("Your turn", "O seu turno"), sectionIndex("turn"), [4, 5, 6, 10, 13, 14])}
      <div class="callout">${t(
        `On your turn you play exactly one Deadwood card from your hand and use it either as the special item on the bottom ${icon("or", "or")} as the gun on top. Not both.`,
        `No seu turno você joga exatamente uma carta Deadwood da mão e a usa como o item especial de baixo ${icon("or", "ou")} como a arma de cima. Nunca as duas coisas.`
      )} ${referenceLink(4)}</div>
      <div class="dw-action-grid">
        ${actionCard("colt", t("GUN", "ARMA"), t("Robbery", "Roubo"), [
          rl("Attack", "lay the gun face up in front of one specific Safe belonging to another player.", "Ataque", "baixe a arma virada para cima diante de um Cofre específico de outro jogador."),
          rl("Defend", "the owner must play one gun from their hand to defend it (they may look at the Safe first).", "Defesa", "o dono precisa jogar uma arma da mão para defendê-lo (pode olhar o Cofre antes)."),
          r.holsterAttach
            ? rl("Attached Holster", "if that Safe has a Holster on it, the defender also rolls the Holster's gun die; then the Holster is discarded.", "Coldre preso", "se aquele Cofre tiver um Coldre, o defensor também rola o dado da arma do Coldre; depois o Coldre é descartado.")
            : rl("Holsters", "before the roll, other players may give either fighter a Holster (see below).", "Coldres", "antes da rolagem, outros jogadores podem dar um Coldre a qualquer um dos lutadores (veja abaixo)."),
          thief ? rl("Horse Thieves", "after both guns are down, others may join with a white Horse (see Horse Thief).", "Ladrões de Cavalos", "depois das duas armas na mesa, outros podem entrar com um Cavalo branco (veja Ladrão de Cavalos).") : "",
          rl("Roll", "attacker and defender roll at the same time the dice matching their played guns. Ties: reroll.", "Rolagem", "atacante e defensor rolam ao mesmo tempo os dados das armas jogadas. Empate: rolem de novo."),
          rl("Attacker higher", "take the Safe, look at it privately, shuffle it with your other Safes and lay them back in a row.", "Atacante maior", "pegue o Cofre, olhe-o em segredo, embaralhe-o com os seus outros Cofres e recoloque-os em fileira."),
          rl("Defender higher", "they keep the Safe; nothing is shuffled.", "Defensor maior", "ele mantém o Cofre; nada é embaralhado."),
          rl("4th Safe", "if the winner now has 4, the 3rd Law applies.", "4º Cofre", "se o vencedor ficar com 4, vale a 3ª Lei."),
          interpretation("the robbed player closes the gap in their row without changing the order of the remaining Safes.", "quem foi roubado fecha o espaço na fileira sem mudar a ordem dos Cofres restantes.")
        ], [4, 5, 8])}
        ${actionCard("messenger", t("GUN", "ARMA"), t("Duel", "Duelo"), [
          rl("Attack", "lay the gun face up in front of another player's character card.", "Ataque", "baixe a arma virada para cima diante da carta de personagem de outro jogador."),
          rl("Defend", "they must play one gun from their hand.", "Defesa", "ele precisa jogar uma arma da mão."),
          r.holsterAttach
            ? rl("Attached Holster", "if their character card has a Holster on it, they also roll its gun die; then it is discarded.", "Coldre preso", "se a carta de personagem dele tiver um Coldre, ele também rola o dado da arma do Coldre; depois é descartado.")
            : rl("Holsters", "other players may give either fighter a Holster before the roll.", "Coldres", "outros jogadores podem dar um Coldre a qualquer um dos lutadores antes da rolagem."),
          rl("Roll", "both roll at the same time. Ties: reroll.", "Rolagem", "os dois rolam ao mesmo tempo. Empate: rolem de novo."),
          rl("You win, different establishment", "swap your star with the defender's star.", "Você vence, outro estabelecimento", "troque a sua estrela com a do defensor."),
          rl("You win, same establishment", `instead of swapping, send the defender to an establishment of your choice that has a vacancy (fewer than ${r.capacity} stars).`, "Você vence, mesmo estabelecimento", `em vez de trocar, mande o defensor para um estabelecimento à sua escolha que tenha vaga (menos de ${r.capacity} estrelas).`),
          interpretation("if no other establishment has a vacancy, the defender stays where they are.", "se nenhum outro estabelecimento tiver vaga, o defensor fica onde está."),
          rl("Defender wins", "nothing happens.", "Defensor vence", "nada acontece.")
        ], [5])}
        ${actionCard("horse", t("ITEM", "ITEM"), t("Horse", "Cavalo"), [
          t("Move your star to any other establishment with a vacancy.", "Mova a sua estrela para qualquer outro estabelecimento com vaga."),
          thief
            ? t("White Horses can also be played out of turn as a Horse Thief.", "Cavalos brancos também podem ser jogados fora do turno como Ladrão de Cavalos.")
            : t("The Horse's colour does not matter.", "A cor do Cavalo não importa.")
        ], [10])}
        ${actionCard("stetson", t("ITEM", "ITEM"), t("Stetson", "Stetson"), [
          r.stetson === 1
            ? t("2-3 players: secretly look at any 1 Safe (instead of the usual 2).", "2-3 jogadores: olhe em segredo qualquer 1 Cofre (em vez dos 2 habituais).")
            : t("Secretly look at any 2 Safes; they may belong to different players (or be your own).", "Olhe em segredo quaisquer 2 Cofres; podem ser de jogadores diferentes (ou seus)."),
          r.stetson === 1
            ? t("Put it back in exactly the same position; nobody else may see the front.", "Recoloque-o exatamente na mesma posição; ninguém mais pode ver a frente.")
            : t("Put them back in exactly the same positions; nobody else may see the fronts.", "Recoloque-os exatamente nas mesmas posições; ninguém mais pode ver a frente."),
          t(`Not allowed: the Heist stack or Safes that are not in play${r.stranger ? ". The Stranger's Safes may be viewed" : ""}.`, `Proibido: a pilha de Assalto ou Cofres fora do jogo${r.stranger ? ". Os Cofres do Forasteiro podem ser vistos" : ""}.`)
        ], r.small ? [11, 14] : [11])}
        ${actionCard("duster", t("ITEM", "ITEM"), t("Duster", "Sobretudo (Duster)"), [
          t("Discard the Duster, then draw 4 Deadwood cards.", "Descarte o Sobretudo e compre 4 cartas Deadwood."),
          t(`You now hold ${r.hand + 3} cards (${r.hand - 1} left after the Duster + 4 drawn): discard 3 so you are back to ${r.hand}.`, `Agora você tem ${r.hand + 3} cartas (${r.hand - 1} depois do Sobretudo + 4 compradas): descarte 3 para voltar a ${r.hand}.`),
          t("Play passes to the next player.", "A vez passa para o próximo jogador.")
        ], [10])}
        ${r.holsterAttach
          ? actionCard("holster", t("ITEM · 2-3 PLAYERS", "ITEM · 2-3 JOGADORES"), t("Holster (attach)", "Coldre (prender)"), [
            t("Holsters cannot be played out of turn. Instead, as your turn, attach a Holster to any Safe (yours or another player's) or to any character card (including your own).", "Coldres não podem ser jogados fora do turno. Em vez disso, como seu turno, prenda um Coldre em qualquer Cofre (seu ou de outro) ou em qualquer carta de personagem (inclusive a sua)."),
            t("Next time that Safe is robbed (or that character is Dueled), the defender rolls their played gun plus the gun printed on the Holster card; then discard the Holster.", "Na próxima vez que esse Cofre for roubado (ou esse personagem desafiado em Duelo), o defensor rola a arma jogada mais a arma impressa na carta do Coldre; depois descarte o Coldre."),
            t("Only one Holster per Safe. A Safe with a Holster cannot be shuffled; if it is given away, the Holster goes with it.", "Só um Coldre por Cofre. Um Cofre com Coldre não pode ser embaralhado; se for dado a alguém, o Coldre vai junto."),
            r.stranger ? t("You may attach Holsters to the Stranger's Safes or card; your opponent uses them when defending for the Stranger.", "Você pode prender Coldres nos Cofres ou na carta do Forasteiro; o oponente os usa ao defender pelo Forasteiro.") : "",
            interpretation("a Safe with a Holster keeps its place in the row when its owner shuffles the others after gaining a Safe.", "um Cofre com Coldre mantém o lugar na fileira quando o dono embaralha os outros depois de ganhar um Cofre.")
          ], [14, 15])
          : actionCard("holster", t("ITEM · OUT OF TURN", "ITEM · FORA DO TURNO"), t("Holster (assist)", "Coldre (ajuda)"), [
            t("Played out of turn, before a Robbery or Duel roll, by someone who is neither the attacker nor the defender. Never to yourself or to the person you are fighting.", "Jogado fora do turno, antes da rolagem de um Roubo ou Duelo, por alguém que não é atacante nem defensor. Nunca para si mesmo nem para quem você enfrenta."),
            t("Give it to the attacker or the defender (not both). They roll their played gun's die plus the die of the gun printed on the Holster card, and add both.", "Dê ao atacante ou ao defensor (não aos dois). Ele rola o dado da arma jogada mais o dado da arma impressa na carta do Coldre e soma os dois."),
            t("Each fighter uses at most one Holster. Given several, the fighter picks one and returns the others to their owners. A fighter given at least one cannot refuse to use one.", "Cada lutador usa no máximo um Coldre. Se receber vários, escolhe um e devolve os outros aos donos. Quem recebe pelo menos um não pode recusar usar um."),
            t("If a fighter rushes their roll before receiving a Holster, the roll counts and they cannot get one (their opponent still can).", "Se um lutador se apressar e rolar antes de receber um Coldre, a rolagem vale e ele não pode mais receber (o oponente ainda pode)."),
            t("Picky group? Order: attacker's gun, defender's gun, Holster for the attacker, Holster for the defender. Holsters also count in tie-break rerolls.", "Grupo exigente? Ordem: arma do atacante, arma do defensor, Coldre para o atacante, Coldre para o defensor. Coldres também valem nas rerrolagens de desempate."),
            t("Never in Heists or the Final Showdown.", "Nunca em Assaltos nem no Confronto Final."),
            interpretation("a Holster can also be played as your own turn's card only for its gun; its item only works out of turn.", "um Coldre também pode ser a carta do seu turno, mas só pela arma; o item só funciona fora do turno.")
          ], [5, 10])}
        ${thief ? actionCard("horse", t("ADVANCED · OUT OF TURN", "AVANÇADO · FORA DO TURNO"), t("Horse Thief", "Ladrão de Cavalos"), [
          t("Right after the attacker and defender lay down guns for a Robbery, anyone with a white Horse may play it and become a Horse Thief.", "Logo depois de atacante e defensor baixarem as armas num Roubo, quem tiver um Cavalo branco pode jogá-lo e virar Ladrão de Cavalos."),
          t("You roll the gun printed on your Horse card. If you roll higher than both the attacker and the defender, you take the Safe. Highest rollers reroll ties.", "Você rola a arma impressa na sua carta de Cavalo. Se tirar mais que o atacante e o defensor, leva o Cofre. Os maiores empatados rolam de novo."),
          interpretation("if no Horse Thief beats both, the Robbery is decided between attacker and defender as usual; if a thief ties for the highest roll, only the tied highest rollers reroll.", "se nenhum Ladrão superar os dois, o Roubo se decide entre atacante e defensor como sempre; se um Ladrão empatar no maior resultado, só os maiores empatados rolam de novo."),
          t("Any number of Horse Thieves may join; once attacker and defender have rolled it is too late.", "Qualquer número de Ladrões pode entrar; depois que atacante e defensor rolaram, é tarde demais."),
          t("Horse Thieves cannot give or receive Holsters. The Laws still apply (shuffle after winning; give one away if it is your 4th).", "Ladrões de Cavalos não dão nem recebem Coldres. As Leis continuam valendo (embaralhe ao vencer; dê um se for o 4º)."),
          t("Used Horses are replenished. Not allowed during the Badge Round. Either colour still works as a normal Horse on your turn.", "Cavalos usados são repostos. Proibido na Rodada dos Distintivos. Qualquer cor continua valendo como Cavalo normal no seu turno.")
        ], [13]) : ""}
        ${infoCard(t("AFTER EVERY TURN", "DEPOIS DE CADA TURNO"), t("Discard and refill", "Descartar e completar"), [
          t("All cards used during the turn go to the discard pile.", "Todas as cartas usadas no turno vão para a pilha de descarte."),
          t(`Everyone who used a card (the current player, the defender${r.holsterAttach ? "" : ", anyone who gave a Holster"}${thief ? ", any Horse Thief" : ""}) draws until they again have ${r.hand}.`, `Todos que usaram uma carta (o jogador da vez, o defensor${r.holsterAttach ? "" : ", quem deu Coldre"}${thief ? ", os Ladrões de Cavalos" : ""}) compram até voltar a ter ${r.hand}.`),
          t("When the deck runs out, shuffle the discard pile to form a new deck.", "Quando o baralho acabar, embaralhe a pilha de descarte para formar um novo baralho."),
          t("Then the next player clockwise takes their turn — or, if the circle is complete, a Heist happens.", "Então o próximo jogador em sentido horário joga — ou, se a volta se completou, acontece um Assalto.")
        ], [6])}
      </div>`;
  }

  // ---------- laws ----------

  function lawsSection() {
    const r = rules();
    return `
      ${sectionHeading("laws", t("The 3 Laws of Deadwood", "As 3 Leis de Deadwood"), sectionIndex("laws"), [8, 10, 14])}
      <div class="quick-grid">
        ${infoCard(t("1ST LAW", "1ª LEI"), t("Keep your Safes in order", "Mantenha os Cofres em ordem"), [
          t("You may shuffle your Safes only immediately after gaining a Safe from a Robbery or a Heist.", "Você só pode embaralhar os seus Cofres logo depois de ganhar um Cofre num Roubo ou Assalto."),
          t("Otherwise they stay face down in a row, in the same positions.", "Fora isso, ficam virados para baixo em fileira, nas mesmas posições."),
          t("You may look at your own Safes at any time — even while one is being attacked — without mixing them up.", "Você pode olhar os próprios Cofres a qualquer momento — até durante um ataque — sem misturá-los.")
        ], 8)}
        ${infoCard(t("2ND LAW", "2ª LEI"), t("Show nothing, say anything", "Não mostre nada, diga tudo"), [
          t("Never show your Safes or hand cards to other players.", "Nunca mostre Cofres nem cartas da mão a outros jogadores."),
          t("You may tell teammates or enemies anything you like, true or false. Communication and deception are encouraged.", "Você pode dizer o que quiser a aliados ou inimigos, verdade ou mentira. Comunicação e blefe são incentivados."),
          t("Deadwood is not a memory game: notes on paper or a phone about where Safes are hiding are allowed.", "Deadwood não é jogo de memória: anotações em papel ou no celular sobre onde estão os Cofres são permitidas.")
        ], [8, 9])}
        ${infoCard(t("3RD LAW", "3ª LEI"), t("Three-Safe limit", "Limite de três Cofres"), [
          t("If you own 3 Safes and win a 4th from a Robbery or Heist, give any one of your Safes to the player with the fewest Safes.", "Se você tem 3 Cofres e ganha um 4º num Roubo ou Assalto, dê qualquer um dos seus Cofres ao jogador com menos Cofres."),
          t("Tied for fewest? You pick the recipient.", "Empate entre quem tem menos? Você escolhe quem recebe."),
          t("The recipient may not shuffle their Safes at that time.", "Quem recebe não pode embaralhar os Cofres naquele momento."),
          r.stranger ? t("The Stranger counts as a player for this Law.", "O Forasteiro conta como jogador para esta Lei.") : "",
          t("No longer in effect once the Badge Round begins.", "Deixa de valer quando começa a Rodada dos Distintivos."),
          interpretation("you shuffle in the new Safe first (1st Law), then choose which one to give; the recipient adds it to the end of their row.", "você embaralha o Cofre novo primeiro (1ª Lei) e depois escolhe qual dar; quem recebe o põe no fim da fileira.")
        ], r.stranger ? [8, 15] : [8, 10])}
      </div>`;
  }

  // ---------- heist ----------

  function heistSection() {
    const r = rules();
    return `
      ${sectionHeading("heist", t("Heist", "Assalto"), sectionIndex("heist"), r.small ? [6, 10, 14] : [6, 10])}
      <div class="quick-grid">
        ${infoCard(t("WHEN", "QUANDO"), t(r.circlesPerHeist === 2 ? "After every second circle" : "After each circle", r.circlesPerHeist === 2 ? "A cada duas voltas" : "Depois de cada volta"), [
          t(r.circlesPerHeist === 2 ? "Each time the last player completes their turn of the second circle, a Heist occurs." : "Each time the last player in the circle completes their turn, a Heist occurs.", r.circlesPerHeist === 2 ? "Cada vez que o último jogador termina o turno da segunda volta, acontece um Assalto." : "Cada vez que o último jogador da volta termina o turno, acontece um Assalto."),
          t(`There are ${r.heists} Heists — one per Safe in the Heist stack.`, `São ${r.heists} Assaltos — um por Cofre da pilha de Assalto.`)
        ], r.small ? [6, 14] : [6])}
        ${infoCard(t("HOW", "COMO"), t("Everyone fights at once", "Todos lutam ao mesmo tempo"), [
          rl("Reveal", "turn the top Safe of the Heist stack face up so everyone sees what it holds.", "Revelar", "vire o Cofre do topo da pilha de Assalto para todos verem o que há nele."),
          rl("Play", "every player plays a gun from their hand at the same time.", "Jogar", "todos os jogadores jogam uma arma da mão ao mesmo tempo."),
          rl("Roll", "everyone rolls the die of their gun. Highest roll takes the Safe and shuffles it face down with their other Safes.", "Rolar", "todos rolam o dado da sua arma. O maior resultado leva o Cofre e o embaralha virado para baixo com os seus outros Cofres."),
          rl("Ties", "reroll.", "Empates", "rolem de novo."),
          interpretation("only the players tied for the highest roll reroll, with the same guns.", "só quem empatou no maior resultado rola de novo, com as mesmas armas."),
          rl("No Holsters", `Holsters may not be used in Heists${r.horseThiefAllowed && state.horseThief === "yes" ? "; Horse Thief only applies to Robberies" : ""}.`, "Sem Coldres", `Coldres não podem ser usados em Assaltos${r.horseThiefAllowed && state.horseThief === "yes" ? "; Ladrão de Cavalos só vale em Roubos" : ""}.`),
          rl("3rd Law", "a 4th Safe must be given away as usual.", "3ª Lei", "um 4º Cofre precisa ser dado como de costume."),
          rl("Refill", "played guns are discarded and each player draws a replacement card.", "Repor", "as armas jogadas são descartadas e cada jogador compra uma carta de reposição."),
          rl("Continue", "play continues around the circle in the same order.", "Continuar", "o jogo segue na volta na mesma ordem."),
          r.stranger ? interpretation("the Stranger has no hand and no turns, so it does not take part in Heists.", "o Forasteiro não tem mão nem turnos, então não participa dos Assaltos.") : ""
        ], [6])}
        ${infoCard(t("AFTER THE LAST HEIST", "DEPOIS DO ÚLTIMO ASSALTO"), t("Final turns", "Turnos finais"), [
          r.small
            ? t("Go around the circle twice more. In total each player has 8 turns.", "Deem mais duas voltas. No total cada jogador tem 8 turnos.")
            : t(`Each player gets one final turn. In total each player has ${r.turns} turns.`, `Cada jogador tem um último turno. No total cada jogador tem ${r.turns} turnos.`),
          t("Then the Badge Round begins.", "Depois começa a Rodada dos Distintivos.")
        ], r.small ? [6, 14] : [6])}
      </div>`;
  }

  // ---------- badge round ----------

  function badgeSection() {
    const r = rules();
    const badges = [
      ["tin", "Tin", "Lata"], ["iron", "Iron", "Ferro"], ["copper", "Copper", "Cobre"], ["silver", "Silver", "Prata"], ["gold", "Gold", "Ouro"]
    ];
    return `
      ${sectionHeading("badge-round", t("Badge Round", "Rodada dos Distintivos"), sectionIndex("badge-round"), [6, 10, 13])}
      <div class="dw-badge-row">${badges.map(([file, en, pt], index) => `
        <figure><span>${t(["1st", "2nd", "3rd", "4th", "5th"][index], `${index + 1}º`)}</span><img src="${ICONS}${file}.webp" alt="${t(`${en} Badge`, `Distintivo de ${pt}`)}"><figcaption>${t(en, pt)}</figcaption></figure>`).join("")}</div>
      <div class="quick-grid">
        ${infoCard(t("ORDER", "ORDEM"), t("Reveal one Badge at a time", "Revelem um Distintivo por vez"), [
          t("After the last player's final turn, call the Badges in order: Tin, Iron, Copper, Silver, Gold.", "Depois do turno final do último jogador, chamem os Distintivos em ordem: Lata, Ferro, Cobre, Prata, Ouro."),
          t("Whoever owns the called Badge reveals it and immediately takes an extra turn (any normal turn).", "Quem tem o Distintivo chamado o revela e joga na hora um turno extra (qualquer turno normal)."),
          t("If nobody claims a Badge, it is not in play: move on to the next one.", "Se ninguém tiver um Distintivo, ele não está em jogo: passem ao próximo."),
          t("Own several Badges? You get several extra turns.", "Tem vários Distintivos? Você joga vários turnos extras.")
        ], 6)}
        ${infoCard(t("DETAILS", "DETALHES"), t("During the Badge Round", "Durante a Rodada dos Distintivos"), [
          t("A Badge stolen before its owner used it now belongs to the thief, who takes that extra turn.", "Um Distintivo roubado antes de o dono usá-lo passa a ser do ladrão, que joga esse turno extra."),
          t("Revealed Badges are worth nothing and cannot be attacked.", "Distintivos revelados não valem nada e não podem ser atacados."),
          t("The three-Safe limit no longer applies.", "O limite de três Cofres não vale mais."),
          t("Cards are replenished as normal after each turn.", "As cartas são repostas normalmente depois de cada turno."),
          r.horseThiefAllowed && state.horseThief === "yes" ? t("No Horse Thieves during the Badge Round.", "Sem Ladrões de Cavalos durante a Rodada dos Distintivos.") : "",
          r.stranger ? t("Badges owned by the Stranger are not revealed and have no effect.", "Distintivos do Forasteiro não são revelados e não têm efeito.") : "",
          interpretation("a revealed Badge stays face up in its owner's row as a reminder.", "um Distintivo revelado fica virado para cima na fileira do dono como lembrete.")
        ], r.stranger ? [10, 13, 15] : [10, 13])}
      </div>`;
  }

  // ---------- final showdown ----------

  function showdownSection() {
    const r = rules();
    const teamOptions = [];
    if (state.peace === "yes") {
      teamOptions.push(rl("“Peace-Lovin'” (on)", `if nobody who advanced owns a Showdown Gun, all advancing players win together.${state.mystery ? " Showdown Guns cancelled by Bad Sarsaparilla do not count." : ""}`, "“Peace-Lovin'” (ligada)", `se ninguém que avançou tiver Arma do Confronto, todos os que avançaram vencem juntos.${state.mystery ? " Armas do Confronto canceladas por Bad Sarsaparilla não contam." : ""}`));
    }
    if (r.fairShareAllowed && state.fairShare === "yes") {
      teamOptions.push(rl("“Fair Share” (on)", "if everyone who advanced has at least 1 Gold, all advancing players win together. If any has zero or negative Gold, fight as normal.", "“Fair Share” (ligada)", "se todos que avançaram tiverem pelo menos 1 de Ouro, todos vencem juntos. Se algum tiver Ouro zero ou negativo, lutem normalmente."));
    }
    if (teamOptions.length === 2) {
      teamOptions.push(interpretation("with both on, meeting either condition is enough for a team victory.", "com as duas ligadas, cumprir qualquer uma das condições basta para a vitória em equipe."));
    }
    return `
      ${sectionHeading("showdown", t("Final Showdown & winning", "Confronto Final e vitória"), sectionIndex("showdown"), r.stranger ? [7, 11, 12, 13, 15] : [7, 11, 12, 13])}
      <div class="quick-grid">
        ${state.mystery ? infoCard(t("FIRST", "PRIMEIRO"), t("Starred Mystery Safes", "Cofres Misteriosos com estrela"), [
          t(`Right after the final turn of the Badge Round, anyone with a Mystery Safe marked with a star ${icon("starred", "star")} must reveal and resolve it, before the other Safes are revealed.`, `Logo depois do último turno da Rodada dos Distintivos, quem tiver um Cofre Misterioso marcado com estrela ${icon("starred", "estrela")} precisa revelá-lo e resolvê-lo, antes de os outros Cofres serem revelados.`),
          t("Several? Resolve them in alphabetical order: Dagger, Explosives, Poker Deck.", "Vários? Resolvam em ordem alfabética: Dagger, Explosives, Poker Deck."),
          r.stranger ? t("Starred Safes owned by the Stranger are not revealed and have no effect.", "Cofres com estrela do Forasteiro não são revelados e não têm efeito.") : "",
          t("Effects: see Card details.", "Efeitos: veja Detalhes das cartas.")
        ], r.stranger ? [12, 15] : [12]) : ""}
        ${infoCard(t("GOLD COUNT", "CONTAGEM DE OURO"), t("Who advances", "Quem avança"), [
          t("All players reveal all remaining Safes.", "Todos revelam todos os Cofres restantes."),
          t("Add up the Gold of all players in each establishment. The players in the establishment with the most Gold advance to the Final Showdown. Everyone else is out.", "Somem o Ouro de todos os jogadores de cada estabelecimento. Os jogadores do estabelecimento com mais Ouro avançam para o Confronto Final. Todos os outros estão fora."),
          rl("Tie", "the tied establishment with the fewest players advances; if still tied, everyone in the tied establishments advances together.", "Empate", "o estabelecimento empatado com menos jogadores avança; se ainda empatar, todos dos estabelecimentos empatados avançam juntos."),
          state.mystery ? rl("Cash", "its owner also advances even if their establishment does not; their Gold still counts for their establishment.", "Cash", "o dono também avança mesmo que o estabelecimento dele não avance; o Ouro dele continua contando para o estabelecimento.") : "",
          interpretation("an empty establishment has 0 Gold and cannot advance.", "um estabelecimento vazio tem 0 de Ouro e não pode avançar.")
        ], 7)}
        ${infoCard(t("WINNING", "VITÓRIA"), t("Alone or to the death", "Sozinho ou até a morte"), [
          t("Only one player advanced? That player wins!", "Só um jogador avançou? Ele vence!"),
          t("Several advanced? They must all fight to the death.", "Vários avançaram? Todos precisam lutar até a morte."),
          ...teamOptions
        ], teamOptions.length ? [7, 13] : [7], "victory-card")}
        ${infoCard(t("FIGHT TO THE DEATH", "LUTA ATÉ A MORTE"), t("Each round of the fight", "Cada rodada da luta"), [
          rl("Play", "each advancing player simultaneously plays one card from their hand — only as a gun.", "Jogar", "cada um que avançou joga ao mesmo tempo uma carta da mão — só como arma."),
          rl("Roll", "roll the die of that gun plus one die for every Showdown Gun in your Safes, and add them all.", "Rolar", "role o dado dessa arma mais um dado para cada Arma do Confronto nos seus Cofres, e some tudo."),
          rl("Lowest total", "flips their character card to the black-and-white side. Ties for lowest: reroll.", "Menor total", "vira a carta de personagem para o lado preto e branco. Empate no menor: rolem de novo."),
          rl("Already black and white?", "losing again means you are out of the game.", "Já preto e branco?", "perder de novo significa sair do jogo."),
          rl("Repeat", "until one player is left: the last player alive keeps all the gold and wins. Yee-haw!", "Repetir", "até sobrar um jogador: o último vivo fica com todo o ouro e vence. Yee-haw!"),
          rl("No refills", "cards are not replenished. If several players are still alive when the cards run out, each picks up the hand they had going into the Final Showdown and keeps fighting — so keep played cards near you, not in the discard pile.", "Sem reposição", "as cartas não são repostas. Se vários ainda estiverem vivos quando as cartas acabarem, cada um pega de volta a mão com que entrou no Confronto Final e continua lutando — por isso deixe as cartas jogadas perto de você, não no descarte."),
          rl("No Holsters", "Holsters may not be used in the Final Showdown.", "Sem Coldres", "Coldres não podem ser usados no Confronto Final."),
          interpretation("only the players tied for the lowest total reroll, with the same dice.", "só quem empatou no menor total rola de novo, com os mesmos dados.")
        ], [7, 10, 11])}
        ${r.stranger ? infoCard(t("2 PLAYERS", "2 JOGADORES"), t("Final Showdown with the Stranger", "Confronto Final com o Forasteiro"), [
          t("You go alone: you win.", "Você vai sozinho: você vence."),
          t("You go with your opponent: fight them to the death as normal.", "Você vai com o oponente: lutem até a morte normalmente."),
          t("You go with the Stranger: your opponent becomes the Stranger, using guns from their own hand plus any Showdown Guns the Stranger owns (not their own). If they defeat you, your opponent wins.", "Você vai com o Forasteiro: o oponente vira o Forasteiro, usando armas da própria mão mais as Armas do Confronto do Forasteiro (não as próprias). Se ele derrotar você, o oponente vence."),
          t("The Stranger goes alone: you both lose (and, says the rulebook, are banned from Deadwood 1876 for seven days).", "O Forasteiro vai sozinho: os dois perdem (e, diz o manual, ficam proibidos de jogar Deadwood 1876 por sete dias)."),
          state.mystery ? t("Cash: if you, your opponent and the Stranger all go (because of Cash), the Stranger is removed and you fight your opponent to the death.", "Cash: se você, o oponente e o Forasteiro forem todos (por causa do Cash), o Forasteiro é removido e você luta com o oponente até a morte.") : ""
        ], state.mystery ? [12, 15] : [15]) : ""}
      </div>`;
  }

  // ---------- 2-3 players ----------

  function smallGameSection() {
    const r = rules();
    if (!r.small) {
      return "";
    }
    return `
      ${sectionHeading("small-game", r.stranger ? t("2-player rules", "Regras para 2 jogadores") : t("3-player rules", "Regras para 3 jogadores"), sectionIndex("small-game"), r.stranger ? [3, 14, 15] : [3, 14])}
      <p class="glossary-intro">${t("The rulebook asks you to read these before starting. Everything else is played as normal; the sections above already include these changes.", "O manual pede que vocês leiam isto antes de começar. Todo o resto é jogado normalmente; as seções acima já incluem estas mudanças.")}</p>
      <div class="quick-grid">
        ${infoCard(t("2-3 PLAYERS", "2-3 JOGADORES"), t("Rule adjustments", "Ajustes de regras"), [
          rl("Setup", "only 2 establishments (no Grand Central Hotel).", "Preparação", "só 2 estabelecimentos (sem Grand Central Hotel)."),
          rl("Twice around", "go around the circle twice before each Heist and after the final Heist: 8 turns each.", "Duas voltas", "deem duas voltas antes de cada Assalto e depois do último: 8 turnos cada."),
          rl("Stetson", "view only 1 Safe instead of 2.", "Stetson", "vê só 1 Cofre em vez de 2."),
          rl("Holster", "never out of turn; attach it to a Safe or character card as your turn (see Your turn).", "Coldre", "nunca fora do turno; prenda-o num Cofre ou carta de personagem como seu turno (veja O seu turno)."),
          rl("Horse Thief", "does not apply.", "Ladrão de Cavalos", "não se aplica.")
        ], [3, 13, 14])}
        ${r.stranger ? infoCard(t("2 PLAYERS", "2 JOGADORES"), t("The Stranger", "O Forasteiro"), [
          t("A third character with a star and 2 Safes, placed in setup. It has no turns and no hand.", "Um terceiro personagem com estrela e 2 Cofres, colocado na preparação. Não tem turnos nem mão."),
          t("You may view its Safes with a Stetson, rob them, or Duel the Stranger to swap positions with it or kick it out of your establishment.", "Você pode ver os Cofres dele com Stetson, roubá-los ou desafiar o Forasteiro em Duelo para trocar de posição com ele ou expulsá-lo do seu estabelecimento."),
          t("When you rob the Stranger or Duel it, your opponent acts as the Stranger and defends with guns from their own hand — even without knowing what the attacked Safe holds.", "Quando você rouba ou desafia o Forasteiro, o oponente age como o Forasteiro e defende com armas da própria mão — mesmo sem saber o que há no Cofre atacado."),
          t("Holsters attached to the Stranger's Safes or card are used by the player acting as the Stranger.", "Coldres presos nos Cofres ou na carta do Forasteiro são usados por quem age como o Forasteiro."),
          t("The 3rd Law treats the Stranger as a player: before the Badge Round it can hold 3 Safes and can receive given-away Safes.", "A 3ª Lei trata o Forasteiro como jogador: antes da Rodada dos Distintivos ele pode ter 3 Cofres e pode receber Cofres dados."),
          t("In the Badge Round, its Badges and starred Safes are not revealed and have no effect. Its Gold counts for its establishment.", "Na Rodada dos Distintivos, os Distintivos e Cofres com estrela dele não são revelados e não têm efeito. O Ouro dele conta para o estabelecimento dele."),
          interpretation("you, the attacker, still choose which of the Stranger's Safes to rob; the Stranger's Safes are never shuffled because nobody looks at them.", "você, o atacante, escolhe qual Cofre do Forasteiro roubar; os Cofres do Forasteiro nunca são embaralhados porque ninguém os olha.")
        ], [14, 15]) : ""}
      </div>`;
  }

  // ---------- card details ----------

  function cardsSection() {
    const r = rules();
    const mystery = state.mystery > 0;
    return `
      ${sectionHeading("cards", t("Card details", "Detalhes das cartas"), sectionIndex("cards"), mystery ? [10, 11, 12, 13] : [10, 11])}
      <h3 class="subhead">${t("Safe contents", "Conteúdo dos Cofres")}</h3>
      <div class="dw-action-grid">
        ${actionCard("gold", t("SAFE · 8 CARDS", "COFRE · 8 CARTAS"), t("Gold", "Ouro"), [
          t("Each shows a Gold value. At the end, the Gold of everyone in an establishment is added together.", "Cada um mostra um valor de Ouro. No fim, o Ouro de todos de um estabelecimento é somado."),
          t("The values are printed on the cards.", "Os valores estão impressos nas cartas.")
        ], [7, 11])}
        ${actionCard("silver", t("SAFE · 5 CARDS", "COFRE · 5 CARTAS"), t("Badges", "Distintivos"), [
          t("Tin, Iron, Copper, Silver and Gold. Each gives its owner one extra turn in the Badge Round.", "Lata, Ferro, Cobre, Prata e Ouro. Cada um dá ao dono um turno extra na Rodada dos Distintivos."),
          t("Worth no Gold; once revealed it cannot be attacked.", "Não vale Ouro; depois de revelado não pode ser atacado.")
        ], [6, 10])}
        ${actionCard("winchester", t("SAFE · 7 CARDS", "COFRE · 7 CARTAS"), t("Showdown Guns", "Armas do Confronto"), [
          t("Used only in the Final Showdown: you roll that gun's die in every Showdown roll, on top of the gun you play from your hand.", "Usadas só no Confronto Final: você rola o dado dessa arma em toda rolagem do Confronto, além da arma que joga da mão."),
          t("The gun type is printed on the card (the rulebook shows Deringer, Colt and Winchester).", "O tipo de arma está impresso na carta (o manual mostra Deringer, Colt e Winchester).")
        ], [7, 11])}
      </div>
      ${mystery ? `
      <h3 class="subhead">${t("Mystery Safes (silver border)", "Cofres Misteriosos (borda prateada)")}</h3>
      <p class="glossary-intro">${t(`${mysteryLabel()} shuffled in this match. Any of the five could be among them, so all are listed. Starred ones ${icon("starred", "star")} are revealed right after the Badge Round in alphabetical order; the others are revealed with the rest of the Safes.`, `${mysteryLabel()} embaralhado(s) nesta partida. Qualquer um dos cinco pode estar entre eles, então todos aparecem. Os com estrela ${icon("starred", "estrela")} são revelados logo depois da Rodada dos Distintivos em ordem alfabética; os outros, junto com o resto dos Cofres.`)}</p>
      <div class="dw-action-grid">
        ${actionCard("bad-sarsaparilla", t("MYSTERY", "MISTERIOSO"), "Bad Sarsaparilla", [
          t("Its owner cannot use their best Showdown Gun in the Final Showdown.", "O dono não pode usar a sua melhor Arma do Confronto no Confronto Final."),
          t("No effect if the owner has no Showdown Gun or does not go to the Final Showdown. No effect on the Dagger.", "Sem efeito se o dono não tiver Arma do Confronto ou não for ao Confronto Final. Sem efeito sobre o Dagger."),
          interpretation("“best” means the strongest die by the odds table: Messenger, then Winchester, Colt, Deringer, Pepperbox.", "“melhor” é o dado mais forte pela tabela de chances: Messenger, depois Winchester, Colt, Deringer, Pepperbox.")
        ], 12)}
        ${actionCard("cash", t("MYSTERY", "MISTERIOSO"), "Cash", [
          t("Its owner automatically advances to the Final Showdown even if their team does not have the most Gold. The team with the most Gold also advances.", "O dono avança automaticamente para o Confronto Final mesmo que a equipe não tenha mais Ouro. A equipe com mais Ouro também avança."),
          t("The Cash player's Gold still counts towards their team's total.", "O Ouro do jogador com Cash continua contando para o total da equipe."),
          r.stranger ? t("2 players: if you, your opponent and the Stranger all go because of Cash, remove the Stranger and fight your opponent to the death.", "2 jogadores: se você, o oponente e o Forasteiro forem todos por causa do Cash, removam o Forasteiro e lute com o oponente até a morte.") : ""
        ], 12)}
        ${actionCard("dagger", t("MYSTERY · STARRED", "MISTERIOSO · COM ESTRELA"), "Dagger", [
          t("Revealed right after the final turn of the Badge Round.", "Revelado logo depois do último turno da Rodada dos Distintivos."),
          t("The owner chooses: worth −1 Gold and a Pepperbox Showdown Gun, OR +1 Gold and a negative Pepperbox Showdown Gun.", "O dono escolhe: vale −1 de Ouro e uma Arma do Confronto Pepperbox, OU +1 de Ouro e uma Arma do Confronto Pepperbox negativa."),
          t("Negative Pepperbox: after each Final Showdown roll (tie-breaks included), roll a Pepperbox die and subtract it from the total.", "Pepperbox negativa: depois de cada rolagem do Confronto Final (inclusive desempates), role um dado Pepperbox e subtraia do total.")
        ], 12)}
        ${actionCard("explosives", t("MYSTERY · STARRED", "MISTERIOSO · COM ESTRELA"), "Explosives", [
          t("Revealed right after the final turn of the Badge Round.", "Revelado logo depois do último turno da Rodada dos Distintivos."),
          t("The owner chooses any 1 unrevealed Safe belonging to another player and removes it from the game, showing it to everyone.", "O dono escolhe 1 Cofre não revelado de outro jogador e o remove do jogo, mostrando-o a todos.")
        ], 13)}
        ${actionCard("poker-deck", t("MYSTERY · STARRED", "MISTERIOSO · COM ESTRELA"), "Poker Deck", [
          t("Revealed right after the final turn of the Badge Round.", "Revelado logo depois do último turno da Rodada dos Distintivos."),
          t("The owner plays any gun from their hand and rolls its die. Then they roll a red (Colt) die.", "O dono joga qualquer arma da mão e rola o dado dela. Depois rola um dado vermelho (Colt)."),
          t("Red die 0 or 1: subtract the first die's result from the owner's Gold. Red die 2 or 3: add it.", "Dado vermelho 0 ou 1: subtraia o resultado do primeiro dado do Ouro do dono. Dado vermelho 2 ou 3: some."),
          t("Replace the played card from the deck.", "Reponha a carta jogada a partir do baralho.")
        ], 13)}
      </div>` : ""}`;
  }

  // ---------- iconography ----------

  function iconsSection() {
    const r = rules();
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), sectionIndex("icons"), state.mystery ? [2, 4, 5, 6, 10, 11, 12, 13] : [2, 4, 5, 6, 10, 11])}
      <p class="glossary-intro">${t("Each image is cropped individually from the rulebook. A gun on a Deadwood card or Showdown Gun Safe is rolled with the die of the same colour.", "Cada imagem foi recortada individualmente do manual. Uma arma numa carta Deadwood ou num Cofre de Arma do Confronto é rolada com o dado da mesma cor.")}</p>
      <h3 class="subhead">${t("Guns and dice (strongest first)", "Armas e dados (da mais forte para a mais fraca)")}</h3>
      <div class="icon-grid">
        ${iconCard("messenger", "Messenger · black die", "The most powerful gun. The black die is also the one everyone rolls to pick the first player.", "Messenger · dado preto", "A arma mais poderosa. O dado preto também é o que todos rolam para definir o primeiro jogador.", 5)}
        ${iconCard("winchester", "Winchester · dark red die", "Second strongest.", "Winchester · dado vermelho-escuro", "A segunda mais forte.", 5)}
        ${iconCard("colt", "Colt · red die", `Middle gun.${state.mystery ? " The Poker Deck's “red die” is this one." : ""}`, "Colt · dado vermelho", `Arma intermediária.${state.mystery ? " O “dado vermelho” do Poker Deck é este." : ""}`, 5)}
        ${iconCard("deringer", "Deringer · orange die", "Fourth.", "Deringer · dado laranja", "A quarta.", 5)}
        ${iconCard("pepperbox", "Pepperbox · yellow die", `The weakest gun.${state.mystery ? " The Dagger's Showdown Gun is a Pepperbox." : ""}`, "Pepperbox · dado amarelo", `A arma mais fraca.${state.mystery ? " A Arma do Confronto do Dagger é uma Pepperbox." : ""}`, 5)}
      </div>
      <h3 class="subhead">${t("Badges (Badge Round order)", "Distintivos (ordem da Rodada)")}</h3>
      <div class="icon-grid">
        ${iconCard("tin", "Tin Badge · 1st", "Revealed first in the Badge Round.", "Distintivo de Lata · 1º", "Revelado primeiro na Rodada dos Distintivos.", 6)}
        ${iconCard("iron", "Iron Badge · 2nd", "Second extra turn.", "Distintivo de Ferro · 2º", "Segundo turno extra.", 6)}
        ${iconCard("copper", "Copper Badge · 3rd", "Third extra turn.", "Distintivo de Cobre · 3º", "Terceiro turno extra.", 6)}
        ${iconCard("silver", "Silver Badge · 4th", "Fourth extra turn.", "Distintivo de Prata · 4º", "Quarto turno extra.", 6)}
        ${iconCard("gold", "Gold Badge · 5th", "Last extra turn of the game.", "Distintivo de Ouro · 5º", "Último turno extra da partida.", 6)}
      </div>
      <h3 class="subhead">${t("Items on Deadwood cards", "Itens das cartas Deadwood")}</h3>
      <div class="icon-grid">
        ${iconCard("horse", "Horse", `Move your star to another establishment with a vacancy.${r.horseThiefAllowed && state.horseThief === "yes" ? " White Horses: Horse Thief." : ""}`, "Cavalo", `Mova a sua estrela para outro estabelecimento com vaga.${r.horseThiefAllowed && state.horseThief === "yes" ? " Cavalos brancos: Ladrão de Cavalos." : ""}`, 10)}
        ${iconCard("stetson", "Stetson", r.stetson === 1 ? "Look at 1 Safe (2-3 players)." : "Look at any 2 Safes.", "Stetson", r.stetson === 1 ? "Olhe 1 Cofre (2-3 jogadores)." : "Olhe quaisquer 2 Cofres.", r.small ? 14 : 11)}
        ${iconCard("duster", "Duster", "Draw 4, then discard 3.", "Sobretudo (Duster)", "Compre 4 e descarte 3.", 10)}
        ${iconCard("holster", "Holster", r.holsterAttach ? "Attach to a Safe or character card on your turn; the next defender there adds its gun." : "Give to a fighter out of turn; they add its gun's die.", "Coldre (Holster)", r.holsterAttach ? "Prenda num Cofre ou carta de personagem no seu turno; o próximo defensor ali soma a arma dele." : "Dê a um lutador fora do turno; ele soma o dado da arma do Coldre.", r.small ? 14 : 5)}
        ${iconCard("or", "“OR”", "Marks the choice on every Deadwood card: use the item or the gun, never both.", "“OU” (OR)", "Marca a escolha de toda carta Deadwood: use o item ou a arma, nunca os dois.", 4)}
      </div>
      <h3 class="subhead">${t("Establishments", "Estabelecimentos")}</h3>
      <div class="icon-grid">
        ${iconCard("gem-theatre", "Gem Theatre", "First establishment: star placement starts here.", "Gem Theatre", "Primeiro estabelecimento: a colocação das estrelas começa aqui.", 3)}
        ${iconCard("saloon", "Saloon", "Second establishment clockwise.", "Saloon", "Segundo estabelecimento no sentido horário.", 2)}
        ${r.establishments === 3 ? iconCard("grand-central", "Grand Central Hotel", r.players === 4 ? "With 4 players nobody starts here, but players may move in." : "Third establishment.", "Grand Central Hotel", r.players === 4 ? "Com 4 jogadores ninguém começa aqui, mas os jogadores podem se mudar para cá." : "Terceiro estabelecimento.", 3) : ""}
      </div>
      ${state.mystery ? `
      <h3 class="subhead">${t("Mystery Safes", "Cofres Misteriosos")}</h3>
      <div class="icon-grid">
        ${iconCard("starred", "Star", "Printed on Mystery Safes revealed right after the Badge Round (Dagger, Explosives, Poker Deck).", "Estrela", "Impressa nos Cofres Misteriosos revelados logo depois da Rodada dos Distintivos (Dagger, Explosives, Poker Deck).", 12)}
        ${iconCard("bad-sarsaparilla", "Bad Sarsaparilla", "Lose your best Showdown Gun.", "Bad Sarsaparilla", "Perde a sua melhor Arma do Confronto.", 12)}
        ${iconCard("cash", "Cash", "You advance to the Final Showdown regardless.", "Cash", "Você avança para o Confronto Final de qualquer jeito.", 12)}
        ${iconCard("dagger", "Dagger", "−1 Gold + Pepperbox, or +1 Gold + negative Pepperbox.", "Dagger", "−1 de Ouro + Pepperbox, ou +1 de Ouro + Pepperbox negativa.", 12)}
        ${iconCard("explosives", "Explosives", "Remove another player's unrevealed Safe.", "Explosives", "Remova um Cofre não revelado de outro jogador.", 13)}
        ${iconCard("poker-deck", "Poker Deck", "Gamble Gold with a gun roll and the red die.", "Poker Deck", "Aposte Ouro com uma rolagem de arma e o dado vermelho.", 13)}
      </div>` : ""}`;
  }

  // ---------- stats ----------

  function statsSection() {
    const dice = ["pepperbox", "deringer", "colt", "winchester", "messenger"];
    const odds = [
      [50, 33, 19, 7, 3],
      [67, 50, 31, 14, 7],
      [81, 69, 50, 31, 18],
      [93, 86, 69, 50, 31],
      [97, 93, 82, 69, 50]
    ];
    const head = dice.map((d) => `<th scope="col">${icon(d, gunName(d))}<span>${gunName(d)}</span></th>`).join("");
    const rows = dice.map((d, i) => `<tr><th scope="row">${icon(d, gunName(d))}<span>${gunName(d)}</span></th>${odds[i].map((v) => `<td>${v}%</td>`).join("")}</tr>`).join("");
    return `
      ${sectionHeading("stats", t("Odds & card counts", "Chances e contagens"), sectionIndex("stats"), [5, 11])}
      <p class="glossary-intro">${t("Odds of the row's die beating the column's die in a one-on-one shootout (from the rulebook). Each die has its own face values; a stronger gun gives better odds.", "Chance de o dado da linha vencer o dado da coluna num tiroteio um contra um (do manual). Cada dado tem seus próprios valores nas faces; uma arma mais forte dá chances melhores.")}</p>
      <div class="dw-table-wrap">
        <table class="dw-odds">
          <caption>${t("Odds of winning a shootout", "Chance de vencer um tiroteio")}</caption>
          <thead><tr><th scope="col">${t("This die ↓ vs →", "Este dado ↓ contra →")}</th>${head}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="quick-grid">
        ${infoCard(t("50 DEADWOOD CARDS", "50 CARTAS DEADWOOD"), t("Items (10 of each gun)", "Itens (10 de cada arma)"), [
          t("10 Horse", "10 Cavalo"), t("12 Duster", "12 Sobretudo"), t("13 Stetson", "13 Stetson"), t("15 Holster", "15 Coldre")
        ], 11)}
        ${infoCard(t("25 SAFE CARDS", "25 CARTAS DE COFRE"), t("Contents", "Conteúdo"), [
          t("5 Badges", "5 Distintivos"), t("5 Mystery Safes", "5 Cofres Misteriosos"), t("7 Guns (Showdown Guns)", "7 Armas (Armas do Confronto)"), t("8 Gold values", "8 valores de Ouro")
        ], 11)}
      </div>`;
  }

  // ---------- examples ----------

  function examplesSection() {
    const examples = [
      [t("Showdown Gun in every roll", "Arma do Confronto em toda rolagem"), [
        t("Holly has a Winchester Showdown Gun in her Safes.", "Holly tem uma Arma do Confronto Winchester nos Cofres."),
        t("First Showdown roll: she plays a Colt from her hand and rolls a Colt die and a Winchester die.", "Primeira rolagem do Confronto: ela joga um Colt da mão e rola um dado Colt e um dado Winchester."),
        t("Next roll: she plays a Deringer and rolls a Deringer and a Winchester — the Winchester counts in every Final Showdown roll.", "Rolagem seguinte: ela joga um Deringer e rola um Deringer e um Winchester — o Winchester vale em toda rolagem do Confronto Final.")
      ], 11, false],
      [t("Two lives", "Duas vidas"), [
        t("Poker Alice has the lowest total in a Final Showdown roll: she flips her character card to the black-and-white side.", "Poker Alice tem o menor total numa rolagem do Confronto Final: ela vira a carta de personagem para o lado preto e branco."),
        t("If she is the lowest again, she is out of the game.", "Se for a menor de novo, está fora do jogo.")
      ], 7, false]
    ];
    if (!rules().holsterAttach) {
      examples.push([t("A Holster changes a Robbery", "Um Coldre muda um Roubo"), [
        t("Ana robs one of Bruno's Safes with a Pepperbox; Bruno defends with a Colt.", "Ana rouba um Cofre de Bruno com uma Pepperbox; Bruno defende com um Colt."),
        t("Before the roll, Carla gives Ana a Holster whose card shows a Winchester.", "Antes da rolagem, Carla dá a Ana um Coldre cuja carta mostra uma Winchester."),
        t("Ana rolls Pepperbox + Winchester and adds them; Bruno rolls only the Colt.", "Ana rola Pepperbox + Winchester e soma; Bruno rola só o Colt."),
        t("After the turn, Ana, Bruno and Carla each draw 1 card.", "Depois do turno, Ana, Bruno e Carla compram 1 carta cada.")
      ], 5, true]);
    }
    examples.push([t("A 4th Safe", "Um 4º Cofre"), [
      t("Dani has 3 Safes and wins a Heist.", "Dani tem 3 Cofres e vence um Assalto."),
      t("She shuffles the new Safe into her row, then must give any one of her 4 Safes to the player with the fewest Safes.", "Ela embaralha o Cofre novo na fileira e depois precisa dar qualquer um dos 4 ao jogador com menos Cofres."),
      t("Two players tie with 1 Safe each: Dani picks which of them receives it. The recipient may not shuffle.", "Dois jogadores empatam com 1 Cofre cada: Dani escolhe qual recebe. Quem recebe não pode embaralhar.")
    ], 8, true]);
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), sectionIndex("examples"), examples.map((example) => example[2]))}
      <div class="example-grid">${examples.map(([title, items, page, guide], index) => `
        <article class="example-card">
          <span class="card-number">${String(index + 1).padStart(2, "0")}</span>
          <h3>${title}</h3>
          ${lineList(items)}
          <div class="example-source"><span>${guide ? t("Guide's example (rule from the rulebook)", "Exemplo do guia (regra do manual)") : t("Rulebook example", "Exemplo do manual")}</span>${referenceLink(page)}</div>
        </article>`).join("")}</div>`;
  }

  // ---------- advice ----------

  function adviceSection() {
    const items = [
      rl("Teamwork vs selfishness", "spend all your best cards and Badges hunting Gold for the team and you will be defenceless against your teammates in the Final Showdown; hoard Showdown Guns and your team may not reach it.", "Equipe vs egoísmo", "gaste as melhores cartas e Distintivos caçando Ouro para a equipe e você ficará indefeso contra os colegas no Confronto Final; acumule Armas do Confronto e a equipe pode nem chegar lá."),
      rl("Watch your teammates", "a teammate not pulling their weight may be planning to ride your Gold into the Showdown and then destroy you. You may need to attack, mislead, frame, abandon or banish them.", "Vigie os colegas", "um colega que não se esforça pode estar planejando usar o seu Ouro para chegar ao Confronto e depois destruir você. Talvez seja preciso atacar, enganar, incriminar, abandonar ou expulsar."),
      rl("Gather clues", "you get only a handful of turns: talk with allies and watch what others say and do with their Safes.", "Junte pistas", "vocês têm poucos turnos: conversem com aliados e observem o que os outros dizem e fazem com os Cofres."),
      rl("Last-turn move", "short on Gold? Use a Horse or Duel your way into a Gold-rich establishment on your final turn.", "Jogada final", "pouco Ouro? Use um Cavalo ou um Duelo para entrar num estabelecimento rico no seu último turno."),
      rl("Persuade", "invite Gold-rich players into your establishment, or trick undesirable ones into leaving.", "Persuada", "convide jogadores ricos para o seu estabelecimento ou engane os indesejados para saírem."),
      rl("Take notes", "it is not a memory game; write down where you know or suspect Safes are.", "Anote", "não é jogo de memória; anote onde você sabe ou suspeita que estão os Cofres."),
      rl("Manage your guns", "defending every Safe with your best gun can leave you with weak guns when it really counts; sometimes losing a Safe with a bad gun improves your hand.", "Administre as armas", "defender todo Cofre com a melhor arma pode deixar você com armas fracas na hora que importa; às vezes perder um Cofre com uma arma ruim melhora a mão.")
    ];
    return `
      ${sectionHeading("advice", t("Strategy tips", "Dicas de estratégia"), sectionIndex("advice"), [9])}
      <details class="dw-advice">
        <summary>${t("Gameplay strategy tips from the rulebook", "Dicas de estratégia do manual")}</summary>
        ${lineList(items)}
        ${referenceLink(9)}
      </details>`;
  }

  // ---------- glossary ----------

  function glossarySection() {
    const r = rules();
    const visible = [
      { term: ["Safe", "Cofre"], text: ["A face-down card in your row holding Gold, a Badge, a Showdown Gun" + (state.mystery ? " or a Mystery effect" : "") + ". Its contents stay secret until the end.", "Uma carta virada para baixo na sua fileira com Ouro, Distintivo, Arma do Confronto" + (state.mystery ? " ou efeito Misterioso" : "") + ". O conteúdo fica secreto até o fim."], page: 3 },
      { term: ["Deadwood card", "Carta Deadwood"], text: ["Hand card with a gun on top and an item on the bottom; you use one or the other.", "Carta da mão com uma arma em cima e um item embaixo; você usa um ou outro."], page: 4 },
      { term: ["Establishment", "Estabelecimento"], text: [`One of the ${r.establishments} wooden platforms. Your star's establishment is your team; capacity ${r.capacity}.`, `Uma das ${r.establishments} plataformas de madeira. O estabelecimento da sua estrela é a sua equipe; capacidade ${r.capacity}.`], page: 5 },
      { term: ["Vacancy", "Vaga"], text: [`An establishment with fewer than ${r.capacity} stars.`, `Um estabelecimento com menos de ${r.capacity} estrelas.`], page: 5 },
      { term: ["Team / teammates", "Equipe / colegas"], text: ["Players whose stars are in the same establishment. Teams change whenever stars move.", "Jogadores com estrela no mesmo estabelecimento. As equipes mudam sempre que as estrelas se movem."], page: 3 },
      { term: ["Circle", "Volta"], text: ["One turn for every player, clockwise from the first player.", "Um turno para cada jogador, em sentido horário a partir do primeiro."], page: 6 },
      { term: ["Heist stack", "Pilha de Assalto"], text: [`The ${r.heists} face-down Safes in the middle, fought over one at a time in Heists. Nobody may look at them.`, `Os ${r.heists} Cofres virados para baixo no meio, disputados um por vez nos Assaltos. Ninguém pode olhá-los.`], page: 3 },
      { term: ["Showdown Gun", "Arma do Confronto"], text: ["A Safe whose gun adds its die to every one of your Final Showdown rolls.", "Um Cofre cuja arma soma o seu dado a toda rolagem sua no Confronto Final."], page: 11 },
      { term: ["Badge", "Distintivo"], text: ["A Safe that gives an extra turn in the Badge Round; worth no Gold.", "Um Cofre que dá um turno extra na Rodada dos Distintivos; não vale Ouro."], page: 6 },
      { term: ["Attacker / defender", "Atacante / defensor"], text: ["In a Robbery or Duel, the player whose turn it is and the player they target.", "Num Roubo ou Duelo, o jogador da vez e o jogador que ele ataca."], page: 4 },
      { term: ["Black-and-white side", "Lado preto e branco"], text: ["The back of a character card: you have been hit once in the Final Showdown; a second loss puts you out.", "O verso da carta de personagem: você foi atingido uma vez no Confronto Final; uma segunda derrota o elimina."], page: 7 }
    ];
    if (r.stranger) {
      visible.push({ term: ["The Stranger", "O Forasteiro"], text: ["2-player third character with a star and Safes but no turns; your opponent plays guns for it when it is attacked.", "Terceiro personagem da partida de 2, com estrela e Cofres mas sem turnos; o oponente joga armas por ele quando é atacado."], page: 14 });
    }
    if (state.mystery) {
      visible.push({ term: ["Mystery Safe", "Cofre Misterioso"], text: ["Silver-bordered Safe with a special end-game effect.", "Cofre de borda prateada com um efeito especial no fim da partida."], page: 12 });
    }
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
    document.body.classList.add("theme-deadwood");
    document.documentElement.lang = state.language;
    document.title = t("Deadwood 1876 — Field Manual", "Deadwood 1876 — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Deadwood 1876: setup checklist for 2-9 players, Robberies, Duels, Heists, the Badge Round, the Final Showdown, 2-3 player adjustments and the optional advanced rules.",
        "Regras interativas bilíngues de Deadwood 1876: checklist de preparação para 2-9 jogadores, Roubos, Duelos, Assaltos, a Rodada dos Distintivos, o Confronto Final, ajustes para 2-3 jogadores e as regras avançadas opcionais."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook · Dark Cities Series", "Livro interativo · Série Dark Cities")}</p>
          <h1>Deadwood 1876</h1>
          <p class="hero-intro">${t(
            "There's gold in the Black Hills. Team up with the others in your establishment to steal the gold-filled Safes floating around town — but your “friends” are collecting guns to turn on you in the Final Showdown. Will you shoot first?",
            "Há ouro nas Black Hills. Junte-se aos outros do seu estabelecimento para roubar os Cofres cheios de ouro que circulam pela cidade — mas os seus “amigos” estão juntando armas para usar contra você no Confronto Final. Você vai atirar primeiro?"
          )}</p>
          <div class="hero-meta"><span>${t("2-9 players", "2-9 jogadores")}</span><span>${t("20-40 min", "20-40 min")}</span><span>${t("Ages 13+", "13+ anos")}</span><span>${t("Hidden teams & betrayal", "Equipes ocultas e traição")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/deadwood-1876.webp" alt="${t("Cover of the Deadwood 1876 rulebook", "Capa do manual de Deadwood 1876")}" fetchpriority="high"><figcaption>${t("Rulebook cover · illustrations by Sarah Keele", "Capa do manual · ilustrações de Sarah Keele")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("Main Street", "Rua principal")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column dw-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied Deadwood 1876 rulebook (Facade Games, Dark Cities Series), including its 2-3 player adjustments and optional advanced rules. Points marked “Guide's reading” are interpretations where the rulebook is silent. Page links use the rulebook's printed page numbers and open the matching page of the PDF.",
            "Este guia cobre o manual fornecido de Deadwood 1876 (Facade Games, Série Dark Cities), incluindo os ajustes para 2-3 jogadores e as regras avançadas opcionais. Pontos marcados como “Leitura do guia” são interpretações onde o manual é omisso. Os links de página usam a numeração impressa do manual e abrem a página correspondente do PDF."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${flowSection()}</section>
          <section class="rule-section">${turnSection()}</section>
          <section class="rule-section">${lawsSection()}</section>
          <section class="rule-section">${heistSection()}</section>
          <section class="rule-section">${badgeSection()}</section>
          <section class="rule-section">${showdownSection()}</section>
          ${rules().small ? `<section class="rule-section">${smallGameSection()}</section>` : ""}
          <section class="rule-section">${cardsSection()}</section>
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${statsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${adviceSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the Deadwood 1876 rulebook. Rules & gameplay: Travis Hancock; illustrations: Sarah Keele; graphic design: Holly Hancock. Published by Facade Games.",
        "Guia pessoal de consulta baseado no manual de Deadwood 1876. Regras e jogabilidade: Travis Hancock; ilustrações: Sarah Keele; design gráfico: Holly Hancock. Publicado pela Facade Games."
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
      root.querySelector(".dw-page")?.prepend(notice);
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
    if (target.matches("[data-players]")) {
      const players = Number(target.dataset.players);
      if (PLAYER_CHOICES.includes(players) && players !== state.players) {
        changePreference({ players });
      }
      return;
    }
    if (target.matches("[data-mystery]")) {
      const mystery = Number(target.dataset.mystery);
      if (MYSTERY_CHOICES.includes(mystery) && mystery !== state.mystery) {
        changePreference({ mystery });
      }
      return;
    }
    for (const key of ["horseThief", "peace", "fairShare"]) {
      const attr = dataAttr(key);
      if (target.hasAttribute(attr)) {
        const value = target.getAttribute(attr);
        if (YES_NO.includes(value) && value !== state[key]) {
          changePreference({ [key]: value });
        }
        return;
      }
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

  window.Deadwood1876 = { renderInto, onClick, onChange };
})();
