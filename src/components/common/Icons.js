import React from 'react';

/**
 * A generic, reusable Icon component.
 * @param {object} props - Component props.
 * @param {string} props.path - The SVG path data for the icon.
 * @param {string} [props.className="w-6 h-6"] - Additional CSS classes for styling.
 * @returns {React.ReactElement}
 */
const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path>
    </svg>
);

// --- Specific Icon Components ---

export const HomeIcon = () => <Icon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-7-4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />;
export const ExploreIcon = () => <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />;
export const AlertsIcon = () => <Icon path="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />;
export const ProfileIcon = () => <Icon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />;
export const LogoutIcon = () => <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />;
export const AdminIcon = () => <Icon path="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />;
export const PlusIcon = () => <Icon path="M12 4v16m8-8H4" />;
export const TrashIcon = ({ className = "w-5 h-5" }) => <Icon className={className} path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />;
export const UsersIcon = () => <Icon className="w-4 h-4 text-gray-400" path="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 3a4 4 0 014 4v2" />;
export const SearchIcon = () => <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />;
export const TrendingUpIcon = () => <Icon className="w-4 h-4 text-green-500" path="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />;
export const TrendingDownIcon = () => <Icon className="w-4 h-4 text-red-500" path="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />;
export const CalendarIcon = () => <Icon className="w-4 h-4 text-gray-400" path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />;
export const UserAddIcon = () => <Icon path="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />;
export const TrophyIcon = () => <Icon className="w-4 h-4 text-yellow-400" path="M9 11l3-3 3 3m0 0l-3 3-3-3m3-3v12" />;
