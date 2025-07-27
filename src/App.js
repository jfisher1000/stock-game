import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { auth, db } from './api/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

import { PlusIcon } from './components/common/Icons';
import { ConfirmDeleteModal, InactivityWarningModal } from './components/common/Modals';
import AuthPage from './pages/AuthPage';
import SideBar from './components/layout/SideBar';
import CreateCompetitionModal from './components/competition/CreateCompetitionModal';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import AlertsPage from './pages/AlertsPage';
import CompetitionDetailPage from './pages/CompetitionDetailPage';

// Lazy load AdminPage
const AdminPage = React.lazy(() => import('./pages/AdminPage'));

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
