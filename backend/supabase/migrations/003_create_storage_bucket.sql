-- Create the meal-pictures storage bucket for image uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meal-pictures',
  'meal-pictures',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Create RLS policies for the meal-pictures bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'meal-pictures');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'meal-pictures' AND auth.role() IN ('admin', 'cook'));
CREATE POLICY "Authenticated users can update" ON storage.objects FOR UPDATE USING (bucket_id = 'meal-pictures' AND auth.role() IN ('admin', 'cook'));
CREATE POLICY "Authenticated users can delete" ON storage.objects FOR DELETE USING (bucket_id = 'meal-pictures' AND auth.role() IN ('admin', 'cook'));
