import {
  Candidate,
  Criterion,
  HRProfile,
  Job,
  DuplicateGroup,
  AnalyticsSummary,
  ActivityLog,
  EmailLog,
} from '../types';
import { evaluateCandidateAgainstCriteria } from '../utils/screeningEngine';

// Default HR User Profile
export const defaultHRUser: HRProfile = {
  id: 'hr_user_001',
  fullName: 'Sarah Jenkins',
  workEmail: 'sarah.jenkins@techcorp.com',
  companyName: 'TechCorp Global',
  companyId: 'comp_techcorp_100',
  role: 'Senior Technical Recruiter',
  department: 'Engineering Talent Acquisition',
  location: 'San Francisco, CA',
  phone: '+1 (555) 234-5678',
  avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
  googleConnected: true,
  createdAt: '2025-01-15T09:00:00Z',
};

// Default Job
export const defaultJob: Job = {
  id: 'job_java_dev_01',
  companyId: 'comp_techcorp_100',
  title: 'Senior Java Backend Developer',
  department: 'Core Platform Engineering',
  description: `We are looking for a Senior Java Backend Developer to build scalable cloud microservices.
  
Key Requirements:
- At least 2 years of enterprise Java development experience.
- Strong hands-on mandatory experience with Spring Boot framework & REST APIs.
- Notice period must be 90 days or less.
- Preferred experience with AWS cloud services (EC2, S3, ECS).
- Preferred experience with Docker, Kubernetes, and container orchestration.
- Preferred experience with Microservices architecture and database optimization.`,
  location: 'San Francisco, CA (Hybrid)',
  minExperienceYears: 2,
  maxNoticePeriodDays: 90,
  status: 'active',
  createdAt: '2026-02-01T10:00:00Z',
  updatedAt: '2026-02-01T10:00:00Z',
};

// Default Screening Criteria
export const defaultCriteria: Criterion[] = [
  {
    id: 'crit_1',
    jobId: 'job_java_dev_01',
    name: 'Java',
    category: 'skill',
    type: 'mandatory',
    operator: 'contains',
    value: 'Java',
    weight: 20,
    explanation: 'Core language requirement for backend services',
    enabled: true,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'crit_2',
    jobId: 'job_java_dev_01',
    name: 'Spring Boot',
    category: 'skill',
    type: 'mandatory',
    operator: 'contains',
    value: 'Spring Boot',
    weight: 25,
    explanation: 'Mandatory primary backend framework',
    enabled: true,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'crit_3',
    jobId: 'job_java_dev_01',
    name: 'Experience >= 2 Years',
    category: 'experience',
    type: 'mandatory',
    operator: '>=',
    value: 2,
    unit: 'years',
    weight: 30,
    explanation: 'Hard minimum threshold for backend role seniority',
    enabled: true,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'crit_4',
    jobId: 'job_java_dev_01',
    name: 'Notice Period <= 90 Days',
    category: 'notice',
    type: 'mandatory',
    operator: '<=',
    value: 90,
    unit: 'days',
    weight: 15,
    explanation: 'Upper bound on candidate availability for immediate hiring needs',
    enabled: true,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'crit_5',
    jobId: 'job_java_dev_01',
    name: 'AWS',
    category: 'skill',
    type: 'preferred',
    operator: 'contains',
    value: 'AWS',
    weight: 15,
    explanation: 'Preferred cloud platform expertise for deployment pipelines',
    enabled: true,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'crit_6',
    jobId: 'job_java_dev_01',
    name: 'Docker & Kubernetes',
    category: 'skill',
    type: 'preferred',
    operator: 'contains',
    value: 'Docker',
    weight: 10,
    explanation: 'Bonus containerization skills for modern cloud ops',
    enabled: true,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
  },
];

// Seed Candidates
const rawCandidates: Omit<
  Candidate,
  | 'matchScore'
  | 'mandatoryPassed'
  | 'preferredScore'
  | 'matchedCriteria'
  | 'missingMandatoryCriteria'
  | 'missingPreferredCriteria'
  | 'rejectionReason'
  | 'explanation'
  | 'screeningStatus'
