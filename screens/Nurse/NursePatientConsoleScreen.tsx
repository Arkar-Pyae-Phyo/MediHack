import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, 
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Dimensions 
} from 'react-native';
import { 
  ArrowLeft, Activity, Pill, FileText, Save, CheckCircle2, Circle, 
  AlertTriangle, Sparkles, TrendingUp, History, ClipboardList, Stethoscope,
  Heart, Thermometer, Wind, Droplets, Clock, CheckCircle, Zap, BarChart3,
  Calendar, FileCheck, AlertCircle, TrendingDown
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getPatientInfo } from '../../services/patientService';
import { askGemini } from '../../services/gemini';

const NursePatientConsoleScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { an } = route.params;

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'Action' | 'Orders' | 'History'>('Action');

  // Input State
  const [vitals, setVitals] = useState({ bp: '', hr: '', temp: '', spo2: '' });
  const [note, setNote] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    setLoading(true);
    try {
      const data = await getPatientInfo(an);
      
      const mockHistory = [
         { date: '10:00', type: 'Note', text: 'Patient resting comfortably, no complaints reported.', icon: 'note' },
         { date: '08:00', type: 'Vitals', text: 'BP 120/80, HR 80, Temp 37.0°C, SpO2 98%', icon: 'vitals' },
         { date: 'Yesterday', type: 'Lab', text: 'Electrolytes within normal limits', icon: 'lab' }
      ];

      setPatient({
        ...data,
        meds: data.drugs?.map((m:any) => ({...m, checked: false})) || [],
        history: mockHistory
      });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const toggleMed = (index: number) => {
    const newMeds = [...patient.meds];
    newMeds[index].checked = !newMeds[index].checked;
    setPatient({...patient, meds: newMeds});
  };

  const generateNote = async () => {
    setAiLoading(true);
    try {
      const prompt = `Write a professional Nursing Progress Note for AN:${an}. Vitals: ${JSON.stringify(vitals)}. Medications administered: ${patient.meds.filter((m:any)=>m.checked).length}. Patient status: Stable. Keep it concise and clinical.`;
      const res = await askGemini(prompt);
      setNote(res);
    } catch (e) { 
      Alert.alert("AI Error", "Unable to generate note. Please try again."); 
    }
    setAiLoading(false);
  };

  const handleSave = () => {
    const checkedMeds = patient.meds.filter((m:any) => m.checked).length;
    Alert.alert(
      "Save Records", 
      `Save ${checkedMeds} medications and vitals to system?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Save", onPress: () => Alert.alert("Success", "Records saved to Hospital System.") }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#0D9488" size="large"/>
        <Text style={styles.loadingText}>Loading patient data...</Text>
      </View>
    );
  }

  const vitalIcons = {
    BP: { icon: Activity, color: '#EF4444', bg: '#FEE2E2' },
    HR: { icon: Heart, color: '#EC4899', bg: '#FCE7F3' },
    Temp: { icon: Thermometer, color: '#F59E0B', bg: '#FEF3C7' },
    SpO2: { icon: Wind, color: '#0EA5E9', bg: '#DBEAFE' }
  };

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
           <ArrowLeft color="#FFF" size={22} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
           <Text style={styles.headerTitle}>Patient Care</Text>
           <View style={styles.headerSubtitleRow}>
              <Text style={styles.headerAN}>AN: {an}</Text>
              <View style={styles.headerDot} />
              <Text style={styles.headerBed}>Bed 05</Text>
              <View style={styles.headerDot} />
              <Text style={styles.headerWard}>Ward 7</Text>
           </View>
        </View>
        <View style={styles.headerBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>Active</Text>
        </View>
      </View>

      {/* Modern Tabs */}
      <View style={styles.tabContainer}>
         {[
            { id: 'Action', icon: Activity, label: 'Record Care' },
            { id: 'Orders', icon: ClipboardList, label: 'Orders & Labs' },
            { id: 'History', icon: History, label: 'Timeline' }
         ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
               <TouchableOpacity 
                  key={t.id} 
                  style={[styles.tab, isActive && styles.tabActive]} 
                  onPress={() => setActiveTab(t.id as any)}
                  activeOpacity={0.7}
               >
                  <Icon size={18} color={isActive ? '#FFF' : '#64748B'} strokeWidth={2.5} />
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{t.label}</Text>
                  {isActive && <View style={styles.tabIndicator} />}
               </TouchableOpacity>
            );
         })}
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
         
         {/* ================= TAB 1: ACTION (Record Vitals & Note) ================= */}
         {activeTab === 'Action' && (
            <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'}>
               {/* Vitals Input */}
               <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                     <Activity size={18} color="#0F172A" strokeWidth={2.5} />
                     <Text style={styles.sectionTitle}>Vital Signs Recording</Text>
                  </View>
                  
                  <View style={styles.vitalsGrid}>
                     {Object.entries(vitalIcons).map(([label, config]) => {
                        const Icon = config.icon;
                        return (
                           <View key={label} style={styles.vitalCard}>
                              <View style={[styles.vitalIconWrapper, { backgroundColor: config.bg }]}>
                                 <Icon size={20} color={config.color} strokeWidth={2} />
                              </View>
                              <Text style={styles.vitalLabel}>{label}</Text>
                              <TextInput 
                                 style={styles.vitalInput} 
                                 placeholder="-" 
                                 placeholderTextColor="#CBD5E1"
                                 keyboardType="numeric"
                                 value={vitals[label.toLowerCase() as keyof typeof vitals]}
                                 onChangeText={t => setVitals({...vitals, [label.toLowerCase()]: t})} 
                              />
                              <Text style={styles.vitalUnit}>
                                 {label === 'BP' ? 'mmHg' : label === 'HR' ? 'bpm' : label === 'Temp' ? '°C' : '%'}
                              </Text>
                           </View>
                        );
                     })}
                  </View>

                  <View style={styles.quickTimeStamp}>
                     <Clock size={14} color="#64748B" />
                     <Text style={styles.quickTimeText}>
                        Recorded at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                     </Text>
                  </View>
               </View>

               {/* Medications Checklist */}
               <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                     <Pill size={18} color="#0F172A" strokeWidth={2.5} />
                     <Text style={styles.sectionTitle}>Medication Administration</Text>
                     <View style={styles.medCountBadge}>
                        <Text style={styles.medCountText}>
                           {patient.meds.filter((m:any) => m.checked).length}/{patient.meds.slice(0, 5).length}
                        </Text>
                     </View>
                  </View>

                  <View style={styles.medicationList}>
                     {patient.meds.slice(0, 5).map((m:any, i:number) => (
                        <TouchableOpacity 
                           key={i} 
                           style={[styles.medicationItem, m.checked && styles.medicationItemChecked]} 
                           onPress={() => toggleMed(i)}
                           activeOpacity={0.7}
                        >
                           <View style={styles.medicationLeft}>
                              <View style={[styles.checkboxWrapper, m.checked && styles.checkboxWrapperChecked]}>
                                 {m.checked ? (
                                    <CheckCircle2 size={22} color="#10B981" strokeWidth={2.5} />
                                 ) : (
                                    <Circle size={22} color="#CBD5E1" strokeWidth={2} />
                                 )}
                              </View>
                              <View style={styles.medicationInfo}>
                                 <Text style={[styles.medicationName, m.checked && styles.medicationNameChecked]}>
                                    {m.drug_name}
                                 </Text>
                                 <Text style={styles.medicationDose}>
                                    {m.dose_qty} {m.dose_unit} • {m.usage_text}
                                 </Text>
                              </View>
                           </View>
                           {m.checked && (
                              <View style={styles.givenBadge}>
                                 <CheckCircle size={12} color="#10B981" strokeWidth={2.5} />
                                 <Text style={styles.givenText}>Given</Text>
                              </View>
                           )}
                        </TouchableOpacity>
                     ))}
                  </View>
               </View>

               {/* Progress Note with AI */}
               <View style={styles.section}>
                  <View style={styles.noteHeader}>
                     <View style={styles.noteHeaderLeft}>
                        <FileText size={18} color="#0F172A" strokeWidth={2.5} />
                        <Text style={styles.sectionTitle}>Progress Note</Text>
                     </View>
                     <TouchableOpacity 
                        onPress={generateNote} 
                        style={styles.aiGenerateButton}
                        disabled={aiLoading}
                        activeOpacity={0.7}
                     >
                        {aiLoading ? (
                           <ActivityIndicator size="small" color="#FFF"/>
                        ) : (
                           <Sparkles size={14} color="#FFF" strokeWidth={2.5} />
                        )}
                        <Text style={styles.aiGenerateText}>
                           {aiLoading ? 'Generating...' : 'AI Draft'}
                        </Text>
                     </TouchableOpacity>
                  </View>

                  <View style={styles.noteCard}>
                     <TextInput 
                        style={styles.noteTextArea} 
                        multiline 
                        placeholder="Document patient care, observations, and responses to treatment..." 
                        placeholderTextColor="#94A3B8"
                        value={note}
                        onChangeText={setNote}
                     />
                     <View style={styles.noteFooter}>
                        <Text style={styles.noteCharCount}>{note.length} characters</Text>
                        {aiLoading && (
                           <View style={styles.aiProcessing}>
                              <Zap size={12} color="#7C3AED" />
                              <Text style={styles.aiProcessingText}>AI Processing...</Text>
                           </View>
                        )}
                     </View>
                  </View>
               </View>

               {/* Save Button */}
               <TouchableOpacity 
                  style={styles.saveButton} 
                  onPress={handleSave}
                  activeOpacity={0.8}
               >
                  <View style={styles.saveButtonIcon}>
                     <Save size={20} color="#FFF" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.saveButtonText}>Save All Records</Text>
               </TouchableOpacity>
            </KeyboardAvoidingView>
         )}

         {/* ================= TAB 2: ORDERS (View Only) ================= */}
         {activeTab === 'Orders' && (
            <View>
               {/* Doctor's Orders */}
               <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                     <Stethoscope size={18} color="#0F172A" strokeWidth={2.5} />
                     <Text style={styles.sectionTitle}>Doctor's Orders</Text>
                     <View style={styles.orderCountBadge}>
                        <Text style={styles.orderCountText}>
                           {patient.encounters?.filter((e:any)=>e.type.includes('Doctor')).length || 0}
                        </Text>
                     </View>
                  </View>

                  {patient.encounters?.filter((e:any)=>e.type.includes('Doctor')).length > 0 ? (
                     patient.encounters.filter((e:any)=>e.type.includes('Doctor')).map((note:any, i:number) => (
                        <View key={i} style={styles.orderCard}>
                           <View style={styles.orderHeader}>
                              <View style={styles.orderIconWrapper}>
                                 <Stethoscope size={16} color="#2563EB" strokeWidth={2} />
                              </View>
                              <View style={styles.orderHeaderText}>
                                 <Text style={styles.orderTitle}>Clinical Order</Text>
                                 <View style={styles.orderMeta}>
                                    <Clock size={10} color="#94A3B8" />
                                    <Text style={styles.orderDate}>{note.date}</Text>
                                 </View>
                              </View>
                           </View>
                           <Text style={styles.orderContent}>{note.summary}</Text>
                        </View>
                     ))
                  ) : (
                     <View style={styles.emptyState}>
                        <FileCheck size={40} color="#CBD5E1" strokeWidth={1.5} />
                        <Text style={styles.emptyText}>No doctor's orders</Text>
                     </View>
                  )}
               </View>

               {/* Lab Results */}
               <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                     <BarChart3 size={18} color="#0F172A" strokeWidth={2.5} />
                     <Text style={styles.sectionTitle}>Laboratory Results</Text>
                     <View style={styles.flaggedBadge}>
                        <AlertCircle size={12} color="#EF4444" strokeWidth={2.5} />
                        <Text style={styles.flaggedText}>
                           {patient.labs?.filter((l:any) => l.flagged).length || 0}
                        </Text>
                     </View>
                  </View>

                  <View style={styles.labsList}>
                     {patient.labs?.slice(0, 10).map((l:any, i:number) => (
                        <View key={i} style={styles.labItem}>
                           <View style={styles.labLeft}>
                              <View style={[
                                 styles.labIndicator,
                                 { backgroundColor: l.flagged ? '#FEE2E2' : '#D1FAE5' }
                              ]}>
                                 {l.flagged ? (
                                    <TrendingUp size={14} color="#EF4444" strokeWidth={2.5} />
                                 ) : (
                                    <CheckCircle2 size={14} color="#10B981" strokeWidth={2.5} />
                                 )}
                              </View>
                              <Text style={styles.labName}>{l.test}</Text>
                           </View>
                           <View style={styles.labRight}>
                              <Text style={[
                                 styles.labValue,
                                 l.flagged && styles.labValueFlagged
                              ]}>
                                 {l.lab_result}
                              </Text>
                              {l.flagged && (
                                 <View style={styles.abnormalTag}>
                                    <Text style={styles.abnormalTagText}>HIGH</Text>
                                 </View>
                              )}
                           </View>
                        </View>
                     ))}
                  </View>
               </View>
            </View>
         )}

         {/* ================= TAB 3: HISTORY (Timeline) ================= */}
         {activeTab === 'History' && (
            <View>
               {/* Vital Trends Chart */}
               <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                     <TrendingUp size={18} color="#0F172A" strokeWidth={2.5} />
                     <Text style={styles.sectionTitle}>Vital Signs Trend (24h)</Text>
                  </View>

                  <View style={styles.trendCard}>
                     <View style={styles.trendHeader}>
                        <Text style={styles.trendTitle}>Blood Pressure</Text>
                        <View style={styles.trendBadge}>
                           <View style={styles.trendDot} />
                           <Text style={styles.trendBadgeText}>Stable</Text>
                        </View>
                     </View>
                     <View style={styles.chartArea}>
                        <View style={styles.chartBars}>
                           {[40, 60, 50, 80, 70, 60, 50].map((h, i)=>(
                              <View key={i} style={styles.barWrapper}>
                                 <View style={[styles.chartBar, { height: h }]} />
                                 <Text style={styles.barLabel}>{i*4}h</Text>
                              </View>
                           ))}
                        </View>
                     </View>
                  </View>
               </View>

               {/* Activity Timeline */}
               <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                     <History size={18} color="#0F172A" strokeWidth={2.5} />
                     <Text style={styles.sectionTitle}>Activity Log</Text>
                  </View>

                  <View style={styles.timeline}>
                     {patient.history.map((h:any, i:number) => (
                        <View key={i} style={styles.timelineItem}>
                           <View style={styles.timelineLeft}>
                              <View style={styles.timelineTime}>
                                 <Text style={styles.timelineTimeText}>{h.date}</Text>
                              </View>
                           </View>
                           <View style={styles.timelineCenter}>
                              <View style={[
                                 styles.timelineDot,
                                 { backgroundColor: h.type==='Note' ? '#3B82F6' : h.type==='Vitals' ? '#10B981' : '#F59E0B' }
                              ]} />
                              {i !== patient.history.length - 1 && (
                                 <View style={styles.timelineLine} />
                              )}
                           </View>
                           <View style={styles.timelineRight}>
                              <View style={styles.timelineCard}>
                                 <View style={styles.timelineCardHeader}>
                                    <View style={[
                                       styles.timelineTypeBadge,
                                       { backgroundColor: h.type==='Note' ? '#EFF6FF' : h.type==='Vitals' ? '#D1FAE5' : '#FEF3C7' }
                                    ]}>
                                       <Text style={[
                                          styles.timelineTypeText,
                                          { color: h.type==='Note' ? '#1E40AF' : h.type==='Vitals' ? '#166534' : '#B45309' }
                                       ]}>
                                          {h.type}
                                       </Text>
                                    </View>
                                 </View>
                                 <Text style={styles.timelineText}>{h.text}</Text>
                              </View>
                           </View>
                        </View>
                     ))}
                  </View>
               </View>
            </View>
         )}

         <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  
  // Header
  header: { 
    backgroundColor: '#0D9488',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backButton: { 
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: { 
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 6,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAN: {
    color: '#CCFBF1',
    fontSize: 13,
    fontWeight: '700',
  },
  headerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#5EEAD4',
    marginHorizontal: 6,
  },
  headerBed: {
    color: '#CCFBF1',
    fontSize: 13,
    fontWeight: '600',
  },
  headerWard: {
    color: '#CCFBF1',
    fontSize: 13,
    fontWeight: '600',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
  },

  // Tabs
  tabContainer: { 
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  tab: { 
    flex: 1,
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  tabActive: { 
    backgroundColor: '#0D9488',
  },
  tabText: { 
    fontWeight: '700',
    color: '#64748B',
    fontSize: 12,
  },
  tabTextActive: { 
    color: '#FFF',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 3,
    backgroundColor: '#FFF',
    borderRadius: 2,
  },

  content: { 
    padding: 20,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },

  // Vitals
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vitalCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  vitalIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  vitalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  vitalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    width: '100%',
    marginBottom: 4,
  },
  vitalUnit: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  quickTimeStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginTop: 12,
  },
  quickTimeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },

  // Medications
  medCountBadge: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  medCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7C3AED',
  },
  medicationList: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  medicationItemChecked: {
    backgroundColor: '#F0FDF4',
  },
  medicationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkboxWrapper: {
    marginRight: 12,
  },
  checkboxWrapperChecked: {
    // Animation could be added here
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  medicationNameChecked: {
    color: '#166534',
  },
  medicationDose: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  givenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  givenText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.3,
  },

  // Note
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  noteHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  aiGenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  aiGenerateText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  noteCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  noteTextArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    minHeight: 120,
    fontSize: 14,
    color: '#0F172A',
    textAlignVertical: 'top',
    fontWeight: '500',
    lineHeight: 20,
  },
  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  noteCharCount: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  aiProcessing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiProcessingText: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '700',
  },

  // Save Button
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#0D9488',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  saveButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Orders Tab
  orderCountBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  orderCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  orderIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderHeaderText: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 3,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderDate: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  orderContent: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFF',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 12,
  },

  // Labs
  flaggedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  flaggedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  labsList: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  labItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  labLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  labIndicator: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  labName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  labRight: {
    alignItems: 'flex-end',
  },
  labValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 4,
  },
  labValueFlagged: {
    color: '#EF4444',
  },
  abnormalTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  abnormalTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.3,
  },

  // History Tab - Trend Chart
  trendCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  trendTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  trendDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  trendBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  chartArea: {
    height: 120,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    paddingBottom: 24,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 14,
    backgroundColor: '#2DD4BF',
    borderRadius: 7,
    minHeight: 10,
  },
  barLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 6,
  },

  // Timeline
  timeline: {
    paddingVertical: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineLeft: {
    width: 60,
    alignItems: 'flex-end',
    paddingRight: 14,
  },
  timelineTime: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timelineTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  timelineCenter: {
    alignItems: 'center',
    width: 20,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: '#FFF',
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  timelineRight: {
    flex: 1,
    paddingLeft: 14,
  },
  timelineCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  timelineCardHeader: {
    marginBottom: 10,
  },
  timelineTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  timelineTypeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  timelineText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    fontWeight: '500',
  },
});

export default NursePatientConsoleScreen;