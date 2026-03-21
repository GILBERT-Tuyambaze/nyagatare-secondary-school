import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { MarkComment, StudentMark } from '@/types/database'
import { Student } from '@/types/database'
import { Classroom } from '../types'

type MarkDraft = {
  class_id: string
  student_id: string
  student_name: string
  subject_id: string
  subject_name: string
  teacher_user_id: string
  teacher_name: string
  score: number
  max_score: number
  term: string
  academic_year: string
  comment?: string
}

const fieldClassName = 'border-slate-700 bg-slate-950/80 text-slate-100 placeholder:text-slate-500'

export function MarksCenter({
  marks,
  comments,
  students,
  classes,
  subjects,
  selectedClassId,
  teacherName,
  teacherUid,
  canManage,
  allowCommenting,
  saving,
  onSubmitMark,
  onAddComment,
  onOpenThread,
}: {
  marks: StudentMark[]
  comments: MarkComment[]
  students: Student[]
  classes: Classroom[]
  subjects: Array<{ id: string; name: string }>
  selectedClassId?: string
  teacherName: string
  teacherUid: string
  canManage: boolean
  allowCommenting?: boolean
  saving?: boolean
  onSubmitMark?: (mark: MarkDraft) => Promise<void>
  onAddComment?: (markId: string, message: string) => Promise<void>
  onOpenThread?: (subjectId: string) => void
}) {
  const [draft, setDraft] = useState<MarkDraft>({
    class_id: selectedClassId || classes[0]?.id || '',
    student_id: '',
    student_name: '',
    subject_id: subjects[0]?.id || '',
    subject_name: subjects[0]?.name || '',
    teacher_user_id: teacherUid,
    teacher_name: teacherName,
    score: 0,
    max_score: 100,
    term: 'Term 1',
    academic_year: '2026',
    comment: '',
  })
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})

  const filteredMarks = useMemo(
    () => (selectedClassId ? marks.filter((item) => item.class_id === selectedClassId) : marks),
    [marks, selectedClassId]
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!onSubmitMark || !draft.class_id || !draft.student_id || !draft.subject_id) return
    const student = students.find((item) => item.id === draft.student_id)
    const subject = subjects.find((item) => item.id === draft.subject_id)
    await onSubmitMark({
      ...draft,
      student_name: student ? `${student.first_name} ${student.last_name}` : draft.student_name,
      subject_name: subject?.name || draft.subject_name,
      comment: draft.comment?.trim() || undefined,
    })
    setDraft((current) => ({ ...current, score: 0, comment: '' }))
  }

  return (
    <div className="space-y-5">
      {canManage ? (
        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">Marks and Performance</h3>
              <p className="text-sm text-slate-400">Enter marks by class, subject, and student. Existing subject marks update automatically.</p>
            </div>
            <Button type="submit" className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" disabled={saving}>
              {saving ? 'Saving...' : 'Save Mark'}
            </Button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Select value={draft.class_id} onValueChange={(value) => setDraft((current) => ({ ...current, class_id: value }))}>
              <SelectTrigger className={fieldClassName}>
                <SelectValue placeholder="Class" />
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
              value={draft.student_id}
              onValueChange={(value) => {
                const student = students.find((item) => item.id === value)
                setDraft((current) => ({
                  ...current,
                  student_id: value,
                  student_name: student ? `${student.first_name} ${student.last_name}` : current.student_name,
                }))
              }}
            >
              <SelectTrigger className={fieldClassName}>
                <SelectValue placeholder="Student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.first_name} {item.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={draft.subject_id}
              onValueChange={(value) => {
                const subject = subjects.find((item) => item.id === value)
                setDraft((current) => ({ ...current, subject_id: value, subject_name: subject?.name || current.subject_name }))
              }}
            >
              <SelectTrigger className={fieldClassName}>
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={draft.term} onChange={(event) => setDraft((current) => ({ ...current, term: event.target.value }))} className={fieldClassName} />
            <Input
              type="number"
              min="0"
              max={draft.max_score || 100}
              value={draft.score}
              onChange={(event) => setDraft((current) => ({ ...current, score: Number(event.target.value) || 0 }))}
              className={fieldClassName}
              placeholder="Score"
            />
            <Input
              type="number"
              min="1"
              value={draft.max_score}
              onChange={(event) => setDraft((current) => ({ ...current, max_score: Number(event.target.value) || 100 }))}
              className={fieldClassName}
              placeholder="Max score"
            />
            <Input
              value={draft.academic_year}
              onChange={(event) => setDraft((current) => ({ ...current, academic_year: event.target.value }))}
              className={fieldClassName}
              placeholder="Academic year"
            />
            <Textarea
              value={draft.comment}
              onChange={(event) => setDraft((current) => ({ ...current, comment: event.target.value }))}
              className="min-h-[44px] border-slate-700 bg-slate-950/80 text-slate-100 placeholder:text-slate-500 xl:col-span-4"
              placeholder="Teacher performance comment"
            />
          </div>
        </form>
      ) : null}

      <div className="space-y-4">
        {filteredMarks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-sm text-slate-400">
            No marks are available for this selection yet.
          </div>
        ) : null}
        {filteredMarks.map((mark) => {
          const markComments = comments.filter((item) => item.mark_id === mark.id)
          const percentage = Math.round((mark.score / Math.max(mark.max_score, 1)) * 100)
          return (
            <div key={mark.id} className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{mark.subject_name}</h3>
                    <Badge className="bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/15">{percentage}%</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    {mark.student_name} · {mark.teacher_name} · {mark.term}
                  </p>
                </div>
                {onOpenThread ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-700 bg-slate-900/80 text-slate-100 hover:bg-slate-800 hover:text-white"
                    onClick={() => onOpenThread(mark.subject_id)}
                  >
                    Message Teacher
                  </Button>
                ) : null}
              </div>
              <p className="mt-4 text-3xl font-bold text-white">
                {mark.score}
                <span className="ml-2 text-base font-medium text-slate-400">/ {mark.max_score}</span>
              </p>
              {mark.comment ? <p className="mt-3 text-sm leading-6 text-slate-200">{mark.comment}</p> : null}
              {markComments.length > 0 ? (
                <div className="mt-4 space-y-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                  {markComments.map((item) => (
                    <div key={item.id} className="text-sm text-slate-300">
                      <span className="font-medium text-white">{item.student_name}:</span> {item.message}
                    </div>
                  ))}
                </div>
              ) : null}
              {allowCommenting && onAddComment ? (
                <div className="mt-4 flex flex-col gap-3 md:flex-row">
                  <Textarea
                    value={commentDrafts[mark.id] || ''}
                    onChange={(event) => setCommentDrafts((current) => ({ ...current, [mark.id]: event.target.value }))}
                    placeholder="Respond to this mark or ask your teacher a follow-up question."
                    className="min-h-[44px] border-slate-700 bg-slate-950/80 text-slate-100 placeholder:text-slate-500"
                  />
                  <Button
                    type="button"
                    className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                    onClick={async () => {
                      const message = commentDrafts[mark.id]?.trim()
                      if (!message) return
                      await onAddComment(mark.id, message)
                      setCommentDrafts((current) => ({ ...current, [mark.id]: '' }))
                    }}
                  >
                    Add Comment
                  </Button>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
