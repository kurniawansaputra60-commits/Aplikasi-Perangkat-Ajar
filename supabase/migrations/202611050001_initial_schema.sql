-- Run this script in Supabase SQL Editor for project jefbqoimnzytamaaazjo.
create extension if not exists pgcrypto;

create table if not exists public.teaching_packages (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Perangkat Ajar',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint teaching_packages_one_row_per_user unique (user_id)
);

alter table public.teaching_packages enable row level security;
revoke all on public.teaching_packages from anon;
grant select, insert, update, delete on public.teaching_packages to authenticated;
drop policy if exists "Users can read own teaching data" on public.teaching_packages;
drop policy if exists "Users can insert own teaching data" on public.teaching_packages;
drop policy if exists "Users can update own teaching data" on public.teaching_packages;
drop policy if exists "Users can delete own teaching data" on public.teaching_packages;
create policy "Users can read own teaching data" on public.teaching_packages for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own teaching data" on public.teaching_packages for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own teaching data" on public.teaching_packages for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own teaching data" on public.teaching_packages for delete to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.licenses enable row level security;
revoke all on public.licenses from anon, authenticated;

-- To issue one-time codes, run this from SQL Editor and replace the example string:
-- insert into public.licenses (code_hash)
-- values (encode(digest(upper(trim('GANTI-DENGAN-KODE-ACAK-RAHASIA')), 'sha256'), 'hex'));
-- Do not put codes in VITE_* variables or frontend source. Keep SUPABASE_SERVICE_ROLE_KEY only in Vercel server environment variables.
