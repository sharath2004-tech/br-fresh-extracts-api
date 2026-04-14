import { Leaf, ShieldCheck, Sprout, Truck } from 'lucide-react';
import AnimatedSection from '../components/ui/AnimatedSection';
import { useStore } from '../contexts/StoreContext';

const iconMap = { leaf: Leaf, sprout: Sprout, shield: ShieldCheck, truck: Truck };

export default function WhyChooseUs() {
  const { store } = useStore();

  return (
    <section className="py-20 md:py-28 bg-forest-700 grain-overlay relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-forest-600/40 pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-terra-500/10 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <AnimatedSection className="text-center mb-14">
          <p className="text-terra-300 tracking-[0.25em] text-xs uppercase font-sans mb-3">Why BR Fresh?</p>
          <h2 className="font-serif text-4xl md:text-5xl text-cream font-light leading-tight">
            Our Promise to You
          </h2>
          <div className="w-12 h-px bg-terra-400 mx-auto mt-4" />
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {store.whyUs.map((item, i) => {
            const Icon = iconMap[item.icon] || Leaf;
            return (
              <AnimatedSection key={item.id} delay={i * 100} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-terra-500/20 group-hover:bg-terra-500/30 transition-colors mb-5 mx-auto">
                  <Icon className="text-terra-300" size={28} strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-xl text-cream mb-2">{item.title}</h3>
                <p className="text-cream/60 text-sm leading-relaxed">{item.description}</p>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}
