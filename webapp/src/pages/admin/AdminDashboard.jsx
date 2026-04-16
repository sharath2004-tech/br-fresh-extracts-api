import { ArrowRight, CheckSquare, Grid, Image, MessageSquare, Package, ShoppingCart, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';

const cards = [
  { label: 'Orders',        to: '/admin/orders',      icon: ShoppingCart,  color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { label: 'Expenses',      to: '/admin/expenses',    icon: TrendingDown,  color: 'bg-red-50 text-red-500 border-red-100' },
  { label: 'Hero Section',  to: '/admin/hero',        icon: Image,         color: 'bg-terra-50 text-terra-500 border-terra-100' },
  { label: 'Categories',    to: '/admin/categories',  icon: Grid,          color: 'bg-forest-50 text-forest-600 border-forest-100' },
  { label: 'Products',      to: '/admin/products',    icon: Package,       color: 'bg-sand-100 text-warm-brown border-sand-200' },
  { label: 'Testimonials',  to: '/admin/testimonials',icon: MessageSquare, color: 'bg-terra-50 text-terra-500 border-terra-100' },
  { label: 'Why Us',        to: '/admin/why-us',      icon: CheckSquare,   color: 'bg-forest-50 text-forest-600 border-forest-100' },
];

const REVENUE_TABS = [
  { key: 'daily',   label: 'Today' },
  { key: 'weekly',  label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
];

function getWindowStart(key) {
  const now = new Date();
  if (key === 'daily')  { const d = new Date(now); d.setHours(0,0,0,0); return d; }
  if (key === 'weekly') { const d = new Date(now); d.setDate(d.getDate()-7); d.setHours(0,0,0,0); return d; }
  // monthly = last 30 days
  const d = new Date(now); d.setDate(d.getDate()-30); d.setHours(0,0,0,0); return d;
}

function loadOrders()   { try { return JSON.parse(localStorage.getItem('so_orders')   || '[]'); } catch { return []; } }
function loadExpenses() { try { return JSON.parse(localStorage.getItem('so_expenses') || '[]'); } catch { return []; } }

export default function AdminDashboard() {
  const { store } = useStore();
  const { user } = useAuth();
  const [revTab, setRevTab] = useState('monthly');

  const { revenue, orderCount, expenseTotal, profit, pendingCount, codPending, upiPending } = useMemo(() => {
    const start = getWindowStart(revTab);
    const orders   = loadOrders();
    const expenses = loadExpenses();

    const windowOrders = orders.filter(o =>
      o.status !== 'Cancelled' && new Date(o.date) >= start
    );
    const revenue     = windowOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const orderCount  = windowOrders.length;
    const windowExp   = expenses.filter(e => new Date(e.date) >= start);
    const expenseTotal = windowExp.reduce((s, e) => s + Number(e.amount), 0);
    const profit      = revenue - expenseTotal;

    const pendingOrders = orders.filter(o => o.status === 'Pending');
    const codPending    = pendingOrders.filter(o => o.paymentMethod === 'COD').length;
    const upiPending    = pendingOrders.filter(o => o.paymentMethod === 'UPI').length;

    return { revenue, orderCount, expenseTotal, profit, pendingCount: pendingOrders.length, codPending, upiPending };
  }, [revTab]);

  const storeStats = [
    { label: 'Products',     value: store.products.length },
    { label: 'Categories',   value: store.categories.length },
    { label: 'Testimonials', value: store.testimonials.length },
    { label: 'Why Us Items', value: store.whyUs.length },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-forest-700 mb-1">Good day, {user?.name} 👋</h1>
        <p className="text-sm text-warm-brown/60">Here's an overview of your store.</p>
      </div>

      {/* Revenue section */}
      <div className="bg-white rounded-2xl border border-sand-200 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-serif text-lg text-forest-700 flex items-center gap-2">
            <TrendingUp size={18} className="text-terra-500" /> Revenue & Profit
          </h2>
          <div className="flex gap-1.5">
            {REVENUE_TABS.map(t => (
              <button key={t.key} onClick={() => setRevTab(t.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  revTab === t.key
                    ? 'bg-terra-500 text-white border-terra-500'
                    : 'bg-white text-warm-brown border-sand-200 hover:border-sand-300'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-forest-50 border border-forest-100 rounded-xl p-3">
            <p className="text-xs text-forest-600/70 font-medium mb-1">Revenue</p>
            <p className="font-serif text-xl font-semibold text-forest-700">₹{revenue.toLocaleString('en-IN')}</p>
            <p className="text-xs text-forest-600/50 mt-0.5">{orderCount} order{orderCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-3">
            <p className="text-xs text-red-600/70 font-medium mb-1">Expenses</p>
            <p className="font-serif text-xl font-semibold text-red-600">₹{expenseTotal.toLocaleString('en-IN')}</p>
            <p className="text-xs text-red-600/50 mt-0.5">Total outflow</p>
          </div>
          <div className={`border rounded-xl p-3 ${profit >= 0 ? 'bg-terra-50 border-terra-100' : 'bg-orange-50 border-orange-100'}`}>
            <p className={`text-xs font-medium mb-1 ${profit >= 0 ? 'text-terra-600/70' : 'text-orange-600/70'}`}>Net Profit</p>
            <p className={`font-serif text-xl font-semibold ${profit >= 0 ? 'text-terra-600' : 'text-orange-600'}`}>
              {profit < 0 ? '-' : ''}₹{Math.abs(profit).toLocaleString('en-IN')}
            </p>
            <p className={`text-xs mt-0.5 ${profit >= 0 ? 'text-terra-600/50' : 'text-orange-600/50'}`}>
              {profit >= 0 ? 'Profitable' : 'In deficit'}
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-xs text-amber-700/70 font-medium mb-1">Pending Orders</p>
            <p className="font-serif text-xl font-semibold text-amber-700">{pendingCount}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {codPending > 0 && <span className="text-xs text-orange-600">🚚 {codPending} COD</span>}
              {upiPending > 0 && <span className="text-xs text-purple-600">💳 {upiPending} UPI</span>}
              {pendingCount === 0 && <span className="text-xs text-amber-600/50">All clear</span>}
            </div>
          </div>
        </div>

        {(codPending > 0 || upiPending > 0) && (
          <div className="mt-4 flex flex-wrap gap-3">
            {codPending > 0 && (
              <Link to="/admin/orders"
                className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-orange-100 transition-colors">
                🚚 {codPending} COD order{codPending > 1 ? 's' : ''} need agent call →
              </Link>
            )}
            {upiPending > 0 && (
              <Link to="/admin/orders"
                className="flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-purple-100 transition-colors">
                💳 {upiPending} UPI order{upiPending > 1 ? 's' : ''} need payment approval →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Store content stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {storeStats.map(s => (
          <div key={s.label} className="admin-card text-center">
            <p className="font-serif text-3xl text-terra-500 font-semibold">{s.value}</p>
            <p className="text-xs text-warm-brown/60 mt-1 font-sans">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick access */}
      <h2 className="font-serif text-lg text-forest-700 mb-4">Manage Sections</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ label, to, icon: Icon, color }) => (
          <Link key={to} to={to}
            className="admin-card flex items-center gap-4 hover:shadow-md transition-shadow group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${color}`}>
              <Icon size={18} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-forest-700 text-sm">{label}</p>
              <p className="text-xs text-warm-brown/50">Manage →</p>
            </div>
            <ArrowRight size={15} className="text-warm-brown/25 group-hover:text-terra-400 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
