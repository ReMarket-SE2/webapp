"use client"

import { SignUpForm } from "@/components/auth/sign-up-form"
import { SessionProvider } from "next-auth/react"
import { Suspense } from "react"

export default function SignUpPage() {
  return (
    <div className="w-full max-w-xs">
      <SessionProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <SignUpForm />
        </Suspense>
      </SessionProvider>
    </div>
  )
}
