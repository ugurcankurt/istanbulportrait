import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, created_at, status, total_amount, package_id, gclid, applied_promo_code')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (bookingsError) {
    console.error("Bookings error:", bookingsError);
  } else {
    console.log("Recent Bookings:");
    console.log(JSON.stringify(bookings, null, 2));
  }
  
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('id, created_at, status, amount, provider')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (paymentsError) {
    console.error("Payments error:", paymentsError);
  } else {
    console.log("Recent Payments:");
    console.log(JSON.stringify(payments, null, 2));
  }
}

main();
