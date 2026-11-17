import { compare, hash } from "bcryptjs"
import { Types } from "mongoose"

import { connectToDatabase } from "../db.js"
import { HttpError } from "../lib/http.js"
import { User } from "../models/user.js"
import type { SessionUser, UserSummary } from "../types.js"

const BCRYPT_ROUNDS = 10

function isDuplicateKeyError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000
}

/**
 * Accounts live in MongoDB, never in environment variables. The backend is the
 * only place a password is ever read in clear text, and only long enough to
 * hash or compare it.
 */
export async function countUsers(): Promise<number> {
  await connectToDatabase()

  return User.countDocuments().exec()
}

export async function createUser(input: {
  name: string
  email: string
  password: string
}): Promise<SessionUser> {
  await connectToDatabase()

  const passwordHash = await hash(input.password, BCRYPT_ROUNDS)

  try {
    const user = await User.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: "admin",
    })

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: "admin",
    }
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new HttpError(409, "An account with that email already exists.", {
        email: ["An account with that email already exists."],
      })
    }

    throw error
  }
}

export async function listUsers(): Promise<UserSummary[]> {
  await connectToDatabase()

  const users = await User.find()
    .select("name email role createdAt")
    .sort({ createdAt: 1, _id: 1 })
    .lean()
    .exec()

  return users.map((user) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  }))
}

export async function setUserPassword(userId: string, password: string): Promise<void> {
  await connectToDatabase()

  if (!Types.ObjectId.isValid(userId)) {
    throw new HttpError(404, "User not found.")
  }

  const passwordHash = await hash(password, BCRYPT_ROUNDS)
  const result = await User.updateOne({ _id: userId }, { passwordHash }).exec()

  if (result.matchedCount === 0) {
    throw new HttpError(404, "User not found.")
  }
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await connectToDatabase()

  if (!Types.ObjectId.isValid(userId)) {
    throw new HttpError(404, "User not found.")
  }

  const user = await User.findById(userId).select("+passwordHash").lean().exec()

  if (!user) {
    throw new HttpError(404, "User not found.")
  }

  const matches = await compare(currentPassword, user.passwordHash)

  if (!matches) {
    throw new HttpError(400, "Your current password is incorrect.", {
      currentPassword: ["Your current password is incorrect."],
    })
  }

  const passwordHash = await hash(newPassword, BCRYPT_ROUNDS)
  await User.updateOne({ _id: userId }, { passwordHash }).exec()
}
