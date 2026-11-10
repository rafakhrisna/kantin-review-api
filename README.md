# Kantin Review (Tugas 4: Frontend React + Integrasi Backend)

Aplikasi review kantin: backend Express.js + SQL Server, frontend React (TypeScript) dengan Axios.

## Teknologi
- Backend: Node.js, Express.js, SQL Server (mssql), zod, JWT, bcryptjs
- Frontend: React 19, TypeScript, Vite, React Router, Axios

## Instalasi
1. Siapkan database `kantin_review` di SQL Server (jalankan `db/schema.sql`, `db/01-create-login.sql`, seed data).
2. Backend (folder root): `npm install`, lalu `node scripts/seed-accounts.js` untuk membuat akun uji.
3. Frontend: `cd frontend` lalu `npm install`.

## Konfigurasi environment
- Root: salin `.env.example` menjadi `.env`, isi kredensial database dan `JWT_SECRET`.
- `frontend`: salin `.env.example` menjadi `.env` (isi `VITE_API_URL=http://localhost:3000`).

## Menjalankan
- Backend: `npm run dev` (http://localhost:3000, dokumentasi API di /docs)
- Frontend: `cd frontend && npm run dev` (http://localhost:5173)