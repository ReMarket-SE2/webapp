import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { userAction } from '@/lib/users/actions'
import { sendPasswordResetEmail } from '@/lib/actions'

// POST /api/auth/forgot-password
export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    const user = await userAction.findByEmail(email)
    
    if (!user) {
      // Return success even if user doesn't exist for security reasons
      return NextResponse.json({ success: true })
    }

    // Create reset token
    const resetToken = await new SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET))

    // Send reset email
    await sendPasswordResetEmail(email, resetToken)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
} 