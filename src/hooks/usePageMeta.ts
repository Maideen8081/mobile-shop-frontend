import { useEffect } from 'react'

const SITE = 'PhoneFix'
const DEFAULT_DESCRIPTION =
  'Buy smartphones and accessories, book expert phone repairs and trade in your old device at PhoneFix.'

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export interface PageMeta {
  /** Page name; " | PhoneFix" is appended. */
  title?: string
  description?: string
  image?: string
  noindex?: boolean
}

/** Per-page <title>, meta description and Open Graph / Twitter tags. */
export function usePageMeta({ title, description, image, noindex }: PageMeta) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE}` : `${SITE} — Phones, Accessories & Repairs`
    const desc = (description || DEFAULT_DESCRIPTION).replace(/\s+/g, ' ').trim().slice(0, 160)
    document.title = fullTitle
    setMeta('name', 'description', desc)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', desc)
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:url', window.location.href)
    setMeta('property', 'og:site_name', SITE)
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary')
    if (image) setMeta('property', 'og:image', image)
    setMeta('name', 'robots', noindex ? 'noindex' : 'index,follow')
  }, [title, description, image, noindex])
}