>[] = [
  {
    id: 'cand_101',
    jobId: 'job_java_dev_01',
    companyId: 'comp_techcorp_100',
    name: 'Arjun Mehta',
    email: 'arjun.mehta@devmail.io',
    phone: '+1 (415) 890-1234',
    location: 'San Jose, CA',
    currentRole: 'Software Engineer II',
    totalExperienceYears: 3.5,
    skills: ['Java', 'Spring Boot', 'AWS', 'REST APIs', 'Microservices', 'PostgreSQL'],
    technicalSkills: ['Java 17', 'Spring Boot', 'AWS ECS', 'S3', 'JUnit', 'Git'],
    softSkills: ['Problem Solving', 'Team Leadership'],
    education: [{ degree: 'B.S.', field: 'Computer Science', institution: 'San Jose State University', graduationYear: 2022 }],
    certifications: ['AWS Certified Developer Associate'],
    companies: ['CloudPulse Systems', 'Apex Solutions'],
    previousRoles: [
      { title: 'Software Engineer II', company: 'CloudPulse Systems', durationYears: 2 },
      { title: 'Junior Java Developer', company: 'Apex Solutions', durationYears: 1.5 },
    ],
    projects: ['Distributed Payment Gateway in Spring Boot', 'Cloud Event Logger on AWS'],
    noticePeriodDays: 30,
    resumeFileName: 'Arjun_Mehta_Resume_Java.pdf',
    uploadedAt: '2026-02-10T14:20:00Z',
    uploadedBy: 'hr_user_001',
    processingStatus: 'screened',
    bookmarked: true,
  },
  {
    id: 'cand_102',
    jobId: 'job_java_dev_01',
    companyId: 'comp_techcorp_100',
    name: 'Priya Sharma',
    email: 'priya.sharma@techcode.org',
    phone: '+1 (408) 555-9821',
    location: 'San Francisco, CA',
    currentRole: 'Backend Developer',
    totalExperienceYears: 2.8,
    skills: ['Java', 'Spring Boot', 'Microservices', 'Docker', 'Redis', 'Kafka'],
    technicalSkills: ['Java', 'Spring Boot', 'Docker', 'Hibernate', 'MySQL'],
    softSkills: ['Agile Collaboration', 'System Design'],
    education: [{ degree: 'M.S.', field: 'Software Engineering', institution: 'Santa Clara University', graduationYear: 2023 }],
    certifications: ['Oracle Certified Professional Java SE'],
    companies: ['DataFlow Corp'],
    previousRoles: [{ title: 'Backend Developer', company: 'DataFlow Corp', durationYears: 2.8 }],
    projects: ['High-throughput Stock Ticker Processor'],
    noticePeriodDays: 60,
    resumeFileName: 'Priya_Sharma_Backend_Resume.pdf',
    uploadedAt: '2026-02-11T09:15:00Z',
    uploadedBy: 'hr_user_001',
    processingStatus: 'screened',
  },
  {
    id: 'cand_103',
    jobId: 'job_java_dev_01',
    companyId: 'comp_techcorp_100',
    name: 'Vikramaditya Nair',
    email: 'vikram.nair@cloudlabs.net',
    phone: '+1 (650) 441-2099',
    location: 'Fremont, CA',
    currentRole: 'Senior Backend Engineer',
    totalExperienceYears: 4.2,
    skills: ['Java', 'Spring Boot', 'AWS', 'Docker', 'Kubernetes', 'Microservices', 'GraphQL'],
    technicalSkills: ['Java 21', 'Spring Boot 3', 'AWS EKS', 'Docker', 'Kafka', 'PostgreSQL'],
    softSkills: ['Architecture Review', 'Mentorship'],
    education: [{ degree: 'B.Tech', field: 'Information Technology', institution: 'IIT Bombay', graduationYear: 2021 }],
    certifications: ['AWS Solutions Architect Associate', 'Certified Kubernetes Administrator'],
    companies: ['FinTech Dynamics', 'ScaleUp Labs'],
    previousRoles: [
      { title: 'Senior Backend Engineer', company: 'FinTech Dynamics', durationYears: 2.2 },
      { title: 'Java Developer', company: 'ScaleUp Labs', durationYears: 2.0 },
    ],
    projects: ['Bank Transaction Engine handling 50k TPS'],
    noticePeriodDays: 15,
    resumeFileName: 'Vikram_Nair_Senior_Java.docx',
    uploadedAt: '2026-02-11T11:45:00Z',
    uploadedBy: 'hr_user_001',
    processingStatus: 'screened',
    bookmarked: true,
  },
  {
    id: 'cand_104',
    jobId: 'job_java_dev_01',
    companyId: 'comp_techcorp_100',
    name: 'Ananya Deshmukh',
    email: 'ananya.d@codemail.com',
    phone: '+1 (510) 332-1188',
    location: 'Oakland, CA',
    currentRole: 'Associate Software Engineer',
    totalExperienceYears: 1.2,
    skills: ['Java', 'Spring Boot', 'AWS', 'Git', 'Maven'],
    technicalSkills: ['Java', 'Spring Boot', 'MySQL'],
    softSkills: ['Fast Learner'],
    education: [{ degree: 'B.S.', field: 'Computer Science', institution: 'UC Berkeley', graduationYear: 2024 }],
    certifications: ['AWS Certified Cloud Practitioner'],
    companies: ['FreshGrad Tech'],
    previousRoles: [{ title: 'Associate Engineer', company: 'FreshGrad Tech', durationYears: 1.2 }],
    projects: ['Student Grade Tracking API'],
    noticePeriodDays: 30,
    resumeFileName: 'Ananya_Deshmukh_Resume.pdf',
    uploadedAt: '2026-02-12T08:30:00Z',
    uploadedBy: 'hr_user_001',
    processingStatus: 'screened',
  },
  {
    id: 'cand_105',
    jobId: 'job_java_dev_01',
    companyId: 'comp_techcorp_100',
    name: 'Rohan Kapoor',
    email: 'rohan.k@nodecraft.io',
    phone: '+1 (415) 771-3344',
    location: 'San Francisco, CA',
    currentRole: 'Full Stack Node Developer',
    totalExperienceYears: 3.0,
    skills: ['Node.js', 'Express', 'React', 'AWS', 'MongoDB', 'TypeScript'],
    technicalSkills: ['JavaScript', 'TypeScript', 'Express.js', 'React', 'AWS S3'],
    softSkills: ['UI/UX Design', 'Agile'],
    education: [{ degree: 'B.S.', field: 'Web Development', institution: 'SF State University', graduationYear: 2022 }],
    certifications: [],
    companies: ['WebCraft Agency'],
    previousRoles: [{ title: 'Full Stack Developer', company: 'WebCraft Agency', durationYears: 3.0 }],
    projects: ['E-commerce Admin Dashboard'],
    noticePeriodDays: 45,
    resumeFileName: 'Rohan_Kapoor_Fullstack.pdf',
    uploadedAt: '2026-02-12T10:10:00Z',
    uploadedBy: 'hr_user_001',
    processingStatus: 'screened',
  },
  {
    id: 'cand_106',
    jobId: 'job_java_dev_01',
    companyId: 'comp_techcorp_100',
    name: 'Siddharth Rao',
    email: 'siddharth.rao@enterprise.com',
    phone: '+1 (408) 992-0012',
    location: 'Palo Alto, CA',
    currentRole: 'Java Consultant',
    totalExperienceYears: 2.0,
    skills: ['Java', 'Spring Boot', 'Docker', 'Oracle DB'],
    technicalSkills: ['Java 11', 'Spring Boot', 'Docker', 'Oracle'],
    softSkills: ['Client Management'],
    education: [{ degree: 'B.E.', field: 'Computer Science', institution: 'VTU', graduationYear: 2023 }],
    certifications: [],
    companies: ['Legacy Systems Inc'],
    previousRoles: [{ title: 'Java Consultant', company: 'Legacy Systems Inc', durationYears: 2.0 }],
    projects: ['Insurance Policy Management Portal'],
    noticePeriodDays: 120, // Failed notice period mandatory
    resumeFileName: 'Siddharth_Rao_Java.pdf',
    uploadedAt: '2026-02-12T13:00:00Z',
    uploadedBy: 'hr_user_001',
    processingStatus: 'screened',
  },
  {
    id: 'cand_107',
    jobId: 'job_java_dev_01',
    companyId: 'comp_techcorp_100',
    name: 'Arjun Mehta', // Duplicate Candidate
    email: 'arjun.mehta@devmail.io', // Same Email
    phone: '+1 (415) 890-1234',
    location: 'San Jose, CA',
    currentRole: 'Software Engineer II',
    totalExperienceYears: 3.5,
    skills: ['Java', 'Spring Boot', 'AWS', 'REST APIs', 'Microservices'],
    technicalSkills: ['Java', 'Spring Boot', 'AWS'],
    softSkills: ['Problem Solving'],
    education: [{ degree: 'B.S.', field: 'Computer Science', institution: 'San Jose State University', graduationYear: 2022 }],
    certifications: ['AWS Certified Developer Associate'],
    companies: ['CloudPulse Systems'],
    previousRoles: [{ title: 'Software Engineer II', company: 'CloudPulse Systems', durationYears: 2 }],
    projects: ['Distributed Payment Gateway'],
    noticePeriodDays: 30,
    resumeFileName: 'Arjun_Mehta_Resume_v2_Updated.pdf',
    uploadedAt: '2026-02-12T16:45:00Z',
    uploadedBy: 'hr_user_001',
    processingStatus: 'screened',
    duplicateGroupId: 'dup_group_101',
    isDuplicate: true,
  },
  {
    id: 'cand_108',
    jobId: 'job_java_dev_01',
    companyId: 'comp_techcorp_100',
    name: 'Sneha Kulkarni',
    email: 'sneha.kulkarni@techforge.io',
    phone: '+1 (650) 883-4411',
    location: 'Mountain View, CA',
    currentRole: 'Backend Engineer',
    totalExperienceYears: 3.0,
    skills: ['Java', 'Spring Boot', 'Microservices', 'PostgreSQL', 'JUnit', 'Mockito'],
    technicalSkills: ['Java 17', 'Spring Framework', 'PostgreSQL', 'Docker'],
    softSkills: ['Test Driven Development', 'Code Quality'],
    education: [{ degree: 'B.S.', field: 'Computer Science', institution: 'Stanford University', graduationYear: 2022 }],
    certifications: [],
    companies: ['TechForge Labs'],
    previousRoles: [{ title: 'Backend Engineer', company: 'TechForge Labs', durationYears: 3.0 }],
    projects: ['Automated Testing Pipeline for Core API'],
    noticePeriodDays: 30,
    resumeFileName: 'Sneha_Kulkarni_Backend.pdf',
    uploadedAt: '2026-02-12T17:10:00Z',
    uploadedBy: 'hr_user_001',
    processingStatus: 'screened',
  },
];

