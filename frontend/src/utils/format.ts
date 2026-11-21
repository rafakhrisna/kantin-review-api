// Waktu dari backend berformat UTC (ISO); ditampilkan sesuai zona waktu browser
export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' })
}