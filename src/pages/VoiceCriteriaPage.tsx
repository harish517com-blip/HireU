import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
  Sliders,
  Plus,
  Trash2,
  Edit2,
  Save,
  Check,
  Zap,
  Volume2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Criterion, CriterionType } from '../types';

export const VoiceCriteriaPage: React.FC = () => {
  const { criteria, updateCriteriaList, setActiveView } = useApp();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState(
    'I need a Java developer with at least two years of experience. Spring Boot is mandatory. AWS is preferred. Don\'t shortlist anyone with more than a three-month notice period.'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedCriteria, setExtractedCriteria] = useState<Criterion[]>(criteria);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Simulate or use Web Speech API recording
  const handleToggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      // If WebSpeech is available
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let current = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          if (current) setTranscript(current);
        };

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
      } else {
        // Fallback simulation for browsers/iframes without speech permissions
        setTimeout(() => {
          setTranscript(
            'We urgently need a Java developer with at least 2 years of experience. Spring Boot is strictly mandatory. AWS experience preferred. Notice period maximum 90 days.'
          );
          setIsRecording(false);
        }, 3000);
      }
    }
  };

  const handleProcessVoice = async () => {
    if (!transcript.trim()) return;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/gemini/voice-criteria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.criteria && Array.isArray(data.criteria)) {
          const newCriteriaList: Criterion[] = data.criteria.map((c: any, idx: number) => ({
            id: `crit_voice_${Date.now()}_${idx}`,
            jobId: 'job_java_dev_01',
            name: c.name,
            category: c.category || 'skill',
            type: (c.type || 'mandatory').toLowerCase() === 'mandatory' ? 'mandatory' : 'preferred',
            operator: c.operator || 'contains',
            value: c.value,
            unit: c.unit,
            weight: c.weight || 20,
            explanation: c.explanation || 'Extracted from voice instruction',
            enabled: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));

          setExtractedCriteria(newCriteriaList);
        }
      }
    } catch (err) {
      console.error('Error in voice criteria extraction:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyToCandidatePool = () => {
    updateCriteriaList(extractedCriteria);
    alert('Hiring criteria applied! All candidates re-screened.');
    setActiveView('filtered-candidates');
  };

  const handleUpdateCriterionField = (id: string, field: keyof Criterion, val: any) => {
    setExtractedCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: val } : c))
    );
  };

  const handleDeleteCriterion = (id: string) => {
    setExtractedCriteria((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddBlankCriterion = () => {
    const newCrit: Criterion = {
      id: `crit_manual_${Date.now()}`,
      jobId: 'job_java_dev_01',
      name: 'New Skill Requirement',
      category: 'skill',
      type: 'preferred',
      operator: 'contains',
      value: 'True',
      weight: 15,
      explanation: 'Manually added requirement',
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setExtractedCriteria((prev) => [...prev, newCrit]);
    setEditingId(newCrit.id);
  };

  const mandatoryList = extractedCriteria.filter((c) => c.type === 'mandatory');
  const preferredList = extractedCriteria.filter((c) => c.type === 'preferred');

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Mic className="w-5 h-5 text-indigo-600" />
            Voice Criteria Extraction
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Speak or type hiring requirements to extract mandatory gates and preferred criteria.
          </p>
        </div>

        <button
          onClick={handleApplyToCandidatePool}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Apply Criteria & Rescreen</span>
        </button>
      </div>

      {/* Voice Recorder & Transcript Bar */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-800">
            Voice Instruction Transcript
          </label>
          {isRecording && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-600">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              Recording...
            </span>
          )}
        </div>

        <div className="relative">
          <textarea
            rows={3}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Click the microphone and state your criteria verbally, or edit this text..."
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:border-indigo-500 outline-none leading-relaxed font-medium"
          />
          <button
            onClick={handleToggleRecording}
            className={`absolute right-3 bottom-3 p-2.5 rounded-full text-white shadow-xs transition-colors cursor-pointer ${
              isRecording ? 'bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
            title={isRecording ? 'Stop Recording' : 'Start Voice Recording'}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] text-slate-400">
            e.g., &quot;Java developer with at least 2 years experience, Spring Boot mandatory, AWS preferred.&quot;
          </p>
          <button
            onClick={handleProcessVoice}
            disabled={isProcessing || !transcript.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
          >
            {isProcessing ? (
              <span>Extracting...</span>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Extract Criteria</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Extracted Criteria Editor (Mandatory vs Preferred) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Column 1: Mandatory Criteria */}
        <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-indigo-950 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Mandatory Criteria ({mandatoryList.length})
              </h3>
              <p className="text-[10px] text-slate-500">Hard gates: Candidate fails if ANY mandatory is missing.</p>
            </div>
            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase">
              Non-negotiable
            </span>
          </div>

          <div className="space-y-3">
            {mandatoryList.map((crit) => (
              <div
                key={crit.id}
                className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/30 hover:border-indigo-300 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{crit.name}</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() =>
                        handleUpdateCriterionField(
                          crit.id,
                          'type',
                          crit.type === 'mandatory' ? 'preferred' : 'mandatory'
                        )
                      }
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-600 text-white cursor-pointer"
                    >
                      Make Preferred
                    </button>
                    <button
                      onClick={() => handleDeleteCriterion(crit.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500">Operator</label>
                    <select
                      value={crit.operator}
                      onChange={(e) => handleUpdateCriterionField(crit.id, 'operator', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-xs"
                    >
                      <option value="contains">contains</option>
                      <option value=">=">&gt;=</option>
                      <option value="<=">&lt;=</option>
                      <option value="equals">equals</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500">Value</label>
                    <input
                      type="text"
                      value={String(crit.value)}
                      onChange={(e) => handleUpdateCriterionField(crit.id, 'value', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-xs font-semibold"
                    />
                  </div>
                </div>

                {crit.explanation && (
                  <p className="text-[10px] text-slate-500 italic">Why: {crit.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Preferred Criteria */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Preferred Criteria ({preferredList.length})
              </h3>
              <p className="text-[10px] text-slate-500">Nice-to-have additions that boost match score.</p>
            </div>
            <button
              onClick={handleAddBlankCriterion}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          <div className="space-y-3">
            {preferredList.map((crit) => (
              <div
                key={crit.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{crit.name}</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() =>
                        handleUpdateCriterionField(
                          crit.id,
                          'type',
                          crit.type === 'mandatory' ? 'preferred' : 'mandatory'
                        )
                      }
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 cursor-pointer"
                    >
                      Make Mandatory
                    </button>
                    <button
                      onClick={() => handleDeleteCriterion(crit.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500">Operator</label>
                    <select
                      value={crit.operator}
                      onChange={(e) => handleUpdateCriterionField(crit.id, 'operator', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-xs"
                    >
                      <option value="contains">contains</option>
                      <option value=">=">&gt;=</option>
                      <option value="<=">&lt;=</option>
                      <option value="equals">equals</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500">Value</label>
                    <input
                      type="text"
                      value={String(crit.value)}
                      onChange={(e) => handleUpdateCriterionField(crit.id, 'value', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-xs font-semibold"
                    />
                  </div>
                </div>

                {crit.explanation && (
                  <p className="text-[10px] text-slate-500 italic">Why: {crit.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
