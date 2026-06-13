/**
 * TrafficPage.jsx — Live Traffic Explorer
 *
 * Shows the most recent API hits across all services for the logged-in client.
 * Uses the existing GET /api/analytics/dashboard → recentActitivy (time-series) data.
 *
 * Auto-refreshes every 10 seconds to simulate "live" feel.
 * Manual refresh button also available.
 *
 * Columns: Service | Endpoint | Method | Hits | Avg Latency | Error Rate | Time Bucket
 */
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Activity, RefreshCw, Clock, Zap, AlertTriangle,
    CheckCircle2, XCircle, Loader2, Wifi, WifiOff,
} from 'lucide-react';
import { analyticsApi } from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { mockTrafficData } from '../utils/mockDashboardData';

// ─── Constants ────────────────────────────────────────────────────────────────
const REFRESH_INTERVAL = 10_000; // 10 seconds

// ─── Helpers ─────────────────────────────────────────────────────────────────
const METHOD_STYLES = {
    GET: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    POST: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    PUT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    PATCH: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
    default: 'bg-zinc-800 text-zinc-400 border-zinc-700',
};

function MethodBadge({ method }) {
    const cls = METHOD_STYLES[method?.toUpperCase()] ?? METHOD_STYLES.default;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border font-mono ${cls}`}>
            {method}
        </span>
    );
}

function LatencyBar({ value }) {
    const ms = parseFloat(value);
    const color = ms < 100 ? 'bg-emerald-500'
        : ms < 500 ? 'bg-amber-500'
            : 'bg-red-500';
    // max bar = 1000ms → 100%
    const width = Math.min((ms / 1000) * 100, 100);

    return (
        <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${width}%` }}
                />
            </div>
            <span className={`text-xs font-mono font-semibold ${ms < 100 ? 'text-emerald-400' : ms < 500 ? 'text-amber-400' : 'text-red-400'
                }`}>
                {ms.toFixed(0)}ms
            </span>
        </div>
    );
}

function ErrorRateCell({ rate, errorHits, totalHits }) {
    const pct = parseFloat(rate);
    if (pct === 0) {
        return <span className="text-[11px] text-zinc-600">—</span>;
    }
    return (
        <div className="flex items-center gap-1.5">
            <AlertTriangle className={`w-3 h-3 flex-shrink-0 ${pct > 5 ? 'text-red-400' : 'text-amber-400'}`} />
            <span className={`text-xs font-semibold ${pct > 5 ? 'text-red-400' : 'text-amber-400'}`}>
                {pct}%
            </span>
            <span className="text-[10px] text-zinc-700">({errorHits}/{totalHits})</span>
        </div>
    );
}

const fmtBucket = (ts) => {
    if (!ts) return '—';
    // Backend now sends proper ISO strings with Z (UTC-anchored).
    // new Date(isoString) correctly converts UTC → local (IST) for display.
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <div className="relative mb-5">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <Activity className="w-7 h-7 text-zinc-700" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0a0a0a] flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                </div>
            </div>
            <p className="text-sm font-semibold text-zinc-500 mb-1">No traffic yet</p>
            <p className="text-xs text-zinc-700 max-w-sm leading-relaxed">
                Integrate the SDK middleware into your Express.js app and make a request.
                Hits appear here within seconds.
            </p>
            <div className="mt-4 p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl font-mono text-[11px] text-zinc-600 text-left">
                <span className="text-zinc-700">// server.js</span><br />
                <span className="text-sky-400">app</span>
                <span className="text-zinc-500">.use(</span>
                <span className="text-orange-400">monitoringMiddleware</span>
                <span className="text-zinc-500">());</span>
            </div>
        </div>
    );
}

