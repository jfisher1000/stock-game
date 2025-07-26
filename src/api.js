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

// --- Caching Mechanism for currency lists ---
const cache = {
    digitalList: null,
    physicalSet: null,
    lastFetch: 0,
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetches the complete lists of digital and physical currencies from the API
 * and caches them for 24 hours to avoid exceeding API limits.
 */
const getCurrencyLists = async () => {
    const now = Date.now();
    if (now - cache.lastFetch < CACHE_DURATION && cache.digitalList) {
        return { digitalList: cache.digitalList, physicalSet: cache.physicalSet };
    }

    console.log("Fetching and caching currency lists...");
    logApiCall(); // Log this as one interaction for both list fetches
    
    const physicalCurrencyPromise = fetch(`${API_URL}?function=PHYSICAL_CURRENCY_LIST&apikey=${apiKey}`).then(res => res.json());
    const digitalCurrencyPromise = fetch(`${API_URL}?function=DIGITAL_CURRENCY_LIST&apikey=${apiKey}`).then(res => res.json());

    const [physicalCurrencyData, digitalCurrencyData] = await Promise.all([physicalCurrencyPromise, digitalCurrencyPromise]);

    if (physicalCurrencyData && typeof physicalCurrencyData === 'string') {
        cache.physicalSet = new Set(
            physicalCurrencyData.split('\r\n').slice(1).map(row => row.split(',')[0]).filter(Boolean)
        );
    } else {
        console.warn('Could not fetch or parse physical currency list.', physicalCurrencyData);
        cache.physicalSet = new Set(); // Default to empty set on failure
    }

    if (digitalCurrencyData && typeof digitalCurrencyData === 'string') {
        cache.digitalList = digitalCurrencyData.split('\r\n').slice(1).map(row => {
            const [symbol, name] = row.split(',');
            return { symbol, name };
        }).filter(c => c.symbol && c.name); // Filter out any empty/invalid rows
    } else {
        console.warn('Could not fetch or parse digital currency list.', digitalCurrencyData);
        cache.digitalList = []; // Default to empty array on failure
    }
    
    cache.lastFetch = now;
    return { digitalList: cache.digitalList, physicalSet: cache.physicalSet };
};

/**
 * Searches for stock symbols (live) and cryptocurrencies (from cache) based on keywords.
 */
export const searchSymbols = async (keywords) => {
    if (!keywords) return [];
    if (!apiKey) {
        console.error("Alpha Vantage API Key is missing.");
        return [];
    }

    // 1. Get currency lists (from cache or new fetch)
    const { digitalList, physicalSet } = await getCurrencyLists();

    // 2. Perform the live stock search
    const stockSearchUrl = `${API_URL}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${apiKey}`;
    const stockPromise = fetch(stockSearchUrl).then(res => res.json());
    logApiCall();

    try {
        // 3. Filter the cached crypto list based on keywords
        const upperKeywords = keywords.toUpperCase();
        const cryptoResults = digitalList
            .filter(({ symbol, name }) => 
                !physicalSet.has(symbol) &&
                (symbol.toUpperCase().includes(upperKeywords) || name.toUpperCase().includes(upperKeywords))
            )
            .map(({ symbol, name }) => ({
                '1. symbol': symbol,
                '2. name': name,
                '3. type': 'Cryptocurrency',
                '4. region': 'N/A',
                '8. currency': 'USD'
            }));

        // 4. Process stock results from the live API call
        const stockData = await stockPromise;
        let stockResults = [];
        if (stockData.bestMatches) {
            stockResults = stockData.bestMatches;
        } else if (stockData.Note) {
            console.warn('Alpha Vantage API Note (Stocks):', stockData.Note);
        }

        // 5. Combine and return
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
            const cryptoResponse = await fetch(`${API_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=${symbol}&to_currency=USD&apikey=${apiKey}`);
            const cryptoData = await cryptoResponse.json();
            const exchangeRate = cryptoData['Realtime Currency Exchange Rate'];
            if (exchangeRate) {
                 return {
                    '01. symbol': exchangeRate['1. From_Currency Code'],
                    '2. name': exchangeRate['2. From_Currency Name'],
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
            console.warn("No quote found for symbol:", symbol, data);
            return null;
        }
    } catch (error) {
        console.error("Error fetching quote:", error);
        return null;
    }
};
