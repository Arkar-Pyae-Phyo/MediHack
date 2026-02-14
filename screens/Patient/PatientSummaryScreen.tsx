import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { 
  Sparkles, 
  CheckCircle2, 
  Circle,
  Clock,
  Phone,
  Activity,
  Heart,
  User,
  Users,
  LogOut,
  Send,
  Bell,
  Calendar,
  TrendingUp,
  Pill,
  ChevronRight,
  MessageCircle,
  AlertCircle
} from 'lucide-react-native';

import { askGemini } from '../../services/gemini';

import doctorNotes from '../../sample_data/doc_clean.json';
import medications from '../../sample_data/drug_clean.json';
import nurseEntries from '../../sample_data/nurse_clean.json';
import labResults from '../../sample_data/lab_clean.json';

// --- Mock Data ---
const patientData = {
  name: 'Avery Thompson',
  hn: 'HN-482991',
  doctor: 'Dr. Patel',
  avatar: 'https://i.pravatar.cc/150?img=9',
  
  // Timeline การรักษา
  journey: [
    { label: 'Admitted', status: 'completed', date: 'Feb 10' },
    { label: 'Surgery', status: 'completed', date: 'Feb 11' },
    { label: 'Recovery', status: 'current', date: 'Feb 12-16' },
    { label: 'Discharge', status: 'pending', date: 'Feb 17' },
  ],

  // ยา/นัดหมาย
  upcoming: [
    { type: 'med', label: 'Metformin', detail: '1000mg with Lunch', time: '12:00 PM', taken: false },
    { type: 'med', label: 'Lisinopril', detail: '20mg Bedtime', time: '09:00 PM', taken: false },
    { type: 'appointment', label: 'Dr. Patel Check-up', detail: 'Room 302', time: '02:00 PM', taken: false },
  ],

  // ค่าชีพจรล่าสุด (Snapshot)
  vitals: {
    bp: '128/82',
    hr: '72 bpm',
    temp: '36.8°C',
    spo2: '98%'
  },

  // Quick stats
  stats: {
    medsTaken: 6,
    medsTotal: 8,
    daysInRecovery: 3,
    nextAppointment: '2 hrs'
  }
};

type DoctorNote = (typeof doctorNotes)[number];
type MedicationOrder = (typeof medications)[number];
type NurseEntry = (typeof nurseEntries)[number];
type LabResult = (typeof labResults)[number];

type CaregiverTask = {
  task: string;
  reason?: string;
};

const ACTIVE_PATIENT_ID = 'an1';

const DEFAULT_CARE_TASKS: CaregiverTask[] = [
  {
    task: 'Remind patient to do breathing exercises twice per shift',
    reason: 'Keeps lungs expanded and helps clear mucus to prevent pneumonia flare-ups.',
  },
  {
    task: 'Bring the home medication list for reconciliation',
    reason: 'Ensures the care team confirms which medicines continue after discharge.',
  },
  {
    task: 'Ask the team to review discharge criteria with the family',
    reason: 'Helps everyone prepare transportation, supplies, and follow-up visits in advance.',
  },
];

const formatShortDate = (input: string | undefined) => {
  if (!input) return '';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const extractJsonBlock = (text: string): string | null => {
  if (!text) return null;
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) return objectMatch[0];
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  return arrayMatch ? arrayMatch[0] : null;
};

const parseCaregiverTasks = (payload: string): CaregiverTask[] => {
  const jsonBlock = extractJsonBlock(payload.trim());
  if (!jsonBlock) return [];

  try {
    const parsed = JSON.parse(jsonBlock);
    const taskArray = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.tasks)
        ? parsed.tasks
        : [];

    return taskArray
      .map((entry: unknown) => {
        if (typeof entry === 'string') {
          return { task: entry };
        }
        if (entry && typeof entry === 'object' && 'task' in entry) {
          const taskText = typeof (entry as { task: unknown }).task === 'string' ? (entry as { task: string }).task : '';
          const reasonText =
            entry && typeof (entry as { reason?: unknown }).reason === 'string'
              ? (entry as { reason: string }).reason
              : undefined;
          return taskText ? { task: taskText, reason: reasonText } : null;
        }
        return null;
      })
      .filter((entry): entry is CaregiverTask => Boolean(entry && entry.task?.trim()))
      .map((entry) => ({
        task: entry.task.trim(),
        reason: entry.reason?.trim(),
      }));
  } catch (error) {
    console.warn('Unable to parse caregiver checklist', error);
    return [];
  }
};

