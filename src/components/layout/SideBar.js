import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogoutIcon } from '../common/Icons';

// Placeholder icons - replace with your actual icon components
const HomeIcon = () => <span className="w-6 h-6">🏠</span>;
const ExploreIcon = () => <span className="w-6 h-6">🧭</span>;
const AlertsIcon = () => <span className="w-6 h-6">🔔</span>;
const AdminIcon = () => <span className="w-6 h-6">⚙️</span>;

const SideBarItem = ({ name, icon, to }) => {
    const location = useLocation();
    // Check if the current path matches the link's destination
    const isActive = location.pathname === to;

    return (
        <li>
            <Link 
                to={to} 
                className={`relative flex items-center p-4 my-2 cursor-pointer rounded-lg transition-all duration-200 ${
                    isActive 
                        ? 'bg-primary text-white shadow-lg' 
                        : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                }`}
            >
                {icon}
                <span className="ml-4 font-semibold">{name}</span>
                {/* Active indicator bar */}
                {isActive && <div className="absolute left-0 top-0 h-full w-1 bg-white rounded-r-full"></div>}
            </Link>
        </li>
    );
};

const SideBar = ({ onLogout }) => {
    // Define the navigation menu items
    const menuItems = [
        { name: 'Home', icon: <HomeIcon />, to: '/' },
        { name: 'Explore', icon: <ExploreIcon />, to: '/explore' },
        { name: 'Alerts', icon: <AlertsIcon />, to: '/alerts' },
        { name: 'Admin', icon: <AdminIcon />, to: '/admin' },
    ];

    return (
        <aside className="w-64 bg-gray-800 text-white p-6 flex flex-col justify-between">
            <div>
                <div className="text-2xl font-bold mb-10 text-center">
                    Stock<span className="text-primary">Game</span>
                </div>
                <nav>
                    <ul>
                        {menuItems.map(item => (
                            <SideBarItem key={item.name} {...item} />
                        ))}
                    </ul>
                </nav>
            </div>
            <button 
                onClick={onLogout} 
                className="flex items-center w-full p-4 text-gray-400 hover:bg-red-700/50 hover:text-white rounded-lg transition-all duration-200"
            >
                <LogoutIcon />
                <span className="ml-4 font-semibold">Logout</span>
            </button>
        </aside>
    );
};

export default SideBar;
