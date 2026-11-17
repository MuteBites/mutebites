-- Lunch message (17 Nov 2026): the admin can give each restaurant's lunch
-- delivery (orders before 12:45 PM, delivered 1:45-2 PM) a message and a
-- delivery person, like the evening one. It's stored as a delivery_batches
-- row with order_until = 12:45 PM IST that day (deliver_from 1:45, deliver_at
-- 2 PM), and place_order() now attaches lunch orders to that row when it
-- exists (promised_at stays 2 PM). Applied by patching the live function.
do $$
declare f text := pg_get_functiondef('public.place_order(uuid,jsonb,text,text,text,jsonb)'::regprocedure);
begin
  if position('lunch message row' in f) > 0 then return; end if;
  f := replace(f,
    $a$v_promised := ((now() at time zone 'Asia/Kolkata')::date + time '14:00') at time zone 'Asia/Kolkata';$a$,
    $b$v_promised := ((now() at time zone 'Asia/Kolkata')::date + time '14:00') at time zone 'Asia/Kolkata';
    -- lunch message row (admin's message / delivery person for lunch), if set
    select id into v_batch_id
      from delivery_batches
     where restaurant_id = p_restaurant_id
       and day = (now() at time zone 'Asia/Kolkata')::date
       and order_until = ((now() at time zone 'Asia/Kolkata')::date + time '12:45') at time zone 'Asia/Kolkata';$b$);
  if position('lunch message row' in f) = 0 then raise exception 'place_order lunch branch not found'; end if;
  execute f;
end $$;
