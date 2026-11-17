# Portfólio de Henri Alves

Site responsivo em HTML, CSS e JavaScript, com leitura pública dos projetos e painel privado conectado ao Supabase para gerenciar descrições, links e imagens.

## Aparência

Use **Alternar layout** no menu para mudar entre os temas moderno (escuro) e soft (claro). A escolha fica salva no navegador de cada visitante.

## Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com/).
2. No **SQL Editor**, execute o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql). Isso cria a tabela de projetos, as políticas de acesso e o bucket público de imagens. Se o banco já estiver configurado, execute esta migração para adicionar a coluna da galeria:

   ```sql
   alter table public.projects
     add column if not exists image_urls text[] not null default '{}';
   ```
3. Na raiz do projeto, abra `.env` e preencha as variáveis:

   ```dotenv
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publicavel_supabase
   ```

   Copie a URL e a chave publicável em **Project Settings → API Keys** no Supabase. Se o projeto ainda fornecer a chave legada `anon`, também pode preencher `VITE_SUPABASE_ANON_KEY`. Nunca use a chave secreta (`service_role` ou `sb_secret_...`) no frontend.
4. Em **Authentication → Users**, crie um usuário para o autor (por exemplo, o e-mail do currículo). A tela do portfólio não oferece cadastro público.
5. Execute no SQL Editor, substituindo o e-mail pelo usuário criado:

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'seu-email@exemplo.com'
   on conflict (user_id) do nothing;
   ```

   Só usuários listados em `admin_users` podem cadastrar, editar, excluir projetos ou enviar imagens. Visitantes podem apenas ler projetos e imagens.

6. Depois da configuração, use **Área do autor** para entrar.

## Publicação local

Use Node.js 22, instale as dependências uma vez e inicie o servidor local:

```powershell
npm install
npm run dev
```

O terminal informa o endereço local do site. Para validar a publicação, execute `npm run build`; os arquivos prontos são gerados em `dist/`.

## Publicação na Vercel

O arquivo [`vercel.json`](./vercel.json) configura o comando `npm run build` e a pasta `dist/`. Importe o repositório na Vercel e adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` em **Project Settings → Environment Variables** para os ambientes desejados. Faça um novo deploy depois de salvar as variáveis. A URL e a chave publicável ficam visíveis no navegador por definição; a segurança para editar dados é aplicada pelas políticas RLS do Supabase. Nunca configure uma chave secreta como variável `VITE_*`.

## Projetos

O painel permite adicionar e editar nome, resumo, tecnologias, imagens, link do GitHub e demonstração publicada, além de destacar projetos. Os dados ficam no Supabase e são compartilhados com os visitantes. Envie várias imagens de uma vez ou informe URLs públicas (uma por linha); a galeria exibe um carrossel automático com controles e ajusta as imagens para caber no espaço disponível.
