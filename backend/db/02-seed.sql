-- db/02-seed.sql
-- Seed data minimal 5 baris per tabel. Jalankan setelah schema.sql.
-- Urutan insert mengikuti dependency foreign key.

USE review_kantin;
GO

-- ---------------------------------------------------------------- USERS
-- password_hash di bawah ini adalah CONTOH bcrypt hash (bukan hash asli dari password tertentu).
-- Untuk membuat user sungguhan, gunakan endpoint POST /api/users (password akan di-hash otomatis).
INSERT INTO dbo.USERS (name, email, password_hash, role) VALUES
('Admin Utama',   'admin@kantin.test',   '$2a$10$abcdefghijklmnopqrstuv0000000000000000000000000000001', 'admin'),
('Budi Santoso',  'budi@kantin.test',    '$2a$10$abcdefghijklmnopqrstuv0000000000000000000000000000002', 'owner'),
('Siti Aminah',   'siti@kantin.test',    '$2a$10$abcdefghijklmnopqrstuv0000000000000000000000000000003', 'owner'),
('Rafa Khrisna',  'rafa@kantin.test',    '$2a$10$abcdefghijklmnopqrstuv0000000000000000000000000000004', 'customer'),
('Dewi Lestari',  'dewi@kantin.test',    '$2a$10$abcdefghijklmnopqrstuv0000000000000000000000000000005', 'customer'),
('Agus Wijaya',   'agus@kantin.test',    '$2a$10$abcdefghijklmnopqrstuv0000000000000000000000000000006', 'customer');
GO

-- --------------------------------------------------------------- STALLS
INSERT INTO dbo.STALLS (owner_id, name, category, location, description) VALUES
(2, 'Warung Nasi Padang Sederhana', 'Nasi',    'Blok A No.1', 'Nasi padang otentik dengan berbagai lauk'),
(2, 'Mie Ayam Pak Budi',            'Mie',     'Blok A No.2', 'Mie ayam legendaris kampus'),
(3, 'Juice Corner',                 'Minuman', 'Blok B No.1', 'Aneka jus buah segar'),
(3, 'Bakso Malang Siti',            'Bakso',   'Blok B No.2', 'Bakso halus dengan kuah gurih'),
(2, 'Nasi Goreng 24 Jam',           'Nasi',    'Blok C No.1', 'Nasi goreng spesial buka 24 jam');
GO

-- ----------------------------------------------------------- MENU_ITEMS
INSERT INTO dbo.MENU_ITEMS (stall_id, name, price, is_available) VALUES
(1, 'Nasi Rendang',        20000, 1),
(1, 'Nasi Ayam Pop',       18000, 1),
(2, 'Mie Ayam Original',   15000, 1),
(2, 'Mie Ayam Bakso',      18000, 1),
(3, 'Jus Alpukat',         12000, 1),
(4, 'Bakso Jumbo',         17000, 0),
(5, 'Nasi Goreng Spesial', 16000, 1);
GO

-- -------------------------------------------------------------- REVIEWS
INSERT INTO dbo.REVIEWS (stall_id, user_id, rating, comment) VALUES
(1, 4, 5, 'Enak banget, porsi besar!'),
(1, 5, 4, 'Rasanya otentik, pelayanan cepat'),
(2, 4, 4, 'Mie ayamnya juara, tapi agak lama antre'),
(3, 6, 5, 'Jus segar, harga terjangkau'),
(4, 5, 3, 'Kuahnya kurang panas saat sampai'),
(5, 6, 5, 'Cocok buat begadang, buka 24 jam');
GO

-- Sinkronkan avg_rating & review_count di STALLS (dilakukan otomatis oleh API saat runtime,
-- tapi untuk seed data awal kita hitung manual sekali di sini)
UPDATE s
SET review_count = agg.cnt,
    avg_rating = agg.avgr
FROM dbo.STALLS s
JOIN (
    SELECT stall_id, COUNT(*) AS cnt, AVG(CAST(rating AS DECIMAL(3,2))) AS avgr
    FROM dbo.REVIEWS
    GROUP BY stall_id
) agg ON agg.stall_id = s.id;
GO

-- ---------------------------------------------------------------- LIKES
INSERT INTO dbo.LIKES (review_id, user_id) VALUES
(1, 5),
(1, 6),
(2, 4),
(3, 6),
(4, 4);
GO

UPDATE r
SET like_count = agg.cnt
FROM dbo.REVIEWS r
JOIN (
    SELECT review_id, COUNT(*) AS cnt FROM dbo.LIKES GROUP BY review_id
) agg ON agg.review_id = r.id;
GO

-- ---------------------------------------------------------------- FLAGS
INSERT INTO dbo.FLAGS (review_id, reported_by, reason, status) VALUES
(3, 5, 'Komentar dianggap tidak relevan', 'pending'),
(4, 4, 'Spam berulang',                    'pending'),
(5, 6, 'Bahasa kasar',                     'resolved'),
(1, 5, 'Review palsu',                     'dismissed'),
(2, 6, 'Konten menyinggung',               'pending');
GO

-- ----------------------------------------------------------- AUDIT_LOGS
INSERT INTO dbo.AUDIT_LOGS (user_id, action, target_table, target_id, metadata) VALUES
(1, 'CREATE', 'STALLS',  1, '{"note":"stall awal ditambahkan"}'),
(1, 'CREATE', 'REVIEWS', 1, '{"note":"review awal ditambahkan"}'),
(1, 'UPDATE', 'FLAGS',   3, '{"old_status":"pending","new_status":"resolved"}'),
(2, 'DELETE', 'MENU_ITEMS', 99, '{"note":"item dihapus karena stok habis"}'),
(1, 'UPDATE', 'FLAGS',   4, '{"old_status":"pending","new_status":"dismissed"}');
GO

PRINT 'Seed data selesai dimasukkan.';
GO
