import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, UserPlus, X, Trash2 } from 'lucide-react';
import api from '../lib/api';
import Shell from '../components/Shell';
import AddExpenseForm from '../components/AddExpenseForm';
import BalanceBoard from '../components/BalanceBoard';
import { useAuth } from '../context/AuthContext';

function formatMoney(n) {
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function GroupDetail() {
  const { id } = useParams();
  const groupId = Number(id);
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balanceData, setBalanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberError, setMemberError] = useState('');

  const loadAll = useCallback(async () => {
    const [groupRes, expensesRes, balancesRes] = await Promise.all([
      api.get(`/groups/${groupId}`),
      api.get(`/expenses/group/${groupId}`),
      api.get(`/balances/${groupId}`),
    ]);
    setGroup(groupRes.data);
    setExpenses(expensesRes.data);
    setBalanceData(balancesRes.data);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleAddMember(e) {
    e.preventDefault();
    setMemberError('');
    try {
      await api.post(`/groups/${groupId}/members`, { email: memberEmail });
      setMemberEmail('');
      setShowMemberForm(false);
      await loadAll();
    } catch (err) {
      setMemberError(err.response?.data?.error || 'Could not add member');
    }
  }

  async function handleDeleteExpense(expenseId) {
    await api.delete(`/expenses/${expenseId}`);
    await loadAll();
  }

  if (loading) {
    return (
      <Shell>
        <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>Loading…</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm mb-6 hover:underline" style={{ color: 'var(--ink-soft)' }}>
        <ArrowLeft size={14} /> All groups
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl mb-1">{group.name}</h1>
          <div className="flex flex-wrap gap-x-1 text-sm" style={{ color: 'var(--ink-soft)' }}>
            {group.members.map((m, i) => (
              <span key={m.id}>
                {m.name}{i < group.members.length - 1 ? ',' : ''}{' '}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setShowMemberForm((s) => !s)}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded border hover:bg-white transition-colors"
            style={{ borderColor: 'var(--paper-line)', color: 'var(--ink-soft)' }}
          >
            <UserPlus size={15} /> Add member
          </button>
          <button
            onClick={() => setShowExpenseForm((s) => !s)}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded text-white font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--ink)' }}
          >
            {showExpenseForm ? <X size={16} /> : <Plus size={16} />}
            {showExpenseForm ? 'Cancel' : 'Add expense'}
          </button>
        </div>
      </div>

      {showMemberForm && (
        <form onSubmit={handleAddMember} className="mb-6 bg-white/70 border rounded-lg p-4 flex items-end gap-3" style={{ borderColor: 'var(--paper-line)' }}>
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-soft)' }}>Member's email (they must already have an account)</label>
            <input
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="friend@example.com"
              className="w-full px-3 py-2 rounded border text-sm focus:outline-none"
              style={{ borderColor: 'var(--paper-line)' }}
            />
            {memberError && <p className="text-xs mt-1" style={{ color: 'var(--debit)' }}>{memberError}</p>}
          </div>
          <button type="submit" className="px-4 py-2 rounded text-sm font-medium text-white hover:opacity-90" style={{ backgroundColor: 'var(--credit)' }}>
            Add
          </button>
        </form>
      )}

      {showExpenseForm && (
        <div className="mb-6">
          <AddExpenseForm
            groupId={groupId}
            members={group.members}
            currentUserId={user.id}
            onAdded={() => { setShowExpenseForm(false); loadAll(); }}
            onClose={() => setShowExpenseForm(false)}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="font-display text-lg mb-4">Expenses</h2>
          {expenses.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>No expenses yet. Add the first one.</p>
          ) : (
            <div className="space-y-2">
              {expenses.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between bg-white/70 border rounded-lg px-4 py-3"
                  style={{ borderColor: 'var(--paper-line)' }}
                >
                  <div>
                    <p className="text-sm font-medium">{e.description}</p>
                    <p className="text-xs" style={{ color: 'var(--ink-soft)' }}>
                      {e.paid_by_name} paid · split {e.shares.length} ways · <span className="capitalize">{e.category}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm">{formatMoney(e.amount)}</span>
                    {e.created_by === user.id && (
                      <button
                        onClick={() => handleDeleteExpense(e.id)}
                        className="p-1.5 rounded hover:bg-white transition-colors"
                        style={{ color: 'var(--ink-soft)' }}
                        aria-label="Delete expense"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <BalanceBoard groupId={groupId} data={balanceData} currentUserId={user.id} onSettled={loadAll} />
        </div>
      </div>
    </Shell>
  );
}
