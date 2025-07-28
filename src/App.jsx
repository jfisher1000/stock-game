// src/App.jsx

/**
 * @fileoverview The root component of the application.
 *
 * This component sets up the main routing, layout, and global providers
 * for the entire application. It includes the main sidebar, the content area
 * for different pages, and the global Toaster component for notifications.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SideBar from './components/layout/SideBar';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import CompetitionDetailPage from './pages/CompetitionDetailPage';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import { Toaster } from "@/components/ui/toaster"; // Import the Toaster

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-background text-text-primary">
        <SideBar />
        <main className="flex-1 overflow-y-auto p-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/competitions/:id" element={<CompetitionDetailPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/auth" element={<AuthPage />} />
          </Routes>
        </main>
        <Toaster /> {/* Add the Toaster here */}
      </div>
    </Router>
  );
}

export default App;
