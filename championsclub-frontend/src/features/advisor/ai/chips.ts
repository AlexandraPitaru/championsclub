import type { AIPriority, AICategory, AIImpact } from "./types";

export function priorityChipClass(priority: AIPriority): string {
  switch (priority) {
    case "high":
      return "border-rose-300/40 bg-rose-400/10 text-rose-200";
    case "medium":
      return "border-amber-300/40 bg-amber-400/10 text-amber-200";
    default:
      return "border-cyan-300/40 bg-cyan-400/10 text-cyan-200";
  }
}

export function categoryChipClass(category: AICategory | string): string {
  switch (category) {
    case "skills":
      return "border-violet-300/40 bg-violet-400/10 text-violet-200";
    case "conversion":
      return "border-emerald-300/40 bg-emerald-400/10 text-emerald-200";
    case "activity":
      return "border-sky-300/40 bg-sky-400/10 text-sky-200";
    case "follow_up":
      return "border-fuchsia-300/40 bg-fuchsia-400/10 text-fuchsia-200";
    default:
      return "border-slate-400/40 bg-slate-500/10 text-slate-200";
  }
}

export function impactDotClass(impact: AIImpact): string {
  if (impact === "positive") return "bg-emerald-400";
  if (impact === "negative") return "bg-rose-400";
  return "bg-slate-400";
}

export function formatRelative(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diffMin = Math.max(1, Math.round((Date.now() - d.getTime()) / 60000));
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleString();
}

export function formatCategory(category: AICategory | string): string {
  return category.replace("_", " ");
}
