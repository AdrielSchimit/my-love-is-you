# MISSÃO — Aplicar login simples de dois perfis e corrigir onboarding

Localize em Downloads o arquivo `MY_LOVE_IS_YOU_LOGIN_SIMPLES.zip` e extraia-o para a Área de Trabalho.

O projeto final deve ficar exatamente em:

`C:\Users\<USUARIO>\Desktop\my-love-is-you`

Não deixe pasta duplicada `my-love-is-you\my-love-is-you`.

## Objetivo

Atualizar o repositório:

`https://github.com/AdrielSchimit/my-love-is-you.git`

com a versão que contém:

1. tela inicial “Quem está entrando?”;
2. cards de Adriel e Maria com os assets oficiais;
3. login do Adriel pedindo somente senha;
4. login da Maria pedindo o e-mail apenas no primeiro aparelho, caso ele ainda não esteja preenchido em `config.js`;
5. botão “Primeiro acesso da Maria” para criar a conta dela;
6. código padrão do casal `LOVE-1517`;
7. envelope corrigido no onboarding;
8. redirect de confirmação usando a origem atual do app, em vez de localhost fixo;
9. cache do service worker atualizado para não conservar a imagem quebrada.

## Procedimento obrigatório

1. Faça backup da pasta atual, caso exista.
2. Substitua o conteúdo do projeto pela versão extraída.
3. Preserve `.git` da pasta atual, caso já exista.
4. Rode:

```powershell
node --check .\src\app.js
node --check .\src\store.js
node --check .\src\nana.js
```

5. Confirme que estes arquivos existem e têm tamanho maior que zero:

```text
assets/icon-envelope.webp
assets/proposal/envelope.webp
assets/avatar-adriel.webp
assets/avatar-maria.webp
```

6. Rode o projeto localmente e teste visualmente:

```powershell
python -m http.server 3000
```

7. Abra `http://localhost:3000` e valide:
   - aparecem somente Adriel e Maria;
   - tocar em Adriel mostra apenas senha;
   - tocar em Maria permite primeiro acesso;
   - o botão voltar troca de perfil;
   - o onboarding não mostra PNG quebrada;
   - o código aparece como `LOVE-1517`;
   - a surpresa do pedido continua funcionando.

8. Não altere os assets, o visual romântico, o Nana, o gato, o pedido de namoro ou as funcionalidades existentes.
9. Faça commit:

```text
fix: simplify couple login and repair onboarding asset
```

10. Envie para `origin/main` sem `--force`.
11. Confirme que o commit chegou ao GitHub.

## Depois do deploy

Quando houver uma URL definitiva da Vercel:

1. Configure-a em Supabase → Authentication → URL Configuration → Site URL.
2. Adicione `http://localhost:3000/**` apenas como redirect de desenvolvimento.
3. Depois que a conta da Maria existir, coloque o e-mail dela em `config.js`, no campo `profiles.maria.email`.
4. Depois que as duas contas existirem, desative `Allow new users to sign up` no Supabase.

## Relatório final

Mostre:

- caminho do projeto;
- resultado dos três `node --check`;
- resultado do teste visual;
- hash e mensagem do commit;
- confirmação do push;
- qualquer erro real encontrado.
