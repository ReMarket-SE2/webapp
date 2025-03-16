import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { UserService } from '@/services/user-service'

// GET /api/auth/me
export async function GET(request: Request) {
  try {
    const token = request.headers.get('cookie')?.split('accessToken=')[1]?.split(';')[0]

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify token
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    )

    if (!payload.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get user
    const user = await UserService.findById(payload.userId as string)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return sanitized user
    return NextResponse.json(UserService.sanitizeUser(user))

  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    )
  }
} 