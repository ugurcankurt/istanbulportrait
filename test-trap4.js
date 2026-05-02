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
  const { data } = await supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(20);
  console.log("Checking the last 20 bookings...");
  let found = false;
  for (const b of data) {
    if (JSON.stringify(b).includes("CUgYMCtx")) {
       console.log("FOUND in", b.id);
       found = true;
    }
    // Let's print out ALL resellerReferences just to see what the validator actually sent!
    if (b.octo_data) {
       console.log(b.id, "has ResellerRef:", b.octo_data.resellerReference || "null");
       if (b.octo_data.RAW_BODY && b.octo_data.RAW_BODY.resellerReference) {
           console.log("   -> RAW_BODY has:", b.octo_data.RAW_BODY.resellerReference);
       }
       if (b.octo_data.RAW_PATCH_BODY && b.octo_data.RAW_PATCH_BODY.resellerReference) {
           console.log("   -> RAW_PATCH_BODY has:", b.octo_data.RAW_PATCH_BODY.resellerReference);
       }
       if (b.octo_data.RAW_CONFIRM_BODY && b.octo_data.RAW_CONFIRM_BODY.resellerReference) {
           console.log("   -> RAW_CONFIRM_BODY has:", b.octo_data.RAW_CONFIRM_BODY.resellerReference);
       }
    }
  }
  if (!found) console.log("Did not find CUgYMCtx!");
}

check();
