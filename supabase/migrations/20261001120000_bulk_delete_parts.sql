-- =====================================================================
-- Deleting several parts at once
--
--   * bin_parts() moves any number of parts to Recently deleted in one
--     go. Parts with sales recorded stay put and come back in `kept`, so
--     the app can say which ones were left behind.
--   * No typed name here: parts are picked from a list, and everything
--     stays restorable for 30 days.
-- =====================================================================

create function public.bin_parts(targets uuid[])
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  moved int;
  kept text[];
begin
  if not private.is_owner() then
    raise exception 'Only owners can delete parts.' using errcode = '42501';
  end if;
  if targets is null or coalesce(array_length(targets, 1), 0) = 0 then
    raise exception 'Choose at least one part.' using errcode = '22023';
  end if;
  if array_length(targets, 1) > 300 then
    raise exception 'Delete up to 300 parts at a time.' using errcode = '22023';
  end if;

  -- Lock first so a sale can't slip in while the parts move.
  perform 1 from public.parts where id = any(targets) and deleted_at is null for update;

  select coalesce(array_agg(p.name order by p.name), '{}')
  into kept
  from public.parts p
  where p.id = any(targets)
    and p.deleted_at is null
    and exists (select 1 from public.sale_items i where i.part_id = p.id);

  with binned as (
    update public.parts p
    set deleted_at = now(), deleted_by = (select auth.uid())
    where p.id = any(targets)
      and p.deleted_at is null
      and not exists (select 1 from public.sale_items i where i.part_id = p.id)
    returning 1
  )
  select count(*) into moved from binned;

  return jsonb_build_object('binned', moved, 'kept', to_jsonb(kept));
end;
$$;

revoke all on function public.bin_parts(uuid[]) from public, anon;
grant execute on function public.bin_parts(uuid[]) to authenticated;
