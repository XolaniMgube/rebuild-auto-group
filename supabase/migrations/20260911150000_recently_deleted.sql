-- =====================================================================
-- Recently deleted
--
--   * Owners move parts and projects (cars) to a bin instead of deleting
--     them outright. Binned rows vanish for everyone else, owners can
--     restore them for 30 days, and after that the app deletes them.
--   * Only rows already in the bin can be deleted for good.
--   * Parts with sales recorded can't be binned: those sales keep each
--     car's money figures right.
--   * Binning re-checks the name the owner typed, so a stray request
--     can't bin the wrong thing.
-- =====================================================================

alter table public.vehicles
  add column deleted_at timestamptz,
  add column deleted_by uuid references public.profiles (id) on delete set null;

alter table public.parts
  add column deleted_at timestamptz,
  add column deleted_by uuid references public.profiles (id) on delete set null;

create index vehicles_deleted_at_idx on public.vehicles (deleted_at) where deleted_at is not null;
create index vehicles_deleted_by_idx on public.vehicles (deleted_by);
create index parts_deleted_at_idx on public.parts (deleted_at) where deleted_at is not null;
create index parts_deleted_by_idx on public.parts (deleted_by);

-- No insert or update grants on the new columns: only the functions below set them.

-- ---------------------------------------------------------------------
-- Policies: binned rows are visible to owners only, can't be edited, and
-- are the only rows that may be deleted.
-- ---------------------------------------------------------------------

drop policy "Members read vehicles" on public.vehicles;
create policy "Members read vehicles" on public.vehicles
  for select to authenticated
  using ((select private.is_member()) and (deleted_at is null or (select private.is_owner())));

drop policy "Members edit vehicles" on public.vehicles;
create policy "Members edit vehicles" on public.vehicles
  for update to authenticated
  using ((select private.is_member()) and deleted_at is null)
  with check ((select private.is_member()) and deleted_at is null);

drop policy "Owners delete vehicles" on public.vehicles;
create policy "Owners delete binned vehicles" on public.vehicles
  for delete to authenticated
  using ((select private.is_owner()) and deleted_at is not null);

drop policy "Members read parts" on public.parts;
create policy "Members read parts" on public.parts
  for select to authenticated
  using ((select private.is_member()) and (deleted_at is null or (select private.is_owner())));

drop policy "Members edit parts" on public.parts;
create policy "Members edit parts" on public.parts
  for update to authenticated
  using ((select private.is_member()) and deleted_at is null)
  with check ((select private.is_member()) and deleted_at is null);

drop policy "Owners delete parts" on public.parts;
create policy "Owners delete binned parts" on public.parts
  for delete to authenticated
  using ((select private.is_owner()) and deleted_at is not null);

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------

-- Case and spacing don't matter when typing a name to confirm.
create function private.same_name(typed text, actual text)
returns boolean
language sql immutable set search_path = ''
as $$
  select btrim(coalesce(actual, '')) <> ''
     and lower(regexp_replace(btrim(coalesce(typed, '')), '\s+', ' ', 'g'))
       = lower(regexp_replace(btrim(actual), '\s+', ' ', 'g'));
$$;

-- A binned part can't be sold.
create function private.block_binned_sales()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if exists (select 1 from public.parts where id = new.part_id and deleted_at is not null) then
    raise exception 'This part is no longer available.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger block_binned_sales
  before insert on public.sale_items
  for each row execute function private.block_binned_sales();

revoke all on function private.same_name(text, text), private.block_binned_sales() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Bin and restore
-- ---------------------------------------------------------------------

create function public.bin_part(target uuid, typed_name text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  part_name text;
begin
  if not private.is_owner() then
    raise exception 'Only owners can delete parts.' using errcode = '42501';
  end if;

  select name into part_name from public.parts where id = target and deleted_at is null for update;
  if not found then
    raise exception 'This part no longer exists.' using errcode = 'P0001';
  end if;
  if not private.same_name(typed_name, part_name) then
    raise exception 'The name typed doesn''t match.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.sale_items where part_id = target) then
    raise exception 'This part has sales recorded, so it stays for the records.' using errcode = 'P0001';
  end if;

  update public.parts set deleted_at = now(), deleted_by = (select auth.uid()) where id = target;
end;
$$;

-- Unsold parts either go into the bin with the car (sharing its timestamp, so
-- they come back with it) or move to unassigned stock. Parts with sales stay
-- attached so the car's figures survive a restore.
create function public.bin_vehicle(target uuid, typed_name text, keep_parts boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  car_name text;
  stamp timestamptz := now();
begin
  if not private.is_owner() then
    raise exception 'Only owners can delete projects.' using errcode = '42501';
  end if;

  select make || ' ' || model into car_name from public.vehicles where id = target and deleted_at is null for update;
  if not found then
    raise exception 'This project no longer exists.' using errcode = 'P0001';
  end if;
  if not private.same_name(typed_name, car_name) then
    raise exception 'The name typed doesn''t match.' using errcode = 'P0001';
  end if;

  -- Lock the car's parts first so a sale can't slip in while they move.
  perform 1 from public.parts where vehicle_id = target and deleted_at is null for update;

  if coalesce(keep_parts, false) then
    update public.parts p set vehicle_id = null
    where p.vehicle_id = target and p.deleted_at is null
      and not exists (select 1 from public.sale_items i where i.part_id = p.id);
  else
    update public.parts p set deleted_at = stamp, deleted_by = (select auth.uid())
    where p.vehicle_id = target and p.deleted_at is null
      and not exists (select 1 from public.sale_items i where i.part_id = p.id);
  end if;

  update public.vehicles set deleted_at = stamp, deleted_by = (select auth.uid()) where id = target;
end;
$$;

create function public.restore_part(target uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  car_binned boolean;
begin
  if not private.is_owner() then
    raise exception 'Only owners can restore parts.' using errcode = '42501';
  end if;

  select v.deleted_at is not null into car_binned
  from public.parts p
  left join public.vehicles v on v.id = p.vehicle_id
  where p.id = target and p.deleted_at is not null
  for update of p;
  if not found then
    raise exception 'This part is no longer in Recently deleted.' using errcode = 'P0001';
  end if;
  if car_binned then
    raise exception 'Its project is in Recently deleted too. Restore the project first.' using errcode = 'P0001';
  end if;

  update public.parts set deleted_at = null, deleted_by = null where id = target;
end;
$$;

create function public.restore_vehicle(target uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  stamp timestamptz;
begin
  if not private.is_owner() then
    raise exception 'Only owners can restore projects.' using errcode = '42501';
  end if;

  select deleted_at into stamp from public.vehicles where id = target and deleted_at is not null for update;
  if not found then
    raise exception 'This project is no longer in Recently deleted.' using errcode = 'P0001';
  end if;

  -- Parts binned along with the car come back; parts binned on their own stay in the bin.
  update public.parts set deleted_at = null, deleted_by = null where vehicle_id = target and deleted_at = stamp;
  update public.vehicles set deleted_at = null, deleted_by = null where id = target;
end;
$$;

revoke all on function public.bin_part(uuid, text), public.bin_vehicle(uuid, text, boolean),
  public.restore_part(uuid), public.restore_vehicle(uuid) from public, anon;
grant execute on function public.bin_part(uuid, text), public.bin_vehicle(uuid, text, boolean),
  public.restore_part(uuid), public.restore_vehicle(uuid) to authenticated;
