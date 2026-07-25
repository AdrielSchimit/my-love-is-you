# TAREFA — ATUALIZAR MY LOVE IS YOU COM A SURPRESA ESPECIAL

Localize em Downloads o arquivo `MY_LOVE_IS_YOU_COM_PEDIDO.zip`.

1. Extraia para a Área de Trabalho em `Desktop\my-love-is-you-pedido`.
2. Antes de substituir qualquer coisa, faça backup do projeto atual.
3. O conteúdo extraído já é o projeto completo atualizado. Copie os arquivos para o repositório local `my-love-is-you`, preservando `.git`.
4. Não altere o design nem regenere os assets.
5. Confirme que existem:
   - `assets/proposal/`
   - `docs/proposal-packs/`
   - a página `data-page="proposal"` em `index.html`
   - funções `acceptProposal` e `showProposalStep` em `src/app.js`
6. Execute validação:
   - `node --check src/app.js`
   - `node --check src/store.js`
   - `node --check src/nana.js`
7. Rode o app localmente e teste este fluxo:
   - entrar em modo demonstração;
   - tocar no presente no topo;
   - avançar a carta;
   - confirmar que Nana aparece entregando a aliança com a frase “O Adriel que mandou te entregar isso aqui!!”;
   - abrir a pergunta;
   - tocar em SIM;
   - confirmar a tela final e ausência de erros no console.
8. Não inclua arquivos de áudio protegidos por direitos autorais. O app usa o player incorporado da publicação oficial.
9. Faça commit:
   `feat: add romantic proposal experience with Nana`
10. Envie para `origin/main` sem `--force`.
11. Só finalize após confirmar que o commit apareceu no GitHub.

Informe no final: arquivos alterados, hash do commit, resultado dos testes e URL do repositório.
