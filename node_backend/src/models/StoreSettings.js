import mongoose from 'mongoose';

const StoreSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  hero: {
    title: { type: String, default: 'Pure from Nature,\nCrafted for You' },
    subtitle: { type: String, default: 'Discover the finest organic spices, teas, ghee & oils sourced directly from certified Indian farms — unprocessed, uncompromised.' },
    ctaText: { type: String, default: 'Shop Now' },
    backgroundImage: { type: String, default: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1920&q=80' },
  },
  settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  testimonials: { type: [mongoose.Schema.Types.Mixed], default: [] },
  whyUs: { type: [mongoose.Schema.Types.Mixed], default: [] },
}, { timestamps: true });

StoreSettingsSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('StoreSettings', StoreSettingsSchema);
