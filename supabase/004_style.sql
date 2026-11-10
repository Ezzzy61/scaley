-- Scaley v4: look & feel + motivation profile (hero/archetype, why, mantra, music links).
alter table public.profiles
  add column if not exists theme text check (theme in ('system','dark','light')),
  add column if not exists accent_mode text check (accent_mode in ('goal','motivation')),
  add column if not exists motivation jsonb not null default '{}'::jsonb check (pg_column_size(motivation) <= 8000);
