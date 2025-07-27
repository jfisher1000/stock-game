import { env } from '@/config/environment'; // Import the centralized config

const API_KEY = env.alphaVantage.apiKey; // Use the key from the config
const BASE_URL = 'https://www.alphavantage.co/query';

/**
 * Fetches the latest quote for a given stock symbol.
 * @param {string} symbol - The stock symbol (e.g., 'IBM').
 * @returns {Promise<object|null>} A promise that resolves to the quote data or null if an error occurs.
 */
export const getQuote = async (symbol) => {
  const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data['Global Quote']) {
      return data['Global Quote'];
    }
    return null;
  } catch (error) {
    console.error('Error fetching quote:', error);
    return null;
  }
};

/**
 * Searches for stocks based on keywords.
 * @param {string} keywords - The search keywords (e.g., 'Microsoft').
 * @returns {Promise<Array<object>>} A promise that resolves to an array of matching stocks.
 */
export const searchStocks = async (keywords) => {
  const url = `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.bestMatches || [];
  } catch (error) {
    console.error('Error searching stocks:', error);
    return [];
  }
};
