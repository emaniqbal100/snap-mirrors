# Snap's Mirror — Backend API Reference (for Frontend Integration)

Base URL: `http://localhost:5000/api`
(In production, replace with your live backend URL)

## Response Format (all endpoints)
Every response follows this shape:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { ... },
  "timestamp": "2026-08-08T12:00:00.000Z"
}
```
On error:
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid email or password",
  "error": "UNAUTHORIZED",
  "timestamp": "2026-08-08T12:00:00.000Z"
}
```

---

## ✅ READY NOW — Auth (Admin only)

### POST /api/auth/login
Login as admin.
**Body:**
```json
{ "email": "admin@snapsmirror.com", "password": "yourpassword" }
```
**Response `data`:**
```json
{
  "user": { "id": 1, "name": "Super Admin", "email": "admin@snapsmirror.com", "role": "admin" },
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi..."
}
```

### POST /api/auth/refresh
Get a new access token using a refresh token.
**Body:**
```json
{ "refreshToken": "eyJhbGciOi..." }
```
**Response `data`:**
```json
{ "accessToken": "eyJhbGciOi...", "refreshToken": "eyJhbGciOi..." }
```

### POST /api/auth/logout
Invalidate a refresh token.
**Body:**
```json
{ "refreshToken": "eyJhbGciOi..." }
```

### GET /api/auth/me
Get currently logged-in admin's profile. Requires header:
```
Authorization: Bearer <accessToken>
```
**Response `data`:**
```json
{ "id": 1, "name": "Super Admin", "email": "admin@snapsmirror.com", "role": "admin" }
```

---

## 🚧 COMING NEXT (not built yet — endpoints will match this shape)

### Manage Admins (admin-only, requires Bearer token)
- `GET /api/admin/users` — list all admin accounts
- `POST /api/admin/users` — create a new admin `{ name, email, password }`
- `PATCH /api/admin/users/:id` — enable/disable an admin `{ is_active: boolean }`

### Categories
- `GET /api/categories` — public, list all categories (for frontend)
- `POST /api/admin/categories` — admin only, create category
- `PATCH /api/admin/categories/:id` — admin only, update
- `DELETE /api/admin/categories/:id` — admin only, delete

### Products
- `GET /api/products` — public, list products (with variants) for frontend, supports query params for filtering/pagination
- `GET /api/products/:slug` — public, single product detail
- `POST /api/admin/products` — admin only, create product + variants
- `PATCH /api/admin/products/:id` — admin only, update
- `DELETE /api/admin/products/:id` — admin only, delete

### Orders
- `POST /api/orders` — public, customer places an order (guest checkout — no login required): includes customer name, phone, address, and cart items
- `GET /api/admin/orders` — admin only, list all orders with filters
- `GET /api/admin/orders/:id` — admin only, order detail
- `PATCH /api/admin/orders/:id/status` — admin only, update order status

### Payments
- `GET /api/admin/payments` — admin only, list payments
- `PATCH /api/admin/payments/:id` — admin only, mark COD as paid / update status

### Reviews
- `GET /api/products/:id/reviews` — public, list reviews for a product
- `POST /api/products/:id/reviews` — public, customer submits a review (name + rating + comment, no login)
- `DELETE /api/admin/reviews/:id` — admin only, remove a review

---

## Frontend Integration Notes
1. **No customer login/signup exists or is needed** — checkout is guest-based, just collect name/phone/address at order time.
2. Public `GET` endpoints (products, categories, reviews) need **no Authorization header**.
3. Any `/api/admin/*` endpoint requires `Authorization: Bearer <accessToken>` from an admin login — these are for the **admin panel only**, not the customer frontend.
4. This document will be updated as each endpoint above is built — check back before integrating a "Coming Next" endpoint.
