-- Supabase Setup Script for EduFeed

-- 1. Create 'posts' table
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text,
  url text not null,
  domains text[] not null default '{}',
  grades text[] not null default '{}',
  thumbnail_url text,
  author_id uuid references auth.users(id),
  view_count integer default 0,
  like_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create 'views' table to track unique views (prevent duplicate increments)
create table public.views (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  viewer_ip text,
  viewed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, viewer_ip)
);

-- 3. Create 'likes' table
create table public.likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, user_id)
);

-- 4. Enable RLS (Row Level Security)
alter table public.posts enable row level security;
alter table public.views enable row level security;
alter table public.likes enable row level security;

-- For demo purposes, we will allow anonymous access to read and write.
-- In a real production app, configure Auth properly.
create policy "Allow public read access on posts" on public.posts for select using (true);
create policy "Allow public insert on posts" on public.posts for insert with check (true);
create policy "Allow public update on posts" on public.posts for update using (true);

create policy "Allow public read access on views" on public.views for select using (true);
create policy "Allow public insert on views" on public.views for insert with check (true);

create policy "Allow public read access on likes" on public.likes for select using (true);
create policy "Allow public insert on likes" on public.likes for insert with check (true);
create policy "Allow public delete on likes" on public.likes for delete using (true);

-- 5. Enable Realtime on 'posts' for view_count and like_count updates
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.posts;

-- 6. Setup Storage for thumbnails
insert into storage.buckets (id, name, public) values ('thumbnails', 'thumbnails', true);

create policy "Cover thumbnail upload"
on storage.objects for insert
with check ( bucket_id = 'thumbnails' );

create policy "Cover thumbnail select"
on storage.objects for select
using ( bucket_id = 'thumbnails' );
