-- Migration: Add payments table for Midtrans integration and automatic license fulfillment
-- Run in Supabase SQL Editor for your project

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  gross_amount numeric not null default 0,
  payment_type text default 'midtrans',
  status text not null default 'PENDING',
  license_code text,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for speedy webhook lookups
create index if not exists idx_payments_order_id on public.payments (order_id);
create index if not exists idx_payments_status on public.payments (status);

-- Enable RLS (Service role can read/write everything; users can only read their own payments)
alter table public.payments enable row level security;
revoke all on public.payments from anon;
grant select on public.payments to authenticated;

drop policy if exists "Users can view own payments" on public.payments;
create policy "Users can view own payments" on public.payments
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Ensure user_profiles has is_premium column
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  is_premium boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
grant select, update on public.user_profiles to authenticated;

drop policy if exists "Users can view own profile" on public.user_profiles;
create policy "Users can view own profile" on public.user_profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.user_profiles;
create policy "Users can update own profile" on public.user_profiles
  for update to authenticated
  using ((select auth.uid()) = id);
