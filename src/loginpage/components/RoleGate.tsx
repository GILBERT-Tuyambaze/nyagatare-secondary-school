import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Role } from '../types'
import { requireAnyRole } from '../lib/authMiddleware'
import { Card } from './Card'

export function RoleGate({
  roles,
  children,
}: {
  roles: Role[]
  children: ReactNode
}) {
  const { accessProfile } = useAuth()

  if (!requireAnyRole(accessProfile, roles)) {
    return (
      <Card title="Access Restricted" description="This module is limited to specific system roles.">
        <p className="text-sm text-slate-300">
          Your current role is <span className="font-semibold text-white">{accessProfile.role}</span>.
        </p>
      </Card>
    )
  }

  return <>{children}</>
}
