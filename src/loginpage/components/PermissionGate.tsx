import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Permission } from '../types'
import { requirePermission } from '../lib/authMiddleware'
import { Card } from './Card'

export function PermissionGate({
  permission,
  children,
}: {
  permission: Permission
  children: ReactNode
}) {
  const { accessProfile } = useAuth()

  if (!requirePermission(accessProfile, permission)) {
    return (
      <Card title="Access Restricted" description="This module is protected by role-based permissions.">
        <p className="text-sm text-slate-300">
          Your current role is <span className="font-semibold text-white">{accessProfile.role}</span>. It does not include
          the <span className="font-semibold text-cyan-200"> {permission}</span> permission.
        </p>
      </Card>
    )
  }

  return <>{children}</>
}
