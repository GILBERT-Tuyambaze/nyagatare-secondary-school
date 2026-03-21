import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Calendar, DollarSign, FileText, Mail, Users } from 'lucide-react'
import { getDashboardStats, getNewsletterSubscribers } from '@/services/firestoreService'
import { Card } from '../components/Card'
import { controlStats } from '../lib/db'
import { systemUsers } from '../lib/db'

export default function ControlCenterPage() {
  const [overview, setOverview] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    upcomingEvents: 0,
    totalDonations: 0,
    totalStudents: 0,
    totalSubscribers: 0,
  })

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const [stats, subscribers] = await Promise.all([getDashboardStats(), getNewsletterSubscribers()])
        setOverview({
          totalApplications: stats.totalApplications,
          pendingApplications: stats.pendingApplications,
          upcomingEvents: stats.upcomingEvents,
          totalDonations: stats.totalDonations,
          totalStudents: stats.totalStudents,
          totalSubscribers: subscribers.length,
        })
      } catch (error) {
        console.error('Failed to load live control center overview:', error)
      }
    }

    loadOverview()
  }, [])

  return (
    <div className="space-y-6">
      <Card title="Institution Overview" description="Live figures merged from the legacy admin dashboard into the current control center.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            { label: 'Applications', value: overview.totalApplications, note: `${overview.pendingApplications} pending review`, icon: FileText },
            { label: 'Students', value: overview.totalStudents, note: 'Students currently in the live system data', icon: Users },
            { label: 'Upcoming Events', value: overview.upcomingEvents, note: 'Calendar items still marked upcoming', icon: Calendar },
            { label: 'Completed Donations', value: `RWF ${overview.totalDonations.toLocaleString()}`, note: 'Total confirmed donations received', icon: DollarSign },
            { label: 'Newsletter Audience', value: overview.totalSubscribers, note: 'Subscribers collected from the public website', icon: Mail },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-400">{item.label}</p>
                    <p className="mt-2 text-3xl font-bold text-white">{item.value}</p>
                    <p className="mt-2 text-sm text-slate-300">{item.note}</p>
                  </div>
                  <div className="rounded-full bg-cyan-500/10 p-3 text-cyan-200">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card title="Staff/Admin Control Center" description="Operational command space for school leadership, staff, and administrators.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {controlStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
              <p className="mt-2 text-sm text-slate-300">{stat.note}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Command Team Snapshot" description="People currently modeled in the secure operations structure.">
        <div className="grid gap-4 md:grid-cols-2">
          {systemUsers.map((user) => (
            <div key={user.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{user.fullName}</p>
                  <p className="mt-1 text-sm text-slate-400">{user.department}</p>
                </div>
                <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">{user.role}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
