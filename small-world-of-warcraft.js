(() => {
  "use strict";

  const PREFERENCES_KEY = "field-manual.small-world-of-warcraft.v1";
  const SETUP_KEY = "field-manual.small-world-of-warcraft.setup.v1";
  const MANUAL = "small-world-of-warcraft_core.pdf";
  const ASSETS = "assets/small-world-of-warcraft/";
  const ICONS = `${ASSETS}icons/`;
  const ART = `${ASSETS}art/`;
  // Source: Small World of Warcraft rulebook (Days of Wonder, 16 pp.). Page codes "pN" = PDF page N,
  // which is also the printed folio (the cover is the unnumbered page 1).
  // The "Team Variant Rules sheet" listed among the components (p. 2) is NOT supplied and not covered.
  const PLAYER_COUNTS = [2, 3, 4, 5];
  const defaults = { language: "pt-BR", players: 4 };

  // Board sets, rounds and Artifact/Place markers per player count (p. 3).
  const BOARDS = {
    2: { large: 1, medium: 0, small: 1 },
    3: { large: 1, medium: 1, small: 1 },
    4: { large: 1, medium: 2, small: 1 },
    5: { large: 2, medium: 1, small: 2 }
  };
  const ROUNDS = { 2: 10, 3: 10, 4: 9, 5: 8 };

  // Races (p. 2 components, pp. 11–12 descriptions). value = number printed on the banner; tokens = tokens in the box.
  const RACES = [
    { id: "blood-elves", name: "Blood Elves", faction: "horde", value: 5, tokens: 10, code: "p11", lines: [
      ["Thirsty for magic: +1 bonus Victory Coin for each Magic Region they occupy at the end of your turn.", "Sedentos de magia: +1 Moeda de Vitória bônus por Região Mágica que ocupem no fim do seu turno."]
    ] },
    { id: "draenei", name: "Draenei", faction: "alliance", value: 7, tokens: 12, code: "p11", lines: [
      ["Holy Light, during each opponent's turn: the first Draenei token you should discard (from a conquest or from any power) stays with you instead and is redeployed normally.", "Luz Sagrada, durante o turno de cada adversário: o primeiro marcador Draenei que você deveria descartar (por conquista ou por qualquer poder) fica com você e é reposicionado normalmente."],
      ["Every further casualty in that turn is discarded as usual.", "As baixas seguintes nesse turno são descartadas normalmente."]
    ] },
    { id: "dwarves", name: "Dwarves", faction: "alliance", value: 5, tokens: 10, code: "p11", lines: [
      ["Conquer Mountain Regions for 2 tokens less than normal (minimum 1 token).", "Conquistam Regiões de Montanha por 2 marcadores a menos que o normal (mínimo 1 marcador)."]
    ] },
    { id: "ethereals", name: "Ethereals", faction: "neutral", value: 5, tokens: 10, code: "p11", lines: [
      ["Once per turn, choose ONE:", "Uma vez por turno, escolha UMA opção:"],
      ["<strong>Steal an Artifact</strong> from a Region adjacent to one you occupy, moving the Artifact into your adjacent Region; you may use its power at once.", "<strong>Roubar um Artefato</strong> de uma Região adjacente a uma que você ocupa, movendo o Artefato para a sua Região adjacente; você pode usar o poder dele na hora."],
      ["<strong>OR conquer</strong> any adjacent Region that holds a Legendary Place for 2 tokens less than normal (minimum 1 token).", "<strong>OU conquistar</strong> qualquer Região adjacente que tenha um Local Lendário por 2 marcadores a menos que o normal (mínimo 1 marcador)."]
    ] },
    { id: "forsaken", name: "Forsaken", faction: "horde", value: 6, tokens: 20, code: "p11", lines: [
      ["Each time you force the loss of a Race token (Active or In Decline), you may pay 1 Victory Coin to take 1 extra Forsaken token from the tray.", "Cada vez que você força a perda de um marcador de Raça (Ativa ou Em Declínio), pode pagar 1 Moeda de Vitória para pegar 1 marcador Forsaken extra da bandeja."],
      ["The extra tokens arrive after your last conquest, before Troop Redeployment: you cannot conquer with them until your next turn.", "Os marcadores extras chegam depois da sua última conquista, antes do Reposicionamento: você só pode conquistar com eles no próximo turno."],
      ["You are limited to the 20 Forsaken tokens in the box.", "O limite são os 20 marcadores Forsaken da caixa."]
    ] },
    { id: "gnomes", name: "Gnomes", faction: "alliance", value: 5, tokens: 10, code: "p11", lines: [
      ["Flying Machines, once per turn: an airborne assault on ANY Region of ANY board, treated as adjacent.", "Máquinas Voadoras, uma vez por turno: um ataque aéreo a QUALQUER Região de QUALQUER tabuleiro, tratada como adjacente."],
      ["After choosing that Region, roll a free Reinforcement Die before the assault; the result lowers the cost.", "Depois de escolher essa Região, role um Dado de Reforço grátis antes do ataque; o resultado reduz o custo."],
      ["If this assault is your last possible conquest, you may use the die twice: once for the Gnomes and once for the normal final conquest attempt.", "Se esse ataque for a sua última conquista possível, você pode usar o dado duas vezes: uma pelos Gnomes e outra pela tentativa final de conquista normal."]
    ] },
    { id: "goblins", name: "Goblins", faction: "horde", value: 6, tokens: 11, code: "p11", lines: [
      ["When you first pick the Goblins, shuffle the 12 Bomb tokens face down into a stack next to you.", "Quando você pega os Goblins, embaralhe os 12 marcadores de Bomba virados para baixo numa pilha ao seu lado."],
      ["<strong>End of your turn:</strong> you may place Bombs, from the top of the stack, face down without looking, in adjacent Regions occupied by opponents' Active Races (max 1 Bomb per Region).", "<strong>Fim do seu turno:</strong> você pode pôr Bombas, do topo da pilha, viradas para baixo e sem olhar, em Regiões adjacentes ocupadas por Raças Ativas de adversários (máx. 1 Bomba por Região)."],
      ["<strong>Start of your next turn:</strong> if the Region is still occupied by an opponent (even if that Race went In Decline), reveal the Bomb. Explosion = a successful conquest (they lose 1 token, take the rest back for redeployment) but the Region is left empty. Miss = no effect. Either way the Bomb goes back to the box.", "<strong>Início do seu próximo turno:</strong> se a Região ainda estiver ocupada por um adversário (mesmo que essa Raça tenha entrado em Declínio), revele a Bomba. Explosão = conquista bem-sucedida (ele perde 1 marcador e recolhe os outros para reposicionar), mas a Região fica vazia. Falha = sem efeito. Em ambos os casos a Bomba volta para a caixa."],
      ["If the Region was emptied before your next turn, put that Bomb back on top of the stack unseen.", "Se a Região foi esvaziada antes do seu próximo turno, devolva essa Bomba ao topo da pilha sem olhar."],
      ["When the Goblins go In Decline, the Bombs placed at the end of their previous turn are revealed and resolved normally. Empty stack: no more Bombs.", "Quando os Goblins entram em Declínio, as Bombas postas no fim do turno anterior deles são reveladas e resolvidas normalmente. Pilha vazia: não há mais Bombas."]
    ] },
    { id: "humans", name: "Humans", faction: "alliance", value: 5, tokens: 10, code: "p11", lines: [
      ["<strong>End of each of your turns:</strong> place your 2 Military Objective tokens (taking them back first if needed) in up to 2 different non-Alliance Regions.", "<strong>Fim de cada turno seu:</strong> ponha os seus 2 marcadores de Objetivo Militar (recolhendo-os antes, se preciso) em até 2 Regiões diferentes que não sejam da Aliança."],
      ["A non-Horde player (Humans included) who conquers a Region with an Objective earns 2 bonus Victory Coins and gives the token back to the Human player.", "Um jogador que não seja da Horda (inclusive os Humans) que conquiste uma Região com Objetivo ganha 2 Moedas de Vitória bônus e devolve o marcador ao jogador dos Humans."],
      ["The Human player also earns 2 bonus Victory Coins if someone else made that conquest.", "O jogador dos Humans também ganha 2 Moedas bônus se outra pessoa fez essa conquista."],
      ["A Horde player conquering that Region: nothing happens and the token stays.", "Um jogador da Horda conquistando essa Região: nada acontece e o marcador fica."]
    ] },
    { id: "kobolds", name: "Kobolds", faction: "neutral", value: 6, tokens: 11, code: "p11", lines: [
      ["Attack any Cavern Region as though it were adjacent.", "Atacam qualquer Região de Caverna como se fosse adjacente."],
      ["Their first conquest may use a Cavern Region as an Entry Region, without the +1 travel cost.", "A primeira conquista pode usar uma Região de Caverna como Região de Entrada, sem o +1 de custo de viagem."]
    ] },
    { id: "naga", name: "Naga", faction: "neutral", value: 6, tokens: 11, code: "p12", lines: [
      ["May conquer Sea and Lake Regions (2 tokens; 1 Victory Coin each, like any Region).", "Podem conquistar Regiões de Mar e de Lago (2 marcadores; 1 Moeda de Vitória cada, como qualquer Região)."],
      ["Their first conquest may be a Sea or a Lake, for 2 tokens (no Entry Region, no travel cost); they expand from there.", "A primeira conquista pode ser um Mar ou um Lago, por 2 marcadores (sem Região de Entrada nem custo de viagem); elas se expandem a partir dali."],
      ["Naga stay in Seas and Lakes while In Decline.", "As Naga continuam nos Mares e Lagos quando Em Declínio."]
    ] },
    { id: "night-elves", name: "Night Elves", faction: "alliance", value: 4, tokens: 9, code: "p12", lines: [
      ["Conquer Forest Regions for 1 token less than normal (minimum 1 token).", "Conquistam Regiões de Floresta por 1 marcador a menos que o normal (mínimo 1 marcador)."],
      ["Each time they conquer a Forest, place a Wisp Wall there: it counts as 1 token for defense and remains while In Decline.", "Cada vez que conquistam uma Floresta, põem nela uma Muralha de Wisp (Wisp Wall): ela vale 1 marcador na defesa e continua quando Em Declínio."],
      ["The Wisp Wall is removed when the Region is conquered or emptied.", "A Muralha é removida quando a Região é conquistada ou esvaziada."]
    ] },
    { id: "orcs", name: "Orcs", faction: "horde", value: 6, tokens: 11, code: "p12", lines: [
      ["Each conquest of an Alliance-occupied Region is worth +1 bonus Victory Coin.", "Cada conquista de uma Região ocupada pela Aliança vale +1 Moeda de Vitória bônus."],
      ["This adds to the usual Faction Bonus.", "Isso se soma ao Bônus de Facção normal."]
    ] },
    { id: "pandaren", name: "Pandaren", faction: "neutral", value: 5, tokens: 10, code: "p12", lines: [
      ["<strong>End of every turn:</strong> give a Harmony token to each opponent whose Active Race you did not attack this turn (on the game's first turn, also to players who have no Race yet).", "<strong>Fim de todo turno:</strong> dê um marcador de Harmonia a cada adversário cuja Raça Ativa você não atacou neste turno (no primeiro turno do jogo, também a quem ainda não tem Raça)."],
      ["A player holding a Harmony token must pay the Pandaren 2 Victory Coins before attacking them (conquering their Regions, or removing a Pandaren token by any means).", "Quem tem um marcador de Harmonia precisa pagar 2 Moedas de Vitória aos Pandaren antes de atacá-los (conquistar Regiões deles ou remover um marcador Pandaren por qualquer meio)."],
      ["The 2 coins are paid once, even if several Pandaren Regions are attacked.", "As 2 moedas são pagas uma vez, mesmo que várias Regiões Pandaren sejam atacadas."],
      ["The Pandaren take every Harmony token back at the start of each of their turns.", "Os Pandaren recolhem todos os marcadores de Harmonia no início de cada turno deles."]
    ] },
    { id: "tauren", name: "Tauren", faction: "horde", value: 11, tokens: 16, code: "p12", lines: [
      ["Can never occupy (nor conquer) a Region with fewer than 2 Tauren tokens.", "Nunca podem ocupar (nem conquistar) uma Região com menos de 2 marcadores Tauren."],
      ["They still lose 1 token when conquered.", "Ainda assim perdem 1 marcador quando conquistados."],
      ["A Tauren token is never left alone, not even during “Ready your troops”: if one would be, redeploy it to another Region you control.", "Um marcador Tauren nunca fica sozinho, nem durante “Prepare as tropas”: se isso aconteceria, reposicione-o em outra Região que você controla."],
      ["Going In Decline, leave 2 tokens in each Region instead of 1.", "Ao entrar em Declínio, deixe 2 marcadores em cada Região em vez de 1."]
    ] },
    { id: "trolls", name: "Trolls", faction: "horde", value: 6, tokens: 11, code: "p12", lines: [
      ["Conquer any non-empty Region for 1 token less than normal (minimum 1 token).", "Conquistam qualquer Região não vazia por 1 marcador a menos que o normal (mínimo 1 marcador)."]
    ] },
    { id: "worgen", name: "Worgen", faction: "alliance", value: 5, tokens: 10, code: "p12", lines: [
      ["At the start of each of your turns choose a form:", "No início de cada turno seu, escolha uma forma:"],
      ["<strong>Human form:</strong> take 2 bonus Victory Coins at once.", "<strong>Forma humana:</strong> pegue 2 Moedas de Vitória bônus na hora."],
      ["<strong>Worgen form:</strong> pay 1 Victory Coin; every conquest this turn costs 1 token less (minimum 1 token).", "<strong>Forma Worgen:</strong> pague 1 Moeda de Vitória; toda conquista neste turno custa 1 marcador a menos (mínimo 1 marcador)."]
    ] }
  ];

  // Special Powers (pp. 12–13). value = number in the badge's circle.
  const POWERS = [
    { id: "archaeologist", name: "Archaeologist", value: 5, code: "p12", lines: [
      ["+1 bonus Victory Coin for each Artifact and each Legendary Place you control at the end of your turn.", "+1 Moeda de Vitória bônus por Artefato e por Local Lendário que você controla no fim do turno."]
    ] },
    { id: "battle-master", name: "Battle Master", value: 5, code: "p12", lines: [
      ["+1 bonus Victory Coin each time you conquer a non-empty Region.", "+1 Moeda de Vitória bônus a cada conquista de Região não vazia."]
    ] },
    { id: "beast-master", name: "Beast Master", value: 4, code: "p12", lines: [
      ["<strong>Start of each turn:</strong> discard all your Beast tokens, then take 1 Beast per Hill Region you control.", "<strong>Início de cada turno:</strong> descarte todos os seus marcadores de Fera e pegue 1 Fera por Região de Colina que você controla."],
      ["Beasts count as Race tokens for every purpose: conquering and redeploying.", "As Feras valem como marcadores de Raça para tudo: conquistar e reposicionar."],
      ["When a Region with a Beast is conquered, 1 Beast is discarded as the loss; the other tokens are redeployed normally.", "Quando uma Região com Fera é conquistada, 1 Fera é descartada como perda; os outros marcadores são reposicionados normalmente."]
    ] },
    { id: "blacksmith", name: "Blacksmith", value: 4, code: "p13", lines: [
      ["Every conquest costs 1 token less than normal (minimum 1 token).", "Toda conquista custa 1 marcador a menos que o normal (mínimo 1 marcador)."]
    ] },
    { id: "championing", name: "Championing", value: 5, code: "p13", lines: [
      ["Once per turn, conquer any adjacent Region for free, whatever its tokens and defenses; place the Champion token there.", "Uma vez por turno, conquiste qualquer Região adjacente de graça, sejam quais forem os marcadores e defesas; ponha ali o marcador de Campeão."],
      ["The Champion counts as 1 Race token for defense.", "O Campeão vale 1 marcador de Raça na defesa."],
      ["If another player conquers the Champion's Region, it is taken prisoner: no defending Race token is discarded; its owner pays that player a 1 Victory Coin ransom, takes the Champion back and redeploys it like a Race token (usable again next turn).", "Se outro jogador conquistar a Região do Campeão, ele é feito prisioneiro: nenhum marcador defensor é descartado; o dono paga a esse jogador 1 Moeda de Vitória de resgate, recupera o Campeão e o reposiciona como um marcador de Raça (usável de novo no próximo turno)."]
    ] },
    { id: "defensive", name: "Defensive", value: 5, code: "p13", lines: [
      ["<strong>End of your turn:</strong> place a Watch Tower in each of your Fields Regions where you control the majority of the adjacent Regions (more than any other Active or In Decline Race).", "<strong>Fim do seu turno:</strong> ponha uma Torre de Vigia em cada Região de Campos sua em que você controla a maioria das Regiões adjacentes (mais que qualquer outra Raça Ativa ou Em Declínio)."],
      ["Remove Watch Towers from Fields Regions where you lost that majority.", "Remova Torres de Vigia das Regiões de Campos em que você perdeu essa maioria."],
      ["A Watch Tower makes its Region immune to all powers and conquest attempts.", "Uma Torre de Vigia torna a Região imune a todos os poderes e tentativas de conquista."]
    ] },
    { id: "enraged", name: "Enraged", value: 4, code: "p13", lines: [
      ["Each conquest of a Region with at least 2 defending Race tokens earns as many bonus Victory Coins as there were defending tokens.", "Cada conquista de uma Região com pelo menos 2 marcadores de Raça defensores rende tantas Moedas de Vitória bônus quantos eram os defensores."]
    ] },
    { id: "explorer", name: "Explorer", value: 4, code: "p13", lines: [
      ["+1 bonus Victory Coin for each game board on which you occupy at least 1 Region at the end of your turn.", "+1 Moeda de Vitória bônus por tabuleiro em que você ocupa pelo menos 1 Região no fim do turno."]
    ] },
    { id: "farmer", name: "Farmer", value: 4, code: "p13", lines: [
      ["+1 bonus Victory Coin for each Fields Region you control at the end of your turn.", "+1 Moeda de Vitória bônus por Região de Campos que você controla no fim do turno."]
    ] },
    { id: "fishing", name: "Fishing", value: 3, code: "p13", lines: [
      ["+1 bonus Victory Coin for each Region you control that is adjacent to a Lake or a Sea, at the end of your turn.", "+1 Moeda de Vitória bônus por Região que você controla adjacente a um Lago ou Mar, no fim do turno."]
    ] },
    { id: "garrisoned", name: "Garrisoned", value: 3, code: "p13", lines: [
      ["Place 1 Fort in each Region you occupy (max 1 per Region, max 10 Forts on the boards).", "Ponha 1 Forte em cada Região que você ocupa (máx. 1 por Região, máx. 10 Fortes nos tabuleiros)."],
      ["A Fort adds 1 to the Region's defense, like an extra Race token, and remains while In Decline.", "Um Forte soma 1 à defesa da Região, como um marcador de Raça extra, e continua quando Em Declínio."],
      ["Discard the Fort when the Region is conquered or emptied.", "Descarte o Forte quando a Região for conquistada ou esvaziada."]
    ] },
    { id: "herbalist", name: "Herbalist", value: 4, code: "p13", lines: [
      ["+1 bonus Victory Coin for each Hill Region you control at the end of your turn.", "+1 Moeda de Vitória bônus por Região de Colina que você controla no fim do turno."]
    ] },
    { id: "intimidating", name: "Intimidating", value: 4, code: "p13", lines: [
      ["3 times per turn, move 1 Race token (Active or In Decline) out of an opponent's neighboring Region to another Region controlled by that same Race; if it has none, discard the token.", "3 vezes por turno, tire 1 marcador de Raça (Ativa ou Em Declínio) de uma Região vizinha de um adversário e mova-o para outra Região controlada por essa mesma Raça; se ela não tiver outra, descarte o marcador."],
      ["The 3 uses may be in 3 Regions or several times in the same Region.", "Os 3 usos podem ser em 3 Regiões ou várias vezes na mesma Região."],
      ["Murlocs moved this way are always discarded.", "Murlocs movidos assim são sempre descartados."],
      ["A Wisp Wall or Fort in the Region must be discarded first (that counts as 1 use) before a token can be moved.", "Uma Muralha de Wisp ou Forte na Região precisa ser descartado antes (isso conta como 1 uso) para um marcador poder ser movido."],
      ["Use this power before your last conquest of the turn.", "Use este poder antes da última conquista do turno."]
    ] },
    { id: "marshdweller", name: "MarshDweller", value: 4, code: "p13", lines: [
      ["Opponents must pay you 1 Victory Coin before conquering any of your Swamp Regions.", "Os adversários precisam lhe pagar 1 Moeda de Vitória antes de conquistar qualquer Região de Pântano sua."],
      ["This power stays active while In Decline.", "Este poder continua valendo quando Em Declínio."]
    ] },
    { id: "mining", name: "Mining", value: 4, code: "p13", lines: [
      ["+1 bonus Victory Coin for each Cavern Region you control at the end of your turn.", "+1 Moeda de Vitória bônus por Região de Caverna que você controla no fim do turno."]
    ] },
    { id: "mountaineer", name: "Mountaineer", value: 4, code: "p13", lines: [
      ["+1 bonus Victory Coin for each Mountain Region you control at the end of your turn.", "+1 Moeda de Vitória bônus por Região de Montanha que você controla no fim do turno."]
    ] },
    { id: "portal-mage", name: "Portal Mage", value: 5, code: "p13", lines: [
      ["Twice per turn, swap ALL the tokens between 2 Magic Regions, except Mountain and Legendary Place tokens.", "Duas vezes por turno, troque TODOS os marcadores entre 2 Regiões Mágicas, exceto Montanhas e Locais Lendários."]
    ] },
    { id: "ranger", name: "Ranger", value: 4, code: "p13", lines: [
      ["+1 bonus Victory Coin for each Forest Region you control at the end of your turn.", "+1 Moeda de Vitória bônus por Região de Floresta que você controla no fim do turno."]
    ] },
    { id: "sailing", name: "Sailing", value: 5, code: "p13", lines: [
      ["Never pay the +1 travel cost when conquering a non-adjacent Entry Region.", "Nunca pague o +1 de custo de viagem ao conquistar uma Região de Entrada não adjacente."]
    ] },
    { id: "swamp-walker", name: "Swamp Walker", value: 4, code: "p13", lines: [
      ["+1 bonus Victory Coin for each Swamp Region you control at the end of your turn.", "+1 Moeda de Vitória bônus por Região de Pântano que você controla no fim do turno."]
    ] }
  ];

  // Artifacts and Legendary Places (p. 14).
  const ARTIFACTS = [
    { id: "aegis-of-aggramar", name: "Aegis of Aggramar", lines: [
      ["<strong>End of your turn:</strong> place the Aegis in one of your Regions.", "<strong>Fim do seu turno:</strong> ponha a Égide em uma das suas Regiões."],
      ["That Region is immune to all powers and conquest attempts unless the opponent first pays you 2 Victory Coins.", "Essa Região fica imune a todos os poderes e tentativas de conquista, a menos que o adversário lhe pague antes 2 Moedas de Vitória."]
    ] },
    { id: "ashes-of-alar", name: "Ashes of Al'ar", lines: [
      ["Once per turn, conquer any Region on any board, paying the normal cost as if it were adjacent.", "Uma vez por turno, conquiste qualquer Região de qualquer tabuleiro, pagando o custo normal como se fosse adjacente."]
    ] },
    { id: "doomhammer", name: "Doomhammer", lines: [
      ["Once per turn, conquer any 1 Region with only 1 token.", "Uma vez por turno, conquiste qualquer 1 Região com apenas 1 marcador."],
      ["First pay 2 Victory Coins to the previous owner of the Doomhammer; if there is none, pay them to the Victory stash.", "Antes pague 2 Moedas de Vitória ao dono anterior do Doomhammer; se não houver, pague ao estoque de Vitória."]
    ] },
    { id: "frostmourne", name: "Frostmourne", lines: [
      ["Once per turn, conquer a Region for 2 tokens less than normal (minimum 1 token).", "Uma vez por turno, conquiste uma Região por 2 marcadores a menos que o normal (mínimo 1 marcador)."]
    ] },
    { id: "heart-of-azeroth", name: "Heart of Azeroth", lines: [
      ["<strong>End of your turn:</strong> place it in one of your Regions.", "<strong>Fim do seu turno:</strong> ponha-o em uma das suas Regiões."],
      ["Each opponent whose Active Race occupies at least 1 Region adjacent to the Heart pays you 1 Victory Coin.", "Cada adversário cuja Raça Ativa ocupe pelo menos 1 Região adjacente ao Coração lhe paga 1 Moeda de Vitória."]
    ] }
  ];
  const PLACES = [
    { id: "battleground", name: "Battleground", lines: [
      ["The occupying Race may take the Faction Bonus a second time per Race: 2 Regions (or more) of the same opposing-Faction Race conquered this turn = 2 bonus Victory Coins.", "A Raça que o ocupa pode receber o Bônus de Facção uma segunda vez por Raça: 2 Regiões (ou mais) da mesma Raça da Facção oposta conquistadas neste turno = 2 Moedas de Vitória bônus."],
      ["A Neutral Race here may side with the Alliance or the Horde for its turn, gaining the Faction Bonus and this Battleground bonus; it is Neutral again at the end of the turn and may choose again next turn.", "Uma Raça Neutra aqui pode lutar ao lado da Aliança ou da Horda durante o turno, ganhando o Bônus de Facção e este bônus do Battleground; volta a ser Neutra no fim do turno e pode escolher de novo no turno seguinte."]
    ] },
    { id: "dark-portal", name: "Dark Portal", lines: [
      ["+2 bonus Victory Coins at the end of your turn for the Race controlling its Region.", "+2 Moedas de Vitória bônus no fim do turno para a Raça que controla a Região dele."]
    ] },
    { id: "karazhan", name: "Karazhan", lines: [
      ["+1 bonus Victory Coin at the end of your turn for each OTHER Region you control with the same terrain type as Karazhan's Region.", "+1 Moeda de Vitória bônus no fim do turno por OUTRA Região que você controla com o mesmo tipo de terreno da Região de Karazhan."]
    ] },
    { id: "lights-hope-chapel", name: "Light's Hope Chapel", lines: [
      ["The occupying Race loses no Race token when attacked.", "A Raça que a ocupa não perde nenhum marcador quando atacada."],
      ["When its Region is conquered by another player, the former owner still benefits one last time: no token discarded when taking them back.", "Quando a Região dela é conquistada por outro jogador, o antigo dono ainda se beneficia uma última vez: nenhum marcador é descartado ao recolhê-los."]
    ] },
    { id: "meeting-stone", name: "Meeting Stone", lines: [
      ["No +1 travel cost when conquering a non-adjacent Entry Region.", "Sem o +1 de custo de viagem ao conquistar uma Região de Entrada não adjacente."]
    ] },
    { id: "spirit-healer", name: "Spirit Healer", lines: [
      ["During Troop Redeployment, an Active Race occupying it receives 1 bonus Race token from the tray (if one is available).", "Durante o Reposicionamento, uma Raça Ativa que o ocupa recebe 1 marcador de Raça bônus da bandeja (se houver)."]
    ] },
    { id: "well-of-eternity", name: "Well of Eternity", lines: [
      ["When revealed, move it to the Sea or Lake Region of the same board; if there is none, draw another Legendary Place instead.", "Ao ser revelado, mova-o para a Região de Mar ou Lago do mesmo tabuleiro; se não houver, compre outro Local Lendário no lugar."],
      ["<strong>End of a turn:</strong> the Race that occupies more Regions adjacent to the Well than any other Race gains +2 bonus Victory Coins, even In Decline. Tie: nobody gets it.", "<strong>Fim de um turno:</strong> a Raça que ocupa mais Regiões adjacentes ao Poço que qualquer outra Raça ganha +2 Moedas de Vitória bônus, mesmo Em Declínio. Empate: ninguém ganha."]
    ] }
  ];

  const storageIssues = new Set();
  let state = loadPreferences();
  let setupState = loadSetup();
  let root = null;

  // ---------- state & storage ----------

  function normalizePreferences(saved) {
    const players = Number(saved?.players);
    return {
      language: saved?.language === "en-US" ? "en-US" : "pt-BR",
      players: PLAYER_COUNTS.includes(players) ? players : defaults.players
    };
  }

  // Only the player count changes the physical setup.
  function signature(source = state) {
    return `p${source.players}`;
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      return saved ? normalizePreferences(JSON.parse(saved)) : normalizePreferences(defaults);
    } catch (error) {
      storageIssues.add("preferences-read");
      console.error("Could not read Small World of Warcraft preferences.", error);
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
      console.error("Could not read Small World of Warcraft setup progress.", error);
      return { signature: signature(), checks: [] };
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state));
      storageIssues.delete("preferences-write");
    } catch (error) {
      storageIssues.add("preferences-write");
      console.error("Could not save Small World of Warcraft preferences.", error);
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify(setupState));
      storageIssues.delete("setup-write");
    } catch (error) {
      storageIssues.add("setup-write");
      console.error("Could not save Small World of Warcraft setup progress.", error);
    }
  }

  // ---------- helpers ----------

  function t(en, pt) {
    return state.language === "pt-BR" ? pt : en;
  }

  function tp(pair) {
    return t(pair[0], pair[1]);
  }

  function manualUrl(code) {
    const script = document.querySelector('script[src*="small-world-of-warcraft.js"]');
    const baseUrl = script?.src || document.baseURI;
    return `${new URL(`manuals/${MANUAL}`, baseUrl).href}#page=${Number(code.slice(1))}`;
  }

  function referenceLink(code) {
    const page = Number(code.slice(1));
    const label = t(`Rules p. ${page} ↗`, `Regras p. ${page} ↗`);
    return `<a class="source-link" href="${manualUrl(code)}" target="_blank" rel="noreferrer">${label}</a>`;
  }

  function refs(codes) {
    return codes.map(referenceLink).join("");
  }

  function sectionHeading(id, title, codes) {
    return `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("FIELD GUIDE", "GUIA DE CAMPO")} / ${sectionIndex(id)}</p>
          <h2 id="${id}">${title}</h2>
        </div>
        <div class="sww-section-references">${refs(codes)}</div>
      </div>`;
  }

  function lineList(items) {
    return `<ul class="card-lines">${items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function rl(labelEn, bodyEn, labelPt, bodyPt) {
    return `<strong>${t(labelEn, labelPt)}:</strong> ${t(bodyEn, bodyPt)}`;
  }

  function infoCard(label, title, lines, codes, extraClass = "") {
    return `
      <article class="info-card ${extraClass}">
        <span class="component-label">${label}</span>
        <h3>${title}</h3>
        ${lineList(lines)}
        ${refs(codes)}
      </article>`;
  }

  function interpretation(en, pt) {
    return `<span class="sww-interpretation">${t("Guide's reading", "Leitura do guia")}:</span> ${t(en, pt)}`;
  }

  function glyph(file, alt) {
    return `<img class="sww-glyph" src="${ICONS}${file}.webp" alt="${alt}">`;
  }

  // Marks rules the rulebook flags as new or different from the original Small World.
  function newRule() {
    return glyph("new-rule", t("New or changed rule (compared with Small World)", "Regra nova ou diferente (em relação ao Small World)"));
  }

  function figure(file, altEn, altPt, captionEn, captionPt, extraClass = "") {
    return `<figure class="sww-art ${extraClass}"><img src="${ART}${file}.webp" alt="${t(altEn, altPt)}" loading="lazy"><figcaption>${t(captionEn, captionPt)}</figcaption></figure>`;
  }

  function playersLabel(players = state.players) {
    return t(`${players} players`, `${players} jogadores`);
  }

  function factionName(faction) {
    return {
      alliance: t("Alliance", "Aliança"),
      horde: t("Horde", "Horda"),
      neutral: t("Neutral", "Neutra")
    }[faction];
  }

  function boardText(n = state.players) {
    const b = BOARDS[n];
    const parts = [];
    if (b.large) {
      parts.push(t(`${b.large} large`, `${b.large} grande${b.large > 1 ? "s" : ""}`));
    }
    if (b.medium) {
      parts.push(t(`${b.medium} medium`, `${b.medium} médio${b.medium > 1 ? "s" : ""}`));
    }
    if (b.small) {
      parts.push(t(`${b.small} small`, `${b.small} pequeno${b.small > 1 ? "s" : ""}`));
    }
    return parts.join(" + ");
  }

  function boardCount(n = state.players) {
    const b = BOARDS[n];
    return b.large + b.medium + b.small;
  }

  // ---------- sections ----------

  function sectionList() {
    return [
      ["quick-reference", t("Quick Ref", "Referência rápida")],
      ["setup", t("Setup", "Preparação")],
      ["overview", t("Goal, rounds & winning", "Objetivo, rodadas e vitória")],
      ["first-turn", t("Picking a combo", "Escolher um combo")],
      ["conquest", t("Conquering Regions", "Conquistar Regiões")],
      ["scoring", t("Scoring & Factions", "Pontuação e Facções")],
      ["later-turns", t("Later turns & Decline", "Turnos seguintes e Declínio")],
      ["races", t("The 16 Races", "As 16 Raças")],
      ["powers", t("The 20 Special Powers", "Os 20 Poderes Especiais")],
      ["artifacts", t("Artifacts & Legendary Places", "Artefatos e Locais Lendários")],
      ["icons", t("Terrain, symbols & tokens", "Terrenos, símbolos e marcadores")],
      ["examples", t("Illustrated examples", "Exemplos ilustrados")],
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
          <span class="brand-mark" aria-hidden="true">SW</span>
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

  function choiceCard(name, dataAttr, value, checked, title, description) {
    return `
      <label class="sww-choice-card ${checked ? "is-selected" : ""}">
        <input type="radio" name="${name}" value="${value}" data-${dataAttr}="${value}" ${checked ? "checked" : ""}>
        <span class="sww-choice-copy"><strong>${title}</strong><small>${description}</small></span>
      </label>`;
  }

  function playerChoiceText(n) {
    return t(
      `${boardCount(n)} boards (${boardText(n)}). ${ROUNDS[n]} rounds. ${n} Artifact/Legendary Place markers. ${n * 5} starting coins (five “1”s each).`,
      `${boardCount(n)} tabuleiros (${boardText(n)}). ${ROUNDS[n]} rodadas. ${n} marcadores de Artefato/Local Lendário. ${n * 5} moedas iniciais (cinco de “1” cada).`
    );
  }

  function matchConfiguration() {
    return `
      <section class="controls-panel sww-config" id="build-match" aria-labelledby="sww-config-title">
        <div class="panel-topline">
          <div>
            <p class="eyebrow">${t("BEFORE SETUP", "ANTES DA PREPARAÇÃO")}</p>
            <h2 id="sww-config-title">${t("Build your match", "Configure a partida")}</h2>
            <p>${t(
              "The rulebook has one choice that changes the setup and the game length: the number of players. Every Race, Special Power, Artifact and Legendary Place is always in play, so they are not chosen here. Changing the player count clears the setup checklist; switching the language clears nothing.",
              "O livro de regras tem uma escolha que muda a preparação e a duração: o número de jogadores. Todas as Raças, Poderes Especiais, Artefatos e Locais Lendários estão sempre em jogo, por isso não são escolhidos aqui. Mudar o número de jogadores limpa a lista da preparação; trocar o idioma não limpa nada."
            )}</p>
          </div>
        </div>
        <fieldset class="sww-choice-group">
          <legend>${t("Players · selected:", "Jogadores · selecionado:")} <span>${playersLabel()}</span></legend>
          <p class="sww-choice-intro">${t("2 to 5 players. The count decides which boards (islands) you use, how many rounds the Game Turn track runs and how many Artifact/Legendary Place markers go out.", "De 2 a 5 jogadores. O número decide quais tabuleiros (ilhas) usar, quantas rodadas a trilha de turnos dura e quantos marcadores de Artefato/Local Lendário entram.")} ${refs(["p3"])}</p>
          <div class="sww-choice-grid sww-choice-grid-players">
            ${PLAYER_COUNTS.map((n) => choiceCard("sww-players", "players", n, state.players === n, playersLabel(n), playerChoiceText(n))).join("")}
          </div>
        </fieldset>
        <p class="sww-config-summary"><strong>${t("This match:", "Esta partida:")}</strong> ${playersLabel()} · ${t(`${boardCount()} boards (${boardText()})`, `${boardCount()} tabuleiros (${boardText()})`)} · ${t(`${ROUNDS[state.players]} rounds`, `${ROUNDS[state.players]} rodadas`)} · ${t(`${state.players} Artifact/Place markers`, `${state.players} marcadores de Artefato/Local`)}</p>
      </section>`;
  }

  // ---------- setup ----------

  function phaseIds() {
    return setupPhases().map((phase) => phase.id);
  }

  function setupPhases() {
    const n = state.players;
    const b = BOARDS[n];
    const rounds = ROUNDS[n];
    const unusedBoards = { large: 2 - b.large, medium: 2 - b.medium, small: 2 - b.small };
    const unusedText = [
      unusedBoards.large ? t(`${unusedBoards.large} large`, `${unusedBoards.large} grande`) : "",
      unusedBoards.medium ? t(`${unusedBoards.medium} medium`, `${unusedBoards.medium} médio${unusedBoards.medium > 1 ? "s" : ""}`) : "",
      unusedBoards.small ? t(`${unusedBoards.small} small`, `${unusedBoards.small} pequeno`) : ""
    ].filter(Boolean).join(" + ");
    return [
      {
        id: "unbox",
        title: t("First game only: punch out and sort", "Só na primeira partida: destaque e separe"),
        codes: ["p3", "p10"],
        items: [
          t("Punch out every piece and sort them by type.", "Destaque todas as peças e separe-as por tipo."),
          t("Race tokens go in the removable storage tray, one compartment per Race. Murloc tokens, coins, markers, the die and the other tokens go in the main vacuum tray (see the storage picture on p. 10).", "Os marcadores de Raça vão para a bandeja removível, um compartimento por Raça. Murlocs, moedas, marcadores, o dado e os demais marcadores vão para a bandeja principal (veja a imagem de armazenamento na p. 10)."),
          t("Already sorted? Just tick this step.", "Já está tudo separado? Só marque esta etapa.")
        ]
      },
      {
        id: "boards",
        title: t(`Lay out ${boardCount()} boards: ${boardText()}`, `Monte ${boardCount()} tabuleiros: ${boardText()}`),
        codes: ["p3"],
        items: [
          t(`Pick at random a set of ${boardText()} board${boardCount() > 1 ? "s" : ""}. The size is the “S”, “M” or “L” icon printed in one Region of each board; each board is double-sided, so either side is fine.`, `Escolha ao acaso ${boardText()} tabuleiro${boardCount() > 1 ? "s" : ""}. O tamanho é o ícone “S”, “M” ou “L” impresso numa Região de cada tabuleiro; cada tabuleiro tem dois lados, qualquer lado serve.`),
          `${glyph("board-small", t("Small board icon", "Ícone de tabuleiro pequeno"))} ${glyph("board-medium", t("Medium board icon", "Ícone de tabuleiro médio"))} ${glyph("board-large", t("Large board icon", "Ícone de tabuleiro grande"))} ${t("S = small, M = medium, L = large.", "S = pequeno, M = médio, L = grande.")}`,
          t("Place them in the centre of the table, slightly apart. Each board is an Island; how you arrange them has no effect on the game.", "Ponha-os no centro da mesa, um pouco afastados. Cada tabuleiro é uma Ilha; o arranjo não muda nada no jogo."),
          unusedText ? t(`Return the other boards (${unusedText}) to the box.`, `Devolva os outros tabuleiros (${unusedText}) à caixa.`) : ""
        ]
      },
      {
        id: "track",
        title: t(`Game Turn track: ${rounds} rounds`, `Trilha de turnos: ${rounds} rodadas`),
        codes: ["p3", "p4"],
        items: [
          `${glyph("turn-marker", t("Game Turn marker", "Marcador de turno"))} ${t("Place the Game Turn track next to the boards with the Game Turn marker (the crown) on the first spot.", "Ponha a trilha de turnos ao lado dos tabuleiros com o marcador de turno (a coroa) no primeiro espaço.")}`,
          t(`With ${n} players the game ends at the end of round ${rounds}: the track shows the last spot for each count (spot 8 = 5 players, 9 = 4 players, 10 = 2/3 players).`, `Com ${n} jogadores o jogo termina no fim da rodada ${rounds}: a trilha mostra o último espaço de cada número (espaço 8 = 5 jogadores, 9 = 4 jogadores, 10 = 2/3 jogadores).`)
        ]
      },
      {
        id: "tray",
        title: t("Put the Race token tray within reach", "Deixe a bandeja de Raças ao alcance"),
        codes: ["p3"],
        items: [
          t("Pull the removable storage tray (all the Race tokens) out of the box and place it open next to the boards, within easy reach of all players.", "Tire da caixa a bandeja removível (todos os marcadores de Raça) e deixe-a aberta ao lado dos tabuleiros, ao alcance de todos."),
          t("This tray is the only supply of Race tokens: a Race can never have more tokens than its compartment holds.", "Essa bandeja é o único estoque de marcadores de Raça: uma Raça nunca pode ter mais marcadores do que há no compartimento dela.")
        ]
      },
      {
        id: "combos",
        title: t("Build the column of 6 Race + Special Power combos", "Monte a coluna de 6 combos Raça + Poder Especial"),
        codes: ["p3", "p4"],
        items: [
          t("Shuffle all 16 Race banners. Draw 5 at random and lay them colored side up (Active side) in a single column.", "Embaralhe as 16 bandeiras de Raça. Compre 5 ao acaso e disponha-as com o lado colorido (lado Ativo) para cima, numa única coluna."),
          t("Put the other 11 banners face up (colored side) in a single stack at the bottom of the column.", "Ponha as outras 11 bandeiras com o lado colorido para cima, numa única pilha, embaixo da coluna."),
          t("Shuffle all 20 Special Power badges. Place 1 to the LEFT of each banner (column and stack), its round edge fitting into the banner's round opening.", "Embaralhe as 20 insígnias de Poder Especial. Ponha 1 à ESQUERDA de cada bandeira (coluna e pilha), com a borda redonda encaixada na abertura redonda da bandeira."),
          t("Stack the remaining badges to the left of the banner stack, so the top badge pairs with the top banner.", "Empilhe as insígnias restantes à esquerda da pilha de bandeiras, para que a insígnia do topo forme par com a bandeira do topo."),
          t("Check: 6 combos are visible (5 in the column + the top of the stacks). The top combo will be free; each one lower costs 1 more coin.", "Confira: há 6 combos visíveis (5 na coluna + o topo das pilhas). O combo de cima será grátis; cada um mais abaixo custa 1 moeda a mais.")
        ]
      },
      {
        id: "map",
        title: t("Populate the map: Murlocs and Mountains", "Povoe o mapa: Murlocs e Montanhas"),
        codes: ["p3"],
        items: [
          `${glyph("symbol-murloc", t("Murloc symbol", "Símbolo de Murloc"))} ${t("Put 1 Murloc token on every Region that shows the Murloc symbol (a shell). Murlocs are an In Decline Race that belongs to no player.", "Ponha 1 marcador de Murloc em cada Região com o símbolo de Murloc (uma concha). Os Murlocs são uma Raça Em Declínio que não pertence a nenhum jogador.")}`,
          `${glyph("mountain", t("Mountain token", "Marcador de Montanha"))} ${t("Put 1 Mountain token on every Region that shows a Mountain.", "Ponha 1 marcador de Montanha em cada Região que mostra uma Montanha.")}`
        ]
      },
      {
        id: "markers",
        title: t(`Hide ${n} Artifact / Legendary Place markers`, `Esconda ${n} marcadores de Artefato / Local Lendário`),
        codes: ["p3", "p14"],
        items: [
          `${glyph("marker-facedown", t("Face-down marker", "Marcador virado para baixo"))} ${t("Shuffle the 12 Artifact and Legendary Place markers together, face down.", "Embaralhe os 12 marcadores de Artefato e Local Lendário juntos, virados para baixo.")}`,
          t(`Pick ${n} at random (one per player) and place 1 face down on each board, in the Region showing the “S”, “M” or “L” icon. Nobody looks at them.`, `Pegue ${n} ao acaso (um por jogador) e ponha 1, virado para baixo, em cada tabuleiro, na Região com o ícone “S”, “M” ou “L”. Ninguém olha.`),
          interpretation(`keep the other ${12 - n} markers face down beside the boards: the Well of Eternity may ask you to draw another Legendary Place.`, `deixe os outros ${12 - n} marcadores virados para baixo ao lado dos tabuleiros: o Well of Eternity pode mandar comprar outro Local Lendário.`)
        ]
      },
      {
        id: "coins",
        title: t("Coins: 5 to each player, the rest to the Victory stash", "Moedas: 5 a cada jogador, o resto no estoque"),
        codes: ["p3", "p8"],
        items: [
          `${glyph("coin-1", t("“1” Victory Coin", "Moeda de Vitória “1”"))} ${t(`Give each player five “1” Victory Coins (${n * 5} in all).`, `Dê a cada jogador cinco Moedas de Vitória de “1” (${n * 5} no total).`)}`,
          t("Put every other coin (the remaining “1”s and all “3”s, “5”s and “10”s) in a Victory stash next to the boards, within reach of all.", "Ponha todas as outras moedas (os “1” restantes e todos os “3”, “5” e “10”) num estoque de Vitória ao lado dos tabuleiros, ao alcance de todos."),
          t("Coins are both your currency and your score. Keep yours stacked and hidden; you may ask the stash for change at any time.", "As moedas são o seu dinheiro e a sua pontuação. Mantenha as suas empilhadas e escondidas; você pode pedir troco ao estoque a qualquer momento.")
        ]
      },
      {
        id: "pieces",
        title: t("Summary sheets, die and power tokens", "Folhas de resumo, dado e marcadores de poderes"),
        codes: ["p2"],
        items: [
          t(`Give each of the ${n} players a Player Summary sheet.`, `Dê uma folha de resumo a cada um dos ${n} jogadores.`),
          `${glyph("die", t("Reinforcement Die", "Dado de Reforço"))} ${t("Put the Reinforcement Die where everyone can reach it.", "Deixe o Dado de Reforço ao alcance de todos.")}`,
          t("Keep these tokens in the box tray, ready: they only come out with the Race or Special Power that uses them — Wisp Walls (9, Night Elves), Forts (10, Garrisoned), Watch Towers (6, Defensive), Harmony tokens (4, Pandaren), Military Objectives (2, Humans), Champion (1, Championing), Beasts (5, Beast Master), Bombs (12, Goblins).", "Deixe estes marcadores prontos na bandeja da caixa: eles só saem com a Raça ou o Poder Especial que os usa — Muralhas de Wisp (9, Night Elves), Fortes (10, Garrisoned), Torres de Vigia (6, Defensive), marcadores de Harmonia (4, Pandaren), Objetivos Militares (2, Humans), Campeão (1, Championing), Feras (5, Beast Master), Bombas (12, Goblins).")
        ]
      },
      {
        id: "first",
        title: t("Choose the first player", "Escolha o primeiro jogador"),
        codes: ["p4"],
        items: [
          t("The player who most recently played a video game goes first; play then goes clockwise.", "Começa quem jogou videogame mais recentemente; depois o jogo segue em sentido horário."),
          t("Nobody has a Race yet: on their first turn each player picks a combo, conquers and scores (see “Picking a combo”).", "Ninguém tem Raça ainda: no primeiro turno cada jogador escolhe um combo, conquista e pontua (veja “Escolher um combo”).")
        ]
      }
    ];
  }

  function inventory() {
    const n = state.players;
    const cards = [
      infoCard(t("ON THE TABLE", "NA MESA"), t(`${boardCount()} boards`, `${boardCount()} tabuleiros`), [
        rl("Boards", `${boardText()} (double-sided).`, "Tabuleiros", `${boardText()} (frente e verso).`),
        rl("Game Turn track", `marker on spot 1; ${ROUNDS[n]} rounds.`, "Trilha de turnos", `marcador no espaço 1; ${ROUNDS[n]} rodadas.`),
        rl("Storage tray", "182 Race tokens of 16 Races, open next to the boards.", "Bandeja", "182 marcadores de 16 Raças, aberta ao lado dos tabuleiros."),
        rl("Reinforcement Die", "1, shared.", "Dado de Reforço", "1, compartilhado.")
      ], ["p2", "p3"]),
      infoCard(t("COMBOS", "COMBOS"), t("16 banners + 20 badges", "16 bandeiras + 20 insígnias"), [
        rl("Column", "5 banner + badge pairs, face up.", "Coluna", "5 pares bandeira + insígnia, virados para cima."),
        rl("Stacks", "11 banners and 15 badges below the column; the top pair is the 6th combo.", "Pilhas", "11 bandeiras e 15 insígnias embaixo da coluna; o par do topo é o 6º combo.")
      ], ["p3"]),
      infoCard(t("ON THE MAP", "NO MAPA"), t("Placed at setup", "Postos na preparação"), [
        rl("Murloc tokens", "1 per Murloc-symbol Region (15 in the box).", "Murlocs", "1 por Região com símbolo de Murloc (15 na caixa)."),
        rl("Mountains", "1 per Mountain Region (10 in the box).", "Montanhas", "1 por Região de Montanha (10 na caixa)."),
        rl("Artifact / Place markers", `${n}, face down, 1 per board on the S/M/L Region; ${12 - n} kept aside face down.`, "Marcadores de Artefato / Local", `${n}, virados para baixo, 1 por tabuleiro na Região S/M/L; ${12 - n} separados virados para baixo.`)
      ], ["p3"]),
      infoCard(t("EACH PLAYER", "CADA JOGADOR"), playersLabel(), [
        rl("Coins", "five “1” Victory Coins, kept hidden.", "Moedas", "cinco Moedas de Vitória de “1”, escondidas."),
        rl("Player Summary sheet", "1.", "Folha de resumo", "1."),
        rl("Race", "none yet: picked on your first turn.", "Raça", "nenhuma ainda: escolhida no primeiro turno.")
      ], ["p2", "p3"]),
      infoCard(t("VICTORY STASH", "ESTOQUE DE VITÓRIA"), t("110 coins in the box", "110 moedas na caixa"), [
        rl("Values", "“1” ×35, “3” ×20, “5” ×25, “10” ×30.", "Valores", "“1” ×35, “3” ×20, “5” ×25, “10” ×30."),
        rl("Stash", `everything except the ${n * 5} starting “1”s.`, "Estoque", `tudo menos os ${n * 5} “1” iniciais.`)
      ], ["p2", "p3"]),
      infoCard(t("NOT USED", "NÃO USADO"), t("Left in the box", "Fica na caixa"), [
        n === 5 ? rl("Boards", "1 medium.", "Tabuleiros", "1 médio.") : rl("Boards", `${6 - boardCount()} (the sizes not listed above).`, "Tabuleiros", `${6 - boardCount()} (os tamanhos não listados acima).`),
        n === 5 ? "" : rl("Player Summary sheets", `${5 - n}.`, "Folhas de resumo", `${5 - n}.`),
        rl("Team Variant Rules sheet", "not supplied with this guide; not covered.", "Folha da variante em equipes", "não fornecida a este guia; não coberta.")
      ], ["p2"])
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
          <div class="setup-phase-references">${refs(phase.codes)}</div>
        </header>
        <label class="sww-setup-check" for="sww-setup-${phase.id}">
          <input id="sww-setup-${phase.id}" type="checkbox" data-setup-check="${phase.id}" ${setupState.checks.includes(phase.id) ? "checked" : ""}>
          <span class="sww-setup-copy">
            <strong>${t("Check only when every substep is complete", "Marque somente quando todos os subpassos estiverem concluídos")}</strong>
            <ul class="sww-setup-substeps">${phase.items.filter(Boolean).map((item) => `<li>${item}</li>`).join("")}</ul>
          </span>
        </label>
      </article>`).join("");
    return `
      ${sectionHeading("setup", t("Setup", "Preparação"), ["p3"])}
      <div class="setup-checklist-panel">
        <div class="setup-checklist-toolbar">
          <div>
            <p class="eyebrow">${t("STEP-BY-STEP", "PASSO A PASSO")}</p>
            <h3>${playersLabel()} · ${t(`${boardCount()} boards`, `${boardCount()} tabuleiros`)} · ${t(`${ROUNDS[state.players]} rounds`, `${ROUNDS[state.players]} rodadas`)}</h3>
            <p>${t("One checkbox per coherent step, in the rulebook's order (p. 3, items 1–10).", "Uma caixa por etapa coerente, na ordem do livro de regras (p. 3, itens 1–10).")}</p>
          </div>
          <div class="setup-progress-controls">
            <span id="setup-progress-label" aria-live="polite">${t(`${done} of ${phases.length} steps checked`, `${done} de ${phases.length} etapas marcadas`)}</span>
            <progress id="setup-progress" max="${phases.length}" value="${done}" aria-label="${t("Setup checklist progress", "Progresso da preparação")}"></progress>
            <button class="button-secondary" type="button" data-setup-reset>${t("Uncheck all", "Desmarcar tudo")}</button>
          </div>
        </div>
        <p class="setup-storage-note">${t(
          "Progress is saved on this device separately from the match options. Changing the number of players clears it; the language does not. “Uncheck all” clears only these setup boxes — use it before the next game.",
          "O progresso é salvo neste aparelho separado das opções da partida. Mudar o número de jogadores o limpa; o idioma não. “Desmarcar tudo” limpa somente estas caixas da preparação — use antes da próxima partida."
        )}</p>
      </div>
      <div class="setup-phases">${phaseMarkup}</div>
      <div class="sww-art-row">
        ${figure("setup-3p", "Three islands with Murlocs, Mountains, face-down markers, the Game Turn track and coins", "Três ilhas com Murlocs, Montanhas, marcadores virados, a trilha de turnos e moedas", "A 3-player setup (p. 2): 1 Game Turn track, 6 Murlocs on their symbols, 7 Mountains, 8 a face-down marker on each board's S/M/L Region, 9 five “1” coins per player. The combo column and stash are just off the edge.", "Preparação para 3 jogadores (p. 2): 1 trilha de turnos, 6 Murlocs nos símbolos, 7 Montanhas, 8 um marcador virado na Região S/M/L de cada tabuleiro, 9 cinco moedas de “1” por jogador. A coluna de combos e o estoque ficam logo além da borda.", "sww-art-tall")}
      </div>
      <h3 class="subhead">${t("Components for this match", "Componentes desta partida")}</h3>
      ${inventory()}`;
  }

  // ---------- quick reference ----------

  function quickReference() {
    const n = state.players;
    const cards = [
      infoCard(t("ROUNDS", "RODADAS"), `${glyph("turn-marker", t("Game Turn marker", "Marcador de turno"))} ${t(`${ROUNDS[n]} rounds for ${n} players`, `${ROUNDS[n]} rodadas para ${n} jogadores`)}`, [
        rl("Each round", "every player takes 1 turn, clockwise from the first player.", "Cada rodada", "cada jogador faz 1 turno, em sentido horário a partir do primeiro jogador."),
        rl("New round", "the first player moves the Game Turn marker 1 spot forward, then plays.", "Nova rodada", "o primeiro jogador avança o marcador de turno 1 espaço e então joga."),
        rl("End", `after everyone plays round ${ROUNDS[n]} (the last spot for ${n} players).`, "Fim", `depois que todos jogam a rodada ${ROUNDS[n]} (o último espaço para ${n} jogadores).`),
        rl("Winner", "most Victory Coins. Tie: most Race tokens (Active + In Decline) on the boards.", "Vencedor", "mais Moedas de Vitória. Empate: mais marcadores de Raça (Ativos + Em Declínio) nos tabuleiros.")
      ], ["p3", "p4", "p9"]),
      infoCard(t("TURN WITH A NEW RACE", "TURNO COM RAÇA NOVA"), t("Your first turn, or the turn after a Decline", "O primeiro turno, ou o turno após um Declínio"), [
        rl("1 · Pick a combo", "the top one is free; each lower one costs 1 more: put 1 of your coins on each combo above it. Take any coins lying on your combo.", "1 · Escolha um combo", "o de cima é grátis; cada um mais abaixo custa 1 a mais: ponha 1 moeda sua em cada combo acima dele. Pegue as moedas que estiverem no seu combo."),
        rl("2 · Take tokens", "banner value + badge value, from the tray.", "2 · Pegue marcadores", "valor da bandeira + valor da insígnia, da bandeja."),
        rl("3 · Refill", "slide the combos below (with their coins) up; reveal a new 6th combo.", "3 · Reponha", "suba os combos de baixo (com as moedas); revele um novo 6º combo."),
        rl("4 · First conquest", "an Entry Region (anchor) of any board; usually 3+ tokens (2 + travel cost).", "4 · Primeira conquista", "uma Região de Entrada (âncora) de qualquer tabuleiro; em geral 3+ marcadores (2 + custo de viagem)."),
        rl("5 · Conquer, redeploy, score", "as in any turn.", "5 · Conquiste, reposicione, pontue", "como em qualquer turno.")
      ], ["p4", "p5"]),
      infoCard(t("LATER TURNS", "TURNOS SEGUINTES"), t("Choose ONE: Expand or Decline", "Escolha UM: Expandir ou Declinar"), [
        rl("Expand · Ready your troops", "leave 1 token in each of your Regions; take the rest back in hand.", "Expandir · Prepare as tropas", "deixe 1 marcador em cada Região sua; recolha o resto para a mão."),
        rl("Expand · Abandon (optional)", "empty whole Regions to free more tokens; they stop being yours.", "Expandir · Abandonar (opcional)", "esvazie Regiões inteiras para liberar marcadores; elas deixam de ser suas."),
        rl("Expand · Conquer", "conquests, final die roll, redeployment, scoring.", "Expandir · Conquistar", "conquistas, rolagem final do dado, reposicionamento, pontuação."),
        rl("Decline · Banner & badge", "flip the banner to its gray side; discard the badge.", "Declinar · Bandeira e insígnia", "vire a bandeira para o lado cinza; descarte a insígnia."),
        rl("Decline · Tokens", "keep 1 token per Region, flipped face down (Tauren: 2); return the rest to the tray. An older In Decline Race is removed first.", "Declinar · Marcadores", "deixe 1 marcador por Região, virado (Tauren: 2); devolva o resto à bandeja. Uma Raça Em Declínio anterior é removida antes."),
        rl("Decline · Then", "NO conquests; score; turn ends. Next turn: pick a new combo.", "Declinar · Depois", "SEM conquistas; pontue; o turno acaba. No próximo turno: escolha um novo combo.")
      ], ["p8", "p9"]),
      infoCard(t("CONQUEST COST", "CUSTO DE CONQUISTA"), t("Tokens needed in hand", "Marcadores necessários na mão"), [
        rl("Base", "2 Race tokens.", "Base", "2 marcadores de Raça."),
        `${glyph("mountain", t("Mountain", "Montanha"))} ${glyph("fort", t("Fort", "Forte"))} ${glyph("wisp-wall", t("Wisp Wall", "Muralha de Wisp"))} ${rl("+1 each", "Mountain, Fort, Wisp Wall in the Region.", "+1 cada", "Montanha, Forte, Muralha de Wisp na Região.")}`,
        rl("+1 each", "Murloc or other Race token there (Active or In Decline).", "+1 cada", "Murloc ou marcador de outra Raça ali (Ativa ou Em Declínio)."),
        `${glyph("entry-region", t("Entry Region", "Região de Entrada"))} ${rl("+1 travel cost", "an Entry Region not adjacent to one of your Regions.", "+1 custo de viagem", "Região de Entrada não adjacente a uma Região sua.")}`,
        rl("Reductions", "never below 1 token; and you always need at least 1 unused token to start a conquest.", "Reduções", "nunca abaixo de 1 marcador; e você sempre precisa de pelo menos 1 marcador livre para iniciar uma conquista."),
        rl("Seas & Lakes", "cannot be conquered (except by the Naga: 2 tokens).", "Mares e Lagos", "não podem ser conquistados (exceto pelas Naga: 2 marcadores).")
      ], ["p5"]),
      infoCard(t("WHERE YOU MAY CONQUER", "ONDE VOCÊ PODE CONQUISTAR"), t("Unless a power says otherwise", "Salvo se um poder disser outra coisa"), [
        rl("Adjacent", "to a Region your Active Race already occupies, OR", "Adjacente", "a uma Região que a sua Raça Ativa já ocupa, OU"),
        rl("Any Entry Region", "of any board (+1 travel cost if not adjacent to your Regions).", "Qualquer Região de Entrada", "de qualquer tabuleiro (+1 de custo de viagem se não for adjacente às suas Regiões)."),
        rl("Conquered tokens stay", "in that Region until Troop Redeployment.", "Os marcadores ficam", "na Região conquistada até o Reposicionamento."),
        rl("As many as you can", "repeat while you have enough tokens left.", "Quantas puder", "repita enquanto tiver marcadores suficientes.")
      ], ["p5", "p6"]),
      infoCard(t("DEFENDER'S LOSSES", "PERDAS DO DEFENSOR"), t("When you take an occupied Region", "Quando você toma uma Região ocupada"), [
        rl("Discard 1", "the defender permanently returns 1 of those tokens to the tray.", "Descarte 1", "o defensor devolve de vez 1 desses marcadores à bandeja."),
        rl("Keep the rest", "in hand and redeploy them in Regions they still hold, at the end of YOUR turn (anywhere, not only adjacent).", "Fica com o resto", "na mão e os reposiciona em Regiões que ainda tem, no fim do SEU turno (em qualquer lugar, não só adjacente)."),
        rl("Nowhere left", "they enter again next turn as a First Conquest.", "Sem Regiões", "entram de novo no próximo turno como Primeira Conquista."),
        rl("Single defender", "a lone token (e.g. a Murloc or an In Decline token) is simply discarded. Several In Decline tokens: all discarded.", "Defensor único", "um marcador sozinho (ex.: um Murloc ou um marcador Em Declínio) é simplesmente descartado. Vários marcadores Em Declínio: todos descartados."),
        rl("Mountains", "never move; they defend the new owner.", "Montanhas", "nunca saem; defendem o novo dono.")
      ], ["p5", "p9"]),
      infoCard(t("FINAL CONQUEST", "CONQUISTA FINAL"), `${glyph("die", t("Reinforcement Die", "Dado de Reforço"))} ${t("Reinforcement Die, once", "Dado de Reforço, uma vez")}`, [
        rl("When", "your last conquest of the turn, with at least 1 unused token but not enough to conquer outright.", "Quando", "a última conquista do turno, com pelo menos 1 marcador livre mas sem o bastante para conquistar direto."),
        rl("Pick first", "a Region you are 3 tokens short or less; then roll once.", "Escolha antes", "uma Região à qual faltem 3 marcadores ou menos; depois role uma vez."),
        rl("Tokens + die ≥ cost", "conquer it with your remaining tokens.", "Marcadores + dado ≥ custo", "conquiste-a com os marcadores restantes."),
        rl("Otherwise", "place them in a Region you already held.", "Senão", "ponha-os numa Região que você já tinha."),
        rl("Either way", "your conquests end.", "De qualquer forma", "as suas conquistas acabam.")
      ], ["p6"]),
      infoCard(t("REDEPLOY & SCORE", "REPOSICIONAR E PONTUAR"), t("End of your turn", "Fim do seu turno"), [
        rl("Redeploy", "move your Active tokens freely between your Regions; at least 1 must stay in each.", "Reposicione", "mova os marcadores Ativos livremente entre as suas Regiões; pelo menos 1 fica em cada."),
        rl("1 coin per Region", "occupied by your Active AND your In Decline tokens.", "1 moeda por Região", "ocupada pelos seus marcadores Ativos E Em Declínio."),
        rl("Bonuses", "Race, Special Power, Artifacts, Places: Active Race only, unless stated.", "Bônus", "Raça, Poder Especial, Artefatos, Locais: só a Raça Ativa, salvo indicação."),
        rl("Faction Bonus", "+1 per Race of the opposite Faction you took a Region from.", "Bônus de Facção", "+1 por Raça da Facção oposta da qual você tomou uma Região.")
      ], ["p6", "p7", "p8"]),
      infoCard(t("FACTIONS", "FACÇÕES"), `${glyph("faction-alliance", t("Alliance", "Aliança"))} ${glyph("faction-horde", t("Horde", "Horda"))}`, [
        rl("Alliance", RACES.filter((r) => r.faction === "alliance").map((r) => r.name).join(", ") + ".", "Aliança", RACES.filter((r) => r.faction === "alliance").map((r) => r.name).join(", ") + "."),
        rl("Horde", RACES.filter((r) => r.faction === "horde").map((r) => r.name).join(", ") + ".", "Horda", RACES.filter((r) => r.faction === "horde").map((r) => r.name).join(", ") + "."),
        rl("Neutral", RACES.filter((r) => r.faction === "neutral").map((r) => r.name).join(", ") + " (and the Murlocs): no Faction Bonus, given or received.", "Neutras", RACES.filter((r) => r.faction === "neutral").map((r) => r.name).join(", ") + " (e os Murlocs): sem Bônus de Facção, nem dando nem recebendo.")
      ], ["p2", "p7"])
    ];
    return `
      ${sectionHeading("quick-reference", t("Quick Reference", "Referência rápida"), ["p4", "p5", "p6", "p7", "p8", "p9"])}
      <p class="glossary-intro">${t(`Rules marked ${newRule()} are new or different from the original Small World.`, `Regras marcadas com ${newRule()} são novas ou diferentes do Small World original.`)}</p>
      <div class="quick-grid">${cards.join("")}</div>`;
  }

  // ---------- rule sections ----------

  function overviewSection() {
    const n = state.players;
    return `
      ${sectionHeading("overview", t("Goal, rounds & winning", "Objetivo, rodadas e vitória"), ["p4", "p9"])}
      <div class="quick-grid">
        ${infoCard(t("THE IDEA", "A IDEIA"), t("Conquer, score, decline, start again", "Conquistar, pontuar, declinar, recomeçar"), [
          t("Pick a Race + Special Power combo and use its tokens to conquer Regions of Azeroth.", "Escolha um combo Raça + Poder Especial e use os marcadores para conquistar Regiões de Azeroth."),
          t("At the end of each turn you earn Victory Coins for every Region you occupy, often at your weaker neighbours' expense.", "No fim de cada turno você ganha Moedas de Vitória por Região ocupada, muitas vezes à custa de vizinhos mais fracos."),
          t("Your Race eventually over-extends: put it In Decline and ride a new one to supremacy. Timing that is the key to winning.", "A sua Raça acaba se espalhando demais: ponha-a Em Declínio e cavalgue uma nova até o topo. Acertar esse momento é a chave da vitória.")
        ], ["p4"])}
        ${infoCard(t("ROUNDS", "RODADAS"), t(`${ROUNDS[n]} rounds with ${n} players`, `${ROUNDS[n]} rodadas com ${n} jogadores`), [
          t("The player who most recently played a video game goes first; then clockwise. When everyone has played once, a new round begins.", "Começa quem jogou videogame mais recentemente; depois em sentido horário. Quando todos jogaram uma vez, começa uma nova rodada."),
          t("At the start of each new round the first player moves the Game Turn marker 1 spot forward, then takes their turn.", "No início de cada nova rodada o primeiro jogador avança o marcador de turno 1 espaço e então faz o turno."),
          t("Lengths: 8 rounds with 5 players, 9 with 4, 10 with 2 or 3.", "Durações: 8 rodadas com 5 jogadores, 9 com 4, 10 com 2 ou 3.")
        ], ["p3", "p4"])}
        ${infoCard(t("END OF THE GAME", "FIM DO JOGO"), t("Most Victory Coins wins", "Vence quem tem mais Moedas de Vitória"), [
          t(`When the marker reaches its last spot (${ROUNDS[n]}), everyone plays one final turn and the game ends.`, `Quando o marcador chega ao último espaço (${ROUNDS[n]}), todos fazem um último turno e o jogo acaba.`),
          t("Reveal and count everyone's coins (they were hidden all game). Highest total wins.", "Revelem e contem as moedas de todos (ficaram escondidas o jogo todo). Vence o maior total."),
          rl("Tie", "the tied player with the most Race tokens (Active + In Decline) still on the boards wins.", "Empate", "vence, entre os empatados, quem tiver mais marcadores de Raça (Ativos + Em Declínio) ainda nos tabuleiros.")
        ], ["p9"], "victory-card")}
        ${infoCard(t("SMALL WORLD VETERANS", "VETERANOS DE SMALL WORLD"), `${newRule()} ${t("What changed", "O que mudou")}`, [
          t("The mechanics are close to the original game; rules that are new or different carry this icon in the rulebook and in this guide.", "A mecânica é parecida com a do jogo original; regras novas ou diferentes têm este ícone no livro e neste guia."),
          t("Main changes: separate island boards with Entry Regions and a travel cost, board sets by player count, the Alliance/Horde Faction Bonus, Artifacts and Legendary Places, Murlocs instead of Lost Tribes.", "Principais mudanças: tabuleiros-ilha separados com Regiões de Entrada e custo de viagem, conjuntos de tabuleiros por número de jogadores, Bônus de Facção Aliança/Horda, Artefatos e Locais Lendários, Murlocs.")
        ], ["p3", "p5", "p7", "p14"])}
      </div>`;
  }

  function firstTurnSection() {
    return `
      ${sectionHeading("first-turn", t("Picking a Race + Special Power combo", "Escolher um combo Raça + Poder Especial"), ["p4", "p5"])}
      <div class="quick-grid">
        ${infoCard(t("FIRST ROUND", "PRIMEIRA RODADA"), t("Each player, on their turn", "Cada jogador, no seu turno"), [
          rl("1", "picks a Race and Special Power combo;", "1", "escolhe um combo Raça e Poder Especial;"),
          rl("2", "conquers some Regions;", "2", "conquista algumas Regiões;"),
          rl("3", "scores some Victory Coins.", "3", "pontua algumas Moedas de Vitória."),
          t("You do the same on the turn after putting a Race In Decline.", "Você faz o mesmo no turno seguinte a pôr uma Raça Em Declínio.")
        ], ["p4", "p9"])}
        ${infoCard(t("COST", "CUSTO"), t("Position in the column", "Posição na coluna"), [
          rl("Choose", "any of the 6 visible combos (the top of the stacks counts).", "Escolha", "qualquer um dos 6 combos visíveis (o topo das pilhas conta)."),
          rl("Top combo", "free.", "Combo de cima", "grátis."),
          rl("Each lower combo", "1 more coin: drop 1 of your coins on EACH combo above the one you take.", "Cada combo abaixo", "1 moeda a mais: ponha 1 moeda sua em CADA combo acima do que você pega."),
          rl("Coins on your combo", "left by players who passed it up: you pocket them, but you still pay for the combos above.", "Moedas no seu combo", "deixadas por quem o pulou: você as embolsa, mas ainda paga pelos combos acima.")
        ], ["p4"])}
        ${infoCard(t("TAKE YOUR TOKENS", "PEGUE OS MARCADORES"), t("Banner + badge", "Bandeira + insígnia"), [
          t("Place the combo face up in front of you.", "Ponha o combo virado para cima à sua frente."),
          t("Take from the tray as many of that Race's tokens as the banner's number + the badge's number (e.g. Herbalist 4 + Forsaken 6 = 10).", "Pegue da bandeja tantos marcadores dessa Raça quanto o número da bandeira + o número da insígnia (ex.: Herbalist 4 + Forsaken 6 = 10)."),
          t("These are the only tokens this Race will ever have, unless a power or Place gives more (Forsaken, Spirit Healer, Beast Master…).", "Esses são os únicos marcadores que essa Raça terá, salvo se um poder ou Local der mais (Forsaken, Spirit Healer, Beast Master…)."),
          t("Extra tokens are limited by what is physically left in the tray: 20 Forsaken on the boards means no more Forsaken.", "Marcadores extras são limitados ao que sobra fisicamente na bandeja: 20 Forsaken nos tabuleiros significa que não há mais Forsaken.")
        ], ["p4"])}
        ${infoCard(t("REFILL THE COLUMN", "REPONHA A COLUNA"), t("Always 6 combos", "Sempre 6 combos"), [
          t("Slide the combos below the gap up one position, together with any coins on them.", "Suba uma posição os combos abaixo do espaço vazio, com as moedas que estiverem neles."),
          t("Reveal a new combo from the top of the stacks.", "Revele um novo combo do topo das pilhas."),
          t("If the banners or badges run out, shuffle the discards into a new stack.", "Se as bandeiras ou insígnias acabarem, embaralhe os descartes numa nova pilha.")
        ], ["p5", "p9"])}
      </div>
      <div class="sww-art-row">
        ${figure("pick-combo", "The combo column with coins dropped on the two combos above the third", "A coluna de combos com moedas nos dois combos acima do terceiro", "Wanting the Herbalist Forsaken (third combo), the player drops 1 coin on each of the 2 combos above it (p. 4).", "Para pegar Herbalist Forsaken (terceiro combo), o jogador põe 1 moeda em cada um dos 2 combos acima (p. 4).")}
        ${figure("combo-tokens", "Herbalist badge and Forsaken banner above 10 Forsaken tokens", "Insígnia Herbalist e bandeira Forsaken acima de 10 marcadores Forsaken", "The chosen combo and its 4 + 6 = 10 Race tokens (p. 4).", "O combo escolhido e os seus 4 + 6 = 10 marcadores de Raça (p. 4).")}
        ${figure("replenish-column", "Before and after: the combos below slide up and a new one appears", "Antes e depois: os combos de baixo sobem e aparece um novo", "Refilling the column (p. 5).", "Repondo a coluna (p. 5).")}
      </div>`;
  }

  function conquestSection() {
    return `
      ${sectionHeading("conquest", t("Conquering Regions", "Conquistar Regiões"), ["p5", "p6"])}
      <div class="sww-icon-strip">
        <span>${glyph("wisp-wall", t("Wisp Wall", "Muralha de Wisp"))} +1</span>
        <span>${glyph("fort", t("Fort", "Forte"))} +1</span>
        <span>${glyph("mountain", t("Mountains", "Montanhas"))} +1</span>
        <span>${glyph("entry-region", t("Entry Region", "Região de Entrada"))} +1</span>
      </div>
      <div class="quick-grid">
        ${infoCard(t("FIRST CONQUEST", "PRIMEIRA CONQUISTA"), `${newRule()} ${t("Arrive by sea", "Chegue pelo mar")}`, [
          t("A Race entering the map for the first time may start on any Island (board), but must first conquer one of its Entry Regions (anchor icon).", "Uma Raça que entra no mapa pela primeira vez pode começar em qualquer Ilha (tabuleiro), mas precisa primeiro conquistar uma das Regiões de Entrada (ícone de âncora)."),
          t("It travels by sea, so it pays the travel cost: at least 3 tokens (2 + 1).", "Ela viaja pelo mar, então paga o custo de viagem: pelo menos 3 marcadores (2 + 1)."),
          t("Example: a Murloc-occupied Fields Entry Region costs 4 (2 + 1 Murloc + 1 travel).", "Exemplo: uma Região de Entrada de Campos com Murloc custa 4 (2 + 1 Murloc + 1 viagem).")
        ], ["p5"])}
        ${infoCard(t("CONQUEST COST", "CUSTO DE CONQUISTA"), `${newRule()} ${t("Tokens you must deploy", "Marcadores que você precisa pôr")}`, [
          rl("2", "Race tokens, plus:", "2", "marcadores de Raça, mais:"),
          rl("+1", "for each Wisp Wall, Fort or Mountain in the Region;", "+1", "por Muralha de Wisp, Forte ou Montanha na Região;"),
          rl("+1", "travel cost if it is an Entry Region not adjacent to a Region your Race already occupies;", "+1", "de custo de viagem se for uma Região de Entrada não adjacente a uma Região que a sua Raça já ocupa;"),
          rl("+1", "for each Murloc or other Race's token already there.", "+1", "por Murloc ou marcador de outra Raça já presente."),
          rl("Seas and Lakes", "normally cannot be conquered; when they can (Naga) they cost 2 tokens and score 1 coin like any Region.", "Mares e Lagos", "normalmente não podem ser conquistados; quando podem (Naga) custam 2 marcadores e rendem 1 moeda como qualquer Região."),
          rl("Important", "whatever your Race or Power, you must always have at least 1 Race token available to start a new conquest.", "Importante", "seja qual for a Raça ou o Poder, você sempre precisa de pelo menos 1 marcador de Raça disponível para iniciar uma nova conquista.")
        ], ["p5"])}
        ${infoCard(t("DEPLOYING", "POSICIONAR"), t("Tokens stay where they conquered", "Os marcadores ficam onde conquistaram"), [
          t("Put the tokens you used inside the conquered Region's borders.", "Ponha os marcadores usados dentro das fronteiras da Região conquistada."),
          t("They stay there until Troop Redeployment at the end of your turn.", "Eles ficam ali até o Reposicionamento no fim do turno.")
        ], ["p5"])}
        ${infoCard(t("SUBSEQUENT CONQUESTS", "CONQUISTAS SEGUINTES"), `${newRule()} ${t("Keep going while you have tokens", "Continue enquanto tiver marcadores")}`, [
          t("Repeat the process for as many Regions as your tokens allow.", "Repita o processo para quantas Regiões os marcadores permitirem."),
          rl("Each new Region must be", "adjacent to (sharing a border with) a Region your Active Race occupies, OR", "Cada nova Região precisa ser", "adjacente a (com fronteira com) uma Região ocupada pela sua Raça Ativa, OU"),
          t("any Entry Region of any board, paying +1 travel cost if it is not adjacent to your Regions.", "qualquer Região de Entrada de qualquer tabuleiro, pagando +1 de custo de viagem se não for adjacente às suas Regiões."),
          t("Your Race and Special Power may change these rules.", "A sua Raça e o seu Poder Especial podem mudar essas regras.")
        ], ["p6"])}
        ${infoCard(t("ENEMY LOSSES & WITHDRAWALS", "PERDAS E RETIRADAS DO INIMIGO"), t("Another player's tokens were there", "Havia marcadores de outro jogador"), [
          t("That player immediately takes ALL those tokens back in hand.", "Esse jogador recolhe imediatamente TODOS esses marcadores para a mão."),
          rl("Permanently discard 1", "back into the storage tray.", "Descarta de vez 1", "de volta à bandeja."),
          rl("Keep the others", "and redeploy them in any Region(s) still occupied by that Race, as the final action of the current player's turn; they need not be adjacent.", "Fica com os outros", "e os reposiciona em qualquer Região ainda ocupada por essa Raça, como ação final do turno do jogador atual; não precisam ser adjacentes."),
          t("If all its Regions were taken this turn, those tokens wait in hand and re-enter next turn as a First Conquest.", "Se todas as Regiões dela foram tomadas neste turno, esses marcadores esperam na mão e entram de novo no próximo turno como Primeira Conquista."),
          t("A Region defended by a single token (typically a Murloc or an In Decline token): that token is discarded.", "Uma Região defendida por um único marcador (em geral um Murloc ou um marcador Em Declínio): esse marcador é descartado."),
          t("You may conquer a Region held by your own In Decline token: you lose that token but free the Region for your Active Race.", "Você pode conquistar uma Região ocupada pelo seu próprio marcador Em Declínio: perde esse marcador, mas libera a Região para a sua Raça Ativa."),
          t("Mountains never move: they now defend the new conqueror.", "Montanhas nunca saem: agora defendem o novo conquistador.")
        ], ["p5"])}
        ${infoCard(t("FINAL CONQUEST ATTEMPT", "TENTATIVA FINAL DE CONQUISTA"), `${glyph("die", t("Reinforcement Die", "Dado de Reforço"))} ${t("Reinforcement Die roll", "Rolagem do Dado de Reforço")}`, [
          t("For your last conquest of the turn, if you lack the tokens to conquer outright but still have at least 1 unused token:", "Na última conquista do turno, se faltarem marcadores para conquistar direto mas ainda houver pelo menos 1 marcador livre:"),
          rl("1", "select a Region you are 3 tokens short or less to conquer (it need not be the weakest one);", "1", "escolha uma Região à qual faltem 3 marcadores ou menos (não precisa ser a mais fraca);"),
          rl("2", "roll the Reinforcement Die once;", "2", "role o Dado de Reforço uma vez;"),
          rl("3", "if tokens left + die result reach the cost, deploy your remaining tokens there;", "3", "se os marcadores restantes + o resultado do dado alcançarem o custo, ponha ali os marcadores restantes;"),
          rl("4", "otherwise put them in one of the Regions you already occupied.", "4", "senão ponha-os numa das Regiões que você já ocupava."),
          t("Either way, your conquests end immediately.", "Em qualquer caso, as suas conquistas acabam na hora.")
        ], ["p6"])}
        ${infoCard(t("TROOP REDEPLOYMENT", "REPOSICIONAMENTO"), t("After your conquests", "Depois das conquistas"), [
          t("Move your Race tokens on the boards freely from any of your Regions to any other of your Regions, adjacent or not.", "Mova os seus marcadores nos tabuleiros livremente de qualquer Região sua para qualquer outra Região sua, adjacente ou não."),
          t("At least 1 token must remain in each Region you control.", "Pelo menos 1 marcador precisa ficar em cada Região que você controla.")
        ], ["p6"])}
      </div>`;
  }

  function scoringSection() {
    const list = (faction) => RACES.filter((r) => r.faction === faction).map((r) => `${glyph(`race-${r.id}`, r.name)} ${r.name}`);
    return `
      ${sectionHeading("scoring", t("Scoring Victory Coins & Factions", "Pontuar Moedas de Vitória e Facções"), ["p7", "p8"])}
      <div class="quick-grid">
        ${infoCard(t("SCORING", "PONTUAÇÃO"), `${newRule()} ${t("At the end of your turn", "No fim do seu turno")}`, [
          rl("1 coin per Region", "occupied by your Race tokens on the map, taken from the stash.", "1 moeda por Região", "ocupada pelos seus marcadores no mapa, tirada do estoque."),
          rl("Bonuses", "from your Race, Special Power, Legendary Places and Artifacts.", "Bônus", "da sua Raça, Poder Especial, Locais Lendários e Artefatos."),
          rl("In Decline Regions", "also give 1 coin each, but their banner, badge and other powers give no bonus unless they say so.", "Regiões Em Declínio", "também rendem 1 moeda cada, mas a bandeira, a insígnia e outros poderes delas não dão bônus, salvo se disserem."),
          rl("Hidden", "keep your coins stacked and hidden; you may ask the stash for change at any time.", "Escondidas", "mantenha as moedas empilhadas e escondidas; pode pedir troco ao estoque a qualquer momento.")
        ], ["p7", "p8"])}
        ${infoCard(t("FACTION BONUS", "BÔNUS DE FACÇÃO"), `${newRule()} ${glyph("faction-alliance", t("Alliance", "Aliança"))} ${glyph("faction-horde", t("Horde", "Horda"))} ${t("Alliance vs Horde", "Aliança contra Horda")}`, [
          t("At the end of your turn, +1 coin for each Race of the opposite Faction you defeated (took a Region from).", "No fim do turno, +1 moeda por Raça da Facção oposta que você derrotou (de quem tomou uma Região)."),
          t("Two or more Regions of the same Race still give only 1 coin (unless the Battleground says otherwise).", "Duas ou mais Regiões da mesma Raça ainda dão só 1 moeda (salvo o Battleground)."),
          t("An Active Race and an In Decline Race are two different Races, even if one player owns both.", "Uma Raça Ativa e uma Em Declínio são duas Raças diferentes, mesmo que sejam do mesmo jogador."),
          rl("Neutral Races", "get no bonus for conquering Alliance or Horde Regions, and Alliance or Horde Races get none for conquering Neutral ones.", "Raças Neutras", "não ganham bônus ao conquistar Regiões da Aliança ou da Horda, e Raças da Aliança ou da Horda não ganham ao conquistar Neutras.")
        ], ["p7"])}
        ${infoCard(t("ALLIANCE", "ALIANÇA"), glyph("faction-alliance", t("Alliance", "Aliança")), list("alliance"), ["p2", "p7"])}
        ${infoCard(t("HORDE", "HORDA"), glyph("faction-horde", t("Horde", "Horda")), list("horde"), ["p2", "p7"])}
        ${infoCard(t("NEUTRAL", "NEUTRAS"), t("No Faction banner on their tokens", "Sem estandarte de Facção nos marcadores"), [...list("neutral"), `${glyph("race-murlocs", "Murlocs")} Murlocs`], ["p2", "p7"])}
      </div>`;
  }

  function laterTurnsSection() {
    return `
      ${sectionHeading("later-turns", t("Subsequent rounds & going In Decline", "Rodadas seguintes e entrar em Declínio"), ["p8", "p9"])}
      <div class="quick-grid">
        ${infoCard(t("EACH LATER TURN", "CADA TURNO SEGUINTE"), t("Pick ONE, then score", "Escolha UM, depois pontue"), [
          rl("Expand", "your Race through new conquests, OR", "Expandir", "a sua Raça com novas conquistas, OU"),
          rl("Decline", "put your Race In Decline to choose a new one next turn.", "Declinar", "pôr a sua Raça Em Declínio para escolher uma nova no próximo turno."),
          t("Either way you then score Victory Coins.", "Em qualquer caso você pontua Moedas de Vitória em seguida.")
        ], ["p8"])}
        ${infoCard(t("EXPAND", "EXPANDIR"), t("Ready your troops, conquer", "Prepare as tropas, conquiste"), [
          rl("Ready your troops", "leave 1 Race token in each Region you occupy; take all your other Active tokens back in hand.", "Prepare as tropas", "deixe 1 marcador em cada Região ocupada; recolha os outros marcadores Ativos para a mão."),
          rl("Conquer", "all the conquest rules apply, except First Conquest (only for a Race new to the map).", "Conquiste", "valem todas as regras de conquista, exceto a Primeira Conquista (só para Raça nova no mapa)."),
          rl("Abandon", "only tokens taken in hand may conquer. To free more, empty whole Regions: they are no longer yours and give no coins.", "Abandonar", "só os marcadores da mão podem conquistar. Para liberar mais, esvazie Regiões inteiras: elas deixam de ser suas e não rendem moedas."),
          t("Abandon all your Regions and your next conquest follows the First Conquest rules.", "Se abandonar todas as Regiões, a próxima conquista segue as regras de Primeira Conquista."),
          t("Then final conquest attempt, redeployment and scoring as usual.", "Depois tentativa final, reposicionamento e pontuação como de costume.")
        ], ["p8"])}
        ${infoCard(t("GO IN DECLINE", "ENTRAR EM DECLÍNIO"), t("Instead of expanding", "Em vez de expandir"), [
          rl("Old Decline Race first", "you may have only 1 Race In Decline: if tokens of an earlier one remain, remove them all to the tray and put its banner at the bottom of the banner stack (or the lowest empty slot of the column).", "Raça antiga primeiro", "você só pode ter 1 Raça Em Declínio: se restam marcadores de uma anterior, devolva todos à bandeja e ponha a bandeira dela embaixo da pilha (ou no espaço vazio mais baixo da coluna)."),
          rl("Flip the banner", "to its grayed-out In Decline side.", "Vire a bandeira", "para o lado cinza Em Declínio."),
          rl("Discard the badge", "its power ends (except powers that say they remain, e.g. Garrisoned Forts, MarshDweller).", "Descarte a insígnia", "o poder acaba (exceto poderes que dizem continuar, ex.: Fortes de Garrisoned, MarshDweller)."),
          rl("Tokens", "flip 1 token to its In Decline side in each Region; return all the others to the tray (Tauren keep 2 per Region).", "Marcadores", "vire 1 marcador para o lado Em Declínio em cada Região; devolva os outros à bandeja (Tauren deixam 2 por Região)."),
          rl("No conquests", "this turn: score (1 coin per In Decline Region, no banner/badge bonuses) and your turn ends.", "Sem conquistas", "neste turno: pontue (1 moeda por Região Em Declínio, sem bônus da bandeira/insígnia) e o turno acaba."),
          rl("Next turn", "pick a new combo and play it like a first turn; you now score both Races.", "Próximo turno", "escolha um novo combo e jogue como no primeiro turno; agora você pontua as duas Raças.")
        ], ["p8", "p9"])}
        ${infoCard(t("IN DECLINE TOKENS", "MARCADORES EM DECLÍNIO"), t("What still matters", "O que ainda conta"), [
          t("They stay on the map, defend (1 token = +1 cost), and score 1 coin per Region for you.", "Ficam no mapa, defendem (1 marcador = +1 de custo) e rendem 1 moeda por Região para você."),
          t("They never move or conquer.", "Nunca se movem nem conquistam."),
          t("Several In Decline tokens can share a Region (Tauren, Intimidating): if it is conquered, all are discarded.", "Vários marcadores Em Declínio podem dividir uma Região (Tauren, Intimidating): se ela for conquistada, todos são descartados."),
          t("When the last In Decline token of a Race is wiped out, its banner goes to the bottom of the stack (or the lowest empty column slot).", "Quando o último marcador Em Declínio de uma Raça é eliminado, a bandeira vai para o fundo da pilha (ou o espaço vazio mais baixo da coluna)."),
          t("Murlocs are always an In Decline Race belonging to no player.", "Os Murlocs são sempre uma Raça Em Declínio que não pertence a nenhum jogador.")
        ], ["p8", "p9"])}
        ${infoCard(t("OUT OF BADGES", "SEM INSÍGNIAS"), t("Rare", "Raro"), [
          t("If the Special Power stack cannot supply new combos, shuffle the discarded badges into a new stack.", "Se a pilha de Poderes Especiais não puder formar novos combos, embaralhe as insígnias descartadas numa nova pilha.")
        ], ["p9"])}
      </div>`;
  }

  function raceCard(race) {
    const faction = race.faction === "neutral" ? "" : glyph(`faction-${race.faction}`, factionName(race.faction));
    return `
      <article class="icon-card">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}race-${race.id}.webp" alt="${t(`${race.name} Race token`, `Marcador da Raça ${race.name}`)}" loading="lazy"></span>
        <div><strong>${race.name}</strong> <span class="sww-count">${faction} ${factionName(race.faction)} · ${t(`banner ${race.value}`, `bandeira ${race.value}`)} · ${t(`${race.tokens} tokens`, `${race.tokens} marcadores`)}</span>${lineList(race.lines.map(tp))}${referenceLink(race.code)}</div>
      </article>`;
  }

  function racesSection() {
    const murlocs = `
      <article class="icon-card">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}race-murlocs.webp" alt="${t("Murloc token", "Marcador de Murloc")}" loading="lazy"></span>
        <div><strong>Murlocs</strong> <span class="sww-count">${t("no banner · 15 tokens", "sem bandeira · 15 marcadores")}</span>${lineList([
          t("Placed at setup on every Region with the Murloc symbol.", "Postos na preparação em cada Região com o símbolo de Murloc."),
          t("Always an In Decline Race belonging to no player; Neutral (no Faction Bonus).", "Sempre uma Raça Em Declínio sem dono; Neutra (sem Bônus de Facção)."),
          t("Each Murloc adds +1 to the conquest cost; a lone Murloc is discarded when its Region is conquered.", "Cada Murloc soma +1 ao custo de conquista; um Murloc sozinho é descartado quando a Região é conquistada.")
        ])}${refs(["p3", "p9"])}</div>
      </article>`;
    return `
      ${sectionHeading("races", t("The 16 Races (and the Murlocs)", "As 16 Raças (e os Murlocs)"), ["p2", "p11", "p12"])}
      <p class="glossary-intro">${t(
        "Each token picture is cut from the component list (p. 2); the Faction emblem in its corner shows Alliance, Horde or none (Neutral). “Banner” is the number on the Race banner, added to the badge's number to get your starting tokens; “tokens” is how many the box holds. Race powers apply only while the Race is Active, unless they say otherwise; they add to the Special Power.",
        "Cada imagem de marcador foi recortada da lista de componentes (p. 2); o emblema de Facção no canto mostra Aliança, Horda ou nenhum (Neutra). “Bandeira” é o número na bandeira da Raça, somado ao número da insígnia para dar os marcadores iniciais; “marcadores” é quantos há na caixa. Os poderes de Raça só valem com a Raça Ativa, salvo indicação; eles se somam ao Poder Especial."
      )} ${refs(["p10"])}</p>
      <div class="icon-grid sww-card-grid">${RACES.map(raceCard).join("")}${murlocs}</div>
      <div class="sww-art-row">
        ${figure("banner-orcs-active", "Orcs Race banner, colored Active side", "Bandeira da Raça Orcs, lado Ativo colorido", "Race banner, Active side (p. 2).", "Bandeira de Raça, lado Ativo (p. 2).")}
        ${figure("banner-orcs-decline", "Orcs Race banner, grayed-out In Decline side", "Bandeira da Raça Orcs, lado cinza Em Declínio", "The same banner In Decline (p. 2).", "A mesma bandeira Em Declínio (p. 2).")}
      </div>`;
  }

  function powersSection() {
    return `
      ${sectionHeading("powers", t("The 20 Special Powers", "Os 20 Poderes Especiais"), ["p12", "p13"])}
      <p class="glossary-intro">${t(
        "Each badge is shown as printed: the number in its circle is added to the Race banner's number. A Special Power applies only to the Race it is paired with — normally not to your earlier In Decline tokens — and it is discarded when that Race goes In Decline, unless the power says it remains.",
        "Cada insígnia aparece como impressa: o número no círculo é somado ao número da bandeira da Raça. Um Poder Especial só vale para a Raça com que forma par — normalmente não para os seus marcadores Em Declínio anteriores — e é descartado quando essa Raça entra em Declínio, salvo se o poder disser que continua."
      )}</p>
      <div class="icon-grid sww-card-grid">${POWERS.map((power) => `
        <article class="icon-card">
          <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}power-${power.id}.webp" alt="${t(`${power.name} Special Power badge`, `Insígnia do Poder Especial ${power.name}`)}" loading="lazy"></span>
          <div><strong>${power.name}</strong> <span class="sww-count">${t(`+${power.value} tokens`, `+${power.value} marcadores`)}</span>${lineList(power.lines.map(tp))}${referenceLink(power.code)}</div>
        </article>`).join("")}</div>`;
  }

  function markerGrid(list, prefix, kindEn, kindPt) {
    return `<div class="icon-grid sww-card-grid">${list.map((item) => `
      <article class="icon-card">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${prefix}-${item.id}.webp" alt="${t(`${item.name} ${kindEn} marker`, `Marcador de ${kindPt} ${item.name}`)}" loading="lazy"></span>
        <div><strong>${item.name}</strong>${lineList(item.lines.map(tp))}${referenceLink("p14")}</div>
      </article>`).join("")}</div>`;
  }

  function artifactsSection() {
    return `
      ${sectionHeading("artifacts", t("Artifacts & Legendary Places", "Artefatos e Locais Lendários"), ["p14"])}
      <div class="quick-grid">
        ${infoCard(t("ALL MARKERS", "TODOS OS MARCADORES"), `${newRule()} ${glyph("marker-facedown", t("Face-down marker", "Marcador virado"))} ${t("5 Artifacts + 7 Legendary Places", "5 Artefatos + 7 Locais Lendários")}`, [
          rl("Reveal", "when a player enters a Region with a face-down marker, flip it; it stays face up for the rest of the game.", "Revelar", "quando um jogador entra numa Região com marcador virado, vire-o; ele fica virado para cima até o fim."),
          rl("Use", "a player occupying its Region may use its effect at once.", "Usar", "quem ocupa a Região pode usar o efeito na hora."),
          rl("Conquered", "the marker changes hands and the new owner may use it immediately.", "Conquistado", "o marcador muda de dono e o novo dono pode usá-lo na hora."),
          rl("In Decline", "Races In Decline get no Artifact or Place effects or bonuses, unless stated.", "Em Declínio", "Raças Em Declínio não recebem efeitos nem bônus de Artefatos e Locais, salvo indicação.")
        ], ["p14"])}
        ${infoCard(t("ARTIFACTS", "ARTEFATOS"), `${glyph("symbol-artifact", t("Artifact icon", "Ícone de Artefato"))} ${t("Bag icon", "Ícone de saco")}`, [
          t("An Artifact stays in the Region where it was last used.", "Um Artefato fica na Região em que foi usado por último."),
          t("If its Region is abandoned, the Artifact stays in that Region.", "Se a Região for abandonada, o Artefato fica nela.")
        ], ["p14"])}
        ${infoCard(t("LEGENDARY PLACES", "LOCAIS LENDÁRIOS"), `${glyph("symbol-place", t("Legendary Place icon", "Ícone de Local Lendário"))} ${t("Temple icon", "Ícone de templo")}`, [
          t("Places never move, except the Well of Eternity, which goes to a Sea or Lake when revealed.", "Os Locais nunca se movem, exceto o Well of Eternity, que vai para um Mar ou Lago ao ser revelado.")
        ], ["p14"])}
      </div>
      <h3 class="subhead">${t("Artifacts", "Artefatos")}</h3>
      ${markerGrid(ARTIFACTS, "artifact", "Artifact", "Artefato")}
      <h3 class="subhead">${t("Legendary Places", "Locais Lendários")}</h3>
      ${markerGrid(PLACES, "place", "Legendary Place", "Local Lendário")}`;
  }

  function iconEntry(file, name, lines, codes) {
    return `
      <article class="icon-card">
        <span class="manual-icon-frame"><img class="manual-icon" src="${ICONS}${file}.webp" alt="${name}" loading="lazy"></span>
        <div><strong>${name}</strong>${lineList(lines)}${refs(codes)}</div>
      </article>`;
  }

  function iconsSection() {
    const terrain = [
      ["terrain-fields", t("Fields", "Campos"), [t("Farmer +1 each; Defensive puts Watch Towers here.", "Farmer +1 cada; Defensive põe Torres de Vigia aqui.")], ["p13"]],
      ["terrain-forest", t("Forest", "Floresta"), [t("Ranger +1 each; Night Elves conquer for 1 less.", "Ranger +1 cada; Night Elves conquistam por 1 a menos.")], ["p12", "p13"]],
      ["terrain-hill", t("Hill", "Colina"), [t("Herbalist +1 each; Beast Master gets 1 Beast each.", "Herbalist +1 cada; Beast Master ganha 1 Fera por cada.")], ["p12", "p13"]],
      ["terrain-mountain", t("Mountain", "Montanha"), [t("Gets a Mountain token at setup (+1 defense). Mountaineer +1 each; Dwarves conquer for 2 less.", "Recebe um marcador de Montanha na preparação (+1 de defesa). Mountaineer +1 cada; Dwarves conquistam por 2 a menos.")], ["p3", "p11", "p13"]],
      ["terrain-swamp", t("Swamp", "Pântano"), [t("Swamp Walker +1 each; MarshDweller charges 1 coin to attack it.", "Swamp Walker +1 cada; MarshDweller cobra 1 moeda para atacá-lo.")], ["p13"]],
      ["terrain-sea-lake", t("Sea / Lake", "Mar / Lago"), [t("Cannot be conquered except by the Naga. Fishing +1 per Region next to one. The Well of Eternity moves here.", "Não pode ser conquistado, exceto pelas Naga. Fishing +1 por Região vizinha. O Well of Eternity vai para cá.")], ["p5", "p12", "p13", "p14"]]
    ];
    const symbols = [
      ["entry-region", t("Entry Region (anchor)", "Região de Entrada (âncora)"), [t("Where a Race first lands on a board; +1 travel cost if not adjacent to your Regions.", "Onde uma Raça chega primeiro a um tabuleiro; +1 de custo de viagem se não for adjacente às suas Regiões.")], ["p5"]],
      ["symbol-magic", t("Magic Region", "Região Mágica"), [t("Blood Elves +1 each; Portal Mage swaps between two of them.", "Blood Elves +1 cada; Portal Mage troca entre duas delas.")], ["p11", "p13"]],
      ["symbol-cavern", t("Cavern Region", "Região de Caverna"), [t("Mining +1 each; Kobolds attack any Cavern as if adjacent.", "Mining +1 cada; Kobolds atacam qualquer Caverna como se fosse adjacente.")], ["p11", "p13"]],
      ["symbol-murloc", t("Murloc symbol", "Símbolo de Murloc"), [t("Gets a Murloc token at setup.", "Recebe um marcador de Murloc na preparação.")], ["p3"]],
      ["board-large", t("Board size: S / M / L", "Tamanho do tabuleiro: S / M / L"), [t("Printed in one Region of each board; that Region gets the face-down Artifact/Place marker.", "Impresso numa Região de cada tabuleiro; essa Região recebe o marcador de Artefato/Local virado.")], ["p3"]],
      ["new-rule", t("New-rule icon", "Ícone de regra nova"), [t("Marks rules that are new or different from the original Small World.", "Marca regras novas ou diferentes do Small World original.")], ["p3"]]
    ];
    const tokens = [
      ["mountain", t("Mountain (10)", "Montanha (10)"), [t("+1 conquest cost; never moves; defends whoever holds the Region.", "+1 de custo de conquista; nunca sai; defende quem tem a Região.")], ["p3", "p5"]],
      ["wisp-wall", t("Wisp Wall (9)", "Muralha de Wisp (9)"), [t("Night Elves: +1 defense; stays In Decline; removed when the Region is conquered or emptied.", "Night Elves: +1 de defesa; continua Em Declínio; removida quando a Região é conquistada ou esvaziada.")], ["p12"]],
      ["fort", t("Fort (10)", "Forte (10)"), [t("Garrisoned: +1 defense; stays In Decline; discarded when the Region is conquered or emptied.", "Garrisoned: +1 de defesa; continua Em Declínio; descartado quando a Região é conquistada ou esvaziada.")], ["p13"]],
      ["watch-tower", t("Watch Tower (6)", "Torre de Vigia (6)"), [t("Defensive: its Region is immune to all powers and conquests.", "Defensive: a Região fica imune a todos os poderes e conquistas.")], ["p13"]],
      ["harmony", t("Harmony token (4)", "Marcador de Harmonia (4)"), [t("Pandaren: its holder pays 2 coins before attacking the Pandaren.", "Pandaren: quem o tem paga 2 moedas antes de atacar os Pandaren.")], ["p12"]],
      ["military-objective", t("Military Objective (2)", "Objetivo Militar (2)"), [t("Humans: 2 bonus coins to a non-Horde conqueror (and to the Humans).", "Humans: 2 moedas bônus a um conquistador que não seja da Horda (e aos Humans).")], ["p11"]],
      ["champion", t("Champion (1)", "Campeão (1)"), [t("Championing: free conquest once per turn; 1 coin ransom if captured.", "Championing: conquista grátis uma vez por turno; resgate de 1 moeda se capturado.")], ["p13"]],
      ["beast", t("Beast (5)", "Fera (5)"), [t("Beast Master: counts as a Race token; 1 per Hill each turn.", "Beast Master: vale como marcador de Raça; 1 por Colina a cada turno.")], ["p12"]],
      ["bomb", t("Bomb (12: 6 exploding, 6 unexploded)", "Bomba (12: 6 explodem, 6 falham)"), [t("Goblins: placed face down, revealed next turn.", "Goblins: posta virada, revelada no turno seguinte.")], ["p2", "p11"]],
      ["die", t("Reinforcement Die", "Dado de Reforço"), [t("Rolled once for a final conquest attempt (and by the Gnomes). Add the number shown to your tokens.", "Rolado uma vez numa tentativa final de conquista (e pelos Gnomes). Some o número mostrado aos seus marcadores.")], ["p6"]],
      ["coin-10", t("Victory Coins: 1, 3, 5, 10", "Moedas de Vitória: 1, 3, 5, 10"), [t("110 in all; your money and your score; kept hidden.", "110 no total; o seu dinheiro e a sua pontuação; ficam escondidas.")], ["p2", "p8"]],
      ["turn-marker", t("Game Turn marker", "Marcador de turno"), [t("Moved 1 spot by the first player at the start of each new round.", "Avançado 1 espaço pelo primeiro jogador no início de cada nova rodada.")], ["p3", "p4"]],
      ["power-back", t("Special Power badge (back)", "Insígnia de Poder Especial (verso)"), [t("Badges are stacked to the left of the banner stack.", "As insígnias ficam empilhadas à esquerda da pilha de bandeiras.")], ["p2", "p3"]],
      ["bonus-plus-one", t("+1 coin", "+1 moeda"), [t("Printed on badges and in the rules next to a bonus: +1 Victory Coin.", "Impresso nas insígnias e nas regras ao lado de um bônus: +1 Moeda de Vitória.")], ["p11", "p12"]],
      ["cost-minus-one", t("−1 / −2 token", "−1 / −2 marcador"), [t("Printed next to a power that lowers the conquest cost (minimum 1 token).", "Impresso ao lado de um poder que reduz o custo de conquista (mínimo 1 marcador).")], ["p11", "p12"]]
    ];
    const grid = (list) => `<div class="icon-grid sww-card-grid">${list.map(([file, name, lines, codes]) => iconEntry(file, name, lines, codes)).join("")}</div>`;
    return `
      ${sectionHeading("icons", t("Terrain, symbols & tokens", "Terrenos, símbolos e marcadores"), ["p2", "p3", "p5"])}
      <p class="glossary-intro">${t(
        "The rulebook has no terrain legend: each terrain type is recognised by its artwork on the boards. The terrain pictures below are the ones printed on the Special Power badges and rule margins. A Region is non-empty only if it holds at least 1 Murloc or Race token (Active or In Decline); a Mountain, Artifact or Place alone leaves it empty.",
        "O livro não tem legenda de terrenos: cada tipo de terreno é reconhecido pela arte nos tabuleiros. As imagens de terreno abaixo são as impressas nas insígnias de Poder Especial e nas margens das regras. Uma Região só é não vazia se tiver pelo menos 1 Murloc ou marcador de Raça (Ativa ou Em Declínio); uma Montanha, Artefato ou Local sozinho a deixa vazia."
      )} ${refs(["p10"])}</p>
      <h3 class="subhead">${t("Terrain types", "Tipos de terreno")}</h3>
      ${grid(terrain)}
      <h3 class="subhead">${t("Map symbols", "Símbolos do mapa")}</h3>
      ${grid(symbols)}
      <h3 class="subhead">${t("Tokens & pieces", "Marcadores e peças")}</h3>
      ${grid(tokens)}`;
  }

  function examplesSection() {
    return `
      ${sectionHeading("examples", t("Illustrated examples", "Exemplos ilustrados"), ["p5", "p6", "p7", "p8", "p9"])}
      <p class="glossary-intro">${t("The rulebook follows one player through a game: a Herbalist Forsaken start, then Archaeologist Blood Elves after a Decline.", "O livro acompanha um jogador durante uma partida: começa com Herbalist Forsaken e depois, após um Declínio, segue com Archaeologist Blood Elves.")}</p>
      <div class="sww-art-row">
        ${figure("entry-example", "An Entry Region with a Murloc, and four Forsaken tokens beside it", "Uma Região de Entrada com um Murloc e quatro marcadores Forsaken ao lado", "1 · First conquest: entering the board through a Murloc-occupied Fields Entry Region costs 4 tokens (2 + 1 Murloc + 1 travel) (p. 5).", "1 · Primeira conquista: entrar no tabuleiro por uma Região de Entrada de Campos com Murloc custa 4 marcadores (2 + 1 Murloc + 1 viagem) (p. 5).")}
        ${figure("conquest", "Forsaken tokens moving from the fields into a Kobold-held hill", "Marcadores Forsaken saindo dos campos para uma colina dos Kobolds", "2 · After the fields, the Forsaken attack the Kobolds' neighbouring hill (p. 6).", "2 · Depois dos campos, os Forsaken atacam a colina vizinha dos Kobolds (p. 6).")}
        ${figure("die-roll", "A lone Forsaken token on a Mountain with the Reinforcement Die showing +1", "Um marcador Forsaken numa Montanha com o Dado de Reforço mostrando +1", "3 · Short of tokens, a lucky Reinforcement Die roll lets them take the Mountains as the final conquest (p. 6).", "3 · Sem marcadores suficientes, uma rolagem de sorte do Dado de Reforço deixa-os tomar as Montanhas como conquista final (p. 6).")}
        ${figure("redeploy", "Forsaken tokens being redeployed, with one extra token bought", "Marcadores Forsaken sendo reposicionados, com um marcador extra comprado", "4 · Redeployment: they forced 2 losses (1 Murloc, 1 Kobold), so they could buy up to 2 extra Forsaken at 1 coin each; they buy 1 (p. 6).", "4 · Reposicionamento: forçaram 2 perdas (1 Murloc, 1 Kobold), então podiam comprar até 2 Forsaken extras a 1 moeda cada; compram 1 (p. 6).")}
        ${figure("scoring", "Three Forsaken Regions each giving 1 coin, plus 1 for the Hill", "Três Regiões Forsaken rendendo 1 moeda cada, mais 1 pela Colina", "5 · Scoring: 3 Regions = 3 coins, +1 for the Herbalist power (1 Hill) (p. 7).", "5 · Pontuação: 3 Regiões = 3 moedas, +1 pelo poder Herbalist (1 Colina) (p. 7).")}
        ${figure("faction-bonus", "Blood Elves conquering a Dwarf Entry Region and two Human Regions", "Blood Elves conquistando uma Região de Entrada dos Dwarves e duas Regiões dos Humans", "6 · Later, Archaeologist Blood Elves (Horde) take a Dwarf Entry Region and 2 Human Regions: Faction Bonus 2 (1 Dwarves + 1 Humans), not 3 (p. 7).", "6 · Depois, Archaeologist Blood Elves (Horda) tomam uma Região de Entrada dos Dwarves e 2 dos Humans: Bônus de Facção 2 (1 Dwarves + 1 Humans), não 3 (p. 7).")}
        ${figure("decline-scoring", "Map with Active Blood Elves and In Decline Forsaken each earning coins", "Mapa com Blood Elves Ativos e Forsaken Em Declínio rendendo moedas", "7 · Two Races scoring: Blood Elves get +1 for their Magic Region; the In Decline Forsaken give 1 coin per Region but no Herbalist bonus (p. 8).", "7 · Duas Raças pontuando: os Blood Elves ganham +1 pela Região Mágica; os Forsaken Em Declínio dão 1 moeda por Região, mas sem bônus de Herbalist (p. 8).", "sww-art-wide")}
        ${figure("decline-wipe", "Forsaken tokens crossed out as they are removed from the map", "Marcadores Forsaken riscados sendo removidos do mapa", "8 · Putting the Blood Elves In Decline: the old In Decline Forsaken are wiped off and their banner goes to the bottom of the pile (p. 9).", "8 · Pondo os Blood Elves em Declínio: os Forsaken que estavam Em Declínio são removidos e a bandeira vai para o fundo da pilha (p. 9).")}
        ${figure("decline-new", "Blood Elves reduced to one flipped token per Region; banner flipped", "Blood Elves reduzidos a um marcador virado por Região; bandeira virada", "9 · Then the Blood Elves keep 1 In Decline token per Region, flip their banner and discard the Archaeologist badge (p. 9).", "9 · Depois os Blood Elves ficam com 1 marcador Em Declínio por Região, viram a bandeira e descartam a insígnia Archaeologist (p. 9).")}
      </div>`;
  }

  function faqSection() {
    const items = [
      [t("What is on the Reinforcement Die?", "O que tem no Dado de Reforço?"), t("The rulebook does not list the faces of the custom die. Roll it and add the number shown to your remaining tokens; a blank face adds nothing.", "O livro não lista as faces do dado personalizado. Role-o e some o número mostrado aos marcadores restantes; uma face em branco não soma nada."), "p6"],
      [t("The unused Artifact/Place markers", "Os marcadores de Artefato/Local não usados"), t("Setup only places one marker per player. The Well of Eternity tells you to “draw another Legendary Place token” when it cannot reach a Sea or Lake, so the guide keeps the unused markers face down beside the boards and draws from them (redraw until a Legendary Place comes up, keeping the others hidden).", "A preparação só põe um marcador por jogador. O Well of Eternity manda “comprar outro Local Lendário” quando não chega a um Mar ou Lago, então o guia deixa os marcadores não usados virados ao lado dos tabuleiros e compra deles (até sair um Local Lendário, mantendo os outros escondidos)."), "p14"],
      [t("When exactly do I go In Decline?", "Quando exatamente entro em Declínio?"), t("Declining takes your whole turn: flip, remove tokens, score, end. You pick the new combo on your next turn (pp. 8–9).", "Declinar ocupa o turno inteiro: virar, remover marcadores, pontuar, fim. O novo combo é escolhido no turno seguinte (pp. 8–9)."), "p9"],
      [t("Does the Champion need Race tokens with it?", "O Campeão precisa de marcadores de Raça junto?"), t("The badge says the conquest is free and the Champion is placed in the Region, counting as 1 token for defense. The guide lets the Champion hold the Region alone; the p. 5 note still applies: you need at least 1 unused Race token to start any conquest.", "A insígnia diz que a conquista é grátis e o Campeão é posto na Região, valendo 1 marcador na defesa. O guia deixa o Campeão segurar a Região sozinho; a nota da p. 5 continua valendo: você precisa de pelo menos 1 marcador livre para iniciar qualquer conquista."), "p13"],
      [t("Ethereals: where does a stolen Artifact go?", "Ethereals: para onde vai o Artefato roubado?"), t("“Moving this Artifact token into this adjacent Region”: the guide reads it as moving the Artifact from the neighbouring Region into your own Region next to it.", "“Movendo o Artefato para esta Região adjacente”: o guia entende que o Artefato sai da Região vizinha e vai para a sua Região ao lado dela."), "p11"],
      [t("Doomhammer: which Regions?", "Doomhammer: quais Regiões?"), t("The text says “any 1 region”, unlike Frostmourne, so the guide reads it as any Region on any board, still for 1 token after paying the 2 coins.", "O texto diz “qualquer 1 região”, ao contrário de Frostmourne, então o guia entende qualquer Região de qualquer tabuleiro, ainda por 1 marcador depois de pagar as 2 moedas."), "p14"],
      [t("Do Murloc losses count for the Forsaken?", "Perdas de Murlocs contam para os Forsaken?"), t("Yes: the rulebook's own example (p. 6) counts a Murloc and a Kobold as 2 forced losses.", "Sim: o próprio exemplo do livro (p. 6) conta um Murloc e um Kobold como 2 perdas forçadas."), "p6"],
      [t("Murlocs and the Faction Bonus", "Murlocs e o Bônus de Facção"), t("Murloc tokens carry no Alliance or Horde emblem, so conquering them never gives a Faction Bonus.", "Os marcadores de Murloc não têm emblema da Aliança nem da Horda, então conquistá-los nunca dá Bônus de Facção."), "p7"],
      [t("Ranger: “Victory Point”?", "Ranger: “Ponto de Vitória”?"), t("The Ranger text says “1 bonus Victory Point”; the game has only Victory Coins, so take 1 coin.", "O texto do Ranger diz “1 Ponto de Vitória bônus”; o jogo só tem Moedas de Vitória, então pegue 1 moeda."), "p13"],
      [t("How do I know a Region's terrain?", "Como sei o terreno de uma Região?"), t("The rulebook has no terrain legend. Recognise Fields, Forests, Hills, Mountains, Swamps, Seas and Lakes by their artwork (compare with the pictures in “Terrain, symbols & tokens”); Magic, Cavern, Murloc and Entry Regions carry a printed symbol.", "O livro não tem legenda de terrenos. Reconheça Campos, Florestas, Colinas, Montanhas, Pântanos, Mares e Lagos pela arte (compare com as imagens em “Terrenos, símbolos e marcadores”); Regiões Mágicas, de Caverna, de Murloc e de Entrada têm um símbolo impresso."), "p10"],
      [t("Team play?", "Jogo em equipes?"), t("The box lists a Team Variant Rules sheet, but it was not supplied, so this guide does not cover it.", "A caixa lista uma folha de variante em equipes, mas ela não foi fornecida, então este guia não a cobre."), "p2"],
      state.language === "en-US" ? null : [t("Names in Portuguese", "Nomes em português"), t("Race, Special Power, Artifact and Place names are kept as printed (English) so you can match them to the components; the rules text is translated.", "Os nomes de Raças, Poderes Especiais, Artefatos e Locais ficam como impressos (em inglês) para você casar com os componentes; o texto das regras está traduzido."), "p11"]
    ].filter(Boolean);
    return `
      ${sectionHeading("faq", t("Guide's readings", "Leituras do guia"), ["p6", "p13", "p14"])}
      <p class="glossary-intro">${t("Where the rulebook is silent or ambiguous, this guide states its own reading, labelled as such.", "Onde o livro é omisso ou ambíguo, este guia dá a sua própria leitura, identificada como tal.")}</p>
      <div class="quick-grid">${items.map(([q, a, code]) => `
        <article class="info-card">
          <span class="component-label">${t("GUIDE'S READING", "LEITURA DO GUIA")}</span>
          <h3>${q}</h3>
          <p>${a}</p>
          ${referenceLink(code)}
        </article>`).join("")}</div>`;
  }

  function glossarySection() {
    const visible = [
      { term: ["Region", "Região"], text: ["A space on a board. You score 1 coin per Region you occupy.", "Um espaço num tabuleiro. Você pontua 1 moeda por Região ocupada."], code: "p5" },
      { term: ["Island (board)", "Ilha (tabuleiro)"], text: ["Each board is a separate Island, reached through its Entry Regions.", "Cada tabuleiro é uma Ilha separada, alcançada pelas Regiões de Entrada."], code: "p3" },
      { term: ["Entry Region", "Região de Entrada"], text: ["A Region with an anchor icon: where a Race first lands on a board.", "Região com ícone de âncora: onde uma Raça chega primeiro a um tabuleiro."], code: "p5" },
      { term: ["Travel cost", "Custo de viagem"], text: ["+1 token to conquer an Entry Region not adjacent to your Regions.", "+1 marcador para conquistar uma Região de Entrada não adjacente às suas Regiões."], code: "p5" },
      { term: ["Adjacent", "Adjacente"], text: ["Sharing a border with another Region.", "Que tem fronteira com outra Região."], code: "p6" },
      { term: ["Combo", "Combo"], text: ["A Race banner paired with a Special Power badge.", "Uma bandeira de Raça unida a uma insígnia de Poder Especial."], code: "p4" },
      { term: ["Active", "Ativa"], text: ["Your current Race: colored banner, colored tokens, powers working.", "A sua Raça atual: bandeira colorida, marcadores coloridos, poderes valendo."], code: "p10" },
      { term: ["In Decline", "Em Declínio"], text: ["A former Race: grayed-out banner, flipped tokens, still scoring 1 per Region; no powers unless stated.", "Uma Raça antiga: bandeira cinza, marcadores virados, ainda pontua 1 por Região; sem poderes salvo indicação."], code: "p8" },
      { term: ["Non-empty Region", "Região não vazia"], text: ["Holds at least 1 Murloc or Race token (Active or In Decline).", "Tem pelo menos 1 Murloc ou marcador de Raça (Ativa ou Em Declínio)."], code: "p10" },
      { term: ["Victory stash", "Estoque de Vitória"], text: ["The shared pile of coins you are paid from.", "A pilha comum de moedas da qual você recebe."], code: "p3" },
      { term: ["Faction", "Facção"], text: ["Alliance or Horde; the other Races are Neutral.", "Aliança ou Horda; as demais Raças são Neutras."], code: "p7" },
      { term: ["Faction Bonus", "Bônus de Facção"], text: ["+1 coin per opposite-Faction Race you took a Region from this turn.", "+1 moeda por Raça da Facção oposta da qual você tomou Região neste turno."], code: "p7" },
      { term: ["Ready your troops", "Prepare as tropas"], text: ["Taking back all but 1 token per Region at the start of an expanding turn.", "Recolher todos os marcadores menos 1 por Região no início de um turno de expansão."], code: "p8" },
      { term: ["Abandon", "Abandonar"], text: ["Emptying a Region completely; it is no longer yours.", "Esvaziar uma Região por completo; ela deixa de ser sua."], code: "p8" },
      { term: ["Troop Redeployment", "Reposicionamento"], text: ["Moving your tokens freely between your Regions at the end of your conquests.", "Mover os marcadores livremente entre as suas Regiões no fim das conquistas."], code: "p6" },
      { term: ["Final conquest attempt", "Tentativa final de conquista"], text: ["One last conquest helped by a Reinforcement Die roll.", "Uma última conquista ajudada por uma rolagem do Dado de Reforço."], code: "p6" },
      { term: ["Murlocs", "Murlocs"], text: ["A primitive, neutral In Decline Race placed at setup; belongs to no player.", "Uma Raça primitiva, neutra e Em Declínio posta na preparação; não pertence a ninguém."], code: "p3" },
      { term: ["Artifact", "Artefato"], text: ["A movable marker with a power (bag icon).", "Um marcador móvel com poder (ícone de saco)."], code: "p14" },
      { term: ["Legendary Place", "Local Lendário"], text: ["A fixed marker with a power (temple icon).", "Um marcador fixo com poder (ícone de templo)."], code: "p14" },
      { term: ["Magic Region", "Região Mágica"], text: ["A Region with the blue rune symbol.", "Uma Região com o símbolo da runa azul."], code: "p11" },
      { term: ["Cavern Region", "Região de Caverna"], text: ["A Region with the black cave symbol.", "Uma Região com o símbolo da caverna preta."], code: "p11" }
    ];
    const lang = state.language === "pt-BR" ? 1 : 0;
    visible.sort((a, b) => a.term[lang].localeCompare(b.term[lang], state.language));
    return `
      ${sectionHeading("glossary", t("Glossary", "Glossário"), ["p5", "p10"])}
      <div class="quick-grid glossary-grid">${visible.map((item) => `
        <article class="info-card glossary-card">
          <span class="component-label">${t("TERM", "TERMO")}</span>
          <h3>${t(item.term[0], item.term[1])}</h3>
          <p>${t(item.text[0], item.text[1])}</p>
          ${referenceLink(item.code)}
        </article>`).join("")}</div>`;
  }

  // ---------- render ----------

  function renderInto(host) {
    root = host;
    document.body.classList.add("theme-small-world-of-warcraft");
    document.documentElement.lang = state.language;
    document.title = t("Small World of Warcraft — Field Manual", "Small World of Warcraft — Manual de Campo");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Bilingual interactive rules for Small World of Warcraft (2–5 players): setup by player count, conquest costs, Decline, the Faction Bonus, all 16 Races, 20 Special Powers, 5 Artifacts and 7 Legendary Places.",
        "Regras interativas bilíngues de Small World of Warcraft (2–5 jogadores): preparação por número de jogadores, custos de conquista, Declínio, Bônus de Facção, as 16 Raças, 20 Poderes Especiais, 5 Artefatos e 7 Locais Lendários."
      );
    }
    host.innerHTML = `
      ${renderHeader()}
      <section class="game-hero"><div class="game-hero-inner">
        <div>
          <p class="eyebrow">${t("Interactive rulebook", "Livro interativo")}</p>
          <h1>Small World of Warcraft</h1>
          <p class="hero-intro">${t(
            "Azeroth is too small for everyone. Pick a Race and a Special Power, conquer Regions island by island, earn Victory Coins for every Region you hold — and know when to let your over-extended empire fall into Decline and ride a new Race to victory.",
            "Azeroth é pequena demais para todos. Escolha uma Raça e um Poder Especial, conquiste Regiões ilha por ilha, ganhe Moedas de Vitória por Região ocupada — e saiba quando deixar o seu império esticado demais entrar em Declínio para levar uma nova Raça à vitória."
          )}</p>
          <div class="hero-meta"><span>${t("2–5 players", "2–5 jogadores")}</span><span>40–80 min</span><span>${t("Area control", "Controle de área")}</span><span>${t(`${ROUNDS[state.players]} rounds`, `${ROUNDS[state.players]} rodadas`)}</span></div>
        </div>
        <figure class="hero-map"><img src="assets/covers/small-world-of-warcraft.webp" alt="${t("Cover of the Small World of Warcraft rulebook", "Capa do livro de regras de Small World of Warcraft")}" fetchpriority="high"><figcaption>${t("Rulebook cover", "Capa do livro de regras")}</figcaption></figure>
      </div></section>
      <main class="game-body">
        <aside class="toc" aria-label="${t("Rulebook sections", "Seções do livro")}">
          <h2>${t("Field guide", "Guia de campo")}</h2>
          ${sectionNav()}
        </aside>
        <div class="content-column sww-page">
          ${storageIssues.size ? `<p class="storage-notice" data-storage-notice role="status">${storageNoticeText()}</p>` : ""}
          ${matchConfiguration()}
          <div class="callout">${t(
            "This guide covers the supplied Small World of Warcraft rulebook: setup, the full turn, Decline, scoring and the Faction Bonus, all 16 Races, 20 Special Powers, 5 Artifacts and 7 Legendary Places. Not supplied: the Team Variant Rules sheet and the Player Summary sheets. Points marked “Guide's reading” are interpretations where the rulebook is silent.",
            "Este guia cobre o livro de regras de Small World of Warcraft fornecido: preparação, o turno completo, Declínio, pontuação e Bônus de Facção, as 16 Raças, 20 Poderes Especiais, 5 Artefatos e 7 Locais Lendários. Não fornecidos: a folha da variante em equipes e as folhas de resumo dos jogadores. Trechos marcados como “Leitura do guia” são interpretações onde o livro é omisso."
          )}</div>
          <section class="rule-section">${quickReference()}</section>
          <section class="rule-section">${setupSection()}</section>
          <section class="rule-section">${overviewSection()}</section>
          <section class="rule-section">${firstTurnSection()}</section>
          <section class="rule-section">${conquestSection()}</section>
          <section class="rule-section">${scoringSection()}</section>
          <section class="rule-section">${laterTurnsSection()}</section>
          <section class="rule-section">${racesSection()}</section>
          <section class="rule-section">${powersSection()}</section>
          <section class="rule-section">${artifactsSection()}</section>
          <section class="rule-section">${iconsSection()}</section>
          <section class="rule-section">${examplesSection()}</section>
          <section class="rule-section">${faqSection()}</section>
          <section class="rule-section">${glossarySection()}</section>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal, non-commercial companion guide based on the Small World of Warcraft rulebook (Days of Wonder), game design by Philippe Keyaerts, illustrations by Miguel Coimbra. World of Warcraft is a trademark of Blizzard Entertainment. Rules are paraphrased; pictures are cut from the supplied rulebook for reference.",
        "Guia pessoal e não comercial de consulta baseado no livro de regras de Small World of Warcraft (Days of Wonder), design de Philippe Keyaerts, ilustrações de Miguel Coimbra. World of Warcraft é marca da Blizzard Entertainment. As regras são parafraseadas; as imagens foram recortadas do livro fornecido para referência."
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
      root.querySelector(".sww-page")?.prepend(notice);
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
    if (target.hasAttribute("data-players")) {
      const value = Number(target.getAttribute("data-players"));
      if (PLAYER_COUNTS.includes(value) && value !== state.players) {
        applyMatchChange({ players: value });
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

  window.SmallWorldOfWarcraft = { renderInto, onClick, onChange };
})();
