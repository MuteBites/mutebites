-- The live `users` table drifted from every migration in this directory:
-- the `role` column (added in 20260915010000_add_user_role.sql) ended up
-- renamed to `student` at some point via the Supabase Table Editor UI,
-- not through any file here. Every migration, the app code (profile.ts,
-- is_admin(), the self-escalation trigger), and this file all expect the
-- column to be named `role` — this restores that. Confirmed fixed live
-- before this file was added.

alter table public.users rename column student to role;
