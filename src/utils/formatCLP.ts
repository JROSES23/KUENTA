const formatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatCLP(amount: number): string {
  return formatter.format(Math.round(amount))
}

export function formatCLPNumber(amount: number): string {
  return new Intl.NumberFormat('es-CL').format(Math.round(amount))
}
