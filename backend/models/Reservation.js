const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  phone:        { type: String, required: true, trim: true },
  email:        { type: String, trim: true, lowercase: true },
  date:         { type: Date, required: true },
  time:         { type: String, required: true },
  guests:       { type: Number, required: true, min: 1, max: 20 },
  specialNote:  { type: String, trim: true, maxlength: 300 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  tableNumber:  { type: Number },
  notifiedAt:   { type: Date },
  createdAt:    { type: Date, default: Date.now },
});

reservationSchema.index({ date: 1, status: 1 });
reservationSchema.index({ phone: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
