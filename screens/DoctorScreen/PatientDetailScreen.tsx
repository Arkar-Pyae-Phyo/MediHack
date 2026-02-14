import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { askGemini } from '../../services/gemini';

import doctorNotes from '../../sample_data/doc_clean.json';
import medications from '../../sample_data/drug_clean.json';
import labResults from '../../sample_data/lab_clean.json';
import nurseVitals from '../../sample_data/nurse_clean.json';
import imagingReports from '../../sample_data/xray_clean.json';

type PatientStatus = 'stable' | 'improving' | 'critical';

type Patient = {
  id: string;
  name: string;
  mrn: string;
  age: number;
  diagnosis: string;
  status: PatientStatus;
  roomNumber: string;
  lastUpdate: string;
  priority: 'high' | 'medium' | 'low';
};

type VitalSignDisplay = {
  name: string;
  value: string;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  timestamp: string;
};

type MedicationDisplay = {
  name: string;
  dosage: string;
  frequency: string;
  route: string;
};

type ClinicalNoteDisplay = {
  date: string;
  author: string;
  note: string;
};

type DoctorNote = (typeof doctorNotes)[number];
type MedicationData = (typeof medications)[number];
type LabResult = (typeof labResults)[number];
type NurseVital = (typeof nurseVitals)[number];
type ImagingData = (typeof imagingReports)[number];

type ProblemSegment = {
  title: string;
  summary: string;
};

type EvidenceItem = {
  id: string;
  type: 'vital' | 'lab' | 'order' | 'imaging';
  label: string;
  detail: string;
  source?: string;
  timestamp?: string;
};

type ProblemSummaryItem = {
  id: string;
  title: string;
  summary: string;
  plan: string;
  evidence: EvidenceItem[];
  todos: string[];
};

type ProblemCategory = {
  id: string;
  keywords: string[];
  vitalFields: Array<'temperature' | 'bloodPressure' | 'heartRate' | 'respiratoryRate' | 'oxygenSaturation'>;
  labKeys: string[];
  medKeywords: string[];
  imagingKeywords: string[];
};

const PROBLEM_CATEGORY_CONFIG: ProblemCategory[] = [
  {
    id: 'respiratory',
    keywords: ['resp', 'copd', 'pneumonia', 'oxygen', 'dyspnea', 'bronchitis'],
    vitalFields: ['oxygenSaturation', 'respiratoryRate'],
    labKeys: ['WBC'],
    medKeywords: ['azithromycin', 'guaifenesin'],
    imagingKeywords: ['chest'],
  },
  {
    id: 'infection',
    keywords: ['infection', 'sepsis', 'fever'],
    vitalFields: ['temperature', 'heartRate'],
    labKeys: ['WBC'],
    medKeywords: ['azithromycin'],
    imagingKeywords: ['chest'],
  },
  {
    id: 'renal',
    keywords: ['aki', 'renal', 'kidney'],
    vitalFields: ['bloodPressure'],
    labKeys: ['BUN', 'Creatinine'],
    medKeywords: ['furosemide', 'spironolactone'],
    imagingKeywords: [],
  },
  {
    id: 'cardiac',
    keywords: ['afib', 'atrial', 'cardiac', 'heart'],
    vitalFields: ['heartRate', 'bloodPressure'],
    labKeys: ['BNP', 'Troponin I', 'CK-MB'],
    medKeywords: ['metoprolol', 'apixaban'],
    imagingKeywords: ['echo', 'chest'],
  },
  {
    id: 'gi',
    keywords: ['abd', 'gastro', 'stool', 'diarrhea', 'nausea'],
    vitalFields: ['temperature'],
    labKeys: ['Stool'],
    medKeywords: ['ondansetron'],
    imagingKeywords: ['abdominal'],
  },
];

const DEFAULT_PROBLEM_CATEGORY: ProblemCategory = {
  id: 'general',
  keywords: [],
  vitalFields: ['bloodPressure', 'heartRate'],
  labKeys: ['WBC'],
  medKeywords: [],
  imagingKeywords: [],
};

