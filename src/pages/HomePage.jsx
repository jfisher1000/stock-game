import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../api/firebase';
import CompetitionCard from '../components/competition/CompetitionCard.jsx';
import CreateCompetitionModal from '../components/competition/CreateCompetitionModal.jsx';
import PendingInvitations from '../components/competition/PendingInvitations.jsx';
import { Button } from '../components/ui/button.jsx';
import { PlusIcon } from '../components/common/Icons.jsx';

const HomePage = () => {
    const [myCompetitions, setMyCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const user = auth.currentUser;

    useEffect(() => {
        const fetchMyCompetitions = async () => {
            if (!user) {
                setLoading(false);
                return;
            };
            setLoading(true);
            try {
                const q = query(collection(db, 'competitions'), where('participantIds', 'array-contains', user.uid));
                const querySnapshot = await getDocs(q);
                const comps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setMyCompetitions(comps);
            } catch (error) {
                console.error("Error fetching user competitions: ", error);
            }
            setLoading(false);
        };

        fetchMyCompetitions();
    }, [user]);

    if (loading) return <p className="p-8">Loading your competitions...</p>;

    return (
        <div className="p-8">
            <PendingInvitations />
            <div className="flex justify-between items-center mb-6 mt-8">
                <h1 className="text-4xl font-bold">My Competitions</h1>
                <Button onClick={() => setCreateModalOpen(true)}>
                    <PlusIcon className="mr-2 h-4 w-4" /> Create Competition
                </Button>
            </div>
            
            {myCompetitions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myCompetitions.map(comp => (
                        <CompetitionCard key={comp.id} competition={comp} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 glass-card">
                    <p className="text-muted-foreground">You haven't joined or created any competitions yet.</p>
                </div>
            )}

            {createModalOpen && (
                <CreateCompetitionModal 
                    onClose={() => setCreateModalOpen(false)} 
                />
            )}
        </div>
    );
};

export default HomePage;
