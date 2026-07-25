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
  }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
