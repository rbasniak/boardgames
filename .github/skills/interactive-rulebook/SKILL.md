---
name: interactive-rulebook
description: Use when adding a new board game or expansion to this repository's interactive rulebook, or when revising a game guide against its manuals. Covers source research, configurable rules, bilingual content, setup, artwork, implementation, and verification.
---

# Criar ou revisar um rulebook interativo

Esta skill orienta a criação ponta a ponta de **um novo jogo neste repositório**. Use o guia de Sniper Elite como referência de experiência e integração, não como fonte das regras do próximo jogo. Faça o trabalho completo solicitado; não pare num resumo ou numa página que dependa do PDF para preencher lacunas.

## 1. Delimitar o jogo e auditar as fontes

1. Descubra os manuais e as expansões fornecidos, idiomas disponíveis, modos de jogo, público-alvo, lados/papéis, mapas e variantes. Confirme ambiguidades de escopo e escolhas de comportamento com o usuário; não assuma que todos os jogos têm Sniper/Defensores, objetivos, Special Ops ou modo solo.
2. Leia os manuais **antes** de redigir regras. Monte uma matriz de rastreabilidade por manual/página: componentes e quantidades; dependências e incompatibilidades; decisões anteriores à partida; ordem de setup; informação pública/oculta; ações e limites; condições de vitória; exceções por mapa/expansão; exemplos ilustrados; ícones e terminologia. Confira interações entre expansões, não apenas cada PDF isoladamente.
3. Compare cada seção do guia com a matriz. Se um efeito constar apenas em uma carta não fornecida, diga que o texto está na carta; **não invente a regra**. Registre conflitos de fontes e resolva-os com o usuário quando não houver precedência documentada.
4. Parafraseie as regras com referências precisas às páginas; não copie os manuais completos para o repositório nem reproduza longos trechos. Trate arquivos e caminhos privados como locais. Confirme direitos de uso dos recortes de arte antes de publicá-los.

## 2. Configurar a partida **antes** do Setup

- Preserve o índice geral, com uma entrada por jogo, e acrescente a página/rota do novo jogo sem mudar a configuração salva dos demais. Respeite os padrões existentes de `app.js`, `styles.css`, `index.html`, `assets/` e `server.py`; refatore apenas se a integração exigir.
- Em **Build your match / Configure a partida**, ofereça primeiro as escolhas exigidas pelos manuais: expansões, mapa/tabuleiro, modo, personagens e regras opcionais realmente disponíveis. **Explique o que cada escolha faz no próprio controle**, inclusive custos, quantidade, disponibilidade, dependências, sigilo e quando seus componentes entram no jogo. Não introduza uma opção pela primeira vez como “se escolhida” no Setup ou apenas no glossário.
- Mostre apenas escolhas compatíveis com a configuração. Imponha limites ou orçamentos de seleção somente quando o manual os definir, incluindo repetição permitida, ordem de escolha entre lados e contagem exata. Não habilite vantagens de mapa ou itens de expansões ausentes. Sinalize uma configuração incompleta antes do Setup; não a trate como uma partida válida silenciosamente.
- Persista as preferências por **jogo**, em chaves independentes de `localStorage`. Normalize e valide valores carregados, inclusive dados antigos, e remova seleções que se tornaram incompatíveis. Mapa/expansões/opções/idioma/lado não devem compartilhar a mesma lista de marcações do Setup.
- Salve o progresso dos checkboxes. Se uma escolha que muda a preparação for alterada, desmarque a checklist e atualize as etapas. “Desmarcar tudo” limpa **somente** os checkboxes; trocar idioma ou lado não limpa o progresso. Erros de armazenamento devem ser comunicados, não mascarados.
- Preserve segredos do jogo: não exponha no estado compartilhável, na interface comum ou no QR informações que os adversários só descobrem durante a partida. Escolhas privadas feitas durante o Setup permanecem privadas conforme o manual.

