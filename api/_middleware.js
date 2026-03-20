// api/_middleware.js - shared JWT verification
import { jwtVerify } from 'jose'

export async function verifyToken(req) {
  const auth = req.headers.authorization || ''
  if (!auth.startsWith('Bearer ')) throw new Error('No token')
  const token = auth.slice(7)
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  const { payload } = await jwtVerify(token, secret)
  return payload
}
