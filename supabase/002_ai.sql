-- Scaley v2: macros, AI coach, photo features.

alter table public.food_entries
  add column if not exists carbs double precision not null default 0 check (carbs >= 0 and carbs <= 1000),
  add column if not exists fat double precision not null default 0 check (fat >= 0 and fat <= 500),
  add column if not exists source text check (char_length(source) <= 20);

create table if not exists public.progress_photos (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (char_length(id) <= 64),
  day date not null,
  path text not null check (char_length(path) <= 200),
  kind text check (kind in ('front','side','back','other')),
  note text check (char_length(note) <= 500),
  ai_note text check (char_length(ai_note) <= 6000),
  kg double precision check (kg between 25 and 300),
  updated_at timestamptz not null default now(),
  synced_at timestamptz not null default now(),
  deleted boolean not null default false,
  primary key (user_id, id)
);

create table if not exists public.coach_messages (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (char_length(id) <= 64),
  day date not null,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) <= 8000),
  updated_at timestamptz not null default now(),
  synced_at timestamptz not null default now(),
  deleted boolean not null default false,
  primary key (user_id, id)
);

do $$
declare t text;
begin
  foreach t in array array['progress_photos','coach_messages']
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

-- Daily quota for the shared (free) AI keys. Users with their own key are not counted.
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  count int not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;
drop policy if exists "own_read" on public.ai_usage;
create policy "own_read" on public.ai_usage for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.ai_usage from anon;
grant select on public.ai_usage to authenticated;

create or replace function public.ai_take_quota(p_count boolean default true)
returns json language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  lim int := 30;
  n int;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  if not p_count then
    return json_build_object('ok', true, 'limit', lim);
  end if;
  insert into public.ai_usage (user_id, day, count)
  values (uid, (now() at time zone 'Asia/Kolkata')::date, 1)
  on conflict (user_id, day) do update set count = public.ai_usage.count + 1
    where public.ai_usage.count < lim
  returning count into n;
  if n is null then
    return json_build_object('ok', false, 'limit', lim, 'used', lim);
  end if;
  return json_build_object('ok', true, 'limit', lim, 'used', n);
end $$;
revoke all on function public.ai_take_quota(boolean) from public, anon;
grant execute on function public.ai_take_quota(boolean) to authenticated;

-- Private progress-photo bucket: each user can only touch files under their own user-id folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('progress', 'progress', false, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "progress_own_select" on storage.objects;
drop policy if exists "progress_own_insert" on storage.objects;
drop policy if exists "progress_own_update" on storage.objects;
drop policy if exists "progress_own_delete" on storage.objects;
create policy "progress_own_select" on storage.objects for select to authenticated
  using (bucket_id = 'progress' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "progress_own_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'progress' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "progress_own_update" on storage.objects for update to authenticated
  using (bucket_id = 'progress' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "progress_own_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'progress' and (storage.foldername(name))[1] = (select auth.uid())::text);
