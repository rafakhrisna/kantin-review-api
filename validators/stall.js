const { z } = require('zod');

const listStallsQuery = z.object({
  search: z.string().trim().max(100, 'search maksimal 100 karakter').optional(),
  category: z.string().trim().max(50, 'category maksimal 50 karakter').optional(),
  page: z.coerce
    .number({ invalid_type_error: 'page harus berupa angka' })
    .int('page harus bilangan bulat')
    .min(1, 'page minimal 1')
    .default(1),
  limit: z.coerce
    .number({ invalid_type_error: 'limit harus berupa angka' })
    .int('limit harus bilangan bulat')
    .min(1, 'limit minimal 1')
    .max(100, 'limit maksimal 100')
    .default(10),
});

const createStallBody = z.object({
  name: z
    .string({ required_error: 'name wajib diisi', invalid_type_error: 'name harus berupa teks' })
    .trim()
    .min(3, 'name minimal 3 karakter')
    .max(100, 'name maksimal 100 karakter'),
  category: z
    .string({ invalid_type_error: 'category harus berupa teks' })
    .trim()
    .max(50, 'category maksimal 50 karakter')
    .optional(),
  location: z
    .string({ invalid_type_error: 'location harus berupa teks' })
    .trim()
    .max(100, 'location maksimal 100 karakter')
    .optional(),
  description: z
    .string({ invalid_type_error: 'description harus berupa teks' })
    .max(1000, 'description maksimal 1000 karakter')
    .optional(),
});

const updateStallBody = createStallBody
  .partial()
  .refine((body) => Object.keys(body).length > 0, {
    message: 'minimal satu field harus diisi',
  });

module.exports = { listStallsQuery, createStallBody, updateStallBody };