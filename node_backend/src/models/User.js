import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  phone_number: { type: String, unique: true, required: true, index: true },
  name: { type: String, required: true },
  password_hash: { type: String, default: '' },
  address: { type: String, default: '' },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  is_profile_complete: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
  is_staff: { type: Boolean, default: false },
  cart: { type: mongoose.Schema.Types.Mixed, default: [] },
  fcm_tokens: { type: [String], default: [] },
}, { timestamps: true });

UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('User', UserSchema);
