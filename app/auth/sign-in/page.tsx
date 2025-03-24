"use client"

import { SignInForm } from "@/components/auth/sign-in-form"
import { SessionProvider } from "next-auth/react"
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

export default function SignInPage() {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      toast.error(error)
    }
  }, [searchParams])

  return (
    <div className="w-full max-w-xs">
      <SessionProvider>
        <SignInForm />
      </SessionProvider>
    </div>
  )
}
