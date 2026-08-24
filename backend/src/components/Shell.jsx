import { Link, useLocation } from 'react-router-dom';
import { BookOpen, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Shell({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen ledger-bg">
      <header className="border-b" style={{ borderColor: 'var(--paper-line)', backgroundColor: 'rgba(250,248,243,0.9)' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen size={22} strokeWidth={1.5} style={{ color: 'var(--credit)' }} />
            <span className="font-display text-lg" style={{ color: 'var(--ink)' }}>Ledger</span>
          </Link>

          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>{user.name}</span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border hover:bg-white transition-colors"
                style={{ borderColor: 'var(--paper-line)', color: 'var(--ink-soft)' }}
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
