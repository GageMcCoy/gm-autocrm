-- Add priority_reason column to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS priority_reason text;

-- Update existing tickets to have a default reason
UPDATE tickets 
SET priority_reason = 'Default priority reason for existing ticket'
WHERE priority_reason IS NULL; 