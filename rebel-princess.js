(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.rebel-princess.v1";
  const SETUP_KEY = "field-manual.rebel-princess.setup.v1";
  const MANUAL_FILE = "rebel-princess_core.pdf";
  const ASSETS = "assets/rebel-princess/";
  const ICONS = `${ASSETS}icons/`;
  const ART = `${ASSETS}art/`;
  // The supplied rulebook (Bezier Games, 2025) is a 13-page scan without a text layer. PDF 1 is the
  // cover, PDF 13 the credits; PDF 2–12 are two-page spreads, so printed page p sits on PDF page
  // floor(p / 2) + 1: PDF 2 = p. 2–3 story & Components, PDF 3 = p. 4–5 Setup, PDF 4 = p. 6–7
  // Sequence of Play, PDF 5 = p. 8–9 Playing a Trick / Rebel of the Ball, PDF 6 = p. 10–11 Princess
  // power use / Scoring, PDF 7 = p. 12–13 trick example / End of the Game, PDF 8 = p. 14–15 Round
  // Cards, PDF 9–11 = p. 16–20 Round cards a–t, PDF 11–12 = p. 21–23 Princess Cards.
  // Every link and "p." reference in this guide uses the PDF page number.
  // No expansions. Match options: players (3–6, changes the deck and the Princess draft), length
  // (5 rounds or the optional shortened 3 rounds), the Round-card set (the recommended first-game set
  // a–e, only with 5 rounds, or your own/random choice) and whether Princess powers are ignored in the
  // first round(s). Players, length and Round-card set change the setup, so they form the signature.
  const PLAYERS = [3, 4, 5, 6];
  const ROUNDS = [5, 3];
  const ROUND_SETS = ["first", "choice"];
  const POWERS = ["on", "learning"];
  const FIRST_GAME = ["a", "b", "c", "d", "e"];
  const DECK = {
    3: { cards: 36, hand: 12, princes: 9, numbers: "2–10" },
    4: { cards: 40, hand: 10, princes: 10, numbers: "1–10" },
    5: { cards: 40, hand: 8, princes: 10, numbers: "1–10" },
    6: { cards: 48, hand: 8, princes: 12, numbers: "1–12" }
  };
  const defaults = { language: "pt-BR", players: 4, rounds: 5, roundSet: "first", powers: "on" };
  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------

  function normalizePreferences(saved) {
    const players = Number(saved?.players);
    const rounds = Number(saved?.rounds);
    const next = {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      players: PLAYERS.includes(players) ? players : defaults.players,
      rounds: ROUNDS.includes(rounds) ? rounds : defaults.rounds,
      roundSet: ROUND_SETS.includes(saved?.roundSet) ? saved.roundSet : defaults.roundSet,
      powers: POWERS.includes(saved?.powers) ? saved.powers : defaults.powers
    };
    // The recommended first-game set has exactly 5 cards, so it only exists for the 5-round game.
    if (next.rounds === 3) {
      next.roundSet = "choice";
    }
    return next;
  }

  function signature(source = state) {
    return `p${source.players}-r${source.rounds}-${source.roundSet}`;
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Rebel Princess preferences.", error);
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
      console.error("Could not read Rebel Princess setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Rebel Princess preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Rebel Princess setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function manualUrl(page) {
    const script = document.querySelector('script[src*="rebel-princess.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${MANUAL_FILE}`, baseUrl).href}#page=${page}`;
  }

  function referenceLink(page) {
    return `<a class="source-link" href="${manualUrl(page)}" target="_blank" rel="noreferrer">${t(`Rules PDF p. ${page} ↗`, `Regras PDF p. ${page} ↗`)}</a>`;
  }

  function sectionHeading(id, title, index, pages) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("THE ROYAL BALL", "O BAILE REAL")} / ${index}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="rp-section-references">${pages.map(referenceLink).join("")}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
  }

  function glyphLabel(name) {
    return {
      "suit-queen": t("Queens suit", "Naipe de Rainhas"),
      "suit-prince": t("Princes suit", "Naipe de Príncipes"),
      "suit-fairy": t("Fairies suit", "Naipe de Fadas"),
      "suit-pet": t("Pets suit", "Naipe de Bichos"),
      proposal: t("Marriage proposal", "Pedido de casamento"),
      "proposal-mark": t("Proposal mark (below the number of cards that add proposals)", "Marca de pedido (abaixo do número das cartas que somam pedidos)"),
      hourglass: t("Black hourglass (final-round Round card)", "Ampulheta preta (carta de Rodada para a rodada final)"),
      "pass-left": t("Pass to the left", "Passar para a esquerda"),
      "pass-right": t("Pass to the right", "Passar para a direita")
    }[name] || name;
  }

  function glyph(name) {
    const label = glyphLabel(name);
    return `<img class="rp-glyph" src="${ICONS}${name}.webp" alt="${label}" title="${label}">`;
  }

  function iconCard(file, bodyEn, bodyPt, pages) {
    const title = glyphLabel(file);
    const list = Array.isArray(pages) ? pages : [pages];
    return `
      <article class="icon-card">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}.webp" alt="${title}"></span>
        <div><strong>${title}</strong><p>${t(bodyEn, bodyPt)}</p>${list.map(referenceLink).join(" ")}</div>
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

  function figure(file, alt) {
    return `<figure class="rp-art"><img src="${ART}${file}.webp" alt="${alt}" loading="lazy"><figcaption>${alt}</figcaption></figure>`;
  }

  function interpretation(en, pt) {
    return `<span class="rp-interpretation">${t("Guide's reading", "Leitura do guia")}</span> ${t(en, pt)}`;
  }

  function deck(players = state.players) {
    return DECK[players];
  }

  function playersLabel(players = state.players) {
    return t(`${players} players`, `${players} jogadores`);
  }

  function removedText(players = state.players) {
    return {
      3: t("remove all the 1s, 11s and 12s (12 cards)", "retire todos os 1, 11 e 12 (12 cartas)"),
      4: t("remove all the 11s and 12s (8 cards)", "retire todos os 11 e 12 (8 cartas)"),
      5: t("remove all the 11s and 12s (8 cards)", "retire todos os 11 e 12 (8 cartas)"),
      6: t("use all 48 suited cards", "use as 48 cartas de naipe")
    }[players];
  }

  function powersOn() {
    return state.powers === "on";
  }

  function firstGame() {
    return state.roundSet === "first";
  }

  function roundsInMatch() {
    return firstGame() ? ROUND_CARDS.filter((card) => FIRST_GAME.includes(card.id)) : ROUND_CARDS;
  }

  // ---------- Round cards (PDF 8–11) ----------

  const ROUND_CARDS = [
    {
      id: "a", en: "Once Upon a Time", pt: "Era uma Vez", page: 9, pass: ["3 to the right", "3 para a direita"],
      short: ["No special rules.", "Sem regras especiais."],
      rules: [["This round has no special rules.", "Esta rodada não tem regras especiais."]]
    },
    {
      id: "b", en: "Late to the Ball", pt: "Atrasada para o Baile", page: 9, pass: ["1 to the right", "1 para a direita"],
      short: ["After passing, hide 1 card under your Princess; it is your card for the last trick.", "Depois de passar, esconda 1 carta sob a sua Princesa; ela é a sua carta da última vaza."],
      rules: [
        ["After exchanging cards and before the first trick, each player places 1 card from their hand face down underneath their Princess card (so it is not mixed up with other cards).", "Depois da troca de cartas e antes da primeira vaza, cada jogador coloca 1 carta da mão virada para baixo embaixo da sua carta de Princesa (para não confundi-la com outras cartas)."],
        ["That card is played in the last trick of the round, following the normal rules.", "Essa carta é jogada na última vaza da rodada, seguindo as regras normais."],
        ["Sleeping Beauty and Scheherazade may not use their powers on the last card of this round.", "A Bela Adormecida e Sherazade não podem usar seus poderes na última carta desta rodada."]
      ],
      readings: [["in the last trick the hidden card is the only card you hold, so you simply play it; if it is not of the led suit, you are void.", "na última vaza a carta escondida é a única que você tem, então você simplesmente a joga; se ela não for do naipe puxado, você está sem o naipe."]]
    },
    {
      id: "c", en: "Magic Beans", pt: "Feijões Mágicos", page: 9, pass: null,
      short: ["Play only the highest or lowest card of the led suit (or of another suit when void).", "Jogue só a carta mais alta ou mais baixa do naipe puxado (ou de outro naipe, se estiver sem ele)."],
      rules: [["Each player, including the leading player, may only play the highest or the lowest card of the led suit — or, if void, the highest or lowest card of another suit.", "Cada jogador, inclusive quem puxa a vaza, só pode jogar a carta mais alta ou a mais baixa do naipe puxado — ou, se estiver sem esse naipe, a mais alta ou a mais baixa de outro naipe."]],
      readings: [["the leader has no led suit yet: they choose a suit they may lead and play its highest or lowest card.", "quem puxa ainda não tem naipe puxado: escolhe um naipe que possa puxar e joga a carta mais alta ou mais baixa dele."]]
    },
    {
      id: "d", en: "Three Times a Lady", pt: "Três Vezes Dama", page: 9, pass: ["3 to the right", "3 para a direita"],
      short: ["Each 3 is −3 proposals; the 3 of Princes is −2.", "Cada 3 vale −3 pedidos; o 3 de Príncipes vale −2."],
      rules: [
        ["Each “3” card you won is worth −3 proposals.", "Cada carta “3” que você ganhou vale −3 pedidos."],
        ["The 3 of Princes is worth −2 proposals (its 1 Prince proposal plus −3).", "O 3 de Príncipes vale −2 pedidos (o seu 1 pedido de Príncipe mais −3)."],
        ["In this round you can score a negative number of proposals.", "Nesta rodada você pode marcar um número negativo de pedidos."]
      ]
    },
    {
      id: "e", en: "Arranged Marriage", pt: "Casamento Arranjado", page: 9, pass: ["1 in each direction (1 left and 1 right)", "1 para cada lado (1 à esquerda e 1 à direita)"], final: true,
      short: ["No tricks at the end of the round → +5 proposals.", "Nenhuma vaza no fim da rodada → +5 pedidos."],
      rules: [["If you have no tricks at the end of the round, you receive 5 proposals in addition to any other proposals taken this round.", "Se você não tiver nenhuma vaza no fim da rodada, recebe 5 pedidos além de quaisquer outros pedidos recebidos nesta rodada."]]
    },
    {
      id: "f", en: "Royal Decree", pt: "Decreto Real", page: 9, pass: null,
      short: ["Queens are trump: the highest Queen in the trick wins.", "Rainhas são trunfo: a Rainha mais alta da vaza vence."],
      rules: [
        ["The highest card in the Queens suit always wins the trick (Queens are “trump”).", "A carta mais alta do naipe de Rainhas sempre vence a vaza (Rainhas são “trunfo”)."],
        ["If there is more than 1 Queen in the trick, the highest Queen wins.", "Se houver mais de 1 Rainha na vaza, vence a Rainha mais alta."]
      ],
      readings: [["you still must follow the led suit when you can; a Queen can only be played into another suit's trick when you are void.", "você ainda precisa seguir o naipe puxado quando puder; uma Rainha só pode entrar numa vaza de outro naipe quando você está sem o naipe."]]
    },
    {
      id: "g", en: "Always the Bridesmaid", pt: "Sempre a Dama de Honra", page: 9, pass: null,
      short: ["The second-highest card of the led suit wins.", "A segunda carta mais alta do naipe puxado vence."],
      rules: [
        ["The second-highest card of the led suit wins the trick.", "A segunda carta mais alta do naipe puxado vence a vaza."],
        ["If all the other players are void (only the leader's card is of the led suit), the leading player wins the trick.", "Se todos os outros jogadores estiverem sem o naipe (só a carta de quem puxou é do naipe puxado), quem puxou vence a vaza."]
      ]
    },
    {
      id: "h", en: "Crystal Clear", pt: "Claro como Cristal", page: 9, pass: null,
      short: ["Before the first trick, each player lays one whole suit face up; it is still played from there.", "Antes da primeira vaza, cada jogador expõe um naipe inteiro; ele continua sendo jogado dali."],
      rules: [
        ["After exchanging cards and before the first trick, every player chooses one of the suits in their hand (not a suit they are void in) and places all their cards of that suit face down in front of them.", "Depois da troca e antes da primeira vaza, cada jogador escolhe um dos naipes da sua mão (não um naipe que não tenha) e coloca todas as suas cartas desse naipe viradas para baixo à sua frente."],
        ["Once everyone has placed their cards, they are turned face up simultaneously; the round is played with those cards in plain sight.", "Quando todos tiverem colocado as cartas, elas são viradas para cima ao mesmo tempo; a rodada é jogada com essas cartas à vista."],
        ["The revealed cards are still part of your hand and are played as usual.", "As cartas reveladas continuam fazendo parte da sua mão e são jogadas normalmente."],
        ["The Ice Princess and Scheherazade cannot take these face-up cards as “random” cards with their powers.", "A Princesa do Gelo e Sherazade não podem pegar essas cartas à vista como cartas “aleatórias” com seus poderes."],
        ["If you receive a card of that suit during the round, keep it hidden in your hand.", "Se você receber uma carta desse naipe durante a rodada, mantenha-a escondida na mão."]
      ]
    },
    {
      id: "i", en: "Masquerade Ball", pt: "Baile de Máscaras", page: 9, pass: null,
      short: ["Everyone except the leader plays face down; flip all to find the winner.", "Todos, menos quem puxa, jogam virados para baixo; vire tudo para achar o vencedor."],
      rules: [
        ["Everyone except the player who leads plays their card face down.", "Todos, exceto quem puxa a vaza, jogam a carta virada para baixo."],
        ["When everyone has played, flip the cards face up to determine the winner of the trick.", "Quando todos tiverem jogado, vire as cartas para cima para definir quem vence a vaza."],
        ["If Snow White uses her power, she must announce it (but does not reveal the value of the card she played).", "Se a Branca de Neve usar o poder, ela precisa anunciá-lo (mas não revela o valor da carta que jogou)."],
        ["If Mulan uses her power, she does so after all the cards have been turned face up.", "Se Mulan usar o poder, ela o faz depois que todas as cartas forem viradas para cima."]
      ],
      readings: [["the follow-suit rule still applies to face-down cards. If a flipped card broke it, that player takes it back and plays a legal card face up (the rulebook gives no penalty).", "a regra de seguir o naipe continua valendo para as cartas viradas para baixo. Se uma carta virada a quebrou, esse jogador a pega de volta e joga uma carta válida virada para cima (o livro não dá penalidade)."]]
    },
    {
      id: "j", en: "Pet's Revenge", pt: "A Vingança dos Bichos", page: 9, pass: null,
      short: ["Each Pet you won is +1 proposal (the Frog is 6).", "Cada Bicho que você ganhou é +1 pedido (o Sapo vale 6)."],
      rules: [["At the end of the round, Pet cards also score 1 proposal each — so the Frog is now worth 6.", "No fim da rodada, as cartas de Bichos também valem 1 pedido cada — então o Sapo passa a valer 6."]]
    },
    {
      id: "k", en: "Musical Chairs", pt: "Dança das Cadeiras", page: 9, pass: null,
      short: ["After each trick, everyone passes 1 card face down to the right.", "Depois de cada vaza, todos passam 1 carta virada para baixo para a direita."],
      rules: [
        ["After each trick, every player passes a card face down from their hand to the player on their right, simultaneously.", "Depois de cada vaza, cada jogador passa uma carta da mão, virada para baixo, para o jogador da direita, ao mesmo tempo."],
        ["Any “before the trick” Princess powers happen after the cards have been passed.", "Poderes de Princesa que acontecem “antes da vaza” ocorrem depois que as cartas forem passadas."]
      ],
      readings: [["after the last trick nobody has cards left, so there is nothing to pass.", "depois da última vaza ninguém tem cartas, então não há o que passar."]]
    },
    {
      id: "l", en: "Sisterhood", pt: "Irmandade", page: 10, pass: null,
      short: ["The led-suit card furthest from the leader's number wins (ties: the higher number).", "Vence a carta do naipe puxado mais distante do número de quem puxou (empate: o número maior)."],
      rules: [
        ["The card of the led suit whose number is furthest from the starting (led) number wins the trick.", "Vence a vaza a carta do naipe puxado cujo número está mais distante do número inicial (o da carta puxada)."],
        ["If all the other cards are void (no one followed suit), the card value furthest from the starting number wins, whatever its suit.", "Se todas as outras cartas forem de jogadores sem o naipe (ninguém seguiu), vence o valor mais distante do número inicial, seja qual for o naipe."],
        ["In case of a tie (one card as far above as another is below), the higher number wins.", "Em caso de empate (uma carta tão acima quanto outra está abaixo), vence o número maior."]
      ],
      readings: [["the leader's own card counts at distance 0, so it wins only if nobody else's card is at a greater distance; if two cards share the same distance and the same number (possible only when everyone was void), the one played first wins — the card says “the first highest number”.", "a própria carta de quem puxou está a distância 0, então só vence se nenhuma outra estiver mais longe; se duas cartas tiverem a mesma distância e o mesmo número (só possível quando todos estavam sem o naipe), vence a jogada primeiro — a carta diz “o primeiro número mais alto”."]]
    },
    {
      id: "m", en: "After Party", pt: "Pós-Festa", page: 10, pass: null,
      short: ["Split your hand in halves; play one half, then pick up and play the other.", "Divida a mão ao meio; jogue uma metade, depois pegue e jogue a outra."],
      rules: [
        ["Every player divides their hand into 2 equal halves and sets 1 half face down under their Princess card.", "Cada jogador divide a mão em 2 metades iguais e coloca 1 metade virada para baixo sob a sua carta de Princesa."],
        ["First play all the cards in your hand; then put the face-down cards into your hand and play the second half of the round.", "Primeiro jogue todas as cartas da mão; depois pegue as cartas viradas para baixo e jogue a segunda metade da rodada."],
        ["Princess powers only affect the active hand's cards, not the face-down cards.", "Os poderes de Princesa só afetam as cartas da mão ativa, não as cartas viradas para baixo."],
        ["As normal, each Princess power can only be used once this round.", "Como de costume, cada poder de Princesa só pode ser usado uma vez nesta rodada."]
      ],
      readings: [["divide your hand after the exchange of cards, before the first trick.", "divida a mão depois da troca de cartas, antes da primeira vaza."]]
    },
    {
      id: "n", en: "Late for a Very Important Date", pt: "Atrasada para um Compromisso Importante", page: 10, pass: null,
      short: ["Your last 3 cards are kept and scored as won cards.", "As suas 3 últimas cartas ficam com você e contam como cartas ganhas."],
      rules: [["The last 3 cards in a player's hand are kept and scored as won trick cards.", "As 3 últimas cartas na mão de cada jogador ficam com ele e são pontuadas como cartas ganhas em vazas."]],
      readings: [["stop playing tricks when every player has 3 cards left; add those 3 cards to your won cards for all scoring, including the Rebel of the Ball check.", "pare de jogar vazas quando cada jogador tiver 3 cartas; junte essas 3 cartas às suas cartas ganhas para toda a pontuação, inclusive a verificação da Rebelde do Baile."]]
    },
    {
      id: "o", en: "Wedding Gift", pt: "Presente de Casamento", page: 10, pass: ["1 in each direction (1 left and 1 right)", "1 para cada lado (1 à esquerda e 1 à direita)"], final: true,
      short: ["Before each trick, everyone adds 1 card face down to a gift pile for the winner. No Rebel of the Ball.", "Antes de cada vaza, todos põem 1 carta virada para baixo numa pilha de presente para o vencedor. Sem Rebelde do Baile."],
      rules: [
        ["Before each trick, every player places 1 card from their hand face down in a pile that will be given to the winner of the trick.", "Antes de cada vaza, cada jogador coloca 1 carta da mão virada para baixo numa pilha que será dada a quem vencer a vaza."],
        ["Therefore only half of the tricks are played this round.", "Por isso, só metade das vazas é jogada nesta rodada."],
        ["No player can achieve the Rebel of the Ball bonus while this Round card is active.", "Nenhum jogador pode conseguir o bônus de Rebelde do Baile enquanto esta carta de Rodada estiver ativa."],
        ["Sleeping Beauty's power is used before the cards are placed in the pile.", "O poder da Bela Adormecida é usado antes de as cartas irem para a pilha."],
        ["If Alice uses her power after winning a trick, she redistributes only the face-up cards of the trick and leaves the face-down wedding-gift cards as they are. The trick is then redone with Alice leading with any card in her hand (not a Prince if the Princes have not snuck in yet). The winner of the redone trick receives all the trick and wedding-gift cards.", "Se Alice usar o poder depois de vencer uma vaza, ela redistribui só as cartas viradas para cima da vaza e deixa as cartas de presente viradas para baixo como estão. A vaza é então refeita com Alice puxando com qualquer carta da mão (não um Príncipe se os Príncipes ainda não entraram de penetra). Quem vencer a vaza refeita recebe todas as cartas da vaza e do presente."]
      ]
    },
    {
      id: "p", en: "Haggle with the Hag", pt: "Pechinchando com a Bruxa", page: 10, pass: null,
      short: ["The trick winner may swap a shown hand card for a card from the trick (not the one they played).", "Quem vence a vaza pode trocar uma carta mostrada da mão por uma carta da vaza (não a que jogou)."],
      rules: [
        ["The player who won a trick may exchange a card from their hand, which they must show, for a card from the trick.", "Quem venceu uma vaza pode trocar uma carta da mão, que precisa mostrar, por uma carta da vaza."],
        ["The card they take back from the trick cannot be the one they just played.", "A carta que pega de volta da vaza não pode ser a que acabou de jogar."],
        ["If Mulan uses her power and wins the trick, she may exchange 2 cards: 1 that is not her played card (by this Round card) and 1 that is her played card (by Mulan's power).", "Se Mulan usar o poder e vencer a vaza, pode trocar 2 cartas: 1 que não é a carta que jogou (por esta carta de Rodada) e 1 que é a carta que jogou (pelo poder de Mulan)."]
      ]
    },
    {
      id: "q", en: "Blind Man's Bluff", pt: "Cabra-Cega", page: 10, pass: null,
      short: ["Split your hand; after playing your half, give the hidden half to the player on your right.", "Divida a mão; depois de jogar a sua metade, dê a metade escondida ao jogador da direita."],
      rules: [
        ["Every player divides their hand into 2 equal halves and sets one half aside face down under their Princess card.", "Cada jogador divide a mão em 2 metades iguais e deixa uma metade de lado, virada para baixo, sob a sua carta de Princesa."],
        ["Play the cards in your hand first; then give your face-down cards to the player on your right so that they can play them.", "Jogue primeiro as cartas da mão; depois dê as suas cartas viradas para baixo ao jogador da direita para que ele as jogue."],
        ["Princess powers only affect the active hand's cards, not the face-down cards; as normal, each power can only be used once this round.", "Os poderes de Princesa só afetam as cartas da mão ativa, não as viradas para baixo; como de costume, cada poder só pode ser usado uma vez nesta rodada."]
      ],
      readings: [["divide your hand after the exchange of cards, before the first trick; everyone hands over their hidden half at the same time, once all hands are empty.", "divida a mão depois da troca de cartas, antes da primeira vaza; todos entregam a metade escondida ao mesmo tempo, quando todas as mãos estiverem vazias."]]
    },
    {
      id: "r", en: "Poisoned Apple", pt: "Maçã Envenenada", page: 10, pass: null,
      short: ["If you are void, the card you play wins (several void: highest number; tie: played first).", "Se você estiver sem o naipe, a carta que jogar vence (vários sem: o número mais alto; empate: quem jogou primeiro)."],
      rules: [
        ["During this round, if you are void, you win the trick with the card you play.", "Durante esta rodada, se você estiver sem o naipe, vence a vaza com a carta que jogar."],
        ["If more than 1 player is void, the void player with the highest number wins.", "Se mais de 1 jogador estiver sem o naipe, vence o jogador sem o naipe com o número mais alto."],
        ["In case of ties, whoever played their card first wins the trick.", "Em caso de empate, vence quem jogou a carta primeiro."]
      ]
    },
    {
      id: "s", en: "Odds and Evens", pt: "Par ou Ímpar", page: 11, pass: ["2 to the right", "2 para a direita"],
      short: ["Follow suit and the odd/even of the led card (suit comes first).", "Siga o naipe e o par/ímpar da carta puxada (o naipe vem primeiro)."],
      rules: [
        ["In addition to following the led suit, you must play an odd or even card matching the card that started the trick.", "Além de seguir o naipe puxado, você precisa jogar uma carta par ou ímpar, igual à carta que começou a vaza."],
        ["If you cannot comply with both, following suit is still mandatory.", "Se não conseguir cumprir as duas coisas, seguir o naipe continua obrigatório."],
        ["If you are void in the suit, playing an odd or even card (matching the led card) applies again.", "Se você estiver sem o naipe, volta a valer jogar uma carta par ou ímpar (igual à carta puxada)."],
        ["If Snow White uses her power, the card she plays must follow the odds and evens rule.", "Se a Branca de Neve usar o poder, a carta que ela jogar precisa seguir a regra de par ou ímpar."],
        ["If the Pea Princess uses her power, players must follow the odds and evens rule with a card value of 5 or less; the same applies when void.", "Se a Princesa e a Ervilha usar o poder, os jogadores precisam seguir a regra de par ou ímpar com uma carta de valor 5 ou menos; o mesmo vale quando sem o naipe."],
        ["If Mulan uses her power, she does not have to follow the odds and evens rule with the swapped card; her initial play must follow it.", "Se Mulan usar o poder, ela não precisa seguir a regra de par ou ímpar com a carta trocada; a jogada inicial dela precisa segui-la."]
      ]
    },
    {
      id: "t", en: "Single Fairy", pt: "Fada Solteira", page: 11, pass: ["1 to the left", "1 para a esquerda"], final: true,
      short: ["Each Fairy you won is −1 proposal.", "Cada Fada que você ganhou é −1 pedido."],
      rules: [
        ["At the end of the round, each Fairy card you have won scores you −1 proposal.", "No fim da rodada, cada carta de Fada que você ganhou vale −1 pedido."],
        ["In this round you can score a negative number of proposals.", "Nesta rodada você pode marcar um número negativo de pedidos."]
      ]
    }
  ];

  // ---------- Princess cards (PDF 11–12) ----------

  const PRINCESSES = [
    {
      id: "alice", name: ["Alice", "Alice"], power: ["Cheshire's Challenge", "O Desafio do Gato de Cheshire"], page: 11, timing: ["After winning a trick", "Depois de vencer uma vaza"],
      lines: [
        ["Shuffle a trick you have just won that has no Frog in it, and deal its cards back randomly, one to each player's hand.", "Embaralhe uma vaza que você acabou de vencer e que não tenha o Sapo, e devolva as cartas aleatoriamente, uma para a mão de cada jogador."],
        ["If the Princes snuck in during that trick, they can still be led from that point on.", "Se os Príncipes entraram de penetra durante essa vaza, eles continuam podendo ser puxados a partir daí."]
      ],
      readings: [["the trick is then played again with Alice leading — this is how the Wedding Gift card describes it (PDF p. 10). She may not lead a Prince if the Princes have not snuck in.", "a vaza é então jogada de novo com Alice puxando — é assim que a carta Presente de Casamento descreve (PDF p. 10). Ela não pode puxar um Príncipe se os Príncipes ainda não entraram de penetra."]]
    },
    {
      id: "cinderella", name: ["Cinderella", "Cinderela"], power: ["Everything Changes at Midnight", "Tudo Muda à Meia-Noite"], page: 11, timing: ["Before a trick", "Antes de uma vaza"],
      lines: [["Reverse the hierarchy of numbers for this trick: the lowest number in the led suit wins.", "Inverta a hierarquia dos números nesta vaza: vence o número mais baixo do naipe puxado."]]
    },
    {
      id: "ice", name: ["The Ice Princess", "A Princesa do Gelo"], power: ["Freezing", "Congelamento"], page: 11, timing: ["Before a trick", "Antes de uma vaza"],
      lines: [
        ["Take 2 random cards from any one player. Give 1 back to that player and put the other face down in front of them: it is the card they must lead or play this trick.", "Pegue 2 cartas aleatórias de um jogador qualquer. Devolva 1 a esse jogador e coloque a outra virada para baixo à frente dele: é a carta que ele precisa puxar ou jogar nesta vaza."],
        ["It may be a Prince, even if the Princes have not snuck in yet.", "Pode ser um Príncipe, mesmo que os Príncipes ainda não tenham entrado de penetra."],
        ["If that player is not leading, they must play this card even if it does not follow suit (or any other condition set by a Princess power or Round card).", "Se esse jogador não for quem puxa, precisa jogar essa carta mesmo que ela não siga o naipe (nem outra condição imposta por poder de Princesa ou carta de Rodada)."],
        ["If a Prince is chosen, the Princes have snuck into the party.", "Se um Príncipe for escolhido, os Príncipes entraram de penetra na festa."]
      ]
    },
    {
      id: "mermaid", name: ["The Little Mermaid", "A Pequena Sereia"], power: ["Hypnotic Song", "Canto Hipnótico"], page: 12, timing: ["Before a trick", "Antes de uma vaza"],
      lines: [
        ["Decide which suit the player who leads the trick must play. If they do not have that suit, keep naming suits until they have one.", "Decida qual naipe quem puxa a vaza precisa jogar. Se ele não tiver esse naipe, continue nomeando naipes até acertar um que ele tenha."],
        ["Not allowed if the Ice Princess has already used her power on the leading player this trick.", "Não é permitido se a Princesa do Gelo já tiver usado o poder no jogador que puxa nesta vaza."],
        ["You may not force a Prince lead if the Princes have not been played yet, unless the leader only has Princes.", "Você não pode obrigar a puxar um Príncipe se os Príncipes ainda não foram jogados, a não ser que quem puxa só tenha Príncipes."]
      ]
    },
    {
      id: "mulan", name: ["Mulan", "Mulan"], power: ["Camouflage", "Camuflagem"], page: 12, timing: ["After the last card of a trick", "Depois da última carta de uma vaza"],
      lines: [
        ["After the last card has been played in a trick, swap the card you played for another card of the same suit from your hand.", "Depois que a última carta de uma vaza foi jogada, troque a carta que você jogou por outra do mesmo naipe da sua mão."],
        ["The Frog cannot be swapped.", "O Sapo não pode ser trocado."]
      ],
      readings: [["the swap happens before the winner is decided, so the trick is won with the swapped-in card (that is the point of Camouflage).", "a troca acontece antes de definir quem vence, então a vaza é decidida com a carta que entrou na troca (é a graça da Camuflagem)."]]
    },
    {
      id: "pea", name: ["The Pea Princess", "A Princesa e a Ervilha"], power: ["Five More Minutes!", "Só Mais Cinco Minutinhos!"], page: 12, timing: ["Before a trick", "Antes de uma vaza"],
      lines: [
        ["Declare that the other players must play a number higher than 5 if they have one.", "Declare que os outros jogadores precisam jogar um número maior que 5, se tiverem."],
        ["Players must still follow suit if their only cards of the led suit are 5 or lower.", "Os jogadores continuam precisando seguir o naipe se as únicas cartas que têm do naipe puxado forem 5 ou menos."],
        ["If the Princes have not snuck in yet and the leading player's only cards higher than 5 are Princes, that player may play a 5 or lower.", "Se os Príncipes ainda não entraram de penetra e as únicas cartas maiores que 5 de quem puxa forem Príncipes, esse jogador pode jogar um 5 ou menos."]
      ],
      readings: [["“the other players” means everyone except the Pea Princess, so the leader is bound too unless she is the leader herself.", "“os outros jogadores” são todos menos a Princesa e a Ervilha, então quem puxa também fica obrigado, a não ser que seja ela."]]
    },
    {
      id: "pocahontas", name: ["Pocahontas", "Pocahontas"], power: ["Wilderness Guide", "Guia da Natureza"], page: 12, timing: ["Before a trick", "Antes de uma vaza"],
      lines: [
        ["Choose any player to lead the trick.", "Escolha qualquer jogador para puxar a vaza."],
        ["Not allowed if the Little Mermaid has already used her power this trick.", "Não é permitido se a Pequena Sereia já tiver usado o poder nesta vaza."]
      ]
    },
    {
      id: "scheherazade", name: ["Scheherazade", "Sherazade"], power: ["Barter in the Bazaar", "Barganha no Bazar"], page: 12, timing: ["Before a trick", "Antes de uma vaza"],
      lines: [
        ["Take a card at random from any player's hand. Swap it for one of your cards, or give it back.", "Pegue uma carta aleatória da mão de qualquer jogador. Troque-a por uma das suas cartas, ou devolva-a."],
        ["Not allowed on the leading player if the Ice Princess or the Little Mermaid has already used her power this trick.", "Não é permitido no jogador que puxa se a Princesa do Gelo ou a Pequena Sereia já tiver usado o poder nesta vaza."]
      ]
    },
    {
      id: "sleeping", name: ["Sleeping Beauty", "A Bela Adormecida"], power: ["The Spindle of Fate", "O Fuso do Destino"], page: 12, timing: ["Before a trick", "Antes de uma vaza"],
      lines: [
        ["Every player, including Sleeping Beauty, gives her a card from their hand to review; she may see which card came from which player.", "Cada jogador, inclusive a Bela Adormecida, entrega a ela uma carta da mão para análise; ela pode ver qual carta veio de qual jogador."],
        ["She keeps one card and deals the rest out to the other players, one each, deciding who receives which card.", "Ela fica com uma carta e distribui o resto aos outros jogadores, uma para cada, decidindo quem recebe qual."],
        ["Not allowed if the Little Mermaid or the Ice Princess has already used her power this trick.", "Não é permitido se a Pequena Sereia ou a Princesa do Gelo já tiver usado o poder nesta vaza."]
      ]
    },
    {
      id: "snow", name: ["Snow White", "Branca de Neve"], power: ["Seven Dwarfs", "Sete Anões"], page: 12, timing: ["When you play a card", "Quando você joga uma carta"],
      lines: [
        ["Play a 7 or lower as a zero.", "Jogue um 7 ou menos valendo zero."],
        ["If the Pea Princess has used her power this trick, Snow White may play a 6 or 7 and declare it to be a zero.", "Se a Princesa e a Ervilha usou o poder nesta vaza, a Branca de Neve pode jogar um 6 ou 7 e declarar que vale zero."]
      ],
      readings: [["the card keeps its suit, so it must still follow suit as usual; the zero only counts for winning this trick — a Prince played this way still scores its proposal.", "a carta mantém o naipe, então continua precisando seguir o naipe normalmente; o zero só vale para vencer esta vaza — um Príncipe jogado assim continua valendo o seu pedido."]]
    }
  ];

  // ---------- header ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["victory", t("End & winning", "Fim e vitória")],
      ["rounds", t("Rounds", "Rodadas")],
      ["tricks", t("Playing a trick", "Jogando uma vaza")],
      ["scoring", t("Scoring proposals", "Contando pedidos")],
      ["princesses", t("Princess powers", "Poderes das Princesas")],
      ["round-cards", t("Round cards", "Cartas de Rodada")],
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
          <span class="brand-mark" aria-hidden="true">RP</span>
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
      <label class="rp-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" ${dataAttr} ${checked ? "checked" : ""}>
        <span class="rp-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function playerChoiceText(players) {
    const info = DECK[players];
    const draft = players === 6
      ? t("Princesses: 5 players get 2 each and keep 1; the 6th player chooses from the 5 put back in the centre.", "Princesas: 5 jogadores recebem 2 cada e ficam com 1; o 6º jogador escolhe entre as 5 devolvidas ao centro.")
      : t(`Princesses: each player gets 2 and keeps 1 (${players * 2} of the 10 are dealt).`, `Princesas: cada jogador recebe 2 e fica com 1 (${players * 2} das 10 são distribuídas).`);
    return `${t(`Deck: ${removedText(players)} — ${info.cards} cards, ${info.hand} per player. ${info.princes} Princes in play (${info.numbers}).`, `Baralho: ${removedText(players)} — ${info.cards} cartas, ${info.hand} por jogador. ${info.princes} Príncipes em jogo (${info.numbers}).`)} ${draft}`;
  }

  function roundsName(value = state.rounds) {
    return value === 5 ? t("Standard · 5 rounds", "Padrão · 5 rodadas") : t("Shortened · 3 rounds", "Curta · 3 rodadas");
  }

  function roundSetName(value = state.roundSet) {
    return value === "first" ? t("First game · a, b, c, d, e", "Primeira partida · a, b, c, d, e") : t("Your choice or random", "Escolha livre ou sorteio");
  }

  function powersName(value = state.powers) {
    return value === "on" ? t("Powers from round 1", "Poderes desde a rodada 1") : t("Learning rounds without powers", "Rodadas de aprendizado sem poderes");
  }

  function matchConfiguration() {
    return `
      <section class="controls-panel rp-config" id="build-match" aria-labelledby="rp-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="rp-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "The supplied rulebook has no expansions. Choose the number of players, the length of the game, which Round cards you use and whether you play with the Princess powers from the start. Changing the players, the length or the Round-card set clears the setup checklist; the Princess-power option and the language do not.",
              "O livro de regras fornecido não tem expansões. Escolha o número de jogadores, a duração da partida, quais cartas de Rodada usar e se as Princesas usam poderes desde o início. Mudar os jogadores, a duração ou o conjunto de cartas de Rodada limpa a lista da preparação; a opção dos poderes e o idioma não."
            )}</p>
          </div>
        </div>
        <fieldset class="rp-choice-group">
          <legend>${t("Players · selected:", "Jogadores · selecionado:")} <span>${playersLabel()}</span></legend>
          <p class="rp-choice-intro">${t("The rulebook gives deck compositions for 3, 4, 5 and 6 players; it has no 2-player rules.", "O livro dá a composição do baralho para 3, 4, 5 e 6 jogadores; não tem regras para 2 jogadores.")} ${referenceLink(3)}</p>
          <div class="rp-choice-grid rp-choice-grid-players">
            ${PLAYERS.map((players) => choiceCard("rp-players", players, `data-players="${players}"`, state.players === players, playersLabel(players), playerChoiceText(players))).join("")}
          </div>
        </fieldset>
        <fieldset class="rp-choice-group">
          <legend>${t("Game length · selected:", "Duração · selecionado:")} <span>${roundsName()}</span></legend>
          <p class="rp-choice-intro">${t("Setup step 4a: the shortened game is an optional rule.", "Passo 4a da preparação: a partida curta é uma regra opcional.")} ${referenceLink(3)}</p>
          <div class="rp-choice-grid">
            ${choiceCard("rp-rounds", 5, 'data-rounds="5"', state.rounds === 5, roundsName(5), t("The standard game: 5 Round cards in a row, 5 rounds. After the 5th round the party is over.", "A partida padrão: 5 cartas de Rodada em fila, 5 rodadas. Depois da 5ª rodada a festa acaba."))}
            ${choiceCard("rp-rounds", 3, 'data-rounds="3"', state.rounds === 3, roundsName(3), t("Optional shortened play if 5 rounds feel too long: only 3 Round cards, 3 rounds. The first-game set (5 fixed cards) is not available; you choose or draw 3 cards.", "Partida curta opcional, se 5 rodadas parecerem demais: só 3 cartas de Rodada, 3 rodadas. O conjunto da primeira partida (5 cartas fixas) não fica disponível; você escolhe ou sorteia 3 cartas."))}
          </div>
        </fieldset>
        <fieldset class="rp-choice-group">
          <legend>${t("Round cards · selected:", "Cartas de Rodada · selecionado:")} <span>${roundSetName()}</span></legend>
          <p class="rp-choice-intro">${t(`Each round is governed by one Round card; you use ${state.rounds} of the 20 (a–t). Cards with a black hourglass ${glyph("hourglass")} and a darker back are recommended only for the final round.`, `Cada rodada é governada por uma carta de Rodada; você usa ${state.rounds} das 20 (a–t). Cartas com ampulheta preta ${glyph("hourglass")} e verso mais escuro são recomendadas só para a rodada final.`)} ${referenceLink(3)} ${referenceLink(8)}</p>
          <div class="rp-choice-grid">
            ${state.rounds === 5 ? choiceCard("rp-roundset", "first", 'data-roundset="first"', state.roundSet === "first", roundSetName("first"), t("Recommended for your first game: Round cards a, b, c, d and e (Once Upon a Time, Late to the Ball, Magic Beans, Three Times a Lady, Arranged Marriage). This guide then shows only those 5 cards.", "Recomendado para a primeira partida: cartas de Rodada a, b, c, d e e (Era uma Vez, Atrasada para o Baile, Feijões Mágicos, Três Vezes Dama, Casamento Arranjado). O guia mostra então só essas 5 cartas.")) : ""}
            ${choiceCard("rp-roundset", "choice", 'data-roundset="choice"', state.roundSet === "choice", roundSetName("choice"), t(`Choose and arrange any ${state.rounds} of the 20 Round cards, or draw them at random, keeping black-hourglass cards for the last round. This guide then shows all 20 cards, since any of them may be in play.`, `Escolha e ordene ${state.rounds} das 20 cartas de Rodada como quiser, ou sorteie-as, deixando cartas com ampulheta preta para a última rodada. O guia mostra então as 20 cartas, pois qualquer uma pode estar em jogo.`))}
          </div>
        </fieldset>
        <fieldset class="rp-choice-group">
          <legend>${t("Princess powers · selected:", "Poderes das Princesas · selecionado:")} <span>${powersName()}</span></legend>
          <p class="rp-choice-intro">${t("The rulebook allows ignoring the powers in your first round(s) to learn the basics. Princesses are dealt either way.", "O livro permite ignorar os poderes nas primeiras rodadas para aprender o básico. As Princesas são distribuídas de qualquer jeito.")} ${referenceLink(6)}</p>
          <div class="rp-choice-grid">
            ${choiceCard("rp-powers", "on", 'data-powers="on"', state.powers === "on", powersName("on"), t("Each player may use their Princess's power once per round from the very first round.", "Cada jogador pode usar o poder da sua Princesa uma vez por rodada desde a primeira rodada."))}
            ${choiceCard("rp-powers", "learning", 'data-powers="learning"', state.powers === "learning", powersName("learning"), t("Agree before play how many opening rounds (the rulebook just says “your first round(s)”) are played with no powers at all; from the next round on, powers are used normally. Does not change the setup.", "Combinem antes de jogar quantas rodadas iniciais (o livro só diz “as primeiras rodadas”) serão jogadas sem nenhum poder; da rodada seguinte em diante, os poderes são usados normalmente. Não muda a preparação."))}
          </div>
        </fieldset>
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function princessDraftItems() {
    const players = state.players;
    if (players === 6) {
      return [
        t("Shuffle the 10 Princess cards. Choose which player will be the 6th player; deal 2 Princess cards to each of the other 5 players.", "Embaralhe as 10 cartas de Princesa. Escolham qual jogador será o 6º jogador; distribua 2 cartas de Princesa para cada um dos outros 5 jogadores."),
        t("Each of those 5 players chooses 1 of their 2 Princesses, places it face down in front of them and places the other face down in the centre of the table.", "Cada um desses 5 jogadores escolhe 1 das suas 2 Princesas, coloca-a virada para baixo à sua frente e coloca a outra virada para baixo no centro da mesa."),
        t("The 6th player takes the 5 Princesses from the centre, chooses 1 and places it face down in front of them. The other 4 go back to the box.", "O 6º jogador pega as 5 Princesas do centro, escolhe 1 e a coloca virada para baixo à sua frente. As outras 4 voltam para a caixa."),
        interpretation("the rulebook does not say who the 6th player is; agree on anyone.", "o livro não diz quem é o 6º jogador; escolham qualquer um."),
        t("All players reveal their Princesses simultaneously. Each Princess's power lasts the whole game (see Princess powers).", "Todos revelam as Princesas ao mesmo tempo. O poder de cada Princesa vale a partida inteira (veja Poderes das Princesas).")
      ];
    }
    return [
      t(`Shuffle the 10 Princess cards and deal 2 to each player (${players * 2} cards). Put the ${10 - players * 2} undealt Princesses back in the box.`, `Embaralhe as 10 cartas de Princesa e distribua 2 para cada jogador (${players * 2} cartas). Devolva à caixa as ${10 - players * 2} Princesas não distribuídas.`),
      t("Each player chooses 1 of their 2 Princesses, places it face down in front of them and places the other face down in the centre of the table.", "Cada jogador escolhe 1 das suas 2 Princesas, coloca-a virada para baixo à sua frente e coloca a outra virada para baixo no centro da mesa."),
      t(`Return the ${players} Princesses in the centre to the box.`, `Devolva à caixa as ${players} Princesas do centro.`),
      t("All players reveal their Princesses simultaneously. Each Princess's power lasts the whole game (see Princess powers).", "Todos revelam as Princesas ao mesmo tempo. O poder de cada Princesa vale a partida inteira (veja Poderes das Princesas).")
    ];
  }

  function roundCardItems() {
    const n = state.rounds;
    if (firstGame()) {
      return [
        t("Find Round cards a, b, c, d and e (the letter is in the card's top-left corner). Return the other 15 to the box.", "Separe as cartas de Rodada a, b, c, d e e (a letra fica no canto superior esquerdo da carta). Devolva as outras 15 à caixa."),
        t("Place them face down in a row in the order a, b, c, d, e: round 1 uses a, round 5 uses e.", "Coloque-as viradas para baixo, em fila, na ordem a, b, c, d, e: a rodada 1 usa a, a rodada 5 usa e."),
        interpretation(`the rulebook lets you arrange them as you wish. Card e (Arranged Marriage) carries the black hourglass ${glyph("hourglass")} in the rulebook's pictures, so it goes last.`, `o livro deixa você ordená-las como quiser. A carta e (Casamento Arranjado) tem a ampulheta preta ${glyph("hourglass")} nas figuras do livro, então fica por último.`)
      ];
    }
    return [
      t(`Choose ${n} of the 20 Round cards (a–t) and arrange them as you want, or select them at random. Return the rest to the box.`, `Escolha ${n} das 20 cartas de Rodada (a–t) e ordene-as como quiser, ou sorteie-as. Devolva o resto à caixa.`),
      t(`Recommended: cards with a darker back and a black hourglass ${glyph("hourglass")} only in the final (${n === 5 ? "5th" : "3rd"}) position.`, `Recomendado: cartas de verso mais escuro e ampulheta preta ${glyph("hourglass")} só na última posição (${n === 5 ? "5ª" : "3ª"}).`),
      interpretation(`to draw at random, shuffle the light-backed cards and take ${n - 1}, then shuffle the dark-backed cards and take 1 for the last spot.`, `para sortear, embaralhe as cartas de verso claro e pegue ${n - 1}, depois embaralhe as de verso escuro e pegue 1 para a última posição.`),
      t(`Place the ${n} cards face down in a row, in the order they will be played.`, `Coloque as ${n} cartas viradas para baixo, em fila, na ordem em que serão jogadas.`)
    ];
  }

  function setupPhases() {
    const info = deck();
    return [
      {
        id: "princesses",
        title: t("Choose a Princess", "Escolha uma Princesa"),
        pages: [3, 11, 12],
        items: princessDraftItems()
      },
      {
        id: "deck",
        title: t(`Build the deck for ${state.players} players`, `Monte o baralho para ${state.players} jogadores`),
        pages: [3],
        items: [
          t(`Gather the 48 suited cards of the 4 suits: Fairies ${glyph("suit-fairy")}, Pets ${glyph("suit-pet")}, Princes ${glyph("suit-prince")} and Queens ${glyph("suit-queen")} (12 each, numbered 1–12).`, `Junte as 48 cartas de naipe dos 4 naipes: Fadas ${glyph("suit-fairy")}, Bichos ${glyph("suit-pet")}, Príncipes ${glyph("suit-prince")} e Rainhas ${glyph("suit-queen")} (12 de cada, numeradas de 1 a 12).`),
          state.players === 6
            ? t("With 6 players, use all 48 suited cards.", "Com 6 jogadores, use todas as 48 cartas de naipe.")
            : t(`With ${state.players} players, ${removedText()} from every suit and return them to the box. ${info.cards} cards remain.`, `Com ${state.players} jogadores, ${removedText()} de todos os naipes e devolva-as à caixa. Restam ${info.cards} cartas.`),
          t(`The Pet 8 is the Frog; it is always in the deck. This deck holds ${info.princes} Princes (${info.numbers}).`, `O 8 de Bichos é o Sapo; ele sempre está no baralho. Este baralho tem ${info.princes} Príncipes (${info.numbers}).`)
        ],
        art: ["deck", t("Rules PDF p. 3: the deck for 3 players (remove 1s, 11s, 12s), 4–5 players (remove 11s, 12s) and 6 players (all cards)", "Regras PDF p. 3: o baralho para 3 jogadores (retire 1, 11, 12), 4–5 jogadores (retire 11, 12) e 6 jogadores (todas as cartas)")]
      },
      {
        id: "deal",
        title: t("Deal the hands and find the starting player", "Distribua as mãos e defina quem começa"),
        pages: [3],
        items: [
          t("Choose a player at random to shuffle the deck.", "Escolham um jogador ao acaso para embaralhar."),
          t(`That player deals all the cards equally, face down: ${info.hand} cards to each player. Keep your hand secret.`, `Esse jogador distribui todas as cartas igualmente, viradas para baixo: ${info.hand} cartas para cada jogador. Mantenha a sua mão em segredo.`),
          t("The player to the left of the dealer starts the game (leads the first trick of round 1).", "O jogador à esquerda de quem distribuiu começa a partida (puxa a primeira vaza da rodada 1).")
        ]
      },
      {
        id: "round-cards",
        title: t(`Organize the party: ${state.rounds} Round cards`, `Organize a festa: ${state.rounds} cartas de Rodada`),
        pages: [3, 8],
        items: roundCardItems(),
        art: ["round-backs", t("Rules PDF p. 8: Round cards a and b, the light card backs and a dark back with the black hourglass", "Regras PDF p. 8: cartas de Rodada a e b, os versos claros e um verso escuro com a ampulheta preta")]
      },
      {
        id: "scoring",
        title: t("Scoring sheet", "Folha de pontos"),
        pages: [3, 6],
        items: [
          t("Place paper and a pencil to the side for scoring (not in the box).", "Deixe papel e lápis ao lado para anotar os pontos (não vêm na caixa)."),
          interpretation(`write one column per player and one row per round (${state.rounds} rows); keep each round's score as well as the total, because the tie-break counts the rounds in which a player scored zero or fewer.`, `faça uma coluna por jogador e uma linha por rodada (${state.rounds} linhas); anote o resultado de cada rodada além do total, porque o desempate conta as rodadas em que um jogador marcou zero ou menos.`)
        ],
        art: ["table", t("Rules PDF p. 3: a table ready to play — Round cards in a row, the dealt hands and each player's Princess", "Regras PDF p. 3: uma mesa pronta — cartas de Rodada em fila, as mãos distribuídas e a Princesa de cada jogador")]
      }
    ];
  }

  function inventory() {
    const info = deck();
    const removed = 48 - info.cards;
    const cards = [
      infoCard(t("SUITED CARDS", "CARTAS DE NAIPE"), t(`${info.cards} cards · ${info.hand} per player`, `${info.cards} cartas · ${info.hand} por jogador`), [
        rl("Queens / Princes / Fairies / Pets", `12 of each in the box, numbered 1–12; this match uses ${info.numbers} of each suit.`, "Rainhas / Príncipes / Fadas / Bichos", `12 de cada na caixa, numeradas de 1 a 12; esta partida usa ${info.numbers} de cada naipe.`),
        removed ? rl("Back to the box", `${removed} cards (${removedText()}).`, "De volta à caixa", `${removed} cartas (${removedText()}).`) : rl("Back to the box", "none.", "De volta à caixa", "nenhuma."),
        rl("The Frog", "the 8 of Pets, always in play.", "O Sapo", "o 8 de Bichos, sempre em jogo."),
        rl("Princes in play", `${info.princes}.`, "Príncipes em jogo", `${info.princes}.`)
      ], [2, 3]),
      infoCard(t("PRINCESS CARDS", "CARTAS DE PRINCESA"), t("10 in the box · 1 per player", "10 na caixa · 1 por jogador"), [
        state.players === 6
          ? t("2 to each of 5 players; the 6th chooses from the 5 put in the centre.", "2 para cada um de 5 jogadores; o 6º escolhe entre as 5 postas no centro.")
          : t(`2 dealt to each player (${state.players * 2}); each keeps 1.`, `2 para cada jogador (${state.players * 2}); cada um fica com 1.`),
        t("Kept face up in front of you while the power is available; face down when exhausted.", "Fica virada para cima à sua frente enquanto o poder está disponível; virada para baixo quando esgotado."),
        t("The rest go back to the box.", "As outras voltam para a caixa.")
      ], [2, 3]),
      infoCard(t("ROUND CARDS", "CARTAS DE RODADA"), t(`20 in the box (a–t) · ${state.rounds} used`, `20 na caixa (a–t) · ${state.rounds} usadas`), [
        firstGame()
          ? t("a, b, c, d, e — face down in a row, in that order.", "a, b, c, d, e — viradas para baixo em fila, nessa ordem.")
          : t(`${state.rounds} of your choice or drawn at random, face down in a row.`, `${state.rounds} à sua escolha ou sorteadas, viradas para baixo em fila.`),
        t("The rest go back to the box.", "As outras voltam para a caixa.")
      ], [2, 3]),
      infoCard(t("NOT IN THE BOX", "NÃO VEM NA CAIXA"), t("Paper and pencil", "Papel e lápis"), [
        t("To record each player's proposals round by round.", "Para anotar os pedidos de cada jogador rodada a rodada.")
      ], [3])
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
        <label class="rp-setup-check" for="rp-setup-${phase.id}">
          <input id="rp-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="rp-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="rp-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
        ${phase.art ? `<div class="rp-art-row">${figure(phase.art[0], phase.art[1])}</div>` : ""}
      </article>`).join("");

    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), sectionIndex("setup"), [3])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${t("Prepare the party", "Prepare a festa")} · ${playersLabel()} · ${roundsName()}</h3>
            <p>${t("One checkbox per coherent step, in the rulebook's order (setup steps 1–5).", "Uma caixa por etapa coerente, na ordem do livro (passos 1–5 da preparação).")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved separately from the match options. Changing the players, the game length or the Round-card set clears it; changing the language or the Princess-power option does not. “Uncheck all” clears only these setup boxes.",
          "O progresso é salvo separadamente das opções da partida. Mudar os jogadores, a duração ou o conjunto de cartas de Rodada o limpa; trocar o idioma ou a opção dos poderes não. “Desmarcar tudo” limpa somente estas caixas da preparação."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}
      <div class="rp-art-row">${figure("components", t("Rules PDF p. 2: the components — 12 Queen, 12 Fairy, 12 Pet (with the Frog, number 8) and 12 Prince cards, 20 Round cards (a–t) and 10 Princess cards", "Regras PDF p. 2: os componentes — 12 cartas de Rainha, 12 de Fada, 12 de Bicho (com o Sapo, número 8) e 12 de Príncipe, 20 cartas de Rodada (a–t) e 10 cartas de Princesa"))}</div>`;
  }

  // ---------- quick reference ----------

  function quickReference() {
    const info = deck();
    const cards = [
      infoCard(t("ROUND START", "INÍCIO DA RODADA"), t("Flip, read, pass", "Vire, leia, passe"), [
        rl("Flip", "the next Round card face up and read its effect aloud.", "Vire", "a próxima carta de Rodada para cima e leia o efeito em voz alta."),
        rl("Pass", `the number of cards shown on it: ${glyph("pass-left")} to your left, ${glyph("pass-right")} to your right, or both.`, "Passe", `o número de cartas indicado nela: ${glyph("pass-left")} para a esquerda, ${glyph("pass-right")} para a direita, ou os dois.`),
        rl("Simultaneous", "give your cards before looking at the ones you receive.", "Ao mesmo tempo", "entregue as suas cartas antes de olhar as que recebeu."),
        rl("Play", `the starting player leads the first trick; play until hands are empty (${info.hand} tricks normally).`, "Jogue", `quem começa puxa a primeira vaza; joguem até as mãos esvaziarem (${info.hand} vazas normalmente).`)
      ], [4]),
      infoCard(t("A TRICK", "UMA VAZA"), t("Follow suit, highest wins", "Siga o naipe, a mais alta vence"), [
        rl("Lead", "any card — but not a Prince until the Princes have snuck in.", "Puxe", "qualquer carta — mas não um Príncipe até os Príncipes entrarem de penetra."),
        rl("Clockwise", "every player plays one card face up.", "Sentido horário", "cada jogador joga uma carta virada para cima."),
        rl("Follow suit", "you must play the led suit if you have it.", "Siga o naipe", "você precisa jogar o naipe puxado se tiver."),
        rl("Void", "no card of the led suit → play any card.", "Sem o naipe", "nenhuma carta do naipe puxado → jogue qualquer carta."),
        rl("Win", "highest card of the led suit; take the cards face down; you lead next.", "Vença", "a carta mais alta do naipe puxado; pegue as cartas viradas para baixo; você puxa a próxima.")
      ], [5]),
      infoCard(t("PRINCES", "PRÍNCIPES"), t("When they sneak in", "Quando entram de penetra"), [
        rl("Snuck in", `a void player plays a Prince ${glyph("suit-prince")} → Princes may be led for the rest of the round.`, "Entraram", `um jogador sem o naipe joga um Príncipe ${glyph("suit-prince")} → os Príncipes podem ser puxados pelo resto da rodada.`),
        rl("Frog", "playing the Frog does not count — it is a Pet.", "Sapo", "jogar o Sapo não conta — ele é um Bicho."),
        rl("Only Princes", "a leader holding only Princes may lead one.", "Só Príncipes", "quem puxa e só tem Príncipes pode puxar um.")
      ], [5]),
      infoCard(t("PRINCESS POWER", "PODER DA PRINCESA"), powersOn() ? t("Once per round", "Uma vez por rodada") : t("Once per round — after the learning rounds", "Uma vez por rodada — depois das rodadas de aprendizado"), [
        powersOn() ? "" : rl("Learning rounds", "no powers at all in the opening rounds you agreed on.", "Rodadas de aprendizado", "nenhum poder nas rodadas iniciais combinadas."),
        rl("Use", "read it aloud, then flip your Princess face down (exhausted).", "Use", "leia-o em voz alta e vire a sua Princesa para baixo (esgotada)."),
        rl("Order", "in the order players declare; at the same moment → from the leader's left, clockwise.", "Ordem", "na ordem em que os jogadores declaram; ao mesmo tempo → a partir da esquerda de quem puxa, em sentido horário."),
        rl("No undo", "a power that would undo another's power may not be used this trick.", "Sem desfazer", "um poder que desfaria o poder de outra não pode ser usado nesta vaza."),
        rl("Priority", "Princess powers › Round card › basic rules.", "Prioridade", "poderes de Princesa › carta de Rodada › regras básicas.")
      ], [6, 8]),
      infoCard(t("SCORING", "PONTUAÇÃO"), t("Fewest proposals is best", "Menos pedidos é melhor"), [
        rl("Each Prince", `${glyph("proposal")} 1 proposal.`, "Cada Príncipe", `${glyph("proposal")} 1 pedido.`),
        rl("The Frog (Pet 8)", "5 proposals.", "O Sapo (8 de Bichos)", "5 pedidos."),
        rl("Rebel of the Ball", `all ${info.princes} Princes + the Frog → exactly −10 for the round.`, "Rebelde do Baile", `todos os ${info.princes} Príncipes + o Sapo → exatamente −10 na rodada.`),
        rl("Round card", "may change values (see the card in play).", "Carta de Rodada", "pode mudar valores (veja a carta em jogo)."),
        rl("Record", "write each player's proposals on paper.", "Anote", "registre os pedidos de cada jogador no papel.")
      ], [5, 6]),
      infoCard(t("ROUND END", "FIM DA RODADA"), t("4 steps", "4 passos"), [
        rl("1 · Deal", "shuffle the suited cards and deal them all again.", "1 · Distribua", "embaralhe as cartas de naipe e distribua todas de novo."),
        rl("2 · Refresh", "turn exhausted Princesses face up.", "2 · Renove", "vire para cima as Princesas esgotadas."),
        rl("3 · Next card", "flip the current Round card face down; reveal the next and read it aloud.", "3 · Próxima carta", "vire a carta de Rodada atual para baixo; revele a próxima e leia-a em voz alta."),
        rl("4 · Starter", "lowest total score starts (ties: first tied player to the left of the last round's starter).", "4 · Quem começa", "o menor total começa (empate: o primeiro empatado à esquerda de quem começou a última rodada).")
      ], [4]),
      infoCard(t("GAME END", "FIM DE JOGO"), t(`After ${state.rounds} rounds`, `Depois de ${state.rounds} rodadas`), [
        rl("Winner", "fewest total proposals.", "Vencedor", "menos pedidos no total."),
        rl("Tie 1", "most rounds scored at zero or fewer proposals.", "Empate 1", "mais rodadas com zero ou menos pedidos."),
        rl("Tie 2", "play one more round with a random black-hourglass Round card.", "Empate 2", "joguem mais uma rodada com uma carta de Rodada de ampulheta preta sorteada.")
      ], [7], "victory-card")
    ];
    const rounds = roundsInMatch();
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), sectionIndex("quick-reference"), [4, 5, 6, 7])}
      <div class="callout">${t(
        `A trick-taking game over ${state.rounds} rounds. Princes and the Frog you win are marriage proposals: you want as few as possible. Each round a Round card changes the rules, and each player's Princess has a once-per-round power. After the last round, the player with the fewest proposals stays single and wins.`,
        `Um jogo de vazas em ${state.rounds} rodadas. Príncipes e o Sapo que você ganha são pedidos de casamento: você quer o mínimo possível. A cada rodada uma carta de Rodada muda as regras, e a Princesa de cada jogador tem um poder de uma vez por rodada. Depois da última rodada, quem tiver menos pedidos continua solteira e vence.`
      )} ${referenceLink(2)}</div>
      <div class="quick-grid">${cards.join("")}</div>
      <h3 class="subhead">${firstGame() ? t("Round cards in this match (a → e)", "Cartas de Rodada desta partida (a → e)") : t("Round cards — one line each (any may be in play)", "Cartas de Rodada — uma linha cada (qualquer uma pode estar em jogo)")}</h3>
      <div class="info-card">
        <ul class="card-lines">${rounds.map((card) => `<li><strong>${card.id} · ${t(card.en, `${card.pt} (${card.en})`)}:</strong> ${t(card.short[0], card.short[1])}</li>`).join("")}</ul>
        <button type="button" class="source-link" data-scroll="round-cards">${t("Full Round-card rules ↓", "Regras completas das cartas de Rodada ↓")}</button>
      </div>
      <h3 class="subhead">${t("Princess powers — one line each", "Poderes das Princesas — uma linha cada")}</h3>
      <div class="info-card">
        <ul class="card-lines">${PRINCESSES.map((p) => `<li><strong>${t(p.name[0], p.name[1])} · ${t(p.timing[0], p.timing[1]).toLowerCase()}:</strong> ${t(p.lines[0][0], p.lines[0][1])}</li>`).join("")}</ul>
      </div>`;
  }

  // ---------- victory ----------

  function victorySection() {
    return `
      ${sectionHeading("victory", t("End of the game & winning", "Fim do jogo e vitória"), sectionIndex("victory"), [7])}
      <div class="quick-grid">
        <article class="info-card victory-card">
          <span class="component-label">${t("GAME END", "FIM DE JOGO")}</span>
          <h3>${t(`After round ${state.rounds}`, `Depois da rodada ${state.rounds}`)}</h3>
          ${lineList([
            t(`When all ${state.rounds} rounds have been played (all ${state.rounds} Round cards used), the party is over.`, `Quando as ${state.rounds} rodadas tiverem sido jogadas (as ${state.rounds} cartas de Rodada usadas), a festa acaba.`),
            t("Score the last round as usual and add up each player's total.", "Conte a última rodada normalmente e some o total de cada jogador.")
          ])}
          ${referenceLink(7)}
        </article>
        <article class="info-card victory-card">
          <span class="component-label">${t("WINNER", "VENCEDORA")}</span>
          <h3>${t("Fewest proposals", "Menos pedidos")}</h3>
          ${lineList([
            t("The player with the fewest proposals wins and rebels against the unwanted marriages.", "Quem tiver menos pedidos vence e se rebela contra os casamentos indesejados."),
            t("Totals can be zero or negative (Rebel of the Ball and some Round cards subtract proposals).", "Os totais podem ser zero ou negativos (a Rebelde do Baile e algumas cartas de Rodada tiram pedidos).")
          ])}
          ${referenceLink(7)}
        </article>
        <article class="info-card victory-card">
          <span class="component-label">${t("TIES", "EMPATES")}</span>
          <h3>${t("Two tie-breakers", "Dois desempates")}</h3>
          ${lineList([
            rl("First", "the tied player who scored zero or fewer proposals in the most rounds wins.", "Primeiro", "vence a empatada que marcou zero ou menos pedidos no maior número de rodadas."),
            rl("Still tied", `play another round of Rebel Princess using a random black-hourglass ${glyph("hourglass")} Round card to determine the winner.`, "Ainda empatadas", `joguem mais uma rodada de Rebel Princess com uma carta de Rodada de ampulheta preta ${glyph("hourglass")} sorteada para definir a vencedora.`),
            t("The winner of that extra round might not be one of the previously tied players!", "Quem vence essa rodada extra pode não ser uma das jogadoras que estavam empatadas!"),
            interpretation("take the black-hourglass card at random from the Round cards not used this game (the ones returned to the box); deal and pass as for a normal round.", "sorteie a carta de ampulheta preta entre as cartas de Rodada não usadas nesta partida (as devolvidas à caixa); distribua e passe como numa rodada normal."),
            interpretation("everyone plays the extra round and adds it to their total; the fewest total proposals then wins.", "todos jogam a rodada extra e somam ao total; então vence quem tiver menos pedidos no total.")
          ])}
          ${referenceLink(7)}
        </article>
      </div>`;
  }

  // ---------- rounds ----------

  function roundsSection() {
    return `
      ${sectionHeading("rounds", t("Sequence of play: rounds", "Sequência de jogo: rodadas"), sectionIndex("rounds"), [4])}
      <div class="quick-grid">
        ${infoCard(t("EACH ROUND", "CADA RODADA"), t("Start of a round", "Início de uma rodada"), [
          t(`The game lasts ${state.rounds} rounds, one per Round card in the row.`, `A partida dura ${state.rounds} rodadas, uma por carta de Rodada na fila.`),
          t("At the beginning of each round, flip the corresponding Round card face up and read its effect. It makes this round unique. (From round 2 on, this is the card already revealed in step 3 of the previous round's end — it is one flip, not two.)", "No começo de cada rodada, vire para cima a carta de Rodada correspondente e leia o efeito. Ela torna a rodada única. (A partir da rodada 2, é a carta já revelada no passo 3 do fim da rodada anterior — é uma virada só, não duas.)"),
          t(`Then, as shown on the Round card, give a number of cards from your hand to the player on your left ${glyph("pass-left")}, on your right ${glyph("pass-right")}, or both.`, `Depois, como indicado na carta de Rodada, entregue um número de cartas da sua mão ao jogador da esquerda ${glyph("pass-left")}, da direita ${glyph("pass-right")}, ou aos dois.`),
          t("The exchange is simultaneous: you may not look at the cards you receive before giving yours.", "A troca é simultânea: você não pode olhar as cartas recebidas antes de entregar as suas."),
          t("Play begins: the starting player leads the first trick. Play tricks until you have no cards in hand.", "O jogo começa: quem começa puxa a primeira vaza. Joguem vazas até não ter mais cartas na mão."),
          t("When all cards have been played, the round is over: score the marriage proposals you obtained.", "Quando todas as cartas tiverem sido jogadas, a rodada acaba: contem os pedidos de casamento recebidos.")
        ], [4])}
        ${infoCard(t("ONCE THE ROUND HAS ENDED", "QUANDO A RODADA ACABA"), t("Prepare the next round", "Prepare a próxima rodada"), [
          rl("1", "shuffle the suited cards and deal them all again.", "1", "embaralhe as cartas de naipe e distribua todas de novo."),
          rl("2", "refresh exhausted Princesses by turning them face up.", "2", "renove as Princesas esgotadas, virando-as para cima."),
          rl("3", "flip the current Round card face down; reveal the next Round card and read its effects aloud.", "3", "vire a carta de Rodada atual para baixo; revele a próxima carta de Rodada e leia os efeitos em voz alta."),
          rl("4", "the player with the lowest total score starts the new round. Ties: starting with the tied player to the left of the player who started the last round.", "4", "quem tiver o menor total começa a nova rodada. Empate: começa a empatada mais próxima à esquerda de quem começou a última rodada."),
          interpretation("the rulebook does not say who deals from round 2 on; anyone may shuffle and deal, since the starting player is set by the scores.", "o livro não diz quem distribui a partir da rodada 2; qualquer um pode embaralhar e distribuir, pois quem começa é definido pelos pontos.")
        ], [4])}
      </div>
      <div class="rp-art-row">${figure("passing", t("Rules PDF p. 4: card t passes 1 card to the left, card s passes 2 cards to the right, card e passes 1 card in each direction", "Regras PDF p. 4: a carta t passa 1 carta para a esquerda, a carta s passa 2 cartas para a direita, a carta e passa 1 carta para cada lado"))}</div>`;
  }

  // ---------- tricks ----------

  function tricksSection() {
    const info = deck();
    return `
      ${sectionHeading("tricks", t("Playing a trick", "Jogando uma vaza"), sectionIndex("tricks"), [5])}
      <div class="quick-grid">
        ${infoCard(t("THE TRICK", "A VAZA"), t("One card each, clockwise", "Uma carta cada, em sentido horário"), [
          t("Beginning with the starting (leading) player and going clockwise, each player must play one card face up. This is a trick.", "Começando por quem puxa e seguindo em sentido horário, cada jogador precisa jogar uma carta virada para cima. Isso é uma vaza."),
          t(`The suit of the first card is the led suit. The others must follow it — play a card of the same suit (${glyph("suit-queen")} ${glyph("suit-prince")} ${glyph("suit-fairy")} ${glyph("suit-pet")}) if they have one.`, `O naipe da primeira carta é o naipe puxado. Os outros precisam segui-lo — jogar uma carta do mesmo naipe (${glyph("suit-queen")} ${glyph("suit-prince")} ${glyph("suit-fairy")} ${glyph("suit-pet")}) se tiverem.`),
          t("A player who cannot follow the led suit may play any card of another suit; this is being “void” in that suit.", "Um jogador que não pode seguir o naipe puxado pode jogar qualquer carta de outro naipe; isso é estar “sem o naipe”."),
          t("Once a face-up card has been played, the trick has begun.", "Assim que uma carta é jogada virada para cima, a vaza começou.")
        ], [5])}
        ${infoCard(t("WINNING", "VENCENDO"), t("Highest card of the led suit", "A carta mais alta do naipe puxado"), [
          t("When everyone has played, the highest card of the led suit wins the trick — higher cards of other suits do not.", "Quando todos jogaram, a carta mais alta do naipe puxado vence a vaza — cartas mais altas de outros naipes não."),
          t("The winner collects the cards and places them face down in front of themselves.", "Quem vence recolhe as cartas e as coloca viradas para baixo à sua frente."),
          t("Nobody may look at those face-down cards before the end of the round.", "Ninguém pode olhar essas cartas viradas para baixo antes do fim da rodada."),
          t("The winner becomes the starting player and leads the next trick.", "Quem vence passa a ser quem começa e puxa a próxima vaza.")
        ], [5])}
        ${infoCard(t("WARNING!", "ATENÇÃO!"), t("The Princes are not invited", "Os Príncipes não foram convidados"), [
          t(`At first, you cannot start a trick with a card of the Prince suit ${glyph("suit-prince")}.`, `No início, você não pode começar uma vaza com uma carta do naipe de Príncipes ${glyph("suit-prince")}.`),
          t("As soon as a player who is void in the led suit plays a Prince, the Princes have snuck into the party: from then until the end of that round, Princes may be led.", "Assim que um jogador sem o naipe puxado joga um Príncipe, os Príncipes entraram de penetra na festa: daí até o fim dessa rodada, Príncipes podem ser puxados."),
          t("The Frog does not count for this — he is a Pet, not a Prince.", "O Sapo não conta para isso — ele é um Bicho, não um Príncipe."),
          t("If the starting player has only Prince cards in hand, they may start a trick with one.", "Se quem puxa só tiver cartas de Príncipe na mão, pode começar a vaza com uma delas."),
          interpretation("the Princes start uninvited again at the beginning of every round.", "os Príncipes voltam a ser não convidados no começo de cada rodada.")
        ], [5])}
        ${infoCard(t("REBEL OF THE BALL", "REBELDE DO BAILE"), t("Win every Prince and the Frog", "Ganhe todos os Príncipes e o Sapo"), [
          t(`If a player wins all of the Princes (${info.princes} in this match) and the Frog in a round, they are the Rebel of the Ball.`, `Se um jogador ganhar todos os Príncipes (${info.princes} nesta partida) e o Sapo numa rodada, ele é a Rebelde do Baile.`),
          t("They receive only −10 proposals for that round, ignoring the proposals from the Princes and the Frog.", "Ele recebe só −10 pedidos nessa rodada, ignorando os pedidos dos Príncipes e do Sapo."),
          t("It is always −10, even if that player has other cards that would add or subtract proposals.", "É sempre −10, mesmo que esse jogador tenha outras cartas que somariam ou tirariam pedidos."),
          t("Any special round scoring for the other players still applies.", "Qualquer pontuação especial da rodada para os outros jogadores continua valendo."),
          firstGame()
            ? t("It is easier with some Round cards than others.", "É mais fácil com algumas cartas de Rodada do que com outras.")
            : t("It is easier with some Round cards than others (and impossible with Wedding Gift).", "É mais fácil com algumas cartas de Rodada do que com outras (e impossível com Presente de Casamento).")
        ], firstGame() ? [5] : [5, 10])}
      </div>
      <div class="rp-art-row">${figure("rebel-ball", t("Rules PDF p. 5: the Rebel of the Ball takes all the Princes' and the Frog's proposals", "Regras PDF p. 5: a Rebelde do Baile fica com todos os pedidos dos Príncipes e do Sapo"))}</div>`;
  }

  // ---------- scoring ----------

  function scoringSection() {
    const info = deck();
    const extra = firstGame()
      ? [
        ["d · Three Times a Lady", "d · Três Vezes Dama", "each 3 won −3; the 3 of Princes −2.", "cada 3 ganho −3; o 3 de Príncipes −2."],
        ["e · Arranged Marriage", "e · Casamento Arranjado", "no tricks at all → +5.", "nenhuma vaza → +5."]
      ]
      : [
        ["d · Three Times a Lady", "d · Três Vezes Dama", "each 3 won −3; the 3 of Princes −2.", "cada 3 ganho −3; o 3 de Príncipes −2."],
        ["e · Arranged Marriage", "e · Casamento Arranjado", "no tricks at all → +5.", "nenhuma vaza → +5."],
        ["j · Pet's Revenge", "j · A Vingança dos Bichos", "each Pet won +1 (the Frog is 6).", "cada Bicho ganho +1 (o Sapo vale 6)."],
        ["n · Late for a Very Important Date", "n · Atrasada para um Compromisso Importante", "your last 3 cards count as won cards.", "as suas 3 últimas cartas contam como ganhas."],
        ["o · Wedding Gift", "o · Presente de Casamento", "no Rebel of the Ball possible.", "Rebelde do Baile impossível."],
        ["t · Single Fairy", "t · Fada Solteira", "each Fairy won −1.", "cada Fada ganha −1."]
      ];
    return `
      ${sectionHeading("scoring", t("Scoring marriage proposals", "Contando os pedidos de casamento"), sectionIndex("scoring"), [6, 5])}
      <div class="quick-grid">
        ${infoCard(t("END OF EACH ROUND", "FIM DE CADA RODADA"), t("Count your proposals", "Conte os seus pedidos"), [
          t("Once all cards have been played, each player turns over all the face-down cards they won.", "Quando todas as cartas tiverem sido jogadas, cada jogador vira todas as cartas que ganhou."),
          t(`Each Prince counts as 1 proposal ${glyph("proposal")}.`, `Cada Príncipe vale 1 pedido ${glyph("proposal")}.`),
          t(`The Pets suit ${glyph("suit-pet")} contains the Frog (number 8): he is a bewitched Prince. Whoever has the Frog at the end of a round receives 5 proposals.`, `O naipe de Bichos ${glyph("suit-pet")} tem o Sapo (número 8): ele é um Príncipe enfeitiçado. Quem estiver com o Sapo no fim de uma rodada recebe 5 pedidos.`),
          t(`Every card that adds proposals has the proposal mark ${glyph("proposal-mark")} below its number.`, `Toda carta que soma pedidos tem a marca de pedido ${glyph("proposal-mark")} abaixo do número.`),
          t("Queens, Fairies and the other Pets score nothing (unless the Round card says otherwise).", "Rainhas, Fadas e os outros Bichos não valem nada (a não ser que a carta de Rodada diga o contrário)."),
          t("Record each player's proposals on the paper.", "Anote os pedidos de cada jogador no papel.")
        ], [6])}
      </div>
      <table class="rp-score-table">
        <caption>${t("Proposal values", "Valores dos pedidos")}</caption>
        <thead><tr><th>${t("Card / situation", "Carta / situação")}</th><th>${t("Proposals this round", "Pedidos nesta rodada")}</th></tr></thead>
        <tbody>
          <tr><td>${glyph("suit-prince")} ${t("Each Prince won", "Cada Príncipe ganho")}</td><td>+1</td></tr>
          <tr><td>${glyph("suit-pet")} ${t("The Frog (8 of Pets)", "O Sapo (8 de Bichos)")}</td><td>+5</td></tr>
          <tr><td>${t(`Rebel of the Ball: all ${info.princes} Princes + the Frog`, `Rebelde do Baile: todos os ${info.princes} Príncipes + o Sapo`)}</td><td>${t(`−10 in total (instead of +${info.princes + 5})`, `−10 no total (em vez de +${info.princes + 5})`)}</td></tr>
          <tr><td>${t("Queens, Fairies, other Pets", "Rainhas, Fadas, outros Bichos")}</td><td>0</td></tr>
          ${extra.map(([en, pt, ben, bpt]) => `<tr><td>${t(en, pt)}</td><td>${t(ben, bpt)}</td></tr>`).join("")}
        </tbody>
      </table>`;
  }

  // ---------- princess powers ----------

  function princessesSection() {
    return `
      ${sectionHeading("princesses", t("Princess powers", "Poderes das Princesas"), sectionIndex("princesses"), [6, 11, 12])}
      ${powersOn() ? "" : `<div class="callout">${interpretation("Learning rounds are selected: in the opening rounds you agreed on, nobody uses a power (Princesses simply stay face up). From the next round on, everything below applies.", "Rodadas de aprendizado selecionadas: nas rodadas iniciais combinadas, ninguém usa poder (as Princesas só ficam viradas para cima). Da rodada seguinte em diante, vale tudo o que está abaixo.")} ${referenceLink(6)}</div>`}
      <div class="quick-grid">
        ${infoCard(t("USING A POWER", "USANDO UM PODER"), t("Once per round", "Uma vez por rodada"), [
          t("Once per round, you may use your Princess's power if you wish, while your Princess card is face up (active).", "Uma vez por rodada, você pode usar o poder da sua Princesa se quiser, enquanto a carta dela estiver virada para cima (ativa)."),
          t("Read it out loud, then flip your Princess card face down: the power is exhausted.", "Leia-o em voz alta e depois vire a carta da Princesa para baixo: o poder está esgotado."),
          t("It is refreshed (turned face up) at the end of the round.", "Ele é renovado (virado para cima) no fim da rodada."),
          t("“Before a trick” means before the first card of that trick is played face up.", "“Antes de uma vaza” quer dizer antes de a primeira carta dessa vaza ser jogada virada para cima.")
        ], [6, 11])}
        ${infoCard(t("SEVERAL POWERS", "VÁRIOS PODERES"), t("Order and conflicts", "Ordem e conflitos"), [
          t("If more than one player wishes to use a power, they are used in the order in which players declare it.", "Se mais de um jogador quiser usar o poder, eles são usados na ordem em que os jogadores declaram."),
          t("If several players declare at the same time, each power is resolved completely, in order, starting from the player to the left of the leading player and going clockwise.", "Se vários declararem ao mesmo tempo, cada poder é resolvido por completo, em ordem, a partir do jogador à esquerda de quem puxa, em sentido horário."),
          t("If your power would “undo” another player's power, you may not use it during this trick (the conflicts are listed under each Princess).", "Se o seu poder “desfaria” o poder de outra jogadora, você não pode usá-lo nesta vaza (os conflitos estão em cada Princesa)."),
          t("Hierarchy of rules: Princess powers first, then Round card effects, then the basic rules.", "Hierarquia das regras: primeiro os poderes de Princesa, depois os efeitos da carta de Rodada, depois as regras básicas.")
        ], [6, 8])}
      </div>
      <div class="rp-card-grid">${PRINCESSES.map((p) => `
        <article class="rp-card">
          <img src="${ART}princess-${p.id}.webp" alt="${t(p.name[0], p.name[1])}" loading="lazy">
          <div>
            <span class="rp-tag">${t(p.timing[0], p.timing[1])}</span>
            <h3>${t(p.name[0], p.name[1])} · ${t(p.power[0], `${p.power[1]} (${p.power[0]})`)}</h3>
            ${lineList([...p.lines.map(([en, pt]) => t(en, pt)), ...(p.readings || []).map(([en, pt]) => interpretation(en, pt))])}
            ${referenceLink(p.page)}
          </div>
        </article>`).join("")}</div>
      <div class="rp-art-row">${figure("princess-card", t("Rules PDF p. 6: a Princess card (Snow White) face up, and face down once its power is exhausted", "Regras PDF p. 6: uma carta de Princesa (Branca de Neve) virada para cima, e virada para baixo depois de esgotar o poder"))}</div>`;
  }

  // ---------- round cards ----------

  function roundCardsSection() {
    const cards = roundsInMatch();
    return `
      ${sectionHeading("round-cards", t("Round cards", "Cartas de Rodada"), sectionIndex("round-cards"), [8, 9, 10, 11])}
      <div class="quick-grid">
        ${infoCard(t("READING A ROUND CARD", "LENDO UMA CARTA DE RODADA"), t("Four things on each card", "Quatro coisas em cada carta"), [
          rl("1 · Passing", `how many cards to pass at the start of the round and in which direction: ${glyph("pass-left")} left, ${glyph("pass-right")} right, an arrow on each side = 1 each way.`, "1 · Passe", `quantas cartas passar no início da rodada e para que lado: ${glyph("pass-left")} esquerda, ${glyph("pass-right")} direita, uma seta de cada lado = 1 para cada lado.`),
          rl("2 · Effect", "the unique change for this round only; read it aloud at the start of the round.", "2 · Efeito", "a mudança única desta rodada; leia em voz alta no início da rodada."),
          rl("3 · Letter", "top-left corner, a to t: the complexity of the card's rules.", "3 · Letra", "canto superior esquerdo, de a a t: a complexidade das regras da carta."),
          rl("4 · Black hourglass", `${glyph("hourglass")} and a dark back: recommended for the last round, for a more exciting ending.`, "4 · Ampulheta preta", `${glyph("hourglass")} e verso escuro: recomendada para a última rodada, para um final mais emocionante.`),
          t("A Round card's special rules take precedence over the basic rules (but not over Princess powers).", "As regras especiais de uma carta de Rodada têm precedência sobre as regras básicas (mas não sobre os poderes de Princesa).")
        ], [8])}
      </div>
      <p class="glossary-intro">${firstGame()
        ? t("This match uses the recommended first-game cards a–e, played in that order. The passing shown below is read from the rulebook's pictures; always follow the card itself.", "Esta partida usa as cartas recomendadas para a primeira partida, a–e, jogadas nessa ordem. O passe mostrado abaixo foi lido nas figuras do livro; siga sempre a própria carta.")
        : t("All 20 Round cards, since any may be in play. The passing and black hourglass are shown only where the rulebook's pictures show them; for every other card, read them on the card itself.", "As 20 cartas de Rodada, pois qualquer uma pode estar em jogo. O passe e a ampulheta preta só aparecem onde as figuras do livro os mostram; para as outras cartas, leia-os na própria carta.")}</p>
      <div class="rp-card-grid">${cards.map((card) => `
        <article class="rp-card" id="round-${card.id}">
          <img src="${ART}round-${card.id}.webp" alt="${t(`Illustration of Round card ${card.id}`, `Ilustração da carta de Rodada ${card.id}`)}" loading="lazy">
          <div>
            <h3><span class="rp-letter">${card.id}</span>${t(card.en, `${card.pt} <small>(${card.en})</small>`)}</h3>
            ${card.final ? `<span class="rp-tag rp-tag-final">${glyph("hourglass")} ${t("Final round", "Rodada final")}</span>` : ""}
            <span class="rp-tag">${t("Pass", "Passe")}: ${card.pass ? t(card.pass[0], card.pass[1]) : t("see the card", "veja a carta")}</span>
            ${lineList([...card.rules.map(([en, pt]) => t(en, pt)), ...(card.readings || []).map(([en, pt]) => interpretation(en, pt))])}
            ${referenceLink(card.page)}
          </div>
        </article>`).join("")}</div>
      <div class="rp-art-row">${figure("round-card-anatomy", t("Rules PDF p. 8: Round card e — 1 card passed in each direction, the effect text, the letter and the black hourglass", "Regras PDF p. 8: carta de Rodada e — 1 carta passada para cada lado, o texto do efeito, a letra e a ampulheta preta"))}</div>`;
  }

  // ---------- iconography ----------

  function iconsSection() {
    return `
      ${sectionHeading("icons", t("Iconography", "Iconografia"), sectionIndex("icons"), [5, 6, 8])}
      <p class="glossary-intro">${t("Each symbol is cut from the rulebook. The suit symbols are printed on the suited cards; the others on the Round cards and in the rulebook.", "Cada símbolo foi recortado do livro de regras. Os símbolos de naipe estão impressos nas cartas de naipe; os outros nas cartas de Rodada e no livro.")}</p>
      <h3 class="subhead">${t("Suits", "Naipes")}</h3>
      <div class="icon-grid">
        ${iconCard("suit-queen", firstGame() ? "Queen cards, 12 cards numbered 1–12." : "Queen cards, 12 cards numbered 1–12. Trump under Royal Decree.", firstGame() ? "Cartas de Rainha, 12 cartas numeradas de 1 a 12." : "Cartas de Rainha, 12 cartas numeradas de 1 a 12. Trunfo com o Decreto Real.", [2, 5])}
        ${iconCard("suit-prince", "Prince cards, 12 cards numbered 1–12. Each one won is 1 proposal; cannot be led until the Princes have snuck in.", "Cartas de Príncipe, 12 cartas numeradas de 1 a 12. Cada uma ganha é 1 pedido; não podem ser puxadas até os Príncipes entrarem de penetra.", [2, 5, 6])}
        ${iconCard("suit-fairy", firstGame() ? "Fairy cards, 12 cards numbered 1–12." : "Fairy cards, 12 cards numbered 1–12. Worth −1 each under Single Fairy.", firstGame() ? "Cartas de Fada, 12 cartas numeradas de 1 a 12." : "Cartas de Fada, 12 cartas numeradas de 1 a 12. Valem −1 cada com a Fada Solteira.", [2, 5])}
        ${iconCard("suit-pet", "Pet cards, 12 cards numbered 1–12, including the Frog (number 8), worth 5 proposals.", "Cartas de Bicho, 12 cartas numeradas de 1 a 12, inclusive o Sapo (número 8), que vale 5 pedidos.", [2, 5, 6])}
      </div>
      <h3 class="subhead">${t("Symbols", "Símbolos")}</h3>
      <div class="icon-grid">
        ${iconCard("proposal", "One marriage proposal. Each Prince is 1, the Frog 5; you want as few as possible.", "Um pedido de casamento. Cada Príncipe é 1, o Sapo 5; você quer o mínimo possível.", [5, 6])}
        ${iconCard("proposal-mark", "Printed below the number of every card that adds proposals (the Princes and the Frog).", "Impressa abaixo do número de toda carta que soma pedidos (os Príncipes e o Sapo).", 6)}
        ${iconCard("pass-left", "On a Round card: pass that many cards to the player on your left at the start of the round.", "Numa carta de Rodada: passe essa quantidade de cartas ao jogador da esquerda no início da rodada.", [4, 8])}
        ${iconCard("pass-right", "On a Round card: pass that many cards to the player on your right. One arrow on each side of the number = 1 card each way.", "Numa carta de Rodada: passe essa quantidade de cartas ao jogador da direita. Uma seta de cada lado do número = 1 carta para cada lado.", [4, 8])}
        ${iconCard("hourglass", "On a Round card with a darker back: recommended only for the final round; also used for the tie-break round.", "Numa carta de Rodada de verso mais escuro: recomendada só para a rodada final; também usada na rodada de desempate.", [3, 7, 8])}
      </div>
      <div class="rp-art-row">${figure("frog", t("Rules PDF p. 6: the Frog — a bewitched Prince worth 5 proposals", "Regras PDF p. 6: o Sapo — um Príncipe enfeitiçado que vale 5 pedidos"))}</div>`;
  }

  // ---------- examples ----------

  function examplesSection() {
    return `
      ${sectionHeading("examples", t("Examples", "Exemplos"), sectionIndex("examples"), [5, 7, 8])}
      <div class="quick-grid rp-example-grid">
        <article class="info-card">
          <span class="component-label">${t("RULEBOOK EXAMPLE · 6 PLAYERS", "EXEMPLO DO LIVRO · 6 JOGADORES")}</span>
          <h3>${t("A trick", "Uma vaza")}</h3>
          ${figure("trick", t("Rules PDF p. 7: the six cards of the example trick, in playing order", "Regras PDF p. 7: as seis cartas da vaza de exemplo, na ordem de jogo"))}
          ${lineList([
            t("Kevin leads the 3 of Queens: the led suit is Queens.", "Kevin puxa o 3 de Rainhas: o naipe puxado é Rainhas."),
            t("Jay follows with the 7 of Queens.", "Jay segue com o 7 de Rainhas."),
            t("Renée has no Queens (void) and plays the 12 of Princes — a Prince has snuck into the party!", "Renée não tem Rainhas (sem o naipe) e joga o 12 de Príncipes — um Príncipe entrou de penetra!"),
            t("Antonia is also void and plays the 9 of Fairies.", "Antonia também está sem o naipe e joga o 9 de Fadas."),
            t("Ted has no Queens either and plays the 8 of Pets — the Frog.", "Ted também não tem Rainhas e joga o 8 de Bichos — o Sapo."),
            t("Ryan still has Queens, so he must follow suit: the 4 of Queens.", "Ryan ainda tem Rainhas, então precisa seguir: o 4 de Rainhas."),
            t("Jay wins with the highest Queen (7); higher cards of other suits do not count.", "Jay vence com a Rainha mais alta (7); cartas mais altas de outros naipes não contam."),
            t("At the end of the round this trick is 6 proposals for Jay: 1 for the 12 of Princes + 5 for the Frog.", "No fim da rodada esta vaza vale 6 pedidos para Jay: 1 pelo 12 de Príncipes + 5 pelo Sapo."),
            t("Jay then leads the next trick with the 10 of Pets, hoping to become the Rebel of the Ball by winning all the remaining proposals.", "Jay então puxa a próxima vaza com o 10 de Bichos, sonhando em ser a Rebelde do Baile ganhando todos os pedidos restantes.")
          ])}
          ${referenceLink(7)}
        </article>
        <article class="info-card">
          <span class="component-label">${t("RULEBOOK EXAMPLE · 6 PLAYERS", "EXEMPLO DO LIVRO · 6 JOGADORES")}</span>
          <h3>${t("Rebel of the Ball", "Rebelde do Baile")}</h3>
          ${lineList([
            t("6 players, Round card Once Upon a Time.", "6 jogadores, carta de Rodada Era uma Vez."),
            t("One player wins all 12 Princes and the Frog: normally 12 + 5 = 17 proposals.", "Um jogador ganha os 12 Príncipes e o Sapo: normalmente 12 + 5 = 17 pedidos."),
            t("As the Rebel of the Ball, their score for the round is −10, not +17.", "Como Rebelde do Baile, o resultado da rodada é −10, não +17."),
            state.players === 6 ? "" : t(`In your ${state.players}-player match there are ${deck().princes} Princes, so the normal total would be ${deck().princes + 5}.`, `Na sua partida de ${state.players} jogadores há ${deck().princes} Príncipes, então o total normal seria ${deck().princes + 5}.`)
          ])}
          ${referenceLink(5)}
        </article>
        <article class="info-card">
          <span class="component-label">${t("RULEBOOK EXAMPLE", "EXEMPLO DO LIVRO")}</span>
          <h3>${t("Passing with Arranged Marriage", "Passe com Casamento Arranjado")}</h3>
          ${lineList([
            t(`The symbol ${glyph("pass-left")}1${glyph("pass-right")} on card e means each player, before starting the round, must simultaneously give 1 card to the player on their left and another to the player on their right.`, `O símbolo ${glyph("pass-left")}1${glyph("pass-right")} na carta e quer dizer que cada jogador, antes de começar a rodada, precisa dar ao mesmo tempo 1 carta ao jogador da esquerda e outra ao da direita.`)
          ])}
          ${referenceLink(8)}
        </article>
      </div>`;
  }

  // ---------- guide's readings ----------

  function faqSection() {
    const items = [
      [t("Which Round cards have the black hourglass?", "Quais cartas de Rodada têm a ampulheta preta?"), t("The rulebook only says to look for the darker back and the black hourglass. Its pictures show it on e (Arranged Marriage), o (Wedding Gift) and t (Single Fairy); check the backs of your other cards.", "O livro só diz para procurar o verso mais escuro e a ampulheta preta. As figuras mostram-na em e (Casamento Arranjado), o (Presente de Casamento) e t (Fada Solteira); confira o verso das suas outras cartas."), 8],
      [t("Which way do the passes go on the other cards?", "Para que lado vão os passes nas outras cartas?"), t("Each Round card prints its own number and arrows. The guide only lists the passes visible in the rulebook's pictures (a, b, d, e, o, s, t); read the rest on the card.", "Cada carta de Rodada imprime o próprio número e setas. O guia só lista os passes visíveis nas figuras do livro (a, b, d, e, o, s, t); leia os outros na carta."), 4],
      [t("Who is the 6th player in a 6-player draft?", "Quem é o 6º jogador numa escolha com 6 jogadores?"), t("Not specified. Agree on anyone; that player chooses from the 5 Princesses put back in the centre.", "Não é especificado. Escolham qualquer um; esse jogador escolhe entre as 5 Princesas devolvidas ao centro."), 3],
      [t("Who deals from round 2 on?", "Quem distribui a partir da rodada 2?"), t("Not specified. Anyone may shuffle and deal all the cards; the starting player is decided by the scores, not by the dealer.", "Não é especificado. Qualquer um pode embaralhar e distribuir todas as cartas; quem começa é decidido pelos pontos, não por quem distribui."), 4],
      [t("Does Alice's trick get replayed?", "A vaza de Alice é jogada de novo?"), t("Her power text only says to deal the trick back. The Wedding Gift clarification adds that the trick is then redone with Alice leading; the guide applies that every time.", "O texto do poder só diz para devolver a vaza. O esclarecimento do Presente de Casamento acrescenta que a vaza é então refeita com Alice puxando; o guia aplica isso sempre."), 10],
      [t("Do Princes have to sneak in again each round?", "Os Príncipes precisam entrar de penetra de novo a cada rodada?"), t("Yes: the rulebook says Princes may be led “until the end of that round”, so each round starts with them uninvited.", "Sim: o livro diz que os Príncipes podem ser puxados “até o fim daquela rodada”, então cada rodada começa com eles não convidados."), 5],
      [t("With learning rounds, are Princesses still dealt?", "Com rodadas de aprendizado, as Princesas ainda são distribuídas?"), t("Yes. The rulebook only says you may ignore the powers in your first round(s); setup step 1 is unchanged.", "Sim. O livro só diz que você pode ignorar os poderes nas primeiras rodadas; o passo 1 da preparação não muda."), 6],
      [t("Who plays the tie-break round?", "Quem joga a rodada de desempate?"), t("Everyone: the rulebook notes the winner might not be one of the tied players, so all players play it and add it to their totals.", "Todos: o livro observa que quem vence pode não ser uma das empatadas, então todos a jogam e somam ao total."), 7]
    ];
    return `
      ${sectionHeading("faq", t("Guide's readings", "Leituras do guia"), sectionIndex("faq"), [3, 4, 7])}
      <p class="glossary-intro">${t("Where the rulebook is silent, this guide states its own reading, labelled as such. Readings tied to a single Round card or Princess are shown on that card.", "Onde o livro é omisso, este guia dá a sua própria leitura, identificada como tal. Leituras ligadas a uma única carta de Rodada ou Princesa aparecem nessa carta.")}</p>
      <div class="quick-grid">${items.map(([q, a, page]) => `
        <article class="info-card">
          <span class="component-label">${t("GUIDE'S READING", "LEITURA DO GUIA")}</span>
          <h3>${q}</h3>
          <p>${a}</p>
          ${referenceLink(page)}
        </article>`).join("")}</div>`;
  }

  // ---------- glossary ----------

  function glossarySection() {
    const visible = [
      { term: ["Trick", "Vaza"], text: ["One card played by each player, clockwise from the leader; the winner takes them face down.", "Uma carta jogada por cada jogador, em sentido horário a partir de quem puxa; quem vence as pega viradas para baixo."], page: 5 },
      { term: ["Led suit", "Naipe puxado"], text: ["The suit of the first card of a trick; others must follow it if they can.", "O naipe da primeira carta de uma vaza; os outros precisam segui-lo se puderem."], page: 5 },
      { term: ["Leading / starting player", "Quem puxa / quem começa"], text: ["The player who plays the first card of a trick: the winner of the previous trick, or the round's starting player.", "Quem joga a primeira carta de uma vaza: o vencedor da vaza anterior, ou quem começa a rodada."], page: 5 },
      { term: ["Void", "Sem o naipe"], text: ["Having no card of the led suit; you may then play any card.", "Não ter nenhuma carta do naipe puxado; você pode então jogar qualquer carta."], page: 5 },
      { term: ["Snuck in", "Entrar de penetra"], text: ["The moment a void player plays a Prince; from then until the round ends, Princes may be led.", "O momento em que um jogador sem o naipe joga um Príncipe; daí até o fim da rodada, Príncipes podem ser puxados."], page: 5 },
      { term: ["Marriage proposal", "Pedido de casamento"], text: ["The game's (bad) points: each Prince 1, the Frog 5. Fewest proposals wins.", "Os pontos (ruins) do jogo: cada Príncipe 1, o Sapo 5. Vence quem tiver menos pedidos."], page: 6 },
      { term: ["Frog", "Sapo"], text: ["The 8 of Pets, a bewitched Prince: 5 proposals. He is a Pet, so playing him does not let Princes sneak in.", "O 8 de Bichos, um Príncipe enfeitiçado: 5 pedidos. Ele é um Bicho, então jogá-lo não faz os Príncipes entrarem de penetra."], page: 6 },
      { term: ["Rebel of the Ball", "Rebelde do Baile"], text: ["Winning every Prince and the Frog in one round: exactly −10 proposals for that round.", "Ganhar todos os Príncipes e o Sapo numa rodada: exatamente −10 pedidos nessa rodada."], page: 5 },
      { term: ["Exhausted", "Esgotada"], text: ["A Princess turned face down after using her power; refreshed at the end of the round.", "Uma Princesa virada para baixo depois de usar o poder; renovada no fim da rodada."], page: 6 },
      { term: ["Round card", "Carta de Rodada"], text: ["One of 20 cards (a–t); each round's card sets the passing and a special rule.", "Uma de 20 cartas (a–t); a carta de cada rodada define o passe e uma regra especial."], page: 8 },
      { term: ["Black hourglass", "Ampulheta preta"], text: ["Mark of the dark-backed Round cards, recommended for the final round.", "Marca das cartas de Rodada de verso escuro, recomendadas para a rodada final."], page: 8 },
      { term: ["Suited cards", "Cartas de naipe"], text: ["The 48 Queen, Prince, Fairy and Pet cards (some removed with 3–5 players).", "As 48 cartas de Rainha, Príncipe, Fada e Bicho (algumas retiradas com 3–5 jogadores)."], page: 3 },
      firstGame() ? null : { term: ["Trump", "Trunfo"], text: ["A suit that beats the led suit; only under Royal Decree (Queens).", "Um naipe que vence o naipe puxado; só com o Decreto Real (Rainhas)."], page: 9 }
    ].filter(Boolean);
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), sectionIndex("glossary"), [5, 6, 8])}
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
    document.body.classList.add("theme-rebel-princess");
    document.documentElement.lang = state.language;
    document.title = t("Rebel Princess — Field Manual", "Rebel Princess — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Rebel Princess: a trick-taking game for 3–6 players — setup checklist by player count, tricks, Princes sneaking in, the Frog, Rebel of the Ball, scoring, all 10 Princess powers and the 20 Round cards.",
        "Regras interativas bilíngues de Rebel Princess: um jogo de vazas para 3–6 jogadores — lista de preparação por número de jogadores, vazas, Príncipes penetras, o Sapo, Rebelde do Baile, pontuação, os 10 poderes de Princesa e as 20 cartas de Rodada."
      );
    }

    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook", "Livro interativo")}</p>
          <h1>Rebel Princess</h1>
          <p class="hero-intro">${t(
            "Fairy-tale Princesses celebrate a 5-day party, and the uninvited Prince Charmings sneak in to propose. As a free and independent Princess, dodge the Princes — and the Frog — trick after trick. Who will stay single after the party?",
            "Princesas dos contos de fadas celebram uma festa de 5 dias, e os Príncipes Encantados não convidados entram de penetra para pedir a mão delas. Como uma Princesa livre e independente, fuja dos Príncipes — e do Sapo — vaza após vaza. Quem vai continuar solteira depois da festa?"
          )}</p>
          <div class="hero-meta"><span>${t("3–6 players", "3–6 jogadores")}</span><span>${t("Trick-taking", "Vazas")}</span><span>Bezier Games</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/rebel-princess.webp" alt="${t("Cover of the Rebel Princess rulebook", "Capa do livro de regras de Rebel Princess")}" fetchpriority="high"><figcaption>${t("Rulebook cover · Bezier Games", "Capa do livro de regras · Bezier Games")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("The ball", "O baile")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column rp-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied English rulebook of Rebel Princess (Bezier Games, 2025). The PDF shows two printed pages per PDF page, so the rulebook's own “p. 21” is PDF p. 11; every link here uses the PDF page. Points marked “Guide's reading” are interpretations where the rulebook is silent.",
            "Este guia cobre o livro de regras em inglês fornecido de Rebel Princess (Bezier Games, 2025). O PDF mostra duas páginas impressas por página do PDF, então a “p. 21” do próprio livro é a p. 11 do PDF; todos os links aqui usam a página do PDF. Trechos marcados como “Leitura do guia” são interpretações onde o livro é omisso."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${victorySection()}</section>
          <section class="rule-section">${roundsSection()}</section>
          <section class="rule-section">${tricksSection()}</section>
          <section class="rule-section">${scoringSection()}</section>
          <section class="rule-section">${princessesSection()}</section>
          <section class="rule-section">${roundCardsSection()}</section>
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${faqSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide based on the Rebel Princess rulebook. Rebel Princess is a game by Daniel Byrne, Gerardo Guerrero, Kevin Peláez and Tirso Virgós, illustrated by Alfredo Cáceres and published by Bezier Games; Rebel Princess is a trademark of Zombi Paella.",
        "Guia pessoal de consulta baseado no livro de regras de Rebel Princess. Rebel Princess é um jogo de Daniel Byrne, Gerardo Guerrero, Kevin Peláez e Tirso Virgós, ilustrado por Alfredo Cáceres e publicado pela Bezier Games; Rebel Princess é marca registrada da Zombi Paella."
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
      root.querySelector(".rp-page")?.prepend(notice);
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

  function onChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !root || !root.contains(target)) {
      return;
    }
    if (target.matches("[data-players]")) {
      const value = Number(target.dataset.players);
      if (PLAYERS.includes(value) && value !== state.players) {
        applyMatchChange({ players: value });
      }
      return;
    }
    if (target.matches("[data-rounds]")) {
      const value = Number(target.dataset.rounds);
      if (ROUNDS.includes(value) && value !== state.rounds) {
        applyMatchChange({ rounds: value });
      }
      return;
    }
    if (target.matches("[data-roundset]")) {
      const value = target.dataset.roundset;
      if (ROUND_SETS.includes(value) && value !== state.roundSet) {
        applyMatchChange({ roundSet: value });
      }
      return;
    }
    if (target.matches("[data-powers]")) {
      const value = target.dataset.powers;
      if (POWERS.includes(value) && value !== state.powers) {
        applyMatchChange({ powers: value });
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

  window.RebelPrincess = { renderInto, onClick, onChange };
})();
