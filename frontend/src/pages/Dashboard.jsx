import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users, X, ArrowUpRight, UserPlus, Check, ChevronLeft, ChevronRight, Zap, Utensils, PieChart, Wand2, Mic, Sparkles } from 'lucide-react';
import api from '../lib/api';
import Shell from '../components/Shell';

const GROUP_PRESETS = [
  { name: 'Goa Beach Trip', color: 'bg-[#CBE3DB]' },
  { name: 'Apartment Expenses', color: 'bg-[#F7C9D9]' },
  { name: 'Weekend Dinners', color: 'bg-[#FDE68A]' },
  { name: 'Gaming & Entertainment', color: 'bg-[#E2DBF6]' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Modals for Financial Summary Tiles
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Direct AI Smart Prompt Bar
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [aiParsedResult, setAiParsedResult] = useState(null);
  const [parsingAi, setParsingAi] = useState(false);
  const [listening, setListening] = useState(false);

  // Create Group Form
  const [name, setName] = useState('');
  const [memberEmailInput, setMemberEmailInput] = useState('');
  const [memberEmails, setMemberEmails] = useState([]);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState('');

  async function loadGroups() {
    setLoading(true);
    try {
      const { data } = await api.get('/groups');
      setGroups(data);
    } catch (err) {
      console.error('Failed to load groups', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGroups();
  }, []);

  // Direct AI Prompt Extractor
  async function handleDirectAiParse(e) {
    if (e) e.preventDefault();
    if (!aiPromptInput.trim()) return;
    setParsingAi(true);
    setAiParsedResult(null);
    try {
      const { data } = await api.post('/ai/parse-prompt', {
        prompt: aiPromptInput.trim(),
      });
      setAiParsedResult(data);
    } catch (err) {
      console.error('AI parse error:', err);
    } finally {
      setParsingAi(false);
    }
  }

  // Voice AI Input
  function handleVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => setListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setAiPromptInput(transcript);
        setListening(false);
        api.post('/ai/parse-prompt', { prompt: transcript }).then((res) => {
          setAiParsedResult(res.data);
        }).catch(console.error);
      };
      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);

      recognition.start();
    } catch (err) {
      setListening(false);
    }
  }

  function handleAddMemberEmail(e) {
    e.preventDefault();
    if (!memberEmailInput.trim()) return;
    const email = memberEmailInput.trim().toLowerCase();
    if (!memberEmails.includes(email)) {
      setMemberEmails([...memberEmails, email]);
    }
    setMemberEmailInput('');
  }

  function handleRemoveMemberEmail(emailToRemove) {
    setMemberEmails(memberEmails.filter((e) => e !== emailToRemove));
  }

  async function handleCreateGroup(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setCreateMsg('');
    try {
      const res = await api.post('/groups', { name: name.trim() });
      const newGroupId = res.data.id;

      if (memberEmails.length > 0) {
        for (const email of memberEmails) {
          try {
            await api.post(`/groups/${newGroupId}/members`, { email });
          } catch (mErr) {
            console.warn(`Could not add ${email}:`, mErr);
          }
        }
      }

      setName('');
      setMemberEmails([]);
      setMemberEmailInput('');
      setShowForm(false);
      
      // Directly navigate to the newly created group!
      navigate(`/groups/${newGroupId}`);
    } catch (err) {
      setCreateMsg(err.response?.data?.error || 'Could not create group.');
      setCreating(false);
    }
  }

  const PASTEL_THEMES = [
    { cardBg: 'bg-[#CBE3DB]', text: 'text-[#13382C]' },
    { cardBg: 'bg-[#F7C9D9]', text: 'text-[#4C1D2A]' },
    { cardBg: 'bg-[#FDE68A]', text: 'text-[#451A03]' },
    { cardBg: 'bg-[#E2DBF6]', text: 'text-[#2E1065]' },
  ];

  const totalMembers = groups.reduce((sum, g) => sum + (g.member_count || 1), 0);

  return (
    <Shell>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* PROMINENT AI ASSISTANT PROMPT BAR */}
          <div className="inspo-card p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 size={18} className="text-violet-300" />
                <h3 className="font-display font-bold text-base text-white">AI Smart Expense Assistant</h3>
              </div>
              <button
                onClick={handleVoiceInput}
                className={`text-xs font-bold px-3 py-1 rounded-full border border-slate-700 transition-all flex items-center gap-1 ${
                  listening ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <Mic size={13} />
                <span>{listening ? 'Listening...' : 'Voice Input'}</span>
              </button>
            </div>

            <form onSubmit={handleDirectAiParse} className="flex items-center gap-2">
              <input
                type="text"
                value={aiPromptInput}
                onChange={(e) => setAiPromptInput(e.target.value)}
                placeholder="Type or speak expense (e.g. Alex paid 1500 for dinner yesterday)..."
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800/90 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={parsingAi || !aiPromptInput.trim()}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50"
              >
                {parsingAi ? 'Extracting...' : 'AI Extract'}
              </button>
            </form>

            {/* Extracted Result Preview */}
            {aiParsedResult && (
              <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-slate-200 space-y-1 animate-pop-in">
                <div className="font-bold text-violet-300 flex items-center gap-1">
                  <Sparkles size={14} /> AI Parsed Details:
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                  <div>Description: <span className="text-white font-bold">{aiParsedResult.description}</span></div>
                  <div>Amount: <span className="text-emerald-400 font-bold">₹{aiParsedResult.amount}</span></div>
                  <div>Category: <span className="text-amber-300 capitalize">{aiParsedResult.category}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Section 1: Active Groups */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight">
                Your active groups <span className="text-slate-400 font-semibold">({groups.length})</span>
              </h2>

              <button
                onClick={() => setShowForm((s) => !s)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-slate-900 text-white shadow-md hover:bg-slate-800 transition-all hover:scale-105"
              >
                {showForm ? <X size={15} /> : <Plus size={15} />}
                <span>{showForm ? 'Close' : 'New Group'}</span>
              </button>
            </div>

            {/* Group Creation Drawer */}
            {showForm && (
              <form
                onSubmit={handleCreateGroup}
                className="mb-6 inspo-card p-6 bg-white border border-slate-200 shadow-xl space-y-4 animate-pop-in"
              >
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <h3 className="font-display font-bold text-lg text-slate-900">Create New Expense Group</h3>
                </div>

                {createMsg && (
                  <div className="text-xs p-3 rounded-xl bg-rose-50 text-rose-700 font-semibold">
                    {createMsg}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Group Name *
                  </label>
                  <input
                    autoFocus
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Goa Vacation, Apartment Expenses..."
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-2">
                  {GROUP_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setName(preset.name)}
                      className={`text-xs font-bold px-3 py-1 rounded-full border border-slate-200 ${preset.color} text-slate-900 hover:scale-105 transition-all`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                {/* Add Member Emails */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <UserPlus size={14} /> Add Friends to Group (Email)
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={memberEmailInput}
                      onChange={(e) => setMemberEmailInput(e.target.value)}
                      placeholder="friend@example.com"
                      className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddMemberEmail}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <Check size={12} /> You (Creator)
                    </span>
                    {memberEmails.map((email) => (
                      <span
                        key={email}
                        className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 flex items-center gap-1.5"
                      >
                        {email}
                        <button type="button" onClick={() => handleRemoveMemberEmail(email)} className="font-bold">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !name.trim()}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create & Add Members'}
                  </button>
                </div>
              </form>
            )}

            {/* Groups Grid: ENTIRE CARD IS A CLICKABLE LINK TO DIRECTLY OPEN THE GROUP! */}
            {loading ? (
              <div className="py-12 text-center text-xs font-bold text-slate-400">
                Loading active groups...
              </div>
            ) : groups.length === 0 ? (
              <div className="inspo-card p-10 bg-white border border-slate-200/80 text-center">
                <p className="font-display font-bold text-lg text-slate-800 mb-1">No groups yet</p>
                <p className="text-xs text-slate-400 font-semibold mb-4">Create your first group to start splitting expenses.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-slate-900"
                >
                  Create New Group
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {groups.map((g, idx) => {
                  const theme = PASTEL_THEMES[idx % PASTEL_THEMES.length];
                  return (
                    <Link
                      key={g.id}
                      to={`/groups/${g.id}`}
                      className={`inspo-card p-5 ${theme.cardBg} flex flex-col justify-between relative group shadow-sm min-h-[140px] cursor-pointer hover:scale-[1.02] transition-transform block`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center -space-x-2">
                          <div className="w-7 h-7 rounded-full bg-white text-slate-900 border-2 border-white font-display font-bold text-xs flex items-center justify-center shadow-xs">
                            {g.name.charAt(0).toUpperCase()}
                          </div>
                          {g.member_count > 1 && (
                            <div className="w-7 h-7 rounded-full bg-slate-900 text-white border-2 border-white font-mono font-bold text-[10px] flex items-center justify-center shadow-xs">
                              +{g.member_count - 1}
                            </div>
                          )}
                        </div>

                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-xs text-slate-900 shadow-2xs">
                          {g.member_count} {g.member_count === 1 ? 'member' : 'members'}
                        </span>
                      </div>

                      <div className="flex items-end justify-between mt-auto pt-2">
                        <h3 className={`font-display font-extrabold text-xl ${theme.text} leading-tight`}>
                          {g.name}
                        </h3>

                        <div className="arrow-circle-btn shrink-0">
                          <ArrowUpRight size={18} className="text-slate-900" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Financial Summary Tiles */}
          <div>
            <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight mb-4">
              Financial summary
            </h2>

            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setShowForm((s) => !s)}
                className="inspo-card p-5 bg-[#CBE3DB] flex flex-col justify-between h-32 text-left cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <span className="text-xs font-bold text-slate-700">Active groups</span>
                <div className="flex items-end justify-between w-full">
                  <span className="font-display font-extrabold text-3xl text-slate-900">{groups.length}</span>
                  <div className="arrow-circle-btn">
                    <ArrowUpRight size={16} className="text-slate-900" />
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowMembersModal(true)}
                className="inspo-card p-5 bg-[#FDE68A] flex flex-col justify-between h-32 text-left cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <span className="text-xs font-bold text-slate-700">Group friends</span>
                <div className="flex items-end justify-between w-full">
                  <span className="font-display font-extrabold text-3xl text-slate-900">{totalMembers}</span>
                  <div className="arrow-circle-btn">
                    <ArrowUpRight size={16} className="text-slate-900" />
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowSummaryModal(true)}
                className="inspo-card p-5 bg-[#E2DBF6] flex flex-col justify-between h-32 text-left cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <span className="text-xs font-bold text-slate-700">Optimization</span>
                <div className="flex items-end justify-between w-full">
                  <span className="font-display font-extrabold text-xl text-slate-900">Active</span>
                  <div className="arrow-circle-btn">
                    <ArrowUpRight size={16} className="text-slate-900" />
                  </div>
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* Right 1 Column: Widget */}
        <div className="space-y-6">
          <div className="bg-white rounded-[28px] p-6 border border-slate-200/60 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-xl text-slate-900">
                Settlement Overview
              </h3>
              <div className="flex items-center gap-1 text-slate-400">
                <button className="p-1 rounded-full hover:bg-slate-100"><ChevronLeft size={18} /></button>
                <button className="p-1 rounded-full hover:bg-slate-100"><ChevronRight size={18} /></button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span>Active Ledgers</span>
                <span className="text-emerald-600 font-mono">100% Balanced</span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                All balances are simplified in real-time across your expense groups.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Quick Features
              </h4>

              <div className="p-4 rounded-2xl bg-[#D1FAE5] text-[#064E3B] flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center font-bold text-slate-900 shrink-0">
                  <Zap size={18} />
                </div>
                <div>
                  <h5 className="font-display font-bold text-sm leading-tight">Instant Debt Simplification</h5>
                  <p className="text-[11px] text-emerald-800 font-semibold">Minimizes settlement payments</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#E0F2FE] text-[#0C4A6E] flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center font-bold text-slate-900 shrink-0">
                  <Users size={18} />
                </div>
                <div>
                  <h5 className="font-display font-bold text-sm leading-tight">Multi-Member Invites</h5>
                  <p className="text-[11px] text-sky-800 font-semibold">Add friends by email in 1 click</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FDE68A] text-[#451A03] flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center font-bold text-slate-900 shrink-0">
                  <Utensils size={18} />
                </div>
                <div>
                  <h5 className="font-display font-bold text-sm leading-tight">Categorized Splits</h5>
                  <p className="text-[11px] text-amber-900 font-semibold">Food, Travel, Stay & Utilities</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Group Friends Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[28px] p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-pop-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-slate-900" />
                <h3 className="font-display font-bold text-lg text-slate-900">Group Friends Overview</h3>
              </div>
              <button onClick={() => setShowMembersModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-semibold">
              You are connected across {groups.length} expense groups with {totalMembers} member seats.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {groups.map((g) => (
                <div key={g.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-display font-bold text-sm text-slate-900">{g.name}</h4>
                    <span className="text-[11px] text-slate-400 font-semibold">{g.member_count} member(s) enrolled</span>
                  </div>
                  <Link
                    to={`/groups/${g.id}`}
                    onClick={() => setShowMembersModal(false)}
                    className="text-xs font-bold text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-100"
                  >
                    View Group
                  </Link>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowMembersModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Financial Optimization Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[28px] p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-pop-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PieChart size={20} className="text-slate-900" />
                <h3 className="font-display font-bold text-lg text-slate-900">Optimization Engine Status</h3>
              </div>
              <button onClick={() => setShowSummaryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#E2DBF6] text-[#2E1065] space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider block opacity-80">Debt Simplification</span>
              <p className="font-display font-bold text-lg">Smart Graph Minimization Active</p>
              <p className="text-xs font-semibold leading-relaxed opacity-90">
                Instead of N*(N-1) individual payments, SettleUp computes net balance vectors to minimize cash transfers between members.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
