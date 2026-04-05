const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Reservation = require('../models/Reservation');
const { protect } = require('../middleware/auth');
const { notifyReservationConfirmed } = require('../utils/notifications');

// POST /api/reservations — public
router.post('/', [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('phone').trim().notEmpty().withMessage('Phone required'),
  body('date').isISO8601().withMessage('Valid date required'),
  body('time').notEmpty().withMessage('Time required'),
  body('guests').isInt({ min: 1, max: 20 }).withMessage('Guests must be 1–20'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const reservation = await Reservation.create(req.body);
    // Send notifications async (don't block response)
    notifyReservationConfirmed(reservation).catch(console.error);
    res.status(201).json({ success: true, message: 'Reservation confirmed!', reservation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reservations — admin
router.get('/', protect, async (req, res) => {
  try {
    const { date, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (date) {
      const d = new Date(date);
      filter.date = { $gte: new Date(d.setHours(0,0,0,0)), $lte: new Date(d.setHours(23,59,59,999)) };
    }
    const total = await Reservation.countDocuments(filter);
    const reservations = await Reservation.find(filter)
      .sort({ date: 1, time: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, total, page: Number(page), reservations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reservations/today — admin
router.get('/today', protect, async (req, res) => {
  try {
    const today = new Date();
    const reservations = await Reservation.find({
      date: { $gte: new Date(today.setHours(0,0,0,0)), $lte: new Date(today.setHours(23,59,59,999)) }
    }).sort({ time: 1 });
    res.json({ success: true, reservations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/reservations/:id — admin update status
router.patch('/:id', protect, async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!reservation) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, reservation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/reservations/:id — admin
router.delete('/:id', protect, async (req, res) => {
  try {
    await Reservation.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
