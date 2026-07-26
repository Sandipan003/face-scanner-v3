import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
  },
  bloodGroup: {
    type: String,
  },
  phone: {
    type: String,
  },
  faceRegistered: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'client'],
    default: 'patient',
  },
  points: {
    type: Number,
    default: 0,
  },
  walletHistory: [
    {
      amount: Number,
      reason: String,
      date: { type: Date, default: Date.now },
    }
  ],
  businessDetails: {
    name: String,
    address: String
  },
  deliveryAddress: {
    street: String,
    city: String,
    zip: String,
    country: String
  }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
