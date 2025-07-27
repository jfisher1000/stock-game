// src/utils/formatters.js
import { Timestamp } from 'firebase/firestore';

/**
 * Formats a Firestore timestamp into a readable date string.
 * @param {Timestamp} ts - The Firestore timestamp object.
 * @returns {string} - The formatted date string (e.g., "7/26/2025").
 */
export const formatDate = (ts) => ts ? new Date(ts.seconds * 1000).toLocaleDateString() : 'N/A';

/**
 * Formats a number into a US dollar currency string.
 * @param {number} amount - The number to format.
 * @returns {string} - The formatted currency string (e.g., "$100,000.00").
 */
export const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

/**
 * Sanitizes a stock symbol to be used as a valid Firestore document ID.
 * Replaces periods with underscores.
 * @param {string} symbol - The stock symbol (e.g., "BRK.B").
 * @returns {string} - The sanitized symbol (e.g., "BRK_B").
 */
export const sanitizeSymbolForFirestore = (symbol) => symbol.replace(/\./g, '_');

/**
 * Determines the status of a competition based on its start and end dates.
 * @param {Timestamp} startDate - The competition's start date.
 * @param {Timestamp} endDate - The competition's end date.
 * @returns {{text: string, color: string}} - An object with the status text and a corresponding Tailwind CSS color class.
 */
export const getCompetitionStatus = (startDate, endDate) => {
    const now = new Date();
    const start = startDate ? startDate.toDate() : null;
    const end = endDate ? endDate.toDate() : null;

    if (!start || !end) return { text: 'Invalid Dates', color: 'bg-gray-500' };

    if (now < start) return { text: 'Upcoming', color: 'bg-blue-500' };
    if (now > end) return { text: 'Ended', color: 'bg-red-700' };
    return { text: 'Active', color: 'bg-green-500' };
};
