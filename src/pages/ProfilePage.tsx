import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Building2, Mail, Shield, Save, CheckCircle2, Sparkles, FileText } from 'lucide-react';
import { Criterion } from '../types';

export const ProfilePage: React.FC = () => {
  const { currentUser, updateHRProfile, job, updateJobDetails, updateCriteriaList } = useApp();

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [workEmail, setWorkEmail] = useState(currentUser?.workEmail || '');
  const [companyName, setCompanyName] = useState(currentUser?.companyName || '');
  const [role, setRole] = useState(currentUser?.role || '');

  const [jobTitle, setJobTitle] = useState(job.title);
  const [jobDept, setJobDept] = useState(job.department);
  const [jobMinExp, setJobMinExp] = useState(job.minExperienceYears.toString());

  const [jdText, setJdText] = useState(job.description || '');
  const [generatingCriteria, setGeneratingCriteria] = useState(false);
  const [criteriaGeneratedSuccess, setCriteriaGeneratedSuccess] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateHRProfile({
      fullName,
      workEmail,
      companyName,
      role,
    });
    updateJobDetails({
      title: jobTitle,
      department: jobDept,
      minExperienceYears: parseInt(jobMinExp) || 0,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleGenerateCriteriaFromJD = async () => {
    if (!jdText) return;
    setGeneratingCriteria(true);

    try {
      const res = await fetch('/api/gemini/generate-criteria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, jobDescription: jdText }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.criteria && Array.isArray(data.criteria)) {
          const formattedCriteria: Criterion[] = data.criteria.map((c: any, idx: number) => ({
            id: `crit_gen_${Date.now()}_${idx}`,
            jobId: job.id,
            name: c.name,
            category: c.category || 'skill',
            type: (c.type || 'mandatory').toLowerCase() as any,
            operator: c.operator || 'contains',
            value: c.value,
            unit: c.unit,
            weight: c.weight || 20,
            explanation: c.explanation || 'Extracted from JD',
            enabled: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));

          updateCriteriaList(formattedCriteria);
          updateJobDetails({ title: jobTitle, description: jdText });
          setCriteriaGeneratedSuccess(true);
          setTimeout(() => setCriteriaGeneratedSuccess(false), 4000);
        }
      }
    } catch (err) {
      console.error('Error generating criteria:', err);
    } finally {
      setGeneratingCriteria(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-indigo-600" />
            HR Profile & Workspace Configuration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your personal recruiter settings, active job details, and screening policy thresholds.
          </p>
        </div>
        {savedSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3 py-1.5 rounded-xl font-semibold animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Settings saved successfully!
          </div>
        )}
      </div>

      <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
              {fullName.charAt(0) || 'H'}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Personal Details</h2>
              <p className="text-xs text-slate-500">Your recruiter credentials in HireU</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={workEmail}
                  onChange={(e) => setWorkEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Company / Organization</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Designation / Role</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
                required
              />
            </div>
          </div>
        </div>

        {/* Active Role Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Active Recruitment Role</h2>
              <p className="text-xs text-slate-500">Configure default candidate screening parameters</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Job Title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Department</label>
              <input
                type="text"
                value={jobDept}
                onChange={(e) => setJobDept(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Min. Mandatory Experience (Years)</label>
              <input
                type="number"
                min="0"
                max="25"
                value={jobMinExp}
                onChange={(e) => setJobMinExp(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-colors text-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save Workspace Changes</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* AI Criteria Generation Module */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Generate Criteria from Job Description</h2>
              <p className="text-xs text-slate-500">Extract mandatory gates and preferred parameters automatically</p>
            </div>
          </div>
          {criteriaGeneratedSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Criteria generated & updated!
            </div>
          )}
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Job Description (JD) / Requirement Text
            </label>
            <textarea
              rows={5}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste job description text here to automatically extract mandatory gates and preferred skills..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleGenerateCriteriaFromJD}
              disabled={generatingCriteria || !jdText.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-2 cursor-pointer transition-colors"
            >
              {generatingCriteria ? (
                <span>Extracting AI Criteria...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Screening Criteria</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
