// ══════════════════════════════════════════════
// PetsPage — Gestión de mascotas del hogar
// ══════════════════════════════════════════════

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";
import type { ApiResponse } from "@homeassistan/shared";
import {
  PawPrint,
  Plus,
  X,
  Pencil,
  Trash2,
  Stethoscope,
  AlertTriangle,
  Weight,
  Cake,
  ChevronLeft,
} from "lucide-react";

// ── Types ────────────────────────────────────

interface Pet {
  id: string;
  houseId: string;
  name: string;
  species: string;
  breed: string | null;
  birthDate: string | null;
  weight: number | null;
  avatar: string | null;
  allergies: string | null;
  vetName: string | null;
  vetPhone: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

type PetForm = {
  name: string;
  species: string;
  breed: string;
  birthDate: string;
  weight: string;
  avatar: string;
  allergies: string;
  vetName: string;
  vetPhone: string;
  notes: string;
};

const emptyForm: PetForm = {
  name: "",
  species: "",
  breed: "",
  birthDate: "",
  weight: "",
  avatar: "",
  allergies: "",
  vetName: "",
  vetPhone: "",
  notes: "",
};

const speciesOptions = [
  "Perro",
  "Gato",
  "Pájaro",
  "Pez",
  "Conejo",
  "Hámster",
  "Tortuga",
  "Otro",
];

const speciesEmoji: Record<string, string> = {
  Perro: "🐕",
  Gato: "🐈",
  Pájaro: "🐦",
  Pez: "🐟",
  Conejo: "🐇",
  Hámster: "🐹",
  Tortuga: "🐢",
};

// ── Component ────────────────────────────────

export function PetsPage() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const [showModal, setShowModal] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [form, setForm] = useState<PetForm>(emptyForm);

  const canCreate = can("pets", "createPet");
  const canEdit = can("pets", "editPet");
  const canDelete = can("pets", "deletePet");

  // ── Queries ──────────────────────────────

  const {
    data: pets = [],
    isLoading,
    isError,
  } = useQuery<Pet[]>({
    queryKey: ["pets"],
    queryFn: async (): Promise<Pet[]> => {
      const { data } = await api.get<ApiResponse>("/pets");
      return data.data as Pet[];
    },
  });

