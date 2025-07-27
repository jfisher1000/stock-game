import React from 'react';
import { formatCurrency, formatPercentage } from '../../utils/formatters.js';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

const DetailedPortfolioView = ({ holdings }) => {

    const getChangeColor = (change) => {
        if (typeof change !== 'number') return 'text-muted-foreground';
        return change > 0 ? 'text-green-500' : 'text-red-500';
    };

    const ChangeIndicator = ({ change }) => {
        if (typeof change !== 'number') return <span className="text-muted-foreground ml-1">-</span>;
        const color = getChangeColor(change);
        const symbol = change > 0 ? '▲' : '▼';
        return <span className={`${color} ml-1`}>{symbol}</span>;
    };

    if (!Array.isArray(holdings) || holdings.length === 0) {
        return <p className="text-center text-muted-foreground mt-4">No stocks in this portfolio yet.</p>;
    }

    // Filter out any holdings that are missing essential data (like a symbol) before rendering.
    // This is the most robust way to prevent crashes from bad data.
    const validHoldings = holdings.filter(holding => holding && holding.symbol);

    return (
        <div className="mt-6">
            <h4 className="text-xl font-bold mb-4">Holdings</h4>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Shares</TableHead>
                        <TableHead className="text-right">Market Value</TableHead>
                        <TableHead className="text-right">Day's Gain/Loss</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {validHoldings.map((holding) => {
                        const marketValue = typeof holding.value === 'number' ? formatCurrency(holding.value) : '-';
                        const dayChange = typeof holding.dayChange === 'number' ? formatCurrency(holding.dayChange) : null;
                        const dayChangePercent = typeof holding.dayChangePercent === 'number' ? formatPercentage(holding.dayChangePercent) : null;
                        const dayChangeDisplay = dayChange && dayChangePercent ? `${dayChange} (${dayChangePercent})` : '-';

                        return (
                            <TableRow key={holding.symbol}>
                                <TableCell className="font-medium">{holding.symbol}</TableCell>
                                <TableCell>{typeof holding.shares === 'number' ? holding.shares : '-'}</TableCell>
                                <TableCell className="text-right">{marketValue}</TableCell>
                                <TableCell className={`text-right font-medium ${getChangeColor(holding.dayChange)}`}>
                                    {dayChangeDisplay}
                                    <ChangeIndicator change={holding.dayChange} />
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};

export default DetailedPortfolioView;
