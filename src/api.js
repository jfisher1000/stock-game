// src/api.js
import { db } from './firebase'; // Import the db instance
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const apiKey = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY;
const API_URL = 'https://www.alphavantage.co/query';

/**
 * Logs a record of an API call to Firestore.
 */
const logApiCall = async () => {
    try {
        await addDoc(collection(db, 'api_logs'), {
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Failed to log API call:", error);
    }
};


/**
 * Searches for stock symbols based on keywords.
 */
export const searchSymbols = async (keywords) => {
    if (!keywords) return [];
    if (!apiKey) {
        console.error("Alpha Vantage API Key is missing.");
        return [];
    }
    try {
        logApiCall(); // Log the API call
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
 */
export const getQuote = async (symbol) => {
    if (!symbol) return null;
    if (!apiKey) {
        console.error("Alpha Vantage API Key is missing.");
        return null;
    }
    try {
        logApiCall(); // Log the API call
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
