import { useQuery } from "@tanstack/react-query";

import type { ShopOverviewResponse } from "../api/shopService";
import { getShopOverview } from "../api/shopService";


export function useShopOverview(userId?: number) {
  return useQuery<ShopOverviewResponse>({
    queryKey: ["shop-overview", userId],
    queryFn: () => getShopOverview(userId!),
    enabled: typeof userId === "number",
  });
}
