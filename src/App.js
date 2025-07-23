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
                    <button type="submit" className="w-full bg-primary hover:opacity-90 text-white font-bold py-3 rounded-md transition duration-300 disabled:opacity-50" disable
