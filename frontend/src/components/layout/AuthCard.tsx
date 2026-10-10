import type { ReactNode } from 'react'
import { Container } from './Container'

interface AuthCardProps {
  title: string
  subtitle?: string
  children: ReactNode
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <Container className="py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-xl border border-cream-darker bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </Container>
  )
}
