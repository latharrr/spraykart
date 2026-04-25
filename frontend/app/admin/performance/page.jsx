'use client';
import { useMemo, useState } from 'react';
import { adminGetPerf } from '@/lib/api';
import { Activity, Timer, Database, HardDrive, Server, RefreshCw, Play } from 'lucide-react';
import ErrorState from '@/components/ui/ErrorState';

function MetricCard({ label, value, hint, icon: Icon }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {hint ? <p className="text-xs text-gray-400 mt-1">{hint}</p> : null}
        </div>
        <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
          <Icon size={16} />
        </div>
      </div>
    </div>
  );
}

export default function AdminPerformancePage() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const probeOnce = async () => {
    const startedAt = performance.now();
    const res = await adminGetPerf();
    const endedAt = performance.now();

    return {
      index: runs.length + 1,
      clientTotalMs: Math.round(endedAt - startedAt),
      serverTotalMs: res.data.totalMs,
      dbLatencyMs: res.data.db?.latencyMs ?? null,
      cacheFirstGetMs: res.data.cache?.firstGetMs ?? null,
      cacheSecondGetMs: res.data.cache?.secondGetMs ?? null,
      cacheConfigured: Boolean(res.data.cacheConfigured),
      region: res.data.region || 'unknown',
      status: res.data.status,
      timestamp: res.data.timestamp,
    };
  };

  const runSingleProbe = async () => {
    setLoading(true);
    setError('');
    try {
      const sample = await probeOnce();
      setRuns((prev) => [sample, ...prev]);
    } catch (err) {
      setError(err?.error || 'Failed to run performance probe');
    } finally {
      setLoading(false);
    }
  };

  const runTenProbes = async () => {
    setLoading(true);
    setError('');

    const batch = [];
    try {
      for (let i = 0; i < 10; i += 1) {
        // Sequential requests show warm-up behavior better than parallel calls.
        const startedAt = performance.now();
        const res = await adminGetPerf();
        const endedAt = performance.now();

        batch.push({
          index: i + 1,
          clientTotalMs: Math.round(endedAt - startedAt),
          serverTotalMs: res.data.totalMs,
          dbLatencyMs: res.data.db?.latencyMs ?? null,
          cacheFirstGetMs: res.data.cache?.firstGetMs ?? null,
          cacheSecondGetMs: res.data.cache?.secondGetMs ?? null,
          cacheConfigured: Boolean(res.data.cacheConfigured),
          region: res.data.region || 'unknown',
          status: res.data.status,
          timestamp: res.data.timestamp,
        });
      }
      setRuns(batch);
    } catch (err) {
      setError(err?.error || 'Failed while running probe batch');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (runs.length === 0) {
      return {
        avgClient: 0,
        avgServer: 0,
        avgDb: 0,
        p95Client: 0,
      };
    }

    const client = runs.map((r) => r.clientTotalMs).sort((a, b) => a - b);
    const server = runs.map((r) => r.serverTotalMs ?? 0);
    const db = runs.map((r) => r.dbLatencyMs ?? 0);
    const p95Index = Math.max(0, Math.ceil(client.length * 0.95) - 1);

    return {
      avgClient: Math.round(client.reduce((s, n) => s + n, 0) / client.length),
      avgServer: Math.round(server.reduce((s, n) => s + n, 0) / server.length),
      avgDb: Math.round(db.reduce((s, n) => s + n, 0) / db.length),
      p95Client: client[p95Index],
    };
  }, [runs]);

  const maxClient = runs.length ? Math.max(...runs.map((r) => r.clientTotalMs), 1) : 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Performance Probe</h1>
          <p className="text-sm text-gray-500 mt-1">
            Admin-only latency checks using <span className="font-medium">/api/perf</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runSingleProbe}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
          >
            <Play size={14} /> Run once
          </button>
          <button
            onClick={runTenProbes}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />}
            Run 10 probes
          </button>
        </div>
      </div>

      {error ? <ErrorState message={error} onRetry={runSingleProbe} /> : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Avg Client Total" value={`${stats.avgClient} ms`} hint="Browser-measured" icon={Timer} />
        <MetricCard label="Avg Server Total" value={`${stats.avgServer} ms`} hint="From API payload" icon={Server} />
        <MetricCard label="Avg DB Ping" value={`${stats.avgDb} ms`} hint="SELECT 1 latency" icon={Database} />
        <MetricCard label="P95 Client" value={`${stats.p95Client} ms`} hint="95th percentile" icon={HardDrive} />
      </div>

      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Latency Trend</h2>
        {runs.length === 0 ? (
          <p className="text-sm text-gray-500">No samples yet. Run a probe to start measuring cold vs warm behavior.</p>
        ) : (
          <div className="space-y-2">
            {runs
              .slice()
              .reverse()
              .map((run, idx) => (
                <div key={`${run.timestamp}-${idx}`} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-14 shrink-0">Run {idx + 1}</span>
                  <div className="h-6 bg-gray-100 rounded w-full overflow-hidden">
                    <div
                      className="h-full bg-black/85"
                      style={{ width: `${Math.max(3, (run.clientTotalMs / maxClient) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 w-20 text-right">{run.clientTotalMs} ms</span>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-th">Run</th>
                <th className="table-th">Region</th>
                <th className="table-th">Client Total</th>
                <th className="table-th">Server Total</th>
                <th className="table-th">DB</th>
                <th className="table-th">Cache 1st/2nd</th>
                <th className="table-th">Cache Configured</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                    Run probes to populate metrics.
                  </td>
                </tr>
              ) : (
                runs.map((run, idx) => (
                  <tr key={`${run.timestamp}-${idx}`}>
                    <td className="table-td">{runs.length - idx}</td>
                    <td className="table-td">{run.region}</td>
                    <td className="table-td font-medium">{run.clientTotalMs} ms</td>
                    <td className="table-td">{run.serverTotalMs ?? '-'} ms</td>
                    <td className="table-td">{run.dbLatencyMs ?? '-'} ms</td>
                    <td className="table-td">{run.cacheFirstGetMs ?? '-'} / {run.cacheSecondGetMs ?? '-'} ms</td>
                    <td className="table-td">{run.cacheConfigured ? 'Yes' : 'No'}</td>
                    <td className="table-td">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${run.status === 'ok' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {run.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
