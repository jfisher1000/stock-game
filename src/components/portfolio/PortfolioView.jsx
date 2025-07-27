import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatters.js';
import DetailedPortfolioView from './DetailedPortfolioView.jsx';
import { Button } from '../ui/button.jsx';

const PortfolioView = ({ participantData }) => {
    const [showDetailedView, setShowDetailedView] = useState(false);

    if (!participantData || !participantData.portfolio) {
        return (
            <div className="glass-card p-6 rounded-lg text-center">
                <p className="text-muted-foreground">No portfolio data available.</p>
            </div>
        );
    }

    const { portfolio } = participantData;
    const holdingsValue = Array.isArray(portfolio.holdings)
        ? portfolio.holdings.reduce((acc, holding) => acc + (holding.value || 0), 0)
        : 0;
    const totalValue = (portfolio.cash || 0) + holdingsValue;

    return (
        <div className="glass-card p-6 rounded-lg">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-semibold text-muted-foreground">Portfolio Value</h3>
                    <p className="text-3xl font-bold text-foreground">{formatCurrency(totalValue)}</p>
                </div>
                <Button variant="outline" onClick={() => setShowDetailedView(!showDetailedView)}>
                    {showDetailedView ? 'Hide Details' : 'Show Details'}
                </Button>
            </div>
            <div className="mt-4">
                <div className="flex justify-between text-muted-foreground">
                    <span>Cash</span>
                    <span>{formatCurrency(portfolio.cash || 0)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                    <span>Stocks</span>
                    <span>{formatCurrency(holdingsValue)}</span>
                </div>
            </div>
            {showDetailedView && (
                <div className="mt-6">
                    <DetailedPortfolioView holdings={portfolio.holdings || []} />
                </div>
            )}
        </div>
    );
};

export default PortfolioView;
