# Supabase

1. Crie um projeto na região `sa-east-1`.
2. Abra **SQL Editor** e execute `migrations/0001_initial.sql`.
3. Em **Authentication → URL Configuration**, configure a URL do Vercel e os redirects locais.
4. Copie **Project URL** e **anon public key** para `config.js` durante desenvolvimento ou injete no deploy.
5. Não exponha a `service_role_key`.

O migration cria autenticação complementar, vínculo por código, RLS, Realtime, Storage privado, missões, pet, mensagens, memórias, desenhos, cápsulas e recompensas.
