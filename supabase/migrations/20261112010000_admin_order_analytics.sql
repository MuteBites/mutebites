-- Admin Analytics page (mobile admin step 4, 12 Nov 2026): one function
-- that sums a date range of orders on the server, so the phone gets a
-- small JSON answer instead of every order row.
--
-- security INVOKER on purpose: it reads through the caller's own RLS, so
-- an admin (who can read every order / user / rating) gets campus-wide
-- numbers, and anyone else only ever sums their own rows. No new access.
-- Days and hours are IST wall-clock. "Orders" counts everything not
-- cancelled; "revenue" is delivered orders only (cash actually taken);
-- "booked" is every non-cancelled order's total.

-- Every dashboard query filters orders by created_at; there was no index.
create index if not exists orders_created_at_idx on public.orders (created_at);

create or replace function public.admin_order_analytics(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with o as (
    select id, user_id, restaurant_id, status, total_amount, discount_offer, discount_amount,
           created_at at time zone 'Asia/Kolkata' as local_at
      from orders
     where created_at >= p_from and created_at < p_to
  ),
  live as (select * from o where status <> 'cancelled')
  select jsonb_build_object(
    'orders',    (select count(*) from live),
    'cancelled', (select count(*) from o where status = 'cancelled'),
    'delivered', (select count(*) from o where status = 'delivered'),
    'revenue',   (select coalesce(sum(total_amount), 0) from o where status = 'delivered'),
    'booked',    (select coalesce(sum(total_amount), 0) from live),
    'customers', (select count(distinct user_id) from live),
    'repeat_customers',
                 (select count(*) from (select user_id from live group by user_id having count(*) > 1) r),
    'new_students',
                 (select count(*) from users where created_at >= p_from and created_at < p_to),
    'by_day', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d, 'orders', n, 'revenue', rev) order by d), '[]'::jsonb)
        from (select local_at::date as d, count(*) as n, sum(total_amount) as rev from live group by 1) x
    ),
    'by_hour', (
      select coalesce(jsonb_agg(jsonb_build_object('dow', dow, 'hour', h, 'orders', n)), '[]'::jsonb)
        from (select extract(isodow from local_at)::int as dow, extract(hour from local_at)::int as h, count(*) as n
                from live group by 1, 2) x
    ),
    'by_restaurant', (
      select coalesce(jsonb_agg(jsonb_build_object('name', name, 'orders', n, 'revenue', rev) order by rev desc), '[]'::jsonb)
        from (select coalesce(r.name, 'Restaurant') as name, count(*) as n, sum(live.total_amount) as rev
                from live left join restaurants r on r.id = live.restaurant_id group by 1) x
    ),
    'top_dishes', (
      select coalesce(jsonb_agg(jsonb_build_object('name', dish_name, 'quantity', q, 'students', s) order by q desc), '[]'::jsonb)
        from (select oi.dish_name, sum(oi.quantity) as q, count(distinct live.user_id) as s
                from order_items oi join live on live.id = oi.order_id
               group by 1 order by 2 desc limit 10) x
    ),
    'offers', (
      select coalesce(jsonb_agg(jsonb_build_object('offer', discount_offer, 'orders', n, 'discount', d)), '[]'::jsonb)
        from (select discount_offer, count(*) as n, sum(discount_amount) as d
                from live where discount_offer is not null group by 1) x
    ),
    'ratings', (
      select coalesce(jsonb_agg(jsonb_build_object('name', name, 'average', a, 'ratings', n) order by a), '[]'::jsonb)
        from (select coalesce(r.name, 'Restaurant') as name, round(avg(ir.rating), 2) as a, count(*) as n
                from order_item_ratings ir
                join o on o.id = ir.order_id
                left join restaurants r on r.id = o.restaurant_id
               group by 1) x
    )
  );
$$;

revoke execute on function public.admin_order_analytics(timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_order_analytics(timestamptz, timestamptz) to authenticated;
