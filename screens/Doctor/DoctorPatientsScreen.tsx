import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, 
  ActivityIndicator, ScrollView, TextInput, Dimensions, KeyboardAvoidingView, Platform, SafeAreaView 
} from 'react-native';
import { 
  Search, ChevronRight, X, User, Activity, Pill, Microscope, 
  FileText, Image as ImageIcon, Calendar, TrendingUp, 
  Send, Bot, AlertTriangle, Thermometer, Heart, Wind, Droplets,
  Clock, Zap, AlertCircle, CheckCircle2, Filter
} from 'lucide-react-native';
import { getPatientList, getPatientInfo } from '../../services/patientService';
import { askGemini } from '../../services/gemini';

// --- MOCK DATA GENERATORS ---
const MOCK_ALLERGIES = ['Penicillin', 'Sulfonamides', 'No Known Drug Allergy', 'Aspirin'];
const MOCK_DISEASES = ['Hypertension', 'T2DM', 'Dyslipidemia', 'CKD Stage 3', 'COPD'];
const SEVERITY_LEVELS = ['Stable', 'Monitor', 'Critical'];
const WARD_NAMES = ['Ward 4A', 'Ward 4B', 'Ward 5A', 'ICU', 'CCU'];

const getRandomItem = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

const generateMockTrendData = (baseValue: number, count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    date: `Day -${count - i}`,
    val: (baseValue + (Math.random() * 20 - 10)).toFixed(0)
  }));
};

