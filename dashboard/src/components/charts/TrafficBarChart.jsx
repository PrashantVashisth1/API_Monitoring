/**
 * TrafficBarChart.jsx — API Traffic Summary
 * Orange accent, clean minimal grid, dark tooltip.
 */
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const BARS = [
    { name: 'Total',   key: 'totalHits',   color: '#f97316' }, // orange-500
    { name: 'Success', key: 'successHits', color: '#22c55e' }, // green-500
    { name: 'Errors',  key: 'errorHits',   color: '#ef4444' }, // red-500
];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#1a1a1a] border border-zinc-700 rounded-lg px-3 py-2.5 shadow-xl text-xs">
            <p className="text-zinc-400 font-mono mb-1.5">{label}</p>
            {payload.map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
                    <span className="text-zinc-300">{p.name}:</span>
                    <span className="text-zinc-100 font-semibold tabular-nums">{Number(p.value).toLocaleString()}</span>
                </div>
            ))}
        </div>
    );
};

export function TrafficBarChart({ stats }) {
    const isEmpty = !stats || stats.totalHits === 0;

    const data = useMemo(() =>
        BARS.map(b => ({ name: b.name, value: stats?.[b.key] ?? 0, color: b.color })),
    [stats]);

    return (
        <div className="bg-[#111111] border border-zinc-800/60 rounded-xl p-5">
            <div className="mb-5">
                <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-0.5">
                    API Traffic Summary
                </p>
                <p className="text-sm font-semibold text-zinc-200">
                    Total · Success · Error distribution
                </p>
            </div>

            {isEmpty ? (
                <div className="flex items-center justify-center h-[260px] text-zinc-600 text-sm">
                    No traffic data yet
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="#1f1f1f" strokeDasharray="0" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#52525b', fontSize: 11, fontWeight: 500 }}
                            dy={8}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#52525b', fontSize: 11 }}
                            tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1f1f1f' }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56}>
                            {data.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
