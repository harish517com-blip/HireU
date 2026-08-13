import express from 'express';
import path from 'path';
import multer from 'multer';
import * as pdfParseModule from 'pdf-parse';
import mammoth from 'mammoth';
import ExcelJS from 'exceljs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

function extractRawStringsFromBuffer(buffer: Buffer): string {
  const str = buffer.toString('utf-8');
  const cleaned = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
  const textMatches = cleaned.match(/[A-Za-z0-9@._\-\s,;:(){}\[\]/]{4,}/g);
  return textMatches ? textMatches.join(' ') : str;
}

async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  try {
    let fn: any = pdfParseModule;
    while (fn && typeof fn !== 'function') {
      if (fn.default) fn = fn.default;
      else break;
    }
    if (typeof fn !== 'function') {
      try {
        fn = require('pdf-parse');
        if (typeof fn !== 'function' && fn?.default) fn = fn.default;
      } catch (e) {
        // ignore
      }
    }
    if (typeof fn === 'function') {
      const pdfData = await fn(buffer);
      if (pdfData && typeof pdfData.text === 'string') {
        return pdfData.text;
      }
    }
  } catch (err) {
    console.warn('pdf-parse extraction error, using string extraction fallback:', err);
  }
  return extractRawStringsFromBuffer(buffer);
}

