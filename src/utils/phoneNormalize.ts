export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('56') && digits.length === 11) return `+${digits}`
  if (digits.startsWith('9') && digits.length === 9) return `+56${digits}`
  if (digits.length === 8) return `+569${digits}`
  return `+56${digits}`
}

export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizePhone(phone)
  if (normalized.length === 12) {
    return `${normalized.slice(0, 4)} ${normalized.slice(4, 8)} ${normalized.slice(8)}`
  }
  return normalized
}
