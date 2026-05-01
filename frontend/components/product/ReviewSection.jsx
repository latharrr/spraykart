'use client';
import { useState } from 'react';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { submitReview } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import Spinner from '@/components/ui/Spinner';

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="w-11 h-11 inline-flex items-center justify-center transition"
          aria-label={`${star} star rating`}
        >
          <Star
            size={24}
            fill={(hover || value) >= star ? '#fbbf24' : 'none'}
            stroke={(hover || value) >= star ? '#fbbf24' : '#d1d5db'}
          />
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({ product, reviews: initialReviews = [] }) {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : parseFloat(product.avg_rating || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error('Please select a rating');
    setLoading(true);
    try {
      await submitReview({ product_id: product.id, rating, comment });
      toast.success('Review submitted — it will appear after approval');
      setSubmitted(true);
      setRating(0);
      setComment('');
    } catch (err) {
      toast.error(err?.error || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-16 border-t border-gray-100 pt-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Summary */}
        <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-2xl">
          <p className="text-6xl font-bold text-gray-900">{parseFloat(avgRating).toFixed(1)}</p>
          <div className="flex gap-0.5 mt-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={16}
                fill={s <= Math.round(avgRating) ? '#fbbf24' : 'none'}
                stroke={s <= Math.round(avgRating) ? '#fbbf24' : '#d1d5db'}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-1">{product.review_count || reviews.length} review{(product.review_count || reviews.length) !== 1 && 's'}</p>
        </div>

        {/* Review list + form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Write a review */}
          {user && !submitted && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Write a Review</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Your rating *</label>
                  <StarPicker value={rating} onChange={setRating} />
                </div>
                <textarea
                  className="input resize-none text-sm"
                  rows={3}
                  placeholder="Share your experience (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <button type="submit" disabled={loading} className="btn-primary text-sm min-h-[44px] py-2.5">
                  {loading ? <Spinner size="sm" /> : 'Submit Review'}
                </button>
              </form>
            </div>
          )}

          {submitted && (
            <div className="bg-green-50 text-green-800 rounded-xl p-4 text-sm font-medium">
              ✅ Review submitted! It will appear after moderation.
            </div>
          )}

          {!user && (
            <p className="text-sm text-gray-500">
              <a href="/login" className="text-black font-medium hover:underline">Sign in</a> to write a review.
            </p>
          )}

          {/* Reviews */}
          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{review.user_name}</p>
                      <div className="flex gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={12}
                            fill={s <= review.rating ? '#fbbf24' : 'none'}
                            stroke={s <= review.rating ? '#fbbf24' : '#d1d5db'}
                          />
                        ))}
                      </div>
                    </div>
                    <time className="text-xs text-gray-400 shrink-0">
                      {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </time>
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No reviews yet. Be the first to review this product!</p>
          )}
        </div>
      </div>
    </section>
  );
}
