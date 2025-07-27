// src/api/alphaVantage.js

/**
 * @fileoverview Alpha Vantage API Service.
 *
 * This module provides functions for interacting with the Alpha Vantage API
 * to fetch stock market data. It uses the API key from the centralized
 * environment configuration, ensuring that all API requests are properly
 * authenticated. The functions are designed to handle the specifics of the
 * Alpha Vantage API, such as its data structure and potential error responses.
 */

import env from '../config/environment';

// Base URL for the Alpha Vantage API.
const BASE_URL = 'https://www.alphavantage.co/query';

// --- Core API Functions ---

/**
 * Fetches the latest quote for a given stock symbol.
 * @param {string} symbol - The stock symbol (e.g., 'AAPL').
 * @returns {Promise<object>} A promise that resolves to the quote data.
 * @throws {Error} If the API call fails or returns an error message.
 */
export const getQuote = async (symbol) => {
  // Construct the full URL with the function, symbol, and API key.
  const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${env.alphaVantage.apiKey}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Handle non-2xx HTTP responses.
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Alpha Vantage returns an error message in the response body for invalid symbols
    // or other API-level issues. We need to check for this.
    if (data['Error Message']) {
      throw new Error(`Alpha Vantage API Error: ${data['Error Message']}`);
    }
    
    // The main data is nested under the 'Global Quote' key.
    if (!data['Global Quote'] || Object.keys(data['Global Quote']).length === 0) {
        throw new Error('No quote data found for the symbol. It may be invalid.');
    }

    return data['Global Quote'];
  } catch (error) {
    console.error(`[AlphaVantage API] Error fetching quote for ${symbol}:`, error);
    // Re-throw the error to be handled by the calling function.
    throw error;
  }
};

/**
 * Searches for stock symbols matching a given keyword.
 * @param {string} keywords - The search keywords (e.g., 'Apple').
 * @returns {Promise<Array<object>>} A promise that resolves to an array of matching symbols.
 * @throws {Error} If the API call fails.
 */
export const searchSymbols = async (keywords) => {
  // Construct the URL for the SYMBOL_SEARCH function.
  const url = `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${env.alphaVantage.apiKey}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // The search results are under the 'bestMatches' key.
    return data.bestMatches || [];
  } catch (error) {
    console.error(`[AlphaVantage API] Error searching for symbols with keywords "${keywords}":`, error);
    throw error;
  }
};
