-- Token 5 is never used (client's call, 16 Nov 2026): 1, 2, 3, 4, 6, 7 …
-- (15, 25 … are fine; an earlier draft skipped every number with a 5).
-- Still atomic: the day's counter row is locked while the token is picked.
CREATE OR REPLACE FUNCTION public.set_daily_order_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
  today date := (new.created_at at time zone 'Asia/Kolkata')::date;
  n int;
begin
  insert into public.daily_order_counters (order_day, last_number)
  values (today, 0)
  on conflict (order_day) do nothing;
  select last_number into n from public.daily_order_counters where order_day = today for update;
  n := n + 1;
  if n = 5 then n := 6; end if;
  update public.daily_order_counters set last_number = n where order_day = today;
  new.daily_number := n;
  return new;
end;
$function$;
