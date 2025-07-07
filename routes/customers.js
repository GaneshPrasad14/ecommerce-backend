const express = require('express');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/customers
// @desc    Get all customers
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, 
             COUNT(o.id) as order_count,
             COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id AND o.status != 'cancelled'
      WHERE c.is_active = 1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM customers c WHERE c.is_active = 1';
    let params = [];
    let countParams = [];

    if (search) {
      query += ' AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ?)';
      countQuery += ' AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
      countParams.push(searchParam, searchParam, searchParam);
    }

    query += ' GROUP BY c.id ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [customers] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      customers,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalItems: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/customers/:id
// @desc    Get customer by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const [customers] = await pool.execute(`
      SELECT * FROM customers WHERE id = ? AND is_active = 1
    `, [id]);

    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get customer orders
    const [orders] = await pool.execute(`
      SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC
    `, [id]);

    const customer = {
      ...customers[0],
      orders
    };

    res.json(customer);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 