-- Add tracking columns to print_orders
ALTER TABLE print_orders 
ADD COLUMN IF NOT EXISTS shipping_carrier TEXT,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS tracking_url TEXT;

-- Index tracking number for potentially searching shipments
CREATE INDEX IF NOT EXISTS idx_print_orders_tracking_number ON print_orders(tracking_number);
