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
  const { data: bookings, error } = await supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(100);
  
  let octoBookings = (bookings || []).map(b => mapBookingToOcto(b));
  
  const filtered = octoBookings.filter(b => b.resellerReference === "joXmBNFc");
  console.log("Filtered Length:", filtered.length);
  if (filtered.length === 0) {
     console.log("WHY IS IT 0? Let's check if joXmBNFc exists in octoBookings!");
     for (const b of octoBookings) {
         if (b.resellerReference === "joXmBNFc") {
             console.log("FOUND IT IN LOOP! Why did filter fail?");
         }
         // Print what it actually has
         if (b.id === "booking_1777703637216.310000") {
             console.log("The booking in question has resellerReference:", b.resellerReference);
             const dbBooking = bookings.find(x => x.id === "booking_1777703637216.310000");
             console.log("Its raw octo_data:", JSON.stringify(dbBooking.octo_data));
             console.log("octo_data.resellerReference:", dbBooking.octo_data?.resellerReference);
         }
     }
  }
}

check();
