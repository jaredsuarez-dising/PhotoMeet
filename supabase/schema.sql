-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create users table
create table users (
    id uuid primary key references auth.users(id),
    name varchar(100),
    email varchar(100)
);

-- Create events table
create table events (
    id serial primary key,
    title varchar(100) not null,
    description text,
    date date not null,
    location varchar(100),
    image_url varchar(200),
    user_id uuid references users(id)
);

-- Create comments table
create table comments (
    id serial primary key,
    event_id integer references events(id),
    user_id uuid references users(id),
    comment text
);

-- Basic RLS policies
alter table public.users enable row level security;
alter table public.events enable row level security;
alter table public.comments enable row level security;

-- Simple policies
create policy "Anyone can view everything"
    on public.users for select using (true);
create policy "Anyone can view everything"
    on public.events for select using (true);
create policy "Anyone can view everything"
    on public.comments for select using (true);

create policy "Authenticated users can create everything"
    on public.events for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can create everything"
    on public.comments for insert with check (auth.role() = 'authenticated');

-- Allow users to insert their own profile
create policy "Users can insert their own profile"
    on public.users for insert
    with check (auth.uid() = id);

-- Simple trigger for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.users (id, email)
    values (new.id, new.email);
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();