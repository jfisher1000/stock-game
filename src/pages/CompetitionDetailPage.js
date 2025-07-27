import React, { useState, useEffect, Suspense } from 'react';
import { db } from '../api/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { getCompetitionStatus, formatDate } from '../utils/formatters';
import { UserAddIcon, TrashIcon } from '../components/common/Icons';
import InviteModal from '../components/competition/InviteModal';
import TradeModal from '../components/portfolio/TradeModal';
import Leaderboard from '../components/competition/Leaderboard';
import PortfolioView from '../components/portfolio/PortfolioView';
import StockSearchView from '../components/portfolio/StockSearchView';

const DetailedPortfolioView = React.lazy(() => import('../components/portfolio/DetailedPortfolioView'));

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

export default CompetitionDetailPage;
