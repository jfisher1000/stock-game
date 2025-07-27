import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../../api/firebase';
import { Button } from '../ui/button';

const PendingInvitations = () => {
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = auth.currentUser;

    const fetchInvitations = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const q = query(collection(db, 'invitations'), where('email', '==', user.email), where('status', '==', 'pending'));
            const querySnapshot = await getDocs(q);
            const fetchedInvitations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setInvitations(fetchedInvitations);
        } catch (error) {
            console.error("Error fetching invitations: ", error);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchInvitations();
    }, [fetchInvitations]);

    const handleInvitation = async (invitationId, competitionId, accept) => {
        const invitationRef = doc(db, 'invitations', invitationId);
        try {
            if (accept) {
                await updateDoc(invitationRef, { status: 'accepted' });
                const competitionRef = doc(db, 'competitions', competitionId);
                await updateDoc(competitionRef, {
                    participantIds: arrayUnion(user.uid),
                    participants: arrayUnion({
                        userId: user.uid,
                        username: user.displayName || 'Anonymous',
                        portfolio: { cash: 100000, holdings: [] } // Default portfolio
                    })
                });
            } else {
                await updateDoc(invitationRef, { status: 'declined' });
            }
            fetchInvitations(); // Refresh the list
        } catch (error) {
            console.error("Error handling invitation: ", error);
        }
    };

    if (loading) return <p className="p-8">Loading invitations...</p>;
    if (invitations.length === 0) return null;

    return (
        <div className="glass-card p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Pending Invitations</h2>
            {invitations.map(inv => (
                <div key={inv.id} className="flex justify-between items-center p-4 rounded-lg bg-secondary">
                    <div>
                        <p className="font-semibold">{inv.competitionName}</p>
                        <p className="text-sm text-muted-foreground">Invited by {inv.invitedBy}</p>
                    </div>
                    <div>
                        <Button onClick={() => handleInvitation(inv.id, inv.competitionId, true)} className="mr-2">Accept</Button>
                        <Button onClick={() => handleInvitation(inv.id, inv.competitionId, false)} variant="destructive">Decline</Button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PendingInvitations;
