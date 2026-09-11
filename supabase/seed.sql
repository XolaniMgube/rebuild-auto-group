-- LOCAL DEVELOPMENT ONLY. `supabase db reset` runs this; `supabase db push`
-- never sends it to a hosted project.
--
--   owner@rebuild.local    LocalOwner-2026   owner
--   staff@rebuild.local    LocalStaff-2026   staff
--   pending@rebuild.local  LocalPending-2026 no access yet

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated',
   'owner@rebuild.local', extensions.crypt('LocalOwner-2026', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"name":"Mitchel"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated',
   'staff@rebuild.local', extensions.crypt('LocalStaff-2026', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"name":"Sipho"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated',
   'pending@rebuild.local', extensions.crypt('LocalPending-2026', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"name":"New hire"}', now(), now(), '', '', '', '');

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text,
       jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users
where email like '%@rebuild.local';

update public.profiles set role = 'owner' where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set role = 'staff' where id = '22222222-2222-2222-2222-222222222222';

insert into public.vehicles (id, make, model, year, color, purchase_price, purchase_date, notes, added_by)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'VW', 'Polo Vivo', 2012, 'White', 8500, current_date - 24,
   'Front-end damage, drivetrain clean.', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Toyota', 'Corolla', 2008, 'Silver', 6000, current_date - 65,
   'Rolled. Interior salvageable.', '22222222-2222-2222-2222-222222222222');

insert into public.parts (name, brand, condition, description, selling_price, quantity, location, status, vehicle_id, added_by)
values
  ('Headlight, left', 'Hella', 'good', 'Clean lens, no cracks.', 450, 1, 'Rack B3', 'in_stock',
   'aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111'),
  ('Alternator', 'Bosch', 'good', 'Tested, charging.', 1200, 1, 'Shelf A2', 'in_stock',
   'aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111'),
  ('Door, front left', null, 'good', 'Straight, minor scuff.', 1800, 1, 'Container 1', 'reserved',
   'aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111'),
  ('Wheel, 15 inch alloy', null, 'good', 'Minor kerb rash.', 550, 1, 'Yard back', 'in_stock',
   'aaaaaaaa-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222');

insert into public.project_tasks (vehicle_id, name, done, position, added_by)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Find a left headlight', true, 0, '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Source a radiator', false, 1, '11111111-1111-1111-1111-111111111111');
