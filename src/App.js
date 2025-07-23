import React, { useState, useEffect, useCallback } from 'react';
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
    serverTimestamp,
    writeBatch,
    runTransaction,
    Timestamp,
} from 'firebase/firestore';
import { debouncedSearchSymbols, getQuote } from './api';


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
const formatPercentage = (num) => `${(num * 100).toFixed(2)}%`;

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
const SearchIcon = () => <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />;
const TrendingUpIcon = () => <Icon className="w-4 h-4 text-green-500" path="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />;
const TrendingDownIcon = () => <Icon className="w-4 h-4 text-red-500" path="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />;


// --- Authentication Page Component ---
const AuthPage = () => {
    // ... (This component remains unchanged)
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
    // ... (This component remains unchanged)
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
                joinedAt: serverTimestamp(),
                holdings: {} // Initialize holdings
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
    // ... (This component remains unchanged)
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

const MyCompetitionsPage = ({ user, onSelectCompetition }) => {
    // ... (This component remains unchanged)
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
                    {competitions.map(comp => <CompetitionCard key={comp.id} competition={comp} onClick={() => onSelectCompetition(comp.id)} />)}
                </div>
            )}
        </div>
    );
};

const CompetitionCard = ({ competition, onClick }) => {
    // This component is updated to be a button for better click handling
    return (
        <button 
            onClick={onClick} 
            className="glass-card p-6 rounded-lg cursor-pointer hover:border-primary/50 border border-transparent transition-all text-left w-full"
        >
            <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold">{competition.name}</h3>
                {competition.isPublic ? <LockOpenIcon /> : <LockClosedIcon />}
            </div>
            <p className="text-gray-400 mt-2">Created by {competition.ownerName}</p>
            <p className="text-gray-400">Starts with {formatCurrency(competition.startingCash)}</p>
            <div className="flex items-center mt-4 text-gray-400">
                <UsersIcon />
                <span className="ml-2">{(competition.participantIds || []).length} players</span>
            </div>
        </button>
    );
};

