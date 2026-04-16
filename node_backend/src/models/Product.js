import mongoose from 'mongoose';

const VariantSchema = new mongoose.Schema({
  size: { type: String, required: true },
  price: { type: Number, required: true },
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: '' },
  price: { type: Number, required: true },
  image: { type: String, default: '' },
  in_stock: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  weight: { type: String, default: '' },
  variants: { type: [VariantSchema], default: [] },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

ProductSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('Product', ProductSchema);
