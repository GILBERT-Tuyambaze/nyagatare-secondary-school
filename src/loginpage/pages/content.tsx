import { Badge } from '@/components/ui/badge'
import { Card } from '../components/Card'
import { contentItems } from '../lib/db'

export default function ContentPage() {
  return (
    <Card title="Content Manager" description="Publishing queue for website news, events, and announcements.">
      <div className="space-y-4">
        {contentItems.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-sm text-slate-400">{item.type} • updated {item.updatedAt}</p>
              </div>
              <Badge className="bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10">{item.status}</Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
