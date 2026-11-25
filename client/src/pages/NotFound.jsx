import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container-x py-24 text-center">
      <p className="text-7xl">🐾</p>
      <h1 className="text-3xl font-extrabold mt-4">Page not found</h1>
      <p className="text-ink-500 mt-2">The page you're looking for ran off to chase a ball.</p>
      <Link to="/" className="btn-primary mt-6">Back home</Link>
    </div>
  )
}
