import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { collectionGroup, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../api/firebase';
import { HomeIcon, ExploreIcon, AlertsIcon, ProfileIcon, LogoutIcon, AdminIcon } from '../common/Icons';

const SideBar = ({ user, activeTab, onNavigate }) => {
    const [hasInvites, setHasInvites] = useState(false);

    useEffect(() => {
        if (!user?.username) return;
        const q = query(collectionGroup(db, 'invitations'), where('invitedUsername', '==', user.username));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setHasInvites(!snapshot.empty);
        });
        return () => unsubscribe();
    }, [user?.username]);

    const NavItem = ({ icon, label, name, hasNotification }) => (
        <li onClick={() => onNavigate(name)} className={`relative flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors ${activeTab === name ? 'bg-primary text-white' : 'text-gray-300 hover:bg-white/10'}`}>
            {icon}
            <span className="ml-3">{label}</span>
            {hasNotification && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>}
        </li>
    );

    return (
        <div className="w-64 glass-card h-screen flex-shrink-0 flex flex-col p-4">
            <div className="flex items-center mb-8"><h1 className="text-2xl font-bold text-white">Stock Game</h1></div>
            <ul className="flex-grow">
                <NavItem icon={<HomeIcon />} label="Home" name="home" />
                <NavItem icon={<ExploreIcon />} label="Explore" name="explore" />
                <NavItem icon={<AlertsIcon />} label="Alerts" name="alerts" hasNotification={hasInvites} />
                {user.role === 'admin' && <NavItem icon={<AdminIcon />} label="Admin" name="admin" />}
            </ul>
            <div className="border-t border-white/20 pt-4">
                 <div className="flex items-center p-3 rounded-lg text-white"><ProfileIcon /><span className="ml-3">{user.username || 'Player'}</span></div>
                <div onClick={() => signOut(auth)} className="flex items-center p-3 rounded-lg cursor-pointer text-gray-300 hover:bg-white/10"><LogoutIcon /><span className="ml-3">Logout</span></div>
            </div>
        </div>
    );
};

export default SideBar;
