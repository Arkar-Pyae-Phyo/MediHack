import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import RoleHeader from '../components/RoleHeader';
import { askGemini } from '../services/gemini';

type MedicationProfile = {
  id: string;
  name: string;
  dose: string;
  route: string;
  frequency: string;
  indication: string;
  startDate: string;
};

type PharmacistSections = {
  interactions: string[];
  doseAdjustments: string[];
  alerts: string[];
};

const activeMedications: MedicationProfile[] = [
  {
    id: 'med-1',
    name: 'Metformin',
    dose: '1000 mg',
    route: 'oral',
    frequency: 'twice daily with meals',
    indication: 'Type 2 Diabetes',
    startDate: '2019-05-12',
  },
  {
    id: 'med-2',
    name: 'Empagliflozin',
    dose: '10 mg',
    route: 'oral',
    frequency: 'once daily',
    indication: 'Type 2 Diabetes (SGLT2 inhibitor)',
    startDate: '2025-09-03',
  },
  {
    id: 'med-3',
    name: 'Lisinopril',
    dose: '20 mg',
    route: 'oral',
    frequency: 'once daily',
    indication: 'Hypertension / renal protection',
    startDate: '2018-09-01',
  },
  {
    id: 'med-4',
    name: 'Atorvastatin',
    dose: '40 mg',
    route: 'oral',
    frequency: 'once nightly',
    indication: 'Hyperlipidemia',
    startDate: '2020-02-17',
  },
  {
    id: 'med-5',
    name: 'Ibuprofen',
    dose: '400 mg',
    route: 'oral',
    frequency: 'as needed up to three times daily',
    indication: 'Chronic knee pain',
    startDate: 'PRN',
  },
];

const pharmacistPrompt = (medications: MedicationProfile[]) => {
  const payload = JSON.stringify(medications);
  return [
    'You are assisting the clinical pharmacist on rounds.',
    'Review the active medication list, point out key pharmacodynamic or pharmacokinetic interactions, and recommend dose adjustments.',
    'Highlight any urgent alerts (e.g., renal dosing concerns, duplicate therapy) that require immediate follow-up.',
    'Respond using the following sections with bullet points: Drug interactions, Dose adjustments, Alerts.',
    'Keep each list to a maximum of 4 concise bullet points grounded only in the provided data.',
    `Medication list: ${payload}`,
  ].join('\n');
};

const defaultSections: PharmacistSections = {
  interactions: ['No significant interactions detected.'],
  doseAdjustments: ['No dose adjustments recommended.'],
  alerts: [],
};

const normalizeBullet = (line: string) => line.replace(/^[-\u2022\u25CF\u25E6\s]+/, '• ').trim();

const parsePharmacistResponse = (text: string): PharmacistSections => {
  if (!text) {
    return defaultSections;
  }

  const sections: PharmacistSections = {
    interactions: [],
    doseAdjustments: [],
    alerts: [],
  };

  const lines = text.split(/\n+/g).map((line) => line.trim()).filter(Boolean);
  let currentKey: keyof PharmacistSections | null = null;

  const resolveKey = (heading: string): keyof PharmacistSections | null => {
    const normalized = heading.toLowerCase();
    if (normalized.includes('interaction')) return 'interactions';
    if (normalized.includes('dose')) return 'doseAdjustments';
    if (normalized.includes('alert') || normalized.includes('warning')) return 'alerts';
    return null;
  };

  for (const line of lines) {
    const headingMatch = /^([A-Za-z\s]+):?$/.exec(line);
    if (headingMatch) {
      const key = resolveKey(headingMatch[1]);
      if (key) {
        currentKey = key;
        continue;
      }
    }

    if (currentKey) {
      sections[currentKey].push(normalizeBullet(line));
    }
  }

  return {
    interactions: sections.interactions.length ? sections.interactions : defaultSections.interactions,
    doseAdjustments: sections.doseAdjustments.length ? sections.doseAdjustments : defaultSections.doseAdjustments,
    alerts: sections.alerts,
  };
};

const PharmacistReviewScreen = ({ onLogout }: { onLogout: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<PharmacistSections>(defaultSections);

  const medsCount = useMemo(() => activeMedications.length, []);

  const fetchReview = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const prompt = pharmacistPrompt(activeMedications);
      const response = await askGemini(prompt);
      setSections(parsePharmacistResponse(response));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach Gemini.';
      setError(message);
      setSections(defaultSections);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchReview} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Medication Review</Text>
          <Text style={styles.subtitle}>Active medications: {medsCount}</Text>
        </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>AI Safety Check</Text>
          {loading ? <ActivityIndicator size="small" color="#d97706" /> : null}
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Section heading="Drug interactions" items={sections.interactions} />
        <Section heading="Dose adjustments" items={sections.doseAdjustments} />
        <Section heading="Alerts" items={sections.alerts} highlight />
        {!sections.alerts.length ? (
          <Text style={styles.noAlertText}>No alerts flagged by AI.</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Medication List</Text>
        {activeMedications.map((med) => (
          <View key={med.id} style={styles.listItem}>
            <Text style={styles.listItemTitle}>{med.name}</Text>
            <Text style={styles.listItemSubtitle}>
              {med.dose} {med.route} • {med.frequency}
            </Text>
            <Text style={styles.listItemMeta}>
              Indication: {med.indication} • Started: {med.startDate}
            </Text>
          </View>
        ))}
      </View>
      </ScrollView>
      <RoleHeader role="Pharmacist" onLogout={onLogout} />
    </View>
  );
};

type SectionProps = {
  heading: string;
  items: string[];
  highlight?: boolean;
};

const Section = ({ heading, items, highlight = false }: SectionProps) => {
  const isEmpty = !items.length;
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionHeading}>{heading}</Text>
      {isEmpty ? <Text style={styles.sectionPlaceholder}>No items provided.</Text> : null}
      {items.map((item, index) => (
        <Text
          key={`${heading}-${index}`}
          style={[styles.sectionItem, highlight ? styles.alertText : undefined]}
        >
          {item}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
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
    color: '#1f2937',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 16,
    color: '#92400e',
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
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionBlock: {
    marginTop: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#b45309',
    marginBottom: 6,
  },
  sectionPlaceholder: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  sectionItem: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1f2937',
    marginBottom: 4,
  },
  alertText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  noAlertText: {
    marginTop: 8,
    fontSize: 14,
    color: '#16a34a',
  },
  listItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  listItemTitle: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 2,
  },
  listItemMeta: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 8,
  },
});

export default PharmacistReviewScreen;
