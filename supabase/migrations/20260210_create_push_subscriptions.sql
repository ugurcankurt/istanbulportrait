-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id), -- Optional: Link to authenticated user if available
  subscription JSONB NOT NULL, -- The subscription object from the browser (endpoint, keys)
  user_agent TEXT,
  locale TEXT, -- specific to this project, good to know user's language
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (since users might not be logged in when accepting cookies/notifications)
-- Ideally, we might want to restrict this, but for a public site's visitor subscription, public insert is often needed.
-- Alternatively, we can use an RPC function or a signed request, but for simplicity in this context:
CREATE POLICY "Anyone can insert subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (true);

-- Only service role (admin) can view/manage all subscriptions
CREATE POLICY "Service role can manage all subscriptions" ON push_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Optional: efficient index on user_id
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
