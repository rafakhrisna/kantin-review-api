const { z } = require('zod');

const MAX_INT = 2147483647; // batas tipe INT di SQL Server
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
const ALLOWED_KEYS = ['page', 'pageSize', 'action', 'targetTable', 'targetId', 'userId', 'from', 'to'];

// true hanya jika formatnya YYYY-MM-DD DAN tanggalnya ada di kalender (mis. 2026-02-30 ditolak)
function isRealDate(value) {
  if (!DATE_FORMAT.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

const intParam = (name) =>
  z.coerce
    .number({ invalid_type_error: `${name} harus berupa angka` })
    .int(`${name} harus bilangan bulat`)
    .positive(`${name} harus lebih dari 0`)
    .max(MAX_INT, `${name} terlalu besar`);

const textParam = (name, max) =>
  z
    .string({ invalid_type_error: `${name} harus berupa teks` })
    .trim()
    .min(1, `${name} tidak boleh kosong`)
    .max(max, `${name} maksimal ${max} karakter`);

const dateParam = (name) =>
  z
    .string({ invalid_type_error: `${name} harus berupa teks` })
    .regex(DATE_FORMAT, `${name} harus berformat YYYY-MM-DD`)
    .refine((v) => !DATE_FORMAT.test(v) || isRealDate(v), `${name} bukan tanggal yang valid di kalender`);

const listAuditLogsQuery = z
  .object({
    page: z.coerce
      .number({ invalid_type_error: 'page harus berupa angka' })
      .int('page harus bilangan bulat')
      .min(1, 'page minimal 1')
      .max(10000000, 'page terlalu besar')
      .default(1),
    pageSize: z.coerce
      .number({ invalid_type_error: 'pageSize harus berupa angka' })
      .int('pageSize harus bilangan bulat')
      .min(1, 'pageSize minimal 1')
      .max(100, 'pageSize maksimal 100')
      .default(20),
    action: textParam('action', 50).optional(),
    targetTable: textParam('targetTable', 50).optional(),
    targetId: intParam('targetId').optional(),
    userId: intParam('userId').optional(),
    from: dateParam('from').optional(),
    to: dateParam('to').optional(),
  })
  .passthrough() // sengaja: parameter asing ditangkap manual supaya pesannya jelas
  .superRefine((query, ctx) => {
    for (const key of Object.keys(query)) {
      if (!ALLOWED_KEYS.includes(key)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: `parameter ${key} tidak dikenal` });
      }
    }
    if (query.from && query.to && isRealDate(query.from) && isRealDate(query.to) && query.from > query.to) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['from'], message: 'from tidak boleh lebih besar dari to' });
    }
  });

const auditIdParam = z.object({
  id: intParam('id'),
});

module.exports = { listAuditLogsQuery, auditIdParam };