import { api } from './client'
import type { Envelope, User } from '../types'

export interface LoginResult {
  token: string
  user: User
}

export async function loginRequest(email: string, password: string) {
  const res = await api.post<Envelope<LoginResult>>('/auth/login', { email, password })
  return res.data.data
}

export async function registerRequest(name: string, email: string, password: string) {
  const res = await api.post<Envelope<User>>('/auth/register', { name, email, password })
  return res.data.data
}

export async function meRequest(signal?: AbortSignal) {
  const res = await api.get<Envelope<User>>('/auth/me', { signal })
  return res.data.data
}