import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { UserService } from '@/services/user-service'
import { createAccessToken, setAccessTokenCookie } from '@/services/auth-service'

export async function authMiddleware(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  try {
    const refreshToken = request.cookies.get('token')?.value
    
    if (!refreshToken) {
      const returnTo = encodeURIComponent(request.nextUrl.pathname)
      return NextResponse.redirect(
        new URL(`/auth/sign-in?returnTo=${returnTo}&message=Please log in to continue`, request.url)
      )
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(refreshToken, secret)
    
    const userExists = await UserService.exists(payload.userId as string)
    
    if (!userExists) {
      const returnTo = encodeURIComponent(request.nextUrl.pathname)
      return NextResponse.redirect(
        new URL(`/auth/sign-in?returnTo=${returnTo}&message=User not found, please log in again`, request.url)
      )
    }

    const accessToken = await createAccessToken(payload.userId as string)
    const response = NextResponse.next()
    
    setAccessTokenCookie(response, accessToken)
    
    return response
    
  } catch (error) {
    console.error('Auth failed:', error)
    const returnTo = encodeURIComponent(request.nextUrl.pathname)
    return NextResponse.redirect(
      new URL(`/auth/sign-in?returnTo=${returnTo}&message=Session expired, please log in again`, request.url)
    )
  }
}