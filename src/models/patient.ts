import mongoose, { type Model } from "mongoose"

import { CONDITIONS, GENDERS } from "../constants.js"

export type PatientDocument = {
  name: string
  age: number
  gender: (typeof GENDERS)[number]
  condition: (typeof CONDITIONS)[number]
  phone: string
  email: string
  doctorId: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const patientSchema = new mongoose.Schema<PatientDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    age: {
      type: Number,
      required: true,
      min: 0,
      max: 120,
    },
    gender: {
      type: String,
      required: true,
      enum: GENDERS,
    },
    condition: {
      type: String,
      required: true,
      enum: CONDITIONS,
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
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
  },
  { timestamps: true }
)

// The two most common list queries: patients under a doctor and all patients,
// both newest first. The compound indexes also cover their date filters.
patientSchema.index({ doctorId: 1, createdAt: -1 })
patientSchema.index({ condition: 1, createdAt: -1 })
patientSchema.index({ createdAt: -1 })
patientSchema.index({ name: 1 })

export const Patient: Model<PatientDocument> =
  (mongoose.models.Patient as Model<PatientDocument>) ??
  mongoose.model<PatientDocument>("Patient", patientSchema)
