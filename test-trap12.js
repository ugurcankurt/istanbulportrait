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
  const { data } = await supabase.from("bookings").select("*").eq("id", "booking_1777703637216.310000").single();
  console.log("Booking found:", !!data);
  if (data) {
     console.log("DB octo_data:", JSON.stringify(data.octo_data));
     console.log("DB resellerReference:", data.octo_data?.resellerReference);
     const mapped = mapBookingToOcto(data);
     console.log("Mapped resellerReference:", mapped.resellerReference);
  }
}
check();
