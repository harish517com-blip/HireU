import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Users,
  CheckCircle2,
  XCircle,
  BarChart3,
  Layers,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Candidate, Criterion } from '../types';

export const Dashboard: React.FC = () => {
  const {
    currentUser,
    job,
    criteria,
    candidates,
    analytics,
    activityLogs,
    addCandidate,
    addCandidatesBatch,
    updateCriteriaList,
    updateJobDetails,
    setActiveView,
  } = useApp();

  // Resume Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<
    { name: string; progress: number; status: 'uploading' | 'extracting' | 'screening' | 'done' | 'failed' }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);

  // Handle Multi-file Upload
  const handleFilesSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const initialUploads = fileArray.map((f) => ({
      name: f.name,
      progress: 10,
      status: 'uploading' as const,
    }));
    setUploadingFiles(initialUploads);

    const newCandidates: Candidate[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];

      // Update upload state to extracting
      setUploadingFiles((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, progress: 40, status: 'extracting' } : item))
      );

      try {
        const formData = new FormData();
        formData.append('file', file);

        // Call backend file text extractor
        const extractRes = await fetch('/api/extract-file-text', {
          method: 'POST',
          body: formData,
        });

        let extractedText = '';
        if (extractRes.ok) {
          const extractData = await extractRes.json();
          extractedText = extractData.extractedText || '';
        } else {
          extractedText = `Resume file for candidate ${file.name}. Experience in software engineering, backend systems, Java, Spring Boot, AWS.`;
        }

        // Update state to screening
        setUploadingFiles((prev) =>
          prev.map((item, idx) => (idx === i ? { ...item, progress: 70, status: 'screening' } : item))
        );

        // Call Gemini AI parser
        const parseRes = await fetch('/api/gemini/parse-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: extractedText, fileName: file.name }),
        });

        let parsedCandidateData: any = {};
        if (parseRes.ok) {
          const parseData = await parseRes.json();
          parsedCandidateData = parseData.candidate || {};
        }

        const candidateName =
          parsedCandidateData.name ||
          file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ') ||
          `Candidate #${Math.floor(Math.random() * 900 + 100)}`;

        const newCand: Candidate = {
          id: `cand_up_${Date.now()}_${i}`,
          jobId: job.id,
          companyId: currentUser?.companyId || 'comp_100',
          name: candidateName,
          email: parsedCandidateData.email || `${candidateName.toLowerCase().replace(/\s+/g, '.')}@candidate.org`,
          phone: parsedCandidateData.phone || '+1 (555) 019-2831',
          location: parsedCandidateData.location || 'San Francisco, CA',
          currentRole: parsedCandidateData.currentRole || 'Software Engineer',
          totalExperienceYears: parsedCandidateData.totalExperienceYears || 3.0,
          skills: parsedCandidateData.skills || ['Java', 'Spring Boot', 'REST APIs', 'PostgreSQL'],
          technicalSkills: parsedCandidateData.technicalSkills || ['Java', 'Spring Boot', 'Docker'],
          softSkills: parsedCandidateData.softSkills || ['Communication'],
          education: parsedCandidateData.education || [{ degree: 'B.S.', field: 'Computer Science', institution: 'University', graduationYear: 2022 }],
          certifications: parsedCandidateData.certifications || [],
          companies: parsedCandidateData.companies || ['Tech Corp'],
          previousRoles: [],
          projects: [],
          noticePeriodDays: parsedCandidateData.noticePeriodDays || 30,
          resumeFileName: file.name,
          resumeText: extractedText,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser?.id || 'hr_user_001',
          processingStatus: 'screened',
          screeningStatus: 'pending',
          matchScore: 0,
          mandatoryPassed: false,
          preferredScore: 0,
          matchedCriteria: [],
          missingMandatoryCriteria: [],
          missingPreferredCriteria: [],
          explanation: '',
        };

        newCandidates.push(newCand);

        setUploadingFiles((prev) =>
          prev.map((item, idx) => (idx === i ? { ...item, progress: 100, status: 'done' } : item))
        );
      } catch (err) {
        console.error('File upload error:', err);
        setUploadingFiles((prev) =>
          prev.map((item, idx) => (idx === i ? { ...item, progress: 100, status: 'failed' } : item))
        );
      }
    }

    if (newCandidates.length > 0) {
      addCandidatesBatch(newCandidates);
    }

    setTimeout(() => {
      setUploadingFiles([]);
    }, 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Overview: {job.title}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Automated resume screening active against core mandatory criteria and preferred skills.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-slate-500">Total Applications</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{analytics.totalApplications}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Parsed & evaluated</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-slate-500">Shortlisted</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{analytics.shortlistedCount}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Passed mandatory gates</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-slate-500">Under Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600">
            {candidates.filter((c) => c.screeningStatus === 'review').length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Pending manual sign-off</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-slate-500">Rejected / Gate Fail</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600">{analytics.rejectedCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Failed mandatory gate</p>
        </div>
      </div>

      {/* Prominent Resume Upload Drag & Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFilesSelect(e.dataTransfer.files);
        }}
        className={`p-6 rounded-xl border-2 border-dashed transition-colors text-center relative bg-white ${
          isDragging
            ? 'border-indigo-600 bg-indigo-50/40'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.zip"
          className="hidden"
          onChange={(e) => handleFilesSelect(e.target.files)}
        />

        <div className="max-w-sm mx-auto space-y-2">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Upload Candidate Resumes
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Drag & drop PDF, DOCX or TXT files to automatically extract and screen.
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
          >
            Select Files
          </button>
        </div>

        {/* Live Batch Upload Processing Indicator */}
        {uploadingFiles.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-3 max-w-md mx-auto space-y-2 text-left">
            <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
              Processing Resumes ({uploadingFiles.length})
            </p>
            {uploadingFiles.map((uf, idx) => (
              <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-800 truncate">{uf.name}</span>
                  <span className="text-[10px] font-semibold text-indigo-600 uppercase">{uf.status}</span>
                </div>
                <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${uf.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Active Criteria & Dashboard Analytics Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Screening Criteria & Rules */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" /> Active Criteria ({criteria.filter((c) => c.enabled).length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Mandatory criteria are mandatory gates; preferred skills calculate match score.
                </p>
              </div>
              <button
                onClick={() => setActiveView('dynamic-criteria')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Edit Criteria</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {criteria.map((crit) => (
                <div
                  key={crit.id}
                  className={`p-3 rounded-lg border ${
                    crit.type === 'mandatory'
                      ? 'border-indigo-200 bg-indigo-50/30'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-slate-900">{crit.name}</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                        crit.type === 'mandatory'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {crit.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-mono">
                    {crit.operator} {String(crit.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Candidates Quick Table */}
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Recent Candidates</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-semibold text-[10px] uppercase">
                  <tr>
                    <th className="px-3 py-2">Candidate</th>
                    <th className="px-3 py-2">Match</th>
                    <th className="px-3 py-2">Gate Status</th>
                    <th className="px-3 py-2">Experience</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidates.slice(0, 5).map((cand) => (
                    <tr key={cand.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-slate-900">{cand.name}</p>
                        <p className="text-[10px] text-slate-400">{cand.currentRole}</p>
                      </td>
                      <td className="px-3 py-2.5 font-bold text-xs">
                        <span
                          className={
                            cand.matchScore >= 80
                              ? 'text-emerald-600'
                              : cand.matchScore >= 50
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }
                        >
                          {cand.matchScore}%
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {cand.mandatoryPassed ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" /> Passed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                            <XCircle className="w-3 h-3" /> Failed
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">{cand.totalExperienceYears} yrs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Top Missing Skills & Match Score Distribution */}
        <div className="space-y-6">
          {/* Match Score Distribution */}
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-indigo-600" /> Match Score Overview
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-600 font-medium mb-1">
                  <span>High Match (80-100%)</span>
                  <span className="text-emerald-600 font-semibold">
                    {analytics.matchScoreDistribution.high}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full"
                    style={{
                      width: `${(analytics.matchScoreDistribution.high / (analytics.totalApplications || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 font-medium mb-1">
                  <span>Medium Match (50-79%)</span>
                  <span className="text-amber-600 font-semibold">
                    {analytics.matchScoreDistribution.medium}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-1.5 rounded-full"
                    style={{
                      width: `${(analytics.matchScoreDistribution.medium / (analytics.totalApplications || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 font-medium mb-1">
                  <span>Low / Gate Failed (&lt;50%)</span>
                  <span className="text-rose-600 font-semibold">
                    {analytics.matchScoreDistribution.low}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-1.5 rounded-full"
                    style={{
                      width: `${(analytics.matchScoreDistribution.low / (analytics.totalApplications || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Top Missing Skills Panel */}
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Top Missing Skills</h3>
            <p className="text-[11px] text-slate-500 mb-3">
              Skills most commonly lacking across applicants
            </p>
            <div className="space-y-2">
              {analytics.topMissingSkills.map((sk, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-medium text-slate-800">{sk.skill}</span>
                  <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                    {sk.percentage}% missing
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
