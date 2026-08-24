import { useState } from 'react';
import { ArrowRight, CheckCircle2, Scale } from 'lucide-react';
import api from '../lib/api';

function formatMoney(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BalanceBoard({ groupId, data, currentUserId, onSettled }) {
  const [settling, setSettling] = useState(false);
  const [settleMsg, setSettleMsg] = useState('');

  if (!data) return null;

  // Backend returns: balances: [{ userId, name, netBalance }], settleUpPlan: [{ from, to, fromName, toName, amount }]
  const balancesList = data.balances || [];
  const settleUpPlan = data.settleUpPlan || data.settlements || [];

  async function handleSettle(from, to, amount) {
    setSettling(true);
    setSettleMsg('');
    try {
      await api.post(`/balances/${groupId}/settle`, {
        from: Number(from),
        to: Number(to),
        amount: Number(amount),
      });
      setSettleMsg('Settlement recorded successfully.');
      if (onSettled) onSettled();
    } catch (err) {
      setSettleMsg(err.response?.data?.error || 'Could not record settlement.');
    } finally {
      setSettling(false);
    }
  }

  // Find logged-in user's balance
  const myBalanceObj = balancesList.find((b) => b.userId === currentUserId || b.user?.id === currentUserId);
  const myNet = myBalanceObj ? (myBalanceObj.netBalance !== undefined ? myBalanceObj.netBalance : myBalanceObj.net || 0) : 0;

  return (
    <div className="space-y-6">
      
      {/* Card 1: Your Personal Net Standing */}
      <div className="inspo-card p-6 bg-white border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Net Standing</span>
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Scale size={16} />
          </div>
        </div>

        <div>
          <div className={`font-display font-extrabold text-3xl ${
            myNet > 0.01
              ? 'text-emerald-600'
              : myNet < -0.01
              ? 'text-rose-600'
              : 'text-slate-700'
          }`}>
            {myNet > 0.01 && `+${formatMoney(myNet)}`}
            {myNet < -0.01 && formatMoney(myNet)}
            {Math.abs(myNet) <= 0.01 && '₹0.00'}
          </div>

          <p className="text-xs font-semibold text-slate-500 mt-1">
            {myNet > 0.01 && 'You are owed money overall in this group.'}
            {myNet < -0.01 && 'You owe money overall in this group.'}
            {Math.abs(myNet) <= 0.01 && 'You are completely settled up.'}
          </p>
        </div>
      </div>

      {/* Card 2: Optimized Settle Up Plan */}
      <div className="inspo-card p-6 bg-slate-900 text-white shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-display font-bold text-lg text-white">
            Optimal Settlement Plan
          </h3>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 uppercase">
            Smart Split
          </span>
        </div>

        {settleMsg && (
          <div className="text-xs p-3 rounded-xl bg-slate-800 text-emerald-400 font-bold border border-slate-700">
            {settleMsg}
          </div>
        )}

        {settleUpPlan.length === 0 ? (
          <div className="py-4 text-center space-y-1">
            <CheckCircle2 size={24} className="mx-auto text-emerald-400 mb-1" />
            <p className="text-xs font-bold text-white">Everyone is settled up</p>
            <p className="text-[11px] text-slate-400">No pending debts remain in this group.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {settleUpPlan.map((s, idx) => {
              const fromId = typeof s.from === 'object' ? s.from.id : s.from;
              const toId = typeof s.to === 'object' ? s.to.id : s.to;
              const fromName = s.fromName || (typeof s.from === 'object' ? s.from.name : 'Member');
              const toName = s.toName || (typeof s.to === 'object' ? s.to.name : 'Member');

              const isIpay = fromId === currentUserId;
              const isIget = toId === currentUserId;

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-white truncate">
                      {isIpay ? 'You' : fromName}
                    </span>
                    <ArrowRight size={14} className="text-slate-400 shrink-0" />
                    <span className="font-bold text-white truncate">
                      {isIget ? 'You' : toName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-display font-extrabold text-sm text-white">
                      {formatMoney(s.amount)}
                    </span>

                    {isIpay && (
                      <button
                        onClick={() => handleSettle(fromId, toId, s.amount)}
                        disabled={settling}
                        className="px-3 py-1 rounded-xl text-[11px] font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-50 transition-colors shadow-xs"
                      >
                        Settle
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Card 3: Net Balances List */}
      <div className="inspo-card p-6 bg-white border border-slate-200/80 shadow-xs space-y-3">
        <h4 className="font-display font-bold text-xs text-slate-400 uppercase tracking-wider">
          Individual Standings
        </h4>

        <div className="space-y-2">
          {balancesList.map((b, idx) => {
            const memberUserId = b.userId || b.user?.id || idx;
            const memberName = b.name || b.user?.name || 'Member';
            const netVal = b.netBalance !== undefined ? b.netBalance : (b.net || 0);

            return (
              <div
                key={memberUserId}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs"
              >
                <span className="font-bold text-slate-700">
                  {memberName} {memberUserId === currentUserId ? '(you)' : ''}
                </span>

                <span className={`font-mono font-bold ${
                  netVal > 0.01
                    ? 'text-emerald-600'
                    : netVal < -0.01
                    ? 'text-rose-600'
                    : 'text-slate-500'
                }`}>
                  {netVal > 0.01 && `+${formatMoney(netVal)}`}
                  {netVal < -0.01 && formatMoney(netVal)}
                  {Math.abs(netVal) <= 0.01 && '₹0.00'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
