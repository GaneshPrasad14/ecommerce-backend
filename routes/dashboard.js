const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics (mock)
// @access  Private
router.get('/stats', auth, (req, res) => {
  res.json({
    totalOrders: 42,
    totalRevenue: 12345.67,
    totalCustomers: 17,
    totalProducts: 12
  });
});

// @route   GET /api/dashboard/recent-orders
// @desc    Get recent orders (mock)
// @access  Private
router.get('/recent-orders', auth, (req, res) => {
  res.json([
    { id: 1, order_number: 'ORD001', customer: 'John Doe', total: 199.99, status: 'delivered', date: '2024-05-01' },
    { id: 2, order_number: 'ORD002', customer: 'Jane Smith', total: 89.50, status: 'shipped', date: '2024-05-02' }
  ]);
});

module.exports = router; 
