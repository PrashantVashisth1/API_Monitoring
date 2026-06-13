/**
 * OverviewPage.jsx — Main dashboard overview
 *
 * Layout:
 *   • Page header with status indicator
 *   • 6 KPI cards (StatsGrid)
 *   • 2-column charts row: TrafficBarChart (2/3) + ErrorRateChart (1/3)
 *   • 2-column row: LatencyLineChart (2/3) + TopEndpoints (1/3)
 */
import { useDashboardQuery } from '../hooks/useDashboardQuery';
import StatsGrid from '../components/StatsGrid';
import TopEndpoints from '../components/TopEndpoints';
import { TrafficBarChart } from '../components/charts/TrafficBarChart';
import { LatencyLineChart } from '../components/charts/LatencyLineChart';
import { ErrorRateChart } from '../components/charts/ErrorRateChart';
import { PageStatus } from '../components/ui';

export function OverviewPage() {
    const { data, isPending, error, refetch } = useDashboardQuery();

    const stats = data?.data?.stats ?? null;
    const topEndpoints = data?.data?.topEndpoints ?? [];

    // Backend sends recentActivity as aggregated hourly series (ISO timestamps with Z):
    // [{ timeBucket: "2026-06-12T18:30:00.000Z", avgLatency, totalHits, errorHits }]
    // LatencyLineChart expects: [{ time: 'HH:MM', latency: number }]
    const rawSeries = data?.data?.recentActivity ?? [];
    const latencySeries = rawSeries.map((row) => ({
        time: row.timeBucket,
        latency: Math.round(parseFloat(row.avgLatency) || 0),
    }));


    if (isPending || error || !data) {
        return (
            <PageStatus
                isLoading={isPending || !data}
                error={error}
                onRetry={refetch}
                loadingText="Loading dashboard..."
                errorText="Failed to load dashboard data"
            />
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* ── Page header ─────────────────────────────────────────── */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-semibold text-orange-500 uppercase tracking-widest">
                            ■ Dashboard
                        </span>
                    </div>
                    <h1 className="text-xl font-black text-zinc-100 tracking-tight">
                        API Telemetry Overview
                    </h1>
                    <p className="text-sm text-zinc-600 mt-0.5">
                        Real-time performance across all monitored services
                    </p>
                </div>
            </div>

            {/* ── KPI Cards ────────────────────────────────────────────── */}
            <StatsGrid stats={stats} />

            {/* ── Charts row 1 ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <TrafficBarChart stats={stats} />
                </div>
                <div className="lg:col-span-1">
                    <ErrorRateChart stats={stats} />
                </div>
            </div>

            {/* ── Charts row 2: Latency (full width) ───────────────────── */}
            <LatencyLineChart data={latencySeries} />

            {/* ── Top Endpoints (full width) ───────────────────────────── */}
            <TopEndpoints endpoints={topEndpoints} />
        </div>
    );
}
