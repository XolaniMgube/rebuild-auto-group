import type { Part, Sale, User, Vehicle } from "./types";

// Demo data, tuned so the money screen actually demonstrates the point:
// two cars comfortably ahead, one still under water, and some stock
// that has been sitting long enough to flag. Replaced by real queries
// once Supabase is wired.

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 86_400_000).toISOString();

export const SEED_USERS: User[] = [
  { id: "u_mitchel", email: "mitch@rebuildautogroup.co.za", name: "Mitchel", role: "OWNER" },
  { id: "u_partner", email: "partner@rebuildautogroup.co.za", name: "Sipho", role: "OWNER" },
];

export const SEED_VEHICLES: Vehicle[] = [
  {
    id: "v_polovivo",
    make: "VW", model: "Polo Vivo", year: 2012,
    vin: "WVWZZZ6RZCY123456", registration: "JT 45 KG GP", color: "White",
    purchasePrice: 8500, purchaseDate: daysAgo(24),
    notes: "Front-end damage, drivetrain clean.",
    addedById: "u_mitchel", createdAt: daysAgo(24),
  },
  {
    id: "v_corolla",
    make: "Toyota", model: "Corolla", year: 2008,
    vin: null, registration: null, color: "Silver",
    purchasePrice: 6000, purchaseDate: daysAgo(65),
    notes: "Rolled. Interior salvageable.",
    addedById: "u_mitchel", createdAt: daysAgo(65),
  },
  {
    id: "v_polotsi",
    make: "VW", model: "Polo TSI", year: 2015,
    vin: "WVWZZZ6RZFY987654", registration: null, color: "Blue",
    purchasePrice: 11000, purchaseDate: daysAgo(77),
    notes: "Engine rebuild project. Check the turbo and cooling system.",
    addedById: "u_partner", createdAt: daysAgo(77),
  },
  {
    id: "v_np200",
    make: "Nissan", model: "NP200", year: 2006,
    vin: null, registration: null, color: "White",
    purchasePrice: 5000, purchaseDate: daysAgo(240),
    notes: "Stripped out. Only body panels left.",
    addedById: "u_mitchel", createdAt: daysAgo(240),
  },
];

type SeedPart = Omit<Part, "createdAt" | "updatedAt" | "images"> & { ageDays: number };
const p = (x: SeedPart): Part => ({
  ...x,
  images: [],
  createdAt: daysAgo(x.ageDays),
  updatedAt: daysAgo(x.ageDays),
});

