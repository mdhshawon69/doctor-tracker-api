import { connectToDatabase } from "../db.js"
import { Doctor } from "../models/doctor.js"
import { Patient } from "../models/patient.js"
import type { FilterOptions } from "../types.js"

export async function getFilterOptions(): Promise<FilterOptions> {
  await connectToDatabase()

  // Distinct queries are cheap at admin-portal scale and mean the dropdowns
  // only show values that actually exist in the current data set.
  const [specializations, hospitals, conditions] = await Promise.all([
    Doctor.distinct("specialization"),
    Doctor.distinct("hospital"),
    Patient.distinct("condition"),
  ])

  return {
    specializations: specializations.sort((a, b) => a.localeCompare(b)),
    hospitals: hospitals.sort((a, b) => a.localeCompare(b)),
    conditions: conditions.sort((a, b) => a.localeCompare(b)),
  }
}
