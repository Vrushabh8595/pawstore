import { useParams, Link } from 'react-router-dom'

const content = {
  privacy: { title: 'Privacy Policy', body: 'We collect only the information needed to process and deliver your order — your name, contact details, address and order history. We never sell your data. Payment screenshots and UPI references are used solely to verify payments. This is placeholder demo copy.' },
  terms: { title: 'Terms & Conditions', body: 'By using AnimalVeda you agree to our ordering, pricing and delivery terms. Prices are inclusive of taxes. We reserve the right to cancel orders in case of stock or pricing errors. This is placeholder demo copy.' },
  refund: { title: 'Refund Policy', body: 'Unopened products can be returned within 7 days of delivery. For damaged or wrong items, contact us within 48 hours with photos and we will arrange a replacement or refund. Refunds are processed to the original payment method. This is placeholder demo copy.' },
  shipping: { title: 'Shipping Policy', body: 'We deliver across India in 2–5 business days. Free shipping on orders above ₹999, otherwise a flat ₹59 applies. COD is available with a small fee. Tracking details are shared once your order ships. This is placeholder demo copy.' },
  about: { title: 'About AnimalVeda', body: 'AnimalVeda supplies veterinary medicines, food, treats and care products for pets and farm animals across India. If you need a medicine or product that is not listed, use Request a product — send a photo and details and our team will source it for you.' },
  contact: { title: 'Contact Us', body: 'Questions about an order? Email hello@animalveda.in or call +91-00000-00000, Mon–Sat 10am–7pm. This is placeholder demo contact info.' },
}

export default function Policy() {
  const { slug } = useParams()
  const page = content[slug]
  if (!page) return <div className="container-x py-20 text-center text-ink-500">Page not found. <Link to="/" className="text-brand-600 font-semibold">Home</Link></div>
  return (
    <div className="container-x py-12 max-w-2xl">
      <h1 className="text-3xl font-extrabold">{page.title}</h1>
      <p className="text-ink-700 leading-relaxed mt-4">{page.body}</p>
      <Link to="/" className="inline-block mt-8 text-brand-600 font-semibold">← Back to home</Link>
    </div>
  )
}
