const { z } = require('zod');

const createReviewBody = z.object({
  rating: z
    .number({ required_error: 'rating wajib diisi', invalid_type_error: 'rating harus berupa angka' })
    .int('rating harus bilangan bulat')
    .min(1, 'rating minimal 1')
    .max(5, 'rating maksimal 5'),
  comment: z
    .string({ invalid_type_error: 'comment harus berupa teks' })
    .trim()
    .max(1000, 'comment maksimal 1000 karakter')
    .optional(),
});

module.exports = { createReviewBody };