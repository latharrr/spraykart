'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchWithCsrf } from '@/lib/csrf';
import logger from '@/lib/logger';

export default function SystemSettingsPage() {
  const [lockedIps, setLockedIps] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRedisData = async () => {
    try {
      const res = await fetch('/api/admin/redis');
      const data = await res.json();
      if (res.ok) setLockedIps(data.lockedIps || []);
    } catch (err) {
      logger.error('Redis admin fetch failed', err);
    }
  };

  useEffect(() => {
    fetchRedisData();
  }, []);

  const flushRedis = async () => {
    if (!confirm('Are you sure you want to flush the entire Redis cache? This will clear all rate limits and cached data.')) return;
    setLoading(true);
    try {
      const res = await fetchWithCsrf('/api/admin/redis', { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        toast.success('Redis cache flushed successfully');
        setLockedIps([]);
      } else {
        toast.error('Failed to flush Redis');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>

      <div className="card p-6 mt-6 max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Redis & Rate Limits</h2>
            <p className="text-sm text-gray-500 mt-1">Manage caching and view blocked IPs.</p>
          </div>
          <button 
            onClick={flushRedis} 
            disabled={loading}
            className="btn-primary text-xs py-2 px-3 bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Flushing...' : 'Flush Redis DB'}
          </button>
        </div>
        
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Locked IPs (Rate Limited)</h3>
          {lockedIps.length === 0 ? (
            <p className="text-xs text-gray-400 bg-gray-50 p-4 rounded border border-gray-100 text-center">No IPs currently locked.</p>
          ) : (
            <div className="space-y-2">
              {lockedIps.map((ip) => (
                <div key={ip.key} className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-100">
                  <div>
                    <p className="text-xs font-mono font-bold text-gray-800">{ip.ip}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Action: <span className="text-gray-600">{ip.action}</span>
                      {ip.ttl > 0 && ` · Unban in ${Math.ceil(ip.ttl / 60)} min`}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-red-600">{ip.attempts} attempts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
