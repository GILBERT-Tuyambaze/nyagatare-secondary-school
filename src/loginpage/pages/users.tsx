import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '../components/Card'
import { UserTable } from '../components/UserTable'
import { SystemUser } from '../types'
import { fetchAccessProfileUsers } from '../lib/firestoreSeed'

export default function UsersPage() {
  const { accessProfile, user } = useAuth()
  const [users, setUsers] = useState<SystemUser[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const firestoreUsers = await fetchAccessProfileUsers({
        isSuperAdminViewer: accessProfile.role === 'SuperAdmin',
      })
      setUsers(firestoreUsers)
      setMessage(
        firestoreUsers.length
          ? `Showing ${firestoreUsers.length} live access profile records from Firestore.`
          : 'No live access profile records were found yet.'
      )
    } catch (error) {
      console.error('Failed to load Firestore access profiles:', error)
      setUsers([])
      setMessage('Could not load live Firestore profiles right now.')
    } finally {
      setLoading(false)
    }
  }, [accessProfile.role])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  return (
    <div className="space-y-6">
      <Card title="User Management Summary" description="Live access profiles, role visibility, and account status at a glance.">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/85 p-4">
            <p className="text-sm text-slate-300">Total Users</p>
            <p className="mt-2 text-3xl font-bold text-white">{users.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900/85 p-4">
            <p className="text-sm text-slate-300">Active Users</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {users.filter((currentUser) => currentUser.status === 'active').length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900/85 p-4">
            <p className="text-sm text-slate-300">Viewer</p>
            <p className="mt-2 text-base font-medium text-cyan-100">{accessProfile.displayName}</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900/85 p-4">
            <p className="text-sm text-slate-300">Data Source</p>
            <p className="mt-2 text-base font-medium text-white">Live Firestore</p>
          </div>
        </div>
        {message ? <p className="mt-4 text-sm text-cyan-200">{message}</p> : null}
      </Card>

      <Card title="Profile Controls" description="Refresh the live user list and keep the access workspace up to date.">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="border-slate-600 bg-slate-900/80 text-slate-100 hover:border-cyan-400/40 hover:bg-slate-800 hover:text-white"
            onClick={loadUsers}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Profiles'}
          </Button>
        </div>
      </Card>

      <Card title="Users Table">
        <UserTable
          users={users}
          viewerRole={accessProfile.role}
          viewerUid={user?.uid}
          viewerEmail={user?.email}
          onUsersChanged={loadUsers}
        />
      </Card>
    </div>
  )
}
