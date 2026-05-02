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
async function run() {
  const { error } = await supabase.from("customers").upsert({
    email: "log@log.com",
    name: "LOG",
    phone: "0000000000"
  }, { onConflict: "email" });
  if (error) console.error("UPSERT ERROR:", error);
  else console.log("UPSERT SUCCESS!");
}
run();
