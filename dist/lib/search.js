export function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
/**
 * Splits a search string into words and requires each word to match at least
 * one of the supplied fields. The input is escaped, so a stray "(" can never
 * become part of the regular expression.
 */
export function buildSearchFilter(query, fields) {
    const terms = query
        .split(/\s+/)
        .map((term) => term.trim())
        .filter(Boolean)
        .slice(0, 4);
    if (terms.length === 0) {
        return null;
    }
    return {
        $and: terms.map((term) => ({
            $or: fields.map((field) => ({
                [field]: { $regex: escapeRegex(term), $options: "i" },
            })),
        })),
    };
}
//# sourceMappingURL=search.js.map