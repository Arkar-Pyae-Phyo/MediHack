// C:\Users\Admin\Desktop\medihack\MediHack\screens\Nurse\NurseDashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { Search, AlertCircle, Clock, LogOut, TrendingUp, Activity, Users, CheckCircle2, Zap } from 'lucide-react-native';
import { getPatientList } from '../../services/patientService';
import { useNavigation } from '@react-navigation/native';

const NurseDashboardScreen = ({ onLogout }: { onLogout: () => void }) => {
  const navigation = useNavigation<any>();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Urgent' | 'Pending' | 'Done'>('All');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const list = await getPatientList();
    
    // Mock สถานะงานของแต่ละเตียง
    const mockData = list.map((an, i) => ({
      an,
      bed: `${(i + 1).toString().padStart(2, '0')}`,
      status: i % 3 === 0 ? 'Urgent' : i % 2 === 0 ? 'Pending' : 'Done', 
      task: i % 3 === 0 ? 'High BP Alert' : i % 2 === 0 ? 'Due for Meds' : 'All Clear',
      time: '10:00 AM'
    }));
    setPatients(mockData);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Urgent') return <View style={styles.urgentDot} />;
    if (status === 'Pending') return <View style={styles.pendingDot} />;
    return <View style={styles.doneDot} />;
  };

  const filteredPatients = patients
    .filter(p => activeFilter === 'All' || p.status === activeFilter)
    .filter(p => p.an.includes(search) || p.bed.includes(search));

  const stats = {
    urgent: patients.filter(p => p.status === 'Urgent').length,
    pending: patients.filter(p => p.status === 'Pending').length,
    done: patients.filter(p => p.status === 'Done').length,
    total: patients.length
  };

  const renderCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('NursePatientConsole', { an: item.an })}
      activeOpacity={0.7}
    >
      <View style={styles.cardLeft}>
        <View style={styles.bedCircle}>
          <Text style={styles.bedNumber}>{item.bed}</Text>
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.taskRow}>
            {getStatusIcon(item.status)}
            <Text style={styles.taskText}>{item.task}</Text>
          </View>
          <Text style={styles.anText}>AN {item.an}</Text>
        </View>
      </View>
      <View style={styles.timeContainer}>
        <Clock size={14} color="#94A3B8" />
        <Text style={styles.timeText}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  );

  const FilterTab = ({ label, count, isActive, onPress }: any) => (
    <TouchableOpacity 
      style={[styles.filterTab, isActive && styles.filterTabActive]} 
      onPress={onPress}
    >
      <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{label}</Text>
      <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
        <Text style={[styles.countText, isActive && styles.countTextActive]}>{count}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header - เหมือน Console */}
      <View style={styles.header}>
        <View style={{flex: 1}}>
          <Text style={styles.title}>Patient Queue</Text>
          <Text style={styles.subtitle}>Ward 7 • Internal Medicine</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <LogOut size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.statUrgent]}>
          <AlertCircle size={24} color="#EF4444" strokeWidth={2.5} style={{marginBottom: 8}} />
          <Text style={styles.statNumber}>{stats.urgent}</Text>
          <Text style={styles.statLabel}>Urgent</Text>
        </View>
        <View style={[styles.statCard, styles.statPending]}>
          <Clock size={24} color="#F59E0B" strokeWidth={2.5} style={{marginBottom: 8}} />
          <Text style={styles.statNumber}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, styles.statDone]}>
          <CheckCircle2 size={24} color="#10B981" strokeWidth={2.5} style={{marginBottom: 8}} />
          <Text style={styles.statNumber}>{stats.done}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#94A3B8" strokeWidth={2} />
          <TextInput 
            style={styles.input} 
            placeholder="Search bed or AN..." 
            placeholderTextColor="#CBD5E1"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FilterTab label="All" count={stats.total} isActive={activeFilter === 'All'} onPress={() => setActiveFilter('All')} />
        <FilterTab label="Urgent" count={stats.urgent} isActive={activeFilter === 'Urgent'} onPress={() => setActiveFilter('Urgent')} />
        <FilterTab label="Pending" count={stats.pending} isActive={activeFilter === 'Pending'} onPress={() => setActiveFilter('Pending')} />
        <FilterTab label="Done" count={stats.done} isActive={activeFilter === 'Done'} onPress={() => setActiveFilter('Done')} />
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color="#0D9488" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={filteredPatients}
          renderItem={renderCard}
          keyExtractor={item => item.an}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D9488']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Users size={48} color="#CBD5E1" strokeWidth={1.5} />
              <Text style={styles.emptyText}>No patients found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  // Header - เหมือน Console
  header: { 
    backgroundColor: '#0D9488',
    padding: 20, 
    paddingTop: 60, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  subtitle: { color: '#CCFBF1', marginTop: 4, fontSize: 14, fontWeight: '600' },
  logoutBtn: { 
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)', 
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats Cards - สวยขึ้น มี shadow
  statsContainer: { 
    flexDirection: 'row', 
    padding: 16, 
    gap: 12,
  },
  statCard: { 
    flex: 1, 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statUrgent: { 
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  statPending: { 
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  statDone: { 
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  statNumber: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  statLabel: { 
    fontSize: 11, 
    color: '#64748B', 
    fontWeight: '700', 
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Search - ปรับให้เข้ากับ Console
  searchContainer: { paddingHorizontal: 16, marginBottom: 16 },
  searchBox: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    padding: 14, 
    borderRadius: 14, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  input: { flex: 1, marginLeft: 10, fontSize: 15, color: '#0F172A', fontWeight: '500' },

  // Filter Tabs - สวยกว่าเดิม
  filterContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 16, 
    gap: 10, 
    marginBottom: 12,
  },
  filterTab: { 
    flex: 1, 
    flexDirection: 'row',
    backgroundColor: '#FFF', 
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12, 
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  filterTabActive: { 
    backgroundColor: '#0D9488',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  filterTextActive: { color: '#FFF' },
  countBadge: { 
    backgroundColor: '#F1F5F9', 
    paddingHorizontal: 7, 
    paddingVertical: 3, 
    borderRadius: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  countText: { fontSize: 11, fontWeight: '800', color: '#475569' },
  countTextActive: { color: '#FFF' },

  // Patient Cards - เหมือน Console style
  listContent: { padding: 16, paddingTop: 8 },
  card: { 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    padding: 18, 
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  bedCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  bedNumber: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  cardInfo: { flex: 1 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  taskText: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  anText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  timeContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeText: { fontSize: 12, color: '#64748B', fontWeight: '700' },

  // Status Dots - ใหญ่และสวยขึ้น
  urgentDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  },
  pendingDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  },
  doneDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  },

  // Empty State
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 15, color: '#94A3B8', fontWeight: '600', marginTop: 12 }
});

export default NurseDashboardScreen;