// ─── Traffic Row ──────────────────────────────────────────────────────────────
function TrafficRow({ hit, isNew }) {
    return (
        <div className={[
            'grid grid-cols-[140px_1fr_70px_60px_140px_120px_80px] gap-3 items-center',
            'px-5 py-3.5 border-b border-zinc-800/40 last:border-0',
            'hover:bg-zinc-800/15 transition-all duration-150',
            isNew ? 'animate-pulse-once bg-orange-500/3' : '',
        ].join(' ')}>
            {/* Service */}
            <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-200 truncate">{hit.serviceName}</p>
            </div>

            {/* Endpoint */}
            <div className="min-w-0">
                <p className="text-[11px] font-mono text-zinc-400 truncate">{hit.endpoint}</p>
            </div>

            {/* Method */}
            <div>
                <MethodBadge method={hit.method} />
            </div>

            {/* Total hits */}
            <div className="text-right">
                <span className="text-xs font-bold text-zinc-300">{hit.totalHits?.toLocaleString()}</span>
            </div>

            {/* Avg latency bar */}
            <div>
                <LatencyBar value={hit.avgLatency} />
            </div>

            {/* Error rate */}
            <div>
                <ErrorRateCell
                    rate={hit.errorRate ?? ((hit.errorHits / hit.totalHits) * 100).toFixed(2)}
                    errorHits={hit.errorHits}
                    totalHits={hit.totalHits}
                />
            </div>

            {/* Time bucket */}
            <div className="text-right">
                <span className="text-[10px] font-mono text-zinc-600">{fmtBucket(hit.timeBucket)}</span>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function TrafficPage() {
    const { user } = useAuth();
    const isGuest = user?.isGuest === true;
    const [tick, setTick] = useState(0);          // countdown display
    const [newIds, setNewIds] = useState(new Set()); // highlight new rows
    const prevDataRef = useRef([]);

    // ── Auto-refresh countdown ────────────────────────────────────────────────
    useEffect(() => {
        const intervalId = setInterval(() => {
            setTick((t) => {
                if (t <= 1) return REFRESH_INTERVAL / 1000;
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(intervalId);
    }, []);

    // ── Data fetch (real users) ─────────────────────────────────────────────
    const { data: realData, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['live-traffic', user?.clientId],
        queryFn: () => analyticsApi.getDashboard(),
        refetchInterval: REFRESH_INTERVAL,
        // Read recentTraffic (per-endpoint rows) — NOT recentActivity (aggregated chart data)
        select: (res) => res?.data?.recentTraffic ?? [],
        // Skip network call entirely for guests
        enabled: !isGuest,
    });

    const hits = isGuest ? mockTrafficData : (realData ?? []);

    // Detect new rows and highlight them briefly
    useEffect(() => {
        if (!hits.length || !prevDataRef.current.length) {
            prevDataRef.current = hits;
            return;
        }
        const prevKeys = new Set(prevDataRef.current.map(h => `${h.serviceName}:${h.endpoint}:${h.timeBucket}`));
        const newKeys = new Set();
        hits.forEach(h => {
            const key = `${h.serviceName}:${h.endpoint}:${h.timeBucket}`;
            if (!prevKeys.has(key)) newKeys.add(key);
        });
        if (newKeys.size > 0) {
            setNewIds(newKeys);
            setTimeout(() => setNewIds(new Set()), 3000);
        }
        prevDataRef.current = hits;
    }, [hits]);

    // ── Stats from activity ───────────────────────────────────────────────────
    const totalHits = hits.reduce((s, h) => s + (h.totalHits || 0), 0);
    const totalErrors = hits.reduce((s, h) => s + (h.errorHits || 0), 0);
    const avgLatency = totalHits > 0
        ? (hits.reduce((s, h) => s + (parseFloat(h.avgLatency || 0) * (h.totalHits || 0)), 0) / totalHits).toFixed(0)
        : 0;
    const services = new Set(hits.map(h => h.serviceName)).size;

    const handleRefresh = () => {
        if (!isGuest) {
            refetch();
        }
        setTick(REFRESH_INTERVAL / 1000);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* ── Page header ─────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="text-[9px] font-semibold text-emerald-500 uppercase tracking-widest">
                            Live
                        </span>
                    </div>
                    <h1 className="text-xl font-black text-zinc-100 tracking-tight">Traffic Explorer</h1>
                    <p className="text-sm text-zinc-600 mt-0.5">
                        Real-time API hit stream — refreshes every 10s
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Countdown */}
                    <div className="flex items-center gap-1.5 text-zinc-700">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-mono tabular-nums">
                            {isFetching ? 'Refreshing…' : `Next in ${tick}s`}
                        </span>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isFetching}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 hover:border-zinc-600 transition-all disabled:opacity-40"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* ── Stats strip ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    {
                        label: 'Total Hits',
                        value: isLoading ? '—' : totalHits.toLocaleString(),
                        icon: Activity,
                        cls: 'text-orange-400',
                    },
                    {
                        label: 'Avg Latency',
                        value: isLoading ? '—' : `${avgLatency}ms`,
                        icon: Zap,
                        cls: Number(avgLatency) < 100 ? 'text-emerald-400' : Number(avgLatency) < 500 ? 'text-amber-400' : 'text-red-400',
                    },
                    {
                        label: 'Errors',
                        value: isLoading ? '—' : totalErrors.toLocaleString(),
                        icon: AlertTriangle,
                        cls: totalErrors > 0 ? 'text-red-400' : 'text-zinc-700',
                    },
                    {
                        label: 'Services',
                        value: isLoading ? '—' : services,
                        icon: Wifi,
                        cls: 'text-sky-400',
                    },
                ].map(({ label, value, icon: Icon, cls }) => (
                    <div key={label} className="p-4 bg-[#111111] border border-zinc-800/60 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon className={`w-3.5 h-3.5 ${cls}`} />
                            <p className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest">{label}</p>
                        </div>
                        <p className="text-2xl font-black text-zinc-100">{value}</p>
                    </div>
                ))}
            </div>

            {/* ── Traffic table ─────────────────────────────────────────────── */}
            <div className="bg-[#111111] border border-zinc-800/60 rounded-xl overflow-hidden">
                {/* Column headers */}
                {hits.length > 0 && (
                    <div className="grid grid-cols-[140px_1fr_70px_60px_140px_120px_80px] gap-3 px-5 py-3 border-b border-zinc-800/60">
                        {['Service', 'Endpoint', 'Method', 'Hits', 'Avg Latency', 'Error Rate', 'Time'].map((h) => (
                            <p key={h} className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest">
                                {h}
                            </p>
                        ))}
                    </div>
                )}

                {isLoading ? (
                    <div className="flex items-center justify-center py-16 gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
                        <span className="text-sm text-zinc-600">Loading traffic…</span>
                    </div>
                ) : isError ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <WifiOff className="w-6 h-6 text-red-500" />
                        <p className="text-sm text-red-400">Failed to load traffic data</p>
                        <button onClick={handleRefresh} className="text-xs text-zinc-500 hover:text-zinc-300 underline">
                            Retry
                        </button>
                    </div>
                ) : hits.length === 0 ? (
                    <EmptyState />
                ) : (
                    hits.map((hit, i) => {
                        const key = `${hit.serviceName}:${hit.endpoint}:${hit.timeBucket}`;
                        return (
                            <TrafficRow
                                key={i}
                                hit={hit}
                                isNew={newIds.has(key)}
                            />
                        );
                    })
                )}
            </div>

            {/* ── Legend ───────────────────────────────────────────────────── */}
            {hits.length > 0 && (
                <div className="flex items-center gap-6 px-1">
                    <p className="text-[9px] text-zinc-700 uppercase tracking-widest">Latency legend</p>
                    {[
                        { color: 'bg-emerald-500', label: '< 100ms — Fast' },
                        { color: 'bg-amber-500', label: '100–500ms — Moderate' },
                        { color: 'bg-red-500', label: '> 500ms — Slow' },
                    ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${color}`} />
                            <span className="text-[10px] text-zinc-600">{label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default TrafficPage;
