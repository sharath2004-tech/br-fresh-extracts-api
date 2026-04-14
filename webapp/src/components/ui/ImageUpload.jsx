import { Link, Loader2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api/';
const UPLOAD_SECRET = import.meta.env.VITE_UPLOAD_SECRET || '';

/**
 * Reusable image input: paste a URL  OR  upload from device.
 * Uploads via Django backend (POST /api/upload/) which uses server-side Cloudinary credentials.
 * Falls back to base64 if the backend returns an error (e.g. Cloudinary not configured).
 */
export default function ImageUpload({ value, onChange, previewClass = 'h-32 w-full object-cover' }) {
  const [tab, setTab] = useState('url');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const uploadViaBackend = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const headers = {};
    if (UPLOAD_SECRET) headers['X-Upload-Secret'] = UPLOAD_SECRET;
    const res = await fetch(`${API_URL}upload/`, {
      method: 'POST',
      headers,
      body: fd,
    });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.url;
  };

  const compressToBase64 = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 600;
        let { width, height } = img;
        if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
        if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.65));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setError('');
    setUploading(true);
    try {
      let src;
      try {
        src = await uploadViaBackend(file);
      } catch {
        // Backend unavailable or not configured — fall back to base64 (local dev)
        src = await compressToBase64(file);
      }
      onChange(src);
    } catch (e) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="space-y-2">
      {/* Tab switcher */}
      <div className="flex rounded-lg border border-sand-200 overflow-hidden w-fit text-xs font-medium">
        <button type="button"
          onClick={() => setTab('url')}
          className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${tab === 'url' ? 'bg-terra-500 text-white' : 'text-warm-brown/60 hover:bg-sand-100'}`}>
          <Link size={12} /> URL
        </button>
        <button type="button"
          onClick={() => setTab('upload')}
          className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${tab === 'upload' ? 'bg-terra-500 text-white' : 'text-warm-brown/60 hover:bg-sand-100'}`}>
          <Upload size={12} /> Upload
        </button>
      </div>

      {/* URL input */}
      {tab === 'url' && (
        <input
          type="url"
          className="input-field"
          value={value && !value.startsWith('data:') ? value : ''}
          onChange={e => onChange(e.target.value)}
          placeholder="https://images.unsplash.com/..."
        />
      )}

      {/* File upload */}
      {tab === 'upload' && (
        <>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => handleFile(e.target.files[0])} />
          <div
            onClick={() => !uploading && fileRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 transition-colors ${
              uploading ? 'border-terra-300 bg-terra-50 cursor-wait'
              : dragging ? 'border-terra-400 bg-terra-50 cursor-copy'
              : 'border-sand-300 hover:border-terra-300 hover:bg-sand-50 cursor-pointer'
            }`}>
            {uploading
              ? <><Loader2 size={22} className="text-terra-500 animate-spin" /><p className="text-sm text-terra-600">Uploading…</p></>
              : <><Upload size={22} className="text-warm-brown/40" strokeWidth={1.5} />
                  <p className="text-sm text-warm-brown/60">Click or drag image here</p>
                  <p className="text-xs text-warm-brown/30">JPG, PNG, WEBP — uploaded to CDN</p>
                </>
            }
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </>
      )}

      {/* Preview */}
      {value && (
        <div className="relative rounded-xl overflow-hidden border border-sand-200">
          <img src={value} alt="preview" className={previewClass}
            onError={e => { e.target.style.display = 'none'; }} />
          <button type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
