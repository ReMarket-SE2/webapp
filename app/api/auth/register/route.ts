import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { findUserByUsername, findUserByEmail, createUser } from '@/lib/users/actions'
import { checkPasswordStrength } from "@/lib/validators/password-strength"

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

    // Create new user
    await createUser({
      email,
      passwordHash: hashedPassword,
      username: username,
      status: 'active',
      profileImageId: null,
      bio: null,
      role: 'user',
      password_reset_token: null,
      password_reset_expires: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
