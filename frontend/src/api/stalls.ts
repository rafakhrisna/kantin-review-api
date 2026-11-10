import { api } from './client'
import type { Envelope, Stall, StallInput, StallListResponse } from '../types'

export interface StallListParams {
  search?: string
  category?: string
  page?: number
  limit?: number
}

export async function fetchStalls(params: StallListParams, signal?: AbortSignal) {
  const res = await api.get<StallListResponse>('/stalls', { params, signal })
  return res.data
}

export async function fetchStall(id: number | string, signal?: AbortSignal) {
  const res = await api.get<Envelope<Stall>>(`/stalls/${id}`, { signal })
  return res.data.data
}

export async function createStall(input: StallInput) {
  const res = await api.post<Envelope<Stall>>('/stalls', input)
  return res.data.data
}

export async function updateStall(id: number | string, input: Partial<StallInput>) {
  const res = await api.put<Envelope<Stall>>(`/stalls/${id}`, input)
  return res.data.data
}

export async function deleteStall(id: number | string) {
  await api.delete(`/stalls/${id}`)
}