import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useWishlist } from '@/store/wishlist'
import { getProductById } from '@/data/products'
import ProductCard from '@/components/ProductCard'

export default function Wishlist() {
  const ids = useWishlist((s) => s.ids)
  const items = ids.map(getProductById).filter(Boolean)

  if (items.length === 0)
    return (
      <div className="container-x py-20 text-center">
        <Heart size={48} className="mx-auto text-ink-500 mb-4" />
        <h1 className="text-2xl font-extrabold">Your wishlist is empty</h1>
        <p className="text-ink-500 mt-2">Tap the heart on any product to save it here.</p>
        <Link to="/shop" className="btn-primary mt-6">Browse products</Link>
      </div>
    )

  return (
    <div className="container-x py-8">
      <h1 className="text-3xl font-extrabold mb-6">Wishlist ({items.length})</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  )
}
