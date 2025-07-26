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

// --- Caching Mechanism for the digital currency list ---
const cache = {
    digitalList: null,
    lastFetch: 0,
};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetches the complete list of digital currencies from the API
 * and caches it for 24 hours to avoid exceeding API limits.
 */
const getDigitalCurrencyList = async () => {
    const now = Date.now();
    if (now - cache.lastFetch < CACHE_DURATION && cache.digitalList) {
        console.log("Using cached digital currency list.");
        return cache.digitalList;
    }

    console.log("Fetching and caching new digital currency list...");
    logApiCall();

    try {
        const response = await fetch(`${API_URL}?function=DIGITAL_CURRENCY_LIST&apikey=${apiKey}`);
        // The API returns this data as a CSV string, not JSON.
        const csvData = await response.text(); 
        
        // Handle API errors or rate limiting messages which are returned as text/html
        if (!csvData || typeof csvData !== 'string' || !csvData.startsWith('currency code,currency name')) {
             console.error('Could not fetch or parse digital currency list. Response:', csvData);
             cache.digitalList = []; // Cache empty array on failure
             return [];
        }

        // Parse the CSV data manually. The header is "currency code,currency name"
        const lines = csvData.trim().split('\n');
        const list = lines.slice(1).map(line => { // skip header
            const values = line.split(',');
            if (values.length >= 2) {
                return {
                    symbol: values[0].trim(),
                    name: values.slice(1).join(',').trim() // Join back in case name has commas
                };
            }
            return null;
        }).filter(c => c && c.symbol && c.name); // Filter out any empty/invalid rows

        cache.digitalList = list;
        cache.lastFetch = now;
        return list;

    } catch (error) {
        console.error("Error fetching digital currency list:", error);
        cache.digitalList = []; // Ensure cache is empty on error
        return [];
    }
};


/**
 * Searches for stock symbols (live) and cryptocurrencies (from a cached list) based on keywords.
 */
export const searchSymbols = async (keywords) => {
    if (!keywords) return [];
    if (!apiKey) {
        console.error("Alpha Vantage API Key is missing.");
        return [];
    }

    // 1. Start both searches in parallel.
    const stockSearchPromise = fetch(`${API_URL}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${apiKey}`).then(res => res.json());
    const cryptoListPromise = getDigitalCurrencyList();
    logApiCall(); // Log the stock search call

    try {
        const [stockData, digitalList] = await Promise.all([stockSearchPromise, cryptoListPromise]);

        // 2. Filter the crypto list based on keywords
        const upperKeywords = keywords.toUpperCase();
        const cryptoResults = digitalList
            .filter(({ symbol, name }) =>
                (symbol.toUpperCase().includes(upperKeywords) || name.toUpperCase().includes(upperKeywords))
            )
            .map(({ symbol, name }) => ({
                '1. symbol': symbol,
                '2. name': name,
                '3. type': 'Cryptocurrency',
                '4. region': 'N/A',
                '8. currency': 'USD'
            }));

        // 3. Process stock results from the live API call
        let stockResults = [];
        if (stockData.bestMatches) {
            // Filter out any crypto results that the stock search might accidentally return to avoid duplicates.
            stockResults = stockData.bestMatches.filter(match => match['3. type'] !== 'Cryptocurrency');
        } else if (stockData.Note) {
            console.warn('Alpha Vantage API Note (Stocks):', stockData.Note);
        }

        // 4. Combine and return the results
        return [...cryptoResults, ...stockResults];

    } catch (error) {
        console.error("Error searching symbols:", error);
        return [];
    }
};

/**
 * Fetches the latest price for a given stock or crypto symbol.
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
            // Fallback for crypto, since GLOBAL_QUOTE may not work for them
            logApiCall();
            const cryptoResponse = await fetch(`${API_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=${symbol}&to_currency=USD&apikey=${apiKey}`);
            const cryptoData = await cryptoResponse.json();
            const exchangeRate = cryptoData['Realtime Currency Exchange Rate'];
            if (exchangeRate) {
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
        }
    } catch (error) {
        console.error("Error fetching quote:", error);
        return null;
    }
};
