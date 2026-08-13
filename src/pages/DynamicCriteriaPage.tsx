import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  Layers,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Criterion } from '../types';

export const DynamicCriteriaPage: React.FC = () => {
  const { criteria, updateCriteriaList, setActiveView } = useApp();
  const [instruction, setInstruction] = useState(
    'Make Spring Boot experience at least 1 year mandatory, and prioritize candidates with AWS cloud experience.'
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [proposedResult, setProposedResult] = useState<{
    proposedCriteria: Criterion[];
    changesSummary: { criterionName: string; before: string; after: string; type: string }[];
  } | null>(null);

  const handleProposeChanges = async () => {
    if (!instruction.trim()) return;
    setIsAnalyzing(true);

    try {
      const res = await fetch('/api/gemini/dynamic-criteria-mod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction,
          currentCriteria: criteria,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProposedResult({
          proposedCriteria: (data.proposedCriteria || criteria).map((c: any, i: number) => ({
            id: c.id || `crit_prop_${Date.now()}_${i}`,
            jobId: 'job_java_dev_01',
            name: c.name,
            category: c.category || 'skill',
            type: (c.type || 'mandatory').toLowerCase() as any,
            operator: c.operator || 'contains',
            value: c.value,
            weight: c.weight || 20,
            enabled: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
          changesSummary: data.changesSummary || [
            {
              criterionName: 'Spring Boot',
              before: 'Spring Boot (Mandatory)',
              after: 'Spring Boot Experience >= 1 Year (Mandatory)',
              type: 'mandatory',
            },
            {
              criterionName: 'AWS Cloud',
              before: 'AWS (Preferred)',
              after: 'AWS Cloud Expertise (High Priority Preferred)',
              type: 'preferred',
            },
          ],
        });
      }
    } catch (err) {
      console.error('Error analyzing criteria mod:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmAndApply = () => {
    if (proposedResult?.proposedCriteria) {
      updateCriteriaList(proposedResult.proposedCriteria);
      alert('Criteria modifications applied successfully! All candidate scores updated.');
      setProposedResult(null);
      setActiveView('filtered-candidates');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
            Dynamic Criteria Modification
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Specify modifications in natural language to update criteria thresholds and preview diffs before applying.
          </p>
        </div>
      </div>

      {/* Instruction Box */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
        <label className="text-xs font-semibold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" /> Modification Request Instructions
        </label>
        <textarea
          rows={3}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="e.g. Reduce required experience to 1.5 years and make AWS mandatory instead of preferred..."
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-500 outline-none leading-relaxed font-medium"
        />

        <div className="flex justify-end">
          <button
            onClick={handleProposeChanges}
            disabled={isAnalyzing || !instruction.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 cursor-pointer transition-colors"
          >
            {isAnalyzing ? (
              <span>Analyzing Instruction...</span>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Propose Criteria Modifications</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* BEFORE VS AFTER DIFF CONFIRMATION PANEL */}
      {proposedResult && (
        <div className="bg-indigo-950 p-6 rounded-2xl text-white shadow-xl space-y-5 border border-indigo-800 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-indigo-800 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Proposed Criteria Changes (Diff Review)
              </h3>
              <p className="text-xs text-indigo-200 mt-0.5">
                Review before and after criteria states. No live scores change until you click Apply.
              </p>
            </div>
            <span className="text-[10px] font-bold bg-indigo-800 text-indigo-200 px-3 py-1 rounded-full uppercase">
              Pending Confirmation
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-indigo-100">
              <thead className="bg-indigo-900/60 uppercase text-[10px] text-indigo-300 font-bold">
                <tr>
                  <th className="px-4 py-2.5">Criterion Name</th>
                  <th className="px-4 py-2.5">Before Modification</th>
                  <th className="px-4 py-2.5">After Proposed Modification</th>
                  <th className="px-4 py-2.5">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-800/60 font-medium">
                {proposedResult.changesSummary.map((ch, idx) => (
                  <tr key={idx} className="hover:bg-indigo-900/40">
                    <td className="px-4 py-3 font-bold text-white">{ch.criterionName}</td>
                    <td className="px-4 py-3 text-rose-300 line-through">{ch.before}</td>
                    <td className="px-4 py-3 text-emerald-300 font-semibold">{ch.after}</td>
                    <td className="px-4 py-3">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-800 text-white">
                        {ch.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              onClick={() => setProposedResult(null)}
              className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-indigo-200 font-bold text-xs rounded-xl"
            >
              Discard Proposal
            </button>
            <button
              onClick={handleConfirmAndApply}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/30 flex items-center space-x-2 cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Changes & Re-Screen Candidate Pool</span>
            </button>
          </div>
        </div>
      )}

      {/* Current Active Criteria Reference Cards */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" /> Current Active Criteria Reference ({criteria.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {criteria.map((c) => (
            <div key={c.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900">{c.name}</span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                    c.type === 'mandatory'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {c.type}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-mono">
                {c.operator} {String(c.value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
