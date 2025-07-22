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
    writeBatch,
    Timestamp,
    addDoc,
    getDocs
} from 'firebase/firestore';

// --- Firebase Configuration ---
// IMPORTANT: This object should be replaced with your actual Firebase project configuration.
const firebaseConfig = {
  apiKey: "AIzaSyCC_fIRnWLvovO4Mk2BLmecsisoSzgklGQ",
  authDomain: "stock-game-26b54.firebaseapp.com",
  projectId: "stock-game-26b54",
  storageBucket: "stock-game-26b54.firebasestorage.app",
  messagingSenderId: "455526292127",
  appId: "1:455526292127:web:889ca05dab75b0c4ae60aa",
  measurementId: "G-XQJ9HG5WLG"
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Helper & AI Components ---
const formatDate = (firebaseTimestamp) => {
    if (!firebaseTimestamp) return 'N/A';
    return firebaseTimestamp.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const AiModal = ({ title, content, isLoading, onClose }) => {
    if (!title) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full border border-indigo-500/50">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">{title}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                    </div>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <p className="ml-3 text-gray-300">Thinking...</p>
                        </div>
                    ) : (
                        <p className="text-gray-300 whitespace-pre-wrap">{content}</p>
                    )}
                </div>
                <div className="bg-gray-900/50 px-6 py-3 text-xs text-gray-500 rounded-b-xl">Disclaimer: AI-generated content is for entertainment purposes only.</div>
            </div>
        </div>
    );
};

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
                await setDoc(userDocRef, { username: username, email: userCredential.user.email, createdAt: Timestamp.now() });
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