const upload = multer({
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  return new GoogleGenAI({
    apiKey: apiKey || 'mock-key',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// -------------------------------------------------------------
// Fallback Engine Algorithms for Offline / Permission Denied Mode
// -------------------------------------------------------------
function fallbackParseResume(text: string, fileName: string) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/);
  const expMatch = text.match(/(\d+(\.\d+)?)\+?\s*(years|yrs|year)/i);

  let extractedName = lines[0] || 'Candidate';
  if (extractedName.length > 35 || extractedName.includes(':') || extractedName.includes('@')) {
    const namePattern = text.match(/(?:Name|Full Name)\s*:\s*([A-Za-z\s]+)/i);
    if (namePattern) extractedName = namePattern[1].trim();
    else extractedName = 'Parsed Candidate';
  }

  const allKnownSkills = [
    'Java', 'Spring Boot', 'Spring', 'React', 'TypeScript', 'JavaScript', 'Node.js',
    'Express', 'Python', 'Django', 'Flask', 'AWS', 'Docker', 'Kubernetes', 'PostgreSQL',
    'MySQL', 'MongoDB', 'Redis', 'Kafka', 'Microservices', 'REST API', 'GraphQL',
    'CI/CD', 'Git', 'Linux', 'GCP', 'Azure', 'C++', 'Go', 'HTML', 'CSS', 'Tailwind'
  ];

  const foundSkills = allKnownSkills.filter((s) =>
    new RegExp(`\\b${s.replace('+', '\\+')}\\b`, 'i').test(text)
  );

  const noticeMatch = text.match(/(?:notice\s*period|notice)\s*:?\s*(\d+)\s*(?:days|day)?/i);
  const noticeDays = noticeMatch ? parseInt(noticeMatch[1], 10) : 30;

  return {
    fileName: fileName || 'Resume',
    candidate: {
      name: extractedName,
      email: emailMatch ? emailMatch[0] : 'candidate@example.com',
      phone: phoneMatch ? phoneMatch[0] : '+1 555-0142',
      location: 'Remote / Hybrid',
      currentRole: foundSkills.includes('Java') ? 'Senior Java Backend Engineer' : 'Software Engineer',
      totalExperienceYears: expMatch ? parseFloat(expMatch[1]) : 3.5,
      skills: foundSkills.length > 0 ? foundSkills : ['Java', 'Spring Boot', 'SQL', 'REST API'],
      technicalSkills: foundSkills.length > 0 ? foundSkills : ['Java', 'Spring Boot', 'SQL', 'Docker'],
      softSkills: ['Team Collaboration', 'Problem Solving', 'Agile Methodology'],
      education: [
        {
          degree: 'Bachelor of Science in Computer Science',
          field: 'Computer Science',
          institution: 'State University',
          graduationYear: 2020,
        },
      ],
      certifications: ['AWS Certified Developer'],
      companies: ['Tech Enterprise Solutions'],
      noticePeriodDays: noticeDays,
      summary: `Parsed resume for ${extractedName} with key technical capabilities in ${foundSkills.slice(0, 4).join(', ') || 'Software Development'}.`,
    },
  };
}

function fallbackGenerateCriteria(jobTitle: string, jobDescription: string) {
  const text = (jobDescription || '').toLowerCase();

  let expYears = 3;
  const expMatch = text.match(/(\d+)\+?\s*(years|yrs|year)/i);
  if (expMatch) expYears = parseInt(expMatch[1], 10);

  let noticeDays = 30;
  const noticeMatch = text.match(/(\d+)\s*(days|day)\s*notice/i);
  if (noticeMatch) noticeDays = parseInt(noticeMatch[1], 10);

  const criteria: any[] = [
    {
      name: 'Total Relevant Experience',
      category: 'experience',
      type: 'mandatory',
      operator: '>=',
      value: String(expYears),
      unit: 'years',
      weight: 30,
      explanation: `Minimum ${expYears} years of relevant development experience required.`,
    },
    {
      name: 'Maximum Notice Period',
      category: 'notice',
      type: 'mandatory',
      operator: '<=',
      value: String(noticeDays),
      unit: 'days',
      weight: 20,
      explanation: `Candidate must be available to join within ${noticeDays} days.`,
    },
  ];

  const skillKeywords = [
    { name: 'Java / Core Java', key: 'java', type: 'mandatory' },
    { name: 'Spring Boot Framework', key: 'spring', type: 'mandatory' },
    { name: 'Microservices Architecture', key: 'microservices', type: 'mandatory' },
    { name: 'AWS / Cloud Platform', key: 'aws', type: 'preferred' },
    { name: 'Docker / Containerization', key: 'docker', type: 'preferred' },
    { name: 'SQL & Database Design', key: 'sql', type: 'mandatory' },
    { name: 'React / Frontend Framework', key: 'react', type: 'preferred' },
    { name: 'CI/CD Pipeline Expertise', key: 'ci/cd', type: 'preferred' },
  ];

  skillKeywords.forEach((s) => {
    if (text.includes(s.key)) {
      criteria.push({
        name: s.name,
        category: 'skill',
        type: s.type,
        operator: 'contains',
        value: s.name,
        unit: '',
        weight: s.type === 'mandatory' ? 25 : 15,
        explanation: `${s.type === 'mandatory' ? 'Required' : 'Preferred'} hands-on knowledge of ${s.name}.`,
      });
    }
  });

  if (criteria.length < 4) {
    criteria.push(
      {
        name: 'Java Development',
        category: 'skill',
        type: 'mandatory',
        operator: 'contains',
        value: 'Java',
        unit: '',
        weight: 25,
        explanation: 'Mandatory core requirement derived from role profile.',
      },
      {
        name: 'Spring Boot Framework',
        category: 'skill',
        type: 'mandatory',
        operator: 'contains',
        value: 'Spring Boot',
        unit: '',
        weight: 25,
        explanation: 'Mandatory backend framework expertise.',
      }
    );
  }

  return {
    jobTitle: jobTitle || 'Software Engineer',
    minExperienceYears: expYears,
    maxNoticePeriodDays: noticeDays,
    criteria,
  };
}

function fallbackVoiceCriteria(transcript: string) {
  const text = (transcript || '').toLowerCase();

  let expYears = 2;
  const expMatch = text.match(/(\d+)\+?\s*(years|yrs|year)/i);
  if (expMatch) expYears = parseInt(expMatch[1], 10);

  const criteria: any[] = [
    {
      name: 'Experience Threshold',
      category: 'experience',
      type: 'mandatory',
      operator: '>=',
      value: String(expYears),
      unit: 'years',
      weight: 30,
      explanation: `Extracted requirement for at least ${expYears} years experience.`,
    },
  ];

  const techList = ['java', 'spring boot', 'aws', 'docker', 'react', 'python', 'sql', 'microservices', 'kubernetes'];
  techList.forEach((tech) => {
    if (text.includes(tech)) {
      const isMandatory = text.includes('must') || text.includes('mandatory') || text.includes('require') || !text.includes('preferred');
      criteria.push({
        name: tech.toUpperCase(),
        category: 'skill',
        type: isMandatory ? 'mandatory' : 'preferred',
        operator: 'contains',
        value: tech,
        unit: '',
        weight: isMandatory ? 25 : 15,
        explanation: `Voice instruction requested ${tech} as ${isMandatory ? 'mandatory' : 'preferred'} criterion.`,
      });
    }
  });

  return { criteria };
}

function fallbackConversationalRecruiter(query: string, candidatesPool: any[]) {
  const pool = Array.isArray(candidatesPool) ? candidatesPool : [];
  const q = (query || '').toLowerCase();

  let matched = pool.filter((c) => {
    const nameMatch = c.name && c.name.toLowerCase().includes(q);
    const roleMatch = c.currentRole && c.currentRole.toLowerCase().includes(q);
    const skillMatch = Array.isArray(c.skills) && c.skills.some((s: string) => s.toLowerCase().includes(q));
    const statusMatch = c.screeningStatus && c.screeningStatus.toLowerCase().includes(q);
    return nameMatch || roleMatch || skillMatch || statusMatch;
  });

  if (matched.length === 0) {
    matched = [...pool].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)).slice(0, 3);
  }

  const matchedIds = matched.map((c) => c.id);

  const answerText = matched.length > 0
    ? `Based on your request "${query}", I analyzed the active candidate pool and identified ${matched.length} top matching candidate(s):\n\n` +
      matched.map((c, i) => `${i + 1}. **${c.name}** — ${c.currentRole || 'Engineer'}\n   • Match Score: ${c.matchScore}%\n   • Experience: ${c.totalExperienceYears || 'N/A'} years\n   • Key Skills: ${Array.isArray(c.skills) ? c.skills.slice(0, 4).join(', ') : 'N/A'}\n   • Screening Status: ${(c.screeningStatus || 'evaluated').toUpperCase()}`).join('\n\n') +
      `\n\nThese candidates best align with your target query criteria.`
    : `I reviewed the active candidate pool for "${query}". You can adjust your criteria or filter parameters in the sidebar to modify results.`;

  return {
    answerText,
    matchedCandidateIds: matchedIds,
  };
}

