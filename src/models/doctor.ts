import mongoose, { type Model } from "mongoose"

import { SPECIALIZATIONS } from "../constants.js"

export type DoctorDocument = {
  name: string
  specialization: (typeof SPECIALIZATIONS)[number]
  hospital: string
  phone: string
  email: string
  createdAt: Date
  updatedAt: Date
}

const doctorSchema = new mongoose.Schema<DoctorDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    specialization: {
      type: String,
      required: true,
      enum: SPECIALIZATIONS,
      trim: true,
    },
    hospital: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 24,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 160,
    },
  },
  { timestamps: true }
)

// Unique email prevents duplicate doctor records.
doctorSchema.index({ email: 1 }, { unique: true })
// Filter + sort indexes used by the doctors list.
doctorSchema.index({ createdAt: -1 })
doctorSchema.index({ specialization: 1, createdAt: -1 })
doctorSchema.index({ hospital: 1, createdAt: -1 })
// Supports name-prefix searches without scanning the whole collection.
doctorSchema.index({ name: 1 })

export const Doctor: Model<DoctorDocument> =
  (mongoose.models.Doctor as Model<DoctorDocument>) ??
  mongoose.model<DoctorDocument>("Doctor", doctorSchema)
