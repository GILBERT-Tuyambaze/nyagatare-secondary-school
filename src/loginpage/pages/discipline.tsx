import { Badge } from '@/components/ui/badge'
import { Card } from '../components/Card'
import { disciplineItems } from '../lib/db'

export default function DisciplinePage() {
  return (
    <Card title="Discipline Desk" description="Operational view for DOD case tracking and follow-up monitoring.">
      <div className="space-y-4">
        {disciplineItems.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-white">{item.caseTitle}</p>
                <p className="mt-1 text-sm text-slate-400">Owner: {item.owner}</p>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">{item.severity}</Badge>
                <Badge className="bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10">{item.status}</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
