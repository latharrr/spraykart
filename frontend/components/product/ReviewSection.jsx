'use client';
import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { submitReview } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

function RatingPicker({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="Your rating" style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} className="h-chip tabular" aria-pressed={value >= n} style={{ minWidth: 44, justifyContent: 'center', padding: 0 }} onClick={() => onChange(n)}>
          {n}
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({ product, reviews = [] }) {
  const { user } = useAuthStore();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const count = Number(product.review_count) || reviews.length;
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : Number(product.avg_rating || 0);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) { toast.error('Choose a rating from 1 to 5'); return; }
    setBusy(true);
    try {
      await submitReview({ product_id: product.id, rating, comment });
      setSent(true);
    } catch (err) {
      toast.error(err?.error || "Your review didn't send. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="reviews" className="h-wrap h-section" aria-labelledby="reviews-title">
      <div className="rv">
        <div style={{ display: 'grid', gap: 20, alignContent: 'start' }}>
          <h2 id="reviews-title" className="t-display t-l">Reviews</h2>
          {count > 0 ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
              <span className="rv__score tabular">{avg.toFixed(1)}</span>
              <span className="t-small t-mute" style={{ paddingBottom: 8 }}>out of 5<br />{count} {count === 1 ? 'review' : 'reviews'}</span>
            </div>
          ) : (
            <p className="t-body t-mute">No reviews yet. If you own this bottle, yours would be the first.</p>
          )}
        </div>

        <div className="rv__list">
          {reviews.map((r) => (
            <article key={r.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <span className="t-label">{r.reviewer_name || r.user_name || 'Verified buyer'}</span>
                <span className="t-small t-mute-3 tabular">{r.rating} / 5 · {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              {r.comment && <p className="t-body" style={{ maxWidth: '68ch' }}>{r.comment}</p>}
            </article>
          ))}

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 32 }}>
            {sent ? (
              <p className="t-body">Thank you. Your review will appear once it&apos;s been checked.</p>
            ) : user ? (
              <form onSubmit={submit} style={{ display: 'grid', gap: 18, maxWidth: 560 }}>
                <p className="t-label">Write a review</p>
                <RatingPicker value={rating} onChange={setRating} />
                <label className="h-field">
                  <span>Your experience (optional)</span>
                  <textarea className="input" rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How it wears, how long it lasts, what people said" style={{ resize: 'vertical' }} />
                </label>
                <button type="submit" className="h-btn" disabled={busy} style={{ justifySelf: 'start' }}>{busy ? 'Sending' : 'Submit review'}</button>
              </form>
            ) : (
              <p className="t-body t-mute"><Link href="/login" className="h-textlink" style={{ color: 'var(--ink)' }}>Sign in</Link> to review this fragrance.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
