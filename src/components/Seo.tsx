import { useEffect } from 'react'

type SeoProps = {
  title: string
  description: string
  path?: string
  image?: string
  keywords?: string[]
  robots?: string
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>
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

const ensureJsonLdScript = () => {
  let script = document.head.querySelector('script[data-seo-structured="true"]') as HTMLScriptElement | null
  if (!script) {
    script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute('data-seo-structured', 'true')
    document.head.appendChild(script)
  }
  return script
}

export default function Seo({
  title,
  description,
  path = '/',
  image = '/images/nss-logo.jpg',
  keywords = [],
  robots = 'index,follow',
  structuredData,
}: SeoProps) {
  useEffect(() => {
    const origin = window.location.origin || fallbackOrigin
    const canonicalUrl = new URL(path, origin).toString()
    const imageUrl = new URL(image, origin).toString()
    const mergedKeywords = Array.from(
      new Set([
        'Nyagatare Secondary School',
        'secondary school in Rwanda',
        'Nyagatare District school',
        'Rwanda STEM school',
        ...keywords,
      ])
    )

    document.title = title

    ensureMeta('meta[name="description"]', { name: 'description', content: description })
    ensureMeta('meta[name="keywords"]', { name: 'keywords', content: mergedKeywords.join(', ') })
    ensureMeta('meta[name="robots"]', { name: 'robots', content: robots })
    ensureMeta('meta[property="og:title"]', { property: 'og:title', content: title })
    ensureMeta('meta[property="og:description"]', { property: 'og:description', content: description })
    ensureMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl })
    ensureMeta('meta[property="og:image"]', { property: 'og:image', content: imageUrl })
    ensureMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
    ensureMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: siteName })
    ensureMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title })
    ensureMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description })
    ensureMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: imageUrl })
    ensureMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
    ensureMeta('meta[name="application-name"]', { name: 'application-name', content: siteName })

    const canonical = ensureCanonical()
    canonical.setAttribute('href', canonicalUrl)

    const script = ensureJsonLdScript()
    if (structuredData) {
      script.textContent = JSON.stringify(structuredData)
    } else {
      script.textContent = ''
    }
  }, [description, image, keywords, path, robots, structuredData, title])

  return null
}
