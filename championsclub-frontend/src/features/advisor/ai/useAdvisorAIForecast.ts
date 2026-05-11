import { useQuery } from "@tanstack/react-query";
import { fetchAdvisorAIForecast } from "./api";

export function useAdvisorAIForecast() {
  return useQuery({
    queryKey: ["advisor-ai-forecast"],
    queryFn: fetchAdvisorAIForecast,
    staleTime: 5 * 60 * 1000,
  });
}
