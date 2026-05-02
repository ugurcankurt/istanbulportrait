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
async function testInsert() {
  const { data, error } = await supabase.from("bookings").insert({
      package_id: "LOG_HTTP",
      status: "cancelled",
      total_amount: 0,
      user_name: "LOG_GET",
      user_email: "log@log.com",
      user_phone: "0000000000",
      booking_date: "2026-01-01",
      notes: JSON.stringify({
        method: "GET",
        url: "http://test",
        query: {},
        headers: {}
      })
  }).select();
  if (error) console.error("INSERT ERROR:", error);
  else console.log("INSERT SUCCESS:", data);
}
testInsert();
