const db = require('../db');

exports.findByEmail = async (email) => {
  const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};

exports.createUser = async (email, password, name) => {
  const [result] = await db.execute('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)', [email, password, name, 'user']);
  return result.insertId;
};

exports.findById = async (id) => {
  const [rows] = await db.execute('SELECT id, email, name, role FROM users WHERE id = ?', [id]);
  return rows[0];
}; 
