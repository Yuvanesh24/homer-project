import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['admin', 'therapist', 'data_entry']),
});

export const createPatientSchema = z.object({
  patientId: z.string().min(1),
  age: z.number().int().min(18).max(100),
  affectedHand: z.enum(['left', 'right']),
  groupType: z.enum(['intervention', 'control']),
  vcgAssignment: z.enum(['VCG2', 'VCG3', 'VCG4_5']).optional(),
  studyStartDate: z.string().or(z.date()),
  enrollmentDate: z.string().or(z.date()),
  phoneNumber: z.string().optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

export const createDeviceSchema = z.object({
  setNumber: z.number().int().min(1).max(5),
  marsDeviceId: z.string().min(1),
  plutoDeviceId: z.string().min(1),
  laptopNumber: z.string().min(1),
  modemSerial: z.string().min(1),
  actigraphLeftSerial: z.string().min(1),
  actigraphRightSerial: z.string().min(1),
});

export const updateDeviceSchema = createDeviceSchema.partial();

export const createSimSchema = z.object({
  simNumber: z.string().min(1),
  provider: z.enum(['airtel', 'jio']),
  linkedDeviceSetId: z.string().uuid().optional(),
});

export const rechargeSimSchema = z.object({
  rechargeDate: z.string().or(z.date()),
  durationDays: z.number().int().positive(),
});

export const createInterventionSessionSchema = z.object({
  patientId: z.string().uuid(),
  sessionDate: z.string().or(z.date()),
  studyDay: z.number().int().min(0),
  durationMinutes: z.number().int().optional(),
  roboticAssessmentScore: z.number().optional(),
  exercisesPerformed: z.string().optional(),
  mechanismsUsed: z.string().optional(),
  adlTrainingGiven: z.string().optional(),
  patientFeedback: z.string().optional(),
  therapistNotes: z.string().optional(),
  devicePerformanceNotes: z.string().optional(),
});

export const createControlSessionSchema = z.object({
  patientId: z.string().uuid(),
  sessionDate: z.string().or(z.date()),
  studyDay: z.number().int().min(0),
  durationMinutes: z.number().int().optional(),
  manualExercisesGiven: z.string().optional(),
  adlTrainingGiven: z.string().optional(),
  patientFeedback: z.string().optional(),
  therapistNotes: z.string().optional(),
});

export const createAdverseEventSchema = z.object({
  patientId: z.string().uuid(),
  eventDate: z.string().or(z.date()),
  studyDay: z.number().int().min(0),
  eventType: z.string().min(1),
  severity: z.enum(['minor', 'moderate', 'severe', 'life_threatening']),
  description: z.string().optional(),
  actionTaken: z.string().optional(),
  reportedToPi: z.boolean().optional(),
  requiresDropout: z.boolean().optional(),
});

export const createIssueLogSchema = z.object({
  patientId: z.string().uuid(),
  contactDate: z.string().or(z.date()),
  contactType: z.enum(['phone', 'home_visit']),
  durationMinutes: z.number().int().optional(),
  issueType: z.enum(['technical', 'medical', 'scheduling', 'other']),
  issueDescription: z.string().optional(),
  rootCause: z.string().optional(),
  solutionProvided: z.string().optional(),
  followUpRequired: z.boolean().optional(),
  followUpDate: z.string().or(z.date()).optional(),
});

export const updateEventSchema = z.object({
  status: z.enum(['pending', 'completed', 'skipped', 'cancelled']),
  completionDate: z.string().or(z.date()).optional(),
  notes: z.string().optional(),
});

export const dropoutSchema = z.object({
  dropoutDate: z.string().or(z.date()),
  dropoutReason: z.string().min(1),
  dropoutReasonType: z.string().min(1),
});
