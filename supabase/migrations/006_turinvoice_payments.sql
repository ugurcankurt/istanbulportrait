-- =============================================
-- Turinvoice Payment Support
-- Created: 2025-12-03
-- Description: Add Turinvoice-specific fields to payments table
-- =============================================

-- Add Turinvoice-specific columns to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_order_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_url TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- Create index for faster lookups by provider order ID
CREATE INDEX IF NOT EXISTS idx_payments_provider_order_id 
  ON payments(provider_order_id);

-- Add comments for documentation
COMMENT ON COLUMN payments.provider_order_id IS 'External payment provider order ID (e.g., Turinvoice order ID)';
COMMENT ON COLUMN payments.payment_url IS 'Payment URL for customer to complete payment';
COMMENT ON COLUMN payments.qr_code_url IS 'QR code URL for mobile payment (optional)';
