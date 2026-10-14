-- Run this ONCE in Supabase: SQL Editor > New query > paste > Run.
-- It creates the table that stores the shared list.

create table if not exists items (
  id uuid primary key,                      -- made by the app
  text text not null,                       -- "milk"
  done boolean not null default false,      -- ticked or not
  created_at timestamptz not null default now()
);

-- Row Level Security on, then one rule: the anon key may read and write items.
-- (No logins in V1. The app link is only shared between you two.)
alter table items enable row level security;
create policy "open access" on items for all to anon using (true) with check (true);

-- Turn on realtime for this table, so the other phone updates live.
alter publication supabase_realtime add table items;
