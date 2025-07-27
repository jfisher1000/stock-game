import React, { useMemo } from 'react';

// --- Helper Components & Functions ---

const formatCurrency = (amount, sign = true) => {
    const options = {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    };
    const value = new Intl.NumberFormat('en-US', options).format(amount || 0);
    if (sign && amount > 0) {
        return `+${value}`;
    }
    return value;
};

const formatPercent = (decimal) => {
    if (decimal === null || decimal === undefined) return 'N/A';
    const percent = decimal * 100;
    const sign = percent > 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
};

const ArrowIcon = ({ direction }) => {
    const path = direction === 'up' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7";
    const color = direction === 'up' ? 'text-green-500' : 'text-red-500';
    return <svg className={`w-4 h-4 inline-block mr-1 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d={path}></path></svg>;
};


const SummaryBox = ({ title, value, subValue, valueColor = 'text-white' }) => (
    <div className="glass-card p-4 rounded-lg flex-1">
        <p className="text-sm text-gray-400">{title}</p>
        <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
        {subValue && <p className="text-sm text-gray-300">{subValue}</p>}
    </div>
);

const PositionsTable = ({ title, assets, onTrade }) => {
    if (assets.length === 0) {
        return null; // Don't render the table if there are no assets in this category
    }

    const categoryTotal = assets.reduce((acc, asset) => {
        acc.marketValue += asset.marketValue;
        acc.dayChange += asset.dayChangeValue;
        acc.costBasis += asset.costBasis;
        return acc;
    }, { marketValue: 0, dayChange: 0, costBasis: 0 });

    const categoryGainLoss = categoryTotal.marketValue - categoryTotal.costBasis;
    const categoryDayChangePercent = categoryTotal.marketValue > 0 ? (categoryTotal.dayChange / (categoryTotal.marketValue - categoryTotal.dayChange)) : 0;
    const categoryGainLossPercent = categoryTotal.costBasis > 0 ? (categoryGainLoss / categoryTotal.costBasis) : 0;

    return (
        <div className="mt-6">
            <h4 className="text-lg font-bold mb-2">{title}</h4>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="text-gray-400">
                        <tr>
                            {['Symbol', 'Qty', 'Price', 'Day Change', 'Mkt Value', 'Cost Basis', 'Gain/Loss', 'Actions'].map(h => 
                                <th key={h} className="p-2 font-normal">{h}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {assets.map(asset => {
                            const isPositiveDayChange = asset.dayChangeValue >= 0;
                            const isPositiveGainLoss = asset.gainLoss >= 0;

                            return (
                                <tr key={asset.symbol} className="border-b border-t border-white/10">
                                    <td className="p-3">
                                        <div className="font-bold">{asset.symbol}</div>
                                        <div className="text-xs text-gray-400 truncate max-w-xs">{asset.name}</div>
                                    </td>
                                    <td className="p-2">{asset.shares}</td>
                                    <td className="p-2">{formatCurrency(asset.price, false)}</td>
                                    <td className={`p-2 ${isPositiveDayChange ? 'text-green-400' : 'text-red-400'}`}>
                                        <div>{formatCurrency(asset.dayChangeValue)}</div>
                                        <div>({formatPercent(asset.dayChangePercent)})</div>
                                    </td>
                                    <td className="p-2">{formatCurrency(asset.marketValue, false)}</td>
                                    <td className="p-2">{formatCurrency(asset.costBasis, false)}</td>
                                    <td className={`p-2 ${isPositiveGainLoss ? 'text-green-400' : 'text-red-400'}`}>
                                        <div>{formatCurrency(asset.gainLoss)}</div>
                                        <div>({formatPercent(asset.gainLossPercent)})</div>
                                    </td>
                                    <td className="p-2">
                                        <button onClick={() => onTrade(asset.symbol)} className="bg-primary/50 text-xs py-1 px-3 rounded hover:bg-primary">Trade</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="font-bold">
                        <tr className="border-t-2 border-white/20">
                            <td className="p-3">Total</td>
                            <td colSpan="2"></td>
                            <td className={`p-2 ${categoryTotal.dayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                <div>{formatCurrency(categoryTotal.dayChange)}</div>
                                <div>({formatPercent(categoryDayChangePercent)})</div>
                            </td>
                            <td className="p-2">{formatCurrency(categoryTotal.marketValue, false)}</td>
                            <td className="p-2">{formatCurrency(categoryTotal.costBasis, false)}</td>
                            <td className={`p-2 ${categoryGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                <div>{formatCurrency(categoryGainLoss)}</div>
                                <div>({formatPercent(categoryGainLossPercent)})</div>
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};


// --- Main Detailed Portfolio View Component ---

const DetailedPortfolioView = ({ participantData, stockPrices, onTrade, onBack }) => {

    const processedAssets = useMemo(() => {
        if (!participantData || !participantData.holdings) return [];

        return Object.values(participantData.holdings).map(holding => {
            const liveData = stockPrices[holding.originalSymbol] || { price: holding.avgCost, change: 0 };
            const price = liveData.price;
            const dayChangeValuePerShare = liveData.change;

            const marketValue = price * holding.shares;
            const costBasis = holding.totalCost || (holding.avgCost * holding.shares);
            const gainLoss = marketValue - costBasis;
            const gainLossPercent = costBasis > 0 ? gainLoss / costBasis : 0;
            const dayChangeValue = dayChangeValuePerShare * holding.shares;
            const previousDayValue = marketValue - dayChangeValue;
            const dayChangePercent = previousDayValue > 0 ? dayChangeValue / previousDayValue : 0;

            return {
                symbol: holding.originalSymbol,
                name: holding.name,
                shares: holding.shares,
                price,
                marketValue,
                costBasis,
                gainLoss,
                gainLossPercent,
                dayChangeValue,
                dayChangePercent,
                // Default to 'Equity' if type is not specified
                assetType: holding.assetType || 'Equity' 
            };
        });
    }, [participantData, stockPrices]);

    const summary = useMemo(() => {
        const totals = processedAssets.reduce((acc, asset) => {
            acc.marketValue += asset.marketValue;
            acc.dayChange += asset.dayChangeValue;
            acc.costBasis += asset.costBasis;
            return acc;
        }, { marketValue: 0, dayChange: 0, costBasis: 0 });

        const totalValue = (participantData?.cash || 0) + totals.marketValue;
        const gainLoss = totalValue - (participantData?.cash || 0) - totals.costBasis;
        const gainLossPercent = totals.costBasis > 0 ? gainLoss / totals.costBasis : 0;
        const dayChangePercent = (totalValue - totals.dayChange) > 0 ? totals.dayChange / (totalValue - totals.dayChange) : 0;

        return {
            totalValue,
            cash: participantData?.cash || 0,
            marketValue: totals.marketValue,
            dayChange: totals.dayChange,
            dayChangePercent,
            costBasis: totals.costBasis,
            gainLoss,
            gainLossPercent,
        };
    }, [processedAssets, participantData]);

    const categorizedAssets = useMemo(() => {
        const equities = processedAssets.filter(a => a.assetType === 'Equity');
        const etfs = processedAssets.filter(a => a.assetType === 'ETF');
        // Simple heuristic for crypto, can be improved
        const crypto = processedAssets.filter(a => a.assetType === 'Cryptocurrency' || ['BTC', 'ETH'].includes(a.symbol));
        
        return { equities, etfs, crypto };
    }, [processedAssets]);


    return (
        <div className="text-white p-4 md:p-8">
            <button onClick={onBack} className="text-primary hover:underline mb-6">
                &larr; Back to Competition View
            </button>

            <h2 className="text-3xl font-bold mb-4">Portfolio Summary</h2>
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <SummaryBox title="Total Account Value" value={formatCurrency(summary.totalValue, false)} />
                <SummaryBox 
                    title="Total Day Change" 
                    value={formatCurrency(summary.dayChange)} 
                    subValue={formatPercent(summary.dayChangePercent)}
                    valueColor={summary.dayChange >= 0 ? 'text-green-400' : 'text-red-400'}
                />
                <SummaryBox title="Total Cost Basis" value={formatCurrency(summary.costBasis, false)} />
                <SummaryBox 
                    title="Total Gain/Loss" 
                    value={formatCurrency(summary.gainLoss)} 
                    subValue={formatPercent(summary.gainLossPercent)}
                    valueColor={summary.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}
                />
            </div>

            <h3 className="text-2xl font-bold mb-2">Positions Details</h3>
            
            <PositionsTable title="Equities" assets={categorizedAssets.equities} onTrade={onTrade} />
            <PositionsTable title="ETFs & Closed End Funds" assets={categorizedAssets.etfs} onTrade={onTrade} />
            <PositionsTable title="Cryptocurrency" assets={categorizedAssets.crypto} onTrade={onTrade} />

            {/* Cash Position */}
            <div className="mt-6">
                <h4 className="text-lg font-bold mb-2">Cash & Money Market</h4>
                 <table className="w-full text-left text-sm">
                    <tbody>
                        <tr className="border-b border-t border-white/10">
                            <td className="p-3 font-bold">Cash</td>
                            <td className="p-2">{formatCurrency(summary.cash, false)}</td>
                        </tr>
                    </tbody>
                    <tfoot className="font-bold">
                        <tr className="border-t-2 border-white/20">
                            <td className="p-3">Total</td>
                            <td className="p-2">{formatCurrency(summary.cash, false)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default DetailedPortfolioView;
