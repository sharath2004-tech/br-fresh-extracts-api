import {
    CheckCircle, ChevronDown, ExternalLink, Eye,
    Package, Phone,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];

const STATUS_COLORS = {
  Pending:   'bg-amber-50 text-amber-700 border-amber-200',
  Confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  Packed:    'bg-purple-50 text-purple-700 border-purple-200',
  Shipped:   'bg-indigo-50 text-indigo-700 border-indigo-200',
  Delivered: 'bg-forest-50 text-forest-700 border-forest-200',
  Cancelled: 'bg-red-50 text-red-600 border-red-200',
};

const FILTER_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'cod',       label: 'COD Pending' },
  { key: 'upi',       label: 'UPI Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'packed',    label: 'Packed' },
  { key: 'shipped',   label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

function loadOrders() {
  try { return JSON.parse(localStorage.getItem('so_orders') || '[]'); }
  catch { return []; }
}

function saveOrders(orders) {
  localStorage.setItem('so_orders', JSON.stringify(orders));
}

function getProofSrc(order) {
  if (!order.paymentProofUrl) return null;
  if (order.paymentProofUrl.startsWith('__local__')) {
    const key = `so_proof_${order.id}`;
    return localStorage.getItem(key) || null;
  }
  return order.paymentProofUrl;
}

function fmt(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [proofModal, setProofModal] = useState(null); // order to show proof for

  useEffect(() => { setOrders(loadOrders()); }, []);

  const updateOrder = (id, patch) => {
    setOrders(prev => {
      const next = prev.map(o => o.id === id ? { ...o, ...patch } : o);
      saveOrders(next);
      return next;
    });
  };

  const confirmCOD = (id) => updateOrder(id, { status: 'Confirmed' });
  const approveUPI = (id) => updateOrder(id, { status: 'Packed' });
  const changeStatus = (id, status) => updateOrder(id, { status });

  const filtered = orders.filter(o => {
    if (filter === 'all') return true;
    if (filter === 'cod') return o.paymentMethod === 'COD' && o.status === 'Pending';
    if (filter === 'upi') return o.paymentMethod === 'UPI' && o.status === 'Pending';
    if (filter === 'confirmed') return o.status === 'Confirmed';
    if (filter === 'packed') return o.status === 'Packed';
    if (filter === 'shipped') return o.status === 'Shipped';
    if (filter === 'delivered') return o.status === 'Delivered';
    if (filter === 'cancelled') return o.status === 'Cancelled';
    return true;
  });

  const countBadge = (key) => {
    if (key === 'all') return orders.length;
    if (key === 'cod') return orders.filter(o => o.paymentMethod === 'COD' && o.status === 'Pending').length;
    if (key === 'upi') return orders.filter(o => o.paymentMethod === 'UPI' && o.status === 'Pending').length;
    return orders.filter(o => o.status === key.charAt(0).toUpperCase() + key.slice(1)).length;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-forest-700 mb-1">Orders</h1>
        <p className="text-sm text-warm-brown/60">Manage customer orders — confirm COD calls & approve UPI payments.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTER_TABS.map(tab => {
          const count = countBadge(tab.key);
          const active = filter === tab.key;
          const urgent = (tab.key === 'cod' || tab.key === 'upi') && count > 0;
          return (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
                active
                  ? 'bg-terra-500 text-white border-terra-500'
                  : urgent
                    ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                    : 'bg-white text-warm-brown border-sand-200 hover:border-sand-300'
              }`}>
              {tab.label}
              {count > 0 && (
                <span className={`inline-flex items-center justify-center rounded-full w-4 h-4 text-[10px] font-bold ${
                  active ? 'bg-white/30 text-white' : urgent ? 'bg-amber-600 text-white' : 'bg-sand-200 text-warm-brown/70'
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="text-sand-300 mx-auto mb-3" size={40} strokeWidth={1} />
          <p className="text-sm text-warm-brown/50">No orders found for this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const proofSrc = getProofSrc(order);
            const isOpen = expanded === order.id;
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-sand-200 shadow-sm overflow-hidden">
                {/* Order header */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-warm-brown/50">{order.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[order.status] || STATUS_COLORS.Pending}`}>
                        {order.status}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        order.paymentMethod === 'UPI'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {order.paymentMethod === 'UPI' ? '💳 UPI' : '🚚 COD'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <p className="font-semibold text-forest-700 text-sm">{order.customer?.name}</p>
                      <a href={`tel:${order.customer?.phone}`}
                        className="flex items-center gap-1 text-xs text-terra-500 hover:text-terra-600 font-medium">
                        <Phone size={11} />{order.customer?.phone}
                      </a>
                    </div>
                    <p className="text-xs text-warm-brown/50 mt-0.5">{fmt(order.date)} &nbsp;|&nbsp; {order.items?.length} item(s) &nbsp;|&nbsp; <span className="font-semibold text-terra-500">₹{order.total?.toLocaleString()}</span></p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {order.paymentMethod === 'COD' && order.status === 'Pending' && (
                      <button onClick={() => confirmCOD(order.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold bg-forest-500 text-white px-3 py-1.5 rounded-lg hover:bg-forest-600 transition-colors">
                        <Phone size={12} />
                        Agent Confirmed
                      </button>
                    )}
                    {order.paymentMethod === 'UPI' && order.status === 'Pending' && proofSrc && (
                      <>
                        <button onClick={() => setProofModal(order)}
                          className="flex items-center gap-1.5 text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors">
                          <Eye size={12} /> View Proof
                        </button>
                        <button onClick={() => approveUPI(order.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold bg-terra-500 text-white px-3 py-1.5 rounded-lg hover:bg-terra-600 transition-colors">
                          <CheckCircle size={12} /> Approve & Pack
                        </button>
                      </>
                    )}
                    {order.paymentMethod === 'UPI' && order.status === 'Pending' && !proofSrc && (
                      <button onClick={() => approveUPI(order.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold bg-terra-500 text-white px-3 py-1.5 rounded-lg hover:bg-terra-600 transition-colors">
                        <CheckCircle size={12} /> Approve & Pack
                      </button>
                    )}

                    {/* Status dropdown */}
                    <div className="relative group">
                      <button className="flex items-center gap-1 text-xs font-medium text-warm-brown border border-sand-200 bg-sand-50 px-2.5 py-1.5 rounded-lg hover:border-sand-300 transition-colors">
                        Status <ChevronDown size={11} />
                      </button>
                      <div className="absolute right-0 top-full mt-1 bg-white border border-sand-200 rounded-xl shadow-lg z-10 overflow-hidden hidden group-hover:block min-w-[130px]">
                        {STATUS_OPTIONS.map(s => (
                          <button key={s} onClick={() => changeStatus(order.id, s)}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-sand-50 transition-colors ${order.status === s ? 'font-semibold text-terra-500' : 'text-warm-brown'}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button onClick={() => setExpanded(isOpen ? null : order.id)}
                      className="text-xs text-warm-brown/50 hover:text-warm-brown transition-colors p-1.5">
                      <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Expanded order details */}
                {isOpen && (
                  <div className="border-t border-sand-100 px-4 py-4 bg-sand-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Items */}
                      <div>
                        <p className="text-xs font-semibold text-warm-brown/60 uppercase tracking-wide mb-2">Items Ordered</p>
                        <div className="space-y-1.5">
                          {order.items?.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                              <span className="text-forest-700">{item.name} <span className="text-warm-brown/50">({item.weight})</span> × {item.qty}</span>
                              <span className="font-medium text-terra-500">₹{(item.price * item.qty).toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="border-t border-sand-200 pt-1.5 mt-1.5 space-y-1">
                            <div className="flex justify-between text-xs text-warm-brown/60">
                              <span>Shipping</span><span>₹{order.shipping ?? 0}</span>
                            </div>
                            <div className="flex justify-between text-sm font-semibold text-forest-700">
                              <span>Total</span><span>₹{order.total?.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Delivery address */}
                      <div>
                        <p className="text-xs font-semibold text-warm-brown/60 uppercase tracking-wide mb-2">Delivery Address</p>
                        <p className="text-sm text-forest-700">{order.customer?.address}</p>
                        <p className="text-sm text-warm-brown/70">{order.customer?.city}, {order.customer?.state} — {order.customer?.pincode}</p>
                        {order.customer?.lat && (
                          <a href={`https://maps.google.com/?q=${order.customer.lat},${order.customer.lng}`}
                            target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-terra-500 hover:underline mt-1">
                            <ExternalLink size={11} /> View on Google Maps
                          </a>
                        )}
                        {order.customer?.email && (
                          <p className="text-xs text-warm-brown/50 mt-1">{order.customer.email}</p>
                        )}
                        {/* UPI proof thumbnail */}
                        {order.paymentMethod === 'UPI' && proofSrc && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-warm-brown/60 uppercase tracking-wide mb-1">Payment Proof</p>
                            <img src={proofSrc} alt="Payment proof"
                              className="max-h-24 rounded-lg object-contain border border-sand-200 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setProofModal(order)} />
                          </div>
                        )}
                      </div>
                    </div>
                    {order.notes && (
                      <div className="mt-3 text-xs text-warm-brown/60 bg-white border border-sand-100 rounded-lg px-3 py-2">
                        <span className="font-semibold">Notes:</span> {order.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* UPI Proof modal */}
      {proofModal && (() => {
        const src = getProofSrc(proofModal);
        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setProofModal(null)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-serif text-lg text-forest-700">UPI Payment Proof</p>
                  <p className="text-xs text-warm-brown/50">{proofModal.customer?.name} — ₹{proofModal.total?.toLocaleString()}</p>
                </div>
                <button onClick={() => setProofModal(null)} className="text-warm-brown/40 hover:text-warm-brown transition-colors">
                  <X size={20} />
                </button>
              </div>
              {src ? (
                <img src={src} alt="UPI payment proof" className="w-full max-h-96 object-contain rounded-xl border border-sand-200" />
              ) : (
                <p className="text-sm text-warm-brown/50 text-center py-8">Proof image not available.</p>
              )}
              {proofModal.status === 'Pending' && (
                <div className="flex gap-3 mt-4">
                  <button onClick={() => { approveUPI(proofModal.id); setProofModal(null); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-terra-500 text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-terra-600 transition-colors">
                    <CheckCircle size={15} /> Approve & Pack
                  </button>
                  <button onClick={() => { changeStatus(proofModal.id, 'Cancelled'); setProofModal(null); }}
                    className="px-4 py-2.5 rounded-xl text-sm text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors font-medium">
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
