-- First, ensure the column exists
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS sender_name text;

-- Then, ensure the column allows null values
ALTER TABLE messages 
ALTER COLUMN sender_name DROP NOT NULL;

-- Update existing messages with appropriate sender names
UPDATE messages
SET sender_name = CASE
    WHEN sender_id::text LIKE '%ai-assistant%' THEN 'AI Assistant'
    ELSE (
        SELECT name 
        FROM users 
        WHERE users.id = messages.sender_id
    )
END
WHERE sender_name IS NULL; 