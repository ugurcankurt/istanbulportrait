-- Improve google_ads_conversions_view for Google Ads Data Manager & Enhanced Conversions
-- 1. Use stable conversion_time (if updated_at is within 2 hours of created_at, use updated_at; otherwise use created_at so admin status updates weeks later do not shift conversion_time)
-- 2. Guarantee E.164 leading '+' before SHA-256 hashing phone_number
-- 3. Only set postal_code = '34000' when country_code = 'TR' so international tourist address matching is not invalidated by an Istanbul postal code

DROP VIEW IF EXISTS public.google_ads_conversions_view CASCADE;

CREATE OR REPLACE VIEW public.google_ads_conversions_view AS
SELECT 
    b.id::text AS transaction_id,
    'Purchase'::text AS conversion_name,
    to_char(
        (CASE 
            WHEN b.updated_at <= b.created_at + INTERVAL '2 hours' THEN b.updated_at 
            ELSE b.created_at 
        END) AT TIME ZONE 'UTC',
        'YYYY-MM-DD"T"HH24:MI:SS"+00:00"'
    ) AS conversion_time,
    b.total_amount AS conversion_value,
    'EUR'::text AS conversion_currency,
    COALESCE(b.gclid, '')::text AS google_click_id,
    COALESCE(b.gbraid, '')::text AS gbraid,
    COALESCE(b.wbraid, '')::text AS wbraid,
    COALESCE(b.ip_address, '')::text AS ip_address,
    -- Google Enhanced Conversions SHA-256 email hashing (Hex)
    CASE 
        WHEN b.user_email IS NOT NULL AND b.user_email <> '' 
        THEN encode(extensions.digest(lower(trim(b.user_email))::bytea, 'sha256'), 'hex')
        ELSE NULL 
    END AS email,
    -- Strict E.164 phone number ('+' + digits) SHA-256 hashing (Hex)
    CASE 
        WHEN b.user_phone IS NOT NULL AND regexp_replace(b.user_phone, '[^\d]', '', 'g') <> '' 
        THEN encode(extensions.digest(('+' || regexp_replace(b.user_phone, '[^\d]', '', 'g'))::bytea, 'sha256'), 'hex')
        ELSE NULL 
    END AS phone_number,
    -- First Name SHA-256 hashing (Hex)
    CASE 
        WHEN b.user_name IS NOT NULL AND b.user_name <> '' 
        THEN encode(extensions.digest(lower(trim(split_part(trim(b.user_name), ' ', 1)))::bytea, 'sha256'), 'hex')
        ELSE NULL 
    END AS first_name,
    -- Last Name SHA-256 hashing (Hex)
    CASE 
        WHEN b.user_name IS NOT NULL AND position(' ' in trim(b.user_name)) > 0 
        THEN encode(extensions.digest(lower(trim(substring(trim(b.user_name) from position(' ' in trim(b.user_name)) + 1)))::bytea, 'sha256'), 'hex')
        ELSE NULL 
    END AS last_name,
    -- ISO 2-letter Country Code
    b.country_code::text AS country_code,
    -- Postal Code: Only populate Istanbul 34000 for TR customers so foreign customer address match is not rejected
    CASE 
        WHEN b.country_code = 'TR' THEN '34000'::text
        ELSE NULL
    END AS postal_code
FROM public.bookings b
WHERE b.status IN ('confirmed', 'completed')
  AND b.created_at >= (NOW() - INTERVAL '90 days');

GRANT SELECT ON public.google_ads_conversions_view TO postgres, authenticated, service_role;

