import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { askGemini } from '../services/gemini';

type PatientRecord = {
  demographics: {
    mrn: string;
    name: string;
    dob: string;
    primaryPhysician: string;
  };
  problems: Array<{
    code: string;
    label: string;
    status: 'active' | 'resolved';
    lastUpdated: string;
  }>;
  labs: Array<{
    name: string;
    value: string;
    unit: string;
    reference: string;
    flagged: boolean;
    collectedAt: string;
  }>;
  medications: Array<{
    name: string;
    dose: string;
    route: string;
    frequency: string;
    startDate: string;
  }>;
  vitals: Array<{
    name: string;
    value: string;
    unit: string;
    recordedAt: string;
  }>;
  encounters: Array<{
    type: string;
    date: string;
    summary: string;
  }>;
  notes: string;
};

type DoctorSections = {
  problems: string;
  abnormalLabs: string;
  suggestedActions: string;
};

const mockPatientRecord: PatientRecord = {
  demographics: {
    mrn: 'HT-482991',
    name: 'Avery Thompson',
    dob: '1964-08-17',
    primaryPhysician: 'Dr. Jonah Patel',
  },
  problems: [
    { code: 'E11.9', label: 'Type 2 Diabetes Mellitus', status: 'active', lastUpdated: '2026-01-15' },
    { code: 'I10', label: 'Essential Hypertension', status: 'active', lastUpdated: '2026-02-10' },
    { code: 'N18.2', label: 'Chronic Kidney Disease Stage 2', status: 'active', lastUpdated: '2025-12-05' },
  ],
  labs: [
    { name: 'Hemoglobin A1C', value: '7.5', unit: '%', reference: '4.0 - 5.6', flagged: true, collectedAt: '2026-01-15' },
    { name: 'eGFR', value: '58', unit: 'mL/min/1.73m²', reference: '>60', flagged: true, collectedAt: '2026-02-01' },
    { name: 'Creatinine', value: '1.3', unit: 'mg/dL', reference: '0.6 - 1.1', flagged: true, collectedAt: '2026-02-01' },
    { name: 'LDL', value: '92', unit: 'mg/dL', reference: '<100', flagged: false, collectedAt: '2026-01-05' },
    { name: 'Blood Glucose (fasting)', value: '118', unit: 'mg/dL', reference: '70 - 99', flagged: true, collectedAt: '2026-02-10' },
  ],
  medications: [
    { name: 'Metformin', dose: '1000 mg', route: 'oral', frequency: 'twice daily', startDate: '2019-05-12' },
    { name: 'Empagliflozin', dose: '10 mg', route: 'oral', frequency: 'once daily', startDate: '2025-09-03' },
    { name: 'Lisinopril', dose: '20 mg', route: 'oral', frequency: 'once daily', startDate: '2018-09-01' },
    { name: 'Atorvastatin', dose: '40 mg', route: 'oral', frequency: 'once nightly', startDate: '2020-02-17' },
  ],
  vitals: [
    { name: 'Blood Pressure', value: '134/84', unit: 'mmHg', recordedAt: '2026-02-10' },
    { name: 'Heart Rate', value: '72', unit: 'bpm', recordedAt: '2026-02-10' },
    { name: 'Weight', value: '178', unit: 'lbs', recordedAt: '2026-02-10' },
  ],
  encounters: [
    {
      type: 'Endocrinology visit',
      date: '2026-01-15',
      summary: 'Discussed glucose variability. Added SGLT2 inhibitor. Reinforced diet adherence.',
    },
    {
      type: 'Telehealth nurse check-in',
      date: '2026-02-05',
      summary: 'Patient reports mild dizziness in evenings. Encouraged hydration and BP monitoring.',
    },
  ],
  notes:
    'Patient uses connected glucometer and BP cuff. Reports occasional medication fatigue. Planning travel next month; requests medication refill synchronization.',
};

const doctorPrompt = (record: PatientRecord) => {
  const serialized = JSON.stringify(record);
  return [
    'You are an assistant for a supervising physician reviewing today\'s rounding list.',
    'Summarize key clinical changes, list abnormal or trending-worse labs with context, and suggest next actions.',
    'Respond using three sections titled: Problem list, Abnormal labs, Suggested actions.',
    'Keep items concise (max 3 per section) and grounded strictly in the chart data provided. No speculation.',
    `Patient record: ${serialized}`,
  ].join('\n');
};

const defaultSections: DoctorSections = {
  problems: 'No problem updates available.',
  abnormalLabs: 'No abnormal labs reported.',
  suggestedActions: 'No suggestions at this time.',
};

