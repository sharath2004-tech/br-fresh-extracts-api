import { Pencil, Plus, Save, Star, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import ImageUpload from '../../components/ui/ImageUpload';

const _raw = import.meta.env.VITE_API_URL || '/api/';
const API_URL = _raw.endsWith('/') ? _raw : _raw + '/';
const SECRET = import.meta.env.VITE_UPLOAD_SECRET || '';

function apiHeaders(json = true) {
  const h = {};
  if (SECRET) h['X-Upload-Secret'] = SECRET;
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

const empty = { name: '', category: '', price: '', weight: '', image: '', description: '', featured: false, variants: [{ size: '', price: '' }] };

export default function AdminProducts() {
  const [products, setProducts]   = useState([]);
  const [apiCategories, setApiCategories] = useState([]);
  const [form, setForm]           = useState(empty);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState('All');
  const [saving, setSaving] = useState(false);

  const fetchProducts = () =>
    fetch(`${API_URL}admin/products/`, { headers: apiHeaders(false) })
      .then(r => r.json()).then(setProducts).catch(() => {});

  const fetchCategories = () =>
    fetch(`${API_URL}categories/`)
      .then(r => r.json()).then(setApiCategories).catch(() => {});

  useEffect(() => { fetchProducts(); fetchCategories(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const setVariant = (i, k, v) => setForm(f => {
    const variants = f.variants.map((vr, idx) => idx === i ? { ...vr, [k]: v } : vr);
    return { ...f, variants };
  });
  const addVariant    = () => setForm(f => ({ ...f, variants: [...f.variants, { size: '', price: '' }] }));
  const removeVariant = (i) => setForm(f => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }));

  const openAdd  = () => { setForm(empty); setEditing(null); setShowForm(true); };
  const openEdit = (p) => {
    const variants = (p.variants && p.variants.length) ? p.variants.map(v => ({ size: v.size, price: String(v.price) })) : [{ size: p.weight, price: String(p.price) }];
    setForm({ name: p.name, category: p.category, price: String(p.price), weight: p.weight || '', image: p.image || '', description: p.description, featured: p.featured, variants });
    setEditing(p.id); setShowForm(true);
  };
  const cancel = () => { setShowForm(false); setEditing(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const variants = form.variants.filter(v => v.size && v.price).map(v => ({ size: v.size, price: Number(v.price) }));
      const firstVariant = variants[0] || { size: form.weight, price: Number(form.price) };
      const payload = { ...form, price: firstVariant.price, weight: firstVariant.size, variants };
      const url    = editing ? `${API_URL}admin/products/${editing}/` : `${API_URL}admin/products/`;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: apiHeaders(), body: JSON.stringify(payload) });
      if (res.ok) { fetchProducts(); cancel(); }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    await fetch(`${API_URL}admin/products/${id}/`, { method: 'DELETE', headers: apiHeaders(false) });
    fetchProducts();
  };

  const categories = ['All', ...apiCategories.map(c => c.name)];
  const filtered = filterCat === 'All' ? products : products.filter(p => p.category === filterCat);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-forest-700">Products</h1>
          <p className="text-sm text-warm-brown/60 mt-1">{store.products.length} products total</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm py-2">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="admin-card mb-6 border-terra-100 bg-terra-50/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg text-forest-700">{editing ? 'Edit Product' : 'New Product'}</h2>
            <button onClick={cancel} className="p-1.5 rounded-lg hover:bg-sand-200 text-warm-brown/50"><X size={16} /></button>
          </div>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Product Name</label>
              <input type="text" required className="input-field" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="label">Category</label>
              <select required className="input-field bg-white" value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Select category</option>
                {apiCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Variants (Size &amp; Price)</label>
                <button type="button" onClick={addVariant} className="text-xs text-terra-500 hover:text-terra-600 flex items-center gap-1 font-medium">
                  <Plus size={12} /> Add variant
                </button>
              </div>
              <div className="space-y-2">
                {form.variants.map((v, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input type="text" placeholder="Size (e.g. 500g, 1kg)" required className="input-field flex-1 text-sm py-2" value={v.size} onChange={e => setVariant(i, 'size', e.target.value)} />
                    <input type="number" placeholder="Price (₹)" required min="1" className="input-field w-32 text-sm py-2" value={v.price} onChange={e => setVariant(i, 'price', e.target.value)} />
                    {form.variants.length > 1 && (
                      <button type="button" onClick={() => removeVariant(i)} className="p-1.5 text-warm-brown/40 hover:text-red-400 transition-colors">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-warm-brown/40 mt-1">First variant is the default shown on product card.</p>
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea rows={2} className="input-field resize-none" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Product Image</label>
              <ImageUpload value={form.image} onChange={v => set('image', v)} previewClass="h-32 w-full object-cover" />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input type="checkbox" id="featured" checked={form.featured} onChange={e => set('featured', e.target.checked)} className="accent-terra-500 w-4 h-4" />
              <label htmlFor="featured" className="text-sm text-warm-brown cursor-pointer flex items-center gap-1">
                <Star size={13} className="text-terra-400" /> Mark as Bestseller / Featured
              </label>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 text-sm py-2.5">
                <Save size={14} /> {editing ? 'Update' : 'Add Product'}
              </button>
              <button type="button" onClick={cancel} className="btn-secondary text-sm py-2.5">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-5">
        {categories.map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filterCat === c ? 'bg-terra-500 text-cream' : 'bg-white border border-sand-300 text-warm-brown hover:border-terra-300'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="admin-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ivory border-b border-sand-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-warm-brown/60 uppercase tracking-wider">Product</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-warm-brown/60 uppercase tracking-wider hidden md:table-cell">Category</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-warm-brown/60 uppercase tracking-wider">Price</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-warm-brown/60 uppercase tracking-wider hidden md:table-cell">Featured</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-ivory/50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-sand-100"
                      onError={e => { e.target.style.display='none'; }} />
                    <div>
                      <p className="font-medium text-forest-700">{p.name}</p>
                      <p className="text-xs text-warm-brown/50">{p.weight}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-warm-brown/70 hidden md:table-cell">{p.category}</td>
                <td className="px-4 py-3.5 font-serif text-terra-500 font-semibold">₹{p.price}</td>
                <td className="px-4 py-3.5 hidden md:table-cell">
                  {p.featured && <span className="text-xs bg-terra-50 text-terra-600 border border-terra-100 px-2 py-0.5 rounded-full">⭐ Featured</span>}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-1.5 justify-end">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-forest-50 text-warm-brown/50 hover:text-forest-600 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-warm-brown/50 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-sm text-warm-brown/40">No products in this category.</div>
        )}
      </div>
    </div>
  );
}
