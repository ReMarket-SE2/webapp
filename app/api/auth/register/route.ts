import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { UserService } from '@/services/user-service'
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
    const existingUsername = await UserService.findByUsername(username)
    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      )
    }

    // Check if user exists 
    const existingUser = await UserService.findByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    await UserService.create({
      email,
      passwordHash: hashedPassword,
      username: username,
      profileImageId: null,
      role: 'user',
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
