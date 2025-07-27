import React, { useState, useEffect } from 'react';
import { db } from '../../api/firebase';
import { collectionGroup, query, where, onSnapshot, getDoc, doc, writeBatch, deleteDoc, serverTimestamp } from 'firebase/firestore';

const PendingInvitations = ({ user }) => {
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.username) {
            setLoading(false);
            return;
        };
        
        const q = query(collectionGroup(db, 'invitations'), where('invitedUsername', '==', user.username));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedInvites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), path: doc.ref.path }));
            setInvitations(fetchedInvites);
            setLoading(false);
        }, err => {
            console.error("Error fetching invitations. You may need to create a composite index in Firestore.", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.username]);

    const handleAccept = async (invite) => {
        try {
            const competitionDoc = await getDoc(doc(db, 'competitions', invite.competitionId));
            if (!competitionDoc.exists()) throw new Error("Competition not found.");
            
            const comp = competitionDoc.data();
            const batch = writeBatch(db);

            const participantRef = doc(db, 'competitions', invite.competitionId, 'participants', user.uid);
            batch.set(participantRef, {
                username: user.username,
                portfolioValue: comp.startingCash,
                cash: comp.startingCash,
                joinedAt: serverTimestamp(),
                holdings: {}
            });

            const competitionRef = doc(db, 'competitions', invite.competitionId);
            batch.update(competitionRef, {
                participantIds: [...(comp.participantIds || []), user.uid]
            });

            const inviteRef = doc(db, invite.path);
            batch.delete(inviteRef);

            await batch.commit();
        } catch (error) {
            console.error("Error accepting invite: ", error);
            alert("Failed to accept invite.");
        }
    };

    const handleDecline = async (invite) => {
        try {
            const inviteRef = doc(db, invite.path);
            await deleteDoc(inviteRef);
        } catch (error) {
            console.error("Error declining invite: ", error);
            alert("Failed to decline invite.");
        }
    };

    if (loading) return <p className="p-8 text-white">Loading invitations...</p>;
    if (invitations.length === 0) return null;

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Pending Invitations</h2>
            {invitations.map(invite => (
                <div key={invite.id} className="glass-card p-4 rounded-lg flex justify-between items-center">
                    <div>
                        <p className="font-bold">{invite.competitionName}</p>
                        <p className="text-sm text-gray-300">Invited by {invite.invitedByUsername}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleAccept(invite)} className="bg-success text-white font-bold py-1 px-3 rounded-md text-sm">Accept</button>
                        <button onClick={() => handleDecline(invite)} className="bg-danger text-white font-bold py-1 px-3 rounded-md text-sm">Decline</button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PendingInvitations;
