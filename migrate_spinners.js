const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  "app/admin/admin-layout-client.tsx",
  "app/admin/dashboard/blog/[id]/page.tsx",
  "app/admin/dashboard/settings/page.tsx",
  "app/admin/login/page.tsx",
  "components/admin/blog/image-upload.tsx",
  "components/admin/locations/location-form.tsx",
  "components/admin/packages/package-form.tsx",
  "components/admin/pages/page-form.tsx",
  "components/booking-modal.tsx",
  "components/ui/webp-image-uploader.tsx"
];

for (let rPath of filesToUpdate) {
  const fullPath = path.join('/Users/ugurcankurt/Desktop/istanbulphotosssion', rPath);
  if (!fs.existsSync(fullPath)) continue;

  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;

  // Replace <Loader2 ... /> with <Spinner ... />
  // Careful with <Loader2>...</Loader2>
  content = content.replace(/<Loader2([^>]*?)\/?>/g, (match, props) => {
    // If it has animate-spin, we can optionally clean it up, but it's fine 
    return `<Spinner${props}/>`;
  });

  // Also replace Loader2 in imports
  // Looks like: import { ..., Loader2, ... } from "lucide-react";
  // We can just remove Loader2 from lucide-react import
  // and add import { Spinner } from "@/components/ui/spinner";
  if (content !== originalContent) {
    if (content.includes("Loader2")) {
       content = content.replace(/,\s*Loader2\b/g, '')
                        .replace(/\bLoader2\s*,/g, '')
                        .replace(/import\s*{\s*Loader2\s*}\s*from\s*['"]lucide-react['"];?\n/g, '');
    }
    
    // Add import { Spinner } from "@/components/ui/spinner"; right after the lucide-react import or at the top
    if (!content.includes('import { Spinner }')) {
      const match = content.match(/import\s+.*?\s+from\s+['"]lucide-react['"];?/);
      if (match) {
        content = content.replace(match[0], match[0] + '\nimport { Spinner } from "@/components/ui/spinner";');
      } else {
        content = 'import { Spinner } from "@/components/ui/spinner";\n' + content;
      }
    }

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${rPath}`);
  }
}
