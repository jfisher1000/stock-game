// src/api.js

/**
 * This file handles all interactions with the Alpha Vantage API.
 * It's crucial to keep your API key secure. Here, we're reading it 
 * from the environment variables, which is a good practice.
 * This key is DIFFERENT from the Firebase API key.
 */
const apiKey = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY; // Corrected to use the Alpha Vantage specific key
const API_URL = 'https://www.alphavantage.co/query';

/**
 * Searches for stock symbols based on keywords.
 * @param {string} keywords The search term (e.g., "Apple", "AAPL").
 * @returns {Promise<Array>} A promise that resolves to an array of search results.
 */
export const searchSymbols = async (keywords) => {
    if (!keywords) return [];
    if (!apiKey) {
        console.error("Alpha Vantage API Key is missing. Please add REACT_APP_ALPHA_VANTAGE_API_KEY to your .env file.");
        return [];
    }
    try {
        const response = await fetch(`${API_URL}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${apiKey}`);
        const data = await response.json();
        // The API returns a `bestMatches` array. We return it if it exists.
        // Also handles the API limit note, which doesn't have `bestMatches`.
        if (data.Note) {
             console.warn('Alpha Vantage API Note:', data.Note);
             return [];
        }
        return data.bestMatches || [];
    } catch (error) {
        console.error("Error searching symbols:", error);
        // Return an empty array in case of an error to prevent app crashes.
        return [];
    }
};

/**
 * Fetches the latest price for a given stock symbol.
 * We use the GLOBAL_QUOTE endpoint for this, as it provides a concise summary.
 * @param {string} symbol The stock symbol (e.g., "IBM").
 * @returns {Promise<Object|null>} A promise that resolves to the quote data or null if an error occurs.
 */
export const getQuote = async (symbol) => {
    if (!symbol) return null;
    if (!apiKey) {
        console.error("Alpha Vantage API Key is missing. Please add REACT_APP_ALPHA_VANTAGE_API_KEY to your .env file.");
        return null;
    }
    try {
        const response = await fetch(`${API_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`);
        const data = await response.json();
        // The quote data is nested under "Global Quote".
        if (data['Global Quote'] && Object.keys(data['Global Quote']).length > 0) {
            return data['Global Quote'];
        } else {
            // Handle cases where the API returns an empty object for an invalid symbol or API limit reached
            console.warn("No quote found for symbol:", symbol, data);
            return null;
        }
    } catch (error) {
        console.error("Error fetching quote:", error);
        return null;
    }
};
