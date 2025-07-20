const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authenticateToken = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');
const multer = require('multer');
const path = require('path');
const uploadsDir = path.join(__dirname, '../uploads');
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.post('/', authenticateToken, requireAdmin, upload.single('image'), productController.createProduct);
router.put('/:id', authenticateToken, requireAdmin, upload.single('image'), productController.updateProduct);
router.delete('/:id', authenticateToken, requireAdmin, productController.deleteProduct);

// Serve product image as BLOB from database
router.get('/:id/image', async (req, res) => {
  try {
    const db = require('../db');
    const [rows] = await db.execute('SELECT image_blob FROM products WHERE id = ?', [req.params.id]);
    if (!rows.length || !rows[0].image_blob) {
      return res.status(404).send('Image not found');
    }
    res.set('Content-Type', 'image/jpeg'); // You may want to store and use the actual mime type
    res.send(rows[0].image_blob);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router; 
