import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { TextStyle } from 'react-native';

import { askGemini } from '../services/gemini';

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

type GeminiTasks = {
  actionableTasks: string;
  escalationNotes: string;
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

const buildNursePrompt = (orders: DoctorOrder[], tasks: NursingTask[], vitals: VitalTrend[]) => {
  const payload = {
    latestOrders: orders,
    currentTasks: tasks,
    vitalTrends: vitals,
  };

  return [
    'You are assisting the charge nurse in triaging today\'s tasks.',
    'Convert the doctor orders into actionable nursing tasks with clear priority. Note any escalations or confirmations needed.',
    'Respond with two sections titled: Actionable tasks, Escalation notes.',
    'Keep items concise, up to 4 bullet points per section.',
    `Input data: ${JSON.stringify(payload)}`,
  ].join('\n');
};

const defaultGeminiTasks: GeminiTasks = {
  actionableTasks: 'No new tasks at this time.',
  escalationNotes: 'No escalations required.',
};

const parseTasksResponse = (text: string): GeminiTasks => {
  if (!text) {
    return defaultGeminiTasks;
  }

  const sections = { ...defaultGeminiTasks };
  const buffers: Record<keyof GeminiTasks, string[]> = {
    actionableTasks: [],
    escalationNotes: [],
  };
  const lines = text.split(/\n+/g).map((line) => line.trim()).filter(Boolean);

  let currentKey: keyof GeminiTasks | null = null;
  const resolveKey = (heading: string): keyof GeminiTasks | null => {
    const normalized = heading.toLowerCase();
    if (normalized.includes('action')) return 'actionableTasks';
    if (normalized.includes('escalation')) return 'escalationNotes';
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
      buffers[currentKey].push(line.replace(/^[-\u2022\u25CF\u25E6\s]+/, '• '));
    }
  }

  (Object.keys(buffers) as Array<keyof GeminiTasks>).forEach((key) => {
    if (buffers[key].length) {
      sections[key] = buffers[key].join('\n');
    }
  });

  return sections;
};

const priorityStyle = (priority: NursingTask['priority']): TextStyle => ({
  color: priority === 'high' ? '#dc2626' : priority === 'medium' ? '#ca8a04' : '#0f172a',
  fontWeight: priority === 'high' ? '600' : '500',
});

const trendStyle = (direction: VitalTrend['direction']): TextStyle => ({
  color: direction === 'up' ? '#dc2626' : direction === 'down' ? '#16a34a' : '#475569',
  fontWeight: '500',
});

const NurseTasksScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geminiTasks, setGeminiTasks] = useState<GeminiTasks>(defaultGeminiTasks);

  const taskCount = useMemo(() => currentTasks.length, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const prompt = buildNursePrompt(latestOrders, currentTasks, vitalTrends);
      const result = await askGemini(prompt);
      setGeminiTasks(parseTasksResponse(result));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach Gemini.';
      setError(message);
      setGeminiTasks(defaultGeminiTasks);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTasks} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Nurse Tasks</Text>
        <Text style={styles.subtitle}>Current tasks: {taskCount}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>AI Task Breakdown</Text>
          {loading ? <ActivityIndicator size="small" color="#10b981" /> : null}
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Section heading="Actionable tasks" body={geminiTasks.actionableTasks} />
        <Section heading="Escalation notes" body={geminiTasks.escalationNotes} />
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
  );
};

type SectionProps = {
  heading: string;
  body: string;
};

const Section = ({ heading, body }: SectionProps) => (
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
    color: '#134e4a',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 16,
    color: '#0f766e',
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
  sectionBlock: {
    marginTop: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f766e',
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
    color: '#0f172a',
    fontWeight: '500',
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 2,
  },
  errorText: {
    color: '#dc2626',
    marginBottom: 8,
    fontSize: 14,
  },
});

export default NurseTasksScreen;
