import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/api/firebase';
import HomePage from '@/pages/HomePage';
import ExplorePage from '@/pages/ExplorePage';
import CompetitionDetailPage from '@/pages/CompetitionDetailPage';
import AuthPage from '@/pages/AuthPage';
import AdminPage from '@/pages/AdminPage';
import AlertsPage from '@/pages/AlertsPage';
import SideBar from '@/components/layout/SideBar';
import { Toaster } from 'react-hot-toast';

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="flex h-screen bg-background">
        {user && <SideBar />}
        <main className="flex-1 overflow-y-auto">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" />} />
            <Route path="/" element={user ? <HomePage /> : <Navigate to="/auth" />} />
            <Route path="/explore" element={user ? <ExplorePage /> : <Navigate to="/auth" />} />
            <Route path="/competition/:id" element={user ? <CompetitionDetailPage /> : <Navigate to="/auth" />} />
            <Route path="/alerts" element={user ? <AlertsPage /> : <Navigate to="/auth" />} />
            <Route path="/admin" element={user ? <AdminPage /> : <Navigate to="/auth" />} />
            <Route path="*" element={<Navigate to={user ? "/" : "/auth"} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
