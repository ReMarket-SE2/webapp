"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function VerifyEmailPage() {
  const params = useParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = params.token as string
        
        if (!token) {
          setStatus('error')
          setMessage('Invalid verification link')
          return
        }

        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage(data.message || 'Email verified successfully!')
        } else {
          setStatus('error')
          setMessage(data.error || 'Failed to verify email')
        }
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('error')
        setMessage('An unexpected error occurred')
      }
    }

    verifyEmail()
  }, [params.token])

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex flex-col items-center gap-6 text-center p-6">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <h1 className="text-2xl font-bold">Verifying your email...</h1>
            <p className="text-muted-foreground">
              Please wait while we verify your email address.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-600" />
            <h1 className="text-2xl font-bold text-green-600">Email Verified!</h1>
            <p className="text-muted-foreground">{message}</p>
            <div className="flex flex-col gap-3 w-full">
              <Button asChild className="w-full">
                <Link href="/auth/sign-in">Sign In to Your Account</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/">Go to Homepage</Link>
              </Button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-red-600" />
            <h1 className="text-2xl font-bold text-red-600">Verification Failed</h1>
            <p className="text-muted-foreground">{message}</p>
            <div className="flex flex-col gap-3 w-full">
              <Button asChild className="w-full">
                <Link href="/auth/sign-up">Create New Account</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/">Go to Homepage</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 