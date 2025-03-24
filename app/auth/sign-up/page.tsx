"use client"

import { SignUpForm } from "@/components/auth/sign-up-form"
import { SessionProvider } from "next-auth/react"
export default function SignUpPage() {
  return (
    <div className="w-full max-w-xs">
      <SessionProvider>
        <SignUpForm />
      </SessionProvider>
    </div>
  )
}
