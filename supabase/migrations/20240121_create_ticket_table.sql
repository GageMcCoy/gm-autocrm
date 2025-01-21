-- Create the ticket table
CREATE TABLE IF NOT EXISTS public.ticket (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open'::TEXT,
    priority TEXT NOT NULL DEFAULT 'medium'::TEXT,
    customer_id TEXT NOT NULL,
    assigned_to TEXT,
    response TEXT,
    
    -- Add constraints for status and priority
    CONSTRAINT ticket_status_check CHECK (status IN ('open', 'in-progress', 'resolved', 'closed')),
    CONSTRAINT ticket_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

-- Set up row level security (RLS)
ALTER TABLE public.ticket ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.ticket
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.ticket
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.ticket
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX IF NOT EXISTS ticket_customer_id_idx ON public.ticket(customer_id);
CREATE INDEX IF NOT EXISTS ticket_status_idx ON public.ticket(status);
CREATE INDEX IF NOT EXISTS ticket_priority_idx ON public.ticket(priority);
CREATE INDEX IF NOT EXISTS ticket_created_at_idx ON public.ticket(created_at DESC); 