(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.secret-hitler.v1";
  const SETUP_KEY = "field-manual.secret-hitler.setup.v1";
  const MANUAL_FILE = "secret-hitler_core.pdf";
  const ICONS = "assets/secret-hitler/icons/";
  // The supplied rulebook (Goat, Wolf & Cabbage, 2016) has 7 pages with a text layer and no printed page
  // numbers, so the guide cites PDF pages: p. 1 cover, p. 2 overview, object, contents, set up and the role
  // table, p. 3 why two cards, the eyes-closed directions, gameplay and Election steps 1–2, p. 4 eligibility
  // notes, the vote, the Election Tracker and the Legislative Session, p. 5 lying, reshuffling, Executive
  // Action and the four Presidential Powers (with their icons), p. 6 Veto Power and strategy notes,
  // p. 7 credits and the CC BY-NC-SA 4.0 licence. No expansions. The rulebook does NOT say which Fascist
  // slot grants which power for each player count: that is printed on the Fascist track itself.
  // Hidden roles: this guide never asks for, shows or stores anybody's Secret Role or Party Membership.
  const PLAYERS = [5, 6, 7, 8, 9, 10];
  const NARRATORS = ["player", "app"];
  // Rules p. 2: [Liberals, ordinary Fascists]; plus Hitler in every game.
  const ROLES = { 5: [3, 1], 6: [4, 1], 7: [4, 2], 8: [5, 2], 9: [5, 3], 10: [6, 3] };
  const defaults = { language: "pt-BR", players: 7, narrator: "player" };
  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------

  function normalizePreferences(saved) {
    const players = Number(saved?.players);
    return {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      players: PLAYERS.includes(players) ? players : defaults.players,
      narrator: NARRATORS.includes(saved?.narrator) ? saved.narrator : defaults.narrator
    };
  }

  function signature(source = state) {
    return `p${source.players}-${source.narrator}`;
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Secret Hitler preferences.", error);
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
      console.error("Could not read Secret Hitler setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Secret Hitler preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Secret Hitler setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function manualUrl(page) {
    const script = document.querySelector('script[src*="secret-hitler.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${MANUAL_FILE}`, baseUrl).href}#page=${page}`;
  }

  function referenceLink(page) {
    return `<a class="source-link" href="${manualUrl(page)}" target="_blank" rel="noreferrer">${t(`Rules p. ${page} ↗`, `Regras p. ${page} ↗`)}</a>`;
  }

  function sectionHeading(id, title, index, pages) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("GERMANY, 1932", "ALEMANHA, 1932")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="sh-section-references">${pages.map(referenceLink).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
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
    return `<span class="sh-interpretation">${t("Guide's reading", "Leitura do guia")}</span> ${t(en, pt)}`;
  }

  function glyph(file) {
    return `<img class="sh-glyph" src="${ICONS}${file}.webp" alt="${powerName(file)}">`;
  }

  function roles(players = state.players) {
    const [liberals, fascists] = ROLES[players];
    return { liberals, fascists, hitler: 1 };
  }

  function track(players = state.players) {
    return players <= 6 ? "5–6" : players <= 8 ? "7–8" : "9–10";
  }

  function playersLabel(players = state.players) {
    return t(`${players} players`, `${players} jogadores`);
  }

  function fascistsLabel(count) {
    return count === 1 ? t("1 Fascist", "1 Fascista") : t(`${count} Fascists`, `${count} Fascistas`);
  }

  function narratorName(value = state.narrator) {
    return value === "player"
      ? t("A player reads the directions", "Um jogador lê as instruções")
      : t("Companion app narrates", "O aplicativo narra");
  }

  function fivePlayers() {
    return state.players === 5;
  }

  function powerName(id) {
    return {
      investigate: t("Investigate Loyalty", "Investigar Lealdade (Investigate Loyalty)"),
      "special-election": t("Call Special Election", "Convocar Eleição Especial (Call Special Election)"),
      "policy-peek": t("Policy Peek", "Espiar Políticas (Policy Peek)"),
      execution: t("Execution", "Execução (Execution)")
    }[id];
  }

  function termLimitLines() {
    return fivePlayers()
      ? [
        rl("Term limit (5 players)", "with only five players in the game, only the last elected Chancellor is ineligible; the last elected President may be nominated.", "Limite de mandato (5 jogadores)", "com só cinco jogadores na partida, só o último Chanceler eleito fica inelegível; o último Presidente eleito pode ser indicado."),
        interpretation("after an Execution leaves fewer than five living players, the same five-player rule keeps applying.", "depois que uma Execução deixa menos de cinco jogadores vivos, a mesma regra de cinco jogadores continua valendo.")
      ]
      : [
        rl("Term limits", "the last elected President and the last elected Chancellor cannot be nominated as Chancellor.", "Limites de mandato", "o último Presidente eleito e o último Chanceler eleito não podem ser indicados a Chanceler."),
        rl("Five players left", "once Executions bring the game down to five living players (or fewer — guide's reading), only the last elected Chancellor is ineligible.", "Restam cinco", "quando as Execuções reduzirem a partida a cinco jogadores vivos (ou menos — leitura do guia), só o último Chanceler eleito fica inelegível.")
      ];
  }

  // ---------- sections ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["teams", t("Teams & winning", "Times e vitória")],
      ["election", t("Election", "Eleição")],
      ["legislative", t("Legislative Session", "Sessão Legislativa")],
      ["powers", t("Presidential Powers", "Poderes Presidenciais")],
      ["veto", t("Veto Power", "Poder de Veto")],
      ["lying", t("Lying & table talk", "Mentiras e conversa")],
      ["strategy", t("Strategy notes", "Notas de estratégia")],
      ["icons", t("Iconography", "Iconografia")],
      ["examples", t("Examples", "Exemplos")],
      ["faq", t("Guide's readings", "Leituras do guia")],
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
          <span class="brand-mark" aria-hidden="true">SH</span>
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
      `${readFailed ? "This browser could not read the saved options or setup progress for this game; defaults are shown. " : ""}${writeFailed ? "The latest change could not be saved and is visible on screen only." : ""}`,
      `${readFailed ? "Este navegador não conseguiu ler as opções ou o progresso da preparação salvos deste jogo; as opções padrão estão sendo mostradas. " : ""}${writeFailed ? "A alteração mais recente não pôde ser salva e aparece somente na tela." : ""}`
    ).trim();
  }

  // ---------- configuration ----------

  function choiceCard(name, value, dataAttr, checked, title, description) {
    return `
      <label class="sh-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" ${dataAttr} ${checked ? "checked" : ""}>
        <span class="sh-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function playerChoiceText(players) {
    const info = roles(players);
    return t(
      `${info.liberals} Liberals · ${fascistsLabel(info.fascists)} + Hitler. Fascist track for ${track(players)} players. ${players <= 6 ? "Hitler and the Fascist know each other." : "The Fascists know Hitler; Hitler does not know them."}${players === 5 ? " Only the last Chancellor is term-limited." : ""}`,
      `${info.liberals} Liberais · ${fascistsLabel(info.fascists)} + Hitler. Trilha Fascista de ${track(players)} jogadores. ${players <= 6 ? "Hitler e o Fascista se conhecem." : "Os Fascistas conhecem Hitler; Hitler não os conhece."}${players === 5 ? " Só o último Chanceler tem limite de mandato." : ""}`
    );
  }

  function matchConfiguration() {
    return `
      <section class="controls-panel sh-config" id="build-match" aria-labelledby="sh-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="sh-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "The supplied rulebook has no expansions or optional rules. Choose the number of players — it sets the roles, the Fascist track and the eyes-closed directions — and who narrates those directions. Changing either clears the setup checklist; changing the language does not. Nothing secret is asked or stored here.",
              "O livro de regras fornecido não tem expansões nem regras opcionais. Escolha o número de jogadores — ele define os papéis, a trilha Fascista e as instruções de olhos fechados — e quem narra essas instruções. Mudar qualquer um dos dois limpa a lista da preparação; trocar o idioma não. Nada secreto é perguntado ou salvo aqui."
            )}</p>
          </div>
        </div>
        <fieldset class="sh-choice-group">
          <legend>${t("Players · selected:", "Jogadores · selecionado:")} <span>${playersLabel()}</span></legend>
          <p class="sh-choice-intro">${t("Secret Hitler is for 5 to 10 players. The role table:", "Secret Hitler é para 5 a 10 jogadores. A tabela de papéis:")} ${referenceLink(2)}</p>
          <div class="sh-choice-grid sh-choice-grid-players">
            ${PLAYERS.map((players) => choiceCard("sh-players", players, `data-players="${players}"`, state.players === players, playersLabel(players), playerChoiceText(players))).join("")}
          </div>
        </fieldset>
        <fieldset class="sh-choice-group">
          <legend>${t("Eyes-closed directions · selected:", "Instruções de olhos fechados · selecionado:")} <span>${narratorName()}</span></legend>
          <p class="sh-choice-intro">${t("Setup step 5: the Fascists (and, with 5–6 players, Hitler) secretly learn who their teammates are. Changes only who speaks the directions.", "Passo 5 da preparação: os Fascistas (e, com 5–6 jogadores, Hitler) descobrem em segredo quem são os colegas de time. Muda só quem fala as instruções.")} ${referenceLink(3)}</p>
          <div class="sh-choice-grid">
            ${choiceCard("sh-narrator", "player", 'data-narrator="player"', state.narrator === "player", narratorName("player"), t("One player at the table reads the directions printed in this guide aloud. They are still a normal player: they close their eyes and follow the directions too. No extra component.", "Um jogador da mesa lê em voz alta as instruções impressas neste guia. Ele continua sendo um jogador normal: também fecha os olhos e segue as instruções. Nenhum componente extra."))}
            ${choiceCard("sh-narrator", "app", 'data-narrator="app"', state.narrator === "app", narratorName("app"), t("The rulebook points to a companion app at secrethitler.com/app that can narrate the same directions. It is not in the box and this guide has not checked it; the directions are still printed below as a fallback.", "O livro indica um aplicativo de apoio em secrethitler.com/app que pode narrar as mesmas instruções. Ele não vem na caixa e este guia não o conferiu; as instruções continuam impressas abaixo como alternativa."))}
          </div>
        </fieldset>
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function nightScript() {
    if (state.players <= 6) {
      return [
        t("“Everybody close your eyes.”", "“Todos fechem os olhos.”"),
        t("“Fascist and Hitler, open your eyes and acknowledge each other.” [Take a long pause.]", "“Fascista e Hitler, abram os olhos e reconheçam um ao outro.” [Faça uma pausa longa.]"),
        t("“Everyone close your eyes.”", "“Todos fechem os olhos.”"),
        t("“Everyone can open your eyes. If anyone is confused or something went wrong, please tell the group now.”", "“Todos podem abrir os olhos. Se alguém ficou confuso ou algo deu errado, avise o grupo agora.”")
      ];
    }
    return [
      t("“Everybody close your eyes and extend your hand into a fist in front of you.”", "“Todos fechem os olhos e estendam a mão fechada em punho à sua frente.”"),
      t("“All Fascists who are NOT Hitler should open their eyes and acknowledge each other.”", "“Todos os Fascistas que NÃO são Hitler abram os olhos e reconheçam uns aos outros.”"),
      t("“Hitler — keep your eyes closed but put your thumb out into a thumbs-up gesture.”", "“Hitler — mantenha os olhos fechados, mas estique o polegar para cima (sinal de positivo).”"),
      t("“Fascists, take note of who has an extended thumb — that player is Hitler.” [Take a long pause.]", "“Fascistas, vejam quem está com o polegar esticado — esse jogador é Hitler.” [Faça uma pausa longa.]"),
      t("“Everyone close your eyes and put your hands down.”", "“Todos fechem os olhos e abaixem as mãos.”"),
      t("“Everyone can open your eyes. If anyone is confused or something went wrong, please tell the group now.”", "“Todos podem abrir os olhos. Se alguém ficou confuso ou algo deu errado, avise o grupo agora.”")
    ];
  }

  function setupPhases() {
    const info = roles();
    const scriptList = `<ol class="sh-script">${nightScript().map((line) => `<li>${line}</li>`).join("")}</ol>`;
    return [
      {
        id: "boards",
        title: t("Boards, Policy deck and markers", "Tabuleiros, baralho de Políticas e marcadores"),
        pages: [2],
        items: [
          t(`Take the Fascist track for ${track()} players and place it next to any Liberal track. Leave the rest of the boards in the box.`, `Pegue a trilha Fascista de ${track()} jogadores e coloque-a ao lado de qualquer trilha Liberal. Deixe o resto dos tabuleiros na caixa.`),
          interpretation("the rulebook only says “select the Fascist track that corresponds to the number of players”; look for the player range printed on each Fascist track.", "o livro só diz “escolha a trilha Fascista que corresponde ao número de jogadores”; procure a faixa de jogadores impressa em cada trilha Fascista."),
          t("Shuffle the 11 Fascist and the 6 Liberal Policy tiles into one Policy deck (17 tiles) and place it face down on the Draw pile card.", "Embaralhe as 11 peças de Política Fascista e as 6 Liberais num único baralho de Políticas (17 peças) e coloque-o virado para baixo sobre a carta Draw pile (pilha de compra)."),
          t("Place the Discard pile card beside it, empty.", "Coloque a carta Discard pile (descarte) ao lado, vazia."),
          interpretation("the rulebook does not say where the Election Tracker marker starts; find the row of Election Tracker spaces printed on the boards in play and put the marker before its first space (no failed elections yet).", "o livro não diz onde o marcador Election Tracker começa; procure a fileira de espaços do Marcador de Eleições impressa nos tabuleiros em uso e coloque o marcador antes do primeiro espaço (nenhuma eleição fracassada ainda).")
        ]
      },
      {
        id: "envelopes",
        title: t(`Pack ${state.players} envelopes`, `Monte ${state.players} envelopes`),
        pages: [2],
        items: [
          t(`Take ${state.players} card envelopes, one per player. Return the other ${10 - state.players} to the box.`, `Pegue ${state.players} envelopes, um por jogador. Devolva os outros ${10 - state.players} à caixa.`),
          t(`Secret Role cards: ${info.liberals} Liberal + ${info.fascists} Fascist + 1 Hitler (${state.players} cards). Make sure you have ${fascistsLabel(info.fascists).toLowerCase()} in addition to Hitler.`, `Cartas de Papel Secreto (Secret Role): ${info.liberals} Liberal + ${info.fascists} Fascista + 1 Hitler (${state.players} cartas). Confira que há ${fascistsLabel(info.fascists).toLowerCase()} além de Hitler.`),
          t(`Party Membership cards: a Liberal one goes with each Liberal Role, a Fascist one with each Fascist Role and with Hitler — ${info.liberals} Liberal + ${info.fascists + 1} Fascist.`, `Cartas de Filiação Partidária (Party Membership): uma Liberal acompanha cada Papel Liberal, uma Fascista acompanha cada Papel Fascista e Hitler — ${info.liberals} Liberais + ${info.fascists + 1} Fascistas.`),
          t("Each envelope gets: 1 Secret Role card, its matching Party Membership card, 1 Ja! Ballot card and 1 Nein Ballot card.", "Cada envelope recebe: 1 carta de Papel Secreto, a carta de Filiação correspondente, 1 cédula Ja! (sim) e 1 cédula Nein (não)."),
          t("Return every unused Role, Party Membership and Ballot card to the box without showing them.", "Devolva à caixa, sem mostrar, todas as cartas de Papel, Filiação e cédulas não usadas.")
        ]
      },
      {
        id: "deal",
        title: t("Shuffle, hand out and look in secret", "Embaralhe, distribua e olhe em segredo"),
        pages: [2, 3],
        items: [
          t("Shuffle the filled envelopes well so each player's role is a secret; every player takes one at random.", "Embaralhe bem os envelopes cheios para que o papel de cada jogador seja segredo; cada jogador pega um ao acaso."),
          t("Secret: look at your own Secret Role card without showing anyone. Keep it and your Party Membership card hidden for the whole game; keep your Ja! and Nein cards ready for votes.", "Segredo: olhe a sua carta de Papel Secreto sem mostrar a ninguém. Mantenha-a e a carta de Filiação escondidas a partida toda; deixe as cédulas Ja! e Nein prontas para as votações."),
          t("Your Party Membership card shows only Liberal or Fascist — Hitler's says Fascist. It is the card handed over when someone investigates you.", "A carta de Filiação mostra só Liberal ou Fascista — a de Hitler diz Fascista. É ela que você entrega quando alguém te investiga.")
        ]
      },
      {
        id: "first-president",
        title: t("Choose the first Presidential Candidate", "Escolha o primeiro Candidato à Presidência"),
        pages: [3],
        items: [
          t("Pick one player at random as the first Presidential Candidate.", "Sorteie um jogador para ser o primeiro Candidato à Presidência."),
          t("Clockwise is the same as “to the left” in the rulebook: the presidency always passes to the player on the current President's left.", "Sentido horário é o mesmo que “para a esquerda” no livro: a presidência sempre passa ao jogador à esquerda do Presidente atual."),
          t("Pass that player both the President placard and the Chancellor placard. Play goes clockwise.", "Passe a esse jogador a placa de Presidente e a placa de Chanceler. O jogo segue em sentido horário.")
        ]
      },
      {
        id: "eyes-closed",
        title: t(`Eyes-closed phase (${state.players <= 6 ? "5–6" : "7–10"} players)`, `Fase de olhos fechados (${state.players <= 6 ? "5–6" : "7–10"} jogadores)`),
        pages: [3],
        items: [
          state.narrator === "app"
            ? t("Start the companion app (secrethitler.com/app) and let it narrate. If it is not available, one player reads these directions aloud:", "Abra o aplicativo de apoio (secrethitler.com/app) e deixe-o narrar. Se não estiver disponível, um jogador lê estas instruções em voz alta:") + scriptList
            : t("One player reads these directions aloud to everyone, and follows them too:", "Um jogador lê estas instruções em voz alta para todos, e também as segue:") + scriptList,
          state.players <= 6
            ? t("Result: the Fascist and Hitler know each other; the Liberals know nothing.", "Resultado: o Fascista e Hitler se conhecem; os Liberais não sabem nada.")
            : t("Result: the Fascists know each other and know Hitler; Hitler does not know who the Fascists are; the Liberals know nothing.", "Resultado: os Fascistas se conhecem e sabem quem é Hitler; Hitler não sabe quem são os Fascistas; os Liberais não sabem nada."),
          interpretation("if someone reports a problem, the rulebook only says to tell the group; the guide suggests collecting the envelopes, re-shuffling them and repeating steps 3 and 5.", "se alguém relatar um problema, o livro só diz para avisar o grupo; o guia sugere recolher os envelopes, embaralhá-los de novo e repetir os passos 3 e 5.")
        ]
      }
    ];
  }

  function inventory() {
    const info = roles();
    const cards = [
      infoCard(t("POLICY TILES", "PEÇAS DE POLÍTICA"), t("All 17", "Todas as 17"), [
        rl("Liberal", "6.", "Liberais", "6."),
        rl("Fascist", "11.", "Fascistas", "11."),
        t("One face-down deck on the Draw pile card.", "Um baralho virado para baixo sobre a carta Draw pile.")
      ], [2]),
      infoCard(t("BOARDS", "TABULEIROS"), t(`Liberal track + Fascist track ${track()}`, `Trilha Liberal + trilha Fascista ${track()}`), [
        t("The box has 3 Liberal/Fascist boards; use one Liberal track and the Fascist track for this player count.", "A caixa tem 3 tabuleiros Liberal/Fascista; use uma trilha Liberal e a trilha Fascista deste número de jogadores."),
        t("The Fascist track shows which slots grant Presidential Powers.", "A trilha Fascista mostra quais espaços dão Poderes Presidenciais.")
      ], [2, 5]),
      infoCard(t("ENVELOPES", "ENVELOPES"), t(`${state.players} of 10 · one per player`, `${state.players} de 10 · um por jogador`), [
        rl("Secret Role", `${info.liberals} Liberal, ${info.fascists} Fascist, 1 Hitler.`, "Papel Secreto", `${info.liberals} Liberal, ${info.fascists} Fascista, 1 Hitler.`),
        rl("Party Membership", `${info.liberals} Liberal, ${info.fascists + 1} Fascist.`, "Filiação Partidária", `${info.liberals} Liberal, ${info.fascists + 1} Fascista.`),
        rl("Ballots", `${state.players} Ja! + ${state.players} Nein.`, "Cédulas", `${state.players} Ja! + ${state.players} Nein.`)
      ], [2]),
      infoCard(t("TABLE PIECES", "PEÇAS DA MESA"), t("Shared", "Compartilhadas"), [
        rl("Draw pile card", "holds the Policy deck.", "Carta Draw pile", "segura o baralho de Políticas."),
        rl("Discard pile card", "face-down discarded tiles.", "Carta Discard pile", "peças descartadas viradas para baixo."),
        rl("Election Tracker marker", "counts failed governments.", "Marcador Election Tracker", "conta governos fracassados."),
        rl("Placards", "President and Chancellor, start with the first Presidential Candidate.", "Placas", "Presidente e Chanceler, começam com o primeiro Candidato à Presidência.")
      ], [2, 3])
    ];
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
        <label class="sh-setup-check" for="sh-setup-${phase.id}">
          <input id="sh-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="sh-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="sh-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), sectionIndex("setup"), [2, 3])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Form the Reichstag", "Monte o Reichstag")} · ${playersLabel()} · ${narratorName()}</h3>
            <p>${t("One checkbox per coherent step, in the rulebook's order.", "Uma caixa por etapa coerente, na ordem do livro.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved on this device separately from the match options. Changing the players or the narrator clears it; changing the language does not. “Uncheck all” clears only these setup boxes.",
          "O progresso é salvo neste aparelho separado das opções da partida. Mudar os jogadores ou o narrador o limpa; trocar o idioma não. “Desmarcar tudo” limpa somente estas caixas da preparação."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}`;
  }

  // ---------- quick reference ----------

  function quickReference() {
    const cards = [
      infoCard(t("EACH ROUND", "CADA RODADA"), t("Three parts, in order", "Três partes, em ordem"), [
        rl("1 · Election", "form a government (President + Chancellor).", "1 · Eleição", "forme um governo (Presidente + Chanceler)."),
        rl("2 · Legislative Session", "the government enacts one Policy in secret.", "2 · Sessão Legislativa", "o governo aprova uma Política em segredo."),
        rl("3 · Executive Action", "only if the new Fascist Policy covered a Presidential Power.", "3 · Ação Executiva", "só se a nova Política Fascista cobriu um Poder Presidencial.")
      ], [3]),
      infoCard(t("ELECTION", "ELEIÇÃO"), t("Pass, nominate, vote", "Passar, indicar, votar"), [
        rl("Pass", "the President placard moves clockwise — to the left — to the next living player: the new Presidential Candidate.", "Passe", "a placa de Presidente vai em sentido horário — para a esquerda — ao próximo jogador vivo: o novo Candidato à Presidência."),
        rl("Nominate", "the Candidate hands the Chancellor placard to any other eligible player.", "Indique", "o Candidato entrega a placa de Chanceler a qualquer outro jogador elegível."),
        ...termLimitLines(),
        rl("Vote", "after discussion, every living player — candidates included — reveals Ja! or Nein at the same time.", "Vote", "depois da discussão, todo jogador vivo — candidatos inclusive — revela Ja! ou Nein ao mesmo tempo.")
      ], [3, 4]),
      infoCard(t("VOTE RESULT", "RESULTADO DA VOTAÇÃO"), t("Majority Ja! or not", "Maioria Ja! ou não"), [
        rl("Majority Ja!", "the candidates become President and Chancellor.", "Maioria Ja!", "os candidatos viram Presidente e Chanceler."),
        rl("3+ Fascist Policies enacted", "ask if the new Chancellor is Hitler. Yes → Fascists win. No → everyone knows they are not Hitler.", "3+ Políticas Fascistas aprovadas", "pergunte se o novo Chanceler é Hitler. Sim → Fascistas vencem. Não → todos sabem que ele não é Hitler."),
        rl("Tie or majority Nein", "vote fails; Election Tracker +1; the President placard moves on clockwise — that is the next Election's Pass, so move it only once.", "Empate ou maioria Nein", "a votação falha; Election Tracker +1; a placa de Presidente segue em sentido horário — esse é o Passe da próxima Eleição, então mova-a só uma vez."),
        rl("Third failure in a row", "chaos: enact the top Policy of the deck at once, ignore its power, reset the Election Tracker, forget term limits.", "Terceira falha seguida", "caos: aprove na hora a Política do topo do baralho, ignore o poder, zere o Election Tracker, esqueça os limites de mandato.")
      ], [4]),
      infoCard(t("LEGISLATIVE SESSION", "SESSÃO LEGISLATIVA"), t("In secret, no talking", "Em segredo, sem conversa"), [
        rl("President", "draws the top 3 tiles, discards 1 face down, hands the other 2 to the Chancellor at the same time.", "Presidente", "compra as 3 peças do topo, descarta 1 virada para baixo e entrega as outras 2 ao Chanceler ao mesmo tempo."),
        rl("Chancellor", "discards 1 face down and enacts the other face up on its track.", "Chanceler", "descarta 1 virada para baixo e aprova a outra, virada para cima, na sua trilha."),
        rl("Forbidden", "any verbal or nonverbal signal between them; picking at random or shuffling.", "Proibido", "qualquer sinal verbal ou não verbal entre eles; escolher ao acaso ou embaralhar."),
        rl("Discards", "never revealed. Players may lie about what they saw.", "Descartes", "nunca revelados. Os jogadores podem mentir sobre o que viram."),
        rl("Fewer than 3 left", "at the end of the session, shuffle the deck with the discards into a new deck.", "Menos de 3 restantes", "no fim da sessão, embaralhe o baralho com os descartes num novo baralho."),
        rl("Any new Policy face up", "resets the Election Tracker.", "Toda Política nova aprovada", "zera o Election Tracker.")
      ], [4, 5]),
      infoCard(t("PRESIDENTIAL POWERS", "PODERES PRESIDENCIAIS"), t("If the Fascist Policy covers one", "Se a Política Fascista cobrir um"), [
        t("The sitting President must use it now, once; gameplay waits. The Fascist track shows which slot grants which power.", "O Presidente atual tem de usá-lo agora, uma vez; o jogo espera. A trilha Fascista mostra qual espaço dá qual poder."),
        `${glyph("investigate")} ${rl("Investigate Loyalty", "see one player's Party Membership card in secret. Nobody twice.", "Investigar", "veja em segredo a carta de Filiação de um jogador. Ninguém duas vezes.")}`,
        `${glyph("special-election")} ${rl("Call Special Election", "choose any other player as the next Presidential Candidate.", "Eleição Especial", "escolha qualquer outro jogador como próximo Candidato à Presidência.")}`,
        `${glyph("policy-peek")} ${rl("Policy Peek", "look at the top 3 tiles in secret; put them back in order.", "Espiar", "olhe em segredo as 3 peças do topo; devolva-as na mesma ordem.")}`,
        `${glyph("execution")} ${rl("Execution", "“I formally execute [name].” Hitler → Liberals win; otherwise the role stays secret.", "Execução", "“Eu executo formalmente [nome].” Hitler → Liberais vencem; senão o papel continua secreto.")}`
      ], [5]),
      infoCard(t("VETO POWER", "PODER DE VETO"), t("After 5 Fascist Policies", "Depois de 5 Políticas Fascistas"), [
        rl("Chancellor", "with the 2 tiles in hand may say “I wish to veto this agenda.”", "Chanceler", "com as 2 peças na mão pode dizer “Desejo vetar esta pauta.”"),
        rl("President agrees", "“I agree to the veto”: both tiles are discarded, Election Tracker +1, the placard passes left (clockwise) as usual.", "Presidente concorda", "“Concordo com o veto”: as duas peças são descartadas, Election Tracker +1, a placa passa à esquerda (sentido horário) normalmente."),
        rl("President refuses", "the Chancellor must enact one of the two as normal.", "Presidente recusa", "o Chanceler tem de aprovar uma das duas normalmente.")
      ], [6]),
      infoCard(t("WINNING", "VITÓRIA"), t("Checked at once", "Verificada na hora"), [
        rl("Liberals", "5 Liberal Policies enacted, or Hitler executed.", "Liberais", "5 Políticas Liberais aprovadas, ou Hitler executado."),
        rl("Fascists (and Hitler)", "6 Fascist Policies enacted, or Hitler elected Chancellor after the 3rd Fascist Policy.", "Fascistas (e Hitler)", "6 Políticas Fascistas aprovadas, ou Hitler eleito Chanceler depois da 3ª Política Fascista.")
      ], [2]),
      infoCard(t("TRUTH & LIES", "VERDADE E MENTIRA"), t("Lie about anything hidden — except…", "Minta sobre tudo que é oculto — exceto…"), [
        rl("Always allowed", "lying about tiles you saw, investigation results and your role.", "Sempre permitido", "mentir sobre peças que viu, resultados de investigação e o seu papel."),
        rl("Hitler must admit it", "when executed, or when elected Chancellor after 3 Fascist Policies.", "Hitler tem de admitir", "quando executado, ou quando eleito Chanceler depois de 3 Políticas Fascistas."),
        rl("Executed players", "are out: they may not speak, vote or run for office.", "Executados", "estão fora: não podem falar, votar nem concorrer a cargos.")
      ], [5])
    ];
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), sectionIndex("quick-reference"), [3, 4, 5, 6])}
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- rules sections ----------

  function teamsSection() {
    const info = roles();
    return `
      ${sectionHeading("teams", t("Teams & winning", "Times e vitória"), sectionIndex("teams"), [2, 3])}
      <p class="sh-lede">${t(
        "The year is 1932, pre-WWII Germany. Every player is a politician with a secret identity: the Liberals try to hold a fragile government together; hidden Fascists, and Secret Hitler, sow chaos. Whenever a Fascist Policy is enacted the government grows more powerful — even Liberals may be tempted to enact one for its power.",
        "É 1932, Alemanha antes da Segunda Guerra. Cada jogador é um político com identidade secreta: os Liberais tentam manter unido um governo frágil; Fascistas ocultos, e Secret Hitler, semeiam o caos. Sempre que uma Política Fascista é aprovada o governo fica mais poderoso — até os Liberais podem se sentir tentados a aprovar uma pelo poder."
      )}</p>
      <div class="quick-grid">
        ${infoCard(t("LIBERAL TEAM", "TIME LIBERAL"), t(`${info.liberals} Liberals · the majority`, `${info.liberals} Liberais · a maioria`), [
          rl("Know", "nothing about anyone else.", "Sabem", "nada sobre ninguém."),
          rl("Win if", "five Liberal Policies are enacted.", "Vencem se", "cinco Políticas Liberais forem aprovadas."),
          rl("Or if", "Hitler is assassinated (executed).", "Ou se", "Hitler for assassinado (executado).")
        ], [2], "victory-card sh-liberal")}
        ${infoCard(t("FASCIST TEAM", "TIME FASCISTA"), t(`${fascistsLabel(info.fascists)} + Hitler`, `${fascistsLabel(info.fascists)} + Hitler`), [
          state.players <= 6
            ? rl("Know", "the Fascist and Hitler know each other from the start.", "Sabem", "o Fascista e Hitler se conhecem desde o início.")
            : rl("Know", "the Fascists know each other and know Hitler; Hitler does not know the Fascists and must work them out.", "Sabem", "os Fascistas se conhecem e sabem quem é Hitler; Hitler não conhece os Fascistas e precisa descobri-los."),
          rl("Win if", "six Fascist Policies are enacted.", "Vencem se", "seis Políticas Fascistas forem aprovadas."),
          rl("Or if", "Hitler is elected Chancellor any time after the third Fascist Policy has been enacted.", "Ou se", "Hitler for eleito Chanceler a qualquer momento depois da terceira Política Fascista aprovada.")
        ], [2, 3], "victory-card sh-fascist")}
        ${infoCard(t("TWO CARDS EACH", "DUAS CARTAS CADA"), t("Why Role and Party Membership?", "Por que Papel e Filiação?"), [
          rl("Secret Role", "Liberal, Fascist or Hitler: who you really are. Never shown.", "Papel Secreto", "Liberal, Fascista ou Hitler: quem você realmente é. Nunca é mostrado."),
          rl("Party Membership", "only Liberal or Fascist. Hitler's says Fascist with no hint of the special role.", "Filiação Partidária", "só Liberal ou Fascista. A de Hitler diz Fascista sem nenhuma pista do papel especial."),
          rl("So", "a Liberal who uncovers a Fascist must work out alone whether it is an ordinary Fascist or their leader.", "Assim", "um Liberal que descobre um Fascista precisa deduzir sozinho se é um Fascista comum ou o líder.")
        ], [3])}
      </div>`;
  }

  function electionSection() {
    return `
      ${sectionHeading("election", t("Election", "Eleição"), sectionIndex("election"), [3, 4])}
      <p class="sh-lede">${t("The game is played in rounds. Each round starts with an Election to form a government.", "O jogo é jogado em rodadas. Cada rodada começa com uma Eleição para formar um governo.")}</p>
      <div class="quick-grid">
        ${infoCard(t("STEP 1", "PASSO 1"), t("Pass the Presidential Candidacy", "Passe a Candidatura à Presidência"), [
          t("At the start of a new round the President placard moves clockwise to the next player, who is the new Presidential Candidate.", "No início de uma nova rodada a placa de Presidente vai em sentido horário ao próximo jogador, que é o novo Candidato à Presidência."),
          rl("First round", "the randomly chosen player already holds the placards and is the Candidate (guide's reading).", "Primeira rodada", "o jogador sorteado já está com as placas e é o Candidato (leitura do guia)."),
          rl("Executed players", "are skipped — they may not run for office.", "Executados", "são pulados — não podem concorrer a cargos."),
          rl("Anyone can be President", "even the player who was just Chancellor.", "Qualquer um pode ser Presidente", "até quem acabou de ser Chanceler.")
        ], [3, 4, 5])}
        ${infoCard(t("STEP 2", "PASSO 2"), t("Nominate a Chancellor", "Indique um Chanceler"), [
          t("The Presidential Candidate passes the Chancellor placard to any other eligible player: the Chancellor Candidate.", "O Candidato à Presidência passa a placa de Chanceler a qualquer outro jogador elegível: o Candidato a Chanceler."),
          t("The Candidate may discuss options with the table first to build consensus.", "O Candidato pode discutir as opções com a mesa antes, para criar consenso."),
          ...termLimitLines(),
          rl("Last elected, not last nominated", "term limits follow the last government that was actually elected.", "Último eleito, não último indicado", "os limites seguem o último governo realmente eleito."),
          rl("Only the Chancellorship", "term limits never stop anyone from being President.", "Só para Chanceler", "os limites nunca impedem alguém de ser Presidente."),
          rl("After chaos", "term limits are forgotten: everyone is eligible for the next Election.", "Depois do caos", "os limites são esquecidos: todos são elegíveis na próxima Eleição.")
        ], [3, 4])}
        ${infoCard(t("STEP 3", "PASSO 3"), t("Vote on the government", "Vote no governo"), [
          t("Discuss the proposed government until everyone is ready.", "Discutam o governo proposto até todos estarem prontos."),
          t("Every living player, including both Candidates, picks Ja! (yes) or Nein (no) and everyone reveals at the same time: votes are public.", "Todo jogador vivo, inclusive os dois Candidatos, escolhe Ja! (sim) ou Nein (não) e todos revelam ao mesmo tempo: os votos são públicos."),
          rl("Majority Ja!", "the Candidates become President and Chancellor.", "Maioria Ja!", "os Candidatos viram Presidente e Chanceler."),
          rl("Hitler check", "if three or more Fascist Policies are already enacted, ask if the new Chancellor is Hitler. If so, the game ends and the Fascists win; otherwise everyone knows for sure the Chancellor is not Hitler. Then go to the Legislative Session.", "Checagem de Hitler", "se três ou mais Políticas Fascistas já foram aprovadas, pergunte se o novo Chanceler é Hitler. Se for, a partida acaba e os Fascistas vencem; senão todos sabem com certeza que o Chanceler não é Hitler. Depois, vá para a Sessão Legislativa."),
          rl("Tie or majority Nein", "the vote fails: the Candidate misses this chance, the President placard moves clockwise to the next player (the next Election) and the Election Tracker advances by one.", "Empate ou maioria Nein", "a votação falha: o Candidato perde a chance, a placa de Presidente vai em sentido horário ao próximo jogador (a próxima Eleição) e o Election Tracker avança uma casa.")
        ], [4])}
        ${infoCard(t("ELECTION TRACKER", "MARCADOR DE ELEIÇÕES"), t("Three failed governments in a row = chaos", "Três governos fracassados seguidos = caos"), [
          t("Each failed vote (and each Veto) advances the marker by one.", "Cada votação fracassada (e cada Veto) avança o marcador uma casa."),
          rl("On the third", "the country is thrown into chaos: reveal the top Policy of the deck and enact it immediately.", "Na terceira", "o país mergulha no caos: revele a Política do topo do baralho e aprove-a imediatamente."),
          rl("Its power", "is ignored.", "O poder dela", "é ignorado."),
          rl("Reset", "the Election Tracker resets and existing term limits are forgotten.", "Zere", "o Election Tracker volta a zero e os limites de mandato existentes são esquecidos."),
          rl("Short deck", "if fewer than three tiles remain in the deck at this point, shuffle them with the Discard pile into a new deck.", "Baralho curto", "se restarem menos de três peças no baralho nesse momento, embaralhe-as com o descarte num novo baralho."),
          rl("Any new Policy face up", "resets the tracker — by an elected government or by the frustrated populace.", "Toda Política nova aprovada", "zera o marcador — por um governo eleito ou pela população frustrada.")
        ], [4, 6])}
      </div>`;
  }

  function legislativeSection() {
    return `
      ${sectionHeading("legislative", t("Legislative Session", "Sessão Legislativa"), sectionIndex("legislative"), [4, 5])}
      <div class="quick-grid">
        ${infoCard(t("ENACT A POLICY", "APROVE UMA POLÍTICA"), t("President, then Chancellor", "Presidente, depois Chanceler"), [
          rl("1 · President", "draws the top three tiles of the Policy deck, looks at them in secret and discards one face down onto the Discard pile.", "1 · Presidente", "compra as três peças do topo do baralho de Políticas, olha-as em segredo e descarta uma virada para baixo no descarte."),
          rl("2 · Hand over", "the remaining two go to the Chancellor, both at the same time — not one at a time to gauge a reaction.", "2 · Entregue", "as duas restantes vão para o Chanceler, as duas ao mesmo tempo — não uma de cada vez para medir a reação."),
          rl("3 · Chancellor", "looks in secret, discards one face down and enacts the other by placing it face up on the matching track.", "3 · Chanceler", "olha em segredo, descarta uma virada para baixo e aprova a outra colocando-a virada para cima na trilha correspondente."),
          rl("Veto", "see Veto Power: once five Fascist Policies are enacted, the Chancellor may propose a veto instead of step 3.", "Veto", "veja Poder de Veto: depois de cinco Políticas Fascistas aprovadas, o Chanceler pode propor um veto no lugar do passo 3.")
        ], [4, 6])}
        ${infoCard(t("CONDUCT", "CONDUTA"), t("Secret and intentional", "Secreta e intencional"), [
          rl("No communication", "verbal and nonverbal communication between President and Chancellor is forbidden.", "Sem comunicação", "é proibida a comunicação verbal e não verbal entre Presidente e Chanceler."),
          rl("No tricks", "do not pick at random, shuffle before discarding or use any unusual selection procedure to telegraph your hand.", "Sem truques", "não escolha ao acaso, não embaralhe antes de descartar nem use outro procedimento estranho para sinalizar a sua mão."),
          rl("Discards stay hidden", "discarded tiles are never revealed. The table must rely on the word of President and Chancellor, who are free to lie.", "Descartes ocultos", "as peças descartadas nunca são reveladas. A mesa depende da palavra do Presidente e do Chanceler, que podem mentir.")
        ], [4])}
        ${infoCard(t("END OF THE SESSION", "FIM DA SESSÃO"), t("Reshuffle check, then what?", "Reembaralhar? E depois?"), [
          rl("Fewer than 3 tiles left", "shuffle the remaining tiles with the Discard pile into a new Policy deck. Unused tiles are never revealed and never simply placed on top.", "Menos de 3 peças", "embaralhe as peças restantes com o descarte num novo baralho de Políticas. Peças não usadas nunca são reveladas nem simplesmente postas no topo."),
          rl("Reset", "the new face-up Policy resets the Election Tracker.", "Zere", "a nova Política virada para cima zera o Election Tracker."),
          rl("Fascist Policy on a power", "the sitting President uses that power: go to the Executive Action.", "Política Fascista sobre um poder", "o Presidente atual usa esse poder: vá para a Ação Executiva."),
          rl("Liberal Policy, or Fascist with no power", "begin a new round with a new Election.", "Política Liberal, ou Fascista sem poder", "comece uma nova rodada com uma nova Eleição.")
        ], [4, 5])}
      </div>`;
  }

  function powerCard(id, linesEn, linesPt) {
    return `
      <article class="icon-card sh-power-card">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${id}.webp" alt="${powerName(id)}"></span>
        <div><strong>${powerName(id)}</strong>${lineList(state.language === "pt-BR" ? linesPt : linesEn)}${referenceLink(5)}</div>
      </article>`;
  }

  function powersSection() {
    return `
      ${sectionHeading("powers", t("Executive Action: Presidential Powers", "Ação Executiva: Poderes Presidenciais"), sectionIndex("powers"), [5])}
      <div class="quick-grid">
        ${infoCard(t("EXECUTIVE ACTION", "AÇÃO EXECUTIVA"), t("When a Fascist Policy covers a power", "Quando uma Política Fascista cobre um poder"), [
          rl("Where", `the Fascist track for ${track()} players prints a power icon on some of its slots. The rulebook does not list them: look at your track.`, "Onde", `a trilha Fascista de ${track()} jogadores imprime um ícone de poder em alguns dos espaços. O livro não os lista: olhe a sua trilha.`),
          rl("Who", "the sitting President, whatever their team.", "Quem", "o Presidente atual, seja qual for o time."),
          rl("When", "immediately: gameplay cannot continue until the power is used.", "Quando", "imediatamente: o jogo não continua até o poder ser usado."),
          rl("How", "the President may discuss with the table, but decides alone how the power is used.", "Como", "o Presidente pode discutir com a mesa, mas decide sozinho como usar o poder."),
          rl("Once", "powers are used once; they do not stack or roll over to future turns.", "Uma vez", "os poderes são usados uma vez; não se acumulam nem passam para turnos futuros."),
          rl("Chaos", "a Policy enacted by chaos grants no power.", "Caos", "uma Política aprovada pelo caos não dá poder.")
        ], [2, 4, 5])}
      </div>
      <div class="sh-power-grid">
        ${powerCard("investigate", [
          "The President chooses a player to investigate.",
          "That player hands over their Party Membership card — not the Secret Role card!",
          "The President checks the loyalty in secret and returns the card.",
          "The President may share — or lie about — the result.",
          "No player may be investigated twice in the same game."
        ], [
          "O Presidente escolhe um jogador para investigar.",
          "Esse jogador entrega a carta de Filiação Partidária — não a de Papel Secreto!",
          "O Presidente confere a lealdade em segredo e devolve a carta.",
          "O Presidente pode contar — ou mentir sobre — o resultado.",
          "Nenhum jogador pode ser investigado duas vezes na mesma partida."
        ])}
        ${powerCard("special-election", [
          "The President chooses any other player to be the next Presidential Candidate and passes them the President placard — even a term-limited player.",
          "The new Candidate nominates an eligible Chancellor and the Election proceeds as usual.",
          "No one is skipped: afterwards the President placard returns to the player on the left (clockwise) of the President who called the Special Election.",
          "If the President picks the next player in rotation, that player runs twice in a row: once for the Special Election, once for their normal turn."
        ], [
          "O Presidente escolhe qualquer outro jogador para ser o próximo Candidato à Presidência e lhe passa a placa de Presidente — mesmo um jogador com limite de mandato.",
          "O novo Candidato indica um Chanceler elegível e a Eleição segue normalmente.",
          "Ninguém é pulado: depois, a placa de Presidente volta para o jogador à esquerda (sentido horário) do Presidente que convocou a Eleição Especial.",
          "Se o Presidente escolher o próximo jogador da rotação, esse jogador concorre duas vezes seguidas: uma pela Eleição Especial e outra no turno normal."
        ])}
        ${powerCard("policy-peek", [
          "The President secretly looks at the top three tiles of the Policy deck.",
          "They go back on top of the deck in the same order."
        ], [
          "O Presidente olha em segredo as três peças do topo do baralho de Políticas.",
          "Elas voltam ao topo do baralho na mesma ordem."
        ])}
        ${powerCard("execution", [
          "The President says “I formally execute [player name].”",
          "If that player is Hitler, they must say so: the game ends in a Liberal victory.",
          "Otherwise the table must not learn whether a Liberal or a Fascist died; work out the new balance yourselves.",
          "Executed players are removed from the game: they may not speak, vote or run for office."
        ], [
          "O Presidente diz “Eu executo formalmente [nome do jogador].”",
          "Se esse jogador for Hitler, ele tem de dizer: a partida acaba com vitória Liberal.",
          "Senão a mesa não pode saber se morreu um Liberal ou um Fascista; deduzam o novo equilíbrio vocês mesmos.",
          "Jogadores executados saem da partida: não podem falar, votar nem concorrer a cargos."
        ])}
      </div>`;
  }

  function vetoSection() {
    return `
      ${sectionHeading("veto", t("Veto Power", "Poder de Veto"), sectionIndex("veto"), [6])}
      <div class="quick-grid">
        ${infoCard(t("FROM THE 5TH FASCIST POLICY", "A PARTIR DA 5ª POLÍTICA FASCISTA"), t("A permanent new ability", "Uma nova habilidade permanente"), [
          rl("When", "every Legislative Session after the fifth Fascist Policy has been enacted.", "Quando", "toda Sessão Legislativa depois que a quinta Política Fascista for aprovada."),
          rl("1", "the President draws three tiles, discards one and passes two to the Chancellor as usual.", "1", "o Presidente compra três peças, descarta uma e passa duas ao Chanceler normalmente."),
          rl("2", "instead of enacting, the Chancellor may say “I wish to veto this agenda.”", "2", "em vez de aprovar, o Chanceler pode dizer “Desejo vetar esta pauta.”"),
          rl("3a · President agrees", "“I agree to the veto.” Both tiles are discarded and the President placard passes to the left (clockwise) as usual.", "3a · Presidente concorda", "“Concordo com o veto.” As duas peças são descartadas e a placa de Presidente passa à esquerda (sentido horário) normalmente."),
          rl("3b · President refuses", "the Chancellor must enact a Policy as normal.", "3b · Presidente recusa", "o Chanceler tem de aprovar uma Política normalmente."),
          rl("Cost", "each veto is an inactive government: the Election Tracker advances by one.", "Custo", "cada veto é um governo inativo: o Election Tracker avança uma casa."),
          interpretation("a veto that brings the Election Tracker to its third step throws the country into chaos exactly like three rejected governments.", "um veto que leva o Election Tracker à terceira casa mergulha o país no caos exatamente como três governos rejeitados.")
        ], [6])}
      </div>`;
  }

  function lyingSection() {
    return `
      ${sectionHeading("lying", t("Lying & table talk", "Mentiras e conversa"), sectionIndex("lying"), [4, 5])}
      <div class="quick-grid">
        ${infoCard(t("ABOUT LYING", "SOBRE MENTIR"), t("Hidden knowledge may always be lied about", "Sobre conhecimento oculto sempre se pode mentir"), [
          t("Some players learn things others don't: the President and Chancellor see Policy tiles; an investigating President sees a Party Membership card.", "Alguns jogadores sabem coisas que outros não: o Presidente e o Chanceler veem peças de Política; o Presidente que investiga vê uma carta de Filiação."),
          rl("You may lie", "about any of that, and about who you are.", "Você pode mentir", "sobre tudo isso, e sobre quem você é."),
          rl("You must tell the truth", "only in game-ending Hitler scenarios: Hitler must say so if executed, or if elected Chancellor after three Fascist Policies.", "Você tem de dizer a verdade", "só nos casos de Hitler que encerram a partida: Hitler tem de admitir se for executado, ou se for eleito Chanceler depois de três Políticas Fascistas.")
        ], [5])}
        ${infoCard(t("DURING THE SESSION", "DURANTE A SESSÃO"), t("President and Chancellor stay silent", "Presidente e Chanceler ficam calados"), [
          t("No verbal or nonverbal communication between them while choosing tiles.", "Nenhuma comunicação verbal ou não verbal entre eles enquanto escolhem as peças."),
          t("Telegraphing your hand with randomness or any odd procedure violates the spirit of the game. Don't do it.", "Sinalizar a sua mão com sorteio ou qualquer procedimento estranho viola o espírito do jogo. Não faça isso."),
          t("Afterwards, both may claim anything about what they saw.", "Depois, os dois podem afirmar qualquer coisa sobre o que viram.")
        ], [4])}
      </div>`;
  }

  function strategySection() {
    return `
      ${sectionHeading("strategy", t("Strategy notes", "Notas de estratégia"), sectionIndex("strategy"), [6])}
      <div class="quick-grid">
        ${infoCard(t("EVERYONE", "TODOS"), t("Claim to be a Liberal", "Diga que é Liberal"), [
          t("The Liberal majority can shut out anyone claiming to be a Fascist, so no Fascist gains by outing themselves.", "A maioria Liberal pode excluir quem disser que é Fascista, então nenhum Fascista ganha algo se revelando."),
          t("Liberals should usually tell the truth: they solve the game like a puzzle, and lying hurts their team.", "Os Liberais devem quase sempre dizer a verdade: eles resolvem o jogo como um quebra-cabeça, e mentir prejudica o time."),
          t("Ask players why they took an action — especially Presidential Powers. Ask candidates ahead of time whom they would investigate, appoint or execute.", "Pergunte aos jogadores por que fizeram algo — principalmente com Poderes Presidenciais. Pergunte aos candidatos de antemão quem eles investigariam, nomeariam ou executariam.")
        ], [6])}
        ${infoCard(t("HITLER", "HITLER"), t("Be as Liberal as possible", "Seja o mais Liberal possível"), [
          t("Enact Liberal Policies and vote for Liberal governments; let your Fascists create the openings.", "Aprove Políticas Liberais e vote em governos Liberais; deixe os seus Fascistas criarem as oportunidades."),
          t("Avoid lying, fights and disagreements: you need the Liberals' trust to be elected.", "Evite mentiras, brigas e discussões: você precisa da confiança dos Liberais para ser eleito.")
        ], [6])}
        ${infoCard(t("FASCISTS", "FASCISTAS"), t("Electing Hitler is the core plan", "Eleger Hitler é o plano principal"), [
          t("Fascists most often win by electing Hitler, not by enacting six Policies.", "Os Fascistas vencem com mais frequência elegendo Hitler, não aprovando seis Políticas."),
          t("Win by subtle manipulation and waiting for cover to enact Fascist Policies — not by playing overtly evil.", "Vença com manipulação sutil, esperando cobertura para aprovar Políticas Fascistas — não jogando como vilão declarado."),
          t("Rushing votes and creating confusion helps you; Liberals benefit from slowing down.", "Apressar votações e criar confusão ajuda você; os Liberais ganham desacelerando.")
        ], [6])}
        ${infoCard(t("LIBERALS", "LIBERAIS"), t("Find the culprit", "Ache o culpado"), [
          t("Slow play down and discuss the available information.", "Desacelerem o jogo e discutam as informações disponíveis."),
          t("When a Fascist Policy comes up there are only three possible culprits: the President, the Chancellor or the Policy deck.", "Quando sai uma Política Fascista há só três culpados possíveis: o Presidente, o Chanceler ou o baralho de Políticas.")
        ], [6])}
      </div>`;
  }

  function iconsSection() {
    const items = [
      ["investigate", "A magnifying glass: Investigate Loyalty — see one player's Party Membership card.", "Uma lupa: Investigar Lealdade — veja a carta de Filiação de um jogador."],
      ["special-election", "An officer's cap: Call Special Election — choose the next Presidential Candidate.", "Um quepe: Convocar Eleição Especial — escolha o próximo Candidato à Presidência."],
      ["policy-peek", "A stack of tiles: Policy Peek — look at the top three Policy tiles.", "Uma pilha de peças: Espiar Políticas — olhe as três peças de Política do topo."],
      ["execution", "A bullet: Execution — remove one player from the game.", "Uma bala: Execução — tire um jogador da partida."]
    ];
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), sectionIndex("icons"), [5])}
      <p class="glossary-intro">${t("The rulebook prints four icons, one per Presidential Power; the same icons mark the slots of the Fascist track. Each picture below is cut from the rulebook.", "O livro imprime quatro ícones, um por Poder Presidencial; os mesmos ícones marcam os espaços da trilha Fascista. Cada imagem abaixo foi recortada do livro.")}</p>
      <div class="icon-grid">
        ${items.map(([id, en, pt]) => `
          <article class="icon-card">
            <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${id}.webp" alt="${powerName(id)}"></span>
            <div><strong>${powerName(id)}</strong><p>${t(en, pt)}</p>${referenceLink(5)}</div>
          </article>`).join("")}
      </div>`;
  }

  function examplesSection() {
    const cards = [
      infoCard(t("WORKED EXAMPLE", "EXEMPLO PRÁTICO"), t("Term limits follow the last elected government", "Os limites seguem o último governo eleito"), [
        t("Ana is elected President with Bruno as Chancellor.", "Ana é eleita Presidente com Bruno como Chanceler."),
        fivePlayers()
          ? t("Next round Carla is the Candidate. With five players, only Bruno is ineligible: Carla may nominate Ana.", "Na rodada seguinte Carla é a Candidata. Com cinco jogadores, só Bruno é inelegível: Carla pode indicar Ana.")
          : t("Next round Carla is the Candidate: she may not nominate Ana or Bruno.", "Na rodada seguinte Carla é a Candidata: ela não pode indicar Ana nem Bruno."),
        t("Carla's government is voted down. Davi is the next Candidate: the restriction still points at Ana and Bruno (last elected), not at Carla and her nominee (only nominated).", "O governo de Carla é rejeitado. Davi é o próximo Candidato: a restrição continua sobre Ana e Bruno (últimos eleitos), não sobre Carla e o indicado dela (só indicados)."),
        t("Anyone, Bruno included, may still be President when the placard reaches them.", "Qualquer um, inclusive Bruno, ainda pode ser Presidente quando a placa chegar a ele.")
      ], [3, 4]),
      infoCard(t("WORKED EXAMPLE", "EXEMPLO PRÁTICO"), t("Three rejected governments", "Três governos rejeitados"), [
        t("The Election Tracker is on its second step and the next government is voted down too.", "O Election Tracker está na segunda casa e o governo seguinte também é rejeitado."),
        t("Reveal the top tile of the Policy deck and enact it. Say it is a Fascist Policy on a power slot: the power is ignored.", "Revele a peça do topo do baralho e aprove-a. Suponha que seja uma Política Fascista num espaço de poder: o poder é ignorado."),
        t("The tracker resets and term limits are forgotten: any player may be nominated Chancellor in the next Election.", "O marcador volta a zero e os limites de mandato são esquecidos: qualquer jogador pode ser indicado a Chanceler na próxima Eleição."),
        t("If fewer than three tiles are left in the deck, shuffle them with the Discard pile now.", "Se restarem menos de três peças no baralho, embaralhe-as com o descarte agora.")
      ], [4]),
      infoCard(t("WORKED EXAMPLE", "EXEMPLO PRÁTICO"), t("Special Election", "Eleição Especial"), [
        t("Ana is President and gains Call Special Election. She hands the President placard to Eva, three seats away.", "Ana é Presidente e ganha Convocar Eleição Especial. Ela entrega a placa de Presidente a Eva, três lugares adiante."),
        t("Eva nominates an eligible Chancellor and the Election runs as usual.", "Eva indica um Chanceler elegível e a Eleição corre normalmente."),
        t("Afterwards the placard returns to the player on Ana's left (Bruno): nobody is skipped.", "Depois a placa volta para o jogador à esquerda de Ana (Bruno): ninguém é pulado."),
        t("Had Ana picked Bruno, Bruno would run twice in a row.", "Se Ana tivesse escolhido Bruno, Bruno concorreria duas vezes seguidas.")
      ], [5]),
      infoCard(t("WORKED EXAMPLE", "EXEMPLO PRÁTICO"), t("The Hitler zone", "A zona de Hitler"), [
        t("Three Fascist Policies are on the board. A government with Davi as Chancellor is elected.", "Há três Políticas Fascistas no tabuleiro. Um governo com Davi como Chanceler é eleito."),
        t("Ask: “Is Davi Hitler?” If he is, he must say so and the Fascists win.", "Pergunte: “Davi é Hitler?” Se for, ele tem de dizer e os Fascistas vencem."),
        t("If not, everyone now knows for sure that Davi is not Hitler (he could still be an ordinary Fascist).", "Se não for, todos sabem com certeza que Davi não é Hitler (ele ainda pode ser um Fascista comum).")
      ], [2, 4]),
      infoCard(t("WORKED EXAMPLE", "EXEMPLO PRÁTICO"), t("Who passed that Fascist Policy?", "Quem aprovou aquela Política Fascista?"), [
        t("A Fascist Policy is enacted. The President claims she drew three Fascist tiles; the Chancellor says he received two Fascists.", "Uma Política Fascista é aprovada. A Presidente afirma que comprou três peças Fascistas; o Chanceler diz que recebeu duas Fascistas."),
        t("Only three culprits are possible: the President, the Chancellor or the deck. Discards are never shown, so the table weighs their words, votes and later actions.", "Só há três culpados possíveis: a Presidente, o Chanceler ou o baralho. Os descartes nunca são mostrados, então a mesa pesa as palavras, os votos e as ações seguintes."),
        t("A later Investigate or Policy Peek can confirm or contradict a claim — but that President may lie too.", "Um Investigar ou Espiar Políticas depois pode confirmar ou contradizer uma afirmação — mas esse Presidente também pode mentir.")
      ], [4, 5, 6])
    ];
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), sectionIndex("examples"), [3, 4, 5, 6])}
      <p class="glossary-intro">${t("The rulebook has no illustrated examples. These short cases are built by the guide strictly from the rulebook's text; the names are invented.", "O livro não tem exemplos ilustrados. Estes casos curtos foram montados pelo guia estritamente a partir do texto do livro; os nomes são inventados.")}</p>
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  function faqSection() {
    const items = [
      [t("Which Fascist slot grants which power?", "Qual espaço Fascista dá qual poder?"), t(`The rulebook does not list them. They are printed on the Fascist track for ${track()} players: when a Fascist Policy covers an icon, find it in Iconography.`, `O livro não os lista. Eles estão impressos na trilha Fascista de ${track()} jogadores: quando uma Política Fascista cobrir um ícone, procure-o em Iconografia.`), 5],
      [t("Does the placard move before the first Election?", "A placa anda antes da primeira Eleição?"), t("No. The randomly chosen player received both placards and is the first Presidential Candidate.", "Não. O jogador sorteado recebeu as duas placas e é o primeiro Candidato à Presidência."), 3],
      [t("A vote failed: does the placard move once or twice?", "Uma votação falhou: a placa anda uma ou duas vezes?"), t("Once. Moving it after the failed vote is the “pass the candidacy” step of the next Election; do not move it again.", "Uma vez. Movê-la depois da votação fracassada é o passo “passar a candidatura” da próxima Eleição; não a mova de novo."), 4],
      [t("How are executed players handled?", "Como ficam os jogadores executados?"), t("They are skipped when the President placard moves, cannot be nominated and do not vote. A majority is counted among the votes of the living players; a tie fails.", "Eles são pulados quando a placa de Presidente anda, não podem ser indicados e não votam. A maioria é contada entre os votos dos jogadores vivos; empate falha."), 5],
      [t("Can a chaos Policy end the game?", "Uma Política do caos pode encerrar a partida?"), t("Yes: it is enacted like any other, so a fifth Liberal or sixth Fascist Policy wins at once. Only its power is ignored.", "Sim: ela é aprovada como qualquer outra, então uma quinta Política Liberal ou sexta Fascista vence na hora. Só o poder é ignorado."), 4],
      [t("What if a veto fills the Election Tracker?", "E se um veto completar o Election Tracker?"), t("The veto advances the tracker like a failed government, so a third step triggers chaos.", "O veto avança o marcador como um governo fracassado, então a terceira casa dispara o caos."), 6],
      [t("Do term limits apply after a Special Election?", "Os limites de mandato valem depois de uma Eleição Especial?"), t("Yes for the Chancellor nominee: the Special Election only lets anyone become the Presidential Candidate.", "Sim para o indicado a Chanceler: a Eleição Especial só permite que qualquer um seja o Candidato à Presidência."), 5],
      [t("Who sees the boards and tiles?", "Quem vê os tabuleiros e as peças?"), t("Enacted Policies, the Election Tracker and every vote are public. Tiles in hand, discards and Party Membership cards are secret.", "Políticas aprovadas, o Election Tracker e todos os votos são públicos. Peças na mão, descartes e cartas de Filiação são secretos."), 4],
      ...(state.narrator === "app" ? [[t("Is the app required?", "O aplicativo é obrigatório?"), t("No. It only narrates the eyes-closed directions, which this guide prints in full. It is not in the box and the guide has not checked it.", "Não. Ele só narra as instruções de olhos fechados, que este guia imprime por completo. Não vem na caixa e o guia não o conferiu."), 3]] : [])
    ];
    return `
      ${sectionHeading("faq", t("Guide's readings", "Leituras do guia"), sectionIndex("faq"), [3, 4, 5])}
      <p class="glossary-intro">${t("Where the rulebook is silent, this guide states its own reading, labelled as such.", "Onde o livro é omisso, este guia dá a sua própria leitura, identificada como tal.")}</p>
      <div class="quick-grid">${items.map(([q, a, page]) => `
        <article class="info-card">
          <span class="component-label">${t("GUIDE'S READING", "LEITURA DO GUIA")}</span>
          <h3>${q}</h3>
          <p>${a}</p>
          ${referenceLink(page)}
        </article>`).join("")}</div>`;
  }

  function glossarySection() {
    const visible = [
      { term: ["Secret Role card", "Carta de Papel Secreto (Secret Role)"], text: ["Liberal, Fascist or Hitler: your true identity. Never shown.", "Liberal, Fascista ou Hitler: a sua identidade verdadeira. Nunca é mostrada."], page: 2 },
      { term: ["Party Membership card", "Carta de Filiação Partidária (Party Membership)"], text: ["Liberal or Fascist only; handed to a President who investigates you.", "Só Liberal ou Fascista; entregue ao Presidente que te investiga."], page: 3 },
      { term: ["Ballot cards", "Cédulas (Ballot cards)"], text: ["Ja! (yes) and Nein (no); one of each per player, revealed together.", "Ja! (sim) e Nein (não); uma de cada por jogador, reveladas juntas."], page: 2 },
      { term: ["Policy tile", "Peça de Política (Policy)"], text: ["Liberal or Fascist; enacted face up on its track.", "Liberal ou Fascista; aprovada virada para cima na sua trilha."], page: 2 },
      { term: ["Presidential Candidate", "Candidato à Presidência"], text: ["Holder of the President placard before the vote; nominates the Chancellor.", "Quem tem a placa de Presidente antes da votação; indica o Chanceler."], page: 3 },
      { term: ["Chancellor Candidate", "Candidato a Chanceler"], text: ["The eligible player handed the Chancellor placard.", "O jogador elegível que recebe a placa de Chanceler."], page: 3 },
      { term: ["Government", "Governo"], text: ["An elected President and Chancellor.", "Um Presidente e um Chanceler eleitos."], page: 3 },
      { term: ["Term-limited", "Limite de mandato"], text: [fivePlayers() ? "With five players: the last elected Chancellor cannot be nominated Chancellor." : "The last elected President and Chancellor cannot be nominated Chancellor (only the Chancellor with five players left).", fivePlayers() ? "Com cinco jogadores: o último Chanceler eleito não pode ser indicado a Chanceler." : "O último Presidente e o último Chanceler eleitos não podem ser indicados a Chanceler (só o Chanceler quando restam cinco jogadores)."], page: 3 },
      { term: ["Election Tracker", "Marcador de Eleições (Election Tracker)"], text: ["Counts failed governments and vetoes; the third throws the country into chaos.", "Conta governos fracassados e vetos; o terceiro mergulha o país no caos."], page: 4 },
      { term: ["Chaos", "Caos"], text: ["The top Policy is enacted with no power; tracker reset; term limits forgotten.", "A Política do topo é aprovada sem poder; marcador zerado; limites esquecidos."], page: 4 },
      { term: ["Legislative Session", "Sessão Legislativa"], text: ["President and Chancellor secretly pick one of three tiles to enact.", "Presidente e Chanceler escolhem em segredo uma de três peças para aprovar."], page: 4 },
      { term: ["Executive Action", "Ação Executiva"], text: ["Using the Presidential Power granted by a Fascist Policy.", "Usar o Poder Presidencial dado por uma Política Fascista."], page: 5 },
      { term: ["Presidential Power", "Poder Presidencial"], text: ["Single-use power printed on a Fascist slot: Investigate, Special Election, Policy Peek, Execution.", "Poder de uso único impresso num espaço Fascista: Investigar, Eleição Especial, Espiar, Execução."], page: 5 },
      { term: ["Veto Power", "Poder de Veto"], text: ["After five Fascist Policies, President and Chancellor may agree to discard the agenda.", "Depois de cinco Políticas Fascistas, Presidente e Chanceler podem concordar em descartar a pauta."], page: 6 },
      { term: ["Hitler", "Hitler"], text: ["Leader of the Fascist team; Liberals win by executing him, Fascists by electing him Chancellor late.", "Líder do time Fascista; os Liberais vencem executando-o, os Fascistas elegendo-o Chanceler mais tarde."], page: 2 },
      { term: ["Placards", "Placas"], text: ["President and Chancellor markers passed between players.", "Marcadores de Presidente e Chanceler passados entre os jogadores."], page: 3 }
    ];
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), sectionIndex("glossary"), [2, 3, 4, 5])}
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
    document.body.classList.add("theme-sh");
    document.documentElement.lang = state.language;
    document.title = t("Secret Hitler — Field Manual", "Secret Hitler — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Secret Hitler: hidden roles for 5–10 players — setup checklist by player count, eyes-closed directions, Election, Legislative Session, Presidential Powers, Veto and winning.",
        "Regras interativas bilíngues de Secret Hitler: papéis ocultos para 5–10 jogadores — lista de preparação por número de jogadores, instruções de olhos fechados, Eleição, Sessão Legislativa, Poderes Presidenciais, Veto e vitória."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook", "Livro interativo")}</p>
          <h1>Secret Hitler</h1>
          <p class="hero-intro">${t(
            "Liberals hold the majority but trust no one; hidden Fascists and Secret Hitler work in the shadows. Elect governments, enact Policies in secret, use the President's powers — and find Hitler before the Fascists make him Chancellor.",
            "Os Liberais são maioria, mas não confiam em ninguém; Fascistas ocultos e Secret Hitler agem nas sombras. Elejam governos, aprovem Políticas em segredo, usem os poderes do Presidente — e encontrem Hitler antes que os Fascistas o façam Chanceler."
          )}</p>
          <div class="hero-meta"><span>${t("5–10 players", "5–10 jogadores")}</span><span>${t("Hidden roles", "Papéis ocultos")}</span><span>${t("Social deduction", "Dedução social")}</span><span>CC BY-NC-SA 4.0</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/secret-hitler.webp" alt="${t("Cover of the Secret Hitler rulebook", "Capa do livro de regras de Secret Hitler")}" fetchpriority="high"><figcaption>${t("Rulebook cover", "Capa do livro de regras")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("The Reichstag", "O Reichstag")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column sh-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          <p class="sh-secret"><strong>${t("Secrets stay at the table.", "Os segredos ficam na mesa.")}</strong> ${t(
            "This guide never asks for, shows or stores anybody's Secret Role or Party Membership, votes or Policy tiles. It saves only the match options and the setup checkmarks on this device, so it can stay open where everyone can see it.",
            "Este guia nunca pergunta, mostra ou salva o Papel Secreto ou a Filiação de ninguém, votos ou peças de Política. Ele salva só as opções da partida e as marcações da preparação neste aparelho, então pode ficar aberto à vista de todos."
          )}</p>
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied English rulebook of Secret Hitler (7 pages, no printed page numbers, so links cite PDF pages). The rulebook has no expansions or variants. It does not say which slot of each Fascist track grants which Presidential Power: read the icons on your track. Points marked “Guide's reading” are interpretations where the rulebook is silent. Component names stay in English in parentheses, as printed.",
            "Este guia cobre o livro de regras em inglês fornecido de Secret Hitler (7 páginas, sem números impressos, por isso os links citam as páginas do PDF). O livro não tem expansões nem variantes. Ele não diz qual espaço de cada trilha Fascista dá qual Poder Presidencial: leia os ícones na sua trilha. Trechos marcados como “Leitura do guia” são interpretações onde o livro é omisso. Os nomes dos componentes aparecem em inglês entre parênteses, como impressos."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${teamsSection()}</section>
          <section class="rule-section">${electionSection()}</section>
          <section class="rule-section">${legislativeSection()}</section>
          <section class="rule-section">${powersSection()}</section>
          <section class="rule-section">${vetoSection()}</section>
          <section class="rule-section">${lyingSection()}</section>
          <section class="rule-section">${strategySection()}</section>
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${faqSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal, non-commercial companion guide based on the Secret Hitler rulebook. Secret Hitler was created by Mike Boxleiter, Tommy Maranges and Mac Schubert (secrethitler.com) and is licensed under CC BY-NC-SA 4.0; this guide paraphrases and reorganises the rules, adds the labelled guide's readings and is shared under the same licence.",
        "Guia pessoal e não comercial de consulta baseado no livro de regras de Secret Hitler. Secret Hitler foi criado por Mike Boxleiter, Tommy Maranges e Mac Schubert (secrethitler.com) e é licenciado sob CC BY-NC-SA 4.0; este guia parafraseia e reorganiza as regras, acrescenta as leituras do guia identificadas e é compartilhado sob a mesma licença."
      )}</p></footer>`;
  }

  function onClick(event) {
    const target = event.target instanceof Element ? event.target.closest("button") : null;
    if (!target || !root || !root.contains(target)) {
      return;
    }
    if (target.dataset.language) {
      state.language = target.dataset.language === "en-US" ? "en-US" : "pt-BR";
      savePreferences();
      rerender();
      return;
    }
    if (target.hasAttribute("data-setup-reset")) {
      setupState = { signature: signature(), checks: [] };
      saveSetup();
      rerender();
      return;
    }
    if (target.dataset.scroll) {
      document.getElementById(target.dataset.scroll)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      root.querySelector(".sh-page")?.prepend(notice);
    }
    notice.textContent = storageNoticeText();
  }

  function applyMatchChange(next) {
    const before = signature();
    state = normalizePreferences({ ...state, ...next });
    savePreferences();
    if (signature() !== before) {
      setupState = { signature: signature(), checks: [] };
      saveSetup();
    }
    rerender();
  }

  const OPTION_INPUTS = [
    ["players", "players", (value) => Number(value), PLAYERS],
    ["narrator", "narrator", (value) => value, NARRATORS]
  ];

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !root || !root.contains(target)) {
      return;
    }
    for (const [attr, key, parse, list] of OPTION_INPUTS) {
      if (target.hasAttribute(`data-${attr}`)) {
        const value = parse(target.getAttribute(`data-${attr}`));
        if (list.includes(value) && value !== state[key]) {
          applyMatchChange({ [key]: value });
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

  window.SecretHitler = { renderInto, onClick, onChange };
})();
