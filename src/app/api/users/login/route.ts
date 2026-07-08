import { connect } from "@/dbConfig/dbConfig"
import User from "@/models/userModel"
import { NextRequest, NextResponse } from "next/server"
import bcryptjs from "bcryptjs"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    await connect()

    const reqBody = await request.json()
    const { email, password } = reqBody

    if (!email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json({ error: "User does not exist" }, { status: 400 })
    }

    const validPassword = await bcryptjs.compare(password, user.password)
    if (!validPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 400 })
    }

    const tokenData = { id: user._id.toString(), name: user.name, email: user.email }
    const token = jwt.sign(tokenData, process.env.JWT_SECRET!, { expiresIn: "1d" })

    const response = NextResponse.json({
      message: "Login successful",
      success: true,
      user: { id: user._id, name: user.name, email: user.email }
    })

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24
    })

    return response

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
