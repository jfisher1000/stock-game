import React from 'react';
import { TrophyIcon } from '../common/Icons.jsx';
import { formatCurrency } from '../../utils/formatters.js';

const Leaderboard = ({ participants }) => {

    // --- Defensive Programming ---
    // Ensure participants is a valid array before proceeding.
    if (!Array.isArray(participants)) {
        console.error("Leaderboard received non-array participants:", participants);
        return (
            <div className="glass-card p-6 rounded-lg text-center">
                <p className="text-gray-400">Leaderboard data is currently unavailable.</p>
            </div>
        );
    }

    const calculatePortfolioValue = (participant) => {
        // Safely calculate value, providing defaults for missing data.
        const cash = participant?.portfolio?.cash || 0;
        const holdingsValue = Array.isArray(participant?.portfolio?.holdings)
            ? participant.portfolio.holdings.reduce((acc, h) => acc + (h.value || 0), 0)
            : 0;
        return cash + holdingsValue;
    };

    // Filter out any invalid participants and then sort.
    const sortedParticipants = participants
        .filter(p => p && p.userId && p.portfolio)
        .sort((a, b) => {
            const valueA = calculatePortfolioValue(a);
            const valueB = calculatePortfolioValue(b);
            return valueB - valueA;
        });

    if (sortedParticipants.length === 0) {
        return (
            <div className="glass-card p-6 rounded-lg text-center">
                <p className="text-gray-400">No participants in the leaderboard yet.</p>
            </div>
        );
    }

    return (
        <div className="glass-card p-6 rounded-lg">
            <ul>
                {sortedParticipants.map((p, index) => {
                    const totalValue = calculatePortfolioValue(p);
                    return (
                        <li key={p.userId} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-b-0">
                            <div className="flex items-center">
                                <span className="text-lg font-bold text-gray-400 mr-4">{index + 1}</span>
                                <div>
                                    {/* Provide fallback for username */}
                                    <p className="font-semibold text-white">{p.username || 'Anonymous User'}</p>
                                    <p className="text-sm text-gray-400">{formatCurrency(totalValue)}</p>
                                </div>
                            </div>
                            {index < 3 && <TrophyIcon className={`w-6 h-6 ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-400' : 'text-yellow-600'}`} />}
                        </li>
                    )
                })}
            </ul>
        </div>
    );
};

export default Leaderboard;
