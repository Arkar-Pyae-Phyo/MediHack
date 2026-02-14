import { useCallback, useEffect, useMemo, useState } from 'react';
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
import type { TextStyle } from 'react-native';

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

type NursingTask = {
  id: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  due: string;
};

type DoctorOrder = {
  id: string;
  note: string;
  createdAt: string;
};

type VitalTrend = {
  metric: string;
  change: string;
  direction: 'up' | 'down' | 'flat';
  timestamp: string;
};

type ChecklistItem = {
  id: string;
  task: string;
  timeframe: string;
  completed: boolean;
};

const currentTasks: NursingTask[] = [
  { id: 'task-1', description: 'Check insulin administration adherence during evening round.', priority: 'high', due: 'Today 18:00' },
  { id: 'task-2', description: 'Assess dizziness and document orthostatic vitals.', priority: 'medium', due: 'Today 20:00' },
  { id: 'task-3', description: 'Coordinate nephrology consult note upload.', priority: 'low', due: 'Tomorrow 10:00' },
];

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

const vitalTrends: VitalTrend[] = [
  { metric: 'Blood Pressure', change: '134/84 → 142/88', direction: 'up', timestamp: 'Last 24h' },
  { metric: 'Heart Rate', change: '72 bpm → 78 bpm', direction: 'up', timestamp: 'Last 24h' },
  { metric: 'Weight', change: '178 lbs → 177 lbs', direction: 'down', timestamp: 'Last 7d' },
];

const buildChecklistPrompt = (orders: DoctorOrder[]) => {
  return [
    'You are extracting time-sensitive nursing tasks from doctor orders.',
    'Extract specific actionable tasks with a timeframe in the format TASK | TIMEFRAME.',
    'Keep each line concise and grounded only in the provided orders.',
    `Doctor Orders: ${JSON.stringify(orders)}`,
  ].join('\n');
};

const parseChecklist = (text: string): ChecklistItem[] => {
  if (!text) return [];

  const lines = text.split(/\n+/g).map((line) => line.trim()).filter(Boolean);
  return lines
    .map((line, index) => {
      const cleanLine = line.replace(/^[\-\u2022\u25CF\u25E6\s]+/, '');
      const parts = cleanLine.split('|').map((part) => part.trim());
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

const priorityStyle = (priority: NursingTask['priority']): TextStyle => ({
  color: priority === 'high' ? '#dc2626' : priority === 'medium' ? '#ca8a04' : '#0f172a',
  fontWeight: priority === 'high' ? '600' : '500',
});

const trendStyle = (direction: VitalTrend['direction']): TextStyle => ({
  color: direction === 'up' ? '#dc2626' : direction === 'down' ? '#16a34a' : '#475569',
  fontWeight: '500',
});

const NurseTasksScreen = ({ onLogout, patient }: { onLogout: () => void; patient: Patient }) => {
  const taskCount = useMemo(() => currentTasks.length, []);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklistError, setChecklistError] = useState<string | null>(null);

  const toggleChecklistItem = useCallback((id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  }, []);

  const fetchChecklist = useCallback(async () => {
    setChecklistLoading(true);
    setChecklistError(null);
    try {
      const prompt = buildChecklistPrompt(latestOrders);
      const response = await askGemini(prompt);
      const items = parseChecklist(response);
      setChecklist(items);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach Gemini.';
      setChecklistError(message);
      setChecklist([]);
    } finally {
      setChecklistLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  const completedCount = checklist.filter((item) => item.completed).length;
  const totalCount = checklist.length;
  const checklistSubtitle = totalCount
    ? `${completedCount} of ${totalCount} completed`
    : 'Auto-generated from doctor orders';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={checklistLoading} onRefresh={fetchChecklist} tintColor="#10b981" />
          }
        >
        <View style={styles.header}>
          <Text style={styles.title}>Tasks</Text>
          <Text style={styles.subtitle}>Current tasks: {taskCount}</Text>
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

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>🤖 AI Checklist</Text>
            <Text style={styles.cardSubtitle}>{checklistSubtitle}</Text>
          </View>
          <TouchableOpacity
            style={[styles.refreshChip, checklistLoading && styles.refreshChipDisabled]}
            onPress={fetchChecklist}
            disabled={checklistLoading}
          >
            <Text style={styles.refreshChipText}>{checklistLoading ? 'Loading...' : 'Refresh'}</Text>
          </TouchableOpacity>
        </View>

        {checklistError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{checklistError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchChecklist}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {checklistLoading && totalCount === 0 && !checklistError ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>Generating checklist...</Text>
          </View>
        ) : null}

        {!checklistLoading && !checklistError && totalCount === 0 ? (
          <View style={styles.emptyChecklist}>
            <Text style={styles.emptyChecklistIcon}>📋</Text>
            <Text style={styles.emptyChecklistText}>No time-sensitive tasks found</Text>
            <Text style={styles.emptyChecklistSubtext}>Pull down or refresh to regenerate</Text>
          </View>
        ) : null}

        {totalCount > 0 ? (
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
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Doctor Orders</Text>
        {latestOrders.map((order) => (
          <View key={order.id} style={styles.listItem}>
            <Text style={styles.listItemTitle}>{order.note}</Text>
            <Text style={styles.listItemSubtitle}>Ordered: {new Date(order.createdAt).toLocaleString()}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current Tasks</Text>
        {currentTasks.map((task) => (
          <View key={task.id} style={styles.listItem}>
            <Text style={styles.listItemTitle}>{task.description}</Text>
            <Text style={[styles.listItemSubtitle, priorityStyle(task.priority)]}>
              Priority: {task.priority.toUpperCase()} • Due {task.due}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Vital Trends</Text>
        {vitalTrends.map((trend) => (
          <View key={`${trend.metric}-${trend.timestamp}`} style={styles.listItem}>
            <Text style={styles.listItemTitle}>{trend.metric}</Text>
            <Text style={[styles.listItemSubtitle, trendStyle(trend.direction)]}>
              {trend.change} • {trend.timestamp}
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
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#134e4a',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 16,
    color: '#0f766e',
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
    color: '#0f172a',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  refreshChip: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  refreshChipDisabled: {
    opacity: 0.6,
  },
  refreshChipText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 12,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    marginBottom: 8,
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#475569',
  },
  emptyChecklist: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyChecklistIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyChecklistText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  emptyChecklistSubtext: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  checklistContainer: {
    marginTop: 12,
    gap: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#10b981',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  checklistContent: {
    flex: 1,
  },
  checklistTask: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  checklistTaskCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  checklistTimeframe: {
    fontSize: 13,
    color: '#047857',
    marginTop: 6,
    fontWeight: '600',
  },
  listItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  listItemTitle: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 2,
  },
});

export default NurseTasksScreen;
