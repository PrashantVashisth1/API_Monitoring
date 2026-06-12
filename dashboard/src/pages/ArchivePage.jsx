/**
 * ArchivePage.jsx — Historical Metrics Explorer
 *
 * Features:
 *  - Date range picker (start / end)
 *  - Service name + endpoint text filters
 *  - Paginated results table (50 rows / page)
 *  - Summary stats bar (total hits, avg latency, error rate) for the result set
 *  - Quick-range presets (Last 1h / 6h / 24h / 7d / 30d)
 *  - Export hint for future
 *
 * Backend: GET /api/analytics/archive?serviceName&endpoint&startTime&endTime&limit&page
 */
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Archive, Search, RefreshCw, ChevronLeft, ChevronRight,
    AlertTriangle, Loader2, Clock, Zap, BarChart2, Filter,
    CalendarDays, X, Lock, ArrowRight,
} from 'lucide-react';
import { analyticsApi } from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PAGE_SIZE = 50;

/** Format ISO string to local date-time — backend sends UTC ISO strings (with Z) */
const fmtTime = (iso) => {
    if (!iso) return '—';
    // Backend normalizes time_bucket to .toISOString() (UTC with Z).
    // new Date() correctly applies local timezone offset (IST).
    return new Date(iso).toLocaleString('en-IN', {
        day:    '2-digit',
        month:  'short',
        year:   'numeric',
        hour:   '2-digit',
        minute: '2-digit',
    });
};

const fmtMs = (v) => `${parseFloat(v).toFixed(1)}ms`;

/** Return ISO string for now minus N hours */
const hoursAgo = (h) => new Date(Date.now() - h * 3600_000).toISOString().slice(0, 16);
const daysAgo  = (d) => hoursAgo(d * 24);

/** Quick-range presets */
const PRESETS = [
    { label: '1h',  fn: () => hoursAgo(1) },
    { label: '6h',  fn: () => hoursAgo(6) },
    { label: '24h', fn: () => hoursAgo(24) },
    { label: '7d',  fn: () => daysAgo(7)  },
    { label: '30d', fn: () => daysAgo(30) },
];

