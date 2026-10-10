import type { ReactNode } from 'react'

type Variant = 'error' | 'success' | 'info'

interface AlertProps {
  variant: Variant
  children: ReactNode
}

const styles: Record<Variant, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-green-200 bg-green-50 text-green-800',
  info: 'border-navy/20 bg-navy/5 text-navy',
}

export function Alert({ variant, children }: AlertProps) {
  return (
    <div role="alert" className={`rounded-md border px-4 py-3 text-sm ${styles[variant]}`}>
      {children}
    </div>
  )
}
