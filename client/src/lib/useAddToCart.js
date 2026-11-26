import { useCart } from '@/store/cart'
import { cartFeedback } from './feedback'

// Shared add-to-cart with haptics, sound, paw-burst and fly-to-cart.
// Returns the number of units added (0 when the 7-per-product limit is hit).
export function useAddToCart() {
  const add = useCart((s) => s.add)
  return (product, variant, qty = 1, imageEl, buttonEl) => {
    const n = add(product.id, variant.sku, qty)
    if (n === 0) cartFeedback('limit', { button: buttonEl || imageEl })
    else cartFeedback('add', { button: buttonEl || imageEl, image: imageEl, imageSrc: product.images[0] })
    return n
  }
}
