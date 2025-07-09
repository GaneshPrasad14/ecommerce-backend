const express = require('express');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/settings
// @desc    Get all settings
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const [settings] = await pool.execute('SELECT * FROM settings ORDER BY setting_key');
    
    // Convert to key-value object
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });

    res.json(settingsObj);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/settings
// @desc    Update settings
// @access  Private
router.put('/', auth, async (req, res) => {
  try {
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      await pool.execute(
        'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
        [value, key]
      );
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 
