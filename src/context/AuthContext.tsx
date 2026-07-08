"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import axios, { AxiosError } from "axios"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

export interface User {
  id: string
  name: string
  email: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchUser()
  }, [])

  async function fetchUser() {
    try {
      const response = await axios.get("/api/users/me")
      if (response.data.success) {
        setUser(response.data.user)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function login(email: string, password: string) {
    const response = await axios.post("/api/users/login", { email, password })
    setUser(response.data.user)
    toast.success(`Welcome back, ${response.data.user.name}!`)
    router.push("/dashboard")
  }

  async function signup(name: string, email: string, password: string) {
    const response = await axios.post("/api/users/signup", { name, email, password })
    setUser(response.data.user)
    toast.success(`Welcome, ${response.data.user.name}!`)
    router.push("/profile")
  }

  async function logout() {
    try {
      await axios.post("/api/users/logout")
      setUser(null)
      toast.success("Logged out successfully")
      router.push("/login")
    } catch {
      toast.error("Failed to log out")
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
