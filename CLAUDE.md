@AGENTS.md

# MuteBites

Food delivery site for VIT-AP University students.

## Stack

- **Framework**: Next.js (App Router), TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui (`src/components/ui`)
- **Backend**: Supabase (Postgres + Auth + Row Level Security)
- **Auth**: "Continue with Google" via Supabase Auth (Google OAuth
  provider). No email/password, no OTP. On first login (no matching
  `public.users` row yet), the app collects full name + mobile number
  before continuing; returning users skip straight in.
- **Payments**: Cash on delivery only — there are no payment fields or
  payment provider anywhere in this codebase. Don't add any.
- **Hosting**: Vercel

## Project structure

- `src/app` — routes (App Router)
- `src/components/ui` — shadcn/ui components
- `src/lib/supabase/client.ts` — browser Supabase client
- `src/lib/supabase/server.ts` — server Supabase client (Server Components/Actions)
- `src/lib/supabase/middleware.ts` — session-refresh helper used by `middleware.ts`
- `supabase/migrations/` — hand-written SQL migrations (see rule below)

## Database schema

Defined in [`supabase/migrations/20260915000000_init_schema.sql`](supabase/migrations/20260915000000_init_schema.sql),
[`supabase/migrations/20260915010000_add_user_role.sql`](supabase/migrations/20260915010000_add_user_role.sql),
[`supabase/migrations/20260915020000_google_oauth_and_ban.sql`](supabase/migrations/20260915020000_google_oauth_and_ban.sql),
[`supabase/migrations/20260915030000_ban_by_phone.sql`](supabase/migrations/20260915030000_ban_by_phone.sql),
[`supabase/migrations/20260915040000_drop_block_and_room.sql`](supabase/migrations/20260915040000_drop_block_and_room.sql),
[`supabase/migrations/20260915050000_place_order_function.sql`](supabase/migrations/20260915050000_place_order_function.sql),
[`supabase/migrations/20260915060000_seed_restaurants.sql`](supabase/migrations/20260915060000_seed_restaurants.sql)
(data only — the 3 real partner restaurants and their menus),
and [`supabase/migrations/20260915070000_guard_phone_changes.sql`](supabase/migrations/20260915070000_guard_phone_changes.sql).
Migrations are applied by hand in the Supabase SQL editor (no CLI setup).

All orders are handed over at **VIT-AP Main Gate** — there is no room
delivery, so no hostel block/room is stored anywhere (not on `users`, not
on `orders`).

- **`users`** — student profile, 1:1 with `auth.users` (same `id`, cascades
  on delete). `full_name` and `phone` are both `not null`; `phone` is
  **not unique** — multiple Google accounts can share a phone number
  (`email` stays `not null unique`, one row per Google account, just not
  one per phone). Stored as `+91XXXXXXXXXX` — the app normalizes every
  input to that one shape (`src/lib/phone.ts`), since bans match by exact
  phone. Also `registration_number`, `role` (`user_role` enum: `student` |
  `admin`, default `student`), `is_banned` (default `false` — admin sets this manually,
  e.g. for repeat no-shows). No `public.users` row is auto-created on
  OAuth sign-in — the app creates it itself, once, when the first-login
  form (full name + phone) is submitted; that's also how the app tells
  first-time vs. returning users apart (row exists or not).
- **`restaurants`** — `name`, `phone`, `description`, `cuisine_tags` (text
  array), `is_active`.
- **`dish_categories`** — menu sections scoped to a restaurant (e.g. "VEG
  STARTERS", "NON-VEG BIRYANI"), with `sort_order` for display.
- **`dishes`** — belongs to a restaurant and (optionally) a category;
  `price`, `is_veg`, `note` (freeform, e.g. "Thursday Only"), `is_available`.
- **`orders`** — `user_id`, `restaurant_id`, `status` (`order_status` enum:
  `pending → confirmed → preparing → out_for_delivery → delivered`, or
  `cancelled`), `contact_phone`, `notes`, `total_amount`. No payment fields — COD only.
- **`order_items`** — snapshots `dish_name` and `unit_price` at order time
  (quantity, generated `subtotal`), so later menu edits never rewrite past
  order history. `dish_id` is `on delete set null` for the same reason.

RLS is enabled on every table:
- `restaurants` / `dish_categories` / `dishes` are public-read (browsing the
  menu doesn't require login). Writes (insert/update/delete) are allowed
  for `role = 'admin'` users (via the `public.is_admin()` helper), gating
  menu/availability management.
- `users` / `orders` / `order_items` are scoped to `auth.uid()` — a student
  can only read their own profile, orders, and order items (and
  insert/update their own profile). Students **cannot insert into `orders`
  or `order_items` directly** — there are no insert policies for them.
  The only way to create an order is the `public.place_order(restaurant_id,
  items jsonb, contact_phone, notes)` function (security definer, callable
  by `authenticated` only): one transaction that checks auth, profile, ban,
  contact phone format, restaurant `is_active`, and every dish belonging to
  the restaurant and `is_available`; snapshots dish name/price from
  `dishes` (never from the client); leaves `status` at `pending`; and
  computes `total_amount` itself. It raises short error keys
  (`banned`, `restaurant_closed`, `dish_unavailable`, …) that
  `src/lib/orders/actions.ts` maps to messages. Admins
  can additionally update any `orders` row (e.g. changing `status`) — that
  policy covers the whole row, not just `status`, since Postgres RLS can't
  restrict to a single column without a trigger.
- Ban enforcement is by **phone number, not account**: `place_order()`
  calls `public.current_user_is_banned()`, which — despite the
  name — checks whether *any* `users` row sharing the calling account's
  phone number has `is_banned = true`, not just the calling account
  itself. This closes the loophole where a banned student just signs up
  again with a new Google login but the same phone number. Accepted
  tradeoff: two different students who happen to share a phone number
  (e.g. a shared hostel/family line) would both get blocked if either is
  banned — deliberately not scoped more precisely than that right now.
  The cart shows a friendly message when an order is refused for a ban.
- There is no admin login system: a user becomes an admin by manually
  setting their own `users.role` to `'admin'` in the database after signing
  up normally, and gets unbanned/banned the same manual way. A trigger
  (`prevent_role_self_escalation`, despite the name it now guards `role`,
  `is_banned`, **and `phone`**) blocks changes to those columns when made
  through the API (PostgREST), so the existing "update own profile" policy
  can't be used to self-promote, self-unban, or (for `phone`) dodge a ban
  or change the delivery contact mid-order — direct DB access (SQL editor,
  migrations) is unaffected and remains the only way around them.
  Specifically for `phone`: the trigger raises if the account is currently
  `is_banned` (permanent — bans match by live phone at order time, so
  letting a banned student change it would let them escape the ban
  outright) or if the student has any order not yet `delivered`/`cancelled`
  (temporary — the delivery contact number shouldn't change mid-order).
  The app enforces the same two rules up front in
  `src/app/profile/actions.ts` (for a friendly message instead of a raw
  DB error), but the trigger is the real boundary — `users` is reachable
  directly via PostgREST with a student's own access token, bypassing the
  app entirely.

Known TODOs (not yet decided, don't assume either way without asking):
restricting `users.email` to a VIT-AP domain; admins currently can't browse
other students' `users` rows (no policy for that).

## Hard rule: schema changes

**Never change the database schema without showing the SQL first**, in
chat, and getting explicit go-ahead — regardless of how small the change
looks. After approval, add a new timestamped file under
`supabase/migrations/` (never edit a migration that's already been applied)
and update the schema summary above to match.
