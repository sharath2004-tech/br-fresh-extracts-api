import { Camera, CheckCircle, CreditCard, Loader2, MapPin, Navigation, ShoppingBag, Truck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AnimatedSection from '../components/ui/AnimatedSection';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../contexts/StoreContext';

// Open URLs natively on Android (Capacitor), fall back to window.open on web
async function openUrl(url) {
  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
  } catch {
    window.open(url, '_blank');
  }
}

const _rawApi = import.meta.env.VITE_API_URL || '/api/';
const API_URL = _rawApi.endsWith('/') ? _rawApi : _rawApi + '/';
const UPLOAD_SECRET = import.meta.env.VITE_UPLOAD_SECRET || '';

const normalizePhone = (value = '') => value.replace(/\D/g, '');

const emptyForm = {
  name: '', phone: '', email: '',
  address: '', city: '', state: '', pincode: '',
};

async function uploadProofToBackend(file) {
  const fd = new FormData();
  fd.append('file', file);
  const headers = {};
  if (UPLOAD_SECRET) headers['X-Upload-Secret'] = UPLOAD_SECRET;
  const res = await fetch(`${API_URL}upload/`, { method: 'POST', headers, body: fd });
  if (!res.ok) throw new Error('Backend upload failed');
  const data = await res.json();
  return data.url;
}

function compressFileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
        if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function CheckoutPage() {
  const { items, total, clearCart, cartKey } = useCart();
  const { store } = useStore();
  const { t, tr, translateAsync } = useLanguage();
  const { user, getValidToken } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [location, setLocation] = useState(null); // { lat, lng, label }
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'COD'
  const [paymentFile, setPaymentFile] = useState(null);
  const [paymentPreview, setPaymentPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef();
  const isLoggedInCustomer = user?.role === 'customer';
  const verifiedPhone = user?.phone || '';

  useEffect(() => {
    if (!isLoggedInCustomer) return;
    setForm((f) => ({
      ...f,
      name: f.name || user?.name || '',
      phone: f.phone || verifiedPhone || '',
      email: f.email || user?.email || '',
    }));
  }, [isLoggedInCustomer, user, verifiedPhone]);

  const shippingMode = store.settings?.shippingMode || 'flat';
  const shippingCharge = Number(store.settings?.shippingCharge ?? 79);
  const freeShippingAbove = Number(store.settings?.freeShippingAbove ?? 499);
  const shipping = shippingMode === 'free' ? 0
    : shippingMode === 'discuss' ? 0
    : (freeShippingAbove > 0 && total >= freeShippingAbove) ? 0
    : shippingCharge;
  const grandTotal = total + shipping;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-fill address using GPS
  const fetchLocation = () => {
    if (!navigator.geolocation) { setLocError(t('checkout.geoUnsupported')); return; }
    setLocLoading(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          const addr = data.address || {};
          setForm(f => ({
            ...f,
            address: [addr.road, addr.neighbourhood, addr.suburb].filter(Boolean).join(', '),
            city: addr.city || addr.town || addr.village || '',
            state: addr.state || '',
            pincode: addr.postcode || '',
          }));
          setLocation({ lat, lng, label: data.display_name });
        } catch {
          setLocation({ lat, lng, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
        }
        setLocLoading(false);
      },
      (err) => {
        setLocLoading(false);
        setLocError(t('checkout.geoError'));
      },
      { timeout: 10000 }
    );
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPaymentFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPaymentPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedInCustomer || !verifiedPhone) {
      alert(t('checkout.loginRequiredBody'));
      navigate('/login');
      return;
    }
    const userPhone = normalizePhone(verifiedPhone);
    const formPhone = normalizePhone(form.phone);
    if (userPhone && formPhone && userPhone !== formPhone) {
      alert(t('checkout.phoneMismatch'));
      return;
    }
    if (paymentMethod === 'UPI' && !paymentFile) {
      alert(t('checkout.uploadRequired'));
      return;
    }
    setSubmitting(true);

    const whatsapp = (store.settings?.whatsappNumber || '916305352434').replace(/\D/g, '');
    const mapsLink = location ? `https://maps.google.com/?q=${location.lat},${location.lng}` : '';
    const orderId = `ORD-${Date.now()}`;

    // Upload UPI proof if needed
    let proofUrl = null;
    if (paymentMethod === 'UPI' && paymentFile) {
      try {
        proofUrl = await uploadProofToBackend(paymentFile);
      } catch {
        // Fall back: compress + store base64 in localStorage keyed by orderId
        try {
          const b64 = await compressFileToBase64(paymentFile);
          localStorage.setItem(`so_proof_${orderId}`, b64);
          proofUrl = `__local__${orderId}`;
        } catch { proofUrl = null; }
      }
    }

    // Save order to localStorage
    const order = {
      id: orderId,
      date: new Date().toISOString(),
      customer: {
        name: form.name, phone: form.phone, email: form.email,
        address: form.address, city: form.city, state: form.state, pincode: form.pincode,
        lat: location?.lat || null, lng: location?.lng || null,
        maps_link: mapsLink || '',
      },
      items: items.map(i => ({ name: i.name, weight: i.weight, qty: i.qty, price: i.price })),
      subtotal: total,
      shipping,
      total: grandTotal,
      paymentMethod,
      paymentProofUrl: proofUrl,
      status: 'Pending',
      notes: '',
    };
    try {
      const existing = JSON.parse(localStorage.getItem('so_orders') || '[]');
      existing.unshift(order);
      localStorage.setItem('so_orders', JSON.stringify(existing));
      const phoneKey = normalizePhone(form.phone);
      if (phoneKey) {
        const byPhone = JSON.parse(localStorage.getItem('so_orders_by_phone') || '{}');
        const list = Array.isArray(byPhone[phoneKey]) ? byPhone[phoneKey] : [];
        list.unshift(order);
        byPhone[phoneKey] = list;
        localStorage.setItem('so_orders_by_phone', JSON.stringify(byPhone));
        localStorage.setItem(`so_orders_${phoneKey}`, JSON.stringify(list));
      }
    } catch { /* quota issue — order still continues */ }

    // Save order to backend database
    try {
      const token = await getValidToken();
      if (token) {
        const dbRes = await fetch(`${API_URL}orders/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            items: items.map(i => ({ product_id: i.id || null, product: i.name, quantity: i.qty, price_at_time: i.price, weight: i.weight || '' })),
            total_amount: grandTotal,
            shipping,
            payment_mode: paymentMethod,
            payment_proof_url: proofUrl || '',
            customer: {
              name: form.name, phone: form.phone, email: form.email,
              address: form.address, city: form.city, state: form.state, pincode: form.pincode,
              lat: location?.lat || null, lng: location?.lng || null,
              maps_link: mapsLink || '',
            },
          }),
        });
        if (dbRes.ok) {
          const saved = await dbRes.json();
          // Update WhatsApp order ID to use the DB id for consistency
          order.dbId = saved.id;
        }
      }
    } catch { /* non-critical — order is already in localStorage */ }

    // Build WhatsApp notification message
    const translatedNames = await Promise.all(items.map(async (item) => translateAsync(item.name)));
    const orderLines = items.map((item, idx) =>
      `• ${translatedNames[idx]} (${item.weight}) × ${item.qty} — ₹${(item.price * item.qty).toLocaleString()}`
    ).join('\n');

    const shippingText = shippingMode === 'discuss'
      ? t('checkout.shippingDiscuss')
      : shipping === 0
        ? t('checkout.shippingFree')
        : `₹${shipping}`;

    const msg = [
      paymentMethod === 'COD' ? t('whatsapp.newCod') : t('whatsapp.newUpi'),
      t('whatsapp.orderId', { id: orderId }),
      '',
      t('whatsapp.name', { name: form.name }),
      t('whatsapp.phone', { phone: form.phone }),
      form.email ? t('whatsapp.email', { email: form.email }) : null,
      '',
      t('whatsapp.addressTitle'),
      `${form.address}`,
      `${form.city}, ${form.state} — ${form.pincode}`,
      mapsLink ? t('whatsapp.location', { link: mapsLink }) : null,
      '',
      t('whatsapp.detailsTitle'),
      orderLines,
      '',
      t('whatsapp.subtotal', { amount: total.toLocaleString() }),
      t('whatsapp.shipping', { amount: shippingText }),
      shippingMode === 'discuss' ? t('whatsapp.shippingDiscuss') : null,
      t('whatsapp.total', { amount: grandTotal.toLocaleString() }),
      '',
      paymentMethod === 'COD'
        ? t('whatsapp.codNote')
        : t('whatsapp.upiNote'),
    ].filter(l => l !== null).join('\n');

    if (paymentMethod === 'UPI' && paymentFile) {
      // Try Web Share API (shares file + text to WhatsApp on mobile)
      const canShareFile = navigator.canShare && navigator.canShare({ files: [paymentFile] });
      if (canShareFile) {
        try {
          await navigator.share({ files: [paymentFile], text: msg });
          clearCart();
          navigate('/');
          setSubmitting(false);
          return;
        } catch (err) {
          if (err.name === 'AbortError') { setSubmitting(false); return; }
        }
      }
      // Fallback: text link + auto-download screenshot
      await openUrl(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`);
      if (paymentPreview) {
        const dlLink = document.createElement('a');
        dlLink.href = paymentPreview;
        dlLink.download = `payment-${orderId}.jpg`;
        dlLink.click();
      }
    } else {
      // COD: just send text to WhatsApp
      await openUrl(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`);
    }

    clearCart();
    navigate('/');
    setSubmitting(false);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center pt-20">
        <div className="text-center p-8 max-w-sm">
          <ShoppingBag className="text-sand-300 mx-auto mb-5" size={52} strokeWidth={1} />
          <h2 className="font-serif text-3xl text-forest-700 mb-3">{t('checkout.emptyTitle')}</h2>
          <Link to="/shop" className="btn-primary">{t('checkout.emptyCta')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pt-20">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <AnimatedSection>
          <div className="flex items-center gap-3 mb-8">
            <ShoppingBag className="text-terra-500" size={20} />
            <h1 className="font-serif text-3xl md:text-4xl text-forest-700">{t('checkout.title')}</h1>
          </div>
        </AnimatedSection>

        {!isLoggedInCustomer && (
          <div className="mb-6 bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
            <div className="text-amber-600 mt-0.5">📱</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-700">{t('checkout.loginRequiredTitle')}</p>
              <p className="text-xs text-amber-700/70 mt-1">{t('checkout.loginRequiredBody')}</p>
            </div>
            <Link to="/login" className="text-xs font-semibold text-amber-700 underline">
              {t('checkout.loginCta')}
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Left — Address + Location + Payment */}
            <div className="flex-1 space-y-6">

              {/* Contact */}
              <AnimatedSection>
                <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm">
                  <h2 className="font-serif text-xl text-forest-700 mb-5">{t('checkout.contact')}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">{t('checkout.fullName')}</label>
                      <input required className="input-field" value={form.name} onChange={e => set('name', e.target.value)} placeholder={t('checkout.namePlaceholder')} />
                    </div>
                    <div>
                      <label className="label">{t('checkout.phone')}</label>
                      <input required type="tel" pattern="[6-9][0-9]{9}" className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder={t('checkout.phonePlaceholder')} readOnly={Boolean(verifiedPhone)} />
                      {verifiedPhone && (
                        <p className="text-[11px] text-warm-brown/50 mt-1">{t('checkout.phoneLocked')}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">{t('checkout.email')}</label>
                      <input type="email" className="input-field" value={form.email} onChange={e => set('email', e.target.value)} placeholder={t('checkout.emailPlaceholder')} />
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              {/* Delivery Address */}
              <AnimatedSection delay={60}>
                <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-serif text-xl text-forest-700">{t('checkout.delivery')}</h2>
                    <button
                      type="button"
                      onClick={fetchLocation}
                      disabled={locLoading}
                      className="flex items-center gap-1.5 text-xs font-medium text-forest-600 border border-forest-200 bg-forest-50 hover:bg-forest-100 px-3 py-1.5 rounded-full transition-all disabled:opacity-60"
                    >
                      {locLoading
                        ? <><Loader2 size={13} className="animate-spin" /> {t('checkout.detecting')}</>
                        : <><Navigation size={13} /> {t('checkout.useLocation')}</>}
                    </button>
                  </div>
                  {locError && <p className="text-xs text-red-500 mb-3 bg-red-50 rounded-lg px-3 py-2">{locError}</p>}
                  {location && (
                    <div className="flex items-start gap-2 text-xs text-forest-600 bg-forest-50 border border-forest-100 rounded-xl px-3 py-2 mb-4">
                      <MapPin size={13} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">{t('checkout.locationPinned')}</p>
                        <a href={`https://maps.google.com/?q=${location.lat},${location.lng}`} target="_blank" rel="noreferrer"
                          className="underline text-terra-500 break-all">{t('checkout.viewMaps')}</a>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="label">{t('checkout.addressLine')}</label>
                      <input required className="input-field" value={form.address} onChange={e => set('address', e.target.value)} placeholder={t('checkout.addressPlaceholder')} />
                    </div>
                    <div>
                      <label className="label">{t('checkout.city')}</label>
                      <input required className="input-field" value={form.city} onChange={e => set('city', e.target.value)} placeholder={t('checkout.cityPlaceholder')} />
                    </div>
                    <div>
                      <label className="label">{t('checkout.state')}</label>
                      <input required className="input-field" value={form.state} onChange={e => set('state', e.target.value)} placeholder={t('checkout.statePlaceholder')} />
                    </div>
                    <div>
                      <label className="label">{t('checkout.pincode')}</label>
                      <input required pattern="[1-9][0-9]{5}" className="input-field" value={form.pincode} onChange={e => set('pincode', e.target.value)} placeholder={t('checkout.pincodePlaceholder')} />
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              {/* Payment Method */}
              <AnimatedSection delay={120}>
                <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm">
                  <h2 className="font-serif text-xl text-forest-700 mb-5">{t('checkout.payment')}</h2>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === 'UPI'
                          ? 'border-terra-400 bg-terra-50 text-terra-600'
                          : 'border-sand-200 bg-white text-warm-brown/60 hover:border-sand-300'
                      }`}
                    >
                      <CreditCard size={22} />
                      <span className="text-sm font-semibold">{t('checkout.upi')}</span>
                      <span className="text-xs text-center leading-tight opacity-70">{t('checkout.upiDesc')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('COD')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === 'COD'
                          ? 'border-forest-500 bg-forest-50 text-forest-600'
                          : 'border-sand-200 bg-white text-warm-brown/60 hover:border-sand-300'
                      }`}
                    >
                      <Truck size={22} />
                      <span className="text-sm font-semibold">{t('checkout.cod')}</span>
                      <span className="text-xs text-center leading-tight opacity-70">{t('checkout.codDesc')}</span>
                    </button>
                  </div>

                  {paymentMethod === 'UPI' ? (
                    <div>
                      <p className="text-xs text-warm-brown/60 mb-4">
                        {t('checkout.payTo')}: <span className="font-semibold text-forest-700">{store.settings?.upiId}</span>
                        &nbsp;|&nbsp; {t('checkout.amount')}: <span className="font-semibold text-terra-500">₹{grandTotal.toLocaleString()}</span>
                        <br />{t('checkout.uploadHint')}
                      </p>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                      {paymentPreview ? (
                        <div className="relative w-fit">
                          <img src={paymentPreview} alt="Payment screenshot" className="max-h-52 rounded-xl border border-sand-200 object-contain" />
                          <button type="button" onClick={() => { setPaymentFile(null); setPaymentPreview(null); fileRef.current.value = ''; }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600">
                            ×
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => fileRef.current.click()}
                          className="border-2 border-dashed border-sand-300 hover:border-terra-400 rounded-xl p-8 w-full flex flex-col items-center gap-2 text-warm-brown/50 hover:text-terra-500 transition-all">
                          <Camera size={28} strokeWidth={1.5} />
                          <span className="text-sm font-medium">{t('checkout.uploadBtn')}</span>
                          <span className="text-xs">{t('checkout.uploadSub')}</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 bg-forest-50 border border-forest-100 rounded-xl p-4">
                      <CheckCircle size={18} className="text-forest-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-forest-700">{t('checkout.agentTitle')}</p>
                        <p className="text-xs text-warm-brown/60 mt-0.5">
                          {t('checkout.agentDesc', { phone: form.phone || t('checkout.registeredNumber') })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </AnimatedSection>
            </div>

            {/* Right — Order Summary */}
            <AnimatedSection delay={80} className="lg:w-80 shrink-0">
              <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm sticky top-24">
                <h2 className="font-serif text-xl text-forest-700 mb-5">{t('checkout.summary')}</h2>
                <div className="space-y-3 mb-5">
                  {items.map(item => (
                    <div key={cartKey(item)} className="flex gap-3 items-start">
                      <img src={item.image} alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover shrink-0 bg-sand-100"
                        onError={e => { e.target.style.display = 'none'; }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-forest-700 leading-tight">{tr(item.name)}</p>
                        <p className="text-xs text-warm-brown/50">{item.weight} × {item.qty}</p>
                      </div>
                      <p className="text-sm font-semibold text-terra-500 shrink-0">₹{(item.price * item.qty).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-sand-100 pt-4 space-y-2 text-sm text-warm-brown/70">
                  <div className="flex justify-between">
                    <span>{t('checkout.subtotal')}</span><span className="font-medium">₹{total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('checkout.shipping')}</span>
                    <span className={shipping === 0 && shippingMode !== 'discuss' ? 'text-forest-600 font-medium' : shippingMode === 'discuss' ? 'text-amber-600 font-medium' : 'font-medium'}>
                      {shippingMode === 'discuss' ? t('checkout.shippingDiscuss') : shipping === 0 ? t('checkout.shippingFree') : `₹${shipping}`}
                    </span>
                  </div>
                  <div className="border-t border-sand-100 pt-3 flex justify-between font-semibold text-forest-700">
                    <span className="font-serif text-lg">{t('checkout.total')}</span>
                    <span className="font-serif text-lg">₹{grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full mt-6 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : (
                    paymentMethod === 'COD'
                      ? <Truck size={15} />
                      : <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                  )}
                  {submitting ? t('checkout.placing') : paymentMethod === 'COD' ? t('checkout.placeCod') : t('checkout.confirmUpi')}
                </button>
                <p className="text-xs text-center text-warm-brown/40 mt-3">
                  {paymentMethod === 'COD'
                    ? t('checkout.noteCod')
                    : t('checkout.noteUpi')}
                </p>
                <Link to="/cart" className="block text-center text-sm text-warm-brown/50 hover:text-terra-500 transition-colors mt-3">
                  {t('checkout.backToCart')}
                </Link>
              </div>
            </AnimatedSection>

          </div>
        </form>
      </div>
    </div>
  );
}
