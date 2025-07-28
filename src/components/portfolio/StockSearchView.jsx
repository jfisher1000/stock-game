// src/components/portfolio/StockSearchView.jsx

import React, { useState, useCallback } from 'react';
// CORRECTED: The function is named 'searchSymbols', not 'searchStocks'.
import { searchSymbols } from '@/api/alphaVantage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { debounce } from 'lodash';

const StockSearchView = ({ onSelectStock }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const debouncedSearch = useCallback(
    debounce(async (keywords) => {
      if (!keywords) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const data = await searchSymbols(keywords);
        setResults(data);
      } catch (err) {
        setError('Failed to fetch search results.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  const handleChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    debouncedSearch(newSearchTerm);
  };

  return (
    <div className="space-y-4">
      <Input
        type="text"
        value={searchTerm}
        onChange={handleChange}
        placeholder="Search for a stock (e.g., AAPL)"
      />
      {isLoading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <ul className="space-y-2">
        {results.map((stock) => (
          <li
            key={stock['1. symbol']}
            className="p-2 border rounded-md flex justify-between items-center"
          >
            <div>
              <p className="font-bold">{stock['1. symbol']}</p>
              <p className="text-sm text-gray-500">{stock['2. name']}</p>
            </div>
            <Button onClick={() => onSelectStock(stock['1. symbol'])}>
              Trade
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StockSearchView;
