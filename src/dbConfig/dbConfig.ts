import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

export async function connect() {
  try {
    if (mongoose.connection.readyState >= 1) {
      return
    }

    const uri = process.env.MONGO_URI
    if (!uri) {
      throw new Error("Missing MONGO_URI environment variable")
    }

    await mongoose.connect(uri)
    const connection = mongoose.connection


    connection.on('connected', () => {
      console.log("MongoDB connected successfully!")
    })

    connection.on('error', (err) => {
      console.log("MongoDB connection error: ", err)
      process.exit(1)
    })



  } catch (error) {
    console.log("Something went wrong")
    console.log(error)
  }
}