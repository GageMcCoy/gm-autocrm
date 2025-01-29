-- Create a table for system users
CREATE TABLE IF NOT EXISTS public.system_users (
    id uuid PRIMARY KEY,
    name text NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert AI Assistant
INSERT INTO public.system_users (id, name, role)
VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'AI Assistant',
    'System'
)
ON CONFLICT (id) DO UPDATE
SET 
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- Update messages table to allow system users
ALTER TABLE public.messages
DROP CONSTRAINT IF EXISTS messages_sender_id_fkey,
ADD CONSTRAINT messages_sender_id_fkey 
    FOREIGN KEY (sender_id) 
    REFERENCES public.users(id)
    ON DELETE CASCADE
    DEFERRABLE INITIALLY DEFERRED;

-- Add a trigger to validate sender_id against both users and system_users
CREATE OR REPLACE FUNCTION public.validate_message_sender()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if sender exists in either users or system_users
    IF NOT EXISTS (
        SELECT 1 FROM public.users WHERE id = NEW.sender_id
        UNION
        SELECT 1 FROM public.system_users WHERE id = NEW.sender_id
    ) THEN
        RAISE EXCEPTION 'sender_id must exist in users or system_users';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_message_sender ON public.messages;
CREATE TRIGGER validate_message_sender
    BEFORE INSERT OR UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_message_sender(); 