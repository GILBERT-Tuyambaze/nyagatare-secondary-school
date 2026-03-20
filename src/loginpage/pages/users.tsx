import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '../components/Card'
import { UserTable } from '../components/UserTable'
import { systemUsers } from '../lib/db'
import { fetchAccessProfileUsers, seedFirestoreData } from '../lib/firestoreSeed'

export default function UsersPage() {
  const { accessProfile, user } = useAuth()
  const [users, setUsers] = useState(systemUsers)
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [message, setMessage] = useState('')

  const loadUsers = async () => {
    setLoading(true)
    try {
      const firestoreUsers = await fetchAccessProfileUsers()
      setUsers(firestoreUsers.length ? firestoreUsers : systemUsers)
      setMessage(
        firestoreUsers.length
          ? `Loaded ${firestoreUsers.length} access profile records from Firestore.`
          : 'Firestore has no access_profiles yet. Showing local seed preview.'
      )
    } catch (error) {
      console.error('Failed to load Firestore access profiles:', error)
      setUsers(systemUsers)
      setMessage('Could not read Firestore yet. Showing local seed preview.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleSeed = async () => {
    setSeeding(true)
    setMessage('')
    try {
      const result = await seedFirestoreData(user)
      setMessage(
        `Seeded Firestore with ${result.accessProfiles} access profiles, ${result.students} students, ${result.applications} applications, ${result.events} events, ${result.donations} donations, and ${result.boardMembers} board members.`
      )
      await loadUsers()
    } catch (error) {
      console.error('Failed to seed Firestore:', error)
      setMessage('Seeding failed. Check Firebase auth/session and Firestore rules, then try again.')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card title="User Management Summary" description="Current seeded users in the RBAC workspace.">
        <div className="grid gap-4 md:grid-cols-3">
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
        </div>
      </Card>

      <Card title="Firestore Seed Controls" description="Use this once on an empty project to create the collections and testing data the app expects.">
        <div className="flex flex-wrap items-center gap-3">
          <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" onClick={handleSeed} disabled={seeding}>
            {seeding ? 'Seeding Firestore...' : 'Seed Firestore'}
          </Button>
          <Button
            variant="outline"
            className="border-slate-600 bg-slate-900/80 text-slate-100 hover:border-cyan-400/40 hover:bg-slate-800 hover:text-white"
            onClick={loadUsers}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Reload Profiles'}
          </Button>
        </div>
        {message ? <p className="mt-4 text-sm text-cyan-200">{message}</p> : null}
      </Card>

      <Card title="Users Table">
        <UserTable users={users} />
      </Card>
    </div>
  )
}
