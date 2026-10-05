-- Gedeeld leaderboard voor Pirates of Port Zélande.
-- Plak dit in Supabase → SQL Editor en klik "Run".

create table if not exists leaderboard (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 20),
  score int not null check (score between 0 and 20000),
  "timeMs" int not null check ("timeMs" between 0 and 36000000),
  date timestamptz not null default now()
);

create index if not exists leaderboard_rank on leaderboard (score desc, "timeMs" asc);

alter table leaderboard enable row level security;

-- Iedereen mag scores lezen en toevoegen; niemand mag wijzigen of verwijderen
-- (dat kan alleen de beheerder via de Table Editor in Supabase).
drop policy if exists "lezen" on leaderboard;
drop policy if exists "toevoegen" on leaderboard;
create policy "lezen" on leaderboard for select using (true);
create policy "toevoegen" on leaderboard for insert with check (true);
