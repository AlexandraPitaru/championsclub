import { Sparkles } from "lucide-react";
import { formatRelative } from "./chips";

type Props = {
  summary: string;
  generatedAt: string;
  modelVersion: string;
};

export default function AISnapshotBanner({
  summary,
  generatedAt,
  modelVersion,
}: Props) {
  return (
    <section className="relative overflow-hidden rounded-[26px] border border-[#3d556f] bg-[linear-gradient(145deg,#0b1624_0%,#102033_100%)] p-6 shadow-[0_18px_38px_rgba(2,8,20,0.44)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(251,191,36,0.12),transparent_38%)]" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-full border border-amber-300/45 bg-amber-300/15 shadow-[0_0_22px_rgba(251,191,36,0.28)]">
            <Sparkles className="h-5 w-5 text-amber-200" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
              AI Performance Snapshot
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-50">
              Where you stand today
            </h2>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm leading-6 text-slate-200">{summary}</p>
          <p className="mt-3 text-xs text-slate-400">
            Generated {formatRelative(generatedAt)} · model {modelVersion}
          </p>
        </div>
      </div>
    </section>
  );
}
