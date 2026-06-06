/**
 * StatsGrid.jsx — KPI Cards
 *
 * 6 large-number stat cards in an enterprise grid.
 * Accent color: orange-500 (enterprise red-orange).
 * Design: massive bold numbers, subdued label, accent icon corner.
 */
import { TrendingUp, Clock, AlertTriangle, CheckCircle2, Layers, Zap } from 'lucide-react';

const STAT_CONFIG = [
    {
        key:      'totalHits',
        label:    'Total Traffic',
        fmt:      (v) => Number(v).toLocaleString(),
        sub:      'Last 24 hours',
        icon:     TrendingUp,
        iconCls:  'text-orange-500',
        iconBg:   'bg-orange-500/10 border-orange-500/20',
        accentCls:'bg-orange-500',
        span:     'col-span-2 sm:col-span-1',
    },
    {
        key:      'avgLatency',
        label:    'Response Time',
        fmt:      (v) => `${Number(v).toFixed(0)}ms`,
        sub:      'Average latency',
        icon:     Clock,
        iconCls:  'text-sky-400',
        iconBg:   'bg-sky-500/10 border-sky-500/20',
        accentCls:'bg-sky-500',
        span:     '',
    },
    {
        key:      'errorRate',
        label:    'System Errors',
        fmt:      (v) => `${Number(v).toFixed(2)}%`,
        sub:      (s) => `${Number(s.errorHits).toLocaleString()} error requests`,
        icon:     AlertTriangle,
        iconCls:  'text-red-500',
        iconBg:   'bg-red-500/10 border-red-500/20',
        accentCls:'bg-red-500',
        span:     '',
    },
    {
        key:      'successHits',
        label:    'Success Rate',
        fmt:      (_v, s) => `${(100 - Number(s.errorRate)).toFixed(1)}%`,
        sub:      (s) => `${Number(s.successHits).toLocaleString()} OK`,
        icon:     CheckCircle2,
        iconCls:  'text-emerald-500',
        iconBg:   'bg-emerald-500/10 border-emerald-500/20',
        accentCls:'bg-emerald-500',
        span:     '',
    },
    {
        key:      'uniqueServices',
        label:    'Active Services',
        fmt:      (v) => String(v),
        sub:      'Monitored services',
        icon:     Layers,
        iconCls:  'text-violet-400',
        iconBg:   'bg-violet-500/10 border-violet-500/20',
        accentCls:'bg-violet-500',
        span:     '',
    },
    {
        key:      'uniqueEndpoints',
        label:    'API Endpoints',
        fmt:      (v) => String(v),
        sub:      'Distinct routes',
        icon:     Zap,
        iconCls:  'text-amber-400',
        iconBg:   'bg-amber-500/10 border-amber-500/20',
        accentCls:'bg-amber-500',
        span:     '',
    },
];

export default function StatsGrid({ stats }) {
    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {STAT_CONFIG.map((cfg) => {
                const Icon  = cfg.icon;
                const value = typeof cfg.fmt === 'function'
                    ? cfg.fmt(stats[cfg.key], stats)
                    : stats[cfg.key];
                const sub   = typeof cfg.sub === 'function'
                    ? cfg.sub(stats)
                    : cfg.sub;

                return (
                    <div
                        key={cfg.key}
                        className={`relative flex flex-col justify-between bg-[#111111] border border-zinc-800/60 rounded-xl p-4 overflow-hidden group hover:border-zinc-700 transition-colors duration-200 ${cfg.span}`}
                    >
                        {/* Accent top stripe */}
                        <div className={`absolute top-0 left-0 right-0 h-[2px] ${cfg.accentCls} opacity-60`} />

                        {/* Icon */}
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center mb-3 ${cfg.iconBg}`}>
                            <Icon className={`w-4 h-4 ${cfg.iconCls}`} />
                        </div>

                        {/* Value */}
                        <div>
                            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-1">
                                {cfg.label}
                            </p>
                            <p className="text-2xl font-black text-zinc-100 tracking-tight tabular-nums leading-none">
                                {value}
                            </p>
                            <p className="text-[11px] text-zinc-600 mt-1.5 leading-tight">
                                {sub}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
