-- Scaley schema. Every table is keyed by (user_id, id) and locked to its owner by RLS.
-- The client generates ids, writes locally first, then upserts; synced_at is set by the
-- server so other devices can pull changes incrementally without trusting client clocks.

create or replace function public.scaley_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.synced_at := now();
  return new;
end $$;

create table if not exists public.profiles (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (char_length(id) <= 64),
  sex text check (sex in ('male','female')),
  age int check (age between 13 and 100),
  height_cm double precision check (height_cm between 100 and 250),
  weight_kg double precision check (weight_kg between 25 and 300),
  target_kg double precision check (target_kg between 25 and 300),
  goal text check (goal in ('aggressive','moderate','recomp','leanbulk','strength','figure')),
  step_goal int default 8000 check (step_goal between 0 and 60000),
  plan_workout_kcal int default 250 check (plan_workout_kcal between 0 and 2000),
  rest_default int default 90 check (rest_default between 15 and 600),
  tdee int check (tdee between 800 and 6000),
  started_on date,
  updated_at timestamptz not null default now(),
  synced_at timestamptz not null default now(),
  deleted boolean not null default false,
  primary key (user_id, id)
);

create table if not exists public.meals (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (char_length(id) <= 64),
  day date not null,
  slot text not null check (char_length(slot) <= 20),
  oil text not null default 'home' check (oil in ('air','home','mess','dhaba')),
  updated_at timestamptz not null default now(),
  synced_at timestamptz not null default now(),
  deleted boolean not null default false,
  primary key (user_id, id)
);

create table if not exists public.food_entries (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (char_length(id) <= 64),
  day date not null,
  meal_id text not null check (char_length(meal_id) <= 64),
  item text not null check (char_length(item) <= 40),
  name text not null check (char_length(name) <= 80),
  unit text check (char_length(unit) <= 40),
  qty double precision not null default 1 check (qty >= 0 and qty <= 100),
  kcal double precision not null default 0 check (kcal >= 0 and kcal <= 5000),
  protein double precision not null default 0 check (protein >= 0 and protein <= 500),
  updated_at timestamptz not null default now(),
  synced_at timestamptz not null default now(),
  deleted boolean not null default false,
  primary key (user_id, id)
);

create table if not exists public.workouts (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (char_length(id) <= 64),
  day date not null,
  split text not null check (char_length(split) <= 20),
  started_at timestamptz,
  finished boolean not null default false,
  exercises jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  synced_at timestamptz not null default now(),
  deleted boolean not null default false,
  primary key (user_id, id)
);

create table if not exists public.workout_sets (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (char_length(id) <= 64),
  workout_id text not null check (char_length(workout_id) <= 64),
  day date not null,
  exercise text not null check (char_length(exercise) <= 60),
  idx int not null default 0,
  kg double precision check (kg >= 0 and kg <= 1000),
  reps int check (reps >= 0 and reps <= 1000),
  done boolean not null default false,
  updated_at timestamptz not null default now(),
  synced_at timestamptz not null default now(),
  deleted boolean not null default false,
  primary key (user_id, id)
);

create table if not exists public.weigh_ins (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (char_length(id) <= 64),
  day date not null,
  kg double precision not null check (kg between 25 and 300),
  updated_at timestamptz not null default now(),
  synced_at timestamptz not null default now(),
  deleted boolean not null default false,
  primary key (user_id, id)
);

create table if not exists public.day_logs (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (char_length(id) <= 64),
  day date not null,
  steps int check (steps between 0 and 100000),
  workout_kcal int check (workout_kcal between 0 and 5000),
  updated_at timestamptz not null default now(),
  synced_at timestamptz not null default now(),
  deleted boolean not null default false,
  primary key (user_id, id)
);

do $$
declare t text;
begin
  foreach t in array array['profiles','meals','food_entries','workouts','workout_sets','weigh_ins','day_logs']
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
