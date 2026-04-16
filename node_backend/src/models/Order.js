import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  product: { type: String, default: '' },
  quantity: { type: Number, required: true },
  price_at_time: { type: Number, required: true },
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'Pending' },
  total_amount: { type: Number, default: 0 },
  payment_mode: { type: String, default: 'COD' },
  items: { type: [OrderItemSchema], default: [] },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

OrderSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('Order', OrderSchema);
