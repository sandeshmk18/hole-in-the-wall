const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const { protect } = require('../middleware/auth');

// POST /api/orders — public, create order
router.post('/', [
  body('customerName').trim().notEmpty().withMessage('Name required'),
  body('customerPhone').trim().notEmpty().withMessage('Phone required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  body('orderType').isIn(['dine-in', 'takeaway', 'delivery']).withMessage('Invalid order type'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { customerName, customerPhone, customerEmail, items, orderType, tableNumber, address, specialInstructions } = req.body;

    // Validate and price items from DB
    const enrichedItems = [];
    let subtotal = 0;
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem || !menuItem.isAvailable) {
        return res.status(400).json({ success: false, message: `Item "${item.name}" is not available` });
      }
      enrichedItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
      });
      subtotal += menuItem.price * item.quantity;
    }

    const tax = Math.round(subtotal * 0.05); // 5% GST
    const total = subtotal + tax;

    const order = await Order.create({
      customerName, customerPhone, customerEmail,
      items: enrichedItems, subtotal, tax, total,
      orderType, tableNumber, address, specialInstructions,
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders — admin
router.get('/', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('items.menuItem', 'name price')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, total, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/orders/:id — admin update status
router.patch('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
