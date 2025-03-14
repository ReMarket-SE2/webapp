import { PasswordResetForm } from "@/components/auth/password-reset-form"

export default async function ResetPasswordPage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <PasswordResetForm token={(await params).token} />
      </div>
    </div>
  )
} 