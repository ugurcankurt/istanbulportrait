-- Availability System

-- 1. Create availability_settings table to store global boundaries
CREATE TABLE IF NOT EXISTS public.availability_settings (
  id text PRIMARY KEY DEFAULT 'default',
  start_time text NOT NULL DEFAULT '06:00',
  end_time text NOT NULL DEFAULT '20:00',
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Ensure there is a default row
INSERT INTO public.availability_settings (id, start_time, end_time)
VALUES ('default', '06:00', '20:00')
ON CONFLICT (id) DO NOTHING;

-- 2. Create blocked_slots table
-- A row can either block an entire day (time is NULL) or a specific time on a date.
CREATE TABLE IF NOT EXISTS public.blocked_slots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  time text,
  reason text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Triggers for updated_at tracking
CREATE OR REPLACE FUNCTION public.handle_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_availability_settings_updated_at
  BEFORE UPDATE ON public.availability_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_availability_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Row Level Security (RLS)
ALTER TABLE public.availability_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admin All Access Availability Settings" ON public.availability_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin All Access Blocked Slots" ON public.blocked_slots FOR ALL USING (auth.role() = 'authenticated');

-- Public users can read
CREATE POLICY "Public Read Availability Settings" ON public.availability_settings FOR SELECT USING (true);
CREATE POLICY "Public Read Blocked Slots" ON public.blocked_slots FOR SELECT USING (true);
