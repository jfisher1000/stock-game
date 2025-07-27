import React, { useState } from 'react';
import { searchStocks } from '../../api/alphaVantage';
import { SearchIcon } from '../common/Icons.jsx';
import TradeModal from './TradeModal.jsx';
import { Button } from '../ui/button.jsx';

const StockSearchView = ({ competitionId, participantId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm) return;
        setLoading(true);
        const results = await searchStocks(searchTerm);
        setSearchResults(results);
        setLoading(false);
    };

    const handleSelectStock = (stock) => {
        setSelectedStock(stock);
    };

    return (
        <div>
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for stocks (e.g., AAPL)"
                    className="flex-grow p-2 rounded-md bg-secondary border"
                />
                <Button type="submit" disabled={loading}>
                    <SearchIcon className="mr-2 h-4 w-4" />
                    {loading ? 'Searching...' : 'Search'}
                </Button>
            </form>

            {searchResults.length > 0 && (
                <div className="glass-card p-6 rounded-lg">
                    <ul>
                        {searchResults.map(stock => (
                            <li key={stock['1. symbol']} className="flex justify-between items-center py-2 border-b last:border-b-0">
                                <div>
                                    <p className="font-bold">{stock['1. symbol']}</p>
                                    <p className="text-sm text-muted-foreground">{stock['2. name']}</p>
                                </div>
                                <Button variant="outline" onClick={() => handleSelectStock(stock)}>Trade</Button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {searchResults.length === 0 && !loading && searchTerm && (
                 <div className="glass-card p-6 rounded-lg mt-6 text-center">
                    <p className="text-muted-foreground">No results found for "{searchTerm}"</p>
                </div>
            )}

            {selectedStock && (
                <TradeModal
                    stock={selectedStock}
                    competitionId={competitionId}
                    participantId={participantId}
                    onClose={() => setSelectedStock(null)}
                />
            )}
        </div>
    );
};

export default StockSearchView;
