import { Building2, Clock, Facebook, Globe, Instagram, Mail, MessageCircle, Phone, Save, Twitter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useStore } from '../../contexts/StoreContext';

const Field = ({ label, id, icon: Icon, hint, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-forest-700 mb-1.5">{label}</label>
    <div className="relative">
      {Icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-brown/40">
          <Icon size={15} />
        </span>
      )}
      <input
        id={id}
        className={`w-full border border-sand-200 rounded-lg py-2.5 text-sm text-forest-800 bg-white focus:outline-none focus:ring-2 focus:ring-terra-300 focus:border-transparent placeholder-warm-brown/30 ${Icon ? 'pl-9 pr-4' : 'px-4'}`}
        {...props}
      />
    </div>
    {hint && <p className="mt-1 text-xs text-warm-brown/50">{hint}</p>}
  </div>
);

const Section = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-sand-200 p-6">
    <h2 className="font-serif text-lg text-forest-700 mb-5 pb-3 border-b border-sand-100">{title}</h2>
    <div className="space-y-4">{children}</div>
  </div>
);

export default function AdminSettings() {
  const { store, updateSettings } = useStore();
  const [form, setForm] = useState({ ...store.settings });
  const [saved, setSaved] = useState(false);

  // Keep form in sync with store (e.g. after page reload or external update)
  useEffect(() => { setForm({ ...store.settings }); }, [store.settings]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = () => {
    updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-forest-800">Company Settings</h1>
          <p className="text-sm text-warm-brown/60 mt-0.5">Manage contact details, social links, and business info shown across the site.</p>
        </div>
        <button
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

      {/* Contact */}
      <Section title="Contact Information">
        <Field
          label="WhatsApp Number"
          id="whatsappNumber"
          icon={MessageCircle}
          value={form.whatsappNumber}
          onChange={set('whatsappNumber')}
          placeholder="919999999999"
          hint="Include country code without + (e.g. 919876543210). Used in WhatsApp order messages."
        />
        <Field
          label="Display Phone Number"
          id="phone"
          icon={Phone}
          value={form.phone}
          onChange={set('phone')}
          placeholder="+91 99999 99999"
          hint="Shown in the footer and contact sections."
        />
        <Field
          label="Email Address"
          id="email"
          icon={Mail}
          value={form.email}
          onChange={set('email')}
          placeholder="hello@brfreshextracts.in"
          type="email"
        />
      </Section>

      {/* Business */}
      <Section title="Business Details">
        <Field
          label="UPI ID"
          id="upiId"
          icon={Globe}
          value={form.upiId}
          onChange={set('upiId')}
          placeholder="brfreshextracts@upi"
          hint="Shown on checkout page for payment."
        />
        <Field
          label="Address"
          id="address"
          icon={Building2}
          value={form.address}
          onChange={set('address')}
          placeholder="New Delhi, India"
        />
        <Field
          label="FSSAI License Number"
          id="fssai"
          value={form.fssai}
          onChange={set('fssai')}
          placeholder="10019012000123"
        />
        <Field
          label="Business Hours"
          id="hours"
          icon={Clock}
          value={form.hours}
          onChange={set('hours')}
          placeholder="Mon – Sat: 10am – 7pm"
        />
      </Section>

      {/* Social */}
      <Section title="Social Media Links">
        <Field
          label="Instagram"
          id="instagram"
          icon={Instagram}
          value={form.instagram}
          onChange={set('instagram')}
          placeholder="https://instagram.com/yourhandle"
          type="url"
        />
        <Field
          label="Facebook"
          id="facebook"
          icon={Facebook}
          value={form.facebook}
          onChange={set('facebook')}
          placeholder="https://facebook.com/yourpage"
          type="url"
        />
        <Field
          label="Twitter / X"
          id="twitter"
          icon={Twitter}
          value={form.twitter}
          onChange={set('twitter')}
          placeholder="https://twitter.com/yourhandle"
          type="url"
        />
      </Section>

      {/* Save again at bottom */}
      <div className="flex justify-end pb-6">
        <button
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
    </div>
  );
}
