# Kantin Review API — Tugas 2 (REST API: CRUD & Database Integration)

REST API untuk sistem review kantin, dibangun dengan **Express.js** + **SQL Server**, menggunakan
arsitektur berlapis (*layered architecture*): `routes → controllers → config/db (data access)`.

## 1. Struktur Folder

```
kantin-review-api/
├── config/
│   └── db.js               # koneksi pool ke SQL Server
├── controllers/             # logic tiap tabel (7 file)
├── routes/                  # definisi endpoint tiap tabel (7 file)
├── middleware/
│   └── errorHandler.js      # error handler & 404 terpusat
├── utils/
│   └── asyncHandler.js      # pembungkus async controller
├── db/
│   ├── schema.sql           # DDL 7 tabel (dari dosen)
│   ├── 01-create-login.sql  # CREATE LOGIN untuk backend
│   └── 02-seed.sql          # seed data ≥5 baris/tabel
├── .env.example
├── server.js
└── package.json
```

## 2. Setup Project & Repository GitHub

```bash
mkdir kantin-review-api && cd kantin-review-api
git init
npm init -y
npm install express mssql dotenv bcryptjs
npm install -D nodemon
```
Push ke GitHub, pastikan visibility **public**, dan buat `.gitignore` agar `node_modules/` dan `.env`
tidak ikut ter-commit (sudah disediakan di file `.gitignore`).

## 3. Buat Database + 7 Tabel + Seed Data

Di SSMS / Azure Data Studio / `sqlcmd`, jalankan berurutan:

```sql
CREATE DATABASE review_kantin;
GO
```

Lalu jalankan:
1. `db/schema.sql` → membuat 7 tabel (USERS, STALLS, MENU_ITEMS, REVIEWS, LIKES, FLAGS, AUDIT_LOGS)
2. `db/02-seed.sql` → mengisi seed data minimal 5 baris/tabel

## 4. Buat Database Login (CREATE LOGIN)

Jalankan `db/01-create-login.sql` sebagai administrator (sysadmin). Script ini:
- Membuat SQL Login `backend_login` dengan password `Password123!` (ganti sesuai kebutuhanmu)
- Membuat database user dari login tersebut di `review_kantin`
- Memberi role `db_datareader` + `db_datawriter` (bukan `db_owner`) — prinsip *least privilege*,
  backend hanya perlu baca/tulis data, bukan mengubah struktur tabel.

> Jika SQL Server kamu masih dalam mode **Windows Authentication only**, aktifkan dulu
> **Mixed Mode Authentication** lewat SSMS (Server Properties → Security), lalu restart service SQL Server.

## 5. Setup Koneksi Backend (.env)

```bash
cp .env.example .env
```
Isi `.env` dengan kredensial `backend_login` yang baru dibuat:
```
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=review_kantin
DB_USER=backend_login
DB_PASSWORD=Password123!
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
PORT=3000
```

## 6. Jalankan Server

```bash
npm run dev
# atau
npm start
```
Jika berhasil akan muncul:
```
✅ Terhubung ke SQL Server: review_kantin
🚀 Server berjalan di http://localhost:3000
```

## 7. Daftar Endpoint

| Tabel | Method & Endpoint | Keterangan |
|---|---|---|
| USERS | `GET /api/users` | List semua user |
| USERS | `POST /api/users` | Body: `{name, email, password, role}` (password di-hash bcrypt) |
| STALLS | `GET /api/stalls` | List + filtering & pagination |
| STALLS | `GET /api/stalls?category=Nasi&location=Blok%20A&search=warung&page=1&limit=5` | Contoh filter + pagination |
| STALLS | `GET /api/stalls/:id` | Detail satu stall |
| STALLS | `POST /api/stalls` | Body: `{owner_id, name, category, location, description}` |
| STALLS | `PUT /api/stalls/:id` | Update stall |
| STALLS | `DELETE /api/stalls/:id` | Hapus stall |
| MENU_ITEMS | `GET /api/menu-items` | List + JOIN nama stall (`stall_name`) |
| MENU_ITEMS | `GET /api/menu-items?stall_id=1` | Filter per stall |
| MENU_ITEMS | `POST/PUT/DELETE` | CRUD lengkap |
| REVIEWS | `GET /api/reviews?stall_id=1` | List + JOIN nama user (`user_name`) |
| REVIEWS | `POST /api/reviews` | Body: `{stall_id, user_id, rating, comment}` (auto update `avg_rating`) |
| REVIEWS | `DELETE /api/reviews/:id` | Hapus review (auto update `avg_rating`) |
| LIKES | `POST /api/likes` | Body: `{review_id, user_id}` (auto update `like_count`) |
| LIKES | `DELETE /api/likes/:id` | Unlike |
| FLAGS | `GET /api/flags?status=pending` | List flag, filter status opsional |
| FLAGS | `PUT /api/flags/:id` | Body: `{status: "resolved"}` |
| AUDIT_LOGS | `GET /api/audit-logs` | List semua log |
| AUDIT_LOGS | `POST /api/audit-logs` | Body: `{user_id, action, target_table, target_id, metadata}` |

