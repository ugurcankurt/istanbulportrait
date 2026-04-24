console.log("Checking crypto module");
const crypto = require('crypto');
console.log(crypto.createHash('md5').update('test').digest('hex'));
