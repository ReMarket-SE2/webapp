import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { UserService } from '@/lib/services/user-service'

export async function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  try {
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      const returnTo = encodeURIComponent(request.nextUrl.pathname)
      return NextResponse.redirect(
        new URL(`/auth/sign-in?returnTo=${returnTo}&message=Please log in to continue`, request.url)
      )
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(token, secret)
    
    const userExists = await UserService.exists(payload.userId as string)
    
    if (!userExists) {
      const returnTo = encodeURIComponent(request.nextUrl.pathname)
      return NextResponse.redirect(
        new URL(`/auth/sign-in?returnTo=${returnTo}&message=User not found, please log in again`, request.url)
      )
    }
    
    return NextResponse.next()
    
  } catch (error) {
    console.error('Auth failed:', error)
    const returnTo = encodeURIComponent(request.nextUrl.pathname)
    return NextResponse.redirect(
      new URL(`/auth/sign-in?returnTo=${returnTo}&message=Session expired, please log in again`, request.url)
    )
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|auth).*)',
  ],
} 