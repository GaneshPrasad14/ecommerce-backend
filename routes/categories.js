const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authenticateToken = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');

// Categories
router.get('/', categoryController.getCategories);
router.post('/', authenticateToken, requireAdmin, categoryController.createCategory);
router.put('/:id', authenticateToken, requireAdmin, categoryController.updateCategory);
router.delete('/:id', authenticateToken, requireAdmin, categoryController.deleteCategory);

// Subcategories
router.get('/:categoryId/subcategories', categoryController.getSubcategories);
router.post('/:categoryId/subcategories', authenticateToken, requireAdmin, categoryController.createSubcategory);
router.put('/subcategories/:id', authenticateToken, requireAdmin, categoryController.updateSubcategory);
router.delete('/subcategories/:id', authenticateToken, requireAdmin, categoryController.deleteSubcategory);

module.exports = router; 
