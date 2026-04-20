import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../contexts/StoreContext';

export default function AdminPrivacyPolicy() {
  const { store, updatePrivacyPolicy } = useStore();
  const [content, setContent] = useState(store.privacyPolicy || '');
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => { setContent(store.privacyPolicy || ''); }, [store.privacyPolicy]);

  const handleChange = (e) => {
    const val = e.target.value;
    setContent(val);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updatePrivacyPolicy(val);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  };

  const handleSave = () => {
    clearTimeout(saveTimer.current);
    updatePrivacyPolicy(content);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-forest-700">Privacy Policy</h1>
          <p className="text-sm text-warm-brown/60 mt-1">
            Shown at <span className="font-mono text-xs">/privacy-policy</span> — required for Play Store & Google.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-terra-500 hover:bg-terra-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {saved ? '✓ Saved' : 'Save'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-sand-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-forest-700">Policy Content</label>
          <a
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-terra-500 hover:underline"
          >
            Preview →
          </a>
        </div>
        <textarea
          value={content}
          onChange={handleChange}
          rows={30}
          className="w-full border border-sand-200 rounded-lg p-4 text-sm font-mono text-forest-800 bg-ivory focus:outline-none focus:ring-2 focus:ring-terra-300 focus:border-transparent resize-y"
          placeholder="Enter your privacy policy text here..."
        />
        <p className="mt-2 text-xs text-warm-brown/50">
          Changes auto-save after you stop typing. Plain text — use blank lines to separate sections.
        </p>
      </div>
    </div>
  );
}
