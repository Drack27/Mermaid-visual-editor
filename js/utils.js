/**
 * Generates a unique ID for a new element.
 * @param {string} prefix - The prefix for the ID.
 * @returns {string} - The unique ID.
 */
export function generateUniqueId(prefix = 'node') {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}