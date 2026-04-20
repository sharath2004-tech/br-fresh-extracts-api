import { sendPushNotification } from '../config/firebase.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

function normalizeOrder(o) {
  return {
    id: o.id,
    status: o.status,
    created_at: o.created_at,
    total_amount: Number(o.total_amount || 0),
    shipping: Number(o.shipping || 0),
    payment_mode: o.payment_mode || 'COD',
    payment_proof_url: o.payment_proof_url || '',
    notes: o.notes || '',
    customer: {
      name:      o.customer?.name || '',
      phone:     o.customer?.phone || o.phone_number || '',
      email:     o.customer?.email || '',
      address:   o.customer?.address || '',
      city:      o.customer?.city || '',
      state:     o.customer?.state || '',
      pincode:   o.customer?.pincode || '',
      lat:       o.customer?.lat || null,
      lng:       o.customer?.lng || null,
      maps_link: o.customer?.maps_link || '',
    },
    items: (o.items || []).map(i => ({
      product_id: i.product_id ? String(i.product_id) : null,
      product: i.product || '',
      quantity: i.quantity,
      weight: i.weight || '',
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
    const { items = [], payment_mode, customer, shipping, payment_proof_url, notes } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items required' });
    }

    const userId = req.jwtUser?.user_id;
    let user = null;
    if (userId) {
      user = await User.findById(userId);
    }

    const phone_number = customer?.phone || user?.phone_number || '';

    const itemDocs = [];
    let total = 0;
    for (const item of items) {
      // Accept either product_id (from DB) or pre-computed name+price (from cart)
      if (item.product_id) {
        const product = await Product.findById(item.product_id);
        if (!product) continue;
        const price = Number(product.price || 0);
        const qty = Number(item.quantity || 1);
        total += price * qty;
        itemDocs.push({ product_id: product._id, product: product.name, quantity: qty, price_at_time: price, weight: item.weight || '' });
      } else {
        // Cart item with pre-computed values
        const qty = Number(item.quantity || item.qty || 1);
        const price = Number(item.price_at_time || item.price || 0);
        total += price * qty;
        itemDocs.push({ product: item.product || item.name || '', quantity: qty, price_at_time: price, weight: item.weight || '' });
      }
    }

    const computedTotal = Number(req.body?.total_amount) || total;

    const order = await Order.create({
      user_id: user?._id,
      phone_number,
      items: itemDocs,
      total_amount: computedTotal,
      shipping: Number(shipping || 0),
      payment_mode: payment_mode || 'COD',
      payment_proof_url: payment_proof_url || '',
      notes: notes || '',
      customer: customer || {},
    });

    // Notify customer that order was placed
    if (user?._id) {
      sendPushNotification(
        user._id,
        'Thank You for Your Order!',
        `We have received your order worth ₹${computedTotal}. Our team will review and confirm it shortly. We appreciate your trust in BR Fresh Extracts.`
      );
    }

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

// Customer cancels their own Pending order
export async function cancelOrder(req, res, next) {
  try {
    const userId = req.jwtUser?.user_id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    // Ensure this order belongs to the requesting user
    if (String(order.user_id) !== String(userId)) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    if (!['Pending', 'Confirmed'].includes(order.status)) {
      return res.status(400).json({ error: 'Orders can only be cancelled before they are packed.' });
    }

    order.status = 'Cancelled';
    await order.save();

    res.json(normalizeOrder(order));
  } catch (err) {
    next(err);
  }
}

export async function updateAdminOrder(req, res, next) {
  try {
    // Whitelist only the fields an admin is allowed to change
    const ALLOWED = ['status', 'notes', 'payment_mode', 'payment_proof_url', 'shipping', 'total_amount'];
    const update = {};
    for (const field of ALLOWED) {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    }
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ error: 'Not found.' });

    // Fire push notification if status changed
    if (update.status && order.user_id) {
      const statusMessages = {
        Confirmed: 'Your order has been confirmed. Thank you for your patience — we are preparing it with care.',
        Packed:    'Great news! Your order has been carefully packed and is ready for dispatch. It will be on its way very soon.',
        Shipped:   'Your order is on its way! Our delivery partner is heading to you. Thank you for choosing BR Fresh Extracts.',
        Delivered: 'Your order has been delivered. We hope you enjoy your products. We would love to hear your feedback!',
        Cancelled: 'We regret to inform you that your order has been cancelled. Please contact us if you have any questions — we are here to help.',
      };
      const body = statusMessages[update.status] || `Your order status has been updated to: ${update.status}`;

      // For Delivered orders, include the first product_id so the app can open the review page on tap
      const data = {};
      if (update.status === 'Delivered') {
        const firstProductId = order.items?.[0]?.product_id;
        if (firstProductId) data.product_id = String(firstProductId);
        data.action = 'review';
      }

      sendPushNotification(order.user_id, 'BR Fresh Extracts — Order Update', body, data);
    }

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

export async function listAdminCustomers(req, res, next) {
  try {
    const customers = await Order.aggregate([
      { $sort: { created_at: -1 } },
      {
        $group: {
          _id: '$phone_number',
          name:          { $first: '$customer.name' },
          phone:         { $first: '$customer.phone' },
          email:         { $first: '$customer.email' },
          address:       { $first: '$customer.address' },
          city:          { $first: '$customer.city' },
          state:         { $first: '$customer.state' },
          pincode:       { $first: '$customer.pincode' },
          totalOrders:   { $sum: 1 },
          totalSpent:    { $sum: '$total_amount' },
          lastOrderDate: { $max: '$created_at' },
          statuses:      { $push: '$status' },
        },
      },
      { $sort: { lastOrderDate: -1 } },
    ]);

    const result = customers.map(c => ({
      phone:         c._id || c.phone || '',
      name:          c.name || 'Unknown',
      email:         c.email || '',
      address:       [c.address, c.city, c.state, c.pincode].filter(Boolean).join(', '),
      totalOrders:   c.totalOrders,
      totalSpent:    Number(c.totalSpent || 0),
      lastOrderDate: c.lastOrderDate,
      statusBreakdown: (c.statuses || []).reduce((acc, s) => {
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {}),
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function listCustomerOrders(req, res, next) {
  try {
    const phone = decodeURIComponent(req.params.phone || '');
    if (!phone) return res.status(400).json({ error: 'Phone required' });

    // Match both +91XXXXXXXXXX and plain 10-digit formats
    const phoneVariants = [phone];
    if (phone.startsWith('+91')) phoneVariants.push(phone.replace('+91', ''));
    else phoneVariants.push(`+91${phone}`);

    const orders = await Order.find({ phone_number: { $in: phoneVariants } }).sort({ created_at: -1 });
    res.json(orders.map(normalizeOrder));
  } catch (err) {
    next(err);
  }
}
