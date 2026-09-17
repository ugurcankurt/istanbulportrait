-- Create seo_keyword_intents table
CREATE TABLE IF NOT EXISTS public.seo_keyword_intents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title JSONB NOT NULL DEFAULT '{}'::jsonb,
    description JSONB NOT NULL DEFAULT '{}'::jsonb,
    cover_image TEXT,
    related_packages TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_seo_keyword_intents_updated_at ON public.seo_keyword_intents;
CREATE TRIGGER set_seo_keyword_intents_updated_at
BEFORE UPDATE ON public.seo_keyword_intents
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Insert initial dummy data (the ones we had in code)
INSERT INTO public.seo_keyword_intents (slug, title, description, cover_image, related_packages)
VALUES 
(
  'istanbul-secret-proposal', 
  '{"en": "Istanbul Secret Proposal Photography", "tr": "İstanbul Gizli Evlilik Teklifi Çekimi", "ru": "Секретное предложение в Стамбуле Фотосессия"}'::jsonb,
  '{"en": "Capture your special moment with our discreet and professional secret proposal photography services in Istanbul.", "tr": "İstanbul''daki gizli evlilik teklifi anınızı profesyonel fotoğrafçılarımızla ölümsüzleştirin.", "ru": "Запечатлейте свой особенный момент с помощью наших скрытых и профессиональных услуг по фотосъемке предложений в Стамбуле."}'::jsonb,
  '/images/locations/ortakoy-hero.webp',
  ARRAY['secret-proposal', 'couples-photoshoot']
),
(
  'flying-dress-photoshoot',
  '{"en": "Flying Dress Photoshoot in Turkey", "tr": "Uçuşan Elbise Fotoğraf Çekimi", "ru": "Фотосессия в летящем платье в Турции"}'::jsonb,
  '{"en": "Experience the magic of a flying dress photoshoot in the most iconic locations. Feel like a goddess.", "tr": "En ikonik mekanlarda uçuşan elbise fotoğraf çekiminin büyüsünü yaşayın.", "ru": "Почувствуйте магию фотосессии в летящем платье в самых знаковых местах."}'::jsonb,
  '/images/locations/galata-tower-hero.webp',
  ARRAY['solo-photoshoot', 'couples-photoshoot']
),
(
  'solo-traveler-photography',
  '{"en": "Solo Traveler Photography in Istanbul", "tr": "Yalnız Gezginler İçin İstanbul Fotoğraf Çekimi", "ru": "Фотосъемка одиночных путешественников в Стамбуле"}'::jsonb,
  '{"en": "Traveling alone? Let our professional photographers capture your best moments exploring Istanbul.", "tr": "Yalnız mı seyahat ediyorsunuz? Profesyonel fotoğrafçılarımız İstanbul''u keşfederken en iyi anlarınızı yakalasın.", "ru": "Путешествуете в одиночку? Пусть наши профессиональные фотографы запечатлеют ваши лучшие моменты во время знакомства со Стамбулом."}'::jsonb,
  '/images/locations/hagia-sophia-hero.webp',
  ARRAY['solo-photoshoot']
)
ON CONFLICT (slug) DO NOTHING;

-- Set up Row Level Security (RLS)
ALTER TABLE public.seo_keyword_intents ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on seo_keyword_intents"
ON public.seo_keyword_intents FOR SELECT
USING (is_active = true);

-- Allow authenticated admin users to manage records (assuming standard role based auth or service role)
-- Service role bypasses RLS anyway, but if admin panel uses anon key with JWT claims:
CREATE POLICY "Allow authenticated users to manage seo_keyword_intents"
ON public.seo_keyword_intents FOR ALL
USING (auth.role() = 'authenticated');