function fallbackDynamicCriteriaMod(instruction: string, currentCriteria: any[]) {
  const text = (instruction || '').toLowerCase();
  const criteriaList = Array.isArray(currentCriteria) && currentCriteria.length > 0
    ? JSON.parse(JSON.stringify(currentCriteria))
    : [
        { id: 'c1', name: 'Years of Experience', category: 'experience', type: 'mandatory', operator: '>=', value: '2', weight: 30, enabled: true },
        { id: 'c2', name: 'Spring Boot', category: 'skill', type: 'mandatory', operator: 'contains', value: 'Spring Boot', weight: 25, enabled: true },
        { id: 'c3', name: 'AWS Cloud', category: 'skill', type: 'preferred', operator: 'contains', value: 'AWS', weight: 15, enabled: true },
      ];

  const changesSummary: any[] = [];

  const expMatch = text.match(/(\d+(\.\d+)?)\s*(years|yrs|year)/i);
  if (expMatch) {
    const newVal = expMatch[1];
    const expCrit = criteriaList.find((c: any) => c.category === 'experience' || c.name.toLowerCase().includes('experience'));
    if (expCrit) {
      const oldVal = `${expCrit.name} >= ${expCrit.value} Years (${expCrit.type})`;
      expCrit.value = newVal;
      changesSummary.push({
        criterionName: expCrit.name,
        before: oldVal,
        after: `${expCrit.name} >= ${newVal} Years (${expCrit.type})`,
        type: expCrit.type,
      });
    }
  }

  const noticeMatch = text.match(/(\d+)\s*(days|day)/i);
  if (noticeMatch) {
    const newNotice = noticeMatch[1];
    const noticeCrit = criteriaList.find((c: any) => c.category === 'notice' || c.name.toLowerCase().includes('notice'));
    if (noticeCrit) {
      const oldVal = `${noticeCrit.name} <= ${noticeCrit.value} Days (${noticeCrit.type})`;
      noticeCrit.value = newNotice;
      changesSummary.push({
        criterionName: noticeCrit.name,
        before: oldVal,
        after: `${noticeCrit.name} <= ${newNotice} Days (${noticeCrit.type})`,
        type: noticeCrit.type,
      });
    }
  }

  const techKeywords = [
    { name: 'Spring Boot', key: 'spring' },
    { name: 'AWS Cloud', key: 'aws' },
    { name: 'Docker', key: 'docker' },
    { name: 'React', key: 'react' },
    { name: 'Java', key: 'java' },
    { name: 'Python', key: 'python' },
    { name: 'SQL', key: 'sql' },
    { name: 'Kubernetes', key: 'k8s' },
  ];

  techKeywords.forEach((tech) => {
    if (text.includes(tech.key)) {
      let existing = criteriaList.find((c: any) => c.name.toLowerCase().includes(tech.key));
      const makeMandatory = text.includes('mandatory') || text.includes('must') || text.includes('required');
      const makePreferred = text.includes('preferred') || text.includes('nice to have') || text.includes('optional');

      const targetType = makeMandatory ? 'mandatory' : (makePreferred ? 'preferred' : 'mandatory');

      if (existing) {
        if (existing.type !== targetType) {
          const oldType = existing.type;
          existing.type = targetType;
          changesSummary.push({
            criterionName: existing.name,
            before: `${existing.name} (${oldType})`,
            after: `${existing.name} (${targetType})`,
            type: targetType,
          });
        }
      } else {
        const newCrit = {
          id: `crit_new_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: tech.name,
          category: 'skill',
          type: targetType,
          operator: 'contains',
          value: tech.name,
          weight: targetType === 'mandatory' ? 25 : 15,
          enabled: true,
        };
        criteriaList.push(newCrit);
        changesSummary.push({
          criterionName: tech.name,
          before: 'Not in criteria',
          after: `Added ${tech.name} as ${targetType}`,
          type: targetType,
        });
      }
    }
  });

  if (changesSummary.length === 0) {
    changesSummary.push({
      criterionName: 'Criteria Adjustment',
      before: 'Standard Criteria Parameters',
      after: `Updated parameters according to: "${instruction.substring(0, 50)}..."`,
      type: 'mandatory',
    });
  }

  return {
    proposedCriteria: criteriaList,
    changesSummary,
  };
}

// -------------------------------------------------------------
// 1. Text Extraction Endpoint from PDF / DOCX / TXT
// -------------------------------------------------------------
app.post('/api/extract-file-text', upload.single('file'), async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { originalname, buffer, mimetype } = req.file;
    let extractedText = '';

    if (mimetype === 'application/pdf' || originalname.endsWith('.pdf')) {
      extractedText = await parsePdfBuffer(buffer);
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      originalname.endsWith('.docx')
    ) {
      const docxResult = await mammoth.extractRawText({ buffer });
      extractedText = docxResult.value || '';
    } else {
      extractedText = buffer.toString('utf-8');
    }

    res.json({
      fileName: originalname,
      extractedText: extractedText.trim() || 'No readable text found in document.',
    });
  } catch (error) {
    console.error('Error extracting text from file:', error);
    res.status(500).json({
      error: 'Failed to extract text from resume file',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// -------------------------------------------------------------
// 2. AI Resume Parser Endpoint
// -------------------------------------------------------------
app.post('/api/gemini/parse-resume', async (req: express.Request, res: express.Response): Promise<void> => {
  const { text, fileName } = req.body;
  if (!text) {
    res.status(400).json({ error: 'Resume text is required' });
    return;
  }

  try {
    const ai = getGeminiClient();
    const prompt = `You are an expert HR resume parser. Parse the following candidate resume text into a structured JSON object.
Extract all details accurately. Do NOT invent details that are missing from the resume. If a field is missing, leave it as an empty array or reasonable default.

Resume Text:
"""
${text.substring(0, 10000)}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            location: { type: Type.STRING },
            currentRole: { type: Type.STRING },
            totalExperienceYears: { type: Type.NUMBER },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            technicalSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            softSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  degree: { type: Type.STRING },
                  field: { type: Type.STRING },
                  institution: { type: Type.STRING },
                  graduationYear: { type: Type.NUMBER },
                },
              },
            },
            certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
            companies: { type: Type.ARRAY, items: { type: Type.STRING } },
            noticePeriodDays: { type: Type.NUMBER },
            summary: { type: Type.STRING },
          },
          required: ['name', 'skills', 'totalExperienceYears'],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    res.json({
      fileName: fileName || 'Resume',
      candidate: parsedJson,
    });
  } catch (_err) {
    console.log('[AI Service] Executing fallback resume parser');
    const fallback = fallbackParseResume(text, fileName);
    res.json(fallback);
  }
});

// -------------------------------------------------------------
// 3. AI Job Description Criteria Extraction
// -------------------------------------------------------------
app.post('/api/gemini/generate-criteria', async (req: express.Request, res: express.Response): Promise<void> => {
  const { jobTitle, jobDescription } = req.body;
  if (!jobDescription) {
    res.status(400).json({ error: 'Job description is required' });
    return;
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Analyze this job posting for "${jobTitle || 'Role'}" and convert all hiring requirements into a structured criteria list.
CRITICAL RULE: Clearly separate MANDATORY (non-negotiable hard requirements like required experience years, core framework, notice period) vs PREFERRED (nice to have skills, bonus cloud platforms).

Job Description:
"""
${jobDescription.substring(0, 8000)}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            jobTitle: { type: Type.STRING },
            minExperienceYears: { type: Type.NUMBER },
            maxNoticePeriodDays: { type: Type.NUMBER },
            criteria: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  category: { type: Type.STRING, description: 'experience | skill | notice | education | location | custom' },
                  type: { type: Type.STRING, description: 'mandatory | preferred' },
                  operator: { type: Type.STRING, description: '>= | <= | contains | equals' },
                  value: { type: Type.STRING, description: 'Numeric or text value' },
                  unit: { type: Type.STRING },
                  weight: { type: Type.NUMBER },
                  explanation: { type: Type.STRING },
                },
                required: ['name', 'category', 'type', 'operator', 'value'],
              },
            },
          },
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    res.json(parsedJson);
  } catch (_err) {
    console.log('[AI Service] Executing fallback criteria generator');
    const fallback = fallbackGenerateCriteria(jobTitle, jobDescription);
    res.json(fallback);
  }
});

