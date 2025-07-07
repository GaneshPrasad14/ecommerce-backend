const fs = require('fs');
console.log('File exists:', fs.existsSync(__dirname + '/.env'));
console.log('File contents:\n', fs.readFileSync(__dirname + '/.env', 'utf8'));

require('dotenv').config({ path: __dirname + '/.env' });
console.log('DB_HOST:', process.env.DB_HOST);
console.log('All env:', process.env);
