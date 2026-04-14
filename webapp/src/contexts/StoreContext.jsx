import { createContext, useContext, useState } from 'react';

const defaultData = {
  settings: {
    whatsappNumber: '919999999999',
    phone: '+91 99999 99999',
    email: 'hello@brfreshextracts.in',
    upiId: 'brfreshextracts@upi',
    address: 'New Delhi, India',
    fssai: '10019012000123',
    hours: 'Mon – Sat: 10am – 7pm',
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
    twitter: 'https://twitter.com',
  },
  hero: {
    title: 'Pure from Nature,\nCrafted for You',
    subtitle: 'Discover the finest organic spices, teas, ghee & oils sourced directly from certified Indian farms — unprocessed, uncompromised.',
    ctaText: 'Shop Now',
    backgroundImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1920&q=80',
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
};

const StoreContext = createContext(null);

function load() {
  try {
    const s = localStorage.getItem('so_store');
    if (!s) return defaultData;
    const stored = JSON.parse(s);
    // Deep-merge so new top-level keys (e.g. settings) and new sub-keys are always present
    return {
      ...defaultData,
      ...stored,
      settings: { ...defaultData.settings, ...(stored.settings || {}) },
    };
  } catch { return defaultData; }
}

export function StoreProvider({ children }) {
  const [store, setStore] = useState(load);

  const update = (updater) => {
    setStore(prev => {
      const next = updater(prev);
      localStorage.setItem('so_store', JSON.stringify(next));
      return next;
    });
  };

  // Hero
  const updateHero = (patch) => update(p => ({ ...p, hero: { ...p.hero, ...patch } }));

  // Settings
  const updateSettings = (patch) => update(p => ({ ...p, settings: { ...p.settings, ...patch } }));

  // Categories
  const addCategory = (c)    => update(p => ({ ...p, categories: [...p.categories, { ...c, id: `cat_${Date.now()}` }] }));
  const updateCategory = (id, patch) => update(p => ({ ...p, categories: p.categories.map(c => c.id === id ? { ...c, ...patch } : c) }));
  const deleteCategory = (id) => update(p => ({ ...p, categories: p.categories.filter(c => c.id !== id) }));

  // Products
  const addProduct    = (pr) => update(p => ({ ...p, products: [...p.products, { ...pr, id: `p_${Date.now()}` }] }));
  const updateProduct = (id, patch) => update(p => ({ ...p, products: p.products.map(pr => pr.id === id ? { ...pr, ...patch } : pr) }));
  const deleteProduct = (id) => update(p => ({ ...p, products: p.products.filter(pr => pr.id !== id) }));

  // Testimonials
  const addTestimonial    = (t)  => update(p => ({ ...p, testimonials: [...p.testimonials, { ...t, id: `t_${Date.now()}` }] }));
  const updateTestimonial = (id, patch) => update(p => ({ ...p, testimonials: p.testimonials.map(t => t.id === id ? { ...t, ...patch } : t) }));
  const deleteTestimonial = (id) => update(p => ({ ...p, testimonials: p.testimonials.filter(t => t.id !== id) }));

  // WhyUs
  const addWhyUs    = (w)  => update(p => ({ ...p, whyUs: [...p.whyUs, { ...w, id: `w_${Date.now()}` }] }));
  const updateWhyUs = (id, patch) => update(p => ({ ...p, whyUs: p.whyUs.map(w => w.id === id ? { ...w, ...patch } : w) }));
  const deleteWhyUs = (id) => update(p => ({ ...p, whyUs: p.whyUs.filter(w => w.id !== id) }));

  const resetStore  = () => { localStorage.removeItem('so_store'); setStore(defaultData); };

  return (
    <StoreContext.Provider value={{
      store,
      updateHero,
      updateSettings,
      addCategory, updateCategory, deleteCategory,
      addProduct,  updateProduct,  deleteProduct,
      addTestimonial, updateTestimonial, deleteTestimonial,
      addWhyUs, updateWhyUs, deleteWhyUs,
      resetStore,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