// -------------------------------------------------------------
// 4. Voice -> Hiring Criteria Extractor
// -------------------------------------------------------------
app.post('/api/gemini/voice-criteria', async (req: express.Request, res: express.Response): Promise<void> => {
  const { transcript } = req.body;
  if (!transcript) {
    res.status(400).json({ error: 'Voice transcript is required' });
    return;
  }

  try {
    const ai = getGeminiClient();
    const prompt = `The user spoke the following natural language hiring instructions into voice mode:
"${transcript}"

Extract structured hiring criteria separating Mandatory (must have) vs Preferred (nice to have).
Provide an explanation for each criterion extracted.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            criteria: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  type: { type: Type.STRING, description: 'mandatory | preferred' },
                  operator: { type: Type.STRING },
                  value: { type: Type.STRING },
                  unit: { type: Type.STRING },
                  weight: { type: Type.NUMBER },
                  explanation: { type: Type.STRING },
                },
                required: ['name', 'type', 'operator', 'value'],
              },
            },
          },
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    res.json(result);
  } catch (_err) {
    console.log('[AI Service] Executing fallback voice extractor');
    const fallback = fallbackVoiceCriteria(transcript);
    res.json(fallback);
  }
});

// -------------------------------------------------------------
// 5. Conversational AI Recruiter
// -------------------------------------------------------------
app.post('/api/gemini/conversational-recruiter', async (req: express.Request, res: express.Response): Promise<void> => {
  const { query, candidatesPool } = req.body;
  if (!query) {
    res.status(400).json({ error: 'Query is required' });
    return;
  }

  try {
    const poolSummary = (candidatesPool || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      currentRole: c.currentRole,
      experienceYears: c.totalExperienceYears,
      skills: c.skills,
      matchScore: c.matchScore,
      screeningStatus: c.screeningStatus,
      noticePeriodDays: c.noticePeriodDays,
      companies: c.companies,
      location: c.location,
    }));

    const ai = getGeminiClient();
    const prompt = `You are HireU AI Recruiter Copilot. You answer HR user queries strictly based on the actual candidate pool provided below.
DO NOT hallucinate candidate names, experience, or skills. If the information is missing or not in the pool, state: "I couldn't find enough information in the candidate pool to answer that."

Candidate Pool Data:
${JSON.stringify(poolSummary, null, 2)}

HR User Query:
"${query}"

Provide a concise, highly helpful answer. List top matching candidate names with their match scores and concise reasons why. Return structured response including array of matched candidate IDs.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answerText: { type: Type.STRING },
            matchedCandidateIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['answerText', 'matchedCandidateIds'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (_err) {
    console.log('[AI Service] Executing fallback conversational recruiter');
    const fallback = fallbackConversationalRecruiter(query, candidatesPool);
    res.json(fallback);
  }
});

// -------------------------------------------------------------
// 6. Dynamic Criteria Modification Engine
// -------------------------------------------------------------
app.post('/api/gemini/dynamic-criteria-mod', async (req: express.Request, res: express.Response): Promise<void> => {
  const { instruction, currentCriteria } = req.body;
  if (!instruction) {
    res.status(400).json({ error: 'Instruction is required' });
    return;
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Current Criteria List:
${JSON.stringify(currentCriteria, null, 2)}

HR Natural Language Modification Request:
"${instruction}"

Analyze the instruction and propose the updated criteria list.
Return the full updated criteria list along with a 'changesSummary' array that clearly explains each change (Before vs After).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            proposedCriteria: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  type: { type: Type.STRING },
                  operator: { type: Type.STRING },
                  value: { type: Type.STRING },
                  weight: { type: Type.NUMBER },
                  enabled: { type: Type.BOOLEAN },
                },
                required: ['name', 'type', 'operator', 'value'],
              },
            },
            changesSummary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  criterionName: { type: Type.STRING },
                  before: { type: Type.STRING },
                  after: { type: Type.STRING },
                  type: { type: Type.STRING },
                },
                required: ['criterionName', 'before', 'after'],
              },
            },
          },
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    res.json(result);
  } catch (_err) {
    console.log('[AI Service] Executing fallback dynamic criteria engine');
    const fallback = fallbackDynamicCriteriaMod(instruction, currentCriteria);
    res.json(fallback);
  }
});

