import { Candidate, Criterion, ScreeningStatus } from '../types';

export interface EvaluationResult {
  mandatoryPassed: boolean;
  matchedCriteria: string[];
  missingMandatoryCriteria: string[];
  missingPreferredCriteria: string[];
  mandatoryScore: number; // 0 or 100
  preferredScore: number; // 0 to 100
  overallScore: number; // 0 to 100
  screeningStatus: ScreeningStatus;
  rejectionReason?: string;
  explanation: string;
}

/**
 * Evaluates a candidate strictly against active criteria.
 * Mandatory criteria act as non-negotiable gates.
 */
export function evaluateCandidateAgainstCriteria(
  candidate: Candidate,
  criteria: Criterion[]
): EvaluationResult {
  const activeCriteria = criteria.filter((c) => c.enabled);
  const mandatoryCriteria = activeCriteria.filter((c) => c.type === 'mandatory');
  const preferredCriteria = activeCriteria.filter((c) => c.type === 'preferred');

  const matchedCriteria: string[] = [];
  const missingMandatoryCriteria: string[] = [];
  const missingPreferredCriteria: string[] = [];

  // 1. Evaluate Mandatory Criteria
  for (const crit of mandatoryCriteria) {
    const passed = evaluateSingleCriterion(candidate, crit);
    if (passed) {
      matchedCriteria.push(`${crit.name} (Mandatory Passed)`);
    } else {
      missingMandatoryCriteria.push(getFailureExplanation(candidate, crit));
    }
  }

  const mandatoryPassed = missingMandatoryCriteria.length === 0;

  // 2. Evaluate Preferred Criteria
  let totalPreferredWeight = 0;
  let earnedPreferredWeight = 0;

  for (const crit of preferredCriteria) {
    const weight = crit.weight || 10;
    totalPreferredWeight += weight;

    const passed = evaluateSingleCriterion(candidate, crit);
    if (passed) {
      matchedCriteria.push(`${crit.name} (Preferred Matched)`);
      earnedPreferredWeight += weight;
    } else {
      missingPreferredCriteria.push(crit.name);
    }
  }

  const preferredScore =
    totalPreferredWeight > 0
      ? Math.round((earnedPreferredWeight / totalPreferredWeight) * 100)
      : 100;

  // Calculate semantic skill / experience bonus
  const expMatch = candidate.totalExperienceYears >= 2 ? 10 : 5;
  const skillCount = candidate.skills.length;
  const baseSkillScore = Math.min(skillCount * 5, 20);

  let overallScore = 0;
  let screeningStatus: ScreeningStatus = 'pending';
  let rejectionReason: string | undefined = undefined;

  if (!mandatoryPassed) {
    // FAILED MANDATORY CRITERIA -> HARD REJECT / CANNOT BE RESCUED
    screeningStatus = 'rejected';
    // Score is capped at maximum 49% if mandatory fails, proportional to matched criteria
    const maxScoreWhenFailed = 45;
    const passRatio =
      mandatoryCriteria.length > 0
        ? (mandatoryCriteria.length - missingMandatoryCriteria.length) /
          mandatoryCriteria.length
        : 0;
    overallScore = Math.round(passRatio * maxScoreWhenFailed);

    rejectionReason = `Failed mandatory requirement(s): ${missingMandatoryCriteria.join(
      '; '
    )}`;
  } else {
    // PASSED ALL MANDATORY CRITERIA
    // Mandatory Gate = 50 points, Preferred = 30 points, Skill/Experience match = 20 points
    const mandatoryBase = 50;
    const preferredContribution = Math.round((preferredScore / 100) * 35);
    const bonusContribution = Math.round((baseSkillScore + expMatch) * 0.5);

    overallScore = Math.min(
      100,
      Math.max(50, mandatoryBase + preferredContribution + bonusContribution)
    );

    if (overallScore >= 78) {
      screeningStatus = 'shortlisted';
    } else if (overallScore >= 55) {
      screeningStatus = 'review';
    } else {
      screeningStatus = 'rejected';
      rejectionReason = 'Overall match score below threshold (55%).';
    }
  }

  // Build human-readable explanation
  let explanation = '';
  if (mandatoryPassed) {
    explanation = `Candidate satisfies all ${mandatoryCriteria.length} mandatory criteria including ${mandatoryCriteria
      .map((m) => m.name)
      .join(', ')}. Preferred match score is ${preferredScore}%. Overall match is strong at ${overallScore}%.`;
    if (missingPreferredCriteria.length > 0) {
      explanation += ` Missing preferred preferences: ${missingPreferredCriteria.join(
        ', '
      )}.`;
    }
  } else {
    explanation = `Candidate rejected due to failing ${
      missingMandatoryCriteria.length
    } mandatory requirement(s): ${missingMandatoryCriteria.join(
      ' | '
    )}. Preferred skills cannot override mandatory criteria failure.`;
  }

  return {
    mandatoryPassed,
    matchedCriteria,
    missingMandatoryCriteria,
    missingPreferredCriteria,
    mandatoryScore: mandatoryPassed ? 100 : 0,
    preferredScore,
    overallScore,
    screeningStatus,
    rejectionReason,
    explanation,
  };
}

function evaluateSingleCriterion(candidate: Candidate, crit: Criterion): boolean {
  const normName = crit.name.toLowerCase().trim();
  const val = crit.value;

  // 1. Experience Check
  if (crit.category === 'experience' || normName.includes('experience') || normName.includes('exp')) {
    const reqYears = typeof val === 'number' ? val : parseFloat(String(val)) || 0;
    if (crit.operator === '>=') {
      return candidate.totalExperienceYears >= reqYears;
    } else if (crit.operator === '<=') {
      return candidate.totalExperienceYears <= reqYears;
    }
    return candidate.totalExperienceYears >= reqYears;
  }

  // 2. Notice Period Check
  if (crit.category === 'notice' || normName.includes('notice')) {
    const maxNoticeDays = typeof val === 'number' ? val : parseInt(String(val)) || 90;
    if (crit.operator === '<=' || crit.operator === 'equals') {
      return candidate.noticePeriodDays <= maxNoticeDays;
    }
    return candidate.noticePeriodDays <= maxNoticeDays;
  }

  // 3. Location Check
  if (crit.category === 'location' || normName.includes('location')) {
    const targetLoc = String(val).toLowerCase();
    if (!targetLoc || targetLoc === 'true' || targetLoc === 'any') return true;
    return candidate.location.toLowerCase().includes(targetLoc);
  }

  // 4. Skills Check (Java, Spring Boot, AWS, React, etc.)
  const candidateSkillsLower = [
    ...candidate.skills,
    ...candidate.technicalSkills,
    ...candidate.softSkills,
    candidate.currentRole,
    ...candidate.projects,
  ].map((s) => s.toLowerCase());

  const searchSkill = normName.replace(/(mandatory|preferred|experience|skill|required)/gi, '').trim();

  const skillFound = candidateSkillsLower.some(
    (s) => s.includes(searchSkill) || searchSkill.includes(s)
  );

  return skillFound;
}

function getFailureExplanation(candidate: Candidate, crit: Criterion): string {
  const normName = crit.name;
  if (crit.category === 'experience' || normName.toLowerCase().includes('experience')) {
    return `${normName}: required ${crit.value} years, candidate has ${candidate.totalExperienceYears} years`;
  }
  if (crit.category === 'notice' || normName.toLowerCase().includes('notice')) {
    return `${normName}: maximum ${crit.value} days required, candidate notice period is ${candidate.noticePeriodDays} days`;
  }
  return `Missing required skill or criterion "${normName}"`;
}
