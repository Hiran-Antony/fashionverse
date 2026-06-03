-- ============================================================
-- FASHIONVERSE — Supabase Database Setup
-- Run this entire script in your Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================


-- ─── 1. PROFILES TABLE ───────────────────────────────────────
create table if not exists public.profiles (
  id           uuid references auth.users on delete cascade primary key,
  name         text,
  avatar_url   text,
  phone        text,
  role         text not null default 'customer' check (role in ('customer', 'admin')),
  loyalty_points integer not null default 0,
  created_at   timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);


-- ─── 2. AUTO-CREATE PROFILE ON SIGNUP ────────────────────────
-- This trigger fires every time a new user signs up (via Google or any provider).
-- It automatically pulls their name and avatar from Google and saves it to profiles.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do update
    set
      name       = coalesce(excluded.name, profiles.name),
      avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url);
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it already exists, then recreate
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─── 3. PRODUCTS TABLE ───────────────────────────────────────
create table if not exists public.products (
  id             uuid default gen_random_uuid() primary key,
  name           text not null,
  description    text,
  price          numeric(10,2) not null,
  original_price numeric(10,2),
  category       text not null check (category in ('men', 'women', 'kids', 'footwear', 'accessories')),
  brand          text,
  rating         numeric(3,2) default 0,
  review_count   integer default 0,
  is_featured    boolean default false,
  is_trending    boolean default false,
  is_active      boolean default true,
  tags           text[],
  created_at     timestamptz default now()
);

alter table public.products enable row level security;

create policy "Anyone can view active products"
  on public.products for select
  using (is_active = true);

create policy "Admins can manage products"
  on public.products for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ─── 4. PRODUCT COLORS TABLE ─────────────────────────────────
create table if not exists public.product_colors (
  id          uuid default gen_random_uuid() primary key,
  product_id  uuid references public.products on delete cascade not null,
  color_name  text not null,
  hex_code    text,
  image_url   text not null
);

alter table public.product_colors enable row level security;

create policy "Anyone can view product colors"
  on public.product_colors for select using (true);

create policy "Admins can manage product colors"
  on public.product_colors for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ─── 5. PRODUCT SIZES TABLE ──────────────────────────────────
create table if not exists public.product_sizes (
  id              uuid default gen_random_uuid() primary key,
  product_id      uuid references public.products on delete cascade not null,
  size            text not null,
  stock           integer default 0,
  is_out_of_stock boolean default false
);

alter table public.product_sizes enable row level security;

create policy "Anyone can view product sizes"
  on public.product_sizes for select using (true);

create policy "Admins can manage product sizes"
  on public.product_sizes for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ─── 6. ORDERS TABLE ─────────────────────────────────────────
create table if not exists public.orders (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references public.profiles on delete cascade not null,
  status          text not null default 'pending' check (status in ('pending','packed','shipped','delivered','cancelled')),
  total_amount    numeric(10,2) not null,
  address         jsonb not null,
  payment_method  text not null,
  coupon_code     text,
  discount_amount numeric(10,2) default 0,
  created_at      timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can create orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Admins can manage all orders"
  on public.orders for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- ─── 7. ORDER ITEMS TABLE ────────────────────────────────────
create table if not exists public.order_items (
  id          uuid default gen_random_uuid() primary key,
  order_id    uuid references public.orders on delete cascade not null,
  product_id  uuid references public.products not null,
  color_name  text not null,
  size        text not null,
  quantity    integer not null,
  price       numeric(10,2) not null
);

alter table public.order_items enable row level security;

create policy "Users can view own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id and orders.user_id = auth.uid()
    )
  );


-- ─── 8. REVIEWS TABLE ────────────────────────────────────────
create table if not exists public.reviews (
  id          uuid default gen_random_uuid() primary key,
  product_id  uuid references public.products on delete cascade not null,
  user_id     uuid references public.profiles on delete cascade not null,
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  images      text[],
  created_at  timestamptz default now(),
  unique(product_id, user_id)
);

alter table public.reviews enable row level security;

create policy "Anyone can view reviews"
  on public.reviews for select using (true);

create policy "Logged in users can write reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reviews"
  on public.reviews for update
  using (auth.uid() = user_id);


-- ─── DONE ─────────────────────────────────────────────────────
-- All tables, policies, and triggers are set up.
-- Your Google Login will now automatically create a profile
-- for every new user with their real name and photo.
