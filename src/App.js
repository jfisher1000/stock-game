import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { auth, db } from './firebase';
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    serverTimestamp,
    writeBatch,
    runTransaction,
    Timestamp,
    getDocs,
    deleteDoc,
    collectionGroup,
    updateDoc
} from 'firebase/firestore';
import { searchSymbols, getQuote } from './api';
import { formatDate, formatCurrency, sanitizeSymbolForFirestore, getCompetitionStatus } from './utils/formatters';


// Lazy load AdminPage and the new DetailedPortfolioView
const AdminPage = React.lazy(() => import('./AdminPage'));
const DetailedPortfolioView = React.lazy(() => import('./DetailedPortfolioView'));


// --- Helper & Icon Components ---
const Icon = ({ path, className = "w-6 h-6" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path></svg>;
const HomeIcon = () => <Icon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-7-4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />;
const ExploreIcon = () => <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />;
const AlertsIcon = () => <Icon path="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />;
const ProfileIcon = () => <Icon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />;
const LogoutIcon = () => <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />;
const AdminIcon = () => <Icon path="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />;
const PlusIcon = () => <Icon path="M12 4v16m8-8H4" />;
const TrashIcon = ({ className = "w-5 h-5" }) => <Icon className={className} path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />;
const UsersIcon = () => <Icon className="w-4 h-4 text-gray-400" path="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 3a4 4 0 014 4v2" />;
const SearchIcon = () => <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />;
const TrendingUpIcon = () => <Icon className="w-4 h-4 text-green-500" path="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />;
const TrendingDownIcon = () => <Icon className="w-4 h-4 text-red-500" path="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />;
const CalendarIcon = () => <Icon className="w-4 h-4 text-gray-400" path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />;
const UserAddIcon = () => <Icon path="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />;
const TrophyIcon = () => <Icon className="w-4 h-4 text-yellow-400" path="M9 11l3-3 3 3m0 0l-3 3-3-3m3-3v12" />;


// --- Authentication Page Component ---
const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        if (isLogin) {
            try { await signInWithEmailAndPassword(auth, email, password); } catch (err) { setError(err.message); }
        } else {
            if (username.length < 3) {
                setError("Username must be at least 3 characters long.");
                setLoading(false);
                return;
            }
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const userDocRef = doc(db, `users`, userCredential.user.uid);
                await setDoc(userDocRef, { username, email: userCredential.user.email, createdAt: serverTimestamp(), role: 'player' });
            } catch (err) { setError(err.message); }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 text-white">
            <div className="max-w-md w-full glass-card rounded-xl shadow-lg p-8">
                <h1 className="text-3xl font-bold text-center mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                <p className="text-center text-gray-300 mb-6">{isLogin ? 'Sign in to view competitions' : 'Join the ultimate virtual trading game'}</p>
                <form onSubmit={handleAuthAction}>
                    {!isLogin && (<div className="mb-4"><label className="block text-gray-300 mb-2" htmlFor="username">Username</label><input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-black/20 p-3 rounded-md border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary" required /></div>)}
                    <div className="mb-4"><label className="block text-gray-300 mb-2" htmlFor="email">Email</label><input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/20 p-3 rounded-md border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary" required /></div>
                    <div className="mb-6"><label className="block text-gray-300 mb-2" htmlFor="password">Password</label><input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/20 p-3 rounded-md border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary" required /></div>
                    {error && <p className="text-danger text-center mb-4">{error}</p>}
                    <button type="submit" className="w-full bg-primary hover:opacity-90 font-bold py-3 rounded-md transition duration-300 disabled:opacity-50" disabled={loading}>{loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}</button>
                </form>
                <p className="text-center text-gray-400 mt-6">{isLogin ? "Don't have an account?" : "Already have an account?"}<button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-primary hover:underline ml-2">{isLogin ? 'Sign Up' : 'Sign In'}</button></p>
            </div>
        </div>
    );
};

// --- General Purpose Modals ---
const ConfirmDeleteModal = ({ title, body, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="glass-card p-8 rounded-lg w-full max-w-md text-white text-center">
            <h2 className="text-2xl font-bold mb-4">{title}</h2>
            <p className="mb-6">{body}</p>
            <div className="flex justify-center gap-4">
                <button onClick={onCancel} className="py-2 px-6 rounded-md hover:bg-white/10">Cancel</button>
                <button onClick={onConfirm} className="py-2 px-6 rounded-md bg-danger hover:opacity-90">Delete</button>
            </div>
        </div>
    </div>
);

const InactivityWarningModal = ({ onStay, onLogout, countdown }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="glass-card p-8 rounded-lg w-full max-w-md text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Are you still there?</h2>
            <p className="mb-6">You've been inactive for a while. For your security, we'll log you out in {countdown} seconds.</p>
            <div className="flex justify-center gap-4">
                <button onClick={onLogout} className="py-2 px-6 rounded-md hover:bg-white/10">Logout</button>
                <button onClick={onStay} className="py-2 px-6 rounded-md bg-primary hover:opacity-90">Stay Logged In</button>
            </div>
        </div>
    </div>
);


// --- Invitation & Alerts Components ---

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

const PendingInvitations = ({ user }) => {
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.username) {
            setLoading(false);
            return;
        };
        
        // This query requires a composite index in Firestore.
        // The error message in the console will provide a direct link to create it.
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

const AlertsPage = ({ user }) => {
    return (
        <div className="p-8 text-white">
            <h1 className="text-4xl font-bold mb-6">Alerts</h1>
            <PendingInvitations user={user} />
            {/* You can add other types of alerts here in the future */}
        </div>
    );
};


// --- Competition & Page Components ---

const CreateCompetitionModal = ({ user, onClose }) => {
    const [name, setName] = useState('');
    const [startingCash, setStartingCash] = useState(100000);
    const [isPublic, setIsPublic] = useState(true);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [durationNumber, setDurationNumber] = useState(2);
    const [durationType, setDurationType] = useState('Weeks');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Competition name is required.');
            return;
        }
        setLoading(true);

        const start = new Date(startDate);
        const end = new Date(start);
        if (durationType === 'Days') {
            end.setDate(start.getDate() + durationNumber);
        } else if (durationType === 'Weeks') {
            end.setDate(start.getDate() + durationNumber * 7);
        } else if (durationType === 'Months') {
            end.setMonth(start.getMonth() + durationNumber);
        } else if (durationType === 'Years') {
            end.setFullYear(start.getFullYear() + durationNumber);
        }
        
        const startDateTimestamp = Timestamp.fromDate(start);
        const endDateTimestamp = Timestamp.fromDate(end);


        try {
            const competitionRef = await addDoc(collection(db, 'competitions'), {
                name,
                startingCash,
                isPublic,
                ownerId: user.uid,
                ownerName: user.username,
                createdAt: serverTimestamp(),
                startDate: startDateTimestamp,
                endDate: endDateTimestamp,
                participantIds: [user.uid]
            });

            const participantRef = doc(db, 'competitions', competitionRef.id, 'participants', user.uid);
            await setDoc(participantRef, {
                username: user.username,
                portfolioValue: startingCash,
                cash: startingCash,
                joinedAt: serverTimestamp(),
                holdings: {}
            });

            onClose();
        } catch (err) {
            setError('Failed to create competition. Please try again.');
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-card p-8 rounded-lg w-full max-w-md text-white">
                <h2 className="text-2xl font-bold mb-6">Create New Competition</h2>
                <form onSubmit={handleCreate}>
                    <div className="mb-4">
                        <label className="block mb-2">Competition Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/20 p-3 rounded-md border border-white/20" required/>
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2">Starting Cash</label>
                        <input type="number" value={startingCash} onChange={e => setStartingCash(Number(e.target.value))} className="w-full bg-black/20 p-3 rounded-md border border-white/20" />
                    </div>
                     <div className="mb-4">
                        <label className="block mb-2">Start Date</label>
                        <input type="date" value={startDate} min={new Date().toISOString().split('T')[0]} onChange={e => setStartDate(e.target.value)} className="w-full bg-black/20 p-3 rounded-md border border-white/20" />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2">Duration</label>
                        <div className="flex gap-2">
                            <input type="number" value={durationNumber} min="1" onChange={e => setDurationNumber(Number(e.target.value))} className="w-1/3 bg-black/20 p-3 rounded-md border border-white/20" />
                            <select value={durationType} onChange={e => setDurationType(e.target.value)} className="w-2/3 bg-black/20 p-3 rounded-md border border-white/20">
                                <option>Days</option>
                                <option>Weeks</option>
                                <option>Months</option>
                                <option>Years</option>
                            </select>
                        </div>
                    </div>
                    <div className="mb-6 flex items-center">
                        <input type="checkbox" id="isPublic" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                        <label htmlFor="isPublic" className="ml-2">Publicly visible</label>
                    </div>
                    {error && <p className="text-danger mb-4">{error}</p>}
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 rounded-md hover:bg-white/10">Cancel</button>
                        <button type="submit" disabled={loading} className="py-2 px-4 rounded-md bg-primary hover:opacity-90 disabled:opacity-50">{loading ? 'Creating...' : 'Create'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

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

const CompetitionCard = ({ user, competition, onClick, onDelete, onJoin, rank, totalParticipants }) => {
    const status = getCompetitionStatus(competition.startDate, competition.endDate);
    const isOwner = user.uid === competition.ownerId;
    const isAdmin = user.role === 'admin';
    
    const handleDelete = (e) => {
        e.stopPropagation(); 
        onDelete();
    };

    return (
        <div className="glass-card p-6 rounded-lg flex flex-col hover:border-primary/50 border border-transparent transition-all">
            <div onClick={onClick} className="cursor-pointer flex-grow">
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold mb-2">{competition.name}</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${status.color}`}>{status.text}</span>
                </div>
                <p className="text-gray-400">Owner: {competition.ownerName}</p>
                <p className="text-gray-400">Starts with {formatCurrency(competition.startingCash)}</p>
                <div className="mt-4 space-y-2">
                    <div className="flex items-center text-gray-300 text-sm">
                        <CalendarIcon />
                        <span className="ml-2">
                            {formatDate(competition.startDate)} - {formatDate(competition.endDate)}
                        </span>
                    </div>
                    <div className="flex items-center text-gray-300 text-sm">
                        <UsersIcon />
                        <span className="ml-2">{totalParticipants || (competition.participantIds || []).length} players</span>
                    </div>
                    {rank && (
                        <div className="flex items-center text-yellow-400 text-sm font-bold">
                            <TrophyIcon />
                            <span className="ml-2">Your Rank: {rank} / {totalParticipants}</span>
                        </div>
                    )}
                </div>
            </div>
            {(isAdmin || isOwner) && onDelete && (
                <div className="border-t border-white/10 mt-4 pt-4 flex justify-end">
                    <button onClick={handleDelete} className="text-danger hover:text-red-400 flex items-center gap-1 text-sm">
                        <TrashIcon className="w-4 h-4" /> Delete
                    </button>
                </div>
            )}
            {onJoin && (
                 <button 
                    onClick={onJoin}
                    className="mt-4 w-full bg-primary hover:opacity-90 text-white font-bold py-2 rounded-md transition duration-300">
                    Join Competition
                </button>
            )}
        </div>
    );
};


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

// --- Trading & Portfolio Components ---

const PortfolioView = ({ participantData, onTrade, stockPrices, onViewDetails }) => { // NEW: onViewDetails prop
    if (!participantData) return <div className="glass-card p-6 rounded-lg mt-6"><p>Loading portfolio...</p></div>;

    const { cash, portfolioValue } = participantData;
    const holdings = participantData.holdings || {};

    const totalStockValue = Object.values(holdings).reduce((acc, data) => {
        const currentValue = stockPrices[data.originalSymbol]?.price || data.avgCost;
        return acc + (currentValue * data.shares);
    }, 0);

    return (
        <div className="glass-card p-6 rounded-lg mt-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold mb-2">My Portfolio</h3>
                {/* NEW: View Details Button */}
                <button onClick={onViewDetails} className="text-sm text-primary hover:underline">
                    View Details &rarr;
                </button>
            </div>
            <div className="mb-4">
                <span className="text-3xl font-bold">{formatCurrency(portfolioValue)}</span>
                <p className="text-gray-400 text-sm">Cash: {formatCurrency(cash)}</p>
            </div>
            <table className="w-full text-left">
                <thead className="border-b border-white/10">
                    <tr>
                        <th className="p-2">Symbol</th>
                        <th className="p-2">Shares</th>
                        <th className="p-2">Total Value</th>
                        <th className="p-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(holdings).length > 0 ? (
                        Object.entries(holdings).map(([sanitizedSymbol, data]) => {
                            const currentValue = stockPrices[data.originalSymbol]?.price || data.avgCost;
                            const totalValue = currentValue * data.shares;
                            return (
                                <tr key={sanitizedSymbol} className="border-b border-white/20 last:border-0">
                                    <td className="p-2 font-bold">{data.originalSymbol || sanitizedSymbol}</td>
                                    <td className="p-2">{data.shares}</td>
                                    <td className="p-2">{formatCurrency(totalValue)}</td>
                                    <td className="p-2">
                                        <button onClick={() => onTrade({ '1. symbol': data.originalSymbol, '3. type': data.assetType })} className="bg-primary/50 text-xs py-1 px-2 rounded hover:bg-primary">Trade</button>
                                    </td>
                                </tr>
                            )
                        })
                    ) : (
                        <tr>
                            <td colSpan="4" className="p-4 text-center text-gray-400">You don't own any stocks yet.</td>
                        </tr>
                    )}
                </tbody>
                {Object.keys(holdings).length > 0 && (
                     <tfoot className="border-t-2 border-white/20 font-bold">
                        <tr>
                            <td className="p-2" colSpan="2">Total Stock Value</td>
                            <td className="p-2">{formatCurrency(totalStockValue)}</td>
                            <td className="p-2"></td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
};

const StockSearchView = ({ onSelectStock, isTradingActive }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isTradingActive || !searchTerm.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const timerId = setTimeout(() => {
            searchSymbols(searchTerm).then(searchResults => {
                setResults(searchResults || []);
                setLoading(false);
            });
        }, 500);

        return () => {
            clearTimeout(timerId);
        };
    }, [searchTerm, isTradingActive]);

    if (!isTradingActive) {
        return (
            <div className="glass-card p-6 rounded-lg mt-6 text-center">
                <h3 className="text-xl font-semibold mb-2">Search & Trade</h3>
                <p className="text-gray-400">Trading is not active for this competition.</p>
            </div>
        )
    }

    return (
        <div className="glass-card p-6 rounded-lg mt-6">
            <h3 className="text-xl font-semibold mb-4">Search & Trade</h3>
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search by symbol or name (e.g., AAPL)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/20 p-3 pl-10 rounded-md border border-white/20"
                    spellCheck="false"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><SearchIcon /></div>
            </div>
            {loading && <p className="text-center mt-4">Searching...</p>}
            {results.length > 0 && (
                <ul className="mt-4 max-h-60 overflow-y-auto">
                    {results.map(result => (
                        <li
                            key={result['1. symbol']}
                            onClick={() => {
                                onSelectStock(result);
                                setSearchTerm('');
                                setResults([]);
                            }}
                            className="p-3 hover:bg-white/10 rounded-md cursor-pointer flex justify-between"
                        >
                            <span>
                                <span className="font-bold">{result['1. symbol']}</span>
                                <span className="text-gray-400 ml-2">{result['2. name']}</span>
                            </span>
                             <span className="text-xs bg-gray-600 px-2 py-1 rounded-full">{result['3. type']}</span>
                        </li>
                    ))}
                </ul>
            )}
            {!loading && searchTerm && results.length === 0 && (
                 <p className="text-center text-gray-400 mt-4">No results found for "{searchTerm}".</p>
            )}
        </div>
    );
};

const TradeModal = ({ user, competitionId, asset, stockPrices, onClose }) => {
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tradeType, setTradeType] = useState('buy');
    const [shares, setShares] = useState('1'); // Use string to allow decimal input
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);
    
    const symbol = asset['1. symbol'];
    const assetType = asset['3. type'];
    const isCrypto = assetType === 'Cryptocurrency';

    useEffect(() => {
        const fetchQuote = async () => {
            setLoading(true);
            const quoteData = await getQuote(symbol);
            setQuote(quoteData);
            setLoading(false);
        };
        fetchQuote();
    }, [symbol]);

    const handleTrade = async () => {
        const tradeShares = parseFloat(shares);
        if (isNaN(tradeShares) || tradeShares <= 0) {
            setError('Please enter a positive number of shares.');
            return;
        }
        setProcessing(true);
        setError('');

        const price = parseFloat(quote['05. price']);
        if (isNaN(price)) {
            setError('Could not determine asset price. Please try again.');
            setProcessing(false);
            return;
        }

        const totalCost = tradeShares * price;
        const participantRef = doc(db, 'competitions', competitionId, 'participants', user.uid);
        const sanitizedSymbol = sanitizeSymbolForFirestore(symbol);

        try {
            await runTransaction(db, async (transaction) => {
                const participantDoc = await transaction.get(participantRef);
                if (!participantDoc.exists()) {
                    throw new Error("Your participant data could not be found.");
                }

                const data = participantDoc.data();
                const currentCash = data.cash;
                const currentHoldings = data.holdings || {};
                let newHoldings = { ...currentHoldings };
                let newCash;

                if (tradeType === 'buy') {
                    if (currentCash < totalCost) {
                        throw new Error("Not enough cash to complete this purchase.");
                    }
                    newCash = currentCash - totalCost;
                    const existingHolding = newHoldings[sanitizedSymbol] || { shares: 0, totalCost: 0 };
                    
                    const newShares = existingHolding.shares + tradeShares;
                    const newTotalCost = existingHolding.totalCost + totalCost;
                    const newAvgCost = newTotalCost / newShares;
                    
                    newHoldings[sanitizedSymbol] = { 
                        shares: newShares, 
                        avgCost: newAvgCost, 
                        totalCost: newTotalCost, 
                        name: asset['2. name'] || symbol,
                        originalSymbol: symbol,
                        assetType: assetType || 'Equity'
                    };

                } else { // Sell
                    const existingHolding = newHoldings[sanitizedSymbol];
                    if (!existingHolding || tradeShares > existingHolding.shares) {
                        throw new Error("You don't own enough shares to sell.");
                    }
                    newCash = currentCash + totalCost;
                    const newShares = existingHolding.shares - tradeShares;
                    
                    if (newShares < 0.00001) { // Use a small threshold for float comparison
                        delete newHoldings[sanitizedSymbol];
                    } else {
                        const newTotalCost = existingHolding.totalCost - (tradeShares * existingHolding.avgCost);
                        newHoldings[sanitizedSymbol] = {
                            ...existingHolding,
                            shares: newShares,
                            totalCost: newTotalCost,
                        };
                    }
                }

                // Recalculate total portfolio value
                let newTotalStockValue = 0;
                for (const holding of Object.values(newHoldings)) {
                     // **BUG FIX**: Use the live price for the asset being traded for the most accurate calculation
                    const isCurrentAsset = holding.originalSymbol === symbol;
                    const holdingPrice = isCurrentAsset ? price : (stockPrices[holding.originalSymbol]?.price || holding.avgCost);
                    newTotalStockValue += holdingPrice * holding.shares;
                }
                const newPortfolioValue = newCash + newTotalStockValue;

                transaction.update(participantRef, {
                    cash: newCash,
                    holdings: newHoldings,
                    portfolioValue: newPortfolioValue
                });
            });
            onClose();
        } catch (e) {
            console.error("Transaction failed: ", e);
            setError(e.message || "An unexpected error occurred during the transaction.");
            setProcessing(false);
        }
    };

    const currentPrice = quote ? parseFloat(quote['05. price']) : 0;
    const change = quote ? parseFloat(quote['09. change']) : 0;
    const isPositiveChange = change >= 0;
    const totalValue = isNaN(parseFloat(shares)) ? 0 : parseFloat(shares) * currentPrice;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-card p-8 rounded-lg w-full max-w-md text-white">
                {loading ? <p>Loading quote...</p> : !quote ? <p>Could not retrieve quote for {symbol}.</p> : (
                    <>
                        <h2 className="text-2xl font-bold mb-1">{symbol}</h2>
                        <p className="text-gray-400 mb-4">{asset['2. name'] || 'N/A'}</p>
                        <div className="text-4xl font-bold mb-1 flex items-center gap-4">
                            {formatCurrency(currentPrice)}
                            <span className={`text-lg font-semibold flex items-center ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
                                {isPositiveChange ? <TrendingUpIcon /> : <TrendingDownIcon />}
                                {formatCurrency(change)} ({quote['10. change percent']})
                            </span>
                        </div>
                        <div className="flex border border-white/20 rounded-md my-6">
                            <button onClick={() => setTradeType('buy')} className={`w-1/2 p-3 rounded-l-md ${tradeType === 'buy' ? 'bg-primary' : 'hover:bg-white/10'}`}>Buy</button>
                            <button onClick={() => setTradeType('sell')} className={`w-1/2 p-3 rounded-r-md ${tradeType === 'sell' ? 'bg-danger' : 'hover:bg-white/10'}`}>Sell</button>
                        </div>
                        <div className="mb-4">
                            <label className="block mb-2">Shares</label>
                            <input 
                                type="number" 
                                value={shares} 
                                onChange={e => setShares(e.target.value)}
                                step={isCrypto ? "0.01" : "1"}
                                min={isCrypto ? "0.01" : "1"}
                                className="w-full bg-black/20 p-3 rounded-md border border-white/20" 
                            />
                        </div>
                        <div className="text-lg font-bold mb-4">
                            Total: {formatCurrency(totalValue)}
                        </div>
                        {error && <p className="text-danger mb-4">{error}</p>}
                        <div className="flex justify-end gap-4">
                            <button type="button" onClick={onClose} className="py-2 px-4 rounded-md hover:bg-white/10">Cancel</button>
                            <button onClick={handleTrade} disabled={processing} className={`py-2 px-4 rounded-md ${tradeType === 'buy' ? 'bg-primary' : 'bg-danger'} hover:opacity-90 disabled:opacity-50`}>
                                {processing ? 'Processing...' : `Confirm ${tradeType === 'buy' ? 'Buy' : 'Sell'}`}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};


const CompetitionDetailPage = ({ user, competitionId, onBack, onDeleteCompetition }) => {
    const [competition, setCompetition] = useState(null);
    const [participantData, setParticipantData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tradeModalAsset, setTradeModalAsset] = useState(null);
    const [isInviteModalOpen, setInviteModalOpen] = useState(false);
    const [stockPrices, setStockPrices] = useState({});
    const [showDetailedPortfolio, setShowDetailedPortfolio] = useState(false);

    useEffect(() => {
        const compRef = doc(db, 'competitions', competitionId);
        const unsubscribeComp = onSnapshot(compRef, (doc) => {
            if (doc.exists()) {
                setCompetition({ id: doc.id, ...doc.data() });
            } else {
                onBack();
            }
            setLoading(false);
        });

        const participantRef = doc(db, 'competitions', competitionId, 'participants', user.uid);
        const unsubscribeParticipant = onSnapshot(participantRef, (doc) => {
            if (doc.exists()) {
                setParticipantData(doc.data());
            }
        });

        return () => {
            unsubscribeComp();
            unsubscribeParticipant();
        };
    }, [competitionId, user.uid, onBack]);

    useEffect(() => {
        if (!participantData || !participantData.holdings) {
            return;
        }

        const symbols = Object.values(participantData.holdings).map(h => h.originalSymbol).filter(Boolean);
        if (symbols.length === 0) {
            setStockPrices({});
            return;
        }

        const unsubscribers = symbols.map(symbol => {
            const docRef = doc(db, 'market_data', symbol);
            return onSnapshot(docRef, (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    setStockPrices(prevPrices => ({
                        ...prevPrices,
                        [symbol]: { price: data.price, change: data.change }
                    }));
                }
            });
        });

        return () => unsubscribers.forEach(unsub => unsub());

    }, [participantData]);


    useEffect(() => {
        if (!participantData || !competition) return;

        const status = getCompetitionStatus(competition.startDate, competition.endDate);
        if (status.text !== 'Active') return;

        const { cash, holdings, portfolioValue: currentPortfolioValue } = participantData;
        
        let totalStockValue = 0;
        let allPricesAvailable = true;

        Object.values(holdings).forEach(holding => {
            const price = stockPrices[holding.originalSymbol]?.price;
            if (price === undefined) {
                allPricesAvailable = false;
            } else {
                totalStockValue += price * holding.shares;
            }
        });

        if (!allPricesAvailable) return;

        const newPortfolioValue = cash + totalStockValue;
        
        if (Math.abs(newPortfolioValue - currentPortfolioValue) > 0.01) {
            const participantRef = doc(db, 'competitions', competitionId, 'participants', user.uid);
            updateDoc(participantRef, { portfolioValue: newPortfolioValue })
                .catch(err => console.error("Error updating portfolio value:", err));
        }

    }, [stockPrices, participantData, competition, competitionId, user.uid]);


    if (loading) return <p className="p-8 text-white">Loading competition details...</p>;
    if (!competition) return <p className="p-8 text-white">Competition not found.</p>;

    const status = getCompetitionStatus(competition.startDate, competition.endDate);
    const isTradingActive = status.text === 'Active';
    const isOwner = user.uid === competition.ownerId;
    const isAdmin = user.role === 'admin';
    const canInvite = competition.isPublic || isOwner || isAdmin;
    
    const handleTradeFromDetailed = (symbol) => {
        const holding = Object.values(participantData.holdings).find(h => h.originalSymbol === symbol);
        const asset = { '1. symbol': symbol, '3. type': holding?.assetType || 'Equity' };
        setTradeModalAsset(asset);
        setShowDetailedPortfolio(false);
    };
    
    if (showDetailedPortfolio) {
        return (
            <Suspense fallback={<div className="p-8 text-white">Loading Portfolio...</div>}>
                <DetailedPortfolioView 
                    participantData={participantData}
                    stockPrices={stockPrices}
                    onTrade={handleTradeFromDetailed}
                    onBack={() => setShowDetailedPortfolio(false)}
                />
            </Suspense>
        );
    }

    return (
        <div className="p-8 text-white">
            {tradeModalAsset && isTradingActive && (
                <TradeModal 
                    user={user}
                    competitionId={competitionId} 
                    asset={tradeModalAsset} 
                    stockPrices={stockPrices}
                    onClose={() => setTradeModalAsset(null)} 
                />
            )}
            {isInviteModalOpen && (
                <InviteModal 
                    user={user}
                    competition={competition}
                    onClose={() => setInviteModalOpen(false)}
                />
            )}
            <div className="flex justify-between items-start mb-6">
                 <button onClick={onBack} className="text-primary hover:underline">{'< Back to Home'}</button>
                 <div className="flex items-center gap-4">
                    {canInvite && (
                        <button onClick={() => setInviteModalOpen(true)} className="bg-primary/80 hover:bg-primary text-white font-bold py-2 px-4 rounded-md flex items-center gap-2">
                            <UserAddIcon /> Invite Players
                        </button>
                    )}
                    {(isAdmin || isOwner) && (
                         <button onClick={() => onDeleteCompetition(competition)} className="bg-danger/80 hover:bg-danger text-white font-bold py-2 px-4 rounded-md flex items-center gap-2">
                            <TrashIcon className="w-5 h-5" /> Delete
                        </button>
                    )}
                 </div>
            </div>
            
            <div className="flex items-center gap-4">
                <h1 className="text-4xl font-bold">{competition.name}</h1>
                <span className={`text-lg font-bold px-3 py-1 rounded-full ${status.color}`}>{status.text}</span>
            </div>
            <p className="text-gray-400 mt-2">
                {formatDate(competition.startDate)} to {formatDate(competition.endDate)} • Owner: {competition.ownerName}
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                <div className="lg:col-span-2">
                    <Leaderboard competitionId={competitionId} userId={user.uid} />
                </div>
                <div className="lg:col-span-1">
                    <PortfolioView 
                        participantData={participantData} 
                        onTrade={setTradeModalAsset} 
                        stockPrices={stockPrices}
                        onViewDetails={() => setShowDetailedPortfolio(true)}
                    />
                    <StockSearchView onSelectStock={setTradeModalAsset} isTradingActive={isTradingActive} />
                </div>
            </div>
        </div>
    );
};

// --- Navigation Components ---
const SideBar = ({ user, activeTab, onNavigate }) => {
    const [hasInvites, setHasInvites] = useState(false);

    useEffect(() => {
        if (!user?.username) return;
        const q = query(collectionGroup(db, 'invitations'), where('invitedUsername', '==', user.username));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setHasInvites(!snapshot.empty);
        });
        return () => unsubscribe();
    }, [user?.username]);

    const NavItem = ({ icon, label, name, hasNotification }) => (
        <li onClick={() => onNavigate(name)} className={`relative flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors ${activeTab === name ? 'bg-primary text-white' : 'text-gray-300 hover:bg-white/10'}`}>
            {icon}
            <span className="ml-3">{label}</span>
            {hasNotification && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>}
        </li>
    );

    return (
        <div className="w-64 glass-card h-screen flex-shrink-0 flex flex-col p-4">
            <div className="flex items-center mb-8"><h1 className="text-2xl font-bold text-white">Stock Game</h1></div>
            <ul className="flex-grow">
                <NavItem icon={<HomeIcon />} label="Home" name="home" />
                <NavItem icon={<ExploreIcon />} label="Explore" name="explore" />
                <NavItem icon={<AlertsIcon />} label="Alerts" name="alerts" hasNotification={hasInvites} />
                {user.role === 'admin' && <NavItem icon={<AdminIcon />} label="Admin" name="admin" />}
            </ul>
            <div className="border-t border-white/20 pt-4">
                 <div className="flex items-center p-3 rounded-lg text-white"><ProfileIcon /><span className="ml-3">{user.username || 'Player'}</span></div>
                <div onClick={() => signOut(auth)} className="flex items-center p-3 rounded-lg cursor-pointer text-gray-300 hover:bg-white/10"><LogoutIcon /><span className="ml-3">Logout</span></div>
            </div>
        </div>
    );
};

// --- Main App Component ---
function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('home');
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [selectedCompetitionId, setSelectedCompetitionId] = useState(null);
    const [competitionToDelete, setCompetitionToDelete] = useState(null);
    const [showInactivityModal, setShowInactivityModal] = useState(false);
    const [countdown, setCountdown] = useState(60);

    const inactivityTimer = useRef(null);
    const warningTimer = useRef(null);
    const countdownTimer = useRef(null);

    const handleLogout = useCallback(() => {
        signOut(auth);
    }, []);

    const resetInactivityTimer = useCallback(() => {
        clearTimeout(inactivityTimer.current);
        clearTimeout(warningTimer.current);
        clearInterval(countdownTimer.current);
        setShowInactivityModal(false);

        // Show warning after 29 minutes
        warningTimer.current = setTimeout(() => {
            setCountdown(60);
            setShowInactivityModal(true);
            countdownTimer.current = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        }, 29 * 60 * 1000); // 29 minutes

        // Logout after 30 minutes
        inactivityTimer.current = setTimeout(handleLogout, 30 * 60 * 1000); // 30 minutes
    }, [handleLogout]);

    useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        
        if (user) {
            events.forEach(event => window.addEventListener(event, resetInactivityTimer));
            resetInactivityTimer();
        }

        return () => {
            events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
            clearTimeout(inactivityTimer.current);
            clearTimeout(warningTimer.current);
            clearInterval(countdownTimer.current);
        };
    }, [user, resetInactivityTimer]);

    useEffect(() => {
        if (countdown <= 0) {
            clearInterval(countdownTimer.current);
            handleLogout();
        }
    }, [countdown, handleLogout]);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUser({ uid: firebaseUser.uid, ...userDoc.data() });
                } else {
                    const defaultUserData = { uid: firebaseUser.uid, email: firebaseUser.email, username: 'New Player', role: 'player' };
                    await setDoc(userDocRef, defaultUserData);
                    setUser(defaultUserData);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    const handleNavigation = (tab) => {
        setActiveTab(tab);
        setSelectedCompetitionId(null);
    }

    const handleDeleteCompetitionClick = (competition) => {
        setCompetitionToDelete(competition);
    };

    const handleConfirmDeleteCompetition = async () => {
        if (!competitionToDelete) return;
        try {
            await deleteDoc(doc(db, 'competitions', competitionToDelete.id));
            // If the deleted competition was being viewed, go back to the list
            if (selectedCompetitionId === competitionToDelete.id) {
                setSelectedCompetitionId(null);
            }
        } catch (error) {
            console.error("Error deleting competition:", error);
            alert("Failed to delete competition.");
        } finally {
            setCompetitionToDelete(null);
        }
    };

    const renderContent = () => {
        if (selectedCompetitionId) {
            return (
                <CompetitionDetailPage 
                    user={user} 
                    competitionId={selectedCompetitionId} 
                    onBack={() => setSelectedCompetitionId(null)} 
                    onDeleteCompetition={handleDeleteCompetitionClick}
                />
            );
        }
        switch (activeTab) {
            case 'home':
                return (
                    <HomePage 
                        user={user} 
                        onSelectCompetition={setSelectedCompetitionId} 
                        onDeleteCompetition={handleDeleteCompetitionClick}
                    />
                );
            case 'explore':
                return <ExplorePage user={user} onJoinCompetition={setSelectedCompetitionId} />;
            case 'alerts':
                return <AlertsPage user={user} />;
            case 'admin':
                if (user?.role === 'admin') {
                    return <AdminPage />;
                } else {
                     setActiveTab('home'); // Fallback for non-admins
                     return <HomePage user={user} onSelectCompetition={setSelectedCompetitionId} onDeleteCompetition={handleDeleteCompetitionClick}/>;
                }
            default:
                return <HomePage user={user} onSelectCompetition={setSelectedCompetitionId} onDeleteCompetition={handleDeleteCompetitionClick}/>;
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-white"><p>Loading App...</p></div>;
    }

    return (
        <div className="flex bg-gray-900 min-h-screen">
            {user ? (
                <>
                    {showInactivityModal && (
                        <InactivityWarningModal 
                            onStay={resetInactivityTimer}
                            onLogout={handleLogout}
                            countdown={countdown}
                        />
                    )}
                    {isCreateModalOpen && <CreateCompetitionModal user={user} onClose={() => setCreateModalOpen(false)} />}
                    {competitionToDelete && (
                        <ConfirmDeleteModal 
                            title="Confirm Competition Deletion"
                            body={`Are you sure you want to permanently delete the competition "${competitionToDelete.name}"? This action cannot be undone.`}
                            onConfirm={handleConfirmDeleteCompetition}
                            onCancel={() => setCompetitionToDelete(null)}
                        />
                    )}
                    <SideBar user={user} activeTab={activeTab} onNavigate={handleNavigation} />
                    <main className="flex-grow">
                        <div className="p-8 pb-0 text-right">
                             <button onClick={() => setCreateModalOpen(true)} className="bg-primary hover:opacity-90 text-white font-bold py-2 px-4 rounded-md flex items-center gap-2 float-right">
                                <PlusIcon /> Create Competition
                            </button>
                        </div>
                        <Suspense fallback={<div className="p-8 text-white">Loading Page...</div>}>
                            {renderContent()}
                        </Suspense>
                    </main>
                </>
            ) : (
                <AuthPage />
            )}
        </div>
    );
}

export default App;