const buildPrompt = (mode: 'patient' | 'family') => `
  Context: Patient Avery is in recovery stage. Vitals are stable.
  Mode: ${mode === 'patient' ? 'Talking to Patient' : 'Talking to Family'}.
  Write a SHORT, encouraging dashboard summary (max 25 words).
  Tone: Professional but warm.
`;

const PatientSummaryScreen = ({ onLogout }: { onLogout: () => void }) => {
  const [mode, setMode] = useState<'patient' | 'family'>('patient');
  const [loading, setLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const [careChecklist, setCareChecklist] = useState<CaregiverTask[]>(DEFAULT_CARE_TASKS);
  const [careLoading, setCareLoading] = useState(false);
  const [careError, setCareError] = useState<string | null>(null);

  const patientDoctorNotes = useMemo<DoctorNote[]>(() => {
    return doctorNotes
      .filter((note) => note.patientId === ACTIVE_PATIENT_ID)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, []);

  const patientMedications = useMemo<MedicationOrder[]>(() => {
    return medications
      .filter((order) => order.patientId === ACTIVE_PATIENT_ID)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, []);

  const patientNurseEntries = useMemo<NurseEntry[]>(() => {
    return nurseEntries
      .filter((entry) => entry.patientId === ACTIVE_PATIENT_ID)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, []);

  const patientLabs = useMemo<LabResult[]>(() => {
    return labResults
      .filter((lab) => lab.patientId === ACTIVE_PATIENT_ID)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, []);

  const planDigest = useMemo(() => {
    if (!patientDoctorNotes.length) return '';
    return patientDoctorNotes
      .slice(0, 3)
      .map((note) => `• ${formatShortDate(note.timestamp)} plan: ${note.plan}`)
      .join('\n');
  }, [patientDoctorNotes]);

  const medicationDigest = useMemo(() => {
    if (!patientMedications.length) return '';
    return patientMedications
      .slice(0, 4)
      .map(
        (med) =>
          `${med.medicationName} ${med.dosage} ${med.frequency} (${med.instructions || 'standard instructions'})`,
      )
      .join('; ');
  }, [patientMedications]);

  const nurseDigest = useMemo(() => {
    if (!patientNurseEntries.length) return '';
    return patientNurseEntries
      .slice(0, 2)
      .map((entry) => `${formatShortDate(entry.timestamp)}: ${entry.notes || entry.taskType}`)
      .join(' | ');
  }, [patientNurseEntries]);

  const latestVitalsSnapshot = useMemo(() => {
    const vitalsEntry = patientNurseEntries.find((entry) => entry.vitalSigns);
    if (vitalsEntry?.vitalSigns) {
      const vitals = vitalsEntry.vitalSigns;
      return `Temp ${vitals.temperature}${vitals.temperatureUnit ?? '°F'}, BP ${vitals.bloodPressure}, O2 ${vitals.oxygenSaturation}%, HR ${vitals.heartRate}`;
    }
    return `Temp ${patientData.vitals.temp}, BP ${patientData.vitals.bp}, O2 ${patientData.vitals.spo2}`;
  }, [patientNurseEntries]);

  const labDigest = useMemo(() => {
    if (!patientLabs.length) return '';
    return patientLabs
      .slice(0, 2)
      .map((lab) => {
        const abnormal = lab.results
          ? Object.entries(lab.results)
              .filter(([, result]) => result.flag && result.flag !== 'Normal')
              .map(([name, result]) => `${name} ${result.value}${result.unit ? ` ${result.unit}` : ''} (${result.flag})`)
          : [];
        const summary = abnormal.length ? abnormal.join(', ') : 'All values within range';
        return `${lab.testName} on ${formatShortDate(lab.timestamp)}: ${summary}`;
      })
      .join('\n');
  }, [patientLabs]);

  const primaryDiagnosis = patientDoctorNotes[0]?.diagnosis || 'post-acute recovery';

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await askGemini(buildPrompt(mode));
      setAiMessage(res);
    } catch (e) {
      setAiMessage("Recovery is progressing well according to the plan.");
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setAsking(true);
    try {
      const res = await askGemini(`Answer simply for a patient: ${question}`);
      setAnswer(res);
    } finally {
      setAsking(false);
    }
  };

  const fetchCaregiverChecklist = useCallback(async () => {
    if (mode !== 'family') return;

    setCareLoading(true);
    setCareError(null);

    try {
      if (!patientDoctorNotes.length) {
        setCareChecklist(DEFAULT_CARE_TASKS);
        setCareError('Waiting for the care team to document a plan. Showing starter tasks.');
        return;
      }

      const contextSections = [
        `Patient: ${patientData.name} recovering from ${primaryDiagnosis}.`,
        planDigest ? `Doctor plans:\n${planDigest}` : '',
        medicationDigest ? `Medications:\n${medicationDigest}` : '',
        nurseDigest ? `Nursing notes:\n${nurseDigest}` : '',
        `Latest vitals: ${latestVitalsSnapshot}.`,
        labDigest ? `Labs:\n${labDigest}` : '',
      ].filter(Boolean);

      const prompt = `You are an AI nurse helping a hospital caregiver. Convert the context into at most 5 checklist items for family supporters.\n` +
        `Each item must include a short "task" (<=18 words) plus a "reason".\n` +
        `Respond ONLY with JSON of the form {"tasks":[{"task":"...","reason":"..."}]}.\n` +
        `Context:\n${contextSections.join('\n\n')}`;

      const response = await askGemini(prompt);
      const parsedTasks = parseCaregiverTasks(response);

      if (parsedTasks.length) {
        setCareChecklist(parsedTasks);
      } else {
        setCareChecklist(DEFAULT_CARE_TASKS);
        setCareError('AI returned an empty checklist. Showing template reminders.');
      }
    } catch (error) {
      console.error('Caregiver checklist error', error);
      setCareChecklist(DEFAULT_CARE_TASKS);
      setCareError('Unable to refresh smart tasks right now.');
    } finally {
      setCareLoading(false);
    }
  }, [
    mode,
    planDigest,
    medicationDigest,
    nurseDigest,
    labDigest,
    latestVitalsSnapshot,
    primaryDiagnosis,
    patientDoctorNotes.length,
  ]);

  useEffect(() => {
    if (mode === 'family') {
      fetchCaregiverChecklist();
    }
  }, [mode, fetchCaregiverChecklist]);

  const themeColor = mode === 'patient' ? '#2563EB' : '#7C3AED';
  const themeGradient = mode === 'patient' 
    ? ['#3B82F6', '#2563EB'] 
    : ['#8B5CF6', '#7C3AED'];

  return (
    <View style={styles.container}>
      {/* Gradient Header Background */}
      <View style={[styles.headerBg, { backgroundColor: themeColor }]}>
        <View style={[styles.gradientOverlay, { backgroundColor: themeGradient[0], opacity: 0.3 }]} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={fetchSummary} 
            tintColor="#FFF" 
          />
        }
        showsVerticalScrollIndicator={false}
      >
        
        {/* 1. Enhanced Profile Header */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.profileRow}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: patientData.avatar }} style={styles.avatar} />
                <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.greeting}>Welcome Back 👋</Text>
                <Text style={styles.name}>{patientData.name}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.subInfo}>{patientData.hn}</Text>
                  <View style={styles.dot} />
                  <Text style={styles.subInfo}>{patientData.doctor}</Text>
                </View>
              </View>
            </View>
            
            {/* Mode Toggle */}
            <View style={styles.modeContainer}>
              <TouchableOpacity 
                onPress={() => setMode('patient')} 
                style={[
                  styles.modeButton,
                  mode === 'patient' && styles.activeModeButton
                ]}
              >
                <User size={18} color={mode === 'patient' ? themeColor : '#94A3B8'} />
                <Text style={[
                  styles.modeText,
                  mode === 'patient' && { color: themeColor, fontWeight: '700' }
                ]}>
                  Patient
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setMode('family')} 
                style={[
                  styles.modeButton,
                  mode === 'family' && styles.activeModeButton
                ]}
              >
                <Users size={18} color={mode === 'family' ? themeColor : '#94A3B8'} />
                <Text style={[
                  styles.modeText,
                  mode === 'family' && { color: themeColor, fontWeight: '700' }
                ]}>
                  Family
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Bell size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <MessageCircle size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: '#DBEAFE' }]}>
              <Pill size={20} color="#2563EB" />
            </View>
            <Text style={styles.statValue}>{patientData.stats.medsTaken}/{patientData.stats.medsTotal}</Text>
            <Text style={styles.statLabel}>Meds Taken</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: '#DCFCE7' }]}>
              <Calendar size={20} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{patientData.stats.daysInRecovery}</Text>
            <Text style={styles.statLabel}>Days Recovery</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Clock size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{patientData.stats.nextAppointment}</Text>
            <Text style={styles.statLabel}>Next Visit</Text>
          </View>
        </View>

        {/* 3. AI Insight Card - Enhanced */}
        <View style={[styles.card, styles.aiCard]}>
          <View style={styles.aiHeader}>
            <View style={styles.aiTitleRow}>
              <View style={[styles.sparkleBox, { backgroundColor: themeColor + '15' }]}>
                <Sparkles size={20} color={themeColor} />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: themeColor }]}>
                  {mode === 'patient' ? 'Your Health Insight' : 'Family Update'}
                </Text>
                <Text style={styles.aiSubtitle}>AI-Powered Analysis</Text>
              </View>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={themeColor} />
              <Text style={styles.loadingText}>Analyzing your data...</Text>
            </View>
          ) : (
            <Text style={styles.aiText}>
              {aiMessage || "Your recovery is progressing well. Vital signs are stable and within normal range."}
            </Text>
          )}
        </View>

        {mode === 'family' && (
          <View style={[styles.card, styles.caregiverCard]}>
            <View style={styles.caregiverHeader}>
              <View style={styles.caregiverTitleRow}>
                <View style={styles.caregiverIconBox}>
                  <AlertCircle size={20} color="#7C3AED" />
                </View>
                <View>
                  <Text style={styles.caregiverTitle}>Caregiver Checklist</Text>
                  <Text style={styles.caregiverSubtitle}>Smart tasks from today&apos;s care plan</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={fetchCaregiverChecklist}
                style={styles.refreshButton}
                disabled={careLoading}
                activeOpacity={0.8}
              >
                <Text style={[styles.refreshText, careLoading && styles.refreshTextDisabled]}>
                  {careLoading ? 'Refreshing…' : 'Refresh'}
                </Text>
              </TouchableOpacity>
            </View>

            {careError ? (
              <View style={styles.caregiverBanner}>
                <AlertCircle size={16} color="#b45309" />
                <Text style={styles.caregiverBannerText}>{careError}</Text>
              </View>
            ) : null}

            {careLoading ? (
              <View style={styles.caregiverLoadingRow}>
                <ActivityIndicator size="small" color="#7C3AED" />
                <Text style={styles.caregiverLoadingText}>Drafting caregiver tasks…</Text>
              </View>
            ) : (
              <View style={styles.caregiverList}>
                {careChecklist.map((item, index) => (
                  <View key={`${item.task}-${index}`} style={styles.caregiverItem}>
                    <View style={styles.caregiverBullet} />
                    <View style={styles.caregiverTextBlock}>
                      <Text style={styles.caregiverTaskText}>{item.task}</Text>
                      {item.reason ? (
                        <Text style={styles.caregiverReasonText}>{item.reason}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* 4. Recovery Journey Timeline - Enhanced */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recovery Journey</Text>
          <TouchableOpacity style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>View All</Text>
            <ChevronRight size={16} color="#64748B" />
          </TouchableOpacity>
        </View>

        <View style={[styles.card, styles.timelineCard]}>
          <View style={styles.timeline}>
            {patientData.journey.map((step, index) => {
              const isLast = index === patientData.journey.length - 1;
              const isActive = step.status === 'current';
              const isDone = step.status === 'completed';
              
              return (
                <View key={index} style={styles.timelineItem}>
                  {/* Vertical Line */}
                  {!isLast && (
                    <View style={styles.verticalLine}>
                      <View style={[
                        styles.lineSegment,
                        { backgroundColor: isDone ? '#10B981' : '#E2E8F0' }
                      ]} />
                    </View>
                  )}

                  {/* Timeline Node */}
                  <View style={styles.timelineNode}>
                    {isDone ? (
                      <View style={[styles.nodeCircle, { backgroundColor: '#10B981' }]}>
                        <CheckCircle2 size={24} color="#FFF" />
                      </View>
                    ) : isActive ? (
                      <View style={[styles.nodeCircle, { backgroundColor: themeColor }]}>
                        <View style={styles.pulseRing} />
                        <View style={styles.activeNodeDot} />
                      </View>
                    ) : (
                      <View style={[styles.nodeCircle, styles.pendingNode]}>
                        <Circle size={20} color="#CBD5E1" />
                      </View>
                    )}
                  </View>

                  {/* Timeline Content */}
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineTextRow}>
                      <Text style={[
                        styles.timelineLabel,
                        isActive && { color: themeColor, fontWeight: '700' },
                        isDone && { color: '#10B981', fontWeight: '600' }
                      ]}>
                        {step.label}
                      </Text>
                      {isActive && (
                        <View style={[styles.currentBadge, { backgroundColor: themeColor }]}>
                          <Text style={styles.currentBadgeText}>Current</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.timelineDate}>{step.date}</Text>
                    {isActive && (
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '60%', backgroundColor: themeColor }]} />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* 5. Vitals Overview - Compact Grid */}
        <Text style={styles.sectionTitle}>Vital Signs</Text>
        <View style={styles.vitalsGrid}>
          <View style={styles.vitalCardCompact}>
            <Activity size={18} color="#EF4444" />
            <Text style={styles.vitalLabel}>Blood Pressure</Text>
            <Text style={styles.vitalValueLarge}>{patientData.vitals.bp}</Text>
            <View style={styles.vitalStatus}>
              <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
              <Text style={styles.statusText}>Normal</Text>
            </View>
          </View>

          <View style={styles.vitalCardCompact}>
            <Heart size={18} color="#F43F5E" />
            <Text style={styles.vitalLabel}>Heart Rate</Text>
            <Text style={styles.vitalValueLarge}>{patientData.vitals.hr}</Text>
            <View style={styles.vitalStatus}>
              <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
              <Text style={styles.statusText}>Excellent</Text>
            </View>
          </View>

          <View style={styles.vitalCardCompact}>
            <TrendingUp size={18} color="#3B82F6" />
            <Text style={styles.vitalLabel}>Temperature</Text>
            <Text style={styles.vitalValueLarge}>{patientData.vitals.temp}</Text>
            <View style={styles.vitalStatus}>
              <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
              <Text style={styles.statusText}>Normal</Text>
            </View>
          </View>

          <View style={styles.vitalCardCompact}>
            <Activity size={18} color="#8B5CF6" />
            <Text style={styles.vitalLabel}>SpO2</Text>
            <Text style={styles.vitalValueLarge}>{patientData.vitals.spo2}</Text>
            <View style={styles.vitalStatus}>
              <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
              <Text style={styles.statusText}>Good</Text>
            </View>
          </View>
        </View>

        {/* Emergency Call Button */}
        <TouchableOpacity style={[styles.emergencyButton, { backgroundColor: '#EF4444' }]}>
          <Phone size={24} color="#FFF" />
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>Emergency Call</Text>
            <Text style={styles.emergencySubtitle}>Connect to nurse station</Text>
          </View>
          <ChevronRight size={24} color="#FFF" />
        </TouchableOpacity>

        {/* 6. Today's Schedule */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <Text style={styles.scheduleCount}>{patientData.upcoming.length} items</Text>
        </View>

        {patientData.upcoming.map((item, i) => (
          <View key={i} style={styles.scheduleCard}>
            <View style={styles.scheduleTime}>
              <Clock size={16} color={themeColor} />
              <Text style={[styles.timeText, { color: themeColor }]}>{item.time}</Text>
            </View>
            
            <View style={styles.scheduleContent}>
              <View style={styles.scheduleHeader}>
                <Text style={styles.scheduleLabel}>{item.label}</Text>
                {item.type === 'appointment' && (
                  <View style={styles.appointmentBadge}>
                    <Calendar size={12} color="#F59E0B" />
                  </View>
                )}
              </View>
              <Text style={styles.scheduleDetail}>{item.detail}</Text>
            </View>

            <TouchableOpacity style={styles.checkButton}>
              {item.taken ? (
                <CheckCircle2 size={24} color="#10B981" />
              ) : (
                <Circle size={24} color="#CBD5E1" />
              )}
            </TouchableOpacity>
          </View>
        ))}

        {/* 7. Ask CareMind AI - Enhanced */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ask CareMind</Text>
          <View style={styles.aiBadge}>
            <Sparkles size={12} color="#8B5CF6" />
            <Text style={styles.aiBadgeText}>AI Assistant</Text>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput 
              style={styles.input} 
              placeholder="Ask anything about your health..."
              placeholderTextColor="#94A3B8"
              value={question}
              onChangeText={setQuestion}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, { backgroundColor: themeColor }]}
              onPress={handleAsk}
              disabled={asking || !question.trim()}
            >
              {asking ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Send size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>

          {answer ? (
            <View style={[styles.answerContainer, { backgroundColor: themeColor + '10' }]}>
              <View style={styles.answerHeader}>
                <Sparkles size={16} color={themeColor} />
                <Text style={[styles.answerTitle, { color: themeColor }]}>CareMind Response</Text>
              </View>
              <Text style={styles.answerText}>{answer}</Text>
            </View>
          ) : null}
        </View>

        {/* Suggested Questions */}
        <View style={styles.suggestedContainer}>
          <Text style={styles.suggestedLabel}>Suggested questions:</Text>
          <View style={styles.suggestedTags}>
            {['When can I eat?', 'Pain management', 'Exercise guidelines'].map((tag, i) => (
              <TouchableOpacity 
                key={i} 
                style={styles.suggestedTag}
                onPress={() => setQuestion(tag)}
              >
                <Text style={styles.suggestedTagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <LogOut size={18} color="#64748B" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Bottom Padding */}
        <View style={{ height: 40 }} />

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  
  // Header Background
  headerBg: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    height: 280,
    borderBottomLeftRadius: 32, 
    borderBottomRightRadius: 32,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  
  content: { 
    padding: 20, 
    paddingTop: 60 
  },

  // Header Section
  header: { 
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileSection: {
    flex: 1,
  },
  profileRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    borderWidth: 3, 
    borderColor: '#FFF',
    backgroundColor: '#E2E8F0',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  profileInfo: {
    flex: 1,
  },
  greeting: { 
    fontSize: 14, 
    color: 'rgba(255,255,255,0.9)', 
    fontWeight: '600',
    marginBottom: 4,
  },
  name: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#FFF',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subInfo: { 
    fontSize: 13, 
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginHorizontal: 8,
  },

  // Mode Toggle
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 4,
    alignSelf: 'flex-start',
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  activeModeButton: {
    backgroundColor: '#FFF',
  },
  modeText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Card Base
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  // AI Card
  aiCard: {
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sparkleBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  aiSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
  },
  aiText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
    fontWeight: '500',
  },
  caregiverCard: {
    borderWidth: 1,
    borderColor: '#EDE9FE',
    backgroundColor: '#FAF5FF',
  },
  caregiverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  caregiverTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  caregiverIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caregiverTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#4C1D95',
  },
  caregiverSubtitle: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '600',
  },
  refreshButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#EDE9FE',
  },
  refreshText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
    letterSpacing: 0.2,
  },
  refreshTextDisabled: {
    opacity: 0.6,
  },
  caregiverBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginBottom: 12,
  },
  caregiverBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#B45309',
  },
  caregiverLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  caregiverLoadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  caregiverList: {
    gap: 12,
  },
  caregiverItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  caregiverBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7C3AED',
    marginTop: 8,
  },
  caregiverTextBlock: {
    flex: 1,
  },
  caregiverTaskText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  caregiverReasonText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  scheduleCount: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  // Timeline
  timelineCard: {
    paddingVertical: 24,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    position: 'relative',
    minHeight: 80,
  },
  verticalLine: {
    position: 'absolute',
    left: 18,
    top: 48,
    bottom: 0,
    width: 2,
  },
  lineSegment: {
    width: '100%',
    height: '100%',
  },
  timelineNode: {
    width: 40,
    alignItems: 'center',
    marginRight: 16,
  },
  nodeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pendingNode: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  pulseRing: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
  },
  activeNodeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFF',
  },
  timelineContent: {
    flex: 1,
    paddingTop: 8,
  },
  timelineTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  timelineLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timelineDate: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Vitals Grid
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  vitalCardCompact: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  vitalLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 6,
  },
  vitalValueLarge: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  vitalStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },

  // Emergency Button
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    gap: 16,
    shadowColor: '#EF4444',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  emergencyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  emergencySubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },

  // Schedule Cards
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  scheduleTime: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 14,
    minWidth: 80,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  scheduleLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  appointmentBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleDetail: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  checkButton: {
    padding: 8,
  },

  // Input Container
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Answer Container
  answerContainer: {
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  answerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  answerText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    fontWeight: '500',
  },

  // AI Badge
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  aiBadgeText: {
    fontSize: 11,
    color: '#8B5CF6',
    fontWeight: '700',
  },

  // Suggested Questions
  suggestedContainer: {
    marginBottom: 24,
  },
  suggestedLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 10,
  },
  suggestedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestedTag: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  suggestedTagText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  logoutText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
  },
});

export default PatientSummaryScreen;