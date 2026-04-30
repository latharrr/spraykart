'use client';
import { useCallback, useState } from 'react';
import { adminGetFragranceFinder } from '@/lib/api';
import { useFetch } from '@/lib/hooks/useFetch';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import { ChevronLeft, ChevronRight, ExternalLink, Sparkles } from 'lucide-react';

const ANSWER_LABELS = {
  occasion: {
    label: 'Occasion',
    values: {
      daily: 'Daily Wear',
      special: 'Special Occasion',
      office: 'Office / Work',
      date: 'Date Night',
    },
  },
  intensity: {
    label: 'Intensity',
    values: {
      fresh: 'Light & Fresh',
      moderate: 'Moderate',
      strong: 'Strong & Bold',
      intense: 'Very Intense',
    },
  },
  season: {
    label: 'Season',
    values: {
      summer: 'Summer',
      winter: 'Winter',
      spring: 'Monsoon / Spring',
      all: 'All Seasons',
    },
  },
  budget: {
    label: 'Budget',
    values: {
      '0-500': 'Under ₹500',
      '500-1500': '₹500 - ₹1,500',
      '1500-3000': '₹1,500 - ₹3,000',
      '3000-999999': 'Above ₹3,000',
    },
  },
  gender: {
    label: 'For',
    values: {
      Men: 'For Him',
      Women: 'For Her',
      Unisex: 'Unisex',
      '': 'Gift (not sure)',
    },
  },
};

function formatAnswer(key, value) {
  return ANSWER_LABELS[key]?.values?.[value] || '—';
}

function SubmissionPill({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-[12px]">
      <span className="font-medium text-gray-500">{label}:</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </span>
  );
}

export default function AdminFragranceFinderPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchSubmissions = useCallback(
    () => adminGetFragranceFinder({ page, limit }),
    [page]
  );

  const { data, loading, error, refetch } = useFetch(fetchSubmissions, [page]);
  const submissions = data?.submissions || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles size={20} /> Fragrance Finder
          </h1>
          <p className="text-sm text-gray-500 mt-1">Saved quiz responses from the public fragrance finder</p>
        </div>
        <div className="text-sm text-gray-500">
          {total} submission{total === 1 ? '' : 's'}
        </div>
      </div>

      {loading ? (
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-50 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-5 space-y-3">
                <div className="h-4 w-1/4 skeleton rounded" />
                <div className="h-8 w-full skeleton rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : submissions.length === 0 ? (
        <EmptyState
          icon="file"
          title="No submissions yet"
          description="Quiz responses will appear here once visitors complete the fragrance finder"
        />
      ) : (
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-[#4b5563]">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#4b5563]">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#4b5563]">Preferences</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#4b5563]">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {submissions.map((submission) => {
                  const answers = typeof submission.answers === 'string'
                    ? JSON.parse(submission.answers)
                    : (submission.answers || {});

                  return (
                    <tr key={submission.id} className="hover:bg-[#f9fafb] transition align-top">
                      <td className="px-4 py-4 text-[#4b5563] whitespace-nowrap">
                        {new Date(submission.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        <span className="text-[11px] text-[#9ca3af] block mt-0.5">
                          {new Date(submission.created_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-[#1a1a1a]">{submission.user_name || 'Anonymous'}</div>
                        <div className="text-[12px] text-[#6b7280]">{submission.user_email || 'No account linked'}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2 max-w-[760px]">
                          {Object.keys(ANSWER_LABELS).map((key) => (
                            <SubmissionPill key={key} label={ANSWER_LABELS[key].label} value={formatAnswer(key, answers[key])} />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <a
                          href={submission.result_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-black font-medium hover:underline"
                        >
                          View products <ExternalLink size={12} />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="px-4 py-3 border-t border-[#f3f4f6] flex items-center justify-between gap-3">
              <button
                className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 disabled:opacity-40"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-[12px] text-gray-400">
                Page {page} of {pages}
              </span>
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