import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#E8D8C4] via-[#FAF6F0] to-[#D8C6B2]">
      <div className="w-full max-w-md bg-white rounded-[32px] p-8 border border-[#C7B7A3]/40 shadow-2xl space-y-6">
        
        {/* Brand */}
        <div className="text-center space-y-2">
          <img src="/logo.png" alt="SettleUp Logo" className="w-28 h-28 object-contain mx-auto drop-shadow-md" />
          <h1 className="font-display font-extrabold text-3xl text-slate-900 tracking-tight">
            Create Account
          </h1>
          <p className="text-xs font-semibold text-slate-500">
            Join SettleUp to track shared group expenses
          </p>
        </div>

        {error && (
          <div className="text-xs p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6E5B55]">
              Full Name
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-3.5 text-[#6E5B55]" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Sharma"
                className="w-full pl-10 pr-4 py-3 rounded-2xl text-xs font-semibold border-2 border-[#C7B7A3]/40 bg-[#FAF6F0] text-[#2B0D12] focus:bg-white focus:border-[#561C24] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6E5B55]">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3.5 text-[#6E5B55]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl text-xs font-semibold border-2 border-[#C7B7A3]/40 bg-[#FAF6F0] text-[#2B0D12] focus:bg-white focus:border-[#561C24] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6E5B55]">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-[#6E5B55]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-2xl text-xs font-semibold border-2 border-[#C7B7A3]/40 bg-[#FAF6F0] text-[#2B0D12] focus:bg-white focus:border-[#561C24] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-xs font-bold text-[#E8D8C4] bg-[#561C24] hover:bg-[#6D2932] shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Creating Account...' : (
              <>
                <span>Register & Continue</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#C7B7A3]/20">
          <p className="text-xs text-[#6E5B55] font-semibold">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#561C24] hover:underline">
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
