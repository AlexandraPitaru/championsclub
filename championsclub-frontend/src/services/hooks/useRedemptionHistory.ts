import { useQuery } from "@tanstack/react-query";

import { getRedemptionHistory, type RedemptionHistoryRecord } from "../api/shopService";


export function useRedemptionHistory(userId?: number) {
  return useQuery<RedemptionHistoryRecord[]>({
    queryKey: ["shop-redemptions", userId],
    queryFn: async () => {
      const response = await getRedemptionHistory(userId!);
      return response.redemptions;
    },
    enabled: typeof userId === "number",
  });
}
