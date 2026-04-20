import mongoose from 'mongoose';

const StoreSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  hero: { type: mongoose.Schema.Types.Mixed, default: {} },
  settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  testimonials: { type: [mongoose.Schema.Types.Mixed], default: [] },
  whyUs: { type: [mongoose.Schema.Types.Mixed], default: [] },
  privacyPolicy: { type: String, default: '' },
  pageCopy: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

StoreSettingsSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('StoreSettings', StoreSettingsSchema);
