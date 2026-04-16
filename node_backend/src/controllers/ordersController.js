import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

function normalizeOrder(o) {
  return {
    id: o.id,
    status: o.status,
    created_at: o.created_at,
    total_amount: Number(o.total_amount || 0),
    payment_mode: o.payment_mode || 'COD',
    items: (o.items || []).map(i => ({
      product: i.product || '',
      quantity: i.quantity,
      price_at_time: Number(i.price_at_time || 0),
    })),
  };
}

async function findOrCreateUserByPhone(phone, name) {
  if (!phone) return null;
  let user = await User.findOne({ phone_number: phone });
  if (!user && phone.startsWith('+91')) {
    user = await User.findOne({ phone_number: phone.replace('+91', '') });
  }
  if (!user && !phone.startsWith('+91')) {
    user = await User.findOne({ phone_number: `+91${phone}` });
  }
  if (!user) {
    user = await User.create({ phone_number: phone, name: name || 'Customer', is_profile_complete: true });
  }
  return user;
}

export async function listUserOrders(req, res, next) {
  try {
    const userId = req.jwtUser?.user_id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const orders = await Order.find({ user_id: userId }).sort({ created_at: -1 });
    res.json(orders.map(normalizeOrder));
  } catch (err) {
    next(err);
  }
}

export async function createOrder(req, res, next) {
  try {
    const items = req.body?.items || [];
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items required' });
    }

    const userId = req.jwtUser?.user_id;
    let user = null;
    if (userId) {
      user = await User.findById(userId);
    }

    const itemDocs = [];
    let total = 0;
    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product) continue;
      const price = Number(product.price || 0);
      const qty = Number(item.quantity || 1);
      total += price * qty;
      itemDocs.push({
        product_id: product._id,
        product: product.name,
        quantity: qty,
        price_at_time: price,
      });
    }

    const order = await Order.create({
      user_id: user?._id,
      items: itemDocs,
      total_amount: total,
      payment_mode: req.body?.payment_mode || 'COD',
    });

    res.status(201).json(normalizeOrder(order));
  } catch (err) {
    next(err);
  }
}

export async function listAdminOrders(req, res, next) {
  try {
    const orders = await Order.find().sort({ created_at: -1 });
    res.json(orders.map(normalizeOrder));
  } catch (err) {
    next(err);
  }
}

export async function updateAdminOrder(req, res, next) {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ error: 'Not found.' });
    res.json(normalizeOrder(order));
  } catch (err) {
    next(err);
  }
}

export async function adminAnalytics(req, res, next) {
  try {
    const total_orders = await Order.countDocuments();
    const revenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$total_amount' } } }
    ]);
    const total_revenue = revenue[0]?.total || 0;
    const pending_orders = await Order.countDocuments({ status: 'Pending' });
    const completed_orders = await Order.countDocuments({ status: 'Delivered' });

    res.json({
      total_orders,
      total_revenue,
      pending_orders,
      completed_orders,
    });
  } catch (err) {
    next(err);
  }
}
