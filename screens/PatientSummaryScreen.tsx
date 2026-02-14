import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import RoleHeader from '../components/RoleHeader';
import { askGemini } from '../services/gemini';

type PatientFiles = {
  profile: {
    name: string;
    age: number;
    gender: 'male' | 'female' | 'other';
  };
  diagnoses: Array<{
    label: string;
    notedOn: string;
  }>;
  medications: Array<{
    name: string;
    dosage: string;
    schedule: string;
  }>;
  tests: Array<{
    name: string;
    result: string;
    date: string;
  }>;
  trends: Array<{
    metric: string;
    direction: 'improving' | 'stable' | 'worsening';
    detail: string;
  }>;
  notes: string;
};

type GeminiSection = {
  heading: string;
  content: string;
};

const patientFiles: PatientFiles = {
  profile: {
    name: 'Avery Thompson',
    age: 62,
    gender: 'female',
  },
  diagnoses: [
    { label: 'Type 2 Diabetes Mellitus', notedOn: '2021-04-12' },
    { label: 'Hypertension', notedOn: '2018-09-04' },
    { label: 'Hyperlipidemia', notedOn: '2020-02-17' },
  ],
  medications: [
    { name: 'Metformin', dosage: '1000 mg', schedule: 'Twice daily with meals' },
    { name: 'Lisinopril', dosage: '20 mg', schedule: 'Once daily in the morning' },
    { name: 'Atorvastatin', dosage: '40 mg', schedule: 'Once nightly' },
  ],
  tests: [
    { name: 'A1C', result: '7.2%', date: '2026-01-15' },
    { name: 'LDL Cholesterol', result: '95 mg/dL', date: '2025-12-20' },
    { name: 'Blood Pressure', result: '132/82 mmHg', date: '2026-02-10' },
  ],
  trends: [
    {
      metric: 'Blood Glucose Variability',
      direction: 'improving',
      detail: 'Average post-prandial values decreased by 12% over the last 6 weeks.',
    },
    {
      metric: 'Medication Adherence',
      direction: 'stable',
      detail: 'Digital pillbox reports >92% adherence for 90-day period.',
    },
    {
      metric: 'Renal Function',
      direction: 'worsening',
      detail: 'eGFR dropped from 68 to 60 mL/min/1.73m² over 12 months.',
    },
  ],
  notes:
    'Patient enrolled in lifestyle coaching. Reports improved energy with 20-minute walks daily. Monitoring for nephropathy recommended.',
};

const buildSummaryPrompt = (files: PatientFiles) => {
  const serialized = JSON.stringify(files);
  return [
    'You are an AI clinical scribe assisting a care coordination team.',
    'Given the structured patient chart data below, write a concise and clinician-friendly summary with short bullet points.',
    'Include headings for Diagnosis, Medications, Key Tests, Trends, and Recommendations.',
    'Avoid speculation, stay within the provided chart, and keep each section to three bullets or fewer.',
    `Patient chart: ${serialized}`,
  ].join('\n');
};

const buildFollowUpPrompt = (files: PatientFiles, question: string) => {
  const serialized = JSON.stringify(files);
  return [
    'You are supporting a multidisciplinary care team reviewing a patient chart.',
    'Answer the question using only the chart data provided. Be clear and brief.',
    `Question: ${question}`,
    `Patient chart: ${serialized}`,
  ].join('\n');
};

