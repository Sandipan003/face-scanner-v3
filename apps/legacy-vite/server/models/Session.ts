import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  status: { type: String, enum: ['active', 'completed', 'error'], default: 'active' },
  ipAddress: { type: String }
}, { timestamps: true });

export const Session = mongoose.model('Session', SessionSchema);
