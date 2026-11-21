USE kantin_review;
GO

-- 1. created_at menyimpan waktu UTC (cocok dengan format "Z" pada JSON)
IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_AUDIT_LOGS_created_at')
    ALTER TABLE dbo.AUDIT_LOGS DROP CONSTRAINT DF_AUDIT_LOGS_created_at;
GO
ALTER TABLE dbo.AUDIT_LOGS
    ADD CONSTRAINT DF_AUDIT_LOGS_created_at DEFAULT SYSUTCDATETIME() FOR created_at;
GO

-- 2. Lapisan 1: TRIGGER append-only (berlaku untuk semua login, termasuk sysadmin)
CREATE OR ALTER TRIGGER TR_AUDIT_LOGS_AppendOnly
ON dbo.AUDIT_LOGS
INSTEAD OF UPDATE, DELETE
AS
BEGIN
    THROW 50010, 'AUDIT_LOGS bersifat append-only.', 1;
END;
GO

-- 3. Lapisan 2: PERMISSION untuk login aplikasi (hanya SELECT dan INSERT)
GRANT SELECT, INSERT ON dbo.AUDIT_LOGS TO backend_login;
DENY UPDATE, DELETE ON dbo.AUDIT_LOGS TO backend_login;
GO