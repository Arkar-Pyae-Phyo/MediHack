import React, { useCallback, useEffect, useState } from 'react';
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
  Alert,
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
} from 'lucide-react-native';

import { askGemini } from '../../services/gemini';
import { getPatientInfo } from '../../services/patientService';

// --- Mock Data (ใช้เป็นค่าสำรองกรณีโหลดไม่ติด) ---
const patientData = {
  name: 'Loading...',
  hn: 'Wait...',
  doctor: 'Dr. Patel',
  avatar: 'https://i.pravatar.cc/150?img=11',
  
  // Timeline การรักษา (จำลอง)
  journey: [
    { label: 'Admitted', status: 'completed', date: 'Feb 10' },
    { label: 'Surgery', status: 'completed', date: 'Feb 11' },
    { label: 'Recovery', status: 'current', date: 'Feb 12-16' },
    { label: 'Discharge', status: 'pending', date: 'Feb 17' },
  ],

  // Quick stats (จำลอง)
  stats: {
    daysInRecovery: 3,
    nextAppointment: '2 hrs'
  },
  
  // Vitals (จำลอง)
  vitals: {
    bp: '-',
    hr: '-',
    temp: '-',
    spo2: '-'
  }
};

const buildPrompt = (mode: 'patient' | 'family') => `
  Context: Patient is in recovery stage. Vitals are stable.
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
  
  // State สำหรับเก็บข้อมูลจริง
  const [realData, setRealData] = useState<any>(null); 
  const [loadingData, setLoadingData] = useState(true);

  // ฟังก์ชันดึงข้อมูลจริง
  const fetchMyData = async () => {
    setLoadingData(true);
    try {
      console.log("🚀 Fetching data...");
      // ⚠️ ในอนาคตเปลี่ยน 'AN1' เป็นตัวแปรที่รับมาจากการ Login
      const data = await getPatientInfo('AN1'); 
      console.log("📦 Received:", JSON.stringify(data).substring(0, 100) + "...");
      
      if (data) {
        setRealData(data);
      }
    } catch (error) {
      console.log("Fetch Error:", error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchMyData();
  }, []);

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

  // Helper ดึงค่า Vital Sign (ถ้า API ส่งมา key ชื่อ nurse_notes หรือ vitals)
  // หมายเหตุ: โค้ดนี้เขียนเผื่อไว้ ถ้า API ยังไม่ส่ง key vitals มา มันจะโชว์ค่าว่าง
  const getVital = (name: string) => {
    if (!realData?.vitals) return patientData.vitals[name.toLowerCase()] || '-';
    // ปรับ logic ตามโครงสร้างจริงที่ PHP ส่งมา
    return realData.vitals.find((v: any) => v.name === name)?.value || '-';
  };

  if (loadingData && !realData) {
      return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC'}}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={{marginTop: 10, color: '#64748B'}}>กำลังดึงข้อมูลสุขภาพของคุณ...</Text>
        </View>
      );
  }

  const themeColor = mode === 'patient' ? '#2563EB' : '#7C3AED';
  const themeGradient = mode === 'patient' 
    ? ['#3B82F6', '#2563EB'] 
    : ['#8B5CF6', '#7C3AED'];

    const displayedDrugs = realData?.drugs 
    ? realData.drugs
        // 1. กรองชื่อซ้ำ (เอาเฉพาะอันล่าสุดของชื่อนั้นๆ)
        .filter((drug: any, index: number, self: any[]) =>
          index === self.findIndex((t: any) => t.drug_name === drug.drug_name)
        )
        // 2. ตัดให้เหลือแค่ 5 ตัวแรก
        .slice(0, 5)
    : [];

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
            onRefresh={() => { fetchSummary(); fetchMyData(); }} 
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
                
                {/* ชื่อคนไข้ (ถ้า API ไม่ส่งชื่อมา ให้โชว์ AN แทนไปก่อน) */}
                <Text style={styles.name}>
                  {realData?.name ? realData.name : (realData?.an ? `Patient ${realData.an}` : patientData.name)}
                </Text>
                
                <View style={styles.metaRow}>
                  {/* AN Code */}
                  <Text style={styles.subInfo}>
                    {realData?.an ? `AN: ${realData.an}` : patientData.hn}
                  </Text>
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
            {/* นับจำนวนยาจาก realData.drugs */}
            <Text style={styles.statValue}>
                {realData?.drugs ? realData.drugs.length : 0}
            </Text>
            <Text style={styles.statLabel}>Medicines</Text>
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

        {/* 3. AI Insight Card */}
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

        {/* 4. Timeline */}
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
                  {!isLast && (
                    <View style={styles.verticalLine}>
                      <View style={[
                        styles.lineSegment,
                        { backgroundColor: isDone ? '#10B981' : '#E2E8F0' }
                      ]} />
                    </View>
                  )}
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

        {/* 5. Vitals Overview */}
        <Text style={styles.sectionTitle}>Latest Vital Signs</Text>
        <View style={styles.vitalsGrid}>
          <View style={styles.vitalCardCompact}>
            <Activity size={18} color="#EF4444" />
            <Text style={styles.vitalLabel}>Blood Pressure</Text>
            <Text style={styles.vitalValueLarge}>{getVital('BP')}</Text>
            <View style={styles.vitalStatus}>
              <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
              <Text style={styles.statusText}>Normal</Text>
            </View>
          </View>

          <View style={styles.vitalCardCompact}>
            <Heart size={18} color="#F43F5E" />
            <Text style={styles.vitalLabel}>Heart Rate</Text>
            <Text style={styles.vitalValueLarge}>{getVital('HR')}</Text>
            <View style={styles.vitalStatus}>
              <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
              <Text style={styles.statusText}>Excellent</Text>
            </View>
          </View>

          <View style={styles.vitalCardCompact}>
            <TrendingUp size={18} color="#3B82F6" />
            <Text style={styles.vitalLabel}>Temperature</Text>
            <Text style={styles.vitalValueLarge}>{getVital('Temp')}</Text>
            <View style={styles.vitalStatus}>
              <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
              <Text style={styles.statusText}>Normal</Text>
            </View>
          </View>

          <View style={styles.vitalCardCompact}>
            <Activity size={18} color="#8B5CF6" />
            <Text style={styles.vitalLabel}>SpO2</Text>
            <Text style={styles.vitalValueLarge}>{getVital('SpO2')}</Text>
            <View style={styles.vitalStatus}>
              <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
              <Text style={styles.statusText}>Good</Text>
            </View>
          </View>
        </View>

        {/* Emergency Call */}
        <TouchableOpacity style={[styles.emergencyButton, { backgroundColor: '#EF4444' }]}>
          <Phone size={24} color="#FFF" />
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>Emergency Call</Text>
            <Text style={styles.emergencySubtitle}>Connect to nurse station</Text>
          </View>
          <ChevronRight size={24} color="#FFF" />
        </TouchableOpacity>

        {/* 6. Today's Medication (ใช้ข้อมูลจริงจาก realData.drugs) */}
       <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Medications Plan</Text>
          <Text style={styles.scheduleCount}>
            {/* โชว์จำนวนยาที่กรองแล้ว */}
            {displayedDrugs.length} items
          </Text>
        </View>

        {displayedDrugs.length > 0 ? (
          // วนลูปจากตัวแปรใหม่ displayedDrugs
          displayedDrugs.map((item: any, i: number) => (
            <View key={i} style={styles.scheduleCard}>
              <View style={styles.scheduleTime}>
                <Clock size={16} color={themeColor} />
                <Text style={[styles.timeText, { color: themeColor, fontSize: 11 }]}>
                  {item.usage_text ? item.usage_text.substring(0, 10) + '...' : 'Daily'}
                </Text>
              </View>
              
              <View style={styles.scheduleContent}>
                <View style={styles.scheduleHeader}>
                  <Text style={styles.scheduleLabel}>
                    {/* ตัดชื่อยาให้สั้นลงถ้ามันยาวเกินไป */}
                    {item.drug_name.length > 25 ? item.drug_name.substring(0, 25) + '...' : item.drug_name}
                  </Text>
                  <View style={styles.appointmentBadge}>
                    <Pill size={12} color="#F59E0B" />
                  </View>
                </View>
                <Text style={styles.scheduleDetail}>
                  Dose: {item.dose_qty} {item.dose_unit}
                </Text>
              </View>

              <TouchableOpacity style={styles.checkButton}>
                <Circle size={24} color="#CBD5E1" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={{padding: 20, alignItems: 'center'}}>
            <Text style={{color: '#94A3B8'}}>No medications found.</Text>
          </View>
        )}

        {/* 7. Ask CareMind AI */}
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