export const SEED_PARTS: Part[] = [
  // ---------- 2012 Polo Vivo — paid 8 500, well ahead ----------
  p({ id: "p_01", name: "Headlight, left", brand: "Hella", serialNumber: "6R1 941 007", condition: "GOOD", description: "Clean lens, no cracks.", costPrice: null, sellingPrice: 450, quantity: 1, location: "Rack B3", status: "IN_STOCK", vehicleId: "v_polovivo", addedById: "u_mitchel", ageDays: 23 }),
  p({ id: "p_02", name: "Headlight, right", brand: "Hella", serialNumber: null, condition: "FAIR", description: "Light hazing on the lens.", costPrice: null, sellingPrice: 400, quantity: 1, location: "Rack B3", status: "IN_STOCK", vehicleId: "v_polovivo", addedById: "u_mitchel", ageDays: 23 }),
  p({ id: "p_03", name: "Wing mirror, left", brand: null, serialNumber: null, condition: "GOOD", description: "Electric, glass intact.", costPrice: null, sellingPrice: 300, quantity: 1, location: "Rack B1", status: "SOLD", vehicleId: "v_polovivo", addedById: "u_mitchel", ageDays: 23 }),
  p({ id: "p_04", name: "Alternator", brand: "Bosch", serialNumber: "0124325057", condition: "GOOD", description: "Tested, charging.", costPrice: null, sellingPrice: 1200, quantity: 1, location: "Shelf A2", status: "IN_STOCK", vehicleId: "v_polovivo", addedById: "u_mitchel", ageDays: 22 }),
  p({ id: "p_05", name: "Starter motor", brand: "Bosch", serialNumber: null, condition: "GOOD", description: null, costPrice: null, sellingPrice: 850, quantity: 1, location: "Shelf A2", status: "IN_STOCK", vehicleId: "v_polovivo", addedById: "u_mitchel", ageDays: 22 }),
  p({ id: "p_06", name: "Bumper, front", brand: null, serialNumber: null, condition: "SPARES_ONLY", description: "Cracked on the left mount.", costPrice: null, sellingPrice: 600, quantity: 1, location: "Container 1", status: "IN_STOCK", vehicleId: "v_polovivo", addedById: "u_mitchel", ageDays: 22 }),
  p({ id: "p_07", name: "Door, front left", brand: null, serialNumber: null, condition: "GOOD", description: "Straight, minor scuff.", costPrice: null, sellingPrice: 1800, quantity: 1, location: "Container 1", status: "RESERVED", vehicleId: "v_polovivo", addedById: "u_mitchel", ageDays: 21 }),
  p({ id: "p_08", name: "Radiator", brand: "Behr", serialNumber: null, condition: "GOOD", description: null, costPrice: null, sellingPrice: 950, quantity: 1, location: "Shelf A4", status: "SOLD", vehicleId: "v_polovivo", addedById: "u_mitchel", ageDays: 21 }),
  p({ id: "p_09", name: "Gearbox, 5-speed", brand: null, serialNumber: null, condition: "GOOD", description: "Manual. Turns freely.", costPrice: null, sellingPrice: 6500, quantity: 1, location: "Floor 3", status: "SOLD", vehicleId: "v_polovivo", addedById: "u_mitchel", ageDays: 20 }),
  p({ id: "p_10", name: "Tail light, left", brand: null, serialNumber: null, condition: "GOOD", description: null, costPrice: null, sellingPrice: 320, quantity: 1, location: "Rack B3", status: "IN_STOCK", vehicleId: "v_polovivo", addedById: "u_mitchel", ageDays: 20 }),
  p({ id: "p_23", name: "Engine, 1.4 petrol", brand: null, serialNumber: null, condition: "GOOD", description: "Runs. Compression tested.", costPrice: null, sellingPrice: 8000, quantity: 1, location: "Floor 1", status: "SOLD", vehicleId: "v_polovivo", addedById: "u_mitchel", ageDays: 22 }),
  p({ id: "p_24", name: "Wheels, 14 inch steel", brand: null, serialNumber: null, condition: "GOOD", description: "Set of four.", costPrice: null, sellingPrice: 1600, quantity: 1, location: "Yard back", status: "SOLD", vehicleId: "v_polovivo", addedById: "u_mitchel", ageDays: 21 }),
  p({ id: "p_25", name: "Bonnet", brand: null, serialNumber: null, condition: "FAIR", description: null, costPrice: null, sellingPrice: 900, quantity: 1, location: "Yard back", status: "SOLD", vehicleId: "v_polovivo", addedById: "u_partner", ageDays: 21 }),

  // ---------- 2008 Corolla — paid 6 000, ahead ----------
  p({ id: "p_11", name: "Headlight, left", brand: "Depo", serialNumber: null, condition: "FAIR", description: "Yellowed but works.", costPrice: null, sellingPrice: 380, quantity: 1, location: "Rack B2", status: "IN_STOCK", vehicleId: "v_corolla", addedById: "u_mitchel", ageDays: 63 }),
  p({ id: "p_12", name: "Alternator", brand: "Denso", serialNumber: null, condition: "GOOD", description: null, costPrice: null, sellingPrice: 1100, quantity: 1, location: "Shelf A2", status: "SOLD", vehicleId: "v_corolla", addedById: "u_partner", ageDays: 63 }),
  p({ id: "p_13", name: "Seat, driver", brand: null, serialNumber: null, condition: "GOOD", description: "Cloth, no tears.", costPrice: null, sellingPrice: 900, quantity: 1, location: "Container 2", status: "IN_STOCK", vehicleId: "v_corolla", addedById: "u_partner", ageDays: 62 }),
  p({ id: "p_14", name: "Bonnet", brand: null, serialNumber: null, condition: "SPARES_ONLY", description: "Dented, straightenable.", costPrice: null, sellingPrice: 700, quantity: 1, location: "Yard back", status: "IN_STOCK", vehicleId: "v_corolla", addedById: "u_partner", ageDays: 62 }),
  p({ id: "p_15", name: "Steering rack", brand: null, serialNumber: null, condition: "GOOD", description: null, costPrice: null, sellingPrice: 2200, quantity: 1, location: "Shelf A5", status: "SOLD", vehicleId: "v_corolla", addedById: "u_mitchel", ageDays: 60 }),
  p({ id: "p_16", name: "Wheel, 15 inch alloy", brand: null, serialNumber: null, condition: "GOOD", description: "Four available.", costPrice: null, sellingPrice: 550, quantity: 4, location: "Yard back", status: "IN_STOCK", vehicleId: "v_corolla", addedById: "u_mitchel", ageDays: 60 }),
  p({ id: "p_26", name: "Engine, 1.6", brand: null, serialNumber: null, condition: "GOOD", description: "Turns over.", costPrice: null, sellingPrice: 5500, quantity: 1, location: "Floor 2", status: "SOLD", vehicleId: "v_corolla", addedById: "u_mitchel", ageDays: 62 }),
  p({ id: "p_27", name: "Doors, rear pair", brand: null, serialNumber: null, condition: "FAIR", description: null, costPrice: null, sellingPrice: 1400, quantity: 1, location: "Container 3", status: "SOLD", vehicleId: "v_corolla", addedById: "u_partner", ageDays: 61 }),

  // ---------- 2015 Polo TSI — paid 11 000, still behind ----------
  p({ id: "p_17", name: "Headlight, left", brand: "Hella", serialNumber: null, condition: "GOOD", description: "Xenon.", costPrice: null, sellingPrice: 520, quantity: 1, location: "Container 2", status: "RESERVED", vehicleId: "v_polotsi", addedById: "u_partner", ageDays: 75 }),
  p({ id: "p_18", name: "Turbocharger", brand: "Garrett", serialNumber: null, condition: "SPARES_ONLY", description: "Shaft play. Rebuildable.", costPrice: null, sellingPrice: 2800, quantity: 1, location: "Shelf A1", status: "IN_STOCK", vehicleId: "v_polotsi", addedById: "u_partner", ageDays: 75 }),
  p({ id: "p_19", name: "Dashboard", brand: null, serialNumber: null, condition: "GOOD", description: "Complete with vents.", costPrice: null, sellingPrice: 1600, quantity: 1, location: "Container 2", status: "IN_STOCK", vehicleId: "v_polotsi", addedById: "u_partner", ageDays: 74 }),
  p({ id: "p_20", name: "Door, rear right", brand: null, serialNumber: null, condition: "GOOD", description: null, costPrice: null, sellingPrice: 1500, quantity: 1, location: "Container 3", status: "IN_STOCK", vehicleId: "v_polotsi", addedById: "u_partner", ageDays: 74 }),
  p({ id: "p_21", name: "Fuel pump", brand: null, serialNumber: null, condition: "GOOD", description: null, costPrice: null, sellingPrice: 1400, quantity: 1, location: "Shelf A3", status: "SOLD", vehicleId: "v_polotsi", addedById: "u_mitchel", ageDays: 70 }),
  p({ id: "p_22", name: "Boot lid", brand: null, serialNumber: null, condition: "FAIR", description: "Scratched.", costPrice: null, sellingPrice: 1200, quantity: 1, location: "Yard back", status: "IN_STOCK", vehicleId: "v_polotsi", addedById: "u_partner", ageDays: 74 }),
  p({ id: "p_28", name: "Gearbox, DSG", brand: null, serialNumber: null, condition: "GOOD", description: null, costPrice: null, sellingPrice: 6500, quantity: 1, location: "Floor 3", status: "SOLD", vehicleId: "v_polotsi", addedById: "u_partner", ageDays: 72 }),
  p({ id: "p_29", name: "Wheels, 16 inch alloy", brand: null, serialNumber: null, condition: "GOOD", description: null, costPrice: null, sellingPrice: 1300, quantity: 1, location: "Yard back", status: "SOLD", vehicleId: "v_polotsi", addedById: "u_partner", ageDays: 72 }),

  // ---------- 2006 NP200 — old car, stock that has been sitting ----------
  p({ id: "p_30", name: "Tail light, right", brand: null, serialNumber: null, condition: "FAIR", description: null, costPrice: null, sellingPrice: 280, quantity: 1, location: "Rack B4", status: "IN_STOCK", vehicleId: "v_np200", addedById: "u_mitchel", ageDays: 236 }),
  p({ id: "p_31", name: "Bumper, rear", brand: null, serialNumber: null, condition: "SPARES_ONLY", description: "Faded, mounts good.", costPrice: null, sellingPrice: 550, quantity: 1, location: "Yard back", status: "IN_STOCK", vehicleId: "v_np200", addedById: "u_mitchel", ageDays: 236 }),
  p({ id: "p_32", name: "Seat, bench", brand: null, serialNumber: null, condition: "FAIR", description: "Sun-worn.", costPrice: null, sellingPrice: 650, quantity: 1, location: "Container 4", status: "IN_STOCK", vehicleId: "v_np200", addedById: "u_mitchel", ageDays: 235 }),
  p({ id: "p_33", name: "Alternator", brand: null, serialNumber: null, condition: "GOOD", description: null, costPrice: null, sellingPrice: 900, quantity: 1, location: "Shelf A2", status: "SOLD", vehicleId: "v_np200", addedById: "u_mitchel", ageDays: 236 }),
  p({ id: "p_34", name: "Radiator", brand: null, serialNumber: null, condition: "GOOD", description: null, costPrice: null, sellingPrice: 700, quantity: 1, location: "Shelf A4", status: "SOLD", vehicleId: "v_np200", addedById: "u_partner", ageDays: 235 }),
  p({ id: "p_35", name: "Engine, 1.6 petrol", brand: null, serialNumber: null, condition: "GOOD", description: null, costPrice: null, sellingPrice: 4500, quantity: 1, location: "Floor 1", status: "SOLD", vehicleId: "v_np200", addedById: "u_mitchel", ageDays: 234 }),
  p({ id: "p_36", name: "Gearbox, 5-speed", brand: null, serialNumber: null, condition: "GOOD", description: null, costPrice: null, sellingPrice: 2200, quantity: 1, location: "Floor 3", status: "SOLD", vehicleId: "v_np200", addedById: "u_mitchel", ageDays: 234 }),

  // ---------- drafts: shot on the phone, details still missing ----------
  p({ id: "p_d1", name: "Wing mirror, right", brand: null, serialNumber: null, condition: "GOOD", description: null, costPrice: null, sellingPrice: 0, quantity: 1, location: null, status: "DRAFT", vehicleId: "v_polovivo", addedById: "u_mitchel", ageDays: 0 }),
  p({ id: "p_d2", name: "Coil pack", brand: null, serialNumber: null, condition: "GOOD", description: null, costPrice: null, sellingPrice: 0, quantity: 1, location: null, status: "DRAFT", vehicleId: "v_polovivo", addedById: "u_mitchel", ageDays: 0 }),
  p({ id: "p_d3", name: "Indicator, front left", brand: null, serialNumber: null, condition: "GOOD", description: null, costPrice: null, sellingPrice: 0, quantity: 1, location: null, status: "DRAFT", vehicleId: "v_polovivo", addedById: "u_mitchel", ageDays: 0 }),
];

