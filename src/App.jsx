import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './api/firebase.js'; // .js extension is correct here

// Import components with the new .jsx extension
import SideBar from './components/layout/SideBar.jsx';
import AuthPage from './pages/AuthPage.jsx';

// Lazy load pages with the new .jsx extension
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const ExplorePage = lazy(() => import('./pages/ExplorePage.jsx'));
const CompetitionDetailPage = lazy(() => import('./pages/CompetitionDetailPage.jsx'));
const AlertsPage = lazy(() => import('./pages/AlertsPage.jsx'));
const AdminPage = lazy(() => import('./pages/AdminPage.jsx'));

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/auth');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  if (loading) {
    return <div className="h-screen bg-background text-white flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return (
      <Suspense fallback={<div className="h-screen bg-background text-white flex items-center justify-center">Loading...</div>}>
        <Routes>
          <Route path="*" element={<AuthPage />} />
        </Routes>
      </Suspense>
    );
  }

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
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default App;
