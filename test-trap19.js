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

function mapBookingToOcto(b, finalUuid) {
  if (!finalUuid) {
    finalUuid = b.octo_uuid || b.id;
  }
  return {
    id: b.id,
    resellerReference: b.octo_data?.resellerReference || (finalUuid ? `RES-${finalUuid.substring(0, 5)}` : null)
  };
}

async function check() {
  const { data } = await supabase.from("bookings").select("*");
  let found = false;
  for (const b of data) {
    const mapped = mapBookingToOcto(b);
    if (mapped.resellerReference === "p4dzd7vn" || JSON.stringify(b).includes("p4dzd7vn")) {
       console.log("FOUND p4dzd7vn IN DB!");
       console.log(b.id, mapped.resellerReference);
       found = true;
    }
  }
  if (!found) console.log("p4dzd7vn IS NOT IN THE DB AT ALL!");
}

check();
