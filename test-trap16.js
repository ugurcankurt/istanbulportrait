const { createClient } = require("@supabase/supabase-js");
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  if (line.includes('=')) {
    const parts = line.split('=');
    env[parts[0]] = parts.slice(1).join('=').replace(/"/g, '');
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY);

async function check() {
  const { data } = await supabase.from("bookings").select("id, status, created_at, octo_data").order("created_at", { ascending: false }).limit(5);
  for (const b of data) {
    console.log(`[${b.created_at}] ID: ${b.id}`);
    console.log("RAW_BODY:", JSON.stringify(b.octo_data?.RAW_BODY));
    console.log("RAW_QUERY:", JSON.stringify(b.octo_data?.RAW_QUERY));
    console.log("RAW_HEADERS:", JSON.stringify(b.octo_data?.RAW_HEADERS));
    console.log("RAW_PATCH_BODY:", JSON.stringify(b.octo_data?.RAW_PATCH_BODY));
    console.log("RAW_CONFIRM_BODY:", JSON.stringify(b.octo_data?.RAW_CONFIRM_BODY));
    console.log("-------------------");
  }
}

check();
