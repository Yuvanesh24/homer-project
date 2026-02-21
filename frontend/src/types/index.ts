export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'therapist' | 'data_entry';
  lastLogin?: string;
  createdAt?: string;
}

export interface Patient {
  id: string;
  patientId: string;
  name?: string;
  gender?: string;
  age: number;
  affectedHand: 'left' | 'right';
  groupType: 'intervention' | 'control';
  vcgAssignment?: 'VCG2' | 'VCG3' | 'VCG4_5';
  studyStartDate: string;
  enrollmentDate: string;
  phoneNumber?: string;
  status: 'active' | 'dropped_out' | 'completed';
  dropoutDate?: string;
  dropoutReason?: string;
  dropoutReasonType?: string;
  createdAt: string;
  updatedAt?: string;
  studyEvents?: StudyEvent[];
  deviceSet?: DeviceSet;
  interventionSessions?: InterventionSession[];
  controlSessions?: ControlSession[];
  adverseEvents?: AdverseEvent[];
  issueLogs?: IssueLog[];
  completedEventsCount?: number;
  totalEventsCount?: number;
  deviceSetNumber?: number;
  deviceStatus?: string;
}

export interface StudyEvent {
  id: string;
  patientId: string;
  eventName: string;
  eventType: string;
  scheduledDate: string;
  studyDay: number;
  status: 'pending' | 'completed' | 'skipped' | 'cancelled';
  completionDate?: string;
  notes?: string;
  completedById?: string;
  createdAt?: string;
  patient?: {
    patientId: string;
    groupType: string;
    status: string;
  };
}

export interface DeviceSet {
  id: string;
  setNumber: number;
  marsDeviceId: string;
  plutoDeviceId: string;
  laptopNumber: string;
  modemSerial: string;
  actigraphLeftSerial: string;
  actigraphRightSerial: string;
  status: 'available' | 'in_use' | 'under_maintenance';
  assignedPatientId?: string;
  patient?: {
    patientId: string;
    status: string;
    studyStartDate?: string;
  };
  assignmentDate?: string;
  expectedReturnDate?: string;
  returnDate?: string;
  simCards?: SimCard[];
}

export interface SimCard {
  id: string;
  simNumber: string;
  provider: 'airtel' | 'jio';
  linkedDeviceSetId?: string;
  linkedDeviceSet?: {
    setNumber: number;
  };
  rechargeDate?: string;
  rechargeDurationDays?: number;
  expiryDate?: string;
  isActive: boolean;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
  rechargeHistory?: SimRechargeHistory[];
}

export interface SimRechargeHistory {
  id: string;
  simCardId: string;
  rechargeDate: string;
  durationDays: number;
  expiryDate: string;
  loggedBy?: {
    firstName: string;
    lastName: string;
  };
}

export interface InterventionSession {
  id: string;
  patientId: string;
  sessionDate: string;
  studyDay: number;
  durationMinutes?: number;
  roboticAssessmentScore?: number;
  exercisesPerformed?: string;
  mechanismsUsed?: string;
  adlTrainingGiven?: string;
  patientFeedback?: string;
  therapistNotes?: string;
  devicePerformanceNotes?: string;
  loggedBy?: {
    firstName: string;
    lastName: string;
  };
}

export interface ControlSession {
  id: string;
  patientId: string;
  sessionDate: string;
  studyDay: number;
  durationMinutes?: number;
  manualExercisesGiven?: string;
  adlTrainingGiven?: string;
  patientFeedback?: string;
  therapistNotes?: string;
  loggedBy?: {
    firstName: string;
    lastName: string;
  };
}

export interface AdverseEvent {
  id: string;
  patientId: string;
  eventDate: string;
  studyDay: number;
  eventType: string;
  severity: 'minor' | 'moderate' | 'severe' | 'life_threatening';
  description?: string;
  actionTaken?: string;
  reportedToPi: boolean;
  requiresDropout: boolean;
  patient?: {
    patientId: string;
    groupType: string;
  };
}

export interface IssueLog {
  id: string;
  patientId: string;
  contactDate: string;
  contactType: 'phone' | 'home_visit';
  durationMinutes?: number;
  issueType: 'technical' | 'medical' | 'scheduling' | 'other';
  issueDescription?: string;
  rootCause?: string;
  solutionProvided?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  patient?: {
    patientId: string;
    groupType: string;
  };
}

export interface Reminder {
  id: string;
  patientId: string;
  reminderType: 'event' | 'sim_recharge' | 'device_return' | 'follow_up';
  referenceId?: string;
  title: string;
  description?: string;
  dueDate: string;
  isCompleted: boolean;
  patient?: {
    patientId: string;
    status: string;
  };
}

export interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  droppedOutPatients: number;
  completedPatients: number;
  todayReminders: number;
  overdueReminders: number;
  devicesInUse: number;
  interventionCount: number;
  controlCount: number;
}

export interface DashboardActions {
  upcomingEvents: StudyEvent[];
  overdueEvents: StudyEvent[];
  expiringSims: {
    id: string;
    simNumber: string;
    provider: string;
    expiryDate: string;
  }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
