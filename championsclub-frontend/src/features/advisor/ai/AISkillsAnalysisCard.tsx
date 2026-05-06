import { Lightbulb } from "lucide-react";
import Card from "../../../components/ui/Card";
import type { AISkill, AISkillsAnalysis } from "./types";

function SkillBar({
  skill,
  variant,
}: {
  skill: AISkill;
  variant: "strong" | "develop";
}) {
  const valueColor = variant === "strong" ? "text-emerald-300" : "text-amber-300";
  const barGradient =
    variant === "strong"
      ? "bg-gradient-to-r from-emerald-400 to-cyan-300"
      : "bg-gradient-to-r from-amber-400 to-rose-300";

  return (
    <li>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-200">{skill.name}</span>
        <span className={valueColor}>{skill.level_pct}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#0d1a2b]">
        <div
          className={`h-full rounded-full ${barGradient}`}
          style={{ width: `${skill.level_pct}%` }}
        />
      </div>
    </li>
  );
}

type Props = { data: AISkillsAnalysis };

export default function AISkillsAnalysisCard({ data }: Props) {
  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-cyan-300" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
            Skills analysis
          </h3>
        </div>
        <p className="text-xs text-slate-400">{data.summary}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
            Strong skills
          </p>
          <ul className="mt-3 space-y-3">
            {data.strong_skills.map((sk) => (
              <SkillBar key={sk.name} skill={sk} variant="strong" />
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">
            Skills to develop
          </p>
          <ul className="mt-3 space-y-3">
            {data.skills_to_develop.map((sk) => (
              <SkillBar key={sk.name} skill={sk} variant="develop" />
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
