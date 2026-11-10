-- Scaley v3: personal-coach layer (location, persona, daily check-ins, activities, custom workouts).

alter table public.profiles
  add column if not exists state text check (char_length(state) <= 40),
  add column if not exists city text check (char_length(city) <= 60),
  add column if not exists locality text check (char_length(locality) <= 80),
  add column if not exists occupation text check (occupation in ('working','student','homemaker','retired','other')),
  add column if not exists experience text check (experience in ('new','returning','regular')),
  add column if not exists conditions jsonb not null default '[]'::jsonb,
  add column if not exists coach_lang text check (coach_lang in ('english','hinglish')),
  add column if not exists plan_id text check (char_length(plan_id) <= 40),
  add column if not exists diet text check (diet in ('veg','egg','nonveg','jain','vegan'));

alter table public.workouts drop constraint if exists workouts_split_check;
alter table public.workouts add constraint workouts_split_check check (char_length(split) <= 40);

create table if not exists public.checkins (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (char_length(id) <= 64),
  day date not null,
  sleep_h double precision check (sleep_h between 0 and 16),
  sleep_q int check (sleep_q between 1 and 5),
  energy int check (energy between 1 and 5),
  stress int check (stress between 1 and 5),
  soreness int check (soreness between 1 and 5),
  sick boolean not null default false,
  note text check (char_length(note) <= 1000),
  score int check (score between 0 and 100),
  updated_at timestamptz not null default now(),
  synced_at timestamptz not null default now(),
  deleted boolean not null default false,
  primary key (user_id, id)
);

create table if not exists public.activities (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (char_length(id) <= 64),
  day date not null,
  type text not null check (char_length(type) <= 30),
  label text check (char_length(label) <= 80),
  minutes int not null check (minutes between 1 and 1440),
  met double precision not null check (met between 1 and 20),
  kcal int not null check (kcal between 0 and 5000),
  updated_at timestamptz not null default now(),
  synced_at timestamptz not null default now(),
  deleted boolean not null default false,
  primary key (user_id, id)
);

create table if not exists public.workout_templates (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (char_length(id) <= 64),
  name text not null check (char_length(name) <= 40),
  exercises jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  synced_at timestamptz not null default now(),
  deleted boolean not null default false,
  primary key (user_id, id)
);

do $$
declare t text;
begin
  foreach t in array array['checkins','activities','workout_templates']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists "owner_all" on public.%I', t);
    execute format($p$create policy "owner_all" on public.%I for all to authenticated
                     using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))$p$, t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('drop trigger if exists scaley_touch on public.%I', t);
    execute format('create trigger scaley_touch before insert or update on public.%I for each row execute function public.scaley_touch()', t);
    execute format('create index if not exists %I on public.%I (user_id, synced_at)', t || '_sync_idx', t);
  end loop;
end $$;
