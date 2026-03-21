import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { LearningResource, SchoolSubject } from '@/types/database'
import { Classroom } from '../types'

type ResourceDraft = {
  class_id: string
  subject_id?: string
  subject_name?: string
  teacher_user_id: string
  teacher_name: string
  type: LearningResource['type']
  title: string
  description: string
  attachment_url?: string
  due_date?: string
}

const resourceTone: Record<LearningResource['type'], string> = {
  assignment: 'bg-amber-500/15 text-amber-200',
  exercise: 'bg-sky-500/15 text-sky-200',
  holiday_package: 'bg-violet-500/15 text-violet-200',
  notes: 'bg-emerald-500/15 text-emerald-200',
  material: 'bg-cyan-500/15 text-cyan-200',
}

const fieldClassName = 'border-slate-700 bg-slate-950/80 text-slate-100 placeholder:text-slate-500'

export function LearningResourcesPanel({
  resources,
  classes,
  subjects,
  selectedClassId,
  teacherName,
  teacherUid,
  canManage,
  saving,
  onCreate,
}: {
  resources: LearningResource[]
  classes: Classroom[]
  subjects: SchoolSubject[]
  selectedClassId?: string
  teacherName: string
  teacherUid: string
  canManage: boolean
  saving?: boolean
  onCreate?: (resource: ResourceDraft) => Promise<void>
}) {
  const [draft, setDraft] = useState<ResourceDraft>({
    class_id: selectedClassId || classes[0]?.id || '',
    subject_id: '',
    subject_name: '',
    teacher_user_id: teacherUid,
    teacher_name: teacherName,
    type: 'assignment',
    title: '',
    description: '',
    attachment_url: '',
    due_date: '',
  })

  const filteredResources = useMemo(
    () => (selectedClassId ? resources.filter((item) => item.class_id === selectedClassId) : resources),
    [resources, selectedClassId]
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!onCreate || !draft.class_id || !draft.title.trim() || !draft.description.trim()) return

    const selectedSubject = subjects.find((item) => item.id === draft.subject_id)
    await onCreate({
      ...draft,
      subject_name: selectedSubject?.name || draft.subject_name || 'General',
      subject_id: selectedSubject?.id || draft.subject_id || undefined,
      attachment_url: draft.attachment_url?.trim() || undefined,
      due_date: draft.due_date?.trim() || undefined,
    })

    setDraft((current) => ({
      ...current,
      title: '',
      description: '',
      attachment_url: '',
      due_date: '',
    }))
  }

  return (
    <div className="space-y-5">
      {canManage ? (
        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">Publish Learning Resource</h3>
              <p className="text-sm text-slate-400">Assignments, exercises, holiday work, notes, and materials go live to the selected class.</p>
            </div>
            <Button type="submit" className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" disabled={saving}>
              {saving ? 'Publishing...' : 'Publish Resource'}
            </Button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Select value={draft.class_id} onValueChange={(value) => setDraft((current) => ({ ...current, class_id: value }))}>
              <SelectTrigger className={fieldClassName}>
                <SelectValue placeholder="Choose class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={draft.subject_id}
              onValueChange={(value) => {
                const subject = subjects.find((item) => item.id === value)
                setDraft((current) => ({
                  ...current,
                  subject_id: value,
                  subject_name: subject?.name || current.subject_name,
                }))
              }}
            >
              <SelectTrigger className={fieldClassName}>
                <SelectValue placeholder="Choose subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={draft.type}
              onValueChange={(value) => setDraft((current) => ({ ...current, type: value as LearningResource['type'] }))}
            >
              <SelectTrigger className={fieldClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assignment">Assignment</SelectItem>
                <SelectItem value="exercise">Exercise</SelectItem>
                <SelectItem value="holiday_package">Holiday Package</SelectItem>
                <SelectItem value="notes">Notes</SelectItem>
                <SelectItem value="material">Material</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              placeholder="Resource title"
              className={fieldClassName}
            />
            <Input
              value={draft.attachment_url}
              onChange={(event) => setDraft((current) => ({ ...current, attachment_url: event.target.value }))}
              placeholder="Attachment link (optional)"
              className={fieldClassName}
            />
            <Input
              type="date"
              value={draft.due_date}
              onChange={(event) => setDraft((current) => ({ ...current, due_date: event.target.value }))}
              className={fieldClassName}
            />
            <div className="md:col-span-2">
              <Textarea
                value={draft.description}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                placeholder="Describe the task, learning goal, or study instruction."
                className="min-h-[120px] border-slate-700 bg-slate-950/80 text-slate-100 placeholder:text-slate-500"
              />
            </div>
          </div>
        </form>
      ) : null}

      <div className="space-y-4">
        {filteredResources.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-sm text-slate-400">
            No resources have been published for this class yet.
          </div>
        ) : null}
        {filteredResources.map((resource) => (
          <div key={resource.id} className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-white">{resource.title}</h3>
                  <Badge className={resourceTone[resource.type]}>{resource.type.replace('_', ' ')}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  {resource.subject_name || 'General'} · {resource.teacher_name}
                </p>
              </div>
              {resource.due_date ? <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">Due {resource.due_date}</Badge> : null}
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-200">{resource.description}</p>
            {resource.attachment_url ? (
              <a href={resource.attachment_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-medium text-cyan-300 hover:text-cyan-200">
                Open attachment
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
