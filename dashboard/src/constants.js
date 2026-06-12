export const QUERY_KEYS = {
    // Note: dashboard queries now include timeWindow: ['dashboard', '24H']
    // Use queryClient.invalidateQueries({ queryKey: ['dashboard'] }) for partial match
    DASHBOARD:     ['dashboard'],
    STATS:         ['stats'],
    TOP_ENDPOINTS: ['topEndpoints'],
    TIME_SERIES:   ['timeSeries'],
};

export const REFETCH_INTERVAL = 30_000;
