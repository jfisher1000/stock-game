import React, { useState, useEffect, useMemo } from 'react';
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
    onSnapshot,
    Timestamp,
    addDoc,
    getDocs
} from 'firebase/firestore';

// --- Firebase Configuration ---
// SECURE SETUP: Your Firebase config should be in a .env file in your project's root.
// Create a file named .env and add your config like this:
// REACT_APP_API_KEY=AIzaSy...
// REACT_APP_AUTH_DOMAIN=your-project.firebaseapp.com
// ...and so on for all the keys.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Helper Components ---
const formatDate = (firebaseTimestamp) => {
    if (!firebaseTimestamp) return 'N/A';
    return firebaseTimestamp.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

// --- Page Components ---

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
            try { await signInWithEmailAndPassword(auth, email, password); } catch (err) { setError(err.message); setLoading(false); }
        } else {
            if (username.length < 3) { setError("Username must be at least 3 characters long."); setLoading(false); return; }
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const userDocRef = doc(db, `users`, userCredential.user.uid);
                await setDoc(userDocRef, { username: username, email: userCredential.user.email, createdAt: Timestamp.now(), role: 'player' });
            } catch (err) { setError(err.message); setLoading(false); }
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-lg p-8 border border-indigo-500/30">
                <h1 className="text-3xl font-bold text-center text-white mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                <p className="text-center text-gray-400 mb-6">{isLogin ? 'Sign in to view competitions' : 'Join the ultimate virtual trading game'}</p>
                <form onSubmit={handleAuthAction}>
                    {!isLogin && (<div className="mb-4"><label className="block text-gray-400 mb-2" htmlFor="username">Username</label><input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-gray-900 text-white p-3 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" required /></div>)}
                    <div className="mb-4"><label className="block text-gray-400 mb-2" htmlFor="email">Email</label><input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-900 text-white p-3 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" required /></div>
                    <div className="mb-6"><label className="block text-gray-400 mb-2" htmlFor="password">Password</label><input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-900 text-white p-3 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" required /></div>
                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-md transition duration-300 disabled:bg-indigo-800" disabled={loading}>{loading ? 'Processing...' : (isLogin ? 'Log In' : 'Register')}</button>
                </form>
                <p className="text-center text-gray-500 mt-6">{isLogin ? "Don't have an account?" : "Already have an account?"}<button onClick={() => setIsLogin(!isLogin)} className="text-indigo-400 hover:text-indigo-300 ml-2 font-semibold">{isLogin ? 'Register' : 'Log In'}</button></p>
            </div>
        </div>
    );
};

