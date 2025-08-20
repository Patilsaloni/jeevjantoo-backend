// routes/clinics.js
const express = require('express');
const router = express.Router();
const clinicsController = require('../controllers/clinicsController');

// List all clinics (with filters)
router.get('/', clinicsController.getClinics);

// Single clinic by ID
router.get('/:id', async (req, res) => {
  const db = require('../db');
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM clinics WHERE id = ?", [id]);
    res.json(rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;   // 👈 IMPORTANT
