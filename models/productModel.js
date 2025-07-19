const db = require('../db');

exports.getProducts = async (query) => {
  const { category, subcategory, search } = query;
  let sql = `SELECT p.*, s.name AS subcategory_name, c.name AS category_name FROM products p
             LEFT JOIN subcategories s ON p.subcategory_id = s.id
             LEFT JOIN categories c ON s.category_id = c.id`;
  const params = [];
  const conditions = [];
  if (category) {
    conditions.push('c.name = ?');
    params.push(category);
  }
  if (subcategory) {
    conditions.push('s.name = ?');
    params.push(subcategory);
  }
  if (search) {
    conditions.push('p.name LIKE ?');
    params.push(`%${search}%`);
  }
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY p.created_at DESC';
  const [products] = await db.execute(sql, params);
  return products;
};

exports.getProductById = async (id) => {
  const [rows] = await db.execute(
    `SELECT p.*, s.name AS subcategory_name, c.name AS category_name FROM products p
     LEFT JOIN subcategories s ON p.subcategory_id = s.id
     LEFT JOIN categories c ON s.category_id = c.id
     WHERE p.id = ?`,
    [id]
  );
  return rows[0];
};

exports.createProduct = async (body, file) => {
  const { name, subcategory_id, price, description, stock, rent_available, contact } = body;
  const image = file ? `/uploads/${file.filename}` : null;
  const image_blob = file ? file.buffer : null;
  const [result] = await db.execute(
    `INSERT INTO products (name, subcategory_id, price, description, stock, rent_available, image, image_blob, contact)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, subcategory_id, parseFloat(price), description, parseInt(stock), rent_available === 'true', image, image_blob, contact]
  );
  const [rows] = await db.execute('SELECT * FROM products WHERE id = ?', [result.insertId]);
  return rows[0];
};

exports.updateProduct = async (id, body, file) => {
  const { name, subcategory_id, price, description, stock, rent_available, contact } = body;
  let imageUpdate = '';
  let imageBlobUpdate = '';
  let params = [name, subcategory_id, parseFloat(price), description, parseInt(stock), rent_available === 'true', contact];
  if (file) {
    imageUpdate = ', image = ?';
    imageBlobUpdate = ', image_blob = ?';
    params.push(`/uploads/${file.filename}`);
    params.push(file.buffer);
  }
  params.push(id);
  const [result] = await db.execute(
    `UPDATE products SET name = ?, subcategory_id = ?, price = ?, description = ?, stock = ?, rent_available = ?, contact = ?${imageUpdate}${imageBlobUpdate} WHERE id = ?`,
    params
  );
  if (result.affectedRows === 0) return null;
  const [rows] = await db.execute('SELECT * FROM products WHERE id = ?', [id]);
  return rows[0];
};

exports.deleteProduct = async (id) => {
  const [result] = await db.execute('DELETE FROM products WHERE id = ?', [id]);
  return result.affectedRows > 0;
};
