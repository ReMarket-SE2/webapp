import { SignUpForm } from "@/components/auth/sign-up-form"
import { Suspense } from "react"

export default function SignUpPage() {
  return (
    <div className="w-full max-w-xs">
      <Suspense>
        <SignUpForm />
      </Suspense>
    </div>
  )
}
