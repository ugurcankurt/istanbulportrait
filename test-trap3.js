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
  const { data } = await supabase.from("bookings").select("octo_data, id, status, created_at").eq("id", "booking_1777703638710.453000");
  for (const b of data) {
    console.log("-------------------");
    console.log("ID:", b.id);
    console.log("RAW_QUERY:", JSON.stringify(b.octo_data?.RAW_QUERY, null, 2));
    console.log("RAW_HEADERS:", JSON.stringify(b.octo_data?.RAW_HEADERS, null, 2));
  }
}

check();
