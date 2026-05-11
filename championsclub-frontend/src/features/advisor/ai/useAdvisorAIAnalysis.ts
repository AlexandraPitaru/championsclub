import { useQuery } from "@tanstack/react-query";
import { fetchAdvisorAIAnalysis } from "./api";

export function useAdvisorAIAnalysis() {
  return useQuery({
    queryKey: ["advisor-ai-analysis"],
    queryFn: fetchAdvisorAIAnalysis,
    staleTime: 5 * 60 * 1000,
  });
}
