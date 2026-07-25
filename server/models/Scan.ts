import mongoose from 'mongoose';

const ScanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  timestamp: { type: Date, default: Date.now },
  durationMs: { type: Number, required: true },
  metrics: {
    heartRate: { type: Number },
    respiratoryRate: { type: Number },
    hrv: { type: Number },
    confidence: { type: Number },
    stressIndex: { type: Number }
  },
  deviceInfo: {
    userAgent: { type: String },
    platform: { type: String }
  },
  sdkVersion: { type: String, default: '3.2.1' },
  status: { type: String, enum: ['completed', 'failed', 'interrupted'], default: 'completed' }
}, { timestamps: true });

export const Scan = mongoose.model('Scan', ScanSchema);
