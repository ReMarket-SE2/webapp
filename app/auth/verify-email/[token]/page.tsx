"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function VerifyEmailPage() {
  const params = useParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()

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
          <div className="text-center space-y-4">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" data-testid="check-circle-icon" />
            <h1 className="text-2xl font-bold text-green-700">Email Verified!</h1>
            <p className="text-gray-600">Your email has been successfully verified.</p>
            <Button onClick={() => router.push('/auth/sign-in')} className="w-full">
              Continue to Sign In
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center space-y-4">
            <XCircle className="mx-auto h-16 w-16 text-red-500" data-testid="x-circle-icon" />
            <h1 className="text-2xl font-bold text-red-700">Verification Failed</h1>
            <p className="text-gray-600">{message}</p>
            <Button 
              onClick={() => router.push('/auth/resend-verification')} 
              variant="outline" 
              className="w-full"
            >
              Request New Verification Email
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 