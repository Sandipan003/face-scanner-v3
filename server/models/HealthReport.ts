import mongoose from 'mongoose';

const healthReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  vitals: {
    heartRate: Number,
    respiratoryRate: Number,
    hrv: Number,
    bloodPressureChanges: String, // uncalibrated
    stressLevel: String,
    fatigueScore: String,
    eyeAlertness: String,
    overallWellnessIndex: String,
    pulseWaveform: String
  },
  conditionStatus: String,
  insights: [String],
  summary: String,
  recommendations: [String],
}, { timestamps: true });

export const HealthReport = mongoose.model('HealthReport', healthReportSchema);
