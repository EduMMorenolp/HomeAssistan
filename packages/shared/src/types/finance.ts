// ══════════════════════════════════════════════
// Tipos de Finanzas
// ══════════════════════════════════════════════

export type ExpenseCategory =
  | "food"
  | "utilities"
  | "maintenance"
  | "transport"
  | "health"
  | "entertainment"
  | "education"
  | "clothing"
  | "other";

export interface ExpenseInfo {
  id: string;
  description: string;
  amount: string; // numeric as string from DB
  category: ExpenseCategory;
  paidBy?: string | null;
  paidByName?: string;
  receiptUrl?: string | null;
  note?: string | null;
  expenseDate: string;
  createdAt: string;
}

export interface CreateExpenseRequest {
  description: string;
  amount: number;
  category?: ExpenseCategory;
  paidBy?: string;
  receiptUrl?: string;
  note?: string;
  expenseDate?: string;
}

export interface UpdateExpenseRequest {
  description?: string;
  amount?: number;
  category?: ExpenseCategory;
  note?: string;
}

export interface ExpenseSummary {
  totalMonth: number;
  totalWeek: number;
  byCategory: { category: ExpenseCategory; total: number }[];
  recentExpenses: ExpenseInfo[];
}

export interface ShoppingItemInfo {
  id: string;
  name: string;
  quantity: number;
  unit?: string | null;
  category?: string | null;
  estimatedPrice?: string | null;
  isPurchased: boolean;
  addedBy?: string | null;
  addedByName?: string;
  purchasedBy?: string | null;
  createdAt: string;
}

export interface CreateShoppingItemRequest {
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  estimatedPrice?: number;
}

export interface HouseholdItemInfo {
  id: string;
  name: string;
  category?: string | null;
  location?: string | null;
  quantity: number;
  minQuantity: number;
  unit?: string | null;
  isLow: boolean;
}

export interface CreateHouseholdItemRequest {
  name: string;
  category?: string;
  location?: string;
  quantity?: number;
  minQuantity?: number;
  unit?: string;
}

export interface UpdateHouseholdItemRequest {
  name?: string;
  category?: string;
  location?: string;
  quantity?: number;
  minQuantity?: number;
  unit?: string;
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: "Alimentación",
  utilities: "Servicios",
  maintenance: "Mantenimiento",
  transport: "Transporte",
  health: "Salud",
  entertainment: "Entretenimiento",
  education: "Educación",
  clothing: "Ropa",
  other: "Otros",
};

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food: "#22c55e",
  utilities: "#3b82f6",
  maintenance: "#f59e0b",
  transport: "#8b5cf6",
  health: "#ef4444",
  entertainment: "#ec4899",
  education: "#06b6d4",
  clothing: "#f97316",
  other: "#6b7280",
};
