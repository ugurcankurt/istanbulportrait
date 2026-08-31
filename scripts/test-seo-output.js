const http = require('http');

async function fetchPage(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractTags(html) {
  const hreflangs = [];
  const canonical = html.match(/<link[^>]*rel="canonical"[^>]*>/i);
  const jsonLds = [];
  
  const hreflangMatches = html.matchAll(/<link[^>]*rel="alternate"[^>]*hreflang="[^"]*"[^>]*>/gi);
  for (const match of hreflangMatches) {
    hreflangs.push(match[0]);
  }

  const jsonLdMatches = html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of jsonLdMatches) {
    try {
      jsonLds.push(JSON.parse(match[1]));
    } catch(e) {
      jsonLds.push("INVALID JSON: " + match[1]);
    }
  }
  
  const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*>/i);
  
  return {
    canonical: canonical ? canonical[0] : null,
    hreflangs,
    ogImage: ogImage ? ogImage[0] : null,
    schemaCount: jsonLds.length,
    schemas: jsonLds
  };
}

async function run() {
  console.log("--- Testing Homepage (/tr) ---");
  const homeHtml = await fetchPage('/tr');
  const homeTags = extractTags(homeHtml);
  console.log("Canonical:", homeTags.canonical);
  console.log("Hreflangs:", homeTags.hreflangs.slice(0, 3), `... (${homeTags.hreflangs.length} total)`);
  console.log("OG Image:", homeTags.ogImage);
  console.log("Schema count:", homeTags.schemaCount);
  console.log("Schema types:", homeTags.schemas.map(s => s && s['@type']));

  console.log("\n--- Testing Package Page (/tr/paketler/istanbul-paketi) ---");
  // We'll just test a generic route, it might 404 if "istanbul-paketi" doesn't exist, but let's test a valid static path first if possible. 
  // Let's test /tr/packages just to be safe if package names are unknown.
  const packageHtml = await fetchPage('/tr/packages');
  const pkgTags = extractTags(packageHtml);
  console.log("Canonical:", pkgTags.canonical);
  console.log("Hreflangs:", pkgTags.hreflangs.slice(0, 3), `... (${pkgTags.hreflangs.length} total)`);
  console.log("OG Image:", pkgTags.ogImage);
  
  console.log("\n--- Testing Layout/Checkout Page (/tr/checkout) ---");
  const checkoutHtml = await fetchPage('/tr/checkout');
  const checkoutTags = extractTags(checkoutHtml);
  console.log("Canonical:", checkoutTags.canonical);
  console.log("Hreflangs:", checkoutTags.hreflangs);
}

run().catch(console.error);
