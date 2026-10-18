const { z } = require('zod');

const registerBody = z.object({
  name: z
    .string({ required_error: 'name wajib diisi', invalid_type_error: 'name harus berupa teks' })
    .trim()
    .min(3, 'name minimal 3 karakter')
    .max(100, 'name maksimal 100 karakter'),
  email: z
    .string({ required_error: 'email wajib diisi', invalid_type_error: 'email harus berupa teks' })
    .trim()
    .toLowerCase()
    .email('format email tidak valid')
    .max(150, 'email maksimal 150 karakter'),
  password: z
    .string({ required_error: 'password wajib diisi', invalid_type_error: 'password harus berupa teks' })
    .min(8, 'password minimal 8 karakter')
    .max(72, 'password maksimal 72 karakter'),
});

const loginBody = z.object({
  email: z
    .string({ required_error: 'email wajib diisi', invalid_type_error: 'email harus berupa teks' })
    .trim()
    .toLowerCase()
    .email('format email tidak valid'),
  password: z
    .string({ required_error: 'password wajib diisi', invalid_type_error: 'password harus berupa teks' })
    .min(1, 'password wajib diisi'),
});

module.exports = { registerBody, loginBody };