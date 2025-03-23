import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { UserService } from '@/services/user-service'
import { createAccessToken, setAccessTokenCookie } from '@/services/auth-service'
import { isPublicRoute, isAdminRoute } from '@/config/routes'

export async function authMiddleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Skip middleware for static files and API routes
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Allow public routes
  if (isPublicRoute(path)) {
    return NextResponse.next()
  }

  try {
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      const returnTo = encodeURIComponent(path)
      return NextResponse.redirect(
        new URL(`/auth/sign-in?returnTo=${returnTo}&message=Please log in to continue`, request.url)
      )
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(token, secret)
    
    const user = await UserService.findById(payload.userId as number)
    
    if (!user) {
      const returnTo = encodeURIComponent(path)
      return NextResponse.redirect(
        new URL(`/auth/sign-in?returnTo=${returnTo}&message=User not found, please log in again`, request.url)
      )
    }

    if (isAdminRoute(path) && user.role !== 'admin') {
      return NextResponse.redirect(
        new URL('/', request.url)
      )
    }

    const accessToken = await createAccessToken(user.id)
    const response = NextResponse.next()
    
    setAccessTokenCookie(response, accessToken)
    
    return response
    
  } catch (error) {
    console.error('Auth failed:', error)
    const returnTo = encodeURIComponent(path)
    return NextResponse.redirect(
      new URL(`/auth/sign-in?returnTo=${returnTo}&message=Session expired, please log in again`, request.url)
    )
  }
}