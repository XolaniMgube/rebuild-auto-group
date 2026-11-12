-- What a part cost, for parts bought on their own rather than stripped from
-- one of our cars:
--   * part_purchases: what was paid for the part, when, and by which owner.
--     At most one per part.
--   * part_expenses: costs on top, such as petrol to go fetch it.
--
-- Both are owners only, like the rest of the money. They live in their own
-- tables rather than on parts, because staff can read every column of parts.
-- A part's costs go with it when it is deleted for good.

create table public.part_purchases (
  part_id    uuid primary key references public.parts (id) on delete cascade,
  amount     numeric(10, 2) not null check (amount > 0),
  bought_on  date not null default current_date,
  paid_by    uuid references public.profiles (id) on delete set null,
  added_by   uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index part_purchases_paid_by_idx on public.part_purchases (paid_by);
create index part_purchases_added_by_idx on public.part_purchases (added_by);

create trigger part_purchases_set_updated_at
  before update on public.part_purchases
  for each row execute function private.set_updated_at();

revoke all on public.part_purchases from anon, authenticated;
grant select, delete on public.part_purchases to authenticated;
grant insert (part_id, amount, bought_on, paid_by) on public.part_purchases to authenticated;
grant update (amount, bought_on, paid_by) on public.part_purchases to authenticated;

alter table public.part_purchases enable row level security;

create policy "Owners read part purchases" on public.part_purchases
  for select to authenticated using ((select private.is_owner()));
create policy "Owners add part purchases" on public.part_purchases
  for insert to authenticated with check (
    (select private.is_owner()) and added_by = (select auth.uid())
    and (paid_by is null or private.is_owner_profile(paid_by))
  );
create policy "Owners change part purchases" on public.part_purchases
  for update to authenticated
  using ((select private.is_owner()))
  with check ((select private.is_owner()) and (paid_by is null or private.is_owner_profile(paid_by)));
create policy "Owners remove part purchases" on public.part_purchases
  for delete to authenticated using ((select private.is_owner()));

create table public.part_expenses (
  id          uuid primary key default gen_random_uuid(),
  part_id     uuid not null references public.parts (id) on delete cascade,
  category    text not null check (category in ('transport', 'labour', 'repairs', 'other')),
  description text check (char_length(description) <= 120),
  amount      numeric(10, 2) not null check (amount > 0),
  spent_on    date not null default current_date,
  paid_by     uuid references public.profiles (id) on delete set null,
  added_by    uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index part_expenses_part_id_idx on public.part_expenses (part_id, spent_on);
create index part_expenses_paid_by_idx on public.part_expenses (paid_by);
create index part_expenses_added_by_idx on public.part_expenses (added_by);

revoke all on public.part_expenses from anon, authenticated;
grant select, delete on public.part_expenses to authenticated;
grant insert (part_id, category, description, amount, spent_on, paid_by) on public.part_expenses to authenticated;

alter table public.part_expenses enable row level security;

create policy "Owners read part expenses" on public.part_expenses
  for select to authenticated using ((select private.is_owner()));
create policy "Owners add part expenses" on public.part_expenses
  for insert to authenticated with check (
    (select private.is_owner()) and added_by = (select auth.uid())
    and (paid_by is null or private.is_owner_profile(paid_by))
  );
create policy "Owners remove part expenses" on public.part_expenses
  for delete to authenticated using ((select private.is_owner()));
