import { SignInForm } from "@/components/auth/sign-in-form"
import { Suspense } from "react"

export default function SignInPage() {
  return (
    <div className="w-full max-w-xs">
      <Suspense>
        <SignInForm />
      </Suspense>
    </div>
  )
}
