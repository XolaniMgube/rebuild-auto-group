"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Condition, Part, PartStatus, Sale, User, Vehicle, ProjectTask } from "./types";
import { SEED_PARTS, SEED_SALES, SEED_USERS, SEED_VEHICLES } from "./seed";
import { newId } from "./format";

// ---------------------------------------------------------------
// DEMO DATA LAYER
//
// This stands in for the database. Everything lives in the browser
// and persists to localStorage so Mitchel can add a part, refresh,
// and still see it.
//
// When Supabase goes in, these actions become fetch() calls to
// Route Handlers. The shapes already match the Prisma schema, so
// the components shouldn't need to change much.
// ---------------------------------------------------------------

interface SaleDraftLine {
  partId: string;
  price: number;
}

interface State {
  tasks: ProjectTask[];
  addTask: (vehicleId: string, name: string) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  users: User[];
  vehicles: Vehicle[];
  parts: Part[];
  sales: Sale[];

  currentUserId: string | null;
  saleDraft: SaleDraftLine[];

  signIn: (userId: string) => void;
  signOut: () => void;

  addVehicle: (v: Omit<Vehicle, "id" | "createdAt" | "addedById">) => string;
  addPart: (p: Partial<Part> & { name: string }) => string;
  updatePart: (id: string, patch: Partial<Part>) => void;
  removePart: (id: string) => void;
  setPartStatus: (id: string, status: PartStatus) => void;

  addToSale: (partId: string) => void;
  removeFromSale: (partId: string) => void;
  clearSale: () => void;
  completeSale: (customerName: string | null, customerPhone: string | null) => string;

  resetDemo: () => void;
}

