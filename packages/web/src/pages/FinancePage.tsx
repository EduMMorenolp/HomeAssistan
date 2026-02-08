// ══════════════════════════════════════════════
// Finance Page — Gastos · Compras · Inventario
// ══════════════════════════════════════════════

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Plus,
  Wallet,
  ShoppingCart,
  Package,
  Trash2,
  CheckCircle2,
  Circle,
  Loader2,
  X,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import type {
  ExpenseInfo,
  ExpenseSummary,
  ExpenseCategory,
  CreateExpenseRequest,
  ShoppingItemInfo,
  CreateShoppingItemRequest,
  HouseholdItemInfo,
  CreateHouseholdItemRequest,
  UpdateHouseholdItemRequest,
} from "@homeassistan/shared";
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_COLORS,
} from "@homeassistan/shared";

type TabKey = "expenses" | "shopping" | "inventory";

// ══════════════════════════════════════════════
// Componente principal
// ══════════════════════════════════════════════

export function FinancePage() {
  const [tab, setTab] = useState<TabKey>("expenses");

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Finanzas
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Gastos, compras e inventario del hogar
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit overflow-x-auto">
        {([
          { key: "expenses", label: "Gastos", icon: Wallet },
          { key: "shopping", label: "Compras", icon: ShoppingCart },
          { key: "inventory", label: "Inventario", icon: Package },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
              tab === t.key
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "expenses" && <ExpensesSection />}
      {tab === "shopping" && <ShoppingSection />}
      {tab === "inventory" && <InventorySection />}
    </div>
  );
}

// ══════════════════════════════════════════════
// GASTOS
// ══════════════════════════════════════════════

function ExpensesSection() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["expense-summary"],
    queryFn: async () => {
      const { data } = await api.get("/finance/expenses/summary");
      return data.data as ExpenseSummary;
    },
  });

  const { data: expenses, isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data } = await api.get("/finance/expenses");
      return data.data as ExpenseInfo[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/finance/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
      toast.success("Gasto eliminado");
    },
    onError: () => toast.error("Error al eliminar"),
  });

  return (
    <div className="space-y-4">
      {/* Resumen */}
      {!loadingSummary && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Este mes</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  ${summary.totalMonth.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Esta semana</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  ${summary.totalWeek.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          {/* Categorías top */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:col-span-2 lg:col-span-1">
            <p className="text-xs text-slate-500 mb-2">Por categoría</p>
            <div className="space-y-1.5">
              {summary.byCategory.slice(0, 4).map((cat) => (
                <div key={cat.category} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        EXPENSE_CATEGORY_COLORS[cat.category] || "#6b7280",
                    }}
                  />
                  <span className="text-slate-600 dark:text-slate-300 flex-1 truncate">
                    {EXPENSE_CATEGORY_LABELS[cat.category]}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    ${cat.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Botón añadir */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Registrar gasto
        </button>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : !expenses || expenses.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay gastos registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((exp) => (
            <div
              key={exp.id}
              className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4"
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    EXPENSE_CATEGORY_COLORS[exp.category] || "#6b7280",
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                  {exp.description}
                </p>
                <p className="text-xs text-slate-400">
                  {EXPENSE_CATEGORY_LABELS[exp.category]}
                  {exp.paidByName ? ` · ${exp.paidByName}` : ""}
                  {" · "}
                  {new Date(exp.expenseDate).toLocaleDateString("es")}
                </p>
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base whitespace-nowrap">
                ${parseFloat(exp.amount).toFixed(2)}
              </span>
              <button
                onClick={() => {
                  if (confirm("¿Eliminar este gasto?")) deleteMutation.mutate(exp.id);
                }}
                className="text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal añadir gasto */}
      {showForm && (
        <CreateExpenseModal onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

// ── Modal: Crear gasto ───────────────────────

function CreateExpenseModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateExpenseRequest>({
    description: "",
    amount: 0,
    category: "other",
  });

  const mutation = useMutation({
    mutationFn: async (body: CreateExpenseRequest) => {
      const { data } = await api.post("/finance/expenses", body);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
      toast.success("Gasto registrado");
      onClose();
    },
    onError: () => toast.error("Error al registrar gasto"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim() || form.amount <= 0) return;
    mutation.mutate({ ...form, description: form.description.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Registrar gasto
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Descripción *
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Ej: Compra del supermercado"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Monto *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.amount || ""}
                onChange={(e) =>
                  setForm({ ...form, amount: parseFloat(e.target.value) || 0 })
                }
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Categoría
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as ExpenseCategory })
                }
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500"
              >
                {(
                  Object.entries(EXPENSE_CATEGORY_LABELS) as [ExpenseCategory, string][]
                ).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={form.expenseDate ?? ""}
              onChange={(e) =>
                setForm({ ...form, expenseDate: e.target.value || undefined })
              }
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nota
            </label>
            <textarea
              value={form.note ?? ""}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-orange-500"
              placeholder="Opcional"
              rows={2}
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending || !form.description.trim() || form.amount <= 0}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Registrar gasto
          </button>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// LISTA DE COMPRAS
// ══════════════════════════════════════════════

function ShoppingSection() {
  const queryClient = useQueryClient();
  const [newItem, setNewItem] = useState("");

  const { data: items, isLoading } = useQuery({
    queryKey: ["shopping"],
    queryFn: async () => {
      const { data } = await api.get("/finance/shopping");
      return data.data as ShoppingItemInfo[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (body: CreateShoppingItemRequest) => {
      const { data } = await api.post("/finance/shopping", body);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping"] });
      setNewItem("");
    },
    onError: () => toast.error("Error al añadir"),
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/finance/shopping/${id}/toggle`);
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shopping"] }),
    onError: () => toast.error("Error al actualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/finance/shopping/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping"] });
    },
    onError: () => toast.error("Error al eliminar"),
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      await api.delete("/finance/shopping/clear/purchased");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping"] });
      toast.success("Comprados limpiados");
    },
    onError: () => toast.error("Error al limpiar"),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    addMutation.mutate({ name: newItem.trim() });
  };

  const pending = (items ?? []).filter((i) => !i.isPurchased);
  const purchased = (items ?? []).filter((i) => i.isPurchased);

  return (
    <div className="space-y-4">
      {/* Quick add */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Añadir artículo..."
          className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={addMutation.isPending || !newItem.trim()}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors shrink-0"
        >
          {addMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : !items || items.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Lista de compras vacía</p>
        </div>
      ) : (
        <>
          {/* Pendientes */}
          <div className="space-y-1.5">
            {pending.map((item) => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                onToggle={() => toggleMutation.mutate(item.id)}
                onDelete={() => deleteMutation.mutate(item.id)}
              />
            ))}
          </div>

          {/* Comprados */}
          {purchased.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  Comprados ({purchased.length})
                </h3>
                <button
                  onClick={() => clearMutation.mutate()}
                  disabled={clearMutation.isPending}
                  className="text-xs text-red-400 hover:text-red-500 font-medium transition-colors"
                >
                  Limpiar
                </button>
              </div>
              <div className="space-y-1.5 opacity-60">
                {purchased.map((item) => (
                  <ShoppingItemRow
                    key={item.id}
                    item={item}
                    onToggle={() => toggleMutation.mutate(item.id)}
                    onDelete={() => deleteMutation.mutate(item.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ShoppingItemRow({
  item,
  onToggle,
  onDelete,
}: {
  item: ShoppingItemInfo;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5">
      <button onClick={onToggle} className="shrink-0 transition-colors">
        {item.isPurchased ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <Circle className="w-5 h-5 text-slate-300 hover:text-green-400 dark:text-slate-600 dark:hover:text-green-400" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm text-slate-900 dark:text-white truncate",
            item.isPurchased && "line-through text-slate-400 dark:text-slate-500"
          )}
        >
          {item.name}
          {item.quantity > 1 && (
            <span className="text-slate-400 ml-1">
              × {item.quantity}
              {item.unit ? ` ${item.unit}` : ""}
            </span>
          )}
        </p>
        {item.estimatedPrice && (
          <p className="text-xs text-slate-400">
            ~${parseFloat(item.estimatedPrice).toFixed(2)}
          </p>
        )}
      </div>
      <button
        onClick={onDelete}
        className="text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════
// INVENTARIO
// ══════════════════════════════════════════════

function InventorySection() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<HouseholdItemInfo | null>(null);
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data } = await api.get("/finance/inventory");
      return data.data as HouseholdItemInfo[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/finance/inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Artículo eliminado");
    },
    onError: () => toast.error("Error al eliminar"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: UpdateHouseholdItemRequest;
    }) => {
      const { data } = await api.patch(`/finance/inventory/${id}`, body);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: () => toast.error("Error al actualizar"),
  });

  const lowItems = (items ?? []).filter((i) => i.isLow);

  return (
    <div className="space-y-4">
      {/* Low stock alert */}
      {lowItems.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Stock bajo ({lowItems.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowItems.map((i) => (
              <span
                key={i.id}
                className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded-lg"
              >
                {i.name}
                <span className="font-medium ml-1">
                  ({i.quantity}/{i.minQuantity})
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Botón añadir */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Añadir artículo
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : !items || items.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Inventario vacío</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "bg-white dark:bg-slate-800 rounded-xl border p-4 transition-all",
                item.isLow
                  ? "border-yellow-300 dark:border-yellow-700"
                  : "border-slate-200 dark:border-slate-700"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <h4 className="font-medium text-sm text-slate-900 dark:text-white truncate">
                    {item.name}
                  </h4>
                  {item.category && (
                    <p className="text-xs text-slate-400">{item.category}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (confirm("¿Eliminar?")) deleteMutation.mutate(item.id);
                  }}
                  className="text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Cantidad con botones +/- */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateMutation.mutate({
                      id: item.id,
                      body: { quantity: Math.max(0, item.quantity - 1) },
                    })
                  }
                  className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-bold"
                >
                  −
                </button>
                <div className="flex-1 text-center">
                  <span
                    className={cn(
                      "text-lg font-bold",
                      item.isLow
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-slate-900 dark:text-white"
                    )}
                  >
                    {item.quantity}
                  </span>
                  {item.unit && (
                    <span className="text-xs text-slate-400 ml-1">
                      {item.unit}
                    </span>
                  )}
                  <p className="text-[10px] text-slate-400">
                    min: {item.minQuantity}
                  </p>
                </div>
                <button
                  onClick={() =>
                    updateMutation.mutate({
                      id: item.id,
                      body: { quantity: item.quantity + 1 },
                    })
                  }
                  className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-bold"
                >
                  +
                </button>
              </div>

              {item.location && (
                <p className="text-[10px] text-slate-400 mt-2 truncate">
                  📍 {item.location}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal crear */}
      {showForm && (
        <CreateInventoryModal onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

// ── Modal: Crear artículo de inventario ──────

function CreateInventoryModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateHouseholdItemRequest>({
    name: "",
    quantity: 1,
    minQuantity: 1,
  });

  const mutation = useMutation({
    mutationFn: async (body: CreateHouseholdItemRequest) => {
      const { data } = await api.post("/finance/inventory", body);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Artículo añadido");
      onClose();
    },
    onError: () => toast.error("Error al crear"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    mutation.mutate({ ...form, name: form.name.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Nuevo artículo
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ej: Papel higiénico"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Cantidad
              </label>
              <input
                type="number"
                min={0}
                value={form.quantity ?? 1}
                onChange={(e) =>
                  setForm({ ...form, quantity: parseInt(e.target.value) || 0 })
                }
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mínimo
              </label>
              <input
                type="number"
                min={0}
                value={form.minQuantity ?? 1}
                onChange={(e) =>
                  setForm({ ...form, minQuantity: parseInt(e.target.value) || 0 })
                }
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Categoría
              </label>
              <input
                type="text"
                value={form.category ?? ""}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500"
                placeholder="Ej: Limpieza"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Unidad
              </label>
              <input
                type="text"
                value={form.unit ?? ""}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500"
                placeholder="Ej: rollos"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Ubicación
            </label>
            <input
              type="text"
              value={form.location ?? ""}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500"
              placeholder="Ej: Baño principal"
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending || !form.name.trim()}
            className="w-full py-2.5 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Añadir artículo
          </button>
        </form>
      </div>
    </div>
  );
}