Semua response mengikuti format standar:
```json
{ "success": true, "data": ... }
```
atau saat error:
```json
{ "success": false, "message": "..." }
```
dengan HTTP status code yang sesuai (200, 201, 400, 404, 409, 500).

## 8. Testing dengan Postman / Thunder Client / curl

Contoh testing filtering & pagination (screenshot ini untuk laporan):
```
GET http://localhost:3000/api/stalls?category=Nasi&page=1&limit=2
```

Contoh testing JOIN:
```
GET http://localhost:3000/api/menu-items?stall_id=1
GET http://localhost:3000/api/reviews?stall_id=1
```

Contoh testing tiap tabel (curl):
```bash
curl http://localhost:3000/api/users
curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@mail.com","password":"secret123","role":"customer"}'

curl "http://localhost:3000/api/stalls?page=1&limit=5"
curl -X POST http://localhost:3000/api/stalls -H "Content-Type: application/json" \
  -d '{"owner_id":2,"name":"Kedai Baru","category":"Nasi","location":"Blok D"}'
curl -X PUT http://localhost:3000/api/stalls/1 -H "Content-Type: application/json" \
  -d '{"name":"Nama Diupdate"}'
curl -X DELETE http://localhost:3000/api/stalls/6

curl http://localhost:3000/api/menu-items?stall_id=1
curl -X POST http://localhost:3000/api/reviews -H "Content-Type: application/json" \
  -d '{"stall_id":1,"user_id":4,"rating":5,"comment":"Mantap"}'
curl -X DELETE http://localhost:3000/api/reviews/1

curl -X POST http://localhost:3000/api/likes -H "Content-Type: application/json" \
  -d '{"review_id":2,"user_id":6}'

curl "http://localhost:3000/api/flags?status=pending"
curl -X PUT http://localhost:3000/api/flags/1 -H "Content-Type: application/json" \
  -d '{"status":"resolved"}'

curl http://localhost:3000/api/audit-logs
```

## 9. Catatan untuk Bagian Refleksi Laporan

Poin-poin ini bisa jadi bahan tulisan **Pemahaman** di laporan (tulis ulang dengan kata-katamu sendiri):

- **CRUD**: singkatan Create, Read, Update, Delete — empat operasi dasar terhadap data, dipetakan ke
  method HTTP: POST=Create, GET=Read, PUT/PATCH=Update, DELETE=Delete.
- **Layered backend architecture**: memisahkan tanggung jawab kode ke beberapa lapisan —
  *routes* (menerima request & menentukan endpoint), *controller* (logic bisnis & validasi),
  dan *data access* (query ke database). Tujuannya: kode lebih mudah di-maintain, ditest, dan
  di-reuse dibanding menaruh semua logic dalam satu file.
- **Parametrized query**: query SQL yang nilainya dikirim terpisah dari teks SQL (lewat placeholder
  seperti `@nama`), bukan digabung langsung ke string. Di project ini pakai `request.input()` dari
  package `mssql`. Ini mencegah **SQL Injection**, karena input user selalu diperlakukan sebagai data,
  bukan bagian dari perintah SQL.
- **ORM (Object-Relational Mapping)**: layer abstraksi yang memetakan tabel database ke object/class
  di kode (misal Sequelize, Prisma, TypeORM). Project ini sengaja memakai driver `mssql` langsung
  (bukan ORM) supaya query & parameter binding terlihat eksplisit — tapi prinsip *parametrized query*-nya
  sama persis dengan yang dilakukan ORM di balik layar. Kalau praktikum kalian memakai ORM (mis. Sequelize),
  jelaskan bagaimana `Model.create()`/`Model.findAll({where:...})` otomatis melakukan parameter binding.
- **Filtering**: membatasi hasil data berdasarkan kriteria tertentu lewat query string, contoh
  `?category=Nasi` → diterjemahkan jadi klausa `WHERE category = @category`.
- **Pagination**: memecah hasil data besar jadi halaman-halaman kecil memakai `OFFSET ... FETCH NEXT ...`,
  dikontrol lewat `?page=&limit=`, supaya response tidak berat dan client bisa load bertahap.
- **Integrasi backend-database**: backend terhubung ke SQL Server lewat *connection pool* (`mssql`),
  dikonfigurasi lewat `.env` agar kredensial tidak ikut ter-commit ke Git, dan memakai SQL Login
  terpisah (bukan `sa`) sesuai prinsip *least privilege*.
