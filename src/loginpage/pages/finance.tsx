import { Badge } from '@/components/ui/badge'
import { Card } from '../components/Card'
import { financeItems } from '../lib/db'

export default function FinancePage() {
  return (
    <Card title="Bursar Workspace" description="Financial health indicators and bursar-oriented control checks.">
      <div className="grid gap-4 md:grid-cols-3">
        {financeItems.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-white">{item.amount}</p>
            <Badge className="mt-3 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10">{item.status}</Badge>
          </div>
        ))}
      </div>
    </Card>
  )
}
