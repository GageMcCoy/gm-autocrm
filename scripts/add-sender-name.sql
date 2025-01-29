-- Add sender_name column to messages table if it doesn't exist
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS sender_name text;

-- We won't set default values since the sender_name is now being set
-- at message creation time in the application code 