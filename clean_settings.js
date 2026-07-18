const fs = require('fs');
const path = require('path');

// 1. Clean page.tsx
const pagePath = path.join(__dirname, 'app/admin/dashboard/settings/page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

pageContent = pageContent.replace(/\{\/\* Payment Gateway \(Iyzico\) \*\/\}.*?(?=\{\/\* Meta \/ Facebook Integration \*\/\})/gs, '');
pageContent = pageContent.replace(/\{\/\* Turinvoice Integration \*\/\}.*?(?=\{\/\* Webmasters & Web Tracking \*\/\})/gs, '');

fs.writeFileSync(pagePath, pageContent, 'utf8');

// 2. Clean settings-service.ts
const servicePath = path.join(__dirname, 'lib/settings-service.ts');
let serviceContent = fs.readFileSync(servicePath, 'utf8');

serviceContent = serviceContent.replace(/  iyzico_base_url: string \| null;\n  iyzico_api_key: string \| null;\n  iyzico_secret_key: string \| null;\n/g, '');
serviceContent = serviceContent.replace(/  turinvoice_base_url: string \| null;\n  turinvoice_login: string \| null;\n  turinvoice_password: string \| null;\n  turinvoice_id_tsp: string \| null;\n  turinvoice_secret_key: string \| null;\n  turinvoice_callback_url: string \| null;\n/g, '');

serviceContent = serviceContent.replace(/  iyzico_base_url: null,\n  iyzico_api_key: null,\n  iyzico_secret_key: null,\n/g, '');
serviceContent = serviceContent.replace(/  turinvoice_base_url: null,\n  turinvoice_login: null,\n  turinvoice_password: null,\n  turinvoice_id_tsp: null,\n  turinvoice_secret_key: null,\n  turinvoice_callback_url: null,\n/g, '');

serviceContent = serviceContent.replace(/        iyzico_base_url: rawData\.iyzico_base_url \|\| defaultSettings\.iyzico_base_url,\n        iyzico_api_key: rawData\.iyzico_api_key \|\| defaultSettings\.iyzico_api_key,\n        iyzico_secret_key: rawData\.iyzico_secret_key \|\| defaultSettings\.iyzico_secret_key,\n/g, '');
serviceContent = serviceContent.replace(/        turinvoice_base_url: rawData\.turinvoice_base_url \|\| defaultSettings\.turinvoice_base_url,\n        turinvoice_login: rawData\.turinvoice_login \|\| defaultSettings\.turinvoice_login,\n        turinvoice_password: rawData\.turinvoice_password \|\| defaultSettings\.turinvoice_password,\n        turinvoice_id_tsp: rawData\.turinvoice_id_tsp \|\| defaultSettings\.turinvoice_id_tsp,\n        turinvoice_secret_key: rawData\.turinvoice_secret_key \|\| defaultSettings\.turinvoice_secret_key,\n        turinvoice_callback_url: rawData\.turinvoice_callback_url \|\| defaultSettings\.turinvoice_callback_url,\n/g, '');

fs.writeFileSync(servicePath, serviceContent, 'utf8');

console.log('Settings cleaned successfully.');
