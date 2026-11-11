# Café Reservas

1. `npm install`
2. Copiá `.env.example` a `.env.local` y completá `DATABASE_URL` y `AUTH_SECRET`.
3. En Supabase (SQL Editor) ejecutá `migracion_supabase.sql`.
4. `npm run dev` y abrí http://localhost:3000
5. En Vercel cargá las mismas dos variables en Settings > Environment Variables.

Endpoints: POST /api/auth/registro, /api/auth/login, /api/auth/logout,
GET /api/mesas?inicio=...&horas=2, GET/POST /api/reservas, PATCH /api/reservas/:id,
GET /api/admin/stats?dias=30 (solo admin).
