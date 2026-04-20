import mongoose from 'mongoose';
import Review from '../models/Review.js';

// GET /products/:id/reviews/ — public
export async function listReviews(req, res, next) {
  try {
    const productId = req.params.id;
    if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ error: 'Invalid product id.' });
    const reviews = await Review.find({ product_id: productId }).sort({ created_at: -1 });
    const avg = reviews.length
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;
    res.json({ reviews, avg_rating: avg, count: reviews.length });
  } catch (err) { next(err); }
}

// POST /products/:id/reviews/ — requires JWT
export async function createReview(req, res, next) {
  try {
    const productId = req.params.id;
    if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ error: 'Invalid product id.' });
    const { rating, comment } = req.body || {};
    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) return res.status(400).json({ error: 'Rating must be 1–5.' });

    const review = await Review.create({
      product_id: productId,
      user_id:    req.jwtUser.user_id,
      user_name:  req.jwtUser.name || 'Customer',
      rating:     ratingNum,
      comment:    String(comment || '').slice(0, 1000),
    });
    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'You have already reviewed this product.' });
    next(err);
  }
}

// DELETE /products/:id/reviews/:reviewId/ — admin only
export async function deleteReview(req, res, next) {
  try {
    await Review.findByIdAndDelete(req.params.reviewId);
    res.status(204).send();
  } catch (err) { next(err); }
}