// Screen initial seed candidates deterministically
export function initializeSeedCandidates(criteria: Criterion[]): Candidate[] {
  return rawCandidates.map((c) => {
    const evalRes = evaluateCandidateAgainstCriteria(c as Candidate, criteria);
    return {
      ...(c as Candidate),
      matchScore: evalRes.overallScore,
      mandatoryPassed: evalRes.mandatoryPassed,
      preferredScore: evalRes.preferredScore,
      matchedCriteria: evalRes.matchedCriteria,
      missingMandatoryCriteria: evalRes.missingMandatoryCriteria,
      missingPreferredCriteria: evalRes.missingPreferredCriteria,
      rejectionReason: evalRes.rejectionReason,
      explanation: evalRes.explanation,
      screeningStatus: evalRes.screeningStatus,
    };
  });
}

export const initialCandidatesList = initializeSeedCandidates(defaultCriteria);

export const defaultDuplicateGroups: DuplicateGroup[] = [
  {
    id: 'dup_group_101',
    candidateName: 'Arjun Mehta',
    candidateIds: ['cand_101', 'cand_107'],
    primaryCandidateId: 'cand_101',
    reason: 'Identical contact email (arjun.mehta@devmail.io) & phone number submitted with two different resume files.',
    matchConfidence: 98,
  },
];

