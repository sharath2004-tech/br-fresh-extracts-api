import { ExternalLink, Loader2, Package, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_URL = (() => { const u = import.meta.env.VITE_API_URL || '/api/'; return u.endsWith('/') ? u : u + '/'; })();

const STATUS_COLORS = {
  Pending:   'bg-amber-50 text-amber-700 border-amber-200',
  Confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  Packed:    'bg-purple-50 text-purple-700 border-purple-200',
  Shipped:   'bg-indigo-50 text-indigo-700 border-indigo-200',
  Delivered: 'bg-forest-50 text-forest-700 border-forest-200',
  Cancelled: 'bg-red-50 text-red-600 border-red-200',
};

function fmt(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function OrdersPage() {
  const { user, getValidToken } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const handleCancel = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(orderId);
    try {
      const token = await getValidToken();
      const res = await fetch(`${API_URL}orders/${orderId}/cancel/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Cancelled' } : o));
      } else {
        const d = await res.json();
        alert(d.error || 'Could not cancel order.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setCancelling(null);
    }
  };

  // Load localStorage orders for the signed-in phone number
  const loadLocalOrders = (phone) => {
    const phoneKey = (phone || '').replace(/\D/g, '');
    if (!phoneKey) return [];
    try {
      const byPhone = JSON.parse(localStorage.getItem('so_orders_by_phone') || '{}');
      const list = Array.isArray(byPhone[phoneKey]) ? byPhone[phoneKey] : [];
      return list.map(o => ({
        id: o.id,
        status: o.status || 'Pending',
        date: o.date || o.created_at,
        total: Number(o.total || o.total_amount || 0),
        shipping: Number(o.shipping || 0),
        paymentMethod: o.paymentMethod || o.payment_mode || 'COD',
        customer: o.customer || {},
        items: (o.items || []).map(i => ({
          name: i.name || i.product || '',
          weight: i.weight || '',
          qty: i.qty || i.quantity || 1,
          price: Number(i.price || i.price_at_time || 0),
        })),
        _fromLocal: true,
      }));
    } catch { return []; }
  };

  useEffect(() => {
    if (!user || user.role !== 'customer') { navigate('/login'); return; }

    const load = async () => {
      const token = await getValidToken();
      const localOrders = loadLocalOrders(user.phone);

      if (!token) {
        setOrders(localOrders);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}orders/`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          const dbOrders = data.map(o => ({
            id: o.id,
            status: o.status || 'Pending',
            date: o.created_at || o.date,
            total: Number(o.total_amount || 0),
            shipping: Number(o.shipping || 0),
            paymentMethod: o.payment_mode || 'COD',
            customer: o.customer || {},
            items: (o.items || []).map(i => ({
              name: i.product || i.name || '',
              weight: i.weight || '',
              qty: i.quantity || i.qty || 1,
              price: Number(i.price_at_time || i.price || 0),
            })),
          }));
          // DB is authoritative — show only DB orders when logged in
          setOrders(dbOrders.sort((a, b) => new Date(b.date) - new Date(a.date)));
        } else {
          setOrders(localOrders);
        }
      } catch {
        setOrders(localOrders);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center pt-20">
      <Loader2 className="text-terra-400 animate-spin" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-cream pt-20">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <ShoppingBag className="text-terra-500" size={20} />
          <h1 className="font-serif text-3xl text-forest-700">My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="text-sand-300 mx-auto mb-4" size={52} strokeWidth={1} />
            <p className="font-serif text-2xl text-forest-700 mb-2">No orders yet</p>
            <p className="text-sm text-warm-brown/50 mb-6">Your confirmed orders will appear here.</p>
            <Link to="/shop" className="btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const isOpen = expanded === order.id;
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-sand-200 shadow-sm overflow-hidden">
                  {/* Header */}
                  <button
                    className="w-full text-left p-5"
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-xs text-warm-brown/40">{order.id}</span>
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
                        <p className="text-xs text-warm-brown/50">{fmt(order.date)} &nbsp;|&nbsp; {order.items.length} item(s)</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-forest-700">₹{order.total.toLocaleString()}</p>
                        <p className="text-xs text-warm-brown/40 mt-0.5">{isOpen ? 'Hide details ▲' : 'Show details ▼'}</p>
                      </div>
                    </div>
                  </button>

                  {/* Expanded */}
                  {isOpen && (
                    <div className="border-t border-sand-100 px-5 py-4 bg-sand-50/40">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Items */}
                        <div>
                          <p className="text-xs font-semibold text-warm-brown/50 uppercase tracking-wide mb-2">Items</p>
                          <div className="space-y-1.5">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span className="text-forest-700">
                                  {item.name} {item.weight ? <span className="text-warm-brown/40">({item.weight})</span> : ''} × {item.qty}
                                </span>
                                <span className="font-medium text-terra-500 shrink-0 ml-2">₹{(item.price * item.qty).toLocaleString()}</span>
                              </div>
                            ))}
                            <div className="border-t border-sand-200 pt-1.5 mt-1.5 space-y-1">
                              {order.shipping > 0 && (
                                <div className="flex justify-between text-xs text-warm-brown/50">
                                  <span>Shipping</span><span>₹{order.shipping}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm font-semibold text-forest-700">
                                <span>Total</span><span>₹{order.total.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Delivery */}
                        <div>
                          <p className="text-xs font-semibold text-warm-brown/50 uppercase tracking-wide mb-2">Delivery Address</p>
                          {order.customer.address ? (
                            <>
                              <p className="text-sm text-forest-700">{order.customer.address}</p>
                              <p className="text-sm text-warm-brown/60">{order.customer.city}{order.customer.state ? `, ${order.customer.state}` : ''}{order.customer.pincode ? ` — ${order.customer.pincode}` : ''}</p>
                              {(order.customer.lat || order.customer.maps_link) && (
                                <a href={order.customer.maps_link || `https://maps.google.com/?q=${order.customer.lat},${order.customer.lng}`}
                                  target="_blank" rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-terra-500 hover:underline mt-1">
                                  <ExternalLink size={11} /> View on Google Maps
                                </a>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-warm-brown/40">No address saved</p>
                          )}
                        </div>
                      </div>

                      {/* Cancel button — only before packing (Pending or Confirmed) */}
                      {['Pending', 'Confirmed'].includes(order.status) && (
                        <div className="mt-4 pt-3 border-t border-sand-100">
                          <button
                            onClick={() => handleCancel(order.id)}
                            disabled={cancelling === order.id}
                            className="flex items-center gap-2 text-sm font-medium text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                          >
                            {cancelling === order.id ? <Loader2 size={14} className="animate-spin" /> : null}
                            Cancel Order
                          </button>
                          <p className="text-xs text-warm-brown/40 mt-1.5">Cancellation is only available before your order is packed.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
