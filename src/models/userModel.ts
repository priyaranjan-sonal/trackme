import mongoose, { Document, Model, Schema } from "mongoose"

export interface IUser extends Document {
  name: string
  email: string
  password: string
  forgotPasswordToken?: string
  forgotPasswordTokenExpiry?: Date
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, "Please enter your name"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
  },
  forgotPasswordToken: String,
  forgotPasswordTokenExpiry: Date,
})

const User: Model<IUser> =
  mongoose.models.users || mongoose.model<IUser>("users", userSchema)

export default User
