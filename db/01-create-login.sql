-- db/01-create-login.sql
-- Jalankan sebagai administrator/sysadmin di SQL Server Management Studio (SSMS)
-- atau sqlcmd, TERPISAH dari schema.sql. Login ini yang dipakai backend (.env) untuk konek.

USE master;
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'backend_login')
BEGIN
    CREATE LOGIN backend_login WITH PASSWORD = 'Password123!';
END
GO

USE review_kantin;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'backend_login')
BEGIN
    CREATE USER backend_login FOR LOGIN backend_login;
END
GO

-- Beri hak akses CRUD (bukan db_owner, sesuai prinsip least privilege)
ALTER ROLE db_datareader ADD MEMBER backend_login;
ALTER ROLE db_datawriter ADD MEMBER backend_login;
GO

PRINT 'Login backend_login berhasil dibuat & diberi akses ke review_kantin.';
GO
