# Login simples — Adriel e Maria

## Fluxo

1. A tela mostra apenas os bonequinhos de Adriel e Maria.
2. Adriel toca no próprio avatar e digita somente a senha.
3. Maria toca no próprio avatar. No primeiro aparelho, informa o e-mail uma única vez e cria/entra na conta.
4. O e-mail da Maria fica salvo apenas naquele aparelho para que os próximos acessos peçam somente a senha.
5. O espaço do casal existente usa o convite `LOVE-1517`.

## Depois que a conta da Maria existir

Edite `config.js` e coloque o e-mail dela em `profiles.maria.email`. Depois disso, o campo de e-mail nunca mais aparece.

## Produção

Quando a URL da Vercel estiver definida, configure-a em Supabase > Authentication > URL Configuration como Site URL. Mantenha `http://localhost:3000/**` apenas como redirect adicional de desenvolvimento.

Depois que os dois usuários estiverem criados, desative `Allow new users to sign up` em Authentication > Providers > Email.
