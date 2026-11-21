-- Jalankan seluruh file ini di Supabase: SQL Editor > New query > Run

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  service_type text not null,
  summary text not null,
  image_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

drop policy if exists "projects public read published" on public.projects;

create policy "projects public read published"
  on public.projects
  for select
  to anon, authenticated
  using (is_published = true);

drop policy if exists "projects authenticated read all" on public.projects;
drop policy if exists "projects authenticated insert" on public.projects;
drop policy if exists "projects authenticated update" on public.projects;
drop policy if exists "projects authenticated delete" on public.projects;

drop policy if exists "projects admin read all" on public.projects;
drop policy if exists "projects admin insert" on public.projects;
drop policy if exists "projects admin update" on public.projects;
drop policy if exists "projects admin delete" on public.projects;

create policy "projects admin read all"
  on public.projects
  for select
  to authenticated
  using ((select auth.uid()) is not null);

create policy "projects admin insert"
  on public.projects
  for insert
  to authenticated
  with check ((select auth.uid()) is not null);

create policy "projects admin update"
  on public.projects
  for update
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

create policy "projects admin delete"
  on public.projects
  for delete
  to authenticated
  using ((select auth.uid()) is not null);

create table if not exists public.company_settings (
  id integer primary key,
  brand_name text not null,
  tagline text not null,
  email text not null,
  whatsapp_number text not null,
  phone_display text not null,
  address text not null,
  updated_at timestamptz not null default now()
);

alter table public.company_settings enable row level security;

drop policy if exists "company settings public read" on public.company_settings;

create policy "company settings public read"
  on public.company_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "company settings authenticated update" on public.company_settings;

drop policy if exists "company settings admin update" on public.company_settings;

create policy "company settings admin update"
  on public.company_settings
  for update
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

insert into public.company_settings (
  id,
  brand_name,
  tagline,
  email,
  whatsapp_number,
  phone_display,
  address
)
values (
  1,
  'POTEXIA',
  'TECHNOLOGY & BUSINESS SOLUTIONS',
  'ezwanali@gmail.com',
  '6287782680897',
  '0877-8268-0897',
  'Dasan Lekong, Desa Bujak, Kecamatan Batukliang, Kabupaten Lombok Tengah, Provinsi NTB'
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('portfolio-images', 'portfolio-images', true)
on conflict (id) do update set public = true;

drop policy if exists "portfolio public read" on storage.objects;

create policy "portfolio public read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'portfolio-images');

drop policy if exists "portfolio authenticated upload" on storage.objects;
drop policy if exists "portfolio authenticated update" on storage.objects;
drop policy if exists "portfolio authenticated delete" on storage.objects;

drop policy if exists "portfolio admin upload" on storage.objects;
drop policy if exists "portfolio admin update" on storage.objects;
drop policy if exists "portfolio admin delete" on storage.objects;

create policy "portfolio admin upload"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'portfolio-images'
    and (select auth.uid()) is not null
  );

create policy "portfolio admin update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'portfolio-images'
    and (select auth.uid()) is not null
  )
  with check (
    bucket_id = 'portfolio-images'
    and (select auth.uid()) is not null
  );

create policy "portfolio admin delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'portfolio-images'
    and (select auth.uid()) is not null
  );

create table if not exists public.consultation_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business text not null,
  segment text not null,
  service text not null,
  location text not null,
  notes text not null default '',
  locale text not null default 'id',
  status text not null default 'new' check (status in ('new', 'processed', 'completed')),
  created_at timestamptz not null default now()
);

alter table public.consultation_requests enable row level security;

drop policy if exists "consultation public insert" on public.consultation_requests;
drop policy if exists "consultation admin read" on public.consultation_requests;
drop policy if exists "consultation admin update" on public.consultation_requests;
drop policy if exists "consultation admin delete" on public.consultation_requests;

create policy "consultation public insert"
  on public.consultation_requests
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "consultation admin read" on public.consultation_requests;
drop policy if exists "consultation admin update" on public.consultation_requests;
drop policy if exists "consultation admin delete" on public.consultation_requests;

create policy "consultation admin read"
  on public.consultation_requests
  for select
  to authenticated
  using ((select auth.uid()) is not null);

create policy "consultation admin update"
  on public.consultation_requests
  for update
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

create policy "consultation admin delete"
  on public.consultation_requests
  for delete
  to authenticated
  using ((select auth.uid()) is not null);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  customer_name text not null,
  customer_address text not null default '',
  customer_phone text not null default '',
  issue_date date not null default current_date,
  due_date date,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'canceled')),
  subtotal numeric(14,2) not null default 0,
  tax_rate numeric(5,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  notes text not null default '',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.invoices enable row level security;

drop policy if exists "invoices admin select" on public.invoices;
drop policy if exists "invoices admin insert" on public.invoices;
drop policy if exists "invoices admin update" on public.invoices;
drop policy if exists "invoices admin delete" on public.invoices;

create policy "invoices admin select" on public.invoices for select to authenticated using ((select auth.uid()) is not null);
create policy "invoices admin insert" on public.invoices for insert to authenticated with check ((select auth.uid()) is not null);
create policy "invoices admin update" on public.invoices for update to authenticated using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "invoices admin delete" on public.invoices for delete to authenticated using ((select auth.uid()) is not null);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.invoice_items enable row level security;

drop policy if exists "invoice items admin select" on public.invoice_items;
drop policy if exists "invoice items admin insert" on public.invoice_items;
drop policy if exists "invoice items admin update" on public.invoice_items;
drop policy if exists "invoice items admin delete" on public.invoice_items;

create policy "invoice items admin select" on public.invoice_items for select to authenticated using ((select auth.uid()) is not null);
create policy "invoice items admin insert" on public.invoice_items for insert to authenticated with check ((select auth.uid()) is not null);
create policy "invoice items admin update" on public.invoice_items for update to authenticated using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "invoice items admin delete" on public.invoice_items for delete to authenticated using ((select auth.uid()) is not null);

create table if not exists public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('income', 'expense')),
  amount numeric(14,2) not null check (amount >= 0),
  category text not null,
  description text not null default '',
  transaction_date date not null default current_date,
  reference_type text not null default 'manual' check (reference_type in ('manual', 'invoice')),
  reference_id uuid,
  created_at timestamptz not null default now()
);

alter table public.finance_transactions enable row level security;

drop policy if exists "finance admin select" on public.finance_transactions;
drop policy if exists "finance admin insert" on public.finance_transactions;
drop policy if exists "finance admin update" on public.finance_transactions;
drop policy if exists "finance admin delete" on public.finance_transactions;

create policy "finance admin select" on public.finance_transactions for select to authenticated using ((select auth.uid()) is not null);
create policy "finance admin insert" on public.finance_transactions for insert to authenticated with check ((select auth.uid()) is not null);
create policy "finance admin update" on public.finance_transactions for update to authenticated using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "finance admin delete" on public.finance_transactions for delete to authenticated using ((select auth.uid()) is not null);
