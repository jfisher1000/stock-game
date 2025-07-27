// src/api/alphaVantage.js
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const alphaVantageApiKey = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY;
const ALPHA_VANTAGE_API_URL = 'https://www.alphavantage.co/query';

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
 * Returns a static, hardcoded list of the top cryptocurrencies.
 */
const getTopCryptos = () => {
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

    const stockSearchPromise = fetch(`${ALPHA_VANTAGE_API_URL}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${alphaVantageApiKey}`).then(res => res.json());
    const cryptoList = getTopCryptos();
    logApiCall();

    try {
        const upperKeywords = keywords.toUpperCase();
        const cryptoResults = cryptoList
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

        const stockData = await stockSearchPromise;
        let stockResults = [];
        if (stockData.bestMatches) {
            stockResults = stockData.bestMatches.filter(match => match['3. type'] !== 'Cryptocurrency');
        } else if (stockData.Note) {
            console.warn('Alpha Vantage API Note (Stocks):', stockData.Note);
        }

        return [...cryptoResults, ...stockResults];

    } catch (error) {
        console.error("Error during symbol search:", error);
        return [];
    }
};

/**
 * Fetches the latest price for a given stock or crypto symbol using the correct endpoint for each.
 */
export const getQuote = async (symbol) => {
    if (!symbol) return null;
    if (!alphaVantageApiKey) {
        console.error("Alpha Vantage API Key is missing.");
        return null;
    }

    const cryptoList = getTopCryptos();
    const isCrypto = cryptoList.some(c => c.symbol === symbol);

    logApiCall();

    if (isCrypto) {
        // --- CRYPTOCURRENCY PRICE LOGIC ---
        try {
            const response = await fetch(`${ALPHA_VANTAGE_API_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=${symbol}&to_currency=USD&apikey=${alphaVantageApiKey}`);
            const data = await response.json();
            const exchangeRate = data['Realtime Currency Exchange Rate'];

            if (exchangeRate && exchangeRate['5. Exchange Rate']) {
                return {
                    '01. symbol': exchangeRate['1. From_Currency Code'],
                    '02. name': exchangeRate['2. From_Currency Name'],
                    '05. price': exchangeRate['5. Exchange Rate'],
                    '09. change': '0',
                    '10. change percent': '0.00%'
                };
            } else {
                console.error("Crypto quote fetch failed for:", symbol, data);
                return null;
            }
        } catch (error) {
            console.error(`Error fetching crypto quote for ${symbol}:`, error);
            return null;
        }
    } else {
        // --- STOCK PRICE LOGIC ---
        try {
            const response = await fetch(`${ALPHA_VANTAGE_API_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${alphaVantageApiKey}`);
            const data = await response.json();
            
            if (data['Global Quote'] && Object.keys(data['Global Quote']).length > 0 && data['Global Quote']['05. price']) {
                return data['Global Quote'];
            } else {
                console.error("Stock quote fetch failed for:", symbol, data);
                return null;
            }
        } catch (error) {
            console.error(`Error fetching stock quote for ${symbol}:`, error);
            return null;
        }
    }
};
