// ══════════════════════════════════════════════
// Tipos de Casa (House)
// ══════════════════════════════════════════════

export interface House {
  id: string;
  name: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHouseRequest {
  name: string;
  address?: string;
  pin: string;
}

export interface UpdateHouseRequest {
  name?: string;
  address?: string;
  pin?: string;
}
