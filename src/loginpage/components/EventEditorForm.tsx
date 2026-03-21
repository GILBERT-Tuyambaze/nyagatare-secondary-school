import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createEvent, updateEvent } from '@/services/firestoreService'
import { Event } from '@/types/database'

type EventEditorFormProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventItem?: Event | null
  authorName: string
  onSuccess: () => void
}

export function EventEditorForm({ open, onOpenChange, eventItem, authorName, onSuccess }: EventEditorFormProps) {
  const buildInitialState = () => ({
    title: eventItem?.title || '',
    description: eventItem?.description || '',
    event_date: eventItem?.event_date ? String(eventItem.event_date).slice(0, 10) : '',
    start_time: eventItem?.start_time || '',
    end_time: eventItem?.end_time || '',
    location: eventItem?.location || '',
    category: eventItem?.category || ('academic' as Event['category']),
    max_attendees: eventItem?.max_attendees || 0,
    current_attendees: eventItem?.current_attendees || 0,
    status: eventItem?.status || ('upcoming' as Event['status']),
    image_url: eventItem?.image_url || '',
  })

  const [formData, setFormData] = useState(buildInitialState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setFormData(buildInitialState())
      setError('')
    }
  }, [eventItem, open])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      ...formData,
      created_by: eventItem?.created_by || authorName,
      max_attendees: formData.max_attendees || undefined,
    }

    try {
      if (eventItem) {
        await updateEvent(eventItem.id, payload)
      } else {
        await createEvent(payload)
      }
      onSuccess()
      onOpenChange(false)
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Failed to save event.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-800 bg-slate-950 text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{eventItem ? 'Edit Event' : 'Create Event'}</DialogTitle>
          <DialogDescription className="text-slate-300">
            Keep the public school calendar and internal content desk aligned.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="event-title">Title</Label>
              <Input id="event-title" value={formData.title} onChange={(e) => setFormData((current) => ({ ...current, title: e.target.value }))} className="border-slate-700 bg-slate-900 text-slate-100" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-location">Location</Label>
              <Input id="event-location" value={formData.location} onChange={(e) => setFormData((current) => ({ ...current, location: e.target.value }))} className="border-slate-700 bg-slate-900 text-slate-100" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-description">Description</Label>
            <Textarea id="event-description" value={formData.description} onChange={(e) => setFormData((current) => ({ ...current, description: e.target.value }))} className="min-h-[110px] border-slate-700 bg-slate-900 text-slate-100" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="event-date">Event Date</Label>
              <Input id="event-date" type="date" value={formData.event_date} onChange={(e) => setFormData((current) => ({ ...current, event_date: e.target.value }))} className="border-slate-700 bg-slate-900 text-slate-100" required />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value: Event['status']) => setFormData((current) => ({ ...current, status: value }))}>
                <SelectTrigger className="border-slate-700 bg-slate-900 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-950 text-slate-100">
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input id="start-time" type="time" value={formData.start_time} onChange={(e) => setFormData((current) => ({ ...current, start_time: e.target.value }))} className="border-slate-700 bg-slate-900 text-slate-100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input id="end-time" type="time" value={formData.end_time} onChange={(e) => setFormData((current) => ({ ...current, end_time: e.target.value }))} className="border-slate-700 bg-slate-900 text-slate-100" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value: Event['category']) => setFormData((current) => ({ ...current, category: value }))}>
                <SelectTrigger className="border-slate-700 bg-slate-900 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-950 text-slate-100">
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="cultural">Cultural</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="ceremony">Ceremony</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-attendees">Max Attendees</Label>
              <Input id="max-attendees" type="number" min="0" value={formData.max_attendees} onChange={(e) => setFormData((current) => ({ ...current, max_attendees: Number(e.target.value) || 0 }))} className="border-slate-700 bg-slate-900 text-slate-100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current-attendees">Current Attendees</Label>
              <Input id="current-attendees" type="number" min="0" value={formData.current_attendees} onChange={(e) => setFormData((current) => ({ ...current, current_attendees: Number(e.target.value) || 0 }))} className="border-slate-700 bg-slate-900 text-slate-100" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-image">Image URL</Label>
            <Input id="event-image" value={formData.image_url} onChange={(e) => setFormData((current) => ({ ...current, image_url: e.target.value }))} className="border-slate-700 bg-slate-900 text-slate-100" />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" className="border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {eventItem ? 'Save Event' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
