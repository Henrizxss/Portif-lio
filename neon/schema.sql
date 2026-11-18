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
  updated_at timestamptz not null default now(),
  image_urls text[] not null default '{}'
);

create index if not exists projects_portfolio_order_idx
  on public.projects (featured desc, display_order, created_at desc);
