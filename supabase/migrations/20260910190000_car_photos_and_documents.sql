-- =====================================================================
-- Car photos and car documents
--
--   * vehicles.photo_path: one photo per car.
--   * vehicle_documents: up to 5 PDFs or scans per car.
--   * Both live in the private `vehicle-files` bucket under
--     `<vehicle_id>/photo/` and `<vehicle_id>/documents/`.
--   * Attachment limits are enforced here, not only in the app.
-- =====================================================================

alter table public.vehicles
  add column photo_path text
  check (photo_path is null or photo_path like (id::text || '/photo/%'));

grant update (photo_path) on public.vehicles to authenticated;

create table public.vehicle_documents (
  id           uuid primary key default gen_random_uuid(),
  vehicle_id   uuid not null references public.vehicles (id) on delete cascade,
  storage_path text not null unique check (storage_path like (vehicle_id::text || '/documents/%')),
  file_name    text not null check (char_length(file_name) between 1 and 120),
  content_type text not null check (content_type in ('application/pdf', 'image/jpeg')),
  size_bytes   integer not null check (size_bytes between 1 and 10485760),
  added_by     uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index vehicle_documents_vehicle_id_idx on public.vehicle_documents (vehicle_id, created_at);
create index vehicle_documents_added_by_idx on public.vehicle_documents (added_by);

revoke all on public.vehicle_documents from anon, authenticated;
grant select, delete on public.vehicle_documents to authenticated;
grant insert (vehicle_id, storage_path, file_name, content_type, size_bytes) on public.vehicle_documents to authenticated;

alter table public.vehicle_documents enable row level security;

create policy "Members read car documents" on public.vehicle_documents
  for select to authenticated using ((select private.is_member()));
create policy "Members add car documents" on public.vehicle_documents
  for insert to authenticated with check ((select private.is_member()) and added_by = (select auth.uid()));
create policy "Members remove car documents" on public.vehicle_documents
  for delete to authenticated using ((select private.is_member()));

-- ---------------------------------------------------------------------
-- Attachment limits. The parent row is locked so two uploads at the same
-- moment cannot both slip past the count.
-- ---------------------------------------------------------------------

create function private.limit_vehicle_documents()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform 1 from public.vehicles where id = new.vehicle_id for update;
  if (select count(*) from public.vehicle_documents where vehicle_id = new.vehicle_id) >= 5 then
    raise exception 'A car can have up to 5 documents.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger limit_vehicle_documents
  before insert on public.vehicle_documents
  for each row execute function private.limit_vehicle_documents();

create function private.limit_part_images()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform 1 from public.parts where id = new.part_id for update;
  if (select count(*) from public.part_images where part_id = new.part_id) >= 4 then
    raise exception 'A part can have up to 4 photos.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger limit_part_images
  before insert on public.part_images
  for each row execute function private.limit_part_images();

revoke all on function private.limit_vehicle_documents(), private.limit_part_images() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Storage: private bucket for car photos and documents
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vehicle-files', 'vehicle-files', false, 10485760, array['image/jpeg', 'application/pdf'])
on conflict (id) do nothing;

create policy "Members view car files" on storage.objects
  for select to authenticated
  using (bucket_id = 'vehicle-files' and (select private.is_member()));

-- Uploads must sit in `<existing car id>/photo/` or `<existing car id>/documents/`.
create policy "Members upload car files" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'vehicle-files'
    and (select private.is_member())
    and (storage.foldername(objects.name))[2] in ('photo', 'documents')
    and exists (select 1 from public.vehicles v where v.id::text = (storage.foldername(objects.name))[1])
  );

create policy "Members delete car files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'vehicle-files' and (select private.is_member()));
