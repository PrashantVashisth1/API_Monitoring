/**
 * mockDashboardData.js
 *
 * Realistic telemetry payload served to guest/demo users.
 * Shape MUST exactly mirror the real API response from:
 *   GET /api/analytics/dashboard (AnalyticsController → getDashboard)
 *
 * Usage: imported by useDashboardQuery.js, served when user.isGuest === true.
 * No backend calls are made for guests — this prevents 401 Unauthorized errors.
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────
const hoursAgo = (h) => new Date(Date.now() - h * 3_600_000).toISOString();

// ─── Latency time-series (24 hourly buckets) ──────────────────────────────────
// Shape matches getAggregatedTimeSeries: { timeBucket, avgLatency, totalHits, errorHits }
const RECENT_ACTIVITY = Array.from({ length: 24 }, (_, i) => {
    // i=0 is 23 hours ago, i=23 is the current hour
    const latencyByHour = [38, 41, 36, 33, 35, 39, 52, 71, 94, 88, 63, 55,
                           68, 59, 49, 53, 72, 87, 61, 48, 44, 40, 37, 35];
    const hitsPattern   = [120, 90, 70, 60, 65, 100, 180, 320, 580, 490,
                           340, 280, 410, 370, 300, 310, 430, 510, 380, 250, 200, 170, 140, 110];
    return {
        timeBucket: hoursAgo(23 - i),
        avgLatency: latencyByHour[i],
        totalHits:  hitsPattern[i],
        errorHits:  Math.floor(hitsPattern[i] * 0.023),
    };
});

// ─── Mock live traffic rows ────────────────────────────────────────────────────
// Shape matches what getTimeSeries returns (per-endpoint time-bucketed rows)
export const mockTrafficData = [
    { serviceName: 'payment-service',  endpoint: '/api/v1/payments/process',   method: 'POST',   totalHits: 248, errorHits: 8,  avgLatency: '121.40', minLatency: '85.00',  maxLatency: '320.00', timeBucket: hoursAgo(0) },
    { serviceName: 'user-service',     endpoint: '/api/v1/users/profile',       method: 'GET',    totalHits: 192, errorHits: 1,  avgLatency: '44.10',  minLatency: '20.00',  maxLatency: '98.00',  timeBucket: hoursAgo(0) },
    { serviceName: 'catalog-service',  endpoint: '/api/v1/products/list',       method: 'GET',    totalHits: 176, errorHits: 0,  avgLatency: '31.70',  minLatency: '15.00',  maxLatency: '62.00',  timeBucket: hoursAgo(0) },
    { serviceName: 'auth-service',     endpoint: '/api/v1/auth/login',          method: 'POST',   totalHits: 134, errorHits: 5,  avgLatency: '82.30',  minLatency: '51.00',  maxLatency: '195.00', timeBucket: hoursAgo(0) },
    { serviceName: 'payment-service',  endpoint: '/api/v1/payments/refund',     method: 'POST',   totalHits: 23,  errorHits: 2,  avgLatency: '145.80', minLatency: '90.00',  maxLatency: '410.00', timeBucket: hoursAgo(1) },
    { serviceName: 'user-service',     endpoint: '/api/v1/users/settings',      method: 'PUT',    totalHits: 87,  errorHits: 0,  avgLatency: '54.20',  minLatency: '28.00',  maxLatency: '101.00', timeBucket: hoursAgo(1) },
    { serviceName: 'catalog-service',  endpoint: '/api/v1/products/:id',        method: 'GET',    totalHits: 310, errorHits: 3,  avgLatency: '28.40',  minLatency: '12.00',  maxLatency: '55.00',  timeBucket: hoursAgo(1) },
    { serviceName: 'notification-svc', endpoint: '/api/v1/notifications/push',  method: 'POST',   totalHits: 56,  errorHits: 1,  avgLatency: '63.90',  minLatency: '40.00',  maxLatency: '120.00', timeBucket: hoursAgo(2) },
    { serviceName: 'auth-service',     endpoint: '/api/v1/auth/refresh',        method: 'POST',   totalHits: 445, errorHits: 2,  avgLatency: '38.70',  minLatency: '22.00',  maxLatency: '75.00',  timeBucket: hoursAgo(2) },
    { serviceName: 'payment-service',  endpoint: '/api/v1/payments/status/:id', method: 'GET',    totalHits: 189, errorHits: 0,  avgLatency: '96.30',  minLatency: '60.00',  maxLatency: '210.00', timeBucket: hoursAgo(3) },
];

export const mockDashboardData = {
    success: true,
    data: {
        // ── Aggregate stats ──────────────────────────────────────────────────
        stats: {
            totalHits:       124853,
            avgLatency:      54.2,
            errorRate:       2.31,
            errorHits:       2884,
            successHits:     121969,
            uniqueServices:  4,
            uniqueEndpoints: 22,
        },

        // ── Top endpoints by hit count ───────────────────────────────────────
        topEndpoints: [
            { method: 'POST', endpoint: '/api/v1/payments/process',  serviceName: 'payment-service', totalHits: 48210, avgLatency: 121, errorRate: 3.2 },
            { method: 'GET',  endpoint: '/api/v1/users/profile',      serviceName: 'user-service',    totalHits: 31054, avgLatency: 44,  errorRate: 0.1 },
            { method: 'GET',  endpoint: '/api/v1/products/list',      serviceName: 'catalog-service', totalHits: 21500, avgLatency: 31,  errorRate: 0.0 },
            { method: 'POST', endpoint: '/api/v1/auth/login',         serviceName: 'auth-service',    totalHits: 18503, avgLatency: 82,  errorRate: 1.5 },
            { method: 'PUT',  endpoint: '/api/v1/users/settings',     serviceName: 'user-service',    totalHits: 5586,  avgLatency: 54,  errorRate: 0.1 },
        ],

        // ── Aggregated latency time-series (matches getAggregatedTimeSeries) ──
        // Used by LatencyLineChart. Each entry: { timeBucket, avgLatency, totalHits, errorHits }
        recentActivity: RECENT_ACTIVITY,
    },
};
