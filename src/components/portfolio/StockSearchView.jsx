import React, { useState, useEffect } from 'react';
import { searchSymbols } from '../../api/alphaVantage';
import { SearchIcon } from '../common/Icons';

const StockSearchView = ({ onSelectStock, isTradingActive }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isTradingActive || !searchTerm.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const timerId = setTimeout(() => {
            searchSymbols(searchTerm).then(searchResults => {
                setResults(searchResults || []);
                setLoading(false);
            });
        }, 500);

        return () => {
            clearTimeout(timerId);
        };
    }, [searchTerm, isTradingActive]);

    if (!isTradingActive) {
        return (
            <div className="glass-card p-6 rounded-lg mt-6 text-center">
                <h3 className="text-xl font-semibold mb-2">Search & Trade</h3>
                <p className="text-gray-400">Trading is not active for this competition.</p>
            </div>
        )
    }

    return (
        <div className="glass-card p-6 rounded-lg mt-6">
            <h3 className="text-xl font-semibold mb-4">Search & Trade</h3>
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search by symbol or name (e.g., AAPL)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/20 p-3 pl-10 rounded-md border border-white/20"
                    spellCheck="false"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><SearchIcon /></div>
            </div>
            {loading && <p className="text-center mt-4">Searching...</p>}
            {results.length > 0 && (
                <ul className="mt-4 max-h-60 overflow-y-auto">
                    {results.map(result => (
                        <li
                            key={result['1. symbol']}
                            onClick={() => {
                                onSelectStock(result);
                                setSearchTerm('');
                                setResults([]);
                            }}
                            className="p-3 hover:bg-white/10 rounded-md cursor-pointer flex justify-between"
                        >
                            <span>
                                <span className="font-bold">{result['1. symbol']}</span>
                                <span className="text-gray-400 ml-2">{result['2. name']}</span>
                            </span>
                             <span className="text-xs bg-gray-600 px-2 py-1 rounded-full">{result['3. type']}</span>
                        </li>
                    ))}
                </ul>
            )}
            {!loading && searchTerm && results.length === 0 && (
                 <p className="text-center text-gray-400 mt-4">No results found for "{searchTerm}".</p>
            )}
        </div>
    );
};

export default StockSearchView;
