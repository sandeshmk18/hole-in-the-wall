const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem:    { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name:        { type: String, required: true },
  price:       { type: Number, required: true },
  quantity:    { type: Number, required: true, min: 1 },
});

const orderSchema = new mongoose.Schema({
  customerName:  { type: String, required: true, trim: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String, trim: true, lowercase: true },
  items:         [orderItemSchema],
  subtotal:      { type: Number, required: true },
  tax:           { type: Number, default: 0 },
  total:         { type: Number, required: true },
  orderType:     { type: String, enum: ['dine-in', 'takeaway', 'delivery'], default: 'dine-in' },
  tableNumber:   { type: String },
  address:       { type: String },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  payment: {
    status:    { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    method:    { type: String, enum: ['razorpay', 'cash', 'upi'], default: 'razorpay' },
    razorpayOrderId:   { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    paidAt:    { type: Date },
  },
  specialInstructions: { type: String, maxlength: 300 },
  createdAt: { type: Date, default: Date.now },
});

orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
