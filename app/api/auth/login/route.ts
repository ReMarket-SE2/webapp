import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { UserService } from '@/services/user-service'
import { createAccessToken, createRefreshToken, setRefreshTokenCookie, setAccessTokenCookie } from '@/services/auth-service'

// POST /api/auth/login
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Find user by email
    const user = await UserService.findByEmail(email)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Compare password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create access token
    const accessToken = await createAccessToken(user.id)
    const refreshToken = await createRefreshToken(user.id)

    // Create response
    const response = NextResponse.json({ 
      success: true,
      user: UserService.sanitizeUser(user),
    })

    // Set access token header
    setAccessTokenCookie(response, accessToken)

    // Set cookie
    setRefreshTokenCookie(response, refreshToken)

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
