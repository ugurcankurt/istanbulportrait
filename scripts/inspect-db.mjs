import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectDb() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .limit(1);
    
  console.log("Customers:", data);
}

inspectDb();
