# Rebuild Auto Group

A demo workspace for finding parts and organising car projects. Built with Next.js, React, Tailwind and Zustand.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 and choose **Explore the demo**. The existing demo login also works: `mitch@rebuildautogroup.co.za` / `Mitch123`.

```bash
npx tsc --noEmit
npm run build
```

The build fetches Archivo fonts using Next.js. Network access is needed on the first build.

## Suggested demo walkthrough

1. Open **Find parts**. Search for “headlight” and filter to a car. Open Filters for condition, availability and sorting.
2. Open a part to see its condition, shelf, quantity and car project. Place it on hold and release it.
3. Open **Car projects**, then the Polo Vivo. Switch to Checklist, add an item and tick it off.
4. Choose **Add a part** from that project. The car is already selected. Add a name, condition, location and optional photos, then save.
5. Open the linked project to see the new part. Edit the part to change its shelf or assign it to another project.
6. Create a new car project and start its checklist. Refresh to demonstrate persistence.

## Prototype scope

- Responsive inventory, car filters, condition and availability filters, sorting and compact part rows.
- Compact car project lists, project-specific inventory, persistent build checklists.
- Create and edit parts, project assignment, quantities, notes and holds.
- Up to four compressed photos when adding a part.
- Money, sales and “Needs details” are removed from the UI. Their old URLs redirect to inventory.

All data stays in this browser’s localStorage. No database, multi-device sync or production authentication is connected. Vehicle artwork is illustrative; inventory placeholders are not part photos. Car assignment organises parts; it does not verify mechanical compatibility.

Existing stored records are preserved. Legacy financial fields, sale records, and draft/sold statuses remain in the data layer for compatibility, but are outside the active prototype. Inventory and project lists show in-stock and held parts. New parts enter stock directly. Project tasks live alongside the existing local data; the Prisma schema is not connected and does not yet model these tasks.

The main screens live in `src/app/(app)`, shared UI in `src/components`, and browser state in `src/lib/store.ts`.
# rebuild-auto-group
