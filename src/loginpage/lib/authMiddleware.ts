import { AccessProfile, Permission, Role } from '../types'
import { hasAllPermissions, hasAnyPermission, hasPermission, hasRole } from './rbac'

export const requirePermission = (profile: AccessProfile, permission: Permission) => hasPermission(profile, permission)
export const requireAnyPermission = (profile: AccessProfile, permissions: Permission[]) => hasAnyPermission(profile, permissions)
export const requireAllPermissions = (profile: AccessProfile, permissions: Permission[]) => hasAllPermissions(profile, permissions)
export const requireAnyRole = (profile: AccessProfile, roles: Role[]) => hasRole(profile, roles)
