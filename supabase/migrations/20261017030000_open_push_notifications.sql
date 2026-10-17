-- "Ordering is open" pushes: when the last one went out (3-hour rule)
-- and which messages were used recently (no repeats).
alter table public.app_settings
  add column last_open_push_at timestamptz,
  add column recent_open_messages int[] not null default '{}';

-- Per device: students can mute just the "we're open" pushes.
alter table public.push_subscriptions
  add column notify_open boolean not null default true;
