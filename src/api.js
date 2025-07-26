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
 * Searches for stock symbols AND cryptocurrencies based on keywords.
 * This function now performs two API calls in parallel to get both types of assets.
 */
export const searchSymbols = async (keywords) => {
    if (!keywords) return [];
    if (!apiKey) {
        console.error("Alpha Vantage API Key is missing.");
        return [];
    }

    // 1. API call for traditional stock/ETF search
    const stockSearchUrl = `${API_URL}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${apiKey}`;
    const stockPromise = fetch(stockSearchUrl).then(res => res.json());

    // 2. API call to get a list of all physical currencies to filter out from crypto results
    const physicalCurrencyPromise = fetch(`${API_URL}?function=PHYSICAL_CURRENCY_LIST&apikey=${apiKey}`).then(res => res.json());
    
    // 3. API call to get a list of all digital (crypto) currencies
    const digitalCurrencyPromise = fetch(`${API_URL}?function=DIGITAL_CURRENCY_LIST&apikey=${apiKey}`).then(res => res.json());

    // Log a single API interaction event, even though we make multiple calls
    logApiCall();

    try {
        const [stockData, physicalCurrencyData, digitalCurrencyData] = await Promise.all([stockPromise, physicalCurrencyPromise, digitalCurrencyPromise]);

        // Process stock results
        let stockResults = [];
        if (stockData.bestMatches) {
            stockResults = stockData.bestMatches;
        } else if (stockData.Note) {
            console.warn('Alpha Vantage API Note (Stocks):', stockData.Note);
        }

        // Process crypto results
        let cryptoResults = [];
        
        // **FIX**: Added robust checks to ensure both API responses are valid CSV strings before parsing.
        let physicalCurrencySet = new Set();
        if (physicalCurrencyData && typeof physicalCurrencyData === 'string') {
            physicalCurrencySet = new Set(
                physicalCurrencyData.split('\r\n').slice(1).map(row => row.split(',')[0])
            );
        } else if (physicalCurrencyData && physicalCurrencyData.Note) {
            console.warn('Alpha Vantage API Note (Physical Currencies):', physicalCurrencyData.Note);
        }

        if (digitalCurrencyData && typeof digitalCurrencyData === 'string') {
            const digitalCurrencies = digitalCurrencyData.split('\r\n').slice(1).map(row => {
                const [symbol, name] = row.split(',');
                return { symbol, name };
            });

            const upperKeywords = keywords.toUpperCase();
            cryptoResults = digitalCurrencies
                .filter(({ symbol, name }) => 
                    symbol && name && // Ensure row is valid
                    !physicalCurrencySet.has(symbol) && // Exclude physical currencies like 'USD'
                    (symbol.toUpperCase().includes(upperKeywords) || name.toUpperCase().includes(upperKeywords))
                )
                .map(({ symbol, name }) => ({
                    '1. symbol': symbol,
                    '2. name': name,
                    '3. type': 'Cryptocurrency',
                    '4. region': 'N/A', // Add dummy fields to match stock structure
                    '8. currency': 'USD'
                }));
        } else if (digitalCurrencyData && digitalCurrencyData.Note) {
             console.warn('Alpha Vantage API Note (Crypto):', digitalCurrencyData.Note);
        }

        // Combine and return results, with crypto appearing first
        return [...cryptoResults, ...stockResults];

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
