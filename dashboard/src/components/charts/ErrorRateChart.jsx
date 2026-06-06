/**
 * ErrorRateChart.jsx — Status Distribution Donut
 * Green success vs red error, dark tooltip, centered metric.
 */
import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    return (
        <div className="bg-[#1a1a1a] border border-zinc-700 rounded-lg px-3 py-2.5 shadow-xl text-xs">
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: item.payload.color }} />
                <span className="text-zinc-300">{item.name}</span>
            </div>
            <p className="text-zinc-100 font-bold text-sm mt-1 tabular-nums">
                {Number(item.value).toLocaleString()} reqs
            </p>
        </div>
    );
};

export function ErrorRateChart({ stats }) {
    const isEmpty = !stats || (stats.successHits === 0 && stats.errorHits === 0);

    const data = useMemo(() => [
        { name: 'Success (2xx)', value: stats?.successHits ?? 0, color: '#22c55e' },
        { name: 'Errors (4xx/5xx)', value: stats?.errorHits ?? 0, color: '#ef4444' },
    ].filter(d => d.value > 0), [stats]);

    const successPct = stats
        ? (100 - stats.errorRate).toFixed(1)
        : '0';

    return (
        <div className="bg-[#111111] border border-zinc-800/60 rounded-xl p-5 flex flex-col h-full">
            <div className="mb-4">
                <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-0.5">
                    Status Distribution
                </p>
                <p className="text-sm font-semibold text-zinc-200">
                    Success vs Error ratio
                </p>
            </div>

            {isEmpty ? (
                <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
                    No data
                </div>
            ) : (
                <div className="flex-1 relative">
                    <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius="60%"
                                outerRadius="80%"
                                paddingAngle={3}
                                dataKey="value"
                                stroke="none"
                                startAngle={90}
                                endAngle={-270}
                            >
                                {data.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Center metric */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <p className="text-2xl font-black text-zinc-100 tabular-nums">{successPct}%</p>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Success</p>
                    </div>
                </div>
            )}

            {/* Legend */}
            {!isEmpty && (
                <div className="flex items-center justify-center gap-5 mt-4 pt-4 border-t border-zinc-800/60">
                    {data.map(d => (
                        <div key={d.name} className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                            <span className="text-[11px] text-zinc-500">{d.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
