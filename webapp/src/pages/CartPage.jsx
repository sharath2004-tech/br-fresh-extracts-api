import { ArrowRight, Leaf, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AnimatedSection from '../components/ui/AnimatedSection';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function CartPage() {
  const { items, removeFromCart, updateQty, total, clearCart, cartKey } = useCart();
  const navigate = useNavigate();
  const { t, tr } = useLanguage();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center pt-20">
        <div className="text-center p-8 max-w-sm">
          <ShoppingBag className="text-sand-300 mx-auto mb-5" size={52} strokeWidth={1} />
          <h2 className="font-serif text-3xl text-forest-700 mb-3">{t('cart.emptyTitle')}</h2>
          <p className="text-warm-brown/60 text-sm mb-8">{t('cart.emptySubtitle')}</p>
          <Link to="/shop" className="btn-primary">{t('cart.emptyCta')}</Link>
        </div>
      </div>
    );
  }

  const shipping = total >= 499 ? 0 : 79;
  const grandTotal = total + shipping;

  return (
    <div className="min-h-screen bg-cream pt-20">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <AnimatedSection>
          <div className="flex items-center gap-3 mb-8">
            <Leaf className="text-terra-500" size={20} />
            <h1 className="font-serif text-3xl md:text-4xl text-forest-700">{t('cart.title')}</h1>
            <span className="text-sm text-warm-brown/50 font-sans">{t('cart.itemsLabel', { count: items.length, plural: items.length > 1 ? 's' : '' })}</span>
          </div>
        </AnimatedSection>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Items list */}
          <div className="flex-1 space-y-4">
            {items.map((item, i) => (
              <AnimatedSection key={cartKey(item)} delay={i * 60}>
                <div className="bg-white rounded-2xl p-5 border border-sand-200 flex gap-4 shadow-sm">
                  <img src={item.image} alt={item.name}
                    className="w-20 h-20 rounded-xl object-cover shrink-0"
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=100&q=80'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-terra-500 font-medium mb-0.5">{tr(item.category)}</p>
                        <h3 className="font-serif text-forest-700 text-lg leading-tight">{tr(item.name)}</h3>
                        <p className="text-warm-brown/50 text-xs mt-0.5">{item.weight}</p>
                      </div>
                      <button onClick={() => removeFromCart(cartKey(item))}
                        className="text-warm-brown/30 hover:text-red-400 transition-colors shrink-0 p-1">
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 bg-ivory rounded-full px-1 py-1">
                        <button onClick={() => updateQty(cartKey(item), item.qty - 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-sand-200 transition-colors">
                          <Minus size={13} />
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(cartKey(item), item.qty + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-sand-200 transition-colors">
                          <Plus size={13} />
                        </button>
                      </div>
                      <p className="font-serif text-lg text-terra-500 font-semibold">
                        ₹{(item.price * item.qty).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}

            <button onClick={() => { if (window.confirm(t('cart.clearConfirm'))) clearCart(); }}
              className="text-xs text-warm-brown/40 hover:text-red-400 transition-colors mt-2">
              {t('cart.clearButton')}
            </button>
          </div>

          {/* Summary */}
          <AnimatedSection className="lg:w-80 shrink-0">
            <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm sticky top-24">
              <h2 className="font-serif text-xl text-forest-700 mb-5">{t('cart.summary')}</h2>
              <div className="space-y-3 text-sm text-warm-brown/70">
                <div className="flex justify-between">
                  <span>{t('cart.subtotal')}</span>
                  <span className="font-medium">₹{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('cart.shipping')}</span>
                  <span className={shipping === 0 ? 'text-forest-600 font-medium' : 'font-medium'}>
                    {shipping === 0 ? t('cart.free') : `₹${shipping}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-terra-500 bg-terra-50 rounded-lg px-3 py-2">
                    {t('cart.freePrompt', { amount: (499 - total).toLocaleString() })}
                  </p>
                )}
                <div className="border-t border-sand-100 pt-3 flex justify-between font-semibold text-forest-700">
                  <span className="font-serif text-lg">{t('cart.total')}</span>
                  <span className="font-serif text-lg">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/checkout')}
                className="btn-primary w-full text-center mt-6 flex items-center justify-center gap-2">
                {t('cart.checkout')} <ArrowRight size={15} />
              </button>
              <Link to="/shop" className="block text-center text-sm text-warm-brown/50 hover:text-terra-500 transition-colors mt-4">
                {t('cart.continue')}
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
