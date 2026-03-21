import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ContentPost } from '@/types/database'
import { createContentPost, updateContentPost } from '@/services/firestoreService'

type ContentPostFormProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  post?: ContentPost | null
  authorName: string
  onSuccess: () => void
}

const createSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export function ContentPostForm({ open, onOpenChange, post, authorName, onSuccess }: ContentPostFormProps) {
  const buildInitialState = () => ({
    title: post?.title || '',
    slug: post?.slug || '',
    type: post?.type || ('news' as ContentPost['type']),
    status: post?.status || ('draft' as ContentPost['status']),
    excerpt: post?.excerpt || '',
    body: post?.body || '',
    featured_image: post?.featured_image || '',
  })

  const [formData, setFormData] = useState(buildInitialState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setFormData(buildInitialState())
      setError('')
    }
  }, [open, post])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      ...formData,
      slug: formData.slug || createSlug(formData.title),
      author_name: post?.author_name || authorName,
      published_at: formData.status === 'published' ? post?.published_at || new Date().toISOString() : undefined,
    }

    try {
      if (post) {
        await updateContentPost(post.id, payload)
      } else {
        await createContentPost(payload)
      }
      onSuccess()
      onOpenChange(false)
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Failed to save content entry.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-800 bg-slate-950 text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{post ? 'Edit Content Entry' : 'Create Content Entry'}</DialogTitle>
          <DialogDescription className="text-slate-300">
            Manage news, blog stories, and school announcements in one publishing workflow.
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
              <Label htmlFor="content-title">Title</Label>
              <Input
                id="content-title"
                value={formData.title}
                onChange={(e) => setFormData((current) => ({ ...current, title: e.target.value, slug: current.slug || createSlug(e.target.value) }))}
                className="border-slate-700 bg-slate-900 text-slate-100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content-slug">Slug</Label>
              <Input
                id="content-slug"
                value={formData.slug}
                onChange={(e) => setFormData((current) => ({ ...current, slug: createSlug(e.target.value) }))}
                className="border-slate-700 bg-slate-900 text-slate-100"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(value: ContentPost['type']) => setFormData((current) => ({ ...current, type: value }))}>
                <SelectTrigger className="border-slate-700 bg-slate-900 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-950 text-slate-100">
                  <SelectItem value="news">News</SelectItem>
                  <SelectItem value="blog">Blog</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value: ContentPost['status']) => setFormData((current) => ({ ...current, status: value }))}>
                <SelectTrigger className="border-slate-700 bg-slate-900 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-950 text-slate-100">
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content-image">Featured Image URL</Label>
            <Input
              id="content-image"
              value={formData.featured_image}
              onChange={(e) => setFormData((current) => ({ ...current, featured_image: e.target.value }))}
              className="border-slate-700 bg-slate-900 text-slate-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content-excerpt">Excerpt</Label>
            <Textarea
              id="content-excerpt"
              value={formData.excerpt}
              onChange={(e) => setFormData((current) => ({ ...current, excerpt: e.target.value }))}
              className="min-h-[90px] border-slate-700 bg-slate-900 text-slate-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content-body">Body</Label>
            <Textarea
              id="content-body"
              value={formData.body}
              onChange={(e) => setFormData((current) => ({ ...current, body: e.target.value }))}
              className="min-h-[220px] border-slate-700 bg-slate-900 text-slate-100"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" className="border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {post ? 'Save Changes' : 'Create Entry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
