-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.messages;
DROP POLICY IF EXISTS "Enable insert for AI assistant" ON public.messages;

-- Enable RLS on messages table if not already enabled
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow authenticated users to read messages
CREATE POLICY "Enable read access for authenticated users" ON public.messages
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert messages
CREATE POLICY "Enable insert for authenticated users" ON public.messages
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        sender_id = auth.uid()
    );

-- Allow AI assistant to insert messages
CREATE POLICY "Enable insert for AI assistant" ON public.messages
    FOR INSERT
    WITH CHECK (
        sender_id = '00000000-0000-0000-0000-000000000000'::uuid
    ); 