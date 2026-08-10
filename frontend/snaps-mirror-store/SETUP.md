# Snap's Mirror Store — Setup

## 1. Install dependencies
```bash
npm install
```

## 2. Point to your backend
Create `.env.local` in the project root:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```
(Use your real deployed backend URL in production.)

## 3. Run locally
```bash
npm run dev
```
Open http://localhost:3000

## Notes on the API
- Auth endpoints (`/api/auth/*`) are for the **admin panel only** and are not used by this
  storefront — this is a guest-only customer frontend, exactly as documented in your
  `api-reference.md`.
- `GET /api/products`, `GET /api/products/:slug`, `GET /api/categories`, `GET/POST
  /api/products/:id/reviews`, and `POST /api/orders` are wired up in `src/lib/api.ts`.
  Since these aren't built on the backend yet, every function **automatically falls back
  to mock data** in `src/lib/mock-data.ts` if the API call fails or the endpoint doesn't
  exist yet — so the site works standalone right now.
- Once you build each real endpoint, nothing changes on the frontend — it will start
  using live data automatically the moment the backend responds successfully.

## Fonts
Google Fonts (Fraunces/Manrope) couldn't be fetched in the sandbox that built this, so
the CSS currently uses a system serif/sans stack (`src/app/globals.css`, `--font-display`
/ `--font-body`). If you have internet access when you run this, you can swap in
`next/font/google` for an exact editorial serif look — see the commented-out approach in
git history or just re-add:
```tsx
import { Fraunces, Manrope } from "next/font/google";
```
in `src/app/layout.tsx`.

## Pages
- `/` — home (hero, material story, featured mirrors)
- `/collection` — full product grid
- `/products/[slug]` — product detail, add to bag, reviews
- `/checkout` — guest checkout form → `POST /api/orders`
- `/journal` — placeholder page (reference site had a blog/journal section)

## Structure
```
src/
  app/                 routes (App Router)
  components/          Header, Footer, ProductCard, CartDrawer, AddToCart
  context/CartContext  cart state (persisted to localStorage)
  lib/api.ts           backend integration + mock-data fallback
  lib/mock-data.ts     8 sample products mirroring the reference catalogue
  lib/types.ts         types matching api-reference.md response shapes
public/images/         placeholder mirror images (replace with real product photos)
```
