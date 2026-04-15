import { Pencil, Plus, Save, Trash2, X } from 'lucide-react';
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

const empty = { name: '', description: '', image: '', icon: '🌿' };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [form, setForm]             = useState(empty);
  const [editing, setEditing]       = useState(null); // DB integer id
  const [showForm, setShowForm]     = useState(false);
  const [saving, setSaving]         = useState(false);

  const fetchCategories = () => {
    setLoading(true);
    fetch(`${API_URL}categories/`)
      .then(r => r.json())
      .then(data => { setCategories(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openAdd  = () => { setForm(empty); setEditing(null); setShowForm(true); };
  const openEdit = (cat) => {
    setForm({ name: cat.name, description: cat.description || '', image: cat.image || '', icon: cat.icon || '🌿' });
    setEditing(cat.id);
    setShowForm(true);
  };
  const cancel = () => { setShowForm(false); setEditing(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url    = editing ? `${API_URL}admin/categories/${editing}/` : `${API_URL}admin/categories/`;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: apiHeaders(), body: JSON.stringify(form) });
      if (res.ok) { fetchCategories(); cancel(); }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    await fetch(`${API_URL}admin/categories/${id}/`, { method: 'DELETE', headers: apiHeaders(false) });
    fetchCategories();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-forest-700">Categories</h1>
          <p className="text-sm text-warm-brown/60 mt-1">{categories.length} categories</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm py-2">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="admin-card mb-6 border-terra-200 bg-terra-50/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg text-forest-700">{editing ? 'Edit Category' : 'New Category'}</h2>
            <button onClick={cancel} className="p-1.5 rounded-lg hover:bg-sand-200 text-warm-brown/50"><X size={16} /></button>
          </div>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              <input type="text" required className="input-field" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Spices" />
            </div>
            <div>
              <label className="label">Icon (emoji)</label>
              <input type="text" className="input-field" value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="🌶️" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <input type="text" className="input-field" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Short description" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Category Image</label>
              <ImageUpload value={form.image} onChange={v => set('image', v)} previewClass="h-32 w-full object-cover" />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 text-sm py-2.5">
                <Save size={14} /> {editing ? 'Update' : 'Add Category'}
              </button>
              <button type="button" onClick={cancel} className="btn-secondary text-sm py-2.5">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-10 text-warm-brown/40 text-sm">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="admin-card flex gap-4 items-center">
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-sand-100">
                {cat.image
                  ? <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }} />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">{cat.icon}</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-forest-700 text-sm">{cat.icon} {cat.name}</p>
                <p className="text-xs text-warm-brown/60 truncate mt-0.5">{cat.description}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => openEdit(cat)} className="p-2 rounded-lg hover:bg-forest-50 text-warm-brown/50 hover:text-forest-600 transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(cat.id, cat.name)} className="p-2 rounded-lg hover:bg-red-50 text-warm-brown/50 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-forest-700">Categories</h1>
          <p className="text-sm text-warm-brown/60 mt-1">{store.categories.length} categories</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm py-2">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="admin-card mb-6 border-terra-200 bg-terra-50/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg text-forest-700">{editing ? 'Edit Category' : 'New Category'}</h2>
            <button onClick={cancel} className="p-1.5 rounded-lg hover:bg-sand-200 text-warm-brown/50"><X size={16} /></button>
          </div>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              <input type="text" required className="input-field" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Spices" />
            </div>
            <div>
              <label className="label">Icon (emoji)</label>
              <input type="text" className="input-field" value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="🌶️" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <input type="text" className="input-field" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Short description" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Category Image</label>
              <ImageUpload value={form.image} onChange={v => set('image', v)} previewClass="h-32 w-full object-cover" />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary flex items-center gap-2 text-sm py-2.5">
                <Save size={14} /> {editing ? 'Update' : 'Add Category'}
              </button>
              <button type="button" onClick={cancel} className="btn-secondary text-sm py-2.5">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {store.categories.map(cat => (
          <div key={cat.id} className="admin-card flex gap-4 items-center">
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-sand-100">
              {cat.image
                ? <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }} />
                : <div className="w-full h-full flex items-center justify-center text-2xl">{cat.icon}</div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-forest-700 text-sm">{cat.icon} {cat.name}</p>
              <p className="text-xs text-warm-brown/60 truncate mt-0.5">{cat.description}</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button onClick={() => openEdit(cat)} className="p-2 rounded-lg hover:bg-forest-50 text-warm-brown/50 hover:text-forest-600 transition-colors">
                <Pencil size={14} />
              </button>
              <button onClick={() => handleDelete(cat.id, cat.name)} className="p-2 rounded-lg hover:bg-red-50 text-warm-brown/50 hover:text-red-500 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
);
