import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { auth, db } from './api/firebase';
import {
    onAuthStateChanged,
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
import { searchSymbols, getQuote } from './api/alphaVantage';
import { formatDate, formatCurrency, sanitizeSymbolForFirestore, getCompetitionStatus } from './utils/formatters';
import {
    PlusIcon, TrashIcon, SearchIcon, CalendarIcon, UserAddIcon, TrophyIcon, UsersIcon
} from './components/common/Icons';
import { ConfirmDeleteModal, InactivityWarningModal } from './components/common/Modals';
import AuthPage from './pages/AuthPage';
import SideBar from './components/layout/SideBar';
import CreateCompetitionModal from './components/competition/CreateCompetitionModal';
import InviteModal from './components/competition/InviteModal';
import TradeModal from './components/portfolio/TradeModal';


// Lazy load AdminPage and the new DetailedPortfolioView
const AdminPage = React.lazy(() => import('./AdminPage'));
const DetailedPortfolioView = React.lazy(() => import('./DetailedPortfolioView'));


// --- Invitation & Alerts Components ---
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
