import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, BookOpen, LogOut, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Shell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('groups');

  useEffect(() => {
    if (location.pathname.startsWith('/groups/')) {
      setActiveTab('detail');
    } else {
      setActiveTab('groups');
    }
  }, [location]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="w-full max-w-7xl mx-auto min-h-[calc(100vh-3rem)] flex flex-col md:flex-row gap-4 sm:gap-6 items-stretch font-body">
      
      {/* LEFT VERTICAL ICON SIDEBAR */}
      <aside className="w-full md:w-20 bg-slate-900 text-white rounded-[28px] p-4 flex md:flex-col items-center justify-between shadow-xl shrink-0">
        
        {/* Brand Logo Icon */}
        <div className="flex items-center justify-center">
          <Link
            to="/"
            className="w-12 h-12 rounded-2xl bg-white text-slate-900 font-display font-extrabold text-2xl flex items-center justify-center shadow-md hover:scale-105 transition-all"
          >
            S.
          </Link>
        </div>

        {/* Navigation Action Buttons */}
        <nav className="flex md:flex-col items-center gap-3">
          <Link
            to="/"
            onClick={() => setActiveTab('groups')}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              activeTab === 'groups'
                ? 'bg-slate-800 text-white shadow-md scale-105'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
            title="Active Groups"
          >
            <LayoutGrid size={22} />
          </Link>

          <button
            onClick={() => setActiveTab('detail')}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              activeTab === 'detail'
                ? 'bg-slate-800 text-white shadow-md scale-105'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
            title="SettleUp Detail"
          >
            <BookOpen size={22} />
          </button>
        </nav>

        {/* Logout Button */}
        <div className="flex items-center justify-center">
          <button
            onClick={handleLogout}
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-rose-950/40 hover:text-rose-400 transition-all"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN FRAME CANVAS */}
      <main className="flex-1 bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200/80 shadow-xl flex flex-col min-w-0">
        
        {/* Top Header Navigation */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
          <div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight">
              Welcome back
            </h1>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Keep track of shared group expenses and balances
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search groups or expenses..."
                className="w-full pl-9 pr-4 py-2 rounded-full text-xs font-semibold bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 placeholder:text-slate-400 shadow-2xs"
              />
            </div>

            {/* User Avatar Badge */}
            <div className="w-10 h-10 rounded-full bg-[#FDE68A] text-[#451A03] border-2 border-white font-display font-bold text-sm flex items-center justify-center shadow-xs shrink-0">
              {userInitial}
            </div>
          </div>
        </header>

        {/* Page Main Content */}
        <div className="flex-1">
          {children}
        </div>
      </main>

    </div>
  );
}
