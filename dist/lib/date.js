import { startOfYear, subDays } from "date-fns";
/**
 * Turns the short range value used by the UI into a date used by Mongo.
 * Everything is calculated in the server's local timezone for predictable
 * "today" boundaries in development and production.
 */
export function rangeStart(range, now = new Date()) {
    switch (range) {
        case "7d":
            return subDays(now, 7);
        case "30d":
            return subDays(now, 30);
        case "90d":
            return subDays(now, 90);
        case "year":
            return startOfYear(now);
        default:
            return null;
    }
}
//# sourceMappingURL=date.js.map