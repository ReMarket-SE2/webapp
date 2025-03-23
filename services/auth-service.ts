import { SignJWT } from 'jose/jwt/sign'
import { NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET!


export async function createRefreshToken(userId: number) {

    const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(JWT_SECRET))

    return token
}

export async function createAccessToken(userId: number) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .sign(new TextEncoder().encode(JWT_SECRET))

    return token
}

export const setRefreshTokenCookie = (response: NextResponse, token: string) => {
    response.cookies.set({
        name: 'token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })
}

export const clearRefreshTokenCookie = (response: NextResponse) => {
    response.cookies.delete('token')
}

export const setAccessTokenCookie = (response: NextResponse, token: string) => {
  response.cookies.set({
    name: 'accessToken',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes
    path: '/',
  })
}