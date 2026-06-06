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

// ─── Latency time-series (24 points × 1h) ────────────────────────────────────
// Used by LatencyLineChart. Values intentionally non-uniform to look real.
const LATENCY_SERIES = [
    { time: '00:00', latency: 38 },
    { time: '01:00', latency: 41 },
    { time: '02:00', latency: 36 },
    { time: '03:00', latency: 33 },
    { time: '04:00', latency: 35 },
    { time: '05:00', latency: 39 },
    { time: '06:00', latency: 52 },
    { time: '07:00', latency: 71 },
    { time: '08:00', latency: 94 },  // morning traffic spike
    { time: '09:00', latency: 88 },
    { time: '10:00', latency: 63 },
    { time: '11:00', latency: 55 },
    { time: '12:00', latency: 68 },  // lunch spike
    { time: '13:00', latency: 59 },
    { time: '14:00', latency: 49 },
    { time: '15:00', latency: 53 },
    { time: '16:00', latency: 72 },
    { time: '17:00', latency: 87 },  // end-of-day spike
    { time: '18:00', latency: 61 },
    { time: '19:00', latency: 48 },
    { time: '20:00', latency: 44 },
    { time: '21:00', latency: 40 },
    { time: '22:00', latency: 37 },
    { time: '23:00', latency: 35 },
];

export const mockDashboardData = {
    success: true,
    data: {
        // ── Aggregate stats ──────────────────────────────────────────────────
        // Matches the shape of stats returned by getDashboard controller
        stats: {
            totalHits:       124853,
            avgLatency:      54.2,
            errorRate:       2.31,          // percentage
            errorHits:       2884,
            successHits:     121969,
            uniqueServices:  4,
            uniqueEndpoints: 22,
        },

        // ── Top endpoints by hit count ───────────────────────────────────────
        // Matches TopEndpoints shape: method, endpoint, serviceName, totalHits, avgLatency, errorRate
        topEndpoints: [
            {
                method:      'POST',
                endpoint:    '/api/v1/payments/process',
                serviceName: 'payment-service',
                totalHits:   48210,
                avgLatency:  121,
                errorRate:   3.2,
            },
            {
                method:      'GET',
                endpoint:    '/api/v1/users/profile',
                serviceName: 'user-service',
                totalHits:   31054,
                avgLatency:  44,
                errorRate:   0.1,
            },
            {
                method:      'GET',
                endpoint:    '/api/v1/products/list',
                serviceName: 'catalog-service',
                totalHits:   21500,
                avgLatency:  31,
                errorRate:   0.0,
            },
            {
                method:      'POST',
                endpoint:    '/api/v1/auth/login',
                serviceName: 'auth-service',
                totalHits:   18503,
                avgLatency:  82,
                errorRate:   1.5,
            },
            {
                method:      'PUT',
                endpoint:    '/api/v1/users/settings',
                serviceName: 'user-service',
                totalHits:   5586,
                avgLatency:  54,
                errorRate:   0.1,
            },
        ],

        // ── Latency time-series ──────────────────────────────────────────────
        // Used by LatencyLineChart. Array of { time: string, latency: number }.
        latencySeries: LATENCY_SERIES,
    },
};
