export const dashboardKpis = [
  {
    title: "Total Points",
    value: "12,480",
    delta: "+8.2%",
    status: "positive",
  },
  {
    title: "Sales vs Target",
    value: "92%",
    delta: "-3.1%",
    status: "negative",
  },
  {
    title: "Active Advisors",
    value: "48",
    delta: "+4",
    status: "positive",
  },
  {
    title: "Engagement Score",
    value: "78/100",
    delta: "+5.6%",
    status: "positive",
  },
];

export const performanceTrend = [
  { week: "W1", sales: 72, target: 68 },
  { week: "W2", sales: 78, target: 70 },
  { week: "W3", sales: 74, target: 72 },
  { week: "W4", sales: 81, target: 74 },
  { week: "W5", sales: 77, target: 76 },
  { week: "W6", sales: 73, target: 78 },
  { week: "W7", sales: 84, target: 80 },
];

export const alerts = [
  {
    id: "1",
    title: "Declining advisor performance",
    advisorId: "101",
    advisorName: "David Enache",
    dealership: "Iasi East",
    summary:
      "Financing conversion is down 14% in the last 10 days and points are below team pace.",
    severity: "high",
  },
  {
    id: "2",
    title: "Dealership under target",
    advisorId: "102",
    advisorName: "Ioana Matei",
    dealership: "Timisoara West",
    summary:
      "Service bundle attachment dropped and the dealership is 8% under monthly pace.",
    severity: "medium",
  },
  {
    id: "3",
    title: "Low engagement risk",
    advisorId: "103",
    advisorName: "Radu Pavel",
    dealership: "Constanta South",
    summary:
      "Challenge participation is slipping and momentum is slowing compared with last week.",
    severity: "low",
  },
];

export const leaderboard = [
  {
    id: "101",
    name: "Mara Ionescu",
    dealership: "Bucharest North",
    points: 1240,
    tier: "Gold",
  },
  {
    id: "102",
    name: "Andrei Pop",
    dealership: "Cluj Center",
    points: 1130,
    tier: "Silver",
  },
  {
    id: "103",
    name: "Ioana Matei",
    dealership: "Timisoara West",
    points: 1045,
    tier: "Silver",
  },
];

export const advisorOptions: Array<{ id: number; name: string }> = [];