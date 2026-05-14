import { useQuery } from "@tanstack/react-query";
import { fetchManagerAIAnalysis } from "./api";

export function useManagerAIAnalysis() {
  return useQuery({
    queryKey: ["manager-ai-analysis"],
    queryFn: fetchManagerAIAnalysis,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
