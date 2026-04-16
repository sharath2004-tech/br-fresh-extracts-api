import { Plus, Trash2, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';

const CATEGORIES = ['Rent', 'Salaries', 'Packaging', 'Logistics', 'Supplies', 'Utilities', 'Marketing', 'Other'];

const CAT_COLORS = {
  Rent:       'bg-red-50 text-red-700 border-red-200',
  Salaries:   'bg-blue-50 text-blue-700 border-blue-200',
  Packaging:  'bg-purple-50 text-purple-700 border-purple-200',
  Logistics:  'bg-orange-50 text-orange-700 border-orange-200',
  Supplies:   'bg-teal-50 text-teal-700 border-teal-200',
  Utilities:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  Marketing:  'bg-pink-50 text-pink-700 border-pink-200',
  Other:      'bg-sand-100 text-warm-brown border-sand-200',
};

const PERIOD_TABS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all',   label: 'All Time' },
];

function getStart(period) {
  const now = new Date();
  if (period === 'today') { const d = new Date(now); d.setHours(0,0,0,0); return d; }
  if (period === 'week')  { const d = new Date(now); d.setDate(d.getDate()-7); d.setHours(0,0,0,0); return d; }
  if (period === 'month') { const d = new Date(now); d.setDate(d.getDate()-30); d.setHours(0,0,0,0); return d; }
  return null;
}

function loadExpenses() {
  try { return JSON.parse(localStorage.getItem('so_expenses') || '[]'); }
  catch { return []; }
}
function saveExpenses(expenses) {
  localStorage.setItem('so_expenses', JSON.stringify(expenses));
}

const emptyForm = { date: new Date().toISOString().slice(0, 10), category: 'Rent', description: '', amount: '' };

export default function AdminExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [period, setPeriod] = useState('month');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [catFilter, setCatFilter] = useState('all');

  useEffect(() => { setExpenses(loadExpenses()); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filtered = (() => {
    const start = getStart(period);
    return expenses.filter(e => {
      const inPeriod = !start || new Date(e.date) >= start;
      const inCat = catFilter === 'all' || e.category === catFilter;
      return inPeriod && inCat;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  })();

  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);

  const addExpense = (ev) => {
    ev.preventDefault();
    if (!form.description.trim() || !form.amount) return;
    const newExp = {
      id: `EXP-${Date.now()}`,
      date: form.date,
      category: form.category,
      description: form.description.trim(),
      amount: Number(form.amount),
    };
    const next = [newExp, ...expenses];
    setExpenses(next);
    saveExpenses(next);
    setForm(emptyForm);
    setShowForm(false);
  };

  const deleteExpense = (id) => {
    if (!window.confirm('Delete this expense?')) return;
    const next = expenses.filter(e => e.id !== id);
    setExpenses(next);
    saveExpenses(next);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-forest-700 mb-1">Expenses</h1>
          <p className="text-sm text-warm-brown/60">Track your business expenses to calculate real profit.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-terra-500 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-terra-600 transition-colors">
          <Plus size={15} /> Add Expense
        </button>
      </div>

      {/* Add expense form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-sand-200 shadow-sm p-5 mb-6">
          <h2 className="font-serif text-lg text-forest-700 mb-4">New Expense</h2>
          <form onSubmit={addExpense} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Date *</label>
              <input type="date" required className="input-field"
                value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div>
              <label className="label">Category *</label>
              <select required className="input-field" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description *</label>
              <input required className="input-field" placeholder="e.g. Monthly shop rent"
                value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div>
              <label className="label">Amount (₹) *</label>
              <input required type="number" min="1" step="0.01" className="input-field" placeholder="15000"
                value={form.amount} onChange={e => set('amount', e.target.value)} />
            </div>
            <div className="flex items-end gap-3">
              <button type="submit" className="btn-primary flex-1">Save Expense</button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-warm-brown/50 hover:text-warm-brown transition-colors px-3 py-2">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Period tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {PERIOD_TABS.map(t => (
          <button key={t.key} onClick={() => setPeriod(t.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              period === t.key
                ? 'bg-terra-500 text-white border-terra-500'
                : 'bg-white text-warm-brown border-sand-200 hover:border-sand-300'
            }`}>{t.label}</button>
        ))}
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-2xl border border-sand-200 shadow-sm p-5 mb-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
          <TrendingDown className="text-red-500" size={20} />
        </div>
        <div>
          <p className="text-2xl font-serif font-semibold text-red-600">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</p>
          <p className="text-xs text-warm-brown/60">Total expenses — {PERIOD_TABS.find(t => t.key === period)?.label}</p>
        </div>
        {/* Category filter */}
        <div className="ml-auto">
          <select className="input-field text-xs py-1.5" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <TrendingDown className="text-sand-300 mx-auto mb-3" size={40} strokeWidth={1} />
          <p className="text-sm text-warm-brown/50">No expenses recorded for this period.</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-sm text-terra-500 hover:underline">Add your first expense</button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(exp => (
            <div key={exp.id} className="bg-white rounded-xl border border-sand-200 px-4 py-3 flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${CAT_COLORS[exp.category] || CAT_COLORS.Other}`}>
                {exp.category}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-forest-700 truncate">{exp.description}</p>
                <p className="text-xs text-warm-brown/50">{new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
              <p className="text-sm font-semibold text-red-600 shrink-0">₹{Number(exp.amount).toLocaleString()}</p>
              <button onClick={() => deleteExpense(exp.id)}
                className="text-warm-brown/30 hover:text-red-500 transition-colors shrink-0 p-1">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
