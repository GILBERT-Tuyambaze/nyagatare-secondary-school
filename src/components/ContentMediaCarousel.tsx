import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ImageIcon, Pause, Play, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContentMediaItem } from '@/types/database'

type ContentMediaCarouselProps = {
  items: ContentMediaItem[]
  title: string
}

const getGoogleDriveFileId = (value: string) => {
  const match = value.match(/\/d\/([a-zA-Z0-9_-]+)/) || value.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  return match?.[1] || ''
}

const getYouTubeEmbed = (value: string) => {
  const match =
    value.match(/youtu\.be\/([a-zA-Z0-9_-]+)/) ||
    value.match(/[?&]v=([a-zA-Z0-9_-]+)/) ||
    value.match(/embed\/([a-zA-Z0-9_-]+)/)
  return match?.[1] ? `https://www.youtube.com/embed/${match[1]}` : ''
}

const getRenderableUrl = (item: ContentMediaItem) => {
  if (item.source === 'google_drive') {
    const fileId = getGoogleDriveFileId(item.url)
    if (!fileId) return item.url
    return item.type === 'video'
      ? `https://drive.google.com/file/d/${fileId}/preview`
      : `https://drive.google.com/uc?export=view&id=${fileId}`
  }

  if (item.type === 'video') {
    const youtubeEmbed = getYouTubeEmbed(item.url)
    if (youtubeEmbed) return youtubeEmbed
  }

  return item.preview_url || item.url
}

const isIframeVideo = (item: ContentMediaItem, url: string) =>
  item.source === 'google_drive' || url.includes('youtube.com/embed/')

export default function ContentMediaCarousel({ items, title }: ContentMediaCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [progress, setProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const safeItems = useMemo(() => items.filter((item) => item.url), [items])
  const autoSlideDuration = 5000
  const neighboringIndexes = useMemo(() => {
    if (safeItems.length <= 1) return [0]

    const previousIndex = activeIndex === 0 ? safeItems.length - 1 : activeIndex - 1
    const nextIndex = activeIndex === safeItems.length - 1 ? 0 : activeIndex + 1
    return Array.from(new Set([previousIndex, activeIndex, nextIndex]))
  }, [activeIndex, safeItems.length])

  const goToPrevious = useCallback(() => {
    setActiveIndex((current) => (current === 0 ? safeItems.length - 1 : current - 1))
  }, [safeItems.length])

  const goToNext = useCallback(() => {
    setActiveIndex((current) => (current === safeItems.length - 1 ? 0 : current + 1))
  }, [safeItems.length])

  useEffect(() => {
    if (!safeItems.length) {
      setActiveIndex(0)
      return
    }

    setActiveIndex((current) => Math.min(current, safeItems.length - 1))
  }, [safeItems.length])

  const hasItems = safeItems.length > 0
  const activeItem = hasItems ? safeItems[Math.min(activeIndex, safeItems.length - 1)] : null
  const renderUrl = activeItem ? getRenderableUrl(activeItem) : ''
  const canAutoAdvance = safeItems.length > 1 && autoPlay && !isHovered && !isFocused

  useEffect(() => {
    setProgress(0)
  }, [activeIndex, autoPlay])

  useEffect(() => {
    if (!canAutoAdvance) return
    const timer = window.setInterval(() => {
      goToNext()
    }, autoSlideDuration)

    return () => window.clearInterval(timer)
  }, [autoSlideDuration, canAutoAdvance, goToNext])

  useEffect(() => {
    if (!canAutoAdvance) {
      setProgress(0)
      return
    }

    const start = Date.now()
    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - start
      const nextProgress = Math.min(100, (elapsed / autoSlideDuration) * 100)
      setProgress(nextProgress)
    }, 100)

    return () => window.clearInterval(progressTimer)
  }, [activeIndex, autoSlideDuration, canAutoAdvance])

  if (!activeItem) return null

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      goToPrevious()
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      goToNext()
    } else if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault()
      setAutoPlay((current) => !current)
    } else if (event.key.toLowerCase() === 'home') {
      event.preventDefault()
      setActiveIndex(0)
    } else if (event.key.toLowerCase() === 'end') {
      event.preventDefault()
      setActiveIndex(safeItems.length - 1)
    }
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 text-white shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      aria-label={`${title} media carousel`}
    >
      <div className="relative">
        <div className="aspect-[16/9] max-h-[420px] w-full overflow-hidden bg-slate-950">
          {activeItem.type === 'video' ? (
            isIframeVideo(activeItem, renderUrl) ? (
              <iframe
                src={renderUrl}
                title={activeItem.title || `${title} media`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={renderUrl} controls className="h-full w-full object-cover" preload="metadata" />
            )
          ) : (
            <img src={renderUrl} alt={activeItem.title || title} className="h-full w-full object-cover" />
          )}
        </div>

        {safeItems.length > 1 ? (
          <>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="absolute left-4 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full border-white/20 bg-slate-950/70 text-white hover:bg-slate-900"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="absolute right-4 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full border-white/20 bg-slate-950/70 text-white hover:bg-slate-900"
              onClick={goToNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="absolute bottom-4 right-4 rounded-full border-white/20 bg-slate-950/70 text-white hover:bg-slate-900"
              onClick={() => setAutoPlay((current) => !current)}
            >
              {autoPlay ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {autoPlay ? 'Pause' : 'Play'}
            </Button>
          </>
        ) : null}
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Media Gallery</p>
            <h3 className="mt-1 text-base font-semibold text-white">{activeItem.title || title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs text-slate-300">
              {activeIndex + 1} / {safeItems.length}
            </div>
            <div className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs text-slate-300">
              {autoPlay ? 'Auto sliding on' : 'Auto sliding off'}
            </div>
          </div>
        </div>

        {safeItems.length > 1 ? (
          <div className="space-y-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-cyan-300 transition-[width] duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {safeItems.map((item, index) => (
                <button
                  key={`${item.id}-dot`}
                  type="button"
                  aria-label={`Open slide ${index + 1}`}
                  aria-current={index === activeIndex ? 'true' : undefined}
                  title={item.title || `Slide ${index + 1}`}
                  onClick={() => setActiveIndex(index)}
                  className={`h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${index === activeIndex ? 'w-8 bg-cyan-300' : 'w-2.5 bg-slate-600 hover:bg-slate-400'}`}
                />
              ))}
            </div>
          </div>
        ) : null}

        {safeItems.length > 1 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {neighboringIndexes.map((index) => {
              const item = safeItems[index]
              const itemUrl = getRenderableUrl(item)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`group overflow-hidden rounded-2xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${index === activeIndex ? 'border-cyan-300 bg-slate-900' : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'}`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                    {item.type === 'image' ? (
                      <img src={itemUrl} alt={item.title || `${title} preview ${index + 1}`} className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_100%)] text-white">
                        <PlayCircle className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 text-left text-xs text-slate-300">
                    {item.type === 'image' ? <ImageIcon className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
                    <span className="line-clamp-1">
                      {index === activeIndex ? 'Current' : index < activeIndex || (activeIndex === 0 && index === safeItems.length - 1) ? 'Previous' : 'Next'}:
                      {' '}
                      {item.title || `${item.type === 'image' ? 'Image' : 'Video'} ${index + 1}`}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}
