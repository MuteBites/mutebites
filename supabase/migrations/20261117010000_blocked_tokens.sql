-- Block order numbers (17 Nov 2026): the admin picks today's token numbers
-- that must never be given out (More → Block order number). The token
-- trigger skips 5 and any blocked number for that IST day.
create table public.blocked_tokens (
  day date not null,
  number int not null check (number between 1 and 9999),
  created_at timestamptz not null default now(),
  blocked_by uuid references public.users(id) on delete set null,
  primary key (day, number)
);
alter table public.blocked_tokens enable row level security;
create policy "admins read blocked tokens" on public.blocked_tokens for select to authenticated using (public.is_admin());
create policy "admins block tokens" on public.blocked_tokens for insert to authenticated with check (public.is_admin());
create policy "admins unblock tokens" on public.blocked_tokens for delete to authenticated using (public.is_admin());
-- The page needs today's last token to list the numbers still ahead.
create policy "admins read order counters" on public.daily_order_counters for select to authenticated using (public.is_admin());

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
  while n = 5 or exists (select 1 from public.blocked_tokens b where b.day = today and b.number = n) loop
    n := n + 1;
  end loop;
  update public.daily_order_counters set last_number = n where order_day = today;
  new.daily_number := n;
  return new;
end;
$function$;
