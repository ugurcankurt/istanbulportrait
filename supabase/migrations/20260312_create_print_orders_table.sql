-- Create print_orders table
CREATE TABLE IF NOT EXISTS print_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_line1 TEXT NOT NULL,
  shipping_line2 TEXT,
  shipping_postal_code TEXT NOT NULL,
  shipping_town_city TEXT NOT NULL,
  shipping_state_county TEXT,
  shipping_country_code TEXT NOT NULL,
  sku TEXT NOT NULL,
  image_url TEXT NOT NULL,
  copies INTEGER NOT NULL DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  prodigi_order_id TEXT,
  prodigi_status TEXT DEFAULT 'draft',
  iyzico_payment_id TEXT,
  locale TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE print_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for print_orders
-- Allow service role full access
CREATE POLICY "Service role can manage print orders" ON print_orders
  FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_print_orders_email ON print_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_print_orders_prodigi_id ON print_orders(prodigi_order_id);
CREATE INDEX IF NOT EXISTS idx_print_orders_iyzico_id ON print_orders(iyzico_payment_id);

-- Create trigger for updated_at
CREATE TRIGGER update_print_orders_updated_at BEFORE UPDATE ON print_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
