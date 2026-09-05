// Mirrors prisma/schema.prisma. When Supabase goes in, these
// get replaced by the generated Prisma types.

export type Role = "OWNER" | "STAFF";
export type Condition = "GOOD" | "FAIR" | "SPARES_ONLY";
export type PartStatus = "DRAFT" | "IN_STOCK" | "RESERVED" | "SOLD" | "RETURNED";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number | null;
  vin: string | null;
  registration: string | null;
  color: string | null;
  purchasePrice: number;
  purchaseDate: string;
  notes: string | null;
  addedById: string;
  createdAt: string;
}

export interface Part {
  id: string;
  name: string;
  brand: string | null;
  serialNumber: string | null;
  condition: Condition;
  description: string | null;
  costPrice: number | null;
  sellingPrice: number;
  quantity: number;
  location: string | null;
  status: PartStatus;
  images: string[]; // data URLs in the demo, storage URLs later
  vehicleId: string | null;
  addedById: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  partId: string;
  quantity: number;
  priceAtSale: number;
  costAtSale: number | null;
}

export interface Sale {
  id: string;
  saleDate: string;
  customerName: string | null;
  customerPhone: string | null;
  total: number;
  soldById: string;
  notes: string | null;
  items: SaleItem[];
}

export const CONDITION_LABEL: Record<Condition, string> = {
  GOOD: "Good",
  FAIR: "Fair",
  SPARES_ONLY: "Spares",
};

export const STATUS_LABEL: Record<PartStatus, string> = {
  DRAFT: "Needs details",
  IN_STOCK: "In stock",
  RESERVED: "On hold",
  SOLD: "Sold",
  RETURNED: "Returned",
};

export interface ProjectTask { id: string; vehicleId: string; name: string; done: boolean; }
