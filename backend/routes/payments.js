const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_xxx')) {
    return null;
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// POST /api/payments/create-order
router.post('/create-order', async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const razorpay = getRazorpay();
    if (!razorpay) {
      // DEV MODE: simulate payment
      return res.json({
        success: true,
        devMode: true,
        razorpayOrderId: `order_dev_${Date.now()}`,
        amount: order.total * 100,
        currency: 'INR',
        key: 'rzp_test_dev',
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.total * 100),
      currency: 'INR',
      receipt: orderId.toString(),
    });

    order.payment.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payments/verify
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // DEV MODE skip verification
    if (razorpay_order_id?.startsWith('order_dev_')) {
      order.payment.status = 'paid';
      order.payment.razorpayPaymentId = razorpay_payment_id || 'dev_payment';
      order.status = 'confirmed';
      order.payment.paidAt = new Date();
      await order.save();
      return res.json({ success: true, message: 'Payment verified (dev mode)', order });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      order.payment.status = 'failed';
      await order.save();
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    order.payment.status = 'paid';
    order.payment.razorpayPaymentId = razorpay_payment_id;
    order.payment.razorpaySignature = razorpay_signature;
    order.payment.paidAt = new Date();
    order.status = 'confirmed';
    await order.save();

    const { notifyOrderConfirmed } = require('../utils/notifications');
    notifyOrderConfirmed(order).catch(console.error);

    res.json({ success: true, message: 'Payment verified', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/payments — admin
router.get('/', protect, async (req, res) => {
  try {
    const orders = await Order.find({ 'payment.status': 'paid' })
      .sort({ createdAt: -1 }).limit(50);
    const total = orders.reduce((sum, o) => sum + o.total, 0);
    res.json({ success: true, orders, totalRevenue: total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
