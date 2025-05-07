"use client"

import { SignInForm } from "@/components/auth/sign-in-form"
import { SessionProvider } from "next-auth/react"
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'
import React, { Suspense } from 'react'

function SearchParamsHandler() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams?.get('error')
    if (error) {
      toast.error(error)
    }
  }, [searchParams])

  return null
}

export default function SignInPage() {
  return (
    <div className="w-full max-w-xs">
      <SessionProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <SearchParamsHandler />
          <SignInForm />
        </Suspense>
      </SessionProvider>
    </div>
  )
}
