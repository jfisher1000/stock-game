import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    Timestamp,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';


// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Helper & Icon Components ---
const formatDate = (ts) => ts ? new Date(ts.seconds * 1000).toLocaleDateString() : 'N/A';
const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const Icon = ({ path, className = "w-6 h-6" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path></svg>;
const HomeIcon = () => <Icon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />;
const CompetitionsIcon = () => <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />;
const ExploreIcon = () => <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />;
const ProfileIcon = () => <Icon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />;
const LogoutIcon = () => <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />;
const AdminIcon = () => <Icon path="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />;
const PlusIcon = () => <Icon path="M12 4v16m8-8H4" />;
const LockClosedIcon = () => <Icon className="w-4 h-4 text-gray-400" path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />;
const LockOpenIcon = () => <Icon className="w-4 h-4 text-green-400" path="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />;
const UsersIcon = () => <Icon className="w-4 h-4 text-gray-400" path="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 3a4 4 0 014 4v2" />;


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

// --- Competition & Page Components ---

const CreateCompetitionModal = ({ user, onClose }) => {
    const [name, setName] = useState('');
    const [startingCash, setStartingCash] = useState(100000);
    const [isPublic, setIsPublic] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Competition name is required.');
            return;
        }
        setLoading(true);
        try {
            const competitionRef = await addDoc(collection(db, 'competitions'), {
                name,
                startingCash,
                isPublic,
                ownerId: user.uid,
                ownerName: user.username,
                createdAt: serverTimestamp(),
                participantIds: [user.uid]
            });

            const participantRef = doc(db, 'competitions', competitionRef.id, 'participants', user.uid);
            await setDoc(participantRef, {
                username: user.username,
                portfolioValue: startingCash,
                cash: startingCash,
                joinedAt: serverTimestamp()
            });

            onClose();
        } catch (err) {
            setError('Failed to create competition. Please try again.');
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="glass-card p-8 rounded-lg w-full max-w-md text-white">
                <h2 className="text-2xl font-bold mb-4">Create New Competition</h2>
                <form onSubmit={handleCreate}>
                    <div className="mb-4">
                        <label className="block mb-2">Competition Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/20 p-3 rounded-md border border-white/20" />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2">Starting Cash</label>
                        <input type="number" value={startingCash} onChange={e => setStartingCash(Number(e.target.value))} className="w-full bg-black/20 p-3 rounded-md border border-white/20" />
                    </div>
                    <div className="mb-4 flex items-center">
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

const Leaderboard = ({ competitionId }) => {
    const [participants, setParticipants] = useState([]);

    useEffect(() => {
        const q = query(collection(db, 'competitions', competitionId, 'participants'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedParticipants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort client-side
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
                            <tr key={p.id} className="border-b border-white/10 last:border-b-0">
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

const MyCompetitionsPage = ({ user }) => {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'competitions'), where('participantIds', 'array-contains', user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCompetitions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    if (loading) return <p className="p-8 text-white">Loading your competitions...</p>;

    return (
        <div className="p-8 text-white">
            <h1 className="text-4xl font-bold mb-6">My Competitions</h1>
            {competitions.length === 0 ? (
                <p>You haven't joined any competitions yet. Go to Explore to find one!</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {competitions.map(comp => <CompetitionCard key={comp.id} competition={comp} user={user} />)}
                </div>
            )}
        </div>
    );
};

const CompetitionCard = ({ competition, user }) => {
    // This would ideally show more details, maybe a mini-leaderboard preview
    // For now, it's a simple card.
    return (
        <div className="glass-card p-6 rounded-lg">
            <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold">{competition.name}</h3>
                {competition.isPublic ? <LockOpenIcon /> : <LockClosedIcon />}
            </div>
            <p className="text-gray-400 mt-2">Created by {competition.ownerName}</p>
            <p className="text-gray-400">Starts with {formatCurrency(competition.startingCash)}</p>
            <div className="flex items-center mt-4 text-gray-400">
                <UsersIcon />
                <span className="ml-2">{competition.participantIds.length} players</span>
            </div>
        </div>
    );
};

const ExplorePage = ({ user }) => {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'competitions'), where('isPublic', '==', true));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCompetitions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    const handleJoin = async (comp) => {
        if (comp.participantIds.includes(user.uid)) {
            alert("You've already joined this competition!");
            return;
        }

        const batch = writeBatch(db);

        // Add user to the participants subcollection
        const participantRef = doc(db, 'competitions', comp.id, 'participants', user.uid);
        batch.set(participantRef, {
            username: user.username,
            portfolioValue: comp.startingCash,
            cash: comp.startingCash,
            joinedAt: serverTimestamp()
        });
        
        // Add user's ID to the participantIds array in the main competition doc
        const competitionRef = doc(db, 'competitions', comp.id);
        batch.update(competitionRef, {
            participantIds: [...comp.participantIds, user.uid]
        });

        try {
            await batch.commit();
            alert("Successfully joined!");
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
                    <div key={comp.id} className="glass-card p-6 rounded-lg flex flex-col">
                        <div className="flex-grow">
                            <h3 className="text-xl font-bold">{comp.name}</h3>
                            <p className="text-gray-400 mt-2">Created by {comp.ownerName}</p>
                            <p className="text-gray-400">Starts with {formatCurrency(comp.startingCash)}</p>
                            <div className="flex items-center mt-4 text-gray-400">
                                <UsersIcon />
                                <span className="ml-2">{comp.participantIds.length} players</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleJoin(comp)}
                            disabled={comp.participantIds.includes(user.uid)}
                            className="mt-4 w-full bg-primary hover:opacity-90 text-white font-bold py-2 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed">
                            {comp.participantIds.includes(user.uid) ? 'Joined' : 'Join'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};


const AdminPage = () => <div className="p-8 text-white"><h1 className="text-4xl font-bold">Admin Dashboard</h1></div>;


// --- Navigation Components ---
const SideBar = ({ user, activeTab, onNavigate }) => {
    const NavItem = ({ icon, label, name }) => (
        <li onClick={() => onNavigate(name)} className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors ${activeTab === name ? 'bg-primary text-white' : 'text-gray-300 hover:bg-white/10'}`}>
            {icon}
            <span className="ml-3">{label}</span>
        </li>
    );

    return (
        <div className="w-64 glass-card h-screen flex-shrink-0 flex flex-col p-4">
            <div className="flex items-center mb-8"><h1 className="text-2xl font-bold text-white">Stock Game</h1></div>
            <ul className="flex-grow">
                <NavItem icon={<HomeIcon />} label="Home" name="home" />
                <NavItem icon={<CompetitionsIcon />} label="My Competitions" name="competitions" />
                <NavItem icon={<ExploreIcon />} label="Explore" name="explore" />
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
    const [activeTab, setActiveTab] = useState('competitions');
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUser({ uid: firebaseUser.uid, ...userDoc.data() });
                } else {
                    setUser({ uid: firebaseUser.uid, email: firebaseUser.email, username: 'Player', role: 'player' });
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const renderContent = () => {
        switch (activeTab) {
            case 'home':
                return <MyCompetitionsPage user={user} />; // Defaulting home to my competitions for now
            case 'competitions':
                return <MyCompetitionsPage user={user} />;
            case 'explore':
                return <ExplorePage user={user} />;
            case 'admin':
                return user?.role === 'admin' ? <AdminPage /> : <MyCompetitionsPage user={user} />;
            default:
                return <MyCompetitionsPage user={user} />;
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-white"><p>Loading App...</p></div>;
    }

    return (
        <div className="flex bg-gray-900 min-h-screen">
            {user ? (
                <>
                    {isCreateModalOpen && <CreateCompetitionModal user={user} onClose={() => setCreateModalOpen(false)} />}
                    <SideBar user={user} activeTab={activeTab} onNavigate={setActiveTab} />
                    <main className="flex-grow">
                        <div className="p-8">
                             <button onClick={() => setCreateModalOpen(true)} className="bg-primary hover:opacity-90 text-white font-bold py-2 px-4 rounded-md flex items-center gap-2 float-right">
                                <PlusIcon /> Create Competition
                            </button>
                        </div>
                        {renderContent()}
                    </main>
                </>
            ) : (
                <AuthPage />
            )}
        </div>
    );
}

export default App;
