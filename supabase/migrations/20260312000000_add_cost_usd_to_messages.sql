-- Add cost_usd column to messages table for tracking AI cost per message.
-- Used by the revenue analytics dashboard to calculate unit economics.

alter table messages add column if not exists cost_usd numeric(10, 6);

-- Index for aggregating costs by conversation
create index if not exists idx_messages_cost on messages (conversation_id) where cost_usd is not null;

comment on column messages.cost_usd is 'Estimated AI cost in USD for this response, calculated from token usage and model tier';
