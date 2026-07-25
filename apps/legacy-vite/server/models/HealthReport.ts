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
    pulseWaveform: String,
    // Advanced Dermatological Metrics
    wrinkles: String,
    skinTone: String,
    pigmentation: String,
    darkCircles: String,
    hydration: String,
    skinAge: Number,
    // Morphological & Facial Metrics
    faceShape: String,
    facialSymmetry: String,
    faceFatPercentage: Number,
    bodyFatEstimation: Number,
    jawlineDefinition: String,
    neckFat: String,
    doubleChinDetection: String,
    // Advanced Wellness & Cognitive Metrics
    sleepQualityEstimation: String,
    energyScore: Number,
    recoveryScore: Number,
    moodDetection: String
  },
  conditionStatus: String,
  insights: [String],
  summary: String,
  recommendations: [String],
}, { timestamps: true });

export const HealthReport = mongoose.model('HealthReport', healthReportSchema);
