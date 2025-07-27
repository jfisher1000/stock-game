import React, { useState, useEffect } from 'react';
import { db } from '../../api/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { getQuote } from '../../api/alphaVantage';
import { formatCurrency, sanitizeSymbolForFirestore } from '../../utils/formatters';
import { TrendingUpIcon, TrendingDownIcon } from '../common/Icons';

const TradeModal = ({ user, competitionId, asset, stockPrices, onClose }) => {
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tradeType, setTradeType] = useState('buy');
    const [shares, setShares] = useState('1'); // Use string to allow decimal input
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);
    
    const symbol = asset['1. symbol'];
    const assetType = asset['3. type'];
    const isCrypto = assetType === 'Cryptocurrency';

    useEffect(() => {
        const fetchQuote = async () => {
            setLoading(true);
            const quoteData = await getQuote(symbol);
            setQuote(quoteData);
            setLoading(false);
        };
        fetchQuote();
    }, [symbol]);

    const handleTrade = async () => {
        const tradeShares = parseFloat(shares);
        if (isNaN(tradeShares) || tradeShares <= 0) {
            setError('Please enter a positive number of shares.');
            return;
        }
        setProcessing(true);
        setError('');

        const price = parseFloat(quote['05. price']);
        if (isNaN(price)) {
            setError('Could not determine asset price. Please try again.');
            setProcessing(false);
            return;
        }

        const totalCost = tradeShares * price;
        const participantRef = doc(db, 'competitions', competitionId, 'participants', user.uid);
        const sanitizedSymbol = sanitizeSymbolForFirestore(symbol);

        try {
            await runTransaction(db, async (transaction) => {
                const participantDoc = await transaction.get(participantRef);
                if (!participantDoc.exists()) {
                    throw new Error("Your participant data could not be found.");
                }

                const data = participantDoc.data();
                const currentCash = data.cash;
                const currentHoldings = data.holdings || {};
                let newHoldings = { ...currentHoldings };
                let newCash;

                if (tradeType === 'buy') {
                    if (currentCash < totalCost) {
                        throw new Error("Not enough cash to complete this purchase.");
                    }
                    newCash = currentCash - totalCost;
                    const existingHolding = newHoldings[sanitizedSymbol] || { shares: 0, totalCost: 0 };
                    
                    const newShares = existingHolding.shares + tradeShares;
                    const newTotalCost = existingHolding.totalCost + totalCost;
                    const newAvgCost = newTotalCost / newShares;
                    
                    newHoldings[sanitizedSymbol] = { 
                        shares: newShares, 
                        avgCost: newAvgCost, 
                        totalCost: newTotalCost, 
                        name: asset['2. name'] || symbol,
                        originalSymbol: symbol,
                        assetType: assetType || 'Equity'
                    };

                } else { // Sell
                    const existingHolding = newHoldings[sanitizedSymbol];
                    if (!existingHolding || tradeShares > existingHolding.shares) {
                        throw new Error("You don't own enough shares to sell.");
                    }
                    newCash = currentCash + totalCost;
                    const newShares = existingHolding.shares - tradeShares;
                    
                    if (newShares < 0.00001) { // Use a small threshold for float comparison
                        delete newHoldings[sanitizedSymbol];
                    } else {
                        const newTotalCost = existingHolding.totalCost - (tradeShares * existingHolding.avgCost);
                        newHoldings[sanitizedSymbol] = {
                            ...existingHolding,
                            shares: newShares,
                            totalCost: newTotalCost,
                        };
                    }
                }

                // Recalculate total portfolio value
                let newTotalStockValue = 0;
                for (const holding of Object.values(newHoldings)) {
                     // **BUG FIX**: Use the live price for the asset being traded for the most accurate calculation
                    const isCurrentAsset = holding.originalSymbol === symbol;
                    const holdingPrice = isCurrentAsset ? price : (stockPrices[holding.originalSymbol]?.price || holding.avgCost);
                    newTotalStockValue += holdingPrice * holding.shares;
                }
                const newPortfolioValue = newCash + newTotalStockValue;

                transaction.update(participantRef, {
                    cash: newCash,
                    holdings: newHoldings,
                    portfolioValue: newPortfolioValue
                });
            });
            onClose();
        } catch (e) {
            console.error("Transaction failed: ", e);
            setError(e.message || "An unexpected error occurred during the transaction.");
            setProcessing(false);
        }
    };

    const currentPrice = quote ? parseFloat(quote['05. price']) : 0;
    const change = quote ? parseFloat(quote['09. change']) : 0;
    const isPositiveChange = change >= 0;
    const totalValue = isNaN(parseFloat(shares)) ? 0 : parseFloat(shares) * currentPrice;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-card p-8 rounded-lg w-full max-w-md text-white">
                {loading ? <p>Loading quote...</p> : !quote ? <p>Could not retrieve quote for {symbol}.</p> : (
                    <>
                        <h2 className="text-2xl font-bold mb-1">{symbol}</h2>
                        <p className="text-gray-400 mb-4">{asset['2. name'] || 'N/A'}</p>
                        <div className="text-4xl font-bold mb-1 flex items-center gap-4">
                            {formatCurrency(currentPrice)}
                            <span className={`text-lg font-semibold flex items-center ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
                                {isPositiveChange ? <TrendingUpIcon /> : <TrendingDownIcon />}
                                {formatCurrency(change)} ({quote['10. change percent']})
                            </span>
                        </div>
                        <div className="flex border border-white/20 rounded-md my-6">
                            <button onClick={() => setTradeType('buy')} className={`w-1/2 p-3 rounded-l-md ${tradeType === 'buy' ? 'bg-primary' : 'hover:bg-white/10'}`}>Buy</button>
                            <button onClick={() => setTradeType('sell')} className={`w-1/2 p-3 rounded-r-md ${tradeType === 'sell' ? 'bg-danger' : 'hover:bg-white/10'}`}>Sell</button>
                        </div>
                        <div className="mb-4">
                            <label className="block mb-2">Shares</label>
                            <input 
                                type="number" 
                                value={shares} 
                                onChange={e => setShares(e.target.value)}
                                step={isCrypto ? "0.01" : "1"}
                                min={isCrypto ? "0.01" : "1"}
                                className="w-full bg-black/20 p-3 rounded-md border border-white/20" 
                            />
                        </div>
                        <div className="text-lg font-bold mb-4">
                            Total: {formatCurrency(totalValue)}
                        </div>
                        {error && <p className="text-danger mb-4">{error}</p>}
                        <div className="flex justify-end gap-4">
                            <button type="button" onClick={onClose} className="py-2 px-4 rounded-md hover:bg-white/10">Cancel</button>
                            <button onClick={handleTrade} disabled={processing} className={`py-2 px-4 rounded-md ${tradeType === 'buy' ? 'bg-primary' : 'bg-danger'} hover:opacity-90 disabled:opacity-50`}>
                                {processing ? 'Processing...' : `Confirm ${tradeType === 'buy' ? 'Buy' : 'Sell'}`}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default TradeModal;
