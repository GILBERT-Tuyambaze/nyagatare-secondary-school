import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  EmailAuthProvider,
  User,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import { AccessProfile, Permission, Role } from '@/loginpage/types'
import { buildAccessProfile, hasAllPermissions as accessHasAllPermissions, hasAnyPermission as accessHasAnyPermission, hasPermission as accessHasPermission, rolePermissions } from '@/loginpage/lib/rbac'
import { findAccessProfileByEmail } from '@/loginpage/lib/firestoreSeed'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  isAdmin: boolean
  accessProfile: AccessProfile
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  hasRole: (roles: Role[]) => boolean
  refreshAccessProfile: () => Promise<void>
  updateOwnAuthProfile: ({
    displayName,
    currentPassword,
    newPassword,
  }: {
    displayName?: string
    currentPassword?: string
    newPassword?: string
  }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [accessProfile, setAccessProfile] = useState<AccessProfile>(buildAccessProfile(null, []))
  const [loading, setLoading] = useState(true)

  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS as string | undefined)
    ?.split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean) ?? []

  const exactSuperAdminEmail = 'gilberttuyambaze00@gmail.com'

  const formatDisplayName = (email: string | null, fallback?: string | null) => {
    if (fallback?.trim()) return fallback.trim()
    if (!email) return 'Guest User'
    const localPart = email.split('@')[0].replace(/[._-]+/g, ' ')
    return localPart.replace(/\b\w/g, (character) => character.toUpperCase())
  }

  const buildSignedInFallbackProfile = (nextUser: User) => {
    const normalizedEmail = nextUser.email?.toLowerCase() ?? ''
    const isKnownSuperAdmin = normalizedEmail === exactSuperAdminEmail || adminEmails.includes(normalizedEmail)

    if (isKnownSuperAdmin) {
      return {
        ...buildAccessProfile(nextUser.email ?? null, adminEmails),
        displayName: formatDisplayName(nextUser.email, nextUser.displayName || 'System Ghost'),
        fullName: formatDisplayName(nextUser.email, nextUser.displayName || 'System Ghost'),
        department: 'Digital Operations',
        status: 'active' as const,
        isGhost: true,
        isProtected: true,
      }
    }

    return {
      email: nextUser.email ?? null,
      displayName: formatDisplayName(nextUser.email, nextUser.displayName),
      fullName: formatDisplayName(nextUser.email, nextUser.displayName),
      role: 'Guest' as const,
      permissions: rolePermissions.Guest,
      department: 'General',
      status: 'active' as const,
      isGhost: false,
      isProtected: false,
    }
  }

  const loadAccessProfile = async (nextUser: User | null) => {
    if (!nextUser) {
      return buildAccessProfile(null, adminEmails)
    }

    const fallbackProfile = buildSignedInFallbackProfile(nextUser)

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return fallbackProfile
    }

    try {
      const profileRef = doc(db, 'access_profiles', nextUser.uid)
      const snapshot = await getDoc(profileRef)
      const data = snapshot.exists()
        ? (snapshot.data() as Partial<AccessProfile> & { role?: Role })
        : ((await findAccessProfileByEmail(nextUser.email ?? '')) as Partial<AccessProfile> & { role?: Role } | null)

      if (!data) {
        return fallbackProfile
      }

      const role = data.role && data.role in rolePermissions ? data.role : fallbackProfile.role
      const isSuperAdminProfile = role === 'SuperAdmin'
      const resolvedName = isSuperAdminProfile
        ? 'System Ghost'
        : data.displayName || data.fullName || fallbackProfile.displayName

      return {
        email: nextUser.email ?? data.email ?? null,
        displayName: resolvedName,
        fullName: isSuperAdminProfile ? 'System Ghost' : data.fullName || data.displayName || fallbackProfile.fullName,
        role,
        permissions: Array.isArray(data.permissions) && data.permissions.length > 0 ? data.permissions : rolePermissions[role],
        department: data.department || fallbackProfile.department,
        status: data.status || fallbackProfile.status,
        isGhost: Boolean(isSuperAdminProfile || data.isGhost || fallbackProfile.isGhost),
        isProtected: Boolean(isSuperAdminProfile || data.isProtected || fallbackProfile.isProtected),
      }
    } catch (error) {
      console.error('Failed to load access profile from Firestore:', error)
      return fallbackProfile
    }
  }

  const refreshAccessProfile = async () => {
    const profile = await loadAccessProfile(auth.currentUser)
    setAccessProfile(profile)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setLoading(true)
      setUser(nextUser)
      await refreshAccessProfile()
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  const updateOwnAuthProfile = async ({
    displayName,
    currentPassword,
    newPassword,
  }: {
    displayName?: string
    currentPassword?: string
    newPassword?: string
  }) => {
    const currentUser = auth.currentUser

    if (!currentUser) {
      throw new Error('You must be signed in to update your profile.')
    }

    if (displayName && displayName.trim() && displayName.trim() !== currentUser.displayName) {
      await updateProfile(currentUser, { displayName: displayName.trim() })
    }

    if (newPassword?.trim()) {
      if (!currentUser.email) {
        throw new Error('This account does not have an email address for password verification.')
      }

      if (!currentPassword?.trim()) {
        throw new Error('Enter your current password before setting a new one.')
      }

      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword)
      await reauthenticateWithCredential(currentUser, credential)
      await updatePassword(currentUser, newPassword.trim())
    }
  }

  const normalizedEmail = accessProfile.email?.toLowerCase() ?? ''
  const isAdmin =
    !!normalizedEmail &&
    (adminEmails.includes(normalizedEmail) ||
      normalizedEmail.includes('admin') ||
      normalizedEmail === 'gilberttuyambaze00@gmail.com') === true

  const hasPermission = (permission: Permission) => accessHasPermission(accessProfile, permission)
  const hasAnyPermission = (permissions: Permission[]) => accessHasAnyPermission(accessProfile, permissions)
  const hasAllPermissions = (permissions: Permission[]) => accessHasAllPermissions(accessProfile, permissions)
  const hasRole = (roles: Role[]) => roles.includes(accessProfile.role)

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAdmin,
    accessProfile,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    refreshAccessProfile,
    updateOwnAuthProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
