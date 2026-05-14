import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '@/api/client'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const res = await register({ name, email, password })
      localStorage.setItem('token', res.token)
      localStorage.setItem('userEmail', res.user.email)
      navigate('/')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      try {
        const parsed = JSON.parse(msg)
        setError(parsed.message || msg)
      } catch {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-gray-800 text-center mb-6">
          Freelance Lead Assistant
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4"
        >
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="At least 8 characters"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
