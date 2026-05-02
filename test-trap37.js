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
async function test() {
  const { data: bookings } = await supabase.from("bookings").select("*").eq("id", "booking_1777705360455.713000");
  const booking = bookings[0];
  const newMeta = { 
      ...(booking.octo_data || {}),
      uuid: "4f3baded-3e80-4cf1-baab-36b5261eb4ff", 
      unitItems: [],
      contact: {
        ...(booking.octo_data?.contact || {}),
        "fullName": "John Doe"
      },
      RAW_CONFIRM_BODY: {"contact":{"fullName":"John Doe","emailAddress":"johndoe@example.com"},"resellerReference":"mdpHIDlm"},
      RAW_CONFIRM_QUERY: {},
      RAW_CONFIRM_HEADERS: {"host":"test"}
  };
  newMeta.resellerReference = "mdpHIDlm";
  const updates = { status: "confirmed", octo_data: newMeta, octo_uuid: "4f3baded-3e80-4cf1-baab-36b5261eb4ff" };
  const { data, error } = await supabase.from("bookings").update(updates).eq("id", booking.id).select();
  console.log("Error:", error);
  console.log("Data:", data ? data.length : null);
}
test();
