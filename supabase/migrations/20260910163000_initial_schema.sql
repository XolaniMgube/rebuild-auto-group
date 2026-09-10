-- =====================================================================
-- Rebuild Auto Group — initial schema
--
-- Access model
--   * Public sign-up is off. People are invited.
--   * Every auth user gets a profile with no role. No role, no data.
--   * owner: everything, including sales and deleting records.
--   * staff: inventory, projects and recording sales. Cannot read sales.
--
-- Row level security is the security boundary. The publishable key in
-- the browser can only do what the policies below allow.
-- =====================================================================

create extension if not exists pg_trgm with schema extensions;

-- Helpers live outside `public` so the Data API never exposes them.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.app_role as enum ('owner', 'staff');
create type public.part_condition as enum ('good', 'fair', 'spares_only');
create type public.part_status as enum ('draft', 'in_stock', 'reserved', 'sold', 'returned');

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null default '',
  name       text not null default '' check (char_length(name) <= 80),
  role       public.app_role,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.profiles.role is 'Null until an owner grants access.';

-- The donor or project car. Profit-per-car and "what came off the
-- 2012 Polo" both hang off this.
create table public.vehicles (
  id             uuid primary key default gen_random_uuid(),
  make           text not null check (char_length(make) between 1 and 60),
  model          text not null check (char_length(model) between 1 and 60),
  year           smallint check (year between 1900 and 2100),
  vin            text check (char_length(vin) <= 32),
  registration   text check (char_length(registration) <= 20),
  color          text check (char_length(color) <= 40),
  purchase_price numeric(10, 2) not null default 0 check (purchase_price >= 0),
  purchase_date  date not null default current_date,
  notes          text check (char_length(notes) <= 2000),
  added_by       uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.parts (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 1 and 120),
  brand         text check (char_length(brand) <= 60),
  serial_number text check (char_length(serial_number) <= 80),
  condition     public.part_condition not null default 'good',
  description   text check (char_length(description) <= 2000),
  cost_price    numeric(10, 2) check (cost_price >= 0),
  selling_price numeric(10, 2) not null default 0 check (selling_price >= 0),
  quantity      integer not null default 1 check (quantity >= 0),
  location      text check (char_length(location) <= 60),
  status        public.part_status not null default 'in_stock',
  -- Nullable: parts sometimes come in loose, or outlive their car.
  vehicle_id    uuid references public.vehicles (id) on delete set null,
  added_by      uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Files live in the private `part-images` bucket under `<part_id>/...`.
-- Store the object path, not a URL; the app signs URLs on demand.
create table public.part_images (
  id           uuid primary key default gen_random_uuid(),
  part_id      uuid not null references public.parts (id) on delete cascade,
  storage_path text not null unique check (split_part(storage_path, '/', 1) = part_id::text),
  position     smallint not null default 0,
  added_by     uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

create table public.project_tasks (
  id         uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 200),
  done       boolean not null default false,
  position   integer not null default 0,
  added_by   uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sales (
  id             uuid primary key default gen_random_uuid(),
  sale_date      timestamptz not null default now(),
  customer_name  text check (char_length(customer_name) <= 120),
  customer_phone text check (char_length(customer_phone) <= 30),
  total          numeric(12, 2) not null check (total >= 0),
  notes          text check (char_length(notes) <= 2000),
  sold_by        uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now()
);

-- Prices are frozen here on purpose. Re-pricing a part next month must
-- not rewrite last month's revenue. Sold parts cannot be deleted.
create table public.sale_items (
  id            uuid primary key default gen_random_uuid(),
  sale_id       uuid not null references public.sales (id) on delete cascade,
  part_id       uuid not null references public.parts (id) on delete restrict,
  quantity      integer not null default 1 check (quantity > 0),
  price_at_sale numeric(10, 2) not null check (price_at_sale >= 0),
  cost_at_sale  numeric(10, 2) check (cost_at_sale >= 0),
  unique (sale_id, part_id)
);

create index vehicles_make_model_year_idx on public.vehicles (make, model, year);
create index vehicles_added_by_idx on public.vehicles (added_by);
create index parts_status_idx on public.parts (status);
create index parts_vehicle_id_idx on public.parts (vehicle_id);
create index parts_added_by_idx on public.parts (added_by);
create index parts_name_trgm_idx on public.parts using gin (name extensions.gin_trgm_ops);
create index part_images_part_id_idx on public.part_images (part_id);
create index part_images_added_by_idx on public.part_images (added_by);
create index project_tasks_vehicle_id_idx on public.project_tasks (vehicle_id, position);
create index project_tasks_added_by_idx on public.project_tasks (added_by);
create index sales_sale_date_idx on public.sales (sale_date desc);
create index sales_sold_by_idx on public.sales (sold_by);
create index sale_items_part_id_idx on public.sale_items (part_id);

-- ---------------------------------------------------------------------
-- Functions and triggers
-- ---------------------------------------------------------------------

-- Security definer so policies can read roles without recursing into
-- the profiles policies. Pinned search_path prevents object hijacking.
create function private.is_member()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role is not null
  );
$$;

create function private.is_owner()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'owner'
  );
$$;

create function private.set_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.vehicles
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.parts
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.project_tasks
  for each row execute function private.set_updated_at();

create function private.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    coalesce(new.email, ''),
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'name'), ''), split_part(coalesce(new.email, ''), '@', 1)), 80)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create function private.handle_user_email_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function private.handle_user_email_change();

-- Owners grant, change or remove access. Nobody changes their own role,
-- which also stops the last owner locking everyone out.
create function public.set_member_role(target_user uuid, new_role public.app_role)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.is_owner() then
    raise exception 'Only owners can change access' using errcode = '42501';
  end if;
  if target_user = (select auth.uid()) then
    raise exception 'You cannot change your own role' using errcode = '42501';
  end if;

  update public.profiles set role = new_role where id = target_user;
  if not found then
    raise exception 'No such user' using errcode = 'P0002';
  end if;