const PatientSummaryScreen = ({ onLogout }: { onLogout: () => void }) => {
  const [summarySections, setSummarySections] = useState<GeminiSection[]>([]);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [answerLoading, setAnswerLoading] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);

  const diagnosisItems = useMemo(() => patientFiles.diagnoses, []);
  const medicationItems = useMemo(() => patientFiles.medications, []);
  const testItems = useMemo(() => patientFiles.tests, []);
  const trendItems = useMemo(() => patientFiles.trends, []);

  const parseSummary = useCallback((text: string): GeminiSection[] => {
    if (!text) return [];

    const sections: GeminiSection[] = [];
    const lines = text.split(/\n+/g).map((line) => line.trim()).filter(Boolean);

    let currentHeading: string | null = null;
    let buffer: string[] = [];

    const flushBuffer = () => {
      if (currentHeading) {
        sections.push({ heading: currentHeading, content: buffer.join('\n') || 'No details provided.' });
      }
      buffer = [];
    };

    for (const line of lines) {
      const headingMatch = /^([A-Z][A-Za-z\s]+):?$/.exec(line);
      if (headingMatch) {
        flushBuffer();
        currentHeading = headingMatch[1];
      } else {
        buffer.push(line.replace(/^[-\u2022\u25CF\u25E6\s]+/, '• '));
      }
    }
    flushBuffer();

    return sections.length ? sections : [{ heading: 'Summary', content: text }];
  }, []);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);

    try {
      const prompt = buildSummaryPrompt(patientFiles);
      const response = await askGemini(prompt);
      setSummarySections(parseSummary(response));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reach Gemini.';
      setSummaryError(message);
      setSummarySections([]);
    } finally {
      setSummaryLoading(false);
    }
  }, [parseSummary]);

  const handleAskQuestion = useCallback(async () => {
    const trimmed = question.trim();
    if (!trimmed || answerLoading) {
      return;
    }

    setAnswerLoading(true);
    setAnswerError(null);
    setAnswer('');

    try {
      const prompt = buildFollowUpPrompt(patientFiles, trimmed);
      const response = await askGemini(prompt);
      setAnswer(response || 'No answer returned.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reach Gemini.';
      setAnswerError(message);
    } finally {
      setAnswerLoading(false);
    }
  }, [answerLoading, question]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={summaryLoading} onRefresh={fetchSummary} />}
        >
        <View style={styles.header}>
          <Text style={styles.title}>Your Health Summary</Text>
          <Text style={styles.subtitle}>
            {patientFiles.profile.name} • {patientFiles.profile.age} • {patientFiles.profile.gender}
          </Text>
        </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>AI Summary</Text>
          {summaryLoading ? <ActivityIndicator size="small" color="#2b6cb0" /> : null}
        </View>
        {summaryError ? <Text style={styles.errorText}>{summaryError}</Text> : null}
        {!summaryLoading && !summaryError && summarySections.length === 0 ? (
          <Text style={styles.placeholderText}>No AI summary available yet.</Text>
        ) : null}
        {summarySections.map((section) => (
          <View key={section.heading} style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionBody}>{section.content}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Diagnoses</Text>
        {diagnosisItems.map((item) => (
          <View key={item.label} style={styles.listItem}>
            <Text style={styles.listItemTitle}>{item.label}</Text>
            <Text style={styles.listItemSubtitle}>Identified: {item.notedOn}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Medications</Text>
        {medicationItems.map((item) => (
          <View key={item.name} style={styles.listItem}>
            <Text style={styles.listItemTitle}>{item.name}</Text>
            <Text style={styles.listItemSubtitle}>
              {item.dosage} • {item.schedule}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Tests</Text>
        {testItems.map((item) => (
          <View key={`${item.name}-${item.date}`} style={styles.listItem}>
            <Text style={styles.listItemTitle}>{item.name}</Text>
            <Text style={styles.listItemSubtitle}>
              {item.result} • {item.date}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Trends</Text>
        {trendItems.map((item) => (
          <View key={item.metric} style={styles.listItem}>
            <Text style={styles.listItemTitle}>{item.metric}</Text>
            <Text style={styles.listItemSubtitle}>
              {item.direction.toUpperCase()} • {item.detail}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ask AI</Text>
        <Text style={styles.helperText}>Ask a quick question about this patient&apos;s chart.</Text>
        <TextInput
          value={question}
          onChangeText={setQuestion}
          placeholder="e.g. What should the care team monitor this week?"
          placeholderTextColor="#a0aec0"
          style={styles.textInput}
          editable={!answerLoading}
          multiline
        />
        <TouchableOpacity
          style={[styles.button, answerLoading && styles.buttonDisabled]}
          onPress={handleAskQuestion}
          disabled={answerLoading}
        >
          {answerLoading ? (
            <ActivityIndicator size="small" color="#f7fafc" />
          ) : (
            <Text style={styles.buttonLabel}>Ask AI</Text>
          )}
        </TouchableOpacity>
        {answerError ? <Text style={styles.errorText}>{answerError}</Text> : null}
        {answer ? <Text style={styles.answerText}>{answer}</Text> : null}
      </View>
      </ScrollView>
      <RoleHeader role="Patient" onLogout={onLogout} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a202c',
  },
  subtitle: {
    fontSize: 16,
    color: '#4a5568',
    marginTop: 4,
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
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 8,
  },
  sectionBlock: {
    marginTop: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2b6cb0',
    marginBottom: 4,
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
  },
  placeholderText: {
    color: '#64748b',
    fontSize: 14,
  },
  listItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  listItemTitle: {
    fontSize: 16,
    color: '#1a202c',
    fontWeight: '500',
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 2,
  },
  helperText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 60,
    textAlignVertical: 'top',
    color: '#1a202c',
    backgroundColor: '#f8fafc',
  },
  button: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#2563eb',
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  buttonLabel: {
    color: '#f8fafc',
    fontWeight: '600',
    fontSize: 16,
  },
  errorText: {
    marginTop: 12,
    color: '#dc2626',
    fontSize: 14,
  },
  answerText: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: '#1f2937',
  },
});

export default PatientSummaryScreen;
