import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Candidate,
  Criterion,
  HRProfile,
  Job,
  DuplicateGroup,
  ActivityLog,
  EmailLog,
  AnalyticsSummary,
} from '../types';
import {
  defaultHRUser,
  defaultJob,
  defaultCriteria,
  initialCandidatesList,
  defaultDuplicateGroups,
  defaultActivityLogs,
  calculateAnalytics,
} from '../services/store';
import { evaluateCandidateAgainstCriteria } from '../utils/screeningEngine';

export type NavView =
  | 'dashboard'
  | 'voice-criteria'
  | 'conversational-recruiter'
  | 'dynamic-criteria'
  | 'analytics'
  | 'simulator'
  | 'filtered-candidates'
  | 'profile'
  | 'android-export';

interface AppContextType {
  isAuthenticated: boolean;
  currentUser: HRProfile | null;
  activeView: NavView;
  setActiveView: (view: NavView) => void;
  job: Job;
  criteria: Criterion[];
  candidates: Candidate[];
  duplicateGroups: DuplicateGroup[];
  activityLogs: ActivityLog[];
  emailLogs: EmailLog[];
  analytics: AnalyticsSummary;
  login: (email: string, name?: string, company?: string) => void;
  logout: () => void;
  updateHRProfile: (updated: Partial<HRProfile>) => void;
  addCandidate: (newCand: Candidate) => void;
  addCandidatesBatch: (newCands: Candidate[]) => void;
  updateCandidateStatus: (candidateId: string, status: Candidate['screeningStatus']) => void;
  toggleCandidateBookmark: (candidateId: string) => void;
  updateCriteriaList: (newCriteria: Criterion[]) => void;
  addCriterion: (criterion: Omit<Criterion, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deleteCriterion: (criterionId: string) => void;
  toggleCriterion: (criterionId: string) => void;
  updateJobDetails: (updated: Partial<Job>) => void;
  addEmailLogs: (logs: EmailLog[]) => void;
  logActivity: (action: string, description: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<HRProfile | null>(defaultHRUser);
  const [activeView, setActiveView] = useState<NavView>('dashboard');
  const [job, setJob] = useState<Job>(defaultJob);
  const [criteria, setCriteria] = useState<Criterion[]>(defaultCriteria);
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidatesList);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>(defaultDuplicateGroups);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(defaultActivityLogs);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);

  // Compute live analytics whenever candidates or criteria change
  const analytics = calculateAnalytics(candidates, criteria);

