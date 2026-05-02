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
  const updates = {
    status: "confirmed",
    octo_uuid: "4f3baded-3e80-4cf1-baab-36b5261eb4ff",
    octo_data: {
      uuid: "4f3baded-3e80-4cf1-baab-36b5261eb4ff",
      resellerReference: "mdpHIDlm"
    },
    notes: "Reseller Ref: mdpHIDlm",
    user_name: "John Doe",
    user_email: "johndoe@example.com"
  };
  const { data, error } = await supabase.from("bookings").update(updates).eq("id", "booking_1777705360455.713000").select();
  console.log("Error:", error);
}
test();