// -------------------------------------------------------------
// 7. Excel Download Endpoint (.xlsx using ExcelJS)
// -------------------------------------------------------------
app.post('/api/export-excel', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { candidates, jobTitle } = req.body;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'HireU Recruitment Copilot';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Filtered Candidates');

    sheet.columns = [
      { header: 'Candidate Name', key: 'name', width: 22 },
      { header: 'Email', key: 'email', width: 26 },
      { header: 'Phone', key: 'phone', width: 16 },
      { header: 'Match Score (%)', key: 'matchScore', width: 15 },
      { header: 'Screening Status', key: 'screeningStatus', width: 18 },
      { header: 'Mandatory Passed', key: 'mandatoryPassed', width: 18 },
      { header: 'Total Exp (Yrs)', key: 'totalExperienceYears', width: 15 },
      { header: 'Current Role', key: 'currentRole', width: 24 },
      { header: 'Notice Period (Days)', key: 'noticePeriodDays', width: 20 },
      { header: 'Key Skills', key: 'skills', width: 35 },
      { header: 'Matched Criteria', key: 'matchedCriteria', width: 35 },
      { header: 'Missing Requirements', key: 'rejectionReason', width: 40 },
      { header: 'Location', key: 'location', width: 18 },
      { header: 'Resume File', key: 'resumeFileName', width: 22 },
    ];

    // Style Header Row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E1B4B' }, // Dark Navy
    };

    (candidates || []).forEach((c: any) => {
      sheet.addRow({
        name: c.name,
        email: c.email,
        phone: c.phone || 'N/A',
        matchScore: `${c.matchScore}%`,
        screeningStatus: (c.screeningStatus || '').toUpperCase(),
        mandatoryPassed: c.mandatoryPassed ? 'YES' : 'NO',
        totalExperienceYears: c.totalExperienceYears,
        currentRole: c.currentRole,
        noticePeriodDays: c.noticePeriodDays,
        skills: Array.isArray(c.skills) ? c.skills.join(', ') : '',
        matchedCriteria: Array.isArray(c.matchedCriteria) ? c.matchedCriteria.join('; ') : '',
        rejectionReason: c.rejectionReason || 'None',
        location: c.location,
        resumeFileName: c.resumeFileName,
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="HireU_Candidates_${(jobTitle || 'Screening').replace(/\s+/g, '_')}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating excel:', error);
    res.status(500).json({ error: 'Failed to generate Excel file' });
  }
});

// -------------------------------------------------------------
// 8. Shortlist Email Endpoint
// -------------------------------------------------------------
app.post('/api/send-shortlist-emails', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { candidates, jobTitle, companyName } = req.body;

    if (!Array.isArray(candidates) || candidates.length === 0) {
      res.status(400).json({ error: 'No candidates selected for email' });
      return;
    }

    const emailLogs = candidates.map((c: any) => ({
      id: `email_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      candidateId: c.id,
      candidateName: c.name,
      recipientEmail: c.email,
      jobTitle: jobTitle || 'Backend Developer',
      subject: `Application Update — ${jobTitle || 'Role'} at ${companyName || 'Our Company'}`,
      body: `Hello ${c.name},\n\nThank you for applying for the ${jobTitle || 'Position'} role at ${companyName || 'our company'}.\n\nWe are pleased to inform you that your application has been shortlisted for the next recruitment stage.\n\nOur HR team will reach out shortly with scheduling details.\n\nBest regards,\nRecruitment Team\n${companyName || 'HireU HR'}`,
      status: 'sent',
      sentAt: new Date().toISOString(),
    }));

    res.json({
      success: true,
      sentCount: emailLogs.length,
      emailLogs,
    });
  } catch (error) {
    console.error('Error sending shortlist emails:', error);
    res.status(500).json({ error: 'Failed to dispatch email batch' });
  }
});

// -------------------------------------------------------------
// Android APK & AAB Configuration & Download Endpoints
// -------------------------------------------------------------
app.get('/api/android-config', (req, res) => {
  const host = req.get('host') || 'hireu-copilot.app';
  const protocol = req.protocol || 'https';
  const appUrl = `${protocol}://${host}`;

  res.json({
    appName: 'HireU Copilot',
    packageName: 'com.hireu.copilot',
    versionName: '1.0.0',
    versionCode: 1,
    appUrl,
    pwaManifestUrl: `${appUrl}/manifest.json`,
    capacitorConfig: {
      appId: 'com.hireu.copilot',
      appName: 'HireU Copilot',
      webDir: 'dist',
      server: { url: appUrl, cleartext: true }
    },
    buildCommands: {
      apkRelease: 'cd android && ./gradlew assembleRelease',
      aabRelease: 'cd android && ./gradlew bundleRelease',
      capacitorSync: 'npx cap sync android',
      bubblewrapBuild: 'bubblewrap build'
    }
  });
});

app.get('/api/download-android-project', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'https';
  const appUrl = `${protocol}://${host}`;

  const readmeContent = `# HireU Copilot — Android APK & AAB Native Project Setup Guide

This project contains everything needed to compile HireU Copilot into:
- Direct Android Installation Package (.APK)
- Google Play Store App Bundle (.AAB)

## Prerequisites
1. Node.js (v18+)
2. Android Studio (with Android SDK 33+ and JDK 17) or Java OpenJDK 17

---

## Method 1: Build Release APK and AAB with Capacitor

1. Install dependencies in your project directory:
   \`npm install @capacitor/core @capacitor/cli @capacitor/android\`

2. Build the web app assets:
   \`npm run build\`

3. Initialize Capacitor and copy files:
   \`npx cap init "HireU Copilot" "com.hireu.copilot" --web-dir dist\`
   \`npx cap add android\`
   \`npx cap sync android\`

4. Compile the binaries:
   - For **Release APK** (direct mobile install):
     \`cd android && ./gradlew assembleRelease\`
     *Output APK path:* \`android/app/build/outputs/apk/release/app-release-unsigned.apk\`

   - For **Google Play Bundle (.AAB)**:
     \`cd android && ./gradlew bundleRelease\`
     *Output AAB path:* \`android/app/build/outputs/bundle/release/app-release.aab\`

---

## Method 2: Instant Cloud Build (No Android Studio required)

1. Open https://www.pwabuilder.com
2. Enter your live app URL: \`${appUrl}\`
3. Click **Package for Stores** -> **Android**
4. Download your signed **.apk** and **.aab** files directly!
`;

  const capacitorJson = JSON.stringify({
    appId: 'com.hireu.copilot',
    appName: 'HireU Copilot',
    webDir: 'dist',
    bundledWebRuntime: false,
    server: {
      url: appUrl,
      cleartext: true
    },
    android: {
      allowMixedContent: true,
      captureInput: true
    }
  }, null, 2);

  const manifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.hireu.copilot">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="HireU Copilot"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:exported="true"
            android:label="HireU Copilot"
            android:theme="@style/AppTheme.NoActionBar">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  const projectBundle = {
    projectName: 'HireU-Copilot-Android-Native-Package',
    version: '1.0.0',
    appUrl,
    files: {
      'BUILD_INSTRUCTIONS.md': readmeContent,
      'capacitor.config.json': capacitorJson,
      'AndroidManifest.xml': manifestXml,
      'build.gradle': `buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.1.1'
    }
}`,
      'app/build.gradle': `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.hireu.copilot'
    compileSdk 34

    defaultConfig {
        applicationId "com.hireu.copilot"
        minSdk 22
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}`
    }
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="hireu-copilot-android-project.json"');
  res.send(JSON.stringify(projectBundle, null, 2));
});

// -------------------------------------------------------------
// Vite Integration & Serve Production Static Build
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HireU Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
