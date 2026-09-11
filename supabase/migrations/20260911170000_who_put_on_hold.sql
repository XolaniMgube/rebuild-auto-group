-- =====================================================================
-- Who put a part on hold
--
--   * parts.held_by / held_at are stamped by the database when a part goes
--     on hold and cleared when the hold ends or the part sells, so the name
--     shown is always the person who actually did it.
--   * Sales already record who sold them in sales.sold_by.
-- =====================================================================

alter table public.parts
  add column held_by uuid references public.profiles (id) on delete set null,
  add column held_at timestamptz;

create index parts_held_by_idx on public.parts (held_by);

-- No insert or update grants on the new columns: only the trigger below sets them.

create function private.stamp_hold()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.status = 'reserved' then
    if tg_op = 'INSERT' or old.status is distinct from 'reserved' then
      new.held_by := (select auth.uid());
      new.held_at := now();
    end if;
  else
    new.held_by := null;
    new.held_at := null;
  end if;
  return new;
end;
$$;

create trigger stamp_hold
  before insert or update of status on public.parts
  for each row execute function private.stamp_hold();

revoke all on function private.stamp_hold() from public, anon, authenticated;
