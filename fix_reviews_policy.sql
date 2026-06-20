-- Fix the insert policy so it properly checks the user's purchased products
drop policy if exists "Only buyers can write reviews" on public.reviews;

create policy "Only buyers can write reviews"
  on public.reviews for insert
  with check (
    auth.uid() = user_id 
    and product_id in (
      select oi.product_id from public.orders o
      join public.order_items oi on o.id = oi.order_id
      where o.user_id = auth.uid() 
      and o.status in ('delivered', 'shipped', 'out_for_delivery')
    )
  );

-- Ensure everyone can view reviews
drop policy if exists "Anyone can read reviews" on public.reviews;

create policy "Anyone can read reviews"
  on public.reviews for select
  using (true);
