create extension if not exists "uuid-ossp";

create table users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  created_at timestamp with time zone default now()
);

create table posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  mood text not null,
  video_id text not null,
  video_title text not null,
  video_url text not null,
  created_at timestamp with time zone default now()
);

create table likes (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique (post_id, user_id)
)

alter table users enable row level security;

create policy "Users can read own profile"
on users
for select
using (auth.uid() = id);

create policy "Users can insert own profile"
on users
for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.users
for update
using (auth.uid() = id);

alter table posts enable row level security;

create policy "Anyone can read posts"
on posts
for select
using (true);

create policy "Authenticated users can insert posts"
on posts
for insert
with check (auth.role() = 'authenticated');

alter table likes enable row level security;

create policy "Anyone can read likes"
on likes
for select
using (true);

create policy "Authenticated users can like"
on likes
for insert
with check (auth.role() = 'authenticated');

create policy "User can unlike own like"
on likes
for delete
using (auth.uid() = user_id);
