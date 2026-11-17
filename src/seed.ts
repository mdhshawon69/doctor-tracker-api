import { hash } from "bcryptjs"

import { connectToDatabase, disconnectFromDatabase } from "./db.js"
import { Doctor } from "./models/doctor.js"
import { Patient } from "./models/patient.js"
import { User } from "./models/user.js"

const DAY = 24 * 60 * 60 * 1000

const doctors = [
  {
    name: "Dr. Sarah Mitchell",
    specialization: "Cardiology",
    hospital: "St. Mary's Medical Center",
    phone: "+1 (555) 201-4401",
    email: "sarah.mitchell@careguide.app",
  },
  {
    name: "Dr. James Okafor",
    specialization: "Neurology",
    hospital: "Northside General Hospital",
    phone: "+1 (555) 201-4402",
    email: "james.okafor@careguide.app",
  },
  {
    name: "Dr. Priya Raman",
    specialization: "Pediatrics",
    hospital: "Sunshine Children's Hospital",
    phone: "+1 (555) 201-4403",
    email: "priya.raman@careguide.app",
  },
  {
    name: "Dr. Daniel Kim",
    specialization: "Orthopedics",
    hospital: "Riverside Orthopedic Clinic",
    phone: "+1 (555) 201-4404",
    email: "daniel.kim@careguide.app",
  },
  {
    name: "Dr. Elena Rossi",
    specialization: "Dermatology",
    hospital: "St. Mary's Medical Center",
    phone: "+1 (555) 201-4405",
    email: "elena.rossi@careguide.app",
  },
  {
    name: "Dr. Ahmed Hossain",
    specialization: "Internal Medicine",
    hospital: "CityCare Hospital",
    phone: "+1 (555) 201-4406",
    email: "ahmed.hossain@careguide.app",
  },
  {
    name: "Dr. Laura Bennett",
    specialization: "Gynecology",
    hospital: "Northside General Hospital",
    phone: "+1 (555) 201-4407",
    email: "laura.bennett@careguide.app",
  },
  {
    name: "Dr. Michael Chen",
    specialization: "Cardiology",
    hospital: "Riverside Heart Institute",
    phone: "+1 (555) 201-4408",
    email: "michael.chen@careguide.app",
  },
  {
    name: "Dr. Nia Thompson",
    specialization: "Endocrinology",
    hospital: "CityCare Hospital",
    phone: "+1 (555) 201-4409",
    email: "nia.thompson@careguide.app",
  },
  {
    name: "Dr. Omar Farouk",
    specialization: "Pulmonology",
    hospital: "Lakeside Medical Center",
    phone: "+1 (555) 201-4410",
    email: "omar.farouk@careguide.app",
  },
  {
    name: "Dr. Emily Carter",
    specialization: "Gastroenterology",
    hospital: "St. Mary's Medical Center",
    phone: "+1 (555) 201-4411",
    email: "emily.carter@careguide.app",
  },
  {
    name: "Dr. Victor Alvarez",
    specialization: "Urology",
    hospital: "Riverside Medical Center",
    phone: "+1 (555) 201-4412",
    email: "victor.alvarez@careguide.app",
  },
] as const

const firstNames = [
  "Amara", "Tobias", "Priya", "Hassan", "Elena", "Carlos", "Laura", "Marcus",
  "Nia", "Daniel", "Emily", "Ahmed", "Sofia", "Michael", "Hana", "Victor",
  "Grace", "Omar", "Zoe", "Liam", "Leila", "Noah", "Maya", "Ethan",
  "Chloe", "Lucas", "Isabella", "Adam", "Aisha", "Jonas", "Naomi", "Ravi",
  "Clara", "Samuel", "Ines", "Theo",
]

const lastNames = [
  "Boateng", "Adeyinka", "Petrov", "Osei", "Lindqvist", "Rashid", "Nguyen",
  "Mendez", "Whitfield", "Solberg", "Mitchell", "Okafor", "Raman", "Kim",
  "Rossi", "Hossain", "Bennett", "Chen", "Thompson", "Farouk", "Carter",
  "Alvarez", "Silva", "Patel",
]

const conditions = [
  "Hypertension",
  "Diabetes",
  "Asthma",
  "Arthritis",
  "Migraine",
  "Allergy",
  "Cardiac Care",
  "Thyroid",
] as const

async function seed() {
  await connectToDatabase()

  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@careguide.app").toLowerCase()
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin@12345"
  const adminName = process.env.ADMIN_NAME ?? "Dara Whitfield"

  await Promise.all([
    Doctor.syncIndexes(),
    Patient.syncIndexes(),
    User.syncIndexes(),
  ])

  await User.findOneAndUpdate(
    { email: adminEmail },
    {
      name: adminName,
      email: adminEmail,
      passwordHash: await hash(adminPassword, 10),
      role: "admin",
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  )

  await Promise.all([Doctor.deleteMany({}), Patient.deleteMany({})])

  const doctorDocs = await Doctor.insertMany(
    doctors.map((doctor, index) => ({
      ...doctor,
      createdAt: new Date(Date.now() - (index * 23 + 30) * DAY),
      updatedAt: new Date(),
    }))
  )

  const patients = Array.from({ length: 72 }, (_, index) => {
    const first = firstNames[index % firstNames.length]
    const last = lastNames[(index * 7) % lastNames.length]
    const gender = index % 5 === 0 ? "Other" : index % 2 === 0 ? "Female" : "Male"

    // The newest group lands in the current month so the dashboard has
    // meaningful "this month" numbers, while the rest spread over ~6 months.
    const daysAgo = index < 16 ? index % 15 : 15 + Math.floor(((index - 16) / 56) * 160)
    const createdAt = new Date(
      Date.now() - daysAgo * DAY - ((index * 37) % 20) * 60 * 60 * 1000
    )

    return {
      name: `${first} ${last}`,
      age: 22 + ((index * 13) % 58),
      gender,
      condition: conditions[index % conditions.length],
      phone: `+1 (555) ${String(310 + index).padStart(3, "0")}-${String(
        1000 + ((index * 37) % 9000)
      )}`,
      email: `patient${index + 1}.${first}.${last}@example.com`.toLowerCase(),
      doctorId: doctorDocs[index % doctorDocs.length]!._id,
      createdAt,
      updatedAt: createdAt,
    }
  })

  await Patient.insertMany(patients)

  console.log("Seed complete.")
  console.log(`  Doctors:  ${doctorDocs.length}`)
  console.log(`  Patients: ${patients.length}`)
  console.log(`  Admin:    ${adminEmail}`)
  console.log(`  Password: ${adminPassword}`)

  await disconnectFromDatabase()
  process.exit(0)
}

seed().catch(async (error: unknown) => {
  console.error("Seed failed:", error)
  await disconnectFromDatabase()
  process.exit(1)
})
