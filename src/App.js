import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './api/firebase';
import SideBar from './components/layout/SideBar';
import AuthPage from './pages/AuthPage';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const CompetitionDetailPage = lazy(() => import('./pages/CompetitionDetailPage'));
const AlertsPage = lazy(() => import('./pages/AlertsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/auth'); // Redirect to auth page after logout
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  // Show a loading screen while checking for user authentication
  if (loading) {
    return <div className="h-screen bg-background text-white flex items-center justify-center">Loading...</div>;
  }

  // If the user is not authenticated, only render the authentication page
  if (!user) {
    return (
      <Suspense fallback={<div className="h-screen bg-background text-white flex items-center justify-center">Loading...</div>}>
        <Routes>
          <Route path="*" element={<AuthPage />} />
        </Routes>
      </Suspense>
    );
  }

  // If the user is authenticated, render the main application layout
  return (
    <div className="flex h-screen bg-background">
      <SideBar onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto">
        <Suspense fallback={<div className="p-8 text-white">Loading Page...</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/competition/:id" element={<CompetitionDetailPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            {/* Redirect any unknown path to the home page */}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default App;
