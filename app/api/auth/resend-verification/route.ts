import { NextResponse } from 'next/server'
import { findUserByEmail, updateEmailVerificationToken } from '@/lib/users/actions'
import { sendEmailVerificationEmail } from '@/lib/actions'
import { SignJWT } from 'jose'

// POST /api/auth/resend-verification
export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await findUserByEmail(email)
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

    // Generate new verification token
    const verificationToken = await new SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET))

    // Set verification token expiration (24 hours from now)
    const verificationExpires = new Date()
    verificationExpires.setHours(verificationExpires.getHours() + 24)

    // Update user with new verification token
    await updateEmailVerificationToken(user.id, verificationToken, verificationExpires)

    // Send verification email
    await sendEmailVerificationEmail(email, verificationToken)

    return NextResponse.json({ 
      success: true,
      message: 'Verification email sent successfully. Please check your email.' 
    })

  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    )
  }
} 