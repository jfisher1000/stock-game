// src/api.js
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const alphaVantageApiKey = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY;
const ALPHA_VANTAGE_API_URL = 'https://www.alphavantage.co/query';

/**
 * Logs a record of an API call to Firestore.
 * This should primarily be used for Alpha Vantage calls to monitor usage.
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
 * Returns a static, hardcoded list of the top cryptocurrencies.
 * This requires no API key and makes no network calls, making it free and reliable.
 */
const getTopCryptos = () => {
    console.log("Using hardcoded crypto list.");
    return [
        { symbol: 'BTC', name: 'Bitcoin' },
        { symbol: 'ETH', name: 'Ethereum' },
        { symbol: 'USDT', name: 'Tether' },
        { symbol: 'BNB', name: 'BNB' },
        { symbol: 'SOL', name: 'Solana' },
        { symbol: 'XRP', name: 'XRP' },
        { symbol: 'USDC', name: 'USD Coin' },
        { symbol: 'ADA', name: 'Cardano' },
        { symbol: 'AVAX', name: 'Avalanche' },
        { symbol: 'DOGE', name: 'Dogecoin' },
        { symbol: 'DOT', name: 'Polkadot' },
        { symbol: 'TRX', name: 'TRON' },
        { symbol: 'LINK', name: 'Chainlink' },
        { symbol: 'MATIC', name: 'Polygon' },
        { symbol: 'ICP', name: 'Internet Computer' },
        { symbol: 'BCH', name: 'Bitcoin Cash' },
        { symbol: 'LTC', name: 'Litecoin' },
        { symbol: 'NEAR', name: 'NEAR Protocol' },
        { symbol: 'UNI', name: 'Uniswap' },
        { symbol: 'LEO', name: 'LEO Token' },
        { symbol: 'SHIB', name: 'Shiba Inu' },
        { symbol: 'DAI', name: 'Dai' },
        { symbol: 'ATOM', name: 'Cosmos' },
        { symbol: 'ETC', name: 'Ethereum Classic' },
        { symbol: 'XLM', name: 'Stellar' },
    ];
};


/**
 * Searches for stocks (live from Alpha Vantage) and cryptocurrencies (from a hardcoded list).
 */
export const searchSymbols = async (keywords) => {
    if (!keywords) return [];
    if (!alphaVantageApiKey) {
        console.error("Alpha Vantage API Key is missing.");
        return [];
    }

    // 1. Get the crypto list (instantly, from our hardcoded list) and start the stock search.
    const stockSearchPromise = fetch(`${ALPHA_VANTAGE_API_URL}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${alphaVantageApiKey}`).then(res => res.json());
    const cryptoList = getTopCryptos();
    logApiCall(); // Log the Alpha Vantage stock search call

    try {
        // 2. Filter the crypto list based on keywords
        const upperKeywords = keywords.toUpperCase();
        const cryptoResults = cryptoList
            .filter(({ symbol, name }) =>
                (symbol.includes(upperKeywords) || name.toUpperCase().includes(upperKeywords))
            )
            .map(({ symbol, name }) => ({
                '1. symbol': symbol,
                '2. name': name,
                '3. type': 'Cryptocurrency',
                '4. region': 'N/A',
                '8. currency': 'USD'
            }));

        // 3. Process stock results from the live API call
        const stockData = await stockSearchPromise;
        let stockResults = [];
        if (stockData.bestMatches) {
            stockResults = stockData.bestMatches.filter(match => match['3. type'] !== 'Cryptocurrency');
        } else if (stockData.Note) {
            console.warn('Alpha Vantage API Note (Stocks):', stockData.Note);
        }

        // 4. Combine and return the results
        return [...cryptoResults, ...stockResults];

    } catch (error) {
        console.error("Error during symbol search:", error);
        return [];
    }
};

/**
 * Fetches the latest price for a given stock or crypto symbol using Alpha Vantage.
 */
export const getQuote = async (symbol) => {
    if (!symbol) return null;
    if (!alphaVantageApiKey) {
        console.error("Alpha Vantage API Key is missing.");
        return null;
    }
    try {
        // Alpha Vantage is good for getting quotes for both stocks and major cryptos.
        logApiCall();
        const response = await fetch(`${ALPHA_VANTAGE_API_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${alphaVantageApiKey}`);
        const data = await response.json();
        
        if (data['Global Quote'] && Object.keys(data['Global Quote']).length > 0) {
            return data['Global Quote'];
        } 
        
        // If GLOBAL_QUOTE fails, it might be a crypto. Try the currency exchange endpoint as a fallback.
        logApiCall();
        const cryptoResponse = await fetch(`${ALPHA_VANTAGE_API_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=${symbol}&to_currency=USD&apikey=${alphaVantageApiKey}`);
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
                '09. change': '0', // This endpoint doesn't provide change info
                '10. change percent': '0.00%'
            };
        }
        
        console.warn("No quote found for symbol:", symbol, data, cryptoData);
        return null;
        
    } catch (error) {
        console.error("Error fetching quote for symbol:", symbol, error);
        return null;
    }
};