const DoctorPatientsScreen = () => {
  // --- State ---
  const [patients, setPatients] = useState<string[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all'|'critical'|'stable'>('all');

  // Detail Modal State
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview'); 
  const [aiSummary, setAiSummary] = useState("");
  
  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    const data = await getPatientList();
    const safeData = Array.isArray(data) ? data : [];
    setPatients(safeData);
    setFilteredPatients(safeData);
    setLoading(false);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text) {
      const filtered = patients.filter(an => an.toLowerCase().includes(text.toLowerCase()));
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  };

  const openPatientDetail = async (an: string) => {
    setDetailLoading(true);
    setAiSummary("");
    setActiveTab('Overview');
    setChatMessages([]); 
    try {
      const data = await getPatientInfo(an);
      
      const enrichedData = {
        ...data,
        age: Math.floor(Math.random() * 60) + 20, 
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        bed: `Bed ${Math.floor(Math.random() * 20) + 1}`,
        ward: getRandomItem(WARD_NAMES),
        allergies: Math.random() > 0.7 ? [getRandomItem(MOCK_ALLERGIES)] : ['NKDA'],
        underlying: [getRandomItem(MOCK_DISEASES), getRandomItem(MOCK_DISEASES)],
        severity: getRandomItem(SEVERITY_LEVELS),
        admitDate: '2026-02-10',
        diagnosis: 'Community Acquired Pneumonia'
      };

      setSelectedPatient(enrichedData);
      
      const prompt = `สรุปเคส AN: ${an} สั้นๆ 3 บรรทัด (ภาษาไทย) จากข้อมูล: ยา ${JSON.stringify(data.drugs?.slice(0,3))} และแล็บ ${JSON.stringify(data.labs?.slice(0,3))}`;
      askGemini(prompt).then(res => setAiSummary(res)).catch(() => setAiSummary("AI system is processing..."));
      
      setChatMessages([{ role: 'ai', text: `Hello! I'm ready to discuss patient AN: ${an}. How can I help you today?` }]);

    } catch (e) {
      console.error(e);
    }
    setDetailLoading(false);
  };

  const getLatestVitals = (patient: any) => {
    return { 
      bp: '124/80', 
      hr: '82', 
      temp: '37.0', 
      spo2: '98',
      rr: '18'
    }; 
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'Critical': return { bg: '#FEE2E2', text: '#DC2626', icon: AlertTriangle };
      case 'Monitor': return { bg: '#FEF3C7', text: '#F59E0B', icon: AlertCircle };
      default: return { bg: '#D1FAE5', text: '#10B981', icon: CheckCircle2 };
    }
  };

  // --- Components ---
  const TrendChart = ({ title, data, color }: any) => {
     const chartData = (data && data.length > 2) ? data : generateMockTrendData(100, 7);
     const maxVal = Math.max(...chartData.map((d:any) => parseFloat(d.val) || 0));

     return (
       <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
             <Text style={styles.chartTitle}>{title}</Text>
             <View style={[styles.chartBadge, { backgroundColor: color + '20' }]}>
                <TrendingUp size={14} color={color} strokeWidth={2.5} />
                <Text style={[styles.chartBadgeText, { color }]}>Normal</Text>
             </View>
          </View>
          <View style={styles.chartRow}>
             {chartData.slice(0, 7).map((d:any, i:number) => {
                const val = parseFloat(d.val) || 0;
                const h = maxVal > 0 ? (val / (maxVal * 1.2)) * 100 : 10;
                return (
                  <View key={i} style={styles.barWrapper}>
                     <Text style={styles.barLabel}>{val}</Text>
                     <View style={[styles.bar, { height: h, backgroundColor: color }]} />
                     <Text style={styles.barDate}>{d.date}</Text>
                  </View>
                )
             })}
          </View>
       </View>
     )
  };

  // --- Render Tabs ---
  const renderTabContent = () => {
    if (!selectedPatient) return null;
    const vitals = getLatestVitals(selectedPatient);
    const severityStyle = getSeverityColor(selectedPatient.severity);
    const SeverityIcon = severityStyle.icon;

    switch (activeTab) {
      case 'Overview':
        return (
          <View style={styles.tabContent}>
             {/* Patient Header Card */}
             <View style={styles.patientHeaderCard}>
                <View style={styles.patientHeader}>
                   <View style={styles.patientAvatar}>
                      <User size={28} color="#0EA5E9" strokeWidth={2} />
                   </View>
                   <View style={styles.patientInfo}>
                      <Text style={styles.patientName}>Patient {selectedPatient.an}</Text>
                      <View style={styles.patientMeta}>
                        <Text style={styles.patientMetaText}>{selectedPatient.gender}</Text>
                        <View style={styles.metaDot} />
                        <Text style={styles.patientMetaText}>{selectedPatient.age} years</Text>
                        <View style={styles.metaDot} />
                        <Text style={styles.patientMetaText}>{selectedPatient.ward}</Text>
                      </View>
                   </View>
                   <View style={[styles.severityBadge, { backgroundColor: severityStyle.bg }]}>
                      <SeverityIcon size={14} color={severityStyle.text} strokeWidth={2.5} />
                      <Text style={[styles.severityText, { color: severityStyle.text }]}>{selectedPatient.severity}</Text>
                   </View>
                </View>

                <View style={styles.infoRow}>
                   <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Bed</Text>
                      <Text style={styles.infoValue}>{selectedPatient.bed}</Text>
                   </View>
                   <View style={styles.divider} />
                   <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Admitted</Text>
                      <Text style={styles.infoValue}>{selectedPatient.admitDate}</Text>
                   </View>
                   <View style={styles.divider} />
                   <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Day</Text>
                      <Text style={styles.infoValue}>5</Text>
                   </View>
                </View>

                <View style={styles.diagnosisBox}>
                   <Text style={styles.diagnosisLabel}>Primary Diagnosis</Text>
                   <Text style={styles.diagnosisText}>{selectedPatient.diagnosis}</Text>
                </View>

                <View style={styles.tagRow}>
                   <Text style={styles.tagRowTitle}>Allergies & Comorbidities</Text>
                   <View style={styles.tags}>
                      {selectedPatient.allergies.map((a:string, i:number) => (
                         <View key={i} style={[styles.tag, {backgroundColor: a==='NKDA'?'#D1FAE5':'#FEE2E2'}]}>
                            <Text style={[styles.tagText, {color: a==='NKDA'?'#166534':'#991B1B'}]}>{a}</Text>
                         </View>
                      ))}
                      {selectedPatient.underlying.map((u:string, i:number) => (
                         <View key={i+10} style={[styles.tag, {backgroundColor: '#DBEAFE'}]}>
                            <Text style={[styles.tagText, {color: '#075985'}]}>{u}</Text>
                         </View>
                      ))}
                   </View>
                </View>
             </View>

             {/* Vitals Grid */}
             <View style={styles.section}>
                <View style={styles.sectionHeader}>
                   <Activity size={16} color="#0F172A" strokeWidth={2.5} />
                   <Text style={styles.sectionTitle}>Vital Signs</Text>
                   <View style={styles.timeStamp}>
                      <Clock size={12} color="#94A3B8" />
                      <Text style={styles.timeStampText}>Updated 15 min ago</Text>
                   </View>
                </View>
                <View style={styles.vitalsGrid}>
                   <View style={styles.vitalCard}>
                      <View style={[styles.vitalIcon, { backgroundColor: '#FEE2E2' }]}>
                         <Activity size={18} color="#EF4444" strokeWidth={2} />
                      </View>
                      <Text style={styles.vitalLabel}>Blood Pressure</Text>
                      <Text style={styles.vitalValue}>{vitals.bp}</Text>
                      <Text style={styles.vitalUnit}>mmHg</Text>
                   </View>

                   <View style={styles.vitalCard}>
                      <View style={[styles.vitalIcon, { backgroundColor: '#FCE7F3' }]}>
                         <Heart size={18} color="#EC4899" strokeWidth={2} />
                      </View>
                      <Text style={styles.vitalLabel}>Heart Rate</Text>
                      <Text style={styles.vitalValue}>{vitals.hr}</Text>
                      <Text style={styles.vitalUnit}>bpm</Text>
                   </View>

                   <View style={styles.vitalCard}>
                      <View style={[styles.vitalIcon, { backgroundColor: '#FEF3C7' }]}>
                         <Thermometer size={18} color="#F59E0B" strokeWidth={2} />
                      </View>
                      <Text style={styles.vitalLabel}>Temperature</Text>
                      <Text style={styles.vitalValue}>{vitals.temp}</Text>
                      <Text style={styles.vitalUnit}>°C</Text>
                   </View>

                   <View style={styles.vitalCard}>
                      <View style={[styles.vitalIcon, { backgroundColor: '#DBEAFE' }]}>
                         <Wind size={18} color="#0EA5E9" strokeWidth={2} />
                      </View>
                      <Text style={styles.vitalLabel}>SpO₂</Text>
                      <Text style={styles.vitalValue}>{vitals.spo2}</Text>
                      <Text style={styles.vitalUnit}>%</Text>
                   </View>

                   <View style={styles.vitalCard}>
                      <View style={[styles.vitalIcon, { backgroundColor: '#E0E7FF' }]}>
                         <Wind size={18} color="#6366F1" strokeWidth={2} />
                      </View>
                      <Text style={styles.vitalLabel}>Resp. Rate</Text>
                      <Text style={styles.vitalValue}>{vitals.rr}</Text>
                      <Text style={styles.vitalUnit}>/min</Text>
                   </View>
                </View>
             </View>

             {/* AI Analysis */}
             <View style={styles.section}>
                <View style={styles.aiCard}>
                   <View style={styles.aiHeader}>
                      <View style={styles.aiIconWrapper}>
                         <Bot size={20} color="#7C3AED" strokeWidth={2} />
                      </View>
                      <View style={{ flex: 1 }}>
                         <Text style={styles.aiTitle}>AI Clinical Summary</Text>
                         <Text style={styles.aiSubtitle}>Powered by Gemini AI</Text>
                      </View>
                      <View style={styles.aiProcessing}>
                         <View style={styles.aiDot} />
                         <Text style={styles.aiProcessingText}>Live</Text>
                      </View>
                   </View>
                   <Text style={styles.aiText}>{aiSummary || "Analyzing patient data and generating clinical insights..."}</Text>
                </View>
             </View>

             {/* Active Medications */}
             <View style={styles.section}>
                <View style={styles.sectionHeader}>
                   <Pill size={16} color="#0F172A" strokeWidth={2.5} />
                   <Text style={styles.sectionTitle}>Current Medications</Text>
                   <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{selectedPatient.drugs?.length || 0}</Text>
                   </View>
                </View>
                <View style={styles.medicationList}>
                   {selectedPatient.drugs?.slice(0,5).map((d:any,i:number)=>(
                      <View key={i} style={styles.medicationItem}>
                         <View style={styles.medicationLeft}>
                            <View style={styles.medicationIcon}>
                               <Pill size={16} color="#0EA5E9" strokeWidth={2} />
                            </View>
                            <View style={styles.medicationInfo}>
                               <Text style={styles.medicationName}>{d.drug_name}</Text>
                               <Text style={styles.medicationDose}>{d.dose_qty} {d.dose_unit} • {d.usage_text}</Text>
                            </View>
                         </View>
                         <View style={styles.medicationStatus}>
                            <CheckCircle2 size={14} color="#10B981" />
                         </View>
                      </View>
                   ))}
                </View>
             </View>
          </View>
        );

      case 'Timeline':
        const events = [
           ...(selectedPatient.encounters || []).map((e:any) => ({...e, kind:'note'})),
           ...(selectedPatient.xrays || []).map((x:any) => ({date: x.verify_date, summary: x.item_name, type: 'Imaging', kind:'xray'})),
           ...(selectedPatient.labs || []).filter((l:any) => l.flagged).map((l:any) => ({date: l.verify_date, summary: `${l.test}: ${l.lab_result}`, type: 'Lab', kind:'lab'}))
        ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return (
          <View style={styles.tabContent}>
             <View style={styles.timelineContainer}>
                {events.length > 0 ? events.map((ev:any, i:number) => (
                   <View key={i} style={styles.timelineItem}>
                      <View style={styles.timelineLeft}>
                         <Text style={styles.timelineDate}>{ev.date?.split(' ')[0]}</Text>
                         <Text style={styles.timelineTime}>{ev.date?.split(' ')[1]?.substring(0,5)}</Text>
                      </View>
                      <View style={styles.timelineCenter}>
                         <View style={[
                            styles.timelineDot, 
                            { backgroundColor: ev.kind==='note'?'#10B981': ev.kind==='xray'?'#8B5CF6':'#EF4444' }
                         ]}>
                            {ev.kind==='xray' ? <ImageIcon size={10} color="#FFF" /> : null}
                         </View>
                         {i !== events.length-1 && <View style={styles.timelineLine} />}
                      </View>
                      <View style={styles.timelineRight}>
                         <View style={styles.timelineCard}>
                            <View style={styles.timelineCardHeader}>
                               <Text style={styles.timelineType}>{ev.type}</Text>
                               <View style={[
                                  styles.timelineTypeBadge,
                                  { backgroundColor: ev.kind==='note'?'#D1FAE5': ev.kind==='xray'?'#EDE9FE':'#FEE2E2' }
                               ]}>
                                  <Text style={[
                                     styles.timelineTypeBadgeText,
                                     { color: ev.kind==='note'?'#166534': ev.kind==='xray'?'#5B21B6':'#991B1B' }
                                  ]}>{ev.kind.toUpperCase()}</Text>
                               </View>
                            </View>
                            <Text style={styles.timelineDesc}>{ev.summary}</Text>
                         </View>
                      </View>
                   </View>
                )) : (
                   <View style={styles.emptyState}>
                      <FileText size={48} color="#CBD5E1" strokeWidth={1.5} />
                      <Text style={styles.emptyText}>No historical data available</Text>
                      <Text style={styles.emptySubtext}>Clinical events will appear here</Text>
                   </View>
                )}
             </View>
          </View>
        );

      case 'Trends':
         const glucoseData = selectedPatient.labs?.filter((l:any) => l?.test?.includes('Glucose')).map((l:any) => ({date: l.verify_date.split(' ')[0], val: l.lab_result})) || [];
         
         return (
            <View style={styles.tabContent}>
               <TrendChart title="Blood Glucose (DTX)" data={glucoseData} color="#F59E0B" />
               <TrendChart title="Creatinine Level" data={null} color="#EF4444" />
               <TrendChart title="Systolic BP" data={null} color="#0EA5E9" />
            </View>
         );
      
      case 'AI Chat':
         return (
            <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1}}>
               <ScrollView style={styles.chatContainer} contentContainerStyle={styles.chatContent}>
                  {chatMessages.map((msg,i)=>(
                     <View key={i} style={[styles.chatBubble, msg.role==='user'?styles.chatUser:styles.chatAi]}>
                        {msg.role === 'ai' && (
                           <View style={styles.chatAiIcon}>
                              <Bot size={14} color="#7C3AED" />
                           </View>
                        )}
                        <Text style={msg.role==='user'?styles.chatTextUser:styles.chatTextAi}>{msg.text}</Text>
                     </View>
                  ))}
                  {chatLoading && (
                     <View style={styles.chatLoading}>
                        <ActivityIndicator size="small" color="#7C3AED" />
                        <Text style={styles.chatLoadingText}>AI is thinking...</Text>
                     </View>
                  )}
               </ScrollView>
               <View style={styles.chatInputContainer}>
                  <TextInput 
                     style={styles.chatInput} 
                     placeholder="Ask about this patient..." 
                     placeholderTextColor="#94A3B8"
                     value={chatInput}
                     onChangeText={setChatInput}
                     multiline
                  />
                  <TouchableOpacity 
                     onPress={() => {
                        if (!chatInput.trim()) return;
                        setChatMessages(prev => [...prev, {role:'user', text: chatInput}]);
                        setChatInput('');
                        setChatLoading(true);
                        setTimeout(() => {
                           setChatMessages(prev => [...prev, {role:'ai', text: "I'm analyzing the patient data. This is a simulated response. In production, this would connect to the AI service."}]);
                           setChatLoading(false);
                        }, 1500);
                     }} 
                     style={[styles.sendBtn, !chatInput.trim() && styles.sendBtnDisabled]}
                     disabled={!chatInput.trim()}
                  >
                     <Send size={18} color="#FFF" />
                  </TouchableOpacity>
               </View>
            </KeyboardAvoidingView>
         );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
         <View>
            <Text style={styles.headerTitle}>Patient Rounds</Text>
            <Text style={styles.headerSubtitle}>{filteredPatients.length} patients under care</Text>
         </View>
      </View>
      
      {/* Search & Filter */}
      <View style={styles.searchSection}>
         <View style={styles.searchBox}>
            <Search color="#94A3B8" size={20} strokeWidth={2} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search by AN, name, or bed..." 
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
               <TouchableOpacity onPress={() => handleSearch('')}>
                  <X color="#94A3B8" size={18} />
               </TouchableOpacity>
            )}
         </View>

         {/* Quick Filters */}
         <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity 
               style={[styles.filterChip, filterStatus==='all' && styles.filterChipActive]}
               onPress={() => setFilterStatus('all')}
            >
               <Text style={[styles.filterChipText, filterStatus==='all' && styles.filterChipTextActive]}>All Patients</Text>
            </TouchableOpacity>
            <TouchableOpacity 
               style={[styles.filterChip, filterStatus==='critical' && styles.filterChipActive]}
               onPress={() => setFilterStatus('critical')}
            >
               <AlertTriangle size={14} color={filterStatus==='critical'?'#FFF':'#EF4444'} />
               <Text style={[styles.filterChipText, {color: filterStatus==='critical'?'#FFF':'#EF4444'}, filterStatus==='critical' && styles.filterChipTextActive]}>Critical</Text>
            </TouchableOpacity>
            <TouchableOpacity 
               style={[styles.filterChip, filterStatus==='stable' && styles.filterChipActive]}
               onPress={() => setFilterStatus('stable')}
            >
               <CheckCircle2 size={14} color={filterStatus==='stable'?'#FFF':'#10B981'} />
               <Text style={[styles.filterChipText, {color: filterStatus==='stable'?'#FFF':'#10B981'}, filterStatus==='stable' && styles.filterChipTextActive]}>Stable</Text>
            </TouchableOpacity>
         </ScrollView>
      </View>

      {/* Patient List */}
      {loading ? (
        <View style={styles.loadingContainer}>
           <ActivityIndicator size="large" color="#0EA5E9" />
           <Text style={styles.loadingText}>Loading patients...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => {
            // Mock severity for list view
            const severity = getRandomItem(SEVERITY_LEVELS);
            const severityStyle = getSeverityColor(severity);
            const SeverityIcon = severityStyle.icon;
            
            return (
              <TouchableOpacity 
                style={styles.patientCard} 
                onPress={() => openPatientDetail(item)}
                activeOpacity={0.7}
              >
                <View style={styles.patientCardLeft}>
                   <View style={styles.patientCardAvatar}>
                      <User color="#0EA5E9" size={22} strokeWidth={2} />
                   </View>
                   <View style={styles.patientCardInfo}>
                      <Text style={styles.patientCardAN}>AN: {item}</Text>
                      <View style={styles.patientCardMeta}>
                         <Text style={styles.patientCardMetaText}>{getRandomItem(WARD_NAMES)}</Text>
                         <View style={styles.metaDot} />
                         <Text style={styles.patientCardMetaText}>Bed {Math.floor(Math.random()*20)+1}</Text>
                      </View>
                   </View>
                </View>
                <View style={styles.patientCardRight}>
                   <View style={[styles.patientCardStatus, { backgroundColor: severityStyle.bg }]}>
                      <SeverityIcon size={12} color={severityStyle.text} strokeWidth={2.5} />
                      <Text style={[styles.patientCardStatusText, { color: severityStyle.text }]}>{severity}</Text>
                   </View>
                   <ChevronRight color="#CBD5E1" size={20} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* --- DETAIL MODAL --- */}
      <Modal visible={!!selectedPatient || detailLoading} animationType="slide" presentationStyle="pageSheet">
         <View style={styles.modalContainer}>
            {detailLoading ? (
               <View style={styles.centerLoading}>
                  <ActivityIndicator size="large" color="#0EA5E9" />
                  <Text style={styles.centerLoadingText}>Loading patient details...</Text>
                  <Text style={styles.centerLoadingSubtext}>Please wait</Text>
               </View>
            ) : ( selectedPatient &&
               <>
                 {/* Modal Header */}
                 <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderLeft}>
                       <TouchableOpacity onPress={() => setSelectedPatient(null)} style={styles.backBtn}>
                          <X size={20} color="#64748B" />
                       </TouchableOpacity>
                       <View>
                          <Text style={styles.modalTitle}>AN: {selectedPatient.an}</Text>
                          <Text style={styles.modalSubtitle}>Patient Medical Record</Text>
                       </View>
                    </View>
                 </View>

                 {/* Tabs */}
                 <View style={styles.tabContainer}>
                    {['Overview','Timeline','Trends','AI Chat'].map(t => (
                       <TouchableOpacity 
                          key={t} 
                          onPress={()=>setActiveTab(t)} 
                          style={[styles.tabBtn, activeTab===t && styles.tabBtnActive]}
                       >
                          <Text style={[styles.tabText, activeTab===t && styles.tabTextActive]}>{t}</Text>
                          {activeTab===t && <View style={styles.tabIndicator} />}
                       </TouchableOpacity>
                    ))}
                 </View>

                 {/* Content */}
                 <View style={styles.modalContent}>
                    {activeTab === 'AI Chat' ? renderTabContent() : (
                       <ScrollView 
                          contentContainerStyle={styles.scrollContent}
                          showsVerticalScrollIndicator={false}
                       >
                          {renderTabContent()}
                       </ScrollView>
                    )}
                 </View>
               </>
            )}
         </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  
  // Header
  header: { 
    paddingTop: 60, 
    paddingHorizontal: 24, 
    paddingBottom: 20, 
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#0F172A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },

  // Search Section
  searchSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: '#FFF',
    paddingBottom: 12,
  },
  searchBox: { 
    flexDirection: 'row', 
    backgroundColor: '#F8FAFC', 
    padding: 14, 
    borderRadius: 14, 
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 12, 
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0EA5E9',
    borderColor: '#0EA5E9',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFF',
  },

  // List
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
  listContent: { 
    paddingHorizontal: 24, 
    paddingTop: 16,
    paddingBottom: 24,
  },
  patientCard: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  patientCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  patientCardAvatar: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    backgroundColor: '#DBEAFE', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 14,
  },
  patientCardInfo: {
    flex: 1,
  },
  patientCardAN: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#0F172A',
    marginBottom: 4,
  },
  patientCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientCardMetaText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 6,
  },
  patientCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  patientCardStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  patientCardStatusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Modal
  modalContainer: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  centerLoading: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 8,
  },
  centerLoadingText: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '600',
  },
  centerLoadingSubtext: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20, 
    paddingBottom: 16,
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#0F172A',
    marginBottom: 2,
  },
  modalSubtitle: { 
    fontSize: 13, 
    color: '#64748B',
    fontWeight: '500',
  },
  
  tabContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    paddingHorizontal: 20, 
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabBtn: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12,
    position: 'relative',
  },
  tabBtnActive: { 
    backgroundColor: '#F8FAFC',
  },
  tabText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#94A3B8',
  },
  tabTextActive: { 
    color: '#0EA5E9',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: '#0EA5E9',
    borderRadius: 2,
  },
  modalContent: { 
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  tabContent: { 
    paddingBottom: 30,
  },

  // Patient Header Card
  patientHeaderCard: { 
    backgroundColor: '#FFF', 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 20,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  patientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  patientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientMetaText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E2E8F0',
  },
  diagnosisBox: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9',
  },
  diagnosisLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  diagnosisText: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '700',
    lineHeight: 20,
  },
  tagRow: {
    marginTop: 4,
  },
  tagRowTitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tags: {
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8,
  },
  tag: { 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8,
  },
  tagText: { 
    fontSize: 11, 
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  timeStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeStampText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
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
    padding: 16, 
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  vitalIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  vitalLabel: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#64748B',
    marginBottom: 6,
  },
  vitalValue: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#0F172A',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  vitalUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },

  // AI Card
  aiCard: {
    backgroundColor: '#FEFCFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E9D5FF',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  aiIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#7C3AED',
  },
  aiSubtitle: {
    fontSize: 11,
    color: '#A78BFA',
    fontWeight: '600',
  },
  aiProcessing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  aiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  aiProcessingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED',
    letterSpacing: 0.5,
  },
  aiText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#6B21A8',
    fontWeight: '500',
  },

  // Medications
  medicationList: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  medicationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  medicationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  medicationDose: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  medicationStatus: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Timeline
  timelineContainer: {
    paddingVertical: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineLeft: {
    width: 70,
    alignItems: 'flex-end',
    paddingRight: 14,
  },
  timelineDate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  timelineCenter: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timelineType: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  timelineTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timelineTypeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timelineDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 4,
  },

  // Charts
  chartContainer: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  chartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chartBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingBottom: 24,
    paddingTop: 10,
  },
  barWrapper: {
    alignItems: 'center',
    width: 32,
  },
  bar: {
    width: 14,
    borderRadius: 7,
    minHeight: 10,
  },
  barLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 6,
  },
  barDate: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 6,
  },

  // Chat
  chatContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  chatContent: {
    padding: 16,
  },
  chatInputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    color: '#0F172A',
    fontWeight: '500',
  },
  sendBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#0EA5E9',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
  },
  chatBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  chatUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#0EA5E9',
    borderBottomRightRadius: 4,
  },
  chatAi: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    flexDirection: 'row',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  chatAiIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatTextUser: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  chatTextAi: {
    color: '#1E293B',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    flex: 1,
  },
  chatLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  chatLoadingText: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '600',
  },
});

export default DoctorPatientsScreen;