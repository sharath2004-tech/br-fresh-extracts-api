import Category from '../models/Category.js';
import Product from '../models/Product.js';

function normalizeProduct(p) {
  return {
    id: p.id,
    name: p.name,
    description: p.description || '',
    category: p.category || '',
    price: Number(p.price),
    image: p.image || '',
    in_stock: !!p.in_stock,
    featured: !!p.featured,
    weight: p.weight || '',
    variants: Array.isArray(p.variants) && p.variants.length
      ? p.variants.map(v => ({ size: v.size, price: Number(v.price) }))
      : [{ size: p.weight || '', price: Number(p.price) }],
  };
}

export async function listPublicProducts(req, res, next) {
  try {
    const products = await Product.find({ in_stock: true }).sort({ created_at: -1 });
    res.json(products.map(normalizeProduct));
  } catch (err) {
    next(err);
  }
}

export async function listAdminProducts(req, res, next) {
  try {
    const products = await Product.find().sort({ created_at: -1 });
    res.json(products.map(normalizeProduct));
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req, res, next) {
  try {
    const payload = req.body || {};
    const variants = Array.isArray(payload.variants)
      ? payload.variants.filter(v => v && v.size && v.price)
      : [];

    const firstVariant = variants[0] || { size: payload.weight || '', price: Number(payload.price || 0) };

    const product = await Product.create({
      name: payload.name,
      description: payload.description || '',
      category: payload.category || '',
      price: Number(firstVariant.price || 0),
      image: payload.image || '',
      in_stock: payload.in_stock !== undefined ? !!payload.in_stock : true,
      featured: !!payload.featured,
      weight: firstVariant.size || payload.weight || '',
      variants: variants.length ? variants.map(v => ({ size: v.size, price: Number(v.price) })) : [],
    });

    if (payload.category) {
      await Category.updateOne(
        { name: payload.category },
        { $setOnInsert: { name: payload.category } },
        { upsert: true }
      );
    }

    res.status(201).json(normalizeProduct(product));
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const payload = req.body || {};
    const variants = Array.isArray(payload.variants)
      ? payload.variants.filter(v => v && v.size && v.price)
      : null;

    const update = {
      name: payload.name,
      description: payload.description,
      category: payload.category,
      image: payload.image,
      in_stock: payload.in_stock,
      featured: payload.featured,
      weight: payload.weight,
    };

    if (variants) {
      update.variants = variants.map(v => ({ size: v.size, price: Number(v.price) }));
      if (variants[0]) {
        update.price = Number(variants[0].price);
        update.weight = variants[0].size;
      }
    } else if (payload.price !== undefined) {
      update.price = Number(payload.price);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!product) return res.status(404).json({ error: 'Not found.' });

    if (payload.category) {
      await Category.updateOne(
        { name: payload.category },
        { $setOnInsert: { name: payload.category } },
        { upsert: true }
      );
    }

    res.json(normalizeProduct(product));
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found.' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
