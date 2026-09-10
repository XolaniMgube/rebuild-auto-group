# Rebuild Auto Group

A workspace for finding parts and organising car projects. Built with Next.js, React, Tailwind and Supabase.

Requires Node.js 22 or newer (`.nvmrc`).

## Run locally

Needs Docker for the local Supabase stack.

```bash
npm install
npm run db:start        # prints the local API URL and publishable key
cp .env.example .env.local   # paste those two values in
npm run dev
```

Open http://localhost:3000 and sign in with a local seed account:

| Email | Password | Access |
| --- | --- | --- |
| `owner@rebuild.local` | `LocalOwner-2026` | Owner |
| `staff@rebuild.local` | `LocalStaff-2026` | Staff |
| `pending@rebuild.local` | `LocalPending-2026` | None yet |

These exist only in the local database. Local emails (invites, password resets) appear at http://localhost:54324.

```bash
npm run db:reset        # rebuild the local database from migrations + seed
npm run db:types        # regenerate src/lib/database.types.ts after schema changes
npx tsc --noEmit
npm run build
```

The build fetches Archivo fonts using Next.js. Network access is needed on the first build.

## Supabase

The schema, security policies and storage bucket are in `supabase/migrations`. Row level security is the security boundary; the browser only ever holds the publishable key.

**Access.** Public sign-up is off. Every account starts with no role and sees no data until an owner grants one.

- **Owner**: everything, including sales and deleting records.
- **Staff**: inventory, projects and recording sales. Cannot read sales or delete parts and cars.

Sales are written only through `complete_sale()`, which freezes prices and updates stock in one transaction. Part photos go in the private `part-images` bucket under `<part id>/`; car photos and documents go in `vehicle-files` under `<car id>/photo/` and `<car id>/documents/`.

### Connecting a hosted project

1. When creating a project, untick **Automatically expose new tables** and tick **Enable automatic RLS**. Then link and push the schema: `npx supabase login`, `npx supabase link --project-ref <ref>`, `npm run db:push`.
2. Put the project URL and publishable key in `.env.local` (and in Vercel's environment variables).
3. In the dashboard under **Authentication**:
   - Turn off **Allow new users to sign up**.
   - Set **Site URL** to the deployed URL and add it to **Redirect URLs**.
   - Set minimum password length to 10 with upper- and lowercase letters and digits. Turn on leaked password protection if your plan has it.
   - Paste `supabase/templates/invite.html` and `recovery.html` into the Invite and Reset Password email templates.
   - Add custom SMTP before inviting real people; the built-in sender is heavily rate limited.
4. Create the first person under **Authentication → Users**, then make them an owner in the SQL editor:

   ```sql
   update public.profiles set role = 'owner' where email = 'you@example.com';
   ```

   Owners grant access to everyone else with `select public.set_member_role('<user id>', 'staff');`.

## Static assets

Add logos to `public/logos/` and other images to `public/images/`.
Reference them from the site root: `public/logos/logo.svg` becomes `/logos/logo.svg`,
and `public/images/car.jpg` becomes `/images/car.jpg`. Omit `public` from asset URLs.

The app uses `public/logos/RAG Logo.png` for the official logo and
`public/logos/Logo icon.png` for loading screens. Browser and home-screen icons
are generated from the icon PNG when the app builds.

## Design system

- Design tokens (colours, radii, shadows, sizes, motion) are CSS variables in `src/app/globals.css`, mapped into Tailwind in `tailwind.config.ts`: `bg-canvas`, `text-secondary`, `rounded-card`, `shadow-card`, `h-control` and so on.
- Shared components are in `src/components/ui`: buttons, fields, badges, cards, search and chips, sheets with in-app confirmation, and empty, error and loading states. The tab bar, sidebar and headers are in `src/components/Shell.tsx`; icons in `src/components/Icon.tsx`.
- Brand red marks the main action on a screen. Brand navy marks selection, links and progress. Everything else stays neutral.

## How it fits together

- Pages in `src/app/(app)` are Server Components that read through `src/lib/data.ts`, then hand the data to client components for search, filters and forms.
- Every change goes through the Server Actions in `src/lib/actions.ts`, which re-validate input. Row level security still decides what each person may do.
- Photos and documents are prepared on the phone (`src/lib/files.ts`), uploaded straight to private Storage (`src/lib/uploads.ts`), then recorded by a Server Action. Each photo is stored with a small `-thumb.jpg` preview that lists use. Pages show files through signed URLs that expire after an hour.
- Parts can have up to 4 photos. Cars can have one photo and up to 5 documents (PDF or image, 10 MB each). The database enforces these limits.
- Parts lists show in-stock and on-hold parts. Sold parts stay in the database for sales history.

Car assignment organises parts; it does not verify mechanical compatibility.
