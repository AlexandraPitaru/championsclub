import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BookOpen, Lightbulb, Sparkles, Target, TrendingUp } from "lucide-react";
import AppShell from "../app/layouts/AppShell";
import AICoachNote from "../features/advisor/ai/AICoachNote";
import AIExplainerCard from "../features/advisor/ai/AIExplainerCard";
import AIForecastCard from "../features/advisor/ai/AIForecastCard";
import AIImprovementsList from "../features/advisor/ai/AIImprovementsList";
import AIJourneyStepper, {
  type AIJourneyStep,
} from "../features/advisor/ai/AIJourneyStepper";
import AIRecommendedActionsCard from "../features/advisor/ai/AIRecommendedActionsCard";
import AIRecommendedTrainingsCard from "../features/advisor/ai/AIRecommendedTrainingsCard";
import AIRefreshControls from "../features/advisor/ai/AIRefreshControls";
import AISkillsAnalysisCard from "../features/advisor/ai/AISkillsAnalysisCard";
import AIStepNavigation from "../features/advisor/ai/AIStepNavigation";
import AIStrengthsList from "../features/advisor/ai/AIStrengthsList";
import AIWelcomeHero from "../features/advisor/ai/AIWelcomeHero";
import { useManagerAIAnalysis } from "../features/manager/ai/useManagerAIAnalysis";
import { useManagerAIForecast } from "../features/manager/ai/useManagerAIForecast";
import { refreshManagerAIInsights } from "../features/manager/ai/api";
import { useAIRefresh } from "../features/advisor/ai/useAIRefresh";
import type { AIForecastResponse } from "../features/advisor/ai/types";

type StepId =
  | "welcome"
  | "strengths"
  | "improvements"
  | "skills"
  | "forecast"
  | "actions"
  | "trainings"
  | "summary";

type JourneyEntry = AIJourneyStep & {
  id: StepId;
  description: string;
  hint: string;
  accentText: string;
};

const journey: JourneyEntry[] = [
  {
    id: "welcome",
    label: "Start",
    shortLabel: "Start",
    description: "Welcome message from your Team Coach.",
    hint: "This is the entry point of your team coaching tour. Click 'Start the tour' to begin.",
    accentText: "text-amber-200",
  },
  {
    id: "strengths",
    label: "Team strengths",
    shortLabel: "Strengths",
    description: "What your team is doing really well.",
    hint: "Areas where your team excels. These are the foundations you can build on and share across the team.",
    accentText: "text-emerald-200",
  },
  {
    id: "improvements",
    label: "Growth areas",
    shortLabel: "Improve",
    description: "Where your team can grow together.",
    hint: "Not weaknesses — opportunities. Each one tells you the next concrete step to coach your team on.",
    accentText: "text-amber-200",
  },
  {
    id: "skills",
    label: "Team skills",
    shortLabel: "Skills",
    description: "Strong skills vs skills to develop across your team.",
    hint: "A snapshot of your team's capabilities. Strong skills show where you have expertise. Skills to develop are good candidates for team training.",
    accentText: "text-cyan-200",
  },
  {
    id: "forecast",
    label: "Team forecast",
    shortLabel: "Forecast",
    description: "Where your team is heading at the current pace.",
    hint: "If your team keeps doing what they do today, this is what we expect. Confidence tells you how sure the AI is — based on how much data we had.",
    accentText: "text-cyan-200",
  },
  {
    id: "actions",
    label: "Top actions",
    shortLabel: "Actions",
    description: "The most useful things for your team to do this week.",
    hint: "Ordered by priority. Each action shows the expected impact and how to implement it across your team.",
    accentText: "text-cyan-200",
  },
  {
    id: "trainings",
    label: "Recommended trainings",
    shortLabel: "Trainings",
    description: "Trainings that match your team's skill gaps.",
    hint: "Picked specifically for the skills your team wants to develop. 'Recommended now' means the highest impact for your team this week.",
    accentText: "text-violet-200",
  },
  {
    id: "summary",
    label: "Coach note",
    shortLabel: "Wrap up",
    description: "A short, motivating wrap-up for your team.",
    hint: "Final motivational note. Come back tomorrow to see your team's progress.",
    accentText: "text-amber-200",
  },
];

const FORECAST_FALLBACK: AIForecastResponse = {
  is_fallback: true,
  fallback_reason: "insufficient_data",
  generated_at: new Date().toISOString(),
  model_version: "team-coach-fallback",
  forecast: {
    trend: "stable",
    next_rank_likelihood: { probability_pct: 0, label: "low" },
    confidence_pct: 35,
    confidence_label: "low",
    forecast_summary: "Forecast is temporarily unavailable. You can still explore team analysis and skills insights.",
    main_factors: [],
    recommended_focus: "Refresh insights after backend data is available.",
    projected_points_in_window: 0,
    projected_points_target: 0,
    days_window: 30,
    history_used_days: 90,
  },
  risk_areas: [],
  recommended_actions: [],
  recommended_trainings: [],
  recommendation_summary: "No forecast recommendations are available right now.",
};

const ManagerTeamCoachPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentStepId, setCurrentStepId] = useState<StepId>("welcome");
  const [completed, setCompleted] = useState<StepId[]>([]);

  const {
    data: analysisData,
    isLoading: isLoadingAnalysis,
    isError: isErrorAnalysis,
  } = useManagerAIAnalysis();
  const { data: forecastData, isLoading: isLoadingForecast, isError: isErrorForecast } = useManagerAIForecast();

  const analysis = !isLoadingAnalysis && !isErrorAnalysis && analysisData ? analysisData : undefined;
  const forecast = !isLoadingForecast && !isErrorForecast && forecastData ? forecastData : FORECAST_FALLBACK;

  const { refreshing, cooldown, refresh } = useAIRefresh(async () => {
    const refreshed = await refreshManagerAIInsights();
    queryClient.setQueryData(["manager-ai-analysis"], refreshed.analysis);
    queryClient.setQueryData(["manager-ai-forecast"], refreshed.forecast);
  });

  const currentIndex = journey.findIndex((s) => s.id === currentStepId);
  const currentStep = journey[currentIndex];

  const goTo = (id: StepId) => {
    setCompleted((prev) =>
      prev.includes(currentStepId) ? prev : [...prev, currentStepId],
    );
    setCurrentStepId(id);
  };

  const goNext = () => {
    if (currentIndex < journey.length - 1) {
      goTo(journey[currentIndex + 1].id);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentStepId(journey[currentIndex - 1].id);
    }
  };

  const stepperSteps = useMemo(
    () =>
      journey.map((s) => ({
        id: s.id,
        label: s.label,
        shortLabel: s.shortLabel,
      })),
    [],
  );

  // Fallback UI după hook-uri
  if (isErrorAnalysis && !analysisData) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-2xl font-bold text-rose-400 mb-4">Team Coach unavailable</h2>
          <p className="mb-2" style={{ color: "var(--text)" }}>We couldn't load your team's AI analysis. Please try again later.</p>
        </div>
      </AppShell>
    );
  }

  if (!analysis) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-xl font-semibold text-cyan-300 mb-2">Loading team insights...</h2>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {isErrorForecast && (
          <div className="rounded-2xl border border-amber-300/35 bg-amber-300/10 p-4 text-sm text-amber-100">
            Forecast details are temporarily unavailable. Team analysis is still available.
          </div>
        )}

        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/80">
              Manager Dashboard
            </p>
            <h1 className="mt-1 text-3xl font-bold text-cyan-100">Team Coach</h1>
            <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--text-muted)" }}>
              A guided tour of your team's performance. No jargon — just what's working,
              what to improve, and what actions to take next.
            </p>
          </div>

          <AIRefreshControls
            onRefresh={refresh}
            refreshing={refreshing}
            refreshCooldownSeconds={cooldown}
          />
        </section>

        <AIJourneyStepper
          steps={stepperSteps}
          currentStepId={currentStepId}
          completedStepIds={completed}
          onSelect={(id) => setCurrentStepId(id as StepId)}
        />

        {currentStepId === "welcome" && (
          <AIWelcomeHero
            summary={analysis.ai_summary}
            generatedAt={analysis.generated_at}
            modelVersion={analysis.model_version}
            onStart={() => goTo("strengths")}
          />
        )}

        {currentStepId === "strengths" && (
          <AIExplainerCard
            title={currentStep.description}
            hint={currentStep.hint}
            icon={<TrendingUp className={`h-5 w-5 ${currentStep.accentText}`} />}
          >
            <AIStrengthsList strengths={analysis.strengths} />
          </AIExplainerCard>
        )}

        {currentStepId === "improvements" && (
          <AIExplainerCard
            title={currentStep.description}
            hint={currentStep.hint}
            icon={<Target className={`h-5 w-5 ${currentStep.accentText}`} />}
          >
            <AIImprovementsList items={analysis.improvement_areas} />
          </AIExplainerCard>
        )}

        {currentStepId === "skills" && (
          <AIExplainerCard
            title={currentStep.description}
            hint={currentStep.hint}
            icon={<Lightbulb className={`h-5 w-5 ${currentStep.accentText}`} />}
          >
            <AISkillsAnalysisCard data={analysis.skills_analysis} />
          </AIExplainerCard>
        )}

        {currentStepId === "forecast" && (
          <AIExplainerCard
            title={currentStep.description}
            hint={currentStep.hint}
            icon={<TrendingUp className={`h-5 w-5 ${currentStep.accentText}`} />}
          >
            <div className="grid grid-cols-1 gap-5">
              <AIForecastCard forecast={forecast.forecast} />
            </div>
          </AIExplainerCard>
        )}

        {currentStepId === "actions" && (
          <AIExplainerCard
            title={currentStep.description}
            hint={currentStep.hint}
            icon={<Target className={`h-5 w-5 ${currentStep.accentText}`} />}
          >
            <AIRecommendedActionsCard items={forecast.recommended_actions} />
          </AIExplainerCard>
        )}

        {currentStepId === "trainings" && (
          <AIExplainerCard
            title={currentStep.description}
            hint={currentStep.hint}
            icon={<BookOpen className={`h-5 w-5 ${currentStep.accentText}`} />}
          >
            <AIRecommendedTrainingsCard items={forecast.recommended_trainings} />
          </AIExplainerCard>
        )}

        {currentStepId === "summary" && (
          <AIExplainerCard
            title={currentStep.description}
            hint={currentStep.hint}
            icon={<Sparkles className={`h-5 w-5 ${currentStep.accentText}`} />}
          >
            <AICoachNote
              motivationalSummary={analysis.motivational_summary}
              recommendationSummary={forecast.recommendation_summary}
            />
          </AIExplainerCard>
        )}

        {currentStepId !== "welcome" && (
          <AIStepNavigation
            onPrev={goPrev}
            onNext={currentIndex === journey.length - 1 ? () => navigate("/dashboard") : goNext}
            isFirstStep={currentIndex === 0}
            isLastStep={currentIndex === journey.length - 1}
            prevLabel={
              currentIndex > 0
                ? `Back: ${journey[currentIndex - 1].shortLabel}`
                : "Back"
            }
            nextLabel={
              currentIndex < journey.length - 1
                ? `Next: ${journey[currentIndex + 1].shortLabel}`
                : "Done"
            }
          />
        )}
      </div>
    </AppShell>
  );
};

export default ManagerTeamCoachPage;
