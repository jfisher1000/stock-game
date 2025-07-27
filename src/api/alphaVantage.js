// src/api/alphaVantage.js

// Vite uses import.meta.env to access environment variables
const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

/**
 * Fetches a quote for a given stock symbol from Alpha Vantage.
 * @param {string} symbol The stock symbol (e.g., 'AAPL').
 * @returns {Promise<object>} A promise that resolves to the quote data.
 */
export const getQuote = async (symbol) => {
    try {
        const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data['Error Message']) {
            throw new Error(data['Error Message']);
        }
        if (data['Note']) {
            console.warn('Alpha Vantage API Note:', data['Note']);
            // This can indicate hitting the API limit.
        }
        return data['Global Quote'];
    } catch (error) {
        console.error("Error fetching quote for", symbol, ":", error);
        throw error; // Re-throw the error to be handled by the caller
    }
};

/**
 * Searches for stock symbols matching the given keywords.
 * @param {string} keywords The search keywords (e.g., 'Apple').
 * @returns {Promise<Array>} A promise that resolves to an array of matching symbols.
 */
export const searchSymbols = async (keywords) => {
    try {
        const url = `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data['Error Message']) {
            throw new Error(data['Error Message']);
        }
        if (data['Note']) {
            console.warn('Alpha Vantage API Note:', data['Note']);
        }
        return data.bestMatches || [];
    } catch (error) {
        console.error("Error searching symbols for", keywords, ":", error);
        throw error;
    }
};
