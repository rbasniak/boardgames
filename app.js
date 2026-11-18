(() => {
  "use strict";

  const TABLE_SHARE_URL = "https://rbasniak.github.io/boardgames";
  const app = document.getElementById("app");

  function t(en, pt) {
    if (window.SniperElite) {
      return window.SniperElite.translate(en, pt);
    }
    return document.documentElement.lang === "en-US" ? en : pt;
  }

  const META_ICON_PLAYERS = `<svg class="game-meta-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`;
  const META_ICON_CLOCK = `<svg class="game-meta-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>`;

  function sortIndexCatalog(catalog) {
    const live = [];
    const planned = [];
    for (const game of catalog) {
      if (game.rulebook === "planned") {
        planned.push(game);
      } else {
        live.push(game);
      }
    }
    const byTitle = (a, b) => {
      return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    };
    live.sort(byTitle);
    planned.sort(byTitle);
    return live.concat(planned);
  }

  function renderGameBoxArt(game) {
    const boxFile = game.boxFile || `${game.slug}.webp`;
    const path = `assets/boxes/${boxFile}`;
    const planned = game.rulebook === "planned";
    const frameClass = planned ? "game-box-frame game-box-frame--planned" : "game-box-frame";
    const overlay = planned ? '<span class="game-box-overlay" aria-hidden="true"></span>' : "";
    const missingEn = `Add a box photo to <code>${path}</code>.`;
    const missingPt = `Adicione a foto da caixa em <code>${path}</code>.`;
    return `
            <div class="${frameClass}">
              <img class="game-box-photo" src="${path}" alt="${t(game.boxAltEn, game.boxAltPt)}" decoding="async" onerror="this.style.display='none';var missing=this.parentElement.querySelector('.game-box-missing');if(missing){missing.hidden=false;}console.warn('Missing box photo: ${path}');">
              ${overlay}
              <p class="game-box-missing" hidden>${t(missingEn, missingPt)}</p>
            </div>`;
  }

  function renderGameMeta(game) {
    const { players, minutes, bgg } = game;
    const playerCount =
      players.min === players.max ? String(players.min) : `${players.min}–${players.max}`;
    const durationMin =
      minutes.min === minutes.max ? `${minutes.min}` : `${minutes.min}–${minutes.max}`;
    const complexityLevel = Math.min(5, Math.max(1, Math.round(bgg.weight)));
    const complexityDots = Array.from({ length: 5 }, (_, index) => {
      const filled = index < complexityLevel;
      return `<span class="complexity-dot${filled ? " is-filled" : ""}"></span>`;
    }).join("");
    const bggUrl = `https://boardgamegeek.com/boardgame/${bgg.id}`;
    const playersAria = t(
      `Players: ${playerCount}`,
      `Jogadores: ${playerCount}`
    );
    const timeAria = t(
      `Playing time: ${durationMin} minutes`,
      `Tempo de jogo: ${durationMin} min`
    );
    const complexityAria = t(
      `Complexity ${complexityLevel} out of 5 (BGG weight ${bgg.weight.toFixed(2)})`,
      `Complexidade ${complexityLevel} de 5 (peso BGG ${bgg.weight.toFixed(2)})`
    );
    return `
            <div class="game-card-meta" aria-label="${t("BoardGameGeek stats", "Dados do BoardGameGeek")}">
              <div class="game-meta-row game-meta-players" title="${playersAria}">
                ${META_ICON_PLAYERS}
                <span class="game-meta-value">${playerCount}</span>
              </div>
              <div class="game-meta-row game-meta-time" title="${timeAria}">
                ${META_ICON_CLOCK}
                <span class="game-meta-value">${durationMin} ${t("min", "min")}</span>
              </div>
              <a class="game-meta-bgg" href="${bggUrl}" target="_blank" rel="noopener noreferrer" title="${t("View on BoardGameGeek", "Ver no BoardGameGeek")}">
                <span class="game-meta-bgg-label">BGG</span>
                <span class="game-meta-bgg-rating">${bgg.rating.toFixed(1)}</span>
              </a>
              <div class="game-meta-complexity" title="${complexityAria}" aria-label="${complexityAria}">
                <span class="game-meta-complexity-label">${t("Weight", "Peso")}</span>
                <span class="complexity-scale" aria-hidden="true">${complexityDots}</span>
              </div>
            </div>`;
  }

  function renderIndexGameCard(game) {
    const isPlanned = game.rulebook === "planned";
    const cardClass = isPlanned ? "game-card planned" : "game-card available";
    const kicker = isPlanned
      ? t("Interactive rulebook · coming soon", "Livro interativo · em breve")
      : t("Interactive rulebook · available", "Livro interativo · disponível");
    const openLabel = isPlanned
      ? t("Coming soon", "Em breve")
      : t("Open index", "Abrir índice");
    const action = isPlanned
      ? `<button type="button" class="button-primary" disabled aria-disabled="true">${openLabel}</button>`
      : `<a class="button-primary" href="#/${game.route}">${openLabel} <span aria-hidden="true">→</span></a>`;
    return `
          <article class="${cardClass}">
            ${renderGameBoxArt(game)}
            <div class="game-card-body">
              <span class="card-kicker">${kicker}</span>
              <h3>${game.title}</h3>
              ${renderGameMeta(game)}
              <p>${t(game.summaryEn, game.summaryPt)}</p>
              ${action}
            </div>
          </article>`;
  }

  function currentRoute() {
    const hash = window.location.hash;
    if (hash.startsWith("#/sniper-elite")) {
      return "sniper-elite";
    }
    if (hash.startsWith("#/not-enough-mana")) {
      return "not-enough-mana";
    }
    if (hash.startsWith("#/avalon-the-riven-veil")) {
      return "avalon-the-riven-veil";
    }
    if (hash.startsWith("#/pagan")) {
      return "pagan";
    }
    if (hash.startsWith("#/odins-ravens")) {
      return "odins-ravens";
    }
    if (hash.startsWith("#/western-legends")) {
      return "western-legends";
    }
    if (hash.startsWith("#/lotr-fate-of-the-fellowship")) {
      return "lotr-fate-of-the-fellowship";
    }
    if (hash.startsWith("#/witcher-path-of-destiny")) {
      return "witcher-path-of-destiny";
    }
    if (hash.startsWith("#/cangaceiros")) {
      return "cangaceiros";
    }
    if (hash.startsWith("#/lotr-duel-for-middle-earth")) {
      return "lotr-duel-for-middle-earth";
    }
    if (hash.startsWith("#/coup")) {
      return "coup";
    }
    if (hash.startsWith("#/munchkin")) {
      return "munchkin";
    }
    if (hash.startsWith("#/pandemic")) {
      return "pandemic";
    }
    if (hash.startsWith("#/kelp")) {
      return "kelp";
    }
    if (hash.startsWith("#/mind-mgmt")) {
      return "mind-mgmt";
    }
    if (hash.startsWith("#/galileo-galilei")) {
      return "galileo-galilei";
    }
    if (hash.startsWith("#/heat")) {
      return "heat";
    }
    if (hash.startsWith("#/bristol-1350")) {
      return "bristol-1350";
    }
    if (hash.startsWith("#/love-letter")) {
      return "love-letter";
    }
    if (hash.startsWith("#/sky-team")) {
      return "sky-team";
    }
    if (hash.startsWith("#/deadwood-1876")) {
      return "deadwood-1876";
    }
    if (hash.startsWith("#/bang")) {
      return "bang";
    }
    if (hash.startsWith("#/7-wonders")) {
      return "7-wonders";
    }
    if (hash.startsWith("#/art-society")) {
      return "art-society";
    }
    // Exact match so "#/azul" never captures a longer route such as "#/azul-queens-garden".
    if (/^#\/azul(?:$|[/?])/.test(hash)) {
      return "azul";
    }
    if (hash.startsWith("#/azul-queens-garden")) {
      return "azul-queens-garden";
    }
    if (hash.startsWith("#/betrayal-at-house-on-the-hill")) {
      return "betrayal-at-house-on-the-hill";
    }
    if (hash.startsWith("#/carcassonne")) {
      return "carcassonne";
    }
    // Exact match so "#/cascadia" never captures a longer route.
    if (/^#\/cascadia(?:$|[/?])/.test(hash)) {
      return "cascadia";
    }
    // Exact match so "#/dixit" never captures a longer route.
    if (/^#\/dixit(?:$|[/?])/.test(hash)) {
      return "dixit";
    }
    // Exact match so "#/fit-to-print" never captures a longer route.
    if (/^#\/fit-to-print(?:$|[/?])/.test(hash)) {
      return "fit-to-print";
    }
    // Exact match so "#/harry-potter-defense-against-the-dark-arts" never captures a longer route.
    if (/^#\/harry-potter-defense-against-the-dark-arts(?:$|[/?])/.test(hash)) {
      return "harry-potter-defense-against-the-dark-arts";
    }
    // Exact match so "#/mysterium" never captures a longer route.
    if (/^#\/mysterium(?:$|[/?])/.test(hash)) {
      return "mysterium";
    }
    // Exact match so "#/parks" never captures a longer route.
    if (/^#\/parks(?:$|[/?])/.test(hash)) {
      return "parks";
    }
    // Exact match so "#/patchwork" never captures a longer route.
    if (/^#\/patchwork(?:$|[/?])/.test(hash)) {
      return "patchwork";
    }
    // Exact match so "#/point-galaxy" never captures a longer route.
    if (/^#\/point-galaxy(?:$|[/?])/.test(hash)) {
      return "point-galaxy";
    }
    // Exact match so "#/secret-hitler" never captures a longer route.
    if (/^#\/secret-hitler(?:$|[/?])/.test(hash)) {
      return "secret-hitler";
    }
    // Exact match so "#/marvel-dice-throne" never captures a longer route.
    if (/^#\/marvel-dice-throne(?:$|[/?])/.test(hash)) {
      return "marvel-dice-throne";
    }
    // Exact match so "#/salem-1692" never captures a longer route.
    if (/^#\/salem-1692(?:$|[/?])/.test(hash)) {
      return "salem-1692";
    }
    // Exact match so "#/rebel-princess" never captures a longer route.
    if (/^#\/rebel-princess(?:$|[/?])/.test(hash)) {
      return "rebel-princess";
    }
    // Exact match so "#/knitting-circle" never captures a longer route.
    if (/^#\/knitting-circle(?:$|[/?])/.test(hash)) {
      return "knitting-circle";
    }
    return "index";
  }

  function renderHeader(route) {
    const language = window.SniperElite ? window.SniperElite.language() : "pt-BR";
    return `
      <header class="site-header">
        <a class="brand" href="#/" aria-label="${t("Field Manual home", "Página inicial do Manual de Campo")}">
          <span class="brand-mark" aria-hidden="true">SE</span>
          <span class="brand-copy"><strong>Field Manual</strong><small>${t("Board-game rulebooks", "Livros de regras")}</small></span>
        </a>
        <div class="header-right">
          <nav class="primary-nav" aria-label="${t("Main navigation", "Navegação principal")}">
            <a href="#/" ${route === "index" ? 'aria-current="page"' : ""}>${t("Game index", "Jogos")}</a>
          </nav>
          <div class="language-switch" role="group" aria-label="${t("Language", "Idioma")}">
            <button type="button" data-language="en-US" aria-pressed="${language === "en-US"}">EN-US</button>
            <button type="button" data-language="pt-BR" aria-pressed="${language === "pt-BR"}">PT-BR</button>
          </div>
        </div>
      </header>`;
  }

  function renderLanding() {
    document.body.classList.remove("theme-nem", "theme-avalon", "theme-pagan", "theme-odins-ravens", "theme-western-legends", "theme-lotr", "theme-witcher", "theme-cangaceiros", "theme-lotr-duel", "theme-coup", "theme-munchkin", "theme-pandemic", "theme-kelp", "theme-mind-mgmt", "theme-galileo", "theme-heat", "theme-bristol", "theme-love-letter", "theme-sky-team", "theme-deadwood", "theme-bang", "theme-seven-wonders", "theme-art-society", "theme-azul", "theme-azul-queens-garden", "theme-betrayal", "theme-carcassonne", "theme-cascadia", "theme-dixit", "theme-fit-to-print", "theme-hp-dada", "theme-knitting-circle", "theme-mysterium", "theme-parks", "theme-patchwork", "theme-point-galaxy", "theme-rebel-princess", "theme-salem", "theme-mdt", "theme-sh");
    document.documentElement.lang = window.SniperElite ? window.SniperElite.language() : "pt-BR";
    document.title = t("Field Manual — Boardgame Rulebooks", "Manual de Campo — Livros de Regras");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Interactive board-game rulebooks for dozens of titles — available guides with match setup and manual references; more games coming soon.",
        "Livros de regras interativos para dezenas de jogos — guias disponíveis com configuração de partida e referência aos manuais; mais títulos em breve."
      );
    }
    app.innerHTML = `
      ${renderHeader("index")}
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
        <section class="share-panel" aria-labelledby="share-panel-title">
          <div class="share-panel-copy">
            <p class="eyebrow">${t("AT THE TABLE", "NA MESA")}</p>
            <h2 id="share-panel-title">${t("Share the field manual", "Compartilhe o manual")}</h2>
            <p>${t("Scan this QR code with a phone or tablet to open the published game index.", "Escaneie este QR Code com um celular ou tablet para abrir o índice publicado.")}</p>
            <a class="share-url" data-share-url href="${TABLE_SHARE_URL}">${TABLE_SHARE_URL}</a>
            <button class="button-secondary share-copy-button" type="button" data-share-copy>${t("Copy link", "Copiar link")}</button>
            <p class="share-status" data-share-status role="status" aria-live="polite"></p>
          </div>
          <figure class="share-qr-figure">
            <img class="share-qr-image" src="assets/share-qr.svg?v=1" alt="${t("QR code linking to the Sniper Elite rulebook index", "QR Code com link para o índice de regras de Sniper Elite")}">
            <figcaption>${t("Published game index", "Índice publicado")}</figcaption>
          </figure>
        </section>
        <div class="section-intro"><div><p class="eyebrow">${t("Game index", "Índice de jogos")}</p><h2>${t("Choose your battlefield", "Escolha seu campo de batalha")}</h2></div>
          <p>${t("Each game keeps its own saved match. Opening Not Enough Mana does not change the Sniper Elite setup.", "Cada jogo guarda a própria partida. Abrir Not Enough Mana não altera a configuração de Sniper Elite.")}</p>
          <p class="section-intro-note">${t(
            "Player counts, playing time, BGG rating and complexity weight come from BoardGameGeek (rounded for the 1–5 scale).",
            "Jogadores, tempo, nota e peso vêm do BoardGameGeek (escala 1–5 arredondada a partir do peso)."
          )}</p>
        </div>
        <div class="game-grid">
          ${sortIndexCatalog(window.FieldManualIndexCatalog || []).map((game) => renderIndexGameCard(game)).join("")}
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide. Rule summaries are based on the supplied Sniper Elite manuals; the linked source PDFs are included in this repository.",
        "Guia pessoal de consulta. Os resumos usam os manuais fornecidos de Sniper Elite; os PDFs originais estão incluídos neste repositório."
      )}</p></footer>`;
  }

  function render() {
    const route = currentRoute();
    if (route !== "avalon-the-riven-veil") {
      document.body.classList.remove("theme-avalon");
    }
    if (route !== "western-legends") {
      document.body.classList.remove("theme-western-legends");
    }
    if (route !== "lotr-fate-of-the-fellowship") {
      document.body.classList.remove("theme-lotr");
    }
    if (route !== "witcher-path-of-destiny") {
      document.body.classList.remove("theme-witcher");
    }
    if (route !== "cangaceiros") {
      document.body.classList.remove("theme-cangaceiros");
    }
    if (route !== "lotr-duel-for-middle-earth") {
      document.body.classList.remove("theme-lotr-duel");
    }
    if (route !== "coup") {
      document.body.classList.remove("theme-coup");
    }
    if (route !== "munchkin") {
      document.body.classList.remove("theme-munchkin");
    }
    if (route !== "pandemic") {
      document.body.classList.remove("theme-pandemic");
    }
    if (route !== "kelp") {
      document.body.classList.remove("theme-kelp");
    }
    if (route !== "mind-mgmt") {
      document.body.classList.remove("theme-mind-mgmt");
    }
    if (route !== "galileo-galilei") {
      document.body.classList.remove("theme-galileo");
    }
    if (route !== "heat") {
      document.body.classList.remove("theme-heat");
    }
    if (route !== "bristol-1350") {
      document.body.classList.remove("theme-bristol");
    }
    if (route !== "love-letter") {
      document.body.classList.remove("theme-love-letter");
    }
    if (route !== "sky-team") {
      document.body.classList.remove("theme-sky-team");
    }
    if (route !== "deadwood-1876") {
      document.body.classList.remove("theme-deadwood");
    }
    if (route !== "bang") {
      document.body.classList.remove("theme-bang");
    }
    if (route !== "7-wonders") {
      document.body.classList.remove("theme-seven-wonders");
    }
    if (route !== "art-society") {
      document.body.classList.remove("theme-art-society");
    }
    if (route !== "azul") {
      document.body.classList.remove("theme-azul");
    }
    if (route !== "azul-queens-garden") {
      document.body.classList.remove("theme-azul-queens-garden");
    }
    if (route !== "betrayal-at-house-on-the-hill") {
      document.body.classList.remove("theme-betrayal");
    }
    if (route !== "carcassonne") {
      document.body.classList.remove("theme-carcassonne");
    }
    if (route !== "cascadia") {
      document.body.classList.remove("theme-cascadia");
    }
    if (route !== "dixit") {
      document.body.classList.remove("theme-dixit");
    }
    if (route !== "fit-to-print") {
      document.body.classList.remove("theme-fit-to-print");
    }
    if (route !== "harry-potter-defense-against-the-dark-arts") {
      document.body.classList.remove("theme-hp-dada");
    }
    if (route !== "knitting-circle") {
      document.body.classList.remove("theme-knitting-circle");
    }
    if (route !== "mysterium") {
      document.body.classList.remove("theme-mysterium");
    }
    if (route !== "parks") {
      document.body.classList.remove("theme-parks");
    }
    if (route !== "patchwork") {
      document.body.classList.remove("theme-patchwork");
    }
    if (route !== "point-galaxy") {
      document.body.classList.remove("theme-point-galaxy");
    }
    if (route !== "rebel-princess") {
      document.body.classList.remove("theme-rebel-princess");
    }
    if (route !== "secret-hitler") {
      document.body.classList.remove("theme-sh");
    }
    if (route !== "marvel-dice-throne") {
      document.body.classList.remove("theme-mdt");
    }
    if (route !== "salem-1692") {
      document.body.classList.remove("theme-salem");
    }
    if (route === "secret-hitler" && window.SecretHitler) {
      window.SecretHitler.renderInto(app);
      return;
    }
    if (route === "marvel-dice-throne" && window.MarvelDiceThrone) {
      window.MarvelDiceThrone.renderInto(app);
      return;
    }
    if (route === "salem-1692" && window.Salem1692) {
      window.Salem1692.renderInto(app);
      return;
    }
    if (route === "rebel-princess" && window.RebelPrincess) {
      window.RebelPrincess.renderInto(app);
      return;
    }
    if (route === "point-galaxy" && window.PointGalaxy) {
      window.PointGalaxy.renderInto(app);
      return;
    }
    if (route === "patchwork" && window.Patchwork) {
      window.Patchwork.renderInto(app);
      return;
    }
    if (route === "parks" && window.Parks) {
      window.Parks.renderInto(app);
      return;
    }
    if (route === "mysterium" && window.Mysterium) {
      window.Mysterium.renderInto(app);
      return;
    }
    if (route === "knitting-circle" && window.KnittingCircle) {
      window.KnittingCircle.renderInto(app);
      return;
    }
    if (route === "harry-potter-defense-against-the-dark-arts" && window.HarryPotterDada) {
      window.HarryPotterDada.renderInto(app);
      return;
    }
    if (route === "fit-to-print" && window.FitToPrint) {
      window.FitToPrint.renderInto(app);
      return;
    }
    if (route === "dixit" && window.Dixit) {
      window.Dixit.renderInto(app);
      return;
    }
    if (route === "cascadia" && window.Cascadia) {
      window.Cascadia.renderInto(app);
      return;
    }
    if (route === "carcassonne" && window.Carcassonne) {
      window.Carcassonne.renderInto(app);
      return;
    }
    if (route === "betrayal-at-house-on-the-hill" && window.BetrayalAtHouseOnTheHill) {
      window.BetrayalAtHouseOnTheHill.renderInto(app);
      return;
    }
    if (route === "azul-queens-garden" && window.AzulQueensGarden) {
      window.AzulQueensGarden.renderInto(app);
      return;
    }
    if (route === "azul" && window.Azul) {
      window.Azul.renderInto(app);
      return;
    }
    if (route === "art-society" && window.ArtSociety) {
      window.ArtSociety.renderInto(app);
      return;
    }
    if (route === "7-wonders" && window.SevenWonders) {
      window.SevenWonders.renderInto(app);
      return;
    }
    if (route === "bang" && window.Bang) {
      window.Bang.renderInto(app);
      return;
    }
    if (route === "deadwood-1876" && window.Deadwood1876) {
      window.Deadwood1876.renderInto(app);
      return;
    }
    if (route === "sky-team" && window.SkyTeam) {
      window.SkyTeam.renderInto(app);
      return;
    }
    if (route === "love-letter" && window.LoveLetter) {
      window.LoveLetter.renderInto(app);
      return;
    }
    if (route === "bristol-1350" && window.Bristol1350) {
      window.Bristol1350.renderInto(app);
      return;
    }
    if (route === "heat" && window.Heat) {
      window.Heat.renderInto(app);
      return;
    }
    if (route === "galileo-galilei" && window.GalileoGalilei) {
      window.GalileoGalilei.renderInto(app);
      return;
    }
    if (route === "mind-mgmt" && window.MindMgmt) {
      window.MindMgmt.renderInto(app);
      return;
    }
    if (route === "kelp" && window.Kelp) {
      window.Kelp.renderInto(app);
      return;
    }
    if (route === "pandemic" && window.Pandemic) {
      window.Pandemic.renderInto(app);
      return;
    }
    if (route === "munchkin" && window.Munchkin) {
      window.Munchkin.renderInto(app);
      return;
    }
    if (route === "coup" && window.Coup) {
      window.Coup.renderInto(app);
      return;
    }
    if (route === "lotr-duel-for-middle-earth" && window.LotrDuelForMiddleEarth) {
      window.LotrDuelForMiddleEarth.renderInto(app);
      return;
    }
    if (route === "cangaceiros" && window.Cangaceiros) {
      window.Cangaceiros.renderInto(app);
      return;
    }
    if (route === "lotr-fate-of-the-fellowship" && window.LotrFateOfTheFellowship) {
      window.LotrFateOfTheFellowship.renderInto(app);
      return;
    }
    if (route === "witcher-path-of-destiny" && window.WitcherPathOfDestiny) {
      window.WitcherPathOfDestiny.renderInto(app);
      return;
    }
    if (route === "western-legends" && window.WesternLegends) {
      window.WesternLegends.renderInto(app);
      return;
    }
    if (route === "sniper-elite" && window.SniperElite) {
      window.SniperElite.renderInto(app);
      return;
    }
    if (route === "not-enough-mana" && window.NotEnoughMana) {
      window.NotEnoughMana.renderInto(app);
      return;
    }
    if (route === "avalon-the-riven-veil" && window.AvalonTheRivenVeil) {
      window.AvalonTheRivenVeil.renderInto(app);
      return;
    }
    if (route === "pagan" && window.Pagan) {
      window.Pagan.renderInto(app);
      return;
    }
    if (route === "odins-ravens" && window.OdinsRavens) {
      window.OdinsRavens.renderInto(app);
      return;
    }
    renderLanding();
  }

  function onClick(event) {
    const route = currentRoute();
    if (route === "secret-hitler" && window.SecretHitler) {
      window.SecretHitler.onClick(event);
      return;
    }
    if (route === "marvel-dice-throne" && window.MarvelDiceThrone) {
      window.MarvelDiceThrone.onClick(event);
      return;
    }
    if (route === "salem-1692" && window.Salem1692) {
      window.Salem1692.onClick(event);
      return;
    }
    if (route === "rebel-princess" && window.RebelPrincess) {
      window.RebelPrincess.onClick(event);
      return;
    }
    if (route === "point-galaxy" && window.PointGalaxy) {
      window.PointGalaxy.onClick(event);
      return;
    }
    if (route === "patchwork" && window.Patchwork) {
      window.Patchwork.onClick(event);
      return;
    }
    if (route === "parks" && window.Parks) {
      window.Parks.onClick(event);
      return;
    }
    if (route === "mysterium" && window.Mysterium) {
      window.Mysterium.onClick(event);
      return;
    }
    if (route === "knitting-circle" && window.KnittingCircle) {
      window.KnittingCircle.onClick(event);
      return;
    }
    if (route === "harry-potter-defense-against-the-dark-arts" && window.HarryPotterDada) {
      window.HarryPotterDada.onClick(event);
      return;
    }
    if (route === "fit-to-print" && window.FitToPrint) {
      window.FitToPrint.onClick(event);
      return;
    }
    if (route === "dixit" && window.Dixit) {
      window.Dixit.onClick(event);
      return;
    }
    if (route === "cascadia" && window.Cascadia) {
      window.Cascadia.onClick(event);
      return;
    }
    if (route === "carcassonne" && window.Carcassonne) {
      window.Carcassonne.onClick(event);
      return;
    }
    if (route === "betrayal-at-house-on-the-hill" && window.BetrayalAtHouseOnTheHill) {
      window.BetrayalAtHouseOnTheHill.onClick(event);
      return;
    }
    if (route === "azul-queens-garden" && window.AzulQueensGarden) {
      window.AzulQueensGarden.onClick(event);
      return;
    }
    if (route === "azul" && window.Azul) {
      window.Azul.onClick(event);
      return;
    }
    if (route === "art-society" && window.ArtSociety) {
      window.ArtSociety.onClick(event);
      return;
    }
    if (route === "7-wonders" && window.SevenWonders) {
      window.SevenWonders.onClick(event);
      return;
    }
    if (route === "bang" && window.Bang) {
      window.Bang.onClick(event);
      return;
    }
    if (route === "deadwood-1876" && window.Deadwood1876) {
      window.Deadwood1876.onClick(event);
      return;
    }
    if (route === "sky-team" && window.SkyTeam) {
      window.SkyTeam.onClick(event);
      return;
    }
    if (route === "love-letter" && window.LoveLetter) {
      window.LoveLetter.onClick(event);
      return;
    }
    if (route === "bristol-1350" && window.Bristol1350) {
      window.Bristol1350.onClick(event);
      return;
    }
    if (route === "heat" && window.Heat) {
      window.Heat.onClick(event);
      return;
    }
    if (route === "galileo-galilei" && window.GalileoGalilei) {
      window.GalileoGalilei.onClick(event);
      return;
    }
    if (route === "kelp" && window.Kelp) {
      window.Kelp.onClick(event);
      return;
    }
    if (route === "mind-mgmt" && window.MindMgmt) {
      window.MindMgmt.onClick(event);
      return;
    }
    if (route === "sniper-elite" && window.SniperElite) {
      window.SniperElite.onClick(event);
      return;
    }
    if (route === "not-enough-mana" && window.NotEnoughMana) {
      window.NotEnoughMana.onClick(event);
      return;
    }
    if (route === "avalon-the-riven-veil" && window.AvalonTheRivenVeil) {
      window.AvalonTheRivenVeil.onClick(event);
      return;
    }
    if (route === "pagan" && window.Pagan) {
      window.Pagan.onClick(event);
      return;
    }
    if (route === "odins-ravens" && window.OdinsRavens) {
      window.OdinsRavens.onClick(event);
      return;
    }
    if (route === "western-legends" && window.WesternLegends) {
      window.WesternLegends.onClick(event);
      return;
    }
    if (route === "lotr-fate-of-the-fellowship" && window.LotrFateOfTheFellowship) {
      window.LotrFateOfTheFellowship.onClick(event);
      return;
    }
    if (route === "witcher-path-of-destiny" && window.WitcherPathOfDestiny) {
      window.WitcherPathOfDestiny.onClick(event);
      return;
    }
    if (route === "cangaceiros" && window.Cangaceiros) {
      window.Cangaceiros.onClick(event);
      return;
    }
    if (route === "lotr-duel-for-middle-earth" && window.LotrDuelForMiddleEarth) {
      window.LotrDuelForMiddleEarth.onClick(event);
      return;
    }
    if (route === "coup" && window.Coup) {
      window.Coup.onClick(event);
      return;
    }
    if (route === "munchkin" && window.Munchkin) {
      window.Munchkin.onClick(event);
      return;
    }
    if (route === "pandemic" && window.Pandemic) {
      window.Pandemic.onClick(event);
      return;
    }
    const button = event.target.closest("button");
    if (!button || !app.contains(button)) {
      return;
    }
    if (button.dataset.language) {
      if (window.SniperElite) {
        window.SniperElite.setLanguage(button.dataset.language);
      }
      render();
      return;
    }
    if (button.hasAttribute("data-share-copy")) {
      const status = app.querySelector("[data-share-status]");
      if (!navigator.clipboard?.writeText) {
        if (status) {
          status.textContent = t("Clipboard access is unavailable; select the link above to copy it.", "A área de transferência não está disponível; selecione o link acima para copiá-lo.");
        }
        return;
      }
      navigator.clipboard.writeText(TABLE_SHARE_URL).then(
        () => {
          if (status) {
            status.textContent = t("Link copied.", "Link copiado.");
          }
        },
        (error) => {
          if (status) {
            status.textContent = t("Could not copy the link; select it above to copy it manually.", "Não foi possível copiar o link; selecione-o acima para copiá-lo manualmente.");
          }
          console.error("Could not copy the table share link.", error);
        }
      );
    }
  }

  function onChange(event) {
    const route = currentRoute();
    if (route === "secret-hitler" && window.SecretHitler) {
      window.SecretHitler.onChange(event);
      return;
    }
    if (route === "marvel-dice-throne" && window.MarvelDiceThrone) {
      window.MarvelDiceThrone.onChange(event);
      return;
    }
    if (route === "salem-1692" && window.Salem1692) {
      window.Salem1692.onChange(event);
      return;
    }
    if (route === "rebel-princess" && window.RebelPrincess) {
      window.RebelPrincess.onChange(event);
      return;
    }
    if (route === "point-galaxy" && window.PointGalaxy) {
      window.PointGalaxy.onChange(event);
      return;
    }
    if (route === "patchwork" && window.Patchwork) {
      window.Patchwork.onChange(event);
      return;
    }
    if (route === "parks" && window.Parks) {
      window.Parks.onChange(event);
      return;
    }
    if (route === "mysterium" && window.Mysterium) {
      window.Mysterium.onChange(event);
      return;
    }
    if (route === "knitting-circle" && window.KnittingCircle) {
      window.KnittingCircle.onChange(event);
      return;
    }
    if (route === "harry-potter-defense-against-the-dark-arts" && window.HarryPotterDada) {
      window.HarryPotterDada.onChange(event);
      return;
    }
    if (route === "fit-to-print" && window.FitToPrint) {
      window.FitToPrint.onChange(event);
      return;
    }
    if (route === "dixit" && window.Dixit) {
      window.Dixit.onChange(event);
      return;
    }
    if (route === "cascadia" && window.Cascadia) {
      window.Cascadia.onChange(event);
      return;
    }
    if (route === "carcassonne" && window.Carcassonne) {
      window.Carcassonne.onChange(event);
      return;
    }
    if (route === "betrayal-at-house-on-the-hill" && window.BetrayalAtHouseOnTheHill) {
      window.BetrayalAtHouseOnTheHill.onChange(event);
      return;
    }
    if (route === "azul-queens-garden" && window.AzulQueensGarden) {
      window.AzulQueensGarden.onChange(event);
      return;
    }
    if (route === "azul" && window.Azul) {
      window.Azul.onChange(event);
      return;
    }
    if (route === "art-society" && window.ArtSociety) {
      window.ArtSociety.onChange(event);
      return;
    }
    if (route === "7-wonders" && window.SevenWonders) {
      window.SevenWonders.onChange(event);
      return;
    }
    if (route === "bang" && window.Bang) {
      window.Bang.onChange(event);
      return;
    }
    if (route === "deadwood-1876" && window.Deadwood1876) {
      window.Deadwood1876.onChange(event);
      return;
    }
    if (route === "sky-team" && window.SkyTeam) {
      window.SkyTeam.onChange(event);
      return;
    }
    if (route === "love-letter" && window.LoveLetter) {
      window.LoveLetter.onChange(event);
      return;
    }
    if (route === "bristol-1350" && window.Bristol1350) {
      window.Bristol1350.onChange(event);
      return;
    }
    if (route === "heat" && window.Heat) {
      window.Heat.onChange(event);
      return;
    }
    if (route === "galileo-galilei" && window.GalileoGalilei) {
      window.GalileoGalilei.onChange(event);
      return;
    }
    if (route === "kelp" && window.Kelp) {
      window.Kelp.onChange(event);
      return;
    }
    if (route === "mind-mgmt" && window.MindMgmt) {
      window.MindMgmt.onChange(event);
      return;
    }
    if (route === "sniper-elite" && window.SniperElite) {
      window.SniperElite.onChange(event);
      return;
    }
    if (route === "not-enough-mana" && window.NotEnoughMana) {
      window.NotEnoughMana.onChange(event);
      return;
    }
    if (route === "avalon-the-riven-veil" && window.AvalonTheRivenVeil) {
      window.AvalonTheRivenVeil.onChange(event);
    }
    if (route === "pagan" && window.Pagan) {
      window.Pagan.onChange(event);
    }
    if (route === "odins-ravens" && window.OdinsRavens) {
      window.OdinsRavens.onChange(event);
    }
    if (route === "western-legends" && window.WesternLegends) {
      window.WesternLegends.onChange(event);
    }
    if (route === "lotr-fate-of-the-fellowship" && window.LotrFateOfTheFellowship) {
      window.LotrFateOfTheFellowship.onChange(event);
    }
    if (route === "witcher-path-of-destiny" && window.WitcherPathOfDestiny) {
      window.WitcherPathOfDestiny.onChange(event);
    }
    if (route === "cangaceiros" && window.Cangaceiros) {
      window.Cangaceiros.onChange(event);
    }
    if (route === "lotr-duel-for-middle-earth" && window.LotrDuelForMiddleEarth) {
      window.LotrDuelForMiddleEarth.onChange(event);
    }
    if (route === "coup" && window.Coup) {
      window.Coup.onChange(event);
    }
    if (route === "munchkin" && window.Munchkin) {
      window.Munchkin.onChange(event);
    }
    if (route === "pandemic" && window.Pandemic) {
      window.Pandemic.onChange(event);
    }
  }

  app.addEventListener("click", onClick);
  app.addEventListener("change", onChange);
  app.addEventListener("input", (event) => {
    if (currentRoute() === "not-enough-mana" && window.NotEnoughMana) {
      window.NotEnoughMana.onInput(event);
    }
    if (currentRoute() === "pagan" && window.Pagan) {
      window.Pagan.onInput(event);
    }
    if (currentRoute() === "odins-ravens" && window.OdinsRavens) {
      window.OdinsRavens.onInput(event);
    }
    if (currentRoute() === "cangaceiros" && window.Cangaceiros) {
      window.Cangaceiros.onInput(event);
    }
  });
  window.addEventListener("hashchange", () => {
    window.scrollTo(0, 0);
    render();
  });
  render();
})();
