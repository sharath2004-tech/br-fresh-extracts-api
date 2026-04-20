import { Save } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../contexts/StoreContext';

const Field = ({ label, id, hint, multiline, rows = 2, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-forest-700 mb-1.5">{label}</label>
    {multiline ? (
      <textarea
        id={id}
        rows={rows}
        className="w-full border border-sand-200 rounded-lg px-4 py-2.5 text-sm text-forest-800 bg-white focus:outline-none focus:ring-2 focus:ring-terra-300 focus:border-transparent placeholder-warm-brown/30 resize-none"
        {...props}
      />
    ) : (
      <input
        id={id}
        className="w-full border border-sand-200 rounded-lg px-4 py-2.5 text-sm text-forest-800 bg-white focus:outline-none focus:ring-2 focus:ring-terra-300 focus:border-transparent placeholder-warm-brown/30"
        {...props}
      />
    )}
    {hint && <p className="mt-1 text-xs text-warm-brown/50">{hint}</p>}
  </div>
);

const Section = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-xl border border-sand-200 p-6">
    <div className="pb-3 border-b border-sand-100 mb-5">
      <h2 className="font-serif text-lg text-forest-700">{title}</h2>
      {subtitle && <p className="text-xs text-warm-brown/50 mt-0.5">{subtitle}</p>}
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

export default function AdminPageContent() {
  const { store, updatePageCopy } = useStore();
  const [form, setForm] = useState({ ...store.pageCopy });
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const saveTimer = useRef(null);

  useEffect(() => { setForm({ ...store.pageCopy }); }, [store.pageCopy]);

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm(f => {
      const next = { ...f, [key]: value };
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await updatePageCopy(next);
          setSaved(true);
          setSaveError(null);
          setTimeout(() => setSaved(false), 2000);
        } catch (err) {
          setSaveError(err.message || 'Failed to save. Please try again.');
        }
      }, 600);
      return next;
    });
  };

  const handleSave = async () => {
    clearTimeout(saveTimer.current);
    setSaveError(null);
    try {
      await updatePageCopy(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(err.message || 'Failed to save. Please try again.');
    }

  const handleSave = async () => {
    clearTimeout(saveTimer.current);
    setSaveError(null);
    try {
      await updatePageCopy(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(err.message || 'Failed to save. Please try again.');
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-forest-800">Page Content</h1>
          <p className="text-sm text-warm-brown/60 mt-0.5">Edit every text label shown on the homepage sections.</p>
        </div>
        <but
      {saveError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          ⚠️ {saveError}
        </p>
      )}ton
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            saved
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-terra-500 hover:bg-terra-600 text-white'
          }`}
        >
          <Save size={15} />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
      {saveError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          ⚠️ {saveError}
        </p>
      )}

      {/* Categories Section */}
      <Section title="Categories Section" subtitle="The 'Our Collections' section on the homepage.">
        <Field
          label="Kicker (small label above title)"
          id="categoriesKicker"
          value={form.categoriesKicker || ''}
          onChange={set('categoriesKicker')}
          placeholder="What We Offer"
        />
        <Field
          label="Section Title"
          id="categoriesTitle"
          value={form.categoriesTitle || ''}
          onChange={set('categoriesTitle')}
          placeholder="Our Collections"
        />
        <Field
          label="Section Subtitle"
          id="categoriesSubtitle"
          multiline
          rows={2}
          value={form.categoriesSubtitle || ''}
          onChange={set('categoriesSubtitle')}
          placeholder="Every category, curated for purity and flavour from farms we personally trust."
        />
      </Section>

      {/* Featured Products Section */}
      <Section title="Featured Products Section" subtitle="The bestsellers row on the homepage.">
        <Field
          label="Kicker (small label above title)"
          id="featuredKicker"
          value={form.featuredKicker || ''}
          onChange={set('featuredKicker')}
          placeholder="Bestsellers"
        />
        <Field
          label="Section Title"
          id="featuredTitle"
          value={form.featuredTitle || ''}
          onChange={set('featuredTitle')}
          placeholder="Featured Products"
        />
      </Section>

      {/* Why Us Section */}
      <Section title="Why Choose Us Section" subtitle="The dark green section with feature points.">
        <Field
          label="Kicker (small label above title)"
          id="whyKicker"
          value={form.whyKicker || ''}
          onChange={set('whyKicker')}
          placeholder="Why BR Fresh?"
        />
        <Field
          label="Section Title"
          id="whyTitle"
          value={form.whyTitle || ''}
          onChange={set('whyTitle')}
          placeholder="Our Promise to You"
        />
      </Section>

      {/* Newsletter Section */}
      <Section title="Newsletter Section" subtitle="The email subscribe section near the bottom.">
        <Field
          label="Section Title"
          id="newsletterTitle"
          value={form.newsletterTitle || ''}
          onChange={set('newsletterTitle')}
          placeholder="Stay in the Loop"
        />
        <Field
          label="Subtitle / Description"
          id="newsletterSubtitle"
          multiline
          rows={3}
          value={form.newsletterSubtitle || ''}
          onChange={set('newsletterSubtitle')}
          placeholder="Join our community for seasonal recipes, farm stories, exclusive offers and new product launches."
        />
      </Section>

      {/* Footer */}
      <Section title="Footer" subtitle="Text shown in the footer brand description.">
        <Field
          label="Brand Tagline"
          id="footerTagline"
          multiline
          rows={3}
          value={form.footerTagline || ''}
          onChange={set('footerTagline')}
          placeholder="Pure, certified organic products sourced directly from Indian farms. No compromise on quality, no compromise on nature."
        />
      </Section>
    </div>
  );
}
