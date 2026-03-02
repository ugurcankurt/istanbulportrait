-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  name JSONB NOT NULL,
  description JSONB NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  price DECIMAL(10,2) NOT NULL,
  features JSONB NOT NULL,
  is_popular BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY DEFAULT ('booking_' || EXTRACT(EPOCH FROM NOW()) * 1000)::TEXT,
  package_id TEXT NOT NULL REFERENCES packages(id),
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  total_amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY DEFAULT ('payment_' || EXTRACT(EPOCH FROM NOW()) * 1000)::TEXT,
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  payment_id TEXT NOT NULL, -- Iyzico payment ID
  conversation_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'pending')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  provider TEXT DEFAULT 'iyzico',
  provider_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table for future use
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY DEFAULT ('customer_' || EXTRACT(EPOCH FROM NOW()) * 1000)::TEXT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default packages
INSERT INTO packages (id, name, description, duration, price, features, is_popular) VALUES
(
  'essential',
  '{"en": "Essential", "ar": "الأساسي", "ru": "Базовый", "es": "Esencial"}',
  '{"en": "Perfect for individuals or couples", "ar": "مثالي للأفراد أو الأزواج", "ru": "Идеально для отдельных лиц или пар", "es": "Perfecto para individuos o parejas"}',
  30,
  150.00,
  '["15-20 edited photos", "Basic retouching", "Online gallery", "Personal usage rights"]',
  false
),
(
  'premium',
  '{"en": "Premium", "ar": "المتميز", "ru": "Премиум", "es": "Premium"}',
  '{"en": "Most popular choice for special occasions", "ar": "الخيار الأكثر شعبية للمناسبات الخاصة", "ru": "Самый популярный выбор для особых случаев", "es": "Opción más popular para ocasiones especiales"}',
  90,
  280.00,
  '["40-50 edited photos", "Professional retouching", "Multiple locations", "Online gallery", "Print release", "Rush delivery available"]',
  true
),
(
  'luxury',
  '{"en": "Luxury", "ar": "الفاخر", "ru": "Люкс", "es": "Lujo"}',
  '{"en": "Ultimate photography experience", "ar": "تجربة التصوير المطلقة", "ru": "Максимальный фотографический опыт", "es": "Experiencia fotográfica definitiva"}',
  150,
  450.00,
  '["80-100 edited photos", "Advanced retouching", "Multiple outfit changes", "Multiple locations", "Professional styling tips", "Online gallery", "Print release", "Same day preview"]',
  false
),
(
  'rooftop',
  '{"en": "Rooftop Special", "ar": "خاص بالسطح", "ru": "Специальная крыша", "es": "Especial Azotea"}',
  '{"en": "Exclusive rooftop locations with stunning city views", "ar": "مواقع حصرية على الأسطح مع إطلالات مذهلة على المدينة", "ru": "Эксклюзивные локации на крышах с потрясающими видами на город", "es": "Ubicaciones exclusivas en azoteas con vistas impresionantes de la ciudad"}',
  120,
  150.00,
  '["60-70 edited photos", "Exclusive rooftop access", "Golden hour timing", "Professional retouching", "Online gallery", "Print release", "Drone shots (weather permitting)"]',
  false
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(user_email);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Enable Row Level Security
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policies for packages (public read access)
CREATE POLICY "Packages are viewable by everyone" ON packages
  FOR SELECT USING (true);

-- Create policies for bookings (users can view their own bookings)
CREATE POLICY "Users can insert their own bookings" ON bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (user_email = auth.jwt() ->> 'email' OR auth.role() = 'service_role');

CREATE POLICY "Service role can update bookings" ON bookings
  FOR UPDATE USING (auth.role() = 'service_role');

-- Create policies for payments (service role access)
CREATE POLICY "Service role can manage payments" ON payments
  FOR ALL USING (auth.role() = 'service_role');

-- Create policies for customers
CREATE POLICY "Users can view their own customer data" ON customers
  FOR SELECT USING (email = auth.jwt() ->> 'email' OR auth.role() = 'service_role');

CREATE POLICY "Service role can manage customers" ON customers
  FOR ALL USING (auth.role() = 'service_role');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();