import cloudinary from '../config/cloudinary.js';

export function uploadImage(req, res, next) {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'file required' });

    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'image' },
      (error, result) => {
        if (error) return next(error);
        return res.json({ url: result.secure_url });
      }
    );

    stream.end(file.buffer);
  } catch (err) {
    next(err);
  }
}
