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
import AIRiskAreasCard from "../features/advisor/ai/AIRiskAreasCard";
import AISkillsAnalysisCard from "../features/advisor/ai/AISkillsAnalysisCard";
import AIStepNavigation from "../features/advisor/ai/AIStepNavigation";
import AIStrengthsList from "../features/advisor/ai/AIStrengthsList";
import AIWelcomeHero from "../features/advisor/ai/AIWelcomeHero";
// import { mockAnalysis, mockForecast } from "../features/advisor/ai/mockData";
import { useAdvisorAIAnalysis } from "../features/advisor/ai/useAdvisorAIAnalysis";
import { useAdvisorAIForecast } from "../features/advisor/ai/useAdvisorAIForecast";
import { refreshAdvisorAIInsights } from "../features/advisor/ai/api";
import { useAIRefresh } from "../features/advisor/ai/useAIRefresh";

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
    description: "Welcome message from your AI Coach.",
    hint: "This is the entry point of your AI tour. Click 'Start the tour' to begin.",
    accentText: "text-amber-200",
  },
  {
    id: "strengths",
    label: "Your strengths",
    shortLabel: "Strengths",
    description: "What you are doing really well.",
    hint: "Things you already do better than average. Keep doing these — they earn you points and trust.",
    accentText: "text-emerald-200",
  },
  {
    id: "improvements",
    label: "What to improve",
    shortLabel: "Improve",
    description: "Areas where you can grow.",
    hint: "Not weaknesses — opportunities. Each one tells you the next concrete step you can take.",
    accentText: "text-amber-200",
  },
  {
    id: "skills",
    label: "Your skills",
    shortLabel: "Skills",
    description: "Strong skills vs skills to develop.",
    hint: "A snapshot of your capabilities. Strong skills are over 70%. Skills to develop are good candidates for training.",
    accentText: "text-cyan-200",
  },
  {
    id: "forecast",
    label: "Your forecast",
    shortLabel: "Forecast",
    description: "Where you are heading at the current pace.",
    hint: "If you keep doing what you do today, this is what we expect. Confidence tells you how sure the AI is — based on how much data we had.",
    accentText: "text-cyan-200",
  },
  {
    id: "actions",
    label: "Top actions",
    shortLabel: "Actions",
    description: "The most useful things to do this week.",
    hint: "Ordered by priority. Each action shows how many points you can gain and how long it takes. Click the button to jump to the right place in the app.",
    accentText: "text-cyan-200",
  },
  {
    id: "trainings",
    label: "Recommended trainings",
    shortLabel: "Trainings",
    description: "Trainings that match your skill gaps.",
    hint: "Picked specifically for the skills you want to develop. 'Recommended now' means the highest impact for you this week.",
    accentText: "text-violet-200",
  },
  {
    id: "summary",
    label: "Coach note",
    shortLabel: "Wrap up",
    description: "A short, motivating wrap-up.",
    hint: "Final motivational note. Come back tomorrow to see your progress.",
    accentText: "text-amber-200",
  },
];

const AdvisorAIProfilePage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentStepId, setCurrentStepId] = useState<StepId>("welcome");
  const [completed, setCompleted] = useState<StepId[]>([]);

  const { data: analysisData, isLoading: isLoadingAnalysis, isError: isErrorAnalysis } = useAdvisorAIAnalysis();
  const { data: forecastData, isLoading: isLoadingForecast, isError: isErrorForecast } = useAdvisorAIForecast();

  const analysis = !isLoadingAnalysis && !isErrorAnalysis && analysisData ? analysisData : undefined;
  const forecast = !isLoadingForecast && !isErrorForecast && forecastData ? forecastData : undefined;

  // Fallback UI dacă datele lipsesc

  // TOATE HOOK-URILE SUS
  const { refreshing, cooldown, refresh } = useAIRefresh(async () => {
    const refreshed = await refreshAdvisorAIInsights();
    queryClient.setQueryData(["advisor-ai-analysis"], refreshed.analysis);
    queryClient.setQueryData(["advisor-ai-forecast"], refreshed.forecast);
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
  if (isErrorAnalysis || isErrorForecast) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-2xl font-bold text-rose-400 mb-4">Sales Coach unavailable</h2>
          <p className="mb-2" style={{ color: "var(--text)" }}>We couldn't load your AI analysis or forecast. Please try again later.</p>
        </div>
      </AppShell>
    );
  }

  if (!analysis || !forecast) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-xl font-semibold text-cyan-300 mb-2">Loading AI insights...</h2>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/80">
              Sales Advisor Profile
            </p>
            <h1 className="mt-1 text-3xl font-bold text-cyan-100">Sales Coach</h1>
            <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--text-muted)" }}>
              A short guided tour of your performance. No jargon — just what's working,
              what to improve, and what to do next.
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
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <AIForecastCard forecast={forecast.forecast} />
              <AIRiskAreasCard items={forecast.risk_areas} />
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
            onNext={currentIndex === journey.length - 1 ? () => navigate("/advisor-dashboard") : goNext}
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

export default AdvisorAIProfilePage;
