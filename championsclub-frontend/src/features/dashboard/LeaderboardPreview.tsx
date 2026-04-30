import Card from "../../components/ui/Card";

type LeaderboardItem = {
  id: string;
  name: string;
  dealership: string;
  points: number;
  tier: string;
};

type LeaderboardPreviewProps = {
  items: LeaderboardItem[];
};

export default function LeaderboardPreview({
  items,
}: LeaderboardPreviewProps) {
  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-cyan-100">
          Leaderboard Preview
        </h3>
        <p className="text-sm text-slate-400">Top performing advisors</p>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-xl border border-[#22354d] bg-[#0c192b] p-4"
          >
            <div>
              <p className="font-semibold text-slate-100">
                #{index + 1} {item.name}
              </p>
              <p className="text-sm text-slate-400">{item.dealership}</p>
            </div>

            <div className="text-right">
              <p className="font-bold text-cyan-100">{item.points} pts</p>
              <p className="text-sm text-slate-400">{item.tier}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}