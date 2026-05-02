const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  if (line.includes('=')) {
    const parts = line.split('=');
    env[parts[0]] = parts.slice(1).join('=').replace(/"/g, '');
  }
});
const API_KEY = env.OCTO_LOCAL_API_KEY;

async function check() {
  const url = `https://istanbulportrait.com/api/octo/bookings?resellerReference=joXmBNFc`;
  console.log("Fetching:", url);
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Length:", data.length);
  if (data.length > 0) {
     console.log("Found ResellerRef:", data[0].resellerReference);
  }
}
check();
