-- 1. Create 'tools' table for storing classroom tools
create table public.tools (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  url text not null,
  thumbnail text, -- Generated thumbnail URL (can be base64 data URL or storage link)
  grades text[] not null default '{}',
  categories text[] not null default '{}',
  view_count integer default 0,
  like_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table public.tools enable row level security;

-- 3. Create public access policies
create policy "Allow public read" on public.tools for select using (true);
create policy "Allow public insert" on public.tools for insert with check (true);
create policy "Allow public update" on public.tools for update using (true);

-- 4. Enable Realtime (optional, for live view/like updates)
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.tools;

-- 5. Setup Storage for thumbnails (Optional)
-- Run this if you want to store images in Supabase Storage instead of as text
-- Note: 'thumbnails' bucket must be created in Supabase Dashboard -> Storage
/*
create policy "Public access to thumbnails"
on storage.objects for select
using ( bucket_id = 'thumbnails' );

create policy "Public upload to thumbnails"
on storage.objects for insert
with check ( bucket_id = 'thumbnails' );
*/
