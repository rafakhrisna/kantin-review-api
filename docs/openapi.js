const json = (schema) => ({ 'application/json': { schema } });
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const res = (name) => ({ $ref: `#/components/responses/${name}` });
const idParam = {
  name: 'id', in: 'path', required: true,
  schema: { type: 'integer', minimum: 1 },
};
const secured = [{ bearerAuth: [] }];

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Kantin Review API',
    version: '3.0.0',
    description:
      'REST API sistem review kantin (Express.js + SQL Server). Validasi memakai zod, autentikasi memakai JWT.\n\n' +
      '**Cara memakai token:** panggil `POST /auth/login`, salin `token` dari response, klik tombol **Authorize** di kanan atas, lalu tempel token-nya.\n\n' +
      '**Role:** admin, owner, customer. **401** = belum login / token salah. **403** = sudah login tapi tidak punya akses.',
  },
  servers: [{ url: '/api', description: 'Server saat ini' }],
  tags: [
    { name: 'Auth', description: 'Register, login, profil' },
    { name: 'Stalls', description: 'Warung' },
    { name: 'Reviews', description: 'Review warung' },
  ],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'fail' },
          message: { type: 'string', example: 'Token tidak ditemukan' },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'fail' },
          message: { type: 'string', example: 'Validasi gagal' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'name' },
                message: { type: 'string', example: 'name minimal 3 karakter' },
              },
            },
          },
        },
      },
      RegisterInput: {
        type: 'object', required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 3, maxLength: 100, example: 'Budi Pelanggan' },
          email: { type: 'string', format: 'email', maxLength: 150, example: 'budi@mail.com' },
          password: { type: 'string', minLength: 8, maxLength: 72, example: 'rahasia123' },
        },
      },
      LoginInput: {
        type: 'object', required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@kantin.test' },
          password: { type: 'string', example: 'password123' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' }, name: { type: 'string' }, email: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'owner', 'customer'] },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Stall: {
        type: 'object',
        properties: {
          id: { type: 'integer' }, owner_id: { type: 'integer' }, name: { type: 'string' },
          category: { type: 'string', nullable: true }, location: { type: 'string', nullable: true },
          description: { type: 'string', nullable: true },
          avg_rating: { type: 'number' }, review_count: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      StallInput: {
        type: 'object', required: ['name'],
        properties: {
          name: { type: 'string', minLength: 3, maxLength: 100, example: 'Warung Soto Pak Joko' },
          category: { type: 'string', maxLength: 50, example: 'Soto' },
          location: { type: 'string', maxLength: 100, example: 'Blok D No.3' },
          description: { type: 'string', maxLength: 1000, example: 'Soto ayam kuah bening' },
        },
      },
      StallUpdateInput: {
        type: 'object', minProperties: 1,
        description: 'Versi parsial dari StallInput: semua field opsional, minimal satu field.',
        properties: {
          name: { type: 'string', minLength: 3, maxLength: 100 },
          category: { type: 'string', maxLength: 50 },
          location: { type: 'string', maxLength: 100 },
          description: { type: 'string', maxLength: 1000 },
        },
      },
      ReviewInput: {
        type: 'object', required: ['rating'],
        properties: {
          rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
          comment: { type: 'string', maxLength: 1000, example: 'Enak dan murah' },
        },
      },
    },
    responses: {
      ValidationError: { description: '400 - Validasi gagal', content: json(ref('ValidationError')) },
      Unauthorized: { description: '401 - Belum login / token tidak ada / token tidak valid', content: json(ref('Error')) },
      Forbidden: { description: '403 - Sudah login tapi role / kepemilikan tidak memenuhi', content: json(ref('Error')) },
      NotFound: { description: '404 - Data tidak ditemukan', content: json(ref('Error')) },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'], summary: 'Daftar akun baru (role otomatis customer)',
        requestBody: { required: true, content: json(ref('RegisterInput')) },
        responses: {
          201: { description: 'Registrasi berhasil' },
          400: res('ValidationError'),
          409: { description: 'Email sudah terdaftar', content: json(ref('Error')) },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login dan dapatkan token JWT',
        requestBody: { required: true, content: json(ref('LoginInput')) },
        responses: { 200: { description: 'Login berhasil, mengembalikan token' }, 400: res('ValidationError'), 401: res('Unauthorized') },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'], summary: 'Profil user dari token (semua role)', security: secured,
        responses: { 200: { description: 'Data user', content: json(ref('User')) }, 401: res('Unauthorized') },
      },
    },
    '/stalls': {
      get: {
        tags: ['Stalls'], summary: 'Daftar warung (publik) + filter + pagination',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string', maxLength: 100 } },
          { name: 'category', in: 'query', schema: { type: 'string', maxLength: 50 } },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 } },
        ],
        responses: { 200: { description: 'Daftar warung + pagination' }, 400: res('ValidationError') },
      },
      post: {
        tags: ['Stalls'], summary: 'Tambah warung (owner, admin). owner_id diambil dari token', security: secured,
        requestBody: { required: true, content: json(ref('StallInput')) },
        responses: { 201: { description: 'Warung dibuat', content: json(ref('Stall')) }, 400: res('ValidationError'), 401: res('Unauthorized'), 403: res('Forbidden') },
      },
    },
    '/stalls/{id}': {
      get: {
        tags: ['Stalls'], summary: 'Detail warung (publik)', parameters: [idParam],
        responses: { 200: { description: 'Detail warung', content: json(ref('Stall')) }, 400: res('ValidationError'), 404: res('NotFound') },
      },
      put: {
        tags: ['Stalls'], summary: 'Ubah warung (owner hanya miliknya, admin bebas)', security: secured, parameters: [idParam],
        requestBody: { required: true, content: json(ref('StallUpdateInput')) },
        responses: { 200: { description: 'Warung diubah', content: json(ref('Stall')) }, 400: res('ValidationError'), 401: res('Unauthorized'), 403: res('Forbidden'), 404: res('NotFound') },
      },
      delete: {
        tags: ['Stalls'], summary: 'Hapus warung (admin)', security: secured, parameters: [idParam],
        responses: { 200: { description: 'Warung dihapus' }, 400: res('ValidationError'), 401: res('Unauthorized'), 403: res('Forbidden'), 404: res('NotFound') },
      },
    },
    '/stalls/{id}/reviews': {
      post: {
        tags: ['Reviews'], summary: 'Tambah review (semua role yang login). user_id diambil dari token', security: secured, parameters: [idParam],
        requestBody: { required: true, content: json(ref('ReviewInput')) },
        responses: {
          201: { description: 'Review dibuat' }, 400: res('ValidationError'), 401: res('Unauthorized'), 404: res('NotFound'),
          409: { description: 'User sudah pernah mereview warung ini', content: json(ref('Error')) },
        },
      },
    },
  },
};