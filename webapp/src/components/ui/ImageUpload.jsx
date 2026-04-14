import { Link, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

/**
 * Reusable image input: paste a URL  OR  upload from device (compressed to base64).
 * Props:
 *   value      – current image src (URL or base64)
 *   onChange   – called with new src string
 *   previewClass – Tailwind classes for the preview image (default: "h-32 w-full object-cover")
 */
export default function ImageUpload({ value, onChange, previewClass = 'h-32 w-full object-cover' }) {
  const [tab, setTab] = useState('url'); // 'url' | 'upload'
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const compressAndSet = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 900;
        let { width, height } = img;
        if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        onChange(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    compressAndSet(e.dataTransfer.files[0]);
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
          value={value.startsWith('data:') ? '' : value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://images.unsplash.com/..."
        />
      )}

      {/* File upload */}
      {tab === 'upload' && (
        <>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => compressAndSet(e.target.files[0])} />
          <div
            onClick={() => fileRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
              dragging ? 'border-terra-400 bg-terra-50' : 'border-sand-300 hover:border-terra-300 hover:bg-sand-50'
            }`}>
            <Upload size={22} className="text-warm-brown/40" strokeWidth={1.5} />
            <p className="text-sm text-warm-brown/60">Click or drag image here</p>
            <p className="text-xs text-warm-brown/30">JPG, PNG, WEBP — auto-compressed</p>
          </div>
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
