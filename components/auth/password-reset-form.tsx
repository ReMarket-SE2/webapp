"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { checkPasswordStrength } from "@/lib/validators/password-strength"

export function PasswordResetForm({
  className,
  token,
  ...props
}: React.ComponentProps<"form"> & { token: string }) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    const passwordValidation = checkPasswordStrength(password)
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.error!)
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password, token }),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error) {
          toast.error(data.error)
        } else {
          toast.error("Failed to reset password")
        }
        return
      }

      toast.success("Password reset successfully!")
      router.push('/auth/sign-in')
    } catch (error) {
      console.error('Password reset error:', error)
      toast.error("Failed to reset password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form 
      className={cn("flex flex-col gap-6", className)} 
      onSubmit={handleSubmit}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Reset Password</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your new password below
        </p>
      </div>
      <div className="grid gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            minLength={6}
          />
          {!checkPasswordStrength(password).isValid && password.length > 0 && (
            <p className="text-xs text-red-500">
              Password must be at least 6 characters long, contain one uppercase letter,
              one lowercase letter, and one special character.
            </p>
          )}
        </div>
        <div className="grid gap-3">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input 
            id="confirmPassword" 
            type="password" 
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            minLength={6}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Resetting password..." : "Reset password"}
        </Button>
      </div>
      <div className="text-center text-sm">
        Remember your password?{" "}
        <Link href="/auth/sign-in" className="underline underline-offset-4">
          Sign in
        </Link>
      </div>
    </form>
  )
}
