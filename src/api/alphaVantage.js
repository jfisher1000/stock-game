// In Vite, environment variables must be prefixed with VITE_
const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

/**
 * Searches for stocks using the Alpha Vantage API.
 * @param {string} keywords - The search term.
 * @returns {Promise<Array>} A list of matching stocks.
 */
export const searchStocks = async (keywords) => {
    // Add a check for the API key to prevent unnecessary API calls
    if (!API_KEY) {
        console.error("Alpha Vantage API key is missing. Please check your .env file.");
        return [];
    }
    try {
        const response = await fetch(`${BASE_URL}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${API_KEY}`);
        const data = await response.json();
        // The API returns 'bestMatches'
        return data.bestMatches || [];
    } catch (error) {
        console.error('Error fetching stock data:', error);
        return [];
    }
};

/**
 * Fetches the latest price for a given stock symbol.
 * @param {string} symbol - The stock symbol.
 * @returns {Promise<Object|null>} The stock quote data or null if an error occurs.
 */
export const getStockQuote = async (symbol) => {
    if (!API_KEY) {
        console.error("Alpha Vantage API key is missing.");
        return null;
    }
    try {
        const response = await fetch(`${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`);
        const data = await response.json();
        // The quote data is in the 'Global Quote' property
        return data['Global Quote'] || null;
    } catch (error) {
        console.error('Error fetching stock quote:', error);
        return null;
    }
};
