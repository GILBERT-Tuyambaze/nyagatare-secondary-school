import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
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

  const loadAccessProfile = async (nextUser: User | null) => {
    if (!nextUser) {
      return buildAccessProfile(null, adminEmails)
    }

    const fallbackProfile = buildAccessProfile(nextUser.email ?? null, adminEmails)

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

      return {
        email: nextUser.email ?? data.email ?? null,
        displayName: data.displayName || fallbackProfile.displayName,
        role,
        permissions: Array.isArray(data.permissions) && data.permissions.length > 0 ? data.permissions : rolePermissions[role],
      }
    } catch (error) {
      console.error('Failed to load access profile from Firestore:', error)
      return fallbackProfile
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setLoading(true)
      setUser(nextUser)
      const profile = await loadAccessProfile(nextUser)
      setAccessProfile(profile)
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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
