-- MenoMind Initial Schema
-- Migration: 001_initial_schema.sql

-- ============================================================================
-- Extensions
-- ============================================================================

create extension if not exists "uuid-ossp" with schema extensions;

-- ============================================================================
-- Custom Enums
-- ============================================================================

create type menopause_stage as enum ('pre', 'peri', 'post', 'unsure');
create type subscription_tier as enum ('free', 'premium');
create type message_role as enum ('user', 'assistant');
create type plan_type as enum ('nutrition', 'exercise', 'sleep', 'stress', 'supplement');
create type plan_status as enum ('active', 'completed', 'paused');

-- ============================================================================
-- Tables
-- ============================================================================

create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  date_of_birth date,
  menopause_stage menopause_stage,
  subscription_tier subscription_tier default 'free',
  stripe_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table user_profiles (
  user_id uuid primary key references users (id) on delete cascade,
  health_conditions jsonb,
  medications jsonb,
  lifestyle_factors jsonb,
  goals text[],
  onboarding_completed boolean default false
);

create table symptom_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  date date not null,
  symptoms jsonb not null,
  notes text,
  created_at timestamptz default now(),
  constraint symptom_logs_user_date_unique unique (user_id, date)
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  title text,
  summary text,
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  role message_role not null,
  content text not null,
  tokens_used integer,
  created_at timestamptz default now()
);

create table wellness_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  plan_type plan_type not null,
  content jsonb not null,
  status plan_status default 'active',
  created_at timestamptz default now()
);

create table subscription_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  event_type text not null,
  stripe_event_id text,
  data jsonb,
  created_at timestamptz default now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

create index idx_symptom_logs_user_date on symptom_logs (user_id, date);
create index idx_conversations_user_id on conversations (user_id);
create index idx_messages_conversation_id on messages (conversation_id);
create index idx_wellness_plans_user_type on wellness_plans (user_id, plan_type);

-- ============================================================================
-- Trigger: auto-update updated_at on users
-- ============================================================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_users_updated_at
  before update on users
  for each row
  execute function update_updated_at_column();

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table users enable row level security;
alter table user_profiles enable row level security;
alter table symptom_logs enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table wellness_plans enable row level security;
alter table subscription_events enable row level security;

-- users policies
create policy "Users can view own record"
  on users for select
  using (auth.uid() = id);

create policy "Users can insert own record"
  on users for insert
  with check (auth.uid() = id);

create policy "Users can update own record"
  on users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can delete own record"
  on users for delete
  using (auth.uid() = id);

-- user_profiles policies
create policy "Users can view own profile"
  on user_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on user_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own profile"
  on user_profiles for delete
  using (auth.uid() = user_id);

-- symptom_logs policies
create policy "Users can view own symptom logs"
  on symptom_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own symptom logs"
  on symptom_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own symptom logs"
  on symptom_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own symptom logs"
  on symptom_logs for delete
  using (auth.uid() = user_id);

-- conversations policies
create policy "Users can view own conversations"
  on conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert own conversations"
  on conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own conversations"
  on conversations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own conversations"
  on conversations for delete
  using (auth.uid() = user_id);

-- messages policies (join through conversations to check ownership)
create policy "Users can view own messages"
  on messages for select
  using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

create policy "Users can insert own messages"
  on messages for insert
  with check (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

create policy "Users can update own messages"
  on messages for update
  using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

create policy "Users can delete own messages"
  on messages for delete
  using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

-- wellness_plans policies
create policy "Users can view own wellness plans"
  on wellness_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert own wellness plans"
  on wellness_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own wellness plans"
  on wellness_plans for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own wellness plans"
  on wellness_plans for delete
  using (auth.uid() = user_id);

-- subscription_events policies
create policy "Users can view own subscription events"
  on subscription_events for select
  using (auth.uid() = user_id);

create policy "Users can insert own subscription events"
  on subscription_events for insert
  with check (auth.uid() = user_id);

create policy "Users can update own subscription events"
  on subscription_events for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own subscription events"
  on subscription_events for delete
  using (auth.uid() = user_id);
