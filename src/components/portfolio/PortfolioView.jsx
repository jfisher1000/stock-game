import React, { useState } from 'react';
<<<<<<< Updated upstream
import { usePortfolio } from '@/hooks/usePortfolio';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TradeModal from './TradeModal';
=======
import { formatCurrency } from '@/utils/formatters.js';
import DetailedPortfolioView from './DetailedPortfolioView.jsx';
import { Button } from '@/ui/button.jsx';
>>>>>>> Stashed changes

const PortfolioView = ({ competitionId }) => {
  const { portfolio, loading, error } = usePortfolio(competitionId);
  const [selectedStock, setSelectedStock] = useState(null);

  if (loading) return <div>Loading portfolio...</div>;
  if (error) return <div className="text-destructive">Error: {error.message}</div>;
  if (!portfolio) return <div>No portfolio data found.</div>;

  const handleTradeClick = (stock) => {
    setSelectedStock(stock);
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Total Value: {formatCurrency(portfolio.totalValue)}</h3>
        <p>Cash: {formatCurrency(portfolio.cash)}</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead>Shares</TableHead>
            <TableHead>Current Price</TableHead>
            <TableHead>Total Value</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {portfolio.holdings.map((stock) => (
            <TableRow key={stock.symbol}>
              <TableCell>{stock.symbol}</TableCell>
              <TableCell>{stock.shares}</TableCell>
              <TableCell>{formatCurrency(stock.currentPrice)}</TableCell>
              <TableCell>{formatCurrency(stock.totalValue)}</TableCell>
              <TableCell>
                <Button onClick={() => handleTradeClick(stock)}>Trade</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {selectedStock && (
        <TradeModal
          symbol={selectedStock.symbol}
          competitionId={competitionId}
          onTrade={() => setSelectedStock(null)}
        />
      )}
    </div>
  );
};

export default PortfolioView;
