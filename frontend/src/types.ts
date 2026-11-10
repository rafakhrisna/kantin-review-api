export type Role = 'admin' | 'owner' | 'customer'

export interface User {
  id: number
  name: string
  email: string
  role: Role
  created_at?: string
}

export interface Stall {
  id: number
  owner_id: number
  name: string
  category: string | null
  location: string | null
  description: string | null
  avg_rating: number
  review_count: number
  created_at: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface StallListResponse {
  success: boolean
  data: Stall[]
  pagination: Pagination
}

export interface StallInput {
  name: string
  category?: string
  location?: string
  description?: string
}

export interface ApiErrorBody {
  status?: string
  message?: string
  errors?: { field: string; message: string }[]
}

export interface Envelope<T> {
  success: boolean
  message?: string
  data: T
}