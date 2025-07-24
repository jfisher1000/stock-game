// src/api.js

import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

/**
 * This file handles all interactions with the Alpha Vantage API.
 * It's crucial to keep your API key secure. Here, we're reading it 
 * from the environment variables, which is a good practice.
 */
const apiKey = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY;
const API_URL = 'https://www.alphavantage.co/query';

// Since this module is separate from App.js, we need our own Firestore instance
// to write logs. This is a simplified approach for now.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
};
const app = initializeApp(firebaseConfig, "apiLogger"); // Give it a unique name to avoid conflicts
const db = getFirestore(app);

/**
 * Logs a record of an API call to Firestore.
 */
const logApiCall = async () => {
    try {
        // Adds a new document with a server-generated timestamp.
        await addDoc(collection(db, 'api_logs'), {
            timestamp: serverTimestamp()
        });
    } catch (error) {
        // We log the error but don't block the main API call if logging fails.
        console.error("Failed to log API call:", error);
    }
};


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
        logApiCall(); // Log the API call before fetching.
        const response = await fetch(`${API_URL}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${apiKey}`);
        const data = await response.json();
        if (data.Note) {
             console.warn('Alpha Vantage API Note:', data.Note);
             return [];
        }
        return data.bestMatches || [];
    } catch (error) {
        console.error("Error searching symbols:", error);
        return [];
    }
};

/**
 * Fetches the latest price for a given stock symbol.
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
        logApiCall(); // Log the API call before fetching.
        const response = await fetch(`${API_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`);
        const data = await response.json();
        if (data['Global Quote'] && Object.keys(data['Global Quote']).length > 0) {
            return data['Global Quote'];
        } else {
            console.warn("No quote found for symbol:", symbol, data);
            return null;
        }
    } catch (error) {
        console.error("Error fetching quote:", error);
        return null;
    }
};
