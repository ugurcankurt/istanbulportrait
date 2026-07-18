import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function run() {
  const { data, error } = await supabase.from('bookings').select('id, user_name, status, drive_folder_id, created_at').order('created_at', { ascending: false }).limit(5);
  console.log(data);
}
run();
