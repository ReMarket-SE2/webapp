import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { getUserById, validateEmailVerificationToken, verifyUserEmail } from '@/lib/users/actions'

// POST /api/auth/verify-email
export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Verify JWT token
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    )

    if (!payload.userId) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      )
    }

    const userId = payload.userId as number

    // Find user
    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      )
    }

    // Validate the verification token
    const isValidToken = await validateEmailVerificationToken(userId, token)
    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Verify the user's email and activate account
    await verifyUserEmail(userId)

    return NextResponse.json({ 
      success: true,
      message: 'Email verified successfully. Your account is now active.' 
    })

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
} 