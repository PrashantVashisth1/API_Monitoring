import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/api';
import { QUERY_KEYS, REFETCH_INTERVAL } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { mockDashboardData } from '../utils/mockDashboardData';

export function useDashboardQuery(options = {}) {
    const { user } = useAuth();
    const isGuest = user?.isGuest === true;

    return useQuery({
        queryKey: QUERY_KEYS.DASHBOARD,
        queryFn: async () => {
            if (isGuest) {
                // Simulate network delay for realism
                await new Promise(resolve => setTimeout(resolve, 800));
                return mockDashboardData;
            }
            return analyticsApi.getDashboard();
        },
        refetchInterval: isGuest ? false : REFETCH_INTERVAL, // Don't refetch mock data
        ...options,
    });
}

