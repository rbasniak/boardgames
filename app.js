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

  function currentRoute() {
    const hash = window.location.hash;
    if (hash.startsWith("#/sniper-elite")) {
      return "sniper-elite";
    }
    if (hash.startsWith("#/not-enough-mana")) {
      return "not-enough-mana";
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
    document.body.classList.remove("theme-nem");
    document.documentElement.lang = window.SniperElite ? window.SniperElite.language() : "pt-BR";
    document.title = t("Field Manual — Boardgame Rulebooks", "Manual de Campo — Livros de Regras");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = t(
        "Interactive multiplayer rules for Sniper Elite, its expansions, and maps.",
        "Regras multijogador interativas de Sniper Elite, suas expansões e mapas."
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
        </div>
        <div class="game-grid">
          <article class="game-card available">
            <img class="game-cover" src="assets/covers/sniper-elite.webp" alt="${t("Cover of the Sniper Elite main rules manual", "Capa do manual principal de Sniper Elite")}">
            <div class="game-card-body"><span class="card-kicker">${t("Interactive rulebook · available", "Livro interativo · disponível")}</span><h3>Sniper Elite</h3><p>${t("Core game plus Eagle's Nest, Operation Kraken and Escalation. Choose your modules, map and playing side.", "Jogo base e expansões Eagle's Nest, Operation Kraken e Escalation. Escolha módulos, mapa e lado.")}</p><a class="button-primary" href="#/sniper-elite">${t("Open index", "Abrir índice")} <span aria-hidden="true">→</span></a></div>
          </article>
          <article class="game-card available">
            <img class="game-cover" src="assets/covers/not-enough-mana.webp" alt="${t("Cover of the Not Enough Mana booklet", "Capa do livreto de Not Enough Mana")}">
            <div class="game-card-body"><span class="card-kicker">${t("Interactive rulebook · available", "Livro interativo · disponível")}</span><h3>Not Enough Mana</h3><p>${t("Potion-drinking card duel for 3–6 wizards. Choose the table size, potion mana, and the printed variants before setup.", "Duelo de cartas com poções para 3–6 magos. Escolha o tamanho da mesa, a mana da poção e as variantes impressas antes da preparação.")}</p><a class="button-primary" href="#/not-enough-mana">${t("Open index", "Abrir índice")} <span aria-hidden="true">→</span></a></div>
          </article>
          <article class="game-card coming-soon">
            <div class="game-cover-empty" aria-hidden="true"></div>
            <div class="game-card-body"><span class="card-kicker">${t("Future volume", "Próximo volume")}</span><h3>${t("More campaigns", "Mais campanhas")}</h3><p>${t("The general index can hold additional games and expansions.", "O índice geral pode receber outros jogos e expansões.")}</p></div>
          </article>
        </div>
      </main>
      <footer class="site-footer"><p><strong>Field Manual</strong> · ${t(
        "Personal companion guide. Rule summaries are based on the supplied Sniper Elite manuals; the linked source PDFs are included in this repository.",
        "Guia pessoal de consulta. Os resumos usam os manuais fornecidos de Sniper Elite; os PDFs originais estão incluídos neste repositório."
      )}</p></footer>`;
  }

  function render() {
    const route = currentRoute();
    if (route === "sniper-elite" && window.SniperElite) {
      window.SniperElite.renderInto(app);
      return;
    }
    if (route === "not-enough-mana" && window.NotEnoughMana) {
      window.NotEnoughMana.renderInto(app);
      return;
    }
    renderLanding();
  }

  function onClick(event) {
    const route = currentRoute();
    if (route === "sniper-elite" && window.SniperElite) {
      window.SniperElite.onClick(event);
      return;
    }
    if (route === "not-enough-mana" && window.NotEnoughMana) {
      window.NotEnoughMana.onClick(event);
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
    if (route === "sniper-elite" && window.SniperElite) {
      window.SniperElite.onChange(event);
      return;
    }
    if (route === "not-enough-mana" && window.NotEnoughMana) {
      window.NotEnoughMana.onChange(event);
    }
  }

  app.addEventListener("click", onClick);
  app.addEventListener("change", onChange);
  app.addEventListener("input", (event) => {
    if (currentRoute() === "not-enough-mana" && window.NotEnoughMana) {
      window.NotEnoughMana.onInput(event);
    }
  });
  window.addEventListener("hashchange", () => {
    window.scrollTo(0, 0);
    render();
  });
  render();
})();
