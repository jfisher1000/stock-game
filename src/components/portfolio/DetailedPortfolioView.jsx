import React from 'react';
import { formatCurrency, formatPercentage } from '@/utils/formatters.js';
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

    // Filter out any holdings that are missing a symbol to prevent rendering errors.
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
                        // We can now call the formatters directly, as they are safe.
                        const dayChangeDisplay = (typeof holding.dayChange === 'number' && typeof holding.dayChangePercent === 'number')
                            ? `${formatCurrency(holding.dayChange)} (${formatPercentage(holding.dayChangePercent)})`
                            : '-';

                        return (
                            <TableRow key={holding.symbol}>
                                <TableCell className="font-medium">{holding.symbol}</TableCell>
                                <TableCell>{holding.shares || '-'}</TableCell>
                                <TableCell className="text-right">{formatCurrency(holding.value)}</TableCell>
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
