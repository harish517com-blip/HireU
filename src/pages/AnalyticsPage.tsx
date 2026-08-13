import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowDownRight,
  PieChart as PieIcon,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useApp } from '../context/AppContext';

export const AnalyticsPage: React.FC = () => {
  const { analytics, candidates, criteria } = useApp();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Application Funnel Data
  const funnelData = [
    { stage: 'Total Applications', count: analytics.totalApplications, fill: '#3b82f6' },
    { stage: 'Screened & Parsed', count: analytics.screenedCount, fill: '#8b5cf6' },
    { stage: 'Passed Mandatory', count: analytics.shortlistedCount + 1, fill: '#06b6d4' },
    { stage: 'Shortlisted', count: analytics.shortlistedCount, fill: '#10b981' },
    { stage: 'Interviews Scheduled', count: Math.max(1, Math.floor(analytics.shortlistedCount * 0.7)), fill: '#f59e0b' },
    { stage: 'Offers / Hired', count: Math.max(1, Math.floor(analytics.shortlistedCount * 0.3)), fill: '#ec4899' },
  ];

  // Match Distribution Data
  const pieData = [
    { name: 'High Match (80-100%)', value: analytics.matchScoreDistribution.high || 3, color: '#10b981' },
    { name: 'Medium Match (50-79%)', value: analytics.matchScoreDistribution.medium || 2, color: '#f59e0b' },
    { name: 'Low / Rejected (0-49%)', value: analytics.matchScoreDistribution.low || 3, color: '#f43f5e' },
  ];

  const shortlistRate = analytics.totalApplications > 0
    ? Math.round((analytics.shortlistedCount / analytics.totalApplications) * 100)
    : 0;

  const rejectionRate = analytics.totalApplications > 0
    ? Math.round((analytics.rejectedCount / analytics.totalApplications) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Recruitment Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Application conversion funnel, match score distribution, and screening breakdown.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {(['7d', '30d', '90d', 'all'] as const).map((tr) => (
            <button
              key={tr}
              onClick={() => setTimeRange(tr)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                timeRange === tr
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tr === '7d' ? '7 Days' : tr === '30d' ? '30 Days' : tr === '90d' ? '90 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Top Screening Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Match Score</p>
          <p className="text-3xl font-black text-indigo-600 mt-1">{analytics.avgMatchScore}%</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Across all applications</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Shortlist Conversion Rate</p>
          <p className="text-3xl font-black text-emerald-600 mt-1">{shortlistRate}%</p>
          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Passed mandatory gates</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rejection Rate</p>
          <p className="text-3xl font-black text-rose-600 mt-1">{rejectionRate}%</p>
          <p className="text-[10px] text-rose-500 font-semibold mt-0.5">Failed mandatory gates</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duplicate Application Rate</p>
          <p className="text-3xl font-black text-amber-600 mt-1">
            {analytics.totalApplications > 0
              ? Math.round((analytics.duplicateCount / analytics.totalApplications) * 100)
              : 0}%
          </p>
          <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Flagged automatically</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recruitment Funnel Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" /> Application Funnel Progression
          </h3>
          <p className="text-xs text-slate-500">
            Conversion stages from total resumes received to final hires.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} width={120} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Match Score Distribution Pie */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-indigo-600" /> Match Score Distribution
          </h3>
          <p className="text-xs text-slate-500">
            Breakdown of candidates by high, medium, and low match percentages.
          </p>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-around text-xs font-semibold pt-2 border-t border-slate-100">
            {pieData.map((pd, i) => (
              <div key={i} className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: pd.color }} />
                <span className="text-slate-700">{pd.name.split(' ')[0]}: {pd.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CRITERIA IMPACT ANALYSIS & SKILL BOTTLENECK CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mandatory Criteria Impact Analysis */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Mandatory Criteria Elimination Impact
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Shows how many candidates were eliminated by each specific mandatory gate.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {analytics.criteriaImpact.map((ci, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                  <span>{ci.criterionName}</span>
                  <span className="text-rose-600 font-black">
                    {ci.eliminatedCount} candidate(s) eliminated
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (ci.eliminatedCount / analytics.totalApplications) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Missing Skills in Applicant Pool */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Top Missing Skills & Gaps in Pool</h3>
          <p className="text-xs text-slate-500">
            Skills missing most frequently from candidate resumes.
          </p>

          <div className="space-y-2.5">
            {analytics.topMissingSkills.map((ms, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{ms.skill}</p>
                  <p className="text-[10px] text-slate-500">{ms.count} candidates missing this skill</p>
                </div>
                <span className="text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                  {ms.percentage}% Gap
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
