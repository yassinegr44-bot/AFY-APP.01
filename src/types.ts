import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'staff' | 'agent';

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  isNameConfigured?: boolean;
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

export interface AmputeeRecord {
  id: string;
  refNumber?: string;
  syncStatus?: 'pending' | 'synced';
  name: string;
  firstName: string;
  dob?: Timestamp;
  cin?: string;
  bodyParts: string[];
  cause: string;
  otherCauseDescription?: string;
  amputationDateTime: Timestamp;
  eventLocation?: string;
  notes?: string;
  fridgePosition?: number;
  createdAt: Timestamp;
  createdBy: string;
}

export interface AppData {
  deceased: DeceasedRecord[];
  historicalDeceased: DeceasedRecord[];
  amputees: AmputeeRecord[];
  fridge: FridgePosition[];
  settings: AppSettings;
  users?: AppUser[];
}

export type CaseType = 'DÉCÈS' | 'FŒTUS' | 'MORT_NÉ' | 'ENFANT_MOINS_1_AN' | 'MEMBRE_AMPUTÉ';

export interface DeceasedRecord {
  id: string;
  refNumber?: string;
  syncStatus?: 'pending' | 'synced';
  name: string;
  cin?: string;
  gender: 'Masculin' | 'Féminin' | 'Autre';
  otherGender?: string;
  dob?: Timestamp;
  dateOfDeath: Timestamp;
  timeOfDeath: string;
  cause: string;
  origin: 'Marocain' | 'Étranger';
  nationality?: string;
  originDetail?: string;
  admissionDate: Timestamp;
  admissionTime: string;
  fridgePosition: number;
  fridgeNumber?: number;
  status: DeceasedStatus;
  isUnknown?: boolean;
  caseType?: CaseType;
  missingBodyParts?: string[];
  otherMissingBodyPartsDescription?: string;
  exitDate?: Timestamp;
  exitTime?: string;
  exitNotes?: string;
  transportMethod?: 'Ambulance' | 'Autre' | 'Autre_transport';
  ambulanceNumber?: string;
  takingChargeType?: 'Famille' | 'Association' | 'Autre';
  takingChargeResponsibleName?: string;
  takingChargeRelation?: string;
  takingChargePhone?: string;
  takingChargeAssociationName?: string;
  takingChargeOtherDescription?: string;
  takingChargeResponsibleRelation?: string;
  takingChargeResponsibleContact?: string;
  transportType?: string;
  transportDetails?: string;
  destination?: string;
  destinationType?: 'Kenitra' | 'Hors_region';
  destinationCityOrCommune?: string;
  destinationPrecise?: string;
  destinationRegion?: string;
  transferType?: 'Intra_regional' | 'Extra_regional';
  notes?: string;
  timeline: TimelineEvent[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isHistorical?: boolean;
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
