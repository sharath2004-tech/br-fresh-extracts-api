import { ArrowLeft, Leaf, Loader2, Minus, Plus, ShoppingCart, Star, Truck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AnimatedSection from '../components/ui/AnimatedSection';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../contexts/StoreContext';

const API_URL = (() => { const u = import.meta.env.VITE_API_URL || '/api/'; return u.endsWith('/') ? u : u + '/'; })();

function StarRating({ value, onChange, size = 20 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => onChange && setHovered(n)}
          onMouseLeave={() => onChange && setHovered(0)}
          onClick={() => onChange && onChange(n)}
          className={`transition-colors ${onChange ? 'cursor-pointer' : 'cursor-default'}`}>
          <Star size={size} className={n <= (hovered || value) ? 'text-amber-400 fill-amber-400' : 'text-sand-300'} />
        </button>
      ))}
    </div>
  );
}

function ReviewsSection({ productId, user, getValidToken }) {
  const [data, setData] = useState({ reviews: [], avg_rating: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [canReview, setCanReview] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}products/${productId}/reviews/`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  };

  // Check if user has a delivered order containing this product
  useEffect(() => {
    if (!user || !productId) return;
    (async () => {
      try {
        const token = await getValidToken();
        if (!token) return;
        const res = await fetch(`${API_URL}orders/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const orders = await res.json();
        const hasDelivered = orders.some(
          o => o.status === 'Delivered' &&
               o.items?.some(i => i.product_id === productId)
        );
        setCanReview(hasDelivered);
      } catch { /* non-critical */ }
    })();
  }, [user, productId]);

  useEffect(() => { if (productId) fetchReviews(); }, [productId]);

  const handleSubmit = async (e) => {
    setError(''); setSubmitting(true);
    try {
      const token = getValidToken ? await getValidToken() : null;
      if (!token) return setError('Sign in to leave a review.');
      const res = await fetch(`${API_URL}products/${productId}/reviews/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating, comment }),
      });
      if (res.ok) { setSuccess(true); setRating(0); setComment(''); fetchReviews(); }
      else { const d = await res.json(); setError(d.error || 'Could not submit review.'); }
    } catch { setError('Network error. Please try again.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 pb-12">
      <AnimatedSection>
        <h2 className="font-serif text-2xl text-forest-700 mb-2">Customer Reviews</h2>
        {!loading && data.count > 0 && (
          <div className="flex items-center gap-3 mb-6">
            <StarRating value={Math.round(data.avg_rating)} size={18} />
            <span className="font-semibold text-forest-700 text-sm">{data.avg_rating} / 5</span>
            <span className="text-warm-brown/50 text-sm">({data.count} review{data.count !== 1 ? 's' : ''})</span>
          </div>
        )}

        {/* Write a review */}
        {user && canReview && !success && (
          <form onSubmit={handleSubmit} className="bg-white border border-sand-200 rounded-2xl p-5 mb-6 shadow-sm">
            <p className="font-medium text-forest-700 text-sm mb-3">Write a Review</p>
            <div className="flex items-center gap-3 mb-3">
              <StarRating value={rating} onChange={setRating} size={22} />
              {rating > 0 && <span className="text-xs text-warm-brown/60">{['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}</span>}
            </div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Share your experience with this product…"
              className="w-full text-sm border border-sand-300 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-terra-400 mb-3"
            />
            {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 bg-terra-500 hover:bg-terra-600 text-cream text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
              Submit Review
            </button>
          </form>
        )}
        {!user && (
          <p className="text-sm text-warm-brown/60 mb-6">
            <Link to="/login" className="text-terra-500 hover:underline font-medium">Sign in</Link> to leave a review.
          </p>
        )}
        {user && !canReview && !success && (
          <p className="text-sm text-warm-brown/50 mb-6">
            You can write a review after your order is delivered.
          </p>
        )}
        {success && (
          <div className="bg-forest-50 border border-forest-200 text-forest-700 text-sm px-4 py-3 rounded-xl mb-6">
            ✓ Review submitted — thank you!
          </div>
        )}

        {/* Reviews list */}
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="text-terra-400 animate-spin" size={24} /></div>
        ) : data.reviews.length === 0 ? (
          <p className="text-sm text-warm-brown/50 py-4">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-4">
            {data.reviews.map(r => (
              <div key={r.id} className="bg-white border border-sand-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-forest-700 text-sm">{r.user_name}</span>
                    <StarRating value={r.rating} size={13} />
                  </div>
                  <span className="text-xs text-warm-brown/40">{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                {r.comment && <p className="text-sm text-warm-brown/80 leading-relaxed">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </AnimatedSection>
    </div>
  );
}

function SuggestionCard({ product }) {
  const { items, addToCart, updateQty, cartKey } = useCart();
  const { tr, t } = useLanguage();
  const navigate = useNavigate();

  const variants = product.variants?.length ? product.variants : [{ size: product.weight, price: product.price }];
  const [selectedVariant, setSelectedVariant] = useState(variants[0]);
  const key = cartKey({ ...product, weight: selectedVariant.size });
  const cartItem = items.find(i => cartKey(i) === key);

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-sand-200 card-hover flex flex-col">
      <div className="relative overflow-hidden h-40 cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
        <img src={product.image} alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80'; }} />
        {product.featured && (
          <span className="absolute top-2 left-2 bg-terra-500 text-cream text-[10px] px-2 py-0.5 rounded-full font-medium">
            {t('shop.bestseller')}
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] text-terra-500 font-medium mb-0.5 tracking-wide uppercase">{tr(product.category)}</p>
        <h3
          className="font-serif text-base text-forest-700 mb-1 leading-tight cursor-pointer hover:text-terra-500 transition-colors"
          onClick={() => navigate(`/product/${product.id}`)}
        >{tr(product.name)}</h3>
        <div className="flex gap-1.5 mb-2">
          <select
            value={selectedVariant.size}
            onChange={e => setSelectedVariant(variants.find(v => v.size === e.target.value))}
            className="flex-1 text-xs border border-sand-300 rounded-lg px-2 py-1 bg-white text-warm-brown"
          >
            {variants.map(v => <option key={v.size} value={v.size}>{v.size}</option>)}
          </select>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <span className="font-serif text-lg text-terra-500 font-semibold">₹{selectedVariant.price}</span>
          {cartItem ? (
            <div className="flex items-center gap-1">
              <button onClick={() => updateQty(key, cartItem.qty - 1)}
                className="w-7 h-7 rounded-full bg-sand-100 hover:bg-sand-200 flex items-center justify-center text-warm-brown transition-colors">
                <Minus size={12} />
              </button>
              <span className="w-7 text-center text-sm font-semibold text-forest-700">{cartItem.qty}</span>
              <button onClick={() => updateQty(key, cartItem.qty + 1)}
                className="w-7 h-7 rounded-full bg-terra-500 hover:bg-terra-600 flex items-center justify-center text-cream transition-colors">
                <Plus size={12} />
              </button>
            </div>
          ) : (
            <button onClick={() => addToCart({ ...product, price: selectedVariant.price, weight: selectedVariant.size, qty: 1 })}
              className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-terra-500 hover:bg-terra-600 text-cream transition-all">
              <ShoppingCart size={11} /> {t('shop.addToCart')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const { store } = useStore();
  const { t, tr } = useLanguage();
  const { user, getValidToken } = useAuth();
  const { items, addToCart, updateQty, cartKey } = useCart();
  const navigate = useNavigate();

  const product = useMemo(() => store.products.find(p => p.id === id), [store.products, id]);

  const suggestions = useMemo(() => {
    if (!product) return [];
    // Same category first, then others, max 4
    const sameCat = store.products.filter(p => p.id !== id && p.category === product.category);
    const others  = store.products.filter(p => p.id !== id && p.category !== product.category);
    return [...sameCat, ...others].slice(0, 4);
  }, [store.products, id, product]);

  if (!product) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center pt-20">
        <div className="text-center p-8">
          <p className="font-serif text-2xl text-forest-700 mb-4">Product not found</p>
          <Link to="/shop" className="btn-primary">Back to Shop</Link>
        </div>
      </div>
    );
  }

  const variants = product.variants?.length ? product.variants : [{ size: product.weight, price: product.price }];
  const [selectedVariant, setSelectedVariant] = useState(variants[0]);

  const key = cartKey({ ...product, weight: selectedVariant.size });
  const cartItem = items.find(i => cartKey(i) === key);

  const highlights = [
    { icon: <Leaf size={16} className="text-forest-500" />, label: '100% Natural' },
    { icon: <Star size={16} className="text-terra-500" />, label: 'Lab Tested' },
    { icon: <Truck size={16} className="text-forest-500" />, label: 'Fast Delivery' },
  ];

  return (
    <div className="min-h-screen bg-cream pt-20">
      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-6 pt-6 pb-2">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-warm-brown/60 hover:text-terra-500 transition-colors">
          <ArrowLeft size={15} /> Back
        </button>
      </div>

      {/* Main product section */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Image */}
          <AnimatedSection direction="left">
            <div className="relative rounded-3xl overflow-hidden bg-ivory aspect-square shadow-md border border-sand-200">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80'; }}
              />
              {product.featured && (
                <span className="absolute top-4 left-4 bg-terra-500 text-cream text-xs px-3 py-1.5 rounded-full font-medium shadow-sm">
                  {t('shop.bestseller')}
                </span>
              )}
              {!product.in_stock && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-3xl">
                  <span className="bg-white text-warm-brown font-semibold px-6 py-2 rounded-full text-sm">Out of Stock</span>
                </div>
              )}
            </div>
          </AnimatedSection>

          {/* Details */}
          <AnimatedSection direction="right">
            <div className="flex flex-col h-full">
              {/* Category */}
              <Link to={`/shop?cat=${encodeURIComponent(product.category)}`}
                className="text-xs text-terra-500 font-semibold tracking-[0.2em] uppercase mb-2 hover:text-terra-600 transition-colors w-fit">
                {tr(product.category)}
              </Link>

              {/* Name */}
              <h1 className="font-serif text-3xl md:text-4xl text-forest-700 leading-tight mb-3">
                {tr(product.name)}
              </h1>

              {/* Description */}
              <p className="text-warm-brown/70 text-base leading-relaxed mb-6">
                {tr(product.description)}
              </p>

              {/* Highlights */}
              <div className="flex gap-4 mb-6 flex-wrap">
                {highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-ivory border border-sand-200 rounded-full px-3 py-1.5 text-xs font-medium text-warm-brown">
                    {h.icon} {h.label}
                  </div>
                ))}
              </div>

              {/* Variant selector */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-forest-700 mb-2">Select Size / Weight</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map(v => (
                    <button
                      key={v.size}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                        selectedVariant.size === v.size
                          ? 'bg-terra-500 text-cream border-terra-500 shadow-sm'
                          : 'bg-white text-warm-brown border-sand-300 hover:border-terra-400'
                      }`}
                    >
                      {v.size} — ₹{v.price}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <span className="font-serif text-4xl text-terra-500 font-semibold">₹{selectedVariant.price}</span>
                <span className="text-warm-brown/50 text-sm ml-2">per {selectedVariant.size}</span>
              </div>

              {/* Add to cart */}
              {product.in_stock ? (
                <div className="flex items-center gap-4">
                  {cartItem ? (
                    <div className="flex items-center gap-3 bg-white border border-sand-200 rounded-2xl px-5 py-3 shadow-sm">
                      <button onClick={() => updateQty(key, cartItem.qty - 1)}
                        className="w-9 h-9 rounded-full bg-sand-100 hover:bg-sand-200 flex items-center justify-center text-warm-brown transition-colors">
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center text-lg font-semibold text-forest-700">{cartItem.qty}</span>
                      <button onClick={() => updateQty(key, cartItem.qty + 1)}
                        className="w-9 h-9 rounded-full bg-terra-500 hover:bg-terra-600 flex items-center justify-center text-cream transition-colors">
                        <Plus size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart({ ...product, price: selectedVariant.price, weight: selectedVariant.size, qty: 1 })}
                      className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-terra-500 hover:bg-terra-600 text-cream font-semibold text-base transition-all shadow-sm hover:shadow-md"
                    >
                      <ShoppingCart size={18} /> Add to Cart
                    </button>
                  )}
                  <Link to="/cart"
                    className="px-8 py-3.5 rounded-2xl border border-forest-300 text-forest-700 font-semibold text-base hover:bg-forest-50 transition-all">
                    View Cart
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-red-500 font-medium bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  Currently out of stock — check back soon.
                </p>
              )}
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Reviews */}
      <ReviewsSection productId={id} user={user} getValidToken={getValidToken} />

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 py-12">
          <AnimatedSection>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl text-forest-700">You may also like</h2>
              <Link to="/shop" className="text-sm text-terra-500 hover:text-terra-600 font-medium transition-colors">
                View all →
              </Link>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {suggestions.map((p, i) => (
              <AnimatedSection key={p.id} delay={i * 60}>
                <SuggestionCard product={p} />
              </AnimatedSection>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
