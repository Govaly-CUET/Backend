const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  phone: { type: String, trim: true },
  role: { 
    type: String, 
    enum: ['ADMIN', 'CUSTOMER', 'VENDOR'], 
    default: 'CUSTOMER',
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);