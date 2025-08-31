-- Create a table for storing images as base64 data when storage service is unavailable
CREATE TABLE IF NOT EXISTS public.image_storage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    base64_data TEXT NOT NULL,
    bucket_name TEXT DEFAULT 'meal-pictures',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_image_storage_filename ON public.image_storage(filename);
CREATE INDEX IF NOT EXISTS idx_image_storage_bucket ON public.image_storage(bucket_name);
CREATE INDEX IF NOT EXISTS idx_image_storage_created_by ON public.image_storage(created_by);

-- Create RLS policies
ALTER TABLE public.image_storage ENABLE ROW LEVEL SECURITY;

-- Allow public read access to images
CREATE POLICY "Public read access to images" ON public.image_storage
FOR SELECT USING (true);

-- Allow authenticated users to insert images
CREATE POLICY "Authenticated users can insert images" ON public.image_storage
FOR INSERT WITH CHECK (auth.role() IS NOT NULL);

-- Allow users to update their own images
CREATE POLICY "Users can update their own images" ON public.image_storage
FOR UPDATE USING (auth.uid() = created_by);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own images" ON public.image_storage
FOR DELETE USING (auth.uid() = created_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_image_storage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_image_storage_updated_at 
    BEFORE UPDATE ON public.image_storage 
    FOR EACH ROW 
    EXECUTE FUNCTION update_image_storage_updated_at();