const baseState = () => ({
  tasks: [
    { id: "t1", vehicleId: "v_polovivo", name: "Find a left headlight", done: true },
    { id: "t2", vehicleId: "v_polovivo", name: "Check front bumper mounts", done: false },
    { id: "t3", vehicleId: "v_polovivo", name: "Source a radiator", done: false },
  ] as ProjectTask[],
  users: SEED_USERS,
  vehicles: SEED_VEHICLES,
  parts: SEED_PARTS,
  sales: SEED_SALES,
  currentUserId: null,
  saleDraft: [] as SaleDraftLine[],
});

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...baseState(),

      addTask: (vehicleId, name) => set({ tasks: [...get().tasks, { id: newId("t"), vehicleId, name: name.trim(), done: false }] }),
      toggleTask: (id) => set({ tasks: get().tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) }),
      removeTask: (id) => set({ tasks: get().tasks.filter(t => t.id !== id) }),

      signIn: (userId) => set({ currentUserId: userId }),
      signOut: () => set({ currentUserId: null, saleDraft: [] }),

      addVehicle: (v) => {
        const id = newId("v");
        const vehicle: Vehicle = {
          ...v,
          id,
          addedById: get().currentUserId ?? "u_mitchel",
          createdAt: new Date().toISOString(),
        };
        set({ vehicles: [vehicle, ...get().vehicles] });
        return id;
      },

      addPart: (p) => {
        const id = newId("p");
        const now = new Date().toISOString();
        const part: Part = {
          id,
          name: p.name,
          brand: p.brand ?? null,
          serialNumber: p.serialNumber ?? null,
          condition: (p.condition ?? "GOOD") as Condition,
          description: p.description ?? null,
          costPrice: p.costPrice ?? null,
          sellingPrice: p.sellingPrice ?? 0,
          quantity: p.quantity ?? 1,
          location: p.location ?? null,
          status: p.status ?? "IN_STOCK",
          images: p.images ?? [],
          vehicleId: p.vehicleId ?? null,
          addedById: get().currentUserId ?? "u_mitchel",
          createdAt: now,
          updatedAt: now,
        };
        set({ parts: [part, ...get().parts] });
        return id;
      },

      updatePart: (id, patch) =>
        set({
          parts: get().parts.map((p) =>
            p.id === id
              ? { ...p, ...patch, updatedAt: new Date().toISOString() }
              : p
          ),
        }),

      removePart: (id) =>
        set({
          parts: get().parts.filter((p) => p.id !== id),
          saleDraft: get().saleDraft.filter((l) => l.partId !== id),
        }),

      setPartStatus: (id, status) => get().updatePart(id, { status }),

      addToSale: (partId) => {
        const part = get().parts.find((p) => p.id === partId);
        if (!part) return;
        if (get().saleDraft.some((l) => l.partId === partId)) return;
        set({
          saleDraft: [
            ...get().saleDraft,
            { partId, price: part.sellingPrice },
          ],
        });
      },

      removeFromSale: (partId) =>
        set({ saleDraft: get().saleDraft.filter((l) => l.partId !== partId) }),

      clearSale: () => set({ saleDraft: [] }),

      // The real version of this runs inside prisma.$transaction():
      // create the Sale, create the SaleItems, flip each Part to SOLD.
      // All three or none — otherwise stock and revenue disagree.
      completeSale: (customerName, customerPhone) => {
        const { saleDraft, parts, sales, currentUserId } = get();
        const saleId = newId("s");
        const total = saleDraft.reduce((s, l) => s + l.price, 0);

        const sale: Sale = {
          id: saleId,
          saleDate: new Date().toISOString(),
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          total,
          soldById: currentUserId ?? "u_mitchel",
          notes: null,
          items: saleDraft.map((l, i) => ({
            id: `${saleId}_i${i}`,
            saleId,
            partId: l.partId,
            quantity: 1,
            // Frozen on purpose — see the schema comment.
            priceAtSale: l.price,
            costAtSale: null,
          })),
        };

        const soldIds = new Set(saleDraft.map((l) => l.partId));
        set({
          sales: [sale, ...sales],
          parts: parts.map((p) =>
            soldIds.has(p.id)
              ? { ...p, status: "SOLD" as PartStatus, updatedAt: sale.saleDate }
              : p
          ),
          saleDraft: [],
        });
        return saleId;
      },

      resetDemo: () =>
        set({ ...baseState(), currentUserId: get().currentUserId }),
    }),
    {
      name: "rebuild-auto-demo-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);

// ------------------------- selectors -------------------------

export function useVehicle(vehicleId: string | null) {
  return useStore((s) =>
    vehicleId ? s.vehicles.find((v) => v.id === vehicleId) ?? null : null
  );
}

export interface VehicleReturn {
  paid: number;
  recovered: number;
  profit: number;
  partsSold: number;
  partsTotal: number;
}

export function vehicleReturn(
  vehicleId: string,
  parts: Part[],
  vehicles: Vehicle[],
  sales: Sale[]
): VehicleReturn {
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  const paid = vehicle?.purchasePrice ?? 0;
  const vehicleParts = parts.filter((p) => p.vehicleId === vehicleId);
  const partIds = new Set(vehicleParts.map((p) => p.id));

  let recovered = 0;
  let partsSold = 0;
  for (const s of sales) {
    for (const item of s.items) {
      if (partIds.has(item.partId)) {
        recovered += item.priceAtSale;
        partsSold += 1;
      }
    }
  }

  return {
    paid,
    recovered,
    profit: recovered - paid,
    partsSold,
    partsTotal: vehicleParts.filter((p) => p.status !== "DRAFT").length,
  };
}

export function monthTotal(sales: Sale[], monthsBack = 0): number {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  return sales
    .filter((s) => {
      const d = new Date(s.saleDate);
      return (
        d.getFullYear() === target.getFullYear() &&
        d.getMonth() === target.getMonth()
      );
    })
    .reduce((sum, s) => sum + s.total, 0);
}

export function searchParts(
  parts: Part[],
  vehicles: Vehicle[],
  query: string,
  opts: { inStockOnly?: boolean; condition?: Condition | null } = {}
): Part[] {
  const q = query.trim().toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);

  return parts
    .filter((p) => p.status !== "DRAFT")
    .filter((p) => (opts.inStockOnly ? p.status === "IN_STOCK" : true))
    .filter((p) => (opts.condition ? p.condition === opts.condition : true))
    .filter((p) => {
      if (terms.length === 0) return true;
      const v = vehicles.find((x) => x.id === p.vehicleId);
      const haystack = [
        p.name,
        p.brand ?? "",
        p.serialNumber ?? "",
        p.location ?? "",
        p.description ?? "",
        v ? `${v.year ?? ""} ${v.make} ${v.model}` : "",
      ]
        .join(" ")
        .toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
}
