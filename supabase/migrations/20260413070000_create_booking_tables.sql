-- Create basic booking missing tables

-- 1. Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  phone text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id uuid REFERENCES public.packages(id) ON DELETE RESTRICT NOT NULL,
  user_name text NOT NULL,
  user_email text NOT NULL,
  user_phone text NOT NULL,
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  total_amount numeric(10,2) NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  payment_id text NOT NULL,
  conversation_id text NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL CHECK (status IN ('success', 'failure', 'pending')),
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'TRY'::text NOT NULL,
  provider text DEFAULT 'cash'::text NOT NULL,
  provider_response jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. Create admin_dashboard_stats view
CREATE OR REPLACE VIEW public.admin_dashboard_stats AS
SELECT
  'dashboard_stats' AS id,
  (SELECT COUNT(*) FROM public.bookings) AS total_bookings,
  (SELECT COUNT(*) FROM public.bookings WHERE status = 'pending') AS pending_bookings,
  (SELECT COUNT(*) FROM public.bookings WHERE status = 'confirmed') AS confirmed_bookings,
  (SELECT COUNT(*) FROM public.bookings WHERE status = 'cancelled') AS cancelled_bookings,
  (SELECT COALESCE(SUM(total_amount), 0) FROM public.bookings WHERE status IN ('confirmed', 'completed')) AS total_revenue,
  (SELECT COALESCE(SUM(total_amount), 0) FROM public.bookings WHERE status IN ('confirmed', 'completed') AND booking_date >= date_trunc('month', CURRENT_DATE)) AS monthly_revenue,
  (SELECT COUNT(*) FROM public.customers) AS total_customers,
  (SELECT COUNT(*) FROM public.payments) AS total_payments,
  (SELECT COUNT(*) FROM public.payments WHERE status = 'success') AS successful_payments,
  (SELECT COUNT(*) FROM public.payments WHERE status = 'failure') AS failed_payments,
  now() AS updated_at;

-- 5. Set up Row Level Security (RLS)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admin All Access Customers" ON public.customers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin All Access Bookings" ON public.bookings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin All Access Payments" ON public.payments FOR ALL USING (auth.role() = 'authenticated');

-- Public users can insert
CREATE POLICY "Public Insert Customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Payments" ON public.payments FOR INSERT WITH CHECK (true);

-- Public users can read their bookings via a loose check or service key
CREATE POLICY "Public Read Own Bookings" ON public.bookings FOR SELECT USING (true);