const ExplorePage = ({ user }) => {
    // ... (This component remains unchanged, but we add holdings to the join action)
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
        if ((comp.participantIds || []).includes(user.uid)) {
            alert("You've already joined this competition!");
            return;
        }

        const batch = writeBatch(db);
        const participantRef = doc(db, 'competitions', comp.id, 'participants', user.uid);
        batch.set(participantRef, {
            username: user.username,
            portfolioValue: comp.startingCash,
            cash: comp.startingCash,
            joinedAt: serverTimestamp(),
            holdings: {} // Initialize holdings
        });
        
        const competitionRef = doc(db, 'competitions', comp.id);
        batch.update(competitionRef, {
            participantIds: [...(comp.participantIds || []), user.uid]
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
                                <span className="ml-2">{(comp.participantIds || []).length} players</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleJoin(comp)}
                            disabled={(comp.participantIds || []).includes(user.uid)}
                            className="mt-4 w-full bg-primary hover:opacity-90 text-white font-bold py-2 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed">
                            {(comp.participantIds || []).includes(user.uid) ? 'Joined' : 'Join'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- NEW Trading & Portfolio Components ---

const PortfolioView = ({ participantData, onTrade }) => {
    if (!participantData) return <div className="glass-card p-6 rounded-lg mt-6"><p>Loading portfolio...</p></div>;

    const { cash, holdings } = participantData;

    return (
        <div className="glass-card p-6 rounded-lg mt-6">
            <h3 className="text-xl font-semibold mb-4">My Portfolio</h3>
            <div className="mb-4">
                <span className="text-gray-400">Cash Balance:</span>
                <span className="text-2xl font-bold ml-2">{formatCurrency(cash)}</span>
            </div>
            <table className="w-full text-left">
                <thead className="border-b border-white/10">
                    <tr>
                        <th className="p-2">Symbol</th>
                        <th className="p-2">Shares</th>
                        <th className="p-2">Avg. Cost</th>
                        <th className="p-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(holdings || {}).length > 0 ? (
                        Object.entries(holdings).map(([symbol, data]) => (
                            <tr key={symbol} className="border-b border-white/20 last:border-0">
                                <td className="p-2 font-bold">{symbol}</td>
                                <td className="p-2">{data.shares}</td>
                                <td className="p-2">{formatCurrency(data.avgCost)}</td>
                                <td className="p-2">
                                    <button onClick={() => onTrade(symbol)} className="bg-primary/50 text-xs py-1 px-2 rounded hover:bg-primary">Trade</button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" className="p-4 text-center text-gray-400">You don't own any stocks yet.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

const StockSearchView = ({ onSelectStock }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = useCallback(async (term) => {
        if (term) {
            setLoading(true);
            const searchResults = await debouncedSearchSymbols(term);
            setResults(searchResults);
            setLoading(false);
        } else {
            setResults([]);
        }
    }, []);

    useEffect(() => {
        handleSearch(searchTerm);
    }, [searchTerm, handleSearch]);

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
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><SearchIcon /></div>
            </div>
            {loading && <p className="text-center mt-4">Searching...</p>}
            {results.length > 0 && (
                <ul className="mt-4 max-h-60 overflow-y-auto">
                    {results.map(result => (
                        <li
                            key={result['1. symbol']}
                            onClick={() => onSelectStock(result['1. symbol'])}
                            className="p-3 hover:bg-white/10 rounded-md cursor-pointer flex justify-between"
                        >
                            <span>
                                <span className="font-bold">{result['1. symbol']}</span>
                                <span className="text-gray-400 ml-2">{result['2. name']}</span>
                            </span>
                            <span className="text-gray-500">{result['4. region']}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const TradeModal = ({ user, competitionId, symbol, onClose }) => {
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tradeType, setTradeType] = useState('buy'); // 'buy' or 'sell'
    const [shares, setShares] = useState(1);
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);
    
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
        if (shares <= 0) {
            setError('Please enter a positive number of shares.');
            return;
        }
        setProcessing(true);
        setError('');

        const price = parseFloat(quote['05. price']);
        const totalCost = shares * price;
        const participantRef = doc(db, 'competitions', competitionId, 'participants', user.uid);

        try {
            await runTransaction(db, async (transaction) => {
                const participantDoc = await transaction.get(participantRef);
                if (!participantDoc.exists()) {
                    throw "Participant document does not exist!";
                }

                const data = participantDoc.data();
                const currentCash = data.cash;
                const currentHoldings = data.holdings || {};

                if (tradeType === 'buy') {
                    if (currentCash < totalCost) {
                        throw "Not enough cash to complete this purchase.";
                    }
                    const newCash = currentCash - totalCost;
                    const existingShares = currentHoldings[symbol]?.shares || 0;
                    const existingCost = currentHoldings[symbol]?.totalCost || 0;
                    
                    const newShares = existingShares + shares;
                    const newTotalCost = existingCost + totalCost;
                    const newAvgCost = newTotalCost / newShares;

                    transaction.update(participantRef, {
                        cash: newCash,
                        [`holdings.${symbol}`]: { shares: newShares, avgCost: newAvgCost, totalCost: newTotalCost, name: quote['2. name'] }
                    });

                } else { // Sell
                    const existingShares = currentHoldings[symbol]?.shares || 0;
                    if (shares > existingShares) {
                        throw "You don't own enough shares to sell.";
                    }
                    const newCash = currentCash + totalCost;
                    const newShares = existingShares - shares;

                    if (newShares === 0) {
                        const newHoldings = { ...currentHoldings };
                        delete newHoldings[symbol];
                        transaction.update(participantRef, { cash: newCash, holdings: newHoldings });
                    } else {
                        const existingTotalCost = currentHoldings[symbol].totalCost;
                        const avgCost = currentHoldings[symbol].avgCost;
                        const newTotalCost = existingTotalCost - (shares * avgCost); // Reduce total cost based on avg cost
                        transaction.update(participantRef, {
                            cash: newCash,
                            [`holdings.${symbol}.shares`]: newShares,
                             [`holdings.${symbol}.totalCost`]: newTotalCost
                        });
                    }
                }
            });
            onClose(); // Close modal on success
        } catch (e) {
            console.error("Transaction failed: ", e);
            setError(e.toString());
        }
        setProcessing(false);
    };

    const currentPrice = quote ? parseFloat(quote['05. price']) : 0;
    const change = quote ? parseFloat(quote['09. change']) : 0;
    const isPositiveChange = change >= 0;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-card p-8 rounded-lg w-full max-w-md text-white">
                {loading ? <p>Loading quote...</p> : !quote ? <p>Could not retrieve quote for {symbol}.</p> : (
                    <>
                        <h2 className="text-2xl font-bold mb-1">{symbol}</h2>
                        <p className="text-gray-400 mb-4">{quote['2. name'] || 'N/A'}</p>
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
                            <input type="number" min="1" value={shares} onChange={e => setShares(parseInt(e.target.value, 10))} className="w-full bg-black/20 p-3 rounded-md border border-white/20" />
                        </div>
                        <div className="text-lg font-bold mb-4">
                            Total: {formatCurrency(shares * currentPrice)}
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


const CompetitionDetailPage = ({ user, competitionId, onBack }) => {
    const [competition, setCompetition] = useState(null);
    const [participantData, setParticipantData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tradeModalSymbol, setTradeModalSymbol] = useState(null);

    useEffect(() => {
        const compRef = doc(db, 'competitions', competitionId);
        const unsubscribeComp = onSnapshot(compRef, (doc) => {
            if (doc.exists()) {
                setCompetition({ id: doc.id, ...doc.data() });
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
    }, [competitionId, user.uid]);

    if (loading) return <p className="p-8 text-white">Loading competition details...</p>;
    if (!competition) return <p className="p-8 text-white">Competition not found.</p>;

    return (
        <div className="p-8 text-white">
            {tradeModalSymbol && (
                <TradeModal 
                    user={user}
                    competitionId={competitionId} 
                    symbol={tradeModalSymbol} 
                    onClose={() => setTradeModalSymbol(null)} 
                />
            )}
            <button onClick={onBack} className="mb-6 text-primary hover:underline">{'< Back to My Competitions'}</button>
            <h1 className="text-4xl font-bold">{competition.name}</h1>
            <p className="text-gray-400 mt-2">Created by {competition.ownerName} on {formatDate(competition.createdAt)}</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                <div className="lg:col-span-2">
                    <Leaderboard competitionId={competitionId} />
                </div>
                <div className="lg:col-span-1">
                    <PortfolioView participantData={participantData} onTrade={setTradeModalSymbol} />
                    <StockSearchView onSelectStock={setTradeModalSymbol} />
                </div>
            </div>
        </div>
    );
};


const AdminPage = () => <div className="p-8 text-white"><h1 className="text-4xl font-bold">Admin Dashboard</h1></div>;


// --- Navigation Components ---
const SideBar = ({ user, activeTab, onNavigate }) => {
    // ... (This component remains unchanged)
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
    const [selectedCompetitionId, setSelectedCompetitionId] = useState(null);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUser({ uid: firebaseUser.uid, ...userDoc.data() });
                } else {
                    // This case is for users who authenticated but might not have a user doc yet.
                    // A default profile is created.
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
        setSelectedCompetitionId(null); // Reset selected competition when changing tabs
    }

    const renderContent = () => {
        if (selectedCompetitionId) {
            return <CompetitionDetailPage user={user} competitionId={selectedCompetitionId} onBack={() => setSelectedCompetitionId(null)} />;
        }
        switch (activeTab) {
            case 'competitions':
                return <MyCompetitionsPage user={user} onSelectCompetition={setSelectedCompetitionId} />;
            case 'explore':
                return <ExplorePage user={user} />;
            case 'admin':
                return user?.role === 'admin' ? <AdminPage /> : <MyCompetitionsPage user={user} onSelectCompetition={setSelectedCompetitionId}/>;
            default:
                return <MyCompetitionsPage user={user} onSelectCompetition={setSelectedCompetitionId} />;
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
                    <SideBar user={user} activeTab={activeTab} onNavigate={handleNavigation} />
                    <main className="flex-grow">
                        <div className="p-8 pb-0 text-right">
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
