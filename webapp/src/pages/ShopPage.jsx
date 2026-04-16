import { Minus, Plus, Search, ShoppingCart, SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AnimatedSection from '../components/ui/AnimatedSection';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../contexts/StoreContext';

function ProductCard({ product }) {
  const { items, addToCart, updateQty, cartKey } = useCart();
  const { t, tr } = useLanguage();

  const variants = (product.variants && product.variants.length) ? product.variants : [{ size: product.weight, price: product.price }];
  const [selectedVariant, setSelectedVariant] = useState(variants[0]);

  const key = cartKey({ ...product, weight: selectedVariant.size });
  const cartItem = items.find(i => cartKey(i) === key);
  const inCart = !!cartItem;

  const handleAdd = () => {
    addToCart({ ...product, price: selectedVariant.price, weight: selectedVariant.size, qty: 1 });
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-sand-200 card-hover flex flex-col">
      <div className="relative overflow-hidden h-52">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80'; }}
        />
        {product.featured && (
          <span className="absolute top-3 left-3 bg-terra-500 text-cream text-xs px-2.5 py-1 rounded-full font-medium">
            {t('shop.bestseller')}
          </span>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <p className="text-xs text-terra-500 font-medium mb-1 tracking-wide">{tr(product.category)}</p>
        <h3 className="font-serif text-lg text-forest-700 mb-1 leading-tight">{tr(product.name)}</h3>
        <p className="text-xs text-warm-brown/60 mb-3 line-clamp-2">{tr(product.description)}</p>

        {/* Variant selector */}
        <div className="flex gap-2 mb-3">
          <select
            value={selectedVariant.size}
            onChange={e => setSelectedVariant(variants.find(v => v.size === e.target.value))}
            className="flex-1 text-xs border border-sand-300 rounded-lg px-2 py-1.5 bg-white text-warm-brown focus:outline-none focus:border-terra-400"
          >
            {variants.map(v => (
              <option key={v.size} value={v.size}>{v.size}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className="font-serif text-xl text-terra-500 font-semibold">₹{selectedVariant.price}</span>
            <span className="text-warm-brown/50 text-xs ml-1">/ {selectedVariant.size}</span>
          </div>

          {inCart ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => updateQty(key, cartItem.qty - 1)}
                className="w-8 h-8 rounded-full bg-sand-100 hover:bg-sand-200 flex items-center justify-center text-warm-brown transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-sm font-semibold text-forest-700">{cartItem.qty}</span>
              <button
                onClick={() => updateQty(key, cartItem.qty + 1)}
                className="w-8 h-8 rounded-full bg-terra-500 hover:bg-terra-600 flex items-center justify-center text-cream transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full bg-terra-500 hover:bg-terra-600 text-cream transition-all duration-300"
            >
              <ShoppingCart size={13} />
              {t('shop.addToCart')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const { store } = useStore();
  const { t, tr } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const activeCategory = searchParams.get('cat') || 'All';

  const setCategory = (cat) => {
    if (cat === 'All') searchParams.delete('cat');
    else searchParams.set('cat', cat);
    setSearchParams(searchParams);
  };

  const categories = ['All', ...store.categories.map(c => c.name)];

  const filtered = useMemo(() => {
    return store.products.filter(p => {
      const matchCat = activeCategory === 'All' || p.category === activeCategory;
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [store.products, activeCategory, search]);

  return (
    <div className="pt-20 min-h-screen bg-cream">
      {/* Page header */}
      <div className="bg-ivory py-14 px-6 text-center border-b border-sand-200">
        <p className="text-terra-500 tracking-[0.25em] text-xs uppercase font-sans mb-2">{t('shop.kicker')}</p>
        <h1 className="font-serif text-4xl md:text-5xl text-forest-700">{t('shop.title')}</h1>
        <p className="text-warm-brown/60 mt-3 text-sm max-w-md mx-auto">{t('shop.subtitle')}</p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Search & Filters row */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-brown/40" size={16} />
            <input
              type="text"
              placeholder={t('shop.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10 text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-brown/40 hover:text-warm-brown">
                <X size={14} />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center gap-2 text-sm text-warm-brown border border-sand-300 px-4 py-2.5 rounded-lg">
            <SlidersHorizontal size={15} /> {t('shop.filters')}
          </button>
        </div>

        {/* Category tabs */}
        <div className={`flex flex-wrap gap-2 mb-10 ${!showFilters ? 'hidden md:flex' : 'flex'}`}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-terra-500 text-cream shadow-sm'
                  : 'bg-white text-warm-brown border border-sand-300 hover:border-terra-300 hover:text-terra-500'
              }`}
            >{cat === 'All' ? t('shop.all') : tr(cat)}</button>
          ))}
        </div>

        {/* Results info */}
        <p className="text-xs text-warm-brown/50 mb-6 font-sans">
          {t('shop.productsFound', { count: filtered.length, plural: filtered.length !== 1 ? 's' : '' })}
        </p>

        {/* Product grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((p, i) => (
              <AnimatedSection key={p.id} delay={i * 50}>
                <ProductCard product={p} />
              </AnimatedSection>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="font-serif text-2xl text-forest-600 mb-2">{t('shop.noProducts')}</p>
            <p className="text-warm-brown/50 text-sm">{t('shop.tryDifferent')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
