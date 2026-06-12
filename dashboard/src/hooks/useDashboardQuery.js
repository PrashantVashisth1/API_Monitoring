import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/api';
import { REFETCH_INTERVAL } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useTimeWindow } from '../contexts/TimeWindowContext';
import { mockDashboardData } from '../utils/mockDashboardData';

export function useDashboardQuery(options = {}) {
    const { user } = useAuth();
    const { timeWindow, getTimeRange } = useTimeWindow();
    const isGuest = user?.isGuest === true;

    return useQuery({
        // Include timeWindow in key so changing the window triggers a fresh fetch
        queryKey: ['dashboard', timeWindow],
        queryFn: async () => {
            if (isGuest) {
                // Simulate network delay for realism
                await new Promise(resolve => setTimeout(resolve, 800));
                return mockDashboardData;
            }
            const { startTime, endTime } = getTimeRange();
            return analyticsApi.getDashboard({ startTime, endTime });
        },
        refetchInterval: isGuest ? false : REFETCH_INTERVAL,
        ...options,
    });
}
