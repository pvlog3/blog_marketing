# Meu Blog (Next.js + Supabase + Vercel)

- **Visitantes**: veem só as postagens publicadas.
- **Admin** (`/admin`): login, criar/editar/excluir/publicar postagens com blocos (título, texto, imagem).

## Passo a passo

### 1. Supabase (banco + login + imagens) — grátis
1. Crie conta em https://supabase.com e um **New project**.
2. **SQL Editor → New query**: cole o conteúdo de `supabase/schema.sql` (até o item 3) e clique **Run**.
3. **Authentication → Users → Add user**: crie seu e-mail/senha (marque *Auto Confirm*).
4. **Authentication → Sign In / Providers → Email**: desative *Allow new users to sign up* (assim ninguém mais cria conta).
5. No SQL Editor rode (com seu e-mail) para se tornar admin:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'SEU_EMAIL@exemplo.com';
   ```
6. **Project Settings → API**: copie a *Project URL* e a chave *anon / publishable*.

### 2. Rodar local
```bash
copy .env.example .env.local   # preencha com a URL e a chave
npm install
npm run dev                    # http://localhost:3000
```

### 3. Publicar na Vercel — grátis
1. Suba o projeto no GitHub (`git init`, commit, push em um repositório novo).
2. Em https://vercel.com → **Add New → Project** → importe o repositório.
3. Em **Environment Variables** adicione `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. **Deploy**. Você ganha um domínio tipo `meu-blog.vercel.app`.

## Segurança
A chave `anon` é pública por design. Quem protege os dados são as regras RLS do `schema.sql`: só quem está na tabela `admins` consegue escrever ou ver rascunhos.
