-- Fix profiles table and add missing RLS policies
-- This migration addresses the schema differences between frontend expectations and actual database

-- 1. Add missing RLS policy for profiles table
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for profiles table
CREATE POLICY "profiles_select_all" ON "public"."profiles"
    FOR SELECT USING (true);

CREATE POLICY "profiles_insert_authenticated" ON "public"."profiles"
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "profiles_update_own" ON "public"."profiles"
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete_admin" ON "public"."profiles"
    FOR DELETE USING (auth.role() = 'admin');

-- 3. Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- 4. Ensure all tables have proper foreign key constraints
-- (These should already exist from the initial migration)

-- 5. Add any missing columns if needed (commented out as they should exist)
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- 6. Verify the schema matches expectations
-- The profiles table should have:
-- - id (uuid, primary key)
-- - role (user_role enum: 'employee', 'driver', 'employee', 'cook')
-- - full_name (text)
-- - status (text, default 'active')
-- - created_at (timestamp with time zone)
-- - updated_at (timestamp with time zone)
-- - admin_metadata (jsonb, default '{}')

-- 7. Ensure proper grants for authenticated users
GRANT SELECT ON "public"."profiles" TO "authenticated";
GRANT INSERT ON "public"."profiles" TO "authenticated";
GRANT UPDATE ON "public"."profiles" TO "authenticated";
GRANT DELETE ON "public"."profiles" TO "service_role";

-- 8. Add trigger for updated_at column if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS trigger_update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
