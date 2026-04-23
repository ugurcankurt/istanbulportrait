require('dotenv').config({ path: '.env.local' });
const { createDriveFolder, listFilesInFolder } = require('../lib/google-drive'); // Need TS transpilation or use raw api

// Let's use TS node since it's a ts project
