import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Mail,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Star,
  Copy,
  Download,
  Sparkles,
  ArrowUpDown,
  FileText,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Candidate } from '../types';

export const FilteredCandidatesPage: React.FC = () => {
  const {
    candidates,
    duplicateGroups,
    updateCandidateStatus,
    toggleCandidateBookmark,
    addEmailLogs,
  } = useApp();

  // Filters & Sorting State
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [duplicateFilter, setDuplicateFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'score' | 'experience' | 'name'>('score');

  // Selected Candidate Modal/Slideover
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Email Dispatch Modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState(
    'Congratulations! You have been shortlisted for Senior Java Engineer at TechCorp'
  );
  const [emailBody, setEmailBody] = useState(
    'Dear {{candidate_name}},\n\nWe are pleased to inform you that your resume has passed our initial screening for the Senior Java Engineer position. Your background in Java, Spring Boot, and cloud architecture aligns excellently with our criteria.\n\nOur recruiting team will contact you shortly to schedule an technical interview.\n\nBest regards,\nHiring Team at TechCorp'
  );
  const [isSendingEmails, setIsSendingEmails] = useState(false);

  // Filter Candidates
  const filteredCandidates = candidates
    .filter((c) => {
      if (statusFilter !== 'all' && c.screeningStatus !== statusFilter) return false;
      if (duplicateFilter && !c.isDuplicate) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesRole = c.currentRole.toLowerCase().includes(q);
        const matchesSkill = c.skills.some((s) => s.toLowerCase().includes(q));
        if (!matchesName && !matchesRole && !matchesSkill) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.matchScore - a.matchScore;
      if (sortBy === 'experience') return b.totalExperienceYears - a.totalExperienceYears;
      return a.name.localeCompare(b.name);
    });

  // Export Excel
  const handleExportExcel = async () => {
    try {
      const res = await fetch('/api/export-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates: filteredCandidates, jobTitle: 'Senior Java Engineer' }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `HireU_Shortlisted_Candidates_${Date.now()}.xlsx`;
        a.click();
      } else {
        alert('Exporting candidates data...');
      }
    } catch (err) {
      console.error('Error exporting excel:', err);
    }
  };

  // Dispatch Shortlist Emails
  const handleDispatchEmails = async () => {
    const candsToEmail = candidates.filter((c) =>
      selectedCandidateIds.length > 0
        ? selectedCandidateIds.includes(c.id)
        : c.screeningStatus === 'shortlisted'
    );

    if (candsToEmail.length === 0) {
      alert('No shortlisted candidates selected for email dispatch.');
      return;
    }

    setIsSendingEmails(true);

    try {
      const res = await fetch('/api/send-shortlist-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidates: candsToEmail,
          subjectTemplate: emailSubject,
          bodyTemplate: emailBody,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.emailLogs) {
          addEmailLogs(data.emailLogs);
        }
        alert(`Successfully dispatched ${candsToEmail.length} shortlist notification emails!`);
        setShowEmailModal(false);
      }
    } catch (err) {
      console.error('Error dispatching emails:', err);
    } finally {
      setIsSendingEmails(false);
    }
  };

  const handleSelectAllShortlisted = () => {
    const shortlistedIds = candidates
      .filter((c) => c.screeningStatus === 'shortlisted')
      .map((c) => c.id);
    setSelectedCandidateIds(shortlistedIds);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Candidates Pool ({filteredCandidates.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Evaluate candidate profiles, view mandatory gate status, export records, and send notifications.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold text-xs rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => {
              handleSelectAllShortlisted();
              setShowEmailModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Send Email ({candidates.filter((c) => c.screeningStatus === 'shortlisted').length})</span>
          </button>
        </div>
      </div>

      {/* Duplicate Candidate Detection Alert Box if exists */}
      {duplicateGroups.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-rose-950">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-rose-900">
                {duplicateGroups.length} Duplicate Candidate Group(s) Detected
              </p>
              <p className="text-rose-700 text-[11px] mt-0.5">
                Applicants submitting multiple resumes under slightly different names or email addresses.
              </p>
            </div>
          </div>
          <button
            onClick={() => setDuplicateFilter(!duplicateFilter)}
            className={`px-3.5 py-1.5 font-bold rounded-xl text-xs transition-colors cursor-pointer ${
              duplicateFilter
                ? 'bg-rose-600 text-white'
                : 'bg-rose-200 hover:bg-rose-300 text-rose-900'
            }`}
          >
            {duplicateFilter ? 'Showing Duplicates Only' : 'Filter Duplicates'}
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Status Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto custom-scrollbar">
          {[
            { id: 'all', label: 'All Candidates', count: candidates.length },
            { id: 'shortlisted', label: 'Shortlisted', count: candidates.filter((c) => c.screeningStatus === 'shortlisted').length },
            { id: 'review', label: 'Under Review', count: candidates.filter((c) => c.screeningStatus === 'review').length },
            { id: 'rejected', label: 'Rejected', count: candidates.filter((c) => c.screeningStatus === 'rejected').length },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === st.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st.label} ({st.count})
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate name, skill..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-500 font-medium"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold px-1">Sort:</span>
            <button
              onClick={() => setSortBy('score')}
              className={`px-2 py-1 rounded text-[11px] font-bold ${
                sortBy === 'score' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Match %
            </button>
            <button
              onClick={() => setSortBy('experience')}
              className={`px-2 py-1 rounded text-[11px] font-bold ${
                sortBy === 'experience' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Exp
            </button>
          </div>
        </div>
      </div>

      {/* Main Candidate Decision Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Candidate</th>
                <th className="px-4 py-3">Match Score</th>
                <th className="px-4 py-3">Mandatory Gates</th>
                <th className="px-4 py-3">Experience</th>
                <th className="px-4 py-3">Key Skills</th>
                <th className="px-4 py-3">Notice</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredCandidates.map((cand) => (
                <tr key={cand.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Candidate Name & Info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2.5">
                      <button
                        onClick={() => toggleCandidateBookmark(cand.id)}
                        className={`text-slate-300 hover:text-amber-400 ${
                          cand.bookmarked ? 'text-amber-400 fill-amber-400' : ''
                        }`}
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <div>
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          {cand.name}
                          {cand.isDuplicate && (
                            <span className="text-[9px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded">
                              Duplicate
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {cand.currentRole} • {cand.location}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Match Score Badge */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block font-black text-xs px-2.5 py-1 rounded-full ${
                        cand.matchScore >= 80
                          ? 'bg-emerald-100 text-emerald-800'
                          : cand.matchScore >= 50
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {cand.matchScore}%
                    </span>
                  </td>

                  {/* Mandatory Gates Status */}
                  <td className="px-4 py-3">
                    {cand.mandatoryPassed ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Passed Gates
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        <XCircle className="w-3 h-3 text-rose-600" /> Failed Gate
                      </span>
                    )}
                  </td>

                  {/* Experience */}
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {cand.totalExperienceYears} yrs
                  </td>

                  {/* Key Skills */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {cand.skills.slice(0, 3).map((sk, i) => (
                        <span key={i} className="text-[9px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                          {sk}
                        </span>
                      ))}
                      {cand.skills.length > 3 && (
                        <span className="text-[9px] text-slate-400">+{cand.skills.length - 3}</span>
                      )}
                    </div>
                  </td>

                  {/* Notice Period */}
                  <td className="px-4 py-3 text-slate-600">
                    {cand.noticePeriodDays} days
                  </td>

                  {/* Status Dropdown */}
                  <td className="px-4 py-3">
                    <select
                      value={cand.screeningStatus}
                      onChange={(e) => updateCandidateStatus(cand.id, e.target.value as any)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border outline-none ${
                        cand.screeningStatus === 'shortlisted'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : cand.screeningStatus === 'rejected'
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}
                    >
                      <option value="shortlisted">Shortlisted</option>
                      <option value="review">Under Review</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedCandidate(cand)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[11px] transition-colors"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidate Detail Slide-over / Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50 p-0">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="space-y-5">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                    {selectedCandidate.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">{selectedCandidate.name}</h2>
                    <p className="text-xs text-slate-500">
                      {selectedCandidate.currentRole} • {selectedCandidate.location}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="text-slate-400 font-bold text-lg hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              {/* Match Score & Gate Status */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Overall Match Score</p>
                  <p
                    className={`text-2xl font-black ${
                      selectedCandidate.matchScore >= 80 ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {selectedCandidate.matchScore}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Mandatory Gate Result</p>
                  {selectedCandidate.mandatoryPassed ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                      Passed All Gates
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
                      Failed Mandatory Gate
                    </span>
                  )}
                </div>
              </div>

              {/* Contact & Experience Info */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Email</p>
                  <p className="font-semibold text-slate-800">{selectedCandidate.email}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Phone</p>
                  <p className="font-semibold text-slate-800">{selectedCandidate.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Experience</p>
                  <p className="font-semibold text-slate-800">{selectedCandidate.totalExperienceYears} years</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Notice Period</p>
                  <p className="font-semibold text-slate-800">{selectedCandidate.noticePeriodDays} days</p>
                </div>
              </div>

              {/* Matched vs Failed Criteria Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900">AI Criteria Breakdown</h4>

                {selectedCandidate.matchedCriteria.length > 0 && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                    <p className="font-bold text-emerald-900">Matched Criteria:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                      {selectedCandidate.matchedCriteria.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedCandidate.missingMandatoryCriteria.length > 0 && (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-950 space-y-1">
                    <p className="font-bold text-rose-900">Missing Mandatory Gate(s):</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                      {selectedCandidate.missingMandatoryCriteria.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Rejection / Match Explanation */}
              {selectedCandidate.explanation && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <p className="font-bold text-slate-800">AI Screening Summary:</p>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{selectedCandidate.explanation}</p>
                </div>
              )}

              {/* Resume Text Snippet */}
              {selectedCandidate.resumeText && (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">Parsed Resume Text</p>
                  <div className="p-3 bg-slate-900 text-slate-200 text-[11px] font-mono rounded-xl max-h-40 overflow-y-auto leading-relaxed custom-scrollbar">
                    {selectedCandidate.resumeText}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => updateCandidateStatus(selectedCandidate.id, 'rejected')}
                className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Reject Candidate
              </button>
              <button
                onClick={() => {
                  updateCandidateStatus(selectedCandidate.id, 'shortlisted');
                  setSelectedCandidate(null);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
              >
                Approve & Shortlist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Dispatch Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" /> Dispatch Shortlist Emails
              </h3>
              <button onClick={() => setShowEmailModal(false)} className="text-slate-400 font-bold hover:text-slate-600">
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Email Subject Line</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Email Body Template (Uses {'{{candidate_name}}'} placeholder)
              </label>
              <textarea
                rows={6}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none leading-relaxed font-sans"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-bold text-indigo-600">
                Sending to {candidates.filter((c) => c.screeningStatus === 'shortlisted').length} shortlisted candidate(s)
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDispatchEmails}
                  disabled={isSendingEmails}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 cursor-pointer"
                >
                  {isSendingEmails ? (
                    <span>Dispatching...</span>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Send All Emails</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
