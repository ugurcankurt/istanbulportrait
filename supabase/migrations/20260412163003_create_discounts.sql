-- Create discounts system table

CREATE TABLE IF NOT EXISTS public.discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- e.g., "Kış İndirimi"
    discount_percentage NUMERIC NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 1), -- e.g., 0.10 for 10%
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS execution for discounts
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

-- Allow read access to all users
CREATE POLICY "Allow public read access to discounts"
    ON public.discounts FOR SELECT
    USING (true);

-- Allow full access to authenticated admins (using existing auth flow)
CREATE POLICY "Allow admins full access to discounts"
    ON public.discounts FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Ensure only one is_active discount can exist at a time (Optional but recommended for strict seasonal campaigns)
CREATE UNIQUE INDEX IF NOT EXISTS one_active_discount_idx 
    ON public.discounts (is_active) 
    WHERE is_active = true;

-- Default Data (insert a passive winter discount as placeholder)
INSERT INTO public.discounts (name, discount_percentage, is_active)
VALUES ('Winter Discount', 0.20, false)
ON CONFLICT DO NOTHING;
