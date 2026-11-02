-- =====================================================================
-- Money that adds up, and a faster parts list
--
--   * sale_items.vehicle_id: a sale stays with the car it came from, even
--     if the part is later moved to another car or unassigned.
--   * Sales can be dated (recorded late) and say which owner holds the money.
--   * vehicles.paid_by / vehicle_expenses.paid_by: who paid, for the
--     partner balance.
--   * vehicle_income: scrap/shell and other money a car brings in.
--   * business_expenses: rent, fuel, tools… that belong to no one car.
--   * partner_transfers: money moved between owners to settle up.
--   * search_parts(): search, filter, sort and page the parts list in the
--     database instead of the browser.
--
-- Additive only: nothing existing is removed, and new columns are filled
-- from what was already recorded (who added it, who sold it).
-- =====================================================================

create function private.is_owner_profile(profile uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = profile and role = 'owner');
$$;

revoke all on function private.is_owner_profile(uuid) from public, anon;
grant execute on function private.is_owner_profile(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Sales: their car, their date, and who holds the money
-- ---------------------------------------------------------------------

alter table public.sale_items
  add column vehicle_id uuid references public.vehicles (id) on delete set null;

update public.sale_items i set vehicle_id = p.vehicle_id
from public.parts p
where p.id = i.part_id and i.vehicle_id is null;

create index sale_items_vehicle_id_idx on public.sale_items (vehicle_id);

alter table public.sales
  add column received_by uuid references public.profiles (id) on delete set null;

update public.sales set received_by = sold_by where received_by is null;

create index sales_received_by_idx on public.sales (received_by);

-- Same rules as before, plus an optional sale date and money holder. Dropped
-- and recreated because the argument list changes; existing callers still
-- match because the new arguments have defaults.
drop function public.complete_sale(jsonb, text, text, text);

create function public.complete_sale(
  items jsonb,
  customer_name text default null,
  customer_phone text default null,
  notes text default null,
  sold_on date default null,
  received_by uuid default null
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  new_sale_id uuid;
  sale_total numeric(12, 2);
  today date := (now() at time zone 'Africa/Johannesburg')::date;
  holder uuid;
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

  if sold_on is not null and (sold_on > today or sold_on < today - 365) then
    raise exception 'The sale date must be within the last year and not in the future.' using errcode = 'P0001';
  end if;

  if complete_sale.received_by is not null and not private.is_owner_profile(complete_sale.received_by) then
    raise exception 'Choose one of the owners to hold the money.' using errcode = 'P0001';
  end if;
  -- Owners hold the money they take unless they say otherwise; staff sales stay unassigned.
  holder := coalesce(complete_sale.received_by, case when private.is_owner() then (select auth.uid()) end);

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

  insert into public.sales (customer_name, customer_phone, total, notes, sold_by, sale_date, received_by)
  values (
    nullif(btrim(complete_sale.customer_name), ''),
    nullif(btrim(complete_sale.customer_phone), ''),
    sale_total,
    nullif(btrim(complete_sale.notes), ''),
    (select auth.uid()),
    -- Today's sales keep the real time; earlier ones are placed at midday that day.
    case when sold_on is null or sold_on = today then now()
         else (sold_on + time '12:00') at time zone 'Africa/Johannesburg' end,
    holder
  )
  returning id into new_sale_id;

  insert into public.sale_items (sale_id, part_id, quantity, price_at_sale, cost_at_sale, list_price_at_sale, vehicle_id)
  select
    new_sale_id,
    p.id,
    coalesce((line ->> 'quantity')::integer, 1),
    (line ->> 'price')::numeric(10, 2),
    p.cost_price,
    p.selling_price,
    p.vehicle_id
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

revoke all on function public.complete_sale(jsonb, text, text, text, date, uuid) from public, anon;
grant execute on function public.complete_sale(jsonb, text, text, text, date, uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Who paid for a car and for each of its expenses
-- ---------------------------------------------------------------------

alter table public.vehicles
  add column paid_by uuid references public.profiles (id) on delete set null;

update public.vehicles set paid_by = added_by where paid_by is null and purchase_price > 0;

create index vehicles_paid_by_idx on public.vehicles (paid_by);
grant insert (paid_by), update (paid_by) on public.vehicles to authenticated;

alter table public.vehicle_expenses
  add column paid_by uuid references public.profiles (id) on delete set null;

update public.vehicle_expenses set paid_by = added_by where paid_by is null;

create index vehicle_expenses_paid_by_idx on public.vehicle_expenses (paid_by);
grant insert (paid_by) on public.vehicle_expenses to authenticated;

-- ---------------------------------------------------------------------
-- Money a car brings in besides its parts: the shell to scrap, and so on
-- ---------------------------------------------------------------------

create table public.vehicle_income (
  id          uuid primary key default gen_random_uuid(),
  vehicle_id  uuid not null references public.vehicles (id) on delete cascade,
  kind        text not null check (kind in ('scrap', 'other')),
  description text check (char_length(description) <= 120),
  amount      numeric(10, 2) not null check (amount > 0),
  received_on date not null default current_date,
  received_by uuid references public.profiles (id) on delete set null,
  added_by    uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index vehicle_income_vehicle_id_idx on public.vehicle_income (vehicle_id, received_on);
create index vehicle_income_received_by_idx on public.vehicle_income (received_by);
create index vehicle_income_added_by_idx on public.vehicle_income (added_by);

revoke all on public.vehicle_income from anon, authenticated;
grant select, delete on public.vehicle_income to authenticated;
grant insert (vehicle_id, kind, description, amount, received_on, received_by) on public.vehicle_income to authenticated;

alter table public.vehicle_income enable row level security;

create policy "Owners read car income" on public.vehicle_income
  for select to authenticated using ((select private.is_owner()));
create policy "Owners add car income" on public.vehicle_income
  for insert to authenticated with check (
    (select private.is_owner()) and added_by = (select auth.uid())
    and (received_by is null or private.is_owner_profile(received_by))
  );
create policy "Owners remove car income" on public.vehicle_income
  for delete to authenticated using ((select private.is_owner()));

-- ---------------------------------------------------------------------
-- Running costs of the business that belong to no one car
-- ---------------------------------------------------------------------

create table public.business_expenses (
  id          uuid primary key default gen_random_uuid(),
  category    text not null check (category in ('rent', 'fuel', 'tools', 'adverts', 'wages', 'other')),
  description text check (char_length(description) <= 120),
  amount      numeric(10, 2) not null check (amount > 0),
  spent_on    date not null default current_date,
  paid_by     uuid references public.profiles (id) on delete set null,
  added_by    uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index business_expenses_spent_on_idx on public.business_expenses (spent_on);
create index business_expenses_paid_by_idx on public.business_expenses (paid_by);
create index business_expenses_added_by_idx on public.business_expenses (added_by);

revoke all on public.business_expenses from anon, authenticated;
grant select, delete on public.business_expenses to authenticated;
grant insert (category, description, amount, spent_on, paid_by) on public.business_expenses to authenticated;

alter table public.business_expenses enable row level security;

create policy "Owners read business expenses" on public.business_expenses
  for select to authenticated using ((select private.is_owner()));
create policy "Owners add business expenses" on public.business_expenses
  for insert to authenticated with check (
    (select private.is_owner()) and added_by = (select auth.uid())
    and (paid_by is null or private.is_owner_profile(paid_by))
  );
create policy "Owners remove business expenses" on public.business_expenses
  for delete to authenticated using ((select private.is_owner()));

-- ---------------------------------------------------------------------
-- Money one owner hands another to settle up
-- ---------------------------------------------------------------------

create table public.partner_transfers (
  id             uuid primary key default gen_random_uuid(),
  from_owner     uuid references public.profiles (id) on delete set null,
  to_owner       uuid references public.profiles (id) on delete set null,
  amount         numeric(10, 2) not null check (amount > 0),
  transferred_on date not null default current_date,
  note           text check (char_length(note) <= 120),
  added_by       uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  check (from_owner is distinct from to_owner)
);

create index partner_transfers_from_owner_idx on public.partner_transfers (from_owner);
create index partner_transfers_to_owner_idx on public.partner_transfers (to_owner);
create index partner_transfers_added_by_idx on public.partner_transfers (added_by);

revoke all on public.partner_transfers from anon, authenticated;
grant select, delete on public.partner_transfers to authenticated;
grant insert (from_owner, to_owner, amount, transferred_on, note) on public.partner_transfers to authenticated;

alter table public.partner_transfers enable row level security;

create policy "Owners read transfers" on public.partner_transfers
  for select to authenticated using ((select private.is_owner()));
create policy "Owners record transfers" on public.partner_transfers
  for insert to authenticated with check (
    (select private.is_owner()) and added_by = (select auth.uid())
    and private.is_owner_profile(from_owner) and private.is_owner_profile(to_owner)
  );
create policy "Owners remove transfers" on public.partner_transfers
  for delete to authenticated using ((select private.is_owner()));

-- ---------------------------------------------------------------------
-- A faster parts list
-- ---------------------------------------------------------------------

-- The main list: live parts, newest first.
create index parts_active_recent_idx on public.parts (created_at desc, name, id)
  where deleted_at is null and status in ('in_stock', 'reserved');

-- Photos are always read per part, in order.
create index part_images_part_position_idx on public.part_images (part_id, position);

-- Search, filter, sort and page the live parts. Runs as the caller, so row
-- level security still decides what can be seen. Every word typed must
-- appear somewhere in the part or its car; `car` is a car id or 'none' for
-- unassigned. Returns one page of ids plus the counts the screen shows.
create function public.search_parts(
  q text default null,
  car text default null,
  status_filter text default null,
  sort text default 'recent',
  page_size integer default 48,
  page_offset integer default 0
)
returns jsonb
language sql stable security invoker set search_path = ''
as $$
  with terms as (
    select term from regexp_split_to_table(lower(btrim(coalesce(q, ''))), '\s+') as term
    where term <> ''
  ),
  base as (
    select p.id, p.status, p.created_at, p.name
    from public.parts p
    left join public.vehicles v on v.id = p.vehicle_id
    where p.deleted_at is null
      and p.status in ('in_stock', 'reserved')
      and (coalesce(car, '') = '' or (car = 'none' and p.vehicle_id is null) or p.vehicle_id::text = car)
      and not exists (
        select 1 from terms t
        where position(t.term in lower(concat_ws(' ', p.name, p.brand, p.serial_number, p.location, p.description, v.year::text, v.make, v.model))) = 0
      )
  ),
  filtered as (
    select b.*, row_number() over (
      order by case when sort = 'name' then lower(b.name) end, b.created_at desc, b.name, b.id
    ) as rn
    from base b
    where coalesce(status_filter, '') = '' or b.status::text = status_filter
  )
  select jsonb_build_object(
    'ids', coalesce((
      select jsonb_agg(f.id order by f.rn) from filtered f
      where f.rn > greatest(page_offset, 0)
        and f.rn <= greatest(page_offset, 0) + least(greatest(page_size, 1), 200)
    ), '[]'::jsonb),
    'total', (select count(*) from filtered),
    'all', (select count(*) from base),
    'in_stock', (select count(*) from base where status = 'in_stock'),
    'on_hold', (select count(*) from base where status = 'reserved')
  );
$$;

revoke all on function public.search_parts(text, text, text, text, integer, integer) from public, anon;
grant execute on function public.search_parts(text, text, text, text, integer, integer) to authenticated;
