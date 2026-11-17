import { startOfYear, subDays } from "date-fns"

import type { DateRange } from "../constants.js"

/**
 * Turns the short range value used by the UI into a date used by Mongo.
 * Everything is calculated in the server's local timezone for predictable
 * "today" boundaries in development and production.
 */
export function rangeStart(range: DateRange, now = new Date()): Date | null {
  switch (range) {
    case "7d":
      return subDays(now, 7)
    case "30d":
      return subDays(now, 30)
    case "90d":
      return subDays(now, 90)
    case "year":
      return startOfYear(now)
    default:
      return null
  }
}
