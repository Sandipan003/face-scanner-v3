import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  imageBase64: {
    type: String,
    required: true,
  },
  targetHealthConditions: [{
    type: String
  }],
}, { timestamps: true });

export const Product = mongoose.model('Product', productSchema);