end;
$$;

-- Records a sale atomically: the sale, its lines at frozen prices, and
-- the stock change. Row locks stop two people selling the same part.
--
-- items: [{ "part_id": uuid, "price": number, "quantity"?: int }]
create function public.complete_sale(
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
    raise exception 'One or more parts are no longer available' using errcode = 'P0001';
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

  insert into public.sale_items (sale_id, part_id, quantity, price_at_sale, cost_at_sale)
  select
    new_sale_id,
    p.id,
    coalesce((line ->> 'quantity')::integer, 1),
    (line ->> 'price')::numeric(10, 2),
    p.cost_price
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

revoke all on all functions in schema private from public, anon;
grant execute on function private.is_member(), private.is_owner() to authenticated;

revoke all on function public.set_member_role(uuid, public.app_role) from public, anon;
revoke all on function public.complete_sale(jsonb, text, text, text) from public, anon;
grant execute on function public.set_member_role(uuid, public.app_role) to authenticated;
grant execute on function public.complete_sale(jsonb, text, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- Privileges: least privilege first, row level security on top.
-- Column grants stop clients writing ids, authorship or timestamps.
-- ---------------------------------------------------------------------

revoke all on public.profiles, public.vehicles, public.parts, public.part_images,
  public.project_tasks, public.sales, public.sale_items from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (name) on public.profiles to authenticated;

grant select, delete on public.vehicles to authenticated;
grant insert (make, model, year, vin, registration, color, purchase_price, purchase_date, notes)
  on public.vehicles to authenticated;
grant update (make, model, year, vin, registration, color, purchase_price, purchase_date, notes)
  on public.vehicles to authenticated;

grant select, delete on public.parts to authenticated;
grant insert (name, brand, serial_number, condition, description, cost_price, selling_price, quantity, location, status, vehicle_id)
  on public.parts to authenticated;
grant update (name, brand, serial_number, condition, description, cost_price, selling_price, quantity, location, status, vehicle_id)
  on public.parts to authenticated;

grant select, delete on public.part_images to authenticated;
grant insert (part_id, storage_path, position) on public.part_images to authenticated;
grant update (position) on public.part_images to authenticated;

grant select, delete on public.project_tasks to authenticated;
grant insert (vehicle_id, name, done, position) on public.project_tasks to authenticated;
grant update (name, done, position) on public.project_tasks to authenticated;

-- Sales are written only through complete_sale().
grant select on public.sales, public.sale_items to authenticated;

alter table public.profiles      enable row level security;
alter table public.vehicles      enable row level security;
alter table public.parts         enable row level security;
alter table public.part_images   enable row level security;
alter table public.project_tasks enable row level security;
alter table public.sales         enable row level security;
alter table public.sale_items    enable row level security;

-- ---------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------

create policy "Members see the team; everyone sees themselves"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_member()));

create policy "People update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- vehicles
create policy "Members read vehicles" on public.vehicles
  for select to authenticated using ((select private.is_member()));
create policy "Members add vehicles" on public.vehicles
  for insert to authenticated with check ((select private.is_member()) and added_by = (select auth.uid()));
create policy "Members edit vehicles" on public.vehicles
  for update to authenticated using ((select private.is_member())) with check ((select private.is_member()));
create policy "Owners delete vehicles" on public.vehicles
  for delete to authenticated using ((select private.is_owner()));

-- parts
create policy "Members read parts" on public.parts
  for select to authenticated using ((select private.is_member()));
create policy "Members add parts" on public.parts
  for insert to authenticated with check ((select private.is_member()) and added_by = (select auth.uid()));
create policy "Members edit parts" on public.parts
  for update to authenticated using ((select private.is_member())) with check ((select private.is_member()));
create policy "Owners delete parts" on public.parts
  for delete to authenticated using ((select private.is_owner()));

-- part images
create policy "Members read part images" on public.part_images
  for select to authenticated using ((select private.is_member()));
create policy "Members add part images" on public.part_images
  for insert to authenticated with check ((select private.is_member()) and added_by = (select auth.uid()));
create policy "Members reorder part images" on public.part_images
  for update to authenticated using ((select private.is_member())) with check ((select private.is_member()));
create policy "Members remove part images" on public.part_images
  for delete to authenticated using ((select private.is_member()));

-- project checklist
create policy "Members read tasks" on public.project_tasks
  for select to authenticated using ((select private.is_member()));
create policy "Members add tasks" on public.project_tasks
  for insert to authenticated with check ((select private.is_member()) and added_by = (select auth.uid()));
create policy "Members edit tasks" on public.project_tasks
  for update to authenticated using ((select private.is_member())) with check ((select private.is_member()));
create policy "Members remove tasks" on public.project_tasks
  for delete to authenticated using ((select private.is_member()));

-- sales: owners only
create policy "Owners read sales" on public.sales
  for select to authenticated using ((select private.is_owner()));
create policy "Owners read sale items" on public.sale_items
  for select to authenticated using ((select private.is_owner()));

-- ---------------------------------------------------------------------
-- Storage: private bucket for part photos
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'part-images', 'part-images', false, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;

create policy "Members view part photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'part-images' and (select private.is_member()));

-- Uploads must sit in a folder named after a part that exists.
create policy "Members upload part photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'part-images'
    and (select private.is_member())
    and exists (select 1 from public.parts p where p.id::text = (storage.foldername(objects.name))[1])
  );

create policy "Members delete part photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'part-images' and (select private.is_member()));
