import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../api/firebase';
import { Button } from '../components/ui/button';
import { UserAddIcon } from '../components/common/Icons.jsx';
import Leaderboard from '../components/competition/Leaderboard.jsx';
import PortfolioView from '../components/portfolio/PortfolioView.jsx';
import StockSearchView from '../components/portfolio/StockSearchView.jsx';
import InviteModal from '../components/competition/InviteModal.jsx';

const CompetitionDetailPage = () => {
    const { id } = useParams();
    const [competition, setCompetition] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [userPortfolio, setUserPortfolio] = useState(null);

    const currentUser = auth.currentUser;

    const fetchCompetitionData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const docRef = doc(db, 'competitions', id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() };
                
                let participantsArray = data.participants;
                if (typeof participantsArray === 'string') {
                    try {
                        participantsArray = JSON.parse(participantsArray);
                    } catch (e) {
                        participantsArray = [];
                    }
                }
                
                if (!Array.isArray(participantsArray)) {
                     participantsArray = [];
                }

                if (data.name) {
                    const validCompetitionData = { ...data, participants: participantsArray };
                    setCompetition(validCompetitionData);
                    
                    const portfolio = validCompetitionData.participants.find(p => p.userId === currentUser?.uid);
                    setUserPortfolio(portfolio);
                } else {
                    throw new Error("Competition data is invalid or incomplete (missing name).");
                }
            } else {
                throw new Error("Competition not found.");
            }
        } catch (err) {
            console.error("Error processing competition details:", err);
            setError(err.message);
        }
        setLoading(false);
    }, [id, currentUser?.uid]);

    useEffect(() => {
        fetchCompetitionData();
    }, [fetchCompetitionData]);
    
    const handleJoinCompetition = async () => {
        if (!currentUser) {
            alert("You must be logged in to join a competition.");
            return;
        }
        const userRef = doc(db, 'competitions', id);
        try {
            await updateDoc(userRef, {
                participants: arrayUnion({
                    userId: currentUser.uid,
                    username: currentUser.displayName || 'Anonymous',
                    portfolio: {
                        cash: competition.startingBalance || 100000,
                        holdings: []
                    }
                })
            });
            fetchCompetitionData();
        } catch (err) {
            console.error("Error joining competition: ", err);
            alert("Could not join the competition. Please try again.");
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading competition details...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-destructive">{error}</div>;
    }

    if (!competition) {
        return <div className="p-8 text-center">No competition data available.</div>;
    }

    const isParticipant = userPortfolio != null;
    const isOwner = competition.ownerId === currentUser?.uid;

    return (
        <div className="p-8">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-4xl font-bold">{competition.name}</h1>
                    <p className="text-muted-foreground mt-2">{competition.description}</p>
                </div>
                <div className="flex items-center gap-4">
                    {!isParticipant && (
                        <Button onClick={handleJoinCompetition}>Join Competition</Button>
                    )}
                    {isOwner && (
                         <Button variant="outline" onClick={() => setShowInviteModal(true)}>
                            <UserAddIcon className="mr-2 h-4 w-4" /> Invite
                        </Button>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    {isParticipant ? (
                        <>
                           <h2 className="text-2xl font-bold mb-4">My Portfolio</h2>
                           <PortfolioView participantData={userPortfolio} />
                           <div className="mt-8">
                               <StockSearchView competitionId={id} participantId={currentUser.uid} />
                           </div>
                        </>
                    ) : (
                        <div className="glass-card p-8 text-center">
                            <h2 className="text-2xl font-bold mb-4">Join to Participate</h2>
                            <p className="text-muted-foreground mb-6">Join this competition to start trading and see your portfolio.</p>
                            <Button onClick={handleJoinCompetition}>Join Now</Button>
                        </div>
                    )}
                </div>
                <div>
                    <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
                    <Leaderboard participants={competition.participants} />
                </div>
            </div>

            {showInviteModal && (
                <InviteModal 
                    competitionId={id} 
                    onClose={() => setShowInviteModal(false)} 
                />
            )}
        </div>
    );
};

export default CompetitionDetailPage;
