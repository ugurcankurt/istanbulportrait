-- Drop the unique constraint that prevents multiple discounts from being active simultaneously
DROP INDEX IF EXISTS public.one_active_discount_idx;