const sale = (
  id: string, ageDays: number, customerName: string | null,
  soldById: string, lines: Array<[string, number]>
): Sale => ({
  id,
  saleDate: daysAgo(ageDays),
  customerName,
  customerPhone: null,
  total: lines.reduce((s, [, price]) => s + price, 0),
  soldById,
  notes: null,
  items: lines.map(([partId, priceAtSale], i) => ({
    id: `${id}_i${i}`, saleId: id, partId,
    quantity: 1, priceAtSale, costAtSale: null,
  })),
});

export const SEED_SALES: Sale[] = [
  // this month
  sale("s_01", 1, "Sipho — walk-in", "u_mitchel", [["p_03", 300]]),
  sale("s_02", 1, "Thabo Motors", "u_mitchel", [["p_23", 8000]]),
  sale("s_03", 2, null, "u_partner", [["p_08", 950]]),
  sale("s_04", 3, "Thabo Motors", "u_mitchel", [["p_09", 6500]]),
  sale("s_05", 4, "Kagiso", "u_mitchel", [["p_24", 1600]]),
  // last month
  sale("s_06", 9, null, "u_partner", [["p_25", 900]]),
  sale("s_07", 12, null, "u_mitchel", [["p_12", 1100]]),
  sale("s_08", 16, "Lebo Spares", "u_mitchel", [["p_26", 5500]]),
  sale("s_09", 22, "Kagiso", "u_mitchel", [["p_15", 2200]]),
  sale("s_10", 28, null, "u_partner", [["p_27", 1400]]),
  // older
  sale("s_11", 41, null, "u_mitchel", [["p_21", 1400]]),
  sale("s_12", 48, "Thabo Motors", "u_partner", [["p_28", 6500]]),
  sale("s_13", 55, null, "u_partner", [["p_29", 1300]]),
  sale("s_14", 150, null, "u_mitchel", [["p_36", 2200]]),
  sale("s_15", 160, "Lebo Spares", "u_mitchel", [["p_35", 4500]]),
  sale("s_16", 180, null, "u_partner", [["p_34", 700]]),
  sale("s_17", 200, null, "u_mitchel", [["p_33", 900]]),
];
