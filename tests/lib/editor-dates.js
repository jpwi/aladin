/**
 * Editor date utilities - ES Module version for testing
 */

/**
 * Format date as YYYY-MM-DD string (ISO date format)
 * @param {Date} date - The date to format
 * @returns {string} Date in YYYY-MM-DD format
 */
export function formatDateISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get date options for @ command menu
 */
export const dateOptions = [
    {
        name: "today",
        getDate: function () { return formatDateISO(new Date()); }
    },
    {
        name: "yesterday",
        getDate: function () { const d = new Date(); d.setDate(d.getDate() - 1); return formatDateISO(d); }
    },
    {
        name: "tomorrow",
        getDate: function () { const d = new Date(); d.setDate(d.getDate() + 1); return formatDateISO(d); }
    },
    {
        name: "next week",
        getDate: function () { const d = new Date(); d.setDate(d.getDate() + 7); return formatDateISO(d); }
    },
    {
        name: "next month",
        getDate: function () { const d = new Date(); return formatDateISO(new Date(d.getFullYear(), d.getMonth() + 1, d.getDate())); }
    },
];

export default { formatDateISO, dateOptions };
