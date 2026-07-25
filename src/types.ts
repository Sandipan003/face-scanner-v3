export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  avatar: string;
  role: 'patient' | 'doctor';
}

export interface ScannerResult {
  faceDetected: boolean;
  confidence: number;
  estimatedPulseBpm: number;
  stressLevel: string;
  fatigueScore: string;
  eyeAlertness: string;
  skinHydration?: string; // Optional since it might be dropped later
  overallWellnessIndex: string;
  respiratoryRate: string;
  hrv: string;
  bloodPressureChanges: string;
  pulseWaveform: string;
  conditionStatus: string;
  insights: string[];
  disclaimer: string;
}

export interface HealthReport {
  _id: string;
  userId: string;
  date: string;
  vitals: {
    heartRate: number;
    stressLevel: string;
    fatigueScore: string;
    eyeAlertness: string;
    overallWellnessIndex: string;
    respiratoryRate: string;
    hrv: string;
    bloodPressureChanges: string;
    pulseWaveform: string;
  };
  conditionStatus: string;
  insights: string[];
}
