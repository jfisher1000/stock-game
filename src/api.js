// src/api.js
import { db } from './firebase';
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
 * Searches for stock and cryptocurrency symbols using a single, efficient API call.
 * The SYMBOL_SEARCH endpoint returns assets of all types, including stocks and crypto.
 */
export const searchSymbols = async (keywords) => {
    if (!keywords) return [];
    if (!apiKey) {
        console.error("Alpha Vantage API Key is missing.");
        return [];
    }

    const searchUrl = `${API_URL}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${apiKey}`;
    
    try {
        logApiCall();
        const response = await fetch(searchUrl);
        const data = await response.json();

        // --- DEBUGGING: Log the raw API response ---
        console.log('Raw Alpha Vantage API Response:', data);
        // --- END DEBUGGING ---

        if (data.bestMatches) {
            // The API returns both stocks and cryptos. No further action needed.
            return data.bestMatches;
        } 
        
        if (data.Note) {
            // This handles cases where the API limit is reached.
            console.warn('Alpha Vantage API Note:', data.Note);
            return [];
        } 
        
        // Handle other unexpected responses
        console.warn('Unexpected response from symbol search:', data);
        return [];
        
    } catch (error) {
        console.error("Error searching symbols:", error);
        return [];
    }
};

/**
 * Fetches the latest price for a given stock or crypto symbol.
 * It attempts to get a standard global quote, and falls back to a currency
 * exchange rate check if the global quote fails (common for cryptocurrencies).
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

        // Check if the Global Quote has data.
        if (data['Global Quote'] && Object.keys(data['Global Quote']).length > 0) {
            return data['Global Quote'];
        } 
        
        // If not, it might be a cryptocurrency. Try the currency exchange endpoint.
        logApiCall(); // This is a second API call, so we log it.
        const cryptoResponse = await fetch(`${API_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=${symbol}&to_currency=USD&apikey=${apiKey}`);
        const cryptoData = await cryptoResponse.json();
        const exchangeRate = cryptoData['Realtime Currency Exchange Rate'];

        if (exchangeRate) {
             // Format the crypto data to look like a regular quote for consistency.
             return {
                '01. symbol': exchangeRate['1. From_Currency Code'],
                '02. name': exchangeRate['2. From_Currency Name'],
                '02. open': 'N/A',
                '03. high': 'N/A',
                '04. low': 'N/A',
                '05. price': exchangeRate['5. Exchange Rate'],
                '06. volume': 'N/A',
                '07. latest trading day': 'N/A',
                '08. previous close': 'N/A',
                '09. change': '0', // Crypto API doesn't provide change
                '10. change percent': '0.00%'
            };
        }
        
        console.warn("No quote found for symbol:", symbol, data, cryptoData);
        return null;
        
    } catch (error) {
        console.error("Error fetching quote:", error);
        return null;
    }
};
