import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { userAction } from '@/lib/users/actions'
import { checkPasswordStrength } from '@/lib/validators/password-strength'

// POST /api/auth/reset-password
export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    // Verify token
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    )

    if (!payload.userId) {
      return NextResponse.json(
        { error: 'Invalid reset token' },
        { status: 400 }
      )
    }

    // Validate password
    const passwordValidation = checkPasswordStrength(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Find user
    const user = await userAction.findById(payload.userId as number)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const updatedUser = {
      ...user,
      passwordHash: hashedPassword,
      updatedAt: new Date()
    }


    // Update user password
    await userAction.update(updatedUser)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
} 