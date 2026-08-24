import { useState, useEffect } from 'react';
import { Utensils, Plane, Home, ShoppingBag, Zap, CreditCard, Sparkles, AlertCircle, X, Check, FileText, Wand2, Mic, AlertTriangle } from 'lucide-react';
import api from '../lib/api';

const CATEGORY_CONFIG = {
  general: { label: 'General', icon: CreditCard, color: 'bg-[#C7B7A3] text-[#561C24] border-[#C7B7A3]' },
  food: { label: 'Food', icon: Utensils, color: 'bg-[#E8D8C4] text-[#561C24] border-[#E8D8C4]' },
  travel: { label: 'Travel', icon: Plane, color: 'bg-[#6D2932] text-[#E8D8C4] border-[#6D2932]' },
  stay: { label: 'Stay', icon: Home, color: 'bg-[#561C24] text-[#E8D8C4] border-[#561C24]' },
  shopping: { label: 'Shopping', icon: ShoppingBag, color: 'bg-[#E8D8C4] text-[#6D2932] border-[#E8D8C4]' },
  utilities: { label: 'Utilities', icon: Zap, color: 'bg-[#C7B7A3] text-[#2B0D12] border-[#C7B7A3]' },
};

export default function AddExpenseForm({ groupId, members, currentUserId, onAdded, onClose }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [category, setCategory] = useState('food');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // AI Modes & State
  const [aiPrompt, setAiPrompt] = useState('');
  const [parsingAi, setParsingAi] = useState(false);
  const [aiMode, setAiMode] = useState('manual'); // 'manual', 'prompt', 'receipt'
  const [receiptText, setReceiptText] = useState('');
  const [aiMessage, setAiMessage] = useState('');

  // Voice AI State
  const [listening, setListening] = useState(false);

  // Duplicate warning
  const [duplicateWarning, setDuplicateWarning] = useState('');

  const parsedAmount = parseFloat(amount) || 0;
  const perPersonShare = members?.length ? (parsedAmount / members.length).toFixed(2) : '0.00';

  // Check potential duplicate expense locally
  useEffect(() => {
    if (!description.trim() || !groupId) {
      setDuplicateWarning('');
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data: existingExpenses } = await api.get(`/expenses/group/${groupId}`);
        const duplicate = existingExpenses.find(
          (e) => e.description.toLowerCase().trim() === description.toLowerCase().trim()
        );
        if (duplicate) {
          setDuplicateWarning(`Warning: An expense titled "${duplicate.description}" for ₹${duplicate.amount} already exists in this group.`);
        } else {
          setDuplicateWarning('');
        }
      } catch (err) {
        // Silent catch
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [description, groupId]);

  // AI Feature 1: Natural Language Prompt Extractor
  async function parsePromptText(textToParse) {
    if (!textToParse.trim()) return;
    setParsingAi(true);
    setAiMessage('');
    try {
      const { data } = await api.post('/ai/parse-prompt', {
        prompt: textToParse.trim(),
        members,
      });
      if (data.description) setDescription(data.description);
      if (data.amount) setAmount(data.amount.toString());
      if (data.category) setCategory(data.category);
      if (data.paidBy) setPaidBy(data.paidBy);

      setAiMessage('AI parsed expense details from your prompt.');
      setAiMode('manual');
    } catch (err) {
      console.error('AI prompt error:', err);
      setAiMessage('Could not parse prompt. Please enter details manually.');
    } finally {
      setParsingAi(false);
    }
  }

  // AI Voice Assistant (Web Speech API)
  function handleVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setAiMessage('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setListening(true);
        setAiMessage('Listening... Speak your expense (e.g. Alex paid 1500 for dinner)');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setAiPrompt(transcript);
        setListening(false);
        parsePromptText(transcript);
      };

      recognition.onerror = () => {
        setListening(false);
        setAiMessage('Could not capture audio. Please try typing instead.');
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.start();
    } catch (err) {
      setListening(false);
      setAiMessage('Voice recognition error.');
    }
  }

  // AI Feature 2: Receipt Parser
  async function handleAiParseReceipt(e) {
    e.preventDefault();
    if (!receiptText.trim()) return;
    setParsingAi(true);
    setAiMessage('');
    try {
      const { data } = await api.post('/ai/parse-receipt', { receiptText: receiptText.trim() });
      if (data.merchant) setDescription(data.merchant);
      if (data.amount) setAmount(data.amount.toString());
      if (data.category) setCategory(data.category);

      setAiMessage('AI parsed receipt text and updated expense form.');
      setAiMode('manual');
    } catch (err) {
      console.error('AI receipt error:', err);
      setAiMessage('Could not parse receipt text.');
    } finally {
      setParsingAi(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!description.trim() || !parsedAmount || parsedAmount <= 0) {
      setError('Please enter a description and a valid positive amount.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/expenses', {
        groupId,
        description: description.trim(),
        amount: parsedAmount,
        paidBy: Number(paidBy),
        category,
      });
      onAdded();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add expense. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="inspo-card p-6 shadow-2xl border border-[#C7B7A3]/40 bg-white rounded-3xl space-y-5 animate-pop-in relative"
    >
      {/* Form Header */}
      <div className="flex items-center justify-between border-b border-[#C7B7A3]/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#561C24] text-[#E8D8C4] flex items-center justify-center font-bold">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-[#561C24]">Add Expense</h3>
            <p className="text-xs text-[#6E5B55] font-semibold">Manual entry or AI Smart Assistants</p>
          </div>
        </div>

        {/* AI Tool Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleVoiceInput}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
              listening ? 'bg-rose-700 text-white animate-pulse' : 'bg-[#FAF6F0] text-[#561C24] border-[#C7B7A3]/40'
            }`}
          >
            <Mic size={13} />
            <span>{listening ? 'Listening...' : 'AI Voice'}</span>
          </button>

          <button
            type="button"
            onClick={() => setAiMode(aiMode === 'prompt' ? 'manual' : 'prompt')}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
              aiMode === 'prompt' ? 'bg-[#561C24] text-[#E8D8C4]' : 'bg-[#FAF6F0] text-[#561C24] border-[#C7B7A3]/40'
            }`}
          >
            <Wand2 size={13} />
            <span>AI Prompt</span>
          </button>

          <button
            type="button"
            onClick={() => setAiMode(aiMode === 'receipt' ? 'manual' : 'receipt')}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
              aiMode === 'receipt' ? 'bg-[#561C24] text-[#E8D8C4]' : 'bg-[#FAF6F0] text-[#561C24] border-[#C7B7A3]/40'
            }`}
          >
            <FileText size={13} />
            <span>AI Receipt</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#6E5B55] hover:text-[#2B0D12] ml-2"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {aiMessage && (
        <div className="text-xs p-3 rounded-xl bg-[#E8D8C4] border border-[#C7B7A3]/40 text-[#561C24] font-bold flex items-center gap-2">
          <Sparkles size={14} className="shrink-0 text-[#561C24]" />
          <span>{aiMessage}</span>
        </div>
      )}

      {duplicateWarning && (
        <div className="text-xs p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0 text-amber-600" />
          <span>{duplicateWarning}</span>
        </div>
      )}

      {error && (
        <div className="text-xs p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* AI Prompt Input Drawer */}
      {aiMode === 'prompt' && (
        <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#C7B7A3]/40 space-y-2 animate-pop-in">
          <label className="block text-xs font-bold text-[#561C24] flex items-center gap-1">
            <Wand2 size={14} className="text-[#561C24]" />
            Type Natural Language Sentence
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Alex paid 1500 for dinner yesterday"
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold border border-[#C7B7A3]/40 bg-white text-[#2B0D12] focus:outline-none focus:ring-2 focus:ring-[#561C24]"
            />
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); parsePromptText(aiPrompt); }}
              disabled={parsingAi || !aiPrompt.trim()}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#561C24] text-[#E8D8C4] hover:bg-[#6D2932] disabled:opacity-50"
            >
              {parsingAi ? 'Parsing...' : 'AI Extract'}
            </button>
          </div>
        </div>
      )}

      {/* AI Receipt Drawer */}
      {aiMode === 'receipt' && (
        <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#C7B7A3]/40 space-y-2 animate-pop-in">
          <label className="block text-xs font-bold text-[#561C24] flex items-center gap-1">
            <FileText size={14} className="text-[#561C24]" />
            Paste Receipt Text / Invoice Details
          </label>
          <textarea
            rows={3}
            value={receiptText}
            onChange={(e) => setReceiptText(e.target.value)}
            placeholder="Paste raw text from receipt or invoice (e.g. STARBUCKS CAFE, Total: INR 650.00)..."
            className="w-full p-3 rounded-xl text-xs font-semibold border border-[#C7B7A3]/40 bg-white text-[#2B0D12] focus:outline-none focus:ring-2 focus:ring-[#561C24]"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAiParseReceipt}
              disabled={parsingAi || !receiptText.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#561C24] text-[#E8D8C4] hover:bg-[#6D2932] disabled:opacity-50"
            >
              {parsingAi ? 'Parsing Receipt...' : 'AI Scan Receipt'}
            </button>
          </div>
        </div>
      )}

      {/* Description & Amount */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#6E5B55]">
            What was it for? *
          </label>
          <input
            autoFocus
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Dinner, Taxi, Groceries..."
            className="w-full px-4 py-3 rounded-2xl text-sm font-semibold border-2 border-[#C7B7A3]/50 text-[#2B0D12] focus:border-[#561C24] focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#6E5B55]">
            Amount (₹) *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-3.5 text-sm font-bold text-[#6E5B55]">₹</span>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-3 rounded-2xl text-sm font-mono font-bold border-2 border-[#C7B7A3]/50 text-[#2B0D12] focus:border-[#561C24] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#6E5B55]">
          Category
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {Object.entries(CATEGORY_CONFIG).map(([catKey, cfg]) => {
            const IconComponent = cfg.icon;
            const isSelected = category === catKey;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setCategory(catKey)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 text-xs font-bold transition-all ${
                  isSelected ? `${cfg.color} scale-105 shadow-sm border-current` : 'bg-[#FAF6F0] border-[#C7B7A3]/40 text-[#6E5B55] hover:bg-[#E8D8C4]/40'
                }`}
              >
                <IconComponent size={20} className="mb-1" />
                <span className="capitalize text-[11px]">{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Paid By & Split Preview */}
      <div className="grid md:grid-cols-2 gap-4 pt-2">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#6E5B55]">
            Paid By
          </label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl text-sm font-semibold border-2 border-[#C7B7A3]/50 bg-white text-[#2B0D12] focus:border-[#561C24] focus:outline-none"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id === currentUserId ? `${m.name} (You)` : m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col justify-center px-4 py-3 rounded-2xl bg-[#E8D8C4] border border-[#C7B7A3]/40">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#561C24]">Equally Split Preview</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-semibold text-[#6E5B55]">Each member pays:</span>
            <span className="font-display font-bold text-xl text-[#561C24]">
              ₹{perPersonShare}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#C7B7A3]/20">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#6E5B55] hover:bg-[#FAF6F0]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 rounded-xl text-xs font-bold text-[#E8D8C4] bg-[#561C24] hover:bg-[#6D2932] shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {submitting ? 'Saving...' : (
            <>
              <Check size={16} />
              <span>Save Expense</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
