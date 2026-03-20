import { ReactNode } from 'react'
import { Card as UiCard, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function Card({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <UiCard className="border-slate-700 bg-slate-900/85 text-white shadow-lg shadow-slate-950/20">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription className="text-slate-300">{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </UiCard>
  )
}
