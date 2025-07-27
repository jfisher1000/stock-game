import React, { useState, useEffect } from 'react';
import { db } from '../api/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import CompetitionCard from '../components/competition/CompetitionCard';
import PendingInvitations from '../components/competition/PendingInvitations';

const HomePage = ({ user, onSelectCompetition, onDeleteCompetition }) => {
    const [competitions, setCompetitions] = useState([]);
    const [leaderboards, setLeaderboards] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'competitions'), where('participantIds', 'array-contains', user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const comps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCompetitions(comps);
            setLoading(false);

            // For each competition, listen to its participants for ranking
            comps.forEach(comp => {
                const participantsQuery = query(collection(db, 'competitions', comp.id, 'participants'));
                onSnapshot(participantsQuery, (participantsSnapshot) => {
                    const participants = participantsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    participants.sort((a, b) => b.portfolioValue - a.portfolioValue);
                    setLeaderboards(prev => ({ ...prev, [comp.id]: participants }));
                });
            });
        });
        return () => unsubscribe();
    }, [user]);

    const ownedCompetitions = competitions.filter(c => c.ownerId === user.uid);
    const joinedCompetitions = competitions.filter(c => c.ownerId !== user.uid);

    if (loading) return <p className="p-8 text-white">Loading your competitions...</p>;

    return (
        <div className="p-8 text-white">
            <div className="mb-8">
                <PendingInvitations user={user} />
            </div>
            
            <div>
                <h1 className="text-4xl font-bold mb-6">Competitions You Own</h1>
                {ownedCompetitions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ownedCompetitions.map(comp => {
                            const rank = leaderboards[comp.id]?.findIndex(p => p.id === user.uid) + 1;
                            return (
                                <CompetitionCard 
                                    key={comp.id} 
                                    competition={comp} 
                                    user={user}
                                    rank={rank > 0 ? rank : null}
                                    totalParticipants={leaderboards[comp.id]?.length || 0}
                                    onClick={() => onSelectCompetition(comp.id)}
                                    onDelete={() => onDeleteCompetition(comp)}
                                />
                            )
                        })}
                    </div>
                ) : (
                    <p>You haven't created any competitions yet. Click "Create Competition" to start one!</p>
                )}
            </div>

            <div className="mt-12">
                <h1 className="text-4xl font-bold mb-6">Competitions You've Joined</h1>
                {joinedCompetitions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {joinedCompetitions.map(comp => {
                            const rank = leaderboards[comp.id]?.findIndex(p => p.id === user.uid) + 1;
                            return (
                                <CompetitionCard 
                                    key={comp.id} 
                                    competition={comp} 
                                    user={user}
                                    rank={rank > 0 ? rank : null}
                                    totalParticipants={leaderboards[comp.id]?.length || 0}
                                    onClick={() => onSelectCompetition(comp.id)}
                                    onDelete={() => onDeleteCompetition(comp)}
                                />
                            )
                        })}
                    </div>
                ) : (
                    <p>You haven't joined any competitions yet. Go to the Explore page to find one!</p>
                )}
            </div>
        </div>
    );
};

export default HomePage;
