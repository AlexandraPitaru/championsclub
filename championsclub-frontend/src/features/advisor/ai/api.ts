import axiosInstance from "../../../services/api/axiosInstance";
import type { AIAnalysisResponse, AIForecastResponse } from "./types";

export async function fetchAdvisorAIAnalysis(): Promise<AIAnalysisResponse> {
  const res = await axiosInstance.get("/api/sales-advisor/profile/ai-analysis");
  return res.data;
}

export async function fetchAdvisorAIForecast(): Promise<AIForecastResponse> {
  const res = await axiosInstance.get("/api/sales-advisor/profile/ai-forecast-recommendations");
  return res.data;
}

export async function refreshAdvisorAIInsights(): Promise<{
  analysis: AIAnalysisResponse;
  forecast: AIForecastResponse;
}> {
  const res = await axiosInstance.post("/api/sales-advisor/profile/ai-insights/refresh");
  return res.data;
}
