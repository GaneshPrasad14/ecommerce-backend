const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage });

// Image upload endpoint
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return the URL to access the uploaded image
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '' } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const safePageNum = isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
    const safeLimitNum = isNaN(limitNum) || limitNum < 1 ? 10 : limitNum;
    const offset = (safePageNum - 1) * safeLimitNum;

    let query = `
      SELECT p.*,
      (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as primary_image,
      p.product_type,
      p.details
      FROM products p
      WHERE p.is_active = 1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM products p WHERE p.is_active = 1';
    let params = [];
    let countParams = [];

    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      countQuery += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
      countParams.push(searchParam, searchParam);
    }

    if (category) {
      query += ' AND p.category_id = ?';
      countQuery += ' AND p.category_id = ?';
      params.push(category);
      countParams.push(category);
    }

    query += ` ORDER BY p.created_at DESC LIMIT ${safeLimitNum} OFFSET ${offset}`;

    // Debug logging
    console.log('Query:', query);
    console.log('Params:', params);
    console.log('Types:', params.map(p => typeof p));

    const [products] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    // Parse details
    products.forEach(product => {
      if (product.details && typeof product.details === 'string') {
        try { product.details = JSON.parse(product.details); } catch {}
      }
    });

    res.json({
      products,
      pagination: {
        current: safePageNum,
        total: Math.ceil(total / safeLimitNum),
        totalItems: total,
        limit: safeLimitNum
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching product by ID:', id);

    const [products] = await pool.execute(`
      SELECT p.*,
      p.product_type,
      p.details
      FROM products p
      WHERE p.id = ? AND p.is_active = 1
    `, [id]);

    if (products.length === 0) {
      console.log('Product not found for ID:', id);
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get product images
    const [images] = await pool.execute(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC',
      [id]
    );

    // Get product variants
    const [variants] = await pool.execute(
      'SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1',
      [id]
    );

    const product = {
      ...products[0],
      images,
      variants
    };

    // Parse details
    if (product.details && typeof product.details === 'string') {
      try { product.details = JSON.parse(product.details); } catch {}
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private
router.post('/', [
  auth,
  body('name').notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      description,
      price,
      productType, // from frontend as category
      images // from frontend, array with at least one image object
    } = req.body;

    // Set defaults for all other fields
    const original_price = null;
    const sku = null;
    const stock_quantity = 0;
    const is_featured = false;
    const isActive = true;
    const details = null;
    const finalSku = sku ?? null;

    console.log({
      name, description, price, original_price, finalSku, stock_quantity, is_featured, isActive, productType, details
    });

    const [result] = await pool.execute(`
      INSERT INTO products (name, description, price, original_price, sku, stock_quantity, is_featured, is_active, product_type, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name ?? null,
      description ?? null,
      price ?? null,
      original_price,
      finalSku,
      stock_quantity,
      is_featured,
      isActive ? 1 : 0,
      productType ?? null,
      details
    ]);

    const productId = result.insertId;

    // Debug log for images
    console.log('Images received for product:', images);

    // Insert images
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        await pool.execute(`
          INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
          VALUES (?, ?, ?, ?, ?)
        `, [productId, image.url, image.alt_text, image.is_primary || false, i]);
      }
    }

    // Remove variants block (no longer used)

    // Fetch the newly created product with its primary_image
    const [newProducts] = await pool.execute(`
      SELECT p.*,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as primary_image,
        p.product_type,
        p.details
      FROM products p
      WHERE p.id = ?
    `, [productId]);

    // Parse details if needed
    if (newProducts[0] && newProducts[0].details && typeof newProducts[0].details === 'string') {
      try { newProducts[0].details = JSON.parse(newProducts[0].details); } catch {}
    }

    res.status(201).json({
      message: 'Product created successfully',
      product: newProducts[0]
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private
router.put('/:id', [
  auth,
  body('name').notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      name,
      description,
      price,
      original_price,
      sku,
      stock_quantity,
      is_featured
    } = req.body;

    // Update product
    await pool.execute(`
      UPDATE products 
      SET name = ?, description = ?, price = ?, original_price = ?, 
          sku = ?, stock_quantity = ?, is_featured = ?
      WHERE id = ?
    `, [name, description, price, original_price, sku, stock_quantity, is_featured, id]);

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (soft delete)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete - set is_active to false
    await pool.execute(
      'UPDATE products SET is_active = 0 WHERE id = ?',
      [id]
    );

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 