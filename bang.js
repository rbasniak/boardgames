(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.bang.v1";
  const SETUP_KEY = "field-manual.bang.setup.v1";
  const MANUAL_FILE = "bang_core.pdf";
  const ICONS = "assets/bang/icons/";
  const ART = "assets/bang/art/";
  // Printed page numbers match the PDF page numbers (the cover is page 1).
  const PDF_OFFSET = 0;

  const PLAYER_COUNTS = ["4", "5", "6", "7"];
  const DECKS = ["full", "simple"];
  const SHERIFF_MODES = ["random", "rotate"];
  const CHARACTER_MODES = ["deal", "keep"];
  // Role cards per player count — rulebook p. 2.
  const ROLES = {
    4: { sheriff: 1, renegade: 1, outlaw: 2, deputy: 0 },
    5: { sheriff: 1, renegade: 1, outlaw: 2, deputy: 1 },
    6: { sheriff: 1, renegade: 1, outlaw: 3, deputy: 1 },
    7: { sheriff: 1, renegade: 1, outlaw: 3, deputy: 2 }
  };
  const defaults = { language: "pt-BR", players: "5", deck: "full", sheriff: "random", characters: "deal" };
  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------
  // Only table-wide choices are stored. The guide never asks for, shows or stores anyone's hidden role.

  function normalizePreferences(saved) {
    return {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      players: PLAYER_COUNTS.includes(String(saved?.players)) ? String(saved.players) : defaults.players,
      deck: DECKS.includes(saved?.deck) ? saved.deck : defaults.deck,
      sheriff: SHERIFF_MODES.includes(saved?.sheriff) ? saved.sheriff : defaults.sheriff,
      characters: CHARACTER_MODES.includes(saved?.characters) ? saved.characters : defaults.characters
    };
  }

  function signature(source = state) {
    return [source.players, source.deck, source.sheriff, source.characters].join("|");
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read BANG! preferences.", error);
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
      console.error("Could not read BANG! setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save BANG! preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save BANG! setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function players() {
    return Number(state.players);
  }

  function roles() {
    return ROLES[players()];
  }

  function simple() {
    return state.deck === "simple";
  }

  function rotating() {
    return state.sheriff === "rotate";
  }

  function keeping() {
    return state.characters === "keep";
  }

  function manualUrl(page) {
    const script = document.querySelector('script[src*="bang.js"]');
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
          <p class="eyebrow">${t("WANTED", "PROCURADO")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="bg-section-references">${pages.map(referenceLink).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
  }

  function icon(file, alt) {
    return `<img class="bg-inline-icon" src="${ICONS}${file}.webp" alt="${alt}">`;
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
    return `<span class="bg-interpretation">${t("Guide's reading", "Leitura do guia")}</span> ${t(en, pt)}`;
  }

  function playersLabel(count = state.players) {
    return t(`${count} players`, `${count} jogadores`);
  }

  function roleName(id, count = 1) {
    const names = {
      sheriff: ["Sheriff", "Sheriffs", "Xerife", "Xerifes"],
      deputy: ["Deputy", "Deputies", "Vice", "Vices"],
      outlaw: ["Outlaw", "Outlaws", "Fora da lei", "Foras da lei"],
      renegade: ["Renegade", "Renegades", "Renegado", "Renegados"]
    }[id];
    return count === 1 ? t(names[0], names[2]) : t(names[1], names[3]);
  }

  function roleSplitText(count = players()) {
    const split = ROLES[count];
    return ["sheriff", "renegade", "outlaw", "deputy"]
      .filter((id) => split[id] > 0)
      .map((id) => `${split[id]} ${roleName(id, split[id])}`)
      .join(" · ");
  }

  // ---------- card data ----------
  // Names follow the English rulebook; the Portuguese text adds a translation in parentheses.
  // "italian" is the title printed on the card pictures inside the rulebook (with the English name in small print).

  const CARDS = [
    {
      id: "bang", kind: "brown", page: 5, italian: "BANG!",
      name: ["BANG!", "BANG!"],
      symbols: [["bang", "BANG!"], ["reachable", "reachable"]],
      short: ["Shoot one player within your weapon's reach: they lose 1 life point unless they cancel it.", "Atire em um jogador ao alcance da sua arma: ele perde 1 ponto de vida, a menos que cancele o tiro."],
      lines: [
        ["Pick a target, work out the distance to them and check that your weapon reaches it (Colt .45 = 1).", "Escolha um alvo, calcule a distância até ele e confira se sua arma alcança essa distância (Colt .45 = 1)."],
        ["The target may cancel it with a Missed! (or a successful Barrel “draw!”). Otherwise they lose 1 life point.", "O alvo pode cancelá-lo com um Missed! (ou um “saque!” de Barrel bem-sucedido). Senão, perde 1 ponto de vida."],
        ["Only 1 BANG! card per turn (unless you have a Volcanic, or you are Willy the Kid). The card is discarded even when cancelled.", "Só 1 carta BANG! por turno (a menos que você tenha um Volcanic ou seja Willy the Kid). A carta é descartada mesmo quando cancelada."]
      ]
    },
    {
      id: "missed", kind: "brown", page: 6, italian: "Mancato!",
      name: ["Missed!", "Missed! (Errou!)"],
      symbols: [["missed", "Missed!"]],
      short: ["Out of turn: cancel a BANG! aimed at you.", "Fora do turno: cancela um BANG! mirado em você."],
      lines: [
        ["Play it immediately when you are hit by a BANG! — even though it is not your turn — to cancel that shot.", "Jogue-o na hora em que for atingido por um BANG! — mesmo fora do seu turno — para cancelar o tiro."],
        ["You can only cancel shots aimed at you. Any card with the Missed! symbol cancels any card with the BANG! symbol (Gatling included).", "Você só cancela tiros mirados em você. Qualquer carta com o símbolo Missed! cancela qualquer carta com o símbolo BANG! (inclusive a Gatling)."],
        ["It does not work against Indians! or in a Duel.", "Não funciona contra Indians! nem num Duel."]
      ]
    },
    {
      id: "beer", kind: "brown", page: 6, italian: "Birra",
      name: ["Beer", "Beer (Cerveja)"],
      symbols: [["beer", "Beer"]],
      short: ["Regain 1 life point. Out of turn only to survive a lethal hit. No effect with only 2 players left.", "Recupere 1 ponto de vida. Fora do turno só para sobreviver a um golpe letal. Sem efeito com só 2 jogadores restantes."],
      lines: [
        ["Regain 1 life point: take a bullet back from the pile. Never above your starting amount; never on another player.", "Recupere 1 ponto de vida: pegue de volta uma bala da pilha. Nunca acima do valor inicial; nunca em outro jogador."],
        ["Play it during your turn, or out of turn only when a hit has just taken your last life point (not for an ordinary hit).", "Jogue-a no seu turno, ou fora do turno só quando um golpe acabou de tirar seu último ponto de vida (não num golpe comum)."],
        ["When only 2 players are left in the game, a Beer gives no life point.", "Quando só restam 2 jogadores na partida, a Beer não dá ponto de vida."]
      ]
    },
    {
      id: "saloon", kind: "brown", page: 6, italian: "Saloon",
      name: ["Saloon", "Saloon"],
      symbols: [["beer", "Beer"], ["all-others", "all others"]],
      short: ["Every player in play regains 1 life point (you included).", "Todos os jogadores em jogo recuperam 1 ponto de vida (você inclusive)."],
      lines: [
        ["Two lines of symbols, two effects at once: all the other players regain 1 life point, and you regain 1 life point.", "Duas linhas de símbolos, dois efeitos ao mesmo tempo: todos os outros jogadores recuperam 1 ponto de vida, e você recupera 1."],
        ["Only on your turn. It is not a Beer: you cannot play it to survive losing your last life point.", "Só no seu turno. Não é uma Beer: você não pode jogá-lo para sobreviver à perda do último ponto de vida."]
      ]
    },
    {
      id: "stagecoach", kind: "brown", page: 7, italian: "Diligenza",
      name: ["Stagecoach", "Stagecoach (Diligência)"],
      symbols: [["draw-card", "draw a card"]],
      short: ["Draw 2 cards from the top of the deck.", "Compre 2 cartas do topo do baralho."],
      lines: [["Draw two cards from the top of the deck.", "Compre duas cartas do topo do baralho."]]
    },
    {
      id: "wells-fargo", kind: "brown", page: 7, italian: "Wells Fargo",
      name: ["Wells Fargo", "Wells Fargo"],
      symbols: [["draw-card", "draw a card"]],
      short: ["Draw 3 cards from the top of the deck.", "Compre 3 cartas do topo do baralho."],
      lines: [["Draw three cards from the top of the deck.", "Compre três cartas do topo do baralho."]]
    },
    {
      id: "general-store", kind: "brown", page: 7, italian: "Emporio",
      name: ["General Store", "General Store (Armazém)"],
      symbols: [],
      short: ["Reveal 1 card per player still in play; starting with you, clockwise, each takes one.", "Revele 1 carta por jogador ainda em jogo; começando por você, em sentido horário, cada um pega uma."],
      lines: [
        ["Turn face up from the deck as many cards as there are players still playing.", "Vire do baralho tantas cartas quantos forem os jogadores ainda em jogo."],
        ["Starting with you and going clockwise, each player chooses one of them and puts it in their hand.", "Começando por você e seguindo em sentido horário, cada jogador escolhe uma delas e a põe na mão."]
      ]
    },
    {
      id: "panic", kind: "brown", page: 7, italian: "Panico!",
      name: ["Panic!", "Panic! (Pânico!)"],
      symbols: [["draw-card", "draw a card"], ["distance", "distance 1"]],
      short: ["Take 1 card from a player at distance 1: random from hand, or chosen from in play.", "Pegue 1 carta de um jogador a distância 1: aleatória da mão ou escolhida entre as em jogo."],
      lines: [
        ["Choose a player at distance 1. Take a random card from their hand, or choose one of their cards in play (weapons and Dynamite included). Add it to your hand.", "Escolha um jogador a distância 1. Pegue uma carta aleatória da mão dele, ou escolha uma das cartas dele em jogo (inclusive arma e Dynamite). Ponha-a na sua mão."],
        ["Your weapon does not help: only Mustang and Scope change this distance.", "Sua arma não ajuda: só Mustang e Scope alteram essa distância."]
      ]
    },
    {
      id: "cat-balou", kind: "brown", page: 7, italian: "Cat Balou",
      name: ["Cat Balou", "Cat Balou"],
      symbols: [["discard", "discard"], ["any-player", "any player"]],
      short: ["Any player, any distance: discard 1 random card from their hand or 1 card you choose in play.", "Qualquer jogador, a qualquer distância: descarte 1 carta aleatória da mão dele ou 1 carta escolhida em jogo."],
      lines: [
        ["Choose any one player, regardless of distance.", "Escolha qualquer jogador, sem importar a distância."],
        ["Force them to discard a random card from their hand, or you choose and discard one of their cards in play.", "Obrigue-o a descartar uma carta aleatória da mão, ou escolha e descarte uma das cartas dele em jogo."]
      ]
    },
    {
      id: "gatling", kind: "brown", page: 7, italian: "Gatling",
      name: ["Gatling", "Gatling"],
      symbols: [["bang", "BANG!"], ["all-others", "all others"]],
      short: ["A BANG! to every other player, at any distance. Not a BANG! card.", "Um BANG! em cada outro jogador, a qualquer distância. Não é uma carta BANG!."],
      lines: [
        ["Shoots a BANG! at all the other players, regardless of distance. Each may cancel their own shot with a Missed! or Barrel.", "Dispara um BANG! em todos os outros jogadores, sem importar a distância. Cada um pode cancelar o próprio tiro com um Missed! ou Barrel."],
        ["It is not a BANG! card: it does not use your 1-BANG!-per-turn limit, and you may play any number of Gatlings.", "Não é uma carta BANG!: não gasta o limite de 1 BANG! por turno, e você pode jogar quantas Gatlings quiser."]
      ]
    },
    {
      id: "indians", kind: "brown", page: 8, italian: "Indiani!",
      name: ["Indians!", "Indians! (Índios!)"],
      symbols: [],
      short: ["Every other player discards a BANG! or loses 1 life point. Missed!/Barrel do not help.", "Cada outro jogador descarta um BANG! ou perde 1 ponto de vida. Missed!/Barrel não ajudam."],
      lines: [
        ["Each player except you may discard a BANG! card; whoever does not loses 1 life point.", "Cada jogador, menos você, pode descartar uma carta BANG!; quem não descartar perde 1 ponto de vida."],
        ["Neither Missed! nor Barrel has any effect against it.", "Nem Missed! nem Barrel têm efeito contra ele."]
      ]
    },
    {
      id: "duel", kind: "brown", page: 8, italian: "Duello",
      name: ["Duel", "Duel (Duelo)"],
      symbols: [],
      short: ["Challenge any other player: alternate discarding BANG! cards (they go first); the first who cannot loses 1 life point.", "Desafie qualquer outro jogador: alternem descartando cartas BANG! (ele começa); o primeiro que não puder perde 1 ponto de vida."],
      lines: [
        ["Challenge any other player, regardless of distance.", "Desafie qualquer outro jogador, sem importar a distância."],
        ["The challenged player may discard a BANG! card (even out of turn). If they do, you may discard one, and so on.", "O desafiado pode descartar uma carta BANG! (mesmo fora do turno). Se ele descartar, você pode descartar uma, e assim por diante."],
        ["The first player who does not discard a BANG! loses 1 life point; the Duel ends.", "O primeiro que não descartar um BANG! perde 1 ponto de vida; o Duel acaba."],
        ["No Missed! or Barrel in a Duel. The Duel is not a BANG! card, and BANG! cards discarded in it do not count toward your 1-per-turn limit.", "Nada de Missed! ou Barrel num Duel. O Duel não é uma carta BANG!, e as cartas BANG! descartadas nele não contam no seu limite de 1 por turno."]
      ]
    },
    {
      id: "barrel", kind: "blue", page: 9, italian: "Barile",
      name: ["Barrel", "Barrel (Barril)"],
      symbols: [["draw-heart", "draw! heart = Missed!"]],
      short: ["When targeted by a BANG!, “draw!”: a Heart means Missed!.", "Quando for alvo de um BANG!, faça um “saque!”: Copas vale um Missed!."],
      lines: [
        ["Stays in front of you. Each time you are the target of a BANG!, you may “draw!”.", "Fica à sua frente. Toda vez que você for alvo de um BANG!, pode fazer um “saque!”."],
        ["Heart: you are Missed!, as if you had played a Missed! card. Any other suit: nothing happens, but you may still play a Missed!.", "Copas: o tiro erra, como se você tivesse jogado um Missed!. Outro naipe: nada acontece, mas você ainda pode jogar um Missed!."],
        ["No effect against Indians! or in a Duel.", "Sem efeito contra Indians! ou num Duel."]
      ]
    },
    {
      id: "mustang", kind: "blue", page: 8, italian: "Mustang",
      name: ["Mustang", "Mustang"],
      symbols: [],
      short: ["Other players see you 1 farther away.", "Os outros jogadores veem você 1 mais longe."],
      lines: [
        ["While it is in front of you, the distance from every other player to you is increased by 1.", "Enquanto estiver à sua frente, a distância de cada outro jogador até você aumenta em 1."],
        ["You still see the other players at the normal distance.", "Você continua vendo os outros jogadores na distância normal."]
      ]
    },
    {
      id: "scope", kind: "blue", page: 8, italian: "Mirino",
      name: ["Scope", "Scope (Luneta)"],
      symbols: [],
      short: ["You see every other player 1 closer (minimum 1).", "Você vê cada outro jogador 1 mais perto (mínimo 1)."],
      lines: [
        ["While it is in front of you, you see all the other players at a distance decreased by 1. Distances below 1 count as 1.", "Enquanto estiver à sua frente, você vê todos os outros jogadores a uma distância 1 menor. Distâncias abaixo de 1 contam como 1."],
        ["Other players still see you at the normal distance.", "Os outros continuam vendo você na distância normal."]
      ]
    },
    {
      id: "jail", kind: "blue", page: 9, italian: "Prigione",
      name: ["Jail", "Jail (Prisão)"],
      symbols: [],
      short: ["Put it in front of any player but the Sheriff; they “draw!” before their turn: Heart escapes, otherwise they skip the turn.", "Coloque-a diante de qualquer jogador, menos o Xerife; ele faz um “saque!” antes do turno: Copas escapa, senão perde o turno."],
      lines: [
        ["Blue card played in front of another player, regardless of distance (the one blue card you do not put in front of yourself). Never on the Sheriff.", "Carta azul jogada diante de outro jogador, sem importar a distância (a única carta azul que não vai à sua frente). Nunca no Xerife."],
        ["Before the start of their turn, the jailed player must “draw!”. Heart: discard the Jail and play the turn normally. Any other suit: discard the Jail and skip the turn.", "Antes do início do turno, o preso deve fazer um “saque!”. Copas: descarte a Jail e jogue o turno normalmente. Outro naipe: descarte a Jail e perca o turno."],
        ["A jailed player can still be shot and can still play Missed! and Beer out of turn.", "O preso ainda pode ser alvo de tiros e ainda pode jogar Missed! e Beer fora do turno."]
      ]
    },
    {
      id: "dynamite", kind: "blue", page: 9, italian: "Dinamite",
      name: ["Dynamite", "Dynamite (Dinamite)"],
      symbols: [],
      short: ["At the start of your next turn “draw!”: Spades 2–9 explodes (lose 3 life points); otherwise pass it left.", "No início do seu próximo turno, faça um “saque!”: Espadas 2–9 explode (perca 3 pontos de vida); senão passe-a à esquerda."],
      lines: [
        ["Play it in front of yourself. It stays there for a whole round of turns.", "Jogue-a à sua frente. Ela fica lá por uma volta inteira de turnos."],
        ["At the start of your next turn, before phase 1, “draw!”. Spades 2 to 9: it explodes — discard it and lose 3 life points.", "No início do seu próximo turno, antes da fase 1, faça um “saque!”. Espadas de 2 a 9: ela explode — descarte-a e perca 3 pontos de vida."],
        ["Anything else: pass it to the player on your left, who will “draw!” at the start of their turn, and so on until it explodes or is taken/discarded by Panic! or Cat Balou.", "Qualquer outra carta: passe-a ao jogador à sua esquerda, que fará o “saque!” no início do turno dele, e assim por diante até explodir ou ser tomada/descartada por Panic! ou Cat Balou."],
        ["With both Dynamite and Jail in front of you, check the Dynamite first. Dynamite damage is not caused by any player.", "Com Dynamite e Jail à sua frente, resolva primeiro a Dynamite. O dano da Dynamite não é causado por nenhum jogador."]
      ]
    },
    {
      id: "volcanic", kind: "weapon", page: 5, italian: "Volcanic", range: "1",
      name: ["Volcanic", "Volcanic"],
      symbols: [],
      short: ["Weapon, range 1: play any number of BANG! cards this turn.", "Arma, alcance 1: jogue quantas cartas BANG! quiser no turno."],
      lines: [
        ["Range 1 (like the Colt .45).", "Alcance 1 (como o Colt .45)."],
        ["With it in play you may play any number of BANG! cards during your turn, at the same or different targets within distance 1.", "Com ela em jogo você pode jogar quantas cartas BANG! quiser no seu turno, no mesmo alvo ou em alvos diferentes a distância 1."]
      ]
    },
    {
      id: "weapons", kind: "weapon", page: 5, italian: "Schofield · Remington · Rev. Carabine · Winchester", range: "2+",
      name: ["Schofield, Remington, Rev. Carabine, Winchester", "Schofield, Remington, Rev. Carabine, Winchester"],
      symbols: [],
      short: ["Bigger guns: the number in the sight is your new maximum reach.", "Armas maiores: o número na mira é o seu novo alcance máximo."],
      lines: [
        ["Place it over the Colt .45 printed on your board. The number in the sight is the maximum distance you can reach with BANG! cards.", "Coloque-a sobre o Colt .45 impresso no seu tabuleiro. O número na mira é a distância máxima que você alcança com cartas BANG!."],
        ["Each has its own range, 2 or more, printed in the sight on the card — always read it there. (The rulebook only shows the Remington's 3 and says all four reach at least distance 2.)", "Cada uma tem seu próprio alcance, 2 ou mais, impresso na mira da carta — leia-o sempre ali. (O manual só mostra o 3 do Remington e diz que as quatro alcançam pelo menos a distância 2.)"],
        ["A weapon never changes distances, and it does not help Panic! or cards with a number symbol.", "A arma nunca muda distâncias e não ajuda o Panic! nem cartas com símbolo de número."]
      ]
    }
  ];

  const CHARACTERS = [
    { id: "bart", name: "Bart Cassidy", life: 4, page: 10, text: ["Each time he loses a life point, he immediately draws a card from the deck.", "Cada vez que perde um ponto de vida, compra na hora uma carta do baralho."] },
    { id: "black-jack", name: "Black Jack", life: 4, page: 10, text: ["Phase 1: he must show the second card he draws; if it is Hearts or Diamonds, he draws one more card (without showing it).", "Fase 1: deve mostrar a segunda carta que compra; se for Copas ou Ouros, compra mais uma (sem mostrá-la)."] },
    { id: "calamity", name: "Calamity Janet", life: 4, page: 10, text: ["She can use BANG! cards as Missed! and vice versa. A Missed! played as a BANG! counts as her one BANG! for the turn (unless she has a Volcanic).", "Ela pode usar cartas BANG! como Missed! e vice-versa. Um Missed! jogado como BANG! conta como o único BANG! do turno (a menos que tenha um Volcanic)."] },
    { id: "el-gringo", name: "El Gringo", life: 3, page: 10, text: ["Each time he loses a life point to a card played by another player, he draws a random card from that player's hand (one per life point). Nothing if their hand is empty. Dynamite is not caused by any player.", "Cada vez que perde um ponto de vida por uma carta jogada por outro jogador, pega uma carta aleatória da mão desse jogador (uma por ponto de vida). Nada se a mão dele estiver vazia. A Dynamite não é causada por nenhum jogador."] },
    { id: "jesse", name: "Jesse Jones", life: 4, page: 10, text: ["Phase 1: he may draw his first card from the deck or at random from any other player's hand; the second comes from the deck.", "Fase 1: pode comprar a primeira carta do baralho ou aleatoriamente da mão de qualquer outro jogador; a segunda vem do baralho."] },
    { id: "jourdonnais", name: "Jourdonnais", life: 4, page: 10, text: ["He always counts as having a Barrel in play. With a real Barrel too, he gets two “draw!” chances before playing a Missed!.", "Sempre conta como se tivesse um Barrel em jogo. Com um Barrel de verdade também, tem duas chances de “saque!” antes de jogar um Missed!."] },
    { id: "kit", name: "Kit Carlson", life: 4, page: 10, text: ["Phase 1: he looks at the top 3 cards of the deck, keeps 2 and puts the other back on top face down.", "Fase 1: olha as 3 cartas do topo do baralho, fica com 2 e devolve a outra ao topo virada para baixo."] },
    { id: "lucky", name: "Lucky Duke", life: 4, page: 10, text: ["Each time he must “draw!”, he flips the top 2 cards and chooses the result he prefers; both are discarded.", "Toda vez que precisa fazer um “saque!”, vira as 2 cartas do topo e escolhe o resultado que preferir; as duas são descartadas."] },
    { id: "paul", name: "Paul Regret", life: 3, page: 10, text: ["He always counts as having a Mustang in play: everyone sees him 1 farther. With a real Mustang too, +2.", "Sempre conta como se tivesse um Mustang em jogo: todos o veem 1 mais longe. Com um Mustang de verdade também, +2."] },
    { id: "pedro", name: "Pedro Ramirez", life: 4, page: 10, text: ["Phase 1: he may draw his first card from the top of the discard pile or from the deck; the second comes from the deck.", "Fase 1: pode comprar a primeira carta do topo da pilha de descarte ou do baralho; a segunda vem do baralho."] },
    { id: "rose", name: "Rose Doolan", life: 4, page: 10, text: ["She always counts as having a Scope in play: she sees everyone 1 closer. With a real Scope too, −2.", "Sempre conta como se tivesse uma Scope em jogo: vê todos 1 mais perto. Com uma Scope de verdade também, −2."] },
    { id: "sid", name: "Sid Ketchum", life: 4, page: 10, text: ["At any time he may discard 2 cards from his hand to regain 1 life point, as often as he can — never above his starting life.", "A qualquer momento pode descartar 2 cartas da mão para recuperar 1 ponto de vida, quantas vezes puder — nunca acima da vida inicial."] },
    { id: "slab", name: "Slab the Killer", life: 4, page: 11, text: ["Cancelling his BANG! cards takes 2 Missed!. A successful Barrel counts as only one of them.", "Para cancelar os BANG! dele são necessários 2 Missed!. Um Barrel bem-sucedido conta como apenas um deles."] },
    { id: "suzy", name: "Suzy Lafayette", life: 4, page: 11, text: ["As soon as she has no cards in hand, she draws a card from the draw pile.", "Assim que fica sem cartas na mão, compra uma carta da pilha de compra."] },
    { id: "vulture", name: "Vulture Sam", life: 4, page: 11, text: ["Whenever a character is eliminated, Sam takes all the cards that player had in hand and in play into his hand. (Guide's reading: those cards go to Sam instead of the discard pile.)", "Sempre que um personagem é eliminado, Sam pega para a mão todas as cartas que esse jogador tinha na mão e em jogo. (Leitura do guia: essas cartas vão para Sam em vez da pilha de descarte.)"] },
    { id: "willy", name: "Willy the Kid", life: 4, page: 11, text: ["He can play any number of BANG! cards during his turn.", "Pode jogar quantas cartas BANG! quiser no seu turno."] }
  ];

  function cardName(card) {
    return t(card.name[0], card.name[1]);
  }

  function kindLabel(kind) {
    return {
      brown: t("Brown border · play and discard", "Borda marrom · jogue e descarte"),
      blue: t("Blue border · stays in play", "Borda azul · fica em jogo"),
      weapon: t("Blue border · weapon", "Borda azul · arma")
    }[kind];
  }

  // ---------- header ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["roles", t("Roles & winning", "Papéis e vitória")],
      ["turn", t("Your turn", "Seu turno")],
      ["distance", t("Distance & shooting", "Distância e tiros")],
      ["cards", t("The cards", "As cartas")],
      ["characters", t("Characters", "Personagens")],
      ["icons", t("Iconography", "Iconografia")],
      ["examples", t("Examples", "Exemplos")],
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
          <span class="brand-mark" aria-hidden="true">B!</span>
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
      `${readFailed ? "This browser could not read the saved BANG! match or setup progress; defaults are shown. " : ""}${writeFailed ? "The latest change could not be saved and is visible on screen only." : ""}`,
      `${readFailed ? "Este navegador não conseguiu ler a partida ou o progresso de BANG! salvos; as opções padrão estão sendo mostradas. " : ""}${writeFailed ? "A alteração mais recente não pôde ser salva e aparece somente na tela." : ""}`
    ).trim();
  }

  // ---------- configuration ----------

  function choiceCard(name, value, dataAttr, checked, title, description) {
    return `
      <label class="bg-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" ${dataAttr} ${checked ? "checked" : ""}>
        <span class="bg-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function playerChoiceText(count) {
    const n = Number(count);
    const deputies = ROLES[n].deputy;
    const side = deputies === 0
      ? t("No Deputy: the Sheriff stands alone.", "Sem Vice: o Xerife está sozinho.")
      : t(`${deputies} secret ${deputies === 1 ? "Deputy helps" : "Deputies help"} the Sheriff.`, `${deputies === 1 ? "1 Vice secreto ajuda" : `${deputies} Vices secretos ajudam`} o Xerife.`);
    return `${roleSplitText(n)}. ${side} ${t(`${n} role cards, ${n} boards and ${n} characters are used.`, `São usadas ${n} cartas de papel, ${n} tabuleiros e ${n} personagens.`)}`;
  }

  function group(legend, selected, intro, cards, columns = "") {
    return `
      <fieldset class="bg-choice-group">
        <legend>${legend} <span>${selected}</span></legend>
        <p class="bg-choice-intro">${intro}</p>
        <div class="bg-choice-grid ${columns}">${cards}</div>
      </fieldset>`;
  }

  function matchConfiguration() {
    const deckSelected = simple() ? t("simplified (book cards removed)", "simplificado (sem as cartas do livro)") : t("all 80 cards", "todas as 80 cartas");
    const sheriffSelected = rotating() ? t("passed around the table", "passa pela mesa") : t("dealt at random", "sorteado");
    const charSelected = keeping() ? t("survivors may keep theirs", "sobreviventes podem manter") : t("new random deal", "novo sorteio");
    return `
      <section class="controls-panel bg-config" id="build-match" aria-labelledby="bg-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="bg-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "The player count decides the role cards. The rulebook also offers a simplified deck for your first games and two optional habits for a series of games. These choices filter the setup checklist and the rules below. The guide never asks for, shows or saves anyone's secret role — only table-wide choices are stored on this device.",
              "O número de jogadores define as cartas de papel. O manual também oferece um baralho simplificado para as primeiras partidas e dois hábitos opcionais para uma série de partidas. Essas escolhas filtram a lista de preparação e as regras abaixo. O guia nunca pede, mostra nem salva o papel secreto de ninguém — só as escolhas da mesa ficam salvas neste aparelho."
            )}</p>
          </div>
        </div>
        ${group(t("Players · selected:", "Jogadores · selecionado:"), `${playersLabel()} · ${roleSplitText()}`,
          `${t("BANG! is for 4–7 players. Fewer or more players need the Dodge City expansion, which is not covered.", "BANG! é para 4–7 jogadores. Menos ou mais jogadores exigem a expansão Dodge City, que não é coberta.")} ${referenceLink(1)} ${referenceLink(2)}`,
          PLAYER_COUNTS.map((count) => choiceCard("bg-players", count, `data-players="${count}"`, state.players === count, playersLabel(count), playerChoiceText(count))).join(""))}
        ${group(t("Playing cards · selected:", "Cartas de jogo · selecionado:"), deckSelected,
          `${t("A rulebook note for your first few games.", "Uma nota do manual para as primeiras partidas.")} ${referenceLink(2)}`,
          [
            choiceCard("bg-deck", "full", 'data-deck="full"', !simple(), t("Full deck — all 80 cards", "Baralho completo — as 80 cartas"), t("The standard game. Every card described below can appear.", "O jogo padrão. Toda carta descrita abaixo pode aparecer.")),
            choiceCard("bg-deck", "simple", 'data-deck="simple"', simple(), t("Simplified first game — remove the book cards", "Primeira partida simplificada — tire as cartas do livro"), t("Before setup, remove every playing card that shows the open-book symbol and leave it in the box. The rulebook does not list which cards carry it: look at the cards. The rest of the rules are unchanged; skip the explanations of cards you removed.", "Antes da preparação, tire toda carta de jogo que mostre o símbolo do livro aberto e deixe-a na caixa. O manual não lista quais cartas o têm: olhe as cartas. O resto das regras não muda; ignore as explicações das cartas que você tirou."))
          ].join(""), "bg-two")}
        ${group(t("Sheriff role · selected:", "Papel de Xerife · selecionado:"), sheriffSelected,
          `${t("Optional, for several games in a row.", "Opcional, para várias partidas seguidas.")} ${referenceLink(4)}`,
          [
            choiceCard("bg-sheriff", "random", 'data-sheriff="random"', !rotating(), t("Random — standard", "Sorteado — padrão"), t("All role cards are shuffled and dealt face down; whoever gets the Sheriff reveals it.", "Todas as cartas de papel são embaralhadas e distribuídas viradas para baixo; quem receber o Xerife o revela.")),
            choiceCard("bg-sheriff", "rotate", 'data-sheriff="rotate"', rotating(), t("Pass the Sheriff around", "Passe o Xerife pela mesa"), t("Agreed before the game: the Sheriff card goes face up to the player whose turn it is to be Sheriff; only the other roles are shuffled and dealt secretly. Over several games everyone gets to be Sheriff.", "Combinado antes da partida: a carta de Xerife vai virada para cima a quem é a vez de ser Xerife; só os outros papéis são embaralhados e distribuídos em segredo. Em várias partidas, todos chegam a ser Xerife."))
          ].join(""), "bg-two")}
        ${group(t("Characters · selected:", "Personagens · selecionado:"), charSelected,
          `${t("Optional, only from the second game of a series.", "Opcional, só a partir da segunda partida de uma série.")} ${referenceLink(4)}`,
          [
            choiceCard("bg-characters", "deal", 'data-characters="deal"', !keeping(), t("Deal new characters — standard", "Novos personagens — padrão"), t("Every player gets a random character for this game. Use this for a first or single game.", "Cada jogador recebe um personagem aleatório para esta partida. Use para uma primeira partida ou partida única.")),
            choiceCard("bg-characters", "keep", 'data-characters="keep"', keeping(), t("New game of a series — survivors may keep theirs", "Nova partida de uma série — sobreviventes podem manter"), t("Players still alive at the end of the previous game may keep their character (not their cards). Players who were eliminated draw a new character at random.", "Jogadores ainda vivos no fim da partida anterior podem manter o personagem (não as cartas). Quem foi eliminado sorteia um novo personagem."))
          ].join(""), "bg-two")}
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function setupPhases() {
    const n = players();
    const split = roles();
    const roleList = roleSplitText();
    const unused = ["deputy", "outlaw"]
      .map((id) => ({ id, left: (id === "deputy" ? 2 : 3) - split[id] }))
      .filter((item) => item.left > 0)
      .map((item) => `${item.left} ${roleName(item.id, item.left)}`);
    return [
      {
        id: "table",
        title: t("Boards, bullets and summary cards", "Tabuleiros, balas e cartas-resumo"),
        pages: [1, 2],
        items: [
          t("First game only: carefully punch the 30 bullet tokens out of their frames.", "Só na primeira partida: destaque com cuidado as 30 balas de suas molduras."),
          t(`Each of the ${n} players takes a playing board and places it in front of them. It holds your role, your character, your weapon and your bullets. The Colt .45 (range 1) is printed on it.`, `Cada um dos ${n} jogadores pega um tabuleiro e o coloca à sua frente. Ele guarda seu papel, seu personagem, sua arma e suas balas. O Colt .45 (alcance 1) está impresso nele.`),
          t("Put the 30 bullets in a pile in the middle of the table, within everyone's reach.", "Ponha as 30 balas numa pilha no meio da mesa, ao alcance de todos."),
          interpretation(`give each player one of the 7 summary cards as a memory aid (the rulebook lists them in the contents but gives no rule for them). Return the other ${7 - n} boards and summary cards to the box.`, `dê a cada jogador uma das 7 cartas-resumo como lembrete (o manual as lista nos componentes, mas não dá regra para elas). Devolva à caixa os outros ${7 - n} tabuleiros e cartas-resumo.`)
        ]
      },
      {
        id: "roles",
        title: t("Deal the secret roles", "Distribua os papéis secretos"),
        pages: [2],
        items: rotating()
          ? [
            t(`Take exactly ${n} role cards: ${roleList}. Return ${unused.length ? unused.join(" and ") : "nothing"} to the box.`, `Pegue exatamente ${n} cartas de papel: ${roleList}. Devolva à caixa ${unused.length ? unused.join(" e ") : "nada"}.`),
            t("Give the Sheriff card face up to the player whose turn it is to be Sheriff (the order was agreed before the series started).", "Dê a carta de Xerife, virada para cima, ao jogador que é a vez de ser Xerife (a ordem foi combinada antes de a série começar)."),
            interpretation("the rulebook only says to pass the Sheriff role from game to game; for the first game, choose the Sheriff by agreement or at random, then pass it clockwise each game until everyone has had it.", "o manual só diz para passar o papel de Xerife de partida em partida; na primeira, escolham o Xerife em comum acordo ou por sorteio e depois passem-no em sentido horário a cada partida até todos o terem tido."),
            t(`Shuffle the other ${n - 1} role cards and deal one face down to each other player.`, `Embaralhe as outras ${n - 1} cartas de papel e dê uma, virada para baixo, a cada outro jogador.`),
            t("Each player secretly looks at their role and keeps it hidden — under the board's role slot, face down — until they are eliminated.", "Cada jogador olha seu papel em segredo e o mantém escondido — no espaço do papel no tabuleiro, virado para baixo — até ser eliminado.")
          ]
          : [
            t(`Take exactly ${n} role cards: ${roleList}. Return ${unused.length ? unused.join(" and ") : "nothing"} to the box.`, `Pegue exatamente ${n} cartas de papel: ${roleList}. Devolva à caixa ${unused.length ? unused.join(" e ") : "nada"}.`),
            t("Shuffle them and deal one face down to each player.", "Embaralhe-as e dê uma, virada para baixo, a cada jogador."),
            t("Whoever got the Sheriff reveals it at once by turning it face up.", "Quem recebeu o Xerife o revela na hora, virando-o para cima."),
            t("Everyone else secretly looks at their role and keeps it hidden — face down on the board — until they are eliminated.", "Os demais olham o próprio papel em segredo e o mantêm escondido — virado para baixo no tabuleiro — até serem eliminados.")
          ]
      },
      {
        id: "characters",
        title: t("Characters and life points", "Personagens e pontos de vida"),
        pages: keeping() ? [2, 4] : [2],
        items: [
          keeping()
            ? `${t("Players who survived the previous game may keep their character (their cards are not kept). Every other player — eliminated, or a survivor who wants a change — gets a new character drawn at random, face up.", "Os sobreviventes da partida anterior podem manter o personagem (as cartas não são mantidas). Todo outro jogador — eliminado, ou sobrevivente que queira trocar — recebe um novo personagem sorteado, virado para cima.")} ${interpretation("shuffle every character that nobody kept (the ones just given up included) and deal from that pile.", "embaralhe todos os personagens que ninguém manteve (inclusive os recém-devolvidos) e distribua dessa pilha.")}`
            :t("Shuffle the 16 character cards and deal one face up to each player.", "Embaralhe as 16 cartas de personagem e dê uma, virada para cima, a cada jogador."),
          t("In turn, each player announces their character's name and reads its ability aloud.", "Um por vez, cada jogador anuncia o nome do personagem e lê a habilidade em voz alta."),
          t("Each player takes as many bullets as shown on their character (3 or 4). These are your life points and your hand-size limit.", "Cada jogador pega tantas balas quantas aparecem no personagem (3 ou 4). Elas são seus pontos de vida e seu limite de mão."),
          t("The Sheriff takes one extra bullet: a 3-bullet character plays with 4, a 4-bullet character with 5, for all effects.", "O Xerife pega uma bala a mais: personagem de 3 balas joga com 4, de 4 balas com 5, para todos os efeitos."),
          t("Return the unused characters to the box (or keep one face down as a life tracker — see the Curiosity tip below).", "Devolva os personagens não usados à caixa (ou guarde um virado para baixo como marcador de vida — veja a dica Curiosidade abaixo).")
        ]
      },
      {
        id: "deck",
        title: t("Playing cards: hands and draw pile", "Cartas de jogo: mãos e pilha de compra"),
        pages: [2, 3],
        items: [
          simple()
            ? t("Simplified game: first remove every playing card showing the open-book symbol and put it in the box.", "Jogo simplificado: primeiro tire toda carta de jogo com o símbolo do livro aberto e guarde-a na caixa.")
            : null,
          t(`Shuffle the ${simple() ? "remaining playing" : "80 playing"} cards.`, `Embaralhe as ${simple() ? "cartas de jogo restantes" : "80 cartas de jogo"}.`),
          t("Deal each player as many cards, face down, as the bullets they have: 3 or 4, and 4 or 5 for the Sheriff. Hands are secret.", "Dê a cada jogador tantas cartas, viradas para baixo, quantas balas ele tem: 3 ou 4, e 4 ou 5 para o Xerife. As mãos são secretas."),
          t("Put the rest face down in the middle of the table as the draw pile. Leave room next to it for the face-up discard pile.", "Ponha o resto virado para baixo no meio da mesa como pilha de compra. Deixe espaço ao lado para a pilha de descarte, virada para cima.")
        ]
      },
      {
        id: "start",
        title: t("Start the game", "Comece a partida"),
        pages: [3, 4],
        items: [
          t("The Sheriff takes the first turn. Play then goes clockwise.", "O Xerife faz o primeiro turno. Depois o jogo segue em sentido horário."),
          t("Everyone starts with only the Colt .45 printed on the board: range 1, i.e. the players sitting immediately to your left and right.", "Todos começam só com o Colt .45 impresso no tabuleiro: alcance 1, ou seja, os jogadores sentados imediatamente à sua esquerda e à sua direita."),
          t("Remember the secrecy: never show your role, and do not type it into this guide or any device the table can see.", "Lembre o sigilo: nunca mostre seu papel e não o digite neste guia nem em nenhum aparelho que a mesa possa ver.")
        ]
      }
    ];
  }

  function inventory() {
    const n = players();
    const split = roles();
    const cards = [
      infoCard(t(`ROLES · ${n} CARDS`, `PAPÉIS · ${n} CARTAS`), t("Role cards in this match", "Cartas de papel nesta partida"), [
        ...["sheriff", "renegade", "outlaw", "deputy"].map((id) => `${icon(id, roleName(id))} <strong>${roleName(id)}</strong> ×${split[id]}${split[id] === 0 ? t(" — stays in the box", " — fica na caixa") : ""}`),
        t("Box total: 7 roles (1 Sheriff, 2 Deputies, 3 Outlaws, 1 Renegade).", "Total da caixa: 7 papéis (1 Xerife, 2 Vices, 3 Foras da lei, 1 Renegado).")
      ], [1, 2]),
      infoCard(t(`PER PLAYER · ×${n}`, `POR JOGADOR · ×${n}`), t("In front of each player", "À frente de cada jogador"), [
        t("1 playing board (Colt .45 printed on it).", "1 tabuleiro (com o Colt .45 impresso)."),
        t("1 role card, face down (Sheriff face up).", "1 carta de papel, virada para baixo (Xerife virado para cima)."),
        t("1 character card, face up.", "1 carta de personagem, virada para cima."),
        t("3–4 bullets (Sheriff 4–5) and the same number of playing cards in hand.", "3–4 balas (Xerife 4–5) e o mesmo número de cartas de jogo na mão."),
        t("1 summary card (memory aid).", "1 carta-resumo (lembrete).")
      ], [1, 2]),
      infoCard(t("SHARED", "COMPARTILHADO"), t("Middle of the table", "Meio da mesa"), [
        t(`Draw pile: ${simple() ? "the playing cards without the book cards" : "the 80 playing cards"}, minus the hands.`, `Pilha de compra: ${simple() ? "as cartas de jogo sem as cartas do livro" : "as 80 cartas de jogo"}, menos as mãos.`),
        t("Discard pile (face up) — starts empty. When the draw pile runs out, shuffle it into a new draw pile.", "Pilha de descarte (virada para cima) — começa vazia. Quando a pilha de compra acabar, embaralhe-a para formar uma nova."),
        t("Bullet pile: the 30 bullets not on characters. Lost bullets go here; healed bullets come from here.", "Pilha de balas: as 30 balas que não estão nos personagens. Balas perdidas vão para cá; balas recuperadas saem daqui."),
        t(`Back in the box: ${7 - n} boards, ${7 - n} roles, ${16 - n} characters${simple() ? ", the book cards" : ""}.`, `Na caixa: ${7 - n} tabuleiros, ${7 - n} papéis, ${16 - n} personagens${simple() ? ", as cartas do livro" : ""}.`)
      ], [1, 2, 6])
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
        <label class="bg-setup-check" for="bg-setup-${phase.id}">
          <input id="bg-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="bg-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="bg-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), sectionIndex("setup"), [1, 2])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Set up this match", "Prepare esta partida")} · ${playersLabel()}</h3>
            <p>${t("One checkbox per coherent step; tick it when all its substeps are done. This checklist is shared table progress — it never records who has which role.", "Uma caixa por etapa coerente; marque quando todos os subpassos estiverem feitos. Esta lista é o progresso da mesa — ela nunca registra quem tem qual papel.")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved separately from the match configuration and language. Changing the player count, the deck, the Sheriff option or the character option clears this checklist; changing the language does not. “Uncheck all” clears only these setup boxes.",
          "O progresso é salvo separadamente da configuração da partida e do idioma. Trocar o número de jogadores, o baralho, a opção do Xerife ou a dos personagens limpa esta lista; trocar o idioma não. “Desmarcar tudo” limpa somente as caixas da preparação."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}
      <div class="bg-tip">
        <img src="${ART}life-tracker.webp" alt="${t("A spare character card, face down, under Jesse Jones so that only 3 bullets show", "Um personagem sobrando, virado para baixo, sob Jesse Jones de modo que só 3 balas aparecem")}" loading="lazy">
        <div>
          <strong>${t("Curiosity: track life without bullets", "Curiosidade: marque a vida sem balas")}</strong>
          <p>${t("Instead of bullet tokens you may use a leftover character card: turn it face down and slide your character over it to cover or uncover the bullets printed on its back. The picture shows Jesse Jones with three life points.", "Em vez das balas, você pode usar um personagem que sobrou: vire-o para baixo e deslize seu personagem sobre ele para cobrir ou descobrir as balas impressas no verso. A imagem mostra Jesse Jones com três pontos de vida.")}</p>
          ${referenceLink(11)}
        </div>
      </div>`;
  }

  // ---------- quick reference ----------

  function quickReference() {
    const cards = [
      infoCard(t("YOUR TURN", "SEU TURNO"), t("Checks, then 3 phases", "Verificações e 3 fases"), [
        rl("Before phase 1", "Dynamite in front of you? “draw!” for it first. Then Jail? “draw!” to escape.", "Antes da fase 1", "Dynamite à sua frente? Faça o “saque!” dela primeiro. Depois a Jail? Faça o “saque!” para escapar."),
        rl("1 · Draw", "take the top 2 cards of the draw pile (some characters change this).", "1 · Comprar", "pegue as 2 cartas do topo da pilha de compra (alguns personagens mudam isso)."),
        rl("2 · Play", "play any number of cards, in any order — or none.", "2 · Jogar", "jogue quantas cartas quiser, em qualquer ordem — ou nenhuma."),
        rl("3 · Discard", "discard down to your current life points.", "3 · Descartar", "descarte até ficar com seus pontos de vida atuais."),
        rl("Next", "the player on your left (clockwise).", "Próximo", "o jogador à sua esquerda (sentido horário).")
      ], [3, 9]),
      infoCard(t("THREE LIMITS", "TRÊS LIMITES"), t("While playing cards", "Ao jogar cartas"), [
        rl("1 BANG! card per turn", "Gatling, Duel and Indians! are not BANG! cards. Volcanic and Willy the Kid remove the limit.", "1 carta BANG! por turno", "Gatling, Duel e Indians! não são cartas BANG!. Volcanic e Willy the Kid removem o limite."),
        rl("1 copy of a card in play", "no two cards with the same name in front of you.", "1 cópia de cada carta em jogo", "nada de duas cartas com o mesmo nome à sua frente."),
        rl("1 weapon in play", "a new weapon replaces (discards) the old one. The Colt .45 is always there underneath.", "1 arma em jogo", "uma arma nova substitui (descarta) a antiga. O Colt .45 sempre está por baixo.")
      ], [3, 11]),
      infoCard(t("OUT OF TURN", "FORA DO TURNO"), t("What you may play when it is not your turn", "O que se joga fora do seu turno"), [
        rl("Missed!", "cancel a BANG! (or Gatling shot) aimed at you.", "Missed!", "cancele um BANG! (ou tiro da Gatling) mirado em você."),
        rl("Barrel", "“draw!” when targeted by a BANG!: Heart = Missed!.", "Barrel", "faça um “saque!” quando for alvo de um BANG!: Copas = Missed!."),
        rl("Beer", "out of turn only when a hit has just taken your last life point (on your own turn, any time).", "Beer", "fora do turno só quando um golpe acabou de tirar seu último ponto de vida (no seu turno, a qualquer momento)."),
        rl("BANG!", "discard one to answer Indians! or a Duel.", "BANG!", "descarte um para responder a Indians! ou a um Duel."),
        rl("Characters", "some abilities also work out of turn (Calamity Janet's BANG! as Missed!, Sid Ketchum “at any time”).", "Personagens", "algumas habilidades também valem fora do turno (o BANG! como Missed! de Calamity Janet, Sid Ketchum “a qualquer momento”).")
      ], [3, 6, 8, 10]),
      infoCard(t("DISTANCE", "DISTÂNCIA"), t("Who you can reach", "Quem você alcança"), [
        rl("Count seats", "the fewest places between you, either way around. Neighbours are 1.", "Conte lugares", "o menor número de lugares entre vocês, por qualquer lado. Vizinhos estão a 1."),
        rl("Mustang", "others see you +1.", "Mustang", "os outros veem você +1."),
        rl("Scope", "you see others −1 (never below 1).", "Scope", "você vê os outros −1 (nunca abaixo de 1)."),
        rl("Weapon", "your BANG! reach only; never changes distance.", "Arma", "só o alcance do seu BANG!; nunca muda a distância."),
        rl("Eliminated", "players out of the game are not counted.", "Eliminados", "jogadores fora da partida não contam.")
      ], [4, 5, 8]),
      infoCard(t("LIFE & ELIMINATION", "VIDA E ELIMINAÇÃO"), t("Losing your last bullet", "Perder a última bala"), [
        rl("Hit", "lose 1 life point: put a bullet in the middle pile.", "Atingido", "perca 1 ponto de vida: ponha uma bala na pilha do meio."),
        rl("Max life", "never above your starting amount.", "Vida máxima", "nunca acima do valor inicial."),
        rl("Last life point", "you are out unless you play a Beer at once (not a Saloon). With 2 players left, Beer does nothing.", "Último ponto de vida", "você sai, a menos que jogue uma Beer na hora (não um Saloon). Com 2 jogadores restantes, a Beer não faz nada."),
        rl("Out", "reveal your role card and discard all cards in hand and in play.", "Fora", "revele sua carta de papel e descarte todas as cartas da mão e em jogo.")
      ], [4, 6]),
      infoCard(t("REWARDS & PENALTIES", "PRÊMIOS E PUNIÇÕES"), t("Who eliminated whom", "Quem eliminou quem"), [
        rl("Outlaw eliminated", "the player who did it draws 3 cards from the deck — even another Outlaw.", "Fora da lei eliminado", "quem o eliminou compra 3 cartas do baralho — mesmo outro Fora da lei."),
        roles().deputy > 0
          ? rl("Sheriff eliminates a Deputy", "the Sheriff discards all cards in hand and in play.", "Xerife elimina um Vice", "o Xerife descarta todas as cartas da mão e em jogo.")
          : null,
        rl("Dynamite", "its damage is not caused by any player.", "Dynamite", "o dano dela não é causado por nenhum jogador."),
        interpretation("the rulebook names no other reward or penalty: eliminating the Renegade, a Deputy (by anyone but the Sheriff) or the Sheriff gives nothing.", "o manual não cita outro prêmio ou punição: eliminar o Renegado, um Vice (por alguém que não o Xerife) ou o Xerife não dá nada.")
      ], [4, 9]),
      infoCard(t("GAME END", "FIM DA PARTIDA"), t("Two ways it ends", "Duas formas de acabar"), [
        rl("Sheriff killed", "the Renegade wins if he is the only one alive; otherwise the Outlaws win (even if all are dead).", "Xerife morto", "o Renegado vence se for o único vivo; senão, os Foras da lei vencem (mesmo que todos estejam mortos)."),
        rl("All Outlaws and the Renegade killed", roles().deputy > 0 ? "the Sheriff and the Deputies win." : "the Sheriff wins.", "Todos os Foras da lei e o Renegado mortos", roles().deputy > 0 ? "o Xerife e os Vices vencem." : "o Xerife vence."),
        rl("Otherwise", "keep playing — e.g. the Renegade alone against the Sheriff's side.", "Caso contrário", "continue jogando — por exemplo, o Renegado sozinho contra o lado do Xerife.")
      ], [4], "victory-card")
    ];
    const cardList = CARDS.map((card) => `<strong>${cardName(card)}</strong> <span class="bg-kind bg-kind-${card.kind}">${card.kind === "brown" ? t("brown", "marrom") : t("blue", "azul")}</span> — ${t(card.short[0], card.short[1])}`);
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), sectionIndex("quick-reference"), [3, 4, 11])}
      <div class="callout">${t(
        `Secret roles, open gunfight. ${playersLabel()}: ${roleSplitText()}. Only the Sheriff is known. Shoot with BANG! cards at players your weapon reaches, dodge with Missed!, drink Beer to heal — and play for your own side's goal.`,
        `Papéis secretos, tiroteio aberto. ${playersLabel()}: ${roleSplitText()}. Só o Xerife é conhecido. Atire com cartas BANG! em quem sua arma alcança, desvie com Missed!, beba Beer para se curar — e jogue pelo objetivo do seu lado.`
      )} ${referenceLink(1)}</div>
      <div class="quick-grid">${cards.join("")}</div>
      <h3 class="subhead">${t("Card list", "Lista de cartas")}${simple() ? t(" · skip the book cards you removed", " · ignore as cartas do livro que você tirou") : ""}</h3>
      <article class="info-card bg-card-list">
        <span class="component-label">${t("EVERY CARD NAME", "TODOS OS NOMES DE CARTA")}</span>
        ${lineList(cardList)}
        ${t("Full text and special cases:", "Texto completo e casos especiais:")} <button type="button" class="bg-inline-link" data-scroll="cards">${t("The cards", "As cartas")}</button>
      </article>`;
  }

  // ---------- roles & winning ----------

  function rolesSection() {
    const split = roles();
    const goals = {
      sheriff: [
        ["Must eliminate all the Outlaws and the Renegade to protect law and order.", "Deve eliminar todos os Foras da lei e o Renegado para proteger a lei e a ordem."],
        ["Known to everyone from the start; plays with +1 life point (and +1 card in the starting hand). Takes the first turn. Cannot be jailed.", "Conhecido por todos desde o início; joga com +1 ponto de vida (e +1 carta na mão inicial). Faz o primeiro turno. Não pode ser preso."],
        split.deputy > 0
          ? ["Beware: eliminating a Deputy costs you every card in hand and in play.", "Cuidado: eliminar um Vice custa todas as cartas da sua mão e em jogo."]
          : ["With 4 players there is no Deputy: everyone else is against you.", "Com 4 jogadores não há Vice: todos os outros estão contra você."]
      ],
      deputy: [
        ["Help and protect the Sheriff and share the Sheriff's goal, at all costs.", "Ajudar e proteger o Xerife e compartilhar o objetivo dele, custe o que custar."],
        ["Secret: the Sheriff does not know who you are either.", "Secreto: nem o Xerife sabe quem você é."],
        ["Wins with the Sheriff when all Outlaws and the Renegade are eliminated.", "Vence com o Xerife quando todos os Foras da lei e o Renegado são eliminados."]
      ],
      outlaw: [
        ["Want to kill the Sheriff — and have no scruples about eliminating each other to collect the 3-card reward.", "Querem matar o Xerife — e não têm escrúpulos em eliminar uns aos outros para ganhar o prêmio de 3 cartas."],
        ["Secret, even from the other Outlaws.", "Secretos, até para os outros Foras da lei."],
        ["Win when the Sheriff dies, unless the Renegade is then the only one alive — even if every Outlaw is already dead.", "Vencem quando o Xerife morre, a menos que o Renegado seja então o único vivo — mesmo que todos os Foras da lei já estejam mortos."]
      ],
      renegade: [
        ["Wants to be the new Sheriff: his goal is to be the last character in play.", "Quer ser o novo Xerife: o objetivo dele é ser o último jogador em jogo."],
        ["Secret. Works alone.", "Secreto. Joga sozinho."],
        ["Wins only if the Sheriff dies when the Renegade is the only one left alive — so everyone else must fall first, the Sheriff last.", "Só vence se o Xerife morrer quando o Renegado for o único que resta vivo — então todos os outros precisam cair antes, e o Xerife por último."]
      ]
    };
    const roleCards = ["sheriff", "deputy", "outlaw", "renegade"].map((id) => `
      <article class="info-card bg-role ${split[id] === 0 ? "is-absent" : ""}">
        <div class="bg-role-head">
          <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${id}.webp" alt="${roleName(id)}"></span>
          <div><h3>${roleName(id)}</h3><span class="component-label">${split[id] === 0 ? t("not in this match", "não está nesta partida") : t(`×${split[id]} in this match`, `×${split[id]} nesta partida`)}</span></div>
        </div>
        ${lineList(goals[id].map(([en, pt]) => t(en, pt)))}
        ${referenceLink(1)}
      </article>`).join("");
    return `
      ${sectionHeading("roles", t("Roles & winning", "Papéis e vitória"), sectionIndex("roles"), [1, 2, 4])}
      <p class="glossary-intro">${t(
        `With ${playersLabel()} the roles are ${roleSplitText()}. Only the Sheriff's card is face up. Everyone else keeps their role secret and reveals it only when eliminated.`,
        `Com ${playersLabel()} os papéis são ${roleSplitText()}. Só a carta do Xerife fica virada para cima. Os demais mantêm o papel em segredo e só o revelam quando eliminados.`
      )}</p>
      <div class="quick-grid">${roleCards}</div>
      <h3 class="subhead">${t("When the game ends", "Quando a partida acaba")}</h3>
      <div class="quick-grid">
        ${infoCard(t("CONDITION A", "CONDIÇÃO A"), t("The Sheriff is killed", "O Xerife é morto"), [
          t("The game ends at once.", "A partida acaba na hora."),
          t("If the Renegade is the only player still alive, the Renegade wins.", "Se o Renegado for o único jogador ainda vivo, o Renegado vence."),
          t(`Otherwise the Outlaws win — even if they are all already eliminated${split.deputy > 0 ? ", and even if Deputies are still alive" : ""}.`, `Caso contrário, os Foras da lei vencem — mesmo que todos já tenham sido eliminados${split.deputy > 0 ? ", e mesmo que haja Vices vivos" : ""}.`),
          split.deputy > 0 ? t("The Deputies lose with the Sheriff.", "Os Vices perdem junto com o Xerife.") : null
        ], 4, "victory-card")}
        ${infoCard(t("CONDITION B", "CONDIÇÃO B"), t("All Outlaws and the Renegade are killed", "Todos os Foras da lei e o Renegado são mortos"), [
          split.deputy > 0 ? t("The Sheriff and the Deputies win.", "O Xerife e os Vices vencem.") : t("The Sheriff wins.", "O Xerife vence."),
          split.deputy > 0 ? interpretation("Deputies who were eliminated earlier still win with their side, just as dead Outlaws do in condition A.", "Vices eliminados antes também vencem com o seu lado, como os Foras da lei mortos na condição A.") : null,
          t("If only the Outlaws are gone and the Renegade is still alive, the game goes on.", "Se só os Foras da lei saíram e o Renegado ainda está vivo, a partida continua.")
        ], 4, "victory-card")}
        ${infoCard(t("SERIES", "SÉRIE"), t("Playing again", "Jogar de novo"), [
          t("Players still alive at the end may keep their character for the next game (not their cards). Eliminated players draw a new character at random.", "Quem ainda está vivo no fim pode manter o personagem na próxima partida (não as cartas). Quem foi eliminado sorteia um novo personagem."),
          t("Optionally pass the Sheriff role around from game to game, dealing the other roles at random.", "Opcionalmente, passe o papel de Xerife de partida em partida, sorteando os outros papéis."),
          t("Set these with the Sheriff and Characters choices at the top of the page.", "Defina isso nas escolhas de Xerife e de Personagens no topo da página.")
        ], 4)}
      </div>`;
  }

  // ---------- turn ----------

  function turnSection() {
    return `
      ${sectionHeading("turn", t("Your turn", "Seu turno"), sectionIndex("turn"), [3, 9])}
      <div class="quick-grid">
        ${infoCard(t("BEFORE PHASE 1", "ANTES DA FASE 1"), t("Dynamite, then Jail", "Dynamite, depois Jail"), [
          rl("Dynamite", "if it is in front of you, “draw!”: Spades 2–9 explodes (discard it, lose 3 life points); anything else passes it to the player on your left.", "Dynamite", "se estiver à sua frente, faça o “saque!”: Espadas 2–9 explode (descarte-a, perca 3 pontos de vida); qualquer outra carta a passa ao jogador à sua esquerda."),
          rl("Jail", "if you are jailed, “draw!”: Heart → discard the Jail and play normally; anything else → discard the Jail and skip this turn.", "Jail", "se estiver preso, faça o “saque!”: Copas → descarte a Jail e jogue normalmente; outro naipe → descarte a Jail e perca este turno."),
          rl("Both", "check the Dynamite first.", "As duas", "resolva primeiro a Dynamite."),
          t("If you survive the explosion, carry on: check the Jail (if any), then play your turn normally.", "Se sobreviver à explosão, siga em frente: resolva a Jail (se houver) e jogue seu turno normalmente."),
          interpretation("if the Dynamite eliminates you, you take no turn and the Jail is discarded with your other cards.", "se a Dynamite eliminar você, você não joga o turno e a Jail é descartada com suas outras cartas.")
        ], 9)}
        ${infoCard(t("PHASE 1", "FASE 1"), t("Draw two cards", "Compre duas cartas"), [
          t("Draw the top two cards of the draw pile.", "Compre as duas cartas do topo da pilha de compra."),
          t("Whenever the draw pile is empty, shuffle the discard pile to make a new draw pile.", "Sempre que a pilha de compra acabar, embaralhe a pilha de descarte para formar uma nova."),
          t("Black Jack, Jesse Jones, Kit Carlson and Pedro Ramirez draw differently — see Characters.", "Black Jack, Jesse Jones, Kit Carlson e Pedro Ramirez compram de outro jeito — veja Personagens.")
        ], 3)}
        ${infoCard(t("PHASE 2", "FASE 2"), t("Play any number of cards", "Jogue quantas cartas quiser"), [
          t("Play cards to help yourself or hurt others. You are never forced to play.", "Jogue cartas para se ajudar ou prejudicar os outros. Você nunca é obrigado a jogar."),
          rl("Brown border", "play it into the discard pile and apply its effect.", "Borda marrom", "jogue-a na pilha de descarte e aplique o efeito."),
          rl("Blue border", "place it face up in front of you (Jail goes in front of another player). It stays in play until discarded or removed.", "Borda azul", "coloque-a virada para cima à sua frente (a Jail vai à frente de outro jogador). Fica em jogo até ser descartada ou removida."),
          rl("Limits", "1 BANG! card per turn · no two cards with the same name in front of you · 1 weapon.", "Limites", "1 carta BANG! por turno · nada de duas cartas de mesmo nome à sua frente · 1 arma."),
          t("Outside your own turn you may only play Missed!, Beer (lethal hit) and BANG! cards asked for by Indians! or a Duel — plus whatever your character's ability allows.", "Fora do seu turno você só pode jogar Missed!, Beer (golpe letal) e cartas BANG! pedidas por Indians! ou Duel — além do que a habilidade do seu personagem permitir.")
        ], 3)}
        ${infoCard(t("PHASE 3", "FASE 3"), t("Discard excess cards", "Descarte o excesso"), [
          t("When you cannot or do not want to play more, discard from your hand down to your hand-size limit.", "Quando não puder ou não quiser jogar mais, descarte da mão até o seu limite de mão."),
          t("Hand-size limit = the life points (bullets) you have right now.", "Limite de mão = os pontos de vida (balas) que você tem agora."),
          t("Then the player on your left takes their turn.", "Depois o jogador à sua esquerda faz o turno.")
        ], 3)}
        ${infoCard(t("“DRAW!”", "“SAQUE!”"), t("Checking a card's luck", "Testar a sorte de uma carta"), [
          t("Barrel, Jail and Dynamite show small poker suits/values, an equals sign and their effect.", "Barrel, Jail e Dynamite mostram pequenos naipes/valores de pôquer, um sinal de igual e o efeito."),
          t("To “draw!”, flip the top card of the draw pile, discard it and look at the poker symbol in its lower-left corner.", "Para fazer o “saque!”, vire a carta do topo da pilha de compra, descarte-a e olhe o símbolo de pôquer no canto inferior esquerdo."),
          t("If suit (and value, when a range is printed) match, the effect happens. Otherwise nothing happens.", "Se o naipe (e o valor, quando houver uma faixa impressa) bater, o efeito acontece. Senão, nada acontece."),
          t("Value order: 2-3-4-5-6-7-8-9-10-J-Q-K-A. The flipped card itself never has an effect.", "Ordem dos valores: 2-3-4-5-6-7-8-9-10-J-Q-K-A. A carta virada nunca tem efeito próprio.")
        ], [8, 9])}
        ${infoCard(t("LIFE POINTS", "PONTOS DE VIDA"), t("Bullets", "Balas"), [
          t("Each hit removes one bullet to the central pile; healing takes one back.", "Cada golpe manda uma bala para a pilha central; curar pega uma de volta."),
          t("Never more life points than you started with.", "Nunca mais pontos de vida do que você começou."),
          t("At 0 you are eliminated — unless you immediately play enough Beers to get back above 0.", "Com 0 você é eliminado — a menos que jogue na hora Beers suficientes para voltar acima de 0."),
          t("When eliminated: reveal your role and discard everything in hand and in play. Then apply rewards/penalties.", "Ao ser eliminado: revele seu papel e descarte tudo da mão e em jogo. Depois aplique prêmios/punições.")
        ], [2, 4, 6])}
      </div>`;
  }

  // ---------- distance ----------

  function distanceSection() {
    return `
      ${sectionHeading("distance", t("Distance & shooting", "Distância e tiros"), sectionIndex("distance"), [4, 5, 8])}
      <div class="bg-distance">
        <figure>
          <img src="${ART}distance.webp" alt="${t("Six players A to F around a table, with arrows showing distances from A: B and F at 1, C and E at 2, D at 3", "Seis jogadores, de A a F, ao redor de uma mesa, com setas mostrando as distâncias a partir de A: B e F a 1, C e E a 2, D a 3")}" loading="lazy">
          <figcaption>${t("Distance figure (rulebook p. 4): from Ann (A), Ben (B) and Flo (F) are at 1, Carl (C) and Emma (E) at 2, Dan (D) at 3.", "Figura de distância (manual p. 4): a partir de Ann (A), Ben (B) e Flo (F) estão a 1, Carl (C) e Emma (E) a 2, Dan (D) a 3.")}</figcaption>
        </figure>
        <div class="quick-grid">
          ${infoCard(t("DISTANCE", "DISTÂNCIA"), t("Counting places", "Contar lugares"), [
            t("The distance between two players is the minimum number of places between them, counting clockwise or counter-clockwise.", "A distância entre dois jogadores é o menor número de lugares entre eles, contando em sentido horário ou anti-horário."),
            t("Eliminated players no longer count: players get “closer” as others fall.", "Jogadores eliminados não contam mais: os jogadores ficam “mais perto” à medida que outros caem."),
            rl("Mustang", "everyone else sees you 1 farther. You still see them normally.", "Mustang", "todos os outros veem você 1 mais longe. Você continua vendo-os normalmente."),
            rl("Scope", "you see everyone else 1 closer (minimum 1). They still see you normally.", "Scope", "você vê todos os outros 1 mais perto (mínimo 1). Eles continuam vendo você normalmente."),
            t("Mustang and Scope combine: a Scope against a Mustang cancels out.", "Mustang e Scope se combinam: uma Scope contra um Mustang se anulam.")
          ], [4, 8])}
          ${infoCard(t("REACH", "ALCANCE"), t("Weapons and symbols", "Armas e símbolos"), [
            rl("Weapon", "the number in its sight is the farthest distance your BANG! cards can reach. Colt .45 = 1.", "Arma", "o número na mira é a maior distância que suas cartas BANG! alcançam. Colt .45 = 1."),
            rl("Weapons never change distance", "they only set your shooting range.", "Armas nunca mudam a distância", "só definem o alcance do seu tiro."),
            rl("Number symbol (Panic!)", "a player at that distance or less. Only Mustang/Scope matter, never your weapon.", "Símbolo de número (Panic!)", "um jogador a essa distância ou menos. Só Mustang/Scope importam, nunca sua arma."),
            rl("Any player (Cat Balou, Jail, Duel)", "regardless of distance.", "Qualquer jogador (Cat Balou, Jail, Duel)", "sem importar a distância."),
            rl("All others (Gatling, Saloon, Indians!)", "everyone except you, regardless of distance.", "Todos os outros (Gatling, Saloon, Indians!)", "todos menos você, sem importar a distância.")
          ], [5, 7])}
          ${infoCard(t("SHOOTING", "ATIRAR"), t("Playing a BANG!", "Jogar um BANG!"), [
            t("1. Pick the target and work out the distance to them (with Mustang/Scope).", "1. Escolha o alvo e calcule a distância até ele (com Mustang/Scope)."),
            t("2. Check your weapon reaches that distance.", "2. Confira se sua arma alcança essa distância."),
            t("3. The target may “draw!” for a Barrel, then play a Missed!.", "3. O alvo pode fazer o “saque!” do Barrel e depois jogar um Missed!."),
            t("4. Not cancelled: the target loses 1 life point. The BANG! is discarded either way.", "4. Não cancelado: o alvo perde 1 ponto de vida. O BANG! é descartado de qualquer forma.")
          ], [5, 6])}
        </div>
      </div>`;
  }

  // ---------- cards ----------

  function cardsSection() {
    return `
      ${sectionHeading("cards", t("The cards", "As cartas"), sectionIndex("cards"), [3, 5, 6, 7, 8, 9])}
      <p class="glossary-intro">${t(
        "Brown-bordered cards are played into the discard pile for an immediate effect. Blue-bordered cards stay face up in front of you (Jail goes in front of another player) until removed. Weapons are blue cards with no bullet holes, a black-and-white picture and a number in a sight. The rulebook pictures show the Italian title on each card with the English name in small print; it is given below. The rulebook does not list how many copies of each card the 80-card deck has.",
        "Cartas de borda marrom vão para a pilha de descarte com efeito imediato. Cartas de borda azul ficam viradas para cima à sua frente (a Jail vai à frente de outro jogador) até serem removidas. Armas são cartas azuis sem buracos de bala, com imagem em preto e branco e um número numa mira. As imagens do manual mostram o título em italiano em cada carta, com o nome em inglês em letra pequena; ele aparece abaixo. O manual não lista quantas cópias de cada carta há no baralho de 80."
      )}${simple() ? ` <strong>${t("Simplified game: skip any card you removed for showing the book symbol.", "Jogo simplificado: ignore as cartas que você tirou por terem o símbolo do livro.")}</strong>` : ""}</p>
      <div class="bg-card-grid">${CARDS.map((card) => `
        <article class="info-card bg-card bg-card-${card.kind}" id="card-${card.id}">
          <div class="bg-card-head">
            <div><h3>${cardName(card)}</h3><span class="component-label">${kindLabel(card.kind)}${card.range ? ` · ${t("range", "alcance")} ${card.range}` : ""}</span></div>
            ${card.symbols.length ? `<span class="bg-card-symbols">${card.symbols.map(([file, alt]) => icon(file, alt)).join("")}</span>` : ""}
          </div>
          ${lineList(card.lines.map(([en, pt]) => t(en, pt)))}
          <p class="bg-italian">${t("Title on the pictured card:", "Título na carta ilustrada:")} <em>${card.italian}</em></p>
          ${referenceLink(card.page)}
        </article>`).join("")}</div>`;
  }

  // ---------- characters ----------

  function charactersSection() {
    return `
      ${sectionHeading("characters", t("Characters", "Personagens"), sectionIndex("characters"), [10, 11])}
      <p class="glossary-intro">${t(
        "Each character card shows its life points (bullets) and an ability that is always active. The Sheriff adds 1 to the life points shown. Abilities that copy a card (Jourdonnais, Paul Regret, Rose Doolan) stack with one real copy of that card.",
        "Cada carta de personagem mostra os pontos de vida (balas) e uma habilidade sempre ativa. O Xerife soma 1 aos pontos de vida mostrados. Habilidades que imitam uma carta (Jourdonnais, Paul Regret, Rose Doolan) se somam a uma cópia real dessa carta."
      )}</p>
      <div class="bg-character-grid">${CHARACTERS.map((ch) => `
        <article class="info-card bg-character" id="char-${ch.id}">
          <div class="bg-character-head"><h3>${ch.name}</h3><span class="bg-life" aria-label="${t(`${ch.life} life points`, `${ch.life} pontos de vida`)}">${ch.life}<small>${t("life", "vida")}</small></span></div>
          <p>${t(ch.text[0], ch.text[1])}</p>
          <p class="bg-sheriff-life">${t(`As Sheriff: ${ch.life + 1} life points.`, `Como Xerife: ${ch.life + 1} pontos de vida.`)}</p>
          ${referenceLink(ch.page)}
        </article>`).join("")}</div>`;
  }

  // ---------- iconography ----------

  function iconsSection() {
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), sectionIndex("icons"), [1, 2, 6, 7, 8])}
      <p class="glossary-intro">${t("Card effects are drawn with these symbols. A card with symbols on two lines has two simultaneous effects, one per line. Each image is cropped individually from the rulebook.", "Os efeitos das cartas são desenhados com estes símbolos. Uma carta com símbolos em duas linhas tem dois efeitos simultâneos, um por linha. Cada imagem foi recortada individualmente do manual.")} ${referenceLink(6)}</p>
      <h3 class="subhead">${t("Effect symbols", "Símbolos de efeito")}</h3>
      <div class="icon-grid">
        ${iconCard("bang", "BANG!", "Counts as a BANG!: removes one life point. Only the BANG! card itself counts toward the 1-per-turn limit; other cards with this symbol (Gatling) do not.", "BANG!", "Conta como um BANG!: remove um ponto de vida. Só a carta BANG! conta no limite de 1 por turno; outras cartas com este símbolo (Gatling) não.", 6)}
        ${iconCard("missed", "Missed!", "Counts as a Missed!: cancels the effect of a BANG! symbol.", "Missed!", "Conta como um Missed!: cancela o efeito de um símbolo BANG!.", 6)}
        ${iconCard("beer", "Regain one life point", "Only the player playing the card benefits, unless another symbol says otherwise.", "Recuperar um ponto de vida", "Só quem joga a carta se beneficia, a menos que outro símbolo diga o contrário.", 6)}
        ${iconCard("draw-card", "Draw a card", "From a specified player: a random card from their hand or one you choose in play. With no player specified: the top card of the deck. Drawn cards go to your hand.", "Comprar uma carta", "De um jogador indicado: uma carta aleatória da mão dele ou uma que você escolhe em jogo. Sem jogador indicado: a carta do topo do baralho. As cartas compradas vão para a sua mão.", 6)}
        ${iconCard("discard", "Force to discard a card", "The specified player discards a random card from their hand, or you choose and discard one of their cards in play.", "Forçar a descartar uma carta", "O jogador indicado descarta uma carta aleatória da mão, ou você escolhe e descarta uma das cartas dele em jogo.", 6)}
        ${iconCard("any-player", "Any player", "Apply the effect to any one player you choose, regardless of distance.", "Qualquer jogador", "Aplique o efeito a qualquer jogador que você escolher, sem importar a distância.", 7)}
        ${iconCard("all-others", "All the other players", "The effect applies to everyone except the player who played the card, regardless of distance.", "Todos os outros jogadores", "O efeito vale para todos, menos quem jogou a carta, sem importar a distância.", 7)}
        ${iconCard("reachable", "Any player within reach", "Any one player within your reachable distance (your weapon's range).", "Qualquer jogador ao alcance", "Qualquer jogador dentro da sua distância alcançável (o alcance da sua arma).", 7)}
        ${iconCard("distance", "Distance number", "Any one player at the printed distance or less. Mustang and Scope change this distance; weapons do not. The same sight with 1 is printed on your board for the Colt .45.", "Número de distância", "Qualquer jogador à distância impressa ou menos. Mustang e Scope mudam essa distância; armas não. A mesma mira com 1 está impressa no seu tabuleiro para o Colt .45.", 7)}
        ${iconCard("draw-heart", "“Draw!” result", "Poker suit, equals sign, effect. On the Barrel: a Heart on the “draw!” counts as a Missed!.", "Resultado do “saque!”", "Naipe de pôquer, sinal de igual, efeito. No Barrel: Copas no “saque!” vale um Missed!.", 8)}
      </div>
      <h3 class="subhead">${t("Roles and components", "Papéis e componentes")}</h3>
      <div class="icon-grid">
        ${iconCard("sheriff", "Sheriff", "The six-pointed star. The only role played face up.", "Xerife", "A estrela de seis pontas. O único papel jogado virado para cima.", 1)}
        ${roles().deputy > 0 ? iconCard("deputy", "Deputy", "The five-pointed star. Secret helper of the Sheriff.", "Vice", "A estrela de cinco pontas. Ajudante secreto do Xerife.", 1) : ""}
        ${iconCard("outlaw", "Outlaw", "The cloaked gunman. Secret enemy of the Sheriff.", "Fora da lei", "O pistoleiro de capa. Inimigo secreto do Xerife.", 1)}
        ${iconCard("renegade", "Renegade", "The masked face. Secret lone wolf.", "Renegado", "O rosto mascarado. Lobo solitário secreto.", 1)}
        ${iconCard("bullet", "Bullet", "One life point. Your bullets also set your hand-size limit at the end of your turn.", "Bala", "Um ponto de vida. Suas balas também definem seu limite de mão no fim do turno.", 1)}
        ${iconCard("book", "Book symbol", simple() ? "Cards showing it were removed for this simplified game." : "Marks the cards you may remove for a simplified first game.", "Símbolo do livro", simple() ? "As cartas com ele foram tiradas nesta partida simplificada." : "Marca as cartas que você pode tirar numa primeira partida simplificada.", 2)}
      </div>`;
  }

  // ---------- examples ----------

  function examplesSection() {
    const examples = [
      [t("Hand size falls with life", "O limite de mão cai com a vida"), [
        t("Jesse Jones has 4 life points: 4 hits eliminate him, and he may hold 4 cards at the end of his turn.", "Jesse Jones tem 4 pontos de vida: 4 golpes o eliminam, e ele pode ter 4 cartas no fim do turno."),
        t("He loses one and is at 3: now he may hold only 3 cards at the end of his turn.", "Ele perde um e fica com 3: agora só pode ter 3 cartas no fim do turno."),
        t("Life points can be recovered — and the limit rises with them.", "Pontos de vida podem ser recuperados — e o limite sobe junto.")
      ], 2],
      [t("No second Barrel", "Nada de segundo Barrel"), [
        t("You have a Barrel in play.", "Você tem um Barrel em jogo."),
        t("You cannot play another Barrel: you would have two cards with the same name in front of you.", "Você não pode jogar outro Barrel: teria duas cartas com o mesmo nome à sua frente.")
      ], 3],
      [t("Shooting at distance 2", "Atirar a distância 2"), [
        t("Ann (A) wants to shoot Carl (C), who is at distance 2.", "Ann (A) quer atirar em Carl (C), que está a distância 2."),
        t("She needs a Schofield, Remington, Rev. Carabine or Winchester — not a Volcanic or the Colt .45.", "Ela precisa de Schofield, Remington, Rev. Carabine ou Winchester — não de Volcanic nem do Colt .45."),
        t("With a Scope she sees Carl at 1 and any weapon works.", "Com uma Scope ela vê Carl a 1 e qualquer arma serve."),
        t("If Carl also has a Mustang, they cancel out: Carl is back at 2.", "Se Carl também tiver um Mustang, eles se anulam: Carl volta a estar a 2.")
      ], 5],
      [t("Mustang on the far side", "Mustang do outro lado"), [
        t("Dan (D) is at distance 3 from Ann and has a Mustang.", "Dan (D) está a distância 3 de Ann e tem um Mustang."),
        t("Ann sees him at 4 and needs a weapon reaching 4.", "Ann o vê a 4 e precisa de uma arma que alcance 4.")
      ], 5],
      [t("Ann's Mustang and Scope", "O Mustang e a Scope de Ann"), [
        t("Mustang on Ann: Ben and Flo see her at 2, Carl and Emma at 3, Dan at 4. She still sees them normally.", "Mustang em Ann: Ben e Flo a veem a 2, Carl e Emma a 3, Dan a 4. Ela continua vendo-os normalmente."),
        t("Scope on Ann instead: she sees Ben, Flo, Carl and Emma at 1 and Dan at 2. They still see her normally.", "Scope em Ann em vez disso: ela vê Ben, Flo, Carl e Emma a 1 e Dan a 2. Eles continuam vendo-a normalmente.")
      ], 8],
      [t("Beers against Dynamite", "Beers contra a Dynamite"), [
        t("You have 2 life points and the Dynamite explodes: 3 damage.", "Você tem 2 pontos de vida e a Dynamite explode: 3 de dano."),
        t("Play 2 Beers and you survive with 1 (2 − 3 + 2).", "Jogue 2 Beers e você sobrevive com 1 (2 − 3 + 2)."),
        t("With only 1 Beer you would still be at 0 — eliminated.", "Com só 1 Beer você ainda estaria em 0 — eliminado.")
      ], 6],
      [t("A Barrel saves you", "Um Barrel salva você"), [
        t("You are targeted by a BANG! and have a Barrel.", "Você é alvo de um BANG! e tem um Barrel."),
        t("You flip the top card of the deck onto the discard pile: 4 of Hearts. The BANG! is cancelled.", "Você vira a carta do topo do baralho na pilha de descarte: 4 de Copas. O BANG! é cancelado."),
        t("Any other suit: the Barrel fails, but you could still play a Missed!.", "Outro naipe: o Barrel falha, mas você ainda poderia jogar um Missed!.")
      ], 9],
      [t("Saloon reads two lines", "O Saloon tem duas linhas"), [
        t("Line 1: regain one life point — all the other players.", "Linha 1: recuperar um ponto de vida — todos os outros jogadores."),
        t("Line 2: you regain one life point.", "Linha 2: você recupera um ponto de vida."),
        t("Result: everyone in play regains 1. It cannot save you from your last life point.", "Resultado: todos em jogo recuperam 1. Não salva você do último ponto de vida.")
      ], 6],
      [t("Outlaws gone, Renegade alive", "Foras da lei fora, Renegado vivo"), [
        t("All the Outlaws are eliminated but the Renegade is still in play.", "Todos os Foras da lei foram eliminados, mas o Renegado ainda está em jogo."),
        t("The game continues: the Renegade faces the Sheriff's side alone.", "A partida continua: o Renegado enfrenta sozinho o lado do Xerife.")
      ], 4]
    ];
    if (roles().deputy > 0) {
      examples.push([t("Outlaws win from the grave", "Foras da lei vencem do túmulo"), [
        t("All Outlaws are dead; a Deputy and the Renegade are alive.", "Todos os Foras da lei estão mortos; um Vice e o Renegado estão vivos."),
        t("The Sheriff is killed. The Renegade is not the only one alive, so the Outlaws win.", "O Xerife é morto. O Renegado não é o único vivo, então os Foras da lei vencem.")
      ], 4]);
    }
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), sectionIndex("examples"), [...new Set(examples.map((example) => example[2]))].sort((a, b) => a - b))}
      <div class="example-grid">${examples.map(([title, items, page], index) => `
        <article class="example-card">
          <span class="card-number">${String(index + 1).padStart(2, "0")}</span>
          <h3>${title}</h3>
          ${lineList(items)}
          <div class="example-source"><span>${t("From the rulebook's examples", "Dos exemplos do manual")}</span>${referenceLink(page)}</div>
        </article>`).join("")}</div>`;
  }

  // ---------- glossary ----------

  function glossarySection() {
    const visible = [
      { term: ["Blue card / in play", "Carta azul / em jogo"], text: ["A blue-bordered card face up in front of a player. Its effect lasts until it is discarded or removed.", "Carta de borda azul virada para cima diante de um jogador. O efeito dura até ela ser descartada ou removida."], page: 3 },
      { term: ["Brown card", "Carta marrom"], text: ["A brown-bordered card: play it into the discard pile and apply its effect at once.", "Carta de borda marrom: jogue-a na pilha de descarte e aplique o efeito na hora."], page: 3 },
      { term: ["Colt .45", "Colt .45"], text: ["The revolver printed on every board: range 1. It is never lost; a weapon card covers it.", "O revólver impresso em todo tabuleiro: alcance 1. Nunca se perde; uma carta de arma o cobre."], page: 5 },
      { term: ["Copy", "Cópia"], text: ["Two cards are copies if they have the same name. You may not have two copies in play.", "Duas cartas são cópias se têm o mesmo nome. Você não pode ter duas cópias em jogo."], page: 3 },
      { term: ["Distance", "Distância"], text: ["Fewest places between two players either way around, plus Mustang, minus Scope.", "Menor número de lugares entre dois jogadores por qualquer lado, mais Mustang, menos Scope."], page: 4 },
      { term: ["“Draw!”", "“Saque!”"], text: ["Flip the top card of the deck, discard it and compare its lower-left poker symbol with the card being checked.", "Vire a carta do topo do baralho, descarte-a e compare o símbolo de pôquer no canto inferior esquerdo com a carta testada."], page: 8 },
      { term: ["Eliminated", "Eliminado"], text: ["Out of the game after losing your last life point: reveal your role and discard every card.", "Fora da partida após perder o último ponto de vida: revele seu papel e descarte todas as cartas."], page: 4 },
      { term: ["Hand-size limit", "Limite de mão"], text: ["At the end of your turn you may hold as many cards as your current life points.", "No fim do seu turno você pode ter tantas cartas quantos forem seus pontos de vida atuais."], page: 3 },
      { term: ["Lethal hit", "Golpe letal"], text: ["A hit that takes away your last life point. Only then may you play Beer out of turn.", "Um golpe que tira seu último ponto de vida. Só então você pode jogar Beer fora do turno."], page: 6 },
      { term: ["Life points", "Pontos de vida"], text: ["Your bullets: how many hits you can take. Never above your starting amount.", "Suas balas: quantos golpes você aguenta. Nunca acima do valor inicial."], page: 2 },
      { term: ["Range / reachable distance", "Alcance / distância alcançável"], text: ["The number in your weapon's sight (Colt .45 = 1): the farthest player your BANG! can hit.", "O número na mira da sua arma (Colt .45 = 1): o jogador mais distante que seu BANG! atinge."], page: 5 },
      { term: ["Weapon", "Arma"], text: ["Blue card with no bullet holes, black-and-white picture and a number in a sight. Only one in play.", "Carta azul sem buracos de bala, com imagem em preto e branco e um número numa mira. Só uma em jogo."], page: 5 }
    ];
    if (simple()) {
      visible.push({ term: ["Book symbol", "Símbolo do livro"], text: ["Marks the cards removed for a simplified first game.", "Marca as cartas retiradas numa primeira partida simplificada."], page: 2 });
    }
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].replace(/[“”]/g, "").localeCompare(b.term[lang].replace(/[“”]/g, ""), state.language));
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
    document.body.classList.add("theme-bang");
    document.documentElement.lang = state.language;
    document.title = t("BANG! — Field Manual", "BANG! — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for BANG!: 4–7 players, secret roles, a match-filtered setup checklist, quick reference, every card and character explained.",
        "Regras interativas bilíngues de BANG!: 4–7 jogadores, papéis secretos, lista de preparação filtrada, referência rápida, todas as cartas e personagens explicados."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook · fourth edition", "Livro interativo · quarta edição")}</p>
          <h1>BANG!</h1>
          <p class="hero-intro">${t(
            "A Spaghetti-Western shootout. The Sheriff is everyone's target; hidden Deputies protect him, Outlaws want him dead and a lone Renegade wants to be the last one standing. Nobody but the Sheriff knows who is on whose side.",
            "Um tiroteio de faroeste espaguete. O Xerife é o alvo de todos; Vices escondidos o protegem, Foras da lei o querem morto e um Renegado solitário quer ser o último de pé. Ninguém além do Xerife sabe quem está de que lado."
          )}</p>
          <div class="hero-meta"><span>${t("4–7 players", "4–7 jogadores")}</span><span>${t("Ages 8+", "8+ anos")}</span><span>${t("Hidden roles · cards", "Papéis secretos · cartas")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/bang.webp" alt="${t("First page of the BANG! rulebook", "Primeira página do manual de BANG!")}" fetchpriority="high"><figcaption>${t("Rulebook first page · game by Emiliano Sciarra, art by Alessandro Pierangelini", "Primeira página do manual · jogo de Emiliano Sciarra, arte de Alessandro Pierangelini")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("The saloon", "O saloon")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column bg-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied BANG! rulebook (daVinci Editrice, fourth edition): the base game for 4–7 players, the simplified first game and the rules for playing several games in a row. Dodge City and other expansions are not covered. Points marked “Guide's reading” are interpretations where the rulebook is silent. Page links use the printed page numbers.",
            "Este guia cobre o manual fornecido de BANG! (daVinci Editrice, quarta edição): o jogo base para 4–7 jogadores, a primeira partida simplificada e as regras para jogar várias partidas seguidas. Dodge City e outras expansões não são cobertas. Pontos marcados como “Leitura do guia” são interpretações onde o manual é omisso. Os links de página usam a numeração impressa."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${rolesSection()}</section>
          <section class="rule-section">${turnSection()}</section>
          <section class="rule-section">${distanceSection()}</section>
          <section class="rule-section">${cardsSection()}</section>
          <section class="rule-section">${charactersSection()}</section>
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the BANG! rulebook (fourth edition). Game idea: Emiliano Sciarra; development: Roberto Corbelli, Domenico Di Giorgio; art: Alessandro Pierangelini. © daVinci Editrice S.r.l. (dV Giochi).",
        "Guia pessoal de consulta baseado no manual de BANG! (quarta edição). Ideia do jogo: Emiliano Sciarra; desenvolvimento: Roberto Corbelli, Domenico Di Giorgio; arte: Alessandro Pierangelini. © daVinci Editrice S.r.l. (dV Giochi)."
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
      root.querySelector(".bg-page")?.prepend(notice);
    }
    notice.textContent = storageNoticeText();
  }

  const OPTION_INPUTS = {
    players: PLAYER_COUNTS,
    deck: DECKS,
    sheriff: SHERIFF_MODES,
    characters: CHARACTER_MODES
  };

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !root || !root.contains(target)) {
      return;
    }
    const option = Object.keys(OPTION_INPUTS).find((key) => target.dataset[key] !== undefined);
    if (option && target.type === "radio") {
      const value = target.dataset[option];
      if (OPTION_INPUTS[option].includes(value) && value !== state[option]) {
        const before = signature();
        state = normalizePreferences({ ...state, [option]: value });
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

  window.Bang = { renderInto, onClick, onChange };
})();
