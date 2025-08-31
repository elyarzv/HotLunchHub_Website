-- Add picture_urls field to meals table to support multiple images
-- This field will store an array of image URLs

-- Add the picture_urls column as a text array
ALTER TABLE public.meals 
ADD COLUMN picture_urls TEXT[] DEFAULT '{}';

-- Add the cook_id column if it doesn't exist (needed for the relationship)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'meals' AND column_name = 'cook_id') THEN
        ALTER TABLE public.meals ADD COLUMN cook_id INTEGER;
        
        -- Add foreign key constraint to cooks table
        ALTER TABLE public.meals 
        ADD CONSTRAINT fk_meals_cook_id 
        FOREIGN KEY (cook_id) REFERENCES public.cooks(cook_id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index on picture_urls for better query performance
CREATE INDEX IF NOT EXISTS idx_meals_picture_urls ON public.meals USING GIN (picture_urls);

-- Update existing meals to have empty picture_urls array
UPDATE public.meals SET picture_urls = '{}' WHERE picture_urls IS NULL;

-- Make sure the column is not null
ALTER TABLE public.meals ALTER COLUMN picture_urls SET NOT NULL;
ALTER TABLE public.meals ALTER COLUMN picture_urls SET DEFAULT '{}';
