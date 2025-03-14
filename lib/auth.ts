import { jwtVerify } from 'jose'
import { SignJWT } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET!

export async function verifyAuth(token: string) {
  try {
    const verified = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    )
    return verified.payload
  } catch (err) {
    console.error('Token verification error:', err)
    throw new Error('Your token has expired.')
  }
}

export async function createToken(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(JWT_SECRET))
  return token
}
