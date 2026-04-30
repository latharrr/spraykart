'use client';
import { useCallback, useState } from 'react';
import { adminGetContactMessages } from '@/lib/api';
import { useFetch } from '@/lib/hooks/useFetch';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import { ChevronLeft, ChevronRight, Mail, MessageSquareText } from 'lucide-react';

export default function AdminContactSubmissionsPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchMessages = useCallback(
    () => adminGetContactMessages({ page, limit }),
    [page]
  );

  const { data, loading, error, refetch } = useFetch(fetchMessages, [page]);
  const submissions = data?.submissions || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquareText size={20} /> Contact Messages
          </h1>
          <p className="text-sm text-gray-500 mt-1">Messages submitted through the contact form</p>
        </div>
        <div className="text-sm text-gray-500">
          {total} message{total === 1 ? '' : 's'}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => <div key={i} className="card h-24" />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : submissions.length === 0 ? (
        <EmptyState icon="file" title="No contact messages yet" description="Submitted contact form messages will appear here" />
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <div key={submission.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="font-semibold text-gray-900">{submission.name}</h2>
                    <a href={`mailto:${submission.email}`} className="text-xs text-gray-500 hover:text-black inline-flex items-center gap-1">
                      <Mail size={11} /> {submission.email}
                    </a>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{submission.message}</p>
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(submission.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  <span className="block mt-0.5">
                    {new Date(submission.created_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {pages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 disabled:opacity-40"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-[12px] text-gray-400">Page {page} of {pages}</span>
              <button
                className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 disabled:opacity-40"
                onClick={() => setPage((current) => Math.min(pages, current + 1))}
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