-- The old on/off kill switch, superseded by app_settings.ordering_mode
-- (20260919000000_ordering_schedule.sql). Kept only for the few minutes
-- the previously deployed app needed it during the switch-over; nothing
-- reads or writes it any more (place_order() checks ordering_is_open()).
-- Dropped so nobody flips it in the Table Editor expecting it to work.
alter table public.app_settings drop column ordering_enabled;
