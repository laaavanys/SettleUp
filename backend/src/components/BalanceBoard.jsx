import { ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';

function formatMoney(n) {
  const abs = Math.abs(n);
  return `₹${abs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BalanceBoard({ groupId, data, currentUserId, onSettled }) {
  if (!data) return null;
  const { balances, settleUpPlan, stats } = data;

  async function markSettled(t) {
    await api.post(`/balances/${groupId}/settle`, { from: t.from, to: t.to, amount: t.amount });
    onSettled();
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/70 border rounded-lg p-5" style={{ borderColor: 'var(--paper-line)' }}>
        <h3 className="font-display text-lg mb-4">Net balances</h3>
        <div className="space-y-3">
          {balances.map((b) => {
            const isPositive = b.netBalance > 0.01;
            const isNegative = b.netBalance < -0.01;
            const color = isPositive ? 'var(--credit)' : isNegative ? 'var(--debit)' : 'var(--ink-soft)';
            return (
              <div key={b.userId} className="flex items-center justify-between text-sm">
                <span>{b.name}{b.userId === currentUserId ? ' (you)' : ''}</span>
                <span className="font-mono font-medium" style={{ color }}>
                  {isPositive && '+'}
                  {isNegative && '-'}
                  {formatMoney(b.netBalance)}
                  <span className="text-xs font-sans ml-1" style={{ color: 'var(--ink-soft)' }}>
                    {isPositive ? 'is owed' : isNegative ? 'owes' : 'settled'}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white/70 border rounded-lg p-5" style={{ borderColor: 'var(--paper-line)' }}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display text-lg">Settle up</h3>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--ink-soft)' }}>
          Simplified from {stats.transactionsWithoutSimplification} to{' '}
          <span className="font-medium" style={{ color: 'var(--credit)' }}>
            {stats.transactionsWithSimplification} transaction{stats.transactionsWithSimplification === 1 ? '' : 's'}
          </span>
        </p>

        {settleUpPlan.length === 0 ? (
          <div className="flex items-center gap-2 text-sm py-2" style={{ color: 'var(--credit)' }}>
            <CheckCircle2 size={16} /> Everyone's settled up
          </div>
        ) : (
          <div className="space-y-2">
            {settleUpPlan.map((t, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm py-2 px-3 rounded"
                style={{ backgroundColor: '#F4F0E5' }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t.fromName}</span>
                  <ArrowRight size={14} style={{ color: 'var(--ink-soft)' }} />
                  <span className="font-medium">{t.toName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono" style={{ color: 'var(--debit)' }}>{formatMoney(t.amount)}</span>
                  <button
                    onClick={() => markSettled(t)}
                    className="text-xs px-2 py-1 rounded border hover:bg-white transition-colors"
                    style={{ borderColor: 'var(--paper-line)', color: 'var(--ink-soft)' }}
                  >
                    Mark paid
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
