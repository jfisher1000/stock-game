/**
 * Formats a number into a currency string (e.g., $1,234.56).
 * @param {number} amount - The number to format.
 * @returns {string} The formatted currency string.
 */
// **FIXED**: Added the 'export' keyword.
export const formatCurrency = (amount) => {
  if (typeof amount !== 'number') {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Formats a Firestore Timestamp or Date object into a readable string (e.g., Jul 27, 2025).
 * @param {object | Date} timestamp - The Firestore Timestamp or Date object.
 * @returns {string} The formatted date string.
 */
// **FIXED**: Added the 'export' keyword.
export const formatDate = (timestamp) => {
  if (!timestamp) {
    return 'N/A';
  }
  // Convert Firestore Timestamp to JavaScript Date if necessary
  const date = timestamp.toDate ? timestamp.toDate() : timestamp;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};
