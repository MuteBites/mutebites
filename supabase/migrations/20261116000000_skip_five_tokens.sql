-- Order tokens never contain the digit 5 (client's call, 16 Nov 2026):
-- 1, 2, 3, 4, 6 … 14, 16 … 49, 60 … Still atomic: the day's counter row is
-- locked (for update) while the next token is picked.
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
  loop
    n := n + 1;
    exit when position('5' in n::text) = 0;
  end loop;
  update public.daily_order_counters set last_number = n where order_day = today;
  new.daily_number := n;
  return new;
end;
$function$;
