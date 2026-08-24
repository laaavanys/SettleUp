import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create account. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 ledger-bg">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <BookOpen size={28} strokeWidth={1.5} style={{ color: 'var(--credit)' }} />
          <span className="font-display text-2xl" style={{ color: 'var(--ink)' }}>Ledger</span>
        </div>

        <div className="bg-white/70 backdrop-blur-sm border rounded-lg p-8 shadow-sm" style={{ borderColor: 'var(--paper-line)' }}>
          <h1 className="font-display text-xl mb-1">Create your account</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>Start splitting expenses in seconds.</p>

          {error && (
            <div className="mb-4 text-sm px-3 py-2 rounded" style={{ backgroundColor: '#FBEAE4', color: 'var(--debit)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-soft)' }}>Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded border text-sm focus:outline-none"
                style={{ borderColor: 'var(--paper-line)' }}
                placeholder="Alex Kumar"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-soft)' }}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded border text-sm focus:outline-none"
                style={{ borderColor: 'var(--paper-line)' }}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-soft)' }}>Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded border text-sm focus:outline-none"
                style={{ borderColor: 'var(--paper-line)' }}
                placeholder="At least 6 characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--ink)' }}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--ink-soft)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-medium underline" style={{ color: 'var(--credit)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
