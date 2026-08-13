export type ScreeningStatus = 'shortlisted' | 'rejected' | 'review' | 'pending';
export type ProcessingStatus = 'pending' | 'extracting' | 'screened' | 'failed';
export type CriterionType = 'mandatory' | 'preferred';
export type CriterionCategory = 'experience' | 'skill' | 'notice' | 'education' | 'location' | 'custom';
export type CriterionOperator = '>=' | '<=' | 'contains' | 'equals';

export interface HRProfile {
  id: string;
  fullName: string;
  workEmail: string;
  companyName: string;
  companyId: string;
  role: string;
  department: string;
  location: string;
  phone?: string;
  avatarUrl?: string;
  googleConnected?: boolean;
  createdAt: string;
}

export interface Job {
  id: string;
  companyId: string;
  title: string;
  department: string;
  description: string;
  location?: string;
  minExperienceYears: number;
  maxNoticePeriodDays: number;
  status: 'active' | 'closed' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface Criterion {
  id: string;
  jobId: string;
  name: string;
  category: CriterionCategory;
  type: CriterionType;
  operator: CriterionOperator;
  value: string | number | boolean;
  unit?: string;
  weight: number; // e.g. 1-100
  explanation?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateEducation {
  degree: string;
  field: string;
  institution: string;
  graduationYear?: number;
}

export interface CandidateExperience {
  title: string;
  company: string;
  durationYears?: number;
  description?: string;
}

export interface Candidate {
  id: string;
  jobId: string;
  companyId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  currentRole: string;
  totalExperienceYears: number;
  skills: string[];
  technicalSkills: string[];
  softSkills: string[];
  education: CandidateEducation[];
  certifications: string[];
  companies: string[];
  previousRoles: CandidateExperience[];
  projects: string[];
  noticePeriodDays: number;
  resumeFileName: string;
  resumeStoragePath?: string;
  resumeHash?: string;
  resumeText?: string;
  uploadedAt: string;
  uploadedBy: string;
  duplicateGroupId?: string;
  isDuplicate?: boolean;
  processingStatus: ProcessingStatus;
  screeningStatus: ScreeningStatus;
  matchScore: number; // 0 - 100
  mandatoryPassed: boolean;
  preferredScore: number; // 0 - 100
  matchedCriteria: string[];
  missingMandatoryCriteria: string[];
  missingPreferredCriteria: string[];
  rejectionReason?: string;
  explanation: string;
  bookmarked?: boolean;
}

export interface DuplicateGroup {
  id: string;
  candidateName: string;
  candidateIds: string[];
  primaryCandidateId: string;
  reason: string;
  matchConfidence: number;
}

export interface SimulationCriteriaChange {
  criterionName: string;
  before: string;
  after: string;
  type: CriterionType;
}

export interface SimulationComparisonRow {
  label: string;
  candidateCount: number;
  changeCount: number;
  impactLevel: 'No Change' | 'Low Decrease' | 'Moderate Decrease' | 'Large Decrease';
  rejectionReasonsSample: string[];
}

export interface SimulationResult {
  id: string;
  jobId: string;
  simulatedCriteria: Criterion[];
  changesSummary: SimulationCriteriaChange[];
  candidatesCount: number;
  totalPool: number;
  impactTable: SimulationComparisonRow[];
  createdAt: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  matchedCandidateIds?: string[];
  suggestedAction?: string;
}

export interface EmailLog {
  id: string;
  candidateId: string;
  candidateName: string;
  recipientEmail: string;
  jobTitle: string;
  subject: string;
  body: string;
  status: 'sent' | 'pending' | 'failed';
  sentAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  companyId: string;
  action: string;
  description: string;
  timestamp: string;
}

export interface AnalyticsSummary {
  totalApplications: number;
  screenedCount: number;
  shortlistedCount: number;
  rejectedCount: number;
  duplicateCount: number;
  avgMatchScore: number;
  matchScoreDistribution: {
    high: number; // 80-100%
    medium: number; // 50-79%
    low: number; // 0-49%
  };
  topSkillsInPool: { skill: string; count: number; percentage: number }[];
  topMissingSkills: { skill: string; count: number; percentage: number }[];
  criteriaImpact: { criterionName: string; eliminatedCount: number; percentage: number }[];
}
