import StoreSettings from '../models/StoreSettings.js';

// GET /api/store-settings/ — public, returns all store-wide settings
export async function getStoreSettings(req, res) {
  try {
    let doc = await StoreSettings.findOne({ key: 'main' });
    if (!doc) {
      doc = await StoreSettings.create({ key: 'main' });
    }
    res.json(doc.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PUT /api/admin/store-settings/ — admin only, updates any fields
export async function updateStoreSettings(req, res) {
  try {
    const allowed = ['hero', 'settings', 'testimonials', 'whyUs', 'privacyPolicy', 'pageCopy'];
    const patch = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    const doc = await StoreSettings.findOneAndUpdate(
      { key: 'main' },
      { $set: patch },
      { new: true, upsert: true, runValidators: false }
    );
    res.json(doc.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
