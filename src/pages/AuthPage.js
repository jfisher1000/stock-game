import React, { useState } from 'react';
import { auth, db } from '../firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

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
            try { await signInWithEmailAndPassword(auth, email, password); } catch (err) { setError(err.message); }
        } else {
            if (username.length < 3) {
                setError("Username must be at least 3 characters long.");
                setLoading(false);
                return;
            }
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const userDocRef = doc(db, `users`, userCredential.user.uid);
                await setDoc(userDocRef, { username, email: userCredential.user.email, createdAt: serverTimestamp(), role: 'player' });
            } catch (err) { setError(err.message); }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 text-white">
            <div className="max-w-md w-full glass-card rounded-xl shadow-lg p-8">
                <h1 className="text-3xl font-bold text-center mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                <p className="text-center text-gray-300 mb-6">{isLogin ? 'Sign in to view competitions' : 'Join the ultimate virtual trading game'}</p>
                <form onSubmit={handleAuthAction}>
                    {!isLogin && (<div className="mb-4"><label className="block text-gray-300 mb-2" htmlFor="username">Username</label><input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-black/20 p-3 rounded-md border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary" required /></div>)}
                    <div className="mb-4"><label className="block text-gray-300 mb-2" htmlFor="email">Email</label><input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/20 p-3 rounded-md border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary" required /></div>
                    <div className="mb-6"><label className="block text-gray-300 mb-2" htmlFor="password">Password</label><input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/20 p-3 rounded-md border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary" required /></div>
                    {error && <p className="text-danger text-center mb-4">{error}</p>}
                    <button type="submit" className="w-full bg-primary hover:opacity-90 font-bold py-3 rounded-md transition duration-300 disabled:opacity-50" disabled={loading}>{loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}</button>
                </form>
                <p className="text-center text-gray-400 mt-6">{isLogin ? "Don't have an account?" : "Already have an account?"}<button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-primary hover:underline ml-2">{isLogin ? 'Sign Up' : 'Sign In'}</button></p>
            </div>
        </div>
    );
};

export default AuthPage;
