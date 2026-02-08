// ══════════════════════════════════════════════
// Tipos de Salud
// ══════════════════════════════════════════════

export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "unknown";
export type MedicationFrequency = "once" | "daily" | "twice_daily" | "three_daily" | "weekly" | "as_needed";

export interface HealthProfileInfo {
  id: string;
  userId: string;
  userName?: string;
  bloodType: BloodType;
  allergies: string[];
  conditions: string[];
  emergencyNotes?: string | null;
  doctorName?: string | null;
  doctorPhone?: string | null;
  insuranceInfo?: string | null;
}

export interface UpsertHealthProfileRequest {
  bloodType?: BloodType;
  allergies?: string[];
  conditions?: string[];
  emergencyNotes?: string;
  doctorName?: string;
  doctorPhone?: string;
  insuranceInfo?: string;
}

export interface MedicationInfo {
  id: string;
  userId?: string | null;
  userName?: string;
  name: string;
  dosage?: string | null;
  frequency: MedicationFrequency;
  timeOfDay?: string | null;
  instructions?: string | null;
  stock: number;
  minStock: number;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

export interface CreateMedicationRequest {
  userId?: string;
  name: string;
  dosage?: string;
  frequency?: MedicationFrequency;
  timeOfDay?: string;
  instructions?: string;
  stock?: number;
  minStock?: number;
  startDate?: string;
  endDate?: string;
}

export interface UpdateMedicationRequest {
  name?: string;
  dosage?: string;
  frequency?: MedicationFrequency;
  timeOfDay?: string;
  instructions?: string;
  stock?: number;
  minStock?: number;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface MedicationLogInfo {
  id: string;
  medicationId: string;
  medicationName?: string;
  userId: string;
  userName?: string;
  takenAt: string;
  wasSkipped: boolean;
  note?: string | null;
}

export interface LogMedicationRequest {
  medicationId: string;
  wasSkipped?: boolean;
  note?: string;
}

export interface HealthRoutineInfo {
  id: string;
  userId?: string | null;
  userName?: string;
  name: string;
  description?: string | null;
  timeOfDay?: string | null;
  daysOfWeek: number[];
  isActive: boolean;
}

export interface CreateHealthRoutineRequest {
  userId?: string;
  name: string;
  description?: string;
  timeOfDay?: string;
  daysOfWeek?: number[];
}

export const BLOOD_TYPE_LABELS: Record<BloodType, string> = {
  "A+": "A+", "A-": "A-", "B+": "B+", "B-": "B-",
  "AB+": "AB+", "AB-": "AB-", "O+": "O+", "O-": "O-",
  unknown: "Desconocido",
};

export const FREQUENCY_LABELS: Record<MedicationFrequency, string> = {
  once: "Una vez",
  daily: "Diario",
  twice_daily: "2 veces/día",
  three_daily: "3 veces/día",
  weekly: "Semanal",
  as_needed: "Según necesidad",
};
