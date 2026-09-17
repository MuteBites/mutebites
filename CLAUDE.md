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
  payment provider anywhere in this codebase. Don't add any. The "About
  MuteBites" popup (see below) also mentions UPI as accepted at pickup —
  that's real, but purely physical, an informal option between the runner
  and student handled entirely outside the app, the same as cash; it's
  not tracked, processed, or reconciled by anything here, so it doesn't
  contradict the rule above. Don't build actual UPI integration (a QR
  code, a payment record, verification) without this being revisited
  first — that would be a real payment provider, which this app
  deliberately doesn't have.
- **Hosting**: Vercel. `vercel.json` pins the serverless function region to
  `bom1` (Mumbai) to match the Supabase project's `ap-south-1` region —
  found (2026-09-17) that Vercel's default function region is US-East,
  so every DB/auth call was crossing from Virginia to Mumbai and back on
  every request, which was the actual cause of slow page loads (far
  bigger than the redundant `auth.getUser()` call fixed alongside it in
  `src/lib/profile.ts`). If Supabase's region ever changes, update this
  to match.

## Admin access

`/admin` has two layers, both required, neither optional:
1. `requireAdmin()` (`src/lib/admin/guard.ts`) — signed in via Google, and
   `users.role = 'admin'` (see Database schema below for how that's set).
2. A separate passcode, checked in `src/app/admin/layout.tsx` after (1)
   passes. The passcode lives only in the `ADMIN_PASSCODE` env var —
   never hardcoded, never committed. Entering it right sets an httpOnly,
   `/admin`-scoped session cookie (`src/lib/admin/passcode.ts` /
   `passcode-actions.ts`); no `ADMIN_PASSCODE` set means the gate **fails
   closed** — nobody gets in, admin role or not — rather than silently
   letting everyone through.

The main `/admin` dashboard's order list only ever shows **today's**
orders (IST calendar day) — the stat cards at the top are scoped the same
way (`getOrderCounts(startOfTodayIST())`). Every order ever placed lives
at `/admin/history` instead, grouped by day (newest first), reusing the
same `OrderList` component in a `groupByDate` mode rather than a separate
one-off component. Banned Users management similarly lives on its own
page, `/admin/banned`, reached via a button next to "Order history" —
not inline on the main dashboard.

## Project structure

- `src/app` — routes (App Router)
- `src/app/privacy`, `src/app/terms` — static, unauthenticated pages
  required for the Google OAuth consent-screen review. Listed in
  `PUBLIC_PATHS` (`src/lib/supabase/middleware.ts`) alongside `/login` and
  `/auth` so `src/proxy.ts` doesn't bounce a signed-out visitor — or
  Google's review bot — to `/login` before they can load them.
- `src/app/(home)/page.tsx` — the `/` route. It lives in a `(home)` route
  group (the parens don't affect the URL) specifically so its
  `loading.tsx` stays scoped to just `/`. A `loading.tsx` placed directly
  in `src/app` would become the fallback for *every* route that doesn't
  have its own — including `/login`, `/admin`, etc. — since the app root
  is an ancestor of all of them. Don't move `page.tsx` back out to
  `src/app` without either dropping its `loading.tsx` or being fine with
  that.
- `src/components/ui` — shadcn/ui components. Two modal-style primitives:
  `alert-dialog.tsx` (confirmations — "Cancel this order?", "Turn off
  ordering?") and `dialog.tsx` (plain popups with no confirm/cancel
  semantics — currently just the "About MuteBites" card from the Home
  logo). Both wrap `@base-ui/react`; reach for whichever already matches
  what you're building rather than hand-rolling a third.
- `src/lib/supabase/client.ts` — browser Supabase client
- `src/lib/supabase/server.ts` — server Supabase client (Server Components/Actions)
- `src/lib/supabase/middleware.ts` — session-refresh helper used by
  `src/proxy.ts` — this Next.js version renamed `middleware.ts`/
  `middleware()` to `proxy.ts`/`proxy()`; same route-matcher config,
  different filename and export name.
- `supabase/migrations/` — hand-written SQL migrations (see rule below)
- `public/MuteBites/` — restaurant/dish photos, one subfolder per restaurant
  (plus `covers/` for the hero banners) — matched to database rows by name
  in `src/lib/data/dish-photos.ts`, deliberately **not** a database column
  (no schema change needed to add or swap a photo). `getRestaurantCoverPhoto()`
  and `getDishPhoto()` look up by exact restaurant/dish name; anything
  without a confident match — a dish with no distinct photo, a restaurant
  with no cover yet — falls back to the existing flat placeholder
  (`bg-stripes`) rather than showing a mismatched image. Cover photo
  filenames carry a `-v2`-style suffix when replaced after the first
  publish — an intermediate cache (outside this app, never fully
  identified) kept re-serving an old file by its original URL even after
  verified-fresh server responses and full dev-server restarts, so a
  changed cover photo should get a new filename, not overwrite the old one
  in place, to guarantee cache-safety.

`loading.tsx` exists for the restaurant list (`(home)`), the menu page
(`restaurants/[id]`), both order pages (`orders`, `orders/[id]`), and
`profile` — plain skeletons built from `src/components/ui/skeleton.tsx`,
roughly mirroring each page's real layout so nothing visibly jumps.

## Database schema

Defined in [`supabase/migrations/20260915000000_init_schema.sql`](supabase/migrations/20260915000000_init_schema.sql),
[`supabase/migrations/20260915010000_add_user_role.sql`](supabase/migrations/20260915010000_add_user_role.sql),
[`supabase/migrations/20260915020000_google_oauth_and_ban.sql`](supabase/migrations/20260915020000_google_oauth_and_ban.sql),
[`supabase/migrations/20260915030000_ban_by_phone.sql`](supabase/migrations/20260915030000_ban_by_phone.sql),
[`supabase/migrations/20260915040000_drop_block_and_room.sql`](supabase/migrations/20260915040000_drop_block_and_room.sql),
[`supabase/migrations/20260915050000_place_order_function.sql`](supabase/migrations/20260915050000_place_order_function.sql),
[`supabase/migrations/20260915060000_seed_restaurants.sql`](supabase/migrations/20260915060000_seed_restaurants.sql)
(data only — the 3 real partner restaurants and their menus),
[`supabase/migrations/20260915070000_guard_phone_changes.sql`](supabase/migrations/20260915070000_guard_phone_changes.sql),
[`supabase/migrations/20260915080000_admin_dashboard.sql`](supabase/migrations/20260915080000_admin_dashboard.sql),
[`supabase/migrations/20260915090000_fix_users_role_column_rename.sql`](supabase/migrations/20260915090000_fix_users_role_column_rename.sql)
(fixes a live drift — the `role` column got renamed to `student` by
accident via the Table Editor UI, not through any migration — back to
match every migration and the app code),
[`supabase/migrations/20260915100000_admin_users_and_ban.sql`](supabase/migrations/20260915100000_admin_users_and_ban.sql),
[`supabase/migrations/20260915110000_reapply_place_order_ordering_check.sql`](supabase/migrations/20260915110000_reapply_place_order_ordering_check.sql)
(re-applies `place_order()` unchanged — the `ordering_enabled` check from
`080000` likely never actually went live, probably split off into its own
SQL editor tab and skipped when that migration was applied by hand),
[`supabase/migrations/20260915120000_banned_at.sql`](supabase/migrations/20260915120000_banned_at.sql),
[`supabase/migrations/20260915130000_enable_realtime_orders.sql`](supabase/migrations/20260915130000_enable_realtime_orders.sql)
(adds `orders` to the `supabase_realtime` publication —
`src/components/orders/order-tracking.tsx`, a client component, subscribes
to its own order's row for live status updates on top of the normal
server-fetched page; existing RLS still governs who can actually receive
them, and a plain page refresh still shows the true status either way),
[`supabase/migrations/20260915140000_seed_new_restaurants.sql`](supabase/migrations/20260915140000_seed_new_restaurants.sql)
(data only — two more partner restaurants, **MuteBites Chinese** (5
categories, 24 dishes) and **MuteBites Fresh Fruits** (1 category, 13
dishes, priced per 500 g/1 kg pack), bringing the total to 5 restaurants),
[`supabase/migrations/20260915150000_daily_order_numbers.sql`](supabase/migrations/20260915150000_daily_order_numbers.sql)
(adds `orders.daily_number` — see below),
[`supabase/migrations/20260916000000_trending_leaderboard.sql`](supabase/migrations/20260916000000_trending_leaderboard.sql)
(adds `trending_dishes()` / `trending_restaurants()` — see below),
[`supabase/migrations/20260917000000_my_weekly_rank.sql`](supabase/migrations/20260917000000_my_weekly_rank.sql)
(adds `my_weekly_rank()` — see below),
and [`supabase/migrations/20260917010000_drop_unused_trending_restaurants.sql`](supabase/migrations/20260917010000_drop_unused_trending_restaurants.sql)
(drops `trending_restaurants()` again — never called by the app).
Migrations are applied by hand in the Supabase SQL editor (no CLI setup).

All orders are handed over at **VIT-AP Main Gate** — there is no room
delivery, so no hostel block/room is stored anywhere (not on `users`, not
on `orders`).

- **`users`** — student profile, 1:1 with `auth.users` (same `id`, cascades
  on delete). `full_name` and `phone` are both `not null`; `phone` is
  **not unique** — multiple Google accounts can share a phone number
  (`email` stays `not null unique`, one row per Google account, just not
  one per phone). No domain restriction on `email` — decided: any Google
  account can sign up, not only VIT-AP student addresses. Stored
  as `+91XXXXXXXXXX` — the app normalizes every
  input to that one shape (`src/lib/phone.ts`), since bans match by exact
  phone. Also `registration_number`, `role` (`user_role` enum: `student` |
  `admin`, default `student`), `is_banned` (default `false` — an admin
  flips this from the admin `/admin/banned` page, e.g. for
  repeat no-shows; `role` itself is still only ever changed by hand in the
  database, never through the app), `banned_at` (nullable timestamptz, kept
  correct by the `set_banned_at` trigger — set to `now()` whenever
  `is_banned` flips true, cleared back to `null` when it flips false again,
  regardless of whether the change came through the app or the SQL editor).
  No `public.users` row is auto-created on
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
  The admin dashboard only ever drives two of those transitions directly —
  `pending → confirmed` and `confirmed → delivered` (`preparing` /
  `out_for_delivery` stay valid enum values but nothing in the app sets
  them; delivery timing runs on fixed ETA slots, not admin clicks) — plus
  a side-path to `cancelled` from any non-terminal status, each one
  compare-and-swapped on the status the admin's screen showed, so a stale
  screen or two admins clicking at once can't skip a step or act on a
  status that's already changed. Also `daily_number` (`not null int`) —
  the order's position that IST calendar day, campus-wide across every
  restaurant, starting over at 1 each day — this is the "token"/order
  number shown to both the student (pickup) and the admin (order list),
  so the two must always agree. Assigned once, atomically, by the
  `set_daily_order_number` trigger (`before insert on orders`) via the
  `daily_order_counters` table below — never derived by counting/ranking
  on read, so concurrent orders in the same second can't collide or show
  differently to student vs. admin. `orderReference()` (the old
  hash-of-uuid cosmetic token, e.g. "#4F2A") is gone; every display now
  reads `daily_number` directly.
- **`daily_order_counters`** — `order_day` (date, primary key), `last_number`.
  One row per day, upserted by the trigger above (`on conflict (order_day)
  do update set last_number = last_number + 1 returning ... into
  new.daily_number`) — the atomic counter that makes `daily_number`
  race-free. The app never reads or writes this table directly; RLS is
  enabled with no policies (locks it out entirely), and the trigger's
  writes succeed anyway since they run inside `place_order()`'s
  security-definer context, the same way `place_order()` itself writes to
  `orders`/`order_items` without student-facing insert policies.
- **`order_items`** — snapshots `dish_name` and `unit_price` at order time
  (quantity, generated `subtotal`), so later menu edits never rewrite past
  order history. `dish_id` is `on delete set null` for the same reason.
- **`app_settings`** — single-row table (`id boolean primary key default
  true check (id)` caps it at one row) holding `ordering_enabled`, the
  campus-wide kill switch the admin dashboard flips. Public-read (the
  student app needs to know ordering is paused), admin-only update.

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
  computes `total_amount` itself. It also checks `app_settings.ordering_enabled`
  before anything else (raising `ordering_paused` if the admin kill switch
  is off) — enforced in the function itself, not just hidden in the UI,
  since a direct PostgREST call would otherwise bypass an app-level check.
  It raises short error keys
  (`banned`, `restaurant_closed`, `dish_unavailable`, `ordering_paused`, …) that
  `src/lib/orders/actions.ts` maps to messages. Admins
  can additionally update any `orders` row (e.g. changing `status`) and read
  every `orders` row, every `users` row, and every `order_items` row (not
  just their own — needed for the admin dashboard's order list, stat
  counts, and showing who placed each order) — the orders update policy
  covers the whole row, not just `status`, since Postgres RLS can't
  restrict to a single column without a trigger. Admins can also update
  any `users` row (needed for the ban toggle — see below).
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
  up normally — `role` stays changeable only that way, never through the
  API, admin included. `is_banned` **can** now be changed through the API,
  but only by an admin (the `/admin/banned` page — search a
  student to ban them, or unban from the banned list — on any student's
  row; a student still can't touch their own `is_banned`). A trigger
  (`prevent_role_self_escalation`, despite the name it now guards `role`,
  `is_banned`, **and `phone`**) enforces both: it blocks any API change to
  `role` outright, and blocks an API change to `is_banned` unless the
  caller is an admin (`public.is_admin()`) — so the existing "update own
  profile" policy can't be used to self-promote or self-unban, and the new
  "admins can update any user" policy can't be used by a student (it only
  grants anything to `role = 'admin'` callers to begin with). For `phone`,
  the trigger still blocks the change outright via the API regardless of
  admin status — direct DB access (SQL editor, migrations) is unaffected
  and remains the only way around any of these.
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

- **`trending_dishes(days_back int default 7, result_limit int default 5)`**
  — security definer, callable by `authenticated` only, same pattern as
  `place_order()`. Powers Home's "Trending this week" popup
  (`src/components/home/trending-dialog.tsx`, opened from a flame button in
  `home-header.tsx` — same trigger/dialog pattern as the logo's "About
  MuteBites" popup): top ordered dishes campus-wide over a rolling window
  (`orders.status <> 'cancelled'`, restaurant `is_active`, dish
  `is_available`). Needed because students can only read their *own*
  orders/order_items under RLS — there's no other way to compute a
  cross-student aggregate. Returns only aggregate counts (dish/restaurant
  name + a number), never anything per-student, so nothing here leaks who
  ordered what.

`trending_restaurants(days_back int default 7, result_limit int default 3)`
was added in the same migration (same pattern) for a "Top restaurants"
leaderboard that got removed from the UI before shipping, then dropped in
[`20260917010000_drop_unused_trending_restaurants.sql`](supabase/migrations/20260917010000_drop_unused_trending_restaurants.sql)
once confirmed unused — it no longer exists in the database.

- **`my_weekly_rank(days_back int default 7)`** — security definer,
  callable by `authenticated` only. Returns only the *calling* student's
  own row (`where user_id = auth.uid()` inside the function) — order
  count, rank, and percentile among everyone who ordered in the window —
  never other students' counts or identities, unlike `trending_dishes()`
  above which returns aggregate-only data with no user scoping at all.
  Powers the profile's "Top N%" badge
  (`src/components/profile/weekly-rank-badge.tsx`), shown only when
  `percentile <= 50` and at least 5 students participated that week — a
  UI-only choice (not a security one) so the badge stays flattering and
  the percentile stays statistically meaningful, not a database
  restriction.

No other open schema TODOs right now.

## Hard rule: schema changes

**Never change the database schema without showing the SQL first**, in
chat, and getting explicit go-ahead — regardless of how small the change
looks. After approval, add a new timestamped file under
`supabase/migrations/` (never edit a migration that's already been applied)
and update the schema summary above to match.