const formatTimestamp = (input?: string) => {
  if (!input) return '';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const sanitizeLine = (line: string) => line.replace(/^([#•\-\d\.\)]+)\s*/, '');

const parseProblemSegments = (assessment: string | undefined, fallbackTitle: string): ProblemSegment[] => {
  if (!assessment?.trim()) {
    return [{ title: fallbackTitle, summary: fallbackTitle }];
  }

  const cleaned = assessment.replace(/\r/g, '\n');
  const hashMatches = cleaned.match(/#[^#\n]+/g);
  const segments: ProblemSegment[] = [];

  if (hashMatches) {
    hashMatches.forEach((match) => {
      const content = sanitizeLine(match).trim();
      if (!content) return;
      const [title, ...rest] = content.split(/[:\-]/);
      segments.push({
        title: title.trim(),
        summary: rest.join('-').trim() || content,
      });
    });
  } else {
    const lines = cleaned
      .split('\n')
      .map((line) => sanitizeLine(line).trim())
      .filter(Boolean);

    if (lines.length > 1) {
      lines.forEach((line) => {
        const [title, ...rest] = line.split(/[:\-]/);
        segments.push({
          title: title.trim(),
          summary: rest.join('-').trim() || line,
        });
      });
    }
  }

  if (!segments.length) {
    segments.push({ title: fallbackTitle, summary: cleaned.trim() || fallbackTitle });
  }

  return segments;
};

const parsePlanSegments = (plan: string | undefined): string[] => {
  if (!plan?.trim()) return [];
  return plan
    .replace(/\r/g, '\n')
    .split(/\n|•|\u2022|\-/)
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const dedupeList = (items: string[]): string[] => {
  const seen = new Set<string>();
  const output: string[] = [];
  items.forEach((item) => {
    const key = item.trim();
    if (!key || seen.has(key.toLowerCase())) return;
    seen.add(key.toLowerCase());
    output.push(key);
  });
  return output;
};

const findLabResult = (labNames: string[], labs: LabResult[]) => {
  const targets = labNames.map((name) => name.toLowerCase());
  for (const lab of labs) {
    if (!lab.results) continue;
    for (const [key, value] of Object.entries(lab.results)) {
      if (targets.includes(key.toLowerCase())) {
        return { lab, key, value };
      }
    }
  }
  return null;
};

const buildEvidenceForProblem = (
  title: string,
  vitals: NurseVital[],
  labs: LabResult[],
  meds: MedicationData[],
  imaging: ImagingData[],
): EvidenceItem[] => {
  const normalizedTitle = title.toLowerCase();
  const category =
    PROBLEM_CATEGORY_CONFIG.find((config) =>
      config.keywords.some((keyword) => normalizedTitle.includes(keyword))
    ) || DEFAULT_PROBLEM_CATEGORY;

  const evidence: EvidenceItem[] = [];
  const latestVitalsEntry = vitals.find((entry) => entry.vitalSigns);
  const vitalTimestamp = latestVitalsEntry ? formatTimestamp(latestVitalsEntry.timestamp) : '';

  if (latestVitalsEntry?.vitalSigns) {
    category.vitalFields.forEach((field) => {
      const value = latestVitalsEntry.vitalSigns?.[field];
      if (value === undefined) return;
      let label = '';
      let detail = '';
      switch (field) {
        case 'temperature':
          label = 'Temperature';
          detail = `${value}°F`;
          break;
        case 'oxygenSaturation':
          label = 'O2 Sat';
          detail = `${value}%`;
          break;
        case 'respiratoryRate':
          label = 'Resp Rate';
          detail = `${value}/min`;
          break;
        case 'heartRate':
          label = 'Heart Rate';
          detail = `${value} bpm`;
          break;
        case 'bloodPressure':
          label = 'Blood Pressure';
          detail = `${value} mmHg`;
          break;
      }

      if (label && detail) {
        evidence.push({
          id: `${title}-vital-${field}`,
          type: 'vital',
          label,
          detail,
          source: latestVitalsEntry.nurseName,
          timestamp: vitalTimestamp,
        });
      }
    });
  }

  const labTargets = category.labKeys.length ? category.labKeys : ['WBC'];
  labTargets.forEach((labName) => {
    const match = findLabResult([labName], labs);
    if (!match) return;
    const { lab, key, value } = match;
    evidence.push({
      id: `${title}-lab-${key}`,
      type: 'lab',
      label: key,
      detail: `${value.value} ${value.unit || ''} (${value.flag})`,
      source: lab.testName,
      timestamp: formatTimestamp(lab.timestamp),
    });
  });

  if (!category.labKeys.length) {
    const abnormalLab = labs.find((lab) =>
      lab.results && Object.values(lab.results).some((result) => result.flag !== 'Normal')
    );
    if (abnormalLab?.results) {
      const [key, value] = Object.entries(abnormalLab.results).find(([, result]) => result.flag !== 'Normal') || [];
      if (key && value) {
        evidence.push({
          id: `${title}-lab-${key}`,
          type: 'lab',
          label: key,
          detail: `${value.value} ${value.unit || ''} (${value.flag})`,
          source: abnormalLab.testName,
          timestamp: formatTimestamp(abnormalLab.timestamp),
        });
      }
    }
  }

  const medicationMatch =
    meds.find((med) =>
      category.medKeywords.some((keyword) => med.medicationName.toLowerCase().includes(keyword))
    ) || meds[0];

  if (medicationMatch) {
    evidence.push({
      id: `${title}-med-${medicationMatch.orderId}`,
      type: 'order',
      label: medicationMatch.medicationName,
      detail: `${medicationMatch.dosage} • ${medicationMatch.frequency}`,
      source: medicationMatch.prescribedBy,
      timestamp: formatTimestamp(medicationMatch.timestamp),
    });
  }

  const imagingMatch = imaging.find((study) =>
    category.imagingKeywords.some((keyword) => study.examType.toLowerCase().includes(keyword))
  );

  if (imagingMatch) {
    evidence.push({
      id: `${title}-img-${imagingMatch.orderId}`,
      type: 'imaging',
      label: imagingMatch.examType,
      detail: imagingMatch.impression,
      source: imagingMatch.radiologistName,
      timestamp: formatTimestamp(imagingMatch.timestamp),
    });
  }

  if (!evidence.length && latestVitalsEntry?.vitalSigns) {
    evidence.push({
      id: `${title}-vital-default`,
      type: 'vital',
      label: 'Latest Vitals',
      detail: `${latestVitalsEntry.vitalSigns.bloodPressure} mmHg • HR ${latestVitalsEntry.vitalSigns.heartRate} bpm`,
      source: latestVitalsEntry.nurseName,
      timestamp: vitalTimestamp,
    });
  }

  return evidence;
};

const collectPendingTodos = (problemTitle: string, labs: LabResult[], imaging: ImagingData[]): string[] => {
  const todos: string[] = [];
  const lowerTitle = problemTitle.toLowerCase();

  const abnormalLab = labs.find((lab) =>
    lab.results && Object.values(lab.results).some((result) => result.flag !== 'Normal')
  );
  if (abnormalLab) {
    todos.push(`Trend ${abnormalLab.testName} – last draw ${formatTimestamp(abnormalLab.timestamp)}.`);
  }

  if (lowerTitle.includes('pneumonia') || lowerTitle.includes('resp')) {
    const recentImaging = imaging.find((study) => new Date(study.timestamp).getTime() > Date.now() - 5 * 24 * 60 * 60 * 1000);
    if (recentImaging) {
      todos.push('Review most recent chest imaging interpretation.');
    } else {
      todos.push('Order follow-up chest imaging if symptoms persist.');
    }
  }

  if (lowerTitle.includes('afib') || lowerTitle.includes('cardiac')) {
    todos.push('Confirm rate control and anticoagulation adherence.');
  }

  if (!todos.length) {
    todos.push('Continue monitoring and reassess within 24 hours.');
  }

  return dedupeList(todos);
};

const buildProblemSummaries = (
  patient: Patient,
  notes: DoctorNote[],
  vitals: NurseVital[],
  labs: LabResult[],
  meds: MedicationData[],
  imaging: ImagingData[],
): ProblemSummaryItem[] => {
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const problems: ProblemSummaryItem[] = [];

  sortedNotes.forEach((note, noteIndex) => {
    const segments = parseProblemSegments(note.assessment, note.diagnosis || note.chiefComplaint);
    const planSegments = parsePlanSegments(note.plan);

    segments.forEach((segment, segmentIndex) => {
      const plan = planSegments[segmentIndex] || planSegments[0] || note.plan || 'Continue current plan of care.';
      problems.push({
        id: `${patient.id}-${noteIndex}-${segmentIndex}`,
        title: segment.title || note.diagnosis || 'Active Problem',
        summary: segment.summary,
        plan,
        evidence: buildEvidenceForProblem(segment.title, vitals, labs, meds, imaging),
        todos: collectPendingTodos(segment.title, labs, imaging),
      });
    });
  });

  const deduped = new Map<string, ProblemSummaryItem>();
  problems.forEach((problem) => {
    const key = problem.title.toLowerCase();
    if (!deduped.has(key)) {
      deduped.set(key, problem);
    }
  });

  return Array.from(deduped.values());
};

const parseBulletList = (input: string): string[] => {
  return input
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*\d\.\)\s]+/, '').trim())
    .filter(Boolean);
};

const extractJsonBlock = (text: string) => {
  const fenceMatch = text.match(/\{[\s\S]*\}/);
  return fenceMatch ? fenceMatch[0] : text;
};

const fetchProblemTodosFromGemini = async (
  patient: Patient,
  problems: ProblemSummaryItem[],
): Promise<Map<string, string[]>> => {
  const map = new Map<string, string[]>();

  const prompt = `You are helping a rounding physician prepare targeted next actions for a patient.\nPatient: ${patient.name}, ${patient.age} years old.\nProblems: ${JSON.stringify(
    problems.map((problem) => ({
      title: problem.title,
      summary: problem.summary,
      plan: problem.plan,
    })),
  )}\nRespond ONLY with valid JSON of the shape {"problem title": ["todo", "todo2"]}. Keep each todo concise.`;

  const response = await askGemini(prompt);
  const payload = extractJsonBlock(response);

  try {
    const parsed = JSON.parse(payload) as Record<string, string[]>;
    Object.entries(parsed).forEach(([title, todos]) => {
      if (Array.isArray(todos)) {
        map.set(title.toLowerCase(), todos.map((todo) => todo.trim()).filter(Boolean));
      }
    });
  } catch (error) {
    console.warn('Unable to parse Gemini todo response', error);
  }

  return map;
};

const fetchShortlistSummaryFromGemini = async (
  patient: Patient,
  problems: ProblemSummaryItem[],
  vitals: NurseVital[],
  labs: LabResult[],
  meds: MedicationData[],
): Promise<string[]> => {
  const prompt = `Provide up to 4 bullet points summarizing the most critical problems for ${patient.name} (age ${patient.age}). Each bullet should be <=20 words and include concrete signals (labs, vitals, meds) when available. Format as simple bullet list.\nProblems: ${JSON.stringify(
    problems.map((problem) => ({ title: problem.title, summary: problem.summary, plan: problem.plan })),
  )}\nLatest vitals: ${JSON.stringify(vitals[0]?.vitalSigns || {})}\nRecent labs: ${JSON.stringify(
    labs.slice(0, 2).map((lab) => ({ testName: lab.testName, results: lab.results })),
  )}\nActive meds: ${JSON.stringify(
    meds.slice(0, 3).map((med) => ({ name: med.medicationName, dose: med.dosage, freq: med.frequency })),
  )}`;

  const response = await askGemini(prompt);
  return parseBulletList(response).slice(0, 4);
};

type PatientDetailScreenProps = {
  patient: Patient;
  onBack: () => void;
};

const PatientDetailScreen = ({ patient, onBack }: PatientDetailScreenProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'medications' | 'notes'>('overview');
  const [showProblemPanel, setShowProblemPanel] = useState(false);
  const [loadingProblemSummary, setLoadingProblemSummary] = useState(false);
  const [problemSummaries, setProblemSummaries] = useState<ProblemSummaryItem[]>([]);
  const [shortlistSummary, setShortlistSummary] = useState<string[]>([]);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const patientDoctorNotes = useMemo(
    () => doctorNotes.filter((note) => note.patientId === patient.id),
    [patient.id],
  );
  const patientMedications = useMemo(
    () => medications.filter((med) => med.patientId === patient.id),
    [patient.id],
  );
  const patientLabs = useMemo(
    () => labResults.filter((lab) => lab.patientId === patient.id),
    [patient.id],
  );
  const patientVitals = useMemo(
    () => nurseVitals.filter((entry) => entry.patientId === patient.id && entry.vitalSigns),
    [patient.id],
  );
  const patientImaging = useMemo(
    () => imagingReports.filter((image) => image.patientId === patient.id),
    [patient.id],
  );

  const displayVitals: VitalSignDisplay[] = patientVitals.length
    ? [
        {
          name: 'Temperature',
          value: String(patientVitals[0].vitalSigns.temperature),
          unit: '°F',
          status: patientVitals[0].vitalSigns.temperature >= 100.4 ? 'warning' : 'normal',
          timestamp: new Date(patientVitals[0].timestamp).toLocaleString(),
        },
        {
          name: 'Oxygen Saturation',
          value: String(patientVitals[0].vitalSigns.oxygenSaturation),
          unit: '%',
          status: patientVitals[0].vitalSigns.oxygenSaturation < 92 ? 'critical' : 'normal',
          timestamp: new Date(patientVitals[0].timestamp).toLocaleString(),
        },
        {
          name: 'Respiratory Rate',
          value: String(patientVitals[0].vitalSigns.respiratoryRate),
          unit: '/min',
          status: 'normal',
          timestamp: new Date(patientVitals[0].timestamp).toLocaleString(),
        },
        {
          name: 'Heart Rate',
          value: String(patientVitals[0].vitalSigns.heartRate),
          unit: 'bpm',
          status: patientVitals[0].vitalSigns.heartRate > 110 ? 'warning' : 'normal',
          timestamp: new Date(patientVitals[0].timestamp).toLocaleString(),
        },
      ]
    : [];

  const displayMedications: MedicationDisplay[] = patientMedications
    .filter((med) => med.status === 'Active')
    .map((med) => ({
      name: med.medicationName,
      dosage: med.dosage,
      frequency: med.frequency,
      route: med.route,
    }));

  const displayNotes: ClinicalNoteDisplay[] = patientDoctorNotes.map((note) => ({
    date: new Date(note.timestamp).toLocaleString(),
    author: note.doctorName,
    note: `Chief Complaint: ${note.chiefComplaint}\nDiagnosis: ${note.diagnosis}\nAssessment: ${note.assessment}\nPlan: ${note.plan}`,
  }));

  const closeProblemPanel = useCallback(() => {
    setShowProblemPanel(false);
    setSummaryError(null);
  }, []);

  const openProblemSummaryPanel = useCallback(async () => {
    setSummaryError(null);
    setShowProblemPanel(true);
    setLoadingProblemSummary(true);
    setShortlistSummary([]);
    setProblemSummaries([]);

    try {
      if (!patientDoctorNotes.length) {
        setSummaryError('No physician documentation available for this patient.');
        return;
      }

      const problems = buildProblemSummaries(
        patient,
        patientDoctorNotes,
        patientVitals,
        patientLabs,
        patientMedications,
        patientImaging,
      );

      if (!problems.length) {
        setSummaryError('No recent doctor notes available to build a problem list.');
        return;
      }

      let todoMap: Map<string, string[]> | null = null;
      try {
        todoMap = await fetchProblemTodosFromGemini(patient, problems);
      } catch (geminiError) {
        console.warn('Gemini problem todo error', geminiError);
      }

      const enrichedProblems = problems.map((problem) => {
        const aiTodos = todoMap?.get(problem.title.toLowerCase()) || [];
        return {
          ...problem,
          todos: dedupeList([...problem.todos, ...aiTodos]),
        };
      });

      setProblemSummaries(enrichedProblems);

      try {
        const shortlist = await fetchShortlistSummaryFromGemini(
          patient,
          enrichedProblems,
          patientVitals,
          patientLabs,
          patientMedications,
        );
        if (shortlist.length) {
          setShortlistSummary(shortlist);
        } else {
          setShortlistSummary(enrichedProblems.slice(0, 3).map((problem) => `${problem.title}: ${problem.summary}`));
        }
      } catch (shortlistError) {
        console.error('Gemini shortlist error', shortlistError);
        setShortlistSummary(enrichedProblems.slice(0, 3).map((problem) => `${problem.title}: ${problem.summary}`));
      }
    } catch (error) {
      console.error('Problem summary error', error);
      setProblemSummaries([]);
      setSummaryError('Unable to build the problem-oriented summary. Please try again.');
    } finally {
      setLoadingProblemSummary(false);
    }
  }, [
    patient,
    patientDoctorNotes,
    patientVitals,
    patientLabs,
    patientMedications,
    patientImaging,
  ]);

  const getStatusColor = (status: PatientStatus) => {
    switch (status) {
      case 'stable':
        return '#059669';
      case 'improving':
        return '#0284c7';
      case 'critical':
        return '#dc2626';
    }
  };

  const getStatusBgColor = (status: PatientStatus) => {
    switch (status) {
      case 'stable':
        return '#d1fae5';
      case 'improving':
        return '#dbeafe';
      case 'critical':
        return '#fee2e2';
    }
  };

  const getPriorityIcon = (priority: Patient['priority']) => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
    }
  };

  const getVitalStatusColor = (status: VitalSignDisplay['status']) => {
    switch (status) {
      case 'normal':
        return '#059669';
      case 'warning':
        return '#f59e0b';
      case 'critical':
        return '#dc2626';
    }
  };

  const getEvidenceIcon = (type: EvidenceItem['type']) => {
    switch (type) {
      case 'vital':
        return '💓';
      case 'lab':
        return '🧪';
      case 'order':
        return '💊';
      case 'imaging':
        return '🩻';
      default:
        return '📌';
    }
  };

  const renderProblemPanel = () => (
    <View style={styles.problemPanel}>
      <View style={styles.problemPanelHeader}>
        <TouchableOpacity style={styles.panelBackButton} onPress={closeProblemPanel} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.problemPanelHeaderText}>
          <Text style={styles.problemPanelTitle}>Problem Sign-out</Text>
          <Text style={styles.problemPanelSubtitle}>{patient.name}</Text>
        </View>
        <TouchableOpacity
          style={[styles.panelRefreshButton, loadingProblemSummary && styles.panelRefreshButtonDisabled]}
          onPress={openProblemSummaryPanel}
          disabled={loadingProblemSummary}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={22} color="#0f172a" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.panelScroll} contentContainerStyle={styles.panelScrollContent}>
        {loadingProblemSummary && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#0284c7" size="large" />
            <Text style={styles.loadingText}>Building shortlist</Text>
            <Text style={styles.loadingSubtext}>Summaries and evidence are generated in real-time</Text>
          </View>
        )}

        {!loadingProblemSummary && summaryError && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning" color="#b91c1c" size={20} />
            <Text style={styles.errorText}>{summaryError}</Text>
          </View>
        )}

        {!loadingProblemSummary && !summaryError && (
          <>
            {shortlistSummary.length > 0 && (
              <View style={styles.shortlistCard}>
                <View style={styles.shortlistTitleRow}>
                  <Text style={styles.shortlistTitle}>Shortlist</Text>
                  <View style={styles.shortlistBadge}>
                    <Text style={styles.shortlistBadgeText}>AI CURATED</Text>
                  </View>
                </View>
                {shortlistSummary.map((item, index) => (
                  <View key={index} style={styles.shortlistItem}>
                    <View style={styles.shortlistBullet} />
                    <Text style={styles.shortlistText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.problemList}>
              {problemSummaries.map((problem) => (
                <View key={problem.id} style={styles.problemCard}>
                  <View style={styles.problemHeader}>
                    <Text style={styles.problemTitle}>{problem.title}</Text>
                    <Text style={styles.problemSummary}>{problem.summary}</Text>
                  </View>
                  {problem.plan && (
                    <View style={styles.problemPlanBlock}>
                      <Text style={styles.problemPlanLabel}>Plan</Text>
                      <Text style={styles.problemPlanText}>{problem.plan}</Text>
                    </View>
                  )}

                  {problem.evidence.length > 0 && (
                    <View style={styles.problemSection}>
                      <Text style={styles.problemSectionLabel}>Evidence</Text>
                      <View style={styles.evidenceChipGrid}>
                        {problem.evidence.map((item) => (
                          <View key={item.id} style={styles.evidenceChip}>
                            <Text style={styles.evidenceChipIcon}>{getEvidenceIcon(item.type)}</Text>
                            <View style={styles.evidenceChipContent}>
                              <Text style={styles.evidenceChipLabel}>{item.label}</Text>
                              <Text style={styles.evidenceChipDetail}>{item.detail}</Text>
                              {(item.source || item.timestamp) && (
                                <Text style={styles.evidenceChipMeta}>
                                  {[item.source, item.timestamp].filter(Boolean).join(' • ')}
                                </Text>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {problem.todos.length > 0 && (
                    <View style={styles.problemSection}>
                      <Text style={styles.problemSectionLabel}>Next steps</Text>
                      {problem.todos.map((todo, index) => (
                        <View key={`${problem.id}-todo-${index}`} style={styles.todoItem}>
                          <View style={styles.todoBullet} />
                          <Text style={styles.todoText}>{todo}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Patient Details</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <Ionicons name="create-outline" size={24} color="#0f172a" />
            </TouchableOpacity>
          </View>
        </View>

        {showProblemPanel ? (
          renderProblemPanel()
        ) : (
          <>
            <View style={styles.patientCard}>
              <View style={styles.patientCardHeader}>
                <View style={styles.patientInfo}>
                  <View style={styles.patientNameRow}>
                    <Text style={styles.patientName}>{patient.name}</Text>
                    <Text style={styles.priorityIcon}>{getPriorityIcon(patient.priority)}</Text>
                  </View>
                  <View style={styles.patientMetaRow}>
                    <Text style={styles.metaText}>MRN: {patient.mrn}</Text>
                    <Text style={styles.metaDivider}>•</Text>
                    <Text style={styles.metaText}>{patient.age} years</Text>
                    <Text style={styles.metaDivider}>•</Text>
                    <Text style={styles.metaText}>Room {patient.roomNumber}</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusBgColor(patient.status) },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(patient.status) },
                    ]}
                  >
                    {patient.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
                onPress={() => setActiveTab('overview')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
                  Overview
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'vitals' && styles.activeTab]}
                onPress={() => setActiveTab('vitals')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, activeTab === 'vitals' && styles.activeTabText]}>
                  Vitals
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'medications' && styles.activeTab]}
                onPress={() => setActiveTab('medications')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, activeTab === 'medications' && styles.activeTabText]}>
                  Meds
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'notes' && styles.activeTab]}
                onPress={() => setActiveTab('notes')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, activeTab === 'notes' && styles.activeTabText]}>
                  Notes
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
              {activeTab === 'overview' && (
                <>
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionIcon}>🩺</Text>
                      <Text style={styles.sectionTitle}>Diagnosis</Text>
                    </View>
                    <View style={styles.card}>
                      <Text style={styles.diagnosisText}>{patient.diagnosis}</Text>
                    </View>
                  </View>

                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionIcon}>💓</Text>
                      <Text style={styles.sectionTitle}>Latest Vitals</Text>
                    </View>
                    <View style={styles.card}>
                      <View style={styles.vitalsGrid}>
                        {displayVitals.slice(0, 4).map((vital, index) => (
                          <View key={index} style={styles.vitalQuickCard}>
                            <Text style={styles.vitalValue}>{vital.value}</Text>
                            <Text style={styles.vitalUnit}>{vital.unit}</Text>
                            <Text style={styles.vitalName}>{vital.name}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionIcon}>💊</Text>
                      <Text style={styles.sectionTitle}>Current Medications</Text>
                    </View>
                    <View style={styles.card}>
                      {displayMedications.slice(0, 3).map((med, index) => (
                        <View key={index} style={styles.medItem}>
                          <Text style={styles.medName}>{med.name}</Text>
                          <Text style={styles.medDetails}>
                            {med.dosage} - {med.frequency}
                          </Text>
                        </View>
                      ))}
                      {displayMedications.length > 3 && (
                        <Text style={styles.seeMore}>+ {displayMedications.length - 3} more medications</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionIcon}>📝</Text>
                      <Text style={styles.sectionTitle}>Recent Notes</Text>
                    </View>
                    <View style={styles.card}>
                      {displayNotes.slice(0, 1).map((note, index) => (
                        <View key={index}>
                          <View style={styles.noteHeader}>
                            <Text style={styles.noteAuthor}>{note.author}</Text>
                            <Text style={styles.noteDate}>{note.date}</Text>
                          </View>
                          <Text style={styles.noteText}>{note.note}</Text>
                        </View>
                      ))}
                      {displayNotes.length > 1 && (
                        <Text style={styles.seeMore}>+ {displayNotes.length - 1} more notes</Text>
                      )}
                    </View>
                  </View>
                </>
              )}

              {activeTab === 'vitals' && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionIcon}>💓</Text>
                    <Text style={styles.sectionTitle}>Vital Signs</Text>
                  </View>
                  {displayVitals.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No vital signs recorded for this patient</Text>
                    </View>
                  ) : (
                    displayVitals.map((vital, index) => (
                      <View key={index} style={styles.vitalCard}>
                        <View style={styles.vitalHeader}>
                          <Text style={styles.vitalCardName}>{vital.name}</Text>
                          <View
                            style={[
                              styles.vitalStatusBadge,
                              { backgroundColor: `${getVitalStatusColor(vital.status)}20` },
                            ]}
                          >
                            <Text
                              style={[
                                styles.vitalStatusText,
                                { color: getVitalStatusColor(vital.status) },
                              ]}
                            >
                              {vital.status.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.vitalValueRow}>
                          <Text style={styles.vitalCardValue}>
                            {vital.value} <Text style={styles.vitalCardUnit}>{vital.unit}</Text>
                          </Text>
                          <Text style={styles.vitalTimestamp}>{vital.timestamp}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}

              {activeTab === 'medications' && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionIcon}>💊</Text>
                    <Text style={styles.sectionTitle}>Current Medications</Text>
                  </View>
                  {displayMedications.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No active medications for this patient</Text>
                    </View>
                  ) : (
                    displayMedications.map((med, index) => (
                      <View key={index} style={styles.medicationCard}>
                        <View style={styles.medicationHeader}>
                          <Text style={styles.medicationName}>{med.name}</Text>
                          <View style={styles.medicationRouteBadge}>
                            <Text style={styles.medicationRouteText}>{med.route}</Text>
                          </View>
                        </View>
                        <Text style={styles.medicationDosage}>{med.dosage}</Text>
                        <Text style={styles.medicationFrequency}>📅 {med.frequency}</Text>
                      </View>
                    ))
                  )}
                </View>
              )}

              {activeTab === 'notes' && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionIcon}>📝</Text>
                    <Text style={styles.sectionTitle}>Clinical Notes</Text>
                  </View>
                  {displayNotes.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No clinical notes recorded for this patient</Text>
                    </View>
                  ) : (
                    displayNotes.map((note, index) => (
                      <View key={index} style={styles.noteCard}>
                        <View style={styles.noteCardHeader}>
                          <View>
                            <Text style={styles.noteCardAuthor}>{note.author}</Text>
                            <Text style={styles.noteCardDate}>{note.date}</Text>
                          </View>
                        </View>
                        <Text style={styles.noteCardText}>{note.note}</Text>
                      </View>
                    ))
                  )}
                </View>
              )}
            </ScrollView>

            <View style={styles.actionBar}>
              <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Add Note</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                activeOpacity={0.7}
                onPress={openProblemSummaryPanel}
              >
                <Ionicons name="list-circle-outline" size={20} color="#0284c7" />
                <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Problem Summary</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  patientCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  patientCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patientInfo: {
    flex: 1,
  },
  patientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  patientName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  priorityIcon: {
    fontSize: 16,
  },
  patientMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#64748b',
  },
  metaDivider: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#0284c7',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  diagnosisText: {
    fontSize: 15,
    color: '#1e293b',
    lineHeight: 22,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vitalQuickCard: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  vitalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  vitalUnit: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  vitalName: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
  },
  medItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  medName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  medDetails: {
    fontSize: 13,
    color: '#64748b',
  },
  seeMore: {
    fontSize: 14,
    color: '#0284c7',
    marginTop: 12,
    fontWeight: '500',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  noteDate: {
    fontSize: 12,
    color: '#64748b',
  },
  noteText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  vitalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  vitalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vitalCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  vitalStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vitalStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  vitalValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  vitalCardValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  vitalCardUnit: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '400',
  },
  vitalTimestamp: {
    fontSize: 12,
    color: '#94a3b8',
  },
  medicationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
  },
  medicationRouteBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  medicationRouteText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  medicationDosage: {
    fontSize: 16,
    color: '#0284c7',
    fontWeight: '600',
    marginBottom: 6,
  },
  medicationFrequency: {
    fontSize: 14,
    color: '#64748b',
  },
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  noteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  noteCardAuthor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  noteCardDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  noteCardText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 12,
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#0284c7',
  },
  problemPanel: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  problemPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  panelBackButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: '#f8fafc',
  },
  problemPanelHeaderText: {
    flex: 1,
  },
  problemPanelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  problemPanelSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  panelRefreshButton: {
    padding: 6,
  },
  panelRefreshButtonDisabled: {
    opacity: 0.4,
  },
  panelScroll: {
    flex: 1,
  },
  panelScrollContent: {
    padding: 20,
    gap: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    flex: 1,
    fontSize: 15,
    color: '#b91c1c',
    lineHeight: 20,
  },
  problemList: {
    gap: 16,
  },
  problemCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 16,
  },
  problemHeader: {
    gap: 6,
  },
  problemTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  problemSummary: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  problemPlanBlock: {
    backgroundColor: '#ecfeff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  problemPlanLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
    marginBottom: 4,
  },
  problemPlanText: {
    fontSize: 14,
    color: '#0f172a',
    lineHeight: 20,
  },
  problemSection: {
    gap: 10,
  },
  problemSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: 0.2,
  },
  evidenceChipGrid: {
    gap: 10,
  },
  evidenceChip: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  evidenceChipIcon: {
    fontSize: 20,
  },
  evidenceChipContent: {
    flex: 1,
    gap: 2,
  },
  evidenceChipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  evidenceChipDetail: {
    fontSize: 13,
    color: '#475569',
  },
  evidenceChipMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  todoBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284c7',
    marginTop: 8,
  },
  todoText: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    lineHeight: 20,
  },
  shortlistCard: {
    backgroundColor: '#ecfeff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
    gap: 12,
  },
  shortlistTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shortlistTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  shortlistBadge: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  shortlistBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  shortlistItem: {
    flexDirection: 'row',
    gap: 8,
  },
  shortlistBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0284c7',
    marginTop: 7,
  },
  shortlistText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#0f172a',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

export default PatientDetailScreen;
