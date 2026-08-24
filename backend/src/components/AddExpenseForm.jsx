import { useState } from 'react';
import api from '../lib/api';

const CATEGORIES = ['general', 'food', 'travel', 'stay', 'shopping', 'utilities'];

export default function AddExpenseForm({ groupId, members, currentUserId, onAdded, onClose }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [category, setCategory] = useState('general');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const amt = parseFloat(amount);
    if (!description.trim() || !amt || amt <= 0) {
      setError('Enter a description and a valid amount');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/expenses', {
        groupId,
        description,
        amount: amt,
        paidBy: Number(paidBy),
        category,
      });
      onAdded();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add expense');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/70 border rounded-lg p-5 space-y-4"
      style={{ borderColor: 'var(--paper-line)' }}
    >
      {error && (
        <div className="text-sm px-3 py-2 rounded" style={{ backgroundColor: '#FBEAE4', color: 'var(--debit)' }}>
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-soft)' }}>What was it for?</label>
          <input
            autoFocus
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Dinner at Anjuna Beach Shack"
            className="w-full px-3 py-2 rounded border text-sm focus:outline-none"
            style={{ borderColor: 'var(--paper-line)' }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-soft)' }}>Amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 rounded border text-sm font-mono focus:outline-none"
            style={{ borderColor: 'var(--paper-line)' }}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-soft)' }}>Paid by</label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="w-full px-3 py-2 rounded border text-sm focus:outline-none bg-white"
            style={{ borderColor: 'var(--paper-line)' }}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.id === currentUserId ? `${m.name} (you)` : m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-soft)' }}>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded border text-sm focus:outline-none bg-white capitalize"
            style={{ borderColor: 'var(--paper-line)' }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--ink-soft)' }}>
        Splits equally across all {members.length} members. Custom splits can be added via the API.
      </p>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded text-sm border"
          style={{ borderColor: 'var(--paper-line)', color: 'var(--ink-soft)' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--credit)' }}
        >
          {submitting ? 'Adding…' : 'Add expense'}
        </button>
      </div>
    </form>
  );
}
