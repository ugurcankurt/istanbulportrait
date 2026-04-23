import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectProviderResponse() {
  const { data, error } = await supabase
    .from('payments')
    .select('provider_response')
    .not('provider_response', 'is', null)
    .limit(1);
    
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log(JSON.stringify(data[0].provider_response, null, 2));
  } else {
    console.log("No provider response found");
  }
}

inspectProviderResponse();
