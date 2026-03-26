create table anonymous_messages (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  quiz_symptoms text[],
  quiz_level text,
  created_at timestamptz default now()
);

create index idx_anonymous_messages_session on anonymous_messages (session_id, created_at);
create index idx_anonymous_messages_created on anonymous_messages (created_at);
