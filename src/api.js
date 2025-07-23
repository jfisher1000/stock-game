// src/api.js

/**
 * This file handles all interactions with the Alpha Vantage API.
 * It's crucial to keep your API key secure. Here, we're reading it 
 * from the environment variables, which is a good practice.
 */
const apiKey = process.env.REACT_APP_API_KEY;
const API_URL = 'https://www.alphavantage.co/query';

/**
 * Debounce function to limit the rate at which a function gets called.
 * This is essential for the search functionality to prevent sending a request
 * to the API on every single keystroke, which is inefficient and could
 * quickly exhaust your API call limit.
 * @param {Function} func The function to debounce.
 * @param {number} delay The delay in milliseconds.
 * @returns {Function} The debounced function.
 */
const debounce = (func, delay) => {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
};

/**
 * Searches for stock symbols based on keywords.
 * @param {string} keywords The search term (e.g., "Apple", "AAPL").
 * @returns {Promise<Array>} A promise that resolves to an array of search results.
 */
const searchSymbols = async (keywords) => {
    if (!keywords) return [];
    try {
        const response = await fetch(`${API_URL}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${apiKey}`);
        const data = await response.json();
        // The API returns a `bestMatches` array. We return it if it exists.
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
const getQuote = async (symbol) => {
    if (!symbol) return null;
    try {
        const response = await fetch(`${API_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`);
        const data = await response.json();
        // The quote data is nested under "Global Quote".
        if (data['Global Quote'] && Object.keys(data['Global Quote']).length > 0) {
            return data['Global Quote'];
        } else {
            // Handle cases where the API returns an empty object for an invalid symbol
            console.warn("No quote found for symbol:", symbol, data);
            return null;
        }
    } catch (error) {
        console.error("Error fetching quote:", error);
        return null;
    }
};


// We wrap the searchSymbols function with a 500ms debounce.
export const debouncedSearchSymbols = debounce(searchSymbols, 500);
export { getQuote };
