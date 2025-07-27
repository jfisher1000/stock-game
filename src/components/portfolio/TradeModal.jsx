import React, { useState, useEffect } from 'react';
import { getStockQuote } from '../../api/alphaVantage.js'; // Corrected function name
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../api/firebase';
import { formatCurrency } from '../../utils/formatters.js';
import { Button } from '../ui/button';
import { TrendingUpIcon, TrendingDownIcon } from '../common/Icons.jsx';

const TradeModal = ({ stock, competitionId, participantId, onClose }) => {
    const [tradeType, setTradeType] = useState('buy');
    const [quantity, setQuantity] = useState(1);
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchQuote = async () => {
            setLoading(true);
            setError('');
            const quoteData = await getStockQuote(stock['1. symbol']);
            if (quoteData) {
                setQuote(quoteData);
            } else {
                setError('Could not fetch stock price. Please try again later.');
            }
            setLoading(false);
        };
        fetchQuote();
    }, [stock]);

    const handleTrade = async () => {
        // ... (trade logic would go here)
        alert("Trade functionality is not yet implemented.");
    };

    const price = quote ? parseFloat(quote['05. price']) : 0;
    const totalCost = price * quantity;
    const change = quote ? parseFloat(quote['09. change']) : 0;
    const changePercent = quote ? parseFloat(quote['10. change percent'].replace('%','')) / 100 : 0;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg shadow-xl p-8 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-2xl font-bold">{stock['1. symbol']}</h2>
                        <p className="text-muted-foreground">{stock['2. name']}</p>
                    </div>
                    <Button variant="ghost" onClick={onClose}>X</Button>
                </div>

                {loading && <p className="text-center">Loading price...</p>}
                {error && <p className="text-center text-destructive">{error}</p>}

                {quote && (
                    <div>
                        <p className={`text-4xl font-bold ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {formatCurrency(price)}
                        </p>
                        <div className={`flex items-center text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {change >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                            <span className="ml-1">{formatCurrency(change)} ({changePercent.toFixed(2)}%)</span>
                        </div>

                        <div className="my-6">
                            <div className="flex border rounded-md">
                                <button 
                                    onClick={() => setTradeType('buy')}
                                    className={`flex-1 p-2 rounded-l-md ${tradeType === 'buy' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
                                >
                                    Buy
                                </button>
                                <button 
                                    onClick={() => setTradeType('sell')}
                                    className={`flex-1 p-2 rounded-r-md ${tradeType === 'sell' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
                                >
                                    Sell
                                </button>
                            </div>
                        </div>

                        <div className="my-4">
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Quantity</label>
                            <input 
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full p-2 rounded-md bg-secondary border"
                                min="1"
                            />
                        </div>

                        <div className="flex justify-between items-center font-bold text-lg my-4">
                            <span>Total Cost</span>
                            <span>{formatCurrency(totalCost)}</span>
                        </div>

                        <Button onClick={handleTrade} className="w-full">
                            Execute {tradeType === 'buy' ? 'Buy' : 'Sell'} Order
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TradeModal;
