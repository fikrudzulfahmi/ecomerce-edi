const INTENT_KEY = 'edi.cart-intent'

export interface CartIntent {
  productId: number
  qty: number
  returnTo: string
}

export function saveCartIntent(intent: CartIntent): void {
  sessionStorage.setItem(INTENT_KEY, JSON.stringify(intent))
}

export function getCartIntent(): CartIntent | null {
  const raw = sessionStorage.getItem(INTENT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as CartIntent
  } catch {
    return null
  }
}

export function clearCartIntent(): void {
  sessionStorage.removeItem(INTENT_KEY)
}
