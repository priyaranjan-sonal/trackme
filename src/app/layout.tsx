import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "react-hot-toast"
import { AuthProviderWrapper } from "@/components/AuthProviderWrapper"
import Navbar from "@/components/Navbar"

export const metadata: Metadata = {
  title: "TrackMe",
  description: "Track and manage your watchlist with TrackMe",
  icons: {
    icon: "/icon2.png"
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProviderWrapper>
          <Navbar />
          <main>{children}</main>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "#12121d",
                color: "#f4f4f6",
                border: "1px solid rgba(99, 102, 241, 0.2)",
              },
            }}
          />
        </AuthProviderWrapper>
      </body>
    </html>
  )
}
