export type SessionUser = {
  id: string
  name: string
  email: string
  role: "admin"
}

export type UserSummary = {
  id: string
  name: string
  email: string
  role: "admin"
  createdAt: string
}

export type DoctorSummary = {
  id: string
  name: string
  specialization: string
  hospital: string
  phone: string
  email: string
  patientCount: number
  createdAt: string
}

export type PatientDoctor = {
  id: string
  name: string
  specialization: string
}

export type PatientRecord = {
  id: string
  name: string
  age: number
  gender: string
  condition: string
  phone: string
  email: string
  doctor: PatientDoctor | null
  createdAt: string
}

export type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type Paginated<T> = {
  data: T[]
  pagination: Pagination
}

export type DashboardDoctor = {
  id: string
  name: string
  specialization: string
  hospital: string
  patientCount: number
}

export type DashboardCondition = {
  name: string
  count: number
}

export type DashboardGrowth = {
  month: string
  label: string
  count: number
}

export type DashboardData = {
  totals: {
    doctors: number
    patients: number
    patientsThisMonth: number
    patientsLastMonth: number
    specializations: number
    averagePatients: number
  }
  patientsPerDoctor: DashboardDoctor[]
  conditions: DashboardCondition[]
  growth: DashboardGrowth[]
  recentPatients: PatientRecord[]
}

export type FilterOptions = {
  specializations: string[]
  hospitals: string[]
  conditions: string[]
}
