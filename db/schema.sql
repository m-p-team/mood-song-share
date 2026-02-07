-- 初期
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

-- スキーマ分離
create schema if not exists dev;
create schema if not exists prod;

create table dev.posts
as table public.posts;

create table dev.likes
as table public.likes;

create table dev.users
as table public.users;

create table prod.posts
as table dev.posts;

create table prod.likes
as table dev.likes;

create table prod.users
as table dev.users;

alter table dev.users
add primary key (id);

alter table prod.users
add primary key (id);

alter table dev.users
alter column id set default uuid_generate_v4(),
alter column created_at set default now();

alter table prod.users
alter column id set default uuid_generate_v4(),
alter column created_at set default now();

alter table dev.posts
add primary key (id);

alter table prod.posts
add primary key (id);

alter table dev.posts
add constraint posts_user_id_fkey
foreign key (user_id) references dev.users(id) on delete cascade;

alter table prod.posts
add constraint posts_user_id_fkey
foreign key (user_id) references prod.users(id) on delete cascade;

alter table dev.posts
alter column id set default uuid_generate_v4(),
alter column created_at set default now();

alter table prod.posts
alter column id set default uuid_generate_v4(),
alter column created_at set default now();

alter table dev.likes
add primary key (id);

alter table prod.likes
add primary key (id);

-- dev
alter table dev.likes
add constraint likes_post_id_fkey
foreign key (post_id) references dev.posts(id) on delete cascade;

alter table dev.likes
add constraint likes_user_id_fkey
foreign key (user_id) references dev.users(id) on delete cascade;

-- prod
alter table prod.likes
add constraint likes_post_id_fkey
foreign key (post_id) references prod.posts(id) on delete cascade;

alter table prod.likes
add constraint likes_user_id_fkey
foreign key (user_id) references prod.users(id) on delete cascade;

alter table dev.likes
add constraint likes_unique_user_post
unique (post_id, user_id);

alter table prod.likes
add constraint likes_unique_user_post
unique (post_id, user_id);

alter table dev.users enable row level security;
alter table prod.users enable row level security;

alter table dev.posts enable row level security;
alter table prod.posts enable row level security;

alter table dev.likes enable row level security;
alter table prod.likes enable row level security;

-- dev
create policy "Users can read own profile"
on dev.users
for select
using (auth.uid() = id);

create policy "Users can insert own profile"
on dev.users
for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on dev.users
for update
using (auth.uid() = id);

create policy "Anyone can read posts"
on dev.posts
for select
using (true);

create policy "Authenticated users can insert posts"
on dev.posts
for insert
with check (auth.role() = 'authenticated');

create policy "Anyone can read likes"
on dev.likes
for select
using (true);

create policy "Authenticated users can like"
on dev.likes
for insert
with check (auth.role() = 'authenticated');

create policy "User can unlike own like"
on dev.likes
for delete
using (auth.uid() = user_id);

-- prod
create policy "Users can read own profile"
on prod.users
for select
using (auth.uid() = id);

create policy "Users can insert own profile"
on prod.users
for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on prod.users
for update
using (auth.uid() = id);

create policy "Anyone can read posts"
on prod.posts
for select
using (true);

create policy "Authenticated users can insert posts"
on prod.posts
for insert
with check (auth.role() = 'authenticated');

create policy "Anyone can read likes"
on prod.likes
for select
using (true);

create policy "Authenticated users can like"
on prod.likes
for insert
with check (auth.role() = 'authenticated');

create policy "User can unlike own like"
on prod.likes
for delete
using (auth.uid() = user_id);

grant usage on schema dev to anon, authenticated;
grant usage on schema prod to anon, authenticated;

-- dev
grant select, insert, update, delete
on all tables in schema dev
to anon, authenticated;

-- prod
grant select, insert, update, delete
on all tables in schema prod
to anon, authenticated;

alter default privileges in schema dev
grant select, insert, update, delete
on tables
to anon, authenticated;

alter default privileges in schema prod
grant select, insert, update, delete
on tables
to anon, authenticated;

-- dev
create policy "Users can delete own posts"
on dev.posts
for delete
using (auth.uid() = user_id);

-- prod
create policy "Users can delete own posts"
on prod.posts
for delete
using (auth.uid() = user_id);
