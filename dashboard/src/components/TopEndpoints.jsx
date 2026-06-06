/**
 * TopEndpoints.jsx — Top Endpoints Table
 *
 * Clean enterprise table: Resource Path, Throughput, Latency, Status badge.
 * Spacious rows, subtle dividers, ACTIVE status badge in green.
 */
import { BarChart2 } from 'lucide-react';

const METHOD_STYLES = {
    GET:    'bg-sky-500/10 text-sky-400 border-sky-500/20',
    POST:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
    PUT:    'bg-amber-500/10 text-amber-400 border-amber-500/20',
    DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
    PATCH:  'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

function MethodBadge({ method }) {
    const cls = METHOD_STYLES[method] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700';
    return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase border ${cls}`}>
            {method}
        </span>
    );
}

export default function TopEndpoints({ endpoints }) {
    const isEmpty = !endpoints || endpoints.length === 0;

    return (
        <div className="bg-[#111111] border border-zinc-800/60 rounded-xl overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60">
                <div className="flex items-center gap-2.5">
                    <BarChart2 className="w-4 h-4 text-zinc-600" />
                    <div>
                        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest leading-none mb-0.5">
                            Endpoints
                        </p>
                        <p className="text-[13px] font-semibold text-zinc-200 leading-tight">
                            Top by Throughput
                        </p>
                    </div>
                </div>
                {!isEmpty && (
                    <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded">
                        TOP {endpoints.length}
                    </span>
                )}
            </div>

            {isEmpty ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-center px-5">
                    <BarChart2 className="w-8 h-8 text-zinc-800 mb-3" />
                    <p className="text-sm text-zinc-500 font-medium">No endpoint data</p>
                    <p className="text-xs text-zinc-700 mt-1">
                        Traffic data will appear once requests are tracked
                    </p>
                </div>
            ) : (
                <>
                    {/* Table head */}
                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-5 py-2.5 border-b border-zinc-800/40">
                        {['Resource Path', 'Hits', 'Latency', 'Status'].map((h) => (
                            <p key={h} className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest">
                                {h}
                            </p>
                        ))}
                    </div>

                    {/* Rows */}
                    <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/40">
                        {endpoints.map((ep, i) => (
                            <div
                                key={`${ep.method}-${ep.endpoint}`}
                                className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 items-center px-5 py-3.5 hover:bg-zinc-800/20 transition-colors duration-100"
                            >
                                {/* Resource path */}
                                <div className="flex flex-col min-w-0 gap-1">
                                    <div className="flex items-center gap-2">
                                        <MethodBadge method={ep.method} />
                                        <span className="text-[11px] text-zinc-300 font-mono truncate">
                                            {ep.endpoint}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-zinc-600 truncate">
                                        {ep.serviceName}
                                    </span>
                                </div>

                                {/* Throughput */}
                                <div className="text-right">
                                    <p className="text-[13px] font-bold text-zinc-100 tabular-nums">
                                        {Number(ep.totalHits).toLocaleString()}
                                    </p>
                                    <p className="text-[9px] text-zinc-600">reqs</p>
                                </div>

                                {/* Latency */}
                                <div className="text-right">
                                    <p className={`text-[13px] font-bold tabular-nums ${ep.avgLatency > 100 ? 'text-orange-500' : 'text-zinc-100'}`}>
                                        {ep.avgLatency}ms
                                    </p>
                                    <p className="text-[9px] text-zinc-600">avg</p>
                                </div>

                                {/* Status badge */}
                                <div className="flex justify-end">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                        <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                        ACTIVE
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
