import type { Database } from "./database.types";

// App-side shapes. The database schema lives in supabase/migrations and its
// generated types in database.types.ts; lib/data.ts maps between the two.

type Enums = Database["public"]["Enums"];

export type Role = Enums["app_role"];
export type Condition = Enums["part_condition"];
export type PartStatus = Enums["part_status"];

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number | null;
  vin: string | null;
  registration: string | null;
  color: string | null;
  notes: string | null;
  purchasePrice: number;
  purchaseDate: string;
  paidBy: string | null; // owner id
  createdAt: string;
}

/** Signed Storage URLs for a photo and its small preview copy. */
export interface SignedPhoto {
  url: string;
  thumbUrl: string;
}

export interface PartPhoto extends SignedPhoto {
  id: string;
}

export interface Part {
  id: string;
  name: string;
  brand: string | null;
  serialNumber: string | null;
  condition: Condition;
  description: string | null;
  quantity: number;
  price: number; // asking price in rands; 0 means not priced yet
  location: string | null;
  status: PartStatus;
  heldBy: string | null; // who put it on hold, while it's on hold
  heldAt: string | null;
  images: PartPhoto[]; // cover photo first
  vehicleId: string | null;
  createdAt: string;
}

export interface VehicleDocument {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  url: string | null;
  thumbUrl: string | null;
  createdAt: string;
}

export interface ProjectTask {
  id: string;
  vehicleId: string;
  name: string;
  done: boolean;
}

export interface ProjectSummary {
  vehicle: Vehicle;
  photo: string | null; // preview URL
  money: { cost: number; revenue: number } | null; // owners only
  partCount: number;
  tasksDone: number;
  tasksTotal: number;
}

export type ExpenseCategory = "transport" | "labour" | "repairs" | "other";

export const EXPENSE_LABEL: Record<ExpenseCategory, string> = {
  transport: "Transport",
  labour: "Labour",
  repairs: "Repairs",
  other: "Other",
};

export const EXPENSE_OPTIONS = (Object.keys(EXPENSE_LABEL) as ExpenseCategory[]).map(value => ({ value, label: EXPENSE_LABEL[value] }));

export interface VehicleExpense {
  id: string;
  category: ExpenseCategory;
  description: string | null;
  amount: number;
  spentOn: string;
  paidBy: string | null; // owner's name
}

/** One sold line: what a part actually went for, and what was being asked at the time. */
export interface SoldItem {
  id: string;
  saleId: string;
  partId: string;
  partName: string;
  quantity: number;
  price: number;
  listPrice: number | null;
  soldAt: string;
  soldBy: string | null;
  receivedBy: string | null; // owner holding the money
  customerName: string | null;
}

export interface ProjectMoney {
  expenses: VehicleExpense[];
  sales: SoldItem[];
  income: VehicleIncome[];
}

export interface Owner {
  id: string;
  name: string;
}

/** Money a car brings in besides its parts, such as the shell going to scrap. */
export type IncomeKind = "scrap" | "other";

export const INCOME_LABEL: Record<IncomeKind, string> = { scrap: "Scrap / shell", other: "Other income" };
export const INCOME_OPTIONS = (Object.keys(INCOME_LABEL) as IncomeKind[]).map(value => ({ value, label: INCOME_LABEL[value] }));

export interface VehicleIncome {
  id: string;
  kind: IncomeKind;
  description: string | null;
  amount: number;
  receivedOn: string;
  receivedBy: string | null; // owner's name
}

/** Running costs of the business that belong to no one car. */
export type OverheadCategory = "rent" | "fuel" | "tools" | "adverts" | "wages" | "other";

export const OVERHEAD_LABEL: Record<OverheadCategory, string> = {
  rent: "Rent",
  fuel: "Fuel",
  tools: "Tools",
  adverts: "Adverts",
  wages: "Wages",
  other: "Other",
};
export const OVERHEAD_OPTIONS = (Object.keys(OVERHEAD_LABEL) as OverheadCategory[]).map(value => ({ value, label: OVERHEAD_LABEL[value] }));

/** One page of the parts list, plus the counts shown above it. */
export interface PartsPage {
  parts: Part[];
  total: number;
  counts: { all: number; inStock: number; onHold: number };
}

/** Live counts shown in the sidebar. */
export interface WorkspaceCounts {
  inStock: number;
  onHold: number;
  unassigned: number;
  projects: number;
}

/** A project in Recently deleted. partCount counts the parts binned along with it. */
export interface BinnedProject {
  id: string;
  make: string;
  model: string;
  year: number | null;
  photo: string | null; // preview URL
  deletedAt: string;
  deletedBy: string | null;
  partCount: number;
  documentCount: number;
}

/** A part binned on its own. carInBin means its project has to be restored first. */
export interface BinnedPart {
  id: string;
  name: string;
  price: number;
  quantity: number;
  photo: string | null; // preview URL
  photoCount: number;
  deletedAt: string;
  deletedBy: string | null;
  car: { make: string; model: string; year: number | null } | null;
  carInBin: boolean;
}

export const BIN_DAYS = 30; // how long deleted parts and projects can be restored

export const MAX_PART_PHOTOS = 4;
export const MAX_CAR_DOCUMENTS = 5;
export const MAX_DOCUMENT_MB = 10;

// Parts that are still on the shelf. Sold and returned parts stay in the
// database for sales history but drop out of lists.
export const ACTIVE_STATUSES: PartStatus[] = ["in_stock", "reserved"];

export const CONDITION_LABEL: Record<Condition, string> = {
  good: "Good",
  fair: "Fair",
  spares_only: "Spares",
};

export const CONDITION_OPTIONS = (Object.keys(CONDITION_LABEL) as Condition[]).map(value => ({ value, label: CONDITION_LABEL[value] }));

export const STATUS_LABEL: Record<PartStatus, string> = {
  draft: "Needs details",
  in_stock: "In stock",
  reserved: "On hold",
  sold: "Sold",
  returned: "Returned",
};
