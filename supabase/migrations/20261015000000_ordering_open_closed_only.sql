-- Redesign: ordering is a plain Open / Closed switch (no daily schedule).
--
-- Applied 15 Oct 2026 through the Supabase connector (history name
-- `ordering_open_closed_only`), ahead of the redesign's deploy at the
-- user's request. At that moment the stored mode was already 'closed', so
-- nothing changed for students; until the redesign is pushed, the old live
-- admin's "Auto" button is refused by the check below (Open / Closed work).
--
-- place_order() is unchanged: with only 'open' / 'closed' left, its
-- 'ordering_closed' branch (the old schedule between slots) can't be
-- reached any more — 'closed' raises 'ordering_paused' as before.
-- Delivery promises keep the old slot cut-offs in the app
-- (deliveryWindow() / slotEndTime(), src/lib/date.ts).

-- 1. Settle a stored 'auto' to what it means right now.
update public.app_settings
   set ordering_mode = case when public.ordering_is_open() then 'open' else 'closed' end
 where ordering_mode = 'auto';

-- 2. Only 'open' / 'closed' from now on.
alter table public.app_settings drop constraint if exists app_settings_ordering_mode_check;
alter table public.app_settings
  add constraint app_settings_ordering_mode_check check (ordering_mode in ('open', 'closed')),
  alter column ordering_mode set default 'open';

-- 3. The switch alone decides (same signature, grants and security definer).
create or replace function public.ordering_is_open()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select ordering_mode = 'open' from app_settings;
$$;

-- 4. The schedule function is no longer used.
drop function if exists public.ordering_schedule_open(timestamptz);
