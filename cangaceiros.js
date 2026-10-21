(() => {
  "use strict";

  const STORAGE_KEY = "field-manual.cangaceiros.v1";
  const MANUAL_FILE = "cangaceiros_core.pdf";

  let storageAvailable = true;
  let storageNotice = "";
  let root = null;

  function defaultState() {
    return {
      language: "pt-BR",
      playerCount: 4,
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
    if ([2, 3, 4, 5].includes(saved.playerCount)) {
      next.playerCount = saved.playerCount;
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
      console.error("Could not read Cangaceiros match settings.", error);
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
      console.error("Could not save Cangaceiros match settings.", error);
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
    return JSON.stringify({ playerCount: state.playerCount });
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

  function manualUrl(printedPage) {
    const script = document.querySelector('script[src*="cangaceiros.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${MANUAL_FILE}`, baseUrl).href}#page=${printedPage}`;
  }

  function referenceLink(printedPage) {
    const label = t(`Manual p. ${printedPage} ↗`, `Manual p. ${printedPage} ↗`);
    return `<a class="source-link" href="${escapeHtml(manualUrl(printedPage))}" target="_blank" rel="noreferrer">${label}</a>`;
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

  function storageNoticeText() {
    if (storageNotice === "read") {
      return t(
        "This browser could not read the saved Cangaceiros match. The guide is showing a new default match, and it may not be possible to save changes.",
        "Este navegador não conseguiu ler a partida salva de Cangaceiros. O guia está mostrando uma partida nova, e pode não ser possível salvar alterações."
      );
    }
    return t(
      "This browser refused to save the Cangaceiros match. Your latest change is on screen only.",
      "Este navegador recusou salvar a partida de Cangaceiros. A última alteração está só na tela."
    );
  }

  function derived() {
    const n = state.playerCount;
    const matchSize = n <= 3 ? "2-3" : "4-5";
    const rewardPerEvent = n <= 3 ? 1 : 2;
    return {
      n,
      matchSize,
      serraCards: n + 1,
      caatingaCards: n + 1,
      lifeGoalCards: n + 1,
      rewardPerEvent,
      totalReward: rewardPerEvent * 6
    };
  }

  // --- Icon paths -----------------------------------------------------

  const ICON = {
    movement: "assets/cangaceiros/movement.webp",
    garrison: "assets/cangaceiros/garrison.webp",
    training: "assets/cangaceiros/training.webp",
    plunder: "assets/cangaceiros/plunder.webp",
    cunning: "assets/cangaceiros/cunning.webp",
    attackVolantes: "assets/cangaceiros/attack-volantes.webp",
    reis: "assets/cangaceiros/reis.webp",
    guns: "assets/cangaceiros/guns.webp",
    facao: "assets/cangaceiros/facao.webp",
    protection: "assets/cangaceiros/protection.webp",
    deal: "assets/cangaceiros/deal.webp",
    vengeance: "assets/cangaceiros/vengeance.webp",
    heal: "assets/cangaceiros/heal.webp",
    blessing: "assets/cangaceiros/blessing.webp",
    removeFromGame: "assets/cangaceiros/remove-from-game.webp",
    volante: "assets/cangaceiros/volante.webp",
    cangaceiro: "assets/cangaceiros/cangaceiro.webp",
    ambush: "assets/cangaceiros/ambush.webp",
    famePoint: "assets/cangaceiros/fame-point.webp",
    actionCard: "assets/cangaceiros/action-card.webp",
    greenCard: "assets/cangaceiros/green-card.webp",
    brownCard: "assets/cangaceiros/brown-card.webp",
    brownOrGreenCard: "assets/cangaceiros/brown-or-green-card.webp",
    prison: "assets/cangaceiros/prison.webp",
    jailbreak: "assets/cangaceiros/jailbreak.webp",
    citySpace: "assets/cangaceiros/city-space.webp",
    serraSpace: "assets/cangaceiros/serra-space.webp",
    caatingaSpace: "assets/cangaceiros/caatinga-space.webp",
    sertaoSpace: "assets/cangaceiros/sertao-space.webp",
    wound: "assets/cangaceiros/wound.webp",
    immediatelyGain: "assets/cangaceiros/immediately-gain.webp",
    scout: "assets/cangaceiros/scout.webp",
    bounty: "assets/cangaceiros/bounty.webp",
    redNumbers: "assets/cangaceiros/red-numbers.webp",
    mossoro: "assets/cangaceiros/mossoro.webp",
    salgueiro: "assets/cangaceiros/salgueiro.webp",
    salvador: "assets/cangaceiros/salvador.webp",
    recife: "assets/cangaceiros/recife.webp",
    facaoToken: "assets/cangaceiros/facao-token.webp",
    dealToken: "assets/cangaceiros/deal-token.webp",
    vengeanceToken: "assets/cangaceiros/vengeance-token.webp",
    rewardTile: "assets/cangaceiros/reward-tile.webp",
    fazendaTile: "assets/cangaceiros/fazenda-tile.webp",
    eventTile: "assets/cangaceiros/event-tile.webp",
    volantesCard: "assets/cangaceiros/volantes-card.webp",
    serraCard: "assets/cangaceiros/serra-card.webp",
    caatingaCard: "assets/cangaceiros/caatinga-card.webp",
    lifeGoalCard: "assets/cangaceiros/life-goal-card.webp",
    chiefCard: "assets/cangaceiros/chief-card.webp",
    playerBoard: "assets/cangaceiros/player-board.webp",
    blessingToken: "assets/cangaceiros/blessing-token.webp"
  };

  // --- Reference data: Chiefs -------------------------------------------

  const CHIEFS = [
    ["Antônio Silvino",
      "When you attack the Recife Prison, you don't flip a Prison Reinforcements token. If you kill all of the defending Volantes (or there are none), you free Cangaceiros as normal and gain 1 extra Fame Point.",
      "Ao atacar a Prisão de Recife, você não vira uma ficha de Reforços da Prisão. Se eliminar todos os Volantes que defendem (ou não houver nenhum), liberte os Cangaceiros normalmente e ganhe 1 Ponto de Fama extra.",
      "Elected himself Governor of the Sertão and fought the corruption of the government for nearly twenty years before being captured.",
      "Autoproclamou-se Governador do Sertão e lutou contra a corrupção do governo por quase vinte anos antes de ser capturado."],
    ["Cabeleira",
      "When you take a Movement action, move your Gang up to 2 extra spaces. The presence of Volantes does not interfere with this movement.",
      "Ao realizar uma ação de Movimento, mova seu Bando até 2 espaços extras. A presença de Volantes não interfere nesse movimento.",
      "One of the very first cangaceiros, a great strategist who split his gang to attack on different fronts.",
      "Um dos primeiros cangaceiros, grande estrategista que dividia seu bando para atacar em frentes diferentes."],
    ["Cocada",
      "As a special action, you can discard an Action card instead of playing it to perform an Ambush action: remove 1 Volante or rival Garrison Cangaceiro from the space your Gang is in to gain 1 Fame Point. The Cangaceiro returns to its owner's reserve, or you keep the Volante as a trophy.",
      "Como ação especial, você pode descartar uma carta de Ação em vez de jogá-la para realizar uma ação de Emboscada: remova 1 Volante ou Cangaceiro de Guarnição rival do espaço do seu Bando para ganhar 1 Ponto de Fama. O Cangaceiro volta à reserva do dono, ou você guarda o Volante como troféu.",
      "Left Antônio Silvino's gang to lead his own; his own men eventually turned on him.",
      "Deixou o bando de Antônio Silvino para liderar o próprio; seus próprios homens acabaram se voltando contra ele."],
    ["Corisco",
      "When your Gang attacks the Volantes, draw 1 extra Reinforcements token, then discard 1 of your choice.",
      "Quando seu Bando ataca os Volantes, compre 1 ficha de Reforços extra e depois descarte 1 à sua escolha.",
      "Nicknamed \"The Blonde Devil\"; took over Lampião's gang after his death and died in battle without surrendering.",
      "Apelidado de \"O Diabo Louro\"; assumiu o bando de Lampião após sua morte e morreu em combate sem se render."],
    ["Dadá",
      "When you take a Plunder action, activate 1 additional Garrison.",
      "Ao realizar uma ação de Pilhagem, ative 1 Guarnição adicional.",
      "Loyal to Corisco until his death, skilled with guns in both hands; considered one of the greatest women of the cangaço.",
      "Leal a Corisco até sua morte, hábil com armas em ambas as mãos; considerada uma das maiores mulheres do cangaço."],
    ["Dulce",
      "In Salgueiro, you pay 1/3/5 Reis tokens to gain 1/4/6 Fame Points.",
      "Em Salgueiro, pague 1/3/5 fichas de Réis para ganhar 1/4/6 Pontos de Fama.",
      "The last cangaceira of Lampião's gang, she survived the massacre of Angico and later surrendered for a pardon.",
      "Última cangaceira do bando de Lampião, sobreviveu ao massacre de Angico e depois se rendeu em troca de perdão."],
    ["Esperança",
      "When your Gang is attacked by Volantes, you ignore 2 of them. For example, with up to 2 Volantes you suffer no wounds; with 3, you suffer 1 wound; with 4, you suffer 2 wounds.",
      "Quando seu Bando é atacado por Volantes, ignore 2 deles. Por exemplo: com até 2 Volantes você não sofre ferimentos; com 3, sofre 1 ferimento; com 4, sofre 2 ferimentos.",
      "Lampião's older brother, an expert in guerrilla warfare, killed by a stray bullet at a party.",
      "Irmão mais velho de Lampião, especialista em guerrilha, morto por uma bala perdida durante uma festa."],
    ["Gato",
      "If you take a Plunder action and receive a Facão bonus, you get 1 extra Cangaceiro.",
      "Se realizar uma ação de Pilhagem e receber um bônus de Facão, ganhe 1 Cangaceiro extra.",
      "Considered one of the cruelest cangaceiros; went mad when his beloved Inacinha was arrested.",
      "Considerado um dos cangaceiros mais cruéis; enlouqueceu quando sua amada Inacinha foi presa."],
    ["Inacinha",
      "When you take a Garrison action, instead of placing 1 Cangaceiro in the space with your Gang, you may place it in any Fazenda on the Map board.",
      "Ao realizar uma ação de Guarnição, em vez de colocar 1 Cangaceiro no espaço do seu Bando, você pode colocá-lo em qualquer Fazenda do tabuleiro.",
      "Gato's lover, charming and cunning; escaped prison while pregnant by winning the jailer's favor.",
      "Amante de Gato, charmosa e astuta; escapou da prisão grávida conquistando o favor do carcereiro."],
    ["Jararaca",
      "In Mossoró, you pay 1/3/5 total Deal/Vengeance tokens, in any combination, to gain 1/4/6 Fame Points.",
      "Em Mossoró, pague 1/3/5 fichas de Acordo/Vingança no total, em qualquer combinação, para ganhar 1/4/6 Pontos de Fama.",
      "Famous for the attack on the city of Mossoró; faced his execution smiling and joking.",
      "Famoso pelo ataque à cidade de Mossoró; enfrentou sua execução sorrindo e fazendo piadas."],
    ["Jesuíno Brilhante",
      "If you take a Plunder action and receive a Guns bonus, you get 1 extra Cangaceiro.",
      "Se realizar uma ação de Pilhagem e receber um bônus de Armas, ganhe 1 Cangaceiro extra.",
      "A romantic cangaceiro credited with giving birth to the cangaço in 1870; died in an ambush.",
      "Cangaceiro romântico, considerado o pai do cangaço em 1870; morreu em uma emboscada."],
    ["Juriti",
      "His firing power equals the sum of his Guns and Facão. During the Melee phase, his strength is 0.",
      "Seu poder de fogo é igual à soma de Armas e Facão. Durante a fase de Combate Corpo a Corpo, sua força é 0.",
      "Famous for his charm and cruelty; burned alive in the Caatinga after his capture.",
      "Famoso por seu charme e crueldade; queimado vivo na Caatinga após sua captura."],
    ["Lampião",
      "You can remove all 3 Training markers from his card with a single Training action.",
      "Você pode remover os 3 marcadores de Treinamento da carta dele com uma única ação de Treinamento.",
      "The undisputed King of the Sertão, betrayed and killed at Angico in 1938 alongside Maria Bonita.",
      "O indiscutível Rei do Sertão, traído e morto em Angico em 1938, ao lado de Maria Bonita."],
    ["Lídia",
      "When the Training marker is removed from her special ability space, you immediately gain 1 Cangaceiro to place in the line of your choice; every time you gain a Protection Cangaceiro you may place it in a line of your choice instead. As a special action, you can discard an Action card, instead of playing it, to heal 3 wounds.",
      "Quando o marcador de Treinamento é removido do espaço da habilidade especial dela, ganhe imediatamente 1 Cangaceiro para colocar na linha à sua escolha; toda vez que ganhar um Cangaceiro de Proteção, pode colocá-lo em qualquer linha à sua escolha. Como ação especial, você pode descartar uma carta de Ação, em vez de jogá-la, para curar 3 ferimentos.",
      "Beautiful and charming, she paid dearly for her romance with the violent José Baiano, who killed her.",
      "Bela e charmosa, pagou caro pelo romance com o violento José Baiano, que a matou."],
    ["Maria Bonita",
      "You can take a Cunning action on an Event even if there are no Reward tiles under it, collecting the bonus from any 1 discarded Reward tile of your choice.",
      "Você pode realizar uma ação de Astúcia em um Evento mesmo sem fichas de Recompensa sob ele, recolhendo o bônus de qualquer 1 ficha de Recompensa já descartada à sua escolha.",
      "The most famous woman of the cangaço, she joined Lampião out of love and died alongside him at Angico.",
      "A mulher mais famosa do cangaço, uniu-se a Lampião por amor e morreu ao lado dele em Angico."],
    ["Milian",
      "When you take a Plunder action in a space with a railroad, you gain 1 extra Reis token.",
      "Ao realizar uma ação de Pilhagem em um espaço com ferrovia, ganhe 1 ficha de Réis extra.",
      "A tribute to actor Tomás Milián, who played the cangaceiro Espedito in the 1969 film O Cangaceiro.",
      "Uma homenagem ao ator Tomás Milián, que interpretou o cangaceiro Espedito no filme O Cangaceiro, de 1969."],
    ["Ponto Fino",
      "In Salvador, you pay 1/3/5 Volante trophies to gain 1/4/6 Fame Points.",
      "Em Salvador, pague 1/3/5 troféus de Volante para ganhar 1/4/6 Pontos de Fama.",
      "Lampião's younger brother, extremely skilled with a gun; died at just 23 years old.",
      "Irmão mais novo de Lampião, extremamente habilidoso com armas; morreu com apenas 23 anos."],
    ["Volta Sêca",
      "You can use your base ability to discard an Action card, instead of playing it, to take a Movement, a Garrison, and a Plunder action, in any order.",
      "Você pode usar sua habilidade base para descartar uma carta de Ação, em vez de jogá-la, e realizar uma ação de Movimento, uma de Guarnição e uma de Pilhagem, em qualquer ordem.",
      "The youngest cangaceiro in Lampião's gang; later became a consultant for the film O Cangaceiro.",
      "O mais jovem cangaceiro do bando de Lampião; mais tarde se tornou consultor do filme O Cangaceiro."],
    ["Zabelê",
      "When the Training marker is removed from his special ability space, you immediately gain 1 Deal token. If you take a Plunder action and receive a Deal token, you receive an extra one.",
      "Quando o marcador de Treinamento é removido do espaço da habilidade especial dele, ganhe imediatamente 1 ficha de Acordo. Se realizar uma ação de Pilhagem e receber uma ficha de Acordo, ganhe uma extra.",
      "Survived the Angico massacre; legend says he turned into a bird (zabelê) and flew away, his body never found.",
      "Sobreviveu ao massacre de Angico; a lenda diz que virou um pássaro (zabelê) e voou, seu corpo nunca foi encontrado."],
    ["Zé Baiano",
      "When the Training marker is removed from his special ability space, you immediately gain 1 Vengeance token. If you take a Plunder action and receive a Vengeance token, you receive an extra one.",
      "Quando o marcador de Treinamento é removido do espaço da habilidade especial dele, ganhe imediatamente 1 ficha de Vingança. Se realizar uma ação de Pilhagem e receber uma ficha de Vingança, ganhe uma extra.",
      "Feared for his fighting prowess; after Lídia's death he grew even more ruthless, and died in an ambush.",
      "Temido por sua habilidade em combate; após a morte de Lídia tornou-se ainda mais implacável e morreu em uma emboscada."]
  ];

  // --- Reference data: Events --------------------------------------------

  const EVENTS = [
    ["Sargento Quelé", "Each Gang in a Sertão, Serra, or City space suffers 3 wounds.",
      "Cada Bando em um espaço de Sertão, Serra ou Cidade sofre 3 ferimentos."],
    ["Luger Parabellum", "Pay 2 Reis tokens for each Cangaceiro on your Player board on the Guns line. Lose 2 Fame Points for each such Cangaceiro you can't afford.",
      "Pague 2 fichas de Réis para cada Cangaceiro no seu tabuleiro na linha de Armas. Perca 2 Pontos de Fama para cada Cangaceiro que não puder pagar."],
    ["Facada", "Pay 2 Reis tokens for each Cangaceiro on your Player board on the Facão line. Lose 2 Fame Points for each such Cangaceiro you can't afford.",
      "Pague 2 fichas de Réis para cada Cangaceiro no seu tabuleiro na linha de Facão. Perca 2 Pontos de Fama para cada Cangaceiro que não puder pagar."],
    ["Procura-se", "Pay 2 Reis tokens for each of your Cangaceiros in the Recife Prison. Lose 2 Fame Points for each such Cangaceiro you can't afford.",
      "Pague 2 fichas de Réis para cada um dos seus Cangaceiros na Prisão de Recife. Perca 2 Pontos de Fama para cada Cangaceiro que não puder pagar."],
    ["Raso da Catarina", "If you don't have at least 2 Caatinga Action cards (counting hand, deck, and discard pile), you lose 4 Fame Points. Show the backs of those cards without moving them.",
      "Se você não tiver ao menos 2 cartas de Ação da Caatinga (contando mão, baralho e descarte), perca 4 Pontos de Fama. Mostre os versos dessas cartas sem movê-las."],
    ["Pedro Cândido — Traidor!", "Put all of your Garrisons currently in Caatinga and Sertão spaces in the Recife Prison.",
      "Coloque todas as suas Guarnições atualmente em espaços de Caatinga e Sertão na Prisão de Recife."],
    ["Matar os Macacos!", "If you don't have at least 3 Vengeance tokens on your Player board, you lose 4 Fame Points.",
      "Se você não tiver ao menos 3 fichas de Vingança no seu tabuleiro, perca 4 Pontos de Fama."],
    ["Corrupção", "If you don't have at least 3 Deal tokens on your Player board, you lose 4 Fame Points.",
      "Se você não tiver ao menos 3 fichas de Acordo no seu tabuleiro, perca 4 Pontos de Fama."],
    ["Coitamento", "Pay 2 Reis tokens for each Training marker on your Player board (not on your Chief card). Lose 2 Fame Points for each marker you can't afford.",
      "Pague 2 fichas de Réis para cada marcador de Treinamento no seu tabuleiro (não na carta de Chefe). Perca 2 Pontos de Fama para cada marcador que não puder pagar."],
    ["Sertão Perigoso", "If you don't have at least 1 Caatinga Action card and at least 1 Serra Action card, you lose 4 Fame Points. Show the backs of those cards without moving them.",
      "Se você não tiver ao menos 1 carta de Ação da Caatinga e ao menos 1 carta de Ação da Serra, perca 4 Pontos de Fama. Mostre os versos dessas cartas sem movê-las."],
    ["Bênção de Padre Cícero", "If you don't have at least 6 Cangaceiros on your Player board, you lose 4 Fame Points.",
      "Se você não tiver ao menos 6 Cangaceiros no seu tabuleiro, perca 4 Pontos de Fama."],
    ["Cala a Boca!", "Pay 2 Reis tokens for each of your Cangaceiros in a Garrison on the Map board. Lose 2 Fame Points for each Cangaceiro you can't afford.",
      "Pague 2 fichas de Réis para cada um dos seus Cangaceiros em uma Guarnição no tabuleiro. Perca 2 Pontos de Fama para cada Cangaceiro que não puder pagar."],
    ["Serra da Capivara", "If you don't have at least 2 Serra Action cards (counting hand, deck, and discard pile), you lose 4 Fame Points. Show the backs of those cards without moving them.",
      "Se você não tiver ao menos 2 cartas de Ação da Serra (contando mão, baralho e descarte), perca 4 Pontos de Fama. Mostre os versos dessas cartas sem movê-las."],
    ["Tocaia", "Put all of your Garrisons currently in Serra spaces in the Recife Prison. Each Gang in a Caatinga or City space suffers 3 wounds.",
      "Coloque todas as suas Guarnições atualmente em espaços de Serra na Prisão de Recife. Cada Bando em um espaço de Caatinga ou Cidade sofre 3 ferimentos."]
  ];

  // --- Reference data: Action cards --------------------------------------

  const SERRA_CARDS = [
    ["Remove a Fazenda", "Remover uma Fazenda", "Permanently remove from the game the Fazenda tile in the same space as your Gang (any Garrisons there remain). Gain 3 Fame Points, and your Gang suffers 2 wounds.",
      "Remova permanentemente do jogo a ficha de Fazenda no mesmo espaço do seu Bando (Guarnições ali permanecem). Ganhe 3 Pontos de Fama, e seu Bando sofre 2 ferimentos."],
    ["Reis per Cangaceiro", "Réis por Cangaceiro", "Gain 1 Reis token for each Cangaceiro on your Player board (not your Chief).",
      "Ganhe 1 ficha de Réis para cada Cangaceiro no seu tabuleiro (sem contar o Chefe)."],
    ["Triple Ambush", "Tripla Emboscada", "Your Gang suffers 1 wound. Take up to 3 Ambush actions: each removes 1 Volante or rival Garrison Cangaceiro from the space your Gang is in to gain 1 Fame Point (the Cangaceiro returns to its owner's reserve, or you keep the Volante as a trophy).",
      "Seu Bando sofre 1 ferimento. Realize até 3 ações de Emboscada: cada uma remove 1 Volante ou Cangaceiro de Guarnição rival do espaço do seu Bando para ganhar 1 Ponto de Fama (o Cangaceiro volta à reserva do dono, ou você guarda o Volante como troféu)."],
    ["Double Plunder", "Pilhagem Dupla", "Take a Plunder action, activating 2 different Fazendas (not Cities) anywhere on the Map board, regardless of the presence of your own or rival Gangs and Garrisons.",
      "Realize uma ação de Pilhagem, ativando 2 Fazendas diferentes (não Cidades) em qualquer lugar do tabuleiro, independentemente da presença de Bandos e Guarnições, seus ou rivais."],
    ["Move & Ambush", "Mover e Emboscar", "Take 2 Movement actions and 1 Ambush action (remove 1 Volante or rival Garrison Cangaceiro from the space your Gang is in to gain 1 Fame Point).",
      "Realize 2 ações de Movimento e 1 ação de Emboscada (remova 1 Volante ou Cangaceiro de Guarnição rival do espaço do seu Bando para ganhar 1 Ponto de Fama)."],
    ["Reis per Garrison", "Réis por Guarnição", "Gain 2 Reis tokens for each of your Cangaceiros in Garrisons on the Map board.",
      "Ganhe 2 fichas de Réis para cada um dos seus Cangaceiros em Guarnições no tabuleiro."],
    ["Trade for a Serra/Caatinga card", "Trocar por uma carta da Serra/Caatinga", "Choose a Starting Action card from your hand, deck, or discard pile, place it in the box, and take an available Serra or Caatinga Action card to replace it in the same position (hand, deck, or discard pile).",
      "Escolha uma carta de Ação Inicial da sua mão, baralho ou descarte, coloque-a na caixa, e pegue uma carta de Ação da Serra ou da Caatinga disponível para substituí-la, na mesma posição (mão, baralho ou descarte)."],
    ["Caatinga Garrison bonus", "Bônus de Guarnição na Caatinga", "Gain 1 Reis token and 1 Cangaceiro for each of your Cangaceiros in Garrisons in Caatinga spaces. Place the Reis token in your reserve and the Cangaceiro on a line of your choice on your Player board.",
      "Ganhe 1 ficha de Réis e 1 Cangaceiro para cada um dos seus Cangaceiros em Guarnições em espaços de Caatinga. Coloque a ficha de Réis na sua reserva e o Cangaceiro em uma linha à sua escolha no seu tabuleiro."]
  ];

  const CAATINGA_CARDS = [
    ["Take all Reis", "Tomar todos os Réis", "The target must give you all their Reis tokens.",
      "O alvo deve lhe entregar todas as fichas de Réis dele."],
    ["Take all Deal/Vengeance", "Tomar todo Acordo/Vingança", "The target must give you all their Deal and Vengeance tokens. Put any you can't place on your Player board back in the general reserve.",
      "O alvo deve lhe entregar todas as fichas de Acordo e Vingança dele. Devolva à reserva geral as que você não conseguir colocar no seu tabuleiro."],
    ["Send Garrisons to Prison", "Mandar Guarnições para a Prisão", "All of the target's Garrisons go to Prison. Move all of your own Cangaceiros from the Prison to the Protection line on your Player board (excess Cangaceiros go to your reserve).",
      "Todas as Guarnições do alvo vão para a Prisão. Mova todos os seus próprios Cangaceiros da Prisão para a linha de Proteção no seu tabuleiro (o excedente vai para a sua reserva)."],
    ["Swap Player boards' Cangaceiros", "Trocar Cangaceiros dos tabuleiros", "The target must place all of their Cangaceiros from their Player board, except the first column, back in their reserve. Take the same number of Cangaceiros from your reserve and place them on your Player board in the same positions.",
      "O alvo deve devolver à reserva todos os Cangaceiros do tabuleiro dele, exceto a primeira coluna. Pegue o mesmo número de Cangaceiros da sua reserva e coloque-os no seu tabuleiro nas mesmas posições."],
    ["Swap Serra/Caatinga card", "Trocar carta da Serra/Caatinga", "Choose 1 of the target's Serra or Caatinga Action cards and exchange it for any 1 of your Action cards, each card taking the position vacated by the other (hand, deck, or discard pile).",
      "Escolha 1 carta de Ação da Serra ou da Caatinga do alvo e troque-a por qualquer 1 das suas cartas de Ação, cada carta ocupando a posição deixada pela outra (mão, baralho ou descarte)."],
    ["Take all Volante trophies", "Tomar todos os troféus de Volante", "The target must give you all of the Volante trophies in their reserve.",
      "O alvo deve lhe entregar todos os troféus de Volante da reserva dele."],
    ["Full wounds swap", "Troca total de ferimentos", "The target must fill all of the wound spaces on their Chief card, and you remove all the Wound cubes from your own Chief card.",
      "O alvo deve preencher todos os espaços de ferimento da carta de Chefe dele, e você remove todos os cubos de ferimento da sua própria carta de Chefe."]
  ];

  const GLOSSARY_TERMS = [
    ["Fame Point", "Ponto de Fama", "The victory-point currency of Cangaceiros. Tracked on the Fame Point Track, which also sets your Chief's current bounty.",
      "A moeda de pontos de vitória de Cangaceiros. Marcada na Trilha de Pontos de Fama, que também define a recompensa atual do seu Chefe."],
    ["Bounty", "Recompensa", "The number of Fame Points you lose when your Chief dies, or when a Caatinga Action card forces you to choose that option. Read off the column to the left of your marker on the Fame Point Track (it rises with your Fame); minimum 1 once you have scored at least 1 Fame Point.",
      "O número de Pontos de Fama que você perde quando seu Chefe morre, ou quando uma carta de Ação da Caatinga o obriga a escolher essa opção. Lida na coluna à esquerda do seu marcador na Trilha de Pontos de Fama (ela sobe junto com sua Fama); mínimo 1 assim que tiver marcado ao menos 1 Ponto de Fama."],
    ["Reis", "Réis", "The in-game currency. Comes in 1 (silver) and 5 (gold) denominations, freely exchangeable at any time.",
      "A moeda do jogo. Vem em fichas de 1 (prata) e 5 (ouro), livremente trocáveis a qualquer momento."],
    ["Deal token", "Ficha de Acordo", "Spent as a free action to move a Volante 1 space per token, or at Mossoró (with Vengeance) to buy Fame Points, or for some Life Goals.",
      "Gasta como ação gratuita para mover um Volante 1 espaço por ficha, ou em Mossoró (junto com Vingança) para comprar Pontos de Fama, ou para alguns Objetivos de Vida."],
    ["Vengeance token", "Ficha de Vingança", "Spent right before drawing Reinforcements tokens for an attack on the Volantes to gain 1 extra Fame Point for each Volante killed in that fight, or at Mossoró (with Deal) to buy Fame Points, or for some Life Goals.",
      "Gasta bem antes de comprar as fichas de Reforços de um ataque aos Volantes para ganhar 1 Ponto de Fama extra por cada Volante eliminado naquela luta, ou em Mossoró (junto com Acordo) para comprar Pontos de Fama, ou para alguns Objetivos de Vida."],
    ["Garrison", "Guarnição", "A Cangaceiro left behind on the Map board (never in a City or in Juazeiro) to hold a space, gained via the Garrison action.",
      "Um Cangaceiro deixado no tabuleiro (nunca em uma Cidade ou em Juazeiro) para ocupar um espaço, obtido pela ação de Guarnição."],
    ["Gang", "Bando", "Your Gang meeple: the single piece that represents your whole group moving together on the Map board, as opposed to individual Garrison Cangaceiros.",
      "Seu meeple de Bando: a única peça que representa todo o seu grupo se movendo junto no tabuleiro, diferente dos Cangaceiros de Guarnição individuais."],
    ["Volante", "Volante", "An enemy law-enforcement unit represented by a black meeple. Volantes move and attack automatically during Phase 5.",
      "Uma unidade inimiga de repressão representada por um meeple preto. Os Volantes se movem e atacam automaticamente na Fase 5."],
    ["Reinforcements token", "Ficha de Reforços", "Drawn face down for each Volante (or Prison guard) involved in a fight; adds a hidden Guns/Protection/Facão bonus and a wound capacity to that unit.",
      "Comprada virada para baixo para cada Volante (ou guarda da Prisão) envolvido em uma luta; adiciona um bônus oculto de Armas/Proteção/Facão e uma capacidade de ferimento àquela unidade."],
    ["Training marker", "Marcador de Treinamento", "One of 3 markers placed on your Chief card at Setup, each blocking an ability, bonus, or wound space until removed with a Training action.",
      "Um dos 3 marcadores colocados na carta de Chefe na Preparação, cada um bloqueando uma habilidade, bônus ou espaço de ferimento até ser removido com uma ação de Treinamento."]
  ];

  // --- Build your match -------------------------------------------------

  function playerCountChoices() {
    return [2, 3, 4, 5].map((n) => {
      const matchSize = n <= 3 ? "2-3" : "4-5";
      const detail = t(
        `Map board and Fazenda tiles use their "${matchSize}" side; Volantes deck uses its "${matchSize}" front; ${n + 1} Serra, ${n + 1} Caatinga, and ${n + 1} Life Goal cards are drawn; ${n <= 3 ? 1 : 2} Reward tile(s) go under each of the 6 active Events.`,
        `O tabuleiro e as fichas de Fazenda usam o lado "${matchSize}"; o baralho de Volantes usa a frente "${matchSize}"; são compradas ${n + 1} cartas da Serra, ${n + 1} da Caatinga e ${n + 1} de Objetivo de Vida; ${n <= 3 ? 1 : 2} ficha(s) de Recompensa vão sob cada um dos 6 Eventos ativos.`
      );
      return `
      <label class="sniper-choice-card${state.playerCount === n ? " selected" : ""}">
        <input type="radio" name="cangaceiros-player-count" value="${n}" data-player-count ${state.playerCount === n ? "checked" : ""}>
        <span><strong>${t(`${n} players`, `${n} jogadores`)}</strong><small>${detail}</small></span>
      </label>`;
    }).join("");
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
    const d = derived();
    return `
      <section class="controls-panel" aria-labelledby="cangaceiros-match-title">
        <div class="panel-topline"><div><p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p><h2 id="cangaceiros-match-title">${t("Build your match", "Configure a partida")}</h2><p>${t(
          "Cangaceiros is played base-only in this guide (no expansions were supplied). The single choice the booklet asks before Setup is how many players are at the table, since it decides which side of several components to use and how many cards to draw.",
          "Este guia cobre Cangaceiros apenas com o jogo base (nenhuma expansão foi fornecida). A única escolha que o manual pede antes da Preparação é quantos jogadores estão à mesa, pois ela define qual lado de vários componentes usar e quantas cartas comprar."
        )}</p></div><span class="saved-label">${storageAvailable ? t("Saved locally", "Salvo localmente") : t("Not saved", "Não salvo")}</span></div>
        ${optionBlock(
          t("Number of players", "Número de jogadores"),
          t(
            "Choose the exact player count. 2 and 3 players share the same map side, Fazenda side, and Volantes deck front; 4 and 5 players share the other. The card-draw numbers below always scale with the exact count.",
            "Escolha o número exato de jogadores. 2 e 3 jogadores compartilham o mesmo lado do tabuleiro, das fichas de Fazenda e da frente do baralho de Volantes; 4 e 5 jogadores compartilham o outro lado. Os números de cartas compradas abaixo sempre acompanham a contagem exata."
          ),
          `<div class="sniper-choice-grid">${playerCountChoices()}</div>`,
          [5]
        )}
        <p class="optional-mode-note">${t(
          `Current match: ${d.n} players, "${d.matchSize}" side of the board/Fazendas/Volantes deck, ${d.serraCards} Serra cards, ${d.caatingaCards} Caatinga cards, ${d.lifeGoalCards} Life Goal cards, ${d.rewardPerEvent} Reward tile(s) per active Event (${d.totalReward} total).`,
          `Partida atual: ${d.n} jogadores, lado "${d.matchSize}" do tabuleiro/Fazendas/baralho de Volantes, ${d.serraCards} cartas da Serra, ${d.caatingaCards} cartas da Caatinga, ${d.lifeGoalCards} cartas de Objetivo de Vida, ${d.rewardPerEvent} ficha(s) de Recompensa por Evento ativo (${d.totalReward} no total).`
        )}</p>
      </section>`;
  }

  // --- Iconography --------------------------------------------------------

  function renderIcons() {
    const actionIcons = [
      [ICON.movement, t("Movement", "Movimento"), t("Move your Gang meeple to an adjacent space, or use a railroad between two Cities that share one, regardless of whether Volantes occupy the destination — the base rule has no restriction tied to Volante presence (some Chief abilities, like Cabeleira's extra movement, only restate this for emphasis). Entering a Caatinga space always costs your Gang exactly 1 wound, shown by its red border.", "Mova seu meeple de Bando para um espaço adjacente, ou use uma ferrovia entre duas Cidades que a compartilhem, não importa se há Volantes no destino — a regra base não tem nenhuma restrição ligada à presença de Volantes (algumas habilidades de Chefe, como o movimento extra de Cabeleira, só repetem isso por ênfase). Entrar em um espaço de Caatinga sempre custa exatamente 1 ferimento ao seu Bando, indicado pela borda vermelha.")],
      [ICON.garrison, t("Garrison", "Guarnição"), t("Place 1 Cangaceiro from your reserve in the space with your Gang (or remove 1, if shown in a red box). Never in Cities or in Juazeiro. If you ever need to place a Cangaceiro (Garrison, Cunning, Guns/Protection/Facão lines, etc.) but your reserve is empty, take one instead from one of your own Garrisons on the Map board or from your Player board — but NEVER from the Recife Prison or from an Event tile.", "Coloque 1 Cangaceiro da sua reserva no espaço do seu Bando (ou remova 1, se mostrado em uma caixa vermelha). Nunca em Cidades ou em Juazeiro. Se em algum momento precisar colocar um Cangaceiro (Guarnição, Astúcia, linhas de Armas/Proteção/Facão, etc.) e sua reserva estiver vazia, pegue um dos seus próprios Cangaceiros de uma Guarnição no tabuleiro ou do seu tabuleiro de jogador — mas NUNCA da Prisão de Recife nem de uma ficha de Evento.")],
      [ICON.training, t("Training", "Treinamento"), t("Move a Training marker from your Chief card to your Player board, unlocking the ability, bonus, and/or wound space it covered.", "Mova um marcador de Treinamento da carta de Chefe para o seu tabuleiro, desbloqueando a habilidade, bônus e/ou espaço de ferimento que ele cobria.")],
      [ICON.plunder, t("Plunder", "Pilhagem"), t("Activate the Fazenda/City in your Gang's own space, plus ONE more Fazenda (never a City) anywhere where you have the largest Garrison; you may freely choose which of the available bonuses to collect, in any order — you are never forced to take all of them.", "Ative a Fazenda/Cidade no espaço do seu Bando, mais UMA Fazenda a mais (nunca Cidade) em qualquer lugar onde você tem a maior Guarnição; você escolhe livremente quais dos bônus disponíveis recolher, em qualquer ordem — nunca é obrigado a receber todos.")],
      [ICON.cunning, t("Cunning", "Astúcia"), t("Take a Cangaceiro from your reserve and place it on an active Event tile that doesn't already hold one of your Cangaceiros (it stays there permanently, even after the Event resolves), discard 1 Reward tile from under it, and collect that tile's printed bonus. If an Event has no Reward tiles left under it, you CANNOT take Cunning on it at all (a few Chief abilities are a named exception to this). Placing a Cangaceiro this way also protects you from that Event's negative effect during Phase 4.", "Pegue um Cangaceiro da sua reserva e coloque-o em uma ficha de Evento ativa que ainda não tenha um Cangaceiro seu (ele fica lá permanentemente, mesmo depois do Evento ser resolvido), descarte 1 ficha de Recompensa de sob ela e recolha o bônus impresso nessa ficha. Se um Evento não tiver mais fichas de Recompensa sob ele, você NÃO PODE fazer Astúcia nele de forma alguma (algumas habilidades de Chefe são exceções nomeadas a isso). Colocar um Cangaceiro assim também te protege do efeito negativo desse Evento durante a Fase 4.")],
      [ICON.attackVolantes, t("Attack Volantes", "Atacar Volantes"), t("Start a fight (Shooting, then Melee) against every Volante in the space with your Gang.", "Inicie uma luta (Tiro, depois Corpo a Corpo) contra todos os Volantes no espaço do seu Bando.")],
      [ICON.ambush, t("Ambush", "Emboscada"), t("Remove 1 Volante (keep it as a trophy) or 1 rival Garrison Cangaceiro (it returns to its reserve) from your Gang's space, gaining 1 Fame Point.", "Remova 1 Volante (guarde-o como troféu) ou 1 Cangaceiro de Guarnição rival (ele volta à reserva) do espaço do seu Bando, ganhando 1 Ponto de Fama.")],
      [ICON.scout, t("Scout", "Batedor"), t("Place 1 Garrison Cangaceiro in any space of your choice on the Map board (except Cities and Juazeiro), even far from your Gang.", "Coloque 1 Cangaceiro de Guarnição em qualquer espaço à sua escolha no tabuleiro (exceto Cidades e Juazeiro), mesmo longe do seu Bando.")]
    ];
    const resourceIcons = [
      [ICON.reis, t("Reis", "Réis"), t("Gain 1 Reis token (or lose 1, if shown in a red box). Comes in 1 and 5 denominations, freely exchangeable.", "Ganhe 1 ficha de Réis (ou perca 1, se em caixa vermelha). Vem em fichas de 1 e de 5, livremente trocáveis.")],
      [ICON.guns, t("Guns", "Armas"), t("Place 1 Cangaceiro on the leftmost free space of the Guns line (max. 5) — or remove the rightmost 1, if shown in a red box.", "Coloque 1 Cangaceiro no espaço livre mais à esquerda da linha de Armas (máx. 5) — ou remova o mais à direita, se em caixa vermelha.")],
      [ICON.facao, t("Facão", "Facão"), t("Place 1 Cangaceiro on the leftmost free space of the Facão line (max. 5) — or remove the rightmost 1, if shown in a red box.", "Coloque 1 Cangaceiro no espaço livre mais à esquerda da linha de Facão (máx. 5) — ou remova o mais à direita, se em caixa vermelha.")],
      [ICON.protection, t("Protection", "Proteção"), t("Place 1 Cangaceiro on the leftmost free space of the Protection line (max. 5) — or remove the rightmost 1, if shown in a red box.", "Coloque 1 Cangaceiro no espaço livre mais à esquerda da linha de Proteção (máx. 5) — ou remova o mais à direita, se em caixa vermelha.")],
      [ICON.deal, t("Deal", "Acordo"), t("Gain 1 Deal token on the Deal line (max. 4). Spend tokens to move Volantes, to buy Fame at Mossoró, or for some Life Goals.", "Ganhe 1 ficha de Acordo na linha de Acordo (máx. 4). Gaste fichas para mover Volantes, comprar Fama em Mossoró, ou para alguns Objetivos de Vida.")],
      [ICON.vengeance, t("Vengeance", "Vingança"), t("Gain 1 Vengeance token on the Vengeance line (max. 4). Spend 1 before a fight to gain 1 Fame Point per Volante killed in it, or to buy Fame at Mossoró.", "Ganhe 1 ficha de Vingança na linha de Vingança (máx. 4). Gaste 1 antes de uma luta para ganhar 1 Ponto de Fama por Volante eliminado nela, ou para comprar Fama em Mossoró.")],
      [ICON.heal, t("Heal", "Curar"), t("Remove a Wound cube of your choice from your Chief card, reactivating the ability or bonus it covered.", "Remova um cubo de ferimento à sua escolha da carta de Chefe, reativando a habilidade ou bônus que ele cobria.")],
      [ICON.blessing, t("Blessing", "Bênção"), t("While taking a Plunder action in the grey Crossroads, swap the positions of 2 active Event tiles, then flip the Blessing token to its Heal-only side for the rest of the Round.", "Ao realizar uma ação de Pilhagem na Encruzilhada cinza, troque as posições de 2 fichas de Evento ativas e vire a ficha de Bênção para o lado só-Curar pelo resto da Rodada.")]
    ];
    const lifeGoalIcons = [
      [ICON.removeFromGame, t("Remove from the Game", "Remover do Jogo"), t("Place the resource behind the X permanently outside the game.", "Coloque o recurso atrás do X permanentemente fora do jogo.")],
      [ICON.volante, t("Volante (cost)", "Volante (custo)"), t("Remove a Volante trophy from your reserve.", "Remova um troféu de Volante da sua reserva.")],
      [ICON.cangaceiro, t("Cangaceiro (cost/gain)", "Cangaceiro (custo/ganho)"), t("Place 1 Cangaceiro on a Guns/Protection/Facão line of your choice (or remove 1, if in a red box).", "Coloque 1 Cangaceiro em uma linha de Armas/Proteção/Facão à sua escolha (ou remova 1, se em caixa vermelha).")],
      [ICON.famePoint, t("Fame Point", "Ponto de Fama"), t("Gain or lose the indicated Fame Points.", "Ganhe ou perca os Pontos de Fama indicados.")],
      [ICON.immediatelyGain, t("Immediately Gain", "Ganhe Imediatamente"), t("Immediately gain the resource shown inside the circle.", "Ganhe imediatamente o recurso mostrado dentro do círculo.")],
      [ICON.wound, t("Wound", "Ferimento"), t("Suffer a wound.", "Sofra um ferimento.")],
      [ICON.bounty, t("Bounty", "Recompensa"), t("Your current bounty, shown on the Fame Point Track.", "Sua recompensa atual, mostrada na Trilha de Pontos de Fama.")],
      [ICON.redNumbers, t("Red Numbers", "Números Vermelhos"), t("Show the number of resources that must be removed instead of gained.", "Mostram o número de recursos que devem ser removidos em vez de ganhos.")]
    ];
    const cardAndSpaceIcons = [
      [ICON.actionCard, t("Action Card", "Carta de Ação"), t("Any Starting, Serra, or Caatinga Action card.", "Qualquer carta de Ação Inicial, da Serra ou da Caatinga.")],
      [ICON.greenCard, t("Green Card", "Carta Verde"), t("A Caatinga Action card.", "Uma carta de Ação da Caatinga.")],
      [ICON.brownCard, t("Brown Card", "Carta Marrom"), t("A Serra Action card.", "Uma carta de Ação da Serra.")],
      [ICON.brownOrGreenCard, t("Brown or Green Card", "Carta Marrom ou Verde"), t("A Serra or Caatinga Action card.", "Uma carta de Ação da Serra ou da Caatinga.")],
      [ICON.prison, t("Prison", "Prisão"), t("The Recife City space, where captured Cangaceiros are sent.", "O espaço da Cidade de Recife, para onde vão os Cangaceiros capturados.")],
      [ICON.jailbreak, t("Jailbreak", "Fuga da Prisão"), t("Move 1 of your Cangaceiros from the Prison to the leftmost space on the Protection line.", "Mova 1 dos seus Cangaceiros da Prisão para o espaço mais à esquerda da linha de Proteção.")],
      [ICON.citySpace, t("City Space", "Espaço de Cidade"), t("One of the 4 City spaces: Recife, Salvador, Salgueiro, or Mossoró.", "Um dos 4 espaços de Cidade: Recife, Salvador, Salgueiro ou Mossoró.")],
      [ICON.serraSpace, t("Serra Space", "Espaço de Serra"), t("A brown space on the Map board.", "Um espaço marrom no tabuleiro.")],
      [ICON.caatingaSpace, t("Caatinga Space", "Espaço de Caatinga"), t("A green space on the Map board; entering one always wounds your Gang.", "Um espaço verde no tabuleiro; entrar nele sempre fere seu Bando.")],
      [ICON.sertaoSpace, t("Sertão Space", "Espaço de Sertão"), t("A yellow space on the Map board.", "Um espaço amarelo no tabuleiro.")]
    ];
    const citySection = [
      [ICON.mossoro, t("Mossoró", "Mossoró"), t("Pay 1/4/6 total Deal and/or Vengeance tokens, in any combination, to gain 1/3/5 Fame Points.", "Pague 1/4/6 fichas de Acordo e/ou Vingança no total, em qualquer combinação, para ganhar 1/3/5 Pontos de Fama.")],
      [ICON.salgueiro, t("Salgueiro", "Salgueiro"), t("Pay 1/4/6 Reis tokens to gain 1/3/5 Fame Points.", "Pague 1/4/6 fichas de Réis para ganhar 1/3/5 Pontos de Fama.")],
      [ICON.salvador, t("Salvador", "Salvador"), t("Pay 1/4/6 Volante trophies to gain 1/3/5 Fame Points.", "Pague 1/4/6 troféus de Volante para ganhar 1/3/5 Pontos de Fama.")],
      [ICON.recife, t("Recife", "Recife"), t("Can't be activated with Plunder. Attack it (like a Volante fight) to free prisoners; see Fazendas and Cities below.", "Não pode ser ativada com Pilhagem. Ataque-a (como uma luta contra Volante) para libertar prisioneiros; veja Fazendas e Cidades abaixo.")]
    ];
    return `
      ${sectionHeading("iconography", t("Iconography", "Iconografia"), "01", 16)}
      <p class="glossary-intro">${t(
        "These marks are cropped from the official rulebook. Individual Chief, Event, and Action card effects that are not spelled out below are printed on those cards; this guide reproduces their text in the matching sections further down.",
        "Estas marcas foram recortadas do manual oficial. Efeitos individuais de cartas de Chefe, Evento e Ação que não estão explicados abaixo estão impressos nas próprias cartas; este guia reproduz o texto delas nas seções correspondentes mais adiante."
      )}</p>
      <h3 class="subhead">${t("Actions", "Ações")}</h3>
      <div class="icon-grid">${actionIcons.map((item) => iconCard(...item)).join("")}</div>
      <h3 class="subhead">${t("Resources & Player board lines", "Recursos e linhas do tabuleiro")}</h3>
      <div class="icon-grid">${resourceIcons.map((item) => iconCard(...item)).join("")}</div>
      <h3 class="subhead">${t("Life Goal icons", "Ícones de Objetivo de Vida")}</h3>
      <div class="icon-grid">${lifeGoalIcons.map((item) => iconCard(...item)).join("")}</div>
      <h3 class="subhead">${t("Cards & map spaces", "Cartas e espaços do mapa")}</h3>
      <div class="icon-grid">${cardAndSpaceIcons.map((item) => iconCard(...item)).join("")}</div>
      <h3 class="subhead">${t("Cities", "Cidades")}</h3>
      <div class="icon-grid">${citySection.map((item) => iconCard(...item)).join("")}</div>
      <div class="source-note">${referenceLink(5)} ${referenceLink(6)} ${referenceLink(9)} ${referenceLink(16)}</div>`;
  }

  // --- Quick reference ------------------------------------------------------

  function jump(id, label) {
    return `<button type="button" data-scroll="${id}">${label}</button>`;
  }

  function quickReference() {
    const cards = [
      [t("The Round (6 phases)", "A Rodada (6 fases)"), t("1) Spawn new Volantes. 2) Choose 3 Action cards. 3) Play them, one at a time, starting from the Facão holder. 4) Resolve the current Event. 5) Activate the Volantes. 6) End of Round: pass the Facão, flip a new Volantes card.", "1) Surgem novos Volantes. 2) Escolha 3 cartas de Ação. 3) Jogue-as uma de cada vez, a partir de quem tem o Facão. 4) Resolva o Evento atual. 5) Ative os Volantes. 6) Fim da Rodada: passe o Facão, vire uma nova carta de Volantes."), "phases"],
      [t("Playing a card", "Jogando uma carta"), t("Each Action card has an upper part (attack the Volantes with your Gang) and a lower part (a special action). Use either, both, or neither, in any order.", "Cada carta de Ação tem uma parte superior (atacar os Volantes com seu Bando) e uma parte inferior (uma ação especial). Use uma, as duas, ou nenhuma, em qualquer ordem."), "phases"],
      [t("Attacking the Volantes", "Atacando os Volantes"), t("Align the card's Guns/Protection/Facão icons to your Player board. Shooting first (Guns vs. Protection both ways), then Melee if needed (Facão vs. Facão both ways). Wounds become dead Cangaceiros or Chief Wound cubes.", "Alinhe os ícones de Armas/Proteção/Facão da carta ao seu tabuleiro. Primeiro o Tiro (Armas vs. Proteção dos dois lados), depois o Corpo a Corpo se necessário (Facão vs. Facão dos dois lados). Ferimentos viram Cangaceiros mortos ou cubos de ferimento no Chefe."), "combat"],
      [t("Fazendas & Cities", "Fazendas e Cidades"), t("Plunder activates the Fazenda/City in your Gang's space plus 1 more Fazenda where you have the largest Garrison, collecting any bonuses shown.", "A Pilhagem ativa a Fazenda/Cidade no espaço do seu Bando mais 1 Fazenda onde você tem a maior Guarnição, recolhendo os bônus mostrados."), "fazendas-cities"],
      [t("Chiefs & Training", "Chefes e Treinamento"), t("Your Chief card hides 3 abilities/bonuses/wound spaces under Training markers; a Training action reveals one. If your Chief dies or retires, draft a new one.", "A carta de Chefe esconde 3 habilidades/bônus/espaços de ferimento sob marcadores de Treinamento; uma ação de Treinamento revela um. Se seu Chefe morre ou se aposenta, escolha um novo."), "chiefs"],
      [t("Life Goals & victory", "Objetivos de Vida e vitória"), t("With a fully trained Chief, pay the cost on an available Life Goal card to retire with Fame Points based on your Chief's wounds. The game ends after Round 7 or when no Life Goals remain; most Fame wins.", "Com o Chefe totalmente treinado, pague o custo de uma carta de Objetivo de Vida disponível para se aposentar ganhando Pontos de Fama conforme os ferimentos do seu Chefe. O jogo termina após a Rodada 7 ou quando não restarem Objetivos de Vida; vence quem tiver mais Fama."), "victory"]
    ];
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), "02", 6)}
      <div class="quick-grid">${cards.map(([title, body, target]) => `
        <article class="info-card"><h3>${title}</h3><p>${body}</p><p>${jump(target, t("Open the full rule", "Abrir a regra completa"))}</p></article>`).join("")}</div>
      <div class="callout">${t(
        "Caatinga spaces always inflict exactly 1 wound on your Gang the instant you enter them, as shown by their red border. Volantes attacks only ever target and wound ONE player per space, picking a Gang over a Garrison, and only ever wound the Chief (a Gang is never reduced to losing a Cangaceiro from the board from a Volantes attack).",
        "Espaços de Caatinga sempre infligem exatamente 1 ferimento ao seu Bando no instante em que você entra, como indicado pela borda vermelha. Ataques de Volantes sempre visam e ferem APENAS UM jogador por espaço, preferindo um Bando a uma Guarnição, e sempre ferem só o Chefe (um Bando nunca perde um Cangaceiro do tabuleiro por causa de um ataque de Volantes)."
      )}</div>`;
  }

  // --- Setup -----------------------------------------------------------------

  function task(id, textEn, textPt, optional) {
    return { id, en: textEn, pt: textPt, optional: Boolean(optional) };
  }

  function setupPhases() {
    const d = derived();
    const phases = [
      {
        title: t("Map board & Volantes deck", "Tabuleiro e baralho de Volantes"),
        refs: [5],
        items: [
          task("map-side", `Place the Map board in the middle of the table, with the "${d.matchSize}" side up for your ${d.n}-player match.`, `Coloque o tabuleiro no meio da mesa, com o lado "${d.matchSize}" para cima, para a sua partida de ${d.n} jogadores.`),
          task("volantes-deck", `Take the 6 Volantes cards with the "${d.matchSize}" number printed on the front; put the other 6 back in the box. Separate them by the figure count on their back (1, 2, or 3 Volantes). Shuffle and stack face down: the two 3-figure cards first, then the two 2-figure cards on top, then the two 1-figure cards on top — this is the Volantes deck. Do NOT flip its top card yet: the active card for Round 1 is the one printed directly on the Map board itself. The deck is only flipped starting at the End of Round 1 (see The Round, Phase 6), so it supplies the active card for Rounds 2–7.`, `Pegue as 6 cartas de Volantes com o número "${d.matchSize}" impresso na frente; devolva as outras 6 à caixa. Separe-as pela quantidade de figuras no verso (1, 2 ou 3 Volantes). Embaralhe e empilhe viradas para baixo: primeiro as duas cartas com 3 figuras, depois as duas com 2 figuras por cima, depois as duas com 1 figura por cima — isso forma o baralho de Volantes. NÃO vire a carta do topo ainda: a carta ativa da Rodada 1 é a que já está impressa no próprio tabuleiro. O baralho só é virado a partir do Fim da Rodada 1 (veja A Rodada, Fase 6), fornecendo a carta ativa das Rodadas 2 a 7.`)
        ]
      },
      {
        title: t("Action card supply", "Suprimento de cartas de Ação"),
        refs: [5],
        items: [
          task("serra-caatinga-draw", `Shuffle the Serra and the Caatinga Action cards separately. Draw ${d.serraCards} Serra cards and ${d.caatingaCards} Caatinga cards and place them face up in their designated spaces on the Map board. Put the rest back in the box.`, `Embaralhe as cartas de Ação da Serra e da Caatinga separadamente. Compre ${d.serraCards} cartas da Serra e ${d.caatingaCards} da Caatinga e coloque-as viradas para cima nos espaços designados do tabuleiro. Devolva o resto à caixa.`),
          task("reinforcements", "Shuffle the Prison Reinforcements and the Volantes Reinforcements tokens separately, and place the 2 piles face down next to the Map board.", "Embaralhe as fichas de Reforços da Prisão e de Reforços dos Volantes separadamente, e coloque as 2 pilhas viradas para baixo perto do tabuleiro."),
          task("chiefs-deck", "Shuffle the 20 Chief cards and place them face down in their dedicated space on the Map board.", "Embaralhe as 20 cartas de Chefe e coloque-as viradas para baixo no espaço dedicado do tabuleiro.")
        ]
      },
      {
        title: t("Event Track & Life Goals", "Trilha de Eventos e Objetivos de Vida"),
        refs: [5],
        items: [
          task("peace-tile", "Place the \"Peace\" tile with its active side up on the first (leftmost) space of the Event Track, at the top of the Map board.", "Coloque a ficha \"Paz\" com o lado ativo para cima no primeiro espaço (mais à esquerda) da Trilha de Eventos, no topo do tabuleiro."),
          task("event-tiles", "Shuffle the 14 Event tiles, draw 6, and place them with the active side up on the remaining Event Track spaces, 1 per space. Put the rest back in the box.", "Embaralhe as 14 fichas de Evento, compre 6 e coloque-as com o lado ativo para cima nos demais espaços da Trilha de Eventos, 1 por espaço. Devolva o resto à caixa."),
          task("life-goals", `Shuffle the Life Goal cards, draw ${d.lifeGoalCards}, and place them face up in their dedicated spaces on the Map board. Put the rest back in the box.`, `Embaralhe as cartas de Objetivo de Vida, compre ${d.lifeGoalCards} e coloque-as viradas para cima nos espaços dedicados do tabuleiro. Devolva o resto à caixa.`),
          task("reward-tiles", `Shuffle the Reward tiles and place them face up under the 6 active Event tiles: ${d.rewardPerEvent} under each (${d.totalReward} total). Put the rest back in the box.`, `Embaralhe as fichas de Recompensa e coloque-as viradas para cima sob as 6 fichas de Evento ativas: ${d.rewardPerEvent} sob cada uma (${d.totalReward} no total). Devolva o resto à caixa.`)
        ]
      },
      {
        title: t("Fazendas, Blessing & reserve", "Fazendas, Bênção e reserva"),
        refs: [5],
        items: [
          task("fazendas", `Shuffle the Fazenda tiles with the "${d.matchSize}" side on the back, and place them randomly: the 11 yellow tiles in Sertão spaces, the 3 brown tiles in Serra spaces, and the 3 green tiles in Caatinga spaces. Put the rest back in the box.`, `Embaralhe as fichas de Fazenda com o lado "${d.matchSize}" no verso, e coloque-as aleatoriamente: as 11 amarelas em espaços de Sertão, as 3 marrons em espaços de Serra, e as 3 verdes em espaços de Caatinga. Devolva o resto à caixa.`),
          task("blessing-token", "Place the Blessing token face up on the Map board, in the grey-colored Crossroads.", "Coloque a ficha de Bênção virada para cima no tabuleiro, na Encruzilhada de cor cinza."),
          task("general-reserve", "Put the Wound cubes, Volante meeples, and the Deal, Vengeance, and Reis tokens in a general reserve next to the Map board.", "Coloque os cubos de ferimento, os meeples de Volante e as fichas de Acordo, Vingança e Réis em uma reserva geral perto do tabuleiro.")
        ]
      },
      {
        title: t("Each player", "Cada jogador"),
        refs: [5],
        items: [
          task("color", "Choose a color and take all the components of that color.", "Escolha uma cor e pegue todos os componentes dessa cor."),
          task("player-board", "Place your Player board in front of you, with space to its right for a discard pile.", "Coloque seu tabuleiro de jogador à sua frente, com espaço à direita para o descarte."),
          task("chief-draft", "Draw 2 cards from the Chiefs deck, choose 1, and discard the other face down on the bottom of the deck. Place the chosen card face up in the Chief space on your Player board.", "Compre 2 cartas do baralho de Chefes, escolha 1 e descarte a outra virada para baixo no fundo do baralho. Coloque a carta escolhida virada para cima no espaço de Chefe do seu tabuleiro."),
          task("training-markers", "Place your 3 Training markers in the 3 spaces shown on your Chief card (each card is different) — those abilities, bonuses, or wound spaces are unavailable until Trained away.", "Coloque seus 3 marcadores de Treinamento nos 3 espaços mostrados na sua carta de Chefe (cada carta é diferente) — essas habilidades, bônus ou espaços de ferimento ficam indisponíveis até serem Treinados."),
          task("starting-deck", "Place your 7 Starting Action cards face down to the left of your Player board, forming your deck.", "Coloque suas 7 cartas de Ação Inicial viradas para baixo à esquerda do seu tabuleiro, formando seu baralho."),
          task("starting-reis", "Take 1 Reis token from the general reserve and place it next to your Player board.", "Pegue 1 ficha de Réis da reserva geral e coloque-a ao lado do seu tabuleiro."),
          task("prison-start", "Take one of your own Cangaceiros and place it on the Map board, in the Prison space in RECIFE. Keep your remaining 10 Cangaceiros in your personal reserve beside your Player board — none start on the Guns, Protection, or Facão lines; those lines all start empty.", "Pegue um dos seus próprios Cangaceiros e coloque-o no tabuleiro, no espaço da Prisão em RECIFE. Mantenha seus outros 10 Cangaceiros na sua reserva pessoal ao lado do tabuleiro — nenhum começa nas linhas de Armas, Proteção ou Facão; essas linhas começam todas vazias."),
          task("fame-start", "Place your Fame marker on space 4 of the Fame Point Track.", "Coloque seu marcador de Fama no espaço 4 da Trilha de Pontos de Fama."),
          task("gang-start", "Place your Gang meeple in the central space in JUAZEIRO.", "Coloque seu meeple de Bando no espaço central em JUAZEIRO.")
        ]
      },
      {
        title: t("First player", "Primeiro jogador"),
        refs: [5],
        items: [
          task("facao-token", "Give the Facão token to a randomly chosen player; they play first this Round.", "Entregue a ficha do Facão a um jogador escolhido aleatoriamente; ele joga primeiro nesta Rodada.")
        ]
      }
    ];
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
            <label for="setup-check-${item.id}">${t(item.en, item.pt)}${item.optional ? `<span class="setup-optional-label">${t("Conditional", "Condicional")}</span>` : ""}</label>
          </li>`).join("")}</ul>
      </article>`).join("");
    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), "03", 5)}
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
          "Changing the number of players clears this checklist, since it changes several quantities above. \u201cUncheck all\u201d clears only these boxes. Changing language does not.",
          "Mudar o número de jogadores limpa esta lista, pois isso muda várias quantidades acima. \u201cDesmarcar tudo\u201d limpa só estas caixas. Trocar o idioma não limpa."
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
    const d = derived();
    const cards = [
      inventoryCard(t("MAP", "MAPA"), t("1 double-sided board", "1 tabuleiro de 2 lados"), t(`1 double-sided Map board, used on its "${d.matchSize}" side for this match.`, `1 tabuleiro de 2 lados, usado no lado "${d.matchSize}" para esta partida.`), [3, 5]),
      inventoryCard(t("VOLANTES", "VOLANTES"), t("6 cards · 43 meeples", "6 cartas · 43 meeples"), t(`The 6 Volantes cards with "${d.matchSize}" on the front, stacked into 1 layered deck. 43 wooden Volante meeples and 10 Volantes Reinforcements tokens live in the general supply.`, `As 6 cartas de Volantes com "${d.matchSize}" na frente, empilhadas em 1 baralho estratificado. 43 meeples de Volante e 10 fichas de Reforços dos Volantes ficam na reserva geral.`), [3, 5]),
      inventoryCard(t("ACTION CARDS", "CARTAS DE AÇÃO"), t(`7 Starting (each) · ${d.serraCards} Serra · ${d.caatingaCards} Caatinga`, `7 Iniciais (cada) · ${d.serraCards} da Serra · ${d.caatingaCards} da Caatinga`), t("Each player's 7 Starting cards form their personal deck; the drawn Serra and Caatinga cards sit face up on the Map board, available to swap in during Phase 3.", "As 7 cartas Iniciais de cada jogador formam seu baralho pessoal; as cartas da Serra e da Caatinga compradas ficam viradas para cima no tabuleiro, disponíveis para trocar durante a Fase 3."), [3, 13]),
      inventoryCard(t("CHIEFS", "CHEFES"), t("20 cards · 1 face-down deck", "20 cartas · 1 baralho virado para baixo"), t("Shuffled face down; each player drafts 1 of 2 drawn cards at Setup, and again whenever their Chief dies or retires.", "Embaralhadas viradas para baixo; cada jogador escolhe 1 de 2 cartas compradas na Preparação, e de novo sempre que seu Chefe morre ou se aposenta."), [3, 9, 14, 15]),
      inventoryCard(t("EVENTS & LIFE GOALS", "EVENTOS E OBJETIVOS DE VIDA"), t(`6 Events + Peace tile · ${d.lifeGoalCards} Life Goals`, `6 Eventos + ficha Paz · ${d.lifeGoalCards} Objetivos de Vida`), t("The Event Track has 7 spaces: the fixed \"Peace\" tile first, then 6 randomly drawn Event tiles.", "A Trilha de Eventos tem 7 espaços: a ficha fixa \"Paz\" primeiro, depois 6 fichas de Evento sorteadas."), [3, 5, 12]),
      inventoryCard(t("REWARD TILES", "FICHAS DE RECOMPENSA"), t(`${d.totalReward} of 16 used`, `${d.totalReward} de 16 usadas`), t("Placed under active Events; their printed bonus (read directly off the tile) is collected via a Cunning action.", "Colocadas sob os Eventos ativos; o bônus impresso (lido diretamente na ficha) é recolhido com uma ação de Astúcia."), [3, 5, 6]),
      inventoryCard(t("FAZENDAS", "FAZENDAS"), t("17 tiles (11/3/3)", "17 fichas (11/3/3)"), t("11 yellow (Sertão), 3 brown (Serra), 3 green (Caatinga) — all placed, each with a side for this match's player-count bracket.", "11 amarelas (Sertão), 3 marrons (Serra), 3 verdes (Caatinga) — todas colocadas, cada uma com um lado para a faixa de jogadores desta partida."), [3, 5, 9]),
      inventoryCard(t("PER PLAYER", "POR JOGADOR"), t("Board, 7 cards, meeples, markers", "Tabuleiro, 7 cartas, meeples, marcadores"), t("1 Player board, 3 Training markers, 1 Gang meeple, 11 Cangaceiro meeples, 1 Fame marker, and 7 Starting Action cards, all in your chosen color.", "1 tabuleiro de jogador, 3 marcadores de Treinamento, 1 meeple de Bando, 11 meeples de Cangaceiro, 1 marcador de Fama e 7 cartas de Ação Inicial, tudo na cor escolhida."), [3, 4])
    ];
    return `<div class="quick-grid">${cards.join("")}</div>`;
  }

  // --- Phases (round structure) ----------------------------------------------

  function phasesSection() {
    return `
      ${sectionHeading("phases", t("The Round", "A Rodada"), "04", 6)}
      <p class="glossary-intro">${t(
        "Cangaceiros lasts at most 7 Rounds, each with 6 phases resolved in order by every player before moving to the next phase.",
        "Cangaceiros dura no máximo 7 Rodadas, cada uma com 6 fases resolvidas em ordem por todos os jogadores antes de passar para a próxima."
      )}</p>
      <div class="turn-block"><h3>${t("1) Spawn New Volantes", "1) Surgem Novos Volantes")}</h3>
        <p>${t("Place new Volantes in the Cities shown on the top-left of the active (face-up) Volantes card.", "Coloque novos Volantes nas Cidades mostradas no canto superior esquerdo da carta de Volantes ativa (virada para cima).")}</p>
        ${referenceLink(6)}
      </div>
      <div class="turn-block"><h3>${t("2) Choose Action Cards", "2) Escolher Cartas de Ação")}</h3>
        <p>${t("Simultaneously, every player picks up their own face-down deck (to the left of their Player board), looks through all the cards in it, and freely CHOOSES 3 of them as their hand for this Round — choice is always open information; cards are never drawn blind or at random. If your deck has fewer than 3 cards, choose all of them, then shuffle your face-up discard pile, turn it face down to become your new deck, and choose enough additional cards from it to reach exactly 3. You always have exactly 7 cards total, split across your hand (the 3 chosen), deck, and discard pile.", "Simultaneamente, cada jogador pega seu próprio baralho virado para baixo (à esquerda do tabuleiro), olha todas as cartas nele e ESCOLHE livremente 3 delas como sua mão para esta Rodada — a escolha é sempre informação aberta; as cartas nunca são compradas às cegas ou por sorteio. Se seu baralho tiver menos de 3 cartas, escolha todas elas, depois embaralhe seu descarte virado para cima, vire-o para baixo para virar seu novo baralho, e escolha cartas suficientes dele para chegar a exatamente 3. Você sempre tem exatamente 7 cartas no total, divididas entre sua mão (as 3 escolhidas), o baralho e o descarte.")}</p>
        ${referenceLink(6)}
      </div>
      <div class="turn-block"><h3>${t("3) Play Action Cards", "3) Jogar Cartas de Ação")}</h3>
        <p>${t("Starting from the Facão holder and going clockwise, each player plays 1 of their 3 chosen cards per turn, applying its effects, then places that card FACE UP on top of their own discard pile (to the right of their Player board), until all players have played all 3. After playing your third (last) card, your hand is empty: if your Gang is in a Serra or Caatinga space, you may now replace one Starting Action card sitting in your deck or discard pile with an available Serra or Caatinga card of the matching color on the Map board, which takes the exact same position (deck or discard pile) the replaced card had. The replaced Starting card goes permanently into the box (it's out of the game for good); the Map board's face-up Serra/Caatinga supply is never refilled, so it only shrinks as players take cards from it over the course of the game.", "A partir de quem tem o Facão e em sentido horário, cada jogador joga 1 das 3 cartas escolhidas por vez, aplicando os efeitos, depois coloca essa carta VIRADA PARA CIMA no topo do seu próprio descarte (à direita do seu tabuleiro), até todos terem jogado as 3. Depois de jogar sua terceira (última) carta, sua mão fica vazia: se seu Bando estiver em um espaço de Serra ou Caatinga, você pode agora substituir uma carta de Ação Inicial que esteja no seu baralho ou descarte por uma carta da Serra ou da Caatinga disponível da cor correspondente no tabuleiro, que ocupa exatamente a mesma posição (baralho ou descarte) que a carta substituída tinha. A carta Inicial substituída vai para a caixa permanentemente (sai do jogo de vez); a oferta de cartas da Serra/Caatinga viradas para cima no tabuleiro nunca é reposta, então ela só diminui conforme os jogadores pegam cartas dela ao longo da partida.")}</p>
        ${referenceLink(6)} ${referenceLink(13)}
      </div>
      <div class="turn-block"><h3>${t("4) Resolve Current Event", "4) Resolver Evento Atual")}</h3>
        <p>${t("Starting from the Facão holder, each player who does NOT have a Cangaceiro on the current (leftmost face-up) active Event suffers its effect. Then flip that Event tile (face down/inactive) and it no longer applies.", "A partir de quem tem o Facão, cada jogador que NÃO tiver um Cangaceiro no Evento atual (o virado para cima mais à esquerda) sofre o efeito dele. Depois vire essa ficha de Evento (para baixo/inativa), e ela deixa de valer.")}</p>
        ${referenceLink(7)} ${referenceLink(12)}
      </div>
      <div class="turn-block"><h3>${t("5) Activate Volantes", "5) Ativar Volantes")}</h3>
        <p>${t("Each Volante with a target (a Gang or Garrison) already in its space stays put; one adjacent to a target moves into that target's space (preferring a Gang over a Garrison); one without any target follows the printed arrows. If several targets are possible, they prefer the player with the most Fame Points (the Facão holder decides ties). After moving (or not), every Volante with a target attacks it: attacking a Gang wounds its Chief; attacking a Garrison sends its Cangaceiros to the Recife Prison.", "Cada Volante que já tem um alvo (Bando ou Guarnição) no seu espaço fica parado; um adjacente a um alvo se move para o espaço dele (preferindo um Bando a uma Guarnição); um sem alvo algum segue as setas impressas. Se houver vários alvos possíveis, prefere-se o jogador com mais Pontos de Fama (quem tem o Facão decide empates). Depois de se mover (ou não), todo Volante com alvo ataca: atacar um Bando fere o Chefe dele; atacar uma Guarnição manda os Cangaceiros dela para a Prisão de Recife.")}</p>
        <p>${t("Volantes never enter the central Juazeiro space, and never enter Caatinga spaces except during Rounds 5, 6, and 7.", "Os Volantes nunca entram no espaço central de Juazeiro, e nunca entram em espaços de Caatinga, exceto durante as Rodadas 5, 6 e 7.")}</p>
        <p>${t("The exact number of wounds or arrests is fixed by how many Volantes are attacking: see the outcome table and Corruption (bribing with Reis to remove attackers) under Victory & Scoring.", "O número exato de ferimentos ou prisões é fixado pela quantidade de Volantes atacando: veja a tabela de resultado e a Corrupção (subornar com Réis para remover atacantes) em Vitória e Pontuação.")} ${jump("victory", t("Open the outcome table", "Abrir a tabela de resultado"))} ${jump("combat", t("Open Corruption", "Abrir Corrupção"))}</p>
        ${referenceLink(7)}
      </div>
      <div class="turn-block"><h3>${t("6) End of Round", "6) Fim da Rodada")}</h3>
        <p>${t("Pass the Facão token to the next player clockwise, flip the top card of the Volantes deck face up (this is now the active Volantes card), and, if the Blessing token is face down, flip it face up again.", "Passe a ficha do Facão para o próximo jogador em sentido horário, vire a carta do topo do baralho de Volantes para cima (ela agora é a carta de Volantes ativa) e, se a ficha de Bênção estiver virada para baixo, vire-a para cima de novo.")}</p>
        ${referenceLink(8)}
      </div>`;
  }

  // --- Combat ------------------------------------------------------------------

  function combatSection() {
    return `
      ${sectionHeading("combat", t("Attacking the Volantes", "Atacando os Volantes"), "05", 10)}
      <p class="glossary-intro">${t(
        "Playing a card's upper (ATTACK) part always grants you BOTH a Movement action AND an attack on the Volantes in your (new or current) space, usable in either order, each independently optional — this free move is separate from, and in addition to, any Movement icon that might appear on that same card's lower (ACTION) part. To attack: align the card's Guns/Protection/Facão bonus icons to your Player board lines and draw 1 Reinforcements token per Volante present, placing each next to the active Volantes card.",
        "Jogar a parte superior (ATAQUE) de uma carta sempre concede TANTO uma ação de Movimento QUANTO um ataque aos Volantes no seu espaço (novo ou atual), usáveis em qualquer ordem, cada um opcional de forma independente — esse movimento gratuito é separado, e somado a, qualquer ícone de Movimento que apareça na parte inferior (AÇÃO) dessa mesma carta. Para atacar: alinhe os ícones de bônus de Armas/Proteção/Facão da carta às linhas do seu tabuleiro e compre 1 ficha de Reforços por Volante presente, colocando cada uma ao lado da carta de Volantes ativa."
      )}</p>
      <div class="action-grid">
        <article class="action-card"><strong>${t("A) Shooting", "A) Tiro")}</strong><p>${t(
          "Both directions below use each side's FULL stats as they stood at the start of this Shooting phase — wounds inflicted by one direction never reduce the other direction's firing power or defense within the same phase, even if a Volante dies partway through. Your firing power = Chief's Guns + any Guns bonus on the played card + 1 per Cangaceiro on your Guns line. Volantes' defense = Protection on the active Volantes card + Protection bonuses on their Reinforcements tokens. If your power exceeds their defense, inflict a wound per point of difference: take 1 Wound cube per inflicted wound and fill the Volantes' wound spaces on the Map board top-to-bottom, left-to-right (this fixed order decides which Reinforcements token/Volante dies first when there is more than one). Then compare the Volantes' Guns (card + token bonuses) against your Protection (Chief + card bonus + Cangaceiros on your Protection line): if theirs is greater, your Gang suffers a wound per point of difference — lose a Cangaceiro, or wound the Chief. Only once BOTH directions have been resolved does the game check whether the fight is over.",
          "As duas direções abaixo usam os valores COMPLETOS de cada lado como estavam no início desta fase de Tiro — ferimentos infligidos em uma direção nunca reduzem o poder de fogo ou a defesa da outra direção dentro da mesma fase, mesmo que um Volante morra no meio do processo. Seu poder de fogo = Armas do Chefe + bônus de Armas da carta jogada + 1 por Cangaceiro na sua linha de Armas. A defesa dos Volantes = Proteção da carta de Volantes ativa + bônus de Proteção nas fichas de Reforços deles. Se seu poder superar a defesa deles, inflija 1 ferimento por ponto de diferença: pegue 1 cubo de ferimento por ferimento infligido e preencha os espaços de ferimento dos Volantes no tabuleiro de cima para baixo, da esquerda para a direita (essa ordem fixa decide qual ficha de Reforços/Volante morre primeiro quando há mais de um). Depois compare as Armas dos Volantes (carta + bônus das fichas) com sua Proteção (Chefe + bônus da carta + Cangaceiros na sua linha de Proteção): se a deles for maior, seu Bando sofre 1 ferimento por ponto de diferença — perca um Cangaceiro, ou fira o Chefe. Só depois de resolver AMBAS as direções é que se verifica se a luta terminou."
        )}</p></article>
        <article class="action-card"><strong>${t("B) Melee", "B) Corpo a Corpo")}</strong><p>${t(
          "Only if the fight isn't already over (every attacked Volante dead, or your Chief dead). Melee recalculates both sides' stats fresh, as they stand right now — AFTER any Cangaceiro or Chief wound you already assigned during this same fight's Shooting phase, so a Cangaceiro lost from your Facão line during Shooting already counts against your Melee strength below. Unlike Shooting, Melee does NOT subtract a defense stat — each side simply inflicts wounds equal to its own full Facão strength: your strength = Chief's Facão + Facão bonus on the card + 1 per Cangaceiro on your Facão line, and you inflict exactly that many wounds on the Volantes. The Volantes' strength = Facão on the active Volantes card + Facão bonuses on their Reinforcements tokens, and your Gang suffers exactly that many wounds. Both sides apply their wound cubes using the same placement method as in Shooting (top-to-bottom/left-to-right on the Map board for Volantes; lose a Cangaceiro or wound the Chief for your Gang).",
          "Só se a luta ainda não tiver acabado (todos os Volantes atacados mortos, ou seu Chefe morto). O Corpo a Corpo recalcula os valores dos dois lados do zero, como eles estão agora — DEPOIS de qualquer ferimento (em Cangaceiro ou Chefe) que você já tenha atribuído durante o Tiro dessa mesma luta, então um Cangaceiro perdido da sua linha de Facão durante o Tiro já conta contra sua força de Corpo a Corpo abaixo. Diferente do Tiro, o Corpo a Corpo NÃO subtrai um valor de defesa — cada lado simplesmente inflige ferimentos iguais à sua própria força total de Facão: sua força = Facão do Chefe + bônus de Facão da carta + 1 por Cangaceiro na sua linha de Facão, e você inflige exatamente esse tanto de ferimentos nos Volantes. A força dos Volantes = Facão da carta de Volantes ativa + bônus de Facão nas fichas de Reforços deles, e seu Bando sofre exatamente esse tanto de ferimentos. Os dois lados aplicam seus cubos de ferimento usando o mesmo método do Tiro (de cima para baixo/esquerda para a direita no tabuleiro para os Volantes; perder um Cangaceiro ou ferir o Chefe para o seu Bando)."
        )}</p></article>
      </div>
      <h3 class="subhead">${t("Wounds", "Ferimentos")}</h3>
      <p>${t(
        "This is the ONE wound-resolution mechanic used everywhere in the game whenever your Gang \"suffers a wound\" — in a fight against the Volantes or the Recife Prison, from entering a Caatinga space, from an Event, or from a card cost. For each such wound, choose: remove the rightmost Cangaceiro from any one of your Player board lines and place it in your personal reserve (it is not lost from the game — you can place it again later via Garrison, Plunder bonuses, etc.), OR place a Wound cube in a free wound space on your Chief card (cancelling the ability/bonus it covers; if no free wound space remains, your Chief dies). You must assign all wounds you suffer if at all possible; you cannot let your Chief die while ignoring excess wounds that could go to a Cangaceiro instead. The ONLY exception is during Phase 5 (Volantes attacking a Gang): there, you can only ever wound the Chief, never a Cangaceiro — this Phase 5 restriction does not apply anywhere else.",
        "Esse é o ÚNICO mecanismo de resolução de ferimento usado em todo o jogo sempre que seu Bando \"sofre um ferimento\" — em uma luta contra os Volantes ou a Prisão de Recife, ao entrar em um espaço de Caatinga, por causa de um Evento, ou por custo de uma carta. Para cada ferimento desses, escolha: remover o Cangaceiro mais à direita de qualquer uma das linhas do seu tabuleiro e colocá-lo na sua reserva pessoal (ele não sai do jogo — você pode colocá-lo de novo depois via Guarnição, bônus de Pilhagem, etc.), OU colocar um cubo de ferimento em um espaço livre de ferimento na carta de Chefe (cancelando a habilidade/bônus que ele cobre; se não houver mais espaço livre, seu Chefe morre). Você deve atribuir todos os ferimentos sofridos sempre que possível; não pode deixar o Chefe morrer ignorando ferimentos excedentes que poderiam ir para um Cangaceiro. A ÚNICA exceção é durante a Fase 5 (ataque dos Volantes a um Bando): ali, só o Chefe pode ser ferido, nunca um Cangaceiro — essa restrição da Fase 5 não vale em nenhuma outra situação."
      )}</p>
      <h3 class="subhead">${t("End of the fight", "Fim da luta")}</h3>
      <p>${t(
        "For each wound cube filling a skull space above a Reinforcements token, that Volante dies: take it as a trophy into your reserve (even if your Chief died) and gain Fame Points by round (0 in Rounds 1–3, 1 in Rounds 4–5, 2 in Rounds 6–7, as shown on the active Volantes card). Spending 1 Vengeance token right before drawing the Reinforcements tokens for that fight ADDS 1 extra flat Fame Point for EACH Volante killed in that fight, on top of the per-round value above (so in Rounds 1–3, where the base value is 0, each kill is still worth exactly 1 Fame Point from the Vengeance token, not 0). Wound cubes on Volantes return to the reserve; used Reinforcements tokens are shuffled face down back into their pile.",
        "Para cada cubo de ferimento preenchendo um espaço de caveira acima de uma ficha de Reforços, aquele Volante morre: pegue-o como troféu na sua reserva (mesmo que seu Chefe tenha morrido) e ganhe Pontos de Fama conforme a rodada (0 nas Rodadas 1–3, 1 nas Rodadas 4–5, 2 nas Rodadas 6–7, como mostrado na carta de Volantes ativa). Gastar 1 ficha de Vingança bem antes de comprar as fichas de Reforços daquela luta ADICIONA 1 Ponto de Fama fixo extra para CADA Volante morto naquela luta, somado ao valor por rodada acima (então nas Rodadas 1–3, onde o valor base é 0, cada morte ainda vale exatamente 1 Ponto de Fama pela ficha de Vingança, não 0). Cubos de ferimento nos Volantes voltam à reserva; fichas de Reforços usadas são embaralhadas de volta na pilha, viradas para baixo."
      )}</p>
      <h3 class="subhead">${t("Corruption: bribing the Volantes", "Corrupção: subornando os Volantes")}</h3>
      <p>${t(
        "During Phase 5 (Activate Volantes), if your Gang or Garrison is about to be attacked, you can corrupt the attackers to avoid part or all of the attack: for each Reis token you spend (any denomination; 1 token prevents 1 Volante, regardless of its value), 1 Volante in that space is removed from the attack. Uncorrupted Volantes still attack normally. This is the only way to reduce a Phase 5 attack — there is no card or action needed, just pay Reis as the attack happens.",
        "Durante a Fase 5 (Ativar Volantes), se seu Bando ou Guarnição está prestes a ser atacado, você pode corromper os atacantes para evitar parte ou todo o ataque: para cada ficha de Réis que gastar (qualquer valor; 1 ficha impede 1 Volante, independente do seu valor), 1 Volante naquele espaço é removido do ataque. Os Volantes não corrompidos atacam normalmente. Essa é a única forma de reduzir um ataque da Fase 5 — não exige carta nem ação, só pagar Réis no momento do ataque."
      )}</p>
      <h3 class="subhead">${t("Attacking the Recife Prison", "Atacando a Prisão de Recife")}</h3>
      <p>${t(
        "You may attack Recife only if at least 1 Cangaceiro of any color sits in its Prison. Play a card and declare the attack as if against a Volante. All Volantes in the Recife space defend it (1 Reinforcements token each), plus 1 flipped Prison Reinforcements token with the same wound capacity as a Volante. Resolve the fight normally; if the wounds fill the Prison Reinforcements token's skull space, free the Cangaceiros of ONE color in the Prison (any color, not necessarily your own) into their owner's reserve, gaining 1 Fame Point per Cangaceiro you freed.",
        "Você só pode atacar Recife se houver ao menos 1 Cangaceiro de qualquer cor na Prisão de lá. Jogue uma carta e declare o ataque como se fosse contra um Volante. Todos os Volantes no espaço de Recife defendem (1 ficha de Reforços cada), mais 1 ficha de Reforços da Prisão virada, com a mesma capacidade de ferimento de um Volante. Resolva a luta normalmente; se os ferimentos preencherem o espaço de caveira da ficha de Reforços da Prisão, liberte os Cangaceiros de UMA cor na Prisão (qualquer cor, não necessariamente a sua) para a reserva do dono, ganhando 1 Ponto de Fama por Cangaceiro libertado."
      )}</p>
      <div class="example-grid">
        <article class="example-card"><span class="card-number">01</span><h3>${t("Shooting and Melee, worked example", "Tiro e Corpo a Corpo, exemplo resolvido")}</h3>
          <p>${t(
            "Yellow attacks 3 Volantes, drawing 3 Reinforcements tokens. Shooting: yellow's firing power is 6 (3 Chief + 0 card + 3 Cangaceiros on Guns) vs. the Volantes' Protection of 4 (2 card + 2 from tokens), inflicting 2 wounds. The Volantes' Guns is 4 vs. yellow's Protection of 3 (2 Chief + 1 card), so yellow suffers 1 wound and removes a Cangaceiro from the Facão line rather than wound the Chief. Neither side is defeated, so Melee follows: yellow's Facão strength 3 inflicts 3 more wounds; the Volantes' Facão strength 1 wounds yellow once more, who this time takes a Wound cube on the Chief. Result: 2 of the 3 Volantes (with 2 wounds each) die and become trophies; the third survives on the board.",
            "O amarelo ataca 3 Volantes, comprando 3 fichas de Reforços. Tiro: o poder de fogo do amarelo é 6 (3 do Chefe + 0 da carta + 3 Cangaceiros em Armas) contra a Proteção 4 dos Volantes (2 da carta + 2 das fichas), infligindo 2 ferimentos. As Armas dos Volantes são 4 contra a Proteção 3 do amarelo (2 do Chefe + 1 da carta), então o amarelo sofre 1 ferimento e remove um Cangaceiro da linha de Facão em vez de ferir o Chefe. Nenhum lado foi derrotado, então segue o Corpo a Corpo: a força de Facão 3 do amarelo inflige mais 3 ferimentos; a força de Facão 1 dos Volantes fere o amarelo mais uma vez, que desta vez recebe um cubo de ferimento no Chefe. Resultado: 2 dos 3 Volantes (com 2 ferimentos cada) morrem e viram troféus; o terceiro sobrevive no tabuleiro."
          )}</p>
          <div class="example-source"><span>${t("Worked example from the manual", "Exemplo do manual")}</span>${referenceLink(10)}</div>
        </article>
        <article class="example-card"><span class="card-number">02</span><h3>${t("Volantes movement, worked example", "Movimento de Volantes, exemplo resolvido")}</h3>
          <p>${t(
            "In Round 3, Phase 5: Volante A already targets a Garrison in the Caatinga and stays. Volante B is also adjacent to that Garrison but Volantes can only enter that Caatinga space during the last 3 Rounds, so B instead moves toward whichever of 2 adjacent targets has the most Fame Points (the Facão holder breaks the resulting tie). Volante C has 2 adjacent targets (a Garrison and a Gang) and moves to the Gang's space, since Gangs take precedence. Volante D already has a target and doesn't move.",
            "Na Rodada 3, Fase 5: o Volante A já tem como alvo uma Guarnição na Caatinga e permanece. O Volante B também é adjacente a essa Guarnição, mas os Volantes só podem entrar nesse espaço de Caatinga nas últimas 3 Rodadas, então B se move em direção a quem tiver mais Pontos de Fama entre 2 alvos adjacentes (quem tem o Facão desempata). O Volante C tem 2 alvos adjacentes (uma Guarnição e um Bando) e se move para o espaço do Bando, já que Bandos têm prioridade. O Volante D já tem um alvo e não se move."
          )}</p>
          <div class="example-source"><span>${t("Worked example from the manual", "Exemplo do manual")}</span>${referenceLink(7)}</div>
        </article>
        <article class="example-card"><span class="card-number">03</span><h3>${t("Volantes attack and bribing, worked example", "Ataque de Volantes e suborno, exemplo resolvido")}</h3>
          <p>${t(
            "After Movement: Volante A has no target in its own space, so nothing happens there. Volantes B and C both end up targeting the yellow player's Gang, so together they would inflict 2 wounds on the yellow Chief; the yellow player could take 2 Wound cubes, but instead bribes 1 of the 2 Volantes by spending 1 Reis token, suffering only 1 wound. Volante D attacks the blue Garrison, arresting its single Cangaceiro (moving it to the Recife Prison); the blue player could also have bribed that Volante to leave the Garrison alone, but chooses not to spend the Reis.",
            "Depois do Movimento: o Volante A não tem alvo no próprio espaço, então nada acontece ali. Os Volantes B e C acabam visando o Bando do jogador amarelo, então juntos infligiriam 2 ferimentos no Chefe amarelo; o jogador amarelo poderia pegar 2 cubos de ferimento, mas em vez disso suborna 1 dos 2 Volantes gastando 1 ficha de Réis, sofrendo apenas 1 ferimento. O Volante D ataca a Guarnição azul, prendendo seu único Cangaceiro (movendo-o para a Prisão de Recife); o jogador azul também poderia ter subornado esse Volante para deixar a Guarnição em paz, mas opta por não gastar a ficha de Réis."
          )}</p>
          <div class="example-source"><span>${t("Worked example from the manual", "Exemplo do manual")}</span>${referenceLink(8)}</div>
        </article>
      </div>
      <div class="source-note">${referenceLink(8)} ${referenceLink(10)} ${referenceLink(11)}</div>`;
  }

  // --- Fazendas and Cities --------------------------------------------------

  function fazendasCitiesSection() {
    return `
      ${sectionHeading("fazendas-cities", t("Fazendas and Cities", "Fazendas e Cidades"), "06", 9)}
      <p class="glossary-intro">${t(
        "A Plunder action activates the Fazenda or City in your Gang's own space, plus ONE more Fazenda anywhere where you have the largest Garrison (no Garrisons can ever occupy a City). If a Fazenda has Garrisons from multiple players, ONLY the player with the strictly largest Garrison there can ever activate it with Plunder — if two or more players are tied for the largest Garrison in that space, NEITHER of them can activate it. Each icon on the tile is a bonus you may choose to take, in any order, and you are never forced to take all of them.",
        "Uma ação de Pilhagem ativa a Fazenda ou Cidade no próprio espaço do seu Bando, mais UMA Fazenda a mais em qualquer lugar onde você tenha a maior Guarnição (Guarnições nunca ocupam Cidades). Se uma Fazenda tiver Guarnições de vários jogadores, SÓ o jogador com a Guarnição estritamente maior ali pode ativá-la por Pilhagem — se dois ou mais jogadores empatarem na maior Guarnição naquele espaço, NENHUM deles pode ativá-la. Cada ícone na ficha é um bônus que você pode escolher receber, em qualquer ordem, e você nunca é obrigado a receber todos eles."
      )}</p>
      <p>${t(
        "Cities can also be activated by Plunder, but only if your Gang itself is standing in that City (a Garrison there never counts). Recife is the exception: it cannot be activated with Plunder at all; it can only be attacked, as described under Combat above.",
        "Cidades também podem ser ativadas por Pilhagem, mas só se o próprio Bando estiver parado naquela Cidade (uma Guarnição ali nunca conta). Recife é a exceção: não pode ser ativada por Pilhagem de forma alguma; só pode ser atacada, como descrito em Combate acima."
      )}</p>
      <div class="quick-grid">
        <article class="info-card"><h3>${t("Mossoró", "Mossoró")}</h3><p>${t("Pay 1, 4, or 6 Deal and/or Vengeance tokens total, in any combination, to gain 1, 3, or 5 Fame Points respectively.", "Pague 1, 4 ou 6 fichas de Acordo e/ou Vingança no total, em qualquer combinação, para ganhar 1, 3 ou 5 Pontos de Fama respectivamente.")}</p></article>
        <article class="info-card"><h3>${t("Salgueiro", "Salgueiro")}</h3><p>${t("Pay 1, 4, or 6 Reis tokens to gain 1, 3, or 5 Fame Points respectively.", "Pague 1, 4 ou 6 fichas de Réis para ganhar 1, 3 ou 5 Pontos de Fama respectivamente.")}</p></article>
        <article class="info-card"><h3>${t("Salvador", "Salvador")}</h3><p>${t("Pay 1, 4, or 6 Volante trophies to gain 1, 3, or 5 Fame Points respectively.", "Pague 1, 4 ou 6 troféus de Volante para ganhar 1, 3 ou 5 Pontos de Fama respectivamente.")}</p></article>
        <article class="info-card"><h3>${t("Recife", "Recife")}</h3><p>${t("Attack-only, as described under Combat. Freeing Cangaceiros from its Prison grants 1 Fame Point each.", "Só pode ser atacada, como descrito em Combate. Libertar Cangaceiros da Prisão de lá concede 1 Ponto de Fama cada.")}</p></article>
      </div>
      <h3 class="subhead">${t("The Fazenda bonuses", "Os bônus da Fazenda")}</h3>
      <div class="icon-grid">
        ${iconCard(ICON.reis, t("Reis", "Réis"), t("Take 1 Reis token (1 or 5 value, freely exchangeable at any time).", "Pegue 1 ficha de Réis (valor 1 ou 5, trocável livremente a qualquer momento)."))}
        ${iconCard(ICON.guns, t("Guns", "Armas"), t("Take 1 Cangaceiro onto the leftmost free Guns-line space (max. 5 on that line).", "Pegue 1 Cangaceiro para o espaço livre mais à esquerda da linha de Armas (máx. 5 nessa linha)."))}
        ${iconCard(ICON.facao, t("Facão", "Facão"), t("Take 1 Cangaceiro onto the leftmost free Facão-line space (max. 5 on that line).", "Pegue 1 Cangaceiro para o espaço livre mais à esquerda da linha de Facão (máx. 5 nessa linha)."))}
        ${iconCard(ICON.protection, t("Protection", "Proteção"), t("Take 1 Cangaceiro onto the leftmost free Protection-line space (max. 5 on that line).", "Pegue 1 Cangaceiro para o espaço livre mais à esquerda da linha de Proteção (máx. 5 nessa linha)."))}
        ${iconCard(ICON.deal, t("Deal", "Acordo"), t("Take 1 Deal token (max. 4 on your board); spend 1 as a free action to move any Volante 1 space, any number of times per turn.", "Pegue 1 ficha de Acordo (máx. 4 no seu tabuleiro); gaste 1 como ação gratuita para mover qualquer Volante 1 espaço, quantas vezes quiser por turno."))}
        ${iconCard(ICON.vengeance, t("Vengeance", "Vingança"), t("Take 1 Vengeance token (max. 4 on your board); spend 1 right before declaring an attack to gain 1 extra Fame Point for each Volante killed in that fight.", "Pegue 1 ficha de Vingança (máx. 4 no seu tabuleiro); gaste 1 bem antes de declarar um ataque para ganhar 1 Ponto de Fama extra por cada Volante morto naquela luta."))}
        ${iconCard(ICON.heal, t("Heal", "Curar"), t("Remove any Wound cube from your Chief card, reactivating what it covered.", "Remova qualquer cubo de ferimento da sua carta de Chefe, reativando o que ele cobria."))}
        ${iconCard(ICON.blessing, t("Blessing", "Bênção"), t("Only available when Plundering the grey Crossroads: swap 2 active Event tiles (Cangaceiros on them stay put; never swap Reward tiles), then flip the Blessing token to Heal-only until it is flipped back at End of Round.", "Só disponível ao pilhar a Encruzilhada cinza: troque 2 fichas de Evento ativas (Cangaceiros sobre elas permanecem; nunca troque fichas de Recompensa), depois vire a ficha de Bênção para o lado só-Curar até ela ser virada de volta no Fim da Rodada."))}
      </div>
      <div class="source-note">${referenceLink(9)}</div>`;
  }

  // --- Chiefs ----------------------------------------------------------------

  function chiefCard([name, abilityEn, abilityPt, flavorEn, flavorPt]) {
    return `
      <article class="info-card chief-card-entry">
        <span class="component-label">${t("CHIEF CANGACEIRO", "CHEFE CANGACEIRO")}</span>
        <h3>${escapeHtml(name)}</h3>
        <p>${t(abilityEn, abilityPt)}</p>
        <p class="example-inline"><em>${t(flavorEn, flavorPt)}</em></p>
      </article>`;
  }

  function chiefsSection() {
    return `
      ${sectionHeading("chiefs", t("Chief Cangaceiros", "Chefes Cangaceiros"), "07", 14)}
      <p class="glossary-intro">${t(
        "20 unique Chief cards exist. Each prints its own Guns/Protection/Facão starting values and its own number of wound spaces directly on the card, next to those icons — read your card for those numbers; this guide does not restate them. Each card also hides 3 of its spaces under Training markers at Setup (3 different spaces per card); a Training action reveals one, unlocking whatever ability, bonus, or wound space it covered. An ability printed under a Training marker is inactive while that marker (or a Wound cube) sits on its space.",
        "Existem 20 cartas únicas de Chefe. Cada uma imprime seus próprios valores iniciais de Armas/Proteção/Facão e seu próprio número de espaços de ferimento diretamente na carta, ao lado desses ícones — confira os números na sua carta; este guia não os repete. Cada carta também esconde 3 dos seus espaços sob marcadores de Treinamento na Preparação (3 espaços diferentes por carta); uma ação de Treinamento revela um deles, desbloqueando a habilidade, bônus ou espaço de ferimento que ele cobria. Uma habilidade impressa sob um marcador de Treinamento fica inativa enquanto esse marcador (ou um cubo de ferimento) estiver no espaço dela."
      )}</p>
      <p class="optional-mode-note">${t(
        "Every Chief card also has an identical BASE ABILITY printed at the bottom of the card (not covered by a Training marker): during Phase 3, instead of playing an Action card normally, you may discard it to take 1 Movement, Garrison, OR Plunder action (your choice of just one) — this base ability is shared by every Chief and is what cards below mean when they say \"your base ability\". A Chief's own special ability or flavor text (above) may upgrade or replace what that discard grants, as noted on that specific card.",
        "Toda carta de Chefe também tem uma HABILIDADE BASE idêntica impressa no rodapé da carta (não coberta por marcador de Treinamento): durante a Fase 3, em vez de jogar uma carta de Ação normalmente, você pode descartá-la para realizar 1 ação de Movimento, Guarnição OU Pilhagem (escolha só uma) — essa habilidade base é compartilhada por todos os Chefes e é o que as cartas abaixo querem dizer com \"sua habilidade base\". A habilidade especial ou o texto de ambientação de um Chefe específico (acima) pode melhorar ou substituir o que esse descarte concede, como indicado naquela carta."
      )}</p>
      <p class="optional-mode-note">${t(
        "If your Chief dies (a wound with no free wound space left) or retires (achieves a Life Goal), discard the card, move your Gang to Juazeiro, draft a new Chief the same way as at Setup, and move your own 3 Training marker tokens — the same physical tokens, gathered back from wherever they currently sit, including any already resting on your Player board — onto the 3 spaces of the new Chief card. This re-covers any abilities, bonuses, or wound spaces you had already Trained away; you keep only 3 Training markers all game, you never gain extra ones.",
        "Se seu Chefe morrer (um ferimento sem espaço livre de ferimento) ou se aposentar (atinge um Objetivo de Vida), descarte a carta, mova seu Bando para Juazeiro, escolha um novo Chefe da mesma forma que na Preparação, e mova seus próprios 3 marcadores de Treinamento — as mesmas fichas físicas, reunidas de onde quer que estejam, inclusive as que já estiverem no seu tabuleiro — para os 3 espaços da nova carta de Chefe. Isso volta a cobrir qualquer habilidade, bônus ou espaço de ferimento que você já tinha Treinado; você mantém apenas 3 marcadores de Treinamento o jogo todo, nunca ganha marcadores extras."
      )}</p>
      <div class="quick-grid">${CHIEFS.map(chiefCard).join("")}</div>
      <div class="source-note">${referenceLink(9)} ${referenceLink(14)} ${referenceLink(15)}</div>`;
  }

  // --- Events ------------------------------------------------------------------

  function eventCard([name, en, pt]) {
    return `
      <article class="info-card">
        <span class="component-label">${t("EVENT", "EVENTO")}</span>
        <h3>${escapeHtml(name)}</h3>
        <p>${t(en, pt)}</p>
      </article>`;
  }

  function eventsSection() {
    return `
      ${sectionHeading("events", t("Events", "Eventos"), "08", 12)}
      <p class="glossary-intro">${t(
        "14 named Events exist; 6 are drawn for the Event Track each game, alongside the fixed \"Peace\" tile (no effect). During Phase 4, every player who does NOT have a Cangaceiro placed on the current active Event suffers its printed effect, then the tile is flipped and never used again this game.",
        "Existem 14 Eventos nomeados; 6 são sorteados para a Trilha de Eventos a cada partida, além da ficha fixa \"Paz\" (sem efeito). Na Fase 4, todo jogador que NÃO tiver um Cangaceiro colocado no Evento atual sofre o efeito impresso nele, e então a ficha é virada e nunca mais usada nesta partida."
      )}</p>
      <div class="quick-grid">${EVENTS.map(eventCard).join("")}</div>
      <div class="source-note">${referenceLink(12)}</div>`;
  }

  // --- Action cards --------------------------------------------------------------

  function actionCardEntry([nameEn, namePt, en, pt]) {
    return `
      <article class="info-card">
        <h3>${escapeHtml(t(nameEn, namePt))}</h3>
        <p>${t(en, pt)}</p>
      </article>`;
  }

  function actionCardsSection() {
    return `
      ${sectionHeading("action-cards", t("Action Cards", "Cartas de Ação"), "09", 13)}
      <p class="glossary-intro">${t(
        "Every Action card's upper part always lets you attack the Volantes with your Gang, as described under Combat; the lower parts differ by deck. All actions on a card, upper and lower, can be taken in any order, and any of them may be skipped.",
        "A parte superior de toda carta de Ação sempre permite atacar os Volantes com seu Bando, como descrito em Combate; as partes inferiores diferem por baralho. Todas as ações de uma carta, superior e inferior, podem ser feitas em qualquer ordem, e qualquer uma delas pode ser pulada."
      )}</p>
      <h3 class="subhead">${t("Starting cards (7, personal deck)", "Cartas Iniciais (7, baralho pessoal)")}</h3>
      <p>${t(
        "Every player's deck begins with exactly these 7 cards. The manual does not give each one an individual name or paragraph of text: each Starting card's lower (ACTION) part simply shows one or more of the 5 basic action icons already explained above in Iconography — Movement, Garrison, Training, Plunder, Cunning — and its upper (ATTACK) part shows a Guns/Protection/Facão bonus combination. Read the icons printed on your own 7 physical cards to know exactly which actions and attack bonus each one offers; this guide's icon definitions above tell you what every icon does once you've identified it.",
        "O baralho de todo jogador começa com exatamente estas 7 cartas. O manual não dá a cada uma delas um nome ou parágrafo de texto individual: a parte inferior (AÇÃO) de cada carta Inicial mostra apenas um ou mais dos 5 ícones básicos de ação já explicados acima em Iconografia — Movimento, Guarnição, Treinamento, Pilhagem, Astúcia — e a parte superior (ATAQUE) mostra uma combinação de bônus de Armas/Proteção/Facão. Leia os ícones impressos nas suas próprias 7 cartas físicas para saber exatamente quais ações e bônus de ataque cada uma oferece; as definições de ícones deste guia, acima, dizem o que cada ícone faz assim que você o identificar."
      )}</p>
      <h3 class="subhead">${t("Serra cards (brown)", "Cartas da Serra (marrons)")}</h3>
      <p>${t(
        "After playing your third (last) card of the Round, while your Gang is in a Serra space, you may trade one Starting card sitting in your deck or discard pile (hand is already empty by then) for one of these 8, which takes the exact same position.",
        "Depois de jogar sua terceira (última) carta da Rodada, enquanto seu Bando estiver em um espaço de Serra, você pode trocar uma carta Inicial que esteja no seu baralho ou descarte (a mão já está vazia nesse momento) por uma destas 8, que ocupa exatamente a mesma posição."
      )}</p>
      <div class="quick-grid">${SERRA_CARDS.map(actionCardEntry).join("")}</div>
      <h3 class="subhead">${t("Caatinga cards (green) — Threaten a rival Gang", "Cartas da Caatinga (verdes) — Ameaçar um Bando rival")}</h3>
      <p>${t(
        "Caatinga cards trade in exactly the same way, from a Caatinga space. Their lower part is a Movement action plus a Threaten action usable on a rival Gang sharing your space. The target player chooses: suffer the card's listed effect, OR lose Fame Points equal to their current bounty and let you gain that many instead (if they have 0 Fame Points, they lose none but you still gain 1). If the target doesn't have at least one of the resources shown on the card, they may only choose the second option.",
        "Cartas da Caatinga são trocadas exatamente da mesma forma, a partir de um espaço de Caatinga. A parte inferior delas é uma ação de Movimento mais uma ação de Ameaça usável contra um Bando rival que compartilhe seu espaço. O jogador-alvo escolhe: sofrer o efeito listado na carta, OU perder Pontos de Fama iguais à sua recompensa atual e deixar você ganhar essa mesma quantidade (se ele tiver 0 Pontos de Fama, não perde nenhum, mas você ainda ganha 1). Se o alvo não tiver ao menos um dos recursos mostrados na carta, ele só pode escolher a segunda opção."
      )}</p>
      <div class="quick-grid">${CAATINGA_CARDS.map(actionCardEntry).join("")}</div>
      <div class="source-note">${referenceLink(6)} ${referenceLink(13)}</div>`;
  }

  // --- Life Goals ----------------------------------------------------------------

  function lifeGoalsSection() {
    return `
      ${sectionHeading("life-goals", t("Life Goals", "Objetivos de Vida"), "10", 11)}
      <p class="glossary-intro">${t(
        "After playing an Action card, you may declare a Life Goal if your Chief is COMPLETELY trained (no Training markers left on its card) and you have all the resources shown inside the red box on at least 1 available Life Goal card. Spend those resources, return the card to the box, and your Chief retires (same procedure as dying, but without losing Fame Points to a bounty).",
        "Depois de jogar uma carta de Ação, você pode declarar um Objetivo de Vida se seu Chefe estiver COMPLETAMENTE treinado (sem marcadores de Treinamento na carta) e você tiver todos os recursos mostrados dentro da caixa vermelha de ao menos 1 carta de Objetivo de Vida disponível. Gaste esses recursos, devolva a carta à caixa, e seu Chefe se aposenta (mesmo procedimento da morte, mas sem perder Pontos de Fama por recompensa)."
      )}</p>
      <p>${t(
        "Each Life Goal card's Fame Point reward is printed as 9 minus the number of Wound cubes currently on your Chief card — retiring a healthy Chief is worth more than retiring a battered one.",
        "A recompensa em Pontos de Fama de cada carta de Objetivo de Vida é impressa como 9 menos o número de cubos de ferimento atualmente na carta do seu Chefe — aposentar um Chefe saudável vale mais do que aposentar um já castigado."
      )}</p>
      <p class="optional-mode-note">${t(
        "Costs on Life Goal cards are built from the icons listed under Iconography above (removing a Garrison Cangaceiro from a specific terrain or anywhere, removing the rightmost Cangaceiro from a specific line, discarding a Deal or Vengeance token, removing a Volante trophy, or spending a Reis token); read the exact combination directly off each available card.",
        "Os custos nas cartas de Objetivo de Vida são montados com os ícones listados em Iconografia acima (remover um Cangaceiro de Guarnição de um terreno específico ou de qualquer lugar, remover o Cangaceiro mais à direita de uma linha específica, descartar uma ficha de Acordo ou Vingança, remover um troféu de Volante, ou gastar uma ficha de Réis); leia a combinação exata diretamente em cada carta disponível."
      )}</p>
      <div class="source-note">${referenceLink(11)} ${referenceLink(16)}</div>`;
  }

  // --- Victory / end of game -------------------------------------------------------

  function victorySection() {
    const rows = [[1, 1, 1], [2, 2, 2], [t("3+", "3+"), t("The Chief dies", "O Chefe morre"), t("All of them", "Todos eles")]];
    return `
      ${sectionHeading("victory", t("End of the Game & Final Scoring", "Fim do Jogo e Pontuação Final"), "11", 8)}
      <div class="victory-grid">
        <article class="info-card"><h3>${t("The game ends", "O jogo termina")}</h3><p>${t(
          "At the end of the 7th Round, OR during any Round when there are no more Life Goal cards available — in that case, finish the current Round only up through Phase 3 (Play Action Cards), then skip the rest of that Round's phases.",
          "No fim da 7ª Rodada, OU durante qualquer Rodada em que não restarem mais cartas de Objetivo de Vida disponíveis — nesse caso, termine a Rodada atual só até a Fase 3 (Jogar Cartas de Ação), e pule o restante das fases dessa Rodada."
        )}</p></article>
        <article class="info-card"><h3>${t("Final scoring", "Pontuação final")}</h3><p>${t(
          "Add up: Serra/Caatinga cards in deck+hand+discard, Cangaceiros on your Player board, Cangaceiros you have in Garrisons on the Map board, the total value of your Reis tokens, Volante trophies, Training markers still on your Player board (not your Chief card), and Deal/Vengeance tokens. Subtract Wound cubes on your Chief card. For every 3 resource points left after that subtraction (rounded down), gain 1 Fame Point.",
          "Some: cartas da Serra/Caatinga no baralho+mão+descarte, Cangaceiros no seu tabuleiro, Cangaceiros que você tem em Guarnições no tabuleiro, o valor total das suas fichas de Réis, troféus de Volante, marcadores de Treinamento ainda no seu tabuleiro (não na carta de Chefe), e fichas de Acordo/Vingança. Subtraia os cubos de ferimento na carta de Chefe. Para cada 3 pontos de recurso restantes depois dessa subtração (arredondado para baixo), ganhe 1 Ponto de Fama."
        )}</p></article>
        <article class="info-card"><h3>${t("Winning", "Vencendo")}</h3><p>${t(
          "The player with the most Fame Points (starting total plus the points just added) wins. On a tie, the player with fewer Cangaceiros in the Recife Prison wins; if still tied, share the victory.",
          "Vence o jogador com mais Pontos de Fama (total inicial mais os pontos recém-somados). Em caso de empate, vence quem tiver menos Cangaceiros na Prisão de Recife; se ainda empatado, dividam a vitória."
        )}</p></article>
      </div>
      <h3 class="subhead">${t("Bounty", "Recompensa")}</h3>
      <p>${t(
        "Your bounty is read off the column to the left of your marker on the Fame Point Track: it rises with your Fame Points. When your Chief dies, you immediately lose Fame Points equal to your current bounty. Once you have scored at least 1 Fame Point, your bounty never drops below 1, and Fame Points can never go below 0.",
        "Sua recompensa é lida na coluna à esquerda do seu marcador na Trilha de Pontos de Fama: ela sobe junto com seus Pontos de Fama. Quando seu Chefe morre, você perde imediatamente Pontos de Fama iguais à sua recompensa atual. Assim que marcar ao menos 1 Ponto de Fama, sua recompensa nunca cai abaixo de 1, e Pontos de Fama nunca ficam abaixo de 0."
      )}</p>
      <h3 class="subhead">${t("Volantes attack outcome, by number of Volantes", "Resultado do ataque dos Volantes, por número de Volantes")}</h3>
      <p>${t(
        "During Phase 5, when 1 or more Volantes end up sharing a space with exactly 1 target (a Gang or a Garrison — see The Round, Phase 5 above for how the single target is chosen), the number of Volantes present fixes the outcome below. Read the Wounds column if the target is a Gang (its Chief suffers that many wounds, subject to Corruption bribes); read the Arrested column if the target is a Garrison with no Gang in that space (that many of its Cangaceiros go to the Recife Prison). If both a Gang and Garrisons from other players are in the same space, Volantes always attack the Gang, so only the Wounds column applies there; the Arrested column only ever applies to a Garrison-only space.",
        "Durante a Fase 5, quando 1 ou mais Volantes acabam dividindo um espaço com exatamente 1 alvo (um Bando ou uma Guarnição — veja A Rodada, Fase 5 acima para como o alvo único é escolhido), o número de Volantes presentes fixa o resultado abaixo. Leia a coluna de Ferimentos se o alvo for um Bando (o Chefe dele sofre esse tanto de ferimentos, sujeito a subornos de Corrupção); leia a coluna de Presos se o alvo for uma Guarnição sem Bando naquele espaço (esse tanto de Cangaceiros dela vai para a Prisão de Recife). Se houver um Bando e Guarnições de outros jogadores no mesmo espaço, os Volantes sempre atacam o Bando, então só a coluna de Ferimentos se aplica ali; a coluna de Presos só vale para um espaço só com Guarnição."
      )}</p>
      <table class="starter-deck-table">
        <caption>${t("Fixed outcome by number of attacking Volantes", "Resultado fixo conforme o número de Volantes atacantes")}</caption>
        <thead><tr><th>${t("Volantes", "Volantes")}</th><th>${t("Wounds suffered by the Chief (if target is a Gang)", "Ferimentos sofridos pelo Chefe (se o alvo for um Bando)")}</th><th>${t("Cangaceiros arrested (if target is a Garrison)", "Cangaceiros presos (se o alvo for uma Guarnição)")}</th></tr></thead>
        <tbody>${rows.map(([v, w, a]) => `<tr><td>${v}</td><td>${w}</td><td>${a}</td></tr>`).join("")}</tbody>
      </table>
      <p class="optional-mode-note">${t(
        "Remember Corruption: before this table is applied, the attacked player may spend any number of Reis tokens to remove that many Volantes from the fight first (1 token removes 1 Volante, regardless of denomination), reducing the count this table is read against.",
        "Lembre-se da Corrupção: antes de aplicar esta tabela, o jogador atacado pode gastar qualquer número de fichas de Réis para remover da luta esse tanto de Volantes primeiro (1 ficha remove 1 Volante, independente do valor), reduzindo a quantidade usada para ler esta tabela."
      )}</p>
      <div class="source-note">${referenceLink(8)} ${referenceLink(11)}</div>`;
  }

  // --- Glossary ------------------------------------------------------------------

  function glossarySection() {
    const terms = GLOSSARY_TERMS.slice().sort((a, b) => a[state.language === "pt-BR" ? 1 : 0].localeCompare(b[state.language === "pt-BR" ? 1 : 0], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), "12", 16)}
      <p class="glossary-intro">${t(
        "Short meanings for the words used above.",
        "Significados curtos das palavras usadas acima."
      )}</p>
      <div class="quick-grid glossary-grid">${terms.map((item) => `
        <article class="info-card glossary-card"><span class="component-label">${t("TERM", "TERMO")}</span><h3>${t(item[0], item[1])}</h3><p>${t(item[2], item[3])}</p>
        </article>`).join("")}</div>
      <div class="source-note">${referenceLink(3)} ${referenceLink(16)}</div>`;
  }

  // --- Shell -----------------------------------------------------------------------

  function renderHeader() {
    return `
      <header class="site-header">
        <a class="brand" href="#/" aria-label="${t("Field Manual home", "Página inicial do Manual de Campo")}">
          <span class="brand-mark" aria-hidden="true">CG</span>
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
    document.body.classList.add("theme-cangaceiros");
    document.documentElement.lang = state.language;
    document.title = t("Cangaceiros — Field Manual", "Cangaceiros — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Interactive rules for Cangaceiros, the 2-5 player game of outlaw gangs fighting the coroneis in Brazil's Northeast Sertão.",
        "Regras interativas de Cangaceiros, o jogo para 2 a 5 jogadores sobre bandos de cangaceiros lutando contra os coronéis no Sertão nordestino."
      );
    }
    const nav = [
      ["iconography", t("Iconography", "Iconografia")],
      ["quick-reference", t("Quick Ref", "Referência")],
      ["setup", t("Setup", "Preparação")],
      ["phases", t("The Round", "A Rodada")],
      ["combat", t("Combat", "Combate")],
      ["fazendas-cities", t("Fazendas & Cities", "Fazendas e Cidades")],
      ["chiefs", t("Chiefs", "Chefes")],
      ["events", t("Events", "Eventos")],
      ["action-cards", t("Action Cards", "Cartas de Ação")],
      ["life-goals", t("Life Goals", "Objetivos de Vida")],
      ["victory", t("Victory", "Vitória")],
      ["glossary", t("Glossary", "Glossário")]
    ];
    app.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook · base game", "Livro interativo · jogo base")}</p>
          <h1>Cangaceiros</h1>
          <p class="hero-intro">${t(
            "A fully cooperative-free, every-gang-for-itself race across Brazil's Northeast Sertão: build a gang of cangaceiros, train a legendary Chief, plunder the coroneis' fazendas, and fend off the volantes sent to hunt you down. This guide follows the official rulebook; no expansion was supplied, so only the base game is covered.",
            "Uma corrida sem cooperação, cada bando por si, pelo Sertão nordestino: monte um bando de cangaceiros, treine um Chefe lendário, pilhe as fazendas dos coronéis e enfrente os volantes enviados para caçar você. Este guia segue o manual oficial; nenhuma expansão foi fornecida, então apenas o jogo base é coberto."
          )}</p>
          <div class="hero-meta"><span>${t("2-5 players", "2 a 5 jogadores")}</span><span>${t("60-120 minutes", "60-120 minutos")}</span><span>${t("Area control & combat", "Controle de área e combate")}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/cangaceiros.webp" alt="${t("Cover of the Cangaceiros rulebook", "Capa do manual de Cangaceiros")}" fetchpriority="high"><figcaption>${t("Rulebook cover", "Capa do manual")} · Ergo Ludo / Ares Games</figcaption></figure>
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
          <section class="rule-section">${phasesSection()}</section>
          <section class="rule-section">${combatSection()}</section>
          <section class="rule-section">${fazendasCitiesSection()}</section>
          <section class="rule-section">${chiefsSection()}</section>
          <section class="rule-section">${eventsSection()}</section>
          <section class="rule-section">${actionCardsSection()}</section>
          <section class="rule-section">${lifeGoalsSection()}</section>
          <section class="rule-section">${victorySection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal guide for Cangaceiros. Summaries follow the official rulebook, whose PDF is included in this repository with permission.",
        "Guia pessoal de Cangaceiros. Os resumos seguem o manual oficial, cujo PDF está incluído neste repositório com autorização."
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
    if (target instanceof HTMLInputElement && target.matches("[data-player-count]")) {
      const value = Number.parseInt(target.value, 10);
      commit(() => {
        state.playerCount = [2, 3, 4, 5].includes(value) ? value : 4;
      });
    }
  }

  function onInput() {
    // Cangaceiros' match panel has no freeform text fields; nothing to do here.
  }

  window.Cangaceiros = { renderInto, onClick, onChange, onInput };
})();
