// C:\Users\Admin\Desktop\medihack\MediHack\screens\Pharmacist\PharmacistPatientConsoleScreen.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, 
  ActivityIndicator, Alert, Dimensions 
} from 'react-native';
import { 
  ArrowLeft, Pill, Activity, FileText, CheckCircle2, XCircle, 
  AlertTriangle, Sparkles, Brain, History, User, Stethoscope, ChevronRight,
  Heart, Droplets, Clock, Shield, AlertCircle, TrendingUp, Zap
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getPatientInfo } from '../../services/patientService';
import { askGemini } from '../../services/gemini';

const PharmacistPatientConsoleScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { an } = route.params;

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'RxQueue' | 'Clinical' | 'Profile'>('RxQueue');
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await getPatientInfo(an);
    
    // Mock eGFR/Allergy
    const enriched = {
      ...data,
      egfr: Math.floor(Math.random() * 60) + 15, // สุ่มค่าไต
      diagnosis: 'CKD Stage 3, Hypertension',
      allergies: ['Penicillin'],
      // Mock ยาใหม่ vs ยาเก่า
      newOrders: data.drugs?.slice(0, 2) || [],
      currentMeds: data.drugs?.slice(2) || [],
    };
    setPatient(enriched);
    setLoading(false);
  };

  // --- AI Features ---
  const checkInteraction = async (drugName: string) => {
    setAiLoading(true);
    try {
      const currentList = patient.currentMeds.map((m:any) => m.drug_name).join(', ');
      const prompt = `Pharmacist Safety Check: Is there any drug interaction between NEW DRUG: "${drugName}" and CURRENT MEDS: [${currentList}]? Answer briefly in Thai.`;
      const res = await askGemini(prompt);
      Alert.alert("Drug Interaction Check", res);
    } catch (e) { Alert.alert("AI Error"); }
    setAiLoading(false);
  };

  const checkRenalDose = async (drugName: string) => {
    setAiLoading(true);
    try {
      const prompt = `Pharmacist Renal Dose Check: Patient eGFR = ${patient.egfr}. Is the drug "${drugName}" safe? Does it need dose adjustment? Answer briefly in Thai.`;
      const res = await askGemini(prompt);
      Alert.alert("Renal Dose Adjustment", res);
    } catch (e) { Alert.alert("AI Error"); }
    setAiLoading(false);
  };

  const getDischargeAdvice = async () => {
    setAiLoading(true);
    try {
      const allMeds = [...patient.newOrders, ...patient.currentMeds].map((m:any) => m.drug_name).join(', ');
      const prompt = `Summarize discharge counseling points for these drugs: [${allMeds}] in simple Thai language for patient.`;
      const res = await askGemini(prompt);
      setAiAnalysis(res);
    } catch (e) { Alert.alert("AI Error"); }
    setAiLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#7C3AED" size="large"/>
        <Text style={styles.loadingText}>Loading patient data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
           <ArrowLeft color="#FFF" size={22} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
           <Text style={styles.headerTitle}>Pharmacy Review</Text>
           <View style={styles.headerSubtitleRow}>
              <Text style={styles.headerAN}>AN: {an}</Text>
              <View style={styles.headerDot} />
              <Text style={styles.headerBed}>Verification Console</Text>
           </View>
        </View>
        <View style={styles.headerBadge}>
          <Shield size={16} color="#FFF" strokeWidth={2.5} />
        </View>
      </View>

      {/* Modern Tabs */}
      <View style={styles.tabContainer}>
         {[
            { id: 'RxQueue', icon: Pill, label: 'Rx Queue', count: patient.newOrders.length },
            { id: 'Clinical', icon: Activity, label: 'Clinical Data' },
            { id: 'Profile', icon: User, label: 'Med Profile' }
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
                  {t.count !== undefined && t.count > 0 && (
                     <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                        <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                           {t.count}
                        </Text>
                     </View>
                  )}
                  {isActive && <View style={styles.tabIndicator} />}
               </TouchableOpacity>
            );
         })}
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
         
         {/* === TAB 1: RX QUEUE (รายการรอตรวจ) === */}
         {activeTab === 'RxQueue' && (
            <View>
               {/* Allergy Alert */}
               <View style={styles.alertBox}>
                  <View style={styles.alertIconWrapper}>
                     <AlertTriangle size={20} color="#DC2626" strokeWidth={2.5} />
                  </View>
                  <View style={styles.alertContent}>
                     <Text style={styles.alertTitle}>Drug Allergy Alert</Text>
                     <Text style={styles.alertText}>{patient.allergies.join(', ')}</Text>
                  </View>
               </View>

               {/* Section Header */}
               <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderLeft}>
                     <Zap size={18} color="#7C3AED" strokeWidth={2.5} />
                     <Text style={styles.sectionTitle}>New Orders Pending Review</Text>
                  </View>
                  <View style={styles.countBadge}>
                     <Text style={styles.countBadgeText}>{patient.newOrders.length}</Text>
                  </View>
               </View>

               {patient.newOrders.length === 0 ? (
                  <View style={styles.emptyState}>
                     <CheckCircle2 size={48} color="#CBD5E1" strokeWidth={1.5} />
                     <Text style={styles.emptyText}>No pending orders</Text>
                  </View>
               ) : (
                  patient.newOrders.map((drug:any, i:number) => (
                     <View key={i} style={styles.rxCard}>
                        <View style={styles.rxCardHeader}>
                           <View style={styles.drugIconWrapper}>
                              <Pill size={20} color="#7C3AED" strokeWidth={2} />
                           </View>
                           <View style={styles.drugInfo}>
                              <View style={styles.drugNameRow}>
                                 <Text style={styles.drugName}>{drug.drug_name}</Text>
                                 <View style={styles.newBadge}>
                                    <Text style={styles.newBadgeText}>NEW</Text>
                                 </View>
                              </View>
                              <Text style={styles.drugDetail}>
                                 {drug.dose_qty} {drug.dose_unit} • {drug.usage_text}
                              </Text>
                           </View>
                        </View>
                        
                        {/* AI Action Button */}
                        <TouchableOpacity 
                           style={styles.aiCheckButton} 
                           onPress={() => checkInteraction(drug.drug_name)}
                           disabled={aiLoading}
                           activeOpacity={0.7}
                        >
                           <View style={styles.aiCheckLeft}>
                              {aiLoading ? (
                                 <ActivityIndicator size="small" color="#7C3AED" />
                              ) : (
                                 <Sparkles size={16} color="#7C3AED" strokeWidth={2.5} />
                              )}
                              <Text style={styles.aiCheckText}>
                                 {aiLoading ? 'Checking...' : 'AI Interaction Check'}
                              </Text>
                           </View>
                           <ChevronRight size={16} color="#7C3AED" strokeWidth={2} />
                        </TouchableOpacity>
                        
                        {/* Action Buttons */}
                        <View style={styles.actionRow}>
                           <TouchableOpacity 
                              style={styles.rejectButton} 
                              onPress={()=>Alert.alert("Intervention", "Call Doctor for clarification?")}
                              activeOpacity={0.7}
                           >
                              <XCircle size={18} color="#EF4444" strokeWidth={2.5} />
                              <Text style={styles.rejectText}>Intervene</Text>
                           </TouchableOpacity>
                           <TouchableOpacity 
                              style={styles.verifyButton} 
                              onPress={()=>Alert.alert("✅ Verified", "Order has been approved and sent to dispensing.")}
                              activeOpacity={0.8}
                           >
                              <CheckCircle2 size={18} color="#FFF" strokeWidth={2.5} />
                              <Text style={styles.verifyText}>Verify & Approve</Text>
                           </TouchableOpacity>
                        </View>
                     </View>
                  ))
               )}

               {/* Already Verified Section */}
               {patient.currentMeds.length > 0 && (
                  <>
                     <View style={[styles.sectionHeader, {marginTop: 24}]}>
                        <View style={styles.sectionHeaderLeft}>
                           <CheckCircle2 size={18} color="#10B981" strokeWidth={2.5} />
                           <Text style={[styles.sectionTitle, {color: '#64748B'}]}>Already Verified</Text>
                        </View>
                     </View>
                     {patient.currentMeds.map((drug:any, i:number) => (
                        <View key={i} style={styles.verifiedCard}>
                           <CheckCircle2 size={16} color="#10B981" strokeWidth={2} />
                           <View style={styles.verifiedInfo}>
                              <Text style={styles.verifiedName}>{drug.drug_name}</Text>
                              <Text style={styles.verifiedDetail}>
                                 {drug.dose_qty} {drug.dose_unit}
                              </Text>
                           </View>
                        </View>
                     ))}
                  </>
               )}
            </View>
         )}

         {/* === TAB 2: CLINICAL CHECK (ดู Lab/Safety) === */}
         {activeTab === 'Clinical' && (
            <View>
               {/* Clinical Status Card */}
               <View style={styles.clinicalCard}>
                  <Text style={styles.clinicalCardTitle}>Clinical Parameters</Text>
                  <View style={styles.clinicalRow}>
                     <View style={styles.clinicalItem}>
                        <View style={[styles.clinicalIconWrapper, {backgroundColor: '#FEE2E2'}]}>
                           <Droplets size={20} color="#EF4444" strokeWidth={2} />
                        </View>
                        <Text style={styles.cliLabel}>eGFR</Text>
                        <Text style={[
                           styles.cliVal, 
                           {color: patient.egfr < 30 ? '#EF4444' : patient.egfr < 60 ? '#F59E0B' : '#10B981'}
                        ]}>
                           {patient.egfr}
                        </Text>
                        <Text style={styles.cliUnit}>mL/min</Text>
                     </View>
                     
                     <View style={styles.clinicalItem}>
                        <View style={[styles.clinicalIconWrapper, {backgroundColor: '#DBEAFE'}]}>
                           <Activity size={20} color="#3B82F6" strokeWidth={2} />
                        </View>
                        <Text style={styles.cliLabel}>Creatinine</Text>
                        <Text style={styles.cliVal}>1.8</Text>
                        <Text style={styles.cliUnit}>mg/dL</Text>
                     </View>
                     
                     <View style={styles.clinicalItem}>
                        <View style={[styles.clinicalIconWrapper, {backgroundColor: '#FEF3C7'}]}>
                           <TrendingUp size={20} color="#F59E0B" strokeWidth={2} />
                        </View>
                        <Text style={styles.cliLabel}>ALT</Text>
                        <Text style={styles.cliVal}>45</Text>
                        <Text style={styles.cliUnit}>U/L</Text>
                     </View>
                  </View>
                  
                  <View style={styles.diagBox}>
                     <Stethoscope size={16} color="#64748B" strokeWidth={2} />
                     <View style={{flex: 1}}>
                        <Text style={styles.diagLabel}>Primary Diagnosis</Text>
                        <Text style={styles.diagText}>{patient.diagnosis}</Text>
                     </View>
                  </View>
               </View>

               {/* AI Dose Check Section */}
               <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderLeft}>
                     <Brain size={18} color="#7C3AED" strokeWidth={2.5} />
                     <Text style={styles.sectionTitle}>AI Dose Safety Check</Text>
                  </View>
               </View>

               {patient.newOrders.map((drug:any, i:number) => (
                  <TouchableOpacity 
                     key={i} 
                     style={styles.aiCheckCard} 
                     onPress={() => checkRenalDose(drug.drug_name)}
                     disabled={aiLoading}
                     activeOpacity={0.7}
                  >
                     <View style={styles.aiCheckCardLeft}>
                        <View style={styles.aiCheckIconWrapper}>
                           {aiLoading ? (
                              <ActivityIndicator size="small" color="#7C3AED" />
                           ) : (
                              <Sparkles size={18} color="#7C3AED" strokeWidth={2.5} />
                           )}
                        </View>
                        <View>
                           <Text style={styles.aiCheckTitle}>Renal Dose Adjustment</Text>
                           <Text style={styles.aiCheckDrug}>{drug.drug_name}</Text>
                        </View>
                     </View>
                     <ChevronRight size={20} color="#7C3AED" strokeWidth={2} />
                  </TouchableOpacity>
               ))}

               {/* Lab Results */}
               <View style={[styles.sectionHeader, {marginTop: 24}]}>
                  <View style={styles.sectionHeaderLeft}>
                     <Activity size={18} color="#0F172A" strokeWidth={2.5} />
                     <Text style={styles.sectionTitle}>Recent Lab Results</Text>
                  </View>
               </View>

               <View style={styles.labCard}>
                  {patient.labs?.slice(0,6).map((l:any, i:number) => (
                     <View key={i} style={[styles.labRow, i === patient.labs?.slice(0,6).length - 1 && {borderBottomWidth: 0}]}>
                        <View style={styles.labLeft}>
                           <View style={[
                              styles.labIndicator,
                              { backgroundColor: l.flagged ? '#FEE2E2' : '#D1FAE5' }
                           ]}>
                              {l.flagged ? (
                                 <AlertCircle size={14} color="#EF4444" strokeWidth={2.5} />
                              ) : (
                                 <CheckCircle2 size={14} color="#10B981" strokeWidth={2.5} />
                              )}
                           </View>
                           <Text style={styles.labName}>{l.test}</Text>
                        </View>
                        <View style={styles.labRight}>
                           <Text style={[styles.labVal, l.flagged && {color: '#EF4444'}]}>
                              {l.lab_result}
                           </Text>
                           {l.flagged && (
                              <View style={styles.flaggedBadge}>
                                 <Text style={styles.flaggedBadgeText}>HIGH</Text>
                              </View>
                           )}
                        </View>
                     </View>
                  ))}
               </View>
            </View>
         )}

         {/* === TAB 3: MED PROFILE (ประวัติ) === */}
         {activeTab === 'Profile' && (
            <View>
               {/* Patient Profile Header */}
               <View style={styles.profileCard}>
                  <View style={styles.profileIconWrapper}>
                     <User size={32} color="#7C3AED" strokeWidth={2} />
                  </View>
                  <View style={styles.profileInfo}>
                     <Text style={styles.profileName}>Patient AN: {an}</Text>
                     <Text style={styles.profileDetails}>Male • 65 Years • 70 kg</Text>
                  </View>
               </View>

               {/* Allergy Card */}
               <View style={styles.allergyCard}>
                  <View style={styles.allergyHeader}>
                     <AlertTriangle size={18} color="#DC2626" strokeWidth={2.5} />
                     <Text style={styles.allergyTitle}>Known Drug Allergies</Text>
                  </View>
                  <View style={styles.allergyList}>
                     {patient.allergies.map((allergy: string, i: number) => (
                        <View key={i} style={styles.allergyItem}>
                           <View style={styles.allergyDot} />
                           <Text style={styles.allergyText}>{allergy}</Text>
                        </View>
                     ))}
                  </View>
               </View>

               {/* Discharge Counseling */}
               <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderLeft}>
                     <FileText size={18} color="#0F172A" strokeWidth={2.5} />
                     <Text style={styles.sectionTitle}>Discharge Counseling</Text>
                  </View>
                  <TouchableOpacity 
                     style={styles.aiGenerateButton} 
                     onPress={getDischargeAdvice} 
                     disabled={aiLoading}
                     activeOpacity={0.7}
                  >
                     {aiLoading ? (
                        <ActivityIndicator size="small" color="#FFF"/>
                     ) : (
                        <Sparkles size={14} color="#FFF" strokeWidth={2.5} />
                     )}
                     <Text style={styles.aiGenerateText}>
                        {aiLoading ? 'Generating...' : 'AI Generate'}
                     </Text>
                  </TouchableOpacity>
               </View>
               
               {aiAnalysis ? (
                  <View style={styles.adviceCard}>
                     <View style={styles.adviceHeader}>
                        <Brain size={18} color="#7C3AED" strokeWidth={2} />
                        <Text style={styles.adviceTitle}>AI-Generated Patient Counseling</Text>
                     </View>
                     <Text style={styles.adviceText}>{aiAnalysis}</Text>
                  </View>
               ) : (
                  <View style={styles.placeholderCard}>
                     <Sparkles size={32} color="#CBD5E1" strokeWidth={1.5} />
                     <Text style={styles.placeholderText}>
                        Tap 'AI Generate' to create personalized patient counseling points
                     </Text>
                  </View>
               )}
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
  
  // Header - Similar to Nurse Console
  header: { 
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
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
    color: '#E9D5FF',
    fontSize: 13,
    fontWeight: '700',
  },
  headerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#DDD6FE',
    marginHorizontal: 6,
  },
  headerBed: {
    color: '#E9D5FF',
    fontSize: 13,
    fontWeight: '600',
  },
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: { 
    fontWeight: '700',
    color: '#64748B',
    fontSize: 12,
  },
  tabTextActive: { 
    color: '#FFF',
  },
  tabBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  tabBadgeTextActive: {
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

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  countBadge: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7C3AED',
  },

  // Alert Box
  alertBox: { 
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FEE2E2',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alertIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 4,
  },
  alertText: { 
    color: '#B91C1C',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Rx Cards
  rxCard: { 
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  rxCardHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  drugIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drugInfo: {
    flex: 1,
  },
  drugNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  drugName: { 
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  newBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  newBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  drugDetail: { 
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 18,
  },
  
  // AI Check Button
  aiCheckButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F3FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  aiCheckLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiCheckText: {
    color: '#7C3AED',
    fontSize: 13,
    fontWeight: '700',
  },

  // Action Buttons
  actionRow: { 
    flexDirection: 'row',
    gap: 10,
  },
  rejectButton: { 
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
  },
  rejectText: { 
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  verifyButton: { 
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  verifyText: { 
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // Verified Cards
  verifiedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  verifiedInfo: {
    flex: 1,
  },
  verifiedName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 2,
  },
  verifiedDetail: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '500',
  },

  // Clinical Card
  clinicalCard: { 
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  clinicalCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  clinicalRow: { 
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  clinicalItem: { 
    alignItems: 'center',
    flex: 1,
  },
  clinicalIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cliLabel: { 
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cliVal: { 
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  cliUnit: { 
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  diagBox: { 
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
  },
  diagLabel: { 
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  diagText: { 
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    lineHeight: 20,
  },

  // AI Check Cards
  aiCheckCard: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
  },
  aiCheckCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  aiCheckIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCheckTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5B21B6',
    marginBottom: 3,
  },
  aiCheckDrug: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '600',
  },
  
  // Lab Card
  labCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  labRow: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontWeight: '600',
    color: '#334155',
    fontSize: 14,
  },
  labRight: {
    alignItems: 'flex-end',
  },
  labVal: { 
    fontWeight: '800',
    color: '#10B981',
    fontSize: 16,
    marginBottom: 4,
  },
  flaggedBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  flaggedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.3,
  },

  // Profile Tab
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  profileIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: { 
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  profileDetails: { 
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },

  // Allergy Card
  allergyCard: { 
    backgroundColor: '#FEF2F2',
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FEE2E2',
  },
  allergyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  allergyTitle: { 
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 14,
  },
  allergyList: {
    gap: 8,
  },
  allergyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  allergyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  allergyText: {
    color: '#991B1B',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // AI Generate Button
  aiGenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#7C3AED',
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

  // Advice Card
  adviceCard: { 
    backgroundColor: '#F5F3FF',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  adviceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5B21B6',
  },
  adviceText: { 
    color: '#4C1D95',
    lineHeight: 22,
    fontSize: 14,
    fontWeight: '500',
  },

  // Placeholder
  placeholderCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    padding: 40,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    backgroundColor: '#FFF',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 12,
  },
});

export default PharmacistPatientConsoleScreen;