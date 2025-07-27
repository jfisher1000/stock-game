import React, { useState, useEffect } from 'react';
import { db } from '../../api/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { formatCurrency } from '../../utils/formatters';

const Leaderboard = ({ competitionId, userId }) => {
    const [participants, setParticipants] = useState([]);

    useEffect(() => {
        const q = query(collection(db, 'competitions', competitionId, 'participants'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedParticipants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            fetchedParticipants.sort((a, b) => b.portfolioValue - a.portfolioValue);
            setParticipants(fetchedParticipants);
        });
        return () => unsubscribe();
    }, [competitionId]);

    return (
        <div className="mt-6">
            <h3 className="text-2xl font-semibold mb-4">Leaderboard</h3>
            <div className="glass-card rounded-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/10">
                        <tr>
                            <th className="p-4">Rank</th>
                            <th className="p-4">Player</th>
                            <th className="p-4 text-right">Portfolio Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {participants.map((p, index) => (
                            <tr key={p.id} className={`border-b border-white/10 last:border-b-0 ${p.id === userId ? 'bg-primary/20' : ''}`}>
                                <td className="p-4">{index + 1}</td>
                                <td className="p-4">{p.username}</td>
                                <td className="p-4 text-right">{formatCurrency(p.portfolioValue)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Leaderboard;
