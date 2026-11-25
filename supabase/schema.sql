-- Run this once in Supabase: SQL Editor > New query > paste > Run.
-- If you ran an older version of this file, first run:
--   drop view if exists public.global_leaderboard;
--   drop table if exists public.portfolios, public.party_members, public.parties, public.profiles cascade;

-- Word filter (a small starter list; add a maintained list for real use, see the README)
create table public.blocked_words (word text not null, mode text not null check (mode in ('exact','contains')), primary key (word, mode));
alter table public.blocked_words enable row level security;   -- no policies: only the database functions below can read it
insert into public.blocked_words(word, mode) values
  ('ass','exact'),('bastard','exact'),('dick','exact'),('piss','exact'),('slut','exact'),('prick','exact'),
  ('fuck','contains'),('shit','contains'),('cunt','contains'),('bitch','contains'),('asshole','contains'),('whore','contains');
create or replace function public.norm_tok(t text) returns text language sql immutable as
  $$ select regexp_replace(translate(lower(t), '0@1!|345$7', 'oaiiieasst'), '[^a-z]', '', 'g') $$;
create or replace function public.clean_text(t text) returns text language plpgsql stable security definer set search_path = public as $$
declare tok text; n text; res text[] := '{}';
begin
  if t is null then return null; end if;
  foreach tok in array regexp_split_to_array(trim(t), '\s+') loop
    n := public.norm_tok(tok);
    if n <> '' and exists (select 1 from public.blocked_words b where (b.mode = 'exact' and b.word = n) or (b.mode = 'contains' and position(b.word in n) > 0)) then
      res := res || repeat('#', length(tok));
    else res := res || tok; end if;
  end loop;
  return array_to_string(res, ' ');
end $$;

-- Player profile: rank points, achievements, look and status
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 20),
  xp int not null default 0 check (xp between 0 and 100000),
  achievements jsonb not null default '{}',
  look jsonb not null default '{}',                 -- chosen avatar, banner, effect, accessory, colors
  status text check (status is null or char_length(status) <= 60),   -- status of the day
  status_at timestamptz                              -- set by the database when the status changes
);
alter table public.profiles enable row level security;
create policy "profiles readable" on public.profiles for select to authenticated using (true);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = user_id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Names must be clean. The status is cleaned (bad words become ####) and its 24-hour timer is set by the server, so it can't be faked.
create or replace function public.profiles_guard() returns trigger language plpgsql as $$
begin
  if public.clean_text(new.display_name) <> new.display_name then raise exception 'Please choose a different display name'; end if;
  new.status := left(nullif(trim(public.clean_text(new.status)), ''), 60);
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    new.status_at := case when new.status is null then null else now() end;
  end if;
  return new;
end $$;
create trigger profiles_guard before insert or update on public.profiles for each row execute function public.profiles_guard();

-- Parties (friend groups with the same starting money)
create table public.parties (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 30),
  code text not null unique,
  start_cash numeric not null check (start_cash between 1000 and 10000000),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);
create table public.party_members (
  party_id uuid references public.parties(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  primary key (party_id, user_id)
);
create or replace function public.is_member(pid uuid) returns boolean
  language sql security definer stable set search_path = public as
  $$ select exists(select 1 from party_members where party_id = pid and user_id = auth.uid()) $$;
create or replace function public.is_member_slot(s text) returns boolean
  language sql security definer stable set search_path = public as
  $$ select s <> 'solo' and exists(select 1 from party_members where party_id::text = s and user_id = auth.uid()) $$;
alter table public.parties enable row level security;
alter table public.party_members enable row level security;
create policy "members read party" on public.parties for select to authenticated using (public.is_member(id));
create policy "members read members" on public.party_members for select to authenticated using (public.is_member(party_id));

create or replace function public.create_party(p_name text, p_start numeric) returns public.parties
  language plpgsql security definer set search_path = public as $$
declare c text; r parties;
begin
  if auth.uid() is null then raise exception 'Log in first'; end if;
  loop
    c := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from parties where code = c);
  end loop;
  insert into parties(name, code, start_cash, owner_id) values (p_name, c, p_start, auth.uid()) returning * into r;
  insert into party_members(party_id, user_id) values (r.id, auth.uid());
  return r;
end $$;
create or replace function public.join_party(p_code text) returns public.parties
  language plpgsql security definer set search_path = public as $$
declare r parties;
begin
  if auth.uid() is null then raise exception 'Log in first'; end if;
  select * into r from parties where code = upper(trim(p_code));
  if not found then raise exception 'No party with that code'; end if;
  insert into party_members(party_id, user_id) values (r.id, auth.uid()) on conflict do nothing;
  return r;
end $$;
grant execute on function public.create_party(text, numeric) to authenticated;
grant execute on function public.join_party(text) to authenticated;

-- Games: one "solo" game per player, plus one per party they join. slot = 'solo' or the party id.
create table public.portfolios (
  user_id uuid not null references auth.users(id) on delete cascade,
  slot text not null,
  display_name text not null check (char_length(display_name) between 2 and 20),
  start_cash numeric not null check (start_cash between 1000 and 10000000),
  cash numeric not null check (cash >= 0),
  positions jsonb not null default '{}',
  queue jsonb not null default '[]',
  log jsonb not null default '[]',
  total_value numeric not null check (total_value between 0 and 1000000000),
  updated_at timestamptz default now(),
  primary key (user_id, slot)
);
alter table public.portfolios enable row level security;
create policy "read own or party games" on public.portfolios for select to authenticated
  using (auth.uid() = user_id or public.is_member_slot(slot));
create policy "insert own game" on public.portfolios for insert to authenticated
  with check (auth.uid() = user_id and (slot = 'solo' or exists (
    select 1 from public.parties p where p.id::text = slot and p.start_cash = portfolios.start_cash and public.is_member(p.id))));
create policy "update own game" on public.portfolios for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own solo game" on public.portfolios for delete to authenticated
  using (auth.uid() = user_id and slot = 'solo');

create or replace function public.portfolio_name_guard() returns trigger language plpgsql as $$
begin
  if public.clean_text(new.display_name) <> new.display_name then raise exception 'Please choose a different display name'; end if;
  return new;
end $$;
create trigger portfolio_name_guard before insert or update on public.portfolios for each row execute function public.portfolio_name_guard();

-- The starting amount can never change after a game is created (so nobody can edit it to cheat).
create or replace function public.lock_start() returns trigger language plpgsql as $$
begin
  if new.start_cash <> old.start_cash then raise exception 'Starting cash cannot change'; end if;
  return new;
end $$;
create trigger lock_start before update on public.portfolios for each row execute function public.lock_start();

-- Public global leaderboard: ranked by return, so any starting amount is fair. No user ids or positions are exposed.
create view public.global_leaderboard as
  select p.display_name, p.start_cash, p.total_value, coalesce(r.xp, 0) as xp,
         round(((p.total_value / p.start_cash) - 1) * 100, 2) as return_pct,
         r.look,
         case when r.status_at > now() - interval '24 hours' then r.status end as status   -- statuses vanish after 24 hours
  from public.portfolios p left join public.profiles r on r.user_id = p.user_id
  where p.slot = 'solo';
grant select on public.global_leaderboard to anon, authenticated;
