import { useQuery } from '@tanstack/react-query'
import { api } from './api'

// Approved-review ratings for every product: { slug: { avg, count, breakdown } }
export function useReviewSummary() {
  const q = useQuery({ queryKey: ['review-summary'], queryFn: () => api.get('/reviews/summary'), staleTime: 5 * 60_000, retry: 1 })
  return q.data || {}
}
export function useProductRating(slug) {
  return useReviewSummary()[slug] || null
}
