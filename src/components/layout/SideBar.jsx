import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { auth } from '@/api/firebase';
import { Button } from '@/components/ui/button';
import { Home, Compass, Bell, User, LogOut, ShieldCheck } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';

const SideBar = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const handleSignOut = () => {
    auth.signOut();
    navigate('/auth');
  };

  const navItems = [
    { to: '/', icon: <Home className="h-5 w-5" />, text: 'Home' },
    { to: '/explore', icon: <Compass className="h-5 w-5" />, text: 'Explore' },
    { to: '/alerts', icon: <Bell className="h-5 w-5" />, text: 'Alerts' },
    { to: '/admin', icon: <ShieldCheck className="h-5 w-5" />, text: 'Admin' },
  ];

  return (
    <aside className="w-64 bg-surface text-text-primary flex flex-col p-4 border-r border-gray-200">
      <div className="text-2xl font-bold mb-8 text-primary">StockGame</div>
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 p-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'hover:bg-gray-100'
              }`
            }
          >
            {item.icon}
            <span>{item.text}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto">
        <div className="flex items-center space-x-3 p-2 mb-4">
          <User className="h-5 w-5" />
          <span>{user?.email}</span>
        </div>
        <Button variant="outline" className="w-full" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
};

export default SideBar;
