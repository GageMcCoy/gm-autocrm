-- Insert AI Assistant into users table if it doesn't exist
INSERT INTO public.users (id, name, role, email, password_hash)
VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'AI Assistant',
    'System',
    'ai-assistant@system.local',
    '!system-user-no-login!' -- Special password hash that can never be used to login
)
ON CONFLICT (id) DO UPDATE
SET 
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash;

-- Ensure the AI Assistant user can bypass RLS
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

CREATE POLICY "Allow access to AI Assistant user"
    ON public.users
    FOR ALL
    USING (
        auth.uid() = id OR 
        id = '00000000-0000-0000-0000-000000000000'::uuid
    ); 