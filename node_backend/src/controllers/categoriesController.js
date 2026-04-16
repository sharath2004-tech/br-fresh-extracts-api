import Category from '../models/Category.js';

function normalizeCategory(c) {
  return {
    id: c.id,
    name: c.name,
    description: c.description || '',
    image: c.image || '',
    icon: c.icon || '🌿',
  };
}

export async function listCategories(req, res, next) {
  try {
    const cats = await Category.find().sort({ name: 1 });
    res.json(cats.map(normalizeCategory));
  } catch (err) {
    next(err);
  }
}

export async function listAdminCategories(req, res, next) {
  return listCategories(req, res, next);
}

export async function createCategory(req, res, next) {
  try {
    const payload = req.body || {};
    const cat = await Category.create({
      name: payload.name,
      description: payload.description || '',
      image: payload.image || '',
      icon: payload.icon || '🌿',
    });
    res.status(201).json(normalizeCategory(cat));
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const payload = req.body || {};
    const cat = await Category.findByIdAndUpdate(req.params.id, {
      name: payload.name,
      description: payload.description,
      image: payload.image,
      icon: payload.icon,
    }, { new: true });
    if (!cat) return res.status(404).json({ error: 'Not found.' });
    res.json(normalizeCategory(cat));
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const cat = await Category.findByIdAndDelete(req.params.id);
    if (!cat) return res.status(404).json({ error: 'Not found.' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
