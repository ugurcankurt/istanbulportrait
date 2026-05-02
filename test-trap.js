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
  const { data } = await supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(50);
  
  let found = false;
  for (const b of data) {
    const fullJson = JSON.stringify(b);
    if (fullJson.includes("CUgYMCtx")) {
       console.log("FOUND CUgYMCtx in booking:", b.id, "Status:", b.status);
       console.log("\nRAW_BODY:", JSON.stringify(b.octo_data?.RAW_BODY, null, 2));
       console.log("\nRAW_HEADERS:", JSON.stringify(b.octo_data?.RAW_HEADERS, null, 2));
       console.log("\nRAW_QUERY:", JSON.stringify(b.octo_data?.RAW_QUERY, null, 2));
       console.log("\nRAW_PATCH_BODY:", JSON.stringify(b.octo_data?.RAW_PATCH_BODY, null, 2));
       console.log("\nRAW_CONFIRM_BODY:", JSON.stringify(b.octo_data?.RAW_CONFIRM_BODY, null, 2));
       found = true;
    }
  }
  if (!found) {
    console.log("NOT FOUND IN ANY FIELDS! This means the validator NEVER sent 'CUgYMCtx' to any of our API endpoints (or the endpoint returned a 500 error before saving).");
  }
}

check();
