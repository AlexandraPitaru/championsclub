
import { useQuery } from '@tanstack/react-query';
import { getAdvisorDashboardOverview } from '../api/advisorDashboardService';
import type { AdvisorDashboardOverview } from '../api/advisorDashboardService';

export function useAdvisorDashboardOverview(userId?: number) {
  return useQuery<AdvisorDashboardOverview>({
    queryKey: ['advisor-dashboard-overview', userId],
    queryFn: () => getAdvisorDashboardOverview(userId!),
    enabled: typeof userId === 'number',
  });
}
