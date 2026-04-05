const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Reservation = require('../models/Reservation');
const MenuItem = require('../models/MenuItem');
const { protect } = require('../middleware/auth');

// GET /api/admin/stats — dashboard overview
router.get('/stats', protect, async (req, res) => {
  try {
    const today = new Date();
    const todayStart = new Date(today.setHours(0,0,0,0));
    const todayEnd = new Date(today.setHours(23,59,59,999));
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      totalReservations,
      todayReservations,
      pendingReservations,
      totalOrders,
      paidOrders,
      monthlyRevenue,
      todayRevenue,
      menuCount,
      recentOrders,
      recentReservations,
    ] = await Promise.all([
      Reservation.countDocuments(),
      Reservation.countDocuments({ date: { $gte: todayStart, $lte: todayEnd } }),
      Reservation.countDocuments({ status: 'pending' }),
      Order.countDocuments(),
      Order.countDocuments({ 'payment.status': 'paid' }),
      Order.aggregate([
        { $match: { 'payment.status': 'paid', createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $match: { 'payment.status': 'paid', createdAt: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      MenuItem.countDocuments(),
      Order.find().sort({ createdAt: -1 }).limit(5),
      Reservation.find({ date: { $gte: todayStart } }).sort({ date: 1, time: 1 }).limit(5),
    ]);

    res.json({
      success: true,
      stats: {
        totalReservations,
        todayReservations,
        pendingReservations,
        totalOrders,
        paidOrders,
        menuCount,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        todayRevenue: todayRevenue[0]?.total || 0,
      },
      recentOrders,
      recentReservations,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/revenue-chart — last 7 days
router.get('/revenue-chart', protect, async (req, res) => {
  try {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(new Date(d.setHours(0,0,0,0)));
    }

    const data = await Promise.all(days.map(async (day) => {
      const next = new Date(day); next.setDate(next.getDate() + 1);
      const result = await Order.aggregate([
        { $match: { 'payment.status': 'paid', createdAt: { $gte: day, $lt: next } } },
        { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }
      ]);
      return {
        date: day.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
        revenue: result[0]?.revenue || 0,
        orders: result[0]?.orders || 0,
      };
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
