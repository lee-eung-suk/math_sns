-- Supabase Setup Script for EduFeed (tools platform)

-- 1. Create 'tools' table
create table public.tools (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  url text not null,
  thumbnail text,
  grades text[] not null default '{}',
  categories text[] not null default '{}',
  view_count integer default 0,
  like_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create 'views' table to track unique views (prevent duplicate increments)
create table public.views (
  id uuid default gen_random_uuid() primary key,
  tool_id uuid references public.tools(id) on delete cascade not null,
  viewer_ip text,
  viewed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(tool_id, viewer_ip)
);

-- 3. Create 'likes' table
create table public.likes (
  id uuid default gen_random_uuid() primary key,
  tool_id uuid references public.tools(id) on delete cascade not null,
  user_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(tool_id, user_id)
);

-- 4. Enable RLS (Row Level Security)
alter table public.tools enable row level security;
alter table public.views enable row level security;
alter table public.likes enable row level security;

-- For demo purposes, we will allow anonymous access to read and write.
-- In a real production app, configure Auth properly.
create policy "Allow public read access on tools" on public.tools for select using (true);
create policy "Allow public insert on tools" on public.tools for insert with check (true);
create policy "Allow public update on tools" on public.tools for update using (true);

create policy "Allow public read access on views" on public.views for select using (true);
create policy "Allow public insert on views" on public.views for insert with check (true);

create policy "Allow public read access on likes" on public.likes for select using (true);
create policy "Allow public insert on likes" on public.likes for insert with check (true);
create policy "Allow public delete on likes" on public.likes for delete using (true);

-- 5. Enable Realtime on 'tools' for view_count and like_count updates
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.tools;

-- 6. Setup Storage for thumbnails
insert into storage.buckets (id, name, public) values ('thumbnails', 'thumbnails', true)
on conflict (id) do nothing;

create policy "Cover thumbnail upload"
on storage.objects for insert
with check ( bucket_id = 'thumbnails' );

create policy "Cover thumbnail select"
on storage.objects for select
using ( bucket_id = 'thumbnails' );
