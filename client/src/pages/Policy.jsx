import { Link } from 'react-router-dom'

// Store policies. Plain data so they are easy to update; rendered below.
// Lines starting with "- " become bullet points.
const UPDATED = '29 November 2026'
const EMAIL = 'care@animalveda.com'
const PHONES = '+91 7620377278 / +91 8982826363'

const content = {
  'privacy-policy': {
    title: 'Privacy Policy',
    intro: `This policy explains what personal data AnimalVeda (“we”, “us”) collects when you use animalveda.com and our services, why we collect it, who we share it with and the choices you have. We follow India’s Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000 and its rules. By using the website you agree to this policy.`,
    sections: [
      ['1. What we collect', [
        'We only collect what we need to run the store:',
        '- Account details: your name, email address and mobile number. If you sign in with Google, we receive your name, email and profile photo from Google through our sign-in provider (Clerk).',
        '- Profile photo: a photo you upload, or your Google profile photo. You can remove it at any time from My profile.',
        '- Delivery addresses: the addresses you save or enter at checkout (receiver’s name, phone, address, landmark, city, state and pincode).',
        '- Orders and payments: what you order, prices, order status and, for UPI payments, the 12-digit UPI reference (UTR) and any payment screenshot link you share. We never see or store your card details, UPI PIN or bank passwords.',
        '- Product requests: photos of medicine labels or prescriptions and the details you send when you ask us to source a product, with your name, phone, city and pincode.',
        '- Reviews: ratings and reviews you write, shown with your first name.',
        '- Location (only if you choose it): when you tap “Use my current location”, your browser shares your location once so we can fill in your address. It is sent to OpenStreetMap (Nominatim) or BigDataCloud to look up the address and is not stored by us apart from the address you save.',
        '- Usage data: pages you visit, the website that sent you, device type (mobile, tablet or desktop) and a random visitor ID kept in your browser. We use this only to understand how the store is used. Page-view records are deleted automatically after 120 days.',
        '- Blog authors: if you write for our blog, we keep your name, email and login details to manage your author account. Articles are published under the AnimalVeda name, and your details are not shown on the website.',
      ]],
      ['2. Why we use it', [
        '- To create and secure your account, and keep you signed in.',
        '- To process, deliver, track and support your orders, including calls or messages from us or the courier about delivery.',
        '- To verify payments and prevent fraud and misuse (for example, blocking accounts that abuse cash on delivery).',
        '- To source products you request and call you back with a price.',
        '- To send order updates by email and in-app notifications. We send marketing messages only if you agree, and you can stop them at any time.',
        '- To improve the website, fix problems and understand which pages are useful.',
        '- To meet legal, tax and accounting duties.',
      ]],
      ['3. Who we share it with', [
        'We never sell your personal data. We share only what is needed with:',
        '- Courier and delivery partners: your name, phone number and delivery address.',
        '- Service providers that run the website for us: Vercel (website hosting), Render (application servers), MongoDB Atlas (database, hosted in Mumbai, India), Clerk (Google sign-in), and our email delivery provider. They may process data only on our instructions.',
        '- Address lookup services: India Post’s pincode directory, OpenStreetMap and BigDataCloud, which receive a pincode or location to return a city and address.',
        '- Government or law-enforcement authorities when required by law.',
      ]],
      ['4. Cookies, local storage and advertising', [
        '- We use your browser’s local storage and a secure login cookie to keep you signed in and to remember your cart, wishlist and settings.',
        '- We measure visits with our own first-party analytics. We do not use third-party advertising cookies on the website today.',
        '- If we run ads on Google, Meta or other platforms in future, those platforms may use cookies or similar technology to measure ad results and show you relevant ads. We will update this policy before adding them, and you can control ad personalisation at adssettings.google.com and in your social media account settings.',
        '- You can clear cookies and local storage in your browser settings at any time. Some features, like staying signed in, will stop working.',
      ]],
      ['5. How long we keep it', [
        '- Account and profile data: until you ask us to delete your account.',
        '- Orders, invoices and payment references: for up to 8 years, as required by Indian tax and accounting laws.',
        '- Product request photos: until the request is closed, and then for up to 12 months.',
        '- Page-view analytics: 120 days. In-app notifications: 90 days.',
      ]],
      ['6. How we protect it', [
        '- All traffic to the website and our servers is encrypted with HTTPS (TLS).',
        '- Our database encrypts stored data (AES-256 encryption at rest) and accepts only encrypted connections.',
        '- Passwords are stored only as secure one-way hashes (bcrypt), never in plain text.',
        '- Admin and author areas are protected by role checks on our servers, and we limit repeated or automated requests to block abuse.',
        'No system is 100% secure. If a breach affects your data, we will inform you and the Data Protection Board of India as the law requires.',
      ]],
      ['7. Your rights and choices', [
        'You can:',
        '- See and update your name, phone, email, photo and addresses at any time in My profile.',
        '- Ask for a summary of the personal data we hold about you.',
        '- Ask us to correct or delete your data, or delete your account. We may keep order records that the law requires us to keep.',
        '- Withdraw your consent (for example, to marketing messages) at any time.',
        '- Nominate a person to use these rights for you in case of death or incapacity.',
        `To use any of these rights, email ${EMAIL} or call ${PHONES}. We reply within 30 days.`,
      ]],
      ['8. Children', [
        'Our store is meant for adults. If you are under 18, please use it with a parent or guardian, who must agree to this policy for you. We do not knowingly collect data from children without such consent.',
      ]],
      ['9. Grievance Officer', [
        'If you have a complaint about how we handle your data, contact our Grievance Officer:',
        `- Name: Vrushabh Gulhane, Grievance Officer, AnimalVeda`,
        `- Email: ${EMAIL}`,
        `- Phone: ${PHONES} (all 7 days)`,
        'We acknowledge complaints within 24 hours and resolve them within 15 days. If you are not satisfied, you may contact the Data Protection Board of India.',
      ]],
      ['10. Changes to this policy', [
        'We may update this policy when our services or the law change. The date at the top shows the latest version. Important changes will be shown on the website.',
      ]],
    ],
  },
  'terms-and-conditions': {
    title: 'Terms & Conditions',
    intro: 'These terms apply when you browse animalveda.com, create an account or buy from AnimalVeda. Please read them with our Privacy, Shipping and Refund policies.',
    sections: [
      ['1. Who we are', ['AnimalVeda sells veterinary medicines, food, treats and care products for pets and farm animals across India, and helps customers source products that are not listed on the website.']],
      ['2. Your account', [
        '- Give correct details and keep your password private. You are responsible for activity on your account.',
        '- We may suspend or block accounts that give false details, misuse cash on delivery, abuse offers or harm other users.',
      ]],
      ['3. Medicines and prescriptions', [
        '- Prescription veterinary medicines are supplied only against a valid prescription from a registered veterinarian. We may ask you to share it before we dispatch, and we may cancel the order if it is not provided.',
        '- Product information on the website is general guidance, not veterinary advice. Always follow your veterinarian’s advice and the product label for doses.',
        '- Medicines are for animal use only.',
      ]],
      ['4. Prices, orders and payment', [
        '- Prices are in Indian rupees and include applicable taxes. Delivery and cash-on-delivery fees are shown at checkout before you pay.',
        '- An order is confirmed when we accept it and, for UPI payments, verify your payment. We may cancel an order if a product is out of stock, a price is shown wrongly or a payment cannot be verified, and we refund any amount paid in full.',
        '- You can pay by UPI or cash on delivery (where available).',
      ]],
      ['5. Delivery, returns and refunds', ['Delivery is covered by our Shipping Policy, and returns and refunds by our Refund Policy.']],
      ['6. Reviews, requests and blog content', [
        '- Reviews and photos you send must be honest, your own and lawful. We may moderate or remove content.',
        '- Blog articles are for general information only and are not a substitute for professional veterinary advice.',
      ]],
      ['7. Intellectual property', [
        '- The AnimalVeda name, logo, website design, text and our own photos belong to AnimalVeda and may not be copied without permission.',
        '- Product names, brand logos and product images belong to their respective manufacturers and are used only to identify the products we sell.',
        `- If you believe any content on the website infringes your copyright or trademark, email ${EMAIL} with details and we will review and remove it promptly.`,
      ]],
      ['8. Limitation of liability', ['To the extent allowed by law, our total liability for any order is limited to the amount you paid for that order. We are not liable for indirect losses, or for delays caused by events outside our control.']],
      ['9. Governing law', ['These terms are governed by the laws of India. Courts at the place of AnimalVeda’s registered office in India have jurisdiction over any dispute.']],
      ['10. Contact', [`Email ${EMAIL} or call ${PHONES}. We are open all 7 days.`]],
    ],
  },
  'refund-policy': {
    title: 'Refund & Return Policy',
    intro: 'We want you and your animal to be happy with every order. Here is how returns, replacements and refunds work.',
    sections: [
      ['1. Damaged, wrong or expired items', [
        '- Tell us within 48 hours of delivery, with photos of the product and the outer box.',
        '- We will send a replacement or give you a full refund, including any delivery fee. You don’t pay for the return.',
      ]],
      ['2. Returns for other reasons', [
        '- You can return most products within 7 days of delivery if they are unused, unopened and in their original packaging.',
        '- For safety reasons we cannot accept returns of opened medicines, opened food or treats, or temperature-sensitive products (such as vaccines) unless they arrived damaged or wrong.',
        '- Products sourced specially for you through “Request a medicine” can be returned only if they are damaged or wrong.',
      ]],
      ['3. How to request a return', [`Call ${PHONES} or email ${EMAIL} with your order number. We will arrange a pickup where available or share the return address.`]],
      ['4. Refunds', [
        '- Once we receive and check the returned product, we approve the refund within 2 business days.',
        '- UPI payments are refunded to the same UPI account within 5 to 7 business days of approval.',
        '- Cash-on-delivery orders are refunded by UPI or bank transfer to an account you choose.',
        '- Delivery and cash-on-delivery fees are refunded only if the product was damaged, wrong or expired.',
      ]],
      ['5. Cancellations', ['You can cancel an order free of charge before it is shipped. Call or email us with your order number.']],
    ],
  },
  'shipping-policy': {
    title: 'Shipping Policy',
    intro: 'We deliver across India through trusted courier partners.',
    sections: [
      ['1. Delivery time', [
        '- Most orders are dispatched within 1 business day of confirmation and delivered in 2 to 5 business days.',
        '- Remote areas may take a few extra days. Specially sourced products take longer; we will tell you the expected date when we confirm the order.',
      ]],
      ['2. Delivery charges', [
        '- Free delivery on orders of ₹999 or more.',
        '- A flat ₹59 delivery fee applies to orders below ₹999.',
        '- Cash on delivery has an extra ₹49 fee. The exact amounts are always shown at checkout.',
      ]],
      ['3. Tracking', ['You will see the latest status of your order in My orders, and we send updates by email and in-app notifications when it is packed, shipped, out for delivery and delivered.']],
      ['4. Delivery issues', [
        '- Please make sure the address and phone number are correct. The courier may call you before delivery.',
        `- If a delivery fails or is delayed, contact us on ${PHONES} and we will help.`,
      ]],
    ],
  },
  'about-us': {
    title: 'About AnimalVeda',
    intro: 'AnimalVeda supplies veterinary medicines, food, treats and everyday care products for pets and farm animals across India.',
    sections: [
      ['What we do', [
        '- Vet-approved food, treats, medicines and accessories for dogs, cats, cattle, goats, poultry, horses and birds.',
        '- Can’t find a medicine or product? Use “Request a medicine”: send a photo of the label or prescription, and our team will source it and call you back with a price.',
        '- Coming soon: pet care and vaccination at your doorstep.',
      ]],
      ['Why customers trust us', ['- Genuine products from authorised suppliers.', '- Cash on delivery and UPI, with free delivery over ₹999.', '- A real team that answers the phone, 7 days a week.']],
    ],
  },
  'contact-us': {
    title: 'Contact Us',
    intro: 'Questions about an order, a medicine or a product request? We’re happy to help.',
    sections: [
      ['Get in touch', [`- Phone / WhatsApp: ${PHONES}`, `- Email: ${EMAIL}`, '- Open all 7 days, including Saturday and Sunday, our busiest days.']],
      ['Response time', ['We answer calls as quickly as we can. If we miss your call or message, we usually get back to you within 2 to 3 days.']],
      ['Privacy and grievances', ['For questions about your personal data, see our Privacy Policy or contact our Grievance Officer at the email above.']],
    ],
  },
}

