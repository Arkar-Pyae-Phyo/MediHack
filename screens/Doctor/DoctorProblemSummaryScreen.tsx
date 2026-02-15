import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertCircle, RefreshCw, Stethoscope, TrendingUp } from 'lucide-react-native';
import { askGemini } from '../../services/gemini';

import doctorNotes from '../../sample_data/doc_clean.json';
import labs from '../../sample_data/lab_clean.json';
import vitals from '../../sample_data/nurse_clean.json';
import meds from '../../sample_data/drug_clean.json';

const ACTIVE_PATIENT_ID = 'an1';

const buildPrompt = (noteDigest: string, labDigest: string, vitalDigest: string, medDigest: string) => `
You are an ICU rounding assistant. Summarize the active problems from assessment/plan notes.
Return concise JSON only in the following shape:
{
  "problems": [
    {
      "name": "...",
      "plan": "...",
      "evidence": ["Vital: ...", "Lab: ...", "Order: ..."]
    }
  ]
}
Use the evidence strings to cite labs/vitals/orders sent below. NEVER invent data.

Doctor Notes:\n${noteDigest}
Recent Labs:\n${labDigest}
Recent Vitals:\n${vitalDigest}
Active Meds/Orders:\n${medDigest}
`;

type ProblemEntry = {
  name: string;
  plan: string;
  evidence: string[];
};

const parseResponse = (payload: string): ProblemEntry[] => {
  try {
    const jsonStart = payload.indexOf('{');
    const jsonEnd = payload.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      return [];
    }
    const parsed = JSON.parse(payload.slice(jsonStart, jsonEnd + 1));
    if (!Array.isArray(parsed?.problems)) {
      return [];
    }
    return parsed.problems
      .map((entry: any) => ({
        name: entry?.name ?? 'Unspecified problem',
        plan: entry?.plan ?? 'No plan provided',
        evidence: Array.isArray(entry?.evidence) ? entry.evidence : [],
      }))
      .filter((item: ProblemEntry) => item.name.trim());
  } catch (error) {
    console.warn('Unable to parse doctor problem summary', error);
    return [];
  }
};

const DoctorProblemSummaryScreen = () => {
  const noteDigest = useMemo(() => {
    return doctorNotes
      .filter((note) => note.patientId === ACTIVE_PATIENT_ID)
      .slice(0, 4)
      .map((note) => `${note.problem}: ${note.assessment} | Plan: ${note.plan}`)
      .join('\n');
  }, []);

  const labDigest = useMemo(() => {
    return labs
      .filter((lab) => lab.patientId === ACTIVE_PATIENT_ID)
      .slice(0, 3)
      .map((lab) => `${lab.testName} ${lab.timestamp}: ${Object.keys(lab.results || {}).map((key) => `${key} ${lab.results?.[key]?.value ?? ''}${lab.results?.[key]?.unit ?? ''}`).join(', ')}`)
      .join('\n');
  }, []);

  const vitalDigest = useMemo(() => {
    return vitals
      .filter((entry) => entry.patientId === ACTIVE_PATIENT_ID && entry.vitalSigns)
      .slice(0, 2)
      .map((entry) => `Temp ${entry.vitalSigns?.temperature}${entry.vitalSigns?.temperatureUnit ?? '°F'}, BP ${entry.vitalSigns?.bloodPressure}, HR ${entry.vitalSigns?.heartRate}, O2 ${entry.vitalSigns?.oxygenSaturation}% (${entry.timestamp})`)
      .join('\n');
  }, []);

  const medDigest = useMemo(() => {
    return meds
      .filter((med) => med.patientId === ACTIVE_PATIENT_ID)
      .slice(0, 4)
      .map((med) => `${med.medicationName} ${med.dosage} ${med.frequency}`)
      .join('\n');
  }, []);

  const [problems, setProblems] = useState<ProblemEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const prompt = buildPrompt(noteDigest, labDigest, vitalDigest, medDigest);
      const response = await askGemini(prompt);
      const parsed = parseResponse(response);
      if (parsed.length === 0) {
        setError('AI returned an empty list. Showing last known state.');
      } else {
        setProblems(parsed);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach AI service.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [noteDigest, labDigest, vitalDigest, medDigest]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Problem Summary</Text>
          <Text style={styles.subtitle}>Assessment & evidence synthesized from latest chart data</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchSummary} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <RefreshCw size={18} color="#fff" />}
          <Text style={styles.refreshText}>{loading ? 'Updating' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.banner}>
          <AlertCircle size={20} color="#b45309" />
          <Text style={styles.bannerText}>{error}</Text>
        </View>
      ) : null}

      {loading && problems.length === 0 ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingLabel}>Asking Gemini for the latest problems…</Text>
        </View>
      ) : null}

      {problems.map((problem) => (
        <View key={problem.name} style={styles.problemCard}>
          <View style={styles.problemHeader}>
            <View style={styles.avatar}>
              <Stethoscope size={18} color="#0f172a" />
            </View>
            <View style={styles.problemMeta}>
              <Text style={styles.problemName}>{problem.name}</Text>
              <Text style={styles.problemPlan}>{problem.plan}</Text>
            </View>
          </View>
          <View style={styles.evidenceBlock}>
            {problem.evidence?.length ? (
              problem.evidence.map((item, idx) => (
                <View key={`${problem.name}-evidence-${idx}`} style={styles.evidenceRow}>
                  <TrendingUp size={14} color="#0369a1" />
                  <Text style={styles.evidenceText}>{item}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noEvidence}>AI did not cite supporting data.</Text>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    color: '#475569',
    marginTop: 4,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  refreshText: {
    color: '#fff',
    fontWeight: '600',
  },
  banner: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  bannerText: {
    color: '#92400e',
    flex: 1,
  },
  loadingCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    marginTop: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  loadingLabel: {
    marginTop: 12,
    color: '#475569',
  },
  problemCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  problemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  problemMeta: {
    flex: 1,
  },
  problemName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  problemPlan: {
    color: '#475569',
    marginTop: 4,
  },
  evidenceBlock: {
    marginTop: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  evidenceText: {
    flex: 1,
    color: '#0f172a',
  },
  noEvidence: {
    color: '#94a3b8',
  },
});

export default DoctorProblemSummaryScreen;