const LobbyPage = ({ user, onSelectCompetition, onGoToAdmin }) => {
    const [competitions, setCompetitions] = useState([]);
    const [userPortfolios, setUserPortfolios] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "competitions"));
        const unsubscribeComps = onSnapshot(q, (querySnapshot) => {
            const comps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCompetitions(comps);
            setLoading(false);
        }, (error) => { console.error("Error fetching competitions: ", error); setLoading(false); });

        const portfolios = {};
        const fetchPortfolios = async () => {
            const compQuery = await getDocs(collection(db, "competitions"));
            for (const compDoc of compQuery.docs) {
                const portfolioDocRef = doc(db, `competitions/${compDoc.id}/participants`, user.uid);
                const portfolioSnap = await getDoc(portfolioDocRef);
                if (portfolioSnap.exists()) {
                    portfolios[compDoc.id] = true;
                }
            }
            setUserPortfolios(portfolios);
        };
        fetchPortfolios();

        return () => unsubscribeComps();
    }, [user.uid]);
    
    const handleJoinCompetition = async (competition) => {
        const portfolioDocRef = doc(db, `competitions/${competition.id}/participants`, user.uid);
        const initialPortfolio = { cash: competition.initialCash, stocks: {} };
        await setDoc(portfolioDocRef, initialPortfolio);
        onSelectCompetition(competition.id);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
            <header className="max-w-5xl mx-auto flex justify-between items-center mb-8">
                <div><h1 className="text-3xl font-bold">Welcome, {user.username || 'Player'}!</h1><p className="text-gray-400">Choose a competition to join.</p></div>
                <div>
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
                                        <h2 className="text-2xl font-bold text-indigo-400">{comp.name}</h2>
                                        <p className="text-gray-400 mt-2 mb-4">{comp.description}</p>
                                        <p className="text-sm text-gray-500">Starts: {formatDate(comp.startDate)}</p>
                                        <p className="text-sm text-gray-500">Ends: {formatDate(comp.endDate)}</p>
                                        <p className="text-lg font-semibold mt-3">Starting Cash: {formatCurrency(comp.initialCash)}</p>
                                    </div>
                                    {userPortfolios[comp.id] ? (
                                        <button onClick={() => onSelectCompetition(comp.id)} className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition">View Competition</button>
                                    ) : (
                                        <button onClick={() => handleJoinCompetition(comp)} className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition">Join Competition</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center bg-gray-800 p-8 rounded-lg">
                            <h2 className="text-2xl font-bold text-white">No Competitions Found</h2>
                            <p className="text-gray-400 mt-2">The admin has not created any competitions yet. Please check back later.</p>
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
    const [modalState, setModalState] = useState({ title: null, content: '', isLoading: false });
    const [error, setError] = useState('');

    useEffect(() => {
        const compDocRef = doc(db, 'competitions', competitionId);
        const unsubscribeComp = onSnapshot(compDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const compData = docSnap.data();
                setCompetition(compData);
                const initialPrices = {};
                Object.keys(compData.tradableAssets).forEach(symbol => {
                    initialPrices[symbol] = { price: compData.tradableAssets[symbol], history: [compData.tradableAssets[symbol]] };
                });
                setStockData(initialPrices);
            }
        });

        const portfolioDocRef = doc(db, `competitions/${competitionId}/participants`, user.uid);
        const unsubscribePortfolio = onSnapshot(portfolioDocRef, (docSnap) => {
            setPortfolio(docSnap.data());
        });

        return () => { unsubscribeComp(); unsubscribePortfolio(); };
    }, [competitionId, user.uid]);

    useEffect(() => {
        if (!competition) return;
        const interval = setInterval(() => {
            setStockData(prevData => {
                const newData = { ...prevData };
                Object.keys(newData).forEach(symbol => {
                    const changePercent = (Math.random() - 0.49) * 0.05;
                    const newPrice = newData[symbol].price * (1 + changePercent);
                    const newHistory = [...(newData[symbol].history || []), newPrice].slice(-10);
                    newData[symbol] = { ...newData[symbol], price: Math.max(0.01, newPrice), history: newHistory };
                });
                return newData;
            });
        }, 3000);
        return () => clearInterval(interval);
    }, [competition]);
    
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
        await setDoc(portfolioDocRef, newPortfolio);
    };
    
    const getAiAnalysis = async (symbol) => {
        setModalState({ title: `✨ AI Analysis for ${symbol}`, content: '', isLoading: true });
        const stock = stockData[symbol];
        const prompt = `You are a witty but insightful stock market analyst for a fun trading game. The stock is ${symbol}. Its recent simulated price history is: ${stock.history.map(p => formatCurrency(p)).join(', ')}. Provide a short, creative, and slightly humorous analysis (2-3 sentences) about its potential future performance. Do not give financial advice.`;
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
            });
            const result = await response.json();
            setModalState({ title: `✨ AI Analysis for ${symbol}`, content: result.candidates[0].content.parts[0].text, isLoading: false });
        } catch (err) {
            setModalState({ title: `✨ AI Analysis for ${symbol}`, content: "The AI analyst is on a coffee break. Please try again later.", isLoading: false });
        }
    };

    const getAiPortfolioAdvice = async () => {
        setModalState({ title: `✨ AI Portfolio Advisor`, content: '', isLoading: true });
        const holdings = Object.entries(portfolio.stocks).map(([symbol, data]) => `${data.quantity} shares of ${symbol}`).join(', ');
        const prompt = `You are a helpful and creative portfolio advisor for a stock trading game. My current portfolio has ${formatCurrency(portfolio.cash)} in cash and the following stocks: ${holdings || 'none'}. Based on this, provide one actionable, creative, and fun suggestion for my next move. This is for a game, so be imaginative. Do not give real financial advice. Keep it to 2-4 sentences.`;
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
            });
            const result = await response.json();
            setModalState({ title: `✨ AI Portfolio Advisor`, content: result.candidates[0].content.parts[0].text, isLoading: false });
        } catch (err) {
            setModalState({ title: `✨ AI Portfolio Advisor`, content: "The AI advisor is currently crunching numbers. Please try again later.", isLoading: false });
        }
    };

    if (!competition || !portfolio) {
        return <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white"><p>Loading Competition...</p></div>;
    }

    const portfolioValue = Object.entries(portfolio.stocks).reduce((total, [symbol, stock]) => total + (stock.quantity * (stockData[symbol]?.price || 0)), 0);
    const totalValue = portfolio.cash + portfolioValue;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
            <AiModal title={modalState.title} content={modalState.content} isLoading={modalState.isLoading} onClose={() => setModalState({ title: null })} />
            <header className="max-w-7xl mx-auto mb-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-4xl font-bold text-indigo-400">{competition.name}</h1>
                    <button onClick={onExit} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition"> &larr; Back to Lobby</button>
                </div>
            </header>
            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
                         <div className="flex justify-between items-start mb-4"><h2 className="text-2xl font-bold">My Portfolio</h2><button onClick={getAiPortfolioAdvice} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-md transition -mt-1">✨ Get AI Advice</button></div>
                         <div className="grid grid-cols-3 gap-4 text-center">
                            <div><p className="text-gray-400 text-sm">Cash</p><p className="text-2xl font-semibold text-green-400">{formatCurrency(portfolio.cash)}</p></div>
                            <div><p className="text-gray-400 text-sm">Stocks</p><p className="text-2xl font-semibold text-blue-400">{formatCurrency(portfolioValue)}</p></div>
                            <div><p className="text-gray-400 text-sm">Total</p><p className="text-2xl font-bold text-yellow-400">{formatCurrency(totalValue)}</p></div>
                         </div>
                         <div className="mt-4 border-t border-gray-700 pt-4">
                             <h3 className="font-bold text-lg mb-2">My Holdings</h3>
                             {Object.keys(portfolio.stocks).length > 0 ? Object.entries(portfolio.stocks).map(([symbol, data]) => (
                                <div key={symbol} className="flex justify-between items-center bg-gray-900 p-2 rounded-md">
                                    <span>{data.quantity} x {symbol}</span>
                                    <span>{formatCurrency(data.quantity * (stockData[symbol]?.price || 0))}</span>
                                </div>
                             )) : <p className="text-gray-500">No stocks owned yet.</p>}
                         </div>
                    </div>
                    {error && <div className="bg-red-500 text-white p-3 rounded-md mb-4 text-center">{error}</div>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(stockData).map(([symbol, data]) => (
                            <Stock key={symbol} symbol={symbol} data={data} portfolio={portfolio} onTrade={handleTrade} onAnalyze={getAiAnalysis} />
                        ))}
                    </div>
                </div>
                <aside>
                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
                        <p className="text-gray-400">(Leaderboard coming soon)</p>
                    </div>
                </aside>
            </main>
        </div>
    );
};