function Para({ text }) {
  // Turn known page names into links
  const parts = text.split(/(Privacy Policy|Shipping Policy|Refund Policy|My profile|My orders|Request a medicine)/)
  const to = { 'Privacy Policy': '/privacy-policy', 'Shipping Policy': '/shipping-policy', 'Refund Policy': '/refund-policy', 'My profile': '/account/profile', 'My orders': '/account', 'Request a medicine': '/request-medicine' }
  return parts.map((p, i) => (to[p] ? <Link key={i} to={to[p]} className="text-brand-700 font-semibold underline underline-offset-2">{p}</Link> : p))
}

export default function Policy({ slug }) {
  const page = content[slug]
  if (!page) return <div className="container-x py-20 text-center text-ink-500">Page not found. <Link to="/" className="text-brand-600 font-semibold">Home</Link></div>
  const legal = !['about-us', 'contact-us'].includes(slug)
  return (
    <div className="container-x py-10 sm:py-14 max-w-3xl">
      <nav aria-label="Breadcrumb" className="text-xs text-ink-500 mb-3"><Link to="/" className="hover:text-brand-600">Home</Link> <span aria-hidden="true">›</span> <span className="text-ink-700 font-semibold">{page.title}</span></nav>
      <h1 className="text-3xl sm:text-4xl">{page.title}</h1>
      {legal && <p className="text-sm text-ink-500 mt-2">Last updated: {UPDATED}</p>}
      <p className="text-ink-700 leading-relaxed mt-4 text-[1.05rem]">{page.intro}</p>
      {page.sections.map(([h, lines]) => {
        const out = []
        let list = []
        const flush = () => { if (list.length) { out.push(<ul key={out.length} className="list-disc pl-5 space-y-1.5 marker:text-brand-500">{list.map((l, i) => <li key={i}><Para text={l} /></li>)}</ul>); list = [] } }
        for (const l of lines) { if (l.startsWith('- ')) list.push(l.slice(2)); else { flush(); out.push(<p key={out.length}><Para text={l} /></p>) } }
        flush()
        return (
          <section key={h} className="mt-8">
            <h2 className="text-xl sm:text-2xl text-ink-900">{h}</h2>
            <div className="mt-3 space-y-3 text-ink-700 leading-relaxed">{out}</div>
          </section>
        )
      })}
      <Link to="/" className="inline-block mt-10 text-brand-600 font-semibold">← Back to home</Link>
    </div>
  )
}
