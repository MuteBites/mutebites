-- One row per student: their taste profile and avatar. Created the first
-- time they save the "Your taste" sheet. No row = the defaults: their
-- initials (no avatar picked) and nothing answered yet.
-- Private to the student: no admin or other-student access.
create table public.taste_profiles (
  user_id     uuid primary key references public.users (id) on delete cascade,
  -- Which preset food avatar; the app holds the list. Ids only, no
  -- uploads. null = not picked, so the app shows the student's initials.
  avatar      text check (avatar ~ '^[a-z0-9-]{1,32}$'),
  -- 1 = mild … 5 = extra spicy; null = not answered.
  spice_level smallint check (spice_level between 1 and 5),
  -- null = not answered.
  diet        text check (diet in ('veg', 'egg', 'nonveg')),
  -- The Home food types they crave most (keys from FOOD_TYPES in
  -- src/lib/home-filters.ts — adding a food type means widening this).
  cravings    text[] not null default '{}'
              check (cravings <@ array['biryani', 'fried-rice', 'noodles', 'starters',
                                       'curries', 'chicken', 'paneer', 'egg',
                                       'juices', 'fruits', 'desserts']::text[]),
  updated_at  timestamptz not null default now()
);

create trigger set_updated_at before update on public.taste_profiles
  for each row execute function public.set_updated_at();

alter table public.taste_profiles enable row level security;

-- A student reads, creates and edits only their own row. No delete policy:
-- it's never removed except with the account (cascade).
create policy "Students read own taste profile"
  on public.taste_profiles for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Students create own taste profile"
  on public.taste_profiles for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Students update own taste profile"
  on public.taste_profiles for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
