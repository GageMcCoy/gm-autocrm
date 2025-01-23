-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON users;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users"
ON users
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users"
ON users
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  auth.uid() = id
); 