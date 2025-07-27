// src/utils/formatters.js

/**
 * Safely formats a number as a US currency string.
 * Returns a default string if the input is not a valid number.
 * @param {any} amount - The value to format.
 * @returns {string} The formatted currency string.
 */
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
 * Safely formats a number as a percentage string.
 * Returns a default string if the input is not a valid number.
 * @param {any} amount - The value to format.
 * @returns {string} The formatted percentage string.
 */
export const formatPercentage = (amount) => {
    if (typeof amount !== 'number') {
        return '0.00%';
    }
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Sanitizes a stock symbol for use as a Firestore document ID.
 * Replaces invalid characters (like '.') with underscores.
 * @param {string} symbol - The stock symbol to sanitize.
 * @returns {string} The sanitized symbol.
 */
export const sanitizeSymbolForFirestore = (symbol) => {
    if (typeof symbol !== 'string') {
        return '';
    }
    return symbol.replace(/\./g, '_');
};
