const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCreateBucket() {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) throw listError;
    
    console.log("Existing Buckets:", buckets.map(b => b.name).join(', '));
    
    const printBucketExists = buckets.some(b => b.name === 'print-uploads');
    
    if (!printBucketExists) {
        console.log("print-uploads bucket not found. Attempting to create it...");
        const { data, error: createError } = await supabase.storage.createBucket('print-uploads', {
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/png'],
            fileSizeLimit: 20971520 // 20 MB
        });
        
        if (createError) throw createError;
        console.log("Successfully created public 'print-uploads' bucket.");
    } else {
        console.log("'print-uploads' bucket already exists.");
        
        // Ensure it's public
        const bucketInfo = buckets.find(b => b.name === 'print-uploads');
        if (!bucketInfo.public) {
             const { error: updateError } = await supabase.storage.updateBucket('print-uploads', {
                public: true,
             });
             if (updateError) throw updateError;
             console.log("Updated 'print-uploads' to be public.");
        } else {
            console.log("'print-uploads' is already public.");
        }
    }
    
    // Check tables
    // Just pulling a random table to confirm DB access works - real checks depend on schema
    const { data: tableData, error: tableError } = await supabase.from('packages').select('id').limit(1);
    
    if (tableError) {
        console.log("Database connection test failed:", tableError.message);
    } else {
        console.log("Database connection test passed.");
    }
    
  } catch (error) {
    console.error("Error checking Supabase:", error);
  }
}

checkAndCreateBucket();
