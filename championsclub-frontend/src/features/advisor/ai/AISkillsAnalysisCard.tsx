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
    <div>
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
    </div>
  );
}

type Props = { data: AISkillsAnalysis };

export default function AISkillsAnalysisCard({ data }: Props) {
  // Fallback: dacă primim string-uri, le mapăm la obiecte cu level_pct=0
  const strongSkills = Array.isArray(data.strong_skills)
    ? data.strong_skills.map((sk) =>
        typeof sk === 'string'
          ? { name: sk, level_pct: 0 }
          : sk
      )
    : [];
  const skillsToDevelop = Array.isArray(data.skills_to_develop)
    ? data.skills_to_develop.map((sk) =>
        typeof sk === 'string'
          ? { name: sk, level_pct: 0 }
          : sk
      )
    : [];

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
          {strongSkills.length === 0 ? (
            <p className="mt-3 text-xs text-slate-400">No strong skills identified yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {strongSkills
                .filter(sk => sk.name && sk.level_pct !== undefined)
                .map((sk) => (
                  <li key={sk.name + '-' + sk.level_pct} className="flex items-center gap-3">
                    <div className="flex-1">
                      <SkillBar skill={sk} variant="strong" />
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">
            Skills to develop
          </p>
          {skillsToDevelop.length === 0 ? (
            <p className="mt-3 text-xs text-slate-400">No skills to develop identified.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {skillsToDevelop
                .filter(sk => sk.name && sk.level_pct !== undefined)
                .map((sk) => (
                  <li key={sk.name + '-' + sk.level_pct} className="flex items-center gap-3">
                    <div className="flex-1">
                      <SkillBar skill={sk} variant="develop" />
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
