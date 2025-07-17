const db = require('../db');

exports.getCategories = async () => {
  const [rows] = await db.execute('SELECT * FROM categories ORDER BY created_at DESC');
  return rows;
};

exports.createCategory = async (body) => {
  const { name, description } = body;
  const [result] = await db.execute('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description]);
  const [rows] = await db.execute('SELECT * FROM categories WHERE id = ?', [result.insertId]);
  return rows[0];
};

exports.updateCategory = async (id, body) => {
  const { name, description } = body;
  const [result] = await db.execute('UPDATE categories SET name = ?, description = ? WHERE id = ?', [name, description, id]);
  if (result.affectedRows === 0) return null;
  const [rows] = await db.execute('SELECT * FROM categories WHERE id = ?', [id]);
  return rows[0];
};

exports.deleteCategory = async (id) => {
  const [result] = await db.execute('DELETE FROM categories WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

exports.getSubcategories = async (categoryId) => {
  const [rows] = await db.execute('SELECT * FROM subcategories WHERE category_id = ? ORDER BY created_at DESC', [categoryId]);
  return rows;
};

exports.createSubcategory = async (categoryId, body) => {
  const { name, description } = body;
  const [result] = await db.execute('INSERT INTO subcategories (category_id, name, description) VALUES (?, ?, ?)', [categoryId, name, description]);
  const [rows] = await db.execute('SELECT * FROM subcategories WHERE id = ?', [result.insertId]);
  return rows[0];
};

exports.updateSubcategory = async (id, body) => {
  const { name, description } = body;
  const [result] = await db.execute('UPDATE subcategories SET name = ?, description = ? WHERE id = ?', [name, description, id]);
  if (result.affectedRows === 0) return null;
  const [rows] = await db.execute('SELECT * FROM subcategories WHERE id = ?', [id]);
  return rows[0];
};

exports.deleteSubcategory = async (id) => {
  const [result] = await db.execute('DELETE FROM subcategories WHERE id = ?', [id]);
  return result.affectedRows > 0;
}; 