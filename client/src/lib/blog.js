import { SITE_NAME } from './seo'

export const BLOG_CATEGORIES = [
  ['dog-care', 'Dog care'], ['cat-care', 'Cat care'], ['nutrition', 'Nutrition & food'], ['health', 'Health & medicines'],
  ['grooming', 'Grooming'], ['training', 'Training & behaviour'], ['livestock', 'Cattle & livestock'], ['news', 'AnimalVeda news'],
]
export const categoryName = (slug) => BLOG_CATEGORIES.find(([s]) => s === slug)?.[1] || ''
export const blogDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '')
export const brand = (t) => (t.includes(SITE_NAME) ? t : `${t} | ${SITE_NAME} Blog`)

// Shrinks a picked image to ≤ maxW px and re-encodes it as WebP (JPEG fallback)
export function compressImage(file, maxW = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error('Choose a JPG, PNG or WebP picture.'))
    if (file.size > 15 * 1024 * 1024) return reject(new Error('That picture is over 15 MB. Choose a smaller one.'))
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxW / img.naturalWidth)
      const c = document.createElement('canvas')
      c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      let out = c.toDataURL('image/webp', quality)
      if (!out.startsWith('data:image/webp')) out = c.toDataURL('image/jpeg', quality)
      for (let q = quality - 0.1; out.length > 900_000 && q > 0.4; q -= 0.1) out = c.toDataURL('image/jpeg', q)
      resolve(out)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Couldn’t read that picture.')) }
    img.src = url
  })
}
