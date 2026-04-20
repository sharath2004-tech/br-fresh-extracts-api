import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema({
  label:     { type: String, default: 'Home' },
  name:      { type: String, default: '' },
  phone:     { type: String, default: '' },
  address:   { type: String, default: '' },
  city:      { type: String, default: '' },
  state:     { type: String, default: '' },
  pincode:   { type: String, default: '' },
  lat:       { type: Number, default: null },
  lng:       { type: Number, default: null },
  maps_link: { type: String, default: '' },
}, { _id: true });

const UserSchema = new mongoose.Schema({
  phone_number: { type: String, unique: true, required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, default: '' },
  password_hash: { type: String, default: '' },
  address: { type: String, default: '' },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  is_profile_complete: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
  is_staff: { type: Boolean, default: false },
  cart: { type: mongoose.Schema.Types.Mixed, default: [] },
  fcm_tokens: { type: [String], default: [] },
  addresses: { type: [AddressSchema], default: [] },
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
