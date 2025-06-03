import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { findUserByUsername, findUserByEmail, createUser, updateEmailVerificationToken } from '@/lib/users/actions'
import { checkPasswordStrength } from "@/lib/validators/password-strength"
import { sendEmailVerificationEmail } from '@/lib/actions'
import { SignJWT } from 'jose'

// POST /api/auth/register
export async function POST(request: Request) {
  try {
    const { email, password, confirmPassword, username } = await request.json()

    // Validate password
    const passwordValidation = checkPasswordStrength(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      )
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    // Check if username is taken
    const existingUsername = await findUserByUsername(username)
    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      )
    }

    // Check if user exists 
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user with unverified email
    const newUser = await createUser({
      email,
      passwordHash: hashedPassword,
      username: username,
      status: 'inactive', // Set to inactive until email is verified
      emailVerified: false,
      profileImageId: null,
      bio: null,
      role: 'user',
      password_reset_token: null,
      password_reset_expires: null,
      email_verification_token: null,
      email_verification_expires: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Generate email verification token
    const verificationToken = await new SignJWT({ userId: newUser.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET))

    // Set verification token expiration (24 hours from now)
    const verificationExpires = new Date()
    verificationExpires.setHours(verificationExpires.getHours() + 24)

    // Update user with verification token
    await updateEmailVerificationToken(newUser.id, verificationToken, verificationExpires)

    // Send verification email
    await sendEmailVerificationEmail(email, verificationToken)

    return NextResponse.json({ 
      success: true, 
      message: 'Account created successfully. Please check your email to verify your account.' 
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