// ─── Method Badge ─────────────────────────────────────────────────────────────
const METHOD_COLORS = {
    GET:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    POST:   'text-sky-400    bg-sky-500/10     border-sky-500/20',
    PUT:    'text-amber-400  bg-amber-500/10   border-amber-500/20',
    PATCH:  'text-violet-400 bg-violet-500/10  border-violet-500/20',
    DELETE: 'text-red-400    bg-red-500/10     border-red-500/20',
};
function MethodBadge({ method }) {
    const cls = METHOD_COLORS[method?.toUpperCase()] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700';
    return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${cls}`}>
            {method}
        </span>
    );
}

// ─── Latency Cell ─────────────────────────────────────────────────────────────
function LatencyCell({ value }) {
    const ms = parseFloat(value);
    const cls = ms < 100 ? 'text-emerald-400' : ms < 500 ? 'text-amber-400' : 'text-red-400';
    return <span className={`font-mono text-xs font-semibold tabular-nums ${cls}`}>{fmtMs(value)}</span>;
}

// ─── Error Rate Cell ──────────────────────────────────────────────────────────
function ErrorRateCell({ errorHits, totalHits }) {
    const rate = totalHits > 0 ? ((errorHits / totalHits) * 100).toFixed(1) : 0;
    const cls  = rate < 1 ? 'text-emerald-400' : rate < 5 ? 'text-amber-400' : 'text-red-400';
    return <span className={`font-mono text-xs tabular-nums ${cls}`}>{rate}%</span>;
}

// ─── Summary Bar ──────────────────────────────────────────────────────────────
function SummaryBar({ rows }) {
    if (!rows?.length) return null;
    const totalHits  = rows.reduce((s, r) => s + r.totalHits, 0);
    const totalError = rows.reduce((s, r) => s + r.errorHits, 0);
    const avgLatency = rows.reduce((s, r) => s + parseFloat(r.avgLatency) * r.totalHits, 0) / (totalHits || 1);
    const errorRate  = totalHits > 0 ? ((totalError / totalHits) * 100).toFixed(1) : 0;

    const stats = [
        { icon: BarChart2, label: 'Total Hits',   value: totalHits.toLocaleString(), cls: 'text-orange-400' },
        { icon: Zap,        label: 'Avg Latency',  value: fmtMs(avgLatency),          cls: 'text-sky-400'    },
        { icon: AlertTriangle, label: 'Error Rate', value: `${errorRate}%`,           cls: errorRate < 5 ? 'text-emerald-400' : 'text-red-400' },
    ];

    return (
        <div className="grid grid-cols-3 gap-3">
            {stats.map(({ icon: Icon, label, value, cls }) => (
                <div key={label} className="bg-[#111111] border border-zinc-800/60 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800/80 flex items-center justify-center flex-shrink-0">
                        <Icon className={`w-4 h-4 ${cls}`} />
                    </div>
                    <div>
                        <p className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest">{label}</p>
                        <p className={`text-lg font-black tabular-nums ${cls}`}>{value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Guest Locked UI ─────────────────────────────────────────────────────────
function GuestLockedArchive() {
    const navigate = useNavigate();

    const handleSignIn = () => {
        // Clear the guest flag so AuthGate renders <Login /> instead of redirecting to /dashboard
        localStorage.removeItem('apim:guest');
        navigate('/login', { replace: true });
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-semibold text-orange-500 uppercase tracking-widest">
                        ■ Historical Data
                    </span>
                </div>
                <h1 className="text-xl font-black text-zinc-100 tracking-tight">Archive</h1>
                <p className="text-sm text-zinc-600 mt-0.5">Query historical API metrics with date range and filters</p>
            </div>

            {/* Locked state */}
            <div className="bg-[#111111] border border-zinc-800/60 rounded-2xl p-12 flex flex-col items-center text-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <Lock className="w-7 h-7 text-zinc-600" />
                </div>
                <div className="space-y-2 max-w-sm">
                    <h2 className="text-base font-bold text-zinc-200">Authentication Required</h2>
                    <p className="text-sm text-zinc-600 leading-relaxed">
                        The Archive lets you query historical API metrics across any date range.
                        Sign in to access your organisation&apos;s real data.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSignIn}
                        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
                    >
                        Sign In
                        <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 text-sm px-5 py-2.5 rounded-lg transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function ArchivePage() {
    const { user } = useAuth();
    const isGuest  = user?.isGuest === true;

    // Show locked UI for guests — no API calls
    if (isGuest) return <GuestLockedArchive />;
    // ── Filters ────────────────────────────────────────────────────────────────
    const [filters, setFilters] = useState({
        serviceName: '',
        endpoint:    '',
        startTime:   daysAgo(7),  // default last 7 days
        endTime:     new Date().toISOString().slice(0, 16),
    });
    const [activeFilters, setActiveFilters] = useState({ ...filters });
    const [page, setPage] = useState(1);

    // ── Query ──────────────────────────────────────────────────────────────────
    const { data, isLoading, isError, isFetching, refetch } = useQuery({
        queryKey: ['archive', activeFilters, page],
        queryFn:  () => analyticsApi.getArchive({
            ...activeFilters,
            limit: PAGE_SIZE,
            page,
        }),
        select:   (res) => res?.data ?? { rows: [], page: 1, limit: PAGE_SIZE, hasMore: false },
        staleTime: 60_000,
        keepPreviousData: true,
    });

    const rows    = data?.rows    ?? [];
    const hasMore = data?.hasMore ?? false;

    // ── Apply filters ──────────────────────────────────────────────────────────
    const applyFilters = useCallback(() => {
        setActiveFilters({ ...filters });
        setPage(1);
    }, [filters]);

    const clearFilters = useCallback(() => {
        const defaults = {
            serviceName: '',
            endpoint:    '',
            startTime:   daysAgo(7),
            endTime:     new Date().toISOString().slice(0, 16),
        };
        setFilters(defaults);
        setActiveFilters(defaults);
        setPage(1);
    }, []);

    const applyPreset = (presetFn) => {
        const start = presetFn();
        const end   = new Date().toISOString().slice(0, 16);
        const next  = { ...filters, startTime: start, endTime: end };
        setFilters(next);
        setActiveFilters(next);
        setPage(1);
    };

    const f = (field) => (e) => setFilters(p => ({ ...p, [field]: e.target.value }));

    const hasActiveTextFilters = activeFilters.serviceName || activeFilters.endpoint;

    return (
        <div className="flex flex-col gap-6">
            {/* ── Page header ─────────────────────────────────────────────── */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-semibold text-orange-500 uppercase tracking-widest">
                            ■ Historical Data
                        </span>
                    </div>
                    <h1 className="text-xl font-black text-zinc-100 tracking-tight">Archive</h1>
                    <p className="text-sm text-zinc-600 mt-0.5">
                        Query historical API metrics with date range and filters
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 transition-all disabled:opacity-40"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* ── Filter panel ─────────────────────────────────────────────── */}
            <div className="bg-[#111111] border border-zinc-800/60 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-4 h-4 text-zinc-600" />
                    <p className="text-xs font-semibold text-zinc-400">Filters</p>
                    {/* Quick-range presets */}
                    <div className="flex items-center gap-1 ml-auto">
                        {PRESETS.map(({ label, fn }) => (
                            <button
                                key={label}
                                onClick={() => applyPreset(fn)}
                                className="px-2.5 py-1 rounded-md text-[10px] font-semibold text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-all"
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                    {/* Start time */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
                            <CalendarDays className="w-3 h-3" /> From
                        </label>
                        <input
                            type="datetime-local"
                            value={filters.startTime}
                            onChange={f('startTime')}
                            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 focus:border-orange-500/60 focus:outline-none text-sm text-zinc-300 transition-colors"
                        />
                    </div>

                    {/* End time */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
                            <CalendarDays className="w-3 h-3" /> To
                        </label>
                        <input
                            type="datetime-local"
                            value={filters.endTime}
                            onChange={f('endTime')}
                            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 focus:border-orange-500/60 focus:outline-none text-sm text-zinc-300 transition-colors"
                        />
                    </div>

                    {/* Service Name */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
                            Service Name
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
                            <input
                                type="text"
                                value={filters.serviceName}
                                onChange={f('serviceName')}
                                placeholder="e.g. blog-api"
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                className="w-full pl-8 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 focus:border-orange-500/60 focus:outline-none text-sm text-zinc-300 placeholder:text-zinc-700 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Endpoint */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
                            Endpoint
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
                            <input
                                type="text"
                                value={filters.endpoint}
                                onChange={f('endpoint')}
                                placeholder="e.g. /api/posts"
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                className="w-full pl-8 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 focus:border-orange-500/60 focus:outline-none text-sm text-zinc-300 placeholder:text-zinc-700 transition-colors"
                            />
                        </div>
                    </div>
                </div>


                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-800/60">
                    <button
                        onClick={applyFilters}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-orange-600 hover:bg-orange-500 text-white transition-colors shadow-lg shadow-orange-900/20"
                    >
                        <Search className="w-3.5 h-3.5" />
                        Query
                    </button>
                    {(hasActiveTextFilters) && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-all"
                        >
                            <X className="w-3 h-3" /> Clear filters
                        </button>
                    )}
                    <p className="ml-auto text-[10px] text-zinc-700">
                        Showing page {page} · {rows.length} rows · Press Enter in any text field to query
                    </p>
                </div>
            </div>

            {/* ── Summary stats ─────────────────────────────────────────────── */}
            {rows.length > 0 && <SummaryBar rows={rows} />}

            {/* ── Results table ─────────────────────────────────────────────── */}
            <div className="bg-[#111111] border border-zinc-800/60 rounded-xl overflow-hidden">
                {/* Table header */}
                <div className="px-5 py-3 border-b border-zinc-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Archive className="w-4 h-4 text-zinc-600" />
                        <p className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest">
                            Results
                        </p>
                        {isFetching && <Loader2 className="w-3 h-3 text-zinc-600 animate-spin" />}
                    </div>
                    {/* Pagination */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || isFetching}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300 transition-all disabled:opacity-30"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-zinc-600 px-2 tabular-nums">Pg {page}</span>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={!hasMore || isFetching}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300 transition-all disabled:opacity-30"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-[2fr_3fr_1fr_1fr_1.5fr_1fr_1fr_1fr_2fr] gap-x-4 px-5 py-2.5 border-b border-zinc-800/40">
                    {['Service', 'Endpoint', 'Method', 'Hits', 'Avg Latency', 'Min', 'Max', 'Error %', 'Time Bucket'].map(h => (
                        <span key={h} className="text-[9px] font-semibold text-zinc-700 uppercase tracking-widest">
                            {h}
                        </span>
                    ))}
                </div>

                {/* Rows */}
                {isLoading ? (
                    <div className="flex items-center justify-center h-48 gap-3 text-zinc-700">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Querying archive…</span>
                    </div>
                ) : isError ? (
                    <div className="flex items-center justify-center h-48 gap-3 text-red-400">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="text-sm">Failed to load archive data</span>
                    </div>
                ) : rows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-2 text-zinc-700">
                        <Archive className="w-8 h-8 opacity-30" />
                        <p className="text-sm">No records found for the selected range</p>
                        <p className="text-xs text-zinc-800">Try a wider date range or clear text filters</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-800/30">
                        {rows.map((row, idx) => (
                            <div
                                key={`${row.serviceName}-${row.endpoint}-${row.timeBucket}-${idx}`}
                                className="grid grid-cols-[2fr_3fr_1fr_1fr_1.5fr_1fr_1fr_1fr_2fr] gap-x-4 px-5 py-3 hover:bg-zinc-800/20 transition-colors items-center group"
                            >
                                {/* Service */}
                                <p className="text-xs font-semibold text-zinc-300 truncate">{row.serviceName}</p>

                                {/* Endpoint */}
                                <p className="text-xs font-mono text-zinc-500 truncate">{row.endpoint}</p>

                                {/* Method */}
                                <div><MethodBadge method={row.method} /></div>

                                {/* Hits */}
                                <span className="font-mono text-xs font-bold text-zinc-300 tabular-nums">
                                    {row.totalHits?.toLocaleString()}
                                </span>

                                {/* Avg Latency */}
                                <LatencyCell value={row.avgLatency} />

                                {/* Min */}
                                <span className="font-mono text-xs text-zinc-600 tabular-nums">{fmtMs(row.minLatency)}</span>

                                {/* Max */}
                                <span className="font-mono text-xs text-zinc-600 tabular-nums">{fmtMs(row.maxLatency)}</span>

                                {/* Error % */}
                                <ErrorRateCell errorHits={row.errorHits} totalHits={row.totalHits} />

                                {/* Time Bucket */}
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-zinc-700 flex-shrink-0" />
                                    <span className="text-[10px] text-zinc-600 font-mono">{fmtTime(row.timeBucket)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer pagination */}
                {rows.length > 0 && (
                    <div className="px-5 py-3 border-t border-zinc-800/40 flex items-center justify-between">
                        <p className="text-[10px] text-zinc-700">
                            {rows.length} rows on page {page}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || isFetching}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition-all disabled:opacity-30"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" /> Previous
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={!hasMore || isFetching}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition-all disabled:opacity-30"
                            >
                                Next <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ArchivePage;
