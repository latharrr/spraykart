'use client';
import { useState, useCallback } from 'react';
import { adminGetReviews, adminApproveReview, adminDeleteReview } from '@/lib/api';
import { useFetch } from '@/lib/hooks/useFetch';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import { Star, CheckCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminReviewsPage() {
  const [filter, setFilter] = useState('');
  const [approvingId, setApprovingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchReviews = useCallback(
    () => adminGetReviews(filter !== '' ? { approved: filter } : {}),
    [filter]
  );
  const { data: reviews, loading, error, refetch } = useFetch(fetchReviews, [filter]);

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
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Reviews</h1>
        <div className="flex gap-2">
          {[{ label: 'All', value: '' }, { label: 'Pending', value: 'false' }, { label: 'Approved', value: 'true' }].map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`text-sm px-3 py-1.5 rounded-full border transition ${filter === value ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
            >
              {label}
            </button>
          ))}
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
                    <span className="font-medium text-gray-600">{review.user_name}</span>
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
        </div>
      )}
    </div>
  );
}
