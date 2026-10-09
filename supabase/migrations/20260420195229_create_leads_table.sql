CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    raw_data JSONB DEFAULT '{}'::jsonb,
    lead_source TEXT NOT NULL,
    campaign_id TEXT,
    form_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow insert from webhook (authenticated service role automatically bypasses RLS in api route, but just in case)
-- Anyone can theoretically insert if they have the anon key but we'll use service_role in webhook.
CREATE POLICY "Admins can view all leads" ON public.leads
    FOR SELECT USING (auth.role() = 'authenticated');
