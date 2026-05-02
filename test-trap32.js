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
async function testUpdate() {
  const { data, error } = await supabase.from("bookings").update({ status: "confirmed" }).eq("id", "booking_1777705360455.713000").select();
  if (error) console.error("UPDATE ERROR:", error);
  else console.log("UPDATE SUCCESS:", data);
}
testUpdate();
