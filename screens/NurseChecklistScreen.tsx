import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import RoleHeader from '../components/RoleHeader';
import { askGemini } from '../services/gemini';

type Patient = {
  id: string;
  name: string;
  age: number;
  room: string;
  condition: string;
  priority: 'high' | 'medium' | 'low';
};

type ChecklistItem = {
  id: string;
  task: string;
  timeframe: string;
  completed: boolean;
};

type DoctorOrder = {
  id: string;
  note: string;
  createdAt: string;
};

const latestOrders: DoctorOrder[] = [
  {
    id: 'order-1',
    note: 'Monitor blood glucose before dinner and bedtime for next 48 hours. Notify provider if >180 mg/dL twice.',
    createdAt: '2026-02-13T09:20:00Z',
  },
  {
    id: 'order-2',
    note: 'Educate patient on hydration plan (2L per day) and document adherence check-in tonight.',
    createdAt: '2026-02-13T09:22:00Z',
  },
  {
    id: 'order-3',
    note: 'Schedule renal panel draw Monday morning; confirm lab availability.',
    createdAt: '2026-02-13T09:24:00Z',
  },
];

const buildChecklistPrompt = (orders: DoctorOrder[]) => {
  return [
    'You are extracting time-sensitive nursing tasks from doctor orders.',
    'Extract specific time-bound tasks that need to be checked or performed at specific times.',
    'Format each task as: TASK | TIMEFRAME',
    'Examples:',
    '- Monitor blood glucose | Before dinner',
    '- Recheck blood pressure | In 1 hour',
    '- Follow up lab results | At 3pm',
    '- Document patient education | By end of shift',
    'Only return the checklist items in the format above, one per line.',
    `Doctor Orders: ${JSON.stringify(orders)}`,
  ].join('\n');
};

const parseChecklist = (text: string): ChecklistItem[] => {
  if (!text) return [];

  const lines = text.split(/\n+/g).map((line) => line.trim()).filter(Boolean);

  return lines
    .map((line, index) => {
      const cleanLine = line.replace(/^[-\u2022\u25CF\u25E6\s]+/, '');
      const parts = cleanLine.split('|').map(s => s.trim());
      if (parts.length >= 2) {
        return {
          id: `checklist-${Date.now()}-${index}`,
          task: parts[0],
          timeframe: parts[1],
          completed: false,
        };
      }
      return null;
    })
    .filter((item): item is ChecklistItem => item !== null);
};

const NurseChecklistScreen = ({ onLogout, patient }: { onLogout: () => void; patient: Patient }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  const toggleChecklistItem = useCallback((id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  }, []);

  const fetchChecklist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const prompt = buildChecklistPrompt(latestOrders);
      const result = await askGemini(prompt);
      const items = parseChecklist(result);
      setChecklist(items);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach Gemini.';
      setError(message);
      setChecklist([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  const completedCount = checklist.filter(item => item.completed).length;
  const totalCount = checklist.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchChecklist} />}
        >
          <View style={styles.header}>
            <Text style={styles.title}>🤖 AI Checklist</Text>
            <Text style={styles.subtitle}>
              {totalCount > 0 ? `${completedCount} of ${totalCount} completed` : 'Auto-generated from orders'}
            </Text>
          </View>

          {/* Patient Information */}
          <View style={styles.patientCard}>
            <View style={styles.patientHeader}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <View style={[
                styles.priorityBadge,
                patient.priority === 'high' ? styles.priorityHigh :
                patient.priority === 'medium' ? styles.priorityMedium :
                styles.priorityLow
              ]}>
                <Text style={styles.priorityText}>{patient.priority.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.patientDetails}>
              <Text style={styles.patientDetail}>🏥 Room {patient.room}</Text>
              <Text style={styles.patientDetail}>👤 {patient.age} years old</Text>
              <Text style={styles.patientDetail}>🩺 {patient.condition}</Text>
            </View>
          </View>

          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchChecklist}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {checklist.length > 0 ? (
            <View style={styles.checklistContainer}>
              {checklist.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.checklistItem}
                  onPress={() => toggleChecklistItem(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.checkbox}>
                    {item.completed && <View style={styles.checkboxChecked} />}
                  </View>
                  <View style={styles.checklistContent}>
                    <Text
                      style={[
                        styles.checklistTask,
                        item.completed && styles.checklistTaskCompleted,
                      ]}
                    >
                      {item.task}
                    </Text>
                    <Text style={styles.checklistTimeframe}>⏰ {item.timeframe}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={styles.loadingText}>Generating checklist from orders...</Text>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No time-sensitive tasks found</Text>
              <Text style={styles.emptySubtext}>Pull down to refresh and regenerate</Text>
            </View>
          )}

          <View style={styles.ordersCard}>
            <Text style={styles.cardTitle}>Doctor Orders</Text>
            {latestOrders.map((order) => (
              <View key={order.id} style={styles.orderItem}>
                <Text style={styles.orderNote}>{order.note}</Text>
                <Text style={styles.orderDate}>
                  {new Date(order.createdAt).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <RoleHeader role="Nurse" onLogout={onLogout} />
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#134e4a',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 16,
    color: '#0f766e',
    fontWeight: '500',
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityHigh: {
    backgroundColor: '#fee2e2',
  },
  priorityMedium: {
    backgroundColor: '#fef3c7',
  },
  priorityLow: {
    backgroundColor: '#dbeafe',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  patientDetails: {
    flexDirection: 'column',
    gap: 6,
  },
  patientDetail: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  checklistContainer: {
    marginBottom: 24,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#10b981',
    marginRight: 14,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  checklistContent: {
    flex: 1,
  },
  checklistTask: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 22,
  },
  checklistTaskCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  checklistTimeframe: {
    fontSize: 14,
    color: '#059669',
    marginTop: 6,
    fontWeight: '600',
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#64748b',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
  ordersCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  orderItem: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  orderNote: {
    fontSize: 15,
    color: '#0f172a',
    lineHeight: 20,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 13,
    color: '#64748b',
  },
});

export default NurseChecklistScreen;
