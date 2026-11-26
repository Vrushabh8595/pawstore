import { useCart } from '@/store/cart'
import { cartFeedback } from './feedback'

// Shared add-to-cart with haptics, sound, paw-burst and fly-to-cart.
export function useAddToCart() {
  const add = useCart((s) => s.add)
  return (product, variant, qty = 1, imageEl, buttonEl) => {
    add(product.id, variant.sku, qty)
    cartFeedback('add', { button: buttonEl || imageEl, image: imageEl, imageSrc: product.images[0] })
  }
}
