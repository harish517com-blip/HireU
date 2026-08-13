import React, { useState } from 'react';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Sliders,
  Layers,
  Zap,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Criterion } from '../types';
import { evaluateCandidateAgainstCriteria } from '../utils/screeningEngine';

export const SimulatorPage: React.FC = () => {
  const { criteria, candidates, updateCriteriaList, setActiveView } = useApp();

  // Local simulated criteria state (does NOT touch real criteria until confirmed)
  const [simulatedCriteria, setSimulatedCriteria] = useState<Criterion[]>(
    JSON.parse(JSON.stringify(criteria))
  );

  const totalPool = candidates.length;

  // Evaluate candidate pool against current live criteria
  const currentShortlisted = candidates.filter((c) => c.mandatoryPassed && c.matchScore >= 55).length;

  // Evaluate candidate pool against local simulated criteria
  const simulatedCandidates = candidates.map((cand) => {
    const res = evaluateCandidateAgainstCriteria(cand, simulatedCriteria);
    return {
      ...cand,
      simulatedPassed: res.mandatoryPassed && res.overallScore >= 55,
      simulatedScore: res.overallScore,
    };
  });

  const simulatedShortlisted = simulatedCandidates.filter((c) => c.simulatedPassed).length;
  const countChange = simulatedShortlisted - currentShortlisted;

  // Generate impact rows for scenario comparison table
  const scenarioRows = [
    {
      label: 'Current Live Criteria',
      count: currentShortlisted,
      change: 0,
      impact: 'Baseline',
    },
    {
      label: 'Simulated Scenario (Active Below)',
      count: simulatedShortlisted,
      change: countChange,
      impact:
        countChange === 0
          ? 'No Change'
          : countChange > 0
          ? `+${countChange} Increase`
          : `${countChange} Decrease`,
    },
    {
      label: 'Hypothetical: AWS Made Mandatory',
      count: candidates.filter(
        (c) =>
          c.skills.some((s) => s.toLowerCase().includes('aws')) &&
          c.totalExperienceYears >= 2 &&
          c.noticePeriodDays <= 90
      ).length,
      change:
        candidates.filter(
          (c) =>
            c.skills.some((s) => s.toLowerCase().includes('aws')) &&
            c.totalExperienceYears >= 2 &&
            c.noticePeriodDays <= 90
        ).length - currentShortlisted,
      impact: 'Large Decrease',
    },
    {
      label: 'Hypothetical: Experience Relaxed to >= 1 Year',
      count: candidates.filter(
        (c) =>
          c.totalExperienceYears >= 1 &&
          c.skills.some((s) => s.toLowerCase().includes('java')) &&
          c.noticePeriodDays <= 90
      ).length,
      change:
        candidates.filter(
          (c) =>
            c.totalExperienceYears >= 1 &&
            c.skills.some((s) => s.toLowerCase().includes('java')) &&
            c.noticePeriodDays <= 90
        ).length - currentShortlisted,
      impact: 'Moderate Increase',
    },
  ];

  const handleToggleSimulatedCriterionType = (id: string) => {
    setSimulatedCriteria((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              type: c.type === 'mandatory' ? 'preferred' : 'mandatory',
            }
          : c
      )
    );
  };

  const handleUpdateSimulatedValue = (id: string, newVal: any) => {
    setSimulatedCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, value: newVal } : c))
    );
  };

  const handleResetSimulator = () => {
    setSimulatedCriteria(JSON.parse(JSON.stringify(criteria)));
  };

  const handleApplySimulatedCriteriaToLive = () => {
    updateCriteriaList(simulatedCriteria);
    alert('Simulated criteria officially applied to live recruitment engine!');
    setActiveView('filtered-candidates');
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            What-If Hiring Simulator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Simulate relaxing or tightening criteria to predict shortlist volume before applying to live data.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetSimulator}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleApplySimulatedCriteriaToLive}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply to Live</span>
          </button>
        </div>
      </div>

      {/* Simulation Result Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase">Current Live Shortlist</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{currentShortlisted}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Out of {totalPool} candidate resumes</p>
        </div>

        <div className="bg-indigo-950 p-5 rounded-2xl text-white shadow-md border border-indigo-800">
          <p className="text-xs font-bold text-indigo-300 uppercase">Simulation Result</p>
          <p className="text-3xl font-black text-emerald-400 mt-1">{simulatedShortlisted}</p>
          <p className="text-[10px] text-indigo-200 mt-0.5">Under simulated criteria</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase">Impact Volume Change</p>
          <p
            className={`text-3xl font-black mt-1 ${
              countChange > 0
                ? 'text-emerald-600'
                : countChange < 0
                ? 'text-rose-600'
                : 'text-slate-700'
            }`}
          >
            {countChange > 0 ? `+${countChange}` : countChange}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {countChange === 0
              ? 'No difference from baseline'
              : countChange > 0
              ? 'Expanded candidate pipeline'
              : 'Restricted candidate pipeline'}
          </p>
        </div>
      </div>

      {/* Scenario Impact Comparison Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-600" /> Scenario Impact Analysis Matrix
        </h3>
        <p className="text-xs text-slate-500">
          Compare candidate yield across various criteria adjustment options.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-2.5">Criteria Combination / Scenario</th>
                <th className="px-4 py-2.5">Candidates Yield</th>
                <th className="px-4 py-2.5">Volume Change</th>
                <th className="px-4 py-2.5">Impact Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {scenarioRows.map((sr, idx) => (
                <tr
                  key={idx}
                  className={idx === 1 ? 'bg-indigo-50/60 font-bold text-indigo-950' : 'hover:bg-slate-50'}
                >
                  <td className="px-4 py-3">{sr.label}</td>
                  <td className="px-4 py-3 font-extrabold">{sr.count}</td>
                  <td className="px-4 py-3">
                    {sr.change === 0 ? '—' : sr.change > 0 ? `+${sr.change}` : sr.change}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sr.impact.includes('Increase')
                          ? 'bg-emerald-100 text-emerald-800'
                          : sr.impact.includes('Decrease')
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {sr.impact}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Criteria Simulation Tweak Board */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Adjust Criteria Below To See Real-time Yield</h3>
        <p className="text-xs text-slate-500">
          Toggle criteria between Mandatory vs Preferred or edit threshold values to recalculate simulation instantly.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {simulatedCriteria.map((crit) => (
            <div
              key={crit.id}
              className={`p-3.5 rounded-xl border transition-all ${
                crit.type === 'mandatory'
                  ? 'border-indigo-200 bg-indigo-50/30'
                  : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-slate-900">{crit.name}</span>
                <button
                  onClick={() => handleToggleSimulatedCriterionType(crit.id)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                    crit.type === 'mandatory'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {crit.type === 'mandatory' ? 'Type: Mandatory (Gate)' : 'Type: Preferred'}
                </button>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-500 text-[10px] font-semibold">Value:</span>
                <input
                  type="text"
                  value={String(crit.value)}
                  onChange={(e) => handleUpdateSimulatedValue(crit.id, e.target.value)}
                  className="bg-white border border-slate-200 px-2 py-1 rounded text-xs font-semibold text-slate-900 w-32"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
