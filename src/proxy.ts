import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const protectedRoutes = ["/profile", "/dashboard", "/workspace", "/media"]
const guestRoutes = ["/", "/login", "/signup"]

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value
  const { pathname } = request.nextUrl

  const isAuthenticated = !!token
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )
  const isGuestRoute = guestRoutes.some((route) => pathname === route)

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isGuestRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/profile/:path*", "/dashboard/:path*", "/workspace/:path*", "/media/:path*", "/login", "/signup"],
}
