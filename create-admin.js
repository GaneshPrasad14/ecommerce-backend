const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/.env' });

async function createAdmin() {
  const username = 'admin'; // change as desired
  const password = 'admin123'; // change as desired
  const email = 'admin@example.com'; // change as desired
  const first_name = 'Admin';
  const last_name = 'User';
  const role = 'super_admin';

  try {
    const password_hash = await bcrypt.hash(password, 10);

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'boutique_elegance_admin',
      port: process.env.DB_PORT || 3306,
    });

    try {
      await connection.execute(
        'INSERT INTO admin_users (username, password_hash, email, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)',
        [username, password_hash, email, first_name, last_name, role]
      );
      console.log('Admin user created:', username);
    } catch (sqlErr) {
      console.error('SQL error:', sqlErr);
    }
    await connection.end();
  } catch (err) {
    console.error('Script error:', err);
  }
}

createAdmin(); 