const Stock = ({ symbol, data, portfolio, onTrade, onAnalyze }) => {
    const [quantity, setQuantity] = useState(1);
    const sharesOwned = portfolio?.stocks?.[symbol]?.quantity || 0;
    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-md flex flex-col justify-between">
            <div>
                <h3 className="text-xl font-bold">{symbol}</h3>
                <p className="text-2xl font-light text-green-400">{formatCurrency(data.price)}</p>
                {sharesOwned > 0 && <p className="text-sm text-yellow-400 mt-1">Owned: {sharesOwned}</p>}
            </div>
            <div className="mt-4 flex flex-col space-y-2">
                <button onClick={() => onAnalyze(symbol)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition">✨ Analyze</button>
                <div className="flex items-center space-x-2">
                    <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 bg-gray-900 text-white p-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" min="1" />
                    <button onClick={() => onTrade(symbol, quantity, 'buy')} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition">Buy</button>
                    <button onClick={() => onTrade(symbol, quantity, 'sell')} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition disabled:bg-red-900 disabled:cursor-not-allowed" disabled={sharesOwned === 0}>Sell</button>
                </div>
            </div>
        </div>
    );
};

const AdminPage = ({ onExit }) => {
    const [competitions, setCompetitions] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [initialCash, setInitialCash] = useState(100000);
    const [assets, setAssets] = useState('AAPL,GOOGL,MSFT');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const q = query(collection(db, "competitions"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            setCompetitions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    const handleCreateCompetition = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const tradableAssets = assets.split(',').reduce((acc, symbol) => {
                const trimmedSymbol = symbol.trim().toUpperCase();
                if (trimmedSymbol) { acc[trimmedSymbol] = 100; }
                return acc;
            }, {});
            await addDoc(collection(db, 'competitions'), { name, description, initialCash: Number(initialCash), startDate: Timestamp.now(), endDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), tradableAssets });
            setName(''); setDescription(''); setInitialCash(100000); setAssets('AAPL,GOOGL,MSFT');
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
            <header className="max-w-5xl mx-auto flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-purple-400">Admin Panel</h1>
                <button onClick={onExit} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition">&larr; Back to Lobby</button>
            </header>
            <main className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-2xl font-bold mb-4">Create New Competition</h2>
                    <form onSubmit={handleCreateCompetition}>
                        <div className="mb-4"><label className="block text-gray-400 mb-2">Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-900 p-2 rounded" required /></div>
                        <div className="mb-4"><label className="block text-gray-400 mb-2">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-900 p-2 rounded" required /></div>
                        <div className="mb-4"><label className="block text-gray-400 mb-2">Initial Cash</label><input type="number" value={initialCash} onChange={e => setInitialCash(e.target.value)} className="w-full bg-gray-900 p-2 rounded" required /></div>
                        <div className="mb-4"><label className="block text-gray-400 mb-2">Tradable Assets (comma-separated)</label><input type="text" value={assets} onChange={e => setAssets(e.target.value)} className="w-full bg-gray-900 p-2 rounded" placeholder="e.g., AAPL, GOOGL, TSLA" required /></div>
                        {error && <p className="text-red-500 mb-4">{error}</p>}
                        <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 font-bold py-2 rounded" disabled={loading}>{loading ? 'Creating...' : 'Create Competition'}</button>
                    </form>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-2xl font-bold mb-4">Existing Competitions</h2>
                    <div className="space-y-3">
                        {competitions.map(comp => <div key={comp.id} className="bg-gray-900 p-3 rounded">{comp.name}</div>)}
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
                setUser(docSnap.exists() ? { uid: userAuth.uid, ...docSnap.data() } : { uid: userAuth.uid, email: userAuth.email });
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
        case 'competition':
            return <CompetitionPage user={user} competitionId={page.competitionId} onExit={() => setPage({ name: 'lobby' })} />;
        default:
            return <LobbyPage user={user} onSelectCompetition={(id) => setPage({ name: 'competition', competitionId: id })} onGoToAdmin={() => setPage({ name: 'admin' })} />;
    }
};

export default App;
