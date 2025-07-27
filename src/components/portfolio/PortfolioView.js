import React from 'react';
import { formatCurrency } from '../../utils/formatters';

const PortfolioView = ({ participantData, onTrade, stockPrices, onViewDetails }) => {
    if (!participantData) return <div className="glass-card p-6 rounded-lg mt-6"><p>Loading portfolio...</p></div>;

    const { cash, portfolioValue } = participantData;
    const holdings = participantData.holdings || {};

    const totalStockValue = Object.values(holdings).reduce((acc, data) => {
        const currentValue = stockPrices[data.originalSymbol]?.price || data.avgCost;
        return acc + (currentValue * data.shares);
    }, 0);

    return (
        <div className="glass-card p-6 rounded-lg mt-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold mb-2">My Portfolio</h3>
                <button onClick={onViewDetails} className="text-sm text-primary hover:underline">
                    View Details &rarr;
                </button>
            </div>
            <div className="mb-4">
                <span className="text-3xl font-bold">{formatCurrency(portfolioValue)}</span>
                <p className="text-gray-400 text-sm">Cash: {formatCurrency(cash)}</p>
            </div>
            <table className="w-full text-left">
                <thead className="border-b border-white/10">
                    <tr>
                        <th className="p-2">Symbol</th>
                        <th className="p-2">Shares</th>
                        <th className="p-2">Total Value</th>
                        <th className="p-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(holdings).length > 0 ? (
                        Object.entries(holdings).map(([sanitizedSymbol, data]) => {
                            const currentValue = stockPrices[data.originalSymbol]?.price || data.avgCost;
                            const totalValue = currentValue * data.shares;
                            return (
                                <tr key={sanitizedSymbol} className="border-b border-white/20 last:border-0">
                                    <td className="p-2 font-bold">{data.originalSymbol || sanitizedSymbol}</td>
                                    <td className="p-2">{data.shares}</td>
                                    <td className="p-2">{formatCurrency(totalValue)}</td>
                                    <td className="p-2">
                                        <button onClick={() => onTrade({ '1. symbol': data.originalSymbol, '3. type': data.assetType })} className="bg-primary/50 text-xs py-1 px-2 rounded hover:bg-primary">Trade</button>
                                    </td>
                                </tr>
                            )
                        })
                    ) : (
                        <tr>
                            <td colSpan="4" className="p-4 text-center text-gray-400">You don't own any stocks yet.</td>
                        </tr>
                    )}
                </tbody>
                {Object.keys(holdings).length > 0 && (
                     <tfoot className="border-t-2 border-white/20 font-bold">
                        <tr>
                            <td className="p-2" colSpan="2">Total Stock Value</td>
                            <td className="p-2">{formatCurrency(totalStockValue)}</td>
                            <td className="p-2"></td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
};

export default PortfolioView;
