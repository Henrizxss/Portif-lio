create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  summary text not null check (char_length(summary) between 1 and 400),
  stack text[] not null default '{}',
  image_url text,
  github_url text,
  demo_url text,
  featured boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.projects enable row level security;

create policy "Admins can read their own access"
  on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Anyone can view projects"
  on public.projects for select to anon, authenticated
  using (true);

create policy "Admins can add projects"
  on public.projects for insert to authenticated
  with check (
    exists (select 1 from public.admin_users where user_id = (select auth.uid()))
  );

create policy "Admins can update projects"
  on public.projects for update to authenticated
  using (exists (select 1 from public.admin_users where user_id = (select auth.uid())))
  with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

create policy "Admins can delete projects"
  on public.projects for delete to authenticated
  using (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

insert into storage.buckets (id, name, public)
values ('portfolio-images', 'portfolio-images', true)
on conflict (id) do nothing;

create policy "Anyone can view portfolio images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'portfolio-images');

create policy "Admins can upload portfolio images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'portfolio-images'
    and exists (select 1 from public.admin_users where user_id = (select auth.uid()))
  );

create policy "Admins can update portfolio images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'portfolio-images'
    and exists (select 1 from public.admin_users where user_id = (select auth.uid()))
  )
  with check (
    bucket_id = 'portfolio-images'
    and exists (select 1 from public.admin_users where user_id = (select auth.uid()))
  );

create policy "Admins can delete portfolio images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'portfolio-images'
    and exists (select 1 from public.admin_users where user_id = (select auth.uid()))
  );

grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;
grant select on public.admin_users to authenticated;
