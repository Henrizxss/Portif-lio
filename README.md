# Portfólio de Henri Alves

Site responsivo em HTML, CSS e JavaScript, com leitura pública dos projetos e painel privado conectado ao Supabase para gerenciar descrições, links e imagens.

## Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com/).
2. No **SQL Editor**, execute o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql). Isso cria a tabela de projetos, as políticas de acesso e o bucket público de imagens.
3. Em **Project Settings → API**, copie a Project URL e a chave publicável (anon) para `supabaseUrl` e `supabaseAnonKey` em [`config.js`](./config.js). Essa chave é destinada ao navegador; nunca coloque a service role key no site.
4. Em **Authentication → Users**, crie um usuário para o autor (por exemplo, o e-mail do currículo). A tela do portfólio não oferece cadastro público.
5. Execute no SQL Editor, substituindo o e-mail pelo usuário criado:

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'seu-email@exemplo.com'
   on conflict (user_id) do nothing;
   ```

   Só usuários listados em `admin_users` podem cadastrar, editar, excluir projetos ou enviar imagens. Visitantes podem apenas ler projetos e imagens.

6. Abra `index.html` por um servidor local ou publique a pasta na Netlify. Depois da configuração, use **Área do autor** para entrar.

## Publicação local

Com Python instalado, execute na pasta do projeto:

```powershell
python -m http.server 8000
```

Abra `http://localhost:8000`. Um servidor HTTP é necessário para carregar os módulos JavaScript.

## Projetos

O painel permite adicionar e editar nome, resumo, tecnologias, imagem, link do GitHub e demonstração publicada, além de destacar projetos. Os dados ficam no Supabase e são compartilhados com os visitantes. As imagens podem ser enviadas para o bucket configurado ou apontar para uma URL pública.
