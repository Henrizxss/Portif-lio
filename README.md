# Portfólio de Henri Alves

Site responsivo em HTML, CSS e JavaScript. A lista pública e o painel de projetos usam uma API na Vercel, com PostgreSQL no Neon, autenticação por senha de administrador e imagens públicas no Vercel Blob.

## Aparência

Use **Alternar layout** no menu para mudar entre os temas moderno (escuro) e soft (claro). A escolha fica salva no navegador de cada visitante.

## Configuração do Neon e Vercel Blob

1. Crie um projeto no [Neon](https://neon.tech/) e execute [`neon/schema.sql`](./neon/schema.sql) no SQL Editor.
2. Na Vercel, conecte um armazenamento **Blob público** ao projeto. A Vercel disponibiliza `BLOB_READ_WRITE_TOKEN` para as funções de upload.
3. Configure estas variáveis em **Vercel → Project Settings → Environment Variables**:

   - `DATABASE_URL`: string de conexão do Neon. Mantenha-a apenas no servidor; não use o prefixo `VITE_`.
   - `ADMIN_PASSWORD`: senha forte e exclusiva, com pelo menos 16 caracteres.
   - `SESSION_SECRET`: segredo aleatório de pelo menos 32 caracteres para assinar a sessão.
   - `BLOB_READ_WRITE_TOKEN`: token do armazenamento Blob, fornecido pela Vercel.

   Gere o segredo de sessão com `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`. Não compartilhe nem versione esses valores.
4. Faça um novo deploy depois de configurar as variáveis. A opção **Área do autor** passa a aceitar a senha configurada em `ADMIN_PASSWORD`.

O Neon pode suspender o compute quando não há uso, mas reativa automaticamente ao receber uma consulta; a primeira requisição após a inatividade pode demorar um pouco. O Blob é usado com acesso público porque as imagens do portfólio são públicas.

## Desenvolvimento local

Use Node.js 22. Na primeira execução, conecte a pasta ao projeto Vercel com `npx vercel link`, crie um armazenamento Blob e disponibilize as variáveis de desenvolvimento em `.env.local` (por exemplo, com `vercel env pull .env.local`):

```powershell
npm install
npm run dev
```

`npm run dev` executa o site e as funções de API juntos. `npm run dev:vite` inicia apenas o servidor Vite, sem as funções de servidor.

Para validar a compilação e os testes:

```powershell
npm run build
npm test
```

## Publicação na Vercel

O arquivo [`vercel.json`](./vercel.json) configura a compilação Vite e a pasta `dist/`; os endpoints em `api/` são publicados como funções de servidor. Importe o repositório na Vercel, adicione as variáveis de produção descritas acima e faça o deploy.

## Projetos

O painel permite adicionar e editar nome, resumo, tecnologias, imagens, link do GitHub e demonstração publicada, além de destacar projetos. Os dados ficam no Neon e são compartilhados com os visitantes. Envie várias imagens de uma vez ou informe URLs públicas (uma por linha); a galeria exibe um carrossel automático com controles e ajusta as imagens para caber no espaço disponível.
