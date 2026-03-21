import { useEffect } from 'react'

type SeoProps = {
  title: string
  description: string
  path?: string
  image?: string
}

const siteName = 'Nyagatare Secondary School'
const fallbackOrigin = 'https://www.nyagataress.edu.rw'

const ensureMeta = (selector: string, attributes: Record<string, string>) => {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null
  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value)
  })

  return element
}

const ensureCanonical = () => {
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }

  return link
}

export default function Seo({ title, description, path = '/', image = '/images/nss-logo.jpg' }: SeoProps) {
  useEffect(() => {
    const origin = window.location.origin || fallbackOrigin
    const canonicalUrl = new URL(path, origin).toString()
    const imageUrl = new URL(image, origin).toString()

    document.title = title

    ensureMeta('meta[name="description"]', { name: 'description', content: description })
    ensureMeta('meta[property="og:title"]', { property: 'og:title', content: title })
    ensureMeta('meta[property="og:description"]', { property: 'og:description', content: description })
    ensureMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl })
    ensureMeta('meta[property="og:image"]', { property: 'og:image', content: imageUrl })
    ensureMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title })
    ensureMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description })
    ensureMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: imageUrl })
    ensureMeta('meta[name="application-name"]', { name: 'application-name', content: siteName })

    const canonical = ensureCanonical()
    canonical.setAttribute('href', canonicalUrl)
  }, [description, image, path, title])

  return null
}
