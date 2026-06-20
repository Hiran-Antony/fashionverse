-- ─── 1. COUPONS TABLE ──────────────────────────────────────────
create table if not exists public.coupons (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  discount_percent integer,
  discount_amount integer,
  min_order integer,
  max_uses integer,
  used_count integer default 0 not null,
  expires_at timestamptz,
  created_at timestamptz default now()
);

alter table public.coupons enable row level security;

-- Anyone can view valid coupons (to check if they exist when applying)
drop policy if exists "Anyone can view coupons" on public.coupons;
create policy "Anyone can view coupons"
  on public.coupons for select using (true);

-- Only admins can manage coupons
drop policy if exists "Admins can manage coupons" on public.coupons;
create policy "Admins can manage coupons"
  on public.coupons for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ─── 2. REVIEWS TABLE RLS ─────────────────────────────────────
-- Drop the old policy that allowed any logged-in user to write a review
drop policy if exists "Logged in users can write reviews" on public.reviews;

-- Create a new policy: Only users who have purchased the item can review
drop policy if exists "Only buyers can write reviews" on public.reviews;
create policy "Only buyers can write reviews"
  on public.reviews for insert
  with check (
    auth.uid() = user_id 
    and exists (
      select 1 from public.orders o
      join public.order_items oi on o.id = oi.order_id
      where o.user_id = auth.uid() 
      and oi.product_id = public.reviews.product_id
      and o.status in ('delivered', 'shipped', 'out_for_delivery')
    )
  );

-- ─── 3. PRODUCT RATING TRIGGER ─────────────────────────────────
-- Function to update product rating and review count
create or replace function public.update_product_rating()
returns trigger as $$
begin
  if (TG_OP = 'INSERT' or TG_OP = 'UPDATE') then
    update public.products
    set 
      rating = (select coalesce(avg(rating), 0) from public.reviews where product_id = NEW.product_id),
      review_count = (select count(*) from public.reviews where product_id = NEW.product_id)
    where id = NEW.product_id;
    return NEW;
  elsif (TG_OP = 'DELETE') then
    update public.products
    set 
      rating = (select coalesce(avg(rating), 0) from public.reviews where product_id = OLD.product_id),
      review_count = (select count(*) from public.reviews where product_id = OLD.product_id)
    where id = OLD.product_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql;

-- Drop trigger if exists
drop trigger if exists update_product_rating_trigger on public.reviews;

-- Create trigger
create trigger update_product_rating_trigger
after insert or update or delete on public.reviews
for each row execute function public.update_product_rating();

-- ─── 4. INCREMENT COUPON USAGE RPC ────────────────────────────
create or replace function public.increment_coupon_usage(p_code text)
returns void as $$
begin
  update public.coupons
  set used_count = used_count + 1
  where code = p_code;
end;
$$ language plpgsql security definer;
