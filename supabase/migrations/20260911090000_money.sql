-- =====================================================================
-- Money per car
--
--   * vehicle_expenses: transport, labour, repairs … spent on a car.
--     Owners only, like sales.
--   * sale_items.list_price_at_sale: the asking price when a part sold,
--     so discounts stay visible even if the part is re-priced later.
--   * undo_sale(): owners reverse a sale recorded by mistake.
-- =====================================================================

create table public.vehicle_expenses (
  id          uuid primary key default gen_random_uuid(),
  vehicle_id  uuid not null references public.vehicles (id) on delete cascade,
  category    text not null check (category in ('transport', 'labour', 'repairs', 'other')),
  description text check (char_length(description) <= 120),
  amount      numeric(10, 2) not null check (amount > 0),
  spent_on    date not null default current_date,
  added_by    uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index vehicle_expenses_vehicle_id_idx on public.vehicle_expenses (vehicle_id, spent_on);
create index vehicle_expenses_added_by_idx on public.vehicle_expenses (added_by);

revoke all on public.vehicle_expenses from anon, authenticated;
grant select, delete on public.vehicle_expenses to authenticated;
grant insert (vehicle_id, category, description, amount, spent_on) on public.vehicle_expenses to authenticated;

alter table public.vehicle_expenses enable row level security;

create policy "Owners read expenses" on public.vehicle_expenses
  for select to authenticated using ((select private.is_owner()));
create policy "Owners add expenses" on public.vehicle_expenses
  for insert to authenticated with check ((select private.is_owner()) and added_by = (select auth.uid()));
create policy "Owners remove expenses" on public.vehicle_expenses
  for delete to authenticated using ((select private.is_owner()));

alter table public.sale_items
  add column list_price_at_sale numeric(10, 2) check (list_price_at_sale >= 0);

-- Same as before, and now also freezes the asking price on each line.
create or replace function public.complete_sale(
  items jsonb,
  customer_name text default null,
  customer_phone text default null,
  notes text default null
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  new_sale_id uuid;
  sale_total numeric(12, 2);
begin
  if not private.is_member() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items) = 0 then
    raise exception 'A sale needs at least one part' using errcode = '22023';
  end if;

  if exists (
    select 1 from jsonb_array_elements(items) line
    where line ->> 'part_id' is null
       or line ->> 'price' is null
       or (line ->> 'price')::numeric < 0
       or coalesce((line ->> 'quantity')::integer, 1) < 1
  ) then
    raise exception 'Each line needs a part, a price and a quantity of at least 1' using errcode = '22023';
  end if;

  if jsonb_array_length(items) <> (
    select count(distinct line ->> 'part_id') from jsonb_array_elements(items) line
  ) then
    raise exception 'Each part can only appear once in a sale' using errcode = '22023';
  end if;

  perform 1 from public.parts
  where id in (select (line ->> 'part_id')::uuid from jsonb_array_elements(items) line)
  for update;

  if exists (
    select 1 from jsonb_array_elements(items) line
    left join public.parts p on p.id = (line ->> 'part_id')::uuid
    where p.id is null
       or p.status not in ('in_stock', 'reserved')
       or p.quantity < coalesce((line ->> 'quantity')::integer, 1)
  ) then
    raise exception 'This part is no longer available.' using errcode = 'P0001';
  end if;

  select sum((line ->> 'price')::numeric(10, 2) * coalesce((line ->> 'quantity')::integer, 1))
  into sale_total
  from jsonb_array_elements(items) line;

  insert into public.sales (customer_name, customer_phone, total, notes, sold_by)
  values (
    nullif(btrim(complete_sale.customer_name), ''),
    nullif(btrim(complete_sale.customer_phone), ''),
    sale_total,
    nullif(btrim(complete_sale.notes), ''),
    (select auth.uid())
  )
  returning id into new_sale_id;

  insert into public.sale_items (sale_id, part_id, quantity, price_at_sale, cost_at_sale, list_price_at_sale)
  select
    new_sale_id,
    p.id,
    coalesce((line ->> 'quantity')::integer, 1),
    (line ->> 'price')::numeric(10, 2),
    p.cost_price,
    p.selling_price
  from jsonb_array_elements(items) line
  join public.parts p on p.id = (line ->> 'part_id')::uuid;

  update public.parts p
  set quantity = p.quantity - l.quantity,
      status = case when p.quantity - l.quantity = 0 then 'sold'::public.part_status else p.status end
  from (
    select (line ->> 'part_id')::uuid as part_id, coalesce((line ->> 'quantity')::integer, 1) as quantity
    from jsonb_array_elements(items) line
  ) l
  where p.id = l.part_id;

  return new_sale_id;
end;
$$;

-- Puts the stock back and deletes the sale (its lines cascade).
create function public.undo_sale(target_sale uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.is_owner() then
    raise exception 'Only owners can undo a sale' using errcode = '42501';
  end if;

  perform 1 from public.sales where id = target_sale for update;
  if not found then
    raise exception 'That sale no longer exists.' using errcode = 'P0001';
  end if;

  update public.parts p
  set quantity = p.quantity + i.quantity,
      status = case when p.status = 'sold' then 'in_stock'::public.part_status else p.status end
  from public.sale_items i
  where i.sale_id = target_sale and p.id = i.part_id;

  delete from public.sales where id = target_sale;
end;
$$;

revoke all on function public.undo_sale(uuid) from public, anon;
grant execute on function public.undo_sale(uuid) to authenticated;
