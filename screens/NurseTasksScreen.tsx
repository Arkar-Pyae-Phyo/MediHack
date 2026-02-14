import { useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { TextStyle } from 'react-native';

import RoleHeader from '../components/RoleHeader';

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
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
