import { Camera, Loader2, MapPin, Navigation, ShoppingBag } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AnimatedSection from '../components/ui/AnimatedSection';
import { useCart } from '../contexts/CartContext';
import { useStore } from '../contexts/StoreContext';

const emptyForm = {
  name: '', phone: '', email: '',
  address: '', city: '', state: '', pincode: '',
};

export default function CheckoutPage() {
  const { items, total, clearCart, cartKey } = useCart();
  const { store } = useStore();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [location, setLocation] = useState(null); // { lat, lng, label }
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const [paymentFile, setPaymentFile] = useState(null);
  const [paymentPreview, setPaymentPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef();

  const shipping = total >= 499 ? 0 : 79;
  const grandTotal = total + shipping;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-fill address using GPS
  const fetchLocation = () => {
    if (!navigator.geolocation) { setLocError('Geolocation not supported by your browser.'); return; }
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
        setLocError('Could not get location. Please allow location access and try again.');
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!paymentFile) { alert('Please upload your payment screenshot to continue.'); return; }
    setSubmitting(true);

    const whatsapp = (store.settings?.whatsappNumber || '919999999999').replace(/\D/g, '');
    const mapsLink = location ? `https://maps.google.com/?q=${location.lat},${location.lng}` : '';

    const orderLines = items.map(item =>
      `• ${item.name} (${item.weight}) × ${item.qty} — ₹${(item.price * item.qty).toLocaleString()}`
    ).join('\n');

    const msg = [
      '🛒 *New Order — BR Fresh Extracts*',
      '',
      `*Name:* ${form.name}`,
      `*Phone:* ${form.phone}`,
      form.email ? `*Email:* ${form.email}` : null,
      '',
      '*Delivery Address:*',
      `${form.address}`,
      `${form.city}, ${form.state} — ${form.pincode}`,
      mapsLink ? `📍 Location: ${mapsLink}` : null,
      '',
      '*Order Details:*',
      orderLines,
      '',
      `*Subtotal:* ₹${total.toLocaleString()}`,
      `*Shipping:* ${shipping === 0 ? 'Free' : '₹' + shipping}`,
      `*Grand Total:* ₹${grandTotal.toLocaleString()}`,
      '',
      '✅ Payment screenshot attached by customer.',
    ].filter(l => l !== null).join('\n');

    const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    clearCart();
    navigate('/');
    setSubmitting(false);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center pt-20">
        <div className="text-center p-8 max-w-sm">
          <ShoppingBag className="text-sand-300 mx-auto mb-5" size={52} strokeWidth={1} />
          <h2 className="font-serif text-3xl text-forest-700 mb-3">Your cart is empty</h2>
          <Link to="/shop" className="btn-primary">Browse Products</Link>
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
            <h1 className="font-serif text-3xl md:text-4xl text-forest-700">Checkout</h1>
          </div>
        </AnimatedSection>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Left — Address + Location + Payment */}
            <div className="flex-1 space-y-6">

              {/* Contact */}
              <AnimatedSection>
                <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm">
                  <h2 className="font-serif text-xl text-forest-700 mb-5">Contact Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Full Name *</label>
                      <input required className="input-field" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Rahul Verma" />
                    </div>
                    <div>
                      <label className="label">Phone Number *</label>
                      <input required type="tel" pattern="[6-9][0-9]{9}" className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="9876543210" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Email (optional)</label>
                      <input type="email" className="input-field" value={form.email} onChange={e => set('email', e.target.value)} placeholder="rahul@email.com" />
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              {/* Delivery Address */}
              <AnimatedSection delay={60}>
                <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-serif text-xl text-forest-700">Delivery Address</h2>
                    <button
                      type="button"
                      onClick={fetchLocation}
                      disabled={locLoading}
                      className="flex items-center gap-1.5 text-xs font-medium text-forest-600 border border-forest-200 bg-forest-50 hover:bg-forest-100 px-3 py-1.5 rounded-full transition-all disabled:opacity-60"
                    >
                      {locLoading
                        ? <><Loader2 size={13} className="animate-spin" /> Detecting...</>
                        : <><Navigation size={13} /> Use My Location</>}
                    </button>
                  </div>
                  {locError && <p className="text-xs text-red-500 mb-3 bg-red-50 rounded-lg px-3 py-2">{locError}</p>}
                  {location && (
                    <div className="flex items-start gap-2 text-xs text-forest-600 bg-forest-50 border border-forest-100 rounded-xl px-3 py-2 mb-4">
                      <MapPin size={13} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">Location pinned</p>
                        <a href={`https://maps.google.com/?q=${location.lat},${location.lng}`} target="_blank" rel="noreferrer"
                          className="underline text-terra-500 break-all">View on Google Maps</a>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="label">Address Line *</label>
                      <input required className="input-field" value={form.address} onChange={e => set('address', e.target.value)} placeholder="House no, Street, Area" />
                    </div>
                    <div>
                      <label className="label">City *</label>
                      <input required className="input-field" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Bangalore" />
                    </div>
                    <div>
                      <label className="label">State *</label>
                      <input required className="input-field" value={form.state} onChange={e => set('state', e.target.value)} placeholder="Karnataka" />
                    </div>
                    <div>
                      <label className="label">Pincode *</label>
                      <input required pattern="[1-9][0-9]{5}" className="input-field" value={form.pincode} onChange={e => set('pincode', e.target.value)} placeholder="560001" />
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              {/* Payment Screenshot */}
              <AnimatedSection delay={120}>
                <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm">
                  <h2 className="font-serif text-xl text-forest-700 mb-2">Payment Screenshot</h2>
                  <p className="text-xs text-warm-brown/60 mb-5">
                    Pay to our UPI ID: <span className="font-medium text-forest-700">brfreshextracts@upi</span> &nbsp;|&nbsp; Amount: <span className="font-semibold text-terra-500">₹{grandTotal.toLocaleString()}</span>
                    <br />Then upload the screenshot below for confirmation.
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
                      <span className="text-sm font-medium">Upload Payment Screenshot</span>
                      <span className="text-xs">JPG, PNG accepted</span>
                    </button>
                  )}
                </div>
              </AnimatedSection>
            </div>

            {/* Right — Order Summary */}
            <AnimatedSection delay={80} className="lg:w-80 shrink-0">
              <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm sticky top-24">
                <h2 className="font-serif text-xl text-forest-700 mb-5">Order Summary</h2>
                <div className="space-y-3 mb-5">
                  {items.map(item => (
                    <div key={cartKey(item)} className="flex gap-3 items-start">
                      <img src={item.image} alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover shrink-0 bg-sand-100"
                        onError={e => { e.target.style.display = 'none'; }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-forest-700 leading-tight">{item.name}</p>
                        <p className="text-xs text-warm-brown/50">{item.weight} × {item.qty}</p>
                      </div>
                      <p className="text-sm font-semibold text-terra-500 shrink-0">₹{(item.price * item.qty).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-sand-100 pt-4 space-y-2 text-sm text-warm-brown/70">
                  <div className="flex justify-between">
                    <span>Subtotal</span><span className="font-medium">₹{total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? 'text-forest-600 font-medium' : 'font-medium'}>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                  </div>
                  <div className="border-t border-sand-100 pt-3 flex justify-between font-semibold text-forest-700">
                    <span className="font-serif text-lg">Total</span>
                    <span className="font-serif text-lg">₹{grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full mt-6 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : (
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                  )}
                  Confirm Order on WhatsApp
                </button>
                <p className="text-xs text-center text-warm-brown/40 mt-3">WhatsApp will open with your order details pre-filled.</p>
                <Link to="/cart" className="block text-center text-sm text-warm-brown/50 hover:text-terra-500 transition-colors mt-3">
                  ← Back to Cart
                </Link>
              </div>
            </AnimatedSection>

          </div>
        </form>
      </div>
    </div>
  );
}
