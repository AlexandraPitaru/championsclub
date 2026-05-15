import axiosInstance from "../../../services/api/axiosInstance";
import type { AIAnalysisResponse, AIForecastResponse } from "../../advisor/ai/types";

export async function fetchManagerAIAnalysis(): Promise<AIAnalysisResponse> {
  const res = await axiosInstance.get("/api/manager/ai-analysis");
  return res.data;
}

export async function fetchManagerAIForecast(): Promise<AIForecastResponse> {
  const res = await axiosInstance.get("/api/manager/ai-forecast-recommendations");
  return res.data;
}

export async function refreshManagerAIInsights(): Promise<{
  analysis: AIAnalysisResponse;
  forecast: AIForecastResponse;
}> {
  const res = await axiosInstance.post("/api/manager/ai-insights/refresh");
  return res.data;
}
