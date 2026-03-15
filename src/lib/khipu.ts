// Tipos y helpers para Khipu API
// NO llamar desde componentes — solo desde Edge Functions

export interface KhipuPaymentRequest {
  expense_id: string
  split_user_id: string
  amount: number
  subject: string
}

export interface KhipuPaymentResult {
  payment_url: string
  payment_id: string
}
