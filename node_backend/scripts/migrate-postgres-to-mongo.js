import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import Category from '../src/models/Category.js';
import Order from '../src/models/Order.js';
import Product from '../src/models/Product.js';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const sourcePgUrl = process.env.SOURCE_DATABASE_URL || process.env.PG_SOURCE_URL || process.env.DATABASE_URL;
const mongoUri = process.env.MONGODB_URI;

if (!sourcePgUrl) {
  console.error('Missing SOURCE_DATABASE_URL (or PG_SOURCE_URL/DATABASE_URL)');
  process.exit(1);
}
if (!mongoUri) {
  console.error('Missing MONGODB_URI');
  process.exit(1);
}

const reset = (process.env.RESET_MONGO || '').toLowerCase() === 'true';

const { Pool } = pg;
const pool = new Pool({ connectionString: sourcePgUrl });

function toNumber(v) {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

function parseJson(value) {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function main() {
  await mongoose.connect(mongoUri);

  if (reset) {
    await Promise.all([
      Category.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      User.deleteMany({}),
    ]);
    console.log('Cleared existing Mongo collections.');
  }

  const client = await pool.connect();
  try {
    const usersRes = await client.query(
      'SELECT id, phone_number, name, address, latitude, longitude, is_profile_complete, is_active, is_staff FROM accounts_customuser'
    );
    const categoriesRes = await client.query(
      'SELECT id, name, description, image, icon FROM store_category'
    );
    const productsRes = await client.query(
      'SELECT id, name, description, category_id, price, image, in_stock, featured, weight, variants, created_at FROM store_product'
    );
    const ordersRes = await client.query(
      'SELECT id, user_id, total_amount, status, payment_mode, created_at FROM store_order'
    );
    const itemsRes = await client.query(
      'SELECT id, order_id, product_id, quantity, price_at_time FROM store_orderitem'
    );

    const userMap = new Map();
    for (const row of usersRes.rows) {
      const user = await User.findOneAndUpdate(
        { phone_number: row.phone_number },
        {
          phone_number: row.phone_number,
          name: row.name || 'Customer',
          address: row.address || '',
          latitude: row.latitude !== null ? Number(row.latitude) : null,
          longitude: row.longitude !== null ? Number(row.longitude) : null,
          is_profile_complete: !!row.is_profile_complete,
          is_active: row.is_active !== false,
          is_staff: !!row.is_staff,
        },
        { upsert: true, new: true }
      );
      userMap.set(row.id, user._id);
    }

    const categoryMap = new Map();
    for (const row of categoriesRes.rows) {
      const cat = await Category.findOneAndUpdate(
        { name: row.name },
        {
          name: row.name,
          description: row.description || '',
          image: row.image || '',
          icon: row.icon || '🌿',
        },
        { upsert: true, new: true }
      );
      categoryMap.set(row.id, cat.name);
    }

    const productMap = new Map();
    for (const row of productsRes.rows) {
      const variants = parseJson(row.variants) || [];
      const normalizedVariants = variants
        .filter(v => v && v.size && v.price)
        .map(v => ({ size: v.size, price: toNumber(v.price) }));

      const firstVariant = normalizedVariants[0] || { size: row.weight || '', price: toNumber(row.price) };

      const doc = await Product.findOneAndUpdate(
        { name: row.name },
        {
          name: row.name,
          description: row.description || '',
          category: categoryMap.get(row.category_id) || '',
          price: toNumber(firstVariant.price),
          image: row.image || '',
          in_stock: row.in_stock !== false,
          featured: !!row.featured,
          weight: firstVariant.size || row.weight || '',
          variants: normalizedVariants,
          created_at: row.created_at || new Date(),
        },
        { upsert: true, new: true }
      );
      productMap.set(row.id, doc);
    }

    const itemsByOrder = new Map();
    for (const item of itemsRes.rows) {
      const prod = productMap.get(item.product_id);
      const entry = {
        product_id: prod?._id,
        product: prod?.name || '',
        quantity: toNumber(item.quantity) || 1,
        price_at_time: toNumber(item.price_at_time),
      };
      if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, []);
      itemsByOrder.get(item.order_id).push(entry);
    }

    const orderDocs = ordersRes.rows.map(row => ({
      user_id: userMap.get(row.user_id) || undefined,
      status: row.status || 'Pending',
      total_amount: toNumber(row.total_amount),
      payment_mode: row.payment_mode || 'COD',
      items: itemsByOrder.get(row.id) || [],
      created_at: row.created_at || new Date(),
    }));

    if (orderDocs.length) {
      await Order.insertMany(orderDocs, { ordered: false });
    }

    console.log('Migration complete.');
    console.log({
      users: usersRes.rowCount,
      categories: categoriesRes.rowCount,
      products: productsRes.rowCount,
      orders: ordersRes.rowCount,
      items: itemsRes.rowCount,
    });
  } finally {
    client.release();
    await pool.end();
    await mongoose.disconnect();
  }
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
