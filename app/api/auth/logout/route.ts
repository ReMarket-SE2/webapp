import { NextResponse } from 'next/server'
import { clearRefreshTokenCookie } from '@/services/auth-service'

// POST /api/auth/logout
export async function POST() {
  const response = NextResponse.json({ success: true })
  clearRefreshTokenCookie(response)
  return response
}