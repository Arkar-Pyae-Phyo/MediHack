import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import RoleHeader from '../components/RoleHeader';
import { askGemini } from '../services/gemini';
import drugOrders from '../sample_data/drug_clean.json';
import { PharmacistPatient } from './PharmacistPatientSelectScreen';

type PharmacistSections = {
  interactions: string[];
  doseAdjustments: string[];
  alerts: string[];
};

const pharmacistPrompt = (orders: MedicationOrder[]) => {
  const payload = JSON.stringify(
    orders.map(({ medicationName, dosage, route, frequency, indication, status, startDate }) => ({
      medicationName,
      dosage,
      route,
      frequency,
      indication,
      status,
      startDate,
    }))
  );
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

type MedicationOrder = {
  patientId: string;
  timestamp: string;
  orderId: string;
  medicationName: string;
  dosage: string;
  route: string;
  frequency: string;
  duration: string;
  quantity: number;
  prescribedBy: string;
  indication: string;
  instructions: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
};

type DuplicateSummary = {
  nameConflicts: string[];
  classConflicts: string[];
};

const medicationOrders = drugOrders as MedicationOrder[];
const NEW_CHANGE_WINDOW_HOURS = 72;

const medicationClassMap: Record<string, string> = {
  azithromycin: 'Macrolide antibiotic',
  guaifenesin: 'Expectorant',
  metoprolol: 'Beta blocker',
  apixaban: 'Factor Xa inhibitor',
  lisinopril: 'ACE inhibitor',
  ondansetron: 'Antiemetic',
  vancomycin: 'Glycopeptide antibiotic',
  atorvastatin: 'Statin',
  ibuprofen: 'NSAID',
  metformin: 'Biguanide',
  empagliflozin: 'SGLT2 inhibitor',
  spironolactone: 'Aldosterone antagonist',
  furosemide: 'Loop diuretic',
};

const isActiveStatus = (status?: string | null) => !!status && status.toLowerCase().includes('active');

const normalizeMedicationName = (name: string) => name.toLowerCase().replace(/[^a-z]/g, '');

const getMedicationClass = (name: string) => medicationClassMap[normalizeMedicationName(name)];

const formatDateLabel = (value?: string | null) => {
  if (!value) return 'Date N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

type PharmacistReviewScreenProps = {
  onLogout: () => void;
  patient: PharmacistPatient;
};

const PharmacistReviewScreen = ({ onLogout, patient }: PharmacistReviewScreenProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<PharmacistSections>(defaultSections);

  const patientOrders = useMemo(
    () => medicationOrders.filter((order) => order.patientId === patient.id),
    [patient.id]
  );

  const activeOrders = useMemo(
    () => patientOrders.filter((order) => isActiveStatus(order.status)),
    [patientOrders]
  );

  const medsCount = activeOrders.length;

  const latestOrderTimestamp = useMemo(
    () =>
      patientOrders.reduce((max, order) => {
        const time = new Date(order.timestamp).getTime();
        return Number.isNaN(time) ? max : Math.max(max, time);
      }, 0),
    [patientOrders]
  );

  const reconciliation = useMemo(() => {
    if (!activeOrders.length) {
      return { stable: [] as MedicationOrder[], newOrChanged: [] as MedicationOrder[] };
    }

    const referenceTime = latestOrderTimestamp || Date.now();
    const windowMs = NEW_CHANGE_WINDOW_HOURS * 60 * 60 * 1000;
    const changeRegex = /(increase|decrease|adjust|titrate|start|initiat|change|switch|new)/i;

    const newOrChanged = activeOrders.filter((order) => {
      const orderTime = new Date(order.timestamp).getTime();
      const isRecent = referenceTime - orderTime <= windowMs;
      const hasChangeCue = changeRegex.test(`${order.status} ${order.instructions}`);
      return isRecent || hasChangeCue;
    });

    const newIds = new Set(newOrChanged.map((order) => order.orderId));
    const stable = activeOrders.filter((order) => !newIds.has(order.orderId));

    return { stable, newOrChanged };
  }, [activeOrders, latestOrderTimestamp]);

  const duplicateSummary = useMemo<DuplicateSummary>(() => {
    if (!activeOrders.length) {
      return { nameConflicts: [], classConflicts: [] };
    }

    const nameMap = new Map<string, MedicationOrder[]>();
    const classMap = new Map<string, MedicationOrder[]>();

    activeOrders.forEach((order) => {
      const normalized = normalizeMedicationName(order.medicationName);
      if (!nameMap.has(normalized)) {
        nameMap.set(normalized, []);
      }
      nameMap.get(normalized)!.push(order);

      const medClass = getMedicationClass(order.medicationName);
      if (medClass) {
        if (!classMap.has(medClass)) {
          classMap.set(medClass, []);
        }
        classMap.get(medClass)!.push(order);
      }
    });

    const nameConflicts: string[] = [];
    nameMap.forEach((orders) => {
      if (orders.length > 1) {
        const details = orders
          .map((order) => `${order.dosage} ${order.frequency}`.trim())
          .join(' | ');
        nameConflicts.push(`Duplicate therapy for ${orders[0].medicationName}: ${details}`);
      }
    });

    const classConflicts: string[] = [];
    classMap.forEach((orders, medClass) => {
      const uniqueNames = Array.from(new Set(orders.map((order) => order.medicationName)));
      if (uniqueNames.length > 1) {
        classConflicts.push(`Multiple agents in ${medClass}: ${uniqueNames.join(', ')}`);
      }
    });

    return { nameConflicts, classConflicts };
  }, [activeOrders]);

  const totalDuplicateFlags = duplicateSummary.nameConflicts.length + duplicateSummary.classConflicts.length;
  const hasMedications = activeOrders.length > 0;

  const fetchReview = useCallback(async () => {
    if (!activeOrders.length) {
      setSections({
        interactions: ['No active medications available in sample data.'],
        doseAdjustments: [],
        alerts: [],
      });
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const prompt = pharmacistPrompt(activeOrders);
      const response = await askGemini(prompt);
      setSections(parsePharmacistResponse(response));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach Gemini.';
      setError(message);
      setSections(defaultSections);
    } finally {
      setLoading(false);
    }
  }, [activeOrders]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  return (
    <SafeAreaView style={styles.safeArea}>
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

        <View style={styles.patientCard}>
          <View style={styles.patientHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientMeta}>
                {patient.age} yrs • Room {patient.room} • ID {patient.id}
              </Text>
            </View>
            <View style={styles.patientBadge}>
              <Text style={styles.patientBadgeText}>{patient.priority.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.patientDetails}>
            <Text style={styles.patientDetailText}>{patient.condition}</Text>
            <Text style={styles.patientDetailText}>{patient.renalFunction}</Text>
            <Text style={styles.patientDetailText}>Allergies: {patient.allergies.join(', ')}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Medication Reconciliation</Text>
            <Text style={styles.cardMeta}>Sample data • last {NEW_CHANGE_WINDOW_HOURS}h</Text>
          </View>
          {hasMedications ? (
            <View style={styles.reconciliationGrid}>
              <View style={[styles.reconciliationColumn, styles.reconciliationColumnDivider]}>
                <Text style={styles.reconciliationHeading}>Active regimen</Text>
                {reconciliation.stable.length ? (
                  reconciliation.stable.map((order) => (
                    <View key={`stable-${order.orderId}`} style={styles.reconciliationItem}>
                      <Text style={styles.reconciliationName}>{order.medicationName}</Text>
                      <Text style={styles.reconciliationDetail}>
                        {order.dosage} {order.route} • {order.frequency}
                      </Text>
                      <Text style={styles.reconciliationMeta}>
                        Start {formatDateLabel(order.startDate)} • {order.status}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.sectionPlaceholder}>No stable medications captured.</Text>
                )}
              </View>
              <View style={styles.reconciliationColumn}>
                <Text style={styles.reconciliationHeading}>New / changed</Text>
                {reconciliation.newOrChanged.length ? (
                  reconciliation.newOrChanged.map((order) => (
                    <View key={`change-${order.orderId}`} style={styles.reconciliationItem}>
                      <View style={styles.reconciliationRowHeader}>
                        <Text style={styles.reconciliationName}>{order.medicationName}</Text>
                        <Text style={[styles.statusBadge, styles.statusBadgeAlert]}>New</Text>
                      </View>
                      <Text style={styles.reconciliationDetail}>
                        {order.dosage} {order.route} • {order.frequency}
                      </Text>
                      <Text style={styles.reconciliationMeta}>
                        {order.status} • {formatDateLabel(order.startDate)}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.sectionPlaceholder}>
                    No changes detected in the last {NEW_CHANGE_WINDOW_HOURS}h.
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <Text style={styles.sectionPlaceholder}>No medication data found for this patient.</Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Duplicate Therapy Detection</Text>
            <Text
              style={[
                styles.statusBadge,
                totalDuplicateFlags ? styles.statusBadgeAlert : styles.statusBadgeClear,
              ]}
            >
              {totalDuplicateFlags ? `${totalDuplicateFlags} flags` : 'All clear'}
            </Text>
          </View>
          <Section
            heading="Same / Similar Agents"
            items={duplicateSummary.nameConflicts}
            highlight={duplicateSummary.nameConflicts.length > 0}
          />
          <Section
            heading="Same Pharmacologic Class"
            items={duplicateSummary.classConflicts}
            highlight={duplicateSummary.classConflicts.length > 0}
          />
          {!totalDuplicateFlags ? (
            <Text style={styles.noAlertText}>No duplicate therapy identified in sample data.</Text>
          ) : null}
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
          {hasMedications ? (
            activeOrders.map((order) => (
              <View key={order.orderId} style={styles.listItem}>
                <Text style={styles.listItemTitle}>{order.medicationName}</Text>
                <Text style={styles.listItemSubtitle}>
                  {order.dosage} {order.route} • {order.frequency}
                </Text>
                <Text style={styles.listItemMeta}>
                  Indication: {order.indication} • Status: {order.status} • Start {formatDateLabel(order.startDate)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.sectionPlaceholder}>
              No active medications in sample data for this patient.
            </Text>
          )}
        </View>
      </ScrollView>
      <RoleHeader role="Pharmacist" onLogout={onLogout} />
      </View>
    </SafeAreaView>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  patientName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  patientMeta: {
    marginTop: 4,
    fontSize: 14,
    color: '#475569',
  },
  patientBadge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#ede9fe',
  },
  patientBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6d28d9',
  },
  patientDetails: {
    marginTop: 12,
    gap: 4,
  },
  patientDetailText: {
    fontSize: 14,
    color: '#475569',
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
  reconciliationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reconciliationColumn: {
    flex: 1,
    minWidth: 150,
    marginBottom: 12,
  },
  reconciliationColumnDivider: {
    paddingRight: 12,
  },
  reconciliationHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  reconciliationItem: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  reconciliationRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reconciliationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  reconciliationDetail: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  reconciliationMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeAlert: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  },
  statusBadgeClear: {
    backgroundColor: '#dcfce7',
    color: '#166534',
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
  cardMeta: {
    fontSize: 12,
    color: '#6b7280',
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
