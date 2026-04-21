import { createContext, useContext, useEffect, useState } from 'react';

const UPLOAD_SECRET = import.meta.env.VITE_UPLOAD_SECRET || '';

const defaultData = {
  settings: {
    whatsappNumber: '916305352434',
    phone: '+91 6305352434',
    email: 'brfreshextracts@gmail.com',
    upiId: 'brfreshextracts@upi',
    address: 'New Delhi, India',
    fssai: '10019012000123',
    hours: 'Mon – Sat: 10am – 7pm',
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
    twitter: 'https://twitter.com',
    shippingMode: 'flat',
    shippingCharge: 79,
    freeShippingAbove: 499,
  },
  hero: {
    title: 'Pure from Nature,\nCrafted for You',
    subtitle: 'Discover the finest organic spices, teas, ghee & oils sourced directly from certified Indian farms — unprocessed, uncompromised.',
    ctaText: 'Shop Now',
    backgroundImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1920&q=80',
    tagline: '100% Organic · Farm to Table · Hyderabad',
    trustBadge1: 'FSSAI Certified',
    trustBadge2: 'Farm Fresh',
    trustBadge3: 'Pan India Delivery',
    viewAllText: 'View All Products',
  },
  categories: [
    { id: 'cat1', name: 'Spices', description: 'Handpicked aromatic spices from India\'s finest farms', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80', icon: '🌶️' },
    { id: 'cat2', name: 'Teas', description: 'Premium herbal blends & first-flush teas', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80', icon: '🍵' },
    { id: 'cat3', name: 'Ghee & Oils', description: 'Cold-pressed oils & traditionally churned A2 ghee', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80', icon: '🫙' },
    { id: 'cat4', name: 'Sweeteners', description: 'Natural jaggery, raw honey & unrefined sugars', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', icon: '🍯' },
  ],
  products: [
    { id: 'p1', name: 'Kashmiri Saffron', category: 'Spices', price: 899, weight: '2g', image: 'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=400&q=80', description: 'Pure A++ grade Kashmiri saffron — deeply aromatic with a rich golden hue.', featured: true, variants: [{ size: '1g', price: 499 }, { size: '2g', price: 899 }, { size: '5g', price: 2099 }] },
    { id: 'p2', name: 'Darjeeling Green Tea', category: 'Teas', price: 349, weight: '100g', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80', description: 'First flush green tea from the misty slopes of Darjeeling.', featured: true, variants: [{ size: '50g', price: 199 }, { size: '100g', price: 349 }, { size: '250g', price: 799 }] },
    { id: 'p3', name: 'A2 Cow Ghee', category: 'Ghee & Oils', price: 799, weight: '500ml', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80', description: 'Traditionally bilona-churned from grass-fed A2 cow milk.', featured: true, variants: [{ size: '250ml', price: 449 }, { size: '500ml', price: 799 }, { size: '1L', price: 1499 }] },
    { id: 'p4', name: 'Raw Forest Honey', category: 'Sweeteners', price: 449, weight: '300g', image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&q=80', description: 'Unheated, unfiltered wild honey from Himalayan forests.', featured: true, variants: [{ size: '150g', price: 249 }, { size: '300g', price: 449 }, { size: '500g', price: 699 }] },
    { id: 'p5', name: 'Organic Turmeric', category: 'Spices', price: 199, weight: '200g', image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400&q=80', description: 'High-curcumin Lakadong turmeric — lab-tested for purity.', featured: false, variants: [{ size: '100g', price: 119 }, { size: '200g', price: 199 }, { size: '500g', price: 449 }] },
    { id: 'p6', name: 'Ashwagandha Chai', category: 'Teas', price: 299, weight: '50g', image: 'https://images.unsplash.com/photo-1563822249366-3efb23b8e0c9?w=400&q=80', description: 'Adaptogenic blend with ashwagandha, ginger & cardamom.', featured: false, variants: [{ size: '50g', price: 299 }, { size: '100g', price: 549 }] },
    { id: 'p7', name: 'Cold-Press Coconut Oil', category: 'Ghee & Oils', price: 399, weight: '500ml', image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&q=80', description: 'Wood-pressed virgin coconut oil, unrefined & full of flavour.', featured: false, variants: [{ size: '250ml', price: 229 }, { size: '500ml', price: 399 }, { size: '1L', price: 749 }] },
    { id: 'p8', name: 'Organic Jaggery', category: 'Sweeteners', price: 249, weight: '500g', image: 'https://images.unsplash.com/photo-1604413191066-4dd20bedf486?w=400&q=80', description: 'Sun-dried sugarcane jaggery — no chemicals, no bleach.', featured: false, variants: [{ size: '250g', price: 139 }, { size: '500g', price: 249 }, { size: '1kg', price: 449 }] },
  ],
  testimonials: [
    { id: 't1', name: 'Priya Sharma', location: 'Mumbai', rating: 5, review: 'The saffron is absolutely divine! You can smell the difference from the very first pinch. Will never go back to regular grocery store saffron again.', avatar: 'PS' },
    { id: 't2', name: 'Rahul Verma', location: 'Bangalore', rating: 5, review: 'The A2 ghee tastes exactly like what my grandmother used to make. Unmatched quality and delivery was super fast. Highly recommended!', avatar: 'RV' },
    { id: 't3', name: 'Anjali Gupta', location: 'New Delhi', rating: 5, review: 'Switched to BR Fresh Extracts 3 months ago and the difference in energy and digestion is very noticeable. Love every single product I\'ve ordered!', avatar: 'AG' },
  ],
  whyUs: [
    { id: 'w1', title: 'No Artificial Flavours', description: '100% natural with zero additives, colours or preservatives in any of our products.', icon: 'leaf' },
    { id: 'w2', title: 'Farm Fresh', description: 'Sourced directly from certified organic farms across India — freshness guaranteed.', icon: 'sprout' },
    { id: 'w3', title: 'FSSAI Certified', description: 'All products are FSSAI licensed, lab-tested and certified for quality & safety.', icon: 'shield' },
    { id: 'w4', title: 'Pan India Delivery', description: 'Free shipping on orders above ₹499. Delivered to your doorstep across India.', icon: 'truck' },
  ],
  pageCopy: {
    categoriesKicker: 'What We Offer',
    categoriesTitle: 'Our Collections',
    categoriesSubtitle: 'Every category, curated for purity and flavour from farms we personally trust.',
    featuredKicker: 'Bestsellers',
    featuredTitle: 'Featured Products',
    whyKicker: 'Why BR Fresh?',
    whyTitle: 'Our Promise to You',
    newsletterTitle: 'Stay in the Loop',
    newsletterSubtitle: 'Join our community for seasonal recipes, farm stories, exclusive offers and new product launches.',
    footerTagline: 'Pure, certified organic products sourced directly from Indian farms. No compromise on quality, no compromise on nature.',
  },
  privacyPolicy: `Privacy Policy for BR Fresh Extracts
Last updated: April 20, 2026

1. Information We Collect
- Phone number — collected during OTP login to verify your identity
- Name & email — provided during account setup or checkout
- Order information — items purchased, delivery address, payment method
- Device token — collected by Firebase for push notifications

2. How We Use Your Information
- To process and deliver your orders
- To send order updates and promotional notifications (you can opt out)
- To verify your identity via OTP
- To respond to customer support requests

3. Data Sharing
We do not sell your personal data. We share data only with:
- MSG91 — for OTP verification
- Firebase (Google) — for push notifications
- Cloudinary — for product image storage
- Render — cloud hosting provider for our backend

4. Data Retention
Your account data is retained as long as your account is active. Order history is retained for 3 years for legal/tax purposes. You may request deletion by emailing us.

5. Your Rights
You may request access to, correction of, or deletion of your personal data by contacting us at brfreshextracts@gmail.com.

6. Security
We use HTTPS encryption for all data in transit and JWT tokens for authentication.

7. Children's Privacy
Our app is not directed at children under 13. We do not knowingly collect data from children.

8. Contact Us
BR Fresh Extracts
Email: brfreshextracts@gmail.com
Phone: +91 6305352434`,
};

const StoreContext = createContext(null);

const _rawApi = import.meta.env.VITE_API_URL || '/api/';
const API_URL = _rawApi.endsWith('/') ? _rawApi : _rawApi + '/';

async function saveStoreSettings(patch) {
  const headers = { 'Content-Type': 'application/json' };
  if (UPLOAD_SECRET) headers['X-Upload-Secret'] = UPLOAD_SECRET;
  // Also send admin JWT so the request is authenticated even if UPLOAD_SECRET is not set
  try {
    const stored = localStorage.getItem('so_user');
    if (stored) {
      const u = JSON.parse(stored);
      const token = u?.adminToken || u?.tokens?.access;
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
  } catch { /* ignore */ }
  const res = await fetch(`${API_URL}admin/store-settings/`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    throw new Error(`Server returned ${res.status}. Please sign out and sign back in to the admin panel, then try again.`);
  }
  return true;
}

function normalizeSettings(s) {
  const merged = { ...defaultData.settings, ...(s || {}) };
  if (merged.shippingCharge !== undefined) merged.shippingCharge = Number(merged.shippingCharge);
  if (merged.freeShippingAbove !== undefined) merged.freeShippingAbove = Number(merged.freeShippingAbove);
  return merged;
}

function load() {
  try {
    const s = localStorage.getItem('so_store');
    if (!s) return defaultData;
    const stored = JSON.parse(s);
    // Deep-merge so new top-level keys (e.g. settings) and new sub-keys are always present
    const merged = {
      ...defaultData,
      ...stored,
      hero: { ...defaultData.hero, ...(stored.hero || {}) },
      settings: { ...defaultData.settings, ...(stored.settings || {}) },
      pageCopy: { ...defaultData.pageCopy, ...(stored.pageCopy || {}) },
      // Always start with empty products/categories — the API fetch will populate them
      products: [],
      categories: [],
    };
    if (merged.settings.shippingCharge !== undefined) merged.settings.shippingCharge = Number(merged.settings.shippingCharge);
    if (merged.settings.freeShippingAbove !== undefined) merged.settings.freeShippingAbove = Number(merged.settings.freeShippingAbove);
    // Replace old placeholder values with real defaults
    if (merged.settings.whatsappNumber === '919999999999') merged.settings.whatsappNumber = defaultData.settings.whatsappNumber;
    if (merged.settings.phone === '+91 99999 99999') merged.settings.phone = defaultData.settings.phone;
    if (merged.settings.email === 'hello@brfreshextracts.in') merged.settings.email = defaultData.settings.email;
    return merged;
  } catch { return defaultData; }
}

export function StoreProvider({ children }) {
  const [store, setStore] = useState(load);

  // Fetch categories, products, and store settings from the live API
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}categories/`).then(r => r.ok ? r.json() : []),
      fetch(`${API_URL}products/`).then(r => r.ok ? r.json() : []),
      fetch(`${API_URL}store-settings/`).then(r => r.ok ? r.json() : null),
    ]).then(([cats, prods, storeSettings]) => {
      setStore(prev => ({
        ...prev,
        ...(storeSettings ? {
          hero: { ...defaultData.hero, ...storeSettings.hero },
          settings: normalizeSettings(storeSettings.settings),
          testimonials: storeSettings.testimonials?.length ? storeSettings.testimonials : prev.testimonials,
          whyUs: storeSettings.whyUs?.length ? storeSettings.whyUs : prev.whyUs,
          privacyPolicy: storeSettings.privacyPolicy || prev.privacyPolicy,
          pageCopy: storeSettings.pageCopy ? { ...defaultData.pageCopy, ...storeSettings.pageCopy } : prev.pageCopy,
        } : {}),
        categories: cats.length ? cats.map(c => ({
          id: String(c.id),
          name: c.name,
          description: c.description || '',
          image: c.image || '',
          icon: c.icon || '🌿',
        })) : prev.categories,
        products: prods.length ? prods.map(p => ({
          id: String(p.id),
          name: p.name,
          description: p.description || '',
          category: p.category || '',
          price: Number(p.price),
          weight: p.weight || '',
          image: p.image || '',
          in_stock: p.in_stock,
          featured: p.featured || false,
          variants: p.variants && p.variants.length ? p.variants : [{ size: p.weight || '', price: Number(p.price) }],
        })) : defaultData.products,
      }));
    }).catch(() => {/* keep defaults on network failure */});
  }, []);

  const update = (updater) => {
    setStore(prev => {
      const next = updater(prev);
      try {
        localStorage.setItem('so_store', JSON.stringify(next));
      } catch {
        // QuotaExceededError — in-memory state still updates; warn in console
        console.warn('localStorage quota exceeded — changes saved in memory only until refresh.');
      }
      return next; // always update in-memory state regardless of storage failure
    });
  };

  // Hero — persisted to backend; returns a promise (rejects on server error)
  const updateHero = (patch) => {
    const newHero = { ...store.hero, ...patch };
    setStore(prev => {
      const hero = { ...prev.hero, ...patch };
      const next = { ...prev, hero };
      try { localStorage.setItem('so_store', JSON.stringify(next)); } catch {}
      return next;
    });
    return saveStoreSettings({ hero: newHero });
  };

  // Settings — persisted to backend
  const updateSettings = (patch) => {
    setStore(prev => {
      const newSettings = { ...prev.settings, ...patch };
      const next = { ...prev, settings: newSettings };
      try { localStorage.setItem('so_store', JSON.stringify(next)); } catch {}
      saveStoreSettings({ settings: newSettings });
      return next;
    });
  };

  // Categories (managed via their own API routes)
  const addCategory    = (c)         => update(p => ({ ...p, categories: [...p.categories, { ...c, id: `cat_${Date.now()}` }] }));
  const updateCategory = (id, patch) => update(p => ({ ...p, categories: p.categories.map(c => c.id === id ? { ...c, ...patch } : c) }));
  const deleteCategory = (id)        => update(p => ({ ...p, categories: p.categories.filter(c => c.id !== id) }));

  // Products (managed via their own API routes)
  const addProduct    = (pr)         => update(p => ({ ...p, products: [...p.products, { ...pr, id: `p_${Date.now()}` }] }));
  const updateProduct = (id, patch)  => update(p => ({ ...p, products: p.products.map(pr => pr.id === id ? { ...pr, ...patch } : pr) }));
  const deleteProduct = (id)         => update(p => ({ ...p, products: p.products.filter(pr => pr.id !== id) }));

  // Testimonials — persisted to backend
  const addTestimonial = (t) => {
    setStore(prev => {
      const newTestimonials = [...prev.testimonials, { ...t, id: `t_${Date.now()}` }];
      const next = { ...prev, testimonials: newTestimonials };
      try { localStorage.setItem('so_store', JSON.stringify(next)); } catch {}
      saveStoreSettings({ testimonials: newTestimonials });
      return next;
    });
  };
  const updateTestimonial = (id, patch) => {
    setStore(prev => {
      const newTestimonials = prev.testimonials.map(t => t.id === id ? { ...t, ...patch } : t);
      const next = { ...prev, testimonials: newTestimonials };
      try { localStorage.setItem('so_store', JSON.stringify(next)); } catch {}
      saveStoreSettings({ testimonials: newTestimonials });
      return next;
    });
  };
  const deleteTestimonial = (id) => {
    setStore(prev => {
      const newTestimonials = prev.testimonials.filter(t => t.id !== id);
      const next = { ...prev, testimonials: newTestimonials };
      try { localStorage.setItem('so_store', JSON.stringify(next)); } catch {}
      saveStoreSettings({ testimonials: newTestimonials });
      return next;
    });
  };

  // WhyUs — persisted to backend
  const addWhyUs = (w) => {
    setStore(prev => {
      const newWhyUs = [...prev.whyUs, { ...w, id: `w_${Date.now()}` }];
      const next = { ...prev, whyUs: newWhyUs };
      try { localStorage.setItem('so_store', JSON.stringify(next)); } catch {}
      saveStoreSettings({ whyUs: newWhyUs });
      return next;
    });
  };
  const updateWhyUs = (id, patch) => {
    setStore(prev => {
      const newWhyUs = prev.whyUs.map(w => w.id === id ? { ...w, ...patch } : w);
      const next = { ...prev, whyUs: newWhyUs };
      try { localStorage.setItem('so_store', JSON.stringify(next)); } catch {}
      saveStoreSettings({ whyUs: newWhyUs });
      return next;
    });
  };
  const deleteWhyUs = (id) => {
    setStore(prev => {
      const newWhyUs = prev.whyUs.filter(w => w.id !== id);
      const next = { ...prev, whyUs: newWhyUs };
      try { localStorage.setItem('so_store', JSON.stringify(next)); } catch {}
      saveStoreSettings({ whyUs: newWhyUs });
      return next;
    });
  };

  // Page copy — persisted to backend; returns a promise (rejects on server error)
  const updatePageCopy = (patch) => {
    const newPageCopy = { ...store.pageCopy, ...patch };
    setStore(prev => {
      const pageCopy = { ...prev.pageCopy, ...patch };
      const next = { ...prev, pageCopy };
      try { localStorage.setItem('so_store', JSON.stringify(next)); } catch {}
      return next;
    });
    return saveStoreSettings({ pageCopy: newPageCopy });
  };

  const updatePrivacyPolicy = (content) => {
    setStore(prev => {
      const next = { ...prev, privacyPolicy: content };
      try { localStorage.setItem('so_store', JSON.stringify(next)); } catch {}
      saveStoreSettings({ privacyPolicy: content });
      return next;
    });
  };

  const resetStore = () => { localStorage.removeItem('so_store'); setStore(defaultData); };

  return (
    <StoreContext.Provider value={{
      store,
      updateHero,
      updateSettings,
      addCategory, updateCategory, deleteCategory,
      addProduct,  updateProduct,  deleteProduct,
      addTestimonial, updateTestimonial, deleteTestimonial,
      addWhyUs, updateWhyUs, deleteWhyUs,
      updatePageCopy,
      updatePrivacyPolicy,
      resetStore,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
