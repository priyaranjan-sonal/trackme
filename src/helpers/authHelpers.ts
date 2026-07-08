import jwt from "jsonwebtoken"
import { NextRequest } from "next/server"

export interface TokenPayload {
  id: string
  name: string
  email: string
}

export function verifyToken(request: NextRequest): TokenPayload | null {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) return null

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload
    return decoded
  } catch {
    return null
  }
}

export function getTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get("token")?.value ?? null
}
