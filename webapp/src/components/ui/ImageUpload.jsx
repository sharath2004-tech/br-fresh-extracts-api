import { Link, Loader2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const useCloudinary = !!(CLOUD_NAME && UPLOAD_PRESET);

/**
 * Reusable image input: paste a URL  OR  upload from device.
 * If VITE_CLOUDINARY_CLOUD_NAME + VITE_CLOUDINARY_UPLOAD_PRESET are set,
 * uploads to Cloudinary and stores the CDN URL.
 * Otherwise falls back to compressed base64.
 */
export default function ImageUpload({ value, onChange, previewClass = 'h-32 w-full object-cover' }) {
  const [tab, setTab] = useState('url');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const uploadToCloudinary = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: fd,
    });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.secure_url;
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
      const src = useCloudinary
        ? await uploadToCloudinary(file)
        : await compressToBase64(file);
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
          <Upload size={12} /> Upload {useCloudinary && <span className="ml-1 text-emerald-400">● CDN</span>}
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
                  <p className="text-xs text-warm-brown/30">{useCloudinary ? 'Uploads to Cloudinary CDN' : 'JPG, PNG, WEBP — stored as base64'}</p>
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
