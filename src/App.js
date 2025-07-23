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
    getDocs,
    where,
    writeBatch,
    collectionGroup,
    getCountFromServer,
    deleteDoc,
    updateDoc
} from 'firebase/firestore';

// --- Firebase Configuration ---
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

// --- Helper & Icon Components ---
const formatDate = (ts) => ts ? ts.toDate().toLocaleDateString() : 'N/A';
const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const Icon = ({ path, className = "w-6 h-6" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path></svg>;
const HomeIcon = () => <Icon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />;
const CompetitionsIcon = () => <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />;
const ExploreIcon = () => <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />;
const ProfileIcon = () => <Icon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />;
const LogoutIcon = () => <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />;
const AdminIcon = () => <Icon path="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />;
const LockIcon = ({ isPublic }) => isPublic ? <Icon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" className="w-4 h-4 text-gray-400" /> : <Icon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" className="w-4 h-4 text-yellow-400" />;
const UsersIcon = () => <Icon path="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 11-8 0 4 4 0 018 0zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" className="w-4 h-4 text-gray-400" />;


// --- Navigation Components ---
const SideBar = ({ user, activeTab, onNavigate }) => {
    const NavItem = ({ icon, label, name }) => (
        <li onClick={() => onNavigate({ name })} className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors ${activeTab === name ? 'bg-primary text-white' : 'text-gray-300 hover:bg-white/10'}`}>
            {icon}
            <span className="ml-3">{label}</span>
        </li>
    );

    return (
        <div className="w-64 glass-card h-screen flex-shrink-0 flex flex-col p-4">
            <div className="flex items-center mb-8">
                <h1 className="text-2xl font-bold text-white">Stock Game</h1>
            </div>
            <ul className="flex-grow">
                <NavItem icon={<HomeIcon />} label="Home" name="home" />
                <NavItem icon={<CompetitionsIcon />} label="My Competitions" name="competitions" />
                <NavItem icon={<ExploreIcon />} label="Explore" name="explore" />
                {user.role === 'admin' && <NavItem icon={<AdminIcon />} label="Admin" name="admin" />}
            </ul>
            <div className="border-t border-white/20 pt-4">
                 <div className="flex items-center p-3 rounded-lg">
                    <ProfileIcon />
                    <span className="ml-3 text-white">{user.username || 'Player'}</span>
                </div>
                <div onClick={() => signOut(auth)} className="flex items-center p-3 rounded-lg cursor-pointer text-gray-300 hover:bg-white/10">
                    <LogoutIcon />
                    <span className="ml-3">Logout</span>
                </div>
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
                await setDoc(userDocRef, { username: username, email: userCredential.user.email, createdAt: Timestamp.now(), role: 'player' });
            } catch (err) { setError(err.message); setLoading(false); }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full glass-card rounded-xl shadow-lg p-8">
                <h1 className="text-3xl font-bold text-center text-white mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                <p className="text-center text-gray-300 mb-6">{isLogin ? 'Sign in to view competitions' : 'Join the ultimate virtual trading game'}</p>
                <form onSubmit={handleAuthAction}>
                    {!isLogin && (<div className="mb-4"><label className="block text-gray-300 mb-2" htmlFor="username">Username</label><input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-black/20 text-white p-3 rounded-md border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary" required /></div>)}
                    <div className="mb-4"><label className="block text-gray-300 mb-2" htmlFor="email">Email</label><input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/20 text-white p-3 rounded-md border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary" required /></div>
                    <div className="mb-6"><label className="block text-gray-300 mb-2" htmlFor="password">Password</label><input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/20 text-white p-3 rounded-md border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary" required /></div>
                    {error && <p className="text-danger text-center mb-4">{error}</p>}
                    <button type="submit" className="w-full bg-primary hover:opacity-90 text-white font-bold py-3 rounded-md transition duration-300 disabled:opacity-50" disabled={loading}>{loading ? 'Processing...' : (isLogin ? 'Log In' : 'Register')}</button>
                </form>
                <p className="text-center text-gray-400 mt-6">{isLogin ? "Don't have an account?" : "Already have an account?"}<button onClick={() => setIsLogin(!isLogin)} className="text-info hover:underline ml-2 font-semibold">{isLogin ? 'Register' : 'Log In'}</button></p>
            </div>
        </div>
    );
};

const HomePage = ({ user, onSelectCompetition, onNavigate }) => {
    const [competitions, setCompetitions] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [userPortfolios, setUserPortfolios] = useState({});
    const [competitionStats, setCompetitionStats] = useState({});
    const [loading, setLoading] = useState(true);

    // DEBUGGING FIX: This useEffect now waits for a confirmed user.uid before running.
    useEffect(() => {
        // This check prevents the queries from running before authentication is complete.
        if (!user || !user.uid) {
            setLoading(false);
            return;
        }
        
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const publicQuery = query(collection(db, "competitions"), where("isPublic", "==", true));
                const invitesQuery = query(collectionGroup(db, 'invitations'), where('invitedUserId', '==', user.uid));
                
                const [publicSnapshot, invitesSnapshot] = await Promise.all([getDocs(publicQuery), getDocs(invitesQuery)]);
                
                const publicComps = publicSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCompetitions(publicComps);

                const fetchedInvites = invitesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setInvitations(fetchedInvites);

                const stats = {};
                const portfolios = {};
                for (const comp of publicComps) {
                    const participantsRef = collection(db, 'competitions', comp.id, 'participants');
                    const snapshot = await getCountFromServer(participantsRef);
                    stats[comp.id] = snapshot.data().count;

                    const portfolioDocRef = doc(db, `competitions/${comp.id}/participants`, user.uid);
                    const portfolioSnap = await getDoc(portfolioDocRef);
                    if (portfolioSnap.exists()) {
                        portfolios[comp.id] = true;
                    }
                }
                setCompetitionStats(stats);
                setUserPortfolios(portfolios);
            } catch (error) {
                console.error("Error fetching homepage data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [user]); // Depend on the whole user object
    
    const handleJoinCompetition = async (competition) => {
        const portfolioDocRef = doc(db, `competitions/${competition.id}/participants`, user.uid);
        await setDoc(portfolioDocRef, { 
            cash: competition.initialCash, 
            stocks: {},
            userId: user.uid,
            username: user.username
        });
        onSelectCompetition(competition.id);
    };

    const handleAcceptInvite = async (invite) => {
        const competitionDoc = await getDoc(doc(db, 'competitions', invite.competitionId));
        if (!competitionDoc.exists()) return;
        
        const competitionData = {id: competitionDoc.id, ...competitionDoc.data()};
        await handleJoinCompetition(competitionData);
        await deleteDoc(doc(db, 'competitions', invite.competitionId, 'invitations', invite.id));
    };

    const handleDeclineInvite = async (invite) => {
        await deleteDoc(doc(db, 'competitions', invite.competitionId, 'invitations', invite.id));
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Home</h1>
                <button onClick={() => onNavigate({ name: 'create-competition'})} className="bg-success hover:opacity-90 text-white font-bold py-2 px-4 rounded-md transition">Create Competition</button>
            </header>
            <main>
                {invitations.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-yellow-400 mb-4">My Invitations</h2>
                        <div className="space-y-3">
                            {invitations.map(invite => (
                                <div key={invite.id} className="glass-card p-4 rounded-lg flex justify-between items-center">
                                    <p className="text-white"><span className="font-bold">{invite.inviterUsername}</span> invited you to join <span className="font-bold text-info">{invite.competitionName}</span></p>
                                    <div className="flex space-x-2">
                                        <button onClick={() => handleAcceptInvite(invite)} className="bg-success hover:opacity-90 text-white font-bold py-1 px-3 rounded-md transition">Accept</button>
                                        <button onClick={() => handleDeclineInvite(invite)} className="bg-danger hover:opacity-90 text-white font-bold py-1 px-3 rounded-md transition">Decline</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                 <h2 className="text-2xl font-bold text-white mb-4">Public Competitions</h2>
                {loading ? <p className="text-white">Loading competitions...</p> : (
                    competitions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {competitions.map(comp => (
                                <div key={comp.id} className="glass-card rounded-lg p-6 flex flex-col justify-between hover:border-primary transition-all">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                                <LockIcon isPublic={comp.isPublic} />
                                                {comp.name}
                                            </h2>
                                        </div>
                                        <p className="text-gray-300 mt-2 mb-4 h-20 overflow-hidden">{comp.description}</p>
                                        <p className="text-sm text-gray-400">Created by: {comp.ownerName || 'Admin'}</p>
                                        <div className="flex justify-between text-sm text-gray-400 mt-2">
                                            <span>Starts: {formatDate(comp.startDate)}</span>
                                            <span className="flex items-center gap-1"><UsersIcon /> {competitionStats[comp.id] || 0}</span>
                                        </div>
                                    </div>
                                    {userPortfolios[comp.id] ? (
                                        <button onClick={() => onSelectCompetition(comp.id)} className="mt-6 w-full bg-primary hover:opacity-90 text-white font-bold py-2 px-4 rounded-md transition">View Competition</button>
                                    ) : (
                                        <button onClick={() => handleJoinCompetition(comp)} className="mt-6 w-full bg-info hover:opacity-90 text-white font-bold py-2 px-4 rounded-md transition">Join Competition</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center glass-card p-8 rounded-lg">
                            <h2 className="text-2xl font-bold text-white">No Public Competitions Found</h2>
                        </div>
                    )
                )}
            </main>
        </div>
    );
};

const MyCompetitionsPage = ({ user, onSelectCompetition, onNavigate }) => {
    const [myCompetitions, setMyCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);

    // DEBUGGING FIX: This useEffect now waits for a confirmed user.uid before running.
    useEffect(() => {
        if (!user || !user.uid) {
            setLoading(false);
            return;
        }

        const fetchMyCompetitions = async () => {
            setLoading(true);
            try {
                const q = query(collectionGroup(db, 'participants'), where('userId', '==', user.uid));
                const snapshot = await getDocs(q);
                
                const competitionPromises = snapshot.docs.map(doc => getDoc(doc.ref.parent.parent));
                const competitionDocs = await Promise.all(competitionPromises);

                const competitions = competitionDocs
                    .filter(doc => doc.exists())
                    .map(doc => ({ id: doc.id, ...doc.data() }));

                setMyCompetitions(competitions);
            } catch (error) {
                console.error("Error fetching my competitions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyCompetitions();
    }, [user]);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
             <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">My Competitions</h1>
                <button onClick={() => onNavigate({ name: 'create-competition'})} className="bg-success hover:opacity-90 text-white font-bold py-2 px-4 rounded-md transition">Create Competition</button>
            </header>
            {loading ? <p className="text-white">Loading...</p> : (
                myCompetitions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myCompetitions.map(comp => (
                            <div key={comp.id} className="glass-card rounded-lg p-6 flex flex-col justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white">{comp.name}</h2>
                                    <p className="text-gray-300 mt-2">{comp.description}</p>
                                </div>
                                <button onClick={() => onSelectCompetition(comp.id)} className="mt-6 w-full bg-primary hover:opacity-90 text-white font-bold py-2 px-4 rounded-md transition">View</button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400">You haven't joined any competitions yet.</p>
                )
            )}
        </div>
    );
};

const ExplorePage = () => (
    <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-white">Explore</h1>
        <p className="text-gray-300 mt-4">Stock searching and other discovery features will be available here in the future.</p>
    </div>
);


const CompetitionPage = ({ user, competitionId }) => {
    const [competition, setCompetition] = useState(null);
    const [portfolio, setPortfolio] = useState(null);
    const [stockData, setStockData] = useState({});
    const [leaderboard, setLeaderboard] = useState([]);
    const [error, setError] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(false);

    useEffect(() => {
        const compDocRef = doc(db, 'competitions', competitionId);
        const unsubscribeComp = onSnapshot(compDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const compData = {id: docSnap.id, ...docSnap.data()};
                setCompetition(compData);
                const initialPrices = {};
                if (compData.tradableAssets) {
                    Object.keys(compData.tradableAssets).forEach(symbol => {
                        initialPrices[symbol] = { price: compData.tradableAssets[symbol] };
                    });
                }
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
                    newData[symbol] = { ...newData[symbol], price: Math.max(0.01, newPrice) };
                });
                return newData;
            });
        }, 3000);
        return () => clearInterval(interval);
    }, [competition]);

    useEffect(() => {
        if (!competitionId || Object.keys(stockData).length === 0) return;
        const participantsColRef = collection(db, `competitions/${competitionId}/participants`);
        const unsubscribeLeaderboard = onSnapshot(participantsColRef, (snapshot) => {
            const participants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const calculatedLeaderboard = participants.map(p => {
                const portfolioValue = Object.entries(p.stocks || {}).reduce((total, [symbol, stock]) => total + (stock.quantity * (stockData[symbol]?.price || 0)), 0);
                return { userId: p.userId, username: p.username, totalValue: p.cash + portfolioValue };
            }).sort((a, b) => b.totalValue - a.totalValue);
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
        } else {
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
        return <div className="p-8 text-white">Loading Competition...</div>;
    }

    const portfolioValue = Object.entries(portfolio.stocks).reduce((total, [symbol, stock]) => total + (stock.quantity * (stockData[symbol]?.price || 0)), 0);
    const totalValue = portfolio.cash + portfolioValue;
    const isOwner = user.uid === competition.ownerId;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {showInviteModal && <InviteModal competition={competition} currentUser={user} onClose={() => setShowInviteModal(false)} />}
            <h1 className="text-4xl font-bold text-white mb-8">{competition.name}</h1>
            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="glass-card p-6 rounded-xl shadow-lg mb-8">
                         <h2 className="text-2xl font-bold text-white mb-4">My Portfolio</h2>
                         <div className="grid grid-cols-3 gap-4 text-center">
                            <div><p className="text-gray-300 text-sm">Cash</p><p className="text-2xl font-semibold text-success">{formatCurrency(portfolio.cash)}</p></div>
                            <div><p className="text-gray-300 text-sm">Stocks</p><p className="text-2xl font-semibold text-info">{formatCurrency(portfolioValue)}</p></div>
                            <div><p className="text-2xl font-bold text-yellow-400">Total</p><p className="text-2xl font-bold text-yellow-400">{formatCurrency(totalValue)}</p></div>
                         </div>
                         <div className="mt-4 border-t border-white/20 pt-4">
                             <h3 className="font-bold text-lg text-white mb-2">My Holdings</h3>
                             {Object.keys(portfolio.stocks).length > 0 ? Object.entries(portfolio.stocks).map(([symbol, data]) => (
                                <div key={symbol} className="flex justify-between items-center bg-black/20 p-2 rounded-md mb-2">
                                    <span className="text-white">{data.quantity} x {symbol}</span>
                                    <span className="text-white">{formatCurrency(data.quantity * (stockData[symbol]?.price || 0))}</span>
                                </div>
                             )) : <p className="text-gray-400">No stocks owned yet.</p>}
                         </div>
                    </div>
                    {error && <div className="bg-danger text-white p-3 rounded-md mb-4 text-center">{error}</div>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(stockData).map(([symbol, data]) => (
                            <Stock key={symbol} symbol={symbol} data={data} portfolio={portfolio} onTrade={handleTrade} />
                        ))}
                    </div>
                </div>
                <aside className="space-y-8">
                    <div className="glass-card p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold text-white mb-4">Competition Details</h2>
                        <div className="space-y-2 text-sm text-gray-300">
                            <div className="flex justify-between"><span>Owner:</span> <span className="font-semibold text-white">{competition.ownerName}</span></div>
                            <div className="flex justify-between"><span>Visibility:</span> <span className={`font-semibold ${competition.isPublic ? 'text-green-400' : 'text-yellow-400'}`}>{competition.isPublic ? 'Public' : 'Private'}</span></div>
                            <div className="flex justify-between"><span>Starting Cash:</span> <span className="font-semibold text-white">{formatCurrency(competition.initialCash)}</span></div>
                            <div className="flex justify-between"><span>Ends:</span> <span className="font-semibold text-white">{formatDate(competition.endDate)}</span></div>
                        </div>
                        {isOwner && !competition.isPublic && (
                            <button onClick={() => setShowInviteModal(true)} className="mt-4 w-full bg-info hover:opacity-90 text-white font-bold py-2 px-4 rounded-md transition">Invite Players</button>
                        )}
                    </div>
                    <div className="glass-card p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold text-white mb-4">Leaderboard</h2>
                        <div className="space-y-3">
                            {leaderboard.map((player, index) => (
                                <div key={player.userId} className={`flex justify-between items-center p-3 rounded-lg ${player.userId === user.uid ? 'bg-primary' : 'bg-black/20'}`}>
                                    <div className="flex items-center"><span className="text-lg font-bold w-8 text-white">{index + 1}</span><span className="font-semibold text-white">{player.username}</span></div>
                                    <span className="font-bold text-success">{formatCurrency(player.totalValue)}</span>
                                </div>
                            ))}
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
        <div className="glass-card p-4 rounded-lg shadow-md flex flex-col justify-between">
            <div>
                <h3 className="text-xl font-bold text-white">{symbol}</h3>
                <p className="text-2xl font-light text-success">{formatCurrency(data.price)}</p>
                {sharesOwned > 0 && <p className="text-sm text-yellow-400 mt-1">Owned: {sharesOwned}</p>}
            </div>
            <div className="mt-4"><div className="flex items-center space-x-2"><input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 bg-black/20 text-white p-2 rounded-md border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary" min="1" /><button onClick={() => onTrade(symbol, quantity, 'buy')} className="flex-1 bg-success hover:opacity-90 text-white font-bold py-2 px-4 rounded-md transition">Buy</button><button onClick={() => onTrade(symbol, quantity, 'sell')} className="flex-1 bg-danger hover:opacity-90 text-white font-bold py-2 px-4 rounded-md transition disabled:opacity-50" disabled={sharesOwned === 0}>Sell</button></div></div>
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
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [duration, setDuration] = useState('30');

    const handleCreateCompetition = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const finalStartDate = new Date(startDate);
            const finalEndD
