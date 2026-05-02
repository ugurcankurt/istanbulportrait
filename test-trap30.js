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
  const { data } = await supabase.from("bookings").select("*").eq("package_id", "LOG_HTTP").order("created_at", { ascending: true }).limit(50);
  for (const b of data) {
     if (b.notes && b.notes.includes("4f3baded-3e80-4cf1-baab-36b5261eb4ff")) {
       console.log(`[${b.created_at}] ${b.user_name}`);
       console.log(b.notes);
     }
  }
}
check();
