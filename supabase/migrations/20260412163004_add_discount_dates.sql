-- Add date ranges to discounts
ALTER TABLE public.discounts
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;
