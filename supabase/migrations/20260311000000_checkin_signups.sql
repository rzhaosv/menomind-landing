-- Email capture for anonymous quiz users
create table if not exists public.checkin_signups (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  anonymous_session_id text,
  quiz_symptoms text[],
  quiz_level text,
  quiz_categories text[],
  created_at timestamptz default now(),
  followed_up boolean default false,
  converted_to_user boolean default false
);

-- Upsert index on email
create unique index if not exists checkin_signups_email_idx on public.checkin_signups (email);

-- No RLS needed — server-only writes
alter table public.checkin_signups enable row level security;
-- No policies = no client access, only service role / server can write
