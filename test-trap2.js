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
  const { data } = await supabase.from("bookings").select("octo_data, id, status, created_at").order("created_at", { ascending: false }).limit(5);
  for (const b of data) {
    console.log("-------------------");
    console.log("ID:", b.id, "Status:", b.status);
    console.log("Created At:", b.created_at);
    console.log("ResellerRef:", b.octo_data?.resellerReference);
    console.log("RAW_BODY:", JSON.stringify(b.octo_data?.RAW_BODY));
    console.log("RAW_PATCH_BODY:", JSON.stringify(b.octo_data?.RAW_PATCH_BODY));
    console.log("RAW_CONFIRM_BODY:", JSON.stringify(b.octo_data?.RAW_CONFIRM_BODY));
  }
}

check();
