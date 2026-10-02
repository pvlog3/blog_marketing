-- Rode este arquivo inteiro no Supabase: SQL Editor > New query > Run

-- 1) Tabela de administradores (só quem estiver aqui pode editar)
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- um admin pode ver a própria linha (usado pelo site para mostrar o painel)
create policy "admin le a si mesmo" on public.admins
  for select using (user_id = auth.uid());

-- 2) Tabela de postagens
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  blocks jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.posts enable row level security;

-- visitantes: só veem postagens publicadas
create policy "publico le publicados" on public.posts
  for select using (published = true);

-- admin: vê e faz tudo
create policy "admin le tudo" on public.posts
  for select using (public.is_admin());
create policy "admin insere" on public.posts
  for insert with check (public.is_admin());
create policy "admin edita" on public.posts
  for update using (public.is_admin()) with check (public.is_admin());
create policy "admin remove" on public.posts
  for delete using (public.is_admin());

-- 3) Bucket de imagens (leitura pública, escrita só admin)
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

create policy "imagens leitura publica" on storage.objects
  for select using (bucket_id = 'post-images');
create policy "imagens admin envia" on storage.objects
  for insert with check (bucket_id = 'post-images' and public.is_admin());
create policy "imagens admin edita" on storage.objects
  for update using (bucket_id = 'post-images' and public.is_admin());
create policy "imagens admin remove" on storage.objects
  for delete using (bucket_id = 'post-images' and public.is_admin());

-- 4) DEPOIS de criar seu usuário em Authentication > Users, rode (troque o e-mail):
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'SEU_EMAIL@exemplo.com';
