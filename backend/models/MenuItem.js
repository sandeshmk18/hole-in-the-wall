const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price:       { type: Number, required: true, min: 0 },
  category:    { type: String, required: true, enum: ['breakfast', 'beverages', 'specials'] },
  image:       { type: String, default: '' },
  tags:        [{ type: String }],
  isVeg:       { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  isFeatured:  { type: Boolean, default: false },
  sortOrder:   { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
