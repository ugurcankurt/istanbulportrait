-- Add total paid and breakdown columns to print_orders
ALTER TABLE print_orders 
ADD COLUMN IF NOT EXISTS shipping_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS order_total_amount DECIMAL(10,2) DEFAULT 0;

-- Update existing records to set order_total_amount to total_amount if zero
UPDATE print_orders SET order_total_amount = total_amount WHERE order_total_amount = 0;
