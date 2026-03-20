import { Badge } from '@/components/ui/badge'
import { Card } from '../components/Card'
import { academicsOverview } from '../lib/db'

export default function AcademicsPage() {
  return (
    <Card title="Academics Management" description="Department-level snapshots to support DOS, HODs, and teachers.">
      <div className="space-y-4">
        {academicsOverview.map((item) => (
          <div key={item.department} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{item.department}</h3>
                <p className="mt-1 text-sm text-slate-400">Lead: {item.lead}</p>
              </div>
              <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">{item.status}</Badge>
            </div>
            <p className="mt-3 text-sm text-cyan-200">Completion rate: {item.completionRate}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
