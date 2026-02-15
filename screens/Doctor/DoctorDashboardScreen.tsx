import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { 
  User, ChevronRight, ArrowLeft, Activity, Pill, Microscope, 
  Bot, TrendingUp, AlertCircle, CheckCircle2, Clock, 
  FileText, Zap, Sparkles, Brain, BarChart3
} from 'lucide-react-native';

import RoleHeader from '../../components/RoleHeader';
import { askGemini } from '../../services/gemini';
import { getPatientInfo, getPatientList } from '../../services/patientService';

const DoctorDashboardScreen = ({ onLogout }: { onLogout: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [patientList, setPatientList] = useState<string[]>([]);
  const [selectedAN, setSelectedAN] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [aiBriefing, setAiBriefing] = useState("");
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // 1. ดึงรายชื่อคนไข้ทั้งหมด
  const loadPatientList = async () => {
    setLoading(true);
    const list = await getPatientList();
    setPatientList(list);
    setLoading(false);
  };

  // 2. ดึงข้อมูลคนไข้ที่เลือก + สรุป AI
  const loadPatientDetail = async (an: string) => {
    setLoading(true);
    setSelectedAN(an);
    setAiAnalyzing(true);
    try {
      const data = await getPatientInfo(an);
      setDetailData(data);
      
      // สั่ง AI สรุปสั้นๆ
      const prompt = `สรุปอาการและจุดที่ต้องระวังของคนไข้ AN: ${an} จากข้อมูลยาและแล็บนี้เป็นภาษาไทยสั้นๆ: ${JSON.stringify(data).substring(0, 1000)}`;
      const aiRes = await askGemini(prompt);
      setAiBriefing(aiRes);
    } catch (err) {
      Alert.alert("Error", "ไม่สามารถดึงข้อมูลคนไข้ได้");
    } finally {
      setLoading(false);
      setAiAnalyzing(false);
    }
  };

  useEffect(() => {
    loadPatientList();
  }, []);

  // กรองยาไม่ให้ซ้ำ
  const uniqueDrugs = useMemo(() => {
    return detailData?.drugs 
      ? detailData.drugs.filter((drug: any, index: number, self: any[]) =>
          index === self.findIndex((t: any) => t.drug_name === drug.drug_name)
        ).slice(0, 5)
      : [];
  }, [detailData]);

  // คำนวณสถิติจาก labs
  const labStats = useMemo(() => {
    if (!detailData?.labs) return { total: 0, flagged: 0, normal: 0 };
    const flagged = detailData.labs.filter((l: any) => l.flagged).length;
    return {
      total: detailData.labs.length,
      flagged,
      normal: detailData.labs.length - flagged
    };
  }, [detailData]);

  // --- View 1: หน้าแสดงรายชื่อ (List Mode) ---
  if (!selectedAN) {
    return (
      <View style={styles.container}>
        {/* Modern Header */}
        <View style={styles.listHeader}>
          <View style={styles.listHeaderContent}>
            <Text style={styles.listHeaderTitle}>Patient Rounding</Text>
            <Text style={styles.listHeaderSubtitle}>Select a patient to review clinical data</Text>
          </View>
          <View style={styles.patientCountBadge}>
            <Text style={styles.patientCountNumber}>{patientList.length}</Text>
            <Text style={styles.patientCountLabel}>Patients</Text>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={loading} 
              onRefresh={loadPatientList}
              tintColor="#0EA5E9"
            />
          }
        >
          {loading && patientList.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0EA5E9" />
              <Text style={styles.loadingText}>Loading patient list...</Text>
            </View>
          ) : patientList.length === 0 ? (
            <View style={styles.emptyState}>
              <User size={64} color="#CBD5E1" strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No Patients Found</Text>
              <Text style={styles.emptySubtitle}>Pull down to refresh</Text>
            </View>
          ) : (
            <>
              <View style={styles.listSection}>
                <View style={styles.sectionHeader}>
                  <FileText size={16} color="#0F172A" strokeWidth={2.5} />
                  <Text style={styles.sectionTitle}>Active Cases</Text>
                </View>
                
                {patientList.map((an, index) => (
                  <TouchableOpacity 
                    key={an} 
                    style={styles.patientCard}
                    onPress={() => loadPatientDetail(an)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.patientCardLeft}>
                      <View style={styles.patientAvatar}>
                        <User color="#0EA5E9" size={24} strokeWidth={2} />
                      </View>
                      <View style={styles.patientInfo}>
                        <Text style={styles.patientAN}>AN: {an}</Text>
                        <View style={styles.patientMeta}>
                          <View style={styles.statusBadge}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>Inpatient</Text>
                          </View>
                          <View style={styles.metaDivider} />
                          <Text style={styles.metaText}>Ward {(index % 3) + 4}A</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.patientCardRight}>
                      <View style={styles.chevronCircle}>
                        <ChevronRight color="#64748B" size={18} strokeWidth={2.5} />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>
        <RoleHeader role="Doctor" onLogout={onLogout} />
      </View>
    );
  }

  // --- View 2: หน้าแสดงรายละเอียด (Detail Mode) ---
  return (
    <View style={styles.container}>
      {/* Detail Header */}
      <View style={styles.detailHeader}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            setSelectedAN(null);
            setDetailData(null);
            setAiBriefing("");
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#64748B" strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.detailHeaderContent}>
          <Text style={styles.detailHeaderTitle}>AN: {selectedAN}</Text>
          <Text style={styles.detailHeaderSubtitle}>Clinical Summary & Analysis</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.detailContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.detailLoadingContainer}>
            <ActivityIndicator size="large" color="#0EA5E9" />
            <Text style={styles.detailLoadingText}>Loading patient data...</Text>
          </View>
        ) : (
          <>
            {/* Patient Overview Card */}
            <View style={styles.overviewCard}>
              <View style={styles.overviewHeader}>
                <View style={styles.overviewAvatar}>
                  <User size={32} color="#0EA5E9" strokeWidth={2} />
                </View>
                <View style={styles.overviewInfo}>
                  <Text style={styles.overviewAN}>Patient {selectedAN}</Text>
                  <Text style={styles.overviewStatus}>Under Active Care</Text>
                </View>
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Pill size={18} color="#7C3AED" strokeWidth={2} />
                  <Text style={styles.statValue}>{uniqueDrugs.length}</Text>
                  <Text style={styles.statLabel}>Medications</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Microscope size={18} color="#10B981" strokeWidth={2} />
                  <Text style={styles.statValue}>{labStats.total}</Text>
                  <Text style={styles.statLabel}>Lab Tests</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <AlertCircle size={18} color="#EF4444" strokeWidth={2} />
                  <Text style={styles.statValue}>{labStats.flagged}</Text>
                  <Text style={styles.statLabel}>Flagged</Text>
                </View>
              </View>
            </View>

            {/* AI Clinical Briefing */}
            <View style={styles.section}>
              <View style={styles.aiCard}>
                <View style={styles.aiCardHeader}>
                  <View style={styles.aiIconWrapper}>
                    <Brain size={24} color="#7C3AED" strokeWidth={2} />
                  </View>
                  <View style={styles.aiHeaderText}>
                    <Text style={styles.aiTitle}>AI Clinical Briefing</Text>
                    <Text style={styles.aiSubtitle}>Intelligent Analysis & Insights</Text>
                  </View>
                  {aiAnalyzing && (
                    <View style={styles.aiSpinner}>
                      <ActivityIndicator size="small" color="#7C3AED" />
                    </View>
                  )}
                </View>
                
                {aiAnalyzing ? (
                  <View style={styles.aiLoadingBox}>
                    <Sparkles size={20} color="#A78BFA" strokeWidth={2} />
                    <Text style={styles.aiLoadingText}>Analyzing patient data with AI...</Text>
                  </View>
                ) : (
                  <View style={styles.aiBriefingContent}>
                    <Text style={styles.aiBriefingText}>
                      {aiBriefing || "AI analysis will appear here once data is processed."}
                    </Text>
                  </View>
                )}

                <View style={styles.aiFooter}>
                  <Zap size={12} color="#A78BFA" />
                  <Text style={styles.aiFooterText}>Powered by Gemini AI • Real-time Analysis</Text>
                </View>
              </View>
            </View>

            {/* Recent Labs */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderBox}>
                <View style={styles.sectionHeaderLeft}>
                  <View style={styles.sectionIconWrapper}>
                    <Microscope size={18} color="#10B981" strokeWidth={2} />
                  </View>
                  <View>
                    <Text style={styles.sectionTitleText}>Recent Laboratory Results</Text>
                    <Text style={styles.sectionSubtext}>Latest test findings</Text>
                  </View>
                </View>
                {labStats.flagged > 0 && (
                  <View style={styles.flaggedBadge}>
                    <AlertCircle size={12} color="#EF4444" strokeWidth={2.5} />
                    <Text style={styles.flaggedBadgeText}>{labStats.flagged}</Text>
                  </View>
                )}
              </View>

              <View style={styles.dataCard}>
                {detailData?.labs?.slice(0, 6).map((lab: any, i: number) => (
                  <View 
                    key={i} 
                    style={[
                      styles.dataItem,
                      i === detailData.labs.slice(0, 6).length - 1 && styles.dataItemLast
                    ]}
                  >
                    <View style={styles.dataItemLeft}>
                      <View style={[
                        styles.dataItemIcon,
                        { backgroundColor: lab.flagged ? '#FEE2E2' : '#D1FAE5' }
                      ]}>
                        {lab.flagged ? (
                          <TrendingUp size={14} color="#EF4444" strokeWidth={2.5} />
                        ) : (
                          <CheckCircle2 size={14} color="#10B981" strokeWidth={2.5} />
                        )}
                      </View>
                      <View style={styles.dataItemInfo}>
                        <Text style={styles.dataItemTitle}>{lab.test}</Text>
                        <Text style={styles.dataItemMeta}>
                          {lab.verify_date?.split(' ')[0] || 'Recent'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.dataItemRight}>
                      <Text style={[
                        styles.dataItemValue,
                        lab.flagged && styles.dataItemValueFlagged
                      ]}>
                        {lab.lab_result}
                      </Text>
                      {lab.flagged && (
                        <View style={styles.flagTag}>
                          <Text style={styles.flagTagText}>HIGH</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Active Medications */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderBox}>
                <View style={styles.sectionHeaderLeft}>
                  <View style={[styles.sectionIconWrapper, { backgroundColor: '#F5F3FF' }]}>
                    <Pill size={18} color="#7C3AED" strokeWidth={2} />
                  </View>
                  <View>
                    <Text style={styles.sectionTitleText}>Active Medications</Text>
                    <Text style={styles.sectionSubtext}>Current treatment plan</Text>
                  </View>
                </View>
                <View style={styles.countCircle}>
                  <Text style={styles.countCircleText}>{uniqueDrugs.length}</Text>
                </View>
              </View>

              <View style={styles.dataCard}>
                {uniqueDrugs.length > 0 ? uniqueDrugs.map((med: any, i: number) => (
                  <View 
                    key={i} 
                    style={[
                      styles.medicationItem,
                      i === uniqueDrugs.length - 1 && styles.medicationItemLast
                    ]}
                  >
                    <View style={styles.medicationLeft}>
                      <View style={styles.medicationIconBox}>
                        <Pill size={16} color="#7C3AED" strokeWidth={2} />
                      </View>
                      <View style={styles.medicationInfo}>
                        <Text style={styles.medicationName}>{med.drug_name}</Text>
                        <Text style={styles.medicationDose}>
                          {med.dose_qty} {med.dose_unit}
                          {med.usage_text && ` • ${med.usage_text}`}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.medicationStatus}>
                      <View style={styles.activeDot} />
                      <Text style={styles.activeText}>Active</Text>
                    </View>
                  </View>
                )) : (
                  <View style={styles.emptyBox}>
                    <Pill size={32} color="#CBD5E1" strokeWidth={1.5} />
                    <Text style={styles.emptyBoxText}>No medications recorded</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Analysis Footer */}
            <View style={styles.analysisFooter}>
              <BarChart3 size={16} color="#94A3B8" strokeWidth={2} />
              <Text style={styles.analysisFooterText}>
                Data last updated: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
      <RoleHeader role="Doctor" onLogout={onLogout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },

  // List View Header
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  listHeaderContent: {
    flex: 1,
  },
  listHeaderTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  listHeaderSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  patientCountBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    minWidth: 70,
  },
  patientCountNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0EA5E9',
    marginBottom: 2,
  },
  patientCountLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // List Content
  listContent: {
    padding: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#475569',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 6,
  },

  // List Section
  listSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Patient Card (List)
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 18,
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
  patientAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  patientInfo: {
    flex: 1,
  },
  patientAN: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  patientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  patientCardRight: {
    marginLeft: 12,
  },
  chevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Detail Header
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeaderContent: {
    flex: 1,
  },
  detailHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  detailHeaderSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },

  // Detail Content
  detailContent: {
    padding: 20,
    paddingBottom: 40,
  },
  detailLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  detailLoadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },

  // Overview Card
  overviewCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  overviewAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  overviewInfo: {
    flex: 1,
  },
  overviewAN: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  overviewStatus: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E2E8F0',
  },

  // Section
  section: {
    marginBottom: 20,
  },

  // AI Card
  aiCard: {
    backgroundColor: '#FEFCFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: '#E9D5FF',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  aiIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  aiHeaderText: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#7C3AED',
    marginBottom: 2,
  },
  aiSubtitle: {
    fontSize: 12,
    color: '#A78BFA',
    fontWeight: '600',
  },
  aiSpinner: {
    marginLeft: 8,
  },
  aiLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5F3FF',
    padding: 16,
    borderRadius: 12,
  },
  aiLoadingText: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '600',
    flex: 1,
  },
  aiBriefingContent: {
    paddingVertical: 4,
  },
  aiBriefingText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#6B21A8',
    fontWeight: '500',
  },
  aiFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EDE9FE',
  },
  aiFooterText: {
    fontSize: 11,
    color: '#A78BFA',
    fontWeight: '600',
  },

  // Section Header Box
  sectionHeaderBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sectionIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  sectionSubtext: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  flaggedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  flaggedBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  countCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countCircleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7C3AED',
  },

  // Data Card
  dataCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dataItemLast: {
    borderBottomWidth: 0,
  },
  dataItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dataItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dataItemInfo: {
    flex: 1,
  },
  dataItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  dataItemMeta: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  dataItemRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  dataItemValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 4,
  },
  dataItemValueFlagged: {
    color: '#EF4444',
  },
  flagTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  flagTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },

  // Medication Item
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  medicationItemLast: {
    borderBottomWidth: 0,
  },
  medicationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  medicationIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  activeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyBoxText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 12,
  },

  // Analysis Footer
  analysisFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  analysisFooterText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
});

export default DoctorDashboardScreen;