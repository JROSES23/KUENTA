// Tipos y helpers para Gemini Flash Vision
// NO llamar desde componentes — solo desde Edge Functions

export interface GeminiReceiptItem {
  name: string
  price: number
  assigned_to: 'all' | string
}

export interface GeminiScanResult {
  restaurant_name: string
  total: number
  items: GeminiReceiptItem[]
  confidence: 'high' | 'medium' | 'low'
}
