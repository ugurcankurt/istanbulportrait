-- 1. Create promo_codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  discount_percentage numeric(5,2) NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  is_active boolean DEFAULT true NOT NULL,
  max_uses integer,
  current_uses integer DEFAULT 0 NOT NULL,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Add reference in bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS applied_promo_code text;

-- 3. Set up triggers
DO $$ BEGIN
  CREATE TRIGGER set_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enable RLS so we can query them securely using supabase client if needed, or by admin
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.promo_codes FOR SELECT USING (true);
CREATE POLICY "Enable all access for admins only" ON public.promo_codes FOR ALL USING (auth.role() = 'service_role');

-- Reload schema
NOTIFY pgrst, 'reload schema';
