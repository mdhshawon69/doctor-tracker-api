export const SPECIALIZATIONS = [
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "Dermatology",
  "Internal Medicine",
  "Gynecology",
  "Endocrinology",
  "Pulmonology",
  "Gastroenterology",
  "Urology",
  "General Surgery",
] as const

export const CONDITIONS = [
  "Hypertension",
  "Diabetes",
  "Asthma",
  "Arthritis",
  "Migraine",
  "Allergy",
  "Cardiac Care",
  "Thyroid",
] as const

export const GENDERS = ["Male", "Female", "Other"] as const

export const DATE_RANGES = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "year", label: "This year" },
] as const

export type DateRange = (typeof DATE_RANGES)[number]["value"]

// The API caps page size so a single request can never pull the whole collection.
export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 50
