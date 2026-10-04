-- Phase 2 core schema: studio configuration (what the AI agent is allowed
-- to say), conversations + messages (chat widget threads), and bookings
-- (via the mock BookingProvider). Separate from the Phase 1 `studios`
-- table on purpose — `studios` is the sales-pipeline record, these are
-- the actual product config once a studio is a customer. RLS follows the
-- same owner_id = auth.uid() pattern as every other table; conversations/
-- messages are also written by anonymous chat-widget visitors via the
-- admin client (bypassing RLS) in the API route, same approach as the
-- public /unsubscribe page from Phase 1.

create table studio_configs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  studio_id uuid not null references studios(id) on delete cascade,
  brand_voice text,
  class_types jsonb not null default '[]',
  schedule jsonb not null default '[]',
  intro_offer text,
  pricing jsonb not null default '[]',
  faqs jsonb not null default '[]',
  cancellation_policy text,
  late_arrival_policy text,
  location_parking text,
  escalation_contact_name text,
  escalation_contact_phone text,
  escalation_contact_email text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index studio_configs_owner_studio_key on studio_configs(owner_id, studio_id);

create trigger studio_configs_set_updated_at
  before update on studio_configs
  for each row execute function set_updated_at();

alter table studio_configs enable row level security;

create policy "owner can manage their studio_configs"
  on studio_configs for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- conversations -----------------------------------------------------------

create table conversations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  studio_config_id uuid not null references studio_configs(id) on delete cascade,
  channel text not null default 'chat_widget' check (channel in ('chat_widget')),
  contact_name text,
  contact_identifier text not null, -- anonymous session id for the chat widget today
  status text not null default 'active' check (status in ('active', 'handed_off', 'closed')),
  consent_given boolean not null default false,
  consent_source text,
  consent_timestamp timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index conversations_studio_config_id_idx on conversations(studio_config_id);

create trigger conversations_set_updated_at
  before update on conversations
  for each row execute function set_updated_at();

alter table conversations enable row level security;

create policy "owner can manage their conversations"
  on conversations for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- messages ------------------------------------------------------------------

create table messages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  conversation_id uuid not null references conversations(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  sender text not null check (sender in ('lead', 'ai', 'owner')),
  body text not null,
  created_at timestamptz not null default now()
);

create index messages_conversation_id_idx on messages(conversation_id);

alter table messages enable row level security;

create policy "owner can manage their messages"
  on messages for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- bookings --------------------------------------------------------------------

create table bookings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  studio_config_id uuid not null references studio_configs(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete set null,
  lead_name text not null,
  lead_contact text,
  class_name text not null,
  class_datetime timestamptz not null,
  status text not null default 'booked' check (status in ('booked', 'attended', 'no_show', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_studio_config_id_idx on bookings(studio_config_id);

create trigger bookings_set_updated_at
  before update on bookings
  for each row execute function set_updated_at();

alter table bookings enable row level security;

create policy "owner can manage their bookings"
  on bookings for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