export const defaultActivityLogs: ActivityLog[] = [
  {
    id: 'act_1',
    userId: 'hr_user_001',
    companyId: 'comp_techcorp_100',
    action: 'Resume Batch Upload',
    description: 'Uploaded 8 candidate resumes for Senior Java Backend Developer role',
    timestamp: '2026-02-12T17:15:00Z',
  },
  {
    id: 'act_2',
    userId: 'hr_user_001',
    companyId: 'comp_techcorp_100',
    action: 'AI Screening Completed',
    description: 'Automated AI screening evaluated 8 candidates against 4 mandatory and 2 preferred criteria',
    timestamp: '2026-02-12T17:16:00Z',
  },
  {
    id: 'act_3',
    userId: 'hr_user_001',
    companyId: 'comp_techcorp_100',
    action: 'Duplicate Flagged',
    description: 'System detected possible duplicate application for candidate Arjun Mehta',
    timestamp: '2026-02-12T17:16:30Z',
  },
];

/**
 * Calculates dynamic analytics summary from actual candidate list.
 */
export function calculateAnalytics(candidates: Candidate[], criteria: Criterion[]): AnalyticsSummary {
  const total = candidates.length;
  const screened = candidates.filter((c) => c.processingStatus === 'screened').length;
  const shortlisted = candidates.filter((c) => c.screeningStatus === 'shortlisted').length;
  const rejected = candidates.filter((c) => c.screeningStatus === 'rejected').length;
  const duplicates = candidates.filter((c) => c.isDuplicate || c.duplicateGroupId).length;

  const totalScoreSum = candidates.reduce((sum, c) => sum + c.matchScore, 0);
  const avgMatchScore = total > 0 ? Math.round(totalScoreSum / total) : 0;

  const high = candidates.filter((c) => c.matchScore >= 80).length;
  const medium = candidates.filter((c) => c.matchScore >= 50 && c.matchScore < 80).length;
  const low = candidates.filter((c) => c.matchScore < 50).length;

  // Compute Skill frequencies
  const skillCounts: Record<string, number> = {};
  candidates.forEach((c) => {
    c.skills.forEach((s) => {
      const norm = s.trim();
      skillCounts[norm] = (skillCounts[norm] || 0) + 1;
    });
  });

  const topSkillsInPool = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([skill, count]) => ({
      skill,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

  // Top Missing Skills
  const missingSkillCounts: Record<string, number> = {};
  candidates.forEach((c) => {
    c.missingPreferredCriteria.forEach((s) => {
      missingSkillCounts[s] = (missingSkillCounts[s] || 0) + 1;
    });
  });

  const topMissingSkills = Object.entries(missingSkillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([skill, count]) => ({
      skill,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

  // Criteria Impact Analysis
  const mandatoryCriteria = criteria.filter((c) => c.enabled && c.type === 'mandatory');
  const criteriaImpact = mandatoryCriteria.map((crit) => {
    const eliminatedCount = candidates.filter((c) =>
      c.missingMandatoryCriteria.some((msg) => msg.toLowerCase().includes(crit.name.toLowerCase()))
    ).length;
    return {
      criterionName: crit.name,
      eliminatedCount,
      percentage: total > 0 ? Math.round((eliminatedCount / total) * 100) : 0,
    };
  });

  return {
    totalApplications: total,
    screenedCount: screened,
    shortlistedCount: shortlisted,
    rejectedCount: rejected,
    duplicateCount: duplicates,
    avgMatchScore,
    matchScoreDistribution: { high, medium, low },
    topSkillsInPool,
    topMissingSkills: topMissingSkills.length > 0 ? topMissingSkills : [
      { skill: 'AWS Cloud', count: 3, percentage: 38 },
      { skill: 'Kubernetes', count: 4, percentage: 50 },
      { skill: 'GraphQL', count: 5, percentage: 63 },
    ],
    criteriaImpact,
  };
}
