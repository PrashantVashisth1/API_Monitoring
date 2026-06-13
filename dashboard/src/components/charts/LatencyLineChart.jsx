/**
 * LatencyLineChart.jsx — 24h Latency Trend
 * Sharp orange line, no dots, minimal grid, dark tooltip.
 */
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

// 🔥 SMART FORMATTER: Aaj ka hai toh sirf time, purana hai toh Date + Time
const formatDateTime = (val) => {
    if (!val) return '';

    const isoStr = typeof val === 'string' && val.endsWith('Z') ? val : val + 'Z';
    const d = new Date(isoStr);

    if (isNaN(d.getTime())) return val;

    const today = new Date();
    const isToday = d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();

    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    if (isToday) {
        return timeStr;
    } else {
        const dateStr = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        return `${dateStr}, ${timeStr}`;
    }
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#1a1a1a] border border-zinc-700 rounded-lg px-3 py-2.5 shadow-xl text-xs">
            {/* 🔥 Yahan label format hoga */}
            <p className="text-zinc-500 font-mono mb-1">{formatDateTime(label)}</p>
            <p className="text-zinc-100 font-bold text-sm tabular-nums">
                {payload[0]?.value}ms
            </p>
            <p className="text-zinc-500 mt-0.5">Avg Latency</p>
        </div>
    );
};

export function LatencyLineChart({ data }) {
    const isEmpty = !data || data.length === 0;
    const avg = data?.length
        ? Math.round(data.reduce((s, d) => s + d.latency, 0) / data.length)
        : 0;

    return (
        <div className="bg-[#111111] border border-zinc-800/60 rounded-xl p-5">
            <div className="flex items-start justify-between mb-5">
                <div>
                    <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-0.5">
                        Latency Trend
                    </p>
                    <p className="text-sm font-semibold text-zinc-200">
                        Average Response Time
                    </p>
                </div>
                {!isEmpty && (
                    <div className="text-right">
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Avg</p>
                        <p className="text-lg font-black text-orange-500 tabular-nums">{avg}ms</p>
                    </div>
                )}
            </div>

            {isEmpty ? (
                <div className="flex items-center justify-center h-[260px] text-zinc-600 text-sm">
                    No latency data
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid horizontal vertical={false} stroke="#1a1a1a" />
                        <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#52525b', fontSize: 10 }}
                            dy={8}
                            interval="preserveStartEnd"
                            tickFormatter={formatDateTime} // 🔥 X-Axis par format
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#52525b', fontSize: 10 }}
                            tickFormatter={(v) => `${v}ms`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1 }} />
                        <ReferenceLine
                            y={avg}
                            stroke="#f97316"
                            strokeDasharray="4 4"
                            strokeWidth={1}
                            strokeOpacity={0.4}
                        />
                        <Line
                            type="monotone"
                            dataKey="latency"
                            stroke="#f97316"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, fill: '#f97316', strokeWidth: 0 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}