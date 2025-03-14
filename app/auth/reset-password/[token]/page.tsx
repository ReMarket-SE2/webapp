import { PasswordResetForm } from "@/components/auth/password-reset-form"

export default function ResetPasswordPage({
  params
}: {
  params: { token: string }
}) {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <PasswordResetForm token={params.token} />
      </div>
    </div>
  )
} 