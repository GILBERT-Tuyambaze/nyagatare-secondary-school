import { DragEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Film, GripVertical, ImageIcon, Link2, Loader2, Plus, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ContentMediaItem, ContentPost } from '@/types/database'
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

const createMediaId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const withProtocol = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

const isGoogleDriveLink = (value: string) => /drive\.google\.com/i.test(value)

const getGoogleDriveFileId = (value: string) => {
  const match = value.match(/\/d\/([a-zA-Z0-9_-]+)/) || value.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  return match?.[1] || ''
}

const createDrivePreviewUrl = (value: string, type: ContentMediaItem['type']) => {
  const fileId = getGoogleDriveFileId(value)
  if (!fileId) return value
  return type === 'video'
    ? `https://drive.google.com/file/d/${fileId}/preview`
    : `https://drive.google.com/uc?export=view&id=${fileId}`
}

const getMediaPreview = (item: ContentMediaItem) => {
  if (item.source === 'google_drive') {
    return createDrivePreviewUrl(item.url, item.type)
  }
  return item.preview_url || item.url
}

const getFeaturedImage = (manualValue: string, gallery: ContentMediaItem[]) => {
  if (manualValue.trim()) return manualValue.trim()
  const firstImage = gallery.find((item) => item.type === 'image')
  return firstImage ? getMediaPreview(firstImage) : ''
}

