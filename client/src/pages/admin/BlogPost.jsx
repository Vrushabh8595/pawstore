import { useParams } from 'react-router-dom'
import PostEditor from '@/components/blog/PostEditor'

export default function AdminBlogPost() {
  const { id } = useParams()
  return <PostEditor key={id} mode="admin" id={id} back="/admin/blog" />
}
