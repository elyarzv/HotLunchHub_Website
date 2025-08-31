-- Create the meal-pictures storage bucket for image uploads
-- Run this script directly on your Supabase database

-- Check if bucket already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'meal-pictures') THEN
        -- Create the bucket
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'meal-pictures',
            'meal-pictures',
            true,
            52428800, -- 50MB limit
            ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        );
        
        RAISE NOTICE 'Storage bucket meal-pictures created successfully';
    ELSE
        RAISE NOTICE 'Storage bucket meal-pictures already exists';
    END IF;
END $$;

-- Create RLS policies for the meal-pictures bucket
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Create new policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'meal-pictures');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'meal-pictures' AND auth.role() IN ('admin', 'cook'));
CREATE POLICY "Authenticated users can update" ON storage.objects FOR UPDATE USING (bucket_id = 'meal-pictures' AND auth.role() IN ('admin', 'cook'));
CREATE POLICY "Authenticated users can delete" ON storage.objects FOR DELETE USING (bucket_id = 'meal-pictures' AND auth.role() IN ('admin', 'cook'));

-- Verify the bucket was created
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'meal-pictures';
