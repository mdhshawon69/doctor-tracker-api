import { Types, type QueryFilter } from "mongoose"

import { connectToDatabase } from "../db.js"
import { buildPagination, HttpError } from "../lib/http.js"
import { rangeStart } from "../lib/date.js"
import { buildSearchFilter } from "../lib/search.js"
import { Doctor, type DoctorDocument } from "../models/doctor.js"
import { Patient } from "../models/patient.js"
import type { DoctorSummary, Paginated } from "../types.js"
import type { DoctorInput, ListQuery } from "../validation.js"

export async function listDoctors(query: ListQuery): Promise<Paginated<DoctorSummary>> {
  await connectToDatabase()

  const filter: QueryFilter<DoctorDocument> = {}
  const start = rangeStart(query.range)

  if (query.q) {
    const search = buildSearchFilter(query.q, ["name", "email", "phone", "hospital"])
    if (search) {
      Object.assign(filter, search)
    }
  }

  if (query.specialization) {
    filter.specialization = query.specialization as DoctorDocument["specialization"]
  }

  if (query.hospital) {
    filter.hospital = query.hospital
  }

  if (start) {
    filter.createdAt = { $gte: start }
  }

  const skip = (query.page - 1) * query.limit

  // Count and page are independent, so run them together. Only the columns the
  // table needs are selected, which keeps the payload small.
  const [doctors, total] = await Promise.all([
    Doctor.find(filter)
      .select("name specialization hospital phone email createdAt")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(query.limit)
      .lean()
      .exec(),
    Doctor.countDocuments(filter),
  ])

  const counts = await getPatientCounts(doctors.map((doctor) => doctor._id))

  return {
    data: doctors.map((doctor) => ({
      id: doctor._id.toString(),
      name: doctor.name,
      specialization: doctor.specialization,
      hospital: doctor.hospital,
      phone: doctor.phone,
      email: doctor.email,
      patientCount: counts.get(doctor._id.toString()) ?? 0,
      createdAt: doctor.createdAt.toISOString(),
    })),
    pagination: buildPagination(total, query.page, query.limit),
  }
}

export async function getDoctor(id: string): Promise<DoctorSummary | null> {
  await connectToDatabase()

  if (!Types.ObjectId.isValid(id)) {
    return null
  }

  const doctor = await Doctor.findById(id)
    .select("name specialization hospital phone email createdAt")
    .lean()
    .exec()

  if (!doctor) {
    return null
  }

  const patientCount = await Patient.countDocuments({ doctorId: doctor._id })

  return {
    id: doctor._id.toString(),
    name: doctor.name,
    specialization: doctor.specialization,
    hospital: doctor.hospital,
    phone: doctor.phone,
    email: doctor.email,
    patientCount,
    createdAt: doctor.createdAt.toISOString(),
  }
}

export async function createDoctor(input: DoctorInput): Promise<DoctorSummary> {
  await connectToDatabase()

  const existing = await Doctor.exists({ email: input.email })
  if (existing) {
    throw new HttpError(409, "A doctor with that email already exists.", {
      email: ["A doctor with that email already exists."],
    })
  }

  const doctor = await Doctor.create(input)

  return {
    id: doctor._id.toString(),
    name: doctor.name,
    specialization: doctor.specialization,
    hospital: doctor.hospital,
    phone: doctor.phone,
    email: doctor.email,
    patientCount: 0,
    createdAt: doctor.createdAt.toISOString(),
  }
}

/**
 * One grouped query for every doctor on the page. This avoids the N+1 pattern
 * of counting patients separately for each card or table row.
 */
async function getPatientCounts(doctorIds: Types.ObjectId[]) {
  if (doctorIds.length === 0) {
    return new Map<string, number>()
  }

  const rows = await Patient.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { doctorId: { $in: doctorIds } } },
    { $group: { _id: "$doctorId", count: { $sum: 1 } } },
  ])

  return new Map(rows.map((row) => [row._id.toString(), row.count]))
}
