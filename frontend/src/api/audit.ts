import { api } from './client'
import type { AuditDetailResponse, AuditListResponse } from '../types'

// Semua parameter dikirim apa adanya sebagai string; validasi dilakukan oleh backend (zod)
export type AuditListParams = Record<string, string>

// GET /api/audit-logs?page=&pageSize=&action=&targetTable=&targetId=&userId=&from=&to=
export async function fetchAuditLogs(params: AuditListParams, signal?: AbortSignal) {
  const res = await api.get<AuditListResponse>('/api/audit-logs', { params, signal })
  return res.data.data
}

// GET /api/audit-logs/:id
export async function fetchAuditLog(id: number, signal?: AbortSignal) {
  const res = await api.get<AuditDetailResponse>(`/api/audit-logs/${id}`, { signal })
  return res.data.data
}