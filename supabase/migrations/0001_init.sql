-- Studio Spark — Phase 1 schema (prospect DB, secret-shop tracker, pipeline,
-- outreach drafts). Every table carries owner_id + an RLS policy scoped to
-- auth.uid(), even though there's only one user today — this is what lets
-- Phase 3 add per-studio accounts later with zero migration pain.
--
-- Run this against your Supabase project via the SQL Editor, or with the
-- Supabase CLI (`supabase db push`) once you've linked the project. See
-- README.md "Supabase setup" for the full checklist.

create extension if not exists "pgcrypto";

-- Reusable updated_at trigger ------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- franchise_brands ------------------------------------------------------------

create table franchise_brands (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  brand_name text not null,
  match_patterns text[] not null default '{}',
  always_exclude boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger franchise_brands_set_updated_at
  before update on franchise_brands
  for each row execute function set_updated_at();

-- Defense in depth: btone can never be un-excluded or deleted via SQL, even
-- if a future UI bug tries to let someone edit it. The app layer
-- (lib/franchise-list.ts) also hard-codes this, independently of the DB.
create or replace function protect_btone_exclusion()
returns trigger as $$
begin
  if old.brand_name ilike '%btone%' then
    if tg_op = 'DELETE' then
      raise exception 'btone FITNESS exclusion cannot be deleted (conflict of interest rule)';
    end if;
    if new.always_exclude is distinct from true or new.brand_name not ilike '%btone%' then
      raise exception 'btone FITNESS must always stay excluded (conflict of interest rule)';
    end if;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger franchise_brands_protect_btone
  before update or delete on franchise_brands
  for each row execute function protect_btone_exclusion();

alter table franchise_brands enable row level security;

create policy "owner can manage their franchise_brands"
  on franchise_brands for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- studios ---------------------------------------------------------------------

create table studios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  name text not null,
  address text,
  neighborhood text check (neighborhood in (
    'downtown_peninsula','mount_pleasant','west_ashley','james_island',
    'daniel_island','north_charleston_park_circle','summerville','other'
  )),
  phone text,
  website text,
  instagram_handle text,
  category text check (category in (
    'pilates','yoga','barre','strength','cycle','hiit','other'
  )),
  rating numeric(2,1),
  review_count integer,
  google_place_id text,
  is_franchise boolean not null default false,
  franchise_brand text,
  booking_platform text check (booking_platform in (
    'mindbody','momence','mariana_tek','walla','glofox','wellnessliving',
    'arketa','vagaro','zen_planner','pushpress','other','unknown'
  )),
  booking_platform_source text not null default 'auto' check (booking_platform_source in ('auto','manual')),
  on_classpass boolean,
  intro_offer text,
  class_price numeric(10,2),
  estimated_size text check (estimated_size in ('small','medium','large')),
  notes text,
  pipeline_stage text not null default 'researched' check (pipeline_stage in (
    'researched','secret_shopped','contacted','meeting_booked','pilot','paying','lost'
  )),
  lost_reason text,
  next_action text,
  next_action_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index studios_owner_place_id_key
  on studios(owner_id, google_place_id)
  where google_place_id is not null;
create index studios_pipeline_stage_idx on studios(pipeline_stage);
create index studios_next_action_date_idx on studios(next_action_date);

create trigger studios_set_updated_at
  before update on studios
  for each row execute function set_updated_at();

alter table studios enable row level security;

create policy "owner can manage their studios"
  on studios for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- secret_shop_logs --------------------------------------------------------------

create table secret_shop_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  studio_id uuid not null references studios(id) on delete cascade,
  channel text not null check (channel in ('web_form','instagram_dm','phone','email')),
  sent_at timestamptz not null,
  first_reply_at timestamptz,
  replied_within_72h boolean,
  reply_quality smallint check (reply_quality between 1 and 5),
  offered_booking boolean,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index secret_shop_logs_studio_id_idx on secret_shop_logs(studio_id);
create index secret_shop_logs_channel_idx on secret_shop_logs(channel);

create trigger secret_shop_logs_set_updated_at
  before update on secret_shop_logs
  for each row execute function set_updated_at();

alter table secret_shop_logs enable row level security;

create policy "owner can manage their secret_shop_logs"
  on secret_shop_logs for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- pipeline_activities -------------------------------------------------------------

create table pipeline_activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  studio_id uuid not null references studios(id) on delete cascade,
  type text not null check (type in ('stage_change','note','call','email','meeting')),
  note text,
  previous_stage text,
  new_stage text,
  created_at timestamptz not null default now()
);

create index pipeline_activities_studio_id_idx on pipeline_activities(studio_id);

alter table pipeline_activities enable row level security;

create policy "owner can manage their pipeline_activities"
  on pipeline_activities for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- outreach_drafts -----------------------------------------------------------------

create table outreach_drafts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  studio_id uuid not null references studios(id) on delete cascade,
  sequence_step smallint not null check (sequence_step in (0, 3, 7, 14)), -- 0 = initial cold email
  subject text not null,
  body text not null,
  status text not null default 'draft' check (status in ('draft','approved','sent','skipped')),
  approved_at timestamptz,
  sent_at timestamptz,
  provider_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index outreach_drafts_studio_id_idx on outreach_drafts(studio_id);
create index outreach_drafts_status_idx on outreach_drafts(status);

create trigger outreach_drafts_set_updated_at
  before update on outreach_drafts
  for each row execute function set_updated_at();

alter table outreach_drafts enable row level security;

create policy "owner can manage their outreach_drafts"
  on outreach_drafts for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- suppression_list ------------------------------------------------------------------

create table suppression_list (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  email text not null,
  reason text not null default 'unsubscribed' check (reason in ('unsubscribed','bounced','manual','complaint')),
  created_at timestamptz not null default now()
);

create unique index suppression_list_owner_email_key on suppression_list(owner_id, email);

alter table suppression_list enable row level security;

create policy "owner can manage their suppression_list"
  on suppression_list for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- revenue_leak_assumptions -----------------------------------------------------------

create table revenue_leak_assumptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  studio_id uuid references studios(id) on delete cascade, -- null = global default
  leads_per_month numeric(10,2) not null default 30,
  close_rate_with_fast_response numeric(4,3) not null default 0.35,
  close_rate_with_actual_response numeric(4,3) not null default 0.20,
  monthly_membership_price numeric(10,2) not null default 150,
  avg_months_retained numeric(5,2) not null default 8,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index revenue_leak_assumptions_owner_studio_key
  on revenue_leak_assumptions(owner_id, studio_id);

create trigger revenue_leak_assumptions_set_updated_at
  before update on revenue_leak_assumptions
  for each row execute function set_updated_at();

alter table revenue_leak_assumptions enable row level security;

create policy "owner can manage their revenue_leak_assumptions"
  on revenue_leak_assumptions for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
