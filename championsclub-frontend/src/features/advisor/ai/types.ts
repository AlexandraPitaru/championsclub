// Shared types for AI Coach sections.
// Match contracts of:
//   GET  /api/sales-advisor/profile/ai-analysis
//   GET  /api/sales-advisor/profile/ai-forecast-recommendations
//   POST /api/sales-advisor/profile/ai-insights/refresh

export type AIInterval = "week" | "month" | "all";

export type AIPriority = "low" | "medium" | "high";
export type AICategory = "skills" | "activity" | "conversion" | "follow_up";
export type AIImpact = "positive" | "negative" | "neutral";
export type AIWeight = "low" | "medium" | "high";

export type AIFallbackReason = "ai_unavailable" | "insufficient_data" | null;

export type AIBaseMeta = {
  is_fallback: boolean;
  fallback_reason: AIFallbackReason;
  generated_at: string;
  model_version: string;
};

export type AIStrength = {
  title: string;
  description: string;
  supporting_reason: string;
  metric_evidence: string | null;
};

export type AIImprovementArea = {
  title: string;
  description: string;
  reason: string;
  suggested_next_step: string;
  priority: AIPriority;
  category: AICategory;
  expected_points_gain: number | null;
};

export type AISkill = {
  name: string;
  level_pct: number;
};

export type AISkillsAnalysis = {
  strong_skills: AISkill[];
  skills_to_develop: AISkill[];
  summary: string;
};

export type AIAnalysisResponse = AIBaseMeta & {
  ai_summary: string;
  tone: "coaching";
  strengths: AIStrength[];
  improvement_areas: AIImprovementArea[];
  skills_analysis: AISkillsAnalysis;
  motivational_summary: string;
};

export type AIForecastFactor = {
  title: string;
  impact: AIImpact;
  weight: AIWeight;
  explanation: string;
};

export type AIForecast = {
  trend: "upward" | "stable" | "downward";
  next_rank_likelihood: { probability_pct: number; label: AIPriority };
  confidence_pct: number;
  confidence_label: AIPriority;
  forecast_summary: string;
  main_factors: AIForecastFactor[];
  recommended_focus: string;
  projected_points_in_window: number;
  projected_points_target: number;
  days_window: number;
  history_used_days: number;
};

export type AIRiskArea = {
  title: string;
  description: string;
  reason: string;
  mitigation_action: string;
  priority: AIPriority;
  severity: AIPriority;
  category: AICategory;
  expected_points_loss: number | null;
};

export type AIRecommendedAction = {
  title: string;
  description: string;
  reason: string;
  expected_impact: string;
  priority: AIPriority;
  category: AICategory;
  expected_points_gain: number | null;
  time_estimate_minutes: number | null;
  cta_label: string;
  cta_target: "leads" | "trainings" | "profile" | "leaderboard" | null;
};

export type AIRecommendedTraining = {
  title: string;
  description: string;
  related_skill: string;
  reason: string;
  expected_benefit: string;
  priority: AIPriority;
  duration_minutes: number;
  level: "beginner" | "intermediate" | "advanced";
  is_recommended_now: boolean;
  cta_target: "training_external_url" | "training_internal" | null;
};

export type AIForecastResponse = AIBaseMeta & {
  forecast: AIForecast;
  risk_areas: AIRiskArea[];
  recommended_actions: AIRecommendedAction[];
  recommended_trainings: AIRecommendedTraining[];
  recommendation_summary: string;
};
