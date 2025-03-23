import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { UserService } from '@/services/user-service'
import { checkPasswordStrength } from "@/lib/validators/password-strength"
import { createRefreshToken, createAccessToken, setRefreshTokenCookie, setAccessTokenCookie } from '@/services/auth-service'

// POST /api/auth/register
export async function POST(request: Request) {
  try {
    const { email, password, confirmPassword, name } = await request.json()

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

    // Check if user exists 
    const existingUser = await UserService.findByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    const user = await UserService.create({
      email,
      passwordHash: hashedPassword,
      username: name,
      profileImageId: null,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Create access and refresh tokens
    const accessToken = await createAccessToken(user.id)
    const refreshToken = await createRefreshToken(user.id)

    const response = NextResponse.json({ 
      success: true,
      user: UserService.sanitizeUser(user),
    })

    // Set the access token header
    setAccessTokenCookie(response, accessToken)

    // Set the refresh token cookie
    setRefreshTokenCookie(response, refreshToken)
    

    return response

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