const parseDoctorResponse = (text: string): DoctorSections => {
  if (!text) {
    return defaultSections;
  }

  const sections = { ...defaultSections };
  const lines = text.split(/\n+/g).map((line) => line.trim()).filter(Boolean);
  let currentKey: keyof DoctorSections | null = null;
  const mapHeading = (heading: string): keyof DoctorSections | null => {
    const normalized = heading.toLowerCase();
    if (normalized.startsWith('problem')) return 'problems';
    if (normalized.includes('lab')) return 'abnormalLabs';
    if (normalized.includes('action')) return 'suggestedActions';
    return null;
  };

  const buffers: Record<keyof DoctorSections, string[]> = {
    problems: [],
    abnormalLabs: [],
    suggestedActions: [],
  };

  for (const line of lines) {
    const headingMatch = /^([A-Za-z\s]+):?$/.exec(line);
    if (headingMatch) {
      const key = mapHeading(headingMatch[1]);
      if (key) {
        currentKey = key;
        continue;
      }
    }

    if (currentKey) {
      buffers[currentKey].push(line.replace(/^[-\u2022\u25CF\u25E6\s]+/, '• '));
    }
  }

  (Object.keys(buffers) as Array<keyof DoctorSections>).forEach((key) => {
    if (buffers[key].length) {
      sections[key] = buffers[key].join('\n');
    }
  });

  return sections;
};

const DoctorDashboardScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<DoctorSections>(defaultSections);

  const patientHeader = useMemo(() => {
    return `${mockPatientRecord.demographics.name} • MRN ${mockPatientRecord.demographics.mrn}`;
  }, []);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const prompt = doctorPrompt(mockPatientRecord);
      const response = await askGemini(prompt);
      setSections(parseDoctorResponse(response));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach Gemini.';
      setError(message);
      setSections(defaultSections);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchSummary} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Doctor Dashboard</Text>
        <Text style={styles.subtitle}>{patientHeader}</Text>
        <Text style={styles.metaText}>Primary: {mockPatientRecord.demographics.primaryPhysician}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>AI Briefing</Text>
          {loading ? <ActivityIndicator size="small" color="#2563eb" /> : null}
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <SectionBlock heading="Problem list" body={sections.problems} />
        <SectionBlock heading="Abnormal labs" body={sections.abnormalLabs} />
        <SectionBlock heading="Suggested actions" body={sections.suggestedActions} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Labs</Text>
        {mockPatientRecord.labs.map((lab) => (
          <View key={`${lab.name}-${lab.collectedAt}`} style={styles.listItem}>
            <Text style={styles.listItemTitle}>{lab.name}</Text>
            <Text style={[styles.listItemSubtitle, lab.flagged ? styles.listItemAlert : undefined]}>
              {lab.value} {lab.unit} • Ref {lab.reference} • {lab.collectedAt}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Active Problems</Text>
        {mockPatientRecord.problems.map((problem) => (
          <View key={problem.code} style={styles.listItem}>
            <Text style={styles.listItemTitle}>{problem.label}</Text>
            <Text style={styles.listItemSubtitle}>
              Code {problem.code} • {problem.status.toUpperCase()} • Updated {problem.lastUpdated}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Medications</Text>
        {mockPatientRecord.medications.map((med) => (
          <View key={`${med.name}-${med.startDate}`} style={styles.listItem}>
            <Text style={styles.listItemTitle}>{med.name}</Text>
            <Text style={styles.listItemSubtitle}>
              {med.dose} {med.route} • {med.frequency} • Since {med.startDate}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Encounters</Text>
        {mockPatientRecord.encounters.map((encounter) => (
          <View key={`${encounter.type}-${encounter.date}`} style={styles.listItem}>
            <Text style={styles.listItemTitle}>{encounter.type}</Text>
            <Text style={styles.listItemSubtitle}>
              {encounter.date} • {encounter.summary}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

type SectionBlockProps = {
  heading: string;
  body: string;
};

const SectionBlock = ({ heading, body }: SectionBlockProps) => (
  <View style={styles.sectionBlock}>
    <Text style={styles.sectionHeading}>{heading}</Text>
    <Text style={styles.sectionBody}>{body}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 16,
    color: '#475569',
  },
  metaText: {
    marginTop: 2,
    fontSize: 14,
    color: '#64748b',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  sectionBlock: {
    marginTop: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 4,
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1f2937',
  },
  listItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  listItemTitle: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 2,
  },
  listItemAlert: {
    color: '#dc2626',
    fontWeight: '600',
  },
  errorText: {
    color: '#dc2626',
    marginBottom: 8,
    fontSize: 14,
  },
});

export default DoctorDashboardScreen;
