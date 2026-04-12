-- Rate Limits Table for Next.js API Protection
-- Run this in your Supabase SQL Editor to resolve the PGRST205 errors

CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimize queries since checkRateLimit constantly filters by these
CREATE INDEX IF NOT EXISTS rate_limits_identifier_idx ON public.rate_limits(identifier);
CREATE INDEX IF NOT EXISTS rate_limits_window_start_idx ON public.rate_limits(window_start);

-- Enable Row Level Security (RLS)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Note: No policies are added because this table is exclusively 
-- accessed by the backend Server with the SUPABASE_SERVICE_KEY (supabaseAdmin), 
-- which automatically bypasses RLS. Client access is strictly forbidden.
