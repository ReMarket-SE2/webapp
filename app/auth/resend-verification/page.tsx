"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import Link from "next/link"

export default function ResendVerificationPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    if (!email) {
      toast.error("Please enter your email address")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || "Verification email sent successfully!")
        setEmail("")
      } else {
        toast.error(data.error || "Failed to send verification email")
      }
    } catch (error) {
      console.error("Resend verification error:", error)
      toast.error("An unexpected error occurred. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src="/auth/email.png" alt="Email icon" className="h-16 w-16" data-testid="mail-icon" />
          <h1 className="text-2xl font-bold">Resend Verification Email</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email address to receive a new verification email.
          </p>
        </div>
        
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send Verification Email"}
        </Button>
        
        <div className="text-center text-sm">
          <Link href="/auth/sign-in" className="underline underline-offset-4">
            Back to Sign In
          </Link>
        </div>
      </form>
    </div>
  )
} 