const LobbyPage = ({ user, onSelectCompetition, onGoToAdmin, onGoToCreate }) => {
    const [competitions, setCompetitions] = useState([]);
    const [userPortfolios, setUserPortfolios] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "competitions"));
        const unsubscribeComps = onSnapshot(q, (querySnapshot) => {
            const comps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCompetitions(comps.filter(c => c.isPublic));
            setLoading(false);
        }, (error) => { console.error("Error fetching competitions: ", error); setLoading(false); });

        const fetchPortfolios = async () => {
            const compQuery = await getDocs(collection(db, "competitions"));
            const portfolios = {};
            for (const compDoc of compQuery.docs) {
                const portfolioDocRef = doc(db, `competitions/${compDoc.id}/participants`, user.uid);
                const portfolioSnap = await getDoc(portfolioDocRef);
                if (portfolioSnap.exists()) {
                    portfolios[compDoc.id] = true;
                }
            }
            setUserPortfolios(portfolios);
        };
        
        if (user.uid) {
            fetchPortfolios();
        }

        return () => unsubscribeComps();
    }, [user.uid]);
    
    const handleJoinCompetition = async (competition) => {
        const portfolioDocRef = doc(db, `competitions/${competition.id}/participants`, user.uid);
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        const username = userDoc.exists() ? userDoc.data().username : 'Anonymous';

        const initialPortfolio = { 
            cash: competition.initialCash, 
            stocks: {},
            userId: user.uid,
            username: username
        };
        await setDoc(portfolioDocRef, initialPortfolio);
        onSelectCompetition(competition.id);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
            <header className="max-w-5xl mx-auto flex justify-between items-center mb-8">
                <div><h1 className="text-3xl font-bold">Welcome, {user.username || 'Player'}!</h1><p className="text-gray-400">Choose a competition to join or create your own.</p></div>
                <div className="flex items-center">
                    <button onClick={onGoToCreate} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition mr-4">Create Competition</button>
                    {user.role === 'admin' && (
                        <button onClick={onGoToAdmin} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition mr-4">Admin Panel</button>
                    )}
                    <button onClick={() => signOut(auth)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition">Logout</button>
                </div>
            </header>
            <main className="max-w-5xl mx-auto">
                {loading ? <p>Loading competitions...</p> : (
                    competitions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {competitions.map(comp => (
                                <div key={comp.id} className="bg-gray-800 rounded-lg p-6 flex flex-col justify-between border border-gray-700 hover:border-indigo-500 transition-all">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h2 className="text-2xl font-bold text-indigo-400">{comp.name}</h2>
                                            {!comp.isPublic && <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded-full flex-shrink-0">Private</span>}
                                        </div>
                                        <p className="text-gray-400 mt-2 mb-4">{comp.description}</p>
                                        <p className="text-sm text-gray-500">Created by: {comp.ownerName || 'Admin'}</p>
                                        <p className="text-sm text-gray-500">Starts: {formatDate(comp.startDate)}</p>
                                        <p className="text-sm text-gray-500">Ends: {formatDate(comp.endDate)}</p>
                                        <p className="text-lg font-semibold mt-3">Starting Cash: {formatCurrency(comp.initialCash)}</p>
                                    </div>
                                    {userPortfolios[comp.id] ? (
                                        <button onClick={() => onSelectCompetition(comp.id)} className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition">View Competition</button>
                                    ) : (
                                        <button onClick={() => handleJoinCompetition(comp)} className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition">Join Competition</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center bg-gray-800 p-8 rounded-lg">
                            <h2 className="text-2xl font-bold text-white">No Public Competitions Found</h2>
                            <p className="text-gray-400 mt-2">No one has created any public competitions yet. Why don't you be the first?</p>
                        </div>
                    )
                )}
            </main>
        </div>
    );
};

const CompetitionPage = ({ user, competitionId, onExit }) => {
    const [competition, setCompetition] = useState(null);
    const [portfolio, setPortfolio] = useState(null);
    const [stockData, setStockData] = useState({});
    const [leaderboard, setLeaderboard] = useState([]);
    const [error, setError] = useState('');

    // Effect for competition and user portfolio data
    useEffect(() => {
        const compDocRef = doc(db, 'competitions', competitionId);
        const unsubscribeComp = onSnapshot(compDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const compData = docSnap.data();
                setCompetition(compData);
                const initialPrices = {};
                if (compData.tradableAssets) {
                    Object.keys(compData.tradableAssets).forEach(symbol => {
                        initialPrices[symbol] = { price: compData.tradableAssets[symbol], history: [compData.tradableAssets[symbol]] };
                    });
                }
                setStockData(initialPrices);
            }
        });

        const portfolioDocRef = doc(db, `competitions/${competitionId}/participants`, user.uid);
        const unsubscribePortfolio = onSnapshot(portfolioDocRef, (docSnap) => {
            setPortfolio(docSnap.data());
        });

        return () => { 
            unsubscribeComp(); 
            unsubscribePortfolio();
        };
    }, [competitionId, user.uid]);

    // Effect for simulating stock price changes
    useEffect(() => {
        if (!competition) return;
        const interval = setInterval(() => {
            setStockData(prevData => {
                const newData = { ...prevData };
                Object.keys(newData).forEach(symbol => {
                    const changePercent = (Math.random() - 0.49) * 0.05;
                    const newPrice = newData[symbol].price * (1 + changePercent);
                    newData[symbol] = { ...newData[symbol], price: Math.max(0.01, newPrice) };
                });
                return newData;
            });
        }, 3000);
        return () => clearInterval(interval);
    }, [competition]);

    // Effect for calculating leaderboard
    useEffect(() => {
        if (!competitionId || Object.keys(stockData).length === 0) return;

        const participantsColRef = collection(db, `competitions/${competitionId}/participants`);
        const unsubscribeLeaderboard = onSnapshot(participantsColRef, (snapshot) => {
            const participants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            const calculatedLeaderboard = participants.map(p => {
                const portfolioValue = Object.entries(p.stocks || {}).reduce((total, [symbol, stock]) => {
                    return total + (stock.quantity * (stockData[symbol]?.price || 0));
                }, 0);
                const totalValue = p.cash + portfolioValue;
                return {
                    userId: p.userId,
                    username: p.username,
                    totalValue: totalValue
                };
            });

            calculatedLeaderboard.sort((a, b) => b.totalValue - a.totalValue);
            setLeaderboard(calculatedLeaderboard);
        });

        return () => unsubscribeLeaderboard();

    }, [competitionId, stockData]);
    
    const handleTrade = async (symbol, quantity, type) => {
        if (!portfolio) return;
        setError('');
        const price = stockData[symbol].price;
        const cost = price * quantity;
        const newPortfolio = JSON.parse(JSON.stringify(portfolio));

        if (type === 'buy') {
            if (newPortfolio.cash < cost) { setError("Not enough cash."); return; }
            newPortfolio.cash -= cost;
            newPortfolio.stocks[symbol] = { quantity: (newPortfolio.stocks[symbol]?.quantity || 0) + quantity };
        } else { // sell
            const sharesOwned = newPortfolio.stocks[symbol]?.quantity || 0;
            if (quantity > sharesOwned) { setError("Not enough shares to sell."); return; }
            newPortfolio.cash += cost;
            newPortfolio.stocks[symbol].quantity -= quantity;
            if (newPortfolio.stocks[symbol].quantity === 0) { delete newPortfolio.stocks[symbol]; }
        }
        
        const portfolioDocRef = doc(db, `competitions/${competitionId}/participants`, user.uid);
        await setDoc(portfolioDocRef, newPortfolio, { merge: true });
    };

    if (!competition || !portfolio) {
        return <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white"><p>Loading Competition...</p></div>;
    }

    const portfolioValue = Object.entries(portfolio.stocks).reduce((total, [symbol, stock]) => total + (stock.quantity * (stockData[symbol]?.price || 0)), 0);
    const totalValue = portfolio.cash + portfolioValue;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
            <header className="max-w-7xl mx-auto mb-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-4xl font-bold text-indigo-400">{competition.name}</h1>
                    <button onClick={onExit} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition"> &larr; Back to Lobby</button>
                </div>
            </header>
            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
                         <h2 className="text-2xl font-bold mb-4">My Portfolio</h2>
                         <div className="grid grid-cols-3 gap-4 text-center">
                            <div><p className="text-gray-400 text-sm">Cash</p><p className="text-2xl font-semibold text-green-400">{formatCurrency(portfolio.cash)}</p></div>
                            <div><p className="text-gray-400 text-sm">Stocks</p><p className="text-2xl font-semibold text-blue-400">{formatCurrency(portfolioValue)}</p></div>
                            <div><p className="text-2xl font-bold text-yellow-400">Total</p><p className="text-2xl font-bold text-yellow-400">{formatCurrency(totalValue)}</p></div>
                         </div>
                         <div className="mt-4 border-t border-gray-700 pt-4">
                             <h3 className="font-bold text-lg mb-2">My Holdings</h3>
                             {Object.keys(portfolio.stocks).length > 0 ? Object.entries(portfolio.stocks).map(([symbol, data]) => (
                                <div key={symbol} className="flex justify-between items-center bg-gray-900 p-2 rounded-md mb-2">
                                    <span>{data.quantity} x {symbol}</span>
                                    <span>{formatCurrency(data.quantity * (stockData[symbol]?.price || 0))}</span>
                                </div>
                             )) : <p className="text-gray-500">No stocks owned yet.</p>}
                         </div>
                    </div>
                    {error && <div className="bg-red-500 text-white p-3 rounded-md mb-4 text-center">{error}</div>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(stockData).map(([symbol, data]) => (
                            <Stock key={symbol} symbol={symbol} data={data} portfolio={portfolio} onTrade={handleTrade} />
                        ))}
                    </div>
                </div>
                <aside className="space-y-8">
                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold mb-4">Competition Details</h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>Owner:</span> <span className="font-semibold text-gray-300">{competition.ownerName}</span></div>
                            <div className="flex justify-between"><span>Starting Cash:</span> <span className="font-semibold text-gray-300">{formatCurrency(competition.initialCash)}</span></div>
                            <div className="flex justify-between"><span>Ends:</span> <span className="font-semibold text-gray-300">{formatDate(competition.endDate)}</span></div>
                        </div>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
                        <div className="space-y-3">
                            {leaderboard.length > 0 ? leaderboard.map((player, index) => (
                                <div key={player.userId} className={`flex justify-between items-center p-3 rounded-lg ${player.userId === user.uid ? 'bg-indigo-600' : 'bg-gray-900'}`}>
                                    <div className="flex items-center">
                                        <span className="text-lg font-bold w-8">{index + 1}</span>
                                        <span className="font-semibold">{player.username}</span>
                                    </div>
                                    <span className="font-bold text-green-400">{formatCurrency(player.totalValue)}</span>
                                </div>
                            )) : <p className="text-gray-400">No players on the leaderboard yet.</p>}
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
};

const Stock = ({ symbol, data, portfolio, onTrade }) => {
    const [quantity, setQuantity] = useState(1);
    const sharesOwned = portfolio?.stocks?.[symbol]?.quantity || 0;
    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-md flex flex-col justify-between border border-gray-700">
            <div>
                <h3 className="text-xl font-bold">{symbol}</h3>
                <p className="text-2xl font-light text-green-400">{formatCurrency(data.price)}</p>
                {sharesOwned > 0 && <p className="text-sm text-yellow-400 mt-1">Owned: {sharesOwned}</p>}
            </div>
            <div className="mt-4 flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                    <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 bg-gray-900 text-white p-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" min="1" />
                    <button onClick={() => onTrade(symbol, quantity, 'buy')} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition">Buy</button>
                    <button onClick={() => onTrade(symbol, quantity, 'sell')} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition disabled:bg-red-900 disabled:cursor-not-allowed" disabled={sharesOwned === 0}>Sell</button>
                </div>
            </div>
        </div>
    );
};

const CreateCompetitionPage = ({ user, onExit }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [initialCash, setInitialCash] = useState(100000);
    const [assets, setAssets] = useState('AAPL,GOOGL,MSFT');
    const [isPublic, setIsPublic] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreateCompetition = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const tradableAssets = assets.split(',').reduce((acc, symbol) => {
                const trimmedSymbol = symbol.trim().toUpperCase();
                if (trimmedSymbol) { acc[trimmedSymbol] = Math.floor(Math.random() * 200) + 50; } // Random starting price
                return acc;
            }, {});
            
            await addDoc(collection(db, 'competitions'), { 
                name, 
                description, 
                initialCash: Number(initialCash), 
                startDate: Timestamp.now(), 
                endDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days from now
                tradableAssets,
                isPublic,
                ownerId: user.uid,
                ownerName: user.username
            });
            
            onExit(); 
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
            <header className="max-w-3xl mx-auto flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-green-400">Create Your Competition</h1>
                <button onClick={onExit} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition">&larr; Back to Lobby</button>
            </header>
            <main className="max-w-3xl mx-auto">
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <form onSubmit={handleCreateCompetition}>
                        <div className="mb-4"><label className="block text-gray-400 mb-2">Competition Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-900 p-2 rounded border border-gray-600" required /></div>
                        <div className="mb-4"><label className="block text-gray-400 mb-2">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-900 p-2 rounded border border-gray-600" required /></div>
                        <div className="mb-4"><label className="block text-gray-400 mb-2">Starting Cash</label><input type="number" value={initialCash} onChange={e => setInitialCash(e.target.value)} className="w-full bg-gray-900 p-2 rounded border border-gray-600" required /></div>
                        <div className="mb-4"><label className="block text-gray-400 mb-2">Tradable Assets (comma-separated)</label><input type="text" value={assets} onChange={e => setAssets(e.target.value)} className="w-full bg-gray-900 p-2 rounded border border-gray-600" placeholder="e.g., AAPL, GOOGL, TSLA" required /></div>
                        <div className="mb-6 flex items-center justify-between bg-gray-900 p-3 rounded-md">
                            <div>
                                <label className="block text-gray-300">Public Competition</label>
                                <p className="text-xs text-gray-500">Anyone can see and join this competition.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={isPublic} onChange={() => setIsPublic(!isPublic)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-green-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                        {error && <p className="text-red-500 mb-4">{error}</p>}
                        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 font-bold py-3 rounded-md" disabled={loading}>{loading ? 'Creating...' : 'Create Competition'}</button>
                    </form>
                </div>
            </main>
        </div>
    );
};

const AdminPage = ({ onExit }) => {
    const [competitions, setCompetitions] = useState([]);
    useEffect(() => {
        const q = query(collection(db, "competitions"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            setCompetitions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
            <header className="max-w-5xl mx-auto flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-purple-400">Admin Panel</h1>
                <button onClick={onExit} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition">&larr; Back to Lobby</button>
            </header>
            <main className="max-w-5xl mx-auto">
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-2xl font-bold mb-4">Existing Competitions</h2>
                    <div className="space-y-3">
                        {competitions.length > 0 ? competitions.map(comp => 
                            <div key={comp.id} className="bg-gray-900 p-3 rounded flex justify-between">
                                <span>{comp.name}</span>
                                <span className="text-gray-400">by {comp.ownerName || 'N/A'}</span>
                            </div>
                        ) : <p>No competitions yet.</p>}
                    </div>
                </div>
            </main>
        </div>
    );
};

const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState({ name: 'lobby', competitionId: null });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (userAuth) => {
            if (userAuth) {
                const userDocRef = doc(db, 'users', userAuth.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    setUser({ uid: userAuth.uid, ...docSnap.data() });
                } else {
                    setUser({ uid: userAuth.uid, email: userAuth.email, username: 'Player' });
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white"><p>Loading App...</p></div>;
    }

    if (!user) {
        return <AuthPage />;
    }

    switch (page.name) {
        case 'admin':
            return <AdminPage onExit={() => setPage({ name: 'lobby' })} />;
        case 'create-competition':
             return <CreateCompetitionPage user={user} onExit={() => setPage({ name: 'lobby' })} />;
        case 'competition':
            return <CompetitionPage user={user} competitionId={page.competitionId} onExit={() => setPage({ name: 'lobby' })} />;
        default:
            return <LobbyPage 
                        user={user} 
                        onSelectCompetition={(id) => setPage({ name: 'competition', competitionId: id })} 
                        onGoToAdmin={() => setPage({ name: 'admin' })}
                        onGoToCreate={() => setPage({ name: 'create-competition' })}
                    />;
    }
};

export default App;