  const login = (email: string, name?: string, company?: string) => {
    setIsAuthenticated(true);
    const user: HRProfile = {
      ...defaultHRUser,
      workEmail: email,
      fullName: name || defaultHRUser.fullName,
      companyName: company || defaultHRUser.companyName,
    };
    setCurrentUser(user);
    logActivity('User Login', `Logged in as ${user.fullName} (${user.workEmail})`);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const updateHRProfile = (updated: Partial<HRProfile>) => {
    if (currentUser) {
      const newProf = { ...currentUser, ...updated };
      setCurrentUser(newProf);
      logActivity('Profile Update', 'Updated HR profile details');
    }
  };

  const logActivity = (action: string, description: string) => {
    const newLog: ActivityLog = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser?.id || 'hr_user_001',
      companyId: currentUser?.companyId || 'comp_techcorp_100',
      action,
      description,
      timestamp: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  const reEvaluateAll = (currentCandidates: Candidate[], currentCriteria: Criterion[]): Candidate[] => {
    return currentCandidates.map((cand) => {
      const res = evaluateCandidateAgainstCriteria(cand, currentCriteria);
      return {
        ...cand,
        matchScore: res.overallScore,
        mandatoryPassed: res.mandatoryPassed,
        preferredScore: res.preferredScore,
        matchedCriteria: res.matchedCriteria,
        missingMandatoryCriteria: res.missingMandatoryCriteria,
        missingPreferredCriteria: res.missingPreferredCriteria,
        rejectionReason: res.rejectionReason,
        explanation: res.explanation,
        screeningStatus: res.screeningStatus,
      };
    });
  };

  const addCandidate = (newCand: Candidate) => {
    const evaluated = evaluateCandidateAgainstCriteria(newCand, criteria);
    const fullCandidate: Candidate = {
      ...newCand,
      matchScore: evaluated.overallScore,
      mandatoryPassed: evaluated.mandatoryPassed,
      preferredScore: evaluated.preferredScore,
      matchedCriteria: evaluated.matchedCriteria,
      missingMandatoryCriteria: evaluated.missingMandatoryCriteria,
      missingPreferredCriteria: evaluated.missingPreferredCriteria,
      rejectionReason: evaluated.rejectionReason,
      explanation: evaluated.explanation,
      screeningStatus: evaluated.screeningStatus,
    };

    setCandidates((prev) => [fullCandidate, ...prev]);
    logActivity('Candidate Added', `Processed & screened candidate ${fullCandidate.name}`);
  };

  const addCandidatesBatch = (newCands: Candidate[]) => {
    const evaluatedBatch = newCands.map((cand) => {
      const res = evaluateCandidateAgainstCriteria(cand, criteria);
      return {
        ...cand,
        matchScore: res.overallScore,
        mandatoryPassed: res.mandatoryPassed,
        preferredScore: res.preferredScore,
        matchedCriteria: res.matchedCriteria,
        missingMandatoryCriteria: res.missingMandatoryCriteria,
        missingPreferredCriteria: res.missingPreferredCriteria,
        rejectionReason: res.rejectionReason,
        explanation: res.explanation,
        screeningStatus: res.screeningStatus,
      };
    });

    setCandidates((prev) => [...evaluatedBatch, ...prev]);
    logActivity('Batch Resume Upload', `Uploaded & screened ${newCands.length} candidate resumes`);
  };

  const updateCandidateStatus = (candidateId: string, status: Candidate['screeningStatus']) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, screeningStatus: status } : c))
    );
  };

  const toggleCandidateBookmark = (candidateId: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, bookmarked: !c.bookmarked } : c))
    );
  };

  const updateCriteriaList = (newCriteriaList: Criterion[]) => {
    setCriteria(newCriteriaList);
    setCandidates((prev) => reEvaluateAll(prev, newCriteriaList));
    logActivity('Criteria Updated', `Updated screening criteria configuration (${newCriteriaList.length} active criteria)`);
  };

  const addCriterion = (critData: Omit<Criterion, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCrit: Criterion = {
      ...critData,
      id: `crit_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...criteria, newCrit];
    updateCriteriaList(updated);
  };

  const deleteCriterion = (criterionId: string) => {
    const updated = criteria.filter((c) => c.id !== criterionId);
    updateCriteriaList(updated);
  };

  const toggleCriterion = (criterionId: string) => {
    const updated = criteria.map((c) =>
      c.id === criterionId ? { ...c, enabled: !c.enabled } : c
    );
    updateCriteriaList(updated);
  };

  const updateJobDetails = (updated: Partial<Job>) => {
    setJob((prev) => ({ ...prev, ...updated }));
    logActivity('Job Updated', `Updated Job Description for ${updated.title || job.title}`);
  };

  const addEmailLogs = (logs: EmailLog[]) => {
    setEmailLogs((prev) => [...logs, ...prev]);
    logActivity('Emails Dispatched', `Sent ${logs.length} shortlist emails to candidates`);
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        activeView,
        setActiveView,
        job,
        criteria,
        candidates,
        duplicateGroups,
        activityLogs,
        emailLogs,
        analytics,
        login,
        logout,
        updateHRProfile,
        addCandidate,
        addCandidatesBatch,
        updateCandidateStatus,
        toggleCandidateBookmark,
        updateCriteriaList,
        addCriterion,
        deleteCriterion,
        toggleCriterion,
        updateJobDetails,
        addEmailLogs,
        logActivity,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
