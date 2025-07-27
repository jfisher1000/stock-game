import React, { useState, useEffect } from 'react';
import { db } from '../api/firebase';
import { collection, query, where, onSnapshot, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { getCompetitionStatus } from '../utils/formatters';
import CompetitionCard from '../components/competition/CompetitionCard';

const ExplorePage = ({ user, onJoinCompetition }) => {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'competitions'), where('isPublic', '==', true));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const upcominAndActive = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(comp => {
                    const status = getCompetitionStatus(comp.startDate, comp.endDate).text;
                    return (status === 'Upcoming' || status === 'Active') && !comp.participantIds.includes(user.uid);
                });
            setCompetitions(upcominAndActive);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user.uid]);
    
    const handleJoin = async (comp) => {
        const batch = writeBatch(db);
        const participantRef = doc(db, 'competitions', comp.id, 'participants', user.uid);
        batch.set(participantRef, {
            username: user.username,
            portfolioValue: comp.startingCash,
            cash: comp.startingCash,
            joinedAt: serverTimestamp(),
            holdings: {}
        });
        
        const competitionRef = doc(db, 'competitions', comp.id);
        batch.update(competitionRef, {
            participantIds: [...(comp.participantIds || []), user.uid]
        });

        try {
            await batch.commit();
            alert("Successfully joined!");
            onJoinCompetition(comp.id); // Navigate to the competition page
        } catch (error) {
            console.error("Error joining competition: ", error);
            alert("Failed to join competition.");
        }
    };

    if (loading) return <p className="p-8 text-white">Loading public competitions...</p>;

    return (
        <div className="p-8 text-white">
            <h1 className="text-4xl font-bold mb-6">Explore Public Competitions</h1>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {competitions.map(comp => (
                    <CompetitionCard 
                        key={comp.id}
                        user={user}
                        competition={comp}
                        onJoin={() => handleJoin(comp)}
                    />
                ))}
                 {competitions.length === 0 && <p>There are no public competitions to join right now. Why not create one?</p>}
            </div>
        </div>
    );
};

export default ExplorePage;
