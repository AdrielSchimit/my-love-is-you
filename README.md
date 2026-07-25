# 💗 My love is You

Aplicativo PWA compartilhado de Adriel e Maria: anime, pixel art, gamificação, distância, gato virtual e o Nana como assistente contextual.

## O que já está implementado

- Login/cadastro pelo Supabase Auth, com modo demonstração local.
- Criação do casal e vínculo por código exclusivo.
- Home fiel ao conceito visual, com Adriel nível 24 e Maria nível 25.
- Mapa Barrinha–Franca com distância corrigida para 125 km.
- Contador configurável do próximo encontro.
- Mensagens e atualização em tempo real.
- Lousa por toque/mouse, envio e galeria de desenhos.
- Check-in de humor dos dois.
- Missões diárias, XP, afinidade, moedas, sequência e boss semanal.
- Gato virtual compartilhado com fome, carinho, energia, XP e níveis.
- Baú com texto, foto, desenhos e Storage privado.
- Cápsulas do tempo.
- Loja de recompensas.
- Temas visuais.
- PWA instalável e cache offline da interface.
- Nana com 12 expressões e mais de 150 falas divididas por contexto.
- Banco com RLS: apenas as duas pessoas vinculadas acessam o conteúdo.

## Rodar localmente

O projeto não exige build.

```bash
python -m http.server 4173
```

Abra `http://localhost:4173`.

Sem credenciais do Supabase, use **Abrir demonstração local**.

## Conectar ao Supabase

Execute `supabase/migrations/0001_initial.sql` no SQL Editor e preencha `config.js`:

```js
window.__MYLOVE_CONFIG__ = {
  supabaseUrl: 'https://SEU-PROJETO.supabase.co',
  supabaseAnonKey: 'SUA_ANON_KEY',
  demoEnabled: true
};
```

Use somente a chave **anon** no frontend. Nunca publique a `service_role_key`.

## Deploy na Vercel

Framework preset: **Other**. Não há comando de build; output é a raiz do projeto. O `vercel.json` já contém o fallback da SPA.

## Ambiente já conectado nesta entrega

Esta entrega já aponta para o projeto Supabase:

- Projeto: `my-love-is-you`
- Ref: `nrydxyufrgtkffxshufg`
- Região: `sa-east-1`

O banco remoto já recebeu as migrations. Os arquivos SQL permanecem em `supabase/migrations` para histórico e reprodução.

## Publicar no GitHub pelo Windows

Na raiz do projeto, execute:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\PUBLICAR_GITHUB.ps1
```

Destino: `https://github.com/AdrielSchimit/my-love-is-you.git`.

## Surpresa especial — pedido de namoro

O botão de presente no topo da Home abre uma experiência especial em quatro etapas:

1. carta romântica;
2. player oficial de `Young and Beautiful` por incorporação do YouTube;
3. Nana entrega a aliança com a frase “O Adriel que mandou te entregar isso aqui!!”;
4. pergunta “Quer namorar comigo?”, resposta e celebração.

Ao tocar em **SIM**, o aceite é salvo no aparelho. Quando o casal estiver conectado ao Supabase, o app também tenta registrar uma mensagem e uma memória compartilhada.

A música não é armazenada no projeto. O player abre a publicação oficial por streaming, após interação da usuária, respeitando bloqueios de autoplay do navegador.
