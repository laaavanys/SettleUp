import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, X } from 'lucide-react';
import api from '../lib/api';
import Shell from '../components/Shell';

export default function Dashboard() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  async function loadGroups() {
    setLoading(true);
    const { data } = await api.get('/groups');
    setGroups(data);
    setLoading(false);
  }

  useEffect(() => {
    loadGroups();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await api.post('/groups', { name });
      setName('');
      setShowForm(false);
      await loadGroups();
    } finally {
      setCreating(false);
    }
  }

  return (
    <Shell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl mb-1">Your groups</h1>
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>Every shared tab, in one ledger.</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded text-white font-medium hover:opacity-90 transition-opacity"
          style={{ backgroundColor: 'var(--ink)' }}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'New group'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 bg-white/70 border rounded-lg p-5 flex items-end gap-3"
          style={{ borderColor: 'var(--paper-line)' }}
        >
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-soft)' }}>Group name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Goa Trip, Flat 3B, Weekend Poker…"
              className="w-full px-3 py-2 rounded border text-sm focus:outline-none"
              style={{ borderColor: 'var(--paper-line)' }}
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 rounded text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--credit)' }}
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>Loading…</p>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 border rounded-lg border-dashed" style={{ borderColor: 'var(--paper-line)' }}>
          <Users size={32} strokeWidth={1.3} className="mx-auto mb-3" style={{ color: 'var(--ink-soft)' }} />
          <p className="font-display text-lg mb-1">No groups yet</p>
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>Create one to start tracking shared expenses.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {groups.map((g) => (
            <Link
              key={g.id}
              to={`/groups/${g.id}`}
              className="block bg-white/70 border rounded-lg p-5 hover:shadow-md transition-shadow"
              style={{ borderColor: 'var(--paper-line)' }}
            >
              <h3 className="font-display text-lg mb-1">{g.name}</h3>
              <p className="text-xs flex items-center gap-1" style={{ color: 'var(--ink-soft)' }}>
                <Users size={12} /> {g.member_count} {g.member_count === 1 ? 'member' : 'members'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </Shell>
  );
}