## 3. Escrever conteúdo que substitua o PDF no escopo combinado

- **Iconografia:** use os ícones reais extraídos dos manuais, não caracteres tipográficos ou símbolos inventados. Identifique o significado e a página-fonte; filtre marcadores específicos do mapa/expansão conforme a partida.
- **Quick Reference:** resumo utilizável durante a partida, separado por lado/papel quando as instruções divergem. Mostre sequência do turno, limites, alertas, efeitos e links para a regra detalhada correspondente. Não liste missões ou vantagens fora da configuração.
- **Setup:** apresente um inventário **desta partida**, com nome, quantidade, origem e destinatário dos componentes. Divida a preparação em fases pequenas (por exemplo, mesa, componentes de cada lado, personagens, baralhos, objetivos, opções específicas, início), conforme o jogo. **Um checkbox por operação física verificável**: pegar, embaralhar, comprar, escolher, separar, posicionar, revelar, devolver. Declare quantas cartas/fichas, de qual reserva, para quem e em que ordem; deixe claro o que fica secreto. Evite frases vagas como “prepare as cartas” sem antes identificá-las. Etapas condicionais à sorte (ex.: duas cartas iguais) não são “regras opcionais”; distinga-as no progresso quando necessário.
- **Vitória e Turnos:** cubra condições de vitória/derrota de cada lado, ordem de fases, ações, custos, execução, restrições e efeitos de regras selecionadas. Redija o texto para a configuração efetiva; não apresente como ativas regras que apenas *podem* ser escolhidas.
- **Exemplos e Glossário:** reúna os exemplos dos manuais, filtrando os que dependem de regras não usadas, e explique termos não óbvios **antes de serem necessários** no fluxo. O glossário complementa, mas não substitui, a explicação junto ao seletor de uma regra opcional. Inclua referências por página.
- Produza EN-US e PT-BR completos; troque o idioma em tempo real, inclusive títulos, descrições, controles, estado e mensagens de erro. Adapte a estética, cores e arte ao manual do **novo** jogo, mantendo contraste, texto alternativo, controles acessíveis e layout móvel.

## 4. Integrar arquivos e publicar com cuidado

- Extraia apenas os recortes necessários de ícones/mapas/ilustrações, confira fidelidade e legibilidade no navegador e guarde-os em `assets/` por jogo; não use texto como substituto de ícone. Não coloque os PDFs integrais no repositório só para que links funcionem.
- Referências `file:///` e rotas locais de `server.py` não funcionam em GitHub Pages. Verifique os links no ambiente local **e** no publicado; se o manual não puder ser disponibilizado legalmente online, explique a limitação em vez de exibir links quebrados como funcionais.
- Atualize documentação diretamente relacionada e o cache-busting de CSS/JS quando necessário. Preserve o índice, o QR/link de compartilhamento existente e as demais páginas; não sobrescreva alterações não commitadas de outra tarefa.

## 5. Verificar antes de entregar

1. Releia cada passo do Setup como alguém que nunca abriu o PDF: é possível localizar, contar, entregar e usar tudo sem adivinhar? Todas as opções necessárias já foram apresentadas? Verifique cada afirmação relevante contra a página/carta de origem.
2. Teste jogo base e combinações representativas de expansões/mapas/opções: dependências, limites e escolhas repetidas; conteúdo incluído **e** excluído; lados, segredos, vitória, turnos, exemplos, glossário e links.
3. No navegador, confira persistência após recarga; reinício da checklist após mudar a configuração; botão “Desmarcar tudo”; preservação do progresso ao alternar idioma/lado; EN-US/PT-BR; layout móvel; ícones/mapas carregados; erros no console.
4. Execute as verificações existentes mais específicas (sintaxe, testes, lint ou build pertinentes) e `git diff --check`. Corrija falhas causadas pela alteração. Relate limitações documentadas, sem declarar o guia completo quando restarem lacunas.
