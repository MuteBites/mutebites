-- Admin photo uploads for dishes and restaurant covers (17 Oct 2026).
-- An uploaded photo wins over the name-matched files in public/MuteBites/
-- (src/lib/data/dish-photos.ts); null = fall back to those. Each upload
-- gets a new file name (id + timestamp) so no cache serves an old one.

-- 1. Where each uploaded photo lives (null = fall back to the name-matched file).
alter table public.dishes
  add column photo_path text
    check (photo_path ~ '^dishes/[0-9a-f-]{36}-[0-9]{10,13}\.webp$');
alter table public.restaurants
  add column cover_path text
    check (cover_path ~ '^covers/[0-9a-f-]{36}-[0-9]{10,13}\.webp$');

-- 2. A public bucket for menu photos: anyone can view, 2 MB cap, images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-photos', 'menu-photos', true, 2097152,
        array['image/webp', 'image/jpeg', 'image/png']);

-- 3. Only admins can upload, replace or delete files in it.
--    Viewing needs no policy: a public bucket serves files by URL.
create policy "Admins can upload menu photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'menu-photos' and (select public.is_admin()));

create policy "Admins can replace menu photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'menu-photos' and (select public.is_admin()))
  with check (bucket_id = 'menu-photos' and (select public.is_admin()));

create policy "Admins can delete menu photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'menu-photos' and (select public.is_admin()));