export function ContentPostForm({ open, onOpenChange, post, authorName, onSuccess }: ContentPostFormProps) {
  const buildInitialState = useCallback(() => ({
    title: post?.title || '',
    slug: post?.slug || '',
    type: post?.type || ('news' as ContentPost['type']),
    status: post?.status || ('draft' as ContentPost['status']),
    excerpt: post?.excerpt || '',
    body: post?.body || '',
    featured_image: post?.featured_image || '',
    media_gallery: post?.media_gallery || ([] as ContentMediaItem[]),
  }), [post])

  const [formData, setFormData] = useState(buildInitialState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mediaLabel, setMediaLabel] = useState('')
  const [mediaLink, setMediaLink] = useState('')
  const [mediaType, setMediaType] = useState<ContentMediaItem['type']>('image')
  const [mediaSource, setMediaSource] = useState<'link' | 'google_drive'>('link')
  const [draggingMediaId, setDraggingMediaId] = useState('')

  useEffect(() => {
    if (open) {
      setFormData(buildInitialState())
      setError('')
      setMediaLabel('')
      setMediaLink('')
      setMediaType('image')
      setMediaSource('link')
    }
  }, [buildInitialState, open])

  const mediaItems = useMemo(() => formData.media_gallery || [], [formData.media_gallery])

  const addMediaLink = () => {
    const normalizedUrl = withProtocol(mediaLink)
    if (!normalizedUrl) {
      setError('Add a valid image or video link before saving it to the gallery.')
      return
    }

    const resolvedSource: ContentMediaItem['source'] = isGoogleDriveLink(normalizedUrl) ? 'google_drive' : mediaSource
    const item: ContentMediaItem = {
      id: createMediaId(),
      type: mediaType,
      source: resolvedSource,
      url: normalizedUrl,
      preview_url: resolvedSource === 'google_drive' ? createDrivePreviewUrl(normalizedUrl, mediaType) : normalizedUrl,
      title: mediaLabel.trim() || undefined,
    }

    setFormData((current) => ({
      ...current,
      media_gallery: [...(current.media_gallery || []), item],
    }))
    setMediaLink('')
    setMediaLabel('')
    setError('')
  }

  const removeMediaItem = (id: string) => {
    setFormData((current) => ({
      ...current,
      media_gallery: (current.media_gallery || []).filter((item) => item.id !== id),
    }))
  }

  const moveMediaItem = (id: string, direction: 'up' | 'down') => {
    setFormData((current) => {
      const items = [...(current.media_gallery || [])]
      const index = items.findIndex((item) => item.id === id)
      if (index === -1) return current

      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= items.length) return current

      const [item] = items.splice(index, 1)
      items.splice(targetIndex, 0, item)
      return {
        ...current,
        media_gallery: items,
      }
    })
  }

  const reorderMediaItems = (fromId: string, toId: string) => {
    if (!fromId || fromId === toId) return

    setFormData((current) => {
      const items = [...(current.media_gallery || [])]
      const fromIndex = items.findIndex((item) => item.id === fromId)
      const toIndex = items.findIndex((item) => item.id === toId)
      if (fromIndex === -1 || toIndex === -1) return current

      const [item] = items.splice(fromIndex, 1)
      items.splice(toIndex, 0, item)
      return {
        ...current,
        media_gallery: items,
      }
    })
  }

  const handleDragStart = (id: string) => {
    setDraggingMediaId(id)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleDrop = (targetId: string) => {
    reorderMediaItems(draggingMediaId, targetId)
    setDraggingMediaId('')
  }

  const handleDragEnter = (targetId: string) => {
    if (!draggingMediaId || draggingMediaId === targetId) return
    reorderMediaItems(draggingMediaId, targetId)
  }

  const updateMediaCaption = (id: string, title: string) => {
    setFormData((current) => ({
      ...current,
      media_gallery: (current.media_gallery || []).map((item) =>
        item.id === id ? { ...item, title } : item
      ),
    }))
  }

  const setAsCover = (item: ContentMediaItem) => {
    const preview = getMediaPreview(item)
    setFormData((current) => ({
      ...current,
      featured_image: item.type === 'image' ? preview : current.featured_image,
      media_gallery: [
        item,
        ...(current.media_gallery || []).filter((entry) => entry.id !== item.id),
      ],
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const media_gallery = formData.media_gallery || []
    const payload = {
      ...formData,
      media_gallery,
      featured_image: getFeaturedImage(formData.featured_image, media_gallery) || undefined,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-800 bg-slate-950 text-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{post ? 'Edit Content Entry' : 'Create Content Entry'}</DialogTitle>
          <DialogDescription className="text-slate-300">
            Manage news, blog stories, announcements, and richer image or video galleries from one publishing workflow.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
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
            <Label htmlFor="content-image">Featured Image URL Override</Label>
            <Input
              id="content-image"
              value={formData.featured_image}
              onChange={(e) => setFormData((current) => ({ ...current, featured_image: e.target.value }))}
              className="border-slate-700 bg-slate-900 text-slate-100"
              placeholder="Optional. Leave empty to use the first gallery image automatically."
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

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-white">Blog Media Gallery</p>
                <p className="mt-1 text-sm text-slate-400">Add multiple images or videos by direct link or Google Drive link. This keeps the publishing flow free from paid file storage.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_160px_180px]">
              <Input
                value={mediaLabel}
                onChange={(e) => setMediaLabel(e.target.value)}
                placeholder="Media title or caption"
                className="border-slate-700 bg-slate-950 text-slate-100"
              />
              <Select value={mediaType} onValueChange={(value: ContentMediaItem['type']) => setMediaType(value)}>
                <SelectTrigger className="border-slate-700 bg-slate-950 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-950 text-slate-100">
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
              <Select value={mediaSource} onValueChange={(value: 'link' | 'google_drive') => setMediaSource(value)}>
                <SelectTrigger className="border-slate-700 bg-slate-950 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-950 text-slate-100">
                  <SelectItem value="link">Direct Link</SelectItem>
                  <SelectItem value="google_drive">Google Drive Link</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-3 flex flex-col gap-3 md:flex-row">
              <Input
                value={mediaLink}
                onChange={(e) => setMediaLink(e.target.value)}
                placeholder={mediaSource === 'google_drive' ? 'Paste a Google Drive file link' : 'Paste an image or video URL'}
                className="border-slate-700 bg-slate-950 text-slate-100"
              />
              <Button type="button" className="bg-white text-slate-950 hover:bg-slate-200" onClick={addMediaLink}>
                <Plus className="mr-2 h-4 w-4" />
                Add Link
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {mediaItems.length ? (
                mediaItems.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item.id)}
                    onDragOver={handleDragOver}
                    onDragEnter={() => handleDragEnter(item.id)}
                    onDrop={() => handleDrop(item.id)}
                    onDragEnd={() => setDraggingMediaId('')}
                    className={`flex flex-col gap-3 rounded-2xl border bg-slate-950/80 p-3 md:flex-row md:items-center md:justify-between ${draggingMediaId === item.id ? 'border-cyan-300/70' : 'border-slate-800'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 cursor-grab items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 text-slate-400 active:cursor-grabbing">
                        <GripVertical className="h-5 w-5" />
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-cyan-200">
                        {item.type === 'image' ? <ImageIcon className="h-5 w-5" /> : <Film className="h-5 w-5" />}
                      </div>
                      <div className="h-16 w-24 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                        {item.type === 'image' ? (
                          <img src={getMediaPreview(item)} alt={item.title || `Gallery item ${index + 1}`} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_100%)] text-white">
                            <Film className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white">{item.title || item.file_name || `${item.type === 'image' ? 'Image' : 'Video'} ${index + 1}`}</p>
                        <p className="text-xs text-slate-400">{item.source === 'google_drive' ? 'Google Drive' : 'External link'}</p>
                        <p className="mt-1 max-w-xl truncate text-xs text-slate-500">{item.url}</p>
                        <Input
                          value={item.title || ''}
                          onChange={(event) => updateMediaCaption(item.id, event.target.value)}
                          placeholder="Caption / slide title"
                          className="mt-2 border-slate-700 bg-slate-900 text-slate-100"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20"
                        onClick={() => setAsCover(item)}
                      >
                        Set as Cover
                      </Button>
                      <Button type="button" variant="outline" className="border-slate-700 bg-slate-950/70 text-slate-100 hover:bg-slate-800" onClick={() => moveMediaItem(item.id, 'up')} disabled={index === 0}>
                        <ArrowUp className="mr-2 h-4 w-4" />
                        Up
                      </Button>
                      <Button type="button" variant="outline" className="border-slate-700 bg-slate-950/70 text-slate-100 hover:bg-slate-800" onClick={() => moveMediaItem(item.id, 'down')} disabled={index === mediaItems.length - 1}>
                        <ArrowDown className="mr-2 h-4 w-4" />
                        Down
                      </Button>
                      <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800">
                        <Link2 className="mr-2 h-4 w-4" />
                        Open
                      </a>
                      <Button type="button" variant="outline" className="border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20" onClick={() => removeMediaItem(item.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No gallery media added yet. Add direct links or Google Drive links to build a sliding media section on the public blog page.</p>
              )}
            </div>
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
