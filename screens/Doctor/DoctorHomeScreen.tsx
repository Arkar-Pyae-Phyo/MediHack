import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { Bell, Activity, Users, ClipboardList, LogOut, AlertTriangle, CheckSquare, Clock, TrendingUp, Calendar, FileText, Pill, Stethoscope } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getPatientList } from '../../services/patientService';

const DoctorHomeScreen = ({ onLogout }: { onLogout: () => void }) => {
  const [patientCount, setPatientCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const fetchStats = async () => {
    setLoading(true);
    try {
      const list = await getPatientList();
      setPatientCount(list.length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* --- Enhanced Header with Gradient --- */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good Morning</Text>
            <Text style={styles.doctorName}>Dr. Somchai</Text>
            <Text style={styles.department}>Internal Medicine</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.notificationBtn}>
              <Bell size={20} color="#FFF" />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
              <LogOut size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Time Info */}
        <View style={styles.timeCard}>
          <Clock size={14} color="#0EA5E9" strokeWidth={2} />
          <Text style={styles.timeText}>Monday, Feb 15, 2026 • 09:24 AM</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={fetchStats} 
            tintColor="#0EA5E9" 
          />
        }
      >
        {/* --- Enhanced Stats Grid --- */}
        <View style={styles.statsSection}>
          <View style={styles.mainStatCard}>
            <View style={styles.mainStatHeader}>
              <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
                <Users size={24} color="#0EA5E9" strokeWidth={2} />
              </View>
              <View style={styles.trendBadge}>
                <TrendingUp size={12} color="#10B981" />
                <Text style={styles.trendText}>+2</Text>
              </View>
            </View>
            <Text style={styles.mainStatValue}>{patientCount}</Text>
            <Text style={styles.mainStatLabel}>Total Inpatients</Text>
            <Text style={styles.mainStatSubtext}>Under your care</Text>
          </View>

          <View style={styles.miniStatsRow}>
            <View style={styles.miniStatCard}>
              <View style={[styles.miniIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Activity size={18} color="#EF4444" strokeWidth={2} />
              </View>
              <Text style={[styles.miniStatValue, { color: '#EF4444' }]}>2</Text>
              <Text style={styles.miniStatLabel}>Critical</Text>
            </View>

            <View style={styles.miniStatCard}>
              <View style={[styles.miniIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <ClipboardList size={18} color="#F59E0B" strokeWidth={2} />
              </View>
              <Text style={[styles.miniStatValue, { color: '#F59E0B' }]}>5</Text>
              <Text style={styles.miniStatLabel}>Pending Labs</Text>
            </View>

            <View style={styles.miniStatCard}>
              <View style={[styles.miniIconCircle, { backgroundColor: '#D1FAE5' }]}>
                <CheckSquare size={18} color="#10B981" strokeWidth={2} />
              </View>
              <Text style={[styles.miniStatValue, { color: '#10B981' }]}>8</Text>
              <Text style={styles.miniStatLabel}>Completed</Text>
            </View>
          </View>
        </View>

        {/* --- Critical Alert --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <AlertTriangle size={18} color="#EF4444" strokeWidth={2.5} />
              <Text style={styles.sectionTitle}>Critical Alerts</Text>
            </View>
            <Text style={styles.sectionCount}>1</Text>
          </View>
          
          <View style={styles.alertCard}>
            <View style={styles.alertIndicator} />
            <View style={styles.alertContent}>
              <View style={styles.alertTop}>
                <View style={styles.alertTitleRow}>
                  <Text style={styles.alertTitle}>Hypotension Alert</Text>
                  <View style={styles.urgentBadge}>
                    <Text style={styles.urgentText}>URGENT</Text>
                  </View>
                </View>
                <Text style={styles.alertTime}>10 min ago</Text>
              </View>
              <Text style={styles.alertPatient}>AN: 660001 • Bed 102 • Somsri Thongdee</Text>
              <Text style={styles.alertVitals}>BP: 85/50 mmHg ↓ | HR: 110 bpm ↑</Text>
              <Text style={styles.alertMessage}>Significant BP drop detected. Nurse requested immediate physician review.</Text>
              
              <View style={styles.alertActions}>
                <TouchableOpacity style={styles.primaryAction}>
                  <Stethoscope size={16} color="#FFF" />
                  <Text style={styles.primaryActionText}>Review Now</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryAction}>
                  <Text style={styles.secondaryActionText}>Acknowledge</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* --- Quick Actions --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionDot} />
              <Text style={[styles.sectionTitle, { color: '#0F172A' }]}>Quick Actions</Text>
            </View>
          </View>

          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionCard}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
                <FileText size={22} color="#0EA5E9" strokeWidth={2} />
              </View>
              <Text style={styles.quickActionText}>Patient List</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#FCE7F3' }]}>
                <Pill size={22} color="#EC4899" strokeWidth={2} />
              </View>
              <Text style={styles.quickActionText}>Prescriptions</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#E0E7FF' }]}>
                <Calendar size={22} color="#6366F1" strokeWidth={2} />
              </View>
              <Text style={styles.quickActionText}>Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#D1FAE5' }]}>
                <ClipboardList size={22} color="#10B981" strokeWidth={2} />
              </View>
              <Text style={styles.quickActionText}>Lab Results</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Today's Tasks --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <CheckSquare size={18} color="#0F172A" strokeWidth={2.5} />
              <Text style={[styles.sectionTitle, { color: '#0F172A' }]}>Today's Tasks</Text>
            </View>
            <Text style={styles.taskProgress}>3 of 8</Text>
          </View>

          {[
            { 
              ward: 4, 
              title: 'Morning Round - Ward 4', 
              desc: 'Review dengue cases & update discharge plans',
              time: '09:30 AM',
              priority: 'high'
            },
            { 
              ward: 5, 
              title: 'Morning Round - Ward 5', 
              desc: 'Check post-op recovery progress',
              time: '11:00 AM',
              priority: 'medium'
            },
            { 
              ward: 6, 
              title: 'Medication Review', 
              desc: 'Follow-up on antibiotic adjustments',
              time: '02:00 PM',
              priority: 'medium'
            }
          ].map((item, index) => (
            <TouchableOpacity key={index} style={styles.taskCard} activeOpacity={0.7}>
              <View style={styles.taskLeft}>
                <View style={styles.taskCheckbox} />
                <View style={styles.taskContent}>
                  <View style={styles.taskHeader}>
                    <Text style={styles.taskTitle}>{item.title}</Text>
                    {item.priority === 'high' && (
                      <View style={styles.priorityBadge}>
                        <Text style={styles.priorityText}>HIGH</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.taskDesc}>{item.desc}</Text>
                  <View style={styles.taskMeta}>
                    <Clock size={12} color="#94A3B8" />
                    <Text style={styles.taskTime}>{item.time}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- Recent Activity --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Activity size={18} color="#0F172A" strokeWidth={2.5} />
              <Text style={[styles.sectionTitle, { color: '#0F172A' }]}>Recent Activity</Text>
            </View>
          </View>

          {[
            { action: 'Lab results reviewed', patient: 'AN: 660015', time: '25 min ago', icon: ClipboardList },
            { action: 'Medication prescribed', patient: 'AN: 660008', time: '1 hr ago', icon: Pill },
            { action: 'Discharge approved', patient: 'AN: 660003', time: '2 hrs ago', icon: CheckSquare },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityIconWrapper}>
                  <Icon size={14} color="#64748B" strokeWidth={2} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityAction}>{item.action}</Text>
                  <Text style={styles.activityPatient}>{item.patient}</Text>
                </View>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            );
          })}
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Header with Gradient
  header: {
    backgroundColor: '#0EA5E9',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 13,
    color: '#BAE6FD',
    fontWeight: '600',
    marginBottom: 2,
  },
  doctorName: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  department: {
    fontSize: 12,
    color: '#E0F2FE',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0EA5E9',
  },
  badgeText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '800',
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  timeText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  // Stats Section
  statsSection: {
    marginBottom: 24,
  },
  mainStatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 12,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  mainStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '700',
  },
  mainStatValue: {
    fontSize: 42,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -2,
    marginBottom: 4,
  },
  mainStatLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 2,
  },
  mainStatSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },

  miniStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  miniStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  miniIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  miniStatValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  miniStatLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Section
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 0.3,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0EA5E9',
  },
  taskProgress: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },

  // Alert Card
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  alertIndicator: {
    width: 5,
    backgroundColor: '#EF4444',
  },
  alertContent: {
    flex: 1,
    padding: 20,
  },
  alertTop: {
    marginBottom: 12,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#DC2626',
    flex: 1,
  },
  urgentBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  alertTime: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  alertPatient: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  alertVitals: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
  },
  alertMessage: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  secondaryActionText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },

  // Task Card
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: '#CBD5E1',
    marginRight: 14,
    marginTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  priorityBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  taskDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskTime: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // Recent Activity
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 2,
  },
  activityPatient: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
  },
});

export default DoctorHomeScreen;