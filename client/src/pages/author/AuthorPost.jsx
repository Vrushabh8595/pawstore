import { useParams } from 'react-router-dom'
import PostEditor from '@/components/blog/PostEditor'

export default function AuthorPost() {
  const { id } = useParams()
  return <PostEditor key={id} mode="author" id={id} back="/author" />
}
