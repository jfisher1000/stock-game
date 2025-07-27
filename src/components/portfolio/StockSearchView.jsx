import React, { useState } from 'react';
import { searchStocks } from '@/api/alphaVantage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const StockSearchView = ({ onSelectStock }) => {
  const [keywords, setKeywords] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!keywords) return;
    setLoading(true);
    const searchResults = await searchStocks(keywords);
    setResults(searchResults);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex space-x-2">
        <Input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Search for a stock..."
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </form>
      <div className="space-y-2">
        {results.map((stock) => (
          <Card key={stock['1. symbol']}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold">{stock['1. symbol']}</p>
                <p className="text-sm text-muted-foreground">{stock['2. name']}</p>
              </div>
              <Button variant="outline" onClick={() => onSelectStock(stock['1. symbol'])}>
                Trade
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StockSearchView;
