const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function check() {
  const { data: all, error: allErr } = await supabase.from('packages').select('slug, title, video_url');
  console.log("All packages:", all.map(p => ({ slug: p.slug, video_url: p.video_url })));
}

check();
