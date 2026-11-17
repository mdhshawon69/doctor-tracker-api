import mongoose, { type Model } from "mongoose"

export type UserDocument = {
  name: string
  email: string
  passwordHash: string
  role: "admin"
  createdAt: Date
  updatedAt: Date
}

const userSchema = new mongoose.Schema<UserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: 160,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
    },
  },
  { timestamps: true }
)

export const User: Model<UserDocument> =
  (mongoose.models.User as Model<UserDocument>) ??
  mongoose.model<UserDocument>("User", userSchema)
