-- 1. Add country_code to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'TR'::text NOT NULL;

-- 2. Drop the existing view
DROP VIEW IF EXISTS public.google_ads_conversions_view CASCADE;

-- 3. Recreate the view using the new country_code column
CREATE OR REPLACE VIEW public.google_ads_conversions_view AS
SELECT 
    b.id::text AS transaction_id,
    'Purchase'::text AS conversion_name,
    to_char(b.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"+00:00"') AS conversion_time,
    b.total_amount AS conversion_value,
    'EUR'::text AS conversion_currency,
    COALESCE(b.gclid, '')::text AS google_click_id,
    COALESCE(b.gbraid, '')::text AS gbraid,
    COALESCE(b.wbraid, '')::text AS wbraid,
    COALESCE(b.ip_address, '')::text AS ip_address,
    -- Google Enhanced Conversions SHA-256 e-posta hash'leme (Hex)
    CASE 
        WHEN b.user_email IS NOT NULL AND b.user_email <> '' 
        THEN encode(extensions.digest(lower(trim(b.user_email))::bytea, 'sha256'), 'hex')
        ELSE NULL 
    END AS email,
    -- E.164 uluslararası telefon SHA-256 hash'leme (Hex)
    CASE 
        WHEN b.user_phone IS NOT NULL AND b.user_phone <> '' 
        THEN encode(extensions.digest(regexp_replace(b.user_phone, '[^\d+]', '', 'g')::bytea, 'sha256'), 'hex')
        ELSE NULL 
    END AS phone_number,
    -- Ad (First Name) SHA-256 hash'leme (Hex)
    CASE 
        WHEN b.user_name IS NOT NULL AND b.user_name <> '' 
        THEN encode(extensions.digest(lower(trim(split_part(trim(b.user_name), ' ', 1)))::bytea, 'sha256'), 'hex')
        ELSE NULL 
    END AS first_name,
    -- Soyadı (Last Name) SHA-256 hash'leme (Hex)
    CASE 
        WHEN b.user_name IS NOT NULL AND position(' ' in trim(b.user_name)) > 0 
        THEN encode(extensions.digest(lower(trim(substring(trim(b.user_name) from position(' ' in trim(b.user_name)) + 1)))::bytea, 'sha256'), 'hex')
        ELSE NULL 
    END AS last_name,
    -- Ülke Kodu (Artık veritabanından direkt geliyor)
    b.country_code::text AS country_code,
    -- Posta Kodu (İstanbul stüdyo merkez posta kodu)
    '34000'::text AS postal_code
FROM public.bookings b
WHERE b.status IN ('confirmed', 'completed')
  AND b.updated_at >= (NOW() - INTERVAL '90 days');

-- Grant select permission
GRANT SELECT ON public.google_ads_conversions_view TO postgres, authenticated, service_role;
