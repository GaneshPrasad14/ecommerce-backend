const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');
const nodemailer = require('nodemailer');

const router = express.Router();

// Email config (replace with your SMTP details)
const transporter = nodemailer.createTransport({
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your@email.com',
    pass: 'yourpassword'
  }
});
const ADMIN_EMAIL = 'admin@email.com';

// POST /api/leads - Create a new lead (public)
router.post('/', [
  body('product_id').isInt(),
  body('customer_name').notEmpty(),
  body('email').isEmail(),
  body('phone').optional().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { product_id, customer_name, email, phone } = req.body;
  try {
    const [result] = await pool.execute(
      'INSERT INTO leads (product_id, customer_name, email, phone) VALUES (?, ?, ?, ?)',
      [product_id, customer_name, email, phone || null]
    );
    // Send email to admin
    try {
      await transporter.sendMail({
        from: 'no-reply@yourdomain.com',
        to: ADMIN_EMAIL,
        subject: 'New Product Interest',
        text: `New lead for product ID ${product_id}:\nName: ${customer_name}\nEmail: ${email}\nPhone: ${phone || ''}`
      });
    } catch (e) { console.error('Email error:', e); }
    res.status(201).json({ message: 'Lead created', leadId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/leads - List all leads (admin only)
router.get('/', auth, async (req, res) => {
  try {
    const [leads] = await pool.execute(
      'SELECT l.*, p.name as product_name FROM leads l LEFT JOIN products p ON l.product_id = p.id ORDER BY l.created_at DESC'
    );
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/leads/:id - Update lead status (admin only)
router.put('/:id', auth, [body('status').isIn(['new','contacted','archived'])], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.execute('UPDATE leads SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'Lead status updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 
