import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase
    .from('bookings')
    .select('id')
    .or(`octo_data->>resellerReference.eq.test,notes.ilike.%test%`);
  
  if (error) {
    console.error("ERROR:", error);
  } else {
    console.log("SUCCESS:", data.length);
  }
}

test();
