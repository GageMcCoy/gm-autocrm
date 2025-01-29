-- Add new columns to tickets table
alter table tickets
add column if not exists priority text default 'medium',
add column if not exists priority_reason text,
add column if not exists requires_more_info boolean default false;

-- Update messages table
alter table ticket_messages
add column if not exists is_system_message boolean default false,
add column if not exists suggested_questions text[] default array[]::text[],
add column if not exists referenced_articles jsonb[] default array[]::jsonb[];

-- Create enum for ticket priority
do $$ begin
    create type ticket_priority as enum ('low', 'medium', 'high', 'urgent');
exception
    when duplicate_object then null;
end $$;

-- Convert priority column to use enum
alter table tickets 
alter column priority type ticket_priority 
using priority::ticket_priority; 