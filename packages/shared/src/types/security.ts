// ══════════════════════════════════════════════
// Tipos de Seguridad
// ══════════════════════════════════════════════

export type VaultCategory = "wifi" | "alarm" | "safe" | "insurance" | "utility" | "subscription" | "other";
export type AccessAction = "login" | "logout" | "failed_login" | "house_select" | "visitor_code_used" | "panic_triggered" | "vault_accessed";

export interface EmergencyContactInfo {
  id: string;
  name: string;
  phone: string;
  relationship?: string | null;
  isPrimary: boolean;
  notes?: string | null;
}

export interface CreateEmergencyContactRequest {
  name: string;
  phone: string;
  relationship?: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface UpdateEmergencyContactRequest {
  name?: string;
  phone?: string;
  relationship?: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface VaultEntryInfo {
  id: string;
  category: VaultCategory;
  label: string;
  value: string;
  notes?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

export interface CreateVaultEntryRequest {
  category: VaultCategory;
  label: string;
  value: string;
  notes?: string;
}

export interface UpdateVaultEntryRequest {
  category?: VaultCategory;
  label?: string;
  value?: string;
  notes?: string;
}

export interface VisitorCodeInfo {
  id: string;
  code: string;
  label?: string | null;
  expiresAt?: string | null;
  isUsed: boolean;
  usedAt?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

export interface CreateVisitorCodeRequest {
  label?: string;
  expiresAt?: string;
}

export interface AccessLogInfo {
  id: string;
  userId?: string | null;
  userName?: string;
  action: AccessAction;
  ipAddress?: string | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
}

export const VAULT_CATEGORY_LABELS: Record<VaultCategory, string> = {
  wifi: "WiFi",
  alarm: "Alarma",
  safe: "Caja fuerte",
  insurance: "Seguro",
  utility: "Suministro",
  subscription: "Suscripción",
  other: "Otro",
};
