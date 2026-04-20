import { useStore } from '../contexts/StoreContext';

export default function PrivacyPolicyPage() {
  const { store } = useStore();
  const content = store.privacyPolicy || '';

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-serif text-3xl text-forest-700 mb-8">Privacy Policy</h1>
      <div className="bg-white rounded-xl border border-sand-200 p-8">
        <pre className="whitespace-pre-wrap font-sans text-sm text-warm-brown leading-relaxed">
          {content || 'Privacy policy not yet configured.'}
        </pre>
      </div>
    </div>
  );
}