  // ── Mutations ────────────────────────────

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post("/pets", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast.success("Mascota creada");
      closeModal();
    },
    onError: () => toast.error("Error al crear mascota"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.patch(`/pets/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast.success("Mascota actualizada");
      closeModal();
      setSelectedPet(null);
    },
    onError: () => toast.error("Error al actualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/pets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast.success("Mascota eliminada");
      setSelectedPet(null);
    },
    onError: () => toast.error("Error al eliminar"),
  });

  // ── Helpers ──────────────────────────────

  function openCreate() {
    setEditingPet(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(pet: Pet) {
    setEditingPet(pet);
    setForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || "",
      birthDate: pet.birthDate || "",
      weight: pet.weight?.toString() || "",
      avatar: pet.avatar || "",
      allergies: pet.allergies || "",
      vetName: pet.vetName || "",
      vetPhone: pet.vetPhone || "",
      notes: pet.notes || "",
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingPet(null);
    setForm(emptyForm);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body: Record<string, unknown> = {
      name: form.name,
      species: form.species,
    };
    if (form.breed) body.breed = form.breed;
    if (form.birthDate) body.birthDate = form.birthDate;
    if (form.weight) body.weight = parseFloat(form.weight);
    if (form.avatar) body.avatar = form.avatar;
    if (form.allergies) body.allergies = form.allergies;
    if (form.vetName) body.vetName = form.vetName;
    if (form.vetPhone) body.vetPhone = form.vetPhone;
    if (form.notes) body.notes = form.notes;

    if (editingPet) {
      updateMutation.mutate({ id: editingPet.id, body });
    } else {
      createMutation.mutate(body);
    }
  }

  function formatAge(birthDate: string | null): string {
    if (!birthDate) return "";
    const birth = new Date(birthDate);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    if (years > 0) return `${years} año${years > 1 ? "s" : ""}`;
    if (months > 0) return `${months} mes${months > 1 ? "es" : ""}`;
    return "< 1 mes";
  }

  // ── Detail View ──────────────────────────

  if (selectedPet) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        {/* Back button */}
        <button
          onClick={() => setSelectedPet(null)}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <ChevronLeft className="w-4 h-4" /> Volver a mascotas
        </button>

        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-4xl shrink-0">
              {speciesEmoji[selectedPet.species] || "🐾"}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {selectedPet.name}
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                {selectedPet.species}
                {selectedPet.breed && ` • ${selectedPet.breed}`}
              </p>
              <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-600 dark:text-slate-300">
                {selectedPet.birthDate && (
                  <span className="flex items-center gap-1">
                    <Cake className="w-4 h-4" />
                    {formatAge(selectedPet.birthDate)}
                  </span>
                )}
                {selectedPet.weight && (
                  <span className="flex items-center gap-1">
                    <Weight className="w-4 h-4" />
                    {selectedPet.weight} kg
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {canEdit && (
                <button
                  onClick={() => openEdit(selectedPet)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <Pencil className="w-4 h-4 text-slate-500" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar a ${selectedPet.name}?`)) {
                      deleteMutation.mutate(selectedPet.id);
                    }
                  }}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Vet Info */}
        {(selectedPet.vetName || selectedPet.vetPhone) && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-500" />
              Información Veterinaria
            </h3>
            <div className="space-y-2 text-sm">
              {selectedPet.vetName && (
                <p>
                  <span className="text-slate-500">Veterinario:</span>{" "}
                  <span className="text-slate-900 dark:text-white">{selectedPet.vetName}</span>
                </p>
              )}
              {selectedPet.vetPhone && (
                <p>
                  <span className="text-slate-500">Teléfono:</span>{" "}
                  <a
                    href={`tel:${selectedPet.vetPhone}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {selectedPet.vetPhone}
                  </a>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Allergies */}
        {selectedPet.allergies && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-5 border border-red-200 dark:border-red-800">
            <h3 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Alergias
            </h3>
            <p className="text-sm text-red-600 dark:text-red-400">{selectedPet.allergies}</p>
          </div>
        )}

        {/* Notes */}
        {selectedPet.notes && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Notas</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line">
              {selectedPet.notes}
            </p>
          </div>
        )}

        {/* Modal if editing */}
        {showModal && <PetModal />}
      </div>
    );
  }

  // ── List View ────────────────────────────

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PawPrint className="w-7 h-7 text-amber-500" />
            Mascotas
          </h1>
          <p className="text-sm text-slate-500 mt-1">Fichas de tus mascotas</p>
        </div>
        {canCreate && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Mascota</span>
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="text-center py-16 text-red-500">
          Error al cargar mascotas
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && pets.length === 0 && (
        <div className="text-center py-16">
          <PawPrint className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-1">
            Sin mascotas registradas
          </h3>
          <p className="text-sm text-slate-400">
            {canCreate
              ? "Agrega la primera mascota de tu hogar"
              : "Aún no se han registrado mascotas"}
          </p>
        </div>
      )}

      {/* Pet Cards Grid */}
      {!isLoading && pets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pets.map((pet) => (
            <button
              key={pet.id}
              onClick={() => setSelectedPet(pet)}
              className={cn(
                "bg-white dark:bg-slate-800 rounded-2xl p-5 text-left",
                "border border-slate-200 dark:border-slate-700",
                "hover:border-amber-300 dark:hover:border-amber-600",
                "hover:shadow-md transition-all duration-200",
                "group cursor-pointer",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                  {speciesEmoji[pet.species] || "🐾"}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                    {pet.name}
                  </h3>
                  <p className="text-sm text-slate-500 truncate">
                    {pet.species}
                    {pet.breed && ` • ${pet.breed}`}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {pet.birthDate && (
                      <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                        {formatAge(pet.birthDate)}
                      </span>
                    )}
                    {pet.weight && (
                      <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                        {pet.weight} kg
                      </span>
                    )}
                    {pet.allergies && (
                      <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                        ⚠ Alergias
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && <PetModal />}
    </div>
  );

  // ── Modal Sub-component ──────────────────

  function PetModal() {
    const isSaving = createMutation.isPending || updateMutation.isPending;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40" onClick={closeModal} />

        {/* Panel */}
        <form
          onSubmit={handleSubmit}
          className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {editingPet ? "Editar Mascota" : "Nueva Mascota"}
            </h2>
            <button
              type="button"
              onClick={closeModal}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="px-6 py-4 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nombre *
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                placeholder="Nombre de la mascota"
              />
            </div>

            {/* Species */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Especie *
              </label>
              <select
                required
                value={form.species}
                onChange={(e) => setForm({ ...form, species: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              >
                <option value="">Seleccionar...</option>
                {speciesOptions.map((s) => (
                  <option key={s} value={s}>
                    {speciesEmoji[s] || "🐾"} {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Breed */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Raza
              </label>
              <input
                value={form.breed}
                onChange={(e) => setForm({ ...form, breed: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                placeholder="Ej: Labrador, Siamés..."
              />
            </div>

            {/* Birth Date + Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="0.0"
                />
              </div>
            </div>

            {/* Allergies */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Alergias
              </label>
              <textarea
                rows={2}
                value={form.allergies}
                onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none"
                placeholder="Alergias conocidas..."
              />
            </div>

            {/* Vet Info */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-blue-500" />
                Veterinario
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nombre
                  </label>
                  <input
                    value={form.vetName}
                    onChange={(e) => setForm({ ...form, vetName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    placeholder="Dr. García"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    value={form.vetPhone}
                    onChange={(e) => setForm({ ...form, vetPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    placeholder="600 123 456"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Notas
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none"
                placeholder="Información adicional..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-xl transition-colors"
            >
              {isSaving ? "Guardando..." : editingPet ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    );
  }
}
