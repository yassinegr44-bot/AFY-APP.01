import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'staff';

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export type DeceasedStatus = 'in_facility' | 'released';

export interface TimelineEvent {
  id: string;
  type: 'admission' | 'status_change' | 'fridge_move' | 'note' | 'exit';
  title: string;
  description: string;
  timestamp: Timestamp;
  createdBy: string;
  metadata?: any;
}

export interface Report {
  id: string;
  period: string;
  totalDeceased: number;
  totalAdmissions: number;
  totalExits: number;
  fridgeOccupancy: number;
  stats: any;
  exceeding15Days: number;
  createdAt: Timestamp;
  createdBy: string;
  pdfUrl?: string;
}

export interface AppData {
  deceased: DeceasedRecord[];
  fridge: FridgePosition[];
  settings: AppSettings;
}

export interface DeceasedRecord {
  id: string;
  refNumber: string;
  name: string;
  gender?: string;
  dob?: Timestamp;
  dateOfDeath: Timestamp;
  timeOfDeath: string;
  cause: string;
  origin: string;
  admissionDate: Timestamp;
  admissionTime: string;
  fridgePosition: number;
  status: DeceasedStatus;
  isUnknown?: boolean;
  exitDate?: Timestamp;
  exitTime?: string;
  exitNotes?: string;
  notes?: string;
  timeline: TimelineEvent[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type FridgeStatus = 'available' | 'occupied' | 'panne' | 'out_of_service';

export interface FridgePosition {
  id: string; // The position number as string
  position: number;
  status: FridgeStatus;
  deceasedId?: string;
}

export interface AppSettings {
  alertThresholdDays: number;
}
