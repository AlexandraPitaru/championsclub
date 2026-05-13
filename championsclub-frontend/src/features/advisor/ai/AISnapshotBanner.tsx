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
    <section className="relative overflow-hidden rounded-[26px] border p-6" style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}>
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-full border border-amber-300/45 bg-amber-300/15 shadow-[0_0_22px_rgba(251,191,36,0.28)]">
            <Sparkles className="h-5 w-5 text-amber-200" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
              AI Performance Snapshot
            </p>
            <h2 className="mt-1 text-lg font-semibold" style={{ color: "var(--text-h)" }}>
              Where you stand today
            </h2>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm leading-6" style={{ color: "var(--text)" }}>{summary}</p>
          <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
            Generated {formatRelative(generatedAt)} · model {modelVersion}
          </p>
        </div>
      </div>
    </section>
  );
}
