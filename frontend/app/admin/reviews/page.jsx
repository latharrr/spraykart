'use client';
import { useState, useCallback } from 'react';
import { adminGetReviews, adminApproveReview, adminDeleteReview, adminCreateReview } from '@/lib/api';
import { useFetch } from '@/lib/hooks/useFetch';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import { Star, CheckCircle, Trash2, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Star Picker ─────────────────────────────────────────────────────────────
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
          className="w-9 h-9 inline-flex items-center justify-center"
        >
          <Star
            size={20}
            fill={(hover || value) >= star ? '#fbbf24' : 'none'}
            stroke={(hover || value) >= star ? '#fbbf24' : '#d1d5db'}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Add Review Modal ─────────────────────────────────────────────────────────
function AddReviewModal({ onClose, onSaved, products }) {
  const [form, setForm] = useState({ product_id: '', reviewer_name: '', rating: 0, comment: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product_id) return toast.error('Select a product');
    if (!form.reviewer_name.trim()) return toast.error('Reviewer name is required');
    if (form.rating === 0) return toast.error('Please select a rating');

    setSaving(true);
    try {
      await adminCreateReview(form);
      toast.success('Review added successfully!');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.error || 'Failed to add review');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Add Review</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Product selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
            <select
              className="input text-sm"
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              required
            >
              <option value="">Select a product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Reviewer name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer Name *</label>
            <input
              className="input text-sm"
              placeholder="e.g. Raj Sharma"
              value={form.reviewer_name}
              onChange={(e) => setForm({ ...form, reviewer_name: e.target.value })}
              required
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating *</label>
            <StarPicker value={form.rating} onChange={(r) => setForm({ ...form, rating: r })} />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
            <textarea
              className="input text-sm resize-none"
              rows={3}
              placeholder="Write the review comment..."
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Spinner size="sm" /> : 'Add Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminReviewsPage() {
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [approvingId, setApprovingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoaded, setProductsLoaded] = useState(false);

  const fetchReviews = useCallback(
    () => adminGetReviews({ ...(filter !== '' ? { approved: filter } : {}), page, limit: 20 }),
    [filter, page]
  );
  const { data, loading, error, refetch } = useFetch(fetchReviews, [filter, page]);
  const reviews = data?.reviews || [];
  const pages = data?.pages || 1;

  const openAddModal = async () => {
    if (!productsLoaded) {
      try {
        const { adminGetProducts } = await import('@/lib/api');
        const { data: prods } = await adminGetProducts();
        setProducts(Array.isArray(prods) ? prods : []);
        setProductsLoaded(true);
      } catch {
        toast.error('Failed to load products');
        return;
      }
    }
    setShowAddModal(true);
  };

  const handleApprove = async (id) => {
    setApprovingId(id);
    try {
      await adminApproveReview(id);
      toast.success('Review approved');
      refetch();
    } catch (err) {
      toast.error(err?.error || 'Failed to approve');
    } finally {
      setApprovingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this review?')) return;
    setDeletingId(id);
    try {
      await adminDeleteReview(id);
      toast.success('Review deleted');
      refetch();
    } catch (err) {
      toast.error(err?.error || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      {showAddModal && (
        <AddReviewModal
          onClose={() => setShowAddModal(false)}
          onSaved={refetch}
          products={products}
        />
      )}

      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Reviews</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {[{ label: 'All', value: '' }, { label: 'Pending', value: 'false' }, { label: 'Approved', value: 'true' }].map(({ label, value }) => (
            <button
              key={value}
              onClick={() => { setFilter(value); setPage(1); }}
              className={`text-sm px-3 py-1.5 rounded-full border transition ${filter === value ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 text-sm font-medium bg-black text-white px-3 py-1.5 rounded-full hover:bg-gray-900 transition"
          >
            <Plus size={14} /> Add Review
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-24" />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !reviews?.length ? (
        <EmptyState icon="star" title="No reviews" description={filter === 'false' ? 'No pending reviews' : filter === 'true' ? 'No approved reviews' : 'No reviews yet'} />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={12} fill={s <= review.rating ? '#fbbf24' : 'none'} stroke={s <= review.rating ? '#fbbf24' : '#d1d5db'} />
                      ))}
                    </div>
                    <Badge variant={review.is_approved ? 'approved' : 'pending_review'}>
                      {review.is_approved ? 'Approved' : 'Pending'}
                    </Badge>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-700 mb-3 leading-relaxed">&ldquo;{review.comment}&rdquo;</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="font-medium text-gray-600">{review.user_name || review.reviewer_name}</span>
                    <span>·</span>
                    <span>on <strong className="text-gray-600">{review.product_name}</strong></span>
                    <span>·</span>
                    <span>{new Date(review.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!review.is_approved && (
                    <button
                      onClick={() => handleApprove(review.id)}
                      disabled={approvingId === review.id}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-500 transition"
                      title="Approve"
                    >
                      {approvingId === review.id ? <Spinner size="sm" /> : <CheckCircle size={16} />}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review.id)}
                    disabled={deletingId === review.id}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                    title="Delete"
                  >
                    {deletingId === review.id ? <Spinner size="sm" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {pages > 1 && (
            <div className="flex items-center justify-between pt-3">
              <button
                className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 disabled:opacity-40"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-[12px] text-gray-400">Page {page} of {pages}</span>
              <button
                className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 disabled:opacity-40"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
