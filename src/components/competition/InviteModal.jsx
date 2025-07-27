import React, { useState } from 'react';
import { db } from '@/api/firebase';
import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { SearchIcon } from '@/common/Icons';

const InviteModal = ({ user, competition, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [invited, setInvited] = useState([]);

    const handleSearch = async () => {
        if (searchTerm.length < 3) {
            setError('Search term must be at least 3 characters.');
            setResults([]);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const q = query(collection(db, 'users'), where('username', '>=', searchTerm), where('username', '<=', searchTerm + '\uf8ff'));
            const querySnapshot = await getDocs(q);
            const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(u => u.id !== user.uid && !competition.participantIds.includes(u.id));
            setResults(users);
        } catch (err) {
            setError('Failed to search for users.');
            console.error(err);
        }
        setLoading(false);
    };

    const handleInvite = async (invitedUser) => {
        setError('');
        try {
            const inviteRef = doc(db, 'competitions', competition.id, 'invitations', invitedUser.id);
            await setDoc(inviteRef, {
                competitionId: competition.id,
                competitionName: competition.name,
                invitedByUsername: user.username,
                invitedByUid: user.uid,
                invitedUsername: invitedUser.username,
                invitedAt: serverTimestamp()
            });
            setInvited([...invited, invitedUser.id]);
        } catch (err) {
            setError(`Failed to invite ${invitedUser.username}. They may have already been invited.`);
            console.error(err);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-card p-8 rounded-lg w-full max-w-md text-white">
                <h2 className="text-2xl font-bold mb-4">Invite Players to {competition.name}</h2>
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        placeholder="Search by username"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-black/20 p-3 rounded-md border border-white/20"
                    />
                    <button onClick={handleSearch} disabled={loading} className="py-2 px-4 rounded-md bg-primary hover:opacity-90 disabled:opacity-50">
                        {loading ? '...' : <SearchIcon />}
                    </button>
                </div>
                {error && <p className="text-danger mb-4">{error}</p>}
                <div className="max-h-60 overflow-y-auto">
                    {results.map(u => (
                        <div key={u.id} className="flex justify-between items-center p-2 hover:bg-white/10 rounded-md">
                            <span>{u.username}</span>
                            <button
                                onClick={() => handleInvite(u)}
                                disabled={invited.includes(u.id)}
                                className="bg-primary/50 text-xs py-1 px-2 rounded hover:bg-primary disabled:bg-gray-500"
                            >
                                {invited.includes(u.id) ? 'Invited' : 'Invite'}
                            </button>
                        </div>
                    ))}
                    {!loading && results.length === 0 && searchTerm.length >= 3 && <p className="text-gray-400 text-center p-4">No users found.</p>}
                </div>
                <div className="flex justify-end mt-6">
                    <button type="button" onClick={onClose} className="py-2 px-4 rounded-md hover:bg-white/10">Close</button>
                </div>
            </div>
        </div>
    );
};

export default InviteModal;
