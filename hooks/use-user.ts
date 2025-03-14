import { useState, useEffect } from 'react'
import { User } from '@/lib/services/user-service'

type UserResponse = Omit<User, 'password'>

interface UseUserReturn {
  user: UserResponse | null
  isLoading: boolean
  error: Error | null
  mutate: () => Promise<void>
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user')
      }

      const data = await response.json()
      setUser(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e : new Error('An error occurred'))
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const mutate = async () => {
    setIsLoading(true)
    await fetchUser()
  }

  return { user, isLoading, error, mutate }
} 