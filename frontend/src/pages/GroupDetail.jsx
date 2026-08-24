import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, UserPlus, X, Trash2, Search, Utensils, Plane, Home, ShoppingBag, Zap, CreditCard, Sparkles, Mail, Wand2 } from 'lucide-react';
import api from '../lib/api';
import Shell from '../components/Shell';
import AddExpenseForm from '../components/AddExpenseForm';
import BalanceBoard from '../components/BalanceBoard';
import { useAuth } from '../context/AuthContext';

function formatMoney(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const CATEGORY_CONFIG = {
  general: { icon: CreditCard, color: 'bg-[#E0F2FE] text-[#0C4A6E]' },
  food: { icon: Utensils, color: 'bg-[#FDE68A] text-[#451A03]' },
  travel: { icon: Plane, color: 'bg-[#E2DBF6] text-[#2E1065]' },
  stay: { icon: Home, color: 'bg-[#F7C9D9] text-[#4C1D2A]' },
  shopping: { icon: ShoppingBag, color: 'bg-[#FCE7F3] text-[#9D174D]' },
  utilities: { icon: Zap, color: 'bg-[#D1FAE5] text-[#064E3B]' },
};

export default function GroupDetail() {
  const { id } = useParams();
  const groupId = Number(id);
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balanceData, setBalanceData] = useState(null);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI Insights State
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showAiCard, setShowAiCard] = useState(false);

  // Modals & Drawers
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);

  // Add Member State
  const [memberEmail, setMemberEmail] = useState('');
  const [memberStatusMsg, setMemberStatusMsg] = useState({ type: '', text: '' });
  const [addingMember, setAddingMember] = useState(false);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const loadAll = useCallback(async () => {
    if (!groupId) return;
    try {
      const [groupRes, expensesRes, balancesRes, invitesRes] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/expenses/group/${groupId}`),
        api.get(`/balances/${groupId}`),
        api.get(`/groups/${groupId}/invites`).catch(() => ({ data: [] })),
      ]);
      setGroup(groupRes.data);
      setExpenses(expensesRes.data || []);
      setBalanceData(balancesRes.data || null);
      setInvites(invitesRes.data || []);
    } catch (err) {
      console.error('Error loading group', err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // AI Feature 4: Generate Financial Insights
  async function fetchAiInsights() {
    setLoadingInsights(true);
    setShowAiCard(true);
    try {
      const { data } = await api.get(`/ai/insights/${groupId}`);
      setAiInsights(data.insights || []);
    } catch (err) {
      console.error('AI Insights error:', err);
      setAiInsights(['Could not generate AI insights at this time.']);
    } finally {
      setLoadingInsights(false);
    }
  }

  async function handleAddMember(e) {
    e.preventDefault();
    setMemberStatusMsg({ type: '', text: '' });
    if (!memberEmail.trim()) return;

    setAddingMember(true);
    try {
      const res = await api.post(`/groups/${groupId}/members`, { email: memberEmail.trim() });
      if (res.data.status === 'invited') {
        setMemberStatusMsg({
          type: 'info',
          text: `Invite sent to ${memberEmail.trim()}! When they register, they will join automatically.`,
        });
      } else {
        setMemberStatusMsg({
          type: 'success',
          text: `Added ${res.data.name || memberEmail} to the group.`,
        });
      }
      setMemberEmail('');
      await loadAll();
    } catch (err) {
      setMemberStatusMsg({
        type: 'error',
        text: err.response?.data?.error || 'Could not add member. Try again.',
      });
    } finally {
      setAddingMember(false);
    }
  }

  async function handleDeleteExpense(expenseId) {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/expenses/${expenseId}`);
      await loadAll();
    } catch (err) {
      console.error('Failed to delete expense', err);
    }
  }

  const totalGroupSpent = (expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const filteredExpenses = (expenses || []).filter((e) => {
    const desc = e.description || '';
    const payerName = e.paid_by_name || '';
    const matchesSearch = desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          payerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <Shell>
        <div className="py-20 text-center text-xs font-bold text-slate-400">
          Loading group details...
        </div>
      </Shell>
    );
  }

  if (!group) {
    return (
      <Shell>
        <div className="py-16 text-center space-y-3">
          <p className="text-base font-bold text-slate-800">Group not found or inaccessible.</p>
          <p className="text-xs font-semibold text-slate-400">You may not be a member of this group.</p>
          <Link to="/" className="inline-block px-5 py-2 rounded-full text-xs font-bold text-white bg-slate-900 shadow-md hover:bg-slate-800 transition-all">
            Return to Dashboard
          </Link>
        </div>
      </Shell>
    );
  }

  const membersList = group.members || [];

  return (
    <Shell>
      {/* Back button */}
      <Link 
        to="/" 
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 px-3.5 py-2 rounded-full border border-slate-200 shadow-xs mb-6 transition-all"
      >
        <ArrowLeft size={14} /> Back to Groups
      </Link>

      {/* Main Header Banner Card */}
      <div className="inspo-card p-6 bg-white border border-slate-200/80 shadow-sm mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight">
              {group.name}
            </h1>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-900 text-white">
              {membersList.length} Members
            </span>
          </div>

          {/* Members Avatar List */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">Group Members:</span>
            {membersList.map((m, idx) => {
              const bgColors = ['bg-[#CBE3DB] text-[#13382C]', 'bg-[#F7C9D9] text-[#4C1D2A]', 'bg-[#FDE68A] text-[#451A03]', 'bg-[#E2DBF6] text-[#2E1065]'];
              const colorClass = bgColors[idx % bgColors.length];
              return (
                <span
                  key={m.id}
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${colorClass}`}
                >
                  <span className="w-5 h-5 rounded-full bg-white text-slate-900 flex items-center justify-center text-[10px] font-bold shadow-2xs">
                    {m.name ? m.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                  {m.name} {user && m.id === user.id ? '(You)' : ''}
                </span>
              );
            })}
          </div>
        </div>

        {/* Action Header Stats & Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-[#D1FAE5] text-[#064E3B] text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 block">Total Group Spend</span>
            <span className="font-display font-extrabold text-xl">{formatMoney(totalGroupSpent)}</span>
          </div>

          {/* AI Insights Button */}
          <button
            onClick={fetchAiInsights}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-3 rounded-full bg-violet-100 hover:bg-violet-200 text-violet-900 border border-violet-200 transition-all hover:scale-105"
          >
            <Wand2 size={15} className="text-violet-700" />
            <span>AI Insights</span>
          </button>

          <button
            onClick={() => setShowMemberForm((s) => !s)}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-3 rounded-full bg-slate-900 text-white shadow-sm hover:bg-slate-800 transition-all hover:scale-105"
          >
            <UserPlus size={15} />
            <span>+ Add People</span>
          </button>

          <button
            onClick={() => setShowExpenseForm((s) => !s)}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 transition-all"
          >
            {showExpenseForm ? <X size={15} /> : <Plus size={15} />}
            <span>{showExpenseForm ? 'Close' : 'Add Expense'}</span>
          </button>
        </div>
      </div>

      {/* AI Group Financial Insights Card */}
      {showAiCard && (
        <div className="mb-6 inspo-card p-6 bg-slate-900 text-white shadow-xl space-y-3 animate-pop-in relative">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-violet-400" />
              <h3 className="font-display font-bold text-lg text-white">AI Financial Insights & Spending Analysis</h3>
            </div>
            <button onClick={() => setShowAiCard(false)} className="text-slate-400 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {loadingInsights ? (
            <p className="text-xs font-semibold text-slate-400 py-2">Analyzing group expenses and calculating insights...</p>
          ) : (
            <ul className="space-y-2 text-xs font-medium text-slate-300">
              {aiInsights && aiInsights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-300 font-bold flex items-center justify-center shrink-0 text-[11px]">{idx + 1}</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Add People Drawer */}
      {showMemberForm && (
        <form
          onSubmit={handleAddMember}
          className="mb-6 inspo-card p-6 bg-white border border-slate-200 shadow-xl space-y-4 animate-pop-in"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <UserPlus size={18} className="text-slate-900" />
              <h3 className="font-display font-bold text-lg text-slate-900">Add Friends to Group</h3>
            </div>
            <button type="button" onClick={() => setShowMemberForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>

          {memberStatusMsg.text && (
            <div className={`text-xs p-3.5 rounded-2xl font-bold border flex items-center gap-2 ${
              memberStatusMsg.type === 'success' 
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                : memberStatusMsg.type === 'info'
                ? 'bg-sky-100 text-sky-800 border-sky-300'
                : 'bg-rose-100 text-rose-800 border-rose-300'
            }`}>
              <Sparkles size={16} className="shrink-0" />
              <span>{memberStatusMsg.text}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="flex-1 relative">
              <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder="Enter friend's email (e.g. rahul@example.com)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={addingMember || !memberEmail.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
            >
              {addingMember ? 'Adding...' : '+ Add Member'}
            </button>
          </div>

          {invites.length > 0 && (
            <div className="pt-2 text-xs">
              <span className="font-bold text-slate-400 block mb-1">Pending Invites:</span>
              <div className="flex flex-wrap gap-2">
                {invites.map((inv) => (
                  <span key={inv.id} className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold">
                    Invited: {inv.email}
                  </span>
                ))}
              </div>
            </div>
          )}
        </form>
      )}

      {/* Add Expense Form Drawer */}
      {showExpenseForm && (
        <div className="mb-6">
          <AddExpenseForm
            groupId={groupId}
            members={membersList}
            currentUserId={user?.id}
            onAdded={() => { setShowExpenseForm(false); loadAll(); }}
            onClose={() => setShowExpenseForm(false)}
          />
        </div>
      )}

      {/* Main Grid: Expense Feed vs Settle Up Widget */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Expenses Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-display font-bold text-2xl text-slate-900">
              Expenses ({filteredExpenses.length})
            </h2>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search expenses..."
                className="w-full pl-9 pr-4 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-2 pb-2">
            {['all', 'food', 'travel', 'stay', 'shopping', 'utilities', 'general'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-full capitalize transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Expenses List Cards */}
          {filteredExpenses.length === 0 ? (
            <div className="inspo-card p-10 bg-white border border-slate-200 text-center">
              <p className="font-display font-bold text-base text-slate-700 mb-1">No expenses found</p>
              <p className="text-xs text-slate-400 font-semibold">Add a new expense or clear your search.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((e) => {
                const cfg = CATEGORY_CONFIG[e.category] || CATEGORY_CONFIG.general;
                const IconComp = cfg.icon;
                const isPayer = user && e.paid_by === user.id;
                const splitWays = e.shares?.length || membersList.length || 1;
                const perPersonCost = (e.amount / splitWays).toFixed(2);
                const payerName = e.paid_by_name || 'Member';

                return (
                  <div
                    key={e.id}
                    className="inspo-card p-4 bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                        <IconComp size={20} />
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-display font-bold text-slate-900 text-base truncate">
                          {e.description}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mt-0.5">
                          <span className={isPayer ? 'text-emerald-700 font-bold' : 'text-slate-700'}>
                            {payerName} paid
                          </span>
                          <span>•</span>
                          <span>Split {splitWays} ways</span>
                          <span>•</span>
                          <span className="capitalize text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-mono text-slate-600">
                            {e.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="font-display font-extrabold text-lg text-slate-900 block">
                          {formatMoney(e.amount)}
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-slate-400 block">
                          ₹{perPersonCost} / person
                        </span>
                      </div>

                      {user && e.created_by === user.id && (
                        <button
                          onClick={() => handleDeleteExpense(e.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Settle Up & Balances Widget */}
        <div>
          <BalanceBoard groupId={groupId} data={balanceData} currentUserId={user?.id} onSettled={loadAll} />
        </div>
      </div>
    </Shell>
  );
}
