import axios from 'axios'
import type { ApiErrorBody } from '../types'

export interface ParsedError {
  status?: number
  message: string 
  detail: string 
  fieldErrors: Record<string, string>
  isNetworkError: boolean
}

export function parseError(error: unknown): ParsedError {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      const message =
        error.code === 'ECONNABORTED'
          ? 'Server terlalu lama merespons. Coba lagi.'
          : 'Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.'
      return { message, detail: message, fieldErrors: {}, isNetworkError: true }
    }

    const { status, data } = error.response
    const fieldErrors: Record<string, string> = {}
    for (const item of data?.errors ?? []) {
      if (!(item.field in fieldErrors)) fieldErrors[item.field] = item.message
    }
    const message = data?.message ?? `Terjadi kesalahan (kode ${status})`
    const extra = Object.values(fieldErrors)
    const detail = extra.length > 0 ? `${message}: ${extra.join(', ')}` : message
    return { status, message, detail, fieldErrors, isNetworkError: false }
  }

  const message = 'Terjadi kesalahan yang tidak terduga.'
  return { message, detail: message, fieldErrors: {}, isNetworkError: false }
}

export function isCanceled(error: unknown) {
  return axios.isCancel(error)
}