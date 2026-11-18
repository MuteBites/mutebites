-- 5 is skipped by default but the admin can now let it through (More →
-- Block order number, tap 5): app_settings.skip_five, on by default, kept
-- until changed. Other blocked numbers stay per day (blocked_tokens).
alter table public.app_settings add column skip_five boolean not null default true;

CREATE OR REPLACE FUNCTION public.set_daily_order_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
  today date := (new.created_at at time zone 'Asia/Kolkata')::date;
  skip5 boolean := coalesce((select skip_five from public.app_settings limit 1), true);
  n int;
begin
  insert into public.daily_order_counters (order_day, last_number)
  values (today, 0)
  on conflict (order_day) do nothing;
  select last_number into n from public.daily_order_counters where order_day = today for update;
  n := n + 1;
  while (skip5 and n = 5) or exists (select 1 from public.blocked_tokens b where b.day = today and b.number = n) loop
    n := n + 1;
  end loop;
  update public.daily_order_counters set last_number = n where order_day = today;
  new.daily_number := n;
  return new;
end;
$